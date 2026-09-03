import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const AUTHOR_SELECT = { id: true, name: true, username: true, avatar_url: true, xp: true } as const;

/** Feed page size cap. */
const MAX_TAKE = 30;

// ── Tags ────────────────────────────────────────────────────────────

const TAG_RE = /#([a-z0-9_]{2,30})/gi;
const MAX_TAGS = 8;

/** Pull #hashtags out of post text (lowercased, deduped) plus auto-tags. */
function extractTags(text: string, extra: string[] = []): string[] {
  const set = new Set<string>();
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1].toLowerCase());
    if (set.size >= MAX_TAGS) break;
  }
  for (const raw of extra) {
    if (set.size >= MAX_TAGS) break;
    const clean = String(raw).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    if (clean.length >= 2) set.add(clean);
  }
  return [...set].slice(0, MAX_TAGS);
}

// ── Interest profile (implicit signals) ─────────────────────────────

const AFFINITY = { post: 5, comment: 4, like: 3, follow: 1 } as const;
const AFFINITY_DAILY_DECAY = 0.95;

/** Fire-and-forget: bump the user's affinity for these tags. */
function bumpAffinity(userId: string, tags: string[], weight: number) {
  if (tags.length === 0) return;
  void (async () => {
    for (const tag of tags) {
      await prisma.tagAffinity.upsert({
        where: { userId_tag: { userId, tag } },
        update: { score: { increment: weight } },
        create: { userId, tag, score: weight },
      });
    }
  })().catch(() => {});
}

/** Read-time decay so interests fade without a cron. */
function decayed(score: number, updatedAt: Date): number {
  const days = Math.max(0, (Date.now() - updatedAt.getTime()) / 86400000);
  return score * Math.pow(AFFINITY_DAILY_DECAY, days);
}

// ── Ranking ("For you") ─────────────────────────────────────────────

const RANK = {
  recency: 2.0,       // e^(-ageHours/halfLife)
  halfLifeHours: 24,
  engagement: 1.5,    // log1p(likes + 2*comments) / log1p(50)
  affinity: 2.5,      // viewer's interest in the post's tags, 0..1
  social: 2.0,        // followed author, mutuals, author popularity
  typeBoost: 0.5,     // achievement shares (scaled by difficulty)
  candidateDays: 14,
  candidateCap: 200,
};

type Candidate = {
  id: string; userId: string; type: string; visibility: string; content: string;
  meta: unknown; createdAt: Date;
  user: { id: string; name: string | null; username: string | null; avatar_url: string | null; xp: number };
  _count: { comments: number; likes: number };
  tags: { tag: string }[];
};

function scorePost(
  p: Candidate,
  viewer: { affinity: Map<string, number>; following: Set<string>; mutuals: Set<string>; followerCounts: Map<string, number> }
): number {
  const ageHours = Math.max(0, (Date.now() - p.createdAt.getTime()) / 3600000);
  const recency = Math.exp(-ageHours / RANK.halfLifeHours);

  const engagement = Math.log1p(p._count.likes + 2 * p._count.comments) / Math.log1p(50);

  let affinitySum = 0;
  for (const { tag } of p.tags) affinitySum += viewer.affinity.get(tag) ?? 0;
  const affinity = Math.min(1, affinitySum / 20);

  const followed = viewer.following.has(p.userId) ? 0.6 : 0;
  const mutual = viewer.mutuals.has(p.userId) ? 0.25 : 0;
  const popularity = Math.min(0.4, Math.log1p(viewer.followerCounts.get(p.userId) ?? 0) / 8);
  const social = followed + mutual + popularity;

  let typeBoost = 0;
  if (p.type === "achievement") {
    const diff = String((p.meta as { difficulty?: string })?.difficulty ?? "").toLowerCase();
    typeBoost = diff === "hard" ? 1 : diff === "medium" ? 0.7 : 0.5;
  }

  return (
    RANK.recency * recency +
    RANK.engagement * engagement +
    RANK.affinity * affinity +
    RANK.social * social +
    RANK.typeBoost * typeBoost
  );
}

/** Feed diversity: never more than 2 consecutive posts by the same author. */
function diversify<T extends { userId: string }>(sorted: T[]): T[] {
  const out: T[] = [];
  const deferred: T[] = [];
  for (const p of sorted) {
    const n = out.length;
    if (n >= 2 && out[n - 1].userId === p.userId && out[n - 2].userId === p.userId) {
      deferred.push(p);
    } else {
      out.push(p);
      // A deferred post can slot in as soon as the author streak is broken
      for (let i = 0; i < deferred.length; i++) {
        const m = out.length;
        if (!(m >= 2 && out[m - 1].userId === deferred[i].userId && out[m - 2].userId === deferred[i].userId)) {
          out.push(deferred.splice(i, 1)[0]);
          break;
        }
      }
    }
  }
  return [...out, ...deferred];
}

// ── Feed ────────────────────────────────────────────────────────────

const POST_INCLUDE = {
  user: { select: AUTHOR_SELECT },
  _count: { select: { comments: true, likes: true } },
  tags: { select: { tag: true } },
} as const;

// GET /api/community/feed?scope=all|following&tag=react&skip=0&take=20
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const scope = req.query.scope === "following" ? "following" : "all";
    const tagFilter = typeof req.query.tag === "string" && req.query.tag.trim() ? req.query.tag.trim().toLowerCase() : null;
    const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0);
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(String(req.query.take ?? "20"), 10) || 20));

    // Who I follow — for the "following" scope, visibility, and ranking.
    const myFollows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = myFollows.map((f) => f.followingId);

    // A post is visible if it's public, mine, or followers-only from someone I follow.
    const visibleTo = [
      { visibility: "public" },
      { userId },
      { visibility: "followers", userId: { in: followingIds } },
    ];

    const baseAnd: object[] = [{ OR: visibleTo }];
    if (scope === "following") baseAnd.push({ userId: { in: [...followingIds, userId] } });
    if (tagFilter) baseAnd.push({ tags: { some: { tag: tagFilter } } });

    let page: Candidate[];

    if (scope === "following") {
      // Following stays strictly chronological — people expect it.
      page = (await prisma.post.findMany({
        where: { AND: baseAnd },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: POST_INCLUDE,
      })) as unknown as Candidate[];
    } else {
      // "For you": rank recent candidates, then fill with older posts chronologically.
      const since = new Date(Date.now() - RANK.candidateDays * 86400000);
      const candidates = (await prisma.post.findMany({
        where: { AND: [...baseAnd, { createdAt: { gte: since } }] },
        orderBy: { createdAt: "desc" },
        take: RANK.candidateCap,
        include: POST_INCLUDE,
      })) as unknown as Candidate[];

      const authorIds = [...new Set(candidates.map((p) => p.userId))];
      const [affRows, mutualRows, followerGroups] = await Promise.all([
        prisma.tagAffinity.findMany({ where: { userId } }),
        authorIds.length
          ? prisma.follow.findMany({ where: { followerId: { in: authorIds }, followingId: userId }, select: { followerId: true } })
          : Promise.resolve([] as { followerId: string }[]),
        authorIds.length
          ? prisma.follow.groupBy({ by: ["followingId"], where: { followingId: { in: authorIds } }, _count: { _all: true } })
          : Promise.resolve([] as { followingId: string; _count: { _all: number } }[]),
      ]);

      const viewer = {
        affinity: new Map(affRows.map((a) => [a.tag, decayed(a.score, a.updatedAt)])),
        following: new Set(followingIds),
        mutuals: new Set(mutualRows.map((m) => m.followerId)),
        followerCounts: new Map(followerGroups.map((g) => [g.followingId, g._count._all])),
      };

      const ranked = diversify(
        candidates
          .map((p) => ({ p, s: scorePost(p, viewer) }))
          .sort((a, b) => b.s - a.s)
          .map((x) => x.p)
      );

      page = ranked.slice(skip, skip + take);

      // Backfill with older posts (chronological) once the ranked window is exhausted.
      if (page.length < take) {
        const older = (await prisma.post.findMany({
          where: { AND: [...baseAnd, { createdAt: { lt: since } }] },
          orderBy: { createdAt: "desc" },
          skip: Math.max(0, skip - ranked.length),
          take: take - page.length,
          include: POST_INCLUDE,
        })) as unknown as Candidate[];
        page = [...page, ...older];
      }
    }

    const ids = page.map((p) => p.id);
    const myLikes = ids.length
      ? await prisma.postLike.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } })
      : [];
    const liked = new Set(myLikes.map((l) => l.postId));
    const followed = new Set(followingIds);

    res.json(
      page.map((p) => ({
        id: p.id,
        type: p.type,
        visibility: p.visibility,
        content: p.content,
        meta: p.meta,
        tags: p.tags.map((t) => t.tag),
        createdAt: p.createdAt,
        author: p.user,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: liked.has(p.id),
        followingAuthor: followed.has(p.userId),
        mine: p.userId === userId,
      }))
    );
  } catch (err) {
    console.error("GET /api/community/feed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts — a status/story, or an achievement share (meta set)
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { content, meta, visibility } = req.body as { content?: string; meta?: Record<string, unknown>; visibility?: string };
    const vis = visibility && ["public", "followers", "private"].includes(visibility) ? visibility : "public";
    const text = (content ?? "").trim();
    const hasAchievement = meta && typeof meta === "object" && typeof meta.title === "string";
    if (!text && !hasAchievement) {
      res.status(400).json({ error: "Write something first" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "Posts are limited to 2000 characters" });
      return;
    }

    // Status posts may carry a topic tag ("debugging", "shipping", …)
    const topic = meta && typeof meta.topic === "string" && meta.topic.length <= 24 ? meta.topic : null;

    // Auto-tags for achievement shares: kind, difficulty, and the problem's topics
    const autoTags: string[] = [];
    if (hasAchievement) {
      autoTags.push(meta!.kind === "bug" ? "bughunt" : "challenge");
      if (typeof meta!.difficulty === "string") autoTags.push(meta!.difficulty as string);
      if (typeof meta!.slug === "string") {
        try {
          const problem = await prisma.problem.findUnique({ where: { slug: meta!.slug as string }, select: { tags: true } });
          for (const t of ((problem?.tags as string[] | undefined) ?? []).slice(0, 2)) autoTags.push(t);
        } catch { /* tags are a nice-to-have */ }
      }
    }
    if (topic) autoTags.push(topic);
    const tags = extractTags(text, autoTags);

    const post = await prisma.post.create({
      data: {
        userId,
        type: hasAchievement ? "achievement" : "status",
        visibility: vis,
        content: text,
        meta: hasAchievement ? (meta as object) : topic ? { topic } : {},
      },
      include: { user: { select: AUTHOR_SELECT } },
    });
    if (tags.length) {
      await prisma.postTag.createMany({ data: tags.map((tag) => ({ postId: post.id, tag })) });
    }
    bumpAffinity(userId, tags, AFFINITY.post);

    res.json({
      id: post.id,
      type: post.type,
      visibility: post.visibility,
      content: post.content,
      meta: post.meta,
      tags,
      createdAt: post.createdAt,
      author: post.user,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      followingAuthor: false,
      mine: true,
    });
  } catch (err) {
    console.error("POST /api/community/posts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/community/posts/:id — own posts only
router.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own posts" });
      return;
    }
    await prisma.post.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/like — toggle
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      try {
        await prisma.postLike.create({ data: { postId, userId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e; // double-click race: already liked
      }
      // Liking teaches the algorithm what this user cares about
      void prisma.postTag
        .findMany({ where: { postId }, select: { tag: true } })
        .then((rows) => bumpAffinity(userId, rows.map((r) => r.tag), AFFINITY.like))
        .catch(() => {});
    }
    const likeCount = await prisma.postLike.count({ where: { postId } });
    res.json({ liked: !existing, likeCount });
  } catch (err) {
    console.error("POST /api/community/posts/:id/like error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/posts/:id/comments
router.get("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const postId = String(req.params.id);
    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: AUTHOR_SELECT } },
    });
    res.json(
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        mine: c.userId === req.user!.userId,
      }))
    );
  } catch (err) {
    console.error("GET /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/comments
router.post("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const text = String((req.body as { content?: string }).content ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Write a comment first" });
      return;
    }
    if (text.length > 1000) {
      res.status(400).json({ error: "Comments are limited to 1000 characters" });
      return;
    }
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const comment = await prisma.postComment.create({
      data: { postId, userId, content: text },
      include: { user: { select: AUTHOR_SELECT } },
    });

    // Commenting is the strongest engagement signal short of authoring
    void prisma.postTag
      .findMany({ where: { postId }, select: { tag: true } })
      .then((rows) => bumpAffinity(userId, rows.map((r) => r.tag), AFFINITY.comment))
      .catch(() => {});

    // Quiet heads-up for the author (not for self-comments)
    if (post.userId !== userId) {
      void prisma.notification
        .create({
          data: {
            userId: post.userId,
            type: "post_comment",
            title: "New comment on your post",
            body: `${comment.user.username || comment.user.name || "Someone"} commented: “${text.slice(0, 80)}${text.length > 80 ? "…" : ""}”`,
            href: "/community",
          },
        })
        .catch(() => {});
    }

    res.json({ id: comment.id, content: comment.content, createdAt: comment.createdAt, author: comment.user, mine: true });
  } catch (err) {
    console.error("POST /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/follow/:userId — toggle follow
router.post("/follow/:userId", requireAuth, async (req, res) => {
  try {
    const followerId = req.user!.userId;
    const followingId = String(req.params.userId);
    if (followerId === followingId) {
      res.status(400).json({ error: "You can't follow yourself" });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true, username: true } });
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
    } else {
      try {
        await prisma.follow.create({ data: { followerId, followingId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
      }

      // Following someone nudges your profile toward what they post about
      void prisma.postTag
        .findMany({
          where: { post: { userId: followingId } },
          orderBy: { id: "desc" },
          take: 20,
          select: { tag: true },
        })
        .then((rows) => bumpAffinity(followerId, [...new Set(rows.map((r) => r.tag))].slice(0, 5), AFFINITY.follow))
        .catch(() => {});

      const me = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true, name: true } });
      void prisma.notification
        .create({
          data: {
            userId: followingId,
            type: "new_follower",
            title: "You have a new follower",
            body: `${me?.username || me?.name || "Someone"} started following you.`,
            href: "/community",
          },
        })
        .catch(() => {});
    }
    const followers = await prisma.follow.count({ where: { followingId } });
    res.json({ following: !existing, followers });
  } catch (err) {
    console.error("POST /api/community/follow/:userId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/me — my social card (followers/following/posts counts)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.post.count({ where: { userId } }),
    ]);
    res.json({ followers, following, posts });
  } catch (err) {
    console.error("GET /api/community/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/pulse — lightweight activity stats for the sidebar
router.get("/pulse", requireAuth, async (_req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [postsToday, winsThisWeek, activeCoders, totalCoders] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.post.count({ where: { type: "achievement", createdAt: { gte: weekAgo } } }),
      prisma.post.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.user.count(),
    ]);
    res.json({ postsToday, winsThisWeek, activeCoders: activeCoders.length, totalCoders });
  } catch (err) {
    console.error("GET /api/community/pulse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/tags/trending — top tags of the last 7 days
router.get("/tags/trending", requireAuth, async (_req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const groups = await prisma.postTag.groupBy({
      by: ["tag"],
      where: { post: { createdAt: { gte: weekAgo }, visibility: "public" } },
      _count: { _all: true },
      orderBy: { _count: { tag: "desc" } },
      take: 10,
    });
    res.json(groups.map((g) => ({ tag: g.tag, posts: g._count._all })));
  } catch (err) {
    console.error("GET /api/community/tags/trending error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/suggestions — most active users I don't follow yet
router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const exclude = [userId, ...following.map((f) => f.followingId)];
    const users = await prisma.user.findMany({
      where: { id: { notIn: exclude } },
      orderBy: { xp: "desc" },
      take: 5,
      select: { ...AUTHOR_SELECT },
    });
    res.json(users);
  } catch (err) {
    console.error("GET /api/community/suggestions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

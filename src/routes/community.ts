import { Router, type Response } from "express";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { communityWriteLimiter } from "../middleware/rate-limit.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { invalidateUnread } from "../services/notifications.js";
import { invalidateDashboard, querySocialCounts } from "../services/dashboard.js";

const router = Router();

// The chests an author has opened ride on every author: the feed wears
// them as a frame round the avatar and a count beside the rank. Keys only
// — a handful of short rows per author, joined by the same query.
// `rating` is what the rank word beside a name is read from — the same
// number the profile and the dashboard rank by (services/me.ts getTierTitle).
// The feed used to apply the ladder to `xp`, so one account was "Novice" on
// its profile and "Apprentice" on its posts (QA-010). XP stays for the count.
const AUTHOR_SELECT = { id: true, name: true, username: true, avatar_url: true, xp: true, rating: true, roadmapRewards: { select: { tierKey: true } } } as const;

/** Feed page size cap. */
const MAX_TAKE = 30;

// ── Tags ────────────────────────────────────────────────────────────

const TAG_RE = /#([a-z0-9_]{2,30})/gi;
const MAX_TAGS = 8;

/** The tag an achievement share always carries, by what was achieved. */
function achievementTag(kind: unknown): string {
  return kind === "bug" ? "bughunt" : kind === "roadmap" ? "roadmap" : "challenge";
}

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

// ── Mentions ────────────────────────────────────────────────────────

const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;
const MAX_MENTIONS = 5;

/** Usernames mentioned in a body of text (lowercased, deduped, capped). */
function extractMentions(text: string): string[] {
  const set = new Set<string>();
  const re = new RegExp(MENTION_RE.source, MENTION_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1].toLowerCase());
    if (set.size >= MAX_MENTIONS) break;
  }
  return [...set];
}

/**
 * Create a notification unless the same person already has an unread one of
 * this type pointing at the same place. Likes and mentions can repeat on a busy
 * post; the bell should say "someone liked this", not repeat it eleven times.
 *
 * Either branch is a write the unread badge has to hear about — its count is
 * held in-process (see services/notifications) and would otherwise lag.
 */
const notifyInFlight = new Map<string, Promise<void>>();

async function notifyOnce(input: { userId: string; type: string; title: string; body: string; href: string }) {
  // Two likes landing in the same instant both found no row and both wrote
  // one; the second waits for the first and then takes the update branch.
  const key = `${input.userId}:${input.type}:${input.href}`;
  const pending = notifyInFlight.get(key);
  if (pending) await pending.catch(() => undefined);

  const write = async () => {
    const existing = await prisma.notification.findFirst({
      where: { userId: input.userId, type: input.type, href: input.href, isRead: false },
      select: { id: true },
    });
    if (existing) {
      await prisma.notification.update({ where: { id: existing.id }, data: { title: input.title, body: input.body, createdAt: new Date() } });
      invalidateUnread(input.userId);
      return;
    }
    await prisma.notification.create({ data: { ...input } });
    invalidateUnread(input.userId);
  };

  // Registered before it is awaited, and released only if it is still the
  // registered one — a later caller may have replaced it while this ran.
  const job = write();
  notifyInFlight.set(key, job);
  try {
    await job;
  } finally {
    if (notifyInFlight.get(key) === job) notifyInFlight.delete(key);
  }
}

/** The most people one post or comment can notify at once. */
const MENTION_FANOUT = 10;

/** Fire-and-forget @mention notifications for a post or comment body. */
function notifyMentions(fromUserId: string, text: string, href: string, context: string) {
  const names = extractMentions(text);
  if (names.length === 0) return;
  void (async () => {
    const [me, targets] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId }, select: { username: true, name: true } }),
      prisma.user.findMany({ where: { username: { in: names } }, select: { id: true } }),
    ]);
    const who = me?.username || me?.name || "Someone";
    // Each recipient's notification is independent of the others', so they are
    // written together rather than one after another. The mention cap already
    // keeps the fan-out small; the slice is the hard ceiling.
    await Promise.all(
      targets
        .filter((t) => t.id !== fromUserId)
        .slice(0, MENTION_FANOUT)
        .map((t) =>
          notifyOnce({
            userId: t.id,
            type: "mention",
            title: `${who} mentioned you`,
            body: `${who} mentioned you in ${context}: “${text.slice(0, 80)}${text.length > 80 ? "…" : ""}”`,
            href,
          }),
        ),
    );
  })().catch(() => {});
}

/** Canonical link to a post — used by every notification about one. */
const postHref = (postId: string) => `/community/p/${postId}`;

// ── Interest profile (implicit signals) ─────────────────────────────

const AFFINITY = { post: 5, comment: 4, like: 3, follow: 1 } as const;
const AFFINITY_DAILY_DECAY = 0.95;

/**
 * Fire-and-forget: bump the user's affinity for these tags.
 *
 * One statement for every tag rather than an upsert per tag: the unique
 * (userId, tag) key turns the insert into an increment for rows that already
 * exist. Prisma would normally fill `id` and `updatedAt`; raw SQL has to
 * supply both, and the id only needs to be unique, not a cuid.
 */
function bumpAffinity(userId: string, tags: string[], weight: number) {
  if (tags.length === 0) return;
  const rows = tags.map((tag) => Prisma.sql`(${randomUUID()}, ${userId}, ${tag}, ${weight}, NOW(3))`);
  void prisma
    .$executeRaw(Prisma.sql`
      INSERT INTO \`TagAffinity\` (\`id\`, \`userId\`, \`tag\`, \`score\`, \`updatedAt\`)
      VALUES ${Prisma.join(rows)}
      ON DUPLICATE KEY UPDATE \`score\` = \`score\` + VALUES(\`score\`), \`updatedAt\` = NOW(3)
    `)
    .catch(() => {});
}

/** Read-time decay so interests fade without a cron. */
function decayed(score: number, updatedAt: Date): number {
  const days = Math.max(0, (Date.now() - updatedAt.getTime()) / 86400000);
  return score * Math.pow(AFFINITY_DAILY_DECAY, days);
}

// ── Who the viewer follows ──────────────────────────────────────────

/**
 * The viewer's following list, memoised in-process for 30 s.
 *
 * Read by the feed, the suggestions rail and the composed rails endpoint —
 * usually within the same page load — and one indexed query is still a ~500ms
 * round trip. Memory only: this is exactly the cheap, hot, per-instance value
 * the in-process tier is for. The follow toggle drops it.
 */
const followsKey = (userId: string) => `follows:v1:${userId}`;

function followingIdsOf(userId: string): Promise<string[]> {
  return cached(followsKey(userId), 30_000, async () => {
    const rows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    return rows.map((f) => f.followingId);
  });
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
  meta: unknown; createdAt: Date; editedAt?: Date | null; resolvedCommentId?: string | null;
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

/**
 * A post is visible if it's public, mine, or followers-only from someone I
 * follow. A visitor (no session — the feed, a post and its thread are
 * readable without one) sees public posts only.
 */
function visibleTo(userId: string | null, followingIds: string[]) {
  if (userId === null) return { visibility: "public" };
  return {
    OR: [
      { visibility: "public" },
      { userId },
      { visibility: "followers", userId: { in: followingIds } },
    ],
  };
}

/**
 * The "For you" candidate window — every public post of the last fortnight, up
 * to the cap — is the same rows for every viewer, and it was the feed's single
 * heaviest read: two hundred posts with author, counts and tags, per request.
 * It now comes from the shared tier for 30 s. Only the posts a viewer alone
 * can see (their own, and followers-only ones from people they follow) are
 * asked for live, and those are few.
 *
 * Keyed by tag as well, since a tag filter narrows the window.
 */
const publicCandidatesKey = (tag: string | null) =>
  tag ? `feed:candidates:public:v1:tag:${tag}` : "feed:candidates:public:v1";

/** A row that crossed Redis carries its dates as strings; the ranking calls getTime() on them. */
function reviveDates(p: Candidate): Candidate {
  return { ...p, createdAt: new Date(p.createdAt), editedAt: p.editedAt ? new Date(p.editedAt) : p.editedAt ?? null };
}

async function publicCandidates(tag: string | null): Promise<Candidate[]> {
  const rows = await cachedShared(publicCandidatesKey(tag), 30, async () => {
    const since = new Date(Date.now() - RANK.candidateDays * 86400000);
    return (await prisma.post.findMany({
      where: { visibility: "public", createdAt: { gte: since }, ...(tag ? { tags: { some: { tag } } } : {}) },
      orderBy: { createdAt: "desc" },
      take: RANK.candidateCap,
      include: POST_INCLUDE,
    })) as unknown as Candidate[];
  });
  return rows.map(reviveDates);
}

/**
 * The viewer's own slice of the window: their non-public posts, and
 * followers-only posts by people they follow. Expressed through the relation
 * so it needs nothing loaded first and can share a tier with everything else.
 */
const privateCandidatesKey = (userId: string, tag: string | null) =>
  `feed:private:v1:${userId}:${tag ?? "all"}`;

/**
 * The viewer's own posts and the followers-only ones they may see.
 *
 * `publicCandidates` next door is cached for 30s; this half was not, so every
 * "For you" load ran a `take: 200` with the full post include — author row,
 * reward rows, tag rows — for what is, for almost every account, a handful of
 * posts. Same window as the public half so the two sides of the feed are
 * never mixed across a boundary, and L1 rather than Redis because a per-user
 * key is not worth a ~300ms round trip to fetch.
 */
function privateCandidates(userId: string, tag: string | null): Promise<Candidate[]> {
  return cached(privateCandidatesKey(userId, tag), 30_000, () => queryPrivateCandidates(userId, tag));
}

function queryPrivateCandidates(userId: string, tag: string | null): Promise<Candidate[]> {
  const since = new Date(Date.now() - RANK.candidateDays * 86400000);
  return prisma.post.findMany({
    where: {
      AND: [
        { createdAt: { gte: since } },
        { visibility: { not: "public" } },
        { OR: [{ userId }, { visibility: "followers", user: { followers: { some: { followerId: userId } } } }] },
        ...(tag ? [{ tags: { some: { tag } } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: RANK.candidateCap,
    include: POST_INCLUDE,
  }) as unknown as Promise<Candidate[]>;
}

/** Poll options as authored, defensively normalised. */
function pollOptions(meta: unknown): string[] {
  const raw = (meta as { poll?: { options?: unknown } } | null)?.poll?.options;
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => String(o)).filter((o) => o.trim().length > 0).slice(0, 4);
}

/**
 * Turn a page of posts into the feed payload: one batched query per viewer-
 * specific fact (likes, saves, poll votes) rather than per post. A visitor
 * (userId null) has none of those facts, so only the poll tallies are read.
 */
async function decoratePosts(userId: string | null, page: Candidate[], followingIds: Set<string>) {
  const ids = page.map((p) => p.id);
  const pollIds = page.filter((p) => pollOptions(p.meta).length > 0).map((p) => p.id);

  const [myLikes, mySaves, voteGroups, myVotes] = await Promise.all([
    ids.length && userId ? prisma.postLike.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }) : [],
    ids.length && userId ? prisma.savedPost.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }) : [],
    pollIds.length
      ? prisma.pollVote.groupBy({ by: ["postId", "option"], where: { postId: { in: pollIds } }, _count: { _all: true } })
      : [],
    pollIds.length && userId
      ? prisma.pollVote.findMany({ where: { userId, postId: { in: pollIds } }, select: { postId: true, option: true } })
      : [],
  ]);

  const liked = new Set(myLikes.map((l) => l.postId));
  const saved = new Set(mySaves.map((s) => s.postId));
  const myVoteBy = new Map(myVotes.map((v) => [v.postId, v.option]));
  const countsBy = new Map<string, Map<number, number>>();
  for (const g of voteGroups) {
    const m = countsBy.get(g.postId) ?? new Map<number, number>();
    m.set(g.option, g._count._all);
    countsBy.set(g.postId, m);
  }

  return page.map((p) => {
    const options = pollOptions(p.meta);
    const counts = countsBy.get(p.id);
    const poll = options.length
      ? {
          options: options.map((text, i) => ({ text, votes: counts?.get(i) ?? 0 })),
          totalVotes: options.reduce((sum, _o, i) => sum + (counts?.get(i) ?? 0), 0),
          myVote: myVoteBy.get(p.id) ?? null,
        }
      : null;

    return {
      id: p.id,
      type: p.type,
      visibility: p.visibility,
      content: p.content,
      meta: p.meta,
      tags: p.tags.map((t) => t.tag),
      createdAt: p.createdAt,
      editedAt: p.editedAt ?? null,
      resolvedCommentId: p.resolvedCommentId ?? null,
      author: p.user,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      likedByMe: liked.has(p.id),
      savedByMe: saved.has(p.id),
      poll,
      followingAuthor: followingIds.has(p.userId),
      mine: userId !== null && p.userId === userId,
    };
  });
}

// GET /api/community/feed?scope=all|following&tag=react&skip=0&take=20
//
// Readable without a session (the community page is public — see the
// frontend's lib/seo/routes): a visitor gets "For you" over the public
// window with none of the viewer signals, and the scopes that are about
// them — Following, Saved — ask for an account.
router.get("/feed", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? null;
    const rawScope = String(req.query.scope ?? "all");
    const scope = rawScope === "following" || rawScope === "saved" ? rawScope : "all";
    if (scope !== "all" && !userId) {
      res.status(401).json({ error: "Sign in to see this feed." });
      return;
    }
    const tagFilter = typeof req.query.tag === "string" && req.query.tag.trim() ? req.query.tag.trim().toLowerCase() : null;
    const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0);
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(String(req.query.take ?? "20"), 10) || 20));

    const baseAndFor = (followingIds: string[]) => {
      const baseAnd: object[] = [visibleTo(userId, followingIds)];
      if (scope === "following") baseAnd.push({ userId: { in: [...followingIds, userId as string] } });
      if (scope === "saved") baseAnd.push({ saves: { some: { userId: userId as string } } });
      if (tagFilter) baseAnd.push({ tags: { some: { tag: tagFilter } } });
      return baseAnd;
    };

    let page: Candidate[];
    let followingIds: string[];

    if (userId === null) {
      // A visitor: the shared public window, ranked on the post alone —
      // recency, engagement, the win boost — and backfilled the same way.
      followingIds = [];
      const candidates = (await publicCandidates(tagFilter)).slice(0, RANK.candidateCap);
      const viewer = { affinity: new Map<string, number>(), following: new Set<string>(), mutuals: new Set<string>(), followerCounts: new Map<string, number>() };
      const ranked = diversify(
        candidates
          .map((p) => ({ p, s: scorePost(p, viewer) }))
          .sort((a, b) => b.s - a.s)
          .map((x) => x.p)
      );
      page = ranked.slice(skip, skip + take);
      if (page.length < take) {
        const since = new Date(Date.now() - RANK.candidateDays * 86400000);
        const older = (await prisma.post.findMany({
          where: { AND: [...baseAndFor(followingIds), { createdAt: { lt: since } }] },
          orderBy: { createdAt: "desc" },
          skip: Math.max(0, skip - ranked.length),
          take: take - page.length,
          include: POST_INCLUDE,
        })) as unknown as Candidate[];
        page = [...page, ...older];
      }
    } else if (scope === "following" || scope === "saved") {
      // Following and saved stay strictly chronological — people expect it.
      followingIds = await followingIdsOf(userId as string);
      page = (await prisma.post.findMany({
        where: { AND: baseAndFor(followingIds) },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: POST_INCLUDE,
      })) as unknown as Candidate[];
    } else {
      // "For you": rank recent candidates, then fill with older posts chronologically.
      // Everything the ranking needs that does not depend on the candidates
      // themselves — who I follow, the shared window, my private slice of it,
      // my tag affinities — is one tier, where it used to be three.
      const [follows, shared, mine, affRows] = await Promise.all([
        followingIdsOf(userId as string),
        publicCandidates(tagFilter),
        privateCandidates(userId as string, tagFilter),
        prisma.tagAffinity.findMany({ where: { userId: userId as string } }),
      ]);
      followingIds = follows;

      // The two halves are disjoint (public against everything else), so the
      // union is a merge by recency, cut to the cap the single query applied.
      const candidates = [...shared, ...mine]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, RANK.candidateCap);

      const authorIds = [...new Set(candidates.map((p) => p.userId))];
      const [mutualRows, followerGroups] = await Promise.all([
        authorIds.length
          ? prisma.follow.findMany({ where: { followerId: { in: authorIds }, followingId: userId as string }, select: { followerId: true } })
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
        const since = new Date(Date.now() - RANK.candidateDays * 86400000);
        const older = (await prisma.post.findMany({
          where: { AND: [...baseAndFor(followingIds), { createdAt: { lt: since } }] },
          orderBy: { createdAt: "desc" },
          skip: Math.max(0, skip - ranked.length),
          take: take - page.length,
          include: POST_INCLUDE,
        })) as unknown as Candidate[];
        page = [...page, ...older];
      }
    }

    res.json(await decoratePosts(userId, page, new Set(followingIds)));
  } catch (err) {
    console.error("GET /api/community/feed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts — a status/story, or an achievement share (meta set)
router.post("/posts", requireAuth, communityWriteLimiter, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { content, meta, visibility, type: rawType } = req.body as {
      content?: unknown; meta?: Record<string, unknown>; visibility?: string; type?: string;
    };
    const vis = visibility && ["public", "followers", "private"].includes(visibility) ? visibility : "public";
    // A number or an array as `content` used to reach `.trim()` and 500; it
    // is not a post, so it falls into "write something first" like an empty one.
    const text = typeof content === "string" ? content.trim() : "";
    const hasAchievement = meta && typeof meta === "object" && typeof meta.title === "string";

    // Poll options travel in meta.poll.options; a poll with fewer than two
    // choices is just a post, so it is rejected rather than silently demoted.
    const rawPoll = (meta as { poll?: { options?: unknown } } | undefined)?.poll?.options;
    const pollChoices = Array.isArray(rawPoll)
      ? rawPoll.map((o) => String(o).trim().slice(0, 60)).filter(Boolean).slice(0, 4)
      : [];
    const wantsPoll = rawType === "poll" || pollChoices.length > 0;
    const wantsQuestion = rawType === "question";

    if (!text && !hasAchievement) {
      res.status(400).json({ error: "Write something first" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "Posts are limited to 2000 characters" });
      return;
    }

    // An achievement is a claim about the judge's records, and the card the
    // feed draws — title, difficulty, XP — is built from what the client sent.
    // It used to be stored as given: anyone could post "Solved <hard problem>
    // +30 XP" with no submission behind it. Now the solve is looked up and
    // the card's facts are taken from the row, not the request.
    let verifiedAchievement: Record<string, unknown> | null = null;
    if (hasAchievement) {
      const kind = meta!.kind === "bug" ? "bug" : meta!.kind === "roadmap" ? "roadmap" : "problem";
      if (kind === "roadmap") {
        // A tier's chest: the claim is the RoadmapReward row the road wrote
        // when the tier was cleared, and the card's facts — the tier's name,
        // what the chest paid — come from it and the seeded tier, not the
        // request. Nothing to link the card to but the road itself.
        const tierKey = typeof meta!.tier === "string" ? meta!.tier : "";
        const [reward, tier] = tierKey
          ? await Promise.all([
              prisma.roadmapReward.findUnique({ where: { userId_tierKey: { userId, tierKey } }, select: { xp: true } }),
              prisma.roadmapTier.findUnique({ where: { key: tierKey }, select: { title: true } }),
            ])
          : [null, null];
        if (!reward || !tier) {
          res.status(400).json({ error: "You can only share a chest you have opened" });
          return;
        }
        verifiedAchievement = { kind, tier: tierKey, title: tier.title, xp: reward.xp };
      } else if (kind === "bug") {
        const challengeId = typeof meta!.challengeId === "string" ? meta!.challengeId : "";
        const solved = challengeId
          ? await prisma.bugSubmission.findFirst({
              where: { userId, challengeId, verdict: "ACCEPTED" },
              select: { challenge: { select: { title: true, difficulty: true } } },
            })
          : null;
        if (!solved) {
          res.status(400).json({ error: "You can only share a hunt you have fixed" });
          return;
        }
        verifiedAchievement = { kind, challengeId, title: solved.challenge.title, difficulty: solved.challenge.difficulty };
      } else {
        const slug = typeof meta!.slug === "string" ? meta!.slug : "";
        const solved = slug
          ? await prisma.submission.findFirst({
              where: { userId, verdict: "ACCEPTED", problem: { slug } },
              select: { problem: { select: { title: true, difficulty: true } } },
            })
          : null;
        if (!solved) {
          res.status(400).json({ error: "You can only share a problem you have solved" });
          return;
        }
        verifiedAchievement = { kind, slug, title: solved.problem.title, difficulty: solved.problem.difficulty };
      }
      // XP is display only, and bounded so the card cannot boast a number the
      // catalogue never pays. A chest's XP is already the row's, not the
      // request's.
      if (kind !== "roadmap") {
        const xp = Number(meta!.xp);
        if (Number.isFinite(xp) && xp > 0 && xp <= 100) verifiedAchievement.xp = Math.round(xp);
      }
    }
    if (wantsPoll && pollChoices.length < 2) {
      res.status(400).json({ error: "A poll needs at least two options" });
      return;
    }

    // Status posts may carry a topic tag ("debugging", "shipping", …)
    const topic = meta && typeof meta.topic === "string" && meta.topic.length <= 24 ? meta.topic : null;

    // What a question is pinned to, if anything: a problem slug or a bug id.
    const rawAsk = (meta as { ask?: Record<string, unknown> } | undefined)?.ask;
    const ask = wantsQuestion && rawAsk && typeof rawAsk === "object"
      ? {
          kind: rawAsk.kind === "bug" ? "bug" : "problem",
          slug: typeof rawAsk.slug === "string" ? rawAsk.slug : undefined,
          challengeId: typeof rawAsk.challengeId === "string" ? rawAsk.challengeId : undefined,
          title: typeof rawAsk.title === "string" ? rawAsk.title.slice(0, 160) : undefined,
        }
      : null;

    const type = hasAchievement ? "achievement" : wantsPoll ? "poll" : wantsQuestion ? "question" : "status";

    // Auto-tags for achievement shares: kind, difficulty, and the problem's topics
    const autoTags: string[] = [];
    if (verifiedAchievement) {
      autoTags.push(achievementTag(verifiedAchievement.kind));
      if (typeof verifiedAchievement.difficulty === "string") autoTags.push(verifiedAchievement.difficulty);
      if (typeof meta!.slug === "string") {
        try {
          const problem = await prisma.problem.findUnique({ where: { slug: meta!.slug as string }, select: { tags: true } });
          for (const t of ((problem?.tags as string[] | undefined) ?? []).slice(0, 2)) autoTags.push(t);
        } catch { /* tags are a nice-to-have */ }
      }
    }
    if (type === "question") autoTags.push("help");
    if (type === "poll") autoTags.push("poll");
    if (topic) autoTags.push(topic);
    const tags = extractTags(text, autoTags);

    const postMeta: Record<string, unknown> = verifiedAchievement ? { ...verifiedAchievement } : {};
    if (topic) postMeta.topic = topic;
    if (type === "poll") postMeta.poll = { options: pollChoices };
    if (ask) postMeta.ask = ask;

    const post = await prisma.post.create({
      data: { userId, type, visibility: vis, content: text, meta: postMeta as object },
      include: { user: { select: AUTHOR_SELECT } },
    });
    if (tags.length) {
      await prisma.postTag.createMany({ data: tags.map((tag) => ({ postId: post.id, tag })) });
    }
    bumpAffinity(userId, tags, AFFINITY.post);
    notifyMentions(userId, text, postHref(post.id), "a post");
    // The dashboard hero counts posts.
    invalidateDashboard(userId);
    forgetPostCounters(userId);

    res.json({
      id: post.id,
      type: post.type,
      visibility: post.visibility,
      content: post.content,
      meta: post.meta,
      tags,
      createdAt: post.createdAt,
      editedAt: null,
      resolvedCommentId: null,
      author: post.user,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      savedByMe: false,
      poll: type === "poll" ? { options: pollChoices.map((text) => ({ text, votes: 0 })), totalVotes: 0, myVote: null } : null,
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
    invalidateDashboard(userId);
    forgetPostCounters(userId);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/community/posts/:id — edit your own post's text
router.patch("/posts/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const text = String((req.body as { content?: string }).content ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "A post can't be emptied — delete it instead" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "Posts are limited to 2000 characters" });
      return;
    }
    const post = await prisma.post.findUnique({ where: { id }, select: { userId: true, type: true, meta: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId !== userId) {
      res.status(403).json({ error: "You can only edit your own posts" });
      return;
    }

    // Re-derive tags from the new text, keeping the automatic ones the post
    // was created with (topic, achievement kind) so an edit can't strip them.
    const meta = (post.meta ?? {}) as Record<string, unknown>;
    const keep: string[] = [];
    if (typeof meta.topic === "string") keep.push(meta.topic);
    if (post.type === "achievement") keep.push(achievementTag(meta.kind));
    if (post.type === "question") keep.push("help");
    if (post.type === "poll") keep.push("poll");
    const tags = extractTags(text, keep);

    // One logical edit, so one batched request rather than three serial ones.
    // It is also the correctness fix: between the delete and the create the
    // post briefly had no tags at all, and a feed read landing in that window
    // saw it untagged.
    const editedAt = new Date();
    await prisma.$transaction([
      prisma.post.update({ where: { id }, data: { content: text, editedAt }, select: { id: true } }),
      prisma.postTag.deleteMany({ where: { postId: id } }),
      ...(tags.length ? [prisma.postTag.createMany({ data: tags.map((tag) => ({ postId: id, tag })) })] : []),
    ]);
    // Both values are the ones just written; re-reading the Text column to
    // learn what we sent is a round trip for nothing.
    const updated = { content: text, editedAt };
    notifyMentions(userId, text, postHref(id), "a post");

    res.json({ content: updated.content, editedAt: updated.editedAt, tags });
  } catch (err) {
    console.error("PATCH /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/posts/:id — one post, for its permalink page. Readable
// without a session when the post is public, so a shared link lands on the
// post; anything else is refused the same way it is in the feed.
router.get("/posts/:id", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? null;
    const id = String(req.params.id);
    const post = (await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE })) as unknown as Candidate | null;
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    // One lookup serves both the visibility gate and the card's follow state;
    // it used to be asked twice in a row.
    const following = userId
      ? await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: post.userId } },
          select: { id: true },
        })
      : null;
    // Same visibility rules the feed applies, enforced for the direct link too.
    if (post.visibility !== "public" && post.userId !== userId && !(post.visibility === "followers" && following)) {
      res.status(403).json({ error: "This post isn't shared with you" });
      return;
    }
    const [payload] = await decoratePosts(userId, [post], new Set(following ? [post.userId] : []));
    res.json(payload);
  } catch (err) {
    console.error("GET /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Whether a viewer may interact with a post, by the feed's own visibility
 * rules. The permalink enforced them; the like, save, vote, report and
 * comment routes did not, so anyone holding a private post's id could read
 * its thread and write into it. `null` when the post does not exist, so a
 * like on a just-deleted post is a 404 rather than the foreign-key 500 it
 * used to be.
 */
/**
 * What the gate reads, which is also everything its callers went on to ask
 * for afterwards. The gate used to answer a bare yes/no and throw the row
 * away, so /report, /vote and both comment routes each re-read the very row
 * it had just fetched — a whole round trip apiece to learn a column the gate
 * had already had in its hand.
 */
const GATE_SELECT = {
  id: true,
  userId: true,
  visibility: true,
  meta: true,
  type: true,
  resolvedCommentId: true,
} as const;

type GatedPost = {
  id: string;
  userId: string;
  visibility: string;
  meta: unknown;
  type: string;
  resolvedCommentId: string | null;
};

/**
 * The two refusals every interaction route shares, and the post itself.
 *
 * Returns null once it has answered, so callers stay `if (!post) return;`.
 */
async function gatePost(res: Response, postId: string, userId: string | null): Promise<GatedPost | null> {
  const post = (await prisma.post.findUnique({ where: { id: postId }, select: GATE_SELECT })) as GatedPost | null;
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return null;
  }
  if (post.visibility === "public" || post.userId === userId) return post;
  if (post.visibility === "followers" && userId !== null) {
    const following = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: post.userId } },
      select: { id: true },
    });
    if (following) return post;
  }
  res.status(403).json({ error: "This post isn't shared with you" });
  return null;
}

// POST /api/community/posts/:id/save — toggle bookmark (private to the saver)
router.post("/posts/:id/save", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    // Delete first: an unsave is then one statement, and a save is the insert
    // that follows when nothing was there to delete.
    const removed = await prisma.savedPost.deleteMany({ where: { postId, userId } });
    if (removed.count === 0) {
      try {
        await prisma.savedPost.create({ data: { postId, userId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e; // double-click race
      }
    }
    res.json({ saved: removed.count === 0 });
  } catch (err) {
    console.error("POST /api/community/posts/:id/save error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/vote — cast or change a poll vote
router.post("/posts/:id/vote", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    const option = Number((req.body as { option?: unknown }).option);
    // The poll, the viewer's existing vote and the current tallies are
    // independent reads, so they share a tier; the tallies after the vote are
    // then arithmetic on what was just read rather than a third round trip.
    // `post` came back from the gate; only the viewer's vote and the tally
    // still need asking for.
    const post = gated;
    const [mine, groups] = await Promise.all([
      prisma.pollVote.findUnique({ where: { postId_userId: { postId, userId } }, select: { option: true } }),
      prisma.pollVote.groupBy({ by: ["option"], where: { postId }, _count: { _all: true } }),
    ]);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const options = pollOptions(post.meta);
    if (!options.length) {
      res.status(400).json({ error: "That post isn't a poll" });
      return;
    }
    if (!Number.isInteger(option) || option < 0 || option >= options.length) {
      res.status(400).json({ error: "Pick one of the options" });
      return;
    }
    await prisma.pollVote.upsert({
      where: { postId_userId: { postId, userId } },
      update: { option },
      create: { postId, userId, option },
    });
    const counts = new Map(groups.map((g) => [g.option, g._count._all]));
    // A changed vote moves one off the old option; a new or changed vote adds one.
    if (mine && mine.option !== option) counts.set(mine.option, Math.max(0, (counts.get(mine.option) ?? 0) - 1));
    if (!mine || mine.option !== option) counts.set(option, (counts.get(option) ?? 0) + 1);
    res.json({
      options: options.map((text, i) => ({ text, votes: counts.get(i) ?? 0 })),
      totalVotes: [...counts.values()].reduce((sum, n) => sum + n, 0),
      myVote: option,
    });
  } catch (err) {
    console.error("POST /api/community/posts/:id/vote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/report — flag a post for review
router.post("/posts/:id/report", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    const reason = String((req.body as { reason?: string }).reason ?? "other").slice(0, 60);
    const post = gated;
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId === userId) {
      res.status(400).json({ error: "You can't report your own post" });
      return;
    }
    try {
      await prisma.postReport.create({ data: { postId, userId, reason } });
    } catch (e: any) {
      if (e?.code !== "P2002") throw e; // already reported by this user
    }
    res.json({ reported: true });
  } catch (err) {
    console.error("POST /api/community/posts/:id/report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/resolve — the asker accepts an answer
router.post("/posts/:id/resolve", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const { commentId } = req.body as { commentId?: string | null };
    // The post and the comment are both addressed by the request alone, so
    // they are one wave rather than two — the comment read used to queue
    // behind an ownership check it does not depend on.
    const [post, comment] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId }, select: { userId: true } }),
      commentId
        ? prisma.postComment.findUnique({ where: { id: String(commentId) }, select: { postId: true, userId: true } })
        : Promise.resolve(null),
    ]);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId !== userId) {
      res.status(403).json({ error: "Only the person who asked can accept an answer" });
      return;
    }
    if (commentId) {
      if (!comment || comment.postId !== postId) {
        res.status(400).json({ error: "That answer isn't on this question" });
        return;
      }
      if (comment.userId !== userId) {
        // The name lookup exists only to word a notification nobody waits
        // for, so it belongs inside the fire-and-forget rather than in front
        // of the write that answers the request.
        const answerer = comment.userId;
        void (async () => {
          const me = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, name: true } });
          await notifyOnce({
            userId: answerer,
            type: "answer_accepted",
            title: "Your answer was accepted",
            body: `${me?.username || me?.name || "Someone"} marked your answer as the one that helped.`,
            href: postHref(postId),
          });
        })().catch(() => {});
      }
    }
    await prisma.post.update({ where: { id: postId }, data: { resolvedCommentId: commentId ? String(commentId) : null } });
    res.json({ resolvedCommentId: commentId ?? null });
  } catch (err) {
    console.error("POST /api/community/posts/:id/resolve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/like — toggle
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    // The pre-read and the current count are independent, so they travel
    // together; the count after the toggle is then arithmetic rather than a
    // third round trip.
    const [existing, likeCount] = await Promise.all([
      prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } }, select: { id: true } }),
      prisma.postLike.count({ where: { postId } }),
    ]);
    if (existing) {
      // deleteMany: a like that vanished between the read and now is a no-op, not an error.
      await prisma.postLike.deleteMany({ where: { id: existing.id } });
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

      // One rolling "respect" notification per post, refreshed rather than
      // repeated — ten likes should not mean ten rows in the bell. The count
      // read above predates this like, so it is already "everyone else".
      const others = likeCount;
      void (async () => {
        const [post, me] = await Promise.all([
          prisma.post.findUnique({ where: { id: postId }, select: { userId: true } }),
          prisma.user.findUnique({ where: { id: userId }, select: { username: true, name: true } }),
        ]);
        if (!post || post.userId === userId) return;
        const who = me?.username || me?.name || "Someone";
        await notifyOnce({
          userId: post.userId,
          type: "post_like",
          title: "Your post earned respect",
          body: others > 0 ? `${who} and ${others} other${others === 1 ? "" : "s"} respected your post.` : `${who} respected your post.`,
          href: postHref(postId),
        });
      })().catch(() => {});
    }
    res.json({ liked: !existing, likeCount: existing ? Math.max(0, likeCount - 1) : likeCount + 1 });
  } catch (err) {
    console.error("POST /api/community/posts/:id/like error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/posts/:id/comments
router.get("/posts/:id/comments", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? null;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    // The accepted-answer id rode along with the gate, so the thread is the
    // only thing still to fetch.
    const post = gated;
    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { user: { select: AUTHOR_SELECT }, _count: { select: { likes: true } } },
    });
    const ids = comments.map((c) => c.id);
    const myLikes = ids.length && userId
      ? await prisma.postCommentLike.findMany({ where: { userId, commentId: { in: ids } }, select: { commentId: true } })
      : [];
    const liked = new Set(myLikes.map((l) => l.commentId));
    res.json(
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        parentId: c.parentId ?? null,
        likeCount: c._count.likes,
        likedByMe: liked.has(c.id),
        accepted: post?.resolvedCommentId === c.id,
        mine: userId !== null && c.userId === userId,
      }))
    );
  } catch (err) {
    console.error("GET /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/comments
router.post("/posts/:id/comments", requireAuth, communityWriteLimiter, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const gated = await gatePost(res, postId, userId);
    if (!gated) return;
    const text = String((req.body as { content?: string }).content ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Write a comment first" });
      return;
    }
    if (text.length > 1000) {
      res.status(400).json({ error: "Comments are limited to 1000 characters" });
      return;
    }
    const post = gated;
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    // Threads are one level deep: replying to a reply attaches to its parent,
    // so the UI never has to render an ever-narrowing staircase.
    const rawParent = (req.body as { parentId?: string }).parentId;
    let parentId: string | null = null;
    let parentAuthorId: string | null = null;
    if (rawParent) {
      const parent = await prisma.postComment.findUnique({
        where: { id: String(rawParent) },
        select: { id: true, postId: true, parentId: true, userId: true },
      });
      // A parent that is gone (deleted while the reply was typed) or on
      // another post is refused rather than silently filed as a top-level
      // comment on this one — the writer meant a reply (QA-029).
      if (!parent || parent.postId !== postId) {
        res.status(404).json({ error: "That comment is no longer here." });
        return;
      }
      parentId = parent.parentId ?? parent.id;
      parentAuthorId = parent.userId;
    }

    const comment = await prisma.postComment.create({
      data: { postId, userId, content: text, parentId },
      include: { user: { select: AUTHOR_SELECT } },
    });

    // Commenting is the strongest engagement signal short of authoring
    void prisma.postTag
      .findMany({ where: { postId }, select: { tag: true } })
      .then((rows) => bumpAffinity(userId, rows.map((r) => r.tag), AFFINITY.comment))
      .catch(() => {});

    const who = comment.user.username || comment.user.name || "Someone";
    const excerpt = `${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`;

    // Quiet heads-up for the author (not for self-comments)
    if (post.userId !== userId) {
      void notifyOnce({
        userId: post.userId,
        type: "post_comment",
        title: "New comment on your post",
        body: `${who} commented: “${excerpt}”`,
        href: postHref(postId),
      }).catch(() => {});
    }
    // …and for the person being replied to, when that's someone else again
    if (parentAuthorId && parentAuthorId !== userId && parentAuthorId !== post.userId) {
      void notifyOnce({
        userId: parentAuthorId,
        type: "comment_reply",
        title: `${who} replied to you`,
        body: `“${excerpt}”`,
        href: postHref(postId),
      }).catch(() => {});
    }
    notifyMentions(userId, text, postHref(postId), "a comment");

    res.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.user,
      parentId,
      likeCount: 0,
      likedByMe: false,
      accepted: false,
      mine: true,
    });
  } catch (err) {
    console.error("POST /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/comments/:id/like — toggle
router.post("/comments/:id/like", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const commentId = String(req.params.id);
    // Same shape as a post like: read and count together, then one write.
    const [existing, likeCount] = await Promise.all([
      prisma.postCommentLike.findUnique({ where: { commentId_userId: { commentId, userId } }, select: { id: true } }),
      prisma.postCommentLike.count({ where: { commentId } }),
    ]);
    if (existing) {
      await prisma.postCommentLike.deleteMany({ where: { id: existing.id } });
    } else {
      try {
        await prisma.postCommentLike.create({ data: { commentId, userId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
      }
    }
    res.json({ liked: !existing, likeCount: existing ? Math.max(0, likeCount - 1) : likeCount + 1 });
  } catch (err) {
    console.error("POST /api/community/comments/:id/like error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/community/comments/:id — your own comment, or one on your post
router.delete("/comments/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const comment = await prisma.postComment.findUnique({
      where: { id },
      select: { userId: true, postId: true, post: { select: { userId: true } } },
    });
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    if (comment.userId !== userId && comment.post.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own comments" });
      return;
    }
    // Replies would otherwise hang off a parent that no longer exists. The
    // two writes touch different tables and neither reads the other, so they
    // go in one batched request instead of two serial ones — and the thread
    // can no longer be left pointing at an accepted answer that is gone.
    await prisma.$transaction([
      prisma.postComment.deleteMany({ where: { OR: [{ id }, { parentId: id }] } }),
      prisma.post.updateMany({ where: { id: comment.postId, resolvedCommentId: id }, data: { resolvedCommentId: null } }),
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/community/comments/:id error:", err);
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
    // Does the target exist, do I already follow them, and how many do — three
    // independent reads in one tier, then a single write. The follower count
    // after the toggle is arithmetic on the one just read.
    const [target, existing, followers] = await Promise.all([
      prisma.user.findUnique({ where: { id: followingId }, select: { id: true, username: true } }),
      prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } }, select: { id: true } }),
      prisma.follow.count({ where: { followingId } }),
    ]);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (existing) {
      await prisma.follow.deleteMany({ where: { id: existing.id } });
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

      // The bell on the other side. Off the response path; the unread badge is
      // told, or it would keep serving the old count.
      void (async () => {
        const me = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true, name: true } });
        await prisma.notification.create({
          data: {
            userId: followingId,
            type: "new_follower",
            title: "You have a new follower",
            body: `${me?.username || me?.name || "Someone"} started following you.`,
            href: "/community",
          },
        });
        invalidateUnread(followingId);
      })().catch(() => {});
    }

    // A follow moves both users' hero counts, and this viewer's cached
    // following list — which the feed and the suggestions rail read.
    invalidate(followsKey(followerId));
    invalidate(suggestionsKey(followerId));
    invalidate(socialKey(followerId));
    invalidate(socialKey(followingId));
    invalidateDashboard(followerId);
    invalidateDashboard(followingId);

    res.json({ following: !existing, followers: existing ? Math.max(0, followers - 1) : followers + 1 });
  } catch (err) {
    console.error("POST /api/community/follow/:userId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── The sidebar rails ───────────────────────────────────────────────
//
// Each rail keeps its own endpoint, and GET /rails composes all five in one
// round trip for the page that shows them together. The bodies live in these
// functions so the two paths cannot drift: a rail's JSON is the function's
// return value, whichever route served it.

/** My social card: followers/following/posts counts — one statement, three sub-selects. */
const socialKey = (userId: string) => `social:v1:${userId}`;

/**
 * Followers, following and post count for the sidebar card.
 *
 * One raw statement with three subqueries, but it ran on every `/me` and
 * every `/rails` — and `/rails` is the sidebar of every community page. The
 * numbers move only when this viewer posts, or when somebody follows them,
 * and both of those already drop keys here. L1 rather than Redis on purpose:
 * this Redis is ~300ms away, which is what the query itself costs.
 */
const socialCardFor = (userId: string) => cached(socialKey(userId), 60_000, () => querySocialCounts(userId));

/**
 * The rails that count posts. Their caches are shared and expire on their
 * own, but a person who has just posted sees "0 posts today" beside their
 * new post until they do (QA-031); the two writes drop them.
 */
function forgetPostCounters(authorId?: string): void {
  // The author's own two per-viewer caches move with their post count: the
  // sidebar card, and the private half of their feed (a post they just wrote
  // is a candidate in it).
  if (authorId) {
    invalidate(socialKey(authorId));
    invalidate(privateCandidatesKey(authorId, null));
  }
  invalidate("community:pulse");
  invalidate("community:bulletin");
}

/** Lightweight activity stats for the sidebar. */
function getPulse() {
  // Global counters, identical for every viewer — four queries that were
  // recomputed per request. 60s keeps "posts today" feeling live enough.
  return cachedShared("community:pulse", 60, async () => {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [postsToday, winsThisWeek, activeCoders, totalCoders] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.post.count({ where: { type: "achievement", createdAt: { gte: weekAgo } } }),
      // One row per author, grouped by the database, rather than a DISTINCT
      // that still walks the week's posts to produce them.
      prisma.post.groupBy({ by: ["userId"], where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count(),
    ]);
    return { postsToday, winsThisWeek, activeCoders: activeCoders.length, totalCoders };
  });
}

/** Top tags of the last 7 days, with a per-day sparkline each. */
function getTrending() {
  // A groupBy over a week of public posts, same answer for everyone.
  // Trending lists don't need to move faster than every five minutes.
  return cachedShared("community:trending", 300, async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const groups = await prisma.postTag.groupBy({
      by: ["tag"],
      where: { post: { createdAt: { gte: weekAgo }, visibility: "public" } },
      _count: { _all: true },
      orderBy: { _count: { tag: "desc" } },
      take: 10,
    });
    const top = groups.map((g) => g.tag);
    if (top.length === 0) return [];

    // One pass over the week's rows for the sparklines, bucketed by day here
    // rather than seven grouped queries per tag.
    const rows = await prisma.postTag.findMany({
      where: { tag: { in: top }, post: { createdAt: { gte: weekAgo }, visibility: "public" } },
      select: { tag: true, post: { select: { createdAt: true } } },
    });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const series = new Map(top.map((t) => [t, Array(7).fill(0) as number[]]));
    for (const r of rows) {
      const dayIndex = 6 - Math.floor((startOfToday.getTime() - new Date(r.post.createdAt).setHours(0, 0, 0, 0)) / 86400000);
      if (dayIndex >= 0 && dayIndex < 7) series.get(r.tag)![dayIndex] += 1;
    }
    return groups.map((g) => ({ tag: g.tag, posts: g._count._all, series: series.get(g.tag) ?? Array(7).fill(0) }));
  });
}

/** Most active users I don't follow yet, ranked by why they're worth following. */
const suggestionsKey = (userId: string) => `suggestions:v1:${userId}`;

/**
 * Who to follow, for one viewer.
 *
 * This is two tiers of queries — a 40-row pool ranked by mutuals, institute
 * and post count — and it ran in full on every `GET /suggestions` *and*
 * every `GET /rails`, which is the sidebar on every community page. The
 * route's own note conceded it was the wall clock of the rails.
 *
 * Nothing it reads moves quickly: the pool is the top of the XP table minus
 * people already followed, and a suggestion that is a minute stale is still
 * a good suggestion. Following someone is the one action that should change
 * the list at once, and that already drops this key alongside the cached
 * following list.
 */
function suggestionsFor(userId: string) {
  return cached(suggestionsKey(userId), 60_000, () => querySuggestions(userId));
}

async function querySuggestions(userId: string) {
  // The pool leaves out people already followed through the relation itself,
  // so it does not have to wait for the following list to be loaded first —
  // the three reads here are one tier, where they used to be three.
  const [followingIds, me, pool] = await Promise.all([
    followingIdsOf(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { instituteName: true } }),
    // A wider pool than we show, then ranked by *why* they're worth following.
    prisma.user.findMany({
      where: { id: { not: userId }, followers: { none: { followerId: userId } } },
      orderBy: { xp: "desc" },
      take: 40,
      select: { ...AUTHOR_SELECT, instituteName: true },
    }),
  ]);
  const poolIds = pool.map((u) => u.id);

  const [mutualRows, followerGroups, postGroups] = await Promise.all([
    // People I follow who follow them: the "2 mutuals" line
    followingIds.length && poolIds.length
      ? prisma.follow.findMany({
          where: { followerId: { in: followingIds }, followingId: { in: poolIds } },
          select: { followingId: true },
        })
      : Promise.resolve([] as { followingId: string }[]),
    poolIds.length
      ? prisma.follow.groupBy({ by: ["followingId"], where: { followingId: { in: poolIds } }, _count: { _all: true } })
      : Promise.resolve([] as { followingId: string; _count: { _all: number } }[]),
    poolIds.length
      ? prisma.post.groupBy({ by: ["userId"], where: { userId: { in: poolIds } }, _count: { _all: true } })
      : Promise.resolve([] as { userId: string; _count: { _all: number } }[]),
  ]);

  const mutuals = new Map<string, number>();
  for (const m of mutualRows) mutuals.set(m.followingId, (mutuals.get(m.followingId) ?? 0) + 1);
  const followers = new Map(followerGroups.map((g) => [g.followingId, g._count._all]));
  const posts = new Map(postGroups.map((g) => [g.userId, g._count._all]));

  return pool
    .map((u) => {
      const mutual = mutuals.get(u.id) ?? 0;
      const sameInstitute = !!me?.instituteName && u.instituteName === me.instituteName;
      const postCount = posts.get(u.id) ?? 0;
      const score =
        mutual * 3 +
        (sameInstitute ? 2.5 : 0) +
        Math.min(2, Math.log1p(postCount)) +
        Math.min(1.5, Math.log1p(u.xp) / 4);
      const reason = mutual
        ? `${mutual} mutual${mutual === 1 ? "" : "s"}`
        : sameInstitute
          ? u.instituteName!
          : postCount > 0
            ? `${postCount} post${postCount === 1 ? "" : "s"}`
            : "New here";
      return {
        id: u.id, name: u.name, username: u.username, avatar_url: u.avatar_url, xp: u.xp,
        reason, mutuals: mutual, followers: followers.get(u.id) ?? 0, posts: postCount,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...rest }) => rest);
}

/** The platform's week in one card, plus today's hunts. */
function getBulletin() {
  // Every viewer sees the same digest, and it only has to be as fresh as the
  // window it describes — five minutes is plenty for a weekly summary.
  return cachedShared("community:bulletin", 300, async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // A "solve" is a problem (or hunt) someone accepted for the FIRST time —
    // the same definition as "solved" on the profile and the trends
    // (services/me.ts getUserTrends). Counting accepted submissions instead
    // made "Coder of the week" a matter of re-submitting one solved problem
    // fifteen times (QA-050). One grouped statement per arena carries each
    // (user, target) pair with its earliest accept; the week's and today's
    // tallies are reduced from that in memory.
    type FirstProblemSolve = { userId: string; problemId: string; _min: { submittedAt: Date | null } };
    type FirstBugSolve = { userId: string; challengeId: string; _min: { submittedAt: Date | null } };

    const [firstBugSolves, firstProblemSolves, postsThisWeek, newWarriors] = (await Promise.all([
      prisma.bugSubmission.groupBy({
        by: ["userId", "challengeId"],
        where: { verdict: "ACCEPTED" },
        _min: { submittedAt: true },
        having: { submittedAt: { _min: { gte: weekAgo } } },
      }),
      prisma.submission.groupBy({
        by: ["userId", "problemId"],
        where: { verdict: "ACCEPTED" },
        _min: { submittedAt: true },
        having: { submittedAt: { _min: { gte: weekAgo } } },
      }),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    ])) as [FirstBugSolve[], FirstProblemSolve[], number, number];

    const tally = (rows: Array<{ key: string }>): Map<string, number> => {
      const counts = new Map<string, number>();
      for (const r of rows) counts.set(r.key, (counts.get(r.key) ?? 0) + 1);
      return counts;
    };
    const top3 = (counts: Map<string, number>) => [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const bugGroups = top3(tally(firstBugSolves.map((r) => ({ key: r.challengeId })))).map(([challengeId, n]) => ({ challengeId, _count: { _all: n } }));
    const problemGroups = top3(tally(firstProblemSolves.map((r) => ({ key: r.problemId })))).map(([problemId, n]) => ({ problemId, _count: { _all: n } }));
    const bugWarriors = [...tally(firstBugSolves.map((r) => ({ key: r.userId }))).entries()].map(([userId, n]) => ({ userId, _count: { _all: n } }));
    const problemWarriors = [...tally(firstProblemSolves.map((r) => ({ key: r.userId }))).entries()].map(([userId, n]) => ({ userId, _count: { _all: n } }));
    const todayBugs = top3(
      tally(firstBugSolves.filter((r) => r._min.submittedAt !== null && r._min.submittedAt >= startOfToday).map((r) => ({ key: r.challengeId }))),
    ).map(([challengeId, n]) => ({ challengeId, _count: { _all: n } }));

    // Titles for everything referenced above, in two lookups.
    const challengeIds = [...new Set([...bugGroups, ...todayBugs].map((g) => g.challengeId))];
    const [challenges, problems] = await Promise.all([
      challengeIds.length
        ? prisma.bugChallenge.findMany({ where: { id: { in: challengeIds } }, select: { id: true, title: true, difficulty: true } })
        : Promise.resolve([] as { id: string; title: string; difficulty: string }[]),
      problemGroups.length
        ? prisma.problem.findMany({
            where: { id: { in: problemGroups.map((g) => g.problemId) } },
            select: { id: true, title: true, slug: true, difficulty: true },
          })
        : Promise.resolve([] as { id: string; title: string; slug: string; difficulty: string }[]),
    ]);
    const challengeById = new Map(challenges.map((c) => [c.id, c]));
    const problemById = new Map(problems.map((p) => [p.id, p]));

    // Most solves this week across both arenas
    const byWarrior = new Map<string, number>();
    for (const g of [...bugWarriors, ...problemWarriors]) {
      byWarrior.set(g.userId, (byWarrior.get(g.userId) ?? 0) + g._count._all);
    }
    const [topWarriorId, topWarriorSolves] = [...byWarrior.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
    const topWarrior = topWarriorId
      ? await prisma.user.findUnique({ where: { id: topWarriorId }, select: AUTHOR_SELECT })
      : null;

    const solvesThisWeek =
      bugWarriors.reduce((n, g) => n + g._count._all, 0) + problemWarriors.reduce((n, g) => n + g._count._all, 0);

    return {
      hunts: bugGroups
        .map((g) => {
          const c = challengeById.get(g.challengeId);
          return c ? { id: c.id, title: c.title, difficulty: c.difficulty, solves: g._count._all } : null;
        })
        .filter(Boolean),
      problems: problemGroups
        .map((g) => {
          const p = problemById.get(g.problemId);
          return p ? { slug: p.slug, title: p.title, difficulty: p.difficulty, solves: g._count._all } : null;
        })
        .filter(Boolean),
      today: todayBugs
        .map((g) => {
          const c = challengeById.get(g.challengeId);
          return c ? { id: c.id, title: c.title, difficulty: c.difficulty, solves: g._count._all } : null;
        })
        .filter(Boolean),
      topWarrior: topWarrior ? { ...topWarrior, solves: topWarriorSolves } : null,
      solvesThisWeek,
      postsThisWeek,
      newWarriors,
    };
  });
}

// GET /api/community/me — my social card (followers/following/posts counts)
router.get("/me", requireAuth, async (req, res) => {
  try {
    res.json(await socialCardFor(req.user!.userId));
  } catch (err) {
    console.error("GET /api/community/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/pulse — lightweight activity stats for the sidebar
router.get("/pulse", optionalAuth, async (_req, res) => {
  try {
    res.json(await getPulse());
  } catch (err) {
    console.error("GET /api/community/pulse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/tags/trending — top tags of the last 7 days
router.get("/tags/trending", optionalAuth, async (_req, res) => {
  try {
    res.json(await getTrending());
  } catch (err) {
    console.error("GET /api/community/tags/trending error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/suggestions — most active users I don't follow yet
router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    res.json(await suggestionsFor(req.user!.userId));
  } catch (err) {
    console.error("GET /api/community/suggestions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/bulletin — the platform's week in one card, plus today's hunts
router.get("/bulletin", optionalAuth, async (_req, res) => {
  try {
    res.json(await getBulletin());
  } catch (err) {
    console.error("GET /api/community/bulletin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/rails — every sidebar rail in one round trip. A
// visitor gets the shared three (pulse, trending, bulletin) and nothing
// personal — no social card, nobody to suggest.
router.get("/rails", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const [pulse, trending, bulletin] = await Promise.all([getPulse(), getTrending(), getBulletin()]);
      res.json({ me: null, suggestions: [], pulse, trending, bulletin });
      return;
    }
    // Each value is exactly what its own endpoint returns for this caller; the
    // page used to make five requests for them and now makes one. Three of the
    // five are shared-cache hits in the usual case, so the wall clock is the
    // slower of the two per-user rails.
    const [me, suggestions, pulse, trending, bulletin] = await Promise.all([
      socialCardFor(userId),
      suggestionsFor(userId),
      getPulse(),
      getTrending(),
      getBulletin(),
    ]);
    res.json({ me, suggestions, pulse, trending, bulletin });
  } catch (err) {
    console.error("GET /api/community/rails error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

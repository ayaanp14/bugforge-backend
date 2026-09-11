import { Router, type Response } from "express";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { invalidateUnread } from "../services/notifications.js";
import { invalidateDashboard, querySocialCounts } from "../services/dashboard.js";

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

/** A post is visible if it's public, mine, or followers-only from someone I follow. */
function visibleTo(userId: string, followingIds: string[]) {
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
function privateCandidates(userId: string, tag: string | null): Promise<Candidate[]> {
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
 * specific fact (likes, saves, poll votes) rather than per post.
 */
async function decoratePosts(userId: string, page: Candidate[], followingIds: Set<string>) {
  const ids = page.map((p) => p.id);
  const pollIds = page.filter((p) => pollOptions(p.meta).length > 0).map((p) => p.id);

  const [myLikes, mySaves, voteGroups, myVotes] = await Promise.all([
    ids.length ? prisma.postLike.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }) : [],
    ids.length ? prisma.savedPost.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }) : [],
    pollIds.length
      ? prisma.pollVote.groupBy({ by: ["postId", "option"], where: { postId: { in: pollIds } }, _count: { _all: true } })
      : [],
    pollIds.length
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
      mine: p.userId === userId,
    };
  });
}

// GET /api/community/feed?scope=all|following&tag=react&skip=0&take=20
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const rawScope = String(req.query.scope ?? "all");
    const scope = rawScope === "following" || rawScope === "saved" ? rawScope : "all";
    const tagFilter = typeof req.query.tag === "string" && req.query.tag.trim() ? req.query.tag.trim().toLowerCase() : null;
    const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0);
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(String(req.query.take ?? "20"), 10) || 20));

    const baseAndFor = (followingIds: string[]) => {
      const baseAnd: object[] = [visibleTo(userId, followingIds)];
      if (scope === "following") baseAnd.push({ userId: { in: [...followingIds, userId] } });
      if (scope === "saved") baseAnd.push({ saves: { some: { userId } } });
      if (tagFilter) baseAnd.push({ tags: { some: { tag: tagFilter } } });
      return baseAnd;
    };

    let page: Candidate[];
    let followingIds: string[];

    if (scope === "following" || scope === "saved") {
      // Following and saved stay strictly chronological — people expect it.
      followingIds = await followingIdsOf(userId);
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
        followingIdsOf(userId),
        publicCandidates(tagFilter),
        privateCandidates(userId, tagFilter),
        prisma.tagAffinity.findMany({ where: { userId } }),
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
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { content, meta, visibility, type: rawType } = req.body as {
      content?: string; meta?: Record<string, unknown>; visibility?: string; type?: string;
    };
    const vis = visibility && ["public", "followers", "private"].includes(visibility) ? visibility : "public";
    const text = (content ?? "").trim();
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
    // It used to be stored as given: anyone could post "Solved <hard kata>
    // +30 XP" with no submission behind it. Now the solve is looked up and
    // the card's facts are taken from the row, not the request.
    let verifiedAchievement: Record<string, unknown> | null = null;
    if (hasAchievement) {
      const kind = meta!.kind === "bug" ? "bug" : "problem";
      if (kind === "bug") {
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
      // catalogue never pays.
      const xp = Number(meta!.xp);
      if (Number.isFinite(xp) && xp > 0 && xp <= 100) verifiedAchievement.xp = Math.round(xp);
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
      autoTags.push(verifiedAchievement.kind === "bug" ? "bughunt" : "challenge");
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
    if (post.type === "achievement") keep.push(meta.kind === "bug" ? "bughunt" : "challenge");
    if (post.type === "question") keep.push("help");
    if (post.type === "poll") keep.push("poll");
    const tags = extractTags(text, keep);

    const updated = await prisma.post.update({
      where: { id },
      data: { content: text, editedAt: new Date() },
      select: { content: true, editedAt: true },
    });
    await prisma.postTag.deleteMany({ where: { postId: id } });
    if (tags.length) await prisma.postTag.createMany({ data: tags.map((tag) => ({ postId: id, tag })) });
    notifyMentions(userId, text, postHref(id), "a post");

    res.json({ content: updated.content, editedAt: updated.editedAt, tags });
  } catch (err) {
    console.error("PATCH /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/posts/:id — one post, for its permalink page
router.get("/posts/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const post = (await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE })) as unknown as Candidate | null;
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    // One lookup serves both the visibility gate and the card's follow state;
    // it used to be asked twice in a row.
    const following = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: post.userId } },
      select: { id: true },
    });
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
async function canSeePost(postId: string, userId: string): Promise<boolean | null> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true, visibility: true } });
  if (!post) return null;
  if (post.visibility === "public" || post.userId === userId) return true;
  if (post.visibility !== "followers") return false;
  const following = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: post.userId } },
    select: { id: true },
  });
  return Boolean(following);
}

/** The two refusals every interaction route shares. Returns false after answering. */
async function gatePost(res: Response, postId: string, userId: string): Promise<boolean> {
  const allowed = await canSeePost(postId, userId);
  if (allowed === null) {
    res.status(404).json({ error: "Post not found" });
    return false;
  }
  if (!allowed) {
    res.status(403).json({ error: "This post isn't shared with you" });
    return false;
  }
  return true;
}

// POST /api/community/posts/:id/save — toggle bookmark (private to the saver)
router.post("/posts/:id/save", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    if (!(await gatePost(res, postId, userId))) return;
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
    if (!(await gatePost(res, postId, userId))) return;
    const option = Number((req.body as { option?: unknown }).option);
    // The poll, the viewer's existing vote and the current tallies are
    // independent reads, so they share a tier; the tallies after the vote are
    // then arithmetic on what was just read rather than a third round trip.
    const [post, mine, groups] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId }, select: { meta: true } }),
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
    if (!(await gatePost(res, postId, userId))) return;
    const reason = String((req.body as { reason?: string }).reason ?? "other").slice(0, 60);
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
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
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true, type: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId !== userId) {
      res.status(403).json({ error: "Only the person who asked can accept an answer" });
      return;
    }
    if (commentId) {
      const comment = await prisma.postComment.findUnique({ where: { id: String(commentId) }, select: { postId: true, userId: true } });
      if (!comment || comment.postId !== postId) {
        res.status(400).json({ error: "That answer isn't on this question" });
        return;
      }
      if (comment.userId !== userId) {
        const me = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, name: true } });
        void notifyOnce({
          userId: comment.userId,
          type: "answer_accepted",
          title: "Your answer was accepted",
          body: `${me?.username || me?.name || "Someone"} marked your answer as the one that helped.`,
          href: postHref(postId),
        }).catch(() => {});
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
    if (!(await gatePost(res, postId, userId))) return;
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
router.get("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    if (!(await gatePost(res, postId, userId))) return;
    const [comments, post] = await Promise.all([
      prisma.postComment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { user: { select: AUTHOR_SELECT }, _count: { select: { likes: true } } },
      }),
      prisma.post.findUnique({ where: { id: postId }, select: { resolvedCommentId: true } }),
    ]);
    const ids = comments.map((c) => c.id);
    const myLikes = ids.length
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
        mine: c.userId === userId,
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
    if (!(await gatePost(res, postId, userId))) return;
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
      if (parent && parent.postId === postId) {
        parentId = parent.parentId ?? parent.id;
        parentAuthorId = parent.userId;
      }
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
    // Replies would otherwise hang off a parent that no longer exists.
    await prisma.postComment.deleteMany({ where: { OR: [{ id }, { parentId: id }] } });
    await prisma.post.updateMany({ where: { id: comment.postId, resolvedCommentId: id }, data: { resolvedCommentId: null } });
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
const socialCardFor = (userId: string) => querySocialCounts(userId);

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
async function suggestionsFor(userId: string) {
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

/** The dojo's week in one card, plus today's hunts. */
function getBulletin() {
  // Every viewer sees the same digest, and it only has to be as fresh as the
  // window it describes — five minutes is plenty for a weekly summary.
  return cachedShared("community:bulletin", 300, async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Prisma's groupBy signature widens badly across a seven-way Promise.all;
    // the shapes are simple enough to state once here.
    type ChallengeCount = { challengeId: string; _count: { _all: number } };
    type ProblemCount = { problemId: string; _count: { _all: number } };
    type UserCount = { userId: string; _count: { _all: number } };

    const [bugGroups, problemGroups, bugWarriors, problemWarriors, todayBugs, postsThisWeek, newWarriors] =
      (await Promise.all([
        prisma.bugSubmission.groupBy({
          by: ["challengeId"],
          where: { verdict: "ACCEPTED", submittedAt: { gte: weekAgo } },
          _count: { _all: true },
          orderBy: { _count: { challengeId: "desc" } },
          take: 3,
        }),
        prisma.submission.groupBy({
          by: ["problemId"],
          where: { verdict: "ACCEPTED", submittedAt: { gte: weekAgo } },
          _count: { _all: true },
          orderBy: { _count: { problemId: "desc" } },
          take: 3,
        }),
        prisma.bugSubmission.groupBy({
          by: ["userId"],
          where: { verdict: "ACCEPTED", submittedAt: { gte: weekAgo } },
          _count: { _all: true },
        }),
        prisma.submission.groupBy({
          by: ["userId"],
          where: { verdict: "ACCEPTED", submittedAt: { gte: weekAgo } },
          _count: { _all: true },
        }),
        prisma.bugSubmission.groupBy({
          by: ["challengeId"],
          where: { verdict: "ACCEPTED", submittedAt: { gte: startOfToday } },
          _count: { _all: true },
          orderBy: { _count: { challengeId: "desc" } },
          take: 3,
        }),
        prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      ])) as [ChallengeCount[], ProblemCount[], UserCount[], UserCount[], ChallengeCount[], number, number];

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
router.get("/pulse", requireAuth, async (_req, res) => {
  try {
    res.json(await getPulse());
  } catch (err) {
    console.error("GET /api/community/pulse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/tags/trending — top tags of the last 7 days
router.get("/tags/trending", requireAuth, async (_req, res) => {
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

// GET /api/community/bulletin — the dojo's week in one card, plus today's hunts
router.get("/bulletin", requireAuth, async (_req, res) => {
  try {
    res.json(await getBulletin());
  } catch (err) {
    console.error("GET /api/community/bulletin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/rails — every sidebar rail in one round trip
router.get("/rails", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
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

import { prisma } from "../lib/prisma.js";
import { broadcastSignal, onSignal } from "../lib/cache.js";
import { getDashboard, getSubmissionHistory } from "./dashboard.js";
import { getGitHubCard } from "./github-connection.js";
import { careerSectionFor } from "./career.js";
import type { CareerSection } from "../lib/career.js";

/**
 * Someone's profile as anyone else sees it: /u/<username> on the SPA.
 *
 * Read-only, and built from an allow-list — the columns below and the
 * dashboard slices named in `getPublicProfile`, nothing else. What never
 * leaves: the address, birthday and gender, the reminder switches, the
 * sign-in provider, when the account was last active, the owner's saved
 * interviews, study and pairing history, and the code of any submission —
 * the history rows carry no code and no SQL query, GET /api/me/submissions/:id
 * and GET /api/sql/:slug/submissions serve them to their owner only, so a
 * profile can never become a solutions list.
 *
 * The numbers come from the owner's own dashboard aggregate (cached, and
 * invalidated on every submission), so the two views of an account always
 * agree; the identity is held for a minute at most and dropped by the writes
 * that change it (PATCH /api/me, a social sign-in), so a profile edit still
 * shows at once.
 */

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatar_url: true,
  instituteName: true,
  location: true,
  website: true,
  github: true,
  linkedin: true,
  twitter: true,
  readme: true,
  createdAt: true,
  profileHidden: true,
  // Read to decide what the career section may carry; never sent themselves.
  careerShowSkills: true,
  careerShowReadiness: true,
} as const;

/** Usernames are 3–20 of [a-z0-9_] today; older generated ones are looser, so this only screens out what could never be one. */
const PLAUSIBLE_USERNAME = /^[A-Za-z0-9_.-]{1,40}$/;

function queryUser(handle: string) {
  return prisma.user.findUnique({ where: { username: handle }, select: PUBLIC_USER_SELECT });
}

type PublicUserRow = NonNullable<Awaited<ReturnType<typeof queryUser>>>;

/**
 * The identity row behind each username read lately, for a minute.
 *
 * A profile page is three requests (the profile, its GitHub card, a page of
 * submissions), each of which looked the name up again, and a crawler walking
 * /u/<name> links asks for the same few names over and over. A plain Map
 * rather than lib/cache.ts, for two reasons. Only hits are kept: a name that
 * does not exist is one indexed read to refuse, and keeping misses would let
 * any string in the URL mint an entry in the L1 tier the dashboards live in
 * (and make a just-claimed name 404 for the window). And the expiry is hard:
 * cached()'s stale-while-revalidate serves an expired entry while it
 * refreshes, so a name its owner had just renamed away from would keep
 * answering with their profile. Bounded the cheap way: a full clear at the cap.
 */
const PUBLIC_USER_TTL_MS = 60_000;
const PUBLIC_USER_MAX = 5_000;
const publicUsers = new Map<string, { row: PublicUserRow; until: number }>();

/**
 * Bumped by every drop. A read that was already in flight when an edit
 * landed carries the pre-edit row, and storing it would undo the drop for the
 * full minute — the race lib/cache.ts guards with its load tokens. Drops are
 * rare (a profile save), so one counter for all names is enough.
 */
let generation = 0;

async function findUser(username: string): Promise<PublicUserRow | null> {
  if (!PLAUSIBLE_USERNAME.test(username)) return null;
  const handle = username.toLowerCase();
  const hit = publicUsers.get(handle);
  if (hit && hit.until > Date.now()) return hit.row;
  const startedAt = generation;
  const row = await queryUser(handle);
  if (!row) {
    publicUsers.delete(handle);
    return null;
  }
  if (startedAt === generation) {
    if (publicUsers.size >= PUBLIC_USER_MAX) publicUsers.clear();
    publicUsers.set(handle, { row, until: Date.now() + PUBLIC_USER_TTL_MS });
  }
  return row;
}

const PUBLIC_USER_SIGNAL = "public-user";

/** By account rather than by name, so a rename drops the old name's entry without the caller having to know it. */
function dropPublicUser(userId: string): void {
  generation += 1;
  for (const [handle, entry] of publicUsers) if (entry.row.id === userId) publicUsers.delete(handle);
}

// The sender receives its own signal too; dropping twice is harmless.
onSignal(PUBLIC_USER_SIGNAL, dropPublicUser);

/** After a write to an account's public identity (name, avatar, username, links, readme): here and on every instance. */
export function forgetPublicUser(userId: string): void {
  dropPublicUser(userId);
  broadcastSignal(PUBLIC_USER_SIGNAL, userId);
}

/**
 * The account behind a public read, or null — also for a profile its owner
 * has hidden, to everyone but the owner. The same null as a name nobody
 * holds, so the answer cannot be used to learn that a hidden account exists.
 */
async function visibleUser(username: string, viewerId: string | null): Promise<PublicUserRow | null> {
  const user = await findUser(username);
  if (!user) return null;
  if (user.profileHidden && user.id !== viewerId) return null;
  return user;
}

export async function getPublicProfile(username: string, viewerId: string | null) {
  const user = await visibleUser(username, viewerId);
  if (!user) return null;
  const [dash, career] = await Promise.all([
    getDashboard(user.id),
    // A failed estimate never fails the profile: the section goes without it.
    careerSectionFor(user.id, { skills: user.careerShowSkills, readiness: user.careerShowReadiness }).catch(() => null),
  ]);
  return publicProfileOf(user, dash, viewerId, career);
}

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/**
 * The allow-list itself, pure so public-profile.test.ts can hand it a
 * dashboard full of private fields and check none come out. Every field is
 * named; nothing is spread, so a field added to the dashboard later stays
 * private until someone decides otherwise here.
 */
export function publicProfileOf(
  user: PublicUserRow,
  dash: Pick<Dashboard, "me" | "social" | "difficultyStats" | "heatmap" | "roadmap" | "tournaments" | "submissions" | "credentials">,
  viewerId: string | null,
  /** The career section (lib/career.ts — itself an allow-list, built by the owner's switches). */
  career: CareerSection | null = null,
) {
  const me = dash.me;
  if (!me) return null;

  const isSelf = viewerId === user.id;
  return {
    isSelf,
    // Only its owner ever reads a hidden profile, and only the owner is told
    // whether it is (their banner says so); nobody else's payload has the key.
    ...(isSelf ? { hidden: user.profileHidden } : {}),
    user: {
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      instituteName: user.instituteName,
      location: user.location,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin,
      twitter: user.twitter,
      readme: user.readme,
      createdAt: user.createdAt,
      xp: me.xp,
      rating: me.rating,
      tierTitle: me.tierTitle,
      globalRank: me.globalRank,
      roadmapRewards: me.roadmapRewards,
      // The frame round the avatar; its code is already public (/verify).
      wornCredential: me.wornCredential ?? null,
      stats: me.stats
        ? {
            problemsSolved: me.stats.problemsSolved,
            bugsFixed: me.stats.bugsFixed,
            sqlSolved: me.stats.sqlSolved,
            currentStreak: me.stats.currentStreak,
            longestStreak: me.stats.longestStreak,
          }
        : null,
    },
    social: dash.social,
    difficultyStats: dash.difficultyStats,
    heatmap: dash.heatmap,
    roadmap: dash.roadmap,
    tournaments: dash.tournaments,
    submissions: publicHistoryPage(dash.submissions),
    // Credentials that stand today, each with the code its verify page
    // resolves. Not the score — what a credential certifies is its band —
    // and not which one is worn (the frame says that).
    credentials: (dash.credentials ?? [])
      .filter((c) => c.status === "valid")
      .map((c) => ({ code: c.code, skill: c.skill, level: c.level, name: c.name, testSlug: c.testSlug, band: c.band, issuedAt: c.issuedAt, expiresAt: c.expiresAt })),
    career,
  };
}

export type PublicProfile = NonNullable<ReturnType<typeof publicProfileOf>>;

type HistoryPage = Awaited<ReturnType<typeof getSubmissionHistory>>;

/**
 * A page of history as anyone else sees it, row by named field. The rows are
 * already slim (services/dashboard.ts selects no code and no SQL query), and
 * this is the second lock: a field that reaches a row later — a query, a
 * snippet — stays the owner's until someone names it here.
 */
export function publicHistoryPage(page: HistoryPage): HistoryPage {
  return {
    history: page.history.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      problemSlug: r.problemSlug,
      ...(r.sqlSlug ? { sqlSlug: r.sqlSlug } : {}),
      difficulty: r.difficulty,
      verdict: r.verdict,
      language: r.language,
      runtime: r.runtime,
      memory: r.memory,
      submittedAt: r.submittedAt,
    })),
    total: page.total,
    page: page.page,
    limit: page.limit,
  };
}

/** A page of someone's submission history — the slim rows, never code or a query. Null when there is no such user. */
export async function getPublicSubmissions(username: string, viewerId: string | null, page: number, limit: number) {
  const user = await visibleUser(username, viewerId);
  if (!user) return null;
  return publicHistoryPage(await getSubmissionHistory(user.id, page, limit));
}

/**
 * Someone's GitHub section: shown only when an account is connected and its
 * activity could be read — a visitor has nothing to do with a connect
 * prompt or a "GitHub didn't answer". Its own request, like the owner's,
 * because a cold read waits on GitHub.
 */
export async function getPublicGitHub(username: string, viewerId: string | null) {
  const user = await visibleUser(username, viewerId);
  if (!user) return null;
  const card = await getGitHubCard(user.id);
  return { card: card.status === "ok" && card.connection && card.activity ? { connection: card.connection, activity: card.activity } : null };
}

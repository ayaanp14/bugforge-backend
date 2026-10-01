import { prisma } from "../lib/prisma.js";
import { getDashboard, getSubmissionHistory } from "./dashboard.js";
import { getGitHubCard } from "./github-connection.js";

/**
 * Someone's profile as anyone else sees it: /u/<username> on the SPA.
 *
 * Read-only, and built from an allow-list — the columns below and the
 * dashboard slices named in `getPublicProfile`, nothing else. What never
 * leaves: the address, birthday and gender, the reminder switches, the
 * sign-in provider, when the account was last active, the owner's saved
 * interviews, study and pairing history, and the code of any submission —
 * the history rows carry no code, and GET /api/me/submissions/:id serves it
 * to its owner only, so a profile can never become a solutions list.
 *
 * The numbers come from the owner's own dashboard aggregate (cached, and
 * invalidated on every submission), so the two views of an account always
 * agree; the identity is read fresh, so a profile edit shows at once.
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
} as const;

/** Usernames are 3–20 of [a-z0-9_] today; older generated ones are looser, so this only screens out what could never be one. */
const PLAUSIBLE_USERNAME = /^[A-Za-z0-9_.-]{1,40}$/;

async function findUser(username: string) {
  if (!PLAUSIBLE_USERNAME.test(username)) return null;
  return prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: PUBLIC_USER_SELECT });
}

export async function getPublicProfile(username: string, viewerId: string | null) {
  const user = await findUser(username);
  if (!user) return null;
  return publicProfileOf(user, await getDashboard(user.id), viewerId);
}

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
type PublicUserRow = NonNullable<Awaited<ReturnType<typeof findUser>>>;

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
) {
  const me = dash.me;
  if (!me) return null;

  return {
    isSelf: viewerId === user.id,
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
    submissions: dash.submissions,
    // Credentials that stand today, each with the code its verify page
    // resolves. Not the score — what a credential certifies is its band —
    // and not which one is worn (the frame says that).
    credentials: (dash.credentials ?? [])
      .filter((c) => c.status === "valid")
      .map((c) => ({ code: c.code, skill: c.skill, level: c.level, name: c.name, testSlug: c.testSlug, band: c.band, issuedAt: c.issuedAt, expiresAt: c.expiresAt })),
  };
}

export type PublicProfile = NonNullable<ReturnType<typeof publicProfileOf>>;

/** A page of someone's submission history — the slim rows, never code. Null when there is no such user. */
export async function getPublicSubmissions(username: string, page: number, limit: number) {
  const user = await findUser(username);
  if (!user) return null;
  return getSubmissionHistory(user.id, page, limit);
}

/**
 * Someone's GitHub section: shown only when an account is connected and its
 * activity could be read — a visitor has nothing to do with a connect
 * prompt or a "GitHub didn't answer". Its own request, like the owner's,
 * because a cold read waits on GitHub.
 */
export async function getPublicGitHub(username: string) {
  const user = await findUser(username);
  if (!user) return null;
  const card = await getGitHubCard(user.id);
  return { card: card.status === "ok" && card.connection && card.activity ? { connection: card.connection, activity: card.activity } : null };
}

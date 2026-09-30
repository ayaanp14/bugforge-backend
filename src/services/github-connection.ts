import { prisma } from "../lib/prisma.js";
import { cachedShared } from "../lib/cache.js";
import {
  fetchGitHubUser,
  githubDataConfigured,
  githubOAuthClient,
  loginForGitHubId,
  shapeActivity,
  type GitHubActivity,
  type RawGitHubUser,
} from "../lib/github.js";

/**
 * The profile's GitHub card: which account is connected, and what it has
 * been doing (lib/github.ts reads it).
 *
 * Its own request (GET /api/me/github), not a field on the dashboard
 * aggregate: a cold read is a round trip to GitHub, and the dashboard must
 * never wait on a third party. The activity is cached per GitHub account,
 * not per user — it is the same public data whoever connected it — for an
 * hour in Redis and fifteen minutes in memory; the calendar only moves once
 * a day, and nothing we do changes it, so there is nothing to invalidate.
 */

export type GitHubCardStatus =
  /** Nothing connected. */
  | "not_connected"
  | "ok"
  /** Connected, but this server has no GITHUB_API_TOKEN to read with. */
  | "unavailable"
  /** GitHub failed or timed out; the next view tries again. */
  | "unreachable"
  /** The GitHub account no longer exists. */
  | "missing";

export interface GitHubCard {
  /** Whether the connect flow can run here (the OAuth app is configured). */
  canConnect: boolean;
  connection: { login: string; profileUrl: string; linkedAt: string } | null;
  status: GitHubCardStatus;
  activity: GitHubActivity | null;
}

/** A connect that cannot be applied, worded for the person connecting. */
export class GitHubLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubLinkError";
  }
}

const TTL_SECONDS = 60 * 60;
const MEMORY_TTL_MS = 15 * 60_000;
const cacheKey = (githubId: string) => `github:v1:${githubId}`;

const profileUrlOf = (login: string) => `https://github.com/${encodeURIComponent(login)}`;

let warnedUnconfigured = false;

/**
 * The query by the login we last saw — checked against the id, because a
 * login that was renamed away can be registered by someone else, and we
 * would then be showing a stranger's calendar. On a miss or a mismatch the
 * id says what the account is called now. Wrapped in an object so "the
 * account is gone" is a value the cache can hold (a bare null reads as a
 * miss in Redis).
 */
export async function loadActivity(githubId: string, login: string): Promise<{ activity: GitHubActivity | null }> {
  const matches = (raw: RawGitHubUser | null): raw is RawGitHubUser => raw !== null && String(raw.databaseId ?? "") === githubId;

  let raw = await fetchGitHubUser(login);
  if (!matches(raw)) {
    const current = await loginForGitHubId(githubId);
    raw = current ? await fetchGitHubUser(current) : null;
    if (!matches(raw)) return { activity: null };
  }
  return { activity: shapeActivity(raw, githubId) };
}

export async function getGitHubCard(userId: string): Promise<GitHubCard> {
  const canConnect = githubOAuthClient() !== null;
  const row = await prisma.gitHubConnection.findUnique({
    where: { userId },
    select: { githubId: true, login: true, linkedAt: true },
  });
  if (!row) return { canConnect, connection: null, status: "not_connected", activity: null };

  const connection = { login: row.login, profileUrl: profileUrlOf(row.login), linkedAt: row.linkedAt.toISOString() };
  if (!githubDataConfigured()) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn("[github] GITHUB_API_TOKEN is not set; connected profiles show no GitHub activity");
    }
    return { canConnect, connection, status: "unavailable", activity: null };
  }

  let activity: GitHubActivity | null;
  try {
    ({ activity } = await cachedShared(cacheKey(row.githubId), TTL_SECONDS, () => loadActivity(row.githubId, row.login), MEMORY_TTL_MS));
  } catch (err) {
    console.warn("[github] activity read failed:", err instanceof Error ? err.message : err);
    return { canConnect, connection, status: "unreachable", activity: null };
  }
  if (!activity) return { canConnect, connection, status: "missing", activity: null };

  // Renamed on GitHub since it was connected: keep the stored name current,
  // so the next cold read starts from the right login.
  if (activity.login && activity.login !== row.login) {
    void prisma.gitHubConnection
      .update({ where: { userId }, data: { login: activity.login }, select: { userId: true } })
      .catch((err: unknown) => console.warn("[github] login refresh failed:", err instanceof Error ? err.message : err));
    connection.login = activity.login;
    connection.profileUrl = activity.profileUrl;
  }
  return { canConnect, connection, status: "ok", activity };
}

/**
 * Connect (or replace) this account's GitHub. One GitHub account shows on one
 * CodeKairo profile: whoever connected it first keeps it until they
 * disconnect.
 */
export async function linkGitHub(userId: string, githubId: string, login: string): Promise<GitHubCard> {
  const taken = new GitHubLinkError(`@${login} is already connected to another CodeKairo account.`);
  const holder = await prisma.gitHubConnection.findUnique({ where: { githubId }, select: { userId: true } });
  if (holder && holder.userId !== userId) throw taken;
  try {
    await prisma.gitHubConnection.upsert({
      where: { userId },
      create: { userId, githubId, login },
      update: { githubId, login, linkedAt: new Date() },
      select: { userId: true },
    });
  } catch (err) {
    // Two accounts completing for the same GitHub account at once.
    if ((err as { code?: string }).code === "P2002") throw taken;
    throw err;
  }
  return getGitHubCard(userId);
}

export async function unlinkGitHub(userId: string): Promise<GitHubCard> {
  await prisma.gitHubConnection.deleteMany({ where: { userId } });
  return { canConnect: githubOAuthClient() !== null, connection: null, status: "not_connected", activity: null };
}

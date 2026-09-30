import crypto from "node:crypto";
import { JWT_SECRET } from "./secrets.js";

/**
 * GitHub on a profile: the contribution calendar and recent public activity
 * of an account the user proved is theirs (services/github-connection.ts).
 *
 * Everything is read with the server's own token (`GITHUB_API_TOKEN`), never
 * the user's. The connect flow's OAuth token is used once to learn which
 * account signed in and then dropped, as the sign-in flow drops its own —
 * stored provider tokens were scrubbed on purpose (routes/oauth.ts,
 * `upsertSocialUser`), and a public calendar needs none. The server token
 * needs no scopes: a classic token with none, or a fine-grained one with
 * public read-only access. GraphQL refuses anonymous calls outright, and
 * the contribution calendar has no REST twin, so without the token the card
 * says the activity is unavailable and the connect flow still works.
 *
 * One GraphQL request builds the whole card. The public events feed
 * (`/users/:login/events/public`) was the other way to get "recent
 * activity", but it trails by 30 s to 6 h, stops at 90 days and describes
 * pushes rather than contributions; `contributionsCollection` is the same
 * source as the calendar above it, so the two can never disagree.
 */

const API = "https://api.github.com";
const TIMEOUT_MS = 8_000;
/** Rows in the card's recent-activity list. */
export const RECENT_LIMIT = 10;

const apiToken = (): string | null => process.env["GITHUB_API_TOKEN"]?.trim() || null;

/** True when the server can read GitHub data at all. */
export const githubDataConfigured = (): boolean => apiToken() !== null;

/** The OAuth app the sign-in flow uses; the connect flow runs through the same one. */
export function githubOAuthClient(): { id: string; secret: string } | null {
  const id = process.env["GITHUB_ID"];
  const secret = process.env["GITHUB_SECRET"];
  return id && secret ? { id, secret } : null;
}

// ── the card's payload ────────────────────────────────────────────────

/** GitHub's own quartile for the day, 0 for none — the colour step, as github.com draws it. */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface GitHubDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export type GitHubRecentKind = "commits" | "pull_request" | "issue" | "review" | "repository";

export interface GitHubRecentItem {
  kind: GitHubRecentKind;
  /** ISO timestamp. A day of commits carries that day's midnight. */
  at: string;
  repo: string;
  repoUrl: string;
  url: string;
  title: string | null;
  number: number | null;
  /** Commits that day (kind "commits" only). */
  count: number | null;
  state: "open" | "closed" | "merged" | null;
}

export interface GitHubActivity {
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  calendar: {
    total: number;
    days: GitHubDay[];
    activeDays: number;
    longestStreak: number;
    currentStreak: number;
  };
  totals: {
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    repositories: number;
    /** Contributions to private repositories: counted only if the owner opted in on GitHub, never itemised. */
    private: number;
  };
  recent: GitHubRecentItem[];
  fetchedAt: string;
}

// ── the query ─────────────────────────────────────────────────────────

/**
 * No `from`/`to` on the collection: the default is the year ending now,
 * which is the window github.com draws. Every list asks for a handful — the
 * card shows RECENT_LIMIT rows merged across them — so the whole query costs
 * one point of the 5,000-an-hour budget.
 */
export const PROFILE_QUERY = /* GraphQL */ `
  query CodeKairoProfile($login: String!) {
    user(login: $login) {
      databaseId
      login
      name
      avatarUrl(size: 96)
      url
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 10) {
          repository {
            nameWithOwner
            url
          }
          contributions(first: 5, orderBy: { field: OCCURRED_AT, direction: DESC }) {
            nodes {
              occurredAt
              commitCount
              url
            }
          }
        }
        pullRequestContributions(first: 6, orderBy: { direction: DESC }) {
          nodes {
            occurredAt
            pullRequest {
              title
              url
              number
              state
              repository {
                nameWithOwner
                url
              }
            }
          }
        }
        issueContributions(first: 6, orderBy: { direction: DESC }) {
          nodes {
            occurredAt
            issue {
              title
              url
              number
              state
              repository {
                nameWithOwner
                url
              }
            }
          }
        }
        pullRequestReviewContributions(first: 6, orderBy: { direction: DESC }) {
          nodes {
            occurredAt
            pullRequest {
              title
              url
              number
              repository {
                nameWithOwner
                url
              }
            }
          }
        }
        repositoryContributions(first: 4, orderBy: { direction: DESC }) {
          nodes {
            occurredAt
            repository {
              nameWithOwner
              url
            }
          }
        }
      }
    }
  }
`;

type RawRepo = { nameWithOwner?: string; url?: string } | null | undefined;
type RawIssueLike = { title?: string; url?: string; number?: number; state?: string; repository?: RawRepo } | null | undefined;
type Nodes<T> = { nodes?: (T | null)[] | null } | null | undefined;

/** `user` as the query returns it. Every field is optional here: this is parsed, not trusted. */
export interface RawGitHubUser {
  databaseId?: number | null;
  login?: string;
  name?: string | null;
  avatarUrl?: string | null;
  url?: string;
  contributionsCollection?: {
    totalCommitContributions?: number;
    totalPullRequestContributions?: number;
    totalIssueContributions?: number;
    totalPullRequestReviewContributions?: number;
    totalRepositoryContributions?: number;
    restrictedContributionsCount?: number;
    contributionCalendar?: {
      totalContributions?: number;
      weeks?: { contributionDays?: { date?: string; contributionCount?: number; contributionLevel?: string }[] }[];
    };
    commitContributionsByRepository?: {
      repository?: RawRepo;
      contributions?: Nodes<{ occurredAt?: string; commitCount?: number; url?: string }>;
    }[];
    pullRequestContributions?: Nodes<{ occurredAt?: string; pullRequest?: RawIssueLike }>;
    issueContributions?: Nodes<{ occurredAt?: string; issue?: RawIssueLike }>;
    pullRequestReviewContributions?: Nodes<{ occurredAt?: string; pullRequest?: RawIssueLike }>;
    repositoryContributions?: Nodes<{ occurredAt?: string; repository?: RawRepo }>;
  } | null;
}

// ── shaping (pure) ────────────────────────────────────────────────────

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/**
 * Only links onto github.com leave this module. They are rendered as hrefs
 * on the profile, and GitHub's answer is still a third party's input: a
 * `javascript:` URL there would run on our origin.
 */
function githubUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && /^https:\/\/github\.com\//.test(value) ? value : fallback;
}

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/**
 * Active days, the longest run of them, and the run that is still going. The
 * last day is today on GitHub's clock and may not have happened yet, so an
 * empty today does not end the current streak — the same grace github.com's
 * own streak readers give it.
 */
export function calendarStats(days: GitHubDay[]): { activeDays: number; longestStreak: number; currentStreak: number } {
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      activeDays += 1;
      run += 1;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }
  let currentStreak = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  for (; i >= 0 && days[i].count > 0; i -= 1) currentStreak += 1;
  return { activeDays, longestStreak, currentStreak };
}

function recentItems(raw: RawGitHubUser, profileUrl: string): GitHubRecentItem[] {
  const c = raw.contributionsCollection;
  if (!c) return [];
  const items: GitHubRecentItem[] = [];
  const repoOf = (r: RawRepo) =>
    r && typeof r.nameWithOwner === "string" ? { repo: r.nameWithOwner, repoUrl: githubUrl(r.url, profileUrl) } : null;
  const state = (s: unknown): GitHubRecentItem["state"] =>
    s === "OPEN" ? "open" : s === "CLOSED" ? "closed" : s === "MERGED" ? "merged" : null;

  for (const group of c.commitContributionsByRepository ?? []) {
    const repo = repoOf(group.repository);
    if (!repo) continue;
    for (const node of group.contributions?.nodes ?? []) {
      if (!node?.occurredAt || !node.commitCount) continue;
      items.push({ kind: "commits", at: node.occurredAt, ...repo, url: githubUrl(node.url, repo.repoUrl), title: null, number: null, count: node.commitCount, state: null });
    }
  }

  const issueLike = (kind: "pull_request" | "issue" | "review", at: string | undefined, it: RawIssueLike) => {
    const repo = it ? repoOf(it.repository) : null;
    if (!at || !it || !repo) return;
    items.push({
      kind,
      at,
      ...repo,
      url: githubUrl(it.url, repo.repoUrl),
      title: typeof it.title === "string" ? it.title : null,
      number: typeof it.number === "number" ? it.number : null,
      count: null,
      // A review's state would be the pull request's, not the review's; leave it out.
      state: kind === "review" ? null : state(it.state),
    });
  };
  for (const n of c.pullRequestContributions?.nodes ?? []) issueLike("pull_request", n?.occurredAt, n?.pullRequest);
  for (const n of c.issueContributions?.nodes ?? []) issueLike("issue", n?.occurredAt, n?.issue);
  for (const n of c.pullRequestReviewContributions?.nodes ?? []) issueLike("review", n?.occurredAt, n?.pullRequest);

  for (const n of c.repositoryContributions?.nodes ?? []) {
    const repo = repoOf(n?.repository);
    if (!n?.occurredAt || !repo) continue;
    items.push({ kind: "repository", at: n.occurredAt, ...repo, url: repo.repoUrl, title: null, number: null, count: null, state: null });
  }

  const time = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  };
  // Array#sort is stable, so equal times keep the order above.
  return items.sort((a, b) => time(b.at) - time(a.at)).slice(0, RECENT_LIMIT);
}

/** The query's `user` as the card's payload. */
export function shapeActivity(raw: RawGitHubUser, githubId: string, now: Date = new Date()): GitHubActivity {
  const login = typeof raw.login === "string" ? raw.login : "";
  const profileUrl = githubUrl(raw.url, `https://github.com/${encodeURIComponent(login)}`);
  const c = raw.contributionsCollection ?? null;

  const days: GitHubDay[] = [];
  for (const week of c?.contributionCalendar?.weeks ?? []) {
    for (const d of week.contributionDays ?? []) {
      if (typeof d.date !== "string") continue;
      days.push({ date: d.date, count: num(d.contributionCount), level: LEVELS[d.contributionLevel ?? ""] ?? 0 });
    }
  }

  return {
    githubId,
    login,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : null,
    avatarUrl: typeof raw.avatarUrl === "string" && raw.avatarUrl.startsWith("https://") ? raw.avatarUrl : null,
    profileUrl,
    calendar: { total: num(c?.contributionCalendar?.totalContributions), days, ...calendarStats(days) },
    totals: {
      commits: num(c?.totalCommitContributions),
      pullRequests: num(c?.totalPullRequestContributions),
      issues: num(c?.totalIssueContributions),
      reviews: num(c?.totalPullRequestReviewContributions),
      repositories: num(c?.totalRepositoryContributions),
      private: num(c?.restrictedContributionsCount),
    },
    recent: recentItems(raw, profileUrl),
    fetchedAt: now.toISOString(),
  };
}

// ── requests ──────────────────────────────────────────────────────────

/** GitHub answered with something other than the data, or did not answer. */
export class GitHubRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "CodeKairo",
  };
}

function requireToken(): string {
  const token = apiToken();
  if (!token) throw new GitHubRequestError("GITHUB_API_TOKEN is not set");
  return token;
}

/**
 * The profile query for one login, or null when GitHub has no such user
 * (renamed away or deleted). Anything else that goes wrong throws.
 */
export async function fetchGitHubUser(login: string): Promise<RawGitHubUser | null> {
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(requireToken()), "Content-Type": "application/json" },
    body: JSON.stringify({ query: PROFILE_QUERY, variables: { login } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new GitHubRequestError(`GitHub GraphQL answered ${res.status}`, res.status);
  const body = (await res.json()) as { data?: { user?: RawGitHubUser | null }; errors?: { type?: string; message?: string }[] };
  if (body.data?.user) return body.data.user;
  if (body.errors?.some((e) => e.type === "NOT_FOUND")) return null;
  throw new GitHubRequestError(`GitHub GraphQL error: ${body.errors?.[0]?.message ?? "no data"}`);
}

/**
 * The current login of a numeric account id, or null when the account is
 * gone. The id is what a connection is keyed on, because a login can be
 * renamed — and then registered by someone else.
 */
export async function loginForGitHubId(githubId: string): Promise<string | null> {
  if (!/^\d{1,20}$/.test(githubId)) return null;
  const res = await fetch(`${API}/user/${githubId}`, { headers: headers(requireToken()), signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubRequestError(`GitHub /user/:id answered ${res.status}`, res.status);
  const body = (await res.json()) as { login?: unknown };
  return typeof body.login === "string" ? body.login : null;
}

// ── the connect flow's signed tickets ─────────────────────────────────

/**
 * The connect flow's two tickets, both HMAC-signed and short-lived, so the
 * flow keeps no server state:
 *
 * - the OAuth `state` names the account that asked to connect;
 * - the result, which the callback hands back to /profile, names that
 *   account and the GitHub identity GitHub vouched for. It is only applied
 *   by POST /api/me/github/complete, under the session of the *same*
 *   account.
 *
 * That second step is the point. The callback cannot see who is signed in —
 * the SPA's session is a Bearer token, not a cookie the API can read on a
 * navigation — so if it linked on the strength of `state` alone, an attacker
 * could start a connect for their own account, hand the authorize link to a
 * victim who once approved this app (GitHub skips the consent screen), and
 * wear the victim's GitHub on their profile. With the handback, the victim's
 * browser lands on /profile holding a ticket for the attacker's account,
 * and its own session refuses to apply it.
 *
 * The key is derived from JWT_SECRET under its own label, so a ticket can
 * never be mistaken for a session token or the other way round.
 */
const LINK_KEY = crypto.createHmac("sha256", JWT_SECRET).update("github-link:v1").digest();
const STATE_TTL_MS = 10 * 60_000;
const RESULT_TTL_MS = 10 * 60_000;

/** Marks a callback `state` as the connect flow's rather than a sign-in's. */
export const LINK_STATE_PREFIX = "ghlink.";

type Ticket =
  | { k: "state"; uid: string; exp: number; n: string }
  | { k: "result"; uid: string; gid: string; login: string; exp: number };

function seal(ticket: Ticket): string {
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  const sig = crypto.createHmac("sha256", LINK_KEY).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unseal(token: string, now: number): Ticket | null {
  if (typeof token !== "string" || token.length > 2048) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = crypto.createHmac("sha256", LINK_KEY).update(body).digest();
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Ticket;
    if (typeof ticket.exp !== "number" || ticket.exp <= now || typeof ticket.uid !== "string" || !ticket.uid) return null;
    return ticket;
  } catch {
    return null;
  }
}

export const isLinkState = (state: string): boolean => state.startsWith(LINK_STATE_PREFIX);

export function linkState(userId: string, now = Date.now()): string {
  return LINK_STATE_PREFIX + seal({ k: "state", uid: userId, exp: now + STATE_TTL_MS, n: crypto.randomBytes(9).toString("base64url") });
}

export function readLinkState(state: string, now = Date.now()): { userId: string } | null {
  if (!isLinkState(state)) return null;
  const ticket = unseal(state.slice(LINK_STATE_PREFIX.length), now);
  return ticket?.k === "state" ? { userId: ticket.uid } : null;
}

export function linkResult(userId: string, githubId: string, login: string, now = Date.now()): string {
  return seal({ k: "result", uid: userId, gid: githubId, login, exp: now + RESULT_TTL_MS });
}

export function readLinkResult(token: string, now = Date.now()): { userId: string; githubId: string; login: string } | null {
  const ticket = unseal(token, now);
  if (ticket?.k !== "result" || typeof ticket.gid !== "string" || typeof ticket.login !== "string") return null;
  return { userId: ticket.uid, githubId: ticket.gid, login: ticket.login };
}

/** Where the browser goes to prove a GitHub account, or null when the OAuth app is not configured. */
export function githubConnectUrl(redirectUri: string, userId: string): string | null {
  const client = githubOAuthClient();
  if (!client) return null;
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", client.id);
  authorize.searchParams.set("redirect_uri", redirectUri);
  // No scope: public profile data only, which is all "who is this" needs.
  authorize.searchParams.set("state", linkState(userId));
  authorize.searchParams.set("allow_signup", "false");
  return authorize.toString();
}

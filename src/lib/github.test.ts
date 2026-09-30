import { describe, it, before, after, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";
process.env["TELEMETRY_DISABLED"] = "true";

/**
 * The GitHub card: the payload shaping, the streak rule, the connect flow's
 * signed tickets, and the rename check that keeps a stranger's calendar off
 * a profile. GitHub itself is a stubbed fetch.
 *
 * Run with: npx tsx --test src/lib/github.test.ts
 */

type GitHub = typeof import("./github.js");
type Service = typeof import("../services/github-connection.js");
let gh: GitHub;
let service: Service;
before(async () => {
  gh = await import("./github.js");
  service = await import("../services/github-connection.js");
});

const day = (date: string, count: number, level = count ? "FIRST_QUARTILE" : "NONE") => ({ date, contributionCount: count, contributionLevel: level });
const repo = (name: string) => ({ nameWithOwner: name, url: `https://github.com/${name}` });

function rawUser(overrides: Partial<import("./github.js").RawGitHubUser> = {}): import("./github.js").RawGitHubUser {
  return {
    databaseId: 42,
    login: "octo",
    name: "  Octo Cat ",
    avatarUrl: "https://avatars.githubusercontent.com/u/42?s=96",
    url: "https://github.com/octo",
    contributionsCollection: {
      totalCommitContributions: 7,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 1,
      totalRepositoryContributions: 1,
      restrictedContributionsCount: 3,
      contributionCalendar: {
        totalContributions: 12,
        weeks: [
          { contributionDays: [day("2026-09-26", 0), day("2026-09-27", 4, "THIRD_QUARTILE")] },
          { contributionDays: [day("2026-09-28", 2, "SECOND_QUARTILE"), day("2026-09-29", 6, "FOURTH_QUARTILE"), day("2026-09-30", 0)] },
        ],
      },
      commitContributionsByRepository: [
        {
          repository: repo("octo/app"),
          contributions: {
            nodes: [
              { occurredAt: "2026-09-29T07:00:00Z", commitCount: 5, url: "https://github.com/octo/app/commits?author=octo" },
              { occurredAt: "2026-09-27T07:00:00Z", commitCount: 2, url: "https://github.com/octo/app/commits?author=octo" },
            ],
          },
        },
      ],
      pullRequestContributions: {
        nodes: [{ occurredAt: "2026-09-29T12:30:00Z", pullRequest: { title: "Fix the thing", url: "https://github.com/up/lib/pull/9", number: 9, state: "MERGED", repository: repo("up/lib") } }],
      },
      issueContributions: {
        nodes: [{ occurredAt: "2026-09-28T09:00:00Z", issue: { title: "Crash", url: "javascript:alert(1)", number: 3, state: "OPEN", repository: repo("up/lib") } }],
      },
      pullRequestReviewContributions: {
        nodes: [{ occurredAt: "2026-09-28T10:00:00Z", pullRequest: { title: "Add docs", url: "https://github.com/up/lib/pull/8", number: 8, state: "OPEN", repository: repo("up/lib") } }],
      },
      repositoryContributions: { nodes: [{ occurredAt: "2026-09-26T08:00:00Z", repository: repo("octo/app") }] },
    },
    ...overrides,
  };
}

describe("shapeActivity", () => {
  it("flattens the calendar with GitHub's own levels and keeps the totals", () => {
    const a = gh.shapeActivity(rawUser(), "42", new Date("2026-09-30T10:00:00Z"));
    assert.equal(a.login, "octo");
    assert.equal(a.name, "Octo Cat");
    assert.equal(a.calendar.total, 12);
    assert.deepEqual(
      a.calendar.days.map((d) => [d.date, d.count, d.level]),
      [["2026-09-26", 0, 0], ["2026-09-27", 4, 3], ["2026-09-28", 2, 2], ["2026-09-29", 6, 4], ["2026-09-30", 0, 0]],
    );
    assert.deepEqual(a.totals, { commits: 7, pullRequests: 2, issues: 1, reviews: 1, repositories: 1, private: 3 });
    assert.equal(a.fetchedAt, "2026-09-30T10:00:00.000Z");
  });

  it("merges every kind of contribution newest first", () => {
    const a = gh.shapeActivity(rawUser(), "42");
    assert.deepEqual(
      a.recent.map((r) => [r.kind, r.repo, r.count ?? r.number]),
      [
        ["pull_request", "up/lib", 9],
        ["commits", "octo/app", 5],
        ["review", "up/lib", 8],
        ["issue", "up/lib", 3],
        ["commits", "octo/app", 2],
        ["repository", "octo/app", null],
      ],
    );
    assert.equal(a.recent[0].state, "merged");
    // A review carries no state: the pull request's would read as the review's.
    assert.equal(a.recent[2].state, null);
  });

  it("never passes on a link that is not github.com", () => {
    const a = gh.shapeActivity(rawUser(), "42");
    const issue = a.recent.find((r) => r.kind === "issue")!;
    assert.equal(issue.url, "https://github.com/up/lib");
    const odd = gh.shapeActivity(rawUser({ url: "http://evil.example/octo", avatarUrl: "http://plain/a.png" }), "42");
    assert.equal(odd.profileUrl, "https://github.com/octo");
    assert.equal(odd.avatarUrl, null);
  });

  it("caps the list and survives an empty collection", () => {
    const many = rawUser();
    many.contributionsCollection!.repositoryContributions = {
      nodes: Array.from({ length: 20 }, (_, i) => ({ occurredAt: `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00Z`, repository: repo(`octo/r${i}`) })),
    };
    assert.equal(gh.shapeActivity(many, "42").recent.length, gh.RECENT_LIMIT);

    const bare = gh.shapeActivity({ login: "ghost", contributionsCollection: null }, "7");
    assert.equal(bare.calendar.total, 0);
    assert.deepEqual(bare.calendar.days, []);
    assert.deepEqual(bare.recent, []);
    assert.equal(bare.profileUrl, "https://github.com/ghost");
  });
});

describe("calendarStats", () => {
  const days = (counts: number[]) => counts.map((count, i) => ({ date: `d${i}`, count, level: 0 as const }));

  it("counts active days and the longest run", () => {
    assert.deepEqual(gh.calendarStats(days([1, 1, 0, 1, 1, 1, 0])), { activeDays: 5, longestStreak: 3, currentStreak: 3 });
  });

  it("does not let an empty today end the current streak, but an empty yesterday does", () => {
    assert.equal(gh.calendarStats(days([1, 1, 0])).currentStreak, 2);
    assert.equal(gh.calendarStats(days([1, 1, 1])).currentStreak, 3);
    assert.equal(gh.calendarStats(days([1, 0, 0])).currentStreak, 0);
  });

  it("is all zeros for no days", () => {
    assert.deepEqual(gh.calendarStats([]), { activeDays: 0, longestStreak: 0, currentStreak: 0 });
  });
});

describe("the connect flow's tickets", () => {
  it("round-trips the state, marked so the callback can tell it from a sign-in", () => {
    const state = gh.linkState("user_1");
    assert.ok(gh.isLinkState(state));
    assert.deepEqual(gh.readLinkState(state), { userId: "user_1" });
    // A sign-in's state is 32 hex characters and is never read as a connect.
    assert.equal(gh.isLinkState("a".repeat(32)), false);
  });

  it("round-trips the result", () => {
    assert.deepEqual(gh.readLinkResult(gh.linkResult("user_1", "42", "octo")), { userId: "user_1", githubId: "42", login: "octo" });
  });

  it("refuses a tampered, expired or swapped ticket", () => {
    const result = gh.linkResult("user_1", "42", "octo");
    const [body, sig] = result.split(".");
    const forged = Buffer.from(JSON.stringify({ k: "result", uid: "user_2", gid: "42", login: "octo", exp: Date.now() + 60_000 })).toString("base64url");
    assert.equal(gh.readLinkResult(`${forged}.${sig}`), null);
    assert.equal(gh.readLinkResult(`${body}.${sig.slice(0, -2)}xx`), null);
    assert.equal(gh.readLinkResult(result, Date.now() + 11 * 60_000), null);
    // Each ticket only reads as its own kind.
    const state = gh.linkState("user_1");
    assert.equal(gh.readLinkResult(state.slice(gh.LINK_STATE_PREFIX.length)), null);
    assert.equal(gh.readLinkState(gh.LINK_STATE_PREFIX + result), null);
    assert.equal(gh.readLinkResult("not-a-ticket"), null);
  });

  it("builds the authorize URL with no scope, or nothing without an OAuth app", () => {
    const saved = { id: process.env["GITHUB_ID"], secret: process.env["GITHUB_SECRET"] };
    try {
      delete process.env["GITHUB_ID"];
      assert.equal(gh.githubConnectUrl("https://api.example/cb", "user_1"), null);
      process.env["GITHUB_ID"] = "client";
      process.env["GITHUB_SECRET"] = "secret";
      const url = new URL(gh.githubConnectUrl("https://api.example/cb", "user_1")!);
      assert.equal(url.origin + url.pathname, "https://github.com/login/oauth/authorize");
      assert.equal(url.searchParams.get("client_id"), "client");
      assert.equal(url.searchParams.get("redirect_uri"), "https://api.example/cb");
      assert.equal(url.searchParams.has("scope"), false);
      assert.deepEqual(gh.readLinkState(url.searchParams.get("state")!), { userId: "user_1" });
    } finally {
      if (saved.id === undefined) delete process.env["GITHUB_ID"];
      else process.env["GITHUB_ID"] = saved.id;
      if (saved.secret === undefined) delete process.env["GITHUB_SECRET"];
      else process.env["GITHUB_SECRET"] = saved.secret;
    }
  });
});

describe("reading GitHub", () => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  /** Answers GraphQL by login and REST /user/:id from the given tables. */
  function stubGitHub(byLogin: Record<string, import("./github.js").RawGitHubUser>, loginById: Record<string, string>) {
    const calls: string[] = [];
    mock.method(globalThis, "fetch", async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/graphql")) {
        const login = (JSON.parse(String(init?.body)) as { variables: { login: string } }).variables.login;
        calls.push(`graphql:${login}`);
        const user = byLogin[login];
        return json(user ? { data: { user } } : { data: { user: null }, errors: [{ type: "NOT_FOUND", message: "no user" }] });
      }
      const id = url.split("/user/")[1];
      calls.push(`rest:${id}`);
      return loginById[id] ? json({ login: loginById[id] }) : json({ message: "Not Found" }, 404);
    });
    return calls;
  }

  let savedToken: string | undefined;
  before(() => {
    savedToken = process.env["GITHUB_API_TOKEN"];
    process.env["GITHUB_API_TOKEN"] = "server-token";
  });
  afterEach(() => mock.restoreAll());
  after(() => {
    if (savedToken === undefined) delete process.env["GITHUB_API_TOKEN"];
    else process.env["GITHUB_API_TOKEN"] = savedToken;
  });

  it("reads the stored login when it still belongs to the account", async () => {
    const calls = stubGitHub({ octo: rawUser() }, { "42": "octo" });
    const { activity } = await service.loadActivity("42", "octo");
    assert.equal(activity?.login, "octo");
    assert.deepEqual(calls, ["graphql:octo"]);
  });

  it("follows a rename through the account id", async () => {
    const calls = stubGitHub({ "octo-new": rawUser({ login: "octo-new", url: "https://github.com/octo-new" }) }, { "42": "octo-new" });
    const { activity } = await service.loadActivity("42", "octo");
    assert.equal(activity?.login, "octo-new");
    assert.deepEqual(calls, ["graphql:octo", "rest:42", "graphql:octo-new"]);
  });

  it("never shows whoever registered the old login since", async () => {
    stubGitHub({ octo: rawUser({ databaseId: 999 }), "octo-new": rawUser({ login: "octo-new" }) }, { "42": "octo-new" });
    const { activity } = await service.loadActivity("42", "octo");
    assert.equal(activity?.login, "octo-new");
  });

  it("reports an account that is gone as no activity", async () => {
    stubGitHub({ octo: rawUser({ databaseId: 999 }) }, {});
    assert.deepEqual(await service.loadActivity("42", "octo"), { activity: null });
  });

  it("throws on anything else, so the card says GitHub did not answer", async () => {
    mock.method(globalThis, "fetch", async () => json({ message: "Bad credentials" }, 401));
    await assert.rejects(gh.fetchGitHubUser("octo"), gh.GitHubRequestError);
    mock.restoreAll();
    mock.method(globalThis, "fetch", async () => json({ data: null, errors: [{ type: "RATE_LIMITED", message: "slow down" }] }));
    await assert.rejects(gh.fetchGitHubUser("octo"), /slow down/);
  });
});

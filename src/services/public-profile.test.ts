import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env["TELEMETRY_DISABLED"] = "true";
const { publicProfileOf } = await import("./public-profile.js");

/**
 * A public profile (/u/:username) is an allow-list. These hand it an
 * account and a dashboard carrying private fields — the kind the owner's own
 * payload holds, and the kind a later change might add — and check that
 * only the named public ones come out.
 *
 * Run with: npx tsx --test src/services/public-profile.test.ts
 */

const user = {
  id: "user_1",
  name: "Ayaan",
  username: "ayaan",
  avatar_url: "https://example.com/a.png",
  instituteName: "Somewhere Institute",
  location: "Pune",
  website: "https://ayaan.dev",
  github: "https://github.com/ayaan",
  linkedin: null,
  twitter: null,
  readme: "Building things.",
  createdAt: new Date("2026-01-02T00:00:00Z"),
  profileHidden: false,
};

const dash = {
  me: {
    id: "user_1",
    name: "Ayaan",
    username: "ayaan",
    avatar_url: null,
    xp: 465,
    questionsXp: 400,
    bugsXp: 65,
    rating: 60,
    createdAt: new Date("2026-01-02T00:00:00Z"),
    roadmapRewards: [{ tierKey: "foundations" }],
    wornCredential: { code: "CK-7H3K-9QXM", skill: "java", level: "basic", band: "pass", expiresAt: new Date("2028-10-01T00:00:00Z") },
    stats: { problemsSolved: 12, bugsFixed: 3, sqlSolved: 4, currentStreak: 2, longestStreak: 9, lastActive: new Date("2026-09-30T08:00:00Z") },
    tierTitle: "Apprentice",
    trends: { xpThisWeek: 40, solvedToday: 1, bugsFixedThisWeek: 0 },
    globalRank: 7,
    // What must never reach anyone else, should it ever land on this slice.
    email: "ayaan@example.com",
    birthday: new Date("2000-01-01T00:00:00Z"),
    gender: "Male",
    password_hash: "$2b$12$secret",
  },
  social: { followers: 1, following: 2, posts: 3 },
  difficultyStats: { easy: { solved: 1, attempted: 1, total: 400 }, medium: { solved: 0, attempted: 0, total: 500 }, hard: { solved: 0, attempted: 0, total: 150 } },
  heatmap: { totalSubmissions: 10, activeDays: 4, maxStreak: 2, currentStreak: 1, start: "2025-10-01", counts: [0, 1] },
  roadmap: [],
  tournaments: [],
  // The owner sees their scores and expired credentials; a visitor does not.
  credentials: [
    { code: "CK-7H3K-9QXM", skill: "java", level: "basic", name: "Java · Basic", testSlug: "java-basic", band: "pass", percent: 73, issuedAt: new Date("2026-10-01T00:00:00Z"), expiresAt: new Date("2028-10-01T00:00:00Z"), status: "valid", worn: true },
    { code: "CK-AAAA-BBBB", skill: "sql", level: "basic", name: "SQL · Basic", testSlug: "sql-basic", band: "pass", percent: 61, issuedAt: new Date("2023-01-01T00:00:00Z"), expiresAt: new Date("2025-01-01T00:00:00Z"), status: "expired", worn: false },
  ],
  // Slim rows — plus what a row must never carry, should a select ever let
  // it through: a coding submission's code and a SQL submission's query.
  submissions: {
    history: [
      { id: "s1", type: "problem", title: "Two Sum", problemSlug: "two-sum", difficulty: "EASY", verdict: "ACCEPTED", language: "python", runtime: "12ms", memory: "N/A", submittedAt: new Date("2026-10-05T08:00:00Z"), code: "def leaked_solution(): pass" },
      { id: "q1", type: "sql", title: "Big Countries", problemSlug: undefined, sqlSlug: "big-countries", difficulty: "EASY", verdict: "ACCEPTED", language: "MySQL", runtime: "3ms", memory: "N/A", submittedAt: new Date("2026-10-05T07:00:00Z"), query: "SELECT leaked_query FROM t" },
    ],
    total: 2,
    page: 1,
    limit: 5,
  },
  // The owner's private slices of the same payload.
  pairing: { history: [{ roomId: "r1" }], total: 1 },
  savedInterviews: 4,
  continueSolving: { problem: { slug: "secret-draft" } },
  study: { track: "java" },
} as unknown as Parameters<typeof publicProfileOf>[1];

describe("publicProfileOf", () => {
  it("names the public fields and nothing else", () => {
    const profile = publicProfileOf(user, dash, null)!;
    assert.deepEqual(Object.keys(profile).sort(), ["credentials", "difficultyStats", "heatmap", "isSelf", "roadmap", "social", "submissions", "tournaments", "user"]);
    assert.deepEqual(Object.keys(profile.user).sort(), [
      "avatar_url", "createdAt", "github", "globalRank", "instituteName", "linkedin", "location", "name", "rating", "readme",
      "roadmapRewards", "stats", "tierTitle", "twitter", "username", "website", "wornCredential", "xp",
    ]);
    assert.deepEqual(Object.keys(profile.user.stats!).sort(), ["bugsFixed", "currentStreak", "longestStreak", "problemsSolved", "sqlSolved"]);
    assert.equal(profile.user.stats!.sqlSolved, 4);
  });

  it("shows standing credentials without their scores", () => {
    const profile = publicProfileOf(user, dash, null)!;
    assert.deepEqual(profile.credentials.map((c) => c.code), ["CK-7H3K-9QXM"]);
    assert.deepEqual(Object.keys(profile.credentials[0]!).sort(), ["band", "code", "expiresAt", "issuedAt", "level", "name", "skill", "testSlug"]);
    assert.ok(!JSON.stringify(profile).includes("73"), "a credential's score is the owner's");
  });

  it("lets no private value through, however it got onto the dashboard", () => {
    const text = JSON.stringify(publicProfileOf(user, dash, null));
    for (const secret of ["ayaan@example.com", "2000-01-01", "Male", "$2b$12$secret", "lastActive", "secret-draft", "savedInterviews", "pairing", "trends", "user_1", "leaked_solution", "leaked_query"]) {
      assert.ok(!text.includes(secret), `leaked ${secret}`);
    }
  });

  it("lists SQL submissions in the history, linked by their slug, without the query", () => {
    const rows = publicProfileOf(user, dash, null)!.submissions.history;
    assert.deepEqual(rows.map((r) => r.id), ["s1", "q1"]);
    const sql = rows[1]!;
    assert.equal(sql.type, "sql");
    assert.equal(sql.sqlSlug, "big-countries");
    assert.deepEqual(Object.keys(sql).sort(), ["difficulty", "id", "language", "memory", "problemSlug", "runtime", "sqlSlug", "submittedAt", "title", "type", "verdict"]);
    assert.ok(!("sqlSlug" in rows[0]!), "a coding row has no SQL slug");
  });

  it("knows the owner from anyone else", () => {
    assert.equal(publicProfileOf(user, dash, "user_1")!.isSelf, true);
    assert.equal(publicProfileOf(user, dash, "user_2")!.isSelf, false);
    assert.equal(publicProfileOf(user, dash, null)!.isSelf, false);
  });

  it("tells only its owner that a profile is hidden, and never names the flag to anyone else", () => {
    const hidden = { ...user, profileHidden: true };
    assert.equal(publicProfileOf(hidden, dash, "user_1")!.hidden, true);
    assert.ok(!JSON.stringify(publicProfileOf(hidden, dash, "user_2")).includes("idden"));
  });

  it("is nothing when the account vanished between the two reads", () => {
    assert.equal(publicProfileOf(user, { ...dash, me: null } as Parameters<typeof publicProfileOf>[1], null), null);
  });
});

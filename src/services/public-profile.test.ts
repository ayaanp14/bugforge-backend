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
    stats: { problemsSolved: 12, bugsFixed: 3, currentStreak: 2, longestStreak: 9, lastActive: new Date("2026-09-30T08:00:00Z") },
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
  submissions: { history: [{ id: "s1", title: "Two Sum", verdict: "ACCEPTED", language: "python" }], total: 1, page: 1, limit: 5 },
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
    assert.deepEqual(Object.keys(profile.user.stats!).sort(), ["bugsFixed", "currentStreak", "longestStreak", "problemsSolved"]);
  });

  it("shows standing credentials without their scores", () => {
    const profile = publicProfileOf(user, dash, null)!;
    assert.deepEqual(profile.credentials.map((c) => c.code), ["CK-7H3K-9QXM"]);
    assert.deepEqual(Object.keys(profile.credentials[0]!).sort(), ["band", "code", "expiresAt", "issuedAt", "level", "name", "skill", "testSlug"]);
    assert.ok(!JSON.stringify(profile).includes("73"), "a credential's score is the owner's");
  });

  it("lets no private value through, however it got onto the dashboard", () => {
    const text = JSON.stringify(publicProfileOf(user, dash, null));
    for (const secret of ["ayaan@example.com", "2000-01-01", "Male", "$2b$12$secret", "lastActive", "secret-draft", "savedInterviews", "pairing", "trends", "user_1"]) {
      assert.ok(!text.includes(secret), `leaked ${secret}`);
    }
  });

  it("knows the owner from anyone else", () => {
    assert.equal(publicProfileOf(user, dash, "user_1")!.isSelf, true);
    assert.equal(publicProfileOf(user, dash, "user_2")!.isSelf, false);
    assert.equal(publicProfileOf(user, dash, null)!.isSelf, false);
  });

  it("is nothing when the account vanished between the two reads", () => {
    assert.equal(publicProfileOf(user, { ...dash, me: null } as Parameters<typeof publicProfileOf>[1], null), null);
  });
});

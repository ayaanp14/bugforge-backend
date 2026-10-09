import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COHORT_LIMITS,
  goalWeek,
  inviteCode,
  joinRefusal,
  median,
  normalizeInviteCode,
  parseGoal,
  parseName,
  practiceSet,
  progressOf,
  readGoalSkills,
  sessionLive,
  successorOf,
  suggestGoal,
  type PracticeCandidate,
} from "./cohorts.js";

// Thursday 2026-10-08 18:00 IST.
const NOW = new Date("2026-10-08T12:30:00.000Z");

test("invite codes are eight Crockford symbols, and typed forms come back to the stored one", () => {
  const code = inviteCode(new Uint8Array([0x3a, 0x7f, 0x01, 0xc4, 0x99]));
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.equal(normalizeInviteCode(code.toLowerCase().replace("-", " ")), code);
  assert.equal(normalizeInviteCode("7H3K-9QXO"), "7H3K-9QX0");
  assert.equal(normalizeInviteCode("7h3k9qxl"), "7H3K-9QX1");
  assert.equal(normalizeInviteCode("7H3K-9QX"), null);
  assert.equal(normalizeInviteCode("7H3K-9QXU"), null);
  assert.equal(normalizeInviteCode(42), null);
  assert.notEqual(inviteCode(), inviteCode());
});

test("names are trimmed and bounded", () => {
  assert.deepEqual(parseName("  Night   owls "), { ok: "Night owls" });
  assert.ok("error" in parseName("a"));
  assert.ok("error" in parseName("x".repeat(COHORT_LIMITS.nameMax + 1)));
  assert.ok("error" in parseName(undefined));
});

test("a goal is one or two coding, SQL or debugging skills and a target of 1–20", () => {
  assert.deepEqual(parseGoal({ skills: ["dsa:sliding-window"], target: 5 }), { ok: { skills: ["dsa:sliding-window"], target: 5 } });
  assert.deepEqual(parseGoal({ skills: ["sql:joins", "debug:state", "sql:joins"], target: 3 }), { ok: { skills: ["sql:joins", "debug:state"], target: 3 } });
  assert.ok("error" in parseGoal({ skills: [], target: 5 }));
  assert.ok("error" in parseGoal({ skills: ["dsa:arrays", "dsa:strings", "dsa:matrix"], target: 5 }));
  // Fundamentals and aptitude have no catalogue to solve towards a count.
  assert.ok("error" in parseGoal({ skills: ["cs:os"], target: 5 }));
  assert.ok("error" in parseGoal({ skills: ["dsa:nope"], target: 5 }));
  assert.ok("error" in parseGoal({ skills: ["dsa:arrays"], target: 0 }));
  assert.ok("error" in parseGoal({ skills: ["dsa:arrays"], target: 21 }));
  assert.ok("error" in parseGoal({ skills: ["dsa:arrays"], target: 2.5 }));
  assert.deepEqual(readGoalSkills(["dsa:arrays", "gone:skill", 7]), ["dsa:arrays"]);
  assert.deepEqual(readGoalSkills(null), []);
});

test("joining: a member is admitted again; closed, full and over-the-cap are refused with a sentence", () => {
  const base = { closed: false, members: 3, isMember: false, accountCohorts: 1 };
  assert.equal(joinRefusal(base), null);
  assert.equal(joinRefusal({ ...base, isMember: true, members: 8, closed: true }), null);
  assert.match(joinRefusal({ ...base, closed: true })!, /closed/);
  assert.match(joinRefusal({ ...base, members: COHORT_LIMITS.members })!, /full: it already has 8 members/);
  assert.equal(joinRefusal({ ...base, members: COHORT_LIMITS.members - 1 }), null);
  assert.match(joinRefusal({ ...base, accountCohorts: COHORT_LIMITS.perAccount })!, /Leave one/);
});

test("the owner's successor is the earliest member left; nobody left closes it", () => {
  const m = [
    { userId: "owner", joinedAt: new Date("2026-10-01") },
    { userId: "late", joinedAt: new Date("2026-10-05") },
    { userId: "early", joinedAt: new Date("2026-10-02") },
  ];
  assert.equal(successorOf(m, "owner"), "early");
  assert.equal(successorOf([m[0]!], "owner"), null);
});

test("the week runs Monday 00:00 to Sunday 23:59 IST", () => {
  const w = goalWeek(NOW);
  assert.equal(w.key, "2026-10-05");
  assert.equal(w.start.toISOString(), "2026-10-04T18:30:00.000Z");
  assert.equal(w.end.toISOString(), "2026-10-11T18:30:00.000Z");
  assert.equal(w.day, 4);
  // Sunday 23:59 IST is still the same week; Monday 00:00 IST is the next.
  assert.equal(goalWeek(new Date("2026-10-11T18:29:00.000Z")).key, "2026-10-05");
  assert.equal(goalWeek(new Date("2026-10-11T18:30:00.000Z")).key, "2026-10-12");
});

test("progress counts distinct goal items first accepted this week, and active days from any submission", () => {
  const w = goalWeek(NOW);
  const at = (iso: string) => new Date(iso);
  const progress = progressOf(
    ["a", "b", "c"],
    { skills: ["dsa:sliding-window", "sql:joins"], target: 2 },
    [
      { userId: "a", source: "problem", ref: "p1", at: at("2026-10-06T05:00:00Z"), skills: ["dsa:sliding-window", "dsa:strings"] },
      { userId: "a", source: "sql", ref: "join-1", at: at("2026-10-07T05:00:00Z"), skills: ["sql:joins"] },
      // Off-goal and last week's: neither counts.
      { userId: "a", source: "problem", ref: "p2", at: at("2026-10-07T05:00:00Z"), skills: ["dsa:trees"] },
      { userId: "b", source: "problem", ref: "p1", at: at("2026-10-03T05:00:00Z"), skills: ["dsa:sliding-window"] },
      // The same ref twice is one.
      { userId: "b", source: "problem", ref: "p3", at: at("2026-10-06T05:00:00Z"), skills: ["dsa:sliding-window"] },
      { userId: "b", source: "problem", ref: "p3", at: at("2026-10-07T05:00:00Z"), skills: ["dsa:sliding-window"] },
    ],
    [
      { userId: "a", at: at("2026-10-06T05:00:00Z") },
      { userId: "a", at: at("2026-10-06T09:00:00Z") },
      { userId: "a", at: at("2026-10-07T05:00:00Z") },
      { userId: "c", at: at("2026-10-01T05:00:00Z") },
      { userId: "c", at: at("2026-10-08T05:00:00Z") },
    ],
    w,
  );
  assert.deepEqual(progress.members, [
    { userId: "a", solved: 2, target: 2, met: true, activeDays: 2 },
    { userId: "b", solved: 1, target: 2, met: false, activeDays: 0 },
    { userId: "c", solved: 0, target: 2, met: false, activeDays: 1 },
  ]);
  assert.equal(progress.met, 1);
  assert.equal(progress.together, 3);
  // Order is the members' order as given — never by how much they did.
  assert.deepEqual(progressOf(["c", "a"], { skills: ["dsa:arrays"], target: 1 }, [], [], w).members.map((m) => m.userId), ["c", "a"]);
});

test("the suggestion is a goal skill two members share, never one person's", () => {
  assert.equal(suggestGoal([["dsa:trees", "dsa:graph"], ["dsa:graph", "sql:joins"], ["sql:joins"]]), "dsa:graph");
  // A tie goes to the earlier one in the learning order.
  assert.equal(suggestGoal([["sql:joins", "dsa:arrays"], ["dsa:arrays", "sql:joins"]]), "dsa:arrays");
  // Nothing shared: no suggestion that would point at one member.
  assert.equal(suggestGoal([["dsa:trees"], ["dsa:graph"]]), null);
  // Fundamentals are not goals and are passed over; then only a member's three weakest goal skills count.
  assert.equal(suggestGoal([["cs:os", "dsa:arrays", "dsa:strings", "dsa:matrix", "dsa:trees"], ["cs:os", "dsa:trees"]]), null);
  assert.equal(suggestGoal([["cs:os", "dsa:arrays", "dsa:trees"], ["cs:os", "dsa:trees"]]), "dsa:trees");
  // A cohort of one is its owner reading their own weakness.
  assert.equal(suggestGoal([["dsa:trees"]]), "dsa:trees");
  assert.equal(suggestGoal([]), null);
});

test("the practice set skips what most have solved, aims at the median's difficulty, and alternates skills", () => {
  const c = (ref: string, difficulty: "easy" | "medium" | "hard", skills: string[], number: number): PracticeCandidate => ({
    source: "problem",
    ref,
    slug: ref,
    title: ref,
    href: `/problems/${ref}`,
    difficulty,
    number,
    skills,
  });
  const candidates = [
    c("e1", "easy", ["dsa:sliding-window"], 1),
    c("m1", "medium", ["dsa:sliding-window"], 2),
    c("m2", "medium", ["dsa:sliding-window"], 3),
    c("h1", "hard", ["dsa:sliding-window"], 4),
    c("j1", "easy", ["sql:joins"], 5),
    c("j2", "medium", ["sql:joins"], 6),
  ];
  const solvedBy = new Map([
    ["problem:m1", 3],
    ["problem:m2", 2],
  ]);
  const set = practiceSet({ skills: ["dsa:sliding-window", "sql:joins"], target: 3 }, candidates, solvedBy, 4, new Map([["dsa:sliding-window", 40]]), 4);
  // m1 is solved by 3 of 4 — gone; m2 by half — kept. Medium first for 40%; SQL at 0% wants Easy.
  assert.deepEqual(
    set.map((i) => [i.ref, i.skill, i.solvedBy]),
    [
      ["m2", "dsa:sliding-window", 2],
      ["j1", "sql:joins", 0],
      ["e1", "dsa:sliding-window", 0],
      ["j2", "sql:joins", 0],
    ],
  );
  assert.equal("skills" in set[0]!, false);
  assert.equal(median([70, 10, 40]), 40);
  assert.equal(median([10, 40, 70, 90]), 40);
  assert.equal(median([]), 0);
});

test("a session is live while someone is in it or within the hour of its start", () => {
  const now = NOW.getTime();
  const started = new Date(now - 30 * 60_000);
  const old = new Date(now - 2 * 3_600_000);
  assert.equal(sessionLive({ status: "active", startedAt: started }, 0, now), true);
  assert.equal(sessionLive({ status: "active", startedAt: old }, 0, now), false);
  assert.equal(sessionLive({ status: "active", startedAt: old }, 2, now), true);
  assert.equal(sessionLive({ status: "closed", startedAt: started }, 2, now), false);
});

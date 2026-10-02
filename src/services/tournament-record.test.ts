import { test } from "node:test";
import assert from "node:assert/strict";
import { knockoutPlacement, matchesByTournament, type PlayerMatch } from "./tournament-record.js";
import { placementLabel, roundName } from "./knockout-rules.js";

// The profile's Tournaments section reads every knockout's matches in one
// query since 2026-10-03, where it used to read them a tournament at a time.
// These pin that the grouping hands each tournament exactly what its own
// read did, and that the placement rule is the one it always was — the old
// inline code is kept below as the reference the new one must agree with.

const ME = "me";
const RIVAL = "rival";

/** What tournamentsFor computed per knockout before the batching, verbatim. */
function reference(t: { championId: string | null; finishedAt: Date | null }, userId: string, matches: Pick<PlayerMatch, "round" | "status" | "winnerId">[], rounds: number) {
  const last = matches[0];
  if (t.championId === userId) return { state: "finished", placement: "Champion", podium: true };
  if (!last || rounds === 0) return { state: t.finishedAt ? "finished" : "live", placement: null, podium: false };
  const out = last.status === "done" && last.winnerId !== userId;
  if (!out) return { state: "live", placement: `In the ${roundName(last.round, rounds)}`, podium: false };
  const label = placementLabel(last.round, false, rounds);
  return { state: t.finishedAt ? "finished" : "live", placement: label, podium: last.round >= rounds - 1 };
}

test("matchesByTournament: one list per tournament, latest round first", () => {
  const rows: PlayerMatch[] = [
    { tournamentId: "a", round: 1, status: "done", winnerId: ME },
    { tournamentId: "b", round: 2, status: "live", winnerId: null },
    { tournamentId: "a", round: 3, status: "live", winnerId: null },
    { tournamentId: "b", round: 1, status: "done", winnerId: ME },
    { tournamentId: "a", round: 2, status: "done", winnerId: ME },
  ];
  const by = matchesByTournament(rows);
  assert.deepEqual([...by.keys()].sort(), ["a", "b"]);
  assert.deepEqual(by.get("a")!.map((m) => m.round), [3, 2, 1]);
  assert.deepEqual(by.get("b")!.map((m) => m.round), [2, 1]);
  assert.equal(by.get("c"), undefined);
  assert.equal(matchesByTournament([]).size, 0);
});

test("knockoutPlacement: the same answer as the per-tournament code, over every shape", () => {
  const finishedAt = new Date("2026-10-01T10:00:00Z");
  const tournaments = [
    { championId: null, finishedAt: null },
    { championId: ME, finishedAt },
    { championId: RIVAL, finishedAt },
    { championId: null, finishedAt },
  ];
  const histories: Pick<PlayerMatch, "round" | "status" | "winnerId">[][] = [[]];
  for (let round = 1; round <= 4; round++) {
    for (const last of [
      { round, status: "live", winnerId: null },
      { round, status: "waiting", winnerId: null },
      { round, status: "done", winnerId: ME },
      { round, status: "done", winnerId: RIVAL },
    ]) {
      const earlier = Array.from({ length: round - 1 }, (_, i) => ({ round: round - 1 - i, status: "done", winnerId: ME }));
      histories.push([last, ...earlier]);
    }
  }
  let cases = 0;
  for (const t of tournaments) {
    for (const matches of histories) {
      for (const rounds of [0, 1, 2, 3, 4, 5]) {
        assert.deepEqual(knockoutPlacement(t, ME, matches, rounds), reference(t, ME, matches, rounds), JSON.stringify({ t, matches, rounds }));
        cases++;
      }
    }
  }
  assert.ok(cases > 300);
});

test("knockoutPlacement: the profile's words", () => {
  const finishedAt = new Date("2026-10-01T10:00:00Z");
  assert.deepEqual(knockoutPlacement({ championId: ME, finishedAt }, ME, [], 3), { state: "finished", placement: "Champion", podium: true });
  // Lost the final of three rounds.
  assert.deepEqual(knockoutPlacement({ championId: RIVAL, finishedAt }, ME, [{ round: 3, status: "done", winnerId: RIVAL }], 3), {
    state: "finished",
    placement: "Runner-up",
    podium: true,
  });
  // Still in it, in the semifinal.
  assert.deepEqual(knockoutPlacement({ championId: null, finishedAt: null }, ME, [{ round: 2, status: "live", winnerId: null }], 3), {
    state: "live",
    placement: "In the Semifinal",
    podium: false,
  });
  // Out in the first of four rounds.
  assert.deepEqual(knockoutPlacement({ championId: null, finishedAt: null }, ME, [{ round: 1, status: "done", winnerId: RIVAL }], 4), {
    state: "live",
    placement: "Round of 16",
    podium: false,
  });
  // Before the draw: no rounds yet.
  assert.deepEqual(knockoutPlacement({ championId: null, finishedAt: null }, ME, [], 0), { state: "live", placement: null, podium: false });
});

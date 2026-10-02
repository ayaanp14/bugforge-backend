import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LIVE_DRAFT_TTL_MS,
  LiveDrafts,
  MAX_CODE_CHARS,
  Relay,
  activityOf,
  matchPlayRoom,
  matchSpectateRoom,
  matchWatchRoom,
  sendActivity,
  playAllowed,
  registerMatchWatch,
  relayAllowed,
  sanitizeDraft,
  watchAllowed,
  type Seat,
  type WatchSocket,
} from "./match-watch-rules.js";

/** The live code relay of a knockout match (match-watch-rules.ts), driven with fake sockets. Run with: npm test */

const now = Date.now();
const live = (side: "a" | "b" | null, manager = false): Seat => ({
  side,
  manager,
  status: "live",
  startedAt: new Date(now - 60_000),
  endsAt: new Date(now + 60_000),
});

describe("who may do what", () => {
  it("relays a player's code only while their match is being played", () => {
    assert.equal(relayAllowed(live("a"), now), true);
    assert.equal(relayAllowed(live(null, true), now), false, "an organizer has no code to relay");
    assert.equal(relayAllowed({ ...live("b")!, startedAt: new Date(now + 5_000) }, now), false, "the break before the start");
    assert.equal(relayAllowed({ ...live("b")!, endsAt: new Date(now - 1) }, now), false, "the clock ran out");
    assert.equal(relayAllowed({ ...live("a")!, status: "done" }, now), false, "decided");
    assert.equal(relayAllowed({ ...live("a")!, status: "waiting", startedAt: null }, now), false);
    assert.equal(relayAllowed(null, now), false);
  });

  it("lets a player open the relay during the break, not after the match", () => {
    assert.equal(playAllowed({ ...live("a")!, status: "waiting", startedAt: null }), true);
    assert.equal(playAllowed({ ...live("a")!, status: "done" }), false);
    assert.equal(playAllowed(live(null, true)), false);
  });

  it("lets only staff who do not play in the match watch it", () => {
    assert.equal(watchAllowed(live(null, true)), true);
    assert.equal(watchAllowed({ ...live(null)!, admin: true }), true, "a CodeKairo admin");
    assert.equal(watchAllowed(live(null, false)), false, "a stranger");
    assert.equal(watchAllowed({ ...live("a")!, manager: true }), false, "a player never sees the other side");
    assert.equal(watchAllowed({ ...live("b")!, admin: true }), false, "not even an admin who plays");
    assert.equal(watchAllowed(null), false);
  });
});

describe("what is relayed", () => {
  it("takes a buffer in one of the editor's languages and under the submit cap", () => {
    assert.deepEqual(sanitizeDraft({ matchId: "m1", code: "x = 1", language: "python" }), { matchId: "m1", code: "x = 1", language: "python" });
    assert.equal(sanitizeDraft({ matchId: "m1", code: "x", language: "brainfuck" }), null);
    assert.equal(sanitizeDraft({ matchId: "m1", code: "x".repeat(MAX_CODE_CHARS + 1), language: "c" }), null);
    assert.equal(sanitizeDraft({ matchId: "", code: "", language: "c" }), null);
    assert.equal(sanitizeDraft({ matchId: "m1", code: 42, language: "c" }), null);
    assert.equal(sanitizeDraft("m1"), null);
    assert.deepEqual(sanitizeDraft({ matchId: "m1", code: "", language: "go" }), { matchId: "m1", code: "", language: "go" }, "an emptied editor is news too");
  });

  it("keeps the latest buffer per side and forgets a match after its last change", () => {
    const d = new LiveDrafts();
    d.set("m1", "a", { code: "one", language: "c", at: 1 });
    d.set("m1", "a", { code: "two", language: "c", at: 2 });
    d.set("m1", "b", { code: "b", language: "go", at: 3 });
    assert.deepEqual(d.get("m1"), { a: { code: "two", language: "c", at: 2 }, b: { code: "b", language: "go", at: 3 } });
    assert.deepEqual(d.get("m2"), { a: null, b: null });
    d.sweep(3 + LIVE_DRAFT_TTL_MS);
    assert.equal(d.size, 1, "within the TTL of the last change");
    d.sweep(4 + LIVE_DRAFT_TTL_MS);
    assert.equal(d.size, 0);
  });
});

/** A socket.io stand-in: the rooms it joined, the handlers it registered, and what the server emitted where. */
function fakes(userId: string | undefined, seats: Record<string, Seat>, publicMatches: string[] = []) {
  const emitted: { room: string; event: string; payload: any }[] = [];
  const io = { to: (room: string) => ({ emit: (event: string, payload: unknown) => emitted.push({ room, event, payload }) }) };
  const handlers = new Map<string, (...args: any[]) => unknown>();
  const socket: WatchSocket = {
    data: { userId },
    rooms: new Set<string>(),
    join: (room) => socket.rooms.add(room),
    leave: (room) => socket.rooms.delete(room),
    on: (event, fn) => handlers.set(event, fn),
  };
  const drafts = new LiveDrafts();
  const relay = new Relay(drafts, 0);
  const activity = new Relay(drafts, 0, sendActivity);
  registerMatchWatch(io, socket, {
    drafts,
    relay,
    activity,
    seatOf: async (_u, matchId) => seats[matchId] ?? null,
    isPublicMatch: async (matchId) => publicMatches.includes(matchId),
  });
  const call = (event: string, ...args: unknown[]) => handlers.get(event)!(...args);
  const ask = (event: string, arg: unknown) => new Promise<any>((resolve) => void call(event, arg, resolve));
  return { io, socket, drafts, emitted, call, ask };
}
const settle = () => new Promise((r) => setImmediate(r));

describe("the socket protocol", () => {
  it("relays a seated player's code to the watch room, and nothing from a socket that did not open the relay", async () => {
    const f = fakes("pa", { m1: live("a") });
    await f.call("match-code", { matchId: "m1", code: "early", language: "javascript" });
    await settle();
    assert.equal(f.emitted.length, 0, "not admitted yet");
    assert.deepEqual(await f.ask("play-match", "m1"), { ok: true });
    assert.ok(f.socket.rooms.has(matchPlayRoom("m1")));
    await f.call("match-code", { matchId: "m1", code: "let x", language: "javascript" });
    await settle();
    // The code to the watchers, the activity alone to the spectators.
    assert.equal(f.emitted.length, 2);
    assert.equal(f.emitted[0]!.room, matchWatchRoom("m1"));
    assert.equal(f.emitted[0]!.event, "match-code");
    assert.deepEqual({ ...f.emitted[0]!.payload, at: 0 }, { matchId: "m1", side: "a", code: "let x", language: "javascript", at: 0 });
    assert.equal(f.emitted[1]!.room, matchSpectateRoom("m1"));
    assert.equal(f.emitted[1]!.event, "match-activity");
    assert.deepEqual({ ...f.emitted[1]!.payload, at: 0 }, { matchId: "m1", side: "a", language: "javascript", lines: 1, at: 0 });
    assert.ok(!("code" in f.emitted[1]!.payload), "a spectator never gets the code");
  });

  it("refuses the relay to anyone who is not a player of the match", async () => {
    assert.deepEqual(await fakes("org", { m1: live(null, true) }).ask("play-match", "m1"), { ok: false });
    assert.deepEqual(await fakes(undefined, { m1: live("a") }).ask("play-match", "m1"), { ok: false }, "an anonymous socket");
    assert.deepEqual(await fakes("pa", {}).ask("play-match", "nope"), { ok: false });
  });

  it("lets an organizer watch with both sides' snapshot, and asks the players to resend a side it lacks", async () => {
    const f = fakes("org", { m1: live(null, true) });
    f.drafts.set("m1", "a", { code: "a-side", language: "python", at: 5 });
    const res = await f.ask("watch-match", "m1");
    assert.equal(res.ok, true);
    assert.equal(res.a.code, "a-side");
    assert.equal(res.b, null);
    assert.ok(f.socket.rooms.has(matchWatchRoom("m1")));
    assert.deepEqual(f.emitted, [{ room: matchPlayRoom("m1"), event: "match-code-resend", payload: { matchId: "m1" } }]);
    f.call("unwatch-match", "m1");
    assert.ok(!f.socket.rooms.has(matchWatchRoom("m1")));
  });

  it("never lets a player watch their own match, even one who organizes the tournament", async () => {
    const f = fakes("pa", { m1: { ...live("a")!, manager: true } });
    assert.deepEqual(await f.ask("watch-match", "m1"), { ok: false });
    assert.ok(!f.socket.rooms.has(matchWatchRoom("m1")));
  });

  it("lets anyone spectate a public match — anonymous too — with each side's activity and never its code", async () => {
    const f = fakes(undefined, {}, ["m1"]);
    f.drafts.set("m1", "b", { code: "def f():\n    return 1\n", language: "python", at: 9 });
    const res = await f.ask("spectate-match", "m1");
    assert.deepEqual(res, { ok: true, a: null, b: { language: "python", lines: 3, at: 9 } });
    assert.ok(f.socket.rooms.has(matchSpectateRoom("m1")));
    assert.ok(!f.socket.rooms.has(matchWatchRoom("m1")), "spectating is not watching");
    assert.deepEqual(await f.ask("watch-match", "m1"), { ok: false }, "and gives no way into the code");
    f.call("unspectate-match", "m1");
    assert.ok(!f.socket.rooms.has(matchSpectateRoom("m1")));
  });

  it("refuses to spectate a match that is not public", async () => {
    const f = fakes("someone", {}, []);
    assert.deepEqual(await f.ask("spectate-match", "draft-match"), { ok: false });
    assert.equal(f.socket.rooms.size, 0);
    assert.deepEqual(await f.ask("spectate-match", 42), { ok: false });
  });
});

describe("what a spectator learns", () => {
  it("is the language, the line count and when it changed", () => {
    assert.deepEqual(activityOf({ code: "a\nb", language: "go", at: 4 }), { language: "go", lines: 2, at: 4 });
    assert.deepEqual(activityOf({ code: "", language: "go", at: 4 }), { language: "go", lines: 0, at: 4 }, "an emptied editor has no lines");
    assert.equal(activityOf(null), null);
  });
});

describe("the relay's pace", () => {
  it("holds changes inside the gap and sends the latest when it closes", async () => {
    const drafts = new LiveDrafts();
    const relay = new Relay(drafts, 40);
    const sent: string[] = [];
    const io = { to: () => ({ emit: (_e: string, p: any) => sent.push(p.code) }) };
    drafts.set("m", "a", { code: "1", language: "c", at: 1 });
    relay.push(io, "m", "a");
    for (const code of ["2", "3", "4"]) {
      drafts.set("m", "a", { code, language: "c", at: 2 });
      relay.push(io, "m", "a");
    }
    assert.deepEqual(sent, ["1"], "the first goes at once, the rest wait");
    await new Promise((r) => setTimeout(r, 60));
    assert.deepEqual(sent, ["1", "4"], "one trailing send, with the last keystroke");
  });
});

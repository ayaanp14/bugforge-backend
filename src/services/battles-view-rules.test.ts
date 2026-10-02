import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CODE_PUBLIC_FROM, codeHiddenReason, codeIsPublic, inMatchWindow, mayRead, mayReadCode, resultsFinal, viewerRole, type ViewedTournament } from "./battles-view-rules.js";

/** Who may read what of a running or finished tournament (battles-view-rules.ts). Run with: npm test */

const after = new Date(CODE_PUBLIC_FROM.getTime() + 24 * 3600_000);
const knockout = (over: Partial<ViewedTournament> = {}): ViewedTournament => ({
  format: "knockout",
  status: "published",
  startsAt: after,
  durationMinutes: 20,
  freezeMinutes: 0,
  finishedAt: null,
  resultsRevealedAt: null,
  orgVerified: true,
  ...over,
});
const icpc = (over: Partial<ViewedTournament> = {}) => knockout({ format: "icpc", durationMinutes: 120, ...over });
const at = (t: ViewedTournament, minutes: number) => new Date(t.startsAt.getTime() + minutes * 60_000);

describe("roles", () => {
  it("puts playing first, then organizer, then admin", () => {
    assert.equal(viewerRole({ player: true, organizer: true, admin: true }), "player");
    assert.equal(viewerRole({ player: false, organizer: true, admin: true }), "organizer");
    assert.equal(viewerRole({ player: false, organizer: false, admin: true }), "admin");
    assert.equal(viewerRole({ player: false, organizer: false, admin: false }), "spectator");
  });

  it("lets staff read a hidden tournament and everyone else only a public one", () => {
    for (const status of ["draft", "review"]) {
      assert.equal(mayRead({ status, orgVerified: true }, "spectator"), false, status);
      assert.equal(mayRead({ status, orgVerified: true }, "admin"), true, status);
      assert.equal(mayRead({ status, orgVerified: true }, "organizer"), true, status);
    }
    assert.equal(mayRead({ status: "published", orgVerified: false }, "player"), false);
    assert.equal(mayRead({ status: "published", orgVerified: true }, "spectator"), true);
    assert.equal(mayRead({ status: "cancelled", orgVerified: true }, "spectator"), true);
  });
});

describe("when results are final", () => {
  it("a knockout: once its champion is decided", () => {
    const t = knockout();
    assert.equal(resultsFinal(t, at(t, 600)), false);
    assert.equal(resultsFinal(knockout({ finishedAt: at(t, 50) }), at(t, 51)), true);
  });

  it("an ICPC contest: after the clock, and after the reveal when it froze", () => {
    const open = icpc();
    assert.equal(resultsFinal(open, at(open, 119)), false);
    assert.equal(resultsFinal(open, at(open, 120)), true, "no freeze: final at the end");
    const frozen = icpc({ freezeMinutes: 30 });
    assert.equal(resultsFinal(frozen, at(frozen, 125)), false, "frozen board, not revealed");
    assert.equal(resultsFinal(icpc({ freezeMinutes: 30, resultsRevealedAt: at(frozen, 130) }), at(frozen, 131)), true);
    // A freeze as long as the contest is no freeze at all (contest-rules freezeAt).
    const whole = icpc({ freezeMinutes: 120 });
    assert.equal(resultsFinal(whole, at(whole, 121)), true);
  });

  it("never for a cancelled or hidden one", () => {
    const t = knockout({ status: "cancelled", finishedAt: after });
    assert.equal(resultsFinal(t, at(t, 600)), false);
    assert.equal(resultsFinal(knockout({ status: "review", finishedAt: after }), at(t, 600)), false);
  });
});

describe("the code", () => {
  it("is public once the results are final, for a tournament started under the new policy", () => {
    const done = knockout({ finishedAt: at(knockout(), 40) });
    assert.equal(codeIsPublic(done, at(done, 41)), true);
    assert.equal(codeIsPublic(knockout(), at(done, 41)), false, "still running");
    const old = knockout({ startsAt: new Date(CODE_PUBLIC_FROM.getTime() - 1), finishedAt: CODE_PUBLIC_FROM });
    assert.equal(codeIsPublic(old, after), false, "started before the policy");
  });

  it("is readable by staff and its author any time, by others when public", () => {
    assert.equal(mayReadCode("organizer", false, false), true);
    assert.equal(mayReadCode("admin", false, false), true);
    assert.equal(mayReadCode("player", true, false), true, "own attempt");
    assert.equal(mayReadCode("player", false, false), false, "the opponent's, mid-tournament");
    assert.equal(mayReadCode("spectator", false, false), false);
    assert.equal(mayReadCode("spectator", false, true), true);
  });

  it("says why it is hidden", () => {
    const t = knockout();
    assert.match(codeHiddenReason(t, at(t, 5)), /when the tournament ends/);
    assert.match(codeHiddenReason(knockout({ status: "cancelled" }), at(t, 5)), /cancelled/);
    assert.match(codeHiddenReason(knockout({ startsAt: new Date(CODE_PUBLIC_FROM.getTime() - 1) }), after), /not published/);
    const frozen = icpc({ freezeMinutes: 30 });
    assert.match(codeHiddenReason(frozen, at(frozen, 125)), /reveals the final standings/);
  });
});

describe("a knockout attempt's match", () => {
  it("is the one whose clock it was submitted inside", () => {
    const m = { startedAt: new Date(1_000), endsAt: new Date(5_000) };
    assert.equal(inMatchWindow(new Date(999), m), false);
    assert.equal(inMatchWindow(new Date(1_000), m), true);
    assert.equal(inMatchWindow(new Date(4_999), m), true);
    assert.equal(inMatchWindow(new Date(5_000), m), false);
    assert.equal(inMatchWindow(new Date(2_000), { startedAt: null, endsAt: null }), false);
  });
});

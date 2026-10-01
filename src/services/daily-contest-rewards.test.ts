import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONTEST_SOLVE_XP,
  contestDayLabel,
  contestPayoutPeriod,
  contestRewardNotice,
  contestRewardXp,
  dayPayouts,
} from "./daily-contest-rewards.js";

/**
 * The contest payout's pure parts: what each rank is paid, the board order
 * turned into payouts, when the job is due, and what the notification says.
 * The XP is real money on the leaderboard, so the amounts are pinned here
 * without a database.
 *
 * Run with: npm test
 */

const at = (iso: string) => new Date(iso);

describe("contest reward amounts", () => {
  it("pays 20 a solve, +15 to the fastest and +10 to the second", () => {
    assert.equal(CONTEST_SOLVE_XP, 20);
    assert.equal(contestRewardXp(1), 35);
    assert.equal(contestRewardXp(2), 30);
    assert.equal(contestRewardXp(3), 20);
    assert.equal(contestRewardXp(250), 20);
  });

  it("ranks solvers in the order given (the board's) and keeps what was already paid", () => {
    const payouts = dayPayouts([
      { id: "e1", userId: "u1", rewardXp: null },
      { id: "e2", userId: "u2", rewardXp: 30 },
      { id: "e3", userId: "u3", rewardXp: null },
    ]);
    assert.deepEqual(payouts, [
      { entryId: "e1", userId: "u1", rank: 1, xp: 35, paid: false },
      { entryId: "e2", userId: "u2", rank: 2, xp: 30, paid: true },
      { entryId: "e3", userId: "u3", rank: 3, xp: 20, paid: false },
    ]);
  });

  it("a lone solver takes first place", () => {
    assert.deepEqual(dayPayouts([{ id: "e1", userId: "u1", rewardXp: null }]).map((p) => p.xp), [35]);
    assert.deepEqual(dayPayouts([]), []);
  });
});

describe("payout window", () => {
  it("is due from two minutes past midnight UTC for the rest of the day, keyed by the new day", () => {
    assert.equal(contestPayoutPeriod(at("2026-10-02T00:00:00Z")), null);
    assert.equal(contestPayoutPeriod(at("2026-10-02T00:01:59Z")), null);
    assert.equal(contestPayoutPeriod(at("2026-10-02T00:02:00Z")), "2026-10-02"); // 05:32 IST
    assert.equal(contestPayoutPeriod(at("2026-10-02T23:59:59Z")), "2026-10-02"); // a process down at midnight still pays
  });
});

describe("reward notification", () => {
  it("names the day the way people read it", () => {
    assert.equal(contestDayLabel("2026-10-01"), "1 Oct");
    assert.equal(contestDayLabel("2026-12-31"), "31 Dec");
  });

  it("tells the fastest what the bonus was for", () => {
    const n = contestRewardNotice({ date: "2026-10-01", problem: "Two Sum", rank: 1, solvers: 12, xp: 35 });
    assert.equal(n.title, "Fastest on 1 Oct's problem 🥇 +35 XP");
    assert.match(n.body, /first of 12: 20 XP for solving it and 15 for first place/);
    assert.equal(n.href, "/contests?date=2026-10-01");
  });

  it("does not call a lone solver 'first of 1'", () => {
    const n = contestRewardNotice({ date: "2026-10-01", problem: "Two Sum", rank: 1, solvers: 1, xp: 35 });
    assert.match(n.body, /only one to solve Two Sum on 1 Oct: 20 XP for solving it and 15 for first place/);
  });

  it("tells second place, and what first would have paid", () => {
    const n = contestRewardNotice({ date: "2026-10-01", problem: "Two Sum", rank: 2, solvers: 12, xp: 30 });
    assert.equal(n.title, "Second fastest on 1 Oct's problem 🥈 +30 XP");
    assert.match(n.body, /second of 12: 20 XP for solving it and 10 for second place/);
    assert.match(n.body, /first place pays 15 more/);
  });

  it("tells everyone else their place and the solve's XP", () => {
    const n = contestRewardNotice({ date: "2026-10-01", problem: "Two Sum", rank: 7, solvers: 12, xp: 20 });
    assert.equal(n.title, "Daily contest solved ✅ +20 XP");
    assert.match(n.body, /finished #7 of 12: 20 XP for solving it/);
  });
});

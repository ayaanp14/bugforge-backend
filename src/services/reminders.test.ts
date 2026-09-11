import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dailyKataContent,
  dailyKataPeriod,
  streakAtRiskContent,
  streakAtRiskPeriod,
  weeklyDigestContent,
  weeklyDigestPeriod,
} from "./reminders.js";

// The product calendar is IST (UTC+5:30, lib/clock.ts). Instants below are
// written in UTC and annotated with the IST wall clock they correspond to.
const at = (iso: string) => new Date(iso);

describe("reminder windows", () => {
  it("streak-at-risk is due between 18:00 and 20:00 IST, keyed by the IST day", () => {
    assert.equal(streakAtRiskPeriod(at("2026-09-11T12:29:00Z")), null); // 17:59 IST
    assert.equal(streakAtRiskPeriod(at("2026-09-11T12:30:00Z")), "2026-09-11"); // 18:00 IST
    assert.equal(streakAtRiskPeriod(at("2026-09-11T14:29:00Z")), "2026-09-11"); // 19:59 IST
    assert.equal(streakAtRiskPeriod(at("2026-09-11T14:30:00Z")), null); // 20:00 IST
    // Late evening UTC is already the next IST day.
    assert.equal(streakAtRiskPeriod(at("2026-09-11T19:00:00Z")), null); // 00:30 IST next day
  });

  it("today's kata is due 06:00–09:00 IST and keyed by the UTC contest day", () => {
    assert.equal(dailyKataPeriod(at("2026-09-11T00:29:00Z")), null); // 05:59 IST
    assert.equal(dailyKataPeriod(at("2026-09-11T00:30:00Z")), "2026-09-11"); // 06:00 IST, contest day rolled at 00:00Z
    assert.equal(dailyKataPeriod(at("2026-09-11T03:29:00Z")), "2026-09-11"); // 08:59 IST
    assert.equal(dailyKataPeriod(at("2026-09-11T03:30:00Z")), null); // 09:00 IST
  });

  it("the digest is due Monday 08:00–11:00 IST and keyed by that Monday", () => {
    // 2026-09-14 is a Monday.
    assert.equal(weeklyDigestPeriod(at("2026-09-14T02:29:00Z")), null); // 07:59 IST Mon
    assert.equal(weeklyDigestPeriod(at("2026-09-14T02:30:00Z")), "2026-09-14"); // 08:00 IST Mon
    assert.equal(weeklyDigestPeriod(at("2026-09-14T05:29:00Z")), "2026-09-14"); // 10:59 IST Mon
    assert.equal(weeklyDigestPeriod(at("2026-09-14T05:30:00Z")), null); // 11:00 IST Mon
    assert.equal(weeklyDigestPeriod(at("2026-09-15T03:00:00Z")), null); // Tuesday
    // Sunday 20:00 UTC is Monday 01:30 IST — a Monday, but before the window.
    assert.equal(weeklyDigestPeriod(at("2026-09-13T20:00:00Z")), null);
  });
});

describe("reminder copy", () => {
  it("names the streak length and where to go", () => {
    const one = streakAtRiskContent(1);
    assert.equal(one.title, "Your 1-day streak ends at midnight 🔥");
    const seven = streakAtRiskContent(7);
    assert.equal(seven.subject, "Your 7-day CodeKairo streak ends tonight");
    assert.equal(seven.href, "/contests");
    assert.match(seven.text, /\/contests/);
    assert.match(seven.text, /Profile → Reminders/);
  });

  it("capitalises the difficulty in the kata announcement", () => {
    const c = dailyKataContent({ title: "Two Sum", difficulty: "easy" });
    assert.equal(c.title, "Today's kata: Two Sum (Easy)");
    assert.equal(c.href, "/contests");
  });

  it("summarises a week and picks the right nudge", () => {
    const quiet = weeklyDigestContent("Ayaan Pathan", { solved: 0, bugs: 0, contestPoints: 0, streak: 0, xp: 120 });
    assert.equal(quiet.subject, "A quiet week in the dojo");
    assert.match(quiet.body, /^0 katas, 0 bugs this week\. A quiet week/);
    assert.match(quiet.text, /^Ayaan, here is your week/);

    const busy = weeklyDigestContent(null, { solved: 1, bugs: 2, contestPoints: 9, streak: 4, xp: 500 });
    assert.equal(busy.subject, "This week: 1 kata, 2 bugs, 9 contest points");
    assert.match(busy.body, /· 4-day streak\. Your 4-day streak is alive/);
    assert.match(busy.text, /^Here is your week/);

    const noStreak = weeklyDigestContent("X", { solved: 3, bugs: 0, contestPoints: 0, streak: 0, xp: 1 });
    assert.match(noStreak.body, /Keep the blade sharp/);
    assert.doesNotMatch(noStreak.body, /contest point/);
  });
});

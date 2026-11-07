import test from "node:test";
import assert from "node:assert/strict";
import { FESTIVAL_BADGE_KIND, FESTIVAL_FRAME_KIND, festivalAnnouncePeriod, festivalKinds, festivalLighting, festivalShowing, litDays } from "./festival.js";
import { badgeById, countersOfMe, hasBadge } from "./badges.js";
import { honourDef } from "./honours.js";

const at = (iso: string) => new Date(iso);

test("the diyas follow the IST calendar, not UTC", () => {
  // 19:00 UTC on the 4th is 00:30 on the 5th in IST: the first diya's day.
  assert.deepEqual(litDays([at("2026-11-04T19:00:00Z")]), ["2026-11-05"]);
  // 18:00 UTC on the 4th is still 23:30 on the 4th in IST: too early.
  assert.deepEqual(litDays([at("2026-11-04T18:00:00Z")]), []);
});

test("several solves on one day light one diya, and the days come back in order", () => {
  assert.deepEqual(
    litDays([at("2026-11-08T12:00:00+05:30"), at("2026-11-06T09:00:00+05:30"), at("2026-11-08T20:00:00+05:30")]),
    ["2026-11-06", "2026-11-08"],
  );
});

test("a solve after the last day lights nothing", () => {
  assert.deepEqual(litDays([at("2026-11-12T00:00:00+05:30")]), []);
  assert.equal(festivalLighting(at("2026-11-11T23:59:00+05:30")), true);
  assert.equal(festivalLighting(at("2026-11-12T00:00:00+05:30")), false);
});

test("the strip shows through the day after and then stops by itself", () => {
  assert.equal(festivalShowing(at("2026-11-04T23:59:00+05:30")), false);
  assert.equal(festivalShowing(at("2026-11-05T00:00:00+05:30")), true);
  assert.equal(festivalShowing(at("2026-11-12T23:59:00+05:30")), true);
  assert.equal(festivalShowing(at("2026-11-13T00:00:00+05:30")), false);
});

test("the frame comes with the first diya and the badge only with all seven", () => {
  assert.deepEqual(festivalKinds(0), []);
  assert.deepEqual(festivalKinds(1), [FESTIVAL_FRAME_KIND]);
  assert.deepEqual(festivalKinds(6), [FESTIVAL_FRAME_KIND]);
  assert.deepEqual(festivalKinds(7), [FESTIVAL_FRAME_KIND, FESTIVAL_BADGE_KIND]);
});

test("the rewards are not honours: no star, no celebration, no lifetime access", () => {
  assert.equal(honourDef(FESTIVAL_FRAME_KIND), null);
  assert.equal(honourDef(FESTIVAL_BADGE_KIND), null);
});

test("the badge is held only with its row, so a share is checked against the account", () => {
  const badge = badgeById("festival-7")!;
  assert.equal(hasBadge(badge, countersOfMe({ honours: [{ kind: FESTIVAL_FRAME_KIND }] })), false);
  assert.equal(hasBadge(badge, countersOfMe({ honours: [{ kind: FESTIVAL_BADGE_KIND }] })), true);
});

test("the announcement is due on the first day only, and not overnight", () => {
  assert.equal(festivalAnnouncePeriod(at("2026-11-05T15:00:00+05:30"), 15), "diwali-2026");
  assert.equal(festivalAnnouncePeriod(at("2026-11-05T22:00:00+05:30"), 22), null);
  assert.equal(festivalAnnouncePeriod(at("2026-11-06T09:00:00+05:30"), 9), null);
});

/* ── the later notices ─────────────────────────────────────────────── */

import { DIWALI_PROBLEM, festivalNoticeFor, festivalNoticePeriod, onCourseForBadge } from "./festival.js";
import { isPushed } from "./push.js";

test("the notices are due on Diwali's day and the last two evenings only", () => {
  assert.equal(festivalNoticePeriod(at("2026-11-08T08:00:00+05:30"), 8), "diwali-2026-day");
  assert.equal(festivalNoticePeriod(at("2026-11-08T07:59:00+05:30"), 7), null);
  assert.equal(festivalNoticePeriod(at("2026-11-08T21:00:00+05:30"), 21), null);
  assert.equal(festivalNoticePeriod(at("2026-11-09T12:00:00+05:30"), 12), null);
  assert.equal(festivalNoticePeriod(at("2026-11-10T16:59:00+05:30"), 16), null);
  assert.equal(festivalNoticePeriod(at("2026-11-10T17:00:00+05:30"), 17), "diwali-2026-last:2026-11-10");
  assert.equal(festivalNoticePeriod(at("2026-11-11T21:30:00+05:30"), 21), "diwali-2026-last:2026-11-11");
  assert.equal(festivalNoticePeriod(at("2026-11-12T18:00:00+05:30"), 18), null);
});

test("on Diwali each account is told what its own lights show", () => {
  const none = festivalNoticeFor([], "2026-11-08")!;
  assert.match(none.title, /first diya/);
  assert.equal(none.href, `/problems/${DIWALI_PROBLEM.slug}`);
  assert.doesNotMatch(none.body, /badge/, "the badge is out of reach after a missed day");

  const two = festivalNoticeFor(["2026-11-05", "2026-11-07"], "2026-11-08")!;
  assert.match(two.title, /2 of 7/);
  assert.doesNotMatch(two.body, /badge/);

  const every = festivalNoticeFor(["2026-11-05", "2026-11-06", "2026-11-07"], "2026-11-08")!;
  assert.match(every.title, /card/);
  assert.match(every.body, /badge/);
  assert.equal(every.href, "/");

  const done = festivalNoticeFor(["2026-11-05", "2026-11-08"], "2026-11-08")!;
  assert.match(done.title, /lit/);
  assert.match(done.body, /2 of 7/);

  for (const n of [none, two, every, done]) assert.equal(n.type, "diwali_2026_day");
});

test("the last-chance nudge goes only to accounts the badge is still open to, with today dark", () => {
  const five = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];
  const tenth = festivalNoticeFor(five, "2026-11-10")!;
  assert.equal(tenth.type, "diwali_2026_last_2026-11-10");
  assert.match(tenth.title, /2 diyas left/);
  assert.equal(festivalNoticeFor(five.slice(1), "2026-11-10"), null, "a missed day: the badge is gone");
  assert.equal(festivalNoticeFor([...five, "2026-11-10"], "2026-11-10"), null, "already lit today");
  const eleventh = festivalNoticeFor([...five, "2026-11-10"], "2026-11-11")!;
  assert.match(eleventh.title, /one solve away/);
  assert.equal(festivalNoticeFor(five, "2026-11-09"), null, "no notice on an ordinary festival day");
  assert.equal(onCourseForBadge([], "2026-11-05"), true);
});

test("the later notices are pushed, the first-day announcement is not", () => {
  assert.equal(isPushed("diwali_2026_day"), true);
  assert.equal(isPushed("diwali_2026_last_2026-11-10"), true);
  assert.equal(isPushed("diwali_2026_start"), false);
});

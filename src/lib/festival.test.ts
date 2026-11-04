import test from "node:test";
import assert from "node:assert/strict";
import { FESTIVAL_BADGE_KIND, FESTIVAL_FRAME_KIND, festivalAnnouncePeriod, festivalKinds, festivalLighting, festivalShowing, litDays } from "./festival.js";
import { badgeById, countersOfMe, hasBadge } from "./badges.js";
import { honourDef } from "./honours.js";

const at = (iso: string) => new Date(iso);

test("the diyas follow the IST calendar, not UTC", () => {
  // 19:00 UTC on the 5th is 00:30 on the 6th in IST: the first diya's day.
  assert.deepEqual(litDays([at("2026-11-05T19:00:00Z")]), ["2026-11-06"]);
  // 18:00 UTC on the 5th is still 23:30 on the 5th in IST: too early.
  assert.deepEqual(litDays([at("2026-11-05T18:00:00Z")]), []);
});

test("several solves on one day light one diya, and the days come back in order", () => {
  assert.deepEqual(
    litDays([at("2026-11-08T12:00:00+05:30"), at("2026-11-06T09:00:00+05:30"), at("2026-11-08T20:00:00+05:30")]),
    ["2026-11-06", "2026-11-08"],
  );
});

test("a solve after the last day lights nothing", () => {
  assert.deepEqual(litDays([at("2026-11-11T00:00:00+05:30")]), []);
  assert.equal(festivalLighting(at("2026-11-10T23:59:00+05:30")), true);
  assert.equal(festivalLighting(at("2026-11-11T00:00:00+05:30")), false);
});

test("the strip shows through the day after and then stops by itself", () => {
  assert.equal(festivalShowing(at("2026-11-05T23:59:00+05:30")), false);
  assert.equal(festivalShowing(at("2026-11-06T00:00:00+05:30")), true);
  assert.equal(festivalShowing(at("2026-11-11T23:59:00+05:30")), true);
  assert.equal(festivalShowing(at("2026-11-12T00:00:00+05:30")), false);
});

test("the frame comes with the first diya and the badge only with all five", () => {
  assert.deepEqual(festivalKinds(0), []);
  assert.deepEqual(festivalKinds(1), [FESTIVAL_FRAME_KIND]);
  assert.deepEqual(festivalKinds(4), [FESTIVAL_FRAME_KIND]);
  assert.deepEqual(festivalKinds(5), [FESTIVAL_FRAME_KIND, FESTIVAL_BADGE_KIND]);
});

test("the rewards are not honours: no star, no celebration, no lifetime access", () => {
  assert.equal(honourDef(FESTIVAL_FRAME_KIND), null);
  assert.equal(honourDef(FESTIVAL_BADGE_KIND), null);
});

test("the badge is held only with its row, so a share is checked against the account", () => {
  const badge = badgeById("festival-5")!;
  assert.equal(hasBadge(badge, countersOfMe({ honours: [{ kind: FESTIVAL_FRAME_KIND }] })), false);
  assert.equal(hasBadge(badge, countersOfMe({ honours: [{ kind: FESTIVAL_BADGE_KIND }] })), true);
});

test("the announcement is due once, on the first morning", () => {
  assert.equal(festivalAnnouncePeriod(at("2026-11-06T09:00:00+05:30"), 9), "diwali-2026");
  assert.equal(festivalAnnouncePeriod(at("2026-11-06T12:00:00+05:30"), 12), null);
  assert.equal(festivalAnnouncePeriod(at("2026-11-07T09:00:00+05:30"), 9), null);
});

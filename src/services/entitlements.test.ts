process.env["TELEMETRY_DISABLED"] = "true";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FREE_PLAN, planFor } from "../lib/plans.js";
import { stateOf } from "./entitlements.js";

/**
 * The rolling window's arithmetic: how many uses are left and the day the
 * next free one opens — the date every refusal and the pricing page's
 * "next free mock on …" line quote, so it is pinned rather than trusted.
 */

const DAY = 86_400_000;
const at = (iso: string) => new Date(iso);

describe("stateOf", () => {
  it("has one left on Free before any use, with no date to wait for", () => {
    const s = stateOf(FREE_PLAN, "placementMock", []);
    assert.equal(s.remaining, 1);
    assert.equal(s.nextAt, null);
    assert.equal(s.creditCost, 20);
  });

  it("opens the next free mock ten days after the last one on Free", () => {
    const s = stateOf(FREE_PLAN, "placementMock", [at("2026-10-12T09:00:00Z")]);
    assert.equal(s.remaining, 0);
    assert.equal(s.nextAt, new Date(at("2026-10-12T09:00:00Z").getTime() + 10 * DAY).toISOString());
  });

  it("frees a slot when the oldest use leaves the month on Pro's 8 voice rounds", () => {
    const uses = Array.from({ length: 8 }, (_, i) => at(`2026-10-0${i + 1}T10:00:00Z`));
    const s = stateOf(planFor("pro"), "voiceInterview", uses);
    assert.equal(s.remaining, 0);
    assert.equal(s.nextAt, new Date(uses[0]!.getTime() + 30 * DAY).toISOString());
  });

  it("names the right use when the window holds more than the limit (a plan changed mid-window)", () => {
    // Pro's 8 a month, then back on Free (1 every 10 days): the window holds
    // 3; one slot opens when the 3rd-from-last leaves, i.e. the newest.
    const uses = [at("2026-10-01T00:00:00Z"), at("2026-10-03T00:00:00Z"), at("2026-10-05T00:00:00Z")];
    const s = stateOf(FREE_PLAN, "voiceInterview", uses);
    assert.equal(s.used, 3);
    assert.equal(s.remaining, 0);
    assert.equal(s.nextAt, new Date(uses[2]!.getTime() + 10 * DAY).toISOString());
  });

  it("reports an unlimited allowance as such", () => {
    const s = stateOf(planFor("pro"), "writtenInterview", null);
    assert.equal(s.limit, null);
    assert.equal(s.remaining, null);
    assert.equal(s.nextAt, null);
  });
});

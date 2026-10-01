import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MANUAL_MAX, autoReminder, claimFor, dueReminder, manualBlocker, scheduledState, type ManualInput } from "./tournament-reminder-rules.js";

const START = new Date("2026-10-02T14:30:00Z"); // 20:00 IST
const before = (minutes: number) => new Date(START.getTime() - minutes * 60_000);
const H = 60;

describe("the scheduled reminders", () => {
  it("the day mail is due from 24 hours out until three hours out", () => {
    assert.equal(dueReminder(START, before(24 * H + 1)), null);
    assert.equal(dueReminder(START, before(24 * H)), "day");
    assert.equal(dueReminder(START, before(24 * H - 5)), "day"); // the next tick
    assert.equal(dueReminder(START, before(3 * H + 1)), "day"); // published late in the window: still goes
    assert.equal(dueReminder(START, before(3 * H)), null);
  });

  it("the hour mail is due when check-in opens, until ten minutes out", () => {
    assert.equal(dueReminder(START, before(2 * H)), null);
    assert.equal(dueReminder(START, before(61)), null);
    assert.equal(dueReminder(START, before(60)), "hour");
    assert.equal(dueReminder(START, before(11)), "hour");
    assert.equal(dueReminder(START, before(10)), null);
    assert.equal(dueReminder(START, START), null);
    assert.equal(dueReminder(START, before(-5)), null);
  });

  it("a claim names the start, so a moved tournament is reminded again", () => {
    assert.equal(claimFor("day", START), `day@${START.getTime()}`);
    assert.notEqual(claimFor("day", START), claimFor("day", before(-60)));
    assert.notEqual(claimFor("day", START), claimFor("hour", START));
  });

  it("the scheduler sends each once, and never within an hour of another", () => {
    const now = before(20 * H);
    assert.equal(autoReminder(START, [], null, now), "day");
    assert.equal(autoReminder(START, [claimFor("day", START)], before(24 * H), now), null);
    // Sent by hand 20 minutes ago: the day mail waits inside its window…
    assert.equal(autoReminder(START, [], new Date(now.getTime() - 20 * 60_000), now), null);
    // …and goes once the hour has passed.
    assert.equal(autoReminder(START, [], new Date(now.getTime() - 60 * 60_000), now), "day");
    // The start moved later: the old start's claim does not stop the new one.
    assert.equal(autoReminder(START, [claimFor("day", before(24 * H))], before(25 * H), now), "day");
    assert.equal(autoReminder(START, [claimFor("day", START)], before(21 * H), before(60)), "hour");
  });

  it("each one is scheduled, due, sent or skipped", () => {
    assert.equal(scheduledState("day", START, [], before(30 * H)), "scheduled");
    assert.equal(scheduledState("day", START, [], before(20 * H)), "due");
    assert.equal(scheduledState("day", START, [claimFor("day", START)], before(20 * H)), "sent");
    // Published two hours before the start: the day mail's window closed before anyone could get it.
    assert.equal(scheduledState("day", START, [], before(2 * H)), "skipped");
    assert.equal(scheduledState("hour", START, [], before(2 * H)), "scheduled");
    // A claim for the old start does not count for the new one.
    assert.equal(scheduledState("hour", START, [claimFor("hour", before(-60))], before(45)), "due");
  });
});

describe("a reminder sent by hand", () => {
  const base: ManualInput = { status: "published", phase: "registration", startsAt: START, recipients: 13, lastSentAt: null, manualCount: 0, claims: [] };
  const now = before(30 * H);

  it("goes for a public tournament with entrants, before the start", () => {
    assert.equal(manualBlocker(base, now), null);
    assert.equal(manualBlocker({ ...base, phase: "registration_closed" }, now), null);
  });

  it("is refused for anything players cannot see, or once it has started", () => {
    assert.match(manualBlocker({ ...base, status: "draft", phase: "draft" }, now)!, /published/);
    assert.match(manualBlocker({ ...base, status: "review", phase: "review" }, now)!, /published/);
    assert.match(manualBlocker({ ...base, status: "cancelled", phase: "cancelled" }, now)!, /cancelled/);
    assert.match(manualBlocker({ ...base, phase: "live" }, START)!, /started/);
    assert.match(manualBlocker({ ...base, phase: "finished" }, before(-600))!, /started/);
  });

  it("needs someone to remind", () => {
    assert.match(manualBlocker({ ...base, recipients: 0 }, now)!, /Nobody is entered/);
  });

  it("waits an hour after any reminder", () => {
    // (30 h out, so no scheduled one is near.)
    const at = (m: number) => new Date(now.getTime() - m * 60_000);
    assert.match(manualBlocker({ ...base, lastSentAt: at(20) }, now)!, /20 minutes ago.*another in 40 minutes/);
    assert.match(manualBlocker({ ...base, lastSentAt: at(59.5) }, now)!, /in 1 minute\./);
    assert.equal(manualBlocker({ ...base, lastSentAt: at(60) }, now), null);
  });

  it("stops at the cap", () => {
    assert.equal(manualBlocker({ ...base, manualCount: MANUAL_MAX - 1 }, now), null);
    assert.match(manualBlocker({ ...base, manualCount: MANUAL_MAX }, now)!, new RegExp(`${MANUAL_MAX} reminders`));
  });

  it("is not needed just before a scheduled one that has not gone", () => {
    // 24 h 20 min out: the day mail goes in 20 minutes.
    assert.match(manualBlocker(base, before(24 * H + 20))!, /24-hour reminder goes out by itself in 20 minutes/);
    assert.match(manualBlocker(base, before(24 * H + 45))!, /in 45 minutes/);
    // More than an hour before it: far enough.
    assert.equal(manualBlocker(base, before(24 * H + 61)), null);
    // Inside the day window before the tick took it.
    assert.match(manualBlocker(base, before(23 * H))!, /24-hour reminder is going out by itself/);
    assert.equal(manualBlocker({ ...base, claims: [claimFor("day", START)] }, before(23 * H)), null);
    // 80 minutes out, the day mail sent: the hour mail is 20 minutes away.
    assert.match(manualBlocker({ ...base, claims: [claimFor("day", START)] }, before(80))!, /1-hour reminder goes out by itself in 20 minutes/);
    // Both sent, half an hour out: the organizer may still send one.
    assert.equal(manualBlocker({ ...base, phase: "registration_closed", claims: [claimFor("day", START), claimFor("hour", START)] }, before(30)), null);
    // Published 2 h 10 min out: the day mail is skipped, so it blocks nothing, and the hour mail is more than an hour away.
    assert.equal(manualBlocker(base, before(2 * H + 10)), null);
    assert.match(manualBlocker(base, before(2 * H))!, /1-hour reminder goes out by itself in 60 minutes/);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clockLength,
  googleCalendarUrl,
  istWhen,
  reminderMail,
  reminderNotice,
  startsIn,
  utcClock,
  type ReminderOrigins,
  type ReminderPerson,
  type ReminderTournament,
} from "./tournament-reminder-mail.js";

/**
 * The tournament reminder's words: what each reader is told to do, the
 * facts, the escaping of everything an organizer or a player typed, and
 * both bodies carrying the same things.
 */

const O: ReminderOrigins = { battles: "https://battles.codekairo.com", main: "https://codekairo.com" };
const START = new Date("2026-10-02T14:30:00Z"); // Fri 2 Oct, 20:00 IST
const before = (minutes: number) => new Date(START.getTime() - minutes * 60_000);

const KNOCKOUT: ReminderTournament = {
  id: "t1",
  slug: "codekairo-t1-dsa-rush",
  title: "Codekairo T1 DSA RUSH",
  format: "knockout",
  orgName: "codekairo T1 DSA Trophie",
  startsAt: START,
  durationMinutes: 60,
  teamSize: 1,
  problemCount: 10,
  entrants: 13,
  teams: 0,
  capacity: 20,
  freezeMinutes: 0,
};
const CONTEST: ReminderTournament = { ...KNOCKOUT, id: "c1", slug: "spring-icpc", title: "Spring ICPC", format: "icpc", durationMinutes: 180, teamSize: 3, teams: 8, capacity: null, freezeMinutes: 30 };
const PLAYER: ReminderPerson = { email: "mei@college.edu", name: "Mei Tanaka", team: null, checkedIn: false };

describe("the words", () => {
  it("says when in IST and UTC", () => {
    assert.equal(istWhen(START), "Fri 2 Oct, 20:00 IST");
    assert.equal(utcClock(START), "14:30 UTC");
  });

  it("says how long is left as a person would", () => {
    assert.equal(startsIn(24 * 3600_000), "in 24 hours");
    assert.equal(startsIn(23.95 * 3600_000), "in 24 hours");
    assert.equal(startsIn(60 * 60_000), "in 1 hour");
    assert.equal(startsIn(55 * 60_000), "in 1 hour");
    assert.equal(startsIn(35 * 60_000), "in 35 minutes");
    assert.equal(startsIn(30_000), "in 1 minute");
    assert.equal(startsIn(3 * 86_400_000), "in 3 days");
  });

  it("writes a clock as the Battles pages do", () => {
    assert.equal(clockLength(60), "1 h");
    assert.equal(clockLength(45), "45 min");
    assert.equal(clockLength(150), "2 h 30 min");
  });
});

describe("what each reader is told", () => {
  it("a day out: when check-in opens", () => {
    const mail = reminderMail(KNOCKOUT, PLAYER, "day", before(24 * 60), O);
    assert.equal(mail.subject, "Codekairo T1 DSA RUSH starts in 24 hours");
    assert.match(mail.text, /Check in from 19:00 IST/);
    assert.match(mail.text, /Mei, you're entered in Codekairo T1 DSA RUSH, a 1v1 coding knockout by codekairo T1 DSA Trophie\. It starts in 24 hours — Fri 2 Oct, 20:00 IST\./);
  });

  it("an hour out, not checked in: check in now", () => {
    const mail = reminderMail(KNOCKOUT, PLAYER, "hour", before(60), O);
    assert.equal(mail.subject, "Check in now — Codekairo T1 DSA RUSH starts in 1 hour");
    assert.match(mail.preheader, /Check-in is open/);
    assert.match(mail.html, />Check in now&nbsp;&nbsp;&rarr;</);
    assert.match(reminderNotice(KNOCKOUT, PLAYER, before(60), O).body, /Check-in is open/);
  });

  it("an hour out, checked in: nothing to do but turn up", () => {
    const mail = reminderMail(KNOCKOUT, { ...PLAYER, checkedIn: true }, "hour", before(58), O);
    assert.equal(mail.subject, "Codekairo T1 DSA RUSH starts in 1 hour");
    assert.match(mail.text, /You're checked in/);
    assert.doesNotMatch(mail.text, /Check in now/);
  });

  it("a contest names the team and opens its room", () => {
    const mail = reminderMail(CONTEST, { ...PLAYER, team: "Null Pointers" }, "day", before(24 * 60), O);
    assert.match(mail.text, /Your team: Null Pointers/);
    assert.match(mail.text, /https:\/\/battles\.codekairo\.com\/contest\/c1/);
    assert.match(mail.text, /the board freezes 30 min before the end/);
    assert.match(mail.text, /plus 20 for every rejected attempt/);
    assert.match(mail.text, /8 teams/);
  });

  it("one sent by hand says who it is from", () => {
    const mail = reminderMail(KNOCKOUT, PLAYER, "manual", before(5 * 60), O);
    assert.equal(mail.subject, "Reminder: Codekairo T1 DSA RUSH starts in 5 hours");
    assert.match(mail.html, /A reminder from codekairo T1 DSA Trophie/);
  });
});

describe("both bodies", () => {
  it("carry the facts, the calendar, the features and why it came", () => {
    const mail = reminderMail(KNOCKOUT, PLAYER, "day", before(24 * 60), O);
    for (const body of [mail.html, mail.text]) {
      assert.ok(body.includes("13 of 20 places taken"));
      assert.ok(body.includes("https://calendar.google.com/calendar/render?"));
      for (const path of ["/duels", "/contests", "/roadmap", "/bug-hunts", "/mock-interview", "/resume"]) assert.ok(body.includes(`https://codekairo.com${path}`), path);
      assert.ok(body.includes("mei@college.edu"));
      assert.ok(body.includes("https://battles.codekairo.com/t/codekairo-t1-dsa-rush"));
    }
  });

  it("escape every word an organizer or a player typed", () => {
    const t = { ...KNOCKOUT, title: `<img src=x onerror=alert(1)> "Rush"`, orgName: "R&D <Club>" };
    const html = reminderMail(t, { ...PLAYER, name: "<b>Eve" }, "manual", before(5 * 60), O).html;
    assert.ok(!html.includes("<img src=x"));
    assert.ok(!html.includes("<b>Eve"));
    assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt; &quot;Rush&quot;"));
    assert.ok(html.includes("R&amp;D &lt;Club&gt;"));
  });

  it("keep a subject to one line", () => {
    const mail = reminderMail({ ...KNOCKOUT, title: "Rush\r\nBcc: someone@example.com" }, PLAYER, "day", before(24 * 60), O);
    assert.ok(!/[\r\n]/.test(mail.subject));
  });
});

it("the calendar entry runs the contest's clock, or a knockout's rounds", () => {
  const contest = new URL(googleCalendarUrl(CONTEST, O));
  assert.equal(contest.searchParams.get("dates"), "20261002T143000Z/20261002T173000Z");
  // 13 players: four rounds of an hour and the minute between.
  const knockout = new URL(googleCalendarUrl(KNOCKOUT, O));
  assert.equal(knockout.searchParams.get("dates"), "20261002T143000Z/20261002T183400Z");
  assert.equal(knockout.searchParams.get("location"), "https://battles.codekairo.com/t/codekairo-t1-dsa-rush");
});

/**
 * The tournament reminder — what an entrant of a CodeKairo Battles
 * tournament finds in their inbox 24 hours and 1 hour before the start, or
 * when the organizer (or a CodeKairo admin) presses "Send reminder".
 * services/tournament-reminders.ts decides when and to whom; this file is
 * only the words, pure, so tournament-reminder-mail.test.ts pins them.
 *
 * It looks like the product, as the welcome mail does (lib/welcome-mail-copy
 * — read its header for why every style is inline and the layout is tables;
 * the tokens are shared through lib/mail-design): ink for structure and the
 * primary action, deep-teal eyebrows, the deep-teal band with an inverted
 * button, hairline rows rather than cards.
 *
 * What it says depends on the format and on the reader:
 *  - a knockout's mail is about check-in, because only checked-in players
 *    are seeded (knockout-rules CHECK_IN_MINUTES): before check-in opens it
 *    says when; once open it says "check in now" to a player who has not and
 *    "you're checked in" to one who has;
 *  - a contest's mail names the reader's team, since the organizer entered
 *    it, and opens the contest room;
 *  - every one carries the facts (when — in IST and UTC, since the readers
 *    are not all in one zone — the format, the clock, the problems, the
 *    field), a Google Calendar link, three things to sort out before the
 *    start, and what else CodeKairo is, because a tournament is often a
 *    player's first visit and every solve in it counts on their profile.
 *
 * The title, the organizer's name and the team name are the organizer's
 * words, and the name is the player's, so every one of them is escaped.
 */
import { zoned } from "../lib/clock.js";
import { L, MONO, ON_TEAL, SANS, TEAL_DEEP, ASSET_ORIGIN, FONT_FACES, PREHEADER_FILLER, escapeHtml } from "../lib/mail-design.js";
import { BATTLES_URL, FRONTEND_URL } from "../lib/sites.js";
import { firstName } from "../lib/welcome-mail-copy.js";
import { CHECK_IN_MINUTES } from "./knockout-rules.js";
import { WRONG_PENALTY_MINUTES } from "./contest-rules.js";
import type { ReminderKind } from "./tournament-reminder-rules.js";

export interface ReminderTournament {
  id: string;
  slug: string;
  title: string;
  format: "knockout" | "icpc";
  orgName: string;
  startsAt: Date;
  durationMinutes: number;
  teamSize: number;
  problemCount: number;
  /** Approved entrants (players, or members of teams). */
  entrants: number;
  /** ICPC: teams entered. */
  teams: number;
  capacity: number | null;
  freezeMinutes: number;
}

export interface ReminderPerson {
  email: string;
  name: string | null;
  /** ICPC: the team the organizer entered them in. */
  team: string | null;
  /** Knockout: checked in already. */
  checkedIn: boolean;
}

export interface ReminderMail {
  subject: string;
  preheader: string;
  text: string;
  html: string;
}

export interface ReminderOrigins {
  /** Where the tournament lives. */
  battles: string;
  /** Where the rest of CodeKairo lives. */
  main: string;
}

/** An unset BATTLES_URL in production means "no second origin" for CORS; a mail still needs somewhere to point. */
export const REMINDER_ORIGINS: ReminderOrigins = { battles: BATTLES_URL || "https://battles.codekairo.com", main: FRONTEND_URL };

/* ── words ────────────────────────────────────────────────────────── */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "20:00 IST" — the product's zone (lib/clock), as the rest of the product's mail. */
export function istClock(at: Date): string {
  const z = zoned(at);
  return `${pad(z.getUTCHours())}:${pad(z.getUTCMinutes())} IST`;
}

/** "Fri 2 Oct, 20:00 IST". */
export function istWhen(at: Date): string {
  const z = zoned(at);
  return `${WEEKDAYS[z.getUTCDay()]} ${z.getUTCDate()} ${MONTHS[z.getUTCMonth()]}, ${istClock(at)}`;
}

/** "14:30 UTC", for the readers outside India. */
export const utcClock = (at: Date) => `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())} UTC`;

/**
 * "in 24 hours", "in 1 hour", "in 35 minutes" — from the time actually left
 * when the mail is written, not from the kind of reminder: the scheduler
 * ticks every five minutes and a manual one goes whenever it is pressed.
 */
export function startsIn(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 50) return `in ${m} minute${m === 1 ? "" : "s"}`;
  if (m < 90) return "in 1 hour";
  const h = Math.round(m / 60);
  if (h < 36) return `in ${h} hours`;
  return `in ${Math.round(h / 24)} days`;
}

/** "1 h", "45 min", "2 h 30 min" — the Battles pages' own shape (frontend battles/src/lib/format `duration`). */
export function clockLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

/** A subject line carries no control characters, whatever the organizer typed. */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

const checkInOpensAt = (t: ReminderTournament) => new Date(t.startsAt.getTime() - CHECK_IN_MINUTES * 60_000);

/** Where the reader stands, which decides the mail's middle. */
type Standing = "check_in_now" | "checked_in" | "check_in_later" | "team" | "contest";

function standingOf(t: ReminderTournament, person: ReminderPerson, now: Date): Standing {
  if (t.format === "icpc") return person.team ? "team" : "contest";
  if (person.checkedIn) return "checked_in";
  return now >= checkInOpensAt(t) ? "check_in_now" : "check_in_later";
}

const formatPhrase = (t: ReminderTournament) => (t.format === "knockout" ? "a 1v1 coding knockout" : "an ICPC-style coding contest");

/** The box under the opening: what to do next, and the one button that does it. */
function nextStep(t: ReminderTournament, person: ReminderPerson, standing: Standing, o: ReminderOrigins): { title: string; body: string; cta: string; href: string } {
  const page = `${o.battles}/t/${encodeURIComponent(t.slug)}`;
  const room = `${o.battles}/contest/${encodeURIComponent(t.id)}`;
  switch (standing) {
    case "check_in_now":
      return {
        title: "Check in now",
        body: `Check-in is open until the start at ${istClock(t.startsAt)}. Only players who check in are seeded into the bracket — if you don't, you won't be drawn a match.`,
        cta: "Check in now",
        href: page,
      };
    case "checked_in":
      return {
        title: "You're checked in",
        body: "Your seed and your first match appear on the tournament page when the bracket is drawn at the start. Open it a few minutes early.",
        cta: "Open the tournament",
        href: page,
      };
    case "check_in_later":
      return {
        title: `Check in from ${istClock(checkInOpensAt(t))}`,
        body: `Check-in opens an hour before the start and closes when it begins. Only checked-in players are seeded into the bracket — we'll remind you when it opens.`,
        cta: "Open the tournament",
        href: page,
      };
    case "team":
      return {
        title: `Your team: ${person.team}`,
        body: "Your organizer entered your team. The problems are revealed in the contest room when the clock starts, and an accepted solution from any member counts for the whole team.",
        cta: "Open the contest room",
        href: room,
      };
    default:
      return {
        title: "The contest room opens at the start",
        body: "The problems are revealed when the clock starts. Teams are entered by the organizer.",
        cta: "Open the tournament",
        href: page,
      };
  }
}

function facts(t: ReminderTournament): Array<{ label: string; value: string; note?: string }> {
  const knockout = t.format === "knockout";
  const field = knockout
    ? t.capacity
      ? `${t.entrants} of ${t.capacity} places taken`
      : `${t.entrants} ${t.entrants === 1 ? "player" : "players"}`
    : `${t.teams} ${t.teams === 1 ? "team" : "teams"}`;
  return [
    { label: "Starts", value: istWhen(t.startsAt), note: utcClock(t.startsAt) },
    { label: "Format", value: knockout ? "1v1 knockout, seeded by rating" : `ICPC-style contest, teams of up to ${t.teamSize}` },
    knockout
      ? { label: "Each match", value: clockLength(t.durationMinutes), note: "first accepted solution wins" }
      : { label: "Length", value: `${clockLength(t.durationMinutes)} on one clock`, ...(t.freezeMinutes > 0 ? { note: `the board freezes ${t.freezeMinutes} min before the end` } : {}) },
    { label: "Problems", value: t.problemCount > 0 ? `${t.problemCount}` : "—", note: "revealed at the start" },
    { label: knockout ? "Players" : "Teams", value: field },
    { label: "Organizer", value: t.orgName },
  ];
}

/** Three things worth sorting out before the clock starts; the last is the format's rule. */
function beforeTheStart(t: ReminderTournament, person: ReminderPerson): Array<{ title: string; body: string }> {
  const room = t.format === "knockout" ? "match room" : "contest room";
  return [
    {
      title: "Sign in with this account",
      body: `Battles signs you in with your CodeKairo account — the one at ${person.email}. Sign in before the start so nothing stands between you and the first problem.`,
    },
    {
      title: "Use a computer, pick a language",
      body: `The ${room} is a full editor with tests to run, in any of 13 languages. A laptop or desktop with a steady connection is the way to play it.`,
    },
    t.format === "knockout"
      ? {
          title: "How a match is won",
          body: "The first accepted submission wins. If the clock runs out, the player who passed more hidden tests goes through — and your next match starts a minute after both its players are known.",
        }
      : {
          title: "How it is scored",
          body: `Teams rank by problems solved, then penalty time: the minutes to each first accepted solution, plus ${WRONG_PENALTY_MINUTES} for every rejected attempt before it.`,
        },
  ];
}

/** What else the account opens — a tournament is often a player's first visit. */
const FEATURES: Array<{ title: string; body: string; link: string; path: string }> = [
  { title: "Practice duels", body: "1v1 against a player at your level, on a clock. The closest thing to a knockout match.", link: "Find a duel", path: "/duels" },
  { title: "Today's problem", body: "One problem a day, the same for everyone. Solve it on the day to rank and keep a streak.", link: "See today's problem", path: "/contests" },
  { title: "DSA Roadmap", body: "Stages of problems walked in order, with a chest of XP at the end of every tier.", link: "Open the roadmap", path: "/roadmap" },
  { title: "Bug hunts", body: "Real broken projects in JavaScript, Python and Java. Find the bug, fix it, pass the tests.", link: "Pick a bug hunt", path: "/bug-hunts" },
  { title: "AI mock interviews", body: "A written or a voice round with an AI interviewer, and a scored report when it ends.", link: "Start a mock interview", path: "/mock-interview" },
  { title: "Resume ATS check", body: "Score your resume against a job description and fix what an applicant tracker would miss.", link: "Check your resume", path: "/resume" },
];

/** The words of one mail, before either renderer. */
function compose(t: ReminderTournament, person: ReminderPerson, kind: ReminderKind, now: Date, o: ReminderOrigins) {
  const lead = startsIn(t.startsAt.getTime() - now.getTime());
  const standing = standingOf(t, person, now);
  const title = oneLine(t.title);
  const name = firstName(person.name);
  const subject =
    standing === "check_in_now"
      ? `Check in now — ${title} starts ${lead}`
      : kind === "manual"
        ? `Reminder: ${title} starts ${lead}`
        : `${title} starts ${lead}`;
  const preheader =
    standing === "check_in_now"
      ? "Check-in is open until the start. Only checked-in players are seeded into the bracket."
      : standing === "check_in_later"
        ? `Check-in opens at ${istClock(checkInOpensAt(t))}, an hour before the start. Everything you need is inside.`
        : standing === "team"
          ? `Your team: ${oneLine(person.team ?? "")}. The problems are revealed when the clock starts.`
          : `${istWhen(t.startsAt)}. Everything you need for the start is inside.`;
  return {
    lead,
    standing,
    title,
    name,
    subject,
    preheader,
    eyebrow: kind === "manual" ? `A reminder from ${oneLine(t.orgName)}` : `Starts ${lead}`,
    opening: `${name ? `${name}, you're` : "You're"} entered in ${title}, ${formatPhrase(t)} by ${oneLine(t.orgName)}. It starts ${lead} — ${istWhen(t.startsAt)}.`,
    step: nextStep(t, person, standing, o),
    facts: facts(t),
    before: beforeTheStart(t, person),
    page: `${o.battles}/t/${encodeURIComponent(t.slug)}`,
    calendar: googleCalendarUrl(t, o),
  };
}

/**
 * A Google Calendar "add event" link. A contest ends when its clock does; a
 * knockout's length is an estimate — a match per round for the field that
 * registered, plus the minute between rounds.
 */
export function googleCalendarUrl(t: ReminderTournament, o: ReminderOrigins = REMINDER_ORIGINS): string {
  const rounds = t.format === "knockout" ? Math.max(1, Math.ceil(Math.log2(Math.max(2, t.entrants)))) : 1;
  const ends = new Date(t.startsAt.getTime() + rounds * (t.durationMinutes + (t.format === "knockout" ? 1 : 0)) * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const page = `${o.battles}/t/${encodeURIComponent(t.slug)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: oneLine(t.title),
    dates: `${stamp(t.startsAt)}/${stamp(ends)}`,
    details: `${t.format === "knockout" ? "1v1 knockout" : "ICPC-style contest"} by ${oneLine(t.orgName)} on CodeKairo Battles.\n${page}`,
    location: page,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ── the bell ─────────────────────────────────────────────────────── */

/** The in-app notification that goes with the mail (the main site's bell). */
export function reminderNotice(t: ReminderTournament, person: ReminderPerson, now: Date, o: ReminderOrigins = REMINDER_ORIGINS): { title: string; body: string; href: string } {
  const lead = startsIn(t.startsAt.getTime() - now.getTime());
  const standing = standingOf(t, person, now);
  const body =
    standing === "check_in_now"
      ? "Check-in is open until the start — only checked-in players are seeded."
      : standing === "checked_in"
        ? "You're checked in. Your first match appears when the bracket is drawn."
        : standing === "check_in_later"
          ? `Check-in opens at ${istClock(checkInOpensAt(t))}, an hour before the start.`
          : standing === "team"
            ? `Your team ${oneLine(person.team ?? "")} plays at ${istClock(t.startsAt)}.`
            : `It starts at ${istClock(t.startsAt)}.`;
  return { title: `${oneLine(t.title)} starts ${lead}`.slice(0, 180), body, href: `${o.battles}/t/${encodeURIComponent(t.slug)}` };
}

/* ── text ─────────────────────────────────────────────────────────── */

function reminderText(t: ReminderTournament, person: ReminderPerson, c: ReturnType<typeof compose>, o: ReminderOrigins): string {
  const lines = [c.opening, "", c.step.title, c.step.body, `${c.step.cta}: ${c.step.href}`, "", "The tournament"];
  for (const f of c.facts) lines.push(`  ${`${f.label}:`.padEnd(12)}${f.value}${f.note ? ` (${f.note})` : ""}`);
  lines.push("", `Add it to Google Calendar: ${c.calendar}`, "", "Before the start", "");
  c.before.forEach((b, i) => lines.push(`0${i + 1}  ${b.title}`, `    ${b.body}`, ""));
  lines.push(
    "Your solves count on CodeKairo",
    "Every problem you solve in this tournament also counts on your CodeKairo profile — solved count, heatmap, streak and XP. A practice duel before the start is the best warm-up there is.",
    `Warm up with a duel: ${o.main}/duels`,
    "",
    "More on CodeKairo, on the same account",
    "",
  );
  for (const f of FEATURES) lines.push(`- ${f.title}: ${f.body}`, `  ${o.main}${f.path}`);
  lines.push(
    "",
    "Good luck.",
    "— The CodeKairo Battles team",
    "",
    `Questions about the tournament itself — its rules, eligibility or timing — go to its organizer, ${oneLine(t.orgName)}. Anything about Battles: reply to this email.`,
    "",
    "---",
    `You're receiving this because ${person.email} is entered in ${c.title} on CodeKairo Battles.`,
    t.format === "knockout"
      ? `Not playing any more? Withdraw on the tournament page so your place can go to someone else: ${c.page}`
      : "Your organizer entered your team; ask them if anything about it should change.",
  );
  return lines.join("\n");
}

/* ── html ─────────────────────────────────────────────────────────── */

const e = escapeHtml;

function factRows(c: ReturnType<typeof compose>): string {
  return c.facts
    .map(
      (f, i) => `<tr>
<td class="ck-rule ck-muted" width="120" valign="top" style="width:120px;${i ? `border-top:1px solid ${L.border};` : ""}padding:12px 16px 12px 0;font:600 12px/20px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.muted}">${e(f.label)}</td>
<td class="ck-rule" valign="top" style="${i ? `border-top:1px solid ${L.border};` : ""}padding:12px 0">
<span class="ck-ink" style="font:600 15px/20px ${SANS};color:${L.ink}">${e(f.value)}</span>${f.note ? `<br><span class="ck-secondary" style="font:400 13px/20px ${SANS};color:${L.secondary}">${e(f.note)}</span>` : ""}
</td>
</tr>`,
    )
    .join("\n");
}

function beforeRows(c: ReturnType<typeof compose>): string {
  return c.before
    .map(
      (b, i) => `<tr>
<td class="ck-rule" style="border-top:1px solid ${L.border};padding:20px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-eyebrow" width="44" valign="top" style="width:44px;font:600 13px/24px ${MONO};color:${L.highlight}">0${i + 1}</td>
<td valign="top">
<p class="ck-ink" style="margin:0 0 4px;font:600 16px/24px ${SANS};color:${L.ink}">${e(b.title)}</p>
<p class="ck-secondary" style="margin:0;font:400 14px/22px ${SANS};color:${L.secondary}">${e(b.body)}</p>
</td>
</tr></table>
</td>
</tr>`,
    )
    .join("\n");
}

/** The features, two to a row on a wide screen, one on a phone. */
function featureGrid(o: ReminderOrigins): string {
  const cell = (f: (typeof FEATURES)[number], side: "l" | "r") => `<td class="ck-col ck-rule" width="50%" valign="top" style="width:50%;border-top:1px solid ${L.border};padding:20px ${side === "l" ? "16px" : "0"} 20px ${side === "r" ? "16px" : "0"}">
<p class="ck-ink" style="margin:0 0 4px;font:600 15px/22px ${SANS};color:${L.ink}">${e(f.title)}</p>
<p class="ck-secondary" style="margin:0 0 8px;font:400 14px/22px ${SANS};color:${L.secondary}">${e(f.body)}</p>
<a class="ck-link" href="${o.main}${f.path}" style="font:600 14px/22px ${SANS};color:${L.accent};text-decoration:none">${e(f.link)}&nbsp;&rarr;</a>
</td>`;
  const rows: string[] = [];
  for (let i = 0; i < FEATURES.length; i += 2) rows.push(`<tr>\n${cell(FEATURES[i]!, "l")}\n${cell(FEATURES[i + 1]!, "r")}\n</tr>`);
  return rows.join("\n");
}

function reminderHtml(t: ReminderTournament, person: ReminderPerson, c: ReturnType<typeof compose>, o: ReminderOrigins): string {
  const email = e(person.email);
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${e(c.subject)}</title>
<style>
${FONT_FACES}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
a{text-decoration:none}
@media (max-width:620px){
.ck-outer{padding:16px 12px !important}
.ck-body{padding:28px 20px !important}
.ck-h1{font-size:28px !important;line-height:34px !important}
.ck-band{padding:24px 20px !important}
.ck-well{padding:20px !important}
.ck-btn-cell{display:block !important;width:100% !important}
.ck-btn-cell a{display:block !important;text-align:center !important}
.ck-alt{display:block !important;padding:16px 0 0 !important;text-align:center !important}
.ck-col{display:block !important;width:100% !important;padding:20px 0 !important}
}
@media (prefers-color-scheme:dark){
.ck-ground{background:#0A0A0A !important}
.ck-panel{background:#111111 !important;border-color:#262626 !important}
.ck-ink{color:#F5F5F5 !important}
.ck-secondary{color:#A3A3A3 !important}
.ck-muted,.ck-muted a{color:#8C8C8C !important}
.ck-eyebrow,.ck-link{color:#3AA9FF !important}
.ck-rule{border-color:#262626 !important}
.ck-well{background:#0D0D0D !important;border-color:#262626 !important}
.ck-btn{background:#F5F5F5 !important}
.ck-btn a{color:#111111 !important}
}
</style>
<!--[if mso]><style>body,table,td,p,a,span,h1{font-family:'Segoe UI',Arial,sans-serif !important}</style><![endif]-->
</head>
<body class="ck-ground" style="margin:0;padding:0;background:${L.ground}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${L.ground}">${e(c.preheader)}${PREHEADER_FILLER}</div>
<table role="presentation" class="ck-ground" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.ground}">
<tr><td class="ck-outer" align="center" style="padding:40px 16px">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-panel" style="background:${L.panel};border:1px solid ${L.border};border-radius:12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="ck-body" style="padding:40px 48px">

<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding:0 10px 0 0"><img src="${ASSET_ORIGIN}/icon-192.png" width="32" height="32" alt="CodeKairo" style="display:block;width:32px;height:32px;border:0;border-radius:8px"></td>
<td valign="middle" class="ck-ink" style="font:700 18px/24px ${SANS};letter-spacing:-0.02em;color:${L.ink}">CodeKairo <span class="ck-secondary" style="font-weight:600;color:${L.secondary}">Battles</span></td>
</tr></table>

<p class="ck-eyebrow" style="margin:40px 0 12px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.highlight}">${e(c.eyebrow)}</p>
<h1 class="ck-ink ck-h1" style="margin:0 0 16px;font:700 32px/38px ${SANS};letter-spacing:-0.02em;color:${L.ink}">${e(c.title)}</h1>
<p class="ck-secondary" style="margin:0 0 32px;font:400 16px/26px ${SANS};color:${L.secondary}">${e(c.opening)}</p>

<table role="presentation" class="ck-well" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.well};border:1px solid ${L.border};border-radius:8px">
<tr><td class="ck-well" style="padding:24px">
<p class="ck-ink" style="margin:0 0 6px;font:700 18px/26px ${SANS};letter-spacing:-0.01em;color:${L.ink}">${e(c.step.title)}</p>
<p class="ck-secondary" style="margin:0 0 20px;font:400 15px/24px ${SANS};color:${L.secondary}">${e(c.step.body)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn-cell" style="width:1%;white-space:nowrap">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn" bgcolor="${L.ink}" style="background:${L.ink};border-radius:8px">
<a href="${e(c.step.href)}" style="display:inline-block;padding:14px 24px;font:600 15px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:8px">${e(c.step.cta)}&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td>
<td class="ck-alt" style="padding:0 0 0 20px">
<a class="ck-link" href="${e(c.calendar)}" style="font:600 15px/20px ${SANS};color:${L.accent};text-decoration:none">Add to Google Calendar</a>
</td>
</tr></table>
</td></tr>
</table>

<p class="ck-ink" style="margin:40px 0 8px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">The tournament</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${factRows(c)}
</table>
<p style="margin:12px 0 0;font:400 14px/22px ${SANS}"><a class="ck-link" href="${e(c.page)}" style="font-weight:600;color:${L.accent};text-decoration:none">Rules, schedule and entrants on the tournament page&nbsp;&rarr;</a></p>

<p class="ck-ink" style="margin:48px 0 4px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">Before the start</p>
<p class="ck-secondary" style="margin:0 0 16px;font:400 14px/22px ${SANS};color:${L.secondary}">Three things worth sorting out now, not at ${e(istClock(t.startsAt))}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${beforeRows(c)}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0">
<tr><td class="ck-band" bgcolor="${TEAL_DEEP}" style="background:${TEAL_DEEP};border-radius:12px;padding:32px">
<p style="margin:0 0 8px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${ON_TEAL.muted}">Warm up</p>
<p style="margin:0 0 8px;font:700 22px/28px ${SANS};letter-spacing:-0.02em;color:#FFFFFF">Your solves count on CodeKairo.</p>
<p style="margin:0 0 24px;font:400 15px/24px ${SANS};color:${ON_TEAL.secondary}">Every problem you solve in this tournament also counts on your CodeKairo profile — solved count, heatmap, streak and XP. A practice duel before the start is the best warm-up there is.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:8px">
<a href="${o.main}/duels" style="display:inline-block;padding:12px 20px;font:600 15px/20px ${SANS};color:${TEAL_DEEP};text-decoration:none;border-radius:8px">Warm up with a duel</a>
</td></tr></table>
</td></tr>
</table>

<p class="ck-ink" style="margin:48px 0 4px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">More on CodeKairo</p>
<p class="ck-secondary" style="margin:0 0 16px;font:400 14px/22px ${SANS};color:${L.secondary}">The account you play with opens all of it — nothing else to sign up for.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${featureGrid(o)}
</table>

<p class="ck-ink" style="margin:40px 0 4px;font:600 15px/24px ${SANS};color:${L.ink}">Good luck.</p>
<p class="ck-ink" style="margin:0 0 16px;font:600 15px/24px ${SANS};color:${L.ink}">— The CodeKairo Battles team</p>
<p class="ck-secondary" style="margin:0;font:400 14px/22px ${SANS};color:${L.secondary}">Questions about the tournament itself — its rules, eligibility or timing — go to its organizer, ${e(oneLine(t.orgName))}. Anything about Battles: reply to this email.</p>

</td></tr>
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-muted" align="center" style="padding:24px 24px 0;font:400 12px/20px ${SANS};color:${L.muted}">
You're receiving this because ${email} is entered in ${e(c.title)} on CodeKairo Battles.<br>
${
  t.format === "knockout"
    ? `Not playing any more? <a href="${e(c.page)}" style="color:${L.muted};text-decoration:underline">Withdraw on the tournament page</a> so your place can go to someone else.`
    : "Your organizer entered your team; ask them if anything about it should change."
}<br><br>
<a href="${o.battles}" style="color:${L.muted};text-decoration:none;font-weight:600">CodeKairo Battles</a> &nbsp;·&nbsp; <a href="mailto:support@codekairo.com" style="color:${L.muted};text-decoration:none">support@codekairo.com</a>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

/** One entrant's mail. */
export function reminderMail(t: ReminderTournament, person: ReminderPerson, kind: ReminderKind, now: Date, o: ReminderOrigins = REMINDER_ORIGINS): ReminderMail {
  const c = compose(t, person, kind, now, o);
  return { subject: c.subject, preheader: c.preheader, text: reminderText(t, person, c, o), html: reminderHtml(t, person, c, o) };
}

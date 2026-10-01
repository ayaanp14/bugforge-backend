import { FRONTEND_URL } from "./sites.js";
import { ASSET_ORIGIN, CODE, FONT_FACES, L, MONO, ON_TEAL, PREHEADER_FILLER, SANS, TEAL_DEEP, escapeHtml } from "./mail-design.js";

/**
 * The welcome mail — what a new account finds in its inbox the moment its
 * address is proven (lib/auth-mail `welcomeNewAccount` decides when).
 *
 * Unlike the codes in auth-mail-copy, this one is allowed to look like the
 * product: it is expected (the person has just signed up), it is sent once,
 * and it is the first thing CodeKairo says outside its own pages. So it
 * follows frontend/DESIGN_SYSTEM.md — ink for structure and the primary
 * action, the teal family for meaning (deep-teal eyebrows, the deep-teal
 * featured band with an inverted button, teal links), hairlines rather than
 * shadows, a 4px grid, and the account drawn as a snippet in the editor's own
 * teal syntax colours (EDITOR_LIGHT / EDITOR_DARK in palette.ts).
 *
 * Mail clients are not browsers, which shapes every line below:
 *  - Layout is tables and every style is inline; the <style> block only adds
 *    what a client may drop without harm — dark mode, the phone layout, web
 *    fonts. Gmail and Outlook ignore @font-face and use the system sans in
 *    the stack; Outlook for Windows also gets a conditional block, because a
 *    stack that opens with a font it cannot load sends it to Times.
 *  - Nothing is an image but the mark, and the mark has alt text, so a client
 *    that blocks images still shows a complete message. The mark and the fonts
 *    come from `ASSET_ORIGIN`, not the configured site: a development server
 *    mailing a real inbox would otherwise point them at localhost. Both paths
 *    are unhashed public files (the hashed /assets names change every build,
 *    and a mail in an inbox lives for years).
 *  - Names come from the person (a GitHub or Google profile), so they are
 *    escaped, trimmed to a first name and capped — see `firstName`.
 */

/** How the account signs in, as named in the mail. */
export type SignInRoad = "email" | "google" | "github";

export interface WelcomeRecipient {
  email: string;
  name: string | null;
  username: string | null;
  via: SignInRoad;
}

// The tokens (ink, the teal family, the editor's syntax colours, the type
// stacks) are shared with the tournament reminder: lib/mail-design.ts.

const ROAD_LABEL: Record<SignInRoad, string> = {
  email: "email + password",
  google: "Google",
  github: "GitHub",
};

/** The four first moves, in the order a new account should meet them. */
const FIRST_MOVES: Array<{ title: string; body: string; link: string; path: string }> = [
  {
    title: "Walk the DSA Roadmap",
    body: "A curriculum drawn as a road: tiers of stages, a handful of problems each, walked in order. Every tier ends in a chest of XP and a bonus mock interview.",
    link: "Open the roadmap",
    path: "/roadmap",
  },
  {
    title: "Solve today's problem",
    body: "One problem a day, the same for everyone. Solve it on the day to rank on the board and keep a streak alive.",
    link: "See today's problem",
    path: "/contests",
  },
  {
    title: "Fix a real bug",
    body: "Over 300 small projects that are genuinely broken — frontend, backend and database, in JavaScript, Python and Java.",
    link: "Pick a bug hunt",
    path: "/bug-hunts",
  },
  {
    title: "Rehearse the interview",
    body: "Sit a written or a voice round with an AI interviewer, and read a scored report when it ends.",
    link: "Build a mock interview",
    path: "/mock-interview",
  },
];

/**
 * The name to greet, or null to greet nobody in particular.
 *
 * The first word of the profile name, because "Welcome, Ayaan" reads as a
 * greeting and "Welcome, Ayaan Pathan" as a form letter. Capped, and refused
 * if it looks like an address or a link: the name is whatever the person
 * typed into Google or GitHub, and the subject line is not a place for it to
 * say anything else. The mail only ever goes to the account's own proven
 * address, so this is tidiness rather than a defence.
 */
export function firstName(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0]?.replace(/[\u0000-\u001f\u007f]/g, "") ?? "";
  if (!first || first.length > 24 || /[@/:]|\.\w/.test(first)) return null;
  return first;
}

export function welcomeSubject(person: WelcomeRecipient): string {
  const name = firstName(person.name);
  return name ? `Welcome to CodeKairo, ${name}` : "Welcome to CodeKairo";
}

/** The inbox's preview line, after the subject. */
const PREHEADER = "Your account is ready. Here's the shortest way in — the roadmap, today's problem, a real bug and a mock interview.";

export function welcomeText(person: WelcomeRecipient, origin: string = FRONTEND_URL): string {
  const name = firstName(person.name);
  const lines = [
    name ? `Welcome to CodeKairo, ${name}.` : "Welcome to CodeKairo.",
    "",
    "Your account is set up and ready. CodeKairo is one place to get good at the coding interview and the job after it: problems in 13 languages, real broken code to fix, live duels, and mock interviews with an AI interviewer.",
    "",
    `Start the DSA Roadmap: ${origin}/roadmap`,
    "",
    "Your account",
    ...(person.username ? [`  Username:      @${person.username}`] : []),
    `  Signs in with: ${ROAD_LABEL[person.via]}`,
    "",
    "Four good first moves",
    "",
  ];
  FIRST_MOVES.forEach((move, i) => {
    lines.push(`0${i + 1}  ${move.title}`, `    ${move.body}`, `    ${origin}${move.path}`, "");
  });
  lines.push(
    "Free, for good",
    "Problems, the roadmap, the daily contest, duels, pair rooms, aptitude and placement tests are unlimited on every plan, Free included. Your first accepted solve earns XP, lights up your heatmap and starts a streak.",
    `Solve your first problem: ${origin}/challenges`,
    "",
    "Questions, or something not working? Reply to this email — it reaches a person.",
    "",
    "— The CodeKairo team",
    "",
    "---",
    `You're receiving this because ${person.email} just created a CodeKairo account.`,
    `Reminder emails can be switched off any time from Profile → Reminders: ${origin}/profile`,
  );
  return lines.join("\n");
}

/** One line of the account snippet: a gutter number and the coloured code. */
function codeLine(n: number, html: string): string {
  return `<tr>
<td class="ck-gutter" width="28" valign="top" style="width:28px;padding:0 12px 0 0;text-align:right;font:400 13px/22px ${MONO};color:${CODE.gutter}">${n}</td>
<td class="ck-code" valign="top" style="padding:0;font:400 13px/22px ${MONO};color:${CODE.text};white-space:pre-wrap;word-break:break-word">${html}</td>
</tr>`;
}

const tok = {
  kw: (s: string) => `<span class="ck-kw" style="color:${CODE.keyword};font-weight:700">${s}</span>`,
  op: (s: string) => `<span class="ck-op" style="color:${CODE.operator}">${s}</span>`,
  str: (s: string) => `<span class="ck-str" style="color:${CODE.string};font-style:italic">"${escapeHtml(s)}"</span>`,
  num: (s: string) => `<span class="ck-num" style="color:${CODE.number}">${s}</span>`,
  cmt: (s: string) => `<span class="ck-cmt" style="color:${CODE.comment};font-style:italic">${s}</span>`,
};

function accountSnippet(person: WelcomeRecipient): string {
  const rows = [`${tok.kw("const")} you ${tok.op("=")} ${tok.op("{")}`];
  if (person.username) rows.push(`  handle${tok.op(":")} ${tok.str(`@${person.username}`)}${tok.op(",")}`);
  rows.push(`  signsInWith${tok.op(":")} ${tok.str(ROAD_LABEL[person.via])}${tok.op(",")}`);
  rows.push(`  streak${tok.op(":")} ${tok.num("0")}${tok.op(",")} ${tok.cmt("// day one")}`);
  rows.push(tok.op("};"));
  return rows.map((html, i) => codeLine(i + 1, html)).join("\n");
}

function firstMoves(origin: string): string {
  return FIRST_MOVES.map(
    (move, i) => `<tr>
<td class="ck-rule" style="border-top:1px solid ${L.border};padding:20px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-eyebrow" width="44" valign="top" style="width:44px;font:600 13px/24px ${MONO};color:${L.highlight}">0${i + 1}</td>
<td valign="top">
<p class="ck-ink" style="margin:0 0 4px;font:600 16px/24px ${SANS};color:${L.ink}">${move.title}</p>
<p class="ck-secondary" style="margin:0 0 8px;font:400 14px/22px ${SANS};color:${L.secondary}">${move.body}</p>
<a class="ck-link" href="${origin}${move.path}" style="font:600 14px/22px ${SANS};color:${L.accent};text-decoration:none">${move.link}&nbsp;&rarr;</a>
</td>
</tr></table>
</td>
</tr>`,
  ).join("\n");
}

export function welcomeHtml(person: WelcomeRecipient, origin: string = FRONTEND_URL): string {
  const name = firstName(person.name);
  const heading = name ? `Welcome to CodeKairo, ${escapeHtml(name)}.` : "Welcome to CodeKairo.";
  const email = escapeHtml(person.email);
  const filler = PREHEADER_FILLER;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(welcomeSubject(person))}</title>
<style>
${FONT_FACES}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
a{text-decoration:none}
@media (max-width:620px){
.ck-outer{padding:16px 12px !important}
.ck-body{padding:28px 20px !important}
.ck-h1{font-size:28px !important;line-height:34px !important}
.ck-band{padding:24px 20px !important}
.ck-btn-cell{display:block !important;width:100% !important}
.ck-btn-cell a{display:block !important;text-align:center !important}
.ck-alt{display:block !important;padding:16px 0 0 !important;text-align:center !important}
}
@media (prefers-color-scheme:dark){
.ck-ground{background:#0A0A0A !important}
.ck-panel{background:#111111 !important;border-color:#262626 !important}
.ck-ink{color:#F5F5F5 !important}
.ck-secondary{color:#A3A3A3 !important}
.ck-muted,.ck-muted a{color:#8C8C8C !important}
.ck-eyebrow,.ck-link{color:#00B7B5 !important}
.ck-rule{border-color:#262626 !important}
.ck-well{background:#0D0D0D !important;border-color:#262626 !important}
.ck-code{color:#F4F4F4 !important}
.ck-gutter{color:#595959 !important}
.ck-kw{color:#00B7B5 !important}
.ck-str{color:#33C5C4 !important}
.ck-num{color:#CCF1F0 !important}
.ck-op{color:#99A9AA !important}
.ck-cmt{color:#6E7B7C !important}
.ck-btn{background:#F5F5F5 !important}
.ck-btn a{color:#111111 !important}
}
</style>
<!--[if mso]><style>body,table,td,p,a,span,h1{font-family:'Segoe UI',Arial,sans-serif !important}</style><![endif]-->
</head>
<body class="ck-ground" style="margin:0;padding:0;background:${L.ground}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${L.ground}">${PREHEADER}${filler}</div>
<table role="presentation" class="ck-ground" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.ground}">
<tr><td class="ck-outer" align="center" style="padding:40px 16px">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-panel" style="background:${L.panel};border:1px solid ${L.border};border-radius:12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="ck-body" style="padding:40px 48px">

<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding:0 10px 0 0"><img src="${ASSET_ORIGIN}/icon-192.png" width="32" height="32" alt="CodeKairo" style="display:block;width:32px;height:32px;border:0;border-radius:8px"></td>
<td valign="middle" class="ck-ink" style="font:700 18px/24px ${SANS};letter-spacing:-0.02em;color:${L.ink}">CodeKairo</td>
</tr></table>

<p class="ck-eyebrow" style="margin:40px 0 12px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.highlight}">Account ready</p>
<h1 class="ck-ink ck-h1" style="margin:0 0 16px;font:700 32px/38px ${SANS};letter-spacing:-0.02em;color:${L.ink}">${heading}</h1>
<p class="ck-secondary" style="margin:0 0 32px;font:400 16px/26px ${SANS};color:${L.secondary}">Your account is set up and ready. CodeKairo is one place to get good at the coding interview and the job after it — problems in 13 languages, real broken code to fix, live duels, and mock interviews with an AI interviewer.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn-cell" style="width:1%;white-space:nowrap">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn" bgcolor="${L.ink}" style="background:${L.ink};border-radius:8px">
<a href="${origin}/roadmap" style="display:inline-block;padding:14px 24px;font:600 15px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:8px">Start the DSA Roadmap&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td>
<td class="ck-alt" style="padding:0 0 0 20px">
<a class="ck-link" href="${origin}/challenges" style="font:600 15px/20px ${SANS};color:${L.accent};text-decoration:none">or browse every problem</a>
</td>
</tr></table>

<table role="presentation" class="ck-well" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:40px 0 0;background:${L.well};border:1px solid ${L.border};border-radius:8px">
<tr><td style="padding:16px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${accountSnippet(person)}
</table>
</td></tr>
</table>

<p class="ck-ink" style="margin:48px 0 4px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">Four good first moves</p>
<p class="ck-secondary" style="margin:0 0 16px;font:400 14px/22px ${SANS};color:${L.secondary}">Pick any one. Every solve, wherever it happens, counts toward the rest.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${firstMoves(origin)}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0">
<tr><td class="ck-band" bgcolor="${TEAL_DEEP}" style="background:${TEAL_DEEP};border-radius:12px;padding:32px">
<p style="margin:0 0 8px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${ON_TEAL.muted}">Free, for good</p>
<p style="margin:0 0 8px;font:700 22px/28px ${SANS};letter-spacing:-0.02em;color:#FFFFFF">Practice never runs out.</p>
<p style="margin:0 0 24px;font:400 15px/24px ${SANS};color:${ON_TEAL.secondary}">Problems, the roadmap, the daily contest, duels, pair rooms, aptitude and placement tests are unlimited on every plan, Free included. Your first accepted solve earns XP, lights up your heatmap and starts a streak.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:8px">
<a href="${origin}/challenges" style="display:inline-block;padding:12px 20px;font:600 15px/20px ${SANS};color:${TEAL_DEEP};text-decoration:none;border-radius:8px">Solve your first problem</a>
</td></tr></table>
</td></tr>
</table>

<p class="ck-secondary" style="margin:40px 0 4px;font:400 15px/24px ${SANS};color:${L.secondary}">Questions, or something not working? Reply to this email — it reaches a person.</p>
<p class="ck-ink" style="margin:0;font:600 15px/24px ${SANS};color:${L.ink}">— The CodeKairo team</p>

</td></tr>
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-muted" align="center" style="padding:24px 24px 0;font:400 12px/20px ${SANS};color:${L.muted}">
You're receiving this because ${email} just created a CodeKairo account.<br>
Reminder emails can be switched off any time from <a href="${origin}/profile" style="color:${L.muted};text-decoration:underline">Profile&nbsp;&rarr;&nbsp;Reminders</a>.<br><br>
<a href="${origin}" style="color:${L.muted};text-decoration:none;font-weight:600">CodeKairo</a> &nbsp;·&nbsp; <a href="mailto:support@codekairo.com" style="color:${L.muted};text-decoration:none">support@codekairo.com</a>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

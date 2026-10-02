/**
 * The "free until January" campaign — one mail to every account announcing
 * the free-for-all period (lib/plans.ts FREE_FOR_ALL_UNTIL, decided
 * 2026-10-01).
 *
 *   npx tsx scripts/campaigns/free-until-january.ts
 *
 * writes free-until-january.html beside this file. Upload it on
 * campaign.codekairo.com (frontend/campaign) with the subject printed by
 * the run (the preview text rides in the HTML). That page sends through
 * Resend, not lib/brevo.ts: Brevo's free 300 a day carry the sign-up codes,
 * and a send to every account through it would starve verification.
 *
 * Built on the welcome mail's tokens (lib/mail-design.ts) and its rules —
 * tables, every style inline, the <style> block only for what a client may
 * drop (dark mode, the phone layout, web fonts); the reasons are in
 * welcome-mail-copy.ts's header. Unlike the welcome mail it greets nobody:
 * the first line is the hook, and a "Hi {{name|there}}," in front of it
 * buries it. `{{unsubscribe_url}}` is the tool's merge tag; a marketing send
 * must carry one.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ASSET_ORIGIN, CODE, FONT_FACES, L, MONO, PREHEADER_FILLER, SANS, escapeHtml } from "../../src/lib/mail-design.js";
import { freeForAllUntilLabel } from "../../src/lib/plans.js";

/** Production, always: the campaign leaves from the campaign tool, never from a dev server. */
const SITE = "https://codekairo.com";
const CAMPAIGN = "free-until-january";

/**
 * utm_* are what google-analytics.ts keeps when it scrubs page_location, so
 * GA4 can say what this mail brought in.
 */
const link = (path: string) => `${SITE}${path}?utm_source=newsletter&utm_medium=email&utm_campaign=${CAMPAIGN}`;

const UNTIL = freeForAllUntilLabel(); // "1 January 2027"

const SUBJECT = "We switched the paywall off";
const PREHEADER = `Unlimited mock interviews, 30-minute voice rounds and bug hunts — free for every account until ${UNTIL}. No card.`;

/** Three ways to spend it: the two limits that were lifted, then what shipped the same day. */
const WAYS: Array<{ title: string; body: string; cta: string; path: string; isNew?: boolean }> = [
  {
    title: "Sit a 30-minute voice round",
    body: "Answer out loud to an AI interviewer that asks follow-ups, then read a scored report. Free accounts used to stop at ten minutes, twice a week.",
    cta: "Start a mock interview",
    path: "/mock-interview",
  },
  {
    title: "Fix every bug you can find",
    body: "More than 300 genuinely broken projects — frontend, backend and database, in JavaScript, Python and Java. The one-a-day cap is gone.",
    cta: "Pick a bug hunt",
    path: "/bug-hunts",
  },
  {
    title: "Earn a certificate",
    body: "Skill tests in Java, Python, JavaScript, C++, SQL and DSA. Pass one and you get a credential anyone can verify — and add to LinkedIn.",
    cta: "Take a skill test",
    path: "/skill-tests",
    isNew: true,
  },
];

const tok = {
  op: (s: string) => `<span class="ck-op" style="color:${CODE.operator}">${s}</span>`,
  str: (s: string) => `<span class="ck-str" style="color:${CODE.string};font-style:italic">"${escapeHtml(s)}"</span>`,
  num: (s: string) => `<span class="ck-num" style="color:${CODE.number}">${s}</span>`,
  cmt: (s: string) => `<span class="ck-cmt" style="color:${CODE.comment};font-style:italic">${s}</span>`,
};

/**
 * The account, as a diff: the lifted limits read as a change to the reader's
 * own code. A removed line is struck through as well as marked, for anyone
 * who does not read diffs; an added one sits on a teal wash (the selection
 * tint, 10% of the accent over the well).
 */
function diffLine(sign: "-" | "+", html: string): string {
  const added = sign === "+";
  const row = added ? ` class="ck-add" bgcolor="#E6F3F4" style="background:#E6F3F4"` : "";
  const mark = added
    ? `<td class="ck-gutter ck-plus" width="28" valign="top" style="width:28px;padding:2px 0 2px 16px;font:700 13px/22px ${MONO};color:${L.accent}">+</td>`
    : `<td class="ck-gutter" width="28" valign="top" style="width:28px;padding:2px 0 2px 16px;font:700 13px/22px ${MONO};color:${CODE.gutter}">&minus;</td>`;
  const code = added
    ? `<td class="ck-code" valign="top" style="padding:2px 16px 2px 0;font:400 13px/22px ${MONO};color:${CODE.text};white-space:pre-wrap;word-break:break-word">${html}</td>`
    : `<td class="ck-code ck-del" valign="top" style="padding:2px 16px 2px 0;font:400 13px/22px ${MONO};color:${L.muted};white-space:pre-wrap;word-break:break-word;text-decoration:line-through">${html}</td>`;
  return `<tr${row}>${mark}${code}</tr>`;
}

function accountDiff(): string {
  return [
    diffLine("-", `limits ${tok.op("=")} <span style="color:${L.muted}">"some"</span>${tok.op(";")}`),
    diffLine("+", `limits ${tok.op("=")} ${tok.str("none")}${tok.op(";")}`),
    diffLine("+", `price${"&nbsp;"} ${tok.op("=")} ${tok.num("0")}${tok.op(";")}  ${tok.cmt("// until 1 Jan")}`),
  ].join("\n");
}

function ways(): string {
  return WAYS.map(
    (way, i) => `<tr>
<td class="ck-rule" style="border-top:1px solid ${L.border};padding:20px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-eyebrow" width="44" valign="top" style="width:44px;font:600 13px/24px ${MONO};color:${L.highlight}">0${i + 1}</td>
<td valign="top">
<p class="ck-ink" style="margin:0 0 4px;font:600 16px/24px ${SANS};color:${L.ink}">${way.title}${
      way.isNew
        ? `&nbsp;&nbsp;<span class="ck-new" style="display:inline-block;padding:0 6px;border:1px solid ${L.accent};border-radius:4px;font:600 10px/16px ${MONO};letter-spacing:0.06em;color:${L.accent};vertical-align:2px">NEW</span>`
        : ""
    }</p>
<p class="ck-secondary" style="margin:0 0 8px;font:400 14px/22px ${SANS};color:${L.secondary}">${way.body}</p>
<a class="ck-link" href="${link(way.path)}" style="font:600 14px/22px ${SANS};color:${L.accent};text-decoration:none">${way.cta}&nbsp;&rarr;</a>
</td>
</tr></table>
</td>
</tr>`,
  ).join("\n");
}

function campaignHtml(): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(SUBJECT)}</title>
<style>
${FONT_FACES}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
a{text-decoration:none}
@media (max-width:620px){
.ck-outer{padding:16px 12px !important}
.ck-body{padding:32px 20px !important}
.ck-h1{font-size:34px !important;line-height:38px !important}
.ck-code,.ck-gutter{font-size:12px !important}
.ck-btn-cell{display:block !important;width:100% !important}
.ck-btn-cell a{display:block !important;text-align:center !important}
.ck-alt{display:block !important;padding:16px 0 0 !important;text-align:center !important}
}
@media (prefers-color-scheme:dark){
.ck-ground{background:#0A0A0A !important}
.ck-panel{background:#111111 !important;border-color:#262626 !important}
.ck-ink{color:#F5F5F5 !important}
.ck-secondary{color:#A3A3A3 !important}
.ck-muted,.ck-muted a,.ck-code.ck-del,.ck-del span{color:#737373 !important}
.ck-eyebrow,.ck-link,.ck-gutter.ck-plus{color:#00B7B5 !important}
.ck-new{color:#00B7B5 !important;border-color:#00B7B5 !important}
.ck-rule{border-color:#262626 !important}
.ck-well{background:#0D0D0D !important;border-color:#262626 !important}
.ck-add{background:#0B2121 !important}
.ck-code{color:#F4F4F4 !important}
.ck-gutter{color:#595959 !important}
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
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${L.ground}">${escapeHtml(PREHEADER)}${PREHEADER_FILLER}</div>
<table role="presentation" class="ck-ground" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.ground}">
<tr><td class="ck-outer" align="center" style="padding:40px 16px">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-panel" style="background:${L.panel};border:1px solid ${L.border};border-radius:12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="ck-body" style="padding:48px">

<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding:0 10px 0 0"><img src="${ASSET_ORIGIN}/icon-192.png" width="28" height="28" alt="CodeKairo" style="display:block;width:28px;height:28px;border:0;border-radius:7px"></td>
<td valign="middle" class="ck-ink" style="font:700 16px/24px ${SANS};letter-spacing:-0.02em;color:${L.ink}">CodeKairo</td>
</tr></table>

<p class="ck-eyebrow" style="margin:48px 0 12px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.highlight}">Free until ${escapeHtml(UNTIL)}</p>
<h1 class="ck-ink ck-h1" style="margin:0 0 20px;font:700 40px/44px ${SANS};letter-spacing:-0.03em;color:${L.ink}">We switched the paywall&nbsp;off.</h1>
<p class="ck-secondary" style="margin:0 0 32px;font:400 17px/28px ${SANS};color:${L.secondary}">For the rest of the year, every CodeKairo account gets everything the top plan has — unlimited mock interviews, full 30-minute voice rounds, unlimited bug hunts. No card, no trial to cancel. It's already on for you.</p>

<table role="presentation" class="ck-well" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;background:${L.well};border:1px solid ${L.border};border-radius:8px">
<tr><td class="ck-rule ck-muted" style="padding:10px 16px;border-bottom:1px solid ${L.border};font:400 12px/16px ${MONO};color:${L.muted}">your-account.diff</td></tr>
<tr><td style="padding:10px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${accountDiff()}
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn-cell" style="width:1%;white-space:nowrap">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn" bgcolor="${L.ink}" style="background:${L.ink};border-radius:8px">
<a href="${link("/mock-interview")}" style="display:inline-block;padding:14px 24px;font:600 15px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:8px">Start a mock interview&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td>
<td class="ck-alt" style="padding:0 0 0 20px">
<a class="ck-link" href="${link("/pricing")}" style="font:600 15px/20px ${SANS};color:${L.accent};text-decoration:none">or see what's included</a>
</td>
</tr></table>

<p class="ck-ink" style="margin:56px 0 16px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">Three ways to spend it</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${ways()}
</table>

<p class="ck-secondary ck-rule" style="margin:4px 0 0;padding:24px 0 0;border-top:1px solid ${L.border};font:400 15px/24px ${SANS};color:${L.secondary}">It runs until ${escapeHtml(UNTIL)}, midnight IST. After that, plans go back to their prices — and everything you solve and earn before then stays yours.</p>
<p class="ck-secondary" style="margin:16px 0 4px;font:400 15px/24px ${SANS};color:${L.secondary}">Questions? Reply to this email — it reaches a person.</p>
<p class="ck-ink" style="margin:0;font:600 15px/24px ${SANS};color:${L.ink}">— The CodeKairo team</p>

</td></tr>
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-muted" align="center" style="padding:24px 24px 0;font:400 12px/20px ${SANS};color:${L.muted}">
You're receiving this because you have a CodeKairo account.<br>
<a href="{{unsubscribe_url}}" style="color:${L.muted};text-decoration:underline">Unsubscribe</a> from news like this — account emails are unaffected.<br><br>
<a href="${link("/")}" style="color:${L.muted};text-decoration:none;font-weight:600">CodeKairo</a> &nbsp;·&nbsp; <a href="mailto:support@codekairo.com" style="color:${L.muted};text-decoration:none">support@codekairo.com</a>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

const out = fileURLToPath(new URL(`./${CAMPAIGN}.html`, import.meta.url));
writeFileSync(out, campaignHtml());
console.log(`wrote ${out}\n\nSubject:      ${SUBJECT}\nPreview text: ${PREHEADER}`);

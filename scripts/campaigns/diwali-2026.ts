/**
 * The Diwali 2026 campaign: one mail on the first day, Wednesday 4 November,
 * announcing "Light five diyas" (lib/festival.ts).
 *
 *   npx tsx scripts/campaigns/diwali-2026.ts
 *
 * writes diwali-2026.html beside this file. Upload it on
 * campaign.codekairo.com (frontend/campaign) with the subject printed by the
 * run, as free-until-january.ts says, and on the same tokens and rules: tables,
 * every style inline, the <style> block only for what a client may drop.
 *
 * Nothing is promised that the code does not do: any accepted coding or SQL
 * submission lights one diya a day, and the badge takes five of the seven days. There is no offer, because everything is already free until
 * the date in lib/plans.ts.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ASSET_ORIGIN, FONT_FACES, L, PREHEADER_FILLER, SANS, escapeHtml } from "../../src/lib/mail-design.js";

const SITE = "https://codekairo.com";
const CAMPAIGN = "diwali-2026";
const link = (path: string) => `${SITE}${path}?utm_source=newsletter&utm_medium=email&utm_campaign=${CAMPAIGN}`;

const SUBJECT = "Happy Diwali! Light five diyas by 10 November";
const PREHEADER = "Solve one problem a day from 4 to 10 November to light a diya. Light five for a limited-edition badge.";

const REWARDS: Array<{ count: string; title: string; body: string }> = [
  { count: "1 diya", title: "A festive frame", body: "Round your picture across CodeKairo until 11 November." },
  { count: "3 diyas", title: "Your Diwali card", body: "A Diwali greeting from the CodeKairo team with your numbers on it, ready to send to friends." },
  { count: "5 diyas", title: "The Festival of Lights 2026 badge", body: "On your profile for good, and nobody can earn it after 10 November." },
];

function rewards(): string {
  return REWARDS.map(
    (r) => `<tr>
<td class="ck-rule" style="border-top:1px solid ${L.border};padding:18px 0">
<p class="ck-eyebrow" style="margin:0 0 4px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.highlight}">${r.count}</p>
<p class="ck-ink" style="margin:0 0 4px;font:600 16px/24px ${SANS};color:${L.ink}">${r.title}</p>
<p class="ck-secondary" style="margin:0;font:400 14px/22px ${SANS};color:${L.secondary}">${r.body}</p>
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
.ck-btn-cell{display:block !important;width:100% !important}
.ck-btn-cell a{display:block !important;text-align:center !important}
}
@media (prefers-color-scheme:dark){
.ck-ground{background:#0A0A0A !important}
.ck-panel{background:#111111 !important;border-color:#262626 !important}
.ck-ink{color:#F5F5F5 !important}
.ck-secondary{color:#A3A3A3 !important}
.ck-muted,.ck-muted a{color:#737373 !important}
.ck-eyebrow{color:#7CC9FF !important}
.ck-rule{border-color:#262626 !important}
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

<p class="ck-eyebrow" style="margin:48px 0 12px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${L.highlight}">4 to 10 November</p>
<h1 class="ck-ink ck-h1" style="margin:0 0 20px;font:700 40px/44px ${SANS};letter-spacing:-0.03em;color:${L.ink}">Happy Diwali. Light five&nbsp;diyas.</h1>
<p class="ck-secondary" style="margin:0 0 32px;font:400 17px/28px ${SANS};color:${L.secondary}">One solve a day lights a diya on your home page. Any coding or SQL problem counts, in any language, and even an easy one will do. You have seven days to light five, so start today.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn-cell" style="width:1%;white-space:nowrap">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn" bgcolor="${L.ink}" style="background:${L.ink};border-radius:8px">
<a href="${link("/")}" style="display:inline-block;padding:14px 24px;font:600 15px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:8px">Light today's diya&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td>
<td></td>
</tr></table>

<p class="ck-ink" style="margin:48px 0 16px;font:600 20px/28px ${SANS};letter-spacing:-0.01em;color:${L.ink}">What the lights earn</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rewards()}
</table>

<p class="ck-secondary ck-rule" style="margin:4px 0 0;padding:24px 0 0;border-top:1px solid ${L.border};font:400 15px/24px ${SANS};color:${L.secondary}">Wishing you and your family a bright Diwali.</p>
<p class="ck-ink" style="margin:12px 0 0;font:600 15px/24px ${SANS};color:${L.ink}">The CodeKairo team</p>

</td></tr>
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-muted" align="center" style="padding:24px 24px 0;font:400 12px/20px ${SANS};color:${L.muted}">
You're receiving this because you have a CodeKairo account.<br>
<a href="{{unsubscribe_url}}" style="color:${L.muted};text-decoration:underline">Unsubscribe</a> from news like this. Account emails are unaffected.<br><br>
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

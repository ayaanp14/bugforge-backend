import { FRONTEND_URL } from "./sites.js";
import { firstName } from "./welcome-mail-copy.js";
import { ASSET_ORIGIN, FONT_FACES, L, ON_TEAL, PREHEADER_FILLER, SANS, TEAL_DEEP, escapeHtml } from "./mail-design.js";
import { honourDef } from "./honours.js";

/**
 * The mail an honour sends its holder (services/honours.ts grantHonour).
 *
 * The welcome mail's design (welcome-mail-copy.ts — read its header for why
 * every style is inline and the layout is tables), with one colour the
 * product otherwise keeps for its badges: the founding member's gold, which
 * is the honour's own (frontend lib/honours.ts HONOUR_GOLD), drawn as the
 * medal and a hairline under it. The words are the celebration's — thanks,
 * lifetime access, a request for their thoughts — so the mail and the moment
 * on the site say the same thing in the same order. Its one button opens the
 * site, where the celebration is waiting.
 */

export interface HonourRecipient {
  email: string;
  name: string | null;
  username: string | null;
}

const GOLD = "#B7791F";
const GOLD_SOFT = "#F6E7C8";

const PREHEADER = "A thank-you from CodeKairo — and lifetime access to everything, on us.";

export function honourSubject(kind: string, person: HonourRecipient): string {
  const def = honourDef(kind);
  const name = firstName(person.name);
  return `${name ? `${name}, you're` : "You're"} a CodeKairo ${def?.name ?? "honouree"}`;
}

export function honourText(kind: string, person: HonourRecipient, origin: string = FRONTEND_URL): string {
  const def = honourDef(kind);
  const name = firstName(person.name);
  return [
    name ? `Hi ${name},` : "Hi,",
    "",
    `Thank you. You were one of the very first people to use CodeKairo, and one of the most active — and we noticed. So from today you are a CodeKairo ${def?.name ?? "honouree"}.`,
    "",
    "What that means:",
    `- A ${def?.name ?? "honour"} badge on your profile, and a frame round your picture and name that only founding members wear.`,
    "- Lifetime free access to everything on CodeKairo — every plan, every limit lifted, for good.",
    "- We will always count you among the people who believed in CodeKairo first.",
    "",
    `Open CodeKairo to see your badge (there is a small celebration waiting): ${origin}/`,
    "",
    "One favour: tell us what to make better. There is a box for it right under the celebration, or simply reply to this email — it reaches the founder.",
    "",
    "— The CodeKairo team",
    "",
    `You're receiving this because ${person.email} holds a CodeKairo account.`,
  ].join("\n");
}

export function honourHtml(kind: string, person: HonourRecipient, origin: string = FRONTEND_URL): string {
  const def = honourDef(kind);
  const title = def?.name ?? "Honouree";
  const name = firstName(person.name);
  const heading = name ? `Thank you, ${escapeHtml(name)}.` : "Thank you.";
  const email = escapeHtml(person.email);
  const handle = person.username ? `@${escapeHtml(person.username)}` : "";

  const perk = (lead: string, body: string) => `<tr>
<td valign="top" style="padding:0 12px 16px 0;width:20px"><div style="width:8px;height:8px;margin-top:8px;border-radius:50%;background:${GOLD}"></div></td>
<td valign="top" class="ck-secondary" style="padding:0 0 16px;font:400 15px/24px ${SANS};color:${L.secondary}"><strong class="ck-ink" style="font-weight:600;color:${L.ink}">${lead}</strong> ${body}</td>
</tr>`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(honourSubject(kind, person))}</title>
<style>
${FONT_FACES}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
a{text-decoration:none}
@media (max-width:620px){
.ck-outer{padding:16px 12px !important}
.ck-body{padding:28px 20px !important}
.ck-h1{font-size:28px !important;line-height:34px !important}
.ck-band{padding:24px 20px !important}
.ck-btn-cell a{display:block !important;text-align:center !important}
}
@media (prefers-color-scheme:dark){
.ck-ground{background:#0A0A0A !important}
.ck-panel{background:#111111 !important;border-color:#262626 !important}
.ck-ink{color:#F5F5F5 !important}
.ck-secondary{color:#A3A3A3 !important}
.ck-muted,.ck-muted a{color:#8C8C8C !important}
.ck-gold{color:#E3B341 !important}
.ck-card{background:#1A1508 !important;border-color:#3D2F10 !important}
.ck-btn{background:#F5F5F5 !important}
.ck-btn a{color:#111111 !important}
}
</style>
<!--[if mso]><style>body,table,td,p,a,span,h1{font-family:'Segoe UI',Arial,sans-serif !important}</style><![endif]-->
</head>
<body class="ck-ground" style="margin:0;padding:0;background:${L.ground}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${L.ground}">${PREHEADER}${PREHEADER_FILLER}</div>
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

<table role="presentation" class="ck-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;background:#FFFBF2;border:1px solid ${GOLD_SOFT};border-radius:12px">
<tr><td align="center" style="padding:28px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" width="72" height="72" style="width:72px;height:72px;border-radius:50%;background:${GOLD};border:3px solid ${GOLD_SOFT};font:700 30px/72px ${SANS};color:#FFFFFF;text-align:center">&#9733;</td>
</tr></table>
<p class="ck-gold" style="margin:16px 0 4px;font:700 12px/16px ${SANS};letter-spacing:0.14em;text-transform:uppercase;color:${GOLD}">${escapeHtml(title)}</p>
<p class="ck-ink" style="margin:0;font:600 15px/22px ${SANS};color:${L.ink}">${name ? escapeHtml(person.name ?? name) : "You"}${handle ? ` <span class="ck-secondary" style="font-weight:400;color:${L.secondary}">${handle}</span>` : ""}</p>
</td></tr>
</table>

<h1 class="ck-ink ck-h1" style="margin:32px 0 16px;font:700 32px/38px ${SANS};letter-spacing:-0.02em;color:${L.ink}">${heading}</h1>
<p class="ck-secondary" style="margin:0 0 16px;font:400 16px/26px ${SANS};color:${L.secondary}">You were one of the very first people to use CodeKairo, and one of the most active. Every problem you solved and every bug you chased helped shape what it is today — and we noticed.</p>
<p class="ck-secondary" style="margin:0 0 28px;font:400 16px/26px ${SANS};color:${L.secondary}">So from today you are a <strong class="ck-ink" style="font-weight:600;color:${L.ink}">CodeKairo ${escapeHtml(title)}</strong>.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${perk(`A ${escapeHtml(title)} badge`, "on your profile, and a frame round your picture and name that only founding members wear.")}
${perk("Lifetime free access", "to everything on CodeKairo — every plan, every limit lifted, for good.")}
${perk("Always one of ours.", "We will always count you among the people who believed in CodeKairo first.")}
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 0"><tr>
<td class="ck-btn-cell">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="ck-btn" bgcolor="${L.ink}" style="background:${L.ink};border-radius:8px">
<a href="${origin}/" style="display:inline-block;padding:14px 24px;font:600 15px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:8px">See your badge&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td></tr></table>
<p class="ck-secondary" style="margin:12px 0 0;font:400 13px/20px ${SANS};color:${L.secondary}">There is a small celebration waiting the next time you open CodeKairo.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:40px 0 0">
<tr><td class="ck-band" bgcolor="${TEAL_DEEP}" style="background:${TEAL_DEEP};border-radius:12px;padding:32px">
<p style="margin:0 0 8px;font:600 12px/16px ${SANS};letter-spacing:0.06em;text-transform:uppercase;color:${ON_TEAL.muted}">One favour</p>
<p style="margin:0 0 8px;font:700 22px/28px ${SANS};letter-spacing:-0.02em;color:#FFFFFF">Tell us what to make better.</p>
<p style="margin:0;font:400 15px/24px ${SANS};color:${ON_TEAL.secondary}">You know CodeKairo better than almost anyone. There is a box for your thoughts right under the celebration — or simply reply to this email. It reaches the founder.</p>
</td></tr>
</table>

<p class="ck-ink" style="margin:40px 0 0;font:600 15px/24px ${SANS};color:${L.ink}">— The CodeKairo team</p>

</td></tr>
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td class="ck-muted" align="center" style="padding:24px 24px 0;font:400 12px/20px ${SANS};color:${L.muted}">
You're receiving this because ${email} holds a CodeKairo account.<br>
CodeKairo · <a href="${origin}" style="color:${L.muted};text-decoration:underline">codekairo.com</a>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

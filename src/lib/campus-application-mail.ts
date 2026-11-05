import { escapeHtml } from "./mail-design.js";
import type { TransactionalEmail } from "./brevo.js";

/**
 * The mail the team gets when someone applies to the ambassador programme
 * (routes/campus.ts). An application used to reach nobody: the row was saved,
 * a line went to the server log, and the page's "we reply either way" rested
 * on someone remembering to look.
 *
 * It is an internal notice, so plain markup rather than the welcome mail's
 * design. Every value is what a stranger typed into a public form: escaped in
 * the HTML, and a link only when `applicantLink` accepts it. Reply-To is the
 * applicant, so answering the mail answers them.
 */

const CAMPUS_INBOX = "support@codekairo.com";

export interface CampusApplication {
  name: string;
  email: string;
  college: string;
  why: string;
  phone: string | null;
  city: string | null;
  graduationYear: string | null;
  linkedin: string | null;
  instagram: string | null;
  reach: string | null;
}

/**
 * A profile field as something safe to click, or null to show it as text. The
 * form takes anything: a full URL, "linkedin.com/in/x", a bare "@handle". Only
 * http(s) passes, which is what keeps a `javascript:` value out of an href; the
 * admin panel draws these links too (routes/admin.ts).
 */
export function applicantLink(raw: string | null): string | null {
  const value = raw?.trim();
  if (!value || /\s/.test(value)) return null;
  const url = /^https?:\/\//i.test(value) ? value : /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}\//i.test(value) ? `https://${value}` : null;
  if (!url) return null;
  try {
    return new URL(url).href;
  } catch {
    return null;
  }
}

/** One line, however the fields were typed: the form's values are not trusted to hold no newlines. */
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function campusApplicationMail(app: CampusApplication, adminUrl: string): TransactionalEmail {
  const rows: Array<[string, string | null, string | null]> = [
    ["Name", app.name, null],
    ["Email", app.email, `mailto:${encodeURIComponent(app.email).replace(/%40/g, "@")}`],
    ["Phone / WhatsApp", app.phone, null],
    ["City", app.city, null],
    ["College", app.college, null],
    ["Graduating in", app.graduationYear, null],
    ["LinkedIn", app.linkedin, applicantLink(app.linkedin)],
    ["Instagram", app.instagram, applicantLink(app.instagram)],
    ["Clubs and groups they can reach", app.reach, null],
    ["What they would run in their first month", app.why, null],
  ];
  const filled = rows.filter((row): row is [string, string, string | null] => Boolean(row[1]));

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111111;max-width:640px">
<p style="margin:0 0 16px">New ambassador application.</p>
${filled.map(([label, value, href]) => {
    const shown = escapeHtml(value).replace(/\r?\n/g, "<br>");
    return `<p style="margin:0 0 12px"><span style="color:#666666;font-size:12px">${escapeHtml(label)}</span><br>${href ? `<a href="${escapeHtml(href)}">${shown}</a>` : shown}</p>`;
  }).join("\n")}
<p style="margin:20px 0 0"><a href="${escapeHtml(adminUrl)}">Review it in the admin panel</a>. Replying to this mail goes to the applicant.</p>
</div>`;

  const text = [
    "New ambassador application.",
    "",
    ...filled.map(([label, value]) => `${label}: ${value}`),
    "",
    `Review it in the admin panel: ${adminUrl}`,
    "Replying to this mail goes to the applicant.",
  ].join("\n");

  return {
    to: CAMPUS_INBOX,
    replyTo: app.email,
    subject: `New ambassador application: ${oneLine(app.name)}, ${oneLine(app.college)}`,
    html,
    text,
    tags: ["campus-application"],
  };
}

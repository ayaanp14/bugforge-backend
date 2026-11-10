/**
 * A mail to the owner when a daily video run ends: posted, held for a check, or
 * failed (the owner's ask, 2026-11-10, after a run failed at 15:01 and was only
 * seen on the campaign page). Sent through Brevo (lib/brevo.ts) to the addresses
 * in VIDEO_NOTIFY_EMAIL (comma-separated; unset means no mail). The address lives
 * in the server's environment, not here, because this repository is public.
 *
 * Called from reportStatus in services/video-studio.ts only when a run moves into
 * a finished state, so each ending mails once: the workflow's report-failure job
 * repeating "failed" sends nothing, and a re-run that then posts mails again.
 */
import type { VideoRun } from "@prisma/client";
import { isReservedAddress, sendTransactional } from "../lib/brevo.js";
import { CAMPAIGN_URL } from "../lib/sites.js";

const recipients = () =>
  (process.env["VIDEO_NOTIFY_EMAIL"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && !isReservedAddress(s));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The mail's subject line and its lines, as plain text; the HTML is the same lines with links. */
export function videoMail(run: Pick<VideoRun, "id" | "status" | "title" | "prompt" | "usd" | "error" | "logUrl" | "landscapeId" | "shortId" | "reelUrl" | "privacy" | "warnings">) {
  const name = run.title || run.prompt;
  const subject =
    run.status === "done" ? `Posted: ${name}` : run.status === "needs_review" ? `Check this one: ${name}` : `Video failed: ${name}`;
  const lines: { label: string; text: string; href?: string }[] = [];
  if (run.status === "done") lines.push({ label: "Status", text: `Posted (${run.privacy})` });
  if (run.status === "needs_review") lines.push({ label: "Status", text: "Posted private: the automatic review didn't clear it. Watch it, then make it public in YouTube Studio if it's right." });
  if (run.status === "failed") lines.push({ label: "Error", text: (run.error ?? "No error was reported.").slice(0, 1500) });
  if (run.landscapeId) lines.push({ label: "Video", text: `https://youtu.be/${run.landscapeId}`, href: `https://youtu.be/${run.landscapeId}` });
  if (run.shortId) lines.push({ label: "Short", text: `https://youtube.com/shorts/${run.shortId}`, href: `https://youtube.com/shorts/${run.shortId}` });
  if (run.reelUrl) lines.push({ label: "Instagram", text: run.reelUrl, href: run.reelUrl });
  if (run.status !== "failed" && (run.landscapeId || run.shortId)) lines.push({ label: "To do", text: "Pin the channel's comment on each video (YouTube Studio, the comment's menu, Pin)." });
  const warnings = Array.isArray(run.warnings) ? (run.warnings as unknown[]).map(String) : [];
  if (warnings.length) lines.push({ label: "Warnings", text: warnings.slice(0, 10).join("\n") });
  if (typeof run.usd === "number") lines.push({ label: "Claude", text: `$${run.usd.toFixed(2)}` });
  if (run.logUrl) lines.push({ label: "Log", text: run.logUrl, href: run.logUrl });
  const page = `${CAMPAIGN_URL}/?tab=videos`;
  lines.push({ label: "Videos tab", text: page, href: page });
  return { subject: subject.slice(0, 180), lines };
}

/** Never throws: a mail that doesn't leave must not touch the run it reports on. */
export async function notifyVideoRun(run: Parameters<typeof videoMail>[0]): Promise<void> {
  const to = recipients();
  if (!to.length) return;
  const { subject, lines } = videoMail(run);
  const text = [subject, "", ...lines.map((l) => `${l.label}: ${l.text}`)].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">
<p style="font-size:16px;font-weight:bold;margin:0 0 12px">${esc(subject)}</p>
${lines
  .map((l) => `<p style="margin:0 0 8px"><strong>${esc(l.label)}:</strong> ${l.href ? `<a href="${esc(l.href)}">${esc(l.text)}</a>` : esc(l.text).replace(/\n/g, "<br>")}</p>`)
  .join("\n")}
</div>`;
  for (const address of to) {
    await sendTransactional({ to: address, subject, html, text, tags: ["video-studio"] }).catch((err) => console.error("[video-studio] notice not sent:", err));
  }
}

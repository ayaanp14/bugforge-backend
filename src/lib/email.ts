/**
 * Outbound mail — the reminders (streak at risk, daily kata, weekly digest).
 *
 * Brevo first (`BREVO_API_KEY`, lib/brevo), the hosted flow second
 * (`EMAIL_WEBHOOK_URL`), the same order the one-time codes use in
 * auth-mail.ts, so one provider serves both and neither depends on which
 * deployment has been wired.
 *
 * Having neither is a deliberate state, not a failure: local development and
 * any deployment without credentials simply skip the send. In-app
 * notifications are written regardless, so the reminder still exists; it just
 * does not leave the product. That is also why nothing here throws — a
 * reminder that could not be mailed is not worth failing a scheduled job
 * over, and the caller counts the outcome instead.
 */

import { brevoConfigured, sendTransactional } from "./brevo.js";

export interface OutboundEmail {
  to: string;
  subject: string;
  /** Plain-text body; the flow may render its own HTML around it. */
  text: string;
  /** Optional HTML body when the flow prefers to send ours as-is. */
  html?: string;
  /** What this is — "streak_at_risk", "weekly_digest" — for the flow to branch on and for unsubscribe footers. */
  kind: string;
}

const SEND_TIMEOUT_MS = 10_000;

let announcedDisabled = false;

/** Reminder copy is ours, not a user's, but it names problems and usernames
 *  — so it is escaped before it is dropped into the HTML alternative. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function emailEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return brevoConfigured(env) || Boolean(env["EMAIL_WEBHOOK_URL"]);
}

/**
 * Send one message. Resolves true when the flow accepted it. Never throws:
 * a reminder that could not be mailed is not worth failing a job over, and
 * the caller counts the outcome instead.
 */
export async function sendEmail(mail: OutboundEmail, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  if (brevoConfigured(env)) {
    const sent = await sendTransactional(
      {
        to: mail.to,
        subject: mail.subject,
        // A reminder that gave the flow only text relied on it to wrap the
        // HTML. Nothing wraps it now, so a plain <pre> keeps the line breaks
        // the copy was written with rather than collapsing them.
        html: mail.html ?? `<pre style="font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;white-space:pre-wrap">${escapeHtml(mail.text)}</pre>`,
        text: mail.text,
        tags: ["reminder", mail.kind],
      },
      env,
    );
    if (sent) return true;
    // Fall through to the flow if one is configured; the reason is logged.
  }

  const url = env["EMAIL_WEBHOOK_URL"];
  if (!url) {
    if (!announcedDisabled) {
      announcedDisabled = true;
      console.log("[email] no BREVO_API_KEY and no EMAIL_WEBHOOK_URL — reminder mail is skipped (in-app notifications still go out)");
    }
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mail),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[email] flow answered ${res.status} for ${mail.kind} → ${mail.to}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] delivery failed for ${mail.kind} → ${mail.to}:`, (err as Error)?.message ?? err);
    return false;
  }
}

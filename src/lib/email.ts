/**
 * Outbound mail.
 *
 * The API has no mail provider of its own: the OTP and the registration
 * welcome both go out by posting a JSON body to a hosted flow (see
 * routes/auth.ts), which renders and sends the message. Reminders use the
 * same shape through one more flow URL, so adding a mail costs a template on
 * that side and a call here — and no SMTP credentials in this process.
 *
 * Unset EMAIL_WEBHOOK_URL is a deliberate state, not a failure: local
 * development and any deployment that has not wired the flow yet simply skip
 * the send. In-app notifications are written regardless, so the reminder
 * still exists; it just does not leave the product.
 */

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

export function emailEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env["EMAIL_WEBHOOK_URL"]);
}

/**
 * Send one message. Resolves true when the flow accepted it. Never throws:
 * a reminder that could not be mailed is not worth failing a job over, and
 * the caller counts the outcome instead.
 */
export async function sendEmail(mail: OutboundEmail, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const url = env["EMAIL_WEBHOOK_URL"];
  if (!url) {
    if (!announcedDisabled) {
      announcedDisabled = true;
      console.log("[email] EMAIL_WEBHOOK_URL not set — reminder mail is skipped (in-app notifications still go out)");
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

/**
 * Brevo (formerly Sendinblue) transactional email.
 *
 * The one place in the API that actually hands a message to a mail provider.
 * Everything else — the one-time codes in auth-mail.ts, the reminder mail in
 * email.ts — composes a message and calls `sendTransactional` here, so the
 * provider can be swapped without touching either.
 *
 * Why a provider at all, when both callers already post to a hosted flow: the
 * flow was a stand-in for having no SMTP credentials in this process. It is
 * still supported and still the fallback, but a flow cannot report a bounce,
 * cannot be authenticated as the domain, and the published URL sat in this
 * repository's history. A real provider fixes all three.
 *
 * The API is one POST — https://developers.brevo.com/reference/sendtransacemail:
 *   POST https://api.brevo.com/v3/smtp/email
 *   api-key: <key>            (not Authorization/Bearer — Brevo's own header)
 *   { sender:{email,name}, to:[{email}], subject, htmlContent, textContent }
 *   → 201 { messageId }       (202 when scheduled, which we never do)
 *
 * The sending domain (codekairo.com) is DNS-authenticated on the account, so
 * any address on it sends. The default From is a no-reply and the Reply-To is
 * the published support inbox: a code is not a conversation, but a person who
 * replies to one should still reach someone.
 */

const ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SEND_TIMEOUT_MS = 10_000;

const DEFAULT_FROM_EMAIL = "no-reply@codekairo.com";
const DEFAULT_FROM_NAME = "CodeKairo";
const DEFAULT_REPLY_TO = "support@codekairo.com";

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  /** The plain-text alternative. Always send one: a code-only mail that a
   *  client renders as text should still carry the code. */
  text: string;
  /** Brevo tags, for filtering the log in their dashboard ("otp", "reminder"). */
  tags?: string[];
}

export function brevoConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env["BREVO_API_KEY"]);
}

/**
 * Hand one message to Brevo. Resolves true when it was accepted.
 *
 * Never throws, and never reports *why* to the caller: both callers answer
 * their client identically whether or not the mail left, so that an address
 * cannot be probed through a delivery failure. The reason goes to the log.
 */
export async function sendTransactional(mail: TransactionalEmail, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const key = env["BREVO_API_KEY"];
  if (!key) return false;

  const body = {
    sender: {
      email: env["MAIL_FROM_EMAIL"] || DEFAULT_FROM_EMAIL,
      name: env["MAIL_FROM_NAME"] || DEFAULT_FROM_NAME,
    },
    to: [{ email: mail.to }],
    replyTo: { email: env["MAIL_REPLY_TO"] || DEFAULT_REPLY_TO },
    subject: mail.subject,
    htmlContent: mail.html,
    textContent: mail.text,
    ...(mail.tags?.length ? { tags: mail.tags } : {}),
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (res.ok) return true;
    // Brevo answers a failure with {code, message}; the message names the
    // real cause (an unverified sender, a daily cap) and is worth having in
    // the log rather than a bare status. The recipient is deliberately not
    // logged with it — see the note on probing above.
    let detail = "";
    try {
      const err = (await res.json()) as { code?: string; message?: string };
      detail = err?.message ? ` — ${err.code ?? "error"}: ${err.message}` : "";
    } catch {
      // A non-JSON body (a gateway page) is not worth a second failure.
    }
    console.error(`[brevo] ${res.status} sending "${mail.subject}"${detail}`);
  } catch (err) {
    console.error(`[brevo] send failed for "${mail.subject}":`, (err as Error)?.message ?? err);
  }
  return false;
}

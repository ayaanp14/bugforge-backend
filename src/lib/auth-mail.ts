import type { ChallengePurpose } from "./otp-store.js";
import { brevoConfigured, sendTransactional } from "./brevo.js";
import { codeHtml, codeSubject, codeText } from "./auth-mail-copy.js";

/**
 * Delivering one-time codes, and whether an address has to be verified.
 *
 * Three roads, tried in order, because the deployments are at different
 * stages and a sign-up must not depend on which:
 *
 *  1. **Brevo** (`BREVO_API_KEY`), which is how codes actually go out. The
 *     message is composed here — subject, HTML and text in auth-mail-copy —
 *     so the wording lives in this repository rather than in a form on
 *     someone's dashboard, and changes with a commit.
 *  2. **The hosted flow** (`OTP_FLOW_URL`), the previous arrangement, kept
 *     as the fallback: a deployment that has not been given a key keeps
 *     sending rather than locking every new account out. In production the
 *     URL published in this repository's history is the last resort.
 *  3. **The console**, in development only. That is how a local sign-up or
 *     reset is completed, and it means a developer's machine never mails a
 *     real address by accident. Never in production — a log line is not a
 *     private channel — where having no road at all is the failure it is.
 *
 * Whichever road is taken, the caller is told only whether something
 * accepted the message, never why not: the client's answer is identical
 * either way, so an address cannot be tested through a delivery failure.
 */

const IS_PROD = process.env["NODE_ENV"] === "production";

/** The value that used to be hard-coded in routes/auth.ts. */
const LEGACY_OTP_FLOW_URL = "https://flow.sokt.io/func/scriPfBslH2w";

const SEND_TIMEOUT_MS = 10_000;

/**
 * Sends a code to an address. Resolves true when something accepted it.
 * Never throws: the caller answers the client the same way either way, so an
 * address cannot be tested through a delivery failure.
 */
export async function sendAuthCode(email: string, otp: string, purpose: ChallengePurpose, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const isProd = env["NODE_ENV"] === "production";

  if (brevoConfigured(env)) {
    const sent = await sendTransactional(
      {
        to: email,
        subject: codeSubject(purpose),
        html: codeHtml(otp, purpose),
        text: codeText(otp, purpose),
        tags: ["otp", purpose],
      },
      env,
    );
    if (sent) return true;
    // Fall through rather than fail: a key that has hit its daily cap or a
    // provider having a bad minute should not lock out a sign-up when the
    // flow is still configured. The reason is already in the log.
    console.error(`[auth] Brevo did not accept the ${purpose} code; trying the flow`);
  }

  const flowUrl = env["OTP_FLOW_URL"] || (isProd ? LEGACY_OTP_FLOW_URL : "");

  if (!flowUrl) {
    if (isProd) {
      console.error(`[auth] no way to deliver a ${purpose} code: set OTP_FLOW_URL`);
      return false;
    }
    console.log(`[auth] ${purpose} code for ${email}: ${otp}  (OTP_FLOW_URL is not set, so it is printed here)`);
    return true;
  }

  try {
    const res = await fetch(flowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `purpose` is new; a flow that predates it renders the reset copy for
      // both, which still carries the code.
      body: JSON.stringify({ email, otp, purpose }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (res.ok) return true;
    console.error(`[auth] code flow answered ${res.status} for ${purpose}`);
  } catch (err) {
    console.error(`[auth] code delivery failed for ${purpose}:`, (err as Error)?.message ?? err);
  }
  return false;
}

/**
 * Whether a password account must confirm its address before it can sign in.
 *
 * On unless `EMAIL_VERIFICATION=off`. The switch exists for the Playwright
 * suite and for a local database with no way to read a code — a test runner
 * cannot read a console — and for nothing else: an unverified address is one
 * whose reset codes go to a stranger.
 */
export function emailVerificationRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  return env["EMAIL_VERIFICATION"] !== "off";
}

/**
 * One line at boot naming the road codes will take.
 *
 * The failure it prevents is a silent one: with no provider configured a
 * development process prints codes to its own console and `sendAuthCode`
 * still resolves true, so the API answers "we sent you a code" and nothing is
 * mailed. That is deliberate — a developer's machine must not mail real
 * addresses — but from the outside it is indistinguishable from a working
 * send. `dotenv` reads `.env` once at startup, so a server that was already
 * running when a key was added to it keeps taking the old road until it is
 * restarted, and spends the session pretending to send.
 */
function announceCodeRoad(env: NodeJS.ProcessEnv = process.env): void {
  if (brevoConfigured(env)) {
    console.log(`[auth] one-time codes → Brevo, from ${env["MAIL_FROM_EMAIL"] || "no-reply@codekairo.com"}`);
  } else if (env["OTP_FLOW_URL"]) {
    console.log("[auth] one-time codes → OTP_FLOW_URL (set BREVO_API_KEY to send them directly)");
  } else if (IS_PROD) {
    console.warn("[auth] one-time codes → the flow URL published in this repository. Set BREVO_API_KEY.");
  } else {
    console.warn("[auth] one-time codes → this console. NOTHING IS MAILED. Set BREVO_API_KEY in .env and restart to send for real.");
  }
}
announceCodeRoad();

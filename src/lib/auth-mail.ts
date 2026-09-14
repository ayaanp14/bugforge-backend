import type { ChallengePurpose } from "./otp-store.js";

/**
 * Delivering one-time codes, and whether an address has to be verified.
 *
 * The reset code used to be posted to a hosted-flow URL written into the
 * route. That URL now comes from `OTP_FLOW_URL`. In production the published
 * value is still the fallback so a deployment that has not set the variable
 * keeps sending — it has sat in this repository's history for months, so the
 * fallback adds no exposure, but the operator should move the flow and set
 * the variable. Verification codes take the same road, with a `purpose`
 * field the flow can branch on.
 *
 * A development process with no flow configured prints the code to its own
 * console: that is how a local sign-up or reset is completed, and it means a
 * developer's machine never mails real addresses by accident. Never in
 * production — a log line is not a private channel — where a missing flow is
 * reported as the failure it is.
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

if (IS_PROD && !process.env["OTP_FLOW_URL"]) {
  console.warn("[auth] OTP_FLOW_URL is not set; one-time codes go to the flow URL published in this repository. Set your own.");
}

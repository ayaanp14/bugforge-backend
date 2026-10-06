import type { ChallengePurpose } from "./otp-store.js";
import { brevoConfigured, isReservedAddress, sendTransactional } from "./brevo.js";
import { codeHtml, codeSubject, codeText } from "./auth-mail-copy.js";
import { welcomeHtml, welcomeSubject, welcomeText, type SignInRoad, type WelcomeRecipient } from "./welcome-mail-copy.js";

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
 * Verification codes one address may be sent in an hour.
 *
 * The request limiters are per caller, and the address being mailed is not
 * the caller's to choose freely: register victim@x with a password of your
 * own and every sign-in with it mails the victim a fresh code (the account
 * is unverified, so /login answers with one), ten per quarter hour per
 * address you send from. This caps what reaches one inbox that way —
 * wherever the requests come from. A person waiting on a code asks for two
 * or three.
 *
 * Verification only, never a reset. A cap on resets would let anyone who
 * knows an address spend its budget with six requests and keep its owner
 * out of recovery for as long as they cared to repeat it; resets stay under
 * the per-caller limiter alone. The owner of an address someone else
 * registered recovers it through a reset anyway, which also verifies it.
 *
 * In-process, like the limiters, and bounded the same way.
 */
const CODES_PER_ADDRESS_PER_HOUR = 6;
const ADDRESS_WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED_ADDRESSES = 20_000;
const sentTo = new Map<string, { count: number; resetAt: number }>();

function withinAddressBudget(email: string, now = Date.now()): boolean {
  if (sentTo.size >= MAX_TRACKED_ADDRESSES) {
    for (const [key, bucket] of sentTo) if (bucket.resetAt <= now) sentTo.delete(key);
    if (sentTo.size >= MAX_TRACKED_ADDRESSES) sentTo.clear();
  }
  const key = email.trim().toLowerCase();
  let bucket = sentTo.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + ADDRESS_WINDOW_MS };
    sentTo.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= CODES_PER_ADDRESS_PER_HOUR;
}

/** Test seam. */
export function resetAddressBudgets(): void {
  sentTo.clear();
}

/**
 * Sends a code to an address. Resolves true when something accepted it.
 * Never throws: the caller answers the client the same way either way, so an
 * address cannot be tested through a delivery failure.
 */
export async function sendAuthCode(email: string, otp: string, purpose: ChallengePurpose, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const isProd = env["NODE_ENV"] === "production";

  // Past the budget nothing is sent, and the caller cannot tell: it answers
  // the same way whether or not a mail went out. The address is not logged.
  if (purpose === "verify_email" && !withinAddressBudget(email)) {
    console.warn(`[auth] ${purpose} code not sent: that address has had ${CODES_PER_ADDRESS_PER_HOUR} codes this hour`);
    return false;
  }

  // A reserved test domain (lib/brevo isReservedAddress) can receive nothing:
  // no provider or flow is tried. Outside production the code is printed, as
  // when no delivery is configured, so a local test account can be verified.
  if (isReservedAddress(email)) {
    if (isProd) return false;
    console.log(`[auth] ${purpose} code for ${email}: ${otp}  (a reserved test domain, so it is printed here and not mailed)`);
    return true;
  }

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
 * Sends the welcome mail. Resolves true when Brevo accepted it; never throws.
 *
 * Brevo only. The two hosted flows are not fallbacks here: OTP_FLOW_URL
 * renders a code, and a welcome that could not be mailed is not worth
 * rescuing the way a code is — nobody is locked out without it, and the
 * in-app welcome notification is written regardless.
 */
export async function sendWelcome(person: WelcomeRecipient, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  if (isReservedAddress(person.email)) return false;
  if (!brevoConfigured(env)) {
    if (env["NODE_ENV"] !== "production") console.log(`[auth] welcome mail for ${person.email} not sent (BREVO_API_KEY is not set)`);
    return false;
  }
  return sendTransactional(
    {
      to: person.email,
      subject: welcomeSubject(person),
      html: welcomeHtml(person),
      text: welcomeText(person),
      tags: ["welcome", person.via],
    },
    env,
  );
}

/**
 * Welcome an account whose address has just been proven for the first time.
 *
 * The callers decide *when*, and the rule is "the first proof", not "the
 * account row was created": a password account is created at /register with
 * an address nobody has confirmed yet, and mailing it then would send our
 * welcome to whoever the registrant typed in. So a social account (born
 * verified) is welcomed as it is created, and a password account when its
 * `emailVerified` goes from null to set — by its code, by a completed reset,
 * or by a Google/GitHub sign-in on the same address. That column only ever
 * moves once, which is what keeps this to one mail per person. With
 * `EMAIL_VERIFICATION=off` a password account is never proven and never
 * welcomed — the switch exists for the Playwright suite, whose
 * `*@codekairo.test` addresses should not be mailed anyway.
 *
 * Fire-and-forget: sign-in never waits on the provider.
 */
export function welcomeNewAccount(
  user: { email: string | null; name: string | null; username: string | null },
  via: string,
): void {
  if (!user.email) return;
  const road: SignInRoad = via === "google" || via === "github" ? via : "email";
  void sendWelcome({ email: user.email, name: user.name, username: user.username, via: road }).catch((err) => {
    console.error("[auth] welcome mail failed:", (err as Error)?.message ?? err);
  });
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

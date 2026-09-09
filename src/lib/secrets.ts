/**
 * The secrets the app cannot safely run without.
 *
 * These used to be read inline with fallbacks — `process.env.JWT_SECRET ?? ""`
 * in one file and `|| "your-secret-key"` in another. Two problems with that.
 * A deployment that forgot the variable would boot and mint tokens signed with
 * a string published in this repository, and because the two fallbacks
 * differed, tokens signed by one path were rejected by the other, which looks
 * like a session bug rather than a missing secret.
 *
 * Reading them here once means a misconfigured deployment fails loudly at
 * startup instead of quietly running with a known key.
 */

/** Long enough that brute-forcing the HMAC key is not the weak link. */
const MIN_SECRET_LENGTH = 32;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Refusing to start: it signs session tokens, and a ` +
        `default would let anyone who reads this repository mint a session for any account.`
    );
  }
  // A short key is worth flagging but is not worth refusing to boot over: a
  // running deployment whose secret is merely short would be taken offline by
  // a hard failure, which is a worse outcome than the warning.
  if (value.length < MIN_SECRET_LENGTH) {
    console.warn(
      `[secrets] ${name} is only ${value.length} characters. Use at least ${MIN_SECRET_LENGTH} ` +
        `random characters; rotating it signs everyone out once, which is cheap.`
    );
  }
  return value;
}

/** Signs and verifies the `__session` token. */
export const JWT_SECRET: string = required("JWT_SECRET");

/**
 * How long a session lasts.
 *
 * Tokens used to be minted with no expiry at all, so one that leaked — and the
 * SPA keeps a copy in localStorage — was a permanent credential that logging
 * out could not revoke. Thirty days matches the cookie's own lifetime.
 */
export const SESSION_TTL = "30d";

/**
 * Signs the `X-App-Signature` header the SPA sends.
 *
 * This is NOT a security boundary and must never be treated as one: the
 * browser bundle has to contain the same value to sign its requests, so it is
 * public by construction. It raises the cost of casual scripted traffic and
 * nothing more. Every route still has to authenticate and authorise for
 * itself. It is read without a hard requirement so that a deployment which
 * has not set it keeps working rather than failing shut over a speed bump.
 */
const PUBLISHED_PLATFORM_DEFAULT = "codexa-super-secret-key-123";

export const PLATFORM_SECRET: string = process.env["PLATFORM_SECRET"] ?? PUBLISHED_PLATFORM_DEFAULT;

if (process.env["NODE_ENV"] === "production" && PLATFORM_SECRET === PUBLISHED_PLATFORM_DEFAULT) {
  console.warn(
    "[secrets] PLATFORM_SECRET is the value published in this repository. Set it to " +
      "something else in both the API and the web build. This is a speed bump, not a " +
      "security control — the browser must know the key to sign with it — but there is " +
      "no reason to leave the one anybody can read here."
  );
}

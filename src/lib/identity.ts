/**
 * The shape of an email address and a username, in one place.
 *
 * Registration and the live `/api/username-check` used to keep separate
 * rules: the check said a 21-character handle was free and the form's
 * submit lit up for one the register route then refused (QA-026). And the
 * address pattern only demanded an `@` and a dot, so `<script>@host` was an
 * account (QA-027). Both routes read these now.
 */

/**
 * The WHATWG "valid e-mail address" pattern (what a browser's `type=email`
 * enforces): a dot-atom local part, labels of letters, digits and hyphens.
 * It refuses angle brackets, quotes and spaces without being stricter than
 * real addresses are.
 */
const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const USERNAME_RULE = "Usernames are 3–20 characters: letters, numbers and underscores.";

/** A trimmed, lower-cased address, or null when it is not one. */
export function readEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** A normalised handle, `null` for "none given", or an error string. */
export function readUsername(raw: unknown): string | null | { error: string } {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return { error: "Username must be text." };
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return { error: USERNAME_RULE };
  return username;
}

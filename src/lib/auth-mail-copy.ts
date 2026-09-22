import type { ChallengePurpose } from "./otp-store.js";

/**
 * What a one-time code actually looks like when it arrives.
 *
 * Kept apart from the sending in auth-mail.ts so the copy can be read and
 * changed without reading delivery logic, and so a test can assert the code
 * is in both bodies without a network stub.
 *
 * Deliberately plain: a table-free, image-free, single-column message with
 * one piece of information in it. Verification codes are the mail most likely
 * to be filtered, and every decorative thing added to one — a logo, a
 * tracking pixel, a button that is really a link — costs deliverability. The
 * only colours are the brand blue and slate text (lib/palette on the client),
 * inlined, because mail clients drop <style> blocks.
 */

const BRAND = "#2563EB";
const INK = "#0F172A";
const MUTED = "#475569";
const HAIRLINE = "#E2E8F0";

interface Copy {
  subject: string;
  /** The line above the code. */
  lead: string;
  /** The line below it, explaining what to do if it was not requested. */
  footnote: string;
}

const COPY: Record<ChallengePurpose, Copy> = {
  verify_email: {
    subject: "Your CodeKairo verification code",
    lead: "Confirm your email address to finish creating your CodeKairo account. Enter this code on the page you left open:",
    footnote: "If you did not create a CodeKairo account, you can ignore this message — the address will not be used.",
  },
  password_reset: {
    subject: "Your CodeKairo password reset code",
    lead: "Use this code to set a new password on your CodeKairo account:",
    footnote:
      "If you did not ask to reset your password, ignore this message and your password stays as it is. Nobody can change it without this code.",
  },
};

/** How long a code lasts, in the copy. Must match OTP_TTL in otp-store. */
const VALID_FOR = "5 minutes";

export function codeSubject(purpose: ChallengePurpose): string {
  return COPY[purpose].subject;
}

export function codeText(otp: string, purpose: ChallengePurpose): string {
  const c = COPY[purpose];
  return [
    c.lead,
    "",
    otp,
    "",
    `The code is valid for ${VALID_FOR} and can be used once.`,
    "",
    c.footnote,
    "",
    "— CodeKairo · https://codekairo.com",
  ].join("\n");
}

export function codeHtml(otp: string, purpose: ChallengePurpose): string {
  const c = COPY[purpose];
  // The code is spaced out by letter-spacing rather than by inserting
  // characters, so copying it out of the mail yields the six digits alone.
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid ${HAIRLINE};border-radius:12px;padding:32px">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${MUTED}">${c.lead}</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND};font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace">${otp}</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${MUTED}">The code is valid for ${VALID_FOR} and can be used once.</p>
    <p style="margin:0;padding-top:20px;border-top:1px solid ${HAIRLINE};font-size:12.5px;line-height:1.6;color:${MUTED}">${c.footnote}</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#94A3B8;text-align:center">CodeKairo · <a href="https://codekairo.com" style="color:#94A3B8">codekairo.com</a></p>
</body></html>`;
}

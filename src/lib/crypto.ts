import * as crypto from "crypto";

const PLATFORM_SECRET = process.env["PLATFORM_SECRET"] ?? "codexa-super-secret-key-123";

/**
 * Generates an HMAC-SHA256 signature for a request
 */
export function generateSignature(method: string, path: string, timestamp: string): string {
  const data = `${method.toUpperCase()}:${path}:${timestamp}`;
  return crypto
    .createHmac("sha256", PLATFORM_SECRET)
    .update(data)
    .digest("hex");
}

/**
 * Verifies a signature and timestamp
 */
export function verifySignature(
  signature: string,
  method: string,
  path: string,
  timestamp: string
): boolean {
  // 1. Check if timestamp is relatively recent (within 5 minutes).
  //
  // WHY 5 minutes instead of 60 seconds:
  //   - Railway cold starts add unpredictable delay (2–15 s) before Node handles the request.
  //   - Browser background-tab throttling freezes JS timers; a user switching to the tab
  //     can fire a fetch with a timestamp that is already many seconds old.
  //   - Combined these effects regularly push the delta past 60 s in production while
  //     local (localhost, always-active tab) stays well under.
  //   - 5 minutes is still well within safe replay-attack limits for a signed SPA.
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const deltaMs = Math.abs(now - requestTime);

  if (isNaN(requestTime) || deltaMs > 300_000) {
    console.warn("Signature verification failed: Timestamp expired or invalid", {
      now,
      requestTime,
      deltaMs: isNaN(requestTime) ? "NaN" : deltaMs,
    });
    return false;
  }

  // 2. Re-calculate and compare
  const expectedSignature = generateSignature(method, path, timestamp);
  return signature === expectedSignature;
}

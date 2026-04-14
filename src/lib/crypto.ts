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
  // 1. Check if timestamp is relatively recent (within 60 seconds)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 60000) {
    console.warn("Signature verification failed: Timestamp expired or invalid", { now, requestTime });
    return false;
  }

  // 2. Re-calculate and compare
  const expectedSignature = generateSignature(method, path, timestamp);
  return signature === expectedSignature;
}

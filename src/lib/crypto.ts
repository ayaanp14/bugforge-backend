import * as crypto from "crypto";
import { PLATFORM_SECRET } from "./secrets.js";

/**
 * The `X-App-Signature` the SPA puts on its requests.
 *
 * Be clear about what this is worth. The browser bundle has to contain the
 * same key in order to sign, so anyone can read it out of the JavaScript and
 * sign whatever they like. It is not authentication and must never be treated
 * as one — it raises the cost of casual scripted traffic and nothing else.
 * Authorisation belongs to `requireAuth` and to each route's own ownership
 * checks, which is where it lives.
 *
 * What it is still worth doing: comparing in constant time, and not shipping
 * with a key that is published in this repository, so that a deployment which
 * sets its own value is at least not using the one everyone can read here.
 */

/** Generates an HMAC-SHA256 signature for a request. */
export function generateSignature(method: string, path: string, timestamp: string): string {
  const data = `${method.toUpperCase()}:${path}:${timestamp}`;
  return crypto.createHmac("sha256", PLATFORM_SECRET).update(data).digest("hex");
}

/**
 * Compares two hex digests without leaking, through how long it takes, how
 * many leading characters matched.
 */
function equalDigests(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  // timingSafeEqual throws on a length mismatch, which would itself be a
  // signal, so the lengths are checked first and the comparison still runs.
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

/** Verifies a signature and its timestamp. */
export function verifySignature(signature: string, method: string, path: string, timestamp: string): boolean {
  // A signature is only good for a short window, so one captured from a log
  // cannot be replayed indefinitely.
  const now = Date.now();
  const requestTime = Number.parseInt(timestamp, 10);

  if (Number.isNaN(requestTime) || Math.abs(now - requestTime) > 60_000) {
    console.warn("Signature verification failed: timestamp expired or invalid");
    return false;
  }

  return equalDigests(signature, generateSignature(method, path, timestamp));
}

import type { Request, Response, NextFunction } from "express";
import { verifySignature } from "../lib/crypto.js";

/**
 * Middleware to block any requests not originating from the platform
 */
export function platformGuard(req: Request, res: Response, next: NextFunction) {
  // 1. Skip checks for health or public diagnostic routes if any
  if (req.path === "/health") return next();

  const signature = req.headers["x-app-signature"] as string;
  const timestamp = req.headers["x-app-timestamp"] as string;
  const platform = req.headers["x-app-platform"] as string;

  // 2. Basic static platform check
  if (platform !== "bugforge-web") {
    console.warn(`[Guard] Invalid platform header: ${platform}`);
    return res.status(403).json({ error: "Access Denied: Invalid Platform" });
  }

  // 3. HMAC Signature validation (The strict part)
  if (!signature || !timestamp) {
    console.warn(`[Guard] Missing signature or timestamp headers`);
    return res.status(403).json({ error: "Access Denied: Missing Security Credentials" });
  }

  // Use req.path for path-based signing
  const isVerified = verifySignature(signature, req.method, req.path, timestamp);

  if (!isVerified) {
    console.warn(`[Guard] Signature verification failed`, { 
      method: req.method, 
      path: req.path, 
      timestamp 
    });
    return res.status(403).json({ error: "Access Denied: Strict Origin Verification Failed" });
  }

  next();
}

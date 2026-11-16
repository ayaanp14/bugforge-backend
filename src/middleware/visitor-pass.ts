import type { NextFunction, Request, Response } from "express";
import { addressOf } from "./rate-limit.js";
import { PASS_HEADER, PASS_REQUIRED_CODE, challengeRequired, passIsValid } from "../lib/visitor-pass.js";

/**
 * A visitor's request to something that costs per call (the online
 * compiler, the free ATS check) must carry a valid pass (lib/visitor-pass)
 * while Turnstile is configured. Mount it after the per-address limiters, so
 * a flood is turned away before the HMAC is checked, and only on the
 * visitor's path — a signed-in caller never needs one.
 *
 * The refusal carries `code: "VISITOR_PASS"`: the SPA answers it by running
 * the challenge again and resending, so a pass that expired or a network
 * that changed is a short pause, not an error on screen.
 */
export function requireVisitorPass(req: Request, res: Response, next: NextFunction): void {
  if (!challengeRequired() || passIsValid(req.get(PASS_HEADER), addressOf(req))) {
    next();
    return;
  }
  res.status(403).json({ error: "Confirm you're a person to keep going.", code: PASS_REQUIRED_CODE });
}

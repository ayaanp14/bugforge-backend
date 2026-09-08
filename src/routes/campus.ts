import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { CAMPUS_APPLIED, createNotificationOnce } from "../services/notifications.js";

/**
 * Campus ambassador applications.
 *
 * Open to signed-out visitors: the programme is advertised on the landing page,
 * and asking someone to create an account before they can express interest
 * loses most of them. `optionalAuth` attaches the user when there is one, so an
 * existing account gets linked without being required.
 */

const router = Router();

/** Trim, cap, and treat blank as absent — an empty string is not a value. */
function text(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Deliberately permissive.
 *
 * This is the front door of a marketing programme, not an auth boundary — the
 * address is only ever used to reply to a human. A strict pattern here rejects
 * real addresses (long TLDs, plus-addressing, unicode domains) and the cost of
 * that is a lost applicant, whereas the cost of accepting a bad one is an email
 * that bounces.
 */
function email(raw: unknown): string | null {
  const value = text(raw, 254);
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.toLowerCase() : null;
}

/**
 * @route   POST /api/campus/apply
 * @desc    Apply to the campus ambassador programme
 * @access  Public (platform-signed)
 */
router.post("/apply", optionalAuth, async (req: any, res) => {
  try {
    const name = text(req.body?.name, 120);
    const address = email(req.body?.email);
    const college = text(req.body?.college, 200);
    const why = text(req.body?.why, 2000);

    const missing = [
      !name && "your name",
      !address && "a valid email address",
      !college && "your college",
      !why && "why you want to do this",
    ].filter(Boolean);

    if (missing.length > 0) {
      return res.status(400).json({ error: `Please add ${missing.join(", ")}.` });
    }

    // One application per person. Checked before the insert so the answer is a
    // sentence rather than a unique-constraint error.
    const existing = await prisma.campusAmbassador.findUnique({
      where: { email: address as string },
      select: { id: true, status: true },
    });

    if (existing) {
      return res.status(409).json({
        error: "We already have an application from this email — we'll be in touch.",
        alreadyApplied: true,
        status: existing.status,
      });
    }

    const application = await prisma.campusAmbassador.create({
      data: {
        name: name as string,
        email: address as string,
        college: college as string,
        why: why as string,
        phone: text(req.body?.phone, 32),
        city: text(req.body?.city, 120),
        graduationYear: text(req.body?.graduationYear, 12),
        linkedin: text(req.body?.linkedin, 300),
        instagram: text(req.body?.instagram, 300),
        reach: text(req.body?.reach, 1000),
        userId: req.user?.userId ?? null,
      },
      select: { id: true, createdAt: true },
    });

    // A signed-in applicant gets told in-app too, so the confirmation survives
    // them closing the tab.
    if (req.user?.userId) {
      void createNotificationOnce(req.user.userId, CAMPUS_APPLIED);
    }

    console.log(`[campus] new application from ${college} <${address}>`);

    res.status(201).json({
      success: true,
      applicationId: application.id,
      message: "Application received. We review these every week and reply either way.",
    });
  } catch (error: any) {
    console.error("[campus] application failed:", error?.message);
    res.status(500).json({ error: "Could not submit your application. Please try again." });
  }
});

export default router;

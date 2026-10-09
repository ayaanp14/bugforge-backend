/**
 * The account's own data and visibility — mounted at /api/me beside
 * routes/me.ts (Express runs both routers; none of these paths is one of
 * its). Kept apart because these are the irreversible or bulk operations
 * on an account, each behind its own checks; services/account.ts holds the
 * work and says what a copy includes.
 */
import { Router } from "express";
import { careerSettingsFor, setCareerSharing } from "../services/career.js";
import { requireAuth } from "../middleware/auth.js";
import { accountDataLimiter, sendLinkLimiter } from "../middleware/rate-limit.js";
import { prisma } from "../lib/prisma.js";
import { verifyPassword } from "../lib/passwords.js";
import { clearSessionCookie } from "../lib/auth-session.js";
import { sendEmail } from "../lib/email.js";
import { FRONTEND_URL } from "../lib/sites.js";
import { dayKey } from "../lib/clock.js";
import { invalidateMe } from "../services/me.js";
import { forgetPublicUser } from "../services/public-profile.js";
import { buildAccountExport, deleteAccount, deletionPhrase } from "../services/account.js";

const router = Router();

/**
 * PUT /api/me/privacy { profileHidden } — show or hide /u/<username>.
 * Answers the new state; the profile cache and /api/me are dropped so the
 * change holds on the next read everywhere.
 */
router.put("/privacy", requireAuth, async (req, res) => {
  const value = (req.body as { profileHidden?: unknown } | undefined)?.profileHidden;
  if (typeof value !== "boolean") {
    res.status(400).json({ error: "profileHidden must be true or false." });
    return;
  }
  const userId = req.user!.userId;
  const row = await prisma.user.update({ where: { id: userId }, data: { profileHidden: value }, select: { profileHidden: true } });
  invalidateMe(userId);
  forgetPublicUser(userId);
  res.json(row);
});

/**
 * GET /api/me/career — the career section's sharing switches and the section
 * exactly as /u/<username> shows it (services/career.ts, Phase 8).
 * PUT /api/me/career {showSkills?, showReadiness?} — flip them; answers the same.
 */
router.get("/career", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await careerSettingsFor(req.user!.userId));
});

router.put("/career", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const out = await setCareerSharing(userId, (req.body ?? {}) as { showSkills?: unknown; showReadiness?: unknown });
  if ("error" in out) {
    res.status(400).json({ error: out.error });
    return;
  }
  // The public profile holds the identity row (with the switches) for a minute.
  forgetPublicUser(userId);
  res.json(out);
});

/**
 * GET /api/me/export — everything held about the account, as a JSON file
 * (services/account.ts). `no-store`: a copy of someone's data is never kept
 * by a cache between the server and them.
 */
router.get("/export", requireAuth, accountDataLimiter, async (req, res) => {
  const data = await buildAccountExport(req.user!.userId);
  if (!data) {
    res.status(404).json({ error: "This account no longer exists." });
    return;
  }
  const profile = data["profile"] as { username: string | null };
  const name = (profile.username ?? "account").replace(/[^a-z0-9_-]/gi, "") || "account";
  res.setHeader("Cache-Control", "no-store");
  // Dated on the product calendar (IST), not UTC: a copy taken at 1 a.m. in India is today's.
  res.setHeader("Content-Disposition", `attachment; filename="codekairo-${name}-${dayKey()}.json"`);
  res.type("application/json").send(JSON.stringify(data, null, 2));
});

/**
 * DELETE /api/me { confirm, password? } — delete the account, now and for good.
 *
 * Two proofs beyond the session, for the reason POST /password asks for
 * the current password: a session left open on a shared machine must not
 * be enough to erase someone. Everyone types the confirmation phrase (the
 * username, or the email when there is none); an account with a password
 * also gives it. A social account has none to give, and setting one first
 * is refused for the same reason (POST /password), so for it the phrase
 * and a live session are the proof — the same proof that signs it in.
 */
router.delete("/", requireAuth, accountDataLimiter, async (req, res) => {
  const body = (req.body ?? {}) as { confirm?: unknown; password?: unknown };
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true, password_hash: true } });
  if (!user) {
    res.status(404).json({ error: "This account no longer exists." });
    return;
  }

  const phrase = deletionPhrase(user);
  if (typeof body.confirm !== "string" || !phrase || body.confirm.trim().toLowerCase() !== phrase) {
    res.status(400).json({ error: `Type ${user.username ? "your username" : "your email address"} exactly to confirm.` });
    return;
  }
  if (user.password_hash) {
    // A social account that once completed a reset has a password too, which
    // the client cannot tell from `provider` — so it is told to ask.
    if (typeof body.password !== "string" || body.password.length === 0) {
      res.status(400).json({ error: "Enter your password to confirm.", needsPassword: true });
      return;
    }
    if (!(await verifyPassword(body.password, user.password_hash))) {
      res.status(401).json({ error: "That password is not right." });
      return;
    }
  }

  await deleteAccount(userId);
  clearSessionCookie(res);
  res.status(204).end();
});

/**
 * The pages a phone is told are better opened on a laptop — the three
 * workbenches. Only these may be mailed, so the route can never be used to
 * send an arbitrary address from no-reply@codekairo.com.
 */
const WORKBENCH_PATH = /^\/(problems|sql|bug-hunts)\/[a-z0-9][a-z0-9-]{0,119}$/;

/**
 * POST /api/me/send-link { path, title } — mail one workbench link to the
 * account's own address, from a phone, to open on a laptop later. Never to
 * any other address. The title is the client's, so it is cut to one plain
 * line; the link is rebuilt from the checked path on our own origin.
 */
router.post("/send-link", requireAuth, sendLinkLimiter, async (req, res) => {
  const body = (req.body ?? {}) as { path?: unknown; title?: unknown };
  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (!WORKBENCH_PATH.test(path)) {
    res.status(400).json({ error: "Only a problem, SQL problem or bug hunt can be sent." });
    return;
  }
  const title = (typeof body.title === "string" ? body.title : "").replace(/[\r\n\t]+/g, " ").replace(/https?:\/\/\S+/gi, "").trim().slice(0, 120) || "Your problem";
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } });
  if (!user?.email) {
    res.status(409).json({ error: "This account has no email address to send it to." });
    return;
  }
  const url = `${FRONTEND_URL}${path}`;
  const sent = await sendEmail({
    to: user.email,
    subject: `Open on your laptop: ${title}`,
    text: `You saved this on your phone to open on a laptop:\n\n${title}\n${url}\n\nThe editor, the tests and your draft are all there.`,
    kind: "send_link",
  });
  if (!sent) {
    res.status(502).json({ error: "The email could not be sent just now. Try again in a little while." });
    return;
  }
  res.json({ sentTo: user.email });
});

export default router;

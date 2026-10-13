import { Router, type Response } from "express";
import { adminOnly, requireAuth } from "../middleware/auth.js";
import { isFormat, isPlatform, isTheme } from "../lib/social/calendar.js";
import { SocialError, checkDay, editPost, generateDay, getPack, markPosted, slidePng, slidesPdf, socialCalendar } from "../services/social.js";

/**
 * The social growth module's API (services/social.ts), for the campaign
 * page (campaign.codekairo.com/social.html). Admins only, like the admin
 * panel: the page signs in with a CodeKairo admin account and calls these
 * with the platform-guard signature and the Bearer token, as the SPA does.
 *
 *   GET    /calendar                    the week behind and ahead, themes, platforms
 *   GET    /days/:day                   that day's pack, or null
 *   POST   /days/:day/generate          {mode: new|another|rewrite, theme?, change?} → the pack
 *   POST   /days/:day/posted            {platform, posted} → which went out
 *   PUT    /days/:day/posts/:platform   {title?, text?, firstComment?} → the edited post
 *   GET    /days/:day/slides/:i.png?format=portrait|square|landscape
 *   GET    /days/:day/slides.pdf?format=…   every slide, for LinkedIn's document post
 */
const router = Router();
router.use(requireAuth, adminOnly);

function fail(res: Response, err: unknown): void {
  if (err instanceof SocialError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  throw err;
}

router.get("/calendar", async (_req, res) => {
  res.json(await socialCalendar());
});

router.get("/days/:day", async (req, res) => {
  try {
    res.json({ pack: await getPack(checkDay(req.params.day)) });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/days/:day/generate", async (req, res) => {
  try {
    const day = checkDay(req.params.day);
    const body = (req.body ?? {}) as { mode?: unknown; theme?: unknown; change?: unknown };
    const mode = body.mode === "another" || body.mode === "rewrite" ? body.mode : "new";
    const pack = await generateDay(
      { day, mode, theme: isTheme(body.theme) ? body.theme : undefined, change: typeof body.change === "string" ? body.change.slice(0, 500) : undefined },
      req.user!.userId,
    );
    res.json({ pack });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/days/:day/posted", async (req, res) => {
  try {
    const day = checkDay(req.params.day);
    const { platform, posted } = (req.body ?? {}) as { platform?: unknown; posted?: unknown };
    if (!isPlatform(platform)) throw new SocialError("Unknown platform.", 400);
    res.json({ posted: await markPosted(day, platform, posted === true) });
  } catch (err) {
    fail(res, err);
  }
});

router.put("/days/:day/posts/:platform", async (req, res) => {
  try {
    const day = checkDay(req.params.day);
    if (!isPlatform(req.params.platform)) throw new SocialError("Unknown platform.", 400);
    res.json({ post: await editPost(day, req.params.platform, req.body ?? {}) });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/days/:day/slides.pdf", async (req, res) => {
  try {
    const day = checkDay(req.params.day);
    const format = isFormat(req.query["format"]) ? req.query["format"] : "portrait";
    const pdf = await slidesPdf(day, format);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="codekairo-${day}-carousel.pdf"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(pdf);
  } catch (err) {
    fail(res, err);
  }
});

router.get("/days/:day/slides/:file", async (req, res) => {
  try {
    const day = checkDay(req.params.day);
    const m = /^(\d{1,2})\.png$/.exec(req.params.file);
    if (!m) throw new SocialError("No such slide.", 404);
    const format = isFormat(req.query["format"]) ? req.query["format"] : "portrait";
    const png = await slidePng(day, Number(m[1]), format);
    res.setHeader("Content-Type", "image/png");
    // Private and never stored: the image changes when the day is rebuilt.
    res.setHeader("Cache-Control", "private, no-store");
    res.send(png);
  } catch (err) {
    fail(res, err);
  }
});

export default router;

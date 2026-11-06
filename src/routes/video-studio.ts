import { Router, type NextFunction, type Request, type Response } from "express";
import { authLimiter } from "../middleware/rate-limit.js";
import {
  CAMPAIGN_PAGE,
  VideoError,
  addToQueue,
  claimUpload,
  disconnectYoutube,
  jobFor,
  recordUpload,
  removeFromQueue,
  replaceTopic,
  reportStatus,
  runNow,
  sameSecret,
  saveSettings,
  studioState,
  youtubeCallback,
  youtubeConsentUrl,
} from "../services/video-studio.js";

/**
 * The daily videos (services/video-studio.ts). Exempt from the platform guard
 * (middleware/platformGuard.ts) because none of its three callers can sign, so each
 * proves itself instead:
 *
 *   /youtube/callback   Google's redirect: a state this API signed
 *   /runner/*           the GitHub run: VIDEO_RUNNER_SECRET
 *   everything else     campaign.codekairo.com: CAMPAIGN_PASSWORD, the same one the
 *                       page's email half asks for, and rate limited here
 */
export const videoStudioRouter = Router();

const bearer = (req: Request) => (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");

function campaignPassword(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env["CAMPAIGN_PASSWORD"];
  if (!expected) return void res.status(503).json({ error: "CAMPAIGN_PASSWORD is not set on the API." });
  if (!sameSecret(bearer(req), expected)) return void res.status(401).json({ error: "Wrong password." });
  next();
}

function runnerSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env["VIDEO_RUNNER_SECRET"];
  if (!expected || !sameSecret(bearer(req), expected)) return void res.status(401).json({ error: "Wrong runner secret." });
  next();
}

const id = (req: Request) => String(req.params["id"]);
const prompt = (req: Request) => (typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, 2000) : "");

videoStudioRouter.get("/youtube/callback", async (req, res) => {
  const result = await youtubeCallback(req).catch((err: Error) => err.message);
  res.redirect(303, `${CAMPAIGN_PAGE}&youtube=${encodeURIComponent(result)}`);
});

videoStudioRouter.get("/runner/:id", runnerSecret, async (req, res) => res.json(await jobFor(id(req))));
videoStudioRouter.post("/runner/:id/status", runnerSecret, async (req, res) => {
  await reportStatus(id(req), req.body ?? {});
  res.json({ ok: true });
});
videoStudioRouter.post("/runner/:id/next-topic", runnerSecret, async (req, res) => res.json(await replaceTopic(id(req), String(req.body?.duplicateOf ?? ""))));
videoStudioRouter.post("/runner/:id/claim", runnerSecret, async (req, res) => res.json(await claimUpload(id(req), req.body ?? {})));
videoStudioRouter.post("/runner/:id/uploaded", runnerSecret, async (req, res) => {
  await recordUpload(id(req), req.body ?? {});
  res.json({ ok: true });
});

// Nothing limits a wrong guess at the Worker's copy of this check; this one does.
videoStudioRouter.use(authLimiter, campaignPassword);

videoStudioRouter.get("/state", async (_req, res) => res.json(await studioState()));
videoStudioRouter.put("/settings", async (req, res) => {
  await saveSettings(req.body ?? {});
  res.json({ ok: true });
});
videoStudioRouter.post("/queue", async (req, res) => {
  await addToQueue(prompt(req));
  res.json({ ok: true });
});
videoStudioRouter.delete("/queue/:id", async (req, res) => {
  await removeFromQueue(id(req));
  res.json({ ok: true });
});
videoStudioRouter.post("/run", async (req, res) => res.json({ ok: true, id: await runNow(prompt(req)) }));
videoStudioRouter.post("/youtube/connect", (req, res) => void res.json({ url: youtubeConsentUrl(req) }));
videoStudioRouter.delete("/youtube", async (_req, res) => {
  await disconnectYoutube();
  res.json({ ok: true });
});

/** The sentences above are written for the page; anything else goes to the final handler. */
videoStudioRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof VideoError) return void res.status(err.status).json({ error: err.message });
  next(err);
});

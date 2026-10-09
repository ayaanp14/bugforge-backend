import { Router } from "express";
import { adminOnly, requireAuth } from "../middleware/auth.js";
import { honourDef, isHonourShareAction, parseHonourFeedback, parseHonourees } from "../lib/honours.js";
import {
  adminHonours,
  grantHonour,
  mailHonour,
  markCelebrated,
  myHonours,
  recordHonourShare,
  revokeHonour,
  saveHonourFeedback,
} from "../services/honours.js";

/**
 * Honours (lib/honours.ts): the holder's side at /api/me/honours, the
 * owner's at /api/admin/honours.
 *
 *   GET  /api/me/honours                       what the celebration needs
 *   POST /api/me/honours/:kind/celebrated      it opened (stamped once)
 *   POST /api/me/honours/:kind/share {action}  a LinkedIn click, for /admin
 *   PUT  /api/me/honours/:kind/feedback {comment, rating?}
 *
 *   GET    /api/admin/honours                  every holder + their note
 *   POST   /api/admin/honours {kind, users, mail, resendMail?}
 *   POST   /api/admin/honours/:id/mail         send (again)
 *   DELETE /api/admin/honours/:id
 */
export const honoursRouter = Router();

honoursRouter.get("/", requireAuth, async (req, res) => {
  res.json({ honours: await myHonours(req.user!.userId) });
});

honoursRouter.post("/:kind/celebrated", requireAuth, async (req, res) => {
  const kind = String(req.params["kind"]);
  if (!honourDef(kind)) return void res.status(404).json({ error: "Unknown honour" });
  const held = await markCelebrated(req.user!.userId, kind);
  res.status(held ? 204 : 404).end();
});

honoursRouter.post("/:kind/share", requireAuth, async (req, res) => {
  const kind = String(req.params["kind"]);
  const action = (req.body as Record<string, unknown> | undefined)?.["action"];
  if (!honourDef(kind) || !isHonourShareAction(action)) return void res.status(400).json({ error: "Unknown honour or action" });
  const held = await recordHonourShare(req.user!.userId, kind, action);
  res.status(held ? 204 : 404).end();
});

honoursRouter.put("/:kind/feedback", requireAuth, async (req, res) => {
  const kind = String(req.params["kind"]);
  if (!honourDef(kind)) return void res.status(404).json({ error: "Unknown honour" });
  const parsed = parseHonourFeedback(req.body);
  if (!parsed.ok) return void res.status(400).json({ error: parsed.error });
  const saved = await saveHonourFeedback(req.user!.userId, kind, parsed.comment, parsed.rating);
  if (!saved) return void res.status(404).json({ error: "That honour is not on this account" });
  res.status(200).json({ ok: true });
});

export const adminHonoursRouter = Router();
adminHonoursRouter.use(requireAuth, adminOnly);

adminHonoursRouter.get("/", async (_req, res) => {
  res.json(await adminHonours());
});

adminHonoursRouter.post("/", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const kind = String(body["kind"] ?? "");
  if (!honourDef(kind)) return void res.status(400).json({ error: "Unknown honour" });
  const users = parseHonourees(body["users"]);
  if (!users.length) return void res.status(400).json({ error: "Name at least one account by email or username" });
  const results = await grantHonour(kind, users, {
    grantedBy: req.user!.email ?? "admin",
    mail: body["mail"] === true,
    resendMail: body["resendMail"] === true,
  });
  res.json({ results });
});

adminHonoursRouter.post("/:id/mail", async (req, res) => {
  const sent = await mailHonour(String(req.params["id"]));
  res.json({ sent });
});

adminHonoursRouter.delete("/:id", async (req, res) => {
  const gone = await revokeHonour(String(req.params["id"]));
  res.status(gone ? 204 : 404).end();
});

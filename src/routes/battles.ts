import { Router, type NextFunction, type Request, type Response } from "express";
import { adminOnly, optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  BattlesError,
  cancelTournament,
  createOrg,
  createTournament,
  decideEntry,
  deleteTeam,
  hostDashboard,
  listTournaments,
  manageView,
  myEntries,
  orgPage,
  orgsForReview,
  publishTournament,
  register,
  setOrgVerified,
  setProblems,
  tournamentPage,
  updateOrg,
  updateTournament,
  uploadTeams,
  withdraw,
} from "../services/battles.js";
import { contestRoom, contestStandings, revealResults } from "../services/contest.js";

/**
 * CodeKairo Battles — the API behind battles.codekairo.com (services/battles.ts).
 *
 * Public (optionalAuth — a visitor reads, a member also sees their own standing):
 *   GET    /api/battles/tournaments                 published, not finished
 *   GET    /api/battles/tournaments/:slug           one tournament's page
 *   GET    /api/battles/orgs/:slug                  an org's page
 *   GET    /api/battles/contest/:id/standings       ICPC scoreboard, from the start
 *
 * Players (requireAuth):
 *   GET    /api/battles/me/entries                  tournaments I am in
 *   POST   /api/battles/tournaments/:id/register    { inviteCode? }
 *   DELETE /api/battles/tournaments/:id/register
 *   GET    /api/battles/contest/:id                 the contest room (entered teams)
 *
 * Organizers (requireAuth; owner/admin of the org, else 404):
 *   GET    /api/battles/host                        my orgs + their tournaments
 *   POST   /api/battles/orgs                        { name, kind, website?, city?, about? }
 *   PATCH  /api/battles/orgs/:id
 *   POST   /api/battles/orgs/:id/tournaments        a draft
 *   GET    /api/battles/manage/:id                  settings, problems, entries, teams
 *   PATCH  /api/battles/manage/:id                  settings
 *   PUT    /api/battles/manage/:id/problems         { problemIds } in order
 *   POST   /api/battles/manage/:id/publish
 *   POST   /api/battles/manage/:id/cancel
 *   POST   /api/battles/manage/:id/reveal           lift the freeze after the end
 *   POST   /api/battles/manage/:id/teams            { list } — ICPC team upload
 *   DELETE /api/battles/teams/:teamId
 *   PATCH  /api/battles/entries/:entryId            { status: approved | rejected }
 *
 * Site admin (requireAuth + adminOnly):
 *   GET    /api/battles/admin/orgs                  verification queue
 *   POST   /api/battles/admin/orgs/:id/verify       { verified }
 */

type Authed = Request & { user: { userId: string; email: string } };

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof BattlesError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

const wrap =
  (fn: (req: Authed, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req as Authed, res).catch((err) => handleError(err, res, next));
  };

const param = (req: Request, name: string) => String(req.params[name]);
const body = (req: Request) => (req.body ?? {}) as Record<string, unknown>;
const viewerOf = (req: Request) => ((req as Partial<Authed>).user ? { userId: (req as Authed).user.userId } : null);

const router = Router();

// ── Public ────────────────────────────────────────────────────────────
router.get("/tournaments", wrap(async (_req, res) => { res.json(await listTournaments()); }));
router.get("/tournaments/:slug", optionalAuth, wrap(async (req, res) => { res.json(await tournamentPage(param(req, "slug"), viewerOf(req))); }));
router.get("/contest/:id/standings", optionalAuth, wrap(async (req, res) => { res.json(await contestStandings(param(req, "id"), viewerOf(req)?.userId ?? null)); }));
router.get("/orgs/:slug", optionalAuth, wrap(async (req, res) => { res.json(await orgPage(param(req, "slug"), viewerOf(req)?.userId ?? null)); }));

// ── Site admin ────────────────────────────────────────────────────────
router.get("/admin/orgs", requireAuth, adminOnly, wrap(async (_req, res) => { res.json(await orgsForReview()); }));
router.post("/admin/orgs/:id/verify", requireAuth, adminOnly, wrap(async (req, res) => { res.json(await setOrgVerified(param(req, "id"), body(req)["verified"])); }));

// ── Everything below needs a session ─────────────────────────────────
router.use(requireAuth);

router.get("/me/entries", wrap(async (req, res) => { res.json(await myEntries(req.user.userId)); }));
router.post("/tournaments/:id/register", wrap(async (req, res) => {
  res.status(201).json(await register({ userId: req.user.userId, email: req.user.email }, param(req, "id"), body(req)["inviteCode"]));
}));
router.get("/contest/:id", wrap(async (req, res) => { res.json(await contestRoom(req.user.userId, param(req, "id"))); }));
router.delete("/tournaments/:id/register", wrap(async (req, res) => { res.json(await withdraw(req.user.userId, param(req, "id"))); }));

router.get("/host", wrap(async (req, res) => { res.json(await hostDashboard(req.user.userId)); }));
router.post("/orgs", wrap(async (req, res) => { res.status(201).json({ org: await createOrg(req.user.userId, body(req)) }); }));
router.patch("/orgs/:id", wrap(async (req, res) => { res.json({ org: await updateOrg(req.user.userId, param(req, "id"), body(req)) }); }));
router.post("/orgs/:id/tournaments", wrap(async (req, res) => {
  res.status(201).json({ tournament: await createTournament(req.user.userId, param(req, "id"), body(req)) });
}));

router.get("/manage/:id", wrap(async (req, res) => { res.json(await manageView(req.user.userId, param(req, "id"))); }));
router.patch("/manage/:id", wrap(async (req, res) => { res.json(await updateTournament(req.user.userId, param(req, "id"), body(req))); }));
router.put("/manage/:id/problems", wrap(async (req, res) => { res.json(await setProblems(req.user.userId, param(req, "id"), body(req)["problemIds"])); }));
router.post("/manage/:id/publish", wrap(async (req, res) => { res.json(await publishTournament(req.user.userId, param(req, "id"))); }));
router.post("/manage/:id/cancel", wrap(async (req, res) => { res.json(await cancelTournament(req.user.userId, param(req, "id"))); }));
router.post("/manage/:id/reveal", wrap(async (req, res) => { res.json(await revealResults(req.user.userId, param(req, "id"))); }));
router.post("/manage/:id/teams", wrap(async (req, res) => { res.json(await uploadTeams(req.user.userId, param(req, "id"), body(req)["list"])); }));
router.delete("/teams/:teamId", wrap(async (req, res) => { res.json(await deleteTeam(req.user.userId, param(req, "teamId"))); }));
router.patch("/entries/:entryId", wrap(async (req, res) => { res.json(await decideEntry(req.user.userId, param(req, "entryId"), body(req)["status"])); }));

export default router;

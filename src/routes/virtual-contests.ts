import { Router, type NextFunction, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  VirtualContestError,
  endVirtualContest,
  startVirtualContest,
  virtualContest,
  virtualContestHome,
} from "../services/virtual-contests.js";

/** Virtual contests and the CP rating (services/virtual-contests): every read and write is the member's own. */
const router = Router();

const fail = (res: Response, next: NextFunction) => (error: unknown) => {
  if (error instanceof VirtualContestError) return void res.status(error.status).json({ error: error.message });
  next(error);
};

router.get("/", requireAuth, (req: any, res, next) => {
  virtualContestHome(req.user.userId).then((body) => res.json(body), fail(res, next));
});

router.post("/", requireAuth, (req: any, res, next) => {
  startVirtualContest(req.user.userId, req.body?.level).then((body) => res.status(201).json(body), fail(res, next));
});

router.get("/:id", requireAuth, (req: any, res, next) => {
  virtualContest(req.user.userId, String(req.params.id).slice(0, 191)).then((body) => res.json(body), fail(res, next));
});

router.post("/:id/end", requireAuth, (req: any, res, next) => {
  endVirtualContest(req.user.userId, String(req.params.id).slice(0, 191)).then((body) => res.json(body), fail(res, next));
});

export default router;

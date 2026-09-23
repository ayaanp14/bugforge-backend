import express, { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { browserCache } from "../lib/http-cache.js";
import { resumeAiLimiter, resumeUploadLimiter } from "../middleware/rate-limit.js";
import { MAX_RESUME_BYTES, ResumeFileError } from "../lib/resume-files.js";
import { exportFilename, renderDocx, renderPdf } from "../lib/resume-export.js";
import { ATS_SCORING_WEIGHTS, CATEGORY_LABELS } from "../lib/resume-scoring.js";
import { IMPROVE_MODES } from "../lib/resume-ai.js";
import { trackServerEvent } from "../lib/telemetry.js";
import {
  ResumeError,
  compare,
  createResumeFromUpload,
  createVersion,
  decideSuggestion,
  deleteResume,
  deleteVersion,
  duplicateResume,
  getAnalysis,
  getResume,
  getVersion,
  improveBulletFor,
  listAnalyses,
  listAnalysisHistory,
  listResumes,
  listSuggestions,
  listVersions,
  optimizeFor,
  renameVersion,
  restoreVersion,
  startAnalysis,
  updateResume,
} from "../services/resumes.js";

/**
 * Resume ATS analyzer and editor.
 *
 *   GET    /                                   the account's resumes, paged
 *   GET    /history                            every finished analysis, paged
 *   GET    /meta                               the scoring weights and the rewrite modes
 *   POST   /upload?filename=                   raw PDF/DOCX body → a new resume (parsed, with an "Original" version)
 *   GET    /:id                                the resume: content, target, latest and active analysis
 *   PATCH  /:id                                {title?, content?, targetRole?, company?, jobDescription?} — the editor's save
 *   DELETE /:id
 *   POST   /:id/duplicate     {title?}
 *   POST   /:id/analyze       {targetRole?, company?, jobDescription?} → the queued analysis (202)
 *   GET    /:id/analyses                       past runs, paged
 *   GET    /:id/analyses/:analysisId           one run: status, stage, result
 *   GET    /:id/compare?before=&after=         two runs side by side
 *   GET    /:id/versions                       snapshots, paged
 *   POST   /:id/versions      {name}           snapshot the working copy
 *   GET    /:id/versions/:versionId            one snapshot with its content
 *   PATCH  /:id/versions/:versionId {name}
 *   DELETE /:id/versions/:versionId
 *   POST   /:id/versions/:versionId/restore
 *   POST   /:id/improve-bullet {path?, text, mode, context?} → the rewrite and its pending suggestion
 *   POST   /:id/optimize                       → pending suggestions for the whole resume ({section} confines it to one, aimed at the report's note)
 *   GET    /:id/suggestions?status=
 *   POST   /:id/suggestions/:suggestionId {status: accepted|rejected}
 *   GET    /:id/export?format=pdf|docx[&version=]   the document
 *
 * Everything needs an account. The upload is the one route on the API that
 * takes a file: it is read as a raw body by a parser mounted on this path
 * alone (the global parser is JSON only, 512 KB), and the bytes decide the
 * format — see lib/resume-files.ts. Model calls (analyze, improve-bullet,
 * optimize) share a per-account limiter on top of the general one.
 */
const router = Router();

type Authed = Request & { user: { userId: string; email: string } };

function handleResumeError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof ResumeError || err instanceof ResumeFileError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

const wrap =
  (fn: (req: Authed, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req as Authed, res).catch((err) => handleResumeError(err, res, next));
  };

const pageOf = (req: Request) => ({ page: Number(req.query["page"]) || 1, limit: Number(req.query["limit"]) || 20 });
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const strOrNull = (v: unknown): string | null | undefined => (v === null ? null : typeof v === "string" ? v : undefined);

router.use(requireAuth);

router.get(
  "/",
  wrap(async (req, res) => {
    const { page, limit } = pageOf(req);
    res.json(await listResumes(req.user.userId, page, limit));
  }),
);

router.get(
  "/history",
  wrap(async (req, res) => {
    const { page, limit } = pageOf(req);
    res.json(await listAnalysisHistory(req.user.userId, page, limit));
  }),
);

// Four constants compiled into the build — the scoring weights, their labels,
// the rewrite modes and the upload ceiling. The same bytes for every caller
// and they change only with a deploy.
router.get("/meta", browserCache(3600, { shared: true }), (_req, res) => {
  res.json({ weights: ATS_SCORING_WEIGHTS, labels: CATEGORY_LABELS, improveModes: IMPROVE_MODES, maxBytes: MAX_RESUME_BYTES });
});

/**
 * The raw-body parser for the upload, wrapped so its own refusal (a body
 * over the limit) is worded for this route rather than falling through to
 * the generic 413 about code inputs.
 */
const rawBody = express.raw({ type: () => true, limit: MAX_RESUME_BYTES + 1024 });
function readUpload(req: Request, res: Response, next: NextFunction): void {
  rawBody(req, res, (err?: unknown) => {
    if (err) {
      const status = (err as { status?: number }).status === 413 ? 413 : 400;
      res.status(status).json({ error: status === 413 ? `That file is too large. Resumes are limited to ${MAX_RESUME_BYTES / 1024 / 1024} MB.` : "The upload could not be read." });
      return;
    }
    next();
  });
}

router.post(
  "/upload",
  resumeUploadLimiter,
  readUpload,
  wrap(async (req, res) => {
    const body = req.body as unknown;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "Send the file as the request body." });
      return;
    }
    const resume = await createResumeFromUpload(req.user.userId, new Uint8Array(body), req.headers["content-type"] ?? null, str(req.query["filename"]) ?? null);
    res.status(201).json({ resume });
  }),
);

router.get(
  "/:id",
  wrap(async (req, res) => {
    res.json({ resume: await getResume(req.user.userId, String(req.params["id"])) });
  }),
);

router.patch(
  "/:id",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const out = await updateResume(req.user.userId, String(req.params["id"]), {
      title: str(body["title"]),
      content: body["content"],
      targetRole: strOrNull(body["targetRole"]),
      company: strOrNull(body["company"]),
      jobDescription: strOrNull(body["jobDescription"]),
    });
    res.json({ updatedAt: out.updatedAt, content: out.content });
  }),
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    await deleteResume(req.user.userId, String(req.params["id"]));
    res.json({ ok: true });
  }),
);

router.post(
  "/:id/duplicate",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json({ resume: await duplicateResume(req.user.userId, String(req.params["id"]), str(body["title"])) });
  }),
);

/* ── analysis ──────────────────────────────────────────────────────────── */

router.post(
  "/:id/analyze",
  resumeAiLimiter,
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const analysis = await startAnalysis(req.user.userId, String(req.params["id"]), {
      targetRole: strOrNull(body["targetRole"]),
      company: strOrNull(body["company"]),
      jobDescription: strOrNull(body["jobDescription"]),
    });
    res.status(202).json({ analysis });
  }),
);

router.get(
  "/:id/analyses",
  wrap(async (req, res) => {
    const { page, limit } = pageOf(req);
    res.json(await listAnalyses(req.user.userId, String(req.params["id"]), page, limit));
  }),
);

router.get(
  "/:id/analyses/:analysisId",
  wrap(async (req, res) => {
    res.json({ analysis: await getAnalysis(req.user.userId, String(req.params["id"]), String(req.params["analysisId"])) });
  }),
);

router.get(
  "/:id/compare",
  wrap(async (req, res) => {
    const before = str(req.query["before"]);
    const after = str(req.query["after"]);
    if (!before || !after) {
      res.status(400).json({ error: "Name the two analyses to compare (before and after)." });
      return;
    }
    res.json(await compare(req.user.userId, String(req.params["id"]), before, after));
  }),
);

/* ── versions ──────────────────────────────────────────────────────────── */

router.get(
  "/:id/versions",
  wrap(async (req, res) => {
    const { page, limit } = pageOf(req);
    res.json(await listVersions(req.user.userId, String(req.params["id"]), page, limit));
  }),
);

router.post(
  "/:id/versions",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.status(201).json({ version: await createVersion(req.user.userId, String(req.params["id"]), String(body["name"] ?? "")) });
  }),
);

router.get(
  "/:id/versions/:versionId",
  wrap(async (req, res) => {
    res.json({ version: await getVersion(req.user.userId, String(req.params["id"]), String(req.params["versionId"])) });
  }),
);

router.patch(
  "/:id/versions/:versionId",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    await renameVersion(req.user.userId, String(req.params["id"]), String(req.params["versionId"]), String(body["name"] ?? ""));
    res.json({ ok: true });
  }),
);

router.delete(
  "/:id/versions/:versionId",
  wrap(async (req, res) => {
    await deleteVersion(req.user.userId, String(req.params["id"]), String(req.params["versionId"]));
    res.json({ ok: true });
  }),
);

router.post(
  "/:id/versions/:versionId/restore",
  wrap(async (req, res) => {
    res.json({ resume: await restoreVersion(req.user.userId, String(req.params["id"]), String(req.params["versionId"])) });
  }),
);

/* ── AI rewrites ───────────────────────────────────────────────────────── */

router.post(
  "/:id/improve-bullet",
  resumeAiLimiter,
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const out = await improveBulletFor(req.user.userId, String(req.params["id"]), {
      path: str(body["path"]) ?? null,
      text: String(body["text"] ?? ""),
      mode: String(body["mode"] ?? ""),
      context: str(body["context"]),
    });
    res.json(out);
  }),
);

router.post(
  "/:id/optimize",
  resumeAiLimiter,
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.json({ suggestions: await optimizeFor(req.user.userId, String(req.params["id"]), str(body["section"]) ?? null) });
  }),
);

router.get(
  "/:id/suggestions",
  wrap(async (req, res) => {
    const status = str(req.query["status"]);
    res.json({ suggestions: await listSuggestions(req.user.userId, String(req.params["id"]), status && ["pending", "accepted", "rejected"].includes(status) ? status : undefined) });
  }),
);

router.post(
  "/:id/suggestions/:suggestionId",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = body["status"];
    if (status !== "accepted" && status !== "rejected") {
      res.status(400).json({ error: "status must be accepted or rejected" });
      return;
    }
    res.json(await decideSuggestion(req.user.userId, String(req.params["id"]), String(req.params["suggestionId"]), status));
  }),
);

/* ── export ────────────────────────────────────────────────────────────── */

router.get(
  "/:id/export",
  wrap(async (req, res) => {
    const format = str(req.query["format"]) === "docx" ? "docx" : "pdf";
    const versionId = str(req.query["version"]);
    const id = String(req.params["id"]);
    const content = versionId ? (await getVersion(req.user.userId, id, versionId)).content : (await getResume(req.user.userId, id)).content;
    const file = format === "pdf" ? await renderPdf(content) : await renderDocx(content);
    trackServerEvent("resume_exported", { resumeId: id, format, version: Boolean(versionId) }, req.user.userId);
    res.setHeader("Content-Type", format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${exportFilename(content, format)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(file);
  }),
);

export default router;

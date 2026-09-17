import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { trackServerEvent } from "../lib/telemetry.js";
import { ResumeFileError, resumeFileStore, safeFilename, sha256Hex, storageKeyFor, titleFromFilename, validateResumeUpload, RESUME_MIME } from "../lib/resume-files.js";
import { extractResume, type LayoutSignals } from "../lib/resume-extract.js";
import { ResumeContentSchema, normalizeContent, parseResumeText, readPath, type ResumeContent } from "../lib/resume-parse.js";
import { MAX_JD_CHARS, requirementsFor } from "../lib/resume-requirements.js";
import { compareAnalyses, scoreResume, type AnalysisResult } from "../lib/resume-scoring.js";
import { IMPROVE_MODES, ResumeAiError, aiAvailable, improveBullet, judgeResume, optimizeResume, resumeModel, structureResume, type ImproveMode, type ImproveOutput } from "../lib/resume-ai.js";

/**
 * Resumes: the rows, the analysis job, versions and suggestions.
 *
 * Every read and write here is scoped by `userId` in the query itself —
 * there is no "load then check owner" step that a later edit could skip.
 * A row that is not the caller's is simply not found.
 *
 * The analysis is a job, not a request. `startAnalysis` writes a
 * ResumeAnalysis row in status "queued" and hands its id to the in-process
 * runner below; the route answers at once and the client polls
 * `getAnalysis`, whose `stage` names the step under way. The runner is
 * deliberately small — a set and an array, two at a time — because the
 * platform has no queue (Redis is optional and the reminder jobs lock
 * through the database the same way). Moving it to a worker later means
 * replacing `enqueue`; the row is already the contract. A restart loses the
 * in-memory queue, so `recoverAnalyses` at boot re-queues young rows and
 * fails stale ones, and a poll that finds a row running past its time
 * limit fails it too, so nothing spins forever.
 */

export class ResumeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResumeError";
  }
}

/* ── shapes ────────────────────────────────────────────────────────────── */

export interface ResumeSummary {
  id: string;
  title: string;
  originalFilename: string;
  format: "pdf" | "docx";
  fileSize: number;
  targetRole: string | null;
  company: string | null;
  latestScore: number | null;
  latestAnalysisId: string | null;
  contentSource: string;
  createdAt: Date;
  updatedAt: Date;
  versions: number;
  analyses: number;
}

export interface AnalysisSummary {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  stage: string;
  score: number | null;
  aiStatus: string | null;
  targetRole: string | null;
  company: string | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface ResumeDetail extends ResumeSummary {
  content: ResumeContent;
  jobDescription: string | null;
  layout: LayoutSignals & { unmappedHeadings?: string[] };
  latestAnalysis: AnalysisSummary | null;
  activeAnalysis: AnalysisSummary | null;
  aiAvailable: boolean;
}

export interface AnalysisDetail extends AnalysisSummary {
  resumeId: string;
  jobDescription: string | null;
  result: AnalysisResult | null;
  contentSnapshot: ResumeContent;
}

const SUMMARY_SELECT = {
  id: true,
  title: true,
  originalFilename: true,
  mimeType: true,
  fileSize: true,
  targetRole: true,
  company: true,
  latestScore: true,
  latestAnalysisId: true,
  contentSource: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { versions: true, analyses: true } },
} satisfies Prisma.ResumeSelect;

const ANALYSIS_SUMMARY_SELECT = {
  id: true,
  status: true,
  stage: true,
  score: true,
  aiStatus: true,
  targetRole: true,
  company: true,
  error: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
} satisfies Prisma.ResumeAnalysisSelect;

type SummaryRow = Prisma.ResumeGetPayload<{ select: typeof SUMMARY_SELECT }>;
type AnalysisRow = Prisma.ResumeAnalysisGetPayload<{ select: typeof ANALYSIS_SUMMARY_SELECT }>;

function toSummary(row: SummaryRow): ResumeSummary {
  return {
    id: row.id,
    title: row.title,
    originalFilename: row.originalFilename,
    format: row.mimeType === RESUME_MIME.pdf ? "pdf" : "docx",
    fileSize: row.fileSize,
    targetRole: row.targetRole,
    company: row.company,
    latestScore: row.latestScore,
    latestAnalysisId: row.latestAnalysisId,
    contentSource: row.contentSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    versions: row._count.versions,
    analyses: row._count.analyses,
  };
}

function toAnalysisSummary(row: AnalysisRow): AnalysisSummary {
  return { ...row, status: row.status as AnalysisSummary["status"] };
}

/** Content out of a Json column, validated: a row a migration mangled must not crash a page. */
function contentOf(value: unknown): ResumeContent {
  const parsed = ResumeContentSchema.safeParse(value);
  if (!parsed.success) throw new ResumeError(500, "This resume's stored content is not readable.");
  return normalizeContent(parsed.data);
}

const PAGE_LIMIT = 50;

function paging(page?: number, limit?: number) {
  const p = Math.max(1, Math.floor(page ?? 1));
  const l = Math.min(PAGE_LIMIT, Math.max(1, Math.floor(limit ?? 20)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

const cleanTitle = (t: string) => t.replace(/\s+/g, " ").trim().slice(0, 120);

/* ── resumes ───────────────────────────────────────────────────────────── */

export async function listResumes(userId: string, page?: number, limit?: number) {
  const { skip, take, page: p, limit: l } = paging(page, limit);
  const [rows, total] = await Promise.all([
    prisma.resume.findMany({ where: { userId }, select: SUMMARY_SELECT, orderBy: { updatedAt: "desc" }, skip, take }),
    prisma.resume.count({ where: { userId } }),
  ]);
  return { resumes: rows.map(toSummary), total, page: p, limit: l };
}

/**
 * Upload → validated → text and layout → parsed → stored, with an "Original"
 * version so the starting point can always be restored. The bytes are not
 * kept (see lib/resume-files.ts).
 */
export async function createResumeFromUpload(userId: string, bytes: Uint8Array, declaredType: string | null, filename: string | null): Promise<ResumeDetail> {
  const startedAt = Date.now();
  const format = validateResumeUpload(bytes, declaredType);
  // Size and hash first: extraction hands the bytes to a parser that may
  // detach them (pdf.js transfers the buffer to its worker).
  const size = bytes.length;
  const sha = sha256Hex(bytes);
  const extracted = await extractResume(bytes, format);
  const parsed = parseResumeText(extracted.text, extracted.layout.headingHints);
  const name = safeFilename(filename, format);
  const storageKey = await resumeFileStore.put(storageKeyFor(userId, sha, format), bytes, RESUME_MIME[format]);
  const layout = { ...extracted.layout, headingHints: [], unmappedHeadings: parsed.unmappedHeadings, sectionsFound: parsed.sectionsFound };
  const title = parsed.content.basics.name ? `${parsed.content.basics.name} — ${titleFromFilename(name)}`.slice(0, 120) : titleFromFilename(name);

  const created = await prisma.resume.create({
    data: {
      userId,
      title,
      originalFilename: name,
      mimeType: RESUME_MIME[format],
      fileSize: size,
      fileSha256: sha,
      storageKey,
      rawText: extracted.text,
      layout: layout as unknown as Prisma.InputJsonValue,
      content: parsed.content as unknown as Prisma.InputJsonValue,
      contentSource: "heuristic",
      versions: { create: { userId, name: "Original", content: parsed.content as unknown as Prisma.InputJsonValue } },
    },
    select: { id: true },
  });
  trackServerEvent("resume_uploaded", { format, pages: extracted.layout.pages, chars: extracted.layout.chars, ms: Date.now() - startedAt, sections: parsed.sectionsFound.length }, userId);
  return getResume(userId, created.id);
}

export async function getResume(userId: string, id: string): Promise<ResumeDetail> {
  const row = await prisma.resume.findFirst({
    where: { id, userId },
    select: { ...SUMMARY_SELECT, content: true, jobDescription: true, layout: true },
  });
  if (!row) throw new ResumeError(404, "No such resume");
  const [latest, active] = await Promise.all([
    row.latestAnalysisId ? prisma.resumeAnalysis.findFirst({ where: { id: row.latestAnalysisId, userId }, select: ANALYSIS_SUMMARY_SELECT }) : null,
    prisma.resumeAnalysis.findFirst({ where: { resumeId: id, userId, status: { in: ["queued", "running"] } }, select: ANALYSIS_SUMMARY_SELECT, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    ...toSummary(row),
    content: contentOf(row.content),
    jobDescription: row.jobDescription,
    layout: row.layout as unknown as ResumeDetail["layout"],
    latestAnalysis: latest ? toAnalysisSummary(latest) : null,
    activeAnalysis: active ? toAnalysisSummary(active) : null,
    aiAvailable: aiAvailable(),
  };
}

export interface ResumePatch {
  title?: string;
  content?: unknown;
  targetRole?: string | null;
  company?: string | null;
  jobDescription?: string | null;
}

function targetFields(patch: ResumePatch) {
  const data: Prisma.ResumeUpdateInput = {};
  if (patch.targetRole !== undefined) data.targetRole = patch.targetRole ? cleanTitle(patch.targetRole) : null;
  if (patch.company !== undefined) data.company = patch.company ? cleanTitle(patch.company) : null;
  if (patch.jobDescription !== undefined) {
    const jd = (patch.jobDescription ?? "").trim();
    if (jd.length > MAX_JD_CHARS) throw new ResumeError(400, `The job description is limited to ${MAX_JD_CHARS.toLocaleString()} characters.`);
    data.jobDescription = jd || null;
  }
  return data;
}

/** The editor's save: content (validated), title and target. */
export async function updateResume(userId: string, id: string, patch: ResumePatch): Promise<{ updatedAt: Date; content: ResumeContent | null }> {
  const data = targetFields(patch);
  let content: ResumeContent | null = null;
  if (patch.title !== undefined) {
    const title = cleanTitle(String(patch.title));
    if (!title) throw new ResumeError(400, "The title cannot be empty.");
    data.title = title;
  }
  if (patch.content !== undefined) {
    const parsed = ResumeContentSchema.safeParse(patch.content);
    if (!parsed.success) throw new ResumeError(400, "The resume content is not in a shape the editor can save.");
    content = normalizeContent(parsed.data);
    data.content = content as unknown as Prisma.InputJsonValue;
    data.contentSource = "edited";
  }
  const result = await prisma.resume.updateMany({ where: { id, userId }, data });
  if (result.count === 0) throw new ResumeError(404, "No such resume");
  if (content) trackServerEvent("resume_edited", { resumeId: id }, userId);
  const row = await prisma.resume.findFirst({ where: { id, userId }, select: { updatedAt: true } });
  return { updatedAt: row?.updatedAt ?? new Date(), content };
}

export async function deleteResume(userId: string, id: string): Promise<void> {
  const row = await prisma.resume.findFirst({ where: { id, userId }, select: { storageKey: true } });
  if (!row) throw new ResumeError(404, "No such resume");
  // Versions, analyses and suggestions cascade with the row.
  await prisma.resume.deleteMany({ where: { id, userId } });
  if (row.storageKey) await resumeFileStore.remove(row.storageKey).catch(() => undefined);
}

export async function duplicateResume(userId: string, id: string, title?: string): Promise<ResumeDetail> {
  const row = await prisma.resume.findFirst({ where: { id, userId } });
  if (!row) throw new ResumeError(404, "No such resume");
  const name = title ? cleanTitle(title) : `${row.title} (copy)`.slice(0, 120);
  const created = await prisma.resume.create({
    data: {
      userId,
      title: name,
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      fileSha256: row.fileSha256,
      storageKey: row.storageKey,
      rawText: row.rawText,
      layout: row.layout as Prisma.InputJsonValue,
      content: row.content as Prisma.InputJsonValue,
      contentSource: row.contentSource === "heuristic" ? "heuristic" : "edited",
      targetRole: row.targetRole,
      company: row.company,
      jobDescription: row.jobDescription,
      versions: { create: { userId, name: "Original", content: row.content as Prisma.InputJsonValue, targetRole: row.targetRole, company: row.company, jobDescription: row.jobDescription } },
    },
    select: { id: true },
  });
  return getResume(userId, created.id);
}

/* ── versions ──────────────────────────────────────────────────────────── */

export interface VersionSummary {
  id: string;
  name: string;
  score: number | null;
  targetRole: string | null;
  company: string | null;
  createdAt: Date;
}

const VERSION_SELECT = { id: true, name: true, score: true, targetRole: true, company: true, createdAt: true } satisfies Prisma.ResumeVersionSelect;

export async function listVersions(userId: string, resumeId: string, page?: number, limit?: number) {
  const { skip, take, page: p, limit: l } = paging(page, limit);
  const [rows, total] = await Promise.all([
    prisma.resumeVersion.findMany({ where: { resumeId, userId }, select: VERSION_SELECT, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.resumeVersion.count({ where: { resumeId, userId } }),
  ]);
  return { versions: rows as VersionSummary[], total, page: p, limit: l };
}

/** A snapshot of the working copy, its target and its latest finished analysis. */
export async function createVersion(userId: string, resumeId: string, name: string): Promise<VersionSummary> {
  const title = cleanTitle(name);
  if (!title) throw new ResumeError(400, "Give the version a name.");
  const row = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true, targetRole: true, company: true, jobDescription: true, latestAnalysisId: true } });
  if (!row) throw new ResumeError(404, "No such resume");
  const analysis = row.latestAnalysisId ? await prisma.resumeAnalysis.findFirst({ where: { id: row.latestAnalysisId, userId, status: "done" }, select: { result: true, score: true } }) : null;
  const created = await prisma.resumeVersion.create({
    data: {
      resumeId,
      userId,
      name: title,
      content: row.content as Prisma.InputJsonValue,
      targetRole: row.targetRole,
      company: row.company,
      jobDescription: row.jobDescription,
      analysis: (analysis?.result as Prisma.InputJsonValue | null) ?? undefined,
      score: analysis?.score ?? null,
    },
    select: VERSION_SELECT,
  });
  return created;
}

export async function getVersion(userId: string, resumeId: string, versionId: string) {
  const row = await prisma.resumeVersion.findFirst({ where: { id: versionId, resumeId, userId } });
  if (!row) throw new ResumeError(404, "No such version");
  return { ...row, content: contentOf(row.content), analysis: (row.analysis as AnalysisResult | null) ?? null };
}

export async function renameVersion(userId: string, resumeId: string, versionId: string, name: string): Promise<void> {
  const title = cleanTitle(name);
  if (!title) throw new ResumeError(400, "Give the version a name.");
  const result = await prisma.resumeVersion.updateMany({ where: { id: versionId, resumeId, userId }, data: { name: title } });
  if (result.count === 0) throw new ResumeError(404, "No such version");
}

export async function deleteVersion(userId: string, resumeId: string, versionId: string): Promise<void> {
  const result = await prisma.resumeVersion.deleteMany({ where: { id: versionId, resumeId, userId } });
  if (result.count === 0) throw new ResumeError(404, "No such version");
}

/** The version becomes the working copy; what was there is kept as a version first, so nothing is lost. */
export async function restoreVersion(userId: string, resumeId: string, versionId: string): Promise<ResumeDetail> {
  const version = await prisma.resumeVersion.findFirst({ where: { id: versionId, resumeId, userId } });
  if (!version) throw new ResumeError(404, "No such version");
  const current = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true, targetRole: true, company: true, jobDescription: true, latestScore: true } });
  if (!current) throw new ResumeError(404, "No such resume");
  const content = contentOf(version.content);
  await prisma.$transaction([
    prisma.resumeVersion.create({
      data: {
        resumeId,
        userId,
        name: `Before restoring "${version.name}"`.slice(0, 120),
        content: current.content as Prisma.InputJsonValue,
        targetRole: current.targetRole,
        company: current.company,
        jobDescription: current.jobDescription,
        score: current.latestScore,
      },
    }),
    prisma.resume.update({
      where: { id: resumeId },
      data: {
        content: content as unknown as Prisma.InputJsonValue,
        contentSource: "edited",
        targetRole: version.targetRole,
        company: version.company,
        jobDescription: version.jobDescription,
      },
    }),
  ]);
  return getResume(userId, resumeId);
}

/* ── analyses ──────────────────────────────────────────────────────────── */

/** An analysis running longer than this is presumed lost to a restart. */
const STALE_AFTER_MS = 15 * 60 * 1000;
const CONCURRENCY = Number(process.env["RESUME_ANALYSIS_CONCURRENCY"] ?? 2);

const queue: string[] = [];
const running = new Set<string>();

function pump(): void {
  while (running.size < CONCURRENCY && queue.length) {
    const id = queue.shift()!;
    if (running.has(id)) continue;
    running.add(id);
    runAnalysis(id)
      .catch((err) => console.error(`[resumes] analysis ${id} crashed:`, (err as Error)?.message))
      .finally(() => {
        running.delete(id);
        pump();
      });
  }
}

function enqueue(id: string): void {
  if (!queue.includes(id) && !running.has(id)) queue.push(id);
  pump();
}

export interface AnalyzeOptions {
  targetRole?: string | null;
  company?: string | null;
  jobDescription?: string | null;
}

/**
 * Starts a run. The target, when given, is saved on the resume first so the
 * editor and the analysis agree on it. One run per resume at a time: a
 * second request while one is queued or running gets the same row back.
 */
export async function startAnalysis(userId: string, resumeId: string, options: AnalyzeOptions): Promise<AnalysisSummary> {
  const data = targetFields(options);
  if (Object.keys(data).length) {
    const result = await prisma.resume.updateMany({ where: { id: resumeId, userId }, data });
    if (result.count === 0) throw new ResumeError(404, "No such resume");
  }
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true, targetRole: true, company: true, jobDescription: true } });
  if (!resume) throw new ResumeError(404, "No such resume");
  if (!resume.targetRole && !resume.jobDescription) throw new ResumeError(400, "Enter the job role you are applying for, or paste the job description, before analyzing.");

  const active = await prisma.resumeAnalysis.findFirst({ where: { resumeId, userId, status: { in: ["queued", "running"] } }, select: ANALYSIS_SUMMARY_SELECT });
  if (active && !isStale(active)) return toAnalysisSummary(active);

  const created = await prisma.resumeAnalysis.create({
    data: {
      resumeId,
      userId,
      status: "queued",
      stage: "queued",
      targetRole: resume.targetRole,
      company: resume.company,
      jobDescription: resume.jobDescription,
      contentSnapshot: resume.content as Prisma.InputJsonValue,
    },
    select: ANALYSIS_SUMMARY_SELECT,
  });
  trackServerEvent("resume_analysis_started", { resumeId, hasJd: Boolean(resume.jobDescription), ai: aiAvailable() }, userId);
  enqueue(created.id);
  return toAnalysisSummary(created);
}

function isStale(row: { status: string; startedAt: Date | null; createdAt: Date }): boolean {
  const since = (row.status === "running" ? row.startedAt : row.createdAt) ?? row.createdAt;
  return Date.now() - since.getTime() > STALE_AFTER_MS;
}

const STALE_MESSAGE = "The analysis did not finish — the server restarted while it was running. Run it again.";

export async function getAnalysis(userId: string, resumeId: string, analysisId: string): Promise<AnalysisDetail> {
  const row = await prisma.resumeAnalysis.findFirst({ where: { id: analysisId, resumeId, userId } });
  if (!row) throw new ResumeError(404, "No such analysis");
  if ((row.status === "queued" || row.status === "running") && isStale(row) && !running.has(row.id)) {
    await prisma.resumeAnalysis.updateMany({ where: { id: row.id, status: { in: ["queued", "running"] } }, data: { status: "failed", error: STALE_MESSAGE, finishedAt: new Date() } });
    row.status = "failed";
    row.error = STALE_MESSAGE;
  }
  return {
    ...toAnalysisSummary(row),
    resumeId: row.resumeId,
    jobDescription: row.jobDescription,
    result: (row.result as AnalysisResult | null) ?? null,
    contentSnapshot: contentOf(row.contentSnapshot),
  };
}

export async function listAnalyses(userId: string, resumeId: string, page?: number, limit?: number) {
  const { skip, take, page: p, limit: l } = paging(page, limit);
  const [rows, total] = await Promise.all([
    prisma.resumeAnalysis.findMany({ where: { resumeId, userId }, select: ANALYSIS_SUMMARY_SELECT, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.resumeAnalysis.count({ where: { resumeId, userId } }),
  ]);
  return { analyses: rows.map(toAnalysisSummary), total, page: p, limit: l };
}

/** Everything a person has analysed, newest first — the history page. */
export async function listAnalysisHistory(userId: string, page?: number, limit?: number) {
  const { skip, take, page: p, limit: l } = paging(page, limit);
  const [rows, total] = await Promise.all([
    prisma.resumeAnalysis.findMany({
      where: { userId, status: "done" },
      select: { ...ANALYSIS_SUMMARY_SELECT, resume: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.resumeAnalysis.count({ where: { userId, status: "done" } }),
  ]);
  return { analyses: rows.map((r) => ({ ...toAnalysisSummary(r), resume: r.resume })), total, page: p, limit: l };
}

export async function compare(userId: string, resumeId: string, beforeId: string, afterId: string) {
  const [before, after] = await Promise.all([getAnalysis(userId, resumeId, beforeId), getAnalysis(userId, resumeId, afterId)]);
  if (!before.result || !after.result) throw new ResumeError(400, "Both analyses must have finished to compare them.");
  return {
    before: { id: before.id, createdAt: before.createdAt, targetRole: before.targetRole, company: before.company, content: before.contentSnapshot },
    after: { id: after.id, createdAt: after.createdAt, targetRole: after.targetRole, company: after.company, content: after.contentSnapshot },
    comparison: compareAnalyses(before.result, after.result),
  };
}

const STAGES = ["reading", "requirements", "matching", "checking", "reviewing", "scoring"] as const;
export type AnalysisStage = (typeof STAGES)[number];

async function setStage(id: string, stage: AnalysisStage): Promise<void> {
  await prisma.resumeAnalysis.updateMany({ where: { id, status: "running" }, data: { stage } });
}

/** The pipeline. Runs outside any request; failures land on the row. */
async function runAnalysis(id: string): Promise<void> {
  const claimed = await prisma.resumeAnalysis.updateMany({ where: { id, status: "queued" }, data: { status: "running", stage: "reading", startedAt: new Date() } });
  if (claimed.count === 0) return;
  const startedAt = Date.now();
  const row = await prisma.resumeAnalysis.findUnique({ where: { id }, include: { resume: { select: { id: true, userId: true, rawText: true, layout: true, contentSource: true, content: true } } } });
  if (!row) return;
  const { resume } = row;
  try {
    let content = contentOf(row.contentSnapshot);

    // The model's structuring, once, and only over a parse nobody has
    // edited — an edit is the person's and is never overwritten.
    if (resume.contentSource === "heuristic" && aiAvailable()) {
      const structured = await structureResume(resume.rawText);
      if (structured) {
        const fresh = await prisma.resume.findUnique({ where: { id: resume.id }, select: { contentSource: true } });
        if (fresh?.contentSource === "heuristic") {
          content = structured.content;
          await prisma.$transaction([
            prisma.resume.update({ where: { id: resume.id }, data: { content: content as unknown as Prisma.InputJsonValue, contentSource: "ai" } }),
            prisma.resumeVersion.updateMany({ where: { resumeId: resume.id, name: "Original" }, data: { content: content as unknown as Prisma.InputJsonValue } }),
            prisma.resumeAnalysis.update({ where: { id }, data: { contentSnapshot: content as unknown as Prisma.InputJsonValue } }),
          ]);
        }
      }
    }

    await setStage(id, "requirements");
    const requirements = requirementsFor(row.targetRole, row.company, row.jobDescription);
    const layout = (resume.layout as unknown as (LayoutSignals & { unmappedHeadings?: string[] }) | null) ?? null;
    const unmapped = layout?.unmappedHeadings ?? [];

    await setStage(id, "matching");
    const deterministic = scoreResume({ content, requirements, layout, unmappedHeadings: unmapped, ai: null });

    await setStage(id, "checking");
    // (ATS checks are part of scoreResume; the stage exists so the client can name it.)

    await setStage(id, "reviewing");
    const review = await judgeResume({ content, requirements, jobDescription: row.jobDescription, deterministic });

    await setStage(id, "scoring");
    const result = review.judgement
      ? scoreResume({ content, requirements, layout, unmappedHeadings: unmapped, ai: review.judgement, model: resumeModel() })
      : scoreResume({ content, requirements, layout, unmappedHeadings: unmapped, ai: null, aiFailure: review.error, model: resumeModel() });

    await prisma.$transaction([
      prisma.resumeAnalysis.update({
        where: { id },
        data: { status: "done", stage: "done", result: result as unknown as Prisma.InputJsonValue, score: result.overallScore, aiStatus: result.ai.status, finishedAt: new Date() },
      }),
      prisma.resume.update({ where: { id: resume.id }, data: { latestAnalysisId: id, latestScore: result.overallScore } }),
    ]);
    trackServerEvent("resume_analysis_completed", { resumeId: resume.id, score: result.overallScore, ai: result.ai.status, ms: Date.now() - startedAt, source: requirements.source }, resume.userId);
  } catch (err) {
    const message = err instanceof ResumeError || err instanceof ResumeFileError ? err.message : "The analysis failed unexpectedly. Run it again; if it keeps failing, the resume may be in a shape the analyzer cannot read.";
    console.error(`[resumes] analysis ${id} failed:`, (err as Error)?.message);
    await prisma.resumeAnalysis.updateMany({ where: { id }, data: { status: "failed", stage: "failed", error: message, finishedAt: new Date() } }).catch(() => undefined);
    trackServerEvent("resume_analysis_failed", { resumeId: resume.id, message: (err as Error)?.message?.slice(0, 200) ?? null }, resume.userId);
  }
}

/** At boot: re-queue what a restart interrupted while it was still young, fail the rest. */
export async function recoverAnalyses(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    await prisma.resumeAnalysis.updateMany({
      where: { status: { in: ["queued", "running"] }, createdAt: { lt: cutoff } },
      data: { status: "failed", stage: "failed", error: STALE_MESSAGE, finishedAt: new Date() },
    });
    const young = await prisma.resumeAnalysis.findMany({ where: { status: { in: ["queued", "running"] } }, select: { id: true }, orderBy: { createdAt: "asc" }, take: 50 });
    if (young.length) {
      // A row left "running" by the old process is re-queued, not resumed: the step it was on is unknown.
      await prisma.resumeAnalysis.updateMany({ where: { id: { in: young.map((r) => r.id) } }, data: { status: "queued", stage: "queued", startedAt: null } });
      for (const r of young) enqueue(r.id);
      console.log(`[resumes] re-queued ${young.length} analysis ${young.length === 1 ? "run" : "runs"} from before the restart`);
    }
  } catch (err) {
    console.error("[resumes] recovery failed:", (err as Error)?.message);
  }
}

/* ── suggestions ───────────────────────────────────────────────────────── */

export interface SuggestionRow {
  id: string;
  kind: string;
  mode: string | null;
  path: string;
  original: string;
  suggested: string;
  rationale: string;
  status: "pending" | "accepted" | "rejected";
  needsMetric: boolean;
  createdAt: Date;
  decidedAt: Date | null;
}

const SUGGESTION_SELECT = { id: true, kind: true, mode: true, path: true, original: true, suggested: true, rationale: true, status: true, createdAt: true, decidedAt: true } satisfies Prisma.ResumeSuggestionSelect;

function toSuggestion(row: Prisma.ResumeSuggestionGetPayload<{ select: typeof SUGGESTION_SELECT }>): SuggestionRow {
  return { ...row, status: row.status as SuggestionRow["status"], needsMetric: /\[add figure\]/.test(row.suggested) };
}

export async function listSuggestions(userId: string, resumeId: string, status?: string) {
  const rows = await prisma.resumeSuggestion.findMany({
    where: { resumeId, userId, ...(status ? { status } : {}) },
    select: SUGGESTION_SELECT,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(toSuggestion);
}

export interface ImproveRequest {
  path: string | null;
  text: string;
  mode: string;
  context?: string;
}

/** One bullet, rewritten by the model, recorded as a pending suggestion. */
export async function improveBulletFor(userId: string, resumeId: string, req: ImproveRequest): Promise<ImproveOutput & { suggestion: SuggestionRow }> {
  if (!IMPROVE_MODES.includes(req.mode as ImproveMode)) throw new ResumeError(400, `Mode must be one of ${IMPROVE_MODES.join(", ")}.`);
  const text = String(req.text ?? "").trim();
  if (!text) throw new ResumeError(400, "There is no text to improve.");
  if (text.length > 1200) throw new ResumeError(400, "That is too long for one bullet. Split it first.");
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true, targetRole: true, company: true, jobDescription: true } });
  if (!resume) throw new ResumeError(404, "No such resume");
  const content = contentOf(resume.content);
  const requirements = resume.targetRole || resume.jobDescription ? requirementsFor(resume.targetRole, resume.company, resume.jobDescription) : null;
  const path = req.path && /^[a-zA-Z]+(?:\.\d+)?(?:\.[a-zA-Z]+\.\d+)?$/.test(req.path) ? req.path : "";
  const context = String(req.context ?? "").slice(0, 200);
  const out = await improveBullet({ text, mode: req.mode as ImproveMode, context, content, requirements }).catch(rethrowAi);
  const suggestion = await prisma.resumeSuggestion.create({
    data: { resumeId, userId, kind: path === "summary" ? "summary" : "bullet", mode: req.mode, path: path || "unplaced", original: text, suggested: out.suggested, rationale: out.rationale, status: "pending" },
    select: SUGGESTION_SELECT,
  });
  trackServerEvent("ai_bullet_improvement_used", { resumeId, mode: req.mode, needsMetric: out.needsMetric, warnings: out.warnings.length }, userId);
  return { ...out, suggestion: toSuggestion(suggestion) };
}

/** The whole-resume proposal: pending suggestions the editor offers one by one. */
export async function optimizeFor(userId: string, resumeId: string): Promise<SuggestionRow[]> {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true, targetRole: true, company: true, jobDescription: true, latestAnalysisId: true } });
  if (!resume) throw new ResumeError(404, "No such resume");
  if (!resume.targetRole && !resume.jobDescription) throw new ResumeError(400, "Set the target job first — optimisation is for a specific job.");
  const content = contentOf(resume.content);
  const requirements = requirementsFor(resume.targetRole, resume.company, resume.jobDescription);
  const proposals = await optimizeResume(content, requirements, resume.jobDescription).catch(rethrowAi);
  // Earlier pending proposals for the same paths are superseded.
  await prisma.resumeSuggestion.updateMany({ where: { resumeId, userId, kind: "optimize", status: "pending" }, data: { status: "rejected", decidedAt: new Date() } });
  await prisma.resumeSuggestion.createMany({
    data: proposals.map((p) => ({ resumeId, userId, analysisId: resume.latestAnalysisId, kind: "optimize", mode: "tailor", path: p.path, original: p.original, suggested: p.suggested, rationale: p.rationale, status: "pending" })),
  });
  trackServerEvent("resume_optimize_used", { resumeId, proposals: proposals.length }, userId);
  return listSuggestions(userId, resumeId, "pending");
}

function rethrowAi(err: unknown): never {
  if (err instanceof ResumeAiError) throw new ResumeError(err.status, err.message);
  throw err;
}

/**
 * Accept or reject. Accepting also writes the text into the working copy
 * when the field still holds the original (the editor applies it locally
 * too; whichever save lands first wins and the other is a no-op). A field
 * that has since been changed to something else is left alone and the
 * caller told, so a stale suggestion cannot overwrite a newer edit.
 */
export async function decideSuggestion(userId: string, resumeId: string, suggestionId: string, status: "accepted" | "rejected"): Promise<{ suggestion: SuggestionRow; applied: boolean; content: ResumeContent | null }> {
  const row = await prisma.resumeSuggestion.findFirst({ where: { id: suggestionId, resumeId, userId }, select: SUGGESTION_SELECT });
  if (!row) throw new ResumeError(404, "No such suggestion");
  let applied = false;
  let content: ResumeContent | null = null;
  if (status === "accepted" && row.path !== "unplaced") {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { content: true } });
    if (resume) {
      const current = contentOf(resume.content);
      const now = readPath(current, row.path);
      if (now !== null && now.trim() === row.original.trim()) {
        content = writePath(current, row.path, row.suggested);
        await prisma.resume.updateMany({ where: { id: resumeId, userId }, data: { content: content as unknown as Prisma.InputJsonValue, contentSource: "edited" } });
        applied = true;
      } else if (now !== null && now.trim() === row.suggested.trim()) {
        applied = true;
        content = current;
      }
    }
  }
  const updated = await prisma.resumeSuggestion.update({ where: { id: suggestionId }, data: { status, decidedAt: new Date() }, select: SUGGESTION_SELECT });
  trackServerEvent("resume_suggestion_decided", { resumeId, kind: row.kind, status, applied }, userId);
  return { suggestion: toSuggestion(updated), applied, content };
}

/** A copy of the content with one addressed string replaced. */
export function writePath(content: ResumeContent, path: string, value: string): ResumeContent {
  const next: ResumeContent = JSON.parse(JSON.stringify(content));
  if (path === "summary") {
    next.summary = value;
    return next;
  }
  const m = path.match(/^(experience|projects|education|achievements|customSections)\.(\d+)(?:\.(bullets|details)\.(\d+))?$/);
  if (!m) return next;
  const [, section, i, list, j] = m;
  if (section === "achievements") {
    if (next.achievements[Number(i)] !== undefined) next.achievements[Number(i)] = value;
    return next;
  }
  const row = (next as unknown as Record<string, Array<Record<string, unknown>>>)[section]?.[Number(i)];
  if (row && list && Array.isArray(row[list]) && (row[list] as string[])[Number(j)] !== undefined) (row[list] as string[])[Number(j)] = value;
  return next;
}

/**
 * The system design canvas's runner (lib/design-practice): lists the
 * problems with the member's standing, stores an attempt, has the model
 * review it in the background and serves the result to the page's poll.
 *
 * The review takes ten to forty seconds, so a submit answers at once with
 * the attempt's id (status "running") and the page polls GET /attempts/:id —
 * the resume analyzer's pattern, without a durable queue: a review is cheap
 * to ask for again, so a row left "running" by a restart is failed on its
 * next read (STALE_MS) rather than recovered.
 */
import { prisma } from "../lib/prisma.js";
import { ai } from "../lib/ai/provider.js";
import { promptFor } from "../lib/ai/prompts.js";
import {
  ANSWER_FIELDS,
  COMPONENTS,
  DESIGN_PROBLEMS,
  DESIGN_RUBRIC,
  DesignReviewSchema,
  buildDesignMessages,
  coerceDesignReview,
  guardDesignReview,
  parseAnswer,
  problemBySlug,
  type DesignAnswer,
  type DesignProblem,
} from "../lib/design-practice.js";
import { invalidateDashboard } from "./dashboard.js";
import { notePage } from "./cs-notes.js";

const REVIEW_TOKENS = 1_400;
/** Reviews in flight at once across the process; the rest wait their turn. */
const CONCURRENCY = 2;
/** A review still "running" after this was lost (a restart, a hung call). */
const STALE_MS = 3 * 60_000;
/** Attempts listed on a problem's page. */
const ATTEMPTS_SHOWN = 20;

export class DesignPracticeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const LEVEL_WORD: Record<DesignProblem["level"], string> = { beginner: "beginner", intermediate: "intermediate", advanced: "advanced" };

/**
 * A problem's direct answer and common questions (2026-11-14, answer
 * engines): what a search result or an AI answer quotes for "how do you
 * design a URL shortener". The answer is the reference note's own authored
 * one (content/notes/system-design, 25–80 words, held by the notes' gate),
 * so this page never states a design the note does not; the other answers
 * are the problem's stated facts and the rubric. Printed on the page for a
 * visitor (DesignCanvasPage) and written into the edge HTML and the
 * FAQPage markup (services/seo designProblemHead) — one source for all
 * three, as Google requires of FAQ markup. Never `mustCover`.
 */
export function designFaq(p: DesignProblem): { question: string; answer: string | null; faq: Array<{ q: string; a: string }> } {
  const note = notePage("system-design", p.note)?.note.seo ?? null;
  const question = `How do you answer "${p.title}" in a system design interview?`;
  const rubric = DESIGN_RUBRIC.map((c) => `${c.label.toLowerCase()} (${c.max})`).join(", ");
  const faq = [
    ...(note ? [{ q: question, a: note.answer }] : []),
    { q: `What scale is "${p.title}" designed for here?`, a: `${p.scale} Your estimates turn that into requests per second, storage and bandwidth before you pick components.` },
    { q: "How is a design scored?", a: `Out of 100 on a fixed rubric: ${rubric}. The review names what the design covered and what it missed, then points to the reference design.` },
    { q: `Is "${p.title}" a good first system design problem?`, a: p.level === "beginner" ? "Yes. It is rated beginner: few components, a clear read and write path, and the classic estimates every later problem builds on." : `It is rated ${LEVEL_WORD[p.level]}. Start with the beginner problems — the URL shortener and the rate limiter — and the System Design notes on load balancing, caching and sharding first.` },
    { q: "Do I need an account?", a: "Not to read the problem or the reference design. Getting your design reviewed needs a free account." },
  ];
  return { question, answer: note?.answer ?? null, faq };
}

/** A problem as the page shows it — never `mustCover`, which is the reviewer's. */
function publicProblem(p: DesignProblem) {
  return { slug: p.slug, title: p.title, brief: p.brief, scale: p.scale, note: p.note, level: p.level };
}

export async function designProblems(userId: string | null) {
  const best = userId
    ? await prisma.designAttempt.groupBy({ by: ["slug"], where: { userId, status: "done" }, _max: { score: true }, _count: { _all: true } })
    : [];
  const bySlug = new Map(best.map((b) => [b.slug, { best: b._max.score, attempts: b._count._all }]));
  return {
    problems: DESIGN_PROBLEMS.map((p) => ({ ...publicProblem(p), best: bySlug.get(p.slug)?.best ?? null, attempts: bySlug.get(p.slug)?.attempts ?? 0 })),
  };
}

export async function designProblem(slug: string, userId: string | null) {
  const p = problemBySlug(slug);
  if (!p) throw new DesignPracticeError("That design problem does not exist.", 404);
  const attempts = userId
    ? await prisma.designAttempt.findMany({
        where: { userId, slug },
        orderBy: { createdAt: "desc" },
        take: ATTEMPTS_SHOWN,
        select: { id: true, status: true, score: true, createdAt: true },
      })
    : [];
  return {
    problem: publicProblem(p),
    fields: ANSWER_FIELDS,
    components: COMPONENTS,
    rubric: DESIGN_RUBRIC.map(({ key, label, max, asks }) => ({ key, label, max, asks })),
    // The page's direct answer and questions, as the edge writes them (designFaq).
    seo: designFaq(p),
    attempts,
  };
}

/* ── the review runner ────────────────────────────────────────────── */

let running = 0;
const waiting: Array<() => void> = [];
async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= CONCURRENCY) await new Promise<void>((resolve) => waiting.push(resolve));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

async function review(id: string, userId: string, problem: DesignProblem, answer: DesignAnswer) {
  try {
    const prompt = promptFor("design-review");
    const { parsed, usage } = await slot(() =>
      ai.json(buildDesignMessages(problem, answer, prompt.text), DesignReviewSchema, "design_review", { maxTokens: REVIEW_TOKENS, temperature: 0.2, coerce: coerceDesignReview }),
    );
    const guarded = guardDesignReview(parsed, answer);
    if (!guarded) throw new Error("the review scored nothing");
    await prisma.designAttempt.update({
      where: { id },
      data: {
        status: "done",
        review: guarded as object,
        score: guarded.score,
        model: ai.model(),
        promptVersion: prompt.version,
        tokens: usage.promptTokens + usage.completionTokens,
        reviewedAt: new Date(),
      },
    });
    // The skill profile reads done reviews as int:design evidence; the dashboard drops it.
    invalidateDashboard(userId);
  } catch (error) {
    console.error("design review failed:", (error as Error).message);
    await prisma.designAttempt.update({ where: { id }, data: { status: "failed", reviewedAt: new Date() } }).catch(() => undefined);
  }
}

export async function submitDesign(userId: string, slug: string, raw: unknown): Promise<{ id: string }> {
  const problem = problemBySlug(slug);
  if (!problem) throw new DesignPracticeError("That design problem does not exist.", 404);
  if (!ai.available()) throw new DesignPracticeError("Design reviews are not available on this deployment.", 503);
  const parsed = parseAnswer(raw);
  if ("error" in parsed) throw new DesignPracticeError(parsed.error, 400);
  // One review at a time per member: a second submit while one runs would only race it.
  const busy = await prisma.designAttempt.count({ where: { userId, status: "running", createdAt: { gte: new Date(Date.now() - STALE_MS) } } });
  if (busy) throw new DesignPracticeError("Your last design is still being reviewed. Wait for it before sending another.", 409);
  const row = await prisma.designAttempt.create({ data: { userId, slug, answer: parsed.answer as object, status: "running" }, select: { id: true } });
  void review(row.id, userId, problem, parsed.answer);
  return { id: row.id };
}

export async function designAttempt(userId: string, id: string) {
  const row = await prisma.designAttempt.findFirst({
    where: { id, userId },
    select: { id: true, slug: true, status: true, answer: true, review: true, score: true, createdAt: true, reviewedAt: true },
  });
  // Someone else's or unknown: the same answer for each.
  if (!row) throw new DesignPracticeError("That design was not found.", 404);
  if (row.status === "running" && Date.now() - row.createdAt.getTime() > STALE_MS) {
    await prisma.designAttempt.update({ where: { id }, data: { status: "failed", reviewedAt: new Date() } });
    return { ...row, status: "failed" };
  }
  return row;
}

/**
 * The Resume Deep Dive Interview page (`/mock-interview/resume`, the owner's
 * ask on 2026-11-14: "a new option in the interview module … a separate
 * module for it"). The round itself is the builder's Resume Deep Dive
 * (lib/resume-interview): this is the page's one read and the setup it
 * starts from, kept out of routes/interviews.ts, which is long enough.
 *
 * One composed answer per page load — the member's resumes, each with what
 * the interviewer will read off it, and their resume rounds so far — rather
 * than the resume list and a filtered history as two requests.
 */
import { prisma } from "../lib/prisma.js";
import { ResumeContentSchema } from "../lib/resume-parse.js";
import { RESUME_ROUND, resumeBrief, resumeRole } from "../lib/resume-interview.js";

/** The page lists the newest resumes; twenty is every resume nearly anyone keeps. */
const RESUMES_SHOWN = 20;
/** The past rounds the page lists; the history page has the rest. */
const ROUNDS_SHOWN = 10;

export interface ResumeChoice {
  id: string;
  title: string;
  /** The role a round on it interviews for unless changed (resumeRole). */
  role: string;
  updatedAt: Date;
  latestScore: number | null;
  /** What the interviewer reads, counted — never the text itself. */
  reads: { roles: number; projects: number; skills: number; education: number };
  /** False when there is nothing to ask about yet (resumeBrief is null): the page sends them to fill it in. */
  ready: boolean;
}

export interface ResumeRound {
  id: string;
  status: string;
  mode: string;
  overallScore: number | null;
  createdAt: Date;
  role: string;
  resumeId: string | null;
  /** The resume's current title; null when it has since been deleted. */
  resumeTitle: string | null;
}

export async function resumeInterviewPage(userId: string): Promise<{ resumes: ResumeChoice[]; rounds: ResumeRound[] }> {
  // Independent reads, one round trip. The resumes' content is read to count
  // what the interviewer will see; it never leaves this function.
  const [rows, sessions] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: RESUMES_SHOWN,
      select: { id: true, title: true, targetRole: true, content: true, updatedAt: true, latestScore: true },
    }),
    prisma.mockInterviewSession.findMany({
      where: { userId, savedInterview: { roundId: RESUME_ROUND } },
      orderBy: { createdAt: "desc" },
      take: ROUNDS_SHOWN,
      select: {
        id: true,
        status: true,
        mode: true,
        overallScore: true,
        createdAt: true,
        savedInterview: { select: { roleId: true, resumeId: true } },
      },
    }),
  ]);

  const resumes = rows.map((r): ResumeChoice => {
    const parsed = ResumeContentSchema.safeParse(r.content);
    const c = parsed.success ? parsed.data : null;
    return {
      id: r.id,
      title: r.title,
      role: resumeRole(r),
      updatedAt: r.updatedAt,
      latestScore: r.latestScore,
      reads: {
        roles: c?.experience.length ?? 0,
        projects: c?.projects.length ?? 0,
        skills: c?.skills.reduce((n, g) => n + g.items.length, 0) ?? 0,
        education: c?.education.length ?? 0,
      },
      ready: resumeBrief(r.content) !== null,
    };
  });

  // A round on a resume beyond the newest twenty still names it.
  const titles = new Map(rows.map((r) => [r.id, r.title]));
  const missing = [...new Set(sessions.map((s) => s.savedInterview.resumeId).filter((id): id is string => !!id && !titles.has(id)))];
  if (missing.length) {
    const older = await prisma.resume.findMany({ where: { userId, id: { in: missing } }, select: { id: true, title: true } });
    for (const r of older) titles.set(r.id, r.title);
  }

  const rounds = sessions.map((s): ResumeRound => ({
    id: s.id,
    status: s.status,
    mode: s.mode,
    overallScore: s.overallScore,
    createdAt: s.createdAt,
    role: s.savedInterview.roleId,
    resumeId: s.savedInterview.resumeId,
    resumeTitle: s.savedInterview.resumeId ? (titles.get(s.savedInterview.resumeId) ?? null) : null,
  }));

  return { resumes, rounds };
}

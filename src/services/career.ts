import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { careerOf, type CareerFacts, type CareerSection } from "../lib/career.js";
import { percentOf } from "../lib/skill-tests.js";
import { getDashboard } from "./dashboard.js";
import { skillProfileFor } from "./skill-profile.js";
import { readinessFor } from "./readiness.js";

/**
 * The career section's facts (Phase 8 of ADAPTIVE_COACH.md, §15) — read from
 * rows that already exist, nothing stored but the owner's two switches
 * (User.careerShowSkills / careerShowReadiness). The rules, and what may
 * leave, are lib/career.ts.
 *
 * The skill profile and readiness are computed only when their switch is on,
 * so an account that shares neither pays for neither. Cached a minute per
 * account and switch pair; the switch write drops it.
 */

const careerKey = (userId: string) => `career:v1:${userId}`;

/** Graded sittings only — a terminated (disqualified) sitting is never a verified result. */
async function placementBests(userId: string): Promise<CareerFacts["placementTests"]> {
  const rows = await prisma.mockAttempt.findMany({
    where: { userId, status: { in: ["submitted", "expired"] }, score: { not: null }, maxScore: { gt: 0 } },
    orderBy: { startedAt: "desc" },
    take: 200,
    select: { score: true, maxScore: true, submittedAt: true, startedAt: true, test: { select: { slug: true, name: true, company: true } } },
  });
  const best = new Map<string, CareerFacts["placementTests"][number]>();
  for (const r of rows) {
    const percent = percentOf(r.score ?? 0, r.maxScore ?? 0);
    const prev = best.get(r.test.slug);
    if (!prev || percent > prev.percent) best.set(r.test.slug, { slug: r.test.slug, name: r.test.name, company: r.test.company, percent, at: r.submittedAt ?? r.startedAt });
  }
  return [...best.values()].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);
}

async function factsFor(userId: string, show: { skills: boolean; readiness: boolean }): Promise<CareerFacts> {
  const [dash, self, tests, tracks, github, profile, readiness] = await Promise.all([
    getDashboard(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { instituteName: true, location: true, website: true, linkedin: true, github: true } }),
    placementBests(userId),
    prisma.studyEnrollment.findMany({ where: { userId, completedAt: { not: null } }, select: { trackKey: true, completedAt: true } }),
    prisma.gitHubConnection.findUnique({ where: { userId }, select: { login: true } }),
    show.skills ? skillProfileFor(userId).catch(() => null) : Promise.resolve(null),
    show.readiness ? readinessFor(userId, {}).catch(() => null) : Promise.resolve(null),
  ]);
  const trackTitles = tracks.length
    ? new Map((await prisma.studyTrack.findMany({ where: { key: { in: tracks.map((t) => t.trackKey) } }, select: { key: true, title: true } })).map((t) => [t.key, t.title]))
    : new Map<string, string>();
  const stats = dash.me?.stats;
  const labelOf = new Map((profile?.view.skills ?? []).map((s) => [s.key, s]));
  return {
    solved: { problems: stats?.problemsSolved ?? 0, bugs: stats?.bugsFixed ?? 0, sql: stats?.sqlSolved ?? 0 },
    credentials: (dash.credentials ?? []).filter((c) => c.status === "valid").map((c) => ({ code: c.code, name: c.name, level: c.level, band: c.band, issuedAt: c.issuedAt })),
    placementTests: tests,
    studyTracks: tracks.map((t) => ({ key: t.trackKey, title: trackTitles.get(t.trackKey) ?? t.trackKey, completedAt: t.completedAt! })),
    roadmapTiers: (dash.roadmap ?? []).filter((r: { earnedAt: unknown }) => r.earnedAt).length,
    github: github ? { login: github.login } : null,
    self: { institute: self?.instituteName ?? null, location: self?.location ?? null, website: self?.website ?? null, linkedin: self?.linkedin ?? null, github: self?.github ?? null },
    skills: profile
      ? {
          domains: profile.view.domains.map((d) => ({ key: d.key, label: d.label, mastery: d.mastery, confidence: d.confidence, started: d.started, total: d.total })),
          strongest: profile.view.focus.strongest
            .map((k) => labelOf.get(k))
            .filter((s) => s != null)
            .map((s) => ({ key: s.key, label: s.label, mastery: s.mastery, confidence: s.confidence })),
        }
      : null,
    readiness: readiness?.readiness
      ? { company: readiness.readiness.company, score: readiness.readiness.overall.score, confidence: readiness.readiness.overall.confidence, status: readiness.readiness.overall.status }
      : null,
  };
}

/** The section as anyone sees it on /u/<username>, by the owner's switches. */
export function careerSectionFor(userId: string, show: { skills: boolean; readiness: boolean }): Promise<CareerSection> {
  return cached(`${careerKey(userId)}:${Number(show.skills)}${Number(show.readiness)}`, 60_000, async () => careerOf(await factsFor(userId, show), show));
}

export function forgetCareer(userId: string): void {
  for (const k of ["00", "01", "10", "11"]) invalidate(`${careerKey(userId)}:${k}`);
}

export interface CareerSettings {
  showSkills: boolean;
  showReadiness: boolean;
  /** The company readiness would be shown for — the saved target, or the onboarding guess. Null: nothing to show. */
  readinessCompany: string | null;
  /** Its status; "unknown" is never shown publicly (lib/career.ts), so the switch says why. */
  readinessStatus: string | null;
  /** What the public sees now, switches applied. */
  preview: CareerSection;
}

/** The owner's view: the switches, and the section exactly as the public gets it. */
export async function careerSettingsFor(userId: string): Promise<CareerSettings> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { careerShowSkills: true, careerShowReadiness: true } });
  const show = { skills: Boolean(user?.careerShowSkills), readiness: Boolean(user?.careerShowReadiness) };
  const [preview, readiness] = await Promise.all([careerSectionFor(userId, show), readinessFor(userId, {}).catch(() => null)]);
  return { showSkills: show.skills, showReadiness: show.readiness, readinessCompany: readiness?.readiness?.company ?? null, readinessStatus: readiness?.readiness?.overall.status ?? null, preview };
}

/** Flip one or both switches; answers the settings as they now stand. */
export async function setCareerSharing(userId: string, body: { showSkills?: unknown; showReadiness?: unknown }): Promise<CareerSettings | { error: string }> {
  const data: { careerShowSkills?: boolean; careerShowReadiness?: boolean } = {};
  if (body.showSkills !== undefined) {
    if (typeof body.showSkills !== "boolean") return { error: "showSkills must be true or false." };
    data.careerShowSkills = body.showSkills;
  }
  if (body.showReadiness !== undefined) {
    if (typeof body.showReadiness !== "boolean") return { error: "showReadiness must be true or false." };
    data.careerShowReadiness = body.showReadiness;
  }
  if (!Object.keys(data).length) return { error: "Nothing to change." };
  await prisma.user.update({ where: { id: userId }, data });
  forgetCareer(userId);
  return careerSettingsFor(userId);
}

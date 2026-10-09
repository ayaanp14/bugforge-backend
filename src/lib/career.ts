/**
 * The career section of a public profile (Phase 8 of ADAPTIVE_COACH.md, §15),
 * pure: what /u/<username> may say about someone as a candidate, and how
 * sure the site is of each thing. Three kinds, and every item names its kind:
 *
 *  - **Verified** — the site checked it itself: a credential (its code
 *    resolves at /verify), a proctored placement-test sitting graded on the
 *    server, solves the judge accepted, a study track or roadmap tier
 *    completed, a GitHub account proven by signing in to it.
 *  - **Assessed** — an estimate the site derives from that work: the skill
 *    profile's domain scores and the readiness estimate for one company.
 *    Each carries its confidence. Shown only when the owner switches it on
 *    (the owner's decision, 2026-10-09); off, the payload has no such key.
 *  - **Self-reported** — what the member typed: institute, location, links.
 *    A typed GitHub link is self-reported even when it looks like the linked
 *    account, because nothing checked it.
 *
 * An allow-list like services/public-profile.ts: every field is named, the
 * facts' own types are wider than what leaves. Pinned by career.test.ts.
 */

export type Proof = "verified" | "assessed" | "self-reported";

export interface CareerFacts {
  solved: { problems: number; bugs: number; sql: number };
  credentials: Array<{ code: string; name: string; level: string; band: string; issuedAt: string | Date }>;
  /** Graded, non-terminated sittings: the best per test. */
  placementTests: Array<{ slug: string; name: string; company: string; percent: number; at: Date }>;
  studyTracks: Array<{ key: string; title: string; completedAt: Date }>;
  roadmapTiers: number;
  github: { login: string } | null;
  self: { institute: string | null; location: string | null; website: string | null; linkedin: string | null; github: string | null };
  /** Present only when the owner shows it. */
  skills?: {
    domains: Array<{ key: string; label: string; mastery: number; confidence: number; started: number; total: number }>;
    strongest: Array<{ key: string; label: string; mastery: number; confidence: number }>;
  } | null;
  readiness?: { company: string; score: number; confidence: number; status: string } | null;
}

export interface CareerItem {
  proof: Proof;
  label: string;
  detail: string | null;
  href: string | null;
  at: string | null;
}

export interface CareerSection {
  verified: CareerItem[];
  /** Absent unless shown; an empty object never stands for "hidden". */
  assessed?: {
    skills?: { domains: Array<{ key: string; label: string; mastery: number; confidence: number }>; strongest: Array<{ key: string; label: string; mastery: number }> };
    readiness?: { company: string; score: number; confidence: number; status: string };
    note: string;
  };
  selfReported: CareerItem[];
}

const iso = (d: string | Date | null) => (d == null ? null : typeof d === "string" ? d : d.toISOString());
const pct = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
/** Confidence as the profile prints it: a share, two places. */
const conf = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;

/** Below this confidence a domain is too thinly measured to show anyone. */
export const SHOWN_CONFIDENCE = 0.2;

export function careerOf(f: CareerFacts, show: { skills: boolean; readiness: boolean }): CareerSection {
  const verified: CareerItem[] = [];
  for (const c of f.credentials) {
    verified.push({ proof: "verified", label: `${c.name} credential`, detail: c.band === "distinction" ? "Passed with distinction" : "Passed", href: `/verify/${c.code}`, at: iso(c.issuedAt) });
  }
  for (const t of f.placementTests) {
    verified.push({ proof: "verified", label: t.name, detail: `Best score ${pct(t.percent)}% in a proctored sitting`, href: `/tests/${t.slug}`, at: iso(t.at) });
  }
  const solves = [
    f.solved.problems ? `${f.solved.problems} coding ${f.solved.problems === 1 ? "problem" : "problems"}` : null,
    f.solved.bugs ? `${f.solved.bugs} bug ${f.solved.bugs === 1 ? "hunt" : "hunts"}` : null,
    f.solved.sql ? `${f.solved.sql} SQL ${f.solved.sql === 1 ? "problem" : "problems"}` : null,
  ].filter(Boolean);
  if (solves.length) verified.push({ proof: "verified", label: "Solved on CodeKairo", detail: `${solves.join(", ")}, each accepted by the judge's hidden tests`, href: null, at: null });
  for (const s of f.studyTracks) verified.push({ proof: "verified", label: `${s.title} study plan completed`, detail: "Every lesson, exercise and checkpoint", href: null, at: iso(s.completedAt) });
  if (f.roadmapTiers > 0) verified.push({ proof: "verified", label: "DSA roadmap", detail: `${f.roadmapTiers} ${f.roadmapTiers === 1 ? "tier" : "tiers"} cleared`, href: "/roadmap", at: null });
  if (f.github) verified.push({ proof: "verified", label: "GitHub account", detail: `@${f.github.login}, linked by signing in to it`, href: `https://github.com/${encodeURIComponent(f.github.login)}`, at: null });

  const selfReported: CareerItem[] = [];
  const self = f.self;
  if (self.institute) selfReported.push({ proof: "self-reported", label: "Institute", detail: self.institute, href: null, at: null });
  if (self.location) selfReported.push({ proof: "self-reported", label: "Location", detail: self.location, href: null, at: null });
  if (self.linkedin) selfReported.push({ proof: "self-reported", label: "LinkedIn", detail: self.linkedin, href: null, at: null });
  if (self.website) selfReported.push({ proof: "self-reported", label: "Website", detail: self.website, href: null, at: null });
  if (self.github && (!f.github || !self.github.toLowerCase().includes(f.github.login.toLowerCase()))) {
    selfReported.push({ proof: "self-reported", label: "GitHub (typed)", detail: self.github, href: null, at: null });
  }

  const out: CareerSection = { verified, selfReported };
  const skills =
    show.skills && f.skills
      ? {
          domains: f.skills.domains.filter((d) => d.started > 0 && d.confidence >= SHOWN_CONFIDENCE).map((d) => ({ key: d.key, label: d.label, mastery: pct(d.mastery), confidence: conf(d.confidence) })),
          strongest: f.skills.strongest.slice(0, 5).map((s) => ({ key: s.key, label: s.label, mastery: pct(s.mastery) })),
        }
      : null;
  // "Unknown" (too little evidence) is said to the owner on /readiness, never
  // to a stranger: a public "0%" would read as a verdict the site never made.
  const readiness = show.readiness && f.readiness && f.readiness.status !== "unknown" ? { company: f.readiness.company, score: pct(f.readiness.score), confidence: conf(f.readiness.confidence), status: f.readiness.status } : null;
  if ((skills && (skills.domains.length || skills.strongest.length)) || readiness) {
    out.assessed = {
      ...(skills && (skills.domains.length || skills.strongest.length) ? { skills } : {}),
      ...(readiness ? { readiness } : {}),
      note: "Estimates CodeKairo derives from this member's work on the site, each with how much evidence stands behind it. Shared by the member.",
    };
  }
  return out;
}

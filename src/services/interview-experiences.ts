import { prisma } from "../lib/prisma.js";
import { cachedShared, invalidatePrefix } from "../lib/cache.js";
import { EXPERIENCE_OUTCOMES, EXPERIENCE_TAG, canonicalCompany, experienceTitle, type Experience, type ExperienceOutcome } from "../lib/interview-experience.js";
import { slugify } from "../lib/slug.js";

/**
 * The interview experiences (community posts of type "experience",
 * lib/interview-experience.ts) as lists: by company for its page
 * (/challenges/company/<slug>), and all of them for /interview-experiences.
 * Public posts only, newest first, no viewer-specific fields — so every list
 * is one shared cache entry, dropped whenever a public post changes
 * (routes/community.ts forgetFeedsWith).
 */

const PREFIX = "experiences:v1:";
const TTL_SECONDS = 120;

export const forgetExperiences = (): void => invalidatePrefix(PREFIX);

export interface ExperienceProblem {
  slug: string;
  title: string;
}

export interface ExperienceRow {
  id: string;
  createdAt: string;
  title: string;
  author: { id: string; name: string | null; username: string | null; avatar_url: string | null };
  experience: Omit<Experience, "problems"> & { problems: ExperienceProblem[] };
  /** The closing notes, or the first round's detail, cut to a preview. */
  excerpt: string;
  likeCount: number;
  commentCount: number;
}

export interface CompanyCount {
  company: string;
  /** The filter value (the experience's company tag in the feed). */
  key: string;
  /** Its catalogue page, when the company is one the catalogue tags. */
  hubSlug: string | null;
  count: number;
}

const PREVIEW = 240;
const cut = (s: string) => (s.length > PREVIEW ? `${s.slice(0, PREVIEW).replace(/\s+\S*$/, "")}…` : s);

/** The stored meta.experience, defensively: rows written before a field existed read as empty. */
function experienceOf(meta: unknown): ExperienceRow["experience"] | null {
  const e = (meta as { experience?: Record<string, unknown> } | null)?.experience;
  if (!e || typeof e !== "object" || typeof e["company"] !== "string") return null;
  const rounds = Array.isArray(e["rounds"]) ? (e["rounds"] as Array<{ name?: unknown; detail?: unknown }>).map((r) => ({ name: String(r.name ?? ""), detail: String(r.detail ?? "") })) : [];
  const problems = Array.isArray(e["problems"])
    ? (e["problems"] as Array<{ slug?: unknown; title?: unknown }>).filter((p) => typeof p?.slug === "string").map((p) => ({ slug: String(p.slug), title: String(p.title ?? p.slug) }))
    : [];
  return {
    company: e["company"] as string,
    companyTag: typeof e["companyTag"] === "string" ? (e["companyTag"] as string) : null,
    companySlug: typeof e["companySlug"] === "string" ? (e["companySlug"] as string) : null,
    role: String(e["role"] ?? ""),
    year: Number(e["year"] ?? 0),
    channel: (e["channel"] as Experience["channel"]) ?? "other",
    outcome: (e["outcome"] as Experience["outcome"]) ?? "pending",
    difficulty: (e["difficulty"] as Experience["difficulty"]) ?? "medium",
    rounds,
    problems,
  };
}

/** The filter key for a company as typed or as a catalogue name: the tag every experience post carries for it. */
export const companyKey = (company: string): string => slugify(canonicalCompany(company) ?? company, 30);

export interface ExperienceQuery {
  /** A company key (companyKey), or omitted for all. */
  company?: string | null;
  outcome?: ExperienceOutcome | null;
  skip?: number;
  take?: number;
}

export async function experienceList(q: ExperienceQuery): Promise<{ rows: ExperienceRow[]; total: number }> {
  const company = q.company && /^[a-z0-9-]{2,30}$/.test(q.company) ? q.company : null;
  const outcome = q.outcome && EXPERIENCE_OUTCOMES.includes(q.outcome) ? q.outcome : null;
  const skip = Math.max(0, Math.min(500, Math.trunc(q.skip ?? 0)));
  const take = Math.max(1, Math.min(30, Math.trunc(q.take ?? 10)));
  return cachedShared(`${PREFIX}list:${company ?? "all"}:${outcome ?? "any"}:${skip}:${take}`, TTL_SECONDS, async () => {
    const where = {
      type: "experience",
      visibility: "public",
      ...(company ? { tags: { some: { tag: company } } } : {}),
      ...(outcome ? { meta: { path: "$.experience.outcome", equals: outcome } } : {}),
    };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          createdAt: true,
          content: true,
          meta: true,
          user: { select: { id: true, name: true, username: true, avatar_url: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    const rows: ExperienceRow[] = [];
    for (const p of posts) {
      const experience = experienceOf(p.meta);
      if (!experience) continue;
      rows.push({
        id: p.id,
        createdAt: p.createdAt.toISOString(),
        title: experienceTitle(experience),
        author: p.user,
        experience,
        excerpt: cut((p.content.trim() || experience.rounds[0]?.detail || "").replace(/\s+/g, " ")),
        likeCount: p._count.likes,
        commentCount: p._count.comments,
      });
    }
    return { rows, total };
  });
}

/** Every company with an experience, most experiences first — the index page's filter. */
export function experienceCompanies(): Promise<CompanyCount[]> {
  return cachedShared(`${PREFIX}companies`, TTL_SECONDS, async () => {
    // Small for a long while (one row per post); capped so it never becomes a scan of a large table.
    const posts = await prisma.post.findMany({ where: { type: "experience", visibility: "public" }, select: { meta: true }, orderBy: { createdAt: "desc" }, take: 5000 });
    const counts = new Map<string, CompanyCount>();
    for (const p of posts) {
      const e = experienceOf(p.meta);
      if (!e) continue;
      const key = companyKey(e.company);
      const row = counts.get(key) ?? { company: e.company, key, hubSlug: e.companySlug, count: 0 };
      row.count++;
      counts.set(key, row);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));
  });
}

/** Sitemap/edge use: whether a company has any experiences, and its latest few. */
export const experiencesForCompany = (key: string, take = 5) => experienceList({ company: key, take });

export { EXPERIENCE_TAG };

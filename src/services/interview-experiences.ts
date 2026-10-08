import { prisma } from "../lib/prisma.js";
import { cachedShared, invalidate, invalidatePrefix } from "../lib/cache.js";
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

export const forgetExperiences = (): void => {
  invalidatePrefix(PREFIX);
  // The sitemap too (services/seo.ts sitemapXml): a deleted or hidden
  // experience left in it for its hour is a sitemap URL answering 404.
  invalidate("seo:sitemap:v3:experiences");
};

export interface ExperienceProblem {
  slug: string;
  title: string;
}

export interface ExperienceRow {
  id: string;
  /** Its own page (experiencePath). */
  path: string;
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

/**
 * An experience's own page, indexable (since 2026-10-09; until then they
 * lived only at the noindex /community/p/:id):
 * /interview-experiences/<company key>/<role and year>-<post id>. The id is
 * the key — the words before it are for the reader and the result, and a
 * page asked for under other words is sent here with a 301
 * (services/seo.ts experienceHead), so an edit to nothing can move it.
 */
export function experiencePath(id: string, e: { company: string; role: string; year: number }): string {
  return `/interview-experiences/${companyKey(e.company)}/${slugify(`${e.role} ${e.year}`, 60)}-${id}`;
}

/** The post id at the end of an experience page's last segment, or null. Post ids are cuids: lower-case letters and digits, no hyphen. */
export function experienceIdOf(slug: string): string | null {
  const id = slug.slice(slug.lastIndexOf("-") + 1);
  return /^[a-z0-9]{20,40}$/.test(id) ? id : null;
}

/** An experience post's page, from its stored meta — null for a post that is not one. */
export function experiencePathOfPost(id: string, meta: unknown): string | null {
  const e = experienceOf(meta);
  return e ? experiencePath(id, e) : null;
}

export interface ExperiencePage extends ExperienceRow {
  /** The author's closing notes, whole. */
  notes: string;
  /** When the post was last written: its first edit, or its creation. */
  updatedAt: string;
  authorHidden: boolean;
}

/** One public experience by its post id, for its page's edge head. */
export function experienceById(id: string): Promise<ExperiencePage | null> {
  return cachedShared(`${PREFIX}one:${id}`, TTL_SECONDS, async () => {
    const p = await prisma.post.findFirst({
      where: { id, type: "experience", visibility: "public" },
      select: {
        id: true,
        createdAt: true,
        editedAt: true,
        content: true,
        meta: true,
        user: { select: { id: true, name: true, username: true, avatar_url: true, profileHidden: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const experience = p ? experienceOf(p.meta) : null;
    if (!p || !experience) return null;
    const { profileHidden, ...author } = p.user;
    return {
      id: p.id,
      path: experiencePath(p.id, experience),
      createdAt: p.createdAt.toISOString(),
      updatedAt: (p.editedAt ?? p.createdAt).toISOString(),
      title: experienceTitle(experience),
      author,
      authorHidden: profileHidden,
      experience,
      excerpt: cut((p.content.trim() || experience.rounds[0]?.detail || "").replace(/\s+/g, " ")),
      notes: p.content.trim(),
      likeCount: p._count.likes,
      commentCount: p._count.comments,
    };
  });
}

/** Every public experience's page, for the sitemap: the address and when it was last written. */
export async function experienceSitemapEntries(): Promise<Array<{ path: string; lastmod: Date }>> {
  const posts = await prisma.post.findMany({
    where: { type: "experience", visibility: "public" },
    select: { id: true, meta: true, createdAt: true, editedAt: true },
    orderBy: { createdAt: "asc" },
    take: 45_000,
  });
  return posts.flatMap((p) => {
    const path = experiencePathOfPost(p.id, p.meta);
    return path ? [{ path, lastmod: p.editedAt ?? p.createdAt }] : [];
  });
}

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
        path: experiencePath(p.id, experience),
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

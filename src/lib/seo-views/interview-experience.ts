import { honourDef } from "../honours.js";
import { SKILLS } from "../skill-catalog.js";

/**
 * The first screen of an interview experience's own page —
 * /interview-experiences/<company>/<role-year>-<id>, InterviewExperiencePage
 * as a visitor sees it — as data, for the static-first view the Worker draws
 * from it (frontend lib/seo/views/api/interview-experience.ts; the registry
 * and the reasons are in lib/seo-views/index.ts).
 *
 * What the page draws is the community post (PostCard with its comments
 * open): the author row — avatar, name, honour tag, rank word, chests, XP,
 * "· shared an interview experience", the time — then ExperienceBlock (role
 * at company, year / channel / outcome / difficulty / rounds, every round
 * whole, the problems asked), the closing notes, the tags the notes do not
 * name, the action row and the comment box. All of it comes from the post
 * experienceHead has already read (services/interview-experiences
 * experienceById, whose select gained the author's flair and the tags on
 * 2026-10-14 — the same columns the community's AUTHOR_SELECT reads): no
 * query of its own. The words the client would otherwise look up in tables
 * of its own (the rank word, the honour's name, the credential seal's
 * letters) are sent as words, so the view needs none of those tables.
 */
export interface InterviewExperienceView {
  kind: "interview-experience";
  company: string;
  /** The company's catalogue hub, when the catalogue tags it (the h3's link). */
  companySlug: string | null;
  role: string;
  year: number;
  /** As stored: on-campus | off-campus | referral | other. */
  channel: string;
  /** As stored: selected | rejected | pending | withdrew. */
  outcome: string;
  /** As stored (lower case). */
  difficulty: string;
  rounds: Array<{ name: string; detail: string }>;
  problems: Array<{ slug: string; title: string }>;
  /** The post's text (the closing notes), as written. */
  notes: string;
  /** The post's tags, in the community payload's order. */
  tags: string[];
  createdAt: string;
  edited: boolean;
  likeCount: number;
  commentCount: number;
  author: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    /** The owner hid their profile: the name is drawn without a link. */
    hidden: boolean;
    xp: number;
    /** The rank word (services/me getTierTitle over `rating`), as TierChip writes it. */
    tier: string;
    /** Roadmap chests opened, 0–4 (lib/road-flair on the client). */
    chests: number;
    /** The worn honour's name ("Founding Member"), or null. */
    honour: string | null;
    /** The worn skill credential's seal, or null; the view hides it once `expiresAt` has passed. */
    credential: { short: string; level: string; expiresAt: string } | null;
  };
}

export interface InterviewExperienceSource {
  createdAt: string;
  edited: boolean;
  notes: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  author: { name: string | null; username: string | null; avatar_url: string | null };
  authorHidden: boolean;
  authorFlair: { xp: number; chests: number; honours: string[]; credential: { skill: string; level: string; expiresAt: string } | null };
  experience: {
    company: string;
    companySlug: string | null;
    role: string;
    year: number;
    channel: string;
    outcome: string;
    difficulty: string;
    rounds: Array<{ name: string; detail: string }>;
    problems: Array<{ slug: string; title: string }>;
  };
}

/** The view from the page experienceHead has read and the author's rank word. */
export function interviewExperienceView(row: InterviewExperienceSource, tier: string): InterviewExperienceView {
  const e = row.experience;
  const f = row.authorFlair;
  const honour = f.honours.map((k) => honourDef(k)).find(Boolean) ?? null;
  const cred = f.credential;
  return {
    kind: "interview-experience",
    company: e.company,
    companySlug: e.companySlug,
    role: e.role,
    year: e.year,
    channel: e.channel,
    outcome: e.outcome,
    difficulty: e.difficulty,
    rounds: e.rounds.map((r) => ({ name: r.name, detail: r.detail })),
    problems: e.problems.map((p) => ({ slug: p.slug, title: p.title })),
    notes: row.notes,
    tags: row.tags,
    createdAt: row.createdAt,
    edited: row.edited,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    author: {
      name: row.author.name,
      username: row.author.username,
      avatarUrl: row.author.avatar_url,
      hidden: row.authorHidden,
      xp: f.xp,
      tier,
      chests: Math.min(4, f.chests),
      honour: honour?.name ?? null,
      credential: cred
        ? { short: SKILLS.find((s) => s.id === cred.skill)?.short ?? cred.skill.slice(0, 3).toUpperCase(), level: cred.level, expiresAt: cred.expiresAt }
        : null,
    },
  };
}

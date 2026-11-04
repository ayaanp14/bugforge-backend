import { COMPANY_RENAMED, COMPANY_TAGS } from "./companies.js";
import { slugify } from "./slug.js";

/**
 * An interview experience: a community post (Post.type "experience") that
 * tells how one hiring process went — the company, the role, each round and
 * what it asked, the outcome. GeeksforGeeks' biggest draw after its articles
 * (2026-10-05); here they are written by members, filed under the company
 * so its page (/challenges/company/<slug>) lists them, and shown in the
 * community feed and at /interview-experiences.
 *
 * The structured part travels in `meta.experience` and is normalised here,
 * once, from whatever the request held: the post route stores only what this
 * returns. The company is free text (students interview at hundreds of
 * companies the catalogue does not tag), and `companyTag` is set when it
 * names a catalogue company, which is what links it to that company's page.
 * Pure; pinned by interview-experience.test.ts.
 */

export const EXPERIENCE_CHANNELS = ["on-campus", "off-campus", "referral", "other"] as const;
export const EXPERIENCE_OUTCOMES = ["selected", "rejected", "pending", "withdrew"] as const;
export const EXPERIENCE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type ExperienceChannel = (typeof EXPERIENCE_CHANNELS)[number];
export type ExperienceOutcome = (typeof EXPERIENCE_OUTCOMES)[number];
export type ExperienceDifficulty = (typeof EXPERIENCE_DIFFICULTIES)[number];

export interface ExperienceRound {
  name: string;
  detail: string;
}

export interface Experience {
  company: string;
  /** The catalogue's spelling of the company (lib/companies COMPANY_TAGS), when it is one. */
  companyTag: string | null;
  /** Its page's slug (/challenges/company/<slug>), when it is one. */
  companySlug: string | null;
  role: string;
  year: number;
  channel: ExperienceChannel;
  outcome: ExperienceOutcome;
  difficulty: ExperienceDifficulty;
  rounds: ExperienceRound[];
  /** Catalogue problem slugs the rounds asked (checked against the catalogue by the route). */
  problems: string[];
}

export const EXPERIENCE_LIMITS = {
  company: 60,
  role: 80,
  roundName: 60,
  roundDetail: 1500,
  rounds: 8,
  problems: 6,
  /** Words across the rounds and the closing notes: an experience someone can prepare from. */
  minChars: 200,
} as const;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
/** Multi-line text: keep line breaks, collapse runs of blank lines, trim. */
const cleanBlock = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "";

const BY_LOWER = new Map<string, string>(COMPANY_TAGS.map((c) => [c.toLowerCase(), COMPANY_RENAMED[c] ?? c]));
/** Common spellings that are the same company. */
const ALIASES: Record<string, string> = {
  facebook: "Meta",
  "meta platforms": "Meta",
  "tata consultancy services": "TCS",
  "tcs nqt": "TCS",
  "goldman": "Goldman Sachs",
  "ms": "Morgan Stanley",
  "disney hotstar": "Hotstar",
  "disney+ hotstar": "Hotstar",
  "cred club": "CRED",
  "tech mahindra ltd": "Tech Mahindra",
  "hcl tech": "HCL",
  "hcltech": "HCL",
  "hcl technologies": "HCL",
  ltimindtree: "Mindtree",
  "lti mindtree": "Mindtree",
  "infosys ltd": "Infosys",
  "wipro ltd": "Wipro",
  "x": "Twitter",
};

/** The catalogue's name for a company typed by a person, or null when it is not one the catalogue tags. */
export function canonicalCompany(name: string): string | null {
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;
  const direct = BY_LOWER.get(key);
  if (direct) return direct;
  const alias = ALIASES[key];
  return alias && BY_LOWER.has(alias.toLowerCase()) ? BY_LOWER.get(alias.toLowerCase())! : null;
}

export type ExperienceParse = { ok: true; value: Experience } | { ok: false; error: string };

/** `raw` is meta.experience from the request; `notes` the post's text (tips, overall). */
export function parseExperience(raw: unknown, notes: string, nowYear: number): ExperienceParse {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Add the company, the role and the rounds." };
  const r = raw as Record<string, unknown>;
  const company = clean(r["company"], EXPERIENCE_LIMITS.company);
  if (company.length < 2) return { ok: false, error: "Which company was the interview with?" };
  const role = clean(r["role"], EXPERIENCE_LIMITS.role);
  if (role.length < 2) return { ok: false, error: "Which role did you interview for?" };
  const year = Number(r["year"]);
  if (!Number.isInteger(year) || year < 2015 || year > nowYear + 1) return { ok: false, error: `The year should be between 2015 and ${nowYear + 1}.` };
  const channel = EXPERIENCE_CHANNELS.includes(r["channel"] as ExperienceChannel) ? (r["channel"] as ExperienceChannel) : "other";
  const outcome = r["outcome"] as ExperienceOutcome;
  if (!EXPERIENCE_OUTCOMES.includes(outcome)) return { ok: false, error: "Say how it ended: selected, rejected, pending or withdrew." };
  const difficulty = r["difficulty"] as ExperienceDifficulty;
  if (!EXPERIENCE_DIFFICULTIES.includes(difficulty)) return { ok: false, error: "Rate the difficulty: easy, medium or hard." };
  const rawRounds = Array.isArray(r["rounds"]) ? r["rounds"] : [];
  const rounds: ExperienceRound[] = [];
  for (const item of rawRounds.slice(0, EXPERIENCE_LIMITS.rounds)) {
    if (!item || typeof item !== "object") continue;
    const name = clean((item as Record<string, unknown>)["name"], EXPERIENCE_LIMITS.roundName);
    const detail = cleanBlock((item as Record<string, unknown>)["detail"], EXPERIENCE_LIMITS.roundDetail);
    if (!name && !detail) continue;
    rounds.push({ name: name || `Round ${rounds.length + 1}`, detail });
  }
  if (!rounds.length) return { ok: false, error: "Describe at least one round." };
  if (rounds.some((x) => !x.detail)) return { ok: false, error: "Each round needs a line or two on what it asked." };
  const written = rounds.reduce((t, x) => t + x.detail.length, 0) + notes.trim().length;
  if (written < EXPERIENCE_LIMITS.minChars) {
    return { ok: false, error: `Tell a little more — at least ${EXPERIENCE_LIMITS.minChars} characters across the rounds and your notes, so someone can prepare from it.` };
  }
  const problems = Array.isArray(r["problems"])
    ? [...new Set(r["problems"].filter((s): s is string => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/.test(s)))].slice(0, EXPERIENCE_LIMITS.problems)
    : [];
  const companyTag = canonicalCompany(company);
  return {
    ok: true,
    value: {
      company: companyTag ?? company,
      companyTag,
      companySlug: companyTag ? slugify(companyTag) : null,
      role,
      year,
      channel,
      outcome,
      difficulty,
      rounds,
      problems,
    },
  };
}

/** The feed tag an experience carries for its company ("morgan-stanley"), and the one every experience carries. */
export const EXPERIENCE_TAG = "experience";
export const companyFeedTag = (company: string): string => slugify(company, 30);

/**
 * How a name reads on the page, title and result. Members type quickly, and
 * "intercontinental exchange full stack software engineer" is what the first
 * production experience's title and h1 said (2026-11-04): a result nobody
 * would pick. Only an all-lower-case entry is touched — "SDE Intern", "eBay"
 * and "NVIDIA" were written that way on purpose. Applied when read, never
 * stored, so the member's words stay as typed and a change to these lists
 * corrects every post. Case only, so a post's address (slugify) cannot move.
 */
const UPPER_WORDS = new Set(["sde", "sdet", "sse", "mts", "smts", "pmts", "qa", "qe", "hr", "it", "ai", "ml", "ui", "ux", "api", "aws", "gcp", "sql", "php", "etl", "bi", "vp", "cto", "ibm", "sap", "dxc", "ii", "iii", "iv"]);
const SPELLED: Record<string, string> = { ".net": ".NET", ios: "iOS", devops: "DevOps", javascript: "JavaScript", typescript: "TypeScript", github: "GitHub", linkedin: "LinkedIn", paypal: "PayPal" };
const SMALL_WORDS = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "the", "to"]);
const isAllLower = (s: string) => s === s.toLowerCase() && s !== s.toUpperCase();
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const tidyWord = (word: string, first: boolean): string => {
  const spelled = SPELLED[word];
  if (spelled) return spelled;
  // "sde2", "sse1", and a level like "e4" or "l5".
  if (UPPER_WORDS.has(word) || /^(sde|sse|mts)\d$/.test(word) || /^[a-z]\d$/.test(word)) return word.toUpperCase();
  return !first && SMALL_WORDS.has(word) ? word : upperFirst(word);
};

/** A company or role as it reads: "full stack software engineer" → "Full Stack Software Engineer", "sde-1 at ibm" → "SDE-1 at IBM". */
export function tidyName(name: string): string {
  if (!isAllLower(name)) return name;
  let first = true;
  return name
    .split(/([\s\-/(),]+)/)
    .map((part, i) => {
      if (i % 2 === 1 || !part) return part;
      const word = tidyWord(part, first);
      first = false;
      return word;
    })
    .join("");
}

/** A round's name as it reads: a sentence, so only its first letter ("online assessment" → "Online assessment"). */
export const tidyRoundName = (name: string): string => (isAllLower(name) ? upperFirst(name) : name);

/**
 * A stored post's meta with its experience's names as they read — for the
 * community payload, which sends meta as stored and is what the page and
 * its head draw from. Anything that is not an experience comes back as is.
 */
export function readableExperienceMeta(meta: unknown): unknown {
  const e = (meta as { experience?: Record<string, unknown> } | null)?.experience;
  if (!e || typeof e !== "object" || typeof e["company"] !== "string") return meta;
  return {
    ...(meta as object),
    experience: {
      ...e,
      company: tidyName(e["company"]),
      role: typeof e["role"] === "string" ? tidyName(e["role"]) : e["role"],
      rounds: Array.isArray(e["rounds"]) ? (e["rounds"] as Array<Record<string, unknown>>).map((r) => ({ ...r, name: typeof r?.["name"] === "string" ? tidyRoundName(r["name"]) : r?.["name"] })) : e["rounds"],
    },
  };
}

/**
 * The page's meta description before it is cut: what the result is about in
 * the words it is searched by, then the rounds, then the outcome and an
 * excerpt where they fit. It used to open "Selected · 4 rounds:", which named
 * neither the company nor the role. Mirrored word for word by the SPA's
 * INTERVIEW_EXPERIENCE_COPY.description, or the head changes when React mounts.
 */
export function experienceDescription(e: Pick<Experience, "company" | "role"> & { rounds: Array<{ name: string }> }, outcomeWord: string, excerpt: string): string {
  const count = `${e.rounds.length} round${e.rounds.length === 1 ? "" : "s"}`;
  return `${e.company} ${e.role} interview: ${count} (${e.rounds.map((r) => r.name).join(", ")}). ${outcomeWord}. ${excerpt}`.trim();
}

/**
 * The whole account as plain text, for the post's structured data: the text
 * an answer engine or Google's forum reading can take as the post itself,
 * not just its summary. Only what the member wrote. Mirrored by the SPA's
 * INTERVIEW_EXPERIENCE_COPY.body.
 */
export function experienceBody(e: { rounds: Array<{ name: string; detail: string }> }, notes: string): string {
  return [...e.rounds.map((r, i) => `Round ${i + 1}: ${r.name}\n${r.detail}`), notes].filter(Boolean).join("\n\n");
}

/** A one-line title for lists, previews and the edge: "Software Engineer at Morgan Stanley (2026, on campus)". */
export function experienceTitle(e: Pick<Experience, "company" | "role" | "year" | "channel">): string {
  const channel = e.channel === "on-campus" ? "on campus" : e.channel === "off-campus" ? "off campus" : e.channel === "referral" ? "referral" : null;
  return `${e.role} at ${e.company} (${e.year}${channel ? `, ${channel}` : ""})`;
}

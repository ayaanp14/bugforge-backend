import { DOMAIN_TERMS, SOFT_SKILLS, compiledSkills, roleProfileFor, skillByName, termPattern, type CompiledSkill } from "./resume-taxonomy.js";

/**
 * What a job asks for, read from its description — or, without one, from
 * the role's profile.
 *
 * A job description is parsed line by line. Section titles inside it
 * ("Requirements", "Nice to have", "What you'll do") set a context, and
 * cue words on a line ("must", "preferred", "a plus") override it, so a
 * skill named under "Preferred qualifications" is preferred and one named
 * as "must have hands-on Kafka" is required even inside a responsibilities
 * list. Skills are the taxonomy's; anything else the recruiter would search
 * for — acronyms, product names, title-cased phrases — becomes a keyword
 * with a lower weight.
 *
 * Deterministic on purpose: the requirements are what the score is
 * explained against, and they must not change between two runs on the same
 * text.
 */

export interface JobRequirements {
  source: "jd" | "role" | "none";
  role: string;
  company: string;
  /** Taxonomy skill names. */
  requiredSkills: string[];
  preferredSkills: string[];
  softSkills: string[];
  domainTerms: string[];
  /** Phrases beyond the taxonomy, with the weight they carry in keyword match. */
  keywords: Array<{ term: string; weight: number; required: boolean }>;
  yearsRequired: number | null;
  yearsMax: number | null;
  education: string[];
  certifications: string[];
  responsibilities: string[];
}

export const MAX_JD_CHARS = 12_000;

type Context = "required" | "preferred" | "responsibilities" | "about";

const SECTION_CUES: Array<[RegExp, Context]> = [
  [/^(?:minimum|basic|required|key|essential|mandatory)?\s*(?:qualifications|requirements|skills|must[- ]haves?|what (?:we|you)(?:'re| are)? looking for|who you are|what you(?:'ll)? (?:need|bring)|you have|your profile|experience required|technical skills|skills? (?:required|needed))\s*:?$/i, "required"],
  [/^(?:preferred|desired|nice[- ]to[- ]haves?|bonus|good[- ]to[- ]have|additional|plus(?:es)?|desirable|ideal(?:ly)?|extra credit|it would be great if|great to have)\b.*:?$/i, "preferred"],
  [/^(?:responsibilities|key responsibilities|what you(?:'ll| will) (?:do|be doing|own|work on)|the role|role overview|your role|duties|in this role|day[- ]to[- ]day|about the role|job description|what you will do)\s*:?$/i, "responsibilities"],
  [/^(?:about (?:us|the company|the team)|who we are|benefits|perks|what we offer|compensation|equal opportunity|our culture|why join)\b.*$/i, "about"],
];

const PREFERRED_CUES = /\b(?:nice to have|nice-to-have|preferred|a plus|is a plus|are a plus|plus:|bonus|good to have|good-to-have|familiarity with|exposure to|ideally|would be (?:great|nice|a plus)|desirable|not required|optional|advantage(?:ous)?|preferably)\b/i;
const REQUIRED_CUES = /\b(?:required|must|should|strong|proficien(?:t|cy)|expert(?:ise)?|hands[- ]on|solid|deep|minimum|essential|need(?:s|ed)?|mandatory|extensive|demonstrated|proven|thorough)\b/i;

const STOPWORDS = new Set(
  "a an the and or of to in on for with at by from as is are be been being was were will would should could can may might must this that these those it its we you your our their they them he she his her i my me us about above across after against along among around before behind below beneath beside between beyond but down during except into like near off over past since through throughout till toward under until up upon within without while where when what which who whom whose why how all any both each few more most other some such no nor not only own same so than too very just also then there here out if because although though unless whether while per via etc including include includes ability able experience experienced years year strong good great excellent solid knowledge understanding skills skill team teams work working role job candidate candidates company opportunity opportunities environment fast-paced looking plus preferred required requirements responsibilities qualifications degree bachelor master related field equivalent new develop developing development build building design designing designs maintain maintaining support supporting ensure ensuring collaborate collaborating collaborative deliver delivering high quality best practices etc".split(/\s+/),
);

/** Specific services of a platform: listed beside it, they are detail, not extra requirements. */
const PART_OF: Record<string, string> = { EC2: "AWS", S3: "AWS", Lambda: "AWS", DynamoDB: "AWS", Redshift: "AWS", BigQuery: "Google Cloud" };
/** A specific skill that already says the broad one. */
const IMPLIES: Record<string, string> = { "Spring Boot": "Spring", "Deep Learning": "Machine Learning", "Next.js": "React", "React Native": "React", NestJS: "Node.js", Express: "Node.js", "Jetpack Compose": "Android", SwiftUI: "iOS", PySpark: "Spark" };

interface Line {
  text: string;
  context: Context;
  preferred: boolean;
}

/** Normalises whitespace and bullets and tags each line with its context. */
function linesOf(jd: string): Line[] {
  const out: Line[] = [];
  let context: Context = "required";
  for (const raw of jd.replace(/\r\n?/g, "\n").split("\n")) {
    const text = raw.replace(/^[\s•·\-–—*>▪●○◦]+/, "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const heading = text.replace(/:$/, "").trim();
    const cue = heading.length <= 60 ? SECTION_CUES.find(([re]) => re.test(heading)) : undefined;
    if (cue) {
      context = cue[1];
      continue;
    }
    const preferred = PREFERRED_CUES.test(text) && !REQUIRED_CUES.test(text.replace(PREFERRED_CUES, ""));
    out.push({ text, context, preferred: preferred || (context === "preferred" && !REQUIRED_CUES.test(text)) });
  }
  return out;
}

function skillsInLine(text: string, skills: CompiledSkill[]): CompiledSkill[] {
  return skills.filter((s) =>
    s.patterns.some((p) => {
      p.lastIndex = 0;
      return p.test(text);
    }),
  );
}

/** "3+ years", "2-4 years", "at least five years", "minimum of 3 yrs". */
function yearsIn(jd: string): { min: number | null; max: number | null } {
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const re = /(?:(?:minimum|min\.?|at least|over|more than)\s+(?:of\s+)?)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*(\d{1,2}))?\s*\+?\s*(?:years?|yrs?)\b(?![^.]{0,40}\b(?:old|of age)\b)/gi;
  let min: number | null = null;
  let max: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(jd))) {
    const a = words[m[1].toLowerCase()] ?? Number(m[1]);
    const b = m[2] ? Number(m[2]) : null;
    if (!Number.isFinite(a) || a > 30) continue;
    // Only spans that talk about experience count, not "over the last 3 years".
    const window = jd.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
    if (!/\bexperience\b|\bworking\b|\bin\b/i.test(window)) continue;
    if (min === null || a < min) min = a;
    if (b !== null && (max === null || b > max)) max = b;
  }
  return { min, max };
}

const EDUCATION_RE = /\b(?:bachelor(?:'s|s)?|master(?:'s|s)?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|b\.?\s?s\.?c?|m\.?\s?s\.?c?|ph\.?\s?d|mba|bca|mca|b\.?\s?com|m\.?\s?com|graduate|undergraduate|postgraduate|diploma)\b[^.;\n]{0,80}/gi;
const CERT_RE = /\b(?:[A-Z][\w+.#-]*(?:\s+[A-Z][\w+.#-]*){0,3}\s+[Cc]ertif(?:ied|ication|icate)s?\b[^.;\n,]{0,40}|[Cc]ertif(?:ied|ication|icate)s?\s+(?:in|as|for)\s+[^.;\n,]{3,50}|(?:PMP|CISSP|CCNA|CCNP|CEH|CKA|CKAD|OSCP|CompTIA\s+\w+|ITIL|CSM|PSM|Six Sigma|CFA|CPA|FRM|SAFe)\b)/g;

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const key = x.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Phrases a keyword search would look for that the taxonomy does not know:
 * acronyms (SDLC, CRM), tokens with digits or dots (HTTP/2, ES2020), and
 * title-cased runs that are not at the start of a sentence. Ranked by how
 * often the description repeats them.
 */
function extraKeywords(lines: Line[], known: Set<string>): Array<{ term: string; weight: number; required: boolean }> {
  const counts = new Map<string, { n: number; required: boolean; display: string }>();
  const add = (term: string, required: boolean) => {
    const display = term.trim();
    const key = display.toLowerCase();
    if (key.length < 2 || STOPWORDS.has(key) || known.has(key)) return;
    if (/^\d+$/.test(key)) return;
    const row = counts.get(key);
    if (row) {
      row.n += 1;
      row.required = row.required || required;
    } else counts.set(key, { n: 1, required, display });
  };
  for (const line of lines) {
    if (line.context === "about") continue;
    const required = !line.preferred;
    for (const m of line.text.matchAll(/\b[A-Z]{2,6}(?:\/[A-Z]{1,4})?\b/g)) add(m[0], required);
    for (const m of line.text.matchAll(/\b[A-Za-z]+(?:\.[A-Za-z]+|\d+)[A-Za-z0-9.]*\b/g)) if (/\d|\./.test(m[0]) && !/^\d/.test(m[0])) add(m[0], required);
    // Title-cased pairs and triples not at the start of the line.
    for (const m of line.text.matchAll(/(?<=[a-z,;:]\s+(?:\w+\s+)?)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g)) add(m[1], required);
  }
  return [...counts.entries()]
    .filter(([, v]) => v.n >= 1)
    .sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))
    .slice(0, 25)
    .map(([, v]) => ({ term: v.display, weight: 1, required: v.required }));
}

/** Requirements read from a job description. */
export function parseJobDescription(jd: string, role: string, company: string): JobRequirements {
  const text = jd.slice(0, MAX_JD_CHARS);
  const lines = linesOf(text);
  const skills = compiledSkills();
  const required = new Set<string>();
  const preferred = new Set<string>();
  const responsibilities: string[] = [];
  for (const line of lines) {
    if (line.context === "about") continue;
    for (const s of skillsInLine(line.text, skills)) {
      if (line.preferred) preferred.add(s.name);
      else required.add(s.name);
    }
    if (line.context === "responsibilities" && line.text.length > 20 && responsibilities.length < 12) responsibilities.push(line.text.slice(0, 220));
  }
  // A skill named as required anywhere is required.
  for (const s of required) preferred.delete(s);
  // A named part of a broader skill ("AWS (EC2, S3, Lambda)") is preferred,
  // not a separate requirement — a resume that says AWS has not missed
  // three things. And the broad name implied by a specific one ("Spring"
  // by "Spring Boot") is dropped rather than counted twice.
  for (const [child, parent] of Object.entries(PART_OF)) {
    if (required.has(child) && required.has(parent)) {
      required.delete(child);
      preferred.add(child);
    }
  }
  for (const [specific, broad] of Object.entries(IMPLIES)) {
    if ((required.has(specific) || preferred.has(specific)) && (required.has(broad) || preferred.has(broad))) {
      required.delete(broad);
      preferred.delete(broad);
    }
  }

  const lower = text.toLowerCase();
  const softSkills = SOFT_SKILLS.filter((s) => termPattern(s).test(lower));
  const domainTerms = DOMAIN_TERMS.filter((s) => termPattern(s).test(text));
  const years = yearsIn(text);
  const education = unique((text.match(EDUCATION_RE) ?? []).map((m) => m.replace(/\s+/g, " ").trim()).filter((m) => m.length > 4)).slice(0, 4);
  const certifications = unique((text.match(CERT_RE) ?? []).map((m) => m.replace(/\s+/g, " ").trim())).slice(0, 6);

  const known = new Set<string>();
  for (const s of skills) {
    known.add(s.name.toLowerCase());
    for (const a of s.aliases ?? []) known.add(a.toLowerCase());
  }
  for (const s of softSkills) known.add(s.toLowerCase());
  for (const s of domainTerms) known.add(s.toLowerCase());
  const keywords = extraKeywords(lines, known);

  return {
    source: "jd",
    role: role.trim(),
    company: company.trim(),
    requiredSkills: [...required],
    preferredSkills: [...preferred],
    softSkills,
    domainTerms,
    keywords,
    yearsRequired: years.min,
    yearsMax: years.max,
    education,
    certifications,
    responsibilities,
  };
}

/** Requirements from the role's profile, when there is no description to read. */
export function requirementsForRole(role: string, company: string): JobRequirements {
  const profile = roleProfileFor(role);
  if (!profile) {
    return { source: "none", role: "", company: company.trim(), requiredSkills: [], preferredSkills: [], softSkills: [], domainTerms: [], keywords: [], yearsRequired: null, yearsMax: null, education: [], certifications: [], responsibilities: [] };
  }
  const named = (list: string[]) => list.map((n) => skillByName(n)?.name ?? n);
  const seniority = /\b(senior|sr\.?|lead|staff|principal)\b/i.test(role) ? 4 : /\b(intern|trainee|fresher|graduate|junior|jr\.?|entry)\b/i.test(role) ? 0 : null;
  return {
    source: "role",
    role: role.trim(),
    company: company.trim(),
    requiredSkills: named(profile.required),
    preferredSkills: named(profile.preferred),
    softSkills: ["communication", "problem solving", "collaboration"],
    domainTerms: [],
    keywords: profile.keywords.map((term) => ({ term, weight: 1, required: false })),
    yearsRequired: seniority,
    yearsMax: null,
    education: [],
    certifications: [],
    responsibilities: [],
  };
}

/** The requirements for a target: the description when there is one, the role's profile otherwise. */
export function requirementsFor(role: string | null | undefined, company: string | null | undefined, jd: string | null | undefined): JobRequirements {
  const roleText = (role ?? "").trim();
  const companyText = (company ?? "").trim();
  const jdText = (jd ?? "").trim();
  if (jdText.length >= 80) {
    const parsed = parseJobDescription(jdText, roleText, companyText);
    // A description that named almost nothing the taxonomy knows still
    // gets the role's baseline, so the skills score is not decided by three words.
    if (parsed.requiredSkills.length + parsed.preferredSkills.length < 3 && roleText) {
      const base = requirementsForRole(roleText, companyText);
      parsed.preferredSkills = unique([...parsed.preferredSkills, ...base.requiredSkills, ...base.preferredSkills].filter((s) => !parsed.requiredSkills.includes(s)));
    }
    return parsed;
  }
  return requirementsForRole(roleText, companyText);
}

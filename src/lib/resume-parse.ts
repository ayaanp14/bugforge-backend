import { randomBytes } from "node:crypto";
import { z } from "zod";
import { SECTION_HEADINGS, type SectionKey } from "./resume-taxonomy.js";

/**
 * The editable shape of a resume, and the parser that gets a resume's text
 * into it.
 *
 * `ResumeContent` is what the editor edits, the scorer scores, the model
 * reads and the exporters render — one shape for all of them, validated by
 * `ResumeContentSchema` at every boundary (an upload's parse, a PUT from the
 * editor, a restructure from the model). Every list item carries a short
 * `id` so the editor can key and reorder rows and a suggestion can address
 * a bullet by path without an index shifting under it.
 *
 * The parser is heuristic and deterministic: headings are recognised from
 * the taxonomy's synonym table, experience and education entries are
 * anchored on date ranges, bullets on the folded "• " marker. It is the
 * first pass — good enough to edit immediately after an upload — and the
 * analysis job may replace it with the model's structuring of the same text
 * (lib/resume-ai.ts), which is checked against the text before it is
 * trusted.
 */

/* ── the shape ─────────────────────────────────────────────────────────── */

const short = (max: number) => z.string().max(max);
const line = short(300);
const para = short(3000);
const bullets = z.array(short(800)).max(40);

export const ResumeContentSchema = z.object({
  basics: z.object({
    name: line,
    title: line,
    email: line,
    phone: line,
    location: line,
    links: z.array(line).max(10),
  }),
  summary: para,
  experience: z
    .array(
      z.object({
        id: short(24),
        company: line,
        position: line,
        location: line,
        startDate: short(40),
        endDate: short(40),
        current: z.boolean(),
        bullets,
      }),
    )
    .max(30),
  education: z
    .array(
      z.object({
        id: short(24),
        institution: line,
        degree: line,
        field: line,
        startDate: short(40),
        endDate: short(40),
        grade: short(60),
        details: bullets,
      }),
    )
    .max(15),
  skills: z.array(z.object({ id: short(24), category: line, items: z.array(short(80)).max(80) })).max(20),
  projects: z
    .array(
      z.object({
        id: short(24),
        name: line,
        link: short(400),
        technologies: z.array(short(80)).max(40),
        startDate: short(40),
        endDate: short(40),
        bullets,
      }),
    )
    .max(30),
  certifications: z.array(z.object({ id: short(24), name: line, issuer: line, date: short(40) })).max(30),
  achievements: bullets,
  customSections: z.array(z.object({ id: short(24), title: line, bullets })).max(15),
  /** Section keys in display order: the fixed ones plus "custom:<id>". */
  sectionOrder: z.array(short(40)).max(30),
});

export type ResumeContent = z.infer<typeof ResumeContentSchema>;
export type ExperienceEntry = ResumeContent["experience"][number];
export type EducationEntry = ResumeContent["education"][number];
export type ProjectEntry = ResumeContent["projects"][number];

export const FIXED_SECTIONS = ["summary", "experience", "education", "skills", "projects", "certifications", "achievements"] as const;

export function newId(): string {
  return randomBytes(6).toString("base64url");
}

export function emptyContent(): ResumeContent {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    customSections: [],
    sectionOrder: [...FIXED_SECTIONS],
  };
}

/**
 * Every id filled and every section listed once in the order. Ids the
 * client left blank (a row it just added) are minted here; unknown keys in
 * the order are dropped and missing ones appended, so the order can never
 * hide a section.
 */
export function normalizeContent(content: ResumeContent): ResumeContent {
  const withIds = <T extends { id: string }>(rows: T[]) => rows.map((r) => ({ ...r, id: r.id?.trim() || newId() }));
  const customs = withIds(content.customSections);
  const valid = new Set<string>([...FIXED_SECTIONS, ...customs.map((c) => `custom:${c.id}`)]);
  const seen = new Set<string>();
  const order = content.sectionOrder.filter((k) => valid.has(k) && !seen.has(k) && seen.add(k));
  for (const key of valid) if (!seen.has(key)) order.push(key);
  return {
    ...content,
    experience: withIds(content.experience),
    education: withIds(content.education),
    skills: withIds(content.skills),
    projects: withIds(content.projects),
    certifications: withIds(content.certifications),
    customSections: customs,
    sectionOrder: order,
  };
}

/* ── bullets, addressed ────────────────────────────────────────────────── */

export interface AddressedBullet {
  /** "experience.<index>.bullets.<index>" and the like — the suggestion path. */
  path: string;
  section: "experience" | "projects" | "education" | "achievements" | "custom";
  /** "Software Engineer, Acme" — where the bullet lives, for the model and the UI. */
  context: string;
  text: string;
}

/** Every bullet in the resume with its address. */
export function bulletsOf(content: ResumeContent): AddressedBullet[] {
  const out: AddressedBullet[] = [];
  content.experience.forEach((e, i) =>
    e.bullets.forEach((text, j) => out.push({ path: `experience.${i}.bullets.${j}`, section: "experience", context: [e.position, e.company].filter(Boolean).join(", "), text })),
  );
  content.projects.forEach((p, i) => p.bullets.forEach((text, j) => out.push({ path: `projects.${i}.bullets.${j}`, section: "projects", context: p.name, text })));
  content.education.forEach((e, i) => e.details.forEach((text, j) => out.push({ path: `education.${i}.details.${j}`, section: "education", context: e.institution, text })));
  content.achievements.forEach((text, j) => out.push({ path: `achievements.${j}`, section: "achievements", context: "Achievements", text }));
  content.customSections.forEach((c, i) => c.bullets.forEach((text, j) => out.push({ path: `customSections.${i}.bullets.${j}`, section: "custom", context: c.title, text })));
  return out;
}

/** The text at a path, or null when the path does not address a string. */
export function readPath(content: ResumeContent, path: string): string | null {
  if (path === "summary") return content.summary;
  const m = path.match(/^(experience|projects|education|achievements|customSections)\.(\d+)(?:\.(bullets|details)\.(\d+))?$/);
  if (!m) return null;
  const [, section, i, list, j] = m;
  if (section === "achievements") return content.achievements[Number(i)] ?? null;
  const row = (content as unknown as Record<string, Array<Record<string, unknown>>>)[section]?.[Number(i)];
  if (!row || !list) return null;
  const items = row[list];
  return Array.isArray(items) ? ((items[Number(j)] as string) ?? null) : null;
}

/* ── text rendering (for the scorer and the model) ─────────────────────── */

const SECTION_TITLES: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
};

function dateSpan(start: string, end: string, current = false): string {
  const to = current ? "Present" : end;
  if (start && to) return `${start} – ${to}`;
  return start || to;
}

/** The resume as plain text, in its section order, the way an ATS would read the export. */
export function contentToText(content: ResumeContent): string {
  const parts: string[] = [];
  const b = content.basics;
  parts.push([b.name, b.title].filter(Boolean).join("\n"));
  parts.push([b.email, b.phone, b.location, ...b.links].filter(Boolean).join(" | "));
  for (const key of content.sectionOrder) {
    if (key === "summary" && content.summary.trim()) parts.push(`${SECTION_TITLES.summary}\n${content.summary.trim()}`);
    else if (key === "experience" && content.experience.length) {
      parts.push(
        `${SECTION_TITLES.experience}\n` +
          content.experience
            .map((e) => [[e.position, e.company].filter(Boolean).join(" — "), [e.location, dateSpan(e.startDate, e.endDate, e.current)].filter(Boolean).join(" | "), ...e.bullets.map((x) => `• ${x}`)].filter(Boolean).join("\n"))
            .join("\n\n"),
      );
    } else if (key === "education" && content.education.length) {
      parts.push(
        `${SECTION_TITLES.education}\n` +
          content.education
            .map((e) => [[e.degree, e.field].filter(Boolean).join(" in "), e.institution, [dateSpan(e.startDate, e.endDate), e.grade].filter(Boolean).join(" | "), ...e.details.map((x) => `• ${x}`)].filter(Boolean).join("\n"))
            .join("\n\n"),
      );
    } else if (key === "skills" && content.skills.length) {
      parts.push(`${SECTION_TITLES.skills}\n` + content.skills.map((g) => (g.category ? `${g.category}: ` : "") + g.items.join(", ")).join("\n"));
    } else if (key === "projects" && content.projects.length) {
      parts.push(
        `${SECTION_TITLES.projects}\n` +
          content.projects
            .map((p) => [[p.name, p.technologies.join(", ")].filter(Boolean).join(" | "), [p.link, dateSpan(p.startDate, p.endDate)].filter(Boolean).join(" | "), ...p.bullets.map((x) => `• ${x}`)].filter(Boolean).join("\n"))
            .join("\n\n"),
      );
    } else if (key === "certifications" && content.certifications.length) {
      parts.push(`${SECTION_TITLES.certifications}\n` + content.certifications.map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(" — ")).join("\n"));
    } else if (key === "achievements" && content.achievements.length) {
      parts.push(`${SECTION_TITLES.achievements}\n` + content.achievements.map((x) => `• ${x}`).join("\n"));
    } else if (key.startsWith("custom:")) {
      const c = content.customSections.find((s) => `custom:${s.id}` === key);
      if (c && c.bullets.length) parts.push(`${c.title}\n` + c.bullets.map((x) => `• ${x}`).join("\n"));
    }
  }
  return parts.filter(Boolean).join("\n\n");
}

/* ── the heuristic parser ──────────────────────────────────────────────── */

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
const YEAR = "(?:19|20)\\d{2}";
const SINGLE_DATE = `(?:${MONTH}\\s*,?\\s*'?(?:${YEAR}|\\d{2})|\\d{1,2}[/.-]${YEAR}|${YEAR})`;
const PRESENT = "(?:Present|Current|Currently|Now|Till\\s+date|Till\\s+now|Ongoing|Today)";
const RANGE_SEP = "\\s*(?:–|—|-|to|until|till)\\s*";
/** A range ("Jun 2022 – Present", "2019-2023", "05/2021 to 08/2021") or a lone date. */
export const DATE_RANGE = new RegExp(`(${SINGLE_DATE})${RANGE_SEP}(${SINGLE_DATE}|${PRESENT})`, "i");
export const ANY_DATE = new RegExp(`${SINGLE_DATE}(?:${RANGE_SEP}(?:${SINGLE_DATE}|${PRESENT}))?`, "i");
const PRESENT_RE = new RegExp(`\\b${PRESENT}\\b`, "i");

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)\d{3,5}(?:[\s-]?\d{3,5})?/;
/** A phone match must carry a phone's worth of digits — a pair of years does not. */
function findPhone(text: string): string {
  const re = new RegExp(PHONE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const digits = m[0].replace(/\D/g, "").length;
    if (digits >= 10 && digits <= 13) return m[0].trim();
  }
  return "";
}
const URL = /(?:https?:\/\/|www\.)[^\s|,;)]+|(?:linkedin\.com|github\.com|gitlab\.com|leetcode\.com|behance\.net|dribbble\.com|medium\.com|hackerrank\.com|codeforces\.com|kaggle\.com)\/[^\s|,;)]+/gi;

const TITLE_WORDS = /\b(engineer|developer|intern|manager|analyst|architect|consultant|designer|scientist|lead|head|director|specialist|administrator|associate|executive|officer|founder|co-founder|cofounder|trainee|fellow|researcher|assistant|professor|teacher|tutor|freelancer|sde|swe|qa|devops|sre|cto|ceo|vp)\b/i;
const COMPANY_WORDS = /\b(inc|ltd|llc|llp|pvt|private|limited|corp|corporation|technologies|technology|tech|labs|solutions|systems|software|services|group|bank|university|college|institute|consulting|studio|studios|networks|digital|global|international|industries|enterprises|foundation|ventures|capital|company|co\.)\b/i;
const INSTITUTION_WORDS = /\b(university|college|institute|school|academy|iit|nit|iiit|bits|vit|polytechnic|faculty)\b/i;
const DEGREE_WORDS = /\b(b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|b\.?\s?sc|m\.?\s?sc|b\.?\s?a\b|m\.?\s?a\b|bca|mca|mba|bba|b\.?\s?com|m\.?\s?com|ph\.?\s?d|bachelor|bachelor's|bachelors|master|master's|masters|diploma|doctorate|associate degree|higher secondary|senior secondary|secondary|hsc|ssc|cbse|icse|12th|10th|class xii|class x|intermediate|high school|matriculation|graduate|undergraduate|postgraduate|pgdm|b\.?\s?arch|llb|mbbs)\b/i;
const GRADE = /\b(?:cgpa|gpa|sgpa|percentage|percentile|grade|score|marks?)\b\s*[:\-–]?\s*([\d.]+\s*(?:\/\s*[\d.]+)?\s*%?)|(\d{1,2}(?:\.\d{1,2})?)\s*\/\s*(?:10|4)\b|(\d{2,3}(?:\.\d{1,2})?)\s*%/i;
const LOCATION_LINE = /^(?:remote|hybrid|on-?site)$|^[A-Za-z][A-Za-z .'-]{1,30},\s*[A-Za-z][A-Za-z .'-]{1,30}(?:,\s*[A-Za-z .'-]{2,30})?$/;

const BULLET = /^• /;

function isBullet(l: string): boolean {
  return BULLET.test(l);
}

function stripBullet(l: string): string {
  return l.replace(BULLET, "").trim();
}

/** Heading text → canonical section, or null when the line is not a recognised heading. */
export function headingKey(lineText: string): SectionKey | null {
  const text = lineText.trim();
  if (!text || text.length > 40 || isBullet(text)) return null;
  // A heading is a label, not a sentence: no date, no email, few words.
  if (ANY_DATE.test(text) || EMAIL.test(text)) return null;
  const norm = text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm || norm.split(" ").length > 5) return null;
  for (const group of SECTION_HEADINGS) {
    for (const title of group.titles) {
      const t = title.replace(/&/g, " and ").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
      if (norm === t) return group.key;
    }
  }
  return null;
}

/**
 * A line that looks like a heading but is not in the synonym table: short,
 * mostly letters, title- or upper-case, no terminal punctuation. These
 * become custom sections and are reported as unusual titles.
 */
function looksLikeHeading(text: string): boolean {
  if (text.length > 32 || isBullet(text) || ANY_DATE.test(text) || EMAIL.test(text)) return false;
  if (/[.,;:!?]$/.test(text) && !/:$/.test(text)) return false;
  const words = text.replace(/:$/, "").split(/\s+/);
  if (words.length > 4) return false;
  const letters = text.replace(/[^A-Za-z]/g, "").length;
  if (letters < 4 || letters / text.length < 0.7) return false;
  // Title case is not enough on its own — "Backend Intern" and "Acme Labs"
  // are title-cased too. Upper case, or a label with a colon, is a heading.
  const upper = text === text.toUpperCase();
  return upper || /:$/.test(text);
}

interface Segment {
  key: SectionKey;
  title: string;
  lines: string[];
}

/** Splits the text into a contact block and titled segments. */
function segment(text: string, headingHints: string[]): { head: string[]; segments: Segment[]; unmapped: string[] } {
  const lines = text.split("\n").map((l) => l.trim());
  const hints = new Set(headingHints.map((h) => h.trim().toLowerCase()));
  const head: string[] = [];
  const segments: Segment[] = [];
  const unmapped: string[] = [];
  let current: Segment | null = null;
  let index = -1;
  for (const raw of lines) {
    if (!raw) continue;
    index += 1;
    // Headings sometimes share a line with the first item ("SKILLS: Java, Python").
    const colon = raw.match(/^([A-Za-z &/]{3,32}):\s+(.+)$/);
    const candidate = colon ? `${colon[1]}` : raw;
    let key = headingKey(candidate);
    // "Languages: Java, Python" is a skills group, not a spoken-languages
    // section; and any "Label: items" line inside the skills section is a
    // group of it, whatever the label ("Tools:" is a skills synonym too).
    if (colon && key === "languages") key = "skills";
    if (colon && current?.key === "skills") key = null;
    // An unknown heading counts once some structure exists, or from the
    // third line on when it is not a job title — the first lines of a
    // resume (the name, a title) are short and cased like headings too.
    const plausible = segments.length > 0 || (index >= 2 && !TITLE_WORDS.test(candidate));
    if (!key && (hints.has(candidate.toLowerCase()) || (looksLikeHeading(candidate) && plausible)) && !colon) {
      key = "other";
      unmapped.push(candidate.replace(/:$/, ""));
    }
    if (key) {
      current = { key, title: candidate.replace(/:$/, "").trim(), lines: [] };
      segments.push(current);
      if (colon && colon[2]) current.lines.push(colon[2]);
      continue;
    }
    if (current) current.lines.push(raw);
    else head.push(raw);
  }
  return { head, segments, unmapped };
}

/** Consecutive lines merged where a line is plainly a wrapped continuation. */
function mergeWrapped(lines: string[]): string[] {
  const out: string[] = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    const continuation =
      prev !== undefined &&
      !isBullet(l) &&
      !ANY_DATE.test(l) &&
      (/^[a-z(]/.test(l) || (!/[.;:!?]$/.test(prev) && prev.length > 60 && l.length > 20 && !/^[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+){0,3}$/.test(l)));
    if (continuation) out[out.length - 1] = `${prev} ${l}`;
    else out.push(l);
  }
  return out;
}

function splitList(text: string): string[] {
  return text
    .split(/\s*[,|•;]\s*|\s{3,}/)
    .map((s) => s.replace(/^[-–—:]\s*/, "").trim())
    .filter((s) => s && s.length <= 80);
}

function parseDates(text: string): { start: string; end: string; current: boolean; rest: string } {
  const range = text.match(DATE_RANGE);
  if (range) {
    const current = PRESENT_RE.test(range[2]);
    return { start: range[1].trim(), end: current ? "" : range[2].trim(), current, rest: tidy(text.replace(range[0], "   ")) };
  }
  const single = text.match(ANY_DATE);
  if (single) return { start: "", end: single[0].trim(), current: false, rest: tidy(text.replace(single[0], "   ")) };
  return { start: "", end: "", current: false, rest: text.trim() };
}

/** Single spaces collapsed, but a run of three or more (a column gap) kept as the segment break it is. */
function tidy(text: string): string {
  return text.replace(/ {3,}/g, "\x01").replace(/\s+/g, " ").replace(/\x01/g, "   ").trim();
}

function headerSegments(text: string): string[] {
  return text
    .split(/\s*\|\s*|\s{3,}|\s+[–—]\s+|\s+-\s+|\s*•\s*|\s+@\s+|\s+at\s+/)
    .map((s) => s.replace(/^[,\s]+|[,\s]+$/g, ""))
    .filter(Boolean);
}

/** Splits a section's lines into entries: a header block of 1–3 lines followed by its bullets. */
function entryBlocks(lines: string[]): Array<{ header: string[]; bullets: string[] }> {
  const merged = mergeWrapped(lines);
  const blocks: Array<{ header: string[]; bullets: string[] }> = [];
  const hasDate = (l: string | undefined) => l !== undefined && !isBullet(l) && ANY_DATE.test(l);
  const startsEntry = (i: number) => {
    const l = merged[i];
    if (isBullet(l)) return false;
    const prev = merged[i - 1];
    if (hasDate(l)) {
      // A dated line is a new entry unless it is the second line of a header
      // (position, then "Company | dates") — in which case the line before
      // it has no bullet, no date, and started an entry itself.
      return !(prev !== undefined && !isBullet(prev) && !hasDate(prev) && blocks.length > 0 && blocks[blocks.length - 1].bullets.length === 0 && blocks[blocks.length - 1].header.length === 1);
    }
    if (hasDate(merged[i + 1]) && !isBullet(merged[i + 1] ?? "•")) return prev === undefined || isBullet(prev) || hasDate(prev) || blocks.length === 0;
    // No dates anywhere near: a non-bullet line after bullets starts a new entry.
    return prev === undefined || isBullet(prev);
  };
  for (let i = 0; i < merged.length; i++) {
    const l = merged[i];
    const last = blocks[blocks.length - 1];
    if (isBullet(l)) {
      if (!last) blocks.push({ header: [], bullets: [stripBullet(l)] });
      else last.bullets.push(stripBullet(l));
      continue;
    }
    if (!last || startsEntry(i)) blocks.push({ header: [l], bullets: [] });
    else if (last.bullets.length === 0 && last.header.length < 3) last.header.push(l);
    else last.bullets.push(l);
  }
  return blocks;
}

function pickLocation(segments: string[]): { location: string; rest: string[] } {
  const idx = segments.findIndex((s) => LOCATION_LINE.test(s) && !TITLE_WORDS.test(s) && !COMPANY_WORDS.test(s));
  if (idx < 0) return { location: "", rest: segments };
  return { location: segments[idx], rest: segments.filter((_, i) => i !== idx) };
}

function parseExperience(lines: string[]): ResumeContent["experience"] {
  return entryBlocks(lines)
    .filter((b) => b.header.length || b.bullets.length)
    .map((block) => {
      const joined = block.header.join(" | ");
      const dates = parseDates(joined);
      const { location, rest } = pickLocation(headerSegments(dates.rest));
      let position = "";
      let company = "";
      const titled = rest.filter((s) => TITLE_WORDS.test(s));
      const named = rest.filter((s) => !TITLE_WORDS.test(s));
      if (titled.length) {
        position = titled[0];
        company = named[0] ?? titled[1] ?? "";
      } else {
        // Nothing reads as a title: the first segment is the role, the next the employer.
        position = rest[0] ?? "";
        company = rest[1] ?? "";
      }
      return { id: newId(), company, position, location, startDate: dates.start, endDate: dates.end, current: dates.current, bullets: block.bullets };
    });
}

function parseEducation(lines: string[]): ResumeContent["education"] {
  return entryBlocks(lines)
    .filter((b) => b.header.length || b.bullets.length)
    .map((block) => {
      const joined = block.header.join(" | ");
      const dates = parseDates(joined);
      let rest = dates.rest;
      let grade = "";
      const g = rest.match(GRADE);
      if (g) {
        grade = g[0].trim();
        rest = rest.replace(g[0], " ").replace(/\s+/g, " ").trim();
      }
      const segments = headerSegments(rest);
      const institution = segments.find((s) => INSTITUTION_WORDS.test(s)) ?? "";
      const degreeSeg = segments.find((s) => DEGREE_WORDS.test(s) && s !== institution) ?? segments.find((s) => s !== institution) ?? "";
      let degree = degreeSeg;
      let field = "";
      const inMatch = degreeSeg.match(/^(.*?)\s+(?:in|of)\s+(.+)$/i);
      if (inMatch && DEGREE_WORDS.test(inMatch[1])) {
        degree = inMatch[1].trim();
        field = inMatch[2].replace(/[()]/g, "").trim();
      }
      const details = block.bullets;
      // Lines that were neither institution nor degree become details rather than being lost.
      for (const s of segments) if (s !== institution && s !== degreeSeg && s.length > 3) details.push(s);
      return { id: newId(), institution: institution || (segments[0] !== degreeSeg ? (segments[0] ?? "") : (segments[1] ?? "")), degree, field, startDate: dates.start, endDate: dates.end, grade, details };
    });
}

function parseSkills(lines: string[]): ResumeContent["skills"] {
  const groups: ResumeContent["skills"] = [];
  let pendingCategory: string | null = null;
  for (const raw of lines) {
    const l = stripBullet(raw);
    const m = l.match(/^([A-Za-z][A-Za-z &/()+.-]{1,40}?)\s*[:\-–—]\s+(.+)$/);
    if (m && !/^(and|or)$/i.test(m[1])) {
      groups.push({ id: newId(), category: m[1].trim(), items: splitList(m[2]) });
      pendingCategory = null;
      continue;
    }
    // A bare label line ("Languages") followed by its items on the next line.
    if (l.length <= 30 && !/[,|]/.test(l) && /^[A-Z]/.test(l) && l.split(/\s+/).length <= 3 && !groups.some((g) => g.category.toLowerCase() === l.toLowerCase())) {
      pendingCategory = l.replace(/:$/, "");
      continue;
    }
    const items = splitList(l);
    if (!items.length) continue;
    const category = pendingCategory ?? "";
    pendingCategory = null;
    const existing = groups.find((g) => g.category === category);
    if (existing) existing.items.push(...items);
    else groups.push({ id: newId(), category, items });
  }
  for (const g of groups) g.items = [...new Set(g.items)];
  return groups.filter((g) => g.items.length);
}

function parseProjects(lines: string[]): ResumeContent["projects"] {
  return entryBlocks(lines)
    .filter((b) => b.header.length || b.bullets.length)
    .map((block) => {
      const joined = block.header.join(" | ");
      const dates = parseDates(joined);
      let rest = dates.rest;
      const link = (rest.match(URL) ?? [])[0] ?? "";
      if (link) rest = rest.replace(link, " ");
      let technologies: string[] = [];
      let name = rest;
      // "Name | React, Node" / "Name (React, Node)" / "Name – React, Node".
      const paren = rest.match(/^(.+?)\s*\(([^)]{3,120})\)\s*$/);
      const split = rest.split(/\s*\|\s*|\s+[–—]\s+|\s+-\s+|:\s+/);
      if (paren && /,|\//.test(paren[2])) {
        name = paren[1];
        technologies = splitList(paren[2]);
      } else if (split.length > 1) {
        name = split[0];
        const techPart = split.slice(1).find((s) => /,/.test(s) || s.split(/\s+/).length <= 4);
        if (techPart) technologies = splitList(techPart);
        const leftovers = split.slice(1).filter((s) => s !== techPart);
        if (leftovers.length) block.bullets.unshift(...leftovers);
      }
      return { id: newId(), name: name.replace(/\s+/g, " ").trim(), link, technologies, startDate: dates.start, endDate: dates.end, bullets: block.bullets };
    });
}

function parseCertifications(lines: string[]): ResumeContent["certifications"] {
  return mergeWrapped(lines)
    .map(stripBullet)
    .filter(Boolean)
    .map((l) => {
      const dates = parseDates(l);
      const segs = dates.rest.split(/\s*[|–—]\s*|\s+-\s+|,\s+(?=[A-Z])|\s+by\s+|\s+from\s+/);
      const clean = (t: string) => t.replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, "");
      return { id: newId(), name: clean(segs[0] ?? ""), issuer: clean(segs.slice(1).map(clean).filter(Boolean).join(", ")), date: dates.end || dates.start };
    });
}

function parseContact(head: string[], allText: string): ResumeContent["basics"] {
  const basics: ResumeContent["basics"] = { name: "", title: "", email: "", phone: "", location: "", links: [] };
  const block = head.slice(0, 10).join("\n");
  basics.email = (block.match(EMAIL) ?? allText.match(EMAIL) ?? [""])[0];
  basics.phone = findPhone(block.replace(EMAIL, " ")) || findPhone(allText.slice(0, 600).replace(EMAIL, " "));
  basics.links = [...new Set((block.match(URL) ?? []).map((u) => u.replace(/[.,]$/, "")))].filter((u) => !u.includes("@"));
  const candidates = head.slice(0, 8).map((l) => l.replace(EMAIL, " ").replace(basics.phone || "\x00", " ").replace(URL, " ").replace(/\s*[|•]\s*/g, " | ").replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const c of candidates) {
    const pieces = c.split(" | ").map((p) => p.trim()).filter(Boolean);
    for (const p of pieces) {
      if (!basics.name && /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4}$/.test(p) && !TITLE_WORDS.test(p) && p.length <= 40 && !/^(resume|curriculum vitae|cv)$/i.test(p)) {
        basics.name = p;
        continue;
      }
      if (!basics.title && TITLE_WORDS.test(p) && p.split(/\s+/).length <= 8 && !/[.:]$/.test(p)) {
        basics.title = p;
        continue;
      }
      if (!basics.location && LOCATION_LINE.test(p) && !TITLE_WORDS.test(p)) basics.location = p;
    }
  }
  return basics;
}

export interface ParsedResume {
  content: ResumeContent;
  /** Section titles the parser did not recognise (they became custom sections). */
  unmappedHeadings: string[];
  /** Canonical sections the text had a heading for. */
  sectionsFound: SectionKey[];
}

/**
 * Text → content. `headingHints` are the DOCX paragraphs styled as headings,
 * which let an unusual title ("What I've Built") be treated as a section
 * rather than as a stray line.
 */
export function parseResumeText(text: string, headingHints: string[] = []): ParsedResume {
  const { head, segments, unmapped } = segment(text, headingHints);
  const content = emptyContent();
  content.basics = parseContact(head, text);
  const order: string[] = [];
  const found: SectionKey[] = [];
  const pushOrder = (key: string) => {
    if (!order.includes(key)) order.push(key);
  };
  // Lines before the first heading that are not contact details are usually
  // a summary written without a title.
  const strayHead = head.filter((l) => l.length > 60 && !EMAIL.test(l) && !PHONE.test(l));
  if (strayHead.length && !segments.some((s) => s.key === "summary")) {
    content.summary = strayHead.map(stripBullet).join(" ");
    pushOrder("summary");
  }
  for (const seg of segments) {
    if (!seg.lines.length && seg.key !== "other") {
      found.push(seg.key);
      continue;
    }
    found.push(seg.key);
    switch (seg.key) {
      case "summary":
        content.summary = [content.summary, seg.lines.map(stripBullet).join(" ")].filter(Boolean).join("\n\n");
        pushOrder("summary");
        break;
      case "experience":
      case "volunteer":
        content.experience.push(...parseExperience(seg.lines));
        pushOrder("experience");
        break;
      case "education":
        content.education.push(...parseEducation(seg.lines));
        pushOrder("education");
        break;
      case "skills":
        content.skills.push(...parseSkills(seg.lines));
        pushOrder("skills");
        break;
      case "projects":
        content.projects.push(...parseProjects(seg.lines));
        pushOrder("projects");
        break;
      case "certifications":
        content.certifications.push(...parseCertifications(seg.lines));
        pushOrder("certifications");
        break;
      case "achievements":
        content.achievements.push(...mergeWrapped(seg.lines).map(stripBullet).filter(Boolean));
        pushOrder("achievements");
        break;
      case "contact":
        break;
      default: {
        const custom = { id: newId(), title: seg.title, bullets: mergeWrapped(seg.lines).map(stripBullet).filter(Boolean) };
        if (custom.bullets.length) {
          content.customSections.push(custom);
          pushOrder(`custom:${custom.id}`);
        }
      }
    }
  }
  content.sectionOrder = order;
  return { content: normalizeContent(ResumeContentSchema.parse(clampContent(content))), unmappedHeadings: unmapped, sectionsFound: [...new Set(found)] };
}

/** Trims anything the parser produced past the schema's bounds rather than failing the upload. */
function clampContent(content: ResumeContent): ResumeContent {
  const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);
  const cutList = (xs: string[], n: number, each: number) => xs.slice(0, n).map((x) => cut(x, each));
  return {
    basics: { ...content.basics, name: cut(content.basics.name, 300), title: cut(content.basics.title, 300), location: cut(content.basics.location, 300), links: cutList(content.basics.links, 10, 300) },
    summary: cut(content.summary, 3000),
    experience: content.experience.slice(0, 30).map((e) => ({ ...e, company: cut(e.company, 300), position: cut(e.position, 300), location: cut(e.location, 300), startDate: cut(e.startDate, 40), endDate: cut(e.endDate, 40), bullets: cutList(e.bullets, 40, 800) })),
    education: content.education.slice(0, 15).map((e) => ({ ...e, institution: cut(e.institution, 300), degree: cut(e.degree, 300), field: cut(e.field, 300), startDate: cut(e.startDate, 40), endDate: cut(e.endDate, 40), grade: cut(e.grade, 60), details: cutList(e.details, 40, 800) })),
    skills: content.skills.slice(0, 20).map((g) => ({ ...g, category: cut(g.category, 300), items: cutList(g.items, 80, 80) })),
    projects: content.projects.slice(0, 30).map((p) => ({ ...p, name: cut(p.name, 300), link: cut(p.link, 400), technologies: cutList(p.technologies, 40, 80), startDate: cut(p.startDate, 40), endDate: cut(p.endDate, 40), bullets: cutList(p.bullets, 40, 800) })),
    certifications: content.certifications.slice(0, 30).map((c) => ({ ...c, name: cut(c.name, 300), issuer: cut(c.issuer, 300), date: cut(c.date, 40) })),
    achievements: cutList(content.achievements, 40, 800),
    customSections: content.customSections.slice(0, 15).map((c) => ({ ...c, title: cut(c.title, 300), bullets: cutList(c.bullets, 40, 800) })),
    sectionOrder: content.sectionOrder.slice(0, 30),
  };
}

/** Rough experience in years from the dated entries, for the requirement check. */
export function yearsOfExperience(content: ResumeContent, now = new Date()): number {
  const toYear = (s: string): number | null => {
    const m = s.match(/(19|20)\d{2}/);
    if (!m) return null;
    const year = Number(m[0]);
    const month = s.match(new RegExp(MONTH, "i"));
    const monthIndex = month ? ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(month[0].slice(0, 3).toLowerCase()) : 0;
    return year + Math.max(0, monthIndex) / 12;
  };
  const spans: Array<[number, number]> = [];
  for (const e of content.experience) {
    const start = toYear(e.startDate);
    const end = e.current ? now.getFullYear() + now.getMonth() / 12 : toYear(e.endDate);
    if (start !== null && end !== null && end >= start) spans.push([start, Math.min(end, start + 40)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  // Overlapping roles count once.
  let total = 0;
  let cursor = -Infinity;
  for (const [s, e] of spans) {
    const from = Math.max(s, cursor);
    if (e > from) total += e - from;
    cursor = Math.max(cursor, e);
  }
  return Math.round(total * 10) / 10;
}

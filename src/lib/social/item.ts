/**
 * What a day's posts may say about their subject, and the pure readers that
 * get it out of the catalogue's own Markdown — pinned by social.test.ts.
 *
 * Why the catalogue and not the model's memory: a post about "Amazon's Two
 * Sum" must carry the catalogue's statement, its company tags and its
 * editorial. The model writes the hook; every fact on a slide is quoted
 * from here (lib/social/slides.ts).
 *
 * The Markdown is the catalogue's house shape — scripts/catalog/types.ts
 * `describe()` (intro, "### Example n" fences, "### Constraints") and
 * `explain()` (the idea, "## Approach", "## Complexity", "## Pitfalls").
 * A part that is missing reads as empty and its slide is left out, never
 * an error.
 */

import type { ThemeId } from "./calendar.js";

export interface Faq {
  q: string;
  a: string;
}

export interface Item {
  theme: ThemeId;
  /** Unique across themes ("problem:two-sum"); what "used before" compares. */
  key: string;
  /** The site page the posts link to. */
  path: string;
  title: string;
  difficulty?: string;
  topics?: string[];
  /** The company a company-DSA day is about, and its hub slug. */
  company?: string;
  companySlug?: string;
  /** Every company the catalogue tags the problem with. */
  companies?: string[];
  statement?: string;
  example?: string;
  constraints?: string[];
  hints?: string[];
  idea?: string;
  steps?: string[];
  complexity?: { time: string; space: string };
  pitfalls?: string[];
  /** Aptitude. */
  question?: string;
  options?: string[];
  answer?: number;
  approach?: string;
  solution?: string[];
  seconds?: number;
  /** Roadmap tutorials and CS notes. */
  summary?: string;
  sections?: string[];
  faq?: Faq[];
  /** SQL: each table as its name then "column  type" lines. */
  tables?: string;
  /** Motivation. */
  angle?: string;
  /** Product spotlight. */
  feature?: { name: string; summary: string };
}

/** Markdown inline marks off: **bold**, `code`, [text](link), escapes. */
export function plain(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** The Markdown under a heading whose text matches, up to the next heading of the same or a higher level. */
export function under(md: string, heading: RegExp): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((l) => /^#{2,4}\s/.test(l) && heading.test(l.replace(/^#+\s*/, "")));
  if (start < 0) return "";
  const level = /^#+/.exec(lines[start])![0].length;
  const end = lines.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}}\\s`).test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n").trim();
}

/** A Markdown list's items (bulleted or numbered), each as plain text; continuation lines joined. */
export function listItems(md: string): string[] {
  const out: string[] = [];
  // A line after a blank one is a new paragraph (the "Follow-up" under the
  // constraints), not the last item running on.
  let open = false;
  for (const line of md.split("\n")) {
    const m = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (m) {
      out.push(m[1]);
      open = true;
    } else if (!line.trim()) open = false;
    else if (open && !/^#/.test(line)) out[out.length - 1] += ` ${line.trim()}`;
  }
  return out.map(plain).filter(Boolean);
}

/** Prose paragraphs (no headings, fences, lists or tables), as plain text. */
export function prose(md: string): string[] {
  return md
    .replace(/```[\s\S]*?```/g, "\n\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|\||>)/.test(p))
    .map((p) => plain(p.replace(/\s*\n\s*/g, " ")));
}

/** A coding problem's statement parts, from `describe()`'s Markdown. */
export function readDescription(md: string): Pick<Item, "statement" | "example" | "constraints"> {
  const text = md.replace(/\r\n/g, "\n");
  const intro = text.split(/^#{2,4}\s*Example/im)[0].split(/^#{2,4}\s*Constraints/im)[0];
  const fence = /^#{2,4}\s*Example[^\n]*\n+```[^\n]*\n([\s\S]*?)```/im.exec(text);
  return {
    statement: prose(intro).join("\n\n"),
    example: fence ? fence[1].trim() : "",
    constraints: listItems(under(text, /^constraints/i)),
  };
}

/** An editorial's parts, from `explain()`'s Markdown. */
export function readEditorial(md: string | null | undefined): Pick<Item, "idea" | "steps" | "complexity" | "pitfalls"> {
  const text = (md ?? "").replace(/\r\n/g, "\n");
  if (!text.trim()) return {};
  const before = text.split(/^#{1,6}\s/m)[0];
  const cx = listItems(under(text, /^complexity/i));
  const value = (label: RegExp) => cx.find((l) => label.test(l))?.replace(/^\w+\s*[—:–-]\s*/, "").trim() ?? "";
  const time = value(/^time/i);
  const space = value(/^space/i);
  return {
    idea: prose(before).join(" "),
    steps: listItems(under(text, /^approach/i)),
    complexity: time || space ? { time, space } : undefined,
    pitfalls: listItems(under(text, /^pitfalls?/i)),
  };
}

/** An aptitude solution's worked steps: its numbered list, or its paragraphs when it has none. */
export function readSolution(md: string): string[] {
  const steps = listItems(md);
  return steps.length ? steps : prose(md);
}

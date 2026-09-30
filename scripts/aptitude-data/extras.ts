import fs from "node:fs";
import type { AptitudeSeed } from "./types.js";

/**
 * Each question's shortcut and common trap, authored apart from the question
 * files: extras/<batch>.json maps a slug to { shortcut, trap }. Kept out of
 * the question objects so a batch of 150 can be written, checked
 * (scripts/aptitude-extras-check.ts) and reviewed as one file without
 * touching the 33 question files — and so a question without extras is
 * still a whole question.
 *
 * index.ts merges them into APTITUDE_QUESTIONS; the seed folds them into the
 * stored `approach` (types.ts storedApproach).
 */
export interface AptitudeExtra {
  shortcut: string;
  trap: string;
}

const DIR = new URL("./extras/", import.meta.url);

/**
 * Every extras file, merged by slug. A slug in two files is an authoring
 * mistake and throws. A file that is not valid JSON throws too — unless
 * `onBadFile` is given (the checker, which runs while other batches are
 * still being written), in which case that file is reported and skipped.
 */
export function loadExtras(onBadFile?: (name: string, err: unknown) => void): Map<string, AptitudeExtra> {
  const out = new Map<string, AptitudeExtra>();
  if (!fs.existsSync(DIR)) return out;
  for (const name of fs.readdirSync(DIR).filter((n) => n.endsWith(".json")).sort()) {
    let data: Record<string, AptitudeExtra>;
    try {
      data = JSON.parse(fs.readFileSync(new URL(name, DIR), "utf8")) as Record<string, AptitudeExtra>;
    } catch (err) {
      if (!onBadFile) throw new Error(`aptitude extras: ${name} is not valid JSON (${String(err)})`);
      onBadFile(name, err);
      continue;
    }
    for (const [slug, extra] of Object.entries(data)) {
      if (out.has(slug)) throw new Error(`aptitude extras: ${slug} appears twice (second in ${name})`);
      out.set(slug, extra);
    }
  }
  return out;
}

/** The questions with their extras attached, where a file has them. */
export function withExtras(questions: AptitudeSeed[], extras = loadExtras()): AptitudeSeed[] {
  return questions.map((q) => {
    const x = extras.get(q.slug);
    return x ? { ...q, shortcut: x.shortcut, trap: x.trap } : q;
  });
}

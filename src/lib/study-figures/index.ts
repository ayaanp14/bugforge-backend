import type { Walkthrough } from "../walkthroughs/core.js";
import { walkthroughProblems } from "../walkthroughs/validate.js";
import { FIGURE_LIMITS } from "../lesson-figures/index.js";
import { STUDY_FIGURES } from "./registry.js";

/**
 * The study plans' figures (2026-10-27, the owner on the SQL track: "these
 * tables look shitty — I want real diagrams that explain everything through
 * animation, like the other study plans"). A lesson places one with a line
 * holding only `@figure <name>`; `<name>` is a key of the lesson's own
 * module, `<track>/<lesson slug>.ts` beside this file exporting FIGURES,
 * collected in registry.ts.
 *
 * Same model, limits and renderer as the roadmap lessons' and the CS notes'
 * figures (lib/lesson-figures, lib/note-figures): a figure is a walkthrough
 * — one frame a still diagram, two to sixteen an animation — and every
 * value it draws is computed by running the thing it shows (a join by
 * matching the rows, a GROUP BY by bucketing them, a window by its frame).
 * The lesson's payload carries only the figures its body places
 * (services/study-plans `figuresOf`), and the edge writes each as its SVG
 * plus its sentences (services/seo.ts lessonHead).
 */

/** A placed figure: a line holding only `@figure <name>`. */
export const FIGURE_LINE = /^@figure ([a-z0-9][a-z0-9-]*)\s*$/;

const built = new Map<string, Walkthrough | null>();

/** One figure, built once per process; null when the lesson has no figure by that name. */
export function studyFigure(track: string, lesson: string, name: string): Walkthrough | null {
  const key = `${track}/${lesson}/${name}`;
  let w = built.get(key);
  if (w === undefined) {
    const make = STUDY_FIGURES[track]?.[lesson]?.[name];
    w = make ? make() : null;
    built.set(key, w);
  }
  return w;
}

/** The names a body places, in order. */
export function placedFigures(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split("\n")) {
    const m = FIGURE_LINE.exec(line.trim());
    if (m) out.push(m[1]!);
  }
  return out;
}

/** The figures a lesson body places, by name — what its payload carries. A name with no figure is left out (the validator refuses it). */
export function figuresOf(track: string, lesson: string, body: string): Record<string, Walkthrough> {
  const figures: Record<string, Walkthrough> = {};
  for (const name of placedFigures(body)) {
    const w = studyFigure(track, lesson, name);
    if (w) figures[name] = w;
  }
  return figures;
}

/** Everything wrong with one placed figure: it throws, is missing, or breaks the page's limits. */
export function studyFigureProblems(track: string, lesson: string, name: string): string[] {
  const at = `${track}/${lesson}.md`;
  let w: Walkthrough | null;
  try {
    w = studyFigure(track, lesson, name);
  } catch (err) {
    return [`${at}: figure "${name}" threw: ${(err as Error).message}`];
  }
  if (!w) return [`${at}: no figure "${name}" in src/lib/study-figures/${track}/${lesson}.ts`];
  return walkthroughProblems(`${at} figure "${name}"`, w, FIGURE_LIMITS);
}

/** Everything wrong with a body's figures: each placed one checked, none placed twice, every `@figure` line well formed. */
export function bodyFigureProblems(track: string, lesson: string, body: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  body.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (/^@figure\b/.test(t) && !FIGURE_LINE.test(t)) out.push(`${track}/${lesson}.md:${i + 1}: write "@figure <name>" with a lower-case name (found "${t}")`);
  });
  for (const name of placedFigures(body)) {
    if (seen.has(name)) out.push(`${track}/${lesson}.md: figure "${name}" is placed twice`);
    seen.add(name);
    out.push(...studyFigureProblems(track, lesson, name));
  }
  return out;
}

/** Every lesson module's figure names, for the test that holds each one placed. */
export function definedFigures(): Array<{ track: string; lesson: string; name: string }> {
  return Object.entries(STUDY_FIGURES).flatMap(([track, lessons]) =>
    Object.entries(lessons).flatMap(([lesson, figs]) => Object.keys(figs).map((name) => ({ track, lesson, name }))),
  );
}

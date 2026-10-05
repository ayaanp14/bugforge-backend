import type { Walkthrough } from "../walkthroughs/core.js";
import { walkthroughProblems } from "../walkthroughs/validate.js";
import { FIGURE_LIMITS } from "../lesson-figures/index.js";
import { NOTE_FIGURES } from "./registry.js";

/**
 * The CS notes' figures (content/notes/<subject>/<slug>.md places one with a
 * line holding only `@figure <name>`). Same model, limits and renderer as the
 * roadmap lessons' figures (lib/lesson-figures/index.ts): a figure is a
 * walkthrough — one frame is a still diagram, two to sixteen an animation —
 * and every value it draws is computed by running the thing it shows (a
 * Gantt chart by running the scheduler, a subnet by doing the arithmetic).
 */

const built = new Map<string, Walkthrough | null>();

/** One figure, built once per process; null when the note has no figure by that name. */
export function noteFigure(note: string, name: string): Walkthrough | null {
  const key = `${note}/${name}`;
  let w = built.get(key);
  if (w === undefined) {
    const make = NOTE_FIGURES[note]?.[name];
    w = make ? make() : null;
    built.set(key, w);
  }
  return w;
}

/** Everything wrong with one figure: it throws, is missing, or breaks the page's limits. */
export function noteFigureProblems(note: string, name: string): string[] {
  let w: Walkthrough | null;
  try {
    w = noteFigure(note, name);
  } catch (err) {
    return [`${note}.md: figure "${name}" threw: ${(err as Error).message}`];
  }
  if (!w) return [`${note}.md: no figure "${name}" in src/lib/note-figures/${note}.ts`];
  return walkthroughProblems(`${note}.md figure "${name}"`, w, FIGURE_LIMITS);
}

/** The names a note's module defines. */
export const noteFigureNames = (note: string): string[] => Object.keys(NOTE_FIGURES[note] ?? {});

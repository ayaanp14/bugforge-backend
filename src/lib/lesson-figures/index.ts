import type { Walkthrough } from "../walkthroughs/core.js";
import { walkthroughProblems } from "../walkthroughs/validate.js";
import { LESSON_FIGURES } from "./registry.js";

/**
 * The roadmap lessons' figures: the pictures that carry a lesson instead of
 * paragraphs (user, 2026-10-03: "show less content and describe more
 * through graphics"). A lesson places one with a line holding only
 * `@figure <name>` (lib/roadmap-lessons lessonBlocks); `<name>` is a key of
 * the lesson's own module beside this file (`<lesson slug>.ts`, exporting
 * FIGURES), collected in registry.ts.
 *
 * A figure is the walkthrough model (../walkthroughs/core.ts) — frames of
 * primitives, a sentence each — so the SPA draws and animates it with the
 * same code as a hub's walkthrough, the edge writes it as a static SVG plus
 * its sentences (services/seo.ts), and the same truth rule holds: every
 * value drawn is computed by running the thing it shows. Two kinds:
 *
 *  - a diagram is one frame: drawn still, its sentence under it (how a hash
 *    table is laid out, the two shapes of two pointers);
 *  - an animation is two to sixteen frames with the player's controls (a
 *    dry run, an invariant holding step by step).
 *
 * Figures ship in the lesson's payload — only the ones its body places, a
 * kilobyte or two gzipped each — and the page mounts each one's SVG only as
 * it nears the viewport (components/roadmap/lesson/LessonFigure.tsx), so a
 * lesson with eight figures paints its text exactly as fast as one with none.
 */

/**
 * The page's limits for a lesson figure: one frame is a diagram; 600 units
 * wide at most (the article column is ~700 px and the figure scales down on
 * a phone — keep it nearer 360–520 where it can be, so 13 px labels stay
 * readable at 360 px); the example line is optional for a diagram.
 */
export const FIGURE_LIMITS = { minFrames: 1, maxWidth: 600, inputOptional: true } as const;

const built = new Map<string, Walkthrough | null>();

/** The names a lesson's module defines. */
export const figureNames = (lesson: string): string[] => Object.keys(LESSON_FIGURES[lesson] ?? {});

/** One figure, built once per process; null when the lesson has no figure by that name. */
export function lessonFigure(lesson: string, name: string): Walkthrough | null {
  const key = `${lesson}/${name}`;
  let w = built.get(key);
  if (w === undefined) {
    const make = LESSON_FIGURES[lesson]?.[name];
    w = make ? make() : null;
    built.set(key, w);
  }
  return w;
}

/** Everything wrong with one figure: it throws, or breaks the page's limits (../walkthroughs/validate.ts). */
export function lessonFigureProblems(lesson: string, name: string): string[] {
  let w: Walkthrough | null;
  try {
    w = lessonFigure(lesson, name);
  } catch (err) {
    return [`${lesson}.md: figure "${name}" threw: ${(err as Error).message}`];
  }
  if (!w) return [`${lesson}.md: no figure "${name}" in src/lib/lesson-figures/${lesson}.ts`];
  return walkthroughProblems(`${lesson}.md figure "${name}"`, w, FIGURE_LIMITS);
}

import type { Walkthrough } from "./core.js";
import { breadthFirstSearch, slidingWindow } from "./reference.js";
import { WALKTHROUGHS as ARRAYS } from "./arrays.js";
import { WALKTHROUGHS as MATH_STRINGS } from "./math-strings.js";
import { WALKTHROUGHS as STRUCTURES } from "./structures.js";
import { WALKTHROUGHS as GRAPHS } from "./graphs.js";

/**
 * Every topic hub's walkthrough, by hub slug (lib/problem-topics TOPIC_HUBS).
 * Each entry is a generator that runs its algorithm on a fixed example, so
 * the result is the same on every call; `walkthroughFor` memoises it.
 * walkthroughs.test.ts holds every TOPIC_HUBS slug to having one.
 */
export const WALKTHROUGHS: Readonly<Record<string, () => Walkthrough>> = {
  "sliding-window": slidingWindow,
  "breadth-first-search": breadthFirstSearch,
  ...ARRAYS,
  ...MATH_STRINGS,
  ...STRUCTURES,
  ...GRAPHS,
};

const built = new Map<string, Walkthrough | null>();

/** A topic's walkthrough, built once per process; null when the topic has none. */
export function walkthroughFor(slug: string): Walkthrough | null {
  let w = built.get(slug);
  if (w === undefined) {
    const make = WALKTHROUGHS[slug];
    w = make ? make() : null;
    built.set(slug, w);
  }
  return w;
}

export type { Walkthrough } from "./core.js";

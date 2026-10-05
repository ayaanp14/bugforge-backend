import type { Walkthrough } from "../walkthroughs/core.js";

/**
 * Every CS note's figures by note slug, then figure name (one module per
 * note beside this file, `<note slug>.ts` exporting FIGURES — the roadmap
 * lessons' convention, lib/lesson-figures/registry.ts). A note slug is
 * unique across subjects (lib/cs-notes validateNotes), so it is the key.
 */
export const NOTE_FIGURES: Readonly<Record<string, Readonly<Record<string, () => Walkthrough>>>> = {
};

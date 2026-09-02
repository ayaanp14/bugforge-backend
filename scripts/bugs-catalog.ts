/** Aggregates every bug-hunt wave into one catalog. */
import { BUGS } from "./bugs-data.js";
import { WAVE2 } from "./bugs-wave2.js";
import { WAVE3 } from "./bugs-wave3.js";
import { WAVE4 } from "./bugs-wave4.js";
import { WAVE5 } from "./bugs-wave5.js";
import { WAVE6 } from "./bugs-wave6.js";
import { WAVE7 } from "./bugs-wave7.js";
import { WAVE8 } from "./bugs-wave8.js";
import { WAVE9 } from "./bugs-wave9.js";

export const ALL_BUGS = [
  ...BUGS,
  ...WAVE2,
  ...WAVE3,
  ...WAVE4,
  ...WAVE5,
  ...WAVE6,
  ...WAVE7,
  ...WAVE8,
  ...WAVE9,
];

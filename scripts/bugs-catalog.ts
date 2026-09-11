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
import { WAVE10 } from "./bugs-wave10.js";
import { WAVE11 } from "./bugs-wave11.js";
import { WAVE12 } from "./bugs-wave12.js";
import { WAVE13 } from "./bugs-wave13.js";

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
  ...WAVE10,
  ...WAVE11,
  ...WAVE12,
  ...WAVE13,
];

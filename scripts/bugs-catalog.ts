/** Aggregates every bug-hunt wave into one catalog. */
import { BUGS, type BugSpec } from "./bugs-data.js";
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
import { WAVE14 } from "./bugs-wave14.js";
import { WAVE15 } from "./bugs-wave15.js";
import { WAVE16 } from "./bugs-wave16.js";
import { WAVE17 } from "./bugs-wave17.js";
import { WAVE18 } from "./bugs-wave18.js";
import { WAVE19 } from "./bugs-wave19.js";
import { WAVE20 } from "./bugs-wave20.js";
import { WAVE21 } from "./bugs-wave21.js";
import { WAVE22 } from "./bugs-wave22.js";
import { WAVE23 } from "./bugs-wave23.js";

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
  ...WAVE14,
  ...WAVE15,
  ...WAVE16,
  ...WAVE17,
  ...WAVE18,
  ...WAVE19,
  ...WAVE20,
  ...WAVE21,
  ...WAVE22,
  ...WAVE23,
];

/** Each wave by number, for `seed-bugs.ts --wave N`. */
export const WAVES: Record<string, BugSpec[]> = {
  "1": BUGS,
  "2": WAVE2,
  "3": WAVE3,
  "4": WAVE4,
  "5": WAVE5,
  "6": WAVE6,
  "7": WAVE7,
  "8": WAVE8,
  "9": WAVE9,
  "10": WAVE10,
  "11": WAVE11,
  "12": WAVE12,
  "13": WAVE13,
  "14": WAVE14,
  "15": WAVE15,
  "16": WAVE16,
  "17": WAVE17,
  "18": WAVE18,
  "19": WAVE19,
  "20": WAVE20,
  "21": WAVE21,
  "22": WAVE22,
  "23": WAVE23,
};

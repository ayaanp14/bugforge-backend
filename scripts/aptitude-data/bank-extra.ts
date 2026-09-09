import type { AptitudeSeed } from "./types.js";

/** Caselet, table and sentence-correction items closing out the bank. */

const SHOP_WEEK = `A shop was open for six days last week and sold **1,200 items** in all. The daily figures were:

- Monday: 150
- Tuesday: 200
- Wednesday: 180
- Thursday: 220
- Friday: 250
- Saturday: 200`;

const MARKS_TABLE = `Marks scored by four students out of 100:

| Student | Maths | Physics | Chemistry |
| --- | ---: | ---: | ---: |
| Amit | 77 | 65 | 82 |
| Bina | 85 | 72 | 68 |
| Chetan | 66 | 90 | 74 |
| Divya | 92 | 58 | 76 |`;

export const BANK_EXTRA: AptitudeSeed[] = [
  /* ── Caselets ──────────────────────────────────────────────────── */
  {
    slug: "cl4-shop-week-highest-day",
    topic: "caselets",
    title: "The busiest day",
    prompt: `${SHOP_WEEK}\n\nOn which day were **sales highest**?`,
    options: ["Tuesday", "Thursday", "Friday", "Saturday"],
    answer: 2,
    difficulty: "easy",
    hints: ["Compare the six daily figures.", "Only one day rises above 220."],
    solution:
      "1. The figures are 150, 200, 180, 220, 250 and 200.\n2. The largest is 250, on **Friday**.\n\nAnswer: **Friday**.",
    approach:
      "Read the caselet once and list the numbers in order before answering. A single scan then settles every question on the set.",
    tags: ["caselet"],
    timeTargetSec: 45,
  },
  {
    slug: "cl4-shop-week-average",
    topic: "caselets",
    title: "Average daily sales",
    prompt: `${SHOP_WEEK}\n\nWhat were the **average daily sales** over the six days?`,
    options: ["180", "190", "200", "210"],
    answer: 2,
    difficulty: "easy",
    hints: ["The six figures total 1,200.", "Divide by 6."],
    solution:
      "1. Total = 150 + 200 + 180 + 220 + 250 + 200 = 1,200.\n2. Average = 1,200 ÷ 6 = **200**.\n\nAnswer: **200**.",
    approach:
      "The caselet states the weekly total, so the addition is only a check. Divide by the number of days actually listed, not by seven.",
    tags: ["caselet"],
    timeTargetSec: 60,
  },
  {
    slug: "cl4-shop-week-wednesday-share",
    topic: "caselets",
    title: "Wednesday's share of the week",
    prompt: `${SHOP_WEEK}\n\nWednesday's sales were what **percentage** of the week's total?`,
    options: ["12%", "15%", "18%", "20%"],
    answer: 1,
    difficulty: "medium",
    hints: ["Wednesday sold 180 of 1,200.", "180 ÷ 1,200 = 0.15."],
    solution:
      "1. Wednesday = 180 and the total = 1,200.\n2. Share = 180 ÷ 1,200 = 0.15 = **15%**.\n\nAnswer: **15%**.",
    approach:
      "A share is always the part over the whole. Reading the whole off the caselet saves re-adding the six figures.",
    tags: ["caselet", "percentage"],
    timeTargetSec: 60,
  },

  /* ── Tables & Charts ───────────────────────────────────────────── */
  {
    slug: "tc4-marks-highest-total",
    topic: "tables-and-charts",
    title: "Highest total marks",
    prompt: `${MARKS_TABLE}\n\nWhich student scored the **highest total** across the three subjects?`,
    options: ["Amit", "Bina", "Chetan", "Divya"],
    answer: 2,
    difficulty: "medium",
    hints: ["Add each row.", "Two of the four totals differ by only one mark."],
    solution:
      "1. Amit = 77 + 65 + 82 = 224.\n2. Bina = 85 + 72 + 68 = 225.\n3. Chetan = 66 + 90 + 74 = 230.\n4. Divya = 92 + 58 + 76 = 226.\n5. The highest is **Chetan**.\n\nAnswer: **Chetan**.",
    approach:
      "Add every row before comparing. The student strongest in one subject is often not the strongest overall.",
    tags: ["table"],
    timeTargetSec: 90,
  },
  {
    slug: "tc4-marks-average-maths",
    topic: "tables-and-charts",
    title: "Average mark in Maths",
    prompt: `${MARKS_TABLE}\n\nWhat is the **average mark in Maths** across the four students?`,
    options: ["76", "78", "80", "82"],
    answer: 2,
    difficulty: "medium",
    hints: ["Add the Maths column only.", "77 + 85 + 66 + 92 = 320."],
    solution:
      "1. Maths column = 77 + 85 + 66 + 92 = 320.\n2. Average = 320 ÷ 4 = **80**.\n\nAnswer: **80**.",
    approach:
      "Read down the column the question names and ignore the rest of the table. Mixing in another column is the usual slip here.",
    tags: ["table", "average"],
    timeTargetSec: 75,
  },

  /* ── Sentence Correction ───────────────────────────────────────── */
  {
    slug: "sc4-along-with-agreement",
    topic: "sentence-correction",
    title: "A subject with a modifier",
    prompt: "Choose the **grammatically correct** sentence:",
    options: [
      "The teacher along with the students were present.",
      "The teacher along with the students was present.",
      "The teacher along with the students are present.",
      "The teacher along with the students have been present.",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A phrase beginning 'along with' does not add a second subject.",
      "The subject is 'the teacher', which is singular.",
    ],
    solution:
      "1. Phrases such as *along with*, *as well as* and *in addition to* are parenthetical and never join a second subject.\n2. The subject stays singular, so the verb must be *was*.\n\nAnswer: **The teacher along with the students was present.**",
    approach:
      "Cover the modifying phrase with a finger and read the sentence without it. The verb must agree with what is left.",
    tags: ["subject-verb agreement"],
    timeTargetSec: 60,
  },
  {
    slug: "sc4-neither-of-the-two",
    topic: "sentence-correction",
    title: "Neither of the two",
    prompt: "Choose the **correct** sentence:",
    options: [
      "Neither of the two candidates were selected.",
      "Neither of the two candidates was selected.",
      "Neither of the two candidate was selected.",
      "Neither of the two candidates have selected.",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "'Neither' is singular however many people follow it.",
      "After 'of the two' the noun stays plural.",
    ],
    solution:
      "1. *Neither* is the subject and is singular, so the verb is *was*.\n2. After *of the two* the noun is plural, so *candidates* is right and *candidate* is not.\n\nAnswer: **Neither of the two candidates was selected.**",
    approach:
      "Neither, each and every take a singular verb even when a plural noun sits between them and the verb.",
    tags: ["subject-verb agreement"],
    timeTargetSec: 60,
  },
  {
    slug: "sc4-since-versus-for",
    topic: "sentence-correction",
    title: "Since or for",
    prompt: "Choose the **correct** sentence about duration:",
    options: [
      "I have been living here since five years.",
      "I have been living here for five years.",
      "I am living here since five years.",
      "I live here since five years.",
    ],
    answer: 1,
    difficulty: "easy",
    hints: [
      "'Since' takes a point in time; 'for' takes a length of time.",
      "Five years is a length.",
    ],
    solution:
      "1. A duration takes *for*, so *for five years* is correct and *since five years* is not.\n2. The continuing action needs the present perfect continuous, *have been living*.\n\nAnswer: **I have been living here for five years.**",
    approach:
      "Since marks a starting point such as 2019 or Monday. For marks a stretch such as five years or an hour.",
    tags: ["prepositions"],
    timeTargetSec: 50,
  },
  {
    slug: "sc4-scarcely-when",
    topic: "sentence-correction",
    title: "Scarcely had I",
    prompt: "Fill in the blank:\n\n> Scarcely had I reached the station ______ the train left.",
    options: ["than", "then", "when", "that"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Each of these openers has a fixed partner.",
      "No sooner takes 'than'; scarcely and hardly take 'when'.",
    ],
    solution:
      "1. The fixed pairs are *no sooner … than*, *scarcely … when* and *hardly … when*.\n2. The sentence opens with *scarcely*, so the partner is **when**.\n\nAnswer: **when**.",
    approach:
      "Learn these correlative pairs as units. Mixing 'no sooner … when' or 'scarcely … than' is the error the question tests.",
    tags: ["conjunctions"],
    timeTargetSec: 55,
  },
];

import type { AptitudeSeed } from "./types.js";

/**
 * Data interpretation: tables, charts described in text, and caselets. Tables
 * are GFM markdown so the frontend renders them properly; every question can
 * be answered from the data given, with no outside knowledge.
 */

const SALES_TABLE = `| Year | Product A | Product B | Product C | Total |
|------|-----------|-----------|-----------|-------|
| 2022 | 120       | 180       | 100       | 400   |
| 2023 | 150       | 200       | 130       | 480   |
| 2024 | 210       | 190       | 200       | 600   |
| 2025 | 240       | 260       | 250       | 750   |`;

const MARKS_TABLE = `| Student | Maths | Physics | Chemistry | English |
|---------|-------|---------|-----------|---------|
| Aditi   | 88    | 76      | 92        | 71      |
| Bhavesh | 74    | 85      | 68        | 80      |
| Chirag  | 91    | 90      | 79        | 65      |
| Divya   | 66    | 72      | 84        | 88      |`;

export const DATA_INTERPRETATION: AptitudeSeed[] = [
  /* ── Tables & Charts ───────────────────────────────────────────── */
  {
    slug: "di-sales-growth-percent",
    topic: "tables-and-charts",
    title: "Growth in total sales",
    prompt: `Sales of three products, in thousands of units:\n\n${SALES_TABLE}\n\nBy what **percentage** did total sales grow from **2022 to 2025**?`,
    options: ["75%", "80%", "87.5%", "90%"],
    answer: 2,
    difficulty: "easy",
    hints: ["Read the Total column for 2022 and 2025.", "Growth = (750 − 400) / 400."],
    solution:
      "1. Total in 2022 = 400; in 2025 = 750.\n2. Increase = 350.\n3. Percentage growth = 350/400 × 100 = **87.5%**.\n\nAnswer: **87.5%**.",
    approach:
      "Percentage growth is always measured against the earlier value. Read the two numbers straight from the table rather than re-adding the rows — a totals column exists to be used.",
    tags: ["growth"],
    timeTargetSec: 60,
  },
  {
    slug: "di-sales-share-of-b",
    topic: "tables-and-charts",
    title: "Share of Product B",
    prompt: `${SALES_TABLE}\n\nIn which year did **Product B** account for the **largest share** of total sales?`,
    options: ["2022", "2023", "2024", "2025"],
    answer: 0,
    difficulty: "medium",
    hints: ["Compare B as a fraction of the total, not B's absolute value.", "180/400 is already 45%."],
    solution:
      "1. 2022: 180/400 = 45.0%\n2. 2023: 200/480 = 41.7%\n3. 2024: 190/600 = 31.7%\n4. 2025: 260/750 = 34.7%\n\nThe largest share is in **2022**.\n\nAnswer: **2022**.",
    approach:
      "Share questions ask for a ratio, not a maximum. B's absolute sales peak in 2025, which is the trap; its share peaks in 2022 because the total was small.",
    tags: ["share"],
    timeTargetSec: 90,
  },
  {
    slug: "di-sales-average-product-c",
    topic: "tables-and-charts",
    title: "Average sales of Product C",
    prompt: `${SALES_TABLE}\n\nWhat were the **average annual sales** of **Product C** over the four years?`,
    options: ["160", "170", "180", "195"],
    answer: 1,
    difficulty: "easy",
    hints: ["Add the four values in the Product C column.", "100 + 130 + 200 + 250 = 680."],
    solution: "1. Product C: 100 + 130 + 200 + 250 = 680.\n2. Average = 680 / 4 = **170**.\n\nAnswer: **170**.",
    approach: "Read down the single column the question names and ignore the rest of the table. Most reading errors in data interpretation are picking up a neighbouring column.",
    tags: ["average"],
    timeTargetSec: 50,
  },
  {
    slug: "di-sales-ratio-a-to-c",
    topic: "tables-and-charts",
    title: "Ratio of A to C over four years",
    prompt: `${SALES_TABLE}\n\nWhat is the ratio of **total Product A sales** to **total Product C sales** across all four years?`,
    options: ["18 : 17", "17 : 18", "12 : 13", "36 : 34"],
    answer: 0,
    difficulty: "medium",
    hints: ["Total A = 120 + 150 + 210 + 240; total C = 100 + 130 + 200 + 250.", "720 : 680 — now reduce it."],
    solution:
      "1. Product A total = 120 + 150 + 210 + 240 = 720.\n2. Product C total = 100 + 130 + 200 + 250 = 680.\n3. 720 : 680 = 72 : 68 = **18 : 17**.\n\nAnswer: **18 : 17**.",
    approach: "Add first, reduce last. Dividing both sides by their HCF (40 here) turns an unwieldy ratio into one that matches an option directly.",
    tags: ["ratio"],
    timeTargetSec: 75,
  },
  {
    slug: "di-marks-highest-average",
    topic: "tables-and-charts",
    title: "Who has the highest average?",
    prompt: `Marks out of 100 in four subjects:\n\n${MARKS_TABLE}\n\nWhich student has the **highest average** across the four subjects?`,
    options: ["Divya", "Aditi", "Bhavesh", "Chirag"],
    answer: 1,
    difficulty: "easy",
    hints: ["Sum each row; the highest sum wins, since all rows have four subjects.", "Aditi: 88 + 76 + 92 + 71 = 327."],
    solution:
      "1. Aditi: 88 + 76 + 92 + 71 = **327**\n2. Bhavesh: 74 + 85 + 68 + 80 = 307\n3. Chirag: 91 + 90 + 79 + 65 = 325\n4. Divya: 66 + 72 + 84 + 88 = 310\n\nEvery student sat the same four subjects, so the highest total is also the highest average. Aditi leads Chirag by two marks.\n\nAnswer: **Aditi**.",
    approach: "When every row has the same number of entries, compare totals and skip the division entirely.",
    tags: ["average"],
    timeTargetSec: 75,
  },
  {
    slug: "di-marks-subject-average",
    topic: "tables-and-charts",
    title: "Average marks in Physics",
    prompt: `${MARKS_TABLE}\n\nWhat is the **average mark in Physics** across the four students?`,
    options: ["79.25", "80.75", "81.25", "82.00"],
    answer: 1,
    difficulty: "easy",
    hints: ["Read down the Physics column: 76, 85, 90, 72.", "Their sum is 323."],
    solution: "1. Physics marks, read down the column: 76 + 85 + 90 + 72 = 323.\n2. Average = 323 / 4 = **80.75**.\n\nAnswer: **80.75**.",
    approach: "Read down a column for a subject and across a row for a student. Saying which direction you need before you start prevents the commonest error in table questions.",
    tags: ["average"],
    timeTargetSec: 50,
  },

  /* ── Caselets ──────────────────────────────────────────────────── */
  {
    slug: "di-caselet-office-staff",
    topic: "caselets",
    title: "Staff in an office",
    prompt:
      "An office employs **240** people. **60%** work in engineering, and of those, **one quarter** are women. Among the remaining staff, **half** are women.\n\nHow many **women** work in the office altogether?",
    options: ["72", "84", "90", "96"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Engineering headcount = 60% of 240.",
      "Women in engineering = a quarter of 144; women elsewhere = half of the remaining 96.",
    ],
    solution:
      "1. Engineering = 60% of 240 = 144; the rest = 96.\n2. Women in engineering = 144 / 4 = 36.\n3. Women elsewhere = 96 / 2 = 48.\n4. Total women = 36 + 48 = **84**.\n\nAnswer: **84**.",
    approach:
      "Split a caselet into a small table as you read: group, headcount, then the breakdown. Percentages of subgroups must be applied to that subgroup's headcount, never to the whole.",
    tags: ["percentages"],
    timeTargetSec: 90,
  },
  {
    slug: "di-caselet-library-books",
    topic: "caselets",
    title: "Books in a library",
    prompt:
      "A library holds **5,000** books. **40%** are fiction, **35%** are non-fiction, and the rest are reference. During a year, **10%** of the fiction and **20%** of the reference books are borrowed at least once.\n\nHow many books were borrowed at least once?",
    options: ["350", "450", "500", "550"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Reference = 100% − 40% − 35% = 25% of 5,000.",
      "Only fiction and reference are borrowed here — non-fiction is not counted.",
    ],
    solution:
      "1. Fiction = 40% of 5,000 = 2,000. Reference = 100% − 40% − 35% = 25% of 5,000 = 1,250.\n2. Borrowed fiction = 10% of 2,000 = 200.\n3. Borrowed reference = 20% of 1,250 = 250.\n4. Non-fiction is never borrowed in this caselet, so the total is 200 + 250 = **450**.\n\nAnswer: **450**.",
    approach:
      "Compute the missing category from the percentages that are given, then apply each rate only to the category it belongs to. The category the question stays silent about is usually the trap.",
    tags: ["percentages"],
    timeTargetSec: 90,
  },
  {
    slug: "di-caselet-two-shops",
    topic: "caselets",
    title: "Revenue at two shops",
    prompt:
      "Shop X sells **300** units at **₹40** each; Shop Y sells **250** units at **₹50** each. Both give a **10% discount** on the listed price.\n\nWhat is the **combined revenue** after the discount?",
    options: ["₹20,250", "₹21,150", "₹22,050", "₹24,500"],
    answer: 2,
    difficulty: "medium",
    hints: ["Compute each shop's gross revenue first.", "A 10% discount leaves 90% of the total."],
    solution:
      "1. Shop X gross = 300 × 40 = 12,000. Shop Y gross = 250 × 50 = 12,500.\n2. Combined gross = 24,500.\n3. After a 10% discount: 24,500 × 0.9 = **₹22,050**.\n\nAnswer: **₹22,050**.",
    approach:
      "When the same percentage applies to every part, apply it once to the total rather than to each part. Fewer multiplications means fewer chances to slip.",
    tags: ["revenue"],
    timeTargetSec: 75,
  },
  {
    slug: "di-caselet-exam-results",
    topic: "caselets",
    title: "Pass rates in two sections",
    prompt:
      "Section A has **50** students of whom **80%** passed. Section B has **30** students of whom **60%** passed.\n\nWhat is the **overall pass percentage** across both sections?",
    options: ["70%", "72.5%", "75%", "77.5%"],
    answer: 1,
    difficulty: "medium",
    hints: ["Do not average 80 and 60 — the sections differ in size.", "Count the passes: 40 and 18."],
    solution:
      "1. Section A passes = 80% of 50 = 40. Section B passes = 60% of 30 = 18.\n2. Total passes = 58 out of 80 students.\n3. Overall = 58/80 × 100 = **72.5%**.\n\nAnswer: **72.5%**.",
    approach:
      "An overall percentage is total favourable ÷ total, never the average of two percentages. The simple average of 80 and 60 gives 70, which is offered here precisely because it is wrong.",
    tags: ["weighted average"],
    timeTargetSec: 75,
  },
  {
    slug: "di-caselet-production-target",
    topic: "caselets",
    title: "Meeting a production target",
    prompt:
      "A factory must produce **12,000** units in a month. In the first **18 days** it produced **6,300** units. The month has **30 days**.\n\nHow many units per day must it average over the remaining days to meet the target?",
    options: ["450", "475", "500", "525"],
    answer: 1,
    difficulty: "easy",
    hints: ["Units remaining = 12,000 − 6,300.", "Days remaining = 30 − 18 = 12."],
    solution:
      "1. Remaining units = 12,000 − 6,300 = 5,700.\n2. Remaining days = 30 − 18 = 12.\n3. Required average = 5,700 / 12 = **475** units per day.\n\nAnswer: **475**.",
    approach: "Work with what is left, not with what was done. Remaining work ÷ remaining time is the whole of this question type.",
    tags: ["rates"],
    timeTargetSec: 60,
  },
  {
    slug: "di-caselet-travel-budget",
    topic: "caselets",
    title: "Splitting a travel budget",
    prompt:
      "A team's travel budget of **₹90,000** is split between flights, hotels and meals in the ratio **5 : 3 : 1**. Flights later cost **10% less** than budgeted, and the saving is added to meals.\n\nWhat is the **final meals** budget?",
    options: ["₹10,000", "₹12,500", "₹15,000", "₹17,500"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Total parts = 5 + 3 + 1 = 9, so one part is ₹10,000.",
      "Flights were budgeted at ₹50,000; a 10% saving is ₹5,000.",
    ],
    solution:
      "1. One part = 90,000 / 9 = 10,000. Flights = 50,000, hotels = 30,000, meals = 10,000.\n2. Flights cost 10% less: a saving of 5,000.\n3. Meals = 10,000 + 5,000 = **₹15,000**.\n\nAnswer: **₹15,000**.",
    approach:
      "Convert the ratio into money once, then treat the adjustments as ordinary arithmetic. Re-deriving the ratio after each change is where these questions become slow.",
    tags: ["ratio"],
    timeTargetSec: 105,
  },
];

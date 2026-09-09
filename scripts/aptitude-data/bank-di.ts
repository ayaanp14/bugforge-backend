import type { AptitudeSeed } from "./types.js";

/**
 * Data interpretation: tables, charts described as tables, and caselets.
 * Every question is answerable from the data given, with no outside knowledge.
 */

const REVENUE_TABLE = `| Company | 2022 | 2023 | 2024 | 2025 |
|---------|------|------|------|------|
| Alpha   | 120  | 150  | 180  | 210  |
| Beta    | 200  | 180  | 240  | 300  |
| Gamma   | 80   | 120  | 160  | 240  |
| Delta   | 160  | 200  | 180  | 250  |`;

const STUDENT_TABLE = `| Stream     | Boys | Girls | Total |
|------------|------|-------|-------|
| Science    | 240  | 160   | 400   |
| Commerce   | 180  | 120   | 300   |
| Arts       | 80   | 220   | 300   |
| **Total**  | 500  | 500   | 1000  |`;

const EXPENSE_TABLE = `| Head          | Percentage |
|---------------|------------|
| Salaries      | 35%        |
| Rent          | 20%        |
| Marketing     | 15%        |
| Raw materials | 25%        |
| Others        | 5%         |`;

const PRODUCTION_TABLE = `| Month     | Unit A | Unit B | Unit C |
|-----------|--------|--------|--------|
| January   | 400    | 300    | 500    |
| February  | 450    | 350    | 400    |
| March     | 500    | 400    | 600    |
| April     | 550    | 450    | 450    |`;

export const BANK_DI: AptitudeSeed[] = [
  /* ── Revenue table ─────────────────────────────────────────────── */
  {
    slug: "di2-revenue-highest-growth",
    topic: "tables-and-charts",
    title: "Highest percentage growth",
    prompt: `Revenue of four companies, in ₹ crore:\n\n${REVENUE_TABLE}\n\nWhich company recorded the **highest percentage growth** from **2022 to 2025**?`,
    options: ["Alpha", "Beta", "Gamma", "Delta"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Compare growth as a ratio, not as an absolute increase.",
      "Gamma went from 80 to 240 — that is a tripling.",
    ],
    solution:
      "1. Alpha: 120 → 210, a rise of 75%.\n2. Beta: 200 → 300, a rise of 50%.\n3. Gamma: 80 → 240, a rise of 200%.\n4. Delta: 160 → 250, a rise of about 56%.\n\nThe highest is **Gamma**.\n\nAnswer: **Gamma**.",
    approach:
      "Percentage growth divides by the starting value, so a small base can beat a large absolute rise. Beta's increase of 100 is the largest in rupees but far from the largest in percent.",
    tags: ["growth"],
    timeTargetSec: 105,
  },
  {
    slug: "di2-revenue-total-2024",
    topic: "tables-and-charts",
    title: "Total revenue in a year",
    prompt: `${REVENUE_TABLE}\n\nWhat was the **combined revenue** of all four companies in **2024**?`,
    options: ["₹700 crore", "₹740 crore", "₹760 crore", "₹800 crore"],
    answer: 2,
    difficulty: "easy",
    hints: ["Add down the 2024 column.", "180 + 240 + 160 + 180."],
    solution: "1. 180 + 240 + 160 + 180 = **760**.\n2. So the combined revenue was ₹760 crore.\n\nAnswer: **₹760 crore**.",
    approach: "Read strictly down the named column. Picking up a neighbouring year is the commonest error in table questions.",
    tags: ["totals"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-revenue-share-of-beta",
    topic: "tables-and-charts",
    title: "Beta's share of the total",
    prompt: `${REVENUE_TABLE}\n\nIn **2025**, Beta's revenue was approximately what **percentage of the combined total**?`,
    options: ["25%", "30%", "35%", "40%"],
    answer: 1,
    difficulty: "medium",
    hints: ["Total for 2025 = 210 + 300 + 240 + 250.", "300 out of 1,000."],
    solution:
      "1. Total in 2025 = 210 + 300 + 240 + 250 = 1,000.\n2. Beta's share = 300/1,000 = **30%**.\n\nAnswer: **30%**.",
    approach: "Compute the total once, then divide. A total that comes out round is usually a sign the arithmetic is right.",
    tags: ["share"],
    timeTargetSec: 75,
  },
  {
    slug: "di2-revenue-average-alpha",
    topic: "tables-and-charts",
    title: "Alpha's average revenue",
    prompt: `${REVENUE_TABLE}\n\nWhat was **Alpha's average annual revenue** over the four years?`,
    options: ["₹150 crore", "₹160 crore", "₹165 crore", "₹180 crore"],
    answer: 2,
    difficulty: "easy",
    hints: ["Add Alpha's row: 120 + 150 + 180 + 210.", "660 over four years."],
    solution: "1. Alpha's total = 120 + 150 + 180 + 210 = 660.\n2. Average = 660 ÷ 4 = **₹165 crore**.\n\nAnswer: **₹165 crore**.",
    approach: "Read across the row for one company and down the column for one year. Saying which direction you need before starting avoids the usual slip.",
    tags: ["average"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-revenue-ratio",
    topic: "tables-and-charts",
    title: "A ratio across two years",
    prompt: `${REVENUE_TABLE}\n\nWhat is the ratio of **Gamma's 2023 revenue** to **Delta's 2023 revenue**?`,
    options: ["2 : 3", "3 : 5", "3 : 4", "4 : 5"],
    answer: 1,
    difficulty: "easy",
    hints: ["Gamma in 2023 is 120; Delta is 200.", "Reduce 120 : 200."],
    solution: "1. Gamma = 120, Delta = 200.\n2. 120 : 200 = 12 : 20 = **3 : 5**.\n\nAnswer: **3 : 5**.",
    approach: "Reduce the ratio fully before matching it to an option. Dividing both sides by their HCF, 40, gives the simplest form at once.",
    tags: ["ratio"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-revenue-decline",
    topic: "tables-and-charts",
    title: "The only decline",
    prompt: `${REVENUE_TABLE}\n\nIn which year did a company's revenue **fall** compared with the previous year?`,
    options: ["Only in 2023", "Only in 2024", "In both 2023 and 2024", "In no year"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Scan each row for a year where the figure drops.",
      "Beta fell from 200 to 180, and Delta from 200 to 180.",
    ],
    solution:
      "1. Beta fell from 200 in 2022 to 180 in 2023.\n2. Delta fell from 200 in 2023 to 180 in 2024.\n3. So declines occurred **in both 2023 and 2024**.\n\nAnswer: **In both 2023 and 2024**.",
    approach: "Scan every row rather than stopping at the first decline found. Questions of this shape often have more than one instance.",
    tags: ["trends"],
    timeTargetSec: 90,
  },

  /* ── Student table ─────────────────────────────────────────────── */
  {
    slug: "di2-students-percentage-girls",
    topic: "tables-and-charts",
    title: "Percentage of girls in a stream",
    prompt: `Students by stream and sex:\n\n${STUDENT_TABLE}\n\nWhat **percentage of Arts students** are **girls**?`,
    options: ["66⅔%", "70%", "73⅓%", "75%"],
    answer: 2,
    difficulty: "medium",
    hints: ["Arts has 220 girls out of 300 students.", "220/300 as a percentage."],
    solution:
      "1. Arts: 220 girls out of 300 students.\n2. 220/300 = 11/15 = **73⅓%**.\n\nAnswer: **73⅓%**.",
    approach: "The base is the stream total, not the total number of girls in the school. Choosing the wrong base is what the distractors test.",
    tags: ["share"],
    timeTargetSec: 75,
  },
  {
    slug: "di2-students-ratio-boys-girls",
    topic: "tables-and-charts",
    title: "Ratio of boys to girls",
    prompt: `${STUDENT_TABLE}\n\nWhat is the ratio of **boys to girls in Science**?`,
    options: ["2 : 3", "3 : 2", "4 : 3", "3 : 4"],
    answer: 1,
    difficulty: "easy",
    hints: ["Science has 240 boys and 160 girls.", "Reduce 240 : 160."],
    solution: "1. 240 : 160 = 24 : 16 = **3 : 2**.\n\nAnswer: **3 : 2**.",
    approach: "Keep the order the question asks for: boys first, girls second. Reversing it gives 2 : 3, which is offered.",
    tags: ["ratio"],
    timeTargetSec: 50,
  },
  {
    slug: "di2-students-share-of-total",
    topic: "tables-and-charts",
    title: "Science as a share of the school",
    prompt: `${STUDENT_TABLE}\n\nWhat **percentage of all students** study **Science**?`,
    options: ["30%", "35%", "40%", "45%"],
    answer: 2,
    difficulty: "easy",
    hints: ["Science has 400 students out of 1,000.", "400/1000."],
    solution: "1. 400 out of 1,000 = **40%**.\n\nAnswer: **40%**.",
    approach: "The totals row is given, so use it rather than re-adding the columns. That is what a totals row is for.",
    tags: ["share"],
    timeTargetSec: 45,
  },
  {
    slug: "di2-students-more-boys",
    topic: "tables-and-charts",
    title: "Where boys outnumber girls",
    prompt: `${STUDENT_TABLE}\n\nIn how many streams do **boys outnumber girls**?`,
    options: ["One", "Two", "Three", "None"],
    answer: 1,
    difficulty: "easy",
    hints: ["Compare the two figures in each row.", "Science and Commerce have more boys; Arts has more girls."],
    solution:
      "1. Science: 240 boys against 160 girls — boys lead.\n2. Commerce: 180 against 120 — boys lead.\n3. Arts: 80 against 220 — girls lead.\n4. So boys outnumber girls in **two** streams.\n\nAnswer: **Two**.",
    approach: "Row-by-row comparison, no arithmetic needed. Note that the overall totals are equal, which is why one stream must be lopsided the other way.",
    tags: ["comparison"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-students-difference",
    topic: "tables-and-charts",
    title: "The largest gap",
    prompt: `${STUDENT_TABLE}\n\nIn which stream is the **difference between boys and girls** the greatest?`,
    options: ["Science", "Commerce", "Arts", "Science and Arts equally"],
    answer: 2,
    difficulty: "medium",
    hints: ["Compute the gap in each row.", "Science 80, Commerce 60, Arts 140."],
    solution:
      "1. Science: 240 − 160 = 80.\n2. Commerce: 180 − 120 = 60.\n3. Arts: 220 − 80 = 140.\n4. The greatest gap is in **Arts**.\n\nAnswer: **Arts**.",
    approach: "Take the absolute difference regardless of which sex leads. The direction of the gap does not matter unless the question says so.",
    tags: ["comparison"],
    timeTargetSec: 60,
  },

  /* ── Expenditure table ─────────────────────────────────────────── */
  {
    slug: "di2-expense-amount",
    topic: "tables-and-charts",
    title: "Spending on one head",
    prompt: `A company's expenditure is broken down as follows:\n\n${EXPENSE_TABLE}\n\nIf the **total expenditure is ₹80 lakh**, how much is spent on **salaries**?`,
    options: ["₹24 lakh", "₹26 lakh", "₹28 lakh", "₹32 lakh"],
    answer: 2,
    difficulty: "easy",
    hints: ["Salaries take 35% of the total.", "35% of 80."],
    solution: "1. 35% of ₹80 lakh = 0.35 × 80 = **₹28 lakh**.\n\nAnswer: **₹28 lakh**.",
    approach: "A percentage table converts to money in one multiplication once the total is known.",
    tags: ["percentages"],
    timeTargetSec: 50,
  },
  {
    slug: "di2-expense-difference",
    topic: "tables-and-charts",
    title: "Difference between two heads",
    prompt: `${EXPENSE_TABLE}\n\nIf the total expenditure is **₹60 lakh**, by how much does spending on **raw materials** exceed spending on **marketing**?`,
    options: ["₹4 lakh", "₹6 lakh", "₹8 lakh", "₹10 lakh"],
    answer: 1,
    difficulty: "medium",
    hints: ["The gap is 25% − 15% = 10 percentage points.", "10% of 60."],
    solution:
      "1. Raw materials 25%, marketing 15%, so the gap is 10 percentage points.\n2. 10% of ₹60 lakh = **₹6 lakh**.\n\nAnswer: **₹6 lakh**.",
    approach: "Subtract the percentages first, then apply the difference once. Computing both amounts separately gives the same answer with more steps.",
    tags: ["percentages"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-expense-ratio",
    topic: "tables-and-charts",
    title: "Ratio of two heads",
    prompt: `${EXPENSE_TABLE}\n\nWhat is the ratio of spending on **rent** to spending on **marketing**?`,
    options: ["3 : 4", "4 : 3", "3 : 2", "2 : 1"],
    answer: 1,
    difficulty: "easy",
    hints: ["Rent is 20% and marketing is 15%.", "Reduce 20 : 15."],
    solution: "1. 20 : 15 = **4 : 3**.\n\nAnswer: **4 : 3**.",
    approach: "Ratios of percentages need no conversion to money — the total cancels out of both sides.",
    tags: ["ratio"],
    timeTargetSec: 45,
  },
  {
    slug: "di2-expense-total-from-part",
    topic: "tables-and-charts",
    title: "Total from one head",
    prompt: `${EXPENSE_TABLE}\n\nIf spending on **rent is ₹15 lakh**, what is the **total expenditure**?`,
    options: ["₹60 lakh", "₹70 lakh", "₹75 lakh", "₹80 lakh"],
    answer: 2,
    difficulty: "medium",
    hints: ["Rent is 20% of the total.", "15 ÷ 0.20."],
    solution: "1. 20% of the total = ₹15 lakh.\n2. Total = 15 ÷ 0.20 = **₹75 lakh**.\n\nAnswer: **₹75 lakh**.",
    approach: "Going from a part back to the whole is a division by the percentage. Multiplying instead is the standard error.",
    tags: ["percentages"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-expense-angle",
    topic: "tables-and-charts",
    title: "The angle in a pie chart",
    prompt: `${EXPENSE_TABLE}\n\nIf this data were shown as a **pie chart**, what would be the **central angle** for **raw materials**?`,
    options: ["72°", "80°", "90°", "108°"],
    answer: 2,
    difficulty: "medium",
    hints: ["A full circle is 360° and represents 100%.", "25% of 360°."],
    solution: "1. Raw materials take 25% of the total.\n2. Angle = 25% of 360° = **90°**.\n\nAnswer: **90°**.",
    approach: "Each percentage point is 3.6° of the circle. Multiplying the percentage by 3.6 gives the angle directly.",
    tags: ["pie chart"],
    timeTargetSec: 60,
  },

  /* ── Production table ──────────────────────────────────────────── */
  {
    slug: "di2-production-total-unit",
    topic: "tables-and-charts",
    title: "Total output of one unit",
    prompt: `Monthly production, in units:\n\n${PRODUCTION_TABLE}\n\nWhat was **Unit B's total production** over the four months?`,
    options: ["1,400", "1,500", "1,600", "1,700"],
    answer: 1,
    difficulty: "easy",
    hints: ["Read down the Unit B column.", "300 + 350 + 400 + 450."],
    solution: "1. 300 + 350 + 400 + 450 = **1,500**.\n\nAnswer: **1,500**.",
    approach: "Read down the named column. The figures here rise by 50 each month, which is a quick check on the addition.",
    tags: ["totals"],
    timeTargetSec: 50,
  },
  {
    slug: "di2-production-highest-month",
    topic: "tables-and-charts",
    title: "The busiest month",
    prompt: `${PRODUCTION_TABLE}\n\nIn which month was **total production across all three units** the highest?`,
    options: ["January", "February", "March", "April"],
    answer: 2,
    difficulty: "medium",
    hints: ["Add each row.", "March gives 500 + 400 + 600."],
    solution:
      "1. January: 400 + 300 + 500 = 1,200.\n2. February: 450 + 350 + 400 = 1,200.\n3. March: 500 + 400 + 600 = 1,500.\n4. April: 550 + 450 + 450 = 1,450.\n\nThe highest is **March**.\n\nAnswer: **March**.",
    approach: "Add every row before deciding. April has the highest figures in two of three columns yet still falls short of March.",
    tags: ["totals"],
    timeTargetSec: 90,
  },
  {
    slug: "di2-production-average-per-month",
    topic: "tables-and-charts",
    title: "Average monthly output",
    prompt: `${PRODUCTION_TABLE}\n\nWhat was the **average monthly production of Unit C**?`,
    options: ["475", "487.5", "500", "512.5"],
    answer: 1,
    difficulty: "medium",
    hints: ["Unit C: 500 + 400 + 600 + 450.", "1,950 over four months."],
    solution: "1. Unit C total = 500 + 400 + 600 + 450 = 1,950.\n2. Average = 1,950 ÷ 4 = **487.5**.\n\nAnswer: **487.5**.",
    approach: "A non-integer average is perfectly normal. Rounding to a whole number would land on a distractor.",
    tags: ["average"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-production-percentage-increase",
    topic: "tables-and-charts",
    title: "Growth from January to April",
    prompt: `${PRODUCTION_TABLE}\n\nBy what **percentage** did **Unit A's production** increase from **January to April**?`,
    options: ["27.5%", "33.5%", "37.5%", "40%"],
    answer: 2,
    difficulty: "medium",
    hints: ["Unit A went from 400 to 550.", "The increase of 150 is measured against 400."],
    solution:
      "1. Increase = 550 − 400 = 150.\n2. Percentage = 150/400 × 100 = **37.5%**.\n\nAnswer: **37.5%**.",
    approach: "Percentage growth is always measured against the earlier value, never the later one.",
    tags: ["growth"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-production-which-unit-fell",
    topic: "tables-and-charts",
    title: "Which unit fell",
    prompt: `${PRODUCTION_TABLE}\n\nWhich unit's production **fell** from **March to April**?`,
    options: ["Unit A", "Unit B", "Unit C", "None of them"],
    answer: 2,
    difficulty: "easy",
    hints: ["Compare the March and April rows column by column.", "Unit C went from 600 to 450."],
    solution:
      "1. Unit A: 500 → 550, a rise.\n2. Unit B: 400 → 450, a rise.\n3. Unit C: 600 → 450, a fall.\n\nAnswer: **Unit C**.",
    approach: "Compare the two rows one column at a time. Only one column needs to fall for the answer to be that unit.",
    tags: ["trends"],
    timeTargetSec: 60,
  },

  /* ── Caselets ──────────────────────────────────────────────────── */
  {
    slug: "di2-caselet-college-admissions",
    topic: "caselets",
    title: "Admissions across three colleges",
    prompt:
      "Three colleges admitted **1,200 students** in all. College A took **40%** of them, College B took **35%**, and College C took the rest. Of College A's intake, **one quarter** were from outside the state.\n\nHow many of **College A's students** were from **outside the state**?",
    options: ["100", "120", "140", "160"],
    answer: 1,
    difficulty: "medium",
    hints: ["College A took 40% of 1,200.", "A quarter of 480."],
    solution:
      "1. College A's intake = 40% of 1,200 = 480.\n2. Outside the state = 480 ÷ 4 = **120**.\n\nAnswer: **120**.",
    approach: "Apply each percentage to its own base in order. The quarter is of College A's intake, not of the 1,200.",
    tags: ["percentages"],
    timeTargetSec: 75,
  },
  {
    slug: "di2-caselet-college-c",
    topic: "caselets",
    title: "The remaining college",
    prompt:
      "Three colleges admitted **1,200 students** in all. College A took **40%**, College B took **35%**, and College C took the rest.\n\nHow many students did **College C** admit?",
    options: ["240", "300", "360", "420"],
    answer: 1,
    difficulty: "easy",
    hints: ["C's share is 100% − 40% − 35%.", "25% of 1,200."],
    solution:
      "1. College C's share = 100 − 40 − 35 = 25%.\n2. 25% of 1,200 = **300**.\n\nAnswer: **300**.",
    approach: "Work out the missing percentage first, then apply it once. Subtracting the two known headcounts gives the same result.",
    tags: ["percentages"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-caselet-factory-shifts",
    topic: "caselets",
    title: "Two shifts in a factory",
    prompt:
      "A factory runs two shifts. The **day shift** has **120 workers** producing **15 units each**; the **night shift** has **80 workers** producing **12 units each**.\n\nWhat is the **average output per worker** across both shifts?",
    options: ["13.2", "13.8", "14.0", "14.4"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Total output = 120 × 15 + 80 × 12.",
      "Divide by the 200 workers.",
    ],
    solution:
      "1. Day output = 120 × 15 = 1,800. Night output = 80 × 12 = 960.\n2. Total = 2,760 units across 200 workers.\n3. Average = 2,760 ÷ 200 = **13.8**.\n\nAnswer: **13.8**.",
    approach:
      "A weighted average, so it leans towards the larger group — here towards 15. Averaging 15 and 12 to get 13.5 ignores the unequal shift sizes.",
    tags: ["weighted average"],
    timeTargetSec: 90,
  },
  {
    slug: "di2-caselet-shop-profit",
    topic: "caselets",
    title: "Profit across two products",
    prompt:
      "A shop sells **200 units of product X at ₹50 each**, on which it makes **20% profit**, and **150 units of product Y at ₹80 each**, on which it makes **25% profit**.\n\nWhat is the shop's **total profit**?",
    options: ["₹4,400", "₹4,600", "₹4,800", "₹5,000"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "The margins are on the sales value of each line.",
      "Compute the revenue of each product first: ₹10,000 and ₹12,000.",
    ],
    solution:
      "1. Revenue from X = 200 × 50 = ₹10,000; profit at 20% = ₹2,000.\n2. Revenue from Y = 150 × 80 = ₹12,000; profit at 25% = ₹3,000.\n3. Total profit = 2,000 + 3,000 = **₹5,000**.\n\nAnswer: **₹5,000**.",
    approach: "Compute each product line separately and add. The two margins apply to different revenues, so they cannot be averaged.",
    tags: ["profit"],
    timeTargetSec: 105,
  },
  {
    slug: "di2-caselet-survey",
    topic: "caselets",
    title: "A survey of readers",
    prompt:
      "In a survey of **500 people**, **280 read newspaper A**, **220 read newspaper B**, and **90 read both**.\n\nHow many read **neither** newspaper?",
    options: ["80", "90", "100", "110"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Readers of at least one = 280 + 220 − 90.",
      "Subtract that from 500.",
    ],
    solution:
      "1. At least one = 280 + 220 − 90 = 410.\n2. Neither = 500 − 410 = **90**.\n\nAnswer: **90**.",
    approach: "Add the two groups, subtract the overlap once, then take the complement. Forgetting the overlap gives 0, which is impossible.",
    tags: ["set theory"],
    timeTargetSec: 75,
  },
  {
    slug: "di2-caselet-survey-only-a",
    topic: "caselets",
    title: "Readers of only one paper",
    prompt:
      "In a survey of **500 people**, **280 read newspaper A**, **220 read newspaper B**, and **90 read both**.\n\nHow many read **only newspaper A**?",
    options: ["170", "190", "200", "220"],
    answer: 1,
    difficulty: "easy",
    hints: ["Only A = readers of A minus those who read both.", "280 − 90."],
    solution: "1. Only A = 280 − 90 = **190**.\n\nAnswer: **190**.",
    approach: "'Only A' removes the overlap from A's total. The same subtraction on B gives 130, and 190 + 130 + 90 = 410 as a check.",
    tags: ["set theory"],
    timeTargetSec: 50,
  },
  {
    slug: "di2-caselet-budget-split",
    topic: "caselets",
    title: "Splitting a project budget",
    prompt:
      "A project budget of **₹4,80,000** is divided between **design, build and testing** in the ratio **3 : 5 : 4**. Half of the **testing** budget is later moved to **build**.\n\nWhat is the **final build budget**?",
    options: ["₹2,00,000", "₹2,80,000", "₹3,00,000", "₹3,20,000"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Total parts = 12, so one part is ₹40,000.",
      "Testing starts at ₹1,60,000, and half of that moves across.",
    ],
    solution:
      "1. One part = 4,80,000 ÷ 12 = ₹40,000.\n2. Design = 1,20,000; build = 2,00,000; testing = 1,60,000.\n3. Half of testing = ₹80,000 moves to build.\n4. Final build = 2,00,000 + 80,000 = **₹2,80,000**.\n\nAnswer: **₹2,80,000**.",
    approach: "Convert the ratio into money once, then treat the transfer as ordinary arithmetic. Re-deriving the ratio after the change is slower and error-prone.",
    tags: ["ratio"],
    timeTargetSec: 105,
  },
  {
    slug: "di2-caselet-attendance",
    topic: "caselets",
    title: "Attendance over a week",
    prompt:
      "A training programme ran for **5 days**. Attendance was **80, 92, 76, 88 and 84**. Anyone attending on a given day counts once for that day.\n\nWhat was the **average daily attendance**?",
    options: ["82", "84", "86", "88"],
    answer: 1,
    difficulty: "easy",
    hints: ["Add the five figures.", "420 over five days."],
    solution: "1. Total = 80 + 92 + 76 + 88 + 84 = 420.\n2. Average = 420 ÷ 5 = **84**.\n\nAnswer: **84**.",
    approach: "Add carefully, then divide once. Pairing figures that sum neatly (80 + 84, 92 + 88) speeds the addition.",
    tags: ["average"],
    timeTargetSec: 60,
  },
  {
    slug: "di2-caselet-target-shortfall",
    topic: "caselets",
    title: "Meeting a sales target",
    prompt:
      "A salesperson must sell **600 units in a quarter**. In the first two months she sold **170 and 190 units**.\n\nHow many must she sell in the **third month** to exceed the target by **10%**?",
    options: ["240", "260", "280", "300"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Exceeding the target by 10% means reaching 660 units.",
      "She has already sold 360.",
    ],
    solution:
      "1. Target plus 10% = 600 × 1.10 = 660 units.\n2. Sold so far = 170 + 190 = 360.\n3. Required in the third month = 660 − 360 = **300**.\n\nAnswer: **300**.",
    approach: "Work out the adjusted target first, then subtract what has already been achieved.",
    tags: ["targets"],
    timeTargetSec: 90,
  },
  {
    slug: "di2-caselet-two-departments",
    topic: "caselets",
    title: "Two departments, one average",
    prompt:
      "A company has **40 employees in sales** averaging **₹30,000 a month** and **60 in engineering** averaging **₹50,000**.\n\nWhat is the **average salary** across the whole company?",
    options: ["₹38,000", "₹40,000", "₹42,000", "₹44,000"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Total pay = 40 × 30,000 + 60 × 50,000.",
      "Divide by 100 employees.",
    ],
    solution:
      "1. Sales total = ₹12,00,000; engineering total = ₹30,00,000.\n2. Combined = ₹42,00,000 across 100 employees.\n3. Average = **₹42,000**.\n\nAnswer: **₹42,000**.",
    approach: "The weighted average leans towards the larger department, so it sits above the midpoint of ₹40,000. That is a quick sanity check.",
    tags: ["weighted average"],
    timeTargetSec: 75,
  },
  {
    slug: "di2-caselet-discount-scheme",
    topic: "caselets",
    title: "A discount on part of the bill",
    prompt:
      "A restaurant bill comes to **₹2,400**. A **20% discount** applies to the **food portion of ₹1,500**, and the rest of the bill is charged in full.\n\nWhat is the **final amount payable**?",
    options: ["₹1,920", "₹2,100", "₹2,160", "₹2,280"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Only ₹1,500 is discounted; ₹900 is not.",
      "1,500 × 0.8 + 900.",
    ],
    solution:
      "1. Discounted food = 1,500 × 0.80 = ₹1,200.\n2. Remaining charges = 2,400 − 1,500 = ₹900, charged in full.\n3. Total = 1,200 + 900 = **₹2,100**.\n\nAnswer: **₹2,100**.",
    approach: "Split the bill into the discounted and undiscounted parts before applying anything. Discounting the whole ₹2,400 gives ₹1,920, the offered trap.",
    tags: ["percentages"],
    timeTargetSec: 90,
  },
  {
    slug: "di2-caselet-fuel-cost",
    topic: "caselets",
    title: "Fuel cost for a fleet",
    prompt:
      "A fleet of **12 vans** each travels **150 km a day**. Each van covers **10 km per litre**, and fuel costs **₹100 per litre**.\n\nWhat is the fleet's **daily fuel cost**?",
    options: ["₹15,000", "₹16,000", "₹18,000", "₹20,000"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Fuel per van = 150 ÷ 10 litres.",
      "Multiply by 12 vans and by ₹100.",
    ],
    solution:
      "1. Each van uses 150 ÷ 10 = 15 litres a day.\n2. Fleet usage = 12 × 15 = 180 litres.\n3. Cost = 180 × 100 = **₹18,000**.\n\nAnswer: **₹18,000**.",
    approach: "Work through the chain one unit at a time: kilometres to litres, litres to rupees. Skipping a step is where errors enter.",
    tags: ["rates"],
    timeTargetSec: 75,
  },
];

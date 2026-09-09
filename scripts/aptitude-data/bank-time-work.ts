import type { AptitudeSeed } from "./types.js";

/** Time and work, including pipes and cisterns — the standard exam set. */
export const BANK_TIME_WORK: AptitudeSeed[] = [
  {
    slug: "tw2-a10-b15-together",
    topic: "time-and-work",
    title: "A in 10 days, B in 15",
    prompt: "**A** can finish a job in **10 days** and **B** in **15 days**. Working together, how long do they take?",
    options: ["5 days", "6 days", "7 days", "8 days"],
    answer: 1,
    difficulty: "easy",
    hints: ["Take the work as 30 units, the LCM of 10 and 15.", "A does 3 units a day, B does 2."],
    solution:
      "1. Let the work be 30 units. A does 3 units/day, B does 2 units/day.\n2. Together they do 5 units/day.\n3. Time = 30 ÷ 5 = **6 days**.\n\nAnswer: **6 days**.",
    approach:
      "Take the total work as the LCM of the individual times so every rate is a whole number. This avoids fractions entirely and is the fastest method in this chapter.",
    tags: ["rates"],
    timeTargetSec: 45,
  },
  {
    slug: "tw2-a6-b10-together",
    topic: "time-and-work",
    title: "A in 6 days, B in 10",
    prompt: "**A** can do a piece of work in **6 days** and **B** in **10 days**. How long will they take **together**?",
    options: ["3.75 days", "4 days", "4.5 days", "5 days"],
    answer: 0,
    difficulty: "easy",
    hints: ["Work = 30 units; A does 5 a day and B does 3.", "30 ÷ 8."],
    solution:
      "1. Work = 30 units. A does 5 units/day, B does 3 units/day.\n2. Together = 8 units/day.\n3. Time = 30 ÷ 8 = **3.75 days**.\n\nAnswer: **3.75 days**.",
    approach: "The combined time is always less than the faster worker's time alone — a useful check before selecting an option.",
    tags: ["rates"],
    timeTargetSec: 45,
  },
  {
    slug: "tw2-together-8-a-12-b-alone",
    topic: "time-and-work",
    title: "Finding B's time alone",
    prompt:
      "**A and B together** can complete a work in **8 days**. **A alone** takes **12 days**. How long would **B alone** take?",
    options: ["16 days", "20 days", "24 days", "30 days"],
    answer: 2,
    difficulty: "easy",
    hints: ["Subtract A's rate from the combined rate.", "1/8 − 1/12."],
    solution:
      "1. Combined rate = 1/8; A's rate = 1/12.\n2. B's rate = 1/8 − 1/12 = 3/24 − 2/24 = 1/24.\n3. B alone takes **24 days**.\n\nAnswer: **24 days**.",
    approach: "Rates add and subtract; times do not. Subtracting 8 from 12 would give 4, which is nonsense since B must be slower than the pair.",
    tags: ["rates"],
    timeTargetSec: 50,
  },
  {
    slug: "tw2-twice-efficient-12",
    topic: "time-and-work",
    title: "Twice as fast",
    prompt:
      "**A works twice as fast as B**. Together they finish a job in **12 days**. How long would **B alone** take?",
    options: ["18 days", "24 days", "30 days", "36 days"],
    answer: 3,
    difficulty: "medium",
    hints: ["If B does 1 unit a day, A does 2, so together 3.", "Total work = 3 × 12 = 36 units."],
    solution:
      "1. Let B's rate be 1 unit/day; then A's is 2, and together 3 units/day.\n2. Total work = 3 × 12 = 36 units.\n3. B alone: 36 ÷ 1 = **36 days**.\n\nAnswer: **36 days**.",
    approach: "Efficiency ratios become rate ratios directly. Set the slowest rate to 1 unit and everything else follows without fractions.",
    tags: ["efficiency"],
    timeTargetSec: 60,
  },
  {
    slug: "tw2-three-times-good-60-less",
    topic: "time-and-work",
    title: "Three times as good, sixty days sooner",
    prompt:
      "**A is three times as good a workman as B** and takes **60 days less** than B to finish a job. How long do they take **working together**?",
    options: ["20 days", "22.5 days", "25 days", "30 days"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "If A is three times as fast, A takes one third of B's time.",
      "Let A take x days and B take 3x; then 3x − x = 60.",
    ],
    solution:
      "1. Let A take x days, so B takes 3x days. Then 3x − x = 60 → x = 30.\n2. A takes 30 days, B takes 90 days.\n3. Together: 1/30 + 1/90 = 3/90 + 1/90 = 4/90 = 2/45.\n4. Time = 45/2 = **22.5 days**.\n\nAnswer: **22.5 days**.",
    approach: "Three times as efficient means one third of the time, not three times the time. Fixing that relation first is the whole difficulty here.",
    tags: ["efficiency"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-25-percent-more-efficient",
    topic: "time-and-work",
    title: "Twenty-five percent more efficient",
    prompt:
      "**A is 25% more efficient than B** and takes **10 days less** to finish a job. How many days does **A** take?",
    options: ["30", "40", "45", "50"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "A's rate is 1.25 times B's, so A's time is B's ÷ 1.25 = 0.8 × B's.",
      "If B takes t days, A takes 0.8t, and t − 0.8t = 10.",
    ],
    solution:
      "1. A's time = B's time ÷ 1.25 = 0.8 × B's time.\n2. t − 0.8t = 10 → 0.2t = 10 → t = 50.\n3. B takes 50 days, so A takes 0.8 × 50 = **40 days**.\n\nAnswer: **40 days**.",
    approach: "Efficiency and time are inversely proportional: 25% more efficient means 20% less time. Converting the percentage correctly is the crux.",
    tags: ["efficiency"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-abc-together-4-c-alone",
    topic: "time-and-work",
    title: "Finding C's time",
    prompt:
      "**A, B and C together** finish a work in **4 days**. **A alone** takes **12 days** and **B alone 18 days**. How long would **C alone** take?",
    options: ["6 days", "9 days", "12 days", "15 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["C's rate = combined rate − A's − B's.", "1/4 − 1/12 − 1/18, with 36 as the common denominator."],
    solution:
      "1. 1/4 = 9/36, 1/12 = 3/36, 1/18 = 2/36.\n2. C's rate = 9/36 − 3/36 − 2/36 = 4/36 = 1/9.\n3. C alone takes **9 days**.\n\nAnswer: **9 days**.",
    approach: "Put every rate over a common denominator before subtracting. Choosing the LCM of all the times keeps the arithmetic in whole numbers.",
    tags: ["rates"],
    timeTargetSec: 75,
  },
  {
    slug: "tw2-pairs-abc",
    topic: "time-and-work",
    title: "Three pairs of workers",
    prompt:
      "**A and B** together can do a work in **12 days**, **B and C** in **15 days**, and **C and A** in **20 days**. How long will **all three together** take?",
    options: ["8 days", "10 days", "12 days", "15 days"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Add all three pair rates: that counts every worker twice.",
      "1/12 + 1/15 + 1/20 = 2 × (combined rate of all three).",
    ],
    solution:
      "1. Sum of pair rates = 1/12 + 1/15 + 1/20 = 5/60 + 4/60 + 3/60 = 12/60 = 1/5.\n2. This equals 2(A + B + C), so A + B + C = 1/10.\n3. All three together take **10 days**.\n\nAnswer: **10 days**.",
    approach: "Adding the three pair rates counts each person exactly twice, so halve the sum. This is the standard route into every three-worker question.",
    tags: ["rates"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-a-alone-from-pairs",
    topic: "time-and-work",
    title: "A alone, from the pairs",
    prompt:
      "**A and B** together take **12 days**, **B and C** take **15 days**, and **all three together** take **10 days**. How long would **A alone** take?",
    options: ["24 days", "30 days", "36 days", "60 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["A = (A + B + C) − (B + C).", "1/10 − 1/15."],
    solution:
      "1. A's rate = 1/10 − 1/15 = 3/30 − 2/30 = 1/30.\n2. A alone takes **30 days**.\n\nAnswer: **30 days**.",
    approach: "Subtract the pair that excludes the person you want from the all-three rate. Choosing the wrong pair is the only way to go wrong.",
    tags: ["rates"],
    timeTargetSec: 60,
  },
  {
    slug: "tw2-a-works-5-then-b-finishes",
    topic: "time-and-work",
    title: "A starts, B finishes",
    prompt:
      "**A** can do a work in **15 days**. He works for **5 days** and then **B** finishes the rest in **12 days**. How long would **B alone** take for the whole work?",
    options: ["15 days", "18 days", "20 days", "24 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["A completes 5/15 = 1/3 of the work.", "B does the remaining 2/3 in 12 days."],
    solution:
      "1. A does 5/15 = 1/3 of the work.\n2. B does the remaining 2/3 in 12 days.\n3. So B alone would take 12 × 3/2 = **18 days**.\n\nAnswer: **18 days**.",
    approach: "Find the fraction each person completes, then scale the partial time up to the whole. Never add the two given day counts.",
    tags: ["partial work"],
    timeTargetSec: 75,
  },
  {
    slug: "tw2-together-4-days-b-finishes",
    topic: "time-and-work",
    title: "Together, then B alone",
    prompt:
      "**A** can do a work in **12 days** and **B** in **15 days**. They work **together for 4 days**, after which A leaves. In how many **more days** will B finish?",
    options: ["5 days", "6 days", "7 days", "8 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["Together they do 1/12 + 1/15 = 3/20 per day.", "In 4 days they finish 3/5, leaving 2/5 for B."],
    solution:
      "1. Combined rate = 1/12 + 1/15 = 5/60 + 4/60 = 9/60 = 3/20.\n2. In 4 days: 4 × 3/20 = 3/5 done, so 2/5 remains.\n3. B needs (2/5) ÷ (1/15) = **6 days**.\n\nAnswer: **6 days**.",
    approach: "Work done, work remaining, then divide by the rate that continues. The question asks for the extra days, not the total.",
    tags: ["partial work"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-together-20-b-leaves",
    topic: "time-and-work",
    title: "B leaves partway",
    prompt:
      "**A and B** together can do a work in **30 days**. They work together for **20 days**, then B leaves and **A finishes the rest in 20 more days**. How long would **A alone** take for the whole work?",
    options: ["45 days", "50 days", "60 days", "75 days"],
    answer: 2,
    difficulty: "medium",
    hints: ["In 20 days together they complete 20/30 = 2/3.", "A does the remaining 1/3 in 20 days."],
    solution:
      "1. In 20 days the pair complete 20/30 = 2/3 of the work.\n2. A does the remaining 1/3 in 20 days.\n3. So A alone would take 20 × 3 = **60 days**.\n\nAnswer: **60 days**.",
    approach: "Convert the leftover fraction and its time into a full-job time by simple scaling. B's individual rate is never needed.",
    tags: ["partial work"],
    timeTargetSec: 75,
  },
  {
    slug: "tw2-a-leaves-five-days-before",
    topic: "time-and-work",
    title: "A leaves five days before the end",
    prompt:
      "**A** can do a work in **20 days** and **B** in **30 days**. They begin together, but **A leaves 5 days before** the work is finished. In how many **days is the work completed**?",
    options: ["12 days", "15 days", "18 days", "20 days"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Let the work take T days in all. B works all T days; A works T − 5.",
      "(T − 5)/20 + T/30 = 1.",
    ],
    solution:
      "1. Let the total time be T days. Then (T − 5)/20 + T/30 = 1.\n2. Multiply by 60: 3(T − 5) + 2T = 60 → 3T − 15 + 2T = 60 → 5T = 75.\n3. T = **15 days**.\n\nAnswer: **15 days**.",
    approach:
      "Set up one equation in the total time, remembering that the person who leaves works fewer days. The one who stays always works the full duration.",
    tags: ["partial work"],
    timeTargetSec: 120,
  },
  {
    slug: "tw2-alternate-days-20-30",
    topic: "time-and-work",
    title: "Working on alternate days",
    prompt:
      "**A** can complete a work in **20 days** and **B** in **30 days**. They work on **alternate days**, with A starting. In how many days is the work finished?",
    options: ["22 days", "24 days", "25 days", "26 days"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Take the work as 60 units: A does 3 a day and B does 2.",
      "Each two-day cycle completes 5 units. How many whole cycles fit into 60?",
    ],
    solution:
      "1. Work = 60 units. A does 3 units on his day, B does 2 on his.\n2. Each 2-day cycle = 5 units, and 60 ÷ 5 = 12 cycles exactly.\n3. 12 cycles = **24 days**.\n\nAnswer: **24 days**.",
    approach:
      "Find the work per cycle, count the whole cycles, then handle any remainder day by day in the correct order. Here it divides exactly, so no remainder arises.",
    tags: ["alternate days"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-alternate-pipes",
    topic: "time-and-work",
    title: "Two taps used alternately",
    prompt:
      "Tap **A** fills a tank in **4 hours** and tap **B** in **6 hours**. They are opened **alternately for one hour each**, starting with A. How long does the tank take to fill?",
    options: ["4 h 20 min", "4 h 40 min", "5 h", "5 h 20 min"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Take the tank as 12 units: A fills 3 per hour and B fills 2.",
      "Each 2-hour cycle adds 5 units. After two cycles 10 units are in.",
    ],
    solution:
      "1. Tank = 12 units. A adds 3 units/hour, B adds 2.\n2. Each 2-hour cycle adds 5 units. After 2 cycles (4 hours): 10 units.\n3. The 5th hour is A's turn; he needs 2 more units at 3 units/hour = 2/3 hour = 40 minutes.\n4. Total = **4 h 40 min**.\n\nAnswer: **4 h 40 min**.",
    approach: "Count whole cycles first, then finish the remainder with whoever's turn it is. The remainder rarely takes a full period, so express it in minutes.",
    tags: ["alternate days", "pipes"],
    timeTargetSec: 135,
  },
  {
    slug: "tw2-pipes-two-in-one-out",
    topic: "time-and-work",
    title: "Two inlets and an outlet",
    prompt:
      "Pipe **A** fills a tank in **12 hours**, pipe **B** in **15 hours**, and pipe **C** empties a full tank in **20 hours**. With all three open, how long does the tank take to fill?",
    options: ["8 h", "10 h", "12 h", "15 h"],
    answer: 1,
    difficulty: "medium",
    hints: ["An emptying pipe counts as a negative rate.", "1/12 + 1/15 − 1/20 over a denominator of 60."],
    solution:
      "1. Net rate = 1/12 + 1/15 − 1/20 = 5/60 + 4/60 − 3/60 = 6/60 = 1/10.\n2. The tank fills in **10 hours**.\n\nAnswer: **10 h**.",
    approach: "Inlets add to the rate, outlets subtract. If the net rate came out negative the tank would never fill, which is worth checking.",
    tags: ["pipes"],
    timeTargetSec: 60,
  },
  {
    slug: "tw2-leak-empties-full",
    topic: "time-and-work",
    title: "A leak in the tank",
    prompt:
      "A tap fills a tank in **6 hours**. A leak at the bottom empties a full tank in **12 hours**. With both working, how long does the tank take to **fill**?",
    options: ["9 h", "10 h", "12 h", "18 h"],
    answer: 2,
    difficulty: "easy",
    hints: ["Net rate = filling rate − leaking rate.", "1/6 − 1/12."],
    solution: "1. Net rate = 1/6 − 1/12 = 2/12 − 1/12 = 1/12.\n2. The tank fills in **12 hours**.\n\nAnswer: **12 h**.",
    approach: "The leak halves the effective rate here, so the time doubles. Subtracting the times (12 − 6) would give 6 and is wrong.",
    tags: ["pipes"],
    timeTargetSec: 45,
  },
  {
    slug: "tw2-leak-adds-an-hour",
    topic: "time-and-work",
    title: "The leak costs an hour",
    prompt:
      "A pipe fills a cistern in **4 hours**, but because of a leak it takes **1 hour longer**. How long would the **leak alone** take to empty a full cistern?",
    options: ["10 h", "15 h", "20 h", "24 h"],
    answer: 2,
    difficulty: "medium",
    hints: ["With the leak the effective rate is 1/5.", "Leak rate = 1/4 − 1/5."],
    solution:
      "1. Effective rate with the leak = 1/5 per hour.\n2. Leak rate = 1/4 − 1/5 = 5/20 − 4/20 = 1/20.\n3. The leak alone empties the cistern in **20 hours**.\n\nAnswer: **20 h**.",
    approach: "Filling rate minus observed rate gives the leak's rate. The extra hour is not the leak's time — that misreading gives 1 hour or 5.",
    tags: ["pipes"],
    timeTargetSec: 75,
  },
  {
    slug: "tw2-cistern-nine-to-ten",
    topic: "time-and-work",
    title: "From nine hours to ten",
    prompt:
      "A cistern is normally filled in **9 hours**, but a leak makes it take **10 hours**. How long would the **leak alone** take to empty the full cistern?",
    options: ["45 h", "60 h", "75 h", "90 h"],
    answer: 3,
    difficulty: "medium",
    hints: ["Leak rate = 1/9 − 1/10.", "The common denominator is 90."],
    solution:
      "1. Leak rate = 1/9 − 1/10 = 10/90 − 9/90 = 1/90.\n2. The leak alone empties it in **90 hours**.\n\nAnswer: **90 h**.",
    approach: "A small delay implies a very slow leak. When two times are close, the difference of their reciprocals is tiny and the answer is large.",
    tags: ["pipes"],
    timeTargetSec: 60,
  },
  {
    slug: "tw2-close-one-pipe",
    topic: "time-and-work",
    title: "Closing one tap early",
    prompt:
      "Two pipes fill a tank in **20 minutes** and **30 minutes** respectively. Both are opened together, but the **first is closed after some time** and the tank fills in **18 minutes** in all. After how long was the first pipe closed?",
    options: ["6 min", "8 min", "10 min", "12 min"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The second pipe runs for the whole 18 minutes.",
      "Let the first run for t minutes: t/20 + 18/30 = 1.",
    ],
    solution:
      "1. The second pipe contributes 18/30 = 3/5 of the tank.\n2. The first must supply the remaining 2/5: t/20 = 2/5 → t = 8.\n3. The first pipe was closed after **8 minutes**.\n\nAnswer: **8 min**.",
    approach: "The pipe that runs throughout is computed first; the other fills whatever is left. One equation in the unknown running time.",
    tags: ["pipes"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-both-open-4-min-then-one",
    topic: "time-and-work",
    title: "One pipe finishes the job",
    prompt:
      "Two pipes can fill a tank in **10 minutes** and **15 minutes**. Both are opened for **4 minutes**, then the first is closed. How much **longer** does the second take to fill the tank?",
    options: ["4 min", "5 min", "6 min", "7 min"],
    answer: 1,
    difficulty: "medium",
    hints: ["In 4 minutes they fill 4/10 + 4/15.", "That is 2/3, leaving 1/3 for the second pipe."],
    solution:
      "1. In 4 minutes: 4/10 + 4/15 = 6/15 + 4/15 = 10/15 = 2/3 filled.\n2. Remaining = 1/3, at the second pipe's rate of 1/15 per minute.\n3. Time = (1/3) × 15 = **5 minutes**.\n\nAnswer: **5 min**.",
    approach: "Compute the fraction filled together, subtract from one, and divide by the surviving rate. The answer asked for is the extra time, not the total.",
    tags: ["pipes"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-waste-pipe-capacity",
    topic: "time-and-work",
    title: "Capacity from a waste pipe",
    prompt:
      "Two taps fill a cistern in **30 and 40 minutes**. A waste pipe empties **3 gallons per minute**. With all three open the cistern fills in **60 minutes**. What is the **capacity** of the cistern?",
    options: ["60 gallons", "72 gallons", "84 gallons", "96 gallons"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Find the waste pipe's rate as a fraction of the cistern per minute.",
      "1/30 + 1/40 − w = 1/60.",
    ],
    solution:
      "1. 1/30 + 1/40 − w = 1/60. Over 120: 4/120 + 3/120 − w = 2/120.\n2. w = 5/120 = 1/24, so the waste pipe empties the cistern in 24 minutes.\n3. At 3 gallons per minute, capacity = 24 × 3 = **72 gallons**.\n\nAnswer: **72 gallons**.",
    approach:
      "Work in fractions of the cistern to find the waste pipe's emptying time, then convert to volume using its stated flow rate. The two units meet only at the last step.",
    tags: ["pipes"],
    timeTargetSec: 135,
  },
  {
    slug: "tw2-men-and-women-equivalence",
    topic: "time-and-work",
    title: "Men and women together",
    prompt:
      "**3 men or 6 women** can complete a work in **20 days**. How long will **4 men and 4 women** take?",
    options: ["8 days", "10 days", "12 days", "15 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["3 men ≡ 6 women, so 1 man ≡ 2 women.", "Convert the mixed group into women."],
    solution:
      "1. 3 men ≡ 6 women, so 1 man ≡ 2 women.\n2. 4 men + 4 women ≡ 8 + 4 = 12 women.\n3. Work = 6 women × 20 days = 120 woman-days, so 12 women take 120 ÷ 12 = **10 days**.\n\nAnswer: **10 days**.",
    approach: "Convert everyone into a single unit using the equivalence given, then use the man-days (or woman-days) total. Mixing units is the only pitfall.",
    tags: ["equivalence"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-women-and-children",
    topic: "time-and-work",
    title: "Women and children",
    prompt:
      "**10 women** can complete a work in **7 days** and **10 children** take **14 days**. How long will **5 women and 10 children** take together?",
    options: ["3.5 days", "5 days", "7 days", "10 days"],
    answer: 2,
    difficulty: "medium",
    hints: ["One woman does 1/70 of the work a day; one child 1/140.", "Add 5 women's and 10 children's rates."],
    solution:
      "1. One woman = 1/70 per day; one child = 1/140 per day.\n2. 5 women + 10 children = 5/70 + 10/140 = 1/14 + 1/14 = 2/14 = 1/7.\n3. Time = **7 days**.\n\nAnswer: **7 days**.",
    approach: "Reduce to the rate of a single worker of each kind, then scale and add. Halving the women and keeping the children happens to balance out here.",
    tags: ["equivalence"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-men-days-to-more-men",
    topic: "time-and-work",
    title: "Fewer days, more men",
    prompt: "**12 men** can complete a work in **8 days**. How many **men** are needed to finish it in **6 days**?",
    options: ["14", "15", "16", "18"],
    answer: 2,
    difficulty: "easy",
    hints: ["Men and days are inversely proportional.", "12 × 8 = 96 man-days."],
    solution: "1. Work = 12 × 8 = 96 man-days.\n2. Men needed = 96 ÷ 6 = **16**.\n\nAnswer: **16**.",
    approach: "Keep the man-days product constant. The count of workers rises exactly as the time falls.",
    tags: ["man-days"],
    timeTargetSec: 45,
  },
  {
    slug: "tw2-more-men-join",
    topic: "time-and-work",
    title: "More men join partway",
    prompt:
      "**12 men** undertake a work expected to take **20 days**. After **8 days**, **4 more men** join. In how many **days in total** is the work finished?",
    options: ["16 days", "17 days", "18 days", "19 days"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Total work = 12 × 20 = 240 man-days.",
      "In 8 days, 96 man-days are used, leaving 144 for 16 men.",
    ],
    solution:
      "1. Total work = 240 man-days.\n2. In 8 days: 12 × 8 = 96 done, leaving 144.\n3. With 16 men: 144 ÷ 16 = 9 more days.\n4. Total = 8 + 9 = **17 days**.\n\nAnswer: **17 days**.",
    approach: "Track man-days used and remaining. The answer is the total elapsed time, so remember to add the first stretch back on.",
    tags: ["man-days"],
    timeTargetSec: 105,
  },
  {
    slug: "tw2-men-leave",
    topic: "time-and-work",
    title: "Some men leave",
    prompt:
      "**24 men** can complete a work in **16 days**. After **4 days**, **8 men leave**. How many **more days** will the rest take to finish?",
    options: ["14 days", "16 days", "18 days", "20 days"],
    answer: 2,
    difficulty: "medium",
    hints: ["Work = 24 × 16 = 384 man-days.", "After 4 days, 96 are used and 16 men remain."],
    solution:
      "1. Total work = 384 man-days.\n2. In 4 days: 24 × 4 = 96 done, leaving 288.\n3. With 16 men: 288 ÷ 16 = **18 more days**.\n\nAnswer: **18 days**.",
    approach: "Man-days again. Note the question asks for the additional days, not the total elapsed time.",
    tags: ["man-days"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-contractor-more-men",
    topic: "time-and-work",
    title: "A contractor falls behind",
    prompt:
      "A contractor undertakes to finish a job in **40 days** with **100 men**. After **30 days** only **two-thirds** of the work is done. How many **additional men** must he employ to finish on time?",
    options: ["25", "50", "75", "100"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "100 men over 30 days did two-thirds, so the whole job is 4,500 man-days.",
      "One-third remains and only 10 days are left.",
    ],
    solution:
      "1. Two-thirds of the work took 100 × 30 = 3,000 man-days, so the whole job is 4,500 man-days.\n2. Remaining = 1,500 man-days in 10 days → 150 men needed.\n3. Additional men = 150 − 100 = **50**.\n\nAnswer: **50**.",
    approach:
      "Scale the observed man-days to the whole job, then divide the remainder by the days left. The question asks for the *extra* men, not the new total.",
    tags: ["man-days"],
    timeTargetSec: 135,
  },
  {
    slug: "tw2-hectares-reaped",
    topic: "time-and-work",
    title: "Hectares reaped",
    prompt:
      "If **8 men** can reap **80 hectares** in **24 days**, how many hectares can **36 men** reap in **30 days**?",
    options: ["360", "400", "450", "500"],
    answer: 2,
    difficulty: "medium",
    hints: ["Find the man-days needed per hectare.", "8 × 24 = 192 man-days for 80 hectares."],
    solution:
      "1. 192 man-days produce 80 hectares, so one hectare takes 2.4 man-days.\n2. 36 men over 30 days = 1,080 man-days.\n3. Hectares = 1,080 ÷ 2.4 = **450**.\n\nAnswer: **450**.",
    approach: "Reduce to work per man-day, then scale. The chain rule (80 × 36/8 × 30/24) gives the same result in one line.",
    tags: ["man-days"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-wall-length",
    topic: "time-and-work",
    title: "Length of wall built",
    prompt:
      "If **20 men** can build a wall **56 metres** long in **6 days**, what length can **35 men** build in **3 days**?",
    options: ["42 m", "49 m", "56 m", "63 m"],
    answer: 1,
    difficulty: "medium",
    hints: ["120 man-days produce 56 metres.", "35 × 3 = 105 man-days."],
    solution:
      "1. 20 × 6 = 120 man-days give 56 m.\n2. 35 × 3 = 105 man-days.\n3. Length = 56 × 105/120 = **49 m**.\n\nAnswer: **49 m**.",
    approach: "Set up the proportion output ∝ man-days. More men but fewer days here nets out to slightly less work, so the answer must be under 56.",
    tags: ["man-days"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-hours-per-day",
    topic: "time-and-work",
    title: "Working different hours a day",
    prompt:
      "**39 people** can repair a road in **12 days** working **5 hours a day**. In how many days will **30 people** working **6 hours a day** complete it?",
    options: ["11 days", "13 days", "15 days", "18 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["Total effort = 39 × 12 × 5 person-hours.", "Divide by 30 × 6 per day."],
    solution:
      "1. Total = 39 × 12 × 5 = 2,340 person-hours.\n2. Daily output of the new team = 30 × 6 = 180 person-hours.\n3. Days = 2,340 ÷ 180 = **13 days**.\n\nAnswer: **13 days**.",
    approach: "When hours per day vary, work in person-hours rather than person-days. Everything else is the same chain rule.",
    tags: ["man-days"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-men-women-hours",
    topic: "time-and-work",
    title: "Men, women and hours",
    prompt:
      "**15 men** take **21 days of 8 hours each** to do a piece of work. How many **days of 6 hours each** would **21 women** take, if **3 women do as much work as 2 men**?",
    options: ["20", "25", "30", "36"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Total effort = 15 × 21 × 8 = 2,520 man-hours.",
      "3 women ≡ 2 men, so 21 women ≡ 14 men.",
    ],
    solution:
      "1. Total work = 15 × 21 × 8 = 2,520 man-hours.\n2. 3 women ≡ 2 men, so 21 women ≡ 14 men.\n3. Daily output = 14 × 6 = 84 man-hours.\n4. Days = 2,520 ÷ 84 = **30 days**.\n\nAnswer: **30 days**.",
    approach:
      "Convert the workforce into one unit first, then work in that unit's hours throughout. Attempting to convert at the end mixes incompatible quantities.",
    tags: ["equivalence", "man-days"],
    timeTargetSec: 150,
  },
  {
    slug: "tw2-half-and-third",
    topic: "time-and-work",
    title: "Half the work, a third of the work",
    prompt:
      "**A** does **half a job in 5 days**; **B** does **one-third of the same job in 5 days**. How long will they take **together** to complete it?",
    options: ["5 days", "6 days", "7.5 days", "9 days"],
    answer: 1,
    difficulty: "medium",
    hints: ["Scale each up to the whole job: A takes 10 days, B takes 15.", "Then add the rates: 1/10 + 1/15."],
    solution:
      "1. A does 1/2 in 5 days, so the whole job would take 10 days.\n2. B does 1/3 in 5 days, so the whole job would take 15 days.\n3. Together: 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6.\n4. Time = **6 days**.\n\nAnswer: **6 days**.",
    approach: "Scale each partial job up to a whole-job time first, then add the rates. Adding the two partial times directly is meaningless.",
    tags: ["partial work"],
    timeTargetSec: 90,
  },
  {
    slug: "tw2-four-fifths-in-20",
    topic: "time-and-work",
    title: "Four-fifths done in twenty days",
    prompt:
      "**A** completes **four-fifths of a work in 20 days**. How many **more days** will he take to finish the rest?",
    options: ["4 days", "5 days", "6 days", "8 days"],
    answer: 1,
    difficulty: "easy",
    hints: ["Four-fifths took 20 days, so one-fifth takes a quarter of that.", "20 ÷ 4."],
    solution:
      "1. 4/5 of the work took 20 days, so 1/5 takes 20 ÷ 4 = **5 days**.\n2. (The whole job would take 25 days.)\n\nAnswer: **5 days**.",
    approach: "Scale the fraction directly rather than computing the full-job time first. Both work, but the direct route is one division.",
    tags: ["partial work"],
    timeTargetSec: 45,
  },
  {
    slug: "tw2-payment-share-c",
    topic: "time-and-work",
    title: "Sharing the payment",
    prompt:
      "**A** can do a work in **6 days** and **B** in **8 days**. With **C's help** they finish it in **3 days** and are paid **₹600** in all. What is **C's share**?",
    options: ["₹50", "₹75", "₹100", "₹150"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Payment is shared in proportion to work done, so find C's rate.",
      "C's rate = 1/3 − 1/6 − 1/8.",
    ],
    solution:
      "1. Combined rate = 1/3. A + B = 1/6 + 1/8 = 4/24 + 3/24 = 7/24.\n2. C's rate = 8/24 − 7/24 = 1/24.\n3. C's share of the work = (1/24) ÷ (1/3) = 1/8.\n4. C's payment = 600 ÷ 8 = **₹75**.\n\nAnswer: **₹75**.",
    approach: "Wages divide in the ratio of work completed, which is the ratio of the rates. Find each rate, then take each person's fraction of the total.",
    tags: ["wages"],
    timeTargetSec: 135,
  },
  {
    slug: "tw2-abc-help-c-alone",
    topic: "time-and-work",
    title: "C's help finishes it in four days",
    prompt:
      "**A** alone takes **8 days** and **B** alone **12 days**. With **C's help** they finish the work in **4 days**. How long would **C alone** take?",
    options: ["16 days", "20 days", "24 days", "30 days"],
    answer: 2,
    difficulty: "medium",
    hints: ["C's rate = 1/4 − 1/8 − 1/12.", "Use 24 as the common denominator."],
    solution:
      "1. 1/4 = 6/24, 1/8 = 3/24, 1/12 = 2/24.\n2. C's rate = 6/24 − 3/24 − 2/24 = 1/24.\n3. C alone takes **24 days**.\n\nAnswer: **24 days**.",
    approach: "Subtract the known rates from the combined rate. Choosing the LCM of the given times as the denominator keeps every step in whole numbers.",
    tags: ["rates"],
    timeTargetSec: 75,
  },
  {
    slug: "tw2-tank-tap-and-leak-capacity",
    topic: "time-and-work",
    title: "Capacity from a tap and a leak",
    prompt:
      "A leak can empty a full tank in **8 hours**. With a tap admitting **6 litres per minute** also open, the full tank empties in **12 hours**. What is the **capacity** of the tank?",
    options: ["4,320 L", "5,760 L", "8,640 L", "10,080 L"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "The tap slows the emptying, so tap rate = leak rate − observed rate.",
      "1/8 − 1/12 = 1/24, so the tap alone would fill the tank in 24 hours.",
    ],
    solution:
      "1. Leak rate = 1/8; net emptying rate with the tap = 1/12.\n2. Tap rate = 1/8 − 1/12 = 3/24 − 2/24 = 1/24, so the tap fills the tank in 24 hours.\n3. The tap delivers 6 × 60 = 360 litres per hour.\n4. Capacity = 24 × 360 = **8,640 litres**.\n\nAnswer: **8,640 L**.",
    approach:
      "Find the tap's filling time from the two emptying rates, then multiply by its flow. Converting litres per minute to litres per hour is where units usually go astray.",
    tags: ["pipes"],
    timeTargetSec: 150,
  },
  {
    slug: "tw2-b-alone-after-a-quits",
    topic: "time-and-work",
    title: "How long B alone would take",
    prompt:
      "**A and B** can do a work in **10 days**, **B and C** in **15 days**, and **A and C** in **12 days**. How long would **B alone** take?",
    options: ["24 days", "30 days", "36 days", "40 days"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "Add all three pair rates: that counts every worker twice.",
      "Halve the sum to get A + B + C, then subtract the pair that leaves B out.",
    ],
    solution:
      "1. Sum of pair rates = 1/10 + 1/15 + 1/12 = 6/60 + 4/60 + 5/60 = 15/60 = 1/4.\n2. This is 2(A + B + C), so A + B + C = 1/8.\n3. B = (A + B + C) − (A + C) = 1/8 − 1/12 = 3/24 − 2/24 = 1/24.\n4. B alone takes **24 days**.\n\nAnswer: **24 days**.",
    approach: "Halve the sum of the pair rates to get the three-worker rate, then subtract the pair that excludes the person you want.",
    tags: ["rates"],
    timeTargetSec: 120,
  },
];

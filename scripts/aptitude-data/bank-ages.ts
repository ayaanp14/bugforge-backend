import type { AptitudeSeed } from "./types.js";

/** Problems on ages — the standard placement and bank-exam set. */
export const BANK_AGES: AptitudeSeed[] = [
  {
    slug: "ag2-father-three-times-five-years-ago",
    topic: "ages",
    title: "Three times now, four times then",
    prompt:
      "A father is **three times as old as his son**. **Five years ago** he was **four times** as old. What is the **father's present age**?",
    options: ["40", "45", "48", "50"],
    answer: 1,
    difficulty: "medium",
    hints: ["Let the son be s, so the father is 3s.", "Five years ago: 3s − 5 = 4(s − 5)."],
    solution:
      "1. Son = s, father = 3s.\n2. 3s − 5 = 4(s − 5) = 4s − 20 → s = 15.\n3. Father = 3 × 15 = **45**.\n4. Check: five years ago 40 and 10, and 40 = 4 × 10. ✓\n\nAnswer: **45**.",
    approach: "One variable for the present, then shift both ages by the same number of years. The age *difference* never changes, which is a fast check on any answer.",
    tags: ["basics"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-man-three-times-fifteen-hence",
    topic: "ages",
    title: "Three times now, twice later",
    prompt:
      "A man is **three times as old as his son**. **Fifteen years hence** he will be **twice** as old. What is the **man's present age**?",
    options: ["36", "40", "45", "48"],
    answer: 2,
    difficulty: "medium",
    hints: ["Son = s, man = 3s.", "In fifteen years: 3s + 15 = 2(s + 15)."],
    solution:
      "1. 3s + 15 = 2(s + 15) = 2s + 30 → s = 15.\n2. Man = 45.\n3. Check: in 15 years, 60 and 30. ✓\n\nAnswer: **45**.",
    approach: "Adding years to both sides is the mirror of subtracting them. Set the equation up in the present and shift once.",
    tags: ["basics"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-twice-ten-years-ago-thrice",
    topic: "ages",
    title: "Twice now, three times before",
    prompt:
      "A is **twice as old as B**. **Ten years ago** A was **three times** as old as B. What is **B's present age**?",
    options: ["15", "18", "20", "25"],
    answer: 2,
    difficulty: "medium",
    hints: ["A = 2b.", "2b − 10 = 3(b − 10)."],
    solution:
      "1. 2b − 10 = 3b − 30 → b = 20.\n2. So B is **20** and A is 40.\n3. Check: ten years ago 30 and 10. ✓\n\nAnswer: **20**.",
    approach: "Expand the bracket and collect terms. The answer is B's age, not A's — read the question again before choosing.",
    tags: ["basics"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-ratio-6-5-after-15",
    topic: "ages",
    title: "Ratio 6 : 5 now, 9 : 8 later",
    prompt:
      "The ages of A and B are in the ratio **6 : 5**. After **15 years** the ratio becomes **9 : 8**. What is **A's present age**?",
    options: ["25", "30", "36", "40"],
    answer: 1,
    difficulty: "medium",
    hints: ["Take the ages as 6x and 5x.", "(6x + 15)/(5x + 15) = 9/8."],
    solution:
      "1. (6x + 15)/(5x + 15) = 9/8 → 48x + 120 = 45x + 135 → 3x = 15 → x = 5.\n2. A = 6 × 5 = **30**.\n3. Check: in 15 years, 45 and 40, and 45/40 = 9/8. ✓\n\nAnswer: **30**.",
    approach: "A ratio supplies the variable; the later ratio supplies the equation. Cross-multiply and solve — it is always linear.",
    tags: ["ratio"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-ratio-3-5-after-9",
    topic: "ages",
    title: "Ratio 3 : 5 now, 3 : 4 later",
    prompt:
      "The ages of A and B are in the ratio **3 : 5**. After **9 years** the ratio becomes **3 : 4**. What is **B's present age**?",
    options: ["9", "12", "15", "20"],
    answer: 2,
    difficulty: "medium",
    hints: ["Ages are 3x and 5x.", "(3x + 9)/(5x + 9) = 3/4."],
    solution:
      "1. (3x + 9)/(5x + 9) = 3/4 → 12x + 36 = 15x + 27 → 3x = 9 → x = 3.\n2. B = 5 × 3 = **15**.\n3. Check: 18/24 = 3/4. ✓\n\nAnswer: **15**.",
    approach: "Same shape as before. Substituting x back into the *right* person's expression is the only place to slip.",
    tags: ["ratio"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-ratio-3-4-eight-years-ago",
    topic: "ages",
    title: "Looking back eight years",
    prompt:
      "The present ages of two people are in the ratio **3 : 4**. **Eight years ago** they were in the ratio **2 : 3**. What is the **sum of their present ages**?",
    options: ["42", "49", "56", "63"],
    answer: 2,
    difficulty: "medium",
    hints: ["Ages are 3x and 4x.", "(3x − 8)/(4x − 8) = 2/3."],
    solution:
      "1. (3x − 8)/(4x − 8) = 2/3 → 9x − 24 = 8x − 16 → x = 8.\n2. Ages are 24 and 32; sum = **56**.\n3. Check: sixteen and twenty-four eight years ago, ratio 2 : 3. ✓\n\nAnswer: **56**.",
    approach: "Subtract the years from both terms for a past ratio. The question asks for the sum, so remember to add at the end.",
    tags: ["ratio"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-one-year-ago-four-hence",
    topic: "ages",
    title: "One year ago and four years hence",
    prompt:
      "**One year ago** the ages of two people were in the ratio **5 : 6**. **Four years hence** the ratio will be **6 : 7**. What is the **present age of the younger**?",
    options: ["24", "25", "26", "30"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Let the ages one year ago be 5x and 6x.",
      "Four years hence they are 5x + 5 and 6x + 5.",
      "Set (5x + 5)/(6x + 5) = 6/7.",
    ],
    solution:
      "1. Ages one year ago: 5x and 6x. Four years hence: 5x + 5 and 6x + 5.\n2. (5x + 5)/(6x + 5) = 6/7 → 35x + 35 = 36x + 30 → x = 5.\n3. One year ago the younger was 25, so now **26**.\n\nAnswer: **26**.",
    approach:
      "Anchor the variable at whichever moment the question describes first, then step forward carefully — from 'one year ago' to 'four years hence' is five years, not four.",
    tags: ["ratio"],
    timeTargetSec: 120,
  },
  {
    slug: "ag2-mother-daughter-sum-fifty",
    topic: "ages",
    title: "Mother and daughter",
    prompt:
      "The **sum of the ages of a mother and her daughter is 50**. **Five years ago** the mother was **seven times** as old as the daughter. What is the **mother's present age**?",
    options: ["35", "38", "40", "45"],
    answer: 2,
    difficulty: "medium",
    hints: ["Let the daughter be d, so the mother is 50 − d.", "Five years ago: 45 − d = 7(d − 5)."],
    solution:
      "1. Daughter = d, mother = 50 − d.\n2. 45 − d = 7(d − 5) = 7d − 35 → 8d = 80 → d = 10.\n3. Mother = 50 − 10 = **40**.\n4. Check: five years ago 35 and 5. ✓\n\nAnswer: **40**.",
    approach: "Use the sum to express one age through the other so that only one variable survives into the 'years ago' condition.",
    tags: ["sum"],
    timeTargetSec: 90,
  },
  {
    slug: "ag2-difference-16-six-years-ago",
    topic: "ages",
    title: "Ages differing by 16",
    prompt:
      "The ages of two people **differ by 16 years**. **Six years ago** the elder was **three times** as old as the younger. What is the **younger's present age**?",
    options: ["12", "14", "16", "20"],
    answer: 1,
    difficulty: "medium",
    hints: ["Younger = y, elder = y + 16.", "Six years ago: y + 10 = 3(y − 6)."],
    solution:
      "1. Younger = y, elder = y + 16.\n2. Six years ago: (y + 16 − 6) = 3(y − 6) → y + 10 = 3y − 18 → 2y = 28 → y = **14**.\n3. Check: six years ago 24 and 8. ✓\n\nAnswer: **14**.",
    approach: "A fixed difference is the easiest way to introduce one variable. The difference stays 16 at every point in time, which makes checking trivial.",
    tags: ["difference"],
    timeTargetSec: 90,
  },
  {
    slug: "ag2-father-30-older",
    topic: "ages",
    title: "Father thirty years older",
    prompt:
      "A father is **30 years older than his son**. **In 12 years** the father will be **three times** as old as his son. What is the **son's present age**?",
    options: ["3", "4", "5", "6"],
    answer: 0,
    difficulty: "medium",
    hints: ["Son = s, father = s + 30.", "In 12 years: s + 42 = 3(s + 12)."],
    solution:
      "1. s + 42 = 3(s + 12) = 3s + 36 → 2s = 6 → s = **3**.\n2. Check: in 12 years, 45 and 15. ✓\n\nAnswer: **3**.",
    approach: "Small answers are common in this chapter and feel wrong, but the check settles it. Always verify rather than distrust the algebra.",
    tags: ["difference"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-twenty-years-older-twice",
    topic: "ages",
    title: "Twenty years older",
    prompt:
      "A is **20 years older than B**. **In 5 years** A will be **twice** as old as B. What is **B's present age**?",
    options: ["10", "15", "20", "25"],
    answer: 1,
    difficulty: "medium",
    hints: ["A = b + 20.", "In 5 years: b + 25 = 2(b + 5)."],
    solution:
      "1. b + 25 = 2(b + 5) = 2b + 10 → b = **15**.\n2. Check: in 5 years, 40 and 20. ✓\n\nAnswer: **15**.",
    approach: "One equation, one unknown, once the fixed difference is used. Expand the bracket before collecting terms.",
    tags: ["difference"],
    timeTargetSec: 60,
  },
  {
    slug: "ag2-product-756-ratio-7-3",
    topic: "ages",
    title: "Ratio and product together",
    prompt:
      "The ratio of a man's age to his son's is **7 : 3** and the **product of their ages is 756**. What will the ratio be **after 6 years**?",
    options: ["3 : 2", "2 : 1", "5 : 3", "11 : 7"],
    answer: 1,
    difficulty: "hard",
    hints: ["Let the ages be 7x and 3x.", "21x² = 756, so x² = 36."],
    solution:
      "1. 7x × 3x = 21x² = 756 → x² = 36 → x = 6.\n2. Ages are 42 and 18.\n3. After 6 years: 48 and 24, a ratio of **2 : 1**.\n\nAnswer: **2 : 1**.",
    approach: "The ratio gives the form, the product gives the scale. Note that the ratio changes with time — it must be recomputed, not carried forward.",
    tags: ["ratio", "product"],
    timeTargetSec: 105,
  },
  {
    slug: "ag2-product-48-difference-2",
    topic: "ages",
    title: "Product 48, difference 2",
    prompt: "The **product of two sisters' ages is 48** and their **difference is 2**. What is the **sum** of their ages?",
    options: ["12", "14", "16", "20"],
    answer: 1,
    difficulty: "easy",
    hints: ["List factor pairs of 48.", "Which pair differs by 2?"],
    solution:
      "1. Factor pairs of 48: (1, 48), (2, 24), (3, 16), (4, 12), (6, 8).\n2. The pair differing by 2 is 6 and 8.\n3. Sum = **14**.\n\nAnswer: **14**.",
    approach:
      "For small products, list factor pairs instead of solving a quadratic. Algebraically, (a + b)² = (a − b)² + 4ab = 4 + 192 = 196, so a + b = 14.",
    tags: ["factors"],
    timeTargetSec: 50,
  },
  {
    slug: "ag2-present-150-percent-of-past",
    topic: "ages",
    title: "150% of his age eight years ago",
    prompt: "A man's **present age is 150% of his age 8 years ago**. What is his **present age**?",
    options: ["16", "20", "24", "28"],
    answer: 2,
    difficulty: "medium",
    hints: ["Write it as a = 1.5(a − 8).", "Expand and collect the terms in a."],
    solution:
      "1. a = 1.5(a − 8) = 1.5a − 12.\n2. 0.5a = 12 → a = **24**.\n3. Check: eight years ago he was 16, and 150% of 16 is 24. ✓\n\nAnswer: **24**.",
    approach: "Turn the percentage into a multiplier and write one equation. A percentage above 100 always makes the coefficient of a larger on the right, so collect on that side.",
    tags: ["percentages"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-rajan-fifteen-hence",
    topic: "ages",
    title: "Fifteen years hence, five times five back",
    prompt:
      "A man's age **after 15 years** will be **five times his age 5 years ago**. What is his **present age**?",
    options: ["8", "10", "12", "15"],
    answer: 1,
    difficulty: "medium",
    hints: ["Write it as r + 15 = 5(r − 5).", "Expand and collect."],
    solution:
      "1. r + 15 = 5(r − 5) = 5r − 25 → 4r = 40 → r = **10**.\n2. Check: in 15 years he is 25, and five years ago he was 5. ✓\n\nAnswer: **10**.",
    approach: "Translate 'after' as +, 'ago' as −, and 'times' as multiplication of the whole bracket. The rest is one linear equation.",
    tags: ["basics"],
    timeTargetSec: 60,
  },
  {
    slug: "ag2-father-as-old-at-birth",
    topic: "ages",
    title: "As old as you at your birth",
    prompt:
      "A father tells his son, *'I was as old as you are now at the time of your birth.'* If the **father is 38 now**, what was the **son's age five years back**?",
    options: ["14", "19", "24", "33"],
    answer: 0,
    difficulty: "medium",
    hints: ["The father's age at the son's birth is the age difference.", "So the difference equals the son's present age."],
    solution:
      "1. The father's age when the son was born is the difference between their ages, 38 − s.\n2. The statement says that equals the son's present age: 38 − s = s → s = 19.\n3. Five years back the son was 19 − 5 = **14**.\n\nAnswer: **14**.",
    approach:
      "Turn the sentence into an equation about the age difference, then answer the question actually asked — 19 is the present age and is offered as the trap.",
    tags: ["wordy"],
    timeTargetSec: 90,
  },
  {
    slug: "ag2-a-two-older-b-twice-c",
    topic: "ages",
    title: "Three linked ages",
    prompt:
      "**A is two years older than B**, who is **twice as old as C**. If the **total of their ages is 27**, what is **B's age**?",
    options: ["7", "8", "9", "10"],
    answer: 3,
    difficulty: "medium",
    hints: ["Write A and C in terms of B.", "A = B + 2 and C = B/2."],
    solution:
      "1. A = B + 2 and C = B/2.\n2. (B + 2) + B + B/2 = 27 → 2.5B = 25 → B = **10**.\n3. Check: A = 12, B = 10, C = 5, total 27. ✓\n\nAnswer: **10**.",
    approach: "Choose the middle person as the variable so both relations are simple. Solving for C would introduce fractions unnecessarily.",
    tags: ["three people"],
    timeTargetSec: 90,
  },
  {
    slug: "ag2-five-children-three-year-gaps",
    topic: "ages",
    title: "Five children, three years apart",
    prompt:
      "The **sum of the ages of five children** born at intervals of **3 years each** is **50 years**. What is the age of the **youngest**?",
    options: ["4", "6", "8", "10"],
    answer: 0,
    difficulty: "medium",
    hints: ["Let the youngest be x; the others are x + 3, x + 6, x + 9, x + 12.", "The sum is 5x + 30."],
    solution:
      "1. Ages: x, x + 3, x + 6, x + 9, x + 12.\n2. Sum = 5x + 30 = 50 → x = **4**.\n3. Check: 4 + 7 + 10 + 13 + 16 = 50. ✓\n\nAnswer: **4**.",
    approach:
      "For evenly spaced ages the sum is count × middle age, so the middle child is 10 and the youngest is 6 less. Both routes give 4.",
    tags: ["series"],
    timeTargetSec: 75,
  },
  {
    slug: "ag2-husband-wife-child-averages",
    topic: "ages",
    title: "Husband, wife and child",
    prompt:
      "**Three years ago** the average age of a **husband, wife and child was 27**. **Five years ago** the average age of the **wife and child was 20**. What is the **husband's present age**?",
    options: ["35", "40", "42", "45"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Three years ago the three totalled 81, so now they total 90.",
      "Five years ago the wife and child totalled 40, so now they total 50.",
    ],
    solution:
      "1. Three years ago: total = 3 × 27 = 81. Now: 81 + 9 = 90.\n2. Five years ago: wife + child = 2 × 20 = 40. Now: 40 + 10 = 50.\n3. Husband = 90 − 50 = **40**.\n\nAnswer: **40**.",
    approach:
      "Bring every group forward to the present before subtracting, adding one year per person per year. Mixing two different reference times is the trap here.",
    tags: ["averages"],
    timeTargetSec: 120,
  },
  {
    slug: "ag2-family-of-five-youngest",
    topic: "ages",
    title: "The family at the youngest's birth",
    prompt:
      "The average age of a **family of five is 20 years**. The **youngest is 5 years old**. What was the **average age of the family at the birth of the youngest**?",
    options: ["15", "16.25", "18.75", "20"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "At that time the family had four members, each five years younger.",
      "Present total is 100; remove the youngest's 5 and take 5 years off each of the other four.",
    ],
    solution:
      "1. Present total = 5 × 20 = 100.\n2. The other four now total 100 − 5 = 95.\n3. Five years ago they totalled 95 − 4 × 5 = 75.\n4. Average of four = 75 ÷ 4 = **18.75**.\n\nAnswer: **18.75**.",
    approach:
      "Count the members who existed at that time and age each of them back individually. The youngest is excluded entirely, not aged back to zero.",
    tags: ["averages"],
    timeTargetSec: 135,
  },
  {
    slug: "ag2-father-four-more-than-four-times",
    topic: "ages",
    title: "Four more than four times",
    prompt:
      "A father's present age is **4 more than four times his son's**. **After 4 years** he will be **2 more than three times** his son's age. What is the **father's present age**?",
    options: ["24", "28", "32", "36"],
    answer: 1,
    difficulty: "hard",
    hints: ["f = 4s + 4.", "f + 4 = 3(s + 4) + 2."],
    solution:
      "1. f = 4s + 4.\n2. f + 4 = 3(s + 4) + 2 = 3s + 14 → 4s + 8 = 3s + 14 → s = 6.\n3. f = 4 × 6 + 4 = **28**.\n4. Check: in 4 years, 32 and 10, and 3 × 10 + 2 = 32. ✓\n\nAnswer: **28**.",
    approach: "Translate each sentence into an equation exactly as written, including the '+ 4' and '+ 2' constants. Then substitute one into the other.",
    tags: ["algebra"],
    timeTargetSec: 120,
  },
  {
    slug: "ag2-ratio-4-3-a-26-in-six",
    topic: "ages",
    title: "From a future age to a present one",
    prompt:
      "The ages of A and B are in the ratio **4 : 3**. A will be **26 years old in 6 years**. What is **B's present age**?",
    options: ["12", "15", "18", "21"],
    answer: 1,
    difficulty: "easy",
    hints: ["A's present age is 26 − 6.", "Then use the ratio to find B."],
    solution:
      "1. A is 26 − 6 = 20 now.\n2. A : B = 4 : 3, so B = 20 × 3/4 = **15**.\n\nAnswer: **15**.",
    approach: "Bring the given age back to the present first, then apply the ratio. Applying the ratio to the future age gives 19.5 and is wrong.",
    tags: ["ratio"],
    timeTargetSec: 50,
  },
  {
    slug: "ag2-sachin-rahul-difference",
    topic: "ages",
    title: "Younger by seven years",
    prompt:
      "Sachin is **younger than Rahul by 7 years** and their ages are in the ratio **7 : 9**. What is **Sachin's age**?",
    options: ["22.5", "24.5", "26.5", "28"],
    answer: 1,
    difficulty: "medium",
    hints: ["Let the ages be 7x and 9x.", "The difference 2x equals 7."],
    solution:
      "1. Ages: 7x and 9x, so 9x − 7x = 2x = 7 → x = 3.5.\n2. Sachin = 7 × 3.5 = **24.5** years.\n\nAnswer: **24.5**.",
    approach: "The difference of the ratio terms corresponds to the given difference in years. A non-integer x is perfectly acceptable here.",
    tags: ["ratio"],
    timeTargetSec: 60,
  },
  {
    slug: "ag2-five-years-ago-twice",
    topic: "ages",
    title: "Twice as old, five years ago",
    prompt:
      "**Five years ago** A was **twice as old as B**. Their **present ages are in the ratio 9 : 5**. What is **A's present age**?",
    options: ["36", "40", "45", "54"],
    answer: 2,
    difficulty: "medium",
    hints: ["Let the present ages be 9k and 5k.", "Five years ago: 9k − 5 = 2(5k − 5)."],
    solution:
      "1. 9k − 5 = 2(5k − 5) = 10k − 10 → k = 5.\n2. A = 9 × 5 = **45** and B = 25.\n3. Check: five years ago 40 and 20. ✓\n\nAnswer: **45**.",
    approach: "The present ratio supplies the variable and the past condition the equation. Expanding the bracket before collecting keeps the signs straight.",
    tags: ["ratio"],
    timeTargetSec: 90,
  },
  {
    slug: "ag2-sum-of-ages-after-n-years",
    topic: "ages",
    title: "How the sum of ages grows",
    prompt:
      "The **sum of the present ages of a father and son is 60 years**. **Six years ago** the father's age was **five times** the son's. What will the **son's age be after 6 years**?",
    options: ["12", "14", "18", "20"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "Let the son be s now, so the father is 60 − s.",
      "Six years ago: 54 − s = 5(s − 6).",
    ],
    solution:
      "1. Son = s, father = 60 − s.\n2. Six years ago: (60 − s − 6) = 5(s − 6) → 54 − s = 5s − 30 → 6s = 84 → s = 14.\n3. So the son is 14 now and the father 46. Check: six years ago they were 8 and 40, and 40 = 5 × 8. ✓\n4. After 6 years the son will be 14 + 6 = **20**.\n\nAnswer: **20**.",
    approach: "Use the sum to remove one variable, solve for the present, then step forward to the moment the question asks about.",
    tags: ["sum"],
    timeTargetSec: 120,
  },
  {
    slug: "ag2-average-age-of-class-with-teacher",
    topic: "ages",
    title: "A teacher among the students",
    prompt:
      "The average age of a class of **24 students is 16 years**. If the **teacher's age is included**, the average rises by **1 year**. What is the **teacher's age**?",
    options: ["31", "36", "41", "45"],
    answer: 2,
    difficulty: "medium",
    hints: ["The new average is 17 across 25 people.", "25 × 17 − 24 × 16."],
    solution:
      "1. Students' total = 24 × 16 = 384.\n2. Total with teacher = 25 × 17 = 425.\n3. Teacher = 425 − 384 = **41**.\n\nAnswer: **41**.",
    approach: "New average + old count × rise = 17 + 24 = 41. The newcomer sits at the new average and lifts every existing member by the increase.",
    tags: ["averages"],
    timeTargetSec: 60,
  },
  {
    slug: "ag2-elder-thrice-younger-difference",
    topic: "ages",
    title: "Three times as old, twelve years apart",
    prompt:
      "The ages of two brothers **differ by 12 years** and the **elder is three times as old** as the younger. What is the **elder brother's age**?",
    options: ["12", "15", "18", "24"],
    answer: 2,
    difficulty: "easy",
    hints: ["Younger = y, elder = 3y.", "3y − y = 12."],
    solution: "1. 3y − y = 2y = 12 → y = 6.\n2. Elder = 3 × 6 = **18**.\n\nAnswer: **18**.",
    approach: "When one age is a multiple of the other, the difference is (multiple − 1) times the smaller. One division finishes it.",
    tags: ["difference"],
    timeTargetSec: 50,
  },
];

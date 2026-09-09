import type { AptitudeSeed } from "./types.js";

/**
 * Number system — the questions that actually turn up.
 *
 * These are the standard problems of the Indian placement circuit: TCS NQT,
 * Infosys, Wipro, Capgemini and the bank clerical papers, and the worked
 * chapters of Aggarwal and Guha that every candidate is drilled on. The
 * numbers and phrasings are the ones in circulation, not invented variants.
 */
export const BANK_NUMBER_SYSTEM: AptitudeSeed[] = [
  {
    slug: "ns2-unit-digit-7pow95-minus-3pow58",
    topic: "number-system",
    title: "Unit digit of 7⁹⁵ − 3⁵⁸",
    prompt: "What is the unit digit of **7⁹⁵ − 3⁵⁸**?",
    options: ["0", "2", "4", "6"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Unit digits of both 7ⁿ and 3ⁿ repeat every four powers.",
      "95 mod 4 = 3 and 58 mod 4 = 2. Read the third and second entries of each cycle.",
      "The first unit digit is smaller than the second, so borrow ten before subtracting.",
    ],
    solution:
      "1. Unit digits of 7ⁿ cycle 7, 9, 3, 1. 95 mod 4 = 3, so 7⁹⁵ ends in **3**.\n2. Unit digits of 3ⁿ cycle 3, 9, 7, 1. 58 mod 4 = 2, so 3⁵⁸ ends in **9**.\n3. 3 − 9 is negative, so borrow: 13 − 9 = **4**.\n\nAnswer: **4**.",
    approach:
      "Reduce each power to its unit digit with the mod-4 cycle, then do the arithmetic on those two digits alone. For a subtraction whose first digit is the smaller, borrow ten — this is the step that catches most candidates out.",
    tags: ["unit digit", "cyclicity"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-remainder-2pow51-by-7",
    topic: "number-system",
    title: "Remainder of 2⁵¹ ÷ 7",
    prompt: "What is the remainder when **2⁵¹** is divided by **7**?",
    options: ["1", "2", "4", "6"],
    answer: 0,
    difficulty: "medium",
    hints: ["Find the smallest power of 2 that leaves remainder 1 on division by 7.", "2³ = 8 = 7 + 1, so 2³ ≡ 1 (mod 7). Now write 51 as a multiple of 3."],
    solution:
      "1. 2³ = 8 ≡ 1 (mod 7).\n2. 51 = 3 × 17, so 2⁵¹ = (2³)¹⁷ ≡ 1¹⁷ = **1** (mod 7).\n\nAnswer: **1**.",
    approach:
      "Look for the smallest exponent that brings the base to 1 modulo the divisor, then reduce the given exponent by that cycle length. This beats Fermat's theorem for small numbers because the cycle is often shorter than p − 1.",
    tags: ["remainders", "cyclicity"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-largest-four-digit-divisible-88",
    topic: "number-system",
    title: "Largest four-digit multiple of 88",
    prompt: "What is the **largest four-digit number** exactly divisible by **88**?",
    options: ["9944", "9954", "9968", "9988"],
    answer: 0,
    difficulty: "easy",
    hints: ["Start from 9999 and divide by 88.", "9999 ÷ 88 leaves a remainder; subtract it."],
    solution:
      "1. 9999 ÷ 88 = 113 remainder 55.\n2. So the largest multiple is 9999 − 55 = **9944**.\n3. Check: 88 × 113 = 9944. ✓\n\nAnswer: **9944**.",
    approach:
      "For the largest n-digit multiple, divide the largest n-digit number by the divisor and subtract the remainder. For the smallest, divide the smallest n-digit number and add whatever is needed to reach the next multiple.",
    tags: ["divisibility"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-hcf-of-decimals",
    topic: "number-system",
    title: "HCF of 1.75, 5.6 and 7",
    prompt: "Find the **HCF of 1.75, 5.6 and 7**.",
    options: ["0.07", "0.35", "0.7", "1.75"],
    answer: 1,
    difficulty: "medium",
    hints: ["Give every number the same number of decimal places, then drop the point.", "175, 560 and 700 — take their HCF and put the two decimal places back."],
    solution:
      "1. Write them to two decimals: 1.75, 5.60, 7.00 → 175, 560, 700.\n2. HCF(175, 560, 700): 175 = 5² × 7, 560 = 2⁴ × 5 × 7, 700 = 2² × 5² × 7 → common part 5 × 7 = 35.\n3. Restore two decimal places: **0.35**.\n\nAnswer: **0.35**.",
    approach:
      "Never take an HCF of decimals directly. Pad every number to the same decimal length, treat them as integers, and shift the point back at the end. The same rule works for LCM.",
    tags: ["hcf", "decimals"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-lcm-of-five-numbers",
    topic: "number-system",
    title: "LCM of 22, 54, 108, 135 and 198",
    prompt: "Find the **LCM of 22, 54, 108, 135 and 198**.",
    options: ["1980", "2970", "5940", "11880"],
    answer: 2,
    difficulty: "medium",
    hints: ["Factorise each number into primes.", "Take the highest power of each prime that appears anywhere."],
    solution:
      "1. 22 = 2 × 11, 54 = 2 × 3³, 108 = 2² × 3³, 135 = 3³ × 5, 198 = 2 × 3² × 11.\n2. Highest powers: 2², 3³, 5, 11.\n3. LCM = 4 × 27 × 5 × 11 = **5940**.\n\nAnswer: **5940**.",
    approach:
      "LCM takes the highest power of every prime present; HCF takes the lowest power of the primes present in all. Writing the factorisations in a column makes both readable at a glance.",
    tags: ["lcm", "prime factorisation"],
    timeTargetSec: 90,
  },
  {
    slug: "ns2-trailing-zeros-125-factorial",
    topic: "number-system",
    title: "Trailing zeros in 125!",
    prompt: "How many zeros are there at the end of **125!**?",
    options: ["25", "28", "31", "36"],
    answer: 2,
    difficulty: "medium",
    hints: ["Count the factors of 5, since factors of 2 are always more plentiful.", "Add ⌊125/5⌋ + ⌊125/25⌋ + ⌊125/125⌋."],
    solution:
      "1. ⌊125/5⌋ = 25\n2. ⌊125/25⌋ = 5\n3. ⌊125/125⌋ = 1\n4. Total = 25 + 5 + 1 = **31**.\n\nAnswer: **31**.",
    approach:
      "Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …, stopping when the power of 5 passes n. Candidates who stop after the first term get 25, which is why it is offered.",
    tags: ["factorial", "trailing zeros"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-remainder-one-divisible-thirteen",
    topic: "number-system",
    title: "Remainder 1 with every divisor, but divisible by 13",
    prompt:
      "Find the **least number** which, when divided by **6, 7, 8, 9 and 10**, leaves a remainder of **1** in each case, but is **exactly divisible by 13**.",
    options: ["3361", "10081", "17641", "25201"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "A number leaving remainder 1 with all five divisors has the form (LCM × k) + 1.",
      "LCM(6, 7, 8, 9, 10) = 2520, so the number is 2520k + 1.",
      "Now find the smallest k that makes 2520k + 1 a multiple of 13.",
    ],
    solution:
      "1. LCM(6, 7, 8, 9, 10) = 2520, so the number is of the form 2520k + 1.\n2. 2520 = 13 × 193 + 11, so 2520k + 1 ≡ 11k + 1 (mod 13).\n3. Need 11k + 1 ≡ 0, i.e. 11k ≡ 12 (mod 13). Testing k = 1, 2, 3 … gives k = 7 (11 × 7 = 77 = 65 + 12 ✓).\n4. The number is 2520 × 7 + 1 = **17641**, and 17641 ÷ 13 = 1357. ✓\n\nAnswer: **17641**.",
    approach:
      "Two conditions, two steps: the 'same remainder' condition fixes the form LCM·k + r, and the divisibility condition fixes k. Testing k = 1, 2, 3 … against the second condition is quicker than any formal congruence work at this size.",
    tags: ["lcm", "remainders"],
    timeTargetSec: 150,
  },
  {
    slug: "ns2-remainder-342-then-19",
    topic: "number-system",
    title: "From a remainder of 47 to a remainder mod 19",
    prompt: "On dividing a number by **342**, the remainder is **47**. What will the remainder be when the **same number is divided by 19**?",
    options: ["5", "9", "18", "Cannot be determined"],
    answer: 1,
    difficulty: "medium",
    hints: ["Write the number as 342k + 47.", "342 is itself a multiple of 19, so only 47 matters."],
    solution:
      "1. The number is N = 342k + 47.\n2. 342 = 19 × 18, so 342k is divisible by 19 and contributes nothing to the remainder.\n3. 47 = 19 × 2 + 9, so the remainder is **9**.\n\nAnswer: **9**.",
    approach:
      "When the second divisor divides the first, the answer depends only on the given remainder. When it does not, the remainder genuinely cannot be determined — which is why that option is always offered.",
    tags: ["remainders"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-prime-factors-count",
    topic: "number-system",
    title: "How many prime factors in all",
    prompt: "What is the **total number of prime factors** in the expression **6¹⁰ × 7¹⁷ × 11²⁷**?",
    options: ["54", "64", "71", "81"],
    answer: 1,
    difficulty: "easy",
    hints: ["6 is not prime — break it up first.", "6¹⁰ = 2¹⁰ × 3¹⁰. Now add all the exponents."],
    solution:
      "1. 6¹⁰ = (2 × 3)¹⁰ = 2¹⁰ × 3¹⁰.\n2. The expression is 2¹⁰ × 3¹⁰ × 7¹⁷ × 11²⁷.\n3. Total prime factors counted with multiplicity = 10 + 10 + 17 + 27 = **64**.\n\nAnswer: **64**.",
    approach:
      "'Number of prime factors' in these papers means counted with repetition, so it is just the sum of the exponents once every base is prime. The trap is leaving a composite base such as 6 unfactored.",
    tags: ["prime factorisation"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-greatest-number-same-remainder",
    topic: "number-system",
    title: "Same remainder from three numbers",
    prompt: "Find the **greatest number** that will divide **62, 132 and 237** leaving the **same remainder** in each case.",
    options: ["25", "30", "35", "70"],
    answer: 2,
    difficulty: "medium",
    hints: ["Subtract the numbers in pairs — the common remainder cancels out.", "Take the HCF of 132 − 62, 237 − 132 and 237 − 62."],
    solution:
      "1. Differences: 132 − 62 = 70, 237 − 132 = 105, 237 − 62 = 175.\n2. HCF(70, 105, 175) = 35.\n3. Check: 62 = 35 × 1 + 27, 132 = 35 × 3 + 27, 237 = 35 × 6 + 27 — remainder 27 each time. ✓\n\nAnswer: **35**.",
    approach:
      "For an unknown but equal remainder, take the HCF of the pairwise differences: subtracting two numbers of the form dq + r removes r entirely. When the remainder is given instead, subtract it from each number first.",
    tags: ["hcf", "remainders"],
    timeTargetSec: 90,
  },
  {
    slug: "ns2-unit-digit-three-factors",
    topic: "number-system",
    title: "Unit digit of 3⁶⁵ × 6⁵⁹ × 7⁷¹",
    prompt: "What is the unit digit of **3⁶⁵ × 6⁵⁹ × 7⁷¹**?",
    options: ["2", "4", "6", "8"],
    answer: 1,
    difficulty: "medium",
    hints: ["Handle each factor's unit digit separately, then multiply them.", "Powers of 6 always end in 6."],
    solution:
      "1. 3ⁿ cycles 3, 9, 7, 1; 65 mod 4 = 1 → unit digit **3**.\n2. 6ⁿ always ends in **6**.\n3. 7ⁿ cycles 7, 9, 3, 1; 71 mod 4 = 3 → unit digit **3**.\n4. 3 × 6 = 18 → 8; 8 × 3 = 24 → **4**.\n\nAnswer: **4**.",
    approach:
      "Multiply only the unit digits, reducing to a single digit after each step. Remember the fixed points: 0, 1, 5 and 6 always end in themselves, whatever the power.",
    tags: ["unit digit", "cyclicity"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-even-factors-1440",
    topic: "number-system",
    title: "Even factors of 1440",
    prompt: "How many **even factors** does **1440** have?",
    options: ["18", "24", "30", "36"],
    answer: 2,
    difficulty: "medium",
    hints: ["Factorise 1440 first.", "An even factor must take at least one 2, so fix one 2 aside and count the factors of what remains."],
    solution:
      "1. 1440 = 2⁵ × 3² × 5.\n2. An even factor is 2 × (a factor of 2⁴ × 3² × 5).\n3. That count is (4 + 1)(2 + 1)(1 + 1) = 5 × 3 × 2 = **30**.\n4. Check: total factors = 6 × 3 × 2 = 36, of which 6 are odd, leaving 30 even. ✓\n\nAnswer: **30**.",
    approach:
      "Even factors = total factors − odd factors, and the odd ones are the factors of the number with all its 2s removed. Both routes agree; the second is faster when the power of 2 is large.",
    tags: ["factors"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-least-added-1056-23",
    topic: "number-system",
    title: "Least number to add",
    prompt: "What is the **least number** that must be **added to 1056** so that the sum is exactly divisible by **23**?",
    options: ["2", "3", "18", "21"],
    answer: 0,
    difficulty: "easy",
    hints: ["Divide 1056 by 23 and look at the remainder.", "Add whatever takes the remainder up to 23."],
    solution:
      "1. 1056 ÷ 23 = 45 remainder 21.\n2. To reach the next multiple, add 23 − 21 = **2**.\n3. Check: 1058 = 23 × 46. ✓\n\nAnswer: **2**.",
    approach:
      "To add: divisor − remainder. To subtract: the remainder itself. Confusing the two is the whole point of offering 21 alongside 2.",
    tags: ["divisibility"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-largest-of-four-powers",
    topic: "number-system",
    title: "Which power is the largest",
    prompt: "Which of the following is the **largest**?\n\n**2⁶⁰, 3⁴⁰, 4³⁰, 5²⁰**",
    options: ["2⁶⁰", "3⁴⁰", "4³⁰", "5²⁰"],
    answer: 1,
    difficulty: "medium",
    hints: ["Make the exponents equal by taking a common factor out of each.", "All four exponents are multiples of 20."],
    solution:
      "1. Write each with exponent 20: 2⁶⁰ = (2³)²⁰ = 8²⁰, 3⁴⁰ = (3²)²⁰ = 9²⁰, 4³⁰ = (4³)¹⁰ = 64¹⁰ = 8²⁰, 5²⁰ = 5²⁰.\n2. Comparing bases 8, 9, 8 and 5 at the same power of 20, the largest is 9²⁰.\n3. So **3⁴⁰** is the largest.\n\nAnswer: **3⁴⁰**.",
    approach:
      "To compare powers, force a common exponent (usually the HCF of the exponents) and then compare bases. Forcing a common base instead only works when the bases share one.",
    tags: ["powers", "comparison"],
    timeTargetSec: 90,
  },
  {
    slug: "ns2-surd-expression-value",
    topic: "number-system",
    title: "Value of a surd expression",
    prompt: "If **x = 1/(2 − √3)**, find the value of **x³ − 2x² − 7x + 5**.",
    options: ["1", "2", "3", "5"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Rationalise the denominator first.",
      "x = 2 + √3, so x − 2 = √3 and therefore x² − 4x + 1 = 0.",
      "Divide the cubic by x² − 4x + 1 and use the fact that the divisor is zero.",
    ],
    solution:
      "1. x = 1/(2 − √3) × (2 + √3)/(2 + √3) = (2 + √3)/(4 − 3) = 2 + √3.\n2. Then x − 2 = √3, so squaring gives x² − 4x + 4 = 3, i.e. **x² − 4x + 1 = 0**.\n3. Divide: x³ − 2x² − 7x + 5 = (x² − 4x + 1)(x + 2) + 3.\n4. The first term vanishes, leaving **3**.\n\nAnswer: **3**.",
    approach:
      "Rationalise, then convert the surd into a quadratic the variable satisfies. Reducing the higher polynomial by that quadratic avoids ever cubing a surd, which is where the arithmetic normally breaks down.",
    tags: ["surds", "algebra"],
    timeTargetSec: 150,
  },
  {
    slug: "ns2-factorial-sum-remainder-24",
    topic: "number-system",
    title: "Remainder of a factorial sum",
    prompt: "What is the remainder when **1! + 2! + 3! + … + 100!** is divided by **24**?",
    options: ["6", "9", "15", "21"],
    answer: 1,
    difficulty: "medium",
    hints: ["24 = 4!, so think about which terms are multiples of 24.", "Every factorial from 4! onwards contains 4! as a factor."],
    solution:
      "1. 4! = 24, and every factorial after it contains 4! as a factor, so 4! + 5! + … + 100! is divisible by 24.\n2. Only 1! + 2! + 3! = 1 + 2 + 6 = 9 is left.\n3. 9 < 24, so the remainder is **9**.\n\nAnswer: **9**.",
    approach:
      "In a factorial sum, everything from the divisor's own factorial onwards vanishes. Add the handful of terms below it and reduce — the sum is never large.",
    tags: ["factorial", "remainders"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-hcf-lcm-other-number",
    topic: "number-system",
    title: "Finding the second number",
    prompt: "The **HCF** of two numbers is **11** and their **LCM** is **693**. If one of the numbers is **77**, what is the other?",
    options: ["66", "88", "99", "121"],
    answer: 2,
    difficulty: "easy",
    hints: ["HCF × LCM = product of the two numbers.", "11 × 693 = 7623; now divide by 77."],
    solution:
      "1. HCF × LCM = first × second, so 11 × 693 = 77 × second.\n2. Second = 7623 ÷ 77 = **99**.\n3. Check: HCF(77, 99) = 11 and LCM(77, 99) = 693. ✓\n\nAnswer: **99**.",
    approach:
      "The identity HCF × LCM = a × b holds only for two numbers. Always verify the answer by checking that the HCF of the pair really is what was given.",
    tags: ["hcf", "lcm"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-product-4107-hcf-37",
    topic: "number-system",
    title: "The larger of two numbers",
    prompt: "The product of two numbers is **4107** and their **HCF is 37**. What is the **larger** number?",
    options: ["37", "74", "111", "148"],
    answer: 2,
    difficulty: "medium",
    hints: ["Write the numbers as 37a and 37b where a and b are coprime.", "Then 37² × ab = 4107, so ab = 3."],
    solution:
      "1. Let the numbers be 37a and 37b with a and b coprime.\n2. 37a × 37b = 4107 → 1369ab = 4107 → ab = 3.\n3. Coprime pair: a = 1, b = 3, so the numbers are 37 and 111.\n4. The larger is **111**.\n\nAnswer: **111**.",
    approach:
      "Pull the HCF out of both numbers and the leftovers must be coprime. That coprimality is what makes the factor pair unique — without it, ab = 3 would have other splits.",
    tags: ["hcf"],
    timeTargetSec: 90,
  },
  {
    slug: "ns2-digits-in-2pow40",
    topic: "number-system",
    title: "How many digits in 2⁴⁰",
    prompt: "How many **digits** are there in **2⁴⁰**? (Take log₁₀2 = 0.3010.)",
    options: ["12", "13", "14", "15"],
    answer: 1,
    difficulty: "medium",
    hints: ["The digit count of N is ⌊log₁₀N⌋ + 1.", "log₁₀(2⁴⁰) = 40 × 0.3010."],
    solution:
      "1. log₁₀(2⁴⁰) = 40 × 0.3010 = 12.04.\n2. Number of digits = ⌊12.04⌋ + 1 = 12 + 1 = **13**.\n\nAnswer: **13**.",
    approach:
      "Digits of N = ⌊log₁₀N⌋ + 1. The integer part tells you the power of ten; the +1 is the leading digit itself. Forgetting the +1 gives 12, which is offered.",
    tags: ["logarithms"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-remainder-17pow200-by-18",
    topic: "number-system",
    title: "Remainder of 17²⁰⁰ ÷ 18",
    prompt: "What is the remainder when **17²⁰⁰** is divided by **18**?",
    options: ["1", "8", "16", "17"],
    answer: 0,
    difficulty: "medium",
    hints: ["17 is one less than 18.", "So 17 ≡ −1 (mod 18), and the exponent is even."],
    solution:
      "1. 17 ≡ −1 (mod 18).\n2. 17²⁰⁰ ≡ (−1)²⁰⁰ = 1 (mod 18) because the exponent is even.\n3. The remainder is **1**.\n\nAnswer: **1**.",
    approach:
      "A base one less than the divisor is −1 in disguise: even powers give 1, odd powers give the divisor minus 1. Spotting this saves the whole cyclicity calculation.",
    tags: ["remainders"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-total-factors-4200",
    topic: "number-system",
    title: "Total factors of 4200",
    prompt: "How many **factors** does **4200** have?",
    options: ["36", "42", "48", "56"],
    answer: 2,
    difficulty: "medium",
    hints: ["Factorise 4200 into primes.", "4200 = 2³ × 3 × 5² × 7. Multiply (exponent + 1) across."],
    solution:
      "1. 4200 = 2³ × 3¹ × 5² × 7¹.\n2. Number of factors = (3 + 1)(1 + 1)(2 + 1)(1 + 1) = 4 × 2 × 3 × 2 = **48**.\n\nAnswer: **48**.",
    approach:
      "Each factor chooses an exponent from 0 up to the power available, so multiply (exponent + 1) over all primes. Forgetting a prime with exponent 1 halves the count.",
    tags: ["factors"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-sum-of-factors-36",
    topic: "number-system",
    title: "Sum of all factors of 36",
    prompt: "What is the **sum of all the factors** of **36**?",
    options: ["55", "78", "91", "96"],
    answer: 2,
    difficulty: "medium",
    hints: ["36 = 2² × 3².", "Sum of factors = (1 + 2 + 4)(1 + 3 + 9)."],
    solution:
      "1. 36 = 2² × 3².\n2. Sum of factors = (1 + 2 + 4) × (1 + 3 + 9) = 7 × 13 = **91**.\n3. Check by listing: 1 + 2 + 3 + 4 + 6 + 9 + 12 + 18 + 36 = 91. ✓\n\nAnswer: **91**.",
    approach:
      "The sum of factors multiplies one geometric series per prime. It is worth learning alongside the count formula, because papers ask for both from the same factorisation.",
    tags: ["factors"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-greatest-four-digit-lcm",
    topic: "number-system",
    title: "Greatest four-digit common multiple",
    prompt: "What is the **greatest four-digit number** divisible by **15, 25, 40 and 75**?",
    options: ["9000", "9200", "9600", "9800"],
    answer: 2,
    difficulty: "medium",
    hints: ["Find the LCM of the four divisors first.", "LCM = 600; now find the largest four-digit multiple of 600."],
    solution:
      "1. 15 = 3 × 5, 25 = 5², 40 = 2³ × 5, 75 = 3 × 5² → LCM = 2³ × 3 × 5² = 600.\n2. 9999 ÷ 600 = 16 remainder 399.\n3. Greatest multiple = 9999 − 399 = **9600**.\n\nAnswer: **9600**.",
    approach: "Divisible by several numbers means divisible by their LCM. Reduce to one divisor first, then it is an ordinary largest-multiple question.",
    tags: ["lcm", "divisibility"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-missing-digit-divisible-3",
    topic: "number-system",
    title: "A missing digit and divisibility by 3",
    prompt: "If the number **517*324** is completely divisible by **3**, what is the **smallest** digit that can replace ***?",
    options: ["0", "1", "2", "4"],
    answer: 2,
    difficulty: "easy",
    hints: ["Divisibility by 3 depends only on the digit sum.", "5 + 1 + 7 + x + 3 + 2 + 4 = 22 + x."],
    solution:
      "1. Digit sum = 5 + 1 + 7 + x + 3 + 2 + 4 = 22 + x.\n2. The smallest x making this a multiple of 3 is x = 2 (giving 24).\n3. So the digit is **2**.\n\nAnswer: **2**.",
    approach:
      "Sum the known digits once, then ask what the unknown must add to reach the next multiple. Divisibility by 9 works the same way; divisibility by 11 uses the alternating sum instead.",
    tags: ["divisibility"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-primes-below-fifty",
    topic: "number-system",
    title: "Primes below 50",
    prompt: "How many **prime numbers** are there **between 1 and 50**?",
    options: ["13", "14", "15", "16"],
    answer: 2,
    difficulty: "easy",
    hints: ["1 is not prime; 2 is the only even prime.", "Count them in tens: four below 10, four in the twenties, and so on."],
    solution:
      "1. The primes are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47.\n2. Counting them gives **15**.\n\nAnswer: **15**.",
    approach:
      "Worth memorising: there are 15 primes below 50 and 25 below 100. The count by decade is 4, 4, 2, 2, 3, 2, 2, 3, 2, 1.",
    tags: ["primes"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-least-subtracted-9999-45",
    topic: "number-system",
    title: "Least number to subtract",
    prompt: "What is the **least number** that must be **subtracted from 9999** to make it divisible by **45**?",
    options: ["9", "18", "27", "36"],
    answer: 0,
    difficulty: "easy",
    hints: ["Divide 9999 by 45 and keep the remainder.", "The remainder is exactly what must go."],
    solution:
      "1. 9999 ÷ 45 = 222 remainder 9.\n2. Subtracting the remainder gives 9999 − 9 = 9990 = 45 × 222. ✓\n3. So subtract **9**.\n\nAnswer: **9**.",
    approach: "Subtract the remainder; add (divisor − remainder). One division answers both versions of the question.",
    tags: ["divisibility"],
    timeTargetSec: 40,
  },
  {
    slug: "ns2-sum-odd-numbers-100-200",
    topic: "number-system",
    title: "Sum of odd numbers between 100 and 200",
    prompt: "What is the **sum of all odd numbers between 100 and 200**?",
    options: ["7000", "7250", "7500", "7750"],
    answer: 2,
    difficulty: "medium",
    hints: ["The first is 101 and the last is 199.", "Count them, then use (first + last)/2 × count."],
    solution:
      "1. The odd numbers run 101, 103, …, 199.\n2. Count = (199 − 101)/2 + 1 = 50.\n3. Sum = 50 × (101 + 199)/2 = 50 × 150 = **7500**.\n\nAnswer: **7500**.",
    approach:
      "Any evenly spaced list sums to count × average, and the average is (first + last)/2. Getting the count right is the only real work: (last − first)/step + 1.",
    tags: ["series"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-telescoping-series",
    topic: "number-system",
    title: "A telescoping sum",
    prompt: "Find the value of:\n\n**1/(1×2) + 1/(2×3) + 1/(3×4) + … + 1/(9×10)**",
    options: ["1/10", "1/2", "9/10", "1"],
    answer: 2,
    difficulty: "medium",
    hints: ["Write 1/(n(n+1)) as a difference of two fractions.", "1/(n(n+1)) = 1/n − 1/(n+1); now write the terms out and watch them cancel."],
    solution:
      "1. 1/(n(n + 1)) = 1/n − 1/(n + 1).\n2. The sum becomes (1/1 − 1/2) + (1/2 − 1/3) + … + (1/9 − 1/10).\n3. Everything cancels except 1 − 1/10 = **9/10**.\n\nAnswer: **9/10**.",
    approach:
      "Splitting a product denominator into a difference makes the middle terms cancel in pairs. The general result is 1 − 1/(n + 1) = n/(n + 1) for the sum up to 1/(n(n+1)).",
    tags: ["series"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-difference-of-consecutive-odd-squares",
    topic: "number-system",
    title: "Squares of consecutive odd integers",
    prompt: "The **difference between the squares of two consecutive odd integers** is always divisible by:",
    options: ["3", "6", "7", "8"],
    answer: 3,
    difficulty: "medium",
    hints: ["Call them n and n + 2, with n odd.", "(n + 2)² − n² = 4n + 4 = 4(n + 1), and n + 1 is even."],
    solution:
      "1. Let the integers be n and n + 2 with n odd.\n2. (n + 2)² − n² = 4n + 4 = 4(n + 1).\n3. Since n is odd, n + 1 is even, so 4(n + 1) is a multiple of **8**.\n4. Check: 5² − 3² = 16, 7² − 5² = 24, 9² − 7² = 32 — all multiples of 8. ✓\n\nAnswer: **8**.",
    approach:
      "Algebra first, then test on the smallest case. The parity of n is what upgrades the obvious factor of 4 to a factor of 8, and it is exactly the step candidates skip.",
    tags: ["algebra", "divisibility"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-remainder-sum-of-powers",
    topic: "number-system",
    title: "Remainder of 6¹⁷ + 17⁶ ÷ 7",
    prompt: "What is the remainder when **6¹⁷ + 17⁶** is divided by **7**?",
    options: ["0", "1", "5", "6"],
    answer: 0,
    difficulty: "hard",
    hints: ["Reduce each base modulo 7 first: 6 ≡ −1 and 17 ≡ 3.", "For 3⁶ mod 7, note that 3⁶ = (3³)² and 3³ = 27 ≡ 6 ≡ −1."],
    solution:
      "1. 6 ≡ −1 (mod 7), and 17 is odd, so 6¹⁷ ≡ (−1)¹⁷ = −1 ≡ 6 (mod 7).\n2. 17 ≡ 3 (mod 7). Now 3³ = 27 ≡ 6 ≡ −1, so 3⁶ = (3³)² ≡ 1 (mod 7).\n3. Sum ≡ 6 + 1 = 7 ≡ **0** (mod 7).\n\nAnswer: **0**.",
    approach:
      "Reduce every base modulo the divisor before touching the exponents, and treat each term separately before adding. A base that reduces to −1 collapses instantly on parity.",
    tags: ["remainders"],
    timeTargetSec: 120,
  },
  {
    slug: "ns2-count-multiples-between",
    topic: "number-system",
    title: "Counting common multiples in a range",
    prompt: "How many numbers **between 200 and 600** are divisible by **4, 5 and 6**?",
    options: ["5", "6", "7", "8"],
    answer: 1,
    difficulty: "medium",
    hints: ["Divisible by all three means divisible by their LCM.", "LCM(4, 5, 6) = 60. List the multiples of 60 in the range."],
    solution:
      "1. LCM(4, 5, 6) = 60.\n2. Multiples of 60 strictly between 200 and 600: 240, 300, 360, 420, 480, 540.\n3. That is **6** numbers.\n\nAnswer: **6**.",
    approach:
      "Convert to a single divisor with the LCM, then count with ⌊upper/d⌋ − ⌊lower/d⌋, checking whether the endpoints themselves are meant to be included.",
    tags: ["lcm", "counting"],
    timeTargetSec: 60,
  },
  {
    slug: "ns2-6n-squared-plus-6n",
    topic: "number-system",
    title: "A divisibility that always holds",
    prompt: "For every natural number **n**, the expression **6n² + 6n** is always divisible by:",
    options: ["6", "12", "18", "24"],
    answer: 1,
    difficulty: "medium",
    hints: ["Factorise the expression.", "6n(n + 1), and one of n, n + 1 must be even."],
    solution:
      "1. 6n² + 6n = 6n(n + 1).\n2. n and n + 1 are consecutive, so one of them is even and n(n + 1) is always even.\n3. Therefore 6n(n + 1) is always a multiple of 6 × 2 = **12**.\n4. Check n = 1: 12; n = 2: 36; n = 3: 72 — all multiples of 12, and 36 is not a multiple of 24, ruling that out. ✓\n\nAnswer: **12**.",
    approach:
      "Factorise, then use the fact that a product of consecutive integers carries guaranteed factors: two consecutive always give a 2, three consecutive always give a 6. Testing one or two small values rules out the larger options.",
    tags: ["algebra", "divisibility"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-crt-two-conditions",
    topic: "number-system",
    title: "Two remainders at once",
    prompt: "What is the **smallest number** that leaves a remainder of **3 when divided by 5** and a remainder of **5 when divided by 7**?",
    options: ["23", "26", "33", "38"],
    answer: 2,
    difficulty: "medium",
    hints: ["List the numbers leaving remainder 3 on division by 5: 3, 8, 13, 18, …", "Test each against the second condition."],
    solution:
      "1. Numbers leaving remainder 3 with 5: 3, 8, 13, 18, 23, 28, 33, …\n2. Testing each against division by 7: 33 = 7 × 4 + 5. ✓\n3. The smallest such number is **33**.\n\nAnswer: **33**.",
    approach:
      "Write out the sequence for the larger modulus's condition, or the one with fewer candidates, and test against the other. Formal congruence machinery is rarely faster at exam scale.",
    tags: ["remainders"],
    timeTargetSec: 75,
  },
  {
    slug: "ns2-unit-digit-4pow54",
    topic: "number-system",
    title: "Unit digit of 4⁵⁴",
    prompt: "What is the unit digit of **4⁵⁴**?",
    options: ["2", "4", "6", "8"],
    answer: 2,
    difficulty: "easy",
    hints: ["Powers of 4 alternate between two unit digits.", "4¹ ends in 4, 4² ends in 6, and it repeats."],
    solution:
      "1. Unit digits of 4ⁿ alternate: 4, 6, 4, 6, …\n2. Odd powers end in 4, even powers end in 6.\n3. 54 is even, so the unit digit is **6**.\n\nAnswer: **6**.",
    approach:
      "Bases 4 and 9 have a cycle of length 2, not 4: odd power keeps the base's digit, even power gives 6 and 1 respectively. Recognising the short cycles saves time.",
    tags: ["unit digit"],
    timeTargetSec: 40,
  },
  {
    slug: "ns2-power-equation",
    topic: "number-system",
    title: "Solving a power equation",
    prompt: "If **5ˣ = 3125**, what is the value of **5⁽ˣ⁻³⁾**?",
    options: ["5", "25", "125", "625"],
    answer: 1,
    difficulty: "easy",
    hints: ["Write 3125 as a power of 5.", "3125 = 5⁵, so x = 5."],
    solution:
      "1. 3125 = 5⁵, so x = 5.\n2. 5⁽ˣ⁻³⁾ = 5² = **25**.\n\nAnswer: **25**.",
    approach:
      "Rewrite both sides with the same base and equate the exponents. Worth memorising: 5⁵ = 3125, 2¹⁰ = 1024, 3⁵ = 243, 7⁴ = 2401.",
    tags: ["powers"],
    timeTargetSec: 40,
  },
  {
    slug: "ns2-sum-first-20-even",
    topic: "number-system",
    title: "Sum of the first 20 even numbers",
    prompt: "What is the **sum of the first 20 even numbers**?",
    options: ["380", "400", "420", "440"],
    answer: 2,
    difficulty: "easy",
    hints: ["The numbers are 2, 4, 6, …, 40.", "Sum of the first n even numbers is n(n + 1)."],
    solution:
      "1. The numbers are 2, 4, …, 40, which is 2 × (1 + 2 + … + 20).\n2. = 2 × (20 × 21)/2 = 20 × 21 = **420**.\n\nAnswer: **420**.",
    approach:
      "Sum of the first n even numbers is n(n + 1); of the first n odd numbers it is n²; of the first n naturals, n(n + 1)/2. All three come up constantly.",
    tags: ["series"],
    timeTargetSec: 40,
  },
  {
    slug: "ns2-least-added-4321-19",
    topic: "number-system",
    title: "Making 4321 divisible by 19",
    prompt: "What is the **least number** that must be **added to 4321** to make it exactly divisible by **19**?",
    options: ["8", "11", "13", "17"],
    answer: 1,
    difficulty: "easy",
    hints: ["Divide 4321 by 19.", "19 × 227 = 4313, so the remainder is 8."],
    solution:
      "1. 4321 ÷ 19 = 227 remainder 8.\n2. Add 19 − 8 = **11**.\n3. Check: 4332 = 19 × 228. ✓\n\nAnswer: **11**.",
    approach: "Divisor minus remainder gives the amount to add. Offering the remainder itself (8) as a choice is the standard trap.",
    tags: ["divisibility"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-three-digit-divisible-by-9-and-11",
    topic: "number-system",
    title: "Divisible by both 9 and 11",
    prompt: "What is the **largest three-digit number** divisible by both **9 and 11**?",
    options: ["891", "909", "990", "999"],
    answer: 2,
    difficulty: "easy",
    hints: ["9 and 11 are coprime, so the number must be a multiple of 99.", "Find the largest three-digit multiple of 99."],
    solution:
      "1. Since 9 and 11 are coprime, the number must be divisible by 99.\n2. 999 ÷ 99 = 10 remainder 9, so the largest multiple is 999 − 9 = **990**.\n3. Check: 990 = 9 × 110 = 11 × 90. ✓\n\nAnswer: **990**.",
    approach: "For coprime divisors the LCM is simply their product. If they shared a factor you would have to compute the LCM properly rather than multiply.",
    tags: ["lcm", "divisibility"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-remainder-power-of-three-mod-five",
    topic: "number-system",
    title: "Remainder of 3²¹ ÷ 5",
    prompt: "What is the remainder when **3²¹** is divided by **5**?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    difficulty: "easy",
    hints: ["Remainders of 3ⁿ on division by 5 repeat every four powers.", "The cycle is 3, 4, 2, 1. Use 21 mod 4."],
    solution:
      "1. Remainders of 3ⁿ mod 5 cycle: 3, 4, 2, 1.\n2. 21 mod 4 = 1, so 3²¹ sits at the first position of the cycle.\n3. The remainder is **3**.\n\nAnswer: **3**.",
    approach:
      "Find the cycle by computing the first few powers, then use the exponent modulo the cycle length — remembering that a remainder of 0 means the last position, not the first.",
    tags: ["remainders", "cyclicity"],
    timeTargetSec: 45,
  },
  {
    slug: "ns2-number-of-zeros-in-product",
    topic: "number-system",
    title: "Zeros at the end of a product",
    prompt: "How many **zeros** are there at the end of the product **10 × 20 × 30 × … × 100**?",
    options: ["10", "11", "12", "13"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "The product is 10¹⁰ × (1 × 2 × … × 10), that is 10¹⁰ × 10!.",
      "10¹⁰ contributes ten zeros; now count the trailing zeros of 10!.",
    ],
    solution:
      "1. 10 × 20 × … × 100 = 10¹⁰ × (1 × 2 × … × 10) = 10¹⁰ × 10!.\n2. 10¹⁰ ends in ten zeros.\n3. 10! = 3,628,800 has ⌊10/5⌋ = 2 trailing zeros.\n4. Total = 10 + 2 = **12**.\n\nAnswer: **12**.",
    approach:
      "Pull out the common factor of 10 from every term first — it converts the problem into a power of ten times a plain factorial, and only the factorial needs the factor-of-5 count.",
    tags: ["trailing zeros", "factorial"],
    timeTargetSec: 120,
  },
];

/**
 * The essentials sheet for each aptitude topic: the formulas, rules and
 * method that topic's questions lean on, in 120–260 words of Markdown.
 * Each topic page (/aptitude/<topic>) shows it above the question list, and
 * the same text goes into the page's HTML, so a search for "time and work
 * formulas" or "blood relations tricks" lands on a page that answers it.
 * Until 2026-10-01 those 31 pages carried the one-sentence blurb from
 * APTITUDE_TOPICS (aptitude-topics.ts) and the list — nothing a reader
 * could revise from, and thin beside every other prep site.
 *
 * Every sheet was written against the bank (scripts/aptitude-data), so it
 * covers what the questions actually test rather than a textbook chapter:
 * a formula no question uses is one a candidate learns for nothing. Keep
 * the two in step — a new question shape that needs a new rule gets the
 * rule here too — and check any new formula against a worked example
 * before adding it. Plain British English, like the bank.
 *
 * Form: no top heading (the page has its own H1), at most two "### "
 * sections, unicode maths (× − ÷ ² √ ≈), no LaTeX. The text is drawn twice
 * — by react-markdown in the SPA and by lib/markdown-html.ts at the edge —
 * so it keeps to what the edge renderer knows: one level of list, bold,
 * inline code in backticks. A bare asterisk outside a code span can pair
 * with another into italics there, which is why multiplication is always
 * ×. Each sheet is one double-quoted string per line, so backticks are
 * safe inside it.
 *
 * Adding a topic: give it its entry in APTITUDE_TOPICS and its questions,
 * then add its sheet here under the same id. Every id in APTITUDE_TOPICS is
 * expected to have one.
 */

export const APTITUDE_ESSENTIALS: Readonly<Record<string, string>> = {
  // ── Quantitative Aptitude ──
  "number-system":
    "- **Divisibility:** for 2, 4 or 8, check the last one, two or three digits; for 3 or 9, the digit sum; for 11, the alternating digit sum, which must be 0 or a multiple of 11.\n" +
    "- **HCF × LCM = a × b**, for two numbers only. The LCM takes the highest power of each prime, the HCF the lowest power of the common primes.\n" +
    "- N = pᵃ × qᵇ × rᶜ has (a + 1)(b + 1)(c + 1) factors.\n" +
    "- Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …\n" +
    "- Same remainder on a, b and c: the greatest divisor is the HCF of their differences. Remainder r on several divisors: the number is LCM × k + r.\n" +
    "- To make N divisible by d, add d − remainder, or subtract the remainder.\n\n" +
    "### Unit digits and remainders\n\n" +
    "- Unit digits of powers repeat every 4: 2 → 2, 4, 8, 6; 3 → 3, 9, 7, 1; 7 → 7, 9, 3, 1; 8 → 8, 4, 2, 6. A last digit of 4 or 9 alternates; 0, 1, 5 and 6 never change. Use the exponent mod 4, reading 0 as 4.\n" +
    "- Reduce the base modulo the divisor first, then find the cycle of its powers. A base one less than the divisor acts as −1: even powers leave 1, odd powers the divisor minus 1.\n\n" +
    "Example: 13⁴³ ÷ 5. 13 leaves 3, and 3⁴ = 81 leaves 1; 43 = 4 × 10 + 3, so 13⁴³ leaves the same as 3³ = 27, which is **2**.",
  "percentages":
    "- Percentage change = (new − old) ÷ old × 100. The base is always the starting value.\n" +
    "- **Successive changes** of a% and b%: net a + b + ab/100 per cent, entering falls as negatives. An equal rise and fall of x% is always a net loss of x²/100 per cent.\n" +
    "- If A is x% more than B, B is 100x/(100 + x) per cent less than A. If A is x% less than B, B is 100x/(100 − x) per cent more than A.\n" +
    "- **Constant expenditure:** a price rise of r% needs a consumption cut of 100r/(100 + r) per cent; a price fall of r% allows a rise of 100r/(100 − r) per cent.\n" +
    "- Growth over n periods multiplies by (1 + r/100)ⁿ, depreciation by (1 − r/100)ⁿ. To go back in time, divide.\n" +
    "- If x% of A = y% of B, then A : B = y : x.\n" +
    "- **Percentage points** are a plain difference: 30% to 36% is 6 points, but a 20% increase.\n" +
    "- Two overlapping groups: A or B = A + B − both, and neither = 100% − (A or B).\n\n" +
    "### Fractions worth knowing\n\n" +
    "1/3 = 33⅓%, 1/6 = 16⅔%, 1/7 ≈ 14.29%, 1/8 = 12.5%, 1/9 ≈ 11.11%, 1/11 ≈ 9.09%, 1/12 = 8⅓%.\n\n" +
    "Example: up 25% and then down 25% is 1.25 × 0.75 = 0.9375, a **6.25% loss**, not zero.",
  "profit-and-loss":
    "- Profit or loss is a percentage of the **cost price** unless the question says otherwise.\n" +
    "- SP = CP × (100 + profit%)/100, and CP = SP × 100/(100 + profit%). For a loss, use 100 − loss%.\n" +
    "- **Discount** is a percentage of the **marked price**: SP = MP × (100 − discount%)/100.\n" +
    "- A mark-up of m% followed by a discount of d% gives profit% = m − d − md/100.\n" +
    "- Successive discounts of a% and b% equal one discount of a + b − ab/100 per cent.\n" +
    "- Two items sold at the **same price**, one at an x% gain and one at an x% loss: an overall loss of x²/100 per cent.\n" +
    "- **False weight**, selling at cost: gain% = error ÷ (true weight − error) × 100. A 900 g 'kilogram' gains 100/900 × 100 = 11.11%.\n" +
    "- If the SP of a articles equals the CP of b articles, profit% = (b − a)/a × 100.\n" +
    "- Buy x, get y free: discount = y/(x + y) × 100, so buy 3, get 1 free is 25%.\n" +
    "- A profit of p% on the selling price is 100p/(100 − p) per cent on the cost.\n" +
    "- If the loss at one price equals the gain at another, the cost price is their average.\n\n" +
    "Example: goods marked 25% above cost, target profit 10%. Set CP = 100: MP = 125 and SP = 110, so the discount is 15/125 = **12%**.",
  "ratio-and-proportion":
    "- A share = its part ÷ the sum of the parts × the total. Find one part once, then multiply.\n" +
    "- **Joining ratios:** scale so the shared term matches. A : B = 2 : 3 and B : C = 4 : 5 give A : B : C = 8 : 12 : 15.\n" +
    "- If 3A = 4B = 6C, then A : B : C = 1/3 : 1/4 : 1/6 = 4 : 3 : 2. Clear a fractional ratio with the LCM of its denominators.\n" +
    "- In a : b ∷ c : d, ad = bc. The fourth proportional to a, b, c is bc/a; the third proportional to a, b is b²/a; the mean proportional is √(ab).\n" +
    "- **Direct variation** keeps x ÷ y fixed; **inverse variation** keeps x × y fixed, as with men × days.\n" +
    "- Numbers in the ratio a : b (coprime) with HCF h are ah and bh, and their LCM is abh.\n" +
    "- If k is added to both terms, solve (ax + k)/(bx + k) = c/d by cross-multiplying.\n" +
    "- **Partnership:** profit is shared in the ratio of capital × time.\n" +
    "- Lengths in the ratio a : b give areas a² : b² and volumes a³ : b³.\n" +
    "- **Coins** counted in a ratio: price one set of the ratio, then count the sets.\n\n" +
    "Example: ₹7,200 in the ratio 3 : 4 : 5. There are 12 parts, one part is ₹600, so C gets **₹3,000**.",
  "averages":
    "- Average = sum ÷ count, so sum = average × count. Work in totals and divide once, at the end.\n" +
    "- An evenly spaced list averages (first + last)/2, the middle of the list. The average of 1 to n is (n + 1)/2; of the first n even numbers, n + 1; of the first n odd numbers, n.\n" +
    "- **Newcomer:** if one person raises the average of n people by d, the newcomer = new average + n × d.\n" +
    "- **Replacement:** new member = departing member + n × (change in average).\n" +
    "- **Misread entry:** the average moves by (correct − wrong) ÷ n.\n" +
    "- **Removal:** the removed value = old total − new total.\n" +
    "- **Combined average** = (n₁a₁ + n₂a₂) ÷ (n₁ + n₂). It leans towards the larger group and is never simply the mean of the two averages.\n" +
    "- **Overlapping groups**, such as the first six and last six of eleven results: the shared value = sum of the group totals − overall total.\n" +
    "- Multiplying every value by k multiplies the average by k; adding k to every value adds k.\n" +
    "- Average speed over equal distances is 2ab/(a + b), not (a + b)/2.\n\n" +
    "Example: a batsman averaging 32 over 11 innings scores 68 in the 12th. The average rises by (68 − 32)/12 = 3, to **35**.",
  "ages":
    "- The **difference** between two people's ages never changes, which makes it the fastest check on any answer.\n" +
    "- Give the present ages one variable. 'n years ago' subtracts n from every age; 'n years hence' adds n.\n" +
    "- Present ratio a : b, becoming c : d after n years: (ax + n)/(bx + n) = c/d, then cross-multiply. The equation is always linear.\n" +
    "- If one age is k times the other, their difference is (k − 1) × the younger age.\n" +
    "- A group's total age rises by the number of people each year, so t years ago it was the present total − people × t.\n" +
    "- For children born at equal intervals, the sum of their ages = count × the middle child's age (for an odd count).\n" +
    "- 'I was as old as you are now when you were born' means the parent's age at the birth equals the child's present age, so the parent is now twice as old.\n" +
    "- Given a product and a difference: (a + b)² = (a − b)² + 4ab.\n" +
    "- Turn awkward percentages into fractions: 125% = 5/4, 150% = 3/2, 83⅓% = 5/6.\n" +
    "- Apply a ratio to present ages only; bring a past or future age back to the present first.\n\n" +
    "Example: a father is four times his son's age and in 16 years will be twice it. 4x + 16 = 2(x + 16) gives x = 8, so the son is **8** and the father 32.",
  "time-and-work":
    "- Work in **rates**, not times: a job done in a days is 1/a of the job per day. Rates add; times do not.\n" +
    "- A in a days and B in b days, working together: ab/(a + b) days.\n" +
    "- **LCM method:** take the total work as the LCM of the given times, so every rate is a whole number of units a day.\n" +
    "- Efficiency is inversely proportional to time. Twice as efficient means half the time; x% more efficient means 100x/(100 + x) per cent less time.\n" +
    "- **Three pairs:** adding the rates of A + B, B + C and C + A counts everyone twice, so halve the sum.\n" +
    "- **Chain rule:** (M₁ × D₁ × H₁)/W₁ = (M₂ × D₂ × H₂)/W₂ for men, days, hours and work done. Convert a mixed gang of men and women into one unit first.\n" +
    "- **Pipes and cisterns:** inlets add rate, outlets and leaks subtract it. A pipe that fills in a hours but takes b hours with a leak means the leak alone empties it in ab/(b − a) hours.\n" +
    "- **Alternate days:** find the work per cycle, count the whole cycles, then finish the remainder day by day, in order.\n" +
    "- When someone leaves early, write one equation in the total time; the leaver works fewer days.\n\n" +
    "Example: A takes 24 days and B 40. Take the job as 120 units: A does 5 a day and B 3, so together they need 120/8 = **15 days**.",
  "time-speed-distance":
    "- Distance = speed × time. From km/h to m/s, multiply by 5/18; from m/s to km/h, by 18/5.\n" +
    "- A train passing a pole or a person covers its own length; a platform, a bridge or another train adds that length.\n" +
    "- **Relative speed:** add for opposite directions, subtract for the same direction. Objects D apart moving towards each other meet after D/(a + b).\n" +
    "- **Average speed:** equal distances at a and b give 2ab/(a + b); three equal distances give 3/(1/a + 1/b + 1/c); equal times give (a + b)/2.\n" +
    "- **Boats:** downstream = b + s and upstream = b − s, so b = (down + up)/2 and s = (down − up)/2.\n" +
    "- For a fixed distance, speed and time are inversely proportional: at a/b of the usual speed, the time becomes b/a of usual.\n" +
    "- **Late and early:** at speeds s₁ < s₂ with t hours between the two arrivals, d = s₁ × s₂ × t/(s₂ − s₁). Add the minutes when one trip is late and one early; subtract when both are late.\n" +
    "- **Stoppages:** minutes stopped per hour = (speed without − speed with)/speed without × 60.\n" +
    "- **Races:** 'A beats B by x metres' means B is x metres short when A finishes.\n" +
    "- **Circular track:** first meeting after L/(a − b) in the same direction, L/(a + b) in opposite directions.\n\n" +
    "Example: a 160 m train at 90 km/h, or 25 m/s, crosses a 290 m bridge in 450/25 = **18 seconds**.",
  "interest":
    "- **Simple interest:** SI = P × R × T/100, and the amount A = P(1 + RT/100). Every year earns the same interest.\n" +
    "- Under SI a sum becomes n times itself when R × T = 100(n − 1): doubling needs RT = 100, tripling RT = 200.\n" +
    "- Two SI amounts at different times differ by the interest for the gap, which gives the yearly interest at once.\n" +
    "- **Compound interest:** A = P(1 + R/100)ⁿ, and CI = A − P. Present value = A ÷ (1 + R/100)ⁿ.\n" +
    "- Half-yearly compounding: R/2 per period for 2n periods; quarterly: R/4 for 4n periods.\n" +
    "- Two years at R% compound is 2R + R²/100 per cent in all.\n" +
    "- **CI − SI** on P for 2 years = P(R/100)²; for 3 years = P(R/100)²(3 + R/100).\n" +
    "- Consecutive CI amounts give the rate directly: (A₂ − A₁)/A₁ × 100. Each year's interest exceeds the last by R% of it.\n" +
    "- Under CI the multiples are powers: doubling in t years means 4 times in 2t and 8 times in 3t.\n" +
    "- SI and CI are equal for the first year of annual compounding.\n\n" +
    "### Multipliers worth memorising\n\n" +
    "1.1² = 1.21, 1.1³ = 1.331, 1.05² = 1.1025, 1.05³ = 1.157625, 1.2² = 1.44, 1.04² = 1.0816.\n\n" +
    "Example: on ₹4,000 at 15% for 2 years, CI − SI = 4,000 × (0.15)² = **₹90**.",
  "permutations-combinations":
    "- **Counting principle:** independent stages multiply ('and'); separate cases add ('or').\n" +
    "- n distinct objects arrange in n! ways. P(n, r) = n!/(n − r)! counts ordered selections and C(n, r) = n!/(r!(n − r)!) unordered ones, so P(n, r) = C(n, r) × r!.\n" +
    "- C(n, r) = C(n, n − r), and C(n, 0) = C(n, n) = 1.\n" +
    "- **Repeated letters:** n!/(p! × q! × …). BANANA gives 6!/(3! × 2!) = 60.\n" +
    "- **Circular:** n people round a table sit in (n − 1)! ways; a necklace or garland, which can be turned over, in (n − 1)!/2.\n" +
    "- **Always together:** glue the group into one unit, arrange, then multiply by the arrangements inside the unit. Never together = total − together.\n" +
    "- **Digits:** fill the most restricted place first — a leading digit cannot be 0, and an even number needs an even units digit.\n" +
    "- **At least one** = total − none. A set of n items has 2ⁿ subsets, 2ⁿ − 1 of them non-empty.\n" +
    "- Handshakes, round-robin matches and lines through n points (no three in a line) are all C(n, 2) = n(n − 1)/2. An n-sided polygon has n(n − 3)/2 diagonals.\n" +
    "- If order matters (signals, ranks, seats, numbers), use a permutation; if it does not (committees, teams), a combination.\n\n" +
    "Example: committees of 3 from 6 men and 3 women with at least one woman: C(9, 3) − C(6, 3) = 84 − 20 = **64**.",
  "probability":
    "- P(E) = favourable outcomes ÷ total outcomes, always between 0 and 1, and P(not E) = 1 − P(E).\n" +
    "- **Or:** P(A or B) = P(A) + P(B) − P(A and B). Drop the last term only for mutually exclusive events.\n" +
    "- **And**, for independent events: P(A and B) = P(A) × P(B).\n" +
    "- **At least one** = 1 − P(none). A problem given to independent solvers is solved with probability 1 − the product of their failure probabilities.\n" +
    "- **Without replacement**, reduce both the favourable count and the total after each draw, or count with combinations: two reds from 4 red and 6 blue balls is C(4, 2)/C(10, 2) = 6/45.\n" +
    "- **Coins:** n coins give 2ⁿ outcomes, and exactly k heads has probability C(n, k)/2ⁿ.\n" +
    "- **Two dice:** 36 outcomes. A sum s can be made in s − 1 ways for s ≤ 7 and 13 − s ways for s ≥ 7; there are 6 doublets.\n" +
    "- **Cards:** 52 cards, 4 suits of 13, 26 red and 26 black, 12 face cards (jack, queen, king) and 4 aces.\n" +
    "- **Calendars:** a leap year has 53 of a given weekday with probability 2/7, an ordinary year 1/7.\n" +
    "- Numbers from 1 to n divisible by d: ⌊n/d⌋. For '3 or 5', subtract the multiples of 15.\n\n" +
    "Example: a red card or a king is 26/52 + 4/52 − 2/52 = 28/52 = **7/13**.",
  "mixtures-alligation":
    "- **Alligation:** quantity of cheaper : quantity of dearer = (dearer − mean) : (mean − cheaper). It works for prices, concentrations, wages and marks — any weighted average of two groups.\n" +
    "- The mean sits nearer the ingredient there is more of; exactly midway means 1 : 1.\n" +
    "- **Weighted mean** = (q₁p₁ + q₂p₂ + …) ÷ (q₁ + q₂ + …), for any number of ingredients.\n" +
    "- **Repeated replacement:** from V litres, drawing off x litres and replacing it with water n times leaves V × (1 − x/V)ⁿ of the original liquid.\n" +
    "- **Dilution:** the dissolved substance stays fixed. New total = that amount ÷ the new concentration; water to add = new total − old total.\n" +
    "- **Strengthening** with the pure component: anchor on the part that is not being added, usually the water.\n" +
    "- A milkman who adds water and sells at cost price gains water ÷ milk × 100 per cent.\n" +
    "- For a profit target, turn the selling price into the cost the mixture must have, then apply alligation to that cost.\n" +
    "- Mixing two mixtures: convert each to actual quantities first. For equal volumes, use the LCM of the ratio sums.\n" +
    "- Anything drawn off a mixture removes both components in proportion.\n\n" +
    "Example: tea at ₹120 and ₹180 per kg mixed to ₹160: (180 − 160) : (160 − 120) = 20 : 40 = **1 : 2**.",
  "mensuration":
    "Use π = 22/7 unless told otherwise, and convert every length to one unit before multiplying.\n\n" +
    "### Plane figures\n\n" +
    "- Rectangle: area lb, perimeter 2(l + b), diagonal √(l² + b²). Square: area a² = d²/2, diagonal a√2.\n" +
    "- Triangle: ½ × base × height. Heron: √(s(s − a)(s − b)(s − c)) with s = (a + b + c)/2. Equilateral: area (√3/4)a², height (√3/2)a.\n" +
    "- Parallelogram: base × height. Trapezium: ½ × (sum of parallel sides) × height. Rhombus: ½ × d₁ × d₂.\n" +
    "- Circle: area πr², circumference 2πr; a sector of θ° is (θ/360) × πr². Radius 7 gives circumference 44 and area 154.\n" +
    "- A path of width w outside a rectangle adds 2w to each side; inside, it takes 2w off.\n" +
    "- Pythagorean triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25.\n\n" +
    "### Solids\n\n" +
    "- Cuboid: volume lbh, total surface 2(lb + bh + hl), diagonal √(l² + b² + h²), four walls 2h(l + b).\n" +
    "- Cube: volume a³, surface 6a², diagonal a√3.\n" +
    "- Cylinder: volume πr²h, curved surface 2πrh, total 2πr(r + h).\n" +
    "- Cone: volume ⅓πr²h, curved surface πrl, where l = √(r² + h²).\n" +
    "- Sphere: volume (4/3)πr³, surface 4πr². Hemisphere: volume (2/3)πr³, total surface 3πr².\n" +
    "- Scaling lengths by k scales areas by k² and volumes by k³: a side 20% longer gives 44% more area.\n" +
    "- A wire bent into a new shape keeps its length.",
  // ── Logical Reasoning ──
  "number-series":
    "Find the rule in this order, and confirm it on every term before extending.\n\n" +
    "1. **Differences.** Write them under the terms; if they vary, take second differences. A constant second difference means a quadratic such as n² + 1 or n(n + 1).\n" +
    "2. **Ratios.** A constant ratio is geometric; rising multipliers (×2, ×3, ×4) point to factorial-like growth.\n" +
    "3. **Double and adjust.** Terms that roughly double often follow 'previous × 2 + 1', as in 3, 7, 15, 31.\n" +
    "4. **Known sequences.** Squares, cubes, primes, Fibonacci (each term the sum of the two before) and near misses such as n² − 1 or n³ + 1.\n" +
    "5. **Alternation.** If the differences zig-zag, split odd and even positions into two series, or look for two operations taking turns.\n" +
    "6. **Digits.** When the arithmetic fails, read the digits: 13, 35, 57, 79, 911 joins consecutive odd numbers.\n\n" +
    "### Letters and odd ones out\n\n" +
    "- Convert letters to positions, A = 1 to Z = 26, and back at the end. Landmarks: E 5, J 10, O 15, T 20, Y 25. The opposite of the nth letter is the (27 − n)th.\n" +
    "- In pairs such as AZ, BY, CX, treat each position as its own series.\n" +
    "- For an odd one out, test squares, cubes and primes first; exactly one term should break the rule.\n\n" +
    "Example: 5, 8, 13, 20, 29 has differences 3, 5, 7, 9, so the next term is 29 + 11 = **40** (n² + 4).",
  "coding-decoding":
    "- **Positions:** A = 1 to Z = 26, with landmarks E 5, J 10, O 15, T 20, Y 25. The opposite of position n is 27 − n: A and Z, M and N.\n" +
    "- **Write the shift under each letter** of the example before guessing. A constant shift (+1, +2, −1) is the commonest code; Z + 1 wraps to A.\n" +
    "- If the shift is not constant, check whether it grows with position (+1, +2, +3) or alternates in sign.\n" +
    "- If no shift fits, **reverse** the word and compare again: reversal plus a small shift is the usual two-step code.\n" +
    "- **Number codes** are usually the sum of the letter positions, that sum plus a constant, the word's length, or a rule such as n(n + 1). Confirm the rule on every example.\n" +
    "- **Letter-to-digit tables:** build the full mapping from the examples, check repeated letters for consistency, and make sure the answer has one symbol per letter.\n" +
    "- **Sentence codes:** intersect the code words of two sentences, and intersect their meanings.\n" +
    "- **Swapped symbols:** rewrite the whole expression first, then apply BODMAS — × and ÷ before + and −, left to right.\n" +
    "- **Decoding:** apply the shift in reverse, then re-encode to check.\n" +
    "- **Positions in the alphabet:** the kth letter to the left of the nth is at n − k; the kth from the right is the (27 − k)th.\n\n" +
    "Example: MAP → OCR is a shift of +2 on every letter, so SUN → **UWP**.",
  "blood-relations":
    "Never hold a family in your head: draw it.\n\n" +
    "### Drawing the tree\n\n" +
    "- Put each generation on its own level, oldest at the top. Join parent and child with a vertical line, spouses with a double line (=) and siblings with a single horizontal line.\n" +
    "- Mark sex as you learn it, + for male and − for female. Never assume it from a name; if the statements leave it open, the answer may be 'cannot be determined'.\n" +
    "- Resolve a description from the innermost phrase outwards, one person at a time. The word **only** collapses a phrase onto the speaker: 'the only son of my father', said by a man, is the man himself.\n" +
    "- For coded relations (A + B means A is the mother of B), translate every symbol into a sentence first.\n" +
    "- Mind the direction: 'How is A related to B?' asks what A is to B.\n\n" +
    "### Relations to know\n\n" +
    "- A parent's brother or sister is an uncle or aunt: maternal on the mother's side, paternal on the father's.\n" +
    "- A sibling's child is a nephew or niece; a parent's sibling's child is a cousin, and the relation holds both ways.\n" +
    "- A spouse's parent is a father- or mother-in-law; a spouse's sibling, or a sibling's spouse, is a brother- or sister-in-law.\n\n" +
    "Example: a man says, 'She is the daughter of the only son of my mother.' His mother's only son is the man himself, so she is **his daughter**.",
  "direction-sense":
    "- **Compass:** north up, east right, south down, west left, with NE, SE, SW and NW between them. As bearings: N 0°, NE 45°, E 90°, SE 135°, S 180°, SW 225°, W 270°, NW 315°.\n" +
    "- **Turns:** a right turn is 90° clockwise, N → E → S → W → N; a left turn runs the list backwards; 180° gives the opposite direction. Name the new direction after every turn.\n" +
    "- **Displacement:** label each leg with its direction, then total the north–south and east–west movement separately, counting opposite directions as negative. Distance from the start = √(x² + y²).\n" +
    "- Look for 3-4-5, 6-8-10 and 5-12-13 triangles; equal legs of a give a√2. Often one axis cancels and no root is needed.\n" +
    "- The final direction reads off the signs: net east and net north is north-east of the start.\n" +
    "- Distance travelled and distance from the start are different questions.\n" +
    "- **Shadows:** the sun rises in the east, so morning shadows fall to the west and evening shadows to the east. A morning shadow on your right means you face south.\n" +
    "- **Rotated compass:** find the angle the mapping turns through, check it on the second pair given, then apply it.\n" +
    "- The direction of A from C is the opposite of C from A.\n\n" +
    "Example: 8 m south, left 12 m, left 8 m. The south and north legs cancel, leaving the walker **12 m east** of the start.",
  "syllogisms":
    "Treat each statement as a picture, and judge only what the statements say, never what you know of the world.\n\n" +
    "### Drawing the statements\n\n" +
    "- **All A are B:** circle A inside B. **No A is B:** separate circles. **Some A are B:** overlapping circles. **Some A are not B:** part of A outside B.\n" +
    "- A conclusion follows only if it holds in **every** diagram the statements allow; one counter-drawing rejects it.\n\n" +
    "### Rules that save the drawing\n\n" +
    "- **Conversions:** 'Some A are B' gives 'Some B are A'; 'No A is B' gives 'No B is A'; 'All A are B' gives only 'Some B are A'; 'Some A are not B' has no converse.\n" +
    "- All A are B + All B are C → All A are C.\n" +
    "- All A are B + No B is C → No A is C.\n" +
    "- Some A are B + All B are C → Some A are C.\n" +
    "- Some A are B + No B is C → Some A are not C.\n" +
    "- No A is B + Some B are C → Some C are not A.\n" +
    "- Two 'some' statements, or 'All A are B' with 'Some B are C', give nothing definite about A and C.\n" +
    "- A 'some' premise can only produce a 'some' conclusion.\n" +
    "- **Either–or:** if neither conclusion follows alone but the two form a complementary pair, such as 'Some A are C' and 'No A is C', then either one follows.",
  "seating-arrangement":
    "- **Order of clues:** place fixed positions first (an end, a named seat, 'opposite'), then 'immediately left or right', then 'between' and negative clues. When a clue allows two placements, draw both and strike out the one a later clue breaks.\n" +
    "- **Rows:** people facing north share your left and right; people facing south have them reversed.\n" +
    "- **Circles facing the centre:** left is clockwise and right is anticlockwise. Facing outwards, both flip.\n" +
    "- In a circle of n seats, with n even, opposite is n/2 seats away.\n" +
    "- 'Third to the left' counts the destination seat, so two people sit between the pair.\n" +
    "- **Ranks in a row:** total = position from the left + position from the right − 1. Rank from the other end = total − rank + 1. People strictly between two positions from the same end = their difference − 1.\n" +
    "- **Comparisons:** join every 'taller than' or 'heavier than' into one chain, such as D > A > B > C > E, then count from the end the question names.\n" +
    "- **Floors:** an ordering puzzle drawn vertically, ground floor at the bottom.\n" +
    "- **Days or slots:** place the fixed days first, then use 'before' and 'immediately after'.\n" +
    "- Check the finished arrangement against every clue before answering.\n\n" +
    "Example: Meera is 9th from the left and 14th from the right, so the row holds 9 + 14 − 1 = **22** students.",
  "analogies-classification":
    "Both question types reward naming the rule before you look at the options.\n\n" +
    "### Analogies\n\n" +
    "- Say the relation as a sentence, such as 'a doctor works in a hospital', then test each option in that sentence. Keep the direction and the part of speech the same on both sides.\n" +
    "- **Common relations:** worker and workplace (chef, kitchen); worker and material (carpenter, wood; blacksmith, iron); creator and work (author, book); instrument and quantity (thermometer, temperature; barometer, pressure); animal and young (dog, puppy; horse, foal; lion, cub); animal and home (bee, hive; horse, stable); part and whole (petal, flower); degree (warm, hot); opposites.\n" +
    "- **Numbers:** test n², n³, √n, n(n + 1), n² − 1 and 2n + k in turn, and confirm the rule on the given pair: 64 is both 4³ and 8².\n" +
    "- **Letters:** convert to positions (A = 1) and compare the gaps.\n\n" +
    "### Classification\n\n" +
    "- Find the category that covers all but one item; a good category leaves exactly one out.\n" +
    "- If an obvious property is shared by every item (all odd, all fly), look for a second: 9 is the odd number that is not prime, and the bat is the flier that is a mammal.\n" +
    "- Watch the level of a category: a country among cities, an alloy (brass) among elements, a wild animal among domestic ones.\n" +
    "- For months, dates and names, count something: days, letters or position.",
  "mathematical-reasoning":
    "A mixed section: clocks, calendars and puzzles, plus statement-based questions.\n\n" +
    "### Clocks, calendars and counting\n\n" +
    "- **Clock angle** at H hours M minutes = |30H − 5.5M|; above 180°, take 360° minus it. In 12 hours the hands coincide 11 times, point opposite 11 times and are at right angles 22 times.\n" +
    "- **Calendars:** odd days are the remainder on division by 7. An ordinary year has 1 odd day and a leap year 2; a 31-day month 3, a 30-day month 2. A century year is a leap year only if it divides by 400.\n" +
    "- **Painted cube** cut into n × n × n: 8 small cubes have three painted faces, 12(n − 2) two, 6(n − 2)² one and (n − 2)³ none.\n" +
    "- **Sets:** n(A or B) = n(A) + n(B) − n(both); exactly one = n(A or B) − n(both).\n" +
    "- **Inequalities:** a conclusion is definite only if every link points the same way; one strict link makes it strict.\n\n" +
    "### Data sufficiency and statements\n\n" +
    "- Test statement I alone, then II alone, then both, carrying nothing across. Sufficient means exactly one answer.\n" +
    "- An **assumption** must be necessary for the statement, not merely consistent with it; 'only', 'always' and 'never' usually make an option too strong.\n" +
    "- A **conclusion** must follow from the statement itself; a **course of action** must be relevant and practical.\n" +
    "- In truth-teller puzzles, assume each person honest in turn and keep the case with no contradiction.",
  // ── Verbal Ability ──
  "vocabulary":
    "- **Read the word in its sentence** first; the context usually rules out half the options.\n" +
    "- **Define it in your own words** before reading the list, then pick the option that matches the definition, not the one that merely feels related.\n" +
    "- **Match the part of speech:** a verb can only be replaced by a verb.\n" +
    "- In **antonym** questions a synonym is nearly always planted among the options. Group the options by meaning: if three sit on the same side, the fourth is the answer.\n" +
    "- Reject options stronger than the word: candid means frank, not rude.\n" +
    "- **Roots:** bene- good, mal- bad, loqu- speak, ten- hold, nov- new, vigil- awake, trans- across, omni- all, auto- self, bio- life, graph- write, chron- time, ambi- both, phil- love.\n\n" +
    "### Confusables and set pieces\n\n" +
    "- affect (verb) and effect (usually a noun); principal (head, main) and principle (rule); stationary (still) and stationery (paper); complement (completes) and compliment (praise).\n" +
    "- lie (recline, no object) and lay (place something); fewer (countable nouns) and less (uncountable); between (two) and among (three or more).\n" +
    "- **One word for a phrase:** build it from its parts — illegible, autobiography, omnipresent, manuscript, pessimist.\n" +
    "- **Idioms** are figurative: decide first whether the phrase praises or criticises, then choose. 'Once in a blue moon' means rarely.\n" +
    "- **Spelling:** accommodate, occurrence, embarrass, necessary, separate. After one vowel in a stressed last syllable, the consonant doubles: occur, occurred.",
  "sentence-correction":
    "- **Find the true subject.** Cross out phrases between subject and verb (along with, as well as) and check what is left.\n" +
    "- **Singular:** each, every, either, neither, everyone, nobody and 'the number of'. 'A number of' is plural.\n" +
    "- **Nearer subject:** with either … or, neither … nor and not only … but also, the verb agrees with the closer subject.\n" +
    "- **Collective nouns** take a singular verb when the group acts as one, a plural verb when its members act separately.\n" +
    "- **Tenses:** since (a point) and for (a stretch) take the present perfect for continuing actions; the past perfect marks the earlier of two past events; after when or by the time, use the present for a future meaning.\n" +
    "- **Conditionals:** if + present, will; if + past, would; if + had + past participle, would have.\n" +
    "- **Fixed pairs:** scarcely … when; no sooner … than. Superior, inferior, senior, junior and prior take 'to', never 'than'.\n" +
    "- **Prepositions:** different from, comply with, consist of, insist on, married to.\n" +
    "- **Articles** go by sound: a university, an hour. Superlatives and unique things take 'the'.\n" +
    "- **Pronouns** take the object case after a preposition: between you and me.\n" +
    "- **Modifiers:** an opening participle phrase belongs to the next noun; put 'only' beside the word it limits.\n" +
    "- Keep lists parallel, one negative per clause, no double comparatives (more better) and no redundancy (return back).\n" +
    "- **Reported speech** moves tense and time words back one step; the **passive** keeps the original tense.",
  "sentence-completion":
    "Both halves of this topic reward reading for the logic before reading the options.\n\n" +
    "### Fill in the blanks\n\n" +
    "Name the relation between the two halves, then choose from its family of words:\n\n" +
    "- **Contrast:** however, nevertheless, yet, although, despite, but.\n" +
    "- **Cause and result:** therefore, consequently, hence, thus, because, so … that.\n" +
    "- **Addition:** moreover, furthermore, besides, in addition.\n" +
    "- **Example:** for instance, for example, notably.\n" +
    "- **Sequence:** subsequently, thereafter, later.\n\n" +
    "Result words are interchangeable in meaning; contrast words are not. Next decide whether the blank needs a positive or a negative word: 'despite' and 'although' set up a surprise, 'because' demands agreement, and a colon or a 'that' clause explains the blank. For two blanks, test the pairs, starting with the easier blank; one wrong half eliminates an option.\n\n" +
    "### Para jumbles\n\n" +
    "- The **opening sentence** names its subject and refers back to nothing: no pronoun (it, they), no 'the' for something unmentioned, no connector (but, however).\n" +
    "- Link each pronoun to the noun it stands for, and follow time markers such as first, soon, by then and today.\n" +
    "- A general statement comes before its example, and a cause before its consequence.\n" +
    "- Use the options: fix the opener, strike out the options that start elsewhere, then check one link.",
  "reading-comprehension":
    "Skim the question stems, then read the passage once for its structure: the view it opens with, where it turns (but, however, 'not X but Y') and what it concludes. Answer from the passage, never from outside knowledge; if you cannot point at the sentence, the option is unsupported.\n\n" +
    "### Question types\n\n" +
    "- **Main idea or title:** the claim every other sentence supports. Reject options that fit one sentence only, and options broader than the passage.\n" +
    "- **Detail:** find the sentence by scanning for the key term, and read it closely rather than relying on memory.\n" +
    "- **Inference:** one short step from the text. Options with always, never, only, all or cannot usually overreach.\n" +
    "- **Tone:** it lives in word choice. Pick the mildest label that accounts for every loaded word: doubtful is not hostile, and an account without judgement is explanatory.\n" +
    "- **Word in context:** settled by the surrounding sentence, especially a contrast within it, not by the word's strongest dictionary sense.\n" +
    "- **Purpose:** describe what the author is doing with a verb, such as explain, argue, correct or compare.\n" +
    "- **Not mentioned:** tick off each option against the text; plausibility counts for nothing.\n\n" +
    "### Eliminating options\n\n" +
    "Strike out options that are out of scope, too extreme, true but irrelevant, the reverse of the passage, or a distortion that joins two separate ideas. Small qualifiers such as 'merely' mark the limits of a claim, and questions are often built on exactly those limits.",
  // ── Data Interpretation ──
  "tables-and-charts":
    "- **Before any arithmetic,** note the units, whether a totals row is given, and whether the question wants a row (one item across periods) or a column (one period across items).\n" +
    "- **Percentage growth** = (later − earlier) ÷ earlier × 100. The base is the earlier value, so a small base can beat a larger absolute rise.\n" +
    "- **Share** = part ÷ total × 100. A share can peak in a different year from the absolute figure.\n" +
    "- **Pie charts:** 1% = 3.6°, so a sector's angle = percentage × 3.6, and its value = angle ÷ 360 × total.\n" +
    "- A ratio of two percentages needs no conversion to money: the total cancels.\n" +
    "- **Average** = sum ÷ number of entries; when every row has the same count, compare totals instead.\n" +
    "- On bar and line charts, read the scale first: an axis that does not start at zero exaggerates change.\n\n" +
    "### Approximation\n\n" +
    "- When the options are far apart, round to two or three significant figures.\n" +
    "- Build percentages from blocks: 17% of 460 = 46 + 23 + 9.2 = 78.2 (10% + 5% + 2%).\n" +
    "- Use fraction equivalents: 12.5% = 1/8, 16⅔% = 1/6, 33⅓% = 1/3.\n" +
    "- Compare fractions by cross-multiplying instead of dividing.\n" +
    "- x% of y = y% of x: 18% of 50 is 50% of 18, which is 9.\n\n" +
    "Example: sales rising from 400 to 500 grew by 100/400 = **25%**; falling back to 400 is a 20% drop.",
  "caselets":
    "- **Tabulate as you read.** Turn the paragraph into a small table, one row per group, with columns for the headcount and each breakdown. Most errors come from answering off the paragraph.\n" +
    "- **Each percentage applies to its own base,** in the order given: a quarter of the engineers is not a quarter of the staff.\n" +
    "- Work out any missing category from the others: the rest = 100% − the stated shares.\n" +
    "- An **overall percentage** = total favourable ÷ total, never the average of the group percentages.\n" +
    "- **Groups of different sizes** need a weighted average, which leans towards the larger group.\n" +
    "- **Overlaps:** at least one = A + B − both; neither = total − at least one; only A = A − both.\n" +
    "- **Slab pricing:** charge each band at its own rate.\n" +
    "- **Unit chains:** one step at a time, such as kilometres to litres to rupees.\n" +
    "- **Targets:** what is left ÷ the time left.\n" +
    "- When one percentage applies to every part, apply it once to the total; when it applies to part of a bill, split the bill first.\n" +
    "- **Ratio splits:** find the value of one part once, then treat later changes as ordinary arithmetic.\n" +
    "- Divide by the number of periods actually listed, and check that the parts add back to the stated total.\n\n" +
    "Example: of 600 members, 55% use the gym, 40% the pool and 20% both. At least one: 55 + 40 − 20 = 75%, which is **450**.",
  // ── Programming MCQs ──
  "pseudocode":
    "Read the question's own conventions before tracing a single line.\n\n" +
    "### Conventions to confirm\n\n" +
    "- Whether / is **integer division**, discarding the fraction, and MOD the remainder: 17 / 5 = 3 and 17 MOD 5 = 2.\n" +
    "- Whether arrays and strings are **0-indexed or 1-indexed**. An n-element 0-indexed array ends at n − 1.\n" +
    "- 'For i = a to b' includes both ends; with step s it runs ⌊(b − a)/s⌋ + 1 times.\n" +
    "- **While** tests before the body and may run zero times; **Repeat … Until** tests after, runs at least once and stops when its condition becomes true.\n" +
    "- **Break** leaves the loop; **Continue** skips to the next pass. An Else If ladder runs only the first true branch.\n" +
    "- **By value** passes a copy; **by reference** passes the caller's variable itself.\n\n" +
    "### Tracing\n\n" +
    "- Keep a trace table: one column per variable, one row per pass.\n" +
    "- Nested loops whose inner bound is the outer counter run n(n + 1)/2 times, not n².\n" +
    "- For recursion, write each pending expression on the way down and substitute on the way up. The base case counts as a call.\n" +
    "- Recognise stock routines: n MOD 10 with n / 10 peels digits; (a, b) → (b, a MOD b) is Euclid's GCD; a = a + b, b = a − b, a = a − b swaps; n MOD 2 with n / 2 counts binary 1s; two indices closing in test for a palindrome.",
  "programming-fundamentals":
    "Output questions test a handful of rules that differ between languages.\n\n" +
    "### C and Java\n\n" +
    "- **Integer division** truncates towards zero: `7 / 2` is 3, `-7 / 2` is −3 and `-7 % 2` is −1. One floating operand gives real division: `7 / 2.0` is 3.5.\n" +
    "- **Precedence**, high to low: unary, then `* / %`, then `+ -`, shifts, relational, equality, bitwise, `&&`, `||`, `?:` and assignment. Equal operators group left to right, except `?:` and assignment.\n" +
    "- `i++` yields the old value, `++i` the new one. `&&` and `||` short-circuit, so a side effect on the right may never happen. A `switch` falls through until a `break`.\n" +
    "- **C:** arguments are copied, so a swap needs pointers; `*(p + i)` is `p[i]`; an array parameter is a pointer, so `sizeof` gives the pointer's size; `strlen` omits the terminating null that `sizeof` counts; a `static` local keeps its value between calls.\n" +
    "- **Java:** `==` compares references and `equals` contents; strings are immutable; `int` overflow wraps, so `Integer.MAX_VALUE + 1` is `Integer.MIN_VALUE`; `1 + 2 + \"3\"` is 33; `finally` runs even after a `return`.\n\n" +
    "### Python\n\n" +
    "- `7 / 2` is 3.5, `7 // 2` is 3 and `-7 // 2` is −4: floor division rounds towards minus infinity.\n" +
    "- `b = a` shares one list and `a[:]` copies it; `[[0] * 3] * 2` holds one inner list twice.\n" +
    "- A mutable default argument is shared between calls, and a loop's `else` runs only when no `break` fired.",
  "data-structures-mcq":
    "Most questions ask for a complexity, a count, or the state after one operation.\n\n" +
    "### Structures\n\n" +
    "- **Stack** (last in, first out): recursion, bracket matching, postfix evaluation, depth-first search. **Queue** (first in, first out): breadth-first search and level-order traversal.\n" +
    "- **Linked list** with only a head pointer: inserting at the head is O(1), at the tail O(n). Floyd's slow and fast pointers find a loop in O(1) space.\n" +
    "- **Binary trees:** height h, counted in edges, allows at most 2^(h + 1) − 1 nodes; if every node has 0 or 2 children, leaves = internal nodes + 1. Inorder is left, root, right.\n" +
    "- **BST:** inorder is sorted; search is O(log n) when balanced, O(n) in the worst case.\n" +
    "- **Heap** in a 0-indexed array: the children of i are 2i + 1 and 2i + 2; insert and extract are O(log n).\n" +
    "- **Graphs:** a complete graph has n(n − 1)/2 edges; adjacency lists take O(V + E) space, a matrix O(V²); a directed graph has a topological order exactly when it has no cycle.\n\n" +
    "### Algorithms\n\n" +
    "- Bubble, selection and insertion sort are O(n²); insertion sort is O(n) on sorted input; bubble sort's swaps equal the inversions.\n" +
    "- Merge sort: O(n log n), stable, O(n) extra space. Quicksort: O(n log n) on average, O(n²) on sorted input with an end pivot. Heapsort: O(n log n), in place, unstable.\n" +
    "- Binary search makes at most ⌊log₂ n⌋ + 1 comparisons. The Tower of Hanoi needs 2ⁿ − 1 moves.",
  "os-dbms-networks":
    "Three subjects, each asked as short facts and small calculations.\n\n" +
    "### Operating systems\n\n" +
    "- Turnaround = completion − arrival; waiting = turnaround − burst.\n" +
    "- **Scheduling:** FCFS suffers the convoy effect; non-preemptive SJF gives the least average waiting time and SRTF is its preemptive form; round robin with a huge quantum becomes FCFS.\n" +
    "- **Deadlock** needs mutual exclusion, hold and wait, no preemption and circular wait at once. P processes needing at most N units each cannot deadlock with P(N − 1) + 1 units.\n" +
    "- **Paging:** 32-bit addresses with 4 KB pages give 2³² ÷ 2¹² = 2²⁰ page-table entries. With a TLB, EMAT = h(t + m) + (1 − h)(t + 2m). FIFO can show Belady's anomaly; LRU cannot.\n" +
    "- Threads share code, data and files but keep their own stack and registers.\n\n" +
    "### DBMS and networks\n\n" +
    "- **Normal forms:** 2NF removes partial dependencies, 3NF transitive ones; BCNF needs every determinant to be a superkey.\n" +
    "- SQL runs FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY: WHERE filters rows, HAVING filters groups. `COUNT(*)` counts rows; other aggregates skip NULLs.\n" +
    "- TRUNCATE is DDL, DELETE is DML.\n" +
    "- **OSI:** switches work at layer 2 (MAC), routers at 3 (IP), ports at 4.\n" +
    "- TCP is reliable and opened by SYN, SYN-ACK, ACK; UDP gives no guarantees. Ports: 22 SSH, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS.\n" +
    "- Usable hosts in a subnet = 2^(32 − prefix) − 2, so a /26 has 62.",
};

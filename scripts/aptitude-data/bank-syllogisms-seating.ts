import type { AptitudeSeed } from "./types.js";

/** Syllogisms and seating or arrangement puzzles. */
export const BANK_SYLLOGISMS_SEATING: AptitudeSeed[] = [
  /* ── Syllogisms ────────────────────────────────────────────────── */
  {
    slug: "sy2-all-dogs-animals",
    topic: "syllogisms",
    title: "All dogs are animals",
    prompt:
      "**Statements:**\n1. All dogs are animals.\n2. All animals are living beings.\n\n**Conclusions:**\nI. All dogs are living beings.\nII. Some living beings are dogs.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both I and II", "Neither"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Draw three circles, each inside the next.",
      "If every dog is a living being, then some living beings must be dogs.",
    ],
    solution:
      "1. Dogs ⊂ animals ⊂ living beings, so every dog is a living being: **I follows**.\n2. Since dogs exist and all are living beings, some living beings are dogs: **II also follows**.\n3. Both conclusions hold.\n\nAnswer: **Both I and II**.",
    approach:
      "An 'all A are B' statement also supports 'some B are A', because the class A is taken to be non-empty. That converse is valid and often overlooked.",
    tags: ["venn"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-all-roses-flowers",
    topic: "syllogisms",
    title: "All roses are flowers",
    prompt:
      "**Statements:**\n1. All roses are flowers.\n2. Some flowers fade quickly.\n\n**Conclusions:**\nI. Some roses fade quickly.\nII. All flowers are roses.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "The flowers that fade quickly need not be roses.",
      "Reversing an 'all' statement is never valid.",
    ],
    solution:
      "1. The flowers that fade quickly might all lie outside the rose group, so I does not follow.\n2. 'All flowers are roses' reverses the first statement, which is invalid.\n3. **Neither** conclusion follows.\n\nAnswer: **Neither**.",
    approach:
      "'All A are B' plus 'some B are C' yields nothing about A and C. Only a middle term that covers the whole of the relevant class transmits the property.",
    tags: ["venn"],
    timeTargetSec: 90,
  },
  {
    slug: "sy2-some-books-pens",
    topic: "syllogisms",
    title: "Some books are pens",
    prompt:
      "**Statements:**\n1. Some books are pens.\n2. All pens are pencils.\n\n**Conclusions:**\nI. Some books are pencils.\nII. All pencils are pens.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The books that are pens must also be pencils.",
      "The second conclusion reverses an 'all' statement.",
    ],
    solution:
      "1. Some books are pens, and every pen is a pencil, so those books are pencils: **I follows**.\n2. 'All pencils are pens' reverses statement 2 and does not follow.\n\nAnswer: **Only I**.",
    approach: "'Some A are B' plus 'all B are C' always gives 'some A are C'. Reversing an 'all' is the classic invalid step.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-no-cats-dogs",
    topic: "syllogisms",
    title: "No cat is a dog",
    prompt:
      "**Statements:**\n1. No cat is a dog.\n2. All dogs are pets.\n\n**Conclusions:**\nI. No cat is a pet.\nII. Some pets are not cats.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Dogs are pets and no dog is a cat, so at least those pets are not cats.",
      "But other pets could still be cats, so conclusion I is too strong.",
    ],
    solution:
      "1. All dogs are pets and no dog is a cat, so those pets are not cats: **II follows**.\n2. Cats could still be pets themselves, so I does not follow.\n\nAnswer: **Only II**.",
    approach:
      "A 'some are not' conclusion is far safer than a 'no' conclusion. Ask whether a single drawing can break the stronger claim; if so, reject it.",
    tags: ["negative"],
    timeTargetSec: 105,
  },
  {
    slug: "sy2-all-a-b-no-b-c",
    topic: "syllogisms",
    title: "All A are B, no B is C",
    prompt:
      "**Statements:**\n1. All students are hardworking.\n2. No hardworking person is lazy.\n\n**Conclusions:**\nI. No student is lazy.\nII. Some hardworking people are students.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Every student sits inside the hardworking group, which is entirely outside the lazy group.",
      "And since students exist, some hardworking people are students.",
    ],
    solution:
      "1. Students ⊂ hardworking, and hardworking excludes lazy entirely, so no student is lazy: **I follows**.\n2. Students exist and are all hardworking, so some hardworking people are students: **II follows**.\n\nAnswer: **Both**.",
    approach: "'All A are B' plus 'no B is C' gives the strong conclusion 'no A is C'. That combination is one of the few that supports a universal negative.",
    tags: ["negative"],
    timeTargetSec: 90,
  },
  {
    slug: "sy2-some-not-conclusion",
    topic: "syllogisms",
    title: "Some doctors are writers",
    prompt:
      "**Statements:**\n1. Some doctors are writers.\n2. All writers are educated.\n\n**Conclusions:**\nI. Some doctors are educated.\nII. All doctors are educated.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The doctors who are writers must be educated.",
      "But nothing is said about the remaining doctors.",
    ],
    solution:
      "1. Some doctors are writers, and all writers are educated, so those doctors are educated: **I follows**.\n2. The other doctors may or may not be educated, so II does not follow.\n\nAnswer: **Only I**.",
    approach: "A 'some' premise can only produce a 'some' conclusion. Upgrading it to 'all' is never valid.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-either-or",
    topic: "syllogisms",
    title: "All birds fly",
    prompt:
      "**Statements:**\n1. All birds have feathers.\n2. Some creatures with feathers can swim.\n\n**Conclusions:**\nI. Some birds can swim.\nII. All creatures with feathers are birds.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "The feathered creatures that swim need not be birds.",
      "The second conclusion reverses the first statement.",
    ],
    solution:
      "1. The swimming feathered creatures might all lie outside the bird group, so I does not follow.\n2. II reverses 'all birds have feathers' and is invalid.\n3. **Neither** follows.\n\nAnswer: **Neither**.",
    approach:
      "Judge only what the statements force, not what you know about the world. Real-world knowledge that ducks swim is irrelevant to the logic.",
    tags: ["venn"],
    timeTargetSec: 105,
  },
  {
    slug: "sy2-all-pens-blue",
    topic: "syllogisms",
    title: "Some pens are blue",
    prompt:
      "**Statements:**\n1. All pens are blue.\n2. All blue things are attractive.\n\n**Conclusions:**\nI. All pens are attractive.\nII. Some attractive things are pens.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 2,
    difficulty: "easy",
    hints: ["A chain of two 'all' statements passes forwards.", "And a non-empty class supports the 'some' converse."],
    solution:
      "1. Pens ⊂ blue ⊂ attractive, so all pens are attractive: **I follows**.\n2. Pens exist and are attractive, so some attractive things are pens: **II follows**.\n\nAnswer: **Both**.",
    approach: "Chain 'all' statements in one direction only. The 'some' converse of a valid 'all' conclusion is also valid.",
    tags: ["venn"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-no-a-is-b-some-b-c",
    topic: "syllogisms",
    title: "No teacher is rich",
    prompt:
      "**Statements:**\n1. No teacher is rich.\n2. Some rich people are generous.\n\n**Conclusions:**\nI. Some generous people are not teachers.\nII. No generous person is a teacher.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The rich generous people cannot be teachers.",
      "But other generous people might still be teachers.",
    ],
    solution:
      "1. Some rich people are generous, and no rich person is a teacher, so those generous people are not teachers: **I follows**.\n2. Generous people who are not rich could be teachers, so II is too strong.\n\nAnswer: **Only I**.",
    approach: "Prefer the weaker 'some are not' over the universal 'no'. If one counter-drawing exists, the universal fails.",
    tags: ["negative"],
    timeTargetSec: 105,
  },
  {
    slug: "sy2-all-squares-rectangles",
    topic: "syllogisms",
    title: "All squares are rectangles",
    prompt:
      "**Statements:**\n1. All squares are rectangles.\n2. All rectangles are quadrilaterals.\n\n**Conclusions:**\nI. All squares are quadrilaterals.\nII. All quadrilaterals are squares.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "easy",
    hints: ["The chain runs squares → rectangles → quadrilaterals.", "It does not run backwards."],
    solution:
      "1. Squares ⊂ rectangles ⊂ quadrilaterals, so I follows.\n2. II reverses the chain entirely and is invalid.\n\nAnswer: **Only I**.",
    approach: "Nested categories pass properties downwards to the smaller class, never upwards to the larger one.",
    tags: ["venn"],
    timeTargetSec: 60,
  },
  {
    slug: "sy2-some-a-not-b",
    topic: "syllogisms",
    title: "Some players are not tall",
    prompt:
      "**Statements:**\n1. All tall people are players.\n2. Some players are not tall.\n\n**Conclusions:**\nI. Some players are tall.\nII. All players are tall.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Tall people exist and all of them are players.",
      "The second statement explicitly rules out conclusion II.",
    ],
    solution:
      "1. All tall people are players, and tall people exist, so some players are tall: **I follows**.\n2. Statement 2 says some players are not tall, which directly contradicts II.\n\nAnswer: **Only I**.",
    approach: "When a statement directly contradicts a conclusion, that conclusion can be rejected without any drawing at all.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-three-statements",
    topic: "syllogisms",
    title: "A chain of three",
    prompt:
      "**Statements:**\n1. All pencils are pens.\n2. All pens are markers.\n3. All markers are erasers.\n\n**Conclusions:**\nI. All pencils are erasers.\nII. All erasers are pencils.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: ["Follow the chain from pencils outwards.", "Pencils ⊂ pens ⊂ markers ⊂ erasers."],
    solution:
      "1. The chain gives pencils ⊂ pens ⊂ markers ⊂ erasers, so all pencils are erasers: **I follows**.\n2. II reverses the whole chain and is invalid.\n\nAnswer: **Only I**.",
    approach: "Longer chains work exactly like short ones. Write the inclusions in a single line and read off the end points.",
    tags: ["venn"],
    timeTargetSec: 75,
  },
  {
    slug: "sy2-possibility-conclusion",
    topic: "syllogisms",
    title: "Some fruits are apples",
    prompt:
      "**Statements:**\n1. Some fruits are apples.\n2. No apple is sour.\n\n**Conclusions:**\nI. Some fruits are not sour.\nII. No fruit is sour.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The fruits that are apples cannot be sour.",
      "But other fruits might well be sour.",
    ],
    solution:
      "1. Some fruits are apples and no apple is sour, so those fruits are not sour: **I follows**.\n2. Fruits that are not apples could be sour, so II is too strong.\n\nAnswer: **Only I**.",
    approach: "Carry the negative only as far as the overlap goes. Beyond it, nothing is known.",
    tags: ["negative"],
    timeTargetSec: 90,
  },
  {
    slug: "sy2-all-managers-employees",
    topic: "syllogisms",
    title: "Managers and employees",
    prompt:
      "**Statements:**\n1. All managers are employees.\n2. Some employees are shareholders.\n\n**Conclusions:**\nI. Some managers are shareholders.\nII. Some shareholders are employees.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Conclusion II is just statement 2 read the other way round.",
      "'Some' statements can always be reversed; 'all' statements cannot.",
    ],
    solution:
      "1. The shareholder employees need not be managers, so I does not follow.\n2. 'Some employees are shareholders' is equivalent to 'some shareholders are employees': **II follows**.\n\nAnswer: **Only II**.",
    approach: "A 'some' statement is symmetric and may be reversed freely. That makes its converse a valid conclusion every time.",
    tags: ["some/all"],
    timeTargetSec: 90,
  },
  {
    slug: "sy2-no-conclusion-follows",
    topic: "syllogisms",
    title: "Two unconnected statements",
    prompt:
      "**Statements:**\n1. Some cars are buses.\n2. Some buses are trains.\n\n**Conclusions:**\nI. Some cars are trains.\nII. No car is a train.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Either I or II", "Neither"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Two 'some' statements together prove nothing definite.",
      "But the two conclusions here cover every possibility between them.",
    ],
    solution:
      "1. Two 'some' premises never yield a definite conclusion, so neither I nor II is proved on its own.\n2. However, cars and trains must either overlap or not, and I and II are exactly those two cases.\n3. So **either I or II** holds — the complementary pair.\n\nAnswer: **Either I or II**.",
    approach:
      "When two conclusions are contradictory and between them exhaust every possibility, the answer is 'either/or'. Recognising that pair is what this question tests.",
    tags: ["either or"],
    timeTargetSec: 120,
  },

  /* ── Seating & Puzzles ─────────────────────────────────────────── */
  {
    slug: "sa2-row-five-middle",
    topic: "seating-arrangement",
    title: "Who is in the middle",
    prompt:
      "Five friends sit in a row facing north. **P is at the extreme left**, **T is at the extreme right**, **Q is immediately to the right of P**, and **S is between R and T**. Who sits in the **middle**?",
    options: ["P", "Q", "R", "S"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Number the seats 1 to 5 from the left and place the fixed people first.",
      "P = 1, T = 5, and Q must be 2.",
    ],
    solution:
      "1. P = seat 1, T = seat 5, and Q immediately right of P means Q = seat 2.\n2. Seats 3 and 4 remain for R and S, and S must lie between R and T.\n3. That forces R = 3 and S = 4.\n4. The row is P, Q, R, S, T, so the middle seat holds **R**.\n\nAnswer: **R**.",
    approach: "Fix the absolute positions first, then adjacency, then 'between' clues. Check every clue against the finished row before answering.",
    tags: ["linear"],
    timeTargetSec: 90,
  },
  {
    slug: "sa2-row-five-second-from-left",
    topic: "seating-arrangement",
    title: "Second from the left",
    prompt:
      "Five people A, B, C, D and E sit in a row. **C is at the extreme left**, **B is next to C**, **A is in the middle**, and **D is at the extreme right**. Who is **second from the right**?",
    options: ["A", "B", "C", "E"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "C = seat 1 and B = seat 2, since B is next to C.",
      "A is in the middle at seat 3 and D is at seat 5, so only one seat is left.",
    ],
    solution:
      "1. C = seat 1; B = seat 2 (next to C); A = seat 3 (middle); D = seat 5 (extreme right).\n2. The only remaining seat, 4, must hold E.\n3. The row is C, B, A, E, D, so second from the right is **E**.\n\nAnswer: **E**.",
    approach:
      "Place every fixed position first; if exactly one seat and one person remain, the arrangement is forced and no case-checking is needed.",
    tags: ["linear"],
    timeTargetSec: 105,
  },
  {
    slug: "sa2-circle-six-opposite",
    topic: "seating-arrangement",
    title: "Opposite in a circle of six",
    prompt:
      "Six people sit around a circular table **facing the centre**. **A is opposite D**, **B is immediately to the right of A**, and **C is opposite B**. Who is **opposite E** if **F sits immediately to the left of A**?",
    options: ["A", "B", "C", "F"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "With six seats, opposite means three seats away.",
      "Facing the centre, right is anticlockwise and left is clockwise.",
    ],
    solution:
      "1. Number seats 1–6 clockwise and put A at 1, so D is at 4.\n2. Facing the centre, A's right is anticlockwise: B = seat 6, and C is opposite B at seat 3.\n3. A's left is clockwise: F = seat 2.\n4. The only seat left is 5, so E = 5, and opposite seat 5 is seat 2, which is **F**.\n\nAnswer: **F**.",
    approach:
      "Fix one person, then derive the rest. The orientation rule matters: facing the centre, left is clockwise and right is anticlockwise, and both flip if the group faces outwards.",
    tags: ["circular"],
    timeTargetSec: 135,
  },
  {
    slug: "sa2-circle-eight-third-to-left",
    topic: "seating-arrangement",
    title: "Third to the left",
    prompt:
      "Eight people sit evenly around a circular table facing the centre. If **P is third to the left of Q**, how many people sit **between them** going clockwise from Q to P?",
    options: ["2", "3", "4", "5"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Facing the centre, left is the clockwise direction.",
      "Third to the left of Q means three seats clockwise from Q.",
    ],
    solution:
      "1. Facing the centre, moving left means moving clockwise.\n2. P is three seats clockwise from Q.\n3. Between them, going clockwise, there are 3 − 1 = **2** people.\n\nAnswer: **2**.",
    approach: "'Third to the left' counts the destination seat itself, so the people strictly between are one fewer.",
    tags: ["circular"],
    timeTargetSec: 90,
  },
  {
    slug: "sa2-facing-outward",
    topic: "seating-arrangement",
    title: "Facing outwards",
    prompt:
      "Five people sit around a circular table **facing outwards**. If **A is to the immediate left of B**, then from B's point of view, in which direction is A?",
    options: ["Immediate left", "Immediate right", "Opposite", "Cannot be determined"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "If A is on B's left, then B is on A's right.",
      "The question asks where A is relative to B, which reverses the relation.",
    ],
    solution:
      "1. A is immediately to the left of B.\n2. Turning the relation round, B is immediately to the right of A — which places A immediately to B's **right**.\n3. The direction the group faces does not change this reversal; it only decides which way round the table 'left' points.\n\nAnswer: **Immediate right**.",
    approach: "Reversing a left-right relation always swaps the side. Facing outwards changes the mapping to clockwise, not the reversal itself.",
    tags: ["circular"],
    timeTargetSec: 90,
  },
  {
    slug: "sa2-ranking-from-both-ends",
    topic: "seating-arrangement",
    title: "Position from both ends",
    prompt:
      "In a row of students, Ravi is **12th from the left** and **18th from the right**. How many **students** are there in the row?",
    options: ["28", "29", "30", "31"],
    answer: 1,
    difficulty: "easy",
    hints: ["Add the two positions, then subtract one for Ravi being counted twice.", "12 + 18 − 1."],
    solution: "1. Total = 12 + 18 − 1 = **29**.\n2. The subtraction removes the double count of Ravi himself.\n\nAnswer: **29**.",
    approach: "Position from left + position from right − 1 = total. Forgetting the −1 gives 30, which is offered.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa2-ranking-find-position",
    topic: "seating-arrangement",
    title: "Position from the other end",
    prompt:
      "In a class of **40 students**, Meera ranks **16th from the top**. What is her rank **from the bottom**?",
    options: ["24", "25", "26", "27"],
    answer: 1,
    difficulty: "easy",
    hints: ["Rank from bottom = total − rank from top + 1.", "40 − 16 + 1."],
    solution: "1. Rank from the bottom = 40 − 16 + 1 = **25**.\n\nAnswer: **25**.",
    approach: "The +1 is needed because both ranks count the person themselves. Simply subtracting gives 24, the offered trap.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa2-between-two-people",
    topic: "seating-arrangement",
    title: "How many between them",
    prompt:
      "In a row, **Amit is 7th from the left** and **Sunil is 12th from the left**. How many people sit **between them**?",
    options: ["3", "4", "5", "6"],
    answer: 1,
    difficulty: "easy",
    hints: ["Subtract the positions.", "12 − 7 − 1."],
    solution: "1. The gap is 12 − 7 = 5 seats.\n2. Excluding both of them, the people between number 5 − 1 = **4**.\n\nAnswer: **4**.",
    approach: "Difference of positions minus one gives the count strictly between. Including one endpoint would give 5.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa2-tallest-shortest",
    topic: "seating-arrangement",
    title: "Ordering by height",
    prompt:
      "**A is taller than B**, **C is shorter than B**, **D is taller than A**, and **E is shorter than C**. Who is the **shortest**?",
    options: ["B", "C", "D", "E"],
    answer: 3,
    difficulty: "easy",
    hints: ["Write the order as a chain from tallest to shortest.", "D > A > B > C > E."],
    solution:
      "1. From the statements: D > A > B > C > E.\n2. The shortest is **E**.\n\nAnswer: **E**.",
    approach: "Convert every comparison into a single ordered chain. Once it is written out, the extremes read straight off.",
    tags: ["ordering"],
    timeTargetSec: 60,
  },
  {
    slug: "sa2-ordering-heaviest",
    topic: "seating-arrangement",
    title: "Ordering by weight",
    prompt:
      "**P is heavier than Q** but **lighter than R**. **S is heavier than R** but **lighter than T**. Who is the **heaviest**?",
    options: ["P", "R", "S", "T"],
    answer: 3,
    difficulty: "easy",
    hints: ["Build the chain: Q < P < R < S < T.", "Read off the top of the chain."],
    solution: "1. Q < P < R and R < S < T, so the full chain is Q < P < R < S < T.\n2. The heaviest is **T**.\n\nAnswer: **T**.",
    approach: "Join the chains at the shared person — here R. Every comparison must fit into a single line before answering.",
    tags: ["ordering"],
    timeTargetSec: 60,
  },
  {
    slug: "sa2-days-of-week-puzzle",
    topic: "seating-arrangement",
    title: "Ordering across the week",
    prompt:
      "Five people visit a shop on five consecutive days from **Monday to Friday**. **A visits before B**, **C visits on Wednesday**, **D visits immediately after C**, and **E visits on Monday**. On which day does **B** visit?",
    options: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "E is on Monday, C on Wednesday and D immediately after C means Thursday.",
      "Only Tuesday and Friday are left for A and B, and A must come first.",
    ],
    solution:
      "1. E = Monday, C = Wednesday, D = Thursday (immediately after C).\n2. Tuesday and Friday remain for A and B.\n3. A must visit before B, so A = Tuesday and B = **Friday**.\n\nAnswer: **Friday**.",
    approach: "Place the fixed days first, then use the ordering clue to break the tie between the remaining slots.",
    tags: ["ordering"],
    timeTargetSec: 105,
  },
  {
    slug: "sa2-floors-puzzle",
    topic: "seating-arrangement",
    title: "Who lives on the top floor",
    prompt:
      "Four people live on four floors of a building. **P lives above Q**, **R lives below Q**, and **S lives above P**. Who lives on the **topmost floor**?",
    options: ["P", "Q", "R", "S"],
    answer: 3,
    difficulty: "easy",
    hints: ["Build the order from the bottom up: R below Q, Q below P, P below S.", "R < Q < P < S."],
    solution:
      "1. R is below Q, Q is below P, and P is below S.\n2. The order upwards is R, Q, P, S.\n3. The topmost is **S**.\n\nAnswer: **S**.",
    approach: "Floor puzzles are ordering puzzles drawn vertically. Write the chain from the ground up and read off the top.",
    tags: ["ordering"],
    timeTargetSec: 60,
  },
  {
    slug: "sa2-row-facing-south",
    topic: "seating-arrangement",
    title: "A row facing south",
    prompt:
      "Five people sit in a row **facing south**. **A is at the extreme right end** as seen by an observer standing in front of them. From A's own point of view, A is at which end?",
    options: ["Left", "Right", "Middle", "Cannot be determined"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The observer faces the row, so their right is the row's left.",
      "Left and right reverse between someone facing you and yourself.",
    ],
    solution:
      "1. The observer stands facing the row, so their left and right are the reverse of the row's.\n2. What the observer calls the extreme right is the row's own extreme **left**.\n\nAnswer: **Left**.",
    approach:
      "Always fix whose left and right the question means. A row facing south is described from the north by an observer whose sides are reversed.",
    tags: ["linear"],
    timeTargetSec: 90,
  },
  {
    slug: "sa2-two-rows-facing",
    topic: "seating-arrangement",
    title: "Two rows facing each other",
    prompt:
      "Six people sit in two rows of three, **facing each other**. If **X sits opposite Y**, and **X is at the left end of his row** as he sees it, where does Y sit in his own row?",
    options: ["Left end", "Right end", "Middle", "Cannot be determined"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The two rows face each other, so their left and right are mirrored.",
      "X's left end corresponds to Y's right end.",
    ],
    solution:
      "1. The rows face each other, so their directions are mirrored.\n2. X's own left end sits opposite the **right end** of Y's row.\n3. So Y is at the right end of his row.\n\nAnswer: **Right end**.",
    approach: "Facing rows mirror left and right. Draw both rows with arrows for the direction each faces before deciding.",
    tags: ["linear"],
    timeTargetSec: 105,
  },
];

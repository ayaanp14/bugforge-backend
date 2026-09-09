import type { AptitudeSeed } from "./types.js";

/**
 * The programming section of a placement paper: pseudocode tracing in the
 * generic Infosys / Wipro style, and output prediction in C, Java and Python.
 * Every listing here is deterministic and free of undefined behaviour, so the
 * candidate can trace it on paper and reach exactly one answer.
 */

export const BANK_PSEUDOCODE: AptitudeSeed[] = [
  /* ── Pseudocode: loops, accumulators and conditionals ──────────── */
  {
    slug: "ps-for-sum-of-evens",
    topic: "pseudocode",
    title: "Adding the even numbers",
    prompt: `What does the following pseudocode print?

\`\`\`
Integer i, total
Set total = 0
For i = 1 to 10
    If i MOD 2 == 0 Then
        Set total = total + i
    End If
End For
Print total
\`\`\``,
    options: ["20", "25", "30", "55"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "The If keeps only the values of i that leave no remainder on division by 2.",
      "You are adding 2, 4, 6, 8 and 10 — nothing else reaches total.",
    ],
    solution:
      "1. The loop visits i = 1 to 10, but the guard i MOD 2 == 0 admits only the even values.\n2. Those are 2, 4, 6, 8 and 10.\n3. total = 2 + 4 + 6 + 8 + 10 = 30.\n\nAnswer: **30**.",
    approach:
      "A guarded accumulator sums only the values that pass the test, so list the survivors first and add them once. The whole-range sum 55 is the trap for anyone who ignores the If.",
    tags: ["for loop", "accumulator"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-while-halving-count",
    topic: "pseudocode",
    title: "Halving until one",
    prompt: `In the pseudocode below **/ is integer division: any fraction is discarded**. What is printed?

\`\`\`
Integer n, count
Set n = 100
Set count = 0
While n > 1
    Set n = n / 2
    Set count = count + 1
End While
Print count
\`\`\``,
    options: ["5", "6", "7", "8"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Write down the sequence of values n takes, remembering that 25 / 2 is 12, not 12.5.",
      "The loop stops the moment n reaches 1.",
    ],
    solution:
      "1. n moves 100 → 50 → 25 → 12 → 6 → 3 → 1, because 25 / 2 truncates to 12 and 3 / 2 truncates to 1.\n2. That is one increment of count for each arrow, and there are 6 of them.\n3. With n = 1 the condition n > 1 fails, so the loop ends with count = 6.\n\nAnswer: **6**.",
    approach:
      "Repeated halving with truncation is the standard logarithmic loop. Listing the actual integers is faster and safer than reaching for a formula, because truncation makes the count shorter than the exact logarithm.",
    tags: ["while loop", "integer division"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-nested-triangular-count",
    topic: "pseudocode",
    title: "Counting inner iterations",
    prompt: `How many times does the statement **Set c = c + 1** execute?

\`\`\`
Integer i, j, c
Set c = 0
For i = 1 to 4
    For j = 1 to i
        Set c = c + 1
    End For
End For
Print c
\`\`\``,
    options: ["4", "8", "10", "16"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The inner loop does not always run the same number of times.",
      "For i = 1 it runs once, for i = 2 twice, and so on.",
    ],
    solution:
      "1. The inner loop runs from 1 up to i, so it executes i times on each outer pass.\n2. The four passes contribute 1 + 2 + 3 + 4.\n3. That total is 10, so 10 is printed.\n\nAnswer: **10**.",
    approach:
      "When the inner bound depends on the outer counter the total is the triangular number n(n+1)/2, not n squared. The value 16 is what you get by wrongly assuming the inner loop always runs 4 times.",
    tags: ["nested loops"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-swap-without-temp",
    topic: "pseudocode",
    title: "Swapping without a third variable",
    prompt: `What does the pseudocode print?

\`\`\`
Integer a, b
Set a = 12
Set b = 5
Set a = a + b
Set b = a - b
Set a = a - b
Print a, b
\`\`\``,
    options: ["5 12", "12 5", "17 12", "12 17"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Track a and b after every single assignment; do not skip a line.",
      "After the first assignment a holds the sum of the two original values.",
    ],
    solution:
      "1. Set a = a + b makes a = 12 + 5 = 17, while b is still 5.\n2. Set b = a - b makes b = 17 - 5 = 12, which is the original a.\n3. Set a = a - b makes a = 17 - 12 = 5, which is the original b.\n4. The print statement therefore shows 5 12.\n\nAnswer: **5 12**.",
    approach:
      "The additive swap idiom exchanges two values without a temporary. Recognising it saves the trace, but writing the pair of values beside every assignment is the habit that never fails.",
    tags: ["swapping", "tracing"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-if-else-grade-chain",
    topic: "pseudocode",
    title: "Which branch fires",
    prompt: `What value of **grade** is printed?

\`\`\`
Integer marks, grade
Set marks = 72
If marks >= 90 Then
    Set grade = 1
Else If marks >= 75 Then
    Set grade = 2
Else If marks >= 60 Then
    Set grade = 3
Else
    Set grade = 4
End If
Print grade
\`\`\``,
    options: ["1", "2", "3", "4"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "Test the conditions strictly in the order written.",
      "An Else If is only reached when every earlier condition has failed.",
    ],
    solution:
      "1. marks >= 90 is false, since 72 is below 90.\n2. marks >= 75 is false, since 72 is below 75.\n3. marks >= 60 is true, so grade = 3 and the rest of the chain is skipped.\n\nAnswer: **3**.",
    approach:
      "An if / else-if ladder is exclusive: the first true condition wins and no later test is even evaluated. Reading the conditions out of order is the usual source of error.",
    tags: ["conditionals"],
    timeTargetSec: 45,
  },
  {
    slug: "ps-array-position-of-max",
    topic: "pseudocode",
    title: "Position of the largest element",
    prompt: `The array **A is 1-indexed**, so its elements are A[1] to A[6]. What is printed?

\`\`\`
Integer A[1..6], i, pos
Set A = {4, 19, 7, 23, 2, 11}
Set pos = 1
For i = 2 to 6
    If A[i] > A[pos] Then
        Set pos = i
    End If
End For
Print pos
\`\`\``,
    options: ["2", "3", "4", "23"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "The variable pos stores an index, never an element.",
      "Ask which position holds the largest value, then read off that position number.",
    ],
    solution:
      "1. pos starts at 1, where A[1] = 4.\n2. A[2] = 19 beats 4, so pos becomes 2.\n3. A[3] = 7 does not beat 19, but A[4] = 23 does, so pos becomes 4.\n4. A[5] = 2 and A[6] = 11 do not beat 23, so pos stays 4 and 4 is printed.\n\nAnswer: **4**.",
    approach:
      "Keeping an index rather than a value is the standard argmax pattern. The distractor 23 is the value at that position, which the code never prints.",
    tags: ["arrays", "1-indexed"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-array-print-backwards",
    topic: "pseudocode",
    title: "Walking an array backwards",
    prompt: `The array **A is 0-indexed**, so its elements are A[0] to A[4]. What is printed, in order?

\`\`\`
Integer A[0..4], i
Set A = {3, 8, 1, 9, 4}
For i = 4 down to 0
    Print A[i]
End For
\`\`\``,
    options: ["3 8 1 9 4", "4 9 1 8 3", "4 3 8 1 9", "9 4 3 8 1"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "With 0-based indexing the last element sits at index 4, not 5.",
      "The counter runs downwards, so printing starts from the end.",
    ],
    solution:
      "1. A[4] = 4, A[3] = 9, A[2] = 1, A[1] = 8 and A[0] = 3.\n2. The loop visits those indices in exactly that descending order.\n3. The printed sequence is therefore 4 9 1 8 3.\n\nAnswer: **4 9 1 8 3**.",
    approach:
      "With 0-based indexing an array of n elements ends at index n − 1. Reading the elements off in the loop's own order avoids reversing the answer by accident.",
    tags: ["arrays", "0-indexed"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-string-vowel-count",
    topic: "pseudocode",
    title: "Counting vowels",
    prompt: `Characters are numbered from 1, so **s[1] is the first character**. What does this print?

\`\`\`
String s
Integer i, c
Set s = "PSEUDOCODE"
Set c = 0
For i = 1 to length(s)
    If s[i] is one of A, E, I, O, U Then
        Set c = c + 1
    End If
End For
Print c
\`\`\``,
    options: ["3", "4", "5", "6"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "Write the ten letters out in a row before you count.",
      "Repeated vowels each count separately.",
    ],
    solution:
      "1. The word is P S E U D O C O D E, ten characters long.\n2. The vowels sit at positions 3 (E), 4 (U), 6 (O), 8 (O) and 10 (E).\n3. That is 5 vowels, so c = 5 is printed.\n\nAnswer: **5**.",
    approach:
      "String traversal questions are won by writing the string out with its positions underneath. Counting in your head is where the off-by-one creeps in.",
    tags: ["strings", "counting"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-recursion-skip-factorial",
    topic: "pseudocode",
    title: "Recursion that steps by two",
    prompt: `What is printed?

\`\`\`
Function F(Integer n)
    If n <= 1 Then
        Return 1
    End If
    Return n * F(n - 2)
End Function

Print F(7)
\`\`\``,
    options: ["35", "105", "210", "5040"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Unfold the call chain on paper before you multiply anything.",
      "The argument drops by 2 each time, so it never touches the even numbers.",
    ],
    solution:
      "1. F(7) = 7 * F(5), F(5) = 5 * F(3), F(3) = 3 * F(1), and F(1) = 1.\n2. Substituting back gives 7 * 5 * 3 * 1.\n3. That product is 105.\n\nAnswer: **105**.",
    approach:
      "This is the double factorial: it multiplies every second integer down to the base case. The distractor 5040 is 7 factorial, which you get by wrongly stepping down by 1.",
    tags: ["recursion"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-recursion-call-count",
    topic: "pseudocode",
    title: "How many calls are made",
    prompt: `Counting the first call from the main program, **how many times is G invoked in total**?

\`\`\`
Function G(Integer n)
    If n == 0 Then
        Return 0
    End If
    Return n + G(n - 1)
End Function

Print G(5)
\`\`\``,
    options: ["5", "6", "15", "16"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The question asks for a count of invocations, not for the value returned.",
      "The base case G(0) is itself a call that has to happen.",
    ],
    solution:
      "1. The chain of invocations is G(5), G(4), G(3), G(2), G(1) and finally G(0).\n2. G(0) returns without recursing further, so the chain stops there.\n3. Counting every entry in that list gives 6 invocations.\n\nAnswer: **6**.",
    approach:
      "For a recursion that decrements by one from n down to 0 the number of calls is n + 1, because the base case is a call too. The value returned here is 15, which is the standing trap.",
    tags: ["recursion", "counting"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-call-by-value-effect",
    topic: "pseudocode",
    title: "Call by value",
    prompt: `Parameters are passed **by value**. What is printed, in order?

\`\`\`
Function Change(Integer x)
    Set x = x * 3
    Print x
End Function

Integer a
Set a = 4
Change(a)
Print a
\`\`\``,
    options: ["4 4", "4 12", "12 4", "12 12"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The function receives a copy of the argument, not the variable itself.",
      "The first number printed comes from inside the function.",
    ],
    solution:
      "1. Change receives a copy of a, so x starts at 4 and becomes 4 * 3 = 12.\n2. The function prints 12.\n3. The assignment touched only the copy, so a in the caller is still 4 and the second print shows 4, making the whole output 12 4.\n\nAnswer: **12 4**.",
    approach:
      "Call by value copies the argument into the parameter. Anything the callee assigns to that parameter dies with the call, so the caller's variable is untouched.",
    tags: ["functions", "call by value"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-call-by-reference-mixed",
    topic: "pseudocode",
    title: "One by reference, one by value",
    prompt: `The parameter marked **ref** is passed by reference; the other is passed by value. What does the program print?

\`\`\`
Function Bump(Integer ref x, Integer y)
    Set x = x + 10
    Set y = y + 10
End Function

Integer p, q
Set p = 1
Set q = 2
Bump(p, q)
Print p + q
\`\`\``,
    options: ["3", "12", "13", "23"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Only one of the two assignments inside Bump survives the return.",
      "Work out p and q separately before you add them.",
    ],
    solution:
      "1. x is bound to p itself, so Set x = x + 10 leaves p = 11.\n2. y is a copy of q, so Set y = y + 10 changes the copy only and q is still 2.\n3. The sum printed is 11 + 2 = 13.\n\nAnswer: **13**.",
    approach:
      "A reference parameter is another name for the caller's variable; a value parameter is a private copy. The distractors 3 and 23 are what you get by treating both parameters the same way.",
    tags: ["functions", "call by reference"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-euclid-what-it-computes",
    topic: "pseudocode",
    title: "What does this routine compute",
    prompt: `For positive integers a and b, what does **Mystery(a, b)** return?

\`\`\`
Function Mystery(Integer a, Integer b)
    Integer t
    While b != 0
        Set t = b
        Set b = a MOD b
        Set a = t
    End While
    Return a
End Function
\`\`\``,
    options: [
      "The LCM of a and b",
      "The GCD of a and b",
      "The remainder when a is divided by b",
      "The larger of a and b",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Run it once with a = 48 and b = 18 and see what falls out.",
      "Each round replaces the pair by (smaller, remainder), which is the classical divide-and-repeat method.",
    ],
    solution:
      "1. Trace Mystery(48, 18): the pair becomes (18, 48 MOD 18 = 12), then (12, 18 MOD 12 = 6), then (6, 12 MOD 6 = 0).\n2. With b = 0 the loop stops and 6 is returned.\n3. 6 is exactly the greatest common divisor of 48 and 18, and the replacement (a, b) → (b, a MOD b) preserves the common divisors at every step. The GCD of a and b is therefore what the routine returns for any positive inputs.\n\nAnswer: **The GCD of a and b**.",
    approach:
      "This is Euclid's algorithm. The invariant is that gcd(a, b) = gcd(b, a MOD b), so the value survives every round and surfaces the moment b hits zero.",
    tags: ["routine purpose", "gcd"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-reverse-the-digits",
    topic: "pseudocode",
    title: "Reversing a number",
    prompt: `**/ is integer division** and **MOD is the remainder**. What is printed?

\`\`\`
Integer n, r
Set n = 4021
Set r = 0
While n > 0
    Set r = r * 10 + (n MOD 10)
    Set n = n / 10
End While
Print r
\`\`\``,
    options: ["1204", "1240", "4021", "12040"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "n MOD 10 peels off the last digit; n / 10 throws it away.",
      "Each round shifts whatever is already in r one place to the left.",
    ],
    solution:
      "1. First round: r = 0 * 10 + 1 = 1, n = 402.\n2. Second round: r = 1 * 10 + 2 = 12, n = 40.\n3. Third round: r = 12 * 10 + 0 = 120, n = 4.\n4. Fourth round: r = 120 * 10 + 4 = 1204 and n = 0, so the loop ends and 1204 is printed.\n\nAnswer: **1204**.",
    approach:
      "Peel the last digit with MOD 10, drop it with / 10, and build the answer as r * 10 + digit. The interior zero is the detail worth checking, since it contributes nothing visible until a later digit shifts it along.",
    tags: ["while loop", "digits"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-power-by-repeated-multiply",
    topic: "pseudocode",
    title: "Repeated multiplication",
    prompt: `What is printed?

\`\`\`
Function P(Integer x, Integer n)
    Integer r, i
    Set r = 1
    For i = 1 to n
        Set r = r * x
    End For
    Return r
End Function

Print P(3, 4)
\`\`\``,
    options: ["12", "27", "64", "81"],
    answer: 3,
    difficulty: "easy",
    hints: [
      "The loop body runs once for each value of i from 1 to n.",
      "r starts at 1 and is multiplied by x on every pass.",
    ],
    solution:
      "1. r starts at 1 and the loop runs 4 times with x = 3.\n2. The successive values of r are 3, 9, 27 and 81.\n3. The routine returns 81, which is 3 raised to the power 4.\n\nAnswer: **81**.",
    approach:
      "An accumulator that starts at 1 and multiplies is a power routine; one that starts at 0 and adds is a multiplication routine. The distractor 27 is 3 cubed, from running the loop one time too few.",
    tags: ["for loop", "accumulator"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-for-loop-with-step",
    topic: "pseudocode",
    title: "A loop that steps by seven",
    prompt: `How many times does the body of the loop execute?

\`\`\`
Integer i, c
Set c = 0
For i = 5 to 50 step 7
    Set c = c + 1
End For
Print c
\`\`\``,
    options: ["6", "7", "8", "9"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "List the actual values i takes rather than dividing the range by the step.",
      "The loop stops as soon as i would exceed 50.",
    ],
    solution:
      "1. i takes the values 5, 12, 19, 26, 33, 40 and 47.\n2. The next value would be 54, which is above 50, so the loop stops.\n3. That is 7 executions of the body, so 7 is printed.\n\nAnswer: **7**.",
    approach:
      "For a loop from a to b with step s the count is floor((b − a) / s) + 1. Listing the values is quicker under exam pressure and immune to the off-by-one that the formula invites.",
    tags: ["for loop", "counting"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-while-with-break",
    topic: "pseudocode",
    title: "Leaving the loop early",
    prompt: `What is printed?

\`\`\`
Integer i, s
Set s = 0
Set i = 1
While i <= 20
    If s > 15 Then
        Break
    End If
    Set s = s + i
    Set i = i + 1
End While
Print s
\`\`\``,
    options: ["15", "21", "28", "36"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The test on s happens before s is updated in that same pass.",
      "The comparison is strictly greater than 15, so s = 15 does not stop the loop.",
    ],
    solution:
      "1. The running values of s after each pass are 1, 3, 6, 10 and 15, with i then standing at 6.\n2. At the top of the sixth pass s = 15, and 15 > 15 is false, so the body runs once more: s = 15 + 6 = 21 and i = 7.\n3. At the top of the seventh pass s = 21, which is greater than 15, so Break fires and 21 is printed.\n\nAnswer: **21**.",
    approach:
      "A guard placed at the top of the body is checked using the previous pass's values, so the loop always overshoots by one update. Deciding whether the comparison is strict is the other half of the question.",
    tags: ["while loop", "break"],
    timeTargetSec: 105,
  },
  {
    slug: "ps-repeat-until-runs-once",
    topic: "pseudocode",
    title: "A post-tested loop",
    prompt: `A **Repeat ... Until** loop tests its condition after running the body. What is printed?

\`\`\`
Integer x, c
Set x = 3
Set c = 0
Repeat
    Set x = x - 7
    Set c = c + 1
Until x < 5
Print c
\`\`\``,
    options: ["0", "1", "2", "3"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Check whether the exit condition is already satisfied before the loop starts.",
      "A post-tested loop cannot run zero times.",
    ],
    solution:
      "1. x starts at 3, so the exit condition x < 5 is already true — but the test comes after the body, not before.\n2. The body therefore runs once: x = 3 - 7 = -4 and c = 1.\n3. The test now finds -4 < 5, so the loop ends and 1 is printed.\n\nAnswer: **1**.",
    approach:
      "A post-tested loop executes its body at least once whatever the condition says. A pre-tested While with the same condition would have printed 0, and that contrast is the whole point of the question.",
    tags: ["do while", "loop semantics"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-nested-dependent-product-sum",
    topic: "pseudocode",
    title: "Sum over an upper triangle",
    prompt: `What is printed?

\`\`\`
Integer i, j, s
Set s = 0
For i = 1 to 3
    For j = i to 3
        Set s = s + (i * j)
    End For
End For
Print s
\`\`\``,
    options: ["14", "21", "25", "36"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The inner loop starts at i, not at 1, so it shortens as i grows.",
      "Total each outer pass separately, then add the three subtotals.",
    ],
    solution:
      "1. For i = 1, j runs 1, 2, 3 and contributes 1 + 2 + 3 = 6.\n2. For i = 2, j runs 2, 3 and contributes 4 + 6 = 10.\n3. For i = 3, j runs 3 alone and contributes 9.\n4. The total is 6 + 10 + 9 = 25.\n\nAnswer: **25**.",
    approach:
      "When the inner loop starts from the outer counter you are summing over an upper triangle, not the full grid. The full grid would give (1 + 2 + 3) squared = 36, which is the distractor.",
    tags: ["nested loops", "tracing"],
    timeTargetSec: 105,
  },
  {
    slug: "ps-product-with-reset",
    topic: "pseudocode",
    title: "A product that keeps getting trimmed",
    prompt: `What is printed?

\`\`\`
Integer i, p
Set p = 1
For i = 1 to 5
    Set p = p * i
    If p > 20 Then
        Set p = p - 20
    End If
End For
Print p
\`\`\``,
    options: ["4", "20", "100", "120"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Apply the If at the end of every pass, not only at the end of the loop.",
      "The final test is 20 > 20, and that comparison is strict.",
    ],
    solution:
      "1. i = 1: p = 1. i = 2: p = 2. i = 3: p = 6. None of these exceed 20.\n2. i = 4: p = 6 * 4 = 24, which is above 20, so p becomes 24 - 20 = 4.\n3. i = 5: p = 4 * 5 = 20, and 20 > 20 is false, so p stays 20 and 20 is printed.\n\nAnswer: **20**.",
    approach:
      "A conditional adjustment inside the loop has to be applied on every pass. The strictness of the last comparison decides the answer, so read > and >= carefully.",
    tags: ["for loop", "accumulator"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-count-multiples-of-three-or-four",
    topic: "pseudocode",
    title: "Multiples of three or four",
    prompt: `What is printed?

\`\`\`
Integer i, c
Set c = 0
For i = 1 to 60
    If i MOD 3 == 0 OR i MOD 4 == 0 Then
        Set c = c + 1
    End If
End For
Print c
\`\`\``,
    options: ["25", "30", "35", "40"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Count the multiples of 3 and of 4 separately first.",
      "Numbers such as 12 and 24 satisfy both tests, but the counter still moves only once for them.",
    ],
    solution:
      "1. Multiples of 3 up to 60: 60 / 3 = 20 of them.\n2. Multiples of 4 up to 60: 60 / 4 = 15 of them.\n3. Numbers counted twice are the multiples of 12: 60 / 12 = 5 of them.\n4. The OR admits each qualifying number exactly once, so c = 20 + 15 - 5 = 30.\n\nAnswer: **30**.",
    approach:
      "An OR inside a counting loop is set union, so inclusion-exclusion applies: add the two counts and subtract the overlap, which is governed by the LCM. Adding 20 and 15 blindly gives 35, the trap.",
    tags: ["for loop", "counting"],
    timeTargetSec: 120,
  },
  {
    slug: "ps-bubble-sort-single-pass",
    topic: "pseudocode",
    title: "One pass of a bubble sort",
    prompt: `The array **A is 0-indexed**. What are the contents of A after the loop?

\`\`\`
Integer A[0..4], i, t
Set A = {5, 1, 4, 2, 8}
For i = 0 to 3
    If A[i] > A[i + 1] Then
        Set t = A[i]
        Set A[i] = A[i + 1]
        Set A[i + 1] = t
    End If
End For
Print A
\`\`\``,
    options: ["1 2 4 5 8", "1 4 2 5 8", "1 4 5 2 8", "5 1 4 2 8"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "This is one pass only, so the array need not come out sorted.",
      "After a swap the larger value moves along and is compared again on the next step.",
    ],
    solution:
      "1. i = 0: A[0] = 5 and A[1] = 1, so they are exchanged and the array becomes 1 5 4 2 8.\n2. i = 1: A[1] = 5 and A[2] = 4, so they are exchanged and the array becomes 1 4 5 2 8.\n3. i = 2: A[2] = 5 and A[3] = 2, so they are exchanged and the array becomes 1 4 2 5 8.\n4. i = 3: A[3] = 5 and A[4] = 8, and 5 > 8 is false, so nothing moves and the array printed is 1 4 2 5 8.\n\nAnswer: **1 4 2 5 8**.",
    approach:
      "A single bubble pass carries the largest element to the end and leaves everything else only partly ordered. The fully sorted array 1 2 4 5 8 is the trap for anyone who assumes the whole sort has run.",
    tags: ["arrays", "sorting"],
    timeTargetSec: 120,
  },
  {
    slug: "ps-selection-sort-swap-count",
    topic: "pseudocode",
    title: "How many swaps does it perform",
    prompt: `The array **A is 0-indexed**. What is printed?

\`\`\`
Integer A[0..3], i, j, m, t, swaps
Set A = {4, 3, 2, 1}
Set swaps = 0
For i = 0 to 2
    Set m = i
    For j = i + 1 to 3
        If A[j] < A[m] Then
            Set m = j
        End If
    End For
    If m != i Then
        Set t = A[i]
        Set A[i] = A[m]
        Set A[m] = t
        Set swaps = swaps + 1
    End If
End For
Print swaps
\`\`\``,
    options: ["2", "3", "4", "6"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The inner loop only locates the minimum; it never moves anything.",
      "A swap is skipped entirely when the minimum is already sitting at position i.",
    ],
    solution:
      "1. i = 0: the minimum of 4, 3, 2, 1 is 1 at index 3, so the swap happens and A becomes 1 3 2 4. swaps = 1.\n2. i = 1: the minimum of 3, 2, 4 is 2 at index 2, so the swap happens and A becomes 1 2 3 4. swaps = 2.\n3. i = 2: the minimum of 3, 4 is 3, already at index 2, so m equals i and the guarded swap is skipped.\n4. The loop ends with swaps = 2.\n\nAnswer: **2**.",
    approach:
      "Selection sort does at most n − 1 swaps regardless of how scrambled the input is, and the guard m != i removes even those that would move an element onto itself. Counting comparisons instead of swaps gives 6, the distractor.",
    tags: ["sorting", "counting"],
    timeTargetSec: 150,
  },
  {
    slug: "ps-linear-search-comparisons",
    topic: "pseudocode",
    title: "Comparisons in a linear search",
    prompt: `The array **A is 1-indexed**. How many times is the comparison **A[i] == key** evaluated?

\`\`\`
Integer A[1..8], i, key, cmp
Set A = {12, 7, 9, 25, 4, 18, 25, 3}
Set key = 25
Set cmp = 0
Set i = 1
While i <= 8
    Set cmp = cmp + 1
    If A[i] == key Then
        Break
    End If
    Set i = i + 1
End While
Print cmp
\`\`\``,
    options: ["3", "4", "7", "8"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The search stops at the first match, not the last.",
      "The counter is incremented before the comparison, so the matching position is counted too.",
    ],
    solution:
      "1. i = 1 compares 12 against 25: cmp = 1, no match.\n2. i = 2 compares 7: cmp = 2. i = 3 compares 9: cmp = 3.\n3. i = 4 compares 25 against 25: cmp = 4 and the Break fires.\n4. The second 25 at position 7 is never reached, so 4 is printed.\n\nAnswer: **4**.",
    approach:
      "Linear search costs one comparison per position examined and stops on the first hit. The duplicate later in the array is there to tempt you into counting all the way to position 7.",
    tags: ["arrays", "searching"],
    timeTargetSec: 105,
  },
  {
    slug: "ps-binary-search-iteration-count",
    topic: "pseudocode",
    title: "Iterations of a binary search",
    prompt: `A is **1-indexed** and holds A[i] = 10 × i, that is 10, 20, 30, ..., 150. **/ is integer division.** What is printed?

\`\`\`
Integer low, high, mid, key, steps
Set low = 1
Set high = 15
Set key = 130
Set steps = 0
While low <= high
    Set mid = (low + high) / 2
    Set steps = steps + 1
    If A[mid] == key Then
        Break
    Else If A[mid] < key Then
        Set low = mid + 1
    Else
        Set high = mid - 1
    End If
End While
Print steps
\`\`\``,
    options: ["3", "4", "5", "8"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The key 130 lives at index 13, since A[i] is ten times i.",
      "Recompute low, high and mid explicitly after every pass.",
    ],
    solution:
      "1. low = 1, high = 15 gives mid = 8 and A[8] = 80, which is below 130, so low = 9. steps = 1.\n2. low = 9, high = 15 gives mid = 12 and A[12] = 120, still below 130, so low = 13. steps = 2.\n3. low = 13, high = 15 gives mid = 14 and A[14] = 140, above 130, so high = 13. steps = 3.\n4. low = 13, high = 13 gives mid = 13 and A[13] = 130, a match, so Break fires with steps = 4.\n\nAnswer: **4**.",
    approach:
      "Binary search needs at most about log base 2 of n rounds, but the exact count depends on where the key falls, so trace the interval. Truncating division decides mid whenever low + high is odd.",
    tags: ["searching", "tracing"],
    timeTargetSec: 150,
  },
  {
    slug: "ps-reverse-string-in-place",
    topic: "pseudocode",
    title: "Reversing a string in place",
    prompt: `Characters are numbered from 1 and **/ is integer division**. What is printed?

\`\`\`
String s
Integer i, n, t
Set s = "ALGORITHM"
Set n = length(s)
For i = 1 to n / 2
    Set t = s[i]
    Set s[i] = s[n - i + 1]
    Set s[n - i + 1] = t
End For
Print s
\`\`\``,
    options: ["ALGORITHM", "HTIROGLAM", "MHTIROGLA", "AMHTIROGL"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "With 1-based numbering the partner of position i is position n − i + 1.",
      "The string has 9 characters, so the middle one stays where it is.",
    ],
    solution:
      "1. n = 9, so the loop runs for i = 1 to 4 and position 5 is left alone.\n2. The pairs exchanged are (1, 9), (2, 8), (3, 7) and (4, 6).\n3. Starting from A L G O R I T H M those swaps produce M H T I R O G L A.\n4. The printed string is MHTIROGLA.\n\nAnswer: **MHTIROGLA**.",
    approach:
      "In-place reversal swaps position i with n − i + 1 under 1-based numbering, and only half the string needs visiting. Using n − i instead is the classic off-by-one and yields HTIROGLAM, which is offered as a distractor.",
    tags: ["strings", "swapping"],
    timeTargetSec: 150,
  },
  {
    slug: "ps-palindrome-routine-purpose",
    topic: "pseudocode",
    title: "Identify the test",
    prompt: `Characters are numbered from 1. What does **Check(s)** decide?

\`\`\`
Function Check(String s)
    Integer i, j
    Set i = 1
    Set j = length(s)
    While i < j
        If s[i] != s[j] Then
            Return FALSE
        End If
        Set i = i + 1
        Set j = j - 1
    End While
    Return TRUE
End Function
\`\`\``,
    options: [
      "Whether s contains a repeated character",
      "Whether s is a palindrome",
      "Whether s is in alphabetical order",
      "Whether every character of s is distinct",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The two indices start at opposite ends and move towards each other.",
      "Try it on LEVEL and then on LEVER and compare what happens.",
    ],
    solution:
      "1. i walks forward from the first character while j walks back from the last, so each pass compares a character with its mirror image.\n2. Any mismatched pair returns FALSE at once; TRUE is returned only when every mirrored pair agrees.\n3. That is precisely the condition for the string to read the same forwards and backwards. Whether s is a palindrome is therefore exactly what the routine decides.\n\nAnswer: **Whether s is a palindrome**.",
    approach:
      "Two indices closing in from the ends is the signature of a symmetry test. Naming the pattern is faster than tracing it character by character.",
    tags: ["routine purpose", "strings"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-sum-of-digits-trace",
    topic: "pseudocode",
    title: "Adding the digits",
    prompt: `**/ is integer division** and **MOD is the remainder**. What is printed?

\`\`\`
Integer n, s
Set n = 9407
Set s = 0
While n > 0
    Set s = s + (n MOD 10)
    Set n = n / 10
End While
Print s
\`\`\``,
    options: ["18", "20", "22", "27"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Each pass strips one digit from the right and adds it to s.",
      "The zero in the middle contributes nothing but does not stop the loop.",
    ],
    solution:
      "1. The digits pulled out, in order, are 7, 0, 4 and 9.\n2. s therefore becomes 7, then 7, then 11, then 20.\n3. n reaches 0 and the loop ends, printing 20.\n\nAnswer: **20**.",
    approach:
      "Digit-sum loops always pair MOD 10 with / 10. The interior zero is worth noting because n is still positive after it, so the loop keeps going.",
    tags: ["while loop", "digits"],
    timeTargetSec: 60,
  },
  {
    slug: "ps-nested-loop-with-continue",
    topic: "pseudocode",
    title: "Skipping the diagonal",
    prompt: `What is printed?

\`\`\`
Integer i, j, k
Set k = 0
For i = 1 to 3
    For j = 1 to 3
        If i == j Then
            Continue
        End If
        Set k = k + 1
    End For
End For
Print k
\`\`\``,
    options: ["3", "6", "9", "12"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Continue abandons the current inner pass and moves on to the next j.",
      "Count all the (i, j) pairs first, then remove the ones that are skipped.",
    ],
    solution:
      "1. The nested loops generate 3 × 3 = 9 pairs (i, j).\n2. Continue skips the increment whenever i equals j, which happens for (1,1), (2,2) and (3,3) — 3 pairs.\n3. The counter therefore advances 9 - 3 = 6 times and 6 is printed.\n\nAnswer: **6**.",
    approach:
      "Continue skips the rest of the current iteration but not the loop itself, so counting the total and subtracting the skipped cases is the quickest route.",
    tags: ["nested loops", "continue"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-read-print-swap-difference",
    topic: "pseudocode",
    title: "Read, transform, print",
    prompt: `The program is run with the inputs **a = 6** and **b = 14**, in that order. What is printed?

\`\`\`
Read Integer a
Read Integer b
Set a = a + b
Set b = a - b
If a > b Then
    Print a - b
Else
    Print b - a
End If
\`\`\``,
    options: ["6", "8", "14", "20"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Work out the new a and the new b before you reach the If.",
      "After the two assignments, b holds the value a started with.",
    ],
    solution:
      "1. Set a = a + b makes a = 6 + 14 = 20.\n2. Set b = a - b makes b = 20 - 14 = 6, which is the original a.\n3. a = 20 is greater than b = 6, so the program prints a - b = 20 - 6 = 14.\n4. That is the value b started with.\n\nAnswer: **14**.",
    approach:
      "Half of the additive swap idiom leaves a as the sum and b as the original first input, so the printed difference is the original second input. Recognising the idiom removes the need to guess which branch runs.",
    tags: ["tracing", "swapping"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-three-variable-rotation",
    topic: "pseudocode",
    title: "Rotating three variables",
    prompt: `What is printed?

\`\`\`
Integer p, q, r, t
Set p = 2
Set q = 5
Set r = 9
Set t = p
Set p = r
Set r = q
Set q = t
Print p, q, r
\`\`\``,
    options: ["2 5 9", "5 9 2", "9 2 5", "9 5 2"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "t saves the old p before p is overwritten.",
      "Write the four values p, q, r and t in a column and update them line by line.",
    ],
    solution:
      "1. Set t = p stores 2, leaving p = 2, q = 5, r = 9.\n2. Set p = r makes p = 9.\n3. Set r = q makes r = 5.\n4. Set q = t makes q = 2, so the print statement shows 9 2 5.\n\nAnswer: **9 2 5**.",
    approach:
      "A three-way rotation needs one temporary to hold the value that is overwritten first. Tracking every variable after every line is what stops the values getting shuffled by one place.",
    tags: ["swapping", "tracing"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-count-binary-ones",
    topic: "pseudocode",
    title: "Counting remainders on division by two",
    prompt: `**/ is integer division**. What is printed?

\`\`\`
Function B(Integer n)
    Integer c
    Set c = 0
    While n > 0
        Set c = c + (n MOD 2)
        Set n = n / 2
    End While
    Return c
End Function

Print B(45)
\`\`\``,
    options: ["3", "4", "5", "6"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Each pass adds 1 when n is odd and 0 when n is even.",
      "The sequence of remainders is the binary form of 45, written from the right.",
    ],
    solution:
      "1. The values of n are 45, 22, 11, 5, 2 and 1, giving remainders 1, 0, 1, 1, 0 and 1.\n2. Those remainders spell 45 in binary as 101101.\n3. The remainders add up to 1 + 0 + 1 + 1 + 0 + 1 = 4, so 4 is printed.\n\nAnswer: **4**.",
    approach:
      "Repeated division by 2 while collecting the remainders is base conversion, so this routine returns the number of 1 bits. Checking with 45 = 32 + 8 + 4 + 1 confirms four set bits without a trace.",
    tags: ["while loop", "binary"],
    timeTargetSec: 120,
  },
  {
    slug: "ps-rotate-array-left-by-one",
    topic: "pseudocode",
    title: "Rotating an array left",
    prompt: `The array **A is 0-indexed**. What are its contents at the end?

\`\`\`
Integer A[0..4], i, t
Set A = {10, 20, 30, 40, 50}
Set t = A[0]
For i = 0 to 3
    Set A[i] = A[i + 1]
End For
Set A[4] = t
Print A
\`\`\``,
    options: ["10 20 30 40 50", "20 30 40 50 10", "50 10 20 30 40", "50 40 30 20 10"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Each element is copied one position to the left.",
      "The saved first element is put back at the far end.",
    ],
    solution:
      "1. t saves A[0] = 10.\n2. The loop copies A[1] into A[0], A[2] into A[1], A[3] into A[2] and A[4] into A[3], giving 20 30 40 50 50.\n3. Set A[4] = t overwrites the duplicate with 10, giving 20 30 40 50 10.\n\nAnswer: **20 30 40 50 10**.",
    approach:
      "A left rotation by one is a forward copy plus a wrap-around of the saved element. Copying in the other direction would destroy values before they are read, which is why the loop runs upwards here.",
    tags: ["arrays", "rotation"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-matrix-anti-diagonal-sum",
    topic: "pseudocode",
    title: "Which diagonal is being added",
    prompt: `The matrix **M is 1-indexed** in both dimensions. What is printed?

\`\`\`
Integer M[1..3][1..3], i, j, s
Set M = { {2, 7, 1},
          {9, 4, 6},
          {3, 8, 5} }
Set s = 0
For i = 1 to 3
    For j = 1 to 3
        If i + j == 4 Then
            Set s = s + M[i][j]
        End If
    End For
End For
Print s
\`\`\``,
    options: ["8", "11", "19", "45"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Find every pair (i, j) between 1 and 3 whose sum is 4.",
      "The condition i == j would give the main diagonal; i + j == 4 gives the other one.",
    ],
    solution:
      "1. The pairs with i + j = 4 are (1, 3), (2, 2) and (3, 1).\n2. Those cells hold M[1][3] = 1, M[2][2] = 4 and M[3][1] = 3.\n3. The sum is 1 + 4 + 3 = 8.\n\nAnswer: **8**.",
    approach:
      "For an n by n matrix the main diagonal satisfies i = j and the anti-diagonal satisfies i + j = n + 1. Here the main diagonal would total 11, which is the distractor.",
    tags: ["matrix", "nested loops"],
    timeTargetSec: 105,
  },
  {
    slug: "ps-frequency-routine-purpose",
    topic: "pseudocode",
    title: "What is being returned",
    prompt: `The array **A is 1-indexed** and holds n elements. What does **F(A, n, x)** return?

\`\`\`
Function F(Integer A[1..n], Integer n, Integer x)
    Integer i, c
    Set c = 0
    For i = 1 to n
        If A[i] == x Then
            Set c = c + 1
        End If
    End For
    Return c
End Function
\`\`\``,
    options: [
      "The position of the first occurrence of x in A",
      "The number of times x occurs in A",
      "The sum of the elements of A that equal x",
      "TRUE when x is present in A and FALSE otherwise",
    ],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Notice that the loop never stops early and c is only ever increased by 1.",
      "Ask what c would be for A = {5, 2, 5, 5} and x = 5.",
    ],
    solution:
      "1. c starts at 0 and is increased by exactly 1 for every position whose element equals x.\n2. There is no Break, so all n positions are examined.\n3. For A = {5, 2, 5, 5} and x = 5 the routine returns 3. The number of times x occurs in A is precisely what c has counted.\n\nAnswer: **The number of times x occurs in A**.",
    approach:
      "A counter incremented by 1 under a match is a frequency count; incrementing by A[i] would be a sum, and returning i would be a position. The increment tells you which routine you are looking at.",
    tags: ["routine purpose", "arrays"],
    timeTargetSec: 75,
  },
  {
    slug: "ps-loop-that-never-hits-zero",
    topic: "pseudocode",
    title: "A condition that is never met",
    prompt: `What is printed?

\`\`\`
Integer x, c
Set x = 20
Set c = 0
While x != 0
    Set x = x - 3
    Set c = c + 1
    If c > 100 Then
        Break
    End If
End While
Print c
\`\`\``,
    options: ["7", "20", "101", "102"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Check whether x can ever land exactly on 0 when it starts at 20 and falls by 3.",
      "The safety Break is the only thing that stops this loop.",
    ],
    solution:
      "1. x takes the values 17, 14, 11, 8, 5, 2, -1, -4 and so on. Since 20 is not a multiple of 3, x steps straight past 0 and the condition x != 0 stays true forever.\n2. The loop therefore runs until the safety Break fires, which needs c > 100.\n3. c reaches 101 on the pass where the test first succeeds, and the Break happens immediately after that increment.\n4. So 101 is printed.\n\nAnswer: **101**.",
    approach:
      "An equality test as a loop guard fails whenever the step does not divide the starting value; an inequality such as x > 0 would have terminated. Once you know the safety counter decides the answer, read the comparison carefully: c > 100 first holds at c = 101.",
    tags: ["while loop", "infinite loop"],
    timeTargetSec: 135,
  },
  {
    slug: "ps-mutual-recursion-trace",
    topic: "pseudocode",
    title: "Two routines calling each other",
    prompt: `What is printed?

\`\`\`
Function A(Integer n)
    If n <= 0 Then
        Return 0
    End If
    Return n + B(n - 1)
End Function

Function B(Integer n)
    If n <= 0 Then
        Return 0
    End If
    Return n * A(n - 1)
End Function

Print A(4)
\`\`\``,
    options: ["6", "10", "14", "24"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Expand the calls downwards first and only then fold the values back up.",
      "A adds its argument while B multiplies by it, so the two behave very differently at the bottom.",
    ],
    solution:
      "1. A(4) = 4 + B(3), and B(3) = 3 * A(2).\n2. A(2) = 2 + B(1), and B(1) = 1 * A(0) = 1 * 0 = 0.\n3. So A(2) = 2 + 0 = 2, and B(3) = 3 * 2 = 6.\n4. Finally A(4) = 4 + 6 = 10.\n\nAnswer: **10**.",
    approach:
      "Mutual recursion is traced exactly like ordinary recursion: descend to the base case writing each pending expression, then substitute upwards. The multiplication in B collapses whole branches, so the total is far below the factorial-style 24.",
    tags: ["recursion", "tracing"],
    timeTargetSec: 150,
  },
  {
    slug: "ps-continue-and-break-together",
    topic: "pseudocode",
    title: "Continue and Break in one loop",
    prompt: `What is printed?

\`\`\`
Integer i, s
Set s = 0
For i = 1 to 10
    If i MOD 3 == 0 Then
        Continue
    End If
    If i > 8 Then
        Break
    End If
    Set s = s + i
End For
Print s
\`\`\``,
    options: ["22", "27", "30", "37"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Continue moves to the next value of i; Break leaves the loop for good.",
      "Check what happens at i = 9 before you decide when the loop ends.",
    ],
    solution:
      "1. The values 3, 6 and 9 are skipped by Continue and never reach either the Break test or the sum.\n2. The values 1, 2, 4, 5, 7 and 8 all pass both tests and are added: 1 + 2 + 4 + 5 + 7 + 8 = 27.\n3. At i = 10 the first test fails, the second succeeds because 10 > 8, and Break ends the loop.\n4. The value printed is 27.\n\nAnswer: **27**.",
    approach:
      "Two guards in sequence must be applied in order: Continue can prevent Break from ever being tested, which is why i = 9 does not end the loop. Forgetting the Break gives 37, the sum of everything not divisible by 3.",
    tags: ["for loop", "break", "continue"],
    timeTargetSec: 105,
  },
  {
    slug: "ps-range-of-an-array",
    topic: "pseudocode",
    title: "Tracking two extremes at once",
    prompt: `The array **A is 0-indexed**. What is printed?

\`\`\`
Integer A[0..5], i, mn, mx
Set A = {14, 3, 27, 3, 19, 8}
Set mn = A[0]
Set mx = A[0]
For i = 1 to 5
    If A[i] < mn Then
        Set mn = A[i]
    End If
    If A[i] > mx Then
        Set mx = A[i]
    End If
End For
Print mx - mn
\`\`\``,
    options: ["11", "16", "24", "30"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Both trackers are seeded with the first element, not with zero.",
      "Find the smallest and the largest element, then subtract.",
    ],
    solution:
      "1. mn and mx both start at A[0] = 14.\n2. The smallest element in the array is 3, so mn ends at 3.\n3. The largest element is 27, so mx ends at 27.\n4. The value printed is 27 - 3 = 24.\n\nAnswer: **24**.",
    approach:
      "Seeding both trackers from the first element is what makes a single pass correct for any data, positive or negative. The routine as a whole computes the range of the array.",
    tags: ["arrays", "tracing"],
    timeTargetSec: 90,
  },
  {
    slug: "ps-collatz-step-count",
    topic: "pseudocode",
    title: "Counting steps to one",
    prompt: `**/ is integer division**. How many times does the body of the loop run?

\`\`\`
Integer n, steps
Set n = 7
Set steps = 0
While n != 1
    If n MOD 2 == 0 Then
        Set n = n / 2
    Else
        Set n = 3 * n + 1
    End If
    Set steps = steps + 1
End While
Print steps
\`\`\``,
    options: ["11", "14", "16", "17"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Write the whole chain of values of n out in a line before counting anything.",
      "Every arrow in that chain is one execution of the body, including the last one that lands on 1.",
    ],
    solution:
      "1. The chain is 7 → 22 → 11 → 34 → 17 → 52 → 26 → 13 → 40 → 20 → 10 → 5 → 16 → 8 → 4 → 2 → 1.\n2. Each arrow is one pass of the loop, and there are 16 arrows.\n3. The loop then finds n = 1 and stops, so 16 is printed.\n\nAnswer: **16**.",
    approach:
      "Halve when even, triple and add one when odd. There is no shortcut: write the chain out carefully, and remember that the number of steps is one less than the number of values listed.",
    tags: ["while loop", "tracing"],
    timeTargetSec: 180,
  },

  /* ── Programming fundamentals: C ───────────────────────────────── */
  {
    slug: "pf-c-integer-and-float-division",
    topic: "programming-fundamentals",
    title: "Two kinds of division in C",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int a = 7, b = 2;
    printf("%d %.1f", a / b, (float) a / b);
    return 0;
}
\`\`\``,
    options: ["3 3.5", "3 3.0", "3.5 3.5", "4 3.5"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Both operands of the first division are int.",
      "A cast on one operand promotes the whole expression before the division happens.",
    ],
    solution:
      "1. In a / b both operands are int, so C performs integer division: 7 / 2 = 3, with the fraction discarded rather than rounded.\n2. In (float) a / b the cast applies to a first, so the division is done in floating point: 7.0 / 2 = 3.5.\n3. The two conversion specifiers print 3 and 3.5 respectively, so the output is 3 3.5.\n\nAnswer: **3 3.5**.",
    approach:
      "In C the operand types decide the operation, not the type of the variable you assign to. Casting one operand is enough, because the other is promoted to match it.",
    tags: ["c", "operators"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-c-pre-and-post-increment",
    topic: "programming-fundamentals",
    title: "Pre-increment against post-increment",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int i = 5;
    int j = i++;
    int k = ++i;
    printf("%d %d %d", i, j, k);
    return 0;
}
\`\`\``,
    options: ["5 5 7", "6 5 6", "7 5 7", "7 6 7"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Post-increment hands over the old value and then increases the variable.",
      "Pre-increment increases the variable first and hands over the new value.",
    ],
    solution:
      "1. j = i++ gives j the current value 5, then i becomes 6.\n2. k = ++i raises i to 7 first, so k also receives 7.\n3. At the print statement i = 7, j = 5 and k = 7, so the program prints 7 5 7.\n\nAnswer: **7 5 7**.",
    approach:
      "Both forms change the variable by one; they differ only in the value the expression yields. Splitting the statement into 'use, then bump' or 'bump, then use' settles every case.",
    tags: ["c", "increment"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-c-operator-precedence",
    topic: "programming-fundamentals",
    title: "Precedence of the arithmetic operators",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int r = 10 - 4 * 2 + 18 / 3 % 4;
    printf("%d", r);
    return 0;
}
\`\`\``,
    options: ["2", "4", "6", "8"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Multiplication, division and remainder all sit at the same level, above addition and subtraction.",
      "Operators of equal precedence are applied left to right, so 18 / 3 happens before the % 4.",
    ],
    solution:
      "1. The high-precedence operators go first: 4 * 2 = 8 and 18 / 3 = 6.\n2. % has the same precedence as / and associates left to right, so the 6 is then reduced: 6 % 4 = 2.\n3. What remains is 10 - 8 + 2, evaluated left to right: 2 + 2 = 4.\n\nAnswer: **4**.",
    approach:
      "Remainder is not below division in the precedence table, it is beside it, so left-to-right associativity decides the order. Rewriting the line with explicit brackets before evaluating anything is the safe habit.",
    tags: ["c", "precedence"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-c-short-circuit-and",
    topic: "programming-fundamentals",
    title: "Short-circuit evaluation",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int a = 0, b = 5;
    if (a++ && ++b) {
        b = 100;
    }
    printf("%d %d", a, b);
    return 0;
}
\`\`\``,
    options: ["0 5", "1 5", "1 6", "2 100"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Work out the value the left operand yields before you decide whether the right one runs.",
      "The increment on a still happens even though the condition turns out to be false.",
    ],
    solution:
      "1. a++ yields the old value 0, which C reads as false, and as a side effect a becomes 1.\n2. Because the left operand of && is false, the whole condition is already decided, so ++b is never evaluated and b stays 5.\n3. The if body does not run, so b is not set to 100 and the program prints 1 5.\n\nAnswer: **1 5**.",
    approach:
      "&& stops as soon as the result is known, so side effects in the right operand may never happen. The side effect in the left operand happens regardless, which is what separates 1 5 from 0 5.",
    tags: ["c", "short circuit"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-c-static-local-variable",
    topic: "programming-fundamentals",
    title: "A static local variable",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

void f(void) {
    static int c = 0;
    int d = 0;
    c = c + 1;
    d = d + 1;
    printf("%d%d ", c, d);
}

int main(void) {
    f();
    f();
    f();
    return 0;
}
\`\`\``,
    options: ["11 11 11", "11 21 31", "11 22 33", "13 13 13"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A static local is initialised once, at the first call only.",
      "The ordinary local is created afresh on every call.",
    ],
    solution:
      "1. c is static, so its initialiser runs once and its value survives between calls: it becomes 1, then 2, then 3.\n2. d is an ordinary local, rebuilt and set to 0 at every call, so it is always 1 when printed.\n3. The three calls print 11, then 21, then 31, so the output is 11 21 31.\n\nAnswer: **11 21 31**.",
    approach:
      "static inside a function changes the lifetime of the variable, not its scope: it lives for the whole program but is still invisible outside the function. That is why one digit climbs and the other does not.",
    tags: ["c", "static", "scope"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-c-pass-by-value-swap",
    topic: "programming-fundamentals",
    title: "A swap that does not swap",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

void swap(int a, int b) {
    int t = a;
    a = b;
    b = t;
}

int main(void) {
    int x = 3, y = 8;
    swap(x, y);
    printf("%d %d", x, y);
    return 0;
}
\`\`\``,
    options: ["3 8", "3 3", "8 3", "8 8"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Ask what swap actually receives when it is called.",
      "The exchange inside the function is real, but nothing outside it can see the result.",
    ],
    solution:
      "1. C passes arguments by value, so a and b are private copies of x and y.\n2. The three lines do exchange those copies, leaving a = 8 and b = 3 inside the function.\n3. The copies vanish when swap returns, so x is still 3 and y is still 8, and the program prints 3 8.\n\nAnswer: **3 8**.",
    approach:
      "C has only call by value, so a function can never change a caller's variable unless it is handed the address of that variable. Passing int * instead of int is the fix.",
    tags: ["c", "call by value"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-c-pointer-arithmetic",
    topic: "programming-fundamentals",
    title: "Pointer arithmetic against value arithmetic",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int a[5] = {10, 20, 30, 40, 50};
    int *p = a + 1;
    printf("%d %d", *(p + 2), *p + 2);
    return 0;
}
\`\`\``,
    options: ["30 22", "40 22", "40 32", "50 22"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "First settle which element p points at.",
      "In *(p + 2) the addition moves the pointer; in *p + 2 the addition is applied to the value already fetched.",
    ],
    solution:
      "1. p = a + 1 makes p point at a[1], whose value is 20.\n2. *(p + 2) dereferences two elements further along, which is a[3] = 40.\n3. *p + 2 fetches 20 first and then adds 2, giving 22, so the program prints 40 22.\n\nAnswer: **40 22**.",
    approach:
      "The dereference operator binds tighter than +, so brackets decide whether you are moving through memory or doing plain arithmetic. Pointer addition advances in units of the pointed-to type, never in bytes.",
    tags: ["c", "pointers"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-c-sizeof-array-vs-pointer",
    topic: "programming-fundamentals",
    title: "sizeof on an array parameter",
    prompt: `Assume a machine where **int occupies 4 bytes and a pointer occupies 8 bytes**. What does this **C** program print?

\`\`\`c
#include <stdio.h>

void f(int arr[]) {
    printf("%d ", (int) (sizeof(arr) / sizeof(arr[0])));
}

int main(void) {
    int a[10];
    f(a);
    printf("%d", (int) (sizeof(a) / sizeof(a[0])));
    return 0;
}
\`\`\``,
    options: ["2 10", "10 2", "10 10", "40 10"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "An array parameter is not really an array once the function is compiled.",
      "Inside f, work out sizeof(arr) as the size of a pointer, then divide.",
    ],
    solution:
      "1. A parameter declared int arr[] is adjusted to int *arr, so inside f sizeof(arr) is the size of a pointer, 8 bytes, and sizeof(arr[0]) is 4.\n2. The division there gives 8 / 4 = 2.\n3. In main, a is a genuine array of 10 ints, so sizeof(a) is 40 and the division gives 40 / 4 = 10, making the output 2 10.\n\nAnswer: **2 10**.",
    approach:
      "Arrays decay to pointers when passed to a function, which is exactly why C functions that take arrays also take a length. The sizeof trick works only in the scope where the array is declared.",
    tags: ["c", "pointers", "sizeof"],
    timeTargetSec: 120,
  },
  {
    slug: "pf-c-strlen-vs-sizeof",
    topic: "programming-fundamentals",
    title: "strlen against sizeof",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "PLACEMENT";
    printf("%d %d", (int) strlen(s), (int) sizeof(s));
    return 0;
}
\`\`\``,
    options: ["9 9", "9 10", "10 9", "10 10"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Count the letters of PLACEMENT carefully.",
      "A string literal used to initialise a char array brings a terminating null character with it.",
    ],
    solution:
      "1. PLACEMENT has 9 letters, and strlen counts characters up to but not including the terminator, so it returns 9.\n2. The array s is sized to hold those 9 characters plus the terminating null, so it occupies 10 chars.\n3. sizeof(s) is therefore 10 and the program prints 9 10.\n\nAnswer: **9 10**.",
    approach:
      "strlen is a runtime scan for the null terminator; sizeof is a compile-time count of the storage. They differ by exactly one for a char array initialised from a literal.",
    tags: ["c", "strings", "sizeof"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-c-switch-fall-through",
    topic: "programming-fundamentals",
    title: "Falling through a switch",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int n = 2;
    switch (n) {
        case 1: printf("A");
        case 2: printf("B");
        case 3: printf("C"); break;
        case 4: printf("D");
        default: printf("E");
    }
    return 0;
}
\`\`\``,
    options: ["B", "BC", "BCD", "BCDE"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "A case label is an entry point, not a self-contained block.",
      "Execution stops only when it meets a break or the end of the switch.",
    ],
    solution:
      "1. n = 2 so control jumps to case 2 and prints B.\n2. There is no break after case 2, so execution falls through into case 3 and prints C.\n3. case 3 does end in break, so the switch is left and the output is BC.\n\nAnswer: **BC**.",
    approach:
      "Cases in C fall through by default; break is what stops them. Reading a switch as a chain that you jump into, rather than as a set of independent branches, makes the output obvious.",
    tags: ["c", "switch"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-c-nested-ternary",
    topic: "programming-fundamentals",
    title: "A nested conditional expression",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int x = 3;
    printf("%d", x > 2 ? x > 4 ? 100 : 200 : 300);
    return 0;
}
\`\`\``,
    options: ["3", "100", "200", "300"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The conditional operator groups from the right, so the inner ?: belongs to the true branch of the outer one.",
      "Insert the brackets yourself before you evaluate anything.",
    ],
    solution:
      "1. The expression groups as x > 2 ? (x > 4 ? 100 : 200) : 300.\n2. x = 3, so x > 2 is true and the outer conditional selects its middle operand.\n3. Inside that, x > 4 is false, so the result is 200.\n\nAnswer: **200**.",
    approach:
      "?: is right-associative, so an unbracketed chain nests inside the previous true branch. Adding the brackets by hand converts the puzzle into an ordinary if / else chain.",
    tags: ["c", "ternary"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-c-signed-unsigned-comparison",
    topic: "programming-fundamentals",
    title: "Comparing a signed value with an unsigned one",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int a = -1;
    unsigned int b = 1;
    if (a < b) {
        printf("less");
    } else {
        printf("not less");
    }
    return 0;
}
\`\`\``,
    options: ["less", "not less", "The program does not compile", "Nothing is printed"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The two operands have different types, so one of them is converted before the comparison.",
      "When int and unsigned int meet, it is the signed operand that changes.",
    ],
    solution:
      "1. The usual arithmetic conversions turn the int into an unsigned int, because unsigned int has the same rank and wins the conversion.\n2. The bit pattern of -1 read as unsigned is the largest representable value, 4294967295 on a 32-bit int.\n3. 4294967295 < 1 is false, so the else branch runs and the program prints not less.\n\nAnswer: **not less**.",
    approach:
      "Mixing signed and unsigned in one comparison silently converts the signed side, so a negative number becomes enormous. Keeping loop counters and sizes on the same side of the signed divide avoids the whole class of bug.",
    tags: ["c", "type promotion"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-c-char-as-int",
    topic: "programming-fundamentals",
    title: "A character used in arithmetic",
    prompt: `Assume the ASCII character set, in which **'A' has the value 65**. What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    char c = 'A';
    printf("%c %d", c + 2, c + 2);
    return 0;
}
\`\`\``,
    options: ["A 65", "C 2", "C 67", "67 67"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "A char takes part in arithmetic as a small integer.",
      "The same expression is printed twice under two different conversion specifiers.",
    ],
    solution:
      "1. c holds 65, so c + 2 is the integer 67.\n2. Under %c the value 67 is printed as the character it codes for, which is C.\n3. Under %d the same value is printed as the number 67, so the output is C 67.\n\nAnswer: **C 67**.",
    approach:
      "In C a character is just its code, and the conversion specifier decides how that code is displayed. Nothing about the value changes between the two printings.",
    tags: ["c", "characters", "printf"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-c-index-commutes",
    topic: "programming-fundamentals",
    title: "Subscripting written backwards",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int main(void) {
    int a[5] = {10, 20, 30, 40, 50};
    printf("%d", 3[a] - a[1]);
    return 0;
}
\`\`\``,
    options: ["10", "20", "30", "40"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Subscripting is defined in terms of pointer addition, and addition is commutative.",
      "Rewrite 3[a] as a dereference of a sum and see what it becomes.",
    ],
    solution:
      "1. The standard defines E1[E2] as *(E1 + E2), so 3[a] means *(3 + a), which is the same as *(a + 3), which is a[3].\n2. a[3] is 40 and a[1] is 20.\n3. The difference printed is 40 - 20 = 20.\n\nAnswer: **20**.",
    approach:
      "Because subscripting is only sugar for pointer addition, the index and the array name can be written in either order. It is a curiosity rather than a style to adopt, but placement papers ask it often.",
    tags: ["c", "arrays", "pointers"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-c-global-shadowed-by-local",
    topic: "programming-fundamentals",
    title: "A local that hides a global",
    prompt: `What does this **C** program print?

\`\`\`c
#include <stdio.h>

int x = 10;

void f(void) {
    int x = 20;
    x = x + 1;
    printf("%d ", x);
}

int main(void) {
    f();
    printf("%d", x);
    return 0;
}
\`\`\``,
    options: ["11 10", "11 11", "21 10", "21 21"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "Inside f, which x does the name refer to?",
      "The global is never assigned to anywhere in the program.",
    ],
    solution:
      "1. The declaration int x = 20 inside f introduces a new local variable that hides the global for the whole of that function.\n2. x = x + 1 therefore raises the local to 21, and f prints 21.\n3. The global x was never touched, so main prints 10 and the whole output is 21 10.\n\nAnswer: **21 10**.",
    approach:
      "An inner declaration shadows an outer one of the same name for the rest of that block. Nothing links the two variables, so changes to one leave the other exactly as it was.",
    tags: ["c", "scope"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-c-negative-division-and-modulo",
    topic: "programming-fundamentals",
    title: "Dividing a negative number",
    prompt: `What does this **C** program print? Assume a C99 or later compiler.

\`\`\`c
#include <stdio.h>

int main(void) {
    printf("%d %d", -7 / 2, -7 % 2);
    return 0;
}
\`\`\``,
    options: ["-4 -1", "-4 1", "-3 -1", "-3 1"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Integer division in C truncates towards zero rather than towards minus infinity.",
      "The identity (a / b) * b + a % b == a fixes the remainder once the quotient is known.",
    ],
    solution:
      "1. -7 / 2 is -3.5 truncated towards zero, which gives -3, not -4.\n2. The remainder must satisfy (-3) * 2 + r = -7, so r = -1.\n3. C99 guarantees exactly this behaviour, so the program prints -3 -1.\n\nAnswer: **-3 -1**.",
    approach:
      "C truncates towards zero, so the remainder carries the sign of the dividend. Python floors instead, which is why the same two expressions give -4 and 1 there.",
    tags: ["c", "operators"],
    timeTargetSec: 90,
  },

  /* ── Programming fundamentals: Java ────────────────────────────── */
  {
    slug: "pf-java-string-equality",
    topic: "programming-fundamentals",
    title: "Comparing strings with == and equals",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        String a = "code";
        String b = "code";
        String c = new String("code");
        System.out.println((a == b) + " " + (a == c) + " " + a.equals(c));
    }
}
\`\`\``,
    options: ["true true true", "true false true", "false false true", "true false false"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Identical string literals are pooled, so they refer to one object.",
      "new always produces a fresh object, whatever its contents.",
    ],
    solution:
      "1. a and b are both the literal \"code\", which the compiler places in the string pool once, so a == b compares two references to the same object and is true.\n2. new String(\"code\") deliberately builds a separate object, so a == c compares different references and is false.\n3. equals compares contents rather than references, so a.equals(c) is true, and the output is true false true.\n\nAnswer: **true false true**.",
    approach:
      "== on objects asks whether two references point at the same object; equals asks whether the contents match. String literals are interned, which is why the first comparison surprises people.",
    tags: ["java", "strings"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-java-integer-cache",
    topic: "programming-fundamentals",
    title: "Comparing boxed integers",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d));
    }
}
\`\`\``,
    options: ["true true", "true false", "false true", "false false"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "These are Integer objects, not int values, so == compares references.",
      "Autoboxing reuses cached objects for a small band of values around zero.",
    ],
    solution:
      "1. Assigning an int literal to an Integer calls Integer.valueOf, which caches objects for values from -128 to 127.\n2. Both 127 assignments therefore hand back the very same cached object, so a == b is true.\n3. 128 lies outside the cache, so two distinct objects are created and c == d is false, giving true false.\n\nAnswer: **true false**.",
    approach:
      "Boxed types compare by reference under ==, and the small-value cache makes that behaviour look inconsistent. Comparing with equals, or unboxing to int first, is the reliable route.",
    tags: ["java", "autoboxing"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-java-string-immutable",
    topic: "programming-fundamentals",
    title: "String methods return new strings",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        String s = "placement";
        s.toUpperCase();
        s.concat(" test");
        System.out.println(s);
    }
}
\`\`\``,
    options: ["placement", "PLACEMENT", "placement test", "PLACEMENT test"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Look for an assignment on the two middle lines.",
      "A String object in Java can never be modified after it is built.",
    ],
    solution:
      "1. Strings are immutable, so toUpperCase and concat cannot change s; they build and return new strings.\n2. Neither return value is assigned to anything, so both new strings are discarded immediately.\n3. s still refers to the original object and placement is printed.\n\nAnswer: **placement**.",
    approach:
      "Every String method that looks like a mutation is really a factory. The fix is s = s.toUpperCase(), and forgetting the assignment is one of the most common Java mistakes.",
    tags: ["java", "strings", "immutability"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-java-division-print",
    topic: "programming-fundamentals",
    title: "Integer and floating-point division in Java",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println(5 / 2 + " " + 5 / 2.0 + " " + 5 % 2);
    }
}
\`\`\``,
    options: ["2 2.5 1", "2 2.0 1", "2 2.5 2", "2.5 2.5 1"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "The arithmetic operators bind more tightly than the + used for concatenation.",
      "5 / 2 has two int operands, but 5 / 2.0 does not.",
    ],
    solution:
      "1. 5 / 2 is int division and yields 2.\n2. 5 / 2.0 promotes the 5 to double, so it yields 2.5.\n3. 5 % 2 is the remainder 1, and the three values are joined into 2 2.5 1.\n\nAnswer: **2 2.5 1**.",
    approach:
      "Division stays in the integers only while both operands are integers; a single double operand promotes the whole expression. The arithmetic runs before any concatenation, because / and % outrank +.",
    tags: ["java", "operators"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-java-concat-precedence",
    topic: "programming-fundamentals",
    title: "When + means concatenation",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println(1 + 2 + "3" + 4 + 5);
    }
}
\`\`\``,
    options: ["339", "1239", "3345", "12345"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "+ is evaluated strictly left to right.",
      "The operator only turns into concatenation once one of its operands is a String.",
    ],
    solution:
      "1. 1 + 2 has two int operands, so it is ordinary addition and gives 3.\n2. 3 + \"3\" has a String operand, so it concatenates to \"33\".\n3. From that point every + has a String on the left, so \"33\" + 4 gives \"334\" and \"334\" + 5 gives \"3345\".\n\nAnswer: **3345**.",
    approach:
      "The same symbol adds numbers and joins strings, and left-to-right evaluation decides which meaning applies at each step. Once a String appears, everything after it is concatenation.",
    tags: ["java", "strings", "operators"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-java-static-counter",
    topic: "programming-fundamentals",
    title: "A static field shared by every object",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    static int count = 0;
    int id;

    Main() {
        count++;
        id = count;
    }

    public static void main(String[] args) {
        Main p = new Main();
        Main q = new Main();
        Main r = new Main();
        System.out.println(p.id + " " + r.id + " " + Main.count);
    }
}
\`\`\``,
    options: ["1 1 1", "1 3 1", "1 3 3", "3 3 3"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "count belongs to the class; id belongs to each object.",
      "Each object records the value of count at the moment it was built.",
    ],
    solution:
      "1. There is a single count shared by every object, and each constructor call raises it: after three objects it is 3.\n2. Each object has its own id, fixed at construction time, so p.id = 1, q.id = 2 and r.id = 3.\n3. The program prints p.id, r.id and count, that is 1 3 3.\n\nAnswer: **1 3 3**.",
    approach:
      "A static field exists once per class, an instance field once per object. Reading a snapshot of the static into an instance field is the standard way to number objects as they are created.",
    tags: ["java", "static"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-java-array-vs-int-parameter",
    topic: "programming-fundamentals",
    title: "What a method can and cannot change",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    static void f(int[] a, int x) {
        a[0] = 99;
        x = 99;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2};
        int n = 1;
        f(arr, n);
        System.out.println(arr[0] + " " + n);
    }
}
\`\`\``,
    options: ["1 1", "1 99", "99 1", "99 99"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Java passes everything by value, but for an array the value passed is a reference.",
      "Compare writing through a reference with reassigning the parameter itself.",
    ],
    solution:
      "1. The parameter a is a copy of the reference held in arr, so both names point at the same array object, and a[0] = 99 changes the object the caller can see.\n2. The parameter x is a copy of the int n, so x = 99 changes only that copy and n is still 1.\n3. The program therefore prints 99 1.\n\nAnswer: **99 1**.",
    approach:
      "Java is call by value throughout; what varies is whether the value is a number or a reference. Writing through a reference is visible outside, reassigning the parameter never is.",
    tags: ["java", "call by value", "arrays"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-java-stringbuilder-parameter",
    topic: "programming-fundamentals",
    title: "String against StringBuilder as a parameter",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    static void change(String s, StringBuilder sb) {
        s = s + " changed";
        sb.append(" changed");
    }

    public static void main(String[] args) {
        String s = "A";
        StringBuilder sb = new StringBuilder("B");
        change(s, sb);
        System.out.println(s + " " + sb);
    }
}
\`\`\``,
    options: ["A B", "A B changed", "A changed B", "A changed B changed"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "One of the two lines inside change reassigns a parameter; the other modifies an object.",
      "A String cannot be modified at all, so s = s + ... must be building something new.",
    ],
    solution:
      "1. s = s + \" changed\" builds a new String and points the local parameter at it, leaving the caller's s untouched at A.\n2. sb.append modifies the StringBuilder object itself, and the caller holds a reference to that same object, so the change is visible.\n3. The program prints A B changed.\n\nAnswer: **A B changed**.",
    approach:
      "Mutating the object a reference points at is visible to the caller; repointing the reference is not. Because String is immutable, only the second kind of operation is ever available for it.",
    tags: ["java", "strings", "immutability"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-java-ternary-numeric-promotion",
    topic: "programming-fundamentals",
    title: "The type of a conditional expression",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println(true ? 1 : 2.0);
    }
}
\`\`\``,
    options: ["1", "1.0", "2.0", "The program does not compile"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "A conditional expression has one type, fixed at compile time, not one type per branch.",
      "When the two branches are int and double, numeric promotion decides the common type.",
    ],
    solution:
      "1. The condition is true, so the value selected comes from the second operand, the int 1.\n2. The type of the whole conditional expression is settled at compile time by binary numeric promotion of int and double, which gives double.\n3. The selected 1 is therefore widened to 1.0 before printing, so the output is 1.0.\n\nAnswer: **1.0**.",
    approach:
      "The branch not taken still influences the result, because the expression's type is decided before any branch is chosen. This is why mixing int and double in a conditional quietly changes what gets printed.",
    tags: ["java", "ternary", "type promotion"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-java-switch-fall-through",
    topic: "programming-fundamentals",
    title: "Grouped labels and a missing break",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        int day = 3;
        switch (day) {
            case 1:
            case 2:
                System.out.print("Early");
                break;
            case 3:
            case 4:
                System.out.print("Mid");
            case 5:
                System.out.print("Late");
                break;
            default:
                System.out.print("Weekend");
        }
    }
}
\`\`\``,
    options: ["Mid", "MidLate", "MidLateWeekend", "EarlyMidLate"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Stacked labels with no statements between them share the code that follows.",
      "Look carefully at which of the groups actually ends in a break.",
    ],
    solution:
      "1. day = 3 matches case 3, and the code that follows the pair 3 and 4 prints Mid.\n2. That group has no break, so execution falls through into case 5 and prints Late.\n3. case 5 ends in break, so default is never reached and the output is MidLate.\n\nAnswer: **MidLate**.",
    approach:
      "Empty stacked labels are a deliberate way to give several values the same body; a missing break at the end of a body is usually a bug. Both appear in the same switch here, and only the break tells them apart.",
    tags: ["java", "switch"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-java-finally-after-return",
    topic: "programming-fundamentals",
    title: "finally runs after the return value is fixed",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    static int f() {
        try {
            return 1;
        } finally {
            System.out.print("F");
        }
    }

    public static void main(String[] args) {
        System.out.print(f());
    }
}
\`\`\``,
    options: ["1", "1F", "F", "F1"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "The finally block runs before control actually leaves the method.",
      "Nothing can be printed by main until f has returned.",
    ],
    solution:
      "1. f evaluates its return expression, then runs the finally block before control leaves the method, so F is printed first.\n2. Only then does f hand 1 back to main.\n3. main prints that 1 afterwards, so the output is F1.\n\nAnswer: **F1**.",
    approach:
      "A finally block is guaranteed to run on every exit path, including a return, and it runs before the caller resumes. The returned value is captured first, which is why the value itself is unaffected.",
    tags: ["java", "exceptions"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-java-int-overflow",
    topic: "programming-fundamentals",
    title: "Adding one to the largest int",
    prompt: `What does this **Java** program print?

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println(Integer.MAX_VALUE + 1);
    }
}
\`\`\``,
    options: ["2147483647", "2147483648", "-2147483648", "The program does not compile"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The arithmetic is done in int, and the result is not widened to long.",
      "int arithmetic in Java wraps around silently instead of raising an error.",
    ],
    solution:
      "1. Integer.MAX_VALUE is 2147483647 and the literal 1 is an int, so the addition is performed in 32-bit int arithmetic.\n2. Java specifies wrap-around on overflow rather than an exception, so the result rolls over to the most negative int.\n3. That value is -2147483648, which is what gets printed.\n\nAnswer: **-2147483648**.",
    approach:
      "Java int arithmetic is modulo 2 to the power 32 and never reports overflow. Casting one operand to long, or using Math.addExact, is how you avoid the silent wrap.",
    tags: ["java", "overflow"],
    timeTargetSec: 75,
  },

  /* ── Programming fundamentals: Python ──────────────────────────── */
  {
    slug: "pf-py-floor-and-true-division",
    topic: "programming-fundamentals",
    title: "Three divisions in Python",
    prompt: `What does this **Python** program print?

\`\`\`python
print(7 // 2, 7 / 2, -7 // 2)
\`\`\``,
    options: ["3 3.5 -3", "3 3.5 -4", "3 3 -4", "3.5 3.5 -3.5"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "// and / are different operators in Python 3, and only one of them produces a float.",
      "// rounds towards minus infinity, not towards zero.",
    ],
    solution:
      "1. 7 // 2 is floor division and gives the integer 3.\n2. 7 / 2 is true division and always gives a float, here 3.5.\n3. -7 // 2 floors -3.5 downwards to -4, so the line prints 3 3.5 -4.\n\nAnswer: **3 3.5 -4**.",
    approach:
      "Python 3 separates true division from floor division, and floor division rounds towards minus infinity. That last rule is what makes the negative case differ from C, where the same expression gives -3.",
    tags: ["python", "operators"],
    timeTargetSec: 75,
  },
  {
    slug: "pf-py-list-alias-vs-slice-copy",
    topic: "programming-fundamentals",
    title: "Aliasing against slicing",
    prompt: `What does this **Python** program print?

\`\`\`python
a = [1, 2, 3]
b = a
b.append(4)
c = a[:]
c.append(5)
print(len(a), len(b), len(c))
\`\`\``,
    options: ["3 3 4", "3 4 5", "4 4 4", "4 4 5"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "b = a does not build a new list.",
      "a[:] does build a new list, and it does so after the first append.",
    ],
    solution:
      "1. b = a makes b another name for the same list, so b.append(4) leaves a single list [1, 2, 3, 4] of length 4 that both names see.\n2. c = a[:] takes a copy of that list as it stands, so c starts as [1, 2, 3, 4].\n3. c.append(5) affects only the copy, giving lengths 4, 4 and 5, printed as 4 4 5.\n\nAnswer: **4 4 5**.",
    approach:
      "Assignment binds a second name to the same object; slicing, list() or copy() build a new one. Knowing which of the two you have written decides whether a mutation is shared.",
    tags: ["python", "lists", "mutability"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-py-default-mutable-argument",
    topic: "programming-fundamentals",
    title: "A default argument that remembers",
    prompt: `What does this **Python** program print?

\`\`\`python
def add(item, target=[]):
    target.append(item)
    return target

print(add(1))
print(add(2))
\`\`\``,
    options: [
      "[1] and then [2]",
      "[1] and then [1, 2]",
      "[1] and then [1]",
      "[1, 2] and then [1, 2]",
    ],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Ask when the default value is created: once, or on every call?",
      "The same list object is reused, and append mutates it in place.",
    ],
    solution:
      "1. The default [] is evaluated once, when the def statement runs, and stored with the function.\n2. The first call appends 1 to that stored list and returns it, printing [1].\n3. The second call receives the very same list, which already holds 1, appends 2 and prints [1, 2], so the two lines are [1] and then [1, 2].\n\nAnswer: **[1] and then [1, 2]**.",
    approach:
      "Default arguments are evaluated once at definition time, so a mutable default is shared across every call. The standard remedy is target=None with target = [] inside the body.",
    tags: ["python", "functions", "mutability"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-py-string-methods-return-new",
    topic: "programming-fundamentals",
    title: "Python strings are immutable too",
    prompt: `What does this **Python** program print?

\`\`\`python
s = "python"
s.upper()
s.replace("p", "P")
print(s)
\`\`\``,
    options: ["python", "Python", "PYTHON", "The program raises an AttributeError"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Check whether either result is stored anywhere.",
      "No Python string method modifies the string it is called on.",
    ],
    solution:
      "1. upper and replace both return new strings and leave the original untouched, because str is immutable.\n2. Neither returned value is assigned, so both are discarded straight away.\n3. s still refers to the original object and python is printed.\n\nAnswer: **python**.",
    approach:
      "String methods in Python are pure functions dressed as methods. Only s = s.upper() changes what the name refers to, and even then the original object is unchanged.",
    tags: ["python", "strings", "immutability"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-py-repeated-list-multiplication",
    topic: "programming-fundamentals",
    title: "Building a grid with the repetition operator",
    prompt: `What does this **Python** program print?

\`\`\`python
a = [[0] * 3] * 2
a[0][0] = 7
print(a)
\`\`\``,
    options: [
      "[[7, 0, 0], [0, 0, 0]]",
      "[[7, 0, 0], [7, 0, 0]]",
      "[[7, 7, 7], [0, 0, 0]]",
      "[[7, 0, 0]]",
    ],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The outer multiplication copies references, not the inner list itself.",
      "Ask how many distinct list objects the expression actually creates.",
    ],
    solution:
      "1. [0] * 3 builds one inner list [0, 0, 0]; multiplying the outer list by 2 stores that same object twice.\n2. There is only one inner list, so writing a[0][0] = 7 is visible through both rows.\n3. The printed value is [[7, 0, 0], [7, 0, 0]].\n\nAnswer: **[[7, 0, 0], [7, 0, 0]]**.",
    approach:
      "The repetition operator duplicates references, which is harmless for immutable elements and treacherous for lists. A comprehension such as [[0] * 3 for _ in range(2)] builds genuinely separate rows.",
    tags: ["python", "lists", "aliasing"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-py-equality-vs-identity",
    topic: "programming-fundamentals",
    title: "Equality against identity",
    prompt: `What does this **Python** program print?

\`\`\`python
a = [1, 2]
b = [1, 2]
print(a == b, a is b)
\`\`\``,
    options: ["True True", "True False", "False True", "False False"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "== asks about contents; is asks about the object itself.",
      "Two separate list displays create two separate objects.",
    ],
    solution:
      "1. a and b hold the same elements, so a == b compares contents and is True.\n2. Each list display builds a fresh list object, so a and b are different objects and a is b is False.\n3. The line therefore prints True False.\n\nAnswer: **True False**.",
    approach:
      "is compares identity and == compares value. Reaching for is on anything other than None, True or False is almost always a mistake.",
    tags: ["python", "identity"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-py-string-slicing",
    topic: "programming-fundamentals",
    title: "Three slices of one string",
    prompt: `What does this **Python** program print?

\`\`\`python
s = "PLACEMENT"
print(s[2:6], s[::-1][:3], s[-3:])
\`\`\``,
    options: ["ACE TNE ENT", "ACEM ENT TNE", "ACEM TNE ENT", "LACE TNE ENT"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Indexing starts at 0 and the upper bound of a slice is excluded.",
      "A step of -1 reverses the string, and the slice that follows applies to the reversed copy.",
    ],
    solution:
      "1. The letters sit at indices 0 to 8: P L A C E M E N T. s[2:6] takes indices 2, 3, 4 and 5, which is ACEM.\n2. s[::-1] is TNEMECALP, and taking its first three characters gives TNE.\n3. s[-3:] counts back three from the end and runs to the end, giving ENT, so the line prints ACEM TNE ENT.\n\nAnswer: **ACEM TNE ENT**.",
    approach:
      "A slice s[i:j] contains j − i characters when both bounds are in range, which makes the length a quick sanity check. Chained slices are applied left to right, each one working on the result of the last.",
    tags: ["python", "strings", "slicing"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-py-for-else",
    topic: "programming-fundamentals",
    title: "The else clause of a for loop",
    prompt: `What does this **Python** program print?

\`\`\`python
for i in range(3, 8):
    if i % 4 == 0:
        break
else:
    print("none")
print(i)
\`\`\``,
    options: ["3", "4", "7", "none followed by 7"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "range(3, 8) yields 3, 4, 5, 6 and 7.",
      "The else clause of a loop runs only when the loop finishes without a break.",
    ],
    solution:
      "1. i takes the value 3 first, and 3 % 4 is 3, so the loop continues.\n2. i then takes the value 4, and 4 % 4 is 0, so break fires.\n3. Because the loop was broken out of, the else clause is skipped and none is never printed.\n4. The loop variable survives the loop and still holds 4, so the program prints 4.\n\nAnswer: **4**.",
    approach:
      "A loop else means 'no break happened', which reads better as a nobreak clause. The loop variable is not scoped to the loop in Python, so it remains available afterwards.",
    tags: ["python", "loops"],
    timeTargetSec: 105,
  },
  {
    slug: "pf-py-rebinding-a-parameter",
    topic: "programming-fundamentals",
    title: "Mutating against rebinding",
    prompt: `What does this **Python** program print?

\`\`\`python
def f(lst):
    lst.append(4)
    lst = [9, 9]
    lst.append(5)

a = [1, 2, 3]
f(a)
print(a)
\`\`\``,
    options: ["[1, 2, 3]", "[1, 2, 3, 4]", "[1, 2, 3, 4, 5]", "[9, 9, 5]"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Only the statements executed before the reassignment can affect the caller's list.",
      "lst = [9, 9] does not empty anything; it points the local name somewhere new.",
    ],
    solution:
      "1. lst starts out referring to the caller's list, so lst.append(4) makes that list [1, 2, 3, 4].\n2. lst = [9, 9] rebinds the local name to a brand new list, breaking the link to the caller's object.\n3. The final append therefore lands on the new list, which is discarded when f returns, so a prints as [1, 2, 3, 4].\n\nAnswer: **[1, 2, 3, 4]**.",
    approach:
      "Python passes references by value: mutating the object is visible to the caller, rebinding the name is not. The dividing line is the assignment statement in the middle.",
    tags: ["python", "functions", "mutability"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-py-local-shadows-global",
    topic: "programming-fundamentals",
    title: "Assignment makes a name local",
    prompt: `What does this **Python** program print?

\`\`\`python
x = 10

def f():
    x = 20
    return x

print(f(), x)
\`\`\``,
    options: ["10 10", "20 10", "20 20", "The program raises an UnboundLocalError"],
    answer: 1,
    difficulty: "easy",
    hints: [
      "An assignment anywhere in a function makes that name local for the whole function.",
      "There is no global statement here, so the module-level x is never touched.",
    ],
    solution:
      "1. Because f assigns to x, x is a local name inside f, entirely separate from the module-level x.\n2. f sets its local x to 20 and returns it, so the first value printed is 20.\n3. The module-level x was never reassigned, so the second value printed is 10 and the line reads 20 10.\n\nAnswer: **20 10**.",
    approach:
      "Python decides scope by looking for assignments, not by looking at what already exists. Changing a global from inside a function requires the global keyword; without it you simply create a local.",
    tags: ["python", "scope"],
    timeTargetSec: 60,
  },
  {
    slug: "pf-py-comprehension-and-generator",
    topic: "programming-fundamentals",
    title: "A generator and a comprehension in one line",
    prompt: `What does this **Python** program print?

\`\`\`python
nums = [1, 2, 3, 4, 5, 6]
print(sum(n for n in nums if n % 2 == 0), [n * 2 for n in nums][2])
\`\`\``,
    options: ["9 6", "12 3", "12 6", "21 6"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Deal with the two arguments of print separately.",
      "The comprehension is built in full first, and only then is it indexed.",
    ],
    solution:
      "1. The generator keeps the even numbers 2, 4 and 6, and sum returns 2 + 4 + 6 = 12.\n2. The comprehension doubles every element, giving [2, 4, 6, 8, 10, 12].\n3. Index 2 of that list is its third element, 6, so the line prints 12 6.\n\nAnswer: **12 6**.",
    approach:
      "A filtered generator inside sum is the idiomatic conditional total, and a comprehension produces a full list that can be indexed like any other. Zero-based indexing is what makes the second value 6 rather than 4.",
    tags: ["python", "comprehensions"],
    timeTargetSec: 90,
  },
  {
    slug: "pf-py-short-circuit-no-call",
    topic: "programming-fundamentals",
    title: "Short-circuiting past a function call",
    prompt: `What does this **Python** program print?

\`\`\`python
def g():
    print("g", end=" ")
    return True

x = False and g()
y = True or g()
print(x, y)
\`\`\``,
    options: ["False True", "g False True", "g g False True", "True True"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Decide for each line whether the right-hand operand is ever reached.",
      "and stops on a false left operand; or stops on a true one.",
    ],
    solution:
      "1. In False and g() the left operand is already false, so the result is settled and g is never called.\n2. In True or g() the left operand is already true, so again g is never called.\n3. No g is printed, and the final line prints the two stored values as False True.\n\nAnswer: **False True**.",
    approach:
      "Both boolean operators return the operand that decided the result and skip the rest, so any side effect on the right may never occur. Here that means the function body never runs at all.",
    tags: ["python", "short circuit"],
    timeTargetSec: 90,
  },
];

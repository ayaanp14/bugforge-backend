import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

const IO = String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        // TODO
        System.out.print(out);
    }
}
`;

export default defineModule(import.meta.url, {
  slug: "control",
  title: "Control flow",
  blurb: "if/else and guard clauses, every form of switch, the four loops, break/continue/labels, and the loop patterns programs are made of.",
  icon: "branch",
  overview: `Control flow is where a program stops being a list of statements and starts making decisions and repeating work. Java's constructs are C's, tightened: conditions must be booleans, switch grew an arrow form and became an expression, and labels replace goto.

This module covers each construct precisely — the dangling else, fall-through, exhaustiveness, loop variable scope, what break does inside a switch — and then the conventions that make control flow readable: guard clauses, early return, and the dozen loop patterns (accumulate, count, find, all/any, best-so-far, two pointers, sliding window) that most code is assembled from.

By the end you write loops without off-by-one errors, choose switch expressions where they fit, and exit nested loops cleanly.`,
  lessons: [
    {
      slug: "if-else",
      file: "01-if-else.md",
      exercises: [
        {
          title: "Grades with guard clauses",
          prompt: `Read an integer \`n\`, then \`n\` integer scores. For each score print its letter: \`A\` for 90–100, \`B\` for 80–89, \`C\` for 70–79, \`D\` for 60–69, \`F\` for 0–59. A score below 0 or above 100 is \`invalid\`.

Write a method \`static String grade(int score)\` that handles the invalid case with a **guard clause** first and then an \`else if\` chain (or early returns) from the highest band down.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n\` lines.`,
          starter: String.raw`import java.util.*;

public class Main {
    static String grade(int score) {
        // TODO: guard clause for out-of-range, then the bands from the top
        return "";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println(grade(in.nextInt()));
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static String grade(int score) {
        if (score < 0 || score > 100) return "invalid";
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "F";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println(grade(in.nextInt()));
        }
    }
}
`,
          hints: ["Test the invalid range first, then the bands from highest to lowest so each test can be a single >=.", "Every path must return — the final return is the F band."],
          cases: [
            { stdin: "6\n95 80 79 60 59 101\n", expected: "A\nB\nC\nD\nF\ninvalid\n" },
            { stdin: "3\n0 100 -1\n", expected: "F\nA\ninvalid\n" },
            { stdin: "2\n89 90\n", expected: "B\nA\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`int x = 3; if (x) { … }` — what happens?",
          options: ["Runs the block because 3 is non-zero", "Compile error: an `int` is not a `boolean`", "Runs the block only if x == 1", "Throws at run time"],
          answer: 1,
          explanation: "Java conditions must be booleans; nothing converts to one implicitly. Write `if (x != 0)`.",
        },
        {
          prompt: "In `if (a) if (b) x(); else y();` — which `if` does the `else` belong to?",
          options: ["`if (a)`", "`if (b)` — the nearest unmatched `if`", "Both", "It is a compile error"],
          answer: 1,
          explanation: "The dangling-else rule binds an `else` to the closest `if` without one, regardless of indentation. Braces make the intent unambiguous.",
        },
        {
          prompt: "Which is the null-safe way to test `name` against `\"admin\"`?",
          options: ["`name == \"admin\"`", "`name.equals(\"admin\")`", "`\"admin\".equals(name)`", "`name.compareTo(\"admin\")`"],
          answer: 2,
          explanation: "Calling `equals` on the literal never throws when `name` is null; the other forms either compare references or dereference `name`.",
        },
        {
          prompt: "`boolean flag = false; if (flag = true) { … }` — result?",
          options: ["Compile error", "The block always runs: the assignment yields `true`", "The block never runs", "`flag` stays false"],
          answer: 1,
          explanation: "An assignment expression has the assigned value, and since it is a `boolean` the `if` accepts it. This is the classic typo for `==`; write `if (flag)`.",
        },
        {
          prompt: "What is a guard clause?",
          options: ["An `else` at the end of every chain", "An early `return`/`throw` at the top of a method that handles an exceptional case so the main logic is not nested", "A `try` block", "A `switch` default"],
          answer: 1,
          explanation: "Guard clauses invert the condition and leave immediately, keeping the happy path flat and readable.",
        },
      ],
    },
    {
      slug: "switch",
      file: "02-switch.md",
      exercises: [
        {
          title: "Days in a month",
          prompt: `Read an integer \`n\`, then \`n\` lines each with a month number (1–12) and a year. Print the number of days in that month, using a **switch expression** over the month with a \`default\` that throws for an invalid month. February has 29 days in a leap year (divisible by 4, except centuries unless divisible by 400) and 28 otherwise.

**Input:** \`n\`, then \`n\` lines \`month year\`.
**Output:** \`n\` lines.

Example: \`2 2024\` → \`29\`; \`2 1900\` → \`28\`; \`4 2023\` → \`30\`.`,
          starter: String.raw`import java.util.*;

public class Main {
    static boolean isLeap(int year) {
        // TODO
        return false;
    }

    static int daysIn(int month, int year) {
        return switch (month) {
            // TODO: case 2 -> ...; case 4, 6, 9, 11 -> ...; default -> ...
            default -> throw new IllegalArgumentException("month " + month);
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println(daysIn(in.nextInt(), in.nextInt()));
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static boolean isLeap(int year) {
        return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    }

    static int daysIn(int month, int year) {
        return switch (month) {
            case 2 -> isLeap(year) ? 29 : 28;
            case 4, 6, 9, 11 -> 30;
            case 1, 3, 5, 7, 8, 10, 12 -> 31;
            default -> throw new IllegalArgumentException("month " + month);
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println(daysIn(in.nextInt(), in.nextInt()));
        }
    }
}
`,
          hints: ["Leap: divisible by 4 and not by 100, or divisible by 400.", "Comma-separated labels share one arrow branch."],
          cases: [
            { stdin: "3\n2 2024\n2 1900\n4 2023\n", expected: "29\n28\n30\n" },
            { stdin: "4\n2 2000\n2 2100\n1 2023\n12 1999\n", expected: "29\n28\n31\n31\n" },
            { stdin: "2\n6 2023\n2 2023\n", expected: "30\n28\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a classic (colon) switch, what happens when a case has no `break`?",
          options: ["Compile error", "Execution falls through into the next case's statements", "The switch exits", "The default runs"],
          answer: 1,
          explanation: "Fall-through is the C legacy: control continues downward until a `break`. Arrow cases (`->`) never fall through.",
        },
        {
          prompt: "Which selector type is **not** allowed in a Java 17 switch?",
          options: ["`String`", "`char`", "`long`", "An enum"],
          answer: 2,
          explanation: "`long`, `boolean`, `float` and `double` cannot be switched on. Integral types up to `int`, their wrappers, `char`, `String` and enums can.",
        },
        {
          prompt: "A switch *expression* over an `int` with no `default` — what happens?",
          options: ["It compiles and yields 0 for unmatched values", "Compile error: a switch expression must be exhaustive", "Runtime exception", "It yields `null`"],
          answer: 1,
          explanation: "The compiler requires every possible value to produce a result. For an enum, covering all constants suffices; for `int` or `String`, a `default` is required.",
        },
        {
          prompt: "Inside a block in a switch-expression branch, how do you produce the branch's value?",
          options: ["`return value;`", "`yield value;`", "`break value;`", "`value;`"],
          answer: 1,
          explanation: "`yield` hands the value out of the block to the switch. `return` would return from the enclosing method.",
        },
        {
          prompt: "`String s = null; switch (s) { case \"a\" -> …; default -> …; }` does what?",
          options: ["Runs the default", "Throws `NullPointerException`", "Matches nothing and continues", "Compile error"],
          answer: 1,
          explanation: "A `String` switch calls `hashCode()` on the selector first. Only Java 21's `case null` handles it inside the switch.",
        },
      ],
    },
    {
      slug: "loops",
      file: "03-loops.md",
      exercises: [
        {
          title: "Collatz steps",
          prompt: `Read an integer \`n\`, then \`n\` positive integers. For each starting value \`x\`, repeatedly apply: if \`x\` is even, \`x = x / 2\`; otherwise \`x = 3x + 1\` — until \`x\` becomes 1. Print \`steps=<count> peak=<largest value seen, including the start>\`.

Use a \`while\` loop, and a \`long\` for \`x\` — intermediate values can exceed \`int\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n\` lines.

Example: \`27\` → \`steps=111 peak=9232\`; \`1\` → \`steps=0 peak=1\`.`,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            long x = in.nextLong();
            long peak = x;
            int steps = 0;
            while (x != 1) {
                x = (x % 2 == 0) ? x / 2 : 3 * x + 1;
                if (x > peak) peak = x;
                steps++;
            }
            out.append("steps=").append(steps).append(" peak=").append(peak).append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["while (x != 1) — the body may run zero times, which is right for x = 1.", "Track the peak inside the loop after each step."],
          cases: [
            { stdin: "3\n27 1 6\n", expected: "steps=111 peak=9232\nsteps=0 peak=1\nsteps=8 peak=16\n" },
            { stdin: "2\n97 2\n", expected: "steps=118 peak=9232\nsteps=1 peak=2\n" },
            { stdin: "1\n837799\n", expected: "steps=524 peak=2974984576\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many times does the body of `for (int i = 0; i <= n; i++)` run?",
          options: ["`n`", "`n + 1`", "`n - 1`", "Infinite"],
          answer: 1,
          explanation: "Indices 0 through n inclusive is n + 1 iterations. The half-open `i < n` runs exactly n times.",
        },
        {
          prompt: "What is true of `do { … } while (cond);`?",
          options: ["The body may run zero times", "The body runs at least once; the condition is checked after it", "It is identical to `while`", "It needs no semicolon"],
          answer: 1,
          explanation: "The check comes after the body, so one iteration is guaranteed. The trailing semicolon is required.",
        },
        {
          prompt: "`for (int v : arr) v = 0;` — effect on `arr`?",
          options: ["Every element becomes 0", "None: `v` is a copy of each element", "Compile error", "Only the first element changes"],
          answer: 1,
          explanation: "The enhanced for loop hands you the element's value (or reference), not a slot in the array. To modify, use an index loop.",
        },
        {
          prompt: "After `for (int i = 0; i < 3; i++) {}`, what is `i`?",
          options: ["3", "2", "0", "Not accessible — `i` is scoped to the loop"],
          answer: 3,
          explanation: "A variable declared in the `for` header lives only inside the loop. Declare it before the loop if you need its final value.",
        },
        {
          prompt: "Removing an element with `list.remove(x)` inside `for (X x : list)` typically causes…",
          options: ["Nothing unusual", "`ConcurrentModificationException`", "A compile error", "The loop to restart"],
          answer: 1,
          explanation: "Structural modification during for-each iteration is detected by the iterator. Use `Iterator.remove`, `removeIf`, or an index loop.",
        },
      ],
    },
    {
      slug: "break-continue-labels",
      file: "04-break-continue-labels.md",
      exercises: [
        {
          title: "Read until END",
          prompt: `Read lines until a line that is exactly \`END\` (or until input runs out). Skip blank lines and lines that start with \`#\` (after trimming). Print every other line numbered from 1 as \`<k>: <line>\`, then a final line \`skipped=<count of skipped lines>\`.

Use \`break\` for \`END\` and \`continue\` for the skipped lines.

Example input:
\`\`\`
alpha
# comment

beta
END
gamma
\`\`\`
Output:
\`\`\`
1: alpha
2: beta
skipped=2
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        int k = 0, skipped = 0;
        String line;
        while ((line = br.readLine()) != null) {
            String t = line.trim();
            if (t.equals("END")) break;
            if (t.isEmpty() || t.startsWith("#")) {
                skipped++;
                continue;
            }
            k++;
            out.append(k).append(": ").append(t).append('\n');
        }
        out.append("skipped=").append(skipped).append('\n');
        System.out.print(out);
    }
}
`,
          hints: ["Test END before the skip conditions, so END is not counted as skipped.", "The (line = br.readLine()) != null idiom handles input running out."],
          cases: [
            { stdin: "alpha\n# comment\n\nbeta\nEND\ngamma\n", expected: "1: alpha\n2: beta\nskipped=2\n" },
            { stdin: "one\ntwo\n", expected: "1: one\n2: two\nskipped=0\n" },
            { stdin: "#only\n\n\nEND\n", expected: "skipped=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A `break` inside a `switch` that is inside a `while` loop…",
          options: ["Exits the loop", "Exits the switch only", "Exits both", "Is a compile error"],
          answer: 1,
          explanation: "`break` targets the innermost enclosing switch or loop — here the switch. Use a labelled break or a flag to leave the loop.",
        },
        {
          prompt: "`continue` inside a `for` loop causes…",
          options: ["The loop to exit", "The rest of the body to be skipped, then the update and condition run", "The condition to be skipped", "The update to be skipped"],
          answer: 1,
          explanation: "In a `for`, `continue` jumps to the update expression, then re-checks the condition. In a `while` it goes straight to the condition — which is why a `while` with a bottom increment can loop forever.",
        },
        {
          prompt: "How do you exit an outer loop from inside an inner loop?",
          options: ["`break break;`", "A labelled `break outer;`", "`exit(outer)`", "It is impossible without a flag"],
          answer: 1,
          explanation: "Label the outer loop (`outer:`) and write `break outer;`. Moving the loops into a method and using `return` is the other clean option.",
        },
        {
          prompt: "`for (…) { return x; System.out.println(\"done\"); }` — the compiler says…",
          options: ["Nothing", "Warning only", "Error: unreachable statement", "Error: missing return"],
          answer: 2,
          explanation: "Java rejects statements it can prove unreachable, such as anything after an unconditional `return`, `break`, `continue` or `throw`.",
        },
        {
          prompt: "Which is the cleanest way to search for a value in a nested structure?",
          options: ["A `found` flag tested in every loop condition", "Nested loops in a method that `return`s on the first hit", "`System.exit` on the first hit", "Catching an exception"],
          answer: 1,
          explanation: "A method that returns the answer where it is found needs no flag and no labels, and its \"not found\" value is the final `return`.",
        },
      ],
    },
    {
      slug: "loop-patterns",
      file: "05-loop-patterns.md",
      exercises: [
        {
          title: "Four patterns, one pass each",
          prompt: `Read integers \`n\` and \`k\` (1 ≤ k ≤ n), then \`n\` integers. Print four lines:

1. \`max=<largest value> at=<index of its FIRST occurrence>\`
2. \`run=<length of the longest non-decreasing run>\` (consecutive elements where each is ≥ the previous)
3. \`window=<largest sum of k consecutive elements>\`
4. \`allPositive=<true|false>\`

Seed the max from the first element, not from 0.

Example: \`6 2\` then \`3 -1 4 4 5 2\` →
\`\`\`
max=5 at=4
run=4
window=9
allPositive=false
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String[] t = new String(System.in.readAllBytes()).trim().split("\\s+");
        int n = Integer.parseInt(t[0]);
        int k = Integer.parseInt(t[1]);
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = Long.parseLong(t[2 + i]);

        long max = a[0];
        int at = 0;
        for (int i = 1; i < n; i++) {
            if (a[i] > max) { max = a[i]; at = i; }
        }

        int run = 1, best = 1;
        for (int i = 1; i < n; i++) {
            run = a[i] >= a[i - 1] ? run + 1 : 1;
            if (run > best) best = run;
        }

        long window = 0, sum = 0;
        for (int i = 0; i < n; i++) {
            sum += a[i];
            if (i >= k) sum -= a[i - k];
            if (i == k - 1 || (i >= k && sum > window)) window = sum;
        }

        boolean allPositive = true;
        for (int i = 0; i < n; i++) {
            if (a[i] <= 0) { allPositive = false; break; }
        }

        System.out.println("max=" + max + " at=" + at);
        System.out.println("run=" + best);
        System.out.println("window=" + window);
        System.out.println("allPositive=" + allPositive);
    }
}
`,
          hints: ["Strict > keeps the first occurrence of the maximum.", "For the window: add a[i], subtract a[i-k] once i >= k, and record the sum from i == k-1 onward.", "allPositive starts true and looks for a counterexample."],
          cases: [
            { stdin: "6 2\n3 -1 4 4 5 2\n", expected: "max=5 at=4\nrun=4\nwindow=9\nallPositive=false\n" },
            { stdin: "5 5\n1 2 3 4 5\n", expected: "max=5 at=4\nrun=5\nwindow=15\nallPositive=true\n" },
            { stdin: "4 1\n-5 -5 -9 -1\n", expected: "max=-1 at=3\nrun=2\nwindow=-1\nallPositive=false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why must a maximum not be seeded with 0?",
          options: ["0 is not an `int`", "An input of all negative numbers would report 0 as the maximum", "The loop would not terminate", "It must be seeded with `null`"],
          answer: 1,
          explanation: "Seed from the first element or from `Integer.MIN_VALUE` so the first comparison always replaces the seed.",
        },
        {
          prompt: "An `allPositive` loop over an **empty** array yields…",
          options: ["`false`", "`true` — no counterexample exists", "An exception", "Undefined"],
          answer: 1,
          explanation: "`all` starts true and looks for a counterexample; with no elements there is none. `any` over an empty array is false for the same reason.",
        },
        {
          prompt: "To visit each unordered pair `(i, j)` exactly once, the inner loop starts at…",
          options: ["`j = 0`", "`j = i`", "`j = i + 1`", "`j = n - 1`"],
          answer: 2,
          explanation: "`j = i + 1` skips self-pairs and each pair's mirror image. `j = i` includes the diagonal; `j = 0` visits ordered pairs.",
        },
        {
          prompt: "Why are the parentheses in `while ((line = br.readLine()) != null)` required?",
          options: ["They are optional", "`!=` binds tighter than `=`; without them `line` would be assigned a boolean, a type error", "For readability only", "`readLine` needs them"],
          answer: 1,
          explanation: "Without parentheses the expression parses as `line = (br.readLine() != null)`, assigning a `boolean` to a `String`.",
        },
        {
          prompt: "In a fixed-size sliding window of width k, moving one step right means…",
          options: ["Re-summing all k elements", "Adding the incoming element and subtracting the one that left", "Sorting the window", "Resetting the sum"],
          answer: 1,
          explanation: "That is what makes the window O(n) overall instead of O(n·k).",
        },
      ],
    },
    {
      slug: "control-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Grid search",
          prompt: `Read integers \`R\`, \`C\` and \`target\`, then an \`R × C\` grid of integers (row by row). Scanning row-major (row 0 left to right, then row 1, …), print \`found <row> <col>\` for the **first** cell equal to \`target\`, or \`not found\`. Leave both loops as soon as the cell is found — with a labelled \`break\`, or by putting the loops in a method that returns.

Example: \`2 3 7\` then \`1 2 3\` / \`7 8 7\` → \`found 1 0\`.`,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt(), target = in.nextInt();
        int[][] grid = new int[r][c];
        for (int i = 0; i < r; i++)
            for (int j = 0; j < c; j++)
                grid[i][j] = in.nextInt();

        int foundRow = -1, foundCol = -1;
        search:
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (grid[i][j] == target) {
                    foundRow = i;
                    foundCol = j;
                    break search;
                }
            }
        }
        System.out.println(foundRow == -1 ? "not found" : "found " + foundRow + " " + foundCol);
    }
}
`,
          hints: ["Label the outer loop and `break label;` from the inner one.", "-1 as the not-found sentinel works because indices are never negative."],
          cases: [
            { stdin: "2 3 7\n1 2 3\n7 8 7\n", expected: "found 1 0\n" },
            { stdin: "2 2 9\n1 2\n3 4\n", expected: "not found\n" },
            { stdin: "3 3 5\n5 5 5\n5 5 5\n5 5 5\n", expected: "found 0 0\n", hidden: true },
            { stdin: "1 4 4\n1 2 3 4\n", expected: "found 0 3\n", hidden: true },
          ],
        },
        {
          title: "Opening hours",
          prompt: `A shop is open Monday–Friday from 9 to 17 (an hour \`h\` counts as open when 9 ≤ h < 17), Saturday from 10 to 14, and closed on Sunday. Read an integer \`n\`, then \`n\` lines each with a day name (any letter case) and an hour (0–23). Print \`open\`, \`closed\`, or \`unknown day\` for a name that is not a weekday.

Use a **switch expression** on the lower-cased day name; use blocks with \`yield\` where a branch needs an \`if\`.

Example: \`monday 9\` → \`open\`; \`Saturday 14\` → \`closed\`; \`funday 12\` → \`unknown day\`.`,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String status(String day, int h) {
        return switch (day.toLowerCase(Locale.ROOT)) {
            case "monday", "tuesday", "wednesday", "thursday", "friday" -> (h >= 9 && h < 17) ? "open" : "closed";
            case "saturday" -> {
                boolean open = h >= 10 && h < 14;
                yield open ? "open" : "closed";
            }
            case "sunday" -> "closed";
            default -> "unknown day";
        };
    }

    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            String day = in.next();
            int h = in.nextInt();
            out.append(status(day, h)).append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["Lower-case with Locale.ROOT before switching.", "A block branch ends with yield, not return."],
          cases: [
            { stdin: "4\nmonday 9\nSaturday 14\nfunday 12\nSUNDAY 11\n", expected: "open\nclosed\nunknown day\nclosed\n" },
            { stdin: "3\nfriday 16\nfriday 17\nsaturday 10\n", expected: "open\nclosed\nopen\n" },
            { stdin: "2\nTuesday 8\nsat 12\n", expected: "closed\nunknown day\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these compiles?",
          options: ["`if (count) …`", "`if (name) …`", "`if (list.isEmpty()) …`", "`if (x = 5) …`"],
          answer: 2,
          explanation: "Only a boolean expression is accepted. `isEmpty()` returns one; the others are `int`, `String`, and an `int` assignment.",
        },
        {
          prompt: "Guard clauses are used to…",
          options: ["Catch exceptions", "Handle exceptional cases first with early returns, flattening the main path", "Lock resources", "Replace loops"],
          answer: 1,
          explanation: "Each guard states a precondition and leaves; what remains is the normal case with no nesting.",
        },
        {
          prompt: "Which switch form has no fall-through?",
          options: ["The colon form", "The arrow form", "Both", "Neither"],
          answer: 1,
          explanation: "`case … ->` runs exactly one branch. The colon form continues into the next case unless it hits `break`.",
        },
        {
          prompt: "A switch expression over an enum that lists **every** constant and has no `default`…",
          options: ["Is a compile error", "Compiles; adding a new constant later makes it a compile error, which is useful", "Compiles and yields `null` for new constants", "Needs `yield`"],
          answer: 1,
          explanation: "Exhaustiveness over an enum is satisfied by covering all constants. Omitting `default` makes the compiler flag every switch when a constant is added.",
        },
        {
          prompt: "`while (i < n)` with `i` incremented at the *bottom* of the body and a `continue` in the middle can…",
          options: ["Skip the increment and loop forever", "Increment twice", "Exit early", "Not compile"],
          answer: 0,
          explanation: "`continue` jumps to the condition, bypassing the increment. A `for` loop's update runs on `continue`, which avoids this.",
        },
        {
          prompt: "How many iterations does `for (int i = 10; i > 0; i -= 3)` perform?",
          options: ["3", "4", "5", "Infinite"],
          answer: 1,
          explanation: "i takes 10, 7, 4, 1 — four values above 0 — then becomes −2 and stops.",
        },
        {
          prompt: "`for (String s : list) { list.add(\"x\"); }` — most likely result?",
          options: ["Infinite growth", "`ConcurrentModificationException`", "Compile error", "Adds one element"],
          answer: 1,
          explanation: "Adding during for-each iteration is a structural modification; the iterator detects it on the next step.",
        },
        {
          prompt: "What does `break` do in an arrow-form switch **statement** inside a loop?",
          options: ["Leaves the loop", "Leaves the switch statement", "Is a compile error", "Restarts the switch"],
          answer: 1,
          explanation: "The switch is still the innermost breakable statement. To leave the loop, use a label or a flag.",
        },
        {
          prompt: "An `anyNegative` search should be seeded with…",
          options: ["`true`", "`false`, and set to `true` on the first negative (then break)", "`null`", "The first element"],
          answer: 1,
          explanation: "`any` looks for a witness. It starts false and becomes true at the first match; over an empty input it stays false.",
        },
        {
          prompt: "Comparing each element with its predecessor, the loop should…",
          options: ["Start at 0 and read `arr[i - 1]`", "Start at 1 after seeding `prev` from `arr[0]`", "Start at `n`", "Use a `do-while`"],
          answer: 1,
          explanation: "Reading `arr[i - 1]` at `i = 0` is out of bounds. Handle an empty array, seed from index 0, iterate from 1.",
        },
        {
          prompt: "`int x = 5; String r = switch (x) { case 5 -> \"five\"; };` — result?",
          options: ["`r` is \"five\"", "Compile error: not exhaustive", "`r` is null", "Runtime error"],
          answer: 1,
          explanation: "A switch expression over an `int` must have a `default`; the compiler cannot know 5 is the only value.",
        },
        {
          prompt: "The compiler reports \"unreachable statement\" for code placed…",
          options: ["After an `if (false)`", "Directly after `break`, `continue`, `return` or `throw` in the same block", "Inside a `default` branch", "Before a label"],
          answer: 1,
          explanation: "Statements the compiler can prove will never execute are errors. `if (false)` is deliberately exempt for conditional compilation.",
        },
      ],
    },
  ],
}, more);

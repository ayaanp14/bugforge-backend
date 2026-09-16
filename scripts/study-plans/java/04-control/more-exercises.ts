import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "if-else": [
    {
      title: "Ticket pricing",
      prompt: `Read an integer \`n\` and \`n\` lines \`<age> <day> <member>\` where \`day\` is a weekday name and \`member\` is \`y\` or \`n\`. The base price is 12; under-12s pay 6 and people 65 or older pay 8 (check the child rule first). On \`Tuesday\` every ticket is 2 cheaper (never below 0). Members then get 10% off, rounded to the nearest whole number with \`Math.round\`. Print one price per line. Write it as a chain of guard clauses, not nested ifs.

Example: \`3\` then \`30 Monday n\`, \`8 Tuesday y\`, \`70 Friday y\` →
\`\`\`
12
4
7
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static long price(int age, String day, boolean member) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int age = in.nextInt();
            String day = in.next();
            boolean member = in.next().equals("y");
            System.out.println(price(age, day, member));
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static long price(int age, String day, boolean member) {
        int base = 12;
        if (age < 12) base = 6;
        else if (age >= 65) base = 8;
        if (day.equals("Tuesday")) base = Math.max(0, base - 2);
        if (!member) return base;
        return Math.round(base * 0.9);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int age = in.nextInt();
            String day = in.next();
            boolean member = in.next().equals("y");
            System.out.println(price(age, day, member));
        }
    }
}
`,
      hints: ["Decide the base first, then apply the day, then the membership — three independent steps.", "Math.round(double) returns a long; 4 * 0.9 = 3.6 rounds to 4, 6 * 0.9 = 5.4 rounds to 5."],
      cases: [
        { stdin: "3\n30 Monday n\n8 Tuesday y\n70 Friday y\n", expected: "12\n4\n7\n" },
        { stdin: "2\n12 Tuesday n\n65 Tuesday y\n", expected: "10\n5\n" },
        { stdin: "3\n5 Tuesday n\n40 Tuesday y\n11 Sunday y\n", expected: "4\n9\n5\n", hidden: true },
      ],
    },
  ],
  switch: [
    {
      title: "A calculator with switch",
      prompt: `Read an integer \`n\` and \`n\` lines \`<a> <op> <b>\` with \`long\` operands. Compute with a \`switch\` **expression** over the operator: \`+\`, \`-\`, \`*\`, \`/\` (integer division), \`%\`, and \`^\` meaning \`a\` to the power \`b\` (\`b ≥ 0\`, use a loop). Print the result, or \`error: division by zero\` for \`/\` and \`%\` with \`b = 0\`, or \`error: unknown operator <op>\`.

Example: \`4\` then \`7 / 2\`, \`2 ^ 10\`, \`5 % 0\`, \`3 ? 4\` →
\`\`\`
3
1024
error: division by zero
error: unknown operator ?
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong();
            String op = in.next();
            long b = in.nextLong();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static long power(long a, long b) {
        long r = 1;
        for (long i = 0; i < b; i++) r *= a;
        return r;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong();
            String op = in.next();
            long b = in.nextLong();
            if ((op.equals("/") || op.equals("%")) && b == 0) {
                System.out.println("error: division by zero");
                continue;
            }
            String out = switch (op) {
                case "+" -> String.valueOf(a + b);
                case "-" -> String.valueOf(a - b);
                case "*" -> String.valueOf(a * b);
                case "/" -> String.valueOf(a / b);
                case "%" -> String.valueOf(a % b);
                case "^" -> String.valueOf(power(a, b));
                default -> "error: unknown operator " + op;
            };
            System.out.println(out);
        }
    }
}
`,
      hints: ["Handle the zero divisor before the switch so the arithmetic arms stay one line each.", "A switch expression must produce a value on every arm — default covers the unknown operator."],
      cases: [
        { stdin: "4\n7 / 2\n2 ^ 10\n5 % 0\n3 ? 4\n", expected: "3\n1024\nerror: division by zero\nerror: unknown operator ?\n" },
        { stdin: "3\n-7 / 2\n-7 % 3\n3 ^ 0\n", expected: "-3\n-1\n1\n" },
        { stdin: "3\n1000000 * 1000000\n10 - 20\n0 / 5\n", expected: "1000000000000\n-10\n0\n", hidden: true },
      ],
    },
  ],
  loops: [
    {
      title: "Multiplication grid",
      prompt: `Read an integer \`n\` (\`1 ≤ n ≤ 12\`). Print the \`n × n\` multiplication table with every cell right-aligned in 4 characters (\`%4d\`, no trailing separator), then \`diagonal=<sum of i*i for i in 1..n>\` and \`total=<sum of every cell>\`. Nested \`for\` loops, one \`printf\` per cell, one \`println\` per row.

Example: \`3\` →
\`\`\`
   1   2   3
   2   4   6
   3   6   9
diagonal=14
total=36
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        long diagonal = 0, total = 0;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                System.out.printf("%4d", i * j);
                total += i * j;
                if (i == j) diagonal += i * j;
            }
            System.out.println();
        }
        System.out.println("diagonal=" + diagonal);
        System.out.println("total=" + total);
    }
}
`,
      hints: ["The outer loop is the row, the inner the column; println() after the inner loop ends the row.", "The total of an n×n table is (1+2+…+n)² — a handy check."],
      cases: [
        { stdin: "3\n", expected: "   1   2   3\n   2   4   6\n   3   6   9\ndiagonal=14\ntotal=36\n" },
        { stdin: "1\n", expected: "   1\ndiagonal=1\ntotal=1\n" },
        { stdin: "4\n", expected: "   1   2   3   4\n   2   4   6   8\n   3   6   9  12\n   4   8  12  16\ndiagonal=30\ntotal=100\n", hidden: true },
      ],
    },
  ],
  "break-continue-labels": [
    {
      title: "First repeat in a grid",
      prompt: `Read \`r\` and \`c\` and an \`r × c\` grid of integers. Scanning row by row, left to right, find the **first cell whose value has already appeared** and print \`repeat <value> at (<row>,<col>)\` (0-based), leaving both loops with a **labelled \`break\`** the moment it is found; print \`none\` if every value is distinct. Then print \`scanned=<how many cells were examined>\`.

Example: \`2 3\` then \`1 2 3\` / \`4 2 5\` →
\`\`\`
repeat 2 at (1,1)
scanned=5
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] g = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) g[i][j] = in.nextInt();
        Set<Integer> seen = new HashSet<>();
        int scanned = 0;
        // TODO: labelled loops
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] g = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) g[i][j] = in.nextInt();
        Set<Integer> seen = new HashSet<>();
        int scanned = 0;
        String found = "none";
        search:
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                scanned++;
                if (!seen.add(g[i][j])) {
                    found = "repeat " + g[i][j] + " at (" + i + "," + j + ")";
                    break search;
                }
            }
        }
        System.out.println(found);
        System.out.println("scanned=" + scanned);
    }
}
`,
      hints: ["Set.add returns false when the element was already present — one call tests and records.", "break search; leaves the labelled outer loop, not just the inner one."],
      cases: [
        { stdin: "2 3\n1 2 3\n4 2 5\n", expected: "repeat 2 at (1,1)\nscanned=5\n" },
        { stdin: "2 2\n1 2\n3 4\n", expected: "none\nscanned=4\n" },
        { stdin: "3 1\n7\n7\n7\n", expected: "repeat 7 at (1,0)\nscanned=2\n", hidden: true },
      ],
    },
  ],
  "loop-patterns": [
    {
      title: "Runs, searches and thresholds",
      prompt: `Read an integer \`n\`, \`n\` integers, and a threshold \`t\`. Print three lines, each one loop pattern:

- \`run: value <v> length <k>\` — the longest run of equal adjacent values (the first such run on ties).
- \`firstNegative: <index or -1>\` — a search with early exit.
- \`untilOver: <k>\` — how many elements, from the start, are needed before the running sum exceeds \`t\` (\`n\` if it never does).

Example: \`7\` then \`3 3 -1 5 5 5 2\` then \`10\` →
\`\`\`
run: value 5 length 3
firstNegative: 2
untilOver: 5
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int t = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int t = in.nextInt();

        int bestValue = a[0], bestLen = 1, curLen = 1;
        for (int i = 1; i < n; i++) {
            curLen = a[i] == a[i - 1] ? curLen + 1 : 1;
            if (curLen > bestLen) { bestLen = curLen; bestValue = a[i]; }
        }
        System.out.println("run: value " + bestValue + " length " + bestLen);

        int firstNegative = -1;
        for (int i = 0; i < n; i++) {
            if (a[i] < 0) { firstNegative = i; break; }
        }
        System.out.println("firstNegative: " + firstNegative);

        long sum = 0;
        int k = 0;
        while (k < n && sum <= t) sum += a[k++];
        System.out.println("untilOver: " + (sum > t ? k : n));
    }
}
`,
      hints: ["Track the current run length and reset it to 1 when the value changes; update the best only on strictly greater.", "The threshold loop stops as soon as the sum exceeds t; k is then how many were consumed."],
      cases: [
        { stdin: "7\n3 3 -1 5 5 5 2\n10\n", expected: "run: value 5 length 3\nfirstNegative: 2\nuntilOver: 5\n" },
        { stdin: "3\n1 1 1\n100\n", expected: "run: value 1 length 3\nfirstNegative: -1\nuntilOver: 3\n" },
        { stdin: "5\n9 -9 9 -9 20\n5\n", expected: "run: value 9 length 1\nfirstNegative: 1\nuntilOver: 1\n", hidden: true },
      ],
    },
  ],
  "control-checkpoint": [
    {
      title: "Roman numerals, both ways",
      prompt: `Read an integer \`n\` and \`n\` tokens. A token made of digits (1–3999) is converted **to** a Roman numeral; a token made of the letters \`IVXLCDM\` is converted **from** Roman to a number (subtractive pairs like \`IV\` and \`XC\` apply). Print \`<token> -> <result>\`.

Example: \`4\` then \`1994 MCMXCIV 3999 IV\` →
\`\`\`
1994 -> MCMXCIV
MCMXCIV -> 1994
3999 -> MMMCMXCIX
IV -> 4
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static final int[] VALUES = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    static final String[] SYMBOLS = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};

    static String toRoman(int n) {
        // TODO
        return "";
    }

    static int fromRoman(String s) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            boolean numeric = Character.isDigit(token.charAt(0));
            System.out.println(token + " -> " + (numeric ? toRoman(Integer.parseInt(token)) : String.valueOf(fromRoman(token))));
        }
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static final int[] VALUES = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    static final String[] SYMBOLS = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};

    static String toRoman(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < VALUES.length; i++) {
            while (n >= VALUES[i]) {
                sb.append(SYMBOLS[i]);
                n -= VALUES[i];
            }
        }
        return sb.toString();
    }

    static int value(char c) {
        switch (c) {
            case 'I': return 1;
            case 'V': return 5;
            case 'X': return 10;
            case 'L': return 50;
            case 'C': return 100;
            case 'D': return 500;
            default: return 1000;
        }
    }

    static int fromRoman(String s) {
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int v = value(s.charAt(i));
            if (i + 1 < s.length() && v < value(s.charAt(i + 1))) total -= v;
            else total += v;
        }
        return total;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            boolean numeric = Character.isDigit(token.charAt(0));
            System.out.println(token + " -> " + (numeric ? toRoman(Integer.parseInt(token)) : String.valueOf(fromRoman(token))));
        }
    }
}
`,
      hints: ["Greedy: subtract the largest value that fits, appending its symbol, until nothing is left.", "Reading: a symbol smaller than the next one is subtracted (IV = 5 - 1)."],
      cases: [
        { stdin: "4\n1994 MCMXCIV 3999 IV\n", expected: "1994 -> MCMXCIV\nMCMXCIV -> 1994\n3999 -> MMMCMXCIX\nIV -> 4\n" },
        { stdin: "3\n1 I 58\n", expected: "1 -> I\nI -> 1\n58 -> LVIII\n" },
        { stdin: "4\nXLII 42 CDXLIV 444\n", expected: "XLII -> 42\n42 -> XLII\nCDXLIV -> 444\n444 -> CDXLIV\n", hidden: true },
      ],
    },
  ],
};

export default more;

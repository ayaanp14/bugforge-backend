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
  slug: "types",
  title: "Types & operators",
  blurb: "The eight primitives, variables and constants, conversions, integer overflow, floating point, every operator, and the wrapper classes.",
  icon: "type",
  overview: `Every value in a Java program is one of eight primitive types or a reference. Most numeric bugs — a sum that goes negative, a division that gives zero, a comparison that is randomly false, an equality test that works for small numbers only — come from not knowing exactly how those types behave.

This module fixes that. You will learn the sizes and ranges, what the compiler converts silently and what needs a cast, what happens on overflow and how to detect it, why floating point cannot hold 0.1 and what to use for money, the full operator table with its precedence traps, and the wrapper classes with the autoboxing bugs that follow them.

By the end you can predict the result of any arithmetic expression, choose the right type for any quantity, and explain the Integer cache in an interview.`,
  lessons: [
    {
      slug: "primitives",
      file: "01-primitives.md",
      exercises: [
        {
          title: "The smallest type that fits",
          prompt: `Read an integer \`n\`, then \`n\` whole numbers (each fits in a \`long\`). For each, print the **smallest** integral type that can hold it: \`byte\`, \`short\`, \`int\` or \`long\`.

Use the \`MIN_VALUE\`/\`MAX_VALUE\` constants of the wrapper classes rather than typing the ranges.

**Input:** \`n\`, then \`n\` numbers.
**Output:** \`n\` lines.

Example: \`3\` then \`100 40000 -129\` →
\`\`\`
byte
int
short
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String[] tokens = new String(System.in.readAllBytes()).trim().split("\\s+");
        int n = Integer.parseInt(tokens[0]);
        StringBuilder out = new StringBuilder();
        for (int i = 1; i <= n; i++) {
            long v = Long.parseLong(tokens[i]);
            String type;
            if (v >= Byte.MIN_VALUE && v <= Byte.MAX_VALUE) type = "byte";
            else if (v >= Short.MIN_VALUE && v <= Short.MAX_VALUE) type = "short";
            else if (v >= Integer.MIN_VALUE && v <= Integer.MAX_VALUE) type = "int";
            else type = "long";
            out.append(type).append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["Parse each number as a long — an int cannot hold every input.", "Test the ranges from smallest to largest; the first that fits is the answer."],
          cases: [
            { stdin: "3\n100 40000 -129\n", expected: "byte\nint\nshort\n" },
            { stdin: "4\n-128 127 128 -32769\n", expected: "byte\nbyte\nshort\nint\n" },
            { stdin: "3\n2147483647 2147483648 -9223372036854775808\n", expected: "int\nlong\nlong\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many primitive types does Java have?",
          options: ["6", "8", "9 — including `String`", "It depends on the JVM"],
          answer: 1,
          explanation: "Eight: `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`. `String` is a class. The count is fixed by the language specification.",
        },
        {
          prompt: "What is wrong with `int n = 3000000000;`?",
          options: ["Nothing", "The literal is too large for an `int`; it needs `L` and a `long`", "Integers must use underscores above a million", "`int` cannot be negative"],
          answer: 1,
          explanation: "An unsuffixed integer literal is an `int`, and 3 000 000 000 exceeds `Integer.MAX_VALUE` (2 147 483 647). `long n = 3_000_000_000L;` compiles.",
        },
        {
          prompt: "What is the value of `'a' + 1`?",
          options: ["`'b'`", "`98`", "`\"a1\"`", "A compile error"],
          answer: 1,
          explanation: "`char` arithmetic promotes to `int`: `'a'` is 97, so the sum is the `int` 98. To get `'b'` you cast: `(char) ('a' + 1)`.",
        },
        {
          prompt: "Which primitive is unsigned?",
          options: ["`byte`", "`short`", "`char`", "`int`"],
          answer: 2,
          explanation: "`char` is a 16-bit unsigned value (0–65535), a UTF-16 code unit. All the other integral types are signed two's complement.",
        },
        {
          prompt: "A class declares `int count;` as a field and a method declares `int local;`. Which can be read without being assigned?",
          options: ["Both — both default to 0", "Only `count`, which defaults to 0; reading `local` is a compile error", "Only `local`", "Neither"],
          answer: 1,
          explanation: "Fields (and array elements) get default values. Locals do not — the compiler's definite-assignment check refuses a read before an assignment on every path.",
        },
      ],
    },
    {
      slug: "variables-and-constants",
      file: "02-variables-and-constants.md",
      exercises: [
        {
          title: "Temperature log",
          prompt: `A sensor reports temperatures. Read an integer \`n\`, then \`n\` integers (degrees). Print three lines: the highest reading as \`max=<v>\`, the lowest as \`min=<v>\`, and how many readings were strictly below freezing as \`freezing=<count>\`.

Declare the freezing point as a named constant (\`static final int FREEZING = 0;\`) and use it rather than a bare \`0\`.

**Input:** \`n\` (at least 1), then \`n\` integers.
**Output:** three lines.`,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int FREEZING = 0;

    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO: track max, min and the count below FREEZING
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int FREEZING = 0;

    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int max = Integer.MIN_VALUE;
        int min = Integer.MAX_VALUE;
        int freezing = 0;
        for (int i = 0; i < n; i++) {
            int t = in.nextInt();
            if (t > max) max = t;
            if (t < min) min = t;
            if (t < FREEZING) freezing++;
        }
        System.out.println("max=" + max);
        System.out.println("min=" + min);
        System.out.println("freezing=" + freezing);
    }
}
`,
          hints: ["Start max at Integer.MIN_VALUE and min at Integer.MAX_VALUE so the first reading replaces both.", "Three independent ifs inside one loop."],
          cases: [
            { stdin: "5\n3 -2 7 0 -5\n", expected: "max=7\nmin=-5\nfreezing=2\n" },
            { stdin: "1\n-40\n", expected: "max=-40\nmin=-40\nfreezing=1\n" },
            { stdin: "4\n0 0 1 2\n", expected: "max=2\nmin=0\nfreezing=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`final List<String> names = new ArrayList<>(); names.add(\"Ada\");` — what happens?",
          options: ["Compile error: `names` is final", "Runtime exception", "It compiles and adds \"Ada\": `final` fixes the reference, not the object", "It compiles but the add is ignored"],
          answer: 2,
          explanation: "`final` means the variable is assigned once. The `ArrayList` it points at is still mutable. Object immutability is a property of the class, not of the variable holding it.",
        },
        {
          prompt: "Which declaration is **not** allowed?",
          options: ["`var x = 10;`", "`var list = new ArrayList<String>();`", "`var x;`", "`for (var i = 0; i < 3; i++) {}`"],
          answer: 2,
          explanation: "`var` infers from the initialiser, so it needs one. `var x;` and `var x = null;` are both rejected. Fields and parameters cannot use `var` either.",
        },
        {
          prompt: "In `class Point { int x; Point(int x) { x = x; } }`, what does the constructor do?",
          options: ["Sets the field to the parameter", "Assigns the parameter to itself; the field stays 0", "Compile error: duplicate variable", "Throws at run time"],
          answer: 1,
          explanation: "The parameter shadows the field, so `x = x` is a self-assignment. The fix is `this.x = x`. The compiler allows it; a good IDE warns.",
        },
        {
          prompt: "Why can changing a `public static final int LIMIT = 10;` in a library break code compiled against the old value?",
          options: ["Static fields are cached by the JVM", "Compile-time constants are inlined into the classes that use them", "Final fields cannot be changed at all", "It cannot break anything"],
          answer: 1,
          explanation: "A `static final` with a constant initialiser is a compile-time constant; `javac` copies its value into every class that reads it. Those classes keep the old value until recompiled.",
        },
        {
          prompt: "Where does a local variable live?",
          options: ["On the heap, inside the object", "In the method area", "In the current thread's stack frame", "In a static table"],
          answer: 2,
          explanation: "Locals and parameters live in the frame pushed for the method call and vanish when it returns. Objects they refer to live on the heap; the *reference* is on the stack.",
        },
      ],
    },
    {
      slug: "conversions-and-casting",
      file: "03-conversions-and-casting.md",
      exercises: [
        {
          title: "Shout and count",
          prompt: `Read one line of text. Print two lines:

1. The line with every lowercase letter converted to uppercase **using char arithmetic** (\`(char) (c - 'a' + 'A')\`), everything else unchanged.
2. \`digits=<sum>\` where \`sum\` is the sum of the numeric values of all digit characters (\`c - '0'\`).

**Input:** one line (may contain spaces).
**Output:** two lines.

Example: \`abc 123 XYZ!\` →
\`\`\`
ABC 123 XYZ!
digits=6
\`\`\``,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        StringBuilder shout = new StringBuilder();
        int digits = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            // TODO: uppercase letters via arithmetic, sum digits
        }
        System.out.println(shout);
        System.out.println("digits=" + digits);
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        StringBuilder shout = new StringBuilder();
        int digits = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c >= 'a' && c <= 'z') {
                shout.append((char) (c - 'a' + 'A'));
            } else {
                shout.append(c);
            }
            if (c >= '0' && c <= '9') {
                digits += c - '0';
            }
        }
        System.out.println(shout);
        System.out.println("digits=" + digits);
    }
}
`,
          hints: ["c - 'a' + 'A' is an int; cast it back to char before appending.", "A digit's value is c - '0'."],
          cases: [
            { stdin: "abc 123 XYZ!\n", expected: "ABC 123 XYZ!\ndigits=6\n" },
            { stdin: "java 17 lts\n", expected: "JAVA 17 LTS\ndigits=8\n" },
            { stdin: "no digits here\n", expected: "NO DIGITS HERE\ndigits=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`double d = 7 / 2;` — what is `d`?",
          options: ["3.5", "3.0", "4.0", "Compile error"],
          answer: 1,
          explanation: "Both operands are `int`, so the division is integer division giving 3, which is then widened to 3.0. Cast an operand — `7 / 2.0` — to get 3.5.",
        },
        {
          prompt: "`byte b = 10; b = b + 5;` — what happens?",
          options: ["`b` becomes 15", "Compile error: `b + 5` is an `int`", "`b` becomes 5", "Runtime overflow"],
          answer: 1,
          explanation: "Binary numeric promotion makes `b + 5` an `int`, which cannot be assigned to a `byte` without a cast. `b += 5` compiles because compound assignment includes an implicit cast.",
        },
        {
          prompt: "What is `(byte) 200`?",
          options: ["200", "127", "-56", "Compile error"],
          answer: 2,
          explanation: "Narrowing keeps the low 8 bits: 200 is `11001000`, whose top bit is now the sign, giving −56.",
        },
        {
          prompt: "`int x = 10; x += 3.7;` — what is `x`?",
          options: ["13.7", "13", "14", "Compile error"],
          answer: 1,
          explanation: "`x += 3.7` is `x = (int) (x + 3.7)`: 13.7 truncated to 13. The hidden cast is why it compiles when `x = x + 3.7` would not.",
        },
        {
          prompt: "Which conversion is a *widening* conversion that can still lose precision?",
          options: ["`int` → `long`", "`long` → `double`", "`double` → `int`", "`char` → `int`"],
          answer: 1,
          explanation: "A `double` has 53 bits of mantissa; a `long` has 64 bits. Large longs round when widened. The rules call it widening because the magnitude is preserved.",
        },
      ],
    },
    {
      slug: "integer-arithmetic",
      file: "04-integer-arithmetic.md",
      exercises: [
        {
          title: "Products that fit",
          prompt: `Read an integer \`n\`, then \`n\` pairs of integers \`a b\` (each within the \`int\` range). For each pair print the exact product \`a × b\` followed by a space and either \`fits\` if the product is within the \`int\` range or \`overflow\` if it is not.

Compute in \`long\` — cast **before** multiplying.

**Input:** \`n\`, then \`n\` lines of two integers.
**Output:** \`n\` lines.

Example: \`2\` then \`100000 100000\` and \`-7 3\` →
\`\`\`
10000000000 overflow
-21 fits
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int a = in.nextInt();
            int b = in.nextInt();
            long product = (long) a * b;
            boolean fits = product >= Integer.MIN_VALUE && product <= Integer.MAX_VALUE;
            out.append(product).append(fits ? " fits" : " overflow").append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["(long) a * b multiplies in long; (long) (a * b) overflows first and widens the wrong answer.", "Compare the long product with Integer.MIN_VALUE and Integer.MAX_VALUE."],
          cases: [
            { stdin: "2\n100000 100000\n-7 3\n", expected: "10000000000 overflow\n-21 fits\n" },
            { stdin: "3\n46341 46341\n46340 46340\n-2147483648 -1\n", expected: "2147488281 overflow\n2147395600 fits\n2147483648 overflow\n" },
            { stdin: "1\n0 2147483647\n", expected: "0 fits\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `Integer.MAX_VALUE + 1` evaluate to?",
          options: ["It throws `ArithmeticException`", "`Integer.MIN_VALUE`", "`Long` 2147483648", "0"],
          answer: 1,
          explanation: "Integer overflow wraps silently in two's complement. Use `Math.addExact` to get an exception, or compute in `long`.",
        },
        {
          prompt: "What is `-7 % 3` in Java?",
          options: ["2", "-1", "1", "-2"],
          answer: 1,
          explanation: "`%` is a remainder whose sign follows the dividend: −7 = 3 × (−2) + (−1). `Math.floorMod(-7, 3)` gives the mathematical 2.",
        },
        {
          prompt: "Which midpoint expression avoids overflow for non-negative `low` and `high`?",
          options: ["`(low + high) / 2`", "`low + (high - low) / 2`", "`(low + high) * 0.5`", "`high - low / 2`"],
          answer: 1,
          explanation: "`low + high` can exceed `Integer.MAX_VALUE`; `high - low` cannot. `(low + high) >>> 1` is the other safe form.",
        },
        {
          prompt: "`long r = 100000 * 100000;` — what is `r`?",
          options: ["10000000000", "1410065408", "-1486618624", "Compile error"],
          answer: 2,
          explanation: "Both literals are `int`, so the multiplication overflows in `int` (giving −1486618624) and only then widens to `long`. Write `100000L * 100000`.",
        },
        {
          prompt: "What does `Math.abs(Integer.MIN_VALUE)` return?",
          options: ["2147483648", "2147483647", "-2147483648", "It throws"],
          answer: 2,
          explanation: "The positive 2 147 483 648 does not exist as an `int`, so negating `MIN_VALUE` wraps back to itself. `Math.absExact` (Java 15+) throws instead.",
        },
      ],
    },
    {
      slug: "floating-point",
      file: "05-floating-point.md",
      exercises: [
        {
          title: "The bill, to the cent",
          prompt: `Read an integer \`n\`, then \`n\` prices, each a decimal with up to two places (such as \`19.99\`). Using \`BigDecimal\` built from the **strings**, print:

1. \`subtotal=<sum>\` with exactly two decimals,
2. \`tax=<18% of the subtotal>\` rounded to two decimals with \`RoundingMode.HALF_UP\`,
3. \`total=<subtotal + tax>\` with two decimals.

**Input:** \`n\`, then \`n\` prices (whitespace-separated).
**Output:** three lines.

Example: \`3\` then \`19.99 5.01 0.10\` →
\`\`\`
subtotal=25.10
tax=4.52
total=29.62
\`\`\``,
          starter: String.raw`import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (int i = 0; i < n; i++) {
            String price = in.next();
            // TODO: add new BigDecimal(price)
        }
        // TODO: tax and total, each setScale(2, RoundingMode.HALF_UP)
    }
}
`,
          solution: String.raw`import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (int i = 0; i < n; i++) {
            subtotal = subtotal.add(new BigDecimal(in.next()));
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);
        System.out.println("subtotal=" + subtotal.toPlainString());
        System.out.println("tax=" + tax.toPlainString());
        System.out.println("total=" + total.toPlainString());
    }
}
`,
          hints: ["BigDecimal is immutable: subtotal = subtotal.add(...).", "setScale(2, RoundingMode.HALF_UP) both rounds and fixes the number of decimals printed."],
          cases: [
            { stdin: "3\n19.99 5.01 0.10\n", expected: "subtotal=25.10\ntax=4.52\ntotal=29.62\n" },
            { stdin: "2\n0.1 0.2\n", expected: "subtotal=0.30\ntax=0.05\ntotal=0.35\n" },
            { stdin: "1\n1000\n", expected: "subtotal=1000.00\ntax=180.00\ntotal=1180.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `0.1 + 0.2 == 0.3` false?",
          options: ["Java rounds doubles to 15 digits on printing only", "0.1 and 0.2 cannot be represented exactly in binary and the rounding errors do not cancel", "`==` on doubles compares references", "It is true in Java 17+"],
          answer: 1,
          explanation: "Binary floating point stores sums of powers of two; 0.1 is a repeating fraction in base 2. The sum is 0.30000000000000004, not the double nearest 0.3.",
        },
        {
          prompt: "Which is the right way to represent money?",
          options: ["`double` with `%.2f` when printing", "`float`", "`long` cents or `BigDecimal` constructed from a `String`", "`BigDecimal` constructed from a `double`"],
          answer: 2,
          explanation: "Integers in the smallest unit are exact; `BigDecimal` from a string is exact. `new BigDecimal(0.1)` captures the binary error, and `double` accumulates it.",
        },
        {
          prompt: "What is `Double.MIN_VALUE`?",
          options: ["The most negative double", "The smallest positive double (about 4.9e-324)", "Negative infinity", "NaN"],
          answer: 1,
          explanation: "`MIN_VALUE` for the floating types is the smallest *positive* value. The most negative double is `-Double.MAX_VALUE`.",
        },
        {
          prompt: "`double x = 0.0 / 0;` and then `x == x` — what is printed?",
          options: ["`true`", "`false`", "`ArithmeticException`", "Compile error"],
          answer: 1,
          explanation: "`0.0 / 0` is `NaN`, and `NaN` is unordered — every comparison with it, including with itself, is `false`. Test with `Double.isNaN`. Only *integer* division by zero throws.",
        },
        {
          prompt: "`new BigDecimal(\"2.0\").equals(new BigDecimal(\"2.00\"))` is…",
          options: ["`true`", "`false`, because `equals` compares scale as well as value", "A compile error", "`true` only with `HALF_UP`"],
          answer: 1,
          explanation: "`BigDecimal.equals` considers 2.0 and 2.00 different (scale 1 vs 2). `compareTo` returns 0 for them — use it for numeric equality.",
        },
      ],
    },
    {
      slug: "operators",
      file: "06-operators.md",
      exercises: [
        {
          title: "Bit report",
          prompt: `Read an integer \`n\`, then \`n\` integers. For each value \`x\` print one line:

\`<x> bin=<binary> ones=<count> parity=<even|odd> half=<x >> 1> logical=<x >>> 1> pow2=<yes|no>\`

where \`binary\` is \`Integer.toBinaryString(x)\`, \`ones\` is \`Integer.bitCount(x)\`, parity comes from \`x & 1\`, and \`pow2\` is \`yes\` when \`x > 0\` and \`(x & (x - 1)) == 0\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n\` lines.`,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            boolean pow2 = x > 0 && (x & (x - 1)) == 0;
            out.append(x)
               .append(" bin=").append(Integer.toBinaryString(x))
               .append(" ones=").append(Integer.bitCount(x))
               .append(" parity=").append((x & 1) == 1 ? "odd" : "even")
               .append(" half=").append(x >> 1)
               .append(" logical=").append(x >>> 1)
               .append(" pow2=").append(pow2 ? "yes" : "no")
               .append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["Parenthesise (x & 1) == 1 — & binds looser than ==.", "For a negative x, >> keeps the sign and >>> fills with zero: the two halves differ."],
          cases: [
            { stdin: "3\n8 7 -16\n", expected: "8 bin=1000 ones=1 parity=even half=4 logical=4 pow2=yes\n7 bin=111 ones=3 parity=odd half=3 logical=3 pow2=no\n-16 bin=11111111111111111111111111110000 ones=28 parity=even half=-8 logical=2147483640 pow2=no\n" },
            { stdin: "2\n1 0\n", expected: "1 bin=1 ones=1 parity=odd half=0 logical=0 pow2=yes\n0 bin=0 ones=0 parity=even half=0 logical=0 pow2=no\n" },
            { stdin: "1\n-1\n", expected: "-1 bin=11111111111111111111111111111111 ones=32 parity=odd half=-1 logical=2147483647 pow2=no\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the difference between `&&` and `&` on booleans?",
          options: ["None", "`&&` short-circuits (skips the right side when the left is false); `&` always evaluates both", "`&` is bitwise and cannot be used on booleans", "`&&` is slower"],
          answer: 1,
          explanation: "`a != null && a.f()` is safe because of short-circuiting; with `&`, `a.f()` runs even when `a` is null. `&` on booleans is legal and evaluates both sides.",
        },
        {
          prompt: "What does `-16 >>> 28` give for an `int`?",
          options: ["-1", "15", "-16", "0"],
          answer: 1,
          explanation: "`>>>` shifts in zeros. −16 is `1111…10000`; moving it 28 places right leaves the top four ones: `1111` = 15. `>>` would give −1.",
        },
        {
          prompt: "`x & 1 == 1` does not compile. Why?",
          options: ["`&` cannot be used on `int`", "`==` binds tighter than `&`, so it becomes `x & (1 == 1)`, an `int & boolean`", "`1 == 1` is always true, which is an error", "Missing spaces"],
          answer: 1,
          explanation: "Bitwise operators sit below the comparison operators in precedence. Write `(x & 1) == 1`.",
        },
        {
          prompt: "`int v = 1 << 32;` — what is `v`?",
          options: ["0", "1", "4294967296", "Compile error"],
          answer: 1,
          explanation: "The shift distance is masked to 5 bits for an `int` (32 & 31 = 0), so this is `1 << 0`. For a `long` the mask is 63.",
        },
        {
          prompt: "`Integer x = null; int y = flag ? x : 0;` with `flag` true — what happens?",
          options: ["`y` is 0", "`y` is null", "`NullPointerException`: the ternary unboxes `x`", "Compile error"],
          answer: 2,
          explanation: "One branch is a primitive, so the expression's type is `int` and the chosen `Integer` is unboxed — and unboxing null throws.",
        },
      ],
    },
    {
      slug: "wrappers-and-autoboxing",
      file: "07-wrappers-and-autoboxing.md",
      exercises: [
        {
          title: "Cached or fresh?",
          prompt: `Read an integer \`n\`, then \`n\` integers. For each value \`v\`, box it twice — \`Integer a = v; Integer b = v;\` — and print \`<v> same\` if \`a == b\` is true (the same cached object) or \`<v> different\` otherwise. Then print a last line \`equals=<count>\` with how many of the pairs were \`equals\` — which should be all of them.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n + 1\` lines.

Example: \`3\` then \`127 128 -128\` →
\`\`\`
127 same
128 different
-128 same
equals=3
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder out = new StringBuilder();
        int equal = 0;
        for (int i = 0; i < n; i++) {
            int v = in.nextInt();
            Integer a = v;
            Integer b = v;
            out.append(v).append(a == b ? " same" : " different").append('\n');
            if (a.equals(b)) equal++;
        }
        out.append("equals=").append(equal).append('\n');
        System.out.print(out);
    }
}
`,
          hints: ["Integer.valueOf caches −128..127; boxing goes through valueOf.", "Compare with == for identity and .equals for value."],
          cases: [
            { stdin: "3\n127 128 -128\n", expected: "127 same\n128 different\n-128 same\nequals=3\n" },
            { stdin: "4\n0 -129 1000 5\n", expected: "0 same\n-129 different\n1000 different\n5 same\nequals=4\n" },
            { stdin: "2\n2147483647 -2147483648\n", expected: "2147483647 different\n-2147483648 different\nequals=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Integer a = 1000, b = 1000; a == b` is…",
          options: ["`true`", "`false` — two different objects outside the −128…127 cache", "A compile error", "`true` only on 64-bit JVMs"],
          answer: 1,
          explanation: "Autoboxing calls `Integer.valueOf`, which caches only −128 to 127. Larger values get fresh objects, and `==` compares references. Use `equals`.",
        },
        {
          prompt: "`Map<String, Integer> m = new HashMap<>(); int n = m.get(\"x\");` — result?",
          options: ["`n` is 0", "`NullPointerException` when unboxing the null returned by `get`", "Compile error", "`n` is -1"],
          answer: 1,
          explanation: "`get` returns `null` for a missing key; assigning to an `int` unboxes it and throws. `m.getOrDefault(\"x\", 0)` is the fix.",
        },
        {
          prompt: "Why is `Long sum = 0L; for (...) sum += i;` slow?",
          options: ["`Long` arithmetic is done in software", "Every `+=` unboxes, adds and boxes a new `Long` object", "`Long` cannot be a loop accumulator", "It is not slow"],
          answer: 1,
          explanation: "Wrappers are immutable, so each iteration allocates. With a primitive `long` the loop is a register add. Keep accumulators primitive.",
        },
        {
          prompt: "`Integer i = 1; Long l = 1L; i.equals(l)` is…",
          options: ["`true`", "`false` — different wrapper classes are never equal", "Compile error", "`true` after unboxing"],
          answer: 1,
          explanation: "`equals` checks the class first. This is why `map.get(1)` misses in a `Map<Long, V>`: the key must be `1L`.",
        },
        {
          prompt: "Which comparator body is correct for two `Integer`s `a` and `b`?",
          options: ["`return a - b;`", "`return Integer.compare(a, b);`", "`return a == b ? 0 : 1;`", "`return a > b;`"],
          answer: 1,
          explanation: "`a - b` overflows for large values of opposite sign and returns the wrong sign; `Integer.compare` does not. The other two do not even return a valid ordering.",
        },
      ],
    },
    {
      slug: "types-checkpoint",
      file: "08-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Statistics without overflow",
          prompt: `Read an integer \`n\` (1 ≤ n ≤ 100 000), then \`n\` integers each within the \`int\` range. Print four lines: \`sum=<exact sum>\`, \`min=<smallest>\`, \`max=<largest>\`, and \`avg=<mean with exactly 2 decimals>\`.

The sum of 100 000 values near \`Integer.MAX_VALUE\` does not fit in an \`int\`. Choose your types accordingly, and make sure the average is computed in floating point, not truncated.

Example: \`3\` then \`2147483647 2147483647 1\` →
\`\`\`
sum=4294967295
min=1
max=2147483647
avg=1431655765.00
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String[] tokens = new String(System.in.readAllBytes()).trim().split("\\s+");
        int n = Integer.parseInt(tokens[0]);
        long sum = 0;
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        for (int i = 1; i <= n; i++) {
            int v = Integer.parseInt(tokens[i]);
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        System.out.println("sum=" + sum);
        System.out.println("min=" + min);
        System.out.println("max=" + max);
        System.out.printf("avg=%.2f%n", (double) sum / n);
    }
}
`,
          hints: ["The accumulator must be a long.", "(double) sum / n — cast before dividing."],
          cases: [
            { stdin: "3\n2147483647 2147483647 1\n", expected: "sum=4294967295\nmin=1\nmax=2147483647\navg=1431655765.00\n" },
            { stdin: "4\n-5 5 -5 5\n", expected: "sum=0\nmin=-5\nmax=5\navg=0.00\n" },
            { stdin: "2\n-2147483648 -2147483648\n", expected: "sum=-4294967296\nmin=-2147483648\nmax=-2147483648\navg=-2147483648.00\n", hidden: true },
            { stdin: "3\n1 2 2\n", expected: "sum=5\nmin=1\nmax=2\navg=1.67\n", hidden: true },
          ],
        },
        {
          title: "Cents, exactly",
          prompt: `A shop stores prices as strings with exactly two decimals. Read an integer \`n\`, then \`n\` lines each holding a price and a quantity (\`19.99 3\`). Work entirely in **cents using \`long\`** — convert each price by splitting on the dot, never by parsing it as a \`double\` — and print:

1. \`total=<amount>\` formatted as \`whole.cc\` (two-digit cents),
2. \`discount=<amount>\` — 15% of the total, in cents, rounded **half up** to the nearest cent, in the same format,
3. \`due=<total - discount>\` in the same format.

Example: \`2\` then \`19.99 3\` and \`0.05 1\` →
\`\`\`
total=60.02
discount=9.00
due=51.02
\`\`\`
(9.003 rounds to 9.00; 60.02 × 0.15 = 9.003.)`,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static long cents(String price) {
        int dot = price.indexOf('.');
        long whole = Long.parseLong(price.substring(0, dot));
        long frac = Long.parseLong(price.substring(dot + 1));
        return whole * 100 + frac;
    }

    static String money(long cents) {
        return cents / 100 + "." + String.format("%02d", cents % 100);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        long total = 0;
        for (int i = 0; i < n; i++) {
            String[] parts = br.readLine().trim().split("\\s+");
            total += cents(parts[0]) * Long.parseLong(parts[1]);
        }
        // 15% = total * 15 / 100, rounded half up: add half the divisor before dividing.
        long discount = (total * 15 + 50) / 100;
        System.out.println("total=" + money(total));
        System.out.println("discount=" + money(discount));
        System.out.println("due=" + money(total - discount));
    }
}
`,
          hints: ["price 19.99 → 19 * 100 + 99 cents.", "Round half up with integers: (x * 15 + 50) / 100.", "Format cents % 100 with %02d so 5 cents prints as .05."],
          cases: [
            { stdin: "2\n19.99 3\n0.05 1\n", expected: "total=60.02\ndiscount=9.00\ndue=51.02\n" },
            { stdin: "1\n0.10 3\n", expected: "total=0.30\ndiscount=0.05\ndue=0.25\n" },
            { stdin: "3\n100.00 1\n0.01 1\n0.01 1\n", expected: "total=100.02\ndiscount=15.00\ndue=85.02\n", hidden: true },
            { stdin: "1\n99999999.99 1000\n", expected: "total=99999999990.00\ndiscount=14999999998.50\ndue=84999999991.50\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which list contains **only** primitive types?",
          options: ["`int, Integer, char`", "`byte, short, int, long, float, double, char, boolean`", "`int, double, String, boolean`", "`int, long, void`"],
          answer: 1,
          explanation: "Those eight are the primitives. `Integer` and `String` are classes; `void` is not a type you can hold a value in.",
        },
        {
          prompt: "`long big = 2147483648;` — does it compile?",
          options: ["Yes", "No: the literal is an `int` and too large; it needs `L`", "Yes, with a warning", "Only with `var`"],
          answer: 1,
          explanation: "Integer literals are `int` unless suffixed. Even though the target is `long`, the literal itself must be valid: `2147483648L`.",
        },
        {
          prompt: "What is `(int) -3.99`?",
          options: ["-4", "-3", "3", "Compile error"],
          answer: 1,
          explanation: "A floating → integral cast truncates toward zero. `Math.floor(-3.99)` would give −4.0.",
        },
        {
          prompt: "`char c = 'x'; c++;` compiles, but `c = c + 1;` does not. Why?",
          options: ["`char` cannot be incremented", "`c + 1` is an `int`; `c++` includes an implicit cast back to `char`", "`c = c + 1` needs `'1'`", "It is a compiler bug"],
          answer: 1,
          explanation: "Binary numeric promotion makes `c + 1` an `int`. Increment, decrement and compound assignment carry an implicit narrowing cast.",
        },
        {
          prompt: "`7 / 2 * 2.0` evaluates to…",
          options: ["7.0", "6.0", "3.5", "6"],
          answer: 1,
          explanation: "`/` and `*` share precedence and associate left to right: `7 / 2` is integer 3, then `3 * 2.0` is 6.0.",
        },
        {
          prompt: "How can you make integer overflow throw instead of wrapping?",
          options: ["`strictfp`", "`Math.addExact` / `multiplyExact`", "Compile with `-Xoverflow`", "It always throws"],
          answer: 1,
          explanation: "The `*Exact` methods in `Math` (Java 8+) throw `ArithmeticException` on overflow. Plain operators never do.",
        },
        {
          prompt: "`Math.floorMod(-1, 5)` is…",
          options: ["-1", "4", "1", "0"],
          answer: 1,
          explanation: "`floorMod` returns a result with the sign of the divisor: −1 = 5 × (−1) + 4. Plain `-1 % 5` gives −1.",
        },
        {
          prompt: "What is `1.0 / 0`?",
          options: ["`ArithmeticException`", "`Infinity`", "`NaN`", "0.0"],
          answer: 1,
          explanation: "Floating-point division by zero follows IEEE 754: positive/zero is `Infinity`, zero/zero is `NaN`. Only integer division throws.",
        },
        {
          prompt: "Which comparison of two computed doubles `a` and `b` is appropriate?",
          options: ["`a == b`", "`Math.abs(a - b) < 1e-9` (a tolerance suited to the magnitudes)", "`a.equals(b)`", "`(int) a == (int) b`"],
          answer: 1,
          explanation: "Computed doubles carry rounding error; compare within a tolerance. `Double.compare` is for ordering, and primitives have no `equals`.",
        },
        {
          prompt: "`new BigDecimal(0.1)` versus `new BigDecimal(\"0.1\")` — which is exact 0.1?",
          options: ["Both", "Only the `String` one; the `double` one captures 0.1000000000000000055511…", "Only the `double` one", "Neither"],
          answer: 1,
          explanation: "The `double` constructor converts the binary value exactly, error included. Build `BigDecimal` from strings or `BigDecimal.valueOf`.",
        },
        {
          prompt: "What is `~0`?",
          options: ["0", "1", "-1", "`Integer.MAX_VALUE`"],
          answer: 2,
          explanation: "`~` flips every bit: all 32 bits set is −1 in two's complement. In general `~x == -x - 1`.",
        },
        {
          prompt: "`true ? 1 : 2.0` has which type and value?",
          options: ["`int` 1", "`double` 1.0", "`Object` 1", "Compile error"],
          answer: 1,
          explanation: "Both branches are numeric, so binary numeric promotion applies to the ternary: the result type is `double`, and 1 becomes 1.0.",
        },
        {
          prompt: "Which statement about `Integer.valueOf` is true?",
          options: ["It always allocates a new object", "It returns cached objects for −128 to 127 and new ones otherwise", "It caches every value", "It is deprecated"],
          answer: 1,
          explanation: "The cache is why `==` on small boxed integers is true and on large ones false. `new Integer(n)` is what is deprecated.",
        },
        {
          prompt: "`List<int> xs` — why does it fail?",
          options: ["Lists can only hold strings", "Generics take reference types only; use `List<Integer>`", "Missing `new`", "`int` must be capitalised in all contexts"],
          answer: 1,
          explanation: "Type parameters are erased to `Object`, so they cannot be primitives. The wrapper `Integer` is the type argument; autoboxing hides the conversion.",
        },
        {
          prompt: "A local `int x;` is read before assignment. What happens?",
          options: ["`x` is 0", "Compile error: variable might not have been initialized", "Runtime `NullPointerException`", "Undefined behaviour"],
          answer: 1,
          explanation: "Definite assignment is checked by the compiler for locals. Fields default to 0; locals must be assigned on every path first.",
        },
      ],
    },
  ],
}, more);

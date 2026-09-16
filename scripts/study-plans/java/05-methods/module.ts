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
  slug: "methods",
  title: "Methods",
  blurb: "Declaring and calling methods, static vs instance, pass-by-value, overload resolution, varargs, recursion, and scope.",
  icon: "function",
  overview: `Methods are how Java code is organised, reused and reasoned about. The mechanics look simple and hide three of the most-asked interview questions in the language: is Java pass-by-value or by-reference, which overload does the compiler pick, and what happens when recursion goes too deep.

This module answers all three precisely — with the stack-frame model that makes them obvious — and covers the rest of the method toolkit: static versus instance context, varargs and their pitfalls, recursion with memoization and backtracking, and the scope and lifetime rules behind shadowing and effectively-final variables.

By the end you can explain the argument-copy model with a diagram, predict overload resolution, and decide when recursion is the right tool.`,
  lessons: [
    {
      slug: "defining-methods",
      file: "01-defining-methods.md",
      exercises: [
        {
          title: "A prime helper",
          prompt: `Write \`static boolean isPrime(long n)\` (trial division up to the square root; numbers below 2 are not prime). Read an integer \`k\`, then \`k\` integers; for each print \`<n> prime\` or \`<n> composite\`, then a last line \`primes=<count>\`.

**Input:** \`k\`, then \`k\` integers (each fits in a \`long\`).
**Output:** \`k + 1\` lines.`,
          starter: String.raw`import java.util.*;

public class Main {
    static boolean isPrime(long n) {
        // TODO
        return false;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        int primes = 0;
        for (int i = 0; i < k; i++) {
            long n = in.nextLong();
            // TODO: call isPrime, print, count
        }
        System.out.println("primes=" + primes);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static boolean isPrime(long n) {
        if (n < 2) return false;
        if (n % 2 == 0) return n == 2;
        for (long d = 3; d * d <= n; d += 2) {
            if (n % d == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        int primes = 0;
        for (int i = 0; i < k; i++) {
            long n = in.nextLong();
            boolean p = isPrime(n);
            if (p) primes++;
            System.out.println(n + (p ? " prime" : " composite"));
        }
        System.out.println("primes=" + primes);
    }
}
`,
          hints: ["Loop d from 2 while d * d <= n — stop at the square root.", "Handle n < 2 first with an early return."],
          cases: [
            { stdin: "5\n2 9 17 1 25\n", expected: "2 prime\n9 composite\n17 prime\n1 composite\n25 composite\nprimes=2\n" },
            { stdin: "3\n1000000007 4 0\n", expected: "1000000007 prime\n4 composite\n0 composite\nprimes=1\n" },
            { stdin: "2\n97 99\n", expected: "97 prime\n99 composite\nprimes=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What makes up a method's *signature*?",
          options: ["Name, parameter types and return type", "Name and parameter types", "Name only", "Return type and parameter names"],
          answer: 1,
          explanation: "Two methods in a class may not share a name and parameter list; the return type and parameter names do not distinguish them.",
        },
        {
          prompt: "\"non-static method f() cannot be referenced from a static context\" means…",
          options: ["`f` must be renamed", "You called an instance method from static code (e.g. `main`) without an object", "`f` is private", "The class has no constructor"],
          answer: 1,
          explanation: "A static context has no `this`. Create an object and call `obj.f()`, or make `f` static if it needs no instance state.",
        },
        {
          prompt: "A non-void method with an `if` that returns in one branch and nothing after — result?",
          options: ["Returns 0 on the other path", "Compile error: missing return statement", "Returns null", "Runtime exception"],
          answer: 1,
          explanation: "Every path through a non-void method must return a value; the compiler checks this statically.",
        },
        {
          prompt: "`s.trim();` as a statement on its own is…",
          options: ["A compile error", "Legal but useless — the trimmed string is discarded", "Trims `s` in place", "Only legal for `StringBuilder`"],
          answer: 1,
          explanation: "Ignoring a return value is allowed. For a pure method like `trim` it is a bug; for `list.add` it is normal.",
        },
        {
          prompt: "Which method should be `static`?",
          options: ["One that reads the object's fields", "One that only transforms its arguments, like `isPalindrome(String)`", "Every method in `Main`", "One that calls other instance methods"],
          answer: 1,
          explanation: "Utility methods that depend only on their inputs belong on the class; behaviour that depends on an object's state belongs on the object.",
        },
      ],
    },
    {
      slug: "pass-by-value",
      file: "02-pass-by-value.md",
      exercises: [
        {
          title: "What the caller sees",
          prompt: `Implement three methods and report what the caller observes:

- \`static void bump(int x)\` — does \`x += 100\`.
- \`static void fillFirst(int[] a)\` — sets \`a[0] = 100\`, then does \`a = new int[] {7}\`.
- \`static void shout(StringBuilder sb)\` — appends \`!\`, then does \`sb = new StringBuilder("gone")\`.

Read an integer \`x\`, an integer \`n\` followed by \`n\` integers for the array, and a word. Call the three methods, then print \`x=<x>\`, \`array=<elements space-separated>\` and \`word=<contents of the builder>\`.

Example: \`5\`, \`3 1 2 3\`, \`hi\` → \`x=5\`, \`array=100 2 3\`, \`word=hi!\``,
          starter: String.raw`import java.util.*;

public class Main {
    static void bump(int x) { /* TODO */ }
    static void fillFirst(int[] a) { /* TODO */ }
    static void shout(StringBuilder sb) { /* TODO */ }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int x = in.nextInt();
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        StringBuilder sb = new StringBuilder(in.next());
        // TODO: call the methods and print what the caller sees
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static void bump(int x) {
        x += 100;
    }

    static void fillFirst(int[] a) {
        a[0] = 100;
        a = new int[] {7};
    }

    static void shout(StringBuilder sb) {
        sb.append('!');
        sb = new StringBuilder("gone");
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int x = in.nextInt();
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        StringBuilder sb = new StringBuilder(in.next());

        bump(x);
        fillFirst(a);
        shout(sb);

        StringBuilder arr = new StringBuilder();
        for (int i = 0; i < a.length; i++) {
            if (i > 0) arr.append(' ');
            arr.append(a[i]);
        }
        System.out.println("x=" + x);
        System.out.println("array=" + arr);
        System.out.println("word=" + sb);
    }
}
`,
          hints: ["Mutating through the reference (a[0] = …, sb.append) is visible; reassigning the parameter is not.", "The primitive x is copied; nothing the method does reaches the caller."],
          cases: [
            { stdin: "5\n3 1 2 3\nhi\n", expected: "x=5\narray=100 2 3\nword=hi!\n" },
            { stdin: "-1\n1 9\njava\n", expected: "x=-1\narray=100\nword=java!\n" },
            { stdin: "0\n2 0 0\nx\n", expected: "x=0\narray=100 0\nword=x!\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Java passes arguments…",
          options: ["Primitives by value, objects by reference", "Everything by value — for objects, the value is the reference", "Everything by reference", "By value only for `final` parameters"],
          answer: 1,
          explanation: "The reference is copied into the parameter. The callee can mutate the shared object but cannot rebind the caller's variable.",
        },
        {
          prompt: "`static void f(int[] a) { a = new int[]{1}; } int[] x = {5}; f(x);` — `x[0]` afterwards is…",
          options: ["1", "5", "0", "Compile error"],
          answer: 1,
          explanation: "Reassigning the parameter changes only the local copy of the reference. `x` still points at the original array.",
        },
        {
          prompt: "`static void g(StringBuilder b) { b.append(\"!\"); }` — visible to the caller?",
          options: ["No", "Yes — the method mutated the object both references share", "Only if `b` is returned", "Only for `String`"],
          answer: 1,
          explanation: "Mutation through the copied reference reaches the one shared object. This is the difference from reassignment.",
        },
        {
          prompt: "Why can't you write `swap(int a, int b)` that swaps the caller's variables?",
          options: ["Java forbids two `int` parameters", "The method receives copies; swapping them swaps the copies", "It works if the parameters are `final`", "It works with `Integer`"],
          answer: 1,
          explanation: "Neither the primitives nor the (immutable) `Integer` references let the callee reach the caller's variables. Swap array elements or fields instead.",
        },
        {
          prompt: "`static void h(String s) { s = s + \"x\"; }` — after `h(name)`, `name` is…",
          options: ["Changed", "Unchanged — the local reference was rebound to a new string", "null", "Compile error"],
          answer: 1,
          explanation: "Strings are immutable, so the only thing the callee can do is point its own variable somewhere else.",
        },
      ],
    },
    {
      slug: "overloading",
      file: "03-overloading.md",
      exercises: [
        {
          title: "Area overloads",
          prompt: `Write three overloads of \`area\`: \`area(int side)\` for a square, \`area(int w, int h)\` for a rectangle, and \`area(double radius)\` for a circle (\`Math.PI * r * r\`). Read an integer \`n\`, then \`n\` lines of the form \`square 3\`, \`rect 3 4\` or \`circle 2.5\`, call the matching overload, and print each area with two decimals.

Note that \`area(3)\` must call the \`int\` version and \`area(2.5)\` the \`double\` one — parse the arguments with the right types.

Example: \`square 3\` → \`9.00\`; \`circle 1\` → \`3.14\`.`,
          starter: String.raw`import java.util.*;

public class Main {
    static double area(int side) { return 0; }             // TODO
    static double area(int w, int h) { return 0; }         // TODO
    static double area(double radius) { return 0; }        // TODO

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String shape = in.next();
            // TODO: read the right number of values, call area, printf %.2f
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static double area(int side) { return (double) side * side; }
    static double area(int w, int h) { return (double) w * h; }
    static double area(double radius) { return Math.PI * radius * radius; }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String shape = in.next();
            double a;
            switch (shape) {
                case "square" -> a = area(in.nextInt());
                case "rect" -> a = area(in.nextInt(), in.nextInt());
                default -> a = area(in.nextDouble());
            }
            System.out.printf("%.2f%n", a);
        }
    }
}
`,
          hints: ["in.nextInt() gives an int, so area(in.nextInt()) resolves to area(int) at compile time.", "in.nextDouble() selects area(double)."],
          cases: [
            { stdin: "3\nsquare 3\nrect 3 4\ncircle 1\n", expected: "9.00\n12.00\n3.14\n" },
            { stdin: "2\ncircle 2.5\nsquare 100000\n", expected: "19.63\n10000000000.00\n" },
            { stdin: "1\nrect 7 6\n", expected: "42.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Given `f(long)`, `f(Integer)` and `f(int...)`, the call `f(5)` invokes…",
          options: ["`f(Integer)`", "`f(long)` — widening beats boxing", "`f(int...)`", "It is ambiguous"],
          answer: 1,
          explanation: "Resolution has three phases: widening/subtyping first, boxing second, varargs last. `int` → `long` is a phase-1 match.",
        },
        {
          prompt: "Can two methods differ only in return type?",
          options: ["Yes", "No — the return type is not part of the signature", "Only if one is static", "Only in different packages"],
          answer: 1,
          explanation: "A call site could not choose between them. The compiler reports a duplicate method.",
        },
        {
          prompt: "`Object o = \"hi\"; g(o);` with `g(Object)` and `g(String)` calls…",
          options: ["`g(String)` because the object is a String", "`g(Object)` — overloads are chosen by the argument's declared type at compile time", "Both", "Compile error"],
          answer: 1,
          explanation: "Overload resolution is static. The run-time class is irrelevant; that is what *overriding* uses.",
        },
        {
          prompt: "`List<Integer> list; list.remove(1);` removes…",
          options: ["The element equal to 1", "The element at index 1 — `remove(int)` is an exact match", "Both", "Nothing"],
          answer: 1,
          explanation: "The primitive `int` argument matches `remove(int index)` in phase 1; `remove(Object)` would need boxing. Use `remove(Integer.valueOf(1))` for the value.",
        },
        {
          prompt: "`g(null)` with `g(String)` and `g(Integer)` is…",
          options: ["`g(String)`", "`g(Integer)`", "Ambiguous — a compile error", "A `NullPointerException`"],
          answer: 2,
          explanation: "`null` converts to both and neither type is more specific than the other. Cast: `g((String) null)`.",
        },
      ],
    },
    {
      slug: "varargs",
      file: "04-varargs.md",
      exercises: [
        {
          title: "Stats for any count",
          prompt: `Implement \`static int max(int first, int... rest)\` and \`static double mean(int first, int... rest)\` — the leading parameter guarantees at least one value. Read an integer \`n\`, then \`n\` lines each containing one or more integers. For each line, split it, call both methods (pass the remaining values as an array), and print \`max=<m> mean=<mean with 2 decimals>\`.

Example line: \`3 9 4\` → \`max=9 mean=5.33\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static int max(int first, int... rest) {
        // TODO
        return 0;
    }

    static double mean(int first, int... rest) {
        // TODO
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = br.readLine().trim().split("\\s+");
            int first = Integer.parseInt(t[0]);
            int[] rest = new int[t.length - 1];
            // TODO: fill rest, call max and mean, print
        }
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static int max(int first, int... rest) {
        int m = first;
        for (int v : rest) if (v > m) m = v;
        return m;
    }

    static double mean(int first, int... rest) {
        long sum = first;
        for (int v : rest) sum += v;
        return (double) sum / (rest.length + 1);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = br.readLine().trim().split("\\s+");
            int first = Integer.parseInt(t[0]);
            int[] rest = new int[t.length - 1];
            for (int j = 1; j < t.length; j++) rest[j - 1] = Integer.parseInt(t[j]);
            System.out.printf("max=%d mean=%.2f%n", max(first, rest), mean(first, rest));
        }
    }
}
`,
          hints: ["Inside the method, rest is an int[] — rest.length may be 0.", "An int[] argument is passed as the varargs array directly."],
          cases: [
            { stdin: "3\n3 9 4\n7\n-5 -2 -9\n", expected: "max=9 mean=5.33\nmax=7 mean=7.00\nmax=-2 mean=-5.33\n" },
            { stdin: "1\n2147483647 2147483647\n", expected: "max=2147483647 mean=2147483647.00\n" },
            { stdin: "2\n1 2\n0 0 0 0\n", expected: "max=2 mean=1.50\nmax=0 mean=0.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Inside `static int sum(int... xs)`, what is `xs`?",
          options: ["A `List<Integer>`", "An `int[]` built by the compiler at the call site", "A single `int`", "An `Iterator`"],
          answer: 1,
          explanation: "`T...` is `T[]` — `sum(1, 2)` compiles to `sum(new int[]{1, 2})`, and `sum()` passes an empty array.",
        },
        {
          prompt: "Where may a varargs parameter appear?",
          options: ["Anywhere", "Only as the last parameter, and only once", "Only first", "Only in static methods"],
          answer: 1,
          explanation: "The compiler needs an unambiguous split between fixed and variable arguments.",
        },
        {
          prompt: "`print(null)` where `print(String... s)` — what happens?",
          options: ["`s` has one null element", "`s` itself is null; `s.length` throws `NullPointerException`", "Compile error", "`s` is empty"],
          answer: 1,
          explanation: "A bare `null` matches the array type directly. Cast it — `(String) null` — to pass a one-element array.",
        },
        {
          prompt: "With `f(int, int)` and `f(int...)` both declared, `f(1, 2)` calls…",
          options: ["`f(int...)`", "`f(int, int)` — fixed arity beats varargs", "Ambiguous", "Neither"],
          answer: 1,
          explanation: "Varargs applicability is the third and last resolution phase; any fixed-arity match wins first.",
        },
        {
          prompt: "What does `@SafeVarargs` assert?",
          options: ["The method never throws", "The method does not store or expose its generic varargs array unsafely, so the heap-pollution warning can be suppressed", "The varargs may be null", "The method is thread-safe"],
          answer: 1,
          explanation: "Generic varargs create an array of a generic type; the annotation is the author's promise that this is used safely.",
        },
      ],
    },
    {
      slug: "recursion",
      file: "05-recursion.md",
      exercises: [
        {
          title: "Three recursions",
          prompt: `Implement three recursive methods and dispatch on commands. Read an integer \`n\`, then \`n\` lines:

- \`sum <k>\` → the sum of the decimal digits of \`k\` (k ≥ 0), recursively: \`digitSum(k) = k % 10 + digitSum(k / 10)\`, base case \`k < 10\`.
- \`pow <b> <e>\` → \`b^e\` computed by **exponentiation by squaring** (e ≥ 0; the answer fits in a \`long\`): base case \`e == 0\`, otherwise square the half power and multiply by \`b\` once more if \`e\` is odd.
- \`rev <word>\` → the word reversed recursively (base case: length ≤ 1).

Print one result per line.`,
          starter: String.raw`import java.util.*;

public class Main {
    static int digitSum(long k) { return 0; }              // TODO
    static long power(long b, int e) { return 0; }          // TODO
    static String reverse(String s) { return s; }           // TODO

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static int digitSum(long k) {
        if (k < 10) return (int) k;
        return (int) (k % 10) + digitSum(k / 10);
    }

    static long power(long b, int e) {
        if (e == 0) return 1;
        long half = power(b, e / 2);
        long result = half * half;
        return (e % 2 == 1) ? result * b : result;
    }

    static String reverse(String s) {
        if (s.length() <= 1) return s;
        return reverse(s.substring(1)) + s.charAt(0);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "sum" -> System.out.println(digitSum(in.nextLong()));
                case "pow" -> System.out.println(power(in.nextLong(), in.nextInt()));
                default -> System.out.println(reverse(in.next()));
            }
        }
    }
}
`,
          hints: ["Each method: base case first, then a call on a strictly smaller input.", "For power, compute the half once and square it — do not call power twice."],
          cases: [
            { stdin: "4\nsum 12345\npow 2 10\nrev abc\npow 3 0\n", expected: "15\n1024\ncba\n1\n" },
            { stdin: "3\nsum 0\npow 7 13\nrev a\n", expected: "0\n96889010407\na\n" },
            { stdin: "2\npow 2 62\nsum 9999999999\n", expected: "4611686018427387904\n90\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A recursive method without a reachable base case results in…",
          options: ["An infinite loop that never uses memory", "`StackOverflowError`", "A compile error", "`OutOfMemoryError`"],
          answer: 1,
          explanation: "Each call pushes a stack frame; with no base case the thread's stack is exhausted after a few thousand to tens of thousands of frames.",
        },
        {
          prompt: "Why is naive recursive Fibonacci exponential?",
          options: ["Java recursion is slow", "Each call spawns two calls and the same subproblems are recomputed many times", "`long` arithmetic is slow", "It is linear"],
          answer: 1,
          explanation: "`fib(n-2)` is computed inside both `fib(n-1)` and directly. Memoization stores each answer once and makes it linear.",
        },
        {
          prompt: "Does the JVM optimise tail recursion into a loop?",
          options: ["Yes, always", "No — a tail call still uses a frame", "Only with `-O2`", "Only for static methods"],
          answer: 1,
          explanation: "Java has no tail-call elimination. Linear-depth recursion over large inputs must be rewritten as iteration.",
        },
        {
          prompt: "A recursive binary search over a million elements has depth about…",
          options: ["1 000 000", "20", "1000", "500 000"],
          answer: 1,
          explanation: "Halving each time gives log₂(10⁶) ≈ 20 frames — recursion is safe when depth is logarithmic.",
        },
        {
          prompt: "In backtracking, after the recursive call returns you must…",
          options: ["Return immediately", "Undo the change made before the call so the next branch starts from the same state", "Clear the whole structure", "Call it again"],
          answer: 1,
          explanation: "Add-recurse-remove is the pattern: the shared `current` list must look the same for every sibling branch.",
        },
      ],
    },
    {
      slug: "scope-and-lifetime",
      file: "06-scope-and-lifetime.md",
      exercises: [
        {
          title: "Fix the shadowing",
          prompt: `The \`Point\` class below has two shadowing bugs: the constructor assigns the parameters to themselves, and \`move\` updates its parameters instead of the fields. Fix both using \`this\`, without renaming anything.

Then read a starting point \`x y\`, an integer \`n\`, and \`n\` moves \`dx dy\`; apply them and print \`(<x>, <y>)\`.

Example: \`1 2\`, \`2\`, \`3 4\`, \`-1 0\` → \`(3, 6)\``,
          starter: String.raw`import java.util.*;

class Point {
    private int x, y;

    Point(int x, int y) {
        x = x;
        y = y;
    }

    void move(int x, int y) {
        x = x + x;
        y = y + y;
    }

    public String toString() { return "(" + x + ", " + y + ")"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Point p = new Point(in.nextInt(), in.nextInt());
        int n = in.nextInt();
        for (int i = 0; i < n; i++) p.move(in.nextInt(), in.nextInt());
        System.out.println(p);
    }
}
`,
          solution: String.raw`import java.util.*;

class Point {
    private int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    void move(int x, int y) {
        this.x = this.x + x;
        this.y = this.y + y;
    }

    public String toString() { return "(" + x + ", " + y + ")"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Point p = new Point(in.nextInt(), in.nextInt());
        int n = in.nextInt();
        for (int i = 0; i < n; i++) p.move(in.nextInt(), in.nextInt());
        System.out.println(p);
    }
}
`,
          hints: ["Inside a method, a bare name that matches a parameter means the parameter; this.name is the field.", "In move, the field is this.x and the delta is x."],
          cases: [
            { stdin: "1 2\n2\n3 4\n-1 0\n", expected: "(3, 6)\n" },
            { stdin: "0 0\n0\n", expected: "(0, 0)\n" },
            { stdin: "5 -5\n3\n1 1\n1 1\n1 1\n", expected: "(8, -2)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`int t = 0; for (int i = 0; i < 3; i++) { int t = i; }` — result?",
          options: ["Compiles; inner `t` shadows the outer", "Compile error: a local cannot redeclare a name from an enclosing local scope", "Runtime error", "`t` becomes 2"],
          answer: 1,
          explanation: "Java forbids shadowing between locals in the same method. Only fields can be shadowed by locals or parameters.",
        },
        {
          prompt: "A method returns a `List` it created as a local variable. After the method returns…",
          options: ["The list is destroyed with the frame", "The list lives on — the caller holds a reference; only the local *variable* is gone", "The list becomes immutable", "It is copied"],
          answer: 1,
          explanation: "Scope belongs to the name; lifetime belongs to the object. Objects live while any reference reaches them.",
        },
        {
          prompt: "What does *effectively final* mean?",
          options: ["Declared `final`", "Never reassigned after initialisation, even without the keyword", "A constant expression", "A static field"],
          answer: 1,
          explanation: "Lambdas and inner classes may capture only such locals, because they copy the value and a later change would go unseen.",
        },
        {
          prompt: "Inside a static method, `this` is…",
          options: ["The class object", "Not available — there is no instance", "null", "The first parameter"],
          answer: 1,
          explanation: "Static code runs without an object; instance fields and methods need an explicit reference.",
        },
        {
          prompt: "In `void set(int x) { x = x; }` the field `x`…",
          options: ["Is set to the parameter", "Is untouched — both names refer to the parameter", "Is set to 0", "Causes a compile error"],
          answer: 1,
          explanation: "The parameter shadows the field, so the statement assigns the parameter to itself. `this.x = x` is the fix.",
        },
      ],
    },
    {
      slug: "methods-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Permutations by backtracking",
          prompt: `Read one word of 1–6 **distinct** lowercase letters. Print every permutation of its letters, one per line, in lexicographic order. Generate them recursively with backtracking: pick an unused letter (in alphabetical order), recurse, un-pick. Sort the letters first so the output is ordered without sorting afterwards.

Example: \`cab\` →
\`\`\`
abc
acb
bac
bca
cab
cba
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static char[] letters;
    static boolean[] used;
    static StringBuilder current = new StringBuilder();
    static StringBuilder out = new StringBuilder();

    static void permute() {
        // TODO: base case when current.length() == letters.length; otherwise try each unused letter
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        letters = in.next().toCharArray();
        Arrays.sort(letters);
        used = new boolean[letters.length];
        permute();
        System.out.print(out);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static char[] letters;
    static boolean[] used;
    static StringBuilder current = new StringBuilder();
    static StringBuilder out = new StringBuilder();

    static void permute() {
        if (current.length() == letters.length) {
            out.append(current).append('\n');
            return;
        }
        for (int i = 0; i < letters.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            current.append(letters[i]);
            permute();
            current.deleteCharAt(current.length() - 1);
            used[i] = false;
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        letters = in.next().toCharArray();
        Arrays.sort(letters);
        used = new boolean[letters.length];
        permute();
        System.out.print(out);
    }
}
`,
          hints: ["Mark used[i], append, recurse, then undo both.", "Sorted letters plus trying indices in order gives lexicographic output for free."],
          cases: [
            { stdin: "cab\n", expected: "abc\nacb\nbac\nbca\ncab\ncba\n" },
            { stdin: "a\n", expected: "a\n" },
            { stdin: "ba\n", expected: "ab\nba\n", hidden: true },
            { stdin: "dcba\n", expected: "abcd\nabdc\nacbd\nacdb\nadbc\nadcb\nbacd\nbadc\nbcad\nbcda\nbdac\nbdca\ncabd\ncadb\ncbad\ncbda\ncdab\ncdba\ndabc\ndacb\ndbac\ndbca\ndcab\ndcba\n", hidden: true },
          ],
        },
        {
          title: "Recursive binary search with a helper",
          prompt: `Read an integer \`n\`, then \`n\` integers in **non-decreasing** order, then an integer \`q\` and \`q\` query values. For each query print the index of the value in the array (any index if it occurs more than once) or \`-1\`.

Write a public wrapper \`static int search(int[] a, int target)\` that calls a private recursive helper \`search(int[] a, int target, int lo, int hi)\`. Compute the midpoint as \`lo + (hi - lo) / 2\`.`,
          starter: String.raw`import java.util.*;

public class Main {
    static int search(int[] a, int target) {
        return search(a, target, 0, a.length - 1);
    }

    private static int search(int[] a, int target, int lo, int hi) {
        // TODO
        return -1;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int q = in.nextInt();
        for (int i = 0; i < q; i++) System.out.println(search(a, in.nextInt()));
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static int search(int[] a, int target) {
        return search(a, target, 0, a.length - 1);
    }

    private static int search(int[] a, int target, int lo, int hi) {
        if (lo > hi) return -1;
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) return search(a, target, mid + 1, hi);
        return search(a, target, lo, mid - 1);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int q = in.nextInt();
        for (int i = 0; i < q; i++) System.out.println(search(a, in.nextInt()));
    }
}
`,
          hints: ["Base case: lo > hi means the value is absent.", "Recurse on the half that can contain the target."],
          cases: [
            { stdin: "5\n1 3 5 7 9\n3\n7 4 1\n", expected: "3\n-1\n0\n" },
            { stdin: "1\n42\n2\n42 41\n", expected: "0\n-1\n" },
            { stdin: "0\n1\n5\n", expected: "-1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which pair of methods can coexist in one class?",
          options: ["`int f(int a)` and `long f(int b)`", "`int f(int a)` and `int f(long a)`", "`void f(int a)` and `void f(int b)`", "`static int f()` and `int f()`"],
          answer: 1,
          explanation: "Only the second pair differs in parameter types. Return type, parameter names and `static` do not distinguish signatures.",
        },
        {
          prompt: "`static void f(int[] a) { a[0] = 9; a = new int[]{1}; }` — after `f(x)` where `x = {0}`, `x[0]` and `x.length` are…",
          options: ["1 and 1", "9 and 1", "0 and 1", "9 and 2"],
          answer: 1,
          explanation: "The mutation `a[0] = 9` reaches the shared array; the reassignment is local. `x` is the original one-element array with 9 in it.",
        },
        {
          prompt: "Overload resolution happens…",
          options: ["At run time, by the object's class", "At compile time, by the arguments' declared types", "At class-load time", "At JIT time"],
          answer: 1,
          explanation: "That is the defining difference between overloading (static) and overriding (dynamic dispatch).",
        },
        {
          prompt: "`f(5)` with `f(double)` and `f(Integer)` — which runs?",
          options: ["`f(Integer)`", "`f(double)` — primitive widening precedes boxing", "Ambiguous", "Neither"],
          answer: 1,
          explanation: "`int` widens to `double` in phase 1; boxing to `Integer` is phase 2.",
        },
        {
          prompt: "`show(new String[]{\"a\",\"b\"})` to `show(Object... xs)` gives `xs.length` =",
          options: ["1", "2 — a matching array is passed as the varargs array", "0", "Compile error"],
          answer: 1,
          explanation: "`String[]` is an `Object[]`, so it becomes the array itself. Cast to `Object` to make it a single element.",
        },
        {
          prompt: "How many stack frames does `factorial(5)` (recursing to `factorial(1)`) have live at its deepest point?",
          options: ["1", "5", "10", "None — recursion does not use the stack"],
          answer: 1,
          explanation: "Frames for n = 5, 4, 3, 2, 1 are all live until the base case returns; then they pop one by one.",
        },
        {
          prompt: "Which recursion is safe on an input of one million elements?",
          options: ["Recursive linear sum over the array", "Recursive binary search", "Recursive string reversal by `substring`", "Naive recursive Fibonacci"],
          answer: 1,
          explanation: "Only binary search has logarithmic depth (~20). The others have linear or exponential call depth/count.",
        },
        {
          prompt: "Memoization helps when…",
          options: ["The base case is missing", "The same subproblems recur (overlapping subproblems)", "Recursion is tail-recursive", "Inputs are strings"],
          answer: 1,
          explanation: "Storing each subproblem's answer turns exponential recomputation into linear work, as in Fibonacci.",
        },
        {
          prompt: "A parameter named like a field…",
          options: ["Is a compile error", "Shadows the field inside the method; `this.field` reaches the field", "Automatically assigns the field", "Is ignored"],
          answer: 1,
          explanation: "Legal and idiomatic in constructors and setters with `this.x = x`; a trap anywhere else.",
        },
        {
          prompt: "A lambda captures a local `int count` that is later incremented. The compiler…",
          options: ["Allows it", "Rejects it: captured locals must be effectively final", "Copies it silently", "Makes it volatile"],
          answer: 1,
          explanation: "Captured variables are copied; mutation after capture would be invisible, so Java forbids it. Use a field or a holder.",
        },
        {
          prompt: "`public static void main(String... args)` is…",
          options: ["Invalid", "A valid entry point — varargs is a `String[]` parameter", "Valid only with `-ea`", "Valid only in Java 21"],
          answer: 1,
          explanation: "`String...` compiles to exactly `String[]`, so the launcher accepts it.",
        },
        {
          prompt: "To return two values from a method, idiomatic Java uses…",
          options: ["Two `return` statements", "An out-parameter array", "A small object or record holding both", "A global variable"],
          answer: 2,
          explanation: "A method returns one value; make it a value that holds both. Records (Module 10) make this a one-liner.",
        },
      ],
    },
  ],
}, more);

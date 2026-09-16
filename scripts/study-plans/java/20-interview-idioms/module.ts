import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "interview-idioms",
  title: "Interview idioms",
  blurb: "The fast template and complexity budget, the equals/hashCode/Comparable contracts, the thirty pitfalls, the collections idiom sheet, clean solutions under pressure, and the Java theory drill.",
  icon: "trophy",
  overview: `Nineteen modules taught the language. This one teaches the round: how a Java interview is actually conducted, what is actually judged, and the small set of habits that turn knowing Java into passing.

It opens with the template — a fast reader, a flushed writer, solve separated from I/O — and the complexity budget that maps "n ≤ 10⁵" to the algorithm class you need before you design. The equals/hashCode/Comparable lesson states the contracts every collection depends on and the mistakes that break them. The pitfalls lesson is the thirty-item review pass — overflow, integer division, boxed ==, split's regex, the sort worst case, recursion depth — that catches most "correct but rejected" solutions. The idiom sheet names the fifteen shapes interview problems take and the two-to-six-line Java for each. Clean solutions under pressure is about legibility: structure, names, guard clauses, saying the complexity unprompted. The theory drill is thirty questions with the two-sentence answers.

The exercises are the problems interviewers set — top-k frequent, sliding-window maximum, balanced brackets, spiral order, min-stack, anagram groups, two-sum — written the way the module says to write them. The final checkpoint closes the plan.`,
  lessons: [
    {
      slug: "the-interview-template",
      file: "01-the-interview-template.md",
      exercises: [
        {
          title: "Read until the end",
          prompt: `Using the template's \`next()\` helper (which returns \`null\` at end of input — **no** \`Scanner\`), read every integer from standard input, however many lines there are. Print \`count=<n> sum=<sum> min=<min> max=<max>\` using \`long\`s, or just \`count=0\` when there are none. Write the answer through a flushed \`PrintWriter\`.

Example (three lines): \`3 9\`, \`-2\`, \`7 1\` →
\`\`\`
count=5 sum=18 min=-2 max=9
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) {
            String line = in.readLine();
            if (line == null) return null;
            st = new StringTokenizer(line);
        }
        return st.nextToken();
    }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        // TODO
        out.flush();
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) {
            String line = in.readLine();
            if (line == null) return null;
            st = new StringTokenizer(line);
        }
        return st.nextToken();
    }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        long count = 0, sum = 0, min = Long.MAX_VALUE, max = Long.MIN_VALUE;
        for (String t; (t = next()) != null; ) {
            long x = Long.parseLong(t);
            count++;
            sum += x;
            min = Math.min(min, x);
            max = Math.max(max, x);
        }
        if (count == 0) out.println("count=0");
        else out.println("count=" + count + " sum=" + sum + " min=" + min + " max=" + max);
        out.flush();
    }
}
`,
          hints: ["for (String t; (t = next()) != null; ) is the read-until-EOF loop.", "Long.MAX_VALUE / MIN_VALUE as sentinels are safe here because count=0 is handled separately."],
          cases: [
            { stdin: "3 9\n-2\n7 1\n", expected: "count=5 sum=18 min=-2 max=9\n" },
            { stdin: "\n", expected: "count=0\n" },
            { stdin: "9000000000\n\n\n-9000000000 5\n", expected: "count=3 sum=5 min=-9000000000 max=9000000000\n", hidden: true },
          ],
        },
        {
          title: "The complexity budget",
          prompt: `Read an integer \`n\` (\`1 ≤ n ≤ 10⁹\`). With a budget of \`100000000\` operations and \`log n\` taken as the bit length of \`n\` (\`32 - Integer.numberOfLeadingZeros(n)\`), print \`n=<n> budget=100000000\` and then, for each of \`n log n\`, \`n^2\`, \`n^3\` and \`2^n\` in that order, either \`<name>: <operations> fits\` or \`<name>: too slow\`. Use \`Math.multiplyExact\` on \`long\`s and treat an overflow as too slow; \`2^n\` is too slow for \`n ≥ 63\`.

Example: \`20\` →
\`\`\`
n=20 budget=100000000
n log n: 100 fits
n^2: 400 fits
n^3: 8000 fits
2^n: 1048576 fits
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static final long BUDGET = 100_000_000L;

    static String verdict(String name, long ops) {
        return ops <= BUDGET ? name + ": " + ops + " fits" : name + ": too slow";
    }

    public static void main(String[] args) {
        long n = new Scanner(System.in).nextLong();
        System.out.println("n=" + n + " budget=" + BUDGET);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static final long BUDGET = 100_000_000L;

    static String verdict(String name, long ops) {
        return ops <= BUDGET ? name + ": " + ops + " fits" : name + ": too slow";
    }

    static long safeMul(long a, long b) {
        try { return Math.multiplyExact(a, b); } catch (ArithmeticException e) { return Long.MAX_VALUE; }
    }

    public static void main(String[] args) {
        long n = new Scanner(System.in).nextLong();
        System.out.println("n=" + n + " budget=" + BUDGET);
        long log = 64 - Long.numberOfLeadingZeros(n);
        System.out.println(verdict("n log n", safeMul(n, log)));
        long n2 = safeMul(n, n);
        System.out.println(verdict("n^2", n2));
        System.out.println(verdict("n^3", safeMul(n2, n)));
        System.out.println(verdict("2^n", n >= 63 ? Long.MAX_VALUE : 1L << n));
    }
}
`,
          hints: ["multiplyExact throws on overflow — catch it and treat the result as infinite.", "1L << n for the power of two; n ≥ 63 would overflow, so short-circuit it."],
          cases: [
            { stdin: "20\n", expected: "n=20 budget=100000000\nn log n: 100 fits\nn^2: 400 fits\nn^3: 8000 fits\n2^n: 1048576 fits\n" },
            { stdin: "100000\n", expected: "n=100000 budget=100000000\nn log n: 1700000 fits\nn^2: too slow\nn^3: too slow\n2^n: too slow\n" },
            { stdin: "1000000000\n", expected: "n=1000000000 budget=100000000\nn log n: too slow\nn^2: too slow\nn^3: too slow\n2^n: too slow\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A Java solution can do roughly how many simple operations per second on a judge?",
          options: ["10⁴", "10⁶", "10⁸", "10¹²"],
          answer: 2,
          explanation: "The number the complexity budget is built on; heavy allocation lowers it.",
        },
        {
          prompt: "The statement says `n ≤ 10⁵`. Which complexity is the target?",
          options: ["O(n³)", "O(n²)", "O(n log n) or better", "O(2ⁿ)"],
          answer: 2,
          explanation: "O(n²) is 10¹⁰ operations — a hundred seconds.",
        },
        {
          prompt: "`mid = (lo + hi) / 2` is dangerous because…",
          options: ["It rounds up", "`lo + hi` can overflow `int`; use `lo + (hi - lo) / 2` or `>>> 1`", "It is slow", "It ignores `hi`"],
          answer: 1,
          explanation: "The famous bug in the JDK's own `binarySearch` for years.",
        },
        {
          prompt: "`\"\".split(\"\\\\s+\")` returns…",
          options: ["An empty array", "`[\"\"]` — one empty string, so check for it before parsing", "`null`", "Throws"],
          answer: 1,
          explanation: "The whole-input read pattern must handle empty input explicitly.",
        },
        {
          prompt: "A 256 MB memory limit comfortably fits…",
          options: ["A `List<Integer>` of 50 million", "An `int[]` of 50 million (200 MB)", "A `String` per integer for 50 million", "50 million `Integer` objects"],
          answer: 1,
          explanation: "Boxed collections cost 4–5× the memory of primitive arrays.",
        },
      ],
    },
    {
      slug: "equals-hashcode-and-comparable",
      file: "02-equals-hashcode-and-comparable.md",
      exercises: [
        {
          title: "Point as a key",
          prompt: `Write a class \`Point\` with \`int x, y\`, a correct \`equals(Object)\` and a consistent \`hashCode\` (not a record — do it by hand). Read an integer \`n\` and \`n\` points, then \`m\` and \`m\` query points. Print \`distinct=<size of a HashSet of the points>\`, then for each query \`(x,y): present\` or \`(x,y): absent\`, then \`hashAgree=<whether two separately constructed equal points have equal hash codes>\`.

Example: \`3\` then \`1 2\`, \`1 2\`, \`3 4\`, then \`2\` then \`1 2\`, \`2 1\` →
\`\`\`
distinct=2
(1,2): present
(2,1): absent
hashAgree=true
\`\`\``,
          starter: String.raw`import java.util.*;

final class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    // TODO: equals and hashCode
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(new Point(in.nextInt(), in.nextInt()));
        System.out.println("distinct=" + set.size());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            int x = in.nextInt(), y = in.nextInt();
            System.out.println("(" + x + "," + y + "): " + (set.contains(new Point(x, y)) ? "present" : "absent"));
        }
        System.out.println("hashAgree=" + (new Point(1, 2).hashCode() == new Point(1, 2).hashCode()));
    }
}
`,
          solution: String.raw`import java.util.*;

final class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() { return 31 * Integer.hashCode(x) + Integer.hashCode(y); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(new Point(in.nextInt(), in.nextInt()));
        System.out.println("distinct=" + set.size());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            int x = in.nextInt(), y = in.nextInt();
            System.out.println("(" + x + "," + y + "): " + (set.contains(new Point(x, y)) ? "present" : "absent"));
        }
        System.out.println("hashAgree=" + (new Point(1, 2).hashCode() == new Point(1, 2).hashCode()));
    }
}
`,
          hints: ["equals takes Object; check identity, null and class, then the fields.", "Without hashCode the set would report every point distinct — HashSet finds the bucket first."],
          cases: [
            { stdin: "3\n1 2\n1 2\n3 4\n2\n1 2\n2 1\n", expected: "distinct=2\n(1,2): present\n(2,1): absent\nhashAgree=true\n" },
            { stdin: "1\n0 0\n1\n0 0\n", expected: "distinct=1\n(0,0): present\nhashAgree=true\n" },
            { stdin: "4\n-1 5\n5 -1\n-1 5\n5 -1\n3\n-1 5\n5 -1\n0 0\n", expected: "distinct=2\n(-1,5): present\n(5,-1): present\n(0,0): absent\nhashAgree=true\n", hidden: true },
          ],
        },
        {
          title: "Sort by many keys",
          prompt: `Write \`record Employee(String dept, String name, int salary) implements Comparable<Employee>\` whose natural order is department ascending, then salary **descending**, then name ascending — using \`Integer.compare\`, never subtraction. Read an integer \`n\` and \`n\` employees \`dept name salary\`, sort them, and print \`<dept> <name> <salary>\` per line. Then print \`richest=<name of the highest salary; ties to the earliest in input>\` using \`Collections.max\` with \`Comparator.comparingInt\`, and \`byName=<names sorted alphabetically, comma-separated>\` using \`Comparator.comparing\`.

Example: \`3\` then \`eng ann 100\`, \`ops bob 90\`, \`eng cy 120\` →
\`\`\`
eng cy 120
eng ann 100
ops bob 90
richest=cy
byName=ann,bob,cy
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

record Employee(String dept, String name, int salary) implements Comparable<Employee> {
    public int compareTo(Employee o) {
        // TODO
        return 0;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> staff = new ArrayList<>();
        for (int i = 0; i < n; i++) staff.add(new Employee(in.next(), in.next(), in.nextInt()));
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

record Employee(String dept, String name, int salary) implements Comparable<Employee> {
    public int compareTo(Employee o) {
        int c = dept.compareTo(o.dept);
        if (c != 0) return c;
        c = Integer.compare(o.salary, salary);
        return c != 0 ? c : name.compareTo(o.name);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> staff = new ArrayList<>();
        for (int i = 0; i < n; i++) staff.add(new Employee(in.next(), in.next(), in.nextInt()));
        List<Employee> sorted = new ArrayList<>(staff);
        Collections.sort(sorted);
        for (Employee e : sorted) System.out.println(e.dept() + " " + e.name() + " " + e.salary());
        Employee richest = Collections.max(staff, Comparator.comparingInt(Employee::salary));
        System.out.println("richest=" + richest.name());
        System.out.println("byName=" + staff.stream().sorted(Comparator.comparing(Employee::name)).map(Employee::name).collect(Collectors.joining(",")));
    }
}
`,
          hints: ["Descending salary: Integer.compare(o.salary, salary) — swap the operands rather than negating.", "Collections.max returns the first of equal maxima in iteration order."],
          cases: [
            { stdin: "3\neng ann 100\nops bob 90\neng cy 120\n", expected: "eng cy 120\neng ann 100\nops bob 90\nrichest=cy\nbyName=ann,bob,cy\n" },
            { stdin: "2\nx zed 50\nx amy 50\n", expected: "x amy 50\nx zed 50\nrichest=zed\nbyName=amy,zed\n" },
            { stdin: "4\nb q 1\na r 2\na p 2\nb s 3\n", expected: "a p 2\na r 2\nb s 3\nb q 1\nrichest=s\nbyName=p,q,r,s\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A class overrides `equals` but not `hashCode`. In a `HashMap`…",
          options: ["Everything works", "Equal keys may land in different buckets, so `get` misses keys that are present", "It throws", "Keys are sorted"],
          answer: 1,
          explanation: "Bucket first, `equals` second — both must agree.",
        },
        {
          prompt: "`public boolean equals(Point other)` is…",
          options: ["A correct override", "An overload — `HashMap` calls `equals(Object)`, which is still the identity default", "Faster", "Required for records"],
          answer: 1,
          explanation: "Always `@Override public boolean equals(Object o)`.",
        },
        {
          prompt: "`return a - b;` in a comparator is wrong because…",
          options: ["It is slow", "It overflows for operands of opposite sign, breaking antisymmetry — `Integer.compare`", "It returns `long`", "It is fine"],
          answer: 1,
          explanation: "TimSort detects the inconsistency: 'Comparison method violates its general contract'.",
        },
        {
          prompt: "A `TreeSet` of objects whose `compareTo` returns 0 for unequal objects…",
          options: ["Stores both", "Keeps only one — tree collections use `compareTo`, not `equals`", "Throws", "Sorts them randomly"],
          answer: 1,
          explanation: "Keep `compareTo` consistent with `equals`, or add a tie-breaker.",
        },
        {
          prompt: "Predict: a `List<Integer>` key `[1, 2]` is added to a `HashSet`, then `3` is appended to that same list. `set.contains(key)` is…",
          options: ["`true`", "`false` — the hash changed, the entry is in the old bucket", "Throws", "`true` after rehash"],
          answer: 1,
          explanation: "Mutable keys leak and break lookups; use immutable keys.",
        },
        {
          prompt: "Object sorts in Java (`List.sort`, `Arrays.sort(T[])`) are…",
          options: ["Unstable quicksort", "Stable (TimSort): equal elements keep their input order", "Random", "Bubble sort"],
          answer: 1,
          explanation: "So 'sort by score, ties by input order' needs no extra key. Primitive `Arrays.sort(int[])` is dual-pivot quicksort.",
        },
      ],
    },
    {
      slug: "pitfalls-that-fail-interviews",
      file: "03-pitfalls-that-fail-interviews.md",
      exercises: [
        {
          title: "Exact arithmetic",
          prompt: `Read an integer \`n\` and \`n\` lines \`a op b\` with \`long\` operands and \`op\` one of \`+ - * % /\` (\`b\` is never 0). For \`+\`, \`-\` and \`*\` print the exact result via \`Math.addExact\`/\`subtractExact\`/\`multiplyExact\`, or \`overflow\` if it throws. For \`%\` print \`rem=<a % b> mod=<Math.floorMod(a, b)>\`; for \`/\` print \`div=<a / b> floor=<Math.floorDiv(a, b)>\`.

Example: \`4\` then \`9223372036854775807 + 1\`, \`-7 % 3\`, \`-7 / 2\`, \`6 * 7\` →
\`\`\`
overflow
rem=-1 mod=2
div=-3 floor=-4
42
\`\`\``,
          starter: String.raw`import java.util.*;

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
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong();
            String op = in.next();
            long b = in.nextLong();
            try {
                switch (op) {
                    case "+" -> System.out.println(Math.addExact(a, b));
                    case "-" -> System.out.println(Math.subtractExact(a, b));
                    case "*" -> System.out.println(Math.multiplyExact(a, b));
                    case "%" -> System.out.println("rem=" + (a % b) + " mod=" + Math.floorMod(a, b));
                    default -> System.out.println("div=" + (a / b) + " floor=" + Math.floorDiv(a, b));
                }
            } catch (ArithmeticException e) {
                System.out.println("overflow");
            }
        }
    }
}
`,
          hints: ["The *Exact methods throw ArithmeticException instead of wrapping.", "% takes the sign of the dividend; floorMod takes the sign of the divisor."],
          cases: [
            { stdin: "4\n9223372036854775807 + 1\n-7 % 3\n-7 / 2\n6 * 7\n", expected: "overflow\nrem=-1 mod=2\ndiv=-3 floor=-4\n42\n" },
            { stdin: "3\n-9223372036854775808 - 1\n4000000000 * 4000000000\n7 % -3\n", expected: "overflow\noverflow\nrem=1 mod=-2\n" },
            { stdin: "3\n100 / 7\n-100 / 7\n3037000499 * 3037000499\n", expected: "div=14 floor=14\ndiv=-14 floor=-15\n9223372030926249001\n", hidden: true },
          ],
        },
        {
          title: "Predict, then verify",
          prompt: `Read an integer \`k\` and \`k\` expression ids in \`1..15\`. For each id print \`<id>: <value>\`, where the value is what Java computes for the expression — write each expression literally, do not hard-code the answers, and **predict every line before running**:

| id | expression | | id | expression |
| --- | --- | --- | --- | --- |
| 1 | \`(int) 3.99\` | | 9 | \`-7 / 2\` |
| 2 | \`7 / 2\` | | 10 | \`-7 % 3\` |
| 3 | \`7 / 2.0\` | | 11 | \`"1" + 2 + 3\` |
| 4 | \`'a' + 1\` | | 12 | \`1 + 2 + "3"\` |
| 5 | \`(char) ('a' + 1)\` | | 13 | \`"a.b".split(".").length\` |
| 6 | \`Integer.MAX_VALUE + 1\` | | 14 | \`"a,b,,".split(",").length\` |
| 7 | \`Math.abs(Integer.MIN_VALUE)\` | | 15 | \`Integer.valueOf(128) == Integer.valueOf(128)\` |
| 8 | \`0.1 + 0.2 == 0.3\` | | | |

Example: \`3\` then \`2 3 11\` →
\`\`\`
2: 3
3: 3.5
11: 123
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static String eval(int id) {
        return switch (id) {
            case 1 -> String.valueOf((int) 3.99);
            // TODO: 2..15
            default -> "?";
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        for (int i = 0; i < k; i++) {
            int id = in.nextInt();
            System.out.println(id + ": " + eval(id));
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static String eval(int id) {
        return switch (id) {
            case 1 -> String.valueOf((int) 3.99);
            case 2 -> String.valueOf(7 / 2);
            case 3 -> String.valueOf(7 / 2.0);
            case 4 -> String.valueOf('a' + 1);
            case 5 -> String.valueOf((char) ('a' + 1));
            case 6 -> String.valueOf(Integer.MAX_VALUE + 1);
            case 7 -> String.valueOf(Math.abs(Integer.MIN_VALUE));
            case 8 -> String.valueOf(0.1 + 0.2 == 0.3);
            case 9 -> String.valueOf(-7 / 2);
            case 10 -> String.valueOf(-7 % 3);
            case 11 -> "1" + 2 + 3;
            case 12 -> 1 + 2 + "3";
            case 13 -> String.valueOf("a.b".split(".").length);
            case 14 -> String.valueOf("a,b,,".split(",").length);
            case 15 -> String.valueOf(Integer.valueOf(128) == Integer.valueOf(128));
            default -> "?";
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        for (int i = 0; i < k; i++) {
            int id = in.nextInt();
            System.out.println(id + ": " + eval(id));
        }
    }
}
`,
          hints: ["String.valueOf turns any primitive result into the printed text.", "Concatenation is left to right: \"1\" + 2 + 3 is \"12\" + 3; 1 + 2 + \"3\" is 3 + \"3\"."],
          cases: [
            { stdin: "3\n2 3 11\n", expected: "2: 3\n3: 3.5\n11: 123\n" },
            { stdin: "6\n1 4 5 6 7 8\n", expected: "1: 3\n4: 98\n5: b\n6: -2147483648\n7: -2147483648\n8: false\n" },
            { stdin: "6\n9 10 12 13 14 15\n", expected: "9: -3\n10: -1\n12: 33\n13: 0\n14: 2\n15: false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`-7 % 3` in Java is…",
          options: ["`2`", "`-1` — the remainder takes the sign of the dividend; `Math.floorMod` gives `2`", "`1`", "`-2`"],
          answer: 1,
          explanation: "Circular indexes and hashing need `floorMod`.",
        },
        {
          prompt: "`\"a.b\".split(\".\")` returns…",
          options: ["`[\"a\", \"b\"]`", "An empty array — `.` is a regex matching every character, and trailing empties are removed", "`[\"a.b\"]`", "Throws"],
          answer: 1,
          explanation: "`split(\"\\\\.\")` or `split(Pattern.quote(\".\"))`.",
        },
        {
          prompt: "`Arrays.sort(int[])` on adversarial judge input…",
          options: ["Is always O(n log n)", "Can hit dual-pivot quicksort's O(n²) worst case — shuffle first or sort boxed/`List`", "Throws", "Is stable"],
          answer: 1,
          explanation: "Object sorts use TimSort, which is guaranteed O(n log n) and stable.",
        },
        {
          prompt: "Predict: `List<Integer> l = new ArrayList<>(List.of(5, 6, 7)); l.remove(1); System.out.println(l);`",
          options: ["`[5, 7]` — index 1 removed", "`[5, 6, 7]`", "`[6, 7]`", "`[5, 6]`"],
          answer: 0,
          explanation: "`remove(int)` is by index; `remove(Integer.valueOf(1))` would search for the value 1 (absent).",
        },
        {
          prompt: "A recursive DFS on a path graph of 10⁵ nodes in Java…",
          options: ["Works fine", "Likely throws `StackOverflowError` — iterate with an explicit stack or use a thread with a larger stack", "Is O(n²)", "Needs `volatile`"],
          answer: 1,
          explanation: "Default stacks hold roughly 10⁴–2 × 10⁴ frames.",
        },
        {
          prompt: "`Math.abs(Integer.MIN_VALUE)` is…",
          options: ["`2147483648`", "`Integer.MIN_VALUE` — still negative", "`0`", "Throws"],
          answer: 1,
          explanation: "The positive value does not fit in `int`; use `long`.",
        },
      ],
    },
    {
      slug: "collections-idioms",
      file: "04-collections-idioms.md",
      exercises: [
        {
          title: "Top-k frequent words",
          prompt: `Read an integer \`n\`, \`n\` words, and \`k\`. Count with a frequency map, then keep the \`k\` most frequent words with a **min-heap of size k** (\`PriorityQueue\` ordered by count ascending, ties by word **descending**, so the alphabetically earlier word survives a tie). Print the survivors most frequent first, ties alphabetical, as \`<word> <count>\`.

Example: \`7\` then \`b a c a b a d\` then \`2\` →
\`\`\`
a 3
b 2
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> freq = new HashMap<>();
        for (int i = 0; i < n; i++) freq.merge(in.next(), 1, Integer::sum);
        int k = in.nextInt();
        // TODO: min-heap of size k, then print
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> freq = new HashMap<>();
        for (int i = 0; i < n; i++) freq.merge(in.next(), 1, Integer::sum);
        int k = in.nextInt();
        Comparator<Map.Entry<String, Integer>> heapOrder =
            Map.Entry.<String, Integer>comparingByValue().thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder()));
        PriorityQueue<Map.Entry<String, Integer>> heap = new PriorityQueue<>(heapOrder);
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            heap.offer(e);
            if (heap.size() > k) heap.poll();
        }
        List<Map.Entry<String, Integer>> top = new ArrayList<>(heap);
        top.sort(heapOrder.reversed());
        for (Map.Entry<String, Integer> e : top) System.out.println(e.getKey() + " " + e.getValue());
    }
}
`,
          hints: ["The heap's head is the weakest survivor; poll it whenever size exceeds k.", "Sorting the k survivors with the reversed heap order gives the final output order."],
          cases: [
            { stdin: "7\nb a c a b a d\n2\n", expected: "a 3\nb 2\n" },
            { stdin: "4\nz y x w\n2\n", expected: "w 1\nx 1\n" },
            { stdin: "6\nq q p p r s\n3\n", expected: "p 2\nq 2\nr 1\n", hidden: true },
          ],
        },
        {
          title: "Sliding-window maximum",
          prompt: `Read an integer \`n\`, \`n\` integers, and a window size \`w\` (\`1 ≤ w ≤ n\`). Print the maximum of every window of \`w\` consecutive elements, space-separated, in O(n) using a **monotonic deque of indexes** (values decreasing from front to back; drop indexes that leave the window from the front).

Example: \`8\` then \`1 3 -1 -3 5 3 6 7\` then \`3\` →
\`\`\`
3 3 5 5 6 7
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int w = in.nextInt();
        Deque<Integer> dq = new ArrayDeque<>();
        StringBuilder out = new StringBuilder();
        // TODO
        System.out.println(out.toString().trim());
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int w = in.nextInt();
        Deque<Integer> dq = new ArrayDeque<>();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            while (!dq.isEmpty() && dq.peekFirst() <= i - w) dq.pollFirst();
            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
            dq.offerLast(i);
            if (i >= w - 1) out.append(a[dq.peekFirst()]).append(' ');
        }
        System.out.println(out.toString().trim());
    }
}
`,
          hints: ["Front of the deque is always the current window's maximum index.", "Pop smaller-or-equal values from the back before pushing — they can never be a future maximum."],
          cases: [
            { stdin: "8\n1 3 -1 -3 5 3 6 7\n3\n", expected: "3 3 5 5 6 7\n" },
            { stdin: "1\n9\n1\n", expected: "9\n" },
            { stdin: "5\n5 4 3 2 1\n2\n", expected: "5 4 3 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "To keep the k **largest** of n values in a heap you use…",
          options: ["A max-heap of size n", "A min-heap of size k — evict the smallest whenever it grows past k", "A `TreeSet`", "A sorted `ArrayList`"],
          answer: 1,
          explanation: "O(n log k); for k near n, just sort.",
        },
        {
          prompt: "`counts.merge(word, 1, Integer::sum)` replaces…",
          options: ["A `for` loop", "`counts.put(word, counts.getOrDefault(word, 0) + 1)`", "`counts.remove(word)`", "A `TreeMap`"],
          answer: 1,
          explanation: "The frequency-map idiom in one call; atomic on `ConcurrentHashMap` too.",
        },
        {
          prompt: "The monotonic deque for sliding-window maximum holds…",
          options: ["The window's values sorted", "Indexes whose values decrease front to back; the front is the current maximum", "All indexes", "Only the maximum"],
          answer: 1,
          explanation: "Each index enters and leaves once — O(n) total.",
        },
        {
          prompt: "Nearest key ≤ x in a sorted map is…",
          options: ["`map.get(x)`", "`treeMap.floorKey(x)` — O(log n)", "`headMap(x).size()`", "A linear scan"],
          answer: 1,
          explanation: "`ceilingKey`, `lowerKey`, `higherKey` are its siblings.",
        },
        {
          prompt: "Counting subarrays with sum `k` in O(n) uses…",
          options: ["Two nested loops", "A running prefix sum and a map from prefix value to how many times it has occurred", "Sorting", "A heap"],
          answer: 1,
          explanation: "`count += seen.getOrDefault(run - k, 0)`; seed the map with `{0: 1}`; prefixes in `long`.",
        },
        {
          prompt: "For a stack in Java you should use…",
          options: ["`java.util.Stack`", "`ArrayDeque` via `push`/`pop`/`peek`", "`LinkedList`", "`Vector`"],
          answer: 1,
          explanation: "`Stack` is a synchronised `Vector`; `ArrayDeque` is the idiom (no nulls).",
        },
      ],
    },
    {
      slug: "writing-clean-solutions",
      file: "05-writing-clean-solutions.md",
      exercises: [
        {
          title: "Balanced brackets, cleanly",
          prompt: `Read lines until end of input. For each line decide whether its brackets \`()[]{}\` are balanced (other characters are ignored). Print \`balanced\`, or \`unbalanced at <index>\` where the index is the position of the first closing bracket that does not match, or — if some opening brackets are never closed — the position of the **earliest** unclosed opener. Structure the solution with small helpers (\`isOpener\`, \`matches\`) and a pure \`check(String)\` that returns the index or \`-1\`.

Example input
\`\`\`
{a[b](c)}
(]
((x)
\`\`\`
→
\`\`\`
balanced
unbalanced at 1
unbalanced at 0
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static boolean isOpener(char c) { return c == '(' || c == '[' || c == '{'; }
    static boolean isCloser(char c) { return c == ')' || c == ']' || c == '}'; }
    static boolean matches(char open, char close) {
        // TODO
        return false;
    }

    /** Index of the first offending bracket, or -1 when balanced. */
    static int check(String s) {
        // TODO
        return -1;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            int at = check(line);
            System.out.println(at < 0 ? "balanced" : "unbalanced at " + at);
        }
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static boolean isOpener(char c) { return c == '(' || c == '[' || c == '{'; }
    static boolean isCloser(char c) { return c == ')' || c == ']' || c == '}'; }
    static boolean matches(char open, char close) {
        return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
    }

    /** Index of the first offending bracket, or -1 when balanced. */
    static int check(String s) {
        Deque<Integer> openers = new ArrayDeque<>();      // indexes of unmatched openers
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (isOpener(c)) openers.push(i);
            else if (isCloser(c)) {
                if (openers.isEmpty() || !matches(s.charAt(openers.peek()), c)) return i;
                openers.pop();
            }
        }
        return openers.isEmpty() ? -1 : openers.peekLast();   // the earliest unclosed opener sits at the bottom
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            int at = check(line);
            System.out.println(at < 0 ? "balanced" : "unbalanced at " + at);
        }
    }
}
`,
          hints: ["Push indexes, not characters — the index is what you must report.", "With push() on an ArrayDeque, peekLast() is the bottom of the stack: the earliest unclosed opener."],
          cases: [
            { stdin: "{a[b](c)}\n(]\n((x)\n", expected: "balanced\nunbalanced at 1\nunbalanced at 0\n" },
            { stdin: "\n)\n", expected: "balanced\nunbalanced at 0\n" },
            { stdin: "[({})]\n[(])\nabc[\n", expected: "balanced\nunbalanced at 2\nunbalanced at 3\n", hidden: true },
          ],
        },
        {
          title: "Spiral order",
          prompt: `Read \`r\` and \`c\` and an \`r × c\` matrix of integers. Print its elements in clockwise spiral order, space-separated, starting from the top-left. Write it with four bounds (\`top\`, \`bottom\`, \`left\`, \`right\`) and a helper per side, so the loop body reads as the four moves.

Example: \`3 4\` then \`1 2 3 4\` / \`5 6 7 8\` / \`9 10 11 12\` →
\`\`\`
1 2 3 4 8 12 11 10 9 5 6 7
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] m = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextInt();
        List<Integer> out = new ArrayList<>();
        int top = 0, bottom = r - 1, left = 0, right = c - 1;
        // TODO
        StringBuilder sb = new StringBuilder();
        for (int x : out) sb.append(x).append(' ');
        System.out.println(sb.toString().trim());
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] m = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextInt();
        List<Integer> out = new ArrayList<>();
        int top = 0, bottom = r - 1, left = 0, right = c - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) out.add(m[top][j]);          // top row, left → right
            for (int i = top + 1; i <= bottom; i++) out.add(m[i][right]);    // right column, down
            if (top < bottom) for (int j = right - 1; j >= left; j--) out.add(m[bottom][j]);   // bottom row, right → left
            if (left < right) for (int i = bottom - 1; i > top; i--) out.add(m[i][left]);      // left column, up
            top++; bottom--; left++; right--;
        }
        StringBuilder sb = new StringBuilder();
        for (int x : out) sb.append(x).append(' ');
        System.out.println(sb.toString().trim());
    }
}
`,
          hints: ["Guard the bottom row and left column with top < bottom / left < right so a single remaining row or column is not read twice.", "Shrink all four bounds after each lap."],
          cases: [
            { stdin: "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n", expected: "1 2 3 4 8 12 11 10 9 5 6 7\n" },
            { stdin: "1 1\n7\n", expected: "7\n" },
            { stdin: "4 1\n1\n2\n3\n4\n", expected: "1 2 3 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Separating `solve(int[] a)` from `main`'s I/O mainly buys…",
          options: ["Speed", "Testability, readability, and easy adaptation when the input source changes", "Fewer imports", "Nothing"],
          answer: 1,
          explanation: "A pure function can be checked in your head and reused when the question changes.",
        },
        {
          prompt: "A guard clause like `if (n == 0) return 0;` at the top of a method…",
          options: ["Is bad style", "Makes an edge case visible and keeps the main algorithm free of special cases", "Slows the method", "Should be in a `finally`"],
          answer: 1,
          explanation: "One line per edge case, each a sentence.",
        },
        {
          prompt: "The highest-leverage sentence to say unprompted after coding is…",
          options: ["\"I think it works\"", "The time and space complexity, and the trade-off you considered", "\"Java is verbose\"", "The line count"],
          answer: 1,
          explanation: "It shows you know what you built and that you weighed the alternative.",
        },
        {
          prompt: "Good comments in a solution explain…",
          options: ["What each line does", "Why a non-obvious decision or invariant holds", "The language syntax", "Nothing — no comments"],
          answer: 1,
          explanation: "'a is sorted, so once a[i] > target no later pair can work' — not 'increment i'.",
        },
        {
          prompt: "When stuck, the right move is…",
          options: ["Silence until it clicks", "Say what you know, write a clean labelled brute force, and grow it", "Give up", "Change the problem"],
          answer: 1,
          explanation: "Partial credit and, often, the optimisation reveals itself from the baseline.",
        },
      ],
    },
    {
      slug: "java-theory-drill",
      file: "06-java-theory-drill.md",
      exercises: [
        {
          title: "Static versus dynamic dispatch",
          prompt: `Write \`class Animal { String name = "animal"; String speak() { return "..."; } }\`, \`class Dog extends Animal\` (field \`name = "dog"\`, \`speak()\` returns \`Woof\`) and \`class Cat extends Animal\` (\`name = "cat"\`, \`Meow\`). Add three static overloads \`describe(Animal)\`, \`describe(Dog)\`, \`describe(Cat)\` returning \`describe(Animal)\`, \`describe(Dog)\` and \`describe(Cat)\`. Read \`n\` and \`n\` words \`dog\`/\`cat\`; for each, with \`Animal a = …\`, print one line:

\`<word>: speak=<a.speak()> describe=<describe(a)> cast=<describe(…) after a pattern-instanceof cast to the real type> field=<a.name>\`

Predict before running: the override is chosen at run time, the overload at compile time, and the field by the static type.

Example: \`2\` then \`dog cat\` →
\`\`\`
dog: speak=Woof describe=describe(Animal) cast=describe(Dog) field=animal
cat: speak=Meow describe=describe(Animal) cast=describe(Cat) field=animal
\`\`\``,
          starter: String.raw`import java.util.*;

class Animal { String name = "animal"; String speak() { return "..."; } }
// TODO: Dog and Cat

public class Main {
    static String describe(Animal a) { return "describe(Animal)"; }
    // TODO: describe(Dog), describe(Cat)

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String word = in.next();
            Animal a = word.equals("dog") ? new Dog() : new Cat();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class Animal { String name = "animal"; String speak() { return "..."; } }
class Dog extends Animal { String name = "dog"; @Override String speak() { return "Woof"; } }
class Cat extends Animal { String name = "cat"; @Override String speak() { return "Meow"; } }

public class Main {
    static String describe(Animal a) { return "describe(Animal)"; }
    static String describe(Dog d) { return "describe(Dog)"; }
    static String describe(Cat c) { return "describe(Cat)"; }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String word = in.next();
            Animal a = word.equals("dog") ? new Dog() : new Cat();
            String cast = a instanceof Dog d ? describe(d) : describe((Cat) a);
            System.out.println(word + ": speak=" + a.speak() + " describe=" + describe(a) + " cast=" + cast + " field=" + a.name);
        }
    }
}
`,
          hints: ["Overload resolution uses the declared type of the argument: describe(a) with Animal a always picks describe(Animal).", "Fields are not virtual — a.name reads Animal's field even though the object is a Dog."],
          cases: [
            { stdin: "2\ndog cat\n", expected: "dog: speak=Woof describe=describe(Animal) cast=describe(Dog) field=animal\ncat: speak=Meow describe=describe(Animal) cast=describe(Cat) field=animal\n" },
            { stdin: "1\ncat\n", expected: "cat: speak=Meow describe=describe(Animal) cast=describe(Cat) field=animal\n" },
            { stdin: "3\ndog dog cat\n", expected: "dog: speak=Woof describe=describe(Animal) cast=describe(Dog) field=animal\ndog: speak=Woof describe=describe(Animal) cast=describe(Dog) field=animal\ncat: speak=Meow describe=describe(Animal) cast=describe(Cat) field=animal\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "JDK, JRE, JVM — in one sentence:",
          options: ["Three names for the same thing", "The JVM runs bytecode; the JRE is JVM + library; the JDK is JRE + compiler and tools", "The JDK runs bytecode", "The JRE compiles"],
          answer: 1,
          explanation: "Lead with the definition, add the consequence, stop.",
        },
        {
          prompt: "Java is…",
          options: ["Pass-by-reference for objects", "Strictly pass-by-value; for objects the copied value is the reference", "Pass-by-name", "Pass-by-reference for primitives"],
          answer: 1,
          explanation: "Callees can mutate the object but never rebind the caller's variable.",
        },
        {
          prompt: "Overloading versus overriding is resolved…",
          options: ["Both at run time", "Overloading at compile time by static argument types; overriding at run time by the object's class", "Both at compile time", "By the JIT"],
          answer: 1,
          explanation: "Hence `describe(Animal)` for an `Animal` reference to a `Dog`, but `Dog.speak()`.",
        },
        {
          prompt: "Abstract class versus interface — the deciding factor is…",
          options: ["Speed", "Whether shared *state* is needed (abstract class) versus a contract with possibly multiple inheritance (interface)", "The Java version", "Nothing"],
          answer: 1,
          explanation: "Prefer interfaces; `default` methods cover shared behaviour without state.",
        },
        {
          prompt: "Type erasure means…",
          options: ["Generics are checked at run time", "Generic type information is removed after compilation; `List<String>` is `List` at run time", "You can create `new T[]`", "Generics are slower"],
          answer: 1,
          explanation: "So no `instanceof List<String>`, no generic arrays, one class for all instantiations.",
        },
        {
          prompt: "If `hashCode` returned the same constant for every key, `HashMap.get` would be…",
          options: ["O(1)", "O(n) — one bucket, a chain — or O(log n) once the bin treeifies for `Comparable` keys", "Impossible", "O(1) after resize"],
          answer: 1,
          explanation: "Java 8's treeification bounds the damage; a good hash avoids it.",
        },
        {
          prompt: "`String` is immutable partly because…",
          options: ["It is faster to copy", "Safety, sharing through the pool, cached hash codes and free thread safety", "It cannot hold Unicode", "Java lacks `char`"],
          answer: 1,
          explanation: "`StringBuilder` is the separate mutable class for building.",
        },
        {
          prompt: "`volatile` versus `synchronized`:",
          options: ["Interchangeable", "Visibility and ordering for one field versus mutual exclusion plus visibility for compound updates", "`volatile` is a lock", "`synchronized` only orders reads"],
          answer: 1,
          explanation: "A flag or a published immutable reference versus `count++` and check-then-act.",
        },
      ],
    },
    {
      slug: "interview-idioms-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Two sum, both ways",
          prompt: `Read an integer \`n\`, \`n\` integers and a target \`t\`. Print \`pair=<i> <j>\` for the first pair found scanning left to right with a hash map from value to its **first** index — that is, the smallest \`j\` such that \`t - a[j]\` appeared earlier, with \`i\` the first index of that value — or \`pair=none\`. Then print \`pairs=<number of index pairs i < j with a[i] + a[j] = t>\`, computed in O(n) from a frequency map (handle the case where both values are equal).

Example: \`6\` then \`3 5 2 5 1 4\` then \`6\` →
\`\`\`
pair=1 4
pairs=3
\`\`\`
(The 1 at index 4 completes the 5 first seen at index 1. The pairs summing to 6 are (1,4), (3,4) and (2,5).)`,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = in.nextLong();
        long t = in.nextLong();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = in.nextLong();
        long t = in.nextLong();

        Map<Long, Integer> firstIndex = new HashMap<>();
        String pair = "none";
        for (int j = 0; j < n; j++) {
            Integer i = firstIndex.get(t - a[j]);
            if (i != null) { pair = i + " " + j; break; }
            firstIndex.putIfAbsent(a[j], j);
        }
        System.out.println("pair=" + pair);

        Map<Long, Long> freq = new HashMap<>();
        for (long x : a) freq.merge(x, 1L, Long::sum);
        long pairs = 0;
        for (Map.Entry<Long, Long> e : freq.entrySet()) {
            long x = e.getKey(), f = e.getValue(), y = t - x;
            if (x < y) pairs += f * freq.getOrDefault(y, 0L);
            else if (x == y) pairs += f * (f - 1) / 2;
        }
        System.out.println("pairs=" + pairs);
    }
}
`,
          hints: [
            "Look the complement up before inserting the current value — a value must not pair with itself.",
            "putIfAbsent keeps the first index for a repeated value.",
            "Counting: for x < y multiply the two frequencies; for x == y it is f choose 2; skip x > y to avoid double counting.",
          ],
          cases: [
            { stdin: "6\n3 5 2 5 1 4\n6\n", expected: "pair=1 4\npairs=3\n" },
            { stdin: "3\n1 2 3\n10\n", expected: "pair=none\npairs=0\n" },
            { stdin: "5\n2 2 2 2 4\n4\n", expected: "pair=0 1\npairs=6\n", hidden: true },
          ],
        },
        {
          title: "Min-stack",
          prompt: `Implement a stack with O(1) \`push\`, \`pop\`, \`top\` and \`min\` using two \`ArrayDeque\`s (values, and the running minimums). Read an integer \`n\` and \`n\` commands: \`push <v>\`; \`pop\` (prints nothing, or \`empty\` if there is nothing to pop); \`top\` prints the top value or \`empty\`; \`min\` prints the current minimum or \`empty\`.

Example: \`7\` then \`push 5\`, \`push 2\`, \`push 7\`, \`min\`, \`pop\`, \`pop\`, \`min\` →
\`\`\`
2
5
\`\`\``,
          starter: String.raw`import java.util.*;

class MinStack {
    private final Deque<Long> values = new ArrayDeque<>();
    private final Deque<Long> mins = new ArrayDeque<>();
    // TODO: push, pop, top, min, isEmpty
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        MinStack s = new MinStack();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class MinStack {
    private final Deque<Long> values = new ArrayDeque<>();
    private final Deque<Long> mins = new ArrayDeque<>();
    void push(long v) {
        values.push(v);
        mins.push(mins.isEmpty() ? v : Math.min(v, mins.peek()));
    }
    boolean isEmpty() { return values.isEmpty(); }
    void pop() { values.pop(); mins.pop(); }
    long top() { return values.peek(); }
    long min() { return mins.peek(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        MinStack s = new MinStack();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "push" -> s.push(in.nextLong());
                case "pop" -> { if (s.isEmpty()) System.out.println("empty"); else s.pop(); }
                case "top" -> System.out.println(s.isEmpty() ? "empty" : String.valueOf(s.top()));
                default -> System.out.println(s.isEmpty() ? "empty" : String.valueOf(s.min()));
            }
        }
    }
}
`,
          hints: [
            "The mins deque holds, at each level, the minimum of everything at or below it.",
            "Pop both deques together so they stay aligned.",
            "Check isEmpty before every read — ArrayDeque.peek returns null, and unboxing null is an NPE.",
          ],
          cases: [
            { stdin: "7\npush 5\npush 2\npush 7\nmin\npop\npop\nmin\n", expected: "2\n5\n" },
            { stdin: "3\npop\ntop\nmin\n", expected: "empty\nempty\nempty\n" },
            { stdin: "6\npush -1\npush -5\ntop\nmin\npop\nmin\n", expected: "-5\n-5\n-1\n", hidden: true },
          ],
        },
        {
          title: "Group anagrams",
          prompt: `Read an integer \`n\` and \`n\` lower-case words. Group words that are anagrams of each other (key: the word's characters sorted). Print the groups ordered by **size descending, then by their first word alphabetically**, one per line as \`<size>: <words in input order, space-separated>\`.

Example: \`6\` then \`eat tea tan ate nat bat\` →
\`\`\`
3: eat tea ate
2: tan nat
1: bat
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static String key(String w) {
        char[] cs = w.toCharArray();
        Arrays.sort(cs);
        return new String(cs);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, List<String>> groups = new LinkedHashMap<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static String key(String w) {
        char[] cs = w.toCharArray();
        Arrays.sort(cs);
        return new String(cs);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            String w = in.next();
            groups.computeIfAbsent(key(w), k -> new ArrayList<>()).add(w);
        }
        List<List<String>> ordered = new ArrayList<>(groups.values());
        ordered.sort(Comparator.<List<String>>comparingInt(List::size).reversed().thenComparing(g -> g.get(0)));
        for (List<String> g : ordered) System.out.println(g.size() + ": " + String.join(" ", g));
    }
}
`,
          hints: [
            "computeIfAbsent(key, k -> new ArrayList<>()).add(w) is the grouping idiom.",
            "Comparator.comparingInt(List::size).reversed().thenComparing(g -> g.get(0)) — note the explicit type witness the reversed() chain needs.",
            "A LinkedHashMap keeps first-seen order, which is what 'first word' means.",
          ],
          cases: [
            { stdin: "6\neat tea tan ate nat bat\n", expected: "3: eat tea ate\n2: tan nat\n1: bat\n" },
            { stdin: "1\nsolo\n", expected: "1: solo\n" },
            { stdin: "5\nab ba cd dc ee\n", expected: "2: ab ba\n2: cd dc\n1: ee\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`n ≤ 5 000` in the statement suggests…",
          options: ["O(n³)", "O(n²) is acceptable (25 million operations)", "Only O(n)", "O(2ⁿ)"],
          answer: 1,
          explanation: "The budget table: 5 000² = 2.5 × 10⁷ fits under 10⁸.",
        },
        {
          prompt: "Predict: `int x = 100000; long y = x * x;` gives…",
          options: ["`10000000000`", "`1410065408` — the multiplication overflowed in `int` before the widening", "`0`", "A compile error"],
          answer: 1,
          explanation: "Cast an operand first: `(long) x * x`.",
        },
        {
          prompt: "Both `equals` and `hashCode` must be overridden together because…",
          options: ["The compiler requires it", "Hash collections find the bucket by `hashCode` and only then compare with `equals`", "`toString` depends on them", "Records need it"],
          answer: 1,
          explanation: "Equal objects in different buckets are invisible to `get`/`contains`.",
        },
        {
          prompt: "`Comparator.comparing(Employee::salary).reversed().thenComparing(Employee::name)` sorts by…",
          options: ["Name then salary", "Salary descending, then name ascending", "Salary ascending", "Name descending"],
          answer: 1,
          explanation: "`reversed()` applies to what precedes it; later `thenComparing` keys are ascending.",
        },
        {
          prompt: "`Integer.valueOf(128) == Integer.valueOf(128)` and `\"ab\" == \"a\" + \"b\"` are…",
          options: ["`false`, `true` — cache ends at 127; constant folding pools the literal", "`true`, `true`", "`false`, `false`", "`true`, `false`"],
          answer: 0,
          explanation: "Neither result is a reason to use `==`: `equals` for both.",
        },
        {
          prompt: "`\"a,b,,\".split(\",\").length` is…",
          options: ["`4`", "`2` — trailing empty strings are dropped unless the limit is negative", "`3`", "`0`"],
          answer: 1,
          explanation: "`split(\",\", -1)` keeps them.",
        },
        {
          prompt: "Removing elements from an `ArrayList` inside a for-each loop…",
          options: ["Works", "Throws `ConcurrentModificationException` — use `removeIf` or the iterator's `remove`", "Removes the wrong element silently", "Is O(1)"],
          answer: 1,
          explanation: "Fail-fast iteration.",
        },
        {
          prompt: "For k most frequent words the idiom is…",
          options: ["Sort everything", "Frequency map, then a min-heap of size k keyed on count with a word tie-breaker", "A `TreeMap` of words", "Two nested loops"],
          answer: 1,
          explanation: "O(n log k); for k ≈ n a sort is simpler.",
        },
        {
          prompt: "Sliding-window maximum in O(n) uses…",
          options: ["A `PriorityQueue`", "A monotonic deque of indexes", "Sorting each window", "A `TreeMap`"],
          answer: 1,
          explanation: "Each index is pushed and popped at most once.",
        },
        {
          prompt: "The min-stack's second deque stores…",
          options: ["The values sorted", "The minimum of the stack at each depth, so `pop` restores the previous minimum in O(1)", "Only the global minimum", "The indexes"],
          answer: 1,
          explanation: "Push `min(v, currentMin)` alongside every value.",
        },
        {
          prompt: "The key for grouping anagrams is…",
          options: ["The word's length", "The word's characters sorted (or a 26-count signature)", "The first letter", "The hash code"],
          answer: 1,
          explanation: "Equal keys ⇔ anagrams; `computeIfAbsent` groups them.",
        },
        {
          prompt: "A deep recursion that might exceed ~10⁴ frames in Java should…",
          options: ["Be left alone", "Be made iterative with an explicit stack, or run in a thread with a larger stack size", "Use `volatile`", "Use streams"],
          answer: 1,
          explanation: "`new Thread(null, task, \"dfs\", 1 << 26).start()` is the pragmatic judge trick.",
        },
        {
          prompt: "With `Animal a = new Dog();` and overloads `f(Animal)`/`f(Dog)`, `f(a)` calls…",
          options: ["`f(Dog)`", "`f(Animal)` — overloads resolve on the static type", "Both", "Neither"],
          answer: 1,
          explanation: "`a.speak()` would still call `Dog`'s override; fields are never polymorphic either.",
        },
        {
          prompt: "Before saying 'done' you should…",
          options: ["Add more features", "Run the pitfalls pass (overflow, `==`, `split`, sort worst case, recursion depth, flush), remove debug output, and state the complexity", "Rewrite in streams", "Ask for the answer"],
          answer: 1,
          explanation: "Thirty seconds that catches most 'correct but rejected' submissions.",
        },
        {
          prompt: "The best response to a theory question you are unsure of is…",
          options: ["A confident guess", "\"I believe it is X, but I would check\" — and connecting it to what you do know", "Silence", "Changing the subject"],
          answer: 1,
          explanation: "Wrong confident answers cost more than honest uncertainty.",
        },
      ],
    },
  ],
});

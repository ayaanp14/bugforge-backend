import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "modern-java",
  title: "Modern Java",
  blurb: "The release train and LTS milestones, var and inference, pattern matching for instanceof, switch and records, the library additions from 9 to 21, virtual threads and structured concurrency, modules and the toolchain.",
  icon: "modern",
  overview: `"What's new in Java 17?" and "what's new in Java 21?" are now standard interview questions, and the honest answer is: most of the language you have learned in this track. This module puts it in order.

It starts with the six-month release train and the LTS versions that production actually runs, with a one-screen cheat-sheet of what landed when. Then the features in depth: var and the inference family with the readability rules; pattern matching from instanceof through pattern switch to record patterns, with the exhaustiveness guarantee that retires the visitor pattern; the library additions you will use weekly — collection factories, the new String methods, Stream.toList, teeing, helpful NullPointerExceptions, HttpClient, sequenced collections. Virtual threads and structured concurrency are explained as the answer to the scaling problem the concurrency module left open, and the module system, jshell and the modern toolchain round it off.

The runtime behind the exercises is Java 17-level (OpenJDK 18), so records, sealed types, text blocks, switch expressions and pattern instanceof are all exercised; pattern switch, record patterns and virtual threads are taught as reading and quiz — with the form you will write on 21 shown beside the form that compiles here.`,
  lessons: [
    {
      slug: "the-release-train",
      file: "01-the-release-train.md",
      exercises: [
        {
          title: "Modern string toolkit",
          prompt: `Read all of standard input. Using only the Java 11+ \`String\` methods — \`lines()\`, \`strip()\`, \`isBlank()\`, \`repeat()\`, \`formatted()\` — print:

- \`nonBlank=<number of non-blank lines>\`
- \`stripped=<the non-blank lines, stripped, joined by |>\`
- \`banner=<a line of = as long as the longest stripped line>\`
- \`report=<"%d lines, %d chars".formatted(nonBlank, total characters of the stripped lines)>\`

Example input (note the surrounding spaces and the blank line)
\`\`\`
  hello

 world!!
\`\`\`
→
\`\`\`
nonBlank=2
stripped=hello|world!!
banner========
report=2 lines, 12 chars
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        List<String> lines = text.lines().filter(Predicate.not(String::isBlank)).map(String::strip).toList();
        int longest = lines.stream().mapToInt(String::length).max().orElse(0);
        int chars = lines.stream().mapToInt(String::length).sum();
        System.out.println("nonBlank=" + lines.size());
        System.out.println("stripped=" + String.join("|", lines));
        System.out.println("banner=" + "=".repeat(longest));
        System.out.println("report=" + "%d lines, %d chars".formatted(lines.size(), chars));
    }
}
`,
          hints: ["lines() then filter(Predicate.not(String::isBlank)) then map(String::strip).", "\"=\".repeat(n) replaces the StringBuilder loop."],
          cases: [
            { stdin: "  hello \n\n world!!\n", expected: "nonBlank=2\nstripped=hello|world!!\nbanner========\nreport=2 lines, 12 chars\n" },
            { stdin: "\n   \n", expected: "nonBlank=0\nstripped=\nbanner=\nreport=0 lines, 0 chars\n" },
            { stdin: "a\n bb \n  ccc\n", expected: "nonBlank=3\nstripped=a|bb|ccc\nbanner====\nreport=3 lines, 6 chars\n", hidden: true },
          ],
        },
        {
          title: "Which release?",
          prompt: `Build an immutable lookup table with \`Map.ofEntries\` from feature name to the Java version that finalised it: \`modules\` 9, \`var\` 10, \`http-client\` 11, \`switch-expressions\` 14, \`text-blocks\` 15, \`records\` 16, \`pattern-instanceof\` 16, \`sealed\` 17, \`pattern-switch\` 21, \`record-patterns\` 21, \`virtual-threads\` 21, \`sequenced-collections\` 21. LTS versions are \`Set.of(8, 11, 17, 21)\`. Read an integer \`n\` and \`n\` feature names; print \`<feature>: Java <v> (LTS)\` or \`(not LTS)\`, or \`<feature>: unknown\`.

Example: \`3\` then \`records sealed lambdas\` →
\`\`\`
records: Java 16 (not LTS)
sealed: Java 17 (LTS)
lambdas: unknown
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        // TODO: Map.ofEntries(...) and Set.of(...)
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String feature = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Map<String, Integer> since = Map.ofEntries(
            Map.entry("modules", 9), Map.entry("var", 10), Map.entry("http-client", 11),
            Map.entry("switch-expressions", 14), Map.entry("text-blocks", 15), Map.entry("records", 16),
            Map.entry("pattern-instanceof", 16), Map.entry("sealed", 17), Map.entry("pattern-switch", 21),
            Map.entry("record-patterns", 21), Map.entry("virtual-threads", 21), Map.entry("sequenced-collections", 21));
        Set<Integer> lts = Set.of(8, 11, 17, 21);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String feature = in.next();
            Integer v = since.get(feature);
            if (v == null) System.out.println(feature + ": unknown");
            else System.out.println(feature + ": Java " + v + (lts.contains(v) ? " (LTS)" : " (not LTS)"));
        }
    }
}
`,
          hints: ["Map.of stops at ten pairs; Map.ofEntries takes any number of Map.entry(k, v).", "get returns null for a missing key — the factories reject null values, so null means absent."],
          cases: [
            { stdin: "3\nrecords sealed lambdas\n", expected: "records: Java 16 (not LTS)\nsealed: Java 17 (LTS)\nlambdas: unknown\n" },
            { stdin: "2\nvirtual-threads var\n", expected: "virtual-threads: Java 21 (LTS)\nvar: Java 10 (not LTS)\n" },
            { stdin: "4\nmodules http-client text-blocks generics\n", expected: "modules: Java 9 (not LTS)\nhttp-client: Java 11 (LTS)\ntext-blocks: Java 15 (not LTS)\ngenerics: unknown\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Java feature releases ship…",
          options: ["Every three years", "Every six months, with an LTS every two years", "Once a year", "When ready"],
          answer: 1,
          explanation: "8, 11, 17, 21 and 25 are the LTS versions production runs.",
        },
        {
          prompt: "A *preview* feature…",
          options: ["Is production-ready", "Is complete but may change; needs `--enable-preview` and should stay out of production", "Is deprecated", "Only works in `jshell`"],
          answer: 1,
          explanation: "Incubator modules (`jdk.incubator.*`) are the API equivalent.",
        },
        {
          prompt: "Records and pattern `instanceof` became final in…",
          options: ["Java 11", "Java 14", "Java 16", "Java 21"],
          answer: 2,
          explanation: "Previewed in 14–15, final in 16; sealed classes followed in 17.",
        },
        {
          prompt: "`javac --release 17` does what?",
          options: ["Optimises for Java 17", "Compiles against exactly the Java 17 API and syntax, rejecting newer features", "Enables previews", "Targets Java 8"],
          answer: 1,
          explanation: "The way to guarantee a library runs on the LTS you claim to support.",
        },
        {
          prompt: "Which pairing is correct?",
          options: ["`var` — 8; text blocks — 11", "Pattern switch — 17; virtual threads — 19 final", "Pattern switch and virtual threads — 21; sealed — 17; `var` — 10", "Records — 21; sealed — 21"],
          answer: 2,
          explanation: "The four LTS milestones and their headline features are the ones to memorise.",
        },
      ],
    },
    {
      slug: "var-and-type-inference",
      file: "02-var-and-type-inference.md",
      exercises: [
        {
          title: "Let the compiler type it",
          prompt: `Read all of standard input and split it into words. Using \`var\` for **every local variable**, group the distinct words by length into a \`TreeMap<Integer, List<String>>\` (words sorted within a group), and print one line per group: \`<length>: <words joined by ,>\`. Then print \`largestGroup=<the length with the most words; ties to the smaller length>\`.

Example: \`to be or not to be that is it\` →
\`\`\`
2: be,is,it,or,to
3: not
4: that
largestGroup=2
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        var text = new String(System.in.readAllBytes());
        // TODO: var everywhere
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        var text = new String(System.in.readAllBytes());
        var words = Arrays.stream(text.trim().split("\\s+")).filter(w -> !w.isEmpty()).distinct().sorted().toList();
        var groups = words.stream().collect(groupingBy(String::length, TreeMap::new, toList()));
        var largest = -1;
        var largestSize = -1;
        for (var e : groups.entrySet()) {
            System.out.println(e.getKey() + ": " + String.join(",", e.getValue()));
            if (e.getValue().size() > largestSize) { largestSize = e.getValue().size(); largest = e.getKey(); }
        }
        System.out.println("largestGroup=" + largest);
    }
}
`,
          hints: ["var groups = …collect(groupingBy(String::length, TreeMap::new, toList())) infers TreeMap<Integer, List<String>>.", "for (var e : groups.entrySet()) is where var saves the most typing."],
          cases: [
            { stdin: "to be or not to be that is it\n", expected: "2: be,is,it,or,to\n3: not\n4: that\nlargestGroup=2\n" },
            { stdin: "aaa bb aaa\n", expected: "2: bb\n3: aaa\nlargestGroup=2\n" },
            { stdin: "x yy zz y\n", expected: "1: x,y\n2: yy,zz\nlargestGroup=1\n", hidden: true },
          ],
        },
        {
          title: "Diamond with an anonymous class",
          prompt: `Read an integer \`n\` and \`n\` words. Sort them with an **anonymous \`Comparator<>\`** using the diamond (Java 9) — by length, then alphabetically — and print the sorted words space-separated. Then declare \`var tally = new Object() { int calls; int bump() { return ++calls; } };\`, call \`bump()\` once per word, and print \`calls=<tally.calls>\` — a method on an anonymous class that only \`var\` can give you a handle to.

Example: \`4\` then \`pear fig apple kiwi\` →
\`\`\`
fig kiwi pear apple
calls=4
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        Comparator<String> byLengthThenAlpha = new Comparator<>() {
            @Override public int compare(String a, String b) {
                int c = Integer.compare(a.length(), b.length());
                return c != 0 ? c : a.compareTo(b);
            }
        };
        words.sort(byLengthThenAlpha);
        System.out.println(String.join(" ", words));
        var tally = new Object() {
            int calls;
            int bump() { return ++calls; }
        };
        for (String w : words) tally.bump();
        System.out.println("calls=" + tally.calls);
    }
}
`,
          hints: ["new Comparator<>() { … } infers <String> from the declaration's type.", "The anonymous object's type has no name; var is the only way to keep a reference that still sees bump()."],
          cases: [
            { stdin: "4\npear fig apple kiwi\n", expected: "fig kiwi pear apple\ncalls=4\n" },
            { stdin: "1\nz\n", expected: "z\ncalls=1\n" },
            { stdin: "3\nbb a bb\n", expected: "a bb bb\ncalls=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`var` makes Java…",
          options: ["Dynamically typed", "Still statically typed — the type is inferred from the initialiser once and never changes", "Untyped", "Slower"],
          answer: 1,
          explanation: "It is local variable type inference, not `Object` and not dynamic typing.",
        },
        {
          prompt: "Which does **not** compile?",
          options: ["`var n = 10;`", "`var list = new ArrayList<String>();`", "`var f = String::length;`", "`for (var e : map.entrySet())`"],
          answer: 2,
          explanation: "A bare method reference or lambda has no type without a target; cast it or declare the functional interface.",
        },
        {
          prompt: "`var list = new ArrayList<>();` infers…",
          options: ["`ArrayList<String>`", "`ArrayList<Object>` — the diamond has no target to infer from", "`List<Object>`", "Compile error"],
          answer: 1,
          explanation: "A genuine trap: give the type argument when you use `var` with `new`.",
        },
        {
          prompt: "`var` is allowed for…",
          options: ["Fields", "Method parameters", "Local variables with an initialiser, loop variables, try-with-resources, and (11+) lambda parameters", "Return types"],
          answer: 2,
          explanation: "Never fields, parameters or return types; never without an initialiser or with `null`.",
        },
        {
          prompt: "The readability test for `var` is…",
          options: ["Is the line shorter?", "Can the reader tell the type from the line — the initialiser or the name?", "Is it a loop?", "Is the type generic?"],
          answer: 1,
          explanation: "`var users = repo.find()` hides; `var in = new BufferedReader(...)` does not.",
        },
      ],
    },
    {
      slug: "pattern-matching",
      file: "03-pattern-matching.md",
      exercises: [
        {
          title: "Shapes with pattern instanceof",
          prompt: `Declare \`sealed interface Shape permits Circle, Square, Rect\` with records \`Circle(double r)\`, \`Square(double side)\` and \`Rect(double w, double h)\`. Read an integer \`n\` and \`n\` shapes — \`circle <r>\`, \`square <side>\` or \`rect <w> <h>\` — and for each print \`<Kind> area=<two decimals> perimeter=<two decimals>\` using **pattern \`instanceof\`** (no casts). Then print \`largest=<record toString of the largest-area shape>\` and \`total=<sum of areas, two decimals>\`. Use \`Locale.ROOT\`.

Example: \`2\` then \`circle 1\`, \`rect 2 3\` →
\`\`\`
Circle area=3.14 perimeter=6.28
Rect area=6.00 perimeter=10.00
largest=Rect[w=2.0, h=3.0]
total=9.14
\`\`\``,
          starter: String.raw`import java.util.*;

sealed interface Shape permits Circle, Square, Rect { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
record Rect(double w, double h) implements Shape { }

public class Main {
    static double area(Shape s) {
        // TODO: pattern instanceof chain
        return 0;
    }
    static double perimeter(Shape s) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Shape> shapes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            // TODO: build the shape
        }
        // TODO: print
    }
}
`,
          solution: String.raw`import java.util.*;

sealed interface Shape permits Circle, Square, Rect { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
record Rect(double w, double h) implements Shape { }

public class Main {
    static double area(Shape s) {
        if (s instanceof Circle c) return Math.PI * c.r() * c.r();
        if (s instanceof Square q) return q.side() * q.side();
        if (s instanceof Rect r) return r.w() * r.h();
        throw new IllegalStateException();
    }
    static double perimeter(Shape s) {
        if (s instanceof Circle c) return 2 * Math.PI * c.r();
        if (s instanceof Square q) return 4 * q.side();
        if (s instanceof Rect r) return 2 * (r.w() + r.h());
        throw new IllegalStateException();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Shape> shapes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            shapes.add(switch (kind) {
                case "circle" -> new Circle(in.nextDouble());
                case "square" -> new Square(in.nextDouble());
                default -> new Rect(in.nextDouble(), in.nextDouble());
            });
        }
        Shape largest = null;
        double total = 0;
        for (Shape s : shapes) {
            double a = area(s);
            total += a;
            if (largest == null || a > area(largest)) largest = s;
            System.out.println(String.format(Locale.ROOT, "%s area=%.2f perimeter=%.2f", s.getClass().getSimpleName(), a, perimeter(s)));
        }
        System.out.println("largest=" + largest);
        System.out.println(String.format(Locale.ROOT, "total=%.2f", total));
    }
}
`,
          hints: ["if (s instanceof Circle c) binds c with no cast; the accessor is c.r().", "A record's toString is Kind[field=value, …] — exactly the largest= line."],
          cases: [
            { stdin: "2\ncircle 1\nrect 2 3\n", expected: "Circle area=3.14 perimeter=6.28\nRect area=6.00 perimeter=10.00\nlargest=Rect[w=2.0, h=3.0]\ntotal=9.14\n" },
            { stdin: "1\nsquare 2.5\n", expected: "Square area=6.25 perimeter=10.00\nlargest=Square[side=2.5]\ntotal=6.25\n" },
            { stdin: "3\nsquare 1\ncircle 0.5\nrect 1 0.5\n", expected: "Square area=1.00 perimeter=4.00\nCircle area=0.79 perimeter=3.14\nRect area=0.50 perimeter=3.00\nlargest=Square[side=1.0]\ntotal=2.29\n", hidden: true },
          ],
        },
        {
          title: "An expression tree",
          prompt: `Declare \`sealed interface Expr permits Num, Add, Mul, Neg\` with records \`Num(int value)\`, \`Add(Expr left, Expr right)\`, \`Mul(Expr left, Expr right)\` and \`Neg(Expr inner)\`. Read one line of **reverse Polish** tokens — integers, \`+\`, \`*\`, and \`~\` for negation — and build the tree with a stack. Then, with pattern \`instanceof\`, print \`expr=<rendering>\` where a \`Num\` is its value, \`Add\` is \`(l + r)\`, \`Mul\` is \`(l * r)\` and \`Neg\` is \`-(x)\`; \`value=<evaluation>\`; and \`depth=<height of the tree, a lone Num being 1>\`.

Example: \`1 2 3 * +\` →
\`\`\`
expr=(1 + (2 * 3))
value=7
depth=3
\`\`\``,
          starter: String.raw`import java.util.*;

sealed interface Expr permits Num, Add, Mul, Neg { }
record Num(int value) implements Expr { }
record Add(Expr left, Expr right) implements Expr { }
record Mul(Expr left, Expr right) implements Expr { }
record Neg(Expr inner) implements Expr { }

public class Main {
    static String render(Expr e) { /* TODO */ return ""; }
    static int eval(Expr e) { /* TODO */ return 0; }
    static int depth(Expr e) { /* TODO */ return 0; }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Deque<Expr> stack = new ArrayDeque<>();
        // TODO: parse tokens
    }
}
`,
          solution: String.raw`import java.util.*;

sealed interface Expr permits Num, Add, Mul, Neg { }
record Num(int value) implements Expr { }
record Add(Expr left, Expr right) implements Expr { }
record Mul(Expr left, Expr right) implements Expr { }
record Neg(Expr inner) implements Expr { }

public class Main {
    static String render(Expr e) {
        if (e instanceof Num n) return String.valueOf(n.value());
        if (e instanceof Add a) return "(" + render(a.left()) + " + " + render(a.right()) + ")";
        if (e instanceof Mul m) return "(" + render(m.left()) + " * " + render(m.right()) + ")";
        if (e instanceof Neg g) return "-(" + render(g.inner()) + ")";
        throw new IllegalStateException();
    }
    static int eval(Expr e) {
        if (e instanceof Num n) return n.value();
        if (e instanceof Add a) return eval(a.left()) + eval(a.right());
        if (e instanceof Mul m) return eval(m.left()) * eval(m.right());
        if (e instanceof Neg g) return -eval(g.inner());
        throw new IllegalStateException();
    }
    static int depth(Expr e) {
        if (e instanceof Num) return 1;
        if (e instanceof Add a) return 1 + Math.max(depth(a.left()), depth(a.right()));
        if (e instanceof Mul m) return 1 + Math.max(depth(m.left()), depth(m.right()));
        if (e instanceof Neg g) return 1 + depth(g.inner());
        throw new IllegalStateException();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Deque<Expr> stack = new ArrayDeque<>();
        while (in.hasNext()) {
            String t = in.next();
            switch (t) {
                case "+" -> { Expr r = stack.pop(), l = stack.pop(); stack.push(new Add(l, r)); }
                case "*" -> { Expr r = stack.pop(), l = stack.pop(); stack.push(new Mul(l, r)); }
                case "~" -> stack.push(new Neg(stack.pop()));
                default -> stack.push(new Num(Integer.parseInt(t)));
            }
        }
        Expr root = stack.pop();
        System.out.println("expr=" + render(root));
        System.out.println("value=" + eval(root));
        System.out.println("depth=" + depth(root));
    }
}
`,
          hints: ["Pop right then left for a binary operator.", "Each function is the same instanceof chain over the four permitted records — on Java 21 it would be one exhaustive switch."],
          cases: [
            { stdin: "1 2 3 * +\n", expected: "expr=(1 + (2 * 3))\nvalue=7\ndepth=3\n" },
            { stdin: "4 ~\n", expected: "expr=-(4)\nvalue=-4\ndepth=2\n" },
            { stdin: "2 3 + 4 * ~ 1 +\n", expected: "expr=(-(((2 + 3) * 4)) + 1)\nvalue=-19\ndepth=5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `if (!(o instanceof String s)) return; use(s);` the variable `s`…",
          options: ["Is out of scope at `use`", "Is in scope at `use` — flow scoping knows the test succeeded past the early return", "Is `null`", "Causes a compile error"],
          answer: 1,
          explanation: "Pattern variables are in scope wherever the match is definitely true.",
        },
        {
          prompt: "A pattern `switch` over a sealed interface with no `default`…",
          options: ["Does not compile", "Compiles if every permitted subtype has a case — the compiler checks exhaustiveness", "Throws at runtime", "Matches nothing"],
          answer: 1,
          explanation: "Adding a subtype later breaks every such switch at compile time — the safety the visitor pattern offered with more boilerplate.",
        },
        {
          prompt: "`case Object o -> …` placed before `case String s -> …`…",
          options: ["Is fine", "Is a compile error: the earlier case dominates the later one", "Matches strings first", "Is a warning"],
          answer: 1,
          explanation: "Dominance checking keeps unreachable cases from compiling.",
        },
        {
          prompt: "`case Line(Point(var x1, var y1), Point p2) when x1 == 0 -> …` is…",
          options: ["Invalid syntax", "A nested record pattern with a guard (Java 21)", "A type pattern only", "Java 8 code"],
          answer: 1,
          explanation: "Record patterns nest arbitrarily and accept `var` for components; `when` refines the case.",
        },
        {
          prompt: "`switch (obj)` with a `null` selector and no `case null`…",
          options: ["Matches `default`", "Throws `NullPointerException`", "Skips the switch", "Matches the first case"],
          answer: 1,
          explanation: "As switches always have; `case null ->` or `case null, default ->` handles it explicitly.",
        },
        {
          prompt: "On a Java 17 runtime, dispatching over a sealed hierarchy is done with…",
          options: ["Pattern `switch`", "A chain of pattern `instanceof` checks (pattern `switch` is 21)", "Reflection", "`equals`"],
          answer: 1,
          explanation: "Same records, same sealed interface; the exhaustive switch form arrives in 21.",
        },
      ],
    },
    {
      slug: "api-additions-worth-knowing",
      file: "04-api-additions-worth-knowing.md",
      exercises: [
        {
          title: "Text block invoice",
          prompt: `Read a customer name, an integer \`n\`, and \`n\` items \`name qty price\`. Print an invoice built from a **text block** and \`formatted\`:

\`\`\`
Invoice for <name>
<a line of - as long as the line above>
<item> x<qty> @ <price, 2 dp> = <line total, 2 dp>
…
Total: <sum, 2 dp>
\`\`\`

Use \`"-".repeat(...)\` for the rule and \`Locale.ROOT\` formatting (\`String.format(Locale.ROOT, …)\` for the numbers; \`formatted\` uses the default locale, so keep it for the text parts).

Example: \`Ada\`, \`2\`, \`pen 3 1.5\`, \`pad 1 4\` →
\`\`\`
Invoice for Ada
---------------
pen x3 @ 1.50 = 4.50
pad x1 @ 4.00 = 4.00
Total: 8.50
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String name = in.next();
        int n = in.nextInt();
        StringBuilder items = new StringBuilder();
        double total = 0;
        for (int i = 0; i < n; i++) {
            String item = in.next();
            int qty = in.nextInt();
            double price = in.nextDouble();
            // TODO
        }
        String template = """
            Invoice for %s
            %s
            %sTotal: %s""";
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String name = in.next();
        int n = in.nextInt();
        StringBuilder items = new StringBuilder();
        double total = 0;
        for (int i = 0; i < n; i++) {
            String item = in.next();
            int qty = in.nextInt();
            double price = in.nextDouble();
            double line = qty * price;
            total += line;
            items.append(String.format(Locale.ROOT, "%s x%d @ %.2f = %.2f%n", item, qty, price, line));
        }
        String template = """
            Invoice for %s
            %s
            %sTotal: %s""";
        String header = "Invoice for " + name;
        System.out.println(template.formatted(name, "-".repeat(header.length()), items, String.format(Locale.ROOT, "%.2f", total)));
    }
}
`,
          hints: ["A text block strips the common indentation; the closing delimiter's position sets it.", "Build the item lines first, then feed the whole block one formatted() call."],
          cases: [
            { stdin: "Ada\n2\npen 3 1.5\npad 1 4\n", expected: "Invoice for Ada\n---------------\npen x3 @ 1.50 = 4.50\npad x1 @ 4.00 = 4.00\nTotal: 8.50\n" },
            { stdin: "Bo\n0\n", expected: "Invoice for Bo\n--------------\nTotal: 0.00\n" },
            { stdin: "Zed\n1\ntea 10 0.333\n", expected: "Invoice for Zed\n---------------\ntea x10 @ 0.33 = 3.33\nTotal: 3.33\n", hidden: true },
          ],
        },
        {
          title: "The factories say no",
          prompt: `Read an integer \`n\` and \`n\` words, where \`-\` stands for \`null\`. Then:

1. Try \`Set.of(words...)\`: print \`set=ok size=<n>\`, or on \`IllegalArgumentException\` print \`set=<the exception message>\` (it reads \`duplicate element: x\`), or on \`NullPointerException\` print \`set=null rejected\`.
2. Build a mutable \`ArrayList\`, then \`List.copyOf\` it (skip if any element is null — print \`copy=skipped\`); try \`copy.add("z")\` and print \`copy=immutable\` if it throws \`UnsupportedOperationException\`.
3. Print \`asList=<result of Arrays.asList(array).set(0, "q") — "set ok"> \` and then try \`.add("z")\` on that list, printing \`asList=fixed-size\` when it throws.

Example: \`3\` then \`a b a\` →
\`\`\`
set=duplicate element: a
copy=immutable
asList=set ok
asList=fixed-size
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] words = new String[n];
        for (int i = 0; i < n; i++) { String w = in.next(); words[i] = w.equals("-") ? null : w; }
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] words = new String[n];
        for (int i = 0; i < n; i++) { String w = in.next(); words[i] = w.equals("-") ? null : w; }

        try {
            Set<String> set = Set.of(words);
            System.out.println("set=ok size=" + set.size());
        } catch (IllegalArgumentException e) {
            System.out.println("set=" + e.getMessage());
        } catch (NullPointerException e) {
            System.out.println("set=null rejected");
        }

        boolean hasNull = Arrays.asList(words).contains(null);
        if (hasNull) {
            System.out.println("copy=skipped");
        } else {
            List<String> copy = List.copyOf(new ArrayList<>(Arrays.asList(words)));
            try { copy.add("z"); System.out.println("copy=mutable"); }
            catch (UnsupportedOperationException e) { System.out.println("copy=immutable"); }
        }

        List<String> view = Arrays.asList(words.clone());
        view.set(0, "q");
        System.out.println("asList=set ok");
        try { view.add("z"); System.out.println("asList=grew"); }
        catch (UnsupportedOperationException e) { System.out.println("asList=fixed-size"); }
    }
}
`,
          hints: ["Set.of checks for duplicates and nulls eagerly, in that order of discovery.", "Arrays.asList allows set (it writes through to the array) but not add or remove."],
          cases: [
            { stdin: "3\na b a\n", expected: "set=duplicate element: a\ncopy=immutable\nasList=set ok\nasList=fixed-size\n" },
            { stdin: "2\nx y\n", expected: "set=ok size=2\ncopy=immutable\nasList=set ok\nasList=fixed-size\n" },
            { stdin: "2\nx -\n", expected: "set=null rejected\ncopy=skipped\nasList=set ok\nasList=fixed-size\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`List.of(1, 2).add(3)`…",
          options: ["Returns a new list", "Throws `UnsupportedOperationException` — the factories are immutable", "Appends 3", "Returns `false`"],
          answer: 1,
          explanation: "They also reject `null` elements, and `Set.of` rejects duplicates.",
        },
        {
          prompt: "`Arrays.asList(arr)` differs from `List.of(arr)` in that it…",
          options: ["Is immutable", "Is a fixed-size **mutable view** — `set` writes through to the array; `add` throws", "Allows `add`", "Copies the array"],
          answer: 1,
          explanation: "`Collections.unmodifiableList` is a third thing: a read-only view over a list that may still change underneath.",
        },
        {
          prompt: "`\" x\\u2003\".strip()` versus `.trim()`:",
          options: ["Identical", "`strip` removes the Unicode space (`Character.isWhitespace`); `trim` removes only chars ≤ U+0020", "`trim` is Unicode-aware", "Both throw"],
          answer: 1,
          explanation: "`isBlank`, `stripLeading`/`stripTrailing` follow the same rule.",
        },
        {
          prompt: "A helpful `NullPointerException` (Java 14+) message tells you…",
          options: ["The line number only", "Exactly which expression was null, e.g. `because the return value of \"Person.name()\" is null`", "The thread name", "Nothing new"],
          answer: 1,
          explanation: "On by default since 15; locals are named when compiled with `-g`.",
        },
        {
          prompt: "Java 21's `SequencedCollection` adds to `List`…",
          options: ["`sort`", "`getFirst`, `getLast`, `addFirst`, `addLast`, `removeFirst`, `removeLast`, `reversed()`", "`stream`", "`toArray`"],
          answer: 1,
          explanation: "`reversed()` is a live view; `getLast()` on an empty list throws `NoSuchElementException`.",
        },
        {
          prompt: "The modern replacement for `HttpURLConnection` is…",
          options: ["`java.net.Socket`", "`java.net.http.HttpClient` (Java 11): HTTP/2, sync `send` and async `sendAsync`", "`URL.openStream` only", "A third-party library is required"],
          answer: 1,
          explanation: "Immutable requests via a builder, `BodyHandlers` for the response body, `CompletableFuture` for async.",
        },
      ],
    },
    {
      slug: "virtual-threads-and-structured-concurrency",
      file: "05-virtual-threads-and-structured-concurrency.md",
      quiz: [
        {
          prompt: "A virtual thread differs from a platform thread in that…",
          options: ["It runs faster", "Its stack lives on the heap and the JVM schedules it onto a small pool of carrier threads; blocking unmounts it", "It cannot block", "It has no `Thread` API"],
          answer: 1,
          explanation: "Millions can block cheaply; the API is the same `java.lang.Thread`.",
        },
        {
          prompt: "Virtual threads help most with…",
          options: ["CPU-bound number crunching", "I/O-bound work with many concurrent blocking operations", "Single-threaded scripts", "Garbage collection"],
          answer: 1,
          explanation: "There are still only as many cores; the win is that waiting no longer costs a thread.",
        },
        {
          prompt: "The JEP's advice on pooling virtual threads is…",
          options: ["Pool them like platform threads", "Never pool them — create one per task (`newVirtualThreadPerTaskExecutor`)", "Pool exactly `cores` of them", "Use `newCachedThreadPool`"],
          answer: 1,
          explanation: "Limit access to scarce downstream resources with a `Semaphore` instead.",
        },
        {
          prompt: "*Pinning* means…",
          options: ["A thread with high priority", "A blocked virtual thread that cannot unmount — inside `synchronized` (before Java 24) or native code — holding its carrier", "A thread bound to a CPU core", "A daemon thread"],
          answer: 1,
          explanation: "Prefer `ReentrantLock` around blocking calls on 21; JFR's `jdk.VirtualThreadPinned` finds it.",
        },
        {
          prompt: "Structured concurrency (`StructuredTaskScope`)…",
          options: ["Is final in Java 21", "Scopes subtasks to a block — they complete or are cancelled before it exits, failures propagate; still preview", "Replaces threads", "Is part of `java.io`"],
          answer: 1,
          explanation: "Virtual threads are final in 21; structured concurrency and scoped values were preview there (scoped values final in 25).",
        },
        {
          prompt: "The successor to `ThreadLocal` for request context in virtual-thread code is…",
          options: ["`static` fields", "`ScopedValue`", "`synchronized`", "`InheritableThreadLocal` only"],
          answer: 1,
          explanation: "Immutable, inherited by child threads, no per-thread copy — preview in 21, final in 25.",
        },
      ],
    },
    {
      slug: "modules-jshell-and-tooling",
      file: "06-modules-jshell-and-tooling.md",
      exercises: [
        {
          title: "Resolve the module graph",
          prompt: `Read an integer \`m\` and \`m\` module declarations \`<name>: <deps>\`, where \`deps\` is a comma-separated list (or \`-\`) and a dependency prefixed with \`+\` is \`requires transitive\`. Then read \`q\` and \`q\` module names. A module **reads** its direct dependencies, plus — for every module it reads — that module's \`requires transitive\` dependencies, recursively along transitive edges. Print \`<name> reads <sorted, comma-separated>\` or \`<name> reads -\`. Ignore \`java.base\`.

Example
\`\`\`
4
app: web,+model
web: +http,util
http: -
model: -
1
app
\`\`\`
→
\`\`\`
app reads http,model,web
\`\`\`
(\`app\` reads \`web\` and \`model\` directly, and \`http\` because \`web\` re-exports it — but not \`util\`.)`,
          starter: String.raw`import java.util.*;

public class Main {
    static Map<String, List<String>> direct = new HashMap<>();
    static Map<String, List<String>> transitive = new HashMap<>();

    static Set<String> reads(String module) {
        // TODO
        return new TreeSet<>();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int m = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < m; i++) {
            String[] parts = in.nextLine().split(":");
            String name = parts[0].trim();
            direct.put(name, new ArrayList<>());
            transitive.put(name, new ArrayList<>());
            for (String dep : parts[1].trim().split(",")) {
                dep = dep.trim();
                if (dep.isEmpty() || dep.equals("-")) continue;
                if (dep.startsWith("+")) { transitive.get(name).add(dep.substring(1)); direct.get(name).add(dep.substring(1)); }
                else direct.get(name).add(dep);
            }
        }
        int q = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < q; i++) {
            String name = in.nextLine().trim();
            Set<String> r = reads(name);
            System.out.println(name + " reads " + (r.isEmpty() ? "-" : String.join(",", r)));
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static Map<String, List<String>> direct = new HashMap<>();
    static Map<String, List<String>> transitive = new HashMap<>();

    static void addTransitive(String module, Set<String> out) {
        for (String t : transitive.getOrDefault(module, List.of())) {
            if (out.add(t)) addTransitive(t, out);
        }
    }

    static Set<String> reads(String module) {
        Set<String> out = new TreeSet<>();
        for (String d : direct.getOrDefault(module, List.of())) {
            out.add(d);
            addTransitive(d, out);
        }
        return out;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int m = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < m; i++) {
            String[] parts = in.nextLine().split(":");
            String name = parts[0].trim();
            direct.put(name, new ArrayList<>());
            transitive.put(name, new ArrayList<>());
            for (String dep : parts[1].trim().split(",")) {
                dep = dep.trim();
                if (dep.isEmpty() || dep.equals("-")) continue;
                if (dep.startsWith("+")) { transitive.get(name).add(dep.substring(1)); direct.get(name).add(dep.substring(1)); }
                else direct.get(name).add(dep);
            }
        }
        int q = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < q; i++) {
            String name = in.nextLine().trim();
            Set<String> r = reads(name);
            System.out.println(name + " reads " + (r.isEmpty() ? "-" : String.join(",", r)));
        }
    }
}
`,
          hints: ["Direct dependencies are always read; only the + edges propagate further.", "Follow transitive edges recursively, guarding against cycles with the set you are filling."],
          cases: [
            { stdin: "4\napp: web,+model\nweb: +http,util\nhttp: -\nmodel: -\n1\napp\n", expected: "app reads http,model,web\n" },
            { stdin: "3\na: +b\nb: +c\nc: -\n2\na\nc\n", expected: "a reads b,c\nc reads -\n" },
            { stdin: "4\nx: y\ny: +z\nz: +w\nw: -\n2\nx\ny\n", expected: "x reads w,y,z\ny reads w,z\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Module A can use a public type in module B's package only if…",
          options: ["B is on the classpath", "A `requires` B (directly or via `requires transitive`) **and** B `exports` that package", "The type is `public`", "A `opens` the package"],
          answer: 1,
          explanation: "Readability plus exports equals accessibility; `public` alone is no longer enough across modules.",
        },
        {
          prompt: "`requires transitive M` means…",
          options: ["M is optional", "Modules that require me also read M", "M is loaded lazily", "M is a test dependency"],
          answer: 1,
          explanation: "Use it when your exported API mentions M's types.",
        },
        {
          prompt: "`--add-opens java.base/java.lang=ALL-UNNAMED` is needed when…",
          options: ["Compiling with `--release`", "Code on the classpath reflects into a JDK package that is not `opens`-ed — strong encapsulation since 16", "Running `jshell`", "Using records"],
          answer: 1,
          explanation: "`jdeps --jdk-internals` finds such uses before an upgrade breaks them.",
        },
        {
          prompt: "The *unnamed module* is…",
          options: ["`java.base`", "The classpath: it reads all modules and exports everything, so legacy code keeps running", "A module without `module-info`", "An error"],
          answer: 1,
          explanation: "Jars on the module path without a descriptor become *automatic* modules instead.",
        },
        {
          prompt: "`jlink` produces…",
          options: ["An installer", "A custom runtime image containing only the modules your application needs", "A jar", "Documentation"],
          answer: 1,
          explanation: "`jpackage` (16) wraps that into native installers.",
        },
        {
          prompt: "`java Hello.java` (Java 11)…",
          options: ["Requires a compiled class", "Compiles the single source file in memory and runs it", "Starts `jshell`", "Only works with modules"],
          answer: 1,
          explanation: "Shebang scripts and, later, multi-file launch and compact source files extend the idea.",
        },
      ],
    },
    {
      slug: "modern-java-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Shape report",
          prompt: `Declare \`sealed interface Shape permits Circle, Square, Rect\` with records \`Circle(double r)\`, \`Square(double side)\`, \`Rect(double w, double h)\`. Read an integer \`n\` and \`n\` shapes (\`circle r\`, \`square s\`, \`rect w h\`). Using pattern \`instanceof\` for the area, print for every kind present, in alphabetical order, \`<Kind>: n=<count> area=<total area, 2 dp>\`; then \`largest=<record toString of the largest shape>\` and \`kinds=<number of distinct kinds>\`. Use \`Locale.ROOT\`.

Example: \`3\` then \`circle 1\`, \`rect 2 3\`, \`circle 2\` →
\`\`\`
Circle: n=2 area=15.71
Rect: n=1 area=6.00
largest=Circle[r=2.0]
kinds=2
\`\`\``,
          starter: String.raw`import java.util.*;

sealed interface Shape permits Circle, Square, Rect { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
record Rect(double w, double h) implements Shape { }

public class Main {
    static double area(Shape s) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

sealed interface Shape permits Circle, Square, Rect { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
record Rect(double w, double h) implements Shape { }

public class Main {
    static double area(Shape s) {
        if (s instanceof Circle c) return Math.PI * c.r() * c.r();
        if (s instanceof Square q) return q.side() * q.side();
        if (s instanceof Rect r) return r.w() * r.h();
        throw new IllegalStateException();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, int[]> counts = new TreeMap<>();
        Map<String, double[]> areas = new TreeMap<>();
        Shape largest = null;
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            Shape s = switch (kind) {
                case "circle" -> new Circle(in.nextDouble());
                case "square" -> new Square(in.nextDouble());
                default -> new Rect(in.nextDouble(), in.nextDouble());
            };
            String name = s.getClass().getSimpleName();
            counts.computeIfAbsent(name, k -> new int[1])[0]++;
            areas.computeIfAbsent(name, k -> new double[1])[0] += area(s);
            if (largest == null || area(s) > area(largest)) largest = s;
        }
        for (String kind : counts.keySet()) {
            System.out.println(String.format(Locale.ROOT, "%s: n=%d area=%.2f", kind, counts.get(kind)[0], areas.get(kind)[0]));
        }
        System.out.println("largest=" + largest);
        System.out.println("kinds=" + counts.size());
    }
}
`,
          hints: [
            "getClass().getSimpleName() gives the record's name for grouping.",
            "A TreeMap keeps kinds alphabetical; int[1]/double[1] are cheap mutable accumulators.",
            "Keep the largest shape itself, not just its area — its toString is the answer line.",
          ],
          cases: [
            { stdin: "3\ncircle 1\nrect 2 3\ncircle 2\n", expected: "Circle: n=2 area=15.71\nRect: n=1 area=6.00\nlargest=Circle[r=2.0]\nkinds=2\n" },
            { stdin: "1\nsquare 3\n", expected: "Square: n=1 area=9.00\nlargest=Square[side=3.0]\nkinds=1\n" },
            { stdin: "4\nrect 1 1\nsquare 1\ncircle 1\nrect 0.5 0.5\n", expected: "Circle: n=1 area=3.14\nRect: n=2 area=1.25\nSquare: n=1 area=1.00\nlargest=Circle[r=1.0]\nkinds=3\n", hidden: true },
          ],
        },
        {
          title: "Word bars",
          prompt: `Read all of standard input. Build one modern pipeline: \`lines()\` → \`strip\` → drop blank lines with \`Predicate.not(String::isBlank)\` → split into words → lower-case → count with \`groupingBy(…, counting())\`. Print the **top 5** words (most frequent first, ties alphabetical) as \`"%-8s %s %d".formatted(word, "#".repeat(count), count)\`, then \`distinct=<distinct words>\`.

Example: \`the cat the dog\` / \`The end\` →
\`\`\`
the      ### 3
cat      # 1
dog      # 1
end      # 1
distinct=4
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        Map<String, Long> counts = text.lines()
            .map(String::strip)
            .filter(Predicate.not(String::isBlank))
            .flatMap(l -> Arrays.stream(l.split("\\s+")))
            .map(String::toLowerCase)
            .collect(groupingBy(w -> w, counting()));
        List<Map.Entry<String, Long>> top = counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey()))
            .limit(5)
            .toList();
        for (Map.Entry<String, Long> e : top) {
            System.out.println("%-8s %s %d".formatted(e.getKey(), "#".repeat(e.getValue().intValue()), e.getValue()));
        }
        System.out.println("distinct=" + counts.size());
    }
}
`,
          hints: [
            "Predicate.not(String::isBlank) reads better than a lambda with a bang.",
            "Sort entries by value descending then key ascending; limit(5); toList().",
            "\"#\".repeat(count) draws the bar; %-8s left-aligns the word.",
          ],
          cases: [
            { stdin: "the cat the dog\nThe end\n", expected: "the      ### 3\ncat      # 1\ndog      # 1\nend      # 1\ndistinct=4\n" },
            { stdin: "a b c d e f g\n", expected: "a        # 1\nb        # 1\nc        # 1\nd        # 1\ne        # 1\ndistinct=7\n" },
            { stdin: "  \nZ z Z\n\n", expected: "z        ### 3\ndistinct=1\n", hidden: true },
          ],
        },
        {
          title: "Immutable configuration",
          prompt: `Read \`key=value\` lines until end of input (skip blanks) into a mutable map, then freeze it with \`Map.copyOf\`. Print \`port=<value or 8080>\`, \`host=<value or localhost>\` and \`debug=<value or false>\` using \`Objects.requireNonNullElse\` for the defaults; then \`keys=<all keys, sorted, comma-separated>\`; then try \`config.put("x", "y")\` and print \`frozen=true\` if it throws \`UnsupportedOperationException\`.

Example: \`port=9090\` / \`debug=true\` →
\`\`\`
port=9090
host=localhost
debug=true
keys=debug,port
frozen=true
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        Map<String, String> mutable = new HashMap<>();
        // TODO: parse lines
        Map<String, String> config = Map.copyOf(mutable);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        Map<String, String> mutable = new HashMap<>();
        for (String line : text.lines().map(String::strip).filter(l -> !l.isBlank()).toList()) {
            int eq = line.indexOf('=');
            mutable.put(line.substring(0, eq).strip(), line.substring(eq + 1).strip());
        }
        Map<String, String> config = Map.copyOf(mutable);
        System.out.println("port=" + Objects.requireNonNullElse(config.get("port"), "8080"));
        System.out.println("host=" + Objects.requireNonNullElse(config.get("host"), "localhost"));
        System.out.println("debug=" + Objects.requireNonNullElse(config.get("debug"), "false"));
        System.out.println("keys=" + String.join(",", new TreeSet<>(config.keySet())));
        try {
            config.put("x", "y");
            System.out.println("frozen=false");
        } catch (UnsupportedOperationException e) {
            System.out.println("frozen=true");
        }
    }
}
`,
          hints: [
            "Split on the first '=' only — values may contain more.",
            "Map.copyOf returns an immutable snapshot; the original map is untouched.",
            "Objects.requireNonNullElse(value, default) is the null-coalescing operator Java never got.",
          ],
          cases: [
            { stdin: "port=9090\ndebug=true\n", expected: "port=9090\nhost=localhost\ndebug=true\nkeys=debug,port\nfrozen=true\n" },
            { stdin: "\n", expected: "port=8080\nhost=localhost\ndebug=false\nkeys=\nfrozen=true\n" },
            { stdin: "host=db.internal\nurl=jdbc:mysql://x?a=b\n", expected: "port=8080\nhost=db.internal\ndebug=false\nkeys=host,url\nfrozen=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which are LTS releases?",
          options: ["9, 12, 15", "8, 11, 17, 21", "10, 14, 18", "Every release"],
          answer: 1,
          explanation: "Plus 25; production runs LTS with multi-year vendor support.",
        },
        {
          prompt: "Sealed classes became final in…",
          options: ["Java 15", "Java 16", "Java 17", "Java 21"],
          answer: 2,
          explanation: "Previewed in 15 and 16, final in the 17 LTS.",
        },
        {
          prompt: "`var` cannot be used for…",
          options: ["Loop variables", "Fields and method parameters", "Locals with initialisers", "Try-with-resources variables"],
          answer: 1,
          explanation: "Nor without an initialiser, with `null`, or with a bare lambda.",
        },
        {
          prompt: "Predict: `var s = \"hi\"; var l = List.of(); ` — the type of `l` is…",
          options: ["`List<String>`", "`List<Object>`", "Compile error", "`ArrayList<Object>`"],
          answer: 1,
          explanation: "No target type, so the generic method infers `Object`.",
        },
        {
          prompt: "After `if (o instanceof Integer i && i > 3) { … }`, `i` is in scope…",
          options: ["Everywhere in the method", "Inside the `if` body and on the right of the `&&` only", "Only in the condition", "Nowhere"],
          answer: 1,
          explanation: "Flow scoping: wherever the match is definitely true.",
        },
        {
          prompt: "An exhaustive pattern `switch` over a sealed type needs `default`…",
          options: ["Always", "Never — unless some permitted subtype is not covered", "Only for records", "Only in statements"],
          answer: 1,
          explanation: "Adding a permitted subtype makes every such switch fail to compile until handled.",
        },
        {
          prompt: "Record patterns let you…",
          options: ["Create records", "Deconstruct a record into its components in `case` or `instanceof`, nesting as deep as the data goes", "Serialise records", "Extend records"],
          answer: 1,
          explanation: "Final in 21; `var` is allowed for component types.",
        },
        {
          prompt: "`Set.of(\"a\", \"a\")`…",
          options: ["Returns a one-element set", "Throws `IllegalArgumentException: duplicate element: a`", "Returns an empty set", "Returns a list"],
          answer: 1,
          explanation: "The factories are strict: duplicates and nulls throw.",
        },
        {
          prompt: "`Stream.toList()` (16) compared to `collect(Collectors.toList())`…",
          options: ["Is identical", "Returns an unmodifiable list and is shorter; `Collectors.toList()` makes no immutability promise", "Returns an `ArrayList`", "Is slower"],
          answer: 1,
          explanation: "Use `toCollection(ArrayList::new)` when you need to mutate.",
        },
        {
          prompt: "`\"abc\".repeat(0)` returns…",
          options: ["`\"abc\"`", "`\"\"`", "`null`", "Throws"],
          answer: 1,
          explanation: "Zero repetitions is the empty string; a negative count throws `IllegalArgumentException`.",
        },
        {
          prompt: "Virtual threads are final in…",
          options: ["Java 17", "Java 19", "Java 21", "Java 25"],
          answer: 2,
          explanation: "Previewed in 19 and 20; structured concurrency remained preview.",
        },
        {
          prompt: "Virtual threads do **not** speed up…",
          options: ["Many blocking HTTP calls", "CPU-bound computation", "JDBC-heavy request handling", "Fan-out to several services"],
          answer: 1,
          explanation: "They make waiting cheap, not computing.",
        },
        {
          prompt: "A package that a module does not `exports`…",
          options: ["Is visible to everyone", "Is inaccessible to other modules — even via reflection unless `opens`", "Is visible to the classpath only", "Cannot contain classes"],
          answer: 1,
          explanation: "Strong encapsulation; `--add-opens` is the run-time escape hatch.",
        },
        {
          prompt: "`jshell` is…",
          options: ["A build tool", "A REPL for trying Java expressions and API calls interactively", "A profiler", "A debugger"],
          answer: 1,
          explanation: "Check what `Integer.valueOf(128) == Integer.valueOf(128)` prints before saying it in an interview.",
        },
        {
          prompt: "Java 18 changed the default charset to…",
          options: ["Latin-1", "UTF-8 everywhere (JEP 400)", "UTF-16", "The platform's"],
          answer: 1,
          explanation: "Removing the classic 'works on my machine' encoding bug — still name the charset explicitly.",
        },
      ],
    },
  ],
});

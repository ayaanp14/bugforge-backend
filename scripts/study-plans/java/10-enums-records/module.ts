import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "enums-records",
  title: "Enums & records",
  blurb: "Enums as fixed sets of instances with fields and behaviour, EnumSet and EnumMap, and records as transparent immutable data with validation.",
  icon: "list",
  overview: `Two of Java's most useful class forms are special-purpose: an enum is a class with a fixed set of named instances, and a record is a class that is nothing but its components. Both replace error-prone hand-written code — integer constants and parallel arrays on one side, forty-line data classes on the other — with declarations the compiler checks.

This module covers enums from the plain constant list through fields, constructors, per-constant behaviour, interfaces and code lookups, then the EnumSet and EnumMap collections built for them; and records from what they generate through compact constructors, wither methods, nesting, use as map keys and in streams, and the cases where a class is still right.

By the end you model "one of a known set" with enums and "just this data" with records, and reach for EnumMap and compact constructors without thinking.`,
  lessons: [
    {
      slug: "enum-basics",
      file: "01-enum-basics.md",
      exercises: [
        {
          title: "Days and their kinds",
          prompt: `Declare \`enum Day { MONDAY, …, SUNDAY }\`. Read an integer \`n\` and \`n\` tokens. For each token: parse it with \`Day.valueOf\` after trimming and upper-casing; if it is not a day print \`<token> unknown\`; otherwise print \`<NAME> <ordinal> <weekday|weekend> next=<the following day, wrapping from SUNDAY to MONDAY>\`. Use a switch expression over the enum for weekday/weekend and \`values()\` with the ordinal for \`next\`.

Example: \`3\` then \`friday Sunday funday\` →
\`\`\`
FRIDAY 4 weekday next=SATURDAY
SUNDAY 6 weekend next=MONDAY
funday unknown
\`\`\``,
          starter: String.raw`import java.util.*;

enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }

public class Main {
    static String kind(Day d) {
        // TODO: switch expression, no default
        return "";
    }

    static Day next(Day d) {
        // TODO
        return d;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }

public class Main {
    static String kind(Day d) {
        return switch (d) {
            case SATURDAY, SUNDAY -> "weekend";
            case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "weekday";
        };
    }

    static Day next(Day d) {
        Day[] all = Day.values();
        return all[(d.ordinal() + 1) % all.length];
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            try {
                Day d = Day.valueOf(token.trim().toUpperCase(Locale.ROOT));
                System.out.println(d.name() + " " + d.ordinal() + " " + kind(d) + " next=" + next(d));
            } catch (IllegalArgumentException e) {
                System.out.println(token + " unknown");
            }
        }
    }
}
`,
          hints: ["valueOf throws IllegalArgumentException for an unknown name — catch it.", "(ordinal + 1) % values().length wraps around."],
          cases: [
            { stdin: "3\nfriday Sunday funday\n", expected: "FRIDAY 4 weekday next=SATURDAY\nSUNDAY 6 weekend next=MONDAY\nfunday unknown\n" },
            { stdin: "2\nMONDAY saturday\n", expected: "MONDAY 0 weekday next=TUESDAY\nSATURDAY 5 weekend next=SUNDAY\n" },
            { stdin: "1\nwed\n", expected: "wed unknown\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `==` preferred to `equals` for enum comparison?",
          options: ["`equals` is not defined for enums", "Each constant is a single instance, so `==` is correct, null-safe and type-checked at compile time", "`==` is faster only", "`equals` compares ordinals"],
          answer: 1,
          explanation: "`a == b` cannot throw on a null left side and will not compile against a different enum type; `equals` gives neither guarantee.",
        },
        {
          prompt: "`Day.valueOf(\"friday\")`…",
          options: ["Returns `FRIDAY`", "Throws `IllegalArgumentException` — the name must match exactly", "Returns null", "Returns the closest match"],
          answer: 1,
          explanation: "`valueOf` is exact and case-sensitive. Normalise input first, or write a lenient lookup.",
        },
        {
          prompt: "Storing `ordinal()` in a database is risky because…",
          options: ["It is a `long`", "Reordering or inserting constants changes every stored value's meaning", "It is not unique", "It is negative"],
          answer: 1,
          explanation: "Persist `name()` instead; renaming a constant then becomes an explicit migration rather than silent corruption.",
        },
        {
          prompt: "A switch *expression* over an enum that covers every constant and has no `default`…",
          options: ["Fails to compile", "Compiles, and fails to compile later if a constant is added — deliberately", "Returns null for new constants", "Needs `yield`"],
          answer: 1,
          explanation: "Exhaustiveness is checked against the enum's constants; that check is the reason to omit `default`.",
        },
        {
          prompt: "Why is a one-constant enum a good singleton?",
          options: ["It is shorter to type", "The JVM guarantees one instance, including across serialization and reflection", "It is faster", "It can be extended"],
          answer: 1,
          explanation: "`Enum` handles `readResolve` and refuses reflective construction, closing the holes hand-written singletons have.",
        },
      ],
    },
    {
      slug: "enums-with-state",
      file: "02-enums-with-state.md",
      exercises: [
        {
          title: "Operations as an enum",
          prompt: `Declare \`enum Op\` with constants \`ADD("+")\`, \`SUB("-")\`, \`MUL("*")\`, \`DIV("/")\`, a \`symbol\` field, an abstract \`long apply(long a, long b)\` implemented per constant (\`DIV\` uses integer division and throws \`ArithmeticException\` on zero — let it propagate to a \`catch\` in \`main\` that prints \`error\`), and a static \`fromSymbol(String)\` lookup built from a static \`Map\`.

Read an integer \`n\` and \`n\` lines \`<a> <symbol> <b>\`; print each result, or \`error\` for division by zero, or \`unknown\` for a symbol that is not an operation.

Example: \`3\` then \`6 * 7\`, \`1 / 0\`, \`2 ^ 3\` →
\`\`\`
42
error
unknown
\`\`\``,
          starter: String.raw`import java.util.*;

enum Op {
    // TODO: ADD("+") { ... }, SUB, MUL, DIV

    private final String symbol;
    Op(String symbol) { this.symbol = symbol; }
    abstract long apply(long a, long b);

    // TODO: static Map<String, Op> BY_SYMBOL built in a static block, and fromSymbol()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = in.nextLine().trim().split("\\s+");
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

enum Op {
    ADD("+") { long apply(long a, long b) { return a + b; } },
    SUB("-") { long apply(long a, long b) { return a - b; } },
    MUL("*") { long apply(long a, long b) { return a * b; } },
    DIV("/") { long apply(long a, long b) { return a / b; } };

    private final String symbol;
    Op(String symbol) { this.symbol = symbol; }
    abstract long apply(long a, long b);

    private static final Map<String, Op> BY_SYMBOL = new HashMap<>();
    static {
        for (Op op : values()) BY_SYMBOL.put(op.symbol, op);
    }
    static Op fromSymbol(String s) { return BY_SYMBOL.get(s); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = in.nextLine().trim().split("\\s+");
            long a = Long.parseLong(t[0]);
            long b = Long.parseLong(t[2]);
            Op op = Op.fromSymbol(t[1]);
            if (op == null) {
                System.out.println("unknown");
                continue;
            }
            try {
                System.out.println(op.apply(a, b));
            } catch (ArithmeticException e) {
                System.out.println("error");
            }
        }
    }
}
`,
          hints: ["Constant-specific bodies go in braces right after the constructor arguments.", "The static block runs after the constants exist, so values() is complete."],
          cases: [
            { stdin: "3\n6 * 7\n1 / 0\n2 ^ 3\n", expected: "42\nerror\nunknown\n" },
            { stdin: "3\n10 - 15\n7 / 2\n3 + 4\n", expected: "-5\n3\n7\n" },
            { stdin: "1\n9223372036854775807 + 0\n", expected: "9223372036854775807\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An enum constructor is…",
          options: ["Public", "Implicitly private, called once per constant at class initialisation", "Static", "Not allowed"],
          answer: 1,
          explanation: "Only the constant declarations invoke it; `new` on an enum is a compile error.",
        },
        {
          prompt: "`enum E { A, B; static int count = 0; E() { count++; } }` fails because…",
          options: ["Enums cannot have static fields", "Constants are constructed before other static fields are initialised, so the constructor may not reference them", "`count` must be final", "Constructors cannot have bodies"],
          answer: 1,
          explanation: "Count in a static block after the constants, or use `values().length`.",
        },
        {
          prompt: "Which gives each constant its own implementation of `apply` most safely?",
          options: ["A `switch (this)` inside `apply`", "An abstract `apply` with a body per constant, or a functional-interface field", "Reflection", "Overloading"],
          answer: 1,
          explanation: "The compiler forces every constant to supply an implementation; a `switch (this)` silently misses new constants.",
        },
        {
          prompt: "A `fromCode(String)` lookup should be built…",
          options: ["Inside the constructor", "In a static block after the constants, into a `Map`", "With `valueOf`", "By scanning `ordinal()`"],
          answer: 1,
          explanation: "`valueOf` only knows constant names; a static map keyed by the external code is built once when the class initialises.",
        },
        {
          prompt: "Can an enum implement an interface?",
          options: ["No", "Yes, any number", "Only functional interfaces", "Only if it has no fields"],
          answer: 1,
          explanation: "Enums cannot extend classes (they extend `Enum`) but implement interfaces freely — including sealed ones.",
        },
      ],
    },
    {
      slug: "enumset-and-enummap",
      file: "03-enumset-and-enummap.md",
      exercises: [
        {
          title: "Tally by status",
          prompt: `Declare \`enum Status { OPEN, PAID, SHIPPED, CLOSED }\`. Read an integer \`n\` and \`n\` status names (exact upper-case names). Count them in an \`EnumMap<Status, Integer>\` and print one line per constant **in declaration order**, \`<NAME>=<count>\` (0 for statuses never seen). Then print \`seen=<the EnumSet of statuses that appeared, via toString>\` and \`missing=<EnumSet.complementOf(seen)>\`.

Example: \`3\` then \`PAID OPEN PAID\` →
\`\`\`
OPEN=1
PAID=2
SHIPPED=0
CLOSED=0
seen=[OPEN, PAID]
missing=[SHIPPED, CLOSED]
\`\`\``,
          starter: String.raw`import java.util.*;

enum Status { OPEN, PAID, SHIPPED, CLOSED }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);
        EnumSet<Status> seen = EnumSet.noneOf(Status.class);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

enum Status { OPEN, PAID, SHIPPED, CLOSED }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);
        EnumSet<Status> seen = EnumSet.noneOf(Status.class);
        for (int i = 0; i < n; i++) {
            Status s = Status.valueOf(in.next());
            counts.merge(s, 1, Integer::sum);
            seen.add(s);
        }
        for (Status s : Status.values()) {
            System.out.println(s + "=" + counts.getOrDefault(s, 0));
        }
        System.out.println("seen=" + seen);
        System.out.println("missing=" + EnumSet.complementOf(seen));
    }
}
`,
          hints: ["merge(key, 1, Integer::sum) increments a count in one call.", "EnumSet's toString lists constants in declaration order."],
          cases: [
            { stdin: "3\nPAID OPEN PAID\n", expected: "OPEN=1\nPAID=2\nSHIPPED=0\nCLOSED=0\nseen=[OPEN, PAID]\nmissing=[SHIPPED, CLOSED]\n" },
            { stdin: "0\n", expected: "OPEN=0\nPAID=0\nSHIPPED=0\nCLOSED=0\nseen=[]\nmissing=[OPEN, PAID, SHIPPED, CLOSED]\n" },
            { stdin: "4\nCLOSED SHIPPED PAID OPEN\n", expected: "OPEN=1\nPAID=1\nSHIPPED=1\nCLOSED=1\nseen=[OPEN, PAID, SHIPPED, CLOSED]\nmissing=[]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Internally, an `EnumSet` of an enum with 20 constants is…",
          options: ["A hash table", "A single `long` used as a bit vector", "An `ArrayList`", "A tree"],
          answer: 1,
          explanation: "Up to 64 constants fit in one `long`; membership is a bit test and set operations are bitwise.",
        },
        {
          prompt: "`new EnumMap<>(Status.class)` needs the class token because…",
          options: ["Generics are erased, and the map needs the constant count to size its array", "It is a convention", "To sort the keys", "To make it immutable"],
          answer: 0,
          explanation: "The backing array has one slot per constant, indexed by ordinal.",
        },
        {
          prompt: "Iteration order of `EnumMap.keySet()` is…",
          options: ["Insertion order", "Hash order", "Declaration (ordinal) order", "Reverse order"],
          answer: 2,
          explanation: "The array is indexed by ordinal, so keys come out in the enum's declared order.",
        },
        {
          prompt: "`EnumSet.copyOf(new ArrayList<Day>())` (an empty list)…",
          options: ["Returns an empty EnumSet", "Throws `IllegalArgumentException` — the element type cannot be inferred", "Returns null", "Compile error"],
          answer: 1,
          explanation: "Use `EnumSet.noneOf(Day.class)` for empties; `copyOf` of an `EnumSet` argument is always fine.",
        },
        {
          prompt: "An `EnumSet<Permission>` replaces…",
          options: ["Strings", "Integer bitmask flags (`FLAG_A | FLAG_B`) with a type-safe `Set`", "Enums", "Arrays"],
          answer: 1,
          explanation: "Same bit-level efficiency, plus the type system and the `Set` API.",
        },
      ],
    },
    {
      slug: "records",
      file: "04-records.md",
      exercises: [
        {
          title: "Points as records",
          prompt: `Declare \`record Point(int x, int y)\` with a method \`double distanceTo(Point o)\` and a static factory \`origin()\`. Read an integer \`n\` and \`n\` pairs \`x y\`. Put every point into a \`HashSet<Point>\` and print \`distinct=<size>\`; print \`hasOrigin=<set contains Point.origin()>\`; then print each **distinct** point in input order (use a \`LinkedHashSet\`) as its \`toString()\` followed by its distance to the origin with two decimals.

Example: \`3\` then \`3 4\`, \`0 0\`, \`3 4\` →
\`\`\`
distinct=2
hasOrigin=true
Point[x=3, y=4] 5.00
Point[x=0, y=0] 0.00
\`\`\``,
          starter: String.raw`import java.util.*;

record Point(int x, int y) {
    // TODO: distanceTo, origin()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> points = new LinkedHashSet<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

record Point(int x, int y) {
    double distanceTo(Point o) {
        double dx = x - o.x, dy = y - o.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    static Point origin() { return new Point(0, 0); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> points = new LinkedHashSet<>();
        for (int i = 0; i < n; i++) points.add(new Point(in.nextInt(), in.nextInt()));
        System.out.println("distinct=" + points.size());
        System.out.println("hasOrigin=" + points.contains(Point.origin()));
        for (Point p : points) {
            System.out.printf("%s %.2f%n", p, p.distanceTo(Point.origin()));
        }
    }
}
`,
          hints: ["The generated equals/hashCode make duplicate points collapse in the set.", "Records may declare instance methods and static factories."],
          cases: [
            { stdin: "3\n3 4\n0 0\n3 4\n", expected: "distinct=2\nhasOrigin=true\nPoint[x=3, y=4] 5.00\nPoint[x=0, y=0] 0.00\n" },
            { stdin: "2\n1 1\n-1 -1\n", expected: "distinct=2\nhasOrigin=false\nPoint[x=1, y=1] 1.41\nPoint[x=-1, y=-1] 1.41\n" },
            { stdin: "1\n6 8\n", expected: "distinct=1\nhasOrigin=false\nPoint[x=6, y=8] 10.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which is **not** generated for `record P(int a, String b)`?",
          options: ["Accessors `a()` and `b()`", "A canonical constructor `P(int, String)`", "Setters `setA`/`setB`", "`equals`, `hashCode`, `toString`"],
          answer: 2,
          explanation: "Records are immutable: no setters, and the fields are final.",
        },
        {
          prompt: "A record may…",
          options: ["Extend another class", "Declare an extra instance field", "Implement interfaces and declare methods and static members", "Be abstract"],
          answer: 2,
          explanation: "Records are final, extend `Record`, and allow no instance fields beyond the components — but methods, statics and interfaces are fine.",
        },
        {
          prompt: "A compact constructor `public Range { if (lo > hi) throw …; }`…",
          options: ["Replaces the fields", "Runs before the implicit field assignments and may validate or reassign the parameters", "Is a static factory", "Runs after construction"],
          answer: 1,
          explanation: "It has no parameter list; the component parameters are in scope and are assigned to the fields after the body.",
        },
        {
          prompt: "`record Bag(int[] items)` — `new Bag(new int[]{1}).equals(new Bag(new int[]{1}))` is…",
          options: ["`true`", "`false` — array components compare by reference", "A compile error", "`true` only with `Arrays.equals`"],
          answer: 1,
          explanation: "Generated `equals` calls `Object.equals` on reference components; arrays do not override it. Use a `List`.",
        },
        {
          prompt: "Records are described as *shallowly* immutable because…",
          options: ["Components can be reassigned", "Component fields are final, but the objects they reference may be mutable unless copied in", "They can be subclassed", "Accessors can be overridden"],
          answer: 1,
          explanation: "A `List` component is still a mutable list unless the compact constructor stores `List.copyOf(list)`.",
        },
      ],
    },
    {
      slug: "records-in-practice",
      file: "05-records-in-practice.md",
      exercises: [
        {
          title: "Validated emails, grouped by domain",
          prompt: `Declare \`record Email(String address)\` whose compact constructor trims and lower-cases the address and throws \`IllegalArgumentException\` if it does not contain exactly one \`@\` with non-empty parts on both sides. Add \`String domain()\`.

Read an integer \`n\` and \`n\` tokens; try to build an \`Email\` from each, counting rejects. Group the valid ones by domain in a \`TreeMap<String, List<Email>>\` and print \`<domain> <count>\` per domain in sorted order, then \`rejected=<count>\`. Duplicates (after normalisation) count once: collect into a \`LinkedHashSet<Email>\` first.

Example: \`4\` then \`Ada@Example.com ada@example.com bob@test.org broken\` →
\`\`\`
example.com 1
test.org 1
rejected=1
\`\`\``,
          starter: String.raw`import java.util.*;

record Email(String address) {
    public Email {
        // TODO: normalise and validate
    }
    String domain() {
        // TODO
        return "";
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

record Email(String address) {
    public Email {
        address = address.trim().toLowerCase(Locale.ROOT);
        int at = address.indexOf('@');
        if (at <= 0 || at != address.lastIndexOf('@') || at == address.length() - 1) {
            throw new IllegalArgumentException("not an email: " + address);
        }
    }
    String domain() { return address.substring(address.indexOf('@') + 1); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Email> valid = new LinkedHashSet<>();
        int rejected = 0;
        for (int i = 0; i < n; i++) {
            try {
                valid.add(new Email(in.next()));
            } catch (IllegalArgumentException e) {
                rejected++;
            }
        }
        TreeMap<String, List<Email>> byDomain = new TreeMap<>();
        for (Email e : valid) byDomain.computeIfAbsent(e.domain(), k -> new ArrayList<>()).add(e);
        for (Map.Entry<String, List<Email>> entry : byDomain.entrySet()) {
            System.out.println(entry.getKey() + " " + entry.getValue().size());
        }
        System.out.println("rejected=" + rejected);
    }
}
`,
          hints: ["Reassigning the parameter inside the compact constructor is how you normalise before storage.", "Equal normalised addresses are equal records — the set deduplicates them."],
          cases: [
            { stdin: "4\nAda@Example.com ada@example.com bob@test.org broken\n", expected: "example.com 1\ntest.org 1\nrejected=1\n" },
            { stdin: "3\n@x.com a@ a@@b.com\n", expected: "rejected=3\n" },
            { stdin: "3\nz@b.io y@a.io x@b.io\n", expected: "a.io 1\nb.io 2\nrejected=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "To \"change\" one component of a record you…",
          options: ["Call its setter", "Construct a new record — typically via a `withX` method", "Assign the field", "Use reflection"],
          answer: 1,
          explanation: "Records are immutable; modified copies are new instances.",
        },
        {
          prompt: "Records make good `HashMap` keys because…",
          options: ["They are small", "They are immutable with value-based generated `equals`/`hashCode`", "They are final", "They cache their hash"],
          answer: 1,
          explanation: "A `record Cell(int row, int col)` is the two-int key that used to need a hand-written class.",
        },
        {
          prompt: "A record declared inside a method (a local record)…",
          options: ["Can capture local variables", "Is implicitly static and visible only in that method", "Must be public", "Is not allowed"],
          answer: 1,
          explanation: "Local records tidy one pipeline's intermediate shape without polluting the class.",
        },
        {
          prompt: "Which should **not** be a record?",
          options: ["A `(row, col)` grid coordinate", "An immutable configuration value", "A shopping cart whose contents change over time", "A parse result"],
          answer: 2,
          explanation: "Mutable state with identity is a class. Records are for data defined entirely by their components.",
        },
        {
          prompt: "`record Team(String name, List<String> members)` with `members = List.copyOf(members)` in the compact constructor ensures…",
          options: ["Members are sorted", "The stored list is an immutable copy the caller cannot mutate later", "Nulls are allowed", "Faster equality"],
          answer: 1,
          explanation: "Without the copy the record would alias the caller's mutable list — shallow immutability made deep for that component.",
        },
      ],
    },
    {
      slug: "enums-records-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Planets",
          prompt: `Declare \`enum Planet\` with \`MERCURY(3.303e23, 2.4397e6)\`, \`EARTH(5.976e24, 6.37814e6)\` and \`JUPITER(1.9e27, 7.1492e7)\` (mass in kg, radius in m), a method \`surfaceGravity()\` = \`G * mass / (radius²)\` with \`G = 6.67300e-11\`, and \`surfaceWeight(double otherMass)\` = \`otherMass * surfaceGravity()\`. Read a weight on Earth in newtons; compute the mass as \`weight / EARTH.surfaceGravity()\` and print, for every planet in declaration order, \`<NAME> <weight with 2 decimals>\`.

Example: \`175\` →
\`\`\`
MERCURY 66.11
EARTH 175.00
JUPITER 442.85
\`\`\``,
          starter: String.raw`import java.util.*;

enum Planet {
    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        double earthWeight = in.nextDouble();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

enum Planet {
    MERCURY(3.303e23, 2.4397e6),
    EARTH(5.976e24, 6.37814e6),
    JUPITER(1.9e27, 7.1492e7);

    private static final double G = 6.67300e-11;
    private final double mass;
    private final double radius;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() { return G * mass / (radius * radius); }
    double surfaceWeight(double otherMass) { return otherMass * surfaceGravity(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        double earthWeight = in.nextDouble();
        double mass = earthWeight / Planet.EARTH.surfaceGravity();
        for (Planet p : Planet.values()) {
            System.out.printf("%s %.2f%n", p, p.surfaceWeight(mass));
        }
    }
}
`,
          hints: ["A static final G is fine — it is read from an instance method, not the constructor.", "values() iterates in declaration order."],
          cases: [
            { stdin: "175\n", expected: "MERCURY 66.11\nEARTH 175.00\nJUPITER 442.85\n" },
            { stdin: "0\n", expected: "MERCURY 0.00\nEARTH 0.00\nJUPITER 0.00\n" },
            { stdin: "1000\n", expected: "MERCURY 377.76\nEARTH 1000.00\nJUPITER 2530.56\n", hidden: true },
          ],
        },
        {
          title: "Inventory by category",
          prompt: `Declare \`enum Category { FOOD, TOOLS, TOYS }\` and \`record Item(String name, Category category, int qty, long priceCents)\` whose compact constructor rejects a negative quantity or price with \`IllegalArgumentException\`, plus \`long valueCents()\` = qty × price. Read an integer \`n\` and \`n\` lines \`<name> <CATEGORY> <qty> <priceCents>\`. Skip invalid items (count them). Total the value per category in an \`EnumMap\` and print, in declaration order, \`<CATEGORY> <total>\` for every category (0 if none), then \`invalid=<count>\`.

Example: \`3\` then \`apple FOOD 10 50\`, \`saw TOOLS -1 900\`, \`ball TOYS 2 300\` →
\`\`\`
FOOD 500
TOOLS 0
TOYS 600
invalid=1
\`\`\``,
          starter: String.raw`import java.util.*;

enum Category { FOOD, TOOLS, TOYS }

record Item(String name, Category category, int qty, long priceCents) {
    // TODO: compact constructor, valueCents()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

enum Category { FOOD, TOOLS, TOYS }

record Item(String name, Category category, int qty, long priceCents) {
    public Item {
        if (qty < 0 || priceCents < 0) throw new IllegalArgumentException("negative");
    }
    long valueCents() { return qty * priceCents; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        EnumMap<Category, Long> totals = new EnumMap<>(Category.class);
        int invalid = 0;
        for (int i = 0; i < n; i++) {
            String name = in.next();
            Category c = Category.valueOf(in.next());
            int qty = in.nextInt();
            long price = in.nextLong();
            try {
                Item item = new Item(name, c, qty, price);
                totals.merge(c, item.valueCents(), Long::sum);
            } catch (IllegalArgumentException e) {
                invalid++;
            }
        }
        for (Category c : Category.values()) {
            System.out.println(c + " " + totals.getOrDefault(c, 0L));
        }
        System.out.println("invalid=" + invalid);
    }
}
`,
          hints: ["Read all four fields before constructing, so a rejected line does not desynchronise the input.", "merge with Long::sum accumulates; getOrDefault prints 0 for untouched categories."],
          cases: [
            { stdin: "3\napple FOOD 10 50\nsaw TOOLS -1 900\nball TOYS 2 300\n", expected: "FOOD 500\nTOOLS 0\nTOYS 600\ninvalid=1\n" },
            { stdin: "2\nx TOOLS 1 1\ny TOOLS 2 2\n", expected: "FOOD 0\nTOOLS 5\nTOYS 0\ninvalid=0\n" },
            { stdin: "1\nz TOYS 0 -5\n", expected: "FOOD 0\nTOOLS 0\nTOYS 0\ninvalid=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`enum Color { RED, GREEN }` — `Color.RED.ordinal()` and `Color.RED.name()` are…",
          options: ["`\"RED\"` and 0", "0 and `\"RED\"`", "1 and `\"Red\"`", "0 and `\"red\"`"],
          answer: 1,
          explanation: "`ordinal` is the zero-based declaration index; `name` is the exact identifier.",
        },
        {
          prompt: "Can an enum extend a class?",
          options: ["Yes", "No — it implicitly extends `Enum`; it may implement interfaces", "Only abstract classes", "Only in the same package"],
          answer: 1,
          explanation: "Single inheritance is already used by `java.lang.Enum`.",
        },
        {
          prompt: "`switch (day)` where `day` is null…",
          options: ["Runs `default`", "Throws `NullPointerException`", "Matches nothing", "Is a compile error"],
          answer: 1,
          explanation: "The switch dispatches on `ordinal()`; guard for null before switching (or use Java 21's `case null`).",
        },
        {
          prompt: "Per-constant behaviour via constant-specific bodies means each such constant is…",
          options: ["A separate enum", "An anonymous subclass of the enum type", "Static", "Final and abstract"],
          answer: 1,
          explanation: "The enum is then not final; `getClass()` of such a constant differs from `getDeclaringClass()`.",
        },
        {
          prompt: "`EnumMap` versus `HashMap` for enum keys — the *ordering* difference is…",
          options: ["None", "`EnumMap` iterates in declaration order; `HashMap` order is unspecified", "`HashMap` sorts keys", "`EnumMap` uses insertion order"],
          answer: 1,
          explanation: "The backing array is indexed by ordinal, giving a natural, stable order.",
        },
        {
          prompt: "`EnumSet.complementOf(set)` returns…",
          options: ["The same set", "Every constant of the enum not in `set`", "An empty set", "The set sorted"],
          answer: 1,
          explanation: "A bit-flip over the enum's full range — `allOf` minus the given set.",
        },
        {
          prompt: "Which is true of record components?",
          options: ["They are mutable", "Each becomes a private final field with a same-named public accessor", "They are static", "They must be primitives"],
          answer: 1,
          explanation: "`record P(int x)` gives `private final int x` and `public int x()`.",
        },
        {
          prompt: "A record's generated `equals`…",
          options: ["Compares references", "Compares every component (primitives by value, references by `equals`)", "Compares only the first component", "Is not generated"],
          answer: 1,
          explanation: "Value semantics over all components, consistent with the generated `hashCode`.",
        },
        {
          prompt: "Inside a compact constructor, `this.x = x` is…",
          options: ["Required", "A compile error — assignment to the fields happens implicitly after the body", "Optional", "Only allowed for the first component"],
          answer: 1,
          explanation: "You may reassign the *parameter* `x`; the field assignment is generated.",
        },
        {
          prompt: "Returning two values from a method is idiomatically done with…",
          options: ["An `Object[]`", "A small record declared for the purpose (possibly local)", "Two globals", "An `int` pair packed into a `long`"],
          answer: 1,
          explanation: "Named, typed, one line — and structurally equal for tests.",
        },
        {
          prompt: "A record can implement `Comparable<Self>` by…",
          options: ["Nothing — records cannot implement interfaces", "Declaring `implements Comparable<Self>` and writing `compareTo`", "Overriding `equals`", "Using `ordinal()`"],
          answer: 1,
          explanation: "Records implement interfaces like any class; accessors with matching names satisfy interface methods automatically.",
        },
        {
          prompt: "Which framework need makes a record unsuitable?",
          options: ["JSON serialisation with Jackson", "A JPA entity requiring a no-arg constructor and setters", "Use as a map key", "Use in streams"],
          answer: 1,
          explanation: "Records have neither; use them for DTOs crossing the boundary and a class for the managed entity.",
        },
      ],
    },
  ],
}, more);

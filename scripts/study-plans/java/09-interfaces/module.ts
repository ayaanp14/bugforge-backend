import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "interfaces",
  title: "Interfaces",
  blurb: "Contracts without state, default/static/private methods and the diamond rule, functional interfaces, Comparable and Iterable, and sealed interfaces.",
  icon: "plug",
  overview: `An interface is a type made only of promises. It is how Java gets multiple inheritance of type, how unrelated classes share a capability, how lambdas get a type, and — since Java 8 — how published APIs evolve without breaking their implementors.

This module covers interfaces from the contract up: declaring and implementing them and programming to the interface type; default, static and private methods and the exact rules for resolving conflicting defaults; functional interfaces as the target type of every lambda, with the java.util.function toolkit; Comparable and Iterable as the two interfaces every value type should consider, plus the guidelines for designing your own; and sealed interfaces, which close a hierarchy so the compiler can check it.

By the end you implement interfaces idiomatically, resolve a default-method diamond, choose the right functional interface, and model a closed set of alternatives with sealed types and records.`,
  lessons: [
    {
      slug: "interface-basics",
      file: "01-interface-basics.md",
      exercises: [
        {
          title: "Shapes through an interface",
          prompt: `Declare \`interface Shape\` with \`double area()\` and \`String name()\`. Implement it in three **unrelated** classes \`Circle\`, \`Rect\` and \`Triangle\` (no shared parent). Read an integer \`n\` and \`n\` lines \`circle <r>\`, \`rect <w> <h>\` or \`tri <b> <h>\`; put them in a \`List<Shape>\`, print each as \`<name>=<area with 2 decimals>\`, and finish with \`total=<sum with 2 decimals>\`.

Example: \`2\` then \`circle 1\`, \`tri 4 3\` →
\`\`\`
circle=3.14
triangle=6.00
total=9.14
\`\`\``,
          starter: String.raw`import java.util.*;

interface Shape {
    double area();
    String name();
}

// TODO: Circle, Rect, Triangle implement Shape

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Shape> shapes = new ArrayList<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

interface Shape {
    double area();
    String name();
}

class Circle implements Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    public double area() { return Math.PI * r * r; }
    public String name() { return "circle"; }
}

class Rect implements Shape {
    private final double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    public double area() { return w * h; }
    public String name() { return "rect"; }
}

class Triangle implements Shape {
    private final double b, h;
    Triangle(double b, double h) { this.b = b; this.h = h; }
    public double area() { return 0.5 * b * h; }
    public String name() { return "triangle"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Shape> shapes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            switch (kind) {
                case "circle" -> shapes.add(new Circle(in.nextDouble()));
                case "rect" -> shapes.add(new Rect(in.nextDouble(), in.nextDouble()));
                default -> shapes.add(new Triangle(in.nextDouble(), in.nextDouble()));
            }
        }
        double total = 0;
        for (Shape s : shapes) {
            System.out.printf("%s=%.2f%n", s.name(), s.area());
            total += s.area();
        }
        System.out.printf("total=%.2f%n", total);
    }
}
`,
          hints: ["Implementing methods must be public.", "The list is typed as the interface; the elements are whatever implements it."],
          cases: [
            { stdin: "2\ncircle 1\ntri 4 3\n", expected: "circle=3.14\ntriangle=6.00\ntotal=9.14\n" },
            { stdin: "3\nrect 2 2\nrect 0.5 0.5\ncircle 0\n", expected: "rect=4.00\nrect=0.25\ncircle=0.00\ntotal=4.25\n" },
            { stdin: "1\ntri 10 10\n", expected: "triangle=50.00\ntotal=50.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A method declared in an interface without a body is implicitly…",
          options: ["`private`", "`public abstract`", "`protected`", "`static`"],
          answer: 1,
          explanation: "That is why the implementing class must declare it `public` — an override cannot reduce visibility.",
        },
        {
          prompt: "Fields declared in an interface are…",
          options: ["Instance fields shared by implementors", "`public static final` constants", "Private", "Not allowed at all"],
          answer: 1,
          explanation: "Interfaces carry no state. A field is a constant; abusing this as a way to \"inherit\" constants is an anti-pattern.",
        },
        {
          prompt: "`List<String> xs = new ArrayList<>();` is preferred over `ArrayList<String> xs = …` because…",
          options: ["It is faster", "Code depends on the `List` contract, so the implementation can change in one place", "`ArrayList` is deprecated", "It uses less memory"],
          answer: 1,
          explanation: "Programming to the interface keeps the choice of class local to construction.",
        },
        {
          prompt: "How many interfaces can a class implement?",
          options: ["One", "Two", "Any number", "One per package"],
          answer: 2,
          explanation: "Multiple inheritance of *type* is allowed; only class inheritance is single.",
        },
        {
          prompt: "A marker interface such as `Serializable`…",
          options: ["Has one abstract method", "Has no methods and tags a class as a type", "Cannot be implemented", "Is deprecated"],
          answer: 1,
          explanation: "Library code tests `instanceof Serializable`; the interface exists so the tag is a type a parameter can require.",
        },
      ],
    },
    {
      slug: "default-static-private-methods",
      file: "02-default-static-private-methods.md",
      exercises: [
        {
          title: "Resolve the diamond",
          prompt: `Two interfaces, \`Swimmer\` and \`Flyer\`, each declare \`default String move()\` returning \`"swim"\` and \`"fly"\`, plus \`default int speed()\` returning 2 and 10. \`Duck\` implements both and must resolve the conflicts: \`move()\` returns \`Swimmer.super.move() + "+" + Flyer.super.move()\` and \`speed()\` returns the larger of the two. Also add a static method \`Flyer.maxAltitude()\` returning 1000 and print it via the interface name.

Read an integer \`n\` and print \`n\` lines: for each, the duck's \`move()\`, its \`speed()\` and \`Flyer.maxAltitude()\` joined by spaces.

Example: \`2\` →
\`\`\`
swim+fly 10 1000
swim+fly 10 1000
\`\`\``,
          starter: String.raw`import java.util.*;

interface Swimmer {
    default String move() { return "swim"; }
    default int speed() { return 2; }
}

interface Flyer {
    default String move() { return "fly"; }
    default int speed() { return 10; }
    // TODO: static int maxAltitude()
}

class Duck implements Swimmer, Flyer {
    // TODO: resolve move() and speed()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Duck d = new Duck();
        for (int i = 0; i < n; i++) {
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

interface Swimmer {
    default String move() { return "swim"; }
    default int speed() { return 2; }
}

interface Flyer {
    default String move() { return "fly"; }
    default int speed() { return 10; }
    static int maxAltitude() { return 1000; }
}

class Duck implements Swimmer, Flyer {
    @Override
    public String move() { return Swimmer.super.move() + "+" + Flyer.super.move(); }

    @Override
    public int speed() { return Math.max(Swimmer.super.speed(), Flyer.super.speed()); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Duck d = new Duck();
        for (int i = 0; i < n; i++) {
            System.out.println(d.move() + " " + d.speed() + " " + Flyer.maxAltitude());
        }
    }
}
`,
          hints: ["Without the overrides, Duck does not compile — unrelated defaults.", "Interface.super.method() reaches a specific default; static interface methods are called on the interface name."],
          cases: [
            { stdin: "2\n", expected: "swim+fly 10 1000\nswim+fly 10 1000\n" },
            { stdin: "1\n", expected: "swim+fly 10 1000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why were default methods added to Java?",
          options: ["To replace abstract classes", "To let interfaces such as `Collection` gain methods (`stream`) without breaking existing implementors", "For performance", "To allow interface fields"],
          answer: 1,
          explanation: "Adding an abstract method breaks every implementation; a default arrives with a body they all inherit.",
        },
        {
          prompt: "A class implements two interfaces that both provide `default void m()`. The class does not override `m`. Result?",
          options: ["The first interface wins", "Compile error: the class must override `m` and may call `X.super.m()`", "Runtime error", "Both run"],
          answer: 1,
          explanation: "The compiler refuses to guess between unrelated defaults. The class resolves it explicitly.",
        },
        {
          prompt: "A superclass defines `m()`; an interface the class implements has `default m()`. Which is used?",
          options: ["The interface's default", "The superclass's method — classes win over interfaces", "Compile error", "Whichever is declared first"],
          answer: 1,
          explanation: "Rule 1 of resolution: a method from a class always beats an interface default — which is also why `Object` methods cannot be defaulted.",
        },
        {
          prompt: "Static methods declared in an interface are…",
          options: ["Inherited by implementing classes", "Called on the interface name and not inherited", "Implicitly default", "Not allowed"],
          answer: 1,
          explanation: "`Comparator.comparing(...)`, `List.of(...)` — factories that belong with the type but not with every implementor.",
        },
        {
          prompt: "Private interface methods (Java 9) exist to…",
          options: ["Hide the abstract methods", "Share code between default methods without exposing it as API", "Store state", "Replace static methods"],
          answer: 1,
          explanation: "A private helper can be called only from within the interface's own default and static methods.",
        },
      ],
    },
    {
      slug: "functional-interfaces",
      file: "03-functional-interfaces.md",
      exercises: [
        {
          title: "Validators from lambdas",
          prompt: `Declare \`@FunctionalInterface interface Validator<T>\` with \`boolean isValid(T value)\` and a default \`and(Validator<T> other)\`. Build three validators for strings with lambdas: non-empty, length ≤ 8, and letters only (\`s.chars().allMatch(Character::isLetter)\`), combined with \`and\`. Read an integer \`n\` and \`n\` tokens; print \`<token> ok\` or \`<token> rejected\` for each, then \`accepted=<count>\`.

Example: \`3\` then \`java Java17 verylongword\` →
\`\`\`
java ok
Java17 rejected
verylongword rejected
accepted=1
\`\`\``,
          starter: String.raw`import java.util.*;

@FunctionalInterface
interface Validator<T> {
    boolean isValid(T value);

    default Validator<T> and(Validator<T> other) {
        // TODO: a lambda that requires both
        return null;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO: build the combined validator from three lambdas
        int accepted = 0;
        for (int i = 0; i < n; i++) {
            String token = in.next();
            // TODO
        }
        System.out.println("accepted=" + accepted);
    }
}
`,
          solution: String.raw`import java.util.*;

@FunctionalInterface
interface Validator<T> {
    boolean isValid(T value);

    default Validator<T> and(Validator<T> other) {
        return v -> isValid(v) && other.isValid(v);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Validator<String> nonEmpty = s -> !s.isEmpty();
        Validator<String> shortEnough = s -> s.length() <= 8;
        Validator<String> lettersOnly = s -> s.chars().allMatch(Character::isLetter);
        Validator<String> rule = nonEmpty.and(shortEnough).and(lettersOnly);
        int accepted = 0;
        for (int i = 0; i < n; i++) {
            String token = in.next();
            boolean ok = rule.isValid(token);
            if (ok) accepted++;
            System.out.println(token + (ok ? " ok" : " rejected"));
        }
        System.out.println("accepted=" + accepted);
    }
}
`,
          hints: ["A lambda's parameter is the SAM's parameter; its body is the return value.", "and() returns a new lambda that closes over this and other."],
          cases: [
            { stdin: "3\njava Java17 verylongword\n", expected: "java ok\nJava17 rejected\nverylongword rejected\naccepted=1\n" },
            { stdin: "2\nabcdefgh abcdefghi\n", expected: "abcdefgh ok\nabcdefghi rejected\naccepted=1\n" },
            { stdin: "1\nx\n", expected: "x ok\naccepted=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A functional interface has…",
          options: ["No methods", "Exactly one abstract method (defaults and statics allowed)", "Only default methods", "One method of any kind"],
          answer: 1,
          explanation: "The single abstract method is what a lambda implements; extra defaults and statics do not count.",
        },
        {
          prompt: "`@FunctionalInterface` causes…",
          options: ["Lambdas to run faster", "A compile error if the interface gains a second abstract method", "Automatic default methods", "Nothing — it is documentation only"],
          answer: 1,
          explanation: "It protects every lambda that targets the interface from a future incompatible change.",
        },
        {
          prompt: "Which interface fits \"take a `String`, return an `Integer`\"?",
          options: ["`Predicate<String>`", "`Function<String, Integer>`", "`Supplier<Integer>`", "`Consumer<String>`"],
          answer: 1,
          explanation: "One input, one output of a different type is `Function<T, R>`. `Predicate` returns boolean; `Supplier` takes nothing; `Consumer` returns nothing.",
        },
        {
          prompt: "`Runnable` vs `Callable<V>`?",
          options: ["Identical", "`Callable` returns a value and may throw checked exceptions", "`Runnable` returns a value", "`Callable` is for threads only"],
          answer: 1,
          explanation: "`void run()` versus `V call() throws Exception` — the executor framework accepts both.",
        },
        {
          prompt: "`twice.andThen(plusOne).apply(5)` where `twice = x -> x * 2` and `plusOne = x -> x + 1` gives…",
          options: ["12", "11", "10", "6"],
          answer: 1,
          explanation: "`andThen` applies `twice` first, then `plusOne`: (5 × 2) + 1. `compose` would do the reverse.",
        },
      ],
    },
    {
      slug: "comparable-iterable-and-design",
      file: "04-comparable-iterable-and-design.md",
      exercises: [
        {
          title: "A countdown you can loop over",
          prompt: `Write \`class Countdown implements Iterable<Integer>\` that iterates from a start value down to 1 (an empty sequence if the start is below 1). Its \`iterator()\` must return a fresh iterator each call, and \`next()\` past the end must throw \`NoSuchElementException\`.

Read an integer \`n\` and \`n\` start values. For each, iterate with a for-each loop and print the values space-separated (an empty line for an empty sequence), then a second line \`sum=<sum>\` computed by a **second** for-each over the same object.

Example: \`2\` then \`3 0\` →
\`\`\`
3 2 1
sum=6

sum=0
\`\`\``,
          starter: String.raw`import java.util.*;

class Countdown implements Iterable<Integer> {
    private final int start;
    Countdown(int start) { this.start = start; }

    @Override
    public Iterator<Integer> iterator() {
        // TODO: an anonymous Iterator with hasNext/next
        return null;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Countdown c = new Countdown(in.nextInt());
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class Countdown implements Iterable<Integer> {
    private final int start;
    Countdown(int start) { this.start = start; }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int current = start;
            @Override public boolean hasNext() { return current >= 1; }
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return current--;
            }
        };
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Countdown c = new Countdown(in.nextInt());
            StringBuilder sb = new StringBuilder();
            for (int v : c) {
                if (sb.length() > 0) sb.append(' ');
                sb.append(v);
            }
            System.out.println(sb);
            long sum = 0;
            for (int v : c) sum += v;
            System.out.println("sum=" + sum);
        }
    }
}
`,
          hints: ["Keep the cursor inside the iterator object, not in Countdown, so each iterator() is independent.", "for-each calls iterator() again for the second loop."],
          cases: [
            { stdin: "2\n3 0\n", expected: "3 2 1\nsum=6\n\nsum=0\n" },
            { stdin: "1\n5\n", expected: "5 4 3 2 1\nsum=15\n" },
            { stdin: "2\n1 -4\n", expected: "1\nsum=1\n\nsum=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why should `compareTo` be consistent with `equals`?",
          options: ["The compiler requires it", "`TreeSet`/`TreeMap` use `compareTo` to decide duplicates and would disagree with `HashSet`", "For speed", "It is not recommended"],
          answer: 1,
          explanation: "Sorted collections never call `equals`; elements comparing as 0 are treated as the same.",
        },
        {
          prompt: "`Comparable` versus `Comparator`?",
          options: ["Same thing", "`Comparable` is the type's own natural order; `Comparator` is an external, additional ordering", "`Comparator` is for primitives", "`Comparable` is deprecated"],
          answer: 1,
          explanation: "One natural order lives in the class; any number of comparators can be passed to sorts and sorted collections.",
        },
        {
          prompt: "For-each over an object requires it to implement…",
          options: ["`Collection`", "`Iterable`", "`List`", "`Iterator`"],
          answer: 1,
          explanation: "The loop calls `iterator()` and then `hasNext`/`next`. Arrays are handled specially by the compiler.",
        },
        {
          prompt: "`Iterator.next()` called when `hasNext()` is false must…",
          options: ["Return null", "Throw `NoSuchElementException`", "Return the last element", "Restart"],
          answer: 1,
          explanation: "That is the `Iterator` contract; returning a value would silently corrupt loops that forgot to check.",
        },
        {
          prompt: "Interface segregation suggests…",
          options: ["One huge interface per module", "Small, role-specific interfaces so implementors depend only on what they use", "No interfaces", "Interfaces with only default methods"],
          answer: 1,
          explanation: "`Readable` and `Writable` rather than one `ReadWritable` that half the implementors must partially reject.",
        },
      ],
    },
    {
      slug: "sealed-interfaces",
      file: "05-sealed-interfaces.md",
      exercises: [
        {
          title: "Parse results without exceptions",
          prompt: `Declare \`sealed interface ParseResult permits Ok, Err\` with \`record Ok(long value)\` and \`record Err(String message)\` implementing it. Write \`static ParseResult parse(String s)\` returning \`Ok\` for a valid \`long\` and \`Err("not a number: " + s)\` otherwise (catch \`NumberFormatException\`).

Read an integer \`n\` and \`n\` tokens. For each, use \`instanceof\` patterns on the result: print \`ok <value>\` or \`err <message>\`. Finally print \`sum=<sum of all Ok values>\`.

Example: \`3\` then \`12 x7 -5\` →
\`\`\`
ok 12
err not a number: x7
ok -5
sum=7
\`\`\``,
          starter: String.raw`import java.util.*;

sealed interface ParseResult permits Ok, Err { }
record Ok(long value) implements ParseResult { }
record Err(String message) implements ParseResult { }

public class Main {
    static ParseResult parse(String s) {
        // TODO
        return null;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) {
            ParseResult r = parse(in.next());
            // TODO: instanceof patterns
        }
        System.out.println("sum=" + sum);
    }
}
`,
          solution: String.raw`import java.util.*;

sealed interface ParseResult permits Ok, Err { }
record Ok(long value) implements ParseResult { }
record Err(String message) implements ParseResult { }

public class Main {
    static ParseResult parse(String s) {
        try {
            return new Ok(Long.parseLong(s));
        } catch (NumberFormatException e) {
            return new Err("not a number: " + s);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) {
            ParseResult r = parse(in.next());
            if (r instanceof Ok ok) {
                sum += ok.value();
                System.out.println("ok " + ok.value());
            } else if (r instanceof Err err) {
                System.out.println("err " + err.message());
            }
        }
        System.out.println("sum=" + sum);
    }
}
`,
          hints: ["Records get accessors named after their components: ok.value(), err.message().", "The sealed interface guarantees these two branches cover every result."],
          cases: [
            { stdin: "3\n12 x7 -5\n", expected: "ok 12\nerr not a number: x7\nok -5\nsum=7\n" },
            { stdin: "2\n9223372036854775807 9223372036854775808\n", expected: "ok 9223372036854775807\nerr not a number: 9223372036854775808\nsum=9223372036854775807\n" },
            { stdin: "1\nabc\n", expected: "err not a number: abc\nsum=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A permitted implementor of a sealed interface must be…",
          options: ["Abstract", "`final`, `sealed` or `non-sealed`", "In another package", "A class, never a record"],
          answer: 1,
          explanation: "Each branch declares whether the hierarchy closes, continues closed, or reopens. Records and enums are implicitly final.",
        },
        {
          prompt: "The main benefit of sealing a hierarchy is…",
          options: ["Faster dispatch", "The compiler knows every subtype, enabling exhaustive pattern switches", "Smaller class files", "Automatic `equals`"],
          answer: 1,
          explanation: "Adding a variant then fails to compile at every switch that does not handle it — the safety enums give constants, for data-carrying types.",
        },
        {
          prompt: "Why pair sealed interfaces with records?",
          options: ["Records are required by the syntax", "Records are final, immutable data carriers with generated equals/hashCode/toString — ideal variant leaves", "Classes cannot implement interfaces", "Records are faster"],
          answer: 1,
          explanation: "A sealed interface of records is Java's algebraic data type: `Ok(value) | Err(message)`.",
        },
        {
          prompt: "When should you **not** seal an interface?",
          options: ["When implementations are a closed set", "When other modules or plugins should be able to implement it", "When using records", "Never"],
          answer: 1,
          explanation: "Sealing trades open extension by type for safe extension by operation; choose it when the variants are fixed by design.",
        },
        {
          prompt: "Enums versus sealed types?",
          options: ["Same feature", "Enums are a fixed set of instances; sealed types are a fixed set of types whose instances carry data", "Sealed types cannot have methods", "Enums are newer"],
          answer: 1,
          explanation: "`Color.RED` is one object; every `new Circle(r)` is a distinct instance of one of the permitted types.",
        },
      ],
    },
    {
      slug: "interfaces-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Ordered, iterable playlist",
          prompt: `Write \`final class Track implements Comparable<Track>\` with a title and a duration in seconds; natural order is by duration ascending, then title. Write \`class Playlist implements Iterable<Track>\` that stores tracks in insertion order and offers \`sorted()\` returning a **new** \`List<Track>\` in natural order (\`Collections.sort\` on a copy).

Read an integer \`n\` and \`n\` lines \`<title> <seconds>\` (titles have no spaces). Print the playlist in insertion order via for-each, one per line as \`<title> (<seconds>s)\`, then a line \`--\`, then the sorted order in the same format.

Example: \`3\` then \`intro 30\`, \`epic 300\`, \`bridge 30\` →
\`\`\`
intro (30s)
epic (300s)
bridge (30s)
--
bridge (30s)
intro (30s)
epic (300s)
\`\`\``,
          starter: String.raw`import java.util.*;

final class Track implements Comparable<Track> {
    // TODO
}

class Playlist implements Iterable<Track> {
    private final List<Track> tracks = new ArrayList<>();
    // TODO: add, iterator, sorted
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Playlist p = new Playlist();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

final class Track implements Comparable<Track> {
    private final String title;
    private final int seconds;

    Track(String title, int seconds) {
        this.title = title;
        this.seconds = seconds;
    }

    @Override
    public int compareTo(Track o) {
        int c = Integer.compare(seconds, o.seconds);
        return c != 0 ? c : title.compareTo(o.title);
    }

    @Override
    public String toString() { return title + " (" + seconds + "s)"; }
}

class Playlist implements Iterable<Track> {
    private final List<Track> tracks = new ArrayList<>();

    void add(Track t) { tracks.add(t); }

    @Override
    public Iterator<Track> iterator() { return tracks.iterator(); }

    List<Track> sorted() {
        List<Track> copy = new ArrayList<>(tracks);
        Collections.sort(copy);
        return copy;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Playlist p = new Playlist();
        for (int i = 0; i < n; i++) p.add(new Track(in.next(), in.nextInt()));
        for (Track t : p) System.out.println(t);
        System.out.println("--");
        for (Track t : p.sorted()) System.out.println(t);
    }
}
`,
          hints: ["Delegating iterator() to the list's iterator is fine — it is fresh on each call.", "Sort a copy so insertion order in the playlist is preserved."],
          cases: [
            { stdin: "3\nintro 30\nepic 300\nbridge 30\n", expected: "intro (30s)\nepic (300s)\nbridge (30s)\n--\nbridge (30s)\nintro (30s)\nepic (300s)\n" },
            { stdin: "1\nsolo 1\n", expected: "solo (1s)\n--\nsolo (1s)\n" },
            { stdin: "2\nb 10\na 10\n", expected: "b (10s)\na (10s)\n--\na (10s)\nb (10s)\n", hidden: true },
          ],
        },
        {
          title: "Pricing strategies",
          prompt: `Declare \`@FunctionalInterface interface Pricing { long price(long baseCents, int qty); }\`. Provide three implementations: a class \`Flat\` (base × qty), a class \`Bulk\` (10% off the flat price when qty ≥ 10, integer division), and a **lambda** for \`Member\` pricing (flat price minus 200 cents per item, never below 0). Read an integer \`n\` and \`n\` lines \`<strategy> <baseCents> <qty>\` where strategy is \`flat\`, \`bulk\` or \`member\`; look up the \`Pricing\` in a \`Map<String, Pricing>\` and print the price.

Example: \`3\` then \`flat 1000 2\`, \`bulk 1000 10\`, \`member 100 3\` →
\`\`\`
2000
9000
0
\`\`\``,
          starter: String.raw`import java.util.*;

@FunctionalInterface
interface Pricing {
    long price(long baseCents, int qty);
}

class Flat implements Pricing {
    // TODO
}

class Bulk implements Pricing {
    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Pricing> strategies = new HashMap<>();
        // TODO: put flat, bulk and a lambda for member
        for (int i = 0; i < n; i++) {
            String name = in.next();
            long base = in.nextLong();
            int qty = in.nextInt();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

@FunctionalInterface
interface Pricing {
    long price(long baseCents, int qty);
}

class Flat implements Pricing {
    public long price(long baseCents, int qty) { return baseCents * qty; }
}

class Bulk implements Pricing {
    public long price(long baseCents, int qty) {
        long flat = baseCents * qty;
        return qty >= 10 ? flat * 90 / 100 : flat;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Pricing> strategies = new HashMap<>();
        strategies.put("flat", new Flat());
        strategies.put("bulk", new Bulk());
        strategies.put("member", (base, qty) -> Math.max(0, base * qty - 200L * qty));
        for (int i = 0; i < n; i++) {
            String name = in.next();
            long base = in.nextLong();
            int qty = in.nextInt();
            System.out.println(strategies.get(name).price(base, qty));
        }
    }
}
`,
          hints: ["A lambda with two parameters targets the two-parameter SAM.", "Classes and lambdas are interchangeable as Pricing values in the map."],
          cases: [
            { stdin: "3\nflat 1000 2\nbulk 1000 10\nmember 100 3\n", expected: "2000\n9000\n0\n" },
            { stdin: "2\nbulk 1000 9\nmember 500 4\n", expected: "9000\n1200\n" },
            { stdin: "1\nflat 0 100\n", expected: "0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Implementing an interface method with package-private access…",
          options: ["Is fine", "Is a compile error — interface methods are public and access cannot be reduced", "Makes the method default", "Is allowed in the same package"],
          answer: 1,
          explanation: "\"attempting to assign weaker access privileges; was public\" — add `public`.",
        },
        {
          prompt: "`interface A { default void m(){} } interface B extends A { default void m(){} } class C implements A, B {}` — `new C().m()` calls…",
          options: ["A's", "B's — the more specific interface wins", "Compile error", "Neither"],
          answer: 1,
          explanation: "Rule 2 of default resolution: a subinterface's default overrides its parent's. No override in `C` is required.",
        },
        {
          prompt: "Which cannot be declared in an interface?",
          options: ["A `default` method", "A `static` method", "An instance field", "A `private static` method"],
          answer: 2,
          explanation: "Interfaces hold no per-instance state. Constants are the only fields.",
        },
        {
          prompt: "`Comparator<T>` declares `boolean equals(Object)` abstractly and yet is functional because…",
          options: ["It has no other methods", "Redeclared public `Object` methods do not count toward the single abstract method", "`equals` is a default", "It is an exception in the compiler"],
          answer: 1,
          explanation: "Every implementation already inherits `equals` from `Object`, so the redeclaration does not need a lambda body.",
        },
        {
          prompt: "Which functional interface matches `(int a, int b) -> a + b` for `Integer`s?",
          options: ["`Function<Integer, Integer>`", "`BinaryOperator<Integer>`", "`Supplier<Integer>`", "`Predicate<Integer>`"],
          answer: 1,
          explanation: "Two inputs and an output all of the same type is `BinaryOperator<T>` — `BiFunction<T, T, T>`.",
        },
        {
          prompt: "`Collections.sort(list)` on a `List<Track>` requires…",
          options: ["`Track` to override `equals`", "`Track` to implement `Comparable<Track>`", "A `Comparator` always", "`Track` to be final"],
          answer: 1,
          explanation: "The no-comparator sort uses the natural order; without `Comparable` it is a compile error.",
        },
        {
          prompt: "A `TreeSet<BigDecimal>` given `2.0` and `2.00` contains…",
          options: ["Two elements", "One element — `compareTo` treats them as equal even though `equals` does not", "Zero", "It throws"],
          answer: 1,
          explanation: "Sorted collections use `compareTo`; this is the classic `compareTo`/`equals` inconsistency.",
        },
        {
          prompt: "An `Iterable` whose `iterator()` returns the **same** iterator object every time…",
          options: ["Is fine", "Breaks a second for-each loop, which finds it already exhausted", "Is faster", "Is required"],
          answer: 1,
          explanation: "Each `iterator()` call must start from the beginning; keep the cursor in the iterator, not the iterable.",
        },
        {
          prompt: "A sealed interface with `permits` omitted…",
          options: ["Is a compile error", "Is allowed when all implementors are in the same source file; they are inferred", "Permits everything", "Permits nothing"],
          answer: 1,
          explanation: "Same-file implementors are found by the compiler; across files the list must be explicit.",
        },
        {
          prompt: "Modelling `Ok(value) | Err(message)` as a sealed interface of records avoids…",
          options: ["Generics", "Exceptions for expected failures and nullable fields for the missing half", "Interfaces", "Records"],
          answer: 1,
          explanation: "The type states that a result is exactly one shape or the other, and the caller must handle both.",
        },
        {
          prompt: "Depending on interfaces at boundaries (`Clock`, `Repository`) primarily improves…",
          options: ["Run-time speed", "Testability and the ability to swap implementations", "Memory use", "Compile time"],
          answer: 1,
          explanation: "A test supplies a fake implementation; production supplies the real one; the logic between them does not change.",
        },
        {
          prompt: "`default String toString() { … }` inside an interface is…",
          options: ["Valid", "A compile error — `Object` methods cannot be defaulted", "Valid only with `@Override`", "Ignored"],
          answer: 1,
          explanation: "Class methods always beat interface defaults, so such a default could never be selected; the compiler rejects it.",
        },
      ],
    },
  ],
}, more);

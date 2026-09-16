import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "interface-basics": [
    {
      title: "Greeters behind one contract",
      prompt: `Declare \`interface Greeter { String greet(String name); }\` and three implementations: \`Formal\` (\`Good day, <name>.\`), \`Casual\` (\`Hey <name>!\`) and \`Shouty\` (\`<NAME>!!!\` in upper case). Write \`static Greeter pick(String style)\` returning the right one (\`casual\` by default). Read \`n\` lines \`<style> <name>\` and print \`pick(style).greet(name)\`. The caller only ever sees the interface.

Example: \`3\` then \`formal Ada\`, \`shouty Linus\`, \`whatever Grace\` →
\`\`\`
Good day, Ada.
LINUS!!!
Hey Grace!
\`\`\``,
      starter: String.raw`import java.util.*;

interface Greeter {
    String greet(String name);
}
// TODO: Formal, Casual, Shouty

public class Main {
    static Greeter pick(String style) {
        // TODO
        return null;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String style = in.next(), name = in.next();
            System.out.println(pick(style).greet(name));
        }
    }
}
`,
      solution: String.raw`import java.util.*;

interface Greeter {
    String greet(String name);
}
class Formal implements Greeter {
    public String greet(String name) { return "Good day, " + name + "."; }
}
class Casual implements Greeter {
    public String greet(String name) { return "Hey " + name + "!"; }
}
class Shouty implements Greeter {
    public String greet(String name) { return name.toUpperCase() + "!!!"; }
}

public class Main {
    static Greeter pick(String style) {
        return switch (style) {
            case "formal" -> new Formal();
            case "shouty" -> new Shouty();
            default -> new Casual();
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String style = in.next(), name = in.next();
            System.out.println(pick(style).greet(name));
        }
    }
}
`,
      hints: ["Interface methods are implicitly public — the implementations must say public too.", "pick returns the interface type; main never names a concrete class."],
      cases: [
        { stdin: "3\nformal Ada\nshouty Linus\nwhatever Grace\n", expected: "Good day, Ada.\nLINUS!!!\nHey Grace!\n" },
        { stdin: "1\ncasual bob\n", expected: "Hey bob!\n" },
        { stdin: "2\nshouty x\nformal Y\n", expected: "X!!!\nGood day, Y.\n", hidden: true },
      ],
    },
  ],
  "default-static-private-methods": [
    {
      title: "Default methods do the work",
      prompt: `Declare \`interface Shape\` with abstract \`double area()\` and \`String name()\`, a **default** \`String describe()\` returning \`<name()> with area <area() to two decimals>\`, a default \`boolean isLargerThan(Shape other)\`, and a **static** \`Shape largest(List<Shape> shapes)\`. Implement \`Circle\` and \`Square\` as records. Read \`n\` shapes (\`circle r\` / \`square s\`), print each \`describe()\`, then \`largest=<largest(shapes).name()>\`. No implementation repeats the describe logic.

Example: \`2\` then \`circle 1\`, \`square 2\` →
\`\`\`
circle with area 3.14
square with area 4.00
largest=square
\`\`\``,
      starter: String.raw`import java.util.*;

interface Shape {
    double area();
    String name();
    // TODO: default describe(), default isLargerThan(Shape), static largest(List<Shape>)
}
// TODO: record Circle(double r) implements Shape, record Square(double s) implements Shape

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
    default String describe() { return String.format(Locale.ROOT, "%s with area %.2f", name(), area()); }
    default boolean isLargerThan(Shape other) { return area() > other.area(); }
    static Shape largest(List<Shape> shapes) {
        Shape best = shapes.get(0);
        for (Shape s : shapes) if (s.isLargerThan(best)) best = s;
        return best;
    }
}
record Circle(double r) implements Shape {
    public double area() { return Math.PI * r * r; }
    public String name() { return "circle"; }
}
record Square(double s) implements Shape {
    public double area() { return s * s; }
    public String name() { return "square"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Shape> shapes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            shapes.add(kind.equals("circle") ? new Circle(in.nextDouble()) : new Square(in.nextDouble()));
        }
        for (Shape s : shapes) System.out.println(s.describe());
        System.out.println("largest=" + Shape.largest(shapes).name());
    }
}
`,
      hints: ["A default method can call the abstract ones — that is how it works for every implementation.", "A static interface method is called on the interface name: Shape.largest(...)."],
      cases: [
        { stdin: "2\ncircle 1\nsquare 2\n", expected: "circle with area 3.14\nsquare with area 4.00\nlargest=square\n" },
        { stdin: "1\ncircle 2\n", expected: "circle with area 12.57\nlargest=circle\n" },
        { stdin: "3\nsquare 1\nsquare 3\ncircle 1.5\n", expected: "square with area 1.00\nsquare with area 9.00\ncircle with area 7.07\nlargest=square\n", hidden: true },
      ],
    },
  ],
  "functional-interfaces": [
    {
      title: "Your own functional interface",
      prompt: `Declare \`@FunctionalInterface interface IntOp { int apply(int x); default IntOp then(IntOp next) { … } }\` where \`then\` returns an op that applies this then \`next\`. Read an integer \`k\` and \`k\` step names — \`double\`, \`inc\`, \`square\`, \`negate\` — and build one \`IntOp\` by chaining lambdas with \`then\` in order. Then read \`n\` integers and print \`<x> -> <result>\` for each.

Example: \`2\` then \`inc square\`, then \`3\` then \`1 2 -3\` →
\`\`\`
1 -> 4
2 -> 9
-3 -> 4
\`\`\``,
      starter: String.raw`import java.util.*;

@FunctionalInterface
interface IntOp {
    int apply(int x);
    default IntOp then(IntOp next) {
        // TODO
        return this;
    }
}

public class Main {
    static IntOp named(String step) {
        // TODO: return a lambda per name
        return x -> x;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        IntOp op = x -> x;
        for (int i = 0; i < k; i++) op = op.then(named(in.next()));
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            System.out.println(x + " -> " + op.apply(x));
        }
    }
}
`,
      solution: String.raw`import java.util.*;

@FunctionalInterface
interface IntOp {
    int apply(int x);
    default IntOp then(IntOp next) {
        return x -> next.apply(apply(x));
    }
}

public class Main {
    static IntOp named(String step) {
        return switch (step) {
            case "double" -> x -> x * 2;
            case "inc" -> x -> x + 1;
            case "square" -> x -> x * x;
            default -> x -> -x;
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        IntOp op = x -> x;
        for (int i = 0; i < k; i++) op = op.then(named(in.next()));
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            System.out.println(x + " -> " + op.apply(x));
        }
    }
}
`,
      hints: ["then returns a new lambda that calls this.apply first and hands the result to next.", "One abstract method means a lambda fits; the default method does not count."],
      cases: [
        { stdin: "2\ninc square\n3\n1 2 -3\n", expected: "1 -> 4\n2 -> 9\n-3 -> 4\n" },
        { stdin: "0\n2\n5 -5\n", expected: "5 -> 5\n-5 -> -5\n" },
        { stdin: "3\ndouble negate inc\n2\n3 0\n", expected: "3 -> -5\n0 -> 1\n", hidden: true },
      ],
    },
  ],
  "comparable-iterable-and-design": [
    {
      title: "Ranges you can loop and sort",
      prompt: `Write \`record Range(int from, int to) implements Iterable<Integer>, Comparable<Range>\`: iterating yields \`from\` up to but excluding \`to\`; the natural order is by length ascending, then by \`from\`. Read \`n\` ranges, print each in sorted order as \`[from,to) size=<len> sum=<sum of its elements via for-each>\`.

Example: \`3\` then \`5 8\`, \`0 2\`, \`10 12\` →
\`\`\`
[0,2) size=2 sum=1
[10,12) size=2 sum=21
[5,8) size=3 sum=18
\`\`\``,
      starter: String.raw`import java.util.*;

record Range(int from, int to) implements Iterable<Integer>, Comparable<Range> {
    int size() { return to - from; }
    // TODO: iterator(), compareTo()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Range> ranges = new ArrayList<>();
        for (int i = 0; i < n; i++) ranges.add(new Range(in.nextInt(), in.nextInt()));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

record Range(int from, int to) implements Iterable<Integer>, Comparable<Range> {
    int size() { return to - from; }
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int next = from;
            public boolean hasNext() { return next < to; }
            public Integer next() { return next++; }
        };
    }
    public int compareTo(Range o) {
        int c = Integer.compare(size(), o.size());
        return c != 0 ? c : Integer.compare(from, o.from);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Range> ranges = new ArrayList<>();
        for (int i = 0; i < n; i++) ranges.add(new Range(in.nextInt(), in.nextInt()));
        Collections.sort(ranges);
        for (Range r : ranges) {
            long sum = 0;
            for (int x : r) sum += x;
            System.out.println("[" + r.from() + "," + r.to() + ") size=" + r.size() + " sum=" + sum);
        }
    }
}
`,
      hints: ["Iterable needs one method: iterator(); an anonymous Iterator with a cursor does it.", "for (int x : r) works on anything Iterable<Integer>."],
      cases: [
        { stdin: "3\n5 8\n0 2\n10 12\n", expected: "[0,2) size=2 sum=1\n[10,12) size=2 sum=21\n[5,8) size=3 sum=18\n" },
        { stdin: "1\n3 3\n", expected: "[3,3) size=0 sum=0\n" },
        { stdin: "2\n-2 2\n0 1\n", expected: "[0,1) size=1 sum=0\n[-2,2) size=4 sum=-2\n", hidden: true },
      ],
    },
  ],
  "sealed-interfaces": [
    {
      title: "Ok or Err",
      prompt: `Declare \`sealed interface Result permits Ok, Err\` with \`record Ok(int value)\` and \`record Err(String message)\`. Write \`static Result parse(String token)\` that returns \`Ok\` for an integer and \`Err("not a number: <token>")\` otherwise, and \`Err("out of range: <token>")\` for values outside \`[-1000, 1000]\`. Read \`n\` tokens; for each print \`ok <value>\` or \`err <message>\` using pattern \`instanceof\`, then \`sum=<sum of the Ok values>\`.

Example: \`4\` then \`5 x 2000 -7\` →
\`\`\`
ok 5
err not a number: x
err out of range: 2000
ok -7
sum=-2
\`\`\``,
      starter: String.raw`import java.util.*;

sealed interface Result permits Ok, Err { }
record Ok(int value) implements Result { }
record Err(String message) implements Result { }

public class Main {
    static Result parse(String token) {
        // TODO
        return new Err("todo");
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) {
            Result r = parse(in.next());
            // TODO
        }
        System.out.println("sum=" + sum);
    }
}
`,
      solution: String.raw`import java.util.*;

sealed interface Result permits Ok, Err { }
record Ok(int value) implements Result { }
record Err(String message) implements Result { }

public class Main {
    static Result parse(String token) {
        try {
            int v = Integer.parseInt(token);
            if (v < -1000 || v > 1000) return new Err("out of range: " + token);
            return new Ok(v);
        } catch (NumberFormatException e) {
            return new Err("not a number: " + token);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) {
            Result r = parse(in.next());
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
      hints: ["A sealed interface with two records is the Java spelling of a result type — no exceptions cross the method boundary.", "Pattern instanceof binds ok and err without casts; Java 21 would let you switch over the two."],
      cases: [
        { stdin: "4\n5 x 2000 -7\n", expected: "ok 5\nerr not a number: x\nerr out of range: 2000\nok -7\nsum=-2\n" },
        { stdin: "2\n1000 -1001\n", expected: "ok 1000\nerr out of range: -1001\nsum=1000\n" },
        { stdin: "3\n1.5 0 abc\n", expected: "err not a number: 1.5\nok 0\nerr not a number: abc\nsum=0\n", hidden: true },
      ],
    },
  ],
  "interfaces-checkpoint": [
    {
      title: "Listeners you can unsubscribe",
      prompt: `Declare \`@FunctionalInterface interface Listener { void on(String event); }\` and \`class Bus\` with \`Runnable subscribe(Listener l)\` — it registers the listener and returns a \`Runnable\` that removes it again — and \`void publish(String event)\` which calls every current listener in subscription order. Read \`n\` commands: \`sub <name>\` subscribes a listener that prints \`<name> got <event>\`; \`unsub <name>\` runs that listener's returned \`Runnable\`; \`pub <event>\` publishes. Print \`listeners=<count>\` at the end.

Example: \`5\` then \`sub a\`, \`sub b\`, \`pub hello\`, \`unsub a\`, \`pub bye\` →
\`\`\`
a got hello
b got hello
b got bye
listeners=1
\`\`\``,
      starter: String.raw`import java.util.*;

@FunctionalInterface
interface Listener {
    void on(String event);
}

class Bus {
    private final List<Listener> listeners = new ArrayList<>();
    Runnable subscribe(Listener l) {
        // TODO
        return () -> {};
    }
    void publish(String event) {
        // TODO
    }
    int count() { return listeners.size(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Bus bus = new Bus();
        Map<String, Runnable> unsubscribers = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next(), arg = in.next();
            // TODO
        }
        System.out.println("listeners=" + bus.count());
    }
}
`,
      solution: String.raw`import java.util.*;

@FunctionalInterface
interface Listener {
    void on(String event);
}

class Bus {
    private final List<Listener> listeners = new ArrayList<>();
    Runnable subscribe(Listener l) {
        listeners.add(l);
        return () -> listeners.remove(l);
    }
    void publish(String event) {
        for (Listener l : new ArrayList<>(listeners)) l.on(event);
    }
    int count() { return listeners.size(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Bus bus = new Bus();
        Map<String, Runnable> unsubscribers = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next(), arg = in.next();
            switch (cmd) {
                case "sub" -> unsubscribers.put(arg, bus.subscribe(event -> System.out.println(arg + " got " + event)));
                case "unsub" -> { Runnable r = unsubscribers.remove(arg); if (r != null) r.run(); }
                default -> bus.publish(arg);
            }
        }
        System.out.println("listeners=" + bus.count());
    }
}
`,
      hints: ["The returned Runnable captures the very listener object, so remove(l) finds it by identity.", "Two functional interfaces meet here: Listener for the callback, Runnable for the undo."],
      cases: [
        { stdin: "5\nsub a\nsub b\npub hello\nunsub a\npub bye\n", expected: "a got hello\nb got hello\nb got bye\nlisteners=1\n" },
        { stdin: "3\npub nobody\nsub x\nunsub x\n", expected: "listeners=0\n" },
        { stdin: "4\nsub a\nunsub a\nunsub a\npub z\n", expected: "listeners=0\n", hidden: true },
      ],
    },
  ],
};

export default more;

import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "inheritance",
  title: "OOP II — inheritance & polymorphism",
  blurb: "extends and super, the rules of overriding, dynamic dispatch and casting, equals/hashCode/toString, abstract classes, and when to compose instead.",
  icon: "tree",
  overview: `Inheritance lets one class be a variation of another and polymorphism lets code written for the parent run correctly for every child. Together they are what makes object-oriented programs extensible — and, misused, what makes them fragile.

This module covers the mechanics exactly: constructor chaining through super, what is inherited and what is merely present, the precise rules for overriding versus hiding, how dynamic dispatch chooses a method at run time, up- and down-casting with instanceof patterns, the Object methods and the equals/hashCode contract that every collection depends on, abstract classes and the template method pattern, and finally the judgement — Liskov substitution, the fragile base class problem, composition, final and sealed — of when inheritance is the wrong tool.

By the end you can design a small hierarchy correctly, write equals and hashCode that survive a HashSet, and defend a composition-over-inheritance decision in an interview.`,
  lessons: [
    {
      slug: "extending-classes",
      file: "01-extending-classes.md",
      exercises: [
        {
          title: "Employees and managers",
          prompt: `Write \`class Employee\` with a name and a monthly base salary (long), a constructor, \`pay()\` returning the base, and \`toString()\` giving \`<name>:<pay>\`. Write \`class Manager extends Employee\` adding a bonus, whose constructor calls \`super(...)\` and whose \`pay()\` returns \`super.pay() + bonus\`.

Read an integer \`n\`, then \`n\` lines \`emp <name> <base>\` or \`mgr <name> <base> <bonus>\`. Create the right object for each and print it; finally print \`payroll=<sum of all pay()>\`.

Example: \`2\` then \`emp ada 5000\`, \`mgr bob 6000 1500\` →
\`\`\`
ada:5000
bob:7500
payroll=12500
\`\`\``,
          starter: String.raw`import java.util.*;

class Employee {
    // TODO: name, base, constructor, pay(), name(), toString()
}

class Manager extends Employee {
    // TODO: bonus, constructor with super(...), pay() override
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long payroll = 0;
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            // TODO
        }
        System.out.println("payroll=" + payroll);
    }
}
`,
          solution: String.raw`import java.util.*;

class Employee {
    private final String name;
    protected final long base;

    Employee(String name, long base) {
        this.name = name;
        this.base = base;
    }

    long pay() { return base; }
    String name() { return name; }

    @Override
    public String toString() { return name + ":" + pay(); }
}

class Manager extends Employee {
    private final long bonus;

    Manager(String name, long base, long bonus) {
        super(name, base);
        this.bonus = bonus;
    }

    @Override
    long pay() { return super.pay() + bonus; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long payroll = 0;
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            Employee e;
            if (kind.equals("mgr")) e = new Manager(in.next(), in.nextLong(), in.nextLong());
            else e = new Employee(in.next(), in.nextLong());
            System.out.println(e);
            payroll += e.pay();
        }
        System.out.println("payroll=" + payroll);
    }
}
`,
          hints: ["super(name, base) must be the first statement of Manager's constructor.", "toString in Employee calls pay(), which dispatches to Manager's override for managers."],
          cases: [
            { stdin: "2\nemp ada 5000\nmgr bob 6000 1500\n", expected: "ada:5000\nbob:7500\npayroll=12500\n" },
            { stdin: "1\nmgr eve 1 0\n", expected: "eve:1\npayroll=1\n" },
            { stdin: "3\nemp a 1\nemp b 2\nmgr c 3 4\n", expected: "a:1\nb:2\nc:7\npayroll=10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`class A { A(int x) {} } class B extends A { }` — result?",
          options: ["Compiles", "Compile error: B's implicit `super()` finds no `A()` constructor", "Runtime error", "B gets `A(int)` automatically"],
          answer: 1,
          explanation: "Constructors are not inherited, and B's default constructor calls `super()`. B must declare a constructor that calls `super(someInt)`.",
        },
        {
          prompt: "A `private` field of the parent…",
          options: ["Does not exist in subclass objects", "Exists in every subclass object but is not accessible by name in the subclass", "Becomes protected", "Is copied into the subclass"],
          answer: 1,
          explanation: "The memory is there; access is not. Reach it through the parent's public or protected methods.",
        },
        {
          prompt: "Which is the first statement of a constructor that neither calls `this(...)` nor `super(...)`?",
          options: ["Nothing special", "An implicit `super()`", "An implicit `this()`", "A call to `Object.init`"],
          answer: 1,
          explanation: "Every constructor chains to a parent constructor; the compiler inserts `super()` when you write neither.",
        },
        {
          prompt: "How many class parents can a Java class have?",
          options: ["Any number", "Exactly one (implicitly `Object` if unspecified)", "Two", "Zero"],
          answer: 1,
          explanation: "Single inheritance of classes avoids the diamond problem; multiple inheritance of type comes from interfaces.",
        },
        {
          prompt: "`super.super.method()` is…",
          options: ["Valid", "A compile error — `super` cannot be chained", "Valid only in abstract classes", "The same as `super.method()`"],
          answer: 1,
          explanation: "`super` selects the immediate parent's implementation; skipping a level would break the parent's encapsulation.",
        },
      ],
    },
    {
      slug: "overriding",
      file: "02-overriding.md",
      exercises: [
        {
          title: "Override or overload?",
          prompt: `Complete the program so its output demonstrates the difference between overriding and overloading. \`Printer\` has \`describe(Object o)\` returning \`"object"\` and \`static String kind()\` returning \`"base"\`. \`FancyPrinter\` **overrides** \`describe(Object)\` to return \`"fancy object"\`, adds an **overload** \`describe(String s)\` returning \`"fancy string"\`, and **hides** \`kind()\` with one returning \`"fancy"\`.

\`main\` (already written) reads a line of text and prints four lines using a \`Printer\`-typed reference to a \`FancyPrinter\`, then a \`FancyPrinter\`-typed reference. Make the classes so the expected output appears.

Expected output for any input line:
\`\`\`
fancy object
fancy string
base
fancy
\`\`\``,
          starter: String.raw`import java.util.*;

class Printer {
    String describe(Object o) { return "object"; }
    static String kind() { return "base"; }
}

class FancyPrinter extends Printer {
    // TODO: override describe(Object), overload describe(String), hide kind()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String text = in.nextLine();
        Printer p = new FancyPrinter();
        FancyPrinter f = new FancyPrinter();
        System.out.println(p.describe(text));
        System.out.println(f.describe(text));
        System.out.println(p.kind());
        System.out.println(f.kind());
    }
}
`,
          solution: String.raw`import java.util.*;

class Printer {
    String describe(Object o) { return "object"; }
    static String kind() { return "base"; }
}

class FancyPrinter extends Printer {
    @Override
    String describe(Object o) { return "fancy object"; }

    String describe(String s) { return "fancy string"; }

    static String kind() { return "fancy"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String text = in.nextLine();
        Printer p = new FancyPrinter();
        FancyPrinter f = new FancyPrinter();
        System.out.println(p.describe(text));
        System.out.println(f.describe(text));
        System.out.println(p.kind());
        System.out.println(f.kind());
    }
}
`,
          hints: ["Through a Printer reference only describe(Object) is visible, but it dispatches to the override.", "Static methods resolve by the reference type — hiding, not overriding."],
          cases: [
            { stdin: "hello\n", expected: "fancy object\nfancy string\nbase\nfancy\n" },
            { stdin: "\n", expected: "fancy object\nfancy string\nbase\nfancy\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which change is **not** allowed in an override?",
          options: ["Widening access from `protected` to `public`", "Returning a subtype of the parent's reference return type", "Narrowing access from `public` to `protected`", "Throwing fewer checked exceptions"],
          answer: 2,
          explanation: "An override may not be more restrictive — callers holding a parent reference must still be able to call it.",
        },
        {
          prompt: "`public boolean equals(Point p)` in class `Point` is…",
          options: ["A valid override", "An overload — collections still use `Object.equals` (identity)", "A compile error", "Automatically promoted to `equals(Object)`"],
          answer: 1,
          explanation: "The parameter type differs from `Object`, so it does not override. `@Override` would have caught it.",
        },
        {
          prompt: "`A ref = new B(); ref.staticMethod();` where both classes declare `staticMethod` — which runs?",
          options: ["B's — dynamic dispatch", "A's — static methods are resolved by the reference type", "Both", "Compile error"],
          answer: 1,
          explanation: "Static methods are hidden, not overridden. Call them through the class name to avoid confusion.",
        },
        {
          prompt: "What does `@Override` do?",
          options: ["Makes the method virtual", "Asks the compiler to verify the method really overrides a supertype method", "Calls the parent version automatically", "Prevents further overriding"],
          answer: 1,
          explanation: "It has no run-time effect. It turns a typo or a wrong parameter type into a compile error.",
        },
        {
          prompt: "Calling an overridable method from a constructor is dangerous because…",
          options: ["It is a compile error", "The subclass override runs before the subclass's fields are initialised", "It causes infinite recursion", "It is slow"],
          answer: 1,
          explanation: "Parent constructors run first; the subclass's field initialisers have not executed yet, so the override sees defaults (null, 0).",
        },
      ],
    },
    {
      slug: "polymorphism",
      file: "03-polymorphism.md",
      exercises: [
        {
          title: "Shapes in one array",
          prompt: `Write an abstract-free hierarchy: \`class Shape\` with \`double area()\` returning 0 and \`String name()\` returning \`"shape"\`; \`Circle\`, \`Rect\` and \`Square extends Rect\` overriding both (\`Square\` passes the side twice to \`Rect\`'s constructor and names itself \`"square"\`).

Read an integer \`n\` and \`n\` lines \`circle <r>\`, \`rect <w> <h>\` or \`square <s>\`; store them in a \`Shape[]\`, then print each as \`<name> <area with 2 decimals>\` and a final line \`squares=<count of objects that are instanceof Square>\` — note that every \`Square\` is also a \`Rect\`.

Example: \`3\` then \`circle 1\`, \`rect 2 3\`, \`square 2\` →
\`\`\`
circle 3.14
rect 6.00
square 4.00
squares=1
\`\`\``,
          starter: String.raw`import java.util.*;

class Shape {
    double area() { return 0; }
    String name() { return "shape"; }
}

// TODO: Circle, Rect, Square

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Shape[] shapes = new Shape[n];
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class Shape {
    double area() { return 0; }
    String name() { return "shape"; }
}

class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
    @Override String name() { return "circle"; }
}

class Rect extends Shape {
    protected final double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    @Override double area() { return w * h; }
    @Override String name() { return "rect"; }
}

class Square extends Rect {
    Square(double s) { super(s, s); }
    @Override String name() { return "square"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Shape[] shapes = new Shape[n];
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            switch (kind) {
                case "circle" -> shapes[i] = new Circle(in.nextDouble());
                case "rect" -> shapes[i] = new Rect(in.nextDouble(), in.nextDouble());
                default -> shapes[i] = new Square(in.nextDouble());
            }
        }
        int squares = 0;
        for (Shape s : shapes) {
            System.out.printf("%s %.2f%n", s.name(), s.area());
            if (s instanceof Square) squares++;
        }
        System.out.println("squares=" + squares);
    }
}
`,
          hints: ["Square inherits area() from Rect; only name() needs overriding.", "The loop calls name() and area() through the Shape type — dispatch does the rest."],
          cases: [
            { stdin: "3\ncircle 1\nrect 2 3\nsquare 2\n", expected: "circle 3.14\nrect 6.00\nsquare 4.00\nsquares=1\n" },
            { stdin: "2\nsquare 1.5\nsquare 0\n", expected: "square 2.25\nsquare 0.00\nsquares=2\n" },
            { stdin: "1\nrect 10 0.5\n", expected: "rect 5.00\nsquares=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Account a = new SavingsAccount(); a.addInterest();` where only `SavingsAccount` declares `addInterest`…",
          options: ["Runs `addInterest`", "Compile error: the reference type `Account` has no such method", "Throws `ClassCastException`", "Runs `Account`'s version"],
          answer: 1,
          explanation: "The reference type limits what you may call; the object's class decides what runs for methods that *are* callable.",
        },
        {
          prompt: "A downcast to the wrong class results in…",
          options: ["A compile error", "`ClassCastException` at run time", "null", "Silent truncation"],
          answer: 1,
          explanation: "The compiler allows casts that might succeed; the JVM checks the object's actual class when the cast executes.",
        },
        {
          prompt: "`null instanceof String` is…",
          options: ["`true`", "`false`", "`NullPointerException`", "Compile error"],
          answer: 1,
          explanation: "`instanceof` is always false for null — one reason it is a safe guard before a cast.",
        },
        {
          prompt: "`if (o instanceof Circle c && c.radius() > 1)` — the pattern variable `c`…",
          options: ["Is in scope on both sides of `&&`", "Is in scope in the right operand and the `if` body, because the test must have passed", "Is null when the test fails", "Requires a separate cast"],
          answer: 1,
          explanation: "Flow scoping: `c` exists wherever the compiler can prove the `instanceof` was true. With `||` it would not be.",
        },
        {
          prompt: "Which is compile-time polymorphism?",
          options: ["Overriding", "Overloading", "Dynamic dispatch", "Downcasting"],
          answer: 1,
          explanation: "Overload resolution happens at compile time from argument types; overriding is resolved at run time.",
        },
      ],
    },
    {
      slug: "the-object-class",
      file: "04-the-object-class.md",
      exercises: [
        {
          title: "Points in a set",
          prompt: `Write \`final class Point\` with \`int x, y\`, a constructor, and correct \`equals(Object)\`, \`hashCode()\` and \`toString()\` (\`(x, y)\`). Read an integer \`n\` and \`n\` pairs \`x y\`; add each as a \`Point\` to a \`HashSet<Point>\`. Print \`distinct=<set size>\`, then \`contains(0,0)=<true|false>\`.

With a broken \`equals\`/\`hashCode\` the set would count duplicates separately — the hidden cases check that.

Example: \`4\` then \`1 2\`, \`1 2\`, \`0 0\`, \`2 1\` →
\`\`\`
distinct=3
contains(0,0)=true
\`\`\``,
          starter: String.raw`import java.util.*;

final class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    // TODO: equals, hashCode, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(new Point(in.nextInt(), in.nextInt()));
        System.out.println("distinct=" + set.size());
        System.out.println("contains(0,0)=" + set.contains(new Point(0, 0)));
    }
}
`,
          solution: String.raw`import java.util.*;

final class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() { return Objects.hash(x, y); }

    @Override
    public String toString() { return "(" + x + ", " + y + ")"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Point> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(new Point(in.nextInt(), in.nextInt()));
        System.out.println("distinct=" + set.size());
        System.out.println("contains(0,0)=" + set.contains(new Point(0, 0)));
    }
}
`,
          hints: ["equals must take Object; check identity, null and class, then fields.", "hashCode from the same fields: Objects.hash(x, y)."],
          cases: [
            { stdin: "4\n1 2\n1 2\n0 0\n2 1\n", expected: "distinct=3\ncontains(0,0)=true\n" },
            { stdin: "3\n5 5\n5 5\n5 5\n", expected: "distinct=1\ncontains(0,0)=false\n" },
            { stdin: "5\n0 0\n0 0\n0 1\n1 0\n0 0\n", expected: "distinct=3\ncontains(0,0)=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "You override `equals` but not `hashCode`. In a `HashSet`…",
          options: ["Everything works", "Equal objects may land in different buckets and `contains` returns false for them", "The set throws", "Duplicates are rejected correctly"],
          answer: 1,
          explanation: "Hash-based collections locate the bucket by `hashCode` first. Unequal hashes for equal objects break the lookup.",
        },
        {
          prompt: "Two objects that are not `equals`…",
          options: ["Must have different hash codes", "May have the same hash code — a collision", "Cannot be in the same map", "Must be different classes"],
          answer: 1,
          explanation: "The contract only constrains equal objects. Collisions are expected and handled by the collection.",
        },
        {
          prompt: "How should two `double` fields be compared inside `equals`?",
          options: ["`a == b`", "`Double.compare(a, b) == 0`", "`a.equals(b)`", "`Math.abs(a - b) < 1`"],
          answer: 1,
          explanation: "`Double.compare` treats `NaN` as equal to itself and distinguishes `0.0` from `-0.0`, matching `Double.equals` and `hashCode`.",
        },
        {
          prompt: "Why must the parameter of `equals` be `Object`?",
          options: ["Style", "So it overrides `Object.equals` and is called by collections; a narrower parameter is an overload", "For performance", "The compiler requires it"],
          answer: 1,
          explanation: "`List.contains`, `HashMap.get` and `Objects.equals` all call `equals(Object)`.",
        },
        {
          prompt: "Why are mutable objects poor `HashMap` keys?",
          options: ["They are slower", "Changing a key after insertion changes its hash code, leaving the entry in the wrong bucket", "They cannot override `hashCode`", "They use more memory"],
          answer: 1,
          explanation: "The entry was placed using the old hash. A later `get` computes the new hash and looks elsewhere.",
        },
      ],
    },
    {
      slug: "abstract-classes",
      file: "05-abstract-classes.md",
      exercises: [
        {
          title: "A report template",
          prompt: `Write \`abstract class Report\` with a \`final String render()\` that concatenates \`header()\`, \`body()\` and \`footer()\`; \`header()\` returns \`"== " + title() + " ==\\n"\` and \`footer()\` returns \`"-- end --\\n"\` by default; \`title()\` and \`body()\` are abstract. Write \`SalesReport\` (title \`Sales\`, body: one line per item \`<name>: <amount>\`) and \`InventoryReport\` (title \`Inventory\`, body: \`items=<count>\` on one line, and it overrides \`footer()\` to return \`"-- counted --\\n"\`).

Read a word \`sales\` or \`inventory\`, an integer \`n\`, then \`n\` lines \`<name> <amount>\`; build the matching report and print \`render()\`.

Example: \`sales\`, \`2\`, \`pen 10\`, \`pad 5\` →
\`\`\`
== Sales ==
pen: 10
pad: 5
-- end --
\`\`\``,
          starter: String.raw`import java.util.*;

abstract class Report {
    // TODO: render() (final), header(), footer(), abstract title() and body()
}

// TODO: SalesReport, InventoryReport

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String kind = in.next();
        int n = in.nextInt();
        String[] names = new String[n];
        long[] amounts = new long[n];
        for (int i = 0; i < n; i++) { names[i] = in.next(); amounts[i] = in.nextLong(); }
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

abstract class Report {
    final String render() {
        return header() + body() + footer();
    }
    String header() { return "== " + title() + " ==\n"; }
    String footer() { return "-- end --\n"; }
    abstract String title();
    abstract String body();
}

class SalesReport extends Report {
    private final String[] names;
    private final long[] amounts;
    SalesReport(String[] names, long[] amounts) { this.names = names; this.amounts = amounts; }
    @Override String title() { return "Sales"; }
    @Override String body() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < names.length; i++) sb.append(names[i]).append(": ").append(amounts[i]).append('\n');
        return sb.toString();
    }
}

class InventoryReport extends Report {
    private final int count;
    InventoryReport(int count) { this.count = count; }
    @Override String title() { return "Inventory"; }
    @Override String body() { return "items=" + count + "\n"; }
    @Override String footer() { return "-- counted --\n"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String kind = in.next();
        int n = in.nextInt();
        String[] names = new String[n];
        long[] amounts = new long[n];
        for (int i = 0; i < n; i++) { names[i] = in.next(); amounts[i] = in.nextLong(); }
        Report r = kind.equals("sales") ? new SalesReport(names, amounts) : new InventoryReport(n);
        System.out.print(r.render());
    }
}
`,
          hints: ["render() is the template: fixed order, final; the steps are what subclasses supply.", "InventoryReport overrides the hook footer() but keeps header()."],
          cases: [
            { stdin: "sales\n2\npen 10\npad 5\n", expected: "== Sales ==\npen: 10\npad: 5\n-- end --\n" },
            { stdin: "inventory\n3\na 1\nb 2\nc 3\n", expected: "== Inventory ==\nitems=3\n-- counted --\n" },
            { stdin: "sales\n0\n", expected: "== Sales ==\n-- end --\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`new Shape()` where `Shape` is abstract…",
          options: ["Creates a default shape", "Is a compile error", "Throws at run time", "Creates an anonymous subclass"],
          answer: 1,
          explanation: "Abstract classes cannot be instantiated directly; only concrete subclasses can (or an anonymous subclass with a body).",
        },
        {
          prompt: "A concrete subclass of an abstract class must…",
          options: ["Override every method", "Implement every inherited abstract method", "Declare a no-arg constructor", "Be final"],
          answer: 1,
          explanation: "Otherwise it must itself be declared abstract.",
        },
        {
          prompt: "Can an abstract class have a constructor?",
          options: ["No", "Yes — subclass constructors call it via `super(...)` to initialise shared state", "Only a private one", "Only if it has no abstract methods"],
          answer: 1,
          explanation: "It cannot be called with `new` directly, but it runs as part of every subclass construction.",
        },
        {
          prompt: "In the template method pattern the skeleton method is typically…",
          options: ["Abstract", "`final`, so subclasses vary the steps but not the order", "Static", "Private"],
          answer: 1,
          explanation: "The fixed algorithm calls abstract and hook methods; making it final protects the structure.",
        },
        {
          prompt: "Choose an abstract class over an interface when…",
          options: ["You need multiple inheritance", "Subclasses share state and implementation, and are variants of one concept", "The type is a capability like `Comparable`", "Never"],
          answer: 1,
          explanation: "Fields and constructors are what interfaces lack; capabilities across unrelated classes are what interfaces are for.",
        },
      ],
    },
    {
      slug: "composition-vs-inheritance",
      file: "06-composition-vs-inheritance.md",
      exercises: [
        {
          title: "Wrap, don't extend",
          prompt: `The subclass below double-counts because \`HashSet.addAll\` calls \`add\` internally. Rewrite \`CountingSet\` as a **wrapper** that holds a \`Set<String>\` and forwards \`add\`, \`addAll\`, \`contains\` and \`size\`, counting attempted additions correctly (\`addAll\` adds the collection's size once).

Read an integer \`n\` and \`n\` commands: \`add <w>\`, \`addAll <k> <w1> … <wk>\`, \`has <w>\`, \`size\`, \`attempts\`. Print the result of each \`has\`/\`size\`/\`attempts\`.

Example: \`4\` then \`add a\`, \`addAll 2 a b\`, \`size\`, \`attempts\` →
\`\`\`
2
3
\`\`\``,
          starter: String.raw`import java.util.*;

class CountingSet extends HashSet<String> {          // BUGGY: replace with composition
    private int attempts = 0;
    @Override public boolean add(String s) { attempts++; return super.add(s); }
    @Override public boolean addAll(Collection<? extends String> c) { attempts += c.size(); return super.addAll(c); }
    int attempts() { return attempts; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        CountingSet set = new CountingSet();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "add" -> set.add(in.next());
                case "addAll" -> {
                    int k = in.nextInt();
                    List<String> words = new ArrayList<>();
                    for (int j = 0; j < k; j++) words.add(in.next());
                    set.addAll(words);
                }
                case "has" -> System.out.println(set.contains(in.next()));
                case "size" -> System.out.println(set.size());
                default -> System.out.println(set.attempts());
            }
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class CountingSet {
    private final Set<String> inner = new HashSet<>();
    private int attempts = 0;

    boolean add(String s) {
        attempts++;
        return inner.add(s);
    }

    boolean addAll(Collection<? extends String> c) {
        attempts += c.size();
        return inner.addAll(c);
    }

    boolean contains(String s) { return inner.contains(s); }
    int size() { return inner.size(); }
    int attempts() { return attempts; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        CountingSet set = new CountingSet();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "add" -> set.add(in.next());
                case "addAll" -> {
                    int k = in.nextInt();
                    List<String> words = new ArrayList<>();
                    for (int j = 0; j < k; j++) words.add(in.next());
                    set.addAll(words);
                }
                case "has" -> System.out.println(set.contains(in.next()));
                case "size" -> System.out.println(set.size());
                default -> System.out.println(set.attempts());
            }
        }
    }
}
`,
          hints: ["Hold a Set<String> field and forward each call to it.", "The wrapper's addAll calls inner.addAll — the inner set's self-calls to add never reach the wrapper."],
          cases: [
            { stdin: "4\nadd a\naddAll 2 a b\nsize\nattempts\n", expected: "2\n3\n" },
            { stdin: "5\naddAll 3 x y z\nhas y\nhas q\nsize\nattempts\n", expected: "true\nfalse\n3\n3\n" },
            { stdin: "3\nadd a\nadd a\nattempts\n", expected: "2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The Liskov substitution principle says…",
          options: ["Subclasses must have the same fields", "Code correct for the supertype must remain correct for any subtype", "Every class needs an interface", "Inheritance depth must be one"],
          answer: 1,
          explanation: "Substitutability is behavioural: a `Square` that breaks `Rectangle`'s independent width/height contract is not a valid subtype even if it compiles.",
        },
        {
          prompt: "The fragile base class problem occurs when…",
          options: ["A class is too small", "A subclass depends on the parent's internal self-calls, which a parent change can break", "Two classes share a name", "A class has no constructor"],
          answer: 1,
          explanation: "`HashSet.addAll` calling `add` is the canonical example — the subclass's counter doubles.",
        },
        {
          prompt: "Composition (wrap and forward) is more robust than inheritance because…",
          options: ["It is shorter", "It depends only on the wrapped object's public contract and can wrap any implementation", "It disables polymorphism", "It is faster"],
          answer: 1,
          explanation: "The wrapper never sees the inner object's internal calls, and the inner object can be swapped.",
        },
        {
          prompt: "A `sealed` class…",
          options: ["Cannot have subclasses", "Lists exactly which classes may extend it, enabling exhaustive switches", "Is the same as `final`", "Cannot be abstract"],
          answer: 1,
          explanation: "`permits` names the closed set; each permitted subclass is `final`, `sealed` or `non-sealed`.",
        },
        {
          prompt: "Marking a class `final` is appropriate when…",
          options: ["It has many methods", "It is a value type or was not designed for extension", "It is abstract", "It implements an interface"],
          answer: 1,
          explanation: "Designing for extension is real work; a class not designed for it should prohibit it, and immutability requires it.",
        },
      ],
    },
    {
      slug: "inheritance-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Accounts at month end",
          prompt: `Write \`abstract class Account\` with an owner, a balance in cents, \`deposit(long)\`, \`balance()\`, and an abstract \`monthEnd()\`. \`Savings\` adds interest at month end: \`balance += balance * rateBasisPoints / 10000\` (integer arithmetic, rate given in basis points). \`Checking\` charges a fee: \`balance -= fee\` (may go negative). Print with \`toString()\` as \`<owner> <kind> <balance>\` where kind is \`savings\` or \`checking\`.

Read an integer \`n\` and \`n\` lines \`savings <owner> <balance> <bp>\` or \`checking <owner> <balance> <fee>\`; store them in an \`Account[]\`, call \`monthEnd()\` on every element polymorphically, then print each.

Example: \`2\` then \`savings ada 100000 250\`, \`checking bob 5000 700\` →
\`\`\`
ada savings 102500
bob checking 4300
\`\`\``,
          starter: String.raw`import java.util.*;

abstract class Account {
    // TODO
}

// TODO: Savings, Checking

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Account[] accounts = new Account[n];
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

abstract class Account {
    private final String owner;
    protected long cents;

    Account(String owner, long cents) {
        this.owner = owner;
        this.cents = cents;
    }

    void deposit(long c) { cents += c; }
    long balance() { return cents; }
    abstract void monthEnd();
    abstract String kind();

    @Override
    public String toString() { return owner + " " + kind() + " " + cents; }
}

class Savings extends Account {
    private final long bp;
    Savings(String owner, long cents, long bp) { super(owner, cents); this.bp = bp; }
    @Override void monthEnd() { cents += cents * bp / 10000; }
    @Override String kind() { return "savings"; }
}

class Checking extends Account {
    private final long fee;
    Checking(String owner, long cents, long fee) { super(owner, cents); this.fee = fee; }
    @Override void monthEnd() { cents -= fee; }
    @Override String kind() { return "checking"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Account[] accounts = new Account[n];
        for (int i = 0; i < n; i++) {
            String type = in.next();
            String owner = in.next();
            long cents = in.nextLong();
            long extra = in.nextLong();
            accounts[i] = type.equals("savings") ? new Savings(owner, cents, extra) : new Checking(owner, cents, extra);
        }
        for (Account a : accounts) a.monthEnd();
        for (Account a : accounts) System.out.println(a);
    }
}
`,
          hints: ["The loop calls monthEnd() on Account references; each object's class supplies the behaviour.", "kind() can be abstract too, used by the shared toString."],
          cases: [
            { stdin: "2\nsavings ada 100000 250\nchecking bob 5000 700\n", expected: "ada savings 102500\nbob checking 4300\n" },
            { stdin: "1\nchecking c 100 250\n", expected: "c checking -150\n" },
            { stdin: "3\nsavings s 1 100\nsavings t 10000 1\nchecking u 0 0\n", expected: "s savings 1\nt savings 10001\nu checking 0\n", hidden: true },
          ],
        },
        {
          title: "Distinct versions",
          prompt: `Write \`final class Version\` with \`int major, minor, patch\`, a static factory \`parse(String)\` for \`"1.2.3"\`, correct \`equals\`/\`hashCode\`, and \`toString\` giving \`major.minor.patch\`. Read an integer \`n\` and \`n\` version strings. Print \`distinct=<number of distinct versions>\` (use a \`HashSet\`) and then the distinct versions in **ascending** order, one per line — implement \`Comparable<Version>\` comparing major, then minor, then patch, and sort with \`Collections.sort\`.

Example: \`4\` then \`1.2.3 1.10.0 1.2.3 0.9.9\` →
\`\`\`
distinct=3
0.9.9
1.2.3
1.10.0
\`\`\``,
          starter: String.raw`import java.util.*;

final class Version implements Comparable<Version> {
    private final int major, minor, patch;
    private Version(int major, int minor, int patch) { this.major = major; this.minor = minor; this.patch = patch; }

    static Version parse(String s) {
        // TODO
        return null;
    }

    // TODO: compareTo, equals, hashCode, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Version> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(Version.parse(in.next()));
        List<Version> sorted = new ArrayList<>(set);
        Collections.sort(sorted);
        System.out.println("distinct=" + set.size());
        for (Version v : sorted) System.out.println(v);
    }
}
`,
          solution: String.raw`import java.util.*;

final class Version implements Comparable<Version> {
    private final int major, minor, patch;
    private Version(int major, int minor, int patch) { this.major = major; this.minor = minor; this.patch = patch; }

    static Version parse(String s) {
        String[] p = s.split("\\.");
        return new Version(Integer.parseInt(p[0]), Integer.parseInt(p[1]), Integer.parseInt(p[2]));
    }

    @Override
    public int compareTo(Version o) {
        if (major != o.major) return Integer.compare(major, o.major);
        if (minor != o.minor) return Integer.compare(minor, o.minor);
        return Integer.compare(patch, o.patch);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Version)) return false;
        Version v = (Version) o;
        return major == v.major && minor == v.minor && patch == v.patch;
    }

    @Override
    public int hashCode() { return Objects.hash(major, minor, patch); }

    @Override
    public String toString() { return major + "." + minor + "." + patch; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<Version> set = new HashSet<>();
        for (int i = 0; i < n; i++) set.add(Version.parse(in.next()));
        List<Version> sorted = new ArrayList<>(set);
        Collections.sort(sorted);
        System.out.println("distinct=" + set.size());
        for (Version v : sorted) System.out.println(v);
    }
}
`,
          hints: ["Split on the escaped dot: split(\"\\\\.\").", "Compare component by component with Integer.compare — string comparison would put 1.10.0 before 1.2.3."],
          cases: [
            { stdin: "4\n1.2.3 1.10.0 1.2.3 0.9.9\n", expected: "distinct=3\n0.9.9\n1.2.3\n1.10.0\n" },
            { stdin: "2\n2.0.0 2.0.0\n", expected: "distinct=1\n2.0.0\n" },
            { stdin: "3\n10.0.0 9.99.99 10.0.1\n", expected: "distinct=3\n9.99.99\n10.0.0\n10.0.1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which is inherited by a subclass?",
          options: ["Constructors", "Private fields, by name", "Public and protected methods", "Static initialiser blocks as overridable methods"],
          answer: 2,
          explanation: "Constructors are never inherited; private members exist but are inaccessible; statics are hidden, not overridden.",
        },
        {
          prompt: "`class B extends A { B() { System.out.println(\"B\"); super(); } }` is…",
          options: ["Valid", "A compile error — `super()` must be the first statement", "Valid but prints in reverse", "Valid only if A is abstract"],
          answer: 1,
          explanation: "Parent construction must complete before the child's body runs, so the call must come first.",
        },
        {
          prompt: "An override declares `throws Exception` where the parent declared `throws IOException`. Result?",
          options: ["Valid", "Compile error: broader checked exception", "Valid with a warning", "Valid if caught"],
          answer: 1,
          explanation: "Callers holding the parent type only handle `IOException`; a broader checked exception would escape their handlers.",
        },
        {
          prompt: "`A a = new B(); a.field` where both declare `field`…",
          options: ["B's field — fields are polymorphic", "A's field — fields are resolved by the reference type", "Compile error", "Both"],
          answer: 1,
          explanation: "Fields are hidden, never overridden. This is one reason fields should be private.",
        },
        {
          prompt: "Dynamic dispatch selects a method based on…",
          options: ["The reference's declared type", "The object's runtime class", "The argument types", "The calling class"],
          answer: 1,
          explanation: "The JVM's `invokevirtual` looks up the most specific override in the object's class chain at each call.",
        },
        {
          prompt: "`Object o = \"text\"; Integer i = (Integer) o;`",
          options: ["Compiles and runs", "Compiles; throws `ClassCastException` at run time", "Compile error", "Converts the string to a number"],
          answer: 1,
          explanation: "`Object` might hold an `Integer`, so the compiler allows the cast; the JVM finds a `String` and throws.",
        },
        {
          prompt: "Which `equals` type check keeps symmetry when subclasses add state?",
          options: ["`o instanceof Point`", "`getClass() != o.getClass()`", "`o.equals(this)`", "No check"],
          answer: 1,
          explanation: "Exact-class comparison makes a `Point` and a `ColorPoint` unequal in both directions. `instanceof` is fine for final classes.",
        },
        {
          prompt: "`Objects.hash(x, y)` is used in `hashCode` so that…",
          options: ["It is unique", "Equal objects (same x and y) get equal hash codes", "It is faster than arithmetic", "It works for null objects only"],
          answer: 1,
          explanation: "Deriving the hash from exactly the fields `equals` compares is what satisfies the contract.",
        },
        {
          prompt: "An abstract class with **no** abstract methods…",
          options: ["Is a compile error", "Is legal — it simply cannot be instantiated", "Becomes an interface", "Is automatically final"],
          answer: 1,
          explanation: "Sometimes the point is only to prevent `new` on a base class meant as a common parent.",
        },
        {
          prompt: "In the template method pattern, a *hook* is…",
          options: ["An abstract method", "A concrete method with a default that subclasses may override", "A static method", "A constructor"],
          answer: 1,
          explanation: "Hooks give optional customisation points; abstract methods give required ones.",
        },
        {
          prompt: "`Square extends Rectangle` with independent `setWidth`/`setHeight` violates…",
          options: ["Encapsulation", "The Liskov substitution principle", "Single inheritance", "The `equals` contract"],
          answer: 1,
          explanation: "Code that sets width and height independently on a `Rectangle` breaks when handed a `Square`.",
        },
        {
          prompt: "A wrapper class that forwards to an inner `Set` and adds counting is an example of…",
          options: ["Inheritance", "The decorator/composition pattern", "A singleton", "Overloading"],
          answer: 1,
          explanation: "The wrapper has-a set and depends only on the `Set` contract — immune to the inner class's self-calls.",
        },
        {
          prompt: "Permitted subclasses of a sealed class must be…",
          options: ["Abstract", "`final`, `sealed` or `non-sealed`", "In different packages", "Interfaces"],
          answer: 1,
          explanation: "Each branch must declare whether the hierarchy stays closed there, continues sealed, or reopens.",
        },
        {
          prompt: "Which is compile-time polymorphism and which is run-time?",
          options: ["Overriding is compile-time; overloading is run-time", "Overloading is compile-time; overriding is run-time", "Both compile-time", "Both run-time"],
          answer: 1,
          explanation: "Overloads are chosen by the compiler from argument types; overrides by the JVM from the receiver's class.",
        },
      ],
    },
  ],
}, more);

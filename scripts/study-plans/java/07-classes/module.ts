import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "classes",
  title: "OOP I — classes & objects",
  blurb: "The object model, constructors and initialisation order, static members, access modifiers and immutability, and how to design a class.",
  icon: "box",
  overview: `Everything so far has been static methods in one class. Java is an object-oriented language, and objects — bundles of state and behaviour with their own identity — are how real programs are organised, protected and reasoned about.

This module is the object model from the ground up: what a class declares and what new creates, references and this, constructors and the exact initialisation order, static members and class initialisation, the four access levels and the discipline of encapsulation and immutability, and finally the design judgement — cohesion, composition, value versus entity, toString, builders — that turns syntax into good classes.

By the end you can write a class whose objects can never be invalid, explain initialisation order in an interview, and decide what belongs in a class and what does not.`,
  lessons: [
    {
      slug: "classes-and-objects",
      file: "01-classes-and-objects.md",
      exercises: [
        {
          title: "A counter with state",
          prompt: `Write a class \`Counter\` with a private \`int\` field, and methods \`increment()\`, \`decrement()\`, \`reset()\` and \`value()\`. Read an integer \`n\`, then \`n\` commands (\`inc\`, \`dec\`, \`reset\`, or \`print\`); apply each to **one** \`Counter\` object and print its value whenever the command is \`print\`.

Example: \`5\` then \`inc inc print dec print\` →
\`\`\`
2
1
\`\`\``,
          starter: String.raw`import java.util.*;

class Counter {
    // TODO: a private int field and the four methods
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Counter c = new Counter();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO: dispatch on cmd
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class Counter {
    private int count;

    void increment() { count++; }
    void decrement() { count--; }
    void reset() { count = 0; }
    int value() { return count; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Counter c = new Counter();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "inc" -> c.increment();
                case "dec" -> c.decrement();
                case "reset" -> c.reset();
                default -> System.out.println(c.value());
            }
        }
    }
}
`,
          hints: ["The field persists between calls; the methods read and write this.count.", "One object, created once before the loop."],
          cases: [
            { stdin: "5\ninc inc print dec print\n", expected: "2\n1\n" },
            { stdin: "4\ndec print reset print\n", expected: "-1\n0\n" },
            { stdin: "1\nprint\n", expected: "0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `new BankAccount()` do?",
          options: ["Declares a class", "Allocates an object with defaulted fields, runs a constructor, and returns a reference to it", "Copies an existing account", "Calls `main`"],
          answer: 1,
          explanation: "`new` is allocation plus construction; the expression's value is the reference the variable stores.",
        },
        {
          prompt: "`BankAccount a = new BankAccount(); BankAccount b = a; b.deposit(5);` — `a.balance()` is…",
          options: ["0", "5 — `a` and `b` refer to the same object", "Undefined", "Compile error"],
          answer: 1,
          explanation: "Assignment copies the reference. One object, two names.",
        },
        {
          prompt: "Inside an instance method, `this` is…",
          options: ["The class", "A reference to the object the method was called on", "The first parameter", "Always null"],
          answer: 1,
          explanation: "`this` is the implicit receiver; `balance += x` means `this.balance += x`.",
        },
        {
          prompt: "Which should be a field rather than a local?",
          options: ["A loop index", "A temporary sum inside one method", "The account's balance, which must persist between calls", "A parsed input token"],
          answer: 2,
          explanation: "Fields are for state that belongs to the object and outlives a single method call. Temporaries belong in locals.",
        },
        {
          prompt: "Two `BankAccount` objects with identical field values: `a == b` is…",
          options: ["`true`", "`false` — different objects", "`true` if both are final", "Compile error"],
          answer: 1,
          explanation: "`==` on references compares identity. Content equality needs an `equals` override (Module 8).",
        },
      ],
    },
    {
      slug: "constructors",
      file: "02-constructors.md",
      exercises: [
        {
          title: "Validated accounts",
          prompt: `Write a class \`Account\` with \`private final String owner\` and \`private long cents\`, two constructors — \`Account(String owner)\` delegating with \`this(owner, 0)\` to \`Account(String owner, long openingCents)\` — and the validation: a blank owner or a negative opening balance throws \`IllegalArgumentException\`. Add \`deposit(long)\` (positive amounts only, otherwise throw) and \`balance()\`.

Read an integer \`n\`, then \`n\` lines of \`open <owner> [<cents>]\` (one or two arguments); for each, try to create the account and print \`<owner>:<balance>\`, or \`rejected\` if the constructor threw. Catch the exception with \`try { … } catch (IllegalArgumentException e) { … }\`.

Example: \`3\` then \`open ada 500\`, \`open bob\`, \`open eve -1\` →
\`\`\`
ada:500
bob:0
rejected
\`\`\``,
          starter: String.raw`import java.util.*;

class Account {
    private final String owner;
    private long cents;

    // TODO: two constructors, deposit, balance
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = in.nextLine().trim().split("\\s+");
            // t[0] is "open", t[1] the owner, t[2] (optional) the opening cents
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class Account {
    private final String owner;
    private long cents;

    Account(String owner) {
        this(owner, 0);
    }

    Account(String owner, long openingCents) {
        if (owner == null || owner.isBlank()) throw new IllegalArgumentException("owner required");
        if (openingCents < 0) throw new IllegalArgumentException("negative opening balance");
        this.owner = owner;
        this.cents = openingCents;
    }

    void deposit(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("deposit must be positive");
        cents += amount;
    }

    long balance() { return cents; }
    String owner() { return owner; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = in.nextLine().trim().split("\\s+");
            try {
                Account a = t.length > 2 ? new Account(t[1], Long.parseLong(t[2])) : new Account(t[1]);
                System.out.println(a.owner() + ":" + a.balance());
            } catch (IllegalArgumentException e) {
                System.out.println("rejected");
            }
        }
    }
}
`,
          hints: ["this(owner, 0) must be the first statement of the one-argument constructor.", "Validate in the two-argument constructor so both paths share the checks."],
          cases: [
            { stdin: "3\nopen ada 500\nopen bob\nopen eve -1\n", expected: "ada:500\nbob:0\nrejected\n" },
            { stdin: "2\nopen x 0\nopen y 9999999999\n", expected: "x:0\ny:9999999999\n" },
            { stdin: "1\nopen z -5\n", expected: "rejected\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A class declares one constructor `Point(int x, int y)`. `new Point()`…",
          options: ["Works, using defaults", "Is a compile error — declaring a constructor removes the default one", "Throws at run time", "Calls `Point(0, 0)`"],
          answer: 1,
          explanation: "The compiler generates a no-arg constructor only when none is declared. Add one explicitly if you need it.",
        },
        {
          prompt: "Where must `this(...)` appear in a constructor?",
          options: ["Anywhere", "As the first statement", "Last", "In a static block"],
          answer: 1,
          explanation: "Constructor chaining must happen before any other statement so the object is initialised by exactly one path.",
        },
        {
          prompt: "Order of execution for `new Sub()` (with a superclass `Base`)?",
          options: ["Sub body, Base body, initialisers", "Field defaults → Base initialisers → Base body → Sub initialisers → Sub body", "Sub initialisers → Base body → Sub body", "Random"],
          answer: 1,
          explanation: "Superclass first; within each class, field initialisers in textual order, then the constructor body.",
        },
        {
          prompt: "`public void Point(int x) { … }` inside `class Point` is…",
          options: ["A constructor", "An ordinary method that happens to share the class name — a classic mistake", "A compile error", "A static factory"],
          answer: 1,
          explanation: "Constructors have no return type. With `void` it is just a method; `new Point(1)` will not call it.",
        },
        {
          prompt: "Why prefer a static factory like `Color.fromHex(\"#fff\")` over a constructor?",
          options: ["Factories are faster", "It has a descriptive name and may return cached instances or subtypes", "Constructors cannot take strings", "Factories skip validation"],
          answer: 1,
          explanation: "Names distinguish overloads with the same parameter types, and a factory need not create a new object every time.",
        },
      ],
    },
    {
      slug: "static-members",
      file: "03-static-members.md",
      exercises: [
        {
          title: "Numbered tickets",
          prompt: `Write a class \`Ticket\` with a \`private static int nextId = 1\`, a \`private final int id\` assigned from it in the constructor, a \`private final String holder\`, and \`static int issued()\` returning how many tickets exist. Read an integer \`n\` and \`n\` names; create a ticket for each and print \`#<id> <holder>\`; finally print \`issued=<count>\`.

Example: \`2\` then \`ada bob\` →
\`\`\`
#1 ada
#2 bob
issued=2
\`\`\``,
          starter: String.raw`import java.util.*;

class Ticket {
    private static int nextId = 1;
    private final int id;
    private final String holder;

    // TODO: constructor, issued(), toString()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Ticket t = new Ticket(in.next());
            System.out.println(t);
        }
        System.out.println("issued=" + Ticket.issued());
    }
}
`,
          solution: String.raw`import java.util.*;

class Ticket {
    private static int nextId = 1;
    private final int id;
    private final String holder;

    Ticket(String holder) {
        this.id = nextId++;
        this.holder = holder;
    }

    static int issued() { return nextId - 1; }

    @Override
    public String toString() { return "#" + id + " " + holder; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Ticket t = new Ticket(in.next());
            System.out.println(t);
        }
        System.out.println("issued=" + Ticket.issued());
    }
}
`,
          hints: ["The static counter is shared; each constructor takes nextId and then advances it.", "println(t) calls toString()."],
          cases: [
            { stdin: "2\nada bob\n", expected: "#1 ada\n#2 bob\nissued=2\n" },
            { stdin: "0\n", expected: "issued=0\n" },
            { stdin: "3\nx y z\n", expected: "#1 x\n#2 y\n#3 z\nissued=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many copies of a `static` field exist?",
          options: ["One per object", "One per class, however many objects exist", "One per thread", "One per method call"],
          answer: 1,
          explanation: "Static members belong to the class and live from class initialisation until the JVM exits.",
        },
        {
          prompt: "When does a `static { … }` block run?",
          options: ["On every `new`", "Once, when the class is initialised on first active use", "At compile time", "When `main` starts, for all classes"],
          answer: 1,
          explanation: "Class initialisation is lazy and happens exactly once, under a JVM lock, superclasses first.",
        },
        {
          prompt: "A subclass declares a static method with the same signature as its parent's. This is…",
          options: ["Overriding", "Hiding — resolved by the reference's static type, not polymorphic", "A compile error", "Overloading"],
          answer: 1,
          explanation: "Static methods are not dispatched on the receiver's runtime class. `@Override` on a static method is rejected.",
        },
        {
          prompt: "Which is a good use of a static field?",
          options: ["An account's balance", "A `static final Pattern` compiled once for the class", "A per-request user id", "A loop counter"],
          answer: 1,
          explanation: "Constants, loggers and shared immutable helpers are what `static` is for; per-object state is not.",
        },
        {
          prompt: "`static int a = b + 1; static int b = 5;` — the value of `a` is…",
          options: ["6", "1 — `b` is still 0 when `a`'s initialiser runs", "5", "Compile error"],
          answer: 1,
          explanation: "Static initialisers run top to bottom; `b` has only its default at that point. Declare in dependency order.",
        },
      ],
    },
    {
      slug: "encapsulation",
      file: "04-encapsulation.md",
      exercises: [
        {
          title: "An immutable range",
          prompt: `Write a \`final\` class \`Range\` with \`private final int lo, hi\` (invariant \`lo <= hi\`, else the constructor throws \`IllegalArgumentException\`), and methods \`length()\` (\`hi - lo\`), \`contains(int x)\` (\`lo <= x < hi\`), \`shift(int by)\` returning a **new** \`Range\`, and \`toString()\` giving \`[lo, hi)\`.

Read an integer \`n\`, then \`n\` commands: \`new <lo> <hi>\` (replace the current range, or print \`invalid\` and keep the old one), \`shift <by>\`, \`contains <x>\` (print \`true\`/\`false\`), \`len\` (print the length), \`print\`.

Example: \`5\` then \`new 2 5\`, \`print\`, \`shift 3\`, \`print\`, \`contains 7\` →
\`\`\`
[2, 5)
[5, 8)
true
\`\`\``,
          starter: String.raw`import java.util.*;

final class Range {
    private final int lo, hi;

    // TODO: constructor with validation, length, contains, shift, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Range r = new Range(0, 0);
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

final class Range {
    private final int lo, hi;

    Range(int lo, int hi) {
        if (lo > hi) throw new IllegalArgumentException(lo + " > " + hi);
        this.lo = lo;
        this.hi = hi;
    }

    int length() { return hi - lo; }
    boolean contains(int x) { return lo <= x && x < hi; }
    Range shift(int by) { return new Range(lo + by, hi + by); }

    @Override
    public String toString() { return "[" + lo + ", " + hi + ")"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Range r = new Range(0, 0);
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "new" -> {
                    int lo = in.nextInt(), hi = in.nextInt();
                    try {
                        r = new Range(lo, hi);
                    } catch (IllegalArgumentException e) {
                        System.out.println("invalid");
                    }
                }
                case "shift" -> r = r.shift(in.nextInt());
                case "contains" -> System.out.println(r.contains(in.nextInt()));
                case "len" -> System.out.println(r.length());
                default -> System.out.println(r);
            }
        }
    }
}
`,
          hints: ["shift returns a new object; the caller rebinds its variable: r = r.shift(by).", "final fields, final class, no setters — that is the immutability recipe."],
          cases: [
            { stdin: "5\nnew 2 5\nprint\nshift 3\nprint\ncontains 7\n", expected: "[2, 5)\n[5, 8)\ntrue\n" },
            { stdin: "4\nnew 5 2\nprint\nnew 1 1\nlen\n", expected: "invalid\n[0, 0)\n0\n" },
            { stdin: "3\nnew -3 3\ncontains 3\ncontains -3\n", expected: "false\ntrue\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which members can a class in **another package** that is **not** a subclass access?",
          options: ["`public` and `protected`", "`public` only", "Everything but `private`", "Package-private and `public`"],
          answer: 1,
          explanation: "Package-private and `protected` both require the same package (or, for `protected`, a subclass). Only `public` crosses all boundaries.",
        },
        {
          prompt: "`private` restricts access to…",
          options: ["The same object only", "The same class — other instances of that class may access it too", "The same package", "Subclasses"],
          answer: 1,
          explanation: "Access is per class, not per object, which is what lets `equals(Other o)` read `o.field`.",
        },
        {
          prompt: "Which is **not** required for an immutable class?",
          options: ["No setters", "Private final fields", "Getters for every field", "Defensive copies of mutable components"],
          answer: 2,
          explanation: "Immutability is about the absence of mutation; accessors are optional. Also mark the class `final` and return new instances for changes.",
        },
        {
          prompt: "A getter returns the internal `List<String>` directly. The consequence is…",
          options: ["None", "Callers can mutate the object's state through the returned list", "A compile error", "The list is copied automatically"],
          answer: 1,
          explanation: "Returning a mutable internal object leaks it. Return a copy or `Collections.unmodifiableList(list)`.",
        },
        {
          prompt: "\"Tell, don't ask\" suggests replacing `if (a.getBalance() >= x) a.setBalance(a.getBalance() - x)` with…",
          options: ["More getters", "`a.withdraw(x)` — keeping the rule inside the class", "A static method", "A public field"],
          answer: 1,
          explanation: "The invariant (no overdraft) lives in one place instead of in every caller.",
        },
      ],
    },
    {
      slug: "designing-a-class",
      file: "05-designing-a-class.md",
      exercises: [
        {
          title: "Orders made of lines",
          prompt: `Write two classes. \`OrderLine\` holds a product name, a quantity and a unit price in cents, with \`subtotalCents()\`. \`Order\` holds an id and a list of lines, with \`add(String name, int qty, long unitCents)\`, \`totalCents()\` and a \`toString()\` of the form \`Order#<id>[<n> lines, total=<cents>]\`.

Read an integer \`id\`, an integer \`n\`, then \`n\` lines \`<name> <qty> <unitCents>\`. Add each line and, at the end, print the order via \`toString\`, then one line per order line as \`<name> x<qty> = <subtotal>\`.

Example: \`42\`, \`2\`, \`pen 3 150\`, \`pad 1 499\` →
\`\`\`
Order#42[2 lines, total=949]
pen x3 = 450
pad x1 = 499
\`\`\``,
          starter: String.raw`import java.util.*;

class OrderLine {
    // TODO: fields, constructor, subtotalCents(), accessors
}

class Order {
    // TODO: id, List<OrderLine> lines, add, totalCents, toString, lines()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int id = in.nextInt();
        int n = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class OrderLine {
    private final String name;
    private final int qty;
    private final long unitCents;

    OrderLine(String name, int qty, long unitCents) {
        this.name = name;
        this.qty = qty;
        this.unitCents = unitCents;
    }

    long subtotalCents() { return qty * unitCents; }
    String name() { return name; }
    int qty() { return qty; }
}

class Order {
    private final int id;
    private final List<OrderLine> lines = new ArrayList<>();

    Order(int id) { this.id = id; }

    void add(String name, int qty, long unitCents) {
        lines.add(new OrderLine(name, qty, unitCents));
    }

    long totalCents() {
        long sum = 0;
        for (OrderLine l : lines) sum += l.subtotalCents();
        return sum;
    }

    List<OrderLine> lines() { return Collections.unmodifiableList(lines); }

    @Override
    public String toString() {
        return "Order#" + id + "[" + lines.size() + " lines, total=" + totalCents() + "]";
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int id = in.nextInt();
        int n = in.nextInt();
        Order order = new Order(id);
        for (int i = 0; i < n; i++) {
            order.add(in.next(), in.nextInt(), in.nextLong());
        }
        System.out.println(order);
        for (OrderLine l : order.lines()) {
            System.out.println(l.name() + " x" + l.qty() + " = " + l.subtotalCents());
        }
    }
}
`,
          hints: ["Order delegates each subtotal to its OrderLine — composition.", "Return an unmodifiable view of the lines rather than the list itself."],
          cases: [
            { stdin: "42\n2\npen 3 150\npad 1 499\n", expected: "Order#42[2 lines, total=949]\npen x3 = 450\npad x1 = 499\n" },
            { stdin: "7\n0\n", expected: "Order#7[0 lines, total=0]\n" },
            { stdin: "1\n1\nserver 2 2000000000\n", expected: "Order#1[1 lines, total=4000000000]\nserver x2 = 4000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "\"Favour composition over inheritance\" means…",
          options: ["Never write subclasses", "Build behaviour by holding other objects (has-a) rather than extending them (is-a) when a has-a relationship fits", "Use interfaces only", "Avoid constructors"],
          answer: 1,
          explanation: "Composition hides the inner object's API, can be swapped at run time, and does not break when the inner class changes.",
        },
        {
          prompt: "The default `Object.toString()` returns…",
          options: ["The field values", "`ClassName@hexHash`", "An empty string", "`null`"],
          answer: 1,
          explanation: "Override it in every class you debug or log; annotate the override with `@Override` so a typo becomes a compile error.",
        },
        {
          prompt: "A value object's `equals` should compare…",
          options: ["References", "All its fields", "Only an id", "Nothing — values are never equal"],
          answer: 1,
          explanation: "Values are defined by their contents; entities by identity. Deciding which you have settles equality and mutability.",
        },
        {
          prompt: "How is an object's memory freed in Java?",
          options: ["By calling its destructor", "By `delete`", "By the garbage collector once nothing references it", "By `finalize()`, which you must call"],
          answer: 2,
          explanation: "No destructors, no manual freeing. `finalize` is deprecated; resources are released via `close()` in try-with-resources.",
        },
        {
          prompt: "The builder pattern is most useful when…",
          options: ["A class has one field", "A class has many optional parameters and should end up immutable", "You need a singleton", "Performance is critical"],
          answer: 1,
          explanation: "Fluent setters assemble the parts readably; `build()` validates and creates the immutable object once.",
        },
      ],
    },
    {
      slug: "classes-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A stack class",
          prompt: `Implement \`class IntStack\` backed by an \`int[]\` that **grows** (double the array with \`Arrays.copyOf\` when full), with \`push(int)\`, \`pop()\` (throws \`IllegalStateException\` when empty), \`peek()\`, \`size()\` and \`isEmpty()\`. Read an integer \`n\` then \`n\` commands: \`push <v>\`, \`pop\` (print the popped value or \`empty\`), \`peek\` (print the top or \`empty\`), \`size\` (print the size).

Example: \`6\` then \`push 1\`, \`push 2\`, \`peek\`, \`pop\`, \`pop\`, \`pop\` →
\`\`\`
2
2
1
empty
\`\`\``,
          starter: String.raw`import java.util.*;

class IntStack {
    private int[] items = new int[2];
    private int size = 0;

    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntStack s = new IntStack();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class IntStack {
    private int[] items = new int[2];
    private int size = 0;

    void push(int v) {
        if (size == items.length) items = Arrays.copyOf(items, items.length * 2);
        items[size++] = v;
    }

    int pop() {
        if (size == 0) throw new IllegalStateException("empty");
        return items[--size];
    }

    int peek() {
        if (size == 0) throw new IllegalStateException("empty");
        return items[size - 1];
    }

    int size() { return size; }
    boolean isEmpty() { return size == 0; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntStack s = new IntStack();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "push" -> s.push(in.nextInt());
                case "pop" -> System.out.println(s.isEmpty() ? "empty" : String.valueOf(s.pop()));
                case "peek" -> System.out.println(s.isEmpty() ? "empty" : String.valueOf(s.peek()));
                default -> System.out.println(s.size());
            }
        }
    }
}
`,
          hints: ["Grow before writing when size == items.length.", "The logical size is a field; the array's length is just capacity."],
          cases: [
            { stdin: "6\npush 1\npush 2\npeek\npop\npop\npop\n", expected: "2\n2\n1\nempty\n" },
            { stdin: "7\npush 5\npush 6\npush 7\npush 8\nsize\npop\nsize\n", expected: "4\n8\n3\n" },
            { stdin: "2\npeek\nsize\n", expected: "empty\n0\n", hidden: true },
          ],
        },
        {
          title: "Money that adds up",
          prompt: `Write an immutable \`final class Money\` with \`private final long cents\` and \`private final String currency\`, a constructor that rejects a negative amount or a blank currency, \`plus(Money other)\` (throws \`IllegalArgumentException\` if the currencies differ), \`times(int factor)\`, and \`toString()\` formatted as \`<currency> <whole>.<cc>\` (two-digit cents).

Read an integer \`n\`, then \`n\` lines \`<currency> <cents>\`. Sum all amounts of the **first** line's currency with \`plus\`, skipping lines whose currency differs (count them), then print the total and \`skipped=<count>\`.

Example: \`3\` then \`EUR 150\`, \`USD 100\`, \`EUR 5\` →
\`\`\`
EUR 1.55
skipped=1
\`\`\``,
          starter: String.raw`import java.util.*;

final class Money {
    private final long cents;
    private final String currency;

    // TODO
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

final class Money {
    private final long cents;
    private final String currency;

    Money(long cents, String currency) {
        if (cents < 0) throw new IllegalArgumentException("negative amount");
        if (currency == null || currency.isBlank()) throw new IllegalArgumentException("currency required");
        this.cents = cents;
        this.currency = currency;
    }

    Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(cents + other.cents, currency);
    }

    Money times(int factor) { return new Money(cents * factor, currency); }
    String currency() { return currency; }

    @Override
    public String toString() {
        return currency + " " + (cents / 100) + "." + String.format("%02d", cents % 100);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Money total = null;
        int skipped = 0;
        for (int i = 0; i < n; i++) {
            String currency = in.next();
            long cents = in.nextLong();
            Money m = new Money(cents, currency);
            if (total == null) total = m;
            else if (total.currency().equals(m.currency())) total = total.plus(m);
            else skipped++;
        }
        System.out.println(total);
        System.out.println("skipped=" + skipped);
    }
}
`,
          hints: ["Keep a running Money total; plus returns a new object each time.", "Compare currencies with equals; count the mismatches instead of throwing."],
          cases: [
            { stdin: "3\nEUR 150\nUSD 100\nEUR 5\n", expected: "EUR 1.55\nskipped=1\n" },
            { stdin: "1\nINR 7\n", expected: "INR 0.07\nskipped=0\n" },
            { stdin: "4\nGBP 100000\nGBP 1\nEUR 1\nUSD 1\n", expected: "GBP 1000.01\nskipped=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Point p = null; p.x = 1;` throws…",
          options: ["`IllegalStateException`", "`NullPointerException`", "Nothing", "`ClassCastException`"],
          answer: 1,
          explanation: "Dereferencing a null reference — field or method — always throws NPE.",
        },
        {
          prompt: "Which statement about constructors is true?",
          options: ["They can return a value", "They are inherited by subclasses", "Declaring any constructor suppresses the default no-arg one", "They must be public"],
          answer: 2,
          explanation: "Constructors have no return type, are not inherited, and may have any access level.",
        },
        {
          prompt: "A field initialiser `private List<String> xs = new ArrayList<>();` runs…",
          options: ["Only for the no-arg constructor", "Before every constructor body, after the superclass constructor", "After the constructor body", "At class load"],
          answer: 1,
          explanation: "Instance initialisers run for each `new`, in textual order, before the constructor's own statements.",
        },
        {
          prompt: "Why can `main` not call `deposit()` (an instance method) directly?",
          options: ["`deposit` is private", "`main` is static and has no `this`; an object is needed", "`main` cannot call methods", "`deposit` must be final"],
          answer: 1,
          explanation: "Static context has no instance. `new BankAccount().deposit(…)` or store the object in a variable.",
        },
        {
          prompt: "Which access modifier lets classes in the same package and subclasses elsewhere see a member?",
          options: ["`private`", "Package-private", "`protected`", "`public`"],
          answer: 2,
          explanation: "`protected` = package + subclasses. Package-private = package only.",
        },
        {
          prompt: "An immutable class should be declared `final` because…",
          options: ["Final classes are faster", "A subclass could otherwise add mutable state or override behaviour, breaking the guarantee", "The compiler requires it", "Only final classes can have final fields"],
          answer: 1,
          explanation: "Immutability is a promise about every instance; preventing subclassing keeps the promise for objects created by others.",
        },
        {
          prompt: "`static` methods are appropriate for…",
          options: ["Anything called often", "Pure functions of their arguments and factory methods", "Methods that modify fields", "Methods that must be overridden"],
          answer: 1,
          explanation: "No `this` means no instance state; that fits utilities and factories, not behaviour that depends on an object.",
        },
        {
          prompt: "Storing a caller's `int[]` in a field without copying it…",
          options: ["Is always fine", "Aliases the array: the caller can change the object's state later", "Copies it automatically", "Is a compile error"],
          answer: 1,
          explanation: "Defensive copies on the way in (and out) are how a class owns its data.",
        },
        {
          prompt: "Which is a value object rather than an entity?",
          options: ["A customer account", "A database connection", "A `Money` amount", "An HTTP session"],
          answer: 2,
          explanation: "Money is defined by its amount and currency, not by identity; equal contents mean the same value.",
        },
        {
          prompt: "`@Override` on `toString` is useful because…",
          options: ["It makes the method faster", "A misspelled name would become a compile error instead of a silent new method", "It is required for `println`", "It makes the method static"],
          answer: 1,
          explanation: "The annotation asks the compiler to verify that a superclass or interface method is actually being overridden.",
        },
        {
          prompt: "Calling an overridable method from a constructor is risky because…",
          options: ["It is a compile error", "A subclass override may run before the subclass's fields are initialised", "It creates a memory leak", "It is slow"],
          answer: 1,
          explanation: "The subclass constructor body — and its field initialisers — have not run yet, so the override sees default values.",
        },
        {
          prompt: "When does an object become eligible for garbage collection?",
          options: ["When `System.gc()` is called", "When its variable goes out of scope, always", "When no chain of references from a GC root reaches it", "When `finalize` returns"],
          answer: 2,
          explanation: "Reachability is the criterion. A local going out of scope matters only if it was the last reference.",
        },
      ],
    },
  ],
}, more);

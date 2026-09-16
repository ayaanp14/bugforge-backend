import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "classes-and-objects": [
    {
      title: "Points that move",
      prompt: `Write a class \`Point\` with \`double x, y\`, a constructor, \`void translate(double dx, double dy)\`, \`double distanceTo(Point other)\` and a \`toString\` returning \`(x, y)\` with one decimal each. Read an integer \`n\` and \`n\` commands on one point that starts at the origin: \`move <dx> <dy>\` translates and prints the point; \`dist <x> <y>\` prints the distance to that point with two decimals. Use \`Locale.ROOT\`.

Example: \`3\` then \`move 3 4\`, \`dist 0 0\`, \`move -3 0\` →
\`\`\`
(3.0, 4.0)
5.00
(0.0, 4.0)
\`\`\``,
      starter: String.raw`import java.util.*;

class Point {
    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Point p = new Point(0, 0);
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            double a = in.nextDouble(), b = in.nextDouble();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Point {
    double x, y;
    Point(double x, double y) { this.x = x; this.y = y; }
    void translate(double dx, double dy) { x += dx; y += dy; }
    double distanceTo(Point o) { return Math.hypot(x - o.x, y - o.y); }
    @Override public String toString() { return String.format(Locale.ROOT, "(%.1f, %.1f)", x, y); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Point p = new Point(0, 0);
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            double a = in.nextDouble(), b = in.nextDouble();
            if (cmd.equals("move")) {
                p.translate(a, b);
                System.out.println(p);
            } else {
                System.out.println(String.format(Locale.ROOT, "%.2f", p.distanceTo(new Point(a, b))));
            }
        }
    }
}
`,
      hints: ["The object holds its state; each command is a method call on the same object.", "Math.hypot(dx, dy) is the distance formula without the overflow risk."],
      cases: [
        { stdin: "3\nmove 3 4\ndist 0 0\nmove -3 0\n", expected: "(3.0, 4.0)\n5.00\n(0.0, 4.0)\n" },
        { stdin: "1\ndist 1 1\n", expected: "1.41\n" },
        { stdin: "2\nmove 0.5 0.25\nmove 0.5 0.25\n", expected: "(0.5, 0.3)\n(1.0, 0.5)\n", hidden: true },
      ],
    },
  ],
  constructors: [
    {
      title: "Constructor chaining, traced",
      prompt: `Write \`class Rectangle\` with three constructors: \`Rectangle()\` calls \`this(1, 1)\`; \`Rectangle(double side)\` calls \`this(side, side)\`; \`Rectangle(double w, double h)\` assigns the fields. Each constructor prints \`ctor(<its parameter list>)\` **after** its \`this(...)\` call returns, e.g. \`ctor()\`, \`ctor(side=3.0)\`, \`ctor(w=2.0,h=5.0)\`. Read an integer \`n\` and \`n\` lines \`<k> <values>\` with \`k\` 0, 1 or 2; construct with the matching constructor and then print \`area=<w*h>\`.

Example: \`2\` then \`0\`, \`1 3\` →
\`\`\`
ctor(w=1.0,h=1.0)
ctor()
area=1.0
ctor(w=3.0,h=3.0)
ctor(side=3.0)
area=9.0
\`\`\``,
      starter: String.raw`import java.util.*;

class Rectangle {
    double w, h;
    // TODO: three constructors chained with this(...)
    double area() { return w * h; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int k = in.nextInt();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Rectangle {
    double w, h;
    Rectangle() {
        this(1, 1);
        System.out.println("ctor()");
    }
    Rectangle(double side) {
        this(side, side);
        System.out.println("ctor(side=" + side + ")");
    }
    Rectangle(double w, double h) {
        this.w = w;
        this.h = h;
        System.out.println("ctor(w=" + w + ",h=" + h + ")");
    }
    double area() { return w * h; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int k = in.nextInt();
            Rectangle r = k == 0 ? new Rectangle() : k == 1 ? new Rectangle(in.nextDouble()) : new Rectangle(in.nextDouble(), in.nextDouble());
            System.out.println("area=" + r.area());
        }
    }
}
`,
      hints: ["this(...) must be the first statement; the print comes after it, so the delegate prints first.", "One constructor does the real work; the others translate their arguments into a call to it."],
      cases: [
        { stdin: "2\n0\n1 3\n", expected: "ctor(w=1.0,h=1.0)\nctor()\narea=1.0\nctor(w=3.0,h=3.0)\nctor(side=3.0)\narea=9.0\n" },
        { stdin: "1\n2 2 5\n", expected: "ctor(w=2.0,h=5.0)\narea=10.0\n" },
        { stdin: "2\n1 0.5\n0\n", expected: "ctor(w=0.5,h=0.5)\nctor(side=0.5)\narea=0.25\nctor(w=1.0,h=1.0)\nctor()\narea=1.0\n", hidden: true },
      ],
    },
  ],
  "static-members": [
    {
      title: "Instance census",
      prompt: `Write \`class Sensor\` with a \`private static int created\` counter incremented in the constructor, an instance field \`name\`, a static factory \`static Sensor of(String name)\`, and \`static int created()\`. Read an integer \`n\` and \`n\` names; create each through the factory and print \`created <name> (#<created so far>)\`. Then print \`total=<Sensor.created()>\` and \`sameCounter=<whether two different instances report the same created() through the class>\` — always \`true\`, because the counter belongs to the class, not to any instance.

Example: \`2\` then \`temp humidity\` →
\`\`\`
created temp (#1)
created humidity (#2)
total=2
sameCounter=true
\`\`\``,
      starter: String.raw`import java.util.*;

class Sensor {
    private static int created = 0;
    final String name;
    // TODO: constructor, of(name), created()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Sensor> sensors = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            // TODO
        }
        System.out.println("total=" + Sensor.created());
        // TODO: sameCounter
    }
}
`,
      solution: String.raw`import java.util.*;

class Sensor {
    private static int created = 0;
    final String name;
    private Sensor(String name) {
        this.name = name;
        created++;
    }
    static Sensor of(String name) { return new Sensor(name); }
    static int created() { return created; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Sensor> sensors = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Sensor s = Sensor.of(in.next());
            sensors.add(s);
            System.out.println("created " + s.name + " (#" + Sensor.created() + ")");
        }
        System.out.println("total=" + Sensor.created());
        boolean same = sensors.size() < 2 || Sensor.created() == Sensor.created();
        System.out.println("sameCounter=" + same);
    }
}
`,
      hints: ["A static field is shared by every instance; incrementing it in the constructor counts constructions.", "A private constructor plus a static factory keeps creation under the class's control."],
      cases: [
        { stdin: "2\ntemp humidity\n", expected: "created temp (#1)\ncreated humidity (#2)\ntotal=2\nsameCounter=true\n" },
        { stdin: "0\n", expected: "total=0\nsameCounter=true\n" },
        { stdin: "3\na b c\n", expected: "created a (#1)\ncreated b (#2)\ncreated c (#3)\ntotal=3\nsameCounter=true\n", hidden: true },
      ],
    },
  ],
  encapsulation: [
    {
      title: "A thermostat with invariants",
      prompt: `Write \`class Thermostat\` with a private \`target\` (degrees) and private constants \`MIN = 5\`, \`MAX = 30\`. \`setTarget(int)\` rejects values outside \`[MIN, MAX]\` by throwing \`IllegalArgumentException("target out of range: <v>")\` and leaves the field unchanged; \`getTarget()\` returns it; \`adjust(int delta)\` moves the target but **clamps** to the range. Read an integer \`n\` and \`n\` commands \`set <v>\` or \`adjust <d>\`; print \`target=<v>\` after each, or the exception message when \`set\` rejects. The target starts at 20.

Example: \`3\` then \`set 25\`, \`set 40\`, \`adjust 10\` →
\`\`\`
target=25
target out of range: 40
target=30
\`\`\``,
      starter: String.raw`import java.util.*;

class Thermostat {
    private static final int MIN = 5, MAX = 30;
    private int target = 20;
    // TODO: setTarget, getTarget, adjust
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Thermostat t = new Thermostat();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            int v = in.nextInt();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Thermostat {
    private static final int MIN = 5, MAX = 30;
    private int target = 20;
    void setTarget(int v) {
        if (v < MIN || v > MAX) throw new IllegalArgumentException("target out of range: " + v);
        target = v;
    }
    int getTarget() { return target; }
    void adjust(int delta) { target = Math.max(MIN, Math.min(MAX, target + delta)); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Thermostat t = new Thermostat();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            int v = in.nextInt();
            try {
                if (cmd.equals("set")) t.setTarget(v); else t.adjust(v);
                System.out.println("target=" + t.getTarget());
            } catch (IllegalArgumentException e) {
                System.out.println(e.getMessage());
            }
        }
    }
}
`,
      hints: ["Because the field is private, the only way in is through methods that enforce the range.", "Validate before assigning so a rejected value never touches the field."],
      cases: [
        { stdin: "3\nset 25\nset 40\nadjust 10\n", expected: "target=25\ntarget out of range: 40\ntarget=30\n" },
        { stdin: "2\nadjust -100\nset 5\n", expected: "target=5\ntarget=5\n" },
        { stdin: "3\nset 0\nadjust 3\nset 30\n", expected: "target out of range: 0\ntarget=23\ntarget=30\n", hidden: true },
      ],
    },
  ],
  "designing-a-class": [
    {
      title: "A shopping cart",
      prompt: `Design \`class Cart\` composed of \`Item\` objects (\`name\`, \`unitCents\`, \`qty\`). \`add(name, unitCents, qty)\` merges quantities when the name already exists; \`remove(name)\` deletes; \`totalCents()\` sums; \`toString\` lists items in insertion order as \`<name> x<qty> = <total in dollars, two decimals>\` per line followed by \`TOTAL <dollars>\`. Read an integer \`n\` and \`n\` commands (\`add <name> <cents> <qty>\`, \`remove <name>\`), then print the cart.

Example: \`3\` then \`add pen 150 2\`, \`add pad 400 1\`, \`add pen 150 1\` →
\`\`\`
pen x3 = 4.50
pad x1 = 4.00
TOTAL 8.50
\`\`\``,
      starter: String.raw`import java.util.*;

class Item {
    final String name;
    final int unitCents;
    int qty;
    Item(String name, int unitCents, int qty) { this.name = name; this.unitCents = unitCents; this.qty = qty; }
}

class Cart {
    private final Map<String, Item> items = new LinkedHashMap<>();
    // TODO: add, remove, totalCents, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Cart cart = new Cart();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
        System.out.print(cart);
    }
}
`,
      solution: String.raw`import java.util.*;

class Item {
    final String name;
    final int unitCents;
    int qty;
    Item(String name, int unitCents, int qty) { this.name = name; this.unitCents = unitCents; this.qty = qty; }
}

class Cart {
    private final Map<String, Item> items = new LinkedHashMap<>();
    void add(String name, int unitCents, int qty) {
        Item existing = items.get(name);
        if (existing != null) existing.qty += qty;
        else items.put(name, new Item(name, unitCents, qty));
    }
    void remove(String name) { items.remove(name); }
    long totalCents() {
        long t = 0;
        for (Item it : items.values()) t += (long) it.unitCents * it.qty;
        return t;
    }
    @Override public String toString() {
        StringBuilder sb = new StringBuilder();
        for (Item it : items.values()) {
            sb.append(String.format(Locale.ROOT, "%s x%d = %.2f%n", it.name, it.qty, it.unitCents * it.qty / 100.0));
        }
        sb.append(String.format(Locale.ROOT, "TOTAL %.2f%n", totalCents() / 100.0));
        return sb.toString();
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Cart cart = new Cart();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            if (cmd.equals("add")) cart.add(in.next(), in.nextInt(), in.nextInt());
            else cart.remove(in.next());
        }
        System.out.print(cart);
    }
}
`,
      hints: ["A LinkedHashMap keyed by name gives merge-on-add and insertion order in one structure.", "Keep money in integer cents and convert only when printing."],
      cases: [
        { stdin: "3\nadd pen 150 2\nadd pad 400 1\nadd pen 150 1\n", expected: "pen x3 = 4.50\npad x1 = 4.00\nTOTAL 8.50\n" },
        { stdin: "2\nadd a 100 1\nremove a\n", expected: "TOTAL 0.00\n" },
        { stdin: "4\nadd x 5 3\nadd y 99 1\nremove z\nadd y 99 2\n", expected: "x x3 = 0.15\ny x3 = 2.97\nTOTAL 3.12\n", hidden: true },
      ],
    },
  ],
  "classes-checkpoint": [
    {
      title: "Library loans",
      prompt: `Model a small library. \`class Book\` has a \`title\` and a \`loanedTo\` (member name or \`null\`). \`class Library\` holds books in insertion order and supports \`lend <title> <member>\` (\`lent <title> to <member>\`, or \`<title> is already out\` / \`no such book\`), \`return <title>\` (\`returned <title>\`, or \`<title> was not out\`), and \`report\` (one line per book: \`<title>: available\` or \`<title>: with <member>\`). Read an integer \`n\` and \`n\` titles, then \`m\` commands.

Example: \`2\` then \`Dune Emma\`, then \`3\` then \`lend Dune ann\`, \`lend Dune bob\`, \`report\` →
\`\`\`
lent Dune to ann
Dune is already out
Dune: with ann
Emma: available
\`\`\``,
      starter: String.raw`import java.util.*;

class Book {
    final String title;
    String loanedTo;
    Book(String title) { this.title = title; }
}

class Library {
    private final Map<String, Book> books = new LinkedHashMap<>();
    void addBook(String title) { books.put(title, new Book(title)); }
    // TODO: lend, giveBack, report
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Library lib = new Library();
        for (int i = 0; i < n; i++) lib.addBook(in.next());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Book {
    final String title;
    String loanedTo;
    Book(String title) { this.title = title; }
}

class Library {
    private final Map<String, Book> books = new LinkedHashMap<>();
    void addBook(String title) { books.put(title, new Book(title)); }
    String lend(String title, String member) {
        Book b = books.get(title);
        if (b == null) return "no such book";
        if (b.loanedTo != null) return title + " is already out";
        b.loanedTo = member;
        return "lent " + title + " to " + member;
    }
    String giveBack(String title) {
        Book b = books.get(title);
        if (b == null) return "no such book";
        if (b.loanedTo == null) return title + " was not out";
        b.loanedTo = null;
        return "returned " + title;
    }
    void report() {
        for (Book b : books.values()) System.out.println(b.title + ": " + (b.loanedTo == null ? "available" : "with " + b.loanedTo));
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Library lib = new Library();
        for (int i = 0; i < n; i++) lib.addBook(in.next());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "lend" -> System.out.println(lib.lend(in.next(), in.next()));
                case "return" -> System.out.println(lib.giveBack(in.next()));
                default -> lib.report();
            }
        }
    }
}
`,
      hints: ["The Library owns the books (composition) and is the only thing that changes a loan.", "Return the message from the method and let main print it — the class stays free of I/O."],
      cases: [
        { stdin: "2\nDune Emma\n3\nlend Dune ann\nlend Dune bob\nreport\n", expected: "lent Dune to ann\nDune is already out\nDune: with ann\nEmma: available\n" },
        { stdin: "1\nUlysses\n3\nreturn Ulysses\nlend Odyssey cy\nreport\n", expected: "Ulysses was not out\nno such book\nUlysses: available\n" },
        { stdin: "2\nA B\n4\nlend B zed\nreturn B\nlend B amy\nreport\n", expected: "lent B to zed\nreturned B\nlent B to amy\nA: available\nB: with amy\n", hidden: true },
      ],
    },
  ],
};

export default more;

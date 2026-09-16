import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "extending-classes": [
    {
      title: "Vehicles, constructed in order",
      prompt: `Write \`class Vehicle\` (fields \`name\`, \`wheels\`; its constructor prints \`Vehicle(<name>, <wheels>)\`), \`class Car extends Vehicle\` (constructor \`Car(String name)\` calls \`super(name, 4)\` then prints \`Car(<name>)\`) and \`class Motorbike extends Vehicle\` (\`super(name, 2)\`, then \`Motorbike(<name>)\`). Add \`String describe()\` in \`Vehicle\` returning \`<name> has <wheels> wheels\`. Read \`n\` lines \`<kind> <name>\`; construct each and print \`describe()\`. The superclass constructor always runs first.

Example: \`2\` then \`car Polo\`, \`bike Vespa\` →
\`\`\`
Vehicle(Polo, 4)
Car(Polo)
Polo has 4 wheels
Vehicle(Vespa, 2)
Motorbike(Vespa)
Vespa has 2 wheels
\`\`\``,
      starter: String.raw`import java.util.*;

class Vehicle {
    final String name;
    final int wheels;
    // TODO
}
// TODO: Car, Motorbike

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String kind = in.next(), name = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Vehicle {
    final String name;
    final int wheels;
    Vehicle(String name, int wheels) {
        this.name = name;
        this.wheels = wheels;
        System.out.println("Vehicle(" + name + ", " + wheels + ")");
    }
    String describe() { return name + " has " + wheels + " wheels"; }
}

class Car extends Vehicle {
    Car(String name) {
        super(name, 4);
        System.out.println("Car(" + name + ")");
    }
}

class Motorbike extends Vehicle {
    Motorbike(String name) {
        super(name, 2);
        System.out.println("Motorbike(" + name + ")");
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String kind = in.next(), name = in.next();
            Vehicle v = kind.equals("car") ? new Car(name) : new Motorbike(name);
            System.out.println(v.describe());
        }
    }
}
`,
      hints: ["super(...) must be the first statement, so the parent's print always comes before the child's.", "describe() is inherited — neither subclass needs to redefine it."],
      cases: [
        { stdin: "2\ncar Polo\nbike Vespa\n", expected: "Vehicle(Polo, 4)\nCar(Polo)\nPolo has 4 wheels\nVehicle(Vespa, 2)\nMotorbike(Vespa)\nVespa has 2 wheels\n" },
        { stdin: "1\nbike Ducati\n", expected: "Vehicle(Ducati, 2)\nMotorbike(Ducati)\nDucati has 2 wheels\n" },
        { stdin: "2\ncar A\ncar B\n", expected: "Vehicle(A, 4)\nCar(A)\nA has 4 wheels\nVehicle(B, 4)\nCar(B)\nB has 4 wheels\n", hidden: true },
      ],
    },
  ],
  overriding: [
    {
      title: "toString up the chain",
      prompt: `Write \`class Person\` (\`name\`) with \`toString()\` returning \`Person[name=<name>]\`; \`class Employee extends Person\` (\`salary\`) whose override returns \`super.toString()\` with \`, salary=<salary>\` inserted before the closing bracket; and \`class Manager extends Employee\` (\`reports\`) doing the same with \`, reports=<n>\`. Mark every override with \`@Override\`. Read \`n\` lines \`<kind> <name> [salary] [reports]\` and print each object through a \`Person\` reference — the most specific \`toString\` runs.

Example: \`3\` then \`person ann\`, \`employee bob 5000\`, \`manager cy 9000 4\` →
\`\`\`
Person[name=ann]
Person[name=bob, salary=5000]
Person[name=cy, salary=9000, reports=4]
\`\`\``,
      starter: String.raw`import java.util.*;

class Person {
    final String name;
    Person(String name) { this.name = name; }
    @Override public String toString() { return "Person[name=" + name + "]"; }
}
// TODO: Employee, Manager

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Person {
    final String name;
    Person(String name) { this.name = name; }
    @Override public String toString() { return "Person[name=" + name + "]"; }
}

class Employee extends Person {
    final int salary;
    Employee(String name, int salary) { super(name); this.salary = salary; }
    @Override public String toString() {
        String base = super.toString();
        return base.substring(0, base.length() - 1) + ", salary=" + salary + "]";
    }
}

class Manager extends Employee {
    final int reports;
    Manager(String name, int salary, int reports) { super(name, salary); this.reports = reports; }
    @Override public String toString() {
        String base = super.toString();
        return base.substring(0, base.length() - 1) + ", reports=" + reports + "]";
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            Person p = switch (kind) {
                case "person" -> new Person(in.next());
                case "employee" -> new Employee(in.next(), in.nextInt());
                default -> new Manager(in.next(), in.nextInt(), in.nextInt());
            };
            System.out.println(p);
        }
    }
}
`,
      hints: ["super.toString() gives the parent's text; splice your field in before the final ]", "println(p) calls the runtime class's toString — dynamic dispatch."],
      cases: [
        { stdin: "3\nperson ann\nemployee bob 5000\nmanager cy 9000 4\n", expected: "Person[name=ann]\nPerson[name=bob, salary=5000]\nPerson[name=cy, salary=9000, reports=4]\n" },
        { stdin: "1\nmanager solo 1 0\n", expected: "Person[name=solo, salary=1, reports=0]\n" },
        { stdin: "2\nemployee x 0\nperson y\n", expected: "Person[name=x, salary=0]\nPerson[name=y]\n", hidden: true },
      ],
    },
  ],
  polymorphism: [
    {
      title: "Payments, dispatched",
      prompt: `Write an abstract-free hierarchy: \`class Payment\` with \`amount\` and \`double fee()\` returning 0 and \`String kind()\` returning \`"payment"\`; \`class Card extends Payment\` (fee 2% of the amount, kind \`"card"\`); \`class Transfer extends Payment\` (flat fee 1.50 when the amount is below 100, else 0, kind \`"transfer"\`); \`class Cash extends Payment\` (kind \`"cash"\`). Read \`n\` lines \`<kind> <amount>\`, store them in a \`Payment[]\`, and print \`<kind> <amount> fee <fee>\` (two decimals) per item plus \`total fees <sum>\`. Also print \`cards=<count via instanceof>\`.

Example: \`3\` then \`card 50\`, \`transfer 80\`, \`cash 20\` →
\`\`\`
card 50.00 fee 1.00
transfer 80.00 fee 1.50
cash 20.00 fee 0.00
total fees 2.50
cards=1
\`\`\``,
      starter: String.raw`import java.util.*;

class Payment {
    final double amount;
    Payment(double amount) { this.amount = amount; }
    double fee() { return 0; }
    String kind() { return "payment"; }
}
// TODO: Card, Transfer, Cash

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Payment[] all = new Payment[n];
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            double amount = in.nextDouble();
            // TODO
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

class Payment {
    final double amount;
    Payment(double amount) { this.amount = amount; }
    double fee() { return 0; }
    String kind() { return "payment"; }
}
class Card extends Payment {
    Card(double amount) { super(amount); }
    @Override double fee() { return amount * 0.02; }
    @Override String kind() { return "card"; }
}
class Transfer extends Payment {
    Transfer(double amount) { super(amount); }
    @Override double fee() { return amount < 100 ? 1.5 : 0; }
    @Override String kind() { return "transfer"; }
}
class Cash extends Payment {
    Cash(double amount) { super(amount); }
    @Override String kind() { return "cash"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Payment[] all = new Payment[n];
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            double amount = in.nextDouble();
            all[i] = switch (kind) {
                case "card" -> new Card(amount);
                case "transfer" -> new Transfer(amount);
                default -> new Cash(amount);
            };
        }
        double total = 0;
        int cards = 0;
        for (Payment p : all) {
            total += p.fee();
            if (p instanceof Card) cards++;
            System.out.println(String.format(Locale.ROOT, "%s %.2f fee %.2f", p.kind(), p.amount, p.fee()));
        }
        System.out.println(String.format(Locale.ROOT, "total fees %.2f", total));
        System.out.println("cards=" + cards);
    }
}
`,
      hints: ["The loop only knows Payment; each element's own fee() runs anyway.", "instanceof asks about the runtime class — the one place the loop needs to know."],
      cases: [
        { stdin: "3\ncard 50\ntransfer 80\ncash 20\n", expected: "card 50.00 fee 1.00\ntransfer 80.00 fee 1.50\ncash 20.00 fee 0.00\ntotal fees 2.50\ncards=1\n" },
        { stdin: "2\ntransfer 100\ncard 0\n", expected: "transfer 100.00 fee 0.00\ncard 0.00 fee 0.00\ntotal fees 0.00\ncards=1\n" },
        { stdin: "3\ncard 100\ncard 250\ntransfer 99.99\n", expected: "card 100.00 fee 2.00\ncard 250.00 fee 5.00\ntransfer 99.99 fee 1.50\ntotal fees 8.50\ncards=2\n", hidden: true },
      ],
    },
  ],
  "the-object-class": [
    {
      title: "Money as a map key",
      prompt: `Write a final \`class Money\` with \`long cents\` and \`String currency\`, a correct \`equals(Object)\`, a consistent \`hashCode\` and a \`toString\` like \`12.50 USD\`. Read an integer \`n\` and \`n\` lines \`<cents> <currency>\`. Count each distinct amount with a \`HashMap<Money, Integer>\` and print \`<money> x<count>\` in first-seen order (use a \`LinkedHashMap\`), then \`distinct=<size>\`. Also print \`equal=<new Money(100,"USD").equals(new Money(100,"USD"))> sameHash=<their hash codes are equal>\`.

Example: \`3\` then \`1250 USD\`, \`1250 USD\`, \`1250 EUR\` →
\`\`\`
12.50 USD x2
12.50 EUR x1
distinct=2
equal=true sameHash=true
\`\`\``,
      starter: String.raw`import java.util.*;

final class Money {
    final long cents;
    final String currency;
    Money(long cents, String currency) { this.cents = cents; this.currency = currency; }
    // TODO: equals, hashCode, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<Money, Integer> counts = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            // TODO
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

final class Money {
    final long cents;
    final String currency;
    Money(long cents, String currency) { this.cents = cents; this.currency = currency; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        Money m = (Money) o;
        return cents == m.cents && currency.equals(m.currency);
    }
    @Override public int hashCode() { return Objects.hash(cents, currency); }
    @Override public String toString() { return String.format(Locale.ROOT, "%d.%02d %s", cents / 100, cents % 100, currency); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<Money, Integer> counts = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            Money m = new Money(in.nextLong(), in.next());
            counts.merge(m, 1, Integer::sum);
        }
        counts.forEach((m, c) -> System.out.println(m + " x" + c));
        System.out.println("distinct=" + counts.size());
        Money a = new Money(100, "USD"), b = new Money(100, "USD");
        System.out.println("equal=" + a.equals(b) + " sameHash=" + (a.hashCode() == b.hashCode()));
    }
}
`,
      hints: ["Without hashCode, two equal Money objects land in different buckets and the map counts them separately.", "Objects.hash(cents, currency) combines the fields consistently with equals."],
      cases: [
        { stdin: "3\n1250 USD\n1250 USD\n1250 EUR\n", expected: "12.50 USD x2\n12.50 EUR x1\ndistinct=2\nequal=true sameHash=true\n" },
        { stdin: "1\n5 GBP\n", expected: "0.05 GBP x1\ndistinct=1\nequal=true sameHash=true\n" },
        { stdin: "4\n100 USD\n100 usd\n100 USD\n10000 USD\n", expected: "1.00 USD x2\n1.00 usd x1\n100.00 USD x1\ndistinct=3\nequal=true sameHash=true\n", hidden: true },
      ],
    },
  ],
  "abstract-classes": [
    {
      title: "A template for reports",
      prompt: `Write \`abstract class Shape\` with a final template method \`String describe()\` that returns \`<name()>: area=<area() to two decimals>, perimeter=<perimeter() to two decimals>\`, calling three abstract methods \`name()\`, \`area()\` and \`perimeter()\`. Implement \`Circle(r)\`, \`Square(s)\` and \`Rect(w, h)\`. Read \`n\` shape lines (\`circle r\`, \`square s\`, \`rect w h\`) and print \`describe()\` for each, then \`largest=<name of the largest area>\`.

Example: \`2\` then \`circle 1\`, \`square 2\` →
\`\`\`
circle: area=3.14, perimeter=6.28
square: area=4.00, perimeter=8.00
largest=square
\`\`\``,
      starter: String.raw`import java.util.*;

abstract class Shape {
    // TODO: abstract name(), area(), perimeter(); final describe()
}
// TODO: Circle, Square, Rect

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

abstract class Shape {
    abstract String name();
    abstract double area();
    abstract double perimeter();
    final String describe() {
        return String.format(Locale.ROOT, "%s: area=%.2f, perimeter=%.2f", name(), area(), perimeter());
    }
}
class Circle extends Shape {
    final double r;
    Circle(double r) { this.r = r; }
    String name() { return "circle"; }
    double area() { return Math.PI * r * r; }
    double perimeter() { return 2 * Math.PI * r; }
}
class Square extends Shape {
    final double s;
    Square(double s) { this.s = s; }
    String name() { return "square"; }
    double area() { return s * s; }
    double perimeter() { return 4 * s; }
}
class Rect extends Shape {
    final double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    String name() { return "rect"; }
    double area() { return w * h; }
    double perimeter() { return 2 * (w + h); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Shape largest = null;
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            Shape s = switch (kind) {
                case "circle" -> new Circle(in.nextDouble());
                case "square" -> new Square(in.nextDouble());
                default -> new Rect(in.nextDouble(), in.nextDouble());
            };
            System.out.println(s.describe());
            if (largest == null || s.area() > largest.area()) largest = s;
        }
        System.out.println("largest=" + (largest == null ? "none" : largest.name()));
    }
}
`,
      hints: ["The template method is final: the algorithm is fixed, the steps are abstract.", "Subclasses implement only the three steps; they never touch describe()."],
      cases: [
        { stdin: "2\ncircle 1\nsquare 2\n", expected: "circle: area=3.14, perimeter=6.28\nsquare: area=4.00, perimeter=8.00\nlargest=square\n" },
        { stdin: "1\nrect 2 3.5\n", expected: "rect: area=7.00, perimeter=11.00\nlargest=rect\n" },
        { stdin: "3\nsquare 1\nrect 1 1\ncircle 0.5\n", expected: "square: area=1.00, perimeter=4.00\nrect: area=1.00, perimeter=4.00\ncircle: area=0.79, perimeter=3.14\nlargest=square\n", hidden: true },
      ],
    },
  ],
  "composition-vs-inheritance": [
    {
      title: "A stack that wraps a list",
      prompt: `Do **not** extend \`ArrayList\`. Write \`class Stack<T>\` that holds a private \`ArrayList<T>\` and exposes only \`push\`, \`pop\` (returns \`null\` when empty), \`peek\` (\`null\` when empty), \`size\` and \`isEmpty\`. Read an integer \`n\` and \`n\` commands \`push <word>\`, \`pop\`, \`peek\`, \`size\`; print the result of every command except \`push\` (\`empty\` for a null). The point: a client can never call \`get(0)\` or \`add(0, x)\` on your stack, which \`extends ArrayList\` would have allowed.

Example: \`5\` then \`push a\`, \`push b\`, \`peek\`, \`pop\`, \`size\` →
\`\`\`
b
b
1
\`\`\``,
      starter: String.raw`import java.util.*;

class Stack<T> {
    private final ArrayList<T> items = new ArrayList<>();
    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Stack<String> s = new Stack<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class Stack<T> {
    private final ArrayList<T> items = new ArrayList<>();
    void push(T x) { items.add(x); }
    T pop() { return items.isEmpty() ? null : items.remove(items.size() - 1); }
    T peek() { return items.isEmpty() ? null : items.get(items.size() - 1); }
    int size() { return items.size(); }
    boolean isEmpty() { return items.isEmpty(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Stack<String> s = new Stack<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "push" -> s.push(in.next());
                case "pop" -> { String v = s.pop(); System.out.println(v == null ? "empty" : v); }
                case "peek" -> { String v = s.peek(); System.out.println(v == null ? "empty" : v); }
                default -> System.out.println(s.size());
            }
        }
    }
}
`,
      hints: ["Composition: the list is a private field; the stack decides which operations exist.", "The end of the list is the top — add and remove there are O(1)."],
      cases: [
        { stdin: "5\npush a\npush b\npeek\npop\nsize\n", expected: "b\nb\n1\n" },
        { stdin: "3\npop\npeek\nsize\n", expected: "empty\nempty\n0\n" },
        { stdin: "4\npush x\npop\npop\nsize\n", expected: "x\nempty\n0\n", hidden: true },
      ],
    },
  ],
  "inheritance-checkpoint": [
    {
      title: "Payroll hierarchy",
      prompt: `Write \`abstract class Employee\` (\`name\`, abstract \`double pay()\`, \`String kind()\`) with \`Salaried(name, annual)\` paying \`annual / 12\`, \`Hourly(name, rate, hours)\` paying \`rate × hours\` with hours over 160 at 1.5×, and \`Commissioned(name, base, sales)\` paying \`base + 5% of sales\`. Read \`n\` lines, sort the employees by pay **descending** (ties by name), print \`<name> (<kind>) <pay to two decimals>\` per line, then \`payroll <total>\`.

Example: \`3\` then \`salaried ann 60000\`, \`hourly bob 20 170\`, \`commissioned cy 1000 50000\` →
\`\`\`
ann (salaried) 5000.00
bob (hourly) 3500.00
cy (commissioned) 3500.00
payroll 12000.00
\`\`\``,
      starter: String.raw`import java.util.*;

abstract class Employee {
    final String name;
    Employee(String name) { this.name = name; }
    abstract double pay();
    abstract String kind();
}
// TODO: Salaried, Hourly, Commissioned

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> staff = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            // TODO
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

abstract class Employee {
    final String name;
    Employee(String name) { this.name = name; }
    abstract double pay();
    abstract String kind();
}
class Salaried extends Employee {
    final double annual;
    Salaried(String name, double annual) { super(name); this.annual = annual; }
    double pay() { return annual / 12; }
    String kind() { return "salaried"; }
}
class Hourly extends Employee {
    final double rate, hours;
    Hourly(String name, double rate, double hours) { super(name); this.rate = rate; this.hours = hours; }
    double pay() { return hours <= 160 ? rate * hours : rate * 160 + rate * 1.5 * (hours - 160); }
    String kind() { return "hourly"; }
}
class Commissioned extends Employee {
    final double base, sales;
    Commissioned(String name, double base, double sales) { super(name); this.base = base; this.sales = sales; }
    double pay() { return base + 0.05 * sales; }
    String kind() { return "commissioned"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> staff = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String kind = in.next();
            staff.add(switch (kind) {
                case "salaried" -> new Salaried(in.next(), in.nextDouble());
                case "hourly" -> new Hourly(in.next(), in.nextDouble(), in.nextDouble());
                default -> new Commissioned(in.next(), in.nextDouble(), in.nextDouble());
            });
        }
        staff.sort(Comparator.comparingDouble(Employee::pay).reversed().thenComparing(e -> e.name));
        double total = 0;
        for (Employee e : staff) {
            total += e.pay();
            System.out.println(String.format(Locale.ROOT, "%s (%s) %.2f", e.name, e.kind(), e.pay()));
        }
        System.out.println(String.format(Locale.ROOT, "payroll %.2f", total));
    }
}
`,
      hints: ["Each subclass owns its pay rule; the list only ever calls pay().", "Comparator.comparingDouble(...).reversed().thenComparing(name) — the type witness may be needed on the lambda."],
      cases: [
        { stdin: "3\nsalaried ann 60000\nhourly bob 20 170\ncommissioned cy 1000 50000\n", expected: "ann (salaried) 5000.00\nbob (hourly) 3500.00\ncy (commissioned) 3500.00\npayroll 12000.00\n" },
        { stdin: "1\nhourly zed 10 100\n", expected: "zed (hourly) 1000.00\npayroll 1000.00\n" },
        { stdin: "3\nhourly a 10 160\nhourly b 10 161\ncommissioned c 1500 2000\n", expected: "b (hourly) 1615.00\na (hourly) 1600.00\nc (commissioned) 1600.00\npayroll 4815.00\n", hidden: true },
      ],
    },
  ],
};

export default more;

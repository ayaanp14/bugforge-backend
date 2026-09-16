import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "nested-lambdas",
  title: "Nested classes & lambdas",
  blurb: "Static nested and inner classes, local and anonymous classes, lambda expressions, method references, and functions as values.",
  icon: "lambda",
  overview: `Java has four kinds of nested class and, since Java 8, lambda expressions — five ways to put a piece of behaviour exactly where it is needed. Each has precise rules about what it can see (captured variables, the enclosing instance, this) and each is the right tool for a different job.

This module covers static nested versus inner classes and the hidden outer reference that leaks memory; local and anonymous classes and the effectively-final rule; lambda syntax, target typing, captures and this; the four kinds of method reference; and the techniques functions-as-values make possible — composition, closure factories, strategy maps, callbacks and lazy suppliers.

By the end you choose the right nested form automatically, write and read lambdas and method references fluently, and use functions as first-class building blocks.`,
  lessons: [
    {
      slug: "nested-and-inner-classes",
      file: "01-nested-and-inner-classes.md",
      exercises: [
        {
          title: "A list with an inner iterator",
          prompt: `Write \`class IntList\` backed by a growing \`int[]\` with \`add(int)\` and \`size()\`, a **static nested** class \`Stats\` (fields \`min\`, \`max\`, \`sum\`; a \`toString\` of \`min=<m> max=<M> sum=<s>\`) returned by \`stats()\`, and an **inner** class \`Cursor\` (created by \`cursor()\`) with \`hasNext()\`/\`next()\` that walks the list reading the outer object's array and size directly.

Read an integer \`n\` and \`n\` integers, add them, print the elements via a \`Cursor\` space-separated, then print \`stats()\`. For an empty list print an empty line and \`min=0 max=0 sum=0\`.

Example: \`3\` then \`4 -2 9\` →
\`\`\`
4 -2 9
min=-2 max=9 sum=11
\`\`\``,
          starter: String.raw`import java.util.*;

class IntList {
    private int[] items = new int[4];
    private int size = 0;

    static class Stats {
        // TODO: min, max, sum, constructor, toString
    }

    class Cursor {
        // TODO: index; hasNext(); next() reading items/size of the enclosing list
    }

    void add(int v) { /* TODO grow with Arrays.copyOf */ }
    int size() { return size; }
    Cursor cursor() { return new Cursor(); }
    Stats stats() { /* TODO */ return null; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntList list = new IntList();
        for (int i = 0; i < n; i++) list.add(in.nextInt());
        // TODO: walk with a Cursor, then print stats
    }
}
`,
          solution: String.raw`import java.util.*;

class IntList {
    private int[] items = new int[4];
    private int size = 0;

    static class Stats {
        final long min, max, sum;
        Stats(long min, long max, long sum) { this.min = min; this.max = max; this.sum = sum; }
        @Override public String toString() { return "min=" + min + " max=" + max + " sum=" + sum; }
    }

    class Cursor {
        private int index = 0;
        boolean hasNext() { return index < size; }
        int next() { return items[index++]; }
    }

    void add(int v) {
        if (size == items.length) items = Arrays.copyOf(items, size * 2);
        items[size++] = v;
    }

    int size() { return size; }
    Cursor cursor() { return new Cursor(); }

    Stats stats() {
        if (size == 0) return new Stats(0, 0, 0);
        long min = items[0], max = items[0], sum = 0;
        for (int i = 0; i < size; i++) {
            min = Math.min(min, items[i]);
            max = Math.max(max, items[i]);
            sum += items[i];
        }
        return new Stats(min, max, sum);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntList list = new IntList();
        for (int i = 0; i < n; i++) list.add(in.nextInt());
        StringBuilder sb = new StringBuilder();
        IntList.Cursor c = list.cursor();
        while (c.hasNext()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(c.next());
        }
        System.out.println(sb);
        System.out.println(list.stats());
    }
}
`,
          hints: ["Cursor is inner: it reads items and size through the hidden IntList.this.", "Stats needs nothing from the list instance, so it is static nested."],
          cases: [
            { stdin: "3\n4 -2 9\n", expected: "4 -2 9\nmin=-2 max=9 sum=11\n" },
            { stdin: "0\n", expected: "\nmin=0 max=0 sum=0\n" },
            { stdin: "6\n1 1 1 1 1 1\n", expected: "1 1 1 1 1 1\nmin=1 max=1 sum=6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An inner (non-static nested) class instance holds…",
          options: ["Nothing special", "A hidden reference to the enclosing instance (`Outer.this`)", "A copy of the outer's fields", "A static reference to the outer class"],
          answer: 1,
          explanation: "That reference is how it reads outer fields directly — and why it keeps the outer object alive.",
        },
        {
          prompt: "Which nested class should be your default?",
          options: ["Inner", "Static nested — unless the enclosing instance is genuinely needed", "Anonymous", "Local"],
          answer: 1,
          explanation: "A static nested class has no hidden field, no lifetime dependency and can be created without an outer instance.",
        },
        {
          prompt: "How do you instantiate an inner class from outside the outer class?",
          options: ["`new Outer.Inner()`", "`outer.new Inner()`", "`Outer.Inner.create()`", "It is impossible"],
          answer: 1,
          explanation: "The outer instance must be supplied; the syntax is `outerInstance.new Inner()`.",
        },
        {
          prompt: "Nested interfaces, enums and records are…",
          options: ["Inner", "Implicitly static", "Not allowed", "Private by default"],
          answer: 1,
          explanation: "They never carry an enclosing instance.",
        },
        {
          prompt: "Inside an inner class, `Outer.this.x` refers to…",
          options: ["The inner class's field `x`", "The enclosing instance's field `x`", "A static field", "A compile error"],
          answer: 1,
          explanation: "Qualified `this` reaches outer levels when names shadow.",
        },
      ],
    },
    {
      slug: "local-and-anonymous-classes",
      file: "02-local-and-anonymous-classes.md",
      exercises: [
        {
          title: "An anonymous comparator and a counting iterator",
          prompt: `Read an integer \`n\` and \`n\` words. Sort them with an **anonymous** \`Comparator<String>\` by length ascending, then alphabetically, and print them space-separated. Then build an anonymous \`Iterator<String>\` over the sorted list that yields only words longer than \`k\` (read \`k\` after the words) and print those, space-separated (empty line if none), followed by \`count=<how many>\` — count them with an \`int[] counter = {0}\` captured by the iterator.

Example: \`4\` then \`pear fig apple kiwi\`, \`k = 3\` →
\`\`\`
fig kiwi pear apple
kiwi pear apple
count=3
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        int k = in.nextInt();

        // TODO: sort with an anonymous Comparator
        // TODO: anonymous Iterator<String> skipping words with length <= k, counting via int[] counter
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
        int k = in.nextInt();

        words.sort(new Comparator<String>() {
            @Override
            public int compare(String a, String b) {
                int c = Integer.compare(a.length(), b.length());
                return c != 0 ? c : a.compareTo(b);
            }
        });
        System.out.println(String.join(" ", words));

        int[] counter = {0};
        Iterator<String> longOnes = new Iterator<String>() {
            private int i = 0;
            private void skip() { while (i < words.size() && words.get(i).length() <= k) i++; }
            @Override public boolean hasNext() { skip(); return i < words.size(); }
            @Override public String next() {
                skip();
                if (i >= words.size()) throw new NoSuchElementException();
                counter[0]++;
                return words.get(i++);
            }
        };
        StringBuilder sb = new StringBuilder();
        while (longOnes.hasNext()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(longOnes.next());
        }
        System.out.println(sb);
        System.out.println("count=" + counter[0]);
    }
}
`,
          hints: ["Anonymous classes may declare fields (the index) and helper methods (skip).", "counter is effectively final; its contents are mutable."],
          cases: [
            { stdin: "4\npear fig apple kiwi\n3\n", expected: "fig kiwi pear apple\nkiwi pear apple\ncount=3\n" },
            { stdin: "3\na bb cc\n5\n", expected: "a bb cc\n\ncount=0\n" },
            { stdin: "2\nzz aa\n1\n", expected: "aa zz\naa zz\ncount=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An anonymous class cannot declare…",
          options: ["Fields", "Methods beyond the interface's", "A constructor", "An instance initialiser block"],
          answer: 2,
          explanation: "It has no name to give a constructor; use an initialiser block or superclass constructor arguments.",
        },
        {
          prompt: "`int count = 0; Runnable r = new Runnable() { public void run() { count++; } };` fails because…",
          options: ["`count` is not a field", "Captured locals must be effectively final — they are copied into the instance", "`Runnable` cannot capture", "`count++` is not a statement"],
          answer: 1,
          explanation: "The object may outlive the method's frame; Java copies the value, so it forbids later changes.",
        },
        {
          prompt: "Inside an anonymous class body, `this` refers to…",
          options: ["The enclosing instance", "The anonymous object itself", "The interface", "null"],
          answer: 1,
          explanation: "Unlike a lambda. Use `Outer.this` for the enclosing instance.",
        },
        {
          prompt: "When is an anonymous class required instead of a lambda?",
          options: ["Never", "When the type has several abstract methods, is a class, or the object needs its own state or `this`", "Only for `Runnable`", "When the body is long"],
          answer: 1,
          explanation: "Lambdas implement one interface method and have no fields; anonymous classes are full classes.",
        },
        {
          prompt: "A local class declared inside an instance method…",
          options: ["Cannot use the enclosing object's fields", "Is an inner class with access to `Outer.this` and effectively-final locals", "Must be static", "Is visible to the whole class"],
          answer: 1,
          explanation: "It is scoped to the block, inner if the method is an instance method, and captures locals by copy.",
        },
      ],
    },
    {
      slug: "lambdas",
      file: "03-lambdas.md",
      exercises: [
        {
          title: "Lambdas in four shapes",
          prompt: `Read an integer \`n\` and \`n\` integers. Using **lambdas** assigned to typed variables, build: a \`Predicate<Integer>\` for \`even\`, a \`Function<Integer, Integer>\` \`square\`, a \`BinaryOperator<Integer>\` \`max\`, and a \`Supplier<String>\` that returns \`"n=" + n\` (capturing \`n\`). Print four lines: \`evens=<count of evens>\`, \`squares=<sum of squares as long>\`, \`max=<max via the operator, or "none" if n is 0>\`, and the supplier's value.

Example: \`3\` then \`2 3 4\` →
\`\`\`
evens=2
squares=29
max=4
n=3
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();

        Predicate<Integer> even = null;          // TODO
        Function<Integer, Integer> square = null; // TODO
        BinaryOperator<Integer> max = null;       // TODO
        Supplier<String> label = null;            // TODO

        // TODO: apply them and print
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();

        Predicate<Integer> even = x -> x % 2 == 0;
        Function<Integer, Integer> square = x -> x * x;
        BinaryOperator<Integer> max = (x, y) -> x > y ? x : y;
        Supplier<String> label = () -> "n=" + n;

        int evens = 0;
        long squares = 0;
        Integer best = null;
        for (int v : a) {
            if (even.test(v)) evens++;
            squares += square.apply(v);
            best = best == null ? v : max.apply(best, v);
        }
        System.out.println("evens=" + evens);
        System.out.println("squares=" + squares);
        System.out.println("max=" + (best == null ? "none" : best));
        System.out.println(label.get());
    }
}
`,
          hints: ["The target type decides each lambda's shape: one parameter for Predicate/Function, two for BinaryOperator, none for Supplier.", "n is effectively final, so the supplier may capture it."],
          cases: [
            { stdin: "3\n2 3 4\n", expected: "evens=2\nsquares=29\nmax=4\nn=3\n" },
            { stdin: "0\n", expected: "evens=0\nsquares=0\nmax=none\nn=0\n" },
            { stdin: "2\n-5 -6\n", expected: "evens=1\nsquares=61\nmax=-5\nn=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A lambda's type is determined by…",
          options: ["Its parameter names", "The target functional interface of the context it appears in", "Its return statement", "The JVM at run time"],
          answer: 1,
          explanation: "The same lambda text can be a `Predicate`, a `Function` or a `Callable` depending on where it is assigned or passed.",
        },
        {
          prompt: "Inside a lambda, `this` refers to…",
          options: ["The lambda object", "The enclosing instance", "The functional interface", "Nothing — it is an error"],
          answer: 1,
          explanation: "A lambda introduces no new `this`; it is lexically part of the enclosing method.",
        },
        {
          prompt: "`Object o = () -> {};` is…",
          options: ["Valid", "A compile error — `Object` is not a functional interface", "A `Runnable`", "Valid with a warning"],
          answer: 1,
          explanation: "The target type must be a functional interface; cast to `Runnable` to supply one.",
        },
        {
          prompt: "A lambda that calls a method throwing `IOException`, targeting `Function`, must…",
          options: ["Declare `throws`", "Catch the exception inside (or wrap it as unchecked)", "Use `Callable` only", "Nothing — it compiles"],
          answer: 1,
          explanation: "`Function.apply` declares no checked exceptions, so the body cannot let one escape.",
        },
        {
          prompt: "Non-capturing lambdas compile to…",
          options: ["One anonymous class file each", "An `invokedynamic` site whose instance is typically shared across evaluations", "A static method only", "Reflection calls"],
          answer: 1,
          explanation: "`LambdaMetafactory` spins a class at first use; without captured state, one instance can be reused.",
        },
      ],
    },
    {
      slug: "method-references",
      file: "04-method-references.md",
      exercises: [
        {
          title: "Four references",
          prompt: `Read an integer \`n\` and \`n\` words. Using **method references** wherever a lambda would only forward its arguments: parse a list of lengths with \`String::length\` (unbound), a \`Comparator<String>\` from \`String::compareToIgnoreCase\` (unbound, two args), an uppercase transform with \`String::toUpperCase\`, a \`Supplier<List<String>>\` from \`ArrayList::new\` (constructor), and print each result line with a bound \`System.out::println\` through \`forEach\`.

Output, in order: the lengths space-separated, the words sorted case-insensitively space-separated, the words upper-cased space-separated, and \`copies=<size of a fresh list from the supplier after adding all words>\`.

Example: \`3\` then \`banana Apple cherry\` →
\`\`\`
6 5 6
Apple banana cherry
BANANA APPLE CHERRY
copies=3
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        Function<String, Integer> length = null;          // TODO String::length
        Comparator<String> ci = null;                     // TODO String::compareToIgnoreCase
        UnaryOperator<String> upper = null;               // TODO String::toUpperCase
        Supplier<List<String>> fresh = null;              // TODO ArrayList::new
        Consumer<String> out = null;                      // TODO System.out::println

        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        Function<String, Integer> length = String::length;
        Comparator<String> ci = String::compareToIgnoreCase;
        UnaryOperator<String> upper = String::toUpperCase;
        Supplier<List<String>> fresh = ArrayList::new;
        Consumer<String> out = System.out::println;

        List<String> lines = new ArrayList<>();
        lines.add(words.stream().map(length).map(String::valueOf).collect(Collectors.joining(" ")));
        List<String> sorted = new ArrayList<>(words);
        sorted.sort(ci);
        lines.add(String.join(" ", sorted));
        lines.add(words.stream().map(upper).collect(Collectors.joining(" ")));
        List<String> copy = fresh.get();
        copy.addAll(words);
        lines.add("copies=" + copy.size());
        lines.forEach(out);
    }
}
`,
          hints: ["String::compareToIgnoreCase as a Comparator makes the first argument the receiver.", "System.out::println is bound to the PrintStream held by System.out."],
          cases: [
            { stdin: "3\nbanana Apple cherry\n", expected: "6 5 6\nApple banana cherry\nBANANA APPLE CHERRY\ncopies=3\n" },
            { stdin: "1\nz\n", expected: "1\nz\nZ\ncopies=1\n" },
            { stdin: "2\nb A\n", expected: "1 1\nA b\nB A\ncopies=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`String::length` used as a `Function<String, Integer>` is which kind of reference?",
          options: ["Static", "Bound instance", "Unbound instance — the argument becomes the receiver", "Constructor"],
          answer: 2,
          explanation: "`Class::instanceMethod` takes the receiver as the first parameter: `s -> s.length()`.",
        },
        {
          prompt: "`prefix::startsWith` (where `prefix` is a `String` variable) as a `Predicate<String>` means…",
          options: ["`s -> s.startsWith(prefix)`", "`s -> prefix.startsWith(s)` — bound: the receiver is `prefix`", "A compile error", "A static call"],
          answer: 1,
          explanation: "A bound reference captures the object now and passes the argument to its method — often the reverse of what was intended.",
        },
        {
          prompt: "`ArrayList::new` targeting `Supplier<List<String>>` is…",
          options: ["Invalid", "A constructor reference equivalent to `() -> new ArrayList<>()`", "A static method call", "Bound to an existing list"],
          answer: 1,
          explanation: "The target's parameter list (none) selects the no-arg constructor.",
        },
        {
          prompt: "`int[]::new` as a `Function<Integer, int[]>` produces…",
          options: ["An empty array", "`n -> new int[n]`", "A compile error", "A shared array"],
          answer: 1,
          explanation: "Array constructor references take the length; `toArray(String[]::new)` is the common use.",
        },
        {
          prompt: "A method reference is ambiguous when…",
          options: ["The method is static", "Several overloads match the target interface's parameter types", "It is bound", "It has no parameters"],
          answer: 1,
          explanation: "The compiler then asks for a lambda with explicit parameter types.",
        },
      ],
    },
    {
      slug: "functions-as-values",
      file: "05-functions-as-values.md",
      exercises: [
        {
          title: "Build a text pipeline",
          prompt: `Read a first line containing step names separated by spaces, chosen from \`trim\`, \`lower\`, \`upper\`, \`snake\` (spaces → underscores) and \`reverse\`; then an integer \`n\` and \`n\` lines of text. Build the pipeline **once** as a single \`Function<String, String>\` by folding the steps with \`andThen\` (start from \`Function.identity()\`), then apply it to each line and print the result. Also write a factory \`static Function<String, String> step(String name)\` returning the lambda for a step name (throw \`IllegalArgumentException\` for an unknown name).

Example: steps \`trim lower snake\`, then \`2\` lines \`  Hello World \` and \`Java Rocks\` →
\`\`\`
hello_world
java_rocks
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static Function<String, String> step(String name) {
        // TODO: switch on name, return a lambda or method reference
        return null;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String[] names = in.nextLine().trim().split("\\s+");
        Function<String, String> pipeline = Function.identity();
        // TODO: fold the steps with andThen
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            System.out.println(pipeline.apply(in.nextLine()));
        }
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static Function<String, String> step(String name) {
        return switch (name) {
            case "trim" -> String::trim;
            case "lower" -> String::toLowerCase;
            case "upper" -> String::toUpperCase;
            case "snake" -> s -> s.replace(' ', '_');
            case "reverse" -> s -> new StringBuilder(s).reverse().toString();
            default -> throw new IllegalArgumentException(name);
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String[] names = in.nextLine().trim().split("\\s+");
        Function<String, String> pipeline = Function.identity();
        for (String name : names) pipeline = pipeline.andThen(step(name));
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            System.out.println(pipeline.apply(in.nextLine()));
        }
    }
}
`,
          hints: ["andThen applies the left function first — fold in the given order.", "A method reference is fine where the step is one call; a lambda where it is more."],
          cases: [
            { stdin: "trim lower snake\n2\n  Hello World \nJava Rocks\n", expected: "hello_world\njava_rocks\n" },
            { stdin: "reverse upper\n1\nabc\n", expected: "CBA\n" },
            { stdin: "snake reverse trim\n1\n a b \n", expected: "_b_a_\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A method that returns `s -> s.startsWith(prefix)` given a `prefix` parameter returns…",
          options: ["A string", "A closure that captured `prefix`", "A compile error", "A static method"],
          answer: 1,
          explanation: "The lambda remembers the argument it was built with — a closure factory.",
        },
        {
          prompt: "`f.andThen(g).apply(x)` computes…",
          options: ["`f(g(x))`", "`g(f(x))`", "`f(x) + g(x)`", "`g(x)` only"],
          answer: 1,
          explanation: "`andThen` runs the receiver first; `compose` is the reverse.",
        },
        {
          prompt: "Implementing the strategy pattern with a `Map<String, BinaryOperator<Long>>`…",
          options: ["Loses type safety", "Replaces one-class-per-strategy with lambdas while keeping strategies swappable", "Requires reflection", "Is slower than classes"],
          answer: 1,
          explanation: "The interface stays; the implementations become values. Use classes again when a strategy has state.",
        },
        {
          prompt: "Why prefer `optional.orElseGet(this::compute)` to `orElse(compute())`?",
          options: ["Shorter", "The supplier runs only when the optional is empty", "It handles null", "No difference"],
          answer: 1,
          explanation: "`orElse` evaluates its argument eagerly, every time.",
        },
        {
          prompt: "A lambda in a stream that increments a captured `int[] counter`…",
          options: ["Is idiomatic", "Compiles but signals the stream is the wrong tool — stream lambdas should be stateless", "Is a compile error", "Runs in parallel safely"],
          answer: 1,
          explanation: "Mutable captured state breaks parallel streams and readability; use `count()` or a reduction instead.",
        },
      ],
    },
    {
      slug: "nested-lambdas-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Event bus with lambdas",
          prompt: `Write \`class EventBus\` with \`subscribe(String topic, Consumer<String> handler)\` and \`publish(String topic, String payload)\` (calls every handler of that topic in subscription order; unknown topics are ignored). Handlers are kept in a \`Map<String, List<Consumer<String>>>\` built with \`computeIfAbsent\`.

Read an integer \`n\` and \`n\` commands: \`sub <topic> <tag>\` registers a lambda that prints \`<tag>:<payload>\`; \`pub <topic> <payload>\` publishes. Also count all deliveries in a field and print \`deliveries=<count>\` at the end.

Example: \`4\` then \`sub news a\`, \`sub news b\`, \`pub news hello\`, \`pub sports x\` →
\`\`\`
a:hello
b:hello
deliveries=2
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

class EventBus {
    private final Map<String, List<Consumer<String>>> handlers = new HashMap<>();
    private int deliveries = 0;

    // TODO: subscribe, publish, deliveries()
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        EventBus bus = new EventBus();
        for (int i = 0; i < n; i++) {
            String cmd = in.next(), topic = in.next(), arg = in.next();
            // TODO
        }
        System.out.println("deliveries=" + bus.deliveries());
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

class EventBus {
    private final Map<String, List<Consumer<String>>> handlers = new HashMap<>();
    private int deliveries = 0;

    void subscribe(String topic, Consumer<String> handler) {
        handlers.computeIfAbsent(topic, k -> new ArrayList<>()).add(handler);
    }

    void publish(String topic, String payload) {
        for (Consumer<String> h : handlers.getOrDefault(topic, List.of())) {
            h.accept(payload);
            deliveries++;
        }
    }

    int deliveries() { return deliveries; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        EventBus bus = new EventBus();
        for (int i = 0; i < n; i++) {
            String cmd = in.next(), topic = in.next(), arg = in.next();
            if (cmd.equals("sub")) {
                String tag = arg;
                bus.subscribe(topic, payload -> System.out.println(tag + ":" + payload));
            } else {
                bus.publish(topic, arg);
            }
        }
        System.out.println("deliveries=" + bus.deliveries());
    }
}
`,
          hints: ["Copy arg into a fresh local (tag) so the lambda captures an effectively-final variable per iteration.", "computeIfAbsent creates the list on first subscription."],
          cases: [
            { stdin: "4\nsub news a\nsub news b\npub news hello\npub sports x\n", expected: "a:hello\nb:hello\ndeliveries=2\n" },
            { stdin: "3\npub t x\nsub t z\npub t y\n", expected: "z:y\ndeliveries=1\n" },
            { stdin: "2\nsub a q\nsub b r\n", expected: "deliveries=0\n", hidden: true },
          ],
        },
        {
          title: "Memoised function factory",
          prompt: `Write \`static <T, R> Function<T, R> memoize(Function<T, R> f)\` that returns a function which caches results in a \`HashMap<T, R>\` (using \`computeIfAbsent\`) and counts cache misses in a captured \`int[]\` exposed through a second static method — simplest: make \`memoize\` return a small class or record holding both the function and a \`misses()\` supplier. Then wrap a slow \`Function<Integer, Long>\` computing \`n * n\` (and incrementing nothing else).

Read an integer \`n\` and \`n\` integers; apply the memoised function to each and print the results space-separated, then \`misses=<distinct inputs>\`.

Example: \`5\` then \`3 4 3 3 5\` →
\`\`\`
9 16 9 9 25
misses=3
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    record Memo<T, R>(Function<T, R> fn, IntSupplier misses) { }

    static <T, R> Memo<T, R> memoize(Function<T, R> f) {
        // TODO: HashMap cache, int[] misses, return new Memo<>(...)
        return null;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Memo<Integer, Long> square = memoize(x -> (long) x * x);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    record Memo<T, R>(Function<T, R> fn, IntSupplier misses) { }

    static <T, R> Memo<T, R> memoize(Function<T, R> f) {
        Map<T, R> cache = new HashMap<>();
        int[] misses = {0};
        Function<T, R> memo = x -> cache.computeIfAbsent(x, key -> {
            misses[0]++;
            return f.apply(key);
        });
        return new Memo<>(memo, () -> misses[0]);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Memo<Integer, Long> square = memoize(x -> (long) x * x);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(square.fn().apply(in.nextInt()));
        }
        System.out.println(sb);
        System.out.println("misses=" + square.misses().getAsInt());
    }
}
`,
          hints: ["The returned lambda captures the cache map and the counter array — both effectively final references.", "computeIfAbsent's mapping function runs only on a miss."],
          cases: [
            { stdin: "5\n3 4 3 3 5\n", expected: "9 16 9 9 25\nmisses=3\n" },
            { stdin: "1\n100000\n", expected: "10000000000\nmisses=1\n" },
            { stdin: "3\n7 7 7\n", expected: "49 49 49\nmisses=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A static nested class can access the outer class's…",
          options: ["Instance fields directly", "Static members, including private ones", "Nothing", "Only public members"],
          answer: 1,
          explanation: "Nesting grants private access in both directions, but without an instance there are no instance fields to reach.",
        },
        {
          prompt: "Storing inner-class listener objects in a long-lived list risks…",
          options: ["Nothing", "Keeping their enclosing instances alive — a memory leak", "Thread-safety issues only", "Compile errors"],
          answer: 1,
          explanation: "Each inner instance references `Outer.this`; the outer cannot be collected while the listener is reachable.",
        },
        {
          prompt: "A local class declared in a **static** method…",
          options: ["Has an enclosing instance", "Has no enclosing instance", "Cannot capture locals", "Is a compile error"],
          answer: 1,
          explanation: "Inner-ness depends on the enclosing context; static context means no `Outer.this`.",
        },
        {
          prompt: "Which lambda is invalid for `BiFunction<Integer, Integer, Integer>`?",
          options: ["`(a, b) -> a + b`", "`(Integer a, Integer b) -> a * b`", "`a -> a + 1`", "`(a, b) -> { return a - b; }`"],
          answer: 2,
          explanation: "The SAM takes two arguments; a one-parameter lambda does not fit.",
        },
        {
          prompt: "Lambda parameters…",
          options: ["May shadow enclosing locals", "May not have the same name as an enclosing local variable", "Must be typed", "Must be final"],
          answer: 1,
          explanation: "Unlike anonymous-class methods, a lambda body shares the enclosing scope and cannot redeclare its names.",
        },
        {
          prompt: "`System.out::println` captures…",
          options: ["Nothing", "The `PrintStream` object held by `System.out` at that moment", "The `System` class", "The string to print"],
          answer: 1,
          explanation: "It is a bound reference; if `System.setOut` changes the stream later, the reference still prints to the old one.",
        },
        {
          prompt: "`Comparator<String> c = String::compareTo;` — the reference kind is…",
          options: ["Static", "Bound", "Unbound: `(a, b) -> a.compareTo(b)`", "Constructor"],
          answer: 2,
          explanation: "Two target parameters, an instance method of one parameter: the first argument is the receiver.",
        },
        {
          prompt: "Which is the best refactoring for a 15-line lambda in a stream?",
          options: ["Leave it", "Extract it to a named method and use `this::method`", "Convert to an anonymous class", "Split into three lambdas inline"],
          answer: 1,
          explanation: "A named method documents intent and can be unit-tested.",
        },
        {
          prompt: "`Function<Integer, Function<Integer, Integer>> add = x -> y -> x + y;` — `add.apply(2).apply(3)` is…",
          options: ["A compile error", "5", "A function", "23"],
          answer: 1,
          explanation: "Currying: applying 2 returns a function that adds 2; applying that to 3 gives 5.",
        },
        {
          prompt: "`map.computeIfAbsent(key, k -> new ArrayList<>()).add(v)` replaces…",
          options: ["A `merge`", "The get-null-check-put-then-add sequence for a multimap", "A `remove`", "A sort"],
          answer: 1,
          explanation: "The mapping function runs only when the key is absent, and the (existing or new) value is returned.",
        },
        {
          prompt: "`Predicate.not(String::isBlank)` is equivalent to…",
          options: ["`String::isBlank`", "`s -> !s.isBlank()`", "`s -> s.isBlank()`", "A compile error"],
          answer: 1,
          explanation: "`Predicate.not` (Java 11) negates a predicate given as a method reference, which cannot itself carry a `!`.",
        },
        {
          prompt: "Checked exceptions inside a `Runnable` lambda…",
          options: ["Propagate automatically", "Must be caught in the body or wrapped, since `run()` declares none", "Are converted to `RuntimeException`", "Are ignored"],
          answer: 1,
          explanation: "The lambda may throw only what the functional interface's method declares.",
        },
      ],
    },
  ],
}, more);

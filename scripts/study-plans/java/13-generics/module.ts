import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "generics",
  title: "Generics",
  blurb: "Why generics exist, generic classes and methods, bounded types, wildcards and PECS, type erasure and its consequences, and the practical idioms.",
  icon: "generic",
  overview: `Generics are how Java's type system describes collections, functions and containers precisely: a list of strings, a function from T to R, a repository of entities. They were bolted onto a running language in 2004 through erasure, and that history explains both their power and every one of their sharp edges.

This module builds the model from the ground up: the problem generics solve and the vocabulary; writing generic classes, interfaces and methods and how inference works; bounded type parameters including the self-referential Comparable bound; wildcards, invariance and the PECS rule for flexible signatures; erasure and the full list of things it makes impossible, with bridge methods and heap pollution; and the everyday idioms and compiler messages.

By the end you read any JDK signature, write generic utilities with correct bounds and wildcards, and explain erasure and its consequences in an interview.`,
  lessons: [
    {
      slug: "why-generics",
      file: "01-why-generics.md",
      exercises: [
        {
          title: "Typed from the start",
          prompt: `Read an integer \`n\` and \`n\` tokens. Put the integers into a \`List<Integer>\` and everything else into a \`List<String>\` (a token is an integer if \`matches("-?\\\\d+")\`). Print \`ints=<sum of the integers>\` and \`words=<the strings joined by ,>\` (or \`words=\` when there are none), then a third line \`same class=<whether the two lists' getClass() are ==>\` to observe erasure.

Example: \`4\` then \`3 a 4 b\` →
\`\`\`
ints=7
words=a,b
same class=true
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        List<String> words = new ArrayList<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String t = in.next();
            if (t.matches("-?\\d+")) ints.add(Integer.parseInt(t));
            else words.add(t);
        }
        long sum = 0;
        for (int v : ints) sum += v;
        System.out.println("ints=" + sum);
        System.out.println("words=" + String.join(",", words));
        System.out.println("same class=" + (ints.getClass() == words.getClass()));
    }
}
`,
          hints: ["Two typed lists; the compiler checks every add.", "getClass() of both is ArrayList — the type arguments were erased."],
          cases: [
            { stdin: "4\n3 a 4 b\n", expected: "ints=7\nwords=a,b\nsame class=true\n" },
            { stdin: "2\n-1 -2\n", expected: "ints=-3\nwords=\nsame class=true\n" },
            { stdin: "1\nx\n", expected: "ints=0\nwords=x\nsame class=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `List<String>`, `String` is the…",
          options: ["Type parameter", "Type argument", "Raw type", "Bound"],
          answer: 1,
          explanation: "`E` in `List<E>` is the parameter; `String` is the argument supplied for it; `List<String>` is the parameterised type.",
        },
        {
          prompt: "`List<int>` fails because…",
          options: ["`int` is reserved", "Type arguments must be reference types; use `Integer`", "Lists cannot hold numbers", "It needs `<Int>`"],
          answer: 1,
          explanation: "Erasure turns type parameters into `Object`, which cannot hold a primitive. Autoboxing bridges the gap.",
        },
        {
          prompt: "Using a raw type such as `List` in new code…",
          options: ["Is recommended for speed", "Disables type checking and can pollute typed collections", "Is a compile error", "Makes the list immutable"],
          answer: 1,
          explanation: "Raw types exist for pre-generics code; the compiler warns because they let wrong-typed elements in.",
        },
        {
          prompt: "`new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()` is…",
          options: ["`false`", "`true` — erasure leaves one run-time class", "A compile error", "Undefined"],
          answer: 1,
          explanation: "Type arguments are compile-time only. There is no `ArrayList<String>` class at run time.",
        },
        {
          prompt: "`var m = new HashMap<>();` infers…",
          options: ["`HashMap<String, Object>`", "`HashMap<Object, Object>` — there is no target type to infer from", "A compile error", "`HashMap<?, ?>`"],
          answer: 1,
          explanation: "With `var`, put the type arguments on the right-hand side instead of the diamond.",
        },
      ],
    },
    {
      slug: "generic-classes-and-methods",
      file: "02-generic-classes-and-methods.md",
      exercises: [
        {
          title: "A generic stack and a generic helper",
          prompt: `Write \`class Stack<T>\` backed by an \`Object[]\` with \`push\`, \`pop\`, \`peek\` and \`isEmpty\` (one contained \`@SuppressWarnings("unchecked")\` cast). Write \`static <T> String describe(Stack<T> s, int take)\` that pops up to \`take\` elements and returns them joined by \`,\`.

Read an integer \`n\` and \`n\` tokens; push them onto a \`Stack<String>\`; then read \`k\` and print \`describe(stack, k)\`. Also push the integers 1..n onto a \`Stack<Integer>\` and print \`describe(ints, k)\` — the same generic method serving both.

Example: \`3\` then \`a b c\`, \`k = 2\` →
\`\`\`
c,b
3,2
\`\`\``,
          starter: String.raw`import java.util.*;

class Stack<T> {
    private Object[] items = new Object[4];
    private int size = 0;
    // TODO: push, pop, peek, isEmpty
}

public class Main {
    static <T> String describe(Stack<T> s, int take) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Stack<String> words = new Stack<>();
        Stack<Integer> ints = new Stack<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class Stack<T> {
    private Object[] items = new Object[4];
    private int size = 0;

    void push(T item) {
        if (size == items.length) items = Arrays.copyOf(items, size * 2);
        items[size++] = item;
    }

    @SuppressWarnings("unchecked")
    T pop() {
        if (size == 0) throw new NoSuchElementException();
        T item = (T) items[--size];     // safe: only push(T) stores here
        items[size] = null;
        return item;
    }

    @SuppressWarnings("unchecked")
    T peek() {
        if (size == 0) throw new NoSuchElementException();
        return (T) items[size - 1];
    }

    boolean isEmpty() { return size == 0; }
}

public class Main {
    static <T> String describe(Stack<T> s, int take) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < take && !s.isEmpty(); i++) {
            if (sb.length() > 0) sb.append(',');
            sb.append(s.pop());
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Stack<String> words = new Stack<>();
        Stack<Integer> ints = new Stack<>();
        for (int i = 0; i < n; i++) words.push(in.next());
        for (int i = 1; i <= n; i++) ints.push(i);
        int k = in.nextInt();
        System.out.println(describe(words, k));
        System.out.println(describe(ints, k));
    }
}
`,
          hints: ["new T[] is impossible; Object[] plus a cast on the way out is the ArrayList pattern.", "The generic method's T is inferred separately for each call."],
          cases: [
            { stdin: "3\na b c\n2\n", expected: "c,b\n3,2\n" },
            { stdin: "2\nx y\n5\n", expected: "y,x\n2,1\n" },
            { stdin: "1\nq\n1\n", expected: "q\n1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where is a generic method's type parameter declared?",
          options: ["After the method name", "Before the return type: `static <T> T f(...)`", "In the parameter list", "In the class header"],
          answer: 1,
          explanation: "The `<T>` before the return type introduces the parameter for that method only.",
        },
        {
          prompt: "Inside `class Box<T>`, `static T shared;` is…",
          options: ["Fine", "A compile error — the class's `T` cannot be used in a static context", "Allowed if final", "Allowed with a bound"],
          answer: 1,
          explanation: "One erased class serves every `T`; a static member cannot depend on a per-instantiation type.",
        },
        {
          prompt: "`public <T> void confuse(T x)` inside `class Box<T>` declares…",
          options: ["The same `T`", "A new, unrelated `T` that shadows the class parameter — a bug", "A compile error", "A bound on `T`"],
          answer: 1,
          explanation: "Use a fresh letter (`U`) for method-level parameters in generic classes.",
        },
        {
          prompt: "How does `ArrayList<E>` store its elements?",
          options: ["In an `E[]`", "In an `Object[]`, casting to `E` on the way out", "In a linked structure", "In a `List<Object>`"],
          answer: 1,
          explanation: "`new E[n]` is impossible under erasure; the cast is contained and safe because only `add(E)` writes.",
        },
        {
          prompt: "`List<String> xs = Collections.emptyList();` infers `T` from…",
          options: ["The method body", "The target type of the assignment", "A default of `Object`", "Nothing — it fails"],
          answer: 1,
          explanation: "Target typing lets generic methods with no arguments pick their type parameter from the assignment.",
        },
      ],
    },
    {
      slug: "bounded-types",
      file: "03-bounded-types.md",
      exercises: [
        {
          title: "Bounded utilities",
          prompt: `Write two bounded generic methods: \`static <T extends Comparable<T>> T max(List<T> xs)\` and \`static <T extends Number> double average(List<T> xs)\`. Read an integer \`n\`, \`n\` integers, then an integer \`m\` and \`m\` words. Print \`max int=<max>\`, \`avg=<average with 2 decimals>\`, \`max word=<max word by compareTo>\` — the same \`max\` serving \`Integer\` and \`String\`.

Example: \`3\` then \`4 9 2\`, \`2\` then \`pear apple\` →
\`\`\`
max int=9
avg=5.00
max word=pear
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static <T extends Comparable<T>> T max(List<T> xs) {
        // TODO
        return null;
    }

    static <T extends Number> double average(List<T> xs) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static <T extends Comparable<T>> T max(List<T> xs) {
        T best = xs.get(0);
        for (T x : xs) if (x.compareTo(best) > 0) best = x;
        return best;
    }

    static <T extends Number> double average(List<T> xs) {
        double sum = 0;
        for (T x : xs) sum += x.doubleValue();
        return sum / xs.size();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < m; i++) words.add(in.next());
        System.out.println("max int=" + max(ints));
        System.out.printf("avg=%.2f%n", average(ints));
        System.out.println("max word=" + max(words));
    }
}
`,
          hints: ["The Comparable bound makes compareTo available on T.", "The Number bound makes doubleValue available."],
          cases: [
            { stdin: "3\n4 9 2\n2\npear apple\n", expected: "max int=9\navg=5.00\nmax word=pear\n" },
            { stdin: "1\n-7\n3\nb a c\n", expected: "max int=-7\navg=-7.00\nmax word=c\n" },
            { stdin: "2\n1 2\n1\nz\n", expected: "max int=2\navg=1.50\nmax word=z\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`<T extends Number>` allows the body to call…",
          options: ["Only `Object` methods", "`Number`'s methods such as `doubleValue()` on any `T`", "Any method", "`compareTo`"],
          answer: 1,
          explanation: "The bound is what makes the type's methods available; without it `T` is effectively `Object`.",
        },
        {
          prompt: "`<T extends Comparable<T>>` means…",
          options: ["`T` extends a class named `Comparable`", "`T` can be compared with other `T`s — the self-comparable bound", "`T` must be a `String`", "`T` is an interface"],
          answer: 1,
          explanation: "The parameter appears in its own bound; read it as \"a T that knows how to compare with Ts\".",
        },
        {
          prompt: "Why does the JDK use `Comparable<? super T>` rather than `Comparable<T>` in `sort`?",
          options: ["Style", "So a subclass that inherits `Comparable<Parent>` from its parent still qualifies", "It is faster", "To allow nulls"],
          answer: 1,
          explanation: "`Manager extends Employee implements Comparable<Employee>` is comparable via a supertype's `Comparable`.",
        },
        {
          prompt: "`<T extends A & B>` requires…",
          options: ["`A` and `B` to be classes", "At most one class (first), then interfaces", "Exactly two interfaces", "`A` to extend `B`"],
          answer: 1,
          explanation: "Multiple bounds join with `&`; erasure uses the first bound.",
        },
        {
          prompt: "`<T super Number>` on a method is…",
          options: ["Valid", "Invalid — lower bounds exist only on wildcards", "The same as `extends`", "Deprecated"],
          answer: 1,
          explanation: "Only `? super X` is legal; a lower-bounded type parameter would rarely be useful for a method body.",
        },
      ],
    },
    {
      slug: "wildcards",
      file: "04-wildcards.md",
      exercises: [
        {
          title: "PECS in practice",
          prompt: `Write \`static double sum(Collection<? extends Number> xs)\` (a producer), \`static void addRange(Collection<? super Integer> dest, int from, int to)\` (a consumer that adds \`from..to\` inclusive), and \`static <T> void copy(List<? super T> dest, List<? extends T> src)\`.

Read integers \`from\` and \`to\`. Add the range to a \`List<Number>\`, then also add \`0.5\` to that list; print \`sum=<sum with 1 decimal>\`. Copy a \`List<Integer>\` of \`from..to\` into a \`List<Object>\` with \`copy\` and print \`copied=<dest size>\`.

Example: \`1 4\` →
\`\`\`
sum=10.5
copied=4
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static double sum(Collection<? extends Number> xs) { /* TODO */ return 0; }
    static void addRange(Collection<? super Integer> dest, int from, int to) { /* TODO */ }
    static <T> void copy(List<? super T> dest, List<? extends T> src) { /* TODO */ }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int from = in.nextInt(), to = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static double sum(Collection<? extends Number> xs) {
        double s = 0;
        for (Number n : xs) s += n.doubleValue();
        return s;
    }

    static void addRange(Collection<? super Integer> dest, int from, int to) {
        for (int i = from; i <= to; i++) dest.add(i);
    }

    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T t : src) dest.add(t);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int from = in.nextInt(), to = in.nextInt();
        List<Number> numbers = new ArrayList<>();
        addRange(numbers, from, to);
        numbers.add(0.5);
        System.out.printf("sum=%.1f%n", sum(numbers));

        List<Integer> ints = new ArrayList<>();
        addRange(ints, from, to);
        List<Object> objects = new ArrayList<>();
        copy(objects, ints);
        System.out.println("copied=" + objects.size());
    }
}
`,
          hints: ["A List<Number> is acceptable to both ? extends Number (reading) and ? super Integer (writing).", "copy reads T from src and writes T into dest — extends on the source, super on the destination."],
          cases: [
            { stdin: "1 4\n", expected: "sum=10.5\ncopied=4\n" },
            { stdin: "5 5\n", expected: "sum=5.5\ncopied=1\n" },
            { stdin: "3 1\n", expected: "sum=0.5\ncopied=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`List<Number> nums = new ArrayList<Integer>();` fails because…",
          options: ["`Integer` is not a `Number`", "Generics are invariant: allowing it would let a `Double` be added through `nums`", "`ArrayList` is final", "The diamond is missing"],
          answer: 1,
          explanation: "Invariance is what keeps the `Integer` list honest. Use `List<? extends Number>` for a read-only view.",
        },
        {
          prompt: "Into a `List<? extends Number>` you may add…",
          options: ["Any `Number`", "Only `null`", "Only `Integer`", "Anything"],
          answer: 1,
          explanation: "The actual element type is unknown (could be `Double`), so nothing but `null` is provably safe.",
        },
        {
          prompt: "Reading from a `List<? super Integer>` yields…",
          options: ["`Integer`", "`Object`", "`Number`", "A compile error"],
          answer: 1,
          explanation: "The list could hold any supertype of `Integer`; only `Object` is guaranteed.",
        },
        {
          prompt: "PECS stands for…",
          options: ["Parameter Extends, Class Super", "Producer Extends, Consumer Super", "Public Extends, Concrete Super", "Primitive Extends, Complex Super"],
          answer: 1,
          explanation: "Read from it → `? extends T`; write to it → `? super T`; both → plain `T`.",
        },
        {
          prompt: "`List<?>` differs from `List<Object>` in that…",
          options: ["Nothing", "`List<?>` accepts any list (read-only as `Object`); `List<Object>` accepts only lists declared as `List<Object>`", "`List<?>` allows writes", "`List<Object>` is raw"],
          answer: 1,
          explanation: "The unbounded wildcard is the way to say \"a list of something\".",
        },
      ],
    },
    {
      slug: "type-erasure",
      file: "05-type-erasure.md",
      exercises: [
        {
          title: "Class tokens beat erasure",
          prompt: `Write \`static <T> T[] filled(Class<T> type, int n, Supplier<T> factory)\` that creates a real \`T[]\` with \`java.lang.reflect.Array.newInstance\` and fills it from the supplier — the two things erasure forbids directly (\`new T[n]\`, \`new T()\`). Then write \`static <T> int countOfType(Object[] items, Class<T> type)\` using \`type.isInstance\`.

Read an integer \`n\`. Build a \`String[]\` of \`n\` elements \`"s<index>"\` and an \`Integer[]\` of \`n\` squares with \`filled\`; print both with \`Arrays.toString\`, then \`strings=<count of String in a mixed Object[] made of both arrays>\` and \`array type=<the String[]'s getClass().getSimpleName()>\`.

Example: \`3\` →
\`\`\`
[s0, s1, s2]
[0, 1, 4]
strings=3
array type=String[]
\`\`\``,
          starter: String.raw`import java.lang.reflect.Array;
import java.util.*;
import java.util.function.*;

public class Main {
    @SuppressWarnings("unchecked")
    static <T> T[] filled(Class<T> type, int n, Supplier<T> factory) {
        // TODO
        return null;
    }

    static <T> int countOfType(Object[] items, Class<T> type) {
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
          solution: String.raw`import java.lang.reflect.Array;
import java.util.*;
import java.util.function.*;

public class Main {
    @SuppressWarnings("unchecked")
    static <T> T[] filled(Class<T> type, int n, Supplier<T> factory) {
        T[] arr = (T[]) Array.newInstance(type, n);
        for (int i = 0; i < n; i++) arr[i] = factory.get();
        return arr;
    }

    static <T> int countOfType(Object[] items, Class<T> type) {
        int c = 0;
        for (Object o : items) if (type.isInstance(o)) c++;
        return c;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] counter = {0};
        String[] strings = filled(String.class, n, () -> "s" + counter[0]++);
        int[] sq = {0};
        Integer[] squares = filled(Integer.class, n, () -> { int i = sq[0]++; return i * i; });
        System.out.println(Arrays.toString(strings));
        System.out.println(Arrays.toString(squares));
        Object[] mixed = new Object[2 * n];
        System.arraycopy(strings, 0, mixed, 0, n);
        System.arraycopy(squares, 0, mixed, n, n);
        System.out.println("strings=" + countOfType(mixed, String.class));
        System.out.println("array type=" + strings.getClass().getSimpleName());
    }
}
`,
          hints: ["Array.newInstance(type, n) returns Object; cast it to T[] — this one is genuinely a String[] at run time.", "type.isInstance(o) is the reflective instanceof."],
          cases: [
            { stdin: "3\n", expected: "[s0, s1, s2]\n[0, 1, 4]\nstrings=3\narray type=String[]\n" },
            { stdin: "0\n", expected: "[]\n[]\nstrings=0\narray type=String[]\n" },
            { stdin: "1\n", expected: "[s0]\n[0]\nstrings=1\narray type=String[]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "After compilation, `List<String>` in bytecode is…",
          options: ["`List<String>`", "Raw `List` — the argument is erased", "`List<Object>`", "`ArrayList`"],
          answer: 1,
          explanation: "Erasure removes type arguments; casts are inserted where typed code reads elements.",
        },
        {
          prompt: "`new T()` fails because…",
          options: ["Constructors cannot be generic", "At run time `T` is `Object` — there is no class to construct; pass a `Supplier<T>` or `Class<T>`", "`T` is abstract", "It needs `new T<>()`"],
          answer: 1,
          explanation: "The type is gone by the time the code runs.",
        },
        {
          prompt: "`obj instanceof List<String>` is…",
          options: ["Valid", "A compile error — only reifiable types such as `List<?>` may be tested", "Valid but always false", "Valid at run time only"],
          answer: 1,
          explanation: "The JVM cannot see the `String`; `instanceof List<?>` is the allowed form.",
        },
        {
          prompt: "A bridge method is…",
          options: ["A default method", "A compiler-generated method that makes an override with a specialised signature satisfy the erased parent signature", "A static factory", "A lambda"],
          answer: 1,
          explanation: "`set(Integer)` overriding `set(T)` needs a synthetic `set(Object)` that delegates to it.",
        },
        {
          prompt: "Heap pollution is…",
          options: ["A memory leak", "A parameterised variable referring to an object of the wrong type argument, via raw types or unchecked casts", "Too many objects on the heap", "A garbage-collection failure"],
          answer: 1,
          explanation: "The `ClassCastException` then appears far from the unchecked operation that caused it.",
        },
      ],
    },
    {
      slug: "generics-in-practice",
      file: "06-generics-in-practice.md",
      exercises: [
        {
          title: "A generic LRU cache",
          prompt: `Write \`class LruCache<K, V>\` backed by an access-ordered \`LinkedHashMap\` (constructor \`new LinkedHashMap<>(16, 0.75f, true)\`) whose anonymous subclass overrides \`removeEldestEntry\` to evict beyond a capacity. Provide \`V get(K key)\` (returns null if absent), \`void put(K key, V value)\`, \`V computeIfAbsent(K key, Function<? super K, ? extends V> loader)\` and \`Set<K> keys()\` (the map's key set, in access order).

Read a capacity \`c\`, an integer \`n\` and \`n\` commands: \`put <k> <v>\`, \`get <k>\` (print the value or \`miss\`), \`load <k>\` (\`computeIfAbsent\` with the loader \`k -> k.toUpperCase()\`; print the value). After all commands print \`keys=<keys joined by ,>\`.

Example: capacity \`2\`, then \`put a 1\`, \`put b 2\`, \`get a\`, \`put c 3\`, \`get b\` →
\`\`\`
1
miss
keys=a,c
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

class LruCache<K, V> {
    private final LinkedHashMap<K, V> map;

    LruCache(int capacity) {
        map = new LinkedHashMap<>(16, 0.75f, true) {
            // TODO: removeEldestEntry
        };
    }

    // TODO: get, put, computeIfAbsent, keys
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int c = in.nextInt();
        int n = in.nextInt();
        LruCache<String, String> cache = new LruCache<>(c);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

class LruCache<K, V> {
    private final LinkedHashMap<K, V> map;

    LruCache(int capacity) {
        map = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
        };
    }

    V get(K key) { return map.get(key); }
    void put(K key, V value) { map.put(key, value); }
    V computeIfAbsent(K key, Function<? super K, ? extends V> loader) { return map.computeIfAbsent(key, loader); }
    Set<K> keys() { return map.keySet(); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int c = in.nextInt();
        int n = in.nextInt();
        LruCache<String, String> cache = new LruCache<>(c);
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "put" -> cache.put(in.next(), in.next());
                case "get" -> {
                    String v = cache.get(in.next());
                    System.out.println(v == null ? "miss" : v);
                }
                default -> System.out.println(cache.computeIfAbsent(in.next(), k -> k.toUpperCase()));
            }
        }
        System.out.println("keys=" + String.join(",", cache.keys()));
    }
}
`,
          hints: ["The anonymous subclass is an inner class of the constructor's context and sees K and V.", "Function<? super K, ? extends V> is PECS: the loader consumes keys and produces values."],
          cases: [
            { stdin: "2\n5\nput a 1\nput b 2\nget a\nput c 3\nget b\n", expected: "1\nmiss\nkeys=a,c\n" },
            { stdin: "1\n3\nload x\nload y\nget x\n", expected: "X\nY\nmiss\nkeys=y\n" },
            { stdin: "3\n4\nput a 1\nput b 2\nget a\nput c 3\n", expected: "1\nkeys=b,a,c\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`@SuppressWarnings(\"unchecked\")` should be placed…",
          options: ["On the class", "On the smallest scope possible, with a comment explaining why the cast is safe", "On `main`", "Nowhere — always fix the warning"],
          answer: 1,
          explanation: "Some casts are unavoidable under erasure; confine and justify them so heap pollution has nowhere to hide.",
        },
        {
          prompt: "`Comparator.comparing(Person::name).thenComparing(Person::age)` fails to compile with \"cannot find symbol\". The fix is…",
          options: ["Use a loop", "Give the first lambda an explicit parameter type: `comparing((Person p) -> p.name())`", "Remove `thenComparing`", "Add `@SuppressWarnings`"],
          answer: 1,
          explanation: "The first call in a chain has no target type to infer `T` from; an explicit parameter type restores inference.",
        },
        {
          prompt: "Wildcards belong mainly on…",
          options: ["Local variables", "Return types", "Public API parameters where callers benefit from flexibility", "Fields"],
          answer: 2,
          explanation: "Locals, fields and returns should be concrete; wildcards in a return type burden every caller.",
        },
        {
          prompt: "A `Class<T>` parameter lets a generic method…",
          options: ["Skip erasure", "Create instances and arrays of `T` and perform checked casts at run time", "Use primitives", "Overload on `T`"],
          answer: 1,
          explanation: "The class token carries the type information erasure removed.",
        },
        {
          prompt: "A class `Config<T>` where `T` is always `String` in practice is…",
          options: ["Good design", "Needless generality — make it concrete", "Required by frameworks", "Faster"],
          answer: 1,
          explanation: "Be as generic as the contract requires; unused flexibility is noise.",
        },
      ],
    },
    {
      slug: "generics-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A bounded box with PECS methods",
          prompt: `Write \`class MinMax<T extends Comparable<? super T>>\` that keeps the smallest and largest of the values offered to it: \`void offer(T value)\`, \`void offerAll(Collection<? extends T> values)\`, \`void drainTo(Collection<? super T> dest)\` (adds min then max, if any, and resets), and \`Optional<T> min()\`/\`max()\`.

Read an integer \`n\` and \`n\` integers; offer them all through \`offerAll\` to a \`MinMax<Integer>\`; print \`min=<v> max=<v>\` (or \`empty\` if n is 0); drain into a \`List<Number>\` and print its contents with \`toString\`, then \`after drain=<min().isPresent()>\`.

Example: \`3\` then \`5 -2 9\` →
\`\`\`
min=-2 max=9
[-2, 9]
after drain=false
\`\`\``,
          starter: String.raw`import java.util.*;

class MinMax<T extends Comparable<? super T>> {
    private T min, max;
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

class MinMax<T extends Comparable<? super T>> {
    private T min, max;

    void offer(T value) {
        if (min == null || value.compareTo(min) < 0) min = value;
        if (max == null || value.compareTo(max) > 0) max = value;
    }

    void offerAll(Collection<? extends T> values) {
        for (T v : values) offer(v);
    }

    void drainTo(Collection<? super T> dest) {
        if (min != null) {
            dest.add(min);
            dest.add(max);
        }
        min = null;
        max = null;
    }

    Optional<T> min() { return Optional.ofNullable(min); }
    Optional<T> max() { return Optional.ofNullable(max); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> values = new ArrayList<>();
        for (int i = 0; i < n; i++) values.add(in.nextInt());
        MinMax<Integer> mm = new MinMax<>();
        mm.offerAll(values);
        if (mm.min().isPresent()) System.out.println("min=" + mm.min().get() + " max=" + mm.max().get());
        else System.out.println("empty");
        List<Number> out = new ArrayList<>();
        mm.drainTo(out);
        System.out.println(out);
        System.out.println("after drain=" + mm.min().isPresent());
    }
}
`,
          hints: ["offerAll reads T from a producer (extends); drainTo writes T into a consumer (super).", "A List<Number> is a valid Collection<? super Integer>."],
          cases: [
            { stdin: "3\n5 -2 9\n", expected: "min=-2 max=9\n[-2, 9]\nafter drain=false\n" },
            { stdin: "0\n", expected: "empty\n[]\nafter drain=false\n" },
            { stdin: "1\n7\n", expected: "min=7 max=7\n[7, 7]\nafter drain=false\n", hidden: true },
          ],
        },
        {
          title: "Generic utilities that compile for everything",
          prompt: `Write three generic utilities: \`static <T> List<T> reversed(List<? extends T> xs)\` returning a new list; \`static <T, R> List<R> mapAll(List<? extends T> xs, Function<? super T, ? extends R> f)\`; and \`static <K, V extends Comparable<? super V>> K argMax(Map<K, V> m)\` returning the key with the largest value (any one on ties; \`null\` for an empty map).

Read an integer \`n\` and \`n\` words. Print \`reversed(words)\`, then \`mapAll(words, String::length)\`, then \`argMax\` of a map from each word to its length (build it with a \`LinkedHashMap\` and print \`longest=<key>\`).

Example: \`3\` then \`pear fig banana\` →
\`\`\`
[banana, fig, pear]
[4, 3, 6]
longest=banana
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static <T> List<T> reversed(List<? extends T> xs) { /* TODO */ return null; }
    static <T, R> List<R> mapAll(List<? extends T> xs, Function<? super T, ? extends R> f) { /* TODO */ return null; }
    static <K, V extends Comparable<? super V>> K argMax(Map<K, V> m) { /* TODO */ return null; }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static <T> List<T> reversed(List<? extends T> xs) {
        List<T> out = new ArrayList<>(xs);
        Collections.reverse(out);
        return out;
    }

    static <T, R> List<R> mapAll(List<? extends T> xs, Function<? super T, ? extends R> f) {
        List<R> out = new ArrayList<>(xs.size());
        for (T x : xs) out.add(f.apply(x));
        return out;
    }

    static <K, V extends Comparable<? super V>> K argMax(Map<K, V> m) {
        K bestKey = null;
        V bestValue = null;
        for (Map.Entry<K, V> e : m.entrySet()) {
            if (bestValue == null || e.getValue().compareTo(bestValue) > 0) {
                bestKey = e.getKey();
                bestValue = e.getValue();
            }
        }
        return bestKey;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        System.out.println(reversed(words));
        System.out.println(mapAll(words, String::length));
        Map<String, Integer> lengths = new LinkedHashMap<>();
        for (String w : words) lengths.put(w, w.length());
        System.out.println("longest=" + argMax(lengths));
    }
}
`,
          hints: ["new ArrayList<>(xs) copies a List<? extends T> into a List<T> — the constructor takes Collection<? extends E>.", "The value bound lets compareTo be called; the key is unconstrained."],
          cases: [
            { stdin: "3\npear fig banana\n", expected: "[banana, fig, pear]\n[4, 3, 6]\nlongest=banana\n" },
            { stdin: "1\nx\n", expected: "[x]\n[1]\nlongest=x\n" },
            { stdin: "2\naa bb\n", expected: "[bb, aa]\n[2, 2]\nlongest=aa\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The main benefit of `List<String>` over raw `List` is…",
          options: ["Speed", "Compile-time checking of element types and no casts on reads", "Smaller memory", "Thread safety"],
          answer: 1,
          explanation: "Errors move from a distant `ClassCastException` to the line that inserted the wrong type.",
        },
        {
          prompt: "`static <T> T pick(List<T> xs)` — `T` is inferred from…",
          options: ["The method body", "The argument's type (and the target type if needed)", "Always `Object`", "A required explicit witness"],
          answer: 1,
          explanation: "`pick(List.of(\"a\"))` infers `T = String`; a witness `Main.<String>pick(...)` is rarely necessary.",
        },
        {
          prompt: "`class Box<T> { T[] arr = new T[4]; }` fails with…",
          options: ["Nothing", "\"generic array creation\" — arrays need a run-time element type erasure removed", "\"missing bound\"", "\"T is abstract\""],
          answer: 1,
          explanation: "Use `Object[]` with a contained cast, or `Array.newInstance` with a `Class<T>`.",
        },
        {
          prompt: "`<T extends Comparable<T>>` versus `<T extends Comparable<? super T>>`: the second additionally accepts…",
          options: ["Primitives", "Types whose `Comparable` implementation comes from a superclass", "Unrelated types", "Nulls"],
          answer: 1,
          explanation: "The wildcard lets `Manager` qualify through `Employee implements Comparable<Employee>`.",
        },
        {
          prompt: "A method parameter you only iterate and read should be typed…",
          options: ["`List<T>`", "`List<? extends T>`", "`List<? super T>`", "`List<Object>`"],
          answer: 1,
          explanation: "Producer → `extends`. It accepts `List<SubtypeOfT>` too.",
        },
        {
          prompt: "A method parameter you only add `T`s to should be typed…",
          options: ["`List<? extends T>`", "`List<? super T>`", "`List<?>`", "`List<Object>`"],
          answer: 1,
          explanation: "Consumer → `super`. It accepts `List<SupertypeOfT>` too.",
        },
        {
          prompt: "Which is legal?",
          options: ["`List<String>[] arr = new List<String>[3];`", "`List<?>[] arr = new List<?>[3];`", "`T t = new T();`", "`catch (MyGenericException<T> e)`"],
          answer: 1,
          explanation: "`List<?>` is reifiable, so an array of it may be created; the others are forbidden by erasure.",
        },
        {
          prompt: "Overloading `f(List<String>)` and `f(List<Integer>)` in one class…",
          options: ["Works", "Fails: both erase to `f(List)` — a name clash", "Works with `@Override`", "Works if one is static"],
          answer: 1,
          explanation: "Erasure leaves identical signatures.",
        },
        {
          prompt: "`(List<String>) obj` compiles with…",
          options: ["No warning", "An unchecked warning — only the raw `List` part is checked at run time", "A compile error", "A runtime check of every element"],
          answer: 1,
          explanation: "The type argument cannot be verified; a wrong promise surfaces later as `ClassCastException`.",
        },
        {
          prompt: "Bridge methods are visible…",
          options: ["In source code", "In stack traces and reflection (`Method.isBridge()`)", "Nowhere", "Only in interfaces"],
          answer: 1,
          explanation: "They are synthetic, generated to keep overriding correct under erasure.",
        },
        {
          prompt: "`Class<T>` tokens are used to…",
          options: ["Speed up generics", "Recover type information at run time for instantiation, arrays and checked casts", "Avoid bounds", "Replace wildcards"],
          answer: 1,
          explanation: "`Enum.valueOf(Day.class, s)`, `EnumMap`, JSON parsers all take one.",
        },
        {
          prompt: "`static <T> void swap(T[] a, int i, int j)` works with `Integer[]` but not `int[]` because…",
          options: ["Arrays cannot be generic", "`int[]` is not a `T[]` — primitives are not reference types", "The method must be non-static", "`swap` is reserved"],
          answer: 1,
          explanation: "Primitive arrays need their own overloads; `int[]` cannot be a `T[]` for any `T`.",
        },
        {
          prompt: "Where should wildcards generally **not** appear?",
          options: ["API parameters", "Return types and local variables", "Producer parameters", "Consumer parameters"],
          answer: 1,
          explanation: "A wildcard return forces every caller to handle it; locals should be concrete.",
        },
        {
          prompt: "A record can be generic: `record Pair<A, B>(A first, B second) {}`.",
          options: ["False", "True — records support type parameters like classes", "Only with one parameter", "Only if final"],
          answer: 1,
          explanation: "Generic records are the idiomatic small value carriers.",
        },
      ],
    },
  ],
}, more);

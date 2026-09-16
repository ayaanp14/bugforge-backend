import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "why-generics": [
    {
      title: "A typed pair",
      prompt: `Write \`class Pair<A, B>\` with \`first()\`, \`second()\`, \`Pair<B, A> swap()\` and a \`toString\` of \`(first, second)\`. Read \`n\` lines \`<word> <int>\`; build a \`Pair<String, Integer>\` for each, print it, print its \`swap()\`, and add \`second()\` to a running total **without a cast** — the type parameter makes \`second()\` an \`Integer\`. Finally print \`total=<sum>\`.

Example: \`2\` then \`ab 3\`, \`cd 4\` →
\`\`\`
(ab, 3) swapped (3, ab)
(cd, 4) swapped (4, cd)
total=7
\`\`\``,
      starter: String.raw`import java.util.*;

class Pair<A, B> {
    // TODO
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int total = 0;
        for (int i = 0; i < n; i++) {
            // TODO
        }
        System.out.println("total=" + total);
    }
}
`,
      solution: String.raw`import java.util.*;

class Pair<A, B> {
    private final A first;
    private final B second;
    Pair(A first, B second) { this.first = first; this.second = second; }
    A first() { return first; }
    B second() { return second; }
    Pair<B, A> swap() { return new Pair<>(second, first); }
    @Override public String toString() { return "(" + first + ", " + second + ")"; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int total = 0;
        for (int i = 0; i < n; i++) {
            Pair<String, Integer> p = new Pair<>(in.next(), in.nextInt());
            System.out.println(p + " swapped " + p.swap());
            total += p.second();
        }
        System.out.println("total=" + total);
    }
}
`,
      hints: ["Two type parameters, two fields; swap builds a Pair<B, A> from the same values.", "Because second() returns B = Integer, unboxing into an int needs no cast."],
      cases: [
        { stdin: "2\nab 3\ncd 4\n", expected: "(ab, 3) swapped (3, ab)\n(cd, 4) swapped (4, cd)\ntotal=7\n" },
        { stdin: "1\nz -1\n", expected: "(z, -1) swapped (-1, z)\ntotal=-1\n" },
        { stdin: "0\n", expected: "total=0\n", hidden: true },
      ],
    },
  ],
  "generic-classes-and-methods": [
    {
      title: "max and reverse, for any type",
      prompt: `Write two generic static methods: \`<T extends Comparable<T>> T max(List<T> xs)\` (the first maximum on ties) and \`<T> void reverse(List<T> xs)\` (in place, swapping from both ends). Read an integer \`n\` and \`n\` integers, then \`m\` and \`m\` words. Print \`maxInt=<…>\`, \`maxWord=<…>\` (natural String order), then the reversed lists as \`ints=[…]\` and \`words=[…]\`. One implementation each, used for both types.

Example: \`3\` then \`4 9 2\`, then \`2\` then \`pear apple\` →
\`\`\`
maxInt=9
maxWord=pear
ints=[2, 9, 4]
words=[apple, pear]
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static <T extends Comparable<T>> T max(List<T> xs) {
        // TODO
        return xs.get(0);
    }
    static <T> void reverse(List<T> xs) {
        // TODO
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < m; i++) words.add(in.next());
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
    static <T> void reverse(List<T> xs) {
        for (int i = 0, j = xs.size() - 1; i < j; i++, j--) {
            T t = xs.get(i);
            xs.set(i, xs.get(j));
            xs.set(j, t);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < m; i++) words.add(in.next());
        System.out.println("maxInt=" + max(ints));
        System.out.println("maxWord=" + max(words));
        reverse(ints);
        reverse(words);
        System.out.println("ints=" + ints);
        System.out.println("words=" + words);
    }
}
`,
      hints: ["The bound <T extends Comparable<T>> is what lets you call compareTo on a T.", "reverse needs no bound: swapping never looks inside the elements."],
      cases: [
        { stdin: "3\n4 9 2\n2\npear apple\n", expected: "maxInt=9\nmaxWord=pear\nints=[2, 9, 4]\nwords=[apple, pear]\n" },
        { stdin: "1\n7\n1\nsolo\n", expected: "maxInt=7\nmaxWord=solo\nints=[7]\nwords=[solo]\n" },
        { stdin: "4\n-1 -1 -5 -1\n3\nb a c\n", expected: "maxInt=-1\nmaxWord=c\nints=[-1, -5, -1, -1]\nwords=[c, a, b]\n", hidden: true },
      ],
    },
  ],
  "bounded-types": [
    {
      title: "Sum any numbers",
      prompt: `Write \`static <T extends Number> double sum(List<T> xs)\` using \`doubleValue()\`, and \`static <T extends Number & Comparable<T>> T clampMax(List<T> xs, T cap)\` returning the largest element not exceeding \`cap\` (or \`cap\` itself if none). Read \`n\` integers and \`m\` decimals, then a cap integer. Print \`sumInts=<…>\`, \`sumDoubles=<…>\` (two decimals), \`clamped=<clampMax(ints, cap)>\`.

Example: \`3\` then \`1 2 3\`, \`2\` then \`0.5 1.25\`, then \`2\` →
\`\`\`
sumInts=6.00
sumDoubles=1.75
clamped=2
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static <T extends Number> double sum(List<T> xs) {
        // TODO
        return 0;
    }
    static <T extends Number & Comparable<T>> T clampMax(List<T> xs, T cap) {
        // TODO
        return cap;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<Double> doubles = new ArrayList<>();
        for (int i = 0; i < m; i++) doubles.add(in.nextDouble());
        int cap = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static <T extends Number> double sum(List<T> xs) {
        double s = 0;
        for (T x : xs) s += x.doubleValue();
        return s;
    }
    static <T extends Number & Comparable<T>> T clampMax(List<T> xs, T cap) {
        T best = null;
        for (T x : xs) {
            if (x.compareTo(cap) <= 0 && (best == null || x.compareTo(best) > 0)) best = x;
        }
        return best == null ? cap : best;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<Double> doubles = new ArrayList<>();
        for (int i = 0; i < m; i++) doubles.add(in.nextDouble());
        int cap = in.nextInt();
        System.out.println(String.format(Locale.ROOT, "sumInts=%.2f", sum(ints)));
        System.out.println(String.format(Locale.ROOT, "sumDoubles=%.2f", sum(doubles)));
        System.out.println("clamped=" + clampMax(ints, cap));
    }
}
`,
      hints: ["Number gives doubleValue(); the bound is what makes the call legal on a T.", "An intersection bound (& Comparable<T>) adds compareTo to what you may call."],
      cases: [
        { stdin: "3\n1 2 3\n2\n0.5 1.25\n2\n", expected: "sumInts=6.00\nsumDoubles=1.75\nclamped=2\n" },
        { stdin: "2\n10 20\n1\n3.5\n5\n", expected: "sumInts=30.00\nsumDoubles=3.50\nclamped=5\n" },
        { stdin: "3\n-3 8 7\n0\n7\n", expected: "sumInts=12.00\nsumDoubles=0.00\nclamped=7\n", hidden: true },
      ],
    },
  ],
  wildcards: [
    {
      title: "Copy with PECS",
      prompt: `Write \`static <T> int copyInto(List<? super T> dst, List<? extends T> src)\` that appends every element of \`src\` to \`dst\` and returns how many were copied, and \`static double total(Collection<? extends Number> xs)\`. Read \`n\` integers into a \`List<Integer>\` and \`m\` doubles into a \`List<Double>\`. Copy both into one \`List<Number>\` with \`copyInto\`, then print \`copied=<count>\`, \`numbers=<the list>\` and \`total=<total(numbers) to two decimals>\`. The wildcards are what let a \`List<Integer>\` flow into a \`List<Number>\`.

Example: \`2\` then \`1 2\`, \`1\` then \`0.5\` →
\`\`\`
copied=3
numbers=[1, 2, 0.5]
total=3.50
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static <T> int copyInto(List<? super T> dst, List<? extends T> src) {
        // TODO
        return 0;
    }
    static double total(Collection<? extends Number> xs) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<Double> doubles = new ArrayList<>();
        for (int i = 0; i < m; i++) doubles.add(in.nextDouble());
        List<Number> numbers = new ArrayList<>();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static <T> int copyInto(List<? super T> dst, List<? extends T> src) {
        for (T x : src) dst.add(x);
        return src.size();
    }
    static double total(Collection<? extends Number> xs) {
        double s = 0;
        for (Number x : xs) s += x.doubleValue();
        return s;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(in.nextInt());
        int m = in.nextInt();
        List<Double> doubles = new ArrayList<>();
        for (int i = 0; i < m; i++) doubles.add(in.nextDouble());
        List<Number> numbers = new ArrayList<>();
        int copied = copyInto(numbers, ints) + copyInto(numbers, doubles);
        System.out.println("copied=" + copied);
        System.out.println("numbers=" + numbers);
        System.out.println(String.format(Locale.ROOT, "total=%.2f", total(numbers)));
    }
}
`,
      hints: ["Producer extends (src gives Ts), consumer super (dst accepts Ts) — PECS.", "Without the wildcards, copyInto(List<Number>, List<Integer>) would not compile: List<Integer> is not a List<Number>."],
      cases: [
        { stdin: "2\n1 2\n1\n0.5\n", expected: "copied=3\nnumbers=[1, 2, 0.5]\ntotal=3.50\n" },
        { stdin: "0\n2\n1.5 2.5\n", expected: "copied=2\nnumbers=[1.5, 2.5]\ntotal=4.00\n" },
        { stdin: "3\n-1 0 1\n0\n", expected: "copied=3\nnumbers=[-1, 0, 1]\ntotal=0.00\n", hidden: true },
      ],
    },
  ],
  "type-erasure": [
    {
      title: "Erasure, demonstrated",
      prompt: `Read \`n\` words. Show what erasure means at run time: print \`sameClass=<new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()>\`, \`className=<that class's simple name>\`. Then pollute the heap: put the words in a \`List<String>\`, assign it to a raw \`List\`, \`add(42)\` through the raw reference, and read the elements back through the typed reference one by one — print each string, and when the \`ClassCastException\` fires print \`heap pollution at index <i>\`. Finally print \`size=<list size>\`: the integer is really in there.

Example: \`2\` then \`a b\` →
\`\`\`
sameClass=true
className=ArrayList
a
b
heap pollution at index 2
size=3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    @SuppressWarnings({"rawtypes", "unchecked"})
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
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        System.out.println("sameClass=" + (new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()));
        System.out.println("className=" + new ArrayList<String>().getClass().getSimpleName());

        List raw = words;
        raw.add(42);
        for (int i = 0; i < words.size(); i++) {
            try {
                String s = words.get(i);
                System.out.println(s);
            } catch (ClassCastException e) {
                System.out.println("heap pollution at index " + i);
            }
        }
        System.out.println("size=" + words.size());
    }
}
`,
      hints: ["At run time both lists are plain ArrayList — the type argument is gone.", "The compiler inserts a cast at words.get(i); that cast is where the Integer finally fails."],
      cases: [
        { stdin: "2\na b\n", expected: "sameClass=true\nclassName=ArrayList\na\nb\nheap pollution at index 2\nsize=3\n" },
        { stdin: "0\n", expected: "sameClass=true\nclassName=ArrayList\nheap pollution at index 0\nsize=1\n" },
        { stdin: "1\nx\n", expected: "sameClass=true\nclassName=ArrayList\nx\nheap pollution at index 1\nsize=2\n", hidden: true },
      ],
    },
  ],
  "generics-in-practice": [
    {
      title: "argmax over any map",
      prompt: `Write \`static <K, V extends Comparable<? super V>> K argmax(Map<K, V> m)\` returning the key with the largest value (the first met in iteration order on ties) and \`static <K, V extends Comparable<? super V>> List<K> keysAbove(Map<K, V> m, V threshold)\` returning keys whose value exceeds the threshold, in iteration order. Read \`n\` lines \`<name> <score>\` into a \`LinkedHashMap<String, Integer>\` and a threshold; print \`best=<argmax>\` and \`above=<keysAbove>\`.

Example: \`3\` then \`ann 70\`, \`bob 90\`, \`cy 90\`, then \`75\` →
\`\`\`
best=bob
above=[bob, cy]
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static <K, V extends Comparable<? super V>> K argmax(Map<K, V> m) {
        // TODO
        return null;
    }
    static <K, V extends Comparable<? super V>> List<K> keysAbove(Map<K, V> m, V threshold) {
        // TODO
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) scores.put(in.next(), in.nextInt());
        int threshold = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static <K, V extends Comparable<? super V>> K argmax(Map<K, V> m) {
        K best = null;
        V bestValue = null;
        for (Map.Entry<K, V> e : m.entrySet()) {
            if (bestValue == null || e.getValue().compareTo(bestValue) > 0) {
                best = e.getKey();
                bestValue = e.getValue();
            }
        }
        return best;
    }
    static <K, V extends Comparable<? super V>> List<K> keysAbove(Map<K, V> m, V threshold) {
        List<K> out = new ArrayList<>();
        for (Map.Entry<K, V> e : m.entrySet()) if (e.getValue().compareTo(threshold) > 0) out.add(e.getKey());
        return out;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) scores.put(in.next(), in.nextInt());
        int threshold = in.nextInt();
        System.out.println("best=" + argmax(scores));
        System.out.println("above=" + keysAbove(scores, threshold));
    }
}
`,
      hints: ["Comparable<? super V> is the idiomatic bound: it also accepts types whose compareTo is declared on a supertype.", "Strictly greater keeps the first of equal maxima."],
      cases: [
        { stdin: "3\nann 70\nbob 90\ncy 90\n75\n", expected: "best=bob\nabove=[bob, cy]\n" },
        { stdin: "1\nsolo 1\n1\n", expected: "best=solo\nabove=[]\n" },
        { stdin: "3\nx -5\ny -2\nz -9\n-3\n", expected: "best=y\nabove=[y]\n", hidden: true },
      ],
    },
  ],
  "generics-checkpoint": [
    {
      title: "Merge intervals of any comparable type",
      prompt: `Write \`record Interval<T extends Comparable<? super T>>(T lo, T hi)\` and \`static <T extends Comparable<? super T>> List<Interval<T>> merge(List<Interval<T>> xs)\` that sorts by \`lo\` and merges overlapping or touching intervals (\`next.lo <= current.hi\`). Read \`n\` integer intervals and \`m\` word intervals (inclusive ranges of words in natural order), merge each list with the same method, and print them as \`[lo, hi]\` space-separated on one line each, then \`merged=<count of integer intervals>+<count of word intervals>\`.

Example: \`3\` then \`1 3\`, \`2 6\`, \`8 10\`, then \`2\` then \`a c\`, \`b d\` →
\`\`\`
[1, 6] [8, 10]
[a, d]
merged=2+1
\`\`\``,
      starter: String.raw`import java.util.*;

record Interval<T extends Comparable<? super T>>(T lo, T hi) {
    @Override public String toString() { return "[" + lo + ", " + hi + "]"; }
}

public class Main {
    static <T extends Comparable<? super T>> List<Interval<T>> merge(List<Interval<T>> xs) {
        // TODO
        return xs;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Interval<Integer>> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(new Interval<>(in.nextInt(), in.nextInt()));
        int m = in.nextInt();
        List<Interval<String>> words = new ArrayList<>();
        for (int i = 0; i < m; i++) words.add(new Interval<>(in.next(), in.next()));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

record Interval<T extends Comparable<? super T>>(T lo, T hi) {
    @Override public String toString() { return "[" + lo + ", " + hi + "]"; }
}

public class Main {
    static <T extends Comparable<? super T>> List<Interval<T>> merge(List<Interval<T>> xs) {
        List<Interval<T>> sorted = new ArrayList<>(xs);
        sorted.sort(Comparator.comparing(Interval::lo));
        List<Interval<T>> out = new ArrayList<>();
        for (Interval<T> iv : sorted) {
            if (out.isEmpty() || iv.lo().compareTo(out.get(out.size() - 1).hi()) > 0) {
                out.add(iv);
            } else {
                Interval<T> last = out.remove(out.size() - 1);
                T hi = iv.hi().compareTo(last.hi()) > 0 ? iv.hi() : last.hi();
                out.add(new Interval<>(last.lo(), hi));
            }
        }
        return out;
    }

    static <T extends Comparable<? super T>> String show(List<Interval<T>> xs) {
        StringBuilder sb = new StringBuilder();
        for (Interval<T> iv : xs) sb.append(sb.length() > 0 ? " " : "").append(iv);
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Interval<Integer>> ints = new ArrayList<>();
        for (int i = 0; i < n; i++) ints.add(new Interval<>(in.nextInt(), in.nextInt()));
        int m = in.nextInt();
        List<Interval<String>> words = new ArrayList<>();
        for (int i = 0; i < m; i++) words.add(new Interval<>(in.next(), in.next()));
        List<Interval<Integer>> mi = merge(ints);
        List<Interval<String>> mw = merge(words);
        System.out.println(show(mi));
        System.out.println(show(mw));
        System.out.println("merged=" + mi.size() + "+" + mw.size());
    }
}
`,
      hints: [
        "Sort by lo with Comparator.comparing(Interval::lo) — the bound makes lo Comparable.",
        "Walk the sorted list: overlap when the next lo is not past the current hi; extend hi to the larger.",
        "The same method runs for Integer and String because nothing in it names either type.",
      ],
      cases: [
        { stdin: "3\n1 3\n2 6\n8 10\n2\na c\nb d\n", expected: "[1, 6] [8, 10]\n[a, d]\nmerged=2+1\n" },
        { stdin: "2\n5 5\n1 2\n1\nm m\n", expected: "[1, 2] [5, 5]\n[m, m]\nmerged=2+1\n" },
        { stdin: "4\n1 4\n4 5\n6 7\n0 0\n3\nx z\na b\nc d\n", expected: "[0, 0] [1, 5] [6, 7]\n[a, b] [c, d] [x, z]\nmerged=3+3\n", hidden: true },
      ],
    },
  ],
};

export default more;

import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "collections",
  title: "Collections framework",
  blurb: "The framework's map and complexities, lists, sets, maps and HashMap internals, queues and priority queues, sorting with comparators, iteration and fail-fast, immutable collections.",
  icon: "layers",
  overview: `The collections framework is the part of Java you use in every program and the part interviewers probe most: how HashMap works, ArrayList versus LinkedList, which structure for a stack, why ConcurrentModificationException happens, how to sort by two fields.

This module covers the whole framework methodically: the interface/implementation split and the complexity table; ArrayList and LinkedList with the List API traps; the three sets and their membership rules; HashMap's buckets, resizing and treeification with the modern merge/computeIfAbsent API, plus TreeMap and LinkedHashMap; ArrayDeque and PriorityQueue for stacks, queues and heaps; declarative sorting with Comparator; iterators and the fail-fast contract with the safe ways to modify; and immutable collections with the Collections and Arrays toolkits.

By the end you pick the right structure by reflex, use the modern map API fluently, and answer the HashMap question with confidence.`,
  lessons: [
    {
      slug: "collections-overview",
      file: "01-collections-overview.md",
      exercises: [
        {
          title: "Pick the structure",
          prompt: `Read an integer \`n\` and \`n\` words. Using the right structure for each job, print: \`first=<first word>\` and \`last=<last word>\` (from a \`List\`), \`distinct=<count>\` (a \`HashSet\`), \`sorted=<distinct words in natural order, space-separated>\` (a \`TreeSet\`), \`inOrder=<distinct words in first-seen order>\` (a \`LinkedHashSet\`), and \`top=<the most frequent word; ties broken by natural order>\` (a \`HashMap\` of counts).

Example: \`5\` then \`b a b c a\` →
\`\`\`
first=b last=a
distinct=3
sorted=a b c
inOrder=b a c
top=a
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
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
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        System.out.println("first=" + words.get(0) + " last=" + words.get(words.size() - 1));
        System.out.println("distinct=" + new HashSet<>(words).size());
        System.out.println("sorted=" + String.join(" ", new TreeSet<>(words)));
        System.out.println("inOrder=" + String.join(" ", new LinkedHashSet<>(words)));

        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);
        String top = null;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (top == null || e.getValue() > counts.get(top) || (e.getValue().equals(counts.get(top)) && e.getKey().compareTo(top) < 0)) {
                top = e.getKey();
            }
        }
        System.out.println("top=" + top);
    }
}
`,
          hints: ["Each collection type answers one question; construct it from the list.", "merge(w, 1, Integer::sum) counts; break ties with compareTo."],
          cases: [
            { stdin: "5\nb a b c a\n", expected: "first=b last=a\ndistinct=3\nsorted=a b c\ninOrder=b a c\ntop=a\n" },
            { stdin: "1\nz\n", expected: "first=z last=z\ndistinct=1\nsorted=z\ninOrder=z\ntop=z\n" },
            { stdin: "4\nq q p p\n", expected: "first=q last=p\ndistinct=2\nsorted=p q\ninOrder=q p\ntop=p\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `Map` not a subinterface of `Collection`?",
          options: ["Historical accident", "A map holds key→value pairs, not elements; its `keySet`/`values`/`entrySet` are the collections", "Maps are not iterable", "Maps are immutable"],
          answer: 1,
          explanation: "The views bridge the two worlds; the map itself is a different abstraction.",
        },
        {
          prompt: "The default choices for list, set, map and stack are…",
          options: ["`LinkedList`, `TreeSet`, `TreeMap`, `Stack`", "`ArrayList`, `HashSet`, `HashMap`, `ArrayDeque`", "`Vector`, `HashSet`, `Hashtable`, `Stack`", "`ArrayList`, `LinkedHashSet`, `LinkedHashMap`, `LinkedList`"],
          answer: 1,
          explanation: "Switch to the ordered or sorted variants only when order or sorting is required.",
        },
        {
          prompt: "`contains` on an `ArrayList` of a million elements is…",
          options: ["O(1)", "O(log n)", "O(n) — a linear scan", "O(n log n)"],
          answer: 2,
          explanation: "Lists have no index by value; use a `HashSet` for repeated membership tests.",
        },
        {
          prompt: "Which collections reject `null` elements or keys?",
          options: ["`ArrayList` and `HashMap`", "`TreeMap`, `TreeSet`, `ArrayDeque`, `List.of`/`Set.of`/`Map.of`, `ConcurrentHashMap`", "None", "Only `Set.of`"],
          answer: 1,
          explanation: "Tree structures cannot compare null; `ArrayDeque` uses null for \"empty\"; the immutable factories and concurrent maps are null-hostile by design.",
        },
        {
          prompt: "Two `List`s with the same elements in the same order, one an `ArrayList` and one a `LinkedList`, are…",
          options: ["Never equal", "`equals` — list equality is by contents, not class", "Equal only if both are `ArrayList`", "Equal only if empty"],
          answer: 1,
          explanation: "`List.equals` is specified in terms of elements and order.",
        },
      ],
    },
    {
      slug: "lists",
      file: "02-lists.md",
      exercises: [
        {
          title: "List surgery",
          prompt: `Read an integer \`n\` and \`n\` integers into an \`ArrayList<Integer>\`. Then read an integer \`v\` and do, in order: remove the element **at index** 1 (if it exists); remove the first occurrence of the **value** \`v\` (using \`Integer.valueOf\`); replace every remaining element with its double via \`replaceAll\`; clear the sublist \`[0, 1)\` if the list has at least 2 elements; finally \`removeIf\` every element greater than 100. Print the list with \`toString\` after each of the five steps.

Example: \`4\` then \`5 6 7 60\`, \`v = 7\` →
\`\`\`
[5, 7, 60]
[5, 60]
[10, 120]
[120]
[]
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(in.nextInt());
        int v = in.nextInt();
        // TODO: five steps, printing after each
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(in.nextInt());
        int v = in.nextInt();

        if (list.size() > 1) list.remove(1);
        System.out.println(list);
        list.remove(Integer.valueOf(v));
        System.out.println(list);
        list.replaceAll(x -> x * 2);
        System.out.println(list);
        if (list.size() >= 2) list.subList(0, 1).clear();
        System.out.println(list);
        list.removeIf(x -> x > 100);
        System.out.println(list);
    }
}
`,
          hints: ["remove(1) is by index; remove(Integer.valueOf(v)) is by value.", "subList(...).clear() removes a range from the backing list."],
          cases: [
            { stdin: "4\n5 6 7 60\n7\n", expected: "[5, 7, 60]\n[5, 60]\n[10, 120]\n[120]\n[]\n" },
            { stdin: "1\n9\n9\n", expected: "[9]\n[]\n[]\n[]\n[]\n" },
            { stdin: "3\n1 2 3\n4\n", expected: "[1, 3]\n[1, 3]\n[2, 6]\n[6]\n[6]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`ArrayList.add` at the end is O(1) *amortised* because…",
          options: ["It never resizes", "Occasional 1.5× resizes are spread over many cheap appends", "It uses a linked list", "It pre-allocates a million slots"],
          answer: 1,
          explanation: "Each resize copies the array, but the total copying over n appends is O(n).",
        },
        {
          prompt: "`List<Integer> l; l.remove(2);` removes…",
          options: ["The value 2", "The element at index 2", "Both", "Nothing"],
          answer: 1,
          explanation: "An `int` argument matches `remove(int index)` exactly. Use `remove(Integer.valueOf(2))` for the value.",
        },
        {
          prompt: "`list.subList(1, 3)` returns…",
          options: ["A copy", "A live view backed by the list", "An immutable list", "An array"],
          answer: 1,
          explanation: "Writes go through; structural changes to the parent invalidate the view.",
        },
        {
          prompt: "`Arrays.asList(\"a\", \"b\").add(\"c\")` throws…",
          options: ["Nothing", "`UnsupportedOperationException` — the list is a fixed-size view", "`IndexOutOfBoundsException`", "`NullPointerException`"],
          answer: 1,
          explanation: "`set` is allowed; size changes are not. Wrap in `new ArrayList<>(...)` to grow.",
        },
        {
          prompt: "The practical reason to avoid `LinkedList` for random access is…",
          options: ["It is deprecated", "`get(i)` walks nodes — O(n) — and each node is a separate object with poor cache behaviour", "It cannot hold nulls", "It is not a `List`"],
          answer: 1,
          explanation: "`ArrayList` wins on almost every workload; `ArrayDeque` wins for deque use.",
        },
      ],
    },
    {
      slug: "sets",
      file: "03-sets.md",
      exercises: [
        {
          title: "Set algebra and navigation",
          prompt: `Read two lines of integers (space-separated; the first token of each is the count). Compute with sets: \`union\`, \`intersection\` and \`difference\` (A minus B), printing each as a sorted, space-separated list (use \`TreeSet\` for the output order; print an empty line for an empty set). Then read an integer \`x\` and print \`floor=<greatest element of the union ≤ x or none> ceiling=<least element ≥ x or none>\`.

Example: \`3 1 5 9\` / \`2 5 7\`, \`x = 6\` →
\`\`\`
1 5 7 9
5
1 9
floor=5 ceiling=7
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static List<Integer> readSet(Scanner in) {
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        return xs;
    }

    static String show(Set<Integer> s) {
        StringBuilder sb = new StringBuilder();
        for (int v : new TreeSet<>(s)) { if (sb.length() > 0) sb.append(' '); sb.append(v); }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Set<Integer> a = new HashSet<>(readSet(in));
        Set<Integer> b = new HashSet<>(readSet(in));
        int x = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static List<Integer> readSet(Scanner in) {
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        return xs;
    }

    static String show(Set<Integer> s) {
        StringBuilder sb = new StringBuilder();
        for (int v : new TreeSet<>(s)) { if (sb.length() > 0) sb.append(' '); sb.append(v); }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Set<Integer> a = new HashSet<>(readSet(in));
        Set<Integer> b = new HashSet<>(readSet(in));
        int x = in.nextInt();

        Set<Integer> union = new HashSet<>(a); union.addAll(b);
        Set<Integer> inter = new HashSet<>(a); inter.retainAll(b);
        Set<Integer> diff = new HashSet<>(a); diff.removeAll(b);
        System.out.println(show(union));
        System.out.println(show(inter));
        System.out.println(show(diff));

        TreeSet<Integer> t = new TreeSet<>(union);
        Integer floor = t.floor(x), ceiling = t.ceiling(x);
        System.out.println("floor=" + (floor == null ? "none" : floor) + " ceiling=" + (ceiling == null ? "none" : ceiling));
    }
}
`,
          hints: ["addAll/retainAll/removeAll mutate their receiver — copy first.", "TreeSet.floor and ceiling return null when nothing qualifies."],
          cases: [
            { stdin: "3 1 5 9\n2 5 7\n6\n", expected: "1 5 7 9\n5\n1 9\nfloor=5 ceiling=7\n" },
            { stdin: "2 1 2\n2 1 2\n0\n", expected: "1 2\n1 2\n\nfloor=none ceiling=1\n" },
            { stdin: "1 10\n0\n10\n", expected: "10\n\n10\nfloor=10 ceiling=10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`HashSet` decides whether an element is already present using…",
          options: ["`compareTo`", "`hashCode` to find the bucket, then `equals`", "`==`", "`toString`"],
          answer: 1,
          explanation: "Elements without a consistent `hashCode`/`equals` pair produce duplicates.",
        },
        {
          prompt: "`TreeSet` decides duplicates using…",
          options: ["`equals`", "`compareTo` (or its comparator): a result of 0 means the same element", "`hashCode`", "Identity"],
          answer: 1,
          explanation: "This is why `TreeSet` and `HashSet` can disagree when `compareTo` is inconsistent with `equals`.",
        },
        {
          prompt: "`set.add(x)` returns `false` when…",
          options: ["The set is full", "`x` was already present", "`x` is null", "Never"],
          answer: 1,
          explanation: "The boolean return is the idiom for detecting duplicates in one call.",
        },
        {
          prompt: "To dedupe a list while keeping first-seen order…",
          options: ["`new HashSet<>(list)`", "`new ArrayList<>(new LinkedHashSet<>(list))`", "`new TreeSet<>(list)`", "`list.distinct()`"],
          answer: 1,
          explanation: "`LinkedHashSet` remembers insertion order; `HashSet` does not, `TreeSet` sorts.",
        },
        {
          prompt: "`TreeSet.floor(25)` on `{10, 20, 30}` returns…",
          options: ["30", "20", "10", "null"],
          answer: 1,
          explanation: "`floor` is the greatest element ≤ the argument; `ceiling(25)` would be 30.",
        },
      ],
    },
    {
      slug: "maps",
      file: "04-maps.md",
      exercises: [
        {
          title: "Grouping and counting with the modern API",
          prompt: `Read an integer \`n\` and \`n\` lines \`<city> <name>\`. Build (1) a \`Map<String, Integer>\` of how many people per city using \`merge\`, (2) a \`Map<String, List<String>>\` of names per city using \`computeIfAbsent\`, and (3) a \`TreeMap\` copy of the counts. Print, for every city in sorted order, \`<city> <count>: <names in input order joined by ,>\`, then \`largest=<the city with the most people; ties by name via TreeMap iteration>\`, then \`floor=<the TreeMap's floorKey for the string "p", or none>\`.

Example: \`3\` then \`paris ada\`, \`oslo bob\`, \`paris cy\` →
\`\`\`
oslo 1: bob
paris 2: ada,cy
largest=paris
floor=oslo
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> counts = new HashMap<>();
        Map<String, List<String>> names = new HashMap<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Integer> counts = new HashMap<>();
        Map<String, List<String>> names = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String city = in.next(), name = in.next();
            counts.merge(city, 1, Integer::sum);
            names.computeIfAbsent(city, k -> new ArrayList<>()).add(name);
        }
        TreeMap<String, Integer> sorted = new TreeMap<>(counts);
        String largest = null;
        for (Map.Entry<String, Integer> e : sorted.entrySet()) {
            System.out.println(e.getKey() + " " + e.getValue() + ": " + String.join(",", names.get(e.getKey())));
            if (largest == null || e.getValue() > sorted.get(largest)) largest = e.getKey();
        }
        System.out.println("largest=" + largest);
        String floor = sorted.floorKey("p");
        System.out.println("floor=" + (floor == null ? "none" : floor));
    }
}
`,
          hints: ["merge(city, 1, Integer::sum) and computeIfAbsent(city, k -> new ArrayList<>()).add(name) are the two idioms.", "Iterating the TreeMap in key order and using strict > keeps the first (alphabetically smallest) on ties."],
          cases: [
            { stdin: "3\nparis ada\noslo bob\nparis cy\n", expected: "oslo 1: bob\nparis 2: ada,cy\nlargest=paris\nfloor=oslo\n" },
            { stdin: "2\nzurich a\nzurich b\n", expected: "zurich 2: a,b\nlargest=zurich\nfloor=none\n" },
            { stdin: "2\nlima x\nkyiv y\n", expected: "kyiv 1: y\nlima 1: x\nlargest=kyiv\nfloor=lima\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`HashMap.put` chooses a bucket by…",
          options: ["The key's `toString`", "Spreading `key.hashCode()` and masking with `table.length - 1`", "The insertion order", "The key's `compareTo`"],
          answer: 1,
          explanation: "The table length is a power of two, so the mask is a cheap modulo.",
        },
        {
          prompt: "When a `HashMap` bucket's chain exceeds 8 nodes (Java 8+)…",
          options: ["The map throws", "The chain becomes a red-black tree, bounding lookups at O(log n)", "The map resizes immediately", "Nothing changes"],
          answer: 1,
          explanation: "Treeification protects against bad hash codes and collision attacks.",
        },
        {
          prompt: "`counts.merge(word, 1, Integer::sum)` does…",
          options: ["Replaces the value with 1", "Stores 1 if absent, otherwise stores old + 1", "Removes the key", "Throws if absent"],
          answer: 1,
          explanation: "One call replaces the get-null-check-put sequence for counting.",
        },
        {
          prompt: "`map.computeIfAbsent(k, key -> new ArrayList<>()).add(v)`…",
          options: ["Always creates a new list", "Creates the list only when `k` is absent, then adds to whichever list is mapped", "Removes `k`", "Is a compile error"],
          answer: 1,
          explanation: "It is the multimap idiom; the mapping function runs only on a miss.",
        },
        {
          prompt: "Which iteration is most efficient over a `HashMap`?",
          options: ["`for (K k : map.keySet()) map.get(k)`", "`for (Map.Entry<K,V> e : map.entrySet())`", "`for (V v : map.values()) map.get(v)`", "Index-based"],
          answer: 1,
          explanation: "`entrySet` gives each key and value with no extra lookup; the `keySet`+`get` form does two hashes per entry.",
        },
      ],
    },
    {
      slug: "queues-deques-priority",
      file: "05-queues-deques-priority.md",
      exercises: [
        {
          title: "Brackets and top-k",
          prompt: `Read an integer \`n\` and \`n\` lines. Lines of the form \`check <text>\` are answered \`balanced\` or \`unbalanced\` for \`()[]{}\` using an \`ArrayDeque\` stack. Lines of the form \`topk <k> <m> <m numbers>\` are answered with the \`k\` largest numbers in **descending** order, space-separated, found with a min-heap \`PriorityQueue\` of size at most \`k\`.

Example: \`2\` then \`check ([]{})\` and \`topk 2 5 4 9 1 7 3\` →
\`\`\`
balanced
9 7
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static boolean balanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        // TODO
        return false;
    }

    static List<Integer> topK(int k, int[] xs) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        // TODO: keep at most k; then drain and reverse
        return null;
    }

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

public class Main {
    static boolean balanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        String open = "([{", close = ")]}";
        for (char c : s.toCharArray()) {
            if (open.indexOf(c) >= 0) st.push(c);
            else if (close.indexOf(c) >= 0) {
                if (st.isEmpty() || open.indexOf(st.pop()) != close.indexOf(c)) return false;
            }
        }
        return st.isEmpty();
    }

    static List<Integer> topK(int k, int[] xs) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : xs) {
            minHeap.offer(x);
            if (minHeap.size() > k) minHeap.poll();
        }
        List<Integer> out = new ArrayList<>();
        while (!minHeap.isEmpty()) out.add(minHeap.poll());
        Collections.reverse(out);
        return out;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < n; i++) {
            String[] t = in.nextLine().trim().split("\\s+");
            if (t[0].equals("check")) {
                System.out.println(balanced(t.length > 1 ? t[1] : "") ? "balanced" : "unbalanced");
            } else {
                int k = Integer.parseInt(t[1]);
                int m = Integer.parseInt(t[2]);
                int[] xs = new int[m];
                for (int j = 0; j < m; j++) xs[j] = Integer.parseInt(t[3 + j]);
                StringBuilder sb = new StringBuilder();
                for (int v : topK(k, xs)) { if (sb.length() > 0) sb.append(' '); sb.append(v); }
                System.out.println(sb);
            }
        }
    }
}
`,
          hints: ["A min-heap of size k keeps the k largest: poll the smallest whenever size exceeds k.", "Draining a min-heap gives ascending order; reverse for descending."],
          cases: [
            { stdin: "2\ncheck ([]{})\ntopk 2 5 4 9 1 7 3\n", expected: "balanced\n9 7\n" },
            { stdin: "3\ncheck ([)]\ncheck (\ntopk 3 2 5 1\n", expected: "unbalanced\nunbalanced\n5 1\n" },
            { stdin: "1\ncheck\n", expected: "balanced\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The recommended class for a stack in modern Java is…",
          options: ["`Stack`", "`ArrayDeque`", "`LinkedList`", "`Vector`"],
          answer: 1,
          explanation: "`Stack` is a synchronised `Vector` with a leaky abstraction; `ArrayDeque` is faster and cleaner.",
        },
        {
          prompt: "`poll()` on an empty queue…",
          options: ["Throws `NoSuchElementException`", "Returns `null`", "Blocks", "Returns 0"],
          answer: 1,
          explanation: "`remove()` is the throwing form. This is also why `ArrayDeque` rejects null elements.",
        },
        {
          prompt: "Iterating a `PriorityQueue` with for-each gives…",
          options: ["Ascending order", "Heap (array) order — not sorted", "Descending order", "Insertion order"],
          answer: 1,
          explanation: "Only `peek`/`poll` guarantee the smallest; drain with `poll` for sorted output.",
        },
        {
          prompt: "To find the k largest of n elements in O(n log k)…",
          options: ["Sort everything", "Keep a min-heap of size k, polling the smallest when it grows past k", "Use a max-heap of size n", "Use a `HashSet`"],
          answer: 1,
          explanation: "The heap's root is the k-th largest so far; anything smaller than it can be discarded.",
        },
        {
          prompt: "`ArrayDeque` versus `LinkedList` as a deque…",
          options: ["`LinkedList` is faster", "`ArrayDeque` is faster and uses less memory; it rejects nulls", "Identical", "`ArrayDeque` cannot be a queue"],
          answer: 1,
          explanation: "A circular array beats per-element nodes for every deque operation.",
        },
      ],
    },
    {
      slug: "sorting-and-comparators",
      file: "06-sorting-and-comparators.md",
      exercises: [
        {
          title: "Sort three ways",
          prompt: `Read an integer \`n\` and \`n\` lines \`<name> <dept> <salary>\`. Print the names in three orders, each on one line space-separated: (1) by salary descending then name ascending; (2) by department ascending (case-insensitive) then salary ascending; (3) natural order of a record \`Employee implements Comparable<Employee>\` defined as name ascending. Use \`Comparator.comparing\`/\`thenComparing\`/\`reversed\` for the first two and \`Collections.sort\` for the third.

Example: \`3\` then \`bob ENG 100\`, \`ada eng 100\`, \`cy ops 90\` →
\`\`\`
ada bob cy
bob ada cy
ada bob cy
\`\`\``,
          starter: String.raw`import java.util.*;

record Employee(String name, String dept, int salary) implements Comparable<Employee> {
    // TODO: compareTo by name
}

public class Main {
    static String names(List<Employee> es) {
        StringBuilder sb = new StringBuilder();
        for (Employee e : es) { if (sb.length() > 0) sb.append(' '); sb.append(e.name()); }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> es = new ArrayList<>();
        for (int i = 0; i < n; i++) es.add(new Employee(in.next(), in.next(), in.nextInt()));
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

record Employee(String name, String dept, int salary) implements Comparable<Employee> {
    @Override public int compareTo(Employee o) { return name.compareTo(o.name); }
}

public class Main {
    static String names(List<Employee> es) {
        StringBuilder sb = new StringBuilder();
        for (Employee e : es) { if (sb.length() > 0) sb.append(' '); sb.append(e.name()); }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Employee> es = new ArrayList<>();
        for (int i = 0; i < n; i++) es.add(new Employee(in.next(), in.next(), in.nextInt()));

        List<Employee> a = new ArrayList<>(es);
        a.sort(Comparator.comparingInt(Employee::salary).reversed().thenComparing(Employee::name));
        System.out.println(names(a));

        List<Employee> b = new ArrayList<>(es);
        b.sort(Comparator.comparing(Employee::dept, String.CASE_INSENSITIVE_ORDER).thenComparingInt(Employee::salary));
        System.out.println(names(b));

        List<Employee> c = new ArrayList<>(es);
        Collections.sort(c);
        System.out.println(names(c));
    }
}
`,
          hints: ["reversed() applies to the comparator built before it; thenComparing adds the tie-breaker after.", "comparing(key, keyComparator) supplies the case-insensitive order for the department string."],
          cases: [
            { stdin: "3\nbob ENG 100\nada eng 100\ncy ops 90\n", expected: "ada bob cy\nbob ada cy\nada bob cy\n" },
            { stdin: "2\nz a 1\ny b 2\n", expected: "y z\nz y\ny z\n" },
            { stdin: "3\nc X 5\nb x 5\na x 4\n", expected: "b c a\na c b\na b c\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Java's sort for object arrays and lists is…",
          options: ["Quicksort, unstable", "TimSort, stable, O(n log n)", "Bubble sort", "Heapsort"],
          answer: 1,
          explanation: "Stability preserves the input order of equal elements — the basis of multi-key sorting.",
        },
        {
          prompt: "`Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name)` sorts by…",
          options: ["Name desc, then age", "Age descending, then name ascending", "Age ascending, name descending", "Name only"],
          answer: 1,
          explanation: "`reversed` flips only what precedes it; the tie-breaker added afterwards is ascending.",
        },
        {
          prompt: "`(a, b) -> a.age() - b.age()` is a poor comparator because…",
          options: ["It is slow", "Subtraction can overflow and flip the sign for large values of opposite sign", "It is not a lambda", "Ages are strings"],
          answer: 1,
          explanation: "`Integer.compare(a.age(), b.age())` is correct for all inputs.",
        },
        {
          prompt: "`Collections.binarySearch(list, key, cmp)` is valid only if…",
          options: ["The list is an `ArrayList`", "The list is sorted by the same comparator", "The list has no duplicates", "`key` is a `String`"],
          answer: 1,
          explanation: "Binary search on data ordered differently returns garbage.",
        },
        {
          prompt: "To sort a map's entries by value…",
          options: ["Call `map.sort()`", "Copy `entrySet()` into a list and sort with `Map.Entry.comparingByValue()`", "Use a `HashMap`", "Sort the keys"],
          answer: 1,
          explanation: "Maps have no sort; `TreeMap` orders by key only.",
        },
      ],
    },
    {
      slug: "iteration-and-fail-fast",
      file: "07-iteration-and-fail-fast.md",
      exercises: [
        {
          title: "Remove safely, four ways",
          prompt: `Read an integer \`n\` and \`n\` integers. Remove every **even** number four times from four independent copies of the list, using: (1) \`removeIf\`; (2) an explicit \`Iterator\` with \`it.remove()\`; (3) a backwards index loop; (4) collect-then-\`removeAll\`. Print the four resulting lists; then demonstrate the failure: attempt the removal in a for-each loop inside a \`try\`, catching \`ConcurrentModificationException\`, and print \`cme=<true|false>\` (whether it was thrown).

Example: \`5\` then \`1 2 3 4 5\` →
\`\`\`
[1, 3, 5]
[1, 3, 5]
[1, 3, 5]
[1, 3, 5]
cme=true
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> base = new ArrayList<>();
        for (int i = 0; i < n; i++) base.add(in.nextInt());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> base = new ArrayList<>();
        for (int i = 0; i < n; i++) base.add(in.nextInt());

        List<Integer> a = new ArrayList<>(base);
        a.removeIf(x -> x % 2 == 0);
        System.out.println(a);

        List<Integer> b = new ArrayList<>(base);
        for (Iterator<Integer> it = b.iterator(); it.hasNext(); ) {
            if (it.next() % 2 == 0) it.remove();
        }
        System.out.println(b);

        List<Integer> c = new ArrayList<>(base);
        for (int i = c.size() - 1; i >= 0; i--) {
            if (c.get(i) % 2 == 0) c.remove(i);
        }
        System.out.println(c);

        List<Integer> d = new ArrayList<>(base);
        List<Integer> evens = new ArrayList<>();
        for (int x : d) if (x % 2 == 0) evens.add(x);
        d.removeAll(evens);
        System.out.println(d);

        List<Integer> e = new ArrayList<>(base);
        boolean cme = false;
        try {
            for (Integer x : e) {
                if (x % 2 == 0) e.remove(x);
            }
        } catch (ConcurrentModificationException ex) {
            cme = true;
        }
        System.out.println("cme=" + cme);
    }
}
`,
          hints: ["The iterator's remove() keeps its expected modCount in step.", "The for-each version throws on the next() after a removal — usually."],
          cases: [
            { stdin: "5\n1 2 3 4 5\n", expected: "[1, 3, 5]\n[1, 3, 5]\n[1, 3, 5]\n[1, 3, 5]\ncme=true\n" },
            { stdin: "3\n1 3 5\n", expected: "[1, 3, 5]\n[1, 3, 5]\n[1, 3, 5]\n[1, 3, 5]\ncme=false\n" },
            { stdin: "4\n2 4 6 1\n", expected: "[1]\n[1]\n[1]\n[1]\ncme=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`ConcurrentModificationException` in single-threaded code means…",
          options: ["Two threads collided", "The collection was structurally modified while an iterator over it was active", "The list is full", "A null was inserted"],
          answer: 1,
          explanation: "The iterator compares the collection's `modCount` with the value it recorded at creation.",
        },
        {
          prompt: "Which modification does **not** trip a fail-fast iterator?",
          options: ["`list.add(x)`", "`list.set(i, x)`", "`list.remove(0)`", "`list.clear()`"],
          answer: 1,
          explanation: "`set` is not structural — the size is unchanged, so `modCount` is not incremented.",
        },
        {
          prompt: "Fail-fast detection is…",
          options: ["Guaranteed", "Best-effort — a modification near the end of iteration may go unnoticed", "Only for maps", "Disabled by default"],
          answer: 1,
          explanation: "Never write code that depends on the exception being thrown, or on it not being thrown.",
        },
        {
          prompt: "`map.entrySet().removeIf(e -> e.getValue() == 0)`…",
          options: ["Throws", "Safely removes entries with value 0 from the map through the view", "Only removes from the view", "Requires a `TreeMap`"],
          answer: 1,
          explanation: "The views write through, and `removeIf` uses the iterator's own removal.",
        },
        {
          prompt: "`CopyOnWriteArrayList` iterators…",
          options: ["Throw on modification", "Iterate a snapshot and never throw `ConcurrentModificationException`", "Are faster than `ArrayList`'s", "Reflect every concurrent change"],
          answer: 1,
          explanation: "Right for many readers and rare writers across threads; wrong as a fix for a single-threaded removal bug.",
        },
      ],
    },
    {
      slug: "immutable-and-utilities",
      file: "08-immutable-and-utilities.md",
      exercises: [
        {
          title: "Views versus copies",
          prompt: `Read an integer \`n\` and \`n\` words into a mutable \`ArrayList\`. Create \`view = Collections.unmodifiableList(list)\`, \`copy = List.copyOf(list)\` and \`fixed = Arrays.asList(list.toArray(new String[0]))\`. Then add the word \`extra\` to the original list and try \`view.add("x")\`, \`copy.add("x")\` and \`fixed.set(0, "first")\`, catching \`UnsupportedOperationException\` where it occurs. Print: \`view=<view.toString()>\`, \`copy=<copy>\`, \`fixed=<fixed>\`, and \`unsupported=<how many of the three attempts threw>\`. Also print \`frequency=<Collections.frequency(list, first word)>\` and \`max=<Collections.max(list)>\`.

Example: \`2\` then \`b a\` →
\`\`\`
view=[b, a, extra]
copy=[b, a]
fixed=[first, a]
unsupported=2
frequency=1
max=extra
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(in.next());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(in.next());
        String first = list.get(0);

        List<String> view = Collections.unmodifiableList(list);
        List<String> copy = List.copyOf(list);
        List<String> fixed = Arrays.asList(list.toArray(new String[0]));

        list.add("extra");
        int unsupported = 0;
        try { view.add("x"); } catch (UnsupportedOperationException e) { unsupported++; }
        try { copy.add("x"); } catch (UnsupportedOperationException e) { unsupported++; }
        try { fixed.set(0, "first"); } catch (UnsupportedOperationException e) { unsupported++; }

        System.out.println("view=" + view);
        System.out.println("copy=" + copy);
        System.out.println("fixed=" + fixed);
        System.out.println("unsupported=" + unsupported);
        System.out.println("frequency=" + Collections.frequency(list, first));
        System.out.println("max=" + Collections.max(list));
    }
}
`,
          hints: ["The unmodifiable view reflects the later add; the copy does not.", "Arrays.asList allows set but not add."],
          cases: [
            { stdin: "2\nb a\n", expected: "view=[b, a, extra]\ncopy=[b, a]\nfixed=[first, a]\nunsupported=2\nfrequency=1\nmax=extra\n" },
            { stdin: "3\nz z q\n", expected: "view=[z, z, q, extra]\ncopy=[z, z, q]\nfixed=[first, z, q]\nunsupported=2\nfrequency=2\nmax=z\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Collections.unmodifiableList(list)` returns…",
          options: ["An immutable copy", "A read-only view that reflects later changes to `list`", "A sorted list", "A synchronised list"],
          answer: 1,
          explanation: "For an independent snapshot use `List.copyOf(list)`.",
        },
        {
          prompt: "`List.of(\"a\", null)`…",
          options: ["Creates a two-element list", "Throws `NullPointerException` — the immutable factories reject nulls", "Creates `[a]`", "Compiles only with a cast"],
          answer: 1,
          explanation: "Use `Collections.unmodifiableList(new ArrayList<>(...))` when nulls are required.",
        },
        {
          prompt: "`List.copyOf(x)` when `x` is already a `List.of` list…",
          options: ["Copies anyway", "Returns the same instance — no copy needed for an immutable source", "Throws", "Returns null"],
          answer: 1,
          explanation: "This makes defensive `copyOf` calls cheap in the common case.",
        },
        {
          prompt: "An immutable list of `StringBuilder`s…",
          options: ["Prevents changing the builders", "Prevents changing which builders it holds, not the builders' contents — immutability is shallow", "Is a compile error", "Copies the builders"],
          answer: 1,
          explanation: "Immutable elements (strings, records) are what make a structure immutable in practice.",
        },
        {
          prompt: "`Collections.frequency(list, x)` returns…",
          options: ["The index of `x`", "How many elements equal `x`", "Whether `x` is present", "The most common element"],
          answer: 1,
          explanation: "A linear count using `equals`.",
        },
      ],
    },
    {
      slug: "collections-checkpoint",
      file: "09-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Word frequency report",
          prompt: `Read all of standard input as text. Split into words on non-letters (\`[^a-zA-Z]+\`), lower-case them, ignore empties. Count with a \`HashMap\` and \`merge\`. Print the **top 3** words as \`<word> <count>\` per line, ordered by count descending then word ascending (sort the entry set with \`Map.Entry.comparingByValue().reversed()\` and a tie-breaker — or a hand-written comparator), then \`distinct=<number of distinct words>\`, then \`longest=<the longest word; ties by natural order>\`.

Example input \`the cat and the hat. The end\` →
\`\`\`
the 3
and 1
cat 1
distinct=5
longest=and
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        Map<String, Integer> counts = new HashMap<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        Map<String, Integer> counts = new HashMap<>();
        for (String w : text.toLowerCase(Locale.ROOT).split("[^a-zA-Z]+")) {
            if (!w.isEmpty()) counts.merge(w, 1, Integer::sum);
        }
        List<Map.Entry<String, Integer>> entries = new ArrayList<>(counts.entrySet());
        entries.sort((a, b) -> {
            int c = Integer.compare(b.getValue(), a.getValue());
            return c != 0 ? c : a.getKey().compareTo(b.getKey());
        });
        for (int i = 0; i < Math.min(3, entries.size()); i++) {
            System.out.println(entries.get(i).getKey() + " " + entries.get(i).getValue());
        }
        System.out.println("distinct=" + counts.size());
        String longest = null;
        for (String w : counts.keySet()) {
            if (longest == null || w.length() > longest.length() || (w.length() == longest.length() && w.compareTo(longest) < 0)) longest = w;
        }
        System.out.println("longest=" + longest);
    }
}
`,
          hints: ["Sort a copy of entrySet(); the map itself has no order.", "Longest with ties by natural order: compare length first, then compareTo."],
          cases: [
            { stdin: "the cat and the hat. The end\n", expected: "the 3\nand 1\ncat 1\ndistinct=5\nlongest=and\n" },
            { stdin: "a b b c c c\n", expected: "c 3\nb 2\na 1\ndistinct=3\nlongest=a\n" },
            { stdin: "Zebra zebra apple\n", expected: "zebra 2\napple 1\ndistinct=2\nlongest=apple\n", hidden: true },
          ],
        },
        {
          title: "A tiny scheduler",
          prompt: `Tasks have a name and a priority (lower number = more urgent). Read an integer \`n\` and \`n\` commands: \`add <name> <priority>\` (into a \`PriorityQueue\` ordered by priority, ties by name); \`run\` (poll the most urgent and print \`run <name>\`, or \`idle\` if empty); \`defer\` (poll the most urgent and push it onto an \`ArrayDeque\` stack of deferred tasks, printing \`deferred <name>\`, or \`idle\`); \`resume\` (pop the last deferred task back into the queue, printing \`resumed <name>\`, or \`none\`). After all commands print \`pending=<queue size> deferred=<stack size>\`.

Example: \`5\` then \`add b 2\`, \`add a 1\`, \`defer\`, \`run\`, \`resume\` →
\`\`\`
deferred a
run b
resumed a
pending=1 deferred=0
\`\`\``,
          starter: String.raw`import java.util.*;

record Task(String name, int priority) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        PriorityQueue<Task> queue = new PriorityQueue<>(/* TODO comparator */);
        Deque<Task> deferred = new ArrayDeque<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

record Task(String name, int priority) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        PriorityQueue<Task> queue = new PriorityQueue<>(Comparator.comparingInt(Task::priority).thenComparing(Task::name));
        Deque<Task> deferred = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "add" -> queue.offer(new Task(in.next(), in.nextInt()));
                case "run" -> {
                    Task t = queue.poll();
                    System.out.println(t == null ? "idle" : "run " + t.name());
                }
                case "defer" -> {
                    Task t = queue.poll();
                    if (t == null) System.out.println("idle");
                    else { deferred.push(t); System.out.println("deferred " + t.name()); }
                }
                default -> {
                    Task t = deferred.poll();
                    if (t == null) System.out.println("none");
                    else { queue.offer(t); System.out.println("resumed " + t.name()); }
                }
            }
        }
        System.out.println("pending=" + queue.size() + " deferred=" + deferred.size());
    }
}
`,
          hints: ["comparingInt(Task::priority).thenComparing(Task::name) orders the heap.", "push/poll on an ArrayDeque gives LIFO for the deferred stack."],
          cases: [
            { stdin: "5\nadd b 2\nadd a 1\ndefer\nrun\nresume\n", expected: "deferred a\nrun b\nresumed a\npending=1 deferred=0\n" },
            { stdin: "3\nrun\ndefer\nresume\n", expected: "idle\nidle\nnone\npending=0 deferred=0\n" },
            { stdin: "5\nadd x 5\nadd y 5\nadd w 5\nrun\nrun\n", expected: "run w\nrun x\npending=1 deferred=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which operation is O(1) on an `ArrayList`?",
          options: ["`add(0, x)`", "`get(i)`", "`contains(x)`", "`remove(Object)`"],
          answer: 1,
          explanation: "Index access is an array read; the others shift or scan.",
        },
        {
          prompt: "`HashMap` resizes when…",
          options: ["Any bucket has two nodes", "`size` exceeds `capacity × loadFactor` (0.75 by default)", "A key is removed", "Never"],
          answer: 1,
          explanation: "The table doubles and every entry is rehashed into the new buckets.",
        },
        {
          prompt: "A key whose `hashCode` changes after insertion into a `HashMap`…",
          options: ["Is rehashed automatically", "Becomes unreachable via `get` because it sits in the bucket of its old hash", "Throws", "Is removed"],
          answer: 1,
          explanation: "Keys must be immutable (or at least their hashed fields).",
        },
        {
          prompt: "`TreeMap` requires keys to be…",
          options: ["Hashable", "`Comparable` (or a `Comparator` supplied) and non-null", "Strings", "Immutable records"],
          answer: 1,
          explanation: "It is a red-black tree ordered by comparison; null cannot be compared.",
        },
        {
          prompt: "`LinkedHashMap` with `accessOrder = true` and `removeEldestEntry` overridden gives…",
          options: ["A sorted map", "An LRU cache", "A thread-safe map", "A multimap"],
          answer: 1,
          explanation: "Every `get` moves the entry to the end; the eldest is evicted past capacity.",
        },
        {
          prompt: "`Deque.push` and `Deque.pop` operate at…",
          options: ["The tail", "The head — `push` is `addFirst`, `pop` is `removeFirst`", "Random positions", "Both ends"],
          answer: 1,
          explanation: "Stack semantics on the front of the deque; `offer`/`poll` give FIFO by adding at the tail.",
        },
        {
          prompt: "Changing an element's priority while it sits in a `PriorityQueue`…",
          options: ["Re-heaps automatically", "Corrupts the heap ordering — remove, modify, re-add instead", "Is fine", "Throws"],
          answer: 1,
          explanation: "The heap invariant is maintained only through `offer`/`poll`.",
        },
        {
          prompt: "A stable sort guarantees…",
          options: ["O(n) time", "Equal elements keep their relative input order", "No duplicates", "Ascending order only"],
          answer: 1,
          explanation: "TimSort is stable; this enables sorting by successive keys.",
        },
        {
          prompt: "`Comparator.nullsFirst(Comparator.naturalOrder())`…",
          options: ["Throws on null", "Orders nulls before non-nulls, then by natural order", "Removes nulls", "Is a compile error"],
          answer: 1,
          explanation: "The wrapper handles null elements that a raw natural-order comparator would reject.",
        },
        {
          prompt: "`for (Integer x : list) if (x < 0) list.remove(x);` most likely…",
          options: ["Works", "Throws `ConcurrentModificationException` on the next iteration", "Removes by index", "Is a compile error"],
          answer: 1,
          explanation: "Use `removeIf`, an iterator, or a backwards index loop.",
        },
        {
          prompt: "Which iterator kind never throws `ConcurrentModificationException`?",
          options: ["`ArrayList`'s", "`HashMap`'s", "`ConcurrentHashMap`'s (weakly consistent)", "`TreeSet`'s"],
          answer: 2,
          explanation: "Concurrent collections trade fail-fast detection for weakly consistent or snapshot iteration.",
        },
        {
          prompt: "`Arrays.asList(1, 2, 3).set(0, 9)`…",
          options: ["Throws", "Works — `set` writes through to the backing array", "Creates a new list", "Is a compile error"],
          answer: 1,
          explanation: "Only size-changing operations are unsupported on the `asList` view.",
        },
        {
          prompt: "Returning `Collections.unmodifiableList(items)` from a getter…",
          options: ["Copies the list", "Exposes a read-only view that still reflects internal changes — acceptable when callers only read", "Makes `items` immutable", "Is deprecated"],
          answer: 1,
          explanation: "`List.copyOf` gives an independent snapshot when that is what callers should have.",
        },
        {
          prompt: "`Set.of(1, 2).equals(new HashSet<>(List.of(2, 1)))` is…",
          options: ["`false`", "`true` — set equality is by contents", "A compile error", "`true` only for `TreeSet`"],
          answer: 1,
          explanation: "Order and implementation class do not matter for sets.",
        },
        {
          prompt: "`HashMap`, `Hashtable` and `ConcurrentHashMap` differ in that…",
          options: ["Only `HashMap` is generic", "`HashMap` is unsynchronised, `Hashtable` is a legacy fully synchronised map, `ConcurrentHashMap` is the modern concurrent one", "They are identical", "`ConcurrentHashMap` allows null keys"],
          answer: 1,
          explanation: "Prefer `HashMap` single-threaded and `ConcurrentHashMap` shared; never `Hashtable` in new code.",
        },
      ],
    },
  ],
}, more);

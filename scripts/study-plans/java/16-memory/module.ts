import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "memory",
  title: "Memory and the JVM runtime",
  blurb: "Stack frames and the heap, aliasing, object layout, reachability and reference types, generational GC and the collectors, the string pool and Integer cache, class loading and the JIT, and diagnosing leaks.",
  icon: "memory",
  overview: `Java hides memory management so well that most programmers meet it for the first time in an interview — "where do objects live?", "how does the garbage collector decide?", "why is 127 == 127 but 128 != 128?" — or at two in the morning when a service dies with OutOfMemoryError. This module makes the runtime visible.

It starts with the two places every value lives, the stack frame and the heap, and what a reference really is, because aliasing and pass-by-value follow from that picture. It then follows an object from allocation to reclamation: reachability from GC roots, the four reference strengths, and what a leak actually is in a language without delete. Garbage collection gets a full lesson — mark, sweep, copy, compact; generations; Serial, Parallel, G1 and ZGC; reading a GC log. The string pool, interning and the Integer cache explain the == puzzles once and for all, with StringBuilder's growth rule alongside. Class loading covers the load–link–initialise sequence, the exact initialisation order, parent-first delegation and the JIT's tiered compilation. The last lesson is the practical toolkit: OOM messages, heap dumps and histograms, the six leak shapes, and the LRU cache that keeps memory bounded by construction.

The exercises simulate the machinery — a call stack, a mark phase, generations, a class-loader chain — so that the model becomes something you have built rather than read about.`,
  lessons: [
    {
      slug: "stack-and-heap",
      file: "01-stack-and-heap.md",
      exercises: [
        {
          title: "Frames by hand",
          prompt: `Simulate a thread's call stack with an \`ArrayDeque<String>\`. Read an integer \`n\` and \`n\` commands: \`call <name>\` pushes a frame and prints \`> <name> (depth <d>)\` where \`d\` is the stack size after the push; \`return\` pops the top frame and prints \`< <name>\`, or prints \`error: empty stack\` if there is nothing to pop. After all commands print \`maxDepth=<the deepest the stack got>\`.

Example: \`5\` then \`call main\`, \`call parse\`, \`return\`, \`call run\`, \`return\` →
\`\`\`
> main (depth 1)
> parse (depth 2)
< parse
> run (depth 2)
< run
maxDepth=2
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        Deque<String> stack = new ArrayDeque<>();
        int maxDepth = 0;
        for (int i = 0; i < n; i++) {
            String[] cmd = in.nextLine().trim().split("\\s+");
            // TODO
        }
        System.out.println("maxDepth=" + maxDepth);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        Deque<String> stack = new ArrayDeque<>();
        int maxDepth = 0;
        for (int i = 0; i < n; i++) {
            String[] cmd = in.nextLine().trim().split("\\s+");
            if (cmd[0].equals("call")) {
                stack.push(cmd[1]);
                maxDepth = Math.max(maxDepth, stack.size());
                System.out.println("> " + cmd[1] + " (depth " + stack.size() + ")");
            } else if (stack.isEmpty()) {
                System.out.println("error: empty stack");
            } else {
                System.out.println("< " + stack.pop());
            }
        }
        System.out.println("maxDepth=" + maxDepth);
    }
}
`,
          hints: ["push on call, pop on return; the deque's size is the depth.", "Check isEmpty() before popping — a real JVM would never let you, but your simulator must."],
          cases: [
            { stdin: "5\ncall main\ncall parse\nreturn\ncall run\nreturn\n", expected: "> main (depth 1)\n> parse (depth 2)\n< parse\n> run (depth 2)\n< run\nmaxDepth=2\n" },
            { stdin: "3\nreturn\ncall a\nreturn\n", expected: "error: empty stack\n> a (depth 1)\n< a\nmaxDepth=1\n" },
            { stdin: "4\ncall f\ncall f\ncall f\nreturn\n", expected: "> f (depth 1)\n> f (depth 2)\n> f (depth 3)\n< f\nmaxDepth=3\n", hidden: true },
          ],
        },
        {
          title: "Alias or copy?",
          prompt: `Read an integer \`n\` and \`n\` integers into an array \`a\`; let \`b\` start as a **copy** of \`a\` (\`a.clone()\`). Then read an integer \`m\` and \`m\` commands: \`alias\` makes \`b\` refer to the **same** array as \`a\`; \`copy\` makes \`b\` a fresh clone of \`a\`; \`set <i> <v>\` assigns \`b[i] = v\`; \`show\` prints \`a=<Arrays.toString(a)> b=<Arrays.toString(b)>\`. Watch which assignments show through \`a\`.

Example: \`3\` then \`1 2 3\`, then \`6\` then \`alias\`, \`set 0 9\`, \`show\`, \`copy\`, \`set 1 7\`, \`show\` →
\`\`\`
a=[9, 2, 3] b=[9, 2, 3]
a=[9, 2, 3] b=[9, 7, 3]
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int[] b = a.clone();
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int[] b = a.clone();
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "alias" -> b = a;
                case "copy" -> b = a.clone();
                case "set" -> b[in.nextInt()] = in.nextInt();
                default -> System.out.println("a=" + Arrays.toString(a) + " b=" + Arrays.toString(b));
            }
        }
    }
}
`,
          hints: ["b = a copies the reference — one array, two names.", "clone() makes a second array; writes through b no longer reach a."],
          cases: [
            { stdin: "3\n1 2 3\n6\nalias\nset 0 9\nshow\ncopy\nset 1 7\nshow\n", expected: "a=[9, 2, 3] b=[9, 2, 3]\na=[9, 2, 3] b=[9, 7, 3]\n" },
            { stdin: "2\n5 5\n3\nset 0 1\nshow\nshow\n", expected: "a=[5, 5] b=[1, 5]\na=[5, 5] b=[1, 5]\n" },
            { stdin: "1\n4\n4\nalias\nset 0 0\ncopy\nshow\n", expected: "a=[0] b=[0]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `int[] a = new int[3];` inside a method, where do `a` and the array live?",
          options: ["Both on the stack", "`a` in the stack frame, the array on the heap", "Both on the heap", "`a` on the heap, the array on the stack"],
          answer: 1,
          explanation: "Locals live in the frame; every object and array lives on the heap. `a` is an arrow into it.",
        },
        {
          prompt: "Predict the output:\n```java\nstatic void f(int[] x) { x[0] = 1; x = new int[]{5}; }\nint[] a = {0}; f(a); System.out.println(a[0]);\n```",
          options: ["`0`", "`1`", "`5`", "Compile error"],
          answer: 1,
          explanation: "The method receives a copy of the reference: it can change the shared array (`x[0] = 1`) but rebinding `x` does not affect `a`.",
        },
        {
          prompt: "`StackOverflowError` is caused by…",
          options: ["Too many objects on the heap", "Too many frames on one thread's stack — usually unbounded recursion", "A full string pool", "A slow garbage collector"],
          answer: 1,
          explanation: "Each call pushes a frame into a stack of about 0.5–1 MB; fix the recursion rather than catching the error.",
        },
        {
          prompt: "Roughly how much heap does `new Object()` take on a 64-bit HotSpot JVM with compressed class pointers?",
          options: ["0 bytes", "16 bytes (12-byte header padded to 8-byte alignment)", "64 bytes", "1 byte"],
          answer: 1,
          explanation: "The header holds the mark word and class pointer; objects are aligned to 8 bytes.",
        },
        {
          prompt: "Why is an `int[1_000_000]` much smaller than an `ArrayList<Integer>` of a million values?",
          options: ["Lists store strings", "The array is 4 bytes per value in one block; the list holds pointers to 16-byte `Integer` objects", "Arrays are compressed", "They are the same size"],
          answer: 1,
          explanation: "Boxing multiplies memory by four or five and scatters values across the heap, hurting cache behaviour too.",
        },
      ],
    },
    {
      slug: "object-lifecycle-and-references",
      file: "02-object-lifecycle-and-references.md",
      exercises: [
        {
          title: "Mark from the roots",
          prompt: `Implement the mark phase. Read an integer \`n\` and \`n\` object names; an integer \`r\` and \`r\` root names; an integer \`e\` and \`e\` edges \`from to\` (object \`from\` holds a reference to \`to\`). Print \`live=<reachable objects in natural order, space-separated>\` and \`garbage=<the rest, natural order>\` (print \`-\` for an empty list). Cycles among unreachable objects are still garbage.

Example: \`5\` then \`a b c d e\`, \`1\` then \`a\`, \`4\` then \`a b\`, \`b c\`, \`d e\`, \`e d\` →
\`\`\`
live=a b c
garbage=d e
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> objects = new ArrayList<>();
        for (int i = 0; i < n; i++) objects.add(in.next());
        int r = in.nextInt();
        List<String> roots = new ArrayList<>();
        for (int i = 0; i < r; i++) roots.add(in.next());
        int e = in.nextInt();
        Map<String, List<String>> refs = new HashMap<>();
        for (int i = 0; i < e; i++) refs.computeIfAbsent(in.next(), k -> new ArrayList<>()).add(in.next());
        // TODO: mark from the roots
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> objects = new ArrayList<>();
        for (int i = 0; i < n; i++) objects.add(in.next());
        int r = in.nextInt();
        List<String> roots = new ArrayList<>();
        for (int i = 0; i < r; i++) roots.add(in.next());
        int e = in.nextInt();
        Map<String, List<String>> refs = new HashMap<>();
        for (int i = 0; i < e; i++) refs.computeIfAbsent(in.next(), k -> new ArrayList<>()).add(in.next());

        Set<String> marked = new HashSet<>();
        Deque<String> work = new ArrayDeque<>(roots);
        while (!work.isEmpty()) {
            String o = work.pop();
            if (!marked.add(o)) continue;
            for (String child : refs.getOrDefault(o, List.of())) work.push(child);
        }
        TreeSet<String> live = new TreeSet<>(marked);
        TreeSet<String> garbage = new TreeSet<>(objects);
        garbage.removeAll(marked);
        System.out.println("live=" + (live.isEmpty() ? "-" : String.join(" ", live)));
        System.out.println("garbage=" + (garbage.isEmpty() ? "-" : String.join(" ", garbage)));
    }
}
`,
          hints: ["A work list seeded with the roots; mark each object once and push its children.", "Garbage is every object not marked — in-degree plays no part."],
          cases: [
            { stdin: "5\na b c d e\n1\na\n4\na b\nb c\nd e\ne d\n", expected: "live=a b c\ngarbage=d e\n" },
            { stdin: "3\nx y z\n0\n2\nx y\ny z\n", expected: "live=-\ngarbage=x y z\n" },
            { stdin: "4\np q r s\n2\np s\n3\np q\nq p\nr q\n", expected: "live=p q s\ngarbage=r\n", hidden: true },
          ],
        },
        {
          title: "A cache with weak entries",
          prompt: `Simulate a map whose entries can be held strongly or weakly. Read an integer \`n\` and \`n\` commands: \`put <k> <v> strong|weak\` stores the entry with that strength (replacing any previous); \`gc\` removes every **weak** entry and prints \`gc cleared <count>\`; \`get <k>\` prints \`<k>=<v>\` or \`<k>=null\`. After all commands print \`size=<entries>\`.

Example: \`6\` then \`put a 1 strong\`, \`put b 2 weak\`, \`get b\`, \`gc\`, \`get b\`, \`get a\` →
\`\`\`
b=2
gc cleared 1
b=null
a=1
size=1
\`\`\``,
          starter: String.raw`import java.util.*;

record Entry(String value, boolean weak) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Entry> cache = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
        System.out.println("size=" + cache.size());
    }
}
`,
          solution: String.raw`import java.util.*;

record Entry(String value, boolean weak) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, Entry> cache = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "put" -> {
                    String k = in.next(), v = in.next();
                    cache.put(k, new Entry(v, in.next().equals("weak")));
                }
                case "gc" -> {
                    int before = cache.size();
                    cache.values().removeIf(Entry::weak);
                    System.out.println("gc cleared " + (before - cache.size()));
                }
                default -> {
                    String k = in.next();
                    Entry e = cache.get(k);
                    System.out.println(k + "=" + (e == null ? "null" : e.value()));
                }
            }
        }
        System.out.println("size=" + cache.size());
    }
}
`,
          hints: ["values().removeIf(Entry::weak) is the sweep.", "get on a cleared entry returns null — exactly what WeakReference.get() does."],
          cases: [
            { stdin: "6\nput a 1 strong\nput b 2 weak\nget b\ngc\nget b\nget a\n", expected: "b=2\ngc cleared 1\nb=null\na=1\nsize=1\n" },
            { stdin: "4\nput k v weak\nput k v strong\ngc\nget k\n", expected: "gc cleared 0\nk=v\nsize=1\n" },
            { stdin: "5\nput a 1 weak\nput b 2 weak\ngc\ngc\nget a\n", expected: "gc cleared 2\ngc cleared 0\na=null\nsize=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Two objects that reference each other and nothing else references them are…",
          options: ["Leaked forever", "Garbage — reachability from roots, not reference counts, decides", "Collected only by a full GC", "Kept until `System.gc()`"],
          answer: 1,
          explanation: "Tracing collectors start from the roots; an unreachable cycle is never marked.",
        },
        {
          prompt: "Which is a genuine memory leak in Java?",
          options: ["A local variable in a long method", "A `static List` that only ever grows", "A string literal", "A closed `FileInputStream`"],
          answer: 1,
          explanation: "Reachable-but-forgotten objects are the Java leak: static collections, unremoved listeners, `ThreadLocal`s in pools.",
        },
        {
          prompt: "`WeakReference<T>.get()` may return…",
          options: ["Only the object", "The object, or `null` once the collector has cleared it", "A copy", "An `Optional`"],
          answer: 1,
          explanation: "Code holding weak or soft references must always handle the cleared case.",
        },
        {
          prompt: "A `WeakHashMap<String, X>` whose keys are string literals…",
          options: ["Shrinks at every GC", "Never shrinks — literals are interned and always strongly reachable", "Throws", "Becomes a `HashMap`"],
          answer: 1,
          explanation: "Weak keys help only when the key objects can actually become unreachable.",
        },
        {
          prompt: "Why was `finalize()` deprecated?",
          options: ["It was too fast", "It ran at an unpredictable time on an unspecified thread, slowed collection and could resurrect objects", "It leaked memory", "It was never called"],
          answer: 1,
          explanation: "Resource cleanup belongs in `AutoCloseable`/try-with-resources, with `Cleaner` as a safety net.",
        },
      ],
    },
    {
      slug: "garbage-collection",
      file: "03-garbage-collection.md",
      exercises: [
        {
          title: "Survivors and promotion",
          prompt: `Simulate a generational heap. Read the tenuring threshold \`T\`, then an integer \`n\` and \`n\` events: \`alloc <id>\` puts an object of age 0 into the young generation; \`free <id>\` marks it garbage (wherever it is); \`gc\` is a **minor** collection: remove garbage from the young generation only, increment every young survivor's age, and **promote** (move to the old generation, keeping order) those whose age reaches \`T\`; \`full\` removes garbage from both generations without ageing anything. After each \`gc\` or \`full\` print \`young=[id:age, …] old=[id, …]\` in insertion order.

Example: \`T = 2\`, then \`7\` events: \`alloc a\`, \`alloc b\`, \`gc\`, \`free a\`, \`gc\`, \`free b\`, \`full\` →
\`\`\`
young=[a:1, b:1] old=[]
young=[] old=[b]
young=[] old=[]
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int threshold = in.nextInt();
        int n = in.nextInt();
        Map<String, Integer> young = new LinkedHashMap<>();   // id -> age
        List<String> old = new ArrayList<>();
        Set<String> garbage = new HashSet<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static void show(Map<String, Integer> young, List<String> old) {
        StringJoiner y = new StringJoiner(", ", "[", "]");
        young.forEach((id, age) -> y.add(id + ":" + age));
        System.out.println("young=" + y + " old=" + old);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int threshold = in.nextInt();
        int n = in.nextInt();
        Map<String, Integer> young = new LinkedHashMap<>();   // id -> age
        List<String> old = new ArrayList<>();
        Set<String> garbage = new HashSet<>();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "alloc" -> young.put(in.next(), 0);
                case "free" -> garbage.add(in.next());
                case "gc" -> {
                    young.keySet().removeIf(garbage::contains);
                    Iterator<Map.Entry<String, Integer>> it = young.entrySet().iterator();
                    while (it.hasNext()) {
                        Map.Entry<String, Integer> e = it.next();
                        e.setValue(e.getValue() + 1);
                        if (e.getValue() >= threshold) {
                            old.add(e.getKey());
                            it.remove();
                        }
                    }
                    show(young, old);
                }
                default -> {
                    young.keySet().removeIf(garbage::contains);
                    old.removeIf(garbage::contains);
                    show(young, old);
                }
            }
        }
    }
}
`,
          hints: ["Sweep the young generation first, then age the survivors; promote with the iterator so you can remove while walking.", "A LinkedHashMap keeps allocation order for the printout."],
          cases: [
            { stdin: "2\n7\nalloc a\nalloc b\ngc\nfree a\ngc\nfree b\nfull\n", expected: "young=[a:1, b:1] old=[]\nyoung=[] old=[b]\nyoung=[] old=[]\n" },
            { stdin: "1\n3\nalloc x\ngc\ngc\n", expected: "young=[] old=[x]\nyoung=[] old=[x]\n" },
            { stdin: "3\n6\nalloc p\nalloc q\ngc\nfree q\ngc\ngc\n", expected: "young=[p:1, q:1] old=[]\nyoung=[p:2] old=[]\nyoung=[] old=[p]\n", hidden: true },
          ],
        },
        {
          title: "GC log summary",
          prompt: `Read lines of a simplified GC log until end of input. Each line has the form \`Pause <Young|Full> <before>M-><after>M(<total>M) <millis>ms\`, for example \`Pause Young 124M->31M(512M) 8.4ms\`. Print:

\`\`\`
pauses=<count> young=<count> full=<count>
totalMs=<sum, one decimal> maxMs=<largest, one decimal>
reclaimedMB=<sum of before - after>
\`\`\`

Use a regular expression to pull the fields out. Assume at least one line.`,
          starter: String.raw`import java.util.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        Pattern p = Pattern.compile("Pause (Young|Full) (\\d+)M->(\\d+)M\\((\\d+)M\\) ([0-9.]+)ms");
        String text = new String(System.in.readAllBytes());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        Pattern p = Pattern.compile("Pause (Young|Full) (\\d+)M->(\\d+)M\\((\\d+)M\\) ([0-9.]+)ms");
        String text = new String(System.in.readAllBytes());
        int pauses = 0, young = 0, full = 0;
        double total = 0, max = 0;
        long reclaimed = 0;
        for (String line : text.split("\\R")) {
            Matcher m = p.matcher(line.trim());
            if (!m.find()) continue;
            pauses++;
            if (m.group(1).equals("Young")) young++; else full++;
            reclaimed += Long.parseLong(m.group(2)) - Long.parseLong(m.group(3));
            double ms = Double.parseDouble(m.group(5));
            total += ms;
            max = Math.max(max, ms);
        }
        System.out.println("pauses=" + pauses + " young=" + young + " full=" + full);
        System.out.println(String.format(Locale.ROOT, "totalMs=%.1f maxMs=%.1f", total, max));
        System.out.println("reclaimedMB=" + reclaimed);
    }
}
`,
          hints: ["Matcher.group(i) gives each captured field as a String.", "split(\"\\R\") splits on any line break."],
          cases: [
            { stdin: "Pause Young 124M->31M(512M) 8.4ms\nPause Young 130M->28M(512M) 6.1ms\nPause Full 240M->88M(512M) 141.2ms\n", expected: "pauses=3 young=2 full=1\ntotalMs=155.7 maxMs=141.2\nreclaimedMB=347\n" },
            { stdin: "Pause Young 10M->2M(64M) 1ms\n", expected: "pauses=1 young=1 full=0\ntotalMs=1.0 maxMs=1.0\nreclaimedMB=8\n" },
            { stdin: "Pause Full 900M->900M(1024M) 2000.5ms\nPause Full 1000M->990M(1024M) 1800ms\n", expected: "pauses=2 young=0 full=2\ntotalMs=3800.5 maxMs=2000.5\nreclaimedMB=10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The generational hypothesis says…",
          options: ["All objects live equally long", "Most objects die young; those that survive tend to live long", "Old objects die first", "Objects never die"],
          answer: 1,
          explanation: "Hence Eden + survivor spaces collected often and cheaply, and an old generation collected rarely.",
        },
        {
          prompt: "A minor GC collects…",
          options: ["The whole heap", "The young generation only", "The old generation only", "Metaspace"],
          answer: 1,
          explanation: "Survivors are copied to a survivor space and aged; objects past the tenuring threshold are promoted to the old generation.",
        },
        {
          prompt: "Which collector is the default since Java 9 and targets a pause goal with region-based collection?",
          options: ["Serial", "Parallel", "G1", "CMS"],
          answer: 2,
          explanation: "G1 divides the heap into regions, marks concurrently and collects the garbage-richest regions first; ZGC is the choice for huge heaps with sub-millisecond pauses.",
        },
        {
          prompt: "A GC log full of `Pause Full` lines suggests…",
          options: ["A healthy application", "A leak, an undersized heap or premature promotion", "The JIT is off", "Too many threads"],
          answer: 1,
          explanation: "Full collections should be rare; frequent ones mean the old generation keeps filling with live data.",
        },
        {
          prompt: "`System.gc()`…",
          options: ["Frees memory immediately", "Only suggests a collection — often a full stop-the-world pause when honoured, and ignorable with `-XX:+DisableExplicitGC`", "Is required before `exit`", "Runs a minor GC"],
          answer: 1,
          explanation: "Code must never depend on when a collection happens.",
        },
        {
          prompt: "Predict the log line meaning: `Pause Young 124M->31M(512M) 8.4ms`",
          options: ["Heap grew from 124 to 512 MB", "A young collection took the heap from 124 MB used to 31 MB used, of a 512 MB heap, in 8.4 ms", "31 objects survived", "8.4 MB were freed"],
          answer: 1,
          explanation: "before->after(total) time is the format shared by every modern JVM GC log.",
        },
      ],
    },
    {
      slug: "string-pool-and-caches",
      file: "04-string-pool-and-caches.md",
      exercises: [
        {
          title: "Same or equal?",
          prompt: `Read an integer \`n\` and \`n\` words. For each word \`w\` print \`<w>: equals=<w.equals("java")> same=<w == "java"> interned=<w.intern() == "java">\`. Then read an integer \`m\` and \`m\` integers; for each \`x\` print \`<x>: boxedSame=<Integer.valueOf(x) == Integer.valueOf(x)>\`. Predict every line before you run it: a token read from input is never the pooled literal, and the Integer cache ends at 127.

Example: \`2\` then \`java Java\`, \`2\` then \`127 128\` →
\`\`\`
java: equals=true same=false interned=true
Java: equals=false same=false interned=false
127: boxedSame=true
128: boxedSame=false
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String w = in.next();
            // TODO
        }
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            int x = in.nextInt();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String w = in.next();
            System.out.println(w + ": equals=" + w.equals("java") + " same=" + (w == "java") + " interned=" + (w.intern() == "java"));
        }
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            int x = in.nextInt();
            Integer a = Integer.valueOf(x), b = Integer.valueOf(x);
            System.out.println(x + ": boxedSame=" + (a == b));
        }
    }
}
`,
          hints: ["Scanner builds a new String for every token; only intern() gets you the pooled object.", "Integer.valueOf caches -128..127; outside that range each call allocates."],
          cases: [
            { stdin: "2\njava Java\n2\n127 128\n", expected: "java: equals=true same=false interned=true\nJava: equals=false same=false interned=false\n127: boxedSame=true\n128: boxedSame=false\n" },
            { stdin: "1\njava\n3\n-128 -129 0\n", expected: "java: equals=true same=false interned=true\n-128: boxedSame=true\n-129: boxedSame=false\n0: boxedSame=true\n" },
            { stdin: "2\njavax jav\n2\n100 1000\n", expected: "javax: equals=false same=false interned=false\njav: equals=false same=false interned=false\n100: boxedSame=true\n1000: boxedSame=false\n", hidden: true },
          ],
        },
        {
          title: "Watch the builder grow",
          prompt: `Read an integer \`n\` and \`n\` words. Append each to one \`StringBuilder\` created with the default constructor, and after every append print \`len=<length()> cap=<capacity()>\`. Finally print \`reallocations=<how many times the capacity changed>\`. Predict the capacities first with the rule \`max(needed, 2 × old + 2)\` starting from 16, then let the JDK confirm it.

Example: \`3\` then \`abcdefghij klmnopqrst u\` →
\`\`\`
len=10 cap=16
len=20 cap=34
len=21 cap=34
reallocations=1
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder sb = new StringBuilder();
        int reallocations = 0;
        for (int i = 0; i < n; i++) {
            String w = in.next();
            // TODO
        }
        System.out.println("reallocations=" + reallocations);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        StringBuilder sb = new StringBuilder();
        int reallocations = 0;
        for (int i = 0; i < n; i++) {
            String w = in.next();
            int before = sb.capacity();
            sb.append(w);
            if (sb.capacity() != before) reallocations++;
            System.out.println("len=" + sb.length() + " cap=" + sb.capacity());
        }
        System.out.println("reallocations=" + reallocations);
    }
}
`,
          hints: ["capacity() before and after the append tells you whether the array was replaced.", "16 → 34 → 70 → 142: each step is 2 × old + 2 unless the append needs more."],
          cases: [
            { stdin: "3\nabcdefghij klmnopqrst u\n", expected: "len=10 cap=16\nlen=20 cap=34\nlen=21 cap=34\nreallocations=1\n" },
            { stdin: "1\nhi\n", expected: "len=2 cap=16\nreallocations=0\n" },
            { stdin: "2\nabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJ x\n", expected: "len=46 cap=46\nlen=47 cap=94\nreallocations=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict the output:\n```java\nString a = \"ja\" + \"va\";\nString b = \"java\";\nSystem.out.println(a == b);\n```",
          options: ["`false`", "`true` — the concatenation of two literals is folded at compile time and pooled", "Compile error", "Depends on the JVM"],
          answer: 1,
          explanation: "Constant expressions are folded by `javac`; with a non-final variable operand the concatenation happens at runtime and produces a new object.",
        },
        {
          prompt: "`new String(\"x\") == \"x\"` is…",
          options: ["`true`", "`false` — `new` always creates a fresh object", "A compile error", "`true` after a GC"],
          answer: 1,
          explanation: "`.intern()` on the new string would return the pooled instance and make the comparison true.",
        },
        {
          prompt: "`Integer a = 200, b = 200; a == b` is…",
          options: ["`true`", "`false` by default — 200 is outside the −128..127 cache", "A compile error", "`true` only on 64-bit JVMs"],
          answer: 1,
          explanation: "Compare boxed values with `equals`, or unbox. The upper bound can be raised with `-XX:AutoBoxCacheMax`, which is why `==` is never safe.",
        },
        {
          prompt: "A `StringBuilder` of capacity 34 holding 34 characters receives `append(\"x\")`. Its new capacity is…",
          options: ["35", "68", "70", "64"],
          answer: 2,
          explanation: "`max(needed, 2 × 34 + 2) = max(35, 70) = 70`.",
        },
        {
          prompt: "Why is `s += x` in a loop O(n²)?",
          options: ["Strings are linked lists", "Each concatenation copies the whole current string into a new one", "The pool fills up", "It is not — the compiler fixes it"],
          answer: 1,
          explanation: "The compiler optimises a single expression, not a loop. `StringBuilder` copies only on geometric growth.",
        },
      ],
    },
    {
      slug: "class-loading-and-jit",
      file: "05-class-loading-and-jit.md",
      exercises: [
        {
          title: "Parent-first delegation",
          prompt: `Simulate a class-loader chain. Read an integer \`k\` and \`k\` lines \`<loader> <parent> <classes>\`, where \`parent\` is \`-\` for the bootstrap loader and \`classes\` is a comma-separated list of the class names that loader can find itself (or \`-\`). Then read an integer \`q\` and \`q\` requests \`<loader> <class>\`. Resolve each with **parent-first delegation**: the loader asks its parent first, all the way up; only if no ancestor finds the class does it look itself. Print \`<class> loaded by <loader>\` or \`<class>: ClassNotFoundException\`.

Example:
\`\`\`
3
boot - String,Object
app boot Main,Util
plugin app Plugin,Util
3
plugin String
plugin Util
plugin Foo
\`\`\`
→
\`\`\`
String loaded by boot
Util loaded by app
Foo: ClassNotFoundException
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        Map<String, String> parent = new HashMap<>();
        Map<String, Set<String>> owns = new HashMap<>();
        for (int i = 0; i < k; i++) {
            String name = in.next(), p = in.next(), classes = in.next();
            parent.put(name, p.equals("-") ? null : p);
            owns.put(name, classes.equals("-") ? Set.of() : new HashSet<>(Arrays.asList(classes.split(","))));
        }
        int q = in.nextInt();
        for (int i = 0; i < q; i++) {
            String loader = in.next(), cls = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static Map<String, String> parent = new HashMap<>();
    static Map<String, Set<String>> owns = new HashMap<>();

    static String load(String loader, String cls) {
        if (loader == null) return null;
        String fromParent = load(parent.get(loader), cls);
        if (fromParent != null) return fromParent;
        return owns.get(loader).contains(cls) ? loader : null;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        for (int i = 0; i < k; i++) {
            String name = in.next(), p = in.next(), classes = in.next();
            parent.put(name, p.equals("-") ? null : p);
            owns.put(name, classes.equals("-") ? Set.of() : new HashSet<>(Arrays.asList(classes.split(","))));
        }
        int q = in.nextInt();
        for (int i = 0; i < q; i++) {
            String loader = in.next(), cls = in.next();
            String by = load(loader, cls);
            System.out.println(by == null ? cls + ": ClassNotFoundException" : cls + " loaded by " + by);
        }
    }
}
`,
          hints: ["Recursion mirrors the real loadClass: ask the parent first, then findClass locally.", "The topmost ancestor that owns the class wins, even if the requesting loader owns it too."],
          cases: [
            { stdin: "3\nboot - String,Object\napp boot Main,Util\nplugin app Plugin,Util\n3\nplugin String\nplugin Util\nplugin Foo\n", expected: "String loaded by boot\nUtil loaded by app\nFoo: ClassNotFoundException\n" },
            { stdin: "2\nboot - String\napp boot String\n2\napp String\nboot Main\n", expected: "String loaded by boot\nMain: ClassNotFoundException\n" },
            { stdin: "3\na - -\nb a X\nc b X,Y\n3\nc X\nc Y\na X\n", expected: "X loaded by b\nY loaded by c\nX: ClassNotFoundException\n", hidden: true },
          ],
        },
        {
          title: "Initialisation order, proven",
          prompt: `Write two classes, \`Parent\` and \`Child extends Parent\`, such that:

- \`Parent\` has a static initialiser that prints \`static Parent\`, an instance initialiser block that prints \`init Parent\`, and a constructor that prints \`ctor Parent\`;
- \`Child\` has the same three, printing \`static Child\`, \`init Child\` and \`ctor Child\`, plus a compile-time constant \`static final int CONST = 7\`.

The given \`main\` reads an integer \`n\`, prints \`const=<Child.CONST>\` (which must **not** trigger initialisation), then creates \`n\` \`Child\` objects. Make the output match the JVM's real order: statics once, parent first; per object, parent init and constructor before child.

Example: \`1\` →
\`\`\`
const=7
static Parent
static Child
init Parent
ctor Parent
init Child
ctor Child
\`\`\``,
          starter: String.raw`import java.util.*;

// TODO: class Parent { ... }
// TODO: class Child extends Parent { static final int CONST = 7; ... }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        System.out.println("const=" + Child.CONST);
        for (int i = 0; i < n; i++) new Child();
    }
}
`,
          solution: String.raw`import java.util.*;

class Parent {
    static { System.out.println("static Parent"); }
    { System.out.println("init Parent"); }
    Parent() { System.out.println("ctor Parent"); }
}

class Child extends Parent {
    static final int CONST = 7;
    static { System.out.println("static Child"); }
    { System.out.println("init Child"); }
    Child() { System.out.println("ctor Child"); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        System.out.println("const=" + Child.CONST);
        for (int i = 0; i < n; i++) new Child();
    }
}
`,
          hints: ["A static final primitive with a literal initialiser is inlined by javac — reading it does not initialise the class.", "Instance initialiser blocks run before the constructor body, after the implicit super() returns."],
          cases: [
            { stdin: "1\n", expected: "const=7\nstatic Parent\nstatic Child\ninit Parent\nctor Parent\ninit Child\nctor Child\n" },
            { stdin: "0\n", expected: "const=7\n" },
            { stdin: "2\n", expected: "const=7\nstatic Parent\nstatic Child\ninit Parent\nctor Parent\ninit Child\nctor Child\ninit Parent\nctor Parent\ninit Child\nctor Child\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these triggers class initialisation of `Foo`?",
          options: ["`Foo.class`", "`int x = Foo.MAX;` where `MAX` is `static final int MAX = 3`", "`Foo f = null;`", "`Foo.helper();` — a static method call"],
          answer: 3,
          explanation: "First active use: `new`, a static method, a non-constant static field. Constants are inlined; `Foo.class` and declarations do nothing.",
        },
        {
          prompt: "For `new Child()` (first ever), the order is…",
          options: ["Child statics, Parent statics, Child ctor, Parent ctor", "Parent statics, Child statics, Parent init + ctor, Child init + ctor", "Parent ctor, Child ctor, then statics", "Undefined"],
          answer: 1,
          explanation: "Statics top-down once; then per object the parent's initialisers and constructor complete before the child's.",
        },
        {
          prompt: "Parent-first delegation means…",
          options: ["The child loads first", "A loader asks its parent before looking itself, so core classes cannot be shadowed", "Classes load in alphabetical order", "Only the bootstrap loader loads"],
          answer: 1,
          explanation: "Which is why your own `java.lang.String` on the classpath is never used.",
        },
        {
          prompt: "`NoClassDefFoundError: Could not initialize class X` usually means…",
          options: ["The jar is missing", "X's static initialiser threw earlier (`ExceptionInInitializerError`) and X is now unusable", "X is abstract", "X is in the wrong package"],
          answer: 1,
          explanation: "Find the first failure in the log; every later use of the class fails with this error.",
        },
        {
          prompt: "Tiered compilation in HotSpot means…",
          options: ["Bytecode is compiled ahead of time", "Code is interpreted first, then compiled by C1 and, if still hot, by C2", "Only loops are compiled", "The JIT runs once at start-up"],
          answer: 1,
          explanation: "Quick start with the interpreter, peak speed from C2's inlining, escape analysis and speculative optimisation.",
        },
        {
          prompt: "A benchmark timing a method once with `System.nanoTime()` is unreliable because…",
          options: ["`nanoTime` is inaccurate", "It measures the interpreter and class loading, and the JIT may later compile or eliminate the code — use JMH", "Java has no timers", "Methods cannot be timed"],
          answer: 1,
          explanation: "Warm-up, forks, dead-code prevention and statistical reporting are what JMH provides.",
        },
      ],
    },
    {
      slug: "diagnosing-memory-problems",
      file: "06-diagnosing-memory-problems.md",
      exercises: [
        {
          title: "LRU cache",
          prompt: `Build a least-recently-used cache on \`LinkedHashMap\` with \`accessOrder = true\` and \`removeEldestEntry\`. Read the capacity \`c\`, then an integer \`n\` and \`n\` commands: \`put <k> <v>\` (when it evicts, print \`evict <key>\`); \`get <k>\` prints \`get <k> -> <v>\` or \`get <k> -> miss\`. Finally print \`keys=<the keys from least to most recently used, as a list>\` and \`hits=<n> misses=<n>\`.

Example: \`c = 2\`, then \`6\` commands: \`put a 1\`, \`put b 2\`, \`get a\`, \`put c 3\`, \`get b\`, \`get c\` →
\`\`\`
get a -> 1
evict b
get b -> miss
get c -> 3
keys=[a, c]
hits=2 misses=1
\`\`\``,
          starter: String.raw`import java.util.*;

class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    Lru(int capacity) {
        super(16, 0.75f, true);
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        // TODO: evict (and announce) when over capacity
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int c = in.nextInt();
        int n = in.nextInt();
        Lru<String, String> cache = new Lru<>(c);
        int hits = 0, misses = 0;
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
        System.out.println("keys=" + cache.keySet());
        System.out.println("hits=" + hits + " misses=" + misses);
    }
}
`,
          solution: String.raw`import java.util.*;

class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    Lru(int capacity) {
        super(16, 0.75f, true);
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        boolean evict = size() > capacity;
        if (evict) System.out.println("evict " + eldest.getKey());
        return evict;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int c = in.nextInt();
        int n = in.nextInt();
        Lru<String, String> cache = new Lru<>(c);
        int hits = 0, misses = 0;
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            if (cmd.equals("put")) {
                cache.put(in.next(), in.next());
            } else {
                String k = in.next();
                String v = cache.get(k);
                if (v == null) { misses++; System.out.println("get " + k + " -> miss"); }
                else { hits++; System.out.println("get " + k + " -> " + v); }
            }
        }
        System.out.println("keys=" + cache.keySet());
        System.out.println("hits=" + hits + " misses=" + misses);
    }
}
`,
          hints: ["removeEldestEntry is called after every put; return true to drop the eldest.", "With accessOrder = true, get moves the entry to the most-recent end — that is what makes it LRU rather than FIFO."],
          cases: [
            { stdin: "2\n6\nput a 1\nput b 2\nget a\nput c 3\nget b\nget c\n", expected: "get a -> 1\nevict b\nget b -> miss\nget c -> 3\nkeys=[a, c]\nhits=2 misses=1\n" },
            { stdin: "1\n4\nput x 1\nput y 2\nget x\nget y\n", expected: "evict x\nget x -> miss\nget y -> 2\nkeys=[y]\nhits=1 misses=1\n" },
            { stdin: "3\n5\nput a 1\nput b 2\nput c 3\nput a 9\nput d 4\n", expected: "evict b\nkeys=[c, a, d]\nhits=0 misses=0\n", hidden: true },
          ],
        },
        {
          title: "Heap histogram",
          prompt: `Read allocation records \`<class> <bytes>\` — one object each — until end of input, and print a class histogram the way \`jmap -histo\` does: one line per class, \`<rank>: <class> instances=<count> bytes=<total>\`, ordered by total bytes descending then class name, then \`total=<all bytes>\` and \`top=<share of the top class, whole percent>%\`.

Example input
\`\`\`
String 40
byte[] 1000
String 40
Object[] 500
byte[] 200
\`\`\`
→
\`\`\`
1: byte[] instances=2 bytes=1200
2: Object[] instances=1 bytes=500
3: String instances=2 bytes=80
total=1780
top=67%
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Map<String, long[]> stats = new HashMap<>();   // class -> {count, bytes}
        while (in.hasNext()) {
            String cls = in.next();
            long bytes = in.nextLong();
            // TODO
        }
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Map<String, long[]> stats = new HashMap<>();   // class -> {count, bytes}
        while (in.hasNext()) {
            String cls = in.next();
            long bytes = in.nextLong();
            long[] s = stats.computeIfAbsent(cls, k -> new long[2]);
            s[0]++;
            s[1] += bytes;
        }
        List<Map.Entry<String, long[]>> rows = new ArrayList<>(stats.entrySet());
        rows.sort((a, b) -> {
            int c = Long.compare(b.getValue()[1], a.getValue()[1]);
            return c != 0 ? c : a.getKey().compareTo(b.getKey());
        });
        long total = 0;
        for (Map.Entry<String, long[]> e : rows) total += e.getValue()[1];
        int rank = 1;
        for (Map.Entry<String, long[]> e : rows) {
            System.out.println(rank++ + ": " + e.getKey() + " instances=" + e.getValue()[0] + " bytes=" + e.getValue()[1]);
        }
        System.out.println("total=" + total);
        long top = rows.isEmpty() ? 0 : rows.get(0).getValue()[1];
        System.out.println("top=" + (total == 0 ? 0 : top * 100 / total) + "%");
    }
}
`,
          hints: ["computeIfAbsent(cls, k -> new long[2]) gives a mutable pair per class.", "Sort a list of the entries; the map itself has no order."],
          cases: [
            { stdin: "String 40\nbyte[] 1000\nString 40\nObject[] 500\nbyte[] 200\n", expected: "1: byte[] instances=2 bytes=1200\n2: Object[] instances=1 bytes=500\n3: String instances=2 bytes=80\ntotal=1780\ntop=67%\n" },
            { stdin: "A 10\nB 10\n", expected: "1: A instances=1 bytes=10\n2: B instances=1 bytes=10\ntotal=20\ntop=50%\n" },
            { stdin: "Node 24\nNode 24\nNode 24\nint[] 16\n", expected: "1: Node instances=3 bytes=72\n2: int[] instances=1 bytes=16\ntotal=88\ntop=81%\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`OutOfMemoryError: unable to create native thread` is fixed by…",
          options: ["Raising `-Xmx`", "Finding the thread leak — unbounded `new Thread` or executors never shut down", "Calling `System.gc()`", "Reducing string literals"],
          answer: 1,
          explanation: "Thread stacks are off-heap; the heap size has nothing to do with it.",
        },
        {
          prompt: "The single most useful flag to have on in production for memory incidents is…",
          options: ["`-Xss`", "`-XX:+HeapDumpOnOutOfMemoryError`", "`-verbose:class`", "`-XX:+UseSerialGC`"],
          answer: 1,
          explanation: "Without a dump taken at the moment of failure you are guessing at the retaining structure.",
        },
        {
          prompt: "In a heap-dump analyser, the *dominator tree* tells you…",
          options: ["Which classes have the most methods", "Which objects keep the most memory alive (retained size)", "The order of allocation", "GC pause times"],
          answer: 1,
          explanation: "Follow the largest retained set to the static field or collection at its root — that is the leak.",
        },
        {
          prompt: "`new LinkedHashMap<>(16, 0.75f, true)` — the `true` means…",
          options: ["Thread-safe", "Access order: `get` and `put` move an entry to the most-recent end, enabling LRU eviction via `removeEldestEntry`", "Sorted keys", "Weak keys"],
          answer: 1,
          explanation: "With `false` (the default) the map keeps insertion order and eviction would be FIFO.",
        },
        {
          prompt: "A `HashMap` key mutated after insertion so that its `hashCode` changes…",
          options: ["Is rehashed automatically", "Sits in the wrong bucket: unreachable via `get`, unremovable via `remove` — a leak and a bug", "Throws `ConcurrentModificationException`", "Is moved to the end"],
          answer: 1,
          explanation: "Keys must be immutable in the fields their `hashCode` uses.",
        },
      ],
    },
    {
      slug: "memory-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Tracing versus counting",
          prompt: `Compare the two collection strategies on one object graph. Read an integer \`n\` and \`n\` object names; \`r\` and \`r\` roots; \`e\` and \`e\` edges \`from to\`. Compute:

- **Tracing** frees every object not reachable from a root.
- **Reference counting** gives each object a count = number of incoming edges + 1 if it is a root; frees every non-root object whose count is 0, and when an object is freed decrements the count of each object it points to, freeing those that reach 0 — repeat until stable.

Print \`tracing=<freed, natural order>\`, \`counting=<freed, natural order>\` and \`leaked=<objects tracing frees but counting does not>\` (\`-\` for an empty list). The leaked ones are exactly the garbage cycles.

Example: \`5\` then \`a b c d e\`, \`1\` then \`a\`, \`4\` then \`a b\`, \`c d\`, \`d c\`, \`d e\` →
\`\`\`
tracing=c d e
counting=-
leaked=c d e
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> objects = new ArrayList<>();
        for (int i = 0; i < n; i++) objects.add(in.next());
        int r = in.nextInt();
        Set<String> roots = new HashSet<>();
        for (int i = 0; i < r; i++) roots.add(in.next());
        int e = in.nextInt();
        Map<String, List<String>> out = new HashMap<>();
        Map<String, Integer> count = new HashMap<>();
        for (String o : objects) count.put(o, roots.contains(o) ? 1 : 0);
        for (int i = 0; i < e; i++) {
            String from = in.next(), to = in.next();
            out.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
            count.merge(to, 1, Integer::sum);
        }
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static String show(Collection<String> c) {
        return c.isEmpty() ? "-" : String.join(" ", new TreeSet<>(c));
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> objects = new ArrayList<>();
        for (int i = 0; i < n; i++) objects.add(in.next());
        int r = in.nextInt();
        Set<String> roots = new HashSet<>();
        for (int i = 0; i < r; i++) roots.add(in.next());
        int e = in.nextInt();
        Map<String, List<String>> out = new HashMap<>();
        Map<String, Integer> count = new HashMap<>();
        for (String o : objects) count.put(o, roots.contains(o) ? 1 : 0);
        for (int i = 0; i < e; i++) {
            String from = in.next(), to = in.next();
            out.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
            count.merge(to, 1, Integer::sum);
        }

        // Tracing: mark from the roots.
        Set<String> marked = new HashSet<>();
        Deque<String> work = new ArrayDeque<>(roots);
        while (!work.isEmpty()) {
            String o = work.pop();
            if (marked.add(o)) work.addAll(out.getOrDefault(o, List.of()));
        }
        Set<String> tracing = new HashSet<>(objects);
        tracing.removeAll(marked);

        // Counting: free zero-count objects and cascade.
        Set<String> counting = new HashSet<>();
        Deque<String> zero = new ArrayDeque<>();
        for (String o : objects) if (count.get(o) == 0) zero.add(o);
        while (!zero.isEmpty()) {
            String o = zero.pop();
            if (!counting.add(o)) continue;
            for (String child : out.getOrDefault(o, List.of())) {
                if (count.merge(child, -1, Integer::sum) == 0) zero.add(child);
            }
        }

        Set<String> leaked = new HashSet<>(tracing);
        leaked.removeAll(counting);
        System.out.println("tracing=" + show(tracing));
        System.out.println("counting=" + show(counting));
        System.out.println("leaked=" + show(leaked));
    }
}
`,
          hints: [
            "Tracing is the mark phase from the reachability lesson.",
            "For counting, seed a work list with every zero-count object; when you free one, decrement its children and enqueue any that hit zero.",
            "Leaked = tracing minus counting: objects in cycles that no root reaches.",
          ],
          cases: [
            { stdin: "5\na b c d e\n1\na\n4\na b\nc d\nd c\nd e\n", expected: "tracing=c d e\ncounting=-\nleaked=c d e\n" },
            { stdin: "3\nx y z\n1\nx\n1\ny z\n", expected: "tracing=y z\ncounting=y z\nleaked=-\n" },
            { stdin: "4\na b c d\n1\na\n3\nb c\nc b\nb d\n", expected: "tracing=b c d\ncounting=-\nleaked=b c d\n", hidden: true },
          ],
        },
        {
          title: "Compact the heap",
          prompt: `Simulate a mark–compact collector's sliding phase. Read an integer \`n\` and \`n\` blocks \`<id> <size> <live>\` in address order, starting at address 0 (\`live\` is 1 or 0). Live blocks slide down to the lowest free address, keeping their order; dead blocks are dropped. Print one line per live block \`<id>: <old address> -> <new address>\`, then \`freed=<total size of dead blocks>\` and \`top=<the first free address after compaction>\`.

Example: \`4\` then \`a 16 1\`, \`b 32 0\`, \`c 8 1\`, \`d 24 1\` →
\`\`\`
a: 0 -> 0
c: 48 -> 16
d: 56 -> 24
freed=32
top=48
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int address = 0, top = 0, freed = 0;
        for (int i = 0; i < n; i++) {
            String id = in.next();
            int size = in.nextInt();
            boolean live = in.nextInt() == 1;
            // TODO
        }
        System.out.println("freed=" + freed);
        System.out.println("top=" + top);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int address = 0, top = 0, freed = 0;
        for (int i = 0; i < n; i++) {
            String id = in.next();
            int size = in.nextInt();
            boolean live = in.nextInt() == 1;
            if (live) {
                System.out.println(id + ": " + address + " -> " + top);
                top += size;
            } else {
                freed += size;
            }
            address += size;
        }
        System.out.println("freed=" + freed);
        System.out.println("top=" + top);
    }
}
`,
          hints: [
            "Two cursors: the old address advances by every block; the new address only by live ones.",
            "A block's new address is wherever the compaction cursor stands when it is reached.",
          ],
          cases: [
            { stdin: "4\na 16 1\nb 32 0\nc 8 1\nd 24 1\n", expected: "a: 0 -> 0\nc: 48 -> 16\nd: 56 -> 24\nfreed=32\ntop=48\n" },
            { stdin: "2\nx 8 0\ny 8 0\n", expected: "freed=16\ntop=0\n" },
            { stdin: "3\np 10 0\nq 10 1\nr 10 1\n", expected: "q: 10 -> 0\nr: 20 -> 10\nfreed=10\ntop=20\n", hidden: true },
          ],
        },
        {
          title: "An intern table",
          prompt: `Implement a string pool. Read an integer \`n\` and \`n\` words. Keep a \`HashMap<String, String>\` pool; for each word, if an equal string is already pooled print \`hit <word>\` and reuse it, otherwise print \`miss <word>\` and add it. After all words print \`distinct=<pool size>\` and \`saved=<total characters of the words that were hits — the memory interning avoided>\`. Then, using the pooled references, print \`identical=<true if the pooled reference for the first word == the pooled reference for the last word>\`.

Example: \`4\` then \`java go java rust\` →
\`\`\`
miss java
miss go
hit java
miss rust
distinct=3
saved=4
identical=false
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, String> pool = new HashMap<>();
        List<String> pooled = new ArrayList<>();
        int saved = 0;
        for (int i = 0; i < n; i++) {
            String w = in.next();
            // TODO
        }
        System.out.println("distinct=" + pool.size());
        System.out.println("saved=" + saved);
        System.out.println("identical=" + (pooled.get(0) == pooled.get(pooled.size() - 1)));
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, String> pool = new HashMap<>();
        List<String> pooled = new ArrayList<>();
        int saved = 0;
        for (int i = 0; i < n; i++) {
            String w = in.next();
            String existing = pool.get(w);
            if (existing != null) {
                System.out.println("hit " + w);
                saved += w.length();
                pooled.add(existing);
            } else {
                System.out.println("miss " + w);
                pool.put(w, w);
                pooled.add(w);
            }
        }
        System.out.println("distinct=" + pool.size());
        System.out.println("saved=" + saved);
        System.out.println("identical=" + (pooled.get(0) == pooled.get(pooled.size() - 1)));
    }
}
`,
          hints: [
            "pool.get(w) uses equals; storing w as both key and value lets you hand back the canonical instance.",
            "identical compares references — it is true only when both ends resolved to the same pooled object.",
          ],
          cases: [
            { stdin: "4\njava go java rust\n", expected: "miss java\nmiss go\nhit java\nmiss rust\ndistinct=3\nsaved=4\nidentical=false\n" },
            { stdin: "3\nab cd ab\n", expected: "miss ab\nmiss cd\nhit ab\ndistinct=2\nsaved=2\nidentical=true\n" },
            { stdin: "1\nsolo\n", expected: "miss solo\ndistinct=1\nsaved=0\nidentical=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where does a local `double d = 1.5;` live?",
          options: ["On the heap", "In the current stack frame", "In the string pool", "In Metaspace"],
          answer: 1,
          explanation: "Primitive locals are slots in the frame; only objects live on the heap.",
        },
        {
          prompt: "Predict the output:\n```java\nint[] a = {1}; int[] b = a; b[0] = 2; b = new int[]{3};\nSystem.out.println(a[0] + \" \" + b[0]);\n```",
          options: ["`1 3`", "`2 3`", "`3 3`", "`2 2`"],
          answer: 1,
          explanation: "`b[0] = 2` writes through the alias; `b = new int[]{3}` rebinds `b` only.",
        },
        {
          prompt: "Java decides an object is garbage when…",
          options: ["Its reference count is zero", "No path of references leads to it from a GC root", "It is older than the tenuring threshold", "`finalize` returns"],
          answer: 1,
          explanation: "Tracing from roots; cycles are irrelevant.",
        },
        {
          prompt: "A `SoftReference` differs from a `WeakReference` in that it…",
          options: ["Is never cleared", "Is cleared only when memory is short, not at the next GC", "Is cleared sooner", "Holds primitives"],
          answer: 1,
          explanation: "Soft references are a (poor) cache; weak references are for canonicalising maps and listener lists.",
        },
        {
          prompt: "Objects are promoted to the old generation when…",
          options: ["They exceed 1 KB", "They survive enough minor collections to reach the tenuring threshold", "They are strings", "The program calls `System.gc()`"],
          answer: 1,
          explanation: "Age is kept in the object header and incremented on each survival.",
        },
        {
          prompt: "Which collector aims at sub-millisecond pauses regardless of heap size?",
          options: ["Serial", "Parallel", "ZGC", "The interpreter"],
          answer: 2,
          explanation: "ZGC (and Shenandoah) do almost all work concurrently; G1 targets a configurable pause of ~200 ms.",
        },
        {
          prompt: "`String s = new Scanner(System.in).next(); s == \"java\"` when the input is `java` is…",
          options: ["`true`", "`false` — the token is a new object, not the pooled literal", "A compile error", "`true` after `trim()`"],
          answer: 1,
          explanation: "Only `s.intern() == \"java\"` would be true. Compare with `equals`.",
        },
        {
          prompt: "`Integer.valueOf(127) == Integer.valueOf(127)` and `Integer.valueOf(128) == Integer.valueOf(128)` are…",
          options: ["`true`, `true`", "`true`, `false` by default", "`false`, `false`", "`false`, `true`"],
          answer: 1,
          explanation: "The cache covers −128..127; larger values are freshly allocated unless `-XX:AutoBoxCacheMax` raises the bound.",
        },
        {
          prompt: "A `StringBuilder` at capacity 16 receives 17 characters. Its capacity becomes…",
          options: ["17", "32", "34", "64"],
          answer: 2,
          explanation: "`max(17, 2 × 16 + 2) = 34`.",
        },
        {
          prompt: "Reading `Foo.LIMIT` where `static final int LIMIT = 100`…",
          options: ["Initialises `Foo`", "Does not initialise `Foo` — the constant is inlined at compile time", "Loads `Foo` twice", "Throws"],
          answer: 1,
          explanation: "Only active uses initialise: `new`, static methods, non-constant static fields.",
        },
        {
          prompt: "Which line is printed **first** on the first `new Child()`?",
          options: ["`init Child`", "`static Parent`", "`ctor Parent`", "`static Child`"],
          answer: 1,
          explanation: "Superclass static initialisation precedes everything else.",
        },
        {
          prompt: "Two classes with the same fully qualified name loaded by different loaders are…",
          options: ["The same class", "Different classes — a class is identified by loader plus name", "Merged", "A compile error"],
          answer: 1,
          explanation: "Hence the puzzling `ClassCastException: X cannot be cast to X` in plugin systems.",
        },
        {
          prompt: "Escape analysis lets the JIT…",
          options: ["Detect infinite loops", "Avoid heap allocation for objects that never leave a method", "Skip verification", "Compile faster"],
          answer: 1,
          explanation: "Scalar replacement dissolves such objects into locals — one reason short-lived temporaries are cheap.",
        },
        {
          prompt: "`OutOfMemoryError: Metaspace` points to…",
          options: ["Too many strings", "Classes loaded and never unloaded — a class-loader leak", "A deep recursion", "A large array"],
          answer: 1,
          explanation: "Typical in containers that redeploy applications without releasing the old loader.",
        },
        {
          prompt: "The `LinkedHashMap` LRU recipe needs…",
          options: ["`accessOrder = true` and an overridden `removeEldestEntry`", "A `TreeMap`", "`Collections.synchronizedMap`", "A `PriorityQueue`"],
          answer: 0,
          explanation: "Access order moves used entries to the tail; `removeEldestEntry` returning `size() > capacity` evicts the head.",
        },
      ],
    },
  ],
});

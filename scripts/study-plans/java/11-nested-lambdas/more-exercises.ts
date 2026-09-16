import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "nested-and-inner-classes": [
    {
      title: "A linked list with a nested Node",
      prompt: `Write \`class IntList\` with a **private static nested** \`class Node { int value; Node next; }\`, and methods \`addLast(int)\`, \`addFirst(int)\`, \`int size()\` and \`String toString()\` giving \`[a, b, c]\`. Read \`n\` commands \`first <v>\`, \`last <v>\` or \`show\` (prints the list and \`size=<n>\`). The node type is an implementation detail — nothing outside the list can name it.

Example: \`4\` then \`last 2\`, \`last 3\`, \`first 1\`, \`show\` →
\`\`\`
[1, 2, 3] size=3
\`\`\``,
      starter: String.raw`import java.util.*;

class IntList {
    private static class Node {
        int value;
        Node next;
        Node(int value, Node next) { this.value = value; this.next = next; }
    }
    private Node head;
    private int size;
    // TODO: addFirst, addLast, size, toString
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntList list = new IntList();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

class IntList {
    private static class Node {
        int value;
        Node next;
        Node(int value, Node next) { this.value = value; this.next = next; }
    }
    private Node head;
    private int size;
    void addFirst(int v) { head = new Node(v, head); size++; }
    void addLast(int v) {
        if (head == null) { addFirst(v); return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = new Node(v, null);
        size++;
    }
    int size() { return size; }
    @Override public String toString() {
        StringJoiner sj = new StringJoiner(", ", "[", "]");
        for (Node cur = head; cur != null; cur = cur.next) sj.add(String.valueOf(cur.value));
        return sj.toString();
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        IntList list = new IntList();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            switch (cmd) {
                case "first" -> list.addFirst(in.nextInt());
                case "last" -> list.addLast(in.nextInt());
                default -> System.out.println(list + " size=" + list.size());
            }
        }
    }
}
`,
      hints: ["A static nested class has no outer instance — Node needs none, so static is right.", "addFirst is one line: the new node points at the old head."],
      cases: [
        { stdin: "4\nlast 2\nlast 3\nfirst 1\nshow\n", expected: "[1, 2, 3] size=3\n" },
        { stdin: "1\nshow\n", expected: "[] size=0\n" },
        { stdin: "5\nfirst 5\nfirst 4\nlast 6\nshow\nshow\n", expected: "[4, 5, 6] size=3\n[4, 5, 6] size=3\n", hidden: true },
      ],
    },
  ],
  "local-and-anonymous-classes": [
    {
      title: "Anonymous and local, side by side",
      prompt: `Read \`n\` words. (1) Create an **anonymous** \`Runnable\` that prints \`ran with <n> words\`, and run it. (2) Inside \`main\`, declare a **local** class \`Tally\` with a counter and \`void see(String w)\` that increments when the word starts with an upper-case letter; feed it every word and print \`capitalised=<count>\`. (3) Sort the words with an anonymous \`Comparator<String>\` by length descending, then alphabetically, and print them space-separated.

Example: \`4\` then \`pear Apple fig Kiwi\` →
\`\`\`
ran with 4 words
capitalised=2
Apple Kiwi pear fig
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        // TODO (1) anonymous Runnable
        // TODO (2) local class Tally
        // TODO (3) anonymous Comparator
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

        Runnable announce = new Runnable() {
            @Override public void run() { System.out.println("ran with " + n + " words"); }
        };
        announce.run();

        class Tally {
            int count;
            void see(String w) { if (!w.isEmpty() && Character.isUpperCase(w.charAt(0))) count++; }
        }
        Tally tally = new Tally();
        for (String w : words) tally.see(w);
        System.out.println("capitalised=" + tally.count);

        words.sort(new Comparator<String>() {
            @Override public int compare(String a, String b) {
                int c = Integer.compare(b.length(), a.length());
                return c != 0 ? c : a.compareTo(b);
            }
        });
        System.out.println(String.join(" ", words));
    }
}
`,
      hints: ["An anonymous class captures effectively-final locals like n.", "A local class is declared inside the method body and used right there."],
      cases: [
        { stdin: "4\npear Apple fig Kiwi\n", expected: "ran with 4 words\ncapitalised=2\nApple Kiwi pear fig\n" },
        { stdin: "1\nz\n", expected: "ran with 1 words\ncapitalised=0\nz\n" },
        { stdin: "3\nBb aa Cc\n", expected: "ran with 3 words\ncapitalised=2\nBb Cc aa\n", hidden: true },
      ],
    },
  ],
  lambdas: [
    {
      title: "Predicate chains",
      prompt: `Read \`n\` integers. Build \`Predicate<Integer>\` lambdas \`even\`, \`positive\` and \`big\` (\`> 100\`), then print counts of the numbers that satisfy: \`even.and(positive)\`, \`even.or(big)\`, \`positive.negate()\`, and \`Predicate.not(big).and(even.negate())\`. Format each as \`<name>=<count>\`.

Example: \`6\` then \`-4 3 8 150 -7 0\` →
\`\`\`
evenAndPositive=2
evenOrBig=4
notPositive=3
smallAndOdd=2
\`\`\``,
      starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static long count(List<Integer> xs, Predicate<Integer> p) {
        long c = 0;
        for (int x : xs) if (p.test(x)) c++;
        return c;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        Predicate<Integer> even = x -> x % 2 == 0;
        // TODO: positive, big, and the four prints
    }
}
`,
      solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    static long count(List<Integer> xs, Predicate<Integer> p) {
        long c = 0;
        for (int x : xs) if (p.test(x)) c++;
        return c;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        Predicate<Integer> even = x -> x % 2 == 0;
        Predicate<Integer> positive = x -> x > 0;
        Predicate<Integer> big = x -> x > 100;
        System.out.println("evenAndPositive=" + count(xs, even.and(positive)));
        System.out.println("evenOrBig=" + count(xs, even.or(big)));
        System.out.println("notPositive=" + count(xs, positive.negate()));
        System.out.println("smallAndOdd=" + count(xs, Predicate.not(big).and(even.negate())));
    }
}
`,
      hints: ["and, or and negate are default methods on Predicate that build new lambdas.", "Zero is even and not positive — check your counts against it."],
      cases: [
        { stdin: "6\n-4 3 8 150 -7 0\n", expected: "evenAndPositive=2\nevenOrBig=4\nnotPositive=3\nsmallAndOdd=2\n" },
        { stdin: "2\n101 102\n", expected: "evenAndPositive=1\nevenOrBig=2\nnotPositive=0\nsmallAndOdd=0\n" },
        { stdin: "3\n1 2 3\n", expected: "evenAndPositive=1\nevenOrBig=1\nnotPositive=0\nsmallAndOdd=2\n", hidden: true },
      ],
    },
  ],
  "method-references": [
    {
      title: "Constructor references and friends",
      prompt: `Use each kind of method reference at least once. Read \`n\` words. With \`Supplier<List<String>> make = ArrayList::new\` create the list; with \`Function<String, Integer> len = String::length\` map to lengths; with \`BiFunction<String, String, Boolean> starts = String::startsWith\` test whether each word starts with the first word; with \`Function<Integer, String> fmt = Integer::toBinaryString\`. Print \`lengths=<list of lengths>\`, \`sharePrefix=<count of words starting with the first word>\`, \`binary=<binary of the total length>\`.

Example: \`3\` then \`ab abc cd\` →
\`\`\`
lengths=[2, 3, 2]
sharePrefix=2
binary=111
\`\`\``,
      starter: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Supplier<List<String>> make = ArrayList::new;
        List<String> words = make.get();
        for (int i = 0; i < n; i++) words.add(in.next());
        // TODO: len, starts, fmt
    }
}
`,
      solution: String.raw`import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Supplier<List<String>> make = ArrayList::new;
        List<String> words = make.get();
        for (int i = 0; i < n; i++) words.add(in.next());

        Function<String, Integer> len = String::length;
        BiFunction<String, String, Boolean> starts = String::startsWith;
        Function<Integer, String> fmt = Integer::toBinaryString;

        List<Integer> lengths = new ArrayList<>();
        int total = 0, share = 0;
        for (String w : words) {
            lengths.add(len.apply(w));
            total += len.apply(w);
            if (starts.apply(w, words.get(0))) share++;
        }
        System.out.println("lengths=" + lengths);
        System.out.println("sharePrefix=" + share);
        System.out.println("binary=" + fmt.apply(total));
    }
}
`,
      hints: ["ArrayList::new is a constructor reference; each get() makes a fresh list.", "String::startsWith as a BiFunction: the first argument is the receiver, the second the parameter."],
      cases: [
        { stdin: "3\nab abc cd\n", expected: "lengths=[2, 3, 2]\nsharePrefix=2\nbinary=111\n" },
        { stdin: "1\nhello\n", expected: "lengths=[5]\nsharePrefix=1\nbinary=101\n" },
        { stdin: "4\nx xy xyz y\n", expected: "lengths=[1, 2, 3, 1]\nsharePrefix=3\nbinary=111\n", hidden: true },
      ],
    },
  ],
  "functions-as-values": [
    {
      title: "A pipeline from tokens",
      prompt: `Read an integer \`k\` and \`k\` step names, then lines of text until end of input. Build one \`Function<String, String>\` by composing the steps in order with \`andThen\`: \`upper\` (upper-case), \`trim\`, \`reverse\`, \`repeat2\` (the text twice), \`exclaim\` (append \`!\`). Store the named steps in a \`Map<String, Function<String, String>>\`. Apply the composed function to every line and print the result.

Example: \`2\` then \`trim upper\`, then lines \`  hello \` and \`ok\` →
\`\`\`
HELLO
OK
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String[] first = in.readLine().trim().split("\\s+");
        int k = Integer.parseInt(first[0]);
        String[] steps = in.readLine().trim().split("\\s+");
        Map<String, Function<String, String>> named = new HashMap<>();
        // TODO: register the five steps
        Function<String, String> pipeline = Function.identity();
        // TODO: compose k steps
        String line;
        while ((line = in.readLine()) != null) System.out.println(pipeline.apply(line));
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String[] first = in.readLine().trim().split("\\s+");
        int k = Integer.parseInt(first[0]);
        String[] steps = in.readLine().trim().split("\\s+");
        Map<String, Function<String, String>> named = new HashMap<>();
        named.put("upper", String::toUpperCase);
        named.put("trim", String::trim);
        named.put("reverse", s -> new StringBuilder(s).reverse().toString());
        named.put("repeat2", s -> s + s);
        named.put("exclaim", s -> s + "!");
        Function<String, String> pipeline = Function.identity();
        for (int i = 0; i < k; i++) pipeline = pipeline.andThen(named.get(steps[i]));
        String line;
        while ((line = in.readLine()) != null) System.out.println(pipeline.apply(line));
    }
}
`,
      hints: ["A map from name to function is a tiny plugin registry; the pipeline is a fold over it with andThen.", "Function.identity() is the neutral element to start composing from."],
      cases: [
        { stdin: "2\ntrim upper\n  hello \nok\n", expected: "HELLO\nOK\n" },
        { stdin: "3\nreverse exclaim repeat2\nabc\n", expected: "cba!cba!\n" },
        { stdin: "1\nexclaim\n\nsame\n", expected: "!\nsame!\n", hidden: true },
      ],
    },
  ],
  "nested-lambdas-checkpoint": [
    {
      title: "A command dispatcher",
      prompt: `Build a \`Map<String, Consumer<String[]>>\` of commands, each a lambda operating on a shared \`List<String>\` \`items\`: \`add <x>\` appends, \`del <x>\` removes the first occurrence (printing \`missing <x>\` if absent), \`show\` prints the list, \`count\` prints \`count=<n>\`. An unknown command prints \`unknown <cmd>\`. Read \`n\` command lines and dispatch each by looking it up — no \`switch\` in the loop.

Example: \`5\` then \`add a\`, \`add b\`, \`del c\`, \`show\`, \`count\` →
\`\`\`
missing c
[a, b]
count=2
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(in.readLine().trim());
        List<String> items = new ArrayList<>();
        Map<String, Consumer<String[]>> commands = new HashMap<>();
        // TODO: register add, del, show, count
        for (int i = 0; i < n; i++) {
            String[] parts = in.readLine().trim().split("\\s+");
            // TODO: dispatch
        }
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;
import java.util.function.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(in.readLine().trim());
        List<String> items = new ArrayList<>();
        Map<String, Consumer<String[]>> commands = new HashMap<>();
        commands.put("add", p -> items.add(p[1]));
        commands.put("del", p -> { if (!items.remove(p[1])) System.out.println("missing " + p[1]); });
        commands.put("show", p -> System.out.println(items));
        commands.put("count", p -> System.out.println("count=" + items.size()));
        for (int i = 0; i < n; i++) {
            String[] parts = in.readLine().trim().split("\\s+");
            Consumer<String[]> cmd = commands.get(parts[0]);
            if (cmd == null) System.out.println("unknown " + parts[0]);
            else cmd.accept(parts);
        }
    }
}
`,
      hints: ["Each lambda closes over the same items list — shared state through capture.", "getOrDefault or a null check turns an unknown name into a message instead of an NPE."],
      cases: [
        { stdin: "5\nadd a\nadd b\ndel c\nshow\ncount\n", expected: "missing c\n[a, b]\ncount=2\n" },
        { stdin: "3\nfly x\ncount\nshow\n", expected: "unknown fly\ncount=0\n[]\n" },
        { stdin: "4\nadd x\nadd x\ndel x\nshow\n", expected: "[x]\n", hidden: true },
      ],
    },
  ],
};

export default more;

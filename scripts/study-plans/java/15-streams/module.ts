import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "streams",
  title: "Streams",
  blurb: "The pipeline model, every intermediate and terminal operation, the collectors — groupingBy, toMap, teeing — Optional as a return type, primitive streams, and parallel execution with its rules.",
  icon: "stream",
  overview: `Streams are how modern Java expresses "take these, keep some, transform them, summarise" without a loop body. Most Java written since 2014 has them, most code review comments about Java mention them, and most interview questions about collections end with "now do it with a stream".

This module builds the model first — a lazy pipeline over a source, ending in one terminal — and then takes each layer in turn: the intermediate operations with the flatMap puzzle solved; the terminals with the three forms of reduce and their identity rule; the collectors, from toMap's duplicate-key trap to groupingBy with downstream collectors and teeing; Optional as the honest return type it was meant to be, with the anti-patterns spelled out; the primitive streams that avoid boxing; and parallel streams — how they split the work, what the lambdas must promise, and when they actually help.

By the end you write a pipeline as readily as a loop, choose between them deliberately, and can explain why a wrong reduce identity breaks in parallel — the question that separates people who use streams from people who understand them.`,
  lessons: [
    {
      slug: "stream-basics",
      file: "01-stream-basics.md",
      exercises: [
        {
          title: "Watch the laziness",
          prompt: `Read an integer \`n\` and \`n\` words. Build one pipeline over the list: a \`filter\` that keeps words of **3 or more letters** and prints \`filter <word>\` for every word it examines, then a \`map\` to upper case that prints \`map <word>\` for every word it receives, ending in \`findFirst()\`. Finally print \`first=<the result>\`, or \`first=none\` when nothing survived.

Because the pipeline is lazy and \`findFirst\` short-circuits, the trace stops the moment one word gets through.

Example: \`4\` then \`ab cat dog emu\` →
\`\`\`
filter ab
filter cat
map cat
first=CAT
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        // TODO: one pipeline, ending in findFirst()
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        Optional<String> first = words.stream()
            .filter(w -> { System.out.println("filter " + w); return w.length() >= 3; })
            .map(w -> { System.out.println("map " + w); return w.toUpperCase(); })
            .findFirst();
        System.out.println("first=" + first.orElse("none"));
    }
}
`,
          hints: ["A lambda with a block body can print and then return.", "Elements flow one at a time: the second word is only filtered if the first did not survive."],
          cases: [
            { stdin: "4\nab cat dog emu\n", expected: "filter ab\nfilter cat\nmap cat\nfirst=CAT\n" },
            { stdin: "2\na b\n", expected: "filter a\nfilter b\nfirst=none\n" },
            { stdin: "3\nxy pear fig\n", expected: "filter xy\nfilter pear\nmap pear\nfirst=PEAR\n", hidden: true },
          ],
        },
        {
          title: "One terminal each",
          prompt: `Read an integer \`n\` and \`n\` integers into a list. Print four facts, each computed by **its own stream** over the list (a stream cannot be reused): \`count=<n>\`, \`sum=<sum>\`, \`max=<largest or none>\`, and \`evens=<the even numbers in input order joined by ,>\` (print \`-\` when there are none).

Example: \`5\` then \`3 8 1 8 2\` →
\`\`\`
count=5
sum=22
max=8
evens=8,8,2
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());

        System.out.println("count=" + nums.stream().count());
        System.out.println("sum=" + nums.stream().mapToInt(Integer::intValue).sum());
        System.out.println("max=" + nums.stream().max(Integer::compare).map(String::valueOf).orElse("none"));
        String evens = nums.stream().filter(x -> x % 2 == 0).map(String::valueOf).collect(Collectors.joining(","));
        System.out.println("evens=" + (evens.isEmpty() ? "-" : evens));
    }
}
`,
          hints: ["Call nums.stream() once per fact.", "max returns an Optional; map it to a String before orElse so both branches have the same type."],
          cases: [
            { stdin: "5\n3 8 1 8 2\n", expected: "count=5\nsum=22\nmax=8\nevens=8,8,2\n" },
            { stdin: "0\n", expected: "count=0\nsum=0\nmax=none\nevens=-\n" },
            { stdin: "3\n7 5 9\n", expected: "count=3\nsum=21\nmax=9\nevens=-\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`list.stream().map(this::save);` — how many elements are saved?",
          options: ["All of them", "None: there is no terminal operation, so nothing runs", "The first one", "It does not compile"],
          answer: 1,
          explanation: "Intermediate operations are lazy. Without a terminal such as `forEach`, `toList` or `count`, the pipeline is never executed.",
        },
        {
          prompt: "Predict the output:\n```java\nStream<String> s = Stream.of(\"a\", \"b\");\nSystem.out.println(s.count());\nSystem.out.println(s.count());\n```",
          options: ["`2` then `2`", "`2` then `IllegalStateException`", "`2` then `0`", "Compile error"],
          answer: 1,
          explanation: "A stream can be consumed once. The second terminal operation throws `IllegalStateException: stream has already been operated upon or closed`.",
        },
        {
          prompt: "Why does `Stream.iterate(1, x -> x * 2).limit(10).toList()` terminate although the source is infinite?",
          options: ["`iterate` secretly produces only 10 elements", "Elements are pulled one at a time and `limit` stops requesting after ten", "The JIT detects the loop", "It does not terminate"],
          answer: 1,
          explanation: "Laziness plus short-circuiting: the terminal pulls, `limit` stops pulling after ten, so the generator is asked for exactly ten values.",
        },
        {
          prompt: "Which lambda breaks the rules for stream operations?",
          options: ["`filter(w -> w.length() > 3)`", "`map(w -> { seen.add(w); return w; })` where `seen` is an outside list", "`map(String::trim)`", "`sorted(Comparator.reverseOrder())`"],
          answer: 1,
          explanation: "Side effects belong in `forEach`/`peek`, not `map`. With a parallel stream this races on the list; use `collect`.",
        },
        {
          prompt: "`sorted()` on an infinite stream…",
          options: ["Sorts the first 1000 elements", "Never returns: a stateful operation must see every element first", "Throws immediately", "Is optimised away"],
          answer: 1,
          explanation: "`sorted` and `distinct` are stateful barriers; they cannot emit anything until the source is exhausted.",
        },
      ],
    },
    {
      slug: "intermediate-operations",
      file: "02-intermediate-operations.md",
      exercises: [
        {
          title: "Flatten the playlists",
          prompt: `Read an integer \`n\` and \`n\` lines of the form \`name:song1,song2,...\`. Using \`flatMap\`, \`distinct\` and \`sorted\`, print every distinct song across all playlists in natural order, one per line, then \`total=<sum of all playlist lengths> distinct=<number of distinct songs>\`.

Example: \`2\` then \`ann:a,b,c\` and \`bob:c,d\` →
\`\`\`
a
b
c
d
total=5 distinct=4
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        List<List<String>> playlists = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String line = in.nextLine();
            String[] songs = line.substring(line.indexOf(':') + 1).split(",");
            playlists.add(Arrays.asList(songs));
        }
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = Integer.parseInt(in.nextLine().trim());
        List<List<String>> playlists = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String line = in.nextLine();
            String[] songs = line.substring(line.indexOf(':') + 1).split(",");
            playlists.add(Arrays.asList(songs));
        }

        List<String> distinct = playlists.stream().flatMap(List::stream).distinct().sorted().toList();
        distinct.forEach(System.out::println);
        int total = playlists.stream().mapToInt(List::size).sum();
        System.out.println("total=" + total + " distinct=" + distinct.size());
    }
}
`,
          hints: ["flatMap(List::stream) turns Stream<List<String>> into Stream<String>.", "mapToInt(List::size).sum() for the total — a separate stream."],
          cases: [
            { stdin: "2\nann:a,b,c\nbob:c,d\n", expected: "a\nb\nc\nd\ntotal=5 distinct=4\n" },
            { stdin: "1\nsolo:zz\n", expected: "zz\ntotal=1 distinct=1\n" },
            { stdin: "3\nx:hey,jude\ny:jude,hey\nz:let,it,be\n", expected: "be\nhey\nit\njude\nlet\ntotal=7 distinct=5\n", hidden: true },
          ],
        },
        {
          title: "Slice and window",
          prompt: `Read an integer \`n\`, \`n\` integers, then an integer \`k\`. Print four lines, each a space-joined list (print \`-\` for an empty one):

- \`top=\` the \`k\` largest values, largest first (\`sorted\` with \`Comparator.reverseOrder()\` then \`limit\`).
- \`rest=\` the input **after skipping** its first \`k\` elements, in input order.
- \`prefix=\` the leading run of **positive** values (\`takeWhile\`).
- \`tail=\` everything from the first non-positive value on (\`dropWhile\`).

Example: \`6\` then \`3 -1 4 1 -5 9\` then \`2\` →
\`\`\`
top=9 4
rest=4 1 -5 9
prefix=3
tail=-1 4 1 -5 9
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    static String show(Stream<Integer> s) {
        String joined = s.map(String::valueOf).collect(Collectors.joining(" "));
        return joined.isEmpty() ? "-" : joined;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());
        int k = in.nextInt();
        // TODO: four lines
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    static String show(Stream<Integer> s) {
        String joined = s.map(String::valueOf).collect(Collectors.joining(" "));
        return joined.isEmpty() ? "-" : joined;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());
        int k = in.nextInt();

        System.out.println("top=" + show(nums.stream().sorted(Comparator.reverseOrder()).limit(k)));
        System.out.println("rest=" + show(nums.stream().skip(k)));
        System.out.println("prefix=" + show(nums.stream().takeWhile(x -> x > 0)));
        System.out.println("tail=" + show(nums.stream().dropWhile(x -> x > 0)));
    }
}
`,
          hints: ["Each line is its own stream from nums.", "takeWhile stops at the first failing element; dropWhile starts there."],
          cases: [
            { stdin: "6\n3 -1 4 1 -5 9\n2\n", expected: "top=9 4\nrest=4 1 -5 9\nprefix=3\ntail=-1 4 1 -5 9\n" },
            { stdin: "3\n5 6 7\n5\n", expected: "top=7 6 5\nrest=-\nprefix=5 6 7\ntail=-\n" },
            { stdin: "4\n-2 8 8 1\n1\n", expected: "top=8\nrest=8 8 1\nprefix=-\ntail=-2 8 8 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`sentences.stream().map(s -> Arrays.stream(s.split(\" \")))` has the type…",
          options: ["`Stream<String>`", "`Stream<Stream<String>>` — you wanted `flatMap`", "`Stream<String[]>`", "Compile error"],
          answer: 1,
          explanation: "`map` wraps whatever the function returns. A function returning a stream needs `flatMap` to splice the inner streams together.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(Stream.of(5, 1, 4, 1).distinct().sorted().skip(1).toList());\n```",
          options: ["`[1, 4, 5]`", "`[4, 5]`", "`[1, 1, 4]`", "`[5, 4]`"],
          answer: 1,
          explanation: "`distinct` → 5, 1, 4; `sorted` → 1, 4, 5; `skip(1)` drops the 1.",
        },
        {
          prompt: "`takeWhile(x -> x > 0)` on `3, 2, -1, 5` yields…",
          options: ["`3, 2, 5` — every positive", "`3, 2` — it stops at the first failure", "`5`", "`3, 2, -1`"],
          answer: 1,
          explanation: "`takeWhile` is a prefix operation, not a filter: once the predicate fails, nothing further is taken.",
        },
        {
          prompt: "Which intermediate operations are stateful?",
          options: ["`map` and `filter`", "`sorted` and `distinct`", "`peek` and `limit`", "`mapToInt` and `boxed`"],
          answer: 1,
          explanation: "They must buffer or remember elements; `limit`/`skip` are bounded and `map`/`filter` are per-element.",
        },
        {
          prompt: "`peek(System.out::println)` prints nothing in `List.of(1,2,3).stream().peek(...).count()` on Java 9+ because…",
          options: ["`peek` is deprecated", "The count is known from the source, so the pipeline is skipped", "`peek` runs only in parallel", "`List.of` streams are empty"],
          answer: 1,
          explanation: "An optimisation: with a sized source and no filtering, `count()` need not traverse. Never rely on `peek` for side effects.",
        },
      ],
    },
    {
      slug: "terminal-operations",
      file: "03-terminal-operations.md",
      exercises: [
        {
          title: "Fold the ledger",
          prompt: `Read an integer \`n\` and \`n\` signed integers (deposits positive, withdrawals negative). Using terminal operations only — no loops — print:

- \`balance=\` the sum via \`reduce(0, Integer::sum)\`
- \`largestDeposit=\` the largest positive value, or \`none\`
- \`firstWithdrawal=\` the first negative value in input order, or \`none\`
- \`allDeposits=\` whether every value is positive (\`allMatch\`)
- \`deposits=\` how many values are positive

Note what \`allMatch\` says about an empty ledger.

Example: \`5\` then \`100 -30 45 -80 5\` →
\`\`\`
balance=40
largestDeposit=100
firstWithdrawal=-30
allDeposits=false
deposits=3
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> tx = new ArrayList<>();
        for (int i = 0; i < n; i++) tx.add(in.nextInt());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> tx = new ArrayList<>();
        for (int i = 0; i < n; i++) tx.add(in.nextInt());

        System.out.println("balance=" + tx.stream().reduce(0, Integer::sum));
        System.out.println("largestDeposit=" + tx.stream().filter(x -> x > 0).max(Integer::compare).map(String::valueOf).orElse("none"));
        System.out.println("firstWithdrawal=" + tx.stream().filter(x -> x < 0).findFirst().map(String::valueOf).orElse("none"));
        System.out.println("allDeposits=" + tx.stream().allMatch(x -> x > 0));
        System.out.println("deposits=" + tx.stream().filter(x -> x > 0).count());
    }
}
`,
          hints: ["filter then max / findFirst; both return Optional.", "allMatch on an empty stream is true — vacuous truth."],
          cases: [
            { stdin: "5\n100 -30 45 -80 5\n", expected: "balance=40\nlargestDeposit=100\nfirstWithdrawal=-30\nallDeposits=false\ndeposits=3\n" },
            { stdin: "0\n", expected: "balance=0\nlargestDeposit=none\nfirstWithdrawal=none\nallDeposits=true\ndeposits=0\n" },
            { stdin: "3\n10 20 30\n", expected: "balance=60\nlargestDeposit=30\nfirstWithdrawal=none\nallDeposits=true\ndeposits=3\n", hidden: true },
          ],
        },
        {
          title: "Longest word, three ways",
          prompt: `Read an integer \`n\` and \`n\` words (\`n ≥ 1\`). Print:

- \`firstLongest=\` the longest word, **first** among ties — use \`max\` with \`Comparator.comparingInt(String::length)\`.
- \`lastLongest=\` the longest word, **last** among ties — use the one-argument \`reduce\` with a tie rule that prefers the later word.
- \`letters=\` the total number of letters — use the three-argument \`reduce(0, (len, w) -> …, Integer::sum)\`.

Example: \`4\` then \`fig pear kiwi plum\` →
\`\`\`
firstLongest=pear
lastLongest=plum
letters=15
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

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
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        String first = words.stream().max(Comparator.comparingInt(String::length)).orElseThrow();
        String last = words.stream().reduce((a, b) -> b.length() >= a.length() ? b : a).orElseThrow();
        int letters = words.stream().reduce(0, (len, w) -> len + w.length(), Integer::sum);
        System.out.println("firstLongest=" + first);
        System.out.println("lastLongest=" + last);
        System.out.println("letters=" + letters);
    }
}
`,
          hints: ["max keeps the current best unless the new element is strictly greater — so the first of equals wins.", "In reduce((a, b) -> …), prefer b on >= to let the later word win."],
          cases: [
            { stdin: "4\nfig pear kiwi plum\n", expected: "firstLongest=pear\nlastLongest=plum\nletters=15\n" },
            { stdin: "1\nsolo\n", expected: "firstLongest=solo\nlastLongest=solo\nletters=4\n" },
            { stdin: "5\na bb cc d ee\n", expected: "firstLongest=bb\nlastLongest=ee\nletters=8\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Stream.<Integer>empty().reduce(Integer::sum)` returns…",
          options: ["`0`", "`Optional.empty()`", "`null`", "Throws `NoSuchElementException`"],
          answer: 1,
          explanation: "The one-argument `reduce` has no identity to fall back on, so an empty stream yields an empty `Optional`.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(Stream.of(1, 2, 3).parallel().reduce(1, Integer::sum));\n```",
          options: ["Always `7`", "`7` sequentially but possibly `8`, `9` or `10` in parallel — 1 is not the identity of addition", "Always `6`", "Compile error"],
          answer: 1,
          explanation: "Each parallel chunk starts from the identity. A wrong identity is added once per chunk, so the answer depends on how the stream was split.",
        },
        {
          prompt: "`allMatch(p)` on an empty stream returns…",
          options: ["`false`", "`true`", "Throws", "`null`"],
          answer: 1,
          explanation: "Vacuous truth: there is no element for which the predicate fails. `anyMatch` on the same stream is `false`.",
        },
        {
          prompt: "`findFirst` versus `findAny` in a sequential stream…",
          options: ["`findAny` is random", "They return the same element; the difference matters only in parallel", "`findFirst` scans everything", "`findAny` returns the last"],
          answer: 1,
          explanation: "Sequentially both stop at the first survivor. In parallel `findAny` may return any survivor and is faster.",
        },
        {
          prompt: "Why should `reduce` never accumulate into an `ArrayList`?",
          options: ["Lists cannot be reduced", "`reduce` assumes immutable values; a mutated accumulator is shared between parallel chunks — that job is `collect`'s", "It is slower", "The compiler forbids it"],
          answer: 1,
          explanation: "`collect` has a supplier and a combiner precisely so each chunk gets its own container.",
        },
      ],
    },
    {
      slug: "collectors",
      file: "04-collectors.md",
      exercises: [
        {
          title: "Group the roster",
          prompt: `Read an integer \`n\` and \`n\` lines \`name city age\`. Using \`groupingBy\` into a \`TreeMap\` with downstream collectors, print for every city in natural order:

\`<city>: n=<people> avg=<average age, one decimal> names=<names in natural order joined by ,>\`

Then, using \`partitioningBy\` (both keys are always present), print \`adults=<count of age ≥ 18> minors=<count of age < 18>\`.

Example: \`3\` then \`ann oslo 30\`, \`bob oslo 20\`, \`cy rome 12\` →
\`\`\`
oslo: n=2 avg=25.0 names=ann,bob
rome: n=1 avg=12.0 names=cy
adults=2 minors=1
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

record Person(String name, String city, int age) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Person> people = new ArrayList<>();
        for (int i = 0; i < n; i++) people.add(new Person(in.next(), in.next(), in.nextInt()));
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

record Person(String name, String city, int age) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Person> people = new ArrayList<>();
        for (int i = 0; i < n; i++) people.add(new Person(in.next(), in.next(), in.nextInt()));

        Map<String, List<Person>> byCity = people.stream().collect(groupingBy(Person::city, TreeMap::new, toList()));
        Map<String, Double> avg = people.stream().collect(groupingBy(Person::city, averagingInt(Person::age)));
        Map<String, List<String>> names = people.stream().collect(groupingBy(Person::city, mapping(Person::name, toList())));
        for (String city : byCity.keySet()) {
            List<String> sorted = names.get(city).stream().sorted().toList();
            System.out.println(String.format(Locale.ROOT, "%s: n=%d avg=%.1f names=%s", city, byCity.get(city).size(), avg.get(city), String.join(",", sorted)));
        }
        Map<Boolean, Long> split = people.stream().collect(partitioningBy(p -> p.age() >= 18, counting()));
        System.out.println("adults=" + split.get(true) + " minors=" + split.get(false));
    }
}
`,
          hints: ["groupingBy(Person::city, TreeMap::new, downstream) sorts the cities.", "String.format with Locale.ROOT keeps the decimal point a dot."],
          cases: [
            { stdin: "3\nann oslo 30\nbob oslo 20\ncy rome 12\n", expected: "oslo: n=2 avg=25.0 names=ann,bob\nrome: n=1 avg=12.0 names=cy\nadults=2 minors=1\n" },
            { stdin: "2\nzed pune 40\namy pune 41\n", expected: "pune: n=2 avg=40.5 names=amy,zed\nadults=2 minors=0\n" },
            { stdin: "4\nd b 10\nc a 17\nb b 18\na a 9\n", expected: "a: n=2 avg=13.0 names=a,c\nb: n=2 avg=14.0 names=b,d\nadults=1 minors=3\n", hidden: true },
          ],
        },
        {
          title: "toMap without the traps",
          prompt: `Read an integer \`n\` and \`n\` words. Print:

1. One line per first letter, in letter order: \`<letter>=<words starting with it, in input order, joined by +>\` — a \`toMap\` whose **merge function** joins duplicates and whose map supplier is \`TreeMap::new\`.
2. \`lengths=\` the \`toString\` of a \`LinkedHashMap\` from each **distinct** word to its length, first occurrence wins (a four-argument \`toMap\`).
3. \`csv=\` the distinct words in natural order, \`joining(", ", "[", "]")\`.

Example: \`4\` then \`apple bean avocado bean\` →
\`\`\`
a=apple+avocado
b=bean+bean
lengths={apple=5, bean=4, avocado=7}
csv=[apple, avocado, bean]
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

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
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());

        Map<Character, String> byInitial = words.stream()
            .collect(toMap(w -> w.charAt(0), w -> w, (a, b) -> a + "+" + b, TreeMap::new));
        byInitial.forEach((k, v) -> System.out.println(k + "=" + v));

        Map<String, Integer> lengths = words.stream()
            .collect(toMap(w -> w, String::length, (a, b) -> a, LinkedHashMap::new));
        System.out.println("lengths=" + lengths);

        System.out.println("csv=" + words.stream().distinct().sorted().collect(joining(", ", "[", "]")));
    }
}
`,
          hints: ["Without a merge function the duplicate key throws IllegalStateException.", "The fourth toMap argument names the map type; LinkedHashMap keeps first-seen order."],
          cases: [
            { stdin: "4\napple bean avocado bean\n", expected: "a=apple+avocado\nb=bean+bean\nlengths={apple=5, bean=4, avocado=7}\ncsv=[apple, avocado, bean]\n" },
            { stdin: "1\nzoo\n", expected: "z=zoo\nlengths={zoo=3}\ncsv=[zoo]\n" },
            { stdin: "3\nkiwi kale kiwi\n", expected: "k=kiwi+kale+kiwi\nlengths={kiwi=4, kale=4}\ncsv=[kale, kiwi]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`words.stream().collect(toMap(w -> w, String::length))` with a repeated word…",
          options: ["Keeps the first", "Keeps the last", "Throws `IllegalStateException: Duplicate key`", "Stores a list"],
          answer: 2,
          explanation: "Supply a merge function — `(a, b) -> a` — or count with `Integer::sum`.",
        },
        {
          prompt: "`groupingBy(String::length)` returns…",
          options: ["`Map<Integer, String>`", "`Map<Integer, List<String>>`", "`Map<String, Integer>`", "`List<List<String>>`"],
          answer: 1,
          explanation: "The default downstream is `toList()`; replace it with `counting()`, `mapping(...)`, etc.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(Stream.of(2, 4).collect(partitioningBy(x -> x % 2 == 1)));\n```",
          options: ["`{false=[2, 4]}`", "`{false=[2, 4], true=[]}`", "`{true=[]}`", "`{}`"],
          answer: 1,
          explanation: "`partitioningBy` always has both keys, even when one side is empty; `groupingBy` on the same boolean would omit `true`.",
        },
        {
          prompt: "Which collector computes two facts over the same elements in one pass?",
          options: ["`collectingAndThen`", "`teeing`", "`reducing`", "`summarizingInt` only"],
          answer: 1,
          explanation: "`teeing(c1, c2, merger)` (Java 12) runs both collectors and merges their results.",
        },
        {
          prompt: "`joining(\", \")` requires the stream elements to be…",
          options: ["`Integer`", "`CharSequence` (map with `String::valueOf` first otherwise)", "`Object`", "`Comparable`"],
          answer: 1,
          explanation: "`joining` concatenates `CharSequence`s; other types need a `map` first.",
        },
        {
          prompt: "Why is mutating a container inside `collect` fine but inside `reduce` wrong?",
          options: ["It is not fine in either", "A collector has a supplier and a combiner, so each parallel chunk gets its own container and they are merged", "`collect` is always sequential", "`reduce` cannot see lists"],
          answer: 1,
          explanation: "The `Collector` contract is designed around mutable accumulation; `reduce` is designed around immutable values.",
        },
      ],
    },
    {
      slug: "optional",
      file: "05-optional.md",
      exercises: [
        {
          title: "Lookup ladder",
          prompt: `Read an integer \`n\` and \`n\` lines \`key value\` into a map, then an integer \`m\` and \`m\` query keys. For each query print \`<key> -> <value>\` when the key exists and \`<key> -> (none)\` otherwise, going through \`Optional.ofNullable(map.get(key))\` — no \`if\`, no \`containsKey\`. Compute the default with \`orElseGet\` and a supplier that **increments a counter** every time it runs; after the queries print \`defaults=<counter>\`. The counter proves that \`orElseGet\` is evaluated only for the misses.

Example: \`2\` then \`a 1\`, \`b 2\`, then \`3\` then \`a x b\` →
\`\`\`
a -> 1
x -> (none)
b -> 2
defaults=1
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static int defaults = 0;

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, String> map = new HashMap<>();
        for (int i = 0; i < n; i++) map.put(in.next(), in.next());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String key = in.next();
            // TODO: Optional.ofNullable(map.get(key)) … orElseGet
        }
        System.out.println("defaults=" + defaults);
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static int defaults = 0;

    static String fallback() {
        defaults++;
        return "(none)";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Map<String, String> map = new HashMap<>();
        for (int i = 0; i < n; i++) map.put(in.next(), in.next());
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            String key = in.next();
            String shown = Optional.ofNullable(map.get(key)).orElseGet(Main::fallback);
            System.out.println(key + " -> " + shown);
        }
        System.out.println("defaults=" + defaults);
    }
}
`,
          hints: ["A static method that bumps the counter and returns \"(none)\" is a perfectly good Supplier.", "Had you used orElse(fallback()), the counter would equal m — every call evaluates its argument."],
          cases: [
            { stdin: "2\na 1\nb 2\n3\na x b\n", expected: "a -> 1\nx -> (none)\nb -> 2\ndefaults=1\n" },
            { stdin: "1\nk v\n2\nq r\n", expected: "q -> (none)\nr -> (none)\ndefaults=2\n" },
            { stdin: "2\np 9\nq 8\n2\np q\n", expected: "p -> 9\nq -> 8\ndefaults=0\n", hidden: true },
          ],
        },
        {
          title: "Chain through the empties",
          prompt: `Read an integer \`n\` and \`n\` records \`name city zip\`, where \`-\` means the field is missing. For each record print \`<name>: <result>\`, where the result comes from **one Optional chain** and no \`if\`:

start from \`Optional.ofNullable(city)\` (treat \`-\` as null), \`flatMap\` to the zip (again \`-\` is empty), \`filter\` to zips of exactly **5 digits**, \`map\` to \`"<CITY in upper case> <zip>"\`, and \`orElse("unknown")\`.

Finally print \`located=<how many records produced a value>\` — count them with \`Optional::stream\` in a \`flatMap\`, not with a counter.

Example: \`3\` then \`ann oslo 01234\`, \`bob - 99999\`, \`cy rome 12\` →
\`\`\`
ann: OSLO 01234
bob: unknown
cy: unknown
located=1
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

record Rec(String name, String city, String zip) { }

public class Main {
    static String orNull(String s) { return s.equals("-") ? null : s; }

    static Optional<String> locate(Rec r) {
        // TODO: one chain
        return Optional.empty();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Rec> recs = new ArrayList<>();
        for (int i = 0; i < n; i++) recs.add(new Rec(in.next(), orNull(in.next()), orNull(in.next())));
        for (Rec r : recs) System.out.println(r.name() + ": " + locate(r).orElse("unknown"));
        // TODO: located=
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

record Rec(String name, String city, String zip) { }

public class Main {
    static String orNull(String s) { return s.equals("-") ? null : s; }

    static Optional<String> locate(Rec r) {
        return Optional.ofNullable(r.city())
            .flatMap(city -> Optional.ofNullable(r.zip()).map(zip -> new String[] { city, zip }))
            .filter(pair -> pair[1].matches("\\d{5}"))
            .map(pair -> pair[0].toUpperCase() + " " + pair[1]);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Rec> recs = new ArrayList<>();
        for (int i = 0; i < n; i++) recs.add(new Rec(in.next(), orNull(in.next()), orNull(in.next())));
        for (Rec r : recs) System.out.println(r.name() + ": " + locate(r).orElse("unknown"));
        long located = recs.stream().map(Main::locate).flatMap(Optional::stream).count();
        System.out.println("located=" + located);
    }
}
`,
          hints: ["flatMap when the function itself returns an Optional; carry both values through with a small array or a record.", "flatMap(Optional::stream) drops the empties, then count."],
          cases: [
            { stdin: "3\nann oslo 01234\nbob - 99999\ncy rome 12\n", expected: "ann: OSLO 01234\nbob: unknown\ncy: unknown\nlocated=1\n" },
            { stdin: "2\nx pune 41100\ny pune -\n", expected: "x: PUNE 41100\ny: unknown\nlocated=1\n" },
            { stdin: "3\na b 12345\nc d 54321\ne f 1234a\n", expected: "a: B 12345\nc: D 54321\ne: unknown\nlocated=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Optional.of(null)`…",
          options: ["Returns an empty Optional", "Throws `NullPointerException`", "Returns `Optional[null]`", "Does not compile"],
          answer: 1,
          explanation: "`of` asserts the value is present; `ofNullable` is the bridge from a nullable value.",
        },
        {
          prompt: "`opt.orElse(load())` versus `opt.orElseGet(() -> load())`: when is `load()` called?",
          options: ["Both: only when empty", "`orElse`: always; `orElseGet`: only when empty", "Both: always", "`orElse`: never"],
          answer: 1,
          explanation: "Method arguments are evaluated before the call. `orElse` receives an already-computed value.",
        },
        {
          prompt: "Which is the correct idiom to convert a `List<Optional<T>>` into the present values?",
          options: ["`.map(Optional::get)`", "`.flatMap(Optional::stream)`", "`.filter(Optional::isEmpty)`", "`.map(Optional::orElseThrow)`"],
          answer: 1,
          explanation: "`Optional.stream()` yields zero or one element, so `flatMap` drops the empties without a `get`.",
        },
        {
          prompt: "Where does `Optional` **not** belong?",
          options: ["As the return type of `findById`", "As a class field or a method parameter", "As the result of `Stream.max`", "As the return type of a cache lookup"],
          answer: 1,
          explanation: "It is not serialisable, forces wrapping on every caller, and the class already controls access to its own fields.",
        },
        {
          prompt: "Predict the output:\n```java\nOptional<String> o = Optional.of(\"hi\").filter(s -> s.length() > 5).map(String::toUpperCase);\nSystem.out.println(o.isPresent() + \" \" + o.orElse(\"-\"));\n```",
          options: ["`true HI`", "`false -`", "`true hi`", "Throws"],
          answer: 1,
          explanation: "The filter fails, the Optional becomes empty, `map` is skipped, and `orElse` supplies the dash.",
        },
      ],
    },
    {
      slug: "primitive-streams",
      file: "06-primitive-streams.md",
      exercises: [
        {
          title: "Statistics in one pass",
          prompt: `Read an integer \`n\` (\`n ≥ 1\`), \`n\` integers, then an integer \`k\` (\`0 ≤ k ≤ 20\`). Using \`IntStream\`/\`LongStream\`:

- \`stats=\` count, sum, min, max and average (two decimals) from **one** \`summaryStatistics()\` call, formatted \`count=<c> sum=<s> min=<lo> max=<hi> avg=<a>\`.
- \`evenSquares=\` the sum of the squares of the even values.
- \`factorial=\` \`k!\` computed with \`LongStream.rangeClosed(1, k)\` and \`reduce\` — \`0!\` is \`1\`.

Example: \`4\` then \`3 8 1 6\` then \`5\` →
\`\`\`
stats=count=4 sum=18 min=1 max=8 avg=4.50
evenSquares=100
factorial=120
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();

        IntSummaryStatistics st = Arrays.stream(a).summaryStatistics();
        System.out.println(String.format(Locale.ROOT, "stats=count=%d sum=%d min=%d max=%d avg=%.2f",
            st.getCount(), st.getSum(), st.getMin(), st.getMax(), st.getAverage()));
        long evenSquares = Arrays.stream(a).filter(x -> x % 2 == 0).mapToLong(x -> (long) x * x).sum();
        System.out.println("evenSquares=" + evenSquares);
        long factorial = LongStream.rangeClosed(1, k).reduce(1, (x, y) -> x * y);
        System.out.println("factorial=" + factorial);
    }
}
`,
          hints: ["Arrays.stream(int[]) is already an IntStream.", "rangeClosed(1, 0) is empty, so reduce returns the identity 1 — exactly 0!."],
          cases: [
            { stdin: "4\n3 8 1 6\n5\n", expected: "stats=count=4 sum=18 min=1 max=8 avg=4.50\nevenSquares=100\nfactorial=120\n" },
            { stdin: "1\n7\n0\n", expected: "stats=count=1 sum=7 min=7 max=7 avg=7.00\nevenSquares=0\nfactorial=1\n" },
            { stdin: "3\n-4 2 5\n20\n", expected: "stats=count=3 sum=3 min=-4 max=5 avg=1.00\nevenSquares=20\nfactorial=2432902008176640000\n", hidden: true },
          ],
        },
        {
          title: "Character census",
          prompt: `Read one line of text. Using \`chars()\` pipelines (no index loops), print:

- \`letters=\` how many characters are letters, \`digits=\` how many are digits, \`vowels=\` how many are vowels (\`aeiou\`, either case).
- \`upper=\` the text in upper case, rebuilt from the stream with \`mapToObj\` and \`joining\`.
- \`freq=\` the \`toString\` of a \`TreeMap<Character, Long>\` counting each **lower-cased letter**.

Example: \`Hi there, 42!\` →
\`\`\`
letters=7 digits=2 vowels=3
upper=HI THERE, 42!
freq={e=2, h=2, i=1, r=1, t=1}
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : "";
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : "";

        long letters = s.chars().filter(Character::isLetter).count();
        long digits = s.chars().filter(Character::isDigit).count();
        long vowels = s.chars().filter(c -> "aeiouAEIOU".indexOf(c) >= 0).count();
        System.out.println("letters=" + letters + " digits=" + digits + " vowels=" + vowels);

        String upper = s.chars().mapToObj(c -> String.valueOf((char) Character.toUpperCase(c))).collect(joining());
        System.out.println("upper=" + upper);

        Map<Character, Long> freq = s.chars().filter(Character::isLetter)
            .mapToObj(c -> (char) Character.toLowerCase(c))
            .collect(groupingBy(c -> c, TreeMap::new, counting()));
        System.out.println("freq=" + freq);
    }
}
`,
          hints: ["chars() gives ints; cast to (char) when you need a Character for a collector.", "groupingBy(c -> c, TreeMap::new, counting()) sorts the keys."],
          cases: [
            { stdin: "Hi there, 42!\n", expected: "letters=7 digits=2 vowels=3\nupper=HI THERE, 42!\nfreq={e=2, h=2, i=1, r=1, t=1}\n" },
            { stdin: "2024\n", expected: "letters=0 digits=4 vowels=0\nupper=2024\nfreq={}\n" },
            { stdin: "Aa Bb\n", expected: "letters=4 digits=0 vowels=2\nupper=AA BB\nfreq={a=2, b=2}\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Arrays.stream(new int[]{1, 2, 3})` has the type…",
          options: ["`Stream<Integer>`", "`IntStream`", "`Stream<int[]>`", "`List<Integer>`"],
          answer: 1,
          explanation: "An `int[]` gives an `IntStream`; an `Integer[]` would give `Stream<Integer>`.",
        },
        {
          prompt: "`IntStream.empty().average()` and `IntStream.empty().sum()` return…",
          options: ["`0.0` and `0`", "`OptionalDouble.empty()` and `0`", "Both throw", "`NaN` and `0`"],
          answer: 1,
          explanation: "The average of nothing is undefined, hence the Optional; the sum of nothing is zero.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(\"abc\".chars().map(c -> c + 1).mapToObj(c -> String.valueOf((char) c)).collect(Collectors.joining()));\n```",
          options: ["`abc`", "`bcd`", "`98 99 100`", "Compile error"],
          answer: 1,
          explanation: "`chars()` yields code units, `+1` shifts each, and the cast back to `char` rebuilds the text.",
        },
        {
          prompt: "To use `groupingBy` on an `IntStream` you must first call…",
          options: ["`sum()`", "`boxed()` (or `mapToObj`)", "`parallel()`", "`toArray()`"],
          answer: 1,
          explanation: "Collectors operate on object streams; the primitive streams have no `collect(Collector)`.",
        },
        {
          prompt: "`IntStream.rangeClosed(1, 20).reduce(1, (a, b) -> a * b)` gives a wrong answer because…",
          options: ["`reduce` needs an Optional", "`20!` overflows `int` silently — use `LongStream`", "`rangeClosed` excludes 20", "The identity should be 0"],
          answer: 1,
          explanation: "Integer overflow wraps without warning. `LongStream` holds 20! (about 2.4 × 10¹⁸); beyond 20! you need `BigInteger`.",
        },
      ],
    },
    {
      slug: "parallel-and-performance",
      file: "07-parallel-and-performance.md",
      exercises: [
        {
          title: "Parallel, but correct",
          prompt: `Read an integer \`n\`, \`n\` integers, and a threshold \`t\`. Compute every answer on a **parallel** stream, choosing operations whose results do not depend on scheduling:

- \`sum=\` via \`reduce(0, Integer::sum)\` (a true identity, an associative operation).
- \`squares=\` the squares in **input order**, collected with \`toList()\` — encounter order is preserved even in parallel.
- \`over=\` how many values exceed \`t\`.
- \`firstOver=\` the first value in input order that exceeds \`t\` (\`findFirst\`, not \`findAny\`), or \`none\`.

Example: \`5\` then \`4 9 2 7 5\` then \`6\` →
\`\`\`
sum=27
squares=[16, 81, 4, 49, 25]
over=2
firstOver=9
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());
        int t = in.nextInt();
        // TODO: every pipeline starts with nums.parallelStream()
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < n; i++) nums.add(in.nextInt());
        int t = in.nextInt();

        System.out.println("sum=" + nums.parallelStream().reduce(0, Integer::sum));
        System.out.println("squares=" + nums.parallelStream().map(x -> x * x).toList());
        System.out.println("over=" + nums.parallelStream().filter(x -> x > t).count());
        System.out.println("firstOver=" + nums.parallelStream().filter(x -> x > t).findFirst().map(String::valueOf).orElse("none"));
    }
}
`,
          hints: ["toList() respects encounter order, so the squares come out in input order.", "findFirst is deterministic in parallel; findAny is not."],
          cases: [
            { stdin: "5\n4 9 2 7 5\n6\n", expected: "sum=27\nsquares=[16, 81, 4, 49, 25]\nover=2\nfirstOver=9\n" },
            { stdin: "3\n1 2 3\n10\n", expected: "sum=6\nsquares=[1, 4, 9]\nover=0\nfirstOver=none\n" },
            { stdin: "4\n10 -3 8 8\n7\n", expected: "sum=23\nsquares=[100, 9, 64, 64]\nover=3\nfirstOver=10\n", hidden: true },
          ],
        },
        {
          title: "How a combiner thinks",
          prompt: `Simulate the way a parallel reduction splits work. Read an integer \`n\`, \`n\` integers, and a chunk size \`c\`. Split the input into consecutive chunks of \`c\` (the last may be shorter). Using \`IntStream.range\` over the chunk indices and \`Arrays.stream(a, from, to)\` for each chunk, print one line per chunk \`chunk <i>: <sum>\`, then \`combined=<sum of the chunk sums>\`, then \`direct=<sum of the whole array>\` — the two totals agree because addition is associative with identity 0.

Example: \`5\` then \`1 2 3 4 5\` then \`2\` →
\`\`\`
chunk 0: 3
chunk 1: 7
chunk 2: 5
combined=15
direct=15
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int c = in.nextInt();
        int chunks = (n + c - 1) / c;
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int c = in.nextInt();
        int chunks = (n + c - 1) / c;

        int[] partial = IntStream.range(0, chunks)
            .map(i -> Arrays.stream(a, i * c, Math.min(n, (i + 1) * c)).sum())
            .toArray();
        IntStream.range(0, chunks).forEach(i -> System.out.println("chunk " + i + ": " + partial[i]));
        System.out.println("combined=" + Arrays.stream(partial).reduce(0, Integer::sum));
        System.out.println("direct=" + Arrays.stream(a).sum());
    }
}
`,
          hints: ["Arrays.stream(array, from, to) streams a slice.", "Math.min(n, (i + 1) * c) clips the last chunk."],
          cases: [
            { stdin: "5\n1 2 3 4 5\n2\n", expected: "chunk 0: 3\nchunk 1: 7\nchunk 2: 5\ncombined=15\ndirect=15\n" },
            { stdin: "3\n10 20 30\n5\n", expected: "chunk 0: 60\ncombined=60\ndirect=60\n" },
            { stdin: "6\n-1 -1 2 2 3 -8\n3\n", expected: "chunk 0: 0\nchunk 1: -3\ncombined=-3\ndirect=-3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Parallel streams run their tasks on…",
          options: ["A new thread per element", "The common `ForkJoinPool`, shared by the whole JVM", "The main thread only", "A dedicated pool per stream"],
          answer: 1,
          explanation: "Which is why a blocking lambda in one parallel stream can starve every other parallel stream and `CompletableFuture` in the process.",
        },
        {
          prompt: "`list.parallelStream().forEach(results::add)` on an `ArrayList` is…",
          options: ["Fine", "A data race: lost elements or an exception — use `collect`", "Slower but correct", "A compile error"],
          answer: 1,
          explanation: "`ArrayList` is not thread-safe and `forEach` in parallel runs on several threads at once.",
        },
        {
          prompt: "Which source splits **worst** for parallel processing?",
          options: ["`int[]`", "`ArrayList`", "`LinkedList` or `Stream.iterate`", "`IntStream.range`"],
          answer: 2,
          explanation: "Their spliterators cannot jump to the middle; splitting means walking, which eats the gain.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(List.of(3, 1, 2).parallelStream().map(x -> x * 10).toList());\n```",
          options: ["Some permutation of 30, 10, 20", "`[30, 10, 20]` — `toList` preserves encounter order", "`[10, 20, 30]`", "Undefined"],
          answer: 1,
          explanation: "A list source has an encounter order and `toList` respects it; only `forEach` and `findAny` give up ordering.",
        },
        {
          prompt: "The rough rule for when `parallel()` might pay is…",
          options: ["Always on a multicore machine", "Elements × per-element cost above about 10 000, CPU-bound, well-splitting source, idle cores — and measured", "Only for I/O", "Only for `sorted()`"],
          answer: 1,
          explanation: "Small or cheap workloads lose to the splitting and merging overhead; blocking work belongs in an executor, not the common pool.",
        },
      ],
    },
    {
      slug: "streams-checkpoint",
      file: "08-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Sales report",
          prompt: `Read an integer \`n\` and \`n\` lines \`region product qty price\` (integers for \`qty\` and \`price\`). Revenue of a line is \`qty × price\`. Using collectors, print for every region in natural order:

\`<region>: revenue=<total revenue> items=<total qty> top=<product with the highest revenue in the region; ties by product name>\`

Then one line \`range=<region with the lowest total revenue>..<region with the highest>\` (ties by region name, alphabetically first), computed with \`teeing\` over the per-region totals.

Example: \`4\` then \`east pen 10 2\`, \`east ink 1 30\`, \`west pen 5 2\`, \`east pad 3 10\` →
\`\`\`
east: revenue=80 items=14 top=ink
west: revenue=10 items=5 top=pen
range=west..east
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

record Sale(String region, String product, int qty, int price) {
    int revenue() { return qty * price; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Sale> sales = new ArrayList<>();
        for (int i = 0; i < n; i++) sales.add(new Sale(in.next(), in.next(), in.nextInt(), in.nextInt()));
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

record Sale(String region, String product, int qty, int price) {
    int revenue() { return qty * price; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Sale> sales = new ArrayList<>();
        for (int i = 0; i < n; i++) sales.add(new Sale(in.next(), in.next(), in.nextInt(), in.nextInt()));

        Map<String, Integer> revenue = sales.stream().collect(groupingBy(Sale::region, TreeMap::new, summingInt(Sale::revenue)));
        Map<String, Integer> items = sales.stream().collect(groupingBy(Sale::region, summingInt(Sale::qty)));
        Map<String, Map<String, Integer>> byProduct = sales.stream()
            .collect(groupingBy(Sale::region, groupingBy(Sale::product, summingInt(Sale::revenue))));

        Comparator<Map.Entry<String, Integer>> byValueThenKey =
            Map.Entry.<String, Integer>comparingByValue().thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder()));
        for (String region : revenue.keySet()) {
            String top = byProduct.get(region).entrySet().stream().max(byValueThenKey).orElseThrow().getKey();
            System.out.println(region + ": revenue=" + revenue.get(region) + " items=" + items.get(region) + " top=" + top);
        }

        Comparator<Map.Entry<String, Integer>> lowFirst = Map.Entry.<String, Integer>comparingByValue().thenComparing(Map.Entry.comparingByKey());
        String range = revenue.entrySet().stream().collect(teeing(
            minBy(lowFirst), maxBy(byValueThenKey),
            (lo, hi) -> lo.orElseThrow().getKey() + ".." + hi.orElseThrow().getKey()));
        System.out.println("range=" + range);
    }
}
`,
          hints: [
            "Three groupingBy passes are fine: revenue per region (TreeMap), qty per region, and a nested groupingBy for product revenue.",
            "For the top product, max with comparingByValue then a reversed key comparator so the alphabetically first name wins a tie.",
            "teeing(minBy(...), maxBy(...), merger) gives both ends of the range in one pass.",
          ],
          cases: [
            { stdin: "4\neast pen 10 2\neast ink 1 30\nwest pen 5 2\neast pad 3 10\n", expected: "east: revenue=80 items=14 top=ink\nwest: revenue=10 items=5 top=pen\nrange=west..east\n" },
            { stdin: "2\nnorth a 1 5\nsouth b 1 6\n", expected: "north: revenue=5 items=1 top=a\nsouth: revenue=6 items=1 top=b\nrange=north..south\n" },
            { stdin: "3\nx q 2 3\nx p 3 2\ny p 1 1\n", expected: "x: revenue=12 items=5 top=p\ny: revenue=1 items=1 top=p\nrange=y..x\n", hidden: true },
          ],
        },
        {
          title: "Text analyser",
          prompt: `Read **all** of standard input (several lines). Words are separated by whitespace; compare them case-insensitively. Print:

- \`lines=<non-blank lines> words=<total words>\`
- \`unique=<distinct lower-cased words>\`
- \`longest=<the first longest word as written in the input>\`
- \`common=<the three most frequent lower-cased words as word:count, most frequent first, ties by word, joined by ,>\` (fewer if there are fewer words)
- \`letters=<the total number of letters across all words, via chars()>\`

Build the word stream with \`lines().flatMap(...)\`.

Example input
\`\`\`
the cat sat
the mat

The end
\`\`\`
→
\`\`\`
lines=3 words=7
unique=5
longest=the
common=the:3,cat:1,end:1
letters=21
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        List<String> words = text.lines()
            .flatMap(l -> Arrays.stream(l.trim().split("\\s+")))
            .filter(w -> !w.isEmpty())
            .toList();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Main {
    public static void main(String[] args) throws java.io.IOException {
        String text = new String(System.in.readAllBytes());
        List<String> words = text.lines()
            .flatMap(l -> Arrays.stream(l.trim().split("\\s+")))
            .filter(w -> !w.isEmpty())
            .toList();

        long lines = text.lines().filter(l -> !l.isBlank()).count();
        System.out.println("lines=" + lines + " words=" + words.size());
        System.out.println("unique=" + words.stream().map(String::toLowerCase).distinct().count());
        System.out.println("longest=" + words.stream().max(Comparator.comparingInt(String::length)).orElse("-"));

        Map<String, Long> freq = words.stream().map(String::toLowerCase).collect(groupingBy(w -> w, counting()));
        String common = freq.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey()))
            .limit(3)
            .map(e -> e.getKey() + ":" + e.getValue())
            .collect(joining(","));
        System.out.println("common=" + common);
        System.out.println("letters=" + words.stream().flatMapToInt(String::chars).filter(Character::isLetter).count());
    }
}
`,
          hints: [
            "String.lines() is a stream; split each line and flatMap.",
            "Sort entries by value descending then key ascending, limit(3).",
            "flatMapToInt(String::chars) streams every character of every word.",
          ],
          cases: [
            { stdin: "the cat sat\nthe mat\n\nThe end\n", expected: "lines=3 words=7\nunique=5\nlongest=the\ncommon=the:3,cat:1,end:1\nletters=21\n" },
            { stdin: "Hello\n", expected: "lines=1 words=1\nunique=1\nlongest=Hello\ncommon=hello:1\nletters=5\n" },
            { stdin: "b a b\nA c\n", expected: "lines=2 words=5\nunique=3\nlongest=b\ncommon=a:2,b:2,c:1\nletters=5\n", hidden: true },
          ],
        },
        {
          title: "First free slot",
          prompt: `A day has hours \`0..23\`. Read an integer \`n\` and \`n\` bookings \`start end\` (a booking occupies hours \`start\` to \`end − 1\`), then a duration \`d\`. Print:

- \`busy=<number of distinct booked hours>\` — flatten each booking to its hours with \`flatMap\`/\`IntStream.range\`, then \`distinct\`.
- \`slot=<h>-<h+d>\` for the **earliest** start \`h\` (\`0 ≤ h ≤ 24 − d\`) such that no booking overlaps \`[h, h + d)\` — an \`IntStream\` over candidate starts, \`filter\` with \`noneMatch\` over the bookings, \`findFirst\`; or \`slot=none\`.
- \`free=<hours from 0 up to the first booked hour>\` using \`takeWhile\` over \`IntStream.range(0, 24)\`.

Example: \`2\` then \`9 12\`, \`13 15\`, then \`3\` →
\`\`\`
busy=5
slot=0-3
free=9
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.stream.*;

record Booking(int start, int end) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Booking> bookings = new ArrayList<>();
        for (int i = 0; i < n; i++) bookings.add(new Booking(in.nextInt(), in.nextInt()));
        int d = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.stream.*;

record Booking(int start, int end) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Booking> bookings = new ArrayList<>();
        for (int i = 0; i < n; i++) bookings.add(new Booking(in.nextInt(), in.nextInt()));
        int d = in.nextInt();

        Set<Integer> booked = bookings.stream()
            .flatMap(b -> IntStream.range(b.start(), b.end()).boxed())
            .collect(Collectors.toSet());
        System.out.println("busy=" + booked.size());

        OptionalInt slot = IntStream.rangeClosed(0, 24 - d)
            .filter(h -> bookings.stream().noneMatch(b -> h < b.end() && b.start() < h + d))
            .findFirst();
        System.out.println("slot=" + (slot.isPresent() ? slot.getAsInt() + "-" + (slot.getAsInt() + d) : "none"));

        long free = IntStream.range(0, 24).takeWhile(h -> !booked.contains(h)).count();
        System.out.println("free=" + free);
    }
}
`,
          hints: [
            "Two intervals [a,b) and [c,d) overlap when a < d && c < b.",
            "rangeClosed(0, 24 - d) is empty when d > 24 — findFirst then returns empty, which is the none case.",
            "takeWhile on the hours stops at the first booked hour; count what was taken.",
          ],
          cases: [
            { stdin: "2\n9 12\n13 15\n3\n", expected: "busy=5\nslot=0-3\nfree=9\n" },
            { stdin: "1\n0 24\n1\n", expected: "busy=24\nslot=none\nfree=0\n" },
            { stdin: "3\n0 8\n8 10\n12 20\n2\n", expected: "busy=18\nslot=10-12\nfree=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A stream pipeline executes when…",
          options: ["The source is created", "Each intermediate operation is added", "The terminal operation is called", "The stream is garbage collected"],
          answer: 2,
          explanation: "Intermediates only describe; the terminal pulls elements through.",
        },
        {
          prompt: "`Stream<List<Integer>>` to `Stream<Integer>` needs…",
          options: ["`map(List::stream)`", "`flatMap(List::stream)`", "`collect(toList())`", "`boxed()`"],
          answer: 1,
          explanation: "`map` would give `Stream<Stream<Integer>>`; `flatMap` splices the inner streams.",
        },
        {
          prompt: "Predict the output:\n```java\nSystem.out.println(Stream.of(\"b\", \"a\", \"c\").sorted().skip(1).findFirst().get());\n```",
          options: ["`a`", "`b`", "`c`", "Throws"],
          answer: 1,
          explanation: "Sorted → a, b, c; skip one → b, c; first → b.",
        },
        {
          prompt: "The identity of a `reduce` must satisfy…",
          options: ["`identity == 0`", "`op(identity, x) == x` for every `x`", "`identity != null`", "Nothing in particular"],
          answer: 1,
          explanation: "Otherwise parallel chunks each add the identity's effect once and the result changes with the split.",
        },
        {
          prompt: "`toMap(k, v)` on a stream containing two elements with the same key…",
          options: ["Keeps the first", "Throws `IllegalStateException`", "Keeps the last", "Stores both in a list"],
          answer: 1,
          explanation: "Pass a merge function as the third argument to decide.",
        },
        {
          prompt: "`groupingBy(Person::city, TreeMap::new, counting())` returns…",
          options: ["`TreeMap<String, Long>`", "`Map<String, List<Person>>`", "`TreeMap<String, Integer>`", "`Map<Long, String>`"],
          answer: 0,
          explanation: "The map factory names the map type; `counting()` produces `Long`.",
        },
        {
          prompt: "`partitioningBy` differs from `groupingBy` on a boolean because…",
          options: ["It is faster", "It always has both `true` and `false` keys", "It returns a `List`", "It cannot take a downstream"],
          answer: 1,
          explanation: "An empty partition is present as an empty group; `groupingBy` would omit the key.",
        },
        {
          prompt: "Which reads an Optional correctly?",
          options: ["`if (o.isPresent()) use(o.get());`", "`o.ifPresent(this::use);`", "`use(o.get());`", "`if (o != null) use(o.get());`"],
          answer: 1,
          explanation: "`isPresent`/`get` is a null check in disguise and `get` on empty throws; `ifPresent`, `orElse*` and `map` are the idioms.",
        },
        {
          prompt: "`orElseGet` is preferable to `orElse` when…",
          options: ["The default is a constant", "The default is expensive to compute", "The Optional is never empty", "Never"],
          answer: 1,
          explanation: "`orElse`'s argument is evaluated on every call; `orElseGet`'s supplier only when the Optional is empty.",
        },
        {
          prompt: "`Stream<Integer>` lacks `sum()` because…",
          options: ["Integers cannot be summed", "Summing is defined on the primitive streams; use `mapToInt(...).sum()` or `reduce(0, Integer::sum)`", "It is deprecated", "Only `LongStream` has it"],
          answer: 1,
          explanation: "The primitive specialisations exist to provide numeric terminals without boxing.",
        },
        {
          prompt: "`\"héllo\".chars()` yields…",
          options: ["A `Stream<Character>`", "An `IntStream` of UTF-16 code units", "A `char[]`", "A `Stream<String>`"],
          answer: 1,
          explanation: "Cast to `char` when you need one; use `codePoints()` for characters outside the basic plane.",
        },
        {
          prompt: "Which is safe inside a parallel pipeline?",
          options: ["Appending to a shared `ArrayList` in `map`", "Incrementing a captured `int[]` counter", "Collecting with `collect(toList())`", "Calling `Thread.sleep` per element"],
          answer: 2,
          explanation: "Collectors are built for concurrent accumulation; the others race or block the common pool.",
        },
        {
          prompt: "`findAny` in parallel is faster than `findFirst` because…",
          options: ["It skips the filter", "It need not respect encounter order, so the first chunk to finish wins", "It caches results", "It is not faster"],
          answer: 1,
          explanation: "`findFirst` must ensure no earlier element qualifies; `findAny` takes any survivor.",
        },
        {
          prompt: "`sorted()` to take the largest element instead of `max`…",
          options: ["Is equivalent", "Is O(n log n) and buffers everything for an O(n) job", "Is faster", "Does not compile"],
          answer: 1,
          explanation: "`max` is a single pass; `sorted().findFirst()` sorts the whole stream first.",
        },
        {
          prompt: "`Stream.toList()` (Java 16) returns a list that is…",
          options: ["An `ArrayList` you may modify", "Unmodifiable (nulls allowed)", "A `LinkedList`", "Sorted"],
          answer: 1,
          explanation: "For a list you can grow, use `collect(toCollection(ArrayList::new))`.",
        },
      ],
    },
  ],
});

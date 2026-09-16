import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "collections-overview": [
    {
      title: "Choose by workload",
      prompt: `Encode the framework's decision table. Read \`n\` lines, each a workload described by flags: \`kind=<list|set|map|queue>\` plus zero or more of \`sorted\`, \`ordered\` (insertion order), \`lifo\`, \`priority\`. Print the default class for each: list → \`ArrayList\`; set → \`HashSet\`, \`LinkedHashSet\` if ordered, \`TreeSet\` if sorted; map → \`HashMap\`/\`LinkedHashMap\`/\`TreeMap\` likewise; queue → \`ArrayDeque\`, or \`PriorityQueue\` if priority (\`lifo\` is still \`ArrayDeque\`, used as a stack). \`sorted\` beats \`ordered\` when both appear.

Example: \`3\` then \`kind=set ordered\`, \`kind=map sorted\`, \`kind=queue priority\` →
\`\`\`
LinkedHashSet
TreeMap
PriorityQueue
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String choose(String kind, Set<String> flags) {
        // TODO
        return "";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(in.readLine().trim());
        for (int i = 0; i < n; i++) {
            String[] parts = in.readLine().trim().split("\\s+");
            String kind = parts[0].substring("kind=".length());
            Set<String> flags = new HashSet<>(Arrays.asList(parts).subList(1, parts.length));
            System.out.println(choose(kind, flags));
        }
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String choose(String kind, Set<String> flags) {
        boolean sorted = flags.contains("sorted"), ordered = flags.contains("ordered");
        return switch (kind) {
            case "list" -> "ArrayList";
            case "set" -> sorted ? "TreeSet" : ordered ? "LinkedHashSet" : "HashSet";
            case "map" -> sorted ? "TreeMap" : ordered ? "LinkedHashMap" : "HashMap";
            default -> flags.contains("priority") ? "PriorityQueue" : "ArrayDeque";
        };
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(in.readLine().trim());
        for (int i = 0; i < n; i++) {
            String[] parts = in.readLine().trim().split("\\s+");
            String kind = parts[0].substring("kind=".length());
            Set<String> flags = new HashSet<>(Arrays.asList(parts).subList(1, parts.length));
            System.out.println(choose(kind, flags));
        }
    }
}
`,
      hints: ["Hash for speed, Linked for insertion order, Tree for sorted — the same three-way choice for sets and maps.", "A stack is an ArrayDeque; PriorityQueue only when the order is by priority."],
      cases: [
        { stdin: "3\nkind=set ordered\nkind=map sorted\nkind=queue priority\n", expected: "LinkedHashSet\nTreeMap\nPriorityQueue\n" },
        { stdin: "3\nkind=list sorted\nkind=queue lifo\nkind=map\n", expected: "ArrayList\nArrayDeque\nHashMap\n" },
        { stdin: "2\nkind=set ordered sorted\nkind=set\n", expected: "TreeSet\nHashSet\n", hidden: true },
      ],
    },
  ],
  lists: [
    {
      title: "Merge two sorted lists",
      prompt: `Read two sorted integer lists (\`n\` values, then \`m\` values). Merge them into one sorted \`ArrayList\` in O(n + m) with two indexes — no sorting call. Print \`merged=<list>\`, then \`middle=<merged.subList(1, size - 1)>\` when the merged list has at least 3 elements (else \`middle=[]\`), and \`indexOf7=<merged.indexOf(7)>\`.

Example: \`3\` then \`1 4 9\`, \`2\` then \`3 7\` →
\`\`\`
merged=[1, 3, 4, 7, 9]
middle=[3, 4, 7]
indexOf7=3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> a = new ArrayList<>();
        for (int i = 0; i < n; i++) a.add(in.nextInt());
        int m = in.nextInt();
        List<Integer> b = new ArrayList<>();
        for (int i = 0; i < m; i++) b.add(in.nextInt());
        List<Integer> merged = new ArrayList<>(n + m);
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> a = new ArrayList<>();
        for (int i = 0; i < n; i++) a.add(in.nextInt());
        int m = in.nextInt();
        List<Integer> b = new ArrayList<>();
        for (int i = 0; i < m; i++) b.add(in.nextInt());
        List<Integer> merged = new ArrayList<>(n + m);
        int i = 0, j = 0;
        while (i < n && j < m) merged.add(a.get(i) <= b.get(j) ? a.get(i++) : b.get(j++));
        while (i < n) merged.add(a.get(i++));
        while (j < m) merged.add(b.get(j++));
        System.out.println("merged=" + merged);
        System.out.println("middle=" + (merged.size() >= 3 ? merged.subList(1, merged.size() - 1) : List.of()));
        System.out.println("indexOf7=" + merged.indexOf(7));
    }
}
`,
      hints: ["Take the smaller head each time; when one list runs out, append the rest of the other.", "subList is a view — printing it is fine; structural changes to it would write through."],
      cases: [
        { stdin: "3\n1 4 9\n2\n3 7\n", expected: "merged=[1, 3, 4, 7, 9]\nmiddle=[3, 4, 7]\nindexOf7=3\n" },
        { stdin: "1\n5\n1\n5\n", expected: "merged=[5, 5]\nmiddle=[]\nindexOf7=-1\n" },
        { stdin: "0\n3\n7 7 8\n", expected: "merged=[7, 7, 8]\nmiddle=[7]\nindexOf7=0\n", hidden: true },
      ],
    },
  ],
  sets: [
    {
      title: "Visitors, three ways",
      prompt: `Read \`n\` lines \`<day> <visitor>\`. Print \`firstSeen=<visitors in first-seen order>\` (a \`LinkedHashSet\`), \`sorted=<visitors in natural order>\` (a \`TreeSet\`), \`everyDay=<visitors present on every distinct day>\` in natural order (intersect per-day \`HashSet\`s with \`retainAll\`), and \`days=<number of distinct days>\`.

Example: \`4\` then \`mon zed\`, \`mon amy\`, \`tue amy\`, \`tue bob\` →
\`\`\`
firstSeen=[zed, amy, bob]
sorted=[amy, bob, zed]
everyDay=[amy]
days=2
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Set<String> firstSeen = new LinkedHashSet<>();
        Map<String, Set<String>> byDay = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            String day = in.next(), visitor = in.next();
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
        int n = in.nextInt();
        Set<String> firstSeen = new LinkedHashSet<>();
        Map<String, Set<String>> byDay = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            String day = in.next(), visitor = in.next();
            firstSeen.add(visitor);
            byDay.computeIfAbsent(day, d -> new HashSet<>()).add(visitor);
        }
        System.out.println("firstSeen=" + firstSeen);
        System.out.println("sorted=" + new TreeSet<>(firstSeen));
        Set<String> every = null;
        for (Set<String> s : byDay.values()) {
            if (every == null) every = new TreeSet<>(s);
            else every.retainAll(s);
        }
        System.out.println("everyDay=" + (every == null ? "[]" : every));
        System.out.println("days=" + byDay.size());
    }
}
`,
      hints: ["Start the intersection from the first day's set and retainAll the others.", "Build a TreeSet from any collection to get it sorted for printing."],
      cases: [
        { stdin: "4\nmon zed\nmon amy\ntue amy\ntue bob\n", expected: "firstSeen=[zed, amy, bob]\nsorted=[amy, bob, zed]\neveryDay=[amy]\ndays=2\n" },
        { stdin: "2\nd1 x\nd1 x\n", expected: "firstSeen=[x]\nsorted=[x]\neveryDay=[x]\ndays=1\n" },
        { stdin: "3\na p\nb q\nc r\n", expected: "firstSeen=[p, q, r]\nsorted=[p, q, r]\neveryDay=[]\ndays=3\n", hidden: true },
      ],
    },
  ],
  maps: [
    {
      title: "An inverted index",
      prompt: `Read lines of text until end of input (line numbers start at 1). Build an inverted index: \`TreeMap<String, TreeSet<Integer>>\` from each lower-cased word to the set of lines it appears on, using \`computeIfAbsent\`. Print \`<word>: <lines>\` for every word, then \`vocabulary=<size>\` and \`mostSpread=<the word on the most lines; ties by natural order>\`.

Example input
\`\`\`
the cat
The dog
a cat
\`\`\`
→
\`\`\`
a: [3]
cat: [1, 3]
dog: [2]
the: [1, 2]
vocabulary=4
mostSpread=cat
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        TreeMap<String, TreeSet<Integer>> index = new TreeMap<>();
        String line;
        int lineNo = 0;
        while ((line = in.readLine()) != null) {
            lineNo++;
            // TODO
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        TreeMap<String, TreeSet<Integer>> index = new TreeMap<>();
        String line;
        int lineNo = 0;
        while ((line = in.readLine()) != null) {
            lineNo++;
            for (String w : line.trim().split("\\s+")) {
                if (w.isEmpty()) continue;
                index.computeIfAbsent(w.toLowerCase(Locale.ROOT), k -> new TreeSet<>()).add(lineNo);
            }
        }
        String best = null;
        for (Map.Entry<String, TreeSet<Integer>> e : index.entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
            if (best == null || e.getValue().size() > index.get(best).size()) best = e.getKey();
        }
        System.out.println("vocabulary=" + index.size());
        System.out.println("mostSpread=" + best);
    }
}
`,
      hints: ["computeIfAbsent(word, k -> new TreeSet<>()).add(lineNo) is the whole insert.", "Iterating a TreeMap is already in natural order, so 'ties by natural order' is just 'strictly greater'."],
      cases: [
        { stdin: "the cat\nThe dog\na cat\n", expected: "a: [3]\ncat: [1, 3]\ndog: [2]\nthe: [1, 2]\nvocabulary=4\nmostSpread=cat\n" },
        { stdin: "solo\n", expected: "solo: [1]\nvocabulary=1\nmostSpread=solo\n" },
        { stdin: "x y\n\ny x\nz\n", expected: "x: [1, 3]\ny: [1, 3]\nz: [4]\nvocabulary=3\nmostSpread=x\n", hidden: true },
      ],
    },
  ],
  "queues-deques-priority": [
    {
      title: "Merge k sorted lists with a heap",
      prompt: `Read \`k\`, then \`k\` sorted lists (each a length followed by its values). Merge them into one sorted sequence with a \`PriorityQueue\` of \`(value, listIndex, position)\` entries — push the head of each list, then repeatedly poll the smallest and push that list's next element. Print the merged values space-separated, then \`polls=<total polls>\`.

Example: \`3\` then \`2 1 5\`, \`1 3\`, \`3 2 4 6\` →
\`\`\`
1 2 3 4 5 6
polls=6
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    record Entry(int value, int list, int pos) { }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        int[][] lists = new int[k][];
        for (int i = 0; i < k; i++) {
            int len = in.nextInt();
            lists[i] = new int[len];
            for (int j = 0; j < len; j++) lists[i][j] = in.nextInt();
        }
        PriorityQueue<Entry> heap = new PriorityQueue<>(Comparator.comparingInt(Entry::value).thenComparingInt(Entry::list));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    record Entry(int value, int list, int pos) { }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        int[][] lists = new int[k][];
        for (int i = 0; i < k; i++) {
            int len = in.nextInt();
            lists[i] = new int[len];
            for (int j = 0; j < len; j++) lists[i][j] = in.nextInt();
        }
        PriorityQueue<Entry> heap = new PriorityQueue<>(Comparator.comparingInt(Entry::value).thenComparingInt(Entry::list));
        for (int i = 0; i < k; i++) if (lists[i].length > 0) heap.offer(new Entry(lists[i][0], i, 0));
        StringBuilder out = new StringBuilder();
        int polls = 0;
        while (!heap.isEmpty()) {
            Entry e = heap.poll();
            polls++;
            out.append(out.length() > 0 ? " " : "").append(e.value());
            if (e.pos() + 1 < lists[e.list()].length) heap.offer(new Entry(lists[e.list()][e.pos() + 1], e.list(), e.pos() + 1));
        }
        System.out.println(out.length() == 0 ? "-" : out);
        System.out.println("polls=" + polls);
    }
}
`,
      hints: ["The heap holds at most k entries — one per list — so each poll is O(log k).", "After polling, push the next element from the same list, if any."],
      cases: [
        { stdin: "3\n2 1 5\n1 3\n3 2 4 6\n", expected: "1 2 3 4 5 6\npolls=6\n" },
        { stdin: "2\n0\n2 4 4\n", expected: "4 4\npolls=2\n" },
        { stdin: "1\n0\n", expected: "-\npolls=0\n", hidden: true },
      ],
    },
  ],
  "sorting-and-comparators": [
    {
      title: "Stable, and null-safe",
      prompt: `Read \`n\` lines \`<name> <score>\` where the score may be \`-\` meaning unknown (\`null\`). Sort by score **descending** with unknown scores last (\`Comparator.comparing(Player::score, Comparator.nullsLast(Comparator.reverseOrder()))\`) — and because \`List.sort\` is stable, players with equal scores stay in input order. Print \`<name> <score or ->\` per line, then \`unknown=<count>\`.

Example: \`4\` then \`ann 80\`, \`bob -\`, \`cy 90\`, \`dee 80\` →
\`\`\`
cy 90
ann 80
dee 80
bob -
unknown=1
\`\`\``,
      starter: String.raw`import java.util.*;

record Player(String name, Integer score) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Player> players = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String name = in.next(), s = in.next();
            players.add(new Player(name, s.equals("-") ? null : Integer.valueOf(s)));
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

record Player(String name, Integer score) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Player> players = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String name = in.next(), s = in.next();
            players.add(new Player(name, s.equals("-") ? null : Integer.valueOf(s)));
        }
        players.sort(Comparator.comparing(Player::score, Comparator.nullsLast(Comparator.reverseOrder())));
        int unknown = 0;
        for (Player p : players) {
            if (p.score() == null) unknown++;
            System.out.println(p.name() + " " + (p.score() == null ? "-" : p.score()));
        }
        System.out.println("unknown=" + unknown);
    }
}
`,
      hints: ["nullsLast wraps another comparator and handles the nulls before delegating.", "Stability means you need no tie-breaker to keep input order among equal scores."],
      cases: [
        { stdin: "4\nann 80\nbob -\ncy 90\ndee 80\n", expected: "cy 90\nann 80\ndee 80\nbob -\nunknown=1\n" },
        { stdin: "2\nx -\ny -\n", expected: "x -\ny -\nunknown=2\n" },
        { stdin: "3\na 1\nb 1\nc 1\n", expected: "a 1\nb 1\nc 1\nunknown=0\n", hidden: true },
      ],
    },
  ],
  "iteration-and-fail-fast": [
    {
      title: "Edit while iterating, with a ListIterator",
      prompt: `Read \`n\` integers into an \`ArrayList\`. Walk it once with a \`ListIterator<Integer>\`: replace every negative value with 0 (\`set\`), insert \`x / 2\` **after** every even positive value (\`add\`), and remove every value greater than 100 (\`remove\`). Print the resulting list and \`size=<n>\`. This is the one way to change a list while iterating it without a \`ConcurrentModificationException\`.

Example: \`5\` then \`-3 8 5 200 2\` →
\`\`\`
[0, 8, 4, 5, 2, 1]
size=6
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        ListIterator<Integer> it = xs.listIterator();
        // TODO
        System.out.println(xs);
        System.out.println("size=" + xs.size());
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> xs = new ArrayList<>();
        for (int i = 0; i < n; i++) xs.add(in.nextInt());
        ListIterator<Integer> it = xs.listIterator();
        while (it.hasNext()) {
            int x = it.next();
            if (x > 100) it.remove();
            else if (x < 0) it.set(0);
            else if (x > 0 && x % 2 == 0) it.add(x / 2);   // inserted after x; the cursor moves past it
        }
        System.out.println(xs);
        System.out.println("size=" + xs.size());
    }
}
`,
      hints: ["set replaces the last element returned by next(); add inserts right after it and the iterator skips over the insertion.", "Anything added or removed through the iterator itself is not a concurrent modification."],
      cases: [
        { stdin: "5\n-3 8 5 200 2\n", expected: "[0, 8, 4, 5, 2, 1]\nsize=6\n" },
        { stdin: "3\n101 102 103\n", expected: "[]\nsize=0\n" },
        { stdin: "2\n4 -4\n", expected: "[4, 2, 0]\nsize=3\n", hidden: true },
      ],
    },
  ],
  "immutable-and-utilities": [
    {
      title: "The Collections toolkit tour",
      prompt: `Read \`n\` words. Print \`frequency(first)=<Collections.frequency of the first word>\`, \`nCopies=<Collections.nCopies(3, first word)>\`, then rotate a copy of the list by 1 with \`Collections.rotate\` and print \`rotated=<…>\`, shuffle a copy with \`Collections.shuffle(copy, new Random(42))\` and print \`shuffled=<…>\` (a seeded \`Random\` makes it reproducible), and finally try to \`add\` to \`Collections.unmodifiableList(words)\` and print \`unmodifiable=<true if it threw>\`.

Example: \`4\` then \`a b a c\` →
\`\`\`
frequency(first)=2
nCopies=[a, a, a]
rotated=[c, a, b, a]
shuffled=[c, b, a, a]
unmodifiable=true
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
        String first = words.get(0);
        System.out.println("frequency(first)=" + Collections.frequency(words, first));
        System.out.println("nCopies=" + Collections.nCopies(3, first));
        List<String> rotated = new ArrayList<>(words);
        Collections.rotate(rotated, 1);
        System.out.println("rotated=" + rotated);
        List<String> shuffled = new ArrayList<>(words);
        Collections.shuffle(shuffled, new Random(42));
        System.out.println("shuffled=" + shuffled);
        boolean threw = false;
        try {
            Collections.unmodifiableList(words).add("z");
        } catch (UnsupportedOperationException e) {
            threw = true;
        }
        System.out.println("unmodifiable=" + threw);
    }
}
`,
      hints: ["rotate(list, 1) moves every element one place right; the last wraps to the front.", "Random's algorithm is specified, so a fixed seed shuffles identically on every JVM."],
      cases: [
        { stdin: "4\na b a c\n", expected: "frequency(first)=2\nnCopies=[a, a, a]\nrotated=[c, a, b, a]\nshuffled=[c, b, a, a]\nunmodifiable=true\n" },
        { stdin: "1\nq\n", expected: "frequency(first)=1\nnCopies=[q, q, q]\nrotated=[q]\nshuffled=[q]\nunmodifiable=true\n" },
        { stdin: "3\nx y z\n", expected: "frequency(first)=1\nnCopies=[x, x, x]\nrotated=[z, x, y]\nshuffled=[y, x, z]\nunmodifiable=true\n", hidden: true },
      ],
    },
  ],
  "collections-checkpoint": [
    {
      title: "Meeting rooms",
      prompt: `Read \`n\` meetings \`<start> <end>\` (integers, end exclusive). Compute the minimum number of rooms so that no two overlapping meetings share a room: sort by start, keep a \`PriorityQueue<Integer>\` of end times of meetings in progress, free a room when the earliest end is \`<=\` the next start. Print \`rooms=<k>\`, then assign rooms greedily in that order — each meeting takes the lowest-numbered free room (a \`TreeSet<Integer>\` of free rooms) — printing \`<start>-<end> room <r>\` in start order.

Example: \`3\` then \`0 30\`, \`5 10\`, \`15 20\` →
\`\`\`
rooms=2
0-30 room 1
5-10 room 2
15-20 room 2
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    record Meeting(int start, int end) { }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Meeting> meetings = new ArrayList<>();
        for (int i = 0; i < n; i++) meetings.add(new Meeting(in.nextInt(), in.nextInt()));
        meetings.sort(Comparator.comparingInt(Meeting::start).thenComparingInt(Meeting::end));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    record Meeting(int start, int end) { }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Meeting> meetings = new ArrayList<>();
        for (int i = 0; i < n; i++) meetings.add(new Meeting(in.nextInt(), in.nextInt()));
        meetings.sort(Comparator.comparingInt(Meeting::start).thenComparingInt(Meeting::end));

        // Pass 1: how many rooms.
        PriorityQueue<Integer> ends = new PriorityQueue<>();
        int rooms = 0;
        for (Meeting m : meetings) {
            while (!ends.isEmpty() && ends.peek() <= m.start()) ends.poll();
            ends.offer(m.end());
            rooms = Math.max(rooms, ends.size());
        }
        System.out.println("rooms=" + rooms);

        // Pass 2: assign the lowest free room; a heap of (end, room) frees rooms as meetings finish.
        TreeSet<Integer> free = new TreeSet<>();
        for (int r = 1; r <= rooms; r++) free.add(r);
        PriorityQueue<int[]> busy = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        for (Meeting m : meetings) {
            while (!busy.isEmpty() && busy.peek()[0] <= m.start()) free.add(busy.poll()[1]);
            int room = free.pollFirst();
            busy.offer(new int[] { m.end(), room });
            System.out.println(m.start() + "-" + m.end() + " room " + room);
        }
    }
}
`,
      hints: [
        "The heap of end times is the set of meetings still running; its size is the rooms in use.",
        "Free every room whose meeting has ended before taking the smallest free room number.",
        "A TreeSet gives pollFirst — the lowest available room — in O(log k).",
      ],
      cases: [
        { stdin: "3\n0 30\n5 10\n15 20\n", expected: "rooms=2\n0-30 room 1\n5-10 room 2\n15-20 room 2\n" },
        { stdin: "2\n7 10\n2 4\n", expected: "rooms=1\n2-4 room 1\n7-10 room 1\n" },
        { stdin: "4\n1 5\n2 6\n3 7\n5 8\n", expected: "rooms=3\n1-5 room 1\n2-6 room 2\n3-7 room 3\n5-8 room 1\n", hidden: true },
      ],
    },
  ],
};

export default more;

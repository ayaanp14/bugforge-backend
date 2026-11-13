import { defineModule } from "../../dsl.js";

/*
 * LRU cache. The programs read the capacity on the first line and then a
 * script of commands; hidden cases run the evictions that separate a real
 * LRU from a FIFO (a get or an update moving a key to the front, a miss
 * changing nothing) and, with expiry, the clock edge (expired at exactly
 * now == expiresAt) and expired entries dropped before a live one is evicted.
 */

/** The node and list surgery every program here shares. */
const LIST_CODE = String.raw`    static class Node {
        final String key; // eviction starts from the node, so it must know its key
        String value;
        Node prev, next;

        Node(String key, String value) { this.key = key; this.value = value; }
    }`;

const LRU_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${LIST_CODE}

    static class LRUCache {
        private final int capacity;
        private final Map<String, Node> map = new HashMap<>();
        private final Node head = new Node(null, null); // sentinels: never removed, so no null checks
        private final Node tail = new Node(null, null);

        LRUCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        boolean contains(String key) { return map.containsKey(key); }

        /** The value, or null on a miss. A hit makes the key the most recent. */
        String get(String key) {
            Node node = map.get(key);
            if (node == null) return null;
            unlink(node);
            addFirst(node);
            return node.value;
        }

        /** Stores the value and makes the key the most recent; answers the evicted key, or null. */
        String put(String key, String value) {
            Node node = map.get(key);
            if (node != null) {
                node.value = value;
                unlink(node);
                addFirst(node);
                return null;
            }
            String evicted = null;
            if (map.size() == capacity) {
                Node last = tail.prev;
                unlink(last);
                map.remove(last.key);
                evicted = last.key;
            }
            node = new Node(key, value);
            addFirst(node);
            map.put(key, node);
            return evicted;
        }

        /** Keys from most to least recent; reading the order is not a use. */
        List<String> order() {
            List<String> keys = new ArrayList<>();
            for (Node n = head.next; n != tail; n = n.next) keys.add(n.key);
            return keys;
        }

        private void unlink(Node n) {
            n.prev.next = n.next;
            n.next.prev = n.prev;
        }

        private void addFirst(Node n) {
            n.prev = head;
            n.next = head.next;
            head.next.prev = n;
            head.next = n;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        LRUCache cache = new LRUCache(Integer.parseInt(br.readLine().trim()));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "PUT": {
                    boolean existed = cache.contains(p[1]);
                    String evicted = cache.put(p[1], p[2]);
                    out.append(existed ? "updated " + p[1] : "stored " + p[1] + (evicted == null ? "" : ", evicted " + evicted));
                    break;
                }
                case "GET": {
                    String value = cache.get(p[1]);
                    out.append(value == null ? "miss" : value);
                    break;
                }
                case "ORDER": {
                    List<String> keys = cache.order();
                    out.append("order: ").append(keys.isEmpty() ? "empty" : String.join(" ", keys));
                    break;
                }
                default:
                    out.append("error: unknown command ").append(p[0]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`;

const LRU_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${LIST_CODE}

    static class LRUCache {
        private final int capacity;
        private final Map<String, Node> map = new HashMap<>();
        private final Node head = new Node(null, null); // sentinels
        private final Node tail = new Node(null, null);

        LRUCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        boolean contains(String key) { return map.containsKey(key); }

        /** The value, or null on a miss. A hit makes the key the most recent. */
        String get(String key) {
            // TODO
            return null;
        }

        /** Stores the value and makes the key the most recent; answers the evicted key, or null. */
        String put(String key, String value) {
            // TODO: update in place, or evict tail.prev when full, then add at the front
            return null;
        }

        /** Keys from most to least recent. */
        List<String> order() {
            // TODO: walk from head.next to tail
            return new ArrayList<>();
        }

        private void unlink(Node n) {
            // TODO
        }

        private void addFirst(Node n) {
            // TODO
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        LRUCache cache = new LRUCache(Integer.parseInt(br.readLine().trim()));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "PUT": {
                    boolean existed = cache.contains(p[1]);
                    String evicted = cache.put(p[1], p[2]);
                    out.append(existed ? "updated " + p[1] : "stored " + p[1] + (evicted == null ? "" : ", evicted " + evicted));
                    break;
                }
                case "GET": {
                    String value = cache.get(p[1]);
                    out.append(value == null ? "miss" : value);
                    break;
                }
                case "ORDER": {
                    List<String> keys = cache.order();
                    out.append("order: ").append(keys.isEmpty() ? "empty" : String.join(" ", keys));
                    break;
                }
                default:
                    out.append("error: unknown command ").append(p[0]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`;

const TTL_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class Node {
        final String key;
        String value;
        long expiresAt;
        Node prev, next;

        Node(String key, String value, long expiresAt) { this.key = key; this.value = value; this.expiresAt = expiresAt; }
    }

    /** An LRU cache whose entries expire on a logical clock: time moves only when tick() is called. */
    static class ExpiringCache {
        private final int capacity;
        private final Map<String, Node> map = new HashMap<>();
        private final Node head = new Node(null, null, 0);
        private final Node tail = new Node(null, null, 0);
        private long now = 0;

        ExpiringCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        long tick(long n) { return now += n; }

        private boolean expired(Node n) { return now >= n.expiresAt; }

        /** Removes the key if it is there and expired; true when it did. */
        boolean dropIfExpired(String key) {
            Node n = map.get(key);
            if (n == null || !expired(n)) return false;
            remove(n);
            return true;
        }

        /** The live value, or null. Call dropIfExpired first to tell an expired key from a missing one. */
        String get(String key) {
            dropIfExpired(key);
            Node n = map.get(key);
            if (n == null) return null;
            unlink(n);
            addFirst(n);
            return n.value;
        }

        boolean containsLive(String key) {
            dropIfExpired(key);
            return map.containsKey(key);
        }

        /** Answers the live key evicted to make room, or null. */
        String put(String key, String value, long ttl) {
            dropIfExpired(key);
            Node n = map.get(key);
            if (n != null) {
                n.value = value;
                n.expiresAt = now + ttl;
                unlink(n);
                addFirst(n);
                return null;
            }
            String evicted = null;
            if (map.size() == capacity) {
                purgeExpired(); // an expired entry is worth nothing: drop those before a live one
                if (map.size() == capacity) {
                    Node last = tail.prev;
                    remove(last);
                    evicted = last.key;
                }
            }
            n = new Node(key, value, now + ttl);
            addFirst(n);
            map.put(key, n);
            return evicted;
        }

        int size() {
            purgeExpired();
            return map.size();
        }

        private void purgeExpired() {
            for (Node n = head.next; n != tail; ) {
                Node next = n.next;
                if (expired(n)) remove(n);
                n = next;
            }
        }

        private void remove(Node n) {
            unlink(n);
            map.remove(n.key);
        }

        private void unlink(Node n) {
            n.prev.next = n.next;
            n.next.prev = n.prev;
        }

        private void addFirst(Node n) {
            n.prev = head;
            n.next = head.next;
            head.next.prev = n;
            head.next = n;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        ExpiringCache cache = new ExpiringCache(Integer.parseInt(br.readLine().trim()));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "PUT": {
                    boolean existed = cache.containsLive(p[1]);
                    String evicted = cache.put(p[1], p[2], Long.parseLong(p[3]));
                    out.append(existed ? "updated " + p[1] : "stored " + p[1] + (evicted == null ? "" : ", evicted " + evicted));
                    break;
                }
                case "GET": {
                    if (cache.dropIfExpired(p[1])) {
                        out.append("expired");
                    } else {
                        String value = cache.get(p[1]);
                        out.append(value == null ? "miss" : value);
                    }
                    break;
                }
                case "TICK":
                    out.append("time ").append(cache.tick(Long.parseLong(p[1])));
                    break;
                case "SIZE":
                    out.append(cache.size());
                    break;
                default:
                    out.append("error: unknown command ").append(p[0]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`;

const TTL_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class Node {
        final String key;
        String value;
        long expiresAt;
        Node prev, next;

        Node(String key, String value, long expiresAt) { this.key = key; this.value = value; this.expiresAt = expiresAt; }
    }

    /** An LRU cache whose entries expire on a logical clock: time moves only when tick() is called. */
    static class ExpiringCache {
        private final int capacity;
        private final Map<String, Node> map = new HashMap<>();
        private final Node head = new Node(null, null, 0);
        private final Node tail = new Node(null, null, 0);
        private long now = 0;

        ExpiringCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        long tick(long n) { return now += n; }

        /** Removes the key if it is there and expired (now >= expiresAt); true when it did. */
        boolean dropIfExpired(String key) {
            // TODO
            return false;
        }

        /** The live value, or null; a hit moves the key to the front. */
        String get(String key) {
            // TODO
            return null;
        }

        boolean containsLive(String key) {
            dropIfExpired(key);
            return map.containsKey(key);
        }

        /** Answers the live key evicted to make room, or null. Drop expired entries before evicting. */
        String put(String key, String value, long ttl) {
            // TODO
            return null;
        }

        /** Live entries, after dropping the expired ones. */
        int size() {
            // TODO
            return 0;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        ExpiringCache cache = new ExpiringCache(Integer.parseInt(br.readLine().trim()));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "PUT": {
                    boolean existed = cache.containsLive(p[1]);
                    String evicted = cache.put(p[1], p[2], Long.parseLong(p[3]));
                    out.append(existed ? "updated " + p[1] : "stored " + p[1] + (evicted == null ? "" : ", evicted " + evicted));
                    break;
                }
                case "GET": {
                    if (cache.dropIfExpired(p[1])) {
                        out.append("expired");
                    } else {
                        String value = cache.get(p[1]);
                        out.append(value == null ? "miss" : value);
                    }
                    break;
                }
                case "TICK":
                    out.append("time ").append(cache.tick(Long.parseLong(p[1])));
                    break;
                case "SIZE":
                    out.append(cache.size());
                    break;
                default:
                    out.append("error: unknown command ").append(p[0]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`;

const STATS_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${LIST_CODE}

    static class LRUCache {
        private final int capacity;
        private final Map<String, Node> map = new HashMap<>();
        private final Node head = new Node(null, null);
        private final Node tail = new Node(null, null);
        private int hits, misses, evictions;

        LRUCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        boolean contains(String key) { return map.containsKey(key); }

        String get(String key) {
            Node node = map.get(key);
            if (node == null) {
                misses++;
                return null;
            }
            hits++;
            unlink(node);
            addFirst(node);
            return node.value;
        }

        /** The value without making it more recent, and without counting as a hit or a miss. */
        String peek(String key) {
            Node node = map.get(key);
            return node == null ? null : node.value;
        }

        String put(String key, String value) {
            Node node = map.get(key);
            if (node != null) {
                node.value = value;
                unlink(node);
                addFirst(node);
                return null;
            }
            String evicted = null;
            if (map.size() == capacity) {
                Node last = tail.prev;
                unlink(last);
                map.remove(last.key);
                evicted = last.key;
                evictions++;
            }
            node = new Node(key, value);
            addFirst(node);
            map.put(key, node);
            return evicted;
        }

        boolean delete(String key) {
            Node node = map.remove(key);
            if (node == null) return false;
            unlink(node);
            return true;
        }

        List<String> order() {
            List<String> keys = new ArrayList<>();
            for (Node n = head.next; n != tail; n = n.next) keys.add(n.key);
            return keys;
        }

        String stats() { return "hits " + hits + ", misses " + misses + ", evictions " + evictions; }

        private void unlink(Node n) {
            n.prev.next = n.next;
            n.next.prev = n.prev;
        }

        private void addFirst(Node n) {
            n.prev = head;
            n.next = head.next;
            head.next.prev = n;
            head.next = n;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        LRUCache cache = new LRUCache(Integer.parseInt(br.readLine().trim()));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "PUT": {
                    boolean existed = cache.contains(p[1]);
                    String evicted = cache.put(p[1], p[2]);
                    out.append(existed ? "updated " + p[1] : "stored " + p[1] + (evicted == null ? "" : ", evicted " + evicted));
                    break;
                }
                case "GET": {
                    String value = cache.get(p[1]);
                    out.append(value == null ? "miss" : value);
                    break;
                }
                case "PEEK": {
                    String value = cache.peek(p[1]);
                    out.append(value == null ? "miss" : value);
                    break;
                }
                case "DEL":
                    out.append(cache.delete(p[1]) ? "deleted " + p[1] : "miss");
                    break;
                case "ORDER": {
                    List<String> keys = cache.order();
                    out.append("order: ").append(keys.isEmpty() ? "empty" : String.join(" ", keys));
                    break;
                }
                case "STATS":
                    out.append(cache.stats());
                    break;
                default:
                    out.append("error: unknown command ").append(p[0]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`;

const STATS_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${LIST_CODE}

    // TODO: an LRUCache with get, peek, put, delete, order and its three counters.

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int capacity = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: PUT, GET, PEEK, DEL, ORDER, STATS
            out.append("error: unknown command ").append(p[0]).append('\n');
        }
        System.out.print(out);
    }
}
`;

export default defineModule(import.meta.url, {
  slug: "lru-cache",
  title: "LRU cache",
  blurb: "A HashMap of nodes plus a doubly linked list for O(1) get and put — then expiry on a logical clock, and hit statistics that a peek must not disturb.",
  icon: "box",
  overview: `The LRU cache is the machine-coding question asked most, because one requirement — get and put in O(1) — forces a specific design: a hash map whose values are the nodes of a doubly linked list kept in order of use.

You will code the cache itself, then extend it with expiry: entries carry an expiry time on a logical clock that a \`TICK\` command advances, so the behaviour is testable without a real clock. The checkpoint adds deletes, a \`PEEK\` that must not count as a use, and hit, miss and eviction counters. Hidden cases run the evictions that tell a real LRU from a FIFO — a get or an update moving a key to the front, a miss changing nothing — and the edge of expiry.

It is the practice half of the note [Design an LRU Cache](/notes/low-level-design/design-an-lru-cache).`,
  lessons: [
    {
      slug: "lru-cache-design",
      file: "01-lru-cache-design.md",
      exercises: [
        {
          title: "LRU cache",
          prompt: `Write an \`LRUCache\` with O(1) \`get\` and \`put\` using a \`HashMap\` from key to node and a doubly linked list with head and tail sentinels. The first line of input is the capacity (at least 1); then commands, one per line. Keys and values are single words.

| Command | Prints |
| --- | --- |
| \`PUT <key> <value>\` | \`stored <key>\`, or \`stored <key>, evicted <old>\` when a new key fills a full cache, or \`updated <key>\` for a key already there |
| \`GET <key>\` | the value, or \`miss\` |
| \`ORDER\` | \`order: <keys from most to least recently used>\`, or \`order: empty\` |
| anything else | \`error: unknown command <WORD>\` |

A \`GET\` hit and any \`PUT\` make the key the most recently used; a miss and \`ORDER\` change nothing. A full cache evicts the least recently used key.`,
          starter: LRU_STARTER,
          solution: LRU_SOLUTION,
          hints: [
            "unlink(n) is two pointer writes (n.prev.next and n.next.prev); addFirst(n) is four.",
            "Evict tail.prev — and remove its key from the map, which is why the node stores the key.",
            "Decide 'updated' or 'stored' before calling put: the main loop asks contains first.",
          ],
          cases: [
            { stdin: "2\nPUT a 1\nPUT b 2\nGET a\nPUT c 3\nGET b\nORDER\n", expected: "stored a\nstored b\n1\nstored c, evicted b\nmiss\norder: c a\n" },
            { stdin: "3\nPUT x 10\nPUT y 20\nPUT z 30\nPUT x 11\nPUT w 40\nORDER\nGET x\nGET y\n", expected: "stored x\nstored y\nstored z\nupdated x\nstored w, evicted y\norder: w x z\n11\nmiss\n", hidden: true },
            { stdin: "1\nORDER\nPUT k1 v1\nGET k2\nPUT k2 v2\nGET k1\nGET k2\nPUT k2 v3\nORDER\nFLUSH\n", expected: "order: empty\nstored k1\nmiss\nstored k2, evicted k1\nmiss\nv2\nupdated k2\norder: k2\nerror: unknown command FLUSH\n", hidden: true },
            { stdin: "3\nPUT 1 A\nPUT 2 B\nPUT 3 C\nGET 1\nGET 2\nPUT 4 D\nGET 3\nORDER\nPUT 5 E\nORDER\n", expected: "stored 1\nstored 2\nstored 3\nA\nB\nstored 4, evicted 3\nmiss\norder: 4 2 1\nstored 5, evicted 1\norder: 5 4 2\n", hidden: true },
          ],
        },
        {
          title: "LRU cache with expiry",
          prompt: `Extend the cache with time-to-live on a **logical clock**: time starts at 0 and moves only on \`TICK\`. An entry put at time \`t\` with ttl \`n\` expires at \`t + n\`, and is expired once \`now >= t + n\`. The first line is the capacity; then commands:

| Command | Prints |
| --- | --- |
| \`PUT <key> <value> <ttl>\` | \`updated <key>\` for a live key already there (new value, new expiry, most recent); otherwise \`stored <key>\` or \`stored <key>, evicted <old>\` |
| \`GET <key>\` | the value (a hit moves it to the front); \`expired\` when the key is there but expired — it is removed; \`miss\` when it is not there |
| \`TICK <n>\` | \`time <now>\` after advancing the clock by \`n\` |
| \`SIZE\` | the number of live entries (expired ones are dropped first) |
| anything else | \`error: unknown command <WORD>\` |

An expired key that is \`PUT\` again counts as new. When a new key meets a full cache, first drop every expired entry silently; only if the cache is still full, evict the least recently used live key.`,
          starter: TTL_STARTER,
          solution: TTL_SOLUTION,
          hints: [
            "Keep the clock inside the cache as a field; never read the system clock in a design you must test.",
            "Write one dropIfExpired(key) and call it at the start of every operation on a key.",
            "To drop every expired entry, walk the list from head to tail, saving next before you remove a node.",
          ],
          cases: [
            { stdin: "2\nPUT a 1 5\nPUT b 2 10\nTICK 5\nGET a\nGET b\nSIZE\n", expected: "stored a\nstored b\ntime 5\nexpired\n2\n1\n" },
            { stdin: "2\nPUT a 1 3\nPUT b 2 100\nTICK 4\nPUT c 3 100\nGET a\nGET b\nGET c\n", expected: "stored a\nstored b\ntime 4\nstored c\nmiss\n2\n3\n", hidden: true },
            { stdin: "2\nPUT a 1 5\nPUT b 2 5\nTICK 3\nPUT a 9 5\nTICK 3\nGET b\nGET a\nPUT c 3 1\nPUT d 4 1\nGET a\n", expected: "stored a\nstored b\ntime 3\nupdated a\ntime 6\nexpired\n9\nstored c\nstored d, evicted a\nmiss\n", hidden: true },
            { stdin: "1\nPUT k v 2\nTICK 2\nPUT k w 2\nGET k\nTICK 1\nSIZE\nTICK 1\nSIZE\nGET k\nEXPIRE k\n", expected: "stored k\ntime 2\nstored k\nw\ntime 3\n1\ntime 4\n0\nmiss\nerror: unknown command EXPIRE\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why does an O(1) LRU cache need a **doubly** linked list?",
          options: ["To iterate in both directions when printing", "Unlinking a node found through the map needs its predecessor, which only a prev pointer gives in O(1)", "Java has no singly linked list", "To store two values per node"],
          answer: 1,
          explanation: "The map hands you the node; moving it means rewiring its neighbours. With `prev` that is O(1). A singly linked list would have to walk from the head to find the predecessor, making every hit O(n).",
        },
        {
          prompt: "Capacity 2: `PUT a`, `PUT b`, `GET a`, `PUT c`, `GET b`. What does the last GET return?",
          options: ["b's value", "miss", "a's value", "An error: the cache is full"],
          answer: 1,
          explanation: "`GET a` moved a to the front, leaving b least recent, so `PUT c` evicted b. A FIFO cache would have evicted a instead — this sequence is exactly the test that separates the two.",
        },
        {
          prompt: "What do the head and tail **sentinel** nodes buy you?",
          options: ["Faster hashing", "Every real node always has a non-null prev and next, so insert and unlink need no special cases", "They store the capacity", "They make the cache thread-safe"],
          answer: 1,
          explanation: "Without sentinels, adding to an empty list and removing the first or last node each need their own null checks. Two dummy nodes that are never removed make those cases disappear.",
        },
        {
          prompt: "An expiring cache reads `System.currentTimeMillis()` inside `get`. What is the main design problem?",
          options: ["It is too slow", "Behaviour depends on real time, so tests cannot reproduce an expiry; pass in a clock (or a logical one) instead", "Milliseconds overflow an int", "Nothing"],
          answer: 1,
          explanation: "Time is an input. A cache that reads a clock you pass in — a logical one advanced by `TICK` here, `java.time.Clock` in production — can be tested at the exact boundary `now == expiresAt`.",
        },
      ],
    },
    {
      slug: "lru-cache-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "LRU cache with statistics",
          prompt: `Build an \`LRUCache\` (HashMap + doubly linked list) with counters. The first line is the capacity (at least 1); then commands:

| Command | Prints |
| --- | --- |
| \`PUT <key> <value>\` | \`stored <key>\`, \`stored <key>, evicted <old>\`, or \`updated <key>\` |
| \`GET <key>\` | the value or \`miss\`; a hit is a use |
| \`PEEK <key>\` | the value or \`miss\`, **without** making the key more recent |
| \`DEL <key>\` | \`deleted <key>\` or \`miss\` |
| \`ORDER\` | \`order: <keys most to least recent>\` or \`order: empty\` |
| \`STATS\` | \`hits <h>, misses <m>, evictions <e>\` |
| anything else | \`error: unknown command <WORD>\` |

Only \`GET\` counts towards hits and misses (not \`PEEK\` or \`DEL\`); evictions count keys pushed out by a full cache, not deletes.`,
          starter: STATS_STARTER,
          solution: STATS_SOLUTION,
          hints: [
            "PEEK reads the node through the map and does not touch the list.",
            "DEL removes the node from both the map and the list; a later PUT then fits without an eviction.",
          ],
          cases: [
            { stdin: "2\nPUT a 1\nPUT b 2\nPEEK a\nPUT c 3\nGET a\nGET b\nSTATS\n", expected: "stored a\nstored b\n1\nstored c, evicted a\nmiss\n2\nhits 1, misses 1, evictions 1\n" },
            { stdin: "3\nPUT a 1\nPUT b 2\nPUT c 3\nDEL b\nPUT d 4\nORDER\nDEL b\nGET a\nPUT e 5\nORDER\nSTATS\n", expected: "stored a\nstored b\nstored c\ndeleted b\nstored d\norder: d c a\nmiss\n1\nstored e, evicted c\norder: e a d\nhits 1, misses 0, evictions 1\n", hidden: true },
            { stdin: "1\nSTATS\nGET x\nPUT x 1\nPUT x 2\nGET x\nPUT y 3\nPEEK x\nDEL y\nORDER\nSTATS\nCLEAR\n", expected: "hits 0, misses 0, evictions 0\nmiss\nstored x\nupdated x\n2\nstored y, evicted x\nmiss\ndeleted y\norder: empty\nhits 1, misses 1, evictions 1\nerror: unknown command CLEAR\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In the LRU design, what are the map's values?",
          options: ["The cached values themselves", "The list's nodes, so a lookup lands on the node to move", "Indexes into an array", "Timestamps of last use"],
          answer: 1,
          explanation: "Storing the node, not the value, is the whole trick: the map finds the node in O(1) and the node unlinks itself in O(1). Storing only values would leave no way to find the entry's place in the order.",
        },
        {
          prompt: "Why must each node store its key, not just its value?",
          options: ["For printing", "On eviction the cache starts from tail.prev and must delete that node's map entry, so the node has to know its key", "Java requires it for hashCode", "To support PEEK"],
          answer: 1,
          explanation: "Eviction begins at the list, not at the map. The node before the tail is all the cache holds at that moment, and removing its map entry needs the key.",
        },
        {
          prompt: "Capacity 3: `PUT 1`, `PUT 2`, `PUT 3`, `GET 1`, `GET 2`, `PUT 4`. Which key is evicted?",
          options: ["1", "2", "3", "4"],
          answer: 2,
          explanation: "After the puts the order is 3, 2, 1 (most recent first). `GET 1` gives 1, 3, 2; `GET 2` gives 2, 1, 3. The tail holds 3, so `PUT 4` evicts it.",
        },
        {
          prompt: "Does a `GET` that misses change the recency order?",
          options: ["Yes, it moves the tail to the front", "No — no node is touched", "Yes, it evicts the tail", "Only in a full cache"],
          answer: 1,
          explanation: "A miss finds no node, so nothing moves. Treating a miss as a use is a common bug that hidden cases catch with a miss followed by a PUT into a full cache.",
        },
        {
          prompt: "What does `PUT` of a key already in the cache do to the order?",
          options: ["Nothing", "Moves it to the front, as a use", "Moves it to the back", "Evicts the least recent key"],
          answer: 1,
          explanation: "Writing a key is a use, so it becomes the most recent. No eviction happens because the size does not change.",
        },
        {
          prompt: "Which Java class gives an LRU cache in a few lines?",
          options: ["TreeMap with a comparator", "LinkedHashMap with accessOrder = true and removeEldestEntry overridden", "HashSet", "ArrayDeque"],
          answer: 1,
          explanation: "`new LinkedHashMap<>(16, 0.75f, true)` keeps access order, and `removeEldestEntry` returning `size() > capacity` evicts. Say so in an interview — then build the map and list yourself, which is what is being graded.",
        },
        {
          prompt: "A cache is full and one of its entries has expired. A new key arrives. What should happen?",
          options: ["Evict the least recently used live entry", "Drop the expired entry; no live entry needs to go", "Refuse the new key", "Extend the expired entry's life"],
          answer: 1,
          explanation: "An expired entry already has no value to anyone. Dropping expired entries before evicting means the cache never throws out a live key while holding a dead one.",
        },
        {
          prompt: "Why should a `PEEK` (or a debug listing) not move the node?",
          options: ["It would be O(n)", "Reading for inspection is not a use by the application; moving it would change which key is evicted next", "Java forbids it", "It would double-count evictions"],
          answer: 1,
          explanation: "The order reflects how the application uses the cache. Monitoring or debugging reads that move nodes change eviction decisions — a classic heisenbug.",
        },
        {
          prompt: "What is the simplest correct way to make this LRU cache thread-safe?",
          options: ["Make the map a ConcurrentHashMap", "One lock around get and put, because even get rewires the list", "Make the fields volatile", "Nothing: get only reads"],
          answer: 1,
          explanation: "A get changes the list, so it is a write. A ConcurrentHashMap alone leaves the list racing. One lock is correct; sharding by key with a lock and a list per shard trades exact global LRU for throughput.",
        },
        {
          prompt: "What is the difference between LRU and LFU eviction?",
          options: ["They are the same", "LRU evicts the entry used longest ago; LFU evicts the entry used least often", "LFU evicts the newest entry", "LRU needs counters, LFU does not"],
          answer: 1,
          explanation: "LRU keeps an order of use; LFU keeps a count of uses (and needs extra structure — frequency buckets — to stay O(1)). LRU adapts faster when the working set shifts.",
        },
      ],
    },
  ],
});

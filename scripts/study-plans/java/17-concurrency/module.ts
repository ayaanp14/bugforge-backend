import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "concurrency",
  title: "Concurrency",
  blurb: "Threads and interruption, races and synchronized, the memory model and volatile, executors and Futures, locks, atomics and ConcurrentHashMap, CompletableFuture, latches, barriers and blocking queues.",
  icon: "threads",
  overview: `Concurrency is where Java programs go wrong in ways that pass every test — a lost increment once in a million runs, a loop that never sees the flag flip, a pool that quietly stops accepting work. It is also the part of the language interviewers use to separate people who have shipped a server from people who have read about one.

This module builds from the bottom. Threads first: start versus run, join, the interrupt protocol and daemons. Then the race — why count++ is three operations — and synchronized as the fix, with lock choice, granularity and deadlock ordering. The Java Memory Model gets its own lesson, because visibility is the half of concurrency nobody is taught: happens-before, volatile, safe publication, double-checked locking done right. Executors and Futures replace hand-made threads with a lifecycle; ReentrantLock, the atomics and ConcurrentHashMap are the sharper tools; and CompletableFuture with the latch, barrier, semaphore and blocking queue is how modern code composes asynchronous work.

Every exercise runs real threads on the judge and must print the same answer every time — which is the discipline the module teaches: start everything, join everything, and only then read the results.`,
  lessons: [
    {
      slug: "threads-and-runnables",
      file: "01-threads-and-runnables.md",
      exercises: [
        {
          title: "Split the sum",
          prompt: `Read an integer \`n\`, \`n\` integers, and a thread count \`k\`. Divide the array into \`k\` consecutive slices of \`ceil(n / k)\` elements (the last slices may be short or empty). Start \`k\` threads, thread \`i\` summing slice \`i\` into \`partial[i]\`. **Join every thread**, then print \`partial=<Arrays.toString(partial)>\` and \`total=<sum of partials>\`.

Example: \`6\` then \`1 2 3 4 5 6\` then \`3\` →
\`\`\`
partial=[3, 7, 11]
total=21
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        int chunk = (n + k - 1) / k;
        int[] partial = new int[k];
        Thread[] workers = new Thread[k];
        // TODO: start k threads, join them, print
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        int chunk = (n + k - 1) / k;
        int[] partial = new int[k];
        Thread[] workers = new Thread[k];
        for (int i = 0; i < k; i++) {
            final int slot = i;
            workers[i] = new Thread(() -> {
                int from = Math.min(n, slot * chunk), to = Math.min(n, (slot + 1) * chunk);
                int s = 0;
                for (int j = from; j < to; j++) s += a[j];
                partial[slot] = s;
            }, "worker-" + i);
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        System.out.println("partial=" + Arrays.toString(partial));
        System.out.println("total=" + Arrays.stream(partial).sum());
    }
}
`,
          hints: ["Capture the slot index in a final local before the lambda.", "Clip both ends of the slice with Math.min(n, …) so short and empty slices work."],
          cases: [
            { stdin: "6\n1 2 3 4 5 6\n3\n", expected: "partial=[3, 7, 11]\ntotal=21\n" },
            { stdin: "5\n10 20 30 40 50\n2\n", expected: "partial=[60, 90]\ntotal=150\n" },
            { stdin: "3\n1 2 3\n5\n", expected: "partial=[1, 2, 3, 0, 0]\ntotal=6\n", hidden: true },
          ],
        },
        {
          title: "Workers by name",
          prompt: `Read an integer \`n\` and \`n\` integers, then an integer \`k\` and \`k\` target values. Create \`k\` threads named \`worker-1\` … \`worker-k\`; thread \`i\` counts how many array elements equal target \`i\` and records both the count and **its own thread name** (\`Thread.currentThread().getName()\`). Start all, then join them in order, printing \`<name> found <count> of <target>\` after each join. Finally print \`state=<the state of worker-1 after its join>\`.

Example: \`5\` then \`1 2 2 3 2\`, then \`2\` then \`2 3\` →
\`\`\`
worker-1 found 3 of 2
worker-2 found 1 of 3
state=TERMINATED
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        int[] targets = new int[k];
        for (int i = 0; i < k; i++) targets[i] = in.nextInt();
        int[] counts = new int[k];
        String[] names = new String[k];
        Thread[] workers = new Thread[k];
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        int[] targets = new int[k];
        for (int i = 0; i < k; i++) targets[i] = in.nextInt();
        int[] counts = new int[k];
        String[] names = new String[k];
        Thread[] workers = new Thread[k];
        for (int i = 0; i < k; i++) {
            final int slot = i;
            workers[i] = new Thread(() -> {
                int c = 0;
                for (int x : a) if (x == targets[slot]) c++;
                counts[slot] = c;
                names[slot] = Thread.currentThread().getName();
            }, "worker-" + (i + 1));
            workers[i].start();
        }
        for (int i = 0; i < k; i++) {
            workers[i].join();
            System.out.println(names[i] + " found " + counts[i] + " of " + targets[i]);
        }
        System.out.println("state=" + workers[0].getState());
    }
}
`,
          hints: ["Pass the name as the second Thread constructor argument.", "Print only after join(i) — the worker's writes are then guaranteed visible."],
          cases: [
            { stdin: "5\n1 2 2 3 2\n2\n2 3\n", expected: "worker-1 found 3 of 2\nworker-2 found 1 of 3\nstate=TERMINATED\n" },
            { stdin: "3\n7 7 7\n1\n8\n", expected: "worker-1 found 0 of 8\nstate=TERMINATED\n" },
            { stdin: "4\n1 1 2 2\n3\n1 2 3\n", expected: "worker-1 found 2 of 1\nworker-2 found 2 of 2\nworker-3 found 0 of 3\nstate=TERMINATED\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict the behaviour:\n```java\nThread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));\nt.run();\n```",
          options: ["Prints `Thread-0` on a new thread", "Prints `main` — `run()` is an ordinary call on the current thread; only `start()` makes a thread", "Throws `IllegalThreadStateException`", "Prints nothing"],
          answer: 1,
          explanation: "The most common concurrency trick question. `start()` creates the OS thread and calls `run()` on it.",
        },
        {
          prompt: "Calling `start()` twice on the same `Thread`…",
          options: ["Runs it twice", "Throws `IllegalThreadStateException`", "Is ignored the second time", "Creates two threads"],
          answer: 1,
          explanation: "A thread runs once; create a new `Thread` (or use an executor) for another run.",
        },
        {
          prompt: "The correct way to stop a running thread is…",
          options: ["`t.stop()`", "`t.interrupt()`, with the thread checking its flag or handling `InterruptedException`", "`t.destroy()`", "Setting a plain `boolean` field"],
          answer: 1,
          explanation: "`stop()` is unsafe and removed; a plain boolean may never be seen (memory model). Interruption is the cooperative protocol.",
        },
        {
          prompt: "After `t.join()` returns in `main`…",
          options: ["`t` may still be running", "`t` has terminated and all its writes are visible to `main`", "`t` is paused", "Nothing is guaranteed about `t`'s writes"],
          answer: 1,
          explanation: "`join` is a happens-before edge — that is what makes start-all/join-all/read deterministic.",
        },
        {
          prompt: "A daemon thread…",
          options: ["Has the highest priority", "Does not keep the JVM alive and is killed at exit without running `finally` blocks", "Cannot be interrupted", "Runs only at start-up"],
          answer: 1,
          explanation: "Right for housekeeping; wrong for work that must complete.",
        },
      ],
    },
    {
      slug: "shared-state-and-synchronized",
      file: "02-shared-state-and-synchronized.md",
      exercises: [
        {
          title: "The counter, fixed",
          prompt: `Read \`k\` (threads) and \`m\` (increments per thread). Share one \`Counter\` whose \`increment()\` and \`get()\` are both \`synchronized\`. Start \`k\` threads that each call \`increment()\` \`m\` times, join them, and print \`expected=<k×m> actual=<counter> match=<expected == actual>\`. Without the \`synchronized\`, \`actual\` would fall short on most runs; with it the program is correct every time.

Example: \`4 1000\` →
\`\`\`
expected=4000 actual=4000 match=true
\`\`\``,
          starter: String.raw`import java.util.*;

class Counter {
    private int count;
    // TODO: synchronized increment() and get()
}

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), m = in.nextInt();
        Counter counter = new Counter();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class Counter {
    private int count;
    synchronized void increment() { count++; }
    synchronized int get() { return count; }
}

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), m = in.nextInt();
        Counter counter = new Counter();
        Thread[] workers = new Thread[k];
        for (int i = 0; i < k; i++) {
            workers[i] = new Thread(() -> { for (int j = 0; j < m; j++) counter.increment(); });
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        int expected = k * m, actual = counter.get();
        System.out.println("expected=" + expected + " actual=" + actual + " match=" + (expected == actual));
    }
}
`,
          hints: ["A synchronized instance method locks this; both methods on the same lock makes the read safe too.", "Join before reading."],
          cases: [
            { stdin: "4 1000\n", expected: "expected=4000 actual=4000 match=true\n" },
            { stdin: "1 5\n", expected: "expected=5 actual=5 match=true\n" },
            { stdin: "8 20000\n", expected: "expected=160000 actual=160000 match=true\n", hidden: true },
          ],
        },
        {
          title: "Transfers under one lock",
          prompt: `Read an integer \`n\` and \`n\` opening balances, then an integer \`t\` and \`t\` transfers \`from to amount\` (0-based account indexes; balances may go negative). Run **each transfer on its own thread**, guarding the balances array with a single lock (\`synchronized\` on the bank object). Join all threads, then print \`balances=<Arrays.toString>\`, \`total=<sum>\` and \`preserved=<total equals the opening total>\`.

Example: \`3\` then \`100 50 0\`, \`3\` then \`0 1 30\`, \`1 2 60\`, \`2 0 10\` →
\`\`\`
balances=[80, 20, 50]
total=150
preserved=true
\`\`\``,
          starter: String.raw`import java.util.*;

class Bank {
    final int[] balances;
    Bank(int[] balances) { this.balances = balances; }
    void transfer(int from, int to, int amount) {
        // TODO: synchronized
    }
}

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] opening = new int[n];
        for (int i = 0; i < n; i++) opening[i] = in.nextInt();
        Bank bank = new Bank(opening.clone());
        int t = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

class Bank {
    final int[] balances;
    Bank(int[] balances) { this.balances = balances; }
    synchronized void transfer(int from, int to, int amount) {
        balances[from] -= amount;
        balances[to] += amount;
    }
    synchronized int total() { return Arrays.stream(balances).sum(); }
}

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] opening = new int[n];
        for (int i = 0; i < n; i++) opening[i] = in.nextInt();
        Bank bank = new Bank(opening.clone());
        int t = in.nextInt();
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < t; i++) {
            int from = in.nextInt(), to = in.nextInt(), amount = in.nextInt();
            Thread th = new Thread(() -> bank.transfer(from, to, amount));
            threads.add(th);
            th.start();
        }
        for (Thread th : threads) th.join();
        System.out.println("balances=" + Arrays.toString(bank.balances));
        System.out.println("total=" + bank.total());
        System.out.println("preserved=" + (bank.total() == Arrays.stream(opening).sum()));
    }
}
`,
          hints: ["One lock for the whole array means a debit and its credit are one atomic step.", "Read the transfer's three numbers on the main thread before creating the lambda."],
          cases: [
            { stdin: "3\n100 50 0\n3\n0 1 30\n1 2 60\n2 0 10\n", expected: "balances=[80, 20, 50]\ntotal=150\npreserved=true\n" },
            { stdin: "2\n5 5\n1\n0 1 10\n", expected: "balances=[-5, 15]\ntotal=10\npreserved=true\n" },
            { stdin: "2\n0 0\n4\n0 1 1\n0 1 1\n1 0 1\n1 0 3\n", expected: "balances=[2, -2]\ntotal=0\npreserved=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`count++` on a shared `int` from two threads is a race because…",
          options: ["`int` is 64-bit", "It is read-modify-write: three steps that can interleave", "The JIT forbids it", "It is atomic but slow"],
          answer: 1,
          explanation: "Both threads can read 5 and both write 6, losing an increment.",
        },
        {
          prompt: "A `synchronized` instance method locks…",
          options: ["The class", "`this`", "A global lock", "Nothing — it only prevents reordering"],
          answer: 1,
          explanation: "A `static synchronized` method locks the `Class` object; a block names its own lock.",
        },
        {
          prompt: "Only the write methods of a class are `synchronized`; its `get()` is not. This is…",
          options: ["Fine — reads are always safe", "A bug: the reader may see a stale or partially written value", "Faster and correct", "A compile error"],
          answer: 1,
          explanation: "Visibility needs the acquire on the reading side too.",
        },
        {
          prompt: "The one rule that prevents deadlock with several locks is…",
          options: ["Use `Thread.sleep` between locks", "Acquire them in a consistent global order", "Use more locks", "Lock on string literals"],
          answer: 1,
          explanation: "Or use a single lock, or `tryLock` with back-off.",
        },
        {
          prompt: "`wait()` must be called…",
          options: ["Anywhere", "While holding the object's monitor, inside a `while` loop rechecking the condition", "Only from `main`", "After `notify()`"],
          answer: 1,
          explanation: "Otherwise `IllegalMonitorStateException`; and spurious wake-ups make the loop mandatory.",
        },
        {
          prompt: "Predict: two threads each run `if (!map.containsKey(k)) map.put(k, 1)` on a `Collections.synchronizedMap`. The result…",
          options: ["Is always one insertion", "May run `put` twice — each call is atomic, the pair is not", "Throws", "Deadlocks"],
          answer: 1,
          explanation: "Check-then-act across two synchronised calls is still a race; use `putIfAbsent` or one block.",
        },
      ],
    },
    {
      slug: "visibility-and-the-memory-model",
      file: "03-visibility-and-the-memory-model.md",
      exercises: [
        {
          title: "Publish through a latch",
          prompt: `Read an integer \`k\` and \`k\` words. Start \`k\` threads; thread \`i\` writes the upper-cased word into \`results[i]\` and then calls \`countDown()\` on a \`CountDownLatch(k)\`. The main thread calls \`await()\` — **no joins** — and then prints \`results=<Arrays.toString(results)>\` and \`remaining=<latch.getCount()>\`. The latch's happens-before edge is what makes every write visible.

Example: \`3\` then \`ab cd ef\` →
\`\`\`
results=[AB, CD, EF]
remaining=0
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        String[] words = new String[k];
        for (int i = 0; i < k; i++) words[i] = in.next();
        String[] results = new String[k];
        CountDownLatch done = new CountDownLatch(k);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        String[] words = new String[k];
        for (int i = 0; i < k; i++) words[i] = in.next();
        String[] results = new String[k];
        CountDownLatch done = new CountDownLatch(k);
        for (int i = 0; i < k; i++) {
            final int slot = i;
            new Thread(() -> {
                results[slot] = words[slot].toUpperCase();
                done.countDown();
            }).start();
        }
        done.await();
        System.out.println("results=" + Arrays.toString(results));
        System.out.println("remaining=" + done.getCount());
    }
}
`,
          hints: ["Write the result, then countDown — the order matters for the happens-before edge.", "await() returns once the count hits zero."],
          cases: [
            { stdin: "3\nab cd ef\n", expected: "results=[AB, CD, EF]\nremaining=0\n" },
            { stdin: "1\nsolo\n", expected: "results=[SOLO]\nremaining=0\n" },
            { stdin: "4\nx yy zzz wwww\n", expected: "results=[X, YY, ZZZ, WWWW]\nremaining=0\n", hidden: true },
          ],
        },
        {
          title: "An immutable snapshot",
          prompt: `Read an integer \`n\` and \`n\` integers into a mutable \`ArrayList\`. Write a class \`Snapshot\` with a single \`final List<Integer> values\` field that **defensively copies** its constructor argument with \`List.copyOf\`. Build a snapshot, then mutate the source list: append \`99\` and set index 0 to \`-1\`. Print \`snapshot=<snapshot.values()>\` and \`source=<the list>\`. Then try \`snapshot.values().add(1)\`; catch the \`UnsupportedOperationException\` and print \`mutable=false\` (or \`mutable=true\` if no exception).

Example: \`3\` then \`5 6 7\` →
\`\`\`
snapshot=[5, 6, 7]
source=[-1, 6, 7, 99]
mutable=false
\`\`\``,
          starter: String.raw`import java.util.*;

final class Snapshot {
    // TODO: private final List<Integer> values; constructor copies; values() getter
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> source = new ArrayList<>();
        for (int i = 0; i < n; i++) source.add(in.nextInt());
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

final class Snapshot {
    private final List<Integer> values;
    Snapshot(List<Integer> values) { this.values = List.copyOf(values); }
    List<Integer> values() { return values; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Integer> source = new ArrayList<>();
        for (int i = 0; i < n; i++) source.add(in.nextInt());
        Snapshot snap = new Snapshot(source);
        source.add(99);
        source.set(0, -1);
        System.out.println("snapshot=" + snap.values());
        System.out.println("source=" + source);
        try {
            snap.values().add(1);
            System.out.println("mutable=true");
        } catch (UnsupportedOperationException e) {
            System.out.println("mutable=false");
        }
    }
}
`,
          hints: ["List.copyOf returns an unmodifiable copy — the caller's later changes cannot reach it.", "A final field plus an immutable value is what makes the object safe to share without locks."],
          cases: [
            { stdin: "3\n5 6 7\n", expected: "snapshot=[5, 6, 7]\nsource=[-1, 6, 7, 99]\nmutable=false\n" },
            { stdin: "1\n0\n", expected: "snapshot=[0]\nsource=[-1, 99]\nmutable=false\n" },
            { stdin: "2\n-4 4\n", expected: "snapshot=[-4, 4]\nsource=[-1, 4, 99]\nmutable=false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A worker loops on `while (running) {}` where `running` is a plain `boolean`; `main` sets it to `false`. The worker…",
          options: ["Stops immediately", "May never stop — the read can be hoisted or cached; the field needs `volatile`", "Throws", "Stops after one second"],
          answer: 1,
          explanation: "Without a happens-before edge the write need not become visible.",
        },
        {
          prompt: "`volatile int count; count++;` from several threads is…",
          options: ["Atomic and visible", "Visible but still a race — `++` is read-modify-write", "A compile error", "Slower but correct"],
          answer: 1,
          explanation: "`volatile` gives visibility and ordering, not atomicity; use `AtomicInteger`.",
        },
        {
          prompt: "Which is **not** a happens-before source?",
          options: ["Unlocking a monitor another thread later locks", "A `volatile` write followed by a read of that field", "`Thread.sleep(100)` between the write and the read", "`Thread.join()` returning"],
          answer: 2,
          explanation: "Sleep and print statements are not synchronisation actions; \"it works with a sleep\" means you have a race.",
        },
        {
          prompt: "Double-checked locking without `volatile` on the instance field can…",
          options: ["Deadlock", "Return a reference to an object whose fields are not yet visible", "Create two instances always", "Not compile"],
          answer: 1,
          explanation: "Reordering may publish the reference before the constructor's writes; `volatile` (or the holder idiom) fixes it.",
        },
        {
          prompt: "Immutable objects are thread-safe because…",
          options: ["They live on the stack", "`final` fields are guaranteed visible after construction and nothing changes afterwards", "The JVM locks them", "They are always cached"],
          answer: 1,
          explanation: "No mutable state, no race. Make fields `final`, copy inputs defensively, and never leak `this` from the constructor.",
        },
      ],
    },
    {
      slug: "executors-and-futures",
      file: "04-executors-and-futures.md",
      exercises: [
        {
          title: "invokeAll keeps the order",
          prompt: `Read a pool size \`p\`, an integer \`n\` and \`n\` integers. Build a \`Callable<Integer>\` per integer \`x\` that counts the primes \`≤ x\`, submit them all with \`invokeAll\` on a fixed pool of \`p\` threads, and print \`<x> -> <count>\` in **input order** — \`invokeAll\` returns the futures in task order however the threads finish. Then \`shutdown()\`, \`awaitTermination\`, and print \`terminated=<isTerminated()>\`.

Example: \`2\` then \`3\` then \`10 20 1\` →
\`\`\`
10 -> 4
20 -> 8
1 -> 0
terminated=true
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static int primesUpTo(int x) {
        int c = 0;
        for (int i = 2; i <= x; i++) {
            boolean prime = true;
            for (int d = 2; d * d <= i; d++) if (i % d == 0) { prime = false; break; }
            if (prime) c++;
        }
        return c;
    }

    public static void main(String[] args) throws Exception {
        Scanner in = new Scanner(System.in);
        int p = in.nextInt(), n = in.nextInt();
        int[] xs = new int[n];
        for (int i = 0; i < n; i++) xs[i] = in.nextInt();
        ExecutorService pool = Executors.newFixedThreadPool(p);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static int primesUpTo(int x) {
        int c = 0;
        for (int i = 2; i <= x; i++) {
            boolean prime = true;
            for (int d = 2; d * d <= i; d++) if (i % d == 0) { prime = false; break; }
            if (prime) c++;
        }
        return c;
    }

    public static void main(String[] args) throws Exception {
        Scanner in = new Scanner(System.in);
        int p = in.nextInt(), n = in.nextInt();
        int[] xs = new int[n];
        for (int i = 0; i < n; i++) xs[i] = in.nextInt();
        ExecutorService pool = Executors.newFixedThreadPool(p);
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int x : xs) tasks.add(() -> primesUpTo(x));
        List<Future<Integer>> futures = pool.invokeAll(tasks);
        for (int i = 0; i < n; i++) System.out.println(xs[i] + " -> " + futures.get(i).get());
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);
        System.out.println("terminated=" + pool.isTerminated());
    }
}
`,
          hints: ["A lambda with no parameters that returns a value is a Callable.", "shutdown() then awaitTermination(); isTerminated() is true once every task has finished."],
          cases: [
            { stdin: "2\n3\n10 20 1\n", expected: "10 -> 4\n20 -> 8\n1 -> 0\nterminated=true\n" },
            { stdin: "1\n1\n2\n", expected: "2 -> 1\nterminated=true\n" },
            { stdin: "4\n4\n100 7 0 30\n", expected: "100 -> 25\n7 -> 4\n0 -> 0\n30 -> 10\nterminated=true\n", hidden: true },
          ],
        },
        {
          title: "Failures stay in the Future",
          prompt: `Read an integer \`n\` and \`n\` integers. On a fixed pool of 2 threads, \`submit\` a \`Callable\` per value that returns \`100 / x\`. Collect each \`Future\` in order: print \`task <i>: <result>\` on success, or \`task <i>: failed <simple class name of the cause>\` when \`get()\` throws \`ExecutionException\` (use \`getCause()\`). Then print \`completed=<n ok> failed=<n failed>\` and shut the pool down.

Example: \`3\` then \`4 0 25\` →
\`\`\`
task 0: 25
task 1: failed ArithmeticException
task 2: 4
completed=2 failed=1
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] xs = new int[n];
        for (int i = 0; i < n; i++) xs[i] = in.nextInt();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        // TODO
        pool.shutdown();
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] xs = new int[n];
        for (int i = 0; i < n; i++) xs[i] = in.nextInt();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Integer>> futures = new ArrayList<>();
        for (int x : xs) futures.add(pool.submit(() -> 100 / x));
        int ok = 0, failed = 0;
        for (int i = 0; i < n; i++) {
            try {
                System.out.println("task " + i + ": " + futures.get(i).get());
                ok++;
            } catch (ExecutionException e) {
                System.out.println("task " + i + ": failed " + e.getCause().getClass().getSimpleName());
                failed++;
            }
        }
        System.out.println("completed=" + ok + " failed=" + failed);
        pool.shutdown();
    }
}
`,
          hints: ["An exception thrown inside the task is stored in the Future and rethrown by get() wrapped in ExecutionException.", "getCause() is the original exception."],
          cases: [
            { stdin: "3\n4 0 25\n", expected: "task 0: 25\ntask 1: failed ArithmeticException\ntask 2: 4\ncompleted=2 failed=1\n" },
            { stdin: "2\n0 0\n", expected: "task 0: failed ArithmeticException\ntask 1: failed ArithmeticException\ncompleted=0 failed=2\n" },
            { stdin: "1\n-50\n", expected: "task 0: -2\ncompleted=1 failed=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Executors.newCachedThreadPool()` is dangerous under load because…",
          options: ["It has too few threads", "It creates an unbounded number of threads", "It queues forever", "It cannot run `Callable`s"],
          answer: 1,
          explanation: "A burst of tasks becomes a burst of OS threads; `newFixedThreadPool` has the opposite problem — an unbounded queue.",
        },
        {
          prompt: "`Future.get()` on a task that threw `IllegalStateException`…",
          options: ["Throws `IllegalStateException` directly", "Throws `ExecutionException` whose cause is the `IllegalStateException`", "Returns `null`", "Blocks forever"],
          answer: 1,
          explanation: "Task exceptions are captured and rewrapped; an uncollected future hides the failure entirely.",
        },
        {
          prompt: "`invokeAll(tasks)` returns…",
          options: ["Futures in completion order", "Futures in the order of the task list, after all have completed", "The first result", "A single combined future"],
          answer: 1,
          explanation: "Which is what makes multi-threaded output deterministic.",
        },
        {
          prompt: "`shutdown()` versus `shutdownNow()`:",
          options: ["Identical", "`shutdown` stops accepting and lets queued tasks finish; `shutdownNow` interrupts running tasks and returns the ones never started", "`shutdownNow` waits longer", "`shutdown` kills threads"],
          answer: 1,
          explanation: "Follow `shutdown()` with `awaitTermination()`; escalate to `shutdownNow()` on timeout.",
        },
        {
          prompt: "A `ThreadLocal` set in a pooled thread and never removed…",
          options: ["Is cleared automatically after the task", "Leaks into the next task that runs on that thread", "Throws", "Is copied to all threads"],
          answer: 1,
          explanation: "Pool threads outlive tasks; pair `set` with `remove` in a `finally`.",
        },
        {
          prompt: "A periodic task in a `ScheduledExecutorService` throws once. Afterwards…",
          options: ["It keeps running", "It is cancelled silently and never runs again", "The pool shuts down", "The exception is printed each period"],
          answer: 1,
          explanation: "Wrap the body in try/catch and log; otherwise the job disappears without a trace.",
        },
      ],
    },
    {
      slug: "locks-atomics-and-concurrent-collections",
      file: "05-locks-atomics-and-concurrent-collections.md",
      exercises: [
        {
          title: "Concurrent word count",
          prompt: `Read an integer \`n\` and \`n\` words, then a thread count \`k\`. Thread \`i\` handles the words at indexes \`i, i + k, i + 2k, …\` and counts each with \`ConcurrentHashMap.merge(word, 1, Integer::sum)\` — atomic per key, no explicit lock. Join all threads, then print \`<word>=<count>\` for every word in natural order, and \`distinct=<map size>\`.

Example: \`6\` then \`b a b c a b\`, then \`2\` →
\`\`\`
a=2
b=3
c=1
distinct=3
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] words = new String[n];
        for (int i = 0; i < n; i++) words[i] = in.next();
        int k = in.nextInt();
        ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] words = new String[n];
        for (int i = 0; i < n; i++) words[i] = in.next();
        int k = in.nextInt();
        ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
        Thread[] workers = new Thread[k];
        for (int t = 0; t < k; t++) {
            final int start = t;
            workers[t] = new Thread(() -> {
                for (int i = start; i < n; i += k) counts.merge(words[i], 1, Integer::sum);
            });
            workers[t].start();
        }
        for (Thread w : workers) w.join();
        new TreeMap<>(counts).forEach((w, c) -> System.out.println(w + "=" + c));
        System.out.println("distinct=" + counts.size());
    }
}
`,
          hints: ["merge on ConcurrentHashMap is atomic per key — two threads counting the same word never lose an increment.", "Copy into a TreeMap for sorted output."],
          cases: [
            { stdin: "6\nb a b c a b\n2\n", expected: "a=2\nb=3\nc=1\ndistinct=3\n" },
            { stdin: "1\nzz\n3\n", expected: "zz=1\ndistinct=1\n" },
            { stdin: "8\nx x x x y y y x\n4\n", expected: "x=5\ny=3\ndistinct=2\n", hidden: true },
          ],
        },
        {
          title: "Atomics, no locks",
          prompt: `Read \`k\` (threads), \`m\` (rounds), then \`k\` integers — one value per thread. Every thread performs \`m\` rounds; in each round it calls \`count.incrementAndGet()\` on a shared \`AtomicInteger\`, \`sum.add(value)\` on a shared \`LongAdder\`, and \`max.accumulateAndGet(value, Math::max)\` on a shared \`AtomicInteger\`. Join all, then print \`count=<k×m> sum=<m × Σvalues> max=<largest value>\`.

Example: \`3 4\` then \`5 -2 9\` →
\`\`\`
count=12 sum=48 max=9
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), m = in.nextInt();
        int[] values = new int[k];
        for (int i = 0; i < k; i++) values[i] = in.nextInt();
        AtomicInteger count = new AtomicInteger();
        LongAdder sum = new LongAdder();
        AtomicInteger max = new AtomicInteger(Integer.MIN_VALUE);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), m = in.nextInt();
        int[] values = new int[k];
        for (int i = 0; i < k; i++) values[i] = in.nextInt();
        AtomicInteger count = new AtomicInteger();
        LongAdder sum = new LongAdder();
        AtomicInteger max = new AtomicInteger(Integer.MIN_VALUE);
        Thread[] workers = new Thread[k];
        for (int i = 0; i < k; i++) {
            final int v = values[i];
            workers[i] = new Thread(() -> {
                for (int r = 0; r < m; r++) {
                    count.incrementAndGet();
                    sum.add(v);
                    max.accumulateAndGet(v, Math::max);
                }
            });
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        System.out.println("count=" + count.get() + " sum=" + sum.sum() + " max=" + max.get());
    }
}
`,
          hints: ["accumulateAndGet(v, Math::max) is a CAS loop that keeps the larger value.", "LongAdder.sum() reads the per-thread cells; call it after the joins."],
          cases: [
            { stdin: "3 4\n5 -2 9\n", expected: "count=12 sum=48 max=9\n" },
            { stdin: "1 1\n-7\n", expected: "count=1 sum=-7 max=-7\n" },
            { stdin: "4 1000\n1 2 3 4\n", expected: "count=4000 sum=10000 max=4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`ReentrantLock.unlock()` must be called…",
          options: ["Only on error", "In a `finally` block, so an exception cannot leave the lock held", "Twice", "Before `lock()`"],
          answer: 1,
          explanation: "Unlike `synchronized`, nothing releases the lock automatically.",
        },
        {
          prompt: "`AtomicInteger.incrementAndGet()` is implemented with…",
          options: ["A `synchronized` block", "A compare-and-swap loop — no lock", "A spin on `volatile`", "A `ReentrantLock`"],
          answer: 1,
          explanation: "CAS retries if another thread changed the value in between; `LongAdder` reduces that contention for hot counters.",
        },
        {
          prompt: "`ConcurrentHashMap.computeIfAbsent(k, f)` guarantees…",
          options: ["Nothing about `f`", "`f` runs at most once per key even under contention", "`f` runs on every call", "The map is locked globally"],
          answer: 1,
          explanation: "The compound operations are atomic per key — the whole point over a synchronised `HashMap`.",
        },
        {
          prompt: "Iterating a `ConcurrentHashMap` while another thread modifies it…",
          options: ["Throws `ConcurrentModificationException`", "Is weakly consistent: no exception, reflecting some state during the traversal", "Blocks the writer", "Returns a copy"],
          answer: 1,
          explanation: "`size()` is likewise an estimate under concurrent updates.",
        },
        {
          prompt: "`CopyOnWriteArrayList` suits…",
          options: ["Frequent writes", "Read-mostly data like listener lists — every write copies the array", "Sorted access", "Producer–consumer"],
          answer: 1,
          explanation: "Iteration is a snapshot and never fails; writes are O(n).",
        },
        {
          prompt: "Which should you reach for **first** when two threads share a counter?",
          options: ["`ReentrantReadWriteLock`", "`AtomicInteger` (or `LongAdder` if hot)", "`synchronized` on a `String` literal", "`Thread.sleep`"],
          answer: 1,
          explanation: "Confine → immutable → atomic → concurrent collection → lock, in that order.",
        },
      ],
    },
    {
      slug: "completablefuture-and-coordination",
      file: "06-completablefuture-and-coordination.md",
      exercises: [
        {
          title: "A pipeline of futures",
          prompt: `Read two tokens \`a\` and \`b\`. Build \`fa = supplyAsync(parse a).exceptionally(e -> 0)\` and \`fb\` likewise, so that a non-numeric token becomes \`0\`. Then \`squared = fa.thenApply(x -> x * x)\`, \`combined = squared.thenCombine(fb, Integer::sum)\`, and \`ratio = fa.thenCombine(fb, (x, y) -> x / y).handle(...)\` producing \`ratio=<value>\` or \`ratio=error <simple class name of the cause>\`. Print, in order, \`a=<fa>\`, \`b=<fb>\`, \`squared=<>\`, \`combined=<>\` and the ratio line, using \`join()\`.

Example: \`6 3\` →
\`\`\`
a=6
b=3
squared=36
combined=39
ratio=2
\`\`\`
Example: \`x 0\` → \`a=0\`, \`b=0\`, \`squared=0\`, \`combined=0\`, \`ratio=error ArithmeticException\`.`,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.next(), b = in.next();
        CompletableFuture<Integer> fa = CompletableFuture.supplyAsync(() -> Integer.parseInt(a)).exceptionally(e -> 0);
        CompletableFuture<Integer> fb = CompletableFuture.supplyAsync(() -> Integer.parseInt(b)).exceptionally(e -> 0);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.next(), b = in.next();
        CompletableFuture<Integer> fa = CompletableFuture.supplyAsync(() -> Integer.parseInt(a)).exceptionally(e -> 0);
        CompletableFuture<Integer> fb = CompletableFuture.supplyAsync(() -> Integer.parseInt(b)).exceptionally(e -> 0);
        CompletableFuture<Integer> squared = fa.thenApply(x -> x * x);
        CompletableFuture<Integer> combined = squared.thenCombine(fb, Integer::sum);
        CompletableFuture<String> ratio = fa.thenCombine(fb, (x, y) -> x / y)
            .handle((v, e) -> e == null ? "ratio=" + v : "ratio=error " + e.getCause().getClass().getSimpleName());
        System.out.println("a=" + fa.join());
        System.out.println("b=" + fb.join());
        System.out.println("squared=" + squared.join());
        System.out.println("combined=" + combined.join());
        System.out.println(ratio.join());
    }
}
`,
          hints: ["handle receives the exception wrapped in CompletionException — getCause() is the ArithmeticException.", "join() blocks until each stage completes; the stages themselves ran on the common pool."],
          cases: [
            { stdin: "6 3\n", expected: "a=6\nb=3\nsquared=36\ncombined=39\nratio=2\n" },
            { stdin: "x 0\n", expected: "a=0\nb=0\nsquared=0\ncombined=0\nratio=error ArithmeticException\n" },
            { stdin: "-4 8\n", expected: "a=-4\nb=8\nsquared=16\ncombined=24\nratio=0\n", hidden: true },
          ],
        },
        {
          title: "Producer, consumer, poison pill",
          prompt: `Read an integer \`n\`. A **producer** thread puts \`1 … n\` into an \`ArrayBlockingQueue<Integer>\` of capacity 4, then a poison pill \`-1\`. A **consumer** thread takes until it sees the pill, tracking how many values it consumed, their sum, and the largest. Join both threads and print \`consumed=<n> sum=<n(n+1)/2> max=<n or 0>\`. With capacity 4 and a large \`n\` the producer must block — the queue's back-pressure at work.

Example: \`5\` →
\`\`\`
consumed=5 sum=15 max=5
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static final int POISON = -1;

    public static void main(String[] args) throws InterruptedException {
        int n = new Scanner(System.in).nextInt();
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(4);
        int[] stats = new int[3];   // consumed, sum, max
        // TODO: producer and consumer threads
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static final int POISON = -1;

    public static void main(String[] args) throws InterruptedException {
        int n = new Scanner(System.in).nextInt();
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(4);
        int[] stats = new int[3];   // consumed, sum, max
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= n; i++) queue.put(i);
                queue.put(POISON);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        Thread consumer = new Thread(() -> {
            try {
                for (int x; (x = queue.take()) != POISON; ) {
                    stats[0]++;
                    stats[1] += x;
                    stats[2] = Math.max(stats[2], x);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("consumed=" + stats[0] + " sum=" + stats[1] + " max=" + stats[2]);
    }
}
`,
          hints: ["put blocks when the queue is full; take blocks when empty — no wait/notify needed.", "The pill must be the last thing put; the consumer stops the moment it takes it."],
          cases: [
            { stdin: "5\n", expected: "consumed=5 sum=15 max=5\n" },
            { stdin: "0\n", expected: "consumed=0 sum=0 max=0\n" },
            { stdin: "1000\n", expected: "consumed=1000 sum=500500 max=1000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`thenCompose` rather than `thenApply` when…",
          options: ["The function is slow", "The function itself returns a `CompletableFuture` — like `flatMap`", "You need a timeout", "There are two futures"],
          answer: 1,
          explanation: "`thenApply` would give `CompletableFuture<CompletableFuture<T>>`.",
        },
        {
          prompt: "`supplyAsync(task)` without an executor runs the task on…",
          options: ["A new thread", "The common `ForkJoinPool` — so never block there", "The calling thread", "The main thread"],
          answer: 1,
          explanation: "Pass your own executor for blocking I/O.",
        },
        {
          prompt: "A stage throws. The following `thenApply` stages…",
          options: ["Run with `null`", "Are skipped until an `exceptionally`/`handle`/`whenComplete`", "Retry", "Block"],
          answer: 1,
          explanation: "Exactly like a thrown exception skipping statements to a `catch`; the cause is wrapped in `CompletionException`.",
        },
        {
          prompt: "`CountDownLatch` versus `CyclicBarrier`:",
          options: ["Identical", "A latch counts down once and is waited on by others; a barrier is a reusable meeting point for the parties themselves", "A barrier cannot have an action", "A latch resets"],
          answer: 1,
          explanation: "Latch: wait for *n* events. Barrier: *k* threads meet every round, with an optional action per trip.",
        },
        {
          prompt: "`BlockingQueue.put` on a full `ArrayBlockingQueue`…",
          options: ["Throws", "Blocks until space frees — back-pressure on the producer", "Drops the element", "Grows the queue"],
          answer: 1,
          explanation: "`offer` returns `false` instead; `offer(x, timeout, unit)` waits with a deadline.",
        },
        {
          prompt: "Predict: `CompletableFuture.allOf(f1, f2).join()` returns…",
          options: ["A list of both results", "`null` — `allOf` is `CompletableFuture<Void>`; read the results from `f1` and `f2` afterwards", "The first result", "A combined string"],
          answer: 1,
          explanation: "`allOf` tells you *when*; the values live in the original futures, whose `join()` is now instant.",
        },
      ],
    },
    {
      slug: "concurrency-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Row sums on a pool",
          prompt: `Read \`r\`, \`c\` and a pool size \`p\`, then an \`r × c\` matrix of integers. On a fixed pool of \`p\` threads, submit one \`Callable<Long>\` per row with \`invokeAll\`, then print \`row <i>: <sum>\` for every row in order and \`total=<sum of all>\`. Shut the pool down, await termination, and print \`terminated=true\`.

Example: \`2 3 2\` then \`1 2 3\` / \`4 5 6\` →
\`\`\`
row 0: 6
row 1: 15
total=21
terminated=true
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt(), p = in.nextInt();
        long[][] m = new long[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextLong();
        ExecutorService pool = Executors.newFixedThreadPool(p);
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt(), p = in.nextInt();
        long[][] m = new long[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextLong();
        ExecutorService pool = Executors.newFixedThreadPool(p);
        List<Callable<Long>> tasks = new ArrayList<>();
        for (long[] row : m) tasks.add(() -> Arrays.stream(row).sum());
        List<Future<Long>> futures = pool.invokeAll(tasks);
        long total = 0;
        for (int i = 0; i < r; i++) {
            long s = futures.get(i).get();
            total += s;
            System.out.println("row " + i + ": " + s);
        }
        System.out.println("total=" + total);
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);
        System.out.println("terminated=" + pool.isTerminated());
    }
}
`,
          hints: [
            "One Callable per row; capture the row array in the lambda.",
            "invokeAll returns futures in task order — print by index.",
            "shutdown + awaitTermination before reporting terminated.",
          ],
          cases: [
            { stdin: "2 3 2\n1 2 3\n4 5 6\n", expected: "row 0: 6\nrow 1: 15\ntotal=21\nterminated=true\n" },
            { stdin: "1 1 1\n-9\n", expected: "row 0: -9\ntotal=-9\nterminated=true\n" },
            { stdin: "3 2 4\n1000000000 1000000000\n0 0\n-1 1\n", expected: "row 0: 2000000000\nrow 1: 0\nrow 2: 0\ntotal=2000000000\nterminated=true\n", hidden: true },
          ],
        },
        {
          title: "Transfers with ordered locks",
          prompt: `Read an integer \`n\` and \`n\` opening balances, then \`t\` and \`t\` transfers \`from to amount\`. Give **each account its own \`ReentrantLock\`**. Run every transfer on its own thread; a transfer locks the two accounts **in ascending index order** (lower index first — the rule that makes deadlock impossible), moves the money (balances may go negative), and unlocks both in \`finally\` blocks. Join all, then print \`balances=<Arrays.toString>\`, \`total=<sum>\` and \`preserved=<total equals opening total>\`.

Example: \`3\` then \`100 50 0\`, \`3\` then \`0 1 30\`, \`1 2 60\`, \`2 0 10\` →
\`\`\`
balances=[80, 20, 50]
total=150
preserved=true
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.locks.*;

public class Main {
    static int[] balances;
    static ReentrantLock[] locks;

    static void transfer(int from, int to, int amount) {
        // TODO: lock min(from,to) then max(from,to); move; unlock in finally
    }

    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        balances = new int[n];
        locks = new ReentrantLock[n];
        for (int i = 0; i < n; i++) { balances[i] = in.nextInt(); locks[i] = new ReentrantLock(); }
        int opening = Arrays.stream(balances).sum();
        int t = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.locks.*;

public class Main {
    static int[] balances;
    static ReentrantLock[] locks;

    static void transfer(int from, int to, int amount) {
        int first = Math.min(from, to), second = Math.max(from, to);
        locks[first].lock();
        try {
            if (second != first) locks[second].lock();
            try {
                balances[from] -= amount;
                balances[to] += amount;
            } finally {
                if (second != first) locks[second].unlock();
            }
        } finally {
            locks[first].unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        balances = new int[n];
        locks = new ReentrantLock[n];
        for (int i = 0; i < n; i++) { balances[i] = in.nextInt(); locks[i] = new ReentrantLock(); }
        int opening = Arrays.stream(balances).sum();
        int t = in.nextInt();
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < t; i++) {
            int from = in.nextInt(), to = in.nextInt(), amount = in.nextInt();
            Thread th = new Thread(() -> transfer(from, to, amount));
            threads.add(th);
            th.start();
        }
        for (Thread th : threads) th.join();
        int total = Arrays.stream(balances).sum();
        System.out.println("balances=" + Arrays.toString(balances));
        System.out.println("total=" + total);
        System.out.println("preserved=" + (total == opening));
    }
}
`,
          hints: [
            "Sort the two indexes; lock the smaller first, always.",
            "A transfer to the same account must not lock the same ReentrantLock twice unnecessarily — guard the second lock.",
            "Nest the try/finally so each unlock matches its lock even on failure.",
          ],
          cases: [
            { stdin: "3\n100 50 0\n3\n0 1 30\n1 2 60\n2 0 10\n", expected: "balances=[80, 20, 50]\ntotal=150\npreserved=true\n" },
            { stdin: "2\n10 10\n2\n0 1 5\n1 0 5\n", expected: "balances=[10, 10]\ntotal=20\npreserved=true\n" },
            { stdin: "4\n1 2 3 4\n5\n3 0 4\n2 1 3\n1 3 1\n0 0 7\n3 2 2\n", expected: "balances=[5, 4, 2, -1]\ntotal=10\npreserved=true\n", hidden: true },
          ],
        },
        {
          title: "Rounds at the barrier",
          prompt: `Read \`k\` (parties), \`r\` (rounds) and \`k\` integer values. Create a \`CyclicBarrier(k, action)\` whose action prints \`round <j>: total=<running total>\` — it runs once per round, on the last thread to arrive. Each of the \`k\` threads, for rounds \`j = 1 … r\`, adds \`value × j\` to a shared \`AtomicLong\` and then \`await()\`s the barrier. Join all threads and print \`final=<total>\`. After round \`j\` the total is \`Σvalues × (1 + 2 + … + j)\` — the barrier makes that deterministic.

Example: \`2 3\` then \`1 2\` →
\`\`\`
round 1: total=3
round 2: total=9
round 3: total=18
final=18
\`\`\``,
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), r = in.nextInt();
        int[] values = new int[k];
        for (int i = 0; i < k; i++) values[i] = in.nextInt();
        AtomicLong total = new AtomicLong();
        AtomicInteger round = new AtomicInteger();
        CyclicBarrier barrier = new CyclicBarrier(k, () -> {
            // TODO: print round and total
        });
        // TODO: k threads, r rounds each
    }
}
`,
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt(), r = in.nextInt();
        int[] values = new int[k];
        for (int i = 0; i < k; i++) values[i] = in.nextInt();
        AtomicLong total = new AtomicLong();
        AtomicInteger round = new AtomicInteger();
        CyclicBarrier barrier = new CyclicBarrier(k, () -> {
            System.out.println("round " + round.incrementAndGet() + ": total=" + total.get());
        });
        Thread[] workers = new Thread[k];
        for (int i = 0; i < k; i++) {
            final int v = values[i];
            workers[i] = new Thread(() -> {
                try {
                    for (int j = 1; j <= r; j++) {
                        total.addAndGet((long) v * j);
                        barrier.await();
                    }
                } catch (InterruptedException | BrokenBarrierException e) {
                    Thread.currentThread().interrupt();
                }
            });
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        System.out.println("final=" + total.get());
    }
}
`,
          hints: [
            "Add before await: the barrier action then sees every party's contribution for the round.",
            "The action runs on whichever thread arrives last; a counter gives it the round number.",
            "await() throws two checked exceptions — catch both.",
          ],
          cases: [
            { stdin: "2 3\n1 2\n", expected: "round 1: total=3\nround 2: total=9\nround 3: total=18\nfinal=18\n" },
            { stdin: "1 2\n5\n", expected: "round 1: total=5\nround 2: total=15\nfinal=15\n" },
            { stdin: "3 2\n1 1 1\n", expected: "round 1: total=3\nround 2: total=9\nfinal=9\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`new Thread(r).run()` executes `r`…",
          options: ["On a new thread", "On the calling thread — no concurrency", "Twice", "Never"],
          answer: 1,
          explanation: "Only `start()` spawns a thread.",
        },
        {
          prompt: "Swallowing `InterruptedException` with an empty `catch`…",
          options: ["Is fine", "Loses the stop request; propagate it or call `Thread.currentThread().interrupt()`", "Stops the thread", "Is required"],
          answer: 1,
          explanation: "The flag is cleared when the exception is thrown; restore it for callers higher up.",
        },
        {
          prompt: "`synchronized` provides…",
          options: ["Atomicity only", "Mutual exclusion and visibility (release/acquire), reentrantly", "Visibility only", "Fairness"],
          answer: 1,
          explanation: "Both guarantees, on the monitor named; fairness needs `ReentrantLock(true)`.",
        },
        {
          prompt: "Two threads lock A then B and B then A respectively. The risk is…",
          options: ["Starvation", "Deadlock", "Livelock", "Nothing"],
          answer: 1,
          explanation: "Inconsistent lock ordering; fix by ordering, one lock, or `tryLock`.",
        },
        {
          prompt: "`volatile` guarantees…",
          options: ["Atomic compound updates", "Visibility and ordering of reads and writes to that field", "Mutual exclusion", "Faster access"],
          answer: 1,
          explanation: "A stop flag or a published immutable reference — not `count++`.",
        },
        {
          prompt: "Which action creates a happens-before edge that lets `main` read a worker's results?",
          options: ["`Thread.sleep(50)` in `main`", "`worker.join()`", "`System.out.println` in the worker", "Declaring the array `static`"],
          answer: 1,
          explanation: "Join, volatile, locks and `java.util.concurrent` hand-offs; nothing else.",
        },
        {
          prompt: "A production thread pool should have…",
          options: ["Unbounded threads", "A bounded queue and a bounded thread count with an explicit rejection policy", "One thread", "No queue"],
          answer: 1,
          explanation: "`ThreadPoolExecutor` with `ArrayBlockingQueue` and `CallerRunsPolicy`/`AbortPolicy`; the factories leave one side unbounded.",
        },
        {
          prompt: "A task submitted with `submit()` throws; nothing is printed because…",
          options: ["The pool swallows it", "The exception is stored in the `Future` until `get()` is called", "It was a daemon", "Exceptions are disabled in pools"],
          answer: 1,
          explanation: "Always collect futures, or use `execute()` for loud failures.",
        },
        {
          prompt: "`ReentrantLock.tryLock()`…",
          options: ["Blocks like `lock()`", "Returns `false` immediately if the lock is held — the tool for deadlock avoidance with back-off", "Throws when held", "Is deprecated"],
          answer: 1,
          explanation: "`tryLock(timeout, unit)` waits up to a deadline.",
        },
        {
          prompt: "`LongAdder` beats `AtomicLong` when…",
          options: ["You need the exact value after every update", "Many threads increment often and the value is read rarely", "The value is small", "Never"],
          answer: 1,
          explanation: "Per-thread cells avoid CAS contention; `sum()` combines them.",
        },
        {
          prompt: "`ConcurrentHashMap` versus `Collections.synchronizedMap(new HashMap<>())`:",
          options: ["Same thing", "Per-bin locking, lock-free reads, atomic `merge`/`compute*`, weakly consistent iteration versus one global lock with no atomic compound operations", "The synchronised map is faster", "`ConcurrentHashMap` allows null"],
          answer: 1,
          explanation: "And `ConcurrentHashMap` rejects `null` keys and values.",
        },
        {
          prompt: "Predict: `supplyAsync(() -> 1).thenApply(x -> x / 0).exceptionally(e -> -1).join()` returns…",
          options: ["`1`", "`-1`", "Throws `ArithmeticException`", "`0`"],
          answer: 1,
          explanation: "The failure skips to `exceptionally`, which recovers with −1.",
        },
        {
          prompt: "A `thenApply` stage runs on…",
          options: ["Always a new thread", "The thread that completed the previous stage (or the caller if already complete); `thenApplyAsync` re-dispatches", "The main thread", "The GC thread"],
          answer: 1,
          explanation: "Which matters when the previous stage completed on an event-loop or UI thread.",
        },
        {
          prompt: "The poison-pill pattern…",
          options: ["Kills the consumer thread", "Sends a sentinel value through the queue so the consumer exits its loop cleanly", "Uses `Thread.stop`", "Requires `notifyAll`"],
          answer: 1,
          explanation: "One pill per consumer when there are several.",
        },
        {
          prompt: "Blocking inside a parallel stream or `supplyAsync` without an executor is bad because…",
          options: ["It is slow", "It parks a common-pool thread, starving every other user of the pool", "It throws", "It deadlocks immediately"],
          answer: 1,
          explanation: "The common `ForkJoinPool` has about `cores − 1` threads shared JVM-wide; blocking I/O belongs on its own executor.",
        },
      ],
    },
  ],
});

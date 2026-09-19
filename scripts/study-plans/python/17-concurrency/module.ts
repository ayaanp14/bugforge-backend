import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "concurrency",
  title: "Concurrency — threads, processes and asyncio",
  blurb: "The GIL and the CPU-bound/I/O-bound decision; threads with Lock, Queue and Event and the race you must see once; concurrent.futures executors with ordered map; multiprocessing with pickling and the main guard; asyncio from coroutines and gather to TaskGroup, semaphores and queues; and the determinism rule for every concurrent program.",
  icon: "threads",
  overview: `Python's concurrency story starts with one fact — the global interpreter lock lets one thread run bytecode at a time — and everything else follows from it. Threads do not speed up computation but do overlap waiting; processes get real parallelism at the price of pickling and start-up; asyncio makes waiting explicit and single-threaded, so ten thousand connections cost almost nothing. Choosing among the three is the first skill; writing programs whose output does not depend on the scheduler is the second, and it is the one this module enforces in every exercise.

The GIL and the three models classifies work as CPU-bound or I/O-bound and gives the decision table. Threads covers \`Thread\`, \`join\`, the race in \`counter += 1\`, \`Lock\` and \`RLock\`, \`queue.Queue\` with sentinels, and \`Event\`, \`Semaphore\` and \`Barrier\`. concurrent.futures covers executors, futures, \`map\` in submission order versus \`as_completed\`, and process pools with a main guard. multiprocessing goes lower: \`Process\`, \`Pool\` with \`map\`/\`imap\`/\`starmap\` and \`chunksize\`, pickling, start methods, \`Queue\` and shared state in outline. asyncio basics covers coroutines, \`await\`, \`gather\`, tasks, \`sleep(0)\` and the FIFO loop, timeouts and the blocking mistake; asyncio patterns adds \`TaskGroup\`, semaphores, queues, async iteration and bridging to threads and processes.

The exercises are whole programs whose output is deterministic by construction: per-thread result slots read after \`join\`, a locked counter, queue workers merged in order, \`executor.map\` over words and primes, \`starmap\` and a process \`Queue\`, \`gather\` with a finish log, a semaphore-bounded fan-out and an async producer-consumer under a \`TaskGroup\`. The checkpoint adds a threaded word counter, a queue pipeline keyed by index, and an asyncio job runner with a reproducible trace.`,
  lessons: [
    {
      slug: "the-gil-and-the-models",
      file: "01-the-gil-and-the-models.md",
      exercises: [
        {
          title: "Classify the work",
          prompt: `Read lines \`<name> <cpu_ms> <io_ms> <tasks>\` until EOF. Let the I/O share be \`io_ms / (cpu_ms + io_ms)\`. A share of at least \`0.75\` is \`io-bound\` and recommends \`threads\` when \`tasks\` is at most 50, otherwise \`asyncio\`; a share of at most \`0.25\` is \`cpu-bound\` and recommends \`processes\`; anything else is \`mixed\` and recommends \`threads+processes\`. Print \`<name>: <class> -> <model>\` per line, then \`cpu-bound <a>, io-bound <b>, mixed <c>\`.

**Input:** one job per line.
**Output:** one line per job, then the summary.

\`\`\`text
parse 400 0 8
crawl 10 190 500
fetch 20 180 6
render 100 100 4
\`\`\`
prints
\`\`\`text
parse: cpu-bound -> processes
crawl: io-bound -> asyncio
fetch: io-bound -> threads
render: mixed -> threads+processes
cpu-bound 1, io-bound 2, mixed 1
\`\`\``,
          starter: String.raw`import sys


def classify(cpu_ms, io_ms, tasks):
    """Return (kind, model) for one job."""
    # TODO


counts = {"cpu-bound": 0, "io-bound": 0, "mixed": 0}
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 4:
        continue
    name, cpu_ms, io_ms, tasks = parts[0], int(parts[1]), int(parts[2]), int(parts[3])
    # TODO: classify, print, count

# TODO: summary line
`,
          solution: String.raw`import sys


def classify(cpu_ms, io_ms, tasks):
    """Return (kind, model) for one job."""
    share = io_ms / (cpu_ms + io_ms)
    if share >= 0.75:
        return "io-bound", ("threads" if tasks <= 50 else "asyncio")
    if share <= 0.25:
        return "cpu-bound", "processes"
    return "mixed", "threads+processes"


counts = {"cpu-bound": 0, "io-bound": 0, "mixed": 0}
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 4:
        continue
    name, cpu_ms, io_ms, tasks = parts[0], int(parts[1]), int(parts[2]), int(parts[3])
    kind, model = classify(cpu_ms, io_ms, tasks)
    counts[kind] += 1
    print(f"{name}: {kind} -> {model}")

print(f"cpu-bound {counts['cpu-bound']}, io-bound {counts['io-bound']}, mixed {counts['mixed']}")
`,
          hints: [
            "Compute the share once and compare it with the two thresholds in order: I/O-bound first, then CPU-bound, else mixed.",
            "A dict of counts keyed by the class name keeps the summary to one f-string.",
          ],
          cases: [
            { stdin: "parse 400 0 8\ncrawl 10 190 500\nfetch 20 180 6\nrender 100 100 4\n", expected: "parse: cpu-bound -> processes\ncrawl: io-bound -> asyncio\nfetch: io-bound -> threads\nrender: mixed -> threads+processes\ncpu-bound 1, io-bound 2, mixed 1\n" },
            { stdin: "hash 300 100 2\n", expected: "hash: cpu-bound -> processes\ncpu-bound 1, io-bound 0, mixed 0\n", hidden: true },
            { stdin: "sync 30 90 100\ndb 25 75 20\n", expected: "sync: io-bound -> asyncio\ndb: io-bound -> threads\ncpu-bound 0, io-bound 2, mixed 0\n", hidden: true },
          ],
        },
        {
          title: "Slots after join",
          prompt: `Read one line of integers. Start one thread per integer, named \`worker-<i>\`, whose target computes \`sum(k*k for k in range(1, n + 1))\` and stores \`(threading.current_thread().name, value)\` in \`results[i]\` — its own slot. Join every thread, then print \`<name> n=<n> -> <value>\` in slot order and \`total <sum of values>\`. Nothing may be printed from inside a worker.

**Input:** one line of integers.
**Output:** one line per slot, then the total.

\`\`\`text
3 5 10
\`\`\`
prints
\`\`\`text
worker-0 n=3 -> 14
worker-1 n=5 -> 55
worker-2 n=10 -> 385
total 454
\`\`\``,
          starter: String.raw`import threading

nums = [int(x) for x in input().split()]
results = [None] * len(nums)


def work(i, n):
    # TODO: compute and store (thread name, value) in results[i]
    pass


threads = []
# TODO: create named threads, start them, join them

for n, (name, value) in zip(nums, results):
    print(f"{name} n={n} -> {value}")
print("total", sum(value for _, value in results))
`,
          solution: String.raw`import threading

nums = [int(x) for x in input().split()]
results = [None] * len(nums)


def work(i, n):
    value = sum(k * k for k in range(1, n + 1))
    results[i] = (threading.current_thread().name, value)


threads = [threading.Thread(target=work, args=(i, n), name=f"worker-{i}") for i, n in enumerate(nums)]
for t in threads:
    t.start()
for t in threads:
    t.join()

for n, (name, value) in zip(nums, results):
    print(f"{name} n={n} -> {value}")
print("total", sum(value for _, value in results))
`,
          hints: [
            "`threading.Thread(target=work, args=(i, n), name=f\"worker-{i}\")` — the slot index travels with the thread as an argument.",
            "Start every thread before joining any; joining inside the creation loop would run them one at a time.",
          ],
          cases: [
            { stdin: "3 5 10\n", expected: "worker-0 n=3 -> 14\nworker-1 n=5 -> 55\nworker-2 n=10 -> 385\ntotal 454\n" },
            { stdin: "1\n", expected: "worker-0 n=1 -> 1\ntotal 1\n", hidden: true },
            { stdin: "100 0\n", expected: "worker-0 n=100 -> 338350\nworker-1 n=0 -> 0\ntotal 338350\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does the GIL guarantee?",
          options: ["That threads never run", "That only one thread executes Python bytecode at a time", "That every operation is atomic", "That processes share memory"],
          answer: 1,
          explanation: "It serialises bytecode execution; it is released during blocking I/O and by some C extensions, and it does not make compound operations atomic.",
        },
        {
          prompt: "A pure-Python loop takes 4 s. Split across 4 threads, roughly how long does it take?",
          options: ["1 s", "About 4 s, possibly more", "2 s", "0.5 s"],
          answer: 1,
          explanation: "CPU-bound bytecode runs one thread at a time; contention can make it slower. Processes are the tool for CPU-bound work.",
        },
        {
          prompt: "Which model suits ten thousand concurrent network connections?",
          options: ["A thread per connection", "A process per connection", "asyncio", "A single blocking loop"],
          answer: 2,
          explanation: "Coroutines cost almost nothing per wait; ten thousand threads or processes would exhaust memory and scheduling.",
        },
        {
          prompt: "Why is `x += 1` from two threads a race?",
          options: ["Because integers are immutable", "Because it is three bytecodes — load, add, store — and a switch can happen between them", "Because threads cannot see globals", "It is not; the GIL makes it atomic"],
          answer: 1,
          explanation: "Two threads can both load the same value, both add, and both store — losing one increment.",
        },
        {
          prompt: "What is the determinism rule for concurrent output?",
          options: ["Print from each worker as it finishes", "Sleep long enough for workers to finish", "Collect results into ordered slots, join everything, then print from the main thread", "Use a single worker"],
          answer: 2,
          explanation: "Scheduling order is arbitrary; output must depend only on the data.",
        },
      ],
    },
    {
      slug: "threads",
      file: "02-threads.md",
      exercises: [
        {
          title: "A counter with a lock",
          prompt: `Write \`SafeCounter\` with a \`value\` attribute, a \`threading.Lock\` and an \`increment()\` method that adds 1 under the lock. Read \`T N\`; start \`T\` threads that each call \`increment()\` \`N\` times; join them; print \`expected <T*N>\`, \`counter <value>\` and \`lost <expected - value>\` (which must be 0).

**Input:** \`T N\`.
**Output:** three lines.

\`\`\`text
4 10000
\`\`\`
prints
\`\`\`text
expected 40000
counter 40000
lost 0
\`\`\``,
          starter: String.raw`import threading


class SafeCounter:
    def __init__(self):
        self.value = 0
        self._lock = threading.Lock()

    def increment(self):
        # TODO: under the lock
        pass


def bump(counter, n):
    for _ in range(n):
        counter.increment()


t_count, n = map(int, input().split())
counter = SafeCounter()
# TODO: start T threads running bump, join them

expected = t_count * n
print("expected", expected)
print("counter", counter.value)
print("lost", expected - counter.value)
`,
          solution: String.raw`import threading


class SafeCounter:
    def __init__(self):
        self.value = 0
        self._lock = threading.Lock()

    def increment(self):
        with self._lock:
            self.value += 1


def bump(counter, n):
    for _ in range(n):
        counter.increment()


t_count, n = map(int, input().split())
counter = SafeCounter()
threads = [threading.Thread(target=bump, args=(counter, n)) for _ in range(t_count)]
for t in threads:
    t.start()
for t in threads:
    t.join()

expected = t_count * n
print("expected", expected)
print("counter", counter.value)
print("lost", expected - counter.value)
`,
          hints: [
            "`with self._lock:` around the `+=` makes the read-modify-write atomic with respect to the other threads.",
            "Try the same program without the lock and a large N to see updates lost — but the judged version must lock.",
          ],
          cases: [
            { stdin: "4 10000\n", expected: "expected 40000\ncounter 40000\nlost 0\n" },
            { stdin: "1 5\n", expected: "expected 5\ncounter 5\nlost 0\n", hidden: true },
            { stdin: "8 5000\n", expected: "expected 40000\ncounter 40000\nlost 0\n", hidden: true },
          ],
        },
        {
          title: "Producer and consumers",
          prompt: `Read \`K\` on the first line and integers on the second. A producer thread puts every integer on a \`queue.Queue\`, then \`K\` \`None\` sentinels. \`K\` consumer threads each loop on \`get()\` until they receive a sentinel, appending the square of each item to their own list \`slots[i]\` and calling \`task_done()\`. Join everything, merge the slots, sort, and print \`processed <count>\` and \`squares <space-separated sorted squares>\`.

**Input:** \`K\`, then the integers.
**Output:** two lines.

\`\`\`text
2
3 1 4 1 5
\`\`\`
prints
\`\`\`text
processed 5
squares 1 1 9 16 25
\`\`\``,
          starter: String.raw`import queue
import threading

k = int(input())
items = [int(x) for x in input().split()]
q = queue.Queue()
slots = [[] for _ in range(k)]


def producer():
    # TODO: put every item, then k sentinels
    pass


def consumer(i):
    # TODO: get until None, append item * item to slots[i], task_done
    pass


# TODO: start the producer and k consumers, join them all

merged = sorted(x for slot in slots for x in slot)
print("processed", len(merged))
print("squares", " ".join(map(str, merged)))
`,
          solution: String.raw`import queue
import threading

k = int(input())
items = [int(x) for x in input().split()]
q = queue.Queue()
slots = [[] for _ in range(k)]


def producer():
    for item in items:
        q.put(item)
    for _ in range(k):
        q.put(None)


def consumer(i):
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        slots[i].append(item * item)
        q.task_done()


threads = [threading.Thread(target=producer)] + [threading.Thread(target=consumer, args=(i,)) for i in range(k)]
for t in threads:
    t.start()
for t in threads:
    t.join()

merged = sorted(x for slot in slots for x in slot)
print("processed", len(merged))
print("squares", " ".join(map(str, merged)))
`,
          hints: [
            "One sentinel per consumer: each consumer takes exactly one `None` and stops, so all of them exit.",
            "Which consumer handles which item is up to the scheduler — merging and sorting removes that from the output.",
          ],
          cases: [
            { stdin: "2\n3 1 4 1 5\n", expected: "processed 5\nsquares 1 1 9 16 25\n" },
            { stdin: "3\n7\n", expected: "processed 1\nsquares 49\n", hidden: true },
            { stdin: "1\n2 -3 0\n", expected: "processed 3\nsquares 0 4 9\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `t.join()` do?",
          options: ["Starts the thread", "Blocks the caller until the thread finishes", "Kills the thread", "Merges two threads"],
          answer: 1,
          explanation: "Join before reading anything a thread produced.",
        },
        {
          prompt: "What happens to a daemon thread when the main thread exits?",
          options: ["It keeps running", "It is killed abruptly", "It is joined first", "It raises"],
          answer: 1,
          explanation: "Daemon threads are for background work that may be abandoned — never for anything that writes.",
        },
        {
          prompt: "Two threads each need locks A and B. How is deadlock avoided?",
          options: ["Use more locks", "Always acquire them in the same order", "Use daemon threads", "Sleep between acquisitions"],
          answer: 1,
          explanation: "With a fixed order, no thread can hold B while waiting for A held by a thread waiting for B.",
        },
        {
          prompt: "Why is `queue.Queue` preferred over a shared list with a lock?",
          options: ["It is faster", "It is thread-safe by construction, blocks on `get`, and turns shared state into messages between owners", "It is unbounded", "It preserves insertion order"],
          answer: 1,
          explanation: "Each thread owns its data and communicates by passing values — the design that scales.",
        },
        {
          prompt: "Which is a correct way to tell polling threads to stop?",
          options: ["`time.sleep(1)`", "Set a `threading.Event` they check and wait on", "Delete the thread objects", "Raise in the main thread"],
          answer: 1,
          explanation: "`stop.set()` wakes `stop.wait()` early; sleeping is not synchronisation.",
        },
      ],
    },
    {
      slug: "concurrent-futures",
      file: "03-concurrent-futures.md",
      exercises: [
        {
          title: "Ordered map over words",
          prompt: `Read one line of words. With a \`ThreadPoolExecutor(max_workers=3)\`, use \`map\` to compute for each word a tuple \`(word, len(word), vowels)\` where \`vowels\` counts the letters in \`aeiou\`. Print \`<word> len=<n> vowels=<v>\` in input order — \`map\` preserves it — then \`most vowels <word>\` (ties go to the earlier word).

**Input:** one line of words.
**Output:** one line per word, then the winner.

\`\`\`text
queue thread future
\`\`\`
prints
\`\`\`text
queue len=5 vowels=4
thread len=6 vowels=2
future len=6 vowels=3
most vowels queue
\`\`\``,
          starter: String.raw`from concurrent.futures import ThreadPoolExecutor

words = input().split()


def describe(word):
    # TODO: return (word, len(word), vowel count)
    pass


with ThreadPoolExecutor(max_workers=3) as pool:
    rows = []  # TODO: list(pool.map(...))

for word, length, vowels in rows:
    print(f"{word} len={length} vowels={vowels}")
# TODO: most vowels
`,
          solution: String.raw`from concurrent.futures import ThreadPoolExecutor

words = input().split()


def describe(word):
    return word, len(word), sum(ch in "aeiou" for ch in word)


with ThreadPoolExecutor(max_workers=3) as pool:
    rows = list(pool.map(describe, words))

for word, length, vowels in rows:
    print(f"{word} len={length} vowels={vowels}")
best = max(rows, key=lambda row: row[2])
print("most vowels", best[0])
`,
          hints: [
            "`pool.map(describe, words)` yields results in the order of `words` regardless of which thread finished first.",
            "`max` with a key returns the first maximal element, which is the tie rule you need.",
          ],
          cases: [
            { stdin: "queue thread future\n", expected: "queue len=5 vowels=4\nthread len=6 vowels=2\nfuture len=6 vowels=3\nmost vowels queue\n" },
            { stdin: "gil\n", expected: "gil len=3 vowels=1\nmost vowels gil\n", hidden: true },
            { stdin: "async await loop\n", expected: "async len=5 vowels=1\nawait len=5 vowels=3\nloop len=4 vowels=2\nmost vowels await\n", hidden: true },
          ],
        },
        {
          title: "Primes in a process pool",
          prompt: `Write a module-level \`prime_sum(n)\` that returns the sum of the primes below \`n\` using a sieve. Read one line of integers; under \`if __name__ == "__main__":\` run them through a \`ProcessPoolExecutor(max_workers=2)\` with \`map\` and print \`primes below <n> sum to <s>\` in input order.

**Input:** one line of integers.
**Output:** one line per integer.

\`\`\`text
10 20 100
\`\`\`
prints
\`\`\`text
primes below 10 sum to 17
primes below 20 sum to 77
primes below 100 sum to 1060
\`\`\``,
          starter: String.raw`from concurrent.futures import ProcessPoolExecutor


def prime_sum(n):
    # TODO: sieve of Eratosthenes, sum of primes below n
    pass


if __name__ == "__main__":
    nums = [int(x) for x in input().split()]
    # TODO: pool.map, print in order
`,
          solution: String.raw`from concurrent.futures import ProcessPoolExecutor


def prime_sum(n):
    if n < 3:
        return 0
    sieve = [True] * n
    sieve[0] = sieve[1] = False
    for p in range(2, int(n ** 0.5) + 1):
        if sieve[p]:
            for multiple in range(p * p, n, p):
                sieve[multiple] = False
    return sum(i for i, is_prime in enumerate(sieve) if is_prime)


if __name__ == "__main__":
    nums = [int(x) for x in input().split()]
    with ProcessPoolExecutor(max_workers=2) as pool:
        for n, total in zip(nums, pool.map(prime_sum, nums)):
            print(f"primes below {n} sum to {total}")
`,
          hints: [
            "The worker must be a module-level function so the worker process can import it by name.",
            "Read the input inside the main guard: a spawned worker re-imports the module and must not try to read stdin.",
          ],
          cases: [
            { stdin: "10 20 100\n", expected: "primes below 10 sum to 17\nprimes below 20 sum to 77\nprimes below 100 sum to 1060\n" },
            { stdin: "2\n", expected: "primes below 2 sum to 0\n", hidden: true },
            { stdin: "1000 30\n", expected: "primes below 1000 sum to 76127\nprimes below 30 sum to 129\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `executor.map(fn, items)` return?",
          options: ["Results in completion order", "Results in the order of `items`, blocking on each in turn", "A list of futures", "Nothing until `shutdown`"],
          answer: 1,
          explanation: "That ordering is what makes `map` the deterministic tool.",
        },
        {
          prompt: "What does `future.result()` do if the job raised?",
          options: ["Returns `None`", "Re-raises the exception in the caller", "Returns the exception", "Cancels the pool"],
          answer: 1,
          explanation: "`exception()` returns it instead; the pool itself is unaffected by a failing job.",
        },
        {
          prompt: "What does `as_completed(futures)` yield?",
          options: ["Futures in submission order", "Futures as they finish — arbitrary order", "Results in submission order", "Only successful futures"],
          answer: 1,
          explanation: "Sort before printing anything derived from it as an answer.",
        },
        {
          prompt: "Why must a `ProcessPoolExecutor` worker be a module-level function?",
          options: ["For speed", "Because it is pickled by name and imported in the worker process", "Because lambdas are slow", "It need not be"],
          answer: 1,
          explanation: "Lambdas and nested functions cannot be pickled by reference.",
        },
        {
          prompt: "Can `future.cancel()` stop a job that is already running?",
          options: ["Yes, immediately", "No — only a job that has not started; a running job must check a flag itself", "Yes, after its next I/O", "Only in a process pool"],
          answer: 1,
          explanation: "Futures cannot interrupt a running callable.",
        },
      ],
    },
    {
      slug: "multiprocessing",
      file: "04-multiprocessing.md",
      exercises: [
        {
          title: "starmap and the unordered check",
          prompt: `Read lines \`base exp mod\` until EOF. Write a module-level \`pow_mod(base, exp, mod)\` returning \`pow(base, exp, mod)\` and a module-level \`indexed(job)\` that takes \`(i, base, exp, mod)\` and returns \`(i, pow_mod(base, exp, mod))\`. Under the main guard, open \`Pool(2)\`, compute the results with \`starmap\` and print \`<base>^<exp> mod <mod> = <r>\` per job in input order; then run the indexed jobs through \`imap_unordered\`, sort the pairs by index, and print \`unordered matches <True/False>\` comparing them with the ordered results.

**Input:** one job per line.
**Output:** one line per job, then the comparison.

\`\`\`text
2 10 1000
3 4 5
7 0 13
\`\`\`
prints
\`\`\`text
2^10 mod 1000 = 24
3^4 mod 5 = 1
7^0 mod 13 = 1
unordered matches True
\`\`\``,
          starter: String.raw`import sys
from multiprocessing import Pool


def pow_mod(base, exp, mod):
    return pow(base, exp, mod)


def indexed(job):
    # TODO: (i, base, exp, mod) -> (i, result)
    pass


if __name__ == "__main__":
    jobs = [tuple(int(x) for x in line.split()) for line in sys.stdin if line.strip()]
    with Pool(2) as pool:
        ordered = []  # TODO: pool.starmap
        unordered = []  # TODO: pool.imap_unordered over indexed jobs, then sort
    # TODO: print
`,
          solution: String.raw`import sys
from multiprocessing import Pool


def pow_mod(base, exp, mod):
    return pow(base, exp, mod)


def indexed(job):
    i, base, exp, mod = job
    return i, pow_mod(base, exp, mod)


if __name__ == "__main__":
    jobs = [tuple(int(x) for x in line.split()) for line in sys.stdin if line.strip()]
    with Pool(2) as pool:
        ordered = pool.starmap(pow_mod, jobs)
        unordered = sorted(pool.imap_unordered(indexed, [(i, *job) for i, job in enumerate(jobs)]))
    for (base, exp, mod), result in zip(jobs, ordered):
        print(f"{base}^{exp} mod {mod} = {result}")
    print("unordered matches", [r for _, r in unordered] == ordered)
`,
          hints: [
            "`starmap` unpacks each tuple into positional arguments; `imap_unordered` takes one argument per job, so the index rides inside the tuple.",
            "Sorting `(index, result)` pairs restores the input order whatever order the workers finished in.",
          ],
          cases: [
            { stdin: "2 10 1000\n3 4 5\n7 0 13\n", expected: "2^10 mod 1000 = 24\n3^4 mod 5 = 1\n7^0 mod 13 = 1\nunordered matches True\n" },
            { stdin: "10 9 7\n", expected: "10^9 mod 7 = 6\nunordered matches True\n", hidden: true },
            { stdin: "5 3 2\n12 2 144\n", expected: "5^3 mod 2 = 1\n12^2 mod 144 = 0\nunordered matches True\n", hidden: true },
          ],
        },
        {
          title: "Two processes and a queue",
          prompt: `Read one line of integers and split it into two parts: the first \`(n + 1) // 2\` numbers and the rest. Start one \`multiprocessing.Process\` per part running a module-level \`part_sum(index, chunk, q)\` that puts \`(index, sum(chunk))\` on a \`multiprocessing.Queue\`. In the parent, collect both results from the queue, join the processes, sort by index, and print \`part <i> sum <s>\` for each and \`total <sum>\`.

**Input:** one line of integers.
**Output:** three lines.

\`\`\`text
1 2 3 4 5
\`\`\`
prints
\`\`\`text
part 0 sum 6
part 1 sum 9
total 15
\`\`\``,
          starter: String.raw`from multiprocessing import Process, Queue


def part_sum(index, chunk, q):
    # TODO: put (index, sum(chunk))
    pass


if __name__ == "__main__":
    nums = [int(x) for x in input().split()]
    half = (len(nums) + 1) // 2
    parts = [nums[:half], nums[half:]]
    q = Queue()
    # TODO: start a process per part, collect two results, join, print sorted
`,
          solution: String.raw`from multiprocessing import Process, Queue


def part_sum(index, chunk, q):
    q.put((index, sum(chunk)))


if __name__ == "__main__":
    nums = [int(x) for x in input().split()]
    half = (len(nums) + 1) // 2
    parts = [nums[:half], nums[half:]]
    q = Queue()
    procs = [Process(target=part_sum, args=(i, chunk, q)) for i, chunk in enumerate(parts)]
    for p in procs:
        p.start()
    results = sorted(q.get() for _ in procs)
    for p in procs:
        p.join()
    for index, total in results:
        print(f"part {index} sum {total}")
    print("total", sum(total for _, total in results))
`,
          hints: [
            "Drain the queue before joining: a child blocks on exit until its queued data has been consumed.",
            "The index in each tuple is what makes the printed order independent of which process finished first.",
          ],
          cases: [
            { stdin: "1 2 3 4 5\n", expected: "part 0 sum 6\npart 1 sum 9\ntotal 15\n" },
            { stdin: "10\n", expected: "part 0 sum 10\npart 1 sum 0\ntotal 10\n", hidden: true },
            { stdin: "-1 -2 3 4\n", expected: "part 0 sum -3\npart 1 sum 7\ntotal 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A global list is appended to inside a `Process` target. What does the parent see afterwards?",
          options: ["The appended item", "Its own unchanged list — the child modified a copy in its own memory", "An error", "A proxy"],
          answer: 1,
          explanation: "Processes share nothing; results travel back through a queue, a pipe or a pool's return value.",
        },
        {
          prompt: "Why does `pool.map(f, range(10**6))` benefit from `chunksize`?",
          options: ["It does not", "Each task costs a pickle round trip, so batching thousands per task amortises the overhead", "It uses less memory", "It preserves order"],
          answer: 1,
          explanation: "A million tiny tasks without chunking can be slower than a plain loop.",
        },
        {
          prompt: "Which of these can be sent to a pool worker?",
          options: ["A lambda", "An open file", "A module-level function and a list of ints", "A `threading.Lock`"],
          answer: 2,
          explanation: "Everything crossing the boundary is pickled; lambdas, files and locks are not picklable.",
        },
        {
          prompt: "Under the `spawn` start method, what does a worker do first?",
          options: ["Forks the parent", "Imports the main module to find the target function", "Reads stdin", "Shares the parent's memory"],
          answer: 1,
          explanation: "That import re-executes top-level code — hence the `if __name__ == \"__main__\":` guard around process creation.",
        },
        {
          prompt: "Which is the recommended design for shared state between processes?",
          options: ["`Manager().dict()` everywhere", "`Value` with a lock", "No shared state: workers return results and the parent aggregates", "Global variables"],
          answer: 2,
          explanation: "Shared memory and managers exist as last resorts; returning results scales and stays testable.",
        },
      ],
    },
    {
      slug: "asyncio-basics",
      file: "05-asyncio-basics.md",
      exercises: [
        {
          title: "gather with a finish log",
          prompt: `Read lines \`<name> <steps>\` until EOF. Write \`async def job(name, steps, log)\` that awaits \`asyncio.sleep(0)\` \`steps\` times, appends \`name\` to \`log\`, and returns \`f"{name}={steps * 10}"\`. In \`main\`, run every job with \`asyncio.gather\`, print the results joined by \`", "\` (they come back in argument order), then \`finished <log joined by spaces>\` — the completion order, which the FIFO loop makes reproducible.

**Input:** one job per line.
**Output:** two lines.

\`\`\`text
a 3
b 1
c 2
\`\`\`
prints
\`\`\`text
a=30, b=10, c=20
finished b c a
\`\`\``,
          starter: String.raw`import asyncio
import sys


async def job(name, steps, log):
    # TODO
    pass


async def main(jobs):
    log = []
    # TODO: gather, print results, print finished order
    pass


jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
asyncio.run(main(jobs))
`,
          solution: String.raw`import asyncio
import sys


async def job(name, steps, log):
    for _ in range(steps):
        await asyncio.sleep(0)
    log.append(name)
    return f"{name}={steps * 10}"


async def main(jobs):
    log = []
    results = await asyncio.gather(*(job(name, steps, log) for name, steps in jobs))
    print(", ".join(results))
    print("finished", " ".join(log))


jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
asyncio.run(main(jobs))
`,
          hints: [
            "`gather(*coroutines)` schedules them in argument order and returns a list in that same order.",
            "Each `sleep(0)` yields once; a job with fewer steps finishes earlier, and ties resolve in creation order.",
          ],
          cases: [
            { stdin: "a 3\nb 1\nc 2\n", expected: "a=30, b=10, c=20\nfinished b c a\n" },
            { stdin: "x 0\ny 0\n", expected: "x=0, y=0\nfinished x y\n", hidden: true },
            { stdin: "p 2\nq 2\nr 1\n", expected: "p=20, q=20, r=10\nfinished r p q\n", hidden: true },
          ],
        },
        {
          title: "Sequential versus concurrent",
          prompt: `Read lines \`<name> <delay_ms>\` until EOF. Write \`async def fetch(name, ms)\` that awaits \`asyncio.sleep(ms / 1000)\` and returns \`f"{name} ready"\`. Run all fetches concurrently with \`gather\` and print each result on its own line in input order; then print \`sequential <sum of delays> ms\` and \`concurrent <largest delay> ms\` — the two wall-clock totals the two strategies would take.

**Input:** one fetch per line.
**Output:** the results, then two summary lines.

\`\`\`text
db 30
api 10
cache 5
\`\`\`
prints
\`\`\`text
db ready
api ready
cache ready
sequential 45 ms
concurrent 30 ms
\`\`\``,
          starter: String.raw`import asyncio
import sys


async def fetch(name, ms):
    # TODO
    pass


async def main(jobs):
    # TODO: gather, print each result, then the two totals
    pass


jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
asyncio.run(main(jobs))
`,
          solution: String.raw`import asyncio
import sys


async def fetch(name, ms):
    await asyncio.sleep(ms / 1000)
    return f"{name} ready"


async def main(jobs):
    results = await asyncio.gather(*(fetch(name, ms) for name, ms in jobs))
    for line in results:
        print(line)
    delays = [ms for _, ms in jobs]
    print(f"sequential {sum(delays)} ms")
    print(f"concurrent {max(delays)} ms")


jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
asyncio.run(main(jobs))
`,
          hints: [
            "Awaiting the fetches one by one would take the sum; `gather` starts them all and takes the maximum.",
            "The totals are computed from the delays, not measured — output must not depend on a clock.",
          ],
          cases: [
            { stdin: "db 30\napi 10\ncache 5\n", expected: "db ready\napi ready\ncache ready\nsequential 45 ms\nconcurrent 30 ms\n" },
            { stdin: "one 0\n", expected: "one ready\nsequential 0 ms\nconcurrent 0 ms\n", hidden: true },
            { stdin: "a 20\nb 20\n", expected: "a ready\nb ready\nsequential 40 ms\nconcurrent 20 ms\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does calling `fetch()` return when `fetch` is `async def`?",
          options: ["Its result", "A coroutine object that has not run", "A thread", "`None`"],
          answer: 1,
          explanation: "Nothing runs until it is awaited or wrapped in a task; Python warns if it never is.",
        },
        {
          prompt: "What does `await asyncio.gather(a(), b())` return?",
          options: ["A set of results", "A list of results in argument order", "The first result", "Results in completion order"],
          answer: 1,
          explanation: "Argument order, whatever finished first — the deterministic fan-out tool.",
        },
        {
          prompt: "What does `time.sleep(1)` inside a coroutine do?",
          options: ["Yields to the loop for a second", "Freezes the whole event loop for a second", "Raises", "Runs in a thread"],
          answer: 1,
          explanation: "Only `await`able waits yield; use `await asyncio.sleep(1)` or `to_thread` for blocking calls.",
        },
        {
          prompt: "When does a task created with `create_task` start running?",
          options: ["Immediately, in parallel", "At the next `await` in the current coroutine", "When `result()` is called", "When the loop closes"],
          answer: 1,
          explanation: "One thread: the new task runs when the current one yields control.",
        },
        {
          prompt: "What does `asyncio.sleep(0)` do?",
          options: ["Nothing", "Yields to the loop exactly once", "Sleeps for one tick of the clock", "Cancels the task"],
          answer: 1,
          explanation: "It is the way to let other ready tasks run — and, with FIFO scheduling, to write reproducible traces.",
        },
      ],
    },
    {
      slug: "asyncio-patterns",
      file: "06-asyncio-patterns.md",
      exercises: [
        {
          title: "Bounded fan-out",
          prompt: `Read \`limit\` on the first line and job ids on the second. Create \`asyncio.Semaphore(limit)\` and a coroutine \`run(job_id)\` that, inside \`async with sem:\`, increments a shared \`in_flight\` counter, records the peak, awaits \`asyncio.sleep(0)\` twice, decrements the counter and returns \`job_id * job_id\`. Gather every job and print \`results <space-separated squares in input order>\` and \`peak <highest in_flight seen>\`.

**Input:** \`limit\`, then the ids.
**Output:** two lines.

\`\`\`text
2
1 2 3 4 5
\`\`\`
prints
\`\`\`text
results 1 4 9 16 25
peak 2
\`\`\``,
          starter: String.raw`import asyncio

limit = int(input())
ids = [int(x) for x in input().split()]
state = {"in_flight": 0, "peak": 0}


async def main():
    sem = asyncio.Semaphore(limit)

    async def run(job_id):
        # TODO: async with sem, track in_flight and peak, sleep(0) twice
        pass

    # TODO: gather and print


asyncio.run(main())
`,
          solution: String.raw`import asyncio

limit = int(input())
ids = [int(x) for x in input().split()]
state = {"in_flight": 0, "peak": 0}


async def main():
    sem = asyncio.Semaphore(limit)

    async def run(job_id):
        async with sem:
            state["in_flight"] += 1
            state["peak"] = max(state["peak"], state["in_flight"])
            await asyncio.sleep(0)
            await asyncio.sleep(0)
            state["in_flight"] -= 1
            return job_id * job_id

    results = await asyncio.gather(*(run(job_id) for job_id in ids))
    print("results", " ".join(map(str, results)))
    print("peak", state["peak"])


asyncio.run(main())
`,
          hints: [
            "Without the `sleep(0)` awaits the jobs would run one after another and the peak would always be 1.",
            "The peak is `min(limit, len(ids))`: the semaphore admits that many before the first one releases.",
          ],
          cases: [
            { stdin: "2\n1 2 3 4 5\n", expected: "results 1 4 9 16 25\npeak 2\n" },
            { stdin: "10\n3 4\n", expected: "results 9 16\npeak 2\n", hidden: true },
            { stdin: "1\n5 6 7\n", expected: "results 25 36 49\npeak 1\n", hidden: true },
          ],
        },
        {
          title: "Async producer and consumers",
          prompt: `Read \`C\` on the first line and words on the second. With an \`asyncio.Queue(maxsize=2)\`, a producer puts every word then \`C\` \`None\` sentinels; consumer \`i\` takes items until a sentinel and appends \`word.upper()\` to its own list \`slots[i]\`. Run the producer and the consumers under an \`asyncio.TaskGroup\`, then merge the slots, sort, and print \`consumers <C>\`, \`processed <n>\` and \`sorted <space-separated words>\`.

**Input:** \`C\`, then the words.
**Output:** three lines.

\`\`\`text
2
gil loop task
\`\`\`
prints
\`\`\`text
consumers 2
processed 3
sorted GIL LOOP TASK
\`\`\``,
          starter: String.raw`import asyncio

c = int(input())
words = input().split()
slots = [[] for _ in range(c)]


async def producer(q):
    # TODO: put every word, then c sentinels
    pass


async def consumer(q, i):
    # TODO: get until None, append word.upper() to slots[i]
    pass


async def main():
    q = asyncio.Queue(maxsize=2)
    # TODO: TaskGroup with the producer and c consumers


asyncio.run(main())
merged = sorted(w for slot in slots for w in slot)
print("consumers", c)
print("processed", len(merged))
print("sorted", " ".join(merged))
`,
          solution: String.raw`import asyncio

c = int(input())
words = input().split()
slots = [[] for _ in range(c)]


async def producer(q):
    for word in words:
        await q.put(word)
    for _ in range(c):
        await q.put(None)


async def consumer(q, i):
    while True:
        word = await q.get()
        if word is None:
            break
        slots[i].append(word.upper())


async def main():
    q = asyncio.Queue(maxsize=2)
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(q))
        for i in range(c):
            tg.create_task(consumer(q, i))


asyncio.run(main())
merged = sorted(w for slot in slots for w in slot)
print("consumers", c)
print("processed", len(merged))
print("sorted", " ".join(merged))
`,
          hints: [
            "`await q.put` blocks while the queue is full — with `maxsize=2` the producer and consumers interleave.",
            "The `async with TaskGroup()` block waits for every task it created before the line after it runs.",
          ],
          cases: [
            { stdin: "2\ngil loop task\n", expected: "consumers 2\nprocessed 3\nsorted GIL LOOP TASK\n" },
            { stdin: "1\nx\n", expected: "consumers 1\nprocessed 1\nsorted X\n", hidden: true },
            { stdin: "3\nb a c a\n", expected: "consumers 3\nprocessed 4\nsorted A A B C\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens in a `TaskGroup` when one task raises?",
          options: ["The others continue and the error is lost", "The others are cancelled and the errors are raised together as an `ExceptionGroup`", "The loop stops", "Only that task is retried"],
          answer: 1,
          explanation: "Structured concurrency: nothing outlives the block and nothing is lost; use `gather(return_exceptions=True)` when tasks are independent.",
        },
        {
          prompt: "What is `asyncio.Semaphore(5)` for?",
          options: ["Five event loops", "At most five coroutines inside its `async with` block at once", "Five threads", "A five-second timeout"],
          answer: 1,
          explanation: "The standard limiter for fan-out against a rate-limited service.",
        },
        {
          prompt: "Why does `for x in async_gen():` fail?",
          options: ["Async generators are empty", "An async generator needs `async for`, because fetching each item may await", "It works", "Generators cannot be async"],
          answer: 1,
          explanation: "`__anext__` is a coroutine; `async for` awaits it.",
        },
        {
          prompt: "How do you call a blocking function from a coroutine without freezing the loop?",
          options: ["Just call it", "`await asyncio.to_thread(fn, *args)`", "`time.sleep` first", "Wrap it in `async def`"],
          answer: 1,
          explanation: "It runs on a worker thread and the loop keeps serving other coroutines; `run_in_executor` accepts a process pool for CPU work.",
        },
        {
          prompt: "Which workload is the strongest case for asyncio over threads?",
          options: ["Three blocking database calls", "Thousands of concurrent connections with async-native libraries", "A CPU-bound image filter", "Reading one file"],
          answer: 1,
          explanation: "Few blocking calls are simpler with a thread pool; CPU work wants processes.",
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
          title: "Threaded word counter",
          prompt: `Read \`T\` on the first line, then text lines until EOF. Thread \`i\` handles \`lines[i::T]\`: it lowercases each line, splits on whitespace, strips \`.,;:!?\` from each word, and counts the words into its own \`collections.Counter\` in \`slots[i]\`. Join the threads, merge the counters, and print \`total <number of words>\` followed by the top three words as \`<word> <count>\` ordered by count descending then word ascending (fewer if there are fewer distinct words).

**Input:** \`T\`, then lines of text.
**Output:** the total, then up to three lines.

\`\`\`text
2
the cat sat on the mat
the dog sat
a cat
\`\`\`
prints
\`\`\`text
total 11
the 3
cat 2
sat 2
\`\`\``,
          starter: String.raw`import sys
import threading
from collections import Counter

PUNCT = ".,;:!?"

t_count = int(sys.stdin.readline())
lines = [line.rstrip() for line in sys.stdin]
slots = [Counter() for _ in range(t_count)]


def count_lines(i):
    # TODO: count words of lines[i::t_count] into slots[i]
    pass


# TODO: start and join the threads

merged = Counter()
for slot in slots:
    merged.update(slot)
# TODO: total and top three
`,
          solution: String.raw`import sys
import threading
from collections import Counter

PUNCT = ".,;:!?"

t_count = int(sys.stdin.readline())
lines = [line.rstrip() for line in sys.stdin]
slots = [Counter() for _ in range(t_count)]


def count_lines(i):
    for line in lines[i::t_count]:
        for word in line.lower().split():
            word = word.strip(PUNCT)
            if word:
                slots[i][word] += 1


threads = [threading.Thread(target=count_lines, args=(i,)) for i in range(t_count)]
for t in threads:
    t.start()
for t in threads:
    t.join()

merged = Counter()
for slot in slots:
    merged.update(slot)
print("total", sum(merged.values()))
for word, count in sorted(merged.items(), key=lambda item: (-item[1], item[0]))[:3]:
    print(word, count)
`,
          hints: [
            "Each thread writes only to its own Counter, so no lock is needed; the merge happens after the joins.",
            "`sorted(items, key=lambda item: (-count, word))` orders by count descending and breaks ties alphabetically.",
          ],
          cases: [
            { stdin: "2\nthe cat sat on the mat\nthe dog sat\na cat\n", expected: "total 11\nthe 3\ncat 2\nsat 2\n" },
            { stdin: "1\nHello, hello! HELLO\n", expected: "total 3\nhello 3\n", hidden: true },
            { stdin: "3\nx y\ny z\nz x\nw\n", expected: "total 7\nx 2\ny 2\nz 2\n", hidden: true },
          ],
        },
        {
          title: "Queue pipeline by index",
          prompt: `Read \`W\` on the first line, then text lines until EOF. Put \`(index, line)\` jobs on a \`queue.Queue\` followed by \`W\` sentinels. Each of \`W\` worker threads takes jobs and, for each, computes \`"<index>: <words> words, <chars> chars, longest <word>"\` where \`words\` is the whitespace word count, \`chars\` is \`len(line)\` and \`longest\` is the first longest word; it appends \`(index, text)\` to a shared results list under a \`Lock\`. Join the workers, sort the results by index, and print each text.

**Input:** \`W\`, then lines.
**Output:** one line per input line, in input order.

\`\`\`text
2
the quick brown fox
jumps over
the lazy dog
\`\`\`
prints
\`\`\`text
0: 4 words, 19 chars, longest quick
1: 2 words, 10 chars, longest jumps
2: 3 words, 12 chars, longest lazy
\`\`\``,
          starter: String.raw`import queue
import sys
import threading

w_count = int(sys.stdin.readline())
lines = [line.rstrip() for line in sys.stdin if line.strip()]
q = queue.Queue()
results = []
lock = threading.Lock()


def describe(index, line):
    # TODO: the text for one line
    pass


def worker():
    # TODO: take jobs until a sentinel; append (index, text) under the lock
    pass


# TODO: enqueue jobs and sentinels, start and join workers, print sorted
`,
          solution: String.raw`import queue
import sys
import threading

w_count = int(sys.stdin.readline())
lines = [line.rstrip() for line in sys.stdin if line.strip()]
q = queue.Queue()
results = []
lock = threading.Lock()


def describe(index, line):
    words = line.split()
    longest = max(words, key=len)
    return f"{index}: {len(words)} words, {len(line)} chars, longest {longest}"


def worker():
    while True:
        job = q.get()
        if job is None:
            break
        index, line = job
        text = describe(index, line)
        with lock:
            results.append((index, text))


for index, line in enumerate(lines):
    q.put((index, line))
for _ in range(w_count):
    q.put(None)

threads = [threading.Thread(target=worker) for _ in range(w_count)]
for t in threads:
    t.start()
for t in threads:
    t.join()

for _, text in sorted(results):
    print(text)
`,
          hints: [
            "`max(words, key=len)` returns the first of the longest words, which is the tie rule required.",
            "The lock protects `results.append`; the index attached to each result is what restores the order.",
          ],
          cases: [
            { stdin: "2\nthe quick brown fox\njumps over\nthe lazy dog\n", expected: "0: 4 words, 19 chars, longest quick\n1: 2 words, 10 chars, longest jumps\n2: 3 words, 12 chars, longest lazy\n" },
            { stdin: "1\na\n", expected: "0: 1 words, 1 chars, longest a\n", hidden: true },
            { stdin: "3\nhello world\nhi\n", expected: "0: 2 words, 11 chars, longest hello\n1: 1 words, 2 chars, longest hi\n", hidden: true },
          ],
        },
        {
          title: "Async job runner with a trace",
          prompt: `Read \`limit\` on the first line, then lines \`<name> <steps>\` until EOF. Write \`async def run(name, steps)\` that, inside \`async with sem:\` for a \`Semaphore(limit)\`, appends \`start <name>\` to a shared trace list, awaits \`asyncio.sleep(0)\` \`steps\` times, appends \`done <name>\`, and returns \`(name, sum(range(1, steps + 1)))\`. Gather every job in input order; print each trace line, then \`<name> -> <value>\` for each result in gather order.

**Input:** \`limit\`, then one job per line.
**Output:** the trace, then the results.

\`\`\`text
2
a 2
b 1
c 1
\`\`\`
prints
\`\`\`text
start a
start b
done b
done a
start c
done c
a -> 3
b -> 1
c -> 1
\`\`\``,
          starter: String.raw`import asyncio
import sys

limit = int(sys.stdin.readline())
jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
trace = []


async def main():
    sem = asyncio.Semaphore(limit)

    async def run(name, steps):
        # TODO
        pass

    # TODO: gather, then print the trace and the results


asyncio.run(main())
`,
          solution: String.raw`import asyncio
import sys

limit = int(sys.stdin.readline())
jobs = [(parts[0], int(parts[1])) for parts in (line.split() for line in sys.stdin) if parts]
trace = []


async def main():
    sem = asyncio.Semaphore(limit)

    async def run(name, steps):
        async with sem:
            trace.append(f"start {name}")
            for _ in range(steps):
                await asyncio.sleep(0)
            trace.append(f"done {name}")
            return name, sum(range(1, steps + 1))

    results = await asyncio.gather(*(run(name, steps) for name, steps in jobs))
    for line in trace:
        print(line)
    for name, value in results:
        print(f"{name} -> {value}")


asyncio.run(main())
`,
          hints: [
            "The semaphore admits `limit` jobs; the next one starts only when one of them releases, which is why `c` starts after `b` is done.",
            "Everything is printed after `gather` returns — the trace list is the record, not the console.",
          ],
          cases: [
            { stdin: "2\na 2\nb 1\nc 1\n", expected: "start a\nstart b\ndone b\ndone a\nstart c\ndone c\na -> 3\nb -> 1\nc -> 1\n" },
            { stdin: "1\nx 1\ny 1\n", expected: "start x\ndone x\nstart y\ndone y\nx -> 1\ny -> 1\n", hidden: true },
            { stdin: "3\np 0\nq 0\n", expected: "start p\ndone p\nstart q\ndone q\np -> 0\nq -> 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which work gets faster with threads in CPython?",
          options: ["A pure-Python loop", "Work that waits on I/O", "Integer arithmetic", "List sorting"],
          answer: 1,
          explanation: "The GIL is released while a thread blocks; it is held while bytecode runs.",
        },
        {
          prompt: "What is the fix for `counter += 1` shared between threads?",
          options: ["Make it a global", "Hold a `Lock` around the compound operation", "Use `time.sleep`", "Use a daemon thread"],
          answer: 1,
          explanation: "The lock makes load-add-store atomic with respect to other holders.",
        },
        {
          prompt: "How does a consumer thread know a `Queue` will deliver no more work?",
          options: ["It checks `empty()`", "It receives a sentinel such as `None`", "The queue closes itself", "It times out"],
          answer: 1,
          explanation: "`empty()` is a race; one sentinel per consumer ends each loop cleanly.",
        },
        {
          prompt: "`ThreadPoolExecutor.map` versus `as_completed`: which preserves input order?",
          options: ["Both", "`map`", "`as_completed`", "Neither"],
          answer: 1,
          explanation: "`as_completed` yields by completion; sort its results before printing.",
        },
        {
          prompt: "Why must process-pool code sit under `if __name__ == \"__main__\":`?",
          options: ["Style only", "Workers import the main module; unguarded top-level code would start pools recursively", "For pickling", "For the GIL"],
          answer: 1,
          explanation: "Under the `spawn` start method the import re-runs every top-level statement.",
        },
        {
          prompt: "What crosses the boundary between a parent and a pool worker?",
          options: ["Shared memory by default", "Pickled functions, arguments and results", "References", "Nothing"],
          answer: 1,
          explanation: "Hence module-level functions and picklable data only.",
        },
        {
          prompt: "Which of these is an awaitable?",
          options: ["A plain function", "A coroutine object, a `Task` or a `Future`", "A thread", "An integer"],
          answer: 1,
          explanation: "Anything with `__await__`; `gather` and `create_task` produce them too.",
        },
        {
          prompt: "How many `asyncio.run` calls should a program make?",
          options: ["One per coroutine", "One, at the top level", "One per task", "None"],
          answer: 1,
          explanation: "It creates and closes the loop; inside a running loop you `await` instead.",
        },
        {
          prompt: "Why should you keep a reference to a task from `create_task`?",
          options: ["For speed", "The loop holds tasks weakly; an unreferenced task may be garbage-collected mid-flight", "To cancel it", "To print it"],
          answer: 1,
          explanation: "A list or set of tasks, or a `TaskGroup`, keeps them alive.",
        },
        {
          prompt: "What is `asyncio.Queue(maxsize=10)` giving you?",
          options: ["Ten consumers", "Back-pressure: `put` waits when ten items are pending", "Ten producers", "Ten seconds of timeout"],
          answer: 1,
          explanation: "A bounded queue stops a fast producer from outrunning slow consumers.",
        },
        {
          prompt: "`await asyncio.wait_for(coro, timeout=1)` times out. What happens to `coro`?",
          options: ["It keeps running", "It is cancelled and `TimeoutError` is raised", "It returns `None`", "It is retried"],
          answer: 1,
          explanation: "Cancellation is cooperative: `CancelledError` arrives at its next `await`.",
        },
        {
          prompt: "A concurrent program prints from each worker as it finishes. What is wrong?",
          options: ["Nothing", "The interleaving depends on the scheduler, so the output is not reproducible", "It is too slow", "Workers cannot print"],
          answer: 1,
          explanation: "Collect into ordered slots, join or gather, then print from the main thread.",
        },
      ],
    },
  ],
});

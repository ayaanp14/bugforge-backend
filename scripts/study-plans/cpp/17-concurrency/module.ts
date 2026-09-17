import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "concurrency",
  title: "Concurrency",
  blurb: "std::thread and std::jthread with the join rule; data races and the RAII locks; atomics and compare-exchange; condition variables and a bounded queue; futures, promises and std::async; a thread pool, split-and-reduce and the deterministic-output rule for judged programs.",
  icon: "threads",
  overview: `A second thread is a second flow of control sharing every byte of the process, and C++ gives you the primitives with no safety net: a variable two threads write without ordering is undefined behaviour, not merely a wrong count, and a joinable thread you forget to join ends the program. The reward is real parallelism on real cores — the study judge has two — and the patterns that make it safe are few and learnable.

The module takes them in order. Threads: how one starts, how arguments travel in (\`std::ref\`), \`join\` against \`detach\`, C++20's self-joining \`std::jthread\`, and the split-and-slot shape that needs no lock at all. Mutexes and locks: the data race defined precisely, \`std::mutex\` behind \`std::lock_guard\` and \`std::scoped_lock\`, small critical sections, deadlock and lock ordering. Atomics: \`fetch_add\` as a ticket dispenser, the compare-exchange loop, when an atomic replaces a mutex and when it cannot. Condition variables: the mutex-state-predicate protocol, spurious and lost wake-ups, a bounded producer–consumer queue and its clean shutdown. Futures: \`std::async\`, \`std::promise\` and \`std::packaged_task\`, exceptions crossing threads, results merged in index order. Patterns: a thread pool, work splitting and reduction, immutable data and message passing, and the rule every judged concurrent program obeys — threads compute, the main thread joins them all, and only then does anything print.

Every exercise is a judged program on the Clang 18 / C++20 runtime, and every one prints the same bytes on every run because its output never depends on scheduling: a chunked parallel sum, letter counts through \`std::ref\`, a histogram merged under one lock per thread, transfers under \`std::scoped_lock\`, Collatz lengths handed out by an atomic ticket, a bounded compare-exchange claim with a running maximum, the bounded queue itself, threads taking strict turns on a condition variable, digit sums through \`std::async\`, searches that keep or break a promise, a thread pool counting primes, and row sums over an immutable grid. The checkpoint adds a prime census counted with an atomic, a batch of divisions through \`std::async\` where some throw, and a two-stage pipeline of bounded queues whose prefix sums come out in order.`,
  lessons: [
    {
      slug: "threads",
      file: "01-threads.md",
      exercises: [
        {
          title: "Parallel sum, chunked",
          prompt: `Read \`t\` (the number of threads, 1–8) and \`n\`, then \`n\` integers. Split the indices into \`t\` **contiguous chunks** with the lesson's formula — chunk \`i\` is \`[i * n / t, (i + 1) * n / t)\`, which spreads the remainder and yields empty chunks when \`n < t\`. Start one \`std::thread\` per chunk; each sums its chunk into a local and stores the result in **its own slot** of a \`std::vector<long long>\` sized before any thread starts. Join every thread in a loop, and only then print, in index order, \`thread <i>: [<lo>, <hi>) sum <s>\` and finally \`total <sum>\`.

Nothing is printed from inside a thread, and no lock is needed: reads of the input never race, and each thread writes a different slot.

**Input:** \`t n\`, then \`n\` integers.
**Output:** \`t + 1\` lines.

\`\`\`text
3 7
1 2 3 4 5 6 7
\`\`\`
→
\`\`\`text
thread 0: [0, 2) sum 3
thread 1: [2, 4) sum 7
thread 2: [4, 7) sum 18
total 28
\`\`\``,
          starter: String.raw`#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::vector<long long> partial(t, 0);   // one slot per thread, sized before any thread starts
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t;
        const std::size_t hi = (i + 1) * n / t;
        // TODO: start a thread that sums v[lo, hi) into partial[i]
        (void)lo; (void)hi;
    }
    // TODO: join every worker

    long long total = 0;
    for (std::size_t i = 0; i < t; ++i) {
        // TODO: print "thread i: [lo, hi) sum s" and accumulate the total
    }
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::vector<long long> partial(t, 0);   // one slot per thread, sized before any thread starts
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t;
        const std::size_t hi = (i + 1) * n / t;
        workers.emplace_back([&v, &partial, i, lo, hi] {
            long long s = 0;
            for (std::size_t k = lo; k < hi; ++k) s += v[k];
            partial[i] = s;
        });
    }
    for (auto& w : workers) w.join();

    long long total = 0;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t;
        const std::size_t hi = (i + 1) * n / t;
        std::cout << "thread " << i << ": [" << lo << ", " << hi << ") sum " << partial[i] << '\n';
        total += partial[i];
    }
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          hints: [
            "Capture the vectors by reference and i, lo, hi by value: [&v, &partial, i, lo, hi] — a loop index captured by reference is read after the loop moved on.",
            "Accumulate in a local long long and store it once into partial[i]; the slot is yours alone, so no lock is needed.",
            "for (auto& w : workers) w.join(); must run before the first std::cout — a joinable thread destroyed at the end of main terminates the program.",
          ],
          cases: [
            { stdin: "3 7\n1 2 3 4 5 6 7\n", expected: "thread 0: [0, 2) sum 3\nthread 1: [2, 4) sum 7\nthread 2: [4, 7) sum 18\ntotal 28\n" },
            { stdin: "4 2\n10 -10\n", expected: "thread 0: [0, 0) sum 0\nthread 1: [0, 1) sum 10\nthread 2: [1, 1) sum 0\nthread 3: [1, 2) sum -10\ntotal 0\n" },
            { stdin: "1 3\n5 5 5\n", expected: "thread 0: [0, 3) sum 15\ntotal 15\n", hidden: true },
            { stdin: "2 4\n1000000000 1000000000 1000000000 1000000000\n", expected: "thread 0: [0, 2) sum 2000000000\nthread 1: [2, 4) sum 2000000000\ntotal 4000000000\n", hidden: true },
          ],
        },
        {
          title: "Letter ranges through std::ref",
          prompt: `Write \`void count_in(const std::string& text, char lo, char hi, int& out)\`, which counts the characters of \`text\` that, lower-cased, fall in \`[lo, hi]\`, and stores the count in \`out\`. Read \`t\` (1–26) and a line of text. Split the alphabet into \`t\` contiguous ranges with the chunk formula over 26 letters — range \`i\` runs from \`'a' + i * 26 / t\` to \`'a' + (i + 1) * 26 / t - 1\` — and start one **function-based** thread per range: \`std::thread(count_in, std::cref(text), lo, hi, std::ref(counts[i]))\`. The \`std::ref\` is the point: a thread copies its arguments and passes them as rvalues, so an \`int&\` parameter needs the wrapper, and \`std::cref\` spares the text a copy per thread.

After joining, print \`<lo>-<hi>: <count>\` per range and \`letters <total>\`.

**Input:** \`t\`, then one line of text.
**Output:** \`t + 1\` lines.

\`\`\`text
2
The quick brown fox jumps over the lazy dog
\`\`\`
→
\`\`\`text
a-m: 16
n-z: 19
letters 35
\`\`\``,
          starter: String.raw`#include <cctype>
#include <functional>
#include <iostream>
#include <string>
#include <thread>
#include <vector>

void count_in(const std::string& text, char lo, char hi, int& out) {
    // TODO: count characters whose lower-case form is in [lo, hi]
    (void)text; (void)lo; (void)hi;
    out = 0;
}

int main() {
    int t;
    std::cin >> t;
    std::cin.ignore();
    std::string text;
    std::getline(std::cin, text);

    std::vector<int> counts(t, 0);
    std::vector<std::thread> workers;
    for (int i = 0; i < t; ++i) {
        char lo = static_cast<char>('a' + i * 26 / t);
        char hi = static_cast<char>('a' + (i + 1) * 26 / t - 1);
        // TODO: workers.emplace_back(count_in, std::cref(text), lo, hi, std::ref(counts[i]));
        (void)lo; (void)hi;
    }
    // TODO: join, then print each range and the total
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <functional>
#include <iostream>
#include <string>
#include <thread>
#include <vector>

void count_in(const std::string& text, char lo, char hi, int& out) {
    int n = 0;
    for (char ch : text) {
        char c = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
        if (c >= lo && c <= hi) ++n;
    }
    out = n;
}

int main() {
    int t;
    std::cin >> t;
    std::cin.ignore();
    std::string text;
    std::getline(std::cin, text);

    std::vector<int> counts(t, 0);
    std::vector<std::thread> workers;
    for (int i = 0; i < t; ++i) {
        char lo = static_cast<char>('a' + i * 26 / t);
        char hi = static_cast<char>('a' + (i + 1) * 26 / t - 1);
        workers.emplace_back(count_in, std::cref(text), lo, hi, std::ref(counts[i]));
    }
    for (auto& w : workers) w.join();

    int total = 0;
    for (int i = 0; i < t; ++i) {
        char lo = static_cast<char>('a' + i * 26 / t);
        char hi = static_cast<char>('a' + (i + 1) * 26 / t - 1);
        std::cout << lo << '-' << hi << ": " << counts[i] << '\n';
        total += counts[i];
    }
    std::cout << "letters " << total << '\n';
    return 0;
}
`,
          hints: [
            "Without std::ref the constructor tries to bind int& to an rvalue copy and refuses: \"arguments must be invocable after conversion to rvalues\".",
            "std::tolower takes an int and misbehaves on negative char values; cast through unsigned char first.",
            "counts is sized before the loop, so counts[i] is a stable address for the whole life of thread i.",
          ],
          cases: [
            { stdin: "2\nThe quick brown fox jumps over the lazy dog\n", expected: "a-m: 16\nn-z: 19\nletters 35\n" },
            { stdin: "1\nHello, World!\n", expected: "a-z: 10\nletters 10\n" },
            { stdin: "3\nabc xyz MNO\n", expected: "a-h: 3\ni-q: 3\nr-z: 3\nletters 9\n", hidden: true },
            { stdin: "4\n1234 !!\n", expected: "a-f: 0\ng-m: 0\nn-s: 0\nt-z: 0\nletters 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A `std::thread` object is destroyed while still joinable. What happens?",
          options: ["The thread is joined automatically", "The thread is detached and keeps running", "`std::terminate` is called — the program aborts", "Undefined behaviour"],
          answer: 2,
          explanation: "The library refuses to guess between waiting and abandoning: destroying a joinable `std::thread` terminates the program. `std::jthread` is the type whose destructor joins.",
        },
        {
          prompt: "```cpp\nvoid work(int reps, long long& out);\nlong long result = 0;\nstd::thread t(work, 1000, result);\n```\nWhy does this fail to compile, and what is the fix?",
          options: ["`work` must be a lambda; wrap it", "Thread arguments are copied and passed as rvalues, so `long long&` cannot bind; pass `std::ref(result)`", "`result` must be `static`", "The thread needs `std::launch::async`"],
          answer: 1,
          explanation: "The constructor copies each argument into the thread's own storage and invokes the callable with rvalues; a non-const reference parameter cannot bind to those. `std::ref` wraps the original so the invocation unwraps it to a real reference.",
        },
        {
          prompt: "```cpp\nfor (int i = 0; i < 4; ++i)\n    workers.emplace_back([&] { partial[i] = compute(i); });\n```\nWhat is wrong?",
          options: ["Nothing; `[&]` is the usual capture for threads", "`i` is captured by reference, so a thread reads whatever value the loop variable has when it runs — a data race and the wrong slot", "Lambdas cannot be thread bodies", "`partial` must be captured by value"],
          answer: 1,
          explanation: "The loop keeps writing `i` while the threads read it. Capture the index by value and the shared vector by reference: `[&partial, i]`.",
        },
        {
          prompt: "What does the destructor of a `std::jthread` do that `std::thread`'s does not?",
          options: ["Deletes the thread's stack", "Calls `request_stop()` on its stop source and then joins", "Detaches the thread so `main` can return", "Throws if the thread is still running"],
          answer: 1,
          explanation: "`std::jthread` joins in its destructor, so an early return or an exception still waits for the worker, and it first requests a cooperative stop through the `std::stop_token` its callable may accept.",
        },
        {
          prompt: "A judged program calls `detach()` on its worker and returns from `main` while the worker is still computing. What happens?",
          options: ["The worker finishes and its output is appended", "The process ends and the worker is killed wherever it is; any reference it held to a local of `main` dangles", "`main` waits for detached threads", "Compile error: detached threads are not allowed"],
          answer: 1,
          explanation: "Returning from `main` ends the process regardless of detached threads. A program that reads, computes and prints has no use for `detach`; the scope that creates threads joins them.",
        },
        {
          prompt: "Why must a judged program never print from inside a worker thread?",
          options: ["`std::cout` is not thread-safe and the program will crash", "Concurrent `<<` calls are not a data race, but characters and lines may interleave in scheduler order, so the output differs between runs", "Only the main thread can write to `std::cout`", "Printing blocks the other threads"],
          answer: 1,
          explanation: "The standard guarantees no data race on `std::cout` but nothing about ordering. The judge compares bytes, so threads write to their own slots and the main thread prints after joining.",
        },
        {
          prompt: "With `n = 10` elements and `t = 4` threads, what chunks does `[i * n / t, (i + 1) * n / t)` produce?",
          options: ["`[0,3) [3,6) [6,9) [9,10)`", "`[0,2) [2,5) [5,7) [7,10)`", "`[0,2) [2,4) [4,6) [6,10)`", "`[0,3) [3,5) [5,8) [8,10)`"],
          answer: 1,
          explanation: "The bounds are 0, 10/4 = 2, 20/4 = 5, 30/4 = 7 and 40/4 = 10, so the remainder is spread as sizes 2, 3, 2, 3 with no special case.",
        },
      ],
    },
    {
      slug: "mutexes-and-locks",
      file: "02-mutexes-and-locks.md",
      exercises: [
        {
          title: "A histogram merged under one lock per thread",
          prompt: `Complete \`class Tally\`, which owns a \`std::array<long long, 10>\` of last-digit counts and a count of merges, both guarded by one \`std::mutex\` declared \`mutable\` so that const readers can lock too. \`merge(const std::array<long long, 10>&)\` adds a local histogram into the shared one and counts the merge, under a \`std::lock_guard\`; \`snapshot()\` and \`merges()\` are const and take the same lock — a read that skips the lock is still a data race.

Read \`t\` and \`n\`, then \`n\` non-negative integers. Each of \`t\` threads takes a contiguous chunk, builds a **local** histogram of \`x % 10\` with no lock at all, and calls \`merge\` **once** — compute privately, lock to publish. After joining, print \`<d>: <count>\` for digits 0–9 and \`merges <t>\`.

**Input:** \`t n\`, then \`n\` integers.
**Output:** eleven lines.

\`\`\`text
2 6
10 21 32 41 55 60
\`\`\`
→
\`\`\`text
0: 2
1: 2
2: 1
3: 0
4: 0
5: 1
6: 0
7: 0
8: 0
9: 0
merges 2
\`\`\``,
          starter: String.raw`#include <array>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

class Tally {
public:
    void merge(const std::array<long long, 10>& local) {
        // TODO: lock, add every bucket, count the merge
        (void)local;
    }
    std::array<long long, 10> snapshot() const {
        // TODO: lock, then copy
        return counts_;
    }
    int merges() const {
        // TODO: lock, then read
        return merges_;
    }
private:
    // TODO: a mutable std::mutex guarding counts_ and merges_
    std::array<long long, 10> counts_{};
    int merges_ = 0;
};

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    Tally tally;
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        workers.emplace_back([&v, &tally, lo, hi] {
            std::array<long long, 10> local{};
            // TODO: count v[lo, hi) by last digit locally, then tally.merge(local) once
            (void)local;
        });
    }
    for (auto& w : workers) w.join();

    const std::array<long long, 10> counts = tally.snapshot();
    for (int d = 0; d < 10; ++d) std::cout << d << ": " << counts[d] << '\n';
    std::cout << "merges " << tally.merges() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

class Tally {
public:
    void merge(const std::array<long long, 10>& local) {
        std::lock_guard<std::mutex> lock(m_);
        for (int d = 0; d < 10; ++d) counts_[d] += local[d];
        ++merges_;
    }
    std::array<long long, 10> snapshot() const {
        std::lock_guard<std::mutex> lock(m_);
        return counts_;
    }
    int merges() const {
        std::lock_guard<std::mutex> lock(m_);
        return merges_;
    }
private:
    mutable std::mutex m_;   // guards counts_ and merges_
    std::array<long long, 10> counts_{};
    int merges_ = 0;
};

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    Tally tally;
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        workers.emplace_back([&v, &tally, lo, hi] {
            std::array<long long, 10> local{};
            for (std::size_t k = lo; k < hi; ++k) ++local[v[k] % 10];
            tally.merge(local);
        });
    }
    for (auto& w : workers) w.join();

    const std::array<long long, 10> counts = tally.snapshot();
    for (int d = 0; d < 10; ++d) std::cout << d << ": " << counts[d] << '\n';
    std::cout << "merges " << tally.merges() << '\n';
    return 0;
}
`,
          hints: [
            "std::lock_guard<std::mutex> lock(m_); — named, at the top of each member that touches the guarded data; it unlocks at the closing brace on every path.",
            "A const member can only lock a mutable mutex; without mutable, snapshot() and merges() cannot compile.",
            "Every thread merges exactly once, even an empty chunk, so merges equals t whatever the interleaving.",
          ],
          cases: [
            { stdin: "2 6\n10 21 32 41 55 60\n", expected: "0: 2\n1: 2\n2: 1\n3: 0\n4: 0\n5: 1\n6: 0\n7: 0\n8: 0\n9: 0\nmerges 2\n" },
            { stdin: "3 1\n7\n", expected: "0: 0\n1: 0\n2: 0\n3: 0\n4: 0\n5: 0\n6: 0\n7: 1\n8: 0\n9: 0\nmerges 3\n" },
            { stdin: "4 0\n", expected: "0: 0\n1: 0\n2: 0\n3: 0\n4: 0\n5: 0\n6: 0\n7: 0\n8: 0\n9: 0\nmerges 4\n", hidden: true },
            { stdin: "2 5\n9 19 29 39 49\n", expected: "0: 0\n1: 0\n2: 0\n3: 0\n4: 0\n5: 0\n6: 0\n7: 0\n8: 0\n9: 5\nmerges 2\n", hidden: true },
          ],
        },
        {
          title: "Transfers under std::scoped_lock",
          prompt: `\`struct Account { std::mutex m; long long balance = 0; }\` — the mutex beside the data it guards. Write \`bool transfer(Account& from, Account& to, long long amount)\`: refuse (return \`false\`) when \`from\` and \`to\` are the **same object**, since locking a mutex a thread already holds is undefined behaviour; otherwise take **both** mutexes with one \`std::scoped_lock\` and move the amount. Balances may go negative — no funds check — so the final state does not depend on the order the threads happened to run in.

Read \`a\` accounts and \`t\` threads, the opening balances, then \`m\` transfers \`from to amount\`. Give each thread a contiguous chunk of the transfer list; each thread counts its own refusals in a local and the main thread sums those after joining. Print \`account <i>: <balance>\` for every account, \`self-transfers rejected <k>\` and \`total <sum of balances>\`. A \`std::vector<Account>\` cannot be resized once it exists (a mutex is neither copyable nor movable), so construct it with its final size.

**Input:** \`a t\`, a line of \`a\` balances, \`m\`, then \`m\` lines.
**Output:** \`a + 2\` lines.

\`\`\`text
3 2
100 50 0
4
0 1 30
1 2 20
2 2 5
0 2 100
\`\`\`
→
\`\`\`text
account 0: -30
account 1: 60
account 2: 120
self-transfers rejected 1
total 150
\`\`\``,
          starter: String.raw`#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

struct Account {
    std::mutex m;             // guards balance
    long long balance = 0;
};

struct Transfer {
    int from;
    int to;
    long long amount;
};

bool transfer(Account& from, Account& to, long long amount) {
    // TODO: refuse a self-transfer; otherwise std::scoped_lock both and move the amount
    (void)from; (void)to; (void)amount;
    return false;
}

int main() {
    std::size_t a, t;
    std::cin >> a >> t;
    std::vector<Account> accounts(a);   // sized once: Account is not movable
    for (auto& acc : accounts) std::cin >> acc.balance;
    std::size_t m;
    std::cin >> m;
    std::vector<Transfer> transfers(m);
    for (auto& tr : transfers) std::cin >> tr.from >> tr.to >> tr.amount;

    std::vector<int> rejected(t, 0);
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * m / t, hi = (i + 1) * m / t;
        // TODO: a thread that runs transfers[lo, hi) and counts refusals into rejected[i]
        (void)lo; (void)hi;
    }
    // TODO: join, then print the accounts, the rejected total and the balance total
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

struct Account {
    std::mutex m;             // guards balance
    long long balance = 0;
};

struct Transfer {
    int from;
    int to;
    long long amount;
};

bool transfer(Account& from, Account& to, long long amount) {
    if (&from == &to) return false;
    std::scoped_lock lock(from.m, to.m);   // both, or neither — never one
    from.balance -= amount;
    to.balance += amount;
    return true;
}

int main() {
    std::size_t a, t;
    std::cin >> a >> t;
    std::vector<Account> accounts(a);   // sized once: Account is not movable
    for (auto& acc : accounts) std::cin >> acc.balance;
    std::size_t m;
    std::cin >> m;
    std::vector<Transfer> transfers(m);
    for (auto& tr : transfers) std::cin >> tr.from >> tr.to >> tr.amount;

    std::vector<int> rejected(t, 0);
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * m / t, hi = (i + 1) * m / t;
        workers.emplace_back([&accounts, &transfers, &rejected, i, lo, hi] {
            int refused = 0;
            for (std::size_t k = lo; k < hi; ++k) {
                const Transfer& tr = transfers[k];
                if (!transfer(accounts[tr.from], accounts[tr.to], tr.amount)) ++refused;
            }
            rejected[i] = refused;
        });
    }
    for (auto& w : workers) w.join();

    long long total = 0;
    for (std::size_t i = 0; i < a; ++i) {
        std::cout << "account " << i << ": " << accounts[i].balance << '\n';
        total += accounts[i].balance;
    }
    int refusedTotal = 0;
    for (int r : rejected) refusedTotal += r;
    std::cout << "self-transfers rejected " << refusedTotal << '\n';
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          hints: [
            "std::scoped_lock lock(from.m, to.m); acquires both with a deadlock-avoiding algorithm whatever order two threads name them in; no template argument is needed.",
            "Compare addresses (&from == &to) before locking: the same mutex twice from one thread is undefined behaviour, and in practice a deadlock the judge reports as a timeout.",
            "Money is only moved between accounts, so the total is conserved and every balance is the same on every run, whichever thread ran which transfer first.",
          ],
          cases: [
            { stdin: "3 2\n100 50 0\n4\n0 1 30\n1 2 20\n2 2 5\n0 2 100\n", expected: "account 0: -30\naccount 1: 60\naccount 2: 120\nself-transfers rejected 1\ntotal 150\n" },
            { stdin: "1 3\n5\n2\n0 0 5\n0 0 1\n", expected: "account 0: 5\nself-transfers rejected 2\ntotal 5\n" },
            { stdin: "2 2\n0 0\n0\n", expected: "account 0: 0\naccount 1: 0\nself-transfers rejected 0\ntotal 0\n", hidden: true },
            { stdin: "4 3\n10 10 10 10\n6\n0 1 1\n1 2 1\n2 3 1\n3 0 1\n0 2 5\n3 3 9\n", expected: "account 0: 5\naccount 1: 10\naccount 2: 15\naccount 3: 10\nself-transfers rejected 1\ntotal 40\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Two threads run `++counter` on a plain `int` with no synchronisation. What does the C++ standard say about the program?",
          options: ["It prints a count that may be too low", "It has undefined behaviour — a data race — whatever it happens to print", "It is correct on x86-64 because `++` is one instruction", "It deadlocks"],
          answer: 1,
          explanation: "Two unordered accesses to one location with at least one write is a data race, and a program with one has undefined behaviour. Lost increments are the visible symptom; the compiler may also keep the value in a register and never see the other thread's writes.",
        },
        {
          prompt: "```cpp\nstd::lock_guard<std::mutex>{m};\n++counter;\n```\nWhat is wrong?",
          options: ["Nothing; the guard protects the increment", "The guard is an unnamed temporary destroyed at the semicolon, so the increment runs unlocked", "`lock_guard` needs `std::defer_lock`", "The mutex is locked twice"],
          answer: 1,
          explanation: "A temporary lives until the end of its full expression. Give the guard a name — `std::lock_guard<std::mutex> lock(m);` — so it lives until the closing brace.",
        },
        {
          prompt: "`add()` locks the mutex before writing `value_`, but `value()` reads it without locking \"because it only reads\". Is this correct?",
          options: ["Yes: reads never race", "No: a read concurrent with a write is still a data race; every access to guarded data, reads included, takes the lock", "Yes, as long as `value_` is `volatile`", "No, but only because `value()` is `const`"],
          answer: 1,
          explanation: "Reads only avoid racing with other reads. A read while `add` is mid-write is undefined behaviour, so the mutex is declared `mutable` and the const reader locks it too.",
        },
        {
          prompt: "Why is `std::scoped_lock lock(from.m, to.m);` preferred over locking `from.m` and then `to.m`?",
          options: ["It is faster", "It acquires both with a deadlock-avoiding algorithm, so two threads transferring in opposite directions cannot each hold one and wait for the other", "It locks only one of them", "It makes the mutexes recursive"],
          answer: 1,
          explanation: "Taking two locks in different orders in two threads is the classic deadlock. `std::scoped_lock` (or one fixed global order) removes the cycle.",
        },
        {
          prompt: "A thread that holds `std::mutex m` calls a function that locks `m` again. What happens?",
          options: ["The second lock succeeds; mutexes count nested locks", "Undefined behaviour — in practice a deadlock, the thread waiting for itself", "The second lock is ignored", "An exception is thrown"],
          answer: 1,
          explanation: "`std::mutex` is not recursive; locking it twice from one thread is undefined behaviour and usually hangs. `std::recursive_mutex` exists for legacy designs; needing it signals tangled locking.",
        },
        {
          prompt: "Which version keeps the most parallelism when four threads sum a large vector into a shared total?",
          options: ["Lock around every `total += v[i]`", "Lock once before the loop and unlock after", "Sum into a local variable without a lock, then lock once to add the local into the total", "Use `std::cout` to combine the results"],
          answer: 2,
          explanation: "Compute on private data and lock only to publish: one lock per thread instead of one per element, and no thread waits while another does the real work.",
        },
        {
          prompt: "Why is the mutex in `class Tally` declared `mutable std::mutex m_;`?",
          options: ["So that it can be copied", "So that `const` member functions such as `value() const` can lock it", "Because mutexes must be `mutable` to work across threads", "To allow `std::scoped_lock` to take it"],
          answer: 1,
          explanation: "Locking modifies the mutex, and a const member function may modify only `mutable` members. A reader that cannot lock would have to skip the lock, which is a data race.",
        },
      ],
    },
    {
      slug: "atomics",
      file: "03-atomics.md",
      exercises: [
        {
          title: "Collatz lengths from a ticket dispenser",
          prompt: `\`collatz_steps(long long x)\` returns how many steps \`x\` takes to reach 1 (halve when even, \`3x + 1\` when odd; 1 takes 0 steps). Read \`t\` and \`n\` and compute the step count for every \`x\` in \`1..n\` — but hand the work out **dynamically**: a \`std::atomic<int> next{0}\` is the ticket dispenser, and each thread loops \`int i = next.fetch_add(1); if (i >= n) break;\`, storing the answer for \`i + 1\` in \`steps[i]\`. Because \`fetch_add\` returns the previous value atomically, no index is handed out twice and none is skipped, whichever thread is faster.

After joining, on the main thread, find the number with the longest chain (the smallest such number on a tie) and the total of all step counts. Print \`longest <x> steps <k>\` and \`total <sum>\`. Which thread computed which index must not appear anywhere.

**Input:** \`t n\` (\`n\` at least 1).
**Output:** two lines.

\`\`\`text
2 10
\`\`\`
→
\`\`\`text
longest 9 steps 19
total 67
\`\`\``,
          starter: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int collatz_steps(long long x) {
    int steps = 0;
    while (x != 1) {
        x = x % 2 == 0 ? x / 2 : 3 * x + 1;
        ++steps;
    }
    return steps;
}

int main() {
    int t, n;
    std::cin >> t >> n;
    std::vector<int> steps(n, 0);
    std::atomic<int> next{0};
    std::vector<std::thread> workers;
    for (int i = 0; i < t; ++i) {
        workers.emplace_back([&steps, &next, n] {
            // TODO: take tickets with next.fetch_add(1) until one is >= n; fill steps[i]
            (void)n;
        });
    }
    for (auto& w : workers) w.join();
    // TODO: longest chain (smallest number on a tie) and the total, printed here
    return 0;
}
`,
          solution: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int collatz_steps(long long x) {
    int steps = 0;
    while (x != 1) {
        x = x % 2 == 0 ? x / 2 : 3 * x + 1;
        ++steps;
    }
    return steps;
}

int main() {
    int t, n;
    std::cin >> t >> n;
    std::vector<int> steps(n, 0);
    std::atomic<int> next{0};
    std::vector<std::thread> workers;
    for (int i = 0; i < t; ++i) {
        workers.emplace_back([&steps, &next, n] {
            while (true) {
                int i = next.fetch_add(1);
                if (i >= n) break;
                steps[i] = collatz_steps(i + 1);
            }
        });
    }
    for (auto& w : workers) w.join();

    int longest = 0;
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        if (steps[i] > steps[longest]) longest = i;
        total += steps[i];
    }
    std::cout << "longest " << longest + 1 << " steps " << steps[longest] << '\n';
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          hints: [
            "fetch_add(1) returns the value before the add, so the first caller gets 0, the next 1, and so on — with no lock and no duplicates.",
            "Each ticket i maps to its own slot steps[i], so the threads never write the same memory; the atomic is the only shared write.",
            "Scan the slots in index order on the main thread and replace the best only on a strictly greater count, so the smallest number wins a tie.",
          ],
          cases: [
            { stdin: "2 10\n", expected: "longest 9 steps 19\ntotal 67\n" },
            { stdin: "3 1\n", expected: "longest 1 steps 0\ntotal 0\n" },
            { stdin: "2 20\n", expected: "longest 18 steps 20\ntotal 196\n", hidden: true },
            { stdin: "1 7\n", expected: "longest 7 steps 16\ntotal 39\n", hidden: true },
          ],
        },
        {
          title: "Bounded claims and a running maximum",
          prompt: `Read \`t\`, a limit \`L\`, and \`n\` values. The threads take contiguous chunks and, for every value in theirs, do three things. **Maximum:** fold the value into \`std::atomic<long long> best\` with the lesson's compare-exchange loop — load, and while the value is greater and \`compare_exchange_weak\` fails, try again with the refreshed \`expected\`. **Claim:** try to claim one of \`L\` slots with the bounded loop \`while (cur < L && !claimed.compare_exchange_weak(cur, cur + 1)) {}\` — the claim succeeds only when \`cur < L\` after the loop. **Big values:** count values of 100 or more in a **local** and \`fetch_add\` that local into \`std::atomic<int> big\` once per thread.

After joining print \`max <best>\`, \`big <count>\` and \`claimed <count>\`. Which values won a claim depends on timing and is never printed; how many did — \`min(n, L)\` — does not.

**Input:** \`t L n\`, then \`n\` integers (\`n\` at least 1).
**Output:** three lines.

\`\`\`text
2 3 5
7 250 -4 100 99
\`\`\`
→
\`\`\`text
max 250
big 2
claimed 3
\`\`\``,
          starter: String.raw`#include <atomic>
#include <iostream>
#include <limits>
#include <thread>
#include <vector>

void update_max(std::atomic<long long>& best, long long candidate) {
    // TODO: the compare-exchange loop from the lesson
    (void)best; (void)candidate;
}

bool claim(std::atomic<int>& claimed, int limit) {
    // TODO: bounded claim; true only if a slot below limit was ours
    (void)claimed; (void)limit;
    return false;
}

int main() {
    std::size_t t;
    int limit;
    std::size_t n;
    std::cin >> t >> limit >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::atomic<long long> best{std::numeric_limits<long long>::min()};
    std::atomic<int> claimed{0};
    std::atomic<int> big{0};
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        workers.emplace_back([&, lo, hi] {
            // TODO: for each value: update_max, claim, count big locally; then big.fetch_add(local) once
            (void)lo; (void)hi;
        });
    }
    for (auto& w : workers) w.join();
    std::cout << "max " << best.load() << '\n';
    std::cout << "big " << big.load() << '\n';
    std::cout << "claimed " << claimed.load() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <atomic>
#include <iostream>
#include <limits>
#include <thread>
#include <vector>

void update_max(std::atomic<long long>& best, long long candidate) {
    long long cur = best.load();
    while (candidate > cur && !best.compare_exchange_weak(cur, candidate)) {
        // another thread changed best; cur now holds its value — decide again
    }
}

bool claim(std::atomic<int>& claimed, int limit) {
    int cur = claimed.load();
    while (cur < limit && !claimed.compare_exchange_weak(cur, cur + 1)) {
    }
    return cur < limit;
}

int main() {
    std::size_t t;
    int limit;
    std::size_t n;
    std::cin >> t >> limit >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::atomic<long long> best{std::numeric_limits<long long>::min()};
    std::atomic<int> claimed{0};
    std::atomic<int> big{0};
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        workers.emplace_back([&, lo, hi] {
            int localBig = 0;
            for (std::size_t k = lo; k < hi; ++k) {
                update_max(best, v[k]);
                claim(claimed, limit);
                if (v[k] >= 100) ++localBig;
            }
            big.fetch_add(localBig);
        });
    }
    for (auto& w : workers) w.join();
    std::cout << "max " << best.load() << '\n';
    std::cout << "big " << big.load() << '\n';
    std::cout << "claimed " << claimed.load() << '\n';
    return 0;
}
`,
          hints: [
            "compare_exchange_weak(cur, candidate) either stores candidate and returns true, or writes the current value into cur and returns false — so the loop condition re-reads nothing by hand.",
            "In claim, after the loop cur < limit means the exchange succeeded with our cur; cur >= limit means every slot was taken before we got one.",
            "Touch the big counter once per thread: count in a local and fetch_add it after the loop.",
          ],
          cases: [
            { stdin: "2 3 5\n7 250 -4 100 99\n", expected: "max 250\nbig 2\nclaimed 3\n" },
            { stdin: "3 10 4\n-5 -1 -9 -2\n", expected: "max -1\nbig 0\nclaimed 4\n" },
            { stdin: "4 0 3\n1 2 3\n", expected: "max 3\nbig 0\nclaimed 0\n", hidden: true },
            { stdin: "1 2 6\n100 100 100 5 5 1000\n", expected: "max 1000\nbig 4\nclaimed 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `a.fetch_add(1)` return?",
          options: ["The new value", "The previous value", "`true` if the add succeeded", "Nothing; it returns `void`"],
          answer: 1,
          explanation: "`fetch_add` returns the value before the addition, which is what makes it a ticket dispenser: every caller gets a distinct number. `++a` is the form that yields the new value.",
        },
        {
          prompt: "```cpp\nstd::atomic<int> a{0};\n// in each of two threads, 1000 times:\na.store(a.load() + 1);\n```\nWhat is the final value?",
          options: ["Exactly 2000", "Between 1000 and 2000: the load and the store are two operations, and increments between them are lost", "Undefined behaviour", "Exactly 1000"],
          answer: 1,
          explanation: "Each access is atomic, so there is no data race, but the sequence is not: another thread can store between the load and the store. Use `fetch_add(1)` for a single indivisible increment.",
        },
        {
          prompt: "`compare_exchange_weak(expected, desired)` returns `false`. What has happened to `expected`?",
          options: ["Nothing; it is unchanged", "It now holds the atomic's current value, ready for the next iteration of the loop", "It has been set to `desired`", "It has been zeroed"],
          answer: 1,
          explanation: "On failure the current value is written into `expected`, so a loop can decide again from fresh data without a separate load. The weak form may also fail spuriously, which is why it sits in a loop.",
        },
        {
          prompt: "Two atomics `items` and `total` must always agree (`total` is the sum of the items). Is updating them with two `fetch_add` calls enough?",
          options: ["Yes, both updates are atomic", "No: a reader can observe one updated and the other not; an invariant across variables needs a mutex", "Yes, if `memory_order_seq_cst` is used", "No, atomics cannot be used in pairs"],
          answer: 1,
          explanation: "Atomicity covers one operation on one variable. A compound update, or an invariant spanning two variables, is exactly what a mutex-protected critical section is for.",
        },
        {
          prompt: "When is `std::memory_order_relaxed` a safe choice for `counter.fetch_add(1, ...)`?",
          options: ["Never; always use the default", "When the counter is read only after every thread has been joined, because `join` itself synchronises", "When the counter publishes a data structure to other threads", "When the counter is a `double`"],
          answer: 1,
          explanation: "A relaxed operation is still atomic; it only gives up ordering relative to other memory. A counter whose final value is read after the joins needs no such ordering. Publishing data through a flag needs release/acquire.",
        },
        {
          prompt: "`std::vector<std::atomic<int>> counters; counters.push_back(std::atomic<int>{0});` — what happens?",
          options: ["It works", "Compile error: atomics are neither copyable nor movable, so the vector cannot insert one; size it at construction instead", "Undefined behaviour at run time", "It works only with `emplace_back`"],
          answer: 1,
          explanation: "Copying an atomic would not be atomic, so the type forbids it; a vector of atomics can be constructed with a size (elements value-initialised) but never grown by insertion.",
        },
        {
          prompt: "Why must a judged program never accumulate a floating-point sum through `std::atomic<double>::fetch_add`?",
          options: ["`fetch_add` on `double` does not exist", "Floating-point addition is not associative, so the sum depends on the order the scheduler let the threads add, and the last bits vary between runs", "It is a data race", "Atomic doubles are always locked"],
          answer: 1,
          explanation: "C++20 provides the operation, but the order of contributions is scheduling-dependent. Keep each thread's partial and add them in index order on the main thread.",
        },
      ],
    },
    {
      slug: "condition-variables",
      file: "04-condition-variables.md",
      exercises: [
        {
          title: "The bounded queue",
          prompt: `Complete \`class BoundedQueue\` from the lesson: \`push(v)\` waits under a \`std::unique_lock\` until the queue is below capacity, appends, unlocks and notifies \`notEmpty_\`; \`pop()\` waits until there is an item **or the queue is closed**, returns \`std::nullopt\` only when it is closed and drained, otherwise takes the front, unlocks and notifies \`notFull_\`; \`close()\` sets the flag under the mutex and \`notify_all\`s, so every consumer wakes and exits. Every \`wait\` takes a predicate — a spurious wake-up must go back to sleep.

Read \`capacity\` and \`n\`, then \`n\` integers. A producer thread pushes them in order and then closes the queue; a consumer thread pops until \`nullopt\`, tracking the count, the sum and the maximum. Join both, then print \`items <count> sum <sum> max <max>\`. The totals are the same on every run because the set of items is fixed; how full the queue got is not, and is never printed.

**Input:** \`capacity n\` (both at least 1), then \`n\` integers.
**Output:** one line.

\`\`\`text
2 5
3 9 -2 7 1
\`\`\`
→
\`\`\`text
items 5 sum 18 max 9
\`\`\``,
          starter: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <thread>
#include <vector>

class BoundedQueue {
public:
    explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {}

    void push(long long v) {
        std::unique_lock<std::mutex> lock(m_);
        // TODO: wait until items_.size() < capacity_, push, unlock, notify notEmpty_
        items_.push(v);
    }

    std::optional<long long> pop() {
        std::unique_lock<std::mutex> lock(m_);
        // TODO: wait until !items_.empty() || closed_; nullopt when empty; else take the front,
        //       unlock, notify notFull_
        if (items_.empty()) return std::nullopt;
        long long v = items_.front();
        items_.pop();
        return v;
    }

    void close() {
        // TODO: set closed_ under the mutex, then notify_all on notEmpty_
        closed_ = true;
    }

private:
    std::mutex m_;                          // guards everything below
    std::condition_variable notFull_;
    std::condition_variable notEmpty_;
    std::queue<long long> items_;
    std::size_t capacity_;
    bool closed_ = false;
};

int main() {
    std::size_t capacity, n;
    std::cin >> capacity >> n;
    std::vector<long long> values(n);
    for (auto& v : values) std::cin >> v;

    BoundedQueue q(capacity);
    long long count = 0, sum = 0, best = 0;
    std::thread consumer([&q, &count, &sum, &best] {
        while (auto item = q.pop()) {
            if (count == 0 || *item > best) best = *item;
            ++count;
            sum += *item;
        }
    });
    std::thread producer([&q, &values] {
        for (long long v : values) q.push(v);
        q.close();
    });
    producer.join();
    consumer.join();
    std::cout << "items " << count << " sum " << sum << " max " << best << '\n';
    return 0;
}
`,
          solution: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <thread>
#include <vector>

class BoundedQueue {
public:
    explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {}

    void push(long long v) {
        std::unique_lock<std::mutex> lock(m_);
        notFull_.wait(lock, [this] { return items_.size() < capacity_; });
        items_.push(v);
        lock.unlock();
        notEmpty_.notify_one();
    }

    std::optional<long long> pop() {
        std::unique_lock<std::mutex> lock(m_);
        notEmpty_.wait(lock, [this] { return !items_.empty() || closed_; });
        if (items_.empty()) return std::nullopt;       // closed and drained
        long long v = items_.front();
        items_.pop();
        lock.unlock();
        notFull_.notify_one();
        return v;
    }

    void close() {
        {
            std::lock_guard<std::mutex> lock(m_);
            closed_ = true;
        }
        notEmpty_.notify_all();
    }

private:
    std::mutex m_;                          // guards everything below
    std::condition_variable notFull_;
    std::condition_variable notEmpty_;
    std::queue<long long> items_;
    std::size_t capacity_;
    bool closed_ = false;
};

int main() {
    std::size_t capacity, n;
    std::cin >> capacity >> n;
    std::vector<long long> values(n);
    for (auto& v : values) std::cin >> v;

    BoundedQueue q(capacity);
    long long count = 0, sum = 0, best = 0;
    std::thread consumer([&q, &count, &sum, &best] {
        while (auto item = q.pop()) {
            if (count == 0 || *item > best) best = *item;
            ++count;
            sum += *item;
        }
    });
    std::thread producer([&q, &values] {
        for (long long v : values) q.push(v);
        q.close();
    });
    producer.join();
    consumer.join();
    std::cout << "items " << count << " sum " << sum << " max " << best << '\n';
    return 0;
}
`,
          hints: [
            "notFull_.wait(lock, [this] { return items_.size() < capacity_; }); — the predicate form re-checks after every wake-up, spurious or not.",
            "The pop predicate is !items_.empty() || closed_: a closed queue still hands out what remains and returns nullopt only once it is empty.",
            "close() must change closed_ under the mutex and then notify_all; a consumer blocked in pop with nothing to wake it would hang forever.",
          ],
          cases: [
            { stdin: "2 5\n3 9 -2 7 1\n", expected: "items 5 sum 18 max 9\n" },
            { stdin: "1 1\n42\n", expected: "items 1 sum 42 max 42\n" },
            { stdin: "4 6\n-1 -1 -1 -1 -1 -1\n", expected: "items 6 sum -6 max -1\n", hidden: true },
            { stdin: "3 8\n1 2 3 4 5 6 7 8\n", expected: "items 8 sum 36 max 8\n", hidden: true },
          ],
        },
        {
          title: "Strict turns",
          prompt: `Read \`k\` (threads, 1–8) and \`r\` (rounds). Start \`k\` threads; thread \`i\` (0-based) must append the letter \`'A' + i\` to a shared \`std::string\` exactly \`r\` times, and the threads must take **strict turns**: an \`int turn\` under the mutex says whose go it is, thread \`i\` waits with a predicate for \`turn % k == i\`, appends, increments \`turn\`, and \`notify_all\`s — every waiter must re-check, because only one of them can proceed and you cannot tell which is asleep. The result is the same string on every run, \`ABC...ABC...\`.

After joining, print \`sequence <string>\` and \`length <k * r>\`.

**Input:** \`k r\`.
**Output:** two lines.

\`\`\`text
3 2
\`\`\`
→
\`\`\`text
sequence ABCABC
length 6
\`\`\``,
          starter: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

int main() {
    int k, r;
    std::cin >> k >> r;

    std::mutex m;
    std::condition_variable cv;
    int turn = 0;              // guarded by m
    std::string sequence;      // guarded by m

    std::vector<std::thread> workers;
    for (int i = 0; i < k; ++i) {
        workers.emplace_back([&, i] {
            for (int round = 0; round < r; ++round) {
                std::unique_lock<std::mutex> lock(m);
                // TODO: wait until turn % k == i, append 'A' + i, ++turn, unlock, notify_all
            }
        });
    }
    for (auto& w : workers) w.join();
    std::cout << "sequence " << sequence << '\n';
    std::cout << "length " << sequence.size() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

int main() {
    int k, r;
    std::cin >> k >> r;

    std::mutex m;
    std::condition_variable cv;
    int turn = 0;              // guarded by m
    std::string sequence;      // guarded by m

    std::vector<std::thread> workers;
    for (int i = 0; i < k; ++i) {
        workers.emplace_back([&, i] {
            for (int round = 0; round < r; ++round) {
                std::unique_lock<std::mutex> lock(m);
                cv.wait(lock, [&] { return turn % k == i; });
                sequence.push_back(static_cast<char>('A' + i));
                ++turn;
                lock.unlock();
                cv.notify_all();
            }
        });
    }
    for (auto& w : workers) w.join();
    std::cout << "sequence " << sequence << '\n';
    std::cout << "length " << sequence.size() << '\n';
    return 0;
}
`,
          hints: [
            "cv.wait(lock, [&] { return turn % k == i; }); sleeps until it is this thread's go and holds the mutex when it returns.",
            "notify_one could wake a thread whose turn it is not; it would re-check and sleep, and the right one would never be woken — use notify_all.",
            "Change turn under the mutex, then notify: the state carries the information, the notification only says look again.",
          ],
          cases: [
            { stdin: "3 2\n", expected: "sequence ABCABC\nlength 6\n" },
            { stdin: "1 4\n", expected: "sequence AAAA\nlength 4\n" },
            { stdin: "4 3\n", expected: "sequence ABCDABCDABCD\nlength 12\n", hidden: true },
            { stdin: "2 0\n", expected: "sequence\nlength 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `cv.wait(lock, pred)` used rather than `cv.wait(lock)` followed by the action?",
          options: ["The one-argument form does not exist", "A wait may return spuriously; the predicate form re-checks the condition after every wake-up and sleeps again if it does not hold", "The predicate form is faster", "The one-argument form does not release the mutex"],
          answer: 1,
          explanation: "Operating systems permit spurious wake-ups, and a waiter that treats waking as proof of the condition reads an empty queue. `wait(lock, pred)` is `while (!pred()) wait(lock);`.",
        },
        {
          prompt: "A producer sets `ready = true` without holding the mutex and calls `notify_one`. What can go wrong?",
          options: ["Nothing; the notify is what wakes the consumer", "A lost wake-up: the consumer may check `ready`, see false, and be about to wait when the flag flips and the notify arrives with nobody waiting — it then sleeps forever", "The notify throws", "The consumer wakes twice"],
          answer: 1,
          explanation: "The state must change under the mutex so the consumer's predicate check and its sleep are one atomic step relative to the producer. The notify itself carries no information; only the state does.",
        },
        {
          prompt: "When is `notify_all` required rather than `notify_one`?",
          options: ["Always; `notify_one` is deprecated", "When the change concerns every waiter — a shutdown flag, a group go-signal — or when waiters wait on different predicates and you cannot tell which the change satisfies", "Only when more than one item was pushed", "Never; it only wastes wake-ups"],
          answer: 1,
          explanation: "`notify_one` is right when any single waiter can consume the change. Waking everyone for a single item is merely slow; waking one for a shutdown leaves the others asleep forever.",
        },
        {
          prompt: "Why does `std::condition_variable::wait` take a `std::unique_lock<std::mutex>` and not a `std::lock_guard`?",
          options: ["`lock_guard` is slower", "`wait` must unlock the mutex while sleeping and re-lock it before returning; `unique_lock` supports that, `lock_guard` cannot", "`lock_guard` cannot be passed by reference", "It is a historical accident"],
          answer: 1,
          explanation: "`wait` atomically releases the mutex and sleeps, then reacquires it on wake-up. Only a lock type that can be unlocked and re-locked can be handed to it.",
        },
        {
          prompt: "A bounded queue's `pop()` waits on `!items_.empty() || closed_`. After `close()`, what does `pop()` return while items remain?",
          options: ["`std::nullopt` immediately", "The remaining items in order, then `std::nullopt` once the queue is empty", "The last item only", "It throws"],
          answer: 1,
          explanation: "The predicate lets a consumer through when there is an item or the queue is closed; the body returns `nullopt` only when it is empty. Closing means \"no more will come\", not \"discard what is here\".",
        },
        {
          prompt: "In a producer–consumer program, which of these is safe to print in a judged case?",
          options: ["The maximum number of items the queue held at once", "How many times the producer had to wait", "The sum and count of all items consumed", "Which thread consumed item 7"],
          answer: 2,
          explanation: "The set of items is fixed by the producer, so totals over it are the same every run. Queue depth, wait counts and which thread did what depend on scheduling.",
        },
        {
          prompt: "What does the capacity bound of a `BoundedQueue` provide that an unbounded queue does not?",
          options: ["Faster pushes", "Back-pressure: a producer that outruns the consumer sleeps in `push` instead of filling memory", "Ordering of items", "Thread safety"],
          answer: 1,
          explanation: "Both are thread-safe and FIFO. Only the bound makes a fast producer wait, which is what keeps memory finite when consumers are slow.",
        },
      ],
    },
    {
      slug: "futures-and-async",
      file: "05-futures-and-async.md",
      exercises: [
        {
          title: "Digit sums through std::async",
          prompt: `Read \`t\` and \`n\`, then \`n\` non-negative integers. Split the indices into \`t\` contiguous chunks and launch each with \`std::async(std::launch::async, ...)\` — name the policy, so the work really runs in parallel — computing the sum of the **digit sums** of the values in the chunk (\`305\` contributes \`3 + 0 + 5 = 8\`). Keep every \`std::future<long long>\` in a vector; a future from \`std::async\` blocks in its destructor, so discarding it would make the loop sequential. Then \`get()\` them **in index order**, whatever order they finished, printing \`chunk <i>: <sum>\` and finally \`total <sum>\`.

**Input:** \`t n\`, then \`n\` integers.
**Output:** \`t + 1\` lines.

\`\`\`text
2 5
12 305 7 99 1000
\`\`\`
→
\`\`\`text
chunk 0: 11
chunk 1: 26
total 37
\`\`\``,
          starter: String.raw`#include <future>
#include <iostream>
#include <vector>

int digit_sum(long long x) {
    int s = 0;
    while (x > 0) {
        s += static_cast<int>(x % 10);
        x /= 10;
    }
    return s;
}

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::vector<std::future<long long>> parts;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        // TODO: parts.push_back(std::async(std::launch::async, ...)) summing digit_sum over v[lo, hi)
        (void)lo; (void)hi;
    }
    // TODO: get() in index order, print each chunk and the total
    return 0;
}
`,
          solution: String.raw`#include <future>
#include <iostream>
#include <vector>

int digit_sum(long long x) {
    int s = 0;
    while (x > 0) {
        s += static_cast<int>(x % 10);
        x /= 10;
    }
    return s;
}

int main() {
    std::size_t t, n;
    std::cin >> t >> n;
    std::vector<long long> v(n);
    for (auto& x : v) std::cin >> x;

    std::vector<std::future<long long>> parts;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * n / t, hi = (i + 1) * n / t;
        parts.push_back(std::async(std::launch::async, [&v, lo, hi] {
            long long s = 0;
            for (std::size_t k = lo; k < hi; ++k) s += digit_sum(v[k]);
            return s;
        }));
    }
    long long total = 0;
    for (std::size_t i = 0; i < t; ++i) {
        long long s = parts[i].get();
        std::cout << "chunk " << i << ": " << s << '\n';
        total += s;
    }
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          hints: [
            "std::async returns a std::future for the lambda's return type; push it into the vector so its destructor does not run until the end.",
            "get() waits if the task is still running and can be called once per future; walking parts[0], parts[1], ... makes the merge order fixed.",
            "The lambda captures v by reference and the bounds by value, exactly like a thread body; the vector of futures does the joining.",
          ],
          cases: [
            { stdin: "2 5\n12 305 7 99 1000\n", expected: "chunk 0: 11\nchunk 1: 26\ntotal 37\n" },
            { stdin: "3 2\n0 0\n", expected: "chunk 0: 0\nchunk 1: 0\nchunk 2: 0\ntotal 0\n" },
            { stdin: "1 4\n999 1 22 333\n", expected: "chunk 0: 41\ntotal 41\n", hidden: true },
            { stdin: "4 4\n1 2 3 4\n", expected: "chunk 0: 1\nchunk 1: 2\nchunk 2: 3\nchunk 3: 4\ntotal 10\n", hidden: true },
          ],
        },
        {
          title: "A promise kept or broken",
          prompt: `Write \`void find_first(const std::vector<int>& v, int target, std::promise<int> result)\`, which searches \`v\` for \`target\` and either \`set_value\`s the first index or \`set_exception\`s a \`std::runtime_error("not found")\` — exactly one of the two, once. Read \`n\` values, then \`q\` targets. For each target create a \`std::promise<int>\`, take its future **before** moving the promise into a \`std::thread\`, and keep the futures and the threads in vectors. Then, in query order, \`get()\` each future inside a \`try\`: print \`<target> found at <index>\` or, on \`std::runtime_error\`, \`<target> not found\`. Join every thread before returning.

**Input:** \`n\`, a line of \`n\` integers, \`q\`, a line of \`q\` targets.
**Output:** \`q\` lines.

\`\`\`text
5
4 8 15 16 23
3
15 4 42
\`\`\`
→
\`\`\`text
15 found at 2
4 found at 0
42 not found
\`\`\``,
          starter: String.raw`#include <exception>
#include <functional>
#include <future>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <vector>

void find_first(const std::vector<int>& v, int target, std::promise<int> result) {
    // TODO: set_value(index) for the first match, else set_exception(std::make_exception_ptr(std::runtime_error("not found")))
    (void)v; (void)target;
    result.set_value(-1);
}

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<int> v(n);
    for (auto& x : v) std::cin >> x;
    std::size_t q;
    std::cin >> q;
    std::vector<int> targets(q);
    for (auto& x : targets) std::cin >> x;

    std::vector<std::future<int>> results;
    std::vector<std::thread> workers;
    for (int target : targets) {
        // TODO: a promise, its future (before the move), a thread running find_first with std::cref(v) and std::move(promise)
        (void)target;
    }
    // TODO: get() each future in order inside try/catch, print the line; then join every worker
    return 0;
}
`,
          solution: String.raw`#include <exception>
#include <functional>
#include <future>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <vector>

void find_first(const std::vector<int>& v, int target, std::promise<int> result) {
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) {
            result.set_value(static_cast<int>(i));
            return;
        }
    }
    result.set_exception(std::make_exception_ptr(std::runtime_error("not found")));
}

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<int> v(n);
    for (auto& x : v) std::cin >> x;
    std::size_t q;
    std::cin >> q;
    std::vector<int> targets(q);
    for (auto& x : targets) std::cin >> x;

    std::vector<std::future<int>> results;
    std::vector<std::thread> workers;
    for (int target : targets) {
        std::promise<int> p;
        results.push_back(p.get_future());
        workers.emplace_back(find_first, std::cref(v), target, std::move(p));
    }
    for (std::size_t i = 0; i < q; ++i) {
        try {
            int index = results[i].get();
            std::cout << targets[i] << " found at " << index << '\n';
        } catch (const std::runtime_error&) {
            std::cout << targets[i] << " not found\n";
        }
    }
    for (auto& w : workers) w.join();
    return 0;
}
`,
          hints: [
            "p.get_future() must be called before std::move(p) into the thread; a moved-from promise has no shared state.",
            "A promise is move-only, so it travels into the thread with std::move; the vector of the search is shared with std::cref.",
            "get() rethrows what set_exception stored, with its dynamic type intact, so catch const std::runtime_error&.",
          ],
          cases: [
            { stdin: "5\n4 8 15 16 23\n3\n15 4 42\n", expected: "15 found at 2\n4 found at 0\n42 not found\n" },
            { stdin: "1\n7\n2\n7 8\n", expected: "7 found at 0\n8 not found\n" },
            { stdin: "0\n1\n1\n", expected: "1 not found\n", hidden: true },
            { stdin: "4\n1 1 2 2\n2\n2 1\n", expected: "2 found at 2\n1 found at 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "```cpp\nfor (int i = 0; i < 4; ++i)\n    std::async(std::launch::async, work, i);\n```\nHow do the four tasks run?",
          options: ["In parallel, four threads at once", "One after another: each temporary future is destroyed at the semicolon and its destructor waits for the task", "Not at all; the futures are discarded", "In parallel, but their results are lost"],
          answer: 1,
          explanation: "A future obtained from `std::async` blocks in its destructor until the task completes. Keep the futures in a vector and the tasks overlap.",
        },
        {
          prompt: "`std::async(work, 5)` with no launch policy — is the work guaranteed to run on another thread?",
          options: ["Yes, always", "No: the default policy allows deferred execution on the thread that calls `get()`; write `std::launch::async` when parallelism is the point", "No: it always runs deferred", "Yes, unless `work` throws"],
          answer: 1,
          explanation: "The default is `async | deferred` and the implementation chooses. libstdc++ starts a thread, but code that needs concurrency should say so explicitly.",
        },
        {
          prompt: "What happens on the second call to `get()` on the same `std::future`?",
          options: ["It returns the same value again", "It throws `std::future_error`; for several readers use `share()` to obtain a `std::shared_future`", "It blocks forever", "It returns a default value"],
          answer: 1,
          explanation: "`get()` moves the result out and leaves the future invalid. A `std::shared_future` may be copied and read many times.",
        },
        {
          prompt: "A function run through `std::async` throws `std::out_of_range`. Where does the exception surface?",
          options: ["In the worker thread, calling `std::terminate`", "From `future.get()` on whichever thread calls it, with its dynamic type preserved", "It is silently dropped", "From the future's destructor"],
          answer: 1,
          explanation: "The library catches the exception, stores it in the shared state, and `get()` rethrows it. That is the only mechanism for carrying exceptions across threads; a plain `std::thread` body that throws terminates.",
        },
        {
          prompt: "A `std::promise<int>` is destroyed without `set_value` or `set_exception` having been called. What does the waiting `get()` do?",
          options: ["Blocks forever", "Throws `std::future_error` with `broken_promise`", "Returns 0", "Returns immediately with an indeterminate value"],
          answer: 1,
          explanation: "The promise's destructor stores a `broken_promise` error so that no waiter hangs. `set_value` twice throws `promise_already_satisfied`.",
        },
        {
          prompt: "An exception escapes the body of a `std::thread`. What happens?",
          options: ["It is caught by the thread that called `join()`", "`std::terminate` is called — there is no future to carry it", "It is stored and rethrown by `join()`", "The thread is detached"],
          answer: 1,
          explanation: "Only futures transport exceptions between threads. A worker started with `std::thread` must catch its own exceptions or be wrapped in a `std::packaged_task`.",
        },
        {
          prompt: "What does `std::packaged_task<long long(long long)>` add to a plain callable?",
          options: ["A new thread", "A future that will hold the return value or exception when someone calls the task — which is what a thread pool needs to queue work", "Automatic retries", "A mutex around the call"],
          answer: 1,
          explanation: "The task can be moved into a queue and called later by any worker; the submitter already holds the future from `get_future()`.",
        },
      ],
    },
    {
      slug: "concurrency-patterns",
      file: "06-concurrency-patterns.md",
      exercises: [
        {
          title: "A thread pool",
          prompt: `Complete the lesson's \`ThreadPool\`. \`submit(std::function<long long()>)\` wraps the function in a \`std::packaged_task<long long()>\`, takes its future, pushes the task onto the queue under the mutex, notifies one worker and returns the future. \`run()\` — the body of every worker — loops: wait under a \`std::unique_lock\` until stopping or a task is available; return only when stopping **and** the queue is drained (a task thrown away would break its future's promise); otherwise move the front task out, **unlock**, and run it outside the lock so workers overlap. The constructor and destructor are given.

Read \`w\` (workers, 1–4) and \`n\`, then \`n\` integers \`k\`. Submit one task per \`k\` computing how many primes are \`≤ k\` (\`count_primes\` is given), keep the futures in a vector, and print \`task <i>: <count>\` by calling \`get()\` in **submission order** — deterministic whatever order the workers finished. End with \`done <n>\`.

**Input:** \`w n\`, then \`n\` integers (each at most 100000).
**Output:** \`n + 1\` lines.

\`\`\`text
2 4
10 100 1 30
\`\`\`
→
\`\`\`text
task 0: 4
task 1: 25
task 2: 0
task 3: 10
done 4
\`\`\``,
          starter: String.raw`#include <condition_variable>
#include <deque>
#include <functional>
#include <future>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(int workers) {
        for (int i = 0; i < workers; ++i) threads_.emplace_back([this] { run(); });
    }
    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(m_);
            stopping_ = true;
        }
        cv_.notify_all();
        for (auto& t : threads_) t.join();
    }
    std::future<long long> submit(std::function<long long()> f) {
        std::packaged_task<long long()> task(std::move(f));
        std::future<long long> result = task.get_future();
        // TODO: push the task under the lock, notify one worker
        task();   // placeholder: runs it here, on the caller's thread
        return result;
    }
private:
    void run() {
        // TODO: loop — wait for stopping_ || !tasks_.empty(); return if drained and stopping;
        //       move the front task out, pop it, unlock, run it
    }
    std::vector<std::thread> threads_;
    std::deque<std::packaged_task<long long()>> tasks_;   // guarded by m_
    std::mutex m_;
    std::condition_variable cv_;
    bool stopping_ = false;
};

long long count_primes(int k) {
    long long count = 0;
    for (int x = 2; x <= k; ++x) {
        bool prime = true;
        for (int d = 2; d * d <= x; ++d) {
            if (x % d == 0) { prime = false; break; }
        }
        if (prime) ++count;
    }
    return count;
}

int main() {
    int w, n;
    std::cin >> w >> n;
    std::vector<std::future<long long>> results;
    {
        ThreadPool pool(w);
        for (int i = 0; i < n; ++i) {
            int k;
            std::cin >> k;
            results.push_back(pool.submit([k] { return count_primes(k); }));
        }
        for (int i = 0; i < n; ++i) std::cout << "task " << i << ": " << results[i].get() << '\n';
    }   // the pool stops and joins here
    std::cout << "done " << n << '\n';
    return 0;
}
`,
          solution: String.raw`#include <condition_variable>
#include <deque>
#include <functional>
#include <future>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(int workers) {
        for (int i = 0; i < workers; ++i) threads_.emplace_back([this] { run(); });
    }
    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(m_);
            stopping_ = true;
        }
        cv_.notify_all();
        for (auto& t : threads_) t.join();
    }
    std::future<long long> submit(std::function<long long()> f) {
        std::packaged_task<long long()> task(std::move(f));
        std::future<long long> result = task.get_future();
        {
            std::lock_guard<std::mutex> lock(m_);
            tasks_.push_back(std::move(task));
        }
        cv_.notify_one();
        return result;
    }
private:
    void run() {
        while (true) {
            std::packaged_task<long long()> task;
            {
                std::unique_lock<std::mutex> lock(m_);
                cv_.wait(lock, [this] { return stopping_ || !tasks_.empty(); });
                if (tasks_.empty()) return;             // stopping and drained
                task = std::move(tasks_.front());
                tasks_.pop_front();
            }
            task();                                     // outside the lock
        }
    }
    std::vector<std::thread> threads_;
    std::deque<std::packaged_task<long long()>> tasks_;   // guarded by m_
    std::mutex m_;
    std::condition_variable cv_;
    bool stopping_ = false;
};

long long count_primes(int k) {
    long long count = 0;
    for (int x = 2; x <= k; ++x) {
        bool prime = true;
        for (int d = 2; d * d <= x; ++d) {
            if (x % d == 0) { prime = false; break; }
        }
        if (prime) ++count;
    }
    return count;
}

int main() {
    int w, n;
    std::cin >> w >> n;
    std::vector<std::future<long long>> results;
    {
        ThreadPool pool(w);
        for (int i = 0; i < n; ++i) {
            int k;
            std::cin >> k;
            results.push_back(pool.submit([k] { return count_primes(k); }));
        }
        for (int i = 0; i < n; ++i) std::cout << "task " << i << ": " << results[i].get() << '\n';
    }   // the pool stops and joins here
    std::cout << "done " << n << '\n';
    return 0;
}
`,
          hints: [
            "A packaged_task is move-only: tasks_.push_back(std::move(task)) under a lock_guard, then cv_.notify_one() after the lock is released.",
            "In run(), the predicate is stopping_ || !tasks_.empty(); test tasks_.empty() after the wait to decide between returning and taking a task.",
            "Move the task into a local inside the locked block and call it after the block, so other workers can take the next task meanwhile.",
          ],
          cases: [
            { stdin: "2 4\n10 100 1 30\n", expected: "task 0: 4\ntask 1: 25\ntask 2: 0\ntask 3: 10\ndone 4\n" },
            { stdin: "1 2\n2 1000\n", expected: "task 0: 1\ntask 1: 168\ndone 2\n" },
            { stdin: "3 0\n", expected: "done 0\n", hidden: true },
            { stdin: "4 5\n7 7 7 7 7\n", expected: "task 0: 4\ntask 1: 4\ntask 2: 4\ntask 3: 4\ntask 4: 4\ndone 5\n", hidden: true },
          ],
        },
        {
          title: "Row sums over an immutable grid",
          prompt: `Read \`t\`, \`R\` and \`C\`, then an \`R × C\` grid of integers into a \`std::vector<std::vector<long long>>\` that is **never written once the threads start** — pass it to them as \`const\`. Split the rows into \`t\` contiguous chunks. Each thread writes the sum of each of its rows into its own slots of a pre-sized \`rowSums\` vector, and adds its chunk's total into a \`std::atomic<long long> grand\` with **one** \`fetch_add\` after its loop. After joining, print \`row <r>: <sum>\` for every row, \`total <grand>\`, and \`widest row <r>\` for the row with the largest sum (the first on a tie), found on the main thread.

**Input:** \`t R C\`, then \`R\` lines of \`C\` integers.
**Output:** \`R + 2\` lines.

\`\`\`text
2 3 3
1 2 3
4 5 6
-1 -2 -3
\`\`\`
→
\`\`\`text
row 0: 6
row 1: 15
row 2: -6
total 15
widest row 1
\`\`\``,
          starter: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::size_t t, R, C;
    std::cin >> t >> R >> C;
    std::vector<std::vector<long long>> grid(R, std::vector<long long>(C));
    for (auto& row : grid) for (auto& x : row) std::cin >> x;
    const std::vector<std::vector<long long>>& input = grid;   // frozen from here on

    std::vector<long long> rowSums(R, 0);
    std::atomic<long long> grand{0};
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * R / t, hi = (i + 1) * R / t;
        // TODO: a thread that fills rowSums[lo, hi) and fetch_adds its chunk total into grand once
        (void)lo; (void)hi; (void)input;
    }
    // TODO: join, print the rows, the total and the widest row
    return 0;
}
`,
          solution: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::size_t t, R, C;
    std::cin >> t >> R >> C;
    std::vector<std::vector<long long>> grid(R, std::vector<long long>(C));
    for (auto& row : grid) for (auto& x : row) std::cin >> x;
    const std::vector<std::vector<long long>>& input = grid;   // frozen from here on

    std::vector<long long> rowSums(R, 0);
    std::atomic<long long> grand{0};
    std::vector<std::thread> workers;
    for (std::size_t i = 0; i < t; ++i) {
        const std::size_t lo = i * R / t, hi = (i + 1) * R / t;
        workers.emplace_back([&input, &rowSums, &grand, lo, hi] {
            long long chunkTotal = 0;
            for (std::size_t r = lo; r < hi; ++r) {
                long long s = 0;
                for (long long x : input[r]) s += x;
                rowSums[r] = s;
                chunkTotal += s;
            }
            grand.fetch_add(chunkTotal);
        });
    }
    for (auto& w : workers) w.join();

    std::size_t widest = 0;
    for (std::size_t r = 0; r < R; ++r) {
        std::cout << "row " << r << ": " << rowSums[r] << '\n';
        if (rowSums[r] > rowSums[widest]) widest = r;
    }
    std::cout << "total " << grand.load() << '\n';
    std::cout << "widest row " << widest << '\n';
    return 0;
}
`,
          hints: [
            "Reads of the const grid from every thread at once are safe; the only shared writes are rowSums (distinct slots) and grand (an atomic).",
            "Accumulate the chunk total in a local and call grand.fetch_add once after the row loop — one touch of the shared atomic per thread.",
            "Integer addition is associative, so grand is the same however the threads interleaved; the widest row is found by a plain scan after the join.",
          ],
          cases: [
            { stdin: "2 3 3\n1 2 3\n4 5 6\n-1 -2 -3\n", expected: "row 0: 6\nrow 1: 15\nrow 2: -6\ntotal 15\nwidest row 1\n" },
            { stdin: "4 1 2\n5 5\n", expected: "row 0: 10\ntotal 10\nwidest row 0\n" },
            { stdin: "3 2 1\n7\n7\n", expected: "row 0: 7\nrow 1: 7\ntotal 14\nwidest row 0\n", hidden: true },
            { stdin: "2 4 2\n1 1\n2 2\n3 3\n0 0\n", expected: "row 0: 2\nrow 1: 4\nrow 2: 6\nrow 3: 0\ntotal 12\nwidest row 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A thread pool's destructor sets `stopping_`, notifies, and its workers return as soon as they see the flag, even with tasks still queued. What do the callers holding those tasks' futures see?",
          options: ["The results, computed by the destructor", "`std::future_error` with `broken_promise` from `get()`, because the packaged tasks were destroyed uncalled", "Default values", "`get()` blocks forever"],
          answer: 1,
          explanation: "A destroyed `packaged_task` that was never invoked breaks its promise. The worker loop must return only when stopping *and* the queue is empty.",
        },
        {
          prompt: "A pool's worker runs each task while still holding the queue's mutex. What is the effect?",
          options: ["Tasks run faster because there is no contention", "Only one task runs at a time — a serial program with extra threads", "Tasks may run twice", "The queue becomes corrupted"],
          answer: 1,
          explanation: "The lock serialises everything inside it. Move the task out under the lock, release it, then call the task so other workers can take the next one.",
        },
        {
          prompt: "Why is the output of `for (auto& f : results) std::cout << f.get()` deterministic even though the pool's workers finish tasks in any order?",
          options: ["Because the pool has only one worker", "Because the futures are stored in submission order and each `get()` waits for its own task, so the merge order is fixed by the loop, not the scheduler", "Because `std::cout` sorts its output", "It is not deterministic"],
          answer: 1,
          explanation: "Completion order is scheduling-dependent; consumption order is the program's. Printing in index or submission order is the deterministic-output rule in practice.",
        },
        {
          prompt: "Why are contiguous chunks (`[i * n / t, (i + 1) * n / t)`) preferred over an interleaved split (`i, i + t, i + 2t, ...`) for a numeric loop?",
          options: ["Interleaving does not compile", "A contiguous chunk walks memory in order and keeps each thread in its own cache lines; interleaving makes threads share lines and slows them down", "Contiguous chunks are always equal in size", "Interleaved splits produce wrong sums"],
          answer: 1,
          explanation: "Both give correct results; the difference is cache behaviour. Adjacent elements sit in the same 64-byte line, and two cores writing the same line bounce it between them.",
        },
        {
          prompt: "Four threads each compute a partial sum of `double`s. How should the total be formed for a judged program?",
          options: ["Each thread `fetch_add`s its partial into a `std::atomic<double>`", "Each thread stores its partial in its own slot; the main thread adds the slots in index order after joining", "Each thread prints its partial", "Use `float` to avoid the problem"],
          answer: 1,
          explanation: "Floating-point addition is not associative, so a shared accumulator's result depends on arrival order. A fixed-order reduction on one thread gives identical bits on every run.",
        },
        {
          prompt: "Interview question: when would you choose `std::async` over `std::thread`?",
          options: ["Never; `std::async` is slower", "For a fixed set of independent computations whose values (or exceptions) you want back — no join to write, results through futures", "For a long-lived worker with a lifecycle, such as a consumer loop", "Only when there is exactly one core"],
          answer: 1,
          explanation: "`std::async` is a *result*; a thread is a *resource*. Pools, consumer loops and servers own threads; a batch of computations is collected from futures.",
        },
        {
          prompt: "Which rule prevents the deadlock where a callback invoked under your lock tries to lock something of its own?",
          options: ["Use `std::recursive_mutex` everywhere", "Never call code you do not control — a callback, a virtual function, a user comparator — while holding a lock", "Lock in alphabetical order", "Use `notify_all` before calling back"],
          answer: 1,
          explanation: "Unknown code may lock in any order and create the waiting cycle you cannot see. Copy what you need under the lock, release it, then call out.",
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
          title: "A prime census",
          prompt: `Read \`t\`, \`lo\` and \`hi\` and count the primes in the inclusive range \`[lo, hi]\` with \`t\` threads. Split the range into contiguous chunks with the chunk formula over \`n = hi - lo + 1\` numbers (chunk \`i\` covers \`[lo + i * n / t, lo + (i + 1) * n / t)\`). Each thread counts the primes in its chunk in a **local**, stores that partial in its own slot, and adds it into a \`std::atomic<long long> total\` with **one** \`fetch_add\`. After joining, print \`chunk <i>: [<a>, <b>) primes <p>\` for every chunk in index order, then \`total <count>\` read from the atomic. \`is_prime\` is given; \`lo\` is at least 1.

**Input:** \`t lo hi\`.
**Output:** \`t + 1\` lines.

\`\`\`text
2 1 20
\`\`\`
→
\`\`\`text
chunk 0: [1, 11) primes 4
chunk 1: [11, 21) primes 4
total 8
\`\`\``,
          starter: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

bool is_prime(long long x) {
    if (x < 2) return false;
    for (long long d = 2; d * d <= x; ++d) {
        if (x % d == 0) return false;
    }
    return true;
}

int main() {
    long long t, lo, hi;
    std::cin >> t >> lo >> hi;
    const long long n = hi - lo + 1;
    std::vector<long long> partial(t, 0);
    std::atomic<long long> total{0};
    std::vector<std::thread> workers;
    for (long long i = 0; i < t; ++i) {
        const long long a = lo + i * n / t, b = lo + (i + 1) * n / t;
        // TODO: a thread counting primes in [a, b) locally, storing partial[i], fetch_add once
        (void)a; (void)b;
    }
    // TODO: join, print each chunk and the total
    return 0;
}
`,
          solution: String.raw`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

bool is_prime(long long x) {
    if (x < 2) return false;
    for (long long d = 2; d * d <= x; ++d) {
        if (x % d == 0) return false;
    }
    return true;
}

int main() {
    long long t, lo, hi;
    std::cin >> t >> lo >> hi;
    const long long n = hi - lo + 1;
    std::vector<long long> partial(t, 0);
    std::atomic<long long> total{0};
    std::vector<std::thread> workers;
    for (long long i = 0; i < t; ++i) {
        const long long a = lo + i * n / t, b = lo + (i + 1) * n / t;
        workers.emplace_back([&partial, &total, i, a, b] {
            long long count = 0;
            for (long long x = a; x < b; ++x) {
                if (is_prime(x)) ++count;
            }
            partial[i] = count;
            total.fetch_add(count);
        });
    }
    for (auto& w : workers) w.join();
    for (long long i = 0; i < t; ++i) {
        const long long a = lo + i * n / t, b = lo + (i + 1) * n / t;
        std::cout << "chunk " << i << ": [" << a << ", " << b << ") primes " << partial[i] << '\n';
    }
    std::cout << "total " << total.load() << '\n';
    return 0;
}
`,
          hints: [
            "The chunk bounds are computed on the main thread from i, so recompute them the same way when printing.",
            "Count in a local; one fetch_add per thread keeps the shared atomic cold and the result identical whichever thread ran first.",
            "Both the slots and the atomic are read only after every join — the join is what makes the workers' writes visible.",
          ],
          cases: [
            { stdin: "2 1 20\n", expected: "chunk 0: [1, 11) primes 4\nchunk 1: [11, 21) primes 4\ntotal 8\n" },
            { stdin: "3 90 100\n", expected: "chunk 0: [90, 93) primes 0\nchunk 1: [93, 97) primes 0\nchunk 2: [97, 101) primes 1\ntotal 1\n" },
            { stdin: "1 2 2\n", expected: "chunk 0: [2, 3) primes 1\ntotal 1\n", hidden: true },
            { stdin: "4 1 100\n", expected: "chunk 0: [1, 26) primes 9\nchunk 1: [26, 51) primes 6\nchunk 2: [51, 76) primes 6\nchunk 3: [76, 101) primes 4\ntotal 25\n", hidden: true },
          ],
        },
        {
          title: "Divisions through std::async",
          prompt: `Read \`n\` pairs \`a b\`. Launch every division as its own \`std::async(std::launch::async, ...)\` task computing \`a / b\` (integer division) and throwing \`std::domain_error("division by zero")\` when \`b\` is 0. Keep the futures in a vector, then \`get()\` them in order inside a \`try\`: print \`task <i>: <quotient>\` or \`task <i>: error division by zero\` — the exception crossed the thread boundary through the future and is caught by \`const std::domain_error&\`. Finish with \`ok <k> failed <m>\`.

**Input:** \`n\`, then \`n\` lines \`a b\`.
**Output:** \`n + 1\` lines.

\`\`\`text
4
10 2
7 0
-9 4
0 5
\`\`\`
→
\`\`\`text
task 0: 5
task 1: error division by zero
task 2: -2
task 3: 0
ok 3 failed 1
\`\`\``,
          starter: String.raw`#include <future>
#include <iostream>
#include <stdexcept>
#include <vector>

long long divide(long long a, long long b) {
    // TODO: throw std::domain_error("division by zero") when b == 0
    return a / b;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<std::future<long long>> tasks;
    for (int i = 0; i < n; ++i) {
        long long a, b;
        std::cin >> a >> b;
        // TODO: tasks.push_back(std::async(std::launch::async, divide, a, b));
        (void)a; (void)b;
    }
    int ok = 0, failed = 0;
    // TODO: get() each in order; print the quotient or the error; count
    std::cout << "ok " << ok << " failed " << failed << '\n';
    return 0;
}
`,
          solution: String.raw`#include <future>
#include <iostream>
#include <stdexcept>
#include <vector>

long long divide(long long a, long long b) {
    if (b == 0) throw std::domain_error("division by zero");
    return a / b;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<std::future<long long>> tasks;
    for (int i = 0; i < n; ++i) {
        long long a, b;
        std::cin >> a >> b;
        tasks.push_back(std::async(std::launch::async, divide, a, b));
    }
    int ok = 0, failed = 0;
    for (int i = 0; i < n; ++i) {
        try {
            long long q = tasks[i].get();
            std::cout << "task " << i << ": " << q << '\n';
            ++ok;
        } catch (const std::domain_error& e) {
            std::cout << "task " << i << ": error " << e.what() << '\n';
            ++failed;
        }
    }
    std::cout << "ok " << ok << " failed " << failed << '\n';
    return 0;
}
`,
          hints: [
            "std::async copies a and b into the task exactly as std::thread would; the future's type is std::future<long long> because divide returns long long.",
            "The exception thrown inside the task is stored in the shared state and rethrown by get() on the main thread — that is the only place to catch it.",
            "Integer division in C++ truncates toward zero, so -9 / 4 is -2.",
          ],
          cases: [
            { stdin: "4\n10 2\n7 0\n-9 4\n0 5\n", expected: "task 0: 5\ntask 1: error division by zero\ntask 2: -2\ntask 3: 0\nok 3 failed 1\n" },
            { stdin: "1\n1 0\n", expected: "task 0: error division by zero\nok 0 failed 1\n" },
            { stdin: "3\n100 10\n100 -10\n1 1\n", expected: "task 0: 10\ntask 1: -10\ntask 2: 1\nok 3 failed 0\n", hidden: true },
            { stdin: "2\n0 0\n5 0\n", expected: "task 0: error division by zero\ntask 1: error division by zero\nok 0 failed 2\n", hidden: true },
          ],
        },
        {
          title: "A two-stage pipeline",
          prompt: `\`BoundedQueue\` is given, complete, from lesson 4. Build a pipeline of three stages over two queues of capacity 2. **Stage 1** (a thread) pushes the \`n\` input values into queue \`A\` in order, then closes \`A\`. **Stage 2** (a thread) pops from \`A\` until \`nullopt\`, keeps a running sum, pushes each prefix sum into queue \`B\`, and closes \`B\` when \`A\` is drained — closing must propagate, or stage 3 waits forever. **Stage 3** (the main thread) pops from \`B\` into a vector until \`nullopt\`. Join both threads, then print \`prefix <the sums, space-separated>\` and \`count <n>\`. Every queue is FIFO with one consumer, so the prefix sums come out in input order on every run.

**Input:** \`n\`, then \`n\` integers.
**Output:** two lines.

\`\`\`text
5
3 1 4 1 5
\`\`\`
→
\`\`\`text
prefix 3 4 8 9 14
count 5
\`\`\``,
          starter: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <thread>
#include <vector>

class BoundedQueue {
public:
    explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {}
    void push(long long v) {
        std::unique_lock<std::mutex> lock(m_);
        notFull_.wait(lock, [this] { return items_.size() < capacity_; });
        items_.push(v);
        lock.unlock();
        notEmpty_.notify_one();
    }
    std::optional<long long> pop() {
        std::unique_lock<std::mutex> lock(m_);
        notEmpty_.wait(lock, [this] { return !items_.empty() || closed_; });
        if (items_.empty()) return std::nullopt;
        long long v = items_.front();
        items_.pop();
        lock.unlock();
        notFull_.notify_one();
        return v;
    }
    void close() {
        {
            std::lock_guard<std::mutex> lock(m_);
            closed_ = true;
        }
        notEmpty_.notify_all();
    }
private:
    std::mutex m_;
    std::condition_variable notFull_;
    std::condition_variable notEmpty_;
    std::queue<long long> items_;
    std::size_t capacity_;
    bool closed_ = false;
};

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<long long> values(n);
    for (auto& v : values) std::cin >> v;

    BoundedQueue a(2), b(2);
    // TODO: stage 1 thread: push values into a, close a
    // TODO: stage 2 thread: pop from a, push running sums into b, close b
    std::vector<long long> prefix;
    // TODO: stage 3 here: pop from b into prefix until nullopt; join both threads

    std::cout << "prefix";
    for (long long p : prefix) std::cout << ' ' << p;
    std::cout << '\n';
    std::cout << "count " << prefix.size() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <thread>
#include <vector>

class BoundedQueue {
public:
    explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {}
    void push(long long v) {
        std::unique_lock<std::mutex> lock(m_);
        notFull_.wait(lock, [this] { return items_.size() < capacity_; });
        items_.push(v);
        lock.unlock();
        notEmpty_.notify_one();
    }
    std::optional<long long> pop() {
        std::unique_lock<std::mutex> lock(m_);
        notEmpty_.wait(lock, [this] { return !items_.empty() || closed_; });
        if (items_.empty()) return std::nullopt;
        long long v = items_.front();
        items_.pop();
        lock.unlock();
        notFull_.notify_one();
        return v;
    }
    void close() {
        {
            std::lock_guard<std::mutex> lock(m_);
            closed_ = true;
        }
        notEmpty_.notify_all();
    }
private:
    std::mutex m_;
    std::condition_variable notFull_;
    std::condition_variable notEmpty_;
    std::queue<long long> items_;
    std::size_t capacity_;
    bool closed_ = false;
};

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<long long> values(n);
    for (auto& v : values) std::cin >> v;

    BoundedQueue a(2), b(2);
    std::thread stage1([&a, &values] {
        for (long long v : values) a.push(v);
        a.close();
    });
    std::thread stage2([&a, &b] {
        long long running = 0;
        while (auto item = a.pop()) {
            running += *item;
            b.push(running);
        }
        b.close();
    });
    std::vector<long long> prefix;
    while (auto item = b.pop()) prefix.push_back(*item);
    stage1.join();
    stage2.join();

    std::cout << "prefix";
    for (long long p : prefix) std::cout << ' ' << p;
    std::cout << '\n';
    std::cout << "count " << prefix.size() << '\n';
    return 0;
}
`,
          hints: [
            "Each stage is a loop of the shape while (auto item = q.pop()) { ... } that ends on nullopt, followed by closing the next queue.",
            "Stage 2 must close b after a is drained — otherwise the main thread's pop on b never returns and the judge reports a timeout.",
            "Consume b on the main thread before joining: a join first would wait for stage 2, which is blocked pushing into a full b that nobody is draining.",
          ],
          cases: [
            { stdin: "5\n3 1 4 1 5\n", expected: "prefix 3 4 8 9 14\ncount 5\n" },
            { stdin: "1\n-7\n", expected: "prefix -7\ncount 1\n" },
            { stdin: "0\n", expected: "prefix\ncount 0\n", hidden: true },
            { stdin: "6\n1 1 1 1 1 1\n", expected: "prefix 1 2 3 4 5 6\ncount 6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens when a joinable `std::thread` is destroyed, and how does `std::jthread` differ?",
          options: ["Both join silently", "`std::thread` calls `std::terminate`; `std::jthread` requests a stop and joins in its destructor", "`std::thread` detaches; `std::jthread` terminates", "Both throw"],
          answer: 1,
          explanation: "The plain type refuses to guess and aborts the program; `std::jthread` was added so that scope exit, early return and exceptions all wait for the worker.",
        },
        {
          prompt: "Why is an unsynchronised `++counter` from two threads undefined behaviour rather than merely inaccurate?",
          options: ["Because `++` is not atomic on any hardware", "Because the standard defines two unordered accesses with a write as a data race, and a program with one has no defined meaning — the compiler may assume it cannot happen", "Because `int` is too small", "It is not undefined; it is only inaccurate"],
          answer: 1,
          explanation: "Losing increments is the visible symptom; the rule is stronger. The optimiser may keep the counter in a register for the whole loop, so a thread never sees the other's writes at all.",
        },
        {
          prompt: "When does an atomic replace a mutex, and when does it not?",
          options: ["Always; atomics are faster", "One variable, one operation: atomic. A compound update or an invariant across variables: mutex", "Never; atomics are only for flags", "Atomics replace mutexes only on x86-64"],
          answer: 1,
          explanation: "An atomic makes a single operation indivisible. A check-then-act, or two variables that must agree, needs a critical section.",
        },
        {
          prompt: "`compare_exchange_weak(expected, desired)` fails. What happened to `expected`, and why must the call sit in a loop?",
          options: ["`expected` is unchanged; the loop retries the same value", "`expected` now holds the atomic's current value; the loop decides again from it, and also absorbs the spurious failures the weak form permits", "`expected` was set to `desired`", "No loop is needed with the weak form"],
          answer: 1,
          explanation: "On failure the current value is written into `expected`, and the weak form may fail even when the values matched, so a loop is the only correct shape; `compare_exchange_strong` never fails spuriously.",
        },
        {
          prompt: "Why must `cv.wait` be given a predicate, and what is a lost wake-up?",
          options: ["The predicate is optional; a lost wake-up is a notify that arrived twice", "Spurious wake-ups make an unpredicated wait proceed on a false condition; a lost wake-up is a notify sent before the waiter waits, which is why the state changes under the mutex", "The predicate speeds up the wait; a lost wake-up is a crash", "The predicate replaces the mutex"],
          answer: 1,
          explanation: "The predicate form re-checks the state after every wake-up and, tested under the mutex, cannot miss a change that happened before the wait began.",
        },
        {
          prompt: "What does `std::future::get()` do with an exception thrown in the task?",
          options: ["Swallows it and returns a default value", "Rethrows it on the calling thread, with its dynamic type preserved", "Calls `std::terminate`", "Returns it as an error code"],
          answer: 1,
          explanation: "The library stores the exception in the shared state; `get()` rethrows it, so a `catch (const std::domain_error&)` at the `get()` matches exactly that type.",
        },
        {
          prompt: "Why does a judged program print only after every thread has been joined?",
          options: ["Because `std::cout` cannot be used while threads exist", "Because output written before or during the workers' run would depend on scheduling, and the join is also what makes the workers' writes visible to the main thread", "Because the judge kills threads that print", "Because printing is slow"],
          answer: 1,
          explanation: "Byte-for-byte comparison tolerates no interleaving. Threads compute into slots; the main thread joins them, then prints in a fixed order.",
        },
        {
          prompt: "```cpp\nfor (int i = 0; i < 4; ++i)\n    std::async(std::launch::async, work, i);\n```\nWhat is the problem?",
          options: ["`work` runs four times in parallel with no way to collect results", "Each temporary future's destructor blocks until its task finishes, so the four tasks run one after another", "The loop starts too many threads", "Nothing"],
          answer: 1,
          explanation: "Futures from `std::async` block in their destructors. Keep them in a vector to let the tasks overlap.",
        },
        {
          prompt: "A `std::vector<std::thread>` of eight workers is created, and a `std::vector<long long> partial` is `push_back`ed to from inside each worker. What is wrong?",
          options: ["Nothing; `push_back` is thread-safe", "Concurrent `push_back`s race on the vector's size and may reallocate its buffer under another thread — undefined behaviour; size the vector before the threads start and write to `partial[i]`", "Eight workers is too many", "`long long` cannot be shared"],
          answer: 1,
          explanation: "A container is not thread-safe for concurrent modification. Pre-sized slots give each thread its own memory and remove the need for a lock.",
        },
        {
          prompt: "`std::lock_guard<std::mutex>{m};` appears at the top of a critical section. What does it protect?",
          options: ["The whole block", "Nothing — the unnamed temporary is destroyed at the semicolon and the section runs unlocked", "Only the next statement", "The mutex itself"],
          answer: 1,
          explanation: "The guard must be a named local so its lifetime spans the block: `std::lock_guard<std::mutex> lock(m);`.",
        },
        {
          prompt: "A thread pool's `run()` loop returns as soon as `stopping_` is true, without checking the queue. What is the consequence?",
          options: ["Nothing; the destructor runs the remaining tasks", "Queued tasks are destroyed uncalled and their futures throw `broken_promise`", "Workers keep running after the destructor", "The mutex is never unlocked"],
          answer: 1,
          explanation: "The worker must return only when stopping *and* the queue is empty; a packaged task destroyed without being invoked breaks its promise.",
        },
        {
          prompt: "Which of these outputs may a judged concurrent program print?",
          options: ["`std::this_thread::get_id()` of the thread that finished first", "`std::thread::hardware_concurrency()`", "The sum of per-thread partials added in index order on the main thread", "The elapsed time of the parallel section"],
          answer: 2,
          explanation: "Ids, core counts and durations vary by machine and run; a fixed-order reduction of integer partials does not.",
        },
        {
          prompt: "Thread 1 locks `a.m` then `b.m`; thread 2 locks `b.m` then `a.m`. What can happen, and what is the fix?",
          options: ["Nothing can go wrong; mutexes are reentrant", "Each may hold one and wait for the other forever — deadlock; take both with `std::scoped_lock`, or lock in one fixed global order everywhere", "A data race; use atomics", "One thread is terminated"],
          answer: 1,
          explanation: "A cycle of waiting is a deadlock, and the judge reports it as a timeout. `std::scoped_lock(a.m, b.m)` acquires both without the cycle.",
        },
        {
          prompt: "In a bounded producer–consumer program, why is `close()` implemented as \"set the flag under the mutex, then `notify_all`\" rather than `notify_one`?",
          options: ["`notify_one` is slower", "Shutdown concerns every consumer; with `notify_one` only one wakes and the others sleep forever, and the program never exits", "`notify_all` also empties the queue", "`notify_one` cannot be called after `close()`"],
          answer: 1,
          explanation: "A change that every waiter must see needs `notify_all`. Each woken consumer re-checks the predicate, drains what remains, and returns `nullopt` when the queue is empty and closed.",
        },
      ],
    },
  ],
});

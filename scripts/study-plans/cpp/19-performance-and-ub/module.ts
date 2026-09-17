import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "performance-and-ub",
  title: "Performance and undefined behaviour",
  blurb: "The undefined-behaviour catalogue and the well-defined detectors for it, the cost model of copies, allocations and calls, cache lines, padding and traversal order, what -O2 does under the as-if rule, and how to measure without being lied to.",
  icon: "clock",
  overview: `Two questions decide whether a C++ program is trustworthy and whether it is fast, and they turn out to be the same question asked twice. The first is what the compiler is *allowed to assume*: the standard lists operations it imposes no requirements on — signed overflow, an index past the end, an uninitialised read, a dangling pointer, a data race — and in exchange the optimiser treats every one of them as unreachable and reasons backwards from that, which is why an overflow test written as \`x + 1 < x\` compiles to \`false\` and a null check after a dereference is deleted. The second is what the code you wrote *costs*: a \`std::vector\` passed by value is an allocation and a copy of every element, \`s = s + piece\` in a loop is quadratic, a column-major inner loop loads a cache line per element, and a struct declared \`char, double, char\` is a third larger than it needs to be. Neither the assumption nor the cost is visible in the source; both are predictable from rules this module makes explicit.

The five lessons move from the contract to the machine to the measurement. The catalogue names every common kind of undefined behaviour, shows how the optimiser turns each into a deleted check, and settles the detectors that are themselves well-defined: \`__builtin_add_overflow\` and its siblings, \`std::numeric_limits\` comparisons, an index checked as a signed value, and the sanitizers. The cost model counts what a copy, an allocation and a call are made of and applies the count to passing, returning, \`reserve\`, string building and views. Memory layout explains cache lines, why contiguity beats the complexity table, the padding rule and the row-major traversal rule. Compiler optimisation covers the levels, the as-if rule, inlining, constant folding, dead-code elimination and what is not worth doing by hand. Measuring takes a time with \`std::chrono::steady_clock\`, lists the six ways a microbenchmark lies, and orders the tools — \`time\`, \`perf\`, Valgrind, the sanitizers — into a loop.

Every exercise models performance by *counting* — operations, copies, allocations, cache-line loads, mispredictions, comparisons — and never by timing, because a duration on a shared judge is a coin toss and a count is a fact. You will write a checked-arithmetic evaluator and a bounds-checked array that report violations instead of committing them, an instrumented type that counts copies against moves for every way of passing it, your own growing \`Vec\` that reports allocations and element moves for a stated factor, a struct-padding calculator checked against the platform rule, an LRU line cache that compares the two traversal orders, a constant folder with dead-store elimination, a two-bit branch predictor over random and sorted data, a linear-against-binary search comparison counter and a benchmark-sample summariser. The checkpoint adds an overflow-safe statistics report over \`long long\`, an array-of-structs against struct-of-arrays cache-line audit built on the padding rule, and an operation counter that runs insertion sort and selection sort on the same input.`,
  lessons: [
    {
      slug: "the-ub-catalogue",
      file: "01-the-ub-catalogue.md",
      exercises: [
        {
          title: "A checked-arithmetic evaluator",
          prompt: `Evaluate \`int\` expressions without ever performing an operation that could overflow. Read \`n\`, then \`n\` lines of the form \`a op b\`, where \`op\` is one of \`+ - * / %\` and both operands fit in an \`int\`. Compute the result **in \`int\`** through the checked builtins — \`__builtin_add_overflow(a, b, &result)\`, \`__builtin_sub_overflow\` and \`__builtin_mul_overflow\` each store the result through their third argument and return \`true\` when it did not fit — and test the two dangerous division cases by hand before dividing: a zero divisor, and \`std::numeric_limits<int>::min()\` divided by \`-1\` (which also overflows for \`%\`).

Print \`a op b = result\`, or \`a op b = overflow\`, or \`a op b = division by zero\`. After the last line print \`flagged k of n\`, where \`k\` counts the lines that produced no result. The scaffold reads each operand into a \`long long\` and casts it to \`int\` — the operands fit, and \`-2147483648\` reads cleanly that way.

**Input:** \`n\`, then \`n\` lines \`a op b\` with the three tokens separated by spaces.
**Output:** \`n\` result lines, then the summary.

\`\`\`text
4
2147483647 + 1
100000 * 100000
-2147483648 - 1
7 / 2
\`\`\`
prints
\`\`\`text
2147483647 + 1 = overflow
100000 * 100000 = overflow
-2147483648 - 1 = overflow
7 / 2 = 3
flagged 3 of 4
\`\`\``,
          starter: String.raw`#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    int flagged = 0;
    for (int k = 0; k < n; ++k) {
        long long la, lb;
        char op;
        std::cin >> la >> op >> lb;
        const int a = static_cast<int>(la);
        const int b = static_cast<int>(lb);
        std::cout << a << ' ' << op << ' ' << b << " = ";
        // TODO: compute in int with the checked builtins; print the result,
        //       "overflow" or "division by zero", and count the flagged lines
        std::cout << '\n';
    }
    std::cout << "flagged " << flagged << " of " << n << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    int flagged = 0;
    for (int k = 0; k < n; ++k) {
        long long la, lb;
        char op;
        std::cin >> la >> op >> lb;
        const int a = static_cast<int>(la);
        const int b = static_cast<int>(lb);
        std::cout << a << ' ' << op << ' ' << b << " = ";
        int result = 0;
        bool bad = false;
        std::string why = "overflow";
        switch (op) {
            case '+': bad = __builtin_add_overflow(a, b, &result); break;
            case '-': bad = __builtin_sub_overflow(a, b, &result); break;
            case '*': bad = __builtin_mul_overflow(a, b, &result); break;
            case '/':
            case '%':
                // the only two divisions that are not defined: by zero, and min / -1
                if (b == 0) {
                    bad = true;
                    why = "division by zero";
                } else if (a == std::numeric_limits<int>::min() && b == -1) {
                    bad = true;
                } else {
                    result = op == '/' ? a / b : a % b;
                }
                break;
        }
        if (bad) {
            std::cout << why << '\n';
            ++flagged;
        } else {
            std::cout << result << '\n';
        }
    }
    std::cout << "flagged " << flagged << " of " << n << '\n';
    return 0;
}
`,
          hints: [
            "Each builtin returns true on overflow and leaves you a result to print otherwise; a switch on the operator keeps the five cases apart.",
            "Division cannot use a builtin: check `b == 0` first, then `a == std::numeric_limits<int>::min() && b == -1`, and only then divide.",
            "Count a line as flagged whenever you printed a word instead of a number — both overflow and division by zero.",
          ],
          cases: [
            { stdin: "4\n2147483647 + 1\n100000 * 100000\n-2147483648 - 1\n7 / 2\n", expected: "2147483647 + 1 = overflow\n100000 * 100000 = overflow\n-2147483648 - 1 = overflow\n7 / 2 = 3\nflagged 3 of 4\n" },
            { stdin: "3\n5 * 6\n-7 / 2\n-7 % 3\n", expected: "5 * 6 = 30\n-7 / 2 = -3\n-7 % 3 = -1\nflagged 0 of 3\n" },
            { stdin: "6\n-2147483648 / -1\n-2147483648 % -1\n5 / 0\n-2147483648 * -1\n46341 * 46341\n46340 * 46340\n", expected: "-2147483648 / -1 = overflow\n-2147483648 % -1 = overflow\n5 / 0 = division by zero\n-2147483648 * -1 = overflow\n46341 * 46341 = overflow\n46340 * 46340 = 2147395600\nflagged 5 of 6\n", hidden: true },
            { stdin: "1\n0 - 0\n", expected: "0 - 0 = 0\nflagged 0 of 1\n", hidden: true },
            { stdin: "5\n2147483647 - -1\n-2147483648 + -1\n-1 * -2147483648\n2147483647 + -2147483648\n9 % 0\n", expected: "2147483647 - -1 = overflow\n-2147483648 + -1 = overflow\n-1 * -2147483648 = overflow\n2147483647 + -2147483648 = -1\n9 % 0 = division by zero\nflagged 4 of 5\n", hidden: true },
          ],
        },
        {
          title: "A bounds-checked array",
          prompt: `Write \`Checked\`, a wrapper around a \`std::vector<int>\` that reports an out-of-range index instead of committing it. \`get(long long i)\` returns \`std::optional<int>\` — empty when \`i\` is not in \`[0, size())\` — and \`set(long long i, int value)\` returns \`false\` on the same test. The index parameter must be a **signed** \`long long\`: an index read from input can be negative or larger than any container, and both must be reported rather than converted to a \`std::size_t\` that happens to be huge. Only after the check may you cast the index to \`std::size_t\` and subscript.

\`main\` reads \`n\` and \`n\` integers into the wrapper, then \`q\` commands: \`get i\` prints \`a[i] = value\` or \`a[i] out of range\`; \`set i v\` prints \`a[i] <- v\` or \`a[i] out of range\`. After the commands print \`violations k\` (the out-of-range count) and \`final:\` followed by the elements, one space before each.

**Input:** \`n\`, then \`n\` integers, then \`q\`, then \`q\` commands.
**Output:** one line per command, then the two summary lines.

\`\`\`text
3
10 20 30
5
get 0
get 3
set 1 99
get -1
get 1
\`\`\`
prints
\`\`\`text
a[0] = 10
a[3] out of range
a[1] <- 99
a[-1] out of range
a[1] = 99
violations 2
final: 10 99 30
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <optional>
#include <string>
#include <utility>
#include <vector>

class Checked {
public:
    explicit Checked(std::vector<int> values) : data_(std::move(values)) {}

    std::optional<int> get(long long i) const {
        // TODO: std::nullopt when i is out of range, else the element
        (void)i;
        return std::nullopt;
    }

    bool set(long long i, int value) {
        // TODO: false when i is out of range, else store and return true
        (void)i;
        (void)value;
        return false;
    }

    const std::vector<int>& data() const { return data_; }

private:
    // TODO: a signed range test: 0 <= i < size(), comparing as long long
    std::vector<int> data_;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(static_cast<std::size_t>(n));
    for (int& x : values) std::cin >> x;
    Checked a(std::move(values));

    int q;
    std::cin >> q;
    int violations = 0;
    for (int k = 0; k < q; ++k) {
        std::string cmd;
        long long i;
        std::cin >> cmd >> i;
        // TODO: get / set, printing the line and counting violations
    }
    std::cout << "violations " << violations << '\n';
    std::cout << "final:";
    for (int x : a.data()) std::cout << ' ' << x;
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <optional>
#include <string>
#include <utility>
#include <vector>

class Checked {
public:
    explicit Checked(std::vector<int> values) : data_(std::move(values)) {}

    std::optional<int> get(long long i) const {
        if (!inRange(i)) return std::nullopt;
        return data_[static_cast<std::size_t>(i)];
    }

    bool set(long long i, int value) {
        if (!inRange(i)) return false;
        data_[static_cast<std::size_t>(i)] = value;
        return true;
    }

    const std::vector<int>& data() const { return data_; }

private:
    // signed on both sides: a negative i is rejected here, never converted
    bool inRange(long long i) const {
        return i >= 0 && i < static_cast<long long>(data_.size());
    }
    std::vector<int> data_;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(static_cast<std::size_t>(n));
    for (int& x : values) std::cin >> x;
    Checked a(std::move(values));

    int q;
    std::cin >> q;
    int violations = 0;
    for (int k = 0; k < q; ++k) {
        std::string cmd;
        long long i;
        std::cin >> cmd >> i;
        if (cmd == "get") {
            if (const auto x = a.get(i)) {
                std::cout << "a[" << i << "] = " << *x << '\n';
            } else {
                std::cout << "a[" << i << "] out of range\n";
                ++violations;
            }
        } else {
            int value;
            std::cin >> value;
            if (a.set(i, value)) {
                std::cout << "a[" << i << "] <- " << value << '\n';
            } else {
                std::cout << "a[" << i << "] out of range\n";
                ++violations;
            }
        }
    }
    std::cout << "violations " << violations << '\n';
    std::cout << "final:";
    for (int x : a.data()) std::cout << ' ' << x;
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "One private `inRange(long long i)` used by both members keeps the test in one place: `i >= 0 && i < static_cast<long long>(data_.size())`.",
            "Comparing a `long long` with `size()` directly would convert the signed side to unsigned — cast the size to `long long` instead.",
            "`if (const auto x = a.get(i))` tests the optional and binds it in one line; `*x` is the value.",
          ],
          cases: [
            { stdin: "3\n10 20 30\n5\nget 0\nget 3\nset 1 99\nget -1\nget 1\n", expected: "a[0] = 10\na[3] out of range\na[1] <- 99\na[-1] out of range\na[1] = 99\nviolations 2\nfinal: 10 99 30\n" },
            { stdin: "1\n7\n4\nget 1\nget 0\nset 0 -7\nget 0\n", expected: "a[1] out of range\na[0] = 7\na[0] <- -7\na[0] = -7\nviolations 1\nfinal: -7\n" },
            { stdin: "0\n\n2\nget 0\nset 0 1\n", expected: "a[0] out of range\na[0] out of range\nviolations 2\nfinal:\n", hidden: true },
            { stdin: "2\n5 6\n4\nget 4294967296\nget 9223372036854775807\nset 2147483648 5\nget -9223372036854775808\n", expected: "a[4294967296] out of range\na[9223372036854775807] out of range\na[2147483648] out of range\na[-9223372036854775808] out of range\nviolations 4\nfinal: 5 6\n", hidden: true },
            { stdin: "4\n1 2 3 4\n4\nset 3 40\nset 0 10\nget 3\nget 2\n", expected: "a[3] <- 40\na[0] <- 10\na[3] = 40\na[2] = 3\nviolations 0\nfinal: 10 2 3 40\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is true of this function?\n\n```cpp\nbool willOverflow(int x) {\n    return x + 1 < x;\n}\n```",
          options: ["It reliably returns `true` for `INT_MAX`", "It has undefined behaviour for `INT_MAX`, and at `-O2` GCC and Clang compile it to `return false`", "It is well-defined because the comparison happens before the addition overflows", "It compiles only with `-fwrapv`"],
          answer: 1,
          explanation: "`x + 1` overflows for `INT_MAX`, and signed overflow is undefined; the optimiser assumes it cannot happen, so `x + 1 < x` is provably false and the function becomes `return false`. The test must be phrased in defined terms — `x == std::numeric_limits<int>::max()` or `__builtin_add_overflow` — before the operation.",
        },
        {
          prompt: "Which of these is NOT undefined behaviour?",
          options: ["`int i = INT_MAX; i + 1`", "`unsigned int u = 0; u - 1`", "`1 << 32` in an `int`", "`int x; std::cout << x;`"],
          answer: 1,
          explanation: "Unsigned arithmetic wraps modulo 2ⁿ by definition, so `0u - 1` is `4294967295`. Signed overflow, a shift by at least the width, and reading an indeterminate value are all on the catalogue.",
        },
        {
          prompt: "`sizeof(int)` is 4 on this platform and could be something else on another. Which category does the standard put that in?",
          options: ["Implementation-defined — the implementation chooses and documents", "Unspecified — any of several outcomes, not necessarily consistent", "Undefined — no requirements at all", "Ill-formed — it should not compile"],
          answer: 0,
          explanation: "The implementation must choose a size and document it, which is implementation-defined. Unspecified is for things like argument evaluation order; undefined is the correctness concern, not a portability one.",
        },
        {
          prompt: "In C++20, what is `f(i++, i++)`?",
          options: ["Undefined behaviour, as in every standard", "Well-defined: the arguments are evaluated left to right", "Well-defined but unspecified: the two argument evaluations are indeterminately sequenced, so which value each receives depends on the compiler", "A compile error"],
          answer: 2,
          explanation: "C++17 made function arguments indeterminately sequenced with respect to each other, so the two increments no longer overlap and the program has a meaning — just not a portable one. `i++ + i++` in one expression remains unsequenced and undefined. Neither is code to write.",
        },
        {
          prompt: "Which test detects overflow of `a + b` for `int` operands without itself invoking undefined behaviour?",
          options: ["`if (a + b < a)`", "`if (static_cast<long long>(a + b) > INT_MAX)`", "`if (b > 0 && a > std::numeric_limits<int>::max() - b)`", "`try { a + b; } catch (const std::overflow_error&)`"],
          answer: 2,
          explanation: "Every comparison in the third option is on values that fit: `max - b` cannot overflow when `b > 0`. The first two compute `a + b` in `int` first, which is the overflow they meant to detect; C++ never throws on integer overflow.",
        },
        {
          prompt: "What does this do?\n\n```cpp\nstd::vector<int> v{1, 2, 3};\nfor (std::size_t i = v.size() - 1; i >= 0; --i) std::cout << v[i];\n```",
          options: ["Prints `321`", "Prints `321`, then `i` wraps to a huge value and `v[i]` reads out of range — undefined behaviour", "Compile error: `i >= 0` is ill-formed for an unsigned type", "Prints `123`"],
          answer: 1,
          explanation: "`i >= 0` is always true for `std::size_t`, so after printing `v[0]` the decrement wraps to `SIZE_MAX` and the next subscript is out of bounds. `-Wextra` warns that the comparison is always true; a signed index or a `while (i-- > 0)` loop fixes it.",
        },
        {
          prompt: "A solution has undefined behaviour but prints the right answer on your machine. What is guaranteed when the judge runs it at `-O2` on Clang?",
          options: ["The same output — undefined behaviour is deterministic for a given input", "Nothing — the program has no meaning, and a different compiler, level or flags may print anything", "A runtime error, because the judge runs UBSan", "A compile error"],
          answer: 1,
          explanation: "Undefined behaviour is not a value the compiler picks consistently; it is the absence of requirements, and every optimiser exploits it differently. The judge compiles with `-O2` and no sanitizer, which is exactly why nothing in the track relies on it.",
        },
      ],
    },
    {
      slug: "the-cost-model",
      file: "02-the-cost-model.md",
      exercises: [
        {
          title: "Counting copies and moves",
          prompt: `Instrument a type so that every way of passing it reports what it cost. \`Payload\` owns a \`std::vector<int>\` and keeps two \`static inline long long\` counters, \`copies\` and \`moves\`; write its copy constructor and its \`noexcept\` move constructor so each increments its counter. Three functions take it: \`takeByValue(Payload)\`, \`takeByRef(const Payload&)\`, and a \`Store\` whose \`add(Payload p)\` is a **sink** — it \`push_back\`s \`std::move(p)\` into its vector. \`makeTemp()\` returns \`Payload{}\`.

\`main\` reads \`n\` commands and applies each to one long-lived \`item\` (a moved-from \`item\` stays valid; only the counts matter). Before the loop, \`reserve(n)\` the store's vector so that growth never moves an element. After each command print \`<command> copies=<c> moves=<m>\` with the counts that command alone added, and at the end \`total copies=<C> moves=<M>\`.

| Command | Does |
| --- | --- |
| \`value\` | \`takeByValue(item)\` |
| \`ref\` | \`takeByRef(item)\` |
| \`temp\` | \`takeByValue(Payload{})\` |
| \`sink-copy\` | \`store.add(item)\` |
| \`sink-move\` | \`store.add(std::move(item))\` |
| \`sink-temp\` | \`store.add(Payload{})\` |
| \`make\` | \`Payload made = makeTemp();\` |

**Input:** \`n\`, then \`n\` command words.
**Output:** \`n\` lines, then the total line.

\`\`\`text
5
value
ref
temp
sink-copy
sink-move
\`\`\`
prints
\`\`\`text
value copies=1 moves=0
ref copies=0 moves=0
temp copies=0 moves=0
sink-copy copies=1 moves=1
sink-move copies=0 moves=2
total copies=2 moves=3
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Payload {
    std::vector<int> data;
    static inline long long copies = 0;
    static inline long long moves = 0;

    Payload() : data(16, 1) {}
    // TODO: a copy constructor that copies data and counts a copy
    // TODO: a noexcept move constructor that moves data and counts a move
};

void takeByValue(Payload) {}
void takeByRef(const Payload&) {}
Payload makeTemp() { return Payload{}; }

struct Store {
    std::vector<Payload> items;
    void add(Payload p) {
        // TODO: move p into items
        (void)p;
    }
};

int main() {
    int n;
    std::cin >> n;
    Store store;
    // TODO: reserve room for n items so growth never moves an element
    Payload item;
    for (int k = 0; k < n; ++k) {
        std::string cmd;
        std::cin >> cmd;
        const long long c0 = Payload::copies;
        const long long m0 = Payload::moves;
        // TODO: dispatch the seven commands
        std::cout << cmd << " copies=" << (Payload::copies - c0)
                  << " moves=" << (Payload::moves - m0) << '\n';
    }
    std::cout << "total copies=" << Payload::copies << " moves=" << Payload::moves << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Payload {
    std::vector<int> data;
    static inline long long copies = 0;
    static inline long long moves = 0;

    Payload() : data(16, 1) {}
    Payload(const Payload& other) : data(other.data) { ++copies; }
    Payload(Payload&& other) noexcept : data(std::move(other.data)) { ++moves; }
};

void takeByValue(Payload) {}
void takeByRef(const Payload&) {}
Payload makeTemp() { return Payload{}; }

struct Store {
    std::vector<Payload> items;
    void add(Payload p) { items.push_back(std::move(p)); }
};

int main() {
    int n;
    std::cin >> n;
    Store store;
    store.items.reserve(static_cast<std::size_t>(n));   // growth must never move an element
    Payload item;
    for (int k = 0; k < n; ++k) {
        std::string cmd;
        std::cin >> cmd;
        const long long c0 = Payload::copies;
        const long long m0 = Payload::moves;
        if (cmd == "value") takeByValue(item);
        else if (cmd == "ref") takeByRef(item);
        else if (cmd == "temp") takeByValue(Payload{});
        else if (cmd == "sink-copy") store.add(item);
        else if (cmd == "sink-move") store.add(std::move(item));
        else if (cmd == "sink-temp") store.add(Payload{});
        else if (cmd == "make") { [[maybe_unused]] Payload made = makeTemp(); }
        std::cout << cmd << " copies=" << (Payload::copies - c0)
                  << " moves=" << (Payload::moves - m0) << '\n';
    }
    std::cout << "total copies=" << Payload::copies << " moves=" << Payload::moves << '\n';
    return 0;
}
`,
          hints: [
            "The copy constructor is `Payload(const Payload& o) : data(o.data) { ++copies; }`; the move constructor takes `Payload&&`, moves `o.data`, and must be `noexcept`.",
            "A prvalue argument to a by-value parameter is constructed in place (C++17), so `temp` and `make` add nothing; the sink then moves the parameter into the vector once.",
            "Without `reserve`, the vector's own reallocations would move elements and the `sink-move` counts would drift — reserve before the loop.",
          ],
          cases: [
            { stdin: "5\nvalue\nref\ntemp\nsink-copy\nsink-move\n", expected: "value copies=1 moves=0\nref copies=0 moves=0\ntemp copies=0 moves=0\nsink-copy copies=1 moves=1\nsink-move copies=0 moves=2\ntotal copies=2 moves=3\n" },
            { stdin: "3\nsink-temp\nmake\nvalue\n", expected: "sink-temp copies=0 moves=1\nmake copies=0 moves=0\nvalue copies=1 moves=0\ntotal copies=1 moves=1\n" },
            { stdin: "0\n", expected: "total copies=0 moves=0\n", hidden: true },
            { stdin: "4\nsink-move\nsink-move\nsink-move\nsink-move\n", expected: "sink-move copies=0 moves=2\nsink-move copies=0 moves=2\nsink-move copies=0 moves=2\nsink-move copies=0 moves=2\ntotal copies=0 moves=8\n", hidden: true },
            { stdin: "7\nref\nref\nsink-copy\nsink-copy\ntemp\nmake\nsink-temp\n", expected: "ref copies=0 moves=0\nref copies=0 moves=0\nsink-copy copies=1 moves=1\nsink-copy copies=1 moves=1\ntemp copies=0 moves=0\nmake copies=0 moves=0\nsink-temp copies=0 moves=1\ntotal copies=2 moves=3\n", hidden: true },
          ],
        },
        {
          title: "A Vec that reports its growth",
          prompt: `Model geometric growth with your own container, never by reading \`std::vector::capacity()\`. \`Vec\` holds \`long long\` elements in a \`std::unique_ptr<long long[]>\` with \`size\`, \`capacity\` and an integer growth \`factor\` given at construction. \`reserve(want)\` does nothing when \`want <= capacity\`; otherwise it allocates a block of exactly \`want\`, copies the \`size\` existing elements across (count each as one **move**), counts one **allocation**, and adopts the block. \`push_back(x)\` calls \`reserve(capacity == 0 ? 1 : capacity * factor)\` when full, then stores.

Read \`k\` scenarios, each \`factor pushes reserve\`: construct a \`Vec\` with the factor, call \`reserve(reserve)\` first (a reserve of 0 does nothing), then push \`1, 2, …, pushes\`. Print one line per scenario: \`factor=F pushes=N reserve=R: allocations A moves M capacity C sum S\`, where \`S\` is the sum of the stored elements read back through \`operator[]\`.

**Input:** \`k\`, then \`k\` lines \`factor pushes reserve\` (factor ≥ 2).
**Output:** \`k\` lines.

\`\`\`text
3
2 10 0
2 100 0
2 1000 0
\`\`\`
prints
\`\`\`text
factor=2 pushes=10 reserve=0: allocations 5 moves 15 capacity 16 sum 55
factor=2 pushes=100 reserve=0: allocations 8 moves 127 capacity 128 sum 5050
factor=2 pushes=1000 reserve=0: allocations 11 moves 1023 capacity 1024 sum 500500
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <utility>

class Vec {
public:
    explicit Vec(std::size_t factor) : factor_(factor) {}

    void reserve(std::size_t want) {
        // TODO: nothing when want <= capacity_; else allocate exactly want,
        //       copy size_ elements across (moves_ += size_), ++allocations_
        (void)want;
    }

    void push_back(long long value) {
        // TODO: grow by factor_ when full (an empty Vec grows to 1), then store
        (void)value;
    }

    std::size_t size() const { return size_; }
    std::size_t capacity() const { return capacity_; }
    long long allocations() const { return allocations_; }
    long long moves() const { return moves_; }
    long long operator[](std::size_t i) const { return data_[i]; }

private:
    std::size_t factor_;
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
    long long allocations_ = 0;
    long long moves_ = 0;
    std::unique_ptr<long long[]> data_;
};

int main() {
    int k;
    std::cin >> k;
    for (int t = 0; t < k; ++t) {
        std::size_t factor, pushes, reserve;
        std::cin >> factor >> pushes >> reserve;
        Vec v(factor);
        // TODO: reserve, push 1..pushes, sum the elements back, print the line
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <utility>

class Vec {
public:
    explicit Vec(std::size_t factor) : factor_(factor) {}

    void reserve(std::size_t want) {
        if (want <= capacity_) return;
        auto fresh = std::make_unique<long long[]>(want);
        for (std::size_t i = 0; i < size_; ++i) fresh[i] = data_[i];
        moves_ += static_cast<long long>(size_);
        ++allocations_;
        data_ = std::move(fresh);   // the old block is freed here
        capacity_ = want;
    }

    void push_back(long long value) {
        if (size_ == capacity_) reserve(capacity_ == 0 ? 1 : capacity_ * factor_);
        data_[size_++] = value;
    }

    std::size_t size() const { return size_; }
    std::size_t capacity() const { return capacity_; }
    long long allocations() const { return allocations_; }
    long long moves() const { return moves_; }
    long long operator[](std::size_t i) const { return data_[i]; }

private:
    std::size_t factor_;
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
    long long allocations_ = 0;
    long long moves_ = 0;
    std::unique_ptr<long long[]> data_;
};

int main() {
    int k;
    std::cin >> k;
    for (int t = 0; t < k; ++t) {
        std::size_t factor, pushes, reserve;
        std::cin >> factor >> pushes >> reserve;
        Vec v(factor);
        v.reserve(reserve);
        for (std::size_t i = 1; i <= pushes; ++i) v.push_back(static_cast<long long>(i));
        long long sum = 0;
        for (std::size_t i = 0; i < v.size(); ++i) sum += v[i];
        std::cout << "factor=" << factor << " pushes=" << pushes << " reserve=" << reserve
                  << ": allocations " << v.allocations() << " moves " << v.moves()
                  << " capacity " << v.capacity() << " sum " << sum << '\n';
    }
    return 0;
}
`,
          hints: [
            "`std::make_unique<long long[]>(want)` allocates the new block; assigning it to `data_` frees the old one.",
            "Copy the elements before swapping the blocks, and count `size_` moves and one allocation per reallocation — `reserve(0)` on an empty Vec must count nothing.",
            "The doubling table from the lesson is your check: 10 pushes are 5 allocations and 15 moves, ending at capacity 16.",
          ],
          cases: [
            { stdin: "3\n2 10 0\n2 100 0\n2 1000 0\n", expected: "factor=2 pushes=10 reserve=0: allocations 5 moves 15 capacity 16 sum 55\nfactor=2 pushes=100 reserve=0: allocations 8 moves 127 capacity 128 sum 5050\nfactor=2 pushes=1000 reserve=0: allocations 11 moves 1023 capacity 1024 sum 500500\n" },
            { stdin: "2\n2 1000 1000\n2 1000 600\n", expected: "factor=2 pushes=1000 reserve=1000: allocations 1 moves 0 capacity 1000 sum 500500\nfactor=2 pushes=1000 reserve=600: allocations 2 moves 600 capacity 1200 sum 500500\n" },
            { stdin: "2\n3 10 0\n4 100 0\n", expected: "factor=3 pushes=10 reserve=0: allocations 4 moves 13 capacity 27 sum 55\nfactor=4 pushes=100 reserve=0: allocations 5 moves 85 capacity 256 sum 5050\n", hidden: true },
            { stdin: "2\n2 0 0\n2 0 5\n", expected: "factor=2 pushes=0 reserve=0: allocations 0 moves 0 capacity 0 sum 0\nfactor=2 pushes=0 reserve=5: allocations 1 moves 0 capacity 5 sum 0\n", hidden: true },
            { stdin: "3\n2 1 0\n2 17 16\n3 5 1\n", expected: "factor=2 pushes=1 reserve=0: allocations 1 moves 0 capacity 1 sum 1\nfactor=2 pushes=17 reserve=16: allocations 2 moves 16 capacity 32 sum 153\nfactor=3 pushes=5 reserve=1: allocations 3 moves 4 capacity 9 sum 15\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A function declared `long long total(std::vector<int> v)` only reads `v`. Called with a million-element vector, what does the call cost?",
          options: ["Nothing extra — the compiler passes a reference behind the scenes", "One allocation and a million element copies", "Three pointer copies — the vector's handle", "One move, because the argument is an rvalue"],
          answer: 1,
          explanation: "By value means a copy, and a copy of an owning type is an allocation plus a copy of everything it owns. The handle is three pointers, but the handle is not what is copied; an lvalue argument is never moved implicitly. `const std::vector<int>&` costs one pointer.",
        },
        {
          prompt: "`store` has spare capacity. How many copies and moves does this perform?\n\n```cpp\nvoid sink(Payload p) { store.push_back(std::move(p)); }\nPayload item;\nsink(std::move(item));\n```",
          options: ["0 copies, 2 moves", "1 copy, 1 move", "0 copies, 1 move", "1 copy, 0 moves"],
          answer: 0,
          explanation: "`std::move(item)` move-constructs the parameter (one), and `std::move(p)` moves it into the vector (two). Without the outer `std::move` the parameter would be a copy; with spare capacity the vector moves nothing else.",
        },
        {
          prompt: "Same `sink` as above. How many copies and moves does `sink(Payload{})` perform?",
          options: ["0 copies, 2 moves", "0 copies, 1 move", "1 copy, 1 move", "0 copies, 0 moves"],
          answer: 1,
          explanation: "C++17 guarantees the parameter is constructed directly from the prvalue — no copy, no move — and then the sink moves it into the vector once. The temporary costs nothing on the way in.",
        },
        {
          prompt: "A `std::vector` grows by doubling. Pushing 1 000 elements into an empty one costs how many allocations and element moves?",
          options: ["1 000 allocations, 0 moves", "10 allocations, 1 000 moves", "11 allocations, 1 023 moves", "1 allocation, 0 moves"],
          answer: 2,
          explanation: "Capacities 1, 2, 4, …, 1 024 are eleven allocations, and every reallocation moves the elements it holds: 1 + 2 + … + 512 = 1 023. `reserve(1000)` first is the last option — one allocation and nothing moved.",
        },
        {
          prompt: "Which of these builds a string from `k` pieces in quadratic time?",
          options: ["`out += piece` in a loop", "`out.append(piece)` in a loop", "`out = out + piece` in a loop", "`std::ostringstream` with `<<` in a loop"],
          answer: 2,
          explanation: "`out + piece` builds a fresh temporary holding everything so far, so the i-th iteration copies i pieces and the total is quadratic. `+=`, `append` and a stream append into spare capacity and grow geometrically — amortised linear.",
        },
        {
          prompt: "`result` is a local `std::vector<int>`. What is the difference between `return result;` and `return std::move(result);`?",
          options: ["None — both move", "`std::move` is faster because it forces the move", "`return result;` copies; `std::move` is required to avoid the copy", "`return result;` is elided (NRVO) or moved as a last resort; `std::move` disables elision and forces the move — a pessimisation"],
          answer: 3,
          explanation: "A named local returned by value is elided by every compiler through NRVO, and moved when elision is impossible. Wrapping it in `std::move` turns the operand into an xvalue that cannot be elided, so you pay the move you were trying to avoid.",
        },
        {
          prompt: "A function reads a large `std::string` and a 16-byte `Point` of two doubles, modifying neither. Which parameter types does the cost model recommend?",
          options: ["`const std::string&` and `Point` by value", "Both by value", "Both by `const&`", "`std::string` by value and `const Point&`"],
          answer: 0,
          explanation: "The string may own heap memory, so `const&` binds a name for one pointer's worth of cost. A `Point` of two doubles is a register-sized trivially copyable value; a reference would add an indirection to something cheaper than the pointer.",
        },
      ],
    },
    {
      slug: "memory-layout-and-cache",
      file: "03-memory-layout-and-cache.md",
      exercises: [
        {
          title: "A struct-padding calculator",
          prompt: `Compute a struct's layout from the platform rule rather than by printing \`sizeof\`. Members are given as type names in declaration order, each with the size and alignment of this platform: \`char\` and \`bool\` 1, \`short\` 2, \`int\` and \`float\` 4, \`long\`, \`double\` and \`ptr\` 8. A member is placed at the next offset that is a multiple of its alignment; the struct's alignment is its largest member alignment; its size is the end of the last member rounded up to a multiple of that alignment; padding is size minus the sum of the member sizes.

Read \`k\` structs, each a line \`m t1 … tm\`. For each print \`struct i: offsets o1 … om | size S align A padding P | reordered size S2 padding P2\`, where the reordered figures come from laying out the same members sorted by **descending size** (a stable sort — equal sizes keep their order).

**Input:** \`k\`, then \`k\` lines, each a count followed by that many type names.
**Output:** \`k\` lines.

\`\`\`text
2
3 char int char
3 int char char
\`\`\`
prints
\`\`\`text
struct 1: offsets 0 4 8 | size 12 align 4 padding 6 | reordered size 8 padding 2
struct 2: offsets 0 4 5 | size 8 align 4 padding 2 | reordered size 8 padding 2
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <functional>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Layout {
    std::vector<std::size_t> offsets;
    std::size_t size = 0;
    std::size_t align = 1;
    std::size_t padding = 0;
};

Layout layout(const std::vector<std::size_t>& sizes) {
    Layout l;
    // TODO: place each member at the next multiple of its size, track the
    //       largest alignment, round the end up, and compute the padding
    (void)sizes;
    return l;
}

int main() {
    const std::map<std::string, std::size_t> width{
        {"char", 1}, {"bool", 1}, {"short", 2}, {"int", 4},
        {"float", 4}, {"long", 8}, {"double", 8}, {"ptr", 8},
    };
    int k;
    std::cin >> k;
    for (int t = 1; t <= k; ++t) {
        int m;
        std::cin >> m;
        std::vector<std::size_t> sizes;
        for (int i = 0; i < m; ++i) {
            std::string type;
            std::cin >> type;
            sizes.push_back(width.at(type));
        }
        // TODO: lay out the declared order and the descending-size order, print the line
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <functional>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Layout {
    std::vector<std::size_t> offsets;
    std::size_t size = 0;
    std::size_t align = 1;
    std::size_t padding = 0;
};

// Every member aligns to its own size (the platform rule for fundamental
// types), and the struct rounds up to its largest member alignment so that
// arrays of it keep every element aligned.
Layout layout(const std::vector<std::size_t>& sizes) {
    Layout l;
    std::size_t at = 0;
    std::size_t payload = 0;
    for (std::size_t s : sizes) {
        at = (at + s - 1) / s * s;
        l.offsets.push_back(at);
        at += s;
        payload += s;
        l.align = std::max(l.align, s);
    }
    l.size = (at + l.align - 1) / l.align * l.align;
    l.padding = l.size - payload;
    return l;
}

int main() {
    const std::map<std::string, std::size_t> width{
        {"char", 1}, {"bool", 1}, {"short", 2}, {"int", 4},
        {"float", 4}, {"long", 8}, {"double", 8}, {"ptr", 8},
    };
    int k;
    std::cin >> k;
    for (int t = 1; t <= k; ++t) {
        int m;
        std::cin >> m;
        std::vector<std::size_t> sizes;
        for (int i = 0; i < m; ++i) {
            std::string type;
            std::cin >> type;
            sizes.push_back(width.at(type));
        }
        const Layout declared = layout(sizes);
        std::vector<std::size_t> sorted = sizes;
        std::stable_sort(sorted.begin(), sorted.end(), std::greater<>{});
        const Layout reordered = layout(sorted);

        std::cout << "struct " << t << ": offsets";
        for (std::size_t off : declared.offsets) std::cout << ' ' << off;
        std::cout << " | size " << declared.size << " align " << declared.align
                  << " padding " << declared.padding
                  << " | reordered size " << reordered.size
                  << " padding " << reordered.padding << '\n';
    }
    return 0;
}
`,
          hints: [
            "Rounding `at` up to a multiple of `s` is `(at + s - 1) / s * s`; apply the same formula with the struct's alignment for the final size.",
            "Keep a running sum of the member sizes: padding is the final size minus that sum, which covers both interior and tail padding.",
            "`std::stable_sort` with `std::greater<>{}` gives the descending order; run the same `layout` on it for the reordered figures.",
          ],
          cases: [
            { stdin: "2\n3 char int char\n3 int char char\n", expected: "struct 1: offsets 0 4 8 | size 12 align 4 padding 6 | reordered size 8 padding 2\nstruct 2: offsets 0 4 5 | size 8 align 4 padding 2 | reordered size 8 padding 2\n" },
            { stdin: "1\n3 char double char\n", expected: "struct 1: offsets 0 8 16 | size 24 align 8 padding 14 | reordered size 16 padding 6\n" },
            { stdin: "2\n1 bool\n2 short short\n", expected: "struct 1: offsets 0 | size 1 align 1 padding 0 | reordered size 1 padding 0\nstruct 2: offsets 0 2 | size 4 align 2 padding 0 | reordered size 4 padding 0\n", hidden: true },
            { stdin: "1\n4 double double double float\n", expected: "struct 1: offsets 0 8 16 24 | size 32 align 8 padding 4 | reordered size 32 padding 4\n", hidden: true },
            { stdin: "2\n6 bool ptr short char int long\n5 char char char char int\n", expected: "struct 1: offsets 0 8 16 18 20 24 | size 32 align 8 padding 8 | reordered size 24 padding 0\nstruct 2: offsets 0 1 2 3 4 | size 8 align 4 padding 0 | reordered size 8 padding 0\n", hidden: true },
          ],
        },
        {
          title: "Row-major against column-major",
          prompt: `Count cache-line loads for the two ways of summing an \`R × C\` matrix of 4-byte elements stored row-major. Model a cache of \`K\` lines of 64 bytes (sixteen elements each) with least-recently-used replacement: touching element \`(r, c)\` means touching line \`(r * C + c) / 16\`; a line already held costs nothing and becomes the most recently used, a line not held costs one **load** and evicts the least recently used when the cache is full. Write \`LineCache\` with a \`touch(line)\` and a \`loads()\` and run it over the row-major traversal (\`r\` outer, \`c\` inner) and the column-major one (\`c\` outer, \`r\` inner).

Read \`t\` scenarios \`R C K\` and print for each: \`R=<R> C=<C> K=<K>: lines <total> row-major <a> column-major <b>\`, where \`total\` is the number of lines the matrix occupies.

**Input:** \`t\`, then \`t\` lines \`R C K\` (K ≥ 1).
**Output:** \`t\` lines.

\`\`\`text
3
64 16 8
64 16 64
64 16 63
\`\`\`
prints
\`\`\`text
R=64 C=16 K=8: lines 64 row-major 64 column-major 1024
R=64 C=16 K=64: lines 64 row-major 64 column-major 64
R=64 C=16 K=63: lines 64 row-major 64 column-major 1024
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

// An LRU cache of a fixed number of cache lines: one load per line not held.
class LineCache {
public:
    explicit LineCache(long long lines) : lines_(lines) {}

    void touch(long long line) {
        // TODO: a hit moves the line to the most-recently-used end;
        //       a miss counts a load, evicts the least recently used when full, inserts
        (void)line;
    }

    long long loads() const { return loads_; }

private:
    long long lines_;
    std::vector<long long> held_;  // least recently used at the front
    long long loads_ = 0;
};

int main() {
    constexpr long long kPerLine = 64 / 4;

    int t;
    std::cin >> t;
    for (int k = 0; k < t; ++k) {
        long long r, c, lines;
        std::cin >> r >> c >> lines;
        // TODO: total lines, then both traversals through a fresh LineCache each
        (void)kPerLine;
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

// An LRU cache of a fixed number of cache lines: one load per line not held.
class LineCache {
public:
    explicit LineCache(long long lines) : lines_(lines) {}

    void touch(long long line) {
        const auto it = std::find(held_.begin(), held_.end(), line);
        if (it != held_.end()) {
            held_.erase(it);          // hit: becomes the most recently used
            held_.push_back(line);
            return;
        }
        ++loads_;
        if (static_cast<long long>(held_.size()) == lines_) held_.erase(held_.begin());
        held_.push_back(line);
    }

    long long loads() const { return loads_; }

private:
    long long lines_;
    std::vector<long long> held_;  // least recently used at the front
    long long loads_ = 0;
};

int main() {
    constexpr long long kPerLine = 64 / 4;

    int t;
    std::cin >> t;
    for (int k = 0; k < t; ++k) {
        long long r, c, lines;
        std::cin >> r >> c >> lines;
        const long long elements = r * c;
        const long long total = (elements + kPerLine - 1) / kPerLine;

        LineCache rowMajor(lines);
        for (long long i = 0; i < r; ++i)
            for (long long j = 0; j < c; ++j) rowMajor.touch((i * c + j) / kPerLine);

        LineCache columnMajor(lines);
        for (long long j = 0; j < c; ++j)
            for (long long i = 0; i < r; ++i) columnMajor.touch((i * c + j) / kPerLine);

        std::cout << "R=" << r << " C=" << c << " K=" << lines << ": lines " << total
                  << " row-major " << rowMajor.loads()
                  << " column-major " << columnMajor.loads() << '\n';
    }
    return 0;
}
`,
          hints: [
            "Keep the held lines in a vector ordered from least to most recently used: a hit erases and re-appends, a miss appends after evicting the front when full.",
            "The line of element (r, c) is `(r * C + c) / 16` — rows that are not a multiple of sixteen wide share lines with their neighbours.",
            "With `K` at least `R`, the column-major loop keeps every row's current line resident and costs the same as row-major; one line fewer and it collapses.",
          ],
          cases: [
            { stdin: "3\n64 16 8\n64 16 64\n64 16 63\n", expected: "R=64 C=16 K=8: lines 64 row-major 64 column-major 1024\nR=64 C=16 K=64: lines 64 row-major 64 column-major 64\nR=64 C=16 K=63: lines 64 row-major 64 column-major 1024\n" },
            { stdin: "2\n4 20 1\n4 20 4\n", expected: "R=4 C=20 K=1: lines 5 row-major 5 column-major 80\nR=4 C=20 K=4: lines 5 row-major 5 column-major 8\n" },
            { stdin: "2\n1 1 1\n3 5 1\n", expected: "R=1 C=1 K=1: lines 1 row-major 1 column-major 1\nR=3 C=5 K=1: lines 1 row-major 1 column-major 1\n", hidden: true },
            { stdin: "2\n100 100 16\n100 100 100\n", expected: "R=100 C=100 K=16: lines 625 row-major 625 column-major 10000\nR=100 C=100 K=100: lines 625 row-major 625 column-major 700\n", hidden: true },
            { stdin: "2\n16 64 1\n2 32 2\n", expected: "R=16 C=64 K=1: lines 64 row-major 64 column-major 1024\nR=2 C=32 K=2: lines 4 row-major 4 column-major 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "On this platform, what is `sizeof(S)` for `struct S { char a; double b; char c; };`, and what does it become when the members are reordered to `double b; char a; char c;`?",
          options: ["10, then 10", "24, then 16", "16, then 16", "24, then 24"],
          answer: 1,
          explanation: "`b` needs an 8-aligned offset, so seven bytes of padding follow `a`; `c` sits at 16 and the size rounds up to 24. With the double first the two chars fit at 8 and 9 and only six bytes of tail padding remain: 16.",
        },
        {
          prompt: "Why does walking a `std::list<int>` of a million elements cost far more than walking a `std::vector<int>` of the same size?",
          options: ["`std::list` iterators are O(log n)", "The vector is vectorised and the list is not — that is the whole difference", "The list's nodes are scattered and each address depends on the previous node, so the prefetcher cannot help and most nodes are a cache miss", "The list stores each `int` in 8 bytes"],
          answer: 2,
          explanation: "A list traversal is a chain of dependent loads to separately allocated nodes; a vector is one contiguous block read sixteen ints per line with the prefetcher running ahead. The complexity table says both are O(n); the cache says one of them is a hundred times slower.",
        },
        {
          prompt: "`int a[R][C]` is summed with `c` in the outer loop and `r` in the inner one. Once `C >= 16` and the cache is small, what does each access cost in the line model?",
          options: ["One line load per element", "One line load per sixteen elements", "The same as the row-major loop — the compiler swaps the loops", "Nothing — the prefetcher recognises the stride"],
          answer: 0,
          explanation: "The inner loop jumps `4·C` bytes per step, so with `C >= 16` consecutive accesses land on different lines, and a cache that cannot hold a line per row has evicted each one before the next column returns to it. The rule: the innermost loop must walk the innermost index.",
        },
        {
          prompt: "`struct Particle { double x, y, z; float mass; };` is 32 bytes. Summing only `mass` over a `std::vector<Particle>`, what fraction of every loaded cache line is useful?",
          options: ["All of it — the vector is contiguous", "Half", "4 of every 32 bytes — an eighth", "4 of every 64 bytes — a sixteenth"],
          answer: 2,
          explanation: "Two particles fit in a 64-byte line and each contributes a 4-byte mass: 8 useful bytes of 64. A struct-of-arrays layout keeps the masses contiguous — sixteen per line — which is the case for SoA when hot loops touch one field of many elements.",
        },
        {
          prompt: "Which statement about alignment on this platform is correct?",
          options: ["Members are packed with no gaps unless you ask for padding", "`sizeof` never includes padding", "`alignof(double)` is 4 on x86-64", "A member is placed at the next offset that is a multiple of its alignment, and the struct's size is rounded up to a multiple of its largest member alignment"],
          answer: 3,
          explanation: "That is the padding rule the calculator implements: fundamental types align to their size, interior padding fills the gaps, and tail padding keeps arrays of the struct aligned. `sizeof` counts every padding byte.",
        },
        {
          prompt: "A loop runs `if (v < threshold)` over an array. What is true of unsorted random data versus the same data sorted?",
          options: ["The same — the compiler removes the branch either way", "Random: mispredicted about half the time; sorted: a handful of misses around the transition", "Sorted is slower because the sort had to touch every element", "Random is faster because sorted data defeats the predictor's history"],
          answer: 1,
          explanation: "The predictor learns from history; a branch whose outcome is random is wrong about half the time, at fifteen to twenty cycles each, while a sorted array gives one long run of taken then one of not-taken. Sorting first, or a branchless form, is why identical arithmetic can run several times faster.",
        },
        {
          prompt: "What does `#pragma pack(1)` on a struct do?",
          options: ["Reorders the members by descending size", "Removes the padding by force, making accesses misaligned — a tool for matching a wire format, not for saving memory", "Fits the struct into one cache line", "Is ignored by GCC and Clang"],
          answer: 1,
          explanation: "Packing sets every member's alignment to 1, so the layout matches a byte-exact format but every multi-byte access is misaligned: slower on x86 and a fault on some architectures. Reordering members by size shrinks a struct without that cost.",
        },
      ],
    },
    {
      slug: "compiler-optimisation",
      file: "04-compiler-optimisation.md",
      exercises: [
        {
          title: "A constant folder with dead-store elimination",
          prompt: `Simulate two optimiser passes over a straight-line program of integer statements. Each line is one of \`input x\` (\`x\` receives a run-time value: unknown from here on), \`x = operand\`, \`x = operand op operand\` with \`op\` in \`+ - *\`, or \`print operand\`; an operand is a name or an integer literal (possibly negative). The scaffold parses each line into a \`Stmt\` and can render one back; you write the two passes.

**Fold** walks forward keeping a map of names with known constant values: replace every operand whose value is known by its literal, and when *all* operands of an assignment are then literals compute the result (\`long long\`), rewrite the statement as \`x = value\` and record \`x\` as known. An assignment with an unknown operand, and an \`input\`, make the target unknown. Fold only what is fully constant — \`n * 0\` stays a run-time expression. A \`print\` of a known name becomes \`print value\`.

**Eliminate** walks backward with a set of live names: a \`print\` of a name makes it live; an assignment whose target is not live is a dead store and is dropped (its operands do not become live); a kept assignment makes its target dead and its name operands live; \`input\` is always kept and makes its name dead.

Print the surviving statements in order, then \`eliminated E of N\`.

**Input:** \`N\`, then \`N\` statement lines.
**Output:** the optimised program, then the summary line.

\`\`\`text
6
x = 3
y = x + 4
input n
z = y * n
w = z - z
print z
\`\`\`
prints
\`\`\`text
input n
z = 7 * n
print z
eliminated 3 of 6
\`\`\``,
          starter: String.raw`#include <cctype>
#include <cstddef>
#include <iostream>
#include <map>
#include <optional>
#include <set>
#include <sstream>
#include <string>
#include <vector>

struct Stmt {
    std::string kind;              // "input", "print" or "assign"
    std::string target;            // input/assign: the variable; print: the operand
    std::vector<std::string> ops;  // assign: one operand, or two joined by op
    char op = 0;                   // '+', '-' or '*' when ops has two entries
};

bool isLiteral(const std::string& token) {
    return std::isdigit(static_cast<unsigned char>(token[0])) || token[0] == '-';
}

Stmt parse(const std::string& line) {
    std::istringstream in(line);
    std::vector<std::string> t;
    std::string tok;
    while (in >> tok) t.push_back(tok);
    Stmt s;
    if (t[0] == "input") {
        s.kind = "input";
        s.target = t[1];
    } else if (t[0] == "print") {
        s.kind = "print";
        s.target = t[1];
    } else {
        s.kind = "assign";
        s.target = t[0];
        s.ops.push_back(t[2]);
        if (t.size() == 5) {
            s.op = t[3][0];
            s.ops.push_back(t[4]);
        }
    }
    return s;
}

std::string render(const Stmt& s) {
    if (s.kind == "input") return "input " + s.target;
    if (s.kind == "print") return "print " + s.target;
    std::string out = s.target + " = " + s.ops[0];
    if (s.ops.size() == 2) out += std::string(" ") + s.op + " " + s.ops[1];
    return out;
}

// Pass 1, forward: substitute known constants and fold fully constant operations.
void fold(std::vector<Stmt>& program) {
    // TODO
    (void)program;
}

// Pass 2, backward: drop an assignment nobody reads before it is overwritten.
std::vector<Stmt> eliminate(const std::vector<Stmt>& program) {
    // TODO
    return program;
}

int main() {
    int k;
    std::cin >> k;
    std::cin.ignore();
    std::vector<Stmt> program;
    for (int i = 0; i < k; ++i) {
        std::string line;
        std::getline(std::cin, line);
        program.push_back(parse(line));
    }
    fold(program);
    const std::vector<Stmt> kept = eliminate(program);
    for (const Stmt& s : kept) std::cout << render(s) << '\n';
    std::cout << "eliminated " << (program.size() - kept.size()) << " of " << program.size() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <cstddef>
#include <iostream>
#include <map>
#include <optional>
#include <set>
#include <sstream>
#include <string>
#include <vector>

struct Stmt {
    std::string kind;              // "input", "print" or "assign"
    std::string target;            // input/assign: the variable; print: the operand
    std::vector<std::string> ops;  // assign: one operand, or two joined by op
    char op = 0;                   // '+', '-' or '*' when ops has two entries
};

bool isLiteral(const std::string& token) {
    return std::isdigit(static_cast<unsigned char>(token[0])) || token[0] == '-';
}

Stmt parse(const std::string& line) {
    std::istringstream in(line);
    std::vector<std::string> t;
    std::string tok;
    while (in >> tok) t.push_back(tok);
    Stmt s;
    if (t[0] == "input") {
        s.kind = "input";
        s.target = t[1];
    } else if (t[0] == "print") {
        s.kind = "print";
        s.target = t[1];
    } else {
        s.kind = "assign";
        s.target = t[0];
        s.ops.push_back(t[2]);
        if (t.size() == 5) {
            s.op = t[3][0];
            s.ops.push_back(t[4]);
        }
    }
    return s;
}

std::string render(const Stmt& s) {
    if (s.kind == "input") return "input " + s.target;
    if (s.kind == "print") return "print " + s.target;
    std::string out = s.target + " = " + s.ops[0];
    if (s.ops.size() == 2) out += std::string(" ") + s.op + " " + s.ops[1];
    return out;
}

// Pass 1, forward: substitute every operand whose value is known and fold an
// operation whose operands are all constants; an input line makes a name unknown.
void fold(std::vector<Stmt>& program) {
    std::map<std::string, long long> known;
    const auto value = [&](const std::string& token) -> std::optional<long long> {
        if (isLiteral(token)) return std::stoll(token);
        const auto it = known.find(token);
        if (it == known.end()) return std::nullopt;
        return it->second;
    };
    for (Stmt& s : program) {
        if (s.kind == "input") {
            known.erase(s.target);
            continue;
        }
        if (s.kind == "print") {
            if (const auto v = value(s.target)) s.target = std::to_string(*v);
            continue;
        }
        std::vector<std::optional<long long>> vals;
        for (std::string& o : s.ops) {
            const auto v = value(o);
            vals.push_back(v);
            if (v) o = std::to_string(*v);
        }
        if (s.ops.size() == 1) {
            if (vals[0]) known[s.target] = *vals[0];
            else known.erase(s.target);
        } else if (vals[0] && vals[1]) {
            const long long a = *vals[0];
            const long long b = *vals[1];
            const long long r = s.op == '+' ? a + b : s.op == '-' ? a - b : a * b;
            s.ops = {std::to_string(r)};
            s.op = 0;
            known[s.target] = r;
        } else {
            known.erase(s.target);   // n * 0 stays a run-time value: no algebra here
        }
    }
}

// Pass 2, backward: an assignment nobody reads before it is overwritten is dead.
std::vector<Stmt> eliminate(const std::vector<Stmt>& program) {
    std::set<std::string> live;
    std::vector<bool> keep(program.size(), true);
    for (std::size_t i = program.size(); i-- > 0;) {
        const Stmt& s = program[i];
        if (s.kind == "print") {
            if (!isLiteral(s.target)) live.insert(s.target);
            continue;
        }
        if (s.kind == "input") {
            live.erase(s.target);
            continue;
        }
        if (!live.count(s.target)) {
            keep[i] = false;
            continue;
        }
        live.erase(s.target);
        for (const std::string& o : s.ops)
            if (!isLiteral(o)) live.insert(o);
    }
    std::vector<Stmt> out;
    for (std::size_t i = 0; i < program.size(); ++i)
        if (keep[i]) out.push_back(program[i]);
    return out;
}

int main() {
    int k;
    std::cin >> k;
    std::cin.ignore();
    std::vector<Stmt> program;
    for (int i = 0; i < k; ++i) {
        std::string line;
        std::getline(std::cin, line);
        program.push_back(parse(line));
    }
    fold(program);
    const std::vector<Stmt> kept = eliminate(program);
    for (const Stmt& s : kept) std::cout << render(s) << '\n';
    std::cout << "eliminated " << (program.size() - kept.size()) << " of " << program.size() << '\n';
    return 0;
}
`,
          hints: [
            "A `std::map<std::string, long long>` of known names plus a small lambda that turns a token into `std::optional<long long>` (literal, known name, or empty) does the forward pass.",
            "After folding, a constant that fed only other constants is read by nobody — the backward pass removes it, which is why `x = 3` and `y = 7` vanish in the example.",
            "Walk backwards with `for (std::size_t i = n; i-- > 0;)`: decide each statement from the live set, then update the set — target dead first, operands live second, so `x = x + 1` keeps `x` live.",
          ],
          cases: [
            { stdin: "6\nx = 3\ny = x + 4\ninput n\nz = y * n\nw = z - z\nprint z\n", expected: "input n\nz = 7 * n\nprint z\neliminated 3 of 6\n" },
            { stdin: "4\na = 10\nb = a * a\nprint b\nprint 5\n", expected: "print 100\nprint 5\neliminated 2 of 4\n" },
            { stdin: "2\nx = 1\ny = x + 1\n", expected: "eliminated 2 of 2\n", hidden: true },
            { stdin: "8\nx = 2\ny = x * -3\nprint y\ninput n\nm = n\nprint m\nk = n * 0\nprint k\n", expected: "print -6\ninput n\nm = n\nprint m\nk = n * 0\nprint k\neliminated 2 of 8\n", hidden: true },
            { stdin: "5\ninput a\nb = a\nc = b + 1\nb = 7\nprint c\n", expected: "input a\nb = a\nc = b + 1\nprint c\neliminated 1 of 5\n", hidden: true },
          ],
        },
        {
          title: "A two-bit branch predictor",
          prompt: `Model the cost of a data-dependent branch. For each scenario \`n threshold seed\` generate \`n\` values with the linear congruential generator \`x = (x * 1103515245 + 12345) mod 2^31\` in unsigned 64-bit arithmetic, starting from \`x = seed\`, taking \`value = (x >> 16) % 256\` after each step. The branch is \`value < threshold\`, and the predictor is a **two-bit saturating counter**: state 0 or 1 predicts "not taken", 2 or 3 predicts "taken"; a taken branch moves the state up by one (saturating at 3), a not-taken one down by one (saturating at 0); the state starts at 0. Count a **miss** whenever the prediction disagrees with the outcome.

Run the predictor over the values in generated order, then over the same values sorted ascending, and print one line per scenario: \`n=<n> threshold=<t> seed=<s>: taken <count> random misses <a> sorted misses <b>\`, where \`taken\` is how many values are below the threshold.

**Input:** \`t\`, then \`t\` lines \`n threshold seed\`.
**Output:** \`t\` lines.

\`\`\`text
3
1000 128 42
1000 128 7
1000 200 42
\`\`\`
prints
\`\`\`text
n=1000 threshold=128 seed=42: taken 527 random misses 479 sorted misses 4
n=1000 threshold=128 seed=7: taken 506 random misses 483 sorted misses 4
n=1000 threshold=200 seed=42: taken 815 random misses 219 sorted misses 4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>

// A two-bit saturating predictor: states 0 and 1 predict "not taken",
// 2 and 3 predict "taken"; every outcome nudges the state one step.
long long mispredictions(const std::vector<int>& values, int threshold) {
    // TODO
    (void)values;
    (void)threshold;
    return 0;
}

int main() {
    int t;
    std::cin >> t;
    for (int k = 0; k < t; ++k) {
        int n, threshold;
        std::uint64_t seed;
        std::cin >> n >> threshold >> seed;
        std::vector<int> values;
        // TODO: generate n values from the LCG, count the taken branches,
        //       run the predictor over the generated order and the sorted order
        std::cout << "n=" << n << " threshold=" << threshold << " seed=" << seed << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>

// A two-bit saturating predictor: states 0 and 1 predict "not taken",
// 2 and 3 predict "taken"; every outcome nudges the state one step.
long long mispredictions(const std::vector<int>& values, int threshold) {
    int state = 0;
    long long wrong = 0;
    for (int v : values) {
        const bool taken = v < threshold;
        const bool predicted = state >= 2;
        if (taken != predicted) ++wrong;
        state = taken ? std::min(3, state + 1) : std::max(0, state - 1);
    }
    return wrong;
}

int main() {
    int t;
    std::cin >> t;
    for (int k = 0; k < t; ++k) {
        int n, threshold;
        std::uint64_t seed;
        std::cin >> n >> threshold >> seed;

        std::vector<int> values;
        std::uint64_t x = seed;
        for (int i = 0; i < n; ++i) {
            x = (x * 1103515245ULL + 12345ULL) % 2147483648ULL;
            values.push_back(static_cast<int>((x >> 16) % 256));
        }
        const long long taken = std::count_if(values.begin(), values.end(),
                                              [&](int v) { return v < threshold; });
        const long long random = mispredictions(values, threshold);
        std::vector<int> sorted = values;
        std::sort(sorted.begin(), sorted.end());
        const long long ordered = mispredictions(sorted, threshold);

        std::cout << "n=" << n << " threshold=" << threshold << " seed=" << seed
                  << ": taken " << taken << " random misses " << random
                  << " sorted misses " << ordered << '\n';
    }
    return 0;
}
`,
          hints: [
            "Keep the generator in `std::uint64_t` so the multiplication cannot overflow; `% 2147483648ULL` is the mod 2^31 step.",
            "The predictor is four lines: `predicted = state >= 2`, compare with `taken`, then `state = taken ? std::min(3, state + 1) : std::max(0, state - 1)`.",
            "Sorted data mispredicts at most a few times — twice while the counter warms up and twice at the transition — whatever `n` is.",
          ],
          cases: [
            { stdin: "3\n1000 128 42\n1000 128 7\n1000 200 42\n", expected: "n=1000 threshold=128 seed=42: taken 527 random misses 479 sorted misses 4\nn=1000 threshold=128 seed=7: taken 506 random misses 483 sorted misses 4\nn=1000 threshold=200 seed=42: taken 815 random misses 219 sorted misses 4\n" },
            { stdin: "3\n0 128 1\n50 0 3\n50 256 3\n", expected: "n=0 threshold=128 seed=1: taken 0 random misses 0 sorted misses 0\nn=50 threshold=0 seed=3: taken 0 random misses 0 sorted misses 0\nn=50 threshold=256 seed=3: taken 50 random misses 2 sorted misses 2\n" },
            { stdin: "2\n1 100 5\n2 300 5\n", expected: "n=1 threshold=100 seed=5: taken 0 random misses 0 sorted misses 0\nn=2 threshold=300 seed=5: taken 2 random misses 2 sorted misses 2\n", hidden: true },
            { stdin: "2\n5000 64 2024\n5000 192 2024\n", expected: "n=5000 threshold=64 seed=2024: taken 1222 random misses 1440 sorted misses 4\nn=5000 threshold=192 seed=2024: taken 3734 random misses 1500 sorted misses 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "At `-O2`, what remains of the loop?\n\n```cpp\nint wasted() {\n    int sum = 0;\n    for (int i = 0; i < 1000000; ++i) sum += i;\n    return 0;\n}\n```",
          options: ["The loop, because loops always execute", "Nothing — `sum` reaches no output, so the loop is dead code and is deleted", "The loop, vectorised eight elements at a time", "A closed form `n * (n + 1) / 2` stored into `sum`"],
          answer: 1,
          explanation: "Under the as-if rule a value never observed need never be computed; the whole loop goes. The closed form appears only when `sum` is returned or printed — and that is also why a benchmark that never prints its result measures nothing.",
        },
        {
          prompt: "What does the `inline` keyword actually do?",
          options: ["Forces the compiler to inline the function at every call", "Is required before the optimiser may inline a function", "Is a linkage promise — the definition may appear in several translation units — while the optimiser inlines by its own heuristics", "Makes the function `constexpr`"],
          answer: 2,
          explanation: "`inline` relaxes the one-definition rule so a header can carry a definition. Inlining is decided from body size, call count and visibility; a function without the keyword is inlined just as readily when its definition is visible.",
        },
        {
          prompt: "Which level does the study judge compile with, and which does `g++` use when you pass no `-O` flag?",
          options: ["`-O2`; `-O0`", "`-O3`; `-O2`", "`-O2`; `-O1`", "`-Ofast`; `-O0`"],
          answer: 0,
          explanation: "The judge builds at `-O2`, the production level. The compiler's default is `-O0` — no optimisation, every variable in memory — which is why timing an unflagged build tells you nothing about the shipped program.",
        },
        {
          prompt: "What does the as-if rule permit the compiler to do?",
          options: ["Only transformations that keep every variable and every function call", "Any transformation that preserves observable behaviour — `volatile` accesses, data written to files and streams, interaction with the environment", "Reorder floating-point operations freely", "Remove any loop it considers too slow"],
          answer: 1,
          explanation: "The program's meaning is its observable behaviour; which locals exist, how often an expression is evaluated, whether a function is called at all are all fair game. Floating-point reordering needs `-ffast-math`, which changes results and is not as-if.",
        },
        {
          prompt: "`constexpr int twice(int x) { return x * 2; }` and later `int y = twice(n);` where `n` was read from `std::cin`. What happens?",
          options: ["Compile error — a `constexpr` function needs constant arguments", "Undefined behaviour", "It compiles and runs at run time: `constexpr` permits compile-time evaluation and requires it only where a constant is required", "`y` is computed at compile time as 0"],
          answer: 2,
          explanation: "`constexpr` marks a function *usable* in constant expressions. With a run-time argument it is an ordinary call; with a constant argument in a context that demands a constant — an array bound, a template argument — it must fold or the program is ill-formed. `consteval` is the keyword that forbids run-time calls.",
        },
        {
          prompt: "Two threads share a `volatile int counter` and both increment it without a mutex or atomic. What is true?",
          options: ["It is safe — `volatile` makes every access happen", "It is still a data race, which is undefined behaviour; `volatile` is not a synchronisation tool", "It is atomic on x86", "It is a compile error"],
          answer: 1,
          explanation: "`volatile` forbids caching the value in a register and reordering its accesses — the contract for memory-mapped hardware and signal handlers — but says nothing about other threads. `std::atomic<int>` or a mutex is the fix.",
        },
        {
          prompt: "Which of these is worth doing by hand at `-O2`?",
          options: ["Replacing `x * 2` with `x << 1`", "Caching `v.size()` in a local before a read-only loop", "Fixing a column-major inner loop, or removing an allocation from a loop", "Writing `++i` instead of `i++` on an `int` loop counter"],
          answer: 2,
          explanation: "The optimiser already emits the shift, hoists an unchanging `size()` and generates identical code for either increment on an `int`. What it cannot do is change your algorithm, remove an allocation you asked for, reorder your struct or swap your loops — those are the changes that move the time.",
        },
      ],
    },
    {
      slug: "measuring-and-tools",
      file: "05-measuring-and-tools.md",
      exercises: [
        {
          title: "Linear against binary search, in comparisons",
          prompt: `Make the constant-factor trade visible by counting. Read \`n\` sorted distinct integers and \`q\` queries. For each query run both searches and count the work: **linear** search compares \`a[i] == x\` for \`i = 0, 1, …\` and stops at the first match (an absent value costs \`n\` comparisons); **binary** search counts one comparison per probe, exactly this loop:

\`\`\`cpp
int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;   // one probe
    if (a[mid] == x) return found;
    if (a[mid] < x) lo = mid + 1; else hi = mid - 1;
}
\`\`\`

Print \`x: linear <c1> binary <c2> found|absent\` per query, then \`total linear <L> binary <B> ratio <L/B>\` with the ratio fixed to two decimals — or \`ratio n/a\` when \`B\` is zero.

**Input:** \`n\`, then \`n\` sorted integers, then \`q\`, then \`q\` integers.
**Output:** \`q\` lines, then the total line.

\`\`\`text
8
1 2 3 4 5 6 7 8
3
8
1
9
\`\`\`
prints
\`\`\`text
8: linear 8 binary 4 found
1: linear 1 binary 3 found
9: linear 8 binary 4 absent
total linear 17 binary 11 ratio 1.55
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <vector>

struct Probe {
    bool found;
    long long comparisons;
};

Probe linearSearch(const std::vector<int>& a, int x) {
    // TODO: one comparison per element looked at
    (void)a;
    (void)x;
    return {false, 0};
}

Probe binarySearch(const std::vector<int>& a, int x) {
    // TODO: one comparison per probe, the loop from the prompt
    (void)a;
    (void)x;
    return {false, 0};
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> a(static_cast<std::size_t>(n));
    for (int& v : a) std::cin >> v;
    int q;
    std::cin >> q;
    long long linearTotal = 0;
    long long binaryTotal = 0;
    for (int k = 0; k < q; ++k) {
        int x;
        std::cin >> x;
        // TODO: run both, print the query line, accumulate the totals
    }
    // TODO: the total line with the ratio fixed to two decimals, or n/a
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <vector>

struct Probe {
    bool found;
    long long comparisons;
};

Probe linearSearch(const std::vector<int>& a, int x) {
    long long comparisons = 0;
    for (int v : a) {
        ++comparisons;
        if (v == x) return {true, comparisons};
    }
    return {false, comparisons};
}

Probe binarySearch(const std::vector<int>& a, int x) {
    long long probes = 0;
    int lo = 0;
    int hi = static_cast<int>(a.size()) - 1;
    while (lo <= hi) {
        const int mid = lo + (hi - lo) / 2;   // never lo + hi: that sum can overflow
        ++probes;
        if (a[mid] == x) return {true, probes};
        if (a[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return {false, probes};
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> a(static_cast<std::size_t>(n));
    for (int& v : a) std::cin >> v;
    int q;
    std::cin >> q;
    long long linearTotal = 0;
    long long binaryTotal = 0;
    for (int k = 0; k < q; ++k) {
        int x;
        std::cin >> x;
        const Probe lin = linearSearch(a, x);
        const Probe bin = binarySearch(a, x);
        linearTotal += lin.comparisons;
        binaryTotal += bin.comparisons;
        std::cout << x << ": linear " << lin.comparisons << " binary " << bin.comparisons
                  << (bin.found ? " found" : " absent") << '\n';
    }
    std::cout << "total linear " << linearTotal << " binary " << binaryTotal << " ratio ";
    if (binaryTotal == 0) std::cout << "n/a\n";
    else std::cout << std::fixed << std::setprecision(2)
                   << static_cast<double>(linearTotal) / static_cast<double>(binaryTotal) << '\n';
    return 0;
}
`,
          hints: [
            "Return a small struct `{found, comparisons}` from each search so the caller can print both facts.",
            "Count the binary probe before testing `a[mid]`, so a hit on the last probe is still counted; an empty array does zero probes.",
            "`std::fixed << std::setprecision(2)` before the ratio; cast both totals to `double` before dividing.",
          ],
          cases: [
            { stdin: "8\n1 2 3 4 5 6 7 8\n3\n8\n1\n9\n", expected: "8: linear 8 binary 4 found\n1: linear 1 binary 3 found\n9: linear 8 binary 4 absent\ntotal linear 17 binary 11 ratio 1.55\n" },
            { stdin: "5\n-10 -3 0 7 42\n4\n0\n-10\n42\n5\n", expected: "0: linear 3 binary 1 found\n-10: linear 1 binary 2 found\n42: linear 5 binary 3 found\n5: linear 5 binary 2 absent\ntotal linear 14 binary 8 ratio 1.75\n" },
            { stdin: "1\n5\n2\n5\n6\n", expected: "5: linear 1 binary 1 found\n6: linear 1 binary 1 absent\ntotal linear 2 binary 2 ratio 1.00\n", hidden: true },
            { stdin: "0\n1\n3\n", expected: "3: linear 0 binary 0 absent\ntotal linear 0 binary 0 ratio n/a\n", hidden: true },
            { stdin: "16\n2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32\n5\n2\n32\n16\n18\n17\n", expected: "2: linear 1 binary 4 found\n32: linear 16 binary 5 found\n16: linear 8 binary 1 found\n18: linear 9 binary 4 found\n17: linear 16 binary 4 absent\ntotal linear 50 binary 18 ratio 2.78\n", hidden: true },
          ],
        },
        {
          title: "Summarising benchmark runs",
          prompt: `Apply the lesson's reporting rules to timings that arrive as input, so the judge compares statistics and never a clock. Two implementations, \`A\` and \`B\`, were each run several times; for each, read \`n w\` and then \`n\` integer durations in microseconds, the first \`w\` of which are warm-up runs to discard (\`w < n\`, every duration at least 1). For the remaining samples report the count, the **minimum**, the **median** (the mean of the two middle values for an even count, printed with one decimal), the **mean** (two decimals) and the **spread** \`(max − min) / min\` (two decimals). Then print \`speedup\` as \`median(A) / median(B)\` to two decimals — above 1 means \`B\` is faster.

**Input:** \`n w\`, \`n\` integers, then the same again for \`B\`.
**Output:** two summary lines and the speedup line.

\`\`\`text
6 1
90 41 40 44 43 42
6 1
70 33 31 30 31 35
\`\`\`
prints
\`\`\`text
A: samples 5 min 40 median 42.0 mean 42.00 spread 0.10
B: samples 5 min 30 median 31.0 mean 32.00 spread 0.17
speedup 1.35
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <vector>

struct Summary {
    std::size_t samples;
    long long min;
    double median;
    double mean;
    double spread;
};

// Drop the warm-up runs, sort, and take the statistics the lesson recommends.
Summary summarise(std::vector<long long> runs, std::size_t warmup) {
    // TODO
    (void)runs;
    (void)warmup;
    return {0, 0, 0.0, 0.0, 0.0};
}

Summary readSet() {
    std::size_t n, warmup;
    std::cin >> n >> warmup;
    std::vector<long long> runs(n);
    for (long long& r : runs) std::cin >> r;
    return summarise(runs, warmup);
}

int main() {
    const Summary a = readSet();
    const Summary b = readSet();
    // TODO: print "A: samples … min … median … mean … spread …", the same for B, then the speedup
    (void)a;
    (void)b;
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <vector>

struct Summary {
    std::size_t samples;
    long long min;
    double median;
    double mean;
    double spread;
};

// Drop the warm-up runs, sort, and take the statistics the lesson recommends:
// the minimum is what the code costs, the median what a typical run costs,
// the mean is dragged up by every interruption and is reported last.
Summary summarise(std::vector<long long> runs, std::size_t warmup) {
    runs.erase(runs.begin(), runs.begin() + static_cast<std::ptrdiff_t>(warmup));
    std::sort(runs.begin(), runs.end());
    const std::size_t n = runs.size();
    long long total = 0;
    for (long long r : runs) total += r;
    const double median = n % 2 == 1
        ? static_cast<double>(runs[n / 2])
        : (static_cast<double>(runs[n / 2 - 1]) + static_cast<double>(runs[n / 2])) / 2.0;
    const double spread = static_cast<double>(runs.back() - runs.front()) / static_cast<double>(runs.front());
    return {n, runs.front(), median, static_cast<double>(total) / static_cast<double>(n), spread};
}

Summary readSet() {
    std::size_t n, warmup;
    std::cin >> n >> warmup;
    std::vector<long long> runs(n);
    for (long long& r : runs) std::cin >> r;
    return summarise(runs, warmup);
}

void print(const char* name, const Summary& s) {
    std::cout << name << ": samples " << s.samples << " min " << s.min
              << " median " << std::fixed << std::setprecision(1) << s.median
              << " mean " << std::setprecision(2) << s.mean
              << " spread " << s.spread << '\n';
}

int main() {
    const Summary a = readSet();
    const Summary b = readSet();
    print("A", a);
    print("B", b);
    std::cout << "speedup " << std::fixed << std::setprecision(2) << a.median / b.median << '\n';
    return 0;
}
`,
          hints: [
            "Erase the first `warmup` entries, sort, and the minimum and maximum are the two ends.",
            "For an even count the median is the mean of `runs[n/2 - 1]` and `runs[n/2]`; convert to `double` before adding so a `.5` survives.",
            "`std::setprecision` is sticky: set 1 for the median and 2 for the mean and spread, in that order, on every line.",
          ],
          cases: [
            { stdin: "6 1\n90 41 40 44 43 42\n6 1\n70 33 31 30 31 35\n", expected: "A: samples 5 min 40 median 42.0 mean 42.00 spread 0.10\nB: samples 5 min 30 median 31.0 mean 32.00 spread 0.17\nspeedup 1.35\n" },
            { stdin: "4 0\n12 10 11 13\n5 2\n99 98 20 24 22\n", expected: "A: samples 4 min 10 median 11.5 mean 11.50 spread 0.30\nB: samples 3 min 20 median 22.0 mean 22.00 spread 0.20\nspeedup 0.52\n" },
            { stdin: "1 0\n5\n1 0\n5\n", expected: "A: samples 1 min 5 median 5.0 mean 5.00 spread 0.00\nB: samples 1 min 5 median 5.0 mean 5.00 spread 0.00\nspeedup 1.00\n", hidden: true },
            { stdin: "8 3\n300 200 150 100 104 98 101 103\n6 2\n400 300 210 200 205 214\n", expected: "A: samples 5 min 98 median 101.0 mean 101.20 spread 0.06\nB: samples 4 min 200 median 207.5 mean 207.25 spread 0.07\nspeedup 0.49\n", hidden: true },
            { stdin: "3 1\n50 30 30\n3 0\n60 60 60\n", expected: "A: samples 2 min 30 median 30.0 mean 30.00 spread 0.00\nB: samples 3 min 60 median 60.0 mean 60.00 spread 0.00\nspeedup 0.50\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which clock should measure how long a piece of code took?",
          options: ["`std::chrono::system_clock` — it has the highest resolution", "`std::chrono::steady_clock` — monotonic, never adjusted, so a difference of two readings is a duration", "`std::time(nullptr)`", "`std::chrono::high_resolution_clock`, always"],
          answer: 1,
          explanation: "`steady_clock` cannot go backwards or jump when the system time is corrected, which is the property an interval needs. `system_clock` is wall-clock time for timestamps; `high_resolution_clock` is an alias for one of the others and is best avoided by name.",
        },
        {
          prompt: "A benchmark loop computes a sum a million times and reports 0 ns. The most likely reason?",
          options: ["The timer's resolution is too coarse for a million iterations", "The CPU was throttled", "Dead-code elimination removed the loop because its result is never observed — print it or write it to a `volatile` sink", "The loop was vectorised down to a single instruction"],
          answer: 2,
          explanation: "Under the as-if rule an unobserved computation need not happen, so the benchmark timed two clock reads. Making the result observable is the first of the six fixes; a resolution problem would give a small nonzero number, not zero.",
        },
        {
          prompt: "You ran a benchmark twenty times. Which number should you report, and why not the mean?",
          options: ["The minimum or the median — the mean is dragged upward by every interruption in the long tail", "The mean — it uses all the data", "The maximum — the worst case is what matters", "The first run — later runs are warmed up and unrepresentative"],
          answer: 0,
          explanation: "Run times have a floor set by the code and a long tail of interruptions above it; the minimum estimates the code's own cost and the median a typical run. The first run is the one to discard — it pays the page faults and the frequency ramp.",
        },
        {
          prompt: "Why does no expected output in this track contain a duration?",
          options: ["`std::chrono` is not available on the judge", "A time on the shared judge varies from run to run with no change to the code; asserting on it would be a coin toss", "The standard requires durations to go to `stderr`", "The judge strips numbers from output before comparing"],
          answer: 1,
          explanation: "A program that took 40 ms may take 90 ms on the next run of a shared machine. Time limits are a ceiling against runaway loops, never a measurement; the exercises count operations instead, and a count is a fact.",
        },
        {
          prompt: "Searching eight sorted `int`s: which is typically faster, a linear scan or a binary search, and why?",
          options: ["Binary search — O(log n) always beats O(n)", "They are identical at every size", "The scan — it touches one cache line with a perfectly predicted branch, while the search's probes each mispredict about half the time", "Binary search, because it touches fewer cache lines"],
          answer: 2,
          explanation: "Big-O ranks algorithms as n grows; at eight elements the constant factors decide, and the scan's predictable loop over one line wins. libstdc++'s `std::sort` switches to insertion sort below sixteen elements for the same reason.",
        },
        {
          prompt: "Which tool tells you *where* the run time went, by sampling?",
          options: ["`time ./a.out`", "`perf record ./a.out` followed by `perf report`", "`-fsanitize=address`", "`-fanalyzer`"],
          answer: 1,
          explanation: "`time` says whether there is a problem; `perf record` samples the running program and `perf report` attributes the samples to functions. ASan finds memory errors at run time and `-fanalyzer` is a compile-time path analysis — neither is a profiler.",
        },
        {
          prompt: "A function accounts for 10 % of a program's run time. What is the most you can gain by making it infinitely fast?",
          options: ["10 % of the total", "Unbounded — it depends on the function", "50 % of the total", "90 % of the total"],
          answer: 0,
          explanation: "Amdahl's rule: removing a part removes at most that part's share. Which is why the loop is measure, profile, change the hottest thing, and profile again — the hot spot moves.",
        },
      ],
    },
    {
      slug: "performance-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Overflow-safe statistics",
          prompt: `Report statistics over \`long long\` values without ever computing a sum, difference or product that does not fit. Read \`n\` and \`n\` values (each fits in a \`long long\`). Print \`count n\`; if \`n\` is 0 print \`empty\` and stop. Otherwise print, one per line: \`min\`, \`max\`, \`range\` (max − min), \`sum\`, \`mean\` (the integer quotient \`sum / n\`, truncated toward zero) and \`squares\` (the sum of every value squared). Any figure that would overflow prints the word \`overflow\` in its place — the mean too, when the sum did. Use \`__builtin_add_overflow\`, \`__builtin_sub_overflow\` and \`__builtin_mul_overflow\` on \`long long\` operands; once an accumulation has overflowed it stays overflowed.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`count\`, then either \`empty\` or the six statistic lines.

\`\`\`text
4
-3 9 2 6
\`\`\`
prints
\`\`\`text
count 4
min -3
max 9
range 12
sum 14
mean 3
squares 130
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<long long> values(static_cast<std::size_t>(n));
    for (long long& v : values) std::cin >> v;

    std::cout << "count " << n << '\n';
    if (n == 0) {
        std::cout << "empty\n";
        return 0;
    }
    // TODO: min, max, checked range, checked sum and mean, checked sum of squares
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<long long> values(static_cast<std::size_t>(n));
    for (long long& v : values) std::cin >> v;

    std::cout << "count " << n << '\n';
    if (n == 0) {
        std::cout << "empty\n";
        return 0;
    }

    long long lo = values[0];
    long long hi = values[0];
    long long sum = 0;
    long long squares = 0;
    bool sumOverflow = false;
    bool squaresOverflow = false;
    for (long long v : values) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        if (!sumOverflow && __builtin_add_overflow(sum, v, &sum)) sumOverflow = true;
        if (!squaresOverflow) {
            long long square = 0;
            if (__builtin_mul_overflow(v, v, &square) || __builtin_add_overflow(squares, square, &squares))
                squaresOverflow = true;
        }
    }
    long long range = 0;
    const bool rangeOverflow = __builtin_sub_overflow(hi, lo, &range);

    std::cout << "min " << lo << '\n';
    std::cout << "max " << hi << '\n';
    std::cout << "range ";
    if (rangeOverflow) std::cout << "overflow\n";
    else std::cout << range << '\n';
    std::cout << "sum ";
    if (sumOverflow) std::cout << "overflow\n";
    else std::cout << sum << '\n';
    std::cout << "mean ";
    if (sumOverflow) std::cout << "overflow\n";
    else std::cout << sum / n << '\n';
    std::cout << "squares ";
    if (squaresOverflow) std::cout << "overflow\n";
    else std::cout << squares << '\n';
    return 0;
}
`,
          hints: [
            "Keep a `bool` per accumulation; once it is set, skip the builtin so a wrapped intermediate is never reused.",
            "The square needs two checks: `__builtin_mul_overflow(v, v, &square)` and then adding it to the running total.",
            "`range` is a single `__builtin_sub_overflow(max, min, &range)` at the end — `INT64_MAX - INT64_MIN` is the case that trips it.",
          ],
          cases: [
            { stdin: "4\n-3 9 2 6\n", expected: "count 4\nmin -3\nmax 9\nrange 12\nsum 14\nmean 3\nsquares 130\n" },
            { stdin: "2\n9223372036854775807\n1\n", expected: "count 2\nmin 1\nmax 9223372036854775807\nrange 9223372036854775806\nsum overflow\nmean overflow\nsquares overflow\n" },
            { stdin: "2\n-9223372036854775808\n9223372036854775807\n", expected: "count 2\nmin -9223372036854775808\nmax 9223372036854775807\nrange overflow\nsum -1\nmean 0\nsquares overflow\n", hidden: true },
            { stdin: "3\n3037000499\n3037000499\n1\n", expected: "count 3\nmin 1\nmax 3037000499\nrange 3037000498\nsum 6074000999\nmean 2024666999\nsquares overflow\n", hidden: true },
            { stdin: "0\n", expected: "count 0\nempty\n", hidden: true },
          ],
        },
        {
          title: "AoS against SoA: a cache-line audit",
          prompt: `Audit the cache lines two layouts touch, built on the padding rule from lesson 3. Read a struct as \`m\` type names (\`char\`/\`bool\` 1, \`short\` 2, \`int\`/\`float\` 4, \`long\`/\`double\`/\`ptr\` 8; each aligns to its size, the struct rounds up to its largest alignment), then \`n\` (≥ 1) elements and the 0-based index \`hot\` of the member a hot loop reads. Lines are 64 bytes and both layouts start at offset 0.

- **Array of structs:** element \`i\`'s hot member starts at byte \`i * size + offset\`; count the distinct lines those bytes fall in (a member never straddles a line here, since every width divides 64 and every offset is a multiple of its width).
- **Struct of arrays:** the hot member alone is a contiguous array of \`n × width\` bytes: \`ceil(bytes / 64)\` lines.
- **All fields:** AoS is \`ceil(n × size / 64)\`; SoA is the sum of \`ceil(n × width / 64)\` over every member.

Print \`struct size S hot offset O width W\`, \`hot field: aos A soa B\`, \`all fields: aos C soa D\`, and \`hot ratio A/B\` fixed to two decimals.

**Input:** \`m\`, \`m\` type names, \`n\`, \`hot\`.
**Output:** four lines.

\`\`\`text
4
double double double float
32
3
\`\`\`
prints
\`\`\`text
struct size 32 hot offset 24 width 4
hot field: aos 16 soa 2
all fields: aos 16 soa 14
hot ratio 8.00
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Layout {
    std::vector<long long> offsets;
    long long size = 0;
    long long align = 1;
};

Layout layout(const std::vector<long long>& sizes) {
    Layout l;
    // TODO: the padding rule from lesson 3
    (void)sizes;
    return l;
}

constexpr long long kLine = 64;

long long linesFor(long long bytes) { return (bytes + kLine - 1) / kLine; }

// Distinct cache lines holding the member at byte offset (width bytes wide) across n
// contiguous structs of stride bytes each.
long long aosLines(long long n, long long stride, long long offset) {
    // TODO
    (void)n;
    (void)stride;
    (void)offset;
    return 0;
}

int main() {
    const std::map<std::string, long long> width{
        {"char", 1}, {"bool", 1}, {"short", 2}, {"int", 4},
        {"float", 4}, {"long", 8}, {"double", 8}, {"ptr", 8},
    };
    int m;
    std::cin >> m;
    std::vector<long long> sizes;
    for (int i = 0; i < m; ++i) {
        std::string type;
        std::cin >> type;
        sizes.push_back(width.at(type));
    }
    long long n;
    int hot;
    std::cin >> n >> hot;
    // TODO: lay the struct out, count both layouts for the hot field and for all fields, print
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Layout {
    std::vector<long long> offsets;
    long long size = 0;
    long long align = 1;
};

Layout layout(const std::vector<long long>& sizes) {
    Layout l;
    long long at = 0;
    for (long long s : sizes) {
        at = (at + s - 1) / s * s;
        l.offsets.push_back(at);
        at += s;
        l.align = std::max(l.align, s);
    }
    l.size = (at + l.align - 1) / l.align * l.align;
    return l;
}

constexpr long long kLine = 64;

long long linesFor(long long bytes) { return (bytes + kLine - 1) / kLine; }

// Distinct cache lines holding the member at byte offset (width bytes wide) across n
// contiguous structs of stride bytes each. Members never straddle a line here:
// every width divides 64 and every offset is a multiple of the width, so the
// line of the first byte is the line of the whole member.
long long aosLines(long long n, long long stride, long long offset) {
    long long lines = 0;
    long long last = -1;
    for (long long i = 0; i < n; ++i) {
        const long long line = (i * stride + offset) / kLine;
        if (line != last) {
            ++lines;
            last = line;
        }
    }
    return lines;
}

int main() {
    const std::map<std::string, long long> width{
        {"char", 1}, {"bool", 1}, {"short", 2}, {"int", 4},
        {"float", 4}, {"long", 8}, {"double", 8}, {"ptr", 8},
    };
    int m;
    std::cin >> m;
    std::vector<long long> sizes;
    for (int i = 0; i < m; ++i) {
        std::string type;
        std::cin >> type;
        sizes.push_back(width.at(type));
    }
    long long n;
    int hot;
    std::cin >> n >> hot;

    const Layout l = layout(sizes);
    const long long hotOffset = l.offsets[static_cast<std::size_t>(hot)];
    const long long hotWidth = sizes[static_cast<std::size_t>(hot)];

    const long long aosHot = aosLines(n, l.size, hotOffset);
    const long long soaHot = linesFor(n * hotWidth);
    const long long aosAll = linesFor(n * l.size);
    long long soaAll = 0;
    for (long long s : sizes) soaAll += linesFor(n * s);

    std::cout << "struct size " << l.size << " hot offset " << hotOffset << " width " << hotWidth << '\n';
    std::cout << "hot field: aos " << aosHot << " soa " << soaHot << '\n';
    std::cout << "all fields: aos " << aosAll << " soa " << soaAll << '\n';
    std::cout << "hot ratio " << std::fixed << std::setprecision(2)
              << static_cast<double>(aosHot) / static_cast<double>(soaHot) << '\n';
    return 0;
}
`,
          hints: [
            "The layout function is the padding calculator from lesson 3 minus the padding count: offsets, size and alignment.",
            "The hot member's line for element `i` is `(i * size + offset) / 64`; the lines are non-decreasing in `i`, so count the changes.",
            "`ceil(bytes / 64)` is `(bytes + 63) / 64` in integers; write it once and use it for every SoA array and the all-fields AoS.",
          ],
          cases: [
            { stdin: "4\ndouble double double float\n32\n3\n", expected: "struct size 32 hot offset 24 width 4\nhot field: aos 16 soa 2\nall fields: aos 16 soa 14\nhot ratio 8.00\n" },
            { stdin: "3\nchar int char\n100\n1\n", expected: "struct size 12 hot offset 4 width 4\nhot field: aos 19 soa 7\nall fields: aos 19 soa 11\nhot ratio 2.71\n" },
            { stdin: "1\nint\n16\n0\n", expected: "struct size 4 hot offset 0 width 4\nhot field: aos 1 soa 1\nall fields: aos 1 soa 1\nhot ratio 1.00\n", hidden: true },
            { stdin: "3\nchar double char\n1\n0\n", expected: "struct size 24 hot offset 0 width 1\nhot field: aos 1 soa 1\nall fields: aos 1 soa 3\nhot ratio 1.00\n", hidden: true },
            { stdin: "5\nlong int short char bool\n900\n4\n", expected: "struct size 16 hot offset 15 width 1\nhot field: aos 225 soa 15\nall fields: aos 225 soa 229\nhot ratio 15.00\n", hidden: true },
          ],
        },
        {
          title: "Insertion against selection: the work each did",
          prompt: `Run two sorts on the same input and report the work each did, counted, never timed. Read \`n\` integers. **Insertion sort**: for \`i\` from 1, take \`key = a[i]\` and walk \`j\` down from \`i\`; each evaluation of \`a[j - 1] > key\` is one **comparison**; each \`a[j] = a[j - 1]\` is one **shift**; stop when the comparison fails or \`j\` reaches 0, then store the key. **Selection sort**: for each \`i\` from 0 to \`n − 2\`, scan \`j\` from \`i + 1\` to the end, one **comparison** per \`a[j] < a[best]\`; if the best index differs from \`i\`, \`std::swap\` and count one **swap**.

Print \`sorted:\` followed by the sorted values (one space before each), then \`insertion comparisons C shifts S\`, \`selection comparisons C swaps S\`, and \`cheaper insertion\`, \`cheaper selection\` or \`cheaper tie\` comparing comparisons + shifts against comparisons + swaps.

**Input:** \`n\`, then \`n\` integers.
**Output:** four lines.

\`\`\`text
6
5 2 4 6 1 3
\`\`\`
prints
\`\`\`text
sorted: 1 2 3 4 5 6
insertion comparisons 12 shifts 9
selection comparisons 15 swaps 3
cheaper selection
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

struct Work {
    long long comparisons = 0;
    long long moves = 0;   // insertion: shifts; selection: swaps
};

Work insertionSort(std::vector<int>& a) {
    Work w;
    // TODO
    (void)a;
    return w;
}

Work selectionSort(std::vector<int>& a) {
    Work w;
    // TODO
    (void)a;
    return w;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> input(static_cast<std::size_t>(n));
    for (int& v : input) std::cin >> v;

    std::vector<int> a = input;
    const Work ins = insertionSort(a);
    std::vector<int> b = input;
    const Work sel = selectionSort(b);

    // TODO: the sorted line, the two work lines, the verdict
    (void)ins;
    (void)sel;
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

struct Work {
    long long comparisons = 0;
    long long moves = 0;   // insertion: shifts; selection: swaps
};

Work insertionSort(std::vector<int>& a) {
    Work w;
    for (std::size_t i = 1; i < a.size(); ++i) {
        const int key = a[i];
        std::size_t j = i;
        // invariant: a[0..i) is sorted; key sinks left past every larger element
        while (j > 0) {
            ++w.comparisons;
            if (a[j - 1] <= key) break;
            a[j] = a[j - 1];
            ++w.moves;
            --j;
        }
        a[j] = key;
    }
    return w;
}

Work selectionSort(std::vector<int>& a) {
    Work w;
    const std::size_t n = a.size();
    for (std::size_t i = 0; i + 1 < n; ++i) {
        std::size_t best = i;
        for (std::size_t j = i + 1; j < n; ++j) {
            ++w.comparisons;
            if (a[j] < a[best]) best = j;
        }
        if (best != i) {
            std::swap(a[i], a[best]);
            ++w.moves;
        }
    }
    return w;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> input(static_cast<std::size_t>(n));
    for (int& v : input) std::cin >> v;

    std::vector<int> a = input;
    const Work ins = insertionSort(a);
    std::vector<int> b = input;
    const Work sel = selectionSort(b);

    std::cout << "sorted:";
    for (int v : a) std::cout << ' ' << v;
    std::cout << '\n';
    std::cout << "insertion comparisons " << ins.comparisons << " shifts " << ins.moves << '\n';
    std::cout << "selection comparisons " << sel.comparisons << " swaps " << sel.moves << '\n';
    const long long insWork = ins.comparisons + ins.moves;
    const long long selWork = sel.comparisons + sel.moves;
    if (insWork < selWork) std::cout << "cheaper insertion\n";
    else if (selWork < insWork) std::cout << "cheaper selection\n";
    else std::cout << "cheaper tie\n";
    return 0;
}
`,
          hints: [
            "Walk `j` down with `while (j > 0)` on a `std::size_t` and index `a[j - 1]` — never `j >= 0`, which is always true for an unsigned type.",
            "Count the comparison before you know its outcome: the one that stops the inner loop is still a comparison.",
            "Selection sort always does n(n − 1)/2 comparisons; only its swaps depend on the data, and an already-sorted input swaps nothing.",
          ],
          cases: [
            { stdin: "6\n5 2 4 6 1 3\n", expected: "sorted: 1 2 3 4 5 6\ninsertion comparisons 12 shifts 9\nselection comparisons 15 swaps 3\ncheaper selection\n" },
            { stdin: "5\n1 2 3 4 5\n", expected: "sorted: 1 2 3 4 5\ninsertion comparisons 4 shifts 0\nselection comparisons 10 swaps 0\ncheaper insertion\n" },
            { stdin: "5\n5 4 3 2 1\n", expected: "sorted: 1 2 3 4 5\ninsertion comparisons 10 shifts 10\nselection comparisons 10 swaps 2\ncheaper selection\n", hidden: true },
            { stdin: "0\n", expected: "sorted:\ninsertion comparisons 0 shifts 0\nselection comparisons 0 swaps 0\ncheaper tie\n", hidden: true },
            { stdin: "7\n3 3 -1 3 0 -1 3\n", expected: "sorted: -1 -1 0 3 3 3 3\ninsertion comparisons 14 shifts 9\nselection comparisons 21 swaps 3\ncheaper insertion\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is true of this snippet?\n\n```cpp\nint total;\nfor (int v : values) total += v;\nstd::cout << total;\n```",
          options: ["Prints the sum — `total` starts at 0", "Undefined behaviour: `total` is read before it is initialised, and the optimiser may produce any result", "Compile error: `total` is used uninitialised", "Prints the sum at `-O0` and garbage at `-O2`, both guaranteed"],
          answer: 1,
          explanation: "An automatic `int` without an initialiser holds an indeterminate value, and reading it is on the catalogue. `-Wall` warns, `int total{};` is never indeterminate, and nothing about the outcome is guaranteed at any level.",
        },
        {
          prompt: "Besides a zero divisor, which `int` division is undefined?",
          options: ["`INT_MIN / -1`", "`INT_MAX / -1`", "`-7 / 2`", "`INT_MIN / 2`"],
          answer: 0,
          explanation: "`INT_MIN / -1` would be `INT_MAX + 1`, which does not fit: signed overflow. `-7 / 2` is `-3` by truncation toward zero, and the other two fit comfortably. The checked evaluator tests exactly this pair before dividing.",
        },
        {
          prompt: "Reading a `float`'s bits through `*reinterpret_cast<int*>(&f)` is undefined. What is the well-defined way?",
          options: ["`static_cast<int>(f)`", "`std::memcpy` into an `int`, or C++20 `std::bit_cast<int>(f)`", "A union of `int` and `float`", "`(int&)f` — a C-style cast is allowed"],
          answer: 1,
          explanation: "Strict aliasing lets the compiler assume an `int*` and a `float*` never refer to the same object; `memcpy` and `bit_cast` copy the bytes without that assumption. `static_cast` converts the value, not the bits; type punning through a union is undefined in C++.",
        },
        {
          prompt: "`names` is a `std::vector<std::string>` of long strings. What does `for (auto s : names) total += s.size();` cost that `for (const auto& s : names)` does not?",
          options: ["Nothing — the compiler removes the copy", "One allocation and one copy of every string", "One move per element", "One virtual call per element"],
          answer: 1,
          explanation: "`auto s` declares a new `std::string` initialised from each element — a copy, and for a string past the small buffer an allocation. `const auto&` binds a name to the element for the price of one pointer.",
        },
        {
          prompt: "A doubling vector receives 100 `push_back`s from empty. Allocations and element moves?",
          options: ["100 and 0", "7 and 100", "8 and 127", "1 and 0"],
          answer: 2,
          explanation: "Capacities 1, 2, 4, 8, 16, 32, 64, 128 are eight allocations, and each reallocation moves what it holds: 1 + 2 + … + 64 = 127. `reserve(100)` first would be the last option.",
        },
        {
          prompt: "Which line removes every reallocation from a loop that will `push_back` exactly `n` elements into an empty `std::vector<int> v`?",
          options: ["`v.resize(n);` before the loop", "`v.reserve(n);` before the loop", "`v.shrink_to_fit();` after the loop", "`v.emplace_back` instead of `push_back`"],
          answer: 1,
          explanation: "`reserve(n)` makes one allocation of capacity `n` and moves nothing. `resize(n)` also creates `n` zeros, so the pushes would land after them; `shrink_to_fit` runs after the damage; `emplace_back` changes how the element is constructed, not whether the vector grows.",
        },
        {
          prompt: "`struct Loose { char tag; int value; char flag; };` — what are `sizeof(Loose)` and the size after ordering the members by descending size?",
          options: ["6, then 6", "12, then 8", "8, then 8", "12, then 12"],
          answer: 1,
          explanation: "Three bytes of padding after `tag` align `value` to 4, and three more round the end up to 12; `int, char, char` needs only two tail bytes: 8. `static_assert(sizeof(Tight) == 8)` locks it.",
        },
        {
          prompt: "What is the rule for nested loops over a row-major matrix, and why?",
          options: ["Make the innermost loop walk the innermost index, so consecutive accesses are consecutive bytes and each cache line serves sixteen elements", "Make the innermost loop walk the outermost index, so rows are finished quickly", "Order does not matter — the compiler swaps the loops", "Use recursion to avoid nested loops"],
          answer: 0,
          explanation: "`a[r][c]` lives at `r * C + c`, so the `c` loop is sequential and the `r` loop strides `4·C` bytes. The compiler does not generally interchange loops for you; the loop order is yours to get right.",
        },
        {
          prompt: "When is a struct-of-arrays layout the better shape?",
          options: ["Always — it removes padding", "When hot loops touch one or two fields of many elements, so the loaded lines hold only the bytes those loops read", "When every loop touches every field of each element", "Never — AoS is what the language provides"],
          answer: 1,
          explanation: "Summing one `float` out of a 32-byte struct reads an eighth of each line usefully; the same field in its own array fills every line. When a loop needs every field, AoS is the natural shape and about as fast.",
        },
        {
          prompt: "Which of these can the optimiser NOT do for you?",
          options: ["Fold `3 * 4` into `12` and inline a small function", "Delete a loop whose result is never observed", "Replace an O(n²) algorithm with O(n log n), remove an allocation you asked for, or reorder your struct's members", "Emit a shift for `x * 8`"],
          answer: 2,
          explanation: "The as-if rule lets the compiler rewrite anything unobservable, but your algorithm, your allocations, your layout and your loop order are observable choices it preserves. Those are where the time goes and where hand work pays.",
        },
        {
          prompt: "A colleague benchmarks two implementations by compiling once with no `-O` flag and reporting the mean of one run each. Which of the six lies does that survive?",
          options: ["All of them — the comparison is fair", "None: it measures an `-O0` build nobody ships, one run pays warm-up, and a single sample has no spread", "Only the warm-up lie", "Only the dead-code lie"],
          answer: 1,
          explanation: "`-O0` tells you about a program the compiler never optimised; a single run includes page faults and the frequency ramp; a single sample cannot show whether the measurement is stable. Benchmark the flags you ship, repeat, and report the minimum or median with the spread.",
        },
        {
          prompt: "Why is the mean the least informative statistic of a set of benchmark runs?",
          options: ["Because it needs floating-point arithmetic", "Because run times sit on a floor set by the code with a long tail of interruptions above it, and every interruption drags the mean upward", "Because it is always larger than the maximum", "Because the median is faster to compute"],
          answer: 1,
          explanation: "The distribution is not symmetric: the minimum is the best estimate of what the code itself costs and the median of a typical run. Report one of those with the sample count and the spread so a reader can see whether the measurement is stable.",
        },
        {
          prompt: "Which clock and which stream for a timing inside a judged program?",
          options: ["`system_clock`, printed to `stdout` so it is checked", "`steady_clock`, printed to `stderr` — `stdout` is compared and must never contain a duration", "`high_resolution_clock`, printed to `stdout`", "Any clock; the judge ignores numbers"],
          answer: 1,
          explanation: "`steady_clock` is monotonic; `stderr` is not judged. A duration in `stdout` would make the case a coin toss on a shared machine, so the track's programs count operations and keep any timing on the diagnostic stream.",
        },
        {
          prompt: "A loop over unsorted data has a branch on each element's value and runs several times slower than the same loop over the sorted data. What explains it, and which fixes apply?",
          options: ["The sorted loop is vectorised; nothing to do for the unsorted one", "The branch mispredicts about half the time on random data; sort first, or write a branchless form such as `total += (v < t) * v`", "The unsorted data has more cache misses; add `reserve`", "The optimiser inlines only the sorted version; mark the function `inline`"],
          answer: 1,
          explanation: "Same arithmetic, same memory, different predictability: a random branch costs a misprediction of fifteen to twenty cycles about every other element. Sorting turns it into two long runs; a branchless form removes the branch altogether.",
        },
      ],
    },
  ],
});

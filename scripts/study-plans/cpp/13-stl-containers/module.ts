import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "stl-containers",
  title: "STL containers",
  blurb: "The four container families and their complexity table, std::vector's size–capacity model and the erase–remove idiom, deque, list and the adaptors, std::map and std::set with lower_bound, the unordered containers with custom hashes, and iterators with the invalidation table.",
  icon: "list",
  overview: `A C++ program keeps its data in the STL containers, and the difference between a program that is fast and one that is merely correct is usually which container it chose and how it used it. The containers were designed as one system: the same member names mean the same things everywhere, each container publishes what its operations cost, and each one promises which operations leave existing iterators pointing at garbage. Those three facts — the common interface, the complexity table and the invalidation rules — are what this module teaches, and they are also what interviewers ask.

The six lessons move from the map to the detail. The container zoo names the four families, the complexity table and the one-sentence reason to reach past \`std::vector\`. The vector lesson covers size versus capacity, geometric growth and amortised \`push_back\`, \`reserve\`, \`emplace_back\`, the O(n) cost of insertion in the middle, the erase–remove idiom and its C++20 successor \`std::erase_if\`, and the odd \`std::vector<bool>\`. Deque, list and the adaptors follow — the stable-ended deque, the node-based list with its \`splice\`, and \`std::stack\`, \`std::queue\` and \`std::priority_queue\` with the comparator convention that everyone inverts once. The ordered \`std::map\` and \`std::set\` bring \`operator[]\` that inserts, \`insert\` that reports, and \`lower_bound\` for "first key not less than". The unordered containers bring hashing, load factors, custom hashes for a struct, and the rule that an unordered container is sorted before it is printed. Iterators close the module: categories, \`std::next\`/\`std::prev\`/\`std::distance\`, the invalidation table per container, and the one correct shape of an erase-while-iterating loop.

Every exercise is a whole program judged on a real C++20 compiler and built on the container its lesson teaches: a template that reports three containers through their common interface, a bracket matcher on \`std::stack\`, a command-driven vector editor and an \`std::erase_if\` filter with a stateful predicate, a sliding-window maximum on a monotonic \`std::deque\`, a task scheduler on \`std::priority_queue\` with a tie-breaking comparator, word frequencies in \`std::map\` order and again through \`std::unordered_map\` sorted on output, "next departure" with \`lower_bound\` on a \`std::set\`, a custom-hash \`std::unordered_set\` of points, an account ledger pruned with \`it = m.erase(it)\`, and a playlist cursor on a \`std::list\`. The checkpoint adds a breadth-first search with \`std::queue\`, an LRU cache from a \`std::list\` and an \`std::unordered_map\` of iterators, and a leaderboard on a \`std::set\` with a custom ordering.`,
  lessons: [
    {
      slug: "the-container-zoo",
      file: "01-the-container-zoo.md",
      exercises: [
        {
          title: "Same numbers, three containers",
          prompt: `Read an integer \`n\`, then \`n\` integers. Append each one to a \`std::vector<int>\` with \`push_back\`, push each one onto the *front* of a \`std::deque<int>\` with \`push_front\`, and insert each one into a \`std::set<int>\`. Then print the three containers through **one function template** that uses only the common interface (\`size()\` and a range-based \`for\`), in the format \`<name>[<size>]: e1 e2 …\`. Finally print \`empty\` when there were no numbers, otherwise \`first=<vector.front()> last=<vector.back()> min=<smallest> max=<largest>\`, taking the smallest and largest from the set.

**Input:** \`n\` (0 or more), then \`n\` integers.
**Output:** three container lines, then one summary line.

\`\`\`text
5
3 1 2 3 9
\`\`\`
prints
\`\`\`text
vector[5]: 3 1 2 3 9
deque[5]: 9 3 2 1 3
set[4]: 1 2 3 9
first=3 last=9 min=1 max=9
\`\`\``,
          starter: String.raw`#include <deque>
#include <iostream>
#include <set>
#include <vector>

template <typename Container>
void print(const char* name, const Container& c) {
    // TODO: name[size]: then each element preceded by a space
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v;
    std::deque<int> d;
    std::set<int> s;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        // TODO: push_back, push_front, insert
    }
    print("vector", v);
    print("deque", d);
    print("set", s);
    // TODO: the summary line
    return 0;
}
`,
          solution: String.raw`#include <deque>
#include <iostream>
#include <set>
#include <vector>

template <typename Container>
void print(const char* name, const Container& c) {
    std::cout << name << '[' << c.size() << "]:";
    for (const auto& x : c) std::cout << ' ' << x;
    std::cout << '\n';
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v;
    std::deque<int> d;
    std::set<int> s;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        v.push_back(x);
        d.push_front(x);
        s.insert(x);
    }
    print("vector", v);
    print("deque", d);
    print("set", s);
    if (v.empty()) {
        std::cout << "empty\n";
    } else {
        std::cout << "first=" << v.front() << " last=" << v.back()
                  << " min=" << *s.begin() << " max=" << *s.rbegin() << '\n';
    }
    return 0;
}
`,
          hints: [
            "The same template body works for all three because every container has size(), begin() and end().",
            "A set is sorted, so *s.begin() is its minimum and *s.rbegin() its maximum.",
            "Print the space before each element, not after, so the line never ends in a space.",
          ],
          cases: [
            { stdin: "5\n3 1 2 3 9\n", expected: "vector[5]: 3 1 2 3 9\ndeque[5]: 9 3 2 1 3\nset[4]: 1 2 3 9\nfirst=3 last=9 min=1 max=9\n" },
            { stdin: "3\n7 7 7\n", expected: "vector[3]: 7 7 7\ndeque[3]: 7 7 7\nset[1]: 7\nfirst=7 last=7 min=7 max=7\n" },
            { stdin: "0\n", expected: "vector[0]:\ndeque[0]:\nset[0]:\nempty\n", hidden: true },
            { stdin: "4\n-2 5 -9 0\n", expected: "vector[4]: -2 5 -9 0\ndeque[4]: 0 -9 5 -2\nset[4]: -9 -2 0 5\nfirst=-2 last=0 min=-9 max=5\n", hidden: true },
            { stdin: "1\n42\n", expected: "vector[1]: 42\ndeque[1]: 42\nset[1]: 42\nfirst=42 last=42 min=42 max=42\n", hidden: true },
          ],
        },
        {
          title: "Bracket matcher on std::stack",
          prompt: `Read an integer \`n\`, then \`n\` lines of text (a line may be empty or contain spaces and other characters). For each line decide whether its brackets — \`()\`, \`[]\` and \`{}\` — are balanced, using a \`std::stack<char>\`: push every opener; on a closer, if the stack is empty or its top is not the matching opener, print \`mismatch at <i>\` (the 0-based index of that closer) and stop scanning the line. If the whole line scans without a mismatch, print \`balanced\` when the stack is empty and \`unclosed <k>\` when \`k\` openers remain on it.

Read \`n\` with \`std::cin >>\` and call \`std::cin.ignore()\` before the first \`std::getline\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

\`\`\`text
4
([]{})
([)]
((
)
\`\`\`
prints
\`\`\`text
balanced
mismatch at 2
unclosed 2
mismatch at 0
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stack>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int k = 0; k < n; ++k) {
        std::string line;
        std::getline(std::cin, line);
        std::stack<char> open;
        // TODO: scan the line; report mismatch at <i>, balanced, or unclosed <k>
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stack>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int k = 0; k < n; ++k) {
        std::string line;
        std::getline(std::cin, line);
        std::stack<char> open;
        bool ok = true;
        for (std::size_t i = 0; i < line.size() && ok; ++i) {
            const char c = line[i];
            if (c == '(' || c == '[' || c == '{') {
                open.push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                const char want = c == ')' ? '(' : c == ']' ? '[' : '{';
                if (open.empty() || open.top() != want) {
                    std::cout << "mismatch at " << i << '\n';
                    ok = false;
                } else {
                    open.pop();
                }
            }
        }
        if (!ok) continue;
        if (open.empty()) std::cout << "balanced\n";
        else std::cout << "unclosed " << open.size() << '\n';
    }
    return 0;
}
`,
          hints: [
            "Characters that are not brackets are skipped; only the six bracket characters touch the stack.",
            "Check open.empty() before open.top() — top() on an empty stack is undefined behaviour.",
            "After the scan, open.size() is the number of unclosed openers.",
          ],
          cases: [
            { stdin: "4\n([]{})\n([)]\n((\n)\n", expected: "balanced\nmismatch at 2\nunclosed 2\nmismatch at 0\n" },
            { stdin: "2\nint main() { return v[0]; }\n{[}\n", expected: "balanced\nmismatch at 2\n" },
            { stdin: "3\n\n{{{}}}\n(()\n", expected: "balanced\nbalanced\nunclosed 1\n", hidden: true },
            { stdin: "2\n]\n([{}])x\n", expected: "mismatch at 0\nbalanced\n", hidden: true },
            { stdin: "1\n(((((\n", expected: "unclosed 5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which container should be the default choice for a sequence of elements, and why?",
          options: [
            "`std::list`, because insertion anywhere is O(1)",
            "`std::vector`, because contiguous memory makes iteration and indexing cheapest and `push_back` is amortised O(1)",
            "`std::deque`, because it is O(1) at both ends",
            "`std::set`, because it keeps elements sorted",
          ],
          answer: 1,
          explanation: "Contiguous storage is what the cache rewards, and it makes indexing free. A list's O(1) insert needs an iterator you must first find in O(n); a deque and a set each pay for a feature most sequences do not need.",
        },
        {
          prompt: "Which of these is a container *adaptor* rather than a container?",
          options: ["`std::deque`", "`std::multiset`", "`std::priority_queue`", "`std::array`"],
          answer: 2,
          explanation: "`std::stack`, `std::queue` and `std::priority_queue` wrap a sequence container and expose only push/pop/top — no iterators. The other three are containers in their own right.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::set<int> s{4, 1, 4, 2, 1};\nstd::cout << s.size();\n```",
          options: ["5", "3", "2", "compile error"],
          answer: 1,
          explanation: "A `std::set` holds unique keys, so the duplicate 4 and 1 are dropped: {1, 2, 4}. A `std::multiset` would keep all five.",
        },
        {
          prompt: "Which operation is O(1) on a `std::list` but O(n) on a `std::vector`?",
          options: [
            "Finding an element by value",
            "Reading the element at index `i`",
            "Erasing an element you already hold an iterator to",
            "Iterating over every element",
          ],
          answer: 2,
          explanation: "A list relinks two neighbours; a vector shifts every element after the gap. Finding by value is O(n) on both, indexing is O(1) only on the vector, and iterating is O(n) on both.",
        },
        {
          prompt: "What happens here?\n\n```cpp\nstd::stack<int> st;\nst.pop();\n```",
          options: ["Throws `std::out_of_range`", "Does nothing", "Undefined behaviour", "Compile error"],
          answer: 2,
          explanation: "The adaptors do no checking: `top()` and `pop()` on an empty stack are undefined behaviour. Only `at()` on the indexable containers throws; test `empty()` first.",
        },
        {
          prompt: "`std::vector<std::string> b = a;` — what does this line do?",
          options: [
            "Copies every string: `b` owns its own elements",
            "Makes `b` share `a`'s elements until one of them is modified",
            "Copies only the pointers to the strings",
            "Does not compile: containers cannot be copied",
          ],
          answer: 0,
          explanation: "Containers have value semantics: copying one copies every element. Sharing until modification is copy-on-write, which C++ containers do not do; only `std::move(a)` transfers the buffer without copying.",
        },
      ],
    },
    {
      slug: "vector-in-depth",
      file: "02-vector-in-depth.md",
      exercises: [
        {
          title: "Vector editor",
          prompt: `Maintain a \`std::vector<int>\` and apply commands read until the end of input, one per line:

- \`push x\` — append \`x\`;
- \`pop\` — remove the last element, or print \`error\` if the vector is empty;
- \`insert i x\` — insert \`x\` before index \`i\` (\`0 ≤ i ≤ size\`), else print \`error\`;
- \`erase i\` — remove the element at index \`i\` (\`0 ≤ i < size\`), else print \`error\`;
- \`size\` — print \`size=<n>\`;
- \`print\` — print the elements as \`[a, b, c]\` (\`[]\` when empty).

Use \`v.insert(v.begin() + i, x)\` and \`v.erase(v.begin() + i)\` — the index becomes an iterator through random-access arithmetic. An index may be negative in the input; treat it as invalid.

**Input:** commands until end of input.
**Output:** one line per \`print\`, \`size\` or failed command.

\`\`\`text
push 1
push 2
push 3
print
insert 1 9
print
erase 0
print
pop
print
\`\`\`
prints
\`\`\`text
[1, 2, 3]
[1, 9, 2, 3]
[9, 2, 3]
[9, 2]
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

void print(const std::vector<int>& v) {
    std::cout << '[';
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
}

int main() {
    std::vector<int> v;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int x;
            std::cin >> x;
            // TODO
        } else if (cmd == "pop") {
            // TODO
        } else if (cmd == "insert") {
            long long i;
            int x;
            std::cin >> i >> x;
            // TODO: validate i, then insert before v.begin() + i
        } else if (cmd == "erase") {
            long long i;
            std::cin >> i;
            // TODO
        } else if (cmd == "size") {
            // TODO
        } else if (cmd == "print") {
            print(v);
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

void print(const std::vector<int>& v) {
    std::cout << '[';
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
}

int main() {
    std::vector<int> v;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int x;
            std::cin >> x;
            v.push_back(x);
        } else if (cmd == "pop") {
            if (v.empty()) std::cout << "error\n";
            else v.pop_back();
        } else if (cmd == "insert") {
            long long i;
            int x;
            std::cin >> i >> x;
            if (i < 0 || i > static_cast<long long>(v.size())) std::cout << "error\n";
            else v.insert(v.begin() + i, x);
        } else if (cmd == "erase") {
            long long i;
            std::cin >> i;
            if (i < 0 || i >= static_cast<long long>(v.size())) std::cout << "error\n";
            else v.erase(v.begin() + i);
        } else if (cmd == "size") {
            std::cout << "size=" << v.size() << '\n';
        } else if (cmd == "print") {
            print(v);
        }
    }
    return 0;
}
`,
          hints: [
            "insert accepts i == size (append at the end); erase does not.",
            "Compare the index with static_cast<long long>(v.size()) so a negative index is not converted to a huge unsigned value.",
            "pop_back on an empty vector is undefined behaviour — test empty() and print error instead.",
          ],
          cases: [
            { stdin: "push 1\npush 2\npush 3\nprint\ninsert 1 9\nprint\nerase 0\nprint\npop\nprint\n", expected: "[1, 2, 3]\n[1, 9, 2, 3]\n[9, 2, 3]\n[9, 2]\n" },
            { stdin: "pop\nprint\npush 5\ninsert 2 7\ninsert 1 7\nprint\nerase 5\nprint\nsize\n", expected: "error\n[]\nerror\n[5, 7]\nerror\n[5, 7]\nsize=2\n" },
            { stdin: "push -1\npush -2\ninsert 0 0\nprint\nerase 2\nerase 1\nerase 0\nprint\npop\nsize\n", expected: "[0, -1, -2]\n[]\nerror\nsize=0\n", hidden: true },
            { stdin: "insert 0 4\ninsert 0 3\ninsert 2 5\nprint\ninsert -1 9\nerase -1\nprint\n", expected: "[3, 4, 5]\nerror\nerror\n[3, 4, 5]\n", hidden: true },
            { stdin: "print\nsize\n", expected: "[]\nsize=0\n", hidden: true },
          ],
        },
        {
          title: "Filter and dedupe with std::erase_if",
          prompt: `Read an integer \`n\`, then \`n\` integers into a \`std::vector<int>\`, then a threshold \`t\`. In two passes, each a single call to \`std::erase_if\`:

1. remove every value that is **less than** \`t\` and print \`removed=<count>\` — the count is the value \`std::erase_if\` returns;
2. remove every value that has **already appeared** earlier in the vector (keep the first occurrence) and print \`deduped=<count>\` — the predicate keeps a \`std::set<int>\` of values seen so far, captured by reference.

Then print the remaining elements as \`[a, b, c]\` (\`[]\` when empty). Do not write an erase loop; the point is the algorithm.

**Input:** \`n\`, then \`n\` integers, then \`t\`.
**Output:** three lines.

\`\`\`text
7
5 1 5 3 8 3 9
3
\`\`\`
prints
\`\`\`text
removed=1
deduped=2
[5, 3, 8, 9]
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <set>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v(n);
    for (int& x : v) std::cin >> x;
    int t;
    std::cin >> t;
    // TODO: std::erase_if for values below t; print removed=<count>
    // TODO: std::erase_if with a std::set<int> seen, captured by reference; print deduped=<count>
    std::cout << '[';
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <set>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v(n);
    for (int& x : v) std::cin >> x;
    int t;
    std::cin >> t;
    const auto removed = std::erase_if(v, [t](int x) { return x < t; });
    std::cout << "removed=" << removed << '\n';
    std::set<int> seen;
    const auto deduped = std::erase_if(v, [&seen](int x) { return !seen.insert(x).second; });
    std::cout << "deduped=" << deduped << '\n';
    std::cout << '[';
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
    return 0;
}
`,
          hints: [
            "std::erase_if(v, pred) erases every element for which pred returns true and returns how many it erased.",
            "seen.insert(x).second is false when x was already in the set — that is exactly the elements to erase.",
            "Capture seen by reference ([&seen]); a by-value capture would give every copy of the lambda its own set.",
          ],
          cases: [
            { stdin: "7\n5 1 5 3 8 3 9\n3\n", expected: "removed=1\ndeduped=2\n[5, 3, 8, 9]\n" },
            { stdin: "4\n1 2 3 4\n10\n", expected: "removed=4\ndeduped=0\n[]\n" },
            { stdin: "5\n-3 -3 -3 0 -3\n-3\n", expected: "removed=0\ndeduped=3\n[-3, 0]\n", hidden: true },
            { stdin: "1\n7\n7\n", expected: "removed=0\ndeduped=0\n[7]\n", hidden: true },
            { stdin: "6\n2 2 2 2 2 2\n3\n", expected: "removed=6\ndeduped=0\n[]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> v;\nv.reserve(10);\nstd::cout << v.size() << ' ' << (v.capacity() >= 10);\n```",
          options: ["`10 1`", "`0 1`", "`0 0`", "`10 0`"],
          answer: 1,
          explanation: "`reserve` allocates room for at least 10 elements but creates none, so `size()` is still 0. `resize(10)` is the call that would make ten elements.",
        },
        {
          prompt: "`v.push_back(x)` runs on a vector whose `size()` equalled its `capacity()`. Which is true afterwards?",
          options: [
            "Only `end()` is invalidated",
            "Every iterator, pointer and reference into `v` is invalidated",
            "Nothing is invalidated: `push_back` never moves elements",
            "Only iterators before the insertion point stay valid",
          ],
          answer: 1,
          explanation: "A full vector reallocates: it moves every element to a new block and frees the old one, so anything that pointed into the old block dangles. Only when there is spare capacity is `end()` the sole casualty.",
        },
        {
          prompt: "Which removes every `3` from `std::vector<int> v` in one O(n) pass?",
          options: [
            "`v.remove(3);`",
            "`std::remove(v.begin(), v.end(), 3);` on its own",
            "`std::erase(v, 3);`",
            "`for (auto it = v.begin(); it != v.end(); ++it) if (*it == 3) v.erase(it);`",
          ],
          answer: 2,
          explanation: "`std::erase` (C++20) is the erase–remove idiom in one call. `std::vector` has no `remove` member (only `std::list` does); `std::remove` alone leaves the vector the same size with leftovers at the tail; the loop is O(n²) and skips elements after each erase.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> v{1, 2, 3, 4, 5};\nv.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }), v.end());\nstd::cout << v.size();\n```",
          options: ["5", "3", "2", "undefined behaviour"],
          answer: 1,
          explanation: "`remove_if` moves the odd elements to the front and returns the new logical end; `erase` chops the tail. Three odd numbers remain.",
        },
        {
          prompt: "`std::vector<bool> flags(8); auto f = flags[0];` — what is the type of `f`?",
          options: ["`bool`", "`bool&`", "A proxy object that stands for one bit", "`char`"],
          answer: 2,
          explanation: "`std::vector<bool>` packs bits, so `operator[]` cannot return a reference to a `bool`; it returns a small proxy class. `bool f = flags[0];` converts it; `auto` keeps the proxy.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<std::string> v;\nv.emplace_back(3, 'x');\nstd::cout << v[0];\n```",
          options: ["`3x`", "`xxx`", "compile error", "`x3`"],
          answer: 1,
          explanation: "`emplace_back` forwards its arguments to the element's constructor: `std::string(3, 'x')` is three copies of `x`. `push_back(3, 'x')` would not compile.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> a(3, 7);\nstd::vector<int> b{3, 7};\nstd::cout << a.size() << b.size();\n```",
          options: ["`22`", "`32`", "`23`", "`33`"],
          answer: 1,
          explanation: "Parentheses call the (count, value) constructor: three sevens. Braces prefer the initialiser-list constructor: the two elements 3 and 7.",
        },
      ],
    },
    {
      slug: "deque-list-and-adaptors",
      file: "03-deque-list-and-adaptors.md",
      exercises: [
        {
          title: "Sliding window maximum on a std::deque",
          prompt: `Read \`n\` and \`k\` (\`1 ≤ k ≤ n\`), then \`n\` integers. Print the maximum of every window of \`k\` consecutive elements, in order, space-separated on one line.

Do it in O(n) with a **monotonic deque of indices**: before pushing index \`i\` at the back, pop from the back every index whose value is \`≤ a[i]\` (it can never be a maximum again); then pop the front if it has fallen out of the window (\`front ≤ i - k\`). The front of the deque is always the index of the current window's maximum. This is the exercise that uses all four ends of \`std::deque\`: \`push_back\`, \`pop_back\`, \`front\`, \`pop_front\`.

**Input:** \`n k\`, then \`n\` integers.
**Output:** \`n - k + 1\` integers on one line.

Example: \`8 3\` / \`1 3 -1 -3 5 3 6 7\` → \`3 3 5 5 6 7\``,
          starter: String.raw`#include <deque>
#include <iostream>
#include <vector>

int main() {
    int n, k;
    std::cin >> n >> k;
    std::vector<int> a(n);
    for (int& x : a) std::cin >> x;
    std::deque<int> window;   // indices into a; values decrease from front to back
    for (int i = 0; i < n; ++i) {
        // TODO: pop the back while a[back] <= a[i]; push i; drop the front if it left the window
        // TODO: once i >= k - 1, print a[window.front()]
    }
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <deque>
#include <iostream>
#include <vector>

int main() {
    int n, k;
    std::cin >> n >> k;
    std::vector<int> a(n);
    for (int& x : a) std::cin >> x;
    std::deque<int> window;   // indices into a; values decrease from front to back
    bool first = true;
    for (int i = 0; i < n; ++i) {
        while (!window.empty() && a[window.back()] <= a[i]) window.pop_back();
        window.push_back(i);
        if (window.front() <= i - k) window.pop_front();
        if (i >= k - 1) {
            if (!first) std::cout << ' ';
            std::cout << a[window.front()];
            first = false;
        }
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "Store indices, not values, so you can tell when the front has left the window.",
            "The first window is complete when i == k - 1; print from then on.",
            "Each index is pushed once and popped at most once, which is what makes the whole thing O(n).",
          ],
          cases: [
            { stdin: "8 3\n1 3 -1 -3 5 3 6 7\n", expected: "3 3 5 5 6 7\n" },
            { stdin: "5 1\n4 2 9 1 7\n", expected: "4 2 9 1 7\n" },
            { stdin: "5 5\n-5 -2 -9 -1 -3\n", expected: "-1\n", hidden: true },
            { stdin: "6 2\n2 2 2 1 1 5\n", expected: "2 2 2 1 5\n", hidden: true },
            { stdin: "1 1\n0\n", expected: "0\n", hidden: true },
          ],
        },
        {
          title: "Task scheduler on std::priority_queue",
          prompt: `Simulate a scheduler. Commands arrive one per line until the end of input: \`add <name> <priority>\` queues a task (the name is one word, the priority an integer, possibly negative), and \`run\` takes the task that should run next and prints \`run <name> p=<priority>\`, or \`idle\` when nothing is queued.

The task to run next is the one with the **highest priority**; among equal priorities, the **alphabetically smaller name** runs first (plain \`std::string\` comparison). Two tasks may have the same name and priority. Store the tasks in a \`std::priority_queue\` of a \`Task\` struct with a **custom comparator** — a struct whose \`operator()(a, b)\` returns \`true\` when \`a\` should run *after* \`b\`.

**Input:** commands until end of input.
**Output:** one line per \`run\`.

\`\`\`text
add build 2
add test 5
add lint 2
run
run
run
run
\`\`\`
prints
\`\`\`text
run test p=5
run build p=2
run lint p=2
idle
\`\`\``,
          starter: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <vector>

struct Task {
    std::string name;
    int priority;
};

struct RunsLater {
    // TODO: return true when a should run AFTER b
    bool operator()(const Task& a, const Task& b) const {
        (void)a;
        (void)b;
        return false;
    }
};

int main() {
    std::priority_queue<Task, std::vector<Task>, RunsLater> tasks;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "add") {
            Task t;
            std::cin >> t.name >> t.priority;
            // TODO
        } else if (cmd == "run") {
            // TODO: idle, or print the top and pop it
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <vector>

struct Task {
    std::string name;
    int priority;
};

struct RunsLater {
    // true when a should run AFTER b: lower priority, or same priority and a later name
    bool operator()(const Task& a, const Task& b) const {
        if (a.priority != b.priority) return a.priority < b.priority;
        return a.name > b.name;
    }
};

int main() {
    std::priority_queue<Task, std::vector<Task>, RunsLater> tasks;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "add") {
            Task t;
            std::cin >> t.name >> t.priority;
            tasks.push(t);
        } else if (cmd == "run") {
            if (tasks.empty()) {
                std::cout << "idle\n";
            } else {
                const Task& next = tasks.top();
                std::cout << "run " << next.name << " p=" << next.priority << '\n';
                tasks.pop();
            }
        }
    }
    return 0;
}
`,
          hints: [
            "The comparator answers 'does a come out after b?' — so for highest-priority-first it returns a.priority < b.priority.",
            "For the tie-break, an alphabetically later name comes out later: return a.name > b.name.",
            "Read top() before pop(); pop() returns void.",
          ],
          cases: [
            { stdin: "add build 2\nadd test 5\nadd lint 2\nrun\nrun\nrun\nrun\n", expected: "run test p=5\nrun build p=2\nrun lint p=2\nidle\n" },
            { stdin: "run\nadd a 1\nadd b 1\nadd c 9\nrun\nadd d 9\nrun\nrun\nrun\n", expected: "idle\nrun c p=9\nrun d p=9\nrun a p=1\nrun b p=1\n" },
            { stdin: "add x -5\nadd y 0\nrun\nrun\n", expected: "run y p=0\nrun x p=-5\n", hidden: true },
            { stdin: "add same 3\nadd same 3\nrun\nrun\nrun\n", expected: "run same p=3\nrun same p=3\nidle\n", hidden: true },
            { stdin: "add z 10\nadd a 10\nadd m 10\nrun\nrun\nrun\n", expected: "run a p=10\nrun m p=10\nrun z p=10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which container gives O(1) `push_front`, O(1) `push_back` *and* O(1) `operator[]`?",
          options: ["`std::vector`", "`std::list`", "`std::deque`", "`std::forward_list`"],
          answer: 2,
          explanation: "A deque's block structure grows at both ends and still indexes in constant time. A vector's `push_front` would be O(n); a list has no `operator[]`.",
        },
        {
          prompt: "Why does `std::stack::pop()` return `void` instead of the removed element?",
          options: [
            "To make it faster: returning a value would copy",
            "Exception safety: if returning the value threw, the element would already be gone",
            "Because the underlying `std::deque` has no way to return the back",
            "A historical accident kept for compatibility",
          ],
          answer: 1,
          explanation: "A `pop()` that returned by value could remove the element and then throw while copying it out, losing it. Separating `top()` from `pop()` keeps the strong exception guarantee.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::priority_queue<int> pq;\nfor (int x : {3, 9, 1}) pq.push(x);\npq.pop();\nstd::cout << pq.top();\n```",
          options: ["9", "3", "1", "undefined behaviour"],
          answer: 1,
          explanation: "The default `std::priority_queue` is a max-heap: `pop()` removes 9, so `top()` is now 3.",
        },
        {
          prompt: "How do you declare a priority queue of `int` whose `top()` is the *smallest* element?",
          options: [
            "`std::priority_queue<int, std::greater<int>>`",
            "`std::priority_queue<int, std::vector<int>, std::greater<int>>`",
            "`std::priority_queue<int>` then call `pq.reverse()`",
            "`std::min_priority_queue<int>`",
          ],
          answer: 1,
          explanation: "The comparator is the third template argument, so the underlying container must be named as the second. There is no `reverse()` and no `min_priority_queue`.",
        },
        {
          prompt: "A comparator `cmp(a, b)` for `std::priority_queue` should return `true` when…",
          options: [
            "`a` should come out before `b`",
            "`a` should come out after `b` — `a` has the lower priority",
            "`a` and `b` are equal",
            "`a` is greater than `b`, always",
          ],
          answer: 1,
          explanation: "The heap keeps the element for which nothing else 'is less' on top. With `std::less`, 'a < b' means a comes out after b, which is why the default is a max-heap.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::list<int> l{1, 2, 3};\nauto it = std::next(l.begin());\nl.push_front(0);\nl.push_back(4);\nstd::cout << *it;\n```",
          options: ["2", "1", "0", "undefined behaviour"],
          answer: 0,
          explanation: "List nodes never move: inserting at either end leaves every existing iterator valid, so `it` still points at 2. On a `std::vector` the same code would be undefined behaviour after a reallocation.",
        },
        {
          prompt: "Which pair of calls reads and removes the oldest element of a `std::queue<int> q`?",
          options: ["`q.top()` then `q.pop()`", "`q.front()` then `q.pop()`", "`q.pop()` returns it", "`q.back()` then `q.pop_front()`"],
          answer: 1,
          explanation: "A queue exposes `front()` (oldest) and `back()` (newest); `top()` belongs to `std::stack` and `std::priority_queue`, and `pop()` returns nothing.",
        },
      ],
    },
    {
      slug: "map-and-set",
      file: "04-map-and-set.md",
      exercises: [
        {
          title: "Word frequencies in key order",
          prompt: `Read all of standard input as whitespace-separated tokens. Normalise each token by keeping only its letters and digits (drop every other character) and lower-casing them — use \`<cctype>\` with the \`unsigned char\` cast — and skip a token that becomes empty. Count the words in a \`std::map<std::string, int>\` with \`++freq[word]\`, then print every \`<word> <count>\` on its own line **in the map's own order** (no sorting step), followed by \`distinct=<number of words> total=<number of tokens counted>\`.

**Input:** free text until end of input (possibly empty).
**Output:** one line per distinct word, then the summary line.

\`\`\`text
The cat saw the other cat.
A cat!
\`\`\`
prints
\`\`\`text
a 1
cat 3
other 1
saw 1
the 2
distinct=5 total=8
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <map>
#include <string>

std::string normalise(const std::string& token) {
    std::string out;
    // TODO: keep letters and digits, lower-cased
    return out;
}

int main() {
    std::map<std::string, int> freq;
    long long total = 0;
    std::string token;
    while (std::cin >> token) {
        // TODO: normalise, skip empty, count
    }
    // TODO: print in map order, then the summary line
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <map>
#include <string>

std::string normalise(const std::string& token) {
    std::string out;
    for (char c : token) {
        const unsigned char uc = static_cast<unsigned char>(c);
        if (std::isalnum(uc)) out += static_cast<char>(std::tolower(uc));
    }
    return out;
}

int main() {
    std::map<std::string, int> freq;
    long long total = 0;
    std::string token;
    while (std::cin >> token) {
        const std::string word = normalise(token);
        if (word.empty()) continue;
        ++freq[word];
        ++total;
    }
    for (const auto& [word, count] : freq) std::cout << word << ' ' << count << '\n';
    std::cout << "distinct=" << freq.size() << " total=" << total << '\n';
    return 0;
}
`,
          hints: [
            "while (std::cin >> token) reads every whitespace-separated token until end of input.",
            "freq[word] inserts 0 the first time a word is seen, so ++freq[word] is the whole counting step.",
            "A std::map iterates in key order, so the output is sorted without a sort.",
          ],
          cases: [
            { stdin: "The cat saw the other cat.\nA cat!\n", expected: "a 1\ncat 3\nother 1\nsaw 1\nthe 2\ndistinct=5 total=8\n" },
            { stdin: "b a B A b\n", expected: "a 2\nb 3\ndistinct=2 total=5\n" },
            { stdin: "\n", expected: "distinct=0 total=0\n", hidden: true },
            { stdin: "... --- ...\nx\n", expected: "x 1\ndistinct=1 total=1\n", hidden: true },
            { stdin: "Zebra apple Apple zebra ZEBRA\n", expected: "apple 2\nzebra 3\ndistinct=2 total=5\n", hidden: true },
          ],
        },
        {
          title: "Next departure with lower_bound",
          prompt: `A timetable is a \`std::set<int>\` of departure times (minutes past midnight; the input may repeat a time — the set collapses it). Read \`n\`, then \`n\` times, then \`q\`, then \`q\` query times. For each query \`t\` print \`<t>: next=<x> prev=<y>\` where \`x\` is the first departure **at or after** \`t\` and \`y\` the last departure **strictly before** \`t\`; print \`none\` for either when it does not exist.

Use the set's **member** \`lower_bound\` for \`next\`, and \`std::prev\` of that iterator for \`prev\` — after checking it is not \`begin()\`.

**Input:** \`n\`, \`n\` integers, \`q\`, \`q\` integers.
**Output:** \`q\` lines.

\`\`\`text
5
600 645 700 900 1200
4
630
700
1300
0
\`\`\`
prints
\`\`\`text
630: next=645 prev=600
700: next=700 prev=645
1300: next=none prev=1200
0: next=600 prev=none
\`\`\``,
          starter: String.raw`#include <iostream>
#include <iterator>
#include <set>

int main() {
    int n;
    std::cin >> n;
    std::set<int> times;
    for (int i = 0; i < n; ++i) {
        int t;
        std::cin >> t;
        times.insert(t);
    }
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int t;
        std::cin >> t;
        // TODO: lower_bound for next; std::prev for prev; none when absent
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <iterator>
#include <set>

int main() {
    int n;
    std::cin >> n;
    std::set<int> times;
    for (int i = 0; i < n; ++i) {
        int t;
        std::cin >> t;
        times.insert(t);
    }
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int t;
        std::cin >> t;
        const auto next = times.lower_bound(t);
        std::cout << t << ": next=";
        if (next == times.end()) std::cout << "none";
        else std::cout << *next;
        std::cout << " prev=";
        if (next == times.begin()) std::cout << "none";
        else std::cout << *std::prev(next);
        std::cout << '\n';
    }
    return 0;
}
`,
          hints: [
            "times.lower_bound(t) is the first element not less than t, or end() when every element is smaller.",
            "The element before lower_bound(t) is the largest element strictly less than t — if lower_bound(t) is not begin().",
            "std::prev(it) on a set iterator is fine: set iterators are bidirectional.",
          ],
          cases: [
            { stdin: "5\n600 645 700 900 1200\n4\n630\n700\n1300\n0\n", expected: "630: next=645 prev=600\n700: next=700 prev=645\n1300: next=none prev=1200\n0: next=600 prev=none\n" },
            { stdin: "3\n5 5 5\n2\n5\n6\n", expected: "5: next=5 prev=none\n6: next=none prev=5\n" },
            { stdin: "0\n2\n1\n99\n", expected: "1: next=none prev=none\n99: next=none prev=none\n", hidden: true },
            { stdin: "4\n10 20 30 40\n3\n25\n40\n41\n", expected: "25: next=30 prev=20\n40: next=40 prev=30\n41: next=none prev=40\n", hidden: true },
            { stdin: "2\n-10 10\n3\n-10\n-11\n0\n", expected: "-10: next=-10 prev=none\n-11: next=-10 prev=none\n0: next=10 prev=-10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::map<std::string, int> m;\nif (m[\"x\"] == 0) std::cout << m.size();\n```",
          options: ["0", "1", "nothing is printed", "compile error"],
          answer: 1,
          explanation: "`m[\"x\"]` inserts `x` with a value-initialised `0` before the comparison, so the condition is true and the map now has one element.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::map<std::string, int> m;\nm.insert({\"a\", 1});\nm.insert({\"a\", 2});\nstd::cout << m[\"a\"];\n```",
          options: ["1", "2", "3", "undefined behaviour"],
          answer: 0,
          explanation: "`insert` never overwrites: the second call returns `{iterator, false}` and leaves the value at 1. `m[\"a\"] = 2` or `insert_or_assign` would overwrite.",
        },
        {
          prompt: "`std::set<int> s{1, 3, 5, 7};` — what do `*s.lower_bound(5)` and `*s.upper_bound(5)` give?",
          options: ["5 and 5", "3 and 5", "5 and 7", "3 and 7"],
          answer: 2,
          explanation: "`lower_bound` is the first element not less than 5 (5 itself); `upper_bound` is the first element greater than 5 (7).",
        },
        {
          prompt: "Which statement about iterating a `std::map` is correct?",
          options: [
            "Elements come in insertion order",
            "Elements come in ascending key order and each is a `std::pair<const Key, T>`",
            "Elements come in an unspecified order",
            "Elements come in descending key order by default",
          ],
          answer: 1,
          explanation: "A map is a sorted tree; the key is `const` in the pair because changing it would break the ordering. Insertion order is what a vector keeps; unspecified order is the unordered containers.",
        },
        {
          prompt: "A function takes `const std::map<std::string, int>& m`. Which lookup compiles?",
          options: ["`m[\"k\"]`", "`m.find(\"k\")`", "`m[\"k\"] = 0`", "`m.operator[](\"k\")`"],
          answer: 1,
          explanation: "`operator[]` may insert, so it has no `const` overload and cannot be called on a const map in any spelling. `find`, `count`, `contains` and `at` are the const lookups.",
        },
        {
          prompt: "Which call is O(log n) on a `std::map` with n elements?",
          options: ["`m.size()`", "`m.find(k)`", "`std::distance(m.begin(), it)`", "`m.clear()`"],
          answer: 1,
          explanation: "`find` walks one root-to-leaf path of the balanced tree. `size()` is O(1), `clear()` destroys every node in O(n), and `std::distance` steps a bidirectional iterator one element at a time.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::set<int, std::greater<int>> s{1, 2, 3};\nstd::cout << *s.begin();\n```",
          options: ["1", "3", "2", "compile error"],
          answer: 1,
          explanation: "The comparator decides the order: with `std::greater` the set runs 3, 2, 1, so `begin()` is the largest element.",
        },
      ],
    },
    {
      slug: "unordered-containers",
      file: "05-unordered-containers.md",
      exercises: [
        {
          title: "Top words, hashed then sorted",
          prompt: `Read an integer \`k\` on the first line, then free text until the end of input. Normalise each token as in the previous lesson (keep letters and digits, lower-case, skip empties) and count the words in a \`std::unordered_map<std::string, int>\`. Then print the \`k\` most frequent words as \`<word> <count>\`, most frequent first and **ties broken alphabetically** (fewer lines if there are fewer words), followed by \`distinct=<number of distinct words>\`.

An unordered container has no useful iteration order, so **copy its entries into a \`std::vector\` and sort that** with a comparator before printing. Never print the map directly.

**Input:** \`k\`, then text.
**Output:** up to \`k\` lines, then the summary line.

\`\`\`text
3
the cat saw the other cat the end
\`\`\`
prints
\`\`\`text
the 3
cat 2
end 1
distinct=5
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cctype>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

std::string normalise(const std::string& token) {
    std::string out;
    for (char c : token) {
        const unsigned char uc = static_cast<unsigned char>(c);
        if (std::isalnum(uc)) out += static_cast<char>(std::tolower(uc));
    }
    return out;
}

int main() {
    int k;
    std::cin >> k;
    std::unordered_map<std::string, int> freq;
    std::string token;
    while (std::cin >> token) {
        // TODO: normalise and count
    }
    // TODO: copy into a std::vector<std::pair<std::string, int>>, sort by count desc then word asc
    // TODO: print up to k rows, then distinct=<n>
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cctype>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

std::string normalise(const std::string& token) {
    std::string out;
    for (char c : token) {
        const unsigned char uc = static_cast<unsigned char>(c);
        if (std::isalnum(uc)) out += static_cast<char>(std::tolower(uc));
    }
    return out;
}

int main() {
    int k;
    std::cin >> k;
    std::unordered_map<std::string, int> freq;
    std::string token;
    while (std::cin >> token) {
        const std::string word = normalise(token);
        if (!word.empty()) ++freq[word];
    }
    std::vector<std::pair<std::string, int>> rows(freq.begin(), freq.end());
    std::sort(rows.begin(), rows.end(), [](const auto& a, const auto& b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    const std::size_t shown = std::min(rows.size(), static_cast<std::size_t>(k));
    for (std::size_t i = 0; i < shown; ++i) std::cout << rows[i].first << ' ' << rows[i].second << '\n';
    std::cout << "distinct=" << freq.size() << '\n';
    return 0;
}
`,
          hints: [
            "std::vector<std::pair<std::string, int>> rows(freq.begin(), freq.end()); copies every entry in one line.",
            "The comparator returns a.second > b.second when counts differ, otherwise a.first < b.first.",
            "Print std::min(rows.size(), k) rows — there may be fewer than k distinct words.",
          ],
          cases: [
            { stdin: "3\nthe cat saw the other cat the end\n", expected: "the 3\ncat 2\nend 1\ndistinct=5\n" },
            { stdin: "10\nb a b a c\n", expected: "a 2\nb 2\nc 1\ndistinct=3\n" },
            { stdin: "2\n\n", expected: "distinct=0\n", hidden: true },
            { stdin: "1\nZ z Y y y\n", expected: "y 3\ndistinct=2\n", hidden: true },
            { stdin: "5\none two three four five six\n", expected: "five 1\nfour 1\none 1\nsix 1\nthree 1\ndistinct=6\n", hidden: true },
          ],
        },
        {
          title: "Visited cells with a custom-hash std::unordered_set",
          prompt: `A robot starts at \`(0, 0)\` and reads one line of moves: \`U\` (\`y + 1\`), \`D\` (\`y - 1\`), \`L\` (\`x - 1\`), \`R\` (\`x + 1\`). Track every cell it has stood on in an \`std::unordered_set<Point, PointHash>\`, where \`Point\` is a struct with \`int x, y\` and a defaulted \`operator==\`, and \`PointHash\` is a functor that combines the two members' hashes. The start cell counts as visited. Print \`visited=<distinct cells>\`, then \`first revisit=<step>\` — the 1-based number of the first move that lands on a cell already visited — or \`first revisit=none\`, then \`end=(<x>,<y>)\`.

The hash values themselves must never appear in the output; \`insert(...).second\` is all the program needs.

**Input:** one line of \`U\`/\`D\`/\`L\`/\`R\` characters (possibly empty).
**Output:** three lines.

Example: \`RRUULLDD\` →
\`\`\`text
visited=8
first revisit=8
end=(0,0)
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_set>

struct Point {
    int x;
    int y;
    bool operator==(const Point&) const = default;
};

struct PointHash {
    std::size_t operator()(const Point& p) const noexcept {
        // TODO: combine std::hash<int>{}(p.x) and std::hash<int>{}(p.y)
        (void)p;
        return 0;
    }
};

int main() {
    std::string moves;
    std::getline(std::cin, moves);
    std::unordered_set<Point, PointHash> visited;
    Point at{0, 0};
    visited.insert(at);
    // TODO: walk the moves, insert each cell, remember the first move whose insert reports false
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_set>

struct Point {
    int x;
    int y;
    bool operator==(const Point&) const = default;
};

struct PointHash {
    std::size_t operator()(const Point& p) const noexcept {
        const std::size_t hx = std::hash<int>{}(p.x);
        const std::size_t hy = std::hash<int>{}(p.y);
        return hx ^ (hy + 0x9e3779b9 + (hx << 6) + (hx >> 2));
    }
};

int main() {
    std::string moves;
    std::getline(std::cin, moves);
    std::unordered_set<Point, PointHash> visited;
    Point at{0, 0};
    visited.insert(at);
    int firstRevisit = 0;
    for (std::size_t i = 0; i < moves.size(); ++i) {
        switch (moves[i]) {
            case 'U': ++at.y; break;
            case 'D': --at.y; break;
            case 'L': --at.x; break;
            case 'R': ++at.x; break;
            default: continue;
        }
        const bool fresh = visited.insert(at).second;
        if (!fresh && firstRevisit == 0) firstRevisit = static_cast<int>(i) + 1;
    }
    std::cout << "visited=" << visited.size() << '\n';
    if (firstRevisit == 0) std::cout << "first revisit=none\n";
    else std::cout << "first revisit=" << firstRevisit << '\n';
    std::cout << "end=(" << at.x << ',' << at.y << ")\n";
    return 0;
}
`,
          hints: [
            "Any hash that mixes both members works: hx ^ (hy + 0x9e3779b9 + (hx << 6) + (hx >> 2)) is the usual combine.",
            "visited.insert(at).second is false exactly when the cell was already in the set.",
            "Remember only the first revisit; keep walking afterwards so visited and end are right.",
          ],
          cases: [
            { stdin: "RRUULLDD\n", expected: "visited=8\nfirst revisit=8\nend=(0,0)\n" },
            { stdin: "RLRL\n", expected: "visited=2\nfirst revisit=2\nend=(0,0)\n" },
            { stdin: "\n", expected: "visited=1\nfirst revisit=none\nend=(0,0)\n", hidden: true },
            { stdin: "UUUU\n", expected: "visited=5\nfirst revisit=none\nend=(0,4)\n", hidden: true },
            { stdin: "DDLLUURRD\n", expected: "visited=8\nfirst revisit=8\nend=(0,-1)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::unordered_set<int> s{1, 2, 3};\nfor (int x : s) std::cout << x;\n```",
          options: ["`123`", "`321`", "Some permutation of 1, 2 and 3 — the order is unspecified", "compile error"],
          answer: 2,
          explanation: "Iteration follows the buckets, and the standard says nothing about which bucket holds which key. Any fixed answer is an assumption about one library version.",
        },
        {
          prompt: "What is a hash table's load factor?",
          options: ["The number of buckets", "`size() / bucket_count()`", "The fraction of buckets that are empty", "The length of the longest chain"],
          answer: 1,
          explanation: "The load factor is elements per bucket on average; when it would exceed `max_load_factor()` (1.0 by default) the table rehashes into more buckets.",
        },
        {
          prompt: "What does a `struct Point` need before it can be a key in `std::unordered_set<Point, PointHash>`?",
          options: ["Only `operator<`", "A hash functor and `operator==`", "A hash functor and `operator<`", "Nothing — the compiler derives a hash from the members"],
          answer: 1,
          explanation: "The table hashes to find the bucket and then compares with `==` inside it. `operator<` is what the ordered containers need; C++ never synthesises a hash.",
        },
        {
          prompt: "An insertion into an `std::unordered_map` triggers a rehash. Which stays valid?",
          options: ["Every iterator", "Pointers and references to elements, but no iterators", "Nothing", "Iterators, but no references"],
          answer: 1,
          explanation: "A rehash re-links the existing nodes into new buckets without moving the elements, so references and pointers survive while every iterator is invalidated.",
        },
        {
          prompt: "What is the worst-case complexity of `find` on an `std::unordered_map` with n elements?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          answer: 2,
          explanation: "If every key hashes into the same bucket, `find` walks one chain of n elements. The O(1) figure is the average with a good hash.",
        },
        {
          prompt: "Which task calls for `std::map` rather than `std::unordered_map`?",
          options: [
            "Counting how often each word occurs",
            "Testing whether an id has been seen",
            "Finding the smallest key that is not less than k",
            "Caching results by an integer key",
          ],
          answer: 2,
          explanation: "That is `lower_bound`, which only an ordered container can answer. The other three are plain lookups where the unordered container is faster.",
        },
        {
          prompt: "`std::unordered_map<std::pair<int, int>, int> m;` — what happens?",
          options: [
            "It works: pairs hash by combining their members",
            "Compile error: there is no `std::hash` for `std::pair`",
            "It compiles but every pair lands in one bucket",
            "It works only if both `int`s are non-negative",
          ],
          answer: 1,
          explanation: "The standard provides `std::hash` for the arithmetic types, pointers, strings and a few library types, but not for `std::pair` or `std::tuple`. Supply a functor or encode the pair as one integer.",
        },
      ],
    },
    {
      slug: "iterators-and-invalidation",
      file: "06-iterators-and-invalidation.md",
      exercises: [
        {
          title: "Close the small accounts",
          prompt: `Read \`n\`, then \`n\` lines of \`<name> <balance>\` into a \`std::map<std::string, int>\` (a repeated name keeps the last balance), then a threshold \`t\`. Walk the map **once with an explicit iterator**: for every account whose balance is below \`t\`, print \`closed <name> <balance>\` and erase it with \`it = accounts.erase(it)\`; for every other account print \`kept <name> <balance>\` and advance. Finish with \`remaining=<size>\`.

The point of the exercise is the erase-while-iterating shape — advance only in the branch that did not erase. Do not use \`std::erase_if\` here.

**Input:** \`n\`, \`n\` lines, then \`t\`.
**Output:** one line per account in key order, then the summary line.

\`\`\`text
4
bob 50
ada 120
cy 5
dee 75
60
\`\`\`
prints
\`\`\`text
kept ada 120
closed bob 50
closed cy 5
kept dee 75
remaining=2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> accounts;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int balance;
        std::cin >> name >> balance;
        accounts[name] = balance;
    }
    int threshold;
    std::cin >> threshold;
    // TODO: for (auto it = accounts.begin(); it != accounts.end(); ) { ... }
    std::cout << "remaining=" << accounts.size() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> accounts;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int balance;
        std::cin >> name >> balance;
        accounts[name] = balance;
    }
    int threshold;
    std::cin >> threshold;
    for (auto it = accounts.begin(); it != accounts.end(); ) {
        if (it->second < threshold) {
            std::cout << "closed " << it->first << ' ' << it->second << '\n';
            it = accounts.erase(it);
        } else {
            std::cout << "kept " << it->first << ' ' << it->second << '\n';
            ++it;
        }
    }
    std::cout << "remaining=" << accounts.size() << '\n';
    return 0;
}
`,
          hints: [
            "Leave the for loop's third clause empty; the body decides whether to erase or advance.",
            "erase returns the iterator to the element after the erased one — assign it, do not also ++it.",
            "Print the line before erasing; after erase the old iterator must not be touched.",
          ],
          cases: [
            { stdin: "4\nbob 50\nada 120\ncy 5\ndee 75\n60\n", expected: "kept ada 120\nclosed bob 50\nclosed cy 5\nkept dee 75\nremaining=2\n" },
            { stdin: "3\nx 1\ny 2\nz 3\n10\n", expected: "closed x 1\nclosed y 2\nclosed z 3\nremaining=0\n" },
            { stdin: "2\nb 0\na -5\n0\n", expected: "closed a -5\nkept b 0\nremaining=1\n", hidden: true },
            { stdin: "1\nsolo 7\n7\n", expected: "kept solo 7\nremaining=1\n", hidden: true },
            { stdin: "3\np 9\nq 8\nr 7\n8\n", expected: "kept p 9\nkept q 8\nclosed r 7\nremaining=2\n", hidden: true },
          ],
        },
        {
          title: "Playlist cursor on a std::list",
          prompt: `Read \`n\` (at least 1), then \`n\` track names (one word each) into a \`std::list<std::string>\`, and keep a **cursor** — a list iterator — that starts on the first track. Then apply commands until the end of input:

- \`next\` — move the cursor forward, wrapping from the last track to the first;
- \`prev\` — move it backward, wrapping from the first to the last;
- \`jump k\` — move forward \`k\` steps with wrapping (\`k ≥ 0\`; reduce it modulo the size first);
- \`insert <name>\` — insert a track **before** the cursor; the cursor keeps pointing at the same track;
- \`play\` — print \`playing <track> at <index>\`, the index being \`std::distance(playlist.begin(), cursor)\`;
- \`reverse\` — print \`reverse:\` followed by every track from last to first, via \`rbegin()\`/\`rend()\`.

Use \`std::next\`, \`std::prev\` and \`std::distance\` rather than arithmetic — a list iterator has no \`+\`.

**Input:** \`n\`, the names, then commands.
**Output:** one line per \`play\` or \`reverse\`.

\`\`\`text
3
alpha beta gamma
play
next
play
next
next
play
jump 4
play
reverse
\`\`\`
prints
\`\`\`text
playing alpha at 0
playing beta at 1
playing alpha at 0
playing beta at 1
reverse: gamma beta alpha
\`\`\``,
          starter: String.raw`#include <iostream>
#include <iterator>
#include <list>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::list<std::string> playlist;
    for (int i = 0; i < n; ++i) {
        std::string track;
        std::cin >> track;
        playlist.push_back(track);
    }
    auto cursor = playlist.begin();
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "next") {
            // TODO: advance, wrap at end()
        } else if (cmd == "prev") {
            // TODO: wrap at begin(), then step back
        } else if (cmd == "jump") {
            long long k;
            std::cin >> k;
            // TODO: k % size steps forward with wrapping
        } else if (cmd == "insert") {
            std::string track;
            std::cin >> track;
            // TODO: playlist.insert(cursor, track)
        } else if (cmd == "play") {
            // TODO
        } else if (cmd == "reverse") {
            // TODO: rbegin()/rend()
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <iterator>
#include <list>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::list<std::string> playlist;
    for (int i = 0; i < n; ++i) {
        std::string track;
        std::cin >> track;
        playlist.push_back(track);
    }
    auto cursor = playlist.begin();
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "next") {
            ++cursor;
            if (cursor == playlist.end()) cursor = playlist.begin();
        } else if (cmd == "prev") {
            if (cursor == playlist.begin()) cursor = playlist.end();
            --cursor;
        } else if (cmd == "jump") {
            long long k;
            std::cin >> k;
            const long long size = static_cast<long long>(playlist.size());
            const long long steps = k % size;
            const long long ahead = std::distance(cursor, playlist.end());
            if (steps < ahead) cursor = std::next(cursor, steps);
            else cursor = std::next(playlist.begin(), steps - ahead);
        } else if (cmd == "insert") {
            std::string track;
            std::cin >> track;
            playlist.insert(cursor, track);   // before the cursor; list iterators stay valid
        } else if (cmd == "play") {
            std::cout << "playing " << *cursor << " at " << std::distance(playlist.begin(), cursor) << '\n';
        } else if (cmd == "reverse") {
            std::cout << "reverse:";
            for (auto rit = playlist.rbegin(); rit != playlist.rend(); ++rit) std::cout << ' ' << *rit;
            std::cout << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "next: ++cursor, then if it equals end() set it to begin(). prev: if it equals begin() set it to end(), then --cursor.",
            "jump: std::distance(cursor, playlist.end()) is how many steps remain before wrapping; std::next does the rest.",
            "insert(cursor, track) puts the new track before the cursor and does not invalidate it — the index printed by play grows by one.",
          ],
          cases: [
            { stdin: "3\nalpha beta gamma\nplay\nnext\nplay\nnext\nnext\nplay\nprev\nprev\nplay\njump 4\nplay\nreverse\n", expected: "playing alpha at 0\nplaying beta at 1\nplaying alpha at 0\nplaying beta at 1\nplaying gamma at 2\nreverse: gamma beta alpha\n" },
            { stdin: "2\na b\ninsert z\nplay\nprev\nplay\nreverse\n", expected: "playing a at 1\nplaying z at 0\nreverse: b a z\n" },
            { stdin: "1\nsolo\nnext\nplay\nprev\nplay\njump 7\nplay\n", expected: "playing solo at 0\nplaying solo at 0\nplaying solo at 0\n", hidden: true },
            { stdin: "4\nw x y z\njump 3\nplay\ninsert q\nplay\nprev\nplay\nreverse\n", expected: "playing z at 3\nplaying z at 4\nplaying q at 3\nreverse: z q y x w\n", hidden: true },
            { stdin: "3\na b c\njump 5\nplay\njump 0\nplay\nnext\nplay\n", expected: "playing c at 2\nplaying c at 2\nplaying a at 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What iterator category does `std::list` provide, and what does `std::vector` provide?",
          options: ["Both random access", "Bidirectional and random access (contiguous)", "Forward and bidirectional", "Random access and contiguous"],
          answer: 1,
          explanation: "List nodes link both ways but cannot be indexed, so the iterator is bidirectional. A vector's iterator supports `+ n` and is contiguous, the strongest category.",
        },
        {
          prompt: "`std::distance(s.begin(), s.find(7))` on a `std::set<int>` with a million elements costs…",
          options: ["O(1)", "O(log n)", "O(n)", "It does not compile"],
          answer: 2,
          explanation: "`find` is O(log n), but `std::distance` on a bidirectional iterator steps one element at a time, so the call is linear in the position of 7.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> v{1, 2, 3, 4};\nfor (auto it = v.begin(); it != v.end(); ) {\n    if (*it % 2 == 0) it = v.erase(it);\n    else ++it;\n}\nstd::cout << v.size();\n```",
          options: ["4", "2", "3", "undefined behaviour"],
          answer: 1,
          explanation: "This is the correct idiom: `erase` returns the iterator to the next element and the loop advances only when it did not erase. Both even numbers go.",
        },
        {
          prompt: "`for (auto it = v.begin(); it != v.end(); ++it) if (*it == 2) v.erase(it);` on a vector — what is wrong?",
          options: [
            "Nothing; `erase` handles the iterator",
            "`it` is invalidated by `erase`; the `++it` then uses it — undefined behaviour",
            "It compiles but removes the wrong element",
            "`erase` needs a range, not a single iterator",
          ],
          answer: 1,
          explanation: "After `erase(it)` every iterator from `it` onwards is invalid, including `it` itself; incrementing it is undefined behaviour and, in practice, skips an element or runs past `end()`.",
        },
        {
          prompt: "`c.erase(it++);` is a correct erase-while-iterating step for which containers?",
          options: [
            "All standard containers",
            "Only `std::vector` and `std::deque`",
            "Node-based containers such as `std::map`, `std::set` and `std::list`",
            "None — post-increment is always wrong here",
          ],
          answer: 2,
          explanation: "The post-increment steps `it` before the erase and hands the old value to `erase`; that is fine when only the erased node is invalidated. On a vector the stepped iterator is invalidated too, so use `it = c.erase(it)` everywhere.",
        },
        {
          prompt: "What is the difference between `std::next(it, 3)` and `std::advance(it, 3)`?",
          options: [
            "No difference",
            "`std::next` returns a moved copy and leaves `it` alone; `std::advance` moves `it` itself and returns nothing",
            "`std::next` works only on random-access iterators",
            "`std::advance` returns the new iterator, `std::next` does not",
          ],
          answer: 1,
          explanation: "`std::next`/`std::prev` are pure functions; `std::advance` mutates its argument. Both work on every category, stepping when the iterator cannot jump.",
        },
        {
          prompt: "Which container's `insert` never invalidates existing iterators?",
          options: ["`std::vector`", "`std::deque`", "`std::unordered_map`", "`std::list`"],
          answer: 3,
          explanation: "List (and map/set) nodes never move, so other iterators are untouched. A vector may reallocate, a deque invalidates iterators even on an end insert, and an unordered map may rehash.",
        },
      ],
    },
    {
      slug: "containers-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Shortest path on a grid with std::queue",
          prompt: `Read \`R C\`, then \`R\` rows of \`C\` characters: \`.\` open, \`#\` wall, \`S\` the start and \`E\` the exit (each appears exactly once). Print the length of the shortest path from \`S\` to \`E\` moving up, down, left or right through open cells, or \`-1\` when the exit cannot be reached.

Use breadth-first search with a \`std::queue\` of cells and a \`std::vector<std::vector<int>>\` of distances initialised to \`-1\`, which doubles as the visited set — mark a cell when it is **pushed**.

**Input:** \`R C\`, then \`R\` rows.
**Output:** one integer.

\`\`\`text
3 4
S..#
.#..
...E
\`\`\`
prints \`5\`.`,
          starter: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

int main() {
    int rows, cols;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    std::pair<int, int> start{0, 0};
    std::pair<int, int> goal{0, 0};
    for (int r = 0; r < rows; ++r) {
        std::cin >> grid[r];
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] == 'S') start = {r, c};
            if (grid[r][c] == 'E') goal = {r, c};
        }
    }
    std::vector<std::vector<int>> dist(rows, std::vector<int>(cols, -1));
    std::queue<std::pair<int, int>> frontier;
    // TODO: BFS from start; print dist at goal, or -1
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

int main() {
    int rows, cols;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    std::pair<int, int> start{0, 0};
    std::pair<int, int> goal{0, 0};
    for (int r = 0; r < rows; ++r) {
        std::cin >> grid[r];
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] == 'S') start = {r, c};
            if (grid[r][c] == 'E') goal = {r, c};
        }
    }
    std::vector<std::vector<int>> dist(rows, std::vector<int>(cols, -1));
    std::queue<std::pair<int, int>> frontier;
    dist[start.first][start.second] = 0;
    frontier.push(start);
    const int dr[] = {-1, 1, 0, 0};
    const int dc[] = {0, 0, -1, 1};
    while (!frontier.empty()) {
        const auto [r, c] = frontier.front();
        frontier.pop();
        if (r == goal.first && c == goal.second) break;
        for (int k = 0; k < 4; ++k) {
            const int nr = r + dr[k];
            const int nc = c + dc[k];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (grid[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            frontier.push({nr, nc});
        }
    }
    std::cout << dist[goal.first][goal.second] << '\n';
    return 0;
}
`,
          hints: [
            "Push the start with distance 0; pop the front, and for each of the four neighbours that is inside, open and unvisited, set its distance and push it.",
            "dist[nr][nc] != -1 means the cell was already reached by a shorter or equal path — skip it.",
            "When the queue empties without reaching E, dist at E is still -1, which is exactly the answer to print.",
          ],
          cases: [
            { stdin: "3 4\nS..#\n.#..\n...E\n", expected: "5\n" },
            { stdin: "2 2\nS#\n#E\n", expected: "-1\n" },
            { stdin: "1 5\nS...E\n", expected: "4\n", hidden: true },
            { stdin: "3 3\nS.#\n##.\n..E\n", expected: "-1\n", hidden: true },
            { stdin: "4 4\nS...\n.##.\n.#E.\n....\n", expected: "6\n", hidden: true },
          ],
        },
        {
          title: "LRU cache from a std::list and an std::unordered_map",
          prompt: `Implement a least-recently-used cache. Read its capacity (at least 1), then commands until the end of input: \`get <key>\` prints \`hit <value>\` and marks the key most recently used, or \`miss\`; \`put <key> <value>\` inserts or updates the key and marks it most recently used, and when that pushes the size past the capacity it evicts the least recently used key and prints \`evict <key>\`. After the last command print \`cache:\` followed by every \`<key>=<value>\` from most to least recently used.

Keys and values are integers. The recency order lives in a \`std::list<std::pair<int, int>>\` (most recent at the front); a \`std::unordered_map<int, std::list<…>::iterator>\` finds a key's node in O(1). Moving a node to the front is one \`splice\`, and list iterators stay valid across it — which is why the map may hold them. The final line comes from the **list**, never from the map.

**Input:** the capacity, then commands.
**Output:** one line per \`get\` and per eviction, then the \`cache:\` line.

\`\`\`text
2
put 1 10
put 2 20
get 1
put 3 30
get 2
get 3
put 1 11
\`\`\`
prints
\`\`\`text
hit 10
evict 2
miss
hit 30
cache: 1=11 3=30
\`\`\``,
          starter: String.raw`#include <iostream>
#include <list>
#include <string>
#include <unordered_map>
#include <utility>

int main() {
    std::size_t capacity;
    std::cin >> capacity;
    std::list<std::pair<int, int>> order;                                   // most recent at the front
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> where;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "get") {
            int key;
            std::cin >> key;
            // TODO: miss, or splice the node to the front and print hit <value>
        } else if (cmd == "put") {
            int key, value;
            std::cin >> key >> value;
            // TODO: update + splice, or push_front + record; evict order.back() when over capacity
        }
    }
    std::cout << "cache:";
    for (const auto& [key, value] : order) std::cout << ' ' << key << '=' << value;
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <list>
#include <string>
#include <unordered_map>
#include <utility>

int main() {
    std::size_t capacity;
    std::cin >> capacity;
    std::list<std::pair<int, int>> order;                                   // most recent at the front
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> where;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "get") {
            int key;
            std::cin >> key;
            const auto it = where.find(key);
            if (it == where.end()) {
                std::cout << "miss\n";
            } else {
                order.splice(order.begin(), order, it->second);   // to the front; the iterator stays valid
                std::cout << "hit " << it->second->second << '\n';
            }
        } else if (cmd == "put") {
            int key, value;
            std::cin >> key >> value;
            const auto it = where.find(key);
            if (it != where.end()) {
                it->second->second = value;
                order.splice(order.begin(), order, it->second);
            } else {
                order.push_front({key, value});
                where[key] = order.begin();
                if (order.size() > capacity) {
                    std::cout << "evict " << order.back().first << '\n';
                    where.erase(order.back().first);
                    order.pop_back();
                }
            }
        }
    }
    std::cout << "cache:";
    for (const auto& [key, value] : order) std::cout << ' ' << key << '=' << value;
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "order.splice(order.begin(), order, it) moves the node it points at to the front of the same list in O(1).",
            "On a put of a new key: push_front, store order.begin() in the map, then check order.size() > capacity.",
            "Evict from the back: erase its key from the map first (you need order.back().first), then pop_back.",
          ],
          cases: [
            { stdin: "2\nput 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 3\nput 1 11\n", expected: "hit 10\nevict 2\nmiss\nhit 30\ncache: 1=11 3=30\n" },
            { stdin: "1\nget 5\nput 5 1\nput 6 2\nget 5\nget 6\n", expected: "miss\nevict 5\nmiss\nhit 2\ncache: 6=2\n" },
            { stdin: "3\nput 1 1\nput 2 2\nput 3 3\nput 4 4\nget 1\nget 2\nput 2 22\nput 5 5\n", expected: "evict 1\nmiss\nhit 2\nevict 3\ncache: 5=5 2=22 4=4\n", hidden: true },
            { stdin: "2\nget 1\n", expected: "miss\ncache:\n", hidden: true },
            { stdin: "2\nput 7 1\nput 7 2\nput 7 3\nget 7\nput 8 8\nput 9 9\nget 7\n", expected: "hit 3\nevict 7\nmiss\ncache: 9=9 8=8\n", hidden: true },
          ],
        },
        {
          title: "Leaderboard on a std::set with a custom order",
          prompt: `Keep a leaderboard. Commands arrive one per line until the end of input:

- \`set <name> <score>\` — add the player or replace their score;
- \`remove <name>\` — remove the player, or print \`remove <name>=unknown\`;
- \`rank <name>\` — print \`rank <name>=<r>\`, the player's 1-based position, or \`rank <name>=unknown\`;
- \`top <k>\` — print \`top:\` followed by the first \`k\` players as \`<name>(<score>)\`, space-separated (fewer if there are fewer players);
- \`above <s>\` — print \`above <s>: <count>\`, the number of players whose score is **strictly greater** than \`s\`.

The order is **highest score first, ties by name ascending**. Use two containers: a \`std::map<std::string, int>\` from name to score, and a \`std::set<Entry, Comparator>\` of \`{score, name}\` structs ordered by a comparator struct. Updating a score means erasing the old entry from the set and inserting the new one. \`above\` is \`std::distance(board.begin(), board.lower_bound({s, ""}))\` — with this ordering the key \`{s, ""}\` sorts before every real entry that has score \`s\`.

**Input:** commands until end of input.
**Output:** one line per \`rank\`, \`top\`, \`above\` or failed \`remove\`.

\`\`\`text
set ada 50
set bob 70
set cy 50
top 2
rank cy
set ada 90
rank ada
above 50
remove bob
top 5
rank bob
\`\`\`
prints
\`\`\`text
top: bob(70) ada(50)
rank cy=3
rank ada=1
above 50: 2
top: ada(90) cy(50)
rank bob=unknown
\`\`\``,
          starter: String.raw`#include <iostream>
#include <iterator>
#include <map>
#include <set>
#include <string>

struct Entry {
    int score;
    std::string name;
};

struct HigherScoreFirst {
    bool operator()(const Entry& a, const Entry& b) const {
        // TODO: higher score first, then name ascending
        (void)a;
        (void)b;
        return false;
    }
};

int main() {
    std::map<std::string, int> scores;
    std::set<Entry, HigherScoreFirst> board;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "set") {
            std::string name;
            int score;
            std::cin >> name >> score;
            // TODO
        } else if (cmd == "remove") {
            std::string name;
            std::cin >> name;
            // TODO
        } else if (cmd == "rank") {
            std::string name;
            std::cin >> name;
            // TODO
        } else if (cmd == "top") {
            int k;
            std::cin >> k;
            // TODO
        } else if (cmd == "above") {
            int s;
            std::cin >> s;
            // TODO
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <iterator>
#include <map>
#include <set>
#include <string>

struct Entry {
    int score;
    std::string name;
};

struct HigherScoreFirst {
    bool operator()(const Entry& a, const Entry& b) const {
        if (a.score != b.score) return a.score > b.score;
        return a.name < b.name;
    }
};

int main() {
    std::map<std::string, int> scores;
    std::set<Entry, HigherScoreFirst> board;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "set") {
            std::string name;
            int score;
            std::cin >> name >> score;
            if (auto it = scores.find(name); it != scores.end()) {
                board.erase(Entry{it->second, name});
                it->second = score;
            } else {
                scores.emplace(name, score);
            }
            board.insert(Entry{score, name});
        } else if (cmd == "remove") {
            std::string name;
            std::cin >> name;
            const auto it = scores.find(name);
            if (it == scores.end()) {
                std::cout << "remove " << name << "=unknown\n";
            } else {
                board.erase(Entry{it->second, name});
                scores.erase(it);
            }
        } else if (cmd == "rank") {
            std::string name;
            std::cin >> name;
            const auto it = scores.find(name);
            if (it == scores.end()) {
                std::cout << "rank " << name << "=unknown\n";
            } else {
                const auto pos = board.find(Entry{it->second, name});
                std::cout << "rank " << name << '=' << std::distance(board.begin(), pos) + 1 << '\n';
            }
        } else if (cmd == "top") {
            int k;
            std::cin >> k;
            std::cout << "top:";
            int shown = 0;
            for (auto it = board.begin(); it != board.end() && shown < k; ++it, ++shown) {
                std::cout << ' ' << it->name << '(' << it->score << ')';
            }
            std::cout << '\n';
        } else if (cmd == "above") {
            int s;
            std::cin >> s;
            const auto firstNotAbove = board.lower_bound(Entry{s, ""});
            std::cout << "above " << s << ": " << std::distance(board.begin(), firstNotAbove) << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "The comparator is a strict weak ordering: a.score > b.score, and only for equal scores a.name < b.name.",
            "To change a score, look the old one up in the map, erase {old, name} from the set, then insert {new, name}.",
            "rank is std::distance(board.begin(), board.find(entry)) + 1 — O(n), which is fine here.",
          ],
          cases: [
            { stdin: "set ada 50\nset bob 70\nset cy 50\ntop 2\nrank cy\nset ada 90\nrank ada\nabove 50\nremove bob\ntop 5\nrank bob\n", expected: "top: bob(70) ada(50)\nrank cy=3\nrank ada=1\nabove 50: 2\ntop: ada(90) cy(50)\nrank bob=unknown\n" },
            { stdin: "top 3\nabove 0\nset x 1\nremove y\nrank x\ntop 1\n", expected: "top:\nabove 0: 0\nremove y=unknown\nrank x=1\ntop: x(1)\n" },
            { stdin: "set b -5\nset a -5\nset c -5\ntop 3\nabove -5\nabove -6\nrank c\n", expected: "top: a(-5) b(-5) c(-5)\nabove -5: 0\nabove -6: 3\nrank c=3\n", hidden: true },
            { stdin: "set a 10\nset b 20\nset a 5\nrank a\nset b 5\nrank b\ntop 1\nremove a\nremove a\ntop 2\n", expected: "rank a=2\nrank b=2\ntop: a(5)\nremove a=unknown\ntop: b(5)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the complexity of `push_back` on a `std::vector`?",
          options: ["Always O(1)", "Amortised O(1): usually constant, occasionally O(n) when it reallocates", "O(log n)", "O(n) every time"],
          answer: 1,
          explanation: "Geometric growth means the O(n) reallocation happens rarely enough that n pushes cost O(n) in total.",
        },
        {
          prompt: "Which container keeps its elements sorted by key at all times?",
          options: ["`std::unordered_map`", "`std::map`", "`std::vector`", "`std::deque`"],
          answer: 1,
          explanation: "A map is a balanced tree ordered by its comparator. The unordered map is a hash table with no order; a vector and a deque keep insertion order.",
        },
        {
          prompt: "What does this do?\n\n```cpp\nstd::vector<int> v{1, 2, 3};\nint& r = v[0];\nv.reserve(100);\nstd::cout << r;\n```",
          options: ["Prints `1`", "Undefined behaviour — `reserve` reallocated and `r` dangles", "Prints `0`", "Compile error"],
          answer: 1,
          explanation: "`reserve(100)` on a vector of capacity 3 allocates a new block and moves the elements; every reference into the old block, including `r`, is invalidated. That it might print 1 anyway is what makes the bug dangerous.",
        },
        {
          prompt: "Which adaptor wraps a `std::vector` by default?",
          options: ["`std::stack`", "`std::queue`", "`std::priority_queue`", "All three"],
          answer: 2,
          explanation: "A heap needs random access, so `std::priority_queue` defaults to `std::vector`; `std::stack` and `std::queue` default to `std::deque`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::priority_queue<int, std::vector<int>, std::greater<int>> pq;\nfor (int x : {5, 2, 8}) pq.push(x);\nstd::cout << pq.top();\n```",
          options: ["8", "5", "2", "compile error"],
          answer: 2,
          explanation: "`std::greater` turns the heap into a min-heap: the smallest element, 2, is on top.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::map<int, std::string> m;\nm[3] = \"c\";\nm[1] = \"a\";\nm[2] = \"b\";\nfor (const auto& [k, v] : m) std::cout << v;\n```",
          options: ["`cab`", "`abc`", "`cba`", "unspecified order"],
          answer: 1,
          explanation: "A map iterates in key order regardless of insertion order: 1, 2, 3 → `abc`. Unspecified order is the unordered map.",
        },
        {
          prompt: "`m.insert({k, v}).second` is `false`. What does that tell you?",
          options: ["The insertion failed because the map is full", "The key already existed and the stored value was not changed", "The value was replaced", "`k` compared equal to `end()`"],
          answer: 1,
          explanation: "`insert` never overwrites; the `bool` is `false` precisely when the key was already present. The iterator in the pair points at the existing element.",
        },
        {
          prompt: "`s.lower_bound(k)` on a `std::set<int> s` returns…",
          options: [
            "An iterator to the largest element less than `k`",
            "An iterator to the first element not less than `k`, or `end()` if there is none",
            "`true` if `k` is present",
            "An iterator to the first element greater than `k`",
          ],
          answer: 1,
          explanation: "'Not less than' is ≥. The first element strictly greater is `upper_bound`; the largest element below `k` is `std::prev(lower_bound(k))` when that is not `begin()`.",
        },
        {
          prompt: "Before printing the contents of an `std::unordered_map`, a judged program should…",
          options: [
            "Call `rehash(0)` so the order becomes sorted",
            "Copy the entries into a `std::vector` and sort them",
            "Use `std::map` for printing only — the order is the same",
            "Nothing: iteration order is insertion order",
          ],
          answer: 1,
          explanation: "The iteration order is unspecified and differs between library versions and table sizes. Sorting a copy is the only way to make the output deterministic.",
        },
        {
          prompt: "Which two things does a custom struct need to be a key in an unordered container?",
          options: ["`operator<` and `operator==`", "A hash functor (or `std::hash` specialisation) and `operator==`", "A hash functor and `operator<`", "A copy constructor and a destructor"],
          answer: 1,
          explanation: "Hash to pick the bucket, equality to find the element inside it. `operator<` is what the ordered containers need instead.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::list<int> l{1, 2, 3, 4, 5};\nfor (auto it = l.begin(); it != l.end(); ) {\n    if (*it % 2 == 1) it = l.erase(it);\n    else ++it;\n}\nfor (int x : l) std::cout << x;\n```",
          options: ["`135`", "`24`", "`12345`", "undefined behaviour"],
          answer: 1,
          explanation: "The idiom erases the odd elements and advances past the even ones; 2 and 4 remain.",
        },
        {
          prompt: "`std::sort(l.begin(), l.end());` where `l` is a `std::list<int>` — what happens?",
          options: ["Sorts the list", "Compile error: `std::sort` needs random-access iterators; use `l.sort()`", "Sorts it in O(n²)", "Undefined behaviour"],
          answer: 1,
          explanation: "A list iterator is bidirectional, and `std::sort` requires random access, so the call does not compile. `std::list::sort()` is the member that relinks nodes.",
        },
        {
          prompt: "Which of these invalidates *only* iterators to the erased element?",
          options: ["`v.erase(it)` on a `std::vector`", "`d.erase(it)` in the middle of a `std::deque`", "`m.erase(it)` on a `std::map`", "`s.erase(it)` on a `std::string`"],
          answer: 2,
          explanation: "Node-based containers unlink one node and touch nothing else. A vector or string shifts everything after the gap; a deque erase in the middle invalidates all of its iterators.",
        },
        {
          prompt: "What is the difference between `std::remove_if` and `std::erase_if`?",
          options: [
            "None; `erase_if` is the new name",
            "`remove_if` only moves the kept elements forward and returns the new end; `erase_if` (C++20) actually erases and returns the count removed",
            "`remove_if` works on any container, `erase_if` only on vectors",
            "`erase_if` is O(n²), `remove_if` is O(n)",
          ],
          answer: 1,
          explanation: "An algorithm cannot change a container's size — it only sees iterators — which is why the erase–remove idiom needs the `erase` call. `std::erase_if` takes the container itself and does both steps.",
        },
      ],
    },
  ],
});

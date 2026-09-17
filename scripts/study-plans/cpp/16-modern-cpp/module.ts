import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "modern-cpp",
  title: "Modern C++",
  blurb: "The standards from C++11 to C++23 and what compiles here; auto, decltype and structured bindings; constexpr, consteval and compile-time tables; the vocabulary types from tuple to span and chrono; concepts, ranges, <=> and std::format, with C++23 as reading.",
  icon: "modern",
  overview: `"Modern C++" is used two ways: as a version — anything from C++11 on — and as a style, the habits that make a program safe and short: RAII and no raw \`new\`, value semantics, \`const\` and \`constexpr\` by default, \`auto\` where the type is obvious, algorithms and ranges over hand-written loops, vocabulary types in every signature. The earlier modules taught those habits one at a time; this module steps back and shows them as a whole, names the standard each piece came from, and states exactly what this track's runtime — Clang 18, libstdc++ 14, \`-std=c++20\` — compiles and what it does not.

The five lessons move from history to the future. The standards lesson tables what C++11, 14, 17, 20 and 23 each added, introduces feature-test macros and the values they take on this judge, and fixes the C++23 boundary: \`std::print\`, \`std::expected\`, \`std::mdspan\` and deducing \`this\` are taught for reading and the quiz only. The deduction lesson settles \`auto\` (it copies), \`decltype\` (the parentheses rule), structured bindings over pairs, tuples, structs, arrays and map entries, the \`if\`/\`switch\` initialiser, \`using\` aliases, \`nullptr\` and the \`std::initializer_list\` quirk. The compile-time lesson separates \`const\`, \`constexpr\`, \`consteval\` and \`constinit\`, shows what a C++20 \`constexpr\` function may contain, builds a lookup table in \`std::array\` checked by \`static_assert\`, and explains the one \`consteval\` rule that stops a first attempt from compiling. The vocabulary lesson covers \`std::pair\` and \`std::tuple\` with \`std::tie\` and \`std::apply\`, \`std::span\`, \`<chrono>\` durations printed deterministically, and \`std::byte\`. The C++20 lesson puts concepts, ranges, \`<=>\`, \`std::format\`, designated initialisers and \`std::jthread\` side by side, sketches modules and coroutines, and looks at C++23 and how to keep up.

The exercises are whole programs that use each feature for real: a feature-to-standard lookup and a modern rewrite of a C-style program, a stock lookup with an \`if\` initialiser and bindings over a map, a struct and an array taken apart by structured bindings, a compile-time prime sieve and a \`consteval\` factorial table both proved by \`static_assert\`, a leaderboard sorted through \`std::tie\` and printed through \`std::apply\`, window sums over \`std::span\` slices, concept-constrained shapes printed with \`std::format\`, and a server table built with designated initialisers and sorted by a defaulted \`<=>\`. The checkpoint adds a \`<chrono>\` duration ledger, a day-of-year calculator on a \`constexpr\` prefix-sum table with \`std::optional\`, and a concept-constrained statistics function over a \`std::span\`.`,
  lessons: [
    {
      slug: "the-standards",
      file: "01-the-standards.md",
      exercises: [
        {
          title: "Which standard introduced it",
          prompt: `The starter holds a table mapping feature names to the standard that introduced them, as the two-digit year (\`"lambdas"\` → \`11\`, \`"concepts"\` → \`20\`). Read an integer \`n\`, then \`n\` feature names, one per line, and for each print \`<name>: C++<yy>\` when it is in the table and \`<name>: not in the table\` otherwise.

Look each name up **once**, with an \`if\` that declares the iterator in its initialiser (\`if (auto it = table.find(name); it != table.end())\`) — not \`count()\` followed by \`[]\`.

**Input:** \`n\`, then \`n\` names (lower-case, hyphenated, no spaces).
**Output:** \`n\` lines.

\`\`\`text
4
lambdas
concepts
structured-bindings
goto
\`\`\`
prints
\`\`\`text
lambdas: C++11
concepts: C++20
structured-bindings: C++17
goto: not in the table
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    // Feature name -> the standard that introduced it (its two-digit year).
    const std::map<std::string, int> introduced{
        {"auto", 11}, {"lambdas", 11}, {"range-for", 11}, {"nullptr", 11}, {"move-semantics", 11},
        {"unique-ptr", 11}, {"shared-ptr", 11}, {"constexpr", 11}, {"enum-class", 11}, {"static-assert", 11},
        {"make-unique", 14}, {"generic-lambdas", 14}, {"binary-literals", 14}, {"return-type-deduction", 14},
        {"optional", 17}, {"variant", 17}, {"string-view", 17}, {"structured-bindings", 17}, {"if-init", 17},
        {"if-constexpr", 17}, {"fold-expressions", 17}, {"filesystem", 17},
        {"concepts", 20}, {"ranges", 20}, {"format", 20}, {"span", 20}, {"spaceship", 20}, {"jthread", 20},
        {"designated-initialisers", 20}, {"coroutines", 20}, {"modules", 20}, {"consteval", 20},
        {"print", 23}, {"expected", 23}, {"mdspan", 23}, {"deducing-this", 23},
    };
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string feature;
        std::cin >> feature;
        // TODO: look the feature up once, then print "<name>: C++<yy>" or "<name>: not in the table"
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    // Feature name -> the standard that introduced it (its two-digit year).
    const std::map<std::string, int> introduced{
        {"auto", 11}, {"lambdas", 11}, {"range-for", 11}, {"nullptr", 11}, {"move-semantics", 11},
        {"unique-ptr", 11}, {"shared-ptr", 11}, {"constexpr", 11}, {"enum-class", 11}, {"static-assert", 11},
        {"make-unique", 14}, {"generic-lambdas", 14}, {"binary-literals", 14}, {"return-type-deduction", 14},
        {"optional", 17}, {"variant", 17}, {"string-view", 17}, {"structured-bindings", 17}, {"if-init", 17},
        {"if-constexpr", 17}, {"fold-expressions", 17}, {"filesystem", 17},
        {"concepts", 20}, {"ranges", 20}, {"format", 20}, {"span", 20}, {"spaceship", 20}, {"jthread", 20},
        {"designated-initialisers", 20}, {"coroutines", 20}, {"modules", 20}, {"consteval", 20},
        {"print", 23}, {"expected", 23}, {"mdspan", 23}, {"deducing-this", 23},
    };
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string feature;
        std::cin >> feature;
        if (auto it = introduced.find(feature); it != introduced.end()) {
            std::cout << feature << ": C++" << it->second << '\n';
        } else {
            std::cout << feature << ": not in the table\n";
        }
    }
    return 0;
}
`,
          hints: [
            "std::map::find returns end() when the key is absent; compare against it.",
            "The iterator declared in the if's initialiser is visible in both branches — it->second is the year.",
            "Print the literal text C++ followed by the integer; the stream inserts no spaces on its own.",
          ],
          cases: [
            { stdin: "4\nlambdas\nconcepts\nstructured-bindings\ngoto\n", expected: "lambdas: C++11\nconcepts: C++20\nstructured-bindings: C++17\ngoto: not in the table\n" },
            { stdin: "3\nprint\nformat\noptional\n", expected: "print: C++23\nformat: C++20\noptional: C++17\n" },
            { stdin: "1\nmake-unique\n", expected: "make-unique: C++14\n", hidden: true },
            { stdin: "3\nnullptr\nauto\nLambdas\n", expected: "nullptr: C++11\nauto: C++11\nLambdas: not in the table\n", hidden: true },
            { stdin: "2\nexpected\ncoroutines\n", expected: "expected: C++23\ncoroutines: C++20\n", hidden: true },
          ],
        },
        {
          title: "A modern rewrite",
          prompt: `This is a working program in the 2003 style:

\`\`\`cpp
int n;
std::cin >> n;
int* data = new int[n];
for (int i = 0; i < n; i++) std::cin >> data[i];
std::sort(data, data + n);
long long sum = 0;
for (int i = 0; i < n; i++) sum += data[i];
// … print, then
delete[] data;
\`\`\`

Rewrite it in the modern style: a \`std::vector<int>\` sized from \`n\` (no \`new\`), a range-based \`for\` with \`auto&\` to read the values, \`std::ranges::sort\`, and \`std::accumulate\` with a \`0LL\` initial value for the sum. Then print four lines: \`sorted:\` followed by the values in ascending order each preceded by one space, \`sum: <sum>\`, \`min: <smallest>\` and \`max: <largest>\`. When \`n\` is 0 print \`sorted:\` with nothing after it, \`sum: 0\`, \`min: none\` and \`max: none\`.

**Input:** \`n\`, then \`n\` integers (any whitespace).
**Output:** four lines.

Example: input \`4\` / \`5 3 9 1\` →
\`\`\`text
sorted: 1 3 5 9
sum: 18
min: 1
max: 9
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    // TODO: a vector of n ints, read with a range-for over auto&
    // TODO: std::ranges::sort, then std::accumulate with 0LL
    // TODO: print sorted:, sum:, min:, max: (none when empty)
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n > 0 ? n : 0);
    for (auto& v : values) std::cin >> v;
    std::ranges::sort(values);
    std::cout << "sorted:";
    for (const int v : values) std::cout << ' ' << v;
    std::cout << '\n';
    const long long sum = std::accumulate(values.begin(), values.end(), 0LL);
    std::cout << "sum: " << sum << '\n';
    if (values.empty()) {
        std::cout << "min: none\nmax: none\n";
    } else {
        std::cout << "min: " << values.front() << '\n';
        std::cout << "max: " << values.back() << '\n';
    }
    return 0;
}
`,
          hints: [
            "std::vector<int> values(n) creates n zeroes; for (auto& v : values) std::cin >> v; fills them in place.",
            "After sorting, the smallest is values.front() and the largest values.back() — no extra pass needed.",
            "std::accumulate's third argument fixes the sum's type: 0 would make it int and overflow; 0LL makes it long long.",
          ],
          cases: [
            { stdin: "4\n5 3 9 1\n", expected: "sorted: 1 3 5 9\nsum: 18\nmin: 1\nmax: 9\n" },
            { stdin: "3\n-2 -7 4\n", expected: "sorted: -7 -2 4\nsum: -5\nmin: -7\nmax: 4\n" },
            { stdin: "0\n", expected: "sorted:\nsum: 0\nmin: none\nmax: none\n", hidden: true },
            { stdin: "2\n2000000000 2000000000\n", expected: "sorted: 2000000000 2000000000\nsum: 4000000000\nmin: 2000000000\nmax: 2000000000\n", hidden: true },
            { stdin: "1\n42\n", expected: "sorted: 42\nsum: 42\nmin: 42\nmax: 42\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which standard introduced `auto` type deduction, lambdas, range-based `for`, `nullptr` and move semantics?",
          options: ["C++98", "C++11", "C++14", "C++17"],
          answer: 1,
          explanation: "All five arrived together in C++11, the release that reset the language. C++14 generalised them (generic lambdas, relaxed `constexpr`); C++17 added the vocabulary types and structured bindings on top.",
        },
        {
          prompt: "On this track's runtime (Clang 18, `-std=c++20`), what does `std::cout << __cplusplus;` print?",
          options: ["`20`", "`201703`", "`202002`", "`202302`"],
          answer: 2,
          explanation: "`__cplusplus` is the standard's date: `201703L` for C++17, `202002L` for C++20, `202302L` for C++23. The judge compiles with `-std=c++20`, so it prints `202002`.",
        },
        {
          prompt: "Which of these compiles on the study judge?",
          options: ["`std::print(\"{}\\n\", 42);`", "`std::expected<int, std::string> r;`", "`std::cout << std::format(\"{}\", 42);`", "`auto v = xs | std::views::filter(f) | std::ranges::to<std::vector>();`"],
          answer: 2,
          explanation: "`std::format` is C++20 and libstdc++ 14 implements it. `std::print`, `std::expected` and `std::ranges::to` are C++23 and do not exist under `-std=c++20`.",
        },
        {
          prompt: "What does `#ifdef __cpp_lib_format` test, and where is the macro defined?",
          options: ["Whether the compiler flag was `-std=c++20`; it is predefined by the compiler", "Whether the standard library implements `std::format`; it is defined by `<version>` (and `<format>`)", "Whether formatting is enabled at run time; it is set by `std::locale`", "Whether the program has included `<iostream>`"],
          answer: 1,
          explanation: "Library feature-test macros are defined by the library headers, and `<version>` exists to publish all of them. The value is a date (`202110` here), so `#if __cpp_lib_format >= 202106L` can ask for a minimum revision. Without including `<version>` or `<format>` the macro is never defined.",
        },
        {
          prompt: "Which line is *not* in the modern C++ style?",
          options: ["`auto p = std::make_unique<Widget>();`", "`int* buf = new int[n]; /* … */ delete[] buf;`", "`for (const auto& item : items)`", "`std::ranges::sort(v);`"],
          answer: 1,
          explanation: "Owning raw memory through `new[]`/`delete[]` is exactly what the modern style replaces with containers and smart pointers: a `std::vector<int>` cannot leak and carries its own size. The other three are the idioms the track has taught.",
        },
        {
          prompt: "Which of these arrived in C++14?",
          options: ["`std::make_unique`", "`std::make_shared`", "`std::unique_ptr`", "`std::optional`"],
          answer: 0,
          explanation: "`std::unique_ptr` and `std::make_shared` are C++11; `std::make_unique` was left out and added in C++14. `std::optional` is C++17.",
        },
        {
          prompt: "Since C++11, how often does a new C++ standard ship?",
          options: ["Every year", "Every two years", "Every three years", "Whenever the planned features are complete"],
          answer: 2,
          explanation: "The committee moved to a fixed three-year train: 2011, 2014, 2017, 2020, 2023, with 2026 in progress. A feature that misses the train waits for the next one rather than delaying the release.",
        },
      ],
    },
    {
      slug: "auto-decltype-and-structured-bindings",
      file: "02-auto-decltype-and-structured-bindings.md",
      exercises: [
        {
          title: "Stock lookup with bindings",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`name quantity price\` into a \`std::map<std::string, std::pair<int, double>>\` (a later line for the same name replaces the earlier one). Then read an integer \`q\` and \`q\` names to look up. For each name print \`<name>: <quantity> x <price> = <total>\` with the price and total to two decimals, or \`<name>: not stocked\`. Finally print \`stocked:\` followed by every stocked name in map order, each preceded by one space.

Requirements: look up with an \`if\` that declares the iterator in its initialiser; take the pair apart with a structured binding (\`const auto& [quantity, price] = it->second;\`); iterate the map at the end with \`for (const auto& [name, entry] : stock)\`.

**Input:** \`n\`, \`n\` stock lines, \`q\`, \`q\` names.
**Output:** \`q\` lines, then the \`stocked:\` line.

\`\`\`text
3
apple 4 0.50
banana 12 0.25
cherry 100 0.10
3
banana
grape
apple
\`\`\`
prints
\`\`\`text
banana: 12 x 0.25 = 3.00
grape: not stocked
apple: 4 x 0.50 = 2.00
stocked: apple banana cherry
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <utility>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, std::pair<int, double>> stock;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int quantity;
        double price;
        std::cin >> name >> quantity >> price;
        // TODO: store the pair under the name
    }
    int q;
    std::cin >> q;
    std::cout << std::fixed << std::setprecision(2);
    for (int i = 0; i < q; ++i) {
        std::string name;
        std::cin >> name;
        // TODO: if (auto it = ...; ...) with a structured binding over it->second
    }
    // TODO: the stocked: line, iterating with const auto& [name, entry]
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <utility>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, std::pair<int, double>> stock;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int quantity;
        double price;
        std::cin >> name >> quantity >> price;
        stock[name] = {quantity, price};
    }
    int q;
    std::cin >> q;
    std::cout << std::fixed << std::setprecision(2);
    for (int i = 0; i < q; ++i) {
        std::string name;
        std::cin >> name;
        if (auto it = stock.find(name); it != stock.end()) {
            const auto& [quantity, price] = it->second;
            std::cout << name << ": " << quantity << " x " << price << " = " << quantity * price << '\n';
        } else {
            std::cout << name << ": not stocked\n";
        }
    }
    std::cout << "stocked:";
    for (const auto& [name, entry] : stock) std::cout << ' ' << name;
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "stock[name] = {quantity, price}; inserts or replaces in one line.",
            "it->second is the pair; binding it as const auto& [quantity, price] avoids a copy and names both halves.",
            "std::fixed and std::setprecision are sticky — set them once before the query loop.",
          ],
          cases: [
            { stdin: "3\napple 4 0.50\nbanana 12 0.25\ncherry 100 0.10\n3\nbanana\ngrape\napple\n", expected: "banana: 12 x 0.25 = 3.00\ngrape: not stocked\napple: 4 x 0.50 = 2.00\nstocked: apple banana cherry\n" },
            { stdin: "1\npen 3 1.99\n2\npen\npen\n", expected: "pen: 3 x 1.99 = 5.97\npen: 3 x 1.99 = 5.97\nstocked: pen\n" },
            { stdin: "0\n1\nx\n", expected: "x: not stocked\nstocked:\n", hidden: true },
            { stdin: "2\nzed 0 9.99\nabe 1 0.01\n1\nzed\n", expected: "zed: 0 x 9.99 = 0.00\nstocked: abe zed\n", hidden: true },
            { stdin: "2\napple 1 1.00\napple 5 2.00\n1\napple\n", expected: "apple: 5 x 2.00 = 10.00\nstocked: apple\n", hidden: true },
          ],
        },
        {
          title: "Summarise and classify",
          prompt: `Complete two functions and bind their results. \`summarise\` returns a \`Summary\` struct — the smallest value, the largest value and the total (a \`long long\`) of a non-empty vector. \`classify\` returns a \`std::array<int, 3>\` — how many values are negative, zero and positive, in that order. In \`main\`, take both results apart with structured bindings (\`const auto [lo, hi, sum] = summarise(values);\` and the same for the array) and print two lines: \`lo=<lo> hi=<hi> sum=<sum>\` and \`neg=<neg> zero=<zero> pos=<pos>\`.

**Input:** \`n\` (at least 1), then \`n\` integers.
**Output:** two lines.

Example: input \`5\` / \`-3 0 4 0 -1\` →
\`\`\`text
lo=-3 hi=4 sum=0
neg=2 zero=2 pos=1
\`\`\``,
          starter: String.raw`#include <array>
#include <iostream>
#include <vector>

struct Summary {
    int lo;
    int hi;
    long long sum;
};

// Smallest, largest and total of a non-empty vector.
Summary summarise(const std::vector<int>& values) {
    // TODO
    return {0, 0, 0};
}

// How many values are negative, zero and positive, in that order.
std::array<int, 3> classify(const std::vector<int>& values) {
    // TODO
    return {0, 0, 0};
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (auto& v : values) std::cin >> v;
    // TODO: bind both results with structured bindings and print the two lines
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>
#include <vector>

struct Summary {
    int lo;
    int hi;
    long long sum;
};

// Smallest, largest and total of a non-empty vector.
Summary summarise(const std::vector<int>& values) {
    Summary s{values.front(), values.front(), 0};
    for (const int v : values) {
        if (v < s.lo) s.lo = v;
        if (v > s.hi) s.hi = v;
        s.sum += v;
    }
    return s;
}

// How many values are negative, zero and positive, in that order.
std::array<int, 3> classify(const std::vector<int>& values) {
    std::array<int, 3> counts{};
    for (const int v : values) {
        if (v < 0) ++counts[0];
        else if (v == 0) ++counts[1];
        else ++counts[2];
    }
    return counts;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (auto& v : values) std::cin >> v;
    const auto [lo, hi, sum] = summarise(values);
    const auto [neg, zero, pos] = classify(values);
    std::cout << "lo=" << lo << " hi=" << hi << " sum=" << sum << '\n';
    std::cout << "neg=" << neg << " zero=" << zero << " pos=" << pos << '\n';
    return 0;
}
`,
          hints: [
            "Start lo and hi at values.front() — starting at 0 is wrong when every value is negative or positive.",
            "std::array<int, 3> counts{}; zero-initialises all three; index 0, 1, 2 for negative, zero, positive.",
            "A structured binding over a struct names its members in declaration order; over a std::array, its elements.",
          ],
          cases: [
            { stdin: "5\n-3 0 4 0 -1\n", expected: "lo=-3 hi=4 sum=0\nneg=2 zero=2 pos=1\n" },
            { stdin: "4\n1 9 3 5\n", expected: "lo=1 hi=9 sum=18\nneg=0 zero=0 pos=4\n" },
            { stdin: "1\n-7\n", expected: "lo=-7 hi=-7 sum=-7\nneg=1 zero=0 pos=0\n", hidden: true },
            { stdin: "3\n2000000000 2000000000 2000000000\n", expected: "lo=2000000000 hi=2000000000 sum=6000000000\nneg=0 zero=0 pos=3\n", hidden: true },
            { stdin: "2\n0 0\n", expected: "lo=0 hi=0 sum=0\nneg=0 zero=2 pos=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nconst std::string s = \"x\";\nauto a = s;\na += \"y\";\nstd::cout << s << a;\n```",
          options: ["`xxy`", "`xyxy`", "Compile error: `a` is const", "`xy`"],
          answer: 0,
          explanation: "`auto` drops top-level `const` and makes a copy, so `a` is a mutable `std::string` holding `\"x\"`; appending gives `\"xy\"` and `s` is untouched. `const auto& a = s;` would have kept both the const and the alias.",
        },
        {
          prompt: "What are the types of `x` and `y`?\n\n```cpp\nauto x{1};\nauto y = {1};\n```",
          options: ["Both `int`", "Both `std::initializer_list<int>`", "`x` is `int`, `y` is `std::initializer_list<int>`", "Compile error on the first line"],
          answer: 2,
          explanation: "Since C++17 direct brace initialisation of `auto` with one element deduces the element type, so `x` is `int`. Copy-list-initialisation (`= {…}`) still deduces `std::initializer_list`. `auto w{1, 2};` is the form that does not compile.",
        },
        {
          prompt: "Given `int i = 0;`, what are the types of `a` and `b`?\n\n```cpp\ndecltype(i) a = 1;\ndecltype((i)) b = i;\n```",
          options: ["Both `int`", "`a` is `int`, `b` is `int&`", "`a` is `int&`, `b` is `int`", "Both `int&`"],
          answer: 1,
          explanation: "`decltype(name)` gives the declared type of the name. Parenthesising it makes it an expression — an lvalue of type `int` — and `decltype` of an lvalue expression is a reference, `int&`. That is why `decltype((i)) b;` without an initialiser would not compile.",
        },
        {
          prompt: "What is `m[\"a\"]` after this runs?\n\n```cpp\nstd::map<std::string, int> m{{\"a\", 1}};\nfor (auto& [k, v] : m) v *= 2;\n```",
          options: ["`1` — the binding is a copy", "`2`", "Compile error: `k` is const", "Undefined behaviour"],
          answer: 1,
          explanation: "`auto&` binds the hidden object by reference, so `v` aliases the map's value and the doubling lands in the map. `k` is a `const std::string` but nothing writes to it. With plain `auto [k, v]` each entry would be copied and the map left at `1`.",
        },
        {
          prompt: "Overloads `void f(int);` and `void f(const char*);` exist. Which overload does `f(nullptr);` call?",
          options: ["`f(int)`, because `nullptr` is zero", "`f(const char*)`", "Ambiguous — compile error", "Neither; `nullptr` needs a cast"],
          answer: 1,
          explanation: "`nullptr` has type `std::nullptr_t`, which converts to any pointer type and to no integer type, so only the pointer overload is viable. `f(NULL)` or `f(0)` is the version that picks `f(int)` (or is ambiguous), which is why `nullptr` exists.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> a(3, 5);\nstd::vector<int> b{3, 5};\nstd::cout << a.size() << ' ' << b.size();\n```",
          options: ["`3 3`", "`2 2`", "`3 2`", "`2 3`"],
          answer: 2,
          explanation: "Parentheses call the (count, value) constructor: three fives. Braces prefer the `std::initializer_list` constructor: the two elements 3 and 5. Braces mean \"these are the elements\" whenever an initializer-list constructor exists.",
        },
        {
          prompt: "Does this compile?\n\n```cpp\nstd::tuple<int, int, int> t{1, 2, 3};\nauto [a, b] = t;\n```",
          options: ["Yes; `a` and `b` take the first two elements", "Yes; `b` becomes a pair of the last two", "No: the number of names must equal the number of elements", "No: structured bindings do not work on tuples"],
          answer: 2,
          explanation: "A structured binding must name every element — three here. There is no way to skip one (a `_` placeholder arrives only in C++26); write a third name. Tuples, pairs, arrays and all-public structs are all bindable.",
        },
      ],
    },
    {
      slug: "constexpr-and-compile-time",
      file: "03-constexpr-and-compile-time.md",
      exercises: [
        {
          title: "A compile-time prime sieve",
          prompt: `Build a sieve of Eratosthenes for 0 to 100 **at compile time**: a \`constexpr\` function \`makeSieve()\` that fills and returns a \`std::array<bool, 101>\` with a loop, captured as \`constexpr auto SIEVE = makeSieve();\`, and a \`static_assert\` that checks at least \`SIEVE[2]\`, \`SIEVE[97]\`, \`!SIEVE[91]\` and \`!SIEVE[1]\`. Then read an integer \`q\` and \`q\` integers, and for each print \`<k>: prime\`, \`<k>: not prime\` (0 and 1 are not prime) or \`<k>: out of range\` when \`k\` is below 0 or above 100.

The table must be built by the compiler: if you compute it in \`main\`, or leave the \`static_assert\` out, the program may still pass the cases but it has not done the exercise.

**Input:** \`q\`, then \`q\` integers.
**Output:** \`q\` lines.

Example: input \`5\` / \`2 15 97 1 100\` →
\`\`\`text
2: prime
15: not prime
97: prime
1: not prime
100: not prime
\`\`\``,
          starter: String.raw`#include <array>
#include <iostream>

constexpr int LIMIT = 100;

// true at every prime index, false elsewhere — built by the compiler.
constexpr std::array<bool, LIMIT + 1> makeSieve() {
    std::array<bool, LIMIT + 1> isPrime{};
    // TODO: mark 2..LIMIT true, then cross out multiples
    return isPrime;
}

constexpr auto SIEVE = makeSieve();
// TODO: static_assert a few entries

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int k;
        std::cin >> k;
        // TODO: out of range, prime, or not prime
    }
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>

constexpr int LIMIT = 100;

// true at every prime index, false elsewhere — built by the compiler.
constexpr std::array<bool, LIMIT + 1> makeSieve() {
    std::array<bool, LIMIT + 1> isPrime{};
    for (int i = 2; i <= LIMIT; ++i) isPrime[i] = true;
    for (int i = 2; i * i <= LIMIT; ++i) {
        if (!isPrime[i]) continue;
        for (int j = i * i; j <= LIMIT; j += i) isPrime[j] = false;
    }
    return isPrime;
}

constexpr auto SIEVE = makeSieve();
static_assert(SIEVE[2] && SIEVE[97] && !SIEVE[91] && !SIEVE[1] && !SIEVE[0]);

constexpr int countPrimes() {
    int count = 0;
    for (bool p : SIEVE) count += p ? 1 : 0;
    return count;
}
static_assert(countPrimes() == 25);

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int k;
        std::cin >> k;
        if (k < 0 || k > LIMIT) {
            std::cout << k << ": out of range\n";
        } else {
            std::cout << k << (SIEVE[k] ? ": prime\n" : ": not prime\n");
        }
    }
    return 0;
}
`,
          hints: [
            "std::array<bool, N> arr{}; starts all false; set indices 2..LIMIT true first, then cross out.",
            "For each i from 2 while i * i <= LIMIT, if i is still marked, set every multiple from i * i upward to false.",
            "static_assert(SIEVE[97] && !SIEVE[91]); fails the build, not the run, if the sieve is wrong — that is the point.",
          ],
          cases: [
            { stdin: "5\n2\n15\n97\n1\n100\n", expected: "2: prime\n15: not prime\n97: prime\n1: not prime\n100: not prime\n" },
            { stdin: "3\n0\n101\n-5\n", expected: "0: not prime\n101: out of range\n-5: out of range\n" },
            { stdin: "4\n89\n91\n49\n53\n", expected: "89: prime\n91: not prime\n49: not prime\n53: prime\n", hidden: true },
            { stdin: "2\n4\n3\n", expected: "4: not prime\n3: prime\n", hidden: true },
            { stdin: "1\n1000000\n", expected: "1000000: out of range\n", hidden: true },
          ],
        },
        {
          title: "A consteval factorial table",
          prompt: `Write \`consteval unsigned long long factorial(unsigned n)\` — an immediate function that computes \`n!\` with a loop — and \`consteval std::array<unsigned long long, 21> makeTable()\` that fills a table with \`factorial(0)\` to \`factorial(20)\` by calling it in a loop. Capture it as \`constexpr auto FACTORIALS = makeTable();\` and add a \`static_assert\` that \`FACTORIALS[20] == 2432902008176640000ULL\` and \`FACTORIALS[0] == 1\`.

Both functions must be \`consteval\`: the lesson explains why the table builder cannot be a plain \`constexpr\` function when it calls a \`consteval\` one with a loop variable.

Then read an integer \`q\` and \`q\` integers (they may be negative or very large — read them as \`long long\`). For each print \`<n>! = <value>\` from the table, \`<n>! = too large\` when \`n\` is above 20, or \`<n>: invalid\` when \`n\` is negative.

**Input:** \`q\`, then \`q\` integers.
**Output:** \`q\` lines.

Example: input \`4\` / \`0 5 20 21\` →
\`\`\`text
0! = 1
5! = 120
20! = 2432902008176640000
21! = too large
\`\`\``,
          starter: String.raw`#include <array>
#include <iostream>

// n! for 0 <= n <= 20 — an immediate function: it can only run at compile time.
consteval unsigned long long factorial(unsigned n) {
    // TODO
    return 1;
}

// All twenty-one values, built at compile time.
consteval std::array<unsigned long long, 21> makeTable() {
    std::array<unsigned long long, 21> table{};
    // TODO: fill it by calling factorial(i)
    return table;
}

constexpr auto FACTORIALS = makeTable();
// TODO: static_assert FACTORIALS[20] == 2432902008176640000ULL and FACTORIALS[0] == 1

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        long long n;
        std::cin >> n;
        // TODO: negative -> "<n>: invalid", above 20 -> "<n>! = too large", otherwise the table entry
    }
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>

// n! for 0 <= n <= 20 — an immediate function: it can only run at compile time.
consteval unsigned long long factorial(unsigned n) {
    unsigned long long result = 1;
    for (unsigned i = 2; i <= n; ++i) result *= i;
    return result;
}

// All twenty-one values, built at compile time. consteval, not constexpr: a constexpr
// function might run at run time, so it may not call factorial(i) with a loop variable.
consteval std::array<unsigned long long, 21> makeTable() {
    std::array<unsigned long long, 21> table{};
    for (unsigned i = 0; i <= 20; ++i) table[i] = factorial(i);
    return table;
}

constexpr auto FACTORIALS = makeTable();
static_assert(FACTORIALS[0] == 1 && FACTORIALS[1] == 1 && FACTORIALS[5] == 120);
static_assert(FACTORIALS[20] == 2432902008176640000ULL);

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        long long n;
        std::cin >> n;
        if (n < 0) {
            std::cout << n << ": invalid\n";
        } else if (n > 20) {
            std::cout << n << "! = too large\n";
        } else {
            std::cout << n << "! = " << FACTORIALS[static_cast<std::size_t>(n)] << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "factorial: start at 1 and multiply by every i from 2 to n; unsigned long long holds 20! exactly.",
            "If makeTable is constexpr the compiler reports that factorial(i) is not a constant expression — make it consteval too.",
            "Read n as long long so that 1000000000000 is rejected as too large instead of overflowing an int.",
          ],
          cases: [
            { stdin: "4\n0\n5\n20\n21\n", expected: "0! = 1\n5! = 120\n20! = 2432902008176640000\n21! = too large\n" },
            { stdin: "2\n-1\n10\n", expected: "-1: invalid\n10! = 3628800\n" },
            { stdin: "3\n1\n13\n19\n", expected: "1! = 1\n13! = 6227020800\n19! = 121645100408832000\n", hidden: true },
            { stdin: "1\n1000000000000\n", expected: "1000000000000! = too large\n", hidden: true },
            { stdin: "2\n12\n2\n", expected: "12! = 479001600\n2! = 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which declaration is a compile error?",
          options: ["`const int n = std::stoi(\"5\");`", "`constexpr int n = 5 * 2;`", "`constexpr int n = std::stoi(\"5\");`", "`constexpr auto n = std::array{1, 2}.size();`"],
          answer: 2,
          explanation: "`constexpr` demands a constant expression and `std::stoi` is not a `constexpr` function. `const` accepts a run-time initialiser, and `std::array::size` is `constexpr`, so the other three are fine.",
        },
        {
          prompt: "Input is `7`. What does this print?\n\n```cpp\nconstexpr int sq(int x) { return x * x; }\nint main() {\n    int n;\n    std::cin >> n;\n    std::cout << sq(n);\n}\n```",
          options: ["`49`", "Compile error: `n` is not a constant expression", "Undefined behaviour", "`0`"],
          answer: 0,
          explanation: "A `constexpr` function is still an ordinary function; it is evaluated at compile time only where the context requires a constant. With a run-time argument it simply runs at run time. A `consteval` function would have been the compile error.",
        },
        {
          prompt: "Does this compile?\n\n```cpp\nconsteval int f(int x) { return x + 1; }\nint main() {\n    int n = 3;\n    return f(n);\n}\n```",
          options: ["Yes, and returns 4", "Yes, but `f` runs at run time", "No: a `consteval` function needs a constant argument", "No: `consteval` functions cannot return `int`"],
          answer: 2,
          explanation: "`consteval` makes `f` an immediate function — every call must be a constant expression. `n` is a mutable local, so `f(n)` is rejected. `f(3)` or `constexpr int n = 3;` would compile.",
        },
        {
          prompt: "What does `constinit` guarantee?",
          options: ["The variable is `const`", "A static-storage variable is initialised at compile time; it may still be modified afterwards", "The variable is thread-local", "The initialiser is evaluated lazily on first use"],
          answer: 1,
          explanation: "`constinit` forces constant initialisation of a global or `static` — ruling out the static-initialisation-order problem — without making the variable `const`. `constexpr` on a variable implies `const`; `constinit` does not.",
        },
        {
          prompt: "Which of these is *not* allowed inside a `constexpr` function under C++20?",
          options: ["A `for` loop", "A local `std::vector` that is destroyed before the function returns", "A `try` block", "A `static` local variable"],
          answer: 3,
          explanation: "C++14 allowed loops, C++20 allowed `try` blocks and transient allocation (so a local `std::vector` is fine as long as nothing allocated escapes). A `static` local inside a `constexpr` function is rejected until C++23.",
        },
        {
          prompt: "`makeSieve()` accidentally writes to index 101 of a `std::array<bool, 101>`. What happens with `constexpr auto SIEVE = makeSieve();`?",
          options: ["The program compiles and behaves unpredictably at run time", "A compile error: undefined behaviour is not a constant expression", "The write is silently ignored", "A run-time exception"],
          answer: 1,
          explanation: "During constant evaluation the compiler must detect undefined behaviour and refuse — an out-of-bounds write, signed overflow or a null dereference all become compile errors. The same code called at run time would be silent UB, which is why compile-time tables are safer than run-time ones.",
        },
        {
          prompt: "Inside a template, what is the difference between `if (std::is_integral_v<T>)` and `if constexpr (std::is_integral_v<T>)`?",
          options: ["None — the optimiser removes the dead branch either way", "`if constexpr` discards the untaken branch, so it may contain code that would not compile for `T`", "`if constexpr` is evaluated at run time, the plain `if` at compile time", "`if constexpr` can only appear in `constexpr` functions"],
          answer: 1,
          explanation: "A plain `if` compiles both branches for every `T`, so `std::string(value)` in the non-integral branch is an error when `T` is `int`. `if constexpr` does not instantiate the discarded branch inside a template, which is what makes per-type code possible without overloads or specialisation.",
        },
      ],
    },
    {
      slug: "the-vocabulary-types",
      file: "04-the-vocabulary-types.md",
      exercises: [
        {
          title: "Leaderboard with tuples",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` lines of \`name age score\` (\`score\` is a decimal number) into a \`std::vector<std::tuple<std::string, int, double>>\`. Sort by score **descending**, then by name ascending — write the comparator with \`std::tie\` so the two-key comparison is one expression. Print each row numbered from 1 as \`<rank>. <name> (<age>) <score>\` with the score to one decimal, using \`std::apply\` to hand the tuple's elements to a lambda that prints them. Finally print \`best: <name of the first row>\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 1\` lines.

\`\`\`text
3
ada 31 92.5
bob 25 88.0
cy 40 92.5
\`\`\`
prints
\`\`\`text
1. ada (31) 92.5
2. cy (40) 92.5
3. bob (25) 88.0
best: ada
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <format>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>

using Row = std::tuple<std::string, int, double>;

int main() {
    int n;
    std::cin >> n;
    std::vector<Row> rows;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int age;
        double score;
        std::cin >> name >> age >> score;
        rows.emplace_back(name, age, score);
    }
    // TODO: sort with a comparator built from std::tie (score descending, then name ascending)
    // TODO: print each row through std::apply, numbered from 1
    // TODO: print best: <name of rows.front()>
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <format>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>

using Row = std::tuple<std::string, int, double>;

int main() {
    int n;
    std::cin >> n;
    std::vector<Row> rows;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int age;
        double score;
        std::cin >> name >> age >> score;
        rows.emplace_back(name, age, score);
    }
    std::ranges::sort(rows, [](const Row& a, const Row& b) {
        // Score descending, name ascending: compare (b.score, a.name) against (a.score, b.name).
        return std::tie(std::get<2>(b), std::get<0>(a)) < std::tie(std::get<2>(a), std::get<0>(b));
    });
    int rank = 0;
    for (const Row& row : rows) {
        ++rank;
        std::apply([rank](const std::string& name, int age, double score) {
            std::cout << std::format("{}. {} ({}) {:.1f}\n", rank, name, age, score);
        }, row);
    }
    std::cout << "best: " << std::get<0>(rows.front()) << '\n';
    return 0;
}
`,
          hints: [
            "std::tie(x, y) < std::tie(p, q) compares x with p first and y with q only on a tie.",
            "Descending on one key: put b's score on the left and a's on the right, while keeping the names in a-then-b order.",
            "std::apply(f, tuple) calls f(get<0>, get<1>, get<2>) — the lambda's parameters are the tuple's element types.",
          ],
          cases: [
            { stdin: "3\nada 31 92.5\nbob 25 88.0\ncy 40 92.5\n", expected: "1. ada (31) 92.5\n2. cy (40) 92.5\n3. bob (25) 88.0\nbest: ada\n" },
            { stdin: "2\nzed 20 10\nabe 22 20\n", expected: "1. abe (22) 20.0\n2. zed (20) 10.0\nbest: abe\n" },
            { stdin: "1\nsolo 99 0\n", expected: "1. solo (99) 0.0\nbest: solo\n", hidden: true },
            { stdin: "3\nx 1 -1.5\ny 2 -0.5\nz 3 -1.5\n", expected: "1. y (2) -0.5\n2. x (1) -1.5\n3. z (3) -1.5\nbest: y\n", hidden: true },
            { stdin: "4\nd 1 7\nc 1 7\nb 1 7\na 1 7\n", expected: "1. a (1) 7.0\n2. b (1) 7.0\n3. c (1) 7.0\n4. d (1) 7.0\nbest: a\n", hidden: true },
          ],
        },
        {
          title: "Window sums over a span",
          prompt: `Write \`long long total(std::span<const int> window)\` and \`int largest(std::span<const int> window)\`. Read an integer \`n\` and \`n\` integers into a \`std::vector<int>\`, then an integer \`q\` and \`q\` queries of \`offset count\`. For each query take the window with \`subspan(offset, count)\` on a \`std::span<const int>\` over the vector — no copying — and print \`sum=<total> max=<largest>\`, or \`invalid\` when the window does not fit (\`offset\` below 0, \`count\` below 1, or \`offset + count\` beyond \`n\`).

Both functions must take \`std::span<const int>\`, so they work unchanged for a vector, a \`std::array\` or a built-in array.

**Input:** \`n\`, \`n\` integers, \`q\`, then \`q\` lines of \`offset count\`.
**Output:** \`q\` lines.

\`\`\`text
5
4 -2 7 1 9
3
0 5
1 2
2 3
\`\`\`
prints
\`\`\`text
sum=19 max=9
sum=5 max=7
sum=17 max=9
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <span>
#include <vector>

long long total(std::span<const int> window) {
    // TODO
    return 0;
}

int largest(std::span<const int> window) {
    // TODO
    return 0;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (auto& v : values) std::cin >> v;
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        long long offset, count;
        std::cin >> offset >> count;
        // TODO: validate, take the subspan, print sum= and max=
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <span>
#include <vector>

long long total(std::span<const int> window) {
    long long sum = 0;
    for (const int x : window) sum += x;
    return sum;
}

int largest(std::span<const int> window) {
    return *std::ranges::max_element(window);
}

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (auto& v : values) std::cin >> v;
    const std::span<const int> all{values};
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        long long offset, count;
        std::cin >> offset >> count;
        if (offset < 0 || count < 1 || offset + count > static_cast<long long>(all.size())) {
            std::cout << "invalid\n";
            continue;
        }
        const auto window = all.subspan(static_cast<std::size_t>(offset), static_cast<std::size_t>(count));
        std::cout << "sum=" << total(window) << " max=" << largest(window) << '\n';
    }
    return 0;
}
`,
          hints: [
            "A std::span<const int> is constructed straight from the vector: std::span<const int> all{values};",
            "Validate before calling subspan — a subspan past the end is undefined behaviour, not an exception.",
            "std::ranges::max_element works on a span like any range; dereference the iterator it returns.",
          ],
          cases: [
            { stdin: "5\n4 -2 7 1 9\n3\n0 5\n1 2\n2 3\n", expected: "sum=19 max=9\nsum=5 max=7\nsum=17 max=9\n" },
            { stdin: "3\n1 2 3\n2\n2 1\n3 1\n", expected: "sum=3 max=3\ninvalid\n" },
            { stdin: "1\n-5\n2\n0 1\n0 0\n", expected: "sum=-5 max=-5\ninvalid\n", hidden: true },
            { stdin: "4\n2000000000 2000000000 2000000000 1\n1\n0 4\n", expected: "sum=6000000001 max=2000000000\n", hidden: true },
            { stdin: "2\n1 2\n2\n-1 2\n1 1\n", expected: "invalid\nsum=2 max=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::tuple<int, std::string> t{1, \"a\"};\nauto [n, s] = t;\ns += \"b\";\nstd::cout << std::get<1>(t);\n```",
          options: ["`a`", "`ab`", "Compile error", "Undefined behaviour"],
          answer: 0,
          explanation: "`auto [n, s] = t;` copies the tuple and binds names to the copy's elements, so appending to `s` leaves `t` unchanged. `auto& [n, s] = t;` would have printed `ab`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nint a = 1, b = 2;\nstd::tie(a, b) = std::make_pair(b, a);\nstd::cout << a << ' ' << b;\n```",
          options: ["`2 1`", "`1 2`", "`2 2`", "Undefined behaviour"],
          answer: 0,
          explanation: "`std::make_pair(b, a)` copies the current values into a temporary pair `(2, 1)` first; assigning it to the tuple of references then stores 2 in `a` and 1 in `b`. The idiom swaps without a temporary variable.",
        },
        {
          prompt: "What is the state of `s` after this?\n\n```cpp\nstd::vector<int> v{1, 2, 3};\nstd::span<const int> s{v};\nv.push_back(4);\n```",
          options: ["`s` still views the three original elements", "`s` now views all four elements", "`s` may be dangling: reading through it is undefined behaviour if the vector reallocated", "Compile error: a span cannot view a vector"],
          answer: 2,
          explanation: "A span is a pointer and a length into memory it does not own. `push_back` may reallocate, moving the elements and freeing the old block the span still points at. The same invalidation rules as iterators apply (Module 13).",
        },
        {
          prompt: "Does this compile?\n\n```cpp\nusing namespace std::chrono_literals;\nstd::chrono::seconds s = 1500ms;\n```",
          options: ["Yes; `s` is 1 second", "Yes; `s` is 2 seconds", "No: converting milliseconds to seconds loses precision and needs `duration_cast`", "Yes; `s` is 1500 seconds"],
          answer: 2,
          explanation: "Durations convert implicitly only when no precision is lost (seconds to milliseconds). The lossy direction must be spelled out: `std::chrono::duration_cast<std::chrono::seconds>(1500ms)` gives `1s` by truncation.",
        },
        {
          prompt: "What does `std::apply(f, t)` do for a tuple `t` with three elements?",
          options: ["Calls `f(t)` with the tuple as one argument", "Calls `f` once per element", "Calls `f(std::get<0>(t), std::get<1>(t), std::get<2>(t))`", "Returns a new tuple with `f` applied to each element"],
          answer: 2,
          explanation: "`std::apply` unpacks the tuple into separate arguments — the bridge from \"a tuple of values\" to \"a function of N parameters\". Per-element application would need a fold or a loop over a homogeneous container.",
        },
        {
          prompt: "Which parameter type says \"read-only access to any contiguous sequence of `int`\" and accepts a `std::vector<int>`, a `std::array<int, 4>` and a built-in array alike?",
          options: ["`const std::vector<int>&`", "`const int*`", "`std::span<const int>`", "`std::initializer_list<int>`"],
          answer: 2,
          explanation: "`std::span<const int>` is a non-owning view over any contiguous storage and carries its length; `const int*` loses the length, `const std::vector<int>&` accepts only vectors, and `std::initializer_list` is for literal lists.",
        },
        {
          prompt: "Given `std::byte b{5};`, which expression compiles?",
          options: ["`b + 1`", "`std::cout << b`", "`std::to_integer<int>(b) + 1`", "`int n = b;`"],
          answer: 2,
          explanation: "`std::byte` deliberately has no arithmetic, no stream output and no implicit conversion — only bitwise operators. `std::to_integer<int>(b)` is the explicit way out, and `b |= std::byte{1}` the way to manipulate it.",
        },
      ],
    },
    {
      slug: "cpp20-and-beyond",
      file: "05-cpp20-and-beyond.md",
      exercises: [
        {
          title: "Shapes that satisfy a concept",
          prompt: `Define a concept \`HasArea\` that is satisfied by any type whose \`area()\` const member function returns something convertible to \`double\`, three structs that satisfy it — \`Circle{r}\` (area πr², use \`std::numbers::pi\`), \`Rect{w, h}\` and \`Square{side}\` — and a function template \`report\` constrained by the concept (\`template <HasArea S>\`) that prints \`<label> area=<area>\` with the area to two decimals through \`std::format\` and returns the area.

Read an integer \`n\`, then \`n\` lines: \`circle <r>\`, \`rect <w> <h>\`, \`square <side>\`, or something else, which prints \`unknown shape\`. After the lines print \`total=<sum of the reported areas>\` to two decimals.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 1\` lines.

\`\`\`text
3
circle 2
rect 3 4
square 2
\`\`\`
prints
\`\`\`text
circle area=12.57
rect area=12.00
square area=4.00
total=28.57
\`\`\``,
          starter: String.raw`#include <concepts>
#include <format>
#include <iostream>
#include <numbers>
#include <sstream>
#include <string>
#include <string_view>

// TODO: the HasArea concept

struct Circle {
    double r;
    // TODO: area()
};

struct Rect {
    double w;
    double h;
    // TODO: area()
};

struct Square {
    double side;
    // TODO: area()
};

// TODO: template <HasArea S> double report(std::string_view label, const S& shape)

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    double sum = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string kind;
        in >> kind;
        // TODO: build the shape, report it, add to sum; unknown kinds print "unknown shape"
    }
    std::cout << std::format("total={:.2f}\n", sum);
    return 0;
}
`,
          solution: String.raw`#include <concepts>
#include <format>
#include <iostream>
#include <numbers>
#include <sstream>
#include <string>
#include <string_view>

template <typename T>
concept HasArea = requires(const T& t) {
    { t.area() } -> std::convertible_to<double>;
};

struct Circle {
    double r;
    double area() const { return std::numbers::pi * r * r; }
};

struct Rect {
    double w;
    double h;
    double area() const { return w * h; }
};

struct Square {
    double side;
    double area() const { return side * side; }
};

template <HasArea S>
double report(std::string_view label, const S& shape) {
    const double a = shape.area();
    std::cout << std::format("{} area={:.2f}\n", label, a);
    return a;
}

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    double sum = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string kind;
        in >> kind;
        if (kind == "circle") {
            double r;
            in >> r;
            sum += report("circle", Circle{r});
        } else if (kind == "rect") {
            double w, h;
            in >> w >> h;
            sum += report("rect", Rect{w, h});
        } else if (kind == "square") {
            double side;
            in >> side;
            sum += report("square", Square{side});
        } else {
            std::cout << "unknown shape\n";
        }
    }
    std::cout << std::format("total={:.2f}\n", sum);
    return 0;
}
`,
          hints: [
            "A requires expression: requires(const T& t) { { t.area() } -> std::convertible_to<double>; };",
            "template <HasArea S> before the function is the same as template <typename S> requires HasArea<S>.",
            "Each line is parsed from its own std::istringstream, so an unknown kind's extra tokens are simply dropped with the line.",
          ],
          cases: [
            { stdin: "3\ncircle 2\nrect 3 4\nsquare 2\n", expected: "circle area=12.57\nrect area=12.00\nsquare area=4.00\ntotal=28.57\n" },
            { stdin: "2\ntriangle 3 4\ncircle 1\n", expected: "unknown shape\ncircle area=3.14\ntotal=3.14\n" },
            { stdin: "0\n", expected: "total=0.00\n", hidden: true },
            { stdin: "1\ncircle 0\n", expected: "circle area=0.00\ntotal=0.00\n", hidden: true },
            { stdin: "2\nrect 2.5 2\nsquare 1.5\n", expected: "rect area=5.00\nsquare area=2.25\ntotal=7.25\n", hidden: true },
          ],
        },
        {
          title: "A server table",
          prompt: `A \`Server\` is an aggregate with defaults — \`name\`, \`port\` (default 8080), \`threads\` (default 4) and \`tls\` (default \`false\`) — and a defaulted \`operator<=>\` so servers sort by name, then port, then threads, then tls. Read an integer \`n\`, then \`n\` lines of \`name port [threads] [tls|plain]\`, where the last two tokens are optional. Build each server with a **designated initialiser** naming only \`name\` and \`port\` (\`Server s{.name = name, .port = port};\`), then overwrite \`threads\` and \`tls\` only when the line provides them. Sort with \`std::ranges::sort\` (no comparator — the spaceship supplies it) and print a table with \`std::format\`: the header \`{:<10}{:>5}{:>8} {:>3}\` over \`NAME\`, \`PORT\`, \`THREADS\`, \`TLS\`, then one row per server in the same widths, with \`yes\` or \`no\` in the last column.

**Input:** \`n\`, then \`n\` lines.
**Output:** the header, then \`n\` rows.

\`\`\`text
3
web 80
api 9000 8 tls
db 5432 2
\`\`\`
prints
\`\`\`text
NAME       PORT THREADS TLS
api        9000       8 yes
db         5432       2  no
web          80       4  no
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <compare>
#include <format>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Server {
    std::string name;
    int port = 8080;
    int threads = 4;
    bool tls = false;
    // TODO: a defaulted operator<=>
};

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    std::vector<Server> servers;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string name;
        int port;
        in >> name >> port;
        // TODO: designated initialiser, then the optional threads and tls tokens
    }
    // TODO: sort, then print the header and the rows with std::format
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <compare>
#include <format>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Server {
    std::string name;
    int port = 8080;
    int threads = 4;
    bool tls = false;
    auto operator<=>(const Server&) const = default;
};

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    std::vector<Server> servers;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string name;
        int port;
        in >> name >> port;
        Server server{.name = name, .port = port};
        if (int threads; in >> threads) server.threads = threads;
        if (std::string mode; in >> mode) server.tls = (mode == "tls");
        servers.push_back(server);
    }
    std::ranges::sort(servers);
    std::cout << std::format("{:<10}{:>5}{:>8} {:>3}\n", "NAME", "PORT", "THREADS", "TLS");
    for (const auto& s : servers) {
        std::cout << std::format("{:<10}{:>5}{:>8} {:>3}\n", s.name, s.port, s.threads, s.tls ? "yes" : "no");
    }
    return 0;
}
`,
          hints: [
            "auto operator<=>(const Server&) const = default; inside the struct generates all six comparisons, member by member.",
            "if (int threads; in >> threads) reads the optional token only when it is there — the if initialiser again.",
            "std::format pads with the widths in the spec; pass the same format string for the header and each row so the columns line up.",
          ],
          cases: [
            { stdin: "3\nweb 80\napi 9000 8 tls\ndb 5432 2\n", expected: "NAME       PORT THREADS TLS\napi        9000       8 yes\ndb         5432       2  no\nweb          80       4  no\n" },
            { stdin: "2\nx 1 1 tls\nx 1 1 plain\n", expected: "NAME       PORT THREADS TLS\nx             1       1  no\nx             1       1 yes\n" },
            { stdin: "0\n", expected: "NAME       PORT THREADS TLS\n", hidden: true },
            { stdin: "2\nbeta 443 16 tls\nalpha 443\n", expected: "NAME       PORT THREADS TLS\nalpha       443       4  no\nbeta        443      16 yes\n", hidden: true },
            { stdin: "3\nm 2\nm 1\nm 3 9\n", expected: "NAME       PORT THREADS TLS\nm             1       4  no\nm             2       4  no\nm             3       9  no\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\ntemplate <std::integral T> T twice(T x) { return x * 2; }\nauto r = twice(2.5);\n```",
          options: ["`r` is `5.0`", "`r` is `4` — the argument is truncated to `int`", "Compile error at the call: the constraint `std::integral<double>` is not satisfied", "Undefined behaviour"],
          answer: 2,
          explanation: "A concept is checked at the call site during overload resolution; `double` is not integral, so no viable `twice` exists and the compiler says which constraint failed. Without the concept the same template would have compiled and returned `5.0`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nauto evens = std::views::iota(1)\n           | std::views::filter([](int x) { return x % 2 == 0; })\n           | std::views::take(3);\nfor (int x : evens) std::cout << x << ' ';\n```",
          options: ["`2 4 6 `", "`1 2 3 `", "It never terminates: `iota(1)` is infinite", "Compile error: `filter` cannot follow an infinite range"],
          answer: 0,
          explanation: "Views are lazy: `iota(1)` produces numbers only as they are pulled, `filter` passes the even ones, and `take(3)` stops the pipeline after three. Nothing is computed until the loop asks, so the infinite source is fine.",
        },
        {
          prompt: "Given\n\n```cpp\nstruct P { int x, y; auto operator<=>(const P&) const = default; };\n```\n\nwhat is `P{1, 2} < P{1, 3}`?",
          options: ["`true`", "`false`", "Compile error: no `operator<` was declared", "Compiles, but `==` is not available"],
          answer: 0,
          explanation: "A defaulted `<=>` compares members in declaration order — `x` ties, `y` decides — and the compiler rewrites `a < b` as `(a <=> b) < 0`. Defaulting `<=>` also declares a defaulted `==`, so all six comparisons work.",
        },
        {
          prompt: "What does `std::format(\"{:>6.2f}|{:04}\", 3.14159, 7)` return?",
          options: ["`  3.14|0007`", "`3.14  |7000`", "`3.1416|0007`", "`  3.14|   7`"],
          answer: 0,
          explanation: "`>6.2f` right-aligns a fixed two-decimal number in six columns; `04` zero-pads the integer to four digits. Alignment defaults to right for numbers and left for strings, so the zero padding needs the explicit `0`.",
        },
        {
          prompt: "How does `std::jthread` differ from `std::thread`?",
          options: ["It runs on a real-time scheduler", "It joins in its destructor and can be asked to stop through a `std::stop_token`", "It detaches automatically when it goes out of scope", "It cannot run a lambda"],
          answer: 1,
          explanation: "A `std::thread` that is destroyed while joinable calls `std::terminate`; a `std::jthread` requests a stop and joins instead, which makes it RAII-correct. Both take any callable, lambdas included.",
        },
        {
          prompt: "Which of these does *not* compile on this track's runtime?",
          options: ["`std::format(\"{}\", x)`", "`std::span<const int> s{v};`", "`std::println(\"{}\", x);`", "`std::jthread t{[] { work(); }};`"],
          answer: 2,
          explanation: "`std::print` and `std::println` are C++23 (`<print>`) and absent under `-std=c++20`. `std::format`, `std::span` and `std::jthread` are C++20 and available.",
        },
        {
          prompt: "Does this compile?\n\n```cpp\nstruct S { int a; int b; };\nS s{.b = 1, .a = 2};\n```",
          options: ["Yes; `a` is 2 and `b` is 1", "No: designators must appear in declaration order", "Yes; `a` is 1 and `b` is 2", "No: designated initialisers need a constructor"],
          answer: 1,
          explanation: "C++20 designated initialisers must name members in the order they are declared (C allows any order; C++ does not), and they work only on aggregates — no constructor involved. `S s{.a = 2, .b = 1};` is the fix.",
        },
      ],
    },
    {
      slug: "modern-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Duration ledger",
          prompt: `Read an integer \`n\`, then \`n\` durations, one per line, each an integer immediately followed by a unit: \`ms\`, \`s\`, \`min\` or \`h\` (\`250ms\`, \`90s\`, \`5min\`, \`2h\`). Add them all up as a \`std::chrono::milliseconds\` — convert each token into the matching \`<chrono>\` type and let the implicit widening conversion do the rest; never multiply by 1000 by hand. Then split the total with \`duration_cast\` and duration subtraction and print \`total: <h>h <m>m <s>s <ms>ms\`, followed by \`seconds: <total in whole seconds>\`.

**Input:** \`n\`, then \`n\` tokens.
**Output:** two lines.

Example: input \`3\` / \`90s\` / \`5min\` / \`2h\` →
\`\`\`text
total: 2h 6m 30s 0ms
seconds: 7590
\`\`\``,
          starter: String.raw`#include <cctype>
#include <chrono>
#include <iostream>
#include <string>

int main() {
    using namespace std::chrono;
    int n;
    std::cin >> n;
    milliseconds total{0};
    for (int i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        // TODO: split the token into its number and its unit, add the right duration to total
    }
    // TODO: hours, then minutes of the remainder, then seconds, then milliseconds
    // TODO: print "total: <h>h <m>m <s>s <ms>ms" and "seconds: <whole seconds>"
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <chrono>
#include <iostream>
#include <string>

int main() {
    using namespace std::chrono;
    int n;
    std::cin >> n;
    milliseconds total{0};
    for (int i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        std::size_t split = 0;
        while (split < token.size() && std::isdigit(static_cast<unsigned char>(token[split]))) ++split;
        const long long amount = std::stoll(token.substr(0, split));
        const std::string unit = token.substr(split);
        if (unit == "ms") total += milliseconds{amount};
        else if (unit == "s") total += seconds{amount};
        else if (unit == "min") total += minutes{amount};
        else if (unit == "h") total += hours{amount};
    }
    const auto h = duration_cast<hours>(total);
    const auto m = duration_cast<minutes>(total - h);
    const auto s = duration_cast<seconds>(total - h - m);
    const auto ms = total - h - m - s;
    std::cout << "total: " << h.count() << "h " << m.count() << "m " << s.count() << "s " << ms.count() << "ms\n";
    std::cout << "seconds: " << duration_cast<seconds>(total).count() << '\n';
    return 0;
}
`,
          hints: [
            "The number is the leading run of digits; std::stoll on that prefix, and the rest of the token is the unit.",
            "total += seconds{amount}; compiles because seconds widen to milliseconds implicitly; the reverse would need duration_cast.",
            "duration_cast<hours>(total) truncates; subtract it from total before casting the remainder to minutes, and so on.",
          ],
          cases: [
            { stdin: "3\n90s\n5min\n2h\n", expected: "total: 2h 6m 30s 0ms\nseconds: 7590\n" },
            { stdin: "2\n250ms\n1s\n", expected: "total: 0h 0m 1s 250ms\nseconds: 1\n" },
            { stdin: "1\n3600s\n", expected: "total: 1h 0m 0s 0ms\nseconds: 3600\n", hidden: true },
            { stdin: "4\n999ms\n1ms\n59min\n60s\n", expected: "total: 1h 0m 1s 0ms\nseconds: 3601\n", hidden: true },
            { stdin: "0\n", expected: "total: 0h 0m 0s 0ms\nseconds: 0\n", hidden: true },
          ],
        },
        {
          title: "Day of the year at compile time",
          prompt: `Using a \`constexpr std::array<int, 12>\` of month lengths for a non-leap year, build a second table \`START\` of thirteen prefix sums with a \`constexpr\` function — \`START[m]\` is the number of days before month \`m + 1\`, so \`START[0] == 0\`, \`START[2] == 59\` and \`START[12] == 365\` — and prove those three with a \`static_assert\`. Then write \`std::optional<int> dayOfYear(int month, int day)\` that returns \`std::nullopt\` when the month is not 1–12 or the day is not valid for that month, and otherwise the day's number in the year.

Read an integer \`n\`, then \`n\` lines of \`month day\`, and print \`<month>/<day> -> <day of year>\` or \`<month>/<day> -> invalid\`. Use an \`if\` with initialiser to test the optional.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

Example: input \`3\` / \`1 1\` / \`3 1\` / \`12 31\` →
\`\`\`text
1/1 -> 1
3/1 -> 60
12/31 -> 365
\`\`\``,
          starter: String.raw`#include <array>
#include <iostream>
#include <optional>

constexpr std::array<int, 12> DAYS{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

// START[m] = days before month m + 1; START[12] = 365.
constexpr std::array<int, 13> makeStarts() {
    std::array<int, 13> starts{};
    // TODO: prefix sums of DAYS
    return starts;
}

constexpr auto START = makeStarts();
// TODO: static_assert START[0] == 0, START[2] == 59, START[12] == 365

std::optional<int> dayOfYear(int month, int day) {
    // TODO
    return std::nullopt;
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int month, day;
        std::cin >> month >> day;
        // TODO: print "<month>/<day> -> <n>" or "<month>/<day> -> invalid"
    }
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>
#include <optional>

constexpr std::array<int, 12> DAYS{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

// START[m] = days before month m + 1; START[12] = 365.
constexpr std::array<int, 13> makeStarts() {
    std::array<int, 13> starts{};
    for (std::size_t m = 0; m < DAYS.size(); ++m) starts[m + 1] = starts[m] + DAYS[m];
    return starts;
}

constexpr auto START = makeStarts();
static_assert(START[0] == 0 && START[2] == 59 && START[12] == 365);

std::optional<int> dayOfYear(int month, int day) {
    if (month < 1 || month > 12) return std::nullopt;
    const std::size_t index = static_cast<std::size_t>(month - 1);
    if (day < 1 || day > DAYS[index]) return std::nullopt;
    return START[index] + day;
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int month, day;
        std::cin >> month >> day;
        std::cout << month << '/' << day << " -> ";
        if (const auto d = dayOfYear(month, day); d.has_value()) {
            std::cout << *d << '\n';
        } else {
            std::cout << "invalid\n";
        }
    }
    return 0;
}
`,
          hints: [
            "starts[m + 1] = starts[m] + DAYS[m] for m from 0 to 11 gives the thirteen prefix sums.",
            "Check the month before indexing DAYS with it — an out-of-range index is undefined behaviour at run time.",
            "The result is START[month - 1] + day; returning an int from a function that returns std::optional<int> wraps it.",
          ],
          cases: [
            { stdin: "3\n1 1\n3 1\n12 31\n", expected: "1/1 -> 1\n3/1 -> 60\n12/31 -> 365\n" },
            { stdin: "2\n2 29\n13 1\n", expected: "2/29 -> invalid\n13/1 -> invalid\n" },
            { stdin: "2\n2 28\n0 5\n", expected: "2/28 -> 59\n0/5 -> invalid\n", hidden: true },
            { stdin: "3\n4 31\n4 30\n7 4\n", expected: "4/31 -> invalid\n4/30 -> 120\n7/4 -> 185\n", hidden: true },
            { stdin: "2\n1 0\n12 32\n", expected: "1/0 -> invalid\n12/32 -> invalid\n", hidden: true },
          ],
        },
        {
          title: "Constrained statistics",
          prompt: `Define a concept \`Number\` satisfied by any integral or floating-point type, and a function template \`summarise\` constrained by it that takes a \`std::span<const T>\` and returns a \`std::tuple<T, T, double>\` of the smallest value, the largest value and the mean. Accumulate the sum in a \`long long\` when \`T\` is integral and in a \`double\` otherwise — \`if constexpr\` or \`std::conditional_t\` — so integer input never overflows.

The first token of the input is \`int\` or \`double\`; then comes \`n\` (at least 1) and \`n\` numbers of that kind. Read them into a \`std::vector\` of the matching type, call \`summarise\` on a span over it, bind the result with a structured binding, and print one line with \`std::format\`: for \`int\`, \`lo=<lo> hi=<hi> mean=<mean>\`; for \`double\`, the same with \`lo\` and \`hi\` to two decimals. The mean always has two decimals.

**Input:** the kind, \`n\`, then \`n\` numbers.
**Output:** one line.

Example: input \`int 4 1 9 3 5\` → \`lo=1 hi=9 mean=4.50\`; input \`double 3 1.5 9.25 2.75\` → \`lo=1.50 hi=9.25 mean=4.50\`.`,
          starter: String.raw`#include <concepts>
#include <format>
#include <iostream>
#include <span>
#include <string>
#include <tuple>
#include <type_traits>
#include <vector>

// TODO: the Number concept

// TODO: template <Number T> std::tuple<T, T, double> summarise(std::span<const T> xs)

template <typename T>
void run() {
    int n;
    std::cin >> n;
    std::vector<T> values(n);
    for (auto& v : values) std::cin >> v;
    // TODO: summarise a span over values, bind lo/hi/mean, print with std::format
}

int main() {
    std::string kind;
    std::cin >> kind;
    if (kind == "int") run<int>();
    else run<double>();
    return 0;
}
`,
          solution: String.raw`#include <concepts>
#include <format>
#include <iostream>
#include <span>
#include <string>
#include <tuple>
#include <type_traits>
#include <vector>

template <typename T>
concept Number = std::integral<T> || std::floating_point<T>;

// Smallest, largest and mean of a non-empty sequence. The running sum is a long long
// for integers (so int input cannot overflow) and a double otherwise.
template <Number T>
std::tuple<T, T, double> summarise(std::span<const T> xs) {
    using Sum = std::conditional_t<std::integral<T>, long long, double>;
    T lo = xs[0];
    T hi = xs[0];
    Sum sum = 0;
    for (const T x : xs) {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
        sum += x;
    }
    return {lo, hi, static_cast<double>(sum) / static_cast<double>(xs.size())};
}

template <typename T>
void run() {
    int n;
    std::cin >> n;
    std::vector<T> values(n);
    for (auto& v : values) std::cin >> v;
    const auto [lo, hi, mean] = summarise(std::span<const T>{values});
    if constexpr (std::integral<T>) {
        std::cout << std::format("lo={} hi={} mean={:.2f}\n", lo, hi, mean);
    } else {
        std::cout << std::format("lo={:.2f} hi={:.2f} mean={:.2f}\n", lo, hi, mean);
    }
}

int main() {
    std::string kind;
    std::cin >> kind;
    if (kind == "int") run<int>();
    else run<double>();
    return 0;
}
`,
          hints: [
            "concept Number = std::integral<T> || std::floating_point<T>; — concepts compose with the logical operators.",
            "std::conditional_t<std::integral<T>, long long, double> picks the accumulator type at compile time.",
            "The span must be spelled out — std::span<const T>{values} — because a template parameter is not deduced through a conversion.",
          ],
          cases: [
            { stdin: "int\n4\n1 9 3 5\n", expected: "lo=1 hi=9 mean=4.50\n" },
            { stdin: "double\n3\n1.5 9.25 2.75\n", expected: "lo=1.50 hi=9.25 mean=4.50\n" },
            { stdin: "int\n2\n2000000000 2000000000\n", expected: "lo=2000000000 hi=2000000000 mean=2000000000.00\n", hidden: true },
            { stdin: "double\n1\n-0.5\n", expected: "lo=-0.50 hi=-0.50 mean=-0.50\n", hidden: true },
            { stdin: "int\n3\n-3 -1 -2\n", expected: "lo=-3 hi=-1 mean=-2.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Structured bindings, `std::optional`, `std::string_view` and `if` with an initialiser all arrived in which standard?",
          options: ["C++11", "C++14", "C++17", "C++20"],
          answer: 2,
          explanation: "C++17 is the vocabulary-types release. C++11 brought `auto` and lambdas, C++14 refined them, and C++20 added concepts, ranges and `std::format`.",
        },
        {
          prompt: "Which header exists solely to define the library feature-test macros such as `__cpp_lib_format`?",
          options: ["`<format>`", "`<version>`", "`<cstddef>`", "`<limits>`"],
          answer: 1,
          explanation: "`<version>` (C++20) defines every `__cpp_lib_*` macro in one place. Each feature's own header also defines its macro, but only `<version>` defines all of them without pulling in the feature.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector<int> v{1, 2};\nauto w = v;\nw.push_back(3);\nstd::cout << v.size();\n```",
          options: ["`2`", "`3`", "Compile error", "Undefined behaviour"],
          answer: 0,
          explanation: "`auto w = v;` deduces `std::vector<int>` and copies — value semantics, not a reference. `auto& w = v;` would have made `w` an alias and printed `3`.",
        },
        {
          prompt: "In `for (const auto& [k, v] : m)` over a `std::map<std::string, int>`, what is the type of `k`?",
          options: ["`std::string`", "`const std::string`", "`std::string&`", "`int`"],
          answer: 1,
          explanation: "A map's value type is `std::pair<const std::string, int>`: the key is `const` inside the pair so it can never be changed under the tree. The binding names that `const std::string`, seen through a const reference.",
        },
        {
          prompt: "What does `static_assert(SIEVE[91] == false);` beside `constexpr auto SIEVE = makeSieve();` guarantee?",
          options: ["The sieve is rebuilt at run time if the check fails", "The check runs on every execution and prints a message", "The build fails if the entry is wrong; the check costs nothing at run time", "`SIEVE` becomes `const` for the rest of the program"],
          answer: 2,
          explanation: "`static_assert` is evaluated by the compiler; a false condition is a compile error and a true one leaves no trace in the executable. It is the natural unit test for compile-time tables.",
        },
        {
          prompt: "A function computes a minimum, a maximum and a total. Which return type is the idiomatic choice?",
          options: ["`std::tuple<int, int, long long>`", "A struct with named members `lo`, `hi`, `sum`", "Three output parameters by reference", "`std::vector<long long>` with three elements"],
          answer: 1,
          explanation: "A struct gives the results names — `result.sum` rather than `std::get<2>(result)` — and still works with structured bindings. Tuples suit generic code and pairs suit natural two-ness; output parameters are the pre-C++11 shape.",
        },
        {
          prompt: "`std::span<const int> s{v};` where `v` is `{10, 20, 30, 40, 50}`. Which elements does `s.subspan(2, 3)` view?",
          options: ["`20, 30`", "`30, 40, 50`", "`30, 40`", "`40, 50`"],
          answer: 1,
          explanation: "`subspan(offset, count)` starts at index `offset` and takes `count` elements: indices 2, 3, 4. It is O(1) and copies nothing — a new pointer-and-length over the same memory.",
        },
        {
          prompt: "What does `std::chrono::duration_cast<std::chrono::minutes>(std::chrono::seconds{150}).count()` return?",
          options: ["`2`", "`2.5`", "`3`", "Compile error"],
          answer: 0,
          explanation: "`duration_cast` truncates toward zero, so 150 seconds is 2 whole minutes. The implicit conversion is refused precisely because it would lose the 30 seconds; `duration_cast` is the explicit acknowledgement.",
        },
        {
          prompt: "What is the main benefit of constraining a template with a concept rather than leaving it unconstrained?",
          options: ["The generated code runs faster", "A bad argument fails at the call site with a message naming the unmet requirement, instead of deep inside the body", "The template can be defined in a `.cpp` file", "It allows run-time type checks"],
          answer: 1,
          explanation: "Constraints are checked during overload resolution, so the error says \"`double` does not satisfy `std::integral`\" at the call rather than pages of instantiation notes. Code generation is unchanged; templates still live in headers.",
        },
        {
          prompt: "In `std::ranges::sort(people, {}, &Person::age)`, what is the third argument?",
          options: ["A comparator", "A projection: sort by each element's `age`", "A predicate that filters which elements are sorted", "The initial value"],
          answer: 1,
          explanation: "Ranges algorithms take an optional comparator (here `{}`, the default `<`) and then a projection applied to each element before comparing. `sort(people, &Person::age)` would pass the member pointer as the comparator and fail to compile.",
        },
        {
          prompt: "What does `std::format(\"{} {:.1f}\", 3.0, 3.0)` return?",
          options: ["`3 3.0`", "`3.0 3.0`", "`3.000000 3.0`", "`3 3`"],
          answer: 0,
          explanation: "An empty spec prints the shortest representation that round-trips — `3` for `3.0` — while `.1f` asks for fixed notation with one decimal. This differs from `std::cout`, which would print `3` for both without manipulators.",
        },
        {
          prompt: "Which C++23 type represents \"either a value or an error\" without exceptions?",
          options: ["`std::optional<T>`", "`std::variant<T, E>`", "`std::expected<T, E>`", "`std::error_code`"],
          answer: 2,
          explanation: "`std::expected<T, E>` holds a `T` or an `E` with `has_value()`, `value()` and `error()`. `std::optional` has no error payload, `std::variant` has no success/failure meaning, and `std::error_code` is only the error half. It is C++23 and reading only on this track.",
        },
        {
          prompt: "What does `[[likely]]` on a branch change?",
          options: ["The branch is evaluated first", "The compiler's code layout for that branch; program behaviour is unchanged", "The branch is checked at compile time", "The branch can no longer throw"],
          answer: 1,
          explanation: "It is an optimisation hint about which outcome to expect, affecting instruction placement and nothing observable. A wrong hint costs a little speed, never correctness.",
        },
        {
          prompt: "Why must a judged program that uses `std::jthread` still print its results only after the threads have finished?",
          options: ["Because `std::jthread` does not join automatically", "Because output from several threads interleaves unpredictably, so the expected output could never match", "Because `std::cout` cannot be used from a thread", "Because the judge runs single-core"],
          answer: 1,
          explanation: "`std::jthread` does join in its destructor, but that only guarantees the thread has ended by then. Anything the threads print themselves arrives in an order the scheduler chooses; a deterministic program collects results, joins, then prints once.",
        },
        {
          prompt: "Which line is a compile error?\n\n```cpp\nauto a = {1, 2};        // 1\nauto b{1};              // 2\nauto c{1, 2};           // 3\nauto d = 1;             // 4\n```",
          options: ["Line 1", "Line 2", "Line 3", "Line 4"],
          answer: 2,
          explanation: "Direct-list-initialisation of `auto` requires exactly one element (line 2 gives `int`); line 3 is rejected. Line 1 is copy-list-initialisation and deduces `std::initializer_list<int>`; line 4 is plain `int`.",
        },
      ],
    },
  ],
});

import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "functions",
  title: "Functions",
  blurb: "Declarations and definitions, the three ways to pass a parameter, overloading and default arguments, recursion with memoisation, a first look at lambdas, and scope, lifetime and linkage.",
  icon: "function",
  overview: `A C++ program is a set of functions calling each other, and every decision about a function — what it takes, what it returns, where it may be called from, how long the things it names stay alive — is a decision the compiler enforces and the linker checks. Get the shape of a function right and the rest of the language has somewhere to live: classes are functions with state, templates are functions with type parameters, algorithms are functions that take functions.

This module builds that shape. It starts with the vocabulary — signature, prototype, definition, the one-definition rule as it applies to functions — and the layout rules that let \`main\` come first. Passing parameters follows: by value, by reference and by const reference, the cost model that decides between them, and why returning a value beats an output parameter. Overloading and default arguments come next, with the resolution ranks that explain why \`f(3L)\` is ambiguous and why a string literal picks a \`bool\` overload. Recursion covers the base case, the call stack and its limits, memoisation with a \`std::vector\`, and the fill and permutation shapes interviews ask for. Lambdas get their first look — captures by value and reference, \`mutable\`, generic parameters, a comparator for \`std::sort\` — and the module closes with scope, lifetime and linkage: function-local \`static\`, anonymous namespaces, \`extern\`, \`inline\`, and what a dangling reference is.

Every exercise is a whole program that names the functions it wants: prototypes above \`main\` and definitions below, an out-parameter by reference, a struct returned by value, an overload set and a defaulted parameter, a memoised recursion and a flood fill, lambdas handed to \`std::sort\` and \`std::count_if\`, a function-local \`static\` counter and a helper hidden in an anonymous namespace. The checkpoint's three programs — permutations, a grade report and a leaderboard — draw on all of it.`,
  lessons: [
    {
      slug: "declarations-and-definitions",
      file: "01-declarations-and-definitions.md",
      exercises: [
        {
          title: "Prototypes above, definitions below",
          prompt: `Read an integer \`n\`, then \`n\` integers \`x\` (each between −1 000 000 and 1 000 000, one per line). For each, print \`<x>: cube=<x³> prime=<yes|no>\`.

Write two free functions, **declared as prototypes above \`main\` and defined below it** (the starter has the layout):

- \`long long cube(long long x);\` — returns x × x × x.
- \`bool isPrime(long long x);\` — true when x is a prime; numbers below 2 (including 0, 1 and every negative) are not prime.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n\` lines.

Example: input \`4\`, \`2\`, \`7\`, \`10\`, \`-3\` →
\`\`\`
2: cube=8 prime=yes
7: cube=343 prime=yes
10: cube=1000 prime=no
-3: cube=-27 prime=no
\`\`\``,
          starter: String.raw`#include <iostream>

long long cube(long long x);
bool isPrime(long long x);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long x = 0;
        std::cin >> x;
        std::cout << x << ": cube=" << cube(x) << " prime=" << (isPrime(x) ? "yes" : "no") << '\n';
    }
    return 0;
}

long long cube(long long x) {
    // TODO: return x * x * x
    return 0;
}

bool isPrime(long long x) {
    // TODO: anything below 2 is not prime; otherwise trial-divide up to the square root
    return false;
}
`,
          solution: String.raw`#include <iostream>

long long cube(long long x);
bool isPrime(long long x);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long x = 0;
        std::cin >> x;
        std::cout << x << ": cube=" << cube(x) << " prime=" << (isPrime(x) ? "yes" : "no") << '\n';
    }
    return 0;
}

long long cube(long long x) {
    return x * x * x;
}

bool isPrime(long long x) {
    if (x < 2) return false;
    for (long long d = 2; d * d <= x; ++d) {
        if (x % d == 0) return false;
    }
    return true;
}
`,
          hints: [
            "The prototypes at the top are what let main call cube and isPrime before their definitions appear.",
            "For isPrime, return false for x < 2 first, then loop d from 2 while d * d <= x and return false on the first divisor.",
            "A long long holds 1 000 000 cubed (10^18) comfortably; an int would overflow.",
          ],
          cases: [
            { stdin: "4\n2\n7\n10\n-3\n", expected: "2: cube=8 prime=yes\n7: cube=343 prime=yes\n10: cube=1000 prime=no\n-3: cube=-27 prime=no\n" },
            { stdin: "3\n1\n0\n97\n", expected: "1: cube=1 prime=no\n0: cube=0 prime=no\n97: cube=912673 prime=yes\n" },
            { stdin: "2\n1000000\n999983\n", expected: "1000000: cube=1000000000000000000 prime=no\n999983: cube=999949000866995087 prime=yes\n", hidden: true },
            { stdin: "1\n-7\n", expected: "-7: cube=-343 prime=no\n", hidden: true },
          ],
        },
        {
          title: "A tiny test harness",
          prompt: `Write a \`[[nodiscard]] int clamp(int value, int lo, int hi)\` that returns \`lo\` when \`value < lo\`, \`hi\` when \`value > hi\`, and \`value\` otherwise — and a \`bool check(const std::string& name, int actual, int expected)\` that prints \`PASS <name>\` when they are equal or \`FAIL <name>: expected <expected> got <actual>\` when they are not, and returns whether they matched.

Read \`n\`, then \`n\` lines \`value lo hi expected\`. For line \`i\` (counting from 1) call \`check("case" + std::to_string(i), clamp(value, lo, hi), expected)\` and count the results. Finally print \`passed=<p> failed=<f>\`.

**Input:** \`n\`, then \`n\` lines of four integers.
**Output:** \`n\` PASS/FAIL lines, then the summary line.

Example: input \`2\`, \`15 0 10 15\`, \`3 3 3 3\` →
\`\`\`
FAIL case1: expected 15 got 10
PASS case2
passed=1 failed=1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

[[nodiscard]] int clamp(int value, int lo, int hi);
bool check(const std::string& name, int actual, int expected);

int main() {
    int n = 0;
    std::cin >> n;
    int passed = 0;
    int failed = 0;
    for (int i = 1; i <= n; ++i) {
        int value = 0, lo = 0, hi = 0, expected = 0;
        std::cin >> value >> lo >> hi >> expected;
        // TODO: call check with the name "case<i>", the clamped value and the expectation; count the result
    }
    std::cout << "passed=" << passed << " failed=" << failed << '\n';
    return 0;
}

int clamp(int value, int lo, int hi) {
    // TODO: lo if below, hi if above, otherwise value
    return value;
}

bool check(const std::string& name, int actual, int expected) {
    // TODO: print PASS <name> or FAIL <name>: expected <expected> got <actual>; return whether they matched
    return false;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

[[nodiscard]] int clamp(int value, int lo, int hi);
bool check(const std::string& name, int actual, int expected);

int main() {
    int n = 0;
    std::cin >> n;
    int passed = 0;
    int failed = 0;
    for (int i = 1; i <= n; ++i) {
        int value = 0, lo = 0, hi = 0, expected = 0;
        std::cin >> value >> lo >> hi >> expected;
        if (check("case" + std::to_string(i), clamp(value, lo, hi), expected)) {
            ++passed;
        } else {
            ++failed;
        }
    }
    std::cout << "passed=" << passed << " failed=" << failed << '\n';
    return 0;
}

int clamp(int value, int lo, int hi) {
    if (value < lo) return lo;
    if (value > hi) return hi;
    return value;
}

bool check(const std::string& name, int actual, int expected) {
    if (actual == expected) {
        std::cout << "PASS " << name << '\n';
        return true;
    }
    std::cout << "FAIL " << name << ": expected " << expected << " got " << actual << '\n';
    return false;
}
`,
          hints: [
            "check does two things: it prints one line and it returns a bool — main uses the bool to decide which counter to bump.",
            "\"case\" + std::to_string(i) builds the name; the const std::string& parameter binds to that temporary without copying it.",
            "[[nodiscard]] belongs on the prototype; the definition below does not repeat it.",
          ],
          cases: [
            { stdin: "3\n5 0 10 5\n-4 0 10 0\n99 0 10 10\n", expected: "PASS case1\nPASS case2\nPASS case3\npassed=3 failed=0\n" },
            { stdin: "2\n15 0 10 15\n3 3 3 3\n", expected: "FAIL case1: expected 15 got 10\nPASS case2\npassed=1 failed=1\n" },
            { stdin: "1\n-100 -50 50 -50\n", expected: "PASS case1\npassed=1 failed=0\n", hidden: true },
            { stdin: "2\n7 10 20 7\n0 -1 1 0\n", expected: "FAIL case1: expected 7 got 10\nPASS case2\npassed=1 failed=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `The whole program is:
\`\`\`cpp
#include <iostream>
int twice(int x);
int main() { std::cout << twice(21) << '\\n'; }
\`\`\`
What happens?`,
          options: ["It prints 42", "Compile error: 'twice' was not declared in this scope", "Linker error: undefined reference to `twice(int)`", "It compiles and links but crashes at run time"],
          answer: 2,
          explanation: "The prototype satisfies the compiler — the call type-checks — but no definition exists anywhere, so the **linker** cannot find the code. \"Not declared in this scope\" would appear only if the prototype were missing too.",
        },
        {
          prompt: "Which of these declares the **same** function as `int total(int count, double rate);` rather than a different one?",
          options: ["`int total(int, double);`", "`double total(int count, double rate);`", "`int total(double rate, int count);`", "`int total(int count);`"],
          answer: 0,
          explanation: "Parameter names are not part of the signature, so dropping them changes nothing. A different return type with the same parameters is an error (not an overload), and a different parameter order or count is a different function.",
        },
        {
          prompt: "A non-`void` function has a path on which control reaches the closing brace without a `return`. What does C++ say about that?",
          options: ["It is always a compile error", "The function returns 0 on that path", "It is undefined behaviour; `-Wall` warns \"control reaches end of non-void function\"", "It throws an exception at run time"],
          answer: 2,
          explanation: "The language makes it undefined behaviour rather than an error, and the optimiser may assume the path is never taken. The warning is the only safety net, which is why `-Wall` is always on in this track. Only `main` gets an implicit `return 0`.",
        },
        {
          prompt: "`main` finishes by reaching its closing brace with no `return` statement. What exit code does the process have, and what does the study judge make of it?",
          options: ["An unspecified value; the judge may report a runtime error", "0 — success; the judge is satisfied", "1 — failure; the judge reports a runtime error", "The program does not compile"],
          answer: 1,
          explanation: "`main` is the one function with an implicit `return 0;`. The judge treats any non-zero exit as a runtime error, so a `return 1;` on a successful path would fail a case even with correct output.",
        },
        {
          prompt: "Compiled as C++20 with `-Wall`, what does the statement `v.empty();` on a `std::vector<int> v` produce?",
          options: ["Nothing — the call is valid and does nothing", "A warning: ignoring return value declared with attribute `nodiscard`", "A compile error", "It clears the vector"],
          answer: 1,
          explanation: "`empty()` is `[[nodiscard]]` since C++20 precisely because this statement is almost always a mistaken `clear()`. The attribute turns an ignored result into a warning, not an error.",
        },
        {
          prompt: "`isOdd(n)` is written as `!isEven(n)` and `isEven(n)` as `n == 0 || isOdd(n - 1)`. Which layout compiles?",
          options: ["Define `isEven` above `isOdd`", "Define `isOdd` above `isEven`", "Put a prototype of one of them before the definition of the other", "Mutual recursion cannot be written in C++"],
          answer: 2,
          explanation: "Whichever is defined first calls the other before it has been declared. A forward declaration (prototype) of the second function above the first breaks the cycle; the order of the definitions then does not matter.",
        },
        {
          prompt: "What is the strongest reason to split a long `main` into small functions?",
          options: ["The compiler generates faster code for short functions", "Each function can be tested on its own with known inputs and expected outputs", "It reduces the size of the executable", "C++ limits a function to 100 lines"],
          answer: 1,
          explanation: "A function whose result depends only on its parameters can be checked in isolation; logic inlined in `main` can only be tested by running the whole program. Speed and size are unaffected, and there is no line limit.",
        },
      ],
    },
    {
      slug: "passing-parameters",
      file: "02-passing-parameters.md",
      exercises: [
        {
          title: "Divide with out-parameters",
          prompt: `Write \`bool tryDivide(int dividend, int divisor, int& quotient, int& remainder)\`: when \`divisor\` is 0 it returns \`false\` and leaves both out-parameters untouched; otherwise it stores the truncating quotient and the remainder (plain \`/\` and \`%\`) through the references and returns \`true\`.

Read \`n\`, then \`n\` pairs \`a b\`. For each, print \`<a> / <b> = <q> remainder <r>\` or \`<a> / <b>: division by zero\`.

**Input:** \`n\`, then \`n\` lines of two integers.
**Output:** \`n\` lines.

Example: input \`3\`, \`17 5\`, \`-17 5\`, \`8 0\` →
\`\`\`
17 / 5 = 3 remainder 2
-17 / 5 = -3 remainder -2
8 / 0: division by zero
\`\`\`
The two results travel back through \`int&\` parameters; the return value is the success flag — the pattern the lesson calls "a result and a success flag together".`,
          starter: String.raw`#include <iostream>

bool tryDivide(int dividend, int divisor, int& quotient, int& remainder);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int a = 0, b = 0;
        std::cin >> a >> b;
        int q = 0, r = 0;
        // TODO: call tryDivide and print either the result line or the division-by-zero line
    }
    return 0;
}

bool tryDivide(int dividend, int divisor, int& quotient, int& remainder) {
    // TODO: false when divisor is 0; otherwise assign through the references and return true
    return false;
}
`,
          solution: String.raw`#include <iostream>

bool tryDivide(int dividend, int divisor, int& quotient, int& remainder);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int a = 0, b = 0;
        std::cin >> a >> b;
        int q = 0, r = 0;
        if (tryDivide(a, b, q, r)) {
            std::cout << a << " / " << b << " = " << q << " remainder " << r << '\n';
        } else {
            std::cout << a << " / " << b << ": division by zero\n";
        }
    }
    return 0;
}

bool tryDivide(int dividend, int divisor, int& quotient, int& remainder) {
    if (divisor == 0) return false;
    quotient = dividend / divisor;
    remainder = dividend % divisor;
    return true;
}
`,
          hints: [
            "Assigning to quotient inside tryDivide writes to main's q, because the parameter is a reference to it.",
            "Check the divisor first and return false before touching the out-parameters.",
            "C++ integer division truncates towards zero and % takes the sign of the dividend, so -17 / 5 is -3 remainder -2.",
          ],
          cases: [
            { stdin: "3\n17 5\n-17 5\n8 0\n", expected: "17 / 5 = 3 remainder 2\n-17 / 5 = -3 remainder -2\n8 / 0: division by zero\n" },
            { stdin: "2\n100 10\n7 -2\n", expected: "100 / 10 = 10 remainder 0\n7 / -2 = -3 remainder 1\n" },
            { stdin: "1\n0 3\n", expected: "0 / 3 = 0 remainder 0\n", hidden: true },
            { stdin: "2\n-9 -4\n5 7\n", expected: "-9 / -4 = 2 remainder -1\n5 / 7 = 0 remainder 5\n", hidden: true },
          ],
        },
        {
          title: "Summarise by const reference",
          prompt: `Define \`struct Stats { long long sum; int min; int max; };\` and write two functions that take the data **by const reference** — neither may copy the vector:

- \`Stats summarise(const std::vector<int>& values);\` — returns the sum, the smallest and the largest.
- \`std::string join(const std::vector<int>& values, const std::string& separator);\` — the values as text with the separator between them.

Read \`n\` (at least 1), then \`n\` integers. Print \`values: <joined with ", ">\`, then \`sum=<sum> min=<min> max=<max> mean=<sum ÷ n, fixed to 2 decimals>\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** two lines.

Example: input \`4\`, \`3 -1 7 2\` →
\`\`\`
values: 3, -1, 7, 2
sum=11 min=-1 max=7 mean=2.75
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Stats {
    long long sum;
    int min;
    int max;
};

Stats summarise(const std::vector<int>& values);
std::string join(const std::vector<int>& values, const std::string& separator);

int main() {
    std::size_t n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> values[i];

    Stats s = summarise(values);
    double mean = static_cast<double>(s.sum) / static_cast<double>(n);
    std::cout << "values: " << join(values, ", ") << '\n';
    std::cout << "sum=" << s.sum << " min=" << s.min << " max=" << s.max
              << " mean=" << std::fixed << std::setprecision(2) << mean << '\n';
    return 0;
}

Stats summarise(const std::vector<int>& values) {
    // TODO: start from the first element and fold the rest in
    return Stats{0, 0, 0};
}

std::string join(const std::vector<int>& values, const std::string& separator) {
    // TODO: build the text with std::to_string, putting the separator before every element but the first
    return std::string();
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Stats {
    long long sum;
    int min;
    int max;
};

Stats summarise(const std::vector<int>& values);
std::string join(const std::vector<int>& values, const std::string& separator);

int main() {
    std::size_t n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> values[i];

    Stats s = summarise(values);
    double mean = static_cast<double>(s.sum) / static_cast<double>(n);
    std::cout << "values: " << join(values, ", ") << '\n';
    std::cout << "sum=" << s.sum << " min=" << s.min << " max=" << s.max
              << " mean=" << std::fixed << std::setprecision(2) << mean << '\n';
    return 0;
}

Stats summarise(const std::vector<int>& values) {
    Stats s{0, values.front(), values.front()};
    for (int x : values) {
        s.sum += x;
        if (x < s.min) s.min = x;
        if (x > s.max) s.max = x;
    }
    return s;
}

std::string join(const std::vector<int>& values, const std::string& separator) {
    std::string out;
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) out += separator;
        out += std::to_string(values[i]);
    }
    return out;
}
`,
          hints: [
            "Initialise min and max from values.front() — starting from 0 gives the wrong answer for all-negative or all-positive input.",
            "The sum is a long long so that three values of two billion do not overflow an int.",
            "Return the Stats by value; the struct is small and the caller reads its members by name.",
          ],
          cases: [
            { stdin: "4\n3 -1 7 2\n", expected: "values: 3, -1, 7, 2\nsum=11 min=-1 max=7 mean=2.75\n" },
            { stdin: "1\n42\n", expected: "values: 42\nsum=42 min=42 max=42 mean=42.00\n" },
            { stdin: "3\n2000000000 2000000000 2000000000\n", expected: "values: 2000000000, 2000000000, 2000000000\nsum=6000000000 min=2000000000 max=2000000000 mean=2000000000.00\n", hidden: true },
            { stdin: "5\n-5 -5 0 -5 -5\n", expected: "values: -5, -5, 0, -5, -5\nsum=-20 min=-5 max=0 mean=-4.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
void grow(std::vector<int> v) { v.push_back(1); }
int main() {
    std::vector<int> a;
    grow(a);
    std::cout << a.size() << '\\n';
}
\`\`\``,
          options: ["0", "1", "Compile error", "Undefined behaviour"],
          answer: 0,
          explanation: "`v` is a by-value parameter — a copy of `a`. The `push_back` grows the copy, which is destroyed when `grow` returns. To modify the caller's vector the parameter would need to be `std::vector<int>&`.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
void setTo(int& x, int value) { x = value; }
int main() {
    int n = 3;
    setTo(n, 9);
    setTo(n, n + 1);
    std::cout << n << '\\n';
}
\`\`\``,
          options: ["3", "9", "10", "Compile error"],
          answer: 2,
          explanation: "`x` aliases `n`, so the first call makes `n` 9. The argument `n + 1` is evaluated before the second call as 10 and copied into `value`; the assignment through `x` then sets `n` to 10.",
        },
        {
          prompt: "A function only *reads* a `std::string` that may be very long. Which parameter type is right?",
          options: ["`std::string s`", "`std::string& s`", "`const std::string& s`", "`const std::string s`"],
          answer: 2,
          explanation: "`const std::string&` neither copies nor allows modification, and it binds to literals and temporaries too. By value (with or without `const`) copies the whole string; a non-`const` reference advertises modification and rejects temporaries.",
        },
        {
          prompt: "`void bump(int& x) { ++x; }` is declared. What does the call `bump(5);` do?",
          options: ["Prints nothing and increments a temporary", "Compile error: a non-const lvalue reference cannot bind to an rvalue", "Undefined behaviour", "Increments the literal 5 for the rest of the program"],
          answer: 1,
          explanation: "A `T&` parameter needs an lvalue — a named object to alias. `5` is a temporary, and the compiler refuses: `cannot bind non-const lvalue reference of type 'int&' to an rvalue of type 'int'`. A `const int&` or a by-value `int` would accept it.",
        },
        {
          prompt: "Why is returning a `std::vector<int>` by value from a function *not* an expensive copy in C++17 and later?",
          options: ["Vectors are always small enough to copy cheaply", "Guaranteed copy elision constructs the result directly in the caller's variable, and a returned local is moved at worst", "The compiler silently rewrites it to use an output parameter", "It is expensive — output parameters should always be preferred"],
          answer: 1,
          explanation: "A returned prvalue is built in place with no copy at all since C++17, and a returned named local hands over its buffer through a move (Module 9). Return by value is the modern default; output parameters are for success flags, buffer reuse and in-out updates.",
        },
        {
          prompt: "A function computes both the smallest and the largest element of a range. Which return type documents the result best?",
          options: ["`std::pair<int, int>` — `first` is the min, `second` the max", "A `std::vector<int>` holding two elements", "A `struct MinMax { int min; int max; };`", "Two `int&` output parameters"],
          answer: 2,
          explanation: "Named members say which value is which at every use site; `first`/`second` and element indices leave the reader guessing, and out-parameters force the caller to declare variables before the call. `std::pair` is fine when the halves genuinely have no distinct meaning.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
void divide(int a, int b, int q, int r) { q = a / b; r = a % b; }
int main() {
    int q = 0, r = 0;
    divide(7, 2, q, r);
    std::cout << q << ' ' << r << '\\n';
}
\`\`\``,
          options: ["3 1", "0 0", "Compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "`q` and `r` inside `divide` are by-value copies; the assignments change the copies and nothing in `main`. The missing `&` is a silent bug — the program compiles and prints the untouched zeros.",
        },
      ],
    },
    {
      slug: "overloading-and-default-arguments",
      file: "03-overloading-and-default-arguments.md",
      exercises: [
        {
          title: "Three areas, one name",
          prompt: `Write an overload set named \`area\`:

- \`long long area(long long side);\` — a square.
- \`long long area(long long width, long long height);\` — a rectangle.
- \`double area(double radius);\` — a circle, π × r² using \`std::numbers::pi\`.

Read \`n\`, then \`n\` lines: \`square <side>\`, \`rect <width> <height>\` or \`circle <radius>\`. Print \`square: <area>\`, \`rect: <area>\` or \`circle: <area fixed to 2 decimals>\`.

**Input:** \`n\`, then \`n\` shape lines (integer sides up to 100 000; the radius is a decimal).
**Output:** \`n\` lines.

Example: input \`3\`, \`square 4\`, \`rect 3 5\`, \`circle 2.5\` →
\`\`\`
square: 16
rect: 15
circle: 19.63
\`\`\`
Read the sides into \`long long\` variables and the radius into a \`double\` so every call is an exact match: \`area(4)\` with an \`int\` argument would be ambiguous between the \`long long\` and \`double\` overloads.`,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>

long long area(long long side);
long long area(long long width, long long height);
double area(double radius);

int main() {
    int n = 0;
    std::cin >> n;
    std::cout << std::fixed << std::setprecision(2);
    for (int i = 0; i < n; ++i) {
        std::string shape;
        std::cin >> shape;
        if (shape == "square") {
            long long side = 0;
            std::cin >> side;
            std::cout << "square: " << area(side) << '\n';
        } else if (shape == "rect") {
            long long w = 0, h = 0;
            std::cin >> w >> h;
            std::cout << "rect: " << area(w, h) << '\n';
        } else {
            double radius = 0.0;
            std::cin >> radius;
            std::cout << "circle: " << area(radius) << '\n';
        }
    }
    return 0;
}

long long area(long long side) {
    // TODO
    return 0;
}

long long area(long long width, long long height) {
    // TODO
    return 0;
}

double area(double radius) {
    // TODO: std::numbers::pi * radius * radius
    return 0.0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>

long long area(long long side);
long long area(long long width, long long height);
double area(double radius);

int main() {
    int n = 0;
    std::cin >> n;
    std::cout << std::fixed << std::setprecision(2);
    for (int i = 0; i < n; ++i) {
        std::string shape;
        std::cin >> shape;
        if (shape == "square") {
            long long side = 0;
            std::cin >> side;
            std::cout << "square: " << area(side) << '\n';
        } else if (shape == "rect") {
            long long w = 0, h = 0;
            std::cin >> w >> h;
            std::cout << "rect: " << area(w, h) << '\n';
        } else {
            double radius = 0.0;
            std::cin >> radius;
            std::cout << "circle: " << area(radius) << '\n';
        }
    }
    return 0;
}

long long area(long long side) {
    return side * side;
}

long long area(long long width, long long height) {
    return width * height;
}

double area(double radius) {
    return std::numbers::pi * radius * radius;
}
`,
          hints: [
            "The three definitions differ only in their parameter lists; the compiler picks by the argument types at each call.",
            "std::fixed and setprecision affect only floating-point output, so the integer areas print as plain integers.",
            "std::numbers::pi lives in <numbers> (C++20).",
          ],
          cases: [
            { stdin: "3\nsquare 4\nrect 3 5\ncircle 2.5\n", expected: "square: 16\nrect: 15\ncircle: 19.63\n" },
            { stdin: "2\ncircle 1\nsquare 12\n", expected: "circle: 3.14\nsquare: 144\n" },
            { stdin: "3\nrect 100000 100000\nsquare 0\ncircle 0\n", expected: "rect: 10000000000\nsquare: 0\ncircle: 0.00\n", hidden: true },
            { stdin: "1\ncircle 10\n", expected: "circle: 314.16\n", hidden: true },
          ],
        },
        {
          title: "Frame it, with defaults",
          prompt: `Write \`std::string frame(const std::string& text, char border = '*', int padding = 1);\` — it returns the border character repeated \`padding\` times, a space, the text, a space, and the border repeated again. **Put the defaults on the prototype above \`main\` and write the definition below without them.**

Read \`n\`, then \`n\` lines each holding \`text\` (one word) optionally followed by a border character and optionally a padding count. Call \`frame\` with one, two or three arguments — exactly as many as the line supplied — and print the result.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

Example: input \`3\`, \`hi\`, \`hi #\`, \`hi # 3\` →
\`\`\`
* hi *
# hi #
### hi ###
\`\`\`
The starter reads each line into a \`std::istringstream\`; extracting the border and the padding fails cleanly when they are absent, which tells you how many arguments to pass.`,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <string>

// TODO: give border and padding their defaults here, on the prototype
std::string frame(const std::string& text, char border, int padding);

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string text;
        char border = '\0';
        int padding = 0;
        in >> text;
        bool hasBorder = static_cast<bool>(in >> border);
        bool hasPadding = hasBorder && static_cast<bool>(in >> padding);
        // TODO: call frame with one, two or three arguments depending on hasBorder and hasPadding, and print it
    }
    return 0;
}

std::string frame(const std::string& text, char border, int padding) {
    // TODO: std::string(count, ch) builds a run of one character
    return text;
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <string>

std::string frame(const std::string& text, char border = '*', int padding = 1);

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string text;
        char border = '\0';
        int padding = 0;
        in >> text;
        bool hasBorder = static_cast<bool>(in >> border);
        bool hasPadding = hasBorder && static_cast<bool>(in >> padding);
        if (hasPadding) {
            std::cout << frame(text, border, padding) << '\n';
        } else if (hasBorder) {
            std::cout << frame(text, border) << '\n';
        } else {
            std::cout << frame(text) << '\n';
        }
    }
    return 0;
}

std::string frame(const std::string& text, char border, int padding) {
    std::string edge(static_cast<std::size_t>(padding), border);
    return edge + " " + text + " " + edge;
}
`,
          hints: [
            "Defaults are written once, on the first declaration: the prototype. Repeating them on the definition is a compile error.",
            "std::string edge(static_cast<std::size_t>(padding), border) builds the run of border characters.",
            "The three call forms frame(text), frame(text, border) and frame(text, border, padding) all reach the same one function.",
          ],
          cases: [
            { stdin: "3\nhi\nhi #\nhi # 3\n", expected: "* hi *\n# hi #\n### hi ###\n" },
            { stdin: "2\nreport = 2\nx\n", expected: "== report ==\n* x *\n" },
            { stdin: "1\nwide + 5\n", expected: "+++++ wide +++++\n", hidden: true },
            { stdin: "2\na\nb ~ 2\n", expected: "* a *\n~~ b ~~\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`void f(int); void f(double);` are declared. What does the call `f(3L)` do?",
          options: ["Calls `f(int)` — integers prefer integers", "Calls `f(double)` — `long` is wider than `int`", "Compile error: the call is ambiguous", "Calls whichever overload was declared first"],
          answer: 2,
          explanation: "`long` to `int` and `long` to `double` are both *standard conversions* of the same rank, so neither overload is better and the compiler refuses to choose. Declaration order never breaks a tie.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
void show(const std::string& s) { std::cout << "string\\n"; }
void show(bool b) { std::cout << "bool\\n"; }
int main() { show("hi"); }
\`\`\``,
          options: ["`string`", "`bool`", "Compile error: ambiguous", "Undefined behaviour"],
          answer: 1,
          explanation: "`\"hi\"` is a `const char[3]`; decaying to a pointer and converting to `bool` is a standard conversion, while building a `std::string` is a user-defined conversion, which ranks lower. Add a `const char*` overload or take `std::string_view` to fix it.",
        },
        {
          prompt: "Which declaration is ill-formed?",
          options: ["`int f(int a, int b = 2);`", "`int f(int a = 1, int b = 2);`", "`int f(int a = 1, int b);`", "`int f(int a, int b, int c = 3);`"],
          answer: 2,
          explanation: "Default arguments must be trailing: once a parameter has one, every later parameter must too. There is no way to supply `b` while omitting `a` at a call, so the language rejects the declaration.",
        },
        {
          prompt: `Does this compile?
\`\`\`cpp
int pad(int n, int width = 4);
int pad(int n, int width = 4) { return n + width; }
\`\`\``,
          options: ["Yes — the two defaults agree, so it is fine", "No — a default argument may be specified only once; the definition repeats it", "Yes, with a warning", "No — a definition may never have a default argument"],
          answer: 1,
          explanation: "A default is given on the first declaration and must not be repeated, even with the same value: \"default argument given for parameter 2 of 'int pad(int, int)' after previous specification\". A definition may carry defaults only when it is the first declaration the calls see.",
        },
        {
          prompt: "Which statement about overloading on the return type alone (`int f();` and `double f();`) is correct?",
          options: ["Allowed — the compiler picks by the type the result is assigned to", "Not allowed — the return type is not part of the signature", "Allowed only for `constexpr` functions", "Allowed since C++20"],
          answer: 1,
          explanation: "A call `f();` could not choose, so the second declaration is an error (\"ambiguating new declaration\"). Overloads must differ in the number or types of their parameters.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
void f(int x)  { std::cout << "int "; }
void f(char x) { std::cout << "char "; }
int main() {
    f('a');
    f(97);
    short s = 1;
    f(s);
}
\`\`\``,
          options: ["`char int int`", "`char int char`", "`int int int`", "`char char char`"],
          answer: 0,
          explanation: "`'a'` is an exact match for `char`; `97` is an exact match for `int`; `short` to `int` is a *promotion*, which beats the `short` to `char` *conversion*, so the last call goes to `f(int)` as well.",
        },
        {
          prompt: "`log(msg)` and `log(msg, level)` do the same thing, with `level` treated as 1 when omitted. Which is the cleaner tool?",
          options: ["One function with a default argument `int level = 1`", "Two overloads, one forwarding to the other", "A global `currentLevel` the caller sets first", "A template on the number of arguments"],
          answer: 0,
          explanation: "The parameter is optional and the behaviour is one function, which is exactly what a default expresses — one definition, one place to maintain. Overloads are for different *types* or different *behaviours*; a global adds hidden state.",
        },
      ],
    },
    {
      slug: "recursion",
      file: "04-recursion.md",
      exercises: [
        {
          title: "Count the ways, with a memo",
          prompt: `A staircase of \`n\` steps can be climbed one, two or three steps at a time. Write \`long long ways(int n, std::vector<long long>& memo)\` — recursive, memoised — returning the number of distinct ways: \`ways(0)\` is 1 (stand still), a negative \`n\` contributes 0, and otherwise \`ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)\`.

Read \`q\`, then \`q\` values of \`n\` (0 ≤ n ≤ 60). Allocate **one** memo of size 61 filled with −1 before the queries and pass it by reference to every call; print \`ways(<n>)=<value>\` for each query.

**Input:** \`q\`, then \`q\` integers.
**Output:** \`q\` lines.

Example: input \`4\`, \`3\`, \`4\`, \`10\`, \`0\` →
\`\`\`
ways(3)=4
ways(4)=7
ways(10)=274
ways(0)=1
\`\`\`
Without the memo, \`ways(60)\` would make more calls than the universe has time for; with it, each \`n\` is computed once.`,
          starter: String.raw`#include <iostream>
#include <vector>

long long ways(int n, std::vector<long long>& memo);

int main() {
    int q = 0;
    std::cin >> q;
    std::vector<long long> memo(61, -1);
    for (int i = 0; i < q; ++i) {
        int n = 0;
        std::cin >> n;
        std::cout << "ways(" << n << ")=" << ways(n, memo) << '\n';
    }
    return 0;
}

long long ways(int n, std::vector<long long>& memo) {
    // TODO: base cases (negative -> 0, zero -> 1), then the memo lookup, then compute and store
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

long long ways(int n, std::vector<long long>& memo);

int main() {
    int q = 0;
    std::cin >> q;
    std::vector<long long> memo(61, -1);
    for (int i = 0; i < q; ++i) {
        int n = 0;
        std::cin >> n;
        std::cout << "ways(" << n << ")=" << ways(n, memo) << '\n';
    }
    return 0;
}

long long ways(int n, std::vector<long long>& memo) {
    if (n < 0) return 0;
    if (n == 0) return 1;
    if (memo[n] != -1) return memo[n];
    memo[n] = ways(n - 1, memo) + ways(n - 2, memo) + ways(n - 3, memo);
    return memo[n];
}
`,
          hints: [
            "Handle n < 0 before indexing the memo — memo[-1] is out of bounds.",
            "Check memo[n] != -1 before recursing; store the result into memo[n] before returning it.",
            "The memo must be a reference parameter: a by-value copy would forget everything when the call returns.",
          ],
          cases: [
            { stdin: "4\n3\n4\n10\n0\n", expected: "ways(3)=4\nways(4)=7\nways(10)=274\nways(0)=1\n" },
            { stdin: "2\n30\n1\n", expected: "ways(30)=53798080\nways(1)=1\n" },
            { stdin: "1\n60\n", expected: "ways(60)=4680045560037375\n", hidden: true },
            { stdin: "3\n2\n5\n60\n", expected: "ways(2)=2\nways(5)=13\nways(60)=4680045560037375\n", hidden: true },
          ],
        },
        {
          title: "Flood fill the map",
          prompt: `Read \`R C\` and then \`R\` rows of \`C\` characters: \`.\` is open ground and \`#\` is wall. Two open cells belong to the same region when they share an edge (up, down, left, right).

Write \`int fill(std::vector<std::string>& grid, int r, int c)\` — recursive — that returns 0 when \`(r, c)\` is outside the grid or not open, otherwise marks the cell \`#\` and returns 1 plus the results of the four neighbours. In \`main\`, scan every cell; each time you meet an open one, call \`fill\` and count a region. Print \`regions=<count> largest=<size of the biggest region>\`.

**Input:** \`R C\` (each at most 30), then \`R\` rows.
**Output:** one line.

Example:
\`\`\`
3 4
..#.
.##.
##..
\`\`\`
→ \`regions=2 largest=4\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

int fill(std::vector<std::string>& grid, int r, int c);

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (int r = 0; r < rows; ++r) std::cin >> grid[r];

    int regions = 0;
    int largest = 0;
    // TODO: for every open cell, fill from it, count the region and track the largest size
    std::cout << "regions=" << regions << " largest=" << largest << '\n';
    return 0;
}

int fill(std::vector<std::string>& grid, int r, int c) {
    // TODO: bounds check, open check, mark, then 1 + the four neighbours
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

int fill(std::vector<std::string>& grid, int r, int c);

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (int r = 0; r < rows; ++r) std::cin >> grid[r];

    int regions = 0;
    int largest = 0;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] == '.') {
                int size = fill(grid, r, c);
                ++regions;
                if (size > largest) largest = size;
            }
        }
    }
    std::cout << "regions=" << regions << " largest=" << largest << '\n';
    return 0;
}

int fill(std::vector<std::string>& grid, int r, int c) {
    if (r < 0 || c < 0 || r >= static_cast<int>(grid.size()) || c >= static_cast<int>(grid[0].size())) return 0;
    if (grid[r][c] != '.') return 0;
    grid[r][c] = '#';
    return 1 + fill(grid, r + 1, c) + fill(grid, r - 1, c) + fill(grid, r, c + 1) + fill(grid, r, c - 1);
}
`,
          hints: [
            "Test the bounds before reading grid[r][c]; a negative index is undefined behaviour.",
            "Mark the cell before recursing into its neighbours, or a neighbour recurses straight back into it.",
            "The grid is passed by reference so the marks made deep in the recursion are visible to main's scan.",
          ],
          cases: [
            { stdin: "3 4\n..#.\n.##.\n##..\n", expected: "regions=2 largest=4\n" },
            { stdin: "2 2\n##\n##\n", expected: "regions=0 largest=0\n" },
            { stdin: "1 5\n.....\n", expected: "regions=1 largest=5\n", hidden: true },
            { stdin: "4 4\n.#.#\n#.#.\n.#.#\n#.#.\n", expected: "regions=8 largest=1\n", hidden: true },
            { stdin: "3 3\n...\n...\n...\n", expected: "regions=1 largest=9\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
int f(int n) {
    if (n == 0) return 0;
    return n + f(n - 1);
}
int main() { std::cout << f(4) << '\\n'; }
\`\`\``,
          options: ["10", "4", "24", "Stack overflow"],
          answer: 0,
          explanation: "`f(4)` is 4 + 3 + 2 + 1 + 0 = 10: four frames deep, then the sums are formed on the way back. The base case `n == 0` is reached because every call moves `n` down by one.",
        },
        {
          prompt: "`int f(int n) { return n + f(n - 1); }` is called as `f(3)`. What happens?",
          options: ["Compile error: no base case", "It returns 6", "Infinite recursion until the stack is exhausted — a segmentation fault", "It throws `std::overflow_error`"],
          answer: 2,
          explanation: "Nothing stops the recursion, so frames pile up until the stack runs out and the process is killed. The compiler cannot detect a missing base case, and a stack overflow is not an exception.",
        },
        {
          prompt: "Roughly how many calls does the naive `fib(n) = fib(n-1) + fib(n-2)` make to compute `fib(40)`?",
          options: ["40", "About 1 600 (40²)", "About 330 million", "Exactly 80"],
          answer: 2,
          explanation: "The call count is 2 × fib(n + 1) − 1, and fib(41) is about 165 million — the same subproblems are recomputed over and over. Memoisation reduces it to about 40 calls.",
        },
        {
          prompt: "`long long fib(int n, std::vector<long long> memo)` — the memo is passed **by value**. What is the consequence?",
          options: ["None — it still memoises correctly", "Compile error", "Every call works on its own copy, so results are never shared and the run time is exponential again — plus a vector copy per call", "The memo is shared because vectors are reference types"],
          answer: 2,
          explanation: "A by-value parameter is a fresh copy; the results written into it are thrown away when the call returns. The program is correct but slower than the unmemoised version. The memo must be `std::vector<long long>&`.",
        },
        {
          prompt: "Which statement about tail calls in C++ is correct?",
          options: ["The standard guarantees that a tail-recursive call reuses the frame", "Compilers may eliminate tail calls at `-O2`, but nothing guarantees it — write a loop when the depth matters", "Tail calls are eliminated only in `void` functions", "Every recursion is converted to a loop by the compiler"],
          answer: 1,
          explanation: "Tail-call elimination is an optimisation, not a language rule; a debug build or a slightly different function shape can leave every frame in place. Correctness must never depend on it.",
        },
        {
          prompt: "A flood fill recurses into the four neighbours **first** and marks the current cell `#` afterwards. What goes wrong?",
          options: ["Nothing — the order does not matter", "The region count is off by one", "A neighbour recurses back into the still-unmarked cell, and the recursion never terminates", "Only the first row is filled"],
          answer: 2,
          explanation: "The mark is the base case that stops re-entry. Without it in place before the recursive calls, cell A visits B, B sees A still open and visits A, and so on until the stack overflows.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
int digitSum(int n) {
    return n == 0 ? 0 : n % 10 + digitSum(n / 10);
}
int main() { std::cout << digitSum(4071) << '\\n'; }
\`\`\``,
          options: ["12", "4071", "1", "7"],
          answer: 0,
          explanation: "4071 % 10 is 1, then 407 % 10 is 7, then 40 % 10 is 0, then 4, then the base case: 1 + 7 + 0 + 4 = 12.",
        },
      ],
    },
    {
      slug: "lambdas-first-look",
      file: "05-lambdas-first-look.md",
      exercises: [
        {
          title: "Sort and count with lambdas",
          prompt: `Read \`minLen\`, then \`n\`, then \`n\` words (single tokens). Sort the words with **a lambda comparator passed to \`std::sort\`**: shorter words first, and words of equal length alphabetically. Print the sorted words one per line, then \`long=<count>\`, where the count comes from **\`std::count_if\` with a lambda that captures \`minLen\` by value** and is true for words of length at least \`minLen\`.

**Input:** \`minLen\`, \`n\`, then \`n\` words.
**Output:** \`n\` lines, then the count line.

Example: input \`4\`, \`5\`, \`banana fig apple kiwi date\` →
\`\`\`
fig
date
kiwi
apple
banana
long=4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::size_t minLen = 0;
    std::size_t n = 0;
    std::cin >> minLen >> n;
    std::vector<std::string> words(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> words[i];

    // TODO: std::sort with a lambda comparator: by size, then alphabetically

    long long longWords = 0;
    // TODO: std::count_if with a lambda that captures minLen by value

    for (const auto& w : words) std::cout << w << '\n';
    std::cout << "long=" << longWords << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::size_t minLen = 0;
    std::size_t n = 0;
    std::cin >> minLen >> n;
    std::vector<std::string> words(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> words[i];

    std::sort(words.begin(), words.end(), [](const std::string& a, const std::string& b) {
        if (a.size() != b.size()) return a.size() < b.size();
        return a < b;
    });

    auto longEnough = [minLen](const std::string& w) { return w.size() >= minLen; };
    long long longWords = std::count_if(words.begin(), words.end(), longEnough);

    for (const auto& w : words) std::cout << w << '\n';
    std::cout << "long=" << longWords << '\n';
    return 0;
}
`,
          hints: [
            "The comparator answers \"does a come before b?\" — compare sizes first and fall back to a < b only when they tie.",
            "Never return true for equal elements; a < b (not <=) keeps the ordering strict.",
            "[minLen] copies the threshold into the closure; the predicate then needs no other context.",
          ],
          cases: [
            { stdin: "4\n5\nbanana fig apple kiwi date\n", expected: "fig\ndate\nkiwi\napple\nbanana\nlong=4\n" },
            { stdin: "6\n3\nab abc a\n", expected: "a\nab\nabc\nlong=0\n" },
            { stdin: "1\n1\nzeta\n", expected: "zeta\nlong=1\n", hidden: true },
            { stdin: "3\n4\nbee ant cat bee\n", expected: "ant\nbee\nbee\ncat\nlong=4\n", hidden: true },
          ],
        },
        {
          title: "Captures: by value, by reference, mutable",
          prompt: `Read \`threshold\`, then \`n\`, then \`n\` integers. Build three lambdas, each stored in an \`auto\` variable:

- \`above\` — captures \`threshold\` **by value** and returns whether \`x > threshold\`.
- \`addToTotal\` — captures a \`long long total\` **by reference** and adds \`x\` to it.
- \`nextLine\` — captures an \`int line\` (initially 0) **by value**, is \`mutable\`, and returns \`++line\` on each call.

Loop over the values: for each one \`above\` accepts, print \`<nextLine()>: <x>\` and call \`addToTotal(x)\`. Finally print \`kept=<std::count_if with above> total=<total> outer=<main's line variable>\` — the last number shows that the mutable lambda changed its own copy, not \`main\`'s.

**Input:** \`threshold\`, \`n\`, then \`n\` integers.
**Output:** one line per accepted value, then the summary line.

Example: input \`10\`, \`6\`, \`4 12 10 25 -3 11\` →
\`\`\`
1: 12
2: 25
3: 11
kept=3 total=48 outer=0
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int threshold = 0;
    std::size_t n = 0;
    std::cin >> threshold >> n;
    std::vector<int> values(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> values[i];

    long long total = 0;
    int line = 0;

    // TODO: auto above = ...        (captures threshold by value)
    // TODO: auto addToTotal = ...   (captures total by reference)
    // TODO: auto nextLine = ...     (captures line by value, mutable, returns ++line)

    // TODO: loop over values; for each accepted x print "<nextLine()>: <x>" and add it to the total

    long long kept = 0;   // TODO: std::count_if with above
    std::cout << "kept=" << kept << " total=" << total << " outer=" << line << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int threshold = 0;
    std::size_t n = 0;
    std::cin >> threshold >> n;
    std::vector<int> values(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> values[i];

    long long total = 0;
    int line = 0;

    auto above = [threshold](int x) { return x > threshold; };
    auto addToTotal = [&total](int x) { total += x; };
    auto nextLine = [line]() mutable { return ++line; };

    for (int x : values) {
        if (above(x)) {
            std::cout << nextLine() << ": " << x << '\n';
            addToTotal(x);
        }
    }

    long long kept = std::count_if(values.begin(), values.end(), above);
    std::cout << "kept=" << kept << " total=" << total << " outer=" << line << '\n';
    return 0;
}
`,
          hints: [
            "[threshold] copies; [&total] aliases; [line]() mutable { return ++line; } owns a private copy it may change.",
            "Without mutable, ++line inside the lambda is a compile error: the copy is const.",
            "The same above lambda serves both the loop and std::count_if — a lambda in an auto variable can be passed around like any value.",
          ],
          cases: [
            { stdin: "10\n6\n4 12 10 25 -3 11\n", expected: "1: 12\n2: 25\n3: 11\nkept=3 total=48 outer=0\n" },
            { stdin: "0\n3\n-1 -2 -3\n", expected: "kept=0 total=0 outer=0\n" },
            { stdin: "-5\n4\n-4 -6 0 -5\n", expected: "1: -4\n2: 0\nkept=2 total=-4 outer=0\n", hidden: true },
            { stdin: "1000000\n2\n2000000000 2000000000\n", expected: "1: 2000000000\n2: 2000000000\nkept=2 total=4000000000 outer=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
int n = 5;
auto f = [n] { return n * 2; };
n = 100;
std::cout << f() << '\\n';
\`\`\``,
          options: ["10", "200", "Compile error", "Undefined behaviour"],
          answer: 0,
          explanation: "A by-value capture copies `n` when the lambda is *created*, while it is still 5. The later assignment changes `main`'s `n`, not the closure's copy.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
int n = 5;
auto f = [&n] { n += 1; };
f();
f();
std::cout << n << '\\n';
\`\`\``,
          options: ["5", "6", "7", "Compile error"],
          answer: 2,
          explanation: "`[&n]` stores a reference to `main`'s `n`, so each call increments the original: 5 → 6 → 7. No `mutable` is needed because the lambda modifies the referenced object, not a captured copy.",
        },
        {
          prompt: `Does this compile?
\`\`\`cpp
int count = 0;
auto tick = [count] { return ++count; };
\`\`\``,
          options: ["Yes — `tick()` returns 1, then 2", "No — increment of read-only variable; the lambda needs `mutable`", "Yes — `tick()` always returns 1", "No — a lambda cannot capture an `int`"],
          answer: 1,
          explanation: "By-value captures are `const` inside the body because the closure's `operator()` is a `const` member. `[count]() mutable { return ++count; }` makes the copy writable, and then the calls return 1, 2, 3 as the copy persists.",
        },
        {
          prompt: "`std::sort(v.begin(), v.end(), [](int a, int b) { return a <= b; });` — what is the consequence of the `<=`?",
          options: ["The vector is sorted ascending", "The vector is sorted descending", "Undefined behaviour: the comparator is not a strict weak ordering", "Compile error"],
          answer: 2,
          explanation: "A comparator must answer `false` for equal elements. With `<=` it says both `a` before `b` and `b` before `a`, and `std::sort` may read past the end of the range — a crash on some inputs. Use `<`.",
        },
        {
          prompt: "What is the right way to hold a lambda in a local variable?",
          options: ["`std::function` — it is the type of every lambda", "`auto` — each lambda has a unique unnamed closure type", "`void*`", "`lambda` — the keyword names the type"],
          answer: 1,
          explanation: "Every lambda expression has its own compiler-generated type with no name, so `auto` is the exact and free way to store one. `std::function` *can* hold it, at the cost of type erasure and an indirect call; there is no `lambda` keyword.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
auto add = [](auto a, auto b) { return a + b; };
std::cout << add(1, 2) << ' ' << add(std::string("x"), std::string("y")) << '\\n';
\`\`\``,
          options: ["`3 xy`", "`3 x+y`", "Compile error: a lambda cannot be generic", "`12 xy`"],
          answer: 0,
          explanation: "`auto` parameters make the closure's `operator()` a template, instantiated once for `(int, int)` and once for `(std::string, std::string)`. Integer `+` adds; string `+` concatenates.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
std::vector<int> v{1, 5, 8, 12};
int limit = 6;
std::cout << std::count_if(v.begin(), v.end(), [limit](int x) { return x > limit; }) << '\\n';
\`\`\``,
          options: ["2", "3", "1", "0"],
          answer: 0,
          explanation: "The predicate captures `limit` (6) by value and is true for 8 and 12 only. `std::count_if` returns how many elements satisfy it.",
        },
      ],
    },
    {
      slug: "scope-lifetime-and-linkage",
      file: "06-scope-lifetime-and-linkage.md",
      exercises: [
        {
          title: "Labels from a function-local static",
          prompt: `Write \`int nextId()\` that keeps its counter in a **function-local \`static int\`** starting at 0 and returns the incremented value (the first call returns 1, the second 2, ...). No global variable is allowed — the counter must live inside \`nextId\`. Then write \`std::string makeLabel(const std::string& prefix)\` that returns \`<prefix>-<nextId()>\`.

Read \`n\`, then \`n\` prefixes (single tokens; they may repeat). Print each label on its own line, then \`next=<nextId()>\` — one more call, showing the counter has kept counting.

**Input:** \`n\`, then \`n\` prefixes.
**Output:** \`n\` labels, then the \`next=\` line.

Example: input \`3\`, \`order order invoice\` →
\`\`\`
order-1
order-2
invoice-3
next=4
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int nextId();
std::string makeLabel(const std::string& prefix);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string prefix;
        std::cin >> prefix;
        std::cout << makeLabel(prefix) << '\n';
    }
    std::cout << "next=" << nextId() << '\n';
    return 0;
}

int nextId() {
    // TODO: a static local counter, incremented and returned
    return 0;
}

std::string makeLabel(const std::string& prefix) {
    // TODO: prefix + "-" + std::to_string(nextId())
    return prefix;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int nextId();
std::string makeLabel(const std::string& prefix);

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string prefix;
        std::cin >> prefix;
        std::cout << makeLabel(prefix) << '\n';
    }
    std::cout << "next=" << nextId() << '\n';
    return 0;
}

int nextId() {
    static int counter = 0;
    return ++counter;
}

std::string makeLabel(const std::string& prefix) {
    return prefix + "-" + std::to_string(nextId());
}
`,
          hints: [
            "static int counter = 0; inside nextId is initialised once; every later call sees the value the previous call left.",
            "Return ++counter (pre-increment) so the first call yields 1.",
            "One counter serves every prefix — the ids are program-wide, which is what a function-local static gives you.",
          ],
          cases: [
            { stdin: "3\norder order invoice\n", expected: "order-1\norder-2\ninvoice-3\nnext=4\n" },
            { stdin: "1\nx\n", expected: "x-1\nnext=2\n" },
            { stdin: "0\n", expected: "next=1\n", hidden: true },
            { stdin: "5\na b a b a\n", expected: "a-1\nb-2\na-3\nb-4\na-5\nnext=6\n", hidden: true },
          ],
        },
        {
          title: "Instrumented recursion in an anonymous namespace",
          prompt: `Count how many calls the naive recursive Fibonacci makes. Inside an **anonymous namespace** (internal linkage) put a \`long long callCount\` and a helper \`long long fibCounted(int n)\` that increments \`callCount\` on every entry and computes \`fib\` the naive way (\`fib(0) = 0\`, \`fib(1) = 1\`, otherwise the sum of the two before). Outside the namespace, with ordinary external linkage, write the two functions \`main\` uses: \`long long fib(int n)\` — resets the counter to 0, then returns \`fibCounted(n)\` — and \`long long callsForLast()\` — returns the counter.

Read \`q\`, then \`q\` values of \`n\` (0 ≤ n ≤ 30). For each print \`fib(<n>)=<value> calls=<count>\`.

**Input:** \`q\`, then \`q\` integers.
**Output:** \`q\` lines.

Example: input \`3\`, \`10\`, \`0\`, \`2\` →
\`\`\`
fib(10)=55 calls=177
fib(0)=0 calls=1
fib(2)=1 calls=3
\`\`\`
The counter is shared state, so it is hidden where no other translation unit can reach it; the two named functions are the only interface.`,
          starter: String.raw`#include <iostream>

namespace {
    long long callCount = 0;

    long long fibCounted(int n) {
        // TODO: count this call, then the naive recursion
        return n;
    }
}

long long fib(int n);
long long callsForLast();

int main() {
    int q = 0;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int n = 0;
        std::cin >> n;
        long long value = fib(n);
        std::cout << "fib(" << n << ")=" << value << " calls=" << callsForLast() << '\n';
    }
    return 0;
}

long long fib(int n) {
    // TODO: reset callCount, then delegate to fibCounted
    return fibCounted(n);
}

long long callsForLast() {
    // TODO
    return callCount;
}
`,
          solution: String.raw`#include <iostream>

namespace {
    long long callCount = 0;

    long long fibCounted(int n) {
        ++callCount;
        if (n <= 1) return n;
        return fibCounted(n - 1) + fibCounted(n - 2);
    }
}

long long fib(int n);
long long callsForLast();

int main() {
    int q = 0;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int n = 0;
        std::cin >> n;
        long long value = fib(n);
        std::cout << "fib(" << n << ")=" << value << " calls=" << callsForLast() << '\n';
    }
    return 0;
}

long long fib(int n) {
    callCount = 0;
    return fibCounted(n);
}

long long callsForLast() {
    return callCount;
}
`,
          hints: [
            "Increment callCount as the first statement of fibCounted so base-case calls are counted too.",
            "fib(n) resets the counter before the recursion starts; callsForLast() just reads it.",
            "The call count for n is 2 x fib(n + 1) - 1 — a quick way to check your output.",
          ],
          cases: [
            { stdin: "3\n10\n0\n2\n", expected: "fib(10)=55 calls=177\nfib(0)=0 calls=1\nfib(2)=1 calls=3\n" },
            { stdin: "1\n20\n", expected: "fib(20)=6765 calls=21891\n" },
            { stdin: "2\n1\n30\n", expected: "fib(1)=1 calls=1\nfib(30)=832040 calls=2692537\n", hidden: true },
            { stdin: "1\n25\n", expected: "fib(25)=75025 calls=242785\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
int counter() {
    static int c = 10;
    return ++c;
}
int main() {
    counter();
    counter();
    std::cout << counter() << '\\n';
}
\`\`\``,
          options: ["11", "13", "10", "Compile error"],
          answer: 1,
          explanation: "The `static` local is initialised to 10 exactly once. Each call increments it: 11, 12, then the printed 13. A non-static `int c = 10;` would print 11.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
int x = 1;
int main() {
    int x = 2;
    {
        int x = 3;
        std::cout << x;
    }
    std::cout << x << '\\n';
}
\`\`\``,
          options: ["`32`", "`31`", "`33`", "Compile error: `x` redeclared"],
          answer: 0,
          explanation: "Each inner `x` shadows the outer one for the extent of its block. Inside the braces `x` is 3; after them the block's `x` is gone and `main`'s `x` (2) is visible again. The global `x` is never reached.",
        },
        {
          prompt: "Two `.cpp` files in the same program each define `int helper() { return 1; }` at namespace scope. What happens?",
          options: ["It compiles and links; each file uses its own", "Linker error: multiple definition of `helper()`", "Compile error in the second file", "Undefined behaviour at run time"],
          answer: 1,
          explanation: "A function has external linkage by default, so both files claim to define the one program-wide `helper()`. Each file compiles fine on its own; the linker sees two definitions and refuses.",
        },
        {
          prompt: "How do you make a helper function private to its translation unit?",
          options: ["Declare it `extern`", "Put it in an anonymous namespace, or mark it `static` at namespace scope", "Mark it `inline`", "Mark it `const`"],
          answer: 1,
          explanation: "Both give internal linkage, so another file may define its own function of the same name without a clash. `extern` is the opposite (external linkage), `inline` permits *identical* definitions in many files, and `const` does not apply to functions.",
        },
        {
          prompt: "What does the line `extern int g_total;` mean in a source file?",
          options: ["It defines `g_total` and initialises it to 0", "It declares that `g_total` is defined in another translation unit", "It gives `g_total` internal linkage", "It creates a thread-local copy of `g_total`"],
          answer: 1,
          explanation: "`extern` on a declaration without an initialiser says \"this object exists elsewhere; do not create one here\". Exactly one translation unit must provide the definition `int g_total = 0;`.",
        },
        {
          prompt: `What is wrong with this function?
\`\`\`cpp
const std::string& name() {
    std::string s = "ada";
    return s;
}
\`\`\``,
          options: ["Nothing — the reference keeps `s` alive", "Compile error: a function cannot return a reference", "Undefined behaviour: it returns a dangling reference to a destroyed local; `-Wall` warns", "It always returns an empty string"],
          answer: 2,
          explanation: "`s` has automatic storage and is destroyed when the function returns; the caller receives a reference to nothing. GCC reports \"reference to local variable 's' returned\". Return `std::string` by value.",
        },
        {
          prompt: "What does `inline` on a function mean in modern C++?",
          options: ["The compiler must inline every call to it", "Its definition may appear in several translation units (identically) and the linker keeps one — what a function defined in a header needs", "It has internal linkage", "It is evaluated at compile time"],
          answer: 1,
          explanation: "Inlining calls is the optimiser's decision regardless of the keyword. `inline` relaxes the one-definition rule so a header can carry the definition; C++17 gave variables the same power with `inline constexpr`.",
        },
      ],
    },
    {
      slug: "functions-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Every arrangement",
          prompt: `Read one word of 1 to 6 **distinct** lowercase letters. Write a recursive \`void permute(std::string& s, std::size_t k, std::vector<std::string>& out)\` that generates every arrangement by swapping each remaining character into position \`k\`, recursing on \`k + 1\`, and swapping back. Collect the results, sort them with \`std::sort\`, print one per line, then print \`count=<how many>\`.

**Input:** one word.
**Output:** all permutations in lexicographic order, then the count line.

Example: input \`abc\` →
\`\`\`
abc
acb
bac
bca
cab
cba
count=6
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

void permute(std::string& s, std::size_t k, std::vector<std::string>& out);

int main() {
    std::string word;
    std::cin >> word;
    std::vector<std::string> out;
    permute(word, 0, out);
    std::sort(out.begin(), out.end());
    for (const auto& p : out) std::cout << p << '\n';
    std::cout << "count=" << out.size() << '\n';
    return 0;
}

void permute(std::string& s, std::size_t k, std::vector<std::string>& out) {
    // TODO: when k == s.size() record s; otherwise for each i from k: swap, recurse on k + 1, swap back
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

void permute(std::string& s, std::size_t k, std::vector<std::string>& out);

int main() {
    std::string word;
    std::cin >> word;
    std::vector<std::string> out;
    permute(word, 0, out);
    std::sort(out.begin(), out.end());
    for (const auto& p : out) std::cout << p << '\n';
    std::cout << "count=" << out.size() << '\n';
    return 0;
}

void permute(std::string& s, std::size_t k, std::vector<std::string>& out) {
    if (k == s.size()) {
        out.push_back(s);
        return;
    }
    for (std::size_t i = k; i < s.size(); ++i) {
        std::swap(s[k], s[i]);
        permute(s, k + 1, out);
        std::swap(s[k], s[i]);
    }
}
`,
          hints: [
            "The base case is k == s.size(): the whole string is fixed, so push a copy of it.",
            "Swap s[k] with s[i], recurse, then swap back so the next i starts from the original order.",
            "Both s and out are reference parameters: the recursion mutates one string and fills one vector.",
          ],
          cases: [
            { stdin: "abc\n", expected: "abc\nacb\nbac\nbca\ncab\ncba\ncount=6\n" },
            { stdin: "z\n", expected: "z\ncount=1\n" },
            { stdin: "dcba\n", expected: "abcd\nabdc\nacbd\nacdb\nadbc\nadcb\nbacd\nbadc\nbcad\nbcda\nbdac\nbdca\ncabd\ncadb\ncbad\ncbda\ncdab\ncdba\ndabc\ndacb\ndbac\ndbca\ndcab\ndcba\ncount=24\n", hidden: true },
            { stdin: "ba\n", expected: "ab\nba\ncount=2\n", hidden: true },
          ],
        },
        {
          title: "Grade report",
          prompt: `Read \`n\`, then \`n\` lines \`name m1 m2 m3\` (marks 0–100). Write four small functions, prototypes above \`main\`:

- \`double mean(const std::vector<int>& marks);\`
- \`std::string grade(double average);\` — \`A\` for 90 and above, \`B\` for 80, \`C\` for 70, \`D\` for 60, otherwise \`F\` (judged on the unrounded average).
- \`std::string grade(const std::vector<int>& marks);\` — an **overload** that grades the mean of the marks.
- \`std::string fmt(double value, int decimals = 1);\` — the value fixed to \`decimals\` places, with the **default on the prototype**.

Print one line per student, \`<name>: <fmt(average)> <grade>\`, then \`class: <fmt(class average, 2)> <grade of the class average>\` where the class average is the mean of the student averages, and finally \`best: <name of the highest average — the first one on ties>\`.

**Input:** \`n\`, then \`n\` student lines.
**Output:** \`n + 2\` lines.

Example: input \`2\`, \`Ada 95 90 90\`, \`Bob 70 75 72\` →
\`\`\`
Ada: 91.7 A
Bob: 72.3 C
class: 82.00 B
best: Ada
\`\`\``,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>

double mean(const std::vector<int>& marks);
std::string grade(double average);
std::string grade(const std::vector<int>& marks);
std::string fmt(double value, int decimals = 1);

int main() {
    int n = 0;
    std::cin >> n;
    double classTotal = 0.0;
    std::string best;
    double bestAverage = -1.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::vector<int> marks(3);
        std::cin >> name >> marks[0] >> marks[1] >> marks[2];
        // TODO: compute the average, print the student line, accumulate the class total, track the best
    }
    // TODO: print the class line and the best line
    return 0;
}

double mean(const std::vector<int>& marks) {
    // TODO
    return 0.0;
}

std::string grade(double average) {
    // TODO
    return "F";
}

std::string grade(const std::vector<int>& marks) {
    // TODO: delegate to the other overload
    return grade(mean(marks));
}

std::string fmt(double value, int decimals) {
    // TODO: std::ostringstream with std::fixed and the precision
    return std::to_string(value);
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>

double mean(const std::vector<int>& marks);
std::string grade(double average);
std::string grade(const std::vector<int>& marks);
std::string fmt(double value, int decimals = 1);

int main() {
    int n = 0;
    std::cin >> n;
    double classTotal = 0.0;
    std::string best;
    double bestAverage = -1.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::vector<int> marks(3);
        std::cin >> name >> marks[0] >> marks[1] >> marks[2];
        double average = mean(marks);
        std::cout << name << ": " << fmt(average) << ' ' << grade(marks) << '\n';
        classTotal += average;
        if (average > bestAverage) {
            bestAverage = average;
            best = name;
        }
    }
    double classAverage = classTotal / n;
    std::cout << "class: " << fmt(classAverage, 2) << ' ' << grade(classAverage) << '\n';
    std::cout << "best: " << best << '\n';
    return 0;
}

double mean(const std::vector<int>& marks) {
    long long sum = 0;
    for (int m : marks) sum += m;
    return static_cast<double>(sum) / static_cast<double>(marks.size());
}

std::string grade(double average) {
    if (average >= 90) return "A";
    if (average >= 80) return "B";
    if (average >= 70) return "C";
    if (average >= 60) return "D";
    return "F";
}

std::string grade(const std::vector<int>& marks) {
    return grade(mean(marks));
}

std::string fmt(double value, int decimals) {
    std::ostringstream out;
    out.precision(decimals);
    out << std::fixed << value;
    return out.str();
}
`,
          hints: [
            "fmt(average) uses the default of 1 decimal; fmt(classAverage, 2) overrides it.",
            "grade(marks) and grade(average) are different overloads: a std::vector<int> argument is an exact match for the vector overload, a double for the other.",
            "Track the best with a strict > comparison so the first student keeps the title on a tie.",
          ],
          cases: [
            { stdin: "2\nAda 95 90 90\nBob 70 75 72\n", expected: "Ada: 91.7 A\nBob: 72.3 C\nclass: 82.00 B\nbest: Ada\n" },
            { stdin: "1\nCy 59 60 61\n", expected: "Cy: 60.0 D\nclass: 60.00 D\nbest: Cy\n" },
            { stdin: "3\nDee 100 100 100\nEve 0 0 0\nFay 89 90 90\n", expected: "Dee: 100.0 A\nEve: 0.0 F\nFay: 89.7 B\nclass: 63.22 D\nbest: Dee\n", hidden: true },
            { stdin: "2\nGus 80 80 80\nHal 80 80 80\n", expected: "Gus: 80.0 B\nHal: 80.0 B\nclass: 80.00 B\nbest: Gus\n", hidden: true },
          ],
        },
        {
          title: "Leaderboard with a lambda and a static rank",
          prompt: `Read \`k passMark\`, then \`n\`, then \`n\` lines \`name score\`. Sort the entries with **a lambda comparator**: higher score first, and equal scores by name ascending. Write \`int nextRank()\` whose counter is a **function-local \`static\`** (first call returns 1) and \`std::string row(const std::string& name, int score)\` that returns \`<nextRank()>. <name> <score>\`. Print the first \`k\` rows (or all of them when there are fewer than \`k\`), then \`passed=<count>\` — the number of entries with \`score >= passMark\`, from **\`std::count_if\` with a lambda that captures \`passMark\`**.

**Input:** \`k passMark\`, \`n\`, then \`n\` entries.
**Output:** up to \`k\` rows, then the \`passed=\` line.

Example: input \`3 50\`, \`5\`, \`zoe 70\`, \`al 90\`, \`bea 70\`, \`cid 40\`, \`dan 90\` →
\`\`\`
1. al 90
2. dan 90
3. bea 70
passed=4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Entry {
    std::string name;
    int score;
};

int nextRank();
std::string row(const std::string& name, int score);

int main() {
    int k = 0, passMark = 0;
    std::size_t n = 0;
    std::cin >> k >> passMark >> n;
    std::vector<Entry> entries(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> entries[i].name >> entries[i].score;

    // TODO: std::sort with a lambda: score descending, then name ascending

    // TODO: print row(...) for the first min(k, n) entries

    long long passed = 0;   // TODO: std::count_if with a lambda capturing passMark
    std::cout << "passed=" << passed << '\n';
    return 0;
}

int nextRank() {
    // TODO: function-local static counter
    return 0;
}

std::string row(const std::string& name, int score) {
    // TODO: "<rank>. <name> <score>"
    return name;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Entry {
    std::string name;
    int score;
};

int nextRank();
std::string row(const std::string& name, int score);

int main() {
    int k = 0, passMark = 0;
    std::size_t n = 0;
    std::cin >> k >> passMark >> n;
    std::vector<Entry> entries(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> entries[i].name >> entries[i].score;

    std::sort(entries.begin(), entries.end(), [](const Entry& a, const Entry& b) {
        if (a.score != b.score) return a.score > b.score;
        return a.name < b.name;
    });

    std::size_t shown = std::min(static_cast<std::size_t>(k), entries.size());
    for (std::size_t i = 0; i < shown; ++i) {
        std::cout << row(entries[i].name, entries[i].score) << '\n';
    }

    long long passed = std::count_if(entries.begin(), entries.end(), [passMark](const Entry& e) {
        return e.score >= passMark;
    });
    std::cout << "passed=" << passed << '\n';
    return 0;
}

int nextRank() {
    static int rank = 0;
    return ++rank;
}

std::string row(const std::string& name, int score) {
    return std::to_string(nextRank()) + ". " + name + " " + std::to_string(score);
}
`,
          hints: [
            "Descending by score means the comparator returns a.score > b.score when the scores differ.",
            "std::min(static_cast<std::size_t>(k), entries.size()) is how many rows to print — both operands must have the same type.",
            "Each call to row() calls nextRank() once, so the ranks come out 1, 2, 3 without main counting.",
          ],
          cases: [
            { stdin: "3 50\n5\nzoe 70\nal 90\nbea 70\ncid 40\ndan 90\n", expected: "1. al 90\n2. dan 90\n3. bea 70\npassed=4\n" },
            { stdin: "2 100\n2\nx 10\ny 5\n", expected: "1. x 10\n2. y 5\npassed=0\n" },
            { stdin: "5 0\n2\nb 1\na 1\n", expected: "1. a 1\n2. b 1\npassed=2\n", hidden: true },
            { stdin: "1 60\n3\nm 60\nn 59\no 61\n", expected: "1. o 61\npassed=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The message `undefined reference to 'area(int)'` is reported by…",
          options: ["The preprocessor", "The compiler", "The linker", "The runtime, on the first call"],
          answer: 2,
          explanation: "The compiler accepted the call because it saw a declaration; the linker then failed to find a definition with that exact signature. A missing *declaration* would be a compiler error instead.",
        },
        {
          prompt: "Which of these is part of a function's signature?",
          options: ["The return type", "The parameter names", "The parameter types", "The default arguments"],
          answer: 2,
          explanation: "The signature is the name plus the parameter types, which is why overloads must differ there and why neither the return type nor names nor defaults can distinguish two functions.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
void f(int v)  { v = 0; }
void g(int& v) { v = 0; }
int main() {
    int a = 7, b = 7;
    f(a);
    g(b);
    std::cout << a << b << '\\n';
}
\`\`\``,
          options: ["`77`", "`07`", "`70`", "`00`"],
          answer: 2,
          explanation: "`f` receives a copy of `a` and zeroes the copy; `a` stays 7. `g` receives a reference to `b` and zeroes `b` itself. Output `70`.",
        },
        {
          prompt: "A function receives a `std::vector<int>` of a million elements and only reads it. The parameter should be…",
          options: ["`std::vector<int> v`", "`const std::vector<int>& v`", "`std::vector<int>& v`", "`const std::vector<int> v`"],
          answer: 1,
          explanation: "`const&` avoids the million-element copy and promises not to modify. A non-const reference would work but lies about intent and rejects temporaries; either by-value form copies.",
        },
        {
          prompt: "`void f(long); void f(double);` — what does `f(1)` do?",
          options: ["Calls `f(long)`", "Calls `f(double)`", "Compile error: ambiguous", "Calls `f(long)` because it is declared first"],
          answer: 2,
          explanation: "`int` to `long` and `int` to `double` are both standard conversions of equal rank; there is no `int` overload to be an exact match, so the compiler refuses to choose. Declaration order is irrelevant.",
        },
        {
          prompt: "A function has a prototype above `main` and a definition below it. Where does its default argument go?",
          options: ["On both, with the same value", "On the definition only", "On the prototype only", "Anywhere — the compiler merges them"],
          answer: 2,
          explanation: "A default is specified once, on the first declaration the calls see. Repeating it on the definition is an error, and putting it only on a definition that follows the calls means they never see it.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
long long p(long long b, int e) {
    return e == 0 ? 1 : b * p(b, e - 1);
}
int main() { std::cout << p(2, 10) << '\\n'; }
\`\`\``,
          options: ["1024", "20", "2048", "Stack overflow"],
          answer: 0,
          explanation: "Ten frames deep, each multiplying by 2 on the way back up: 2^10 = 1024. The base case `e == 0` is reached because `e` decreases by one per call.",
        },
        {
          prompt: "You memoise `f(x, y)` where `x` and `y` range over −10⁶..10⁶ but only a few thousand pairs are ever asked for. The best memo is…",
          options: ["A `std::vector<long long>` indexed by `x`", "A `std::map<std::pair<int, int>, long long>`", "A function-local `static long long`", "No memo is possible for two arguments"],
          answer: 1,
          explanation: "The key is a pair and the space is sparse and includes negatives, so a dense vector is impossible and a map keyed by the pair stores exactly the results computed. A single `static` holds one value, not a table.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
int base = 10;
auto f = [base](int x) mutable { base += x; return base; };
f(1);
std::cout << f(1) << ' ' << base << '\\n';
\`\`\``,
          options: ["`12 10`", "`12 12`", "`11 10`", "Compile error"],
          answer: 0,
          explanation: "The lambda owns a `mutable` copy of `base` that persists between calls: 11 after the first call, 12 after the second. `main`'s `base` is never touched and is still 10.",
        },
        {
          prompt: "Which comparator lambda sorts a `std::vector<int>` in **descending** order correctly?",
          options: ["`[](int a, int b) { return a > b; }`", "`[](int a, int b) { return a >= b; }`", "`[](int a, int b) { return a < b; }`", "`[](int a, int b) { return b <= a; }`"],
          answer: 0,
          explanation: "`a > b` is a strict weak ordering that puts larger values first. `>=` and `b <= a` return `true` for equal elements and are undefined behaviour with `std::sort`; `a < b` sorts ascending.",
        },
        {
          prompt: "When is a function-local `static` variable initialised?",
          options: ["On every call to the function", "Once, the first time control reaches its declaration", "When the program starts, before `main`, always", "When the function returns for the first time"],
          answer: 1,
          explanation: "The initialiser runs exactly once, on first reach, and C++11 guarantees that first run is thread-safe. Afterwards the variable keeps whatever the last call left in it.",
        },
        {
          prompt: "Which declaration gives `n` internal linkage?",
          options: ["`int n = 0;` at namespace scope", "`namespace { int n = 0; }`", "`extern int n;`", "`inline int n = 0;`"],
          answer: 1,
          explanation: "An anonymous namespace makes every member private to the translation unit. A plain non-`const` global and an `inline` variable have external linkage; `extern` declares an external one defined elsewhere.",
        },
        {
          prompt: "A lambda captures a local `int total` by reference, is returned from the function that declared `total`, and is called by the caller. What happens?",
          options: ["It works: the capture keeps `total` alive", "Undefined behaviour: `total` was destroyed when its function returned, so the capture dangles", "Compile error: a lambda cannot be returned", "It returns 0"],
          answer: 1,
          explanation: "`[&total]` stores a reference, not the object. `total` has automatic storage and dies with its frame; the returned closure then refers to a dead object. Capture by value to make the lambda self-contained.",
        },
        {
          prompt: "What does `[[nodiscard]]` on a function do?",
          options: ["Prevents the function from being inlined", "Makes calling it as a bare statement — ignoring the result — a compiler warning", "Forces the result to be stored in a `const` variable", "Deletes the return value after use"],
          answer: 1,
          explanation: "It flags functions whose return value is the point of the call. `std::vector::empty()` carries it since C++20 so that `v.empty();` is caught as a probable `clear()`.",
        },
      ],
    },
  ],
});

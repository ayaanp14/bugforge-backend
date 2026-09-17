import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "arrays-pointers-references",
  title: "Arrays, pointers and references",
  blurb: "Built-in arrays and std::array, pointers and nullptr, pointer arithmetic and the [begin, end) range, references and dangling, const correctness read right to left, and 2-D grids with a neighbour loop.",
  icon: "grid",
  overview: `Every container, every string and every reference in C++ is built on the ideas in this module: a block of elements laid out one after another, an address that names one of them, and an alias that stands for an object without copying it. Learn how a built-in array decays into a pointer and why \`std::array\` was invented; what \`&\` and \`*\` do and what \`nullptr\` means; how \`p + i\`, \`q - p\` and the half-open range \`[begin, end)\` describe a sequence; and how a reference differs from a pointer in exactly three ways.

These are the parts of C++ that interviews probe hardest and that undefined behaviour hides in most often — an index past the end, a null dereference, a reference that outlives its object. The module teaches the discipline that keeps a program well-defined: initialise every array and pointer, check before dereferencing, form the one-past-the-end pointer but never read it, and let \`const\` — read right to left — say who may write what. It ends with grids, where two indices, row-major layout and a neighbour loop with a bounds check turn every board and matrix problem into the same idiom.

The exercises print values, indices and differences, never an address: reverse a \`std::array\` in place, pass a decayed array with its length, swap through pointers and through references, sum a \`[begin, end)\` range, write \`strlen\` by hand, edit a vector through a returned reference, write const-correct signatures, and read and walk grids. The checkpoint asks for a pointer walk over runs of equal values, a flood count on a character grid and a statistics function with reference out-parameters.`,
  lessons: [
    {
      slug: "c-arrays-and-std-array",
      file: "01-c-arrays-and-std-array.md",
      exercises: [
        {
          title: "Reverse in place",
          prompt: `Read \`n\` (1 ≤ n ≤ 50) and then \`n\` integers into a \`std::array<int, 50>\`, keeping \`n\` as the count of elements in use. Reverse the first \`n\` elements **in place** — two indices walking towards each other, swapping with \`std::swap\` — and print them space-separated on one line. Do not build a second array.

**Input:** \`n\`, then \`n\` integers (whitespace-separated, possibly across several lines).
**Output:** the \`n\` integers in reverse order on one line.

Example: input \`5 1 2 3 4 5\` → output \`5 4 3 2 1\``,
          starter: String.raw`#include <array>
#include <iostream>
#include <utility>

int main() {
    std::array<int, 50> values{};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    // TODO: reverse values[0 .. n-1] in place with two indices and std::swap

    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <iostream>
#include <utility>

int main() {
    std::array<int, 50> values{};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    int lo = 0;
    int hi = n - 1;
    while (lo < hi) {
        std::swap(values[lo], values[hi]);
        ++lo;
        --hi;
    }
    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "Keep lo = 0 and hi = n - 1 and loop while lo < hi.",
            "std::swap(values[lo], values[hi]) exchanges the two elements; then ++lo and --hi.",
            "A single element (n = 1) needs no swap — the loop condition already handles it.",
          ],
          cases: [
            { stdin: "5\n1 2 3 4 5\n", expected: "5 4 3 2 1\n" },
            { stdin: "1\n42\n", expected: "42\n" },
            { stdin: "4\n-1 0 7 -3\n", expected: "-3 7 0 -1\n", hidden: true },
            { stdin: "6\n1 1 2 2 3 3\n", expected: "3 3 2 2 1 1\n", hidden: true },
          ],
        },
        {
          title: "Above the average",
          prompt: `Read \`n\` (1 ≤ n ≤ 100) integers into a built-in array \`int values[100]\`. Write \`double average(const int* values, int n)\` — the array **decays** to a pointer when you pass it, so the count travels alongside — and use it to print the mean to two decimals and how many values are strictly greater than the mean.

**Input:** \`n\`, then \`n\` integers.
**Output:** two lines, \`average=<mean with 2 decimals>\` and \`above=<count>\`.

Example: input \`4 10 20 30 41\` →
\`\`\`
average=25.25
above=2
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>

// The array decays to a pointer here: the function needs n to know where it ends.
double average(const int* values, int n) {
    // TODO: sum the n values in a long long and return the mean as a double
    return 0.0;
}

int main() {
    int values[100] = {};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    double avg = average(values, n);
    int above = 0;
    // TODO: count the values strictly greater than avg

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "average=" << avg << '\n';
    std::cout << "above=" << above << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>

// The array decays to a pointer here: the function needs n to know where it ends.
double average(const int* values, int n) {
    long long sum = 0;
    for (int i = 0; i < n; ++i) {
        sum += values[i];
    }
    return static_cast<double>(sum) / n;
}

int main() {
    int values[100] = {};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    double avg = average(values, n);
    int above = 0;
    for (int i = 0; i < n; ++i) {
        if (values[i] > avg) ++above;
    }
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "average=" << avg << '\n';
    std::cout << "above=" << above << '\n';
    return 0;
}
`,
          hints: [
            "Accumulate in a long long and divide by n after a static_cast<double>.",
            "std::fixed << std::setprecision(2) from <iomanip> fixes the output format.",
            "Compare each int with the double mean directly; the int is promoted.",
          ],
          cases: [
            { stdin: "4\n10 20 30 41\n", expected: "average=25.25\nabove=2\n" },
            { stdin: "3\n5 5 5\n", expected: "average=5.00\nabove=0\n" },
            { stdin: "1\n-7\n", expected: "average=-7.00\nabove=0\n", hidden: true },
            { stdin: "5\n1 2 3 4 100\n", expected: "average=22.00\nabove=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int a[5] = {1, 2};
std::cout << a[1] + a[4] << '\\n';
\`\`\``,
          options: ["`2`", "`3`", "Undefined behaviour — `a[4]` is uninitialised", "Compile error — too few initialisers"],
          answer: 0,
          explanation: "Aggregate initialisation with fewer values than elements value-initialises the rest, so `a[2]`, `a[3]` and `a[4]` are 0 and `a[1] + a[4]` is `2 + 0`. Only an array with **no** initialiser at all holds indeterminate values.",
        },
        {
          prompt: "Which of these is **not** standard C++20?",
          options: ["`int a[3] = {1, 2, 3};`", "`constexpr int n = 3; int a[n];`", "`int n; std::cin >> n; int a[n];`", "`int a[] = {1, 2, 3};`"],
          answer: 2,
          explanation: "An array bound must be a constant expression. `int a[n]` with a run-time `n` is a variable-length array — a GCC extension that Clang warns about and other compilers reject. The answer for a run-time size is `std::vector<int> a(n)`.",
        },
        {
          prompt: "Inside `void f(int values[])`, what is `sizeof values` on this platform?",
          options: ["The number of bytes in the caller's array", "8 — `values` is a pointer", "4 — the size of one `int`", "A compile error"],
          answer: 1,
          explanation: "An array parameter is a pointer parameter in disguise: `int values[]` is `int*`, and `sizeof` a pointer is 8 on x86-64. The caller's array size is gone; it must be passed separately.",
        },
        {
          prompt: "`std::array<int, 4> a; std::cout << a[0];` — what happens?",
          options: ["Prints `0`", "Reads an indeterminate value — undefined behaviour", "Compile error: `a` is not initialised", "Throws `std::out_of_range`"],
          answer: 1,
          explanation: "`std::array` wraps a built-in array and inherits its rule: with no initialiser the elements are not initialised. Write `std::array<int, 4> a{};` to zero them. `[]` never checks bounds or initialisation; only `.at()` checks bounds.",
        },
        {
          prompt: "Which comparison compares the **elements**?",
          options: ["`int a[3] = {}; int b[3] = {}; a == b`", "`std::array<int, 3> a{}; std::array<int, 3> b{}; a == b`", "Both of them", "Neither — arrays cannot be compared"],
          answer: 1,
          explanation: "Built-in arrays decay in `a == b`, so it compares two addresses (always false for distinct arrays; C++20 deprecates it and `-Wall` warns). `std::array` defines `==` element-wise, which is one of the reasons it exists.",
        },
        {
          prompt: "Which parameter declaration keeps the array's size known inside the function?",
          options: ["`void f(int a[5])`", "`void f(int* a)`", "`void f(int (&a)[5])`", "`void f(int a[])`"],
          answer: 2,
          explanation: "A reference to an array of 5 keeps the size in the type and rejects an array of any other size. The other three are all exactly `int*`; the `5` in `int a[5]` is ignored by the compiler.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
std::array<int, 3> a{1, 2, 3};
auto b = a;
b[0] = 9;
std::cout << a[0] << b[0] << '\\n';
\`\`\``,
          options: ["`19`", "`99`", "`11`", "Compile error — arrays cannot be copied"],
          answer: 0,
          explanation: "`std::array` has value semantics: `auto b = a` makes an independent copy, so writing `b[0]` leaves `a[0]` at 1. A built-in array could not be copied with `=` at all.",
        },
      ],
    },
    {
      slug: "pointers",
      file: "02-pointers.md",
      exercises: [
        {
          title: "Swap, then reseat",
          prompt: `Read three integers \`a\`, \`b\` and \`k\`. Write \`void swap_values(int* a, int* b)\` that exchanges the two integers through pointers, and call it with \`&a\` and \`&b\`. Then declare one pointer \`int* target\` that points at \`a\` when \`k\` is odd and at \`b\` when \`k\` is even, and add \`k\` to whichever integer it points at, **through the pointer**. Print the state after each step. Never print a pointer's value.

**Input:** one line with \`a b k\`.
**Output:** three lines: \`before: a=<a> b=<b>\`, \`swapped: a=<a> b=<b>\`, \`final: a=<a> b=<b>\`.

Example: input \`3 9 4\` →
\`\`\`
before: a=3 b=9
swapped: a=9 b=3
final: a=9 b=7
\`\`\``,
          starter: String.raw`#include <iostream>

void swap_values(int* a, int* b) {
    // TODO: exchange the two integers the pointers point at
}

int main() {
    int a = 0;
    int b = 0;
    int k = 0;
    std::cin >> a >> b >> k;
    std::cout << "before: a=" << a << " b=" << b << '\n';
    // TODO: swap a and b through swap_values
    std::cout << "swapped: a=" << a << " b=" << b << '\n';
    // TODO: point target at a (k odd) or b (k even), then add k through it
    std::cout << "final: a=" << a << " b=" << b << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>

void swap_values(int* a, int* b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main() {
    int a = 0;
    int b = 0;
    int k = 0;
    std::cin >> a >> b >> k;
    std::cout << "before: a=" << a << " b=" << b << '\n';
    swap_values(&a, &b);
    std::cout << "swapped: a=" << a << " b=" << b << '\n';
    int* target = (k % 2 != 0) ? &a : &b;
    *target += k;
    std::cout << "final: a=" << a << " b=" << b << '\n';
    return 0;
}
`,
          hints: [
            "Inside swap_values, *a and *b are the caller's integers; hold one in a temporary int.",
            "k % 2 != 0 is true for odd k, including negative odd k.",
            "target = &a or target = &b reseats the pointer; *target += k writes through it.",
          ],
          cases: [
            { stdin: "3 9 4\n", expected: "before: a=3 b=9\nswapped: a=9 b=3\nfinal: a=9 b=7\n" },
            { stdin: "-1 -1 1\n", expected: "before: a=-1 b=-1\nswapped: a=-1 b=-1\nfinal: a=0 b=-1\n" },
            { stdin: "0 2147483647 0\n", expected: "before: a=0 b=2147483647\nswapped: a=2147483647 b=0\nfinal: a=2147483647 b=0\n", hidden: true },
            { stdin: "5 6 -3\n", expected: "before: a=5 b=6\nswapped: a=6 b=5\nfinal: a=3 b=5\n", hidden: true },
          ],
        },
        {
          title: "Largest, then zeroed",
          prompt: `Read \`n\` (0 ≤ n ≤ 100) integers into \`int values[100]\`. Write \`int* largest(int* values, int n)\` returning a pointer to the **first** largest element, or \`nullptr\` when \`n\` is 0. In \`main\`, check the pointer before using it: print \`empty\` if it is null; otherwise print \`largest=<value>\` (reached through the pointer), set that element to 0 **through the pointer**, and print the array.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`empty\`, or two lines: \`largest=<value>\` and the \`n\` integers space-separated.

Example: input \`5 3 8 2 8 1\` →
\`\`\`
largest=8
3 0 2 8 1
\`\`\``,
          starter: String.raw`#include <iostream>

int* largest(int* values, int n) {
    // TODO: return nullptr for n == 0, else a pointer to the first largest element
    return nullptr;
}

int main() {
    int values[100] = {};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    int* p = largest(values, n);
    // TODO: if p is null print "empty"; otherwise print largest=<*p>, set *p = 0, print the array
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int* largest(int* values, int n) {
    if (n == 0) return nullptr;
    int* best = &values[0];
    for (int i = 1; i < n; ++i) {
        if (values[i] > *best) best = &values[i];
    }
    return best;
}

int main() {
    int values[100] = {};
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }
    int* p = largest(values, n);
    if (!p) {
        std::cout << "empty\n";
        return 0;
    }
    std::cout << "largest=" << *p << '\n';
    *p = 0;
    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "Start with int* best = &values[0] and move it whenever values[i] > *best.",
            "Strictly greater keeps the first of several equal maxima.",
            "if (p) is the null check; *p = 0 writes the element through the pointer.",
          ],
          cases: [
            { stdin: "5\n3 8 2 8 1\n", expected: "largest=8\n3 0 2 8 1\n" },
            { stdin: "0\n", expected: "empty\n" },
            { stdin: "1\n-5\n", expected: "largest=-5\n0\n", hidden: true },
            { stdin: "4\n-3 -1 -2 -1\n", expected: "largest=-1\n-3 0 -2 -1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int x = 3;
int* p = &x;
*p = *p + 1;
int y = *p;
std::cout << x << ' ' << y << '\\n';
\`\`\``,
          options: ["`3 4`", "`4 4`", "`4 3`", "An address, then `4`"],
          answer: 1,
          explanation: "`*p = *p + 1` writes through the pointer, so `x` becomes 4; `y` then copies that 4. Nothing here prints `p` itself, so no address appears.",
        },
        {
          prompt: "What does `int* a, b;` declare?",
          options: ["Two pointers to `int`", "A pointer to `int` and an `int`", "A compile error", "An `int` and a pointer to `int`"],
          answer: 1,
          explanation: "The `*` belongs to the declarator `a`, not to the type: `a` is `int*`, `b` is a plain `int`. Declare one pointer per line to avoid the trap.",
        },
        {
          prompt: "Which of these is undefined behaviour?",
          options: ["`int* p = nullptr; if (p) *p = 1;`", "`int* p = nullptr; std::cout << *p;`", "`int x = 0; int* p = &x; *p = 5; std::cout << x;`", "`int* p = nullptr; p = nullptr;`"],
          answer: 1,
          explanation: "Dereferencing a null pointer is undefined behaviour. The first option checks before dereferencing, the third writes through a valid pointer, and the last merely assigns null twice.",
        },
        {
          prompt: "For a `Point* pp`, `pp->x` is the same as…",
          options: ["`*pp.x`", "`(*pp).x`", "`&pp.x`", "`pp.x`"],
          answer: 1,
          explanation: "`->` dereferences and then selects the member. `*pp.x` parses as `*(pp.x)` because `.` binds tighter than `*`, and a pointer has no member `x`, so it does not compile.",
        },
        {
          prompt: "When is a pointer parameter the right choice over a reference parameter?",
          options: ["Whenever the object is large", "When the argument may legitimately be absent (`nullptr`) or the function must reseat it", "Whenever the function modifies the argument", "Never — references replaced pointers in modern C++"],
          answer: 1,
          explanation: "A reference cannot be null and cannot be reseated, so those two needs call for a pointer. Size and mutability are handled by `const T&` and `T&` respectively.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
int a = 1, b = 2;
int* p = &a;
int* q = &b;
q = p;
*q = 10;
std::cout << a << ' ' << b << ' ' << (p == q) << '\\n';
\`\`\``,
          options: ["`1 10 1`", "`10 2 1`", "`10 10 1`", "`10 2 0`"],
          answer: 1,
          explanation: "`q = p` reseats `q` to point at `a`, so `*q = 10` writes `a`; `b` is untouched. Both pointers now hold the same address, so `p == q` prints `1`.",
        },
        {
          prompt: "`int* p; std::cout << (p == nullptr);` — what happens?",
          options: ["Prints `1`", "Prints `0`", "Undefined behaviour — `p` holds an indeterminate value", "Compile error"],
          answer: 2,
          explanation: "A pointer declared without an initialiser is not null; it holds garbage, and even reading it is undefined behaviour. Initialise every pointer: `int* p = nullptr;`.",
        },
      ],
    },
    {
      slug: "pointer-arithmetic-and-arrays",
      file: "03-pointer-arithmetic-and-arrays.md",
      exercises: [
        {
          title: "Sum and find over [begin, end)",
          prompt: `Read \`n\` (0 ≤ n ≤ 1000) integers into a \`std::vector<int>\` and form the range \`[begin, end)\` from \`data()\` and \`data() + size()\`. Write \`long long sum(const int* begin, const int* end)\` and \`const int* find_negative(const int* begin, const int* end)\` — the second returns a pointer to the first negative value, or \`end\` when there is none. Print the sum, then the **index** of the first negative value computed as a pointer difference, or \`-1\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** two lines, \`sum=<total>\` and \`first_negative=<index or -1>\`.

Example: input \`4 3 -1 2 -5\` →
\`\`\`
sum=-1
first_negative=1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

long long sum(const int* begin, const int* end) {
    // TODO: walk a pointer from begin to end and total the elements
    return 0;
}

const int* find_negative(const int* begin, const int* end) {
    // TODO: return a pointer to the first negative element, or end if there is none
    return end;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    const int* begin = values.data();
    const int* end = values.data() + values.size();
    std::cout << "sum=" << sum(begin, end) << '\n';
    // TODO: print first_negative=<index> using neg - begin, or -1 when neg == end
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

long long sum(const int* begin, const int* end) {
    long long total = 0;
    for (const int* p = begin; p != end; ++p) {
        total += *p;
    }
    return total;
}

const int* find_negative(const int* begin, const int* end) {
    for (const int* p = begin; p != end; ++p) {
        if (*p < 0) return p;
    }
    return end;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    const int* begin = values.data();
    const int* end = values.data() + values.size();
    std::cout << "sum=" << sum(begin, end) << '\n';
    const int* neg = find_negative(begin, end);
    if (neg == end) {
        std::cout << "first_negative=-1\n";
    } else {
        std::cout << "first_negative=" << (neg - begin) << '\n';
    }
    return 0;
}
`,
          hints: [
            "for (const int* p = begin; p != end; ++p) is the whole loop shape.",
            "Returning end for not-found means the caller compares the result with end, never dereferences it blindly.",
            "neg - begin is a std::ptrdiff_t: the index of the element neg points at.",
          ],
          cases: [
            { stdin: "5\n1 2 3 4 5\n", expected: "sum=15\nfirst_negative=-1\n" },
            { stdin: "4\n3 -1 2 -5\n", expected: "sum=-1\nfirst_negative=1\n" },
            { stdin: "0\n", expected: "sum=0\nfirst_negative=-1\n", hidden: true },
            { stdin: "3\n2000000000 2000000000 2000000000\n", expected: "sum=6000000000\nfirst_negative=-1\n", hidden: true },
            { stdin: "2\n-7 4\n", expected: "sum=-3\nfirst_negative=0\n", hidden: true },
          ],
        },
        {
          title: "strlen and reverse by hand",
          prompt: `Read one line (at most 200 characters, possibly empty) into \`char buf[256]\` with \`std::cin.getline(buf, sizeof buf)\`. Write \`std::size_t my_strlen(const char* s)\` that walks a pointer to the terminating \`'\\0'\` and returns the distance, and \`void reverse_in_place(char* s)\` that reverses the C string with two pointers moving towards each other. Do not use \`<cstring>\` or \`std::string\`.

**Input:** one line of text.
**Output:** \`length=<n>\`, then \`reversed=<the reversed text>\`.

Example: input \`hello\` →
\`\`\`
length=5
reversed=olleh
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>

std::size_t my_strlen(const char* s) {
    // TODO: walk a pointer to the '\0' terminator and return how far it went
    return 0;
}

void reverse_in_place(char* s) {
    // TODO: lo at the first char, hi at the last; swap and move inwards while lo < hi
}

int main() {
    char buf[256] = {};
    std::cin.getline(buf, sizeof buf);
    std::cout << "length=" << my_strlen(buf) << '\n';
    reverse_in_place(buf);
    std::cout << "reversed=" << buf << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>

std::size_t my_strlen(const char* s) {
    const char* p = s;
    while (*p != '\0') ++p;
    return static_cast<std::size_t>(p - s);
}

void reverse_in_place(char* s) {
    std::size_t len = my_strlen(s);
    if (len < 2) return;
    char* lo = s;
    char* hi = s + len - 1;
    while (lo < hi) {
        char tmp = *lo;
        *lo = *hi;
        *hi = tmp;
        ++lo;
        --hi;
    }
}

int main() {
    char buf[256] = {};
    std::cin.getline(buf, sizeof buf);
    std::cout << "length=" << my_strlen(buf) << '\n';
    reverse_in_place(buf);
    std::cout << "reversed=" << buf << '\n';
    return 0;
}
`,
          hints: [
            "while (*p != '\\0') ++p; then the length is p - s.",
            "lo = s and hi = s + len - 1; swap *lo and *hi while lo < hi.",
            "An empty line has length 0 — return before forming s + len - 1.",
          ],
          cases: [
            { stdin: "hello\n", expected: "length=5\nreversed=olleh\n" },
            { stdin: "a b c\n", expected: "length=5\nreversed=c b a\n" },
            { stdin: "\n", expected: "length=0\nreversed=\n", hidden: true },
            { stdin: "racecar\n", expected: "length=7\nreversed=racecar\n", hidden: true },
            { stdin: "Hello, World!\n", expected: "length=13\nreversed=!dlroW ,olleH\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int a[4] = {10, 20, 30, 40};
int* p = a + 1;
std::cout << p[2] << ' ' << *(p - 1) << ' ' << (a + 3) - p << '\\n';
\`\`\``,
          options: ["`30 10 2`", "`40 10 2`", "`40 20 3`", "`40 10 8`"],
          answer: 1,
          explanation: "`p` points at `a[1]`, so `p[2]` is `a[3]` = 40 and `*(p - 1)` is `a[0]` = 10. `(a + 3) - p` is a difference in elements, 3 − 1 = 2 — never in bytes.",
        },
        {
          prompt: "Given `int* end = arr + n;`, which operation is well-defined?",
          options: ["`*end`", "`p != end` and `end - arr`", "Forming `arr + n + 1`", "`end[0]`"],
          answer: 1,
          explanation: "The one-past-the-end pointer may be formed, compared and subtracted — that is what makes `[begin, end)` loops work. It may not be dereferenced (`*end`, `end[0]`), and going one further past it is undefined even without a read.",
        },
        {
          prompt: "What is the type of `q - p` for two `int*` pointers into the same array?",
          options: ["`int`", "`std::size_t`", "`std::ptrdiff_t` — a signed integer", "`long long`, always"],
          answer: 2,
          explanation: "Pointer subtraction yields `std::ptrdiff_t` from `<cstddef>`, signed because the result is negative when `q` comes before `p`. On this platform it is a `long`, but the name is what to write.",
        },
        {
          prompt: "For a `const char* p` pointing at a C string, `while (*p) ++p;` stops…",
          options: ["At the first space", "At the terminating `'\\0'`", "Never — it is undefined behaviour", "At the end of the line"],
          answer: 1,
          explanation: "`'\\0'` is the only `char` that converts to `false`, so the loop walks exactly to the terminator. Spaces and newlines are non-zero and do not stop it.",
        },
        {
          prompt: "`std::size_t len(const char* s) { return sizeof s; }` returns…",
          options: ["The string's length", "8 for every input", "The length plus one for the terminator", "A compile error"],
          answer: 1,
          explanation: "`s` is a pointer, and `sizeof` a pointer is 8 on x86-64 regardless of what it points at. Measuring a C string means walking to `'\\0'`.",
        },
        {
          prompt: "For a `double* d`, `d + 1` advances by…",
          options: ["1 byte", "8 bytes — one `double`", "4 bytes", "Whatever the optimiser chooses"],
          answer: 1,
          explanation: "Pointer arithmetic is in elements: the compiler multiplies by `sizeof(double)`, 8 on this platform. Moving one byte would need a `char*`.",
        },
        {
          prompt: "Which pair of pointers may be subtracted with a well-defined result?",
          options: ["Two pointers into the same array (or one past its end)", "Any two `int*`", "A pointer and `nullptr`", "Pointers to elements of two different arrays"],
          answer: 0,
          explanation: "Subtraction is defined only within one array, including its one-past-the-end position. Different arrays, null pointers and unrelated objects give undefined behaviour even though the compiler emits the instruction.",
        },
      ],
    },
    {
      slug: "references",
      file: "04-references.md",
      exercises: [
        {
          title: "Sort three by reference",
          prompt: `Read three integers. Write \`void swap_values(int& a, int& b)\` and \`void sort3(int& a, int& b, int& c, int& swaps)\` that puts the three into ascending order using **only** \`swap_values\` on pairs — compare \`a,b\`, then \`b,c\`, then \`a,b\` again — and counts every swap performed through the \`swaps\` in-out reference. Print the sorted values and the count.

**Input:** one line with three integers.
**Output:** the three integers in ascending order on one line, then \`swaps=<count>\`.

Example: input \`3 1 2\` →
\`\`\`
1 2 3
swaps=2
\`\`\``,
          starter: String.raw`#include <iostream>

void swap_values(int& a, int& b) {
    // TODO: exchange a and b — no pointers, no & at the call site
}

void sort3(int& a, int& b, int& c, int& swaps) {
    // TODO: three compare-and-swap steps; ++swaps for every swap performed
}

int main() {
    int a = 0, b = 0, c = 0;
    std::cin >> a >> b >> c;
    int swaps = 0;
    sort3(a, b, c, swaps);
    std::cout << a << ' ' << b << ' ' << c << '\n';
    std::cout << "swaps=" << swaps << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>

void swap_values(int& a, int& b) {
    int tmp = a;
    a = b;
    b = tmp;
}

void sort3(int& a, int& b, int& c, int& swaps) {
    if (a > b) {
        swap_values(a, b);
        ++swaps;
    }
    if (b > c) {
        swap_values(b, c);
        ++swaps;
    }
    if (a > b) {
        swap_values(a, b);
        ++swaps;
    }
}

int main() {
    int a = 0, b = 0, c = 0;
    std::cin >> a >> b >> c;
    int swaps = 0;
    sort3(a, b, c, swaps);
    std::cout << a << ' ' << b << ' ' << c << '\n';
    std::cout << "swaps=" << swaps << '\n';
    return 0;
}
`,
          hints: [
            "swap_values(a, b) with references: no & at the call site, no * in the body.",
            "if (a > b) { swap_values(a, b); ++swaps; } — three such steps sort three values.",
            "Equal values must not be swapped: compare with >, not >=.",
          ],
          cases: [
            { stdin: "3 1 2\n", expected: "1 2 3\nswaps=2\n" },
            { stdin: "5 5 1\n", expected: "1 5 5\nswaps=2\n" },
            { stdin: "-1 -2 -3\n", expected: "-3 -2 -1\nswaps=3\n", hidden: true },
            { stdin: "7 7 7\n", expected: "7 7 7\nswaps=0\n", hidden: true },
            { stdin: "1 2 3\n", expected: "1 2 3\nswaps=0\n", hidden: true },
          ],
        },
        {
          title: "Edit through a returned reference",
          prompt: `Read \`n\` (1 ≤ n ≤ 100) integers into a \`std::vector<int>\`, then an index \`i\` (0 ≤ i < n) and a value \`x\`. Write \`int& at_index(std::vector<int>& values, std::size_t i)\` returning a reference to element \`i\`, and assign \`x\` **through the call**: \`at_index(values, i) = x;\`. Then write \`void stats(const std::vector<int>& values, long long& sum, int& largest)\` that fills its two out-parameters, and print the results.

**Input:** \`n\`, then \`n\` integers, then \`i x\`.
**Output:** the vector after the assignment on one line, then \`sum=<sum> largest=<largest>\`.

Example: input \`4 1 2 3 4 2 10\` →
\`\`\`
1 2 10 4
sum=17 largest=10
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <vector>

int& at_index(std::vector<int>& values, std::size_t i) {
    // TODO: return a reference to element i (operator[] already returns one)
    return values.front();
}

void stats(const std::vector<int>& values, long long& sum, int& largest) {
    // TODO: fill sum and largest through the references
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    std::size_t i = 0;
    int x = 0;
    std::cin >> i >> x;
    // TODO: assign x through at_index(values, i)
    for (std::size_t k = 0; k < values.size(); ++k) {
        if (k > 0) std::cout << ' ';
        std::cout << values[k];
    }
    std::cout << '\n';
    long long sum = 0;
    int largest = 0;
    stats(values, sum, largest);
    std::cout << "sum=" << sum << " largest=" << largest << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <vector>

int& at_index(std::vector<int>& values, std::size_t i) {
    return values[i];
}

void stats(const std::vector<int>& values, long long& sum, int& largest) {
    sum = 0;
    largest = values.front();
    for (int x : values) {
        sum += x;
        if (x > largest) largest = x;
    }
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    std::size_t i = 0;
    int x = 0;
    std::cin >> i >> x;
    at_index(values, i) = x;
    for (std::size_t k = 0; k < values.size(); ++k) {
        if (k > 0) std::cout << ' ';
        std::cout << values[k];
    }
    std::cout << '\n';
    long long sum = 0;
    int largest = 0;
    stats(values, sum, largest);
    std::cout << "sum=" << sum << " largest=" << largest << '\n';
    return 0;
}
`,
          hints: [
            "return values[i]; — operator[] already returns a reference, so the function just passes it on.",
            "A call that returns int& is an lvalue: it can stand on the left of =.",
            "Initialise largest from values.front() so a vector of negatives works.",
          ],
          cases: [
            { stdin: "4\n1 2 3 4\n2 10\n", expected: "1 2 10 4\nsum=17 largest=10\n" },
            { stdin: "1\n-5\n0 -9\n", expected: "-9\nsum=-9 largest=-9\n" },
            { stdin: "3\n2000000000 2000000000 1\n2 2000000000\n", expected: "2000000000 2000000000 2000000000\nsum=6000000000 largest=2000000000\n", hidden: true },
            { stdin: "3\n-4 -8 -6\n0 -10\n", expected: "-10 -8 -6\nsum=-24 largest=-6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int x = 1, y = 2;
int& r = x;
r = y;
r = 5;
std::cout << x << ' ' << y << '\\n';
\`\`\``,
          options: ["`5 5`", "`5 2`", "`1 5`", "`2 5`"],
          answer: 1,
          explanation: "`r = y` does not rebind `r`; it copies `y`'s value into `x`. `r = 5` then writes `x` again. `y` is never written, so it stays 2.",
        },
        {
          prompt: "Which declaration compiles?",
          options: ["`int& r;`", "`int& r = 5;`", "`const int& r = 5;`", "`int& r = nullptr;`"],
          answer: 2,
          explanation: "A reference must be initialised, a non-const lvalue reference cannot bind to a temporary, and `nullptr` is not an `int`. Only `const int&` may bind to the temporary holding 5, and it extends that temporary's life.",
        },
        {
          prompt: "`int& f() { int v = 1; return v; }` — what is wrong?",
          options: ["Nothing; it returns 1", "Compile error: locals cannot be returned", "It returns a dangling reference — `v` is destroyed when `f` returns, so using the result is undefined behaviour", "It returns 0 because `v` is reset"],
          answer: 2,
          explanation: "`v` lives in `f`'s stack frame, which is gone after the return. The compiler warns (\"reference to local variable returned\") but still compiles. Return by value, or return a reference to something that outlives the call.",
        },
        {
          prompt: `\`\`\`cpp
std::vector<int> v{1, 2, 3};
int& a = v[0];
v.push_back(4);
a = 9;
\`\`\`
What is true of the last line?`,
          options: ["`v[0]` is now 9", "`v[0]` is still 1 — `a` was a copy", "It is undefined behaviour if `push_back` reallocated, because `a` refers to freed memory", "It does not compile"],
          answer: 2,
          explanation: "`push_back` may move every element to a new block and free the old one; references, pointers and iterators into the vector are then invalid. Take the reference after the container stops changing, or hold an index.",
        },
        {
          prompt: "`for (auto x : v) x *= 2;` on a `std::vector<int> v`…",
          options: ["Doubles every element", "Doubles nothing — `x` is a copy of each element", "Is a compile error", "Doubles only the first element"],
          answer: 1,
          explanation: "`auto x` copies each element into `x`; the write goes to the copy. `for (auto& x : v)` aliases the element and modifies the vector.",
        },
        {
          prompt: "`void f(const std::string& s);` is called as `f(\"abc\");`. What happens?",
          options: ["Compile error: a literal is not a `std::string`", "A temporary `std::string` is constructed from the literal and `s` binds to it for the call", "`s` refers to the literal's characters directly", "Undefined behaviour"],
          answer: 1,
          explanation: "A `const T&` parameter accepts a temporary, so the literal is converted to a `std::string` that lives until the call returns. A non-const `std::string&` parameter would reject the call.",
        },
        {
          prompt: "Which of these does a pointer allow that a reference does not?",
          options: ["Modifying the caller's object", "Being null, being reseated, and arithmetic", "Referring to an element of a `std::vector`", "Being passed to a function"],
          answer: 1,
          explanation: "Those three are exactly the differences: a reference is never null, is bound once, and has no `+ i`. Both can alias a caller's object, a vector element, or be passed around.",
        },
      ],
    },
    {
      slug: "const-correctness",
      file: "05-const-correctness.md",
      exercises: [
        {
          title: "A const-correct pipeline",
          prompt: `Read \`n\` (1 ≤ n ≤ 100) integers, then \`from\` and \`to\`. Write three functions with exactly these signatures — \`int count_matching(const std::vector<int>& values, int target)\`, \`void replace_all(std::vector<int>& values, int from, int to)\` and \`void print(const std::vector<int>& values)\` — and use them: print how many elements equal \`from\`, replace every one of them with \`to\`, and print the vector. Only \`replace_all\` may take a non-const reference.

**Input:** \`n\`, then \`n\` integers, then \`from to\`.
**Output:** \`count=<k>\`, then the vector space-separated on one line.

Example: input \`5 1 2 1 3 1 1 9\` →
\`\`\`
count=3
9 2 9 3 9
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <vector>

int count_matching(const std::vector<int>& values, int target) {
    // TODO: count the elements equal to target (read-only)
    return 0;
}

void replace_all(std::vector<int>& values, int from, int to) {
    // TODO: replace every from with to (the only function that writes)
}

void print(const std::vector<int>& values) {
    // TODO: print the elements space-separated, then a newline
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int from = 0, to = 0;
    std::cin >> from >> to;
    std::cout << "count=" << count_matching(values, from) << '\n';
    replace_all(values, from, to);
    print(values);
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <vector>

int count_matching(const std::vector<int>& values, int target) {
    int count = 0;
    for (int x : values) {
        if (x == target) ++count;
    }
    return count;
}

void replace_all(std::vector<int>& values, int from, int to) {
    for (int& x : values) {
        if (x == from) x = to;
    }
}

void print(const std::vector<int>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int from = 0, to = 0;
    std::cin >> from >> to;
    std::cout << "count=" << count_matching(values, from) << '\n';
    replace_all(values, from, to);
    print(values);
    return 0;
}
`,
          hints: [
            "for (int x : values) reads; for (int& x : values) may write — only replace_all needs the second.",
            "count_matching and print take const std::vector<int>& because they never modify; size() and [] have const overloads.",
            "from and to come after the n values in the same std::cin >> chain.",
          ],
          cases: [
            { stdin: "5\n1 2 1 3 1\n1 9\n", expected: "count=3\n9 2 9 3 9\n" },
            { stdin: "3\n4 5 6\n7 0\n", expected: "count=0\n4 5 6\n" },
            { stdin: "1\n0\n0 0\n", expected: "count=1\n0\n", hidden: true },
            { stdin: "4\n-2 -2 -2 -2\n-2 2\n", expected: "count=4\n2 2 2 2\n", hidden: true },
          ],
        },
        {
          title: "Which const is which",
          prompt: `Read \`n\` (0 ≤ n ≤ 100) integers into a \`std::vector<int>\`, then a \`target\`. Write \`int index_of(const int* begin, const int* end, int target)\` — a walking pointer over elements you may **not** modify, returning the index as a pointer difference or \`-1\` — and \`void double_all(int* const begin, int* const end)\` — two pointers you may **not** reseat, over elements you may modify, so the walk needs a local copy of \`begin\`. Print the index of \`target\`, double every element, and print the vector.

**Input:** \`n\`, then \`n\` integers, then \`target\`.
**Output:** \`index=<i or -1>\`, then the doubled values space-separated (an empty line when \`n\` is 0).

Example: input \`4 3 5 7 5 5\` →
\`\`\`
index=1
6 10 14 10
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

int index_of(const int* begin, const int* end, int target) {
    // TODO: walk a const int* from begin; return p - begin at the first match, else -1
    return -1;
}

void double_all(int* const begin, int* const end) {
    // TODO: begin and end cannot move — walk a local int* p = begin and write *p *= 2
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int target = 0;
    std::cin >> target;
    std::cout << "index=" << index_of(values.data(), values.data() + n, target) << '\n';
    double_all(values.data(), values.data() + n);
    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int index_of(const int* begin, const int* end, int target) {
    for (const int* p = begin; p != end; ++p) {
        if (*p == target) return static_cast<int>(p - begin);
    }
    return -1;
}

void double_all(int* const begin, int* const end) {
    for (int* p = begin; p != end; ++p) {
        *p *= 2;
    }
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int target = 0;
    std::cin >> target;
    std::cout << "index=" << index_of(values.data(), values.data() + n, target) << '\n';
    double_all(values.data(), values.data() + n);
    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "const int* p = begin; ++p; is fine — the pointee is const, the pointer is not.",
            "int* const begin cannot be incremented; declare int* p = begin and walk p instead.",
            "values.data() is an int*; it converts to const int* implicitly for index_of.",
          ],
          cases: [
            { stdin: "4\n3 5 7 5\n5\n", expected: "index=1\n6 10 14 10\n" },
            { stdin: "2\n1 2\n9\n", expected: "index=-1\n2 4\n" },
            { stdin: "1\n-4\n-4\n", expected: "index=0\n-8\n", hidden: true },
            { stdin: "0\n5\n", expected: "index=-1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const int* p` means…",
          options: ["`p` cannot be reseated", "The `int` cannot be modified through `p`, but `p` may be reseated", "Neither `p` nor the `int` can change", "`p` must point at a variable declared `const`"],
          answer: 1,
          explanation: "The `const` is left of the `*`, so it applies to the pointee: `*p = 1` is an error, `p = &other` is fine. A `const int*` may point at a non-const `int`; it only restricts access through `p`.",
        },
        {
          prompt: "Given `int x = 1, y = 2; int* const p = &x;`, which statement compiles?",
          options: ["`*p = 2;`", "`p = &y;`", "`++p;`", "`p = nullptr;`"],
          answer: 0,
          explanation: "`int* const` is a const pointer to a non-const `int`: the pointer itself is frozen, so every reseat (assignment, increment) is an error, while writing the pointee is allowed.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
int x = 1;
const int& r = x;
x = 2;
std::cout << r << '\\n';
\`\`\``,
          options: ["`1`", "`2`", "Compile error at `x = 2`", "Undefined behaviour"],
          answer: 1,
          explanation: "`const` on the reference forbids writing *through `r`*; it does not freeze `x`. `r` is an alias for `x` and sees the new value.",
        },
        {
          prompt: "Which conversion happens implicitly, with no cast?",
          options: ["`int*` to `const int*`", "`const int*` to `int*`", "`const int&` to `int&`", "None — every change of constness needs a cast"],
          answer: 0,
          explanation: "Adding `const` only restricts what the new handle may do, so it is always safe and implicit. Removing it would let `const` data be written and requires `const_cast`, on purpose.",
        },
        {
          prompt: "`const int c = 5; const_cast<int&>(c) = 6;` — what is the result?",
          options: ["`c` becomes 6", "Undefined behaviour — `c` was declared `const`", "Compile error", "A copy of `c` becomes 6"],
          answer: 1,
          explanation: "The cast compiles, but writing through it to an object that was *declared* `const` is undefined behaviour: the compiler may have placed `c` in read-only memory or folded 5 into every use. `const_cast` is only defined for objects that were never const to begin with.",
        },
        {
          prompt: `\`\`\`cpp
struct S {
    int v = 0;
    int get() { return v; }
};
void f(const S& s) { std::cout << s.get(); }
\`\`\`
What happens?`,
          options: ["Prints `0`", "Compile error: `get()` is not a `const` member function, so it cannot be called on a `const S&`", "Undefined behaviour", "Prints an address"],
          answer: 1,
          explanation: "A `const` object may only call member functions marked `const`. Declaring `int get() const` fixes it — and this is why one missing `const` blocks every const-correct caller of the class.",
        },
        {
          prompt: "Read right to left: `const char* const* argv` is…",
          options: ["A pointer to a const pointer to const char", "A const pointer to a pointer to const char", "A const pointer to a const char", "Invalid C++"],
          answer: 0,
          explanation: "From `argv` outwards: `*` — pointer to; `const` — a const; `*` — pointer to; `const char` — const char. The outer pointer (`argv`) may itself be reseated; what it points at, and what those point at, may not be modified.",
        },
      ],
    },
    {
      slug: "multidimensional-data",
      file: "06-multidimensional-data.md",
      exercises: [
        {
          title: "Row sums, column sums, first maximum",
          prompt: `Read \`R\` and \`C\` (1 ≤ R, C ≤ 50) and an \`R × C\` grid of integers into a \`std::vector<std::vector<int>>\` built as \`grid(R, std::vector<int>(C))\`. Print the sum of every row, then of every column, then the largest value and where it **first** occurs in row-major order.

**Input:** \`R C\`, then \`R\` rows of \`C\` integers.
**Output:** \`R\` lines \`row <r>: <sum>\`, \`C\` lines \`col <c>: <sum>\`, then \`max=<value> at r=<r> c=<c>\`.

Example: input
\`\`\`
2 3
1 2 3
4 5 6
\`\`\`
→
\`\`\`
row 0: 6
row 1: 15
col 0: 5
col 1: 7
col 2: 9
max=6 at r=1 c=2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::vector<int>> grid(rows, std::vector<int>(cols));
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            std::cin >> grid[r][c];
        }
    }
    // TODO: row sums as "row <r>: <sum>"
    // TODO: column sums as "col <c>: <sum>"
    // TODO: first maximum in row-major order as "max=<value> at r=<r> c=<c>"
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::vector<int>> grid(rows, std::vector<int>(cols));
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            std::cin >> grid[r][c];
        }
    }
    for (int r = 0; r < rows; ++r) {
        long long total = 0;
        for (int c = 0; c < cols; ++c) total += grid[r][c];
        std::cout << "row " << r << ": " << total << '\n';
    }
    for (int c = 0; c < cols; ++c) {
        long long total = 0;
        for (int r = 0; r < rows; ++r) total += grid[r][c];
        std::cout << "col " << c << ": " << total << '\n';
    }
    int best = grid[0][0];
    int best_r = 0;
    int best_c = 0;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] > best) {
                best = grid[r][c];
                best_r = r;
                best_c = c;
            }
        }
    }
    std::cout << "max=" << best << " at r=" << best_r << " c=" << best_c << '\n';
    return 0;
}
`,
          hints: [
            "Two nested loops read the grid: rows outside, columns inside.",
            "Column sums swap the loop order: for each c, add grid[r][c] over every r.",
            "Use a strict > when scanning for the maximum so the first occurrence wins.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "row 0: 6\nrow 1: 15\ncol 0: 5\ncol 1: 7\ncol 2: 9\nmax=6 at r=1 c=2\n" },
            { stdin: "1 1\n7\n", expected: "row 0: 7\ncol 0: 7\nmax=7 at r=0 c=0\n" },
            { stdin: "3 2\n-1 1\n2 -2\n0 0\n", expected: "row 0: 0\nrow 1: 0\nrow 2: 0\ncol 0: 1\ncol 1: -1\nmax=2 at r=1 c=0\n", hidden: true },
            { stdin: "2 2\n5 5\n5 5\n", expected: "row 0: 10\nrow 1: 10\ncol 0: 10\ncol 1: 10\nmax=5 at r=0 c=0\n", hidden: true },
          ],
        },
        {
          title: "Count the neighbours",
          prompt: `Read \`R\` and \`C\` (1 ≤ R, C ≤ 50) and \`R\` rows of \`C\` characters, each \`.\` or \`#\`, into a \`std::vector<std::string>\`. For every cell, count how many of its up to eight neighbours are \`#\` and print the counts as a grid of digits, one row per line. Use direction arrays or a \`dr\`/\`dc\` loop over \`-1..1\`, and check the bounds **before** every access — a corner cell has only three neighbours.

**Input:** \`R C\`, then \`R\` rows.
**Output:** \`R\` lines of \`C\` digits.

Example: input
\`\`\`
3 3
.#.
###
.#.
\`\`\`
→
\`\`\`
333
343
333
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (std::string& row : grid) std::cin >> row;
    for (int r = 0; r < rows; ++r) {
        std::string line;
        for (int c = 0; c < cols; ++c) {
            int count = 0;
            // TODO: visit the eight neighbours of (r, c); skip (0, 0) and anything off the grid
            line += static_cast<char>('0' + count);
        }
        std::cout << line << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (std::string& row : grid) std::cin >> row;
    for (int r = 0; r < rows; ++r) {
        std::string line;
        for (int c = 0; c < cols; ++c) {
            int count = 0;
            for (int dr = -1; dr <= 1; ++dr) {
                for (int dc = -1; dc <= 1; ++dc) {
                    if (dr == 0 && dc == 0) continue;
                    int nr = r + dr;
                    int nc = c + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (grid[nr][nc] == '#') ++count;
                }
            }
            line += static_cast<char>('0' + count);
        }
        std::cout << line << '\n';
    }
    return 0;
}
`,
          hints: [
            "Skip dr == 0 && dc == 0: a cell is not its own neighbour.",
            "if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue; must come before grid[nr][nc].",
            "'0' + count turns a count of 0..8 into its digit character.",
          ],
          cases: [
            { stdin: "3 3\n.#.\n###\n.#.\n", expected: "333\n343\n333\n" },
            { stdin: "1 1\n#\n", expected: "0\n" },
            { stdin: "2 4\n#..#\n....\n", expected: "0110\n1111\n", hidden: true },
            { stdin: "2 2\n##\n##\n", expected: "33\n33\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`std::vector<std::vector<int>> g(3, std::vector<int>(4));` creates…",
          options: ["3 rows of 4 zeros", "4 rows of 3 zeros", "12 empty rows", "A compile error"],
          answer: 0,
          explanation: "The outer constructor makes 3 copies of the given row, and the row is a `std::vector<int>` of 4 value-initialised (zero) elements: `g[r][c]` with `r < 3`, `c < 4`.",
        },
        {
          prompt: "In a flat, row-major `std::vector<int>` holding an `R × C` grid, cell `(r, c)` is at index…",
          options: ["`c * R + r`", "`r * C + c`", "`r * R + c`", "`r + c`"],
          answer: 1,
          explanation: "Row-major stores each full row of `C` elements before the next: skip `r` rows (`r * C`) then `c` more. `c * R + r` is column-major, which transposes every access.",
        },
        {
          prompt: "Which loop order walks a row-major grid's memory sequentially?",
          options: ["`c` outer, `r` inner", "`r` outer, `c` inner", "Either — the cost is the same", "Neither — vectors are not contiguous"],
          answer: 1,
          explanation: "With rows outside, consecutive iterations touch neighbouring elements; with columns outside, every step jumps a whole row. The results are identical; the cache behaviour is not.",
        },
        {
          prompt: "With `DR = {-1, 1, 0, 0}` and `DC = {0, 0, -1, 1}`, the four directions `d = 0..3` are…",
          options: ["up, down, left, right", "the four diagonals", "up, left, down, right", "right, left, up, down"],
          answer: 0,
          explanation: "Pair the arrays index by index: `(-1, 0)` is one row up, `(1, 0)` one row down, `(0, -1)` one column left, `(0, 1)` one column right. Diagonals would need both offsets non-zero.",
        },
        {
          prompt: "Before reading `grid[nr][nc]` for a neighbour, the complete check is…",
          options: ["`nr < rows && nc < cols`", "`nr >= 0 && nr < rows && nc >= 0 && nc < cols`", "`nr <= rows && nc <= cols`", "None — `std::vector` checks bounds for you"],
          answer: 1,
          explanation: "Neighbours can go negative at the top and left edges and reach `rows`/`cols` at the bottom and right; all four comparisons are needed. `operator[]` never checks, and an out-of-range index is undefined behaviour.",
        },
        {
          prompt: "`std::vector<std::vector<int>> g(R, C);` with `int R, C` is…",
          options: ["R rows of C zeros", "A compile error — the second argument must be a `std::vector<int>`, not an `int`", "C rows of R zeros", "R rows, each holding the single value C"],
          answer: 1,
          explanation: "There is no `vector(int, int)` constructor for a vector of vectors: the fill constructor wants a row value, and an `int` does not convert to `std::vector<int>` implicitly. Write `g(R, std::vector<int>(C))`.",
        },
        {
          prompt: "`std::vector<std::string> g(R); for (auto& row : g) std::cin >> row;` reads a character grid correctly because…",
          options: ["`>>` reads one whitespace-delimited token, which is a whole row when rows contain no spaces", "`std::string` is a `std::vector<char>`", "`>>` reads exactly `C` characters", "It does not — `std::getline` is required"],
          answer: 0,
          explanation: "A row such as `.#..#` has no whitespace, so `>>` extracts it in one go and skips the newline before the next. If rows could contain spaces you would need `std::getline` and the leftover-newline care from Module 1.",
        },
      ],
    },
    {
      slug: "arrays-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Runs through a pointer walk",
          prompt: `Read \`n\` (1 ≤ n ≤ 1000) integers into a \`std::vector<int>\`. Walk the range \`[begin, end)\` with \`const int*\` pointers and print each maximal run of equal consecutive values as \`<value>x<length>\`, space-separated on one line. Write \`const int* run_end(const int* p, const int* end)\` that returns the pointer one past the run starting at \`p\`; the length of a run is a pointer difference.

**Input:** \`n\`, then \`n\` integers.
**Output:** one line of runs.

Example: input \`6 1 1 2 2 2 3\` → output \`1x2 2x3 3x1\``,
          starter: String.raw`#include <iostream>
#include <vector>

const int* run_end(const int* p, const int* end) {
    // TODO: advance a copy of p while it is inside the range and equals *p; return it
    return end;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    const int* begin = values.data();
    const int* end = begin + values.size();
    // TODO: for (const int* p = begin; p != end; ) { q = run_end(p, end); print *p x (q - p); p = q; }
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

const int* run_end(const int* p, const int* end) {
    const int* q = p;
    while (q != end && *q == *p) ++q;
    return q;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    const int* begin = values.data();
    const int* end = begin + values.size();
    bool first = true;
    for (const int* p = begin; p != end;) {
        const int* q = run_end(p, end);
        if (!first) std::cout << ' ';
        std::cout << *p << 'x' << (q - p);
        first = false;
        p = q;
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "run_end: const int* q = p; while (q != end && *q == *p) ++q; return q;",
            "The outer loop advances p = run_end(p, end) until p == end; no ++p.",
            "Print a space before every run except the first.",
          ],
          cases: [
            { stdin: "6\n1 1 2 2 2 3\n", expected: "1x2 2x3 3x1\n" },
            { stdin: "1\n7\n", expected: "7x1\n" },
            { stdin: "5\n-1 -1 -1 -1 -1\n", expected: "-1x5\n", hidden: true },
            { stdin: "4\n1 2 1 2\n", expected: "1x1 2x1 1x1 2x1\n", hidden: true },
          ],
        },
        {
          title: "Region size",
          prompt: `Read \`R\` and \`C\` (1 ≤ R, C ≤ 50), \`R\` rows of \`.\` (open) and \`#\` (wall), then a start cell \`r c\`. Print the number of open cells reachable from the start by moving up, down, left or right through open cells, counting the start itself; if the start is a wall, print \`region=0\`. Use a \`std::vector<std::pair<int, int>>\` as an explicit stack, a \`seen\` grid, direction arrays and a bounds check before every access.

**Input:** \`R C\`, \`R\` rows, then \`r c\`.
**Output:** \`region=<count>\`.

Example: input
\`\`\`
3 4
..#.
.#..
..#.
0 0
\`\`\`
→ \`region=5\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (std::string& row : grid) std::cin >> row;
    int sr = 0, sc = 0;
    std::cin >> sr >> sc;
    if (grid[sr][sc] == '#') {
        std::cout << "region=0\n";
        return 0;
    }
    std::vector<std::vector<char>> seen(rows, std::vector<char>(cols, 0));
    const int DR[4] = {-1, 1, 0, 0};
    const int DC[4] = {0, 0, -1, 1};
    std::vector<std::pair<int, int>> stack;
    int size = 0;
    // TODO: push the start and mark it seen; pop, count, push unseen open neighbours (mark on push)
    std::cout << "region=" << size << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    int rows = 0, cols = 0;
    std::cin >> rows >> cols;
    std::vector<std::string> grid(rows);
    for (std::string& row : grid) std::cin >> row;
    int sr = 0, sc = 0;
    std::cin >> sr >> sc;
    if (grid[sr][sc] == '#') {
        std::cout << "region=0\n";
        return 0;
    }
    std::vector<std::vector<char>> seen(rows, std::vector<char>(cols, 0));
    const int DR[4] = {-1, 1, 0, 0};
    const int DC[4] = {0, 0, -1, 1};
    std::vector<std::pair<int, int>> stack;
    stack.push_back({sr, sc});
    seen[sr][sc] = 1;
    int size = 0;
    while (!stack.empty()) {
        auto [r, c] = stack.back();
        stack.pop_back();
        ++size;
        for (int d = 0; d < 4; ++d) {
            int nr = r + DR[d];
            int nc = c + DC[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (grid[nr][nc] == '#' || seen[nr][nc]) continue;
            seen[nr][nc] = 1;
            stack.push_back({nr, nc});
        }
    }
    std::cout << "region=" << size << '\n';
    return 0;
}
`,
          hints: [
            "Push the start and mark it seen; then pop, count, and push each unseen open neighbour after marking it.",
            "Marking a cell seen when it is pushed (not when popped) stops it being pushed twice.",
            "auto [r, c] = stack.back(); stack.pop_back(); takes the top of the explicit stack.",
          ],
          cases: [
            { stdin: "3 4\n..#.\n.#..\n..#.\n0 0\n", expected: "region=5\n" },
            { stdin: "3 4\n..#.\n.#..\n..#.\n1 3\n", expected: "region=4\n" },
            { stdin: "3 4\n..#.\n.#..\n..#.\n1 1\n", expected: "region=0\n", hidden: true },
            { stdin: "1 1\n.\n0 0\n", expected: "region=1\n", hidden: true },
            { stdin: "2 2\n..\n..\n1 1\n", expected: "region=4\n", hidden: true },
          ],
        },
        {
          title: "Analyse and normalise",
          prompt: `Read \`n\` (1 ≤ n ≤ 100) integers into a \`std::vector<int>\`. Write \`void analyse(const std::vector<int>& values, int& lo, int& hi, double& mean)\` — a const reference in, three references out — and \`void normalise(std::vector<int>& values, int shift)\` that subtracts \`shift\` from every element. Print the minimum, maximum and mean (two decimals), then the values after subtracting the minimum so that the smallest becomes 0.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`min=<lo> max=<hi> mean=<mean>\`, then the normalised values on one line.

Example: input \`4 3 8 1 4\` →
\`\`\`
min=1 max=8 mean=4.00
2 7 0 3
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iomanip>
#include <iostream>
#include <vector>

void analyse(const std::vector<int>& values, int& lo, int& hi, double& mean) {
    // TODO: one pass over values filling lo, hi and mean through the references
}

void normalise(std::vector<int>& values, int shift) {
    // TODO: subtract shift from every element in place
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int lo = 0, hi = 0;
    double mean = 0.0;
    analyse(values, lo, hi, mean);
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "min=" << lo << " max=" << hi << " mean=" << mean << '\n';
    normalise(values, lo);
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iomanip>
#include <iostream>
#include <vector>

void analyse(const std::vector<int>& values, int& lo, int& hi, double& mean) {
    lo = values.front();
    hi = values.front();
    long long sum = 0;
    for (int x : values) {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
        sum += x;
    }
    mean = static_cast<double>(sum) / static_cast<double>(values.size());
}

void normalise(std::vector<int>& values, int shift) {
    for (int& x : values) x -= shift;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& x : values) std::cin >> x;
    int lo = 0, hi = 0;
    double mean = 0.0;
    analyse(values, lo, hi, mean);
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "min=" << lo << " max=" << hi << " mean=" << mean << '\n';
    normalise(values, lo);
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "Start lo and hi from values.front(), then a single pass updates both and the sum.",
            "Sum in a long long and convert to double before dividing by values.size().",
            "normalise(values, lo) — the out-parameter you just filled is the shift.",
          ],
          cases: [
            { stdin: "4\n3 8 1 4\n", expected: "min=1 max=8 mean=4.00\n2 7 0 3\n" },
            { stdin: "1\n-5\n", expected: "min=-5 max=-5 mean=-5.00\n0\n" },
            { stdin: "3\n10 10 10\n", expected: "min=10 max=10 mean=10.00\n0 0 0\n", hidden: true },
            { stdin: "5\n-2 -1 0 1 2\n", expected: "min=-2 max=2 mean=0.00\n0 1 2 3 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int a[3] = {1, 2, 3};
std::cout << a[3] << '\\n';
\`\`\``,
          options: ["`0`", "`3`", "Undefined behaviour — `a[3]` is past the end", "Compile error"],
          answer: 2,
          explanation: "Valid indices are 0, 1 and 2. Nothing checks the subscript; reading `a[3]` is undefined behaviour, whatever it happens to print today.",
        },
        {
          prompt: "Which type gives a fixed-size array value semantics — copyable, comparable with `==`, with a `.size()`?",
          options: ["`int[N]`", "`std::array<T, N>`", "`int*`", "`std::size`"],
          answer: 1,
          explanation: "`std::array` wraps the built-in block in a struct, so it copies, compares and reports its size like any other value. A built-in array decays and cannot be assigned; `std::size` is a function, not a container.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
int x = 1;
int* p = &x;
int** pp = &p;
**pp = 4;
std::cout << x << '\\n';
\`\`\``,
          options: ["`1`", "`4`", "An address", "Compile error"],
          answer: 1,
          explanation: "`*pp` is `p`, and `**pp` is `*p`, which is `x`. Two dereferences reach the `int`, and the write lands in `x`.",
        },
        {
          prompt: "`p[i]` is defined as…",
          options: ["`*(p + i)`", "`*p + i`", "`p + i`", "`&p[i]`"],
          answer: 0,
          explanation: "Subscripting a pointer (or a decayed array) is pointer arithmetic followed by a dereference. `*p + i` adds to the first element's value; `p + i` is the address of the element, not the element.",
        },
        {
          prompt: "For `int* begin = a; int* end = a + n;` with `n == 0`, `end - begin` is…",
          options: ["Undefined behaviour", "`0`", "`1`", "`-1`"],
          answer: 1,
          explanation: "An empty range has `begin == end`, so the difference is 0 and a `p != end` loop runs zero times. Forming `a + 0` is always allowed.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
int a = 1, b = 2;
int& r = a;
r = b;
b = 3;
std::cout << a << r << b << '\\n';
\`\`\``,
          options: ["`123`", "`223`", "`233`", "`333`"],
          answer: 1,
          explanation: "`r = b` copies 2 into `a` (`r` still names `a`); `b = 3` changes only `b`. So `a` is 2, `r` reads `a` as 2, and `b` is 3.",
        },
        {
          prompt: "Given `int x = 0; int* const p = &x;`, which statement is allowed?",
          options: ["`p = &x;`", "`*p = 5;`", "`++p;`", "None of them"],
          answer: 1,
          explanation: "The `const` is right of the `*`, so the pointer is frozen and the pointee is not: writing `*p` is fine, reseating or moving `p` is an error.",
        },
        {
          prompt: "In a flat row-major vector holding an `R × C` grid, cell `(r, c)` is at index…",
          options: ["`r * C + c`", "`c * R + r`", "`r * R + c`", "`r + c * C`"],
          answer: 0,
          explanation: "Skip `r` complete rows of `C` elements, then `c` more. The other formulas either transpose the grid or use the wrong stride.",
        },
        {
          prompt: "Which function returns a dangling reference?",
          options: ["`int& f(std::vector<int>& v) { return v[0]; }`", "`int& f() { static int n = 0; return n; }`", "`int& f() { int n = 0; return n; }`", "`int& f(int& n) { return n; }`"],
          answer: 2,
          explanation: "The local `n` is destroyed when `f` returns. A vector element, a `static` and a reference parameter all refer to objects that outlive the call.",
        },
        {
          prompt: "`std::vector<int> v{1, 2, 3}; auto x = v[0]; x = 9;` — afterwards `v[0]` is…",
          options: ["`9`", "`1` — `x` is a copy; `auto&` would alias the element", "Undefined behaviour", "A compile error"],
          answer: 1,
          explanation: "`auto` deduces `int`, dropping the reference `operator[]` returned, so `x` is an independent copy. `auto& x = v[0]` makes `x` an alias and the write would reach the vector.",
        },
        {
          prompt: "Inside `void f(int values[])`, the expression `std::size(values)`…",
          options: ["Returns the caller's array length", "Returns 8", "Does not compile — `values` is a pointer and has no size", "Returns 0"],
          answer: 2,
          explanation: "The parameter is `int*`; `std::size` has no overload for a pointer, so the call is a hard error rather than a silently wrong number. That is the safe failure — pass the length explicitly.",
        },
        {
          prompt: "To read the upward neighbour `(r - 1, c)` safely you must first check…",
          options: ["`r > 0`", "`r >= 0`", "`r < rows`", "Nothing — `std::vector` bounds-checks `[]`"],
          answer: 0,
          explanation: "`r - 1` must be at least 0, which means `r > 0`. `r >= 0` still allows `r == 0` and an index of −1; `operator[]` never checks.",
        },
        {
          prompt: "`std::array<int, 3> a{}; a.at(5)` …",
          options: ["Returns 0", "Is undefined behaviour", "Throws `std::out_of_range`", "Does not compile"],
          answer: 2,
          explanation: "`.at()` is the checked access and throws on a bad index. `a[5]` would be undefined behaviour — the same unchecked access as a built-in array.",
        },
        {
          prompt: "`void total(std::vector<int> v)` versus `void total(const std::vector<int>& v)` for summing a million elements — the difference is…",
          options: ["None once the optimiser has run", "The first copies a million `int`s on every call; the second passes one pointer-sized reference", "The second is slower because of the extra indirection", "The first is required — a `const` vector cannot be iterated"],
          answer: 1,
          explanation: "Pass by value copies the whole vector; `const&` costs eight bytes and forbids modification, which is all a sum needs. Const containers are fully iterable through their `const` overloads.",
        },
        {
          prompt: "`int x = 1; const int* p = &x; x = 5;` — `*p` now reads…",
          options: ["`1`, the value when `p` was bound", "`5` — `const` restricts writes through `p`, not changes to `x`", "Undefined behaviour", "A compile error at `x = 5`"],
          answer: 1,
          explanation: "`const int*` is a read-only view of an object that may still be written through other names. `p` sees whatever `x` currently holds.",
        },
      ],
    },
  ],
});

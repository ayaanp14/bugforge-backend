import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "types",
  title: "Fundamental types",
  blurb: "The built-in types and their exact sizes on this platform; integer overflow, wrap-around and bits; floating-point representation and deterministic printing; conversions and the four casts; const, constexpr and auto; literals and scoped enums.",
  icon: "type",
  overview: `C++ hands you the machine's types with the machine's sizes and none of the guard rails a managed language wraps around them. Every value is a fixed number of bytes with a fixed meaning, and the compiler emits exactly the instruction for that type — which is where the speed comes from, and why the rules at the edges belong to the programmer: what a signed overflow does (nothing you may rely on), what an unsigned one does (wraps), what \`0.1 + 0.2\` is (not \`0.3\`), and what \`-1 < 1u\` says (false).

The module takes the six topics in order. The fundamental types, their sizes on this track's x86-64 runtime, \`<cstdint>\`, \`<limits>\` and why brace-initialisation is the default. Integer arithmetic: overflow as undefined behaviour and how to detect it first, unsigned wrap-around, integer promotion, truncating division, the bit operators and C++20's \`<bit>\`. Floating point: IEEE 754 in enough detail to predict \`0.1 + 0.2\`, tolerance comparison, accumulation error, printing with a fixed precision, NaN and infinity, and when \`long long\` cents is the right answer. Conversions and casts: narrowing and how braces reject it, the signed/unsigned trap, \`static_cast\`, \`reinterpret_cast\`, \`const_cast\` and why the C-style cast is retired. \`const\`, \`constexpr\` and the four deduction rules of \`auto\`. Literals in every base and suffix, escape and raw strings, and unscoped versus scoped enumerations.

Every exercise is a judged program on the Clang 18 / C++20 runtime: a platform report from \`std::numeric_limits\`, a smallest-type classifier, a checked sum with \`__builtin_add_overflow\`, an eight-bit flag register, two-decimal statistics and a tolerance comparer, a Caesar shift written in \`char\` arithmetic, signed/unsigned comparisons done right, \`constexpr\` power and primality proved by \`static_assert\`, \`auto\`-typed accumulators, a literal decoder and a scoped weekday enum. The checkpoint adds a checked running product, an invoice kept in integer cents and a literal classifier that names each token's type.`,
  lessons: [
    {
      slug: "fundamental-types",
      file: "01-fundamental-types.md",
      exercises: [
        {
          title: "Platform report",
          prompt: `Read an integer \`n\`, then \`n\` lines each naming one type: \`bool\`, \`char\`, \`int\`, \`long\`, \`long long\`, \`size_t\`, \`double\` or \`long double\`. For each of the six integer types print \`<name> size=<bytes> min=<min> max=<max>\`; for the two floating types print \`<name> size=<bytes> digits10=<digits>\`; for any other name print \`<name> unknown\`.

Take every number from \`sizeof\` and \`std::numeric_limits\` — never type a constant in. Print \`char\`'s limits as numbers, not characters.

**Input:** \`n\`, then \`n\` type names, one per line (\`long long\` contains a space, so read lines with \`std::getline\`).
**Output:** \`n\` lines.

\`\`\`text
3
int
char
double
\`\`\`
→
\`\`\`text
int size=4 min=-2147483648 max=2147483647
char size=1 min=0 max=255
double size=8 digits10=15
\`\`\``,
          starter: String.raw`#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::getline(std::cin, name);
        if (name == "int") {
            std::cout << name << " size=" << sizeof(int)
                      << " min=" << std::numeric_limits<int>::min()
                      << " max=" << std::numeric_limits<int>::max() << '\n';
        } else {
            // TODO: bool, char, long, long long, size_t, double, long double — and "unknown"
            std::cout << name << " unknown\n";
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::getline(std::cin, name);
        if (name == "bool") {
            std::cout << name << " size=" << sizeof(bool)
                      << " min=" << std::numeric_limits<bool>::min()
                      << " max=" << std::numeric_limits<bool>::max() << '\n';
        } else if (name == "char") {
            // A char prints as a character; promote to int to see the number.
            std::cout << name << " size=" << sizeof(char)
                      << " min=" << static_cast<int>(std::numeric_limits<char>::min())
                      << " max=" << static_cast<int>(std::numeric_limits<char>::max()) << '\n';
        } else if (name == "int") {
            std::cout << name << " size=" << sizeof(int)
                      << " min=" << std::numeric_limits<int>::min()
                      << " max=" << std::numeric_limits<int>::max() << '\n';
        } else if (name == "long") {
            std::cout << name << " size=" << sizeof(long)
                      << " min=" << std::numeric_limits<long>::min()
                      << " max=" << std::numeric_limits<long>::max() << '\n';
        } else if (name == "long long") {
            std::cout << name << " size=" << sizeof(long long)
                      << " min=" << std::numeric_limits<long long>::min()
                      << " max=" << std::numeric_limits<long long>::max() << '\n';
        } else if (name == "size_t") {
            std::cout << name << " size=" << sizeof(std::size_t)
                      << " min=" << std::numeric_limits<std::size_t>::min()
                      << " max=" << std::numeric_limits<std::size_t>::max() << '\n';
        } else if (name == "double") {
            std::cout << name << " size=" << sizeof(double)
                      << " digits10=" << std::numeric_limits<double>::digits10 << '\n';
        } else if (name == "long double") {
            std::cout << name << " size=" << sizeof(long double)
                      << " digits10=" << std::numeric_limits<long double>::digits10 << '\n';
        } else {
            std::cout << name << " unknown\n";
        }
    }
    return 0;
}
`,
          hints: [
            "std::numeric_limits<T>::min() and max() work for every fundamental T, including bool and std::size_t.",
            "Printing std::numeric_limits<char>::min() shows a character; wrap it in static_cast<int>(...).",
            "digits10 is a static constant, not a function: std::numeric_limits<double>::digits10 with no parentheses.",
          ],
          // The study judge (Paiza) runs C++ on aarch64 Linux, where `char` is
          // unsigned (0…255) and `long double` is IEEE binary128 (digits10 33),
          // unlike the x86-64 gcc in the local cpp-lab (−128…127, x87 80-bit,
          // digits10 18). The judge grades learners, so these are its values;
          // the lab reports this one exercise as failing. Probed 2026-09-17.
          cases: [
            { stdin: "3\nint\nchar\ndouble\n", expected: "int size=4 min=-2147483648 max=2147483647\nchar size=1 min=0 max=255\ndouble size=8 digits10=15\n" },
            { stdin: "2\nlong long\nstring\n", expected: "long long size=8 min=-9223372036854775808 max=9223372036854775807\nstring unknown\n" },
            { stdin: "4\nbool\nsize_t\nlong double\nlong\n", expected: "bool size=1 min=0 max=1\nsize_t size=8 min=0 max=18446744073709551615\nlong double size=16 digits10=33\nlong size=8 min=-9223372036854775808 max=9223372036854775807\n", hidden: true },
            { stdin: "1\nint32\n", expected: "int32 unknown\n", hidden: true },
          ],
        },
        {
          title: "The smallest type that fits",
          prompt: `Read an integer \`n\`, then \`n\` integers, each within the range of a signed 64-bit integer. For each value print \`<value> fits in <type>\`, where the type is the narrowest of \`int8_t\`, \`int16_t\`, \`int32_t\` and \`int64_t\` whose range contains it.

Read the values into a \`long long\` and compare against \`std::numeric_limits<std::int8_t>::min()\` / \`max()\` and the other fixed-width types from \`<cstdint>\` — no hand-typed constants.

**Input:** \`n\`, then \`n\` integers separated by whitespace.
**Output:** \`n\` lines.

Example: input \`3 100 -129 40000\` →
\`\`\`text
100 fits in int8_t
-129 fits in int16_t
40000 fits in int32_t
\`\`\``,
          starter: String.raw`#include <cstdint>
#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long v;
        std::cin >> v;
        std::string type = "int64_t";
        // TODO: narrow the answer by testing int8_t, then int16_t, then int32_t
        std::cout << v << " fits in " << type << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <cstdint>
#include <iostream>
#include <limits>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long v;
        std::cin >> v;
        std::string type = "int64_t";
        if (v >= std::numeric_limits<std::int8_t>::min() && v <= std::numeric_limits<std::int8_t>::max()) {
            type = "int8_t";
        } else if (v >= std::numeric_limits<std::int16_t>::min() && v <= std::numeric_limits<std::int16_t>::max()) {
            type = "int16_t";
        } else if (v >= std::numeric_limits<std::int32_t>::min() && v <= std::numeric_limits<std::int32_t>::max()) {
            type = "int32_t";
        }
        std::cout << v << " fits in " << type << '\n';
    }
    return 0;
}
`,
          hints: [
            "Test the narrowest type first; the first range that contains the value wins.",
            "The comparison long long vs int8_t is fine: the narrower operand is promoted, no cast needed.",
            "Anything that reaches the end of the chain fits in int64_t by the input's contract.",
          ],
          cases: [
            { stdin: "5\n100\n-129\n40000\n2147483648\n0\n", expected: "100 fits in int8_t\n-129 fits in int16_t\n40000 fits in int32_t\n2147483648 fits in int64_t\n0 fits in int8_t\n" },
            { stdin: "6\n-128\n127\n128\n-32768\n-32769\n2147483647\n", expected: "-128 fits in int8_t\n127 fits in int8_t\n128 fits in int16_t\n-32768 fits in int16_t\n-32769 fits in int32_t\n2147483647 fits in int32_t\n", hidden: true },
            { stdin: "3\n-2147483649\n9223372036854775807\n-9223372036854775808\n", expected: "-2147483649 fits in int64_t\n9223372036854775807 fits in int64_t\n-9223372036854775808 fits in int64_t\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nint x;\nstd::cout << x;\n```",
          options: ["`0` — locals start at zero", "Whatever was in that memory, reliably", "Nothing reliable: reading an uninitialised local is undefined behaviour", "A compile error"],
          answer: 2,
          explanation: "An automatic local of a fundamental type has an indeterminate value and reading it is undefined behaviour — the optimiser may assume it never happens. Only globals and `static` locals are zero-initialised. It compiles; `-Wall` may or may not warn.",
        },
        {
          prompt: "What happens with `int x{3.5};`?",
          options: ["Compile error: narrowing conversion", "`x` is `3`", "`x` is `4`", "Undefined behaviour"],
          answer: 0,
          explanation: "List-initialisation rejects narrowing conversions, and `double` → `int` loses information. `int x = 3.5;` would silently store 3 — which is why braces are the recommended form.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::uint8_t b = 65;\nstd::cout << b;\n```",
          options: ["`65`", "`A`", "A compile error", "`'A'`"],
          answer: 1,
          explanation: "`std::uint8_t` is an alias for `unsigned char`, and the stream prints character types as characters. Use `static_cast<int>(b)` or `+b` to print the number.",
        },
        {
          prompt: "What is the type of `sizeof(int)` and of `v.size()` for a `std::vector`?",
          options: ["`int`", "`unsigned`", "`std::size_t` — an unsigned type, 8 bytes on this platform", "`long long`"],
          answer: 2,
          explanation: "Both are `std::size_t`, the unsigned type sized to index any object in memory. Mixing it with `int` in comparisons is the source of the signed/unsigned warnings in lesson 4.",
        },
        {
          prompt: "Which statement about `long` is correct?",
          options: ["It is 8 bytes on every platform", "It is 8 bytes on this platform and 4 on 64-bit Windows, so portable code says `long long` for 64 bits", "It is always the same size as `int`", "The standard fixes it at 32 bits"],
          answer: 1,
          explanation: "The standard only requires `long` ≥ 32 bits. The Linux x86-64 ABI makes it 8 bytes; Windows keeps it at 4. `long long` is guaranteed at least 64 bits everywhere.",
        },
        {
          prompt: "What is `std::numeric_limits<double>::min()`?",
          options: ["The most negative double", "The smallest positive normalised double; the most negative is `lowest()`", "`-1.79769e+308`", "Zero"],
          answer: 1,
          explanation: "For floating types `min()` is the smallest positive normal value (about 2.2 × 10⁻³⁰⁸). Use `lowest()` to start a maximum search; `min()` would make every negative number lose.",
        },
        {
          prompt: "Which declaration gives a definite zero for any fundamental type `T`?",
          options: ["`T x;`", "`T x{};`", "`T x();`", "`T x = NULL;`"],
          answer: 1,
          explanation: "Empty braces value-initialise: zero for every arithmetic type, `false` for `bool`, `nullptr` for pointers. `T x;` is indeterminate, `T x();` declares a *function* returning `T` — the \"most vexing parse\" — and `NULL` is a null pointer constant meant for pointers, not a general zero.",
        },
      ],
    },
    {
      slug: "integers-and-bits",
      file: "02-integers-and-bits.md",
      exercises: [
        {
          title: "Checked sum",
          prompt: `Read an integer \`n\`, then \`n\` integers that each fit in an \`int\`. Add them into an \`int\` accumulator one at a time, checking every addition with \`__builtin_add_overflow(sum, x, &next)\` (available on GCC and Clang). If the whole sum fits, print \`sum=<sum>\`. If adding the value at 0-based index \`i\` would overflow, print \`overflow at index <i> (wrapped value <w>)\` — \`w\` is the wrapped result the builtin stores — and stop.

The point is to detect overflow *without* committing it: a plain \`sum + x\` that overflows is undefined behaviour, and widening to \`long long\` is the other correct approach; here, use the builtin.

**Input:** \`n\`, then \`n\` integers.
**Output:** one line.

Example: input \`2 2147483647 1\` → \`overflow at index 1 (wrapped value -2147483648)\``,
          starter: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    int sum = 0;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        // TODO: int next; if (__builtin_add_overflow(sum, x, &next)) { report and return }
        sum += x;
    }
    std::cout << "sum=" << sum << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    int sum = 0;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        int next = 0;
        if (__builtin_add_overflow(sum, x, &next)) {
            std::cout << "overflow at index " << i << " (wrapped value " << next << ")\n";
            return 0;
        }
        sum = next;
    }
    std::cout << "sum=" << sum << '\n';
    return 0;
}
`,
          hints: [
            "__builtin_add_overflow returns true when the mathematical result does not fit the result variable's type.",
            "Keep the result in a separate int and assign it to sum only when the call returned false.",
            "After reporting the overflow, return 0 — the remaining input can be left unread.",
          ],
          cases: [
            { stdin: "3\n1 2 3\n", expected: "sum=6\n" },
            { stdin: "2\n2147483647 1\n", expected: "overflow at index 1 (wrapped value -2147483648)\n" },
            { stdin: "3\n-2147483648 -1 5\n", expected: "overflow at index 1 (wrapped value 2147483647)\n", hidden: true },
            { stdin: "4\n2000000000 -2000000000 2000000000 147483647\n", expected: "sum=2147483647\n", hidden: true },
            { stdin: "0\n", expected: "sum=0\n", hidden: true },
          ],
        },
        {
          title: "Eight-bit flag register",
          prompt: `Keep an eight-bit register in a \`std::uint8_t\`. The first line is its starting value (0–255), the second an integer \`n\`, then \`n\` operations, one per line: \`set i\`, \`clear i\`, \`toggle i\` or \`test i\`, with \`0 <= i <= 7\`. Apply each with a mask (\`1u << i\`); for every \`test\` print \`bit <i> = 0\` or \`bit <i> = 1\`. After the last operation print \`value=<decimal> bits=<8 binary digits> count=<number of set bits>\` — use \`std::format("{:08b}", reg)\` for the binary field and \`std::popcount\` from \`<bit>\` for the count.

**Input:** the start value, \`n\`, then \`n\` operations.
**Output:** one line per \`test\`, then the summary line.

\`\`\`text
0
4
set 0
set 3
test 3
toggle 0
\`\`\`
→
\`\`\`text
bit 3 = 1
value=8 bits=00001000 count=1
\`\`\``,
          starter: String.raw`#include <bit>
#include <cstdint>
#include <format>
#include <iostream>
#include <string>

int main() {
    int start;
    int n;
    std::cin >> start >> n;
    std::uint8_t reg = static_cast<std::uint8_t>(start);
    for (int k = 0; k < n; ++k) {
        std::string op;
        int i;
        std::cin >> op >> i;
        std::uint8_t mask = static_cast<std::uint8_t>(1u << i);
        // TODO: set, clear, toggle and test using mask
    }
    // TODO: print value=, bits= ({:08b}) and count= (std::popcount)
    std::cout << std::format("value={}\n", reg);
    return 0;
}
`,
          solution: String.raw`#include <bit>
#include <cstdint>
#include <format>
#include <iostream>
#include <string>

int main() {
    int start;
    int n;
    std::cin >> start >> n;
    std::uint8_t reg = static_cast<std::uint8_t>(start);
    for (int k = 0; k < n; ++k) {
        std::string op;
        int i;
        std::cin >> op >> i;
        std::uint8_t mask = static_cast<std::uint8_t>(1u << i);
        // Every bitwise expression below is computed in int (promotion) and narrowed back on purpose.
        if (op == "set") {
            reg = static_cast<std::uint8_t>(reg | mask);
        } else if (op == "clear") {
            reg = static_cast<std::uint8_t>(reg & ~mask);
        } else if (op == "toggle") {
            reg = static_cast<std::uint8_t>(reg ^ mask);
        } else if (op == "test") {
            std::cout << "bit " << i << " = " << ((reg >> i) & 1u) << '\n';
        }
    }
    std::cout << std::format("value={} bits={:08b} count={}\n", reg, reg, std::popcount(reg));
    return 0;
}
`,
          hints: [
            "set is |=, clear is &= ~mask, toggle is ^=; test is (reg >> i) & 1u.",
            "reg | mask is an int after promotion; assign it back through static_cast<std::uint8_t> so the intent is visible.",
            "std::format prints a std::uint8_t as a number, and {:08b} zero-pads the binary form to eight digits.",
          ],
          cases: [
            { stdin: "0\n4\nset 0\nset 3\ntest 3\ntoggle 0\n", expected: "bit 3 = 1\nvalue=8 bits=00001000 count=1\n" },
            { stdin: "5\n2\ntest 0\ntest 1\n", expected: "bit 0 = 1\nbit 1 = 0\nvalue=5 bits=00000101 count=2\n" },
            { stdin: "255\n3\nclear 7\ntest 7\ntest 0\n", expected: "bit 7 = 0\nbit 0 = 1\nvalue=127 bits=01111111 count=7\n", hidden: true },
            { stdin: "170\n2\ntoggle 0\ntoggle 1\n", expected: "value=169 bits=10101001 count=4\n", hidden: true },
            { stdin: "0\n0\n", expected: "value=0 bits=00000000 count=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::cout << -7 / 2 << ' ' << -7 % 2;` print?",
          options: ["`-4 1`", "`-3 -1`", "`-3 1`", "`-4 -1`"],
          answer: 1,
          explanation: "Integer division truncates toward zero, so `-7 / 2` is `-3`, and the remainder takes the dividend's sign so that `(a / b) * b + a % b == a`: `-3 * 2 + (-1) == -7`. Floor division (`-4 1`) is what Python does, not C++.",
        },
        {
          prompt: "`int big = std::numeric_limits<int>::max(); big + 1` …",
          options: ["Wraps to `-2147483648`", "Is undefined behaviour — the optimiser may assume it never happens", "Throws `std::overflow_error`", "Saturates at `2147483647`"],
          answer: 1,
          explanation: "Signed overflow is undefined. The hardware would wrap and a debug build often shows that, but the compiler is entitled to fold `big + 1 > big` to `true` and delete checks written after the fact. Detect overflow before it happens.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nunsigned u = 0;\nstd::cout << u - 1;\n```",
          options: ["`-1`", "`4294967295`", "Undefined behaviour", "A compile error"],
          answer: 1,
          explanation: "Unsigned arithmetic is defined modulo 2³², so `0 - 1` wraps to the largest `unsigned`. Well-defined, and the reason `v.size() - 1` on an empty vector is a huge number rather than `-1`.",
        },
        {
          prompt: "What are the type and value of `s`?\n\n```cpp\nunsigned char a = 200, b = 100;\nauto s = a + b;\n```",
          options: ["`unsigned char`, 44", "`int`, 300", "`unsigned int`, 300", "A compile error"],
          answer: 1,
          explanation: "Both operands are promoted to `int` before the addition, so nothing wraps: `s` is an `int` holding 300. Assigning the result *back* to an `unsigned char` would narrow it to 44.",
        },
        {
          prompt: "In C++20, with `int` operands, what are `1 << 31` and `1 << 32`?",
          options: ["Both undefined behaviour", "`-2147483648` and `0`", "`-2147483648` (defined since C++20) and undefined behaviour (shift by the type's width)", "Both compile errors"],
          answer: 2,
          explanation: "C++20 defines left shift of a signed value modulo 2ⁿ, so `1 << 31` is `INT_MIN`. A shift count that is negative or ≥ the width remains undefined, whatever type you assign the result to — write `1LL << 32`.",
        },
        {
          prompt: "What are `std::popcount(0b1011u)` and `std::bit_width(0b1011u)`?",
          options: ["3 and 4", "4 and 3", "3 and 3", "4 and 4"],
          answer: 0,
          explanation: "`popcount` counts set bits: three. `bit_width` is the number of bits needed to represent the value — the position of the highest set bit plus one: four.",
        },
        {
          prompt: "How does the compiler parse `x & 1 == 0`?",
          options: ["`(x & 1) == 0`", "`x & (1 == 0)` — always 0, because `==` binds tighter than `&`", "A compile error", "`x && (1 == 0)`"],
          answer: 1,
          explanation: "The comparison operators have higher precedence than the bitwise `&`, `^` and `|`, a C inheritance everyone regrets. Always parenthesise the mask test: `(x & 1) == 0`.",
        },
      ],
    },
    {
      slug: "floating-point",
      file: "03-floating-point.md",
      exercises: [
        {
          title: "Statistics to two decimals",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` real numbers. Print four lines — \`sum=\`, \`mean=\`, \`min=\` and \`max=\` — each value with exactly two decimals, using \`std::fixed << std::setprecision(2)\` from \`<iomanip>\` (or \`std::format("{:.2f}", x)\`).

Accumulate in a \`double\`; start the minimum from \`std::numeric_limits<double>::max()\` and the maximum from \`lowest()\`.

**Input:** \`n\`, then \`n\` numbers (they may be written as \`3\`, \`4.2\` or \`1e6\`).
**Output:** four lines.

Example: input \`4 1.5 2.5 3 4.2\` →
\`\`\`text
sum=11.20
mean=2.80
min=1.50
max=4.20
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <limits>

int main() {
    int n;
    std::cin >> n;
    double sum = 0.0;
    double lo = std::numeric_limits<double>::max();
    double hi = std::numeric_limits<double>::lowest();
    for (int i = 0; i < n; ++i) {
        double x;
        std::cin >> x;
        // TODO: accumulate sum, lo and hi
    }
    // TODO: print sum, mean, min and max with exactly two decimals
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <limits>

int main() {
    int n;
    std::cin >> n;
    double sum = 0.0;
    double lo = std::numeric_limits<double>::max();
    double hi = std::numeric_limits<double>::lowest();
    for (int i = 0; i < n; ++i) {
        double x;
        std::cin >> x;
        sum += x;
        if (x < lo) lo = x;
        if (x > hi) hi = x;
    }
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "sum=" << sum << '\n'
              << "mean=" << sum / n << '\n'
              << "min=" << lo << '\n'
              << "max=" << hi << '\n';
    return 0;
}
`,
          hints: [
            "std::fixed and std::setprecision are sticky: set them once before the four prints.",
            "sum / n is floating division because sum is a double; no cast is needed.",
            "Without std::fixed, setprecision(2) would mean two significant digits and 1e6 would print in scientific notation.",
          ],
          cases: [
            { stdin: "4\n1.5 2.5 3 4.2\n", expected: "sum=11.20\nmean=2.80\nmin=1.50\nmax=4.20\n" },
            { stdin: "3\n10 20 33\n", expected: "sum=63.00\nmean=21.00\nmin=10.00\nmax=33.00\n" },
            { stdin: "1\n-7.333\n", expected: "sum=-7.33\nmean=-7.33\nmin=-7.33\nmax=-7.33\n", hidden: true },
            { stdin: "3\n0.1 0.2 0.3\n", expected: "sum=0.60\nmean=0.20\nmin=0.10\nmax=0.30\n", hidden: true },
            { stdin: "2\n1e6 2e6\n", expected: "sum=3000000.00\nmean=1500000.00\nmin=1000000.00\nmax=2000000.00\n", hidden: true },
          ],
        },
        {
          title: "Near enough",
          prompt: `Write the tolerance comparison from the lesson. The first line holds two tolerances, \`rel\` and \`abs\`; the second an integer \`n\`; then \`n\` lines each with two numbers \`a\` and \`b\`. Two numbers are *equal* when \`|a - b| <= max(rel * max(|a|, |b|), abs)\`. For the \`i\`-th pair (1-based) print \`<i>: equal\` or \`<i>: different\`. Use \`std::fabs\` from \`<cmath>\` and \`std::max\` from \`<algorithm>\`; never compare the doubles with \`==\`.

**Input:** \`rel abs\`, then \`n\`, then \`n\` pairs.
**Output:** \`n\` lines.

\`\`\`text
1e-9 1e-12
3
0.30000000000000004 0.3
1000000000000001 1000000000000000
100 100.5
\`\`\`
→
\`\`\`text
1: equal
2: equal
3: different
\`\`\`
The second pair differs by 1, which is within one part in 10⁹ of 10¹⁵ — a relative tolerance scales with the magnitude.`,
          starter: String.raw`#include <algorithm>
#include <cmath>
#include <iostream>

int main() {
    double relTol;
    double absTol;
    int n;
    std::cin >> relTol >> absTol >> n;
    for (int i = 1; i <= n; ++i) {
        double a;
        double b;
        std::cin >> a >> b;
        bool equal = false;
        // TODO: |a - b| <= max(relTol * max(|a|, |b|), absTol)
        std::cout << i << ": " << (equal ? "equal" : "different") << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cmath>
#include <iostream>

int main() {
    double relTol;
    double absTol;
    int n;
    std::cin >> relTol >> absTol >> n;
    for (int i = 1; i <= n; ++i) {
        double a;
        double b;
        std::cin >> a >> b;
        double scale = std::max(std::fabs(a), std::fabs(b));
        bool equal = std::fabs(a - b) <= std::max(relTol * scale, absTol);
        std::cout << i << ": " << (equal ? "equal" : "different") << '\n';
    }
    return 0;
}
`,
          hints: [
            "Compute the scale first: the larger magnitude of the two values.",
            "The relative term is relTol * scale; take the larger of that and absTol as the allowed difference.",
            "With rel = 0 the test is a pure absolute tolerance; with abs = 0 two values near zero can only be equal if identical.",
          ],
          cases: [
            { stdin: "1e-9 1e-12\n3\n0.30000000000000004 0.3\n1000000000000001 1000000000000000\n100 100.5\n", expected: "1: equal\n2: equal\n3: different\n" },
            { stdin: "0 1e-12\n2\n1000000000000001 1000000000000000\n0.30000000000000004 0.3\n", expected: "1: different\n2: equal\n", hidden: true },
            { stdin: "1e-9 0\n2\n0 0\n0 1e-15\n", expected: "1: equal\n2: different\n", hidden: true },
            { stdin: "0.01 0\n2\n100 100.5\n-100 -101.5\n", expected: "1: equal\n2: different\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::cout << (0.1 + 0.2 == 0.3);` print?",
          options: ["`1`", "`0`", "Undefined behaviour", "A compile error"],
          answer: 1,
          explanation: "Neither 0.1 nor 0.2 nor 0.3 is exactly representable; the rounded sum is 0.30000000000000004 and the literal 0.3 rounds to 0.29999999999999999. Compare with a tolerance, or keep such values as integers.",
        },
        {
          prompt: "What does `std::cout << 1234567.0;` print with the default stream settings?",
          options: ["`1234567`", "`1.23457e+06`", "`1234567.0`", "`1234567.000000`"],
          answer: 1,
          explanation: "The default is six significant digits in general format, which switches to scientific notation once the exponent is at least 6. `std::fixed` (or `std::format(\"{:.0f}\")`) prints `1234567`.",
        },
        {
          prompt: "What does `std::cout << std::setprecision(2) << 3.14159;` print?",
          options: ["`3.14`", "`3.1`", "`3.14159`", "`3`"],
          answer: 1,
          explanation: "Without `std::fixed`, the precision is the number of *significant* digits, so two of them give `3.1`. Add `std::fixed` to make it two decimals: `3.14`.",
        },
        {
          prompt: "What are `std::round(-2.5)` and `static_cast<int>(-2.5)`?",
          options: ["`-3` and `-2`", "`-2` and `-2`", "`-3` and `-3`", "`-2` and `-3`"],
          answer: 0,
          explanation: "`std::round` rounds halves away from zero, giving `-3.0`. A cast truncates toward zero, giving `-2`. `std::floor(-2.5)` would be `-3` and `std::ceil(-2.5)` `-2`.",
        },
        {
          prompt: "Which expression is true exactly when `x` is NaN?",
          options: ["`x == NAN`", "`x != x`", "`x == std::numeric_limits<double>::quiet_NaN()`", "`std::isinf(x)`"],
          answer: 1,
          explanation: "NaN compares unequal to everything, including itself, so `x != x` is the classic test and `std::isnan(x)` the readable one. Any `==` against a NaN is false, which is why the first and third options never succeed.",
        },
        {
          prompt: "Which type should hold an amount of money?",
          options: ["`double`", "`float`", "`long long` holding cents (or the smallest unit)", "`long double`"],
          answer: 2,
          explanation: "Money is exact by nature and decimal by convention; a binary floating type cannot hold 0.10 exactly, and totals drift. Integer cents are exact, compare with `==`, and are formatted from `cents / 100` and `cents % 100`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nfloat f = 16777216.0f;\nstd::cout << (f + 1.0f == f);\n```",
          options: ["`0`", "`1` — 16777217 is not representable in 24 bits of precision, so the 1 is absorbed", "Undefined behaviour", "A compile error"],
          answer: 1,
          explanation: "A `float` has 24 bits of precision, so above 2²⁴ = 16 777 216 consecutive floats are two apart. `16777217.0f` rounds back to 16 777 216 and the comparison is true. `double` has the same problem above 2⁵³.",
        },
      ],
    },
    {
      slug: "conversions-and-casts",
      file: "04-conversions-and-casts.md",
      exercises: [
        {
          title: "Caesar shift in char arithmetic",
          prompt: `Read an integer \`k\` — any sign, any size — then one line of text. Shift every letter \`k\` places along the alphabet, wrapping (\`z\` + 1 is \`a\`) and keeping the case; leave every other character unchanged. Print the shifted line.

Do the arithmetic in \`int\` (\`c - 'a'\` gives the letter's index) and narrow back to \`char\` with \`static_cast<char>\`, never a C-style cast. Normalise \`k\` to 0…25 first with the floor-modulo idiom \`((k % 26) + 26) % 26\`. Read \`k\` with \`>>\`, then \`std::cin.ignore();\` before \`std::getline\` — the pattern from Module 1.

**Input:** \`k\`, then one line.
**Output:** the shifted line.

Example: input \`3\` / \`Hello, World!\` → \`Khoor, Zruog!\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    long long k;
    std::cin >> k;
    std::cin.ignore();
    std::string line;
    std::getline(std::cin, line);
    int shift = static_cast<int>(((k % 26) + 26) % 26);
    for (char& c : line) {
        // TODO: shift lower-case and upper-case letters by shift, leave the rest alone
    }
    std::cout << line << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    long long k;
    std::cin >> k;
    std::cin.ignore();
    std::string line;
    std::getline(std::cin, line);
    int shift = static_cast<int>(((k % 26) + 26) % 26);
    for (char& c : line) {
        if (c >= 'a' && c <= 'z') {
            c = static_cast<char>('a' + (c - 'a' + shift) % 26);
        } else if (c >= 'A' && c <= 'Z') {
            c = static_cast<char>('A' + (c - 'A' + shift) % 26);
        }
    }
    std::cout << line << '\n';
    return 0;
}
`,
          hints: [
            "c - 'a' is an int from 0 to 25; add the shift, take % 26, add 'a' back.",
            "The sum 'a' + index is an int; assigning it to a char is a narrowing you should write as static_cast<char>(...).",
            "char& c in the range-for lets the loop modify the string in place.",
          ],
          cases: [
            { stdin: "3\nHello, World!\n", expected: "Khoor, Zruog!\n" },
            { stdin: "-3\nKhoor, Zruog!\n", expected: "Hello, World!\n" },
            { stdin: "29\nxyz ABC\n", expected: "abc DEF\n", hidden: true },
            { stdin: "0\nunchanged 123\n", expected: "unchanged 123\n", hidden: true },
            { stdin: "-27\nb\n", expected: "a\n", hidden: true },
          ],
        },
        {
          title: "Compare across the sign divide",
          prompt: `Read an integer \`n\`, then \`n\` lines each holding an \`int\` \`a\` (possibly negative) and an \`unsigned\` \`b\` (possibly above \`2147483647\`). For each pair print \`<a> vs <b>: naive <r1>, correct <r2>\`, where each result is \`less\`, \`equal\` or \`greater\`.

The *naive* result is what the built-in \`<\` does — it converts \`a\` to \`unsigned\` first, so compute it with \`static_cast<unsigned>(a)\` against \`b\`. The *correct* result compares the mathematical values with \`std::cmp_less\` and \`std::cmp_equal\` from \`<utility>\` (C++20).

**Input:** \`n\`, then \`n\` pairs.
**Output:** \`n\` lines.

Example: input \`2\` / \`-1 1\` / \`5 5\` →
\`\`\`text
-1 vs 1: naive greater, correct less
5 vs 5: naive equal, correct equal
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <utility>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int a;
        unsigned b;
        std::cin >> a >> b;
        std::string naive = "equal";    // TODO: compare static_cast<unsigned>(a) with b
        std::string correct = "equal";  // TODO: std::cmp_less / std::cmp_equal
        std::cout << a << " vs " << b << ": naive " << naive << ", correct " << correct << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <utility>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int a;
        unsigned b;
        std::cin >> a >> b;
        // What the usual arithmetic conversions do to a < b: the int becomes unsigned first.
        unsigned converted = static_cast<unsigned>(a);
        std::string naive = converted < b ? "less" : converted == b ? "equal" : "greater";
        std::string correct = std::cmp_less(a, b) ? "less" : std::cmp_equal(a, b) ? "equal" : "greater";
        std::cout << a << " vs " << b << ": naive " << naive << ", correct " << correct << '\n';
    }
    return 0;
}
`,
          hints: [
            "static_cast<unsigned>(-1) is 4294967295, which is why the naive answer for -1 vs 1 is greater.",
            "std::cmp_less(a, b) is true when a is mathematically smaller, whatever the signedness.",
            "Three-way: test less, then equal, else greater.",
          ],
          cases: [
            { stdin: "3\n-1 1\n5 5\n7 3\n", expected: "-1 vs 1: naive greater, correct less\n5 vs 5: naive equal, correct equal\n7 vs 3: naive greater, correct greater\n" },
            { stdin: "2\n-2147483648 2147483648\n-1 4294967295\n", expected: "-2147483648 vs 2147483648: naive equal, correct less\n-1 vs 4294967295: naive equal, correct less\n", hidden: true },
            { stdin: "2\n0 0\n-5 0\n", expected: "0 vs 0: naive equal, correct equal\n-5 vs 0: naive greater, correct less\n", hidden: true },
            { stdin: "1\n100 99\n", expected: "100 vs 99: naive greater, correct greater\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\nint x = 3.99;\nint y{3.99};\n```",
          options: ["`x` is 3; the second line is a compile error", "Both are 3", "Both are 4", "Both lines are compile errors"],
          answer: 0,
          explanation: "Copy-initialisation performs the narrowing conversion silently (truncating to 3, with no warning under `-Wall`). List-initialisation rejects narrowing, so `int y{3.99}` does not compile.",
        },
        {
          prompt: "What is the value of `u` after `unsigned u = -1;`?",
          options: ["A compile error", "`4294967295`", "Undefined behaviour", "`-1`"],
          answer: 1,
          explanation: "Signed → unsigned conversion is always defined and modular: −1 mod 2³² is 4 294 967 295. Only the braced form `unsigned u{-1}` is refused.",
        },
        {
          prompt: "`std::vector<int> v;` is empty and `int i = -1;`. What does `if (i < v.size())` do?",
          options: ["Enters the branch: −1 is less than 0", "Skips the branch: `i` converts to `std::size_t` 18446744073709551615, which is not less than 0", "A compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "The usual arithmetic conversions turn the signed operand unsigned, so the bounds check passes a negative index through. `-Wall` warns (`-Wsign-compare`); use `std::cmp_less(i, v.size())` or a `std::size_t` index.",
        },
        {
          prompt: "What is `static_cast<int>(1e10)`?",
          options: ["`1410065408` — the low 32 bits", "`2147483647` — saturated", "Undefined behaviour: the truncated value does not fit an `int`", "A compile error"],
          answer: 2,
          explanation: "Floating → integer conversion is undefined when the truncated value is out of range; it is the one narrowing in the table that is not merely lossy. Range-check first, or convert to `long long`.",
        },
        {
          prompt: "Which cast converts a `double d` to an `int`?",
          options: ["`static_cast<int>(d)`", "`reinterpret_cast<int>(d)`", "`const_cast<int>(d)`", "`dynamic_cast<int>(d)`"],
          answer: 0,
          explanation: "`static_cast` performs value conversions. `reinterpret_cast` cannot take a `double` at all (it works on pointers and integers), `const_cast` only changes constness, and `dynamic_cast` is for polymorphic class pointers and references.",
        },
        {
          prompt: "`(char*)text.c_str()` compiles. Which named cast did the C-style cast silently perform?",
          options: ["`static_cast`", "`const_cast` — it removed `const`, which is exactly the kind of thing a reader should have been told", "`reinterpret_cast`", "None; it is a compile error"],
          answer: 1,
          explanation: "`c_str()` returns `const char*`; a C-style cast tries the named casts in turn and used `const_cast`. Written as `const_cast<char*>(...)` the intent is visible and searchable; the C-style form hides it and would also happily reinterpret an unrelated pointer.",
        },
        {
          prompt: "What does `std::cmp_less(-1, 1u)` return?",
          options: ["`false`, like `-1 < 1u`", "`true` — it compares the mathematical values", "A compile error", "Unspecified"],
          answer: 1,
          explanation: "The `<utility>` comparison functions (C++20) are defined on the values, not on the converted bits, so `cmp_less(-1, 1u)` is `true` while the built-in `-1 < 1u` converts −1 to 4294967295 and is `false`.",
        },
      ],
    },
    {
      slug: "const-constexpr-and-auto",
      file: "05-const-constexpr-and-auto.md",
      exercises: [
        {
          title: "constexpr power and primes",
          prompt: `Implement two \`constexpr\` functions: \`long long power(long long base, int exponent)\` (\`exponent >= 0\`; the result fits in a \`long long\`) and \`bool isPrime(long long n)\` (trial division while \`d * d <= n\`; \`n >= 0\`). Then uncomment the two \`static_assert\` lines in the starter — they only compile if the functions really are usable at compile time — and answer queries: read \`q\`, then \`q\` lines that are either \`pow <base> <exponent>\` (print the value) or \`prime <n>\` (print \`yes\` or \`no\`).

**Input:** \`q\`, then \`q\` queries.
**Output:** \`q\` lines.

Example: input \`3\` / \`pow 2 10\` / \`prime 97\` / \`prime 1\` →
\`\`\`text
1024
yes
no
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

constexpr long long power(long long base, int exponent) {
    // TODO: multiply base by itself exponent times (a loop is fine in a constexpr function)
    return base * 0 + exponent * 0;
}

constexpr bool isPrime(long long n) {
    // TODO: n < 2 is not prime; otherwise test divisors d while d * d <= n
    return n < 0;
}

// Uncomment once the functions work: the compiler evaluates them while compiling.
// static_assert(power(2, 10) == 1024);
// static_assert(isPrime(97) && !isPrime(91));

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "pow") {
            long long base;
            int exponent;
            std::cin >> base >> exponent;
            std::cout << power(base, exponent) << '\n';
        } else {
            long long n;
            std::cin >> n;
            std::cout << (isPrime(n) ? "yes" : "no") << '\n';
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

constexpr long long power(long long base, int exponent) {
    long long result = 1;
    for (int i = 0; i < exponent; ++i) result *= base;
    return result;
}

constexpr bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long d = 2; d * d <= n; ++d) {
        if (n % d == 0) return false;
    }
    return true;
}

// Evaluated by the compiler: a wrong implementation fails to build.
static_assert(power(2, 10) == 1024);
static_assert(isPrime(97) && !isPrime(91));

int main() {
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "pow") {
            long long base;
            int exponent;
            std::cin >> base >> exponent;
            std::cout << power(base, exponent) << '\n';
        } else {
            long long n;
            std::cin >> n;
            std::cout << (isPrime(n) ? "yes" : "no") << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "A constexpr function may contain loops and local variables in C++20; write it like any other function.",
            "Trial division: for d from 2 while d * d <= n, if n % d == 0 the number is composite.",
            "The same function runs at compile time inside static_assert and at run time on the query values — no second implementation.",
          ],
          cases: [
            { stdin: "4\npow 2 10\nprime 97\nprime 1\npow 3 0\n", expected: "1024\nyes\nno\n1\n" },
            { stdin: "3\npow 2 62\nprime 1000000007\nprime 1000000008\n", expected: "4611686018427387904\nyes\nno\n", hidden: true },
            { stdin: "4\nprime 2\nprime 0\npow -2 3\npow 7 1\n", expected: "yes\nno\n-8\n7\n", hidden: true },
            { stdin: "2\nprime 999999937\nprime 4\n", expected: "yes\nno\n", hidden: true },
          ],
        },
        {
          title: "Deduced accumulators",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` integers in \`int\` range. Print \`sum=<exact sum>\` (it may exceed an \`int\`), \`int_mean=<sum / n in integer division>\`, \`mean=<sum / n with two decimals>\` and \`max=<largest value>\`.

Declare the accumulators with \`auto\` and let the initialiser fix the type: \`auto sum = 0LL;\` (a \`long long\` — \`auto sum = 0;\` would be an \`int\` and overflow) and \`auto best = std::numeric_limits<int>::min();\`. Make the derived values \`const auto\`, and cast to \`double\` for the real mean — \`sum / n\` with two integers is integer division no matter what \`auto\` deduces.

**Input:** \`n\`, then \`n\` integers.
**Output:** four lines.

Example: input \`4 1 2 3 4\` →
\`\`\`text
sum=10
int_mean=2
mean=2.50
max=4
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>
#include <limits>

int main() {
    int n;
    std::cin >> n;
    auto sum = 0LL;
    auto best = std::numeric_limits<int>::min();
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        // TODO: accumulate sum and best
    }
    // TODO: const auto intMean = ..., const auto mean = ... (cast to double first)
    std::cout << "sum=" << sum << '\n';
    std::cout << "max=" << best << '\n';
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>
#include <limits>

int main() {
    int n;
    std::cin >> n;
    auto sum = 0LL;                                  // long long: the LL suffix decides
    auto best = std::numeric_limits<int>::min();     // int
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        sum += x;
        if (x > best) best = x;
    }
    const auto intMean = sum / n;                          // long long, truncated toward zero
    const auto mean = static_cast<double>(sum) / n;        // double
    std::cout << "sum=" << sum << '\n'
              << "int_mean=" << intMean << '\n'
              << std::format("mean={:.2f}\n", mean)
              << "max=" << best << '\n';
    return 0;
}
`,
          hints: [
            "sum += x works because x is promoted to long long for the addition.",
            "static_cast<double>(sum) / n converts one operand first, so the division is floating.",
            "std::format(\"{:.2f}\", mean) or std::fixed << std::setprecision(2) — either gives exactly two decimals.",
          ],
          cases: [
            { stdin: "4\n1 2 3 4\n", expected: "sum=10\nint_mean=2\nmean=2.50\nmax=4\n" },
            { stdin: "3\n2000000000 2000000000 2000000000\n", expected: "sum=6000000000\nint_mean=2000000000\nmean=2000000000.00\nmax=2000000000\n" },
            { stdin: "2\n-7 4\n", expected: "sum=-3\nint_mean=-1\nmean=-1.50\nmax=4\n", hidden: true },
            { stdin: "1\n-2147483648\n", expected: "sum=-2147483648\nint_mean=-2147483648\nmean=-2147483648.00\nmax=-2147483648\n", hidden: true },
            { stdin: "3\n-2147483648 -2147483648 -2147483648\n", expected: "sum=-6442450944\nint_mean=-2147483648\nmean=-2147483648.00\nmax=-2147483648\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\nconst int cx = 10;\nauto a = cx;\na = 5;\n```",
          options: ["Compile error: `a` is `const int`", "It compiles: `auto` drops top-level `const`, so `a` is a mutable `int` copy", "Undefined behaviour", "`cx` becomes 5"],
          answer: 1,
          explanation: "`auto x = expr` deduces like a by-value template parameter: references and top-level `const` are dropped and `a` is a fresh `int`. To keep the constness write `const auto a = cx;` or `auto& a = cx;`.",
        },
        {
          prompt: "What happens here?\n\n```cpp\nauto s = \"hello\";\nstd::cout << s.size();\n```",
          options: ["Prints `5`", "Compile error: `s` is a `const char*`, which has no `size()`", "Prints `6`", "Undefined behaviour"],
          answer: 1,
          explanation: "A string literal is a `const char` array and `auto` deduces the decayed pointer type. Write `std::string s = \"hello\";` or `auto s = \"hello\"s;` with `using namespace std::string_literals;`.",
        },
        {
          prompt: "`int readInt();` reads a number at run time. What does `constexpr int n = readInt();` do?",
          options: ["Compiles; `n` is set when the program runs", "Compile error: the initialiser is not a constant expression", "`n` is 0", "Undefined behaviour"],
          answer: 1,
          explanation: "`constexpr` demands a compile-time value. A run-time value can be `const` — `const int n = readInt();` is fine — but never `constexpr`.",
        },
        {
          prompt: "After `for (auto x : v) x *= 2;`, what has changed in `v`?",
          options: ["Every element is doubled", "Nothing: `auto x` copies each element", "A compile error", "Only the first element"],
          answer: 1,
          explanation: "`auto` without `&` copies. Write `for (auto& x : v)` to modify in place and `for (const auto& x : v)` to read without copying.",
        },
        {
          prompt: "A `constexpr` function is called with an argument read from `std::cin`. What happens?",
          options: ["A compile error", "It runs at run time, like any other function", "It returns 0", "Its result is cached across runs"],
          answer: 1,
          explanation: "`constexpr` means the function *may* be evaluated at compile time when its arguments are constants. With run-time arguments it is an ordinary call — which is exactly why one implementation serves both `static_assert` and the input loop.",
        },
        {
          prompt: "Which of these compile?\n\n```cpp\nauto& r1 = 5;\nconst auto& r2 = 5;\n```",
          options: ["Neither", "Only `r2`: a `const` reference binds to a temporary and extends its lifetime", "Both", "Only `r1`"],
          answer: 1,
          explanation: "A non-const lvalue reference needs an lvalue; `5` is a temporary. A `const T&` may bind to a temporary, which then lives as long as the reference — the rule that makes `const T&` parameters accept literals.",
        },
        {
          prompt: "What is the type of `r` in `int x = 1; decltype((x)) r = x;`?",
          options: ["`int`", "`int&` — the parenthesised expression `x` is an lvalue", "`const int`", "A compile error"],
          answer: 1,
          explanation: "`decltype(x)` gives the declared type `int`; with the extra parentheses the operand is an *expression*, and for an lvalue expression `decltype` yields a reference. A subtle rule that mostly matters inside templates and `decltype(auto)`.",
        },
      ],
    },
    {
      slug: "enums-and-literals",
      file: "06-enums-and-literals.md",
      exercises: [
        {
          title: "Literal decoder",
          prompt: `Read an integer \`n\`, then \`n\` tokens, each a C++ integer literal with no suffix: decimal, hexadecimal (\`0x\` or \`0X\`), binary (\`0b\` or \`0B\`) or octal (a leading \`0\`), possibly containing \`'\` digit separators. Every value fits in a \`long long\`. Print \`<token> = <decimal value>\` for each.

Decode by hand: drop the separators, choose the base from the prefix, then accumulate \`value = value * base + digit\` where the digit comes from \`char\` arithmetic (\`c - '0'\`, \`c - 'a' + 10\`, \`c - 'A' + 10\`).

**Input:** \`n\`, then \`n\` tokens separated by whitespace.
**Output:** \`n\` lines.

Example: input \`4 0x1F 0b1010 017 1'000'000\` →
\`\`\`text
0x1F = 31
0b1010 = 10
017 = 15
1'000'000 = 1000000
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        std::string digits;
        for (char c : token) {
            if (c != '\'') digits += c;
        }
        int base = 10;
        std::size_t start = 0;
        // TODO: detect 0x / 0b / leading-zero octal and set base and start
        long long value = 0;
        for (std::size_t k = start; k < digits.size(); ++k) {
            // TODO: turn digits[k] into a digit value and accumulate
        }
        std::cout << token << " = " << value << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        std::string digits;
        for (char c : token) {
            if (c != '\'') digits += c;   // digit separators are ignored by the compiler too
        }
        int base = 10;
        std::size_t start = 0;
        if (digits.size() > 1 && digits[0] == '0') {
            char p = digits[1];
            if (p == 'x' || p == 'X') {
                base = 16;
                start = 2;
            } else if (p == 'b' || p == 'B') {
                base = 2;
                start = 2;
            } else {
                base = 8;   // a leading zero means octal: 017 is 15
                start = 1;
            }
        }
        long long value = 0;
        for (std::size_t k = start; k < digits.size(); ++k) {
            char c = digits[k];
            int digit = 0;
            if (c >= '0' && c <= '9') {
                digit = c - '0';
            } else if (c >= 'a' && c <= 'f') {
                digit = c - 'a' + 10;
            } else {
                digit = c - 'A' + 10;
            }
            value = value * base + digit;
        }
        std::cout << token << " = " << value << '\n';
    }
    return 0;
}
`,
          hints: [
            "Check for a prefix only when the cleaned token starts with 0 and has more than one character; a lone 0 is decimal zero.",
            "The second character decides: x/X is base 16 from index 2, b/B is base 2 from index 2, anything else is base 8 from index 1.",
            "value * base + digit in a long long never overflows for the inputs given; the hex digits above 9 come from c - 'a' + 10.",
          ],
          cases: [
            { stdin: "5\n0x1F\n0b1010\n017\n1'000'000\n0\n", expected: "0x1F = 31\n0b1010 = 10\n017 = 15\n1'000'000 = 1000000\n0 = 0\n" },
            { stdin: "3\n0xFF'FF\n0B1111'0000\n0777\n", expected: "0xFF'FF = 65535\n0B1111'0000 = 240\n0777 = 511\n", hidden: true },
            { stdin: "2\n9223372036854775807\n0x7FFF'FFFF'FFFF'FFFF\n", expected: "9223372036854775807 = 9223372036854775807\n0x7FFF'FFFF'FFFF'FFFF = 9223372036854775807\n", hidden: true },
            { stdin: "2\n0X1f\n42\n", expected: "0X1f = 31\n42 = 42\n", hidden: true },
          ],
        },
        {
          title: "A scoped weekday enum",
          prompt: `Define \`enum class Weekday : std::uint8_t { Mon = 1, Tue, Wed, Thu, Fri, Sat, Sun };\`. Read an integer \`n\`, then \`n\` integers. For each value from 1 to 7, convert it with \`static_cast<Weekday>\` and print \`<value> -> <Name> weekday\` or \`<value> -> <Name> weekend\` (\`Sat\` and \`Sun\` are the weekend); for any other value print \`<value> -> invalid\` — validate *before* casting, because the cast itself checks nothing.

Map the enumerator to its name with a \`switch\` on the enum (Module 3 covers \`switch\` in full; it is the standard way to give an enumerator a name). Compare enumerators with \`==\`, never through their integer values.

**Input:** \`n\`, then \`n\` integers.
**Output:** \`n\` lines.

Example: input \`3 1 6 9\` →
\`\`\`text
1 -> Mon weekday
6 -> Sat weekend
9 -> invalid
\`\`\``,
          starter: String.raw`#include <cstdint>
#include <iostream>
#include <string>

enum class Weekday : std::uint8_t { Mon = 1, Tue, Wed, Thu, Fri, Sat, Sun };

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int v;
        std::cin >> v;
        // TODO: reject values outside 1..7, then cast and name the day with a switch
        std::cout << v << " -> invalid\n";
    }
    return 0;
}
`,
          solution: String.raw`#include <cstdint>
#include <iostream>
#include <string>

enum class Weekday : std::uint8_t { Mon = 1, Tue, Wed, Thu, Fri, Sat, Sun };

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int v;
        std::cin >> v;
        if (v < 1 || v > 7) {
            std::cout << v << " -> invalid\n";   // static_cast<Weekday>(256) would silently become 0
            continue;
        }
        Weekday day = static_cast<Weekday>(v);
        std::string name;
        switch (day) {
            case Weekday::Mon: name = "Mon"; break;
            case Weekday::Tue: name = "Tue"; break;
            case Weekday::Wed: name = "Wed"; break;
            case Weekday::Thu: name = "Thu"; break;
            case Weekday::Fri: name = "Fri"; break;
            case Weekday::Sat: name = "Sat"; break;
            case Weekday::Sun: name = "Sun"; break;
        }
        bool weekend = day == Weekday::Sat || day == Weekday::Sun;
        std::cout << v << " -> " << name << (weekend ? " weekend" : " weekday") << '\n';
    }
    return 0;
}
`,
          hints: [
            "Test v < 1 || v > 7 first and print invalid; only then static_cast<Weekday>(v).",
            "A switch on a scoped enum uses qualified case labels: case Weekday::Mon.",
            "Weekend is day == Weekday::Sat || day == Weekday::Sun — no integer comparison needed.",
          ],
          cases: [
            { stdin: "4\n1\n6\n9\n3\n", expected: "1 -> Mon weekday\n6 -> Sat weekend\n9 -> invalid\n3 -> Wed weekday\n" },
            { stdin: "3\n7\n0\n-1\n", expected: "7 -> Sun weekend\n0 -> invalid\n-1 -> invalid\n", hidden: true },
            { stdin: "2\n5\n2\n", expected: "5 -> Fri weekday\n2 -> Tue weekday\n", hidden: true },
            { stdin: "2\n256\n257\n", expected: "256 -> invalid\n257 -> invalid\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::cout << 017;` print?",
          options: ["`17`", "`15`", "A compile error", "`7`"],
          answer: 1,
          explanation: "A leading zero makes an octal literal: 0·8 + 1·8 + 7 = 15. `08` would not compile, since 8 is not an octal digit. Zero-padded numbers copied from data are the classic way to meet this.",
        },
        {
          prompt: "What is the type of `x` in `auto x = 3000000000;` on this platform?",
          options: ["`int`, with the value wrapped", "`long` — the first of `int`, `long`, `long long` that holds the value", "`unsigned`", "A compile error"],
          answer: 1,
          explanation: "An unsuffixed decimal literal takes the narrowest of `int`, `long`, `long long` that fits. 3 000 000 000 exceeds `int`, so it is a `long` (8 bytes here). Add `LL` if you mean `long long` regardless of platform.",
        },
        {
          prompt: "What does `std::cout << '\\101';` print?",
          options: ["`\\101`", "`A`", "`101`", "A compile error"],
          answer: 1,
          explanation: "A backslash followed by up to three octal digits is an octal escape: 101₈ = 65 = `'A'`. The hexadecimal form `'\\x41'` is the same character.",
        },
        {
          prompt: "Given `enum Colour { Red, Green = 5, Blue };`, what is `int n = Blue;`?",
          options: ["`6`", "`2`", "A compile error", "`5`"],
          answer: 0,
          explanation: "Each enumerator without an initialiser is one more than the previous, so `Blue` is 6. An unscoped enum converts implicitly to `int`, so the initialisation compiles — the leak that `enum class` closes.",
        },
        {
          prompt: "Given `enum class Level { Low, High };`, what does `int n = Level::High;` do?",
          options: ["`n` is 1", "Compile error: a scoped enum has no implicit conversion to `int` — write `static_cast<int>(Level::High)`", "`n` is 0", "Undefined behaviour"],
          answer: 1,
          explanation: "Scoped enumerations convert in neither direction implicitly. That is the point: a `Level` cannot be added to a `Colour` by accident. The cast makes the conversion visible.",
        },
        {
          prompt: "What is `sizeof(Level)` for `enum class Level : std::uint8_t { Low, High };`?",
          options: ["1", "4", "8", "Unspecified"],
          answer: 0,
          explanation: "A fixed underlying type sets the enum's size and representation; `std::uint8_t` is one byte. Without the `: type`, a scoped enum defaults to `int` (4 bytes).",
        },
        {
          prompt: "What does `std::cout << R\"(a\\nb)\";` print?",
          options: ["`a`, a newline, `b`", "The four characters `a\\nb` — a raw string processes no escapes", "A compile error", "`ab`"],
          answer: 1,
          explanation: "Inside `R\"(...)\"` a backslash is just a backslash, which is why raw strings suit regular expressions and Windows paths. `\"a\\nb\"` without the `R` would print two lines.",
        },
      ],
    },
    {
      slug: "types-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Checked product",
          prompt: `Read an integer \`n\`, then \`n\` integers that each fit in a \`long long\`. Multiply them into a \`long long\` accumulator that starts at 1, checking every step with \`__builtin_mul_overflow(product, x, &next)\`. If everything fits print \`product=<value>\`; if multiplying by the factor at 0-based index \`i\` would overflow, print \`overflow at index <i>\` and stop. Widening cannot help here — the product of two 64-bit values needs 128 bits — so the checked builtin is the tool.

**Input:** \`n\`, then \`n\` integers.
**Output:** one line.

Example: input \`3 2 3 4\` → \`product=24\`; input \`2 3037000500 3037000500\` → \`overflow at index 1\``,
          starter: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    long long product = 1;
    for (int i = 0; i < n; ++i) {
        long long x;
        std::cin >> x;
        // TODO: long long next; check __builtin_mul_overflow(product, x, &next) before accepting it
        product *= x;
    }
    std::cout << "product=" << product << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    long long product = 1;
    for (int i = 0; i < n; ++i) {
        long long x;
        std::cin >> x;
        long long next = 0;
        if (__builtin_mul_overflow(product, x, &next)) {
            std::cout << "overflow at index " << i << '\n';
            return 0;
        }
        product = next;
    }
    std::cout << "product=" << product << '\n';
    return 0;
}
`,
          hints: [
            "The builtin returns true when the mathematical product does not fit a long long.",
            "A zero factor makes every later product zero — no overflow can follow it.",
            "-1 times the most negative long long does not fit: that is an overflow too.",
          ],
          cases: [
            { stdin: "3\n2 3 4\n", expected: "product=24\n" },
            { stdin: "2\n3037000500 3037000500\n", expected: "overflow at index 1\n" },
            { stdin: "3\n-1 9223372036854775807 1\n", expected: "product=-9223372036854775807\n", hidden: true },
            { stdin: "4\n2 0 3037000500 3037000500\n", expected: "product=0\n", hidden: true },
            { stdin: "2\n-1 -9223372036854775808\n", expected: "overflow at index 1\n", hidden: true },
          ],
        },
        {
          title: "Invoice in cents",
          prompt: `Read an integer \`n\`, then \`n\` lines \`quantity unit_cents\`, then one line with an integer tax percentage. Compute the subtotal as the sum of \`quantity * unit_cents\`, the tax as \`subtotal * percent / 100\` rounded half up — in integers, \`(subtotal * percent + 50) / 100\` — and the total. Print \`subtotal=\`, \`tax=\` and \`total=\`, each as \`<dollars>.<two-digit cents>\` built from integers with \`std::format("{}.{:02}", cents / 100, cents % 100)\`.

No \`double\` anywhere: every amount is a \`long long\` number of cents, so the arithmetic is exact and the rounding rule is yours.

**Input:** \`n\`, \`n\` item lines, then the tax percentage.
**Output:** three lines.

Example: input \`2\` / \`3 199\` / \`1 1000\` / \`8\` →
\`\`\`text
subtotal=15.97
tax=1.28
total=17.25
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    long long subtotal = 0;
    for (int i = 0; i < n; ++i) {
        long long quantity;
        long long unitCents;
        std::cin >> quantity >> unitCents;
        // TODO: accumulate the subtotal in cents
    }
    long long percent;
    std::cin >> percent;
    // TODO: tax rounded half up, then total; print all three as dollars.cents
    std::cout << std::format("subtotal={}.{:02}\n", subtotal / 100, subtotal % 100);
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    long long subtotal = 0;
    for (int i = 0; i < n; ++i) {
        long long quantity;
        long long unitCents;
        std::cin >> quantity >> unitCents;
        subtotal += quantity * unitCents;
    }
    long long percent;
    std::cin >> percent;
    long long tax = (subtotal * percent + 50) / 100;   // half up: 12.5 cents becomes 13
    long long total = subtotal + tax;
    std::cout << std::format("subtotal={}.{:02}\n", subtotal / 100, subtotal % 100)
              << std::format("tax={}.{:02}\n", tax / 100, tax % 100)
              << std::format("total={}.{:02}\n", total / 100, total % 100);
    return 0;
}
`,
          hints: [
            "subtotal * percent is in hundredths of a cent; adding 50 before dividing by 100 rounds half up.",
            "{:02} pads the cents to two digits so 5 cents prints as .05.",
            "Every quantity is a long long, so a million items at 999 cents does not overflow.",
          ],
          cases: [
            { stdin: "2\n3 199\n1 1000\n8\n", expected: "subtotal=15.97\ntax=1.28\ntotal=17.25\n" },
            { stdin: "1\n3 333\n15\n", expected: "subtotal=9.99\ntax=1.50\ntotal=11.49\n" },
            { stdin: "1\n1 5\n0\n", expected: "subtotal=0.05\ntax=0.00\ntotal=0.05\n", hidden: true },
            { stdin: "3\n1000000 999\n1 1\n2 250\n20\n", expected: "subtotal=9990005.01\ntax=1998001.00\ntotal=11988006.01\n", hidden: true },
            { stdin: "1\n1 1250\n1\n", expected: "subtotal=12.50\ntax=0.13\ntotal=12.63\n", hidden: true },
          ],
        },
        {
          title: "What literal is that?",
          prompt: `Read an integer \`n\`, then \`n\` tokens. Classify each as a C++ literal and print \`<token>: <type> <value>\`:

- digits only → \`int\` if the value is at most \`2147483647\`, otherwise \`long\`;
- digits with a suffix \`u\` → \`unsigned\` if at most \`4294967295\`, otherwise \`unsigned long\`; \`l\` → \`long\`; \`ll\` → \`long long\`; \`ul\` → \`unsigned long\`; \`ull\` → \`unsigned long long\`;
- digits with a decimal point → \`double\`, or \`float\` with an \`f\` suffix, or \`long double\` with an \`L\` suffix — print the value with exactly three decimals;
- \`'x'\` (three characters) → \`char\` and the character's code;
- \`true\` / \`false\` → \`bool 1\` / \`bool 0\`;
- anything else → \`<token>: unknown\`.

Parse by hand: walk the token once, accumulating the integer part in an \`unsigned long long\` and the fraction in a \`double\` (\`fraction = fraction * 10 + digit\`, \`scale *= 10\`), then treat everything after the digits as the suffix. Every value fits the type named.

**Input:** \`n\`, then \`n\` tokens separated by whitespace.
**Output:** \`n\` lines.

Example: input \`4 42 42u 3.5 'A'\` →
\`\`\`text
42: int 42
42u: unsigned 42
3.5: double 3.500
'A': char 65
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <format>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string t;
        std::cin >> t;
        std::cout << t << ": ";
        if (t == "true" || t == "false") {
            std::cout << "bool " << (t == "true" ? 1 : 0) << '\n';
            continue;
        }
        if (t.size() == 3 && t[0] == '\'' && t[2] == '\'') {
            std::cout << "char " << static_cast<int>(t[1]) << '\n';
            continue;
        }
        unsigned long long whole = 0;
        double fraction = 0.0;
        double scale = 1.0;
        bool seenDot = false;
        bool anyDigit = false;
        std::size_t pos = 0;
        // TODO: consume digits and at most one '.', filling whole / fraction / scale
        std::string suffix;
        while (pos < t.size()) suffix += t[pos++];
        // TODO: unknown when no digit was read; floating types when seenDot; else the integer suffix table
        std::cout << "unknown\n";
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <format>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string t;
        std::cin >> t;
        std::cout << t << ": ";
        if (t == "true" || t == "false") {
            std::cout << "bool " << (t == "true" ? 1 : 0) << '\n';
            continue;
        }
        if (t.size() == 3 && t[0] == '\'' && t[2] == '\'') {
            std::cout << "char " << static_cast<int>(t[1]) << '\n';   // a char is a small integer
            continue;
        }
        unsigned long long whole = 0;
        double fraction = 0.0;
        double scale = 1.0;
        bool seenDot = false;
        bool anyDigit = false;
        std::size_t pos = 0;
        while (pos < t.size() && ((t[pos] >= '0' && t[pos] <= '9') || t[pos] == '.')) {
            char c = t[pos];
            if (c == '.') {
                if (seenDot) break;
                seenDot = true;
            } else if (seenDot) {
                fraction = fraction * 10 + (c - '0');
                scale *= 10;
            } else {
                whole = whole * 10 + static_cast<unsigned long long>(c - '0');
                anyDigit = true;
            }
            if (c != '.') anyDigit = true;
            ++pos;
        }
        std::string suffix;
        while (pos < t.size()) suffix += t[pos++];
        if (!anyDigit) {
            std::cout << "unknown\n";
            continue;
        }
        if (seenDot) {
            double value = static_cast<double>(whole) + fraction / scale;
            if (suffix.empty()) {
                std::cout << std::format("double {:.3f}\n", value);
            } else if (suffix == "f") {
                std::cout << std::format("float {:.3f}\n", static_cast<float>(value));
            } else if (suffix == "L") {
                std::cout << std::format("long double {:.3f}\n", static_cast<long double>(value));
            } else {
                std::cout << "unknown\n";
            }
            continue;
        }
        if (suffix.empty()) {
            std::cout << (whole <= 2147483647ULL ? "int " : "long ") << whole << '\n';
        } else if (suffix == "u") {
            std::cout << (whole <= 4294967295ULL ? "unsigned " : "unsigned long ") << whole << '\n';
        } else if (suffix == "l") {
            std::cout << "long " << whole << '\n';
        } else if (suffix == "ll") {
            std::cout << "long long " << whole << '\n';
        } else if (suffix == "ul") {
            std::cout << "unsigned long " << whole << '\n';
        } else if (suffix == "ull") {
            std::cout << "unsigned long long " << whole << '\n';
        } else {
            std::cout << "unknown\n";
        }
    }
    return 0;
}
`,
          hints: [
            "Handle the two fixed forms first (true/false and 'x'), then the digit scan.",
            "Anything left after the digits is the suffix; an empty suffix means int/long or double.",
            "The unsuffixed rule is the compiler's: int if it fits, otherwise long on this platform.",
          ],
          cases: [
            { stdin: "6\n42\n42u\n3.5\n2.5f\n'A'\ntrue\n", expected: "42: int 42\n42u: unsigned 42\n3.5: double 3.500\n2.5f: float 2.500\n'A': char 65\ntrue: bool 1\n" },
            { stdin: "4\n2147483648\n10ll\n0.125\n1.5L\n", expected: "2147483648: long 2147483648\n10ll: long long 10\n0.125: double 0.125\n1.5L: long double 1.500\n", hidden: true },
            { stdin: "3\n4294967296u\n7ul\nfalse\n", expected: "4294967296u: unsigned long 4294967296\n7ul: unsigned long 7\nfalse: bool 0\n", hidden: true },
            { stdin: "3\n0\nhello\n18446744073709551615ull\n", expected: "0: int 0\nhello: unknown\n18446744073709551615ull: unsigned long long 18446744073709551615\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "On this platform, what does `char c = 200; std::cout << static_cast<int>(c);` print?",
          options: ["`200`", "`-56` — `char` is signed here and 200 wraps", "A compile error", "`72`"],
          answer: 1,
          explanation: "`char` is signed on x86-64 Linux, so 200 is converted modulo 256 into the range −128…127: −56. Keep byte values in `unsigned char` or `std::uint8_t`; the braced form `char c{200}` would refuse to compile.",
        },
        {
          prompt: "What does `int x{}; std::cout << x;` print?",
          options: ["An indeterminate value", "`0`", "A compile error", "Nothing"],
          answer: 1,
          explanation: "Empty braces value-initialise the object, which for an `int` means zero — unlike `int x;`, whose value is indeterminate and whose read is undefined behaviour.",
        },
        {
          prompt: "What does `std::cout << -9 % 4;` print?",
          options: ["`-1`", "`3`", "`1`", "`-3`"],
          answer: 0,
          explanation: "`-9 / 4` truncates to `-2`, and the remainder keeps the dividend's sign so that `-2 * 4 + (-1) == -9`. Use `((a % m) + m) % m` for a result in 0…m−1.",
        },
        {
          prompt: "Is `if (a + b < a)` a valid way to detect that adding two positive `int`s overflowed?",
          options: ["Yes, on two's-complement hardware", "No: the overflow is undefined behaviour before the check runs, and the optimiser may delete the test; use `__builtin_add_overflow` or compare against `numeric_limits` first", "Only with `-O0`", "Only for `unsigned`"],
          answer: 1,
          explanation: "By the time `a + b` has wrapped the program has already invoked undefined behaviour, and the compiler is entitled to reason that `a + b < a` is impossible for positive `b`. Overflow must be prevented, not detected after the fact. (For `unsigned`, wrapping is defined and the check does work.)",
        },
        {
          prompt: "What happens with `std::popcount(5)`?",
          options: ["Returns 2", "Compile error: the `<bit>` functions take unsigned types only", "Returns 1", "Returns 3"],
          answer: 1,
          explanation: "Every function in `<bit>` is constrained to unsigned integer types, which is deliberate — signed bit manipulation has holes. `std::popcount(5u)` returns 2.",
        },
        {
          prompt: "What does `std::cout << std::fixed << std::setprecision(2) << 2.675;` print?",
          options: ["`2.68`", "`2.67` — the stored value is slightly below 2.675, so it rounds down", "`2.7`", "`2.675`"],
          answer: 1,
          explanation: "2.675 has no exact binary representation; the nearest double is 2.67499999999999982…, and rounding happens on that value. This is the standard argument for keeping money in integer cents.",
        },
        {
          prompt: "What does `std::cout << (1e16 + 1.0 == 1e16);` print?",
          options: ["`0`", "`1` — above 2⁵³ doubles are spaced 2 apart, so the 1 is absorbed", "Undefined behaviour", "A compile error"],
          answer: 1,
          explanation: "A `double` has 53 bits of precision; 10¹⁶ exceeds 2⁵³ ≈ 9 × 10¹⁵, so 10¹⁶ + 1 rounds back to 10¹⁶. Whole numbers that large belong in `long long`.",
        },
        {
          prompt: "`int sum = 7, n = 2; double avg = sum / n;` — what is `avg`?",
          options: ["`3.5`", "`3.0` — the division is done in `int` before the conversion", "`4.0`", "A compile error"],
          answer: 1,
          explanation: "Both operands are `int`, so `/` is integer division yielding 3, which is then converted to `3.0`. Cast one operand first: `static_cast<double>(sum) / n`.",
        },
        {
          prompt: "Which is the well-defined way to look at the bits of a `float f` as a `std::uint32_t`?",
          options: ["`reinterpret_cast<std::uint32_t>(f)`", "`std::bit_cast<std::uint32_t>(f)`", "`static_cast<std::uint32_t>(f)`", "`*(std::uint32_t*)&f`"],
          answer: 1,
          explanation: "`std::bit_cast` (C++20, `<bit>`) copies the object representation into a same-sized type. `static_cast` converts the *value* (1.0f → 1), `reinterpret_cast` cannot take a non-pointer, and the pointer pun violates aliasing rules.",
        },
        {
          prompt: "What is the type of `n` in `auto n = v.size();` for a `std::vector<int> v`?",
          options: ["`int`", "`std::size_t`", "`unsigned`", "`long long`"],
          answer: 1,
          explanation: "`auto` deduces exactly what `size()` returns, `std::size_t`. That avoids the narrowing of `int n = v.size();` and keeps later comparisons with `.size()` warning-free.",
        },
        {
          prompt: "`static_assert(square(4) == 16);` fails to compile with \"non-constant condition\". What is missing?",
          options: ["`#include <cassert>`", "`square` must be declared `constexpr` so the compiler may evaluate it", "`square` must be `inline`", "A `const` on the parameter"],
          answer: 1,
          explanation: "`static_assert` needs a constant expression, and only a `constexpr` (or `consteval`) function can be evaluated at compile time. Marking it `constexpr` costs nothing at run time.",
        },
        {
          prompt: "Which expression is undefined behaviour?",
          options: ["`1LL << 40`", "`1 << 40`", "`1u << 31`", "`1ull << 63`"],
          answer: 1,
          explanation: "`1` is an `int` (32 bits); a shift count of 40 is at least the width of the type, which is undefined regardless of where the result is stored. The other three shift within their types' widths.",
        },
        {
          prompt: "Given `enum Colour { Red, Green, Blue };`, which line compiles?",
          options: ["`Colour c = 1;`", "`Colour c = static_cast<Colour>(1);`", "`Colour c{1.0};`", "`Colour c = \"Green\";`"],
          answer: 1,
          explanation: "There is no implicit conversion from `int` to an enumeration, even an unscoped one; only the reverse is implicit. `static_cast` performs the conversion — and performs no validation, so check the integer first.",
        },
        {
          prompt: "`for (int i = 0; i < v.size(); ++i)` compiles with a warning under `-Wall`. Which fix is wrong?",
          options: ["`for (std::size_t i = 0; i < v.size(); ++i)`", "`for (int i = 0; i < std::ssize(v); ++i)`", "`for (int i = 0; std::cmp_less(i, v.size()); ++i)`", "`for (int i = 0; i < (int)v.size(); ++i)` — a C-style cast, hiding a narrowing that can fail for huge containers"],
          answer: 3,
          explanation: "The first three keep the comparison mathematically correct. The C-style cast silences the warning by narrowing `size()` to `int`, which is wrong for sizes above 2³¹ and uses the cast form the lesson retires.",
        },
      ],
    },
  ],
});

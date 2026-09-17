import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "operators",
  title: "Operator overloading",
  blurb: "Which operators to overload and where they live, the compound-first idiom, == and the C++20 spaceship with its ordering categories, << and >> that respect the stream, operator[] and operator() with functors and std::hash, and explicit on constructors and conversions.",
  icon: "plug",
  overview: `A value type earns its keep when it reads like a built-in: \`total += price * qty\`, \`if (a < b)\`, \`std::cout << money\`, \`grid[r][c]\`, \`if (result)\`. C++ lets a class define almost every operator, and that freedom is exactly what makes the rules matter — a member \`operator*\` that refuses \`2 * v\`, a \`<\` that is not strict and breaks \`std::sort\`, an \`operator<<\` that swallows the caller's \`setw\`, an implicit \`operator bool\` that lets \`result + 1\` compile. Every one of those is a bug that compiles, and this module is where you learn to write the operator set that does not contain them.

The five lessons go operator family by operator family. Overloading rules settles what can be overloaded, member versus free function (and the hidden-friend idiom), the compound-first idiom that derives \`+\` from \`+=\`, and prefix versus postfix increment. Comparison covers \`==\`, the strict weak ordering \`<\` must be, C++20's \`operator<=>\` with its rewritten expressions, \`strong_ordering\`/\`weak_ordering\`/\`partial_ordering\`, and what \`std::sort\`, \`std::set\` and \`std::map\` actually call. Stream operators covers \`<<\` and \`>>\` as free functions that return the stream, the failure contract of \`>>\`, respecting \`setw\` and sticky fill, and a \`std::formatter\` specialisation as reading. Subscript, call and function objects covers the const/non-const \`operator[]\` pair, \`operator()\` for two-dimensional access and for callable state, functors as comparators for \`std::priority_queue\` and \`std::set\`, and a \`std::hash\` specialisation for a custom key. Conversion operators covers converting constructors, \`explicit\`, \`explicit operator bool\`, the standard library's own surprising conversions and user-defined literals.

The exercises build the types the lessons describe: a \`Fraction\` normalised by \`std::gcd\` with \`+ - * /\` derived from the compound forms, a grid \`Vec2\` with unary minus and a scalar on either side, a \`Version\` sorted and deduplicated by a defaulted \`<=>\`, a case-insensitive \`Tag\` returning \`std::weak_ordering\`, a \`Money\` that round-trips \`12.34\` through \`>>\` and \`<<\` and honours \`setw\`, a \`Point\` reader that fails cleanly on \`[1,1]\`, a \`Matrix\` with \`operator()(r, c)\` and a \`std::span\` row view, a task queue driven by a functor comparator, a \`Result\` with \`explicit operator bool\`, and \`Celsius\`/\`Fahrenheit\` joined by explicit conversion operators. The checkpoint adds a \`Polynomial\` with arithmetic, \`operator()\` evaluation and a formatted \`<<\`; a grid walk keyed on a hashed \`Point\` printed in sorted order; and a \`Duration\` ledger that reads \`h:mm:ss\`, sorts by a defaulted \`<=>\` and prints without leaking a fill character.`,
  lessons: [
    {
      slug: "overloading-rules",
      file: "01-overloading-rules.md",
      exercises: [
        {
          title: "Fraction arithmetic",
          prompt: `Complete the \`Fraction\` class so that it supports \`+\`, \`-\`, \`*\` and \`/\`. Every fraction is kept **normalised**: the sign lives in the numerator (the denominator is always positive) and numerator and denominator are divided by their \`std::gcd\`, so \`2/4\` is stored as \`1/2\`, \`1/-3\` as \`-1/3\` and \`0/7\` as \`0/1\`. Write \`+=\`, \`-=\`, \`*=\` and \`/=\` as members that normalise after the arithmetic, then the four binary operators as free functions that take their left operand by value and return \`a += b\` (and so on) — the compound-first idiom.

**Input:** an integer \`n\`, then \`n\` lines of the form \`a/b op c/d\` where \`op\` is one of \`+ - * /\`, the four numbers are integers and no denominator is zero. The input never divides by a zero fraction.
**Output:** \`n\` lines: the two operands **normalised**, the operator, and the result as \`p/q\`, e.g. \`1/2 + 1/3 = 5/6\`.

\`\`\`text
3
1/2 + 1/3
2/4 - 1/-3
3/4 * 2/3
\`\`\`
prints
\`\`\`text
1/2 + 1/3 = 5/6
1/2 - -1/3 = 5/6
3/4 * 2/3 = 1/2
\`\`\`
Use \`long long\` for the parts: the intermediate products can exceed \`int\`.`,
          starter: String.raw`#include <iostream>
#include <numeric>

class Fraction {
public:
    Fraction(long long num = 0, long long den = 1) : num_(num), den_(den) { normalise(); }

    long long num() const { return num_; }
    long long den() const { return den_; }

    // TODO: operator+=, operator-=, operator*=, operator/= as members; normalise after each

private:
    long long num_;
    long long den_;

    void normalise() {
        // TODO: move the sign to the numerator, then divide both parts by std::gcd(num_, den_)
    }
};

// TODO: free operator+, operator-, operator*, operator/ written in terms of the compound forms

std::ostream& operator<<(std::ostream& os, const Fraction& f) {
    return os << f.num() << '/' << f.den();
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long a, b, c, d;
        char slash, op;
        std::cin >> a >> slash >> b >> op >> c >> slash >> d;
        const Fraction x(a, b), y(c, d);
        Fraction result;
        // TODO: apply op to x and y
        std::cout << x << ' ' << op << ' ' << y << " = " << result << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <numeric>

class Fraction {
public:
    Fraction(long long num = 0, long long den = 1) : num_(num), den_(den) { normalise(); }

    long long num() const { return num_; }
    long long den() const { return den_; }

    Fraction& operator+=(const Fraction& o) {
        num_ = num_ * o.den_ + o.num_ * den_;
        den_ *= o.den_;
        normalise();
        return *this;
    }
    Fraction& operator-=(const Fraction& o) { return *this += Fraction(-o.num_, o.den_); }
    Fraction& operator*=(const Fraction& o) {
        num_ *= o.num_;
        den_ *= o.den_;
        normalise();
        return *this;
    }
    Fraction& operator/=(const Fraction& o) { return *this *= Fraction(o.den_, o.num_); }

private:
    long long num_;
    long long den_;

    void normalise() {
        if (den_ < 0) {
            num_ = -num_;
            den_ = -den_;
        }
        const long long g = std::gcd(num_, den_);   // gcd(0, d) is d, so 0/7 becomes 0/1
        if (g > 1) {
            num_ /= g;
            den_ /= g;
        }
    }
};

Fraction operator+(Fraction a, const Fraction& b) { return a += b; }
Fraction operator-(Fraction a, const Fraction& b) { return a -= b; }
Fraction operator*(Fraction a, const Fraction& b) { return a *= b; }
Fraction operator/(Fraction a, const Fraction& b) { return a /= b; }

std::ostream& operator<<(std::ostream& os, const Fraction& f) {
    return os << f.num() << '/' << f.den();
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        long long a, b, c, d;
        char slash, op;
        std::cin >> a >> slash >> b >> op >> c >> slash >> d;
        const Fraction x(a, b), y(c, d);
        Fraction result;
        switch (op) {
            case '+': result = x + y; break;
            case '-': result = x - y; break;
            case '*': result = x * y; break;
            default:  result = x / y; break;
        }
        std::cout << x << ' ' << op << ' ' << y << " = " << result << '\n';
    }
    return 0;
}
`,
          hints: [
            "normalise(): if den_ < 0 flip both signs, then divide both by std::gcd(num_, den_) — std::gcd works on negatives and gcd(0, d) is d.",
            "a/b + c/d is (a*d + c*b) / (b*d); subtraction is adding the negated fraction and division is multiplying by the reciprocal.",
            "Fraction operator+(Fraction a, const Fraction& b) { return a += b; } — the copy is the parameter, and += returns it.",
          ],
          cases: [
            { stdin: "3\n1/2 + 1/3\n2/4 - 1/-3\n3/4 * 2/3\n", expected: "1/2 + 1/3 = 5/6\n1/2 - -1/3 = 5/6\n3/4 * 2/3 = 1/2\n" },
            { stdin: "2\n1/2 / 1/4\n-6/8 / -3/2\n", expected: "1/2 / 1/4 = 2/1\n-3/4 / -3/2 = 1/2\n" },
            { stdin: "3\n1/2 - 1/2\n0/7 + 0/-3\n5/1 * 0/4\n", expected: "1/2 - 1/2 = 0/1\n0/1 + 0/1 = 0/1\n5/1 * 0/1 = 0/1\n", hidden: true },
            { stdin: "2\n1000000/3 * 3/1000000\n123456789/1000000000 + 1/1000000000\n", expected: "1000000/3 * 3/1000000 = 1/1\n123456789/1000000000 + 1/1000000000 = 12345679/100000000\n", hidden: true },
          ],
        },
        {
          title: "Displacement on a grid",
          prompt: `Give the \`Vec2\` struct (integer \`x\` and \`y\`) the operators a vector needs: \`+=\`, \`-=\` and \`*=\` by an integer scalar as members; \`+\`, \`-\`, \`v * k\` **and** \`k * v\` as free functions derived from them; unary \`-\` as a \`const\` member; and a \`length()\` member returning \`std::sqrt\` of the squared length as a \`double\`. Then simulate a walk: a start position and a series of steps, each a velocity vector and a number of ticks, so that the position advances by \`ticks * velocity\` — use the scalar-on-the-left form to prove it exists.

**Input:** the start \`x y\`, then \`n\`, then \`n\` lines of \`vx vy ticks\` (all integers; \`n\` may be 0).
**Output:** the position after each step as \`(x, y)\`; then \`displacement (dx, dy)\` (final minus start), \`return (-dx, -dy)\` (the unary minus of the displacement), and \`distance <length of the displacement, one decimal>\`.

\`\`\`text
0 0
2
3 4 1
-1 2 2
\`\`\`
prints
\`\`\`text
(3, 4)
(1, 8)
displacement (1, 8)
return (-1, -8)
distance 8.1
\`\`\``,
          starter: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>

struct Vec2 {
    long long x = 0;
    long long y = 0;

    // TODO: operator+=, operator-=, operator*=(long long) returning Vec2&
    // TODO: Vec2 operator-() const
    double length() const {
        return 0.0;   // TODO: std::sqrt of x*x + y*y as a double
    }
};

// TODO: free operator+, operator-, operator*(Vec2, long long) and operator*(long long, Vec2)

std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << '(' << v.x << ", " << v.y << ')';
}

int main() {
    Vec2 start;
    std::cin >> start.x >> start.y;
    int n;
    std::cin >> n;
    Vec2 pos = start;
    for (int i = 0; i < n; ++i) {
        Vec2 v;
        long long ticks;
        std::cin >> v.x >> v.y >> ticks;
        // TODO: pos += ticks * v, then print pos
    }
    // TODO: displacement, return and distance lines
    return 0;
}
`,
          solution: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>

struct Vec2 {
    long long x = 0;
    long long y = 0;

    Vec2& operator+=(const Vec2& o) { x += o.x; y += o.y; return *this; }
    Vec2& operator-=(const Vec2& o) { x -= o.x; y -= o.y; return *this; }
    Vec2& operator*=(long long k) { x *= k; y *= k; return *this; }
    Vec2 operator-() const { return Vec2{-x, -y}; }
    double length() const { return std::sqrt(static_cast<double>(x * x + y * y)); }
};

Vec2 operator+(Vec2 a, const Vec2& b) { return a += b; }
Vec2 operator-(Vec2 a, const Vec2& b) { return a -= b; }
Vec2 operator*(Vec2 v, long long k) { return v *= k; }
Vec2 operator*(long long k, Vec2 v) { return v *= k; }   // the scalar on the left needs its own free function

std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << '(' << v.x << ", " << v.y << ')';
}

int main() {
    Vec2 start;
    std::cin >> start.x >> start.y;
    int n;
    std::cin >> n;
    Vec2 pos = start;
    for (int i = 0; i < n; ++i) {
        Vec2 v;
        long long ticks;
        std::cin >> v.x >> v.y >> ticks;
        pos += ticks * v;
        std::cout << pos << '\n';
    }
    const Vec2 moved = pos - start;
    std::cout << "displacement " << moved << '\n';
    std::cout << "return " << -moved << '\n';
    std::cout << "distance " << std::fixed << std::setprecision(1) << moved.length() << '\n';
    return 0;
}
`,
          hints: [
            "Each compound operator changes x and y and returns *this; the binary forms copy the left operand and apply the compound one.",
            "operator*(long long k, Vec2 v) can simply return v *= k — the parameter is already the copy.",
            "Unary minus is a member with no parameters: Vec2 operator-() const { return Vec2{-x, -y}; }.",
          ],
          cases: [
            { stdin: "0 0\n2\n3 4 1\n-1 2 2\n", expected: "(3, 4)\n(1, 8)\ndisplacement (1, 8)\nreturn (-1, -8)\ndistance 8.1\n" },
            { stdin: "10 -3\n1\n-2 1 3\n", expected: "(4, 0)\ndisplacement (-6, 3)\nreturn (6, -3)\ndistance 6.7\n" },
            { stdin: "5 5\n0\n", expected: "displacement (0, 0)\nreturn (0, 0)\ndistance 0.0\n", hidden: true },
            { stdin: "1 1\n3\n2 0 1\n0 3 1\n-2 -3 1\n", expected: "(3, 1)\n(3, 4)\n(1, 1)\ndisplacement (0, 0)\nreturn (0, 0)\ndistance 0.0\n", hidden: true },
            { stdin: "-2 7\n2\n1 -1 5\n-4 0 1\n", expected: "(3, 2)\n(-1, 2)\ndisplacement (1, -5)\nreturn (-1, 5)\ndistance 5.1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n```cpp\nstruct V {\n    int x;\n    V operator*(int k) const { return V{x * k}; }\n};\nint main() {\n    V v{2};\n    V w = 3 * v;\n}\n```",
          options: ["`w.x` is 6", "Compile error: no match for `operator*` with `int` and `V`", "`w.x` is 3", "Undefined behaviour"],
          answer: 1,
          explanation: "A member operator's left operand must be the class itself — `3` is an `int`, and there is no `int::operator*(V)`. Only a free `V operator*(int, V)` makes the scalar-on-the-left form work; `v * 3` would have compiled.",
        },
        {
          prompt: "Which group of operators **must** be implemented as member functions?",
          options: ["`+`, `-`, `*`, `/`", "`=`, `[]`, `()`, `->`", "`<<` and `>>`", "`==` and `<=>`"],
          answer: 1,
          explanation: "Assignment, subscript, call and arrow are required to be members; `<<` on a stream is required to be a free function, and the arithmetic and comparison operators may be either but are usually free so conversions apply to both operands.",
        },
        {
          prompt: "What does this print?\n```cpp\nstruct C {\n    int n = 0;\n    C& operator++() { ++n; return *this; }\n    C operator++(int) { C old = *this; ++*this; return old; }\n};\nint main() {\n    C c;\n    C a = c++;\n    C b = ++c;\n    std::cout << a.n << b.n << c.n;\n}\n```",
          options: ["`022`", "`122`", "`012`", "`011`"],
          answer: 0,
          explanation: "Postfix returns the *old* value: `a` is a copy taken while `n` was 0. Prefix returns the updated object, so `b.n` is 2, and `c` itself has been incremented twice.",
        },
        {
          prompt: "Why is `Vec2 operator+(Vec2 a, const Vec2& b) { return a += b; }` written with its first parameter by value?",
          options: ["So the function can modify the caller's object", "The operator needs a copy to work on anyway, and a by-value parameter lets a temporary argument be moved straight into it", "Operators cannot take reference parameters", "To make the operator a member function"],
          answer: 1,
          explanation: "`+` must not change its operands, so it works on a copy; making the parameter the copy avoids a second one and lets `(a + b) + c` move the intermediate. The caller's object is never touched.",
        },
        {
          prompt: "Which of these overloads compiles but breaks a guarantee readers rely on?",
          options: ["`operator&&` on a `Condition` type", "`operator+=` returning `*this` by reference", "`operator==` as a free function", "Unary `operator-` as a `const` member"],
          answer: 0,
          explanation: "An overloaded `&&` is an ordinary function call: both operands are evaluated before it runs, so the short-circuit behaviour of the built-in `&&` is lost. The other three are the recommended shapes.",
        },
        {
          prompt: "What is the outcome?\n```cpp\nclass M {\n    long long c;\npublic:\n    explicit M(long long v) : c(v) {}\n    friend M operator+(M, const M&);\n};\nint main() {\n    M a(1), b(2);\n    M s = a + b;\n}\n```",
          options: ["Runs and exits 0", "Compile error: `c` is private inside `operator+`", "Linker error: `operator+` is declared but never defined", "Compile error: a friend cannot be an operator"],
          answer: 2,
          explanation: "The `friend` line only *declares* a free function; nothing defines it, so the call compiles and the linker reports an undefined reference. Defining it inside the class body (a hidden friend) is the usual fix.",
        },
      ],
    },
    {
      slug: "comparison-and-spaceship",
      file: "02-comparison-and-spaceship.md",
      exercises: [
        {
          title: "Sort the versions",
          prompt: `Write a \`Version\` struct with \`major\`, \`minor\` and \`patch\` members **in that order** and a defaulted three-way comparison: \`auto operator<=>(const Version&) const = default;\` — nothing else. Read \`n\` versions, sort them ascending with \`std::sort\`, print them, then put them in a \`std::set<Version>\` and report how many distinct versions there are and the oldest and newest.

Numeric order, not text order: \`1.2.9\` comes before \`1.2.10\`, and \`1.10.0\` before \`2.0.0\`.

**Input:** \`n\` (at least 1), then \`n\` lines each \`major.minor.patch\`.
**Output:** the \`n\` versions sorted, one per line; then \`distinct=<k>\`, \`oldest=<version>\`, \`newest=<version>\`.

\`\`\`text
5
1.2.10
1.2.9
2.0.0
1.10.0
1.2.9
\`\`\`
prints
\`\`\`text
1.2.9
1.2.9
1.2.10
1.10.0
2.0.0
distinct=4
oldest=1.2.9
newest=2.0.0
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <compare>
#include <iostream>
#include <set>
#include <vector>

struct Version {
    int major = 0;
    int minor = 0;
    int patch = 0;
    // TODO: one defaulted operator<=>
};

std::ostream& operator<<(std::ostream& os, const Version& v) {
    return os << v.major << '.' << v.minor << '.' << v.patch;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Version> versions(n);
    for (Version& v : versions) {
        char dot;
        std::cin >> v.major >> dot >> v.minor >> dot >> v.patch;
    }
    // TODO: sort and print; then a std::set for distinct / oldest / newest
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <compare>
#include <iostream>
#include <set>
#include <vector>

struct Version {
    int major = 0;
    int minor = 0;
    int patch = 0;
    auto operator<=>(const Version&) const = default;   // <, >, <=, >= and == from the members in this order
};

std::ostream& operator<<(std::ostream& os, const Version& v) {
    return os << v.major << '.' << v.minor << '.' << v.patch;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Version> versions(n);
    for (Version& v : versions) {
        char dot;
        std::cin >> v.major >> dot >> v.minor >> dot >> v.patch;
    }
    std::sort(versions.begin(), versions.end());        // uses the rewritten operator<
    for (const Version& v : versions) std::cout << v << '\n';
    const std::set<Version> distinct(versions.begin(), versions.end());
    std::cout << "distinct=" << distinct.size() << '\n';
    std::cout << "oldest=" << *distinct.begin() << '\n';
    std::cout << "newest=" << *distinct.rbegin() << '\n';
    return 0;
}
`,
          hints: [
            "A defaulted <=> compares the members in declaration order, so major, minor, patch is the order you want.",
            "std::sort and std::set need only operator<, which the compiler rewrites as (a <=> b) < 0.",
            "A std::set is ordered: *begin() is the smallest element and *rbegin() the largest.",
          ],
          cases: [
            { stdin: "5\n1.2.10\n1.2.9\n2.0.0\n1.10.0\n1.2.9\n", expected: "1.2.9\n1.2.9\n1.2.10\n1.10.0\n2.0.0\ndistinct=4\noldest=1.2.9\nnewest=2.0.0\n" },
            { stdin: "3\n0.0.1\n0.0.0\n10.0.0\n", expected: "0.0.0\n0.0.1\n10.0.0\ndistinct=3\noldest=0.0.0\nnewest=10.0.0\n" },
            { stdin: "1\n3.3.3\n", expected: "3.3.3\ndistinct=1\noldest=3.3.3\nnewest=3.3.3\n", hidden: true },
            { stdin: "4\n1.0.0\n1.0.0\n0.9.9\n1.0.0\n", expected: "0.9.9\n1.0.0\n1.0.0\n1.0.0\ndistinct=2\noldest=0.9.9\nnewest=1.0.0\n", hidden: true },
          ],
        },
        {
          title: "Case-insensitive tags",
          prompt: `Write a \`Tag\` class wrapping a \`std::string\` whose ordering ignores case: \`"Apple"\`, \`"apple"\` and \`"APPLE"\` are *equivalent* — neither is less than the other — but they remain different strings, so the three-way comparison must return \`std::weak_ordering\`, not \`std::strong_ordering\`. Write \`operator<=>\` by hand (compare the lower-cased characters one by one, then the lengths) and an \`operator==\` that agrees with it.

Read \`n\` tags into a \`std::set<Tag>\`: a spelling equivalent to one already present is not inserted, so the first spelling seen is the one kept. Print how many distinct tags there are and the tags in set order. Then read two more words and print how the first compares to the second.

**Input:** \`n\`, then \`n\` words (one per line), then a line with two words.
**Output:** \`distinct=<k>\`, the \`k\` tags in order, then \`less\`, \`greater\` or \`equivalent\`.

\`\`\`text
5
Apple
banana
APPLE
Cherry
Banana
apple Apple
\`\`\`
prints
\`\`\`text
distinct=3
Apple
banana
Cherry
equivalent
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cctype>
#include <compare>
#include <iostream>
#include <set>
#include <string>
#include <utility>

class Tag {
public:
    explicit Tag(std::string text) : text_(std::move(text)) {}
    const std::string& text() const { return text_; }

    std::weak_ordering operator<=>(const Tag& o) const {
        // TODO: compare std::tolower of each character in turn, then the lengths
        return std::weak_ordering::equivalent;
    }
    bool operator==(const Tag& o) const {
        return false;   // TODO: consistent with <=>
    }

private:
    std::string text_;
};

int main() {
    int n;
    std::cin >> n;
    std::set<Tag> tags;
    for (int i = 0; i < n; ++i) {
        std::string word;
        std::cin >> word;
        tags.insert(Tag(word));
    }
    std::cout << "distinct=" << tags.size() << '\n';
    for (const Tag& t : tags) std::cout << t.text() << '\n';
    std::string left, right;
    std::cin >> left >> right;
    // TODO: compare Tag(left) <=> Tag(right) and print less / greater / equivalent
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cctype>
#include <compare>
#include <iostream>
#include <set>
#include <string>
#include <utility>

class Tag {
public:
    explicit Tag(std::string text) : text_(std::move(text)) {}
    const std::string& text() const { return text_; }

    std::weak_ordering operator<=>(const Tag& o) const {
        const std::size_t n = std::min(text_.size(), o.text_.size());
        for (std::size_t i = 0; i < n; ++i) {
            const int a = std::tolower(static_cast<unsigned char>(text_[i]));
            const int b = std::tolower(static_cast<unsigned char>(o.text_[i]));
            if (a != b) return a < b ? std::weak_ordering::less : std::weak_ordering::greater;
        }
        return text_.size() <=> o.text_.size();   // a strong_ordering converts to weak_ordering
    }
    bool operator==(const Tag& o) const { return (*this <=> o) == 0; }   // a hand-written <=> gives no ==

private:
    std::string text_;
};

int main() {
    int n;
    std::cin >> n;
    std::set<Tag> tags;
    for (int i = 0; i < n; ++i) {
        std::string word;
        std::cin >> word;
        tags.insert(Tag(word));   // an equivalent spelling is already there: insert keeps the first
    }
    std::cout << "distinct=" << tags.size() << '\n';
    for (const Tag& t : tags) std::cout << t.text() << '\n';
    std::string left, right;
    std::cin >> left >> right;
    const auto order = Tag(left) <=> Tag(right);
    if (order < 0) std::cout << "less\n";
    else if (order > 0) std::cout << "greater\n";
    else std::cout << "equivalent\n";
    return 0;
}
`,
          hints: [
            "Walk the shorter length; at the first pair of lower-cased characters that differ, return weak_ordering::less or greater.",
            "If every compared character matched, the shorter string is less: return text_.size() <=> o.text_.size() — it converts to weak_ordering.",
            "operator== can be written as (*this <=> o) == 0, which guarantees it agrees with the ordering.",
          ],
          cases: [
            { stdin: "5\nApple\nbanana\nAPPLE\nCherry\nBanana\napple Apple\n", expected: "distinct=3\nApple\nbanana\nCherry\nequivalent\n" },
            { stdin: "3\nzeta\nAlpha\nalpha\nZeta beta\n", expected: "distinct=2\nAlpha\nzeta\ngreater\n" },
            { stdin: "2\ngo\nGolang\ngo GO\n", expected: "distinct=2\ngo\nGolang\nequivalent\n", hidden: true },
            { stdin: "1\nX\na B\n", expected: "distinct=1\nX\nless\n", hidden: true },
            { stdin: "4\nb\nB\nA\na\nab a\n", expected: "distinct=2\nA\nb\ngreater\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Given `struct V { int a, b; auto operator<=>(const V&) const = default; };`, which comparisons compile for two `V` objects?",
          options: ["`<`, `>`, `<=`, `>=` only", "All six: the four relational operators, `==` and `!=`", "`<=>` only", "`==` and `!=` only"],
          answer: 1,
          explanation: "A *defaulted* `<=>` also declares a defaulted `operator==`, and `!=` is rewritten from `==`. Only a *hand-written* `<=>` leaves `==` undeclared.",
        },
        {
          prompt: "A class has a hand-written `std::strong_ordering operator<=>(const D&) const` and no `operator==`. What does `a == b` do?",
          options: ["Returns `true` when `(a <=> b) == 0`", "Compile error: `==` is not rewritten in terms of `<=>`", "Compares the objects byte by byte", "Calls an implicitly defaulted `==`"],
          answer: 1,
          explanation: "Equality is deliberately kept separate from ordering (for a string, `==` can reject on length without scanning). A user-provided `<=>` yields the four relational operators only; declare `bool operator==(const D&) const = default;` alongside it.",
        },
        {
          prompt: "What is the type of `R{} <=> R{}` for `struct R { int id; double value; auto operator<=>(const R&) const = default; };`?",
          options: ["`std::strong_ordering`", "`std::weak_ordering`", "`std::partial_ordering`", "It does not compile: `double` has no `<=>`"],
          answer: 2,
          explanation: "`auto` deduces the weakest category among the members. `int` gives `strong_ordering` but `double` gives `partial_ordering` because NaN is unordered, and the common category is the weaker one.",
        },
        {
          prompt: "`std::sort` is run on a vector of `T` whose `operator<` is written as `return a.x <= b.x;`. What happens?",
          options: ["The vector is sorted and equal elements keep their order", "Undefined behaviour: `<=` is not a strict weak ordering", "Compile error", "The vector is sorted in descending order"],
          answer: 1,
          explanation: "`std::sort` requires irreflexivity (`a < a` must be false). With `<=`, an element is 'less than' itself, and the implementation may loop past the end of the range or leave it unsorted; `std::set` with such a comparator cannot find elements it holds.",
        },
        {
          prompt: "How does `std::set<T>` decide that a key being inserted is already present?",
          options: ["It calls `operator==`", "It compares `std::hash` values", "It checks that neither `a < b` nor `b < a` holds", "It requires `a <=> b` to be `std::strong_ordering::equal`"],
          answer: 2,
          explanation: "Ordered containers are written in terms of `<` alone: two keys are equivalent when neither is less than the other. That is why a case-insensitive `<` deduplicates different spellings, and why `==` and `<` must agree.",
        },
        {
          prompt: "What does this print?\n```cpp\nstruct V {\n    int major, minor;\n    auto operator<=>(const V&) const = default;\n};\nint main() {\n    V a{1, 10}, b{1, 9};\n    std::cout << (a < b) << (a > b) << (a == b);\n}\n```",
          options: ["`010`", "`100`", "`001`", "`110`"],
          answer: 0,
          explanation: "The majors tie, so the minors decide: 10 is greater than 9. `a < b` is false, `a > b` is true, and the defaulted `==` is false because a member differs.",
        },
        {
          prompt: "Which comparison of a three-way result compiles?",
          options: ["`(a <=> b) < 0`", "`(a <=> b) < 1`", "`(a <=> b) == 0.0`", "`(a <=> b) < -1`"],
          answer: 0,
          explanation: "An ordering value may only be compared with the literal `0`; the library implements this with a type that only a literal zero converts to, so `1`, `-1` and `0.0` are compile errors by design.",
        },
      ],
    },
    {
      slug: "stream-operators",
      file: "03-stream-operators.md",
      exercises: [
        {
          title: "Money in and out",
          prompt: `Give the \`Money\` class (an integer number of cents) an \`operator>>\` and an \`operator<<\` that are exact inverses.

\`>>\` reads one whitespace-delimited token and accepts an optional \`-\`, one or more digits, and optionally a \`.\` followed by **one or two** digits: \`12.34\`, \`7\`, \`0.5\` (fifty cents) and \`-0.05\` are valid; \`7.\`, \`1.2.3\`, \`12.345\` and \`abc\` are not. On a bad token set \`failbit\` and leave the target unchanged. \`<<\` prints the sign, the units, a point and exactly two digits — and it must build the text first and insert it into the stream **once**, so that a caller's \`std::setw\` pads the whole amount.

**Input:** \`n\`, then \`n\` amounts (one per line).
**Output:** each amount echoed through \`<<\` on its own line; then \`total \` followed by the sum printed with \`std::setw(10)\`. If an amount is bad, print \`bad amount\` instead and stop.

\`\`\`text
4
12.34
7
0.5
-0.05
\`\`\`
prints
\`\`\`text
12.34
7.00
0.50
-0.05
total      19.79
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

class Money {
public:
    Money() = default;
    explicit Money(long long cents) : cents_(cents) {}
    long long cents() const { return cents_; }
    Money& operator+=(const Money& o) { cents_ += o.cents_; return *this; }
private:
    long long cents_ = 0;
};

std::ostream& operator<<(std::ostream& os, const Money& m) {
    // TODO: build "-units.cc" in a std::ostringstream, then insert out.str() once
    return os << m.cents();
}

std::istream& operator>>(std::istream& is, Money& m) {
    std::string tok;
    if (!(is >> tok)) return is;
    // TODO: parse [-]digits[.d|.dd] into cents; on anything else set failbit and return
    m = Money(0);
    return is;
}

int main() {
    int n;
    std::cin >> n;
    Money total;
    for (int i = 0; i < n; ++i) {
        Money m;
        if (!(std::cin >> m)) {
            std::cout << "bad amount\n";
            return 0;
        }
        std::cout << m << '\n';
        total += m;
    }
    std::cout << "total " << std::setw(10) << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

class Money {
public:
    Money() = default;
    explicit Money(long long cents) : cents_(cents) {}
    long long cents() const { return cents_; }
    Money& operator+=(const Money& o) { cents_ += o.cents_; return *this; }
private:
    long long cents_ = 0;
};

std::ostream& operator<<(std::ostream& os, const Money& m) {
    std::ostringstream out;                 // a private stream: setfill here never reaches the caller
    long long c = m.cents();
    if (c < 0) {
        out << '-';                         // printed explicitly: -5 / 100 is 0 and would lose the sign
        c = -c;
    }
    out << c / 100 << '.' << std::setw(2) << std::setfill('0') << c % 100;
    return os << out.str();                 // one insertion, so the caller's setw pads the whole amount
}

std::istream& operator>>(std::istream& is, Money& m) {
    std::string tok;
    if (!(is >> tok)) return is;            // nothing to parse: the stream already says why
    std::size_t i = 0;
    const bool negative = tok[0] == '-';
    if (negative) i = 1;
    long long units = 0;
    int unitDigits = 0;
    while (i < tok.size() && std::isdigit(static_cast<unsigned char>(tok[i]))) {
        units = units * 10 + (tok[i] - '0');
        ++i;
        ++unitDigits;
    }
    long long cents = 0;
    int fractionDigits = 0;
    if (i < tok.size() && tok[i] == '.') {
        ++i;
        while (i < tok.size() && std::isdigit(static_cast<unsigned char>(tok[i])) && fractionDigits < 2) {
            cents = cents * 10 + (tok[i] - '0');
            ++i;
            ++fractionDigits;
        }
        if (fractionDigits == 0) {
            is.setstate(std::ios::failbit);
            return is;
        }
    }
    if (unitDigits == 0 || i != tok.size()) {   // no digits at all, or something left over ("1.2.3", "12.345")
        is.setstate(std::ios::failbit);
        return is;
    }
    if (fractionDigits == 1) cents *= 10;       // "0.5" is fifty cents
    const long long total = units * 100 + cents;
    m = Money(negative ? -total : total);       // assigned only now, when the whole token is good
    return is;
}

int main() {
    int n;
    std::cin >> n;
    Money total;
    for (int i = 0; i < n; ++i) {
        Money m;
        if (!(std::cin >> m)) {
            std::cout << "bad amount\n";
            return 0;
        }
        std::cout << m << '\n';
        total += m;
    }
    std::cout << "total " << std::setw(10) << total << '\n';
    return 0;
}
`,
          hints: [
            "Read the whole token with is >> tok first; then the only question is whether to set failbit.",
            "Walk the token by index: optional '-', digits (count them), optional '.' with one or two digits; anything left over is a bad token.",
            "In operator<<, print the '-' yourself and work with the absolute value: -5 / 100 is 0 and -5 % 100 is -5.",
          ],
          cases: [
            { stdin: "4\n12.34\n7\n0.5\n-0.05\n", expected: "12.34\n7.00\n0.50\n-0.05\ntotal      19.79\n" },
            { stdin: "3\n-3.5\n1.25\n2.25\n", expected: "-3.50\n1.25\n2.25\ntotal       0.00\n" },
            { stdin: "3\n10.00\n1.2.3\n5\n", expected: "10.00\nbad amount\n", hidden: true },
            { stdin: "2\n-1000000.99\n0.98\n", expected: "-1000000.99\n0.98\ntotal -1000000.01\n", hidden: true },
            { stdin: "2\n0.01\n-0.02\n", expected: "0.01\n-0.02\ntotal      -0.01\n", hidden: true },
          ],
        },
        {
          title: "Points in parentheses",
          prompt: `Write \`operator<<\` and \`operator>>\` for a \`Point\` of two integers. The printed form is \`(x, y)\`; the reader accepts \`(x,y)\` with any amount of whitespace around the numbers and punctuation — \`(1,2)\`, \`(3, -4)\` and \`( -5 , 6 )\` all parse. Read the pieces into **local** variables with \`>>\` into \`char\` and \`int\`, check each punctuation character, and assign to the point only when the whole value was read; otherwise set \`failbit\` and leave the point untouched.

**Input:** \`n\` (at least 1), then \`n\` points separated by whitespace in any layout.
**Output:** each point printed as \`(x, y)\` on its own line as it is read; then \`bbox (minx, miny) (maxx, maxy)\` — the bounding box of all the points. If a point fails to parse, print \`bad point\` and stop.

\`\`\`text
3
(1,2) (3, -4)
( -5 , 6 )
\`\`\`
prints
\`\`\`text
(1, 2)
(3, -4)
(-5, 6)
bbox (-5, -4) (3, 6)
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>

struct Point {
    int x = 0;
    int y = 0;
};

std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << '(' << p.x << ", " << p.y << ')';
}

std::istream& operator>>(std::istream& is, Point& p) {
    // TODO: read '(' x ',' y ')' into locals; assign p only if every piece was right, else setstate(failbit)
    return is;
}

int main() {
    int n;
    std::cin >> n;
    Point lo, hi;
    for (int i = 0; i < n; ++i) {
        Point p;
        if (!(std::cin >> p)) {
            std::cout << "bad point\n";
            return 0;
        }
        std::cout << p << '\n';
        // TODO: fold p into lo and hi (the first point initialises both)
    }
    std::cout << "bbox " << lo << ' ' << hi << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>

struct Point {
    int x = 0;
    int y = 0;
};

std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << '(' << p.x << ", " << p.y << ')';
}

std::istream& operator>>(std::istream& is, Point& p) {
    char open = 0, comma = 0, close = 0;
    int x = 0, y = 0;
    if (is >> open && open == '(' && is >> x >> comma && comma == ',' && is >> y >> close && close == ')') {
        p = Point{x, y};                    // only once the whole value has been read
    } else {
        is.setstate(std::ios::failbit);     // the stream reports the failure; p is untouched
    }
    return is;
}

int main() {
    int n;
    std::cin >> n;
    Point lo, hi;
    for (int i = 0; i < n; ++i) {
        Point p;
        if (!(std::cin >> p)) {
            std::cout << "bad point\n";
            return 0;
        }
        std::cout << p << '\n';
        if (i == 0) {
            lo = p;
            hi = p;
        }
        lo.x = std::min(lo.x, p.x);
        lo.y = std::min(lo.y, p.y);
        hi.x = std::max(hi.x, p.x);
        hi.y = std::max(hi.y, p.y);
    }
    std::cout << "bbox " << lo << ' ' << hi << '\n';
    return 0;
}
`,
          hints: [
            "is >> c into a char skips whitespace first, so the same code handles (1,2) and ( 1 , 2 ).",
            "Chain the reads with &&: each is >> piece converts to bool, and the punctuation checks sit between them.",
            "A stream that has already failed makes every later >> fail too, so the caller's if (std::cin >> p) is all the checking it needs.",
          ],
          cases: [
            { stdin: "3\n(1,2) (3, -4)\n( -5 , 6 )\n", expected: "(1, 2)\n(3, -4)\n(-5, 6)\nbbox (-5, -4) (3, 6)\n" },
            { stdin: "2\n(0,0)\n[1,1]\n", expected: "(0, 0)\nbad point\n" },
            { stdin: "1\n(7,7)\n", expected: "(7, 7)\nbbox (7, 7) (7, 7)\n", hidden: true },
            { stdin: "2\n(1,2)\n(3 4)\n", expected: "(1, 2)\nbad point\n", hidden: true },
            { stdin: "3\n(1, 1)\n(-1, -1)\n(0, 5)\n", expected: "(1, 1)\n(-1, -1)\n(0, 5)\nbbox (-1, -1) (1, 5)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `operator<<` for a user-defined type written as a free function rather than a member?",
          options: ["Members cannot return references", "The left operand is a `std::ostream`, a library class you cannot add members to", "Free functions are faster", "A member `<<` would be ambiguous with the bit-shift operator"],
          answer: 1,
          explanation: "In `std::cout << m` the left operand is the stream; a member operator would have to be `std::ostream::operator<<(const Money&)`, which you cannot add. As a member of `Money` it would read `m << std::cout`.",
        },
        {
          prompt: "What does this print?\n```cpp\nstruct P { int x, y; };\nstd::ostream& operator<<(std::ostream& os, const P& p) {\n    os << p.x << ',' << p.y;\n    return os;\n}\nint main() {\n    std::cout << '[' << std::setw(6) << P{1, 2} << \"]\\n\";\n}\n```",
          options: ["`[   1,2]`", "`[     1,2]`", "`[1,2   ]`", "`[1,2]`"],
          answer: 1,
          explanation: "`setw` is one-shot and applies to the *next single insertion*, which inside the operator is `p.x`: `1` is padded to width 6, then `,2` follows unpadded. Building the text in an `ostringstream` and inserting it once would pad the whole `1,2`.",
        },
        {
          prompt: "Inside `operator>>`, the token read does not match the expected format. What should the operator do?",
          options: ["Throw `std::invalid_argument`", "Assign a default value to the target and return the stream", "Set `failbit` on the stream, leave the target unchanged and return the stream", "Print an error and call `std::exit`"],
          answer: 2,
          explanation: "That is the contract the built-in `>>` follows, and it is what keeps `if (is >> x)` meaningful. Assigning a default would hide the failure; throwing would break every loop that expects a failed stream.",
        },
        {
          prompt: "Which `operator>>` mistake can leave the target half-updated?",
          options: ["Reading the pieces into locals and assigning at the end", "Reading straight into `p.x` and `p.y` before checking the punctuation", "Calling `is.setstate(std::ios::failbit)` on failure", "Returning `is` at the end"],
          answer: 1,
          explanation: "If `p.x` is written before the comma check fails, the caller's object now has a new `x` and an old `y`. Locals first, one assignment at the end.",
        },
        {
          prompt: "An `operator<<` applies `std::setfill('0')` to the caller's stream and does not restore it. Afterwards the caller runs `std::cout << std::setw(5) << 42;`. What appears?",
          options: ["`   42`", "`00042`", "`42`", "A compile error"],
          answer: 1,
          explanation: "Fill is sticky: it stays set until changed. Width applies once, so `42` is padded to 5 with the leaked `'0'`. Format into a private `std::ostringstream`, or save and restore with `os.fill()`.",
        },
        {
          prompt: "What does specialising `std::formatter<Money>` (inheriting `std::formatter<std::string>`) give you?",
          options: ["An `operator<<` for `Money`", "An `operator>>` for `Money`", "Support for `std::format(\"{:>10}\", money)` with the string formatter's width and alignment handling", "Nothing — `std::formatter` cannot be specialised for user types"],
          answer: 2,
          explanation: "The specialisation is what `std::format` looks up for a `Money` argument; delegating to the string formatter makes the fill/align/width specs work on the text you produce. It has nothing to do with streams or input.",
        },
      ],
    },
    {
      slug: "subscript-call-and-functors",
      file: "04-subscript-call-and-functors.md",
      exercises: [
        {
          title: "A matrix with (r, c) and [r]",
          prompt: `Complete the \`Matrix\` class, which stores its elements in **one** \`std::vector<long long>\` in row-major order. Provide \`operator()(r, c)\` in a const and a non-const overload, each checking the indices and throwing \`std::out_of_range\` when either is out of bounds; and \`operator[](r)\` in a const and a non-const overload returning a \`std::span\` over row \`r\` (\`std::span<const long long>\` from the const one). The free function \`transposed(const Matrix&)\` must build the transpose through the const \`operator()\`, and \`rowSum\` must take a \`std::span<const long long>\`.

**Input:** \`R C\`, then \`R\` rows of \`C\` integers, then \`q\`, then \`q\` queries \`r c\`.
**Output:** the line \`transpose\`, the \`C\` rows of the transpose (space-separated), the line \`rowsums\` followed by the sum of each original row, then for each query the element \`m(r, c)\` or \`out of range\`.

\`\`\`text
2 3
1 2 3
4 5 6
3
0 2
1 0
2 0
\`\`\`
prints
\`\`\`text
transpose
1 4
2 5
3 6
rowsums 6 15
3
4
out of range
\`\`\``,
          starter: String.raw`#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

class Matrix {
public:
    Matrix(std::size_t rows, std::size_t cols) : rows_(rows), cols_(cols), data_(rows * cols) {}

    std::size_t rows() const { return rows_; }
    std::size_t cols() const { return cols_; }

    long long& operator()(std::size_t r, std::size_t c) { return data_[index(r, c)]; }
    // TODO: const operator()(r, c)
    // TODO: std::span<long long> operator[](r) and the const overload returning std::span<const long long>

private:
    std::size_t rows_, cols_;
    std::vector<long long> data_;   // row-major: element (r, c) is at r * cols_ + c

    std::size_t index(std::size_t r, std::size_t c) const {
        // TODO: throw std::out_of_range when r or c is out of bounds
        return r * cols_ + c;
    }
};

Matrix transposed(const Matrix& m) {
    Matrix t(m.cols(), m.rows());
    // TODO: t(c, r) = m(r, c)
    return t;
}

long long rowSum(std::span<const long long> row) {
    long long s = 0;
    for (long long x : row) s += x;
    return s;
}

int main() {
    std::size_t rows, cols;
    std::cin >> rows >> cols;
    Matrix m(rows, cols);
    for (std::size_t r = 0; r < rows; ++r)
        for (std::size_t c = 0; c < cols; ++c)
            std::cin >> m(r, c);
    // TODO: print the transpose, the row sums, then answer the queries (catch std::out_of_range)
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

class Matrix {
public:
    Matrix(std::size_t rows, std::size_t cols) : rows_(rows), cols_(cols), data_(rows * cols) {}

    std::size_t rows() const { return rows_; }
    std::size_t cols() const { return cols_; }

    long long& operator()(std::size_t r, std::size_t c) { return data_[index(r, c)]; }
    const long long& operator()(std::size_t r, std::size_t c) const { return data_[index(r, c)]; }

    std::span<long long> operator[](std::size_t r) { return {data_.data() + r * cols_, cols_}; }
    std::span<const long long> operator[](std::size_t r) const { return {data_.data() + r * cols_, cols_}; }

private:
    std::size_t rows_, cols_;
    std::vector<long long> data_;   // row-major: element (r, c) is at r * cols_ + c

    std::size_t index(std::size_t r, std::size_t c) const {
        if (r >= rows_ || c >= cols_) throw std::out_of_range("Matrix index");
        return r * cols_ + c;
    }
};

Matrix transposed(const Matrix& m) {
    Matrix t(m.cols(), m.rows());
    for (std::size_t r = 0; r < m.rows(); ++r)
        for (std::size_t c = 0; c < m.cols(); ++c)
            t(c, r) = m(r, c);          // const operator() on m, non-const on t
    return t;
}

long long rowSum(std::span<const long long> row) {
    long long s = 0;
    for (long long x : row) s += x;
    return s;
}

int main() {
    std::size_t rows, cols;
    std::cin >> rows >> cols;
    Matrix m(rows, cols);
    for (std::size_t r = 0; r < rows; ++r)
        for (std::size_t c = 0; c < cols; ++c)
            std::cin >> m(r, c);
    const Matrix t = transposed(m);
    std::cout << "transpose\n";
    for (std::size_t r = 0; r < t.rows(); ++r) {
        for (std::size_t c = 0; c < t.cols(); ++c) std::cout << (c == 0 ? "" : " ") << t(r, c);
        std::cout << '\n';
    }
    std::cout << "rowsums";
    for (std::size_t r = 0; r < rows; ++r) std::cout << ' ' << rowSum(m[r]);   // span<long long> converts to span<const long long>
    std::cout << '\n';
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        long long r, c;
        std::cin >> r >> c;
        try {
            std::cout << m(static_cast<std::size_t>(r), static_cast<std::size_t>(c)) << '\n';
        } catch (const std::out_of_range&) {
            std::cout << "out of range\n";
        }
    }
    return 0;
}
`,
          hints: [
            "The const overloads have the same bodies; only the return types change (const long long&, std::span<const long long>).",
            "A std::span is built from a pointer and a count: {data_.data() + r * cols_, cols_}.",
            "Read the query indices as long long and cast to std::size_t: a negative index becomes a huge one and fails the bounds check.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n3\n0 2\n1 0\n2 0\n", expected: "transpose\n1 4\n2 5\n3 6\nrowsums 6 15\n3\n4\nout of range\n" },
            { stdin: "1 1\n7\n1\n0 0\n", expected: "transpose\n7\nrowsums 7\n7\n" },
            { stdin: "3 1\n-1\n2\n-3\n2\n2 0\n0 1\n", expected: "transpose\n-1 2 -3\nrowsums -1 2 -3\n-3\nout of range\n", hidden: true },
            { stdin: "2 2\n1 -1\n-1 1\n0\n", expected: "transpose\n1 -1\n-1 1\nrowsums 0 0\n", hidden: true },
            { stdin: "2 2\n1 2\n3 4\n2\n-1 0\n1 1\n", expected: "transpose\n1 3\n2 4\nrowsums 3 7\nout of range\n4\n", hidden: true },
          ],
        },
        {
          title: "A task queue driven by a functor",
          prompt: `Write a comparator **class** \`LowerPriorityFirst\` with a \`const\` \`operator()(const Task&, const Task&)\` and use it as the third template argument of a \`std::priority_queue<Task, std::vector<Task>, LowerPriorityFirst>\`. The task with the **highest** priority number must come out first; among equal priorities the one added **earliest** comes out first — stamp each task with a sequence number when it is added and use it as the tie-breaker. Remember that a priority queue's comparator says which element is *worse*: it returns \`true\` when its first argument should come out after its second.

**Input:** \`n\`, then \`n\` commands: \`add <priority> <name>\` or \`run\`.
**Output:** for each \`run\`, \`run <name>\` for the task taken from the top, or \`idle\` when the queue is empty; finally \`pending <count>\`.

\`\`\`text
6
add 2 backup
add 5 deploy
add 5 hotfix
run
run
run
\`\`\`
prints
\`\`\`text
run deploy
run hotfix
run backup
pending 0
\`\`\``,
          starter: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <vector>

struct Task {
    int priority = 0;
    std::string name;
    int seq = 0;   // arrival order: the tie-breaker
};

struct LowerPriorityFirst {
    bool operator()(const Task& a, const Task& b) const {
        // TODO: true when a should come out AFTER b
        return false;
    }
};

int main() {
    int n;
    std::cin >> n;
    std::priority_queue<Task, std::vector<Task>, LowerPriorityFirst> queue;
    int seq = 0;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        // TODO: "add priority name" pushes a stamped task; "run" pops the top or prints idle
    }
    std::cout << "pending " << queue.size() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <vector>

struct Task {
    int priority = 0;
    std::string name;
    int seq = 0;   // arrival order: the tie-breaker
};

struct LowerPriorityFirst {
    // true when a should come out AFTER b: a lower priority, or a later arrival at the same priority
    bool operator()(const Task& a, const Task& b) const {
        if (a.priority != b.priority) return a.priority < b.priority;
        return a.seq > b.seq;
    }
};

int main() {
    int n;
    std::cin >> n;
    std::priority_queue<Task, std::vector<Task>, LowerPriorityFirst> queue;
    int seq = 0;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "add") {
            Task t;
            std::cin >> t.priority >> t.name;
            t.seq = seq++;
            queue.push(t);
        } else if (cmd == "run") {
            if (queue.empty()) {
                std::cout << "idle\n";
            } else {
                std::cout << "run " << queue.top().name << '\n';
                queue.pop();
            }
        }
    }
    std::cout << "pending " << queue.size() << '\n';
    return 0;
}
`,
          hints: [
            "With std::less the largest element is on top; your comparator plays the role of 'less', so return a.priority < b.priority when the priorities differ.",
            "For a tie, the earlier task must be 'greater': return a.seq > b.seq.",
            "top() then pop(): the top must be read before it is removed.",
          ],
          cases: [
            { stdin: "6\nadd 2 backup\nadd 5 deploy\nadd 5 hotfix\nrun\nrun\nrun\n", expected: "run deploy\nrun hotfix\nrun backup\npending 0\n" },
            { stdin: "4\nrun\nadd 1 a\nadd 3 b\nrun\n", expected: "idle\nrun b\npending 1\n" },
            { stdin: "5\nadd 1 x\nadd 1 y\nadd 1 z\nrun\nrun\n", expected: "run x\nrun y\npending 1\n", hidden: true },
            { stdin: "3\nadd -1 low\nadd -5 lower\nrun\n", expected: "run low\npending 1\n", hidden: true },
            { stdin: "7\nadd 3 a\nrun\nrun\nadd 9 b\nadd 9 c\nrun\nrun\n", expected: "run a\nidle\nrun b\nrun c\npending 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens?\n```cpp\nclass Row {\n    std::vector<int> d{1, 2, 3};\npublic:\n    int& operator[](std::size_t i) { return d[i]; }\n};\nint sum(const Row& r) { return r[0] + r[1] + r[2]; }\n```",
          options: ["Returns 6", "Compile error: `r` is const and `operator[]` is not a const member function", "Undefined behaviour", "Returns 0"],
          answer: 1,
          explanation: "A `const Row&` can only call `const` member functions. Every `operator[]` needs a second overload, `const int& operator[](std::size_t) const`, or read-only callers cannot index.",
        },
        {
          prompt: "In C++20, what does `m[1, 2]` mean for a `Matrix m` whose `operator[]` takes one `std::size_t`?",
          options: ["Element at row 1, column 2", "The comma operator: `1` is evaluated and discarded, so it is `m[2]`", "Compile error: too many arguments", "A call to `operator()(1, 2)`"],
          answer: 1,
          explanation: "A multi-argument `operator[]` arrives in C++23. In C++20 the expression inside the brackets is the comma operator (compilers warn about it), which yields its right operand. Use `operator()(r, c)` for two-dimensional access.",
        },
        {
          prompt: "A comparator struct's `operator()` is not marked `const`. It is used as `std::set<Task, ByPriority>`. What does libstdc++ do?",
          options: ["Compiles and works", "Compiles but the set is unordered", "Fails to compile: a static assertion says the comparison object must be invocable as const", "Compiles with a warning"],
          answer: 2,
          explanation: "The container stores the comparator and calls it through a const object. `std::sort` would still accept the functor (it takes it by value), which is why the bug shows up only when the same comparator moves into a container.",
        },
        {
          prompt: "What does `top()` return for `std::priority_queue<int, std::vector<int>, std::greater<int>>`?",
          options: ["The largest element", "The smallest element", "The first element pushed", "The most recently pushed element"],
          answer: 1,
          explanation: "A priority queue puts on top the element that the comparator says nothing is 'less' than — the maximum by its comparator. With `std::greater` the ordering is reversed, so the smallest element is on top: a min-heap.",
        },
        {
          prompt: "Why is `return std::hash<int>{}(p.x) ^ std::hash<int>{}(p.y);` a poor hash for a `Point`?",
          options: ["It is not `noexcept`", "XOR is symmetric, so `(1, 2)` and `(2, 1)` collide and every point with `x == y` hashes to 0", "`std::hash<int>` cannot be called on a temporary", "It returns an `int` rather than a `std::size_t`"],
          answer: 1,
          explanation: "A plain XOR loses the order of the members and cancels equal ones. Mixing with a shift and a constant (`h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2))`) spreads the combinations out.",
        },
        {
          prompt: "A program prints the contents of a `std::unordered_map` by iterating over it. What must a judged solution do instead?",
          options: ["Nothing; the order is insertion order", "Use `std::map` in the loop only", "Copy the entries into a `std::vector` and sort them before printing", "Call `rehash(0)` first"],
          answer: 2,
          explanation: "Iteration order of an unordered container is unspecified and differs between standard libraries and bucket counts. Sorting the entries is what makes the output deterministic.",
        },
        {
          prompt: "What is a lambda expression, in terms of the mechanisms in this lesson?",
          options: ["A function pointer", "A compiler-generated class whose captures are members and whose body is `operator()`", "A `std::function`", "A template function"],
          answer: 1,
          explanation: "The closure type is an unnamed class with a call operator; that is why lambdas and hand-written functors are interchangeable as comparators and why a lambda with captures can carry state.",
        },
      ],
    },
    {
      slug: "conversion-operators",
      file: "05-conversion-operators.md",
      exercises: [
        {
          title: "A result that tests like a bool",
          prompt: `Write a \`Result\` class holding either a \`long long\` value or an error message, built through the static factories \`Result::success(value)\` and \`Result::failure(message)\`, with an \`explicit operator bool\` that is true for a success, plus \`value()\` and \`error()\` accessors. Then write \`Result parseInt(std::string_view)\` that accepts an optional \`+\` or \`-\` followed by one to eighteen digits and fails with \`not a number\` (any other character, or a sign with no digits) or \`too long\` (more than eighteen digits). Use the result the way the operator is meant to be used: \`if (const Result r = parseInt(tok))\`.

**Input:** whitespace-separated tokens until end of input.
**Output:** one line per token — \`<token> -> <value>\` or \`<token> -> error: <message>\` — then \`sum=<sum of the parsed values>\` and \`failed=<number of failures>\`.

\`\`\`text
12 -7 abc 3x 0
\`\`\`
prints
\`\`\`text
12 -> 12
-7 -> -7
abc -> error: not a number
3x -> error: not a number
0 -> 0
sum=5
failed=2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <string_view>
#include <utility>

class Result {
public:
    static Result success(long long value) { Result r; r.ok_ = true; r.value_ = value; return r; }
    static Result failure(std::string message) { Result r; r.error_ = std::move(message); return r; }

    // TODO: explicit operator bool() const
    long long value() const { return value_; }
    const std::string& error() const { return error_; }

private:
    Result() = default;
    bool ok_ = false;
    long long value_ = 0;
    std::string error_;
};

Result parseInt(std::string_view text) {
    // TODO: optional sign, then 1..18 digits; "not a number" or "too long" otherwise
    return Result::failure("not a number");
}

int main() {
    std::string token;
    long long sum = 0;
    int failed = 0;
    while (std::cin >> token) {
        // TODO: if (const Result r = parseInt(token)) ... else ...
    }
    std::cout << "sum=" << sum << '\n';
    std::cout << "failed=" << failed << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <string_view>
#include <utility>

class Result {
public:
    static Result success(long long value) { Result r; r.ok_ = true; r.value_ = value; return r; }
    static Result failure(std::string message) { Result r; r.error_ = std::move(message); return r; }

    explicit operator bool() const { return ok_; }   // usable in if/while/!/&&, refused by int n = r;
    long long value() const { return value_; }
    const std::string& error() const { return error_; }

private:
    Result() = default;
    bool ok_ = false;
    long long value_ = 0;
    std::string error_;
};

Result parseInt(std::string_view text) {
    std::size_t i = 0;
    bool negative = false;
    if (!text.empty() && (text[0] == '-' || text[0] == '+')) {
        negative = text[0] == '-';
        i = 1;
    }
    if (i == text.size()) return Result::failure("not a number");
    if (text.size() - i > 18) return Result::failure("too long");
    long long value = 0;
    for (; i < text.size(); ++i) {
        if (text[i] < '0' || text[i] > '9') return Result::failure("not a number");
        value = value * 10 + (text[i] - '0');
    }
    return Result::success(negative ? -value : value);
}

int main() {
    std::string token;
    long long sum = 0;
    int failed = 0;
    while (std::cin >> token) {
        if (const Result r = parseInt(token)) {      // contextual conversion: the explicit operator applies
            std::cout << token << " -> " << r.value() << '\n';
            sum += r.value();
        } else {
            std::cout << token << " -> error: " << r.error() << '\n';
            ++failed;
        }
    }
    std::cout << "sum=" << sum << '\n';
    std::cout << "failed=" << failed << '\n';
    return 0;
}
`,
          hints: [
            "explicit operator bool() const { return ok_; } — the keyword goes before operator.",
            "A variable declared in an if condition is tested with the contextual bool conversion, so the explicit operator is exactly what makes if (const Result r = ...) work.",
            "Check the digit count before the loop: eighteen digits always fit a long long, nineteen may not.",
          ],
          cases: [
            { stdin: "12 -7 abc 3x 0\n", expected: "12 -> 12\n-7 -> -7\nabc -> error: not a number\n3x -> error: not a number\n0 -> 0\nsum=5\nfailed=2\n" },
            { stdin: "+5 -\n", expected: "+5 -> 5\n- -> error: not a number\nsum=5\nfailed=1\n" },
            { stdin: "1234567890123456789 999999999999999999\n", expected: "1234567890123456789 -> error: too long\n999999999999999999 -> 999999999999999999\nsum=999999999999999999\nfailed=1\n", hidden: true },
            { stdin: "x y\n", expected: "x -> error: not a number\ny -> error: not a number\nsum=0\nfailed=2\n", hidden: true },
            { stdin: "007 -0\n", expected: "007 -> 7\n-0 -> 0\nsum=7\nfailed=0\n", hidden: true },
          ],
        },
        {
          title: "Celsius and Fahrenheit, explicitly",
          prompt: `Write two classes, \`Celsius\` and \`Fahrenheit\`, each wrapping a \`double\` behind an \`explicit\` constructor and a \`degrees()\` accessor, and each with an **explicit conversion operator** to the other: \`explicit operator Fahrenheit() const\` on \`Celsius\` (F = C × 9/5 + 32) and \`explicit operator Celsius() const\` on \`Fahrenheit\` (C = (F − 32) × 5/9). Because both are explicit, \`Celsius c = 36.6;\` and \`Fahrenheit f = c;\` must not compile; conversions are requested with \`static_cast\`. Declare \`Fahrenheit\` before \`Celsius\` defines its operator body, since each class names the other.

**Input:** \`n\`, then \`n\` lines of \`<value> <unit>\` where the unit is \`C\` or \`F\`.
**Output:** one line each, with one decimal place: \`<v>C = <f>F\` for a Celsius reading, \`<v>F = <c>C\` for a Fahrenheit one, or \`bad unit\` for anything else.

\`\`\`text
3
100 C
98.6 F
-40 C
\`\`\`
prints
\`\`\`text
100.0C = 212.0F
98.6F = 37.0C
-40.0C = -40.0F
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>

class Fahrenheit;

class Celsius {
public:
    explicit Celsius(double degrees) : degrees_(degrees) {}
    double degrees() const { return degrees_; }
    // TODO: explicit operator Fahrenheit() const;   (declared here, defined after Fahrenheit)
private:
    double degrees_;
};

class Fahrenheit {
public:
    explicit Fahrenheit(double degrees) : degrees_(degrees) {}
    double degrees() const { return degrees_; }
    // TODO: explicit operator Celsius() const
private:
    double degrees_;
};

// TODO: Celsius::operator Fahrenheit() const { ... }

int main() {
    std::cout << std::fixed << std::setprecision(1);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        double value;
        std::string unit;
        std::cin >> value >> unit;
        // TODO: convert with static_cast and print, or "bad unit"
    }
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>

class Fahrenheit;

class Celsius {
public:
    explicit Celsius(double degrees) : degrees_(degrees) {}
    double degrees() const { return degrees_; }
    explicit operator Fahrenheit() const;   // Fahrenheit is incomplete here: declare now, define below
private:
    double degrees_;
};

class Fahrenheit {
public:
    explicit Fahrenheit(double degrees) : degrees_(degrees) {}
    double degrees() const { return degrees_; }
    explicit operator Celsius() const { return Celsius((degrees_ - 32.0) * 5.0 / 9.0); }
private:
    double degrees_;
};

Celsius::operator Fahrenheit() const { return Fahrenheit(degrees_ * 9.0 / 5.0 + 32.0); }

int main() {
    std::cout << std::fixed << std::setprecision(1);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        double value;
        std::string unit;
        std::cin >> value >> unit;
        if (unit == "C") {
            const Celsius c(value);
            const auto f = static_cast<Fahrenheit>(c);   // the explicit operator, requested by name
            std::cout << c.degrees() << "C = " << f.degrees() << "F\n";
        } else if (unit == "F") {
            const Fahrenheit f(value);
            const auto c = static_cast<Celsius>(f);
            std::cout << f.degrees() << "F = " << c.degrees() << "C\n";
        } else {
            std::cout << "bad unit\n";
        }
    }
    return 0;
}
`,
          hints: [
            "A conversion operator is a member named after the target type: explicit operator Fahrenheit() const;",
            "Celsius cannot define the body before Fahrenheit exists — declare the operator in the class and define Celsius::operator Fahrenheit() const after the Fahrenheit class.",
            "static_cast<Fahrenheit>(c) is how an explicit conversion is requested; auto keeps the target type spelt once.",
          ],
          cases: [
            { stdin: "3\n100 C\n98.6 F\n-40 C\n", expected: "100.0C = 212.0F\n98.6F = 37.0C\n-40.0C = -40.0F\n" },
            { stdin: "2\n0 C\n32 F\n", expected: "0.0C = 32.0F\n32.0F = 0.0C\n" },
            { stdin: "2\n451 F\n36.6 C\n", expected: "451.0F = 232.8C\n36.6C = 97.9F\n", hidden: true },
            { stdin: "2\n20 K\n-40 F\n", expected: "bad unit\n-40.0F = -40.0C\n", hidden: true },
            { stdin: "1\n37 C\n", expected: "37.0C = 98.6F\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`struct M { explicit M(double v); };` Which line fails to compile?",
          options: ["`M a(2.5);`", "`M b{2.5};`", "`M c = 2.5;`", "`M d = static_cast<M>(2.5);`"],
          answer: 2,
          explanation: "Copy-initialisation with `=` needs an *implicit* conversion from `double` to `M`, which `explicit` forbids. Direct-initialisation, brace-initialisation and an explicit cast all name the constructor and are allowed.",
        },
        {
          prompt: "`class F { public: operator double() const; };` with no `operator+` defined. What does `F a, b; auto s = a + b;` do?",
          options: ["Compile error: no `operator+` for `F`", "Compiles: both operands convert to `double` and `s` is a `double`", "Compiles and `s` is an `F`", "Undefined behaviour"],
          answer: 1,
          explanation: "An implicit conversion operator lets the built-in `double + double` be chosen, so the missing overload is silently replaced by floating-point arithmetic. `explicit operator double()` turns this back into the compile error you want.",
        },
        {
          prompt: "Why should `operator bool` almost always be `explicit`?",
          options: ["Non-explicit conversion operators are deprecated", "`bool` promotes to `int`, so a non-explicit one lets `r + 1`, `r == s` and `int n = r;` compile and mean nothing", "`explicit` makes the conversion faster", "Without `explicit`, `if (r)` does not compile"],
          answer: 1,
          explanation: "The explicit form still works everywhere a condition is expected (`if`, `while`, `!`, `&&`, `||`, `?:`) — that is the contextual conversion — and refuses the arithmetic and assignment contexts where a bool was never meant.",
        },
        {
          prompt: "Which of these compiles?",
          options: ["`std::string s = 65;`", "`std::string s = 'a';`", "`std::string s; s = 65;`", "`std::vector<int> v = 5;`"],
          answer: 2,
          explanation: "`std::string::operator=(char)` exists, and `65` converts to `char`, so `s` becomes `\"A\"`. No constructor takes a single `char` or `int` for copy-initialisation, and `vector(size_type)` is `explicit`.",
        },
        {
          prompt: "What does `std::string s('a', 3);` produce?",
          options: ["`\"aaa\"`", "A string of 97 characters, each with character code 3", "A compile error", "`\"a3\"`"],
          answer: 1,
          explanation: "The matching constructor is `string(size_type count, char ch)`: `'a'` converts to the count 97 and `3` to the character `'\\3'`. `std::string s(3, 'a')` is the intended call.",
        },
        {
          prompt: "`struct R { explicit operator bool() const; }; R r;` — which use compiles?",
          options: ["`if (r) { }`", "`bool b = r;`", "`int n = r;`", "`bool ok() { return r; }`"],
          answer: 0,
          explanation: "Only contextual conversions honour an explicit `operator bool`: conditions and the operands of `!`, `&&`, `||`. Copy-initialising a `bool` — including returning `r` from a function that returns `bool` — needs `static_cast<bool>(r)`.",
        },
        {
          prompt: "A user-defined literal suffix in your own code must…",
          options: ["Be a single letter", "Begin with an underscore", "Be declared inside a class", "Return `void`"],
          answer: 1,
          explanation: "Suffixes without a leading underscore are reserved for the standard library (`s`, `sv`, `ms`, `i`). `operator\"\"_km(long double)` is the shape; the parameter is `long double` for floating literals and `unsigned long long` for integer ones.",
        },
      ],
    },
    {
      slug: "operators-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Polynomial arithmetic",
          prompt: `Write a \`Polynomial\` class over \`long long\` coefficients (stored lowest degree first, trailing zeros trimmed so the zero polynomial is empty) with \`+=\` and \`*=\` as members, \`+\` and \`*\` derived from them, \`operator()(x)\` that evaluates the polynomial at an integer \`x\`, and an \`operator<<\` that prints it in the usual form: highest degree first, zero terms skipped, a coefficient of 1 omitted except in the constant term, \`x\` for degree 1 and \`x^k\` above, terms joined by \` + \` or \` - \`, and a lone \`0\` for the zero polynomial. Examples: \`3x^2 + 2x + 1\`, \`x - 1\`, \`-x^3 - 2x^2 - x\`, \`0\`.

**Input:** two polynomials, each on a line as \`d c0 c1 … cd\` (degree, then the coefficients of \`x^0\` to \`x^d\`), then a line with an integer \`x\`.
**Output:** seven lines: \`p = …\`, \`q = …\`, \`p + q = …\`, \`p * q = …\`, \`p(x) = …\`, \`q(x) = …\`, \`(p * q)(x) = …\`, with the actual value of \`x\` in the parentheses.

\`\`\`text
2 1 2 3
1 -1 1
5
\`\`\`
prints
\`\`\`text
p = 3x^2 + 2x + 1
q = x - 1
p + q = 3x^2 + 3x
p * q = 3x^3 - x^2 - x - 1
p(5) = 86
q(5) = 4
(p * q)(5) = 344
\`\`\``,
          starter: String.raw`#include <iostream>
#include <utility>
#include <vector>

class Polynomial {
public:
    Polynomial() = default;
    explicit Polynomial(std::vector<long long> coefficients) : c_(std::move(coefficients)) { trim(); }

    int degree() const { return static_cast<int>(c_.size()) - 1; }   // -1 for the zero polynomial
    long long coefficient(int k) const {
        return k >= 0 && k <= degree() ? c_[static_cast<std::size_t>(k)] : 0;
    }

    long long operator()(long long x) const {
        return 0;   // TODO: Horner's rule from the highest coefficient down
    }

    // TODO: operator+= and operator*= (resize / convolve, then trim)

private:
    std::vector<long long> c_;   // c_[k] is the coefficient of x^k
    void trim() { while (!c_.empty() && c_.back() == 0) c_.pop_back(); }
};

// TODO: operator+ and operator* from the compound forms

std::ostream& operator<<(std::ostream& os, const Polynomial& p) {
    // TODO: highest degree first; skip zeros; 1 omitted except as the constant; x, x^k; " + " / " - "; "0" when empty
    return os;
}

Polynomial readPolynomial() {
    int degree;
    std::cin >> degree;
    std::vector<long long> c(static_cast<std::size_t>(degree) + 1);
    for (long long& v : c) std::cin >> v;
    return Polynomial(c);
}

int main() {
    const Polynomial p = readPolynomial();
    const Polynomial q = readPolynomial();
    long long x;
    std::cin >> x;
    std::cout << "p = " << p << '\n';
    std::cout << "q = " << q << '\n';
    // TODO: the remaining five lines
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <utility>
#include <vector>

class Polynomial {
public:
    Polynomial() = default;
    explicit Polynomial(std::vector<long long> coefficients) : c_(std::move(coefficients)) { trim(); }

    int degree() const { return static_cast<int>(c_.size()) - 1; }   // -1 for the zero polynomial
    long long coefficient(int k) const {
        return k >= 0 && k <= degree() ? c_[static_cast<std::size_t>(k)] : 0;
    }

    long long operator()(long long x) const {          // Horner's rule
        long long result = 0;
        for (std::size_t i = c_.size(); i-- > 0;) result = result * x + c_[i];
        return result;
    }

    Polynomial& operator+=(const Polynomial& o) {
        if (o.c_.size() > c_.size()) c_.resize(o.c_.size(), 0);
        for (std::size_t i = 0; i < o.c_.size(); ++i) c_[i] += o.c_[i];
        trim();
        return *this;
    }
    Polynomial& operator*=(const Polynomial& o) {
        if (c_.empty() || o.c_.empty()) {
            c_.clear();
            return *this;
        }
        std::vector<long long> product(c_.size() + o.c_.size() - 1, 0);
        for (std::size_t i = 0; i < c_.size(); ++i)
            for (std::size_t j = 0; j < o.c_.size(); ++j)
                product[i + j] += c_[i] * o.c_[j];
        c_ = std::move(product);
        trim();
        return *this;
    }

private:
    std::vector<long long> c_;   // c_[k] is the coefficient of x^k
    void trim() { while (!c_.empty() && c_.back() == 0) c_.pop_back(); }
};

Polynomial operator+(Polynomial a, const Polynomial& b) { return a += b; }
Polynomial operator*(Polynomial a, const Polynomial& b) { return a *= b; }

std::ostream& operator<<(std::ostream& os, const Polynomial& p) {
    if (p.degree() < 0) return os << '0';
    bool first = true;
    for (int k = p.degree(); k >= 0; --k) {
        const long long c = p.coefficient(k);
        if (c == 0) continue;
        if (first) {
            if (c < 0) os << '-';
        } else {
            os << (c < 0 ? " - " : " + ");
        }
        const long long magnitude = c < 0 ? -c : c;
        if (magnitude != 1 || k == 0) os << magnitude;
        if (k >= 1) os << 'x';
        if (k >= 2) os << '^' << k;
        first = false;
    }
    return os;
}

Polynomial readPolynomial() {
    int degree;
    std::cin >> degree;
    std::vector<long long> c(static_cast<std::size_t>(degree) + 1);
    for (long long& v : c) std::cin >> v;
    return Polynomial(c);
}

int main() {
    const Polynomial p = readPolynomial();
    const Polynomial q = readPolynomial();
    long long x;
    std::cin >> x;
    std::cout << "p = " << p << '\n';
    std::cout << "q = " << q << '\n';
    std::cout << "p + q = " << p + q << '\n';
    std::cout << "p * q = " << p * q << '\n';
    std::cout << "p(" << x << ") = " << p(x) << '\n';
    std::cout << "q(" << x << ") = " << q(x) << '\n';
    std::cout << "(p * q)(" << x << ") = " << (p * q)(x) << '\n';
    return 0;
}
`,
          hints: [
            "Horner: start from 0 and, for each coefficient from the highest degree down, result = result * x + c.",
            "The product of degrees m and n has m + n + 1 coefficients: product[i + j] += a[i] * b[j]; treat an empty operand as zero.",
            "For printing, handle the sign separately from the magnitude: the first term prints '-' with no spaces, later terms print ' - ' or ' + '.",
          ],
          cases: [
            { stdin: "2 1 2 3\n1 -1 1\n5\n", expected: "p = 3x^2 + 2x + 1\nq = x - 1\np + q = 3x^2 + 3x\np * q = 3x^3 - x^2 - x - 1\np(5) = 86\nq(5) = 4\n(p * q)(5) = 344\n" },
            { stdin: "0 5\n1 0 2\n3\n", expected: "p = 5\nq = 2x\np + q = 2x + 5\np * q = 10x\np(3) = 5\nq(3) = 6\n(p * q)(3) = 30\n" },
            { stdin: "1 0 0\n2 1 0 1\n2\n", expected: "p = 0\nq = x^2 + 1\np + q = x^2 + 1\np * q = 0\np(2) = 0\nq(2) = 5\n(p * q)(2) = 0\n", hidden: true },
            { stdin: "2 0 -1 -1\n1 1 1\n-1\n", expected: "p = -x^2 - x\nq = x + 1\np + q = -x^2 + 1\np * q = -x^3 - 2x^2 - x\np(-1) = 0\nq(-1) = 0\n(p * q)(-1) = 0\n", hidden: true },
            { stdin: "1 1 1\n1 1 -1\n10\n", expected: "p = x + 1\nq = -x + 1\np + q = 2\np * q = -x^2 + 1\np(10) = 11\nq(10) = -9\n(p * q)(10) = -99\n", hidden: true },
          ],
        },
        {
          title: "Grid visits with a hashed key",
          prompt: `A walker starts at \`(0, 0)\` on an integer grid and follows a string of moves: \`U\` (y + 1), \`D\` (y − 1), \`L\` (x − 1), \`R\` (x + 1); any other character is ignored. Count how many times each cell is visited — the start counts as one visit — in a \`std::unordered_map<Point, int>\`. That needs a \`Point\` struct with a defaulted \`operator<=>\` (which also provides the \`==\` the map requires and the \`<\` you will sort by) and a specialisation \`template <> struct std::hash<Point>\` that combines the two member hashes. Never print in the map's own order: copy the cells that were visited more than once into a \`std::vector\` and sort it.

**Input:** one line, the move string (possibly empty).
**Output:** \`distinct=<number of different cells visited>\`, \`revisited=<number of cells visited more than once>\`, then those cells in ascending \`(x, y)\` order as \`(x, y): <visits>\`.

\`\`\`text
UDUD
\`\`\`
prints
\`\`\`text
distinct=2
revisited=2
(0, 0): 3
(0, 1): 2
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <compare>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;
    auto operator<=>(const Point&) const = default;
};

// TODO: template <> struct std::hash<Point> { std::size_t operator()(const Point&) const noexcept; };

std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << '(' << p.x << ", " << p.y << ')';
}

int main() {
    std::string moves;
    std::getline(std::cin, moves);
    // TODO: walk, counting visits per cell in an unordered_map<Point, int>
    // TODO: collect the cells with more than one visit, sort them, print the three parts
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <compare>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;
    auto operator<=>(const Point&) const = default;   // == for the hash map, < for the final sort
};

template <>
struct std::hash<Point> {
    std::size_t operator()(const Point& p) const noexcept {
        const std::size_t h1 = std::hash<int>{}(p.x);
        const std::size_t h2 = std::hash<int>{}(p.y);
        return h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2));   // combine, so (1, 2) and (2, 1) differ
    }
};

std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << '(' << p.x << ", " << p.y << ')';
}

int main() {
    std::string moves;
    std::getline(std::cin, moves);
    std::unordered_map<Point, int> visits;
    Point pos;
    ++visits[pos];                          // the start is a visit
    for (const char m : moves) {
        switch (m) {
            case 'U': ++pos.y; break;
            case 'D': --pos.y; break;
            case 'L': --pos.x; break;
            case 'R': ++pos.x; break;
            default: continue;              // not a move: no visit
        }
        ++visits[pos];
    }
    std::vector<std::pair<Point, int>> revisited;
    for (const auto& [cell, count] : visits)
        if (count > 1) revisited.emplace_back(cell, count);
    std::sort(revisited.begin(), revisited.end());   // pair compares the Point first, through its <=>
    std::cout << "distinct=" << visits.size() << '\n';
    std::cout << "revisited=" << revisited.size() << '\n';
    for (const auto& [cell, count] : revisited) std::cout << cell << ": " << count << '\n';
    return 0;
}
`,
          hints: [
            "The specialisation is a struct with std::size_t operator()(const Point&) const noexcept; hash each int with std::hash<int>{} and combine them with a shift and an odd constant, not a bare XOR.",
            "++visits[pos] inserts a zero the first time a cell is seen and increments it, which is exactly a visit count.",
            "A std::vector<std::pair<Point, int>> sorts by the Point first, and the defaulted <=> orders by x then y.",
          ],
          cases: [
            { stdin: "RRUULLDD\n", expected: "distinct=8\nrevisited=1\n(0, 0): 2\n" },
            { stdin: "UDUD\n", expected: "distinct=2\nrevisited=2\n(0, 0): 3\n(0, 1): 2\n" },
            { stdin: "R\n", expected: "distinct=2\nrevisited=0\n", hidden: true },
            { stdin: "LLRRUUDD\n", expected: "distinct=5\nrevisited=3\n(-1, 0): 2\n(0, 0): 3\n(0, 1): 2\n", hidden: true },
            { stdin: "\n", expected: "distinct=1\nrevisited=0\n", hidden: true },
          ],
        },
        {
          title: "A duration ledger",
          prompt: `Write a \`Duration\` class holding a number of seconds with: an \`operator>>\` that reads the form \`h:mm:ss\` (hours with one to nine digits, then exactly two digits each for minutes and seconds, both 00–59) and sets \`failbit\` on anything else; an \`operator<<\` that prints the same form with minutes and seconds zero-padded — and **restores the stream's fill character** afterwards; \`+=\` and \`+\`; and a defaulted \`operator<=>\` so the durations can be sorted with \`std::sort\`.

**Input:** \`n\` (at least 1), then \`n\` durations, one per line.
**Output:** \`total <sum>\`, \`longest <max>\`, \`shortest <min>\`, the \`n\` durations in ascending order one per line, then \`count\` followed by \`n\` printed with \`std::setw(4)\` — which comes out right only if your \`<<\` put the fill character back. If a duration is malformed, print \`bad duration\` and nothing else.

\`\`\`text
3
1:30:00
0:45:30
2:00:15
\`\`\`
prints
\`\`\`text
total 4:15:45
longest 2:00:15
shortest 0:45:30
0:45:30
1:30:00
2:00:15
count   3
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cctype>
#include <compare>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Duration {
public:
    Duration() = default;
    explicit Duration(long long seconds) : seconds_(seconds) {}
    long long seconds() const { return seconds_; }
    Duration& operator+=(const Duration& o) { seconds_ += o.seconds_; return *this; }
    // TODO: a defaulted operator<=>
private:
    long long seconds_ = 0;
};

Duration operator+(Duration a, const Duration& b) { return a += b; }

std::ostream& operator<<(std::ostream& os, const Duration& d) {
    // TODO: h:mm:ss with setw(2) and a '0' fill for mm and ss; restore os.fill() before returning
    return os << d.seconds();
}

std::istream& operator>>(std::istream& is, Duration& d) {
    std::string tok;
    if (!(is >> tok)) return is;
    // TODO: validate "h:mm:ss" (1-9 hour digits, two-digit mm and ss below 60); else setstate(failbit)
    d = Duration(0);
    return is;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Duration> entries;
    for (int i = 0; i < n; ++i) {
        Duration d;
        if (!(std::cin >> d)) {
            std::cout << "bad duration\n";
            return 0;
        }
        entries.push_back(d);
    }
    // TODO: total, longest, shortest, the sorted list, then "count" << std::setw(4) << n
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cctype>
#include <compare>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Duration {
public:
    Duration() = default;
    explicit Duration(long long seconds) : seconds_(seconds) {}
    long long seconds() const { return seconds_; }
    Duration& operator+=(const Duration& o) { seconds_ += o.seconds_; return *this; }
    auto operator<=>(const Duration&) const = default;   // one member: ordering by seconds
private:
    long long seconds_ = 0;
};

Duration operator+(Duration a, const Duration& b) { return a += b; }

std::ostream& operator<<(std::ostream& os, const Duration& d) {
    const long long s = d.seconds();
    const char previousFill = os.fill('0');              // fill is sticky: remember the caller's
    os << s / 3600 << ':' << std::setw(2) << (s / 60) % 60 << ':' << std::setw(2) << s % 60;
    os.fill(previousFill);                               // and put it back
    return os;
}

std::istream& operator>>(std::istream& is, Duration& d) {
    std::string tok;
    if (!(is >> tok)) return is;
    const std::size_t colon = tok.find(':');
    bool ok = colon != std::string::npos && colon >= 1 && colon <= 9
              && tok.size() == colon + 6 && tok[colon + 3] == ':';
    for (std::size_t i = 0; ok && i < tok.size(); ++i)
        if (i != colon && i != colon + 3 && !std::isdigit(static_cast<unsigned char>(tok[i]))) ok = false;
    if (ok) {
        const long long h = std::stoll(tok.substr(0, colon));
        const int m = std::stoi(tok.substr(colon + 1, 2));
        const int sec = std::stoi(tok.substr(colon + 4, 2));
        if (m > 59 || sec > 59) ok = false;
        else d = Duration(h * 3600 + m * 60 + sec);     // assigned only for a valid token
    }
    if (!ok) is.setstate(std::ios::failbit);
    return is;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Duration> entries;
    for (int i = 0; i < n; ++i) {
        Duration d;
        if (!(std::cin >> d)) {
            std::cout << "bad duration\n";
            return 0;
        }
        entries.push_back(d);
    }
    Duration total;
    for (const Duration& d : entries) total += d;
    std::sort(entries.begin(), entries.end());           // the rewritten < from the defaulted <=>
    std::cout << "total " << total << '\n';
    std::cout << "longest " << entries.back() << '\n';
    std::cout << "shortest " << entries.front() << '\n';
    for (const Duration& d : entries) std::cout << d << '\n';
    std::cout << "count" << std::setw(4) << n << '\n';   // padded with spaces only if the fill was restored
    return 0;
}
`,
          hints: [
            "os.fill('0') sets the fill character and returns the previous one; keep it and set it back before returning.",
            "Validate the shape by positions: the first ':' at index 1..9, the token exactly six characters longer than that, another ':' three after it, digits everywhere else, then mm and ss below 60.",
            "After sorting, entries.front() is the shortest and entries.back() the longest; sum with += into a default Duration.",
          ],
          cases: [
            { stdin: "3\n1:30:00\n0:45:30\n2:00:15\n", expected: "total 4:15:45\nlongest 2:00:15\nshortest 0:45:30\n0:45:30\n1:30:00\n2:00:15\ncount   3\n" },
            { stdin: "2\n0:00:59\n0:00:01\n", expected: "total 0:01:00\nlongest 0:00:59\nshortest 0:00:01\n0:00:01\n0:00:59\ncount   2\n" },
            { stdin: "1\n100:00:00\n", expected: "total 100:00:00\nlongest 100:00:00\nshortest 100:00:00\n100:00:00\ncount   1\n", hidden: true },
            { stdin: "2\n1:00:00\n1:60:00\n", expected: "bad duration\n", hidden: true },
            { stdin: "3\n0:00:00\n0:00:00\n0:00:01\n", expected: "total 0:00:01\nlongest 0:00:01\nshortest 0:00:00\n0:00:00\n0:00:00\n0:00:01\ncount   3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which operators cannot be overloaded at all?",
          options: ["`,`, `&&`, `||`", "`.`, `::`, `?:`, `sizeof`", "`new`, `delete`", "`<<`, `>>`"],
          answer: 1,
          explanation: "Member access, scope resolution, the conditional operator and `sizeof` are fixed by the language. The comma and logical operators *can* be overloaded (and should not be); `new`/`delete` and the stream operators are overloaded routinely.",
        },
        {
          prompt: "What does this print?\n```cpp\nstruct C {\n    int n = 5;\n    C& operator--() { --n; return *this; }\n    C operator--(int) { C old = *this; --*this; return old; }\n};\nint main() {\n    C c;\n    std::cout << (c--).n << (--c).n << c.n;\n}\n```",
          options: ["`533`", "`543`", "`433`", "`544`"],
          answer: 0,
          explanation: "Postfix returns the old value (5) and decrements to 4; prefix decrements to 3 and returns the object; `c.n` is then 3.",
        },
        {
          prompt: "`Vec2` has a member `Vec2 operator*(double k) const`. Which expression fails to compile?",
          options: ["`v * 2.0`", "`v * 2`", "`2.0 * v`", "`(v * 2.0) * 3.0`"],
          answer: 2,
          explanation: "A member operator's left operand must already be a `Vec2`; `2.0` is a `double` and no conversion is tried on it. A free `Vec2 operator*(double, Vec2)` is needed for the scalar-first form.",
        },
        {
          prompt: "In `Vec2 operator+(Vec2 a, const Vec2& b) { return a += b; }`, what is the reason the first parameter is a value?",
          options: ["Operators cannot take two references", "The copy is the working space: `+=` modifies it and the result is returned without touching the caller's objects", "It makes the operator a member", "By-value parameters are faster than references for every type"],
          answer: 1,
          explanation: "`+` must leave both operands unchanged, so the work happens on a copy — and making the parameter that copy lets a temporary argument be moved in rather than copied again.",
        },
        {
          prompt: "`struct V { int a, b; auto operator<=>(const V&) const = default; };` Which is true?",
          options: ["Only `<=>` exists; `<` must be written by hand", "`<`, `>`, `<=`, `>=`, `==` and `!=` all work, comparing `a` then `b`", "`==` compares `a` only", "The struct cannot be used as a `std::map` key"],
          answer: 1,
          explanation: "A defaulted `<=>` supplies the four relational operators through rewriting and also declares a defaulted `==`; both compare members in declaration order, which is exactly what `std::map` and `std::sort` need.",
        },
        {
          prompt: "Adding a `double` member to a struct with a defaulted `auto operator<=>` changes the deduced comparison category to…",
          options: ["`std::strong_ordering`", "`std::weak_ordering`", "`std::partial_ordering`", "It no longer compiles"],
          answer: 2,
          explanation: "`double` supports only a partial ordering because NaN is unordered, and `auto` deduces the weakest category among the members.",
        },
        {
          prompt: "A `std::set<Tag>` whose `<` ignores case is given `Apple`, `apple` and `APPLE`. What does it hold?",
          options: ["Three elements", "One element: the first inserted, `Apple`", "One element: the last inserted, `APPLE`", "A compile error: `std::set` needs `==`"],
          answer: 1,
          explanation: "Ordered containers use only `<`; two keys are the same when neither is less than the other. `insert` does nothing for an equivalent key, so the first spelling stays.",
        },
        {
          prompt: "`std::cout << std::setw(8) << money;` pads only the first digit of the amount. What is wrong?",
          options: ["`setw` does not work with user types", "`operator<<` for `Money` inserts several pieces; `setw` applies to the first insertion only", "`Money` is missing `operator>>`", "The stream is in `std::fixed` mode"],
          answer: 1,
          explanation: "Width is one-shot. Build the whole text in an `std::ostringstream` and insert it once, and the caller's width covers the entire amount.",
        },
        {
          prompt: "An `operator>>` reads `(3,` and then finds `x` instead of a number. The correct behaviour is to…",
          options: ["Assign `x = 3` to the target and return", "Set `failbit`, leave the target unchanged and return the stream", "Throw an exception", "Print `bad input` and return"],
          answer: 1,
          explanation: "Read into locals, assign only on complete success, and signal failure through the stream's state so `if (is >> p)` is false — the contract the built-in operators follow.",
        },
        {
          prompt: "A class provides only `int& operator[](std::size_t)`. What fails?",
          options: ["`r[0] = 1;` on a non-const object", "Indexing through a `const Row&` parameter", "Passing `r` to a function by value", "`r[0]++`"],
          answer: 1,
          explanation: "A `const` object can call only `const` member functions, so the read-only caller cannot index at all. The second overload, `const int& operator[](std::size_t) const`, fixes it.",
        },
        {
          prompt: "`std::priority_queue<int, std::vector<int>, std::greater<int>> q;` after pushing 5, 1, 3, what is `q.top()`?",
          options: ["5", "1", "3", "Unspecified"],
          answer: 1,
          explanation: "With `std::greater` the queue is a min-heap: the smallest element is on top. With the default `std::less` it would be 5.",
        },
        {
          prompt: "Which pair must agree for a `Point` used as an `unordered_map` key?",
          options: ["`operator<` and `operator<=>`", "`operator==` and `std::hash<Point>`: equal points must hash equal", "`operator<<` and `operator>>`", "The copy constructor and the destructor"],
          answer: 1,
          explanation: "The map finds a key by hash and then confirms it with `==`; if two equal points can land in different buckets, lookups miss. Ordering is irrelevant to an unordered container.",
        },
        {
          prompt: "`struct M { explicit M(int); }; void f(M);` Which call compiles?",
          options: ["`f(3);`", "`f(M(3));`", "`M m = 3; f(m);`", "`f({3});`"],
          answer: 1,
          explanation: "`explicit` forbids the implicit conversion from `int` in a function argument, in copy-initialisation and in copy-list-initialisation (`{3}`); naming the constructor with `M(3)` is direct-initialisation and is allowed.",
        },
        {
          prompt: "`struct R { explicit operator bool() const; }; R r;` Which line fails to compile?",
          options: ["`if (r) { }`", "`while (!r) { }`", "`bool ok = r && true;`", "`bool ok = r;`"],
          answer: 3,
          explanation: "Copy-initialising a `bool` is not a contextual conversion, so the explicit operator is not applied. Conditions and the operands of `!`, `&&` and `||` are; `static_cast<bool>(r)` is the explicit form.",
        },
      ],
    },
  ],
});

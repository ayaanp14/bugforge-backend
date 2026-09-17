import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "templates",
  title: "Templates and generic programming",
  blurb: "Function templates and deduction, Stack<T> and Pair<A, B> with CTAD, full and partial specialisation and the traits pattern, non-type parameters and fold expressions, C++20 concepts with constrained auto, and the type traits behind if constexpr dispatch.",
  icon: "generic",
  overview: `Every container, algorithm and smart pointer you have used so far is a template: \`std::vector<int>\` is one class stamped out of \`std::vector\`, and \`std::sort\` is one function generated for each element type it meets. A template is a recipe the compiler follows the first time a type is supplied, and the result is ordinary code — a \`max_of<int>\` that is exactly the function you would have written by hand, with no run-time dispatch, no boxing and no cost. That is the zero-overhead principle applied to genericity, and it is why C++ can offer one \`std::sort\` for \`int\`, \`std::string\` and your own types and still compile each to the tightest loop. This module is where you stop only *using* templates and start writing them, and where you learn to read the errors they produce when a type does not fit.

The six lessons move from the mechanism to the tools that tame it. Function templates settle deduction — what the compiler reads from the arguments, why \`max_of(3, 2.5)\` is refused, when you name \`T\` yourself, how a template shares its name with plain overloads, and why the whole definition must sit in a header. Class templates build a \`Stack<T>\` and a \`Pair<A, B>\` with members defined outside the body, default arguments and C++17 class template argument deduction, and explain the \`typename\` the parser demands for dependent names. Specialisation writes the exception next to the rule — one exact type, or a pattern such as every pointer or every \`std::pair<T, T>\` — and fixes the rule that function templates are overloaded, never specialised. Non-type and variadic templates put a number or a whole pack of arguments in the parameter list and replace recursion with fold expressions. Concepts move a template's requirements into its signature so a bad argument fails at the call in two lines, and type traits close the module with \`if constexpr\` dispatch, \`std::conditional_t\`, \`decltype\`, and the SFINAE you must be able to read in older code.

The exercises are whole programs that read a type word from standard input and let the rest of the input follow from it: a \`max_of\`/\`min_of\` pair and a \`clamp_to\` served by one template for \`int\`, \`double\` and \`std::string\`; a command-driven \`Stack<T>\` with out-of-class members; a \`Pair<A, B>\` built through CTAD with a defaulted second argument; a \`Describe<T>\` that tags \`bool\`, \`const char*\` and \`std::string\` with your own labels and recurses through vectors and pairs by partial specialisation; a fixed-capacity \`Ring<T, N>\` whose size is chosen among three instantiations at run time; a variadic report built entirely from fold expressions; an \`average\` whose overload is picked by \`std::integral\` and \`std::floating_point\`; a \`Shape\` concept written as a \`requires\` expression; and an \`if constexpr\` dispatcher that strips a forwarding reference with \`std::remove_cvref_t\`. The checkpoint adds a \`Queue<T>\` instantiated for the type on the first line, a statistics report whose overloads are chosen by concepts, and a \`Table<K, V>\` whose header comes from a \`TypeName\` trait.`,
  lessons: [
    {
      slug: "function-templates",
      file: "01-function-templates.md",
      exercises: [
        {
          title: "max_of and min_of over int, double and std::string",
          prompt: `Write two function templates, \`max_of(const T& a, const T& b)\` and \`min_of(const T& a, const T& b)\`, each using only \`operator<\` in its body (so any type that defines \`<\` works). Read an integer \`n\`, then \`n\` lines of \`<type> <a> <b>\` where \`<type>\` is \`int\`, \`double\` or \`string\`. Both values on a line are read as that type, so one instantiation serves the line, and the three type words instantiate the templates three times in total.

Print \`<type>: min=<min> max=<max>\` per line. Doubles print with two decimals (\`std::fixed\` and \`std::setprecision(2)\`); strings compare the way \`std::string\` does, so \`Zebra\` is less than \`apple\`. Put the reading in a helper such as \`answer<T>(type)\` — \`T\` appears only in its body, so the call must name it: \`answer<int>(type)\`.

**Input:** \`n\`, then \`n\` lines of \`type a b\`.
**Output:** \`n\` lines.

\`\`\`text
3
int 3 9
double 2.5 -1
string pear apple
\`\`\`
prints
\`\`\`text
int: min=3 max=9
double: min=-1.00 max=2.50
string: min=apple max=pear
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>

// TODO: max_of and min_of as function templates that use only operator<

template <typename T>
void answer(const std::string& type) {
    T a, b;
    std::cin >> a >> b;
    // TODO: print "<type>: min=<min> max=<max>"
    std::cout << type << ": " << '\n';
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        // TODO: call answer<int>, answer<double> or answer<std::string>
    }
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>

template <typename T>
T max_of(const T& a, const T& b) {
    return b < a ? a : b;
}

template <typename T>
T min_of(const T& a, const T& b) {
    return b < a ? b : a;
}

template <typename T>
void answer(const std::string& type) {
    T a, b;
    std::cin >> a >> b;
    std::cout << type << ": min=" << min_of(a, b) << " max=" << max_of(a, b) << '\n';
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        if (type == "int") answer<int>(type);
        else if (type == "double") answer<double>(type);
        else answer<std::string>(type);
    }
    return 0;
}
`,
          hints: [
            "Write max_of as `return b < a ? a : b;` and min_of as `return b < a ? b : a;` — both need only `<`.",
            "answer<T> cannot deduce T from `type`, a std::string; branch on the word and pass T explicitly.",
            "std::fixed only affects doubles, so setting it once in main is safe for the int and string lines.",
          ],
          cases: [
            { stdin: "3\nint 3 9\ndouble 2.5 -1\nstring pear apple\n", expected: "int: min=3 max=9\ndouble: min=-1.00 max=2.50\nstring: min=apple max=pear\n" },
            { stdin: "2\nint -4 -9\nstring Zebra apple\n", expected: "int: min=-9 max=-4\nstring: min=Zebra max=apple\n" },
            { stdin: "2\nint 7 7\ndouble 1.25 1.2\n", expected: "int: min=7 max=7\ndouble: min=1.20 max=1.25\n", hidden: true },
            { stdin: "1\nstring apple apples\n", expected: "string: min=apple max=apples\n", hidden: true },
            { stdin: "3\ndouble -0.5 -0.25\nint 2147483647 -2147483648\nstring b a\n", expected: "double: min=-0.50 max=-0.25\nint: min=-2147483648 max=2147483647\nstring: min=a max=b\n", hidden: true },
          ],
        },
        {
          title: "clamp_to with read_one<T>() and a printing overload",
          prompt: `Write three things. \`read_one<T>()\` reads one value of type \`T\` from standard input and returns it — \`T\` appears only in the return type, so every call names it explicitly. \`clamp_to(const T& v, const T& lo, const T& hi)\` returns \`lo\` when \`v < lo\`, \`hi\` when \`hi < v\`, and \`v\` otherwise. And two printers that share a name: a plain function \`void show(double v)\` that prints with two decimals, and an abbreviated function template \`void show(const auto& v)\` that prints the value as it is. Overload resolution sends a \`double\` to the plain function (an exact non-template match wins the tie) and an \`int\` or a \`std::string\` to the template (an exact template match beats the conversion to \`double\`).

Read \`n\`, then \`n\` lines of \`<type> <value> <lo> <hi>\` with \`<type>\` one of \`int\`, \`double\`, \`string\`. For each line print \`<type>: <clamped>\`. After the last line print \`changed=<k>\`, the number of lines whose value was outside \`[lo, hi]\`.

**Input:** \`n\`, then \`n\` lines of \`type value lo hi\`.
**Output:** \`n\` lines, then \`changed=<k>\`.

\`\`\`text
3
int 15 0 10
double 2.5 1 5
string m a k
\`\`\`
prints
\`\`\`text
int: 10
double: 2.50
string: k
changed=2
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>

template <typename T>
T read_one() {
    T value;
    std::cin >> value;
    return value;
}

// TODO: clamp_to(const T& v, const T& lo, const T& hi) using only operator<

void show(double v) { std::cout << std::fixed << std::setprecision(2) << v; }

// TODO: void show(const auto& v) — the abbreviated template for everything else

template <typename T>
bool clamp_line(const std::string& type) {
    const T v = read_one<T>();
    const T lo = read_one<T>();
    const T hi = read_one<T>();
    std::cout << type << ": ";
    // TODO: show the clamped value, end the line, and report whether v was outside [lo, hi]
    (void)v;
    (void)lo;
    (void)hi;
    std::cout << '\n';
    return false;
}

int main() {
    int n;
    std::cin >> n;
    int changed = 0;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        // TODO: dispatch on the type word and count the changed lines
    }
    std::cout << "changed=" << changed << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>

template <typename T>
T read_one() {
    T value;
    std::cin >> value;
    return value;
}

template <typename T>
T clamp_to(const T& v, const T& lo, const T& hi) {
    if (v < lo) return lo;
    if (hi < v) return hi;
    return v;
}

void show(double v) { std::cout << std::fixed << std::setprecision(2) << v; }

void show(const auto& v) { std::cout << v; }

template <typename T>
bool clamp_line(const std::string& type) {
    const T v = read_one<T>();
    const T lo = read_one<T>();
    const T hi = read_one<T>();
    std::cout << type << ": ";
    show(clamp_to(v, lo, hi));
    std::cout << '\n';
    return v < lo || hi < v;
}

int main() {
    int n;
    std::cin >> n;
    int changed = 0;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        bool moved = false;
        if (type == "int") moved = clamp_line<int>(type);
        else if (type == "double") moved = clamp_line<double>(type);
        else moved = clamp_line<std::string>(type);
        if (moved) ++changed;
    }
    std::cout << "changed=" << changed << '\n';
    return 0;
}
`,
          hints: [
            "clamp_to is two ifs and a return; `v < lo || hi < v` is the same test again and says whether the line changed.",
            "read_one<T>() must be called with angle brackets — there is no argument to deduce T from.",
            "Declare both show overloads before clamp_line; the compiler picks between them per call, not per file order.",
          ],
          cases: [
            { stdin: "3\nint 15 0 10\ndouble 2.5 1 5\nstring m a k\n", expected: "int: 10\ndouble: 2.50\nstring: k\nchanged=2\n" },
            { stdin: "2\nint -3 -2 2\nstring cat cab dog\n", expected: "int: -2\nstring: cat\nchanged=1\n" },
            { stdin: "2\ndouble -7.25 -5 5\ndouble 0.1 0 1\n", expected: "double: -5.00\ndouble: 0.10\nchanged=1\n", hidden: true },
            { stdin: "2\nint 5 5 5\nint 4 5 5\n", expected: "int: 5\nint: 5\nchanged=1\n", hidden: true },
            { stdin: "1\nstring apple b z\n", expected: "string: b\nchanged=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\ntemplate <typename T>\nT max_of(const T& a, const T& b) { return b < a ? a : b; }\n\nint main() { std::cout << max_of(3, 2.5); }\n```",
          options: ["Prints `3`", "Prints `2.5`", "Compile error: conflicting deductions for `T`", "Undefined behaviour"],
          answer: 2,
          explanation: "Deduction never converts: `3` says `T = int` and `2.5` says `T = double`, and the two must agree. Either name the type — `max_of<double>(3, 2.5)` — or pass `3.0`. A plain `double max_of(double, double)` would have promoted the `3`; a template does not.",
        },
        {
          prompt: "`max_of(\"pear\", \"apple\")` compiles. What does it compare?",
          options: ["The two words, character by character", "The lengths of the two literals", "The addresses of the two literals", "Nothing — it is a compile error"],
          answer: 2,
          explanation: "Both literals decay to `const char*`, so `T = const char*` and `b < a` compares two pointers. The result depends on where the linker placed the strings. Pass `std::string` values, or `\"pear\"s` with `using namespace std::literals;`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nvoid describe(int) { std::cout << \"int\"; }\n\ntemplate <typename T>\nvoid describe(const T&) { std::cout << \"template\"; }\n\nint main() { describe(5L); }\n```",
          options: ["`int`", "`template`", "Compile error: ambiguous call", "`int` — non-templates always win"],
          answer: 1,
          explanation: "The template deduces `T = long`, an exact match; the non-template needs a `long` to `int` conversion. Exact beats conversion, so the template runs. The non-template wins only when the two are *equally* good — `describe(5)` prints `int`.",
        },
        {
          prompt: "Why does this fail to compile?\n\n```cpp\ntemplate <typename T>\nT zero() { return T{}; }\n\nint main() { auto z = zero(); }\n```",
          options: ["`T{}` is not valid for every `T`", "`T` appears only in the return type, so there is nothing to deduce it from", "`auto` cannot hold a template's result", "A template with no parameters must be `constexpr`"],
          answer: 1,
          explanation: "Deduction reads the *arguments*; a return type is never used for it. `zero<int>()` names the argument explicitly. `std::make_unique<Widget>(…)` and `std::get<0>(…)` are the same shape: the caller supplies what cannot be deduced.",
        },
        {
          prompt: "`max.h` declares `template <typename T> T max_of(const T&, const T&);` and `max.cpp` defines it. `main.cpp` includes the header and calls `max_of(1, 2)`. What happens?",
          options: ["Everything compiles and links", "`main.cpp` fails to compile: the body is missing", "Both files compile; the link fails with an undefined reference to `max_of<int>`", "`max.cpp` fails to compile: a template cannot live in a `.cpp` file"],
          answer: 2,
          explanation: "The compiler generates `max_of<int>` where it sees the call, and it can only do that with the definition in view. `main.cpp` compiles against the declaration, `max.cpp` never instantiates the `int` version because nothing there asks for it, and the linker finds no symbol. Put the whole template in the header.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nauto add(auto a, auto b) { return a + b; }\n\nint main() { std::cout << add(3, 2.5); }\n```",
          options: ["`5.5`", "`5`", "Compile error: the two `auto` parameters must have the same type", "Compile error: `auto` parameters need a `template` header"],
          answer: 0,
          explanation: "Each `auto` parameter is its own template parameter, so this is `template <typename A, typename B> auto add(A, B)` and mixed types are fine. `int + double` is `double`, the return type is deduced from it, and `5.5` prints. Only a single `T` used twice would force the arguments to agree.",
        },
        {
          prompt: "In `template <typename To, typename From> To convert(const From& f);`, why is `To` declared first?",
          options: ["Return-type parameters must always come first", "Explicit arguments fill the list from the left, so the caller can name `To` and let `From` be deduced", "Deduction runs right to left", "It makes no difference; the order is a convention"],
          answer: 1,
          explanation: "`convert<double>(7)` sets `To = double` and leaves `From` to be deduced from the argument. Declared the other way round, the caller would have to spell both. Putting the non-deducible parameters first is the pattern behind `std::make_unique<T>(args…)`.",
        },
      ],
    },
    {
      slug: "class-templates",
      file: "02-class-templates.md",
      exercises: [
        {
          title: "Stack<T> for the type named on the first line",
          prompt: `Write a class template \`Stack<T>\` over a \`std::vector<T>\` with \`push\`, \`pop\`, \`top\`, \`size\` and \`print\`. Define \`pop\`, \`top\` and \`print\` **outside** the class body — each with its own \`template <typename T>\` header and the \`Stack<T>::\` qualifier. Then write a function template \`run<T>()\` that owns one \`Stack<T>\` and processes commands until the input ends; \`main\` reads the first line and calls \`run<int>()\` or \`run<std::string>()\`.

Commands, one per line: \`push <v>\`; \`pop\` (print \`popped <v>\` or \`empty\`); \`top\` (print \`top=<v>\` or \`empty\`); \`size\` (print \`size=<k>\`); \`print\` (print \`stack: <bottom> … <top>\` or \`stack: (empty)\`).

**Input:** the type word (\`int\` or \`string\`), then commands.
**Output:** one line per \`pop\`, \`top\`, \`size\` and \`print\`.

\`\`\`text
int
push 1
push 2
push 3
print
pop
top
size
\`\`\`
prints
\`\`\`text
stack: 1 2 3
popped 3
top=2
size=2
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
class Stack {
public:
    void push(const T& value) { items_.push_back(value); }
    bool pop(T& out);          // defined outside the class
    bool top(T& out) const;    // defined outside the class
    std::size_t size() const { return items_.size(); }
    void print() const;        // defined outside the class

private:
    std::vector<T> items_;
};

// TODO: template <typename T> bool Stack<T>::pop(T& out) { ... }
template <typename T>
bool Stack<T>::pop(T& out) {
    (void)out;
    return false;
}

// TODO: top and print, the same way
template <typename T>
bool Stack<T>::top(T& out) const {
    (void)out;
    return false;
}

template <typename T>
void Stack<T>::print() const {
}

template <typename T>
void run() {
    Stack<T> stack;
    std::string cmd;
    while (std::cin >> cmd) {
        // TODO: push / pop / top / size / print
    }
}

int main() {
    std::string type;
    std::cin >> type;
    // TODO: run<int>() or run<std::string>()
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
class Stack {
public:
    void push(const T& value) { items_.push_back(value); }
    bool pop(T& out);
    bool top(T& out) const;
    std::size_t size() const { return items_.size(); }
    void print() const;

private:
    std::vector<T> items_;
};

template <typename T>
bool Stack<T>::pop(T& out) {
    if (items_.empty()) return false;
    out = items_.back();
    items_.pop_back();
    return true;
}

template <typename T>
bool Stack<T>::top(T& out) const {
    if (items_.empty()) return false;
    out = items_.back();
    return true;
}

template <typename T>
void Stack<T>::print() const {
    std::cout << "stack:";
    if (items_.empty()) {
        std::cout << " (empty)\n";
        return;
    }
    for (const T& item : items_) std::cout << ' ' << item;
    std::cout << '\n';
}

template <typename T>
void run() {
    Stack<T> stack;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            T value;
            std::cin >> value;
            stack.push(value);
        } else if (cmd == "pop") {
            T value;
            if (stack.pop(value)) std::cout << "popped " << value << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "top") {
            T value;
            if (stack.top(value)) std::cout << "top=" << value << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << stack.size() << '\n';
        } else if (cmd == "print") {
            stack.print();
        }
    }
}

int main() {
    std::string type;
    std::cin >> type;
    if (type == "int") run<int>();
    else run<std::string>();
    return 0;
}
`,
          hints: [
            "Every out-of-class member starts with `template <typename T>` and names the class as `Stack<T>::`.",
            "`T value; std::cin >> value;` reads an int or a std::string alike — that is the point of writing run<T> once.",
            "pop and top return false on an empty stack so run<T> can print `empty` without touching the vector.",
          ],
          cases: [
            { stdin: "int\npush 1\npush 2\npush 3\nprint\npop\ntop\nsize\n", expected: "stack: 1 2 3\npopped 3\ntop=2\nsize=2\n" },
            { stdin: "string\npush pear\npush apple\ntop\npop\npop\npop\nprint\n", expected: "top=apple\npopped apple\npopped pear\nempty\nstack: (empty)\n" },
            { stdin: "int\ntop\npop\nsize\nprint\n", expected: "empty\nempty\nsize=0\nstack: (empty)\n", hidden: true },
            { stdin: "int\npush -5\npush 0\npop\npop\npush 7\nprint\n", expected: "popped 0\npopped -5\nstack: 7\n", hidden: true },
            { stdin: "string\npush a\npush b\nsize\nprint\npop\nprint\n", expected: "size=2\nstack: a b\npopped b\nstack: a\n", hidden: true },
          ],
        },
        {
          title: "Pair<A, B> with a default argument and CTAD",
          prompt: `Write \`template <typename A, typename B = A> struct Pair { A first; B second; Pair<B, A> swapped() const; }\` and a free function template \`print(const Pair<A, B>& p)\` that prints \`(<first>, <second>)\` and deduces \`A\` and \`B\` from the argument.

Read \`n\` (at least 1), then \`n\` lines of \`<name> <score>\` (a word and an integer). Build each entry with class template argument deduction — \`Pair entry{name, score};\` deduces \`Pair<std::string, int>\` — and keep them in a \`std::vector\`. Then print: every entry, one per line; \`swapped: \` followed by the first entry's \`swapped()\` (a \`Pair<int, std::string>\`); \`range: \` followed by a \`Pair<int>\` holding the lowest and highest score — note the single argument, so \`B\` takes its default; and \`best: \` followed by the entry with the highest score (the first one on a tie).

**Input:** \`n\`, then \`n\` lines of \`name score\`.
**Output:** \`n\` lines, then the \`swapped\`, \`range\` and \`best\` lines.

\`\`\`text
3
ada 93
bob 71
cy 88
\`\`\`
prints
\`\`\`text
(ada, 93)
(bob, 71)
(cy, 88)
swapped: (93, ada)
range: (71, 93)
best: (ada, 93)
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename A, typename B = A>
struct Pair {
    A first;
    B second;

    // TODO: Pair<B, A> swapped() const
};

// TODO: template <typename A, typename B> void print(const Pair<A, B>& p)

int main() {
    int n;
    std::cin >> n;
    std::vector<Pair<std::string, int>> entries;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int score;
        std::cin >> name >> score;
        // TODO: build the entry with CTAD and store it
    }
    // TODO: print every entry, then the swapped, range and best lines
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename A, typename B = A>
struct Pair {
    A first;
    B second;

    Pair<B, A> swapped() const { return {second, first}; }
};

template <typename A, typename B>
void print(const Pair<A, B>& p) {
    std::cout << '(' << p.first << ", " << p.second << ')';
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Pair<std::string, int>> entries;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int score;
        std::cin >> name >> score;
        Pair entry{name, score};          // CTAD: Pair<std::string, int>
        entries.push_back(entry);
    }
    for (const auto& e : entries) {
        print(e);
        std::cout << '\n';
    }
    std::cout << "swapped: ";
    print(entries.front().swapped());
    std::cout << '\n';

    Pair<int> range{entries.front().second, entries.front().second};   // B defaults to A
    std::size_t bestAt = 0;
    for (std::size_t i = 0; i < entries.size(); ++i) {
        const int s = entries[i].second;
        if (s < range.first) range.first = s;
        if (range.second < s) range.second = s;
        if (entries[bestAt].second < s) bestAt = i;
    }
    std::cout << "range: ";
    print(range);
    std::cout << "\nbest: ";
    print(entries[bestAt]);
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "swapped() returns a different instantiation of the same template: `return {second, first};` builds a Pair<B, A>.",
            "`Pair entry{name, score};` works because a struct with public members is an aggregate; CTAD reads the two initialisers.",
            "Start the range from the first score and widen it; keep the best index and replace it only on a strictly higher score.",
          ],
          cases: [
            { stdin: "3\nada 93\nbob 71\ncy 88\n", expected: "(ada, 93)\n(bob, 71)\n(cy, 88)\nswapped: (93, ada)\nrange: (71, 93)\nbest: (ada, 93)\n" },
            { stdin: "1\nzed 50\n", expected: "(zed, 50)\nswapped: (50, zed)\nrange: (50, 50)\nbest: (zed, 50)\n" },
            { stdin: "3\nann 80\nbo 80\ncat 12\n", expected: "(ann, 80)\n(bo, 80)\n(cat, 12)\nswapped: (80, ann)\nrange: (12, 80)\nbest: (ann, 80)\n", hidden: true },
            { stdin: "2\nneg -5\npos 5\n", expected: "(neg, -5)\n(pos, 5)\nswapped: (-5, neg)\nrange: (-5, 5)\nbest: (pos, 5)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector v{3};\nstd::cout << v.size();\n```",
          options: ["`3`", "`1`", "`0`", "Compile error: CTAD needs the element type"],
          answer: 1,
          explanation: "Braces prefer the `initializer_list` constructor, so this is a `std::vector<int>` holding the single element `3`. `std::vector v(3, 0)` with parentheses is three zeros. When the deduced type is not obvious from the initialiser, write it out.",
        },
        {
          prompt: "Which is the correct out-of-class definition of `pop` for `template <typename T> class Stack`?",
          options: ["`void Stack<T>::pop() { … }`", "`template <typename T> void Stack::pop() { … }`", "`template <typename T> void Stack<T>::pop() { … }`", "`template <> void Stack<T>::pop() { … }`"],
          answer: 2,
          explanation: "Outside the class there is no current instantiation to imply the arguments, so the definition repeats the template header and qualifies with `Stack<T>::`. Without the header `T` is undeclared; without `<T>` `Stack` is a template, not a class; `template <>` introduces an explicit specialisation, which needs a concrete type.",
        },
        {
          prompt: "Given `template <typename A, typename B = A> struct Pair { A first; B second; };`, what happens with `Pair<int> p{1, 2.5};`?",
          options: ["`Pair<int, double>` — `B` is deduced from `2.5`", "`Pair<int, int>`, and the initialisation fails because `2.5` narrows", "`Pair<int, int>` holding `1` and `2`", "Compile error: a defaulted parameter cannot be omitted"],
          answer: 1,
          explanation: "Class template argument deduction is all or nothing: naming one argument switches it off, so `B` takes its default `int`. Brace initialisation then rejects `2.5` as narrowing. Either write `Pair<int, double>` or `Pair p{1, 2.5}` with no arguments at all.",
        },
        {
          prompt: "Why does `typename C::value_type first = *c.begin();` need `typename` inside a template?",
          options: ["`value_type` is a reserved word", "`C::value_type` depends on `C`, and the parser assumes a dependent name is not a type unless told", "Every nested type needs `typename`, template or not", "It is optional; GCC accepts the line without it"],
          answer: 1,
          explanation: "While the template is parsed, `C` is unknown: `C::value_type` might be a type, a static member or a constant, and the grammar differs. The parser assumes \"not a type\" and stops with `need 'typename' before …`. Outside a template, or for a non-dependent name, `typename` is not required.",
        },
        {
          prompt: "`struct Widget {};` has no `operator<`. Does `Stack<Widget> s; s.push(Widget{});` compile, given that `Stack<T>` has a member `bool contains_less(const T& x) const` that uses `<`?",
          options: ["No — every member is checked when `Stack<Widget>` is instantiated", "Yes — members are instantiated only when called, and `contains_less` never is", "No — `push` needs `<` to keep the stack ordered", "Yes, but with a warning about the unusable member"],
          answer: 1,
          explanation: "A class template's member functions are instantiated one by one on first use. `push` needs only `push_back`, so the program compiles; calling `contains_less` would be the moment the missing `<` is reported. This is why `std::vector<T>` can offer `operator<` for every `T`.",
        },
        {
          prompt: "`std::map` is declared with four template parameters. Why does `std::map<std::string, int>` compile with two?",
          options: ["The compiler deduces the other two from the first two", "The last two have default arguments (`std::less<Key>` and an allocator)", "`std::map` is a partial specialisation for the two-argument form", "Two is a special case the standard allows only for `std::map`"],
          answer: 1,
          explanation: "Default template arguments work like default function arguments: trailing parameters may be omitted and take their defaults. There is no deduction involved — `std::less<Key>` and `std::allocator<…>` are spelled in the declaration.",
        },
        {
          prompt: "What does `Pair p{\"k\", 1};` deduce for `A` in `template <typename A, typename B> struct Pair { A first; B second; };`?",
          options: ["`std::string`", "`const char*`", "`char[2]`", "It is ambiguous and fails to compile"],
          answer: 1,
          explanation: "A string literal is an array of `char` that decays to `const char*` during deduction, so `A = const char*` — not the `std::string` most people expect. A deduction guide such as `Pair(const char*, B) -> Pair<std::string, B>;` steers it, or pass a `std::string` explicitly.",
        },
      ],
    },
    {
      slug: "specialisation",
      file: "03-specialisation.md",
      exercises: [
        {
          title: "Describe<T> with full specialisations",
          prompt: `Write a class template \`Describe<T>\` with one static member \`print\`. The primary template prints \`[value] <v>\`. Add three **full specialisations**: \`Describe<bool>\` prints \`[bool] true\` or \`[bool] false\`; \`Describe<const char*>\` prints \`[C string] "<v>"\`; \`Describe<std::string>\` prints \`[string] "<v>"\`. The tags are yours — never print \`typeid(T).name()\`.

Read \`n\`, then \`n\` lines of \`<kind> <token>\` with \`<kind>\` one of \`int\`, \`double\`, \`bool\` (token \`0\`, \`1\`, \`true\` or \`false\`), \`string\` and \`cstr\`. For \`cstr\` call \`Describe<const char*>::print\` with the token's \`c_str()\`, so the pointer specialisation is what runs. Doubles print with the stream's default formatting (\`2.5\` prints as \`2.5\`).

**Input:** \`n\`, then \`n\` lines of \`kind token\`.
**Output:** one line per input line.

\`\`\`text
5
int 42
double 2.5
bool 1
string hello
cstr hello
\`\`\`
prints
\`\`\`text
[value] 42
[value] 2.5
[bool] true
[string] "hello"
[C string] "hello"
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

template <typename T>
struct Describe {
    static void print(const T& v) { std::cout << "[value] " << v << '\n'; }
};

// TODO: template <> struct Describe<bool> { ... };
// TODO: template <> struct Describe<const char*> { ... };
// TODO: template <> struct Describe<std::string> { ... };

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind, token;
        std::cin >> kind >> token;
        // TODO: convert the token and call the matching Describe<...>::print
        if (kind == "int") Describe<int>::print(std::stoi(token));
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

template <typename T>
struct Describe {
    static void print(const T& v) { std::cout << "[value] " << v << '\n'; }
};

template <>
struct Describe<bool> {
    static void print(bool v) { std::cout << "[bool] " << (v ? "true" : "false") << '\n'; }
};

template <>
struct Describe<const char*> {
    static void print(const char* v) { std::cout << "[C string] \"" << v << "\"\n"; }
};

template <>
struct Describe<std::string> {
    static void print(const std::string& v) { std::cout << "[string] \"" << v << "\"\n"; }
};

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind, token;
        std::cin >> kind >> token;
        if (kind == "int") Describe<int>::print(std::stoi(token));
        else if (kind == "double") Describe<double>::print(std::stod(token));
        else if (kind == "bool") Describe<bool>::print(token == "1" || token == "true");
        else if (kind == "cstr") Describe<const char*>::print(token.c_str());
        else Describe<std::string>::print(token);
    }
    return 0;
}
`,
          hints: [
            "A full specialisation is `template <> struct Describe<bool> { … };` — an empty parameter list, then the name with the type filled in.",
            "Each specialisation is a separate class: it must declare its own print, with whatever parameter type suits it.",
            "Read the token as a std::string and convert: std::stoi, std::stod, a comparison for bool, and c_str() for the C string.",
          ],
          cases: [
            { stdin: "5\nint 42\ndouble 2.5\nbool 1\nstring hello\ncstr hello\n", expected: "[value] 42\n[value] 2.5\n[bool] true\n[string] \"hello\"\n[C string] \"hello\"\n" },
            { stdin: "2\nbool 0\nint -7\n", expected: "[bool] false\n[value] -7\n" },
            { stdin: "3\ncstr x\nstring x\ndouble 0.125\n", expected: "[C string] \"x\"\n[string] \"x\"\n[value] 0.125\n", hidden: true },
            { stdin: "2\nbool true\ndouble 3\n", expected: "[bool] true\n[value] 3\n", hidden: true },
            { stdin: "1\nbool false\n", expected: "[bool] false\n", hidden: true },
          ],
        },
        {
          title: "Partial specialisations for vectors and pairs",
          prompt: `Write a class template \`Describe<T>\` whose static \`text(const T&)\` **returns** a \`std::string\`, so specialisations can compose. The primary returns \`[value] <v>\`; the full specialisation \`Describe<std::string>\` returns \`[string] "<v>"\`. Then add three **partial specialisations**:

- \`Describe<std::vector<T>>\` returns \`[vector of <k>: <e1>, <e2>, …]\` with each element described by \`Describe<T>::text\` — or \`[vector of 0: empty]\`.
- \`Describe<std::pair<A, B>>\` returns \`[pair: <a> | <b>]\`.
- \`Describe<std::pair<T, T>>\` returns \`[same pair: <a> | <b>]\` — the more specialised pattern, chosen whenever both halves have the same type.

Read \`n\`, then \`n\` lines: \`ints <k> <v…>\` (a \`std::vector<int>\`), \`words <k> <w…>\` (a \`std::vector<std::string>\`), \`pair <int> <word>\` (a \`std::pair<int, std::string>\`), \`same <int> <int>\` (a \`std::pair<int, int>\`), \`pairs <k> <a1> <b1> …\` (a \`std::vector<std::pair<int, int>>\`). Print the description of each.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
5
ints 3 1 2 3
words 2 pear apple
pair 7 seven
same 4 5
pairs 2 1 2 3 4
\`\`\`
prints
\`\`\`text
[vector of 3: [value] 1, [value] 2, [value] 3]
[vector of 2: [string] "pear", [string] "apple"]
[pair: [value] 7 | [string] "seven"]
[same pair: [value] 4 | [value] 5]
[vector of 2: [same pair: [value] 1 | [value] 2], [same pair: [value] 3 | [value] 4]]
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

template <typename T>
struct Describe {
    static std::string text(const T& v) {
        std::ostringstream out;
        out << "[value] " << v;
        return out.str();
    }
};

template <>
struct Describe<std::string> {
    static std::string text(const std::string& v) { return "[string] \"" + v + "\""; }
};

// TODO: template <typename T> struct Describe<std::vector<T>> { ... };
// TODO: template <typename A, typename B> struct Describe<std::pair<A, B>> { ... };
// TODO: template <typename T> struct Describe<std::pair<T, T>> { ... };

template <typename T>
std::vector<T> read_vector() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& item : v) std::cin >> item;
    return v;
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        // TODO: read the value the kind names and print Describe<...>::text of it —
        //       e.g. Describe<std::vector<int>>::text(read_vector<int>()) once the vector
        //       specialisation exists (without it the primary is instantiated for a vector
        //       and its operator<< fails to compile)
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

template <typename T>
struct Describe {
    static std::string text(const T& v) {
        std::ostringstream out;
        out << "[value] " << v;
        return out.str();
    }
};

template <>
struct Describe<std::string> {
    static std::string text(const std::string& v) { return "[string] \"" + v + "\""; }
};

template <typename T>
struct Describe<std::vector<T>> {
    static std::string text(const std::vector<T>& v) {
        std::string out = "[vector of " + std::to_string(v.size()) + ": ";
        if (v.empty()) out += "empty";
        for (std::size_t i = 0; i < v.size(); ++i) {
            if (i > 0) out += ", ";
            out += Describe<T>::text(v[i]);
        }
        return out + "]";
    }
};

template <typename A, typename B>
struct Describe<std::pair<A, B>> {
    static std::string text(const std::pair<A, B>& p) {
        return "[pair: " + Describe<A>::text(p.first) + " | " + Describe<B>::text(p.second) + "]";
    }
};

template <typename T>
struct Describe<std::pair<T, T>> {
    static std::string text(const std::pair<T, T>& p) {
        return "[same pair: " + Describe<T>::text(p.first) + " | " + Describe<T>::text(p.second) + "]";
    }
};

template <typename T>
std::vector<T> read_vector() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& item : v) std::cin >> item;
    return v;
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "ints") {
            std::cout << Describe<std::vector<int>>::text(read_vector<int>()) << '\n';
        } else if (kind == "words") {
            std::cout << Describe<std::vector<std::string>>::text(read_vector<std::string>()) << '\n';
        } else if (kind == "pair") {
            std::pair<int, std::string> p;
            std::cin >> p.first >> p.second;
            std::cout << Describe<std::pair<int, std::string>>::text(p) << '\n';
        } else if (kind == "same") {
            std::pair<int, int> p;
            std::cin >> p.first >> p.second;
            std::cout << Describe<std::pair<int, int>>::text(p) << '\n';
        } else if (kind == "pairs") {
            std::size_t k;
            std::cin >> k;
            std::vector<std::pair<int, int>> v(k);
            for (auto& [a, b] : v) std::cin >> a >> b;
            std::cout << Describe<std::vector<std::pair<int, int>>>::text(v) << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "A partial specialisation keeps a template header for what is still free: `template <typename T> struct Describe<std::vector<T>>`.",
            "Inside the vector specialisation call `Describe<T>::text(v[i])` — the recursion goes back through the template, so a vector of pairs needs no extra code.",
            "`std::pair<int, int>` matches both pair patterns; the compiler picks `pair<T, T>` because it is the more specialised one.",
          ],
          cases: [
            { stdin: "5\nints 3 1 2 3\nwords 2 pear apple\npair 7 seven\nsame 4 5\npairs 2 1 2 3 4\n", expected: "[vector of 3: [value] 1, [value] 2, [value] 3]\n[vector of 2: [string] \"pear\", [string] \"apple\"]\n[pair: [value] 7 | [string] \"seven\"]\n[same pair: [value] 4 | [value] 5]\n[vector of 2: [same pair: [value] 1 | [value] 2], [same pair: [value] 3 | [value] 4]]\n" },
            { stdin: "2\nints 0\nwords 1 solo\n", expected: "[vector of 0: empty]\n[vector of 1: [string] \"solo\"]\n" },
            { stdin: "2\nsame -1 -1\npair 0 zero\n", expected: "[same pair: [value] -1 | [value] -1]\n[pair: [value] 0 | [string] \"zero\"]\n", hidden: true },
            { stdin: "1\npairs 0\n", expected: "[vector of 0: empty]\n", hidden: true },
            { stdin: "2\npairs 1 9 8\nints 2 5 5\n", expected: "[vector of 1: [same pair: [value] 9 | [value] 8]]\n[vector of 2: [value] 5, [value] 5]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <typename T> struct Tag { static constexpr const char* value = \"generic\"; };\ntemplate <> struct Tag<int> { static constexpr const char* value = \"int\"; };\ntemplate <typename T> struct Tag<T*> { static constexpr const char* value = \"pointer\"; };\n\nint main() {\n    std::cout << Tag<int*>::value << ' ' << Tag<const char*>::value << ' ' << Tag<long>::value;\n}\n```",
          options: ["`int pointer generic`", "`pointer pointer generic`", "`pointer generic generic`", "`int generic generic`"],
          answer: 1,
          explanation: "`Tag<int*>` matches the pointer pattern with `T = int` — the full specialisation is for `int`, not `int*`. `const char*` is also a pointer (`T = const char`), and `long` matches nothing special, so the primary answers. Patterns match the *shape* of the argument.",
        },
        {
          prompt: "The primary `template <typename T> struct Box` has members `get`, `set` and `reset`. The full specialisation `template <> struct Box<bool>` defines only `get`. Which members does `Box<bool>` have?",
          options: ["`get`, `set` and `reset` — the other two are inherited from the primary", "Only `get`", "`get` from the specialisation and `set`/`reset` from the primary, but only when called", "It is a compile error to specialise with fewer members"],
          answer: 1,
          explanation: "An explicit specialisation is a separate class that replaces the primary for that argument; it inherits nothing. `Box<bool>` has exactly what it declares. Keeping the interface identical is your discipline, not the compiler's — or specialise a single member instead of the whole class.",
        },
        {
          prompt: "Both `template <typename A, typename B> struct D<std::pair<A, B>>` and `template <typename T> struct D<std::pair<T, T>>` exist. What does `D<std::pair<int, int>>` use?",
          options: ["The `<A, B>` version — it was declared first", "The `<T, T>` version — it is more specialised", "Neither — the use is ambiguous and fails", "The primary template, because two partial specialisations conflict"],
          answer: 1,
          explanation: "When several partial specialisations match, the most specialised wins: every `pair<T, T>` is a `pair<A, B>` but not the reverse, so `<T, T>` is chosen. Ambiguity arises only when neither pattern subsumes the other.",
        },
        {
          prompt: "How do you give a function template `template <typename T> void show(const T&)` a different body for every `std::vector<T>`?",
          options: ["`template <typename T> void show<std::vector<T>>(const std::vector<T>&)`", "Write a second template `template <typename T> void show(const std::vector<T>&)` — an overload", "`template <> void show<std::vector>(…)`", "It cannot be done; use a class template instead"],
          answer: 1,
          explanation: "Function templates do not partially specialise — the first spelling is a syntax error. A second template with a more specific parameter is an ordinary overload and takes part in overload resolution, which is exactly what you want.",
        },
        {
          prompt: "Given, in this order: `template <class T> void f(T);`, `template <> void f<>(int*);`, `template <class T> void f(T*);` — what does `int* p; f(p);` call?",
          options: ["The specialisation `f<>(int*)`", "The second primary, `f(T*)`, with `T = int`", "The first primary, `f(T)`, with `T = int*`", "It is ambiguous"],
          answer: 1,
          explanation: "A full specialisation is not an overload candidate. Resolution chooses among the primaries first — `f(T*)` is the better match for a pointer — and only then looks for a specialisation *of that primary*; the specialisation belongs to the other one and is never considered. A plain overload `void f(int*)` would have won outright.",
        },
        {
          prompt: "Why does the lesson tell you never to print `typeid(T).name()`?",
          options: ["It throws for fundamental types", "It returns the mangled, compiler-specific name (`i` for `int`, `PKc` for `const char*`)", "It requires RTTI, which templates disable", "It is only valid for polymorphic classes"],
          answer: 1,
          explanation: "`name()` is whatever the implementation chooses — GCC and Clang return the mangled form, MSVC something else — so it is never a string you want in output. A trait such as `TypeName<T>::value` gives you the words you chose.",
        },
        {
          prompt: "A header uses `Describe<bool>::print(true)` on line 10 and declares `template <> struct Describe<bool>` on line 30. What happens?",
          options: ["It works; specialisations are found by name lookup at the end of the translation unit", "Compile error: specialisation of `Describe<bool>` after instantiation", "Line 10 uses the primary and line 30 silently defines an unused class", "Undefined behaviour"],
          answer: 1,
          explanation: "Line 10 instantiates the primary for `bool`; a specialisation that arrives afterwards would contradict code already generated, so the compiler refuses it. Declare specialisations right after the primary, before any use.",
        },
      ],
    },
    {
      slug: "non-type-and-variadic-templates",
      file: "04-non-type-and-variadic-templates.md",
      exercises: [
        {
          title: "Ring<T, N> with the capacity chosen at run time",
          prompt: `Write \`template <typename T, std::size_t N> class Ring\` — a fixed-capacity buffer over a \`std::array<T, N>\` that overwrites its oldest entry when full — with \`push\`, \`size\`, \`at(i)\` (\`0\` is the oldest) and a \`static constexpr std::size_t capacity = N\`. Then a function template \`run<N>()\` that prints \`capacity=<N>\` from \`Ring<int, N>::capacity\` and processes commands.

The first line is the capacity, one of \`2\`, \`4\` or \`8\`. It is read at run time, so it cannot be a template argument directly: dispatch to \`run<2>()\`, \`run<4>()\` or \`run<8>()\`. Commands: \`push <v>\`; \`size\` (print \`size=<k>\`); \`oldest\` (print \`oldest=<v>\` or \`empty\`); \`print\` (print \`ring: <oldest> … <newest>\` or \`ring: (empty)\`).

**Input:** the capacity, then commands.
**Output:** \`capacity=<N>\` first, then one line per \`size\`, \`oldest\` and \`print\`.

\`\`\`text
4
push 1
push 2
push 3
push 4
push 5
print
size
oldest
\`\`\`
prints
\`\`\`text
capacity=4
ring: 2 3 4 5
size=4
oldest=2
\`\`\``,
          starter: String.raw`#include <array>
#include <cstddef>
#include <iostream>
#include <string>

template <typename T, std::size_t N>
class Ring {
public:
    static constexpr std::size_t capacity = N;

    void push(const T& value) {
        // TODO: write at (start_ + size_) % N; grow size_ until N, then advance start_
        (void)value;
    }
    std::size_t size() const { return size_; }
    const T& at(std::size_t i) const { return data_[(start_ + i) % N]; }

private:
    std::array<T, N> data_{};
    std::size_t start_ = 0;
    std::size_t size_ = 0;
};

template <std::size_t N>
void run() {
    Ring<int, N> ring;
    std::cout << "capacity=" << Ring<int, N>::capacity << '\n';
    std::string cmd;
    while (std::cin >> cmd) {
        // TODO: push / size / oldest / print
    }
}

int main() {
    int n;
    std::cin >> n;
    // TODO: dispatch to run<2>(), run<4>() or run<8>()
    (void)n;
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <cstddef>
#include <iostream>
#include <string>

template <typename T, std::size_t N>
class Ring {
public:
    static constexpr std::size_t capacity = N;

    void push(const T& value) {
        data_[(start_ + size_) % N] = value;
        if (size_ < N) ++size_;
        else start_ = (start_ + 1) % N;     // full: the slot just written was the oldest
    }
    std::size_t size() const { return size_; }
    const T& at(std::size_t i) const { return data_[(start_ + i) % N]; }

private:
    std::array<T, N> data_{};
    std::size_t start_ = 0;
    std::size_t size_ = 0;
};

template <std::size_t N>
void run() {
    Ring<int, N> ring;
    std::cout << "capacity=" << Ring<int, N>::capacity << '\n';
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int v;
            std::cin >> v;
            ring.push(v);
        } else if (cmd == "size") {
            std::cout << "size=" << ring.size() << '\n';
        } else if (cmd == "oldest") {
            if (ring.size() == 0) std::cout << "empty\n";
            else std::cout << "oldest=" << ring.at(0) << '\n';
        } else if (cmd == "print") {
            std::cout << "ring:";
            if (ring.size() == 0) std::cout << " (empty)";
            for (std::size_t i = 0; i < ring.size(); ++i) std::cout << ' ' << ring.at(i);
            std::cout << '\n';
        }
    }
}

int main() {
    int n;
    std::cin >> n;
    if (n == 2) run<2>();
    else if (n == 8) run<8>();
    else run<4>();
    return 0;
}
`,
          hints: [
            "The next free slot is (start_ + size_) % N; when the ring is full that slot holds the oldest entry, so writing it and advancing start_ is the overwrite.",
            "N is a compile-time constant inside the class; the run-time value from the input only chooses which of three instantiations to call.",
            "Ring<int, 2>, Ring<int, 4> and Ring<int, 8> are three unrelated types — the loop lives inside run<N> so it is written once.",
          ],
          cases: [
            { stdin: "4\npush 1\npush 2\npush 3\npush 4\npush 5\nprint\nsize\noldest\n", expected: "capacity=4\nring: 2 3 4 5\nsize=4\noldest=2\n" },
            { stdin: "2\nprint\npush 10\npush 20\npush 30\nprint\n", expected: "capacity=2\nring: (empty)\nring: 20 30\n" },
            { stdin: "8\npush 1\npush 2\nsize\nprint\n", expected: "capacity=8\nsize=2\nring: 1 2\n", hidden: true },
            { stdin: "4\noldest\nsize\n", expected: "capacity=4\nempty\nsize=0\n", hidden: true },
            { stdin: "2\npush -1\npush -2\npush -3\npush -4\npush -5\noldest\nprint\n", expected: "capacity=2\noldest=-4\nring: -4 -5\n", hidden: true },
          ],
        },
        {
          title: "A variadic report built from fold expressions",
          prompt: `Write \`template <typename... Ts> void report(Ts... xs)\` that prints one line: \`args=<count> [<x1> <x2> …] sum=<s> all_positive=<yes|no>\`. The count is \`sizeof...(xs)\`; the values are printed by a fold over the comma operator with a single space between them (and \`[]\` for no values); \`sum\` is a **binary** fold \`(0LL + ... + xs)\` so that an empty pack sums to 0 and large values do not overflow \`int\`; \`all_positive\` is the fold \`(... && (xs > 0))\`, which is \`yes\` for an empty pack. No loops over the pack, no recursion — folds only.

Read \`n\`, then \`n\` lines of \`<k> <v1> … <vk>\` with \`k\` from 0 to 4 and integer values. A pack's size is fixed at compile time, so read the values into an array and dispatch on \`k\`: \`report()\`, \`report(v[0])\`, \`report(v[0], v[1])\` and so on — five instantiations of one template.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
4
3 1 2 3
0
2 -1 5
1 7
\`\`\`
prints
\`\`\`text
args=3 [1 2 3] sum=6 all_positive=yes
args=0 [] sum=0 all_positive=yes
args=2 [-1 5] sum=4 all_positive=no
args=1 [7] sum=7 all_positive=yes
\`\`\``,
          starter: String.raw`#include <array>
#include <cstddef>
#include <iostream>

template <typename... Ts>
void report(Ts... xs) {
    // TODO: args=<sizeof...(xs)> [values] sum=<binary fold> all_positive=<&& fold>
    (void)sizeof...(xs);
    std::cout << '\n';
}

int main() {
    int n;
    std::cin >> n;
    for (int line = 0; line < n; ++line) {
        int k;
        std::cin >> k;
        std::array<long long, 4> v{};
        for (int i = 0; i < k; ++i) std::cin >> v[i];
        // TODO: dispatch on k to report() ... report(v[0], v[1], v[2], v[3])
    }
    return 0;
}
`,
          solution: String.raw`#include <array>
#include <cstddef>
#include <iostream>

template <typename... Ts>
void report(Ts... xs) {
    std::cout << "args=" << sizeof...(xs) << " [";
    [[maybe_unused]] std::size_t i = 0;
    ((std::cout << (i++ ? " " : "") << xs), ...);          // comma fold: one print per element
    const long long sum = (0LL + ... + xs);                  // binary left fold: legal on an empty pack
    const bool allPositive = (... && (xs > 0));              // && folds an empty pack to true
    std::cout << "] sum=" << sum << " all_positive=" << (allPositive ? "yes" : "no") << '\n';
}

int main() {
    int n;
    std::cin >> n;
    for (int line = 0; line < n; ++line) {
        int k;
        std::cin >> k;
        std::array<long long, 4> v{};
        for (int i = 0; i < k; ++i) std::cin >> v[i];
        if (k == 0) report();
        else if (k == 1) report(v[0]);
        else if (k == 2) report(v[0], v[1]);
        else if (k == 3) report(v[0], v[1], v[2]);
        else report(v[0], v[1], v[2], v[3]);
    }
    return 0;
}
`,
          hints: [
            "A comma fold runs one expression per element: `((std::cout << xs << ' '), ...)`; a counter decides whether to print the separator first.",
            "`(xs + ...)` fails on an empty pack; `(0LL + ... + xs)` supplies the starting value and is what report() with no arguments needs.",
            "Parenthesise the pattern inside a fold: `(... && (xs > 0))`, not `(... && xs > 0)`.",
          ],
          cases: [
            { stdin: "4\n3 1 2 3\n0\n2 -1 5\n1 7\n", expected: "args=3 [1 2 3] sum=6 all_positive=yes\nargs=0 [] sum=0 all_positive=yes\nargs=2 [-1 5] sum=4 all_positive=no\nargs=1 [7] sum=7 all_positive=yes\n" },
            { stdin: "1\n4 10 20 30 40\n", expected: "args=4 [10 20 30 40] sum=100 all_positive=yes\n" },
            { stdin: "2\n2 2000000000 2000000000\n1 0\n", expected: "args=2 [2000000000 2000000000] sum=4000000000 all_positive=yes\nargs=1 [0] sum=0 all_positive=no\n", hidden: true },
            { stdin: "2\n4 -1 -2 -3 -4\n0\n", expected: "args=4 [-1 -2 -3 -4] sum=-10 all_positive=no\nargs=0 [] sum=0 all_positive=yes\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\nint n;\nstd::cin >> n;\nRing<int, n> r;\n```",
          options: ["A ring of `n` slots is created", "Compile error: `n` is not usable in a constant expression", "Undefined behaviour if `n` is 0", "It compiles only with `-O2`"],
          answer: 1,
          explanation: "A non-type template argument must be a constant expression, and a value read at run time is not one. Dispatch to a few fixed instantiations (`if (n == 4) run<4>();`) or use a `std::vector` when the size truly comes from input.",
        },
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <typename... Ts>\nauto diff(Ts... xs) { return (xs - ...); }\n\nint main() { std::cout << diff(10, 3, 2); }\n```",
          options: ["`5`", "`9`", "`-5`", "Compile error: `-` cannot be folded"],
          answer: 1,
          explanation: "`(xs - ...)` is a unary *right* fold: `10 - (3 - 2)` = 9. The left fold `(... - xs)` would give `(10 - 3) - 2` = 5. The two forms differ only for non-associative operators, which is exactly when you must read the dots carefully.",
        },
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <typename... Ts>\nbool all(Ts... flags) { return (... && flags); }\n\nint main() { std::cout << all(); }\n```",
          options: ["`1`", "`0`", "Compile error: an empty pack cannot be folded", "Nothing — the function is never instantiated"],
          answer: 0,
          explanation: "Only `&&`, `||` and `,` may fold an empty pack unaided, and `&&` gives `true`. The same call with `(flags + ...)` would be a compile error; `(0 + ... + flags)` would print `0`.",
        },
        {
          prompt: "Which expression gives the number of elements in the pack `Ts`?",
          options: ["`sizeof(Ts)...`", "`sizeof...(Ts)`", "`Ts::size()`", "`sizeof(Ts...)`"],
          answer: 1,
          explanation: "`sizeof...(Ts)` counts the pack. `sizeof(Ts)...` is a pack expansion producing a *list* of sizes, one per type, and the last option is a syntax error.",
        },
        {
          prompt: "Given a pack `args` of three values, what is the difference between `f(args...)` and `f(args)...`?",
          options: ["None — they are two spellings of the same expansion", "`f(args...)` calls `f` once with three arguments; `f(args)...` expands to three calls, one per element", "`f(args)...` is invalid outside a fold", "`f(args...)` calls `f` three times"],
          answer: 1,
          explanation: "The dots expand whatever pattern precedes them. `args...` expands the pack inside one argument list; `f(args)...` makes the whole call the pattern, so it becomes `f(a1), f(a2), f(a3)`. Writing one when you meant the other is the classic variadic mistake.",
        },
        {
          prompt: "Why does `std::array<int, 4>` have no data member holding its size?",
          options: ["It stores the size in the first slot", "The size is the non-type argument `4`, part of the type, so `size()` returns a constant", "It computes the size from `sizeof` at run time", "It does; `sizeof(std::array<int, 4>)` is 24 on this platform"],
          answer: 1,
          explanation: "`N` is baked into the type, so `std::array<int, 4>` is exactly four `int`s — 16 bytes on this platform — and `size()` is a `constexpr` function returning `N`. That is why `std::array<int, 4>` and `std::array<int, 8>` are unrelated types.",
        },
        {
          prompt: "What does the recursive `print(const First& first, const Rest&... rest)` need that the fold version does not?",
          options: ["A `template <>` specialisation for one argument", "A non-template `print()` overload for the empty pack, or an `if constexpr` guard on the recursive call", "A `sizeof...` check before every output", "Nothing — recursion over a pack ends by itself"],
          answer: 1,
          explanation: "Each call peels one element and recurses with one fewer; the last call is `print()` with an empty pack, and without a candidate for it the compiler reports `no matching function`. A comma fold `((std::cout << xs << ' '), ...)` does the same work in one expression and has no base case to forget.",
        },
      ],
    },
    {
      slug: "concepts-and-constraints",
      file: "05-concepts-and-constraints.md",
      exercises: [
        {
          title: "average chosen by std::integral and std::floating_point",
          prompt: `Write three overloads of \`average(const std::vector<T>& v)\`. \`template <std::integral T>\` sums into a \`long long\` and prints \`integral: sum=<sum> mean=<mean>\`; \`template <std::floating_point T>\` sums into a \`double\` and prints \`floating: sum=<sum> mean=<mean>\`; the unconstrained \`template <typename T>\` prints \`unconstrained: no average for <k> values\`. Means and floating sums have two decimals. For an \`int\` vector the first and third overloads both match — the constrained one wins the tie.

Read \`n\`, then \`n\` lines of \`<type> <k> <v1> … <vk>\` where \`<type>\` is \`int\`, \`double\` or \`string\`; \`k\` is at least 1 for the numeric types. A helper \`handle<T>()\` reads the vector and calls \`average\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
3
int 4 1 2 3 4
double 2 1.5 2.5
string 2 pear apple
\`\`\`
prints
\`\`\`text
integral: sum=10 mean=2.50
floating: sum=4.00 mean=2.00
unconstrained: no average for 2 values
\`\`\``,
          starter: String.raw`#include <concepts>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// TODO: template <std::integral T> void average(const std::vector<T>& v)
// TODO: template <std::floating_point T> void average(const std::vector<T>& v)

template <typename T>
void average(const std::vector<T>& v) {
    std::cout << "unconstrained: no average for " << v.size() << " values\n";
}

template <typename T>
void handle() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    average(v);
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        // TODO: handle<int>(), handle<double>() or handle<std::string>()
    }
    return 0;
}
`,
          solution: String.raw`#include <concepts>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

template <std::integral T>
void average(const std::vector<T>& v) {
    long long sum = 0;
    for (T x : v) sum += x;
    std::cout << "integral: sum=" << sum << " mean=" << std::fixed << std::setprecision(2)
              << static_cast<double>(sum) / static_cast<double>(v.size()) << '\n';
}

template <std::floating_point T>
void average(const std::vector<T>& v) {
    double sum = 0.0;
    for (T x : v) sum += x;
    std::cout << "floating: sum=" << std::fixed << std::setprecision(2) << sum
              << " mean=" << sum / static_cast<double>(v.size()) << '\n';
}

template <typename T>
void average(const std::vector<T>& v) {
    std::cout << "unconstrained: no average for " << v.size() << " values\n";
}

template <typename T>
void handle() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    average(v);
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        if (type == "int") handle<int>();
        else if (type == "double") handle<double>();
        else handle<std::string>();
    }
    return 0;
}
`,
          hints: [
            "`template <std::integral T>` is the shorthand for `template <typename T> requires std::integral<T>`; both need <concepts>.",
            "Keep the unconstrained overload: std::string matches only it, and the constrained ones beat it for numbers without any ordering tricks.",
            "Cast the long long sum to double before dividing so the integral mean is not truncated.",
          ],
          cases: [
            { stdin: "3\nint 4 1 2 3 4\ndouble 2 1.5 2.5\nstring 2 pear apple\n", expected: "integral: sum=10 mean=2.50\nfloating: sum=4.00 mean=2.00\nunconstrained: no average for 2 values\n" },
            { stdin: "1\nint 3 -1 -2 -3\n", expected: "integral: sum=-6 mean=-2.00\n" },
            { stdin: "2\nint 2 2000000000 2000000000\ndouble 1 0.1\n", expected: "integral: sum=4000000000 mean=2000000000.00\nfloating: sum=0.10 mean=0.10\n", hidden: true },
            { stdin: "2\nstring 0\nint 1 7\n", expected: "unconstrained: no average for 0 values\nintegral: sum=7 mean=7.00\n", hidden: true },
            { stdin: "1\ndouble 3 1 2 4\n", expected: "floating: sum=7.00 mean=2.33\n", hidden: true },
          ],
        },
        {
          title: "A Shape concept written as a requires expression",
          prompt: `Write a concept \`Shape\` with a \`requires\` expression: for a \`const S& s\`, \`s.area()\` must be valid with a result convertible to \`double\`, and \`s.name()\` must return exactly \`std::string\` (\`-> std::same_as<std::string>\`). Define \`Circle\` (radius; area \`pi * r * r\` with \`std::numbers::pi\`), \`Rect\` (width and height) and \`Square\` (side) so they satisfy it, and add \`static_assert(Shape<Circle>)\` and \`static_assert(!Shape<int>)\`. Write \`void report(const Shape auto& s)\` — constrained \`auto\` — that prints \`<name>: area=<area>\`.

Read \`n\` (at least 1), then \`n\` lines: \`circle <r>\`, \`rect <w> <h>\` or \`square <s>\`. Report each shape as it is read; after the last, print \`total=<sum of areas>\` and \`largest=#<index> <name>\` for the shape with the largest area (1-based index; the first on a tie). All areas have two decimals.

**Input:** \`n\`, then \`n\` shape lines.
**Output:** \`n\` report lines, then \`total=…\` and \`largest=…\`.

\`\`\`text
3
circle 2
rect 3 4
square 3
\`\`\`
prints
\`\`\`text
circle: area=12.57
rect: area=12.00
square: area=9.00
total=33.57
largest=#1 circle
\`\`\``,
          starter: String.raw`#include <concepts>
#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>

// TODO: template <typename S> concept Shape = requires(const S& s) { ... };

struct Circle {
    double r;
    // TODO: area() and name()
};

struct Rect {
    double w, h;
    // TODO: area() and name()
};

struct Square {
    double side;
    // TODO: area() and name()
};

// TODO: static_assert(Shape<Circle>); static_assert(!Shape<int>);

// TODO: void report(const Shape auto& s) — prints "<name>: area=<area>"

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    for (int i = 1; i <= n; ++i) {
        std::string kind;
        std::cin >> kind;
        // TODO: read the shape, report it, accumulate the total and track the largest
    }
    // TODO: total=... and largest=#<index> <name>
    return 0;
}
`,
          solution: String.raw`#include <concepts>
#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>

template <typename S>
concept Shape = requires(const S& s) {
    { s.area() } -> std::convertible_to<double>;
    { s.name() } -> std::same_as<std::string>;
};

struct Circle {
    double r;
    double area() const { return std::numbers::pi * r * r; }
    std::string name() const { return "circle"; }
};

struct Rect {
    double w, h;
    double area() const { return w * h; }
    std::string name() const { return "rect"; }
};

struct Square {
    double side;
    double area() const { return side * side; }
    std::string name() const { return "square"; }
};

static_assert(Shape<Circle> && Shape<Rect> && Shape<Square>);
static_assert(!Shape<int>);
static_assert(!Shape<std::string>);

void report(const Shape auto& s) {
    std::cout << s.name() << ": area=" << s.area() << '\n';
}

struct Tally {
    double total = 0.0;
    double largestArea = -1.0;
    std::string largest;
};

void account(const Shape auto& s, int index, Tally& tally) {
    report(s);
    const std::floating_point auto area = s.area();
    tally.total += area;
    if (tally.largestArea < area) {
        tally.largestArea = area;
        tally.largest = "#" + std::to_string(index) + " " + s.name();
    }
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    Tally tally;
    for (int i = 1; i <= n; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "circle") {
            double r;
            std::cin >> r;
            account(Circle{r}, i, tally);
        } else if (kind == "rect") {
            double w, h;
            std::cin >> w >> h;
            account(Rect{w, h}, i, tally);
        } else {
            double s;
            std::cin >> s;
            account(Square{s}, i, tally);
        }
    }
    std::cout << "total=" << tally.total << '\n';
    std::cout << "largest=" << tally.largest << '\n';
    return 0;
}
`,
          hints: [
            "A compound requirement is `{ s.area() } -> std::convertible_to<double>;` — the braces, the arrow and the trailing semicolon are all part of the syntax.",
            "`-> std::same_as<std::string>` means exactly std::string; a name() returning const char* would not satisfy it.",
            "One helper taking `const Shape auto&` can report, add to the total and track the largest for all three structs — that is the point of the concept.",
          ],
          cases: [
            { stdin: "3\ncircle 2\nrect 3 4\nsquare 3\n", expected: "circle: area=12.57\nrect: area=12.00\nsquare: area=9.00\ntotal=33.57\nlargest=#1 circle\n" },
            { stdin: "1\nsquare 2.5\n", expected: "square: area=6.25\ntotal=6.25\nlargest=#1 square\n" },
            { stdin: "2\nrect 2 2\nsquare 2\n", expected: "rect: area=4.00\nsquare: area=4.00\ntotal=8.00\nlargest=#1 rect\n", hidden: true },
            { stdin: "3\ncircle 0\nrect 0.5 0.5\nsquare 1\n", expected: "circle: area=0.00\nrect: area=0.25\nsquare: area=1.00\ntotal=1.25\nlargest=#3 square\n", hidden: true },
            { stdin: "2\ncircle 1\ncircle 1.5\n", expected: "circle: area=3.14\ncircle: area=7.07\ntotal=10.21\nlargest=#2 circle\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <std::integral T> void classify(T) { std::cout << \"integral\"; }\ntemplate <typename T>       void classify(T) { std::cout << \"other\"; }\n\nint main() { classify(true); }\n```",
          options: ["`integral`", "`other`", "Compile error: ambiguous call", "Compile error: `bool` is not a template argument"],
          answer: 0,
          explanation: "`bool` (and `char`) satisfy `std::integral` — they are integer types to the language. Both templates match equally well and the constrained one wins the tie. Add `&& !std::same_as<T, bool>` when a boolean must not count.",
        },
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <std::integral T>        void f(T) { std::cout << \"integral\"; }\ntemplate <std::signed_integral T> void f(T) { std::cout << \"signed\"; }\n\nint main() { f(7); }\n```",
          options: ["`integral`", "`signed`", "Compile error: ambiguous call", "Compile error: two templates cannot share constraints"],
          answer: 1,
          explanation: "`std::signed_integral<T>` is defined as `std::integral<T> && std::is_signed_v<T>`, so it subsumes `std::integral` and the more constrained overload wins. `f(7u)` would print `integral`. Subsumption works only through named concepts built from one another.",
        },
        {
          prompt: "Two overloads are constrained with identical inline expressions: `requires requires(T a) { a + a; }`. What happens when a call matches both?",
          options: ["The first declared wins", "The call is ambiguous — inline `requires` expressions never subsume each other, even when textually identical", "The compiler merges them into one overload", "The last declared wins"],
          answer: 1,
          explanation: "The subsumption rule compares *named* concept atoms; two hand-written `requires` expressions are always different atoms. Name the concept and build the specific one from the general one, and the compiler can prove which is more constrained.",
        },
        {
          prompt: "`concept Addable = requires(T a, T b) { { a + b } -> std::convertible_to<T>; };` — is `Addable<std::string>` satisfied?",
          options: ["No — addition is a numeric operation", "Yes — `+` concatenates and the result is a `std::string`", "No — `std::string` is a class type", "It is a compile error to test a concept on a class"],
          answer: 1,
          explanation: "A concept checks that the code is *valid*, not that it means what you intend. `a + b` compiles for two strings and yields a `std::string`, so the requirement holds. Whether a generic `sum` should concatenate is a decision the concept cannot make for you.",
        },
        {
          prompt: "Which three spellings declare the same constrained template?",
          options: ["`requires T`, `template <T>`, `T auto`", "`template <typename T> requires std::integral<T>`, `template <std::integral T>`, `void f(std::integral auto v)`", "`std::integral<T>`, `std::integral T`, `std::integral(T)`", "`concept T`, `typename T`, `auto T`"],
          answer: 1,
          explanation: "A `requires` clause after the template header, a concept in place of `typename`, and a concept in front of an `auto` parameter all attach the same constraint. `requires T` is an error — a constraint must be a `bool` expression — and the other options are not C++.",
        },
        {
          prompt: "In `describe`, why does the first branch not break compilation for a `std::string` argument?\n\n```cpp\ntemplate <typename T>\nstd::string describe(const T& v) {\n    if constexpr (std::integral<T>) return \"integral \" + std::to_string(v);\n    else return \"something else\";\n}\n```",
          options: ["`std::to_string` has an overload for `std::string`", "`if constexpr` discards the branch whose condition is false, so `std::to_string(v)` is never instantiated for `std::string`", "The compiler evaluates the condition at run time and skips the call", "It does break; the function fails to compile for `std::string`"],
          answer: 1,
          explanation: "For `T = std::string` the condition is `false` at compile time and the whole first branch is discarded — not instantiated at all. A plain `if` would compile both branches for every `T` and `std::to_string(std::string)` does not exist.",
        },
        {
          prompt: "What is the difference between `{ s.name() } -> std::same_as<std::string>;` and `{ s.name() } -> std::convertible_to<std::string>;`?",
          options: ["None — both accept any type that can become a `std::string`", "`same_as` requires exactly `std::string`; `convertible_to` also admits `const char*` and anything else that converts", "`same_as` is a run-time check, `convertible_to` a compile-time one", "`convertible_to` is stricter"],
          answer: 1,
          explanation: "The return-type check applies a concept to the expression's type. `std::same_as<std::string>` holds only for `std::string` itself; `std::convertible_to<std::string>` is satisfied by `const char*`, `std::string_view`-like types with a conversion, and so on.",
        },
      ],
    },
    {
      slug: "type-traits-and-metaprogramming",
      file: "06-type-traits-and-metaprogramming.md",
      exercises: [
        {
          title: "An if constexpr dispatcher over a forwarding reference",
          prompt: `Write \`template <typename T> void describe(T&& v)\` — a **forwarding reference**, so that for an lvalue \`std::string\` the parameter \`T\` deduces as \`std::string&\`. Strip it first with \`using U = std::remove_cvref_t<T>;\` and dispatch on \`U\` with \`if constexpr\`, in this order: \`std::is_same_v<U, bool>\` prints \`bool true\` or \`bool false\`; \`std::is_integral_v<U>\` prints \`integral <v> even\` or \`integral <v> odd\`; \`std::is_floating_point_v<U>\` prints \`floating <std::llround(v)>\`; \`std::is_same_v<U, std::string>\` prints \`text of <size> chars\`; anything else prints \`other\`. The \`bool\` test must come before the integral one, because \`bool\` is integral.

Read \`n\`, then \`n\` lines of \`<kind> <value>\`: \`int\`, \`double\`, \`string\`, \`bool\` (\`0\`/\`1\`), \`char\` (one character — it is integral too, and prints as a character), and \`pair <a> <b>\` (a \`std::pair<int, int>\`, which is \`other\`). Read each value into a variable and call \`describe(variable)\` on it.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
6
int 42
double 2.5
string hello
bool 1
char x
pair 1 2
\`\`\`
prints
\`\`\`text
integral 42 even
floating 3
text of 5 chars
bool true
integral x even
other
\`\`\``,
          starter: String.raw`#include <cmath>
#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

template <typename T>
void describe(T&& v) {
    using U = std::remove_cvref_t<T>;
    // TODO: if constexpr chain on U — bool, integral, floating point, std::string, other
    (void)v;
    std::cout << "other\n";
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        // TODO: read the value of the named kind into a variable and call describe on it
        if (kind == "int") {
            int v;
            std::cin >> v;
            describe(v);
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <cmath>
#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

template <typename T>
void describe(T&& v) {
    using U = std::remove_cvref_t<T>;          // T is std::string& for an lvalue: strip before testing
    if constexpr (std::is_same_v<U, bool>) {
        std::cout << "bool " << (v ? "true" : "false") << '\n';
    } else if constexpr (std::is_integral_v<U>) {
        std::cout << "integral " << v << (v % 2 == 0 ? " even" : " odd") << '\n';
    } else if constexpr (std::is_floating_point_v<U>) {
        std::cout << "floating " << std::llround(v) << '\n';
    } else if constexpr (std::is_same_v<U, std::string>) {
        std::cout << "text of " << v.size() << " chars\n";
    } else {
        std::cout << "other\n";
    }
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "int") {
            int v;
            std::cin >> v;
            describe(v);
        } else if (kind == "double") {
            double v;
            std::cin >> v;
            describe(v);
        } else if (kind == "string") {
            std::string v;
            std::cin >> v;
            describe(v);
        } else if (kind == "bool") {
            bool v;
            std::cin >> v;
            describe(v);
        } else if (kind == "char") {
            char v;
            std::cin >> v;
            describe(v);
        } else {
            std::pair<int, int> v;
            std::cin >> v.first >> v.second;
            describe(v);
        }
    }
    return 0;
}
`,
          hints: [
            "Test `std::is_same_v<U, bool>` before `std::is_integral_v<U>`, or every bool prints as `integral 1 odd`.",
            "Each if constexpr branch is compiled only for the types that reach it, so `v % 2` and `v.size()` can sit in the same function.",
            "`char v; std::cin >> v;` reads one non-space character; it is integral, and `v % 2` uses its character code.",
          ],
          cases: [
            { stdin: "6\nint 42\ndouble 2.5\nstring hello\nbool 1\nchar x\npair 1 2\n", expected: "integral 42 even\nfloating 3\ntext of 5 chars\nbool true\nintegral x even\nother\n" },
            { stdin: "2\nint -7\nbool 0\n", expected: "integral -7 odd\nbool false\n" },
            { stdin: "3\nchar a\ndouble -2.5\nstring x\n", expected: "integral a odd\nfloating -3\ntext of 1 chars\n", hidden: true },
            { stdin: "3\ndouble 0.49\nint 0\npair -1 -1\n", expected: "floating 0\nintegral 0 even\nother\n", hidden: true },
          ],
        },
        {
          title: "Pick the accumulator with std::conditional_t",
          prompt: `Write an alias template \`Accumulator<T>\` = \`std::conditional_t<std::is_integral_v<T>, long long, double>\` and a function template \`total(const std::vector<T>&)\` that returns \`Accumulator<T>\` — the sum of the elements in the wider type. Print each result as \`<kind>: sum=<sum> accumulator=<long long|double>\`, deciding the label with \`std::is_same_v<Accumulator<T>, long long>\` in an \`if constexpr\`; a \`double\` sum has two decimals.

Read \`n\`, then \`n\` lines of \`<kind> <k> <v1> … <vk>\` where \`<kind>\` is \`int\`, \`char\` (single characters, summed by character code), \`float\` or \`double\`. \`k\` may be 0.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
4
int 2 2000000000 2000000000
char 3 a b c
float 2 0.5 0.25
double 3 1.5 2.5 3
\`\`\`
prints
\`\`\`text
int: sum=4000000000 accumulator=long long
char: sum=294 accumulator=long long
float: sum=0.75 accumulator=double
double: sum=7.00 accumulator=double
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <type_traits>
#include <vector>

// TODO: template <typename T> using Accumulator = std::conditional_t<...>;

// TODO: template <typename T> Accumulator<T> total(const std::vector<T>& v)

template <typename T>
void report(const std::string& kind) {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    // TODO: const auto sum = total(v); print "<kind>: sum=<sum> accumulator=<name>"
    std::cout << kind << ": sum=" << '\n';
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        // TODO: report<int>, report<char>, report<float> or report<double>
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <type_traits>
#include <vector>

template <typename T>
using Accumulator = std::conditional_t<std::is_integral_v<T>, long long, double>;

template <typename T>
Accumulator<T> total(const std::vector<T>& v) {
    Accumulator<T> sum{};
    for (const T& x : v) sum += x;
    return sum;
}

template <typename T>
void report(const std::string& kind) {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    const auto sum = total(v);
    std::cout << kind << ": sum=";
    if constexpr (std::is_same_v<Accumulator<T>, long long>) {
        std::cout << sum << " accumulator=long long\n";
    } else {
        std::cout << std::fixed << std::setprecision(2) << sum << " accumulator=double\n";
    }
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "int") report<int>(kind);
        else if (kind == "char") report<char>(kind);
        else if (kind == "float") report<float>(kind);
        else report<double>(kind);
    }
    return 0;
}
`,
          hints: [
            "std::conditional_t<B, T, F> is a type-level ?: — both T and F must be valid types, and here they are.",
            "Initialise the accumulator with `Accumulator<T> sum{};` so it starts at 0 for either type.",
            "`char` is integral, so its accumulator is long long and `sum += x` adds the character code.",
          ],
          cases: [
            { stdin: "4\nint 2 2000000000 2000000000\nchar 3 a b c\nfloat 2 0.5 0.25\ndouble 3 1.5 2.5 3\n", expected: "int: sum=4000000000 accumulator=long long\nchar: sum=294 accumulator=long long\nfloat: sum=0.75 accumulator=double\ndouble: sum=7.00 accumulator=double\n" },
            { stdin: "1\nint 0\n", expected: "int: sum=0 accumulator=long long\n" },
            { stdin: "2\ndouble 0\nfloat 1 -1.5\n", expected: "double: sum=0.00 accumulator=double\nfloat: sum=-1.50 accumulator=double\n", hidden: true },
            { stdin: "2\nint 3 -1 -2 -3\nchar 1 A\n", expected: "int: sum=-6 accumulator=long long\nchar: sum=65 accumulator=long long\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <typename T>\nvoid f(T&& x) { std::cout << std::is_same_v<T, std::string>; }\n\nint main() {\n    std::string s = \"a\";\n    f(s);\n}\n```",
          options: ["`1`", "`0`", "Compile error: `T&&` cannot bind to an lvalue", "Undefined behaviour"],
          answer: 1,
          explanation: "For an lvalue argument a forwarding reference deduces `T = std::string&`, and `std::string&` is not the same type as `std::string`. Strip first — `std::remove_cvref_t<T>` — and the test becomes true. `f(std::string(\"a\"))` with an rvalue would have printed `1`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nint i = 0;\ndecltype((i)) r = i;\nr = 5;\nstd::cout << i;\n```",
          options: ["`0`", "`5`", "Compile error: `decltype((i))` is not a type", "Undefined behaviour"],
          answer: 1,
          explanation: "`decltype(i)` is the declared type `int`, but `decltype((i))` — a parenthesised name — is an lvalue expression and yields `int&`. `r` is a reference to `i`, so assigning through it changes `i`.",
        },
        {
          prompt: "What type is `Accumulator<char>` given `template <typename T> using Accumulator = std::conditional_t<std::is_integral_v<T>, long long, double>;`?",
          options: ["`double`", "`long long`", "`char`", "Compile error: `char` is neither"],
          answer: 1,
          explanation: "`char` is an integral type, so the flag is `true` and `conditional_t` selects `long long`. It selects; it does not discard — both branch types must be valid regardless of the flag.",
        },
        {
          prompt: "Why is `static_assert(false, \"unsupported\")` in the final `else` of an `if constexpr` chain a problem before C++23?",
          options: ["`static_assert` is not allowed inside templates", "The condition does not depend on `T`, so the compiler may reject the template before any instantiation", "It fires for every `T`, even the supported ones", "It only warns and never stops compilation"],
          answer: 1,
          explanation: "A discarded branch is still checked for well-formedness where nothing depends on a template parameter, and `static_assert(false)` is ill-formed on its own. The idiom is a dependent false: `template <typename> inline constexpr bool always_false = false;` then `static_assert(always_false<T>, …)`.",
        },
        {
          prompt: "With `template <typename T> std::enable_if_t<std::is_integral_v<T>, T> half(T v);` and a second `half` enabled for `std::is_floating_point_v<T>`, what happens to the first candidate when `half(2.5)` is called?",
          options: ["It is a compile error: `enable_if_t<false, T>` has no `type`", "It is dropped silently — substitution failure is not an error — and the second candidate is chosen", "It is chosen, and `2.5` is converted to `int`", "Both are chosen and the call is ambiguous"],
          answer: 1,
          explanation: "Substituting `T = double` makes the first signature name a `::type` that does not exist; SFINAE removes that candidate from the set instead of failing the compilation, leaving the floating-point overload. Concepts say the same thing in the signature with a readable error when nothing matches.",
        },
        {
          prompt: "Which is the recommended way to compute `factorial(10)` at compile time in C++20?",
          options: ["A recursive class template `Factorial<N>` with a specialisation for `0`", "A `constexpr` function with a loop, used in a `static_assert` or a constant initialiser", "A macro", "A `std::conditional_t` chain"],
          answer: 1,
          explanation: "The template version instantiates eleven classes, cannot use a loop and reports mistakes as a chain of instantiation notes; a `constexpr` function is ordinary C++ evaluated at compile time when its arguments are constants. Compute *values* with `constexpr` functions and *types* with traits.",
        },
        {
          prompt: "What happens if `std::declval<T>()` is called in ordinary code, outside `decltype`, `sizeof` or a `requires` expression?",
          options: ["It returns a default-constructed `T`", "It compiles but fails to link — it has no definition by design", "It throws `std::bad_function_call`", "It returns a null reference"],
          answer: 1,
          explanation: "`std::declval` is declared, never defined, so it exists only to give unevaluated contexts an expression of type `T&&` without needing an object or a constructor. Odr-using it — actually calling it — is an undefined reference at link time, which is the intended guard.",
        },
      ],
    },
    {
      slug: "templates-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Queue<T> for the element type on the first line",
          prompt: `Write a class template \`Queue<T>\` — first in, first out — over a \`std::vector<T>\` and a head index, with \`push\`, \`pop\`, \`front\`, \`size\` and \`print\`; define \`pop\`, \`front\` and \`print\` outside the class body with their own template headers. A function template \`run<T>()\` processes the commands; \`main\` reads the type word and calls \`run<int>()\` or \`run<std::string>()\`.

Commands, one per line: \`push <v>\`; \`pop\` (print \`popped <v>\` or \`empty\`); \`front\` (print \`front=<v>\` or \`empty\`); \`size\` (print \`size=<k>\`); \`print\` (print \`queue: <front> … <back>\` or \`queue: (empty)\`).

**Input:** the type word (\`int\` or \`string\`), then commands.
**Output:** one line per \`pop\`, \`front\`, \`size\` and \`print\`.

\`\`\`text
int
push 1
push 2
push 3
print
pop
front
size
\`\`\`
prints
\`\`\`text
queue: 1 2 3
popped 1
front=2
size=2
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
class Queue {
public:
    void push(const T& value) { items_.push_back(value); }
    bool pop(T& out);
    bool front(T& out) const;
    std::size_t size() const { return items_.size() - head_; }
    void print() const;

private:
    std::vector<T> items_;
    std::size_t head_ = 0;     // index of the front element
};

// TODO: out-of-class definitions of pop, front and print
template <typename T>
bool Queue<T>::pop(T& out) {
    (void)out;
    return false;
}

template <typename T>
bool Queue<T>::front(T& out) const {
    (void)out;
    return false;
}

template <typename T>
void Queue<T>::print() const {
}

template <typename T>
void run() {
    Queue<T> queue;
    std::string cmd;
    while (std::cin >> cmd) {
        // TODO: push / pop / front / size / print
    }
}

int main() {
    std::string type;
    std::cin >> type;
    // TODO: run<int>() or run<std::string>()
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
class Queue {
public:
    void push(const T& value) { items_.push_back(value); }
    bool pop(T& out);
    bool front(T& out) const;
    std::size_t size() const { return items_.size() - head_; }
    void print() const;

private:
    std::vector<T> items_;
    std::size_t head_ = 0;     // index of the front element
};

template <typename T>
bool Queue<T>::pop(T& out) {
    if (size() == 0) return false;
    out = items_[head_];
    ++head_;
    if (head_ == items_.size()) {      // drained: reclaim the storage
        items_.clear();
        head_ = 0;
    }
    return true;
}

template <typename T>
bool Queue<T>::front(T& out) const {
    if (size() == 0) return false;
    out = items_[head_];
    return true;
}

template <typename T>
void Queue<T>::print() const {
    std::cout << "queue:";
    if (size() == 0) {
        std::cout << " (empty)\n";
        return;
    }
    for (std::size_t i = head_; i < items_.size(); ++i) std::cout << ' ' << items_[i];
    std::cout << '\n';
}

template <typename T>
void run() {
    Queue<T> queue;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            T value;
            std::cin >> value;
            queue.push(value);
        } else if (cmd == "pop") {
            T value;
            if (queue.pop(value)) std::cout << "popped " << value << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "front") {
            T value;
            if (queue.front(value)) std::cout << "front=" << value << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << queue.size() << '\n';
        } else if (cmd == "print") {
            queue.print();
        }
    }
}

int main() {
    std::string type;
    std::cin >> type;
    if (type == "int") run<int>();
    else run<std::string>();
    return 0;
}
`,
          hints: [
            "pop advances head_ instead of erasing from the front; when head_ reaches the end, clear the vector and reset head_ to 0.",
            "size() is items_.size() - head_, so every member can test emptiness the same way.",
            "print walks from head_ to the end — the elements before head_ are already popped.",
          ],
          cases: [
            { stdin: "int\npush 1\npush 2\npush 3\nprint\npop\nfront\nsize\n", expected: "queue: 1 2 3\npopped 1\nfront=2\nsize=2\n" },
            { stdin: "string\npush pear\npush apple\npop\npop\npop\nprint\n", expected: "popped pear\npopped apple\nempty\nqueue: (empty)\n" },
            { stdin: "int\nfront\npop\nsize\nprint\n", expected: "empty\nempty\nsize=0\nqueue: (empty)\n", hidden: true },
            { stdin: "int\npush 5\npop\npush 6\npush 7\nprint\nfront\n", expected: "popped 5\nqueue: 6 7\nfront=6\n", hidden: true },
            { stdin: "string\npush a\npush b\npush c\npop\nprint\nsize\n", expected: "popped a\nqueue: b c\nsize=2\n", hidden: true },
          ],
        },
        {
          title: "A statistics report chosen by concepts",
          prompt: `Write a concept \`Number\` = \`std::integral<T> || std::floating_point<T>\`, a helper \`template <Number T> T spread(const std::vector<T>&)\` returning \`max - min\`, and three overloads of \`stats(const std::vector<T>& v)\`:

- \`template <std::integral T>\`: \`integral n=<k> sum=<sum> min=<min> max=<max> spread=<spread>\` — the sum in a \`long long\`.
- \`template <std::floating_point T>\`: \`floating n=<k> mean=<mean> min=<min> max=<max> spread=<spread>\` — all four with two decimals.
- \`template <typename T>\` (unconstrained): \`text n=<k> longest=<word> chars=<total characters>\` — the first longest word on a tie.

Read \`n\`, then \`n\` lines of \`<type> <k> <v1> … <vk>\` with \`<type>\` one of \`int\`, \`double\`, \`string\` and \`k\` at least 1.

**Input:** \`n\`, then \`n\` lines.
**Output:** one line per input line.

\`\`\`text
3
int 4 1 2 3 4
double 2 1.5 2.5
string 3 pear banana kiwi
\`\`\`
prints
\`\`\`text
integral n=4 sum=10 min=1 max=4 spread=3
floating n=2 mean=2.00 min=1.50 max=2.50 spread=1.00
text n=3 longest=banana chars=14
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <concepts>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// TODO: template <typename T> concept Number = ...;
// TODO: template <Number T> T spread(const std::vector<T>& v)

// TODO: template <std::integral T> void stats(const std::vector<T>& v)
// TODO: template <std::floating_point T> void stats(const std::vector<T>& v)

template <typename T>
void stats(const std::vector<T>& v) {
    // TODO: text n=<k> longest=<word> chars=<total>
    std::cout << "text n=" << v.size() << '\n';
}

template <typename T>
void handle() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    stats(v);
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        // TODO: handle<int>(), handle<double>() or handle<std::string>()
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <concepts>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template <Number T>
T spread(const std::vector<T>& v) {
    const auto [lo, hi] = std::minmax_element(v.begin(), v.end());
    return *hi - *lo;
}

template <std::integral T>
void stats(const std::vector<T>& v) {
    long long sum = 0;
    for (T x : v) sum += x;
    const auto [lo, hi] = std::minmax_element(v.begin(), v.end());
    std::cout << "integral n=" << v.size() << " sum=" << sum << " min=" << *lo << " max=" << *hi
              << " spread=" << spread(v) << '\n';
}

template <std::floating_point T>
void stats(const std::vector<T>& v) {
    double sum = 0.0;
    for (T x : v) sum += x;
    const auto [lo, hi] = std::minmax_element(v.begin(), v.end());
    std::cout << std::fixed << std::setprecision(2) << "floating n=" << v.size()
              << " mean=" << sum / static_cast<double>(v.size()) << " min=" << *lo << " max=" << *hi
              << " spread=" << spread(v) << '\n';
}

template <typename T>
void stats(const std::vector<T>& v) {
    std::size_t longestAt = 0;
    std::size_t chars = 0;
    for (std::size_t i = 0; i < v.size(); ++i) {
        chars += v[i].size();
        if (v[longestAt].size() < v[i].size()) longestAt = i;
    }
    std::cout << "text n=" << v.size() << " longest=" << v[longestAt] << " chars=" << chars << '\n';
}

template <typename T>
void handle() {
    std::size_t k;
    std::cin >> k;
    std::vector<T> v(k);
    for (T& x : v) std::cin >> x;
    stats(v);
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string type;
        std::cin >> type;
        if (type == "int") handle<int>();
        else if (type == "double") handle<double>();
        else handle<std::string>();
    }
    return 0;
}
`,
          hints: [
            "std::minmax_element returns a pair of iterators; structured bindings `const auto [lo, hi]` name them.",
            "The unconstrained overload is the fallback: for int and double the constrained overloads beat it in the tie-break, and for std::string it is the only candidate.",
            "spread is constrained on Number, so it can be called from both numeric overloads and never from the text one.",
          ],
          cases: [
            { stdin: "3\nint 4 1 2 3 4\ndouble 2 1.5 2.5\nstring 3 pear banana kiwi\n", expected: "integral n=4 sum=10 min=1 max=4 spread=3\nfloating n=2 mean=2.00 min=1.50 max=2.50 spread=1.00\ntext n=3 longest=banana chars=14\n" },
            { stdin: "1\nint 1 -9\n", expected: "integral n=1 sum=-9 min=-9 max=-9 spread=0\n" },
            { stdin: "2\nint 2 2000000000 2000000000\nstring 2 ab cd\n", expected: "integral n=2 sum=4000000000 min=2000000000 max=2000000000 spread=0\ntext n=2 longest=ab chars=4\n", hidden: true },
            { stdin: "2\ndouble 3 -1 0 1\ndouble 1 0.1\n", expected: "floating n=3 mean=0.00 min=-1.00 max=1.00 spread=2.00\nfloating n=1 mean=0.10 min=0.10 max=0.10 spread=0.00\n", hidden: true },
            { stdin: "1\nstring 1 solo\n", expected: "text n=1 longest=solo chars=4\n", hidden: true },
          ],
        },
        {
          title: "Table<K, V> with a TypeName header",
          prompt: `Write a trait \`TypeName<T>\` — a primary template whose \`value\` is \`"unknown"\` and full specialisations giving \`"int"\`, \`"double"\` and \`"std::string"\` — plus a variable template \`type_name_v<T>\`. Then a class template \`Table<K, V>\` over a \`std::map<K, V>\` with \`set(key, value)\` (a repeated key replaces the earlier value) and \`print()\`, which writes the header \`Table<<K name>, <V name>>\` from the trait, then every row in key order as \`<key> -> <value>\` (a \`double\` value with two decimals — use \`if constexpr\` on \`std::is_floating_point_v<V>\`), then \`rows=<count>\`.

The first line names \`K\` (\`int\` or \`string\`) and \`V\` (\`int\`, \`double\` or \`string\`), so there are six possible instantiations; dispatch through a \`run<K, V>()\` function template. Then \`n\`, then \`n\` lines of \`<key> <value>\`. Note that integer keys order numerically while string keys order lexicographically — the same input prints differently under \`Table<int, …>\` and \`Table<std::string, …>\`.

**Input:** the two type words, \`n\`, then \`n\` rows.
**Output:** the header, the rows in key order, then \`rows=<count>\`.

\`\`\`text
int string
3
10 ten
2 two
7 seven
\`\`\`
prints
\`\`\`text
Table<int, std::string>
2 -> two
7 -> seven
10 -> ten
rows=3
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <type_traits>

template <typename T> struct TypeName { static constexpr const char* value = "unknown"; };
// TODO: full specialisations for int, double and std::string

template <typename T>
constexpr const char* type_name_v = TypeName<T>::value;

template <typename K, typename V>
class Table {
public:
    void set(const K& key, const V& value) { rows_[key] = value; }
    void print() const {
        // TODO: header from type_name_v<K> and type_name_v<V>, the rows, then rows=<count>
        std::cout << "Table<" << type_name_v<K> << ", " << type_name_v<V> << ">\n";
    }

private:
    std::map<K, V> rows_;
};

template <typename K, typename V>
void run() {
    Table<K, V> table;
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        K key;
        V value;
        std::cin >> key >> value;
        table.set(key, value);
    }
    table.print();
}

int main() {
    std::string k, v;
    std::cin >> k >> v;
    // TODO: dispatch on k and v to one of the six run<K, V>() instantiations
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <type_traits>

template <typename T> struct TypeName { static constexpr const char* value = "unknown"; };
template <> struct TypeName<int> { static constexpr const char* value = "int"; };
template <> struct TypeName<double> { static constexpr const char* value = "double"; };
template <> struct TypeName<std::string> { static constexpr const char* value = "std::string"; };

template <typename T>
constexpr const char* type_name_v = TypeName<T>::value;

template <typename K, typename V>
class Table {
public:
    void set(const K& key, const V& value) { rows_[key] = value; }
    void print() const {
        std::cout << "Table<" << type_name_v<K> << ", " << type_name_v<V> << ">\n";
        for (const auto& [key, value] : rows_) {
            std::cout << key << " -> ";
            if constexpr (std::is_floating_point_v<V>) std::cout << std::fixed << std::setprecision(2) << value;
            else std::cout << value;
            std::cout << '\n';
        }
        std::cout << "rows=" << rows_.size() << '\n';
    }

private:
    std::map<K, V> rows_;
};

template <typename K, typename V>
void run() {
    Table<K, V> table;
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        K key;
        V value;
        std::cin >> key >> value;
        table.set(key, value);
    }
    table.print();
}

template <typename K>
void run_with_value(const std::string& v) {
    if (v == "int") run<K, int>();
    else if (v == "double") run<K, double>();
    else run<K, std::string>();
}

int main() {
    std::string k, v;
    std::cin >> k >> v;
    if (k == "int") run_with_value<int>(v);
    else run_with_value<std::string>(v);
    return 0;
}
`,
          hints: [
            "A full specialisation of the trait is one line: `template <> struct TypeName<int> { static constexpr const char* value = \"int\"; };`.",
            "Dispatch in two steps — choose K in main, then V in a run_with_value<K>() helper — so the six combinations need five ifs, not six copies of the loop.",
            "std::map keeps the rows in key order and operator[] replaces on a repeated key, so set and print need no extra logic.",
          ],
          cases: [
            { stdin: "int string\n3\n10 ten\n2 two\n7 seven\n", expected: "Table<int, std::string>\n2 -> two\n7 -> seven\n10 -> ten\nrows=3\n" },
            { stdin: "string double\n3\npear 1.5\napple 0.25\npear 2\n", expected: "Table<std::string, double>\napple -> 0.25\npear -> 2.00\nrows=2\n" },
            { stdin: "string int\n3\n10 1\n2 2\n7 3\n", expected: "Table<std::string, int>\n10 -> 1\n2 -> 2\n7 -> 3\nrows=3\n", hidden: true },
            { stdin: "int int\n0\n", expected: "Table<int, int>\nrows=0\n", hidden: true },
            { stdin: "int double\n2\n-1 -0.5\n-1 3\n", expected: "Table<int, double>\n-1 -> 3.00\nrows=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which call fixes `max_of(3, 2.5)` for `template <typename T> T max_of(const T&, const T&)`?",
          options: ["`max_of(3, (int)2.5)` — and it returns `3`", "`max_of<double>(3, 2.5)` — the `3` converts once `T` is named", "`max_of(static_cast<auto>(3), 2.5)`", "Nothing; a template cannot take two arithmetic types"],
          answer: 1,
          explanation: "Naming `T` skips deduction, and `3` then converts to `double` like any function argument. The first option compiles too but throws away the `.5` — it answers a different question. `static_cast<auto>` is not C++.",
        },
        {
          prompt: "A template is declared in a header and defined in one `.cpp` file. Which error results when another file uses it?",
          options: ["A compile error in the header", "A linker error: undefined reference to the instantiation", "A run-time crash", "No error — the linker instantiates it"],
          answer: 1,
          explanation: "Each translation unit generates only the instantiations it uses, and the using file has only a declaration in view, so nothing generates the function and the linker finds no symbol. Templates live in headers, definition included.",
        },
        {
          prompt: "`void f(int);` and `template <typename T> void f(const T&);` both exist. What do `f(5)` and `f('a')` call?",
          options: ["Both call the non-template", "Both call the template", "`f(5)` the non-template (an equal-match tie goes to it); `f('a')` the template (`T = char` is exact, `char` to `int` is a promotion)", "`f(5)` the template; `f('a')` the non-template"],
          answer: 2,
          explanation: "Resolution first ranks the conversions. `f(5)` is exact for both, and a tie goes to the non-template. `f('a')` is exact only for the template — `const char&` — while the non-template needs a promotion, so the template wins.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::vector a{3};\nstd::vector b(3, 0);\nstd::cout << a.size() << b.size();\n```",
          options: ["`33`", "`13`", "`31`", "Compile error"],
          answer: 1,
          explanation: "Braces choose the `initializer_list` constructor — one element — while parentheses choose the count-and-value constructor — three zeros. CTAD deduces `std::vector<int>` for both; it is the initialiser syntax that differs.",
        },
        {
          prompt: "Inside `template <typename C> void g(const C& c)`, which line compiles?",
          options: ["`C::value_type x = *c.begin();`", "`typename C::value_type x = *c.begin();`", "`template C::value_type x = *c.begin();`", "`auto C::value_type x = *c.begin();`"],
          answer: 1,
          explanation: "`C::value_type` is a dependent name and the parser assumes it is not a type unless `typename` says so. `auto x = *c.begin();` would also work and is what most modern code writes; the other spellings are syntax errors.",
        },
        {
          prompt: "Which statement about a full specialisation `template <> struct Box<bool>` is correct?",
          options: ["It inherits every member of the primary `Box<T>` and may override some", "It is a separate class: it has only the members it declares", "It must declare the same members as the primary or the compiler rejects it", "It applies to `bool` and to every type convertible to `bool`"],
          answer: 1,
          explanation: "An explicit specialisation replaces the primary for exactly that argument and inherits nothing from it. Keeping the interface identical is your job; the compiler enforces nothing. To change only one member, specialise that member alone.",
        },
        {
          prompt: "You want `show(const char*)` to print differently from the template `template <typename T> void show(const T&)`. What should you write?",
          options: ["`template <> void show<const char*>(const char* const&)`", "A non-template overload `void show(const char* v)`", "`template <typename T> void show<T*>(T*)`", "A `static_assert` in the template"],
          answer: 1,
          explanation: "A non-template overload takes part in overload resolution and wins an exact-match tie. A full specialisation is not a candidate — a better-matching primary added later would hide it — and function templates cannot be partially specialised at all.",
        },
        {
          prompt: "`template <typename T, std::size_t N> class Ring` — which declaration compiles?",
          options: ["`int n = 4; Ring<int, n> r;`", "`const int n = read(); Ring<int, n> r;`", "`constexpr std::size_t n = 4; Ring<int, n> r;`", "`std::size_t n; std::cin >> n; Ring<int, n> r;`"],
          answer: 2,
          explanation: "A non-type argument must be a constant expression. A `constexpr` variable qualifies; a non-const `int`, a `const` initialised from a function call, and a value read at run time do not. Run-time sizes dispatch to a few fixed instantiations or use `std::vector`.",
        },
        {
          prompt: "What does `sum()` return for `template <typename... Ts> auto sum(Ts... xs) { return (0 + ... + xs); }` — and what would `(xs + ...)` do instead?",
          options: ["`0`; `(xs + ...)` would also give `0`", "`0`; `(xs + ...)` would be a compile error on an empty pack", "A compile error in both cases", "`0`; `(xs + ...)` would give an unspecified value"],
          answer: 1,
          explanation: "A binary fold supplies the starting value, which is what makes it legal for zero arguments — `(0 + ... + xs)` is just `0`. A unary `+` fold over an empty pack has nothing to produce and is rejected; only `&&`, `||` and `,` may fold an empty pack unaided.",
        },
        {
          prompt: "What does this print?\n\n```cpp\ntemplate <std::integral T>       void kind(T) { std::cout << \"integral\"; }\ntemplate <std::floating_point T> void kind(T) { std::cout << \"floating\"; }\ntemplate <typename T>            void kind(T) { std::cout << \"other\"; }\n\nint main() { kind('x'); kind(1.0f); kind(\"s\"); }\n```",
          options: ["`otherfloatingother`", "`integralfloatingother`", "`integralotherother`", "Compile error: ambiguous call for `'x'`"],
          answer: 1,
          explanation: "`char` is `std::integral`, `float` is `std::floating_point`, and a string literal decays to `const char*`, which is neither. In each call the constrained overload that is satisfied beats the unconstrained one; no two constrained overloads are satisfied at once, so nothing is ambiguous.",
        },
        {
          prompt: "Overload A is constrained by `std::integral<T>`; overload B by `std::signed_integral<T>`. Overload C is constrained by an inline `requires(T a) { a + a; }` and overload D by an identical inline expression. Which pair resolves cleanly for `int`?",
          options: ["A and B — B subsumes A through the named concept and wins", "C and D — identical text makes them equivalent", "Neither pair; two constrained overloads are always ambiguous", "Both pairs resolve to the first declared"],
          answer: 0,
          explanation: "Subsumption is proved through named concepts: `signed_integral` is defined as `integral && is_signed_v`, so B is more constrained. Two inline `requires` expressions are different atoms even when identical, so C and D are ambiguous. Name your concepts.",
        },
        {
          prompt: "Why does `std::is_same_v<T, std::string>` fail to detect a `std::string` lvalue passed to `template <typename T> void f(T&& x)`, and what fixes it?",
          options: ["`T` deduces as `std::string&`; test `std::remove_cvref_t<T>` instead", "`T` deduces as `const std::string`; test `std::remove_const_t<T>`", "`is_same_v` cannot compare class types; use `typeid`", "`T&&` only accepts rvalues, so the call does not compile"],
          answer: 0,
          explanation: "A forwarding reference deduces `T` as an lvalue reference for an lvalue argument, and `std::string&` is not `std::string`. `std::remove_cvref_t<T>` strips the reference and any `const`/`volatile`, giving the plain type to test. The same applies to `auto&&` in a range-for.",
        },
        {
          prompt: "Which one should compute a *value* at compile time in C++20, and which a *type*?",
          options: ["Values with recursive class templates; types with `constexpr` functions", "Values with `constexpr` functions; types with traits such as `std::conditional_t`", "Both with macros", "Both with `if constexpr`"],
          answer: 1,
          explanation: "A `constexpr` function is ordinary C++ — loops, locals, even `std::vector` in C++20 — evaluated at compile time when its arguments are constants; recursive template arithmetic instantiates a class per step and cannot loop. Types cannot be returned from functions, so traits and `conditional_t` do that job.",
        },
      ],
    },
  ],
});

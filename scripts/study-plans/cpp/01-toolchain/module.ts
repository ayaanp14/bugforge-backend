import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "toolchain",
  title: "C++ and the toolchain",
  blurb: "Where C++ came from and the zero-overhead principle, the preprocess-compile-assemble-link pipeline, the anatomy of a program, the console I/O patterns every exercise uses, and how to read what the compiler says.",
  icon: "cpu",
  overview: `C++ has no virtual machine and no runtime that catches mistakes for you. Between pressing Run and seeing output, a preprocessor pastes your headers into a translation unit, a compiler turns it into machine code for one CPU, and a linker stitches the pieces into an executable — and the shape of the language (no garbage collector, values that copy, a category of errors the standard leaves undefined) follows from one promise: you do not pay for what you do not use. Before writing C++ well you need that map.

This module draws it. You will see where C++ came from and what "C++20" means, walk a two-file program through the four build stages and learn the vocabulary — translation unit, declaration versus definition, the one-definition rule, undefined reference — take apart the anatomy of a program (includes, \`main\`, \`std::\`, statements, scope, the exit code), master the console input and output idioms every exercise in this track uses, and learn to read a compiler diagnostic, a warning, a template error and a linker error, with sanitizers and a debugger in outline.

The exercises are small whole programs whose point is exact input and output: greet a name read with \`std::getline\`, map years to standards, print the build commands for a list of sources and simulate a linker's symbol resolution, compute through functions and namespaces, read N lines after a count and sum tokens until the input ends, summarise compiler diagnostics and apply \`-Werror\`. The checkpoint's three programs — a multiplication table, a word count and a student report — combine every reading pattern the module taught.`,
  lessons: [
    {
      slug: "what-is-cpp",
      file: "01-what-is-cpp.md",
      exercises: [
        {
          title: "Hello, you",
          prompt: `Read one line — a name — from standard input and print \`Hello, <name>!\`.

**Input:** a single line containing a name (it may contain spaces).
**Output:** \`Hello, \` followed by the name and \`!\`.

Use \`std::getline\` to read the line — \`std::cin >> name\` would stop at the first space. Print with \`std::cout\` and end the line with \`'\\n'\`.

Example: input \`Ada\` → output \`Hello, Ada!\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string name;
    std::getline(std::cin, name);
    // TODO: print the greeting
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    std::string name;
    std::getline(std::cin, name);
    std::cout << "Hello, " << name << "!\n";
    return 0;
}
`,
          hints: ["Chain the pieces with <<: the literal, the name, the exclamation mark.", "A newline is the character '\\n'; put it inside the last literal or send it on its own."],
          cases: [
            { stdin: "Ada\n", expected: "Hello, Ada!\n" },
            { stdin: "Bjarne Stroustrup\n", expected: "Hello, Bjarne Stroustrup!\n" },
            { stdin: "C++\n", expected: "Hello, C++!\n", hidden: true },
            { stdin: "Grace Brewster Murray Hopper\n", expected: "Hello, Grace Brewster Murray Hopper!\n", hidden: true },
          ],
        },
        {
          title: "Standard by year",
          prompt: `Read an integer \`n\`, then \`n\` years (whitespace-separated, possibly across several lines). For each year print the C++ standard published that year — \`C++98\`, \`C++03\`, \`C++11\`, \`C++14\`, \`C++17\`, \`C++20\` or \`C++23\` for 1998, 2003, 2011, 2014, 2017, 2020 and 2023 — or \`no standard\` for any other year.

**Input:** \`n\` (at least 1), then \`n\` integers.
**Output:** \`n\` lines, one per year, in input order.

Put the year-to-name mapping in a function above \`main\` that returns a \`std::string\`, and keep \`main\` to the reading loop.

Example: input \`3 1998 2011 2020\` →
\`\`\`text
C++98
C++11
C++20
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

// TODO: a function that maps a year to its standard's name, or "no standard"

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int year;
        std::cin >> year;
        // TODO: print the standard published that year
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

std::string standard_for(int year) {
    if (year == 1998) return "C++98";
    if (year == 2003) return "C++03";
    if (year == 2011) return "C++11";
    if (year == 2014) return "C++14";
    if (year == 2017) return "C++17";
    if (year == 2020) return "C++20";
    if (year == 2023) return "C++23";
    return "no standard";
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int year;
        std::cin >> year;
        std::cout << standard_for(year) << '\n';
    }
    return 0;
}
`,
          hints: ["std::cin >> year reads the next integer whatever line it is on, so the loop body does not care about the layout.", "A chain of if statements that each return is the simplest mapping; the final return handles every other year.", "Returning a std::string from a string literal converts it for you."],
          cases: [
            { stdin: "3\n1998 2011 2020\n", expected: "C++98\nC++11\nC++20\n" },
            { stdin: "2\n2003 2024\n", expected: "C++03\nno standard\n" },
            { stdin: "1\n1979\n", expected: "no standard\n", hidden: true },
            { stdin: "4\n2014\n2017\n2023\n1985\n", expected: "C++14\nC++17\nC++23\nno standard\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does the zero-overhead principle promise?",
          options: [
            "A C++ program has no run-time cost at all",
            "You do not pay for features you do not use, and what you do use costs no more than hand-written code",
            "The compiler removes every abstraction, so classes and templates vanish from the binary",
            "Memory is reclaimed automatically at no cost",
          ],
          answer: 1,
          explanation: "Stroustrup's two rules: what you don't use you don't pay for, and what you do use you couldn't hand-code better. It is why there is no garbage collector (everyone would pay for it) and why `operator[]` does not check bounds. Abstractions are not removed — they are designed to compile to the same code you would write by hand.",
        },
        {
          prompt: "Which set of features arrived with C++11?",
          options: [
            "Templates, exceptions and namespaces",
            "`auto`, lambdas, move semantics and `std::unique_ptr`",
            "Concepts, ranges and `std::format`",
            "`std::print` and `std::expected`",
          ],
          answer: 1,
          explanation: "C++11 is the \"modern C++\" reset: `auto`, lambdas, rvalue references and moves, smart pointers, range-based `for`, `std::thread`. Templates and exceptions are C++98; concepts, ranges and `std::format` are C++20; `std::print` and `std::expected` are C++23.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::string a = \"hello\";\nstd::string b = a;\nb += \" world\";\nstd::cout << a;\n```",
          options: ["`hello`", "`hello world`", "A compile error: `b` is a copy and cannot be modified", "Undefined behaviour"],
          answer: 0,
          explanation: "Value semantics: `b = a` creates a second, independent string. Appending to `b` does not touch `a`. In Java the same code would print `hello world` only if strings were mutable and `b` aliased `a`; in C++ variables are objects, not references.",
        },
        {
          prompt: "Signed integer overflow (`INT_MAX + 1`) in C++ is…",
          options: [
            "Guaranteed to wrap to `INT_MIN`",
            "An exception",
            "Undefined behaviour — the compiler may assume it never happens",
            "Implementation-defined, but always wraps on x86-64",
          ],
          answer: 2,
          explanation: "The standard leaves signed overflow undefined, and the optimiser exploits that: it may delete a check written after the overflow, or fold the expression to whatever is convenient. Unsigned arithmetic wraps by definition; signed does not, even though the hardware would.",
        },
        {
          prompt: "What does `-std=c++20` tell the compiler?",
          options: [
            "To optimise for the 2020 generation of CPUs",
            "Which edition of the language standard to accept",
            "To link the C++20 version of the standard library",
            "To reject any code written before 2020",
          ],
          answer: 1,
          explanation: "A standard is a document; the flag selects which one the compiler enforces. Without it GCC 14 defaults to C++17, and concepts, ranges and `std::format` would not compile. Optimisation is `-O2`; the library is linked automatically.",
        },
        {
          prompt: "\"C++ is a superset of C.\" Which statement is the accurate version?",
          options: [
            "Every valid C program is a valid C++ program with identical meaning",
            "C++ grew out of C and keeps most of its syntax, but valid C can fail to compile as C++ (implicit `void*` conversions, new keywords) and modern C++ avoids the C idioms",
            "C++ and C share syntax only by coincidence",
            "C is what C++ compiles to",
          ],
          answer: 1,
          explanation: "C++ started as C with Classes and still compiles most C, but not all: `int* p = malloc(4);` is C, not C++, and `class`, `new` and `template` are identifiers in C. The first Cfront compiler did emit C, but that was an implementation, not the language's definition.",
        },
        {
          prompt: "Which of these does NOT compile on this track's judge (Clang 18, `-std=c++20`)?",
          options: ["`std::format(\"{}\", 42)`", "A `requires` clause on a template", "`std::print(\"{}\\n\", 42)`", "`std::span<int>`"],
          answer: 2,
          explanation: "`std::print` is C++23 and the judge compiles C++20. `std::format`, concepts and `std::span` are all C++20 and work. The track teaches the C++23 additions as reading only.",
        },
      ],
    },
    {
      slug: "compile-and-link",
      file: "02-compile-and-link.md",
      exercises: [
        {
          title: "Build lines",
          prompt: `Print the commands a build system would run for a small project. The first line of input is the program name. Every following token (whitespace-separated, across any number of lines, until the input ends) is a \`.cpp\` source file. For each source print the compile line \`g++ -std=c++20 -O2 -Wall -c <source> -o <object>\`, where the object file name is the source with its \`.cpp\` replaced by \`.o\` (\`src/util.cpp\` becomes \`src/util.o\`). Then print the link line \`g++ <every object, in order> -o <program>\`.

**Input:** the program name on the first line, then the sources.
**Output:** one compile line per source, then the link line.

Read the program name with \`std::getline\` and the sources with \`while (std::cin >> source)\`.

Example: input
\`\`\`text
app
main.cpp util.cpp
\`\`\`
→
\`\`\`text
g++ -std=c++20 -O2 -Wall -c main.cpp -o main.o
g++ -std=c++20 -O2 -Wall -c util.cpp -o util.o
g++ main.o util.o -o app
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string program;
    std::getline(std::cin, program);
    std::string objects;   // " main.o util.o" - grows by one object per source
    std::string source;
    while (std::cin >> source) {
        // TODO: work out the object name, print the compile line, append the object to objects
    }
    // TODO: print the link line
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

// "src/util.cpp" -> "src/util.o": drop the four characters of ".cpp", append ".o".
std::string object_name(const std::string& source) {
    return source.substr(0, source.size() - 4) + ".o";
}

int main() {
    std::string program;
    std::getline(std::cin, program);
    std::string objects;
    std::string source;
    while (std::cin >> source) {
        std::string object = object_name(source);
        std::cout << "g++ -std=c++20 -O2 -Wall -c " << source << " -o " << object << '\n';
        objects += " " + object;
    }
    std::cout << "g++" << objects << " -o " << program << '\n';
    return 0;
}
`,
          hints: ["source.substr(0, source.size() - 4) is the name without its last four characters; add \".o\".", "Build the link line as you go: append a space and the object name to a std::string, then print it once after the loop.", "The loop ends on its own when the input does - while (std::cin >> source) is false once there is nothing left to read."],
          cases: [
            { stdin: "app\nmain.cpp util.cpp\n", expected: "g++ -std=c++20 -O2 -Wall -c main.cpp -o main.o\ng++ -std=c++20 -O2 -Wall -c util.cpp -o util.o\ng++ main.o util.o -o app\n" },
            { stdin: "hello\nhello.cpp\n", expected: "g++ -std=c++20 -O2 -Wall -c hello.cpp -o hello.o\ng++ hello.o -o hello\n" },
            { stdin: "server\nsrc/main.cpp\nsrc/net/socket.cpp\nsrc/io.cpp\n", expected: "g++ -std=c++20 -O2 -Wall -c src/main.cpp -o src/main.o\ng++ -std=c++20 -O2 -Wall -c src/net/socket.cpp -o src/net/socket.o\ng++ -std=c++20 -O2 -Wall -c src/io.cpp -o src/io.o\ng++ src/main.o src/net/socket.o src/io.o -o server\n", hidden: true },
            { stdin: "tool\nmain.cpp\nlib.cpp\n", expected: "g++ -std=c++20 -O2 -Wall -c main.cpp -o main.o\ng++ -std=c++20 -O2 -Wall -c lib.cpp -o lib.o\ng++ main.o lib.o -o tool\n", hidden: true },
          ],
        },
        {
          title: "A linker in miniature",
          prompt: `Simulate the linker's symbol resolution. Read an integer \`n\`, then \`n\` lines, each \`def <symbol>\` (an object file defines the symbol) or \`ref <symbol>\` (an object file needs it). Then report, in this order:

1. \`multiple definition of '<symbol>'\` — once for every \`def\` of a symbol that was already defined, in input order;
2. \`undefined reference to '<symbol>'\` — for every referenced symbol that no \`def\` line defines, in the order of first reference. The runtime's start-up code always references \`main\` before anything else, so a missing \`main\` is reported first, and a \`ref main\` line adds nothing new;
3. \`link ok\` if nothing was reported, otherwise \`ld returned 1 exit status\`.

**Input:** \`n\`, then \`n\` lines of \`def\`/\`ref\` and a symbol (no spaces in symbols).
**Output:** the report described above.

The starter gives you a \`contains\` helper and three \`std::vector<std::string>\` lists; a symbol is referenced once however many \`ref\` lines name it.

Example: input
\`\`\`text
4
def main
ref compute
def helper
ref helper
\`\`\`
→
\`\`\`text
undefined reference to 'compute'
ld returned 1 exit status
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

// True when name is already in names.
bool contains(const std::vector<std::string>& names, const std::string& name) {
    for (const std::string& n : names) {
        if (n == name) return true;
    }
    return false;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<std::string> defined;               // every symbol a def line introduced
    std::vector<std::string> referenced{"main"};    // every symbol needed, once each; main first
    std::vector<std::string> duplicated;            // symbols defined a second time, in input order
    for (int i = 0; i < n; ++i) {
        std::string kind, symbol;
        std::cin >> kind >> symbol;
        // TODO: a def of a known symbol is a duplicate; a ref is remembered once
    }
    // TODO: report duplicates, then unresolved references, then the status line
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

bool contains(const std::vector<std::string>& names, const std::string& name) {
    for (const std::string& n : names) {
        if (n == name) return true;
    }
    return false;
}

int main() {
    int n;
    std::cin >> n;
    std::vector<std::string> defined;
    std::vector<std::string> referenced{"main"};
    std::vector<std::string> duplicated;
    for (int i = 0; i < n; ++i) {
        std::string kind, symbol;
        std::cin >> kind >> symbol;
        if (kind == "def") {
            if (contains(defined, symbol)) duplicated.push_back(symbol);
            else defined.push_back(symbol);
        } else if (!contains(referenced, symbol)) {
            referenced.push_back(symbol);
        }
    }
    bool failed = false;
    for (const std::string& symbol : duplicated) {
        std::cout << "multiple definition of '" << symbol << "'\n";
        failed = true;
    }
    for (const std::string& symbol : referenced) {
        if (!contains(defined, symbol)) {
            std::cout << "undefined reference to '" << symbol << "'\n";
            failed = true;
        }
    }
    std::cout << (failed ? "ld returned 1 exit status" : "link ok") << '\n';
    return 0;
}
`,
          hints: ["std::cin >> kind >> symbol reads the two tokens of a line; compare kind with \"def\" using ==.", "push_back adds to the end of a vector; check contains() first so a symbol is stored once.", "Keep a bool that turns true whenever you print a report line, and choose the status line from it."],
          cases: [
            { stdin: "4\ndef main\nref compute\ndef helper\nref helper\n", expected: "undefined reference to 'compute'\nld returned 1 exit status\n" },
            { stdin: "3\ndef main\ndef compute\nref compute\n", expected: "link ok\n" },
            { stdin: "4\ndef main\ndef main\nref foo\nref foo\n", expected: "multiple definition of 'main'\nundefined reference to 'foo'\nld returned 1 exit status\n", hidden: true },
            { stdin: "2\ndef helper\nref helper\n", expected: "undefined reference to 'main'\nld returned 1 exit status\n", hidden: true },
            { stdin: "1\ndef main\n", expected: "link ok\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which stage of the build replaces `#include <iostream>` with the header's text?",
          options: ["The linker", "The preprocessor", "The assembler", "The loader, at run time"],
          answer: 1,
          explanation: "The preprocessor is a text tool that handles every `#` line before the compiler sees anything: `#include` is a paste, `#define` a substitution. Nothing about headers survives to the linker, and nothing is loaded at run time.",
        },
        {
          prompt: "`undefined reference to 'compute(int)'` comes from…",
          options: [
            "The compiler: `compute` was never declared",
            "The linker: `compute` was declared and called, but no object file defines it",
            "The preprocessor: the header that declares `compute` was not found",
            "The run-time loader",
          ],
          answer: 1,
          explanation: "The compiler was satisfied by the declaration and emitted a call to the symbol; the linker looked for a definition among the object files and libraries and found none. If `compute` had never been declared, the compiler would have stopped with `was not declared in this scope`.",
        },
        {
          prompt: "Which of these is a *definition*?",
          options: ["`int add(int, int);`", "`extern int counter;`", "`int add(int a, int b) { return a + b; }`", "`class Widget;`"],
          answer: 2,
          explanation: "A definition provides the thing — the body, the storage, the members. The other three only introduce a name and a type: a function prototype, an `extern` variable declaration and a forward declaration of a class.",
        },
        {
          prompt: "What does `g++ -c main.cpp` produce?",
          options: ["An executable named `a.out`", "`main.o`, an object file that is not yet runnable", "`main.s`, the assembly text", "`main.i`, the preprocessed source"],
          answer: 1,
          explanation: "`-c` means compile and assemble but do not link. `-S` stops at assembly and `-E` at preprocessing; with no flag at all, `g++` runs every stage and links to `a.out`.",
        },
        {
          prompt: "Two `.cpp` files each contain `int helper() { return 1; }` (not `inline`). Linking both into one program…",
          options: [
            "Works; the linker uses the first definition it finds",
            "Fails with a multiple-definition error — the one-definition rule",
            "Fails in the compiler, in whichever file is compiled second",
            "Works, but calling `helper` is undefined behaviour",
          ],
          answer: 1,
          explanation: "A non-inline function must be defined exactly once in the whole program. Each file compiles fine on its own — the compiler sees one translation unit at a time — and the clash appears when the linker finds two definitions of the same symbol.",
        },
        {
          prompt: "Where should the definition of an ordinary (non-inline, non-template) function go?",
          options: [
            "In the header, so every file that needs it can see the body",
            "In exactly one `.cpp` file, with a declaration in the header",
            "In every `.cpp` file that calls it",
            "In `main.cpp`, always",
          ],
          answer: 1,
          explanation: "Declare in the header (any number of translation units may see a declaration), define once in a source file. A body in a header that two files include is a multiple-definition link error unless the function is `inline`.",
        },
        {
          prompt: "What is a translation unit?",
          options: [
            "A header file",
            "One `.cpp` file after preprocessing — the unit the compiler compiles at once",
            "A function and everything it calls",
            "The symbol table of an object file",
          ],
          answer: 1,
          explanation: "After `#include`s have been pasted in and macros expanded, the compiler compiles the resulting text as a single unit, knowing nothing about any other file. Headers are part of whichever translation units include them; they are never compiled on their own.",
        },
      ],
    },
    {
      slug: "anatomy-of-a-program",
      file: "03-anatomy-of-a-program.md",
      exercises: [
        {
          title: "Area and perimeter",
          prompt: `Read the width and height of a rectangle and print its area and perimeter.

**Input:** one line with two integers, \`w\` and \`h\` (each between 1 and 2 000 000 000).
**Output:** two lines, \`area=<w*h>\` and \`perimeter=<2*(w+h)>\`.

Write two functions above \`main\` — \`area\` and \`perimeter\` — and call them from \`main\`. Use \`long long\` throughout: the largest inputs overflow \`int\`.

Example: input \`3 4\` →
\`\`\`text
area=12
perimeter=14
\`\`\``,
          starter: String.raw`#include <iostream>

// TODO: long long area(long long w, long long h) and long long perimeter(long long w, long long h)

int main() {
    long long w, h;
    std::cin >> w >> h;
    // TODO: print area=... and perimeter=...
    return 0;
}
`,
          solution: String.raw`#include <iostream>

long long area(long long w, long long h) {
    return w * h;
}

long long perimeter(long long w, long long h) {
    return 2 * (w + h);
}

int main() {
    long long w, h;
    std::cin >> w >> h;
    std::cout << "area=" << area(w, h) << '\n';
    std::cout << "perimeter=" << perimeter(w, h) << '\n';
    return 0;
}
`,
          hints: ["A function must be declared above the call that uses it; defining both helpers above main is enough.", "2 000 000 000 squared does not fit in an int (about 2.1 billion); long long holds up to about 9.2 quintillion.", "Print the label and the value in one << chain, then '\\n'."],
          cases: [
            { stdin: "3 4\n", expected: "area=12\nperimeter=14\n" },
            { stdin: "100000 100000\n", expected: "area=10000000000\nperimeter=400000\n" },
            { stdin: "1 1\n", expected: "area=1\nperimeter=4\n", hidden: true },
            { stdin: "2000000000 2000000000\n", expected: "area=4000000000000000000\nperimeter=8000000000\n", hidden: true },
          ],
        },
        {
          title: "Two namespaces, one name",
          prompt: `Convert temperatures to kelvin through two namespaces that share a function name. Define \`namespace celsius\` with \`double to_kelvin(double c)\` (kelvin = c + 273.15) and \`namespace fahrenheit\` with \`double to_kelvin(double f)\` (kelvin = (f − 32) × 5 / 9 + 273.15). Each input line is a scale letter, \`C\` or \`F\`, and a value; call the matching namespace's function with the scope-resolution operator and print the kelvin value with exactly two decimals.

**Input:** lines of \`<C|F> <value>\` until the input ends.
**Output:** one line per input line: the temperature in kelvin, fixed to two decimals.

Read with \`while (std::cin >> scale >> value)\` where \`scale\` is a \`char\`. Set \`std::fixed\` and \`std::setprecision(2)\` once, before the loop.

Example: input
\`\`\`text
C 25
F 77
\`\`\`
→
\`\`\`text
298.15
298.15
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>

namespace celsius {
    double to_kelvin(double c) {
        return c;   // TODO
    }
}

namespace fahrenheit {
    double to_kelvin(double f) {
        return f;   // TODO
    }
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    char scale;
    double value;
    while (std::cin >> scale >> value) {
        // TODO: call celsius::to_kelvin or fahrenheit::to_kelvin and print the result
    }
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>

namespace celsius {
    double to_kelvin(double c) {
        return c + 273.15;
    }
}

namespace fahrenheit {
    double to_kelvin(double f) {
        return (f - 32.0) * 5.0 / 9.0 + 273.15;
    }
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    char scale;
    double value;
    while (std::cin >> scale >> value) {
        double kelvin = (scale == 'C') ? celsius::to_kelvin(value) : fahrenheit::to_kelvin(value);
        std::cout << kelvin << '\n';
    }
    return 0;
}
`,
          hints: ["namespace_name::function_name selects the right one; the two functions do not clash because they live in different scopes.", "Write the Fahrenheit formula with doubles (5.0 / 9.0): 5 / 9 in integers is 0.", "std::fixed and std::setprecision are sticky, so setting them once before the loop formats every value."],
          cases: [
            { stdin: "C 25\nF 77\n", expected: "298.15\n298.15\n" },
            { stdin: "C 100\n", expected: "373.15\n" },
            { stdin: "F 32\nC -273.15\n", expected: "273.15\n0.00\n", hidden: true },
            { stdin: "F -40\nF 212\n", expected: "233.15\n373.15\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `using namespace std;` in a header file a problem?",
          options: [
            "It slows compilation of that header",
            "It forces the directive on every file that includes the header, so names like `count` or `size` can clash there without warning",
            "It is a syntax error outside a `.cpp` file",
            "It disables the `std::` prefix for the rest of the program",
          ],
          answer: 1,
          explanation: "A using-directive applies to the scope it appears in — for a header, every translation unit that includes it. Those files did not ask for every `std` name and may already have their own `count`, `max` or `left`; the resulting ambiguity error appears far from its cause.",
        },
        {
          prompt: "Given `int x = 1;`, which of these lines is a compile error?",
          options: ["`x + 1;`", "`x = 1;`", "`1 = x;`", "`x;`"],
          answer: 2,
          explanation: "Assignment needs something assignable on the left; the literal `1` is not. `x + 1;` and `x;` are legal expression statements that do nothing (GCC warns with `-Wunused-value`). Unlike Java, C++ allows any expression to stand as a statement.",
        },
        {
          prompt: "`int main()` reaches its closing brace with no `return` statement. What happens?",
          options: [
            "Undefined behaviour, as for any non-void function",
            "The program returns 0 — `main` is the one function allowed to omit `return`",
            "A compile error: missing return statement",
            "The exit code is whatever was left in the return register",
          ],
          answer: 1,
          explanation: "The standard makes a special case for `main`: falling off the end is `return 0;`. Every other non-void function that reaches its end without returning is undefined behaviour, which `-Wreturn-type` warns about.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nint x = 1;\n{\n    int x = 2;\n    std::cout << x;\n}\nstd::cout << x;\n```",
          options: ["`12`", "`21`", "`22`", "A compile error: `x` is redeclared"],
          answer: 1,
          explanation: "The inner block declares a new `x` that shadows the outer one until the block closes, so the first print sees 2 and the second sees the outer 1. Redeclaring in an inner block is legal (and `-Wshadow` can flag it); redeclaring in the *same* block would be the error.",
        },
        {
          prompt: "`using std::cout;` versus `using namespace std;`:",
          options: [
            "They are identical",
            "The first brings the single name `cout` into scope; the second brings every name in `std`",
            "The first is slower because it is resolved at run time",
            "Only the second allows `cout` to be used without `std::`",
          ],
          answer: 1,
          explanation: "A using-declaration names one entity and is precise; a using-directive opens the whole namespace. Both are compile-time; neither costs anything at run time. Prefer the declaration when you shorten anything at all.",
        },
        {
          prompt: "A program prints the correct answer and then executes `return 1;` from `main`. The judge reports…",
          options: [
            "Accepted — only standard output is compared",
            "A runtime error — a non-zero exit code means failure, whatever was printed",
            "Accepted, with `1` appended to the output",
            "A compile error",
          ],
          answer: 1,
          explanation: "The exit code is the process's verdict on itself: zero is success, anything else is failure, and the judge (like every shell and build tool) reads it before the output. Return 0 from every program in this track.",
        },
        {
          prompt: "What is the difference between `#include <iostream>` and `#include \"mathlib.h\"`?",
          options: [
            "None; the two spellings are interchangeable",
            "Angle brackets search the system include directories; quotes search the including file's directory first, then the same places",
            "Quotes are for C headers and angle brackets for C++ headers",
            "Angle-bracket includes are resolved by the linker",
          ],
          answer: 1,
          explanation: "Both are textual pastes by the preprocessor; only the search path differs. The convention is angle brackets for the standard library and installed libraries, quotes for your own project's headers.",
        },
      ],
    },
    {
      slug: "console-input-and-output",
      file: "04-console-input-and-output.md",
      exercises: [
        {
          title: "N, then N lines",
          prompt: `Read an integer \`n\`, then \`n\` lines of text (a line may contain spaces and may be empty). Print each line as \`<i>: <line>\` with \`i\` counting from 1, then a final line \`chars=<total>\`, the sum of the lines' lengths.

**Input:** \`n\` (0 or more) on its own line, then \`n\` lines.
**Output:** \`n\` numbered lines, then \`chars=<total>\`.

This is the mixed pattern: \`std::cin >> n\` leaves the newline behind, so you must \`std::cin.ignore()\` before the first \`std::getline\`. Read the lines with \`std::getline\` — nothing else keeps the spaces.

Example: input
\`\`\`text
2
hello world
C++ is fun
\`\`\`
→
\`\`\`text
1: hello world
2: C++ is fun
chars=21
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    // TODO: discard the rest of the first line before switching to std::getline
    long long total = 0;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        // TODO: print "<i>: <line>" and add its length to total
    }
    std::cout << "chars=" << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();   // the newline after n is still in the buffer; getline would return it as an empty line
    long long total = 0;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::cout << i << ": " << line << '\n';
        total += static_cast<long long>(line.size());
    }
    std::cout << "chars=" << total << '\n';
    return 0;
}
`,
          hints: ["Without std::cin.ignore() the first getline returns an empty string and every line shifts by one.", "line.size() is the number of characters; add it to a running total.", "An empty input line is a valid line: print its number and nothing after the colon."],
          cases: [
            { stdin: "2\nhello world\nC++ is fun\n", expected: "1: hello world\n2: C++ is fun\nchars=21\n" },
            { stdin: "3\na\nbb\nccc\n", expected: "1: a\n2: bb\n3: ccc\nchars=6\n" },
            { stdin: "2\n\nsecond line\n", expected: "1:\n2: second line\nchars=11\n", hidden: true },
            { stdin: "0\n", expected: "chars=0\n", hidden: true },
            { stdin: "1\n  leading and trailing  \n", expected: "1:   leading and trailing\nchars=24\n", hidden: true },
          ],
        },
        {
          title: "Numbers until the input ends",
          prompt: `Read integers until the end of input — there is no count and no sentinel — and print \`count=<n> sum=<s> min=<lo> max=<hi>\` on one line. If there were no numbers at all, print \`count=0\`.

**Input:** zero or more integers in any layout (any number per line, any number of lines). Each fits in a 32-bit \`int\`; their sum may not.
**Output:** one line.

Use \`while (std::cin >> x)\` — it is false the moment a read fails, which is how the loop ends at the end of input. Keep the sum in a \`long long\`.

Example: input \`3 1 4 1 5\` → \`count=5 sum=14 min=1 max=5\``,
          starter: String.raw`#include <iostream>

int main() {
    long long count = 0;
    long long sum = 0;
    long long min = 0;
    long long max = 0;
    long long x;
    while (std::cin >> x) {
        // TODO: update count, sum, min and max
    }
    // TODO: print count=0 when nothing was read, otherwise the four values
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int main() {
    long long count = 0;
    long long sum = 0;
    long long min = 0;
    long long max = 0;
    long long x;
    while (std::cin >> x) {
        if (count == 0 || x < min) min = x;
        if (count == 0 || x > max) max = x;
        sum += x;
        ++count;
    }
    if (count == 0) {
        std::cout << "count=0\n";
    } else {
        std::cout << "count=" << count << " sum=" << sum << " min=" << min << " max=" << max << '\n';
    }
    return 0;
}
`,
          hints: ["The first number is both the minimum and the maximum so far; treat count == 0 as the special case when updating them.", "Two billion plus two billion overflows int; sum in long long.", "Test count after the loop and print the short form when nothing was read."],
          cases: [
            { stdin: "3 1 4 1 5\n", expected: "count=5 sum=14 min=1 max=5\n" },
            { stdin: "10\n-20\n30\n", expected: "count=3 sum=20 min=-20 max=30\n" },
            { stdin: "\n", expected: "count=0\n", hidden: true },
            { stdin: "2000000000 2000000000\n", expected: "count=2 sum=4000000000 min=2000000000 max=2000000000\n", hidden: true },
            { stdin: "-7\n", expected: "count=1 sum=-7 min=-7 max=-7\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The input is `30⏎Ada⏎`. The code runs `int age; std::cin >> age; std::string name; std::getline(std::cin, name);`. What is `name`?",
          options: ["`\"Ada\"`", "`\"30\"`", "`\"\"` (empty)", "Undefined behaviour"],
          answer: 2,
          explanation: "`>>` consumes `30` and stops at the newline, leaving it in the buffer; `getline` reads up to that newline immediately and returns the empty rest of the first line. `std::cin.ignore()` between the two reads discards the leftover newline.",
        },
        {
          prompt: "`while (std::cin >> x)` stops when…",
          options: [
            "`x` is read as 0",
            "The extraction fails — at the end of the input, or on a token that is not a number",
            "A newline is read",
            "It never stops without a `break`",
          ],
          answer: 1,
          explanation: "`>>` returns the stream, and a stream converts to `false` once its fail bit is set. End of input and a malformed token both set it. Line boundaries are just whitespace to `>>` and never end the loop.",
        },
        {
          prompt: "What is the difference between `std::cout << x << '\\n';` and `std::cout << x << std::endl;`?",
          options: [
            "None — they are interchangeable",
            "`std::endl` also flushes the stream, which is a system call; in a loop of 100 000 lines it is dramatically slower",
            "`'\\n'` does not end the line on Linux",
            "`std::endl` is required for the judge to see the output",
          ],
          answer: 1,
          explanation: "Both write a newline; `endl` additionally forces the buffer out. The stream flushes on its own when the buffer fills and at program exit, so nothing is lost with `'\\n'`, and the judge sees everything.",
        },
        {
          prompt: "What does `std::cout << 1 << 2 << '\\n';` print?",
          options: ["`3`", "`12`", "`1 2`", "A compile error"],
          answer: 1,
          explanation: "`<<` writes each value in turn with nothing between them; separating spaces are the programmer's job. It is not addition — the values are written as text, one after the other.",
        },
        {
          prompt: "The next input characters are `3.7`. After `int x; std::cin >> x;`…",
          options: [
            "`x` is 3 and `.7` remains in the buffer for the next read",
            "`x` is 4 (rounded)",
            "The read fails and `x` is 0",
            "`x` is 3.7 — the stream converts as needed",
          ],
          answer: 0,
          explanation: "`>>` for an `int` reads a sign and digits and stops at the first character that cannot belong to an integer. `3` is consumed, `.7` is left, and the next `>>` will meet it — a `double` would read it as 0.7, an `int` would fail.",
        },
        {
          prompt: "What do `std::ios::sync_with_stdio(false); std::cin.tie(nullptr);` do?",
          options: [
            "Make the streams faster on large inputs, at the price of never mixing `printf`/`scanf` with them afterwards",
            "Disable output buffering so that every `<<` reaches the terminal immediately",
            "Are required before `std::getline` can be used",
            "Turn off all input validation",
          ],
          answer: 0,
          explanation: "The first line stops the C++ streams from staying in step with C's `stdio`; the second stops `cin` from flushing `cout` before every read. Together they are several times faster on big inputs. After them, mixing `printf` and `std::cout` can interleave output unpredictably.",
        },
        {
          prompt: "Which line prints exactly `66.67` for `double r = 200.0 / 3;`?",
          options: [
            "`std::cout << r;`",
            "`std::cout << std::fixed << std::setprecision(2) << r;`",
            "`std::cout << std::setprecision(2) << r;`",
            "`std::cout << std::setw(5) << r;`",
          ],
          answer: 1,
          explanation: "`std::fixed` makes `setprecision` count digits after the decimal point. Without `fixed`, `setprecision(2)` means two *significant* digits and prints `67`; the default prints six significant digits, `66.6667`; `setw` only pads.",
        },
      ],
    },
    {
      slug: "compilers-warnings-and-errors",
      file: "05-compilers-warnings-and-errors.md",
      exercises: [
        {
          title: "Diagnostic summary",
          prompt: `Summarise a compiler's output. Read lines until the input ends. A line is a diagnostic when it contains \`: error: \`, \`: warning: \` or \`: note: \`; everything before that marker is its location (\`file:line:col\`). Other lines (source excerpts, carets, \`1 error generated.\`) are ignored.

**Input:** zero or more lines.
**Output:** two lines: \`errors=<e> warnings=<w> notes=<n>\`, then \`first error: <location>\` for the first error line, or \`first error: none\`.

Read with \`while (std::getline(std::cin, line))\`; \`line.find(": error: ")\` returns the position of the marker or \`std::string::npos\` when it is absent, and \`line.substr(0, pos)\` is the location.

Example: input
\`\`\`text
main.cpp:12:5: error: use of undeclared identifier 'x'
main.cpp:3:10: note: 'y' declared here
main.cpp:20:9: warning: unused variable 'z' [-Wunused-variable]
util.cpp:4:1: error: expected ';' after expression
\`\`\`
→
\`\`\`text
errors=2 warnings=1 notes=1
first error: main.cpp:12:5
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int errors = 0;
    int warnings = 0;
    int notes = 0;
    std::string first_error;   // empty until the first error line is seen
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: classify the line by its marker; remember the location of the first error
    }
    // TODO: print the counts, then "first error: <location>" or "first error: none"
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int errors = 0;
    int warnings = 0;
    int notes = 0;
    std::string first_error;
    std::string line;
    while (std::getline(std::cin, line)) {
        std::size_t at = line.find(": error: ");
        if (at != std::string::npos) {
            ++errors;
            if (first_error.empty()) first_error = line.substr(0, at);
        } else if (line.find(": warning: ") != std::string::npos) {
            ++warnings;
        } else if (line.find(": note: ") != std::string::npos) {
            ++notes;
        }
    }
    std::cout << "errors=" << errors << " warnings=" << warnings << " notes=" << notes << '\n';
    if (first_error.empty()) {
        std::cout << "first error: none\n";
    } else {
        std::cout << "first error: " << first_error << '\n';
    }
    return 0;
}
`,
          hints: ["Compare the result of find with std::string::npos; any other value is a hit.", "Test for the error marker first and remember substr(0, at) only while first_error is still empty.", "Lines with no marker fall through every branch and count for nothing."],
          cases: [
            { stdin: "main.cpp:12:5: error: use of undeclared identifier 'x'\nmain.cpp:3:10: note: 'y' declared here\nmain.cpp:20:9: warning: unused variable 'z' [-Wunused-variable]\nutil.cpp:4:1: error: expected ';' after expression\n", expected: "errors=2 warnings=1 notes=1\nfirst error: main.cpp:12:5\n" },
            { stdin: "In file included from main.cpp:1:\nutil.h:7:3: warning: comparison of integers of different signs [-Wsign-compare]\n", expected: "errors=0 warnings=1 notes=0\nfirst error: none\n" },
            { stdin: "\n", expected: "errors=0 warnings=0 notes=0\nfirst error: none\n", hidden: true },
            { stdin: "a.cpp:1:1: error: x\na.cpp:2:2: error: y\na.cpp:3:3: error: z\n3 errors generated.\n", expected: "errors=3 warnings=0 notes=0\nfirst error: a.cpp:1:1\n", hidden: true },
            { stdin: "1 error generated.\nmain.cpp:5:3: note: candidate function\n    5 |     void f(int);\n", expected: "errors=0 warnings=0 notes=1\nfirst error: none\n", hidden: true },
          ],
        },
        {
          title: "Warnings as errors",
          prompt: `Apply \`-Werror\` to a compiler's output. The first line of input is the set of flags the build used, for example \`-Wall -Werror\` or \`-O2 -Wall\`. Every following line is compiler output. When the flags contain \`-Werror\`, every \`: warning: \` marker is rewritten to \`: error: \` before the line is printed; otherwise lines are printed unchanged. Every line is echoed. After the last line print Clang's summary: \`<w> warning(s) and <e> error(s) generated.\` with correct singular/plural forms and only the non-zero parts — \`1 warning generated.\`, \`2 errors generated.\`, \`1 warning and 2 errors generated.\` — or \`build ok\` when there were neither.

**Input:** the flags line, then zero or more lines of compiler output.
**Output:** every output line (promoted when \`-Werror\` is on), then the summary line.

\`line.find(": warning: ")\` locates the marker and \`line.replace(pos, len, ": error: ")\` rewrites it in place.

Example: input
\`\`\`text
-Wall -Werror
main.cpp:4:9: warning: unused variable 'x' [-Wunused-variable]
main.cpp:9:1: error: expected ';' after expression
\`\`\`
→
\`\`\`text
main.cpp:4:9: error: unused variable 'x' [-Wunused-variable]
main.cpp:9:1: error: expected ';' after expression
2 errors generated.
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string flags;
    std::getline(std::cin, flags);
    bool werror = false;   // TODO: true when flags contains "-Werror"
    int errors = 0;
    int warnings = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: promote a warning marker when werror is set, count the line, print it
    }
    // TODO: print the summary line, or "build ok"
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    std::string flags;
    std::getline(std::cin, flags);
    bool werror = flags.find("-Werror") != std::string::npos;
    const std::string warning_marker = ": warning: ";
    int errors = 0;
    int warnings = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        std::size_t at = line.find(warning_marker);
        if (werror && at != std::string::npos) {
            line.replace(at, warning_marker.size(), ": error: ");
        }
        if (line.find(": error: ") != std::string::npos) ++errors;
        else if (line.find(": warning: ") != std::string::npos) ++warnings;
        std::cout << line << '\n';
    }
    if (errors == 0 && warnings == 0) {
        std::cout << "build ok\n";
        return 0;
    }
    if (warnings > 0) std::cout << warnings << (warnings == 1 ? " warning" : " warnings");
    if (warnings > 0 && errors > 0) std::cout << " and ";
    if (errors > 0) std::cout << errors << (errors == 1 ? " error" : " errors");
    std::cout << " generated.\n";
    return 0;
}
`,
          hints: ["flags.find(\"-Werror\") != std::string::npos is the whole -Werror test.", "Rewrite the marker before counting, so a promoted warning counts as an error.", "Build the summary from three conditional pieces: the warnings part, \" and \" when both are present, the errors part."],
          cases: [
            { stdin: "-Wall -Werror\nmain.cpp:4:9: warning: unused variable 'x' [-Wunused-variable]\nmain.cpp:9:1: error: expected ';' after expression\n", expected: "main.cpp:4:9: error: unused variable 'x' [-Wunused-variable]\nmain.cpp:9:1: error: expected ';' after expression\n2 errors generated.\n" },
            { stdin: "-Wall\nmain.cpp:4:9: warning: unused variable 'x' [-Wunused-variable]\n", expected: "main.cpp:4:9: warning: unused variable 'x' [-Wunused-variable]\n1 warning generated.\n" },
            { stdin: "-Wall -Wextra\n", expected: "build ok\n", hidden: true },
            { stdin: "-O2\na.cpp:1:1: warning: w1\na.cpp:2:1: warning: w2\na.cpp:3:1: error: e1\n    3 |     int x = y;\n", expected: "a.cpp:1:1: warning: w1\na.cpp:2:1: warning: w2\na.cpp:3:1: error: e1\n    3 |     int x = y;\n2 warnings and 1 error generated.\n", hidden: true },
            { stdin: "-Werror\nx.cpp:2:3: warning: only one\n", expected: "x.cpp:2:3: error: only one\n1 error generated.\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `main.cpp:12:5: error: use of undeclared identifier 'x'`, what are `12` and `5`?",
          options: ["The error code and its severity", "The line and the column", "The column and the line", "The number of errors so far and the number of notes"],
          answer: 1,
          explanation: "GCC and Clang diagnostics are `file:line:column: severity: message`. Line 12, column 5 is where the caret under the source line points; every editor can jump there from the text.",
        },
        {
          prompt: "What does `-Werror` do?",
          options: ["Enables every warning", "Turns warnings into errors, so a build with any warning fails", "Suppresses warnings and shows only errors", "Prints more detail for each error"],
          answer: 1,
          explanation: "`-Wall` and `-Wextra` enable warnings; `-Werror` changes their severity so the compiler refuses to produce output. Teams use it to keep the warning count at zero. `-w` (lower case) is the flag that suppresses warnings — and hides bugs.",
        },
        {
          prompt: "A call to `std::sort` on a vector of your own type produces 300 lines of errors. Where do you look first?",
          options: [
            "The last line — that is where the compiler gave up",
            "The first error line for the actual problem, and the `required from here` (or `in instantiation of … requested here`) line that names your call",
            "The middle of the output, where the library code is",
            "Nowhere — add `-w` and try again",
          ],
          answer: 1,
          explanation: "A template error is reported where the instantiation failed, deep in the library, followed by the chain back to the line that triggered it. The first line says what is missing (here, an `operator<` for your type); the `required from here` line says which of your lines caused it. The rest is plumbing.",
        },
        {
          prompt: "What does `-fsanitize=address,undefined` do?",
          options: [
            "Makes the program run faster by removing checks",
            "Instruments the compiled program to report memory errors and undefined behaviour at run time, naming the line",
            "Fixes the bugs it finds",
            "Is a linker flag that removes unused symbols",
          ],
          answer: 1,
          explanation: "AddressSanitizer catches out-of-bounds accesses, use-after-free and leaks; UndefinedBehaviorSanitizer catches signed overflow, bad shifts and null dereferences. The program runs slower and prints a report when it hits one; nothing is fixed for you.",
        },
        {
          prompt: "Which of these can NO warning flag catch at compile time?",
          options: [
            "A variable that is declared and never used",
            "A non-void function with a path that reaches its end without `return`",
            "Indexing a vector with a value read from input that turns out to be out of range",
            "Comparing a signed `int` with an unsigned `size_t`",
          ],
          answer: 2,
          explanation: "The compiler cannot know what the input will be; an index it cannot see is exactly what AddressSanitizer or `at()` catches at run time. The other three are static properties of the code: `-Wunused-variable`, `-Wreturn-type` and `-Wsign-compare` report them.",
        },
        {
          prompt: "What does the study judge compile every exercise with?",
          options: [
            "GCC 14 with `-std=c++17` and no optimisation",
            "Clang 18 with `-std=c++20 -O2` and libstdc++ 14, on x86-64 Linux",
            "MSVC with `/std:c++20`",
            "An interpreter that runs C++ line by line",
          ],
          answer: 1,
          explanation: "Clang 18, C++20, optimised, with the same standard-library generation as GCC 14. There are no sanitizers on the judge, so a run that fails there tells you *that* it failed, not why — test locally with `-fsanitize=address,undefined` when a hidden case fails.",
        },
        {
          prompt: "Which output tells you the problem is in the *link* stage, not the compiler?",
          options: [
            "`main.cpp:8:5: error: expected ';' after expression`",
            "`undefined reference to 'compute(int)'` followed by `collect2: error: ld returned 1 exit status`",
            "`main.cpp:3:1: warning: unused variable 'n'`",
            "`1 error generated.`",
          ],
          answer: 1,
          explanation: "`ld` is the linker and `collect2` is GCC's wrapper around it; `undefined reference` means every file compiled but no object file defines the symbol. The other three are compiler messages with a file, line and column.",
        },
      ],
    },
    {
      slug: "toolchain-checkpoint",
      file: "06-toolchain-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Multiplication table",
          prompt: `Read an integer \`n\` (1 ≤ n ≤ 12) and print the multiplication table for 1 through \`n\`: row \`i\` contains \`i×1, i×2, …, i×n\`, each number right-aligned in a field of width 4, with no trailing text.

**Input:** \`n\`.
**Output:** \`n\` lines of \`n\` numbers.

Use \`std::setw(4)\` from \`<iomanip>\` before each number; it applies to the next value only.

Example: \`n = 3\` →
\`\`\`text
   1   2   3
   2   4   6
   3   6   9
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    // TODO: two nested loops; std::setw(4) before every number; '\n' after every row
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= n; ++j) {
            std::cout << std::setw(4) << i * j;
        }
        std::cout << '\n';
    }
    return 0;
}
`,
          hints: ["Rows are i, columns are j; the value in each cell is i * j.", "std::setw(4) right-aligns the next value in four characters, so no separating spaces are needed."],
          cases: [
            { stdin: "3\n", expected: "   1   2   3\n   2   4   6\n   3   6   9\n" },
            { stdin: "1\n", expected: "   1\n" },
            { stdin: "5\n", expected: "   1   2   3   4   5\n   2   4   6   8  10\n   3   6   9  12  15\n   4   8  12  16  20\n   5  10  15  20  25\n", hidden: true },
            { stdin: "10\n", expected: "   1   2   3   4   5   6   7   8   9  10\n   2   4   6   8  10  12  14  16  18  20\n   3   6   9  12  15  18  21  24  27  30\n   4   8  12  16  20  24  28  32  36  40\n   5  10  15  20  25  30  35  40  45  50\n   6  12  18  24  30  36  42  48  54  60\n   7  14  21  28  35  42  49  56  63  70\n   8  16  24  32  40  48  56  64  72  80\n   9  18  27  36  45  54  63  72  81  90\n  10  20  30  40  50  60  70  80  90 100\n", hidden: true },
          ],
        },
        {
          title: "Word count",
          prompt: `Implement a tiny \`wc\`: read all of standard input until it ends and print three lines — the number of lines, the number of words (whitespace-separated tokens) and the number of characters, counting every character including spaces and the newline that ends each line.

**Input:** zero or more lines, each ending in a newline.
**Output:** \`lines=<l>\`, \`words=<w>\`, \`chars=<c>\`.

Use \`while (std::getline(std::cin, line))\`; every line read counts as one line and contributes its length plus one. Count the words on a line by wrapping it in a \`std::istringstream\` and extracting with \`>>\` until that fails.

Example: input
\`\`\`text
the quick brown
fox
\`\`\`
→
\`\`\`text
lines=2
words=4
chars=20
\`\`\``,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <string>

int main() {
    long long lines = 0;
    long long words = 0;
    long long chars = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: count the line, its characters (plus the newline), and its words
    }
    std::cout << "lines=" << lines << '\n';
    std::cout << "words=" << words << '\n';
    std::cout << "chars=" << chars << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <string>

int main() {
    long long lines = 0;
    long long words = 0;
    long long chars = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        ++lines;
        chars += static_cast<long long>(line.size()) + 1;   // + 1 for the newline getline consumed
        std::istringstream tokens(line);
        std::string word;
        while (tokens >> word) ++words;
    }
    std::cout << "lines=" << lines << '\n';
    std::cout << "words=" << words << '\n';
    std::cout << "chars=" << chars << '\n';
    return 0;
}
`,
          hints: ["getline strips the newline, so add one to the line's length for it.", "std::istringstream tokens(line); then while (tokens >> word) counts words without any hand parsing.", "An empty line has zero words but still counts one line and one character."],
          cases: [
            { stdin: "the quick brown\nfox\n", expected: "lines=2\nwords=4\nchars=20\n" },
            { stdin: "one\n\ntwo  three\n", expected: "lines=3\nwords=3\nchars=16\n" },
            { stdin: "a\n", expected: "lines=1\nwords=1\nchars=2\n", hidden: true },
            { stdin: "   \n", expected: "lines=1\nwords=0\nchars=4\n", hidden: true },
          ],
        },
        {
          title: "Student report",
          prompt: `Read an integer \`n\`, then \`n\` students. Each student takes two lines: the name (which may contain spaces), then a count \`k\` (at least 1) followed by \`k\` integer marks on the same line. Print one line per student, \`<name>: <sum> (<average>)\` with the average fixed to two decimals, then \`top: <name>\` for the student with the highest average — the first such student if several tie.

**Input:** \`n\`, then \`n\` pairs of lines.
**Output:** \`n\` report lines, then the \`top:\` line.

This mixes every reading pattern: \`>>\` for \`n\`, \`std::cin.ignore()\` before the first \`std::getline\`, \`getline\` for the name, \`>>\` for the marks, and \`ignore()\` again before the next name.

Example: input
\`\`\`text
2
Ada Lovelace
3 90 80 70
Alan Turing
2 100 95
\`\`\`
→
\`\`\`text
Ada Lovelace: 240 (80.00)
Alan Turing: 195 (97.50)
top: Alan Turing
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    std::cout << std::fixed << std::setprecision(2);
    std::string best_name;
    double best_average = -1.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::getline(std::cin, name);
        int k;
        std::cin >> k;
        // TODO: read k marks into a long long sum, then discard the rest of the line
        // TODO: print the report line and track the best average
    }
    std::cout << "top: " << best_name << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    std::cout << std::fixed << std::setprecision(2);
    std::string best_name;
    double best_average = -1.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::getline(std::cin, name);
        int k;
        std::cin >> k;
        long long sum = 0;
        for (int j = 0; j < k; ++j) {
            long long mark;
            std::cin >> mark;
            sum += mark;
        }
        std::cin.ignore();   // the newline after the last mark, before the next name
        double average = static_cast<double>(sum) / k;
        std::cout << name << ": " << sum << " (" << average << ")\n";
        if (average > best_average) {
            best_average = average;
            best_name = name;
        }
    }
    std::cout << "top: " << best_name << '\n';
    return 0;
}
`,
          hints: ["After the marks, the newline is still in the buffer; without ignore() the next name reads as empty.", "Divide as double: static_cast<double>(sum) / k, or integer division truncates.", "Use a strict > when comparing averages so that the first of equal averages keeps the top spot."],
          cases: [
            { stdin: "2\nAda Lovelace\n3 90 80 70\nAlan Turing\n2 100 95\n", expected: "Ada Lovelace: 240 (80.00)\nAlan Turing: 195 (97.50)\ntop: Alan Turing\n" },
            { stdin: "1\nGrace Hopper\n4 100 100 100 99\n", expected: "Grace Hopper: 399 (99.75)\ntop: Grace Hopper\n" },
            { stdin: "2\nA\n1 10\nB\n2 10 10\n", expected: "A: 10 (10.00)\nB: 20 (10.00)\ntop: A\n", hidden: true },
            { stdin: "3\nx\n1 0\ny\n2 1 2\nz\n3 3 3 3\n", expected: "x: 0 (0.00)\ny: 3 (1.50)\nz: 9 (3.00)\ntop: z\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Who created C++, and where?",
          options: ["Dennis Ritchie, at Bell Labs, in 1972", "Bjarne Stroustrup, at Bell Labs, starting in 1979", "James Gosling, at Sun Microsystems, in 1995", "An ISO committee, in 1998"],
          answer: 1,
          explanation: "Stroustrup's \"C with Classes\" began in 1979 and was renamed C++ in 1983; ISO standardised it in 1998. Ritchie created C; Gosling created Java.",
        },
        {
          prompt: "The four build stages, in order:",
          options: ["Compile, preprocess, assemble, link", "Preprocess, compile, assemble, link", "Link, compile, preprocess, run", "Preprocess, link, compile, assemble"],
          answer: 1,
          explanation: "The preprocessor pastes and substitutes text, the compiler turns the translation unit into assembly, the assembler produces an object file, and the linker resolves symbols across object files into an executable.",
        },
        {
          prompt: "Which flag selects the edition of the language the compiler accepts?",
          options: ["`-O2`", "`-std=c++20`", "`-Wall`", "`-c`"],
          answer: 1,
          explanation: "`-std=` names the standard. `-O2` is optimisation, `-Wall` enables warnings, `-c` compiles to an object file without linking.",
        },
        {
          prompt: "What does this print?\n\n```cpp\n#include <iostream>\nint main() {\n    int a = 5;\n    int b = a;\n    b = 7;\n    std::cout << a << b << '\\n';\n}\n```",
          options: ["`57`", "`77`", "`55`", "A compile error: `main` has no `return`"],
          answer: 0,
          explanation: "`b = a` copies the value; changing `b` afterwards leaves `a` at 5, and `<<` writes the two numbers with nothing between them. `main` may omit its `return` and yields 0.",
        },
        {
          prompt: "An `#include` directive is…",
          options: ["A request to load a library at run time", "A textual insertion of the file by the preprocessor, before compilation", "An instruction to the linker", "A namespace import, like Java's `import`"],
          answer: 1,
          explanation: "The preprocessor pastes the file's text in place; the compiler then sees one large translation unit. Nothing is loaded at run time, and — unlike `import` — the compiler has no notion of the header as a unit afterwards.",
        },
        {
          prompt: "`error: 'compute' was not declared in this scope` is reported by…",
          options: ["The linker", "The compiler — the name is unknown in this translation unit; a declaration or include is missing", "The preprocessor", "The operating system"],
          answer: 1,
          explanation: "The compiler needs a declaration to check a call, and it has none. Contrast `undefined reference`, which is the linker saying a declared symbol has no definition anywhere.",
        },
        {
          prompt: "`using namespace std;` at the top of a single small `.cpp` file is…",
          options: [
            "A compile error",
            "Legal and common in scratch and contest code, but it opens every `std` name to clashes, so this track writes `std::` explicitly",
            "Required for `std::cout` to work",
            "A run-time cost",
          ],
          answer: 1,
          explanation: "The directive is fine where nothing else can include the file. It becomes a liability in headers and in any file that defines its own `count`, `size` or `max`. The explicit prefix costs five characters and removes the doubt.",
        },
        {
          prompt: "The input is `4⏎abc⏎`. After `int n; std::cin >> n; std::string line; std::getline(std::cin, line);`, `line` is…",
          options: ["`\"abc\"`", "`\"\"` (empty)", "`\"4\"`", "`\"4abc\"`"],
          answer: 1,
          explanation: "`>>` leaves the newline after `4` in the buffer and `getline` returns the empty remainder of that line. The `abc` is still unread.",
        },
        {
          prompt: "Which single call fixes the previous problem?",
          options: ["`std::cin.clear();`", "`std::cin.ignore();` after reading `n`", "`std::cout.flush();`", "`std::cin.sync();`"],
          answer: 1,
          explanation: "`ignore()` discards the leftover newline so the next `getline` starts on the next line. `clear()` resets error flags (there are none here), `flush` concerns output, and `sync()` has no defined effect on a standard input stream.",
        },
        {
          prompt: "A solution reads a million integers and times out. Which two lines are the standard speed-up?",
          options: [
            "`std::ios::sync_with_stdio(false); std::cin.tie(nullptr);`",
            "`#include <bits/stdc++.h>` and `using namespace std;`",
            "`std::cin.ignore(); std::cin.clear();`",
            "`std::cout << std::endl;` after every read",
          ],
          answer: 0,
          explanation: "Unsynchronising from C stdio and untying `cin` from `cout` makes the streams several times faster. The include and the directive change nothing at run time; `endl` in a loop makes things slower, not faster.",
        },
        {
          prompt: "What does `std::cout << 7 / 2 << ' ' << 7.0 / 2 << '\\n';` print?",
          options: ["`3 3.5`", "`3.5 3.5`", "`3 3`", "`4 3.5`"],
          answer: 0,
          explanation: "`7 / 2` is integer division and truncates to 3; `7.0 / 2` has a `double` operand, so the division is floating-point and prints `3.5` in the default format.",
        },
        {
          prompt: "Which statement about undefined behaviour is correct?",
          options: [
            "The program always crashes at the offending line",
            "The compiler may assume it never happens, so the program may do anything — including appear to work",
            "It is reported as a compile error",
            "Sanitizers turn it into defined behaviour",
          ],
          answer: 1,
          explanation: "The standard makes no promise, and the optimiser exploits that freedom: checks can vanish and results can be nonsense that looks fine in testing. Sanitizers *detect* UB at run time; they do not define it.",
        },
        {
          prompt: "The build printed `warning: unused variable 'x' [-Wunused-variable]` and nothing else. What happened?",
          options: [
            "The build failed",
            "The build succeeded; the bracketed text names the flag that raised the warning, and `-Werror` would have turned it into a failure",
            "`x` was read before being initialised",
            "`x` is declared twice",
          ],
          answer: 1,
          explanation: "A warning does not stop the build. The `[-W…]` suffix names the specific flag, which is how you find the documentation or silence one case deliberately. Under `-Werror` the same line would be an error.",
        },
        {
          prompt: "Which of these makes the judge report a runtime error?",
          options: ["Printing to `std::cerr`", "`return 1;` from `main`, or an uncaught exception", "Printing a trailing space at the end of a line", "Using `'\\n'` instead of `std::endl`"],
          answer: 1,
          explanation: "The judge checks the exit code first: non-zero is failure. Standard error is ignored, trailing whitespace is normalised away, and `'\\n'` is the recommended way to end a line.",
        },
        {
          prompt: "What does `-O2` do, and why does it matter on the judge?",
          options: [
            "Enables the second tier of warnings",
            "Asks for optimisation; the judge compiles with it, so code relying on undefined behaviour may behave differently from an unoptimised local build",
            "Selects the second version of the language standard",
            "Links the program twice for safety",
          ],
          answer: 1,
          explanation: "Optimisation levels change what the compiler assumes and reorders; undefined behaviour that happened to \"work\" at `-O0` can be folded into something else at `-O2`. Warnings are `-Wall`/`-Wextra`; the standard is `-std=`.",
        },
      ],
    },
  ],
});

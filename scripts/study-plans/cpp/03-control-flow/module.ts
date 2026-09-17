import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "control-flow",
  title: "Control flow",
  blurb: "if/else and the conditional operator, switch with fallthrough and enums, the three loops and the unsigned countdown trap, range-based for with auto& and structured bindings, and the loop patterns every program is built from.",
  icon: "branch",
  overview: `Control flow is where a C++ program stops being a formula and starts being a program: it decides, it repeats, and it stops. The statements are the ones C had and Java copied — \`if\`, \`switch\`, \`for\`, \`while\`, \`do … while\` — but C++ evaluates them by its own rules. A condition is *converted* to \`bool\` rather than required to be one, so \`if (n = 5)\` compiles; \`0 < x < 10\` parses and is always true; a \`switch\` falls through unless told not to and refuses a \`std::string\` outright; and a countdown on an unsigned index never reaches \`-1\`, because unsigned arithmetic wraps. Every one of those is a bug that compiles, and this module is where you stop writing them.

The five lessons move from the branch to the loop to the loop *pattern*. Branching covers \`if\`/\`else\`, the C++17 \`if\` with initialiser, the conditional operator's type rules and short-circuit evaluation as a guard. Switch covers labels, \`[[fallthrough]]\`, switching on an \`enum class\` without a \`default\` so the compiler reports a missing case, and what to do instead of switching on a string. Loops fixes the three shapes, the half-open range convention, \`break\`/\`continue\`, the unsigned countdown trap and how to leave two nested loops. Range-based \`for\` settles \`auto\` versus \`auto&\` versus \`const auto&\` — the silent copy trap — structured bindings over a \`std::map\`, and why a container must not change while it is being walked. Loop patterns catalogues the shapes every later exercise reuses: search with early exit, accumulate and min/max, sentinel-terminated and until-EOF input, the invariant comment, the two-pointer sweep and building output once.

The exercises are whole programs that read standard input the way Module 1 taught — \`std::cin >>\` for tokens, \`std::getline\` for lines, \`std::cin.ignore()\` between them — and each one is built on the construct its lesson teaches: a grade table of nested ifs, a days-in-month calculator, a command interpreter that maps words to an enum and switches, a privilege ladder with \`[[fallthrough]]\`, a countdown that survives \`n = 0\`, a nested pair search, a word-frequency table printed in map order, an in-place clamp through \`auto&\`, a sentinel-terminated statistics reader and a two-pointer pair sweep. The checkpoint adds a run-length encoder, a bank ledger that reads until the input ends, and a prime lister with nested loops and an early exit.`,
  lessons: [
    {
      slug: "branching",
      file: "01-branching.md",
      exercises: [
        {
          title: "Letter grades with modifiers",
          prompt: `Read an integer \`n\`, then \`n\` lines each holding a name (one word) and an integer score. For each line print \`<name>: <grade>\`.

The band comes from an \`if\`/\`else if\` chain: 90–100 is \`A\`, 80–89 \`B\`, 70–79 \`C\`, 60–69 \`D\`, 0–59 \`F\`. Inside a band other than \`F\`, a **nested** \`if\` adds a modifier: \`+\` when the last digit of the score is 7, 8 or 9 (and always for 100), \`-\` when the last digit is 0, 1 or 2 (never for 100), nothing otherwise. A score below 0 or above 100 prints \`<name>: invalid\`.

**Input:** \`n\`, then \`n\` lines of \`name score\`.
**Output:** \`n\` lines.

\`\`\`text
4
ada 93
bob 100
cy 65
dee 41
\`\`\`
prints
\`\`\`text
ada: A
bob: A+
cy: D
dee: F
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int score;
        std::cin >> name >> score;
        std::string grade;
        // TODO: reject scores outside 0..100, pick the band, then the modifier
        std::cout << name << ": " << grade << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int score;
        std::cin >> name >> score;
        std::string grade;
        if (score < 0 || score > 100) {
            grade = "invalid";
        } else {
            if (score >= 90) grade = "A";
            else if (score >= 80) grade = "B";
            else if (score >= 70) grade = "C";
            else if (score >= 60) grade = "D";
            else grade = "F";
            if (grade != "F") {
                const int lastDigit = score % 10;
                if (score == 100 || lastDigit >= 7) grade += '+';
                else if (lastDigit <= 2) grade += '-';
            }
        }
        std::cout << name << ": " << grade << '\n';
    }
    return 0;
}
`,
          hints: [
            "Test the invalid range first; everything else is an else branch of that test.",
            "score % 10 is the last digit; compare it inside the band, not in the band chain.",
            "100 needs its own test before the last-digit rule, or it would read as an A-.",
          ],
          cases: [
            { stdin: "4\nada 93\nbob 100\ncy 65\ndee 41\n", expected: "ada: A\nbob: A+\ncy: D\ndee: F\n" },
            { stdin: "3\neve 87\nfay 70\ngus 59\n", expected: "eve: B+\nfay: C-\ngus: F\n" },
            { stdin: "3\nhal 101\nivy -5\njo 0\n", expected: "hal: invalid\nivy: invalid\njo: F\n", hidden: true },
            { stdin: "2\nkim 90\nlee 62\n", expected: "kim: A-\nlee: D-\n", hidden: true },
            { stdin: "1\nmax 79\n", expected: "max: C+\n", hidden: true },
          ],
        },
        {
          title: "Days in a month",
          prompt: `Read an integer \`n\`, then \`n\` queries of \`year month\`. For each, print \`<year>/<month>: <days>\` — the number of days in that month — or \`<year>/<month>: invalid\` when the month is not 1–12.

A year is a leap year when it is divisible by 4 but not by 100, or divisible by 400; February has 29 days in a leap year and 28 otherwise. April, June, September and November have 30 days; the rest have 31. Compute the leap flag once per query — the C++17 \`if\` with initialiser is a good fit — and use the conditional operator to choose between 29 and 28.

**Input:** \`n\`, then \`n\` lines of \`year month\`.
**Output:** \`n\` lines.

Example: \`2024 2\` → \`2024/2: 29\`; \`1900 2\` → \`1900/2: 28\`; \`2023 13\` → \`2023/13: invalid\`.`,
          starter: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int year, month;
        std::cin >> year >> month;
        std::cout << year << '/' << month << ": ";
        // TODO: invalid month, February with the leap rule, 30-day months, the rest
        std::cout << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int year, month;
        std::cin >> year >> month;
        std::cout << year << '/' << month << ": ";
        if (month < 1 || month > 12) {
            std::cout << "invalid\n";
        } else if (const bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0; month == 2) {
            std::cout << (leap ? 29 : 28) << '\n';
        } else if (month == 4 || month == 6 || month == 9 || month == 11) {
            std::cout << 30 << '\n';
        } else {
            std::cout << 31 << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Check the month range first so every later branch can trust it.",
            "The leap rule is one boolean expression: (y % 4 == 0 && y % 100 != 0) || y % 400 == 0.",
            "Parenthesise the conditional operator when it is an operand of <<.",
          ],
          cases: [
            { stdin: "4\n2024 2\n2023 2\n2024 4\n2024 12\n", expected: "2024/2: 29\n2023/2: 28\n2024/4: 30\n2024/12: 31\n" },
            { stdin: "2\n1900 2\n2000 2\n", expected: "1900/2: 28\n2000/2: 29\n" },
            { stdin: "3\n2024 13\n2024 0\n2100 2\n", expected: "2024/13: invalid\n2024/0: invalid\n2100/2: 28\n", hidden: true },
            { stdin: "2\n2023 9\n2023 1\n", expected: "2023/9: 30\n2023/1: 31\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint x = 5;\nif (0 < x < 3) std::cout << \"in\";\nelse std::cout << \"out\";\n\`\`\`",
          options: ["`in`", "`out`", "Compile error", "Undefined behaviour"],
          answer: 0,
          explanation: "`0 < x < 3` is `(0 < x) < 3`. The inner comparison is `true`, which promotes to `1`, and `1 < 3` holds — so the branch runs for every `x`. Write `0 < x && x < 3`.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint n = 0;\nif (n = 2) std::cout << \"yes\";\nelse std::cout << \"no\";\n\`\`\`",
          options: ["`yes`", "`no`", "Compile error", "Nothing"],
          answer: 0,
          explanation: "`n = 2` is an assignment whose value is `2`, and `2` converts to `true`. It compiles; `-Wall` warns \"suggest parentheses around assignment used as truth value\", which is the warning that catches a missing `=`.",
        },
        {
          prompt: "In `if (auto it = m.find(k); it != m.end()) { A } else { B }`, where is `it` in scope?",
          options: ["Only in block `A`", "In both `A` and `B`, and nowhere after the statement", "From the `if` to the end of the enclosing block", "Only inside the condition"],
          answer: 1,
          explanation: "The C++17 initialiser is scoped to the whole `if` statement: both branches can use it and it is destroyed after the `else`. Before C++17 the variable had to be declared outside and lived on for the rest of the block.",
        },
        {
          prompt: "Which condition reads `v[i]` only when `i` is a valid index?",
          options: ["`if (v[i] == 7 && i < v.size())`", "`if (i < v.size() && v[i] == 7)`", "`if (i < v.size() & v[i] == 7)`", "`if (v[i] == 7 || i < v.size())`"],
          answer: 1,
          explanation: "`&&` evaluates left to right and stops at the first `false`, so the bounds check guards the subscript. Reversing the operands reads out of range first; the bitwise `&` always evaluates both sides; `||` does not guard at all.",
        },
        {
          prompt: "What happens here?\n\n\`\`\`cpp\nint n = 1;\nstd::cout << n == 1 ? \"one\" : \"many\";\n\`\`\`",
          options: ["Prints `one`", "Prints `many`", "Prints `1`", "Compile error"],
          answer: 3,
          explanation: "`<<` binds tighter than `==` and `?:`, so this parses as `(std::cout << n) == 1 ? …`, and there is no `==` between an `ostream` and an `int`. Parenthesise the whole conditional: `std::cout << (n == 1 ? \"one\" : \"many\")`.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint a = 0, b = 1;\nif (a)\n    if (b) std::cout << \"A\";\nelse std::cout << \"B\";\n\`\`\`",
          options: ["`A`", "`B`", "Nothing", "Compile error"],
          answer: 2,
          explanation: "The `else` pairs with the nearest unmatched `if` — `if (b)` — whatever the indentation suggests. `a` is 0, so the entire inner statement, its `else` included, is skipped and nothing prints. Read as indented it would print `B`; braces would make the two readings agree.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint a = 3;\ndouble d = a > 2 ? 1 : 2.5;\nstd::cout << d;\n\`\`\`",
          options: ["`1`", "`1.0`", "`2.5`", "Compile error"],
          answer: 0,
          explanation: "Both arms of `?:` are converted to a common type — here `double` — so the result is `1.0`, and `std::cout` prints a `double` with no fractional part as `1`. The arms must convert to one type; they need not already have it.",
        },
      ],
    },
    {
      slug: "switch-statements",
      file: "02-switch-statements.md",
      exercises: [
        {
          title: "A command interpreter",
          prompt: `Write an interpreter for a one-register machine. The register starts at 0 and holds a \`long long\`. Read commands one per line until \`quit\` or the end of input:

- \`add N\`, \`sub N\`, \`mul N\` — apply the operation with the integer \`N\`
- \`neg\` — negate the register
- \`show\` — print \`value=<register>\`
- \`reset\` — set the register to 0
- \`quit\` — stop; nothing after it is processed
- anything else — print \`unknown command: <word>\`

Map the word to an \`enum class\` first, then \`switch\` on the enum. Remember that \`break\` inside the \`switch\` leaves the switch, not the reading loop — \`quit\` needs a flag the loop condition checks.

**Input:** commands, one per line.
**Output:** one line per \`show\` and per unknown command.

\`\`\`text
add 5
mul 3
show
sub 20
neg
show
quit
\`\`\`
prints
\`\`\`text
value=15
value=5
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

enum class Op { Add, Sub, Mul, Neg, Show, Reset, Quit, Unknown };

int main() {
    long long acc = 0;
    bool running = true;
    std::string word;
    while (running && std::cin >> word) {
        Op op = Op::Unknown;
        // TODO: map word to an Op
        switch (op) {
            // TODO: one case per Op; read the operand inside add/sub/mul
            default:
                std::cout << "unknown command: " << word << '\n';
                break;
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

enum class Op { Add, Sub, Mul, Neg, Show, Reset, Quit, Unknown };

int main() {
    long long acc = 0;
    bool running = true;
    std::string word;
    while (running && std::cin >> word) {
        Op op = Op::Unknown;
        if (word == "add") op = Op::Add;
        else if (word == "sub") op = Op::Sub;
        else if (word == "mul") op = Op::Mul;
        else if (word == "neg") op = Op::Neg;
        else if (word == "show") op = Op::Show;
        else if (word == "reset") op = Op::Reset;
        else if (word == "quit") op = Op::Quit;

        switch (op) {
            case Op::Add: {
                long long value;
                std::cin >> value;
                acc += value;
                break;
            }
            case Op::Sub: {
                long long value;
                std::cin >> value;
                acc -= value;
                break;
            }
            case Op::Mul: {
                long long value;
                std::cin >> value;
                acc *= value;
                break;
            }
            case Op::Neg:
                acc = -acc;
                break;
            case Op::Show:
                std::cout << "value=" << acc << '\n';
                break;
            case Op::Reset:
                acc = 0;
                break;
            case Op::Quit:
                running = false;   // break alone would only leave the switch
                break;
            case Op::Unknown:
                std::cout << "unknown command: " << word << '\n';
                break;
        }
    }
    return 0;
}
`,
          hints: [
            "An if/else if chain comparing word with == turns the string into an Op before the switch.",
            "A case that declares a variable (the operand) needs its own braces.",
            "Set running = false in the quit case; the while condition tests it before the next read.",
          ],
          cases: [
            { stdin: "add 5\nmul 3\nshow\nsub 20\nneg\nshow\nquit\n", expected: "value=15\nvalue=5\n" },
            { stdin: "show\nfly\nadd 2\nshow\n", expected: "value=0\nunknown command: fly\nvalue=2\n" },
            { stdin: "add 1000000000\nmul 1000000000\nshow\nreset\nshow\nquit\nshow\n", expected: "value=1000000000000000000\nvalue=0\n", hidden: true },
            { stdin: "neg\nshow\nsub 7\nneg\nshow\n", expected: "value=0\nvalue=7\n", hidden: true },
          ],
        },
        {
          title: "A privilege ladder",
          prompt: `Read an integer \`n\`, then \`n\` lines each holding a name and a one-letter role. Roles are cumulative: an admin (\`a\` or \`A\`) may delete, write and read; an editor (\`e\` or \`E\`) may write and read; a viewer (\`v\` or \`V\`) may read. Print \`<name>: <rights>\` with the rights in that order, separated by single spaces — \`delete write read\`, \`write read\` or \`read\` — or \`<name>: no access\` for any other letter.

Write one \`switch\` on the role character: stack the two letters of each role as empty labels, and let the cases fall into each other with \`[[fallthrough]];\` so each level adds its word before the level below adds the next.

**Input:** \`n\`, then \`n\` lines of \`name role\`.
**Output:** \`n\` lines.

\`\`\`text
3
ada A
bob e
cy v
\`\`\`
prints
\`\`\`text
ada: delete write read
bob: write read
cy: read
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string name;
        char role;
        std::cin >> name >> role;
        std::string rights;
        switch (role) {
            // TODO: 'a'/'A' add "delete " and fall through; 'e'/'E' add "write " and fall through;
            //       'v'/'V' add "read"; anything else is "no access"
            default:
                rights = "no access";
                break;
        }
        std::cout << name << ": " << rights << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string name;
        char role;
        std::cin >> name >> role;
        std::string rights;
        switch (role) {
            case 'a':
            case 'A':
                rights += "delete ";
                [[fallthrough]];
            case 'e':
            case 'E':
                rights += "write ";
                [[fallthrough]];
            case 'v':
            case 'V':
                rights += "read";
                break;
            default:
                rights = "no access";
                break;
        }
        std::cout << name << ": " << rights << '\n';
    }
    return 0;
}
`,
          hints: [
            "Reading into a char with >> skips the space and takes exactly one character.",
            "Order the cases from most to least privileged so the fallthrough accumulates downwards.",
            "Only the viewer case ends in break; the others end in [[fallthrough]];.",
          ],
          cases: [
            { stdin: "3\nada A\nbob e\ncy v\n", expected: "ada: delete write read\nbob: write read\ncy: read\n" },
            { stdin: "2\ndee x\neve E\n", expected: "dee: no access\neve: write read\n" },
            { stdin: "1\nfay a\n", expected: "fay: delete write read\n", hidden: true },
            { stdin: "4\ngus V\nhal 7\nivy ?\njo A\n", expected: "gus: read\nhal: no access\nivy: no access\njo: delete write read\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint x = 2;\nswitch (x) {\n    case 1: std::cout << \"one\";\n    case 2: std::cout << \"two\";\n    case 3: std::cout << \"three\";\n    default: std::cout << \"other\";\n}\n\`\`\`",
          options: ["`two`", "`twothree`", "`twothreeother`", "`other`"],
          answer: 2,
          explanation: "Control jumps to `case 2` and, with no `break`, falls through every following label including `default`. `-Wimplicit-fallthrough` (in `-Wextra`) warns on each of these; `[[fallthrough]];` would mark them as deliberate.",
        },
        {
          prompt: "Which of these can be the controlling expression of a `switch`?",
          options: ["A `std::string`", "A `double`", "An `enum class` value", "A `float`"],
          answer: 2,
          explanation: "The controlling expression must have an integral or enumeration type (or convert to one). Floating-point types and `std::string` are rejected at compile time — map a string to an enum first.",
        },
        {
          prompt: "Does this compile?\n\n\`\`\`cpp\nswitch (n) {\n    case 1:\n        int y = n * 2;\n        std::cout << y;\n        break;\n    case 2:\n        std::cout << n;\n        break;\n}\n\`\`\`",
          options: ["Yes, and it works", "No: jumping to `case 2` crosses the initialisation of `y`", "Yes, but reading `y` in `case 2` is undefined behaviour", "No: variables cannot be declared inside a `switch`"],
          answer: 1,
          explanation: "`y` is in scope at `case 2`, but jumping there skips its initialiser, which C++ forbids (\"jump to case label crosses initialization\"). Wrap the `case 1` body in braces so `y`'s scope ends before the next label.",
        },
        {
          prompt: "What does `[[fallthrough]];` do?",
          options: ["Makes execution continue into the next case where it otherwise would stop", "Documents an intentional fallthrough and silences the compiler's warning; no run-time effect", "Ends the `switch`, like `break`", "Jumps to `default`"],
          answer: 1,
          explanation: "Fallthrough is the default behaviour whenever `break` is absent; the attribute changes nothing at run time. It exists so `-Wimplicit-fallthrough` can tell a deliberate fallthrough from a forgotten `break`.",
        },
        {
          prompt: "Why omit `default` when switching on an `enum class` whose every enumerator has a case?",
          options: ["`default` is not allowed with scoped enums", "So `-Wswitch` warns when a new enumerator is added and no case handles it", "It makes the jump table smaller", "The compiler inserts a `default` automatically"],
          answer: 1,
          explanation: "With no `default`, the compiler can see that every enumerator is (or is not) handled and warns about missing ones — a check that survives the enum growing. A `default` swallows every future enumerator silently. Keep a fallback after the switch for out-of-range values.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nfor (int i = 0; i < 3; ++i) {\n    switch (i) {\n        case 1: break;\n        default: std::cout << i;\n    }\n}\n\`\`\`",
          options: ["`02`", "`0`", "`012`", "Nothing"],
          answer: 0,
          explanation: "`break` leaves the innermost `switch` or loop — here the `switch` — so the `for` continues. `i = 1` prints nothing; `0` and `2` reach `default`. To leave the loop from inside a `switch`, set a flag the loop condition tests.",
        },
        {
          prompt: "You have `std::string cmd` with a dozen possible words. What is the sound way to dispatch on it?",
          options: ["`switch (cmd)` with string case labels", "Map the word to an `enum class` with an `if` chain or a `std::map`, then `switch` on the enum", "`switch (cmd.size())`", "`switch` on a `constexpr` hash of the string"],
          answer: 1,
          explanation: "Case labels must be integral constant expressions, so strings cannot be labels. Converting to an enum keeps the string comparison in one place and gives the `switch` its exhaustiveness check. Hashing works until two words collide, and `size()` is not a name.",
        },
      ],
    },
    {
      slug: "loops",
      file: "03-loops.md",
      exercises: [
        {
          title: "Launch countdown",
          prompt: `Read an integer \`n\` (0 ≤ n ≤ 20), then \`n\` stage names (single words, whitespace-separated). Store them in a \`std::vector<std::string>\` and print them in **reverse** order, one per line as \`<index>: <name>\` where \`index\` is the position in the input (0-based), so the last stage prints first and \`0:\` prints last. Then print \`liftoff\`.

The loop variable must be a \`std::size_t\` — the type of \`stages.size()\` — and the program must be correct when \`n\` is 0: a countdown written as \`for (std::size_t i = n - 1; i >= 0; --i)\` never terminates, because an unsigned value cannot go below zero.

**Input:** \`n\`, then \`n\` names.
**Output:** \`n\` lines, then \`liftoff\`.

\`\`\`text
3
fuel
ignition
boosters
\`\`\`
prints
\`\`\`text
2: boosters
1: ignition
0: fuel
liftoff
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<std::string> stages;
    for (int i = 0; i < n; ++i) {
        std::string stage;
        std::cin >> stage;
        stages.push_back(stage);
    }
    // TODO: print the stages from the last index down to 0 with a std::size_t loop
    std::cout << "liftoff\n";
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<std::string> stages;
    for (int i = 0; i < n; ++i) {
        std::string stage;
        std::cin >> stage;
        stages.push_back(stage);
    }
    for (std::size_t i = stages.size(); i-- > 0;) {
        std::cout << i << ": " << stages[i] << '\n';
    }
    std::cout << "liftoff\n";
    return 0;
}
`,
          hints: [
            "Start the counter at stages.size(), not size() - 1 — with n = 0 the subtraction wraps.",
            "for (std::size_t i = stages.size(); i-- > 0;) tests before it decrements, so the body sees size()-1 down to 0.",
            "Equivalent: loop while i > 0 and print stages[i - 1].",
          ],
          cases: [
            { stdin: "3\nfuel\nignition\nboosters\n", expected: "2: boosters\n1: ignition\n0: fuel\nliftoff\n" },
            { stdin: "1\ncheck\n", expected: "0: check\nliftoff\n" },
            { stdin: "0\n", expected: "liftoff\n", hidden: true },
            { stdin: "5\na b c d e\n", expected: "4: e\n3: d\n2: c\n1: b\n0: a\nliftoff\n", hidden: true },
          ],
        },
        {
          title: "First pair with the target sum",
          prompt: `Read integers \`n\` and \`target\`, then \`n\` integers. Find the first pair of positions \`i < j\` such that \`a[i] + a[j] == target\`, trying \`i\` from 0 upwards and, for each \`i\`, \`j\` from \`i + 1\` upwards. Print \`<i> <j>\` for the first pair found, or \`none\`.

Use two nested \`for\` loops, and stop **both** as soon as a pair is found — a \`break\` leaves only the inner loop, so the outer loop's condition must also test a flag. Store the values as \`long long\` so the sum cannot overflow.

**Input:** \`n target\`, then \`n\` integers.
**Output:** one line.

Example: \`5 9\` then \`2 7 11 15 4\` → \`0 1\` (2 + 7). \`4 10\` then \`1 2 3 4\` → \`none\`.`,
          starter: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    long long target;
    std::cin >> n >> target;
    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }
    bool found = false;
    int bi = 0;
    int bj = 0;
    // TODO: nested loops over i < j; record the first pair and leave both loops
    if (found) std::cout << bi << ' ' << bj << '\n';
    else std::cout << "none\n";
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    long long target;
    std::cin >> n >> target;
    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }
    bool found = false;
    int bi = 0;
    int bj = 0;
    for (int i = 0; i < n && !found; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (a[i] + a[j] == target) {
                bi = i;
                bj = j;
                found = true;
                break;   // leaves the inner loop; the outer condition sees found
            }
        }
    }
    if (found) std::cout << bi << ' ' << bj << '\n';
    else std::cout << "none\n";
    return 0;
}
`,
          hints: [
            "The inner loop starts at j = i + 1 so each pair is tried once and i < j holds.",
            "Put && !found in the outer loop's condition so it stops after the inner break.",
            "With n = 1 the inner loop never runs and the answer is none.",
          ],
          cases: [
            { stdin: "5 9\n2 7 11 15 4\n", expected: "0 1\n" },
            { stdin: "4 10\n1 2 3 4\n", expected: "none\n" },
            { stdin: "4 0\n-3 5 3 -5\n", expected: "0 2\n", hidden: true },
            { stdin: "1 2\n1\n", expected: "none\n", hidden: true },
            { stdin: "6 8\n4 1 4 3 5 4\n", expected: "0 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens?\n\n\`\`\`cpp\nstd::vector<int> v{1, 2, 3};\nfor (std::size_t i = v.size() - 1; i >= 0; --i) std::cout << v[i];\n\`\`\`",
          options: ["Prints `321` and stops", "Prints `123`", "Prints `321`, then `--i` wraps to a huge value and `v[i]` reads out of range: undefined behaviour", "Compile error"],
          answer: 2,
          explanation: "`std::size_t` is unsigned, so `i >= 0` is always true (GCC warns exactly that). After index 0 the decrement wraps to 18446744073709551615 and the subscript is out of bounds. Count down with `for (std::size_t i = v.size(); i-- > 0;)`.",
        },
        {
          prompt: "How many times does the body of `for (int i = 1; i <= 10; i += 3)` run?",
          options: ["3", "4", "10", "It never ends"],
          answer: 1,
          explanation: "`i` takes the values 1, 4, 7 and 10 — four iterations; 13 fails `<= 10`. Counting the values a loop variable actually takes is the reliable way to answer fencepost questions.",
        },
        {
          prompt: "What happens?\n\n\`\`\`cpp\nint i = 0;\nwhile (i < 5) {\n    if (i % 2 == 0) continue;\n    std::cout << i;\n    ++i;\n}\n\`\`\`",
          options: ["Prints `13`", "Prints `1234`", "Never terminates", "Prints `024`"],
          answer: 2,
          explanation: "`i` is 0, which is even, so `continue` jumps back to the condition without reaching `++i`; `i` stays 0 forever. In a `for` loop the step would still run — which is why counters belong in `for`.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint i;\nfor (i = 0; i < 4; ++i);\nstd::cout << i;\n\`\`\`",
          options: ["`0123`", "`4`", "`3`", "Compile error"],
          answer: 1,
          explanation: "The semicolon after the `for` is an empty body, so the loop simply counts `i` up until `i < 4` fails, leaving `i` at 4. Because `i` was declared outside the loop it is still in scope for the print.",
        },
        {
          prompt: "A match is found in the inner of two nested loops. Which correctly stops both?",
          options: ["`break;` in the inner loop", "`break; break;`", "A `bool` flag set before the inner `break` and tested in the outer loop's condition (or `return` from a function)", "`continue;` in the outer loop"],
          answer: 2,
          explanation: "`break` leaves only the innermost loop, and a second `break` after it is unreachable. Either the outer loop tests a flag (`i < n && !found`) or the search lives in a function and `return`s from the inner loop.",
        },
        {
          prompt: "How does `do { body } while (cond);` differ from `while (cond) { body }`?",
          options: ["They are identical", "`do … while` runs the body once before testing, so it always executes at least once", "`do … while` cannot contain `break`", "`while` is faster"],
          answer: 1,
          explanation: "`do … while` tests after the body, so the body runs at least once — the shape for \"ask, then check\". A `while` loop tests first and may run zero times. Both accept `break` and `continue`.",
        },
        {
          prompt: "Compiled with `-Wall -Wextra`, what does `for (int i = 0; i < v.size(); ++i)` produce, `v` being a `std::vector<int>`?",
          options: ["Nothing — it is clean", "A warning: comparison of integer expressions of different signedness", "A compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "`v.size()` is `std::size_t`, `i` is `int`, and `-Wsign-compare` (in `-Wall` for C++) flags the mixed comparison. Use `std::size_t i`, or `static_cast<int>(v.size())` when an `int` index is needed.",
        },
      ],
    },
    {
      slug: "range-for-and-iteration",
      file: "04-range-for-and-iteration.md",
      exercises: [
        {
          title: "Word frequencies in order",
          prompt: `Read an integer \`n\`, then \`n\` words (whitespace-separated, possibly across several lines). Count how often each word appears in a \`std::map<std::string, int>\` and print one line per distinct word as \`<word> <count>\`, in the map's own order — a range-based \`for\` with a structured binding \`const auto& [word, count]\`. Finish with \`distinct=<number of distinct words>\`.

Note that a \`std::map\` orders its keys with \`<\` on \`std::string\`, so uppercase letters sort before lowercase ones.

**Input:** \`n\`, then \`n\` words.
**Output:** one line per distinct word, then \`distinct=<k>\`.

Example: \`6\` then \`the cat saw the dog the\` →
\`\`\`text
cat 1
dog 1
saw 1
the 3
distinct=4
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> freq;
    for (int i = 0; i < n; ++i) {
        std::string word;
        std::cin >> word;
        // TODO: count the word
    }
    // TODO: print every entry in map order with a structured binding, then the distinct count
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::map<std::string, int> freq;
    for (int i = 0; i < n; ++i) {
        std::string word;
        std::cin >> word;
        ++freq[word];
    }
    for (const auto& [word, count] : freq) {
        std::cout << word << ' ' << count << '\n';
    }
    std::cout << "distinct=" << freq.size() << '\n';
    return 0;
}
`,
          hints: [
            "freq[word] inserts a zero the first time a word is seen, so ++freq[word] counts it.",
            "for (const auto& [word, count] : freq) walks the entries in key order.",
            "freq.size() is the number of distinct words.",
          ],
          cases: [
            { stdin: "6\nthe cat saw the dog the\n", expected: "cat 1\ndog 1\nsaw 1\nthe 3\ndistinct=4\n" },
            { stdin: "4\nb a b a\n", expected: "a 2\nb 2\ndistinct=2\n" },
            { stdin: "0\n", expected: "distinct=0\n", hidden: true },
            { stdin: "5\nZebra apple Apple zebra apple\n", expected: "Apple 1\nZebra 1\napple 2\nzebra 1\ndistinct=4\n", hidden: true },
          ],
        },
        {
          title: "Clamp in place",
          prompt: `Read two integers \`lo hi\` (lo ≤ hi), then an integer \`n\` (n ≥ 1), then \`n\` integers into a \`std::vector<int>\`. Clamp every element into the range \`[lo, hi]\` **in place** with a range-based \`for\` whose loop variable is a reference (\`int&\` or \`auto&\`) — a loop over copies would leave the vector unchanged. Then print the clamped values on one line separated by single spaces, and on the next line \`sum=<sum of the clamped values>\`; read the values for that with \`const auto&\` and keep the sum in a \`long long\`.

**Input:** \`lo hi\`, then \`n\`, then \`n\` integers.
**Output:** two lines.

Example: \`0 10\` / \`5\` / \`-3 4 12 10 0\` →
\`\`\`text
0 4 10 10 0
sum=24
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

int main() {
    int lo, hi, n;
    std::cin >> lo >> hi >> n;
    std::vector<int> values;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        values.push_back(x);
    }
    // TODO: clamp every element in place through a reference
    // TODO: print the values separated by spaces, then sum=<total>
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int main() {
    int lo, hi, n;
    std::cin >> lo >> hi >> n;
    std::vector<int> values;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        values.push_back(x);
    }
    for (int& x : values) {
        if (x < lo) x = lo;
        else if (x > hi) x = hi;
    }
    long long sum = 0;
    bool first = true;
    for (const auto& x : values) {
        if (!first) std::cout << ' ';
        std::cout << x;
        first = false;
        sum += x;
    }
    std::cout << '\n' << "sum=" << sum << '\n';
    return 0;
}
`,
          hints: [
            "for (int& x : values) makes x an alias of the element, so assigning to x changes the vector.",
            "A bool first flag prints the space before every value except the first.",
            "Two values of two billion overflow an int sum — accumulate in long long.",
          ],
          cases: [
            { stdin: "0 10\n5\n-3 4 12 10 0\n", expected: "0 4 10 10 0\nsum=24\n" },
            { stdin: "1 5\n3\n1 2 3\n", expected: "1 2 3\nsum=6\n" },
            { stdin: "-5 5\n4\n-100 100 -5 5\n", expected: "-5 5 -5 5\nsum=0\n", hidden: true },
            { stdin: "7 7\n1\n3\n", expected: "7\nsum=7\n", hidden: true },
            { stdin: "0 2000000000\n2\n2000000000 2000000000\n", expected: "2000000000 2000000000\nsum=4000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nstd::vector<std::string> names{\"ann\", \"bo\"};\nfor (auto n : names) n += \"!\";\nfor (const auto& n : names) std::cout << n << ' ';\n\`\`\`",
          options: ["`ann! bo! `", "`ann bo `", "Compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "`auto n` declares a copy of each element; the `+=` modifies the copy, which is destroyed at the end of the iteration. The vector is unchanged and no warning is issued. `auto& n` would modify in place.",
        },
        {
          prompt: "Does `for (auto& x : {1, 2, 3}) x *= 2;` compile?",
          options: ["Yes, and doubles each value", "No: the elements of an initialiser list are `const`, so `x` is a `const int&` and cannot be assigned", "Yes, but has no effect", "No: range-for does not accept braces"],
          answer: 1,
          explanation: "A braced list is a `std::initializer_list<int>` whose elements are `const int`; `auto&` deduces `const int&`, and `x *= 2` is an assignment to a read-only reference. Reading them with `const auto&` or `int` is fine.",
        },
        {
          prompt: "In `for (const auto& [k, v] : m)` over a `std::map<std::string, int>`, what is the type of `k`?",
          options: ["`std::string`", "`const std::string`", "`int`", "`std::pair<std::string, int>`"],
          answer: 1,
          explanation: "A map's element type is `std::pair<const K, V>` — the key is `const` because changing it would break the ordering. So even `auto& [k, v]` lets you modify `v` but never `k`.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nstd::map<std::string, int> m{{\"pear\", 1}, {\"apple\", 2}, {\"fig\", 3}};\nfor (const auto& [k, v] : m) std::cout << k << ' ';\n\`\`\`",
          options: ["`pear apple fig `", "`apple fig pear `", "The order is unspecified", "`fig apple pear `"],
          answer: 1,
          explanation: "`std::map` is an ordered container: iteration follows the key order, `apple < fig < pear`, regardless of insertion order. It is `std::unordered_map` whose order is unspecified.",
        },
        {
          prompt: "Which loop doubles every element of `std::vector<int> v` in place?",
          options: ["`for (auto x : v) x *= 2;`", "`for (auto& x : v) x *= 2;`", "`for (const auto& x : v) x *= 2;`", "`for (int x : v) v[x] *= 2;`"],
          answer: 1,
          explanation: "Only a non-const reference reaches the element. The copy version changes nothing; the `const` version does not compile; the last one uses the *value* as an index, which is wrong and usually out of range.",
        },
        {
          prompt: "What is wrong here?\n\n\`\`\`cpp\nstd::vector<int> v{1, 2, 3};\nfor (int x : v) {\n    if (x == 2) v.push_back(4);\n}\n\`\`\`",
          options: ["Nothing — `v` becomes `{1, 2, 3, 4}`", "Undefined behaviour: `push_back` may reallocate and invalidate the iterators the loop holds", "Compile error: `v` is const inside the loop", "The loop runs forever"],
          answer: 1,
          explanation: "The range-for captured `begin()` and `end()` before the first iteration; a reallocation moves the elements and leaves both dangling, and even without one the cached end is stale. Never change a container's size inside its own range-for.",
        },
        {
          prompt: "When is an index loop the right choice over a range-based `for`?",
          options: ["Whenever the container is a `std::vector`", "When the body needs the position, a neighbour, a direction, or two ranges walked together", "Never — range-for replaces every loop", "Only for built-in arrays"],
          answer: 1,
          explanation: "Range-for hands you elements, not positions. Comparing `v[i]` with `v[i - 1]`, walking backwards, striding, or pairing `a[i]` with `b[i]` all need an index. For plain \"each element\", range-for is safer.",
        },
      ],
    },
    {
      slug: "loop-patterns",
      file: "05-loop-patterns.md",
      exercises: [
        {
          title: "Sentinel-terminated statistics",
          prompt: `Read integers until the sentinel \`0\` or the end of input, whichever comes first. The sentinel is not data. Print \`count=<c> sum=<s> min=<m> max=<M>\` on one line, or \`no data\` when no value precedes the sentinel.

Put the read and the sentinel test in the loop condition: \`while (std::cin >> x && x != 0)\`. Initialise the minimum and maximum from the first value read, not from 0 — the data may be entirely negative. Keep the sum in a \`long long\`.

**Input:** integers separated by whitespace, normally ending with \`0\`.
**Output:** one line.

Example: \`4 8 -2 15 0\` → \`count=4 sum=25 min=-2 max=15\`. \`0\` → \`no data\`.`,
          starter: String.raw`#include <iostream>

int main() {
    int x;
    int count = 0;
    long long sum = 0;
    int lo = 0;
    int hi = 0;
    // TODO: read until 0 or end of input, tracking count, sum, min and max
    if (count == 0) {
        std::cout << "no data\n";
    } else {
        std::cout << "count=" << count << " sum=" << sum << " min=" << lo << " max=" << hi << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>

int main() {
    int x;
    int count = 0;
    long long sum = 0;
    int lo = 0;
    int hi = 0;
    while (std::cin >> x && x != 0) {
        if (count == 0) {
            lo = x;
            hi = x;
        } else {
            if (x < lo) lo = x;
            if (x > hi) hi = x;
        }
        sum += x;
        ++count;
    }
    if (count == 0) {
        std::cout << "no data\n";
    } else {
        std::cout << "count=" << count << " sum=" << sum << " min=" << lo << " max=" << hi << '\n';
    }
    return 0;
}
`,
          hints: [
            "The && stops at a failed read, so x != 0 is only tested on a value that was actually read.",
            "When count is 0 the value just read is both the minimum and the maximum so far.",
            "Values after the sentinel are never read; the loop has already ended.",
          ],
          cases: [
            { stdin: "4 8 -2 15 0\n", expected: "count=4 sum=25 min=-2 max=15\n" },
            { stdin: "0\n", expected: "no data\n" },
            { stdin: "-7 0 5\n", expected: "count=1 sum=-7 min=-7 max=-7\n", hidden: true },
            { stdin: "3 3 3\n", expected: "count=3 sum=9 min=3 max=3\n", hidden: true },
            { stdin: "2000000000 2000000000 0\n", expected: "count=2 sum=4000000000 min=2000000000 max=2000000000\n", hidden: true },
          ],
        },
        {
          title: "Two-pointer pair in a sorted list",
          prompt: `Read integers \`n\` and \`target\`, then \`n\` integers in **non-decreasing** order. Find two distinct positions whose values sum to \`target\` with a two-pointer sweep: \`lo\` starts at 0 and \`hi\` at \`n - 1\`; while \`lo < hi\`, if \`a[lo] + a[hi]\` equals \`target\` print \`<lo> <hi>\` and stop; if it is less, move \`lo\` up; otherwise move \`hi\` down. Print \`none\` if the pointers meet without a match.

Follow the sweep exactly as described so the pair you find is the one the judge expects. Store the values as \`long long\`. Write the loop's invariant as a comment above it.

**Input:** \`n target\`, then \`n\` sorted integers.
**Output:** one line.

Example: \`6 10\` then \`1 2 4 6 8 9\` → \`0 5\`. \`5 12\` then \`1 3 5 7 9\` → \`1 4\`.`,
          starter: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    long long target;
    std::cin >> n >> target;
    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }
    int lo = 0;
    int hi = n - 1;
    // TODO: sweep lo and hi towards each other; print the pair or none
    std::cout << "none\n";
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

int main() {
    int n;
    long long target;
    std::cin >> n >> target;
    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }
    int lo = 0;
    int hi = n - 1;
    // invariant: every pair summing to target has both positions inside [lo, hi]
    while (lo < hi) {
        const long long sum = a[lo] + a[hi];
        if (sum == target) {
            std::cout << lo << ' ' << hi << '\n';
            return 0;
        }
        if (sum < target) ++lo;
        else --hi;
    }
    std::cout << "none\n";
    return 0;
}
`,
          hints: [
            "A sum that is too small means a[lo] is too small for every partner up to hi, so lo can move.",
            "Returning from main as soon as the pair prints avoids a found flag.",
            "With n = 1, lo == hi from the start and the loop never runs.",
          ],
          cases: [
            { stdin: "6 10\n1 2 4 6 8 9\n", expected: "0 5\n" },
            { stdin: "5 12\n1 3 5 7 9\n", expected: "1 4\n" },
            { stdin: "4 100\n1 2 3 4\n", expected: "none\n", hidden: true },
            { stdin: "5 0\n-8 -3 0 3 5\n", expected: "1 3\n", hidden: true },
            { stdin: "1 5\n5\n", expected: "none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`int best = 0; for (int x : v) if (x > best) best = x;` — what is wrong?",
          options: ["Nothing", "It reports 0 when every element is negative; initialise from the first element or from `std::numeric_limits<int>::min()`", "It fails when `v` has one element", "It does not compile"],
          answer: 1,
          explanation: "0 is not an element of the data, so the answer is wrong whenever every value is below it. A maximum starts from the data (`v[0]`, or the first value read) or from the type's minimum.",
        },
        {
          prompt: "With input `3 4 5` and no zero, what does `while (std::cin >> x && x != 0) sum += x;` do?",
          options: ["Sums 12 and stops when the input ends", "Loops forever waiting for the sentinel", "Sums 0", "Runtime error"],
          answer: 0,
          explanation: "After 5, the next `std::cin >> x` fails at end of input; the stream converts to `false` and `&&` stops before testing `x`. A sentinel loop written this way ends correctly with or without the sentinel.",
        },
        {
          prompt: "Why is `while (!std::cin.eof()) { std::cin >> x; use(x); }` wrong?",
          options: ["`eof()` is not a member of `std::cin`", "After the last value is read `eof()` is still false, so the loop runs again with a failed read and `use(x)` sees a zeroed `x`", "It reads only the first value", "It is correct"],
          answer: 1,
          explanation: "`eof()` only becomes true after a read has tried to go past the end. Test the read itself — `while (std::cin >> x)` — so the body runs only for values that were actually read.",
        },
        {
          prompt: "In a two-pointer sweep over a sorted array for `a[lo] + a[hi] == target`, the sum is less than `target`. What moves?",
          options: ["`--hi`", "`++lo`", "Both pointers", "Restart from `lo = 0`"],
          answer: 1,
          explanation: "`a[lo]` paired with any element at or below `hi` gives a sum no larger than the current one, so `lo` cannot be part of a solution and moves up. A sum that is too large discards `hi` for the mirror reason.",
        },
        {
          prompt: "Compared with `std::cout << x << ' '` inside the loop, building the output in a `std::string` and printing once…",
          options: ["Is required by the judge", "Makes one write instead of thousands and keeps the separator logic in one place, so no trailing space", "Uses less memory", "Is always ten times faster"],
          answer: 1,
          explanation: "The test `if (!out.empty()) out += ' '` puts a separator only before a value that has a predecessor, and one final `<<` replaces a stream call per token. The judge ignores trailing spaces, but not every judge does.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nint a[] = {3, 9, 4, 9};\nint best = 0;\nfor (int i = 1; i < 4; ++i) if (a[i] > a[best]) best = i;\nstd::cout << best;\n\`\`\`",
          options: ["`1`", "`3`", "`9`", "`0`"],
          answer: 0,
          explanation: "The strict `>` replaces `best` only for a strictly larger value, so the first 9 (index 1) wins over the second. `>=` would keep the last maximum, index 3. The loop tracks a *position*, hence `a[best]`.",
        },
        {
          prompt: "What is a loop invariant?",
          options: ["A variable the loop never changes", "A statement that holds at the top of every iteration and, together with the exit condition, proves the result", "The loop's condition", "A `const` loop variable"],
          answer: 1,
          explanation: "Establish it before the loop, show the body preserves it, and the exit condition turns it into the answer — `best` is the largest of `a[0..i)` becomes the largest of `a[0..n)` when `i == n`. It is how a loop is checked without running it.",
        },
      ],
    },
    {
      slug: "control-flow-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Run-length encoding",
          prompt: `Read an integer \`n\`, then \`n\` lines of text (each at least one character; a line may contain spaces). For each line print its run-length encoding: every maximal run of one repeated character becomes the character followed by the run's length.

Read \`n\` with \`std::cin >>\`, then call \`std::cin.ignore()\` before the first \`std::getline\` — the newline after \`n\` would otherwise be read as an empty line. Walk each line with two indices: \`i\` marks the start of a run and \`j\` advances while the character repeats. \`std::to_string(k)\` turns a count into text.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

Example: \`2\` / \`aaabccdddd\` / \`abc\` →
\`\`\`text
a3b1c2d4
a1b1c1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int k = 0; k < n; ++k) {
        std::string line;
        std::getline(std::cin, line);
        std::string out;
        // TODO: encode the runs of line into out
        std::cout << out << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore();
    for (int k = 0; k < n; ++k) {
        std::string line;
        std::getline(std::cin, line);
        std::string out;
        std::size_t i = 0;
        // invariant: line[0..i) has been encoded into out
        while (i < line.size()) {
            std::size_t j = i;
            while (j < line.size() && line[j] == line[i]) ++j;
            out += line[i];
            out += std::to_string(j - i);
            i = j;
        }
        std::cout << out << '\n';
    }
    return 0;
}
`,
          hints: [
            "The inner loop stops at the first character that differs from line[i] or at the end.",
            "The run length is j - i; then i = j starts the next run.",
            "A run of spaces encodes like any other character: a space then its count.",
          ],
          cases: [
            { stdin: "2\naaabccdddd\nabc\n", expected: "a3b1c2d4\na1b1c1\n" },
            { stdin: "1\nmississippi\n", expected: "m1i1s2i1s2i1p2i1\n" },
            { stdin: "2\nz\nhello  world\n", expected: "z1\nh1e1l2o1 2w1o1r1l1d1\n", hidden: true },
            { stdin: "1\nxxxxxxxxxxxx\n", expected: "x12\n", hidden: true },
          ],
        },
        {
          title: "A bank ledger",
          prompt: `Read commands until the end of input — \`while (std::cin >> word)\` — and keep a balance in a \`long long\` that starts at 0:

- \`deposit N\` — add \`N\`
- \`withdraw N\` — subtract \`N\`, unless \`N\` exceeds the balance, in which case print \`insufficient funds\` and leave it
- \`balance\` — print \`balance=<value>\`
- any other word — print \`unknown: <word>\`

Map each word to an \`enum class\` and \`switch\` on it, handling every enumerator without a \`default\`. After the input ends print \`final=<balance> deposits=<number of deposits> rejected=<number of refused withdrawals>\`.

**Input:** commands, one per line, until end of input (possibly none).
**Output:** one line per \`balance\`, refusal and unknown word, then the final line.

\`\`\`text
deposit 100
withdraw 30
balance
withdraw 500
balance
\`\`\`
prints
\`\`\`text
balance=70
insufficient funds
balance=70
final=70 deposits=1 rejected=1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

enum class Cmd { Deposit, Withdraw, Balance, Unknown };

int main() {
    long long balance = 0;
    int deposits = 0;
    int rejected = 0;
    std::string word;
    while (std::cin >> word) {
        Cmd cmd = Cmd::Unknown;
        // TODO: map the word, then switch on cmd
    }
    std::cout << "final=" << balance << " deposits=" << deposits << " rejected=" << rejected << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

enum class Cmd { Deposit, Withdraw, Balance, Unknown };

int main() {
    long long balance = 0;
    int deposits = 0;
    int rejected = 0;
    std::string word;
    while (std::cin >> word) {
        Cmd cmd = Cmd::Unknown;
        if (word == "deposit") cmd = Cmd::Deposit;
        else if (word == "withdraw") cmd = Cmd::Withdraw;
        else if (word == "balance") cmd = Cmd::Balance;

        switch (cmd) {
            case Cmd::Deposit: {
                long long amount;
                std::cin >> amount;
                balance += amount;
                ++deposits;
                break;
            }
            case Cmd::Withdraw: {
                long long amount;
                std::cin >> amount;
                if (amount > balance) {
                    std::cout << "insufficient funds\n";
                    ++rejected;
                } else {
                    balance -= amount;
                }
                break;
            }
            case Cmd::Balance:
                std::cout << "balance=" << balance << '\n';
                break;
            case Cmd::Unknown:
                std::cout << "unknown: " << word << '\n';
                break;
        }
    }
    std::cout << "final=" << balance << " deposits=" << deposits << " rejected=" << rejected << '\n';
    return 0;
}
`,
          hints: [
            "Only deposit and withdraw read a second token; read it inside their case, in braces.",
            "The loop ends when >> fails at end of input — no sentinel, no eof() test.",
            "An empty input still prints the final line.",
          ],
          cases: [
            { stdin: "deposit 100\nwithdraw 30\nbalance\nwithdraw 500\nbalance\n", expected: "balance=70\ninsufficient funds\nbalance=70\nfinal=70 deposits=1 rejected=1\n" },
            { stdin: "balance\nfoo\ndeposit 5\ndeposit 5\nbalance\n", expected: "balance=0\nunknown: foo\nbalance=10\nfinal=10 deposits=2 rejected=0\n" },
            { stdin: "withdraw 1\n", expected: "insufficient funds\nfinal=0 deposits=0 rejected=1\n", hidden: true },
            { stdin: "deposit 5000000000\ndeposit 5000000000\nwithdraw 10000000000\nbalance\n", expected: "balance=0\nfinal=0 deposits=2 rejected=0\n", hidden: true },
            { stdin: "\n", expected: "final=0 deposits=0 rejected=0\n", hidden: true },
          ],
        },
        {
          title: "Primes up to n",
          prompt: `Read an integer \`n\` (1 ≤ n ≤ 10 000) and print every prime number from 2 to \`n\` on one line separated by single spaces — or \`none\` when there is no prime in range — followed by a line \`count=<how many>\`.

Test each candidate by trial division in a nested loop: divisors \`d\` from 2 while \`d * d <= candidate\`; \`break\` at the first divisor and \`continue\` the outer loop for a composite. Build the first line in a \`std::string\` and print it once, so no trailing space is produced.

**Input:** \`n\`.
**Output:** two lines.

Example: \`20\` →
\`\`\`text
2 3 5 7 11 13 17 19
count=8
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::string out;
    int count = 0;
    // TODO: for each candidate 2..n, trial-divide; append primes to out
    if (count == 0) out = "none";
    std::cout << out << '\n' << "count=" << count << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::string out;
    int count = 0;
    for (int candidate = 2; candidate <= n; ++candidate) {
        bool prime = true;
        for (int d = 2; d * d <= candidate; ++d) {
            if (candidate % d == 0) {
                prime = false;
                break;
            }
        }
        if (!prime) continue;
        if (!out.empty()) out += ' ';
        out += std::to_string(candidate);
        ++count;
    }
    if (count == 0) out = "none";
    std::cout << out << '\n' << "count=" << count << '\n';
    return 0;
}
`,
          hints: [
            "d * d <= candidate stops the divisor loop at the square root without <cmath>.",
            "A flag set before the inner break tells the outer loop what happened.",
            "Append a space only when out is not empty.",
          ],
          cases: [
            { stdin: "20\n", expected: "2 3 5 7 11 13 17 19\ncount=8\n" },
            { stdin: "2\n", expected: "2\ncount=1\n" },
            { stdin: "1\n", expected: "none\ncount=0\n", hidden: true },
            { stdin: "50\n", expected: "2 3 5 7 11 13 17 19 23 29 31 37 41 43 47\ncount=15\n", hidden: true },
            { stdin: "100\n", expected: "2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 53 59 61 67 71 73 79 83 89 97\ncount=25\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`if (x == 1 || 2)` is…",
          options: ["True when `x` is 1 or 2", "Always true, because `2` converts to `true` on its own", "A compile error", "Always false"],
          answer: 1,
          explanation: "`||` takes two operands, `x == 1` and `2`; a non-zero integer is `true`, so the whole condition is. Write `x == 1 || x == 2`.",
        },
        {
          prompt: "What does `int n = 7; std::cout << (n > 5 ? 1 : 2.0);` print?",
          options: ["`1`", "`1.0`", "`2`", "Compile error"],
          answer: 0,
          explanation: "The arms of `?:` are converted to a common type, `double`, so the value is `1.0`; `std::cout` prints an integral-valued `double` as `1`. The parentheses are needed because `<<` binds tighter than `?:`.",
        },
        {
          prompt: "`double d = 1.5; switch (d) { … }`",
          options: ["Works, matching `case 1.5:`", "Compile error: the controlling expression must be of integral or enumeration type", "Truncates `d` to 1", "Undefined behaviour"],
          answer: 1,
          explanation: "A `switch` dispatches on integer-like values only; `double`, `float` and `std::string` are rejected. Use an `if` chain for those.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nchar c = 'b';\nswitch (c) {\n    case 'a': std::cout << 1; [[fallthrough]];\n    case 'b': std::cout << 2; [[fallthrough]];\n    case 'c': std::cout << 3; break;\n    default: std::cout << 0;\n}\n\`\`\`",
          options: ["`2`", "`23`", "`230`", "`123`"],
          answer: 1,
          explanation: "Control enters at `case 'b'`, prints 2, falls through to `case 'c'`, prints 3, and `break` ends the switch before `default`. `case 'a'` is never entered.",
        },
        {
          prompt: "What does `for (unsigned i = 3; i >= 0; --i) std::cout << i << ' ';` do?",
          options: ["Prints `3 2 1 0 ` and stops", "Never terminates: after 0, `--i` wraps to 4294967295 and `i >= 0` is still true", "Compile error", "Prints `3 2 1 `"],
          answer: 1,
          explanation: "An unsigned value is always `>= 0`, so the condition can never fail; the decrement past 0 wraps to the maximum. Count down with `i-- > 0` in the condition, or loop while `i > 0` and use `i - 1`.",
        },
        {
          prompt: "How many times does the body of `for (int i = 10; i > 0; i -= 3)` run?",
          options: ["3", "4", "10", "It never ends"],
          answer: 1,
          explanation: "`i` takes 10, 7, 4 and 1 — four iterations; −2 fails `> 0`. List the values the variable takes rather than dividing.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nfor (int i = 0; i < 5; ++i) {\n    if (i == 1) continue;\n    if (i == 3) break;\n    std::cout << i;\n}\n\`\`\`",
          options: ["`02`", "`024`", "`0`", "`0234`"],
          answer: 0,
          explanation: "`continue` skips the print for 1 but the step still runs; `break` at 3 ends the loop before 3 and 4 print. Only 0 and 2 reach the output.",
        },
        {
          prompt: "Which statement about `for (auto s : words)` versus `for (auto& s : words)` over a `std::vector<std::string>` is correct?",
          options: ["They are identical", "The first copies each string and any change to `s` is lost; the second refers to the element in place", "The first is faster", "The second does not compile"],
          answer: 1,
          explanation: "`auto` deduces a value, so each iteration constructs and destroys a copy — slower, and modifications vanish. `auto&` (or `const auto&` for reading) binds to the element itself.",
        },
        {
          prompt: "What does this print?\n\n\`\`\`cpp\nstd::map<std::string, int> m{{\"b\", 1}, {\"a\", 2}};\nfor (auto& [k, v] : m) v *= 10;\nfor (const auto& [k, v] : m) std::cout << k << v << ' ';\n\`\`\`",
          options: ["`b10 a20 `", "`a20 b10 `", "`a2 b1 `", "Compile error: `k` is const"],
          answer: 1,
          explanation: "`auto&` binds to the real pair, so `v *= 10` changes the map; the key is `const` but is never assigned here. A `std::map` iterates in key order, `a` before `b`, regardless of insertion order.",
        },
        {
          prompt: "Input is `5 -1 7`. What does `long long sum = 0; int x; while (std::cin >> x && x != -1) sum += x;` leave in `sum`?",
          options: ["5", "11", "12", "-1"],
          answer: 0,
          explanation: "The loop reads 5 and adds it, reads −1, and stops because it is the sentinel — the sentinel is consumed but not added, and the 7 after it is never read.",
        },
        {
          prompt: "Which is not a valid `case` label (`n` is a non-const `int`, `Op` an `enum class`)?",
          options: ["`case 1 + 1:`", "`case 'x':`", "`case n:`", "`case Op::Add:`"],
          answer: 2,
          explanation: "Labels must be constant expressions. `1 + 1`, a character literal and an enumerator are all constants; a run-time variable is not.",
        },
        {
          prompt: "`while (std::getline(std::cin, line))` ends when…",
          options: ["`line` is empty", "`getline` fails at the end of input and the stream converts to `false`", "A line contains only whitespace", "It never ends"],
          answer: 1,
          explanation: "`getline` returns the stream, which is `true` while the read succeeded. An empty line is a successful read of an empty string; only running out of input ends the loop.",
        },
        {
          prompt: "Input is `3⏎hello⏎`. After `int n; std::cin >> n; std::string line; std::getline(std::cin, line);` what is `line`?",
          options: ["`hello`", "`` (empty)", "`3`", "Undefined"],
          answer: 1,
          explanation: "`>>` stops at the newline after `3` and leaves it in the stream, so `getline` reads up to that newline and returns an empty string. Call `std::cin.ignore()` after the `>>` before switching to `getline`.",
        },
        {
          prompt: "In a nest of unbraced `if` statements, which `if` does an `else` belong to?",
          options: ["The first `if` in the nest", "The `if` at the same indentation", "The nearest preceding `if` that does not already have an `else`", "It is ambiguous and does not compile"],
          answer: 2,
          explanation: "The dangling-else rule pairs an `else` with the closest unmatched `if`, whatever the indentation suggests. Braces around every branch make the pairing explicit.",
        },
      ],
    },
  ],
});

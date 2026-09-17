import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "strings",
  title: "Strings",
  blurb: "std::string as a value type, the find family and slicing, characters and numeric conversions, parsing input, formatting output with iomanip and std::format, and std::string_view.",
  icon: "text",
  overview: `Text is the shape almost every input arrives in and almost every output leaves in, and C++ handles it with three types that look alike and behave differently: the \`const char*\` literal inherited from C, the owning \`std::string\`, and the non-owning \`std::string_view\`. Knowing which one you hold — and who owns the characters — decides whether a program is correct, fast, or undefined.

The module works through \`std::string\` as a value type; the \`find\` family, \`npos\` and the slicing calls; characters as small integers with the \`<cctype>\` cast that keeps them well-defined; the \`stoi\` family and \`std::from_chars\` for text to number; the parsing patterns every exercise in the track relies on; \`<iomanip>\` and \`std::format\` for exact output; and finally \`std::string_view\` with the lifetime rule that makes it safe.

The exercises are text programs judged on exact output: reversing and comparing, counting and replacing, splitting paths and CSV rows, validating tokens that may not be numbers, printing aligned tables, tokenising with views, and — in the checkpoint — a word-frequency count, a fixed-width report and a run-length codec.`,
  lessons: [
    {
      slug: "std-string-basics",
      file: "01-std-string-basics.md",
      exercises: [
        {
          title: "Mirror",
          prompt: `Read one line and print three lines: the line reversed, then \`length=<n>\`, then \`palindrome\` if the line reads the same backwards (an exact comparison — case and spaces count) or \`not palindrome\` otherwise.

Build the reversed string with \`+=\` in a loop that walks the indices from the back, and compare the two strings with \`==\`. An empty line reverses to an empty line and is a palindrome.

**Input:** one line (it may be empty or contain spaces).
**Output:** three lines.

Example: input \`level\` → output
\`\`\`text
level
length=5
palindrome
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);

    std::string reversed;
    // TODO: append line's characters to reversed, last first

    std::cout << reversed << '\n';
    std::cout << "length=" << line.size() << '\n';
    // TODO: print palindrome or not palindrome
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);

    std::string reversed;
    reversed.reserve(line.size());
    for (std::size_t i = line.size(); i > 0; --i) {
        reversed += line[i - 1];
    }

    std::cout << reversed << '\n';
    std::cout << "length=" << line.size() << '\n';
    std::cout << (reversed == line ? "palindrome" : "not palindrome") << '\n';
    return 0;
}
`,
          hints: [
            "line.size() is unsigned, so count i from line.size() down to 1 and read line[i - 1] — a countdown to 0 with size_t never ends.",
            "reversed == line compares the characters; a std::string is a value, not a reference.",
            "An empty line gives an empty reversed string, length=0, and the two compare equal.",
          ],
          cases: [
            { stdin: "level\n", expected: "level\nlength=5\npalindrome\n" },
            { stdin: "kairo\n", expected: "oriak\nlength=5\nnot palindrome\n" },
            { stdin: "a b a\n", expected: "a b a\nlength=5\npalindrome\n", hidden: true },
            { stdin: "\n", expected: "\nlength=0\npalindrome\n", hidden: true },
            { stdin: "Aa\n", expected: "aA\nlength=2\nnot palindrome\n", hidden: true },
          ],
        },
        {
          title: "Smallest and largest",
          prompt: `Read an integer \`n\` (at least 1) followed by \`n\` words — whitespace-separated tokens, possibly spread over several lines. Using only \`std::string\`'s own comparison operators, print the smallest word, the largest word, and how many of the \`n\` words are equal to the first word read (counting the first word itself).

**Input:** \`n\`, then \`n\` words.
**Output:** three lines: \`first=<smallest>\`, \`last=<largest>\`, \`same_as_first=<count>\`.

Example: input \`4 pear apple fig banana\` → output
\`\`\`text
first=apple
last=pear
same_as_first=1
\`\`\`
Remember the order is by character code: \`Zebra\` sorts before \`apple\`, and \`10\` before \`9\`.`,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    int n = 0;
    std::cin >> n;

    std::string first;
    std::cin >> first;
    std::string smallest = first;
    std::string largest = first;
    int same = 1;

    for (int i = 1; i < n; ++i) {
        std::string word;
        std::cin >> word;
        // TODO: update smallest, largest and same
    }

    std::cout << "first=" << smallest << '\n';
    std::cout << "last=" << largest << '\n';
    std::cout << "same_as_first=" << same << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    int n = 0;
    std::cin >> n;

    std::string first;
    std::cin >> first;
    std::string smallest = first;
    std::string largest = first;
    int same = 1;

    for (int i = 1; i < n; ++i) {
        std::string word;
        std::cin >> word;
        if (word < smallest) smallest = word;
        if (largest < word) largest = word;
        if (word == first) ++same;
    }

    std::cout << "first=" << smallest << '\n';
    std::cout << "last=" << largest << '\n';
    std::cout << "same_as_first=" << same << '\n';
    return 0;
}
`,
          hints: [
            "std::cin >> word reads one token at a time regardless of line breaks.",
            "if (word < smallest) smallest = word; — operator< on std::string compares content lexicographically.",
            "word == first compares content too; keep the first word in its own variable so later updates to smallest do not lose it.",
          ],
          cases: [
            { stdin: "4 pear apple fig banana\n", expected: "first=apple\nlast=pear\nsame_as_first=1\n" },
            { stdin: "5\nZebra apple Apple zebra app\n", expected: "first=Apple\nlast=zebra\nsame_as_first=1\n" },
            { stdin: "3\nkairo kairo kairo\n", expected: "first=kairo\nlast=kairo\nsame_as_first=3\n", hidden: true },
            { stdin: "1\nsolo\n", expected: "first=solo\nlast=solo\nsame_as_first=1\n", hidden: true },
            { stdin: "4\n10 9 100 1\n", expected: "first=1\nlast=9\nsame_as_first=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
std::string a = "hi";
std::string b = a;
b += "!";
std::cout << a << b;
\`\`\``,
          options: ["`hihi!`", "`hi!hi!`", "`hi!`", "It does not compile"],
          answer: 0,
          explanation: "`b = a` copies the characters, so `b += \"!\"` changes only `b`: `a` is still `hi` and `b` is `hi!`. A `std::string` has value semantics — there is no shared object as there would be in Java.",
        },
        {
          prompt: "Which line does **not** compile?",
          options: ["`std::string s = \"a\" + \"b\";`", "`std::string s = std::string(\"a\") + \"b\";`", "`std::string s = \"a\"; s += 'b';`", "`std::string s(3, 'a');`"],
          answer: 0,
          explanation: "Two string literals are two `const char*`, and there is no `+` for pointers. Once one operand is a `std::string` the overloaded `+` applies, `+=` accepts a `char`, and `(3, 'a')` is the count-and-character constructor.",
        },
        {
          prompt: "`std::string s = \"abc\";` — what happens for `s.at(3)` and `s[3]`?",
          options: ["Both are undefined behaviour", "`at(3)` throws `std::out_of_range`; reading `s[3]` yields `'\\0'`", "Both return `'\\0'`", "`s[3]` throws; `at(3)` returns `'\\0'`"],
          answer: 1,
          explanation: "`at()` bounds-checks and throws. `operator[]` does not check, but the standard allows *reading* `s[s.size()]` and defines it as `'\\0'`; writing there, or any index beyond, is undefined behaviour.",
        },
        {
          prompt: "Which comparison of `std::string` values is **false**?",
          options: ["`std::string(\"Zebra\") < std::string(\"apple\")`", "`std::string(\"app\") < std::string(\"apple\")`", "`std::string(\"10\") < std::string(\"9\")`", "`std::string(\"apple\") < std::string(\"Apple\")`"],
          answer: 3,
          explanation: "Comparison is by character code: `'A'` (65) is less than `'a'` (97), so `\"Apple\"` sorts before `\"apple\"` and `\"Zebra\"` before `\"apple\"`. A prefix sorts first, and `'1'` is less than `'9'`, so `\"10\" < \"9\"`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::string s = \"x\";\ns += 65;\nstd::cout << s;\n```",
          options: ["`x65`", "`xA`", "It does not compile", "`x` followed by the byte 65 as a number"],
          answer: 1,
          explanation: "`operator+=` has a `char` overload and `65` converts to the `char` `'A'`. To append the digits use `s += std::to_string(65)`.",
        },
        {
          prompt: "Which statement about `c_str()` is correct?",
          options: ["It returns a copy of the characters that the caller must `delete[]`", "It returns a null-terminated `const char*` into the string's own buffer, valid until the string is modified or destroyed", "It converts the string to a `std::string_view`", "It is only available on `const` strings"],
          answer: 1,
          explanation: "`c_str()` is the bridge to C APIs: a pointer into the string's storage with a terminating `'\\0'`. Nothing is copied and nothing must be freed — but the pointer is invalidated by the next modification.",
        },
      ],
    },
    {
      slug: "searching-and-slicing",
      file: "02-searching-and-slicing.md",
      exercises: [
        {
          title: "Count and replace",
          prompt: `Read three lines: a text, a needle (never empty) and a replacement (possibly empty). Print \`count=<n>\`, the number of **non-overlapping** occurrences of the needle in the text scanning left to right, and then the text with every occurrence replaced by the replacement.

Count with a \`find\` loop that restarts after each match; replace with a loop that restarts *after the inserted replacement* — the replacement may contain the needle.

**Input:** three lines.
**Output:** two lines.

Example: input
\`\`\`text
the cat sat on the mat
at
AT
\`\`\`
→ output
\`\`\`text
count=3
the cAT sAT on the mAT
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string text, needle, replacement;
    std::getline(std::cin, text);
    std::getline(std::cin, needle);
    std::getline(std::cin, replacement);

    int count = 0;
    // TODO: count non-overlapping occurrences of needle in text

    // TODO: replace every occurrence of needle in text with replacement

    std::cout << "count=" << count << '\n';
    std::cout << text << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    std::string text, needle, replacement;
    std::getline(std::cin, text);
    std::getline(std::cin, needle);
    std::getline(std::cin, replacement);

    int count = 0;
    for (std::size_t pos = text.find(needle); pos != std::string::npos; pos = text.find(needle, pos + needle.size())) {
        ++count;
    }

    std::size_t pos = 0;
    while ((pos = text.find(needle, pos)) != std::string::npos) {
        text.replace(pos, needle.size(), replacement);
        pos += replacement.size();
    }

    std::cout << "count=" << count << '\n';
    std::cout << text << '\n';
    return 0;
}
`,
          hints: [
            "text.find(needle, from) searches from an index; keep going while the result is not std::string::npos.",
            "After counting a match at pos, search again from pos + needle.size() so overlapping matches are skipped.",
            "In the replace loop advance by replacement.size(), not needle.size() — replacing a with aa must not find the new a.",
          ],
          cases: [
            { stdin: "the cat sat on the mat\nat\nAT\n", expected: "count=3\nthe cAT sAT on the mAT\n" },
            { stdin: "banana\nana\n-\n", expected: "count=1\nb-na\n" },
            { stdin: "aaaa\na\naa\n", expected: "count=4\naaaaaaaa\n", hidden: true },
            { stdin: "hello\nxyz\n!\n", expected: "count=0\nhello\n", hidden: true },
            { stdin: "a-b-c\n-\n\n", expected: "count=2\nabc\n", hidden: true },
          ],
        },
        {
          title: "Path parts",
          prompt: `Read one line holding a file path such as \`/home/ada/notes.final.txt\` and split it with \`rfind\` and \`substr\`. Print five lines:

- \`dir=\` the part before the last \`/\`, or \`(none)\` if there is no slash;
- \`file=\` the part after the last \`/\` (the whole path if there is no slash);
- \`stem=\` and \`ext=\`: if the file name contains a \`.\` that is not its first character, \`ext\` is everything after the last such \`.\` and \`stem\` everything before it; otherwise \`stem\` is the whole file name and \`ext=(none)\`;
- \`hidden=yes\` if the file name starts with \`.\` (use \`starts_with\`), else \`hidden=no\`.

The path never ends with \`/\`.

**Input:** one line.
**Output:** five lines.

Example: input \`/home/ada/notes.final.txt\` → output
\`\`\`text
dir=/home/ada
file=notes.final.txt
stem=notes.final
ext=txt
hidden=no
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

int main() {
    std::string path;
    std::getline(std::cin, path);

    std::string dir = "(none)";
    std::string file = path;
    // TODO: split on the last '/'

    std::string stem = file;
    std::string ext = "(none)";
    // TODO: split the file name on its last '.', unless that dot is the first character

    std::cout << "dir=" << dir << '\n';
    std::cout << "file=" << file << '\n';
    std::cout << "stem=" << stem << '\n';
    std::cout << "ext=" << ext << '\n';
    // TODO: print hidden=yes or hidden=no
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

int main() {
    std::string path;
    std::getline(std::cin, path);

    std::string dir = "(none)";
    std::string file = path;
    const std::size_t slash = path.rfind('/');
    if (slash != std::string::npos) {
        dir = path.substr(0, slash);
        file = path.substr(slash + 1);
    }

    std::string stem = file;
    std::string ext = "(none)";
    const std::size_t dot = file.rfind('.');
    if (dot != std::string::npos && dot != 0) {
        stem = file.substr(0, dot);
        ext = file.substr(dot + 1);
    }

    std::cout << "dir=" << dir << '\n';
    std::cout << "file=" << file << '\n';
    std::cout << "stem=" << stem << '\n';
    std::cout << "ext=" << ext << '\n';
    std::cout << "hidden=" << (file.starts_with('.') ? "yes" : "no") << '\n';
    return 0;
}
`,
          hints: [
            "rfind('/') gives the index of the last slash, or npos when there is none — test for npos before calling substr.",
            "substr(0, pos) is everything before pos; substr(pos + 1) everything after it.",
            "A dot at index 0 of the file name (.bashrc) is not an extension separator: require dot != 0 as well as dot != npos.",
          ],
          cases: [
            { stdin: "/home/ada/notes.final.txt\n", expected: "dir=/home/ada\nfile=notes.final.txt\nstem=notes.final\next=txt\nhidden=no\n" },
            { stdin: "archive.tar.gz\n", expected: "dir=(none)\nfile=archive.tar.gz\nstem=archive.tar\next=gz\nhidden=no\n" },
            { stdin: "/home/ada/.bashrc\n", expected: "dir=/home/ada\nfile=.bashrc\nstem=.bashrc\next=(none)\nhidden=yes\n", hidden: true },
            { stdin: "README\n", expected: "dir=(none)\nfile=README\nstem=README\next=(none)\nhidden=no\n", hidden: true },
            { stdin: "src/.config.json\n", expected: "dir=src\nfile=.config.json\nstem=.config\next=json\nhidden=yes\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::string s = \"banana\";\nstd::cout << s.find(\"na\") << ' ' << s.rfind(\"na\") << ' ' << s.find(\"na\", 3);\n```",
          options: ["`2 4 4`", "`2 4 2`", "`3 5 5`", "`2 2 4`"],
          answer: 0,
          explanation: "`find` returns the first match, at index 2; `rfind` the last, at 4; `find(\"na\", 3)` starts searching at index 3 and finds the one at 4.",
        },
        {
          prompt: "Why is `if (s.find(\"x\") >= 0)` wrong?",
          options: ["`find` returns `int`, so the comparison overflows", "`find` returns `std::size_t`, which is unsigned, so the condition is always true — even `npos` is `>= 0`", "It does not compile: `npos` cannot be compared with `0`", "It is correct — `npos` is `-1`"],
          answer: 1,
          explanation: "`npos` is the largest `size_t`, not a negative number. Every `size_t` is at least zero, so the branch is always taken; compare with `std::string::npos` instead.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::string s = \"hello\";\ns.erase(1, 2);\ns.insert(0, \"[\");\nstd::cout << s;\n```",
          options: ["`[hlo`", "`[helo`", "`[hello`", "`[llo`"],
          answer: 0,
          explanation: "`erase(1, 2)` removes two characters starting at index 1 (`el`), leaving `hlo`; `insert(0, \"[\")` puts the bracket in front.",
        },
        {
          prompt: "For `std::string s = \"abcdef\";`, what does `s.substr(2, 100)` do?",
          options: ["Throws `std::out_of_range` because the count exceeds the size", "Returns `\"cdef\"` — a count past the end is clamped", "Undefined behaviour", "Returns `\"cd\"`"],
          answer: 1,
          explanation: "Only the *position* is checked (`pos > size()` throws); the count is silently clamped to what remains. `s.substr(20)` would throw.",
        },
        {
          prompt: "A replace-all loop calls `pos = text.find(from, pos)` and, after `text.replace(pos, from.size(), to)`, searches again from the same `pos`. Replacing `\"a\"` with `\"aa\"`…",
          options: ["Works, because `replace` moves `pos` forward", "Never terminates — the search finds the `a` just inserted, replaces it again, and so on", "Throws `std::out_of_range`", "Replaces only the first occurrence"],
          answer: 1,
          explanation: "Each replacement inserts a new match at `pos`. Advance by `to.size()` after every replacement so the search continues after the inserted text.",
        },
        {
          prompt: "Which statement about C++20 and this track's runtime is correct?",
          options: ["`starts_with`, `ends_with` and `contains` are all available", "`starts_with` and `ends_with` are available; `contains` is C++23 and is not", "None of them exist — use `rfind(x, 0) == 0`", "`contains` is available but `starts_with` is not"],
          answer: 1,
          explanation: "`starts_with`/`ends_with` were added in C++20. `std::string::contains` arrived in C++23, so on a C++20 compiler write `find(x) != std::string::npos`.",
        },
        {
          prompt: "`trim` calls `s.find_first_not_of(\" \\t\")` on a line that is entirely spaces and passes the result straight to `substr`. What happens?",
          options: ["It returns an empty string", "It returns the original line", "`substr` throws `std::out_of_range` because the position is `npos`", "Undefined behaviour"],
          answer: 2,
          explanation: "`find_first_not_of` finds no such character and returns `npos`, and `substr(npos)` throws because the position exceeds the size. Test for `npos` first and return `\"\"`.",
        },
      ],
    },
    {
      slug: "characters-and-conversions",
      file: "03-characters-and-conversions.md",
      exercises: [
        {
          title: "Classify and swap",
          prompt: `Read one line. Using \`<cctype>\` with the \`unsigned char\` cast, count its letters (\`isalpha\`), digits (\`isdigit\`), spaces (\`isspace\`) and other characters, then print the line with every letter's case swapped (capitals become lower case and lower case becomes capitals); every other character is unchanged.

**Input:** one line (possibly empty, possibly with leading or trailing spaces).
**Output:** \`letters=<a> digits=<b> spaces=<c> other=<d>\` on the first line, the swapped text on the second.

Example: input \`Hello, World 42!\` → output
\`\`\`text
letters=10 digits=2 spaces=2 other=2
hELLO, wORLD 42!
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);

    int letters = 0, digits = 0, spaces = 0, other = 0;
    for (char& c : line) {
        const unsigned char u = static_cast<unsigned char>(c);
        // TODO: classify u, and swap the case of letters in place
    }

    std::cout << "letters=" << letters << " digits=" << digits << " spaces=" << spaces << " other=" << other << '\n';
    std::cout << line << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);

    int letters = 0, digits = 0, spaces = 0, other = 0;
    for (char& c : line) {
        const unsigned char u = static_cast<unsigned char>(c);
        if (std::isalpha(u)) {
            ++letters;
            c = static_cast<char>(std::isupper(u) ? std::tolower(u) : std::toupper(u));
        } else if (std::isdigit(u)) {
            ++digits;
        } else if (std::isspace(u)) {
            ++spaces;
        } else {
            ++other;
        }
    }

    std::cout << "letters=" << letters << " digits=" << digits << " spaces=" << spaces << " other=" << other << '\n';
    std::cout << line << '\n';
    return 0;
}
`,
          hints: [
            "The cctype functions take an int that must be in the unsigned char range — pass the cast value u, never c.",
            "std::toupper and std::tolower return int; cast the result back to char before storing it through the reference.",
            "An if / else if chain in the order letter, digit, space, other counts every character exactly once.",
          ],
          cases: [
            { stdin: "Hello, World 42!\n", expected: "letters=10 digits=2 spaces=2 other=2\nhELLO, wORLD 42!\n" },
            { stdin: "C++20 is here\n", expected: "letters=7 digits=2 spaces=2 other=2\nc++20 IS HERE\n" },
            { stdin: "\n", expected: "letters=0 digits=0 spaces=0 other=0\n\n", hidden: true },
            { stdin: "   MiXeD   \n", expected: "letters=5 digits=0 spaces=6 other=0\n   mIxEd\n", hidden: true },
            { stdin: "2026-09-17\n", expected: "letters=0 digits=8 spaces=0 other=2\n2026-09-17\n", hidden: true },
          ],
        },
        {
          title: "Parse the numbers",
          prompt: `Read lines until end of input. Each line holds one token, possibly with spaces before or after it; blank lines are skipped. Trim the line, then decide what the token is:

- a valid \`int\` — an optional \`-\` followed only by digits, and a value that fits in \`int\` — prints \`<token> -> <value>\` and is added to a running \`long long\` sum;
- digits that do not fit in an \`int\` print \`<token> -> out of range\`;
- anything else (letters, a \`+\` sign, a decimal point, a space inside the token, a lone \`-\`) prints \`<token> -> invalid\`.

After the last line print \`sum=<sum>\`. Use \`std::from_chars\` and require that it consumed the whole token (\`ptr == last\`); if you prefer \`std::stoi\`, reject the \`+\` sign and trailing text yourself and catch both exceptions — an uncaught one is a runtime error.

**Input:** any number of lines.
**Output:** one line per non-blank input line, then the sum.

Example: input
\`\`\`text
42
  -17
abc
2147483648
\`\`\`
→ output
\`\`\`text
42 -> 42
-17 -> -17
abc -> invalid
2147483648 -> out of range
sum=25
\`\`\``,
          starter: String.raw`#include <charconv>
#include <iostream>
#include <string>
#include <system_error>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

int main() {
    long long sum = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        const std::string token = trim(line);
        if (token.empty()) continue;
        // TODO: parse token with std::from_chars and print the verdict
    }
    std::cout << "sum=" << sum << '\n';
    return 0;
}
`,
          solution: String.raw`#include <charconv>
#include <iostream>
#include <string>
#include <system_error>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

int main() {
    long long sum = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        const std::string token = trim(line);
        if (token.empty()) continue;

        int value = 0;
        const char* first = token.data();
        const char* last = first + token.size();
        const auto [ptr, ec] = std::from_chars(first, last, value);
        if (ec == std::errc::result_out_of_range) {
            std::cout << token << " -> out of range\n";
        } else if (ec != std::errc() || ptr != last) {
            std::cout << token << " -> invalid\n";
        } else {
            std::cout << token << " -> " << value << '\n';
            sum += value;
        }
    }
    std::cout << "sum=" << sum << '\n';
    return 0;
}
`,
          hints: [
            "std::from_chars(first, last, value) returns a struct with ptr and ec; unpack it with auto [ptr, ec] = ....",
            "ec == std::errc::result_out_of_range means the digits were fine but the value does not fit; any other error, or ptr != last, means the token is not a whole number.",
            "from_chars accepts a leading - but not + or spaces, which is exactly the rule the prompt states — so trimming first is all the preparation you need.",
          ],
          cases: [
            { stdin: "42\n  -17  \nabc\n2147483648\n", expected: "42 -> 42\n-17 -> -17\nabc -> invalid\n2147483648 -> out of range\nsum=25\n" },
            { stdin: "1\n\n2\n3.5\n", expected: "1 -> 1\n2 -> 2\n3.5 -> invalid\nsum=3\n" },
            { stdin: "+5\n-2147483648\n007\n", expected: "+5 -> invalid\n-2147483648 -> -2147483648\n007 -> 7\nsum=-2147483641\n", hidden: true },
            { stdin: "1 2\n-\n\n   \n9\n", expected: "1 2 -> invalid\n- -> invalid\n9 -> 9\nsum=9\n", hidden: true },
            { stdin: "2147483647\n2147483647\n", expected: "2147483647 -> 2147483647\n2147483647 -> 2147483647\nsum=4294967294\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nchar c = 'A';\nstd::cout << c + 1;\n```",
          options: ["`B`", "`66`", "`A1`", "It does not compile"],
          answer: 1,
          explanation: "`c + 1` promotes the `char` to `int` before adding, and an `int` prints as digits: 65 + 1 = 66. `static_cast<char>(c + 1)` prints `B`.",
        },
        {
          prompt: "Why do careful programs write `std::isalpha(static_cast<unsigned char>(c))` rather than `std::isalpha(c)`?",
          options: ["`isalpha` takes `unsigned char` and will not compile with a `char`", "`char` is signed on this platform, so a byte above 127 is negative, and passing a negative value other than `EOF` is undefined behaviour", "The cast makes the call faster", "Without the cast `isalpha` returns `bool` instead of `int`"],
          answer: 1,
          explanation: "The `<cctype>` functions are defined only for values representable as `unsigned char` and for `EOF`. Non-ASCII input produces negative `char` values, and the cast maps them back into the valid range.",
        },
        {
          prompt: "What does `std::stoi(\"42abc\")` do?",
          options: ["Returns 42 — it parses the longest valid prefix and ignores the rest", "Throws `std::invalid_argument`", "Returns 0", "Undefined behaviour"],
          answer: 0,
          explanation: "The `stoi` family wraps `strtol`: leading whitespace is skipped, a prefix is parsed, trailing text is ignored. Pass a `std::size_t*` to learn how many characters were consumed, or use `std::from_chars` and check `ptr == last`.",
        },
        {
          prompt: "`std::from_chars` is called on the three characters `\" 42\"` (a leading space). What is the result?",
          options: ["42, because leading whitespace is skipped like `stoi`", "`ec == std::errc::invalid_argument` and `ptr` still points at the space", "4, because the space is treated as a digit separator", "It does not compile with a leading space"],
          answer: 1,
          explanation: "`from_chars` skips nothing: the pattern must begin at `first`. A space is not part of a number, so no conversion happens. Trim first, and remember it rejects a `+` sign too.",
        },
        {
          prompt: "What is `std::to_string(2.5)`?",
          options: ["`\"2.5\"`", "`\"2.50\"`", "`\"2.500000\"`", "`\"2.5e+00\"`"],
          answer: 2,
          explanation: "For floating point, `std::to_string` formats like `printf(\"%f\")`: always six decimals. Use `std::format(\"{:.1f}\", x)` or a stream with `std::setprecision` to control it.",
        },
        {
          prompt: "What is the type and value of `'7' - '0'`?",
          options: ["`char` `'7'`", "`int` 7", "`int` 55", "It does not compile — you cannot subtract characters"],
          answer: 1,
          explanation: "Both operands promote to `int`: 55 − 48 = 7. The digit characters have consecutive codes, so subtracting `'0'` converts a digit character to its value.",
        },
        {
          prompt: "Which exception does `std::stoi(\"99999999999\")` throw?",
          options: ["`std::invalid_argument`", "`std::out_of_range`", "`std::overflow_error`", "None — the value wraps around"],
          answer: 1,
          explanation: "The digits are valid but the value does not fit an `int`, which is `std::out_of_range`. `std::invalid_argument` is for text with no number at all. Catch both, or the program ends with a runtime error.",
        },
      ],
    },
    {
      slug: "parsing-input",
      file: "04-parsing-input.md",
      exercises: [
        {
          title: "CSV fields",
          prompt: `Read lines until end of input. Each line is a comma-separated record. For every line print the number of fields and then each field with its surrounding spaces trimmed, all joined with \`|\`.

The rules: two commas in a row enclose an empty field, a comma at the end of the line is followed by an empty field (so \`x,y,\` has three fields), and a line that is empty or contains only spaces has no fields — print \`0\`.

**Input:** any number of lines.
**Output:** one line per input line.

Example: input
\`\`\`text
ada, 36 ,london
a,,b
\`\`\`
→ output
\`\`\`text
3|ada|36|london
3|a||b
\`\`\`
A \`find\`/\`substr\` loop keeps the trailing empty field; \`std::getline\` with a delimiter drops it — choose accordingly.`,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

std::vector<std::string> split(const std::string& text, char delim) {
    std::vector<std::string> parts;
    // TODO: cut text on every delim, keeping empty fields (including a trailing one)
    return parts;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: print 0 for a blank line, else the count and the trimmed fields joined by |
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

std::vector<std::string> split(const std::string& text, char delim) {
    std::vector<std::string> parts;
    std::size_t start = 0;
    while (true) {
        const std::size_t at = text.find(delim, start);
        if (at == std::string::npos) {
            parts.push_back(text.substr(start));
            return parts;
        }
        parts.push_back(text.substr(start, at - start));
        start = at + 1;
    }
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (trim(line).empty()) {
            std::cout << "0\n";
            continue;
        }
        const std::vector<std::string> fields = split(line, ',');
        std::cout << fields.size();
        for (const std::string& field : fields) {
            std::cout << '|' << trim(field);
        }
        std::cout << '\n';
    }
    return 0;
}
`,
          hints: [
            "Loop: find the next comma from start; push the text between start and it; move start past the comma; when find returns npos push the rest and stop.",
            "Decide blankness on the trimmed whole line before splitting — a line of spaces has zero fields, but ' , ' has two.",
            "Print the count first, then a | before each trimmed field, so the line never ends with a stray separator.",
          ],
          cases: [
            { stdin: "ada, 36 ,london\na,,b\n", expected: "3|ada|36|london\n3|a||b\n" },
            { stdin: "one\n", expected: "1|one\n" },
            { stdin: "x,y,\n", expected: "3|x|y|\n", hidden: true },
            { stdin: "\n   \nsolo\n", expected: "0\n0\n1|solo\n", hidden: true },
            { stdin: " ,  , \n", expected: "3|||\n", hidden: true },
          ],
        },
        {
          title: "Settings file",
          prompt: `Read an integer \`N\`, then \`N\` lines of a settings file, then an integer \`M\` and \`M\` query keys (single tokens). Each settings line is either blank, a comment starting with \`#\`, or \`key = value\`: cut on the **first** \`=\`, trim both sides; the value may contain spaces or further \`=\` signs and may be empty. A line with no \`=\`, or an empty key, is invalid: print \`line <i>: invalid\` (\`i\` counts all \`N\` lines from 1) and carry on. A key set twice keeps the last value.

Then, for each query key, print \`<key>=<value>\` or \`<key>: not set\`.

**Input:** \`N\`, \`N\` lines, \`M\`, \`M\` keys.
**Output:** one line per invalid settings line, then one line per query.

Example: input
\`\`\`text
3
colour = blue
broken line
colour=green
2
colour size
\`\`\`
→ output
\`\`\`text
line 2: invalid
colour=green
size: not set
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <string>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();

    std::map<std::string, std::string> settings;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        // TODO: skip blank and comment lines, validate, store key -> value
    }

    int m = 0;
    std::cin >> m;
    for (int i = 0; i < m; ++i) {
        std::string key;
        std::cin >> key;
        // TODO: print key=value or key: not set
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <string>

std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();

    std::map<std::string, std::string> settings;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        const std::string clean = trim(line);
        if (clean.empty() || clean.front() == '#') continue;

        const std::size_t eq = clean.find('=');
        if (eq == std::string::npos) {
            std::cout << "line " << i << ": invalid\n";
            continue;
        }
        const std::string key = trim(clean.substr(0, eq));
        if (key.empty()) {
            std::cout << "line " << i << ": invalid\n";
            continue;
        }
        settings[key] = trim(clean.substr(eq + 1));
    }

    int m = 0;
    std::cin >> m;
    for (int i = 0; i < m; ++i) {
        std::string key;
        std::cin >> key;
        if (settings.contains(key)) {
            std::cout << key << '=' << settings.at(key) << '\n';
        } else {
            std::cout << key << ": not set\n";
        }
    }
    return 0;
}
`,
          hints: [
            "After std::cin >> n the newline is still waiting; std::cin.ignore() before the first getline, and the later std::cin >> m needs no ignore because >> skips whitespace.",
            "find('=') gives the first equals sign; substr(0, eq) is the key and substr(eq + 1) the value — trim both, then check the key is not empty.",
            "settings[key] = value overwrites an earlier entry; settings.contains(key) (C++20) tells you whether a query key was ever set.",
          ],
          cases: [
            { stdin: "3\ncolour = blue\nbroken line\ncolour=green\n2\ncolour size\n", expected: "line 2: invalid\ncolour=green\nsize: not set\n" },
            { stdin: "4\nname = Ada Lovelace\n# comment\ntimeout=30\n\n2\nname timeout\n", expected: "name=Ada Lovelace\ntimeout=30\n" },
            { stdin: "2\n = x\nurl = a?b=c\n1\nurl\n", expected: "line 1: invalid\nurl=a?b=c\n", hidden: true },
            { stdin: "1\nempty =\n2\nempty other\n", expected: "empty=\nother: not set\n", hidden: true },
            { stdin: "0\n1\nk\n", expected: "k: not set\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The input is `3⏎Ada⏎`. After `int n; std::cin >> n; std::string name; std::getline(std::cin, name);`, what is `name`?",
          options: ["`\"Ada\"`", "`\"3\"`", "`\"\"` — the empty rest of the first line", "The read fails and `name` is unchanged"],
          answer: 2,
          explanation: "`>>` stops at the newline after `3` without consuming it, so `getline` reads up to that newline and returns nothing. Call `std::cin.ignore()` between them.",
        },
        {
          prompt: "How many times does the loop body run?\n\n```cpp\nstd::istringstream iss(\"a  b   c\");\nstd::string w;\nint count = 0;\nwhile (iss >> w) ++count;\n```",
          options: ["3", "1", "6", "5"],
          answer: 0,
          explanation: "`>>` skips any run of whitespace before each token, so the double and triple spaces count as one separator each: `a`, `b`, `c`.",
        },
        {
          prompt: "`std::istringstream iss(\"a,b,\"); while (std::getline(iss, f, ',')) ++k;` — what is `k` afterwards?",
          options: ["2 — the trailing comma is followed by nothing, so the third `getline` extracts no characters and fails", "3 — the trailing comma yields an empty field", "1", "The loop never ends"],
          answer: 0,
          explanation: "`getline` with a delimiter returns an empty field *between* two delimiters but not after a final one, because reaching end of input with nothing extracted sets the fail bit. A `find`/`substr` loop keeps the trailing empty field.",
        },
        {
          prompt: "What is the state after this?\n\n```cpp\nstd::istringstream iss(\"x\");\nint n = 5;\niss >> n;\n```",
          options: ["`n` is 5 and the stream is fine", "`n` is 0 and the stream's fail bit is set; further reads fail until `clear()`", "An exception is thrown", "`n` is the character code of `'x'`"],
          answer: 1,
          explanation: "Since C++11 a failed numeric extraction writes 0 to the target and sets `failbit`. The stream stays in that state, so `if (!(iss >> n))` is the test for \"not a number\".",
        },
        {
          prompt: "A `key = value` parser cuts on `line.rfind('=')`. Which input breaks it?",
          options: ["`timeout = 30`", "`url = a?b=c` — the value's own `=` becomes the cut point", "`name = Ada Lovelace`", "`# comment`"],
          answer: 1,
          explanation: "The last `=` is inside the value, so the key becomes `url = a?b` and the value `c`. Cut on the *first* `=` with `find` so values may contain the character.",
        },
        {
          prompt: "When does `while (std::getline(std::cin, line))` stop?",
          options: ["At the first empty line", "When a read fails — at end of input", "When `line` equals `\"EOF\"`", "It never stops without a `break`"],
          answer: 1,
          explanation: "The condition is the stream itself, which converts to `false` once an extraction has failed. An empty line is a successful read of an empty string, so the loop continues through it.",
        },
      ],
    },
    {
      slug: "formatting-output",
      file: "05-formatting-output.md",
      exercises: [
        {
          title: "Receipt",
          prompt: `Read an integer \`N\` and then \`N\` lines, each \`name qty price\` — a one-word item name, an integer quantity and a decimal unit price. Print one line per item and a total line, with exact widths:

- item lines: name **left-aligned in width 12**, quantity **right-aligned in width 4**, line total (\`qty × price\`) **right-aligned in width 10 with two decimals** — the \`std::format\` spec is \`{:<12}{:>4}{:>10.2f}\`;
- the last line: \`TOTAL\` left-aligned in width 16, then the grand total right-aligned in width 10 with two decimals.

A name longer than 12 characters simply pushes its columns right. \`N\` may be 0, in which case only the total line is printed.

**Input:** \`N\`, then \`N\` lines.
**Output:** \`N + 1\` lines.

Example: input
\`\`\`text
3
pen 3 1.25
notebook 2 4.5
stapler 1 12.99
\`\`\`
→ output
\`\`\`text
pen            3      3.75
notebook       2      9.00
stapler        1     12.99
TOTAL                25.74
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>
#include <string>

int main() {
    int n = 0;
    std::cin >> n;
    double grand = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int qty = 0;
        double price = 0.0;
        std::cin >> name >> qty >> price;
        // TODO: compute the line total, add it to grand, print the formatted row
    }
    // TODO: print the TOTAL line
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>
#include <string>

int main() {
    int n = 0;
    std::cin >> n;
    double grand = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int qty = 0;
        double price = 0.0;
        std::cin >> name >> qty >> price;
        const double total = qty * price;
        grand += total;
        std::cout << std::format("{:<12}{:>4}{:>10.2f}\n", name, qty, total);
    }
    std::cout << std::format("{:<16}{:>10.2f}\n", "TOTAL", grand);
    return 0;
}
`,
          hints: [
            "std::format(\"{:<12}{:>4}{:>10.2f}\\n\", name, qty, total) — < left-aligns, > right-aligns, .2f fixes two decimals.",
            "With <iomanip> the same row is std::left << std::setw(12) << name << std::right << std::setw(4) << qty << std::setw(10) << std::fixed << std::setprecision(2) << total.",
            "Width 12 plus width 4 is 16, which is why the TOTAL label takes width 16: the amounts line up in the same column.",
          ],
          cases: [
            { stdin: "3\npen 3 1.25\nnotebook 2 4.5\nstapler 1 12.99\n", expected: "pen            3      3.75\nnotebook       2      9.00\nstapler        1     12.99\nTOTAL                25.74\n" },
            { stdin: "1\ncoffee 10 0.99\n", expected: "coffee        10      9.90\nTOTAL                 9.90\n" },
            { stdin: "0\n", expected: "TOTAL                 0.00\n", hidden: true },
            { stdin: "2\nwidget 100 0.1\nverylongitemname 1 2\n", expected: "widget       100     10.00\nverylongitemname   1      2.00\nTOTAL                12.00\n", hidden: true },
          ],
        },
        {
          title: "Number bases",
          prompt: `Read integers in the range 0 to 65535 until end of input (whitespace-separated). Print a header line and then one row per number showing it in four bases, columns separated by \`|\`:

- decimal right-aligned in width 5;
- hexadecimal in lower case, zero-padded to 4 digits;
- octal right-aligned in width 6;
- binary zero-padded to 16 digits.

The header uses the same widths, right-aligned: \`{:>5}|{:>4}|{:>6}|{:>16}\` with the words \`dec\`, \`hex\`, \`oct\`, \`bin\`; each row is \`{:>5}|{:04x}|{:>6o}|{:016b}\`. \`std::format\` makes the binary column trivial — with \`<iomanip>\` you would have to build it by hand. With no numbers at all, only the header is printed.

**Input:** zero or more integers.
**Output:** the header, then one line per integer.

Example: input \`255 0 65535\` → output
\`\`\`text
  dec| hex|   oct|             bin
  255|00ff|   377|0000000011111111
    0|0000|     0|0000000000000000
65535|ffff|177777|1111111111111111
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>

int main() {
    // TODO: print the header
    int value = 0;
    while (std::cin >> value) {
        // TODO: print the row for value
    }
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>

int main() {
    std::cout << std::format("{:>5}|{:>4}|{:>6}|{:>16}\n", "dec", "hex", "oct", "bin");
    int value = 0;
    while (std::cin >> value) {
        std::cout << std::format("{:>5}|{:04x}|{:>6o}|{:016b}\n", value, value, value, value);
    }
    return 0;
}
`,
          hints: [
            "The same argument may be passed four times; each placeholder formats it its own way.",
            "{:04x} means zero-fill to width 4 in hex; {:016b} is the same idea in binary; {:>6o} right-aligns octal with spaces.",
            "while (std::cin >> value) reads until the input runs out; an empty input prints just the header.",
          ],
          cases: [
            { stdin: "255 0 65535\n", expected: "  dec| hex|   oct|             bin\n  255|00ff|   377|0000000011111111\n    0|0000|     0|0000000000000000\n65535|ffff|177777|1111111111111111\n" },
            { stdin: "10\n4096\n", expected: "  dec| hex|   oct|             bin\n   10|000a|    12|0000000000001010\n 4096|1000| 10000|0001000000000000\n" },
            { stdin: "\n", expected: "  dec| hex|   oct|             bin\n", hidden: true },
            { stdin: "1 2 3 32768\n", expected: "  dec| hex|   oct|             bin\n    1|0001|     1|0000000000000001\n    2|0002|     2|0000000000000010\n    3|0003|     3|0000000000000011\n32768|8000|100000|1000000000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::cout << std::setw(5) << 42 << 7;` print?",
          options: ["`   427`", "`   42    7`", "`427`", "`00427`"],
          answer: 0,
          explanation: "`setw` applies to the next insertion only: `42` is padded to width 5, then `7` is printed with no width at all.",
        },
        {
          prompt: "What does `std::cout << std::setprecision(2) << 1234.5;` print?",
          options: ["`1234.50`", "`1234.5`", "`1.2e+03`", "`1234`"],
          answer: 2,
          explanation: "Without `std::fixed`, `setprecision` counts *significant* digits and the default float mode switches to scientific notation when the value does not fit. `std::fixed << std::setprecision(2)` gives `1234.50`.",
        },
        {
          prompt: "What does `std::format(\"{:04}|{:>4}|{:<4}|\", 7, 7, \"ab\")` return?",
          options: ["`0007|   7|ab  |`", "`   7|0007|  ab|`", "`7000|7   |ab  |`", "`0007|7   |  ab|`"],
          answer: 0,
          explanation: "`0` before the width zero-fills, `>` right-aligns with spaces, `<` left-aligns. Note that `{:4}` alone would already right-align a number and left-align a string.",
        },
        {
          prompt: "```cpp\nstd::string fmt = \"{}\";\nstd::cout << std::format(fmt, 1);\n```\nWhat happens?",
          options: ["Prints `1`", "A compile error — the format string must be a compile-time constant; use `std::vformat` for a runtime string", "Throws `std::format_error` at run time", "Undefined behaviour"],
          answer: 1,
          explanation: "`std::format` checks the format string against the argument types at compile time, so it must be a constant expression. `std::vformat(fmt, std::make_format_args(1))` is the run-time form.",
        },
        {
          prompt: "After `std::cout << std::hex << 255;` the program later runs `std::cout << 16;`. What appears for the second value?",
          options: ["`16`", "`10`", "`0x10`", "A compile error"],
          answer: 1,
          explanation: "`std::hex` is sticky: the stream stays in hexadecimal until `std::dec` (or `std::oct`) is inserted. 16 in hex is `10`, without a prefix unless `std::showbase` is on.",
        },
        {
          prompt: "What does `std::format(\"{:x} {:#x} {:X}\", 255, 255, 255)` return?",
          options: ["`ff 0xff FF`", "`FF 0xFF ff`", "`0xff 0xff 0xFF`", "`ff ff FF`"],
          answer: 0,
          explanation: "`x` is lower-case hex, `#` adds the `0x` prefix, `X` gives upper-case digits (and `#X` would give `0XFF`).",
        },
        {
          prompt: "What does `std::cout << std::fixed << std::setprecision(2) << 2.0 / 3;` print?",
          options: ["`0.66`", "`0.67`", "`0.666667`", "`0.7`"],
          answer: 1,
          explanation: "Fixed mode with precision 2 rounds to the nearest hundredth: 0.6667 → `0.67`. Only exact binary ties such as `0.125` round to even.",
        },
      ],
    },
    {
      slug: "string-view",
      file: "06-string-view.md",
      exercises: [
        {
          title: "Words as views",
          prompt: `Read one line. Write \`std::vector<std::string_view> words(std::string_view text)\` that splits the text on runs of spaces **without copying a single character** — every element is a view into the line, which stays alive in \`main\`. Then print \`words=<n>\`, \`longest=<word>\` (the first of the longest words; \`longest=(none)\` if there are no words), and one line \`<word> <length>\` per word in order.

**Input:** one line (possibly empty, possibly with leading, trailing or repeated spaces).
**Output:** two lines, then one line per word.

Example: input \`the quick  brown fox\` → output
\`\`\`text
words=4
longest=quick
the 3
quick 5
brown 5
fox 3
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <string_view>
#include <vector>

std::vector<std::string_view> words(std::string_view text) {
    std::vector<std::string_view> out;
    // TODO: skip spaces, find the end of each word, push text.substr(start, length)
    return out;
}

int main() {
    std::string line;
    std::getline(std::cin, line);

    const std::vector<std::string_view> ws = words(line);   // views into line, which outlives them
    std::cout << "words=" << ws.size() << '\n';
    // TODO: find the first longest word and print longest=... or longest=(none)
    // TODO: print each word and its length
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <string_view>
#include <vector>

std::vector<std::string_view> words(std::string_view text) {
    std::vector<std::string_view> out;
    std::size_t i = 0;
    while (i < text.size()) {
        while (i < text.size() && text[i] == ' ') ++i;
        const std::size_t start = i;
        while (i < text.size() && text[i] != ' ') ++i;
        if (start < i) out.push_back(text.substr(start, i - start));
    }
    return out;
}

int main() {
    std::string line;
    std::getline(std::cin, line);

    const std::vector<std::string_view> ws = words(line);   // views into line, which outlives them
    std::cout << "words=" << ws.size() << '\n';

    std::string_view longest;
    for (std::string_view w : ws) {
        if (w.size() > longest.size()) longest = w;
    }
    if (ws.empty()) {
        std::cout << "longest=(none)\n";
    } else {
        std::cout << "longest=" << longest << '\n';
    }

    for (std::string_view w : ws) {
        std::cout << w << ' ' << w.size() << '\n';
    }
    return 0;
}
`,
          hints: [
            "Two inner loops: advance i past spaces, remember start, advance i past non-spaces; push text.substr(start, i - start) only if the word is non-empty.",
            "std::string_view::substr returns another view — no allocation, and it stays valid because line lives until main returns.",
            "A strict > when comparing lengths keeps the first of equal-length words.",
          ],
          cases: [
            { stdin: "the quick  brown fox\n", expected: "words=4\nlongest=quick\nthe 3\nquick 5\nbrown 5\nfox 3\n" },
            { stdin: "   leading and trailing   \n", expected: "words=3\nlongest=trailing\nleading 7\nand 3\ntrailing 8\n" },
            { stdin: "\n", expected: "words=0\nlongest=(none)\n", hidden: true },
            { stdin: "     \n", expected: "words=0\nlongest=(none)\n", hidden: true },
            { stdin: "a bb ccc dd\n", expected: "words=4\nlongest=ccc\na 1\nbb 2\nccc 3\ndd 2\n", hidden: true },
          ],
        },
        {
          title: "Prefix filter",
          prompt: `The first line is a non-empty prefix. Every following line, until end of input, is an entry. Write \`std::string_view trim(std::string_view)\` that removes leading and trailing spaces and tabs with \`remove_prefix\` and \`remove_suffix\`, and for every entry: trim it, and if the trimmed entry \`starts_with\` the prefix print \`match: \` followed by the rest of the entry after the prefix. Finally print \`matched=<k> of <total>\`, where \`total\` counts every entry line, blank ones included.

**Input:** the prefix, then any number of entry lines.
**Output:** one line per matching entry, then the summary.

Example: input
\`\`\`text
err
error: disk full
  errno 5
warning: low
err
\`\`\`
→ output
\`\`\`text
match: or: disk full
match: no 5
match:
matched=3 of 4
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <string_view>

std::string_view trim(std::string_view s) {
    // TODO: remove_prefix the leading spaces/tabs, remove_suffix the trailing ones
    return s;
}

int main() {
    std::string prefix;
    std::getline(std::cin, prefix);

    int total = 0;
    int matched = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        ++total;
        const std::string_view entry = trim(line);
        // TODO: if entry starts with prefix, count it and print the remainder
    }
    std::cout << "matched=" << matched << " of " << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <string_view>

std::string_view trim(std::string_view s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string_view::npos) return {};
    s.remove_prefix(start);
    const std::size_t end = s.find_last_not_of(" \t");
    s.remove_suffix(s.size() - end - 1);
    return s;
}

int main() {
    std::string prefix;
    std::getline(std::cin, prefix);

    int total = 0;
    int matched = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        ++total;
        const std::string_view entry = trim(line);
        if (entry.starts_with(prefix)) {
            ++matched;
            std::cout << "match: " << entry.substr(prefix.size()) << '\n';
        }
    }
    std::cout << "matched=" << matched << " of " << total << '\n';
    return 0;
}
`,
          hints: [
            "find_first_not_of on an all-blank view returns npos — return an empty view then, before calling remove_prefix with it.",
            "After remove_prefix(start), find_last_not_of gives the last kept index; remove_suffix(size() - end - 1) drops what follows it.",
            "entry.substr(prefix.size()) is the remainder and costs nothing; an entry equal to the prefix prints an empty remainder.",
          ],
          cases: [
            { stdin: "err\nerror: disk full\n  errno 5\nwarning: low\nerr\n", expected: "match: or: disk full\nmatch: no 5\nmatch:\nmatched=3 of 4\n" },
            { stdin: "TODO\n  TODO: write tests\nDONE: read\n\nTODO\n", expected: "match: : write tests\nmatch:\nmatched=2 of 4\n" },
            { stdin: "a\n\n\n", expected: "matched=0 of 2\n", hidden: true },
            { stdin: "ab\n\t ab c \nabd\nxab\n", expected: "match:  c\nmatch: d\nmatched=2 of 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "```cpp\nstd::string_view v = std::string(\"temp\") + \"x\";\nstd::cout << v;\n```\nWhat happens?",
          options: ["Prints `tempx`", "Undefined behaviour — `v` views a temporary `std::string` that was destroyed at the end of the first statement", "A compile error: a view cannot be built from a temporary", "Prints `temp`"],
          answer: 1,
          explanation: "`+` returns a temporary `std::string`; the view copies its pointer, and the temporary dies at the semicolon. It may print correctly by luck, which is what makes the bug dangerous.",
        },
        {
          prompt: "Why is `std::string_view` normally passed **by value** rather than by `const&`?",
          options: ["Because it cannot be bound to a reference", "Because it is two words (a pointer and a length) that are cheap to copy — a reference would add an indirection for nothing", "Because passing by value copies the characters, which is safer", "Because `const std::string_view&` does not compile"],
          answer: 1,
          explanation: "A view is sixteen bytes on this platform and trivially copyable; passing it by value is the idiom, and it never copies the characters it refers to.",
        },
        {
          prompt: "Given `std::string_view sv = \"kairo\";`, which line does **not** compile?",
          options: ["`std::string s(sv);`", "`std::string s = sv;`", "`std::string s; s = sv;`", "`std::string s; s += sv;`"],
          answer: 1,
          explanation: "Constructing a `std::string` from a view is `explicit` because it allocates and copies, so copy-initialisation with `=` is refused. Direct construction, assignment and `+=` all accept a view.",
        },
        {
          prompt: "What does `sv.substr(2)` cost for a `std::string_view sv`?",
          options: ["O(n) — it copies the characters into a new string", "O(1) — it returns a narrower view; nothing is copied or allocated", "It throws unless `sv` is null-terminated", "It is undefined behaviour"],
          answer: 1,
          explanation: "A view's `substr` adjusts a pointer and a length. `std::string::substr`, by contrast, allocates and copies. Only `pos > size()` throws.",
        },
        {
          prompt: "You pass `sv.data()` to `std::printf(\"%s\")`, where `sv` is a view of the middle of a longer string. What is the risk?",
          options: ["None — `data()` is always null-terminated", "`printf` prints past the end of the view until it finds a `'\\0'`, because a view carries no terminator", "A compile error: `data()` returns `void*`", "`printf` prints only the first character"],
          answer: 1,
          explanation: "A view knows its length but the bytes continue after it. C APIs need a terminator, so build a `std::string` first and pass `c_str()`.",
        },
        {
          prompt: "Which of these uses a `std::string_view` safely?",
          options: ["A function that returns a view of one of its local `std::string` variables", "Storing a view of `v[0]` from a `std::vector<std::string> v` and then calling `v.push_back(...)`", "`constexpr std::string_view kName = \"codekairo\";` used anywhere in the program", "A view of `line` used after `std::getline(std::cin, line)` has replaced the contents with a longer line"],
          answer: 2,
          explanation: "A literal lives for the whole program, so a view of it can never dangle. The other three view something that is destroyed, may be reallocated, or has been resized under the view.",
        },
      ],
    },
    {
      slug: "strings-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Word frequency",
          prompt: `Read all of standard input. A word is a maximal run of letters and digits (\`std::isalnum\` with the \`unsigned char\` cast), converted to lower case; every other character separates words. Print each distinct word with its count as \`<word> <count>\`, one per line, in ascending \`std::string\` order, then \`total=<n> distinct=<m>\`.

**Input:** any number of lines.
**Output:** one line per distinct word, then the summary.

Example: input
\`\`\`text
Hello, hello! HELLO world.
World 42 42
\`\`\`
→ output
\`\`\`text
42 2
hello 3
world 2
total=7 distinct=3
\`\`\`
A \`std::map<std::string, int>\` keeps the words in order for you.`,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> freq;
    long long total = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        // TODO: walk the line, build each lower-case alphanumeric word, count it
    }
    // TODO: print the words in order, then total and distinct
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> freq;
    long long total = 0;
    std::string word;

    auto flush = [&]() {
        if (!word.empty()) {
            ++freq[word];
            ++total;
            word.clear();
        }
    };

    std::string line;
    while (std::getline(std::cin, line)) {
        for (char c : line) {
            const unsigned char u = static_cast<unsigned char>(c);
            if (std::isalnum(u)) {
                word += static_cast<char>(std::tolower(u));
            } else {
                flush();
            }
        }
        flush();
    }

    for (const auto& [w, count] : freq) {
        std::cout << w << ' ' << count << '\n';
    }
    std::cout << "total=" << total << " distinct=" << freq.size() << '\n';
    return 0;
}
`,
          hints: [
            "Accumulate characters into a word while isalnum is true; on any other character (and at the end of each line) finish the word if it is non-empty.",
            "++freq[word] creates the entry at 0 on first sight and increments it; a std::map iterates in key order, which is the order the output wants.",
            "Empty input produces no words: total=0 distinct=0 and nothing else.",
          ],
          cases: [
            { stdin: "Hello, hello! HELLO world.\nWorld 42 42\n", expected: "42 2\nhello 3\nworld 2\ntotal=7 distinct=3\n" },
            { stdin: "don't stop\n", expected: "don 1\nstop 1\nt 1\ntotal=3 distinct=3\n" },
            { stdin: "\n\n", expected: "total=0 distinct=0\n", hidden: true },
            { stdin: "a-A a_a\n", expected: "a 4\ntotal=4 distinct=1\n", hidden: true },
            { stdin: "C++ c++ C\n", expected: "c 3\ntotal=3 distinct=1\n", hidden: true },
          ],
        },
        {
          title: "Temperature report",
          prompt: `Read an integer \`N\` (at least 1) and then \`N\` lines. Each line is a city name — one or more words separated by single spaces — followed by two decimals, the maximum and minimum temperature. Parse from the right: the last two tokens are the numbers and everything before them is the name.

Print a header and one row per city with \`std::format\`: header \`{:<14}{:>7}{:>7}{:>7}\` with \`City\`, \`Max\`, \`Min\`, \`Range\`; rows \`{:<14}{:>7.1f}{:>7.1f}{:>7.1f}\` with the name, max, min and range (max − min). Then print \`Widest range: <city> (<range with one decimal>)\` — the first city on a tie.

**Input:** \`N\`, then \`N\` lines.
**Output:** \`N + 2\` lines.

Example: input
\`\`\`text
3
New York 28.5 19.0
Oslo 12.3 -3.5
Lima 21 15
\`\`\`
→ output
\`\`\`text
City              Max    Min  Range
New York         28.5   19.0    9.5
Oslo             12.3   -3.5   15.8
Lima             21.0   15.0    6.0
Widest range: Oslo (15.8)
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();

    std::cout << std::format("{:<14}{:>7}{:>7}{:>7}\n", "City", "Max", "Min", "Range");
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        // TODO: split into tokens; the last two are numbers, the rest is the name
        // TODO: print the row and remember the widest range
    }
    // TODO: print the widest range line
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
    int n = 0;
    std::cin >> n;
    std::cin.ignore();

    std::cout << std::format("{:<14}{:>7}{:>7}{:>7}\n", "City", "Max", "Min", "Range");

    std::string widest_city;
    double widest = 0.0;
    bool have_widest = false;

    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);

        std::istringstream iss(line);
        std::vector<std::string> tokens;
        std::string token;
        while (iss >> token) tokens.push_back(token);

        const double mn = std::stod(tokens[tokens.size() - 1]);
        const double mx = std::stod(tokens[tokens.size() - 2]);
        std::string city;
        for (std::size_t k = 0; k + 2 < tokens.size(); ++k) {
            if (!city.empty()) city += ' ';
            city += tokens[k];
        }

        const double range = mx - mn;
        std::cout << std::format("{:<14}{:>7.1f}{:>7.1f}{:>7.1f}\n", city, mx, mn, range);
        if (!have_widest || range > widest) {
            have_widest = true;
            widest = range;
            widest_city = city;
        }
    }

    std::cout << std::format("Widest range: {} ({:.1f})\n", widest_city, widest);
    return 0;
}
`,
          hints: [
            "Read the whole line, split it into tokens with an istringstream, and take the numbers from the back: tokens[size - 2] and tokens[size - 1].",
            "Rebuild the name from the remaining tokens joined by single spaces; std::stod converts the two numbers.",
            "Keep the widest range with a strict > so the first city wins a tie; remember the count line's newline needs std::cin.ignore() before the first getline.",
          ],
          cases: [
            { stdin: "3\nNew York 28.5 19.0\nOslo 12.3 -3.5\nLima 21 15\n", expected: "City              Max    Min  Range\nNew York         28.5   19.0    9.5\nOslo             12.3   -3.5   15.8\nLima             21.0   15.0    6.0\nWidest range: Oslo (15.8)\n" },
            { stdin: "1\nSan Jose de Costa Rica 30 20\n", expected: "City              Max    Min  Range\nSan Jose de Costa Rica   30.0   20.0   10.0\nWidest range: San Jose de Costa Rica (10.0)\n" },
            { stdin: "2\nA 10 0\nB 15 5\n", expected: "City              Max    Min  Range\nA                10.0    0.0   10.0\nB                15.0    5.0   10.0\nWidest range: A (10.0)\n", hidden: true },
            { stdin: "2\nNuuk -5.5 -20.2\nDubai 45.5 30\n", expected: "City              Max    Min  Range\nNuuk             -5.5  -20.2   14.7\nDubai            45.5   30.0   15.5\nWidest range: Dubai (15.5)\n", hidden: true },
          ],
        },
        {
          title: "Run-length codec",
          prompt: `Read lines until end of input. Each line is \`encode <text>\` or \`decode <text>\`; the text contains no spaces.

- \`encode\`: the text is letters only. Replace every maximal run of one character with \`<count><char>\`: \`aaabcc\` → \`3a1b2c\`.
- \`decode\`: the text should be a sequence of \`<count><char>\` groups where the count is one or more digits and the char is a letter; expand it: \`3a1b2c\` → \`aaabcc\`. Counts may have several digits (\`12x\`). If the text is not well-formed — a count with no letter after it, a letter with no count before it, a count of zero, or an empty text — print \`invalid\`.

Use \`c - '0'\` to accumulate counts, \`std::to_string\` to emit them, and the \`<cctype>\` functions with the \`unsigned char\` cast.

**Input:** any number of command lines.
**Output:** one line per command.

Example: input
\`\`\`text
encode aaabcc
decode 3a1b2c
decode 3
\`\`\`
→ output
\`\`\`text
3a1b2c
aaabcc
invalid
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <sstream>
#include <string>

std::string encode(const std::string& text) {
    std::string out;
    // TODO: for each maximal run, append the count and the character
    return out;
}

bool decode(const std::string& text, std::string& out) {
    out.clear();
    // TODO: read digits into a count, require a letter, append count copies; return false if malformed
    return !text.empty();
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream iss(line);
        std::string command, text;
        iss >> command >> text;
        if (command == "encode") {
            std::cout << encode(text) << '\n';
        } else if (command == "decode") {
            std::string result;
            std::cout << (decode(text, result) ? result : "invalid") << '\n';
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <sstream>
#include <string>

std::string encode(const std::string& text) {
    std::string out;
    std::size_t i = 0;
    while (i < text.size()) {
        std::size_t j = i;
        while (j < text.size() && text[j] == text[i]) ++j;
        out += std::to_string(j - i);
        out += text[i];
        i = j;
    }
    return out;
}

bool decode(const std::string& text, std::string& out) {
    out.clear();
    std::size_t i = 0;
    while (i < text.size()) {
        long long count = 0;
        std::size_t digits = 0;
        while (i < text.size() && std::isdigit(static_cast<unsigned char>(text[i]))) {
            count = count * 10 + (text[i] - '0');
            if (count > 1000000) return false;
            ++i;
            ++digits;
        }
        if (digits == 0 || count == 0) return false;
        if (i >= text.size() || !std::isalpha(static_cast<unsigned char>(text[i]))) return false;
        out.append(static_cast<std::size_t>(count), text[i]);
        ++i;
    }
    return !text.empty();
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream iss(line);
        std::string command, text;
        iss >> command >> text;
        if (command == "encode") {
            std::cout << encode(text) << '\n';
        } else if (command == "decode") {
            std::string result;
            std::cout << (decode(text, result) ? result : "invalid") << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "encode: with i at the start of a run, advance j while text[j] == text[i]; the run length is j - i; then set i = j.",
            "decode: count digits as you accumulate them — zero digits, a zero count, or reaching the end before a letter all mean invalid.",
            "out.append(count, ch) appends count copies of one character; std::to_string(j - i) turns a size_t into its digits.",
          ],
          cases: [
            { stdin: "encode aaabcc\ndecode 3a1b2c\ndecode 3\n", expected: "3a1b2c\naaabcc\ninvalid\n" },
            { stdin: "encode z\ndecode 12x\n", expected: "1z\nxxxxxxxxxxxx\n" },
            { stdin: "decode ab\ndecode 0a\ndecode 2a3\n", expected: "invalid\ninvalid\ninvalid\n", hidden: true },
            { stdin: "encode aabbaa\ndecode 2a2b2a\n", expected: "2a2b2a\naabbaa\n", hidden: true },
            { stdin: "decode 10a1b\nencode abc\n", expected: "aaaaaaaaaab\n1a1b1c\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::string s(3, 'x');\ns += std::to_string(7);\nstd::cout << s;\n```",
          options: ["`xxx7`", "`3x7`", "`xxx` followed by the character with code 7", "It does not compile"],
          answer: 0,
          explanation: "`(3, 'x')` is the count-and-character constructor, and `std::to_string(7)` is the text `\"7\"`, appended as characters. `s += 7` (no `to_string`) would append the control character with code 7.",
        },
        {
          prompt: "`if (\"abc\" < \"abd\")` compiles with a warning. What does it compare?",
          options: ["The two strings' contents, lexicographically", "The addresses of the two literals — an unspecified result", "Their lengths", "It always evaluates to `true`"],
          answer: 1,
          explanation: "Both operands are `const char*`, and `<` on pointers compares addresses. Wrap one side in `std::string` (or `std::string_view`) to compare characters.",
        },
        {
          prompt: "What is `std::string::npos`?",
          options: ["`-1` as an `int`", "The largest possible `std::size_t`, returned when a search finds nothing", "`0`", "The size of the string"],
          answer: 1,
          explanation: "`npos` is `static_cast<std::size_t>(-1)` — the maximum unsigned value. Because it is unsigned, `find(...) >= 0` is always true and the only valid test is `!= std::string::npos`.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::string s = \"a.b.c\";\nstd::cout << s.substr(s.rfind('.') + 1);\n```",
          options: ["`c`", "`b.c`", "`.c`", "`a`"],
          answer: 0,
          explanation: "`rfind('.')` finds the last dot at index 3; `substr(4)` returns everything after it. `find` would give `b.c`.",
        },
        {
          prompt: "A counting loop restarts its search at `pos + needle.size()` after each match. How many matches of `\"aa\"` does it count in `\"aaaa\"`?",
          options: ["2", "3", "4", "1"],
          answer: 0,
          explanation: "Matches at 0 and 2 — non-overlapping. Restarting at `pos + 1` would also count the match at 1, giving 3.",
        },
        {
          prompt: "What is `static_cast<char>('a' + 2)`?",
          options: ["`'c'`", "`'a2'`", "`99` printed as a number", "Undefined behaviour"],
          answer: 0,
          explanation: "`'a' + 2` is the `int` 99; casting back to `char` gives the character with code 99, `'c'`. Without the cast, streaming the `int` prints `99`.",
        },
        {
          prompt: "After `auto [ptr, ec] = std::from_chars(first, last, value);`, which condition means \"the whole token was a valid number\"?",
          options: ["`ec == std::errc()`", "`ptr != first`", "`ec == std::errc() && ptr == last`", "`value != 0`"],
          answer: 2,
          explanation: "`ec == std::errc()` says a number was parsed; `ptr == last` says nothing was left over. `\"12abc\"` satisfies the first but not the second.",
        },
        {
          prompt: "What does `std::stoi(\"\")` do?",
          options: ["Returns 0", "Throws `std::invalid_argument`", "Throws `std::out_of_range`", "Undefined behaviour"],
          answer: 1,
          explanation: "No digits could be parsed, which is `std::invalid_argument`. `std::out_of_range` is for digits whose value does not fit. Uncaught, either ends the program with a runtime error.",
        },
        {
          prompt: "`std::istringstream iss(\"a,,b\"); while (std::getline(iss, f, ',')) ...` — what fields are produced?",
          options: ["`a`, `b`", "`a`, `` (empty), `b`", "`a,`, `,b`", "One field, `a,,b`"],
          answer: 1,
          explanation: "A delimiter immediately followed by another yields an empty field between them. Only a *trailing* delimiter loses its empty field with `getline`.",
        },
        {
          prompt: "`iss >> n` fails because the next token is `\"x\"`. Which statement is true?",
          options: ["`n` keeps its old value and the stream is unaffected", "`n` becomes 0, the fail bit is set, and every later `>>` on `iss` fails until `iss.clear()`", "An exception is thrown", "The token `x` is skipped and the next one is read"],
          answer: 1,
          explanation: "A failed extraction zeroes the target (since C++11) and puts the stream in a failed state that persists. Testing the read — `if (!(iss >> n))` — is how a bad token is detected.",
        },
        {
          prompt: "Which manipulator applies to the **next insertion only**?",
          options: ["`std::setprecision`", "`std::fixed`", "`std::setw`", "`std::setfill`"],
          answer: 2,
          explanation: "Width is reset to 0 after every insertion; precision, floating mode, fill and alignment all persist until changed.",
        },
        {
          prompt: "What does `std::format(\"{:>8.3f}\", 3.14159)` return?",
          options: ["`   3.142`", "`3.142   `", "`3.14159 `", "`   3.141`"],
          answer: 0,
          explanation: "`.3f` rounds to three decimals (`3.142`), and `>8` right-aligns it in a field of eight characters with three leading spaces.",
        },
        {
          prompt: "Which is the rule that keeps a `std::string_view` safe?",
          options: ["Always convert it to a `std::string` before use", "It must not outlive the string it views, and that string must not be modified while the view is in use", "Only views of literals are allowed", "It must be passed by `const&`"],
          answer: 1,
          explanation: "A view is a pointer and a length into someone else's characters. Views of temporaries, of locals returned from a function, or of a container that then reallocates all dangle — undefined behaviour that often appears to work.",
        },
        {
          prompt: "`void f(const std::string& s);` is called as `f(\"a fairly long literal string\")`. What happens at the call?",
          options: ["Nothing is copied; the reference binds to the literal", "A temporary `std::string` is constructed from the literal, allocating on the heap because it exceeds the small-string buffer", "A compile error — a literal cannot bind to a reference", "The literal is converted to a `std::string_view`"],
          answer: 1,
          explanation: "A `const std::string&` can only bind to a `std::string`, so the compiler materialises one from the literal — an allocation for anything past 15 characters. Taking `std::string_view` by value avoids it.",
        },
      ],
    },
  ],
});

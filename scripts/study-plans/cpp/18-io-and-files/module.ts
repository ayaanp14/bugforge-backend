import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "io-and-files",
  title: "Streams and files",
  blurb: "The stream state model and recovering from bad input, the reading-pattern catalogue with validation, file streams and open modes, string streams with std::quoted and std::format, binary records and std::filesystem.",
  icon: "disk",
  overview: `Every program in this track reads standard input and writes standard output, and most of the failed submissions are not logic errors but reading errors: a count followed by a \`getline\` that returns an empty line, a loop on \`eof()\` that runs once too often, a bad token that silently sticks the stream so every later read is a no-op. C++ streams are precise about all of this — four state bits, a buffer, a character-level API — and a programmer who knows the model can read any input format, recover from malformed data and say exactly which line was wrong. The same model then extends, unchanged, to files and to strings in memory, because \`std::ifstream\` and \`std::istringstream\` are the same formatter over a different buffer.

The five lessons go from the console outward. Streams in depth opens the stream: \`good\`/\`fail\`/\`eof\`/\`bad\`, what a failed \`>>\` leaves in the variable and in the buffer, \`clear()\` and \`ignore()\`, and \`peek()\`/\`get()\` for a tokeniser that sees every character. Reading structured input is the catalogue — N then N tokens, N then N lines, tokens until EOF, a matrix with its dimensions checked, records with a variable field count — each with a template and its validation. File streams covers \`std::ofstream\`/\`ifstream\`/\`fstream\`, the open modes that truncate or append, RAII closing and why the writer must finish before the reader opens. String streams and formatting adds reuse without the state bug, \`std::quoted\` for text with spaces, and C++20 \`std::format\`/\`format_to\` for reports and tables. Binary I/O and the filesystem finishes with \`write\`/\`read\` of fixed-width records, padding and endianness, and \`std::filesystem\` for paths, sizes, directories and sorted listings.

The exercises are whole programs against the study judge, which lets a program create, write and read files in its working directory: a recovery loop that skips bad tokens and reports them, a \`peek\`/\`ignore\` tokeniser, the N-lines reader and a matrix reader that validates every row, a text file written and read back with counts, a ledger appended across two opens, an \`ostringstream\` report inspected before printing, a \`std::quoted\` round trip, a fixed-width binary record file indexed with \`seekg\`, and a directory created, listed in sorted order with sizes, and removed. The checkpoint adds a variable-field records reader, a \`std::format\` table with dynamic widths, and an inventory file written, measured, read back through a \`std::map\` and deleted.`,
  lessons: [
    {
      slug: "streams-in-depth",
      file: "01-streams-in-depth.md",
      exercises: [
        {
          title: "Skip the bad tokens",
          prompt: `Read whitespace-separated tokens from standard input until it ends. Every token is either an integer (an optional sign and digits, within \`int\`) or a word made only of letters — nothing like \`12abc\` or \`3.5\` appears. Read each token with \`std::cin >> x\` into an \`int\`. When the read fails and the stream is **not** at the end of the input, it met a word: \`clear()\` the stream state, extract the offending token into a \`std::string\`, and remember it. Test \`eof()\` before you clear, or you cannot tell the two failures apart.

**Input:** any number of tokens, on any number of lines.
**Output:** \`accepted=<count> sum=<sum of the integers>\`, then \`rejected=<count>: <the words in order, space-separated>\` — or just \`rejected=0\` when every token was a number. Keep the sum in a \`long long\`.

\`\`\`text
10 abc 20 x9 -5
\`\`\`
prints
\`\`\`text
accepted=3 sum=25
rejected=2: abc x9
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    long long sum = 0;
    int accepted = 0;
    std::vector<std::string> rejected;
    for (;;) {
        int x;
        if (std::cin >> x) {
            sum += x;
            ++accepted;
            continue;
        }
        // TODO: stop cleanly at the end of the input; otherwise recover from the bad token
        break;
    }
    std::cout << "accepted=" << accepted << " sum=" << sum << '\n';
    // TODO: print the rejected line
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

int main() {
    long long sum = 0;
    int accepted = 0;
    std::vector<std::string> rejected;
    for (;;) {
        int x;
        if (std::cin >> x) {
            sum += x;
            ++accepted;
            continue;
        }
        if (std::cin.eof()) break;          // the input is exhausted: a clean stop
        std::cin.clear();                   // a bad token: reset failbit...
        std::string junk;
        std::cin >> junk;                   // ...and consume the token that caused it
        rejected.push_back(junk);
    }
    std::cout << "accepted=" << accepted << " sum=" << sum << '\n';
    if (rejected.empty()) {
        std::cout << "rejected=0\n";
    } else {
        std::cout << "rejected=" << rejected.size() << ':';
        for (const auto& token : rejected) std::cout << ' ' << token;
        std::cout << '\n';
    }
    return 0;
}
`,
          hints: [
            "When std::cin >> x is false, ask std::cin.eof() first: true means the input ran out, false means a token could not be an int.",
            "After std::cin.clear() the bad characters are still in the buffer; std::cin >> junk into a std::string takes them.",
            "Do not test eof() after clear() — clear() resets that bit too, and the loop would spin forever on an empty stream.",
          ],
          cases: [
            { stdin: "10 abc 20 x9 -5\n", expected: "accepted=3 sum=25\nrejected=2: abc x9\n" },
            { stdin: "1 2 3\n", expected: "accepted=3 sum=6\nrejected=0\n" },
            { stdin: "abc def\n", expected: "accepted=0 sum=0\nrejected=2: abc def\n", hidden: true },
            { stdin: "\n", expected: "accepted=0 sum=0\nrejected=0\n", hidden: true },
            { stdin: "2000000000 2000000000 zz\n", expected: "accepted=2 sum=4000000000\nrejected=1: zz\n", hidden: true },
          ],
        },
        {
          title: "A peek-and-ignore tokeniser",
          prompt: `Read all of standard input one character at a time with \`std::cin.peek()\` and \`std::cin.get()\` — not with \`>>\` — and split it into tokens:

- \`NUMBER\`: a maximal run of digits;
- \`IDENT\`: a letter or \`_\` followed by any letters, digits or \`_\`;
- \`OP\`: any other non-whitespace character, one character per token;
- a \`#\` starts a comment that runs to the end of the line — skip it with \`std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n')\`;
- whitespace (spaces, newlines) is skipped and separates nothing by itself.

**Input:** any text, any number of lines.
**Output:** one line per token — \`NUMBER 42\`, \`IDENT foo\`, \`OP +\` — in input order, then \`tokens=<count>\`.

\`\`\`text
x1 = 42 + foo*(7-y) # trailing comment
\`\`\`
prints
\`\`\`text
IDENT x1
OP =
NUMBER 42
OP +
IDENT foo
OP *
OP (
NUMBER 7
OP -
IDENT y
OP )
tokens=11
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <limits>
#include <string>

int main() {
    int tokens = 0;
    int c;
    while ((c = std::cin.peek()) != EOF) {
        // TODO: whitespace -> get() and continue; '#' -> ignore to end of line;
        //       digit -> NUMBER; letter or '_' -> IDENT; anything else -> OP
        std::cin.get();
    }
    std::cout << "tokens=" << tokens << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <limits>
#include <string>

int main() {
    int tokens = 0;
    int c;
    while ((c = std::cin.peek()) != EOF) {
        if (std::isspace(c)) {
            std::cin.get();
            continue;
        }
        if (c == '#') {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            continue;
        }
        if (std::isdigit(c)) {
            std::string digits;
            while (std::isdigit(std::cin.peek())) digits += static_cast<char>(std::cin.get());
            std::cout << "NUMBER " << digits << '\n';
        } else if (std::isalpha(c) || c == '_') {
            std::string name;
            while (std::isalnum(std::cin.peek()) || std::cin.peek() == '_') name += static_cast<char>(std::cin.get());
            std::cout << "IDENT " << name << '\n';
        } else {
            std::cout << "OP " << static_cast<char>(std::cin.get()) << '\n';
        }
        ++tokens;
    }
    std::cout << "tokens=" << tokens << '\n';
    return 0;
}
`,
          hints: [
            "peek() looks without consuming, so the loop can decide what kind of token starts here before taking any characters.",
            "A NUMBER or IDENT is an inner loop: while (std::isdigit(std::cin.peek())) name += static_cast<char>(std::cin.get());",
            "peek() and get() return int; keep them in an int so EOF (-1) compares correctly, and pass them to <cctype> as they are.",
          ],
          cases: [
            { stdin: "x1 = 42 + foo*(7-y) # trailing comment\n", expected: "IDENT x1\nOP =\nNUMBER 42\nOP +\nIDENT foo\nOP *\nOP (\nNUMBER 7\nOP -\nIDENT y\nOP )\ntokens=11\n" },
            { stdin: "# only a comment\n  total_2 >= 100\n", expected: "IDENT total_2\nOP >\nOP =\nNUMBER 100\ntokens=4\n" },
            { stdin: "\n\n", expected: "tokens=0\n", hidden: true },
            { stdin: "a1b2 3c\n", expected: "IDENT a1b2\nNUMBER 3\nIDENT c\ntokens=3\n", hidden: true },
            { stdin: "_x#c\n9", expected: "IDENT _x\nNUMBER 9\ntokens=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::istringstream in(\"abc\");\nint x = 5;\nin >> x;\nstd::cout << x << ' ' << in.fail() << ' ' << in.eof();\n```",
          options: ["`5 1 0`", "`0 1 0`", "`0 1 1`", "`5 0 1`"],
          answer: 1,
          explanation: "The characters were examined and could not form an `int`, so the variable is set to `0` and `failbit` is set. Nothing tried to read past the end — `abc` is still unread in the buffer — so `eofbit` stays clear.",
        },
        {
          prompt: "`while (std::cin >> x)` keeps looping as long as…",
          options: ["`eof()` is false", "neither `failbit` nor `badbit` is set", "`good()` is true", "the last character read was not a newline"],
          answer: 1,
          explanation: "The condition uses the stream's `operator bool`, which is `!fail()` — true unless `failbit` or `badbit` is set. `eofbit` alone does not stop it, which is what lets the last token of an input with no trailing newline be processed.",
        },
        {
          prompt: "The whole input is `12` with no newline after it. After `std::cin >> x` succeeds, what is the stream's state?",
          options: ["`goodbit` only", "`eofbit` set, `failbit` clear — the read succeeded", "`failbit` set because the number was not terminated", "`eofbit` and `failbit` both set"],
          answer: 1,
          explanation: "The extraction reads `1`, `2`, then looks for a further digit and bumps into the end, which sets `eofbit`. The value `12` was read successfully, so `failbit` stays clear and `operator bool` is still true.",
        },
        {
          prompt: "A read failed on a bad token. Which sequence gets the stream reading the *next* token?",
          options: ["`std::cin.clear();` alone", "`std::cin.ignore();` alone", "`std::cin.clear();` then discard the bad characters (an `ignore` or an extraction into a string)", "`std::cin.eof();` then `std::cin.clear();`"],
          answer: 2,
          explanation: "`clear()` resets the state bits but leaves the buffer untouched, so the same characters would fail again — an infinite loop. `ignore()` alone does nothing while `failbit` is set. Reset, then consume.",
        },
        {
          prompt: "Why do `std::cin.get()` and `std::cin.peek()` return `int` rather than `char`?",
          options: ["For speed: `int` is the register width", "So that `EOF` (`-1`) can be told apart from every real character value", "Because characters are stored as `int` inside the buffer", "It is a historical accident with no practical effect"],
          answer: 1,
          explanation: "A `char` can hold every byte value, leaving no spare value for \"no character\". Returning `int` lets `-1` mean end of input while `0`–`255` are real characters — so keep the result in an `int` when comparing with `EOF`.",
        },
        {
          prompt: "What does `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');` do?",
          options: ["Discards exactly one character", "Discards the rest of the current line, including the newline", "Discards everything up to the end of the input", "Sets `failbit` if the line is longer than the maximum"],
          answer: 1,
          explanation: "`ignore(n, delim)` discards up to `n` characters or through the first `delim`. With the maximum as `n`, the delimiter is what stops it: the remainder of the line goes, newline included. `ignore()` with no arguments is the one-character form.",
        },
        {
          prompt: "Which standard stream flushes after every write, so its text appears immediately?",
          options: ["`std::cout`", "`std::cerr`", "`std::clog`", "All three"],
          answer: 1,
          explanation: "`std::cerr` is unit-buffered: every insertion is flushed. `std::cout` and `std::clog` are buffered and flush when the buffer fills, on `std::flush`/`std::endl`, when the tied `std::cin` reads, or at exit.",
        },
      ],
    },
    {
      slug: "reading-structured-input",
      file: "02-reading-structured-input.md",
      exercises: [
        {
          title: "N lines with spaces",
          prompt: `Read an integer \`n\`, then \`n\` lines of text. A line may be empty and may have any amount of whitespace between and around its words. For line \`i\` (1-based) print \`<i>: words=<w> longest=<word>\` — \`w\` is the number of whitespace-separated words and \`longest\` the first word of maximal length — or \`<i>: empty\` when the line has no words. After the lines print \`total=<sum of all word counts>\`.

Read \`n\` with \`std::cin >>\`, discard the rest of that line with \`std::cin.ignore(...)\`, then \`std::getline\` each line and split it with a \`std::istringstream\`. Strip a trailing \`\\r\` if one is present.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines, then the total.

\`\`\`text
3
the quick brown fox

  spaced   out
\`\`\`
prints
\`\`\`text
1: words=4 longest=quick
2: empty
3: words=2 longest=spaced
total=6
\`\`\``,
          starter: String.raw`#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    // TODO: finish the count's line before the first getline
    long long total = 0;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        // TODO: split the line, count words, keep the first longest one, print the line's report
    }
    std::cout << "total=" << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    long long total = 0;
    for (int i = 1; i <= n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        if (!line.empty() && line.back() == '\r') line.pop_back();
        std::istringstream words(line);
        std::string word;
        std::string longest;
        int count = 0;
        while (words >> word) {
            ++count;
            if (word.size() > longest.size()) longest = word;   // strict >: the first of equals wins
        }
        if (count == 0) std::cout << i << ": empty\n";
        else std::cout << i << ": words=" << count << " longest=" << longest << '\n';
        total += count;
    }
    std::cout << "total=" << total << '\n';
    return 0;
}
`,
          hints: [
            "std::cin >> n leaves the newline behind; without an ignore the first getline returns an empty line and every report is shifted.",
            "std::istringstream words(line); while (words >> word) counts words regardless of how much whitespace separates them.",
            "Compare with a strict > so a later word of equal length does not replace the first.",
          ],
          cases: [
            { stdin: "3\nthe quick brown fox\n\n  spaced   out  \n", expected: "1: words=4 longest=quick\n2: empty\n3: words=2 longest=spaced\ntotal=6\n" },
            { stdin: "1\nhello\n", expected: "1: words=1 longest=hello\ntotal=1\n" },
            { stdin: "0\n", expected: "total=0\n", hidden: true },
            { stdin: "2\na bb ccc\ndddd ee\n", expected: "1: words=3 longest=ccc\n2: words=2 longest=dddd\ntotal=5\n", hidden: true },
            { stdin: "1\nabc def\n", expected: "1: words=2 longest=abc\ntotal=2\n", hidden: true },
          ],
        },
        {
          title: "Matrix with dimension validation",
          prompt: `Read \`R C\` on the first line, then the matrix with one row per line. Read the rows **line by line** (\`std::getline\` then a \`std::istringstream\`) so the shape can be checked:

- if the input ends before \`R\` rows were read, print \`error: expected <R> rows, got <k>\` and stop;
- if a row does not contain exactly \`C\` integers, print \`error: row <i> has <k> values, expected <C>\` (1-based \`i\`, the first offending row) and stop;
- otherwise print \`row <i>: <sum>\` for each row, then \`cols: <c1> <c2> ... <cC>\` with the column sums.

Use \`long long\` for the values and sums.

**Input:** \`R C\`, then up to \`R\` lines.
**Output:** the report or the first error.

\`\`\`text
2 3
1 2 3
4 5 6
\`\`\`
prints
\`\`\`text
row 1: 6
row 2: 15
cols: 5 7 9
\`\`\`
and
\`\`\`text
2 3
1 2 3
4 5
\`\`\`
prints \`error: row 2 has 2 values, expected 3\`.`,
          starter: String.raw`#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

int main() {
    int rows, cols;
    std::cin >> rows >> cols;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::vector<std::vector<long long>> m;
    for (int r = 0; r < rows; ++r) {
        std::string line;
        // TODO: getline (report a missing row), parse the values, check the count, keep the row
    }
    // TODO: row sums, then the column sums
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

int main() {
    int rows, cols;
    std::cin >> rows >> cols;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::vector<std::vector<long long>> m;
    for (int r = 0; r < rows; ++r) {
        std::string line;
        if (!std::getline(std::cin, line)) {
            std::cout << "error: expected " << rows << " rows, got " << r << '\n';
            return 0;
        }
        std::istringstream in(line);
        std::vector<long long> row;
        long long v;
        while (in >> v) row.push_back(v);
        if (static_cast<int>(row.size()) != cols) {
            std::cout << "error: row " << r + 1 << " has " << row.size() << " values, expected " << cols << '\n';
            return 0;
        }
        m.push_back(std::move(row));
    }
    std::vector<long long> colSums(cols, 0);
    for (int r = 0; r < rows; ++r) {
        long long sum = 0;
        for (int c = 0; c < cols; ++c) {
            sum += m[r][c];
            colSums[c] += m[r][c];
        }
        std::cout << "row " << r + 1 << ": " << sum << '\n';
    }
    std::cout << "cols:";
    for (long long s : colSums) std::cout << ' ' << s;
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "A failed std::getline before r reaches rows is the missing-rows error; r is how many rows arrived.",
            "Read every value on the line with while (in >> v) row.push_back(v); then compare row.size() with cols.",
            "Print errors and return at once; the sums are only computed when every row passed.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "row 1: 6\nrow 2: 15\ncols: 5 7 9\n" },
            { stdin: "2 3\n1 2 3\n4 5\n", expected: "error: row 2 has 2 values, expected 3\n" },
            { stdin: "3 2\n1 1\n2 2\n", expected: "error: expected 3 rows, got 2\n", hidden: true },
            { stdin: "1 1\n-7\n", expected: "row 1: -7\ncols: -7\n", hidden: true },
            { stdin: "2 2\n1 2 3\n4 5\n", expected: "error: row 1 has 3 values, expected 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The input is `2⏎Ada Lovelace⏎…`. The program runs `int n; std::cin >> n; std::string s; std::getline(std::cin, s);`. What is `s`?",
          options: ["`\"Ada Lovelace\"`", "`\"2\"`", "`\"\"` — the empty remainder of the first line", "`\"Ada\"`"],
          answer: 2,
          explanation: "`>>` stops at the newline after `2` and leaves it in the buffer. `getline` reads up to that newline — nothing — and consumes it. An `ignore` to the end of the line between the two reads fixes it.",
        },
        {
          prompt: "Why parse each record line in its own `std::istringstream` instead of reading the fields straight from `std::cin`?",
          options: ["`std::istringstream` is faster than `std::cin`", "A malformed line only fails its own stream; `std::cin` is untouched and the loop moves to the next line", "`std::cin` cannot read more than one value per line", "It avoids the leftover-newline problem entirely"],
          answer: 1,
          explanation: "A bad field read directly from `std::cin` sets its `failbit` and every later record is lost. Reading the whole line first makes the failure local. Speed is not the reason, and the newline issue is separate (an `ignore` after a `>>` count).",
        },
        {
          prompt: "A matrix is declared `3 3` but one row has four numbers. Which reader notices?",
          options: ["The token-wise reader: `for r, for c: std::cin >> m[r][c]`", "The line-wise reader that parses each row from its own `std::istringstream` and compares the count with `C`", "Both — `>>` sets `failbit` on the extra value", "Neither; the extra value is silently dropped"],
          answer: 1,
          explanation: "Token-wise reading takes nine tokens wherever they are, so the extra value shifts into the next row with no error. Only a reader that sees the row as a line can count what was on it.",
        },
        {
          prompt: "A file saved on Windows is read on Linux with `std::getline`. The last field of every line compares unequal to `\"done\"` although it looks identical. Why?",
          options: ["Linux `getline` uses a different delimiter", "Each line ends in `\\r\\n`; `getline` stops at `\\n` and leaves the `\\r` on the field", "The file is UTF-16", "`std::string` comparison is locale-sensitive"],
          answer: 1,
          explanation: "Windows line endings are `\\r\\n`. `getline` consumes the `\\n` only, so `\"done\\r\"` is what the string holds. Strip a trailing `\\r` after every `getline` when input may come from another platform.",
        },
        {
          prompt: "In `std::getline(fields >> std::ws, name)`, what does `std::ws` do?",
          options: ["Reads one whitespace-separated word into `name`", "Skips whitespace so the line read starts at the first non-space character", "Writes a space into the stream", "Marks the end of the previous token"],
          answer: 1,
          explanation: "`>> std::ws` consumes leading whitespace and nothing else. It is what removes the separator that `>>` stopped on before `getline` takes the rest of the line — for a last field that may contain spaces.",
        },
        {
          prompt: "What is wrong with `int n; std::cin >> n; std::vector<int> v(n);` when the input is empty?",
          options: ["Nothing: `n` becomes 0 and the vector is empty", "The read fails at the end of the input before any conversion runs, so `n` keeps its uninitialised value — the vector's size is garbage", "`std::cin` throws `std::ios_base::failure`", "The vector's constructor throws `std::length_error`"],
          answer: 1,
          explanation: "When the stream is already at the end, the extraction fails before the numeric conversion, and only the conversion sets the variable to 0. Test the read (`if (!(std::cin >> n))`) before using `n` as a size.",
        },
      ],
    },
    {
      slug: "file-streams",
      file: "03-file-streams.md",
      exercises: [
        {
          title: "Write it down, read it back",
          prompt: `Read every line of standard input until it ends and write each one, followed by a newline, to a file named \`notes.txt\` through a \`std::ofstream\`. Just before that stream closes, print \`written=<bytes>\` using \`tellp()\`. Then open \`notes.txt\` with a \`std::ifstream\` — the writer must be closed or out of scope first — and read it line by line with \`std::getline\`, counting lines, whitespace-separated words, and characters (the sum of the line lengths, newlines excluded), and tracking the longest line. Print \`lines=<l> words=<w> chars=<c> longest=<length>\`. Delete the file at the end (\`std::remove\` from \`<cstdio>\` or \`std::filesystem::remove\`).

**Input:** any number of lines.
**Output:** two lines.

\`\`\`text
the quick brown
fox
\`\`\`
prints
\`\`\`text
written=20
lines=2 words=4 chars=18 longest=15
\`\`\``,
          starter: String.raw`#include <cstdio>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    const char* const path = "notes.txt";
    {
        std::ofstream out(path);
        // TODO: copy every input line into the file, then print written=<tellp>
    }
    std::ifstream in(path);
    long long lines = 0, words = 0, chars = 0, longest = 0;
    // TODO: read the file back line by line and count
    in.close();
    std::remove(path);
    std::cout << "lines=" << lines << " words=" << words << " chars=" << chars << " longest=" << longest << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cstdio>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    const char* const path = "notes.txt";
    {
        std::ofstream out(path);
        std::string line;
        while (std::getline(std::cin, line)) out << line << '\n';
        std::cout << "written=" << out.tellp() << '\n';
    }                                                   // out is flushed and closed here
    std::ifstream in(path);
    long long lines = 0, words = 0, chars = 0, longest = 0;
    std::string line;
    while (std::getline(in, line)) {
        ++lines;
        const long long length = static_cast<long long>(line.size());
        chars += length;
        if (length > longest) longest = length;
        std::istringstream fields(line);
        std::string word;
        while (fields >> word) ++words;
    }
    in.close();
    std::remove(path);
    std::cout << "lines=" << lines << " words=" << words << " chars=" << chars << " longest=" << longest << '\n';
    return 0;
}
`,
          hints: [
            "while (std::getline(std::cin, line)) out << line << '\\n'; copies the input; tellp() on the ofstream is the byte count so far.",
            "Keep the ofstream inside its own block so its destructor flushes and closes before the ifstream opens the same file.",
            "Count words per line with a std::istringstream and while (fields >> word) ++words;",
          ],
          cases: [
            { stdin: "the quick brown\nfox\n", expected: "written=20\nlines=2 words=4 chars=18 longest=15\n" },
            { stdin: "one\n\ntwo  three\n", expected: "written=16\nlines=3 words=3 chars=13 longest=10\n" },
            { stdin: "\n", expected: "written=1\nlines=1 words=0 chars=0 longest=0\n", hidden: true },
            { stdin: "a\n", expected: "written=2\nlines=1 words=1 chars=1 longest=1\n", hidden: true },
            { stdin: "  padded line  \nx y z\n", expected: "written=22\nlines=2 words=5 chars=20 longest=15\n", hidden: true },
          ],
        },
        {
          title: "A ledger appended across two opens",
          prompt: `The input holds two sessions of ledger entries. First an integer \`n\` and \`n\` lines, then an integer \`m\` and \`m\` lines; each entry line is \`<label> <amount>\` with an integer amount that may be negative. Write the first session's lines to \`ledger.txt\` with a fresh \`std::ofstream\` (the default mode, which truncates) and close it. Then open \`ledger.txt\` **a second time** with \`std::ios::app\` and write the second session's lines after the first. Finally read the whole file back and print every line as \`<i>: <line>\` with a 1-based number, then \`entries=<count>\` and \`balance=<sum of the amounts>\` (a \`long long\`). Delete the file at the end.

Use \`std::getline\` for the entry lines (remember the \`ignore\` after each count) and write each line back exactly as read.

**Input:** \`n\`, \`n\` lines, \`m\`, \`m\` lines.
**Output:** the numbered lines, then two summary lines.

\`\`\`text
2
opening 100
coffee -3
1
salary 250
\`\`\`
prints
\`\`\`text
1: opening 100
2: coffee -3
3: salary 250
entries=3
balance=347
\`\`\``,
          starter: String.raw`#include <filesystem>
#include <fstream>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
    const char* const path = "ledger.txt";
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    {
        std::ofstream out(path);
        // TODO: write the first n lines
    }
    int m;
    std::cin >> m;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    {
        // TODO: open again in append mode and write the next m lines
    }
    // TODO: read the file back, print the numbered lines, sum the amounts
    std::filesystem::remove(path);
    return 0;
}
`,
          solution: String.raw`#include <filesystem>
#include <fstream>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
    const char* const path = "ledger.txt";
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    {
        std::ofstream out(path);                        // truncates: a fresh ledger
        for (int i = 0; i < n; ++i) {
            std::string line;
            std::getline(std::cin, line);
            out << line << '\n';
        }
    }
    int m;
    std::cin >> m;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    {
        std::ofstream out(path, std::ios::app);         // continues after session one
        for (int i = 0; i < m; ++i) {
            std::string line;
            std::getline(std::cin, line);
            out << line << '\n';
        }
    }
    std::ifstream in(path);
    std::string line;
    int entries = 0;
    long long balance = 0;
    while (std::getline(in, line)) {
        ++entries;
        std::cout << entries << ": " << line << '\n';
        std::istringstream fields(line);
        std::string label;
        long long amount = 0;
        if (fields >> label >> amount) balance += amount;
    }
    in.close();
    std::filesystem::remove(path);
    std::cout << "entries=" << entries << '\n';
    std::cout << "balance=" << balance << '\n';
    return 0;
}
`,
          hints: [
            "std::ofstream out(path, std::ios::app); every write goes to the end of what is already there.",
            "Each ofstream lives in its own block so it is closed before the next open; the ifstream then sees both sessions.",
            "Parse each line read back with a std::istringstream to pull the amount out after the label.",
          ],
          cases: [
            { stdin: "2\nopening 100\ncoffee -3\n1\nsalary 250\n", expected: "1: opening 100\n2: coffee -3\n3: salary 250\nentries=3\nbalance=347\n" },
            { stdin: "1\nrent -800\n0\n", expected: "1: rent -800\nentries=1\nbalance=-800\n" },
            { stdin: "0\n2\na 5\nb 7\n", expected: "1: a 5\n2: b 7\nentries=2\nbalance=12\n", hidden: true },
            { stdin: "0\n0\n", expected: "entries=0\nbalance=0\n", hidden: true },
            { stdin: "3\nx 2000000000\ny 2000000000\nz 1\n1\nw -1\n", expected: "1: x 2000000000\n2: y 2000000000\n3: z 1\n4: w -1\nentries=4\nbalance=4000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`data.txt` already holds ten lines. What does `std::ofstream out(\"data.txt\");` do to it?",
          options: ["Nothing until the first write", "Truncates it to empty immediately — `out` alone implies `trunc`", "Opens it positioned at the end, ready to append", "Fails, because the file exists"],
          answer: 1,
          explanation: "The default mode for `std::ofstream` is `std::ios::out`, which discards existing contents on open. To add to the file, pass `std::ios::app`.",
        },
        {
          prompt: "`std::ifstream in(\"missing.txt\"); int x; in >> x;` — the file does not exist. What happens?",
          options: ["The constructor throws `std::ios_base::failure`", "The open sets `failbit`; `in` converts to `false` and the read silently does nothing", "`x` is set to `-1`", "The program aborts with a runtime error"],
          answer: 1,
          explanation: "File streams never throw unless `exceptions()` was called. A failed open leaves the stream in a failed state, so every read is a no-op — which is why a program must check `if (!in)` after opening, or it computes results from nothing.",
        },
        {
          prompt: "Which statement about closing a file stream is correct?",
          options: ["You must call `close()` or the file is leaked", "The destructor flushes and closes the file, so leaving the scope is enough — `close()` is for reopening the same object or checking the flush", "`close()` is needed only for `std::ofstream`", "Files close automatically only when the program exits"],
          answer: 1,
          explanation: "A file stream is an RAII object: its destructor releases the handle after flushing, on every path out of the scope. Explicit `close()` exists for when you want to reopen the object or inspect the state after the final flush.",
        },
        {
          prompt: "```cpp\nstd::ofstream out(\"f.txt\");\nout << \"one\\ntwo\\n\";\nstd::ifstream in(\"f.txt\");\nstd::string line; int n = 0;\nwhile (std::getline(in, line)) ++n;\n```\nWhat is `n` most likely to be, and why?",
          options: ["2 — the writes are visible at once", "0 — `out` has not been flushed, so the file is still empty when `in` reads it", "1 — only the first line is flushed", "A compile error: two streams cannot open one file"],
          answer: 1,
          explanation: "The text sits in `out`'s buffer until it is flushed or the stream is destroyed. Scope the writer in its own block (or call `close()`) before opening the reader.",
        },
        {
          prompt: "`std::fstream io(\"cache.txt\", std::ios::in | std::ios::out);` when `cache.txt` does not exist:",
          options: ["Creates it empty and opens it for both directions", "Fails to open — `in | out` requires an existing file; add `trunc` or create it first", "Opens for reading only", "Throws `std::filesystem::filesystem_error`"],
          answer: 1,
          explanation: "Without `trunc` (or `app`), the combined mode opens an existing file without discarding it and does not create one. `std::ofstream` alone would create the file.",
        },
        {
          prompt: "What is the difference between `std::ios::app` and `std::ios::ate`?",
          options: ["None — they are synonyms", "`app` sends every write to the end regardless of seeks; `ate` only starts at the end and later seeks may write elsewhere", "`ate` truncates the file; `app` does not", "`app` is for text files, `ate` for binary"],
          answer: 1,
          explanation: "Append mode forces every write to the end. At-end mode positions the stream at the end once, at open, and then behaves like a normal stream, so a `seekp` can move it back.",
        },
      ],
    },
    {
      slug: "string-streams-and-formatting",
      file: "04-string-streams-and-formatting.md",
      exercises: [
        {
          title: "Report builder",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`<item> <qty> <price>\` (a one-word item, an integer quantity, a decimal price). Build the whole report in a \`std::ostringstream\` and print it once at the end:

- a header: \`ITEM\` left-aligned in a field of 10, \`QTY\` right-aligned in 5, \`TOTAL\` right-aligned in 10;
- one row per item with the same widths, the total (\`qty × price\`) with \`std::fixed\` and two decimals;
- a rule of 25 \`-\` characters;
- a \`TOTAL\` line: \`TOTAL\` left in 10, an empty field of 5, then the grand total right in 10 with two decimals.

Before printing the report, print \`lines=<k>\` where \`k\` is the number of newline characters in \`report.str()\` — the reason to build in memory is that you can inspect the text before it goes out.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`lines=<k>\`, then the report.

\`\`\`text
2
pen 3 1.50
notebook 2 4.25
\`\`\`
prints
\`\`\`text
lines=5
ITEM        QTY     TOTAL
pen           3      4.50
notebook      2      8.50
-------------------------
TOTAL               13.00
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::ostringstream report;
    report << std::fixed << std::setprecision(2);
    // TODO: header, one row per item, the rule, the TOTAL line
    double grand = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int qty;
        double price;
        std::cin >> item >> qty >> price;
        grand += qty * price;
    }
    const std::string text = report.str();
    // TODO: print lines=<newline count>, then the text
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    int n;
    std::cin >> n;
    std::ostringstream report;
    report << std::fixed << std::setprecision(2);
    report << std::left << std::setw(10) << "ITEM" << std::right << std::setw(5) << "QTY" << std::setw(10) << "TOTAL" << '\n';
    double grand = 0.0;
    for (int i = 0; i < n; ++i) {
        std::string item;
        int qty;
        double price;
        std::cin >> item >> qty >> price;
        const double total = qty * price;
        grand += total;
        report << std::left << std::setw(10) << item << std::right << std::setw(5) << qty << std::setw(10) << total << '\n';
    }
    report << std::string(25, '-') << '\n';
    report << std::left << std::setw(10) << "TOTAL" << std::right << std::setw(5) << "" << std::setw(10) << grand << '\n';
    const std::string text = report.str();
    std::cout << "lines=" << std::count(text.begin(), text.end(), '\n') << '\n';
    std::cout << text;
    return 0;
}
`,
          hints: [
            "std::fixed and std::setprecision are sticky on the ostringstream, so set them once; std::setw applies to the next field only.",
            "std::left and std::right are sticky too: switch to left before the item and back to right before the numbers.",
            "std::count(text.begin(), text.end(), '\\n') on report.str() gives the line count before anything is printed.",
          ],
          cases: [
            { stdin: "2\npen 3 1.50\nnotebook 2 4.25\n", expected: "lines=5\nITEM        QTY     TOTAL\npen           3      4.50\nnotebook      2      8.50\n-------------------------\nTOTAL               13.00\n" },
            { stdin: "1\nwidget 10 0.10\n", expected: "lines=4\nITEM        QTY     TOTAL\nwidget       10      1.00\n-------------------------\nTOTAL                1.00\n" },
            { stdin: "0\n", expected: "lines=3\nITEM        QTY     TOTAL\n-------------------------\nTOTAL                0.00\n", hidden: true },
            { stdin: "3\na 1 1.00\nbb 2 2.00\nccc 3 3.00\n", expected: "lines=6\nITEM        QTY     TOTAL\na             1      1.00\nbb            2      4.00\nccc           3      9.00\n-------------------------\nTOTAL               14.00\n", hidden: true },
            { stdin: "1\nabcdefghij 1 2.50\n", expected: "lines=4\nITEM        QTY     TOTAL\nabcdefghij    1      2.50\n-------------------------\nTOTAL                2.50\n", hidden: true },
          ],
        },
        {
          title: "std::quoted round trip",
          prompt: `Read an integer \`n\`, then \`n\` lines, each a record \`"<name>" "<city>" <age>\`. The two strings are double-quoted, may contain spaces, and may contain a \`"\` escaped as \`\\"\` or a backslash escaped as \`\\\\\`. Parse each line with a \`std::istringstream\` and \`std::quoted\` (\`<iomanip>\`); do not parse the quotes by hand.

For each record print two lines: \`<name> | <city> | <age>\` with the raw, unquoted values, and \`  -> \` followed by the record re-serialised with \`std::quoted\` (name, city, age separated by single spaces). Then print \`oldest=<name of the highest age, the first on ties>\` (\`oldest=none\` when \`n\` is 0). Finally take everything you serialised, parse it back with \`std::quoted\` and print \`roundtrip=ok\` if every field came back equal to the original, otherwise \`roundtrip=mismatch\`.

**Input:** \`n\`, then \`n\` records.
**Output:** \`2n + 2\` lines.

\`\`\`text
1
"Bob \\"the builder\\" Smith" "Rio" 51
\`\`\`
prints
\`\`\`text
Bob "the builder" Smith | Rio | 51
  -> "Bob \\"the builder\\" Smith" "Rio" 51
oldest=Bob "the builder" Smith
roundtrip=ok
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

struct Person {
    std::string name;
    std::string city;
    int age = 0;
};

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::vector<Person> people;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        // TODO: parse with std::quoted into a Person and store it
    }
    // TODO: print each record raw and re-serialised, then oldest=, then the round-trip check
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

struct Person {
    std::string name;
    std::string city;
    int age = 0;
};

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::vector<Person> people;
    for (int i = 0; i < n; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        Person p;
        in >> std::quoted(p.name) >> std::quoted(p.city) >> p.age;
        people.push_back(p);
    }
    std::ostringstream serialised;
    for (const auto& p : people) {
        std::cout << p.name << " | " << p.city << " | " << p.age << '\n';
        std::ostringstream one;
        one << std::quoted(p.name) << ' ' << std::quoted(p.city) << ' ' << p.age;
        std::cout << "  -> " << one.str() << '\n';
        serialised << one.str() << '\n';
    }
    int oldest = -1;
    for (int i = 0; i < static_cast<int>(people.size()); ++i) {
        if (oldest < 0 || people[i].age > people[oldest].age) oldest = i;
    }
    std::cout << "oldest=" << (oldest < 0 ? std::string("none") : people[oldest].name) << '\n';
    std::istringstream back(serialised.str());
    bool ok = true;
    for (const auto& p : people) {
        Person q;
        if (!(back >> std::quoted(q.name) >> std::quoted(q.city) >> q.age)) { ok = false; break; }
        if (q.name != p.name || q.city != p.city || q.age != p.age) ok = false;
    }
    std::cout << (ok ? "roundtrip=ok" : "roundtrip=mismatch") << '\n';
    return 0;
}
`,
          hints: [
            "in >> std::quoted(p.name) reads a double-quoted string as one token, spaces included, and undoes the escapes.",
            "one << std::quoted(p.name) writes the quotes back and escapes any embedded quote or backslash — the same manipulator both ways.",
            "Collect the serialised lines in a second ostringstream, then read them back through an istringstream over its str().",
          ],
          cases: [
            { stdin: "2\n\"Ada Lovelace\" \"London\" 36\n\"Bob\" \"New York\" 40\n", expected: "Ada Lovelace | London | 36\n  -> \"Ada Lovelace\" \"London\" 36\nBob | New York | 40\n  -> \"Bob\" \"New York\" 40\noldest=Bob\nroundtrip=ok\n" },
            { stdin: "1\n\"Bob \\\"the builder\\\" Smith\" \"Rio\" 51\n", expected: "Bob \"the builder\" Smith | Rio | 51\n  -> \"Bob \\\"the builder\\\" Smith\" \"Rio\" 51\noldest=Bob \"the builder\" Smith\nroundtrip=ok\n" },
            { stdin: "1\n\"C:\\\\temp\" \"Disk\" 7\n", expected: "C:\\temp | Disk | 7\n  -> \"C:\\\\temp\" \"Disk\" 7\noldest=C:\\temp\nroundtrip=ok\n", hidden: true },
            { stdin: "3\n\"A\" \"X\" 5\n\"B\" \"Y\" 9\n\"C\" \"Z\" 9\n", expected: "A | X | 5\n  -> \"A\" \"X\" 5\nB | Y | 9\n  -> \"B\" \"Y\" 9\nC | Z | 9\n  -> \"C\" \"Z\" 9\noldest=B\nroundtrip=ok\n", hidden: true },
            { stdin: "0\n", expected: "oldest=none\nroundtrip=ok\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstd::istringstream in(\"10\");\nint v = 0;\nin >> v;\nin >> v;          // fails\nin.str(\"20\");\nin >> v;\nstd::cout << v << ' ' << in.fail();\n```",
          options: ["`20 0`", "`10 1`", "`0 1`", "`20 1`"],
          answer: 1,
          explanation: "The second read failed and set `failbit`; `str(\"20\")` replaces the buffer but not the state, so the third read is a no-op and `v` stays `10`. `in.clear()` before `str(...)` is the fix.",
        },
        {
          prompt: "`std::cout << std::quoted(\"say \\\"hi\\\"\");` prints…",
          options: ["`say \"hi\"`", "`\"say \\\"hi\\\"\"`", "`\"say \"hi\"\"`", "`'say \"hi\"'`"],
          answer: 1,
          explanation: "`std::quoted` wraps the string in double quotes and escapes every embedded `\"` (and `\\`) with a backslash, so that `>> std::quoted(s)` can read it back as one token unambiguously.",
        },
        {
          prompt: "What string does `std::format(\"{:06.2f}\", 3.14159)` produce?",
          options: ["`3.14`", "`003.14`", "`3.1416`", "`  3.14`"],
          answer: 1,
          explanation: "`.2f` gives two decimals (`3.14`, five characters); width `6` pads to six, and the leading `0` in the spec requests zero padding after the sign, so `003.14`. A plain `{:6.2f}` would pad with spaces.",
        },
        {
          prompt: "`std::format(\"{} {}\", 1)` with a string-literal format string…",
          options: ["Prints `1 ` with an empty second field", "Throws `std::format_error` at run time", "Is a compile error: the literal is checked against the arguments at compile time", "Prints `1 1`"],
          answer: 2,
          explanation: "C++20 requires the format string to be a compile-time constant and checks it against the argument types and count. Only a run-time format string, passed through `std::vformat`, can fail at run time with `std::format_error`.",
        },
        {
          prompt: "Which is true of `oss.str()` on a `std::ostringstream`?",
          options: ["It returns a reference to the internal buffer", "It returns a copy of the buffer contents, so calling it in a loop copies the whole text each time", "It clears the stream after returning the text", "It flushes the text to `std::cout`"],
          answer: 1,
          explanation: "`str()` returns a `std::string` by value — a full copy. Take it once into a variable. Nothing is printed or cleared; `str(\"\")` is the call that empties the buffer (and `clear()` resets the state).",
        },
        {
          prompt: "How does `std::format_to(std::back_inserter(s), \"{}\", x)` differ from `s += std::format(\"{}\", x)`?",
          options: ["It does not — they are identical", "`format_to` writes straight into `s` through the iterator, without building a temporary string first", "`format_to` returns the number of characters written", "`format_to` accepts a run-time format string; `format` does not"],
          answer: 1,
          explanation: "`std::format` allocates a new string and returns it; `std::format_to` formats directly into whatever the output iterator writes to. Both check a literal format string at compile time.",
        },
      ],
    },
    {
      slug: "binary-io-and-filesystem",
      file: "05-binary-io-and-filesystem.md",
      exercises: [
        {
          title: "Fixed-width record file",
          prompt: `Read an integer \`n\`, then \`n\` records \`<id> <score> <name>\` (an \`int\`, a decimal, a one-word name of at most 15 characters), then an index \`k\` (0-based, less than \`n\`). Pack every record into

\`\`\`cpp
struct Record {
    std::int32_t id;
    double score;
    char name[16];
};
\`\`\`

(zero-initialise it and copy the name into the array) and write them all to \`records.bin\`, opened with \`std::ios::binary\`, using \`write\` and \`reinterpret_cast<const char*>\`. Close it and print \`bytes=<std::filesystem::file_size("records.bin")>\`. Reopen the file in binary mode, \`seekg\` straight to record \`k\` — its offset is \`k * sizeof(Record)\` — \`read\` it and print \`record[k]=<id> <name> <score with 1 decimal>\`. Then \`seekg(0)\` and read every record in a \`while (in.read(...))\` loop to print \`count=<n> mean=<mean score, 2 decimals> best=<name of the highest score, first on ties>\`. Delete the file at the end.

**Input:** \`n\`, \`n\` records, \`k\`.
**Output:** three lines.

\`\`\`text
3
1 91.5 ada
2 78.5 bob
3 91.5 cy
1
\`\`\`
prints
\`\`\`text
bytes=96
record[1]=2 bob 78.5
count=3 mean=87.17 best=ada
\`\`\``,
          starter: String.raw`#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <string>
#include <type_traits>

struct Record {
    std::int32_t id;
    double score;
    char name[16];
};
static_assert(std::is_trivially_copyable_v<Record>);

int main() {
    const char* const path = "records.bin";
    int n;
    std::cin >> n;
    {
        std::ofstream out(path, std::ios::binary);
        for (int i = 0; i < n; ++i) {
            Record r{};
            std::string name;
            std::cin >> r.id >> r.score >> name;
            // TODO: copy name into r.name, then write the record's bytes
        }
    }
    int k;
    std::cin >> k;
    std::cout << "bytes=" << std::filesystem::file_size(path) << '\n';
    std::ifstream in(path, std::ios::binary);
    // TODO: seek to record k and read it; then rewind and read them all for the summary
    in.close();
    std::filesystem::remove(path);
    return 0;
}
`,
          solution: String.raw`#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <string>
#include <type_traits>

struct Record {
    std::int32_t id;
    double score;
    char name[16];
};
static_assert(std::is_trivially_copyable_v<Record>);

int main() {
    const char* const path = "records.bin";
    int n;
    std::cin >> n;
    {
        std::ofstream out(path, std::ios::binary);
        for (int i = 0; i < n; ++i) {
            Record r{};                                          // zeroed, so the name is null-terminated
            std::string name;
            std::cin >> r.id >> r.score >> name;
            name.copy(r.name, sizeof(r.name) - 1);
            out.write(reinterpret_cast<const char*>(&r), sizeof r);
        }
    }
    int k;
    std::cin >> k;
    std::cout << "bytes=" << std::filesystem::file_size(path) << '\n';

    std::ifstream in(path, std::ios::binary);
    Record r{};
    in.seekg(static_cast<std::streamoff>(k) * static_cast<std::streamoff>(sizeof(Record)));
    in.read(reinterpret_cast<char*>(&r), sizeof r);
    std::cout << std::fixed << std::setprecision(1);
    std::cout << "record[" << k << "]=" << r.id << ' ' << r.name << ' ' << r.score << '\n';

    in.clear();                                                  // in case the seek read hit the end
    in.seekg(0);
    int count = 0;
    double sum = 0.0;
    double bestScore = 0.0;
    std::string best;
    while (in.read(reinterpret_cast<char*>(&r), sizeof r)) {
        ++count;
        sum += r.score;
        if (count == 1 || r.score > bestScore) {
            bestScore = r.score;
            best = r.name;
        }
    }
    in.close();
    std::filesystem::remove(path);
    std::cout << std::setprecision(2);
    std::cout << "count=" << count << " mean=" << (count > 0 ? sum / count : 0.0) << " best=" << best << '\n';
    return 0;
}
`,
          hints: [
            "Record r{}; zero-fills the 16-byte name, so copying at most 15 characters leaves it null-terminated.",
            "out.write(reinterpret_cast<const char*>(&r), sizeof r); writes the object's bytes, padding included — 32 per record on this platform.",
            "in.seekg(k * sizeof(Record)) then in.read(...) fetches one record; clear() and seekg(0) before the full pass.",
          ],
          cases: [
            { stdin: "3\n1 91.5 ada\n2 78.5 bob\n3 91.5 cy\n1\n", expected: "bytes=96\nrecord[1]=2 bob 78.5\ncount=3 mean=87.17 best=ada\n" },
            { stdin: "1\n42 100.0 zed\n0\n", expected: "bytes=32\nrecord[0]=42 zed 100.0\ncount=1 mean=100.00 best=zed\n" },
            { stdin: "2\n5 60.0 fifteenletters1\n6 70.0 x\n1\n", expected: "bytes=64\nrecord[1]=6 x 70.0\ncount=2 mean=65.00 best=x\n", hidden: true },
            { stdin: "4\n1 0.0 a\n2 0.0 b\n3 0.0 c\n4 0.0 d\n3\n", expected: "bytes=128\nrecord[3]=4 d 0.0\ncount=4 mean=0.00 best=a\n", hidden: true },
            { stdin: "2\n-1 -5.5 neg\n-2 -2.5 less\n0\n", expected: "bytes=64\nrecord[0]=-1 neg -5.5\ncount=2 mean=-4.00 best=less\n", hidden: true },
          ],
        },
        {
          title: "Directory listing, sorted",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`<filename> <content>\` — a one-word file name (no spaces or slashes) followed by the rest of the line, which may be empty. Create a directory named \`inbox\` with \`std::filesystem::create_directory\` and write each file as \`inbox/<filename>\` holding the content followed by one newline. A repeated file name overwrites the earlier file.

Then list the directory with \`std::filesystem::directory_iterator\`, collecting each regular file's name and size, **sort the names** (the iterator's order is unspecified), and print \`<name> <size>\` per file, then \`files=<count> total=<sum of sizes>\`. Finally remove the whole directory with \`std::filesystem::remove_all\` and print \`removed=<the number it returns>\` — the files plus the directory itself.

**Input:** \`n\`, then \`n\` lines.
**Output:** the sorted listing, then two lines.

\`\`\`text
3
b.txt hello world
a.txt hi
c.log
\`\`\`
prints
\`\`\`text
a.txt 3
b.txt 12
c.log 1
files=3 total=16
removed=4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

namespace fs = std::filesystem;

int main() {
    const fs::path dir = "inbox";
    int n;
    std::cin >> n;
    fs::create_directory(dir);
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::string rest;
        std::cin >> name;
        std::getline(std::cin, rest);
        if (!rest.empty() && rest.front() == ' ') rest.erase(0, 1);
        // TODO: write rest + '\n' to dir / name
    }
    std::vector<std::pair<std::string, std::uintmax_t>> entries;
    // TODO: collect (name, size) for every regular file, sort, print, then remove_all
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

namespace fs = std::filesystem;

int main() {
    const fs::path dir = "inbox";
    int n;
    std::cin >> n;
    fs::create_directory(dir);
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::string rest;
        std::cin >> name;
        std::getline(std::cin, rest);
        if (!rest.empty() && rest.front() == ' ') rest.erase(0, 1);
        std::ofstream out(dir / name);                         // closed at the end of this iteration
        out << rest << '\n';
    }
    std::vector<std::pair<std::string, std::uintmax_t>> entries;
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_regular_file()) entries.emplace_back(entry.path().filename().string(), entry.file_size());
    }
    std::sort(entries.begin(), entries.end());
    std::uintmax_t total = 0;
    for (const auto& [name, size] : entries) {
        std::cout << name << ' ' << size << '\n';
        total += size;
    }
    std::cout << "files=" << entries.size() << " total=" << total << '\n';
    std::cout << "removed=" << fs::remove_all(dir) << '\n';
    return 0;
}
`,
          hints: [
            "dir / name joins the path; a std::ofstream constructed from it creates the file, and the object closes it when the loop iteration ends.",
            "entry.path().filename().string() and entry.file_size() are the two values to collect; sort the vector of pairs before printing.",
            "fs::remove_all returns how many entries it deleted — the files and the directory itself.",
          ],
          cases: [
            { stdin: "3\nb.txt hello world\na.txt hi\nc.log\n", expected: "a.txt 3\nb.txt 12\nc.log 1\nfiles=3 total=16\nremoved=4\n" },
            { stdin: "1\nnotes.md line one\n", expected: "notes.md 9\nfiles=1 total=9\nremoved=2\n" },
            { stdin: "0\n", expected: "files=0 total=0\nremoved=1\n", hidden: true },
            { stdin: "2\nsame.txt first\nsame.txt second longer\n", expected: "same.txt 14\nfiles=1 total=14\nremoved=2\n", hidden: true },
            { stdin: "3\nz 1\ny 22\nx 333\n", expected: "x 4\ny 3\nz 2\nfiles=3 total=9\nremoved=4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "```cpp\nstd::string s = \"hello\";\nout.write(reinterpret_cast<const char*>(&s), sizeof s);\n```\nWhat ends up in the file?",
          options: ["The five characters `hello`", "The `std::string` object's own bytes — a pointer, a size and a capacity — but not the characters", "`hello` followed by a null byte", "A compile error: `std::string` cannot be cast to `const char*`"],
          answer: 1,
          explanation: "`write` copies `sizeof s` bytes starting at the object, and the object is a handle to heap memory. Only trivially copyable types can be written this way; for a string, write `s.data()` with `s.size()` bytes (and its length first).",
        },
        {
          prompt: "`struct R { std::int32_t id; double score; };` — what is `sizeof(R)` on this platform, and why?",
          options: ["12 — four plus eight", "16 — four bytes of padding after `id` so the `double` sits on an 8-byte boundary", "8 — the compiler packs the fields", "It depends on the optimisation level"],
          answer: 1,
          explanation: "A `double` must be 8-byte aligned, so the compiler inserts padding after the 4-byte `int32_t`. The padding is part of the object and is written and read with it; the layout is fixed by the platform ABI, not by `-O2`.",
        },
        {
          prompt: "In what order does `std::filesystem::directory_iterator` yield the entries of a directory?",
          options: ["Alphabetical by file name", "Creation order", "Unspecified — whatever the operating system returns; sort the names yourself for a deterministic listing", "Largest file first"],
          answer: 2,
          explanation: "The standard makes no promise; the order comes from the underlying directory structure and differs between file systems. Collect the entries into a vector and sort before printing.",
        },
        {
          prompt: "`std::filesystem::file_size(\"reports\")` where `reports` is a directory:",
          options: ["Returns the total size of the files inside", "Returns 0", "Throws `std::filesystem::filesystem_error`; the `std::error_code` overload reports the error without throwing", "Returns `-1`"],
          answer: 2,
          explanation: "`file_size` is defined for regular files only. Every filesystem function has a throwing overload and one taking a trailing `std::error_code&` that sets the code instead — the second is the one for code that expects failures.",
        },
        {
          prompt: "An `int` holding `1` is stored on x86-64 as the bytes `01 00 00 00`. This byte order is called…",
          options: ["Big-endian", "Little-endian: the least significant byte comes first", "Network order", "Packed"],
          answer: 1,
          explanation: "x86-64 is little-endian. Big-endian (network order) would store `00 00 00 01`. A binary file written with `write` uses the CPU's order, so a portable format serialises each integer byte by byte in a declared order.",
        },
        {
          prompt: "What does `std::ios::binary` change when a file is opened on Linux?",
          options: ["Nothing on Linux; on Windows it disables the `\\n` to `\\r\\n` translation that would corrupt binary data", "It makes `>>` read raw bytes instead of formatted values", "It disables buffering", "It makes `read` and `write` available — they are absent in text mode"],
          answer: 0,
          explanation: "Binary mode only turns off newline translation, which Linux never does. `read`/`write` exist in every mode. Always specify it for binary data so the program behaves identically on Windows.",
        },
      ],
    },
    {
      slug: "io-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Records with a variable field count",
          prompt: `Read lines until the input ends. Each non-blank line is a record \`<name> v1 v2 ... vk\` with \`k >= 0\` integer values after the name. For each record print \`<name>: n=<k> sum=<s> max=<m>\`, or \`<name>: n=0\` when there are no values. If any token after the name is not an integer, print \`line <L>: malformed\` instead, where \`L\` is the line's 1-based number counting every line, blank ones included. Skip blank lines silently. Finish with \`records=<good> bad=<malformed>\`.

Parse each line in its own \`std::istringstream\`; after the values loop stops, \`eof()\` on that stream tells a clean end from a bad token. Use \`long long\`.

**Input:** any number of lines.
**Output:** one line per record or bad line, then the summary.

\`\`\`text
ada 3 5 9
bob

cy 7 x 2
dee -4 -6
\`\`\`
prints
\`\`\`text
ada: n=3 sum=17 max=9
bob: n=0
line 4: malformed
dee: n=2 sum=-10 max=-4
records=3 bad=1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    int lineNo = 0;
    int good = 0;
    int bad = 0;
    while (std::getline(std::cin, line)) {
        ++lineNo;
        std::istringstream in(line);
        std::string name;
        if (!(in >> name)) continue;               // a blank line
        // TODO: read the values, detect a bad token with eof(), print the record or the error
    }
    std::cout << "records=" << good << " bad=" << bad << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    int lineNo = 0;
    int good = 0;
    int bad = 0;
    while (std::getline(std::cin, line)) {
        ++lineNo;
        std::istringstream in(line);
        std::string name;
        if (!(in >> name)) continue;               // a blank line
        long long v = 0;
        long long sum = 0;
        long long max = 0;
        int count = 0;
        while (in >> v) {
            if (count == 0 || v > max) max = v;
            sum += v;
            ++count;
        }
        if (!in.eof()) {                           // the loop stopped on a token, not at the end
            std::cout << "line " << lineNo << ": malformed\n";
            ++bad;
            continue;
        }
        ++good;
        if (count == 0) std::cout << name << ": n=0\n";
        else std::cout << name << ": n=" << count << " sum=" << sum << " max=" << max << '\n';
    }
    std::cout << "records=" << good << " bad=" << bad << '\n';
    return 0;
}
`,
          hints: [
            "while (in >> v) stops either at the end of the line (eofbit set) or on a token that is not a number (failbit only).",
            "The maximum must start from the first value, not from 0 — the values can all be negative.",
            "Count the line number before the blank-line check so blank lines still advance it.",
          ],
          cases: [
            { stdin: "ada 3 5 9\nbob\n\ncy 7 x 2\ndee -4 -6\n", expected: "ada: n=3 sum=17 max=9\nbob: n=0\nline 4: malformed\ndee: n=2 sum=-10 max=-4\nrecords=3 bad=1\n" },
            { stdin: "solo 100\n", expected: "solo: n=1 sum=100 max=100\nrecords=1 bad=0\n" },
            { stdin: "\n\n", expected: "records=0 bad=0\n", hidden: true },
            { stdin: "big 2000000000 2000000000\n", expected: "big: n=2 sum=4000000000 max=2000000000\nrecords=1 bad=0\n", hidden: true },
            { stdin: "a 1 2 3 4 5\nb 9\nc 1.5\n", expected: "a: n=5 sum=15 max=5\nb: n=1 sum=9 max=9\nline 3: malformed\nrecords=2 bad=1\n", hidden: true },
          ],
        },
        {
          title: "A std::format table",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`<name> <qty> <price>\`. Print a table built with \`std::format\` and \`std::format_to\` only — no \`setw\`:

- the name column is left-aligned with a width of \`max(4, longest name)\`, passed as a dynamic width with \`{:<{}}\`;
- \`Qty\` right-aligned in 5, \`Price\` right-aligned in 9 with two decimals, \`Total\` (\`qty × price\`) right-aligned in 10 with two decimals;
- a header row \`Item\`, \`Qty\`, \`Price\`, \`Total\` in the same fields;
- a rule of \`=\` as wide as the table (\`width + 24\`);
- a last line with \`Grand total\` left-aligned in \`width + 14\` and the grand total right in 10 with two decimals.

Build the whole text into one \`std::string\` with \`std::format_to(std::back_inserter(out), ...)\` and print it once.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 3\` lines.

\`\`\`text
2
pen 3 1.50
notebook 12 4.25
\`\`\`
prints
\`\`\`text
Item      Qty    Price     Total
pen         3     1.50      4.50
notebook   12     4.25     51.00
================================
Grand total                55.50
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <format>
#include <iostream>
#include <iterator>
#include <string>
#include <vector>

struct Row {
    std::string name;
    int qty = 0;
    double price = 0.0;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Row> rows;
    std::size_t width = 4;
    for (int i = 0; i < n; ++i) {
        Row r;
        std::cin >> r.name >> r.qty >> r.price;
        width = std::max(width, r.name.size());
        rows.push_back(r);
    }
    std::string out;
    // TODO: header, rows, rule and grand total through std::format / std::format_to
    std::cout << out;
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <format>
#include <iostream>
#include <iterator>
#include <string>
#include <vector>

struct Row {
    std::string name;
    int qty = 0;
    double price = 0.0;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Row> rows;
    std::size_t width = 4;                                       // "Item"
    for (int i = 0; i < n; ++i) {
        Row r;
        std::cin >> r.name >> r.qty >> r.price;
        width = std::max(width, r.name.size());
        rows.push_back(r);
    }
    std::string out = std::format("{:<{}}{:>5}{:>9}{:>10}\n", "Item", width, "Qty", "Price", "Total");
    double grand = 0.0;
    for (const auto& r : rows) {
        const double total = r.qty * r.price;
        grand += total;
        std::format_to(std::back_inserter(out), "{:<{}}{:>5}{:>9.2f}{:>10.2f}\n", r.name, width, r.qty, r.price, total);
    }
    std::format_to(std::back_inserter(out), "{}\n", std::string(width + 24, '='));
    std::format_to(std::back_inserter(out), "{:<{}}{:>10.2f}\n", "Grand total", width + 14, grand);
    std::cout << out;
    return 0;
}
`,
          hints: [
            "{:<{}} takes the width from the next argument: std::format(\"{:<{}}\", name, width).",
            "Nothing is sticky in std::format — every field states its own alignment, width and precision.",
            "std::format_to(std::back_inserter(out), ...) appends to the string without building a temporary.",
          ],
          cases: [
            { stdin: "2\npen 3 1.50\nnotebook 12 4.25\n", expected: "Item      Qty    Price     Total\npen         3     1.50      4.50\nnotebook   12     4.25     51.00\n================================\nGrand total                55.50\n" },
            { stdin: "1\nab 1 0.99\n", expected: "Item  Qty    Price     Total\nab      1     0.99      0.99\n============================\nGrand total             0.99\n" },
            { stdin: "0\n", expected: "Item  Qty    Price     Total\n============================\nGrand total             0.00\n", hidden: true },
            { stdin: "2\nsuperlongwidgetname 2 10.00\nx 1 0.10\n", expected: "Item                 Qty    Price     Total\nsuperlongwidgetname    2    10.00     20.00\nx                      1     0.10      0.10\n===========================================\nGrand total                           20.10\n", hidden: true },
            { stdin: "3\na 1 1.10\nb 2 2.20\nc 3 3.30\n", expected: "Item  Qty    Price     Total\na       1     1.10      1.10\nb       2     2.20      4.40\nc       3     3.30      9.90\n============================\nGrand total            15.40\n", hidden: true },
          ],
        },
        {
          title: "Inventory file round trip",
          prompt: `Read lines of \`<sku> <qty>\` (a one-word SKU and an integer quantity, possibly negative) until the input ends. Write each pair to \`inventory.txt\` as \`<sku> <qty>\` on its own line through a \`std::ofstream\`; close it and print \`bytes=<std::filesystem::file_size("inventory.txt")>\`. Then reopen the file with a \`std::ifstream\`, read the pairs back with \`>>\`, and add each quantity into a \`std::map<std::string, long long>\` keyed by SKU. Print \`<sku> <total>\` for every SKU in map order, then \`skus=<count> units=<sum of all totals>\`. Finally delete the file with \`std::filesystem::remove\` and print \`exists=yes\` or \`exists=no\` from \`std::filesystem::exists\`.

**Input:** any number of \`sku qty\` lines.
**Output:** \`bytes=\`, the SKU lines, the summary, \`exists=\`.

\`\`\`text
bolt 10
nut 5
bolt 7
\`\`\`
prints
\`\`\`text
bytes=21
bolt 17
nut 5
skus=2 units=22
exists=no
\`\`\``,
          starter: String.raw`#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <string>

namespace fs = std::filesystem;

int main() {
    const fs::path path = "inventory.txt";
    {
        std::ofstream out(path);
        // TODO: copy every "sku qty" pair into the file
    }
    std::cout << "bytes=" << fs::file_size(path) << '\n';
    std::map<std::string, long long> stock;
    // TODO: read the file back and accumulate per SKU
    // TODO: print the map, the summary, remove the file, print exists=
    return 0;
}
`,
          solution: String.raw`#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <string>

namespace fs = std::filesystem;

int main() {
    const fs::path path = "inventory.txt";
    {
        std::ofstream out(path);
        std::string sku;
        long long qty;
        while (std::cin >> sku >> qty) out << sku << ' ' << qty << '\n';
    }
    std::cout << "bytes=" << fs::file_size(path) << '\n';
    std::map<std::string, long long> stock;
    {
        std::ifstream in(path);
        std::string sku;
        long long qty;
        while (in >> sku >> qty) stock[sku] += qty;
    }
    long long units = 0;
    for (const auto& [sku, total] : stock) {
        std::cout << sku << ' ' << total << '\n';
        units += total;
    }
    std::cout << "skus=" << stock.size() << " units=" << units << '\n';
    fs::remove(path);
    std::cout << "exists=" << (fs::exists(path) ? "yes" : "no") << '\n';
    return 0;
}
`,
          hints: [
            "while (std::cin >> sku >> qty) reads pairs until the input ends; write each as sku, a space, qty and a newline.",
            "Scope the ofstream so it is closed before file_size and the ifstream; stock[sku] += qty accumulates in sorted key order.",
            "fs::remove returns whether it deleted anything; fs::exists afterwards must be false.",
          ],
          cases: [
            { stdin: "bolt 10\nnut 5\nbolt 7\n", expected: "bytes=21\nbolt 17\nnut 5\nskus=2 units=22\nexists=no\n" },
            { stdin: "washer 1\n", expected: "bytes=9\nwasher 1\nskus=1 units=1\nexists=no\n" },
            { stdin: "\n", expected: "bytes=0\nskus=0 units=0\nexists=no\n", hidden: true },
            { stdin: "z 3\na 4\nm -2\n", expected: "bytes=13\na 4\nm -2\nz 3\nskus=3 units=5\nexists=no\n", hidden: true },
            { stdin: "x 2000000000\nx 2000000000\n", expected: "bytes=26\nx 4000000000\nskus=1 units=4000000000\nexists=no\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`if (std::cin >> x)` is true when…",
          options: ["`eof()` is false", "neither `failbit` nor `badbit` is set after the read", "`good()` is true", "`x` is non-zero"],
          answer: 1,
          explanation: "The stream's `operator bool` is `!fail()`. `eofbit` on its own does not make it false, so the last token of an input without a trailing newline still counts as read.",
        },
        {
          prompt: "```cpp\nint x = 9;\nstd::istringstream in(\"seven\");\nin >> x;\nstd::cout << x;\n```\nprints…",
          options: ["`9`", "`0`", "`7`", "Nothing — the program terminates"],
          answer: 1,
          explanation: "Characters were examined and could not form an `int`, so the C++11 rule sets `x` to `0` and `failbit`. (Only when the stream is already at the end before the read does the variable keep its old value.)",
        },
        {
          prompt: "Why does `while (!std::cin.eof()) { std::cin >> x; use(x); }` process one value too many?",
          options: ["`eof()` is set only after a read has tried to go past the end, so the loop enters once more, the read fails, and `use(x)` runs on a failed value", "`eof()` is never set on `std::cin`", "`>>` reads two tokens per call", "The newline at the end of the input counts as a value"],
          answer: 0,
          explanation: "After the last value is read, `eofbit` is still clear (unless there was no trailing newline). The loop runs again, the read fails, and the body sees `0`. `while (std::cin >> x)` tests the read itself.",
        },
        {
          prompt: "After `int n; std::cin >> n;`, what must happen before `std::getline(std::cin, line)` reads the first real line?",
          options: ["Nothing — `getline` skips leading newlines", "`std::cin.clear()`", "The rest of the count's line, including its newline, must be discarded — `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n')`", "`std::cin.sync()`"],
          answer: 2,
          explanation: "`>>` leaves the newline after `n` in the buffer, and `getline` returns the empty remainder of that line. An `ignore` through the newline is the fix; `clear()` touches the state bits only.",
        },
        {
          prompt: "Which reading strategy can report \"row 3 has 2 values, expected 4\" for a matrix?",
          options: ["`std::cin >> m[r][c]` in two nested loops", "Reading each row as a line with `std::getline` and counting the tokens in a `std::istringstream`", "`std::cin.exceptions(std::ios::failbit)`", "Reading the whole input as one string and splitting on spaces"],
          answer: 1,
          explanation: "Only a reader that sees where a line ends can count what was on it. Token-wise reading takes `R × C` values wherever they fall and never notices a short row.",
        },
        {
          prompt: "Which open mode adds to an existing file rather than replacing it?",
          options: ["`std::ofstream out(\"log.txt\");`", "`std::ofstream out(\"log.txt\", std::ios::trunc);`", "`std::ofstream out(\"log.txt\", std::ios::app);`", "`std::ofstream out(\"log.txt\", std::ios::in);`"],
          answer: 2,
          explanation: "`app` sends every write to the end of the existing contents. The default (`out` alone) and `trunc` both empty the file on open; `in` on an `ofstream` is not a sensible mode.",
        },
        {
          prompt: "A program writes `data.txt` through `std::ofstream out` and, in the same scope, opens `std::ifstream in(\"data.txt\")` to read it back. The reader sees an empty file. Why?",
          options: ["Two streams cannot open the same file", "The writer's buffer has not been flushed yet; scope or `close()` the writer before opening the reader", "`std::ifstream` reads from the start of the file only after `seekg(0)`", "The file is locked until the program exits"],
          answer: 1,
          explanation: "Output sits in the `ofstream`'s buffer until a flush; the destructor performs one. Put the writer in its own block so it is destroyed before the reader is constructed.",
        },
        {
          prompt: "What is the correct way to reuse a `std::istringstream in` for a new line of text?",
          options: ["`in.str(next);`", "`in.clear(); in.str(next);`", "`in.str(next); in.seekg(0);`", "`in.reset(next);`"],
          answer: 1,
          explanation: "A stream that was read to its end has `eofbit` and `failbit` set; `str(...)` swaps the buffer but leaves the state, so the next read fails. `clear()` resets the state. (`reset` does not exist.)",
        },
        {
          prompt: "`std::istringstream in(\"\\\"New York\\\" 8\"); std::string city; int n; in >> std::quoted(city) >> n;` leaves `city` as…",
          options: ["`\"New`", "`New York` — the quotes are removed and the space kept", "`\"New York\"` with the quotes", "The read fails: `>>` stops at the space"],
          answer: 1,
          explanation: "`std::quoted` on input reads a double-quoted string as a single token, strips the quotes and undoes any `\\\"` escapes. Plain `>> city` would have stopped at the space and left `\"New`.",
        },
        {
          prompt: "What does `std::format(\"[{:>6.1f}]\", 3.14159)` produce?",
          options: ["`[3.1]`", "`[   3.1]`", "`[3.1   ]`", "`[003.14]`"],
          answer: 1,
          explanation: "`.1f` gives one decimal (`3.1`), and `>6` right-aligns it in a field of six, so three spaces of padding precede it. Left alignment would need `<`; zero padding would need a `0` before the width.",
        },
        {
          prompt: "```cpp\nstd::vector<int> v = {1, 2, 3};\nout.write(reinterpret_cast<const char*>(&v), sizeof v);\n```\nWhat is written?",
          options: ["The three integers, 12 bytes", "The vector's handle — three pointers, 24 bytes on this platform — and none of the elements", "The three integers followed by a length", "Nothing: a compile error"],
          answer: 1,
          explanation: "A `std::vector` object is a small handle to heap storage. To write the elements use `v.data()` and `v.size() * sizeof(int)`; only trivially copyable types may be written as their own bytes.",
        },
        {
          prompt: "`struct P { char tag; double value; };` — `sizeof(P)` on this platform is…",
          options: ["9", "16 — seven bytes of padding after `tag` align the `double` to 8", "12", "8"],
          answer: 1,
          explanation: "The `double` needs 8-byte alignment, so the compiler pads after the 1-byte `char`. The padding travels with the record in `write`/`read`; putting the `double` first would shrink nothing here (the struct's size is still rounded to its alignment) but it does matter for structs with several small members.",
        },
        {
          prompt: "A judged program lists a directory with `std::filesystem::directory_iterator` and prints the names as they come. Why might it fail on the judge and pass locally?",
          options: ["The judge has no filesystem", "The iteration order is unspecified and differs between file systems; the names must be sorted before printing", "`directory_iterator` skips files created by the same program", "The judge runs with a different locale"],
          answer: 1,
          explanation: "Nothing about the order is guaranteed. Collect the entries and sort them — the same rule as for `std::unordered_map` iteration in Module 13.",
        },
        {
          prompt: "`std::filesystem::file_size(p, ec)` with a `std::error_code ec` on a missing file…",
          options: ["Throws `filesystem_error`", "Sets `ec` and returns `static_cast<std::uintmax_t>(-1)` without throwing", "Returns 0 and leaves `ec` clear", "Creates the file"],
          answer: 1,
          explanation: "The overload with a trailing `std::error_code&` never throws: it reports the failure through `ec` and returns the sentinel value. The overload without it throws `std::filesystem::filesystem_error` instead.",
        },
      ],
    },
  ],
});

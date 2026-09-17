---
title: Reading structured input — the pattern catalogue
minutes: 15
---
Every judged program, log parser and configuration reader starts with the same question: what shape is the input, and which read matches that shape? Most wrong answers on this platform are reading bugs, not logic bugs — a count read with `>>` followed by a `getline` that returns an empty line, a matrix read token by token that never notices a short row, a loop on `eof()` that runs once too often. This lesson is a catalogue. For each shape there is a template you can paste, the state check that makes it robust, and the validation that turns "it crashed somewhere" into "line 7: expected 3 values, got 2".

## Choosing the read

Two reads, one rule. `>>` when whitespace is only a separator and the line layout carries no meaning; `std::getline` when spaces are data (a name, a sentence) or when *which line* something is on matters. When a line has internal structure, do both: `getline` the line, then parse it with a `std::istringstream` (lesson 4), so a malformed line can only break its own parse and never the state of `std::cin`. Never mix `>>` and `getline` on the same stream without dealing with the newline `>>` leaves behind.

## Shape 1: a count, then N tokens

```cpp
int n;
if (!(std::cin >> n) || n < 0) { std::cout << "bad count\n"; return 0; }
std::vector<long long> a(n);
for (auto& x : a) std::cin >> x;
```

Layout-agnostic: `3 10 20 30` and `3` on its own line followed by three lines read identically. The count is validated before it sizes anything — a negative or missing `n` would otherwise be a huge allocation or an uninitialised loop bound. `long long` unless the prompt bounds the values.

## Shape 2: a count, then N lines

```cpp
int n;
std::cin >> n;
std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');   // finish the count's line
for (int i = 0; i < n; ++i) {
    std::string line;
    std::getline(std::cin, line);
    if (!line.empty() && line.back() == '\r') line.pop_back();       // a Windows-edited file
    // use line
}
```

The `ignore` is the whole difference between this and a bug: without it the first `getline` returns the empty remainder of the count's line. The `\r` check costs nothing and is the difference between a parser that works on files from every editor and one that mysteriously fails on the last field of every line.

## Shape 3: tokens until the input ends

```cpp
long long x;
while (std::cin >> x) { /* every token */ }
```

The loop ends on the first failed read — the end of the input, or a bad token; lesson 1's recovery loop tells the two apart when it matters.

## Shape 4: lines until the input ends, each with structure

```cpp
std::string line;
int lineNo = 0;
while (std::getline(std::cin, line)) {
    ++lineNo;
    if (line.empty()) continue;                 // blank lines are not records
    std::istringstream fields(line);
    std::string name;
    int qty;
    double price;
    if (!(fields >> name >> qty >> price)) {
        std::cout << "line " << lineNo << ": malformed\n";
        continue;
    }
    // use the record
}
```

This is the workhorse for records. Each line gets a fresh `istringstream`, so a failure is local: the outer `getline` loop is untouched and simply moves to the next line. The line number is counted here, at the only place that sees every line, and it is what a useful error message names.

## Shape 5: a header, then records

A first line that describes the rest — `3 items`, `width=80`, a column list — is Shape 2's count with extra fields, read with `>>` into as many variables as it has, followed by an `ignore` to the end of that line before the records begin. When a record's *last* field can contain spaces (`42 3.5 Ada Lovelace`), read the fixed fields with `>>` and the rest of the line with `std::getline(fields >> std::ws, name)` — the `std::ws` swallows the separator that `>>` stopped on.

## Shape 6: a matrix

```cpp
int rows, cols;
std::cin >> rows >> cols;
std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
std::vector<std::vector<long long>> m;
for (int r = 0; r < rows; ++r) {
    std::string line;
    if (!std::getline(std::cin, line)) { std::cout << "expected " << rows << " rows, got " << r << '\n'; return 0; }
    std::istringstream in(line);
    std::vector<long long> row;
    long long v;
    while (in >> v) row.push_back(v);
    if (static_cast<int>(row.size()) != cols) { std::cout << "row " << r + 1 << ": expected " << cols << " values, got " << row.size() << '\n'; return 0; }
    m.push_back(std::move(row));
}
```

Two templates exist and they differ in what they can check. The token-wise version (`for r, for c: std::cin >> m[r][c]`) is shorter and accepts any layout, which also means it cannot notice that row 2 had four numbers and row 3 had two — it just reads twelve tokens. The line-wise version above validates every row against `cols` and reports the first violation with its row number. Use the token version when the prompt guarantees the shape; use the line version when it is the program's job to check it. A row with a non-number stops the inner `while` early, so it reports as too few values, which is the right message.

## Shape 7: records with a variable number of fields

```cpp
std::string name;
int k;
while (std::cin >> name >> k) {
    std::vector<int> values(k);
    for (auto& v : values) std::cin >> v;
    // use name, values
}
```

When each record announces its own length, the count leads and the loop follows — the same as Shape 1, repeated. When the length is not announced (`ada 3 5 9` / `bob 7`), the line is the record: Shape 4's `getline` plus an `istringstream` that reads tokens until the line runs out, and `values.size()` *is* the count. The second form is the one that can validate ("at least one value expected") and the one that survives a missing field without swallowing the next record's name as a number.

## Validating and reporting

Three rules make an error message worth reading. Name the position — the line number or record index the program counted. Say what was expected and what was found, with the values. And decide the policy once: *stop at the first error* (return after printing it) or *skip and continue* (print, `continue`, and keep a count of bad lines for a summary). A judged program prints its report to `std::cout` because that is what is compared; a real tool sends diagnostics to `std::cerr` so the data output stays clean for the next program in the pipeline. Never trust the count over the data: after a "count then N lines" read, a `getline` that fails before `N` lines arrived is an error to report, not a silent zero. And check the *whole* line was consumed when the format is strict — after reading the expected fields, `if (fields >> extra)` succeeding means there was trailing junk.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::getline` right after `std::cin >> n` | The first "line" is empty. `ignore` the rest of the count's line. |
| A matrix read token-wise | A short or long row is never noticed; the numbers shift into the wrong cells. |
| Parsing fields straight from `std::cin` | One bad field sticks the stream; every later record is lost. Parse a line copy. |
| Ignoring `\r` | The last field of each line carries a stray carriage return and compares unequal. |
| Trusting `n` over the data | A short input reads garbage into the missing rows; report the shortfall instead. |

## Key takeaways

- `>>` for tokens when layout is irrelevant; `std::getline` when spaces are data or the line matters; both when a line has structure.
- After a count read with `>>`, `ignore(max, '\n')` before the first `getline`; strip a trailing `\r`.
- Parse each line in its own `std::istringstream` so a malformed line cannot stick `std::cin`.
- A line-wise matrix reader can validate row lengths; a token-wise one cannot.
- Error messages name the line, the expectation and the value; decide stop-or-skip once.

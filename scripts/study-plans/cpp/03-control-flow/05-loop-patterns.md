---
title: Loop patterns — search, accumulate, sentinel, EOF and two pointers
minutes: 14
---
Almost every loop you will write in this track is one of about six loops with the names changed. Recognising which one you are writing is what lets you write it right the first time: a search knows what it prints when nothing matches, an accumulation knows what it starts from, a reading loop knows what ends it. This lesson catalogues them, states the invariant each keeps, and adds two that separate a working solution from a fast one: the two-pointer sweep over sorted data and building output once.

## Linear search with an early exit

```cpp
int found = -1;
for (int i = 0; i < n; ++i) {
    if (a[i] == target) {
        found = i;
        break;
    }
}
if (found == -1) std::cout << "absent\n";
else std::cout << "at " << found << '\n';
```

The three decisions are made before the loop: what "not found" looks like (`-1`, a flag, `n`), that the *first* match wins (`break` on it), and that the answer is a position rather than the value. Keeping "not found" as a value outside the valid range is the standard library's own convention — `std::string::npos`, `end()` — and Module 14's `std::find` replaces this loop with one call.

## Accumulate, count, min and max

```cpp
long long sum = 0;
int evens = 0;
int lo = a[0], hi = a[0];          // n >= 1
for (int i = 0; i < n; ++i) {
    sum += a[i];
    if (a[i] % 2 == 0) ++evens;
    if (a[i] < lo) lo = a[i];
    if (a[i] > hi) hi = a[i];
}
```

Two rules. The sum of `int`s goes in a `long long`: a thousand values near two billion overflow `int`, and signed overflow is undefined behaviour, not a wrong answer. And a minimum or maximum is initialised from the *data*, never from `0` — `int hi = 0` reports 0 as the maximum of `{-3, -7}`. When the loop reads its data as it goes and cannot look at `a[0]` first, use a count (`if (count == 0) lo = hi = x;`) or start from `std::numeric_limits<int>::max()` for a minimum and `::min()` for a maximum (`<limits>`, Module 2). To find the *position* of the maximum, compare `a[i] > a[best]` — the strict `>` keeps the first of several equal maxima, `>=` keeps the last.

## Sentinel-terminated input

Some inputs end with a value that is not data: a `0`, a `-1`, a line reading `end`. The read and the test belong in one condition:

```cpp
int x;
int count = 0;
while (std::cin >> x && x != 0) {
    ++count;
    // x is real data here
}
```

`std::cin >> x` runs first; if it fails (end of input, or a non-number) the stream converts to `false` and `&&` stops without testing `x`, which would otherwise hold a stale value. If it succeeds, `x != 0` decides. The sentinel itself is consumed and never counted. The alternative — read, test in the body, `break` — is the same loop with the exit in the middle, but the one-line condition cannot forget to test the read. A sentinel must be a value the data cannot take.

## Reading until the input ends

```cpp
int x;
while (std::cin >> x) { /* every whitespace-separated number */ }

std::string line;
while (std::getline(std::cin, line)) { /* every line, including empty ones */ }
```

Both stop when the read fails, which at the end of standard input is exactly when there is nothing left. The version people write from other languages is wrong:

```cpp
while (!std::cin.eof()) {     // wrong
    std::cin >> x;
    use(x);                   // runs once more with a failed read
}
```

`eof()` becomes true only after a read has *tried* to go past the end, so after the last number the loop runs once more: the read fails and `use(x)` sees what the failed read left — since C++11, `0`. The "n then n values" format sidesteps the question with a counted loop; "until EOF" is for formats that do not say how much is coming.

## State the invariant

An invariant is a statement that is true at the top of every iteration. Write it as a comment on the loop; it is how you check a loop without running it, and it is what an interviewer means by "walk me through why this is correct":

```cpp
// invariant: best is the largest of a[0..i)
int best = a[0];
for (int i = 1; i < n; ++i) {
    if (a[i] > best) best = a[i];
}
// i == n, so best is the largest of a[0..n)
```

Establish it before the loop (`best` is the largest of `a[0..1)`), show the body keeps it (after comparing `a[i]`, `best` is the largest of `a[0..i+1)`), and the exit condition turns it into the result. The one-line habit catches the `hi = 0` bug above and every off-by-one in a binary search.

## The two-pointer sweep

When data is sorted, a nested pair of loops is usually one loop with two indices walking toward each other:

```cpp
// a is sorted ascending; find two elements that sum to target
int lo = 0;
int hi = n - 1;
// invariant: any pair that sums to target has both indices in [lo, hi]
while (lo < hi) {
    const long long sum = static_cast<long long>(a[lo]) + a[hi];
    if (sum == target) { std::cout << lo << ' ' << hi << '\n'; break; }
    if (sum < target) ++lo;      // a[lo] is too small for every partner up to hi
    else --hi;                   // a[hi] is too large for every partner from lo
}
```

Each step discards one index for a reason the invariant states: if the sum is too small, `a[lo]` paired with anything at or below `hi` is smaller still, so `lo` can never be part of the answer. The loop does at most `n - 1` steps where the nested version did about `n²/2`. The same shape reverses a string in place, tests a palindrome, merges two sorted arrays (one index each, moving forward) and removes duplicates from a sorted vector (a *write* index trailing a *read* index). Lesson 3's nested pair search and this one solve the same problem; the difference is the sort.

## Build the output once

```cpp
std::string out;
for (int i = 0; i < n; ++i) {
    if (!out.empty()) out += ' ';
    out += std::to_string(a[i]);
}
std::cout << out << '\n';
```

Two things improve. The separator logic lives in one place and cannot produce a trailing space — the test is "is there something before me", not "am I last". And a program that prints a hundred thousand values makes one write instead of two hundred thousand stream operations; with `std::endl` in the loop it would also flush every line (Module 1, lesson 4). `std::ostringstream` (Module 5) is the same idea with `<<` formatting.

## What goes wrong

| Mistake | What happens |
| --- | --- |
| `int max = 0;` before the loop | Wrong for all-negative data. Start from the data or the type's limit. |
| Summing `int`s into an `int` | Overflow: undefined behaviour. Use `long long`. |
| Testing the sentinel after counting | The sentinel is counted. Test in the condition. |
| `while (!std::cin.eof())` | One extra iteration on a failed read. |
| `while (lo <= hi)` in the pair sweep | Pairs an element with itself. Distinct indices need `<`. |

## Key takeaways

- Decide the "not found" value before writing a search; `break` on the first match.
- Sums in `long long`; min/max from the data, never from 0.
- Put the read in the condition: `while (std::cin >> x && x != sentinel)` and `while (std::cin >> x)` for EOF; never loop on `eof()`.
- Write the invariant as a comment; it is the proof the loop is right.
- Sorted data turns a nested search into a two-pointer sweep; build output in a string and print once.

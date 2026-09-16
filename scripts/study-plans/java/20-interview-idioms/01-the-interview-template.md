---
title: The interview template — input, output, limits
minutes: 12
---
Every coding round starts the same way: a problem statement, an input format, a time limit, and forty minutes. The people who do well have stopped thinking about the mechanics — how to read the input, how to print, what `n ≤ 10⁵` means for the algorithm — because they carry a template and a complexity budget in their heads. This lesson gives you both, plus the edge-case checklist to run before you say "done".

## The template

```java
import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;
    static PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) {
            String line = in.readLine();
            if (line == null) return null;                 // end of input
            st = new StringTokenizer(line);
        }
        return st.nextToken();
    }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = nextLong();
        out.println(solve(a));
        out.flush();
    }

    static long solve(long[] a) { … }
}
```

Type it until you can produce it in ninety seconds. Notes: the `null` check in `next()` makes "read until end of input" work (`while ((t = next()) != null)`); everything numeric that could exceed two billion is a `long` from the start; `solve` is separate from I/O so the logic is testable and readable; and `out.flush()` is the last line, always.

When the problem is small, the whole-input read is even simpler: `String[] tokens = new String(System.in.readAllBytes()).trim().split("\\s+");` — one allocation, then index through tokens. Watch the empty-input case: `"".split("\\s+")` gives `[""]`, so check `tokens[0].isEmpty()`.

## Reading tricky formats

- **Grid of characters**: `char[] row = in.readLine().toCharArray()` per row; never `Scanner.next()` (it splits on whitespace and there is none).
- **Line with a count then values on the same line**: the tokenizer handles it; the count is just the first token.
- **Unknown number of test cases**: loop on `next() != null`.
- **A line of text with spaces**: `in.readLine()` directly — do not mix with the tokenizer without draining it first, and remember `Scanner.nextInt()` leaves the newline in the buffer, so a following `nextLine()` returns `""`.
- **Very large numbers**: `BigInteger`/`BigDecimal` — slow, but correct; a problem that says "up to 10¹⁸" fits in `long` (9.2 × 10¹⁸); one that says "up to 100 digits" does not.

## The complexity budget

A judge does roughly **10⁸ simple operations per second** in Java after warm-up (a little less with heavy object allocation). With a typical 1–2 s limit:

| Largest `n` in the statement | Complexity that fits | Typical shape |
| --- | --- | --- |
| ≤ 12 | O(n!) | permutations, brute force |
| ≤ 25 | O(2ⁿ) | subsets, bitmask DP |
| ≤ 100 | O(n⁴) | four nested loops, small DP |
| ≤ 500 | O(n³) | Floyd–Warshall, cubic DP |
| ≤ 5 000 | O(n²) | pairwise comparison, LIS quadratic |
| ≤ 10⁶ | O(n log n) | sorting, heaps, binary search, `TreeMap` |
| ≤ 10⁸ | O(n) | single pass, hashing, two pointers, prefix sums |
| ≥ 10⁹ | O(log n) or O(1) | math, binary search on the answer, digit tricks |

Read the constraints *before* designing: `n ≤ 10⁵` rules out O(n²) and tells you to think in sorting, hashing or heaps; `n ≤ 20` invites a bitmask. Say your complexity out loud before coding — interviewers mark the reasoning, not just the answer.

## Memory budget

A 256 MB limit fits about 60 million `int`s (4 bytes each), 30 million `long`s, or a few million small objects (16–32 bytes each plus references). A `boolean[10_000_000]` is 10 MB; a `List<Integer>` of ten million is ~200 MB and probably dead. Use primitive arrays for big data, `BitSet` for big boolean tables, and `int[][]` rather than `List<List<Integer>>` for grids.

## Output discipline

- Buffer output (`PrintWriter` or `StringBuilder`); flush once.
- Match the format exactly: a trailing space is usually tolerated, a missing newline usually is, a stray debugging line never is.
- `Locale.ROOT` for decimals; print the exact number of decimals asked for with `%.6f`, not `Math.round`.
- For very large answers "modulo 10⁹ + 7": reduce at every multiplication, keep intermediates in `long`, and `Math.floorMod` for anything that could go negative.

## The edge-case checklist

Before saying "done", run these in your head against your code:

1. **Empty** input / `n = 0`; **single** element / `n = 1`.
2. **All equal** elements; **already sorted** and **reverse sorted**.
3. **Negative** numbers and **zero** where the statement allows them.
4. **Maximum sizes** — does the complexity fit? Does `int` overflow anywhere (`a[i] * a[j]`, sums, `mid = (lo + hi) / 2`)?
5. **Duplicates** — does your `Set`/`Map` logic handle them as the problem wants?
6. **Boundaries** — off-by-one in loops, `substring(i, j)` end-exclusive, `length - 1`.
7. **Strings**: empty, one character, all the same character, case sensitivity, Unicode if the statement hints at it.
8. **Graphs**: disconnected, self-loops, a single node, cycles when you assumed a tree.

Saying "let me check edge cases" and naming three of these is worth more than a fourth correct test.

## Interview angle

- *"How many operations can Java do in a second?"* About 10⁸ simple ones — the number the budget table is built on.
- *"n is 10⁵; what complexity do you need?"* O(n log n) or better; O(n²) is 10¹⁰ — too slow.
- *"Why `long` here?"* Any sum or product of values up to 10⁹ overflows `int`; `long` covers 9 × 10¹⁸.
- *"Why is your I/O slow?"* `Scanner` and unbuffered `println`; switch to the reader template and a flushed `PrintWriter`.
- *"How do you handle end of input?"* `readLine()` returns `null`; the `next()` helper returns `null` past it.

## Key takeaways

- Own the template: buffered reader with a refilling tokenizer, `PrintWriter`, `solve` separated from I/O, `flush` last.
- 10⁸ operations per second; map `n` to the complexity that fits before designing.
- Memory: primitive arrays, `BitSet`, `int[][]`; boxed collections of millions are dead on arrival.
- `long` early; `Locale.ROOT`; exact format; modulo at every step.
- Run the eight-point edge-case checklist aloud.

---
title: Buffering and fast I/O — the template that passes time limits
minutes: 13
---
A `Scanner` reading a million integers takes several seconds; a `BufferedReader` with a `StringTokenizer` does it in a fraction of one; a hand-rolled byte reader is faster still. `System.out.println` in a loop of a million lines is equally slow. None of this matters for a five-line program and all of it decides whether a correct solution passes a judge's time limit. This lesson explains *why* buffering matters, gives the standard fast-I/O template every competitive Java programmer carries, and covers `PrintWriter`, `printf` and the flush rules that catch people out.

## Why unbuffered I/O is slow

Every `read()` on a raw `FileInputStream` or `System.in` can be a **system call** — a trip into the kernel that costs about a microsecond. Reading bytes one at a time is a million system calls for a megabyte. A `BufferedInputStream`/`BufferedReader` asks the kernel for 8 KB at once and serves the next 8 000 reads from memory. The same on output: `BufferedWriter` collects text and writes it in chunks. Buffering is not an optimisation for large files only; it is the difference between I/O that costs microseconds and I/O that costs nothing measurable.

`Scanner` adds a second cost: it tokenises with **regular expressions** and boxes each result (`nextInt` parses through a `String`), which is several hundred nanoseconds per token. Fine for a hundred numbers; catastrophic for a million.

## The standard fast template

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(in.readLine());
        int n = Integer.parseInt(st.nextToken());
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        for (int i = 0; i < n; i++) {
            while (!st.hasMoreTokens()) st = new StringTokenizer(in.readLine());   // tokens may span lines
            int x = Integer.parseInt(st.nextToken());
            out.println(x * 2);
        }
        out.flush();                 // NOTHING is printed until this line
    }
}
```

The `while (!st.hasMoreTokens())` refill is the detail people forget: input that says "n integers" may put them on one line or fifty, and a tokenizer that assumes one line per number reads `null` and throws. Wrap that logic in a `next()` helper and you have a reader that does not care about line structure — exactly how `Scanner` behaves, at a tenth of the cost.

```java
static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
static StringTokenizer st;
static String next() throws IOException {
    while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(in.readLine());
    return st.nextToken();
}
static int nextInt() throws IOException { return Integer.parseInt(next()); }
static long nextLong() throws IOException { return Long.parseLong(next()); }
```

`in.readLine()` returns `null` at end of input; a program that reads "until EOF" loops on `while ((line = in.readLine()) != null)`.

## Faster still: a byte reader

For the heaviest inputs (10⁷ numbers), even `readLine` + `parseInt` allocates a `String` per line. The competitive-programming answer reads raw bytes and parses digits by hand:

```java
static DataInputStream din = new DataInputStream(new BufferedInputStream(System.in, 1 << 16));
static int readInt() throws IOException {
    int ret = 0, b = din.read();
    while (b <= ' ') b = din.read();                    // skip whitespace
    boolean neg = b == '-';
    if (neg) b = din.read();
    while (b >= '0' && b <= '9') { ret = ret * 10 + (b - '0'); b = din.read(); }
    return neg ? -ret : ret;
}
```

Zero allocation per number. It is ugly, it is what the top of every Java leaderboard uses, and you should be able to write it from memory — while saying in an interview that in application code you would never need it.

## Output: `PrintWriter` and `flush`

`System.out` is a `PrintStream` with autoflush on every `println` when attached to a console — a system call per line. Wrapping it in `PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)))` (or `new PrintWriter(System.out)` — buffered by default, no autoflush) turns a million `println`s into a few hundred writes. The price: **you must `flush()` (or `close()`) at the end**, or the output stays in the buffer and the program prints nothing. A judge that shows "no output" for a program that obviously computes the answer is almost always a missing flush.

Alternatively build the whole output in a `StringBuilder` and print it once: `sb.append(x).append('\n')` in the loop, `System.out.print(sb)` at the end. Same effect, one flush, and no `IOException`s to declare.

`printf`/`String.format` are convenient and slow (a format-string parse per call); in a hot loop prefer `append`. When you do format, pass `Locale.ROOT` or `Locale.US` for decimals — a judge running in a German locale prints `3,14` and fails your output.

## Reading everything at once

For small-to-medium inputs the simplest fast approach is one read: `String all = new String(System.in.readAllBytes(), UTF_8)` then `all.split("\\s+")` or `all.lines()`. One system call, one allocation of the whole text, and every parsing tool of the strings module available. Watch the empty-input edge case (`split` on `""` yields `[""]`, not `[]`).

## Character-at-a-time when the format demands it

Some inputs are grids of characters, or expressions with no whitespace. `in.read()` on a `BufferedReader` returns one `char` as an `int` (−1 at end); `in.readLine().toCharArray()` gives a row of a grid. `Scanner` has no `nextChar` — `next().charAt(0)` is the workaround — another reason the reader wins.

## Interview angle

- *"Why is `Scanner` slow?"* Regex tokenising and per-token parsing through strings; a `BufferedReader` + `StringTokenizer` is ~10× faster.
- *"What does buffering actually save?"* System calls: one 8 KB read serves thousands of small reads.
- *"Why did my program print nothing?"* Buffered output never flushed — call `flush()`/`close()` on the `PrintWriter`.
- *"How do you read until end of input?"* `readLine()` returns `null` at EOF; `Scanner.hasNext()` returns `false`.
- *"Fastest way to read ten million integers in Java?"* A byte-level reader over `BufferedInputStream`, parsing digits by hand.

## Key takeaways

- Unbuffered I/O is a system call per byte; buffer everything, always.
- Template: `BufferedReader` + `StringTokenizer` with a refill loop, `PrintWriter` out, `flush()` at the end.
- Byte-level parsing for the extreme cases; `readAllBytes` + `split` for the simple ones.
- Format with `Locale.ROOT`; avoid `printf` in hot loops; `StringBuilder` then one print is fine.
- `readLine()` → `null` at EOF; `read()` → −1.

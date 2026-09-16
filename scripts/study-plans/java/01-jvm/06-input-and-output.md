---
title: Reading input and printing output
minutes: 16
---
Every exercise in this track is a program that reads from standard input and writes to standard output. That is also how competitive programming, coding-round harnesses and most command-line tools work, so it is worth learning properly rather than copying a snippet. This lesson covers the two readers you will use — `Scanner` for convenience, `BufferedReader` for speed — and the output methods, with the exact behaviours that trip people up.

## Standard streams

The JVM gives every program three streams:

- `System.in` — an `InputStream` of raw bytes from the keyboard, a pipe, or a file redirected with `<`.
- `System.out` — a `PrintStream` for normal output.
- `System.err` — a `PrintStream` for errors and diagnostics. The judge compares only `System.out`; anything you print to `System.err` is shown to you but never marked wrong. Use it for debugging.

## `Scanner`: tokens, not lines

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += in.nextLong();
        }
        System.out.println(total);
    }
}
```

A `Scanner` splits input into **tokens** separated by whitespace (spaces, tabs, newlines — any amount). `nextInt()`, `nextLong()`, `nextDouble()`, `next()` (one word) each consume one token, skipping whitespace before it. `hasNext()` / `hasNextInt()` tell you whether another token exists without consuming it — the standard way to read "until end of input":

```java
while (in.hasNextInt()) {
    process(in.nextInt());
}
```

### The `nextLine()` trap

`nextLine()` reads *the rest of the current line*, up to and including the newline, and returns it without the newline. Mixed with token methods it produces the most common Scanner bug:

```java
int age = in.nextInt();        // reads "30", leaves "\n" in the buffer
String name = in.nextLine();   // reads the rest of THAT line: "" (empty!)
```

After `nextInt()` the cursor sits just before the newline that ended the number; `nextLine()` returns the empty string before it. Fixes: call `in.nextLine()` once to discard the leftover, or read everything as lines and parse them yourself.

### Type mismatches

`nextInt()` on a token that is not an integer throws `InputMismatchException`; on no token at all, `NoSuchElementException`. In exercises the input is well-formed, so these mean your reading order is wrong, not the input.

### Locale

`nextDouble()` uses the default locale: on a German system it expects `3,14`. Judges run in the C/English locale, so `3.14` works; in production code create the scanner with `new Scanner(System.in).useLocale(Locale.US)` if you must accept dotted decimals everywhere.

## `BufferedReader`: lines, fast

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += Long.parseLong(st.nextToken());
        }
        System.out.println(total);
    }
}
```

`readLine()` returns the next line without its terminator, or **`null` at end of input** — the idiom for "read all lines":

```java
String line;
while ((line = br.readLine()) != null) {
    …
}
```

Numbers are parsed with `Integer.parseInt`, `Long.parseLong`, `Double.parseDouble`; a line with several numbers is split with `StringTokenizer` (fastest) or `line.split(" ")` (fine for small input; beware of double spaces producing empty tokens — `line.trim().split("\\s+")` is the safe form).

Why bother? `Scanner` uses regular expressions and is roughly ten times slower than `BufferedReader`. For a thousand numbers nobody notices; for a million, `Scanner` is the difference between passing and timing out.

`readLine()` declares `IOException`, a checked exception (Module 12). Until then, adding `throws IOException` to `main` is the accepted way to let it through.

## Output: `println`, `print`, `printf`

```java
System.out.println("total = " + total);   // string then newline
System.out.print(x);                      // no newline
System.out.print(' ');
System.out.printf("%.2f%n", 3.14159);     // 3.14 then a newline
System.out.printf("%5d|%-5d|%05d%n", 42, 42, 42);  // "   42|42   |00042"
```

Format specifiers you will use: `%d` integer, `%s` string (calls `toString`), `%f` float (default 6 decimals), `%.2f` two decimals, `%n` newline, `%5d` right-aligned width 5, `%-5s` left-aligned, `%,d` thousands separators, `%x` hex, `%c` char, `%b` boolean, `%e` scientific. `String.format(...)` returns the same text instead of printing it.

Two newline facts: `println` writes the platform line separator (`\n` on Linux, `\r\n` on Windows); `"\n"` in a string is always a bare linefeed. The judge normalises trailing whitespace and CRLF, so either is safe here; in production, prefer `%n` or `System.lineSeparator()` in files meant to be portable.

## Fast output

`System.out.println` flushes on every call when connected to a terminal and, through `PrintStream`'s synchronisation, is slow for hundreds of thousands of lines. The remedy is to build the output first:

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) {
    sb.append(result[i]).append('\n');
}
System.out.print(sb);
```

or wrap the stream: `PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));` … `out.flush();` at the end — forgetting `flush()` (or `close()`) loses the output entirely, a bug that produces a mysterious empty result.

## Reading a whole input at once

Sometimes the simplest approach is to slurp everything:

```java
String all = new String(System.in.readAllBytes()).trim();
String[] tokens = all.split("\\s+");
```

`readAllBytes()` (Java 9+) reads to end of stream. Good for small inputs and for problems where the format is "some numbers, in any layout".

## A template for the exercises

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        // read, compute, append to out
        System.out.print(out);
    }
}
```

The class must be named `Main` on the runner. Read with `br.readLine()`, split with `trim().split("\\s+")`, parse with `Integer.parseInt`, append results to `out`, print once.

## Key takeaways

- `Scanner` reads whitespace-separated tokens; mixing `nextInt()` and `nextLine()` leaves a newline behind.
- `BufferedReader.readLine()` returns `null` at end of input and is ~10× faster than `Scanner`.
- `printf`/`String.format` for formatting; `%.2f`, `%d`, `%s`, `%n` cover most needs.
- For big outputs, build a `StringBuilder` and print once; if you wrap in a `PrintWriter`, flush it.

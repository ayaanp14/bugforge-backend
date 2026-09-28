---
title: Formatting output and text blocks
minutes: 13
seo-title: Java printf and String.format: Specifiers and Text Blocks
description: Format Java output with String.format and printf: %d, %s, %.2f, width, padding, thousands separators and rounding, plus multi-line text blocks.
question: How do you format a string in Java?
answer: To format a string in Java, call `String.format(format, args...)`, which returns the text, or `System.out.printf`, which prints it. Each specifier in the format consumes the next argument: `%d` for integers, `%s` for any value, `%.2f` for two decimal places and `%n` for a newline. Width and flags pad and align, so `%5d` right-aligns in five columns and `%05d` pads with zeros.
q: How does `%.2f` round in Java?
a: `%.2f` rounds half up, applied to the shortest decimal representation of the double, the digits `Double.toString` prints, not to its exact binary value. So `String.format("%.2f", 2.675)` gives `2.68`, where C's `printf` prints `2.67`. For money, format a `BigDecimal` instead.
q: How do I add a thousands separator in Java?
a: Use the `,` flag: `String.format("%,d", 1234567)` gives `1,234,567`. The separator follows the default locale, so a German machine prints dots; pass `Locale.ROOT` for stable output, or use `NumberFormat` for currency and percentages.
q: How do I pad a number with leading zeros in Java?
a: Use the `0` flag with a width: `String.format("%05d", 42)` gives `00042`. The width counts the whole result, so `%08.2f` of 3.14159 gives `00003.14`; `%5d` pads with spaces on the left and `%-5d` on the right.
q: What is a text block in Java?
a: A text block, added in Java 15, is a multi-line string literal that opens with three double quotes and a line break and closes with three double quotes. The indentation common to every line and the closing delimiter is stripped, line endings become newlines, and a lone double quote inside needs no escaping.
q: Are Java format strings checked at compile time?
a: No. The compiler does not check them, so mistakes surface at run time: a specifier with no matching argument throws `MissingFormatArgumentException`, and a mismatch such as `%d` with a `String` throws `IllegalFormatConversionException`. Test every format string you write.
---
Getting text to look right — two decimals, aligned columns, a leading zero, a thousands separator, a multi-line template — is a solved problem in Java, but the solution is a mini-language you have to learn once. This lesson covers `String.format`/`printf` thoroughly, then the text blocks that Java 15 added for multi-line strings.

## `String.format` and `printf`

```java
String s = String.format("%s has %d items costing %.2f", name, count, total);
System.out.printf("%s has %d items costing %.2f%n", name, count, total);
String t = "%s has %d items".formatted(name, count);    // Java 15+, same thing
```

All three use the same format string. `printf` prints it; `format`/`formatted` return it. Each `%` specifier consumes the next argument (or an indexed one).

### The specifier

```
%[argument_index$][flags][width][.precision]conversion
```

| Conversion | Meaning | Example |
| --- | --- | --- |
| `%d` | integer (`int`, `long`, `BigInteger`) | `42` |
| `%s` | string — anything, via `String.valueOf` | `hello` |
| `%f` | fixed-point decimal, default 6 places | `3.141593` |
| `%.2f` | two decimal places, rounded HALF_UP | `3.14` |
| `%e` / `%E` | scientific | `3.141593e+00` |
| `%g` | general (shortest of `%e`/`%f`) | |
| `%c` | character | `A` |
| `%b` | boolean (`null` → `false`, other objects → `true`) | |
| `%x` / `%X` | hex | `ff` / `FF` |
| `%o` | octal | |
| `%n` | platform newline | |
| `%%` | a literal percent | |
| `%tF`, `%tT`, `%tY` … | date/time (use `java.time` formatting instead) | |

### Width, alignment, padding

```java
String.format("[%5d]", 42)      // "[   42]"   right-aligned, width 5
String.format("[%-5d]", 42)     // "[42   ]"   left-aligned (flag -)
String.format("[%05d]", 42)     // "[00042]"   zero-padded (flag 0)
String.format("[%+d]", 42)      // "[+42]"     always show sign
String.format("[%,d]", 1234567) // "[1,234,567]"  grouping separator (locale!)
String.format("[%10.3f]", Math.PI)   // "[     3.142]"
String.format("[%-10s]", "left")     // "[left      ]"
String.format("[%10s]", "right")     // "[     right]"
String.format("[%.3s]", "truncate")  // "[tru]"   precision on %s truncates
String.format("%2$s %1$s", "world", "hello")   // "hello world"   explicit indices
String.format("%08.2f", 3.14159)     // "00003.14"
```

A table of aligned columns is width specifiers on each field. `%-12s%8d%10.2f%n` is a typical row.

### Rounding

`%.2f` rounds with `RoundingMode.HALF_UP` applied to the *shortest decimal representation* of the double — the digits `Double.toString` would print — not to the exact binary value. `String.format("%.2f", 2.675)` therefore gives `2.68` even though the stored double is 2.67499999…; `%.2f` of `1.005` gives `1.01`. (C's `printf` rounds the binary value and prints `2.67`.) For money, format a `BigDecimal` (which `%f` accepts exactly), or round yourself with `setScale` and print the result.

### Locale

`%,d` and `%f` are locale-sensitive: on a German machine `%,d` inserts `.` and `%.2f` uses `,` as the decimal point. Tests and file formats want stability: `String.format(Locale.ROOT, "%.2f", x)`. The judge in this course runs with the ROOT/US conventions, so `%.2f` prints a dot.

### Errors

A specifier without a matching argument throws `MissingFormatArgumentException`; a mismatch (`%d` with a `String`) throws `IllegalFormatConversionException`. These are run-time errors — the compiler does not check format strings — so test any format you write.

## `printf` vs `println` vs string concatenation

`println("x=" + x)` is simplest for debugging. `printf` when you need alignment or decimals. `String.format` when you need the text (a message, a file name). For very hot output paths, `StringBuilder` with manual formatting beats `printf`, which parses the pattern on every call.

## `DecimalFormat` and `NumberFormat`

For user-facing numbers with currency symbols and locale rules:

```java
NumberFormat.getCurrencyInstance(Locale.US).format(1234.5)      // "$1,234.50"
NumberFormat.getPercentInstance().format(0.256)                 // "26%"
new DecimalFormat("#,##0.00").format(1234.5)                    // "1,234.50"
new DecimalFormat("0.###").format(1.5)                          // "1.5" — up to 3 optional decimals
```

`DecimalFormat` patterns: `0` = required digit, `#` = optional digit, `,` = grouping, `.` = decimal point. `HALF_EVEN` rounding by default — different from `%f`'s `HALF_UP`.

## Text blocks (Java 15+)

Multi-line strings used to be concatenation soup. A text block starts with `"""` followed by a newline and ends with `"""`:

```java
String json = """
    {
      "name": "Ada",
      "role": "engineer"
    }
    """;
```

Rules that matter:

- **Indentation is stripped** by the amount common to all lines *and the closing delimiter*. Move the closing `"""` left to keep more indentation; put it on the last content line to drop the trailing newline.
- Each line ends with `\n` regardless of the source file's line endings.
- Trailing spaces on each line are removed (use `\s` to keep one).
- `"` inside needs no escaping; `"""` inside does (`\"""`).
- A `\` at the very end of a line joins it with the next (no newline) — for long single-line strings.
- `\n`, `\t` and other escapes still work; `\s` is a space that survives stripping.
- The block is an ordinary `String` — `.formatted(...)`, `.strip()`, `.lines()` all apply.

```java
String sql = """
    SELECT id, name
    FROM users
    WHERE role = '%s'
    """.formatted(role);      // and yes, that is an injection risk — use parameters in real code

String oneLine = """
    a very long string \
    continued here""";        // "a very long string continued here"
```

Text blocks exist for SQL, JSON, HTML and test fixtures. They are a literal, not a template engine — no variables inside; use `formatted` or a builder.

## Escapes, recapped

`\n` newline, `\t` tab, `\r` carriage return, `\\` backslash, `\"` quote, `\'` (needed only in `char` literals), `\0` NUL, `\uXXXX` Unicode (processed *before* parsing, anywhere in the source: a Unicode escape for a double quote — `\u` followed by `0022` — ends the string literal early, and one for a line feed — `\u` followed by `000a` — inside a comment starts a new line of code; never write either), `\s` space (Java 15+). There is no `\e` and no raw-string prefix; a regex in a string is `"\\d+"`.

## Interview angle

- *"`String.format("%5.1f", 3.14159)`?"* `"  3.1"` — width 5 includes the whole thing.
- *"How do you print with a thousands separator?"* `%,d`, or `NumberFormat`.
- *"Are format strings checked at compile time?"* No; mismatches throw at run time.
- *"What does a text block do with indentation?"* Strips the common indentation, measured against the least-indented line including the closing delimiter.

## Key takeaways

- `%[flags][width][.precision]conversion` — `%d %s %.2f %n` cover most needs; `-` left-aligns, `0` zero-pads, `,` groups.
- `%.2f` rounds HALF_UP on the shortest decimal representation (2.675 → `2.68`); use `Locale.ROOT` for stable decimal points.
- Format strings are checked at run time — test them.
- Text blocks strip common indentation and normalise line endings; `formatted` fills them.
- `DecimalFormat`/`NumberFormat` for currency and locale-correct display.

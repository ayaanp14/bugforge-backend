---
title: The String API you will actually use
minutes: 16
---
`String` has around seventy methods. Perhaps twenty carry ninety percent of real code, and each has a detail — an exclusive end index, a regex where you expected a literal, a trailing-empty-string rule — that separates "I know the method" from "I know what it does". This lesson is those twenty, with the details.

## Substrings and searching

```java
String s = "Hello, World";
s.substring(7)          // "World"           — from index 7 to the end
s.substring(0, 5)       // "Hello"           — begin inclusive, END EXCLUSIVE
s.substring(5, 5)       // ""                — legal: empty
s.substring(7, 5)       // StringIndexOutOfBoundsException — begin > end
s.substring(0, 20)      // exception — end past length
s.indexOf('o')          // 4                 — first occurrence
s.indexOf('o', 5)       // 8                 — search from index 5
s.indexOf("World")      // 7
s.indexOf("xyz")        // -1                — not found: -1, never an exception
s.lastIndexOf('o')      // 8
s.contains("lo, W")     // true
s.startsWith("Hell")    // true
s.startsWith("World", 7)   // true — with an offset
s.endsWith("ld")        // true
s.charAt(s.length() - 1)   // 'd' — the last character
```

The half-open interval `[begin, end)` is Java's convention everywhere (arrays, lists, streams), and it makes `end - begin` the length. Pair it with `indexOf`:

```java
int at = s.indexOf(',');
String first = s.substring(0, at);        // "Hello"
String rest  = s.substring(at + 1).trim(); // "World"
```

## Case, whitespace, and cleaning

```java
"  padded \t\n".trim()     // "padded"   — removes chars ≤ U+0020 at both ends
"  padded ".strip()        // "padded"   — Unicode-aware (Java 11+); also stripLeading, stripTrailing
"Hello".toUpperCase()      // "HELLO"
"Hello".toLowerCase()      // "hello"
"hello".isBlank()          // false; "   ".isBlank() is true
"ab".repeat(3)             // "ababab"
```

`toUpperCase()`/`toLowerCase()` use the default locale — in Turkish, `"i".toUpperCase()` is `İ`. For programmatic text (keywords, identifiers, file extensions) pass `Locale.ROOT`: `s.toLowerCase(Locale.ROOT)`. Static analysers flag the no-argument form for this reason.

## Replacing

```java
"a.b.c".replace('.', '-')          // "a-b-c"  — char, all occurrences
"a.b.c".replace(".", "-")          // "a-b-c"  — LITERAL CharSequence, all occurrences
"a.b.c".replaceAll(".", "-")       // "-----"  — REGEX: . matches any character!
"a.b.c".replaceAll("\\.", "-")     // "a-b-c"  — escaped regex
"a.b.c".replaceFirst("\\.", "-")   // "a-b.c"
```

The trap is in the names: `replace` is literal, `replaceAll` is a regular expression. Use `replace` unless you need a pattern. When you do need a pattern with a literal that has special characters, `Pattern.quote(".")` produces the escaped form.

## Splitting and joining

```java
"a,b,c".split(",")            // ["a", "b", "c"]
"a,b,,c,,".split(",")         // ["a", "b", "", "c"]   — trailing empties DROPPED
"a,b,,c,,".split(",", -1)     // ["a", "b", "", "c", "", ""]  — limit -1 keeps them
"a,b,c".split(",", 2)         // ["a", "b,c"]           — at most 2 pieces
"one  two   three".split(" ")     // ["one", "", "two", "", "", "three"]   — every single space
"one  two   three".split("\\s+")  // ["one", "two", "three"]  — runs of whitespace
"  lead".split("\\s+")            // ["", "lead"]  — a leading empty string IS kept
"a.b".split(".")              // []  — "." is a regex matching everything; every piece is empty and dropped
"a.b".split("\\.")            // ["a", "b"]
"".split(",")                 // [""]  — one empty string, not an empty array

String.join("-", "a", "b", "c")           // "a-b-c"
String.join(", ", List.of("x", "y"))      // "x, y"
```

`split` takes a **regex**, drops **trailing** empty strings (unless the limit is negative), and keeps leading ones. The safe form for whitespace-separated input is `line.trim().split("\\s+")`. For a single literal character that is not a regex metacharacter (`,`, `;`, `|` is a metacharacter!, `-`), plain `split(",")` is fine; for `.`, `|`, `+`, `*`, `?`, `(`, `[`, `\`, `^`, `$` escape with `\\`.

## Conversion to and from other types

```java
String.valueOf(3.5)        // "3.5"   — overloaded for every primitive, and Object (null-safe → "null")
String.valueOf(chars)      // from char[]
Integer.parseInt("42")     // 42; NumberFormatException for "42 ", "4.2", "", null
Integer.parseInt("ff", 16) // 255
Double.parseDouble("1e3")  // 1000.0
Boolean.parseBoolean("yes")   // false — only "true" (any case) is true
s.toCharArray()            // char[] copy
s.chars()                  // IntStream of UTF-16 code units (Module 15)
s.getBytes(StandardCharsets.UTF_8)   // byte[] — always name the charset
```

## Comparison helpers (recap)

`equals`, `equalsIgnoreCase`, `compareTo`, `compareToIgnoreCase`, `contentEquals`, `regionMatches`, `matches`. Covered in the previous lesson.

## Newer additions worth knowing

| Method | Since | What |
| --- | --- | --- |
| `isBlank()`, `strip()`, `stripLeading()`, `stripTrailing()` | 11 | Unicode whitespace handling |
| `repeat(n)` | 11 | Repetition |
| `lines()` | 11 | Stream of lines, splitting on `\n`, `\r`, `\r\n` |
| `chars()`, `codePoints()` | 9 | Streams of characters |
| `formatted(args…)` | 15 | `"%d items".formatted(3)` — instance form of `String.format` |
| `indent(n)` | 12 | Adds/removes leading spaces on every line |
| `translateEscapes()` | 15 | Interprets `\n`, `\t` in the string's content |
| Text blocks `"""…"""` | 15 | Multi-line literals (next lessons) |

## Performance notes

- `substring` copies (since Java 7u6). `s.substring(i)` in a loop over `i` is O(n²).
- `indexOf`/`contains` are linear; for many searches in a large text, consider one pass with a `Matcher` or your own scan.
- `split` compiles a regex on every call for patterns longer than one non-meta character; in a hot loop, precompile with `Pattern.compile(...).split(s)`.
- `+` in a single expression is fine; `+=` in a loop is not.

## Common exceptions

- `StringIndexOutOfBoundsException` — `charAt`/`substring` with a bad index. Message: `begin 0, end 20, length 12`.
- `NullPointerException` — calling anything on a `null` reference.
- `NumberFormatException` — parsing non-numeric text. Message: `For input string: "4.2"`.
- `PatternSyntaxException` — a broken regex in `split`/`replaceAll`/`matches`, e.g. `split("(")`.

## Interview angle

- *"`"a,b,,".split(",")` length?"* 2 — trailing empties are dropped.
- *"`replace` vs `replaceAll`?"* Literal vs regex; both replace every occurrence.
- *"Is `substring` O(1)?"* Not since Java 7u6 — it copies.
- *"How do you reverse a string?"* `new StringBuilder(s).reverse().toString()` (next lesson), or a two-pointer loop over a `char[]`.

## Key takeaways

- `substring(begin, end)` — end is exclusive; `indexOf` returns −1, never throws.
- `replace` is literal; `replaceAll`/`split`/`matches` take regexes — escape `.` `|` `+` `*` `?`.
- `split` drops trailing empty strings; `trim().split("\\s+")` for whitespace.
- Pass `Locale.ROOT` to case conversions in programmatic text.
- Every method returns a new string — capture the result.

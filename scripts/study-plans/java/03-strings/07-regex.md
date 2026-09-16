---
title: Regular expressions in Java
minutes: 16
---
Regular expressions describe patterns in text: "one or more digits", "an email-shaped thing", "a word at the start of a line". Java's `java.util.regex` is a full-featured engine hiding behind a few `String` methods and two classes, `Pattern` and `Matcher`. This lesson covers the syntax you need, the API around it, and the three mistakes — unescaped metacharacters, `matches` versus `find`, and recompiling in loops — that account for most regex bugs.

## Where regexes appear

```java
s.matches("\\d+")               // whole string is one or more digits?
s.replaceAll("\\s+", " ")       // collapse whitespace
s.replaceFirst("^0+", "")       // strip leading zeros
s.split("[,;]\\s*")             // split on comma or semicolon plus optional spaces
Pattern.compile("…").matcher(s) // the full API
```

The pattern is written inside a Java string, so every regex backslash is doubled: the regex `\d+` is the Java literal `"\\d+"`.

## Syntax essentials

| Pattern | Matches |
| --- | --- |
| `.` | any character except newline |
| `\d` `\w` `\s` | digit, word char `[A-Za-z0-9_]`, whitespace |
| `\D` `\W` `\S` | the complements |
| `[abc]` `[a-z]` `[^0-9]` | character class, range, negated class |
| `^` `$` | start / end of input (or line, with `MULTILINE`) |
| `\b` | word boundary |
| `x*` `x+` `x?` | zero or more, one or more, zero or one |
| `x{3}` `x{2,5}` `x{2,}` | exact, range, at-least |
| `x*?` `x+?` | **lazy** versions — as few as possible |
| `a\|b` | alternation |
| `(…)` | capturing group |
| `(?:…)` | non-capturing group |
| `(?<name>…)` | named group |
| `(?i)` | case-insensitive flag inline |
| `\.` `\(` `\\` | escaped literals |

Metacharacters that must be escaped when meant literally: `. ^ $ * + ? ( ) [ ] { } | \`. Inside a character class only `\`, `]`, `^` (first) and `-` (not at an edge) are special.

## `Pattern` and `Matcher`

```java
import java.util.regex.*;

Pattern p = Pattern.compile("(\\w+)@(\\w+)\\.com");
Matcher m = p.matcher("mail ada@example.com or bob@test.com");

while (m.find()) {                       // next match anywhere in the input
    m.group()                            // "ada@example.com" — the whole match
    m.group(1)                           // "ada"
    m.group(2)                           // "example"
    m.start(), m.end()                   // indices of the match
}

m.reset();
m.matches()      // does the ENTIRE input match? false here
m.lookingAt()    // does the input START with a match? false here
```

The three verbs:

- `matches()` — the whole input must match. `"abc123".matches("\\d+")` is false.
- `find()` — search for the next occurrence anywhere. Call repeatedly.
- `lookingAt()` — anchored at the start, not the end.

`String.matches` is the `matches()` verb; there is no `String.find` — use a `Matcher`.

Groups are numbered by their opening parenthesis, left to right, starting at 1; `group(0)` is the whole match. Named groups: `m.group("user")`. A group that did not participate returns `null`.

## Replacing with groups

```java
"2026-09-16".replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$3/$2/$1")   // "16/09/2026"
"price: 10".replaceAll("\\d+", "<$0>")                              // "price: <10>"
```

In the replacement string `$1`, `$0` and `${name}` refer to groups, and `\` and `$` must be escaped (`Matcher.quoteReplacement(s)` does it) — a replacement containing a literal `$` is a common source of `IllegalArgumentException: Illegal group reference`.

For computed replacements:

```java
Matcher m = Pattern.compile("\\d+").matcher(text);
String doubled = m.replaceAll(r -> String.valueOf(Integer.parseInt(r.group()) * 2));   // Java 9+
```

## Greedy versus lazy

```java
"<b>bold</b> and <i>it</i>".replaceAll("<.*>", "")     // "" — greedy .* ate everything between the first < and the last >
"<b>bold</b> and <i>it</i>".replaceAll("<.*?>", "")    // "bold and it" — lazy stops at the first >
"<b>bold</b>".replaceAll("<[^>]*>", "")                // same, and faster: a negated class cannot overrun
```

Quantifiers are greedy by default; `?` after one makes it lazy. A negated character class (`[^>]*`) is often clearer and never backtracks past the delimiter.

## Performance and safety

- **Compile once.** `Pattern.compile` parses the regex; `String.matches`/`replaceAll`/`split` compile on every call. In a loop, hoist `static final Pattern P = Pattern.compile(...)`. `Pattern` is immutable and thread-safe; `Matcher` is not — create one per use.
- **Catastrophic backtracking.** Nested quantifiers like `(a+)+$` on a non-matching input take exponential time. Prefer possessive quantifiers (`a++`), atomic groups, or a simpler pattern. Never run a user-supplied regex on user-supplied input without a timeout.
- `Pattern.quote(literal)` escapes a string for use inside a pattern; `Matcher.quoteReplacement` for the replacement side.

## Flags

```java
Pattern.compile("^error", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
```

`CASE_INSENSITIVE` (inline `(?i)`), `MULTILINE` — `^`/`$` match at line boundaries (`(?m)`), `DOTALL` — `.` matches newlines too (`(?s)`), `UNICODE_CASE`, `COMMENTS` — whitespace and `#` comments allowed in the pattern (`(?x)`).

## Patterns worth memorising

```java
"\\d+"                          // integer
"-?\\d+(\\.\\d+)?"              // signed decimal
"[A-Za-z_][A-Za-z0-9_]*"        // Java-ish identifier
"\\s+"                          // whitespace run (for split)
"[^\\p{L}\\p{N}]+"              // anything not a letter or number (Unicode)
"(?i)^(yes|y|true)$"            // affirmative answer
"^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$"   // pragmatic email shape (not RFC-complete — nothing short is)
"\\b\\w+\\b"                    // words
```

`\p{L}` (letter), `\p{N}` (number), `\p{Lu}` (uppercase letter) are Unicode categories and are preferable to `[A-Za-z]` when input may be non-English.

## When not to use a regex

A regex is a tool for *patterns*. For "does it contain this literal", `contains`/`indexOf` is faster and clearer. For parsing nested structures (JSON, HTML, expressions) a regex is the wrong tool — the language is not regular. For simple splitting on one character, `split(",")` or `indexOf` loops. If a regex is longer than the line it lives on, break it into named pieces or write a small parser.

## Interview angle

- *"`"a.b".split(".")` returns?"* An empty array — `.` matches every character, all pieces are empty and trailing empties are dropped.
- *"`matches` vs `find`?"* Whole input vs anywhere.
- *"Why compile the pattern outside the loop?"* Compilation is the expensive part; `Pattern` is thread-safe and reusable.
- *"What is greedy matching?"* Quantifiers take as much as possible and backtrack; `?` after a quantifier makes it lazy.

## Key takeaways

- Double every backslash in the Java string; escape `. ( ) [ ] { } | + * ? ^ $` when literal.
- `matches` needs the whole string; `find` searches; groups are 1-based, `$1` in replacements.
- Greedy by default; lazy with `?`; negated classes beat `.*?` for delimiters.
- Hoist `Pattern.compile` out of loops; `Matcher` is per-use.
- `split`, `replaceAll`, `matches` take regexes; `replace` does not.

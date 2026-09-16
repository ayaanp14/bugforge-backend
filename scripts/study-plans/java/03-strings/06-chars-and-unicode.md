---
title: Characters, Unicode and encodings
minutes: 14
---
A Java `char` is not a character. It is a 16-bit UTF-16 *code unit*, and a `String` is a sequence of those units. For English text the distinction never shows; for an emoji, a Chinese name, or a file read with the wrong encoding, it decides whether your code is correct. This lesson gives you the model: code points versus code units, the `Character` utilities, and how bytes become strings.

## Code points and code units

Unicode assigns every character a number, its **code point**, from U+0000 to U+10FFFF — about 1.1 million possible, 150 000 assigned. UTF-16 stores code points up to U+FFFF (the *Basic Multilingual Plane*) in one 16-bit unit and the rest in **two** units called a *surrogate pair*.

```java
String s = "A€😀";
s.length()              // 4 — 'A' (1 unit), '€' (1 unit, U+20AC), '😀' (2 units, U+1F600)
s.codePointCount(0, s.length())   // 3 — the number of characters a human would count
s.charAt(2)             // '\uD83D' — the HIGH surrogate, half an emoji
s.codePointAt(2)        // 128512 (0x1F600) — the whole emoji
s.substring(2, 3)       // a broken string containing a lone surrogate
new StringBuilder(s).reverse()    // "😀€A" — reverse() keeps the pair together
```

Rules:

- `length()`, `charAt`, `substring`, `indexOf` work in **code units**. They are correct for BMP text and *can split a surrogate pair* for text beyond it.
- `codePoints()` (an `IntStream`), `codePointAt`, `codePointCount`, `offsetByCodePoints` work in **code points**.
- Emoji, many mathematical symbols, historic scripts and some CJK characters live outside the BMP. If your input might contain them, iterate by code point.

```java
for (int i = 0; i < s.length(); ) {
    int cp = s.codePointAt(i);
    // … handle cp …
    i += Character.charCount(cp);      // 1 or 2
}
s.codePoints().forEach(cp -> …);       // the stream form
```

Even a code point is not always a "character": `é` can be one code point (U+00E9) or two (`e` + combining acute U+0301). `java.text.Normalizer.normalize(s, Normalizer.Form.NFC)` composes such sequences; do this before comparing user-entered text.

## The `Character` class

Static utilities for classification and conversion — the `char` versions and the `int` (code point) versions:

```java
Character.isDigit('7')          // true — also Arabic-Indic digits etc.; for ASCII use c >= '0' && c <= '9'
Character.isLetter('é')         // true
Character.isLetterOrDigit(c)
Character.isWhitespace(' ')     // true for space, tab, newline…
Character.isUpperCase('A'), Character.isLowerCase('a')
Character.toUpperCase('a')      // 'A'
Character.toLowerCase('A')
Character.getNumericValue('7')  // 7; also works for 'a' → 10 (hex-style), and Unicode numerals
Character.digit('f', 16)        // 15; -1 if not a digit in that radix
Character.forDigit(11, 16)      // 'b'
Character.isSurrogate(c), Character.isHighSurrogate(c), Character.isLowSurrogate(c)
Character.charCount(cp)         // 1 or 2
Character.toChars(cp)           // char[] for a code point
Character.MAX_VALUE             // '\uFFFF'
```

`Character.isDigit` is Unicode-aware, which is usually right for users and wrong for parsers: `Integer.parseInt` accepts only what `Character.digit` accepts, which includes non-ASCII digits. For strict ASCII checks compare ranges.

The `c - '0'` trick from Module 2 is safe only for ASCII digits; `Character.getNumericValue` is the general form.

## Encodings: bytes ↔ strings

A `String` is characters; a file, a socket, or an HTTP body is **bytes**. An *encoding* (charset) maps between them:

| Charset | Bytes per char | Notes |
| --- | --- | --- |
| **UTF-8** | 1–4 | ASCII-compatible; the web and Linux default; **use this** |
| UTF-16 | 2 or 4 | Java's in-memory form; BOM issues in files |
| ISO-8859-1 (Latin-1) | 1 | Western Europe; every byte is a valid char |
| US-ASCII | 1 | 7-bit; anything else becomes `?` |
| Windows-1252 | 1 | The Windows Western default; superset of Latin-1 |

```java
byte[] bytes = "héllo".getBytes(StandardCharsets.UTF_8);   // 6 bytes: é is 2
String back = new String(bytes, StandardCharsets.UTF_8);   // "héllo"
String wrong = new String(bytes, StandardCharsets.ISO_8859_1);   // "hÃ©llo" — mojibake
```

**Always name the charset.** `getBytes()` and `new String(bytes)` with no argument use the *platform default*, which was Windows-1252 on Windows and UTF-8 on Linux — the classic "works on my laptop, garbage on the server". Since **Java 18** (JEP 400) the default is UTF-8 everywhere, but the no-argument forms remain a smell because code is compiled for many versions.

The same applies to readers and writers: `new InputStreamReader(in, StandardCharsets.UTF_8)`, `Files.readString(path)` (UTF-8 by default), `Files.newBufferedReader(path, charset)`.

`String.length()` is **not** the byte length. A 10-character string can be 10, 20 or 40 bytes. Database column limits, HTTP `Content-Length` and buffer sizes are in bytes; compute them from `getBytes(charset).length`.

## Escapes for characters

```java
char tab = '\t';
char quote = '\'';
char unicode = '\u00E9';        // é
char emojiHigh = '\uD83D';      // half of 😀 — a char cannot hold the whole thing
String emoji = "\uD83D\uDE00";  // both halves; or just paste 😀 into a UTF-8 source file
int cp = 0x1F600; String e = new String(Character.toChars(cp));
String e2 = Character.toString(cp);   // Java 11+
```

`\uXXXX` escapes are processed by the compiler *before* tokenising, anywhere in the source — including comments. `// \u000a int x;` puts `int x;` on a new line after the comment, outside it. A curiosity, but a real one.

## `char` arithmetic, revisited

`char` is an unsigned 16-bit number: `'a' + 1` is the `int` 98; `(char) ('a' + 1)` is `'b'`; `'z' - 'a'` is 25; `(char) (c ^ 32)` flips ASCII case. Comparisons `c >= 'a' && c <= 'z'` are numeric. A `char` in a `switch` is fine. A `char` added to a `String` concatenates; a `char` added to an `int` is arithmetic — `"" + 'a' + 1` is `"a1"`, `'a' + 1 + ""` is `"98"`.

## Sorting and comparing non-ASCII text

`compareTo` orders by code unit, so `"Zebra" < "apple"` and `"é" > "z"`. For human ordering use `java.text.Collator`:

```java
Collator c = Collator.getInstance(Locale.FRENCH);
list.sort(c);       // é sorts with e, case handled sensibly
```

`equalsIgnoreCase` and `toLowerCase(Locale.ROOT)` are fine for identifiers and keywords; for names, normalise (NFC) first and use a collator.

## Interview angle

- *"What is the length of a string containing one emoji?"* 2 — a surrogate pair. `codePointCount` gives 1.
- *"Difference between `char` and code point?"* A `char` is a UTF-16 code unit; a code point is the Unicode character number and may need two units.
- *"Why must you specify a charset?"* The default varied by platform before Java 18; bytes decoded with the wrong charset are corrupted.
- *"How many bytes is `"é"` in UTF-8?"* 2. In UTF-16, 2. In Latin-1, 1.

## Key takeaways

- `char` = UTF-16 code unit; characters beyond U+FFFF take two. Use `codePoints()` when input may contain them.
- `Character.isDigit`/`isLetter` are Unicode-aware; use range checks for strict ASCII.
- Always pass a `Charset` (`StandardCharsets.UTF_8`) when converting bytes ↔ text.
- `length()` counts units, not bytes or user-perceived characters.
- `Collator` for human sorting; `Normalizer` before comparing accented input.

---
title: Checkpoint — Strings
minutes: 25
seo-title: Java Strings Quiz: String Pool, StringBuilder and Regex Test
description: Fifteen questions and two programs on Java strings: immutability, equals versus ==, split and substring, StringBuilder, printf, Unicode and regex.
q: What does `"a,b,,".split(",")` return in Java?
a: An array of two strings, `a` and `b`: `split` drops trailing empty strings unless it is given a negative limit. `"a.b".split(".")` returns an empty array, because `.` is a regex that matches every character.
q: When is `==` on two strings true in Java?
a: Only when both references point to the same object. Identical literals and compile-time constant expressions share one pooled string, so `==` is `true` for them; strings built at run time are separate objects, which is why content is always compared with `equals`.
q: Which end of `substring(begin, end)` is exclusive?
a: The end. `substring(begin, end)` includes the character at `begin` and stops before `end`, so the result has `end - begin` characters: `"Hello".substring(1, 3)` is `el`.
---
This checkpoint covers immutability and the string pool, comparison, the core API, `StringBuilder`, formatting and text blocks, characters and encodings, and regular expressions.

**How it works.** Fifteen questions and two programs; 70% on the questions and both programs accepted clears the module. Retake as often as you like — the best score counts.

**Before you start**, check these are automatic:

- What `s.toUpperCase();` on its own line does (nothing you can see).
- When `==` on two strings is true, and why you still use `equals`.
- The result of `"a,b,,".split(",")` and of `"a.b".split(".")`.
- `substring(begin, end)` — which end is exclusive.
- Why `+=` in a loop is slow and what to use instead.
- `%5d`, `%-5s`, `%05d`, `%.2f`, `%,d`.
- The length of a string holding one emoji.
- `replace` versus `replaceAll`; `matches` versus `find`.

The programs are string manipulation classics — one is about building output efficiently and correctly, the other about parsing structured text with the right tool.

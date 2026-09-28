---
title: Checkpoint — Strings and text
minutes: 25
seo-title: Python Strings Quiz: Slicing, F-Strings, Unicode and Regex
description: Test your Python string skills with 12 questions and three programs on slicing, string methods, f-strings, Unicode and bytes, parsing and regular expressions.
q: What is `"abcdef"[1:5:2]` in Python?
a: It is `"bd"`: the slice starts at index 1, stops before index 5 and takes every second character, so it picks indexes 1 and 3. A step of -1, as in `[::-1]`, takes every character from the end and reverses the string.
q: Why is `"file.txt".strip(".txt")` wrong?
a: `strip` treats its argument as a set of characters to remove from both ends, not as a suffix, so it also strips any `t`, `x` or `.` at the edges; here it returns `"file"` only by luck. Use `"file.txt".removesuffix(".txt")`, available since Python 3.9.
q: What do `f"{42:06d}"`, `f"{3.14159:.2f}"` and `f"{'ab':>5}"` produce?
a: `000042`, `3.14` and `ab` preceded by three spaces: an integer zero-padded to six characters, a float rounded to two decimals, and a string right-aligned in a field five characters wide.
q: What is the difference between `len("é")` and `len("é".encode())`?
a: `len("é")` is 1, because a `str` counts Unicode code points; `len("é".encode())` is 2, because UTF-8 encodes `é` in two bytes. A string's length is never its size in bytes.
---
This checkpoint covers the whole module: strings as immutable sequences of code points, slicing and the method set, f-strings and the format-spec mini-language, characters and the text/bytes boundary with the three digit tests, the parsing shapes for tokens, fields, `key=value` pairs, records and blocks, and regular expressions with groups, substitution and the greedy rule.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What is `"abcdef"[1:5:2]`, and what does `[::-1]` do?
- Why is `"file.txt".strip(".txt")` wrong, and what is right?
- What do `f"{42:06d}"`, `f"{3.14159:.2f}"` and `f"{'ab':>5}"` produce?
- What is the difference between `len("é")` and `len("é".encode())`?
- Which of `isdecimal`, `isdigit`, `isnumeric` accepts `"²"`, and which accepts `"-1"`?
- What does `partition("=")` return when the separator is absent?
- What is the difference between `re.match` and `re.search`, and what do they return when nothing matches?

The three programs are a text-statistics report built from the method set and formatted as a table, a `key=value` configuration parser with typed values and clear rejections, and a log extractor that pulls timestamps, levels and messages out of free text with named groups.

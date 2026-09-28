---
title: Checkpoint — Streams and files
minutes: 25
seo-title: C++ I/O Quiz: cin, getline, fstream and filesystem Practice
description: Test your C++ I/O with 14 questions and three programs on stream state, getline after cin, open modes, stringstream reuse, binary records and std::filesystem.
q: After `std::cin >> x` fails on `abc`, what is in `x`?
a: `x` holds `0`, because characters were examined and could not form a number; `abc` is still unread in the buffer; and `failbit` is set. Call `std::cin.clear()`, then discard the bad token with `ignore` or a string read, and the stream reads again.
q: What does opening an existing file with std::ofstream do?
a: The default mode truncates it to empty, so every run starts a fresh file. Open it with `std::ios::app` to keep the existing contents and add every write to the end.
q: Why must a `directory_iterator` listing be sorted?
a: `std::filesystem::directory_iterator` yields entries in an unspecified order — whatever the operating system returns — so the same directory can list differently on another machine. Collect the names into a vector and sort them before printing when the output must be deterministic.
---
This checkpoint covers the whole module: stream state and recovery from a bad token, the character-level API, the reading-pattern catalogue, file streams and open modes, string streams with `std::quoted` and `std::format`, binary records and `std::filesystem`.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does a stream's `operator bool` test, and why can `eof()` be true after a successful read?
- After `std::cin >> x` fails on `abc`, what is in `x`, where is `abc`, and which two steps get the stream reading?
- Why must `std::cin.ignore(...)` follow `std::cin >> n` before the first `std::getline`?
- What does `std::ofstream out("f.txt")` do to an existing file, and which mode adds to it instead?
- Why does `in.str(next)` on a used `std::istringstream` still fail, and what fixes it?
- Why is `sizeof` a struct of an `int32_t` and a `double` 16 rather than 12?
- Why must a `directory_iterator` listing be sorted before it is printed?

The three programs are a variable-field records reader, a `std::format` table with dynamic widths, and an inventory file written, measured, read back through a `std::map` and removed.

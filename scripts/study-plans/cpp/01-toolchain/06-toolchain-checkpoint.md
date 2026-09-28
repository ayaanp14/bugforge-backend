---
title: Checkpoint — C++ and the toolchain
minutes: 25
seo-title: C++ Basics Quiz: Compiling, Linking and Console I/O Practice
description: Test your C++ fundamentals with 15 questions and three programs on the compile and link pipeline, program structure, cin and getline, and compiler errors.
q: Which build stage reports `undefined reference`?
a: The linker. The preprocessor turns `#include` into pasted text and the compiler checks each translation unit on its own; only the linker notices that a declared and used symbol has no definition in any object file.
q: What does `main` return when it has no `return` statement?
a: `main` alone may fall off its closing brace, and doing so returns 0, which means success. Any non-zero exit code means failure, and a judge marks it as a runtime error even when the printed output is right.
q: How does `while (std::cin >> x)` know when to stop?
a: `std::cin >> x` returns the stream, and a stream converts to `false` once a read has failed — at the end of the input, or on text that cannot form the value. The loop therefore ends exactly when the input does, with no count or sentinel needed.
---
This checkpoint covers the whole module: what C++ is and the decisions behind it, the four-stage pipeline from source to executable, the anatomy of a program, console input and output, and reading what the compiler says.

**How it works.** Fifteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which stage of the build turns `#include` into text, and which one reports `undefined reference`?
- What is a translation unit, and why is a header never compiled on its own?
- What does `main` return when it falls off its closing brace, and what does a non-zero exit code mean to the judge?
- Why does `std::getline` right after `std::cin >> n` return an empty line, and what is the fix?
- How does `while (std::cin >> x)` know when to stop?
- What is the difference between `'\n'` and `std::endl`?

The three programs use lesson 4's reading patterns — a token, lines until the input ends, and a count followed by alternating lines and tokens. Read each input format carefully; most failed submissions here are reading problems, not logic problems.

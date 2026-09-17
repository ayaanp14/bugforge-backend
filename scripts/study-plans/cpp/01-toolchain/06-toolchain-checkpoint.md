---
title: Checkpoint — C++ and the toolchain
minutes: 25
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

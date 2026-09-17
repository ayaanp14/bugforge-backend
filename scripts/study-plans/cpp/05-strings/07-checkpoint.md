---
title: Checkpoint — Strings
minutes: 25
---
This checkpoint covers the whole module: `std::string` as a value type, the `find` family and `npos`, slicing and replacing, characters as small integers and the `<cctype>` cast, `stoi` and `std::from_chars`, splitting and validating input, manipulators and `std::format`, and `std::string_view` with its lifetime rule.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `std::string::find` return when nothing matches, and how do you test for it?
- Why must a `char` be cast to `unsigned char` before calling `std::isalpha`?
- What is the difference between `std::stoi("42abc")` and `std::from_chars` on the same text?
- Which stream manipulators are sticky, and which one applies to the next insertion only?
- What does `std::setprecision(2)` print for `1234.5` without `std::fixed`?
- When does a `std::string_view` dangle, and what is the one rule that prevents it?
- Why does a replace-all loop advance by the replacement's length rather than the match's?

The three programs are a word-frequency count, a fixed-width report and a run-length codec; get the reading idiom right before the logic.

---
title: Checkpoint — Strings
minutes: 25
seo-title: C++ Strings Quiz: find, stoi, Formatting and String View
description: Test your C++ string skills with 14 questions and three programs on find and npos, substr, char conversions, stoi, parsing input, formatting and string view.
q: What does `std::string::find` return when nothing matches?
a: It returns `std::string::npos`, the largest `std::size_t`. Test with `pos != std::string::npos`; `find(x) >= 0` is always true, because the result is unsigned.
q: What is the difference between `std::stoi("42abc")` and `std::from_chars` on the same text?
a: `std::stoi("42abc")` returns 42 and ignores the rest unless you check how many characters it consumed. `std::from_chars` also parses 42 but leaves `ptr` pointing at the `a`, so testing `ptr == last` reports that the whole token was not a number.
q: What does `std::setprecision(2)` print for `1234.5` without `std::fixed`?
a: It prints `1.2e+03`. Without `std::fixed` the precision counts significant digits, and two significant digits of 1234.5 need scientific notation. With `std::fixed` the same setting prints `1234.50`.
q: Why does a replace-all loop advance by the replacement's length rather than the match's?
a: So the next search starts after the text just inserted. If the replacement contains the search string — replacing "a" with "aa" — restarting at the match position finds the insertion again and the loop never ends.
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

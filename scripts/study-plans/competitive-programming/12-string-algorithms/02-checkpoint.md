---
title: Checkpoint — String algorithms
minutes: 60
seo-title: KMP and String Hashing Quiz: Prefix Function Practice Test
description: A timed practice test on string algorithms in C++: the KMP prefix function, the Z-function, rolling hashes and collisions, and a border-and-period program.
q: How do you find the smallest period of a string with KMP?
a: Compute the prefix function and take b = pi[n − 1], the longest border. The smallest period is p = n − b: shifting the string by p lines every character up with an equal one. The string is a whole number of copies of its first p characters exactly when p divides n.
q: Why use two moduli for string hashing?
a: With one modulus near 10^9, two different strings collide with probability about 1/p each, and among 10^5 substrings the birthday bound makes some collision likely; fixed bases can also be attacked by crafted tests. Two independent moduli multiply the probabilities, around 10^-18 per pair.
---
A timed checkpoint on the module: building and using the prefix function, KMP matching, the Z-function's box, rolling hashes and their collisions, and borders and periods.

**How it works.** Sixty minutes from the moment you start the timer: ten questions and one program. 70% on the questions and the program accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- The prefix function of `aabaaab`, and what `pi[n − 1]` means.
- Where `j` falls back to after a full match in KMP, and why the text index never moves back.
- What the Z-function's box `[l, r)` lets you skip.
- How to read the hash of `s[l..r)` from prefix hashes, and why one modulus is not enough.

The program prints a string's longest border, its smallest period and how many times that period repeats.

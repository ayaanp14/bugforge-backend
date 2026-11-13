---
title: Checkpoint — Bit manipulation
minutes: 45
seo-title: Bit Manipulation Practice Test for Competitive Programming
description: A timed 45-minute check on bitmasks: set, clear, toggle and test bits, XOR pairs, popcount, subset masks, and a per-bit counting problem in C++.
q: What does the bit manipulation checkpoint test?
a: The one-line bit operations and their pitfalls, XOR cancelling pairs, popcount and the lowest-bit tricks, reading a mask as a subset, and one program — the total Hamming distance of every pair — judged at contest limits.
---
The bit manipulation checkpoint. It is timed: **45 minutes** from when you start it.

**What it covers.** Setting, clearing, toggling and testing bits; `x & (x − 1)` and `x & −x`; `1LL << i` past bit 30; XOR's cancelling pairs; popcount; and walking every subset as a mask.

**How it works.** Eleven questions and one program. Clear 70% of the questions and get the program accepted. Its hidden cases hold thousands of numbers, so comparing every pair is far slower than counting one bit position at a time.

**Before you start**, make sure you can say from memory:

- the expression for each of set, clear, toggle and test;
- which elements mask 13 selects;
- how many pairs differ in a bit where c of the n numbers have a 1.

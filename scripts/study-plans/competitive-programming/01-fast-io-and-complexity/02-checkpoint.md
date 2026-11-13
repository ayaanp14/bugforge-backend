---
title: Checkpoint — Fast I/O and complexity budgets
minutes: 45
seo-title: Complexity Budget Practice Test for Competitive Programmers
description: A timed 45-minute check: match constraints to the complexity that passes in one second, spot int overflow, and solve a query problem within budget in C++.
q: How long is this checkpoint?
a: Forty-five minutes from the moment you start its timer. Answers sent after the clock runs out do not clear the checkpoint, the way a contest stops accepting submissions at the end.
---
The first timed checkpoint of the track. Like a contest round, it has a clock: **45 minutes** from when you start it.

**What it covers.** Turning a constraint into a complexity budget at about 10⁸ operations per second, the contest template's fast-I/O lines, and `long long` against overflow.

**How it works.** Eleven questions and one program. Clear 70% of the questions and get the program accepted — its hidden cases are at the limits, so an O(n · q) scan runs out of time where an O((n + q) log n) one passes.

**Before you start**, make sure you can say from memory:

- the slowest complexity that fits n ≤ 20, 400, 5000, 10⁶ and 10¹⁸;
- what `1LL * a * b` fixes;
- why `endl` is slow and what `cin.tie(nullptr)` removes.

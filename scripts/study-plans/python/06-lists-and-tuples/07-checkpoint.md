---
title: Checkpoint — Lists, tuples and sequences
minutes: 25
seo-title: Python Lists and Tuples Quiz: Sorting, Grids and deque Test
description: Test your Python lists, tuples and sequences with 12 questions and three programs on copying, comprehensions, multi-key sorting, unpacking, grids and deque.
q: After `b = a.copy()` for a list of lists, what is shared?
a: The inner lists. `copy()` is shallow: `b` is a new outer list holding references to the same row objects, so `b[0].append(9)` also changes `a[0]`. Rebinding `b[0] = [0]` leaves `a` alone, and `copy.deepcopy(a)` shares nothing.
q: Why does sorting by name and then by score descending give score-then-name order?
a: Python's sort is stable, so the second sort, by score, keeps rows with equal scores in the order the first sort left them — alphabetical by name. Sorting by the secondary key first and the primary key last composes a multi-key order, even with `reverse=True`.
q: What does `first, *rest = [1]` bind?
a: `first` is 1 and `rest` is an empty list. A starred target collects whatever is left over as a list, and that list may be empty; Python raises `ValueError` only when a plain target has no value left to take.
---
This checkpoint covers the whole module: lists and their method costs, aliasing and shallow versus deep copies, comprehensions in list, set, dict and generator form, sorting with keys and stability and `bisect`, tuples and unpacking with `namedtuple`, grids with neighbours, transposes and the multiplication trap, and the sequence tools with `deque` and the sequence protocol.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which list operations are O(1) and which are O(n), and what replaces `pop(0)`?
- After `b = a.copy()` for a list of lists, what is shared?
- What is the difference between `[x for x in xs if c]` and `[x if c else y for x in xs]`?
- Why does `rows.sort(key=name); rows.sort(key=score, reverse=True)` give score-then-name order?
- What does `first, *rest = [1]` bind?
- Why is `[[0] * C] * R` wrong, and what is right?
- Which two methods make a class usable with `len`, indexing, iteration and `in`?

The three programs are an inventory that is edited, sorted by several keys and reported in aligned columns, a grid simulation that counts live neighbours with a direction list and a bounds check, and a sliding-window statistics tool built on a bounded `deque`.

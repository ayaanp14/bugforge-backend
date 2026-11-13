---
title: Checkpoint: Expense sharing
minutes: 25
seo-title: Splitwise LLD Quiz: Split Strategies and Settle Up Practice
description: Practise the Splitwise machine-coding problem: ten questions on splits, money in paise and debt simplification, and a Java ledger with a fourth split rule.
q: How do you add a new split type to an expense sharing app?
a: Write one more class that implements the Split interface, such as a SharesSplit that divides by weights like 2 : 1 : 1. Expense and BalanceSheet call the interface and never change: the open/closed principle at work.
q: Is the greedy debt simplification optimal?
a: Not always. It needs at most n - 1 payments, but the true minimum number of transfers can be lower when a group of debts cancels inside a subset of members; finding that minimum is NP-hard, so greedy is the practical answer.
q: How do you check an expense ledger is consistent?
a: Assert that the members' net balances add up to zero after every expense and every payment. Money only moves between members, so any other total means a split or rounding bug.
---
This checkpoint covers the module: split rules as strategies, money in paise, balances that always add up to zero, and the greedy settle-up.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module. Retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why is a `double` the wrong type for money, and what replaces it?
- Where do leftover paise go in an equal split, and in a percent split?
- When does a split refuse its input, and what must not happen before it does?
- Which two members does each greedy settle step pick, and how much moves?
- What changes in the code when a new split rule is added?

The program adds a fourth rule, shares by weight, to the three you have written. If the Split interface is right, it is one more class; if it is not, you will feel it now.

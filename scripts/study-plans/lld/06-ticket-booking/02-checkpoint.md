---
title: Checkpoint: Movie ticket booking
minutes: 25
seo-title: BookMyShow LLD Quiz: Seat Holds, Locks and Pricing Practice
description: Practise the movie ticket booking machine-coding problem: ten questions on seat state, holds, payments and locking, and a Java program with optimistic versions.
q: How do you stop two users booking the same seat?
a: Let one conditional write decide. With optimistic locking each seat carries a version, and a hold succeeds only if the version is still the one the buyer read; with pessimistic locking the seat row is locked with `SELECT ... FOR UPDATE` first. A unique constraint on (show, seat) is a backstop.
q: What is optimistic locking in a booking system?
a: Reading a seat also reads its version number. The write that holds it says "only if the version is still N" and raises it to N + 1; a second buyer who read N too finds the version moved and changes nothing, so exactly one of them wins.
q: Why is an in-memory lock not enough for seat booking?
a: A real booking service runs on several servers, and a `synchronized` block or Java lock only guards one process. The decision has to be made where every server sees it: in the database, with a conditional update or a row lock.
---
This checkpoint covers the module: ShowSeat and its states, all-or-none holds that expire, payments that confirm or release, pricing as a Strategy, and how two buyers racing for one seat are kept apart.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module. Retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which object holds a seat's status, and why not Seat?
- What makes a lapsed hold read as available without a timer?
- What happens to held seats when a payment fails, and when it succeeds after the hold lapsed?
- How does a version number let exactly one of two buyers win?
- Where does a pricing rule live, so a new one changes no booking code?

The program is the race itself: buyers read a seat's version and then try to write, and a write with a stale version loses. Trace the example by hand first; the case most people miss is a buyer whose own earlier write made their read stale.

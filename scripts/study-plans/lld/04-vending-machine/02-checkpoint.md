---
title: Checkpoint — Vending machine
minutes: 35
seo-title: Vending Machine LLD Quiz: State Pattern and Change-Making
description: Practise vending machine design: ten questions on the State pattern, sold-out handling and change-making, plus a coin box greedy cannot always pay from.
q: Why does greedy change fail in a real vending machine?
a: Greedy assumes an unlimited supply of every coin. A real box runs out: paying 6 from one 5 and three 2s, greedy takes the 5 and is stuck, while 2+2+2 works. The machine must search the combinations it can actually pay, or refuse the sale.
q: What should a vending machine do when it cannot give change?
a: Refuse the sale before dispensing: return the coins the customer inserted, keep the item, and go back to Idle. Checking the change before the item drops means no customer is ever short-changed.
---
This checkpoint covers the module: the State pattern and its transitions, coins rejected before any state sees them, sold-out slots versus a sold-out machine, restocking, and making change.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module.

**The program** is the hardest in this track so far. The machine now pays change from a coin box holding a limited number of each coin, and inserted coins wait in escrow until a sale. Before you code, decide:

- Which state owns the "can I pay the change?" check, and what happens to the escrow if the answer is no?
- How do you find the fewest coins when greedy can fail? (The amounts are small — a search over counts is fine.)
- What does a cancel return: a greedy refund, or the coins the customer actually inserted?

Hidden cases make change from the customer's own coins, refuse a sale for want of change, and empty the machine.

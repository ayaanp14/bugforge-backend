---
title: Vending machine
minutes: 12
seo-title: Vending Machine in Java: State Pattern, Change and Sold Out
description: Code a vending machine in Java with the State pattern: Idle, HasMoney and OutOfStock classes, greedy change from 10, 5, 2 and 1, cancel refunds and restocking.
question: How do you implement a vending machine with the State pattern in Java?
answer: Give the machine a `State` field and an interface with one method per event: insert, select, cancel. Idle, HasMoney and OutOfStock each implement it, answer the event their own way and move the machine to the next state. The machine itself holds only the balance and the items, and delegates every event to its current state.
q: Why not use a status field and if-else for a vending machine?
a: Every event would need a branch for every status, so adding a state such as Maintenance edits every method. With the State pattern each state is one class answering every event, and a new state is a new class plus the transitions into it.
q: How does a vending machine give change?
a: It takes the largest coin that fits the remaining amount, again and again. For the coins 10, 5, 2 and 1 this greedy rule gives the fewest coins, but not for every coin set; with only the coins actually in the box, a search over combinations is needed.
q: What happens when a vending machine is out of stock?
a: When the last item is sold the machine moves to an OutOfStock state, which returns any coin inserted at once and refuses every selection. Restocking a slot moves it back to Idle.
q: Should Dispensing be a separate state?
a: In a real machine yes, because coins and buttons can arrive while the motor turns, and Dispensing must refuse them. In a single-threaded program the sale finishes inside one call, so the exercises fold it into the selection and go straight to Idle or OutOfStock.
---
The textbook case for the **State pattern**: a coin means *start a sale* in one state, *add to the balance* in another and *give it back* in a third. The full design, with a sequence diagram and code in four languages, is the note [Design a Vending Machine](/notes/low-level-design/design-a-vending-machine).

## One class per state

- `VendingMachine` holds the **items** (code, name, price, stock), the **balance** and the **current state** — and no if-chain on a status.
- `interface State { insert, select, cancel }`, implemented by **Idle**, **HasMoney** and **OutOfStock**.
- Each state answers the event *and* decides the transition: `machine.move(next)`.
- States hold no data of their own, so one shared instance of each is enough.

@figure state-run

| | INSERT | SELECT | CANCEL |
| --- | --- | --- | --- |
| Idle | add, → HasMoney | "insert coins first" | nothing to return |
| HasMoney | add | sell if paid, → Idle or OutOfStock | refund, → Idle |
| OutOfStock | return the coin | "sold out" | nothing to return |

A coin the machine does not accept (only 1, 2, 5 and 10) is rejected before any state sees it.

```game
type: order
title: One purchase, state by state
prompt: Put the steps of buying an item that costs 15 with two coins of 10 in order.
- The machine waits in Idle
- A 10 moves it to HasMoney with balance 10
- Selecting the item answers "need 5 more" and stays in HasMoney
- A second 10 raises the balance to 20
- The item drops with change 5
- It moves to Idle, or to OutOfStock if that was the last item
why: Only a coin leaves Idle, only a paid selection ends HasMoney, and the sale ends in Idle unless every slot is now empty.
```

## Making change

@figure change-making

- **Greedy**: the largest coin that fits, repeat. For 10, 5, 2, 1 it gives the fewest coins.
- It is not optimal for every coin set, and a real box holds a **limited** number of each coin: then greedy can fail where an answer exists (6 from one 5 and three 2s is 2 + 2 + 2). The checkpoint makes you handle that.

## Sold out, twice

- A **slot** with stock 0 refuses its selection; the balance stays.
- When **every** slot is empty, the machine is in OutOfStock and hands coins straight back. `REFILL` moves it back to Idle.

## The traps

- `if (state == HAS_MONEY) … else if …` in every method: adding a state edits them all.
- Changing state from *outside* the states: transitions scattered over the machine are the if-chain again.
- Forgetting the balance on a refused selection: an underpaid or sold-out choice keeps the money in.

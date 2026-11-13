---
title: Expense sharing: splits, balances and settling up
minutes: 14
seo-title: Splitwise Machine Coding in Java: Splits and Settle Up
description: Code a Splitwise-style expense sharing app in Java: money in paise, equal, exact and percent splits as strategies, net balances and a greedy settle-up.
question: How do you code an expense sharing app like Splitwise in a machine-coding round?
answer: Keep money in integer paise, one net balance per member, and each split rule (equal, exact, percent) as a strategy that turns an amount into shares and validates its own input. An expense adds the amount to the payer and subtracts each share. Settling repeatedly has the largest debtor pay the largest creditor until every balance is zero.
q: Why store money in paise instead of a double?
a: A `double` cannot hold 0.1 exactly, so sums of rupee amounts drift by fractions of a paisa and balances stop adding up to zero. A `long` of paise is exact; parse "12.50" into 1250 and format it back only when printing.
q: Where do the leftover paise go in an equal split?
a: 100 rupees among three is 3333 paise each with 1 paisa left over. Give the leftover units to the first members, one each, so the shares add up to the amount exactly; any fixed rule works as long as nothing is lost.
q: How does the greedy settle-up work?
a: Take the member owed the most and the member who owes the most; the debtor pays the smaller of the two amounts, which brings at least one of them to zero. Repeat until all balances are zero. It needs at most n - 1 payments for n members.
q: Why must a group's balances always add up to zero?
a: Every expense adds its amount to the payer and subtracts the same amount, split into shares, from the members. Money is moved, never created, so the sum stays zero; asserting it after each expense catches a rounding or split bug at once.
---
An expense app is a ledger with one invariant: **money is moved, never created**, so a group's balances always add up to zero. The round tests the split rules, the money arithmetic and the settle-up. The [expense sharing note](/notes/low-level-design/design-an-expense-sharing-app) has the full design; this lesson is the code.

## The classes

- **Member**: a name. **BalanceSheet** holds one net balance per member: positive means the group owes them.
- **Split** (interface): `int[] shares(long amount, …)`, one class per rule: `EqualSplit`, `ExactSplit`, `PercentSplit`. Each **validates its own input** before any balance moves. This is the [Strategy pattern](/notes/oop/design-patterns).
- **Expense**: payer, amount, split. Applying it: payer `+amount`, every share `-share`, the payer's own share included.

## Money in paise

- `12.50` is read as `1250`, a `long`. Never a `double`: 0.1 has no exact binary form and the sums drift.
- An equal split of 100.00 among three is 33.34, 33.33, 33.33: the leftover paisa goes to the first member.
- A percent split floors each share; the leftover goes to the first member.
- Print with two decimals at the very end, and only there.

## Settling up

1. Find the member owed the most and the member who owes the most (ties by name, so the output is fixed).
2. The debtor pays the smaller of the two amounts; at least one reaches zero.
3. Repeat until every balance is zero: at most n - 1 payments.

@figure settle-greedy

Greedy is not always the true minimum (that problem is NP-hard), but it is short, fast and never needs more than n - 1 transfers.

## The traps

- **Pairwise debts.** Tracking "A owes B" for every pair is fine for display, but settling needs only the net balances.
- **Validation after the update.** An exact split that does not add up must be refused before any balance changes, or the ledger is left half-applied.
- **Rounding by accident.** `amount / n` drops paise; hand them out on purpose.

```game
type: pick
title: Settle the group
prompt: Each round gives net balances in rupees. Pick the first payment the greedy rule makes.
? asha +400, ben -100, chen -300
* chen pays asha 300
- ben pays asha 100
- chen pays asha 400
> The largest debtor pays the largest creditor the smaller amount: 300.
? ira +250, jo +250, ken -500
* ken pays ira 250
- ken pays jo 250
- ken pays ira 500
> The creditors tie at 250, so the earlier name, ira, is paid first; ken owes 500 but ira is owed only 250.
? A split of 10.00 among three members, equal.
* 3.34, 3.33, 3.33
- 3.33, 3.33, 3.33
- 3.33, 3.33, 3.34
> 1000 paise is 333 each with 1 left over, and the leftover goes to the first member.
? An EXACT split of 50.00 lists shares of 20.00 and 20.00.
* Refused, and no balance changes
- Applied, with 10.00 left to the payer
- Applied, scaled up to 25.00 each
> An exact split must add up to the amount; the strategy validates before anything moves.
```

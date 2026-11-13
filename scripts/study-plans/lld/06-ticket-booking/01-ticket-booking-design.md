---
title: Movie ticket booking: holds, payments and the race
minutes: 14
seo-title: Movie Ticket Booking System in Java: Seat Holds and Pricing
description: Code a BookMyShow-style booking system in Java: ShowSeat state, all-or-none holds that expire, payment that confirms or releases, and pricing as a Strategy.
question: How do you code a movie ticket booking system in a machine-coding round?
answer: Keep one ShowSeat per seat per show with a status (available, held or booked), the holder and a hold expiry. A hold takes all the chosen seats or none, for a fixed time; a successful payment marks them booked, a failed one releases them at once, and a lapsed hold simply reads as available. Pricing sits behind a Strategy.
q: Why does a booking system hold seats before taking payment?
a: So nobody pays for a seat that is already gone. The hold reserves the seats for a few minutes while the payment runs; success books them, failure releases them, and an abandoned checkout lapses on its own when the hold expires.
q: How do you expire a seat hold without a background job?
a: Store the expiry time on the seat and treat a HELD seat whose expiry has passed as available whenever it is read. No timer has to fire; a cleanup job can still tidy the rows later, but correctness never depends on it.
q: Why must a multi-seat hold be all or none?
a: A buyer who asked for two seats together does not want one of them. Check every seat first and change none if any is taken; changing seats one by one would leave a half-held booking when a later seat fails.
q: What should happen if a payment succeeds after the hold has lapsed?
a: Confirm only seats that are still held by this buyer; if the hold lapsed, the seats may already belong to someone else, so the booking fails and the money is refunded. The exercise prints that as "has no active hold".
---
A booking system sells a contested resource: one seat, one show, one buyer. The machine-coding version tests three things: the **seat state**, the **hold that expires**, and keeping rules such as pricing out of the core. The [movie ticket booking note](/notes/low-level-design/design-a-movie-ticket-booking-system) has the whole design, including the database locks; here you build the in-memory model.

## The classes

- **Seat**: physical, never changes (`A1`, row and number).
- **ShowSeat**: one seat *for one show*: `status` (AVAILABLE, HELD, BOOKED), `holder`, `heldUntil`. All the action is here, not on Seat.
- **Show**: the seat map, in layout order, with `hold`, `pay` and `show`.
- **PricingStrategy**: `price(seat)`, swapped per show: weekday, weekend, matinee.

## The flow, as commands

1. `HOLD user seats…`: check every seat first; if all are free, hold them all until `now + hold`.
2. `PAY user ok`: the user's still-held seats become BOOKED.
3. `PAY user fail`: they are released at once, not when the hold runs out.
4. `TICK n`: time passes. A hold whose time is up is **read** as available; nothing has to fire.

@figure hold-race

## The traps

- **Half a hold.** Holding seats one at a time and failing on the third leaves two held. Check all, then change all.
- **A timer per hold.** Threads and schedulers make the output depend on timing. Store `heldUntil` and compare it with the clock whenever the seat is read.
- **Paying for a lapsed hold.** A payment confirms only what is *still* held by that user; if the hold lapsed, the seat may already be someone else's.
- **Status on Seat.** A seat is booked for one show, not for ever. Status lives on ShowSeat.

```game
type: pick
title: What does the system answer?
prompt: Seats hold for 5 minutes. Each round is one moment of a show's evening.
? t=0 alice holds A1 A2. At t=1 bob asks for A2 A3.
* bob cannot hold A2: held
- bob holds A3 until t=6
- bob holds A2 A3 until t=6
> All or none: A2 is still alice's, so bob gets nothing, not even A3.
? alice held A1 at t=0 and never paid. At t=5 bob asks for A1.
* bob holds A1 until t=10
- bob cannot hold A1: held
- alice is charged for A1
> The hold lasts while now is before t=5; at t=5 it has lapsed and reads as available.
? carol held B1 at t=2; her card is declined at t=3.
* B1 is free at t=3
- B1 stays held until t=7
- B1 becomes booked
> A failed payment releases the hold at once, so others are not kept waiting.
? dave's hold on C2 lapsed at t=8. At t=9 his payment succeeds.
* dave has no active hold
- dave booked C2
- C2 is booked for whoever holds it now
> Only seats still held by the payer are confirmed; a late payment is refunded.
```

## Pricing as a Strategy

The second exercise adds seat categories by row and a pricing rule chosen per show. The rule is one interface with one method; the booking code asks it for a price and never names a day of the week. A new rule, a festival surcharge say, is one more class. Prices are whole rupees here, so no floating point ever touches the money.

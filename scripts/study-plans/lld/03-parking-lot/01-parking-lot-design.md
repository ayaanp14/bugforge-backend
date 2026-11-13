---
title: Parking lot
minutes: 12
seo-title: Parking Lot in Java: Best-Fit Spots and a Pricing Strategy
description: Code a parking lot in Java: levels of sized spots, a best-fit SpotStrategy, a vehicle factory, tickets and an hourly or flat PricingStrategy swapped at runtime.
question: How do you code a parking lot system in Java for a machine-coding round?
answer: Model a ParkingLot that owns Levels of sized ParkingSpots, a Vehicle whose type knows the spot size it needs, and a Ticket recording the entry time. Parking asks a SpotStrategy for a free spot that fits; leaving frees the spot and asks a PricingStrategy for the fee. Both rules are interfaces, so a new allocation or tariff is a new class.
q: What is the best-fit spot allocation strategy?
a: Try the lowest level first and, on that level, take the smallest free spot that fits the vehicle, so large spots stay free for vehicles that need them. A bike takes a small spot before a medium one, and a car never takes a large spot while a medium one is free on the same level.
q: Why use the Strategy pattern for parking fees?
a: Tariffs change: hourly, flat at weekends, first hour free. With a PricingStrategy interface the lot calls one method and each tariff is its own class, so a new rule never edits ParkingLot, and the tariff can even be switched while the lot is running.
q: How should vehicle sizes be modelled?
a: As an enum of spot sizes ordered small to large, and a vehicle type that records the smallest size it needs. A spot fits a vehicle when it is free and its size is at least that need, which is one comparison instead of a table of if statements.
q: How do you compute the parking fee in hours?
a: Keep the entry time on the ticket and pass the exit time to the pricing strategy. An hourly tariff charges the rate for the hours parked with a minimum of one, so a vehicle that leaves in the hour it arrived still pays for one hour.
---
The warm-up of the machine-coding round, and the best place to show two patterns working together. The full design discussion — gates, concurrency, display boards — is in the note [Design a Parking Lot](/notes/low-level-design/design-a-parking-lot). Here we code the core.

## The model

- **ParkingLot** owns **Levels**; a level owns **ParkingSpots** (composition).
- A spot has a **Size** — `S < M < L` — and holds 0..1 **Vehicle**.
- A **VehicleType** knows the smallest size it needs: bike S, car M, truck L. "Fits" is one comparison: `free && size >= needs`.
- A **Ticket** remembers the vehicle, the spot and the entry hour.

@figure parking-classes

## Strategy, twice

The lot never decides *which* spot or *how much*. It asks:

- `SpotStrategy.find(levels, vehicle)` — here **best fit**: lowest level first, then the smallest free spot that fits, then the order the spots were listed.
- `PricingStrategy.fee(ticket, exitHour)` — **hourly** (a rate per type, at least one hour) or **flat**.

A new tariff is a new class; the lot can even switch tariff while running, which is what the second program's `PRICING` command does.

@figure best-fit

```game
type: pick
title: Where does best fit put it?
prompt: Level 1 has S1 (taken), M1 (free) and L1 (free); level 2 has M1 (free). Pick the spot.
? A car arrives.
* Level 1 M1
- Level 1 L1
- Level 2 M1
> Level 1 comes first, and M1 is the smallest free spot there that fits a car.
? A bike arrives.
* Level 1 M1
- Level 1 L1
- Level 2 M1
> S1 is taken, so the smallest free spot on level 1 that fits is M1 — level 2 is never reached.
? A truck arrives.
- Level 1 M1
* Level 1 L1
- No spot
> Only a large spot fits a truck, and level 1 has one free.
? Two trucks arrive one after the other.
- Both park on level 1
* The first takes L1, the second gets no spot
- The second waits for M1
> There is one large spot in the lot; a medium one never fits a truck.
```

## Factory and errors

- A `VehicleFactory` turns `"CAR"` into a `Vehicle` and refuses an unknown type in one place.
- Refusals (already parked, not parked, unknown type) are exceptions printed once by `main`; *no spot* is a normal answer, not an error.

## The traps

- **if-chains on type** inside `park`: a new vehicle type edits the lot. Put the size on the type.
- **Fee logic in `ParkingLot`**: the lot changes every time marketing changes the tariff.
- **Searching by `HashMap` iteration**: spot order must be the order you were given — keep spots in a `List`.

---
title: Design a Parking Lot
order: 5
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Parking Lot Low-Level Design: Classes, Patterns, Code
description: Parking lot LLD for machine-coding interviews: requirements, a class diagram, Strategy for spot allocation and pricing, Factory, and runnable code.
question: How do you design a parking lot in a low-level design interview?
answer: Model a ParkingLot made of Levels, each holding ParkingSpots of a size, and Vehicles created by a factory. Parking asks a spot-allocation strategy for a free spot that fits and issues a Ticket; leaving frees the spot and asks a pricing strategy for the fee. Lock the find-and-take step so two gates never book one spot.
q: What classes does a parking lot design need?
a: ParkingLot, Level, ParkingSpot, Vehicle (with its type), Ticket, and two strategy interfaces: one that picks a spot and one that prices a stay. Gates, payments and display boards are added when the interviewer asks for them.
q: Which design patterns are used in a parking lot system?
a: Strategy for spot allocation and for pricing, so either rule can change without touching ParkingLot. Factory to create vehicles and know which spot size each needs. Singleton is often suggested for the lot, but passing one instance in is easier to test.
q: How do you handle two cars taking the last spot at the same time?
a: Make finding and taking a spot one atomic step: a lock around it in a single process, or a conditional update such as setting the spot taken only where it is still free in a database. The second gate then re-reads and gets another spot or none.
q: How is the parking fee calculated?
a: The ticket records the entry time. On exit, a pricing strategy computes the fee from the vehicle type and the hours parked, for example hours times an hourly rate with a one-hour minimum. Flat, weekend or first-hour-free rules are other implementations of the same interface.
q: How do you support multiple floors or levels?
a: The lot holds a list of levels and the allocation strategy walks them in order, lowest first, or by distance from the entry gate. Each level can report whether it is full, which feeds the display boards at the gates.
---

A parking lot is the classic warm-up of the machine-coding round: small enough to code in an hour, rich enough to show classes, relations, two patterns and one concurrency bug.

## Requirements

- Several **levels**, each with spots of three sizes: small, medium, large.
- Three **vehicle types**: a bike fits any spot, a car a medium or large one, a truck only a large one.
- **Park**: give the vehicle a free spot that fits and issue a **ticket**.
- **Leave**: free the spot and charge a **fee** by type and hours.
- Report when a level (or the lot) is **full**.
- Out of scope unless asked: payments, reservations, several gates at once.

## Classes and relations

@figure class-diagram

- **Composition**: a lot owns its levels, a level its spots. See [UML class diagrams](/notes/low-level-design/uml-class-diagrams).
- **Association**: a spot holds 0..1 vehicle; a ticket points at a vehicle and a spot.
- The lot depends only on two **interfaces**, so it stays closed for modification ([SOLID](/notes/oop/solid-principles)).

## Parking a vehicle

The spot strategy here is **best fit**: lowest level first, then the smallest free spot that fits, so large spots stay free for trucks.

@figure allocation

@figure park-sequence

```game
type: pick
title: Where does best fit park it?
prompt: Level 1 has S1 and L1 free; level 2 has M1 free. Pick the spot.
? A bike arrives.
* Level 1 S1
- Level 1 L1
- Level 2 M1
> The lowest level comes first, and on it the smallest free spot that fits a bike is S1.
? A car arrives.
- Level 1 S1
* Level 1 L1
- Level 2 M1
> A car does not fit S1, and level 1 is tried before level 2, so it takes L1.
? A truck arrives.
- Level 1 S1
* Level 1 L1
- Level 2 M1
> Only a large spot fits a truck, and L1 is the one free.
```

## The patterns used

| Pattern | Where | Why |
| --- | --- | --- |
| Strategy | `SpotStrategy` (best fit, nearest gate) | Change the allocation rule without editing the lot |
| Strategy | `PricingStrategy` (hourly, flat, weekend) | New tariffs are new classes |
| Factory | `VehicleFactory.create(plate, type)` | One place maps a type to the spot size it needs |

Read the patterns themselves in [design patterns](/notes/oop/design-patterns) and how they show up in machine coding in [design patterns in LLD](/notes/low-level-design/design-patterns-in-lld).

```game
type: match
title: Requirement to pattern
prompt: Match each change request to the part of the design that absorbs it.
- Charge a flat 50 at weekends => a new PricingStrategy
- Fill the spots nearest the lift first => a new SpotStrategy
- Add electric cars that need a charging spot => VehicleFactory and a new spot size
- Show free spots at the gate => a display board that reads each level
why: Each change lands in one class, which is the point of putting the rules behind interfaces and the creation in a factory.
```

## The code

The core classes and one scenario: three vehicles fill level 1, a car moves on to level 2, one leaves and pays, and the last truck finds no spot.

```cpp
#include <algorithm>
#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <vector>
using namespace std;

enum Size { SMALL, MEDIUM, LARGE };
const string TYPES[] = {"BIKE", "CAR", "TRUCK"};
enum Type { BIKE, CAR, TRUCK };
struct Vehicle { string plate; Type type; Size needs; };
struct VehicleFactory {  // the one place that knows which spot size each type needs
    static Vehicle create(const string& plate, Type type) { return {plate, type, type == BIKE ? SMALL : type == CAR ? MEDIUM : LARGE}; }
};

struct Spot {
    int level; string id; Size size; const Vehicle* vehicle = nullptr;
    Spot(int l, string i) : level(l), id(i), size(i[0] == 'S' ? SMALL : i[0] == 'M' ? MEDIUM : LARGE) {}
    bool fits(const Vehicle& v) const { return vehicle == nullptr && size >= v.needs; }
    string name() const { return "level " + to_string(level) + " spot " + id; }
};
struct Level {
    vector<Spot> spots;
    Level(int number, vector<string> ids) { for (auto& id : ids) spots.emplace_back(number, id); }
    bool isFull() const { for (auto& s : spots) if (!s.vehicle) return false; return true; }
};
struct Ticket { Vehicle vehicle; Spot* spot; int entryHour; };
struct SpotStrategy { virtual Spot* find(vector<Level>& levels, const Vehicle& v) = 0; virtual ~SpotStrategy() = default; };
struct PricingStrategy { virtual int fee(const Ticket& t, int exitHour) = 0; virtual ~PricingStrategy() = default; };
// Lowest level first; on that level, the smallest free spot that fits.
struct BestFit : SpotStrategy {
    Spot* find(vector<Level>& levels, const Vehicle& v) override {
        for (auto& level : levels) {
            Spot* best = nullptr;
            for (auto& s : level.spots)
                if (s.fits(v) && (!best || s.size < best->size)) best = &s;
            if (best) return best;
        }
        return nullptr;
    }
};

struct Hourly : PricingStrategy {
    int fee(const Ticket& t, int exitHour) override {
        int rate = t.vehicle.type == BIKE ? 10 : t.vehicle.type == CAR ? 20 : 40;
        return max(1, exitHour - t.entryHour) * rate;
    }
};

struct ParkingLot {
    vector<Level> levels;
    map<string, Ticket> tickets;
    unique_ptr<SpotStrategy> spots; unique_ptr<PricingStrategy> pricing;
    void park(const string& plate, Type type, int hour) {
        Vehicle v = VehicleFactory::create(plate, type);
        Spot* s = spots->find(levels, v);
        if (!s) { cout << plate << " " << TYPES[type] << " -> no spot\n"; return; }
        auto it = tickets.insert({plate, Ticket{v, s, hour}}).first;
        s->vehicle = &it->second.vehicle;
        cout << plate << " " << TYPES[type] << " -> " << s->name() << "\n";
    }
    void leave(const string& plate, int hour) {
        Ticket t = tickets.at(plate);
        t.spot->vehicle = nullptr;
        cout << plate << " leaves " << t.spot->name() << " after " << hour - t.entryHour << "h, fee " << pricing->fee(t, hour) << "\n";
        tickets.erase(plate);
    }
};

int main() {
    ParkingLot lot{{}, {}, make_unique<BestFit>(), make_unique<Hourly>()};
    lot.levels.emplace_back(1, vector<string>{"S1", "M1", "L1"});
    lot.levels.emplace_back(2, vector<string>{"M1", "L1"});
    lot.park("KA-01", BIKE, 0); lot.park("KA-02", CAR, 1); lot.park("KA-03", TRUCK, 1);
    cout << "level 1 full: " << (lot.levels[0].isFull() ? "true" : "false") << "\n";
    lot.park("KA-04", CAR, 2); lot.leave("KA-02", 4); lot.park("KA-05", CAR, 4);
    lot.park("KA-06", TRUCK, 5); lot.park("KA-07", TRUCK, 5);
}
```

```java
import java.util.*;

public class Main {
    enum Size { SMALL, MEDIUM, LARGE }
    enum Type { BIKE, CAR, TRUCK }
    record Vehicle(String plate, Type type, Size needs) {}
    static class VehicleFactory {
        static Vehicle create(String plate, Type type) {
            Size s = switch (type) { case BIKE -> Size.SMALL; case CAR -> Size.MEDIUM; case TRUCK -> Size.LARGE; };
            return new Vehicle(plate, type, s);
        }
    }

    static class Spot {
        final int level; final String id; final Size size; Vehicle vehicle;
        Spot(int level, String id) {
            this.level = level; this.id = id;
            size = id.charAt(0) == 'S' ? Size.SMALL : id.charAt(0) == 'M' ? Size.MEDIUM : Size.LARGE;
        }
        boolean fits(Vehicle v) { return vehicle == null && size.ordinal() >= v.needs().ordinal(); }
        public String toString() { return "level " + level + " spot " + id; }
    }
    static class Level {
        final List<Spot> spots = new ArrayList<>();
        Level(int number, String... ids) { for (String id : ids) spots.add(new Spot(number, id)); }
        boolean isFull() { return spots.stream().allMatch(s -> s.vehicle != null); }
    }

    record Ticket(Vehicle vehicle, Spot spot, int entryHour) {}
    interface SpotStrategy { Spot find(List<Level> levels, Vehicle v); }
    interface PricingStrategy { int fee(Ticket t, int exitHour); }
    // Lowest level first; on that level, the smallest free spot that fits.
    static class BestFit implements SpotStrategy {
        public Spot find(List<Level> levels, Vehicle v) {
            for (Level level : levels) {
                Spot best = null;
                for (Spot s : level.spots)
                    if (s.fits(v) && (best == null || s.size.ordinal() < best.size.ordinal())) best = s;
                if (best != null) return best;
            }
            return null;
        }
    }
    static class Hourly implements PricingStrategy {
        public int fee(Ticket t, int exitHour) {
            int rate = switch (t.vehicle().type()) { case BIKE -> 10; case CAR -> 20; case TRUCK -> 40; };
            return Math.max(1, exitHour - t.entryHour()) * rate;
        }
    }

    static class ParkingLot {
        final List<Level> levels = new ArrayList<>();
        final Map<String, Ticket> tickets = new HashMap<>();
        final SpotStrategy spots; final PricingStrategy pricing;
        ParkingLot(SpotStrategy spots, PricingStrategy pricing) { this.spots = spots; this.pricing = pricing; }
        void park(String plate, Type type, int hour) {
            Vehicle v = VehicleFactory.create(plate, type);
            Spot s = spots.find(levels, v);
            if (s == null) { System.out.println(plate + " " + type + " -> no spot"); return; }
            s.vehicle = v;
            tickets.put(plate, new Ticket(v, s, hour));
            System.out.println(plate + " " + type + " -> " + s);
        }
        void leave(String plate, int hour) {
            Ticket t = tickets.remove(plate);
            t.spot().vehicle = null;
            System.out.println(plate + " leaves " + t.spot() + " after " + (hour - t.entryHour()) + "h, fee " + pricing.fee(t, hour));
        }
    }

    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot(new BestFit(), new Hourly());
        lot.levels.add(new Level(1, "S1", "M1", "L1"));
        lot.levels.add(new Level(2, "M1", "L1"));
        lot.park("KA-01", Type.BIKE, 0); lot.park("KA-02", Type.CAR, 1); lot.park("KA-03", Type.TRUCK, 1);
        System.out.println("level 1 full: " + lot.levels.get(0).isFull());
        lot.park("KA-04", Type.CAR, 2); lot.leave("KA-02", 4); lot.park("KA-05", Type.CAR, 4);
        lot.park("KA-06", Type.TRUCK, 5); lot.park("KA-07", Type.TRUCK, 5);
    }
}
```

```python
from abc import ABC, abstractmethod

NEEDS = {"BIKE": 0, "CAR": 1, "TRUCK": 2}   # 0 small, 1 medium, 2 large
RATES = {"BIKE": 10, "CAR": 20, "TRUCK": 40}

class Vehicle:
    def __init__(self, plate, kind, needs):
        self.plate, self.kind, self.needs = plate, kind, needs

class VehicleFactory:
    @staticmethod
    def create(plate, kind):
        return Vehicle(plate, kind, NEEDS[kind])

class Spot:
    def __init__(self, level, sid):
        self.level, self.id, self.vehicle = level, sid, None
        self.size = "SML".index(sid[0])
    def fits(self, v):
        return self.vehicle is None and self.size >= v.needs
    def __str__(self):
        return f"level {self.level} spot {self.id}"

class Level:
    def __init__(self, number, *ids):
        self.spots = [Spot(number, i) for i in ids]
    def is_full(self):
        return all(s.vehicle is not None for s in self.spots)

class Ticket:
    def __init__(self, vehicle, spot, entry_hour):
        self.vehicle, self.spot, self.entry_hour = vehicle, spot, entry_hour

class SpotStrategy(ABC):
    @abstractmethod
    def find(self, levels, v): ...

class PricingStrategy(ABC):
    @abstractmethod
    def fee(self, ticket, exit_hour): ...

class BestFit(SpotStrategy):
    """Lowest level first; on that level, the smallest free spot that fits."""
    def find(self, levels, v):
        for level in levels:
            free = [s for s in level.spots if s.fits(v)]
            if free:
                return min(free, key=lambda s: s.size)
        return None

class Hourly(PricingStrategy):
    def fee(self, t, exit_hour):
        return max(1, exit_hour - t.entry_hour) * RATES[t.vehicle.kind]

class ParkingLot:
    def __init__(self, spots, pricing):
        self.levels, self.tickets = [], {}
        self.spots, self.pricing = spots, pricing
    def park(self, plate, kind, hour):
        v = VehicleFactory.create(plate, kind)
        s = self.spots.find(self.levels, v)
        if s is None:
            print(f"{plate} {kind} -> no spot")
            return
        s.vehicle = v
        self.tickets[plate] = Ticket(v, s, hour)
        print(f"{plate} {kind} -> {s}")
    def leave(self, plate, hour):
        t = self.tickets.pop(plate)
        t.spot.vehicle = None
        print(f"{plate} leaves {t.spot} after {hour - t.entry_hour}h, fee {self.pricing.fee(t, hour)}")

lot = ParkingLot(BestFit(), Hourly())
lot.levels += [Level(1, "S1", "M1", "L1"), Level(2, "M1", "L1")]
lot.park("KA-01", "BIKE", 0); lot.park("KA-02", "CAR", 1); lot.park("KA-03", "TRUCK", 1)
print("level 1 full:", str(lot.levels[0].is_full()).lower())
lot.park("KA-04", "CAR", 2); lot.leave("KA-02", 4); lot.park("KA-05", "CAR", 4)
lot.park("KA-06", "TRUCK", 5); lot.park("KA-07", "TRUCK", 5)
```

```javascript
const NEEDS = { BIKE: 0, CAR: 1, TRUCK: 2 }; // 0 small, 1 medium, 2 large
const RATES = { BIKE: 10, CAR: 20, TRUCK: 40 };

class Vehicle {
  constructor(plate, kind, needs) { this.plate = plate; this.kind = kind; this.needs = needs; }
}

class VehicleFactory {
  static create(plate, kind) { return new Vehicle(plate, kind, NEEDS[kind]); }
}

class Spot {
  constructor(level, id) { this.level = level; this.id = id; this.size = "SML".indexOf(id[0]); this.vehicle = null; }
  fits(v) { return this.vehicle === null && this.size >= v.needs; }
  toString() { return `level ${this.level} spot ${this.id}`; }
}

class Level {
  constructor(number, ...ids) { this.spots = ids.map((id) => new Spot(number, id)); }
  isFull() { return this.spots.every((s) => s.vehicle !== null); }
}

class Ticket {
  constructor(vehicle, spot, entryHour) { this.vehicle = vehicle; this.spot = spot; this.entryHour = entryHour; }
}

// The two strategies: any object with find(levels, v) / fee(ticket, exitHour).
class BestFit {
  // Lowest level first; on that level, the smallest free spot that fits.
  find(levels, v) {
    for (const level of levels) {
      let best = null;
      for (const s of level.spots) if (s.fits(v) && (best === null || s.size < best.size)) best = s;
      if (best !== null) return best;
    }
    return null;
  }
}

class Hourly {
  fee(t, exitHour) { return Math.max(1, exitHour - t.entryHour) * RATES[t.vehicle.kind]; }
}

class ParkingLot {
  constructor(spots, pricing) { this.levels = []; this.tickets = new Map(); this.spots = spots; this.pricing = pricing; }
  park(plate, kind, hour) {
    const v = VehicleFactory.create(plate, kind);
    const s = this.spots.find(this.levels, v);
    if (s === null) { console.log(`${plate} ${kind} -> no spot`); return; }
    s.vehicle = v;
    this.tickets.set(plate, new Ticket(v, s, hour));
    console.log(`${plate} ${kind} -> ${s}`);
  }
  leave(plate, hour) {
    const t = this.tickets.get(plate);
    this.tickets.delete(plate);
    t.spot.vehicle = null;
    console.log(`${plate} leaves ${t.spot} after ${hour - t.entryHour}h, fee ${this.pricing.fee(t, hour)}`);
  }
}

const lot = new ParkingLot(new BestFit(), new Hourly());
lot.levels.push(new Level(1, "S1", "M1", "L1"), new Level(2, "M1", "L1"));
lot.park("KA-01", "BIKE", 0); lot.park("KA-02", "CAR", 1); lot.park("KA-03", "TRUCK", 1);
console.log(`level 1 full: ${lot.levels[0].isFull()}`);
lot.park("KA-04", "CAR", 2); lot.leave("KA-02", 4); lot.park("KA-05", "CAR", 4);
lot.park("KA-06", "TRUCK", 5); lot.park("KA-07", "TRUCK", 5);
```

```output
KA-01 BIKE -> level 1 spot S1
KA-02 CAR -> level 1 spot M1
KA-03 TRUCK -> level 1 spot L1
level 1 full: true
KA-04 CAR -> level 2 spot M1
KA-02 leaves level 1 spot M1 after 3h, fee 60
KA-05 CAR -> level 1 spot M1
KA-06 TRUCK -> level 2 spot L1
KA-07 TRUCK -> no spot
```

## Extensions interviewers ask

- **Concurrency at the gates**: finding and taking a spot must be one atomic step.

@figure two-gates

- **Persistence**: the same rule as a conditional update, `UPDATE spot SET vehicle = ? WHERE id = ? AND vehicle IS NULL`, retried if no row changed.
- **Display boards**: free counts per level and size, updated on park and leave; an Observer fits.
- **Payments**: a `Payment` with cash, card and UPI behind one interface, taken at the exit gate.
- **Faster search**: a free list per size per level instead of scanning every spot.

## Interview questions

- **Why put allocation behind an interface?** The rule is the part most likely to change, and the lot should not be edited for it.
- **Should ParkingLot be a Singleton?** One lot per process is fine, but injecting the instance keeps tests independent.
- **How do you stop double booking?** Lock the find-and-take step, or use a conditional database update.
- **Where does the fee logic live?** In a pricing strategy that reads the ticket's entry time and vehicle type.
- **How would you find a spot in O(1)?** Keep a queue of free spots per size per level.

Next: [Design a Vending Machine](/notes/low-level-design/design-a-vending-machine) · Before this: [Design an LRU Cache](/notes/low-level-design/design-an-lru-cache)

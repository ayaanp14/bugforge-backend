---
title: Design an Elevator System
order: 7
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Elevator System LLD: Dispatcher, LOOK and Code
description: Elevator system low-level design: a dispatcher for several cars, direction as state, SCAN and LOOK scheduling as a Strategy, animated, with runnable code.
question: How do you design an elevator system in a low-level design interview?
answer: Model a Dispatcher that owns several Elevators. Each elevator keeps its floor, its direction (up, down or idle, its state) and a sorted set of stops. Hall calls go to the nearest elevator that is idle or already heading that way; car buttons add a stop to that car. A Scheduler strategy such as LOOK picks the next stop: keep going while stops lie ahead, then turn.
q: What is the difference between SCAN and LOOK for elevators?
a: Both serve every stop in the current direction before turning. SCAN rides on to the end of the shaft before it turns; LOOK turns at the last requested stop. LOOK saves the empty ride to the top or bottom, so it usually moves fewer floors.
q: How does an elevator dispatcher choose which elevator to send?
a: A common rule is the nearest elevator that is idle or already moving towards the call in the right direction, falling back to the nearest one when none qualifies. Production systems also weigh load, the number of stops already queued and the time to arrive.
q: What design patterns are used in an elevator system?
a: Strategy for the scheduling policy (SCAN, LOOK, first come first served), State for the car's direction and door states, and often Observer so floor displays and hall lanterns follow each car. A single dispatcher is sometimes made a Singleton, though injecting it tests better.
q: What is the difference between a hall call and a car call?
a: A hall call is pressed on a floor, with a direction, and the dispatcher decides which elevator answers it. A car call is pressed inside an elevator and becomes a stop for that elevator only, even if it is behind the car.
q: How do you handle concurrency in an elevator system?
a: Calls arrive from many buttons at once, so the dispatcher's assignment and each elevator's stop set must be updated atomically, with a lock or a single thread consuming a queue of requests. Each elevator usually runs its own loop that reads its stops.
---

The elevator is the machine-coding problem that tests a **scheduling algorithm** inside an object model: several cars, calls from every floor, and a rule for which stop comes next.

## Requirements

- One building, floors 0 to 10, several **elevators**.
- **Hall calls** from a floor; the system picks an elevator.
- **Car calls** from inside a car; that car must stop there.
- Serve stops in an order that does not starve anyone and wastes few floors.
- Out of scope unless asked: weight limits, doors, emergency mode, VIP floors.

## Classes and relations

@figure class-diagram

- **Direction is the state**: up, down or idle decides which stops are ahead. A fuller design adds DoorsOpen and Maintenance as State classes.
- **Scheduler is a Strategy**: LOOK, SCAN or first come first served behind one `next(e)` ([design patterns](/notes/oop/design-patterns)).
- Stops are a **sorted set**: the next stop up or down is a ceiling or floor lookup, O(log n).

## Dispatching hall calls

@figure dispatcher

- Prefer the **nearest elevator that is idle or heading towards the call**.
- If none is, take the nearest one; it serves the call after it turns.
- A car call skips the dispatcher: it belongs to its car.

## Scheduling: LOOK and SCAN

@figure look-run

- **LOOK**: keep the direction while stops lie ahead; turn at the last one.
- **SCAN**: the same, but ride to the end of the shaft before turning.
- **FCFS** serves calls in arrival order and zigzags; it is the baseline to beat.

@figure scan-vs-look

```game
type: pick
title: Where does the car stop next?
prompt: The elevator runs LOOK unless the round says otherwise. Pick its next stop.
? At floor 5 going up; stops at 2, 8 and 6.
- 2
* 6
- 8
> Going up, LOOK takes the nearest stop above it first.
? At floor 8 going up; stops at 2 and 3.
- 10
* 3
- 2
> Nothing lies above, so LOOK turns at once and takes the nearest stop below.
? At floor 4 going down; stops at 6, 1 and 3.
* 3
- 1
- 6
> Going down, the nearest stop below comes first; 6 waits for the way back up.
? Same building under SCAN: at floor 7 going up, one stop at 2.
* 10
- 2
- 8
> SCAN rides to the end of the shaft, floor 10, before it turns down for 2.
```

## The code

The dispatcher, the LOOK scheduler and one scenario: four hall calls shared between two cars, a car call behind E1, and every stop printed in the order LOOK serves it.

```cpp
#include <cstdlib>
#include <iostream>
#include <set>
#include <string>
#include <vector>
using namespace std;

enum Direction { UP, DOWN, IDLE };
const string DIR_NAME[] = {"UP", "DOWN", "IDLE"};

struct Elevator {
    string id; int floor; Direction dir; int moved = 0;
    set<int> stops;
    Elevator(string i, int f, Direction d) : id(i), floor(f), dir(d) {}
    bool headingTo(int f) const { return dir == IDLE || (dir == UP && f >= floor) || (dir == DOWN && f <= floor); }
};

struct Scheduler { virtual int next(const Elevator& e) = 0; virtual ~Scheduler() = default; };

// LOOK: keep going while there are stops ahead, then turn at the last one.
struct LookScheduler : Scheduler {
    int next(const Elevator& e) override {
        auto it = e.stops.lower_bound(e.floor);           // first stop >= floor
        bool hasUp = it != e.stops.end();
        auto at = e.stops.upper_bound(e.floor);           // first stop > floor
        bool hasDown = at != e.stops.begin();
        int up = hasUp ? *it : 0, down = hasDown ? *prev(at) : 0;
        if (e.dir == UP) return hasUp ? up : down;
        if (e.dir == DOWN) return hasDown ? down : up;
        if (!hasUp) return down;
        if (!hasDown) return up;
        return up - e.floor < e.floor - down ? up : down;
    }
};

struct Dispatcher {
    vector<Elevator*> elevators;
    LookScheduler scheduler;

    // Nearest elevator that is idle or already heading towards the call; otherwise the nearest.
    void call(int floor) {
        Elevator* best = nullptr;
        for (bool strict : {true, false}) {
            for (Elevator* e : elevators)
                if ((!strict || e->headingTo(floor)) && (!best || abs(e->floor - floor) < abs(best->floor - floor))) best = e;
            if (best) break;
        }
        if (best->dir == IDLE) best->dir = floor >= best->floor ? UP : DOWN;
        best->stops.insert(floor);
        cout << "call " << floor << " -> " << best->id << "\n";
    }

    void run(Elevator& e) {
        while (!e.stops.empty()) {
            int next = scheduler.next(e);
            Direction d = next > e.floor ? UP : next < e.floor ? DOWN : e.dir;
            if (d != e.dir && e.dir != IDLE) cout << e.id << " turns " << DIR_NAME[d] << "\n";
            e.dir = d;
            e.moved += abs(next - e.floor);
            e.floor = next;
            e.stops.erase(next);
            cout << e.id << " stops at " << next << " going " << DIR_NAME[d] << "\n";
        }
        e.dir = IDLE;
        cout << e.id << " idle at " << e.floor << ", moved " << e.moved << " floors\n";
    }
};

int main() {
    Dispatcher d;
    Elevator e1("E1", 4, UP), e2("E2", 0, IDLE);
    e1.stops.insert(7);
    d.elevators = {&e1, &e2};
    for (int f : {9, 1, 6, 2}) d.call(f);
    e1.stops.insert(3);
    cout << "press 3 inside E1\n";
    d.run(e1);
    d.run(e2);
}
```

```java
import java.util.*;

public class Main {
    enum Direction { UP, DOWN, IDLE }

    static class Elevator {
        final String id; int floor; Direction dir; int moved = 0;
        final TreeSet<Integer> stops = new TreeSet<>();
        Elevator(String id, int floor, Direction dir) { this.id = id; this.floor = floor; this.dir = dir; }
        boolean headingTo(int f) {
            return dir == Direction.IDLE || (dir == Direction.UP && f >= floor) || (dir == Direction.DOWN && f <= floor);
        }
    }

    interface Scheduler { int next(Elevator e); }

    // LOOK: keep going while there are stops ahead, then turn at the last one.
    static class LookScheduler implements Scheduler {
        public int next(Elevator e) {
            Integer up = e.stops.ceiling(e.floor), down = e.stops.floor(e.floor);
            if (e.dir == Direction.UP) return up != null ? up : down;
            if (e.dir == Direction.DOWN) return down != null ? down : up;
            if (up == null) return down;
            if (down == null) return up;
            return up - e.floor < e.floor - down ? up : down;
        }
    }

    static class Dispatcher {
        final List<Elevator> elevators = new ArrayList<>();
        final Scheduler scheduler = new LookScheduler();

        // Nearest elevator that is idle or already heading towards the call; otherwise the nearest.
        void call(int floor) {
            Elevator best = null;
            for (boolean strict : new boolean[] {true, false}) {
                for (Elevator e : elevators)
                    if ((!strict || e.headingTo(floor)) && (best == null || Math.abs(e.floor - floor) < Math.abs(best.floor - floor))) best = e;
                if (best != null) break;
            }
            if (best.dir == Direction.IDLE) best.dir = floor >= best.floor ? Direction.UP : Direction.DOWN;
            best.stops.add(floor);
            System.out.println("call " + floor + " -> " + best.id);
        }

        void run(Elevator e) {
            while (!e.stops.isEmpty()) {
                int next = scheduler.next(e);
                Direction d = next > e.floor ? Direction.UP : next < e.floor ? Direction.DOWN : e.dir;
                if (d != e.dir && e.dir != Direction.IDLE) System.out.println(e.id + " turns " + d);
                e.dir = d;
                e.moved += Math.abs(next - e.floor);
                e.floor = next;
                e.stops.remove(next);
                System.out.println(e.id + " stops at " + next + " going " + d);
            }
            e.dir = Direction.IDLE;
            System.out.println(e.id + " idle at " + e.floor + ", moved " + e.moved + " floors");
        }
    }

    public static void main(String[] args) {
        Dispatcher d = new Dispatcher();
        Elevator e1 = new Elevator("E1", 4, Direction.UP), e2 = new Elevator("E2", 0, Direction.IDLE);
        e1.stops.add(7);
        d.elevators.add(e1); d.elevators.add(e2);
        for (int f : new int[] {9, 1, 6, 2}) d.call(f);
        e1.stops.add(3);
        System.out.println("press 3 inside E1");
        d.run(e1);
        d.run(e2);
    }
}
```

```python
from abc import ABC, abstractmethod

class Elevator:
    def __init__(self, eid, floor, direction):
        self.id, self.floor, self.dir, self.moved, self.stops = eid, floor, direction, 0, set()
    def heading_to(self, f):
        return self.dir == "IDLE" or (self.dir == "UP" and f >= self.floor) or (self.dir == "DOWN" and f <= self.floor)

class Scheduler(ABC):
    @abstractmethod
    def next(self, e): ...

class LookScheduler(Scheduler):
    """LOOK: keep going while there are stops ahead, then turn at the last one."""
    def next(self, e):
        above = [s for s in e.stops if s >= e.floor]
        below = [s for s in e.stops if s <= e.floor]
        up = min(above) if above else None
        down = max(below) if below else None
        if e.dir == "UP":
            return up if up is not None else down
        if e.dir == "DOWN":
            return down if down is not None else up
        if up is None:
            return down
        if down is None:
            return up
        return up if up - e.floor < e.floor - down else down

class Dispatcher:
    def __init__(self):
        self.elevators, self.scheduler = [], LookScheduler()

    def call(self, floor):
        """Nearest elevator that is idle or already heading towards the call; otherwise the nearest."""
        best = None
        for strict in (True, False):
            for e in self.elevators:
                if (not strict or e.heading_to(floor)) and (best is None or abs(e.floor - floor) < abs(best.floor - floor)):
                    best = e
            if best is not None:
                break
        if best.dir == "IDLE":
            best.dir = "UP" if floor >= best.floor else "DOWN"
        best.stops.add(floor)
        print(f"call {floor} -> {best.id}")

    def run(self, e):
        while e.stops:
            nxt = self.scheduler.next(e)
            d = "UP" if nxt > e.floor else "DOWN" if nxt < e.floor else e.dir
            if d != e.dir and e.dir != "IDLE":
                print(f"{e.id} turns {d}")
            e.dir = d
            e.moved += abs(nxt - e.floor)
            e.floor = nxt
            e.stops.discard(nxt)
            print(f"{e.id} stops at {nxt} going {d}")
        e.dir = "IDLE"
        print(f"{e.id} idle at {e.floor}, moved {e.moved} floors")

d = Dispatcher()
e1, e2 = Elevator("E1", 4, "UP"), Elevator("E2", 0, "IDLE")
e1.stops.add(7)
d.elevators += [e1, e2]
for f in (9, 1, 6, 2):
    d.call(f)
e1.stops.add(3)
print("press 3 inside E1")
d.run(e1)
d.run(e2)
```

```javascript
class Elevator {
  constructor(id, floor, dir) { this.id = id; this.floor = floor; this.dir = dir; this.moved = 0; this.stops = new Set(); }
  headingTo(f) {
    return this.dir === "IDLE" || (this.dir === "UP" && f >= this.floor) || (this.dir === "DOWN" && f <= this.floor);
  }
}

// LOOK: keep going while there are stops ahead, then turn at the last one.
class LookScheduler {
  next(e) {
    const stops = [...e.stops];
    const above = stops.filter((s) => s >= e.floor), below = stops.filter((s) => s <= e.floor);
    const up = above.length ? Math.min(...above) : null, down = below.length ? Math.max(...below) : null;
    if (e.dir === "UP") return up !== null ? up : down;
    if (e.dir === "DOWN") return down !== null ? down : up;
    if (up === null) return down;
    if (down === null) return up;
    return up - e.floor < e.floor - down ? up : down;
  }
}

class Dispatcher {
  constructor() { this.elevators = []; this.scheduler = new LookScheduler(); }

  // Nearest elevator that is idle or already heading towards the call; otherwise the nearest.
  call(floor) {
    let best = null;
    for (const strict of [true, false]) {
      for (const e of this.elevators)
        if ((!strict || e.headingTo(floor)) && (best === null || Math.abs(e.floor - floor) < Math.abs(best.floor - floor))) best = e;
      if (best !== null) break;
    }
    if (best.dir === "IDLE") best.dir = floor >= best.floor ? "UP" : "DOWN";
    best.stops.add(floor);
    console.log(`call ${floor} -> ${best.id}`);
  }

  run(e) {
    while (e.stops.size > 0) {
      const next = this.scheduler.next(e);
      const d = next > e.floor ? "UP" : next < e.floor ? "DOWN" : e.dir;
      if (d !== e.dir && e.dir !== "IDLE") console.log(`${e.id} turns ${d}`);
      e.dir = d;
      e.moved += Math.abs(next - e.floor);
      e.floor = next;
      e.stops.delete(next);
      console.log(`${e.id} stops at ${next} going ${d}`);
    }
    e.dir = "IDLE";
    console.log(`${e.id} idle at ${e.floor}, moved ${e.moved} floors`);
  }
}

const d = new Dispatcher();
const e1 = new Elevator("E1", 4, "UP"), e2 = new Elevator("E2", 0, "IDLE");
e1.stops.add(7);
d.elevators.push(e1, e2);
for (const f of [9, 1, 6, 2]) d.call(f);
e1.stops.add(3);
console.log("press 3 inside E1");
d.run(e1);
d.run(e2);
```

```output
call 9 -> E1
call 1 -> E2
call 6 -> E1
call 2 -> E2
press 3 inside E1
E1 stops at 6 going UP
E1 stops at 7 going UP
E1 stops at 9 going UP
E1 turns DOWN
E1 stops at 3 going DOWN
E1 idle at 3, moved 11 floors
E2 stops at 1 going UP
E2 stops at 2 going UP
E2 idle at 2, moved 2 floors
```

```game
type: match
title: Policy to behaviour
prompt: Match each scheduling policy to what it does.
- LOOK => turns at the last requested stop
- SCAN => rides to the end of the shaft, then turns
- First come, first served => serves calls in arrival order
- Nearest stop first => fewest floors now, but can starve far floors
why: LOOK and SCAN sweep, so every waiting floor is reached within two passes; nearest-first can keep serving one busy area forever.
```

## Extensions interviewers ask

- **Concurrency**: buttons fire from many threads; assign under a lock, or feed one dispatcher thread from a request queue.
- **Direction of a hall call**: an up call at 5 should not be picked up by a car going down past it.
- **Capacity**: skip hall calls when the car is full; the dispatcher reassigns them.
- **Displays**: floor indicators observe each car's floor and direction (Observer).
- **Rush hour**: a different Scheduler, such as parking idle cars at the lobby in the morning.

## Interview questions

- **Why a sorted set for stops?** The next stop in either direction is one ceiling or floor lookup, and duplicates vanish.
- **SCAN or LOOK?** LOOK in practice: it never rides to an end nobody asked for.
- **Can a floor starve?** Not under SCAN or LOOK: each sweep reaches it. Nearest-first can starve.
- **Where does the scheduling logic live?** In a Scheduler strategy, so the policy changes without touching Elevator ([SOLID](/notes/oop/solid-principles)).
- **How would you test it?** Feed calls with fixed timing and assert the stop order, as the program above does.

Next: [Design a Movie Ticket Booking System](/notes/low-level-design/design-a-movie-ticket-booking-system) · Before this: [Design a Vending Machine](/notes/low-level-design/design-a-vending-machine)

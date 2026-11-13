---
title: Design a Movie Ticket Booking System (BookMyShow)
order: 8
minutes: 9
level: intermediate
updated: 2026-11-14
seo-title: Movie Ticket Booking LLD (BookMyShow), Animated
description: Low-level design of a movie ticket booking system like BookMyShow: classes, seat holds with a timeout, the double-booking race and patterns, with code.
question: How do you design a movie ticket booking system like BookMyShow in an LLD interview?
answer: Model City, Cinema, Screen, Seat, Show, ShowSeat, Booking, Payment and User, with seat status on ShowSeat because a seat is free for one show and sold for another. Booking holds the chosen ShowSeats for a few minutes, takes payment, then marks them booked or releases them. A version check or row lock makes sure two buyers can never book the same seat.
q: Why do we need a ShowSeat class instead of putting status on Seat?
a: A Seat is physical and belongs to a screen for years, but it is free at the 6 pm show and sold at the 9 pm one. Status, price, version and hold expiry depend on the show, so they live on ShowSeat, one row per seat per show.
q: How do you stop two users from booking the same seat?
a: Make the write conditional. With optimistic locking each ShowSeat has a version and the hold is UPDATE … WHERE version = the one read, so only the first write changes a row. With pessimistic locking you SELECT … FOR UPDATE the rows inside a short transaction. Either way the database decides, not application code.
q: What is a seat hold and why does it expire?
a: A hold reserves seats for a few minutes while the user pays. Without expiry, a user who closes the tab would block the seats forever. Storing the expiry time on the seat lets a lapsed hold simply read as available, with a background sweep as a tidy-up only.
q: Should payment happen inside the database transaction?
a: No. A payment gateway can take seconds or time out, and holding row locks that long blocks other buyers. Hold the seats in one short transaction, call the gateway outside it, then confirm or release in another short transaction.
q: Which design patterns fit a booking system?
a: Strategy for pricing (weekday, weekend, premium rows, dynamic), Observer for notifications when a booking is confirmed or cancelled, State for the seat and booking lifecycles, and often a Singleton or dependency-injected BookingService as the one entry point.
---

A booking system sells a fixed, contested resource: one seat, one show, one buyer. The design interview is about the model and, above all, about the race when two people click the same seat.

## Entities and the class diagram

- **City → Cinema → Screen → Seat**: the physical side, rarely changes.
- **Show**: one movie, one start time, one screen.
- **ShowSeat**: one seat *for one show*, holding status, version and hold expiry.
- **Booking**: a user's ShowSeats for a show, the amount and a status.
- **Payment**: belongs to one booking; it decides confirm or release.

@figure class-diagram

## The booking flow

1. Read the show's seat map (ShowSeats, not Seats).
2. **Hold** the chosen seats in one short transaction, all or none, for a fixed time.
3. Charge the payment gateway *outside* any lock.
4. Success: mark the seats BOOKED and confirm. Failure: release them at once.
5. No answer in time: the hold lapses on its own.

@figure booking-sequence

```game
type: order
title: Book two seats
prompt: Put the steps of a booking in order.
- Read the show's seat map
- Hold both seats with a five-minute expiry
- Charge the card outside the transaction
- Mark the seats BOOKED
- Notify the user with the ticket
why: Seats are held before money moves, so nobody pays for a seat that is gone, and BOOKED is written only after the payment succeeds.
```

## Concurrency: two buyers, one seat

- Reading "A2 is free" proves nothing: the other buyer read it too.
- **Optimistic lock**: `UPDATE show_seat SET status = 'HELD', version = version + 1 WHERE id = ? AND version = ?`. Zero rows changed means you lost.
- **Pessimistic lock**: `SELECT … FOR UPDATE` on the seat rows, then write, then commit. Simple, but keep it short.
- A **unique constraint** on (show, seat) in a bookings table is a third guard.
- Never rely on an in-memory lock: you run more than one server.

@figure seat-race

```game
type: pick
title: Who gets the seat?
prompt: Each round is a moment in a race for one seat.
? Alice and bob both read A2 at version 0. Alice's conditional update lands first.
* Alice holds A2; bob's update changes 0 rows
- Both hold A2 until one pays
- Bob wins because he clicked last
> The version moved to 1, so bob's WHERE version = 0 matches nothing.
? Alice held A2 at t=0 for 5 minutes and never paid. Bob tries at t=7.
* Bob gets it: the hold lapsed at t=5
- Bob is refused until a cleanup job runs
- Alice is charged automatically
> An expiry stored on the seat makes a lapsed hold read as available.
? Alice's card is declined at t=2.
* Her seats are released immediately
- Her seats stay held until t=5
- Her seats become BOOKED
> A failed payment releases the hold at once, so others are not kept waiting.
```

## Seat status as a state machine

- **AVAILABLE** → hold → **HELD** → pay ok → **BOOKED**.
- **HELD** → payment fails or time runs out → **AVAILABLE**.
- **BOOKED** refuses every hold; a cancellation is its own transition.
- This is the State pattern: each state decides what each action may do.

@figure seat-states

## Patterns that fit

- **Strategy** for pricing: `price(seat, show)` swaps weekday, weekend or premium-row rules.
- **Observer** for notifications: mail, SMS and analytics subscribe to booking events.
- **State** for ShowSeat and Booking status.
- More in [design patterns](/notes/oop/design-patterns) and [design patterns in LLD](/notes/low-level-design/design-patterns-in-lld).

## The code

A version check and an expiring hold, then the race, a declined card and a lapsed hold.

```cpp
#include <functional>
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

const int HOLD = 5;  // minutes a seat hold lasts before it lapses
struct ShowSeat {  // one seat for one show: the row two buyers race for
    string status = "AVAILABLE";
    int version = 0, by = 0, until = 0;
    string state(int now) const {  // a lapsed hold reads as free: no cleanup job needed
        return status == "HELD" && now >= until ? "AVAILABLE" : status;
    }
    void write(const string& s, int b = 0, int u = 0) { status = s; by = b; until = u; version++; }  // every write bumps the version
};
struct Booking { int id; string user; vector<string> seats; int amount; };
string join(const vector<string>& v) {
    string r;
    for (size_t i = 0; i < v.size(); i++) r += (i ? " " : "") + v[i];
    return r;
}
class BookingService {
public:
    map<string, ShowSeat> seats;  // ordered by seat id
    function<int(const string&)> pricing;  // a Strategy: swap in weekend or dynamic pricing
    int nextId = 1;
    BookingService(vector<string> ids, function<int(const string&)> p) : pricing(p) {
        for (auto& s : ids) seats[s] = ShowSeat();
    }
    vector<int> read(const vector<string>& ids) {
        vector<int> v;
        for (auto& s : ids) v.push_back(seats[s].version);
        return v;
    }
    Booking* hold(const string& user, const vector<string>& ids, const vector<int>& seen, int now) {  // all seats or none
        string head = "t=" + to_string(now) + " " + user + " holds " + join(ids) + ": ";
        for (size_t i = 0; i < ids.size(); i++) {
            ShowSeat& seat = seats[ids[i]];
            if (seat.version != seen[i]) {  // UPDATE ... WHERE version = seen matched 0 rows
                cout << head << "FAILED, " << ids[i] << " is at version " << seat.version << ", expected " << seen[i] << "\n";
                return nullptr;
            }
            if (seat.state(now) != "AVAILABLE") { cout << head << "FAILED, " << ids[i] << " is taken\n"; return nullptr; }
        }
        int amount = 0;
        for (auto& s : ids) amount += pricing(s);
        Booking* b = new Booking{nextId++, user, ids, amount};
        for (auto& s : ids) seats[s].write("HELD", b->id, now + HOLD);
        cout << head << "OK, booking " << b->id << " held until t=" << now + HOLD << "\n";
        return b;
    }
    void pay(Booking* b, bool paid, int now) {
        vector<string> mine;
        for (auto& s : b->seats) if (seats[s].by == b->id && seats[s].state(now) == "HELD") mine.push_back(s);
        cout << "t=" << now << " " << b->user << " pays " << b->amount << ": ";
        if (paid && mine.size() == b->seats.size()) {
            for (auto& s : mine) seats[s].write("BOOKED", b->id);
            cout << "CONFIRMED booking " << b->id << "\n";
        } else {
            for (auto& s : mine) seats[s].write("AVAILABLE");
            cout << "FAILED, released " << join(mine) << "\n";
        }
    }
};
int main() {
    BookingService svc({"A1", "A2", "B1"}, [](const string& s) { return s[0] == 'A' ? 250 : 180; });  // front row A costs more
    vector<int> seenA = svc.read({"A1", "A2"}), seenB = svc.read({"A2", "B1"});  // both read before either writes
    cout << "alice and bob both read A2 at version " << seenA[1] << "\n";
    Booking* alice = svc.hold("alice", {"A1", "A2"}, seenA, 0);
    svc.hold("bob", {"A2", "B1"}, seenB, 0);
    svc.pay(alice, false, 2);  // the card is declined
    Booking* bob = svc.hold("bob", {"A2", "B1"}, svc.read({"A2", "B1"}), 3);
    svc.pay(bob, true, 4);
    svc.hold("carol", {"A1"}, svc.read({"A1"}), 6);  // carol never pays
    svc.hold("dave", {"A1"}, svc.read({"A1"}), 20);  // her hold lapsed at t=11
    cout << "t=20 seats:";
    for (auto& [id, s] : svc.seats) cout << " " << id << "=" << s.state(20);
    cout << "\n";
}
```

```java
import java.util.*;
import java.util.function.ToIntFunction;
public class Main {
    static final int HOLD = 5; // minutes a seat hold lasts before it lapses
    static class ShowSeat { // one seat for one show: the row two buyers race for
        final String id;
        String status = "AVAILABLE";
        int version = 0, by = 0, until = 0;
        ShowSeat(String id) { this.id = id; }
        String state(int now) { // a lapsed hold reads as free: no cleanup job needed
            return status.equals("HELD") && now >= until ? "AVAILABLE" : status;
        }
        void write(String s, int b, int u) { status = s; by = b; until = u; version++; } // every write bumps the version
    }
    record Booking(int id, String user, List<String> seats, int amount) {}
    static class BookingService {
        final Map<String, ShowSeat> seats = new TreeMap<>(); // ordered by seat id
        final ToIntFunction<String> pricing; // a Strategy: swap in weekend or dynamic pricing
        int nextId = 1;
        BookingService(List<String> ids, ToIntFunction<String> pricing) {
            for (String s : ids) seats.put(s, new ShowSeat(s));
            this.pricing = pricing;
        }
        List<Integer> read(List<String> ids) {
            List<Integer> v = new ArrayList<>();
            for (String s : ids) v.add(seats.get(s).version);
            return v;
        }
        Booking hold(String user, List<String> ids, List<Integer> seen, int now) { // all seats or none
            String head = "t=" + now + " " + user + " holds " + String.join(" ", ids) + ": ";
            for (int i = 0; i < ids.size(); i++) {
                ShowSeat seat = seats.get(ids.get(i));
                if (seat.version != seen.get(i)) { // UPDATE ... WHERE version = seen matched 0 rows
                    System.out.println(head + "FAILED, " + seat.id + " is at version " + seat.version + ", expected " + seen.get(i));
                    return null;
                }
                if (!seat.state(now).equals("AVAILABLE")) {
                    System.out.println(head + "FAILED, " + seat.id + " is taken");
                    return null;
                }
            }
            int amount = 0;
            for (String s : ids) amount += pricing.applyAsInt(s);
            Booking b = new Booking(nextId++, user, ids, amount);
            for (String s : ids) seats.get(s).write("HELD", b.id(), now + HOLD);
            System.out.println(head + "OK, booking " + b.id() + " held until t=" + (now + HOLD));
            return b;
        }
        void pay(Booking b, boolean paid, int now) {
            List<String> mine = new ArrayList<>();
            for (String s : b.seats()) if (seats.get(s).by == b.id() && seats.get(s).state(now).equals("HELD")) mine.add(s);
            String head = "t=" + now + " " + b.user() + " pays " + b.amount() + ": ";
            if (paid && mine.size() == b.seats().size()) {
                for (String s : mine) seats.get(s).write("BOOKED", b.id(), 0);
                System.out.println(head + "CONFIRMED booking " + b.id());
            } else {
                for (String s : mine) seats.get(s).write("AVAILABLE", 0, 0);
                System.out.println(head + "FAILED, released " + String.join(" ", mine));
            }
        }
    }
    public static void main(String[] args) {
        BookingService svc = new BookingService(List.of("A1", "A2", "B1"), s -> s.startsWith("A") ? 250 : 180); // front row A costs more
        List<Integer> seenA = svc.read(List.of("A1", "A2")), seenB = svc.read(List.of("A2", "B1")); // both read before either writes
        System.out.println("alice and bob both read A2 at version " + seenA.get(1));
        Booking alice = svc.hold("alice", List.of("A1", "A2"), seenA, 0);
        svc.hold("bob", List.of("A2", "B1"), seenB, 0);
        svc.pay(alice, false, 2); // the card is declined
        Booking bob = svc.hold("bob", List.of("A2", "B1"), svc.read(List.of("A2", "B1")), 3);
        svc.pay(bob, true, 4);
        svc.hold("carol", List.of("A1"), svc.read(List.of("A1")), 6); // carol never pays
        svc.hold("dave", List.of("A1"), svc.read(List.of("A1")), 20); // her hold lapsed at t=11
        StringBuilder out = new StringBuilder("t=20 seats:");
        for (ShowSeat s : svc.seats.values()) out.append(" ").append(s.id).append("=").append(s.state(20));
        System.out.println(out);
    }
}
```

```python
HOLD = 5  # minutes a seat hold lasts before it lapses


class ShowSeat:  # one seat for one show: the row two buyers race for
    def __init__(self, sid):
        self.id, self.status, self.version, self.by, self.until = sid, "AVAILABLE", 0, 0, 0

    def state(self, now):  # a lapsed hold reads as free: no cleanup job needed
        return "AVAILABLE" if self.status == "HELD" and now >= self.until else self.status

    def write(self, status, by=0, until=0):  # every write bumps the version
        self.status, self.by, self.until = status, by, until
        self.version += 1


class Booking:
    def __init__(self, bid, user, seats, amount):
        self.id, self.user, self.seats, self.amount = bid, user, seats, amount


class BookingService:
    def __init__(self, seat_ids, pricing):
        self.seats = {s: ShowSeat(s) for s in seat_ids}
        self.pricing, self.next_id = pricing, 1  # pricing is a Strategy

    def read(self, ids):
        return [self.seats[s].version for s in ids]

    def hold(self, user, ids, seen, now):  # all seats or none, like one transaction
        head = f"t={now} {user} holds {' '.join(ids)}: "
        for s, v in zip(ids, seen):
            seat = self.seats[s]
            if seat.version != v:  # UPDATE ... WHERE version = seen matched 0 rows
                print(f"{head}FAILED, {s} is at version {seat.version}, expected {v}")
                return None
            if seat.state(now) != "AVAILABLE":
                print(f"{head}FAILED, {s} is taken")
                return None
        b = Booking(self.next_id, user, ids, sum(self.pricing(s) for s in ids))
        self.next_id += 1
        for s in ids:
            self.seats[s].write("HELD", b.id, now + HOLD)
        print(f"{head}OK, booking {b.id} held until t={now + HOLD}")
        return b

    def pay(self, b, paid, now):
        mine = [s for s in b.seats if self.seats[s].by == b.id and self.seats[s].state(now) == "HELD"]
        head = f"t={now} {b.user} pays {b.amount}: "
        if paid and len(mine) == len(b.seats):
            for s in mine:
                self.seats[s].write("BOOKED", b.id)
            print(f"{head}CONFIRMED booking {b.id}")
        else:
            for s in mine:
                self.seats[s].write("AVAILABLE")
            print(f"{head}FAILED, released {' '.join(mine)}")


def row_pricing(seat):  # front row A costs more
    return 250 if seat.startswith("A") else 180


svc = BookingService(["A1", "A2", "B1"], row_pricing)
seen_a, seen_b = svc.read(["A1", "A2"]), svc.read(["A2", "B1"])  # both read before either writes
print(f"alice and bob both read A2 at version {seen_a[1]}")
alice = svc.hold("alice", ["A1", "A2"], seen_a, 0)
svc.hold("bob", ["A2", "B1"], seen_b, 0)
svc.pay(alice, False, 2)  # the card is declined
bob = svc.hold("bob", ["A2", "B1"], svc.read(["A2", "B1"]), 3)
svc.pay(bob, True, 4)
svc.hold("carol", ["A1"], svc.read(["A1"]), 6)  # carol never pays
svc.hold("dave", ["A1"], svc.read(["A1"]), 20)  # her hold lapsed at t=11
print("t=20 seats: " + " ".join(f"{s}={svc.seats[s].state(20)}" for s in sorted(svc.seats)))
```

```javascript
const HOLD = 5; // minutes a seat hold lasts before it lapses

class ShowSeat { // one seat for one show: the row two buyers race for
  constructor(id) {
    this.id = id;
    this.status = "AVAILABLE";
    this.version = 0;
    this.by = 0;
    this.until = 0;
  }
  state(now) { // a lapsed hold reads as free: no cleanup job needed
    return this.status === "HELD" && now >= this.until ? "AVAILABLE" : this.status;
  }
  write(status, by = 0, until = 0) { // every write bumps the version
    this.status = status;
    this.by = by;
    this.until = until;
    this.version++;
  }
}

class BookingService {
  constructor(ids, pricing) {
    this.seats = new Map(ids.map((s) => [s, new ShowSeat(s)]));
    this.pricing = pricing; // a Strategy: swap in weekend or dynamic pricing
    this.nextId = 1;
  }
  read(ids) { return ids.map((s) => this.seats.get(s).version); }
  hold(user, ids, seen, now) { // all seats or none, like one transaction
    const head = `t=${now} ${user} holds ${ids.join(" ")}: `;
    for (let i = 0; i < ids.length; i++) {
      const seat = this.seats.get(ids[i]);
      if (seat.version !== seen[i]) { // UPDATE ... WHERE version = seen matched 0 rows
        console.log(`${head}FAILED, ${ids[i]} is at version ${seat.version}, expected ${seen[i]}`);
        return null;
      }
      if (seat.state(now) !== "AVAILABLE") {
        console.log(`${head}FAILED, ${ids[i]} is taken`);
        return null;
      }
    }
    const b = { id: this.nextId++, user, seats: ids, amount: ids.reduce((sum, s) => sum + this.pricing(s), 0) };
    for (const s of ids) this.seats.get(s).write("HELD", b.id, now + HOLD);
    console.log(`${head}OK, booking ${b.id} held until t=${now + HOLD}`);
    return b;
  }
  pay(b, paid, now) {
    const mine = b.seats.filter((s) => this.seats.get(s).by === b.id && this.seats.get(s).state(now) === "HELD");
    const head = `t=${now} ${b.user} pays ${b.amount}: `;
    if (paid && mine.length === b.seats.length) {
      for (const s of mine) this.seats.get(s).write("BOOKED", b.id);
      console.log(`${head}CONFIRMED booking ${b.id}`);
    } else {
      for (const s of mine) this.seats.get(s).write("AVAILABLE");
      console.log(`${head}FAILED, released ${mine.join(" ")}`);
    }
  }
}

const svc = new BookingService(["A1", "A2", "B1"], (s) => (s.startsWith("A") ? 250 : 180)); // front row A costs more
const seenA = svc.read(["A1", "A2"]);
const seenB = svc.read(["A2", "B1"]); // both read before either writes
console.log(`alice and bob both read A2 at version ${seenA[1]}`);
const alice = svc.hold("alice", ["A1", "A2"], seenA, 0);
svc.hold("bob", ["A2", "B1"], seenB, 0);
svc.pay(alice, false, 2); // the card is declined
const bob = svc.hold("bob", ["A2", "B1"], svc.read(["A2", "B1"]), 3);
svc.pay(bob, true, 4);
svc.hold("carol", ["A1"], svc.read(["A1"]), 6); // carol never pays
svc.hold("dave", ["A1"], svc.read(["A1"]), 20); // her hold lapsed at t=11
console.log("t=20 seats: " + [...svc.seats.keys()].sort().map((s) => `${s}=${svc.seats.get(s).state(20)}`).join(" "));
```

```output
alice and bob both read A2 at version 0
t=0 alice holds A1 A2: OK, booking 1 held until t=5
t=0 bob holds A2 B1: FAILED, A2 is at version 1, expected 0
t=2 alice pays 500: FAILED, released A1 A2
t=3 bob holds A2 B1: OK, booking 2 held until t=8
t=4 bob pays 430: CONFIRMED booking 2
t=6 carol holds A1: OK, booking 3 held until t=11
t=20 dave holds A1: OK, booking 4 held until t=25
t=20 seats: A1=HELD A2=BOOKED B1=BOOKED
```

## Interview questions

- **Where does seat status live?** On ShowSeat, one row per seat per show; Seat stays physical.
- **How do you prevent double booking?** A conditional write (version check) or `SELECT … FOR UPDATE`, decided by the database, plus a unique constraint as a backstop.
- **Why hold before paying?** So nobody pays for a seat that is already gone; the hold's expiry frees seats from abandoned checkouts.
- **What if payment succeeds after the hold lapsed?** Confirm only if the seats are still held by this booking; otherwise refund automatically.
- **How would you scale a blockbuster release?** Shard by show, cache the seat map briefly, and keep the hold write as the one strongly consistent step.

Next: [Design an Expense Sharing App (Splitwise)](/notes/low-level-design/design-an-expense-sharing-app) · Before this: [Design an Elevator System](/notes/low-level-design/design-an-elevator-system)

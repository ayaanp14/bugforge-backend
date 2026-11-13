---
title: Design a Vending Machine
order: 6
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Vending Machine LLD: State Pattern and Code
description: Vending machine low-level design: the State pattern over Idle, HasMoney, Dispensing and OutOfStock, greedy change-making, a class diagram and runnable code.
question: How do you design a vending machine in a low-level design interview?
answer: Model a VendingMachine that holds a balance, its items and a current State. Each state (Idle, HasMoney, Dispensing, OutOfStock) handles insert, select and dispense in its own way and moves the machine to the next state. Change is made greedily from the largest coin down, which is optimal for canonical coin sets such as 10, 5, 2 and 1.
q: Why is the State pattern used for a vending machine?
a: What a coin or a button does depends on what the machine is doing: a coin in Idle starts a sale, in OutOfStock it is returned. The State pattern puts each state's answers in its own class, replacing a growing chain of if-else on a status field.
q: What are the states of a vending machine?
a: Idle (waiting for money), HasMoney (collecting coins and waiting for a selection), Dispensing (dropping the item and the change) and OutOfStock (nothing left to sell). Real designs add Maintenance or a cancel path that refunds the balance.
q: How does a vending machine calculate change?
a: It subtracts the price from the balance and pays the rest with the largest coin that fits, repeatedly. That greedy rule gives the fewest coins for canonical sets like 10, 5, 2, 1, but not for every set; with limited coins in the machine, a dynamic-programming search is safer.
q: What happens if the customer cannot pay the full price?
a: HasMoney refuses the selection, tells the customer how much more is needed and stays in HasMoney. A cancel button returns the whole balance and moves the machine back to Idle.
q: How do you add a new state such as Maintenance?
a: Write one new class that implements the State interface and decide which existing states move into it. The machine and the other states' logic stay as they are, which is the open-closed principle at work.
---

A vending machine is the textbook case for the **State pattern**: the same button means different things depending on what the machine is doing, and that is easiest to model as one class per state.

## Requirements

- Items in slots (A1, A2), each with a **price** and a **stock** count.
- Accept coins of 1, 2, 5 and 10; keep a running **balance**.
- **Select** an item: refuse it if unpaid or sold out, otherwise **dispense** it and return **change**.
- When every slot is empty, return any coin inserted.
- Out of scope unless asked: notes, cards, a refund button, restocking.

## Classes and relations

@figure class-diagram

- The machine **delegates** every event to its current `State` and holds no if-chain on a status.
- States decide the **transition**: each calls `machine.move(next)`.
- Read the pattern in [design patterns](/notes/oop/design-patterns); a new state is a new class, the [open-closed principle](/notes/oop/solid-principles).

## The states at work

@figure state-machine

| State | insert coin | select item |
| --- | --- | --- |
| Idle | add it, go to HasMoney | ignored |
| HasMoney | add it | if paid, go to Dispensing |
| Dispensing | returned (busy) | ignored |
| OutOfStock | returned | ignored |

```game
type: order
title: One purchase, state by state
prompt: Put the steps of buying chips with two coins in order.
- The machine waits in Idle
- A first coin moves it to HasMoney
- A second coin stays in HasMoney and raises the balance
- Pressing A1 with enough money moves it to Dispensing
- The item and change drop and it returns to Idle
why: Only a coin leaves Idle, only a paid selection leaves HasMoney, and Dispensing always ends in Idle or OutOfStock.
```

@figure select-sequence

## Making change

@figure change-making

- **Greedy**: largest coin that fits, repeat. Optimal for 10/5/2/1.
- Not optimal for every coin set (4/3/1 above); then use dynamic programming.
- A real machine also has **limited coins**: check it can pay the change before dispensing, or refuse the sale.

```game
type: pick
title: Which state answers?
prompt: Pick the state that handles each event.
? A coin is inserted after the last item was sold.
- Idle
- HasMoney
* OutOfStock
> OutOfStock returns the coin at once instead of starting a sale it cannot finish.
? A customer with 10 in presses a 15 item.
- Idle
* HasMoney
- Dispensing
> HasMoney holds the balance, refuses the selection and asks for 5 more.
? The machine is dropping an item and a coin arrives.
- HasMoney
* Dispensing
- OutOfStock
> Dispensing is busy, so it returns the coin rather than mixing it into the finished sale.
```

## The code

The four states, greedy change, and one scenario: an underpaid selection, a sale with change, a sale that empties the machine, and a coin returned when sold out.

```cpp
#include <iostream>
#include <map>
#include <string>
using namespace std;

struct Item { string name; int price; int stock; };
struct Machine;

// Each state answers the events itself; the machine only points at the current one.
struct State {
    virtual string name() const = 0;
    virtual void insert(Machine& m, int coin) = 0;
    virtual void select(Machine& m, const string& code) { cout << "select " << code << ": ignored in " << name() << "\n"; }
    virtual void dispense(Machine& m) {}
};
struct Idle : State { string name() const override { return "Idle"; } void insert(Machine& m, int coin) override; };
struct HasMoney : State {
    string name() const override { return "HasMoney"; }
    void insert(Machine& m, int coin) override;
    void select(Machine& m, const string& code) override;
};
struct Dispensing : State {
    string name() const override { return "Dispensing"; }
    void insert(Machine& m, int coin) override { cout << "insert " << coin << ": busy, returned " << coin << "\n"; }
    void dispense(Machine& m) override;
};
struct OutOfStock : State {
    string name() const override { return "OutOfStock"; }
    void insert(Machine& m, int coin) override { cout << "insert " << coin << ": sold out, returned " << coin << "\n"; }
};
// States hold no data of their own, so one shared instance of each is enough.
Idle IDLE; HasMoney HAS_MONEY; Dispensing DISPENSING; OutOfStock OUT_OF_STOCK;

struct Machine {
    map<string, Item> items;
    State* state = &IDLE;
    int balance = 0;
    Item* selected = nullptr;
    void move(State* next, const string& event, const string& note) {
        cout << event << ": " << state->name() << " -> " << next->name() << (note.empty() ? "" : ", " + note) << "\n";
        state = next;
    }
    // Greedy: the largest coin that fits, again and again (optimal for 10/5/2/1).
    static string change(int amount) {
        string out;
        for (int c : {10, 5, 2, 1}) while (amount >= c) { out += (out.empty() ? "" : "+") + to_string(c); amount -= c; }
        return out.empty() ? "none" : out;
    }
};

void Idle::insert(Machine& m, int coin) { m.balance += coin; m.move(&HAS_MONEY, "insert " + to_string(coin), "balance " + to_string(m.balance)); }
void HasMoney::insert(Machine& m, int coin) { m.balance += coin; cout << "insert " << coin << ": balance " << m.balance << "\n"; }
void HasMoney::select(Machine& m, const string& code) {
    Item& item = m.items.at(code);
    if (item.stock == 0) { cout << "select " << code << ": " << item.name << " sold out\n"; return; }
    if (m.balance < item.price) {
        cout << "select " << code << ": " << item.name << " costs " << item.price << ", insert " << item.price - m.balance << " more\n";
        return;
    }
    m.selected = &item;
    m.move(&DISPENSING, "select " + code, "");
    m.state->dispense(m);
}
void Dispensing::dispense(Machine& m) {
    Item& item = *m.selected;
    item.stock--;
    string change = Machine::change(m.balance - item.price);
    m.balance = 0;
    bool empty = true;
    for (auto& [code, i] : m.items) if (i.stock > 0) empty = false;
    m.move(empty ? (State*)&OUT_OF_STOCK : &IDLE, "dispense", item.name + ", change " + change);
}

int main() {
    Machine m;
    m.items["A1"] = {"Chips", 15, 1}; m.items["A2"] = {"Juice", 22, 1};
    m.state->insert(m, 10); m.state->select(m, "A1"); m.state->insert(m, 10); m.state->select(m, "A1");
    m.state->insert(m, 10); m.state->insert(m, 10); m.state->insert(m, 10); m.state->select(m, "A2");
    m.state->insert(m, 10);
}
```

```java
import java.util.*;

public class Main {
    static class Item {
        final String name; final int price; int stock;
        Item(String name, int price, int stock) { this.name = name; this.price = price; this.stock = stock; }
    }

    interface State {
        String name();
        void insert(Machine m, int coin);
        default void select(Machine m, String code) { System.out.println("select " + code + ": ignored in " + name()); }
        default void dispense(Machine m) {}
    }

    static class Idle implements State {
        public String name() { return "Idle"; }
        public void insert(Machine m, int coin) { m.balance += coin; m.move(new HasMoney(), "insert " + coin, "balance " + m.balance); }
    }
    static class HasMoney implements State {
        public String name() { return "HasMoney"; }
        public void insert(Machine m, int coin) { m.balance += coin; System.out.println("insert " + coin + ": balance " + m.balance); }
        public void select(Machine m, String code) {
            Item item = m.items.get(code);
            if (item.stock == 0) { System.out.println("select " + code + ": " + item.name + " sold out"); return; }
            if (m.balance < item.price) {
                System.out.println("select " + code + ": " + item.name + " costs " + item.price + ", insert " + (item.price - m.balance) + " more");
                return;
            }
            m.selected = item;
            m.move(new Dispensing(), "select " + code, null);
            m.state.dispense(m);
        }
    }
    static class Dispensing implements State {
        public String name() { return "Dispensing"; }
        public void insert(Machine m, int coin) { System.out.println("insert " + coin + ": busy, returned " + coin); }
        public void dispense(Machine m) {
            Item item = m.selected;
            item.stock--;
            String change = Machine.change(m.balance - item.price);
            m.balance = 0;
            boolean empty = m.items.values().stream().allMatch(i -> i.stock == 0);
            m.move(empty ? new OutOfStock() : new Idle(), "dispense", item.name + ", change " + change);
        }
    }
    static class OutOfStock implements State {
        public String name() { return "OutOfStock"; }
        public void insert(Machine m, int coin) { System.out.println("insert " + coin + ": sold out, returned " + coin); }
    }

    static class Machine {
        static final int[] COINS = {10, 5, 2, 1};
        final Map<String, Item> items = new TreeMap<>();
        State state = new Idle();
        int balance = 0;
        Item selected;

        void move(State next, String event, String note) {
            System.out.println(event + ": " + state.name() + " -> " + next.name() + (note == null ? "" : ", " + note));
            state = next;
        }

        // Greedy: the largest coin that fits, again and again (optimal for 10/5/2/1).
        static String change(int amount) {
            List<String> coins = new ArrayList<>();
            for (int c : COINS) while (amount >= c) { coins.add(String.valueOf(c)); amount -= c; }
            return coins.isEmpty() ? "none" : String.join("+", coins);
        }
    }

    public static void main(String[] args) {
        Machine m = new Machine();
        m.items.put("A1", new Item("Chips", 15, 1));
        m.items.put("A2", new Item("Juice", 22, 1));
        m.state.insert(m, 10); m.state.select(m, "A1"); m.state.insert(m, 10); m.state.select(m, "A1");
        m.state.insert(m, 10); m.state.insert(m, 10); m.state.insert(m, 10); m.state.select(m, "A2");
        m.state.insert(m, 10);
    }
}
```

```python
class Item:
    def __init__(self, name, price, stock):
        self.name, self.price, self.stock = name, price, stock

# Each state answers the events itself; the machine only holds the current one.
class State:
    name = "State"
    def insert(self, m, coin): ...
    def select(self, m, code):
        print(f"select {code}: ignored in {self.name}")
    def dispense(self, m): ...

class Idle(State):
    name = "Idle"
    def insert(self, m, coin):
        m.balance += coin
        m.move(HasMoney(), f"insert {coin}", f"balance {m.balance}")

class HasMoney(State):
    name = "HasMoney"
    def insert(self, m, coin):
        m.balance += coin
        print(f"insert {coin}: balance {m.balance}")
    def select(self, m, code):
        item = m.items[code]
        if item.stock == 0:
            print(f"select {code}: {item.name} sold out")
            return
        if m.balance < item.price:
            print(f"select {code}: {item.name} costs {item.price}, insert {item.price - m.balance} more")
            return
        m.selected = item
        m.move(Dispensing(), f"select {code}", None)
        m.state.dispense(m)

class Dispensing(State):
    name = "Dispensing"
    def insert(self, m, coin):
        print(f"insert {coin}: busy, returned {coin}")
    def dispense(self, m):
        item = m.selected
        item.stock -= 1
        change = Machine.change(m.balance - item.price)
        m.balance = 0
        empty = all(i.stock == 0 for i in m.items.values())
        m.move(OutOfStock() if empty else Idle(), "dispense", f"{item.name}, change {change}")

class OutOfStock(State):
    name = "OutOfStock"
    def insert(self, m, coin):
        print(f"insert {coin}: sold out, returned {coin}")

class Machine:
    def __init__(self):
        self.items, self.state, self.balance, self.selected = {}, Idle(), 0, None
    def move(self, nxt, event, note):
        print(f"{event}: {self.state.name} -> {nxt.name}" + ("" if note is None else f", {note}"))
        self.state = nxt
    @staticmethod
    def change(amount):
        """Greedy: the largest coin that fits, again and again (optimal for 10/5/2/1)."""
        coins = []
        for c in (10, 5, 2, 1):
            while amount >= c:
                coins.append(str(c))
                amount -= c
        return "+".join(coins) if coins else "none"

m = Machine()
m.items["A1"] = Item("Chips", 15, 1)
m.items["A2"] = Item("Juice", 22, 1)
m.state.insert(m, 10); m.state.select(m, "A1"); m.state.insert(m, 10); m.state.select(m, "A1")
m.state.insert(m, 10); m.state.insert(m, 10); m.state.insert(m, 10); m.state.select(m, "A2")
m.state.insert(m, 10)
```

```javascript
class Item {
  constructor(name, price, stock) { this.name = name; this.price = price; this.stock = stock; }
}

// Each state answers the events itself; the machine only holds the current one.
class State {
  select(m, code) { console.log(`select ${code}: ignored in ${this.name}`); }
  dispense(m) {}
}

class Idle extends State {
  get name() { return "Idle"; }
  insert(m, coin) { m.balance += coin; m.move(new HasMoney(), `insert ${coin}`, `balance ${m.balance}`); }
}

class HasMoney extends State {
  get name() { return "HasMoney"; }
  insert(m, coin) { m.balance += coin; console.log(`insert ${coin}: balance ${m.balance}`); }
  select(m, code) {
    const item = m.items.get(code);
    if (item.stock === 0) { console.log(`select ${code}: ${item.name} sold out`); return; }
    if (m.balance < item.price) {
      console.log(`select ${code}: ${item.name} costs ${item.price}, insert ${item.price - m.balance} more`);
      return;
    }
    m.selected = item;
    m.move(new Dispensing(), `select ${code}`, null);
    m.state.dispense(m);
  }
}

class Dispensing extends State {
  get name() { return "Dispensing"; }
  insert(m, coin) { console.log(`insert ${coin}: busy, returned ${coin}`); }
  dispense(m) {
    const item = m.selected;
    item.stock--;
    const change = Machine.change(m.balance - item.price);
    m.balance = 0;
    const empty = [...m.items.values()].every((i) => i.stock === 0);
    m.move(empty ? new OutOfStock() : new Idle(), "dispense", `${item.name}, change ${change}`);
  }
}

class OutOfStock extends State {
  get name() { return "OutOfStock"; }
  insert(m, coin) { console.log(`insert ${coin}: sold out, returned ${coin}`); }
}

class Machine {
  constructor() { this.items = new Map(); this.state = new Idle(); this.balance = 0; this.selected = null; }
  move(next, event, note) {
    console.log(`${event}: ${this.state.name} -> ${next.name}${note === null ? "" : `, ${note}`}`);
    this.state = next;
  }
  // Greedy: the largest coin that fits, again and again (optimal for 10/5/2/1).
  static change(amount) {
    const coins = [];
    for (const c of [10, 5, 2, 1]) while (amount >= c) { coins.push(c); amount -= c; }
    return coins.length ? coins.join("+") : "none";
  }
}

const m = new Machine();
m.items.set("A1", new Item("Chips", 15, 1));
m.items.set("A2", new Item("Juice", 22, 1));
m.state.insert(m, 10); m.state.select(m, "A1"); m.state.insert(m, 10); m.state.select(m, "A1");
m.state.insert(m, 10); m.state.insert(m, 10); m.state.insert(m, 10); m.state.select(m, "A2");
m.state.insert(m, 10);
```

```output
insert 10: Idle -> HasMoney, balance 10
select A1: Chips costs 15, insert 5 more
insert 10: balance 20
select A1: HasMoney -> Dispensing
dispense: Dispensing -> Idle, Chips, change 5
insert 10: Idle -> HasMoney, balance 10
insert 10: balance 20
insert 10: balance 30
select A2: HasMoney -> Dispensing
dispense: Dispensing -> OutOfStock, Juice, change 5+2+1
insert 10: sold out, returned 10
```

## Extensions interviewers ask

- **Cancel**: a refund event in HasMoney returns the balance and goes to Idle.
- **Payments**: cash, card and UPI behind a `Payment` interface (Strategy).
- **Concurrency**: one machine serves one customer; lock the state change if events can arrive from two threads (keypad and a remote app).
- **Restocking**: a Maintenance state that an operator enters with a key; OutOfStock leaves it when stock returns.
- **Display**: the panel observes the machine's balance and state (Observer).

## Interview questions

- **Why not a switch on a status enum?** Every new state edits every method; with State it is one new class.
- **Who triggers a transition, the machine or the state?** The state, through `machine.move(next)`; the machine only delegates.
- **Is greedy change always correct?** Only for canonical coin sets; otherwise use dynamic programming.
- **What if the machine cannot make change?** Check before dispensing and refuse the sale, returning the balance.
- **Should states be singletons?** They hold no data, so one shared instance each is fine.

Next: [Design an Elevator System](/notes/low-level-design/design-an-elevator-system) · Before this: [Design a Parking Lot](/notes/low-level-design/design-a-parking-lot)

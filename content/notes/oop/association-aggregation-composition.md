---
title: Association, Aggregation and Composition
order: 7
minutes: 14
level: intermediate
updated: 2026-10-05
seo-title: Association vs Aggregation vs Composition in OOP
description: Association, aggregation and composition in OOP: has-a vs is-a, object lifetimes, UML notation, ownership in C++, and composition over inheritance.
question: What is the difference between association, aggregation and composition in OOP?
answer: All three are has-a relationships, from weakest to strongest. Association means one object knows about or uses another and both live independently. Aggregation is a whole-part association whose parts can exist without the whole, like a team and its players. Composition is whole-part with ownership: the whole creates its parts and they end with it, like a house and its rooms.
q: What is a has-a relationship in OOP?
a: A has-a relationship means one object holds a reference to another as a field: a Car has an Engine, a Department has Professors. It is the alternative to inheritance's is-a relationship, and it covers association, aggregation and composition, which differ in how strongly the holder owns the object it holds.
q: What is the difference between aggregation and composition?
a: Both are whole-part relationships. In aggregation the parts have their own life: they are usually created elsewhere, can be shared, and survive when the whole is destroyed. In composition the whole owns its parts exclusively: it creates them, nobody else holds them, and they are destroyed with it.
q: What does composition over inheritance mean?
a: It is the design guideline, popularised by the Gang of Four's Design Patterns book, to reuse behaviour by holding objects that provide it rather than by inheriting from them. Composition exposes only the methods you choose, can swap parts at run time and does not tie a class to its parent's internals.
q: How are aggregation and composition drawn in UML?
a: Both are a line between the two classes with a diamond at the whole's end. Aggregation uses a hollow diamond and composition a filled, black diamond. A plain line is an association, a dashed arrow is a dependency, and a line ending in a hollow triangle is inheritance.
q: Can a part belong to two wholes?
a: In aggregation, yes: a professor can belong to two departments, a song to many playlists. In composition, no: a part has exactly one owner at a time, which is what lets the owner destroy it safely. Ownership can be transferred, as with std::unique_ptr in C++, but never shared.
---
Inheritance is not the only way for classes to work together, and usually not the best one. Most relationships in a real design are **has-a**: an order has order lines, a car has an engine, a course has students. OOP names three strengths of has-a — **association**, **aggregation** and **composition** — and the difference between them is about **ownership and lifetime**: who creates the other object, who else may hold it, and whether it outlives its holder. Interviewers ask about these to see whether you can model a system, and they almost always follow up with "composition over inheritance".

## How classes relate

| Relationship | Meaning | Lifetimes | UML | Example |
| --- | --- | --- | --- | --- |
| Dependency | Uses another class briefly: a parameter or local variable | Unrelated | Dashed arrow | `Invoice.print(Printer p)` |
| Association | Knows another object, kept as a field | Independent | Plain line | Teacher and Student |
| Aggregation | Whole made of parts it does not own | Parts outlive the whole | Hollow diamond at the whole | Team and Player |
| Composition | Whole that owns its parts | Parts end with the whole | Filled diamond at the whole | House and Room |
| Inheritance | Is a kind of | One object | Hollow triangle at the parent | Car and Vehicle |

Read the middle three as a scale. Every composition is an aggregation, and every aggregation is an association; each step adds a stronger claim about ownership.

```text
  Teacher ----------- Student        association: each knows the other
  Team    <>--------- Player         aggregation: hollow diamond on the whole
  House   <#>-------- Room           composition: filled diamond on the whole
  Car     ----------|> Vehicle       inheritance: hollow triangle on the parent
```

## Association

An **association** is any lasting link between objects of two classes, where neither owns the other. A teacher teaches students; a student is taught by teachers; either can exist without the other.

Two properties describe an association:

- **Multiplicity** — how many objects on each side: one-to-one (a person and their passport), one-to-many (a customer and their orders), many-to-many (teachers and students).
- **Direction** — whether one side knows the other (unidirectional: an `Order` knows its `Customer`, but the customer object does not list orders) or both do (bidirectional). Bidirectional links must be kept consistent by code: adding a student to a teacher should also add the teacher to the student.

A **dependency** is weaker than association: the class only uses the other one inside a method, as a parameter or a local variable, and keeps no reference afterwards.

## Aggregation

**Aggregation** is a whole-part association in which the whole does not own its parts. The parts are typically created elsewhere and handed to the whole; they can be shared between several wholes; and when the whole is destroyed, the parts carry on.

- A **team** aggregates **players**: disband the team and the players still exist and can join another.
- A **department** aggregates **professors**: a professor can hold appointments in two departments.
- A **playlist** aggregates **songs**: deleting a playlist does not delete the songs.

## Composition

**Composition** is a whole-part relationship with exclusive ownership. The whole creates its parts (or receives sole ownership of them), no other object holds them, and they are destroyed together with the whole. The part does not make sense on its own in the model.

- A **house** is composed of **rooms**: demolish the house and the rooms are gone.
- An **order** is composed of **order lines**: an order line belongs to exactly one order.
- A **document** is composed of its **paragraphs**.

Whether a relationship is aggregation or composition depends on the **system you are modelling**, not on the real world. In a car-rental app, an engine is part of a car and nobody tracks it separately: composition. In a scrapyard's inventory, engines are removed and resold on their own: aggregation. Say this in an interview; it shows you are modelling, not reciting.

## How the relationships look in code

| | C++ | Java | Python |
| --- | --- | --- | --- |
| Association, aggregation | A non-owning pointer or reference; `shared_ptr` when ownership is shared | A reference field, set from outside | An attribute, set from outside |
| Composition | A member held by value, or a `unique_ptr` | A field created inside the class and never handed out | An attribute created in `__init__` and not exposed |
| Who frees the part | Destroyed automatically with the whole | The garbage collector, once nothing refers to it | Reference counting or the cycle collector |

C++ makes ownership visible in the types: `unique_ptr` means "I am the only owner", `shared_ptr` means "we share ownership", and a raw pointer or reference means "I use this but do not own it". In Java and Python the garbage collector frees an object only when it becomes unreachable, so composition there is a design promise: if a `Car` leaks a reference to its `Engine`, the engine can outlive the car.

The program below models a car that **composes** its engine — it builds the engine in its own constructor — and **aggregates** a driver who is created separately, drives two different cars and outlives the first one. The car's `start()` **delegates** to its engine: it forwards the work to the part it holds.

```cpp
#include <iostream>
#include <string>
using namespace std;

class Engine {  // a part: only ever created by a Car
    int cc;
public:
    explicit Engine(int cc) : cc(cc) {}
    string start() const { return to_string(cc) + "cc engine started"; }
};

class Driver {  // independent: exists before and after any car
    string name;
    int trips = 0;
public:
    explicit Driver(string name) : name(name) {}
    void recordTrip() { trips++; }
    string getName() const { return name; }
    int getTrips() const { return trips; }
};

class Car {
    string reg;
    Engine engine;             // composition: the car builds and owns its engine
    Driver* driver = nullptr;  // aggregation: the car only refers to a driver
public:
    Car(string reg, int cc) : reg(reg), engine(cc) {}
    void assign(Driver& d) { driver = &d; }
    void start() {
        driver->recordTrip();
        cout << reg << ": " << engine.start() << ", driven by " << driver->getName() << "\n";  // delegation
    }
};

int main() {
    Driver asha("Asha");
    {
        Car first("KA-01-1234", 1197);
        first.assign(asha);
        first.start();
    }  // first and its engine are destroyed here; asha is not
    Car second("KA-05-9876", 1462);
    second.assign(asha);
    second.start();
    cout << asha.getName() << " has driven " << asha.getTrips() << " cars\n";
    return 0;
}
```

```java
class Engine {  // a part: only ever created by a Car
    private final int cc;
    Engine(int cc) { this.cc = cc; }
    String start() { return cc + "cc engine started"; }
}

class Driver {  // independent: exists before and after any car
    private final String name;
    private int trips = 0;
    Driver(String name) { this.name = name; }
    void recordTrip() { trips++; }
    String getName() { return name; }
    int getTrips() { return trips; }
}

class Car {
    private final String reg;
    private final Engine engine;  // composition: created here, never handed out
    private Driver driver;        // aggregation: set from outside

    Car(String reg, int cc) { this.reg = reg; this.engine = new Engine(cc); }
    void assign(Driver d) { driver = d; }
    void start() {
        driver.recordTrip();
        System.out.println(reg + ": " + engine.start() + ", driven by " + driver.getName());  // delegation
    }
}

public class Main {
    public static void main(String[] args) {
        Driver asha = new Driver("Asha");
        Car first = new Car("KA-01-1234", 1197);
        first.assign(asha);
        first.start();
        first = null;  // the first car and its engine become unreachable; asha does not
        Car second = new Car("KA-05-9876", 1462);
        second.assign(asha);
        second.start();
        System.out.println(asha.getName() + " has driven " + asha.getTrips() + " cars");
    }
}
```

```python
class Engine:  # a part: only ever created by a Car
    def __init__(self, cc):
        self._cc = cc

    def start(self):
        return f"{self._cc}cc engine started"


class Driver:  # independent: exists before and after any car
    def __init__(self, name):
        self.name = name
        self.trips = 0


class Car:
    def __init__(self, reg, cc):
        self._reg = reg
        self._engine = Engine(cc)  # composition: created here, never handed out
        self._driver = None        # aggregation: set from outside

    def assign(self, driver):
        self._driver = driver

    def start(self):
        self._driver.trips += 1
        print(f"{self._reg}: {self._engine.start()}, driven by {self._driver.name}")  # delegation


asha = Driver("Asha")
first = Car("KA-01-1234", 1197)
first.assign(asha)
first.start()
del first  # the first car and its engine go; asha stays
second = Car("KA-05-9876", 1462)
second.assign(asha)
second.start()
print(f"{asha.name} has driven {asha.trips} cars")
```

```output
KA-01-1234: 1197cc engine started, driven by Asha
KA-05-9876: 1462cc engine started, driven by Asha
Asha has driven 2 cars
```

C++ can show the lifetimes directly, because destructors run at a known moment. Rooms are members of the house, so they die with it — in reverse order of declaration. The department holds pointers to professors it does not own, so closing it leaves them untouched:

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Room {
    string name;
    explicit Room(string n) : name(n) {}
    ~Room() { cout << "room " << name << " destroyed\n"; }
};

class House {  // composition: rooms are members, owned by value
    Room kitchen{"kitchen"};
    Room bedroom{"bedroom"};
public:
    ~House() { cout << "house destroyed\n"; }
};

struct Professor {
    string name;
    explicit Professor(string n) : name(n) {}
    ~Professor() { cout << "professor " << name << " destroyed\n"; }
};

class Department {  // aggregation: pointers to professors it does not own
    vector<Professor*> staff;
public:
    void hire(Professor* p) { staff.push_back(p); }
    ~Department() { cout << "department closed, " << staff.size() << " professors released\n"; }
};

int main() {
    Professor rao("Rao"), iyer("Iyer");  // created outside any department
    {
        cout << "house goes out of scope:\n";
        House h;
    }
    {
        Department cse;
        cse.hire(&rao);
        cse.hire(&iyer);
        cout << "department goes out of scope:\n";
    }
    cout << "professors still here: " << rao.name << ", " << iyer.name << "\n";
    cout << "main ends:\n";
    return 0;
}
```

```output
house goes out of scope:
house destroyed
room bedroom destroyed
room kitchen destroyed
department goes out of scope:
department closed, 2 professors released
professors still here: Rao, Iyer
main ends:
professor Iyer destroyed
professor Rao destroyed
```

## Composition over inheritance

The *Design Patterns* book (Gamma, Helm, Johnson and Vlissides, 1994) put it as "favor object composition over class inheritance". The reasons:

- **Inheritance exposes everything.** A subclass inherits every public method of its parent, including ones that break its own rules.
- **Inheritance couples you to the parent's internals.** A change inside the parent can break the child — the fragile base class problem.
- **Inheritance is fixed when you write the class.** Composition lets you choose or swap the parts at run time.
- **Inheritance multiplies classes.** Combining three kinds of storage with two kinds of logging needs six subclasses; with composition it needs five small classes plugged together.

Java's own library has the classic example: `java.util.Stack` extends `Vector`, so a "stack" also offers `add(0, x)` and `get(i)`, and anyone can insert at the bottom. The Java documentation now recommends `ArrayDeque` instead. The program below builds a stack by inheriting from a list, shows the hole, then builds one by composition, which offers only stack operations:

```cpp
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

class InheritedStack : public vector<int> {  // is-a vector: every vector operation leaks through
public:                                        // (std::vector is not meant to be a base class either)
    void push(int x) { push_back(x); }
};

class Stack {  // has-a vector: only stack operations exist
    vector<int> items;
public:
    void push(int x) { items.push_back(x); }
    int pop() {
        if (items.empty()) throw out_of_range("pop from empty stack");
        int top = items.back();
        items.pop_back();
        return top;
    }
    int peek() const { return items.back(); }
    size_t size() const { return items.size(); }
};

int main() {
    InheritedStack bad;
    bad.push(1);
    bad.push(2);
    bad.insert(bad.begin(), 99);  // inserting at the bottom of a "stack" compiles fine
    cout << "inherited stack: [" << bad[0] << ", " << bad[1] << ", " << bad[2] << "]\n";

    Stack s;
    for (int x : {10, 20, 30}) s.push(x);
    cout << "pop: " << s.pop() << "\n";
    cout << "peek: " << s.peek() << "\n";
    cout << "size: " << s.size() << "\n";
    s.pop();
    s.pop();
    try { s.pop(); } catch (const out_of_range& e) { cout << "error: " << e.what() << "\n"; }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

class Stack {  // has-a deque: only stack operations exist
    private final Deque<Integer> items = new ArrayDeque<>();
    void push(int x) { items.push(x); }
    int pop() {
        if (items.isEmpty()) throw new IllegalStateException("pop from empty stack");
        return items.pop();
    }
    int peek() { return items.peek(); }
    int size() { return items.size(); }
}

public class Main {
    public static void main(String[] args) {
        java.util.Stack<Integer> bad = new java.util.Stack<>();  // extends Vector
        bad.push(1);
        bad.push(2);
        bad.add(0, 99);  // inserting at the bottom of a "stack" compiles fine
        System.out.println("inherited stack: " + bad);

        Stack s = new Stack();
        for (int x : new int[] {10, 20, 30}) s.push(x);
        System.out.println("pop: " + s.pop());
        System.out.println("peek: " + s.peek());
        System.out.println("size: " + s.size());
        s.pop();
        s.pop();
        try { s.pop(); } catch (IllegalStateException e) { System.out.println("error: " + e.getMessage()); }
    }
}
```

```python
class InheritedStack(list):  # is-a list: every list operation leaks through
    def push(self, x):
        self.append(x)


class Stack:  # has-a list: only stack operations exist
    def __init__(self):
        self._items = []

    def push(self, x):
        self._items.append(x)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        return self._items[-1]

    def size(self):
        return len(self._items)


bad = InheritedStack()
bad.push(1)
bad.push(2)
bad.insert(0, 99)  # inserting at the bottom of a "stack" works
print(f"inherited stack: {list(bad)}")

s = Stack()
for x in (10, 20, 30):
    s.push(x)
print(f"pop: {s.pop()}")
print(f"peek: {s.peek()}")
print(f"size: {s.size()}")
s.pop()
s.pop()
try:
    s.pop()
except IndexError as e:
    print(f"error: {e}")
```

```output
inherited stack: [99, 1, 2]
pop: 30
peek: 20
size: 2
error: pop from empty stack
```

Inheritance is still the right tool when the is-a relationship is real and a child can stand in for its parent everywhere — the Liskov Substitution Principle in [SOLID Principles](/notes/oop/solid-principles). Composition is the default for reuse.

## Common mistakes

- Treating "has-a" as a synonym for composition; aggregation and plain association are has-a as well.
- Deciding aggregation versus composition from the real world instead of from the system being modelled.
- Returning a composed part from a getter, which lets it escape and outlive its owner.
- Holding `shared_ptr` on both sides of a bidirectional C++ link; the cycle never frees, so one side should be a `weak_ptr` or raw pointer.
- Inheriting from a collection class to "reuse" it, exposing every collection method.
- Drawing the UML diamond at the part's end instead of the whole's.

## Interview questions

**Give an example where the same pair is aggregation in one system and composition in another.**
An engine and a car. In a car-rental system nobody tracks engines separately, so the car composes its engine. In a scrapyard inventory, engines are pulled out, stored and sold on their own, so a car only aggregates one. The model's needs decide, not the physical objects.

**How do you implement composition in Java, given the garbage collector?**
Create the part inside the whole's constructor, keep it in a `private final` field, and never return it — return copies or derived values instead. The garbage collector then frees the part when the whole becomes unreachable, because nothing else refers to it.

**How does modern C++ express ownership?**
`std::unique_ptr` for sole ownership (composition), `std::shared_ptr` for shared ownership, and a raw pointer or reference for a non-owning link (association or aggregation). `std::weak_ptr` observes a shared object without keeping it alive, which breaks reference cycles.

**What is the difference between association and dependency?**
An association is a lasting structural link: one class keeps a reference to the other as a field. A dependency is a temporary use: the class receives the other as a method parameter or creates it as a local variable and forgets it when the method returns.

**What is delegation?**
Delegation is forwarding a request to a contained object instead of handling it yourself: `Car.start()` calls `engine.start()`. Composition plus delegation gives you reuse without inheritance, and you choose exactly which of the part's methods to expose.

**Why is java.util.Stack often cited as a design mistake?**
It extends `Vector`, so it inherits methods like `add(int, E)`, `get(int)` and `remove(int)` that let callers bypass last-in-first-out order. A stack is not a vector; it should have held one. The documentation points to `Deque` implementations such as `ArrayDeque` instead.

**When is inheritance a better choice than composition?**
When the subclass truly is a kind of the parent and can replace it anywhere without surprises, and especially when a framework is designed to be extended through subclasses. Even then, keep hierarchies shallow and the parent's extension points explicit.

Next, read [SOLID Principles](/notes/oop/solid-principles), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

---
title: Inheritance
order: 4
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Inheritance in OOP: Types, Overriding, Diamond Problem
description: Inheritance in OOP: the is-a relationship, single, multilevel, hierarchical, multiple and hybrid types, overriding, super, constructor order, diamonds.
question: What is inheritance in object-oriented programming?
answer: Inheritance is the mechanism by which one class, the subclass, acquires the fields and methods of another class, the superclass, and can add to them or override them. It models an is-a relationship — a SavingsAccount is an Account — so code written for the parent also works for every child. C++ and Python allow multiple inheritance of classes; Java allows it only through interfaces.
q: What are the types of inheritance in OOP?
a: Single (one parent, one child), multilevel (a chain such as A to B to C), hierarchical (several children of one parent), multiple (one child with several parents) and hybrid (a combination, typically a diamond). C++ and Python support all five with classes; Java supports multiple and hybrid inheritance only through interfaces.
q: Why does Java not support multiple inheritance of classes?
a: To avoid the ambiguity of the diamond problem: if two parent classes both had a field or method with the same name, which one would the child get? Java keeps one superclass per class and lets a class implement many interfaces, which carry no instance state, so only method clashes remain and the compiler makes you resolve them.
q: What is the diamond problem?
a: It arises when class D inherits from B and C, which both inherit from A. D then has two paths to A, so it is unclear whether D holds one copy of A's data or two, and which version of an overridden method it should use. C++ solves it with virtual inheritance, Python with its method resolution order.
q: What is the difference between method overriding and method hiding?
a: Overriding replaces an inherited instance method, and the version that runs is chosen at run time from the object's actual class. Hiding happens with static methods in Java, or with non-virtual functions in C++: the version is chosen at compile time from the variable's declared type, so a parent-typed reference still calls the parent's version.
q: What does the super keyword do?
a: It refers to the parent class's version of something from inside a subclass. super(...) in Java, or super().__init__(...) in Python, calls the parent constructor; super.method() or super().method() calls the parent's version of an overridden method. C++ has no super keyword and names the base class explicitly, as in Base::method().
---
**Inheritance** lets you define a new class as an extension of an existing one. The new class — the **subclass**, child or derived class — automatically has the fields and methods of the existing class — the **superclass**, parent or base class — and can add new ones or replace inherited ones. It is how OOP expresses "is a kind of": an `ElectricCar` is a `Car`, which is a `Vehicle`. This note covers the kinds of inheritance and which languages allow which, overriding and `super`, the order in which constructors run, and the diamond problem in C++, Java and Python.

## The is-a relationship

Inherit only when the child genuinely **is a** kind of the parent and can be used anywhere the parent is expected. A `Car` is a `Vehicle`, so code that takes a `Vehicle` should work when handed a `Car`. A `Car` is not an `Engine`; it *has* one, which is composition, covered in [Association, Aggregation and Composition](/notes/oop/association-aggregation-composition).

A subclass gets every field and method of its parent. Private members are still *in* the child object — they take up space and the parent's methods use them — but the child's own code cannot touch them directly. Java constructors are not inherited at all; C++ can opt in with `using Base::Base;`, and Python's `__init__` is an ordinary method, so a subclass without its own simply uses the parent's.

| | C++ | Java | Python |
| --- | --- | --- | --- |
| Syntax | `class Car : public Vehicle` | `class Car extends Vehicle` | `class Car(Vehicle):` |
| Call the parent's method | `Vehicle::describe()` | `super.describe()` | `super().describe()` |
| Call the parent's constructor | `Car() : Vehicle(4) {}` | `super(4);` | `super().__init__(4)` |
| Stop a class being extended | `final` (C++11) | `final` | No keyword; `typing.final` is a type-checker hint |
| Common root class | None | `Object` | `object` |

C++ also chooses an inheritance *access level*. With `public` inheritance (the usual one, and the only one that models is-a), the parent's public members stay public. `protected` inheritance makes them protected, and `private` inheritance — the default when you write `class Car : Vehicle` — makes them private, which is really "implemented in terms of" rather than is-a.

## Types of inheritance

@figure inheritance-types

- **Single** — one parent, one child: `Car` extends `Vehicle`.
- **Multilevel** — a chain: `ElectricCar` extends `Car` extends `Vehicle`. Each level inherits everything above it.
- **Hierarchical** — several children share one parent: `Car`, `Bike` and `Truck` all extend `Vehicle`.
- **Multiple** — one child with two or more parents: a `Copier` that is both a `Scanner` and a `Printer`.
- **Hybrid** — a mix of the above. The famous case is the diamond, where two parents share a grandparent.

| Type | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Single | Yes | Yes | Yes | Yes |
| Multilevel | Yes | Yes | Yes | Yes |
| Hierarchical | Yes | Yes | Yes | Yes |
| Multiple | Yes | Interfaces only | Yes | No (mixins instead) |
| Hybrid | Yes, with virtual inheritance for one shared base | Interfaces only | Yes, ordered by the MRO | No |

## Method overriding

**Overriding** means a subclass provides its own version of an inherited method with the same name and parameters. When the method is called through a parent-type reference, the version that runs is the one belonging to the object's *actual* class — this is run-time polymorphism, covered fully in [Polymorphism](/notes/oop/polymorphism).

| Rule | C++ | Java | Python |
| --- | --- | --- | --- |
| Base method must opt in | Yes, `virtual` | No: instance methods are overridable by default | No |
| Marker on the override | `override` (recommended) | `@Override` (recommended) | None |
| Matching | Same parameters; covariant return allowed | Same parameters; covariant return allowed | Same name only |
| Access level of the override | May differ | Cannot be more restrictive | No access levels |
| Forbid overriding | `final` | `final` | Not enforced |
| Static methods | Never virtual | Hidden, not overridden | Just attributes; redefining replaces |

Java adds one more rule: an override may not declare broader **checked** exceptions than the method it overrides. In C++, a derived function with the same name but different parameters does not overload the base one — it **hides** every base function of that name, until you bring them back with `using Base::name;`. Always write `override` or `@Override`: if the signature does not actually match, the compiler tells you instead of silently creating a new method.

## super and the order of construction

A child object contains its parent's part, so the parent's part has to be built first. Constructors run **from the top of the hierarchy down**; in C++, destructors run in exactly the reverse order, child first.

- **Java**: the first thing every constructor does is call a parent constructor. If you do not write `super(...)`, the compiler inserts `super()` — which fails to compile if the parent has no no-argument constructor. Until Java 24 the call had to be the very first statement; Java 25 allows statements that do not use the object before it.
- **C++**: base classes are initialised in the member initialiser list (`Car(...) : Vehicle(4)`), before the derived class's own members and constructor body.
- **Python**: nothing is automatic. If a subclass defines `__init__` and does not call `super().__init__(...)`, the parent's initialisation simply never runs and its attributes do not exist.

The program below builds a three-level chain and calls `describe()` through a parent-type reference; each override calls the parent's version before adding its own line.

```cpp
#include <iostream>
#include <string>
using namespace std;

class Vehicle {
protected:
    int wheels;
public:
    Vehicle(int wheels) : wheels(wheels) { cout << "Vehicle constructor\n"; }
    virtual ~Vehicle() = default;
    virtual void describe() const { cout << "Vehicle: " << wheels << " wheels\n"; }
};

class Car : public Vehicle {
protected:
    string model;
public:
    Car(string model) : Vehicle(4), model(model) { cout << "Car constructor\n"; }
    void describe() const override {
        Vehicle::describe();  // C++ names the base class instead of super
        cout << "Car: " << model << "\n";
    }
};

class ElectricCar : public Car {
    int batteryKwh;
public:
    ElectricCar(string model, int kwh) : Car(model), batteryKwh(kwh) { cout << "ElectricCar constructor\n"; }
    void describe() const override {
        Car::describe();
        cout << "ElectricCar: " << batteryKwh << " kWh battery\n";
    }
};

int main() {
    ElectricCar ev("Nexon", 30);
    const Vehicle& v = ev;  // a parent-type reference to a child object
    v.describe();           // still runs ElectricCar::describe
    return 0;
}
```

```java
class Vehicle {
    protected final int wheels;
    Vehicle(int wheels) { this.wheels = wheels; System.out.println("Vehicle constructor"); }
    void describe() { System.out.println("Vehicle: " + wheels + " wheels"); }
}

class Car extends Vehicle {
    protected final String model;
    Car(String model) {
        super(4);  // runs Vehicle's constructor first
        this.model = model;
        System.out.println("Car constructor");
    }
    @Override
    void describe() {
        super.describe();
        System.out.println("Car: " + model);
    }
}

class ElectricCar extends Car {
    private final int batteryKwh;
    ElectricCar(String model, int kwh) {
        super(model);
        this.batteryKwh = kwh;
        System.out.println("ElectricCar constructor");
    }
    @Override
    void describe() {
        super.describe();
        System.out.println("ElectricCar: " + batteryKwh + " kWh battery");
    }
}

public class Main {
    public static void main(String[] args) {
        Vehicle v = new ElectricCar("Nexon", 30);  // a parent-type reference to a child object
        v.describe();                              // still runs ElectricCar.describe
    }
}
```

```python
class Vehicle:
    def __init__(self, wheels):
        self.wheels = wheels
        print("Vehicle constructor")

    def describe(self):
        print(f"Vehicle: {self.wheels} wheels")


class Car(Vehicle):
    def __init__(self, model):
        super().__init__(4)  # without this line Vehicle.__init__ never runs
        self.model = model
        print("Car constructor")

    def describe(self):
        super().describe()
        print(f"Car: {self.model}")


class ElectricCar(Car):
    def __init__(self, model, kwh):
        super().__init__(model)
        self.battery_kwh = kwh
        print("ElectricCar constructor")

    def describe(self):
        super().describe()
        print(f"ElectricCar: {self.battery_kwh} kWh battery")


v = ElectricCar("Nexon", 30)
v.describe()
```

```javascript
class Vehicle {
  constructor(wheels) { this.wheels = wheels; console.log("Vehicle constructor"); }
  describe() { console.log(`Vehicle: ${this.wheels} wheels`); }
}

class Car extends Vehicle {
  constructor(model) {
    super(4); // required before using this in a derived constructor
    this.model = model;
    console.log("Car constructor");
  }
  describe() { super.describe(); console.log(`Car: ${this.model}`); }
}

class ElectricCar extends Car {
  constructor(model, kwh) {
    super(model);
    this.batteryKwh = kwh;
    console.log("ElectricCar constructor");
  }
  describe() { super.describe(); console.log(`ElectricCar: ${this.batteryKwh} kWh battery`); }
}

const v = new ElectricCar("Nexon", 30);
v.describe();
```

```output
Vehicle constructor
Car constructor
ElectricCar constructor
Vehicle: 4 wheels
Car: Nexon
ElectricCar: 30 kWh battery
```

@figure construction-order

In the C++ version, when `ev` goes out of scope the destructors would run as `~ElectricCar`, `~Car`, `~Vehicle`. The `virtual` destructor in `Vehicle` matters whenever a child is deleted through a parent pointer: without it, only `~Vehicle` would run and the behaviour is undefined.

## The diamond problem

Suppose `Scanner` and `Printer` both inherit from `Device`, and `Copier` inherits from both. A `Copier` now reaches `Device` along two paths. Two questions follow: does a `Copier` hold **one** `Device` part or **two** (one per path)? And if `Scanner` and `Printer` both override a method, which one does `Copier` get? Each language answers differently.

### C++: virtual inheritance

Declaring the shared base `virtual` makes all paths share one subobject. The rule that surprises people: a virtual base is constructed **first**, and by the **most derived** class.

@figure diamond

```cpp
#include <iostream>
using namespace std;

struct Device {
    int id;
    Device(int id) : id(id) { cout << "Device(" << id << ")\n"; }
};

struct Scanner : virtual Device {  // virtual: share one Device with siblings
    Scanner() : Device(1) { cout << "Scanner\n"; }
};

struct Printer : virtual Device {
    Printer() : Device(2) { cout << "Printer\n"; }
};

struct Copier : Scanner, Printer {
    Copier() : Device(3) { cout << "Copier\n"; }  // the most derived class builds the shared base
};

int main() {
    Copier c;
    cout << "one Device, id " << c.id << "\n";  // unambiguous: a single Device subobject
    return 0;
}
```

```output
Device(3)
Scanner
Printer
Copier
one Device, id 3
```

If `Scanner` and `Printer` both overrode a virtual function and `Copier` did not, the call would be ambiguous and the program would not compile; `Copier` must override it and decide.

### Java: interfaces and default methods

Java side-steps the data half of the problem: a class has exactly one superclass, and interfaces have no instance fields, so there is never a second copy of anything. Since Java 8, interfaces can carry `default` method bodies, which brings back the behaviour half. The rules: a method from a class wins over an interface default; a more specific interface wins over the one it extends; otherwise the class must override the method, and can call a particular parent with `Interface.super.method()`.

```java
interface Scanner {
    default String start() { return "Scanner ready"; }
}

interface Printer {
    default String start() { return "Printer ready"; }
}

class Copier implements Scanner, Printer {
    // Two defaults with the same signature: without this override, Copier does not compile.
    @Override
    public String start() {
        return Scanner.super.start() + ", " + Printer.super.start();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Copier().start());
    }
}
```

```output
Scanner ready, Printer ready
```

### Python: the method resolution order

Python builds one linear order of classes for every class — the **method resolution order (MRO)**, computed by the **C3 linearisation** algorithm — and looks attributes up along it. C3 guarantees that a class comes before its parents and that parents keep the order you listed them in; if no such order exists, the class definition fails with a `TypeError`. `super()` does not mean "my parent" — it means "the next class in the MRO of the object I was called on".

```python
class Device:
    def __init__(self):
        print("Device init")

    def start(self):
        return "Device"


class Scanner(Device):
    def __init__(self):
        print("Scanner init")
        super().__init__()  # in a Copier, the next class in the MRO is Printer

    def start(self):
        return "Scanner -> " + super().start()


class Printer(Device):
    def __init__(self):
        print("Printer init")
        super().__init__()

    def start(self):
        return "Printer -> " + super().start()


class Copier(Scanner, Printer):
    def __init__(self):
        print("Copier init")
        super().__init__()


print([cls.__name__ for cls in Copier.__mro__])
print(Copier().start())
```

```output
['Copier', 'Scanner', 'Printer', 'Device', 'object']
Copier init
Scanner init
Printer init
Device init
Scanner -> Printer -> Device
```

@figure mro

This pattern is called **cooperative multiple inheritance**: it works only if every class in the chain calls `super()`. One class that calls `Device.__init__(self)` directly instead would break the chain.

## When to use inheritance

Inheritance couples a child tightly to its parent's implementation: a change to the parent can silently break children (the **fragile base class problem**), and deep hierarchies are hard to follow. Use it when the is-a relationship is real and the child can stand in for the parent everywhere — the [Liskov Substitution Principle](/notes/oop/solid-principles). When you only want to reuse code, give the class a field holding the other object instead.

## Common mistakes

- Forgetting `super().__init__(...)` in a Python subclass, so the parent's attributes never exist.
- Changing an overriding method's parameters by accident and creating a new method; `@Override` and `override` catch this.
- Saying Java has no multiple inheritance at all — it has multiple inheritance of interfaces (types), just not of classes.
- Leaving out the `virtual` destructor in a C++ base class that is deleted through base pointers.
- Assuming Python's `super()` always means the direct parent; it follows the MRO of the actual object.
- Using inheritance just to reuse a few methods when the is-a test fails.

## Interview questions

**In what order are constructors and destructors called in multilevel inheritance?**
Constructors run from the base downwards: `Vehicle`, then `Car`, then `ElectricCar`. In C++, destructors run in exactly the reverse order. With virtual inheritance, virtual base classes are constructed before everything else, by the most derived class.

**Are constructors inherited?**
Not in Java: each class declares its own, and they call the parent's with `super(...)`. In C++ they are not inherited by default, but `using Base::Base;` opts in. In Python, `__init__` is an ordinary method found through the MRO, so a subclass without its own `__init__` uses its parent's.

**What happens in Java if the parent class has no no-argument constructor?**
Every subclass constructor must then call one of the parent's constructors explicitly with `super(arguments)`. If it does not, the compiler inserts `super()`, finds no matching constructor and reports an error.

**Can you override a private or a static method in Java?**
No. A private method is invisible to the subclass, so a method with the same name in the child is a new, unrelated method. A static method with the same signature hides the parent's: which one runs depends on the declared type of the reference, not the object.

**What are public, protected and private inheritance in C++?**
They set the most open access that inherited members can have in the derived class. Public inheritance keeps the parent's access levels and models is-a. Protected inheritance turns public members into protected ones, and private inheritance turns them all private, which means "implemented in terms of" and stops outside code treating the child as the parent.

**How does Python decide which method to call with multiple inheritance?**
It walks the class's method resolution order, `ClassName.__mro__`, which C3 linearisation computes so that every class precedes its parents and the listed order of parents is kept. The first class in that order that defines the method wins. `super()` continues from the current class's position in that same order.

**How does C++ virtual inheritance solve the diamond problem?**
Marking the shared base `virtual` in the intermediate classes makes them share a single base-class subobject instead of each carrying its own. Access to the base's members becomes unambiguous. The most derived class is responsible for constructing the virtual base.

**Is multiple inheritance bad?**
Not in itself, but it adds complexity: diamonds, constructor ordering and name clashes. Java's designers kept it for interfaces only. In C++ and Python, inheriting from several small, stateless "interface-like" or mixin classes is common and safe; inheriting state from several concrete classes is where trouble starts.

Next, read [Polymorphism](/notes/oop/polymorphism), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

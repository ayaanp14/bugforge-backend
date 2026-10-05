---
title: Abstraction: Abstract Classes and Interfaces
order: 6
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Abstraction in OOP: Abstract Class vs Interface
description: Abstraction in OOP: abstract classes, C++ pure virtual functions, Java interfaces with default and static methods, Python ABCs, and when to use which.
question: What is abstraction in object-oriented programming?
answer: Abstraction means exposing what an object does while hiding how it does it, so callers depend on a small contract instead of on implementation details. In code it is written as abstract classes, which mix declared and implemented methods, and interfaces, which list methods any class can promise to provide. Callers are written against the abstract type, and implementations can change freely.
q: What is an abstract class?
a: An abstract class is a class that cannot be instantiated and exists to be extended. It can hold fields, constructors and fully written methods, alongside abstract methods that have no body and must be implemented by every concrete subclass. It captures what related classes share while leaving the differing steps to them.
q: What is an interface in Java?
a: An interface is a type that lists methods a class promises to provide, declared with the interface keyword. Its methods are public and abstract unless marked default, static or private, and its fields are always public static final constants. A class can implement any number of interfaces but extend only one class.
q: Can an abstract class have a constructor?
a: Yes. You cannot call it with new directly, but every subclass constructor calls it through super(...) in Java or the initialiser list in C++, so it is the natural place to initialise the fields the abstract class declares and to check their values.
q: What is a pure virtual function in C++?
a: A pure virtual function is a virtual function declared with = 0, as in virtual int area() const = 0;. It usually has no body, and any class that declares one, or inherits one without overriding it, is abstract and cannot be instantiated. Concrete derived classes must provide the override.
q: How do you create an abstract class in Python?
a: Inherit from abc.ABC and mark the required methods with the @abstractmethod decorator. Python then refuses to instantiate the class, or any subclass that has not overridden every abstract method, raising TypeError at the moment you try to create the object rather than when the class is defined.
q: Can we create an object of an abstract class?
a: Not directly: new Shape() does not compile in Java or C++ when Shape is abstract, and Python raises TypeError. You can, however, create objects of concrete subclasses and hold them in variables of the abstract type, which is exactly how abstract classes are meant to be used.
---
**Abstraction** is the pillar that decides what a caller needs to know. When you call `payment.pay(499)`, you need to know that the money moves and a receipt appears — not whether it went through a UPI app, a card network or a wallet. Hiding the "how" behind a small "what" lets each side change independently: new payment methods arrive without touching checkout code, and checkout changes without touching payment code. This note shows how C++, Java and Python write abstractions down as **abstract classes** and **interfaces**, and how to choose between them.

## What abstraction means

Every working system is layered abstractions. You drive a car through a steering wheel and pedals, not by controlling fuel injection. A programmer calls `sort(list)` without knowing whether it is a merge sort or a Timsort. In OOP, an abstraction is a **contract**: a set of method signatures plus the promised behaviour, independent of any implementation.

The rule that makes abstraction useful is **program to an interface, not an implementation**: declare variables, parameters and return types with the abstract type (`PaymentMethod`, `List`, `Shape`) and create concrete objects (`UpiPayment`, `ArrayList`, `Circle`) in as few places as possible.

## Abstraction vs encapsulation

These two are the most often confused pair in OOP interviews.

| | Abstraction | Encapsulation |
| --- | --- | --- |
| Question it answers | What does the caller need to see? | Who may touch this data? |
| Hides | Implementation complexity | Internal state |
| Achieved with | Abstract classes, interfaces | Classes plus access modifiers |
| Focus | Design: the outside view | Implementation: the inside |
| Example | `PaymentMethod` declares `pay(amount)` | `UpiPayment` keeps its account handle `private` |

They work together: abstraction designs the outside of an object, and encapsulation protects its inside. [Encapsulation](/notes/oop/encapsulation) has its own note.

## Abstract classes

An **abstract class** cannot be instantiated. It is a partial class — some methods written, some only declared — meant to be completed by subclasses. It may have fields, constructors and ordinary methods. A subclass must implement every abstract method, or it is abstract too.

### C++: pure virtual functions

C++ has no `abstract` keyword. A class is abstract if it has at least one **pure virtual function**, declared with `= 0`, as in `virtual int area() const = 0;`. Give such a class a virtual destructor too (`virtual ~Shape() = default;`), so that deleting a derived object through a `Shape*` runs the derived destructor. A derived class that does not override every pure virtual function it inherits is itself abstract.

A pure virtual function can still have a body, defined outside the class and called explicitly as `Shape::area()`; a pure virtual *destructor* must have one, because derived destructors always call it.

### Java: the abstract keyword

`abstract class Shape` with `abstract int area();`. A Java class can be declared `abstract` even with no abstract methods, purely to forbid instantiation. An abstract method cannot be `private`, `static` or `final`, since each of those makes overriding impossible, and a class cannot be both `abstract` and `final`.

### Python: abstract base classes

Inherit from `abc.ABC` and decorate required methods with `@abstractmethod`. The check happens when you **create an object**, not when you define the class: defining an incomplete subclass is fine, instantiating it raises `TypeError`. An `ABC` with no abstract methods can be instantiated normally.

```python
from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self): ...


class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side * self.side


class Blob(Shape):  # forgot to implement area()
    pass


for make in (lambda: Shape(), lambda: Blob(), lambda: Square(3)):
    try:
        shape = make()
        print(f"{type(shape).__name__}: created, area {shape.area()}")
    except TypeError:
        print("TypeError: the class is still abstract")
print(sorted(Shape.__abstractmethods__))
```

```output
TypeError: the class is still abstract
TypeError: the class is still abstract
Square: created, area 9
['area']
```

@figure abstract-check

## Interfaces

An **interface** is a pure contract: a list of methods a class promises to provide, usually with no state. A class that implements an interface can be used anywhere that interface type is expected, whatever else the class is.

### Java interfaces

Java's `interface` keyword has grown over the years:

- **Abstract methods** — the default for a method without a body; implicitly `public abstract`.
- **Constants** — every field is implicitly `public static final`. There are no instance fields.
- **Default methods** (Java 8) — a method with a body that implementing classes inherit and may override. They were added so existing interfaces could gain methods — `forEach` on `Iterable`, `stream` on `Collection` — without breaking every class that already implemented them.
- **Static methods** (Java 8) — helpers called on the interface itself, such as `Comparator.naturalOrder()`.
- **Private methods** (Java 9) — helpers shared by the default methods, invisible to implementers.

A class may implement many interfaces, and an interface may extend many interfaces. An interface with exactly one abstract method is a **functional interface** and can be implemented with a lambda. An interface with no methods at all, such as `Serializable`, is a **marker interface**.

```java
interface Discount {
    int CAP_PERCENT = 50;  // implicitly public static final

    int percent();  // implicitly public abstract

    default int apply(int price) {  // Java 8: implementers inherit this body
        return price - price * capped() / 100;
    }

    private int capped() {  // Java 9: a helper for the default method only
        return Math.min(percent(), CAP_PERCENT);
    }

    static Discount none() {  // Java 8: called on the interface itself
        return () -> 0;  // one abstract method, so a lambda can implement it
    }
}

class FestiveDiscount implements Discount {
    public int percent() { return 70; }  // above the cap
}

public class Main {
    public static void main(String[] args) {
        System.out.println("festive price: " + new FestiveDiscount().apply(1000));
        System.out.println("no discount: " + Discount.none().apply(1000));
        System.out.println("cap: " + Discount.CAP_PERCENT + "%");
    }
}
```

```output
festive price: 500
no discount: 1000
cap: 50%
```

@figure discount-interface

### C++ and Python interfaces

C++ has no `interface` keyword; an interface is a class with only pure virtual functions and a virtual destructor. Because such a class has no data, inheriting several of them is the safe kind of multiple inheritance. Python writes an interface as an `ABC` whose methods are all abstract, or — since Python 3.8 — as a `typing.Protocol`, which a class satisfies simply by having the right methods (structural typing, checked by type checkers rather than at run time). And in everyday Python, duck typing means an interface often exists only in the documentation.

## Abstract class and interface together

Real designs often use both: an interface names a **capability** and an abstract class shares an **implementation**. Every payment method below follows the same `pay` steps, written once in the abstract class; only some can be refunded, so that capability is a separate interface.

@figure payment-classes

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Refundable {  // an interface: pure virtual functions only
public:
    virtual ~Refundable() = default;
    virtual void refund(int amount) = 0;
};

class PaymentMethod {  // an abstract class: state, a constructor, concrete and pure virtual methods
protected:
    string owner;
    virtual void charge(int amount) = 0;  // each subclass decides how
public:
    explicit PaymentMethod(string owner) : owner(owner) {}
    virtual ~PaymentMethod() = default;
    void pay(int amount) {  // the same steps for every payment method
        if (amount <= 0) { cout << "rejected: amount must be positive\n"; return; }
        charge(amount);
        cout << "receipt for " << owner << ": Rs " << amount << "\n";
    }
};

class UpiPayment : public PaymentMethod, public Refundable {
    string handle;
protected:
    void charge(int amount) override { cout << "UPI: charged Rs " << amount << " to " << handle << "\n"; }
public:
    UpiPayment(string owner, string handle) : PaymentMethod(owner), handle(handle) {}
    void refund(int amount) override { cout << "UPI: refunded Rs " << amount << " to " << handle << "\n"; }
};

class CardPayment : public PaymentMethod {
    string last4;
protected:
    void charge(int amount) override { cout << "Card: charged Rs " << amount << " to card ending " << last4 << "\n"; }
public:
    CardPayment(string owner, string last4) : PaymentMethod(owner), last4(last4) {}
};

int main() {
    vector<unique_ptr<PaymentMethod>> methods;
    methods.push_back(make_unique<UpiPayment>("Asha", "asha@bank"));
    methods.push_back(make_unique<CardPayment>("Ravi", "4242"));
    for (auto& m : methods) m->pay(499);
    methods[1]->pay(0);
    for (auto& m : methods)  // only methods that are also Refundable
        if (auto r = dynamic_cast<Refundable*>(m.get())) r->refund(99);
    return 0;
}
```

```java
import java.util.List;

interface Refundable {  // a capability: no state, only a promise
    void refund(int amount);
}

abstract class PaymentMethod {  // shared state and steps; charge() left to subclasses
    protected final String owner;
    PaymentMethod(String owner) { this.owner = owner; }

    protected abstract void charge(int amount);

    final void pay(int amount) {  // final: subclasses cannot change the steps
        if (amount <= 0) { System.out.println("rejected: amount must be positive"); return; }
        charge(amount);
        System.out.println("receipt for " + owner + ": Rs " + amount);
    }
}

class UpiPayment extends PaymentMethod implements Refundable {
    private final String handle;
    UpiPayment(String owner, String handle) { super(owner); this.handle = handle; }
    protected void charge(int amount) { System.out.println("UPI: charged Rs " + amount + " to " + handle); }
    public void refund(int amount) { System.out.println("UPI: refunded Rs " + amount + " to " + handle); }
}

class CardPayment extends PaymentMethod {
    private final String last4;
    CardPayment(String owner, String last4) { super(owner); this.last4 = last4; }
    protected void charge(int amount) { System.out.println("Card: charged Rs " + amount + " to card ending " + last4); }
}

public class Main {
    public static void main(String[] args) {
        List<PaymentMethod> methods = List.of(new UpiPayment("Asha", "asha@bank"), new CardPayment("Ravi", "4242"));
        for (PaymentMethod m : methods) m.pay(499);
        methods.get(1).pay(0);
        for (PaymentMethod m : methods)  // only methods that are also Refundable
            if (m instanceof Refundable r) r.refund(99);
    }
}
```

```python
from abc import ABC, abstractmethod


class Refundable(ABC):  # a capability: no state, only a promise
    @abstractmethod
    def refund(self, amount): ...


class PaymentMethod(ABC):  # shared state and steps; charge() left to subclasses
    def __init__(self, owner):
        self.owner = owner

    @abstractmethod
    def charge(self, amount): ...

    def pay(self, amount):
        if amount <= 0:
            print("rejected: amount must be positive")
            return
        self.charge(amount)
        print(f"receipt for {self.owner}: Rs {amount}")


class UpiPayment(PaymentMethod, Refundable):
    def __init__(self, owner, handle):
        super().__init__(owner)
        self.handle = handle

    def charge(self, amount):
        print(f"UPI: charged Rs {amount} to {self.handle}")

    def refund(self, amount):
        print(f"UPI: refunded Rs {amount} to {self.handle}")


class CardPayment(PaymentMethod):
    def __init__(self, owner, last4):
        super().__init__(owner)
        self.last4 = last4

    def charge(self, amount):
        print(f"Card: charged Rs {amount} to card ending {self.last4}")


methods = [UpiPayment("Asha", "asha@bank"), CardPayment("Ravi", "4242")]
for m in methods:
    m.pay(499)
methods[1].pay(0)
for m in methods:  # only methods that are also Refundable
    if isinstance(m, Refundable):
        m.refund(99)
```

```output
UPI: charged Rs 499 to asha@bank
receipt for Asha: Rs 499
Card: charged Rs 499 to card ending 4242
receipt for Ravi: Rs 499
rejected: amount must be positive
UPI: refunded Rs 99 to asha@bank
```

@figure pay-steps

The C++ `dynamic_cast` here is a **cross-cast**: it goes sideways from `PaymentMethod*` to `Refundable*`, which works because `UpiPayment` inherits both.

## Abstract class vs interface

| Aspect | Abstract class | Interface (Java) |
| --- | --- | --- |
| Instantiable | No | No |
| Methods | Abstract and concrete, any access level | Abstract; `default` and `static` (Java 8), `private` (Java 9) |
| Fields | Any: instance or static, any access | Only `public static final` constants |
| Constructors | Yes, called by subclasses | No |
| Per-object state | Yes | No |
| How many per class | A class extends one | A class implements many |
| Relationship | is-a, with shared implementation | can-do: a capability (`Comparable`, `Runnable`) |
| Adding a method later | Add a concrete method; subclasses unaffected | Must be a `default` method, or every implementer breaks |
| C++ equivalent | Class with some pure virtual functions | Class with only pure virtual functions |
| Python equivalent | `ABC` with some concrete methods | `ABC` with only abstract methods, or a `Protocol` |

## When to use which

- Use an **interface** when unrelated classes should share a capability (`Comparable`, `AutoCloseable`), when a class needs several such capabilities, or when you want callers to depend on the thinnest possible contract.
- Use an **abstract class** when closely related classes share state or code, when you want to fix the order of steps and let subclasses fill in one of them (the Template Method pattern), or when you need constructors and non-public members.
- When in doubt, publish an interface and add an abstract class that implements part of it as a convenience, as Java's collections do with `List` and `AbstractList`.

## Common mistakes

- Defining abstraction as "hiding data"; that is encapsulation. Abstraction hides complexity behind a contract.
- Forgetting the virtual destructor in a C++ abstract base class used through pointers.
- Assuming Python checks abstract methods when the class is defined; it checks when you instantiate.
- Saying Java interfaces cannot contain method bodies; since Java 8 they can, through default and static methods.
- Giving an interface methods that only some implementers can honour, so the rest throw "not supported" — split the interface instead.
- Declaring variables with the concrete type (`ArrayList`, `UpiPayment`) when the abstract one would do.

## Interview questions

**If an abstract class cannot be instantiated, why can it have a constructor?**
Because objects of its concrete subclasses contain the abstract class's fields, and those fields need initialising. Each subclass constructor calls the abstract class's constructor through `super(...)` or the initialiser list, so the shared setup and validation are written once.

**Can a class be abstract without any abstract methods?**
In Java, yes: `abstract class Base {}` simply cannot be instantiated. In C++ a class is abstract only if it has a pure virtual function; a protected constructor is the usual way to prevent direct instantiation otherwise. In Python, an `ABC` without abstract methods can be instantiated normally.

**Can a pure virtual function have a body in C++?**
Yes. It is defined outside the class and can be called explicitly as `Base::f()`, often to provide a default that overrides choose to reuse. The class stays abstract. A pure virtual destructor must have a body, because every derived destructor calls it.

**Why were default methods added to Java interfaces?**
To let interfaces evolve. Java 8 needed to add methods like `forEach` and `stream` to long-established interfaces such as `Iterable` and `Collection`; a new abstract method would have broken every existing implementation, while a default method gives them a working body for free.

**Which modifiers cannot be combined with abstract in Java?**
`final` (a final class or method cannot be extended or overridden, while abstract requires it), `private` (a private method is invisible to subclasses, so it can never be implemented) and `static` (static methods are not overridden). The compiler reports an illegal combination of modifiers.

**What is the difference between abstraction and encapsulation?**
Abstraction decides what a caller sees — a small contract, with the implementation hidden. Encapsulation decides who can touch an object's data — bundling it with methods and restricting access. An interface is an abstraction tool; `private` is an encapsulation tool.

**What is a marker interface?**
An interface with no methods, used only to tag a class: `Serializable` and `Cloneable` in Java. Code checks for the tag with `instanceof`, and `Object.clone()` throws if the class is not `Cloneable`. Annotations now do the same job more flexibly in newer code.

**Can an interface extend a class, or a class extend an interface?**
No to both. An interface can only extend other interfaces, and a class implements interfaces rather than extending them. A class extends exactly one class (implicitly `Object`) and may implement any number of interfaces.

Next, read [Association, Aggregation and Composition](/notes/oop/association-aggregation-composition), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

---
title: SOLID Principles
order: 8
minutes: 16
level: intermediate
updated: 2026-10-05
seo-title: SOLID Principles in OOP with Examples and Code
description: The five SOLID principles of OOP design — single responsibility, open/closed, Liskov, interface segregation, dependency inversion — with violations and fixes.
question: What are the SOLID principles in OOP?
answer: SOLID is a set of five object-oriented design principles collected by Robert C. Martin: Single Responsibility (a class has one reason to change), Open/Closed (extend behaviour without editing tested code), Liskov Substitution (a subtype must work wherever its base type does), Interface Segregation (small, focused interfaces) and Dependency Inversion (depend on abstractions, not concrete classes).
q: Who created the SOLID principles?
a: Robert C. Martin gathered and described the five principles around 2000, and Michael Feathers later arranged them into the SOLID acronym. Two are older: the Open/Closed Principle comes from Bertrand Meyer's 1988 book on object-oriented software construction, and Liskov substitution from Barbara Liskov's work on data abstraction in the late 1980s.
q: What is the difference between dependency inversion and dependency injection?
a: Dependency inversion is a design principle: high-level code should depend on abstractions, not on concrete low-level classes. Dependency injection is a technique that helps you follow it: an object receives its dependencies from outside, through its constructor, a setter or a parameter, instead of creating them itself.
q: Why is Square extending Rectangle a violation of LSP?
a: Code written for a Rectangle may set the width and height independently and expect the area to be their product. A Square must keep its sides equal, so setting the height also changes the width, and that code breaks. The square is a rectangle mathematically, but a mutable Square is not substitutable for a mutable Rectangle.
q: What does closed for modification mean in the Open/Closed Principle?
a: It means adding a new behaviour should not require editing code that already works and is tested. You extend the system by writing a new class that implements an existing abstraction, such as a new discount policy, and the code that uses the abstraction stays exactly as it was.
q: Do the SOLID principles apply outside object-oriented programming?
a: Largely, yes. Single responsibility and interface segregation apply to modules, functions and services; dependency inversion is how hexagonal and clean architectures keep business logic independent of databases and frameworks. Liskov substitution applies to any system where one implementation is swapped for another behind a shared contract.
---
**SOLID** is an acronym for five principles of object-oriented design. They are not rules a compiler checks; they are tests you apply to a design to predict whether it will be easy or painful to change. Each one names a specific kind of pain — one class edited for unrelated reasons, a `switch` that grows with every feature, a subclass that breaks callers, an interface nobody can fully implement, business logic welded to a database — and the fix for it. This note takes each principle in turn with a violation, a fix and, for the code-shaped ones, a program.

| Letter | Principle | One-line rule |
| --- | --- | --- |
| S | Single Responsibility | A class should have one reason to change |
| O | Open/Closed | Open for extension, closed for modification |
| L | Liskov Substitution | Subtypes must be usable wherever the base type is |
| I | Interface Segregation | Clients should not depend on methods they do not use |
| D | Dependency Inversion | Depend on abstractions, not on concrete classes |

## S: Single Responsibility Principle

> A class should have only one reason to change.

Robert C. Martin later sharpened "reason to change" to **actor**: a class should be responsible to one group of people who might ask for changes.

**Violation.** An `Invoice` class that computes the total with taxes, formats the invoice as a PDF, and saves it to the database. Three different people ask for changes to it: the finance team (tax rules), the design team (layout) and the database administrator (schema). A layout change risks breaking tax calculation, because both live in one class and share its fields.

**Fix.** Split by actor: `InvoiceCalculator` for totals, `InvoicePdfRenderer` for layout, `InvoiceRepository` for storage, with `Invoice` left as the data the three work on.

@figure srp-split

SRP does **not** mean "one method per class". A `Stack` with `push`, `pop` and `peek` has one responsibility. The smell to look for is a class whose methods fall into groups that use different fields and change for different reasons.

## O: Open/Closed Principle

> Software entities should be open for extension, but closed for modification.

Bertrand Meyer stated it in 1988 with inheritance in mind; today it is usually read through polymorphism: depend on an abstraction, and add behaviour by adding a new implementation of it.

**Violation.** A checkout function that switches on the customer type, so every new offer means editing, re-testing and re-deploying it. **Fix.** Make the discount an abstraction; each offer is its own class, and `checkout` is never edited again:

@figure ocp-checkout

In the program, `FestiveDiscount` was "added later" without touching `checkout`:

```cpp
#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class DiscountPolicy {  // the abstraction checkout depends on
public:
    virtual ~DiscountPolicy() = default;
    virtual string name() const = 0;
    virtual int apply(int amount) const = 0;
};

class NoDiscount : public DiscountPolicy {
public:
    string name() const override { return "Regular"; }
    int apply(int amount) const override { return amount; }
};

class StudentDiscount : public DiscountPolicy {
public:
    string name() const override { return "Student"; }
    int apply(int amount) const override { return amount * 90 / 100; }
};

class FestiveDiscount : public DiscountPolicy {  // added later: checkout() did not change
public:
    string name() const override { return "Festive"; }
    int apply(int amount) const override { return amount - min(amount / 4, 500); }
};

int checkout(int amount, const DiscountPolicy& policy) { return policy.apply(amount); }  // closed

int main() {
    vector<unique_ptr<DiscountPolicy>> policies;
    policies.push_back(make_unique<NoDiscount>());
    policies.push_back(make_unique<StudentDiscount>());
    policies.push_back(make_unique<FestiveDiscount>());
    for (const auto& p : policies)
        cout << p->name() << " customer pays " << checkout(1000, *p) << "\n";
    return 0;
}
```

```java
import java.util.List;

interface DiscountPolicy {  // the abstraction checkout depends on
    String name();
    int apply(int amount);
}

class NoDiscount implements DiscountPolicy {
    public String name() { return "Regular"; }
    public int apply(int amount) { return amount; }
}

class StudentDiscount implements DiscountPolicy {
    public String name() { return "Student"; }
    public int apply(int amount) { return amount * 90 / 100; }
}

class FestiveDiscount implements DiscountPolicy {  // added later: checkout() did not change
    public String name() { return "Festive"; }
    public int apply(int amount) { return amount - Math.min(amount / 4, 500); }
}

public class Main {
    static int checkout(int amount, DiscountPolicy policy) { return policy.apply(amount); }  // closed

    public static void main(String[] args) {
        List<DiscountPolicy> policies = List.of(new NoDiscount(), new StudentDiscount(), new FestiveDiscount());
        for (DiscountPolicy p : policies)
            System.out.println(p.name() + " customer pays " + checkout(1000, p));
    }
}
```

```python
from abc import ABC, abstractmethod


class DiscountPolicy(ABC):  # the abstraction checkout depends on
    @abstractmethod
    def name(self): ...

    @abstractmethod
    def apply(self, amount): ...


class NoDiscount(DiscountPolicy):
    def name(self): return "Regular"
    def apply(self, amount): return amount


class StudentDiscount(DiscountPolicy):
    def name(self): return "Student"
    def apply(self, amount): return amount * 90 // 100


class FestiveDiscount(DiscountPolicy):  # added later: checkout() did not change
    def name(self): return "Festive"
    def apply(self, amount): return amount - min(amount // 4, 500)


def checkout(amount, policy):  # closed for modification
    return policy.apply(amount)


for p in (NoDiscount(), StudentDiscount(), FestiveDiscount()):
    print(f"{p.name()} customer pays {checkout(1000, p)}")
```

```javascript
class NoDiscount {
  name() { return "Regular"; }
  apply(amount) { return amount; }
}

class StudentDiscount {
  name() { return "Student"; }
  apply(amount) { return Math.floor(amount * 90 / 100); }
}

class FestiveDiscount { // added later: checkout() did not change
  name() { return "Festive"; }
  apply(amount) { return amount - Math.min(Math.floor(amount / 4), 500); }
}

function checkout(amount, policy) { return policy.apply(amount); } // closed for modification

for (const p of [new NoDiscount(), new StudentDiscount(), new FestiveDiscount()]) {
  console.log(`${p.name()} customer pays ${checkout(1000, p)}`);
}
```

```output
Regular customer pays 1000
Student customer pays 900
Festive customer pays 750
```

Somewhere a factory still has to pick which policy to create, so one place in the program does change. The principle is about keeping that place small and keeping the tested business logic out of it. This structure is the Strategy pattern, covered in [Design Patterns for Interviews](/notes/oop/design-patterns).

## L: Liskov Substitution Principle

> If S is a subtype of T, objects of type T may be replaced with objects of type S without breaking the program.

The principle comes from Barbara Liskov, and the precise version (with Jeannette Wing, 1994) is about **behaviour**, not method signatures. A subtype must:

- accept at least what the base accepts — **preconditions cannot be strengthened**;
- deliver at least what the base promises — **postconditions cannot be weakened**;
- keep the base's **invariants**, and not throw exceptions the base's callers do not expect.

**Violation.** The classic example: `Square extends Rectangle`. Mathematically a square is a rectangle. But a mutable `Rectangle` promises that `setWidth` leaves the height alone, and a `Square` cannot keep that promise:

```cpp
#include <iostream>
#include <string>
using namespace std;

class Rectangle {
protected:
    int w = 0, h = 0;
public:
    virtual ~Rectangle() = default;
    virtual void setWidth(int x) { w = x; }
    virtual void setHeight(int x) { h = x; }
    int area() const { return w * h; }
};

class Square : public Rectangle {  // keeps its sides equal, breaking Rectangle's promise
public:
    void setWidth(int x) override { w = h = x; }
    void setHeight(int x) override { w = h = x; }
};

void resize(Rectangle& r, const string& label) {  // written for Rectangle
    r.setWidth(5);
    r.setHeight(4);  // relies on the width staying 5
    cout << label << ": expected 20, got " << r.area() << "\n";
}

int main() {
    Rectangle r;
    Square s;
    resize(r, "Rectangle");
    resize(s, "Square");
    return 0;
}
```

```java
class Rectangle {
    protected int w, h;
    void setWidth(int x) { w = x; }
    void setHeight(int x) { h = x; }
    int area() { return w * h; }
}

class Square extends Rectangle {  // keeps its sides equal, breaking Rectangle's promise
    @Override void setWidth(int x) { w = h = x; }
    @Override void setHeight(int x) { w = h = x; }
}

public class Main {
    static void resize(Rectangle r, String label) {  // written for Rectangle
        r.setWidth(5);
        r.setHeight(4);  // relies on the width staying 5
        System.out.println(label + ": expected 20, got " + r.area());
    }

    public static void main(String[] args) {
        resize(new Rectangle(), "Rectangle");
        resize(new Square(), "Square");
    }
}
```

```python
class Rectangle:
    def __init__(self):
        self.w = self.h = 0

    def set_width(self, x):
        self.w = x

    def set_height(self, x):
        self.h = x

    def area(self):
        return self.w * self.h


class Square(Rectangle):  # keeps its sides equal, breaking Rectangle's promise
    def set_width(self, x):
        self.w = self.h = x

    def set_height(self, x):
        self.w = self.h = x


def resize(r, label):  # written for Rectangle
    r.set_width(5)
    r.set_height(4)  # relies on the width staying 5
    print(f"{label}: expected 20, got {r.area()}")


resize(Rectangle(), "Rectangle")
resize(Square(), "Square")
```

```output
Rectangle: expected 20, got 20
Square: expected 20, got 16
```

@figure lsp-square

**Fix.** Do not model the relationship with mutable inheritance. Make shapes immutable (a `Square` that cannot be resized never breaks a promise about resizing), or make `Rectangle` and `Square` siblings under a `Shape` abstraction that only promises `area()`. The same shape of bug appears with `Bird.fly()` and a `Penguin` that throws: split out a `FlyingBird` type so only birds that fly promise to.

The practical test: if a subclass needs to throw "not supported", do nothing, or check its own type to honour an inherited method, it is probably not a true subtype.

## I: Interface Segregation Principle

> Clients should not be forced to depend on methods they do not use.

**Violation.** One fat `Machine` interface with `print`, `scan` and `fax`. A basic printer must implement `scan` and `fax` by throwing exceptions — an LSP problem waiting to happen — and every client that only prints is recompiled and retested whenever the fax method changes.

@figure isp-split

**Fix.** Split the interface by what clients need. A device implements as many small interfaces as it supports, and each function asks for only the capability it uses:

```java
interface Printer { void print(String doc); }
interface Scanner { String scan(); }
interface Fax { void fax(String doc, String number); }

class BasicPrinter implements Printer {  // implements only what it can do
    public void print(String doc) { System.out.println("BasicPrinter prints " + doc); }
}

class OfficeMachine implements Printer, Scanner, Fax {
    public void print(String doc) { System.out.println("OfficeMachine prints " + doc); }
    public String scan() { return "scan-001.pdf"; }
    public void fax(String doc, String number) { System.out.println("OfficeMachine faxes " + doc + " to " + number); }
}

public class Main {
    static void printAll(Printer p, String... docs) {  // depends only on printing
        for (String d : docs) p.print(d);
    }

    public static void main(String[] args) {
        printAll(new BasicPrinter(), "notes.pdf");
        OfficeMachine office = new OfficeMachine();
        printAll(office, "invoice.pdf");
        office.fax(office.scan(), "080-0000");
    }
}
```

```output
BasicPrinter prints notes.pdf
OfficeMachine prints invoice.pdf
OfficeMachine faxes scan-001.pdf to 080-0000
```

ISP is SRP seen from the caller's side: an interface should have one reason to change, and that reason is the needs of its clients.

## D: Dependency Inversion Principle

> High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.

**Violation.** An `OrderNotifier` (business policy) that creates an `EmailSender` (a detail) inside itself. Switching to SMS means editing the notifier, and testing it sends real email.

@figure dip-inversion

**Fix.** The high-level module defines the abstraction it needs — a `MessageSender` interface — and receives an implementation from outside, through its constructor. The arrows of dependency now point from the senders *to* the abstraction the policy owns; that reversal is the "inversion". A fake implementation makes the notifier testable without any network:

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

class MessageSender {  // the abstraction, owned by the high-level policy
public:
    virtual ~MessageSender() = default;
    virtual void send(const string& to, const string& text) = 0;
};

class EmailSender : public MessageSender {
public:
    void send(const string& to, const string& text) override { cout << "email to " << to << ": " << text << "\n"; }
};

class SmsSender : public MessageSender {
public:
    void send(const string& to, const string& text) override { cout << "sms to " << to << ": " << text << "\n"; }
};

class FakeSender : public MessageSender {  // for tests: records instead of sending
public:
    vector<string> sent;
    void send(const string&, const string& text) override { sent.push_back(text); }
};

class OrderNotifier {  // high-level: knows nothing about email or SMS
    MessageSender& sender;
public:
    explicit OrderNotifier(MessageSender& s) : sender(s) {}  // constructor injection
    void shipped(int orderId, const string& to) { sender.send(to, "Order " + to_string(orderId) + " shipped"); }
};

int main() {
    EmailSender email;
    SmsSender sms;
    FakeSender fake;
    OrderNotifier(email).shipped(42, "asha@example.com");
    OrderNotifier(sms).shipped(42, "90000 00001");
    OrderNotifier(fake).shipped(7, "test");
    cout << "fake sender recorded " << fake.sent.size() << " message: " << fake.sent[0] << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

interface MessageSender {  // the abstraction, owned by the high-level policy
    void send(String to, String text);
}

class EmailSender implements MessageSender {
    public void send(String to, String text) { System.out.println("email to " + to + ": " + text); }
}

class SmsSender implements MessageSender {
    public void send(String to, String text) { System.out.println("sms to " + to + ": " + text); }
}

class FakeSender implements MessageSender {  // for tests: records instead of sending
    final List<String> sent = new ArrayList<>();
    public void send(String to, String text) { sent.add(text); }
}

class OrderNotifier {  // high-level: knows nothing about email or SMS
    private final MessageSender sender;
    OrderNotifier(MessageSender sender) { this.sender = sender; }  // constructor injection
    void shipped(int orderId, String to) { sender.send(to, "Order " + orderId + " shipped"); }
}

public class Main {
    public static void main(String[] args) {
        new OrderNotifier(new EmailSender()).shipped(42, "asha@example.com");
        new OrderNotifier(new SmsSender()).shipped(42, "90000 00001");
        FakeSender fake = new FakeSender();
        new OrderNotifier(fake).shipped(7, "test");
        System.out.println("fake sender recorded " + fake.sent.size() + " message: " + fake.sent.get(0));
    }
}
```

```python
class EmailSender:
    def send(self, to, text):
        print(f"email to {to}: {text}")


class SmsSender:
    def send(self, to, text):
        print(f"sms to {to}: {text}")


class FakeSender:  # for tests: records instead of sending
    def __init__(self):
        self.sent = []

    def send(self, to, text):
        self.sent.append(text)


class OrderNotifier:  # high-level: needs only something with send(to, text)
    def __init__(self, sender):  # constructor injection
        self._sender = sender

    def shipped(self, order_id, to):
        self._sender.send(to, f"Order {order_id} shipped")


OrderNotifier(EmailSender()).shipped(42, "asha@example.com")
OrderNotifier(SmsSender()).shipped(42, "90000 00001")
fake = FakeSender()
OrderNotifier(fake).shipped(7, "test")
print(f"fake sender recorded {len(fake.sent)} message: {fake.sent[0]}")
```

```output
email to asha@example.com: Order 42 shipped
sms to 90000 00001: Order 42 shipped
fake sender recorded 1 message: Order 7 shipped
```

In Python the abstraction is implicit — duck typing means any object with `send(to, text)` will do — but the principle is the same: `OrderNotifier` never names a concrete sender.

Three terms are often mixed up:

| Term | What it is |
| --- | --- |
| Dependency Inversion Principle | A design rule: depend on abstractions owned by the high-level code |
| Dependency injection | A technique: pass dependencies in (constructor, setter, parameter) instead of creating them |
| Inversion of control | A broader idea: a framework creates your objects and calls your code, as Spring's container does |

## Spotting violations

| Principle | Smell in the code | Usual fix |
| --- | --- | --- |
| SRP | A class edited for unrelated reasons; method groups using different fields | Split by actor |
| OCP | A `switch` or `if` chain on a type code that grows with each feature | Polymorphism, Strategy |
| LSP | Overrides that throw "not supported" or check their own type | Rethink the hierarchy; composition |
| ISP | Implementations full of empty or throwing methods | Split the interface |
| DIP | `new ConcreteThing()` inside business logic; untestable without a database | Inject an abstraction |

## Common mistakes

- Reading SRP as "a class should do one thing" or "have one method"; it is about one reason, or actor, for change.
- Thinking OCP forbids ever editing a file; it is about not editing tested code to add a new variant.
- Judging LSP by method signatures alone; it is about behaviour and promises.
- Creating an interface for every class, each with one implementation, "for SOLID"; abstractions should earn their place.
- Confusing dependency inversion (a principle) with dependency injection (a technique) or with a DI framework.
- Applying all five everywhere in a small script; they pay off where code changes often.

## Interview questions

**Explain the Single Responsibility Principle with an example.**
A class should have one reason to change. An `Employee` class that calculates pay (owned by finance), formats reports (owned by HR) and saves itself to a database (owned by the DBA) has three. Splitting it into a pay calculator, a report formatter and a repository means a change for one group cannot break the others.

**How does the Strategy pattern relate to the Open/Closed Principle?**
Strategy puts each variant of an algorithm behind a common interface, and the code that uses it calls the interface only. Adding a variant means adding a class, not editing the user — which is exactly "open for extension, closed for modification".

**Can Square ever safely extend Rectangle?**
Yes, if both are immutable. The LSP problem comes from Rectangle's promise that width and height change independently. If neither has setters and both only promise `area()` and their dimensions, a square satisfies every promise a rectangle makes.

**Is there an LSP or ISP smell in the Java standard library?**
`List.of(...)` and `Collections.unmodifiableList(...)` return `List` objects whose `add` throws `UnsupportedOperationException`. The `List` contract documents `add` as an optional operation, so it is technically allowed, but callers holding a `List` cannot tell in advance which methods work — the kind of surprise ISP and LSP try to prevent.

**What is the difference between dependency inversion and dependency injection?**
Dependency inversion is the principle that high-level policy should depend on abstractions rather than on low-level details. Dependency injection is one way to achieve it: the object receives its dependencies from the outside instead of constructing them. You can inject concrete classes and still violate the principle.

**How do SRP and ISP differ?**
SRP is about the reasons a class changes; ISP is about what an interface forces on its clients. A class can have one responsibility yet expose a fat interface that different clients use different parts of — splitting that interface is ISP.

**Can you overdo SOLID?**
Yes. Wrapping every class in an interface with a single implementation, or splitting code into dozens of one-method classes, adds indirection without making any likely change easier. Apply the principles where change actually happens, and prefer the simplest design that handles the changes you can foresee.

**Which SOLID principle does a growing switch on object type violate?**
Mainly Open/Closed: every new type forces an edit to the switch, and to every other switch on the same type code. Moving the varying behaviour into a method on each type, so the switch becomes one polymorphic call, fixes it.

Next, read [Design Patterns for Interviews](/notes/oop/design-patterns), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

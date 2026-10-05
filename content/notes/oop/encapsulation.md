---
title: Encapsulation
order: 3
minutes: 13
level: beginner
updated: 2026-10-05
seo-title: Encapsulation in OOP: Access Modifiers and Data Hiding
description: Encapsulation in OOP: data hiding, access modifiers compared across C++, Java and Python, getters and setters with validation, and immutable classes.
question: What is encapsulation in OOP?
answer: Encapsulation is bundling an object's data together with the methods that operate on it, and restricting direct access to that data so it can change only through those methods. It lets a class enforce its own rules — a balance that never goes negative, a mark between 0 and 100 — and change its internals without breaking the code that uses it.
q: What is the difference between encapsulation and data hiding?
a: Data hiding is the access-restriction part: making fields private so outside code cannot touch them. Encapsulation is the wider idea of bundling data with the methods that use it, with data hiding as the tool that makes the bundle trustworthy. Many textbooks use the two words almost interchangeably.
q: What is the difference between encapsulation and abstraction?
a: Encapsulation is about protecting an object's data by bundling it with methods and hiding it behind access control. Abstraction is about exposing only what an object does and hiding how it does it, usually through interfaces or abstract classes. Encapsulation hides data; abstraction hides complexity.
q: Does Python support private variables?
a: Not in the enforced sense. A single leading underscore (_balance) marks an attribute as internal by convention, and a double leading underscore (__balance) triggers name mangling to _ClassName__balance, which avoids clashes in subclasses. Any code can still reach either one; Python relies on programmers respecting the convention.
q: What is the default access modifier in Java?
a: When you write no modifier, a member is package-private: visible to every class in the same package and to nothing outside it, not even subclasses in other packages. There is no keyword for it, so it is often called default access. Interface members are the exception: they are public by default.
q: Why do we use getters and setters?
a: They let a class control how a field is read and changed: a setter can validate the new value, a getter can compute or copy what it returns, and the field's storage can change later without changing callers. A setter that accepts anything, though, protects nothing; prefer methods that express real operations.
q: What is an immutable class?
a: An immutable class is one whose objects cannot change after construction: all fields are set in the constructor, none has a setter, and any method that seems to modify the object returns a new one instead. Java's String and Integer and Python's str and tuple are immutable.
---
**Encapsulation** is the first pillar of OOP and the one that does the most everyday work. A class bundles its data with the methods that use that data, and it hides the data so that nothing outside the class can change it except through those methods. The payoff is that the class can promise things about its own state — "the stock is never negative", "the email always contains an @" — and keep the promise, because every change goes through code it controls. This note covers how C++, Java and Python each restrict access, how to write setters that actually protect something, and how to build immutable classes.

## What encapsulation means

Encapsulation has two parts:

1. **Bundling** — the data and the operations on it live in one class, so the rules about the data live next to it.
2. **Access restriction (data hiding)** — fields are made inaccessible from outside, and the class offers methods as the only way in.

The rules a class keeps true about its own state are called **invariants**. A `Product` might have two: price is positive, stock is not negative. If `stock` were a public field, any line anywhere could set it to −5 and the invariant would be gone. With the field private, only the class's methods can change it, and each method checks the rule.

Encapsulation pays off in three ways:

- **Correctness** — invariants are checked in one place instead of at every call site.
- **Freedom to change** — callers depend on methods, not fields, so you can store a price in paise instead of rupees, or cache a computed value, without touching any caller.
- **Easier debugging** — when a value goes wrong, there are only a few methods that could have changed it.

## Access modifiers in C++, Java and Python

### C++

C++ has three access specifiers, written as labels inside the class:

- `public` — anyone can use the member.
- `protected` — the class itself, classes derived from it, and its friends.
- `private` — the class itself and its friends only.

Members of a `class` are private until a label says otherwise; members of a `struct` are public. A class can grant access to a named function or class with `friend` — the class decides who its friends are, so this does not let outside code break in uninvited.

### Java

Java has four levels, one of them without a keyword:

| Modifier | Same class | Same package | Subclass in another package | Anywhere |
| --- | --- | --- | --- | --- |
| `private` | Yes | No | No | No |
| none (package-private) | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes, through inheritance | No |
| `public` | Yes | Yes | Yes | Yes |

@figure access-levels

One detail trips people up: a subclass in another package can use an inherited `protected` member only through references of its own type, not through an arbitrary parent-class object. A top-level class can only be `public` or package-private.

### Python

Python has no access keywords. It relies on naming conventions:

- `name` — public.
- `_name` — internal; please do not use it from outside. Nothing stops you.
- `__name` (two leading underscores, at most one trailing) — **name mangling**: inside class `Account`, `self.__pin` is stored as `self._Account__pin`. The goal is to stop a subclass accidentally overwriting the attribute, not security; `obj._Account__pin` still works.

Python's tool for controlled access is `@property`, which makes a method look like an attribute. Callers write `p.price = 25`, and the property's setter runs and can reject the value.

### Side by side

| Level | C++ | Java | Python |
| --- | --- | --- | --- |
| Everyone | `public` | `public` | `name` |
| Class and subclasses | `protected` | `protected` (plus the package) | `_name`, by convention only |
| Same package or module | no equivalent | package-private (no keyword) | `_name` at module level, by convention |
| Class only | `private` | `private` | `__name`, name-mangled but reachable |
| Default when unspecified | `private` in a class, `public` in a struct | package-private | public |
| Who enforces it | The compiler | The compiler and the JVM | Nobody: convention |

In C++ and Java, access is checked **per class, not per object**: a method of `Account` may read the private `balance` of *another* `Account` object. That is what makes `equals(Account other)` and copy constructors possible.

## Getters and setters with validation

A getter returns a field's value; a setter changes it. A setter earns its place only if it checks something. Better still, give the class methods that describe real operations — `sell(quantity)` rather than `setStock(getStock() - quantity)` — a guideline often called **tell, don't ask**. The class below rejects invalid prices and stock levels, and `sell` refuses to oversell:

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

class Product {
    string name;
    int price;  // rupees; invariant: > 0
    int stock;  // invariant: >= 0
public:
    Product(string name, int price, int stock) : name(name), price(0), stock(0) {
        setPrice(price);  // the constructor uses the same checks
        setStock(stock);
    }
    int getPrice() const { return price; }
    void setPrice(int p) {
        if (p <= 0) throw invalid_argument("price must be positive");
        price = p;
    }
    void setStock(int s) {
        if (s < 0) throw invalid_argument("stock cannot be negative");
        stock = s;
    }
    void sell(int qty) {  // an operation, not a raw setter
        if (qty > stock) throw invalid_argument("only " + to_string(stock) + " in stock");
        stock -= qty;
    }
    void show() const { cout << name << ": Rs " << price << ", stock " << stock << "\n"; }
};

int main() {
    Product pen("Pen", 20, 100);
    pen.show();
    try { pen.setPrice(-5); } catch (const invalid_argument& e) { cout << "rejected: " << e.what() << "\n"; }
    try { pen.setStock(-1); } catch (const invalid_argument& e) { cout << "rejected: " << e.what() << "\n"; }
    pen.sell(30);
    try { pen.sell(500); } catch (const invalid_argument& e) { cout << "rejected: " << e.what() << "\n"; }
    pen.setPrice(25);
    pen.show();
    return 0;
}
```

```java
class Product {
    private final String name;
    private int price;  // rupees; invariant: > 0
    private int stock;  // invariant: >= 0

    Product(String name, int price, int stock) {
        this.name = name;
        setPrice(price);  // the constructor uses the same checks
        setStock(stock);
    }

    int getPrice() { return price; }

    void setPrice(int p) {
        if (p <= 0) throw new IllegalArgumentException("price must be positive");
        price = p;
    }

    void setStock(int s) {
        if (s < 0) throw new IllegalArgumentException("stock cannot be negative");
        stock = s;
    }

    void sell(int qty) {  // an operation, not a raw setter
        if (qty > stock) throw new IllegalArgumentException("only " + stock + " in stock");
        stock -= qty;
    }

    void show() { System.out.println(name + ": Rs " + price + ", stock " + stock); }
}

public class Main {
    public static void main(String[] args) {
        Product pen = new Product("Pen", 20, 100);
        pen.show();
        try { pen.setPrice(-5); } catch (IllegalArgumentException e) { System.out.println("rejected: " + e.getMessage()); }
        try { pen.setStock(-1); } catch (IllegalArgumentException e) { System.out.println("rejected: " + e.getMessage()); }
        pen.sell(30);
        try { pen.sell(500); } catch (IllegalArgumentException e) { System.out.println("rejected: " + e.getMessage()); }
        pen.setPrice(25);
        pen.show();
    }
}
```

```python
class Product:
    def __init__(self, name, price, stock):
        self._name = name
        self.price = price  # goes through the property setter below
        self.stock = stock

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, p):
        if p <= 0:
            raise ValueError("price must be positive")
        self._price = p

    @property
    def stock(self):
        return self._stock

    @stock.setter
    def stock(self, s):
        if s < 0:
            raise ValueError("stock cannot be negative")
        self._stock = s

    def sell(self, qty):  # an operation, not a raw setter
        if qty > self._stock:
            raise ValueError(f"only {self._stock} in stock")
        self._stock -= qty

    def show(self):
        print(f"{self._name}: Rs {self._price}, stock {self._stock}")


pen = Product("Pen", 20, 100)
pen.show()
try:
    pen.price = -5
except ValueError as e:
    print(f"rejected: {e}")
try:
    pen.stock = -1
except ValueError as e:
    print(f"rejected: {e}")
pen.sell(30)
try:
    pen.sell(500)
except ValueError as e:
    print(f"rejected: {e}")
pen.price = 25
pen.show()
```

```javascript
class Product {
  #name; #price; #stock;

  constructor(name, price, stock) {
    this.#name = name;
    this.price = price; // goes through the setter below
    this.stock = stock;
  }

  get price() { return this.#price; }
  set price(p) {
    if (p <= 0) throw new RangeError("price must be positive");
    this.#price = p;
  }

  get stock() { return this.#stock; }
  set stock(s) {
    if (s < 0) throw new RangeError("stock cannot be negative");
    this.#stock = s;
  }

  sell(qty) { // an operation, not a raw setter
    if (qty > this.#stock) throw new RangeError(`only ${this.#stock} in stock`);
    this.#stock -= qty;
  }

  show() { console.log(`${this.#name}: Rs ${this.#price}, stock ${this.#stock}`); }
}

const pen = new Product("Pen", 20, 100);
pen.show();
try { pen.price = -5; } catch (e) { console.log(`rejected: ${e.message}`); }
try { pen.stock = -1; } catch (e) { console.log(`rejected: ${e.message}`); }
pen.sell(30);
try { pen.sell(500); } catch (e) { console.log(`rejected: ${e.message}`); }
pen.price = 25;
pen.show();
```

```output
Pen: Rs 20, stock 100
rejected: price must be positive
rejected: stock cannot be negative
rejected: only 70 in stock
Pen: Rs 25, stock 70
```

@figure invariant-guard

## Immutable classes

An **immutable** object cannot change after it is built. Immutable objects are simple to reason about, safe to share between threads without locks, and safe to use as keys in hash maps. Java's `String`, `Integer` and `LocalDate`, and Python's `str`, `int`, `tuple` and `frozenset`, are all immutable.

The recipe, in Java terms:

1. Make every field `private final` and set each one in the constructor.
2. Provide no setters. Methods that "change" the object return a **new** object instead (`plus`, `withPrice`).
3. Make the class `final`, so no subclass can add mutable state or override methods to behave mutably.
4. Make **defensive copies** of mutable inputs (a list passed to the constructor) and never hand out a mutable internal object.

Java 16's `record` covers rules 1–3 in one line, though a record holding a `List` is only as immutable as that list. In Python, `@dataclass(frozen=True)` makes assignment to a field raise an error, and storing a `tuple` instead of a `list` covers rule 4. In C++, `const` member functions promise not to change the object, `const` objects can call only those, and value members are copied on construction automatically.

```cpp
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
using namespace std;

class Money {  // immutable: private state, no setters, const methods only
    const long paise;
    const string currency;
public:
    Money(long paise, string currency) : paise(paise), currency(currency) {}
    Money plus(const Money& other) const { return Money(paise + other.paise, currency); }
    void show(const string& label) const {
        cout << label << ": " << currency << " " << paise / 100 << "."
             << setw(2) << setfill('0') << paise % 100 << "\n";
    }
};

class Roster {
    const vector<string> names;  // stored by value: the caller's vector is copied
public:
    explicit Roster(const vector<string>& names) : names(names) {}
    size_t size() const { return names.size(); }
};

int main() {
    Money price(49950, "INR");
    Money total = price.plus(Money(5025, "INR"));  // a new object; price is untouched
    price.show("price");
    total.show("total");

    vector<string> input = {"Asha", "Ravi"};
    Roster roster(input);
    input.push_back("Kiran");  // changing the caller's vector
    cout << "roster size: " << roster.size() << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

final class Money {  // final: no subclass can add mutable state
    private final long paise;
    private final String currency;

    Money(long paise, String currency) { this.paise = paise; this.currency = currency; }

    Money plus(Money other) { return new Money(paise + other.paise, currency); }

    void show(String label) {
        System.out.println(label + ": " + currency + " " + paise / 100 + "." + String.format("%02d", paise % 100));
    }
}

final class Roster {
    private final List<String> names;
    Roster(List<String> names) { this.names = List.copyOf(names); }  // defensive, unmodifiable copy
    int size() { return names.size(); }
}

public class Main {
    public static void main(String[] args) {
        Money price = new Money(49950, "INR");
        Money total = price.plus(new Money(5025, "INR"));  // a new object; price is untouched
        price.show("price");
        total.show("total");

        List<String> input = new ArrayList<>(List.of("Asha", "Ravi"));
        Roster roster = new Roster(input);
        input.add("Kiran");  // changing the caller's list
        System.out.println("roster size: " + roster.size());
    }
}
```

```python
from dataclasses import dataclass


@dataclass(frozen=True)  # assigning to a field raises FrozenInstanceError
class Money:
    paise: int
    currency: str

    def plus(self, other):
        return Money(self.paise + other.paise, self.currency)

    def show(self, label):
        print(f"{label}: {self.currency} {self.paise // 100}.{self.paise % 100:02d}")


class Roster:
    def __init__(self, names):
        self._names = tuple(names)  # defensive, immutable copy

    def size(self):
        return len(self._names)


price = Money(49950, "INR")
total = price.plus(Money(5025, "INR"))  # a new object; price is untouched
price.show("price")
total.show("total")

names = ["Asha", "Ravi"]
roster = Roster(names)
names.append("Kiran")  # changing the caller's list
print(f"roster size: {roster.size()}")
```

```output
price: INR 499.50
total: INR 549.75
roster size: 2
```

@figure money-plus

@figure defensive-copy

A missing defensive copy is the most common way an "immutable" class turns out not to be.

## Encapsulation vs abstraction vs data hiding

| | Encapsulation | Data hiding | Abstraction |
| --- | --- | --- | --- |
| Idea | Bundle data with its methods | Restrict direct access to data | Show what, hide how |
| Hides | The internal state | The internal state | Implementation complexity |
| Tool | Classes | Access modifiers | Interfaces, abstract classes |
| Level | Implementation | Implementation | Design |
| Example | `Product` with `sell()` | `private int stock` | A `PaymentMethod` interface |

Abstraction gets its own note: [Abstraction: Abstract Classes and Interfaces](/notes/oop/abstraction).

## Common mistakes

- Generating a getter and setter for every private field; a setter with no checks is a public field with extra steps.
- Returning an internal mutable list from a getter, so callers can modify it behind the class's back.
- Believing Python's `__name` makes an attribute private; it only renames it.
- Assuming Java's `protected` means "subclasses only"; it also opens the member to the whole package.
- Validating in setters but not in the constructor, so invalid objects can still be created.
- Marking fields `final` and calling the class immutable while a field holds a mutable list.

## Interview questions

**How do you achieve encapsulation in Java?**
Declare the fields `private`, expose behaviour through `public` methods that validate their input, and keep helper classes package-private. Packages, and since Java 9 modules, extend the same idea to whole groups of classes by choosing which ones other code can see.

**Can a method read the private fields of another object of the same class?**
Yes, in both C++ and Java access control is per class, not per object. A method of `Account` may read `other.balance` when `other` is also an `Account`. This is what lets you write copy constructors, `equals` methods and comparison operators.

**What is name mangling in Python, and does it make an attribute private?**
An attribute written `__pin` inside class `Account` is stored as `_Account__pin`. It exists to prevent accidental clashes when a subclass uses the same name. It is not privacy: `obj._Account__pin` still reads it.

**How does protected differ between C++ and Java?**
In C++, a protected member is visible to the class, its derived classes and friends. In Java it is also visible to every class in the same package, whether or not it is a subclass. Java subclasses in other packages may use it only through their own type.

**Why should an immutable class be final in Java?**
A subclass could add mutable fields or override methods so that its objects appear to change, and code holding a reference of the parent type would be fooled. Making the class `final`, or making the constructor private and offering a static factory, closes that hole.

**Is a C++ friend function a violation of encapsulation?**
Not necessarily. The class itself names its friends, so access is still granted deliberately and in one place. A friend is best seen as part of the class's interface — `operator<<` for printing is the common example. Granting friendship widely does weaken the class's guarantees.

**Can Java reflection access private fields?**
Yes: `Field.setAccessible(true)` lets code read and write private fields of ordinary classes. Since Java 9 the module system can block this for packages a module does not open, and the JDK's own internals have been blocked by default since Java 16. Access modifiers guard against mistakes, not against hostile code in the same process.

**Are getters and setters always good practice?**
No. They are better than public fields because they leave room for validation and change, but a class made of nothing else is a data holder whose rules live elsewhere. Prefer methods that perform meaningful operations and keep the rules inside the class.

Next, read [Inheritance](/notes/oop/inheritance), then check yourself with the [OOP Basic skill test](/skill-tests/oop-basic).

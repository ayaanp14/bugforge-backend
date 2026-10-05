---
title: Introduction to Object-Oriented Programming
order: 1
minutes: 12
level: beginner
updated: 2026-10-05
seo-title: What is OOP? Object-Oriented Programming Basics
description: What object-oriented programming is: classes and objects, the four pillars of OOP, procedural vs OOP, and how C++, Java and Python each do it.
question: What is object-oriented programming (OOP)?
answer: Object-oriented programming is a way of organising a program around objects, each bundling data (its state) with the functions that work on that data (its behaviour). Classes describe what kind of object to make, and the four pillars — encapsulation, abstraction, inheritance and polymorphism — describe how objects hide details, share code and stand in for one another.
q: What is an object in OOP?
a: An object is one thing your program works with, made from a class. It has state (the values of its fields), behaviour (the methods you can call on it) and identity (it is a distinct object even if another one holds exactly the same values).
q: What is the difference between a class and an object?
a: A class is a definition: the fields every object will have and the methods that work on them. An object is one instance of that class created at run time, with its own values for those fields. Student is a class; the student with roll number 42 is an object.
q: Is C++ a pure object-oriented language?
a: No. C++ is multi-paradigm: you can write free functions and global variables, and values such as int are not objects with methods. Java is closer but still has primitive types and static methods. Smalltalk is the usual example of a pure object-oriented language, where every value is an object.
q: Is Python an object-oriented language?
a: Yes. Every value in Python — integers, strings, functions, even classes themselves — is an object with a type. Python also lets you write plain functions and top-level scripts, so it is multi-paradigm: you use classes where they help and skip them where they do not.
q: What are the advantages of OOP?
a: Code is grouped around the things it models, so a change usually stays inside one class. Encapsulation protects each object's rules, inheritance and composition reuse code, and polymorphism lets a new type plug into existing code without editing it. The price is more indirection and more design up front.
q: Which was the first object-oriented programming language?
a: Simula 67, designed by Ole-Johan Dahl and Kristen Nygaard in Norway, introduced classes, objects, inheritance and virtual procedures. Smalltalk, built at Xerox PARC in the 1970s by Alan Kay's group, popularised the term object-oriented and made every value an object.
---
Object-oriented programming (OOP) is a way of structuring a program as a set of **objects** that each hold some data and the operations allowed on that data. Instead of passing a bank balance to whichever function needs it, you build an `Account` object that owns its balance and offers `deposit` and `withdraw`; nothing else touches the number directly. OOP exists because large programs grow faster than anyone can hold in their head, and grouping data with the code that guards it keeps each change in one place. C++, Java, Python, C# and JavaScript all support it, so an interviewer can ask you to explain it in whichever language you list on your resume.

## What object-oriented programming means

The vocabulary is small, and every later note builds on it:

- An **object** has three things: **state** (the current values of its fields, also called attributes or data members), **behaviour** (its methods — functions that belong to it) and **identity** (it is itself, even if another object holds identical values).
- A **class** is the blueprint for objects: it declares which fields each object has and defines the methods. Making an object from a class is called **instantiation**; the object is an **instance** of the class.
- Objects work together by calling each other's methods. Older texts call this **message passing**: you ask an object to do something, and the object decides how.

A running OOP program is therefore a group of objects, each responsible for its own data, collaborating through method calls. The design question shifts from "what steps does the program take?" to "what things exist, what does each one know, and what can each one do?"

## Procedural vs object-oriented programming

Procedural programming — the style of C or Pascal — organises a program as functions that act on data passed to them. OOP moves the functions next to the data. Neither is "better" in general; they make different changes cheap.

@figure procedural-vs-oop

| Aspect | Procedural | Object-oriented |
| --- | --- | --- |
| Unit of organisation | Functions (procedures) | Classes and objects |
| Data and code | Separate; data is passed to functions | Bundled; methods live with the data |
| Access to data | Often global or freely shared | Hidden behind methods (access control) |
| Design direction | Top-down: split the task into steps | Model the things, then how they interact |
| Reuse | Call shared functions | Composition, inheritance, polymorphism |
| Adding a new kind of data | Edit every function that switches on the kind | Add one class; callers use it through the interface |
| Adding a new operation | Add one function | May need a method in every class |
| Typical languages | C, Pascal, Fortran | Java, C#, Smalltalk; C++ and Python do both |

The last two rows are the honest trade-off, and they are easiest to see as a grid of types against operations:

@figure types-vs-operations

You can also write object-style code in a procedural language — the Linux kernel's `struct file_operations` is a table of function pointers that each file system fills in, which is hand-made polymorphism in C — but the language gives you no help enforcing it.

## Classes and objects

Here is one class and two objects, run statement by statement:

@figure class-and-objects

```cpp
#include <iostream>
#include <string>
using namespace std;

class Account {
    string owner;
    int balance;  // private: only Account's own methods can touch it
public:
    Account(string owner, int opening) : owner(owner), balance(opening) {}

    void deposit(int amount) { balance += amount; }

    bool withdraw(int amount) {
        if (amount > balance) return false;  // the object guards its own rule
        balance -= amount;
        return true;
    }

    void show() const { cout << owner << " has Rs " << balance << "\n"; }
};

int main() {
    Account asha("Asha", 500);   // two objects of one class,
    Account ravi("Ravi", 1000);  // each with its own state

    asha.deposit(250);
    if (!ravi.withdraw(1500)) cout << "Ravi: withdrawal refused\n";
    ravi.withdraw(300);

    asha.show();
    ravi.show();
    return 0;
}
```

```java
class Account {
    private final String owner;
    private int balance;  // private: only Account's own methods can touch it

    Account(String owner, int opening) {
        this.owner = owner;
        this.balance = opening;
    }

    void deposit(int amount) { balance += amount; }

    boolean withdraw(int amount) {
        if (amount > balance) return false;  // the object guards its own rule
        balance -= amount;
        return true;
    }

    void show() { System.out.println(owner + " has Rs " + balance); }
}

public class Main {
    public static void main(String[] args) {
        Account asha = new Account("Asha", 500);   // two objects of one class,
        Account ravi = new Account("Ravi", 1000);  // each with its own state

        asha.deposit(250);
        if (!ravi.withdraw(1500)) System.out.println("Ravi: withdrawal refused");
        ravi.withdraw(300);

        asha.show();
        ravi.show();
    }
}
```

```python
class Account:
    def __init__(self, owner, opening):
        self.owner = owner
        self._balance = opening  # leading underscore: internal, by convention

    def deposit(self, amount):
        self._balance += amount

    def withdraw(self, amount):
        if amount > self._balance:
            return False  # the object guards its own rule
        self._balance -= amount
        return True

    def show(self):
        print(f"{self.owner} has Rs {self._balance}")


asha = Account("Asha", 500)   # two objects of one class,
ravi = Account("Ravi", 1000)  # each with its own state

asha.deposit(250)
if not ravi.withdraw(1500):
    print("Ravi: withdrawal refused")
ravi.withdraw(300)

asha.show()
ravi.show()
```

```javascript
class Account {
  #balance; // private field: only Account's own methods can touch it

  constructor(owner, opening) {
    this.owner = owner;
    this.#balance = opening;
  }

  deposit(amount) { this.#balance += amount; }

  withdraw(amount) {
    if (amount > this.#balance) return false; // the object guards its own rule
    this.#balance -= amount;
    return true;
  }

  show() { console.log(`${this.owner} has Rs ${this.#balance}`); }
}

const asha = new Account("Asha", 500);   // two objects of one class,
const ravi = new Account("Ravi", 1000);  // each with its own state

asha.deposit(250);
if (!ravi.withdraw(1500)) console.log("Ravi: withdrawal refused");
ravi.withdraw(300);

asha.show();
ravi.show();
```

```output
Ravi: withdrawal refused
Asha has Rs 750
Ravi has Rs 700
```

Notice what the Python version does differently: there is no `private` keyword, only the underscore convention. Python trusts the caller; C++ and Java make the compiler refuse. The next note, [Classes and Objects](/notes/oop/classes-and-objects), covers constructors, `this`/`self`, static members and where objects live in memory.

## The four pillars of OOP

Almost every interview starts here. Learn one sentence of definition and one example for each.

### Encapsulation

Encapsulation is bundling an object's data with the methods that operate on it and restricting direct access to that data, so the object can keep its own rules (its **invariants**) true. The `Account` above is encapsulated: the balance can only change through `deposit` and `withdraw`, so it can never go negative. Access modifiers (`private`, `protected`, `public`) are the language tool for it. Full detail: [Encapsulation](/notes/oop/encapsulation).

### Abstraction

Abstraction is showing *what* an object does and hiding *how* it does it. A caller sees `withdraw(amount)`; it does not see the database row, the audit log or the fraud check behind it. Abstract classes and interfaces are how you write an abstraction down as a type: "anything that can `pay(amount)`", with the details left to each implementation. Full detail: [Abstraction](/notes/oop/abstraction).

### Inheritance

Inheritance lets a class (the **subclass**, child or derived class) reuse and extend another class (the **superclass**, parent or base class). It models an **is-a** relationship: a `SavingsAccount` is an `Account`, so it gets `deposit` and `withdraw` for free and adds `addInterest`. It is powerful and easily overused; often you should build objects out of other objects instead. Full detail: [Inheritance](/notes/oop/inheritance).

### Polymorphism

Polymorphism ("many forms") means one interface, many implementations: code written against `Shape` works for every kind of shape, and each shape answers `area()` in its own way. **Compile-time** polymorphism is overloading (same method name, different parameters); **run-time** polymorphism is overriding, where the object's actual class picks the method while the program runs. Full detail: [Polymorphism](/notes/oop/polymorphism).

## The four pillars in one program

One small program shows all four at once. The figure points at each pillar in its class diagram; the code follows.

@figure four-pillars

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Shape {  // abstraction: what every shape can do
public:
    virtual ~Shape() = default;
    virtual string name() const = 0;
    virtual int area() const = 0;
};

class Rectangle : public Shape {  // inheritance
    int w, h;  // encapsulation: private dimensions
public:
    Rectangle(int w, int h) : w(w), h(h) {}
    string name() const override { return "Rectangle"; }
    int area() const override { return w * h; }
};

class Triangle : public Shape {
    int base, height;
public:
    Triangle(int b, int h) : base(b), height(h) {}
    string name() const override { return "Triangle"; }
    int area() const override { return base * height / 2; }
};

int main() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Rectangle>(4, 5));
    shapes.push_back(make_unique<Triangle>(6, 4));
    int total = 0;
    for (const auto& s : shapes) {  // polymorphism: each shape answers area() its own way
        cout << s->name() << ": " << s->area() << "\n";
        total += s->area();
    }
    cout << "Total area: " << total << "\n";
    return 0;
}
```

```java
import java.util.List;

abstract class Shape {  // abstraction: what every shape can do
    abstract String name();
    abstract int area();
}

class Rectangle extends Shape {  // inheritance
    private final int w, h;  // encapsulation: private dimensions
    Rectangle(int w, int h) { this.w = w; this.h = h; }
    String name() { return "Rectangle"; }
    int area() { return w * h; }
}

class Triangle extends Shape {
    private final int base, height;
    Triangle(int base, int height) { this.base = base; this.height = height; }
    String name() { return "Triangle"; }
    int area() { return base * height / 2; }
}

public class Main {
    public static void main(String[] args) {
        List<Shape> shapes = List.of(new Rectangle(4, 5), new Triangle(6, 4));
        int total = 0;
        for (Shape s : shapes) {  // polymorphism: each shape answers area() its own way
            System.out.println(s.name() + ": " + s.area());
            total += s.area();
        }
        System.out.println("Total area: " + total);
    }
}
```

```python
from abc import ABC, abstractmethod


class Shape(ABC):  # abstraction: what every shape can do
    @abstractmethod
    def name(self): ...

    @abstractmethod
    def area(self): ...


class Rectangle(Shape):  # inheritance
    def __init__(self, w, h):
        self._w, self._h = w, h  # encapsulation (by convention)

    def name(self):
        return "Rectangle"

    def area(self):
        return self._w * self._h


class Triangle(Shape):
    def __init__(self, base, height):
        self._base, self._height = base, height

    def name(self):
        return "Triangle"

    def area(self):
        return self._base * self._height // 2


shapes = [Rectangle(4, 5), Triangle(6, 4)]
total = 0
for s in shapes:  # polymorphism: each shape answers area() its own way
    print(f"{s.name()}: {s.area()}")
    total += s.area()
print(f"Total area: {total}")
```

```output
Rectangle: 20
Triangle: 12
Total area: 32
```

## Benefits and costs of OOP

What OOP buys you:

- **Locality of change.** The rules for an account live in `Account`. Fixing a bug or changing a rule touches one class.
- **Protected invariants.** Encapsulation means no stray function can set a balance to −500.
- **Reuse.** Composition and inheritance let new classes build on tested ones.
- **Extensibility.** With polymorphism, a new `Circle` class works with every function that already takes a `Shape`, with no edits to those functions.
- **A shared vocabulary.** Classes named after the domain (`Order`, `Invoice`, `Shipment`) make code easier to discuss with people who are not programmers.

What it costs:

- **Indirection.** Following a call through an interface to the right implementation takes longer than reading one function.
- **Up-front design.** Bad class boundaries are expensive to move later; deep inheritance trees are the classic example.
- **Overhead in small programs.** A 40-line script rarely needs a class hierarchy.
- **Performance in tight loops.** Virtual calls and scattered heap objects can be slower than plain arrays processed by one function; game engines and numeric code often use data-oriented designs for this reason.

## OOP in C++ vs Java vs Python

All three support the same ideas with different defaults. This table is worth memorising because interviewers like the "how does language X do it" follow-up.

| Feature | C++ | Java | Python |
| --- | --- | --- | --- |
| Everything an object? | No: primitives and free functions | No: 8 primitive types; all code sits inside classes | Yes: ints, functions and classes are objects |
| Constructor | Same name as the class | Same name as the class | `__init__` (with `__new__` creating the object) |
| Access control | `public`, `protected`, `private`, checked by the compiler | `public`, `protected`, package-private, `private` | Conventions: `_name`, and `__name` name mangling |
| Run-time dispatch | Only for `virtual` functions | Every non-static, non-private instance method | Every method, looked up when called |
| Multiple inheritance of classes | Yes | No; a class may implement many interfaces | Yes, ordered by the MRO |
| Interfaces | Abstract class with pure virtual functions | `interface` keyword | Abstract base classes (`abc`) or duck typing |
| Operator overloading | Yes | No (only the built-in `+` on `String`) | Yes, through methods like `__add__` |
| Object memory | Stack or heap; heap freed by you (RAII, smart pointers) | Heap, garbage collected | Heap; CPython uses reference counting plus a cycle collector |
| Typing | Static | Static | Dynamic (duck typing) |

**Duck typing** means Python cares whether an object *has* the method you call, not which class it belongs to: "if it walks like a duck and quacks like a duck, it is a duck".

## Common mistakes

- Saying a class and an object are the same thing — a class is the definition, an object is an instance made at run time.
- Calling Java "100% object-oriented" — `int`, `double` and the other primitives are not objects, and static methods run without one.
- Thinking getters and setters for every field is encapsulation; exposing every field through methods hides nothing.
- Mixing up abstraction (hiding *how*) with encapsulation (bundling and protecting *data*).
- Reaching for inheritance whenever two classes share code; composition is usually the safer default.
- Assuming every method in C++ is overridable at run time — without `virtual` it is not.

## Interview questions

**What is the difference between procedural and object-oriented programming?**
Procedural code is organised as functions that operate on data passed to them; object-oriented code bundles the data and the functions into objects. OOP adds access control, inheritance and polymorphism, which make adding new types of data cheap. Procedural code makes adding new operations cheap, since one new function can handle every kind of data.

**Explain the four pillars of OOP with one example.**
Take a payment system. Encapsulation: a `Wallet` keeps its balance private and changes it only through `pay`. Abstraction: callers depend on a `PaymentMethod` with a `pay(amount)` method. Inheritance: `UpiPayment` and `CardPayment` extend `PaymentMethod`. Polymorphism: `checkout(method)` calls `method.pay(amount)` and the right version runs for whichever object was passed.

**Does a class occupy memory?**
The class's code, its static fields and its metadata (such as a vtable in C++ or the class object in Java and Python) exist once. Memory for instance fields is allocated only when an object is created, once per object. So declaring a class does not allocate any per-object storage.

**What is the difference between a class and a struct in C++?**
Only the defaults: members of a `struct` are public by default and members of a `class` are private, and a `struct` inherits publicly by default while a `class` inherits privately. Both can have constructors, methods, virtual functions and inheritance. By convention, `struct` is used for plain data and `class` for types with invariants.

**Why is Java not considered a purely object-oriented language?**
It has eight primitive types (`int`, `long`, `double`, `boolean` and so on) that are not objects, and static methods and fields can be used without any object at all. Wrapper classes such as `Integer` and autoboxing paper over the first point but do not remove it.

**Can you write object-oriented code in C?**
Yes, by hand. A struct holds the state, function pointers in the struct give each "class" its own behaviour, and an opaque pointer declared in a header hides the fields from callers. The language does not check any of it — there is no inheritance, no access control and no automatic dispatch.

**What is message passing in OOP?**
It is the idea that objects interact by asking each other to do things — calling a method on an object — and the receiving object decides how to respond. With run-time polymorphism, the same call can run different code depending on the receiver's actual class.

**When would you avoid OOP?**
For short scripts, one-off data transformations and pipelines that are naturally a chain of functions, classes add ceremony without benefit. Performance-critical code that processes millions of similar items often stores them in plain arrays instead of separate objects, for better cache use.

Next, read [Classes and Objects](/notes/oop/classes-and-objects), then check yourself with the [OOP Basic skill test](/skill-tests/oop-basic).

---
title: Classes, objects and references
minutes: 14
---
Up to now every program has been one class with static methods — Java used as a procedural language. Real Java is objects: bundles of *state* (fields) and *behaviour* (methods) that model something. This lesson is the object model itself: what a class declares, what `new` does, what a reference is, and how `this` ties them together. Everything in the next four modules stands on it.

## A class is a blueprint

```java
public class BankAccount {
    // state: each object has its own copy of these
    private String owner;
    private long balanceCents;

    // behaviour: operates on the state of the object it is called on
    public void deposit(long cents) {
        if (cents <= 0) throw new IllegalArgumentException("deposit must be positive");
        balanceCents += cents;
    }

    public boolean withdraw(long cents) {
        if (cents > balanceCents) return false;
        balanceCents -= cents;
        return true;
    }

    public long balance() { return balanceCents; }
    public String owner()  { return owner; }
}
```

The class describes what every account *has* and *can do*. It creates nothing by itself. `BankAccount` is also a **type**: variables, parameters and fields can be declared as `BankAccount`.

## An object is an instance

```java
BankAccount a = new BankAccount();     // allocate an object on the heap, run its constructor
BankAccount b = new BankAccount();     // a second, independent object
a.deposit(500);
b.deposit(100);
a.balance()      // 500
b.balance()      // 100
```

`new` allocates memory for the fields (`owner` null, `balanceCents` 0 — the defaults), runs a constructor (next lesson), and returns a **reference** to the new object. Each object has its own fields; a method called on `a` reads and writes `a`'s fields.

## References

`a` does not *contain* the account; it *points to* it. This has the same consequences as with arrays:

```java
BankAccount c = a;        // alias: c and a refer to the same object
c.deposit(1);             // a.balance() is now 501
a == c                    // true — same object
a == b                    // false — different objects, even if their fields were equal
BankAccount d = null;     // a reference to nothing
d.balance();              // NullPointerException
```

Passing an object to a method passes the reference (Module 5); the method can call mutators on it and the caller sees the effect.

## `this`

Inside an instance method, `this` is the reference to the object the method was called on. It is implicit — `balanceCents += cents` means `this.balanceCents += cents` — and explicit when needed:

- to disambiguate a field from a parameter of the same name (`this.owner = owner`);
- to pass the current object to another method (`registry.add(this)`);
- to return the current object for chaining (`return this;`);
- to call another constructor (`this(...)`, next lesson).

`this` does not exist in static methods, which is why they cannot touch instance fields.

## Fields versus local variables

| | Field | Local |
| --- | --- | --- |
| Declared | in the class body | in a method |
| Lives | inside each object (or the class, if static) | in the stack frame |
| Default | 0 / false / null | none — must assign before use |
| Lifetime | the object's | the block's |
| Access | any method of the class (and others, per modifier) | the block |

The single most common design error is making something a field that should be a local: a loop counter or a temporary result stored in the object, leaking between calls. A field is for state that must *persist between method calls* and *belongs to the object*.

## Instance methods and the receiver

`a.deposit(500)` — `a` is the **receiver**. The JVM passes it as a hidden first argument; inside, it is `this`. Two different accounts with the same code behave differently because their state differs. This is the essence of objects: **behaviour parameterised by state**. Compare the procedural version `deposit(account, 500)` — same idea, but the language now enforces that `deposit` belongs to accounts and can protect their fields.

## Multiple classes in one program

A program is many classes; each `.java` file holds one public class (plus optional package-private ones), and `main` lives in whichever class starts things:

```java
public class Main {
    public static void main(String[] args) {
        BankAccount acct = new BankAccount("Ada");
        acct.deposit(1000);
        System.out.println(acct.owner() + ": " + acct.balance());
    }
}
```

The exercises in this track put helper classes in the same file as `Main` without `public`; in a project they go in their own files and packages.

## The object model, drawn

```
stack (main's frame)             heap
┌──────────────┐                 ┌─────────────────────┐
│ acct ───────────────────────▶  │ BankAccount         │
│ x = 5        │                 │  owner ─────▶ "Ada" │
└──────────────┘                 │  balanceCents = 1000│
                                 └─────────────────────┘
```

Locals on the stack, objects on the heap, strings also objects on the heap, arrows for references. Every question about aliasing, `==`, null and pass-by-value is answered by drawing this.

## Objects everywhere you already used them

`"hello"` is a `String` object; `new Scanner(System.in)` is an object with a buffer as its state and `nextInt` as behaviour; `new StringBuilder()` is an object whose `append` mutates its state; arrays are objects. You have been calling instance methods on receivers since lesson one. What changes now is that you *write* the classes.

## Naming and shape

A class is a noun (`BankAccount`, `HttpRequest`, `Matrix`); its methods are verbs or queries. Fields are `private` by default (next lessons); one concept per class; a class that needs "and" in its description wants splitting. Keep classes small enough that the state they hold can be kept consistent — that is what the next four lessons are about.

## Interview angle

- *"Difference between a class and an object?"* Blueprint vs instance; a class is a type, an object is a value of it on the heap.
- *"What does `new` do?"* Allocates and zero-initialises the fields, runs the constructor, returns a reference.
- *"What is `this`?"* The receiver of the current instance method.
- *"Why can't a static method use `this`?"* It is not called on an object.

## Key takeaways

- A class declares fields (state) and methods (behaviour); `new` creates an object with its own fields on the heap.
- Variables hold references; `==` compares references; `null` is "no object"; aliases share one object.
- `this` is the receiver; instance methods read and write the receiver's fields.
- Fields persist and default; locals are per-call and must be assigned. Keep temporaries local.

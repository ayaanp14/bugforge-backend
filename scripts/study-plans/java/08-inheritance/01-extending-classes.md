---
title: Extending classes — super, constructors and what is inherited
minutes: 14
---
Inheritance lets a class be defined as a *variation* of another: a `SavingsAccount` **is an** `Account` with interest added. The subclass gets the parent's fields and methods, may add more, and may replace some. Java has single inheritance of classes (one parent), a root class every class descends from (`Object`), and precise rules about constructors that trip up most people the first time. This lesson is the mechanics; the next ones are what you can do with them.

## `extends`

```java
public class Account {
    protected long balanceCents;            // visible to subclasses
    private final String owner;             // NOT visible to subclasses directly

    public Account(String owner) { this.owner = owner; }
    public void deposit(long c) { balanceCents += c; }
    public long balance()       { return balanceCents; }
    public String owner()       { return owner; }
}

public class SavingsAccount extends Account {
    private final double rate;

    public SavingsAccount(String owner, double rate) {
        super(owner);                       // MUST call a parent constructor first
        this.rate = rate;
    }

    public void addInterest() {
        balanceCents += Math.round(balanceCents * rate);   // protected field of the parent
    }
}
```

`SavingsAccount` has everything `Account` has — `deposit`, `balance`, `owner`, the fields — plus `rate` and `addInterest`. Code that works with an `Account` works with a `SavingsAccount` (next lessons on polymorphism). The relationship is **is-a**: every savings account is an account. If you cannot say "X is a Y" truthfully, do not use `extends` (lesson 6).

## What is inherited

- All `public` and `protected` members, and package-private members if the subclass is in the same package.
- `private` members are **present** in the object (the memory is there — `owner` exists inside every `SavingsAccount`) but **not accessible** by name; reach them through the parent's public/protected methods.
- Static members are inherited in the sense that `SavingsAccount.someStatic()` resolves, but they are not overridden (Module 7).
- **Constructors are not inherited.** Each class declares its own.

## Constructors and `super(...)`

Every constructor begins by calling a parent constructor — explicitly with `super(args)` as its **first statement**, or implicitly with `super()` if you write nothing. The chain runs up to `Object`, and the parent's body finishes before the child's initialisers begin (the order from Module 7):

```
new SavingsAccount("Ada", 0.02)
  → SavingsAccount constructor starts → super("Ada")
    → Account constructor starts → (implicit) super() → Object()
    → Account field initialisers, Account body: owner = "Ada"
  → SavingsAccount field initialisers, body: rate = 0.02
```

Consequences:

- If the parent has **no no-arg constructor**, every subclass constructor must call `super(...)` with arguments explicitly, or it will not compile ("constructor Account in class Account cannot be applied to given types").
- If you declare no constructor in the subclass, the default one calls `super()` — which fails to compile for the same reason when the parent lacks a no-arg constructor.
- `this(...)` and `super(...)` cannot both appear; a constructor that delegates with `this(...)` relies on the target to call `super`.

## `super.method()`

`super` also reaches the parent's version of a method the subclass has overridden:

```java
@Override
public void deposit(long c) {
    super.deposit(c);                       // do what Account does…
    log("deposited " + c);                  // …then more
}
```

`super.` is not a reference to a separate object — there is one object; `super.deposit` simply selects the parent's implementation. It cannot be chained (`super.super.x` is illegal).

## `protected`

A parent field or method marked `protected` is accessible in subclasses (and in the same package). It is the parent saying "this is part of my extension interface". Use it sparingly: a protected field is a field two classes may mutate, which weakens the parent's invariants. Prefer `private` fields with protected *methods* when subclasses need controlled access.

## The `Object` root

A class with no `extends` implicitly extends `java.lang.Object`. So every class inherits `toString`, `equals`, `hashCode`, `getClass`, `wait`/`notify` (Module 17) and `clone`/`finalize` (deprecated). Lesson 4 is about the ones you override.

## Single inheritance, and why

A Java class extends **one** class. Multiple inheritance of implementation (C++) creates the "diamond problem" — two parents defining the same method — and complicates object layout. Java gives multiple inheritance of *type* through interfaces (Module 9), which since Java 8 may carry default methods with explicit conflict rules. The class chain stays a simple line: `SavingsAccount → Account → Object`.

## `final` stops the chain

`public final class String` cannot be extended; `public final void deposit(long c)` cannot be overridden. Use `final` on classes designed as values (immutability needs it — Module 7) and on methods that subclasses must not alter (a template's fixed steps, security checks). The JIT does not need `final` to optimise; the reason is design, not speed.

## Inheritance and access to the parent's state

A subclass that needs to change the parent's private state does so through the parent's methods. If that feels restrictive, the parent's API is missing an operation, or inheritance is the wrong tool. Reaching in via a protected field is the quick fix that becomes the maintenance problem.

## A worked example

```java
public class Employee {
    private final String name;
    protected final long baseSalary;
    public Employee(String name, long baseSalary) { this.name = name; this.baseSalary = baseSalary; }
    public long pay() { return baseSalary; }
    public String name() { return name; }
}

public class Manager extends Employee {
    private final long bonus;
    public Manager(String name, long baseSalary, long bonus) { super(name, baseSalary); this.bonus = bonus; }
    @Override public long pay() { return super.pay() + bonus; }
}
```

`Manager` reuses construction and `name()` from `Employee`, extends `pay()`, and can be used wherever an `Employee` is expected — the subject of lesson 3.

## Interview angle

- *"What does a subclass inherit?"* Public/protected (and package) members; private ones exist but are inaccessible; constructors are not inherited.
- *"What is the first statement of every constructor?"* A `super(...)` or `this(...)` call, implicit `super()` if absent.
- *"Why does `class B extends A {}` fail when `A` has only `A(int)`?"* The implicit `super()` has no matching constructor.
- *"Does Java support multiple inheritance?"* Of classes, no; of interface types, yes.

## Key takeaways

- `extends` gives is-a: the subclass has the parent's accessible members plus its own.
- Constructors chain to `super(...)` first; a parent without a no-arg constructor forces explicit calls.
- `private` parent members exist in the object but are reached only through parent methods; `protected` opens them to subclasses and the package.
- Every class descends from `Object`; `final` ends the line; one class parent only.

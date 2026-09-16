---
title: Polymorphism, casting and instanceof
minutes: 14
---
Polymorphism — "many forms" — is the ability to treat a `SavingsAccount`, a `CheckingAccount` and a `BusinessAccount` all as `Account` and have each respond in its own way. It is the feature that makes object-oriented code extensible without modification: new subclasses plug into old code. This lesson covers how it works at run time (dynamic dispatch), how references move between types (up- and down-casting), and the modern `instanceof` pattern that replaced the cast-after-check idiom.

## Subtype polymorphism

```java
Account[] accounts = { new SavingsAccount("a", 0.02), new CheckingAccount("b"), new Account("c") };
for (Account acct : accounts) {
    acct.monthEnd();          // each object runs ITS class's monthEnd
}
```

A variable of type `Account` may hold any `Account` *or subclass instance*. Calling an overridden method on it runs the version belonging to the **object's actual class**, decided at run time. The loop does not know or care which kinds of account it holds — and a `PremiumAccount` written next year will work in it unchanged. That is the whole point.

## Dynamic dispatch

At the bytecode level a call like `acct.monthEnd()` is an `invokevirtual` instruction. The JVM looks at the object `acct` refers to, finds its class's *virtual method table*, and jumps to the entry for `monthEnd` — the most specific override in the object's class chain. This lookup happens on every call (the JIT makes it nearly free, and inlines it when only one implementation is ever seen). Static, private and final methods skip it — there is nothing to choose.

Two rules follow:

1. **The runtime class decides overrides**; the reference type decides *what you are allowed to call*. `Account acct = new SavingsAccount(…); acct.addInterest();` does not compile — `Account` has no `addInterest` — even though the object could do it.
2. **Fields and static methods are not dispatched** (previous lesson).

## Upcasting: always safe, usually implicit

```java
SavingsAccount s = new SavingsAccount("a", 0.02);
Account a = s;                     // upcast: a SavingsAccount IS an Account
Object o = s;                      // everything is an Object
```

Widening a reference to a supertype needs no cast and cannot fail: the object *is* that type. You lose access to subclass-specific members through the wider reference; you gain the ability to mix types in one collection or parameter.

## Downcasting: explicit, checked, can fail

```java
Account a = getAccount();
SavingsAccount s = (SavingsAccount) a;    // compiles; at run time the JVM CHECKS the object's class
s.addInterest();
```

If `a` actually refers to a `CheckingAccount`, the cast throws `ClassCastException: CheckingAccount cannot be cast to SavingsAccount`. The compiler allows the cast because it *might* be right; the JVM verifies it. Casting between unrelated classes (`(String) account`) is a compile error — the compiler can see it can never succeed.

A downcast is a signal: the code is asking "which kind are you?" — something polymorphism was supposed to make unnecessary. Frequent downcasts suggest a missing method on the supertype.

## `instanceof` and pattern matching

The traditional guard:

```java
if (a instanceof SavingsAccount) {
    SavingsAccount s = (SavingsAccount) a;      // safe: just checked
    s.addInterest();
}
```

Since Java 16 the check and the cast are one expression:

```java
if (a instanceof SavingsAccount s) {           // binds s if the test passes
    s.addInterest();
}
if (!(a instanceof SavingsAccount s)) return;  // s is in scope for the rest of the method
if (a instanceof SavingsAccount s && s.rate() > 0.01) { … }   // && may use s; || may not
```

`instanceof` is `false` for `null` — no NPE — and true for the class and any subclass. `obj instanceof Object` is true for any non-null object. Pattern variables are the modern idiom; Java 21's pattern switch extends it to whole type hierarchies (Module 19).

## `getClass()` versus `instanceof`

`a.getClass() == SavingsAccount.class` is true only for *exactly* that class, not subclasses. `instanceof` includes subclasses. In `equals` implementations the choice matters (next lesson); elsewhere, `instanceof` is almost always what you mean.

## Polymorphism versus `switch` on type

```java
// non-polymorphic: every new kind requires editing this method
double fee(Account a) {
    if (a instanceof SavingsAccount) return 0;
    if (a instanceof CheckingAccount) return 2;
    …
}
// polymorphic: each kind knows its fee
abstract double fee();      // in Account; overridden per subclass
```

The polymorphic version follows the **open/closed principle** — open to extension by adding subclasses, closed to modification of existing code. The `instanceof` chain is appropriate when the *operations* vary more than the *types* (a visitor over a fixed set of shapes), which is where sealed types and pattern switch shine.

## Arrays, generics and variance

`Account[] accounts = new SavingsAccount[3];` compiles (arrays are covariant) and `accounts[0] = new CheckingAccount(…)` throws `ArrayStoreException`. `List<Account> list = new ArrayList<SavingsAccount>();` does **not** compile — generics are invariant, on purpose, to catch that error at compile time (Module 13 introduces wildcards to relax it safely).

## Polymorphism through interfaces

Everything here applies equally to interface types (Module 9): `List<String> list = new ArrayList<>();` is polymorphism — `list.add` dispatches to `ArrayList`'s implementation, and swapping in a `LinkedList` changes nothing else. Programming to the interface type is the everyday face of polymorphism.

## Interview angle

- *"What is polymorphism?"* One reference type, many runtime behaviours via overriding; calls dispatch on the object's class.
- *"Compile-time vs run-time polymorphism?"* Overloading (static) vs overriding (dynamic).
- *"What happens on a bad downcast?"* `ClassCastException` at run time.
- *"`instanceof` with `null`?"* `false`.
- *"Why does `List<Animal> = new ArrayList<Dog>()` fail while `Animal[] = new Dog[1]` compiles?"* Generics are invariant for safety; arrays are covariant and checked at run time.

## Key takeaways

- A supertype reference can hold any subtype object; overridden methods dispatch on the object's runtime class.
- The reference type limits what you may call; the object decides what runs.
- Upcasts are implicit and safe; downcasts are explicit and checked — `ClassCastException` on failure.
- `instanceof Type var` tests and binds in one step, is false for null, and includes subclasses.
- Prefer overriding to `instanceof` chains when adding *types*; the reverse when adding *operations*.

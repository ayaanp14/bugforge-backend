---
title: Java is pass-by-value — always
minutes: 14
---
"Is Java pass-by-value or pass-by-reference?" is asked in almost every Java interview, and the confident wrong answer — "primitives by value, objects by reference" — is what separates candidates who have memorised from those who understand. Java is **strictly pass-by-value**. What is passed for an object is the value of the *reference*. This lesson makes that precise and shows the three situations where it matters.

## The rule

When you call a method, each argument expression is evaluated and its **value is copied** into the parameter. The parameter is a new local variable holding that copy.

- For a primitive, the value is the number/char/boolean itself.
- For a reference type, the value is the **reference** — the address of the object. The object is *not* copied; the *arrow pointing at it* is.

So the method gets its own arrow to the same object. Through that arrow it can **change the object's contents**. It cannot change **which object the caller's variable points to**.

## Case 1: primitives — the callee cannot affect the caller

```java
static void increment(int x) {
    x++;                     // changes the local copy
}
int n = 5;
increment(n);
System.out.println(n);       // 5
```

The method received a copy of 5. Nothing it does to `x` reaches `n`. To get a new value out, `return` it: `n = incremented(n);`.

## Case 2: objects — mutation is visible, reassignment is not

```java
static void fill(int[] arr) {
    arr[0] = 99;             // mutates the shared object — visible to the caller
    arr = new int[] {7};     // rebinds the LOCAL copy of the reference — invisible
}
int[] data = {1, 2, 3};
fill(data);
System.out.println(data[0]); // 99
System.out.println(data.length); // 3 — still the original array
```

Line 1 follows the arrow and changes the array both variables point to. Line 2 points the *parameter* at a new array; `data` still points at the old one. This single example contains the whole story. If you can explain why `99` and why `3`, you understand Java's parameter passing.

The same applies to any object: a `StringBuilder` appended to inside a method shows the change; a `StringBuilder` parameter *reassigned* to a new one does not.

## Case 3: strings and other immutables — nothing the callee does shows

```java
static void shout(String s) {
    s = s.toUpperCase();     // new String, assigned to the local; caller unaffected
}
String name = "ada";
shout(name);
System.out.println(name);    // ada
```

Strings are immutable, so there is no "mutate the object" option; the only thing the method can do is rebind its local, which is invisible. This is why "strings are passed by value" *feels* different from arrays — but the mechanism is identical; the difference is that `String` has no mutating methods.

## The swap that cannot work

```java
static void swap(int a, int b) { int t = a; a = b; b = t; }   // swaps two locals; caller sees nothing
static void swap(Integer a, Integer b) { … }                  // same: Integer is immutable and the refs are copies
```

You cannot write a `swap` method for two variables in Java. You *can* swap two **elements of an array** (`swap(arr, i, j)`) or two **fields of an object**, because those are mutations through a shared reference. Interviewers ask this precisely because C++ programmers expect `&` references to exist.

## `this` and fields are the escape hatch

A method that must "change the caller's variable" is usually a sign the value belongs in an object:

```java
class Wallet { int balance; }
static void deposit(Wallet w, int amount) { w.balance += amount; }   // visible: mutation through the reference
```

Or return the new value. Or, for several outputs, return a small object/record. Never a one-element array as an "out parameter" — it works, and reviewers hate it.

## Why Java chose this

C++ offers both value and reference passing and it is a permanent source of bugs (aliasing, dangling references). Java's designers took C's model — everything by value — and, because objects are always accessed through references, mutation-through-reference gives most of the benefit of reference passing with none of the surprises. The one thing you lose is the ability to rebind a caller's variable, and that is a feature.

## A mental model that never fails

Draw two columns: *variables* (boxes holding either a number or an arrow) and *objects* (blobs on the heap). Calling a method copies the box's contents into a new box. If the contents is an arrow, both boxes point at the same blob. `arr[0] = 99` scribbles on the blob. `arr = new int[]{7}` redraws the arrow in the *new* box. The caller's box is untouched in both cases; the blob is shared in the first.

## Related gotchas

- **Returning a reference to internal state** lets callers mutate your object: `getItems()` returning the actual `List` field. Return a copy or an unmodifiable view (Module 14).
- **Passing a mutable object to a method you do not control** means it might change it. Defensive copies at boundaries (Module 7).
- **Autoboxed parameters** are copies of references to immutable wrappers — nothing the callee does shows.

## Interview angle

- *"Pass by value or by reference?"* By value, always; for objects the value is the reference.
- *"Can a method change the object an argument refers to?"* Its contents, yes; the caller's variable, no.
- *"Can you write `swap(int, int)`?"* No. Swap array elements or object fields instead.
- *"`void f(String s) { s = "x"; }` — does the caller see it?"* No; the local reference was rebound.

## Key takeaways

- Arguments are copied; for objects, the *reference* is copied, so both sides share one object.
- Mutating through the reference is visible to the caller; reassigning the parameter is not.
- Immutable arguments (strings, wrappers) can never be changed by a callee.
- No `swap(a, b)` of variables — return values or mutate a shared container.

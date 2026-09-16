---
title: Type erasure and its consequences
minutes: 14
---
Everything the compiler knows about `List<String>` it forgets before the class file is written. That decision — **erasure** — is why Java generics are backward compatible, and why a whole list of natural-looking things are impossible: `new T()`, `T[]`, `instanceof List<String>`, overloading on type arguments, a static field of type `T`. This lesson explains what erasure does, walks through each limitation with the reason, and covers the two artefacts it leaves behind — bridge methods and heap pollution.

## What erasure does

The compiler:

1. **Checks** every generic use for type correctness.
2. **Replaces** each type parameter by its erasure: `Object` for an unbounded `T`, the first bound for a bounded one (`<T extends Number>` → `Number`).
3. **Inserts casts** where generic code returns a `T` to typed code: `String s = list.get(0)` becomes `String s = (String) list.get(0)`.
4. **Generates bridge methods** where erasure would break overriding (below).

After that, `List<String>`, `List<Integer>` and raw `List` are the same class at run time. A JVM from 2004 can run today's generic code.

```java
new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()      // true
List<String> a = …; a.getClass().getName()                                     // "java.util.ArrayList" — no <String>
```

Contrast C#, whose generics are *reified*: `List<string>` and `List<int>` are distinct run-time types. Java chose compatibility; the limitations below are the cost.

## What you cannot do, and why

**1. Instantiate a type parameter**

```java
T t = new T();               // error: unexpected type
```

`T` is `Object` at run time; there is no class to instantiate. Fix: pass a `Supplier<T>` (`factory.get()`) or a `Class<T>` token (`clazz.getDeclaredConstructor().newInstance()`).

**2. Create a generic array**

```java
T[] arr = new T[10];                    // error: generic array creation
List<String>[] lists = new List<String>[3];   // error too
```

Arrays check their element type at run time (`ArrayStoreException`); a `T[]` would have no type to check against. Fix: `(T[]) new Object[10]` with a contained `@SuppressWarnings("unchecked")` (what `ArrayList` does), or `Array.newInstance(clazz, 10)` with a class token, or use a `List<T>`.

**3. Test a type argument at run time**

```java
if (obj instanceof List<String>) …      // error: illegal generic type for instanceof
if (obj instanceof List<?>) …           // fine — the raw class is all that exists
List<String> l = (List<String>) obj;    // compiles with an UNCHECKED warning: the cast checks only "is it a List"
```

The JVM cannot see the `String`; the cast is a promise, not a check. If the promise is wrong, the `ClassCastException` appears later, at the first `String s = l.get(0)`.

**4. Use a type parameter in a static context**

```java
class Box<T> { static T shared; }       // error
```

One class serves every `T`; a static field would have to be all of them at once.

**5. Overload on type arguments**

```java
void process(List<String> xs) { }
void process(List<Integer> xs) { }      // error: name clash — both erase to process(List)
```

Same erasure, same signature. Different method names, or one generic method.

**6. Catch or throw a generic exception**

```java
class MyException<T> extends Exception { }     // error: a generic class may not extend Throwable
```

`catch` clauses are resolved by run-time class; a parameterised exception could not be distinguished.

**7. Primitives as type arguments** — `List<int>`: nothing to erase to. Wrappers.

## Bridge methods

```java
class Node<T> { T value; void set(T v) { value = v; } }
class IntNode extends Node<Integer> {
    @Override void set(Integer v) { … }         // overrides set(T)? After erasure the parent has set(Object)
}
```

`set(Integer)` does not have the same erased signature as `set(Object)`, so the compiler generates a hidden **bridge** `set(Object v) { set((Integer) v); }` in `IntNode` so overriding works through the erased parent. You see bridges in stack traces and reflection (`Method.isBridge()`); you never write them. They are also why a `ClassCastException` can appear *inside* a bridge when heap pollution (next) delivers the wrong type.

## Heap pollution

A variable of a parameterised type refers to an object that is not of that type:

```java
List<String> strings = new ArrayList<>();
List raw = strings;
raw.add(42);                               // warning: unchecked call — the String list now holds an Integer
String s = strings.get(0);                 // ClassCastException here, with no cast visible in the source
```

Raw types, unchecked casts and generic varargs are the three ways to cause it. Every "unchecked" warning marks a place where erasure lets a lie through; treat them as errors, and confine the unavoidable ones (`(T[]) new Object[n]`) to the smallest scope with `@SuppressWarnings("unchecked")` and a comment.

## Reifiable types

A type whose full information survives erasure is **reifiable**: primitives, non-generic classes, raw types, `List<?>` (unbounded wildcard), arrays of reifiable types. Only reifiable types may appear in `instanceof`, array creation and `catch`. Everything with a concrete type argument is non-reifiable.

## Type tokens: carrying the type at run time

```java
static <T> T fromJson(String json, Class<T> type) { … type.cast(parsed) … }
User u = fromJson(text, User.class);

static <T> T[] newArray(Class<T> type, int n) { return (T[]) Array.newInstance(type, n); }
```

A `Class<T>` parameter reintroduces the type at run time: it can create instances, arrays, and checked casts (`type.cast(obj)` throws a *real* `ClassCastException` immediately). Libraries that need `List<User>` (not just `User`) use a *super type token* — an anonymous subclass of a generic class whose superclass type argument is retained by reflection (`new TypeReference<List<User>>() {}` in Jackson) — the one place generic information does survive.

## Reflection and generic signatures

Erasure removes type arguments from *bytecode instructions*, but declarations keep a `Signature` attribute: `Field.getGenericType()` returns `List<String>` for a field declared that way, and `Class.getGenericSuperclass()` is what super type tokens read. Declarations remember; values do not.

## Interview angle

- *"What is type erasure?"* The compiler replaces type parameters with their bounds and inserts casts; the JVM sees raw types.
- *"Why can't you write `new T()`?"* At run time `T` is `Object`; there is no class to construct. Use a `Supplier<T>` or `Class<T>`.
- *"Why can't you overload `f(List<String>)` and `f(List<Integer>)`?"* Both erase to `f(List)`.
- *"What is a bridge method?"* A compiler-generated method that lets an override with a specialised signature satisfy the erased parent signature.
- *"What is heap pollution?"* A parameterised variable holding an object of the wrong type argument, via raw types or unchecked casts.

## Key takeaways

- Erasure: check at compile time, erase to `Object`/bound, insert casts. `List<String>` is `List` at run time.
- Consequences: no `new T()`, no `T[]`, no `instanceof List<String>`, no static `T`, no overloading on type arguments, no generic exceptions, no primitives.
- Bridge methods keep overriding working; heap pollution is the lie unchecked warnings point at.
- Class tokens (`Class<T>`) and super type tokens carry type information into run time when you need it.

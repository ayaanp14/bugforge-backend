---
title: Anatomy of a Java program
minutes: 15
---
Before writing anything substantial you need the vocabulary the rest of the track uses: what a class, a member, a statement and an expression are, how comments and identifiers work, and the conventions every Java codebase follows. None of it is hard; all of it is assumed from here on.

## The units: class → members → statements

```java
public class BankAccount {                    // a class: a type and a unit of code

    private String owner;                     // field: state each object carries
    private long balanceCents;                // field

    public BankAccount(String owner) {        // constructor: how an object is built
        this.owner = owner;
        this.balanceCents = 0;
    }

    public void deposit(long cents) {         // method: behaviour
        if (cents <= 0) {                     // statement (an if)
            throw new IllegalArgumentException("deposit must be positive");
        }
        balanceCents += cents;                // statement (an expression statement)
    }

    public long balance() {                   // method with a return value
        return balanceCents;
    }
}
```

A **class** is a blueprint for objects and a container for code. Its **members** are fields (state), methods (behaviour), constructors (initialisation), and nested types. Methods and constructors contain **statements**; statements contain **expressions**.

An **expression** produces a value: `cents <= 0`, `balanceCents + cents`, `new BankAccount("Ada")`, `account.balance()`. A **statement** does something: a declaration (`int x = 5;`), an assignment, a method call, a control-flow construct (`if`, `for`, `while`, `return`, `throw`). Java lets only certain expressions stand alone as statements — assignments, increments, method calls, object creation. `x + 1;` on its own is a compile error ("not a statement"), which catches a surprising number of typos.

## The entry point

```java
public static void main(String[] args)
```

Every word is required and the launcher checks all of them: `public` (reachable from outside), `static` (callable with no object), `void` (returns nothing), the name `main`, and one parameter of type `String[]` (`String... args` is also accepted; the name `args` is convention). A class may have other overloads of `main`; only this signature is the entry point. A program can have many classes with a `main` — you choose which to launch.

## Comments and documentation

```java
// single line

/* block
   comment */

/**
 * Documentation comment: read by javadoc and by your IDE's tooltips.
 * @param cents amount in the smallest unit; must be positive
 * @throws IllegalArgumentException if cents is not positive
 */
public void deposit(long cents) { … }
```

Javadoc comments on public APIs are a professional habit; the tags (`@param`, `@return`, `@throws`, `@since`, `@deprecated`) are what tooling understands.

## Identifiers and keywords

An identifier starts with a letter, `_` or `$` and continues with letters, digits, `_`, `$`. Unicode letters are allowed (`int größe`), but stick to ASCII in shared code. Case-sensitive. Fifty-odd **keywords** are reserved (`class`, `int`, `if`, `static`, `new`, `this`, `return`, `final` …) plus the literals `true`, `false`, `null`. Since Java 10 `var` is a *reserved type name*, not a keyword — you can still name a variable `var`, though you should not.

## Naming conventions (not enforced, always expected)

| Thing | Convention | Example |
| --- | --- | --- |
| Class, interface, enum, record | UpperCamelCase, a noun | `BankAccount`, `HttpClient` |
| Method | lowerCamelCase, a verb | `deposit`, `isEmpty`, `toString` |
| Variable, field, parameter | lowerCamelCase | `balanceCents`, `i` |
| Constant (`static final`) | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Package | all lowercase, reverse domain | `com.example.billing` |
| Type parameter | single capital | `T`, `K`, `V`, `E` |

Reviewers, linters and interviewers all notice violations. `Boolean` prefixes are `is`/`has`/`can`; getters are `getX()` and setters `setX(v)` (the JavaBeans convention that frameworks rely on through reflection).

## Statements you will use on day one

```java
int count = 0;                       // local variable declaration with initialiser
count = count + 1;                   // assignment
count++;                             // increment (an expression statement)
System.out.println(count);           // method call
if (count > 3) { … } else { … }      // conditional
for (int i = 0; i < 10; i++) { … }   // loop
return count;                        // leave the method with a value
```

Blocks `{ … }` group statements and open a **scope**: a variable declared inside a block does not exist outside it, and you cannot redeclare a name that is already visible in an enclosing scope of the same method (`int i` inside a loop when an `int i` exists outside → compile error). Module 5 goes deeper.

## Literals

The compiler recognises literal values directly in source:

```java
42            // int
42L           // long
3.14          // double
3.14f         // float
'A'           // char (single quotes, exactly one character)
"text"        // String (double quotes)
true          // boolean
null          // the absence of a reference
0x1F  0b1010  1_000_000   // hex, binary, digit separators
```

The distinction between `'A'` (a `char`, a number) and `"A"` (a `String`, an object) trips up beginners for weeks. Module 3 covers it in depth.

## The two kinds of type

Every value in Java is either a **primitive** (`byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean` — eight, no more, ever) or a **reference** to an object (any class, interface, array, enum, record). Primitives hold their value directly; reference variables hold an address. `int x = 5; int y = x;` copies the number. `BankAccount a = new BankAccount("Ada"); BankAccount b = a;` copies the *address* — `a` and `b` are the same object, and `b.deposit(100)` changes what `a.balance()` returns.

If a single idea in this module deserves a slow reread, it is that paragraph.

## `System.out.println` and friends

`System` is a final class in `java.lang`. `out` is a `public static final PrintStream` — standard output. `println(x)` prints `x` and a newline; `print(x)` prints without; `printf(format, args…)` formats like C's printf (`%d`, `%s`, `%.2f`, `%n` for a platform newline). `System.err` is standard error; `System.in` is standard input, which the last lesson of this module reads from.

`println` is overloaded for every primitive and for `Object`. Passing an object calls its `toString()`; the default one prints `ClassName@hexhash`, which is why you override it (Module 8).

## Common first-week compile errors, decoded

| Message | Cause |
| --- | --- |
| `cannot find symbol` | Misspelled name, wrong case, missing import, or declared in a scope you cannot see |
| `';' expected` | Missing semicolon on the previous line |
| `incompatible types: possible lossy conversion from double to int` | Narrowing without a cast (Module 2) |
| `variable x might not have been initialized` | A local was read before every path assigned it |
| `missing return statement` | A non-void method has a path that reaches the end |
| `class X is public, should be declared in a file named X.java` | File/class name mismatch |
| `non-static method cannot be referenced from a static context` | Calling an instance method from `main` without an object (Module 7) |

## Key takeaways

- A program is classes → members (fields, methods, constructors) → statements → expressions.
- `public static void main(String[] args)` is the entry point, every word checked.
- Primitives hold values; reference variables hold addresses — copying one copies the address.
- Follow the naming conventions; they are the dialect of professional Java.

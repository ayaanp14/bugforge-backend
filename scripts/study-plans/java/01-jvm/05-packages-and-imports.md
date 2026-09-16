---
title: Packages, imports and the class library
minutes: 13
---
A Java program of any size is hundreds of classes, and the standard library alone has thousands. Packages are how those names are kept from colliding, how code is organised on disk, and — through the `import` statement — how you reach them without typing their full names every time.

## What a package is

A **package** is a namespace. The class `java.util.ArrayList` is the class `ArrayList` in the package `java.util`; `java.awt.List` and `java.util.List` are different classes that happen to share a simple name. The **fully qualified name** is always unambiguous.

Declaring one is the first line of a file:

```java
package com.example.billing;

public class Invoice { … }
```

The convention is your organisation's domain name reversed, then a project, then a subsystem: `com.example.billing`, `org.apache.commons.lang3`. Lowercase throughout. A class with no `package` line is in the *unnamed package*, which is fine for one-file experiments and forbidden from being imported by anything in a named package — real code always names its package.

## Packages are directories

The compiler and the JVM map a package to a directory path: `com.example.billing.Invoice` must be found at `com/example/billing/Invoice.class` relative to some classpath root. So the source normally lives at `src/com/example/billing/Invoice.java`, you compile with `javac -d out src/com/example/billing/Invoice.java`, and run with `java -cp out com.example.billing.Invoice`. Build tools hide this, but the layout is why every Java project has the deep `src/main/java/com/company/...` tree.

## Imports

```java
package com.example.billing;

import java.util.ArrayList;           // one class
import java.util.List;
import java.time.LocalDate;
import java.util.*;                   // every class in java.util (not sub-packages)
import static java.lang.Math.max;     // a static member, usable as max(a, b)
import static java.lang.Math.*;       // every static member of Math

public class Invoice {
    private final List<String> lines = new ArrayList<>();
    private final LocalDate issued = LocalDate.now();
}
```

An import does **not** load or copy anything. It is a compile-time instruction: "when I write `List`, I mean `java.util.List`". The bytecode always contains fully qualified names. This is why "importing too much" costs nothing at run time — the only cost of `import java.util.*;` is readability and the risk of an ambiguity (`java.util.*` and `java.awt.*` both provide `List`, and using `List` then fails to compile until you name one explicitly).

Rules:

- `java.lang` is imported implicitly — `String`, `Object`, `Math`, `System`, `Integer`, `Thread`, `Exception` need no import.
- Classes in the **same package** need no import.
- A wildcard import covers the package's classes, **not** its sub-packages: `java.util.*` does not give you `java.util.concurrent.ConcurrentHashMap`.
- A single-type import wins over a wildcard: `import java.util.List;` beside `import java.awt.*;` makes `List` mean `java.util.List`.
- You can always write the fully qualified name inline instead of importing: `java.util.List<String> xs = …`.

Static imports bring in static members so `Math.max(a, b)` becomes `max(a, b)`. Use them for things read as vocabulary — `assertEquals` in tests, `Collectors.toList()` in stream-heavy code — and nowhere else; over-used, they hide where a name comes from.

## Access and packages

Packages are also an **access boundary**. A member with no access modifier (*package-private*) is visible only inside its package; `protected` adds subclasses in other packages. That is why `com.example.billing.internal` style packages exist: classes meant only for the subsystem are package-private or live in a package nobody else imports. Module 7 covers the four levels in detail.

## The library you will actually use

The class library is organised into packages that map onto the modules of this track:

| Package | Holds | Module |
| --- | --- | --- |
| `java.lang` | `Object`, `String`, `StringBuilder`, `Math`, wrappers, `Thread`, `Exception` | 2, 3, 12, 17 |
| `java.util` | Collections (`List`, `Map`, `Set`…), `Optional`, `Scanner`, `Random`, `Arrays`, `Collections` | 6, 14, 15 |
| `java.util.function` | `Function`, `Predicate`, `Supplier`, `Consumer` … | 11 |
| `java.util.stream` | `Stream`, `IntStream`, `Collectors` | 15 |
| `java.util.concurrent` | Executors, futures, concurrent collections, atomics, locks | 17 |
| `java.io` / `java.nio.file` | Streams, readers, `Files`, `Path` | 18 |
| `java.time` | `LocalDate`, `Instant`, `Duration`, formatting | 19 |
| `java.math` | `BigInteger`, `BigDecimal` | 2 |
| `java.net` / `java.net.http` | URLs, sockets, the HTTP client | 19 |

Since Java 9 the library is further grouped into **modules** (`java.base`, `java.sql`, `java.net.http` …). `java.base` contains everything above except SQL and HTTP and is always present. You can ignore the module system entirely until Module 19; the classpath still works exactly as it did.

## Reading the documentation

The Javadoc for the JDK is the single most valuable resource in Java. Every class page has: the package, the inheritance chain, the interfaces implemented, a description, then fields, constructors and methods with their signatures. Get in the habit of reading `java.lang.String`'s page end to end once; the number of methods you did not know existed is the point.

An IDE gives you the same information on hover and on `Ctrl+Click`. The runner in this course does not, so keep the docs open in a tab.

## Common errors

- **`package com.example does not exist`** — the classpath does not contain the directory root above `com/`. Run from the right directory or fix `-cp`.
- **`cannot find symbol: class ArrayList`** — missing `import java.util.ArrayList;` (or `java.util.*`).
- **`reference to List is ambiguous`** — two wildcard imports provide `List`; add a single-type import for the one you want.
- **Class in the default package cannot be imported** — move it into a named package.

## Key takeaways

- A package is a namespace and a directory; the fully qualified name is always unambiguous.
- `import` is a compile-time alias, free at run time; `java.lang` and the current package need none.
- Wildcards do not cover sub-packages; single-type imports beat wildcards.
- Packages are an access boundary: package-private is "inside this package only".

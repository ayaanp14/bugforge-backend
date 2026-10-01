---
skill: java
level: intermediate
---

## java-intermediate-001
topic: collections
answer: B
run: java

What does this program print?

```java
import java.util.*;

class Point {
    final int x, y;

    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public int hashCode() { return 31 * x + y; }

    public boolean equals(Point other) { return x == other.x && y == other.y; }
}

public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        Set<Point> set = new HashSet<>();
        set.add(a);
        set.add(b);
        System.out.println(a.equals(b) + " " + set.size());
    }
}
```

- A: `true 1`
- B: `true 2`
- C: `false 2`
- D: `false 1`

> `equals(Point)` overloads `equals(Object)`; it does not override it. The
> direct call `a.equals(b)` is resolved from the static type `Point`, so it
> picks the overload and returns true. `HashSet` calls `equals(Object)`, which
> is still `Object`'s identity check: the two points land in the same bucket
> (same hash code) but are not "equal", so both are kept. The fix is
> `@Override public boolean equals(Object o)`.

## java-intermediate-002
topic: collections
answer: C
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> m = new TreeMap<>();
        m.put("banana", 1);
        m.put("apple", 2);
        m.put("Cherry", 3);
        m.put("10", 4);
        m.put("9", 5);
        System.out.println(m.keySet());
    }
}
```

- A: `[9, 10, Cherry, apple, banana]`
- B: `[10, 9, apple, banana, Cherry]`
- C: `[10, 9, Cherry, apple, banana]`
- D: `[banana, apple, Cherry, 10, 9]`

> A `TreeMap` iterates in key order, and `String`'s natural order compares
> character codes one by one: digits (48–57) come before upper case (65–90),
> which comes before lower case (97–122). `"10"` sorts before `"9"` because
> `'1'` < `'9'` at the first character — strings are not compared as numbers.

## java-intermediate-003
topic: collections
answer: B, D

`list` starts as `new ArrayList<>(List.of("a", "b", "b", "c"))`. Which of these snippets leave `list` as `[a, c]` without throwing? Select all that apply.

- A: `for (String s : list) { if (s.equals("b")) list.remove(s); }`
- B: `list.removeIf(s -> s.equals("b"));`
- C: `for (int i = 0; i < list.size(); i++) { if (list.get(i).equals("b")) list.remove(i); }`
- D: `Iterator<String> it = list.iterator(); while (it.hasNext()) { if (it.next().equals("b")) it.remove(); }`

> The for-each loop runs on the list's iterator; removing through `list`
> itself changes `modCount`, and the iterator's next `next()` throws
> `ConcurrentModificationException`. The index loop does not throw, but after
> removing index 1 the second "b" slides into index 1 and `i` moves on to 2,
> so one "b" survives (`[a, b, c]`). `removeIf` and `Iterator.remove()` are the
> supported ways to remove while iterating.

## java-intermediate-004
topic: collections
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> m = new HashMap<>();
        Integer a = m.put("k", 1);
        Integer b = m.put("k", 2);
        Integer c = m.putIfAbsent("k", 3);
        Integer d = m.computeIfAbsent("k", key -> 4);
        System.out.println(a + " " + b + " " + c + " " + d);
    }
}
```

- A: `1 2 2 2`
- B: `null 1 2 null`
- C: `null 1 3 4`
- D: `null 1 2 2`

> `put` returns the value it replaced: `null` the first time, then `1`.
> `putIfAbsent` leaves an existing mapping alone and returns the current value,
> `2`. `computeIfAbsent` also finds the key present, does not call the
> function, and returns the current value, `2`.

## java-intermediate-005
topic: generics
answer: A

`copy` must accept both calls below, and its body is `for (T item : src) dst.add(item);`. Which declaration compiles with that body and accepts both calls?

```java
List<Integer> ints = List.of(1, 2);
List<Number> nums = new ArrayList<>();
List<Object> objs = new ArrayList<>();
copy(ints, nums);
copy(ints, objs);
```

- A: `static <T> void copy(List<? extends T> src, List<? super T> dst)`
- B: `static <T> void copy(List<T> src, List<T> dst)`
- C: `static <T> void copy(List<? super T> src, List<? extends T> dst)`
- D: `static <T> void copy(List<? extends T> src, List<? extends T> dst)`

> Producer extends, consumer super. With `T = Integer`, `src` reads values that
> are at least `T`, and `dst` accepts `T` into a list of `Number` or `Object`.
> B is invariant: `ints` forces `T = Integer` and `nums` forces `T = Number`, so
> no `T` fits. C and D make `dst` a `? extends T` list, which cannot accept
> `add(item)`; C also cannot read `src` elements as `T`.

## java-intermediate-006
topic: generics
answer: B
run: java

What does this program print?

```java
public class Main {
    static String describe(Object o) { return "object"; }

    static String describe(String s) { return "string"; }

    static <T> String viaGeneric(T value) { return describe(value); }

    public static void main(String[] args) {
        System.out.println(describe("hi") + " " + viaGeneric("hi"));
    }
}
```

- A: `string string`
- B: `string object`
- C: `object object`
- D: `object string`

> Overloads are chosen at compile time from the argument's static type. Inside
> `viaGeneric`, `value` has type `T`, whose only bound is `Object`, so the call
> is compiled once as `describe(Object)` for every `T`. Type arguments are
> erased and play no part at run time; only overriding is dynamic.

## java-intermediate-007
topic: functional
answer: D
run: java

What does this program print?

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        StringBuilder log = new StringBuilder();
        Optional<Integer> first = Stream.of(1, 2, 3, 4)
            .filter(x -> { log.append("f").append(x); return x % 2 == 0; })
            .map(x -> { log.append("m").append(x); return x * 10; })
            .findFirst();
        System.out.println(log + " " + first.get());
    }
}
```

- A: `f1f2f3f4m2m4 20`
- B: `f1f2m2f3f4m4 20`
- C: `f1f2f3f4m2 20`
- D: `f1f2m2 20`

> Streams are lazy and process one element at a time through the whole
> pipeline, not one stage at a time. 1 fails the filter; 2 passes and is
> mapped; `findFirst` is short-circuiting, so as soon as it has 20 nothing
> more is pulled and 3 and 4 are never filtered.

## java-intermediate-008
topic: functional
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    static int calls = 0;

    static String fallback() {
        calls++;
        return "fallback";
    }

    public static void main(String[] args) {
        Optional<String> name = Optional.of("ada");
        String a = name.orElse(fallback());
        String b = name.orElseGet(Main::fallback);
        System.out.println(a + " " + b + " " + calls);
    }
}
```

- A: `ada ada 1`
- B: `ada ada 0`
- C: `ada ada 2`
- D: `fallback ada 1`

> `orElse(fallback())` is an ordinary method call: its argument is evaluated
> before `orElse` runs, so `fallback()` executes even though the value is
> present (and its result is discarded). `orElseGet` takes a `Supplier` and
> calls it only when the `Optional` is empty, so it never runs here.

## java-intermediate-009
topic: functional
answer: C

What happens when this is compiled and run?

```java
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        int base = 10;
        base = 20;
        Supplier<Integer> next = () -> base + 1;
        System.out.println(next.get());
    }
}
```

- A: It prints `21`.
- B: It prints `11`.
- C: It does not compile: `base` is not effectively final.
- D: It does not compile: a lambda cannot read local variables.

> A lambda may read a local variable of the enclosing method only if it is
> final or effectively final — never assigned after initialisation. `base` is
> assigned twice, so it is not effectively final, even though both
> assignments happen before the lambda is created. Lambdas can read locals
> that are effectively final, so D's reason is wrong.

## java-intermediate-010
topic: inheritance
answer: C
run: java

What does this program print?

```java
class A {
    String name = "A";

    String get() { return name; }

    String who() { return "A"; }
}

class B extends A {
    String name = "B";

    @Override
    String who() { return "B"; }
}

public class Main {
    public static void main(String[] args) {
        A obj = new B();
        System.out.println(obj.name + " " + obj.who() + " " + obj.get());
    }
}
```

- A: `B B B`
- B: `A B B`
- C: `A B A`
- D: `A A A`

> Fields are not polymorphic: `B.name` hides `A.name`, and a field access is
> resolved from the static type, so `obj.name` reads `A`'s field. `who()` is
> overridden, so the call dispatches on the runtime class and returns "B".
> `get()` is declared in `A`, where `name` means `A.name`, so it returns "A".

## java-intermediate-011
topic: inheritance
answer: D
run: java

What does this program print?

```java
class Animal {
    String meet(Animal other) { return "AA"; }
}

class Dog extends Animal {
    String meet(Dog other) { return "DD"; }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        Dog d = new Dog();
        System.out.println(a.meet(d) + " " + d.meet(d) + " " + d.meet(a));
    }
}
```

- A: `DD DD AA`
- B: `DD DD DD`
- C: `AA DD DD`
- D: `AA DD AA`

> `meet(Dog)` has a different parameter type, so it overloads `meet(Animal)`
> rather than overriding it. `a.meet(d)`: the static type `Animal` only has
> `meet(Animal)`, and `Dog` does not override it, so "AA". `d.meet(d)`: both
> overloads apply and `meet(Dog)` is more specific, so "DD". `d.meet(a)`: the
> argument's static type is `Animal`, so only `meet(Animal)` applies — "AA".

## java-intermediate-012
topic: inheritance
answer: B

Given this class:

```java
import java.io.*;

class Source {
    protected Number read() throws IOException { return 0; }
}
```

Which declaration, placed in `class FileSource extends Source`, is a valid override of `read()`?

- A: `Number read() throws IOException { return 1; }`
- B: `public Integer read() throws FileNotFoundException { return 1; }`
- C: `protected Object read() { return 1; }`
- D: `protected Number read() throws IOException, InterruptedException { return 1; }`

> An override may widen access (`protected` to `public`), narrow the return
> type (covariant: `Integer` is a `Number`) and throw fewer or narrower checked
> exceptions (`FileNotFoundException` is an `IOException`). A narrows access to
> package-private, C widens the return type to `Object`, and D adds a checked
> exception the overridden method does not declare — each is a compile error.

## java-intermediate-013
topic: oop
answer: A
run: java

What does this program print?

```java
class Parent {
    static { Main.log.append("Ps "); }

    { Main.log.append("Pi "); }

    Parent() { Main.log.append("Pc "); }
}

class Child extends Parent {
    static { Main.log.append("Cs "); }

    { Main.log.append("Ci "); }

    Child() { Main.log.append("Cc "); }
}

public class Main {
    static StringBuilder log = new StringBuilder();

    public static void main(String[] args) {
        new Child();
        new Child();
        System.out.println(log.toString().trim());
    }
}
```

- A: `Ps Cs Pi Pc Ci Cc Pi Pc Ci Cc`
- B: `Ps Pi Pc Cs Ci Cc Pi Pc Ci Cc`
- C: `Ps Cs Pi Pc Ci Cc Ps Cs Pi Pc Ci Cc`
- D: `Ps Cs Pc Pi Cc Ci Pc Pi Cc Ci`

> Initialising `Child` initialises `Parent` first, so both static blocks run —
> parent then child — before the first object is built, and never again.
> Each `new Child()` then runs `Parent`'s instance initialisers and
> constructor body, then `Child`'s instance initialisers and constructor body.
> Instance initialisers run before the body of the constructor they belong to.

## java-intermediate-014
topic: oop
answer: B
run: java

What does this program print?

```java
public class Main {
    int x = 1;

    class Inner {
        int x = 2;

        String show(int x) {
            return x + " " + this.x + " " + Main.this.x;
        }
    }

    public static void main(String[] args) {
        Main outer = new Main();
        Main.Inner inner = outer.new Inner();
        outer.x = 10;
        System.out.println(inner.show(3));
    }
}
```

- A: `3 2 1`
- B: `3 2 10`
- C: `3 1 10`
- D: `3 10 10`

> Inside `show`, plain `x` is the parameter (3), `this.x` is the `Inner`
> field (2), and `Main.this.x` is the field of the enclosing instance. An inner
> class holds a reference to that enclosing object, not a copy of its fields,
> so the later assignment `outer.x = 10` is what it sees.

## java-intermediate-015
topic: exceptions
answer: C
run: java

What does this program print?

```java
public class Main {
    static int number() {
        int x = 1;
        try {
            return x;
        } finally {
            x = 5;
        }
    }

    static StringBuilder builder() {
        StringBuilder sb = new StringBuilder("a");
        try {
            return sb;
        } finally {
            sb.append("b");
        }
    }

    public static void main(String[] args) {
        System.out.println(number() + " " + builder());
    }
}
```

- A: `5 ab`
- B: `1 a`
- C: `1 ab`
- D: `5 a`

> `return x;` evaluates the value (1) before `finally` runs; assigning to the
> local afterwards cannot change a value already chosen. `return sb;` also
> fixes the value first — but the value is a reference, and `finally` mutates
> the object it points to, so the caller sees "ab".

## java-intermediate-016
topic: exceptions
answer: D
run: java

What does this program print?

```java
public class Main {
    static StringBuilder log = new StringBuilder();

    static class Res implements AutoCloseable {
        private final String name;

        Res(String name) {
            this.name = name;
            log.append("open").append(name).append(' ');
        }

        @Override
        public void close() { log.append("close").append(name).append(' '); }
    }

    public static void main(String[] args) {
        try (Res a = new Res("A"); Res b = new Res("B")) {
            log.append("body ");
            throw new IllegalStateException();
        } catch (IllegalStateException e) {
            log.append("catch");
        }
        System.out.println(log);
    }
}
```

- A: `openA openB body catch closeB closeA`
- B: `openA openB body closeA closeB catch`
- C: `openA openB body catch closeA closeB`
- D: `openA openB body closeB closeA catch`

> Resources are closed in the reverse order of their declaration, and they are
> closed as soon as the try block ends — before any `catch` or `finally` of the
> same statement runs. So both resources are already closed when the
> exception reaches the catch block.

## java-intermediate-017
topic: exceptions
answer: A, C, E

Which of these methods compile? Judge each method on its own. Select all that apply.

```java
import java.io.*;

class Demo {
    void a() { throw new IllegalArgumentException(); }

    void b() { throw new Exception(); }

    void c() throws IOException { throw new FileNotFoundException(); }

    void d() { try { System.out.println(); } catch (IOException e) { } }

    void e() { try { System.out.println(); } catch (Exception e) { } }
}
```

- A: `a`
- B: `b`
- C: `c`
- D: `d`
- E: `e`

> `a` throws an unchecked exception, which needs no `throws` clause. `b`
> throws the checked `Exception` without declaring it. `c` throws a subclass
> of the declared `IOException`. `d` catches a checked exception the try block
> can never throw, which is a compile error. `e` is allowed: `catch
> (Exception e)` can always catch unchecked exceptions, so the compiler does
> not reject it.

## java-intermediate-018
topic: strings
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String a = "hello";
        String b = "hel" + "lo";
        String c = "hel";
        String d = c + "lo";
        final String e = "hel";
        String f = e + "lo";
        System.out.println((a == b) + " " + (a == d) + " " + (a == f) + " " + (a == d.intern()));
    }
}
```

- A: `true false true true`
- B: `true false false true`
- C: `true true true true`
- D: `false false false true`

> `"hel" + "lo"` is a constant expression, folded at compile time into the
> same interned literal as `a`. `c` is not a constant variable, so `c + "lo"`
> builds a new `String` at run time. `e` is `final` and initialised with a
> constant, so it is a constant variable and `e + "lo"` is folded like `b`.
> `intern()` returns the pooled instance, which is `a`.

## java-intermediate-019
topic: strings
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] parts = ",a,,b,,".split(",");
        System.out.println(parts.length + " " + Arrays.toString(parts));
    }
}
```

- A: `6 [, a, , b, , ]`
- B: `2 [a, b]`
- C: `3 [a, , b]`
- D: `4 [, a, , b]`

> `split(regex)` is `split(regex, 0)`, which drops trailing empty strings but
> keeps leading and inner ones. The string splits into "", "a", "", "b", "",
> ""; the two trailing empties are removed, leaving four elements. Pass a
> negative limit, `split(",", -1)`, to keep them.

## java-intermediate-020
topic: memory
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d) + " " + (c == 128));
    }
}
```

- A: `true true true`
- B: `true false false`
- C: `true false true`
- D: `false false true`

> Autoboxing calls `Integer.valueOf`, which returns cached instances for
> -128 to 127, so `a` and `b` are the same object. 128 is outside the default
> cache, so `c` and `d` are two objects and `==` compares references. In
> `c == 128` one operand is an `int`, so `c` is unboxed and the values are
> compared.

## java-intermediate-021
topic: memory
answer: A

At the comment `// here`, which objects are eligible for garbage collection?

```java
class Node {
    Node next;
}

public class Main {
    public static void main(String[] args) {
        Node first = new Node();   // object N1
        Node second = new Node();  // object N2
        first.next = second;
        second.next = first;
        first = null;
        second = null;
        // here
    }
}
```

- A: Both N1 and N2.
- B: Neither: each is still referenced by the other.
- C: Only N1.
- D: Only N2.

> The JVM's collectors trace reachability from GC roots (live local variables,
> static fields, active threads and so on); they do not count references.
> Once both locals are null, no root reaches N1 or N2, so both are eligible
> even though they point at each other. A cycle only leaks under reference
> counting, which the JVM does not use.

## java-intermediate-022
topic: concurrency
answer: B
run: java

What does this program print?

```java
public class Main {
    static int count = 0;

    static synchronized void increment() {
        count++;
    }

    public static void main(String[] args) throws InterruptedException {
        Runnable work = () -> {
            for (int i = 0; i < 100_000; i++) increment();
        };
        Thread t1 = new Thread(work);
        Thread t2 = new Thread(work);
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(count);
    }
}
```

- A: `100000`
- B: `200000`
- C: A number below `200000` that varies from run to run.
- D: It throws an IllegalMonitorStateException.

> `increment()` is `static synchronized`, so both threads lock the same
> monitor (`Main.class`) and each `count++` happens atomically. `join()`
> creates a happens-before edge from each thread's work to the main thread,
> so the final read sees all 200,000 increments.

## java-intermediate-023
topic: concurrency
answer: D

Which statement about this program is true?

```java
public class Main {
    static boolean running = true;

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            long spins = 0;
            while (running) spins++;
        });
        worker.start();
        Thread.sleep(100);
        running = false;
        worker.join();
        System.out.println("stopped");
    }
}
```

- A: It always prints `stopped`: a static field is shared, so the worker sees the write at once.
- B: It always prints `stopped`, because `Thread.sleep` publishes the main thread's writes.
- C: It may hang, and only a `synchronized` block around the worker's loop can fix it.
- D: It may hang: the worker may never see the write. Making `running` `volatile` fixes it.

> Without a happens-before relationship between the write and the reads, the
> worker is not guaranteed to ever observe `running = false` — the JIT may
> even hoist the read out of the loop. A `volatile` write happens-before every
> later read of that field, so making it `volatile` guarantees the loop ends.
> `Thread.sleep` has no memory-visibility effect, and synchronising only the
> reader (C) would not help without the writer using the same lock.

## java-intermediate-024
topic: modern
answer: A
run: java

What does this program print?

```java
record Point(int x, int y) { }

public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        System.out.println(a.equals(b) + " " + (a == b) + " " + a);
    }
}
```

- A: `true false Point[x=1, y=2]`
- B: `true true Point[x=1, y=2]`
- C: `false false Point[x=1, y=2]`
- D: `true false Point(x=1, y=2)`

> A record gets `equals`, `hashCode` and `toString` generated from its
> components: `equals` compares the components, so the two points are equal,
> while `==` still compares references to two distinct objects. The generated
> `toString` has the form `Name[component=value, ...]` with square brackets.

## java-intermediate-025
topic: modern
answer: B
run: java

What does this program print?

```java
public class Main {
    static int colon(int x) {
        return switch (x) {
            case 1:
            case 2:
                x *= 10;
            case 3:
                yield x + 1;
            default:
                yield -1;
        };
    }

    static int arrow(int x) {
        return switch (x) {
            case 1, 2 -> x * 10;
            case 3 -> x + 1;
            default -> -1;
        };
    }

    public static void main(String[] args) {
        System.out.println(colon(2) + " " + arrow(2));
    }
}
```

- A: `20 20`
- B: `21 20`
- C: `21 21`
- D: It does not compile: a switch expression cannot fall through.

> A switch expression may use either label form. With `case ...:` labels it
> keeps the classic fall-through: `colon(2)` sets `x` to 20, falls into
> `case 3`, and yields 21. With `case ... ->` labels only the matching arm
> runs, so `arrow(2)` yields 20.

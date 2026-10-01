---
skill: java
level: intermediate
---

## java-intermediate-026
topic: collections
answer: C
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
        Set<Integer> set = new TreeSet<>(List.of(1, 2, 3));
        list.remove(1);
        set.remove(1);
        System.out.println(list + " " + set);
    }
}
```

- A: `[2, 3] [2, 3]`
- B: `[1, 3] [1, 3]`
- C: `[1, 3] [2, 3]`
- D: `[2, 3] [1, 3]`

> `List` has two `remove` methods: `remove(int index)` and `remove(Object o)`.
> With an `int` argument, `remove(int)` applies without boxing, so it wins and
> removes the element at index 1 (the value 2). `Set` has only
> `remove(Object)`, so the 1 is boxed and the value 1 is removed. Use
> `list.remove(Integer.valueOf(1))` to remove a value from a `List<Integer>`.

## java-intermediate-027
topic: collections
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Set<String> set = new TreeSet<>(Comparator.comparing(String::length));
        set.addAll(List.of("pear", "fig", "plum", "kiwi", "banana"));
        System.out.println(set);
    }
}
```

- A: `[fig, pear, banana]`
- B: `[fig, kiwi, banana]`
- C: `[fig, pear, plum, kiwi, banana]`
- D: `[banana, fig, kiwi, pear, plum]`

> A `TreeSet` decides duplicates with its comparator, not `equals`: two
> elements that compare as 0 are the same element. "plum" and "kiwi" have the
> same length as "pear", so adding them finds an "equal" element and leaves
> the set unchanged — the first one added stays. The set is ordered by length.

## java-intermediate-028
topic: collections
answer: B

`Employee` overrides `equals` so that two employees with the same `id` are equal, but it does not override `hashCode`. `e1` and `e2` are distinct `Employee` objects with the same `id`. Which statement is true?

- A: It does not compile: a class that overrides `equals` must also override `hashCode`.
- B: A `HashSet` may keep both, and a `HashMap` keyed by `e1` may not be found with `e2`.
- C: `List.of(e1).contains(e2)` is false, because a `List` checks hash codes before `equals`.
- D: A `TreeSet` would keep both too, because a `TreeSet` finds duplicates by `hashCode`.

> The contract says equal objects must have equal hash codes. Without an
> override, `hashCode` is `Object`'s identity hash, so `e1` and `e2` almost
> certainly land in different buckets and hash-based collections never get as
> far as calling `equals`. The compiler does not enforce the contract; lists
> use only `equals`; a `TreeSet` uses `compareTo` or its comparator.

## java-intermediate-029
topic: generics
answer: B, D

Given the declaration below, which of these statements compile? Select all that apply.

```java
List<? extends Number> nums = new ArrayList<Integer>(List.of(1, 2));
```

- A: `nums.add(3);`
- B: `Number first = nums.get(0);`
- C: `Integer second = nums.get(1);`
- D: `nums.add(null);`

> `List<? extends Number>` is a list of some unknown subtype of `Number`. Every
> element is at least a `Number`, so reading into a `Number` is safe, but the
> compiler cannot promise an `Integer` (it could be a `List<Double>`). For the
> same reason it refuses to add an `Integer`; `null` is the one value that
> belongs to every type, so `add(null)` compiles.

## java-intermediate-030
topic: generics
answer: C
run: java

What does this program print?

```java
class Box<T> {
    static int created = 0;
    final T value;

    Box(T value) {
        this.value = value;
        created++;
    }
}

public class Main {
    public static void main(String[] args) {
        new Box<String>("a");
        new Box<Integer>(1);
        new Box<Integer>(2);
        System.out.println(Box.created);
    }
}
```

- A: `1`
- B: `2`
- C: `3`
- D: It does not compile: a generic class cannot declare a static field.

> Type arguments are erased: at run time there is one `Box` class, whatever it
> was parameterised with, so there is one `created` field shared by all three
> objects. That is also why a static member cannot use `T` — it belongs to the
> one class, not to a particular `Box<String>` or `Box<Integer>`.

## java-intermediate-031
topic: generics
answer: D

What happens when this program runs?

```java
public class Main {
    public static void main(String[] args) {
        Integer[] ints = new Integer[2];
        Object[] objects = ints;
        objects[0] = "text";
        System.out.println(ints.length);
    }
}
```

- A: It does not compile: `Integer[]` cannot be assigned to `Object[]`.
- B: It prints `2`; the bad element only fails when `ints[0]` is read.
- C: It throws a ClassCastException at `Object[] objects = ints;`.
- D: It throws an ArrayStoreException at `objects[0] = "text";`.

> Arrays are covariant and know their component type at run time, so an
> `Integer[]` may be viewed as an `Object[]`, and every store is checked: putting
> a `String` into what is really an `Integer[]` throws `ArrayStoreException`.
> Generics take the opposite route — they are invariant and erased — so the
> same mistake, `List<Object> objs = new ArrayList<Integer>();`, is rejected at
> compile time instead.

## java-intermediate-032
topic: functional
answer: A
run: java

What does this program print?

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> seen = new ArrayList<>();
        Stream<Integer> doubled = Stream.of(1, 2, 3)
            .peek(x -> seen.add("saw " + x))
            .map(x -> x * 2);
        int before = seen.size();
        List<Integer> result = doubled.collect(Collectors.toList());
        System.out.println(before + " " + seen.size() + " " + result);
    }
}
```

- A: `0 3 [2, 4, 6]`
- B: `3 3 [2, 4, 6]`
- C: `3 6 [2, 4, 6]`
- D: `0 0 [2, 4, 6]`

> Intermediate operations such as `peek` and `map` only describe the pipeline;
> nothing flows until a terminal operation runs. So no element has been seen
> when `before` is read. `collect` then pulls each of the three elements
> through `peek` once.

## java-intermediate-033
topic: functional
answer: C

What happens when this program runs?

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Map<Character, String> byInitial = Stream.of("apple", "avocado", "banana")
            .collect(Collectors.toMap(s -> s.charAt(0), s -> s));
        System.out.println(byInitial);
    }
}
```

- A: It prints `{a=avocado, b=banana}`.
- B: It prints `{a=apple, b=banana}`.
- C: It throws an IllegalStateException for the duplicate key.
- D: It prints `{a=[apple, avocado], b=[banana]}`.

> The two-argument `Collectors.toMap` has no rule for a key that appears twice,
> so it throws `IllegalStateException` ("Duplicate key a"). Pass a merge
> function as the third argument — `(first, second) -> second` keeps the last —
> or use `groupingBy` to collect every value per key.

## java-intermediate-034
topic: functional
answer: B
run: java

What does this program print?

```java
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Function<Integer, Integer> plusTwo = x -> x + 2;
        Function<Integer, Integer> timesThree = x -> x * 3;
        System.out.println(plusTwo.andThen(timesThree).apply(1) + " " + plusTwo.compose(timesThree).apply(1));
    }
}
```

- A: `5 9`
- B: `9 5`
- C: `9 9`
- D: `5 5`

> `f.andThen(g)` applies `f` first, then `g`: (1 + 2) * 3 = 9. `f.compose(g)`
> applies `g` first, then `f`: 1 * 3 + 2 = 5.

## java-intermediate-035
topic: inheritance
answer: D
run: java

What does this program print?

```java
class Parent {
    static String id() { return "P"; }

    String call() { return id(); }
}

class Child extends Parent {
    static String id() { return "C"; }
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.id() + " " + Child.id() + " " + p.call());
    }
}
```

- A: `C C C`
- B: `P C C`
- C: `C C P`
- D: `P C P`

> Static methods are hidden, not overridden, so there is no dynamic dispatch.
> `p.id()` is compiled as `Parent.id()` because `p`'s static type is `Parent`
> (the object it points to is ignored). Inside `Parent.call()`, `id()` means
> `Parent.id()` as well. Only `Child.id()` names the child's method.

## java-intermediate-036
topic: inheritance
answer: A

What must `Both` do to compile?

```java
interface Left {
    default String hello() { return "left"; }
}

interface Right {
    default String hello() { return "right"; }
}

class Both implements Left, Right { }
```

- A: Override `hello()`; its body may call `Left.super.hello()` to reuse one of them.
- B: Nothing: `Left` is listed first after `implements`, so its `hello()` wins.
- C: Nothing: the conflict is only reported where `hello()` is called on a `Both`.
- D: Override `hello()`, though it cannot call either interface's default from there.

> A class that inherits two default methods with the same signature from
> unrelated interfaces, and gets no implementation from a superclass, does not
> compile until it overrides the method — the order of the `implements` list
> means nothing. Inside the override, `Left.super.hello()` or
> `Right.super.hello()` calls a chosen interface's default.

## java-intermediate-037
topic: oop
answer: C
run: java

What does this program print?

```java
class Widget {
    static StringBuilder log = new StringBuilder();

    { log.append("i"); }

    Widget() {
        this(0);
        log.append("a");
    }

    Widget(int size) {
        log.append("b");
    }
}

public class Main {
    public static void main(String[] args) {
        new Widget();
        System.out.println(Widget.log);
    }
}
```

- A: `iiba`
- B: `bia`
- C: `iba`
- D: `ibia`

> Instance initialisers run once per object, right after the superclass
> constructor returns — so they are part of the constructor that calls
> `super(...)` (here implicitly `Widget(int)`), not of one that starts with
> `this(...)`. `Widget()` delegates to `Widget(int)`, which runs the
> initialiser ("i") and its body ("b"); then `Widget()` finishes ("a").

## java-intermediate-038
topic: oop
answer: D

Which line, placed inside `main`, creates an `Inner` object?

```java
public class Outer {
    class Inner { }

    public static void main(String[] args) {
        // create an Inner here
    }
}
```

- A: `Inner in = new Inner();`
- B: `Outer.Inner in = new Outer.Inner();`
- C: `Outer.Inner in = new Outer.Inner(new Outer());`
- D: `Outer.Inner in = new Outer().new Inner();`

> `Inner` is an inner (non-static) class, so every `Inner` belongs to an
> enclosing `Outer` instance. `main` is static and has no `this`, so A and B do
> not compile ("non-static variable this cannot be referenced from a static
> context"). The enclosing instance is not a constructor argument either, so C
> fails too. The qualified form `outerObject.new Inner()` is how it is
> supplied. Had `Inner` been declared `static`, B would compile.

## java-intermediate-039
topic: oop
answer: B
run: java

What does this program print?

```java
public class Main {
    static int first = readSecond();
    static int second = 5;

    static int readSecond() {
        return second;
    }

    public static void main(String[] args) {
        System.out.println(first + " " + second);
    }
}
```

- A: `5 5`
- B: `0 5`
- C: `0 0`
- D: It does not compile: illegal forward reference to `second`.

> Static fields are initialised in textual order. When `first` is
> initialised, `readSecond()` reads `second`, which still holds its default
> value 0; the 5 is assigned afterwards. Writing `static int first = second;`
> directly would be a compile-time "illegal forward reference", but a method
> call is not checked that way.

## java-intermediate-040
topic: exceptions
answer: A
run: java

What does this program print?

```java
public class Main {
    static String risky() {
        try {
            throw new IllegalStateException("boom");
        } finally {
            return "finally";
        }
    }

    public static void main(String[] args) {
        try {
            System.out.println(risky());
        } catch (IllegalStateException e) {
            System.out.println("caught " + e.getMessage());
        }
    }
}
```

- A: `finally`
- B: `caught boom`
- C: It does not compile: a `finally` block cannot contain `return`.
- D: It does not compile: `risky()` can end without returning a value.

> When a `finally` block completes abruptly — here with `return` — that
> outcome replaces whatever the try block was doing, including a thrown
> exception. The `IllegalStateException` is silently discarded and `risky()`
> returns normally. It compiles (javac only warns), which is exactly why
> `return` in `finally` is considered a bug.

## java-intermediate-041
topic: exceptions
answer: C

What happens when this is compiled and run?

```java
import java.io.*;

public class Main {
    static void load() throws IOException {
        throw new FileNotFoundException("config");
    }

    public static void main(String[] args) {
        try {
            load();
        } catch (Exception e) {
            System.out.println("general");
        } catch (IOException e) {
            System.out.println("io");
        }
    }
}
```

- A: It prints `general`.
- B: It prints `io`.
- C: It does not compile: `IOException` is already caught by `catch (Exception e)`.
- D: It does not compile: `catch (IOException e)` cannot catch a `FileNotFoundException`.

> Catch clauses are tried in order, so a clause for a subclass placed after
> one for its superclass can never run; Java makes that a compile-time error.
> Put the more specific `catch (IOException e)` first. `FileNotFoundException`
> is a subclass of `IOException`, so D's reason is wrong.

## java-intermediate-042
topic: strings
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder x = new StringBuilder("ab");
        StringBuilder y = new StringBuilder("ab");
        System.out.println(x.equals(y) + " " + "ab".contentEquals(x) + " " + x.toString().equals(y.toString()));
    }
}
```

- A: `true true true`
- B: `false false true`
- C: `true false true`
- D: `false true true`

> `StringBuilder` does not override `equals`, so `x.equals(y)` is the identity
> check from `Object` and is false for two builders. `String.contentEquals`
> compares a string with any `CharSequence` character by character, and
> comparing the two `toString()` results uses `String.equals`; both are true.

## java-intermediate-043
topic: strings
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String command = "Stop";
        StringBuilder out = new StringBuilder();
        switch (command.toLowerCase()) {
            case "go":
                out.append("G");
            case "stop":
                out.append("S");
            case "pause":
                out.append("P");
                break;
            default:
                out.append("D");
        }
        System.out.println(out);
    }
}
```

- A: `S`
- B: `SP`
- C: `D`
- D: `SPD`

> A `switch` on a `String` matches with `equals`, so it is case-sensitive —
> but the selector is lower-cased first, so `case "stop"` matches. A
> colon-style switch statement falls through: without a `break`, execution
> continues into `case "pause"`, appends "P", and stops at its `break`.

## java-intermediate-044
topic: memory
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        Long big = 127L;
        System.out.println(big.equals(127) + " " + big.equals(127L) + " " + (big == 127));
    }
}
```

- A: `false true true`
- B: `true true true`
- C: `false true false`
- D: `true true false`

> `big.equals(127)` boxes the `int` literal to an `Integer`, and `Long.equals`
> is true only for another `Long`, so it is false despite the equal value.
> `equals(127L)` boxes to a `Long` and is true. `big == 127` compares a `Long`
> with an `int`, so `big` is unboxed and the numbers are compared: true.

## java-intermediate-045
topic: memory
answer: C

What happens when this program runs?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> stock = new HashMap<>();
        int count = stock.get("pens");
        System.out.println(count);
    }
}
```

- A: It prints `0`.
- B: It prints `null`.
- C: It throws a NullPointerException.
- D: It does not compile: an `Integer` cannot be assigned to an `int`.

> `get` returns `null` for a missing key. Assigning an `Integer` to an `int`
> compiles because of auto-unboxing, which calls `intValue()` on the
> reference — on `null` that throws `NullPointerException`. `getOrDefault`
> (or an `Integer` variable) avoids it.

## java-intermediate-046
topic: concurrency
answer: D
run: java

What does this program print?

```java
import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        List<Callable<String>> tasks = List.of(
            () -> { Thread.sleep(300); return "a"; },
            () -> { Thread.sleep(100); return "b"; },
            () -> "c"
        );
        StringBuilder out = new StringBuilder();
        for (Future<String> f : pool.invokeAll(tasks)) {
            out.append(f.get());
        }
        pool.shutdown();
        System.out.println(out);
    }
}
```

- A: `cba`
- B: `c`
- C: The three letters, in an order that can differ between runs.
- D: `abc`

> `invokeAll` waits until every task is done and returns the futures in the
> same order as the task list, whatever order the tasks finished in. So the
> loop reads "a", "b", "c". (`invokeAny` is the method that returns just one
> result — that of a task that completed successfully.)

## java-intermediate-047
topic: concurrency
answer: B
run: java

What does this program print?

```java
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) {
        AtomicInteger n = new AtomicInteger(5);
        int a = n.getAndIncrement();
        int b = n.incrementAndGet();
        boolean c = n.compareAndSet(5, 100);
        boolean d = n.compareAndSet(7, 10);
        System.out.println(a + " " + b + " " + c + " " + d + " " + n.get());
    }
}
```

- A: `6 7 false true 10`
- B: `5 7 false true 10`
- C: `5 6 false true 10`
- D: `5 7 false false 7`

> `getAndIncrement` returns the old value (5) and leaves 6; `incrementAndGet`
> returns the new value (7). `compareAndSet(expected, newValue)` sets only if
> the current value equals `expected`: the value is 7, so `(5, 100)` fails and
> `(7, 10)` succeeds, leaving 10.

## java-intermediate-048
topic: concurrency
answer: C

Two threads run these blocks at the same time, and the program occasionally hangs forever. Which change removes the possibility of this deadlock?

```java
// Thread 1
synchronized (accountA) {
    synchronized (accountB) { transfer(accountA, accountB); }
}

// Thread 2
synchronized (accountB) {
    synchronized (accountA) { transfer(accountB, accountA); }
}
```

- A: Declare `accountA` and `accountB` as `volatile` fields.
- B: Call `Thread.sleep(10)` between taking the first lock and the second.
- C: Make both threads take the two locks in the same order.
- D: Give Thread 1 a higher priority than Thread 2.

> The deadlock needs a cycle: Thread 1 holds A and waits for B while Thread 2
> holds B and waits for A. If every thread acquires the locks in one global
> order, no such cycle can form. `volatile` affects visibility, not locking; a
> sleep only changes the timing; priorities are scheduling hints that cannot
> prevent the circular wait.

## java-intermediate-049
topic: modern
answer: D
run: java

What does this program print?

```java
record Range(int lo, int hi) {
    Range {
        if (lo > hi) {
            int tmp = lo;
            lo = hi;
            hi = tmp;
        }
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Range(5, 2));
    }
}
```

- A: `Range[lo=5, hi=2]`
- B: It does not compile: a compact constructor cannot reassign its parameters.
- C: `Range(lo=2, hi=5)`
- D: `Range[lo=2, hi=5]`

> In a compact canonical constructor the parameters are implicit, and the
> fields are assigned from them after the body has run. Reassigning the
> parameters is therefore the way to normalise input, and the swapped values
> are what get stored. (Assigning `this.lo` in the body is what is not
> allowed.)

## java-intermediate-050
topic: modern
answer: B

This code does not compile. Why?

```java
sealed interface Shape permits Circle, Square { }

final class Circle implements Shape { }

class Square implements Shape { }
```

- A: A sealed type must be an abstract class, not an interface.
- B: `Square` must be declared `final`, `sealed` or `non-sealed`.
- C: `Circle` must be a record, because a sealed interface permits only records.
- D: Every class in `permits` must be declared in a separate file.

> Every permitted subclass of a sealed type must say how it continues the
> hierarchy: `final` (no subclasses), `sealed` (its own permitted list) or
> `non-sealed` (open again). `Circle` does; `Square` says nothing. Interfaces
> can be sealed, any class or record may be permitted, and permitted
> subclasses may sit in the same file.

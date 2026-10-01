---
skill: java
level: intermediate
---

## java-intermediate-051
topic: collections
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<List<Integer>, String> map = new HashMap<>();
        List<Integer> key = new ArrayList<>(List.of(1, 2));
        map.put(key, "x");
        key.add(3);
        System.out.println(map.get(key) + " " + map.containsKey(List.of(1, 2)) + " " + map.size());
    }
}
```

- A: `null false 1`
- B: `x true 1`
- C: `x false 1`
- D: `null true 1`

> The entry was filed under the hash code of `[1, 2]`. Adding to the list
> changes its `hashCode`, so `get(key)` looks under the hash of `[1, 2, 3]`
> and finds nothing. A fresh `[1, 2]` has the old hash, but is no longer
> `equals` to the stored key, which is now `[1, 2, 3]`. The entry is still in
> the map (size 1) but no lookup can reach it. Never mutate a key, in a way
> that changes `equals`/`hashCode`, while it is in a hash-based collection.

## java-intermediate-052
topic: collections
answer: C
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> words = new ArrayList<>(List.of("bb", "a", "ccc", "dd", "e"));
        words.sort(Comparator.comparing(String::length)
            .thenComparing(Comparator.naturalOrder())
            .reversed());
        System.out.println(words);
    }
}
```

- A: `[ccc, bb, dd, a, e]`
- B: `[a, e, bb, dd, ccc]`
- C: `[ccc, dd, bb, e, a]`
- D: `[e, a, dd, bb, ccc]`

> `reversed()` reverses the whole comparator it is called on — here the
> combined "length, then alphabetical" order — so both keys become
> descending: longest first, and reverse alphabetical within a length. To
> reverse only the length, call `reversed()` before `thenComparing`, or use
> `Comparator.comparing(String::length, Comparator.reverseOrder())`.

## java-intermediate-053
topic: collections
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] arr = {"x", "y", "z"};
        List<String> list = Arrays.asList(arr);
        list.set(0, "q");
        arr[2] = "w";
        System.out.println(list + " " + arr[0]);
    }
}
```

- A: `[q, y, z] x`
- B: `[q, y, w] x`
- C: `[q, y, z] q`
- D: `[q, y, w] q`

> `Arrays.asList` returns a fixed-size list backed by the array — a view, not
> a copy. `set` on the list writes into the array, and a write to the array
> shows through the list. (The view cannot grow or shrink: `add` and `remove`
> throw `UnsupportedOperationException`.)

## java-intermediate-054
topic: generics
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> strings = new ArrayList<>();
        List raw = strings;
        raw.add(42);
        Object first = raw.get(0);
        System.out.println(strings.size() + " " + first);
    }
}
```

- A: `1 42`
- B: `0 42`
- C: It throws a ClassCastException at `raw.add(42)`.
- D: It does not compile: a `List<String>` cannot be assigned to a raw `List`.
- E: It throws a ClassCastException at `Object first = raw.get(0);`.

> `raw` and `strings` are two references to the same list. Type arguments are
> checked only by the compiler and erased at run time: a raw `List` reference
> turns the check off (javac only warns), and the `ArrayList` itself has no
> idea it was meant to hold strings, so adding an `Integer` succeeds. Reading
> it back as an `Object` needs no cast, so nothing
> fails yet; the heap pollution would surface as a `ClassCastException` where
> the compiler inserts a cast, e.g. `String s = strings.get(0);`.

## java-intermediate-055
topic: generics
answer: B

What happens when this class is compiled?

```java
import java.util.*;

class Printer {
    void print(List<String> lines) { }

    void print(List<Integer> numbers) { }
}
```

- A: It compiles; `print(List.of("a"))` calls the first method and `print(List.of(1))` the second.
- B: It does not compile: both methods have the same erasure, `print(List)`.
- C: It compiles, but every call to `print` is rejected as ambiguous.
- D: It compiles, and the method is chosen at run time from the list's elements.

> Type arguments are erased, so both methods would become `print(List)` in the
> class file. Two methods whose erased signatures are identical are a
> compile-time "name clash", even though their declared parameter types
> differ. Give them different names, such as `printLines` and `printNumbers`.

## java-intermediate-056
topic: functional
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Optional<String> name = Optional.of("java").map(s -> null);
        System.out.println(name.isPresent() + " " + name.orElse("none"));
    }
}
```

- A: It throws a NullPointerException.
- B: `true null`
- C: `true none`
- D: `false none`

> `Optional.map` wraps the function's result with `Optional.ofNullable`, so a
> `null` result becomes an empty `Optional`, not an exception and not a
> present `null`. `orElse` then supplies "none". (It is `Optional.of(null)`
> that throws.)

## java-intermediate-057
topic: functional
answer: A
run: java

What does this program print?

```java
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Function<String, Integer> length = String::length;
        Supplier<Integer> fixed = "hello"::length;
        BiFunction<String, String, Boolean> starts = String::startsWith;
        System.out.println(length.apply("abc") + " " + fixed.get() + " " + starts.apply("java", "ja"));
    }
}
```

- A: `3 5 true`
- B: `3 5 false`
- C: It does not compile: `String::startsWith` cannot be a `BiFunction`.
- D: It does not compile: `"hello"::length` needs a `Function`, not a `Supplier`.

> `String::length` as a `Function` is an unbound reference: the argument
> becomes the receiver. `"hello"::length` is bound to that object, so it takes
> no argument and fits a `Supplier`. `String::startsWith` as a two-argument
> function uses the first argument as the receiver and the second as the
> parameter: `"java".startsWith("ja")`, which is true.

## java-intermediate-058
topic: functional
answer: B

What happens when this program runs?

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream<String> names = List.of("ann", "bob").stream();
        long count = names.count();
        names.forEach(System.out::println);
        System.out.println(count);
    }
}
```

- A: It prints `ann`, `bob` and `2` on three lines.
- B: It throws an IllegalStateException at `names.forEach(...)`.
- C: It prints only `2`: `forEach` finds the stream already empty.
- D: It does not compile: a `Stream` variable can be used only once.

> A stream can be consumed by one terminal operation only. After `count()`
> the stream is marked as used, and any further operation on it throws
> `IllegalStateException` ("stream has already been operated upon or
> closed"). The compiler does not track this. Create a new stream from the
> list for each pass.

## java-intermediate-059
topic: inheritance
answer: C
run: java

What does this program print?

```java
public class Main {
    static String f(Object o) { return "Object"; }

    static String f(CharSequence c) { return "CharSequence"; }

    static String f(String s) { return "String"; }

    public static void main(String[] args) {
        Object text = "x";
        System.out.println(f(null) + " " + f(text));
    }
}
```

- A: `Object Object`
- B: `CharSequence Object`
- C: `String Object`
- D: `String String`

> Overloads are chosen at compile time. `null` fits all three, and the most
> specific one wins: `String` is a subtype of `CharSequence`, which is a
> subtype of `Object`, so `f(String)`. `text` has the static type `Object`, so
> only `f(Object)` applies — the `String` it refers to at run time does not
> matter.

## java-intermediate-060
topic: inheritance
answer: B
run: java

What does this program print?

```java
public class Main {
    static String m(long x) { return "long"; }

    static String m(Integer x) { return "Integer"; }

    static String m(int... x) { return "varargs"; }

    public static void main(String[] args) {
        int i = 5;
        System.out.println(m(i) + " " + m(Integer.valueOf(i)) + " " + m());
    }
}
```

- A: `Integer Integer varargs`
- B: `long Integer varargs`
- C: `long long varargs`
- D: `varargs Integer varargs`

> Overload resolution runs in phases: first without boxing or varargs
> (primitive widening allowed), then with boxing, then with varargs. For
> `m(i)`, `int` to `long` widening succeeds in the first phase, so `m(long)`
> beats `m(Integer)`, which would need boxing. For an `Integer` argument,
> `m(Integer)` matches exactly in the first phase. Only the varargs method
> accepts no arguments.

## java-intermediate-061
topic: inheritance
answer: A
run: java

What does this program print?

```java
interface Greeter {
    default String greet() { return "interface"; }
}

class Base {
    public String greet() { return "class"; }
}

class Impl extends Base implements Greeter { }

public class Main {
    public static void main(String[] args) {
        Greeter g = new Impl();
        System.out.println(g.greet() + " " + new Impl().greet());
    }
}
```

- A: `class class`
- B: `interface class`
- C: `interface interface`
- D: It does not compile: `Impl` inherits conflicting `greet()` methods.

> "Class wins": a method inherited from a superclass takes precedence over an
> interface default with the same signature, so there is no conflict.
> `Base.greet()` is public and implements `Greeter.greet()` for `Impl`, and
> the call dispatches on the runtime class whatever the static type of the
> reference.

## java-intermediate-062
topic: oop
answer: D
run: java

What does this program print?

```java
class Base {
    String seen;

    Base() { seen = describe(); }

    String describe() { return "base"; }
}

class Derived extends Base {
    String label = "derived";

    @Override
    String describe() { return label; }
}

public class Main {
    public static void main(String[] args) {
        Derived d = new Derived();
        System.out.println(d.seen + " " + d.describe());
    }
}
```

- A: `base derived`
- B: `derived derived`
- C: `base base`
- D: `null derived`

> The object is a `Derived` from the start, so the call in `Base`'s
> constructor dispatches to `Derived.describe()`. But `Derived`'s field
> initialisers run only after `Base()` returns, so at that moment `label` still
> holds its default, `null`. Once construction finishes it is "derived". This
> is why constructors should not call overridable methods.

## java-intermediate-063
topic: oop
answer: C
run: java

What does this program print?

```java
interface Named {
    String name();
}

public class Main {
    @Override
    public String toString() { return "outer"; }

    Named lambda() {
        return () -> this.toString();
    }

    Named anonymous() {
        return new Named() {
            @Override
            public String name() { return this.toString(); }

            @Override
            public String toString() { return "inner"; }
        };
    }

    public static void main(String[] args) {
        Main m = new Main();
        System.out.println(m.lambda().name() + " " + m.anonymous().name());
    }
}
```

- A: `inner inner`
- B: `outer outer`
- C: `outer inner`
- D: `inner outer`

> A lambda body does not start a new scope for `this`: inside it, `this` is
> the enclosing `Main` instance, whose `toString` returns "outer". An
> anonymous class declares a new class, and `this` inside it is the anonymous
> object, which overrides `toString` to return "inner".

## java-intermediate-064
topic: exceptions
answer: B
run: java

What does this program print?

```java
public class Main {
    static class Faulty implements AutoCloseable {
        @Override
        public void close() {
            throw new IllegalStateException("close");
        }
    }

    public static void main(String[] args) {
        try (Faulty f = new Faulty()) {
            throw new RuntimeException("body");
        } catch (RuntimeException e) {
            System.out.println(e.getMessage() + " " + e.getSuppressed().length);
        }
    }
}
```

- A: `close 1`
- B: `body 1`
- C: `body 0`
- D: `close 0`

> When the body throws and `close()` then throws as well, try-with-resources
> keeps the body's exception as the one that propagates and attaches the
> exception from `close()` to it with `addSuppressed`. The catch block sees
> "body", carrying one suppressed exception.

## java-intermediate-065
topic: exceptions
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        try {
            try {
                throw new RuntimeException("first");
            } finally {
                throw new RuntimeException("second");
            }
        } catch (RuntimeException e) {
            System.out.println(e.getMessage() + " " + e.getSuppressed().length);
        }
    }
}
```

- A: `second 0`
- B: `first 0`
- C: `second 1`
- D: `first 1`

> An exception thrown from a plain `finally` block replaces the one already in
> flight: "first" is simply lost, not recorded as suppressed. Only
> try-with-resources attaches suppressed exceptions automatically. That loss
> is why throwing (or returning) from `finally` is a bug.

## java-intermediate-066
topic: strings
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("apple".compareTo("banana") + " " + "app".compareTo("apple") + " " + ("Zebra".compareTo("apple") < 0));
    }
}
```

- A: `-1 -1 false`
- B: `-1 -1 true`
- C: `-1 -2 false`
- D: `-1 -2 true`

> `compareTo` returns the difference of the first pair of characters that
> differ (`'a' - 'b'` is -1). When one string is a prefix of the other it
> returns the difference in lengths (3 - 5 is -2), not just -1. Characters are
> compared by code, and every upper-case letter comes before every lower-case
> one, so "Zebra" sorts before "apple". Use `compareToIgnoreCase` or a
> `Collator` for dictionary order.

## java-intermediate-067
topic: memory
answer: A
run: java

What does this program print?

```java
import java.util.*;

final class Schedule {
    private final List<String> days;

    Schedule(List<String> days) {
        this.days = days;
    }

    List<String> days() {
        return days;
    }
}

public class Main {
    public static void main(String[] args) {
        List<String> source = new ArrayList<>(List.of("mon"));
        Schedule s = new Schedule(source);
        source.add("tue");
        s.days().add("wed");
        System.out.println(s.days());
    }
}
```

- A: `[mon, tue, wed]`
- B: `[mon]`
- C: `[mon, tue]`
- D: It throws an UnsupportedOperationException at `s.days().add("wed")`.

> `final` on a field only stops the field from being reassigned; the list it
> refers to is still the caller's mutable `ArrayList`. The constructor keeps
> the caller's reference, so `source.add` shows through, and the accessor
> hands out the same reference, so anyone can add to it. An immutable class
> copies on the way in and out, e.g. `this.days = List.copyOf(days);`.

## java-intermediate-068
topic: memory
answer: B

While `process()` is running, where are these values stored? Use the JVM's model of stack frames and the heap, ignoring JIT optimisations such as escape analysis.

```java
void process() {
    int count = 5;
    int[] values = new int[3];
    String label = "id";
}
```

- A: `count` is in the stack frame; both references and the objects they point to are on the heap.
- B: `count` and both references are in the frame; the array and the `String` are on the heap.
- C: All of it is on the heap: Java keeps no local variables on a stack.
- D: All of it is in the stack frame, and is freed when `process()` returns.

> Local variables live in the method's stack frame: a primitive local holds
> its value there, and a reference local holds the reference there. Objects —
> arrays and strings included — are allocated on the heap and live on after
> the frame is gone, until nothing reaches them. The literal "id" is an
> interned `String` object, also on the heap.

## java-intermediate-069
topic: concurrency
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) throws InterruptedException {
        StringBuilder names = new StringBuilder();
        Thread t = new Thread(() -> names.append(Thread.currentThread().getName()).append(' '), "worker");
        t.run();
        t.start();
        t.join();
        System.out.println(names.toString().trim());
    }
}
```

- A: `worker worker`
- B: `main main`
- C: `main worker`
- D: It throws an IllegalThreadStateException at `t.start()`.

> `run()` is an ordinary method call: it executes the `Runnable` on the
> calling thread, "main", and starts nothing, so the thread is still new and
> `start()` is allowed. `start()` runs the `Runnable` on the new thread named
> "worker", and `join()` makes its append visible to `main`.

## java-intermediate-070
topic: concurrency
answer: B, C

Two threads each call `increment()` 10,000 times on the same counter object; the main thread joins both and then reads the count. Which implementations guarantee that it reads `20000`? Select all that apply.

- A: `private volatile int n; void increment() { n++; }`
- B: `private final AtomicInteger n = new AtomicInteger(); void increment() { n.incrementAndGet(); }`
- C: `private int n; synchronized void increment() { n++; }`
- D: `private int n; void increment() { synchronized (new Object()) { n++; } }`

> `n++` is a read, an add and a write. `volatile` makes each read and write
> visible but does not make the three steps atomic, so two threads can read
> the same value and lose an increment. `incrementAndGet` is atomic. A
> `synchronized` method locks the one shared counter object, so increments
> exclude each other. Locking a `new Object()` gives every call its own lock,
> which excludes nobody. The joins make the final value visible in B and C.

## java-intermediate-071
topic: concurrency
answer: D
run: java

What does this program print?

```java
import java.util.concurrent.*;

public class Main {
    static String load() {
        throw new IllegalStateException("bad");
    }

    public static void main(String[] args) {
        CompletableFuture<String> result = CompletableFuture
            .supplyAsync(Main::load)
            .thenApply(s -> s + "!")
            .exceptionally(ex -> "recovered");
        System.out.println(result.join());
    }
}
```

- A: `recovered!`
- B: `null!`
- C: It throws a CompletionException from `join()`.
- D: `recovered`

> When a stage completes exceptionally, dependent stages such as `thenApply`
> do not run their function; they complete exceptionally too. `exceptionally`
> is the first stage that handles the failure, and replaces it with
> "recovered", so `join()` returns that value normally.

## java-intermediate-072
topic: modern
answer: A
run: java

What does this program print?

```java
public class Main {
    static String describe(Object o) {
        if (!(o instanceof Integer i)) {
            return "not an int";
        }
        return "int " + (i + 1);
    }

    public static void main(String[] args) {
        System.out.println(describe(41) + ", " + describe(41L));
    }
}
```

- A: `int 42, not an int`
- B: `int 42, int 42`
- C: It does not compile: `i` is not in scope after the `if`.
- D: It does not compile: `!` cannot be applied to a pattern match.

> A pattern variable is in scope wherever the compiler can prove the match
> succeeded. The `if` returns whenever the match fails, so after it the match
> must have succeeded and `i` is in scope ("flow scoping"). `41L` is boxed to
> a `Long`, which is not an `Integer`, so the second match fails.

## java-intermediate-073
topic: modern
answer: B, E

Which of these local variable declarations compile? Assume `java.util.*` is imported. Select all that apply.

- A: `var a = null;`
- B: `var b = new ArrayList<>();`
- C: `var c;`
- D: `var d = () -> 42;`
- E: `var e = new int[] {1, 2};`
- F: `var f = {1, 2};`

> `var` takes its type from the initialiser, so the initialiser must have a
> type of its own. `null` has none (A); C has no initialiser; a lambda needs a
> target type (D); and a bare array initialiser needs a declared array type
> (F). `new ArrayList<>()` is inferred as `ArrayList<Object>`, and
> `new int[] {1, 2}` is an `int[]`.

## java-intermediate-074
topic: modern
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String block = """
            Hi
              there
            """;
        System.out.println(block.replace("\n", "|"));
    }
}
```

- A: `Hi|there|`
- B: `Hi|  there|`
- C: `|Hi|  there|`
- D: `Hi|  there`

> A text block's content starts on the line after the opening `"""`, so it
> does not begin with a line break. The common leading indentation — counted
> over the content lines and the closing delimiter's line — is stripped, so
> "there" keeps the two extra spaces it had relative to the others. With the
> closing `"""` on its own line, the content ends with a line break.

## java-intermediate-075
topic: modern
answer: C
run: java

What does this program print?

```java
import java.util.*;

record Team(String name, List<String> members) { }

public class Main {
    public static void main(String[] args) {
        List<String> people = new ArrayList<>(List.of("ann"));
        Team team = new Team("core", people);
        people.add("bob");
        System.out.println(team.members().size() + " " + team.equals(new Team("core", List.of("ann", "bob"))));
    }
}
```

- A: `1 false`
- B: `2 false`
- C: `2 true`
- D: `1 true`

> A record's fields are `final`, but that is shallow: `members` refers to the
> caller's `ArrayList`, so adding "bob" afterwards shows through the record.
> The generated `equals` compares each component with its own `equals`, and
> `List.equals` compares elements, so an `ArrayList` and a `List.of` holding
> the same strings are equal. Copy in a compact constructor
> (`members = List.copyOf(members);`) for a truly immutable record.

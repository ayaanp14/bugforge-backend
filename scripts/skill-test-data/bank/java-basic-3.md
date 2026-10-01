---
skill: java
level: basic
---

## java-basic-051
topic: syntax-types
answer: C

Given these two declarations, which statement does not compile?

```java
final int limit = 10;
final int[] data = {1, 2, 3};
```

- A: `data[0] = 99;`
- B: `int copy = limit + 1;`
- C: `limit = 20;`
- D: `int[] other = data;`

> A `final` variable can be assigned only once, so `limit = 20;` is a compile error. For a reference, `final` fixes which object the variable refers to, not the object's contents: `data[0] = 99;` changes an element of the same array and is allowed. Reading a final variable (B) or copying its reference into another variable (D) is always fine.

## java-basic-052
topic: syntax-types
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        double x = 0.1 + 0.2;
        System.out.println((x == 0.3) + " " + x);
    }
}
```

- A: `true 0.3`
- B: `false 0.3`
- C: `true 0.30000000000000004`
- D: `false 0.30000000000000004`

> `double` stores binary fractions, and neither 0.1 nor 0.2 is exact in binary, so their sum is a value slightly above the `double` nearest 0.3. The `==` comparison is therefore `false`, and printing the sum shows the difference: `0.30000000000000004`. Compare floating-point results with a tolerance, e.g. `Math.abs(x - 0.3) < 1e-9`.

## java-basic-053
topic: operators-control
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int n = 10;
        int runs = 0;
        do {
            runs++;
            n++;
        } while (n < 5);
        System.out.println(runs + " " + n);
    }
}
```

- A: `1 11`
- B: `0 10`
- C: `1 10`
- D: `0 11`

> A `do`-`while` loop tests its condition after the body, so the body always runs at least once: `runs` becomes 1 and `n` becomes 11. Only then is `n < 5` checked, and it is false, so the loop ends. A plain `while (n < 5)` loop would not have run at all.

## java-basic-054
topic: operators-control
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int count = 0;
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (j == 1) break;
                count++;
            }
        }
        System.out.println(count);
    }
}
```

- A: `1`
- B: `3`
- C: `6`
- D: `9`

> `break` leaves only the innermost loop that contains it. Each inner loop counts once at `j == 0` and breaks at `j == 1`, and the outer loop carries on, so the inner loop runs three times and `count` ends at 3. Leaving both loops would need a labelled `break`.

## java-basic-055
topic: operators-control
answer: D

Which statement about `&&` and `&` with `boolean` operands is true?

- A: `&` skips its right operand when the left is `false`; `&&` always evaluates both.
- B: They behave identically on `boolean` operands; they differ only on integers.
- C: `&` does not compile when both of its operands are `boolean`.
- D: `&&` skips its right operand when the left is `false`; `&` always evaluates both.

> Both give the same logical AND result, but `&&` short-circuits: if the left side is `false` the answer is already known, so the right side is never evaluated. `&` on booleans is legal and always evaluates both sides, which matters when the right side has a side effect or would fail, as in `s != null && s.isEmpty()`.

## java-basic-056
topic: strings
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String s = "AB";
        System.out.println(s.charAt(0) + s.charAt(1));
    }
}
```

- A: `AB`
- B: `A B`
- C: `131`
- D: `6566`

> `charAt` returns a `char`, and `char` is a numeric type. With no `String` operand, `+` adds the two character codes: `'A'` is 65 and `'B'` is 66, so the result is the `int` 131. `"" + s.charAt(0) + s.charAt(1)` or `s.substring(0, 2)` would give `AB`.

## java-basic-057
topic: strings
answer: B

A method builds a long report with `report += line;`, where `report` is a `String`, inside a loop that runs 10,000 times. Why is this slow, when appending to a `StringBuilder` is not?

- A: `String` concatenation takes a lock on every `+=`; `StringBuilder` skips the locking.
- B: Each `+=` copies all the text so far into a new `String`; `StringBuilder` does not.
- C: Each `+=` adds its result to the shared string pool; `StringBuilder` does not.
- D: Each `+=` forces a garbage collection of the old string; `StringBuilder` does not.

> A `String` is immutable, so `report += line` cannot extend it: it creates a new `String` and copies every character built so far into it, making the whole loop quadratic. A `StringBuilder` keeps one growable buffer and appends to it. `StringBuffer` is the synchronized one; concatenation results are not added to the string pool; and no individual `+=` forces a garbage collection.

## java-basic-058
topic: strings
answer: A, C, E

Given `String s = "Hello";`, which of these expressions are `true`? Select all that apply.

- A: `s.charAt(1) == 'e'`
- B: `s.indexOf('l') == 3`
- C: `s.substring(1, 3).equals("el")`
- D: `s.endsWith("LO")`
- E: `s.lastIndexOf('l') == 3`

> The indexes are H 0, e 1, l 2, l 3, o 4. `charAt(1)` is `'e'` (A). `indexOf` finds the first `l`, at 2, not 3 (B is false), while `lastIndexOf` finds the last, at 3 (E). `substring(1, 3)` takes indexes 1 and 2: `"el"` (C). `endsWith` is case-sensitive, and `"Hello"` ends with `lo`, not `LO` (D is false).

## java-basic-059
topic: arrays
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        for (int x : a) {
            x = x * 10;
        }
        int sum = 0;
        for (int x : a) {
            sum += x;
        }
        System.out.println(sum);
    }
}
```

- A: `6`
- B: `60`
- C: `0`
- D: It does not compile.

> In an enhanced `for` loop, `x` is a local variable that receives a copy of each element. Assigning to `x` changes only that copy, never the array, so `a` is still `{1, 2, 3}` and the sum is 6. To change the elements, loop over the indexes and write `a[i] = a[i] * 10;`.

## java-basic-060
topic: arrays
answer: D

Which of these array declarations does not compile?

- A: `int[] a = new int[3];`
- B: `int[] b = {1, 2, 3};`
- C: `int c[] = new int[]{1, 2, 3};`
- D: `int[] d = new int[3]{1, 2, 3};`

> An array is created either with a size (`new int[3]`, elements set to 0) or with an initializer list, in which case the size comes from the list. Giving both, as in D, is a compile error. B is the shorthand allowed in a declaration, and C uses the older C-style `int c[]` declarator, which Java still accepts.

## java-basic-061
topic: oop
answer: C
run: java

What does this program print?

```java
class Acc {
    int v;

    Acc add(int n) {
        v += n;
        return this;
    }
}

public class Main {
    public static void main(String[] args) {
        Acc a = new Acc();
        a.add(2).add(3);
        Acc b = a.add(5);
        System.out.println(a.v + " " + (a == b));
    }
}
```

- A: `5 true`
- B: `10 false`
- C: `10 true`
- D: `2 false`

> `add` changes the object it is called on and returns `this`, a reference to that same object, so `a.add(2).add(3)` adds both numbers to `a`. `a.add(5)` adds 5 more, making `v` 10, and returns `a` itself, so `b` refers to the same object and `a == b` is true. No new `Acc` is ever created.

## java-basic-062
topic: oop
answer: A

Which statement about a `final` instance field (not `static`) is true?

- A: Each object must assign it exactly once during construction; it never changes after.
- B: It starts at its default value and may be assigned once later, from any method.
- C: It holds one value shared by every object of the class, like a `static` field.
- D: It can be reassigned after construction, but only by code inside the same class.

> A `final` field must be definitely assigned by the time each constructor finishes (in its declaration, an initializer block or the constructor), and never again; a method cannot assign it. `final` does not make it shared: every object has its own copy, which is what `static` controls, and the two can differ between objects.

## java-basic-063
topic: oop
answer: B

Which of these, placed inside `class Book { String title; }`, is a constructor for `Book`?

- A: `public void Book(String title) { this.title = title; }`
- B: `public Book(String title) { this.title = title; }`
- C: `public static Book(String title) { this.title = title; }`
- D: `public Book Book(String title) { this.title = title; }`

> A constructor has exactly the class's name and no return type, not even `void`. A is legal but is an ordinary method that happens to be called `Book`, so `new Book("x")` would not find it. D is also a method (returning a `Book`, and missing its `return`). A constructor cannot be `static` (C).

## java-basic-064
topic: inheritance
answer: A
run: java

What does this program print?

```java
class Printer {
    String show(Object o) { return "object"; }
    String show(String s) { return "string"; }
}

public class Main {
    public static void main(String[] args) {
        Object o = "hi";
        System.out.println(new Printer().show(o));
    }
}
```

- A: `object`
- B: `string`
- C: It does not compile.

> Choosing between overloads happens at compile time, from the declared types of the arguments. `o` is declared as `Object`, so the compiler picks `show(Object)`, even though the object at run time is a `String`. Only overriding, a subclass replacing an inherited method, is decided by the run-time class.

## java-basic-065
topic: inheritance
answer: D

The class `Kid` below does not compile. Why?

```java
class Parent {
    Parent(String name) { }
}

class Kid extends Parent {
    Kid() { }
}
```

- A: A subclass must declare every constructor that its parent declares.
- B: `Kid` must be `abstract`, because it never sets a name.
- C: A constructor's body is not allowed to be empty.
- D: `Kid()` implicitly calls `super()`, which `Parent` does not have.

> A constructor that does not start with `this(...)` or `super(...)` gets an implicit `super()`. `Parent` declares only `Parent(String)`, so there is no no-argument constructor for that call to reach. Writing `Kid() { super("kid"); }` fixes it. Subclasses need not copy their parent's constructors, and empty constructor bodies are fine.

## java-basic-066
topic: inheritance
answer: A, C

Which of these statements about classes and interfaces in Java are true? Select all that apply.

- A: A class can implement more than one interface.
- B: A class can extend more than one class.
- C: An interface can be used as the type of a variable.
- D: An interface can declare a constructor.

> A class may `implements` any number of interfaces, but `extends` only one class. An interface type is a perfectly good variable type, e.g. `List<String> names = new ArrayList<>();`, and the variable can hold any object whose class implements it. Interfaces cannot be instantiated directly and have no constructors.

## java-basic-067
topic: inheritance
answer: B
run: java

What does this program print?

```java
class Animal { }
class Dog extends Animal { }

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        Animal b = new Animal();
        System.out.println((a instanceof Dog) + " " + (b instanceof Dog) + " " + (a instanceof Animal));
    }
}
```

- A: `true true true`
- B: `true false true`
- C: `false false true`
- D: `true false false`

> `instanceof` checks the class of the object at run time, not the variable's declared type. `a` holds a `Dog`, so it is an instance of `Dog` and also of its superclass `Animal`. `b` holds a plain `Animal`, which is not a `Dog`.

## java-basic-068
topic: exceptions
answer: C
run: java

What does this program print?

```java
class InsufficientFunds extends Exception {
    InsufficientFunds(String message) {
        super(message);
    }
}

public class Main {
    static void withdraw(int balance, int amount) throws InsufficientFunds {
        if (amount > balance) {
            throw new InsufficientFunds("short by " + (amount - balance));
        }
        System.out.print("ok ");
    }

    public static void main(String[] args) {
        try {
            withdraw(100, 30);
            withdraw(100, 130);
            withdraw(100, 10);
        } catch (InsufficientFunds e) {
            System.out.print(e.getMessage());
        }
        System.out.println();
    }
}
```

- A: `ok ok short by 30`
- B: `short by 30`
- C: `ok short by 30`
- D: `ok short by 30 ok`

> The first call succeeds and prints `ok `. The second throws, and a thrown exception abandons the rest of the `try` block: control jumps to the `catch`, so the third call never happens. `getMessage()` returns the text passed to the `super(message)` constructor, `short by 30`.

## java-basic-069
topic: exceptions
answer: A

This program does not compile. Which single change makes it compile?

```java
import java.io.FileNotFoundException;
import java.io.IOException;

public class Main {
    static void load() throws IOException {
        throw new FileNotFoundException("config.txt");
    }

    public static void main(String[] args) {
        load();
        System.out.println("loaded");
    }
}
```

- A: Add `throws IOException` to the declaration of `main`.
- B: In `load`, throw a `RuntimeException` instead, keeping its `throws` clause.
- C: Delete the `throws IOException` clause from the declaration of `load`.
- D: Declare `load` as `public static` instead of just `static`.

> `load` declares `throws IOException`, a checked exception, so every caller must catch it or declare it too; `main` does neither. Declaring it on `main` satisfies the rule. B does not help, because callers go by the `throws` clause, not the body. C breaks `load` itself, since `FileNotFoundException` is a checked subclass of `IOException` that would then be undeclared. Access modifiers (D) have nothing to do with exceptions.

## java-basic-070
topic: exceptions
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int total = 0;
        String[] inputs = {"4", "x", "6"};
        for (String in : inputs) {
            try {
                total += Integer.parseInt(in);
            } catch (NumberFormatException e) {
                total -= 1;
            }
        }
        System.out.println(total);
    }
}
```

- A: `10`
- B: `9`
- C: `3`
- D: `4`

> `Integer.parseInt("x")` throws `NumberFormatException`. Because the `try`/`catch` sits inside the loop, the exception is handled for that one element (subtracting 1) and the loop goes on to the next. So the total is `4 - 1 + 6 = 9`. Only a `try` around the whole loop would have stopped it at `"x"`.

## java-basic-071
topic: collections
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        int top = stack.pop();
        System.out.println(top + " " + stack.peek() + " " + stack.size());
    }
}
```

- A: `1 2 2`
- B: `3 3 2`
- C: `1 2 3`
- D: `3 2 2`

> Used with `push` and `pop`, a `Deque` is a stack: last in, first out. `pop()` removes and returns the most recently pushed element, 3. `peek()` returns the new top, 2, without removing it, and two elements remain.

## java-basic-072
topic: collections
answer: C

You need to remove every even number from an `ArrayList<Integer>` while looping over it. Which approach is correct for every list?

- A: A for-each loop that calls `list.remove(n)` for each even `n`.
- B: An index `for` loop from `0` upwards that calls `list.remove(i)` for each even element.
- C: An `Iterator` loop that calls `it.remove()` for each even element.
- D: A for-each loop that sets each even `n` to `null`.

> `Iterator.remove()` removes the element just returned and keeps the iterator consistent, so it works on any list. Removing through the list during a for-each loop makes the iterator fail, typically with `ConcurrentModificationException` (A). Removing by index while counting upwards shifts the next element into the current slot, which is then skipped: `[2, 4]` would keep the `4` (B). Assigning to the loop variable changes nothing in the list (D).

## java-basic-073
topic: collections
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        String[] words = {"to", "be", "or", "not", "to", "be"};
        for (String w : words) {
            counts.put(w, counts.getOrDefault(w, 0) + 1);
        }
        System.out.println(counts.size() + " " + counts.get("to") + " " + counts.get("is"));
    }
}
```

- A: `4 2 null`
- B: `6 2 null`
- C: `4 2 0`
- D: `4 1 null`

> A map has one entry per distinct key, so the six words give four entries: to, be, or, not. `getOrDefault` returns 0 the first time a word is seen, so each `put` stores the running count, and `"to"` ends at 2. `get` on a key that was never added returns `null`; the default only applies to `getOrDefault`.

## java-basic-074
topic: memory
answer: B

After these lines run, which of the three `StringBuilder` objects is no longer referenced by any of the variables `a`, `b` and `c`?

```java
StringBuilder a = new StringBuilder("one");
StringBuilder b = new StringBuilder("two");
StringBuilder c = new StringBuilder("three");
a = b;
b = c;
c = null;
```

- A: None of them; each is still referenced.
- B: Only the one built from `"one"`.
- C: Only the one built from `"three"`.
- D: The ones built from `"one"` and `"three"`.

> Assigning a reference variable changes which object it points at; it never copies or destroys an object. After `a = b`, `a` points at the "two" object and nothing points at "one" any more. `b = c` points `b` at "three", so `c = null` leaves "three" still referenced through `b`. Only "one" is unreferenced.

## java-basic-075
topic: memory
answer: C
run: java

What does this program print?

```java
public class Main {
    static void rename(StringBuilder sb) {
        sb.append("!");
        sb = new StringBuilder("new");
        sb.append("?");
    }

    public static void main(String[] args) {
        StringBuilder name = new StringBuilder("old");
        rename(name);
        System.out.println(name);
    }
}
```

- A: `old`
- B: `new?`
- C: `old!`
- D: `old!new?`

> The method receives a copy of the reference. `sb.append("!")` uses that copy to change the caller's object, which becomes `old!`. `sb = new StringBuilder("new")` only re-points the method's own copy at a new object, so the second `append` changes that new object, and the caller's `name` never sees it.

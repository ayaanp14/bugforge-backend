---
skill: java
level: basic
---

## java-basic-026
topic: syntax-types
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int max = Integer.MAX_VALUE;
        System.out.println(max + 1);
    }
}
```

- A: `2147483648`
- B: `-2147483648`
- C: It throws an `ArithmeticException`.
- D: `-2147483647`

> `int` arithmetic is 32-bit and overflows silently: one past `Integer.MAX_VALUE` (2147483647) wraps around to `Integer.MIN_VALUE`, -2147483648. The sum is an `int`, so it cannot hold 2147483648, and the `+` operator never throws on overflow: `ArithmeticException` comes from things like integer division by zero, not from wrapping.

## java-basic-027
topic: syntax-types
answer: D

What happens when you compile and run this program?

```java
public class Main {
    public static void main(String[] args) {
        int total;
        for (int i = 1; i <= 3; i++) {
            total += i;
        }
        System.out.println(total);
    }
}
```

- A: It prints `6`.
- B: It prints `0`.
- C: It throws an exception at run time.
- D: It fails to compile.

> Fields get default values, but local variables do not: a local must be definitely assigned before it is read. `total += i` reads `total`, which was never given a value, so the compiler reports "variable total might not have been initialized". Declaring `int total = 0;` fixes it, and the program would then print `6`.

## java-basic-028
topic: syntax-types
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        double d = -2.7;
        System.out.println((int) d + " " + Math.round(d));
    }
}
```

- A: `-2 -3`
- B: `-3 -3`
- C: `-3 -2`
- D: `-2 -2`

> Casting a `double` to `int` drops the fractional part, truncating towards zero, so `(int) -2.7` is `-2` (not the floor, `-3`). `Math.round` rounds to the nearest whole number, and -2.7 is nearer to -3, so it returns `-3`.

## java-basic-029
topic: operators-control
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            if (i % 2 == 0) continue;
            if (i > 7) break;
            sum += i;
        }
        System.out.println(sum);
    }
}
```

- A: `25`
- B: `9`
- C: `16`
- D: `12`

> `continue` skips the rest of the body for even `i`, so only odd numbers reach the second test. `1, 3, 5, 7` are added (7 is not greater than 7); at `i == 9` the `break` ends the loop. The sum is `1 + 3 + 5 + 7 = 16`.

## java-basic-030
topic: operators-control
answer: B

What happens when you compile and run this program?

```java
public class Main {
    public static void main(String[] args) {
        int x = 5;
        if (x = 10) {
            System.out.println("ten");
        } else {
            System.out.println("not ten");
        }
    }
}
```

- A: It prints `ten`.
- B: It fails to compile.
- C: It prints `not ten`.
- D: It throws an exception at run time.

> `x = 10` is an assignment, and its value is the `int` 10. An `if` condition must be a `boolean`, and Java never converts an `int` to `boolean`, so this is a compile error ("incompatible types: int cannot be converted to boolean"). The comparison is `x == 10`.

## java-basic-031
topic: operators-control
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(-7 % 3 + " " + 7 / -2);
    }
}
```

- A: `2 -4`
- B: `-1 -4`
- C: `2 -3`
- D: `-1 -3`

> `%` and `/` bind tighter than `+`, so both are computed before the concatenation. Java's integer division truncates towards zero, so `7 / -2` is `-3`, not `-4`. The remainder takes the sign of the dividend, so `-7 % 3` is `-1`, not `2` (the answer Python would give).

## java-basic-032
topic: strings
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("abc");
        sb.append("d").reverse();
        sb.insert(0, "x");
        System.out.println(sb);
    }
}
```

- A: `xdcba`
- B: `xabcd`
- C: `dcbax`
- D: `abcdx`

> Unlike `String`, a `StringBuilder` is mutable: `append`, `reverse` and `insert` change the builder itself (and return it for chaining). After `append("d")` it holds `abcd`, `reverse()` turns that into `dcba`, and `insert(0, "x")` puts `x` at the front.

## java-basic-033
topic: strings
answer: B, C, D

Given these declarations, which of the expressions below are `true`? Select all that apply.

```java
String a = "hello";
String b = new String("hello");
String c = b;
```

- A: `a == b`
- B: `a.equals(b)`
- C: `b == c`
- D: `a.equals(c)`
- E: `a == c`

> `==` on references asks whether two variables refer to the same object; `equals` asks whether two strings hold the same characters. `new String("hello")` always creates a new object, so `b` is a different object from the literal `a`: `a == b` and `a == c` are false. `c = b` copies the reference, so `b == c` is true. All three hold the characters `hello`, so both `equals` calls are true.

## java-basic-034
topic: strings
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String a = "12";
        int b = 3;
        System.out.println(a + b + " " + (Integer.parseInt(a) + b));
    }
}
```

- A: `15 15`
- B: `123 123`
- C: `123 15`
- D: `15 123`

> `a + b` starts with a `String`, so `+` concatenates and gives `"123"`. Inside the parentheses, `Integer.parseInt(a)` turns `"12"` into the `int` 12, and `12 + b` is integer addition, `15`, which is then appended to the string.

## java-basic-035
topic: arrays
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        int s = 0;
        for (int i = 0; i < m.length; i++) {
            s += m[i][m[i].length - 1];
        }
        System.out.println(m.length + " " + m[0].length + " " + s);
    }
}
```

- A: `3 2 9`
- B: `2 3 9`
- C: `2 3 5`
- D: `6 3 9`

> A 2D array is an array of rows. `m.length` is the number of rows, 2, and `m[0].length` is the length of the first row, 3. The loop adds the last element of each row, `m[0][2] + m[1][2]`, which is `3 + 6 = 9`.

## java-basic-036
topic: arrays
answer: D

Given `int[] arr = {1, 2, 3};` and `import java.util.Arrays;`, which statement prints `[1, 2, 3]`?

- A: `System.out.println(arr);`
- B: `System.out.println(arr.toString());`
- C: `System.out.println(String.valueOf(arr));`
- D: `System.out.println(Arrays.toString(arr));`

> Arrays do not override `toString()`, so A, B and C all use `Object.toString()` and print a type code and hash such as `[I@1b6d3586`. `Arrays.toString(arr)` is the helper that lists the elements in brackets.

## java-basic-037
topic: arrays
answer: A
run: java

What does this program print?

```java
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] a = {3, 1, 2};
        int[] b = a.clone();
        Arrays.sort(b);
        System.out.println(a[0] + " " + b[0]);
    }
}
```

- A: `3 1`
- B: `1 1`
- C: `3 3`
- D: `1 3`

> `clone()` creates a new array with a copy of the elements, so `a` and `b` are separate arrays. `Arrays.sort(b)` sorts `b` in place, making it `{1, 2, 3}`, and leaves `a` as `{3, 1, 2}`. Had the code written `int[] b = a;`, sorting would have changed both.

## java-basic-038
topic: oop
answer: C
run: java

What does this program print?

```java
public class Main {
    static String f(int x) { return "int"; }
    static String f(long x) { return "long"; }
    static String f(double x) { return "double"; }

    public static void main(String[] args) {
        System.out.println(f(5) + " " + f(5L) + " " + f(5.0f));
    }
}
```

- A: `int int double`
- B: `long long double`
- C: `int long double`
- D: It does not compile.

> The compiler picks the overload whose parameter type matches the argument most closely. `5` is an `int`, so `f(int)`; `5L` is a `long`, so `f(long)`. `5.0f` is a `float`: there is no `f(float)`, and a `float` cannot be converted to `int` or `long` without a cast, but it widens to `double`, so `f(double)` is chosen.

## java-basic-039
topic: oop
answer: A

This class does not compile. Why?

```java
public class Main {
    int count = 0;

    public static void main(String[] args) {
        count++;
        System.out.println(count);
    }
}
```

- A: A static method cannot use an instance field without an object.
- B: A field cannot be incremented with `++`, only a local variable can.
- C: A field must be given its starting value inside a constructor.
- D: `main` may only use variables that are declared inside it.

> `count` is an instance field: every `Main` object has its own. `main` is `static`, so it runs without any `Main` object, and `count` alone names no particular object's field ("non-static variable count cannot be referenced from a static context"). Making the field `static`, or creating an object and using `obj.count`, fixes it. `main` can use static fields freely, and `++` works on fields.

## java-basic-040
topic: oop
answer: D
run: java

What does this program print?

```java
class Item {
    int qty = 5;

    Item() {
        qty = qty * 2;
    }

    Item(int q) {
        this();
        qty += q;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Item(3).qty);
    }
}
```

- A: `8`
- B: `10`
- C: `16`
- D: `13`

> `new Item(3)` runs `Item(int)`, whose first statement `this()` calls the no-argument constructor before the rest of its body. The field initialiser sets `qty` to 5, `Item()` doubles it to 10, and control returns to `Item(int)`, which adds 3: 13.

## java-basic-041
topic: oop
answer: B

A field is declared `private` in class `Account`. Which code can read it directly by name?

- A: Code in `Account` and in any subclass of `Account`.
- B: Only code written inside the `Account` class itself.
- C: Code in any class in the same package as `Account`.
- D: Code in any class that holds a reference to an `Account`.

> `private` is the narrowest access level: the member is visible only inside the class that declares it. Subclasses need `protected` (or wider), and same-package access is what the default, no-modifier level gives. Other classes reach a private field only through methods the class chooses to expose, such as a getter.

## java-basic-042
topic: inheritance
answer: D
run: java

What does this program print?

```java
class Base {
    String name() { return "Base"; }
    String greet() { return "Hi " + name(); }
}

class Child extends Base {
    String name() { return "Child"; }
    String greet() { return super.greet() + "!"; }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Child().greet());
    }
}
```

- A: `Hi Base!`
- B: `Hi Child`
- C: `Hi Base`
- D: `Hi Child!`

> `Child.greet()` calls `super.greet()`, which runs `Base`'s version. Inside it, `name()` is an ordinary call on the same object, and that object is a `Child`, so the override `Child.name()` runs and gives `Hi Child`. Back in `Child.greet()`, `!` is appended. `super` only selects which `greet` runs; it does not switch off overriding for the calls inside it.

## java-basic-043
topic: inheritance
answer: C

Given these classes, which line does not compile?

```java
abstract class Shape {
    abstract double area();
}

class Square extends Shape {
    double side;

    Square(double side) {
        this.side = side;
    }

    double area() {
        return side * side;
    }
}
```

- A: `Shape s = new Square(2);`
- B: `Square q = new Square(2);`
- C: `Shape s = new Shape();`
- D: `Shape[] all = new Shape[3];`

> An abstract class cannot be instantiated, so `new Shape()` is a compile error. A variable of an abstract type can still refer to an object of a concrete subclass (A), and `new Shape[3]` creates an array of three `null` references, not `Shape` objects, so it is allowed (D).

## java-basic-044
topic: inheritance
answer: A

What happens when you compile and run this program?

```java
class Animal { }
class Dog extends Animal { }
class Cat extends Animal { }

public class Main {
    public static void main(String[] args) {
        Animal a = new Cat();
        Dog d = (Dog) a;
        System.out.println("done");
    }
}
```

- A: It throws a `ClassCastException`.
- B: It prints `done`.
- C: It fails to compile.

> The compiler allows a cast from `Animal` down to `Dog`, because an `Animal` variable might hold a `Dog`. The check happens at run time: this object is actually a `Cat`, which is not a `Dog`, so the cast throws `ClassCastException` before `done` is printed. `a instanceof Dog` would test it safely first.

## java-basic-045
topic: exceptions
answer: B
run: java

What does this program print?

```java
public class Main {
    static String log = "";

    static void inner() {
        try {
            log += "1";
            throw new IllegalStateException();
        } finally {
            log += "2";
        }
    }

    public static void main(String[] args) {
        try {
            inner();
            log += "3";
        } catch (RuntimeException e) {
            log += "4";
        }
        System.out.println(log);
    }
}
```

- A: `1234`
- B: `124`
- C: `12`
- D: `14`

> `inner` appends `1` and throws. It has no `catch`, but its `finally` still runs and appends `2` before the exception leaves the method. In `main`, the exception skips `log += "3"` and is caught by `catch (RuntimeException e)`, since `IllegalStateException` is a `RuntimeException`, which appends `4`.

## java-basic-046
topic: exceptions
answer: D

What happens when you compile and run this program?

```java
public class Main {
    public static void main(String[] args) {
        try {
            System.out.println(10 / 0);
        } catch (Exception e) {
            System.out.println("general");
        } catch (ArithmeticException e) {
            System.out.println("math");
        }
    }
}
```

- A: It prints `general`.
- B: It prints `math`.
- C: It prints `general` and then `math`.
- D: It fails to compile.

> `catch` clauses are tried in order, and `ArithmeticException` is a subclass of `Exception`, so the first clause would always catch it and the second could never run. Java rejects an unreachable `catch` at compile time ("exception ArithmeticException has already been caught"). Putting the more specific `catch` first fixes it.

## java-basic-047
topic: collections
answer: C
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> m = new TreeMap<>();
        m.put("pear", 3);
        m.put("apple", 5);
        m.put("fig", 1);
        m.put("apple", 2);
        System.out.println(m);
    }
}
```

- A: `{pear=3, apple=5, fig=1}`
- B: `{apple=5, fig=1, pear=3}`
- C: `{apple=2, fig=1, pear=3}`
- D: `{pear=3, apple=2, fig=1}`

> A map holds one value per key, so the second `put("apple", 2)` replaces the 5 rather than adding an entry. A `TreeMap` keeps its keys sorted (alphabetically for strings), not in insertion order, so it prints `apple`, `fig`, `pear`.

## java-basic-048
topic: collections
answer: A
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(10);
        list.add("x");
        list.add(0, "y");
        System.out.println(list.size() + " " + list);
    }
}
```

- A: `2 [y, x]`
- B: `2 [x, y]`
- C: `10 [y, x]`
- D: `12 [y, x]`

> The `10` passed to the `ArrayList` constructor is its initial capacity, room reserved inside, not elements: the list starts empty with size 0. `add("x")` appends, and `add(0, "y")` inserts at index 0, shifting `x` right. Two elements, in the order `[y, x]`.

## java-basic-049
topic: memory
answer: C

Given `String s = null;`, which of these expressions throws a `NullPointerException` when it is evaluated?

- A: `s + "!"`
- B: `"x".equals(s)`
- C: `s.equals("x")`
- D: `s == null`

> Calling a method on a `null` reference throws, and `s.equals("x")` calls `equals` on `s`. The others never do: string concatenation turns `null` into the text `null` (giving `"null!"`), `"x".equals(s)` calls the method on the literal and simply returns `false` for a `null` argument, and `==` only compares references.

## java-basic-050
topic: memory
answer: B
run: java

What does this program print?

```java
class Card {
    int rank;

    Card(int rank) {
        this.rank = rank;
    }
}

public class Main {
    public static void main(String[] args) {
        Card a = new Card(7);
        Card b = new Card(7);
        Card c = a;
        System.out.println((a == b) + " " + a.equals(b) + " " + (a == c));
    }
}
```

- A: `false true true`
- B: `false false true`
- C: `true true true`
- D: `false false false`

> `a` and `b` are two separate objects, so `a == b` is false. `Card` does not override `equals`, so it inherits `Object.equals`, which is the same identity test as `==`: also false, even though the ranks match. `c = a` copies the reference, so `a == c` is true.

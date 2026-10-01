---
skill: java
level: basic
---

## java-basic-001
topic: syntax-types
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        double c = a / b;
        System.out.println(c);
    }
}
```

- A: `3.5`
- B: `3.0`
- C: `3`
- D: It does not compile.

> `a / b` divides two `int`s, so it is integer division and gives `3`; only then is the result widened to `double` for the assignment, and a `double` prints as `3.0`. Widening `int` to `double` needs no cast, so it compiles. To get `3.5`, one operand must be a `double` before the division, e.g. `(double) a / b`.

## java-basic-002
topic: syntax-types
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        char c = 'A';
        c += 2;
        System.out.println(c);
    }
}
```

- A: `67`
- B: It does not compile.
- C: `A2`
- D: `C`

> A compound assignment such as `c += 2` includes an implicit cast back to the variable's type, so it compiles and stores the character two code points after `'A'`, which is `'C'`. `println(char)` prints the character, not its number. Writing `c = c + 2;` instead would not compile, because `c + 2` is an `int`.

## java-basic-003
topic: syntax-types
answer: B, D, E

Which of these declarations compile? Select all that apply.

- A: `int x = 10L;`
- B: `long y = 10;`
- C: `float f = 1.5;`
- D: `double d = 3;`
- E: `byte b = 100;`
- F: `char ch = "a";`

> Widening needs no cast: an `int` literal can initialise a `long` (B) or a `double` (D). A constant `int` that fits the smaller type may initialise a `byte` (E: 100 is within -128 to 127). `10L` is a `long`, and narrowing it to `int` needs a cast (A); `1.5` is a `double` literal, so a `float` needs `1.5f` (C); `"a"` is a `String`, not a `char`, which would be `'a'` (F).

## java-basic-004
topic: operators-control
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int i = 5;
        int j = i++ + ++i;
        System.out.println(i + " " + j);
    }
}
```

- A: `7 12`
- B: `7 11`
- C: `6 11`
- D: `7 13`

> Operands are evaluated left to right. `i++` yields the old value 5 and then makes `i` 6; `++i` makes `i` 7 and yields the new value 7. So `j` is `5 + 7 = 12`, and `i` ends at 7.

## java-basic-005
topic: operators-control
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int day = 2;
        String s = "";
        switch (day) {
            case 1: s += "a";
            case 2: s += "b";
            case 3: s += "c";
                break;
            case 4: s += "d";
            default: s += "e";
        }
        System.out.println(s);
    }
}
```

- A: `b`
- B: `bce`
- C: `bc`
- D: `bcde`

> The `switch` jumps to `case 2` and appends `"b"`. There is no `break` there, so execution falls through into `case 3` and appends `"c"`, where the `break` leaves the switch. `case 4` and `default` never run.

## java-basic-006
topic: operators-control
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int count = 0;
        boolean r = (count > 0) && (++count > 0);
        boolean s = (count == 0) || (++count > 0);
        System.out.println(r + " " + s + " " + count);
    }
}
```

- A: `false true 1`
- B: `false true 0`
- C: `true true 2`
- D: `false false 0`

> `&&` and `||` short-circuit. In the first line the left side is already `false`, so `&&` never evaluates `++count`. In the second the left side is already `true`, so `||` never evaluates it either. `count` is still 0, `r` is `false` and `s` is `true`.

## java-basic-007
topic: strings
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String s = "java";
        s.replace('a', 'o');
        s.concat("!");
        System.out.println(s);
    }
}
```

- A: `java`
- B: `jovo`
- C: `java!`
- D: `jovo!`

> Strings are immutable. `replace('a', 'o')` and `concat("!")` each return a new `String`, and this code throws both results away. `s` still refers to the original `"java"`. Writing `s = s.replace('a', 'o');` would keep the result.

## java-basic-008
topic: strings
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(1 + 2 + "3" + 4 + 5);
    }
}
```

- A: `15`
- B: `12345`
- C: `339`
- D: `3345`

> `+` is evaluated left to right. `1 + 2` is integer addition, giving `3`. From the moment a `String` is involved, `+` means concatenation: `3 + "3"` is `"33"`, then `"334"`, then `"3345"`. The `4` and `5` are never added to each other, because by then the left operand is already a `String`.

## java-basic-009
topic: strings
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String s = "programming";
        System.out.println(s.substring(3, 7) + " " + s.indexOf('m'));
    }
}
```

- A: `gramm 6`
- B: `gram 7`
- C: `gram 6`
- D: `gramm 7`

> String indexes start at 0, and `substring(begin, end)` includes `begin` but stops before `end`. In `"programming"` index 3 is `g`, so `substring(3, 7)` takes indexes 3, 4, 5, 6: `"gram"`. The first `m` is at index 6, which is what `indexOf('m')` returns.

## java-basic-010
topic: arrays
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int[] a = new int[3];
        String[] s = new String[2];
        boolean[] b = new boolean[1];
        System.out.println(a[1] + " " + s[0] + " " + b[0]);
    }
}
```

- A: `0 null false`
- B: `0 0 false`
- C: `null null null`
- D: It throws a `NullPointerException`.

> A new array's elements start at their type's default value: `0` for `int`, `null` for any reference type such as `String`, and `false` for `boolean`. String concatenation turns a `null` reference into the text `null` rather than throwing, so nothing fails.

## java-basic-011
topic: arrays
answer: B

What happens when this program runs?

```java
public class Main {
    public static void main(String[] args) {
        int[] nums = {4, 8, 15};
        for (int i = 0; i <= nums.length; i++) {
            System.out.print(nums[i] + " ");
        }
    }
}
```

- A: It prints `4 8 15` and ends normally.
- B: It prints `4 8 15` and then throws an `ArrayIndexOutOfBoundsException`.
- C: It throws an `ArrayIndexOutOfBoundsException` before printing anything.
- D: It prints `4 8 15 0` and ends normally.

> The valid indexes are 0 to `nums.length - 1`, i.e. 0 to 2. The condition `i <= nums.length` lets the loop run once more with `i == 3`; the first three iterations print normally, and reading `nums[3]` then throws `ArrayIndexOutOfBoundsException`. Java checks every array access, so it never reads a default `0` past the end. The fix is `i < nums.length`.

## java-basic-012
topic: arrays
answer: D
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = a;
        b[0] = 9;
        System.out.println(a[0] + " " + (a == b));
    }
}
```

- A: `1 false`
- B: `1 true`
- C: `9 false`
- D: `9 true`

> An array is an object, and `int[] b = a;` copies the reference, not the elements. `a` and `b` refer to the same array, so the write through `b` is visible through `a`, and `a == b` is `true` because both hold the same reference. `a.clone()` would have made an independent copy.

## java-basic-013
topic: oop
answer: C
run: java

What does this program print?

```java
class Counter {
    static int total = 0;
    int mine = 0;

    void hit() {
        total++;
        mine++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        a.hit();
        a.hit();
        b.hit();
        System.out.println(a.mine + " " + b.mine + " " + Counter.total);
    }
}
```

- A: `2 1 2`
- B: `3 3 3`
- C: `2 1 3`
- D: `2 1 0`

> Each object has its own copy of the instance field `mine`, so `a` counts its two calls and `b` its one. There is only one `static` field `total` for the whole class, shared by both objects, so it counts all three calls.

## java-basic-014
topic: oop
answer: C

What happens when you compile and run this program?

```java
class Point {
    int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point();
        System.out.println(p.x);
    }
}
```

- A: It prints `0`.
- B: It prints `null`.
- C: It fails to compile.
- D: It throws a `NullPointerException`.

> Java supplies a no-argument default constructor only when a class declares no constructors at all. `Point` declares `Point(int, int)`, so there is no `Point()`, and `new Point()` is a compile error. Adding `Point() { }` explicitly, or calling `new Point(0, 0)`, would fix it.

## java-basic-015
topic: oop
answer: A
run: java

What does this program print?

```java
class Box {
    int size;

    Box(int size) {
        size = size;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Box(5).size);
    }
}
```

- A: `0`
- B: `5`
- C: It does not compile.

> Inside the constructor the parameter `size` shadows the field `size`, so `size = size;` assigns the parameter to itself and never touches the field. It is legal code, so it compiles, and the field keeps its default `0`. `this.size = size;` is what was meant.

## java-basic-016
topic: inheritance
answer: B
run: java

What does this program print?

```java
class Animal {
    String sound() {
        return "...";
    }
}

class Dog extends Animal {
    String sound() {
        return "Woof";
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        System.out.println(a.sound());
    }
}
```

- A: `...`
- B: `Woof`
- C: It does not compile.

> A `Dog` is an `Animal`, so the assignment compiles. Which overriding method runs is decided at run time by the object's actual class, not by the variable's declared type: the object is a `Dog`, so `Dog.sound()` runs.

## java-basic-017
topic: inheritance
answer: A
run: java

What does this program print?

```java
class A {
    A() { System.out.print("A"); }
}

class B extends A {
    B() { System.out.print("B"); }
}

class C extends B {
    C() { System.out.print("C"); }
}

public class Main {
    public static void main(String[] args) {
        new C();
        System.out.println();
    }
}
```

- A: `ABC`
- B: `CBA`
- C: `C`
- D: `BC`

> Every constructor begins by calling its superclass constructor (an implicit `super()` here) before running its own body. So `C()` first runs `B()`, which first runs `A()`: the bodies finish from the top of the hierarchy down, printing `A`, then `B`, then `C`.

## java-basic-018
topic: inheritance
answer: B

The class `Derived` below does not compile. Why?

```java
class Base {
    public void show() {
        System.out.println("base");
    }
}

class Derived extends Base {
    void show() {
        System.out.println("derived");
    }
}
```

- A: An overriding method must call `super.show()` before doing anything else.
- B: An overriding method cannot have weaker access than the method it overrides.
- C: A class that extends another class must declare its own constructor.
- D: A method that overrides another must be marked with `@Override`.

> `Base.show()` is `public`; `Derived.show()` has no modifier, which means package-private, a weaker access level. An override may keep or widen access, never narrow it, because code holding a `Base` reference must be able to call `show()` on any subclass. Calling `super` is optional, the default constructor is supplied automatically, and `@Override` is a recommended check, not a requirement.

## java-basic-019
topic: exceptions
answer: D
run: java

What does this program print?

```java
public class Main {
    static int f() {
        try {
            return 1;
        } finally {
            System.out.print("F");
        }
    }

    public static void main(String[] args) {
        System.out.println(f());
    }
}
```

- A: `1`
- B: `1F`
- C: `F`
- D: `F1`

> A `finally` block runs even when the `try` block returns. `println(f())` must call `f()` first to get its argument: inside `f`, `return 1` records the value, the `finally` block prints `F`, and only then does `f` return 1, which `println` prints after it.

## java-basic-020
topic: exceptions
answer: A
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String s = "";
        try {
            int[] a = new int[2];
            a[2] = 5;
            s += "x";
        } catch (ArrayIndexOutOfBoundsException e) {
            s += "y";
        } catch (Exception e) {
            s += "z";
        } finally {
            s += "f";
        }
        System.out.println(s);
    }
}
```

- A: `yf`
- B: `xyf`
- C: `yzf`
- D: `y`

> `a[2]` is out of bounds for an array of length 2, so the exception is thrown before `s += "x"` runs. Only the first matching `catch` runs, here `ArrayIndexOutOfBoundsException`, which appends `y`; the general `Exception` handler is skipped. The `finally` block always runs and appends `f`.

## java-basic-021
topic: exceptions
answer: C

Which of these is a checked exception, one the compiler makes you either catch or declare with `throws`?

- A: `NullPointerException`
- B: `ArithmeticException`
- C: `IOException`
- D: `ArrayIndexOutOfBoundsException`

> `IOException` extends `Exception` but not `RuntimeException`, so it is checked: a method that can throw it must catch it or declare `throws IOException`. The other three extend `RuntimeException`, so they are unchecked and the compiler does not force you to handle them.

## java-basic-022
topic: collections
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(10, 20, 30, 40));
        list.remove(1);
        list.remove(Integer.valueOf(30));
        System.out.println(list);
    }
}
```

- A: `[10, 20, 40]`
- B: `[20, 40]`
- C: It throws an `IndexOutOfBoundsException`.
- D: `[10, 40]`

> `List` has two `remove` methods. `remove(1)` passes an `int`, so it calls `remove(int index)` and removes the element at index 1, which is `20`. `remove(Integer.valueOf(30))` passes an object, so it calls `remove(Object)` and removes the element equal to `30`. What is left is `[10, 40]`.

## java-basic-023
topic: collections
answer: B
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Set<String> set = new HashSet<>();
        set.add("a");
        set.add("b");
        set.add("a");
        boolean added = set.add("b");
        System.out.println(set.size() + " " + added);
    }
}
```

- A: `4 true`
- B: `2 false`
- C: `2 true`
- D: `3 false`

> A `Set` holds each element at most once. Adding `"a"` or `"b"` a second time leaves the set unchanged, so it ends with 2 elements. `add` reports whether the set changed: it returns `false` for a duplicate, so `added` is `false`.

## java-basic-024
topic: collections
answer: D

Which statement about `List` and `Set` in `java.util` is true?

- A: A `Set` keeps elements in the order they were added; a `List` does not.
- B: Both reject duplicate elements, but only a `List` can hold `null`.
- C: A `Set` can be read by position with `get(int)`, just like a `List`.
- D: A `List` allows duplicates and has indexes; a `Set` has neither.

> A `List` is an ordered sequence: it allows duplicates and you read elements by index with `get(int)`. A `Set` holds each element once and has no index, so it has no `get(int)`. The `Set` interface promises no particular order (`HashSet` keeps none), while a `List` always keeps its order. A `HashSet` can also hold a `null`.

## java-basic-025
topic: memory
answer: C
run: java

What does this program print?

```java
public class Main {
    static void change(int n, int[] arr) {
        n = 100;
        arr[0] = 100;
    }

    public static void main(String[] args) {
        int n = 1;
        int[] arr = {1};
        change(n, arr);
        System.out.println(n + " " + arr[0]);
    }
}
```

- A: `100 100`
- B: `1 1`
- C: `1 100`
- D: `100 1`

> Java passes every argument by value. The method gets a copy of the `int`, so assigning to its `n` does not affect the caller's `n`. For the array it gets a copy of the reference, which still points at the same array object, so writing `arr[0]` changes the array the caller sees.

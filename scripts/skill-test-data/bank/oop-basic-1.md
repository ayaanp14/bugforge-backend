---
skill: oop
level: basic
---

## oop-basic-001
topic: classes-objects
answer: C
run: java

What does this Java program print?

```java
class Lamp {
    boolean on;
}

public class Main {
    public static void main(String[] args) {
        Lamp x = new Lamp();
        Lamp y = x;
        Lamp z = new Lamp();
        y.on = true;
        z = y;
        z.on = false;
        System.out.println(x.on + " " + y.on + " " + (z == x));
    }
}
```

- A: `true true false`
- B: `false true false`
- C: `false false true`
- D: `false false false`

> `new` runs twice, so there are two `Lamp` objects. `y = x` copies the
> reference, not the object, so `x` and `y` name the first lamp. `z = y` then
> points `z` at that same first lamp (the second one is left unreferenced), so
> `z.on = false` switches off the lamp that `x` and `y` also name. Both print
> `false`, and `z == x` compares references, which are now the same: `true`.

## oop-basic-002
topic: classes-objects
answer: A
run: python

What does this Python program print?

```python
class Ticket:
    issued = 0

    def __init__(self, seat):
        self.seat = seat
        Ticket.issued += 1


a = Ticket("A1")
b = Ticket("B2")
a.issued = 10
print(Ticket.issued, a.issued, b.issued)
```

- A: `2 10 2`
- B: `10 10 10`
- C: `2 2 2`
- D: `0 10 1`

> `issued` is a class attribute, and the constructor updates it through the
> class (`Ticket.issued += 1`), so after two objects it is 2. `a.issued = 10`
> does not touch the class: assigning through an instance creates a new
> attribute on `a` alone, which hides the class's value when read through `a`.
> `b` has no attribute of its own, so `b.issued` still finds the class's 2.

## oop-basic-003
topic: classes-objects
answer: A, C, E

```python
class Money:
    def __init__(self, amount):
        self.amount = amount

    def __eq__(self, other):
        return self.amount == other.amount


x = Money(10)
y = Money(10)
z = x
```

After these lines run, which of these Python expressions are `True`? Select all that apply.

- A: `x == y`
- B: `x is y`
- C: `z is x`
- D: `y is z`
- E: `z == y`

> `==` calls `__eq__`, which this class defines as "same amount", so any two
> `Money(10)` objects are equal: `x == y` and `z == y` are `True`. `is` asks
> whether two names refer to the same object. `x` and `y` were built by two
> separate calls, so `x is y` is `False`; `z = x` copies the reference, so
> `z is x` is `True` and `y is z` is `False`.

## oop-basic-004
topic: classes-objects
answer: D

A Java class `BankAccount` declares two instance fields, `owner` and `balance`, and one `static` field, `bankName`. A program creates 1,000 `BankAccount` objects. How many copies of each field exist?

- A: 1,000 of each of the three fields
- B: 1 of each field, shared by every object
- C: 1 of `owner` and `balance`, and 1,000 of `bankName`
- D: 1,000 of `owner` and `balance`, and 1 of `bankName`

> Every object gets its own copy of each instance field, so there are 1,000
> owners and 1,000 balances. A `static` field belongs to the class rather than
> to any object: there is exactly one `bankName`, shared by all 1,000 accounts,
> and it exists even before the first account is created.

## oop-basic-005
topic: encapsulation
answer: B
run: java

What does this Java program print?

```java
class Scores {
    private int[] marks = {70, 80};

    public int[] getMarks() {
        return marks;
    }
}

public class Main {
    public static void main(String[] args) {
        Scores s = new Scores();
        int[] m = s.getMarks();
        m[0] = 0;
        System.out.println(s.getMarks()[0]);
    }
}
```

- A: `70`
- B: `0`
- C: It does not compile, because `marks` is `private`.
- D: It throws an `IllegalAccessException`.

> `private` stops other classes from naming the field, and `Main` never does:
> it only calls the public getter, so the program compiles and runs. But the
> getter returns a reference to the same array the object holds, so
> `m[0] = 0` changes the object's own data and the next read sees `0`. The
> encapsulation leaks; returning a copy (`marks.clone()`) would have kept it.

## oop-basic-006
topic: encapsulation
answer: D
run: python

What does this Python program print?

```python
class Vault:
    def __init__(self):
        self.__pin = 1234
        self._hint = "year"


v = Vault()
v.__pin = 0
print(v._Vault__pin, v.__pin, v._hint)
```

- A: `0 0 year`
- B: It raises `AttributeError` at `v.__pin = 0`.
- C: `1234 1234 year`
- D: `1234 0 year`

> Python has no `private`. Inside a class body, a name with two leading
> underscores is mangled: `self.__pin` is stored as `_Vault__pin`. Mangling
> happens only in code written inside the class, so `v.__pin = 0` at the top
> level simply creates a second, unrelated attribute named `__pin`. The
> original is untouched and still readable as `v._Vault__pin`; `_hint` is an
> ordinary attribute with a "please don't" underscore.

## oop-basic-007
topic: encapsulation
answer: C

```java
class Thermostat {
    private int target = 20;

    public void setTarget(int t) {
        if (t >= 10 && t <= 30) {
            target = t;
        }
    }

    public int getTarget() {
        return target;
    }
}
```

Compared with declaring `public int target` and no methods, what does this Java class guarantee?

- A: Reading `target` is faster, because the compiler inlines the getter.
- B: Every `Thermostat` object shares one `target`, so they never disagree.
- C: Other classes can change `target` only through `setTarget`, so it stays 10–30.
- D: Subclasses can no longer replace how `target` is stored or read.

> With the field `private`, the only way code outside the class can change it
> is `setTarget`, and that method rejects anything outside 10 to 30, so no
> caller can leave a thermostat at, say, 45. Speed is not the point (B is
> what `static` would do, and it is not declared here), and `getTarget` and
> `setTarget` are ordinary public methods a subclass can still override.

## oop-basic-008
topic: encapsulation
answer: B

In Java, class `Card` in package `pay` declares `int limit;` with no access modifier. Which code can read `card.limit` directly?

- A: Only code inside the `Card` class itself.
- B: Any class in package `pay`, and nothing outside it.
- C: Any class, in any package, that imports `pay.Card`.
- D: `Card` and its subclasses, in whatever package they are.

> No modifier means package-private access: every class in the same package
> can use the field, and no class outside the package can, not even a
> subclass. Option A describes `private`, and D is closer to `protected`
> (which also includes the package). Importing a class never widens access.

## oop-basic-009
topic: constructors
answer: B
run: java

What does this Java program print?

```java
class Vehicle {
    Vehicle(String kind) {
        System.out.print("V:" + kind + " ");
    }
}

class Car extends Vehicle {
    Car() {
        super("car");
        System.out.print("C ");
    }
}

class SportsCar extends Car {
    SportsCar() {
        System.out.print("S");
    }
}

public class Main {
    public static void main(String[] args) {
        new SportsCar();
        System.out.println();
    }
}
```

- A: `S C V:car`
- B: `V:car C S`
- C: `S`
- D: `V:car S`

> Every constructor begins by running its superclass's constructor: `Car`
> says so explicitly with `super("car")`, and `SportsCar()` gets an implicit
> `super()` that calls `Car()`. So `Vehicle`'s body runs first, then the rest
> of `Car`'s, then `SportsCar`'s: the object is built from the base class
> down, and each body finishes before the subclass's body continues.

## oop-basic-010
topic: constructors
answer: C
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
using namespace std;

struct Base {
    Base() { cout << "B"; }
    ~Base() { cout << "~B"; }
};

struct Derived : Base {
    Derived() { cout << "D"; }
    ~Derived() { cout << "~D"; }
};

int main() {
    {
        Derived d;
    }
    cout << endl;
    return 0;
}
```

- A: `DB~D~B`
- B: `BD~B~D`
- C: `BD~D~B`
- D: `DB~B~D`

> Construction runs from the base class down: the `Base` part of `d` is built
> before `Derived`'s constructor body runs. Destruction runs in exactly the
> reverse order when `d` goes out of scope at the closing brace: `~Derived`
> first, then `~Base`. A derived part is always torn down while the base it
> stands on still exists.

## oop-basic-011
topic: constructors
answer: A

```java
class Engine {
    Engine(int hp) {
        System.out.println("engine " + hp);
    }
}

class Turbo extends Engine {
    Turbo() {
        System.out.println("turbo");
    }
}
```

`Turbo` does not compile. Why?

- A: `Turbo()` implicitly begins with `super()`, and `Engine` has no constructor that takes no arguments.
- B: Constructors are not inherited, so `Turbo` must also declare a constructor `Turbo(int hp)`.
- C: `Engine`'s constructor has no `public` modifier, so a subclass is not allowed to call it.
- D: A subclass constructor cannot have an empty parameter list when its superclass's constructor has one.

> A constructor that does not start with `super(…)` or `this(…)` gets an
> implicit `super()`. Because `Engine` declares a constructor, Java gives it no
> default one, so there is no `Engine()` to call. Writing `super(100);` as the
> first line of `Turbo()` fixes it, keeping its empty parameter list (so D is
> wrong), with no `Turbo(int)` needed (B). Package-private access is enough
> for a subclass in the same package (C).

## oop-basic-012
topic: constructors
answer: D

A `Fraction` class must never hold a denominator of 0. Where should the check go so that no `Fraction` object can ever exist with one?

- A: In a `validate()` method that every caller is told to call straight after `new`.
- B: In `toString()`, so that a bad fraction is caught before it is ever printed.
- C: In each method that divides, so the division is skipped when the denominator is 0.
- D: In the constructor, which throws when the denominator is 0, with the field kept `private`.

> The constructor is the one piece of code every new object passes through, so
> a check there (with the field private, so nothing changes it afterwards)
> means an invalid `Fraction` is never created at all. A separate `validate()`
> relies on callers remembering it, and checks in `toString()` or in the
> dividing methods only notice a bad object after it already exists.

## oop-basic-013
topic: inheritance
answer: A
run: java

What does this Java program print?

```java
class Report {
    String header() {
        return "R";
    }
}

class SalesReport extends Report {
    String header() {
        return super.header() + "-S";
    }
}

class MonthlySales extends SalesReport {
    String header() {
        return super.header() + "-M";
    }
}

public class Main {
    public static void main(String[] args) {
        Report r = new MonthlySales();
        System.out.println(r.header());
    }
}
```

- A: `R-S-M`
- B: `R-M`
- C: `M`
- D: `R`

> The object is a `MonthlySales`, so its `header()` runs. `super.header()`
> calls the version in the direct superclass, `SalesReport`, not the top of
> the chain; that version in turn calls `Report`'s. The results come back as
> `"R"`, then `"R-S"`, then `"R-S-M"`. The declared type `Report` only decides
> that `header()` may be called.

## oop-basic-014
topic: inheritance
answer: C
run: python

What does this Python program print?

```python
class Account:
    fee = 10

    def charge(self, amount):
        return amount + self.fee


class Premium(Account):
    fee = 0


class Student(Account):
    pass


print(Account().charge(100), Premium().charge(100), Student().charge(100))
```

- A: `110 110 110`
- B: `110 100 100`
- C: `110 100 110`
- D: It raises `AttributeError`, because `Premium` defines no `charge`.

> `Premium` and `Student` inherit `charge` from `Account`. Inside it,
> `self.fee` is looked up on the object at the moment of the call: first the
> object, then its class, then the parent classes. For a `Premium` that finds
> `Premium.fee`, which is 0; a `Student` has no `fee` of its own, so the lookup
> reaches `Account.fee`, which is 10.

## oop-basic-015
topic: inheritance
answer: A

```java
class Parent {
    private int secret = 1;
    protected int shared = 2;
    int pkg = 3;
    public int open = 4;
}

class Child extends Parent {
    int sum() {
        return secret + shared + pkg + open;
    }
}
```

Both classes are in the same Java package, and `Child` does not compile. Which field is the reason?

- A: `secret`
- B: `shared`
- C: `pkg`
- D: `open`

> A `private` member can be named only by code inside the class that declares
> it, so `Child` cannot write `secret`, even though every `Child` object still
> carries that field. `protected` is visible to subclasses (and to the same
> package), package-private `pkg` is visible within the package, and `public`
> is visible everywhere.

## oop-basic-016
topic: inheritance
answer: C

```java
class Employee { String id() { return "E1"; } }
class Engineer extends Employee { String stack() { return "java"; } }
class Manager extends Employee { String team() { return "core"; } }
class Intern extends Engineer { String mentor() { return "Asha"; } }
```

Given `Intern i = new Intern();`, which call does not compile?

- A: `i.id()`
- B: `i.stack()`
- C: `i.team()`
- D: `i.mentor()`

> `Intern` inherits down its own chain: `Employee` → `Engineer` → `Intern`
> (multilevel), so it has `id()`, `stack()` and its own `mentor()`. `Manager`
> is a sibling of `Engineer` under `Employee` (hierarchical inheritance), and
> nothing flows sideways between siblings, so an `Intern` has no `team()`.

## oop-basic-017
topic: polymorphism
answer: B
run: java

What does this Java program print?

```java
class Printer {
    String print(Object o) {
        return "obj";
    }

    String print(String s) {
        return "str";
    }
}

public class Main {
    public static void main(String[] args) {
        Printer p = new Printer();
        Object x = "hi";
        String y = "hi";
        System.out.println(p.print(x) + " " + p.print(y));
    }
}
```

- A: `str str`
- B: `obj str`
- C: `obj obj`
- D: `str obj`

> These are overloads, and the compiler picks an overload from the declared
> types of the arguments, not from the objects they hold at run time. `x` is
> declared `Object`, so `p.print(x)` is bound to `print(Object)` even though
> the object is a `String`; `y` is declared `String`, so the more specific
> `print(String)` wins. Run-time choice applies to overriding, not overloading.

## oop-basic-018
topic: polymorphism
answer: A
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
using namespace std;

class Base {
public:
    void hello() { cout << "Base"; }
    virtual void bye() { cout << "Base"; }
    virtual ~Base() {}
};

class Derived : public Base {
public:
    void hello() { cout << "Derived"; }
    void bye() override { cout << "Derived"; }
};

int main() {
    Derived d;
    Base* p = &d;
    p->hello();
    cout << " ";
    p->bye();
    cout << endl;
    return 0;
}
```

- A: `Base Derived`
- B: `Derived Derived`
- C: `Base Base`
- D: `Derived Base`

> In C++ a call through a base-class pointer is dispatched on the object's
> real type only if the function is `virtual`. `bye()` is virtual, so
> `p->bye()` runs `Derived::bye`. `hello()` is not, so the compiler binds
> `p->hello()` to `Base::hello` from the pointer's type, whatever `p` points at.

## oop-basic-019
topic: polymorphism
answer: C

```java
class Calc {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }   // X
}

class SciCalc extends Calc {
    int add(int a, int b) { return Math.addExact(a, b); }   // Y
    int add(int a, int b, int c) { return a + b + c; }      // Z
}
```

Which description of the methods marked X, Y and Z is correct?

- A: X and Y override `add`; Z overloads it.
- B: Y and Z override `add`; X overloads it.
- C: Y overrides `add`; X and Z overload it.
- D: Z overrides `add`; X and Y overload it.

> Overriding means a subclass redefines a method with the same name and the
> same parameter list: only Y matches `Calc`'s `add(int, int)`. X has the same
> name with different parameter types, and Z a different number of parameters;
> both are overloads, chosen by the compiler from the arguments. X is in the
> same class as the method it overloads, which is never overriding.

## oop-basic-020
topic: polymorphism
answer: D

```java
class Animal {
    String sound() { return "..."; }
}

class Dog extends Animal {
    String sound() { return "woof"; }
    String fetch() { return "ball"; }
}

// in main:
Animal a = new Dog();
System.out.println(a.sound());   // line 1
System.out.println(a.fetch());   // line 2
```

What happens?

- A: It prints `woof`, then `ball`.
- B: It prints `...`, then `ball`.
- C: Line 2 throws a `ClassCastException` when it runs.
- D: Line 2 does not compile, because `Animal` declares no `fetch()`.

> The compiler checks every call against the declared type of the reference.
> `a` is declared `Animal`, which has `sound()` but no `fetch()`, so line 2 is
> rejected before the program runs, even though the object is a `Dog`. Line 1
> alone would print `woof`, because which override runs is decided at run
> time. `((Dog) a).fetch()` would compile and return `ball`.

## oop-basic-021
topic: abstraction
answer: D
run: java

What does this Java program print?

```java
abstract class Beverage {
    String name;

    Beverage(String name) {
        this.name = name;
    }

    abstract int sugar();

    String describe() {
        return name + ":" + sugar();
    }
}

class Tea extends Beverage {
    Tea() { super("tea"); }
    int sugar() { return 2; }
}

class Coffee extends Beverage {
    Coffee() { super("coffee"); }
    int sugar() { return 1; }
}

public class Main {
    public static void main(String[] args) {
        Beverage[] order = { new Tea(), new Coffee() };
        System.out.println(order[0].describe() + " " + order[1].describe());
    }
}
```

- A: It does not compile, because an abstract class cannot have a constructor.
- B: `tea:0 coffee:0`
- C: `null:2 null:1`
- D: `tea:2 coffee:1`

> An abstract class cannot be instantiated with `new Beverage(…)`, but it can
> hold fields, constructors and concrete methods. Each subclass constructor
> passes its name up through `super(…)`, and `describe()`, written once in
> `Beverage`, calls the abstract `sugar()`, which runs the subclass's version.

## oop-basic-022
topic: abstraction
answer: A, C, D

```java
abstract class Payment {
    abstract int fee();

    int total(int amount) {
        return amount + fee();
    }
}

class Upi extends Payment {
    int fee() { return 0; }
}
```

Which of these Java statements compile? Select all that apply.

- A: `Payment p = new Upi();`
- B: `Payment p = new Payment();`
- C: `int t = new Upi().total(50);`
- D: `Payment[] list = new Payment[2];`

> An abstract class cannot be instantiated, so `new Payment()` (B) is
> rejected. Its type is still usable everywhere else: a `Payment` variable can
> hold a `Upi` (A), `Upi` inherits the concrete `total` (C), and an array of
> `Payment` references is fine (D), because `new Payment[2]` creates two empty
> slots, not two `Payment` objects.

## oop-basic-023
topic: abstraction
answer: B

In Java, `Pdf` already extends `Document`, while `Photo` and `Invoice` are unrelated to it and to each other. All three must offer a `print()` method that other code can call through one shared type, `Printable`. What should `Printable` be?

- A: An abstract class, which each of the three classes extends alongside its current parent.
- B: An interface, since a class can implement several interfaces but extend only one class.
- C: A concrete class with an empty `print()`, which each of the three classes overrides.
- D: A `final` class holding a `static print(Object)` that the three classes call.

> Java allows one superclass per class. `Pdf` has already used its one, so it
> cannot also extend a `Printable` class, abstract (A) or concrete (C). An
> interface has no such limit: `class Pdf extends Document implements Printable`
> is legal, and code can then hold any of the three as a `Printable`. A static
> helper (D) gives no common type to hold them by.

## oop-basic-024
topic: abstraction
answer: A

App code receives a `MediaPlayer`, an interface declaring `play()`, `pause()` and `stop()`, and calls only those three methods. An MP3 player and a video player implement them in completely different ways. What does the interface spare the app code?

- A: Knowing which class it holds or how it decodes; it calls the same three methods on any player.
- B: Creating player objects; the interface builds the right player when `play()` is first called.
- C: Writing any decoding; the interface supplies one shared body of `play()` for every player.
- D: Handling failures; a method declared in an interface is not allowed to throw an exception.

> That is abstraction: the app depends only on what a player can do, not on
> how a particular one does it, so any class that implements `MediaPlayer`
> works without changing the app. An interface does not create objects (B),
> each implementing class writes its own `play()` (C), and interface methods
> may declare and throw exceptions like any others (D).

## oop-basic-025
topic: relationships
answer: D
run: java

What does this Java program print?

```java
class Engine {
    int hp;

    Engine(int hp) {
        this.hp = hp;
    }
}

class Car {
    Engine engine;

    Car(Engine engine) {
        this.engine = engine;
    }
}

public class Main {
    public static void main(String[] args) {
        Engine e = new Engine(100);
        Car a = new Car(e);
        Car b = new Car(e);
        a.engine.hp = 150;
        b.engine = new Engine(90);
        System.out.println(a.engine.hp + " " + b.engine.hp + " " + e.hp);
    }
}
```

- A: `150 90 90`
- B: `100 90 100`
- C: `150 150 150`
- D: `150 90 150`

> Each `Car` has-a `Engine`: it holds a reference to one. Both cars start with
> a reference to the same engine `e`, so `a.engine.hp = 150` changes `e`
> itself. `b.engine = new Engine(90)` only re-points `b`'s field at a new
> engine; `e` and car `a` are unaffected and still see 150.

## oop-basic-026
topic: relationships
answer: A

Which pair of classes is best modelled with inheritance (is-a) rather than by one holding the other as a field (has-a)?

- A: `SavingsAccount` and `Account`
- B: `Car` and `Engine`
- C: `Library` and `Book`
- D: `Order` and `Address`

> Read each pair as a sentence. A savings account *is an* account: it can be
> used anywhere an `Account` is expected, so `SavingsAccount extends Account`
> fits. A car *has an* engine, a library *has* books and an order *has* a
> delivery address; none of them is a kind of the other, so each holds the
> other as a field.

## oop-basic-027
topic: relationships
answer: B

`Bird` has a well-tested `fly()` method. To reuse it, a developer writes `class Plane extends Bird`. What is wrong with that?

- A: Nothing; extending a class is the usual way to reuse one of its methods.
- B: A plane is not a bird, yet every `Plane` would be accepted wherever a `Bird` is expected.
- C: `Plane` cannot call the inherited `fly()` until it overrides the method itself.
- D: `Plane` would inherit `fly()` but not `Bird`'s fields, so `fly()` would fail on it.

> `extends` does not just copy code: it declares that every `Plane` *is a*
> `Bird`, so a plane would be accepted by `feed(Bird b)` and would inherit
> anything added to `Bird` later, such as a `layEggs()` method. Inherited methods work
> without overriding (C), and the object carries the parent's fields too (D).
> Reuse without the false is-a comes from composition or a shared interface.

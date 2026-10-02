---
skill: oop
level: basic
---

## oop-basic-055
topic: classes-objects
answer: C
run: java

What does this Java program print?

```java
class Coin {
    int value;

    Coin(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Coin a = new Coin(5);
        Coin b = new Coin(5);
        Coin c = a;
        System.out.println((a == b) + " " + a.equals(b) + " " + (a == c));
    }
}
```

- A: `false true true`
- B: `true true true`
- C: `false false true`
- D: `false false false`

> `==` on references asks whether they name the same object: `a` and `b` are
> two objects with equal contents, so `false`, while `c` is a copy of `a`'s
> reference, so `true`. `Coin` does not override `equals`, so it inherits
> `Object.equals`, which is also an identity check: `false`. Value equality
> only exists once a class defines it by overriding `equals`.

## oop-basic-056
topic: classes-objects
answer: B

```python
class Counter:
    def __init__(self):
        self.n = 0

    def inc():
        self.n += 1


c = Counter()
c.inc()
```

What happens when the last line of this Python program runs?

- A: `c.n` becomes `1`; Python supplies `self` automatically.
- B: It raises `TypeError`: `c` is passed to `inc`, which takes no parameters.
- C: It raises `NameError`: `self` is not defined inside `inc`.
- D: It raises `AttributeError`: `Counter` objects have no `inc`.

> `c.inc()` is shorthand for `Counter.inc(c)`: Python passes the object as the
> first argument, and the method has to declare a parameter, conventionally
> named `self`, to receive it. `inc` declares none, so the call fails with
> `TypeError` (it takes 0 positional arguments but 1 was given) before its
> body, with its undefined `self`, ever runs.

## oop-basic-057
topic: classes-objects
answer: B

```java
class Meter {
    int reading;
    static int units;

    static void reset() {
        units = 0;      // line 1
        reading = 0;    // line 2
    }

    void add(int r) {
        reading += r;   // line 3
        units++;        // line 4
    }
}
```

Which marked line stops this Java class from compiling?

- A: Line 1
- B: Line 2
- C: Line 3
- D: Line 4

> A `static` method belongs to the class and runs without any object, so it
> has no `this` and no `reading` to set: line 2 is an error. A static method
> may use static fields (line 1). An instance method runs on an object, so it
> may use that object's fields (line 3) and also the class's static fields
> (line 4).

## oop-basic-058
topic: classes-objects
answer: D

A Java class `Thermometer` stores its reading in an instance field `celsius`. It needs two methods: `toFahrenheit(double c)`, which converts whatever number it is given and reads no field, and `display()`, which prints this thermometer's own reading. Which should be declared `static`?

- A: Both, since neither method changes a field.
- B: Only `display()`, since it is the one called most often.
- C: Neither, since a class with instance fields cannot have static methods.
- D: Only `toFahrenheit`, since it needs no particular object's state.

> A method belongs on the class (`static`) when it works without any object:
> `toFahrenheit` uses only its argument, so it can be called as
> `Thermometer.toFahrenheit(37)`. `display()` reads `celsius`, which only
> exists inside a particular `Thermometer`, so it must be an instance method;
> whether a method changes a field, or how often it runs, has nothing to do
> with it.

## oop-basic-059
topic: encapsulation
answer: C

In Java, class `Shape` in package `geo` has a helper method that subclasses of `Shape` in other packages must be able to call, while unrelated classes in other packages must not. Which access modifier fits?

- A: `private`
- B: no modifier (package-private)
- C: `protected`
- D: `public`

> `protected` opens a member to subclasses wherever they are, plus the
> classes of its own package, and to no one else. `private` would hide it from
> subclasses too, package-private would hide it from subclasses in other
> packages, and `public` would open it to every class.

## oop-basic-060
topic: encapsulation
answer: A

```python
class Circle:
    def __init__(self, r):
        self._r = r

    def area(self):
        return 3 * self._r * self._r


c = Circle(2)
c._r = 5
```

What does Python do at `c._r = 5`?

- A: It assigns `5`; one leading underscore is only a convention meaning "internal".
- B: It raises `AttributeError`, because `_r` is private to `Circle`.
- C: It ignores the assignment and prints a warning that `_r` is protected.
- D: It stores `5` under the mangled name `_Circle_r`, leaving `_r` as `2`.

> Python has no access modifiers. A single leading underscore tells other
> programmers "this is internal, don't rely on it", but nothing enforces it:
> the assignment simply replaces the radius, and `c.area()` would now return
> 75. Name mangling applies only to names with two leading underscores, and
> even that only renames the attribute.

## oop-basic-061
topic: encapsulation
answer: A, C, E

```java
class Order {
    private final String id;
    private int qty;

    Order(String id) {
        this.id = id;
    }

    public String getId() { return id; }
    public int getQty() { return qty; }
    public void addQty(int n) { if (n > 0) qty += n; }
}
```

A method in another class of the same package has `Order o = new Order("A7");`. Which of these statements compile there? Select all that apply.

- A: `String s = o.getId();`
- B: `o.id = "B9";`
- C: `o.addQty(2);`
- D: `o.qty++;`
- E: `int q = o.getQty() + 1;`

> Both fields are `private`, so no other class can name them, even in the same
> package: B and D are rejected. Outside code works through the public
> methods: it can read `id` and `qty` through the getters (A, E) and change
> `qty` only through `addQty` (C), which refuses a negative amount. There is no
> setter for `id`, so it is read-only from outside.

## oop-basic-062
topic: constructors
answer: A
run: python

What does this Python program print?

```python
class Shape:
    def __init__(self, name):
        print("shape", end=" ")
        self.name = name


class Square(Shape):
    def __init__(self, side):
        print("square", end=" ")
        super().__init__("sq")
        self.side = side


s = Square(3)
print(s.name, s.side)
```

- A: `square shape sq 3`
- B: `shape square sq 3`
- C: `square sq 3`
- D: `shape sq 3`

> Python calls only `Square.__init__`; the parent's constructor runs when, and
> only if, that code calls `super().__init__(...)`. Here the child prints
> first and then calls up, so `square` comes before `shape`. (In Java the call
> to the parent's constructor must be the first statement; Python has no such
> rule.)

## oop-basic-063
topic: constructors
answer: D
run: java

What does this Java program print?

```java
class Point {
    int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    Point(Point other) {
        this(other.x, other.y);
    }
}

public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(a);
        Point c = a;
        b.x = 9;
        c.y = 7;
        System.out.println(a.x + " " + a.y);
    }
}
```

- A: `9 7`
- B: `1 2`
- C: `9 2`
- D: `1 7`

> `new Point(a)` runs the copy constructor, which passes `a`'s values on to
> the two-argument constructor through `this(...)`, building a separate
> object: changing `b.x` leaves `a` alone. `c = a` creates no object; it copies
> the reference, so `c.y = 7` changes `a` itself.

## oop-basic-064
topic: constructors
answer: C

```java
class User {
    private final String id;
    private String name;

    User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    void rename(String newName) { name = newName; }   // line 1
    void reassign(String newId) { id = newId; }       // line 2
}
```

Which statement about this Java class is true?

- A: Both lines compile; `final` only stops subclasses from overriding `id`.
- B: Line 1 does not compile: no field may change once the constructor ends.
- C: Line 2 does not compile: a `final` field gets its value once, during construction.
- D: Neither line compiles: `final` on one field makes the whole object read-only.

> A `final` field must be assigned exactly once, by the time construction
> finishes, and never again, so assigning `id` in an ordinary method is an
> error. `name` is not final and may change at any time. `final` applies to
> the field it is written on, not to the object, and fields are never
> overridden.

## oop-basic-065
topic: constructors
answer: B

Python has no constructor overloading. A `Rect` class must accept both `Rect(3)` (a 3 × 3 square) and `Rect(3, 4)`. Which `__init__` does that?

- A: Two methods, `def __init__(self, side)` followed by `def __init__(self, w, h)`.
- B: `def __init__(self, w, h=None)`, setting `h = w` when `h is None`.
- C: `def __init__(self, w, h=w)`, so that the default copies `w`.
- D: `def __init__(self, *sizes)`, then `self.w, self.h = sizes`.

> A default argument lets one constructor serve both calls, and `None` marks
> "not given". A second `def __init__` simply replaces the first, so `Rect(3)`
> would fail. A default is evaluated once, when the `def` runs, where `w` is
> not defined, so C raises `NameError` as the class is created. In D,
> `Rect(3)` makes `sizes` hold one value, which cannot be unpacked into two
> names.

## oop-basic-066
topic: inheritance
answer: D
run: python

What does this Python program print?

```python
class A:
    def show(self):
        return "A"


class B(A):
    def show(self):
        return "B" + super().show()


class C(B):
    pass


print(C().show(), B().show(), A().show())
```

- A: `CBA BA A`
- B: `A BA A`
- C: `B B A`
- D: `BA BA A`

> `C` defines nothing of its own, so `C().show()` finds the method it inherits
> from its parent, `B`. Inside `B.show`, `super().show()` calls the next class
> up from `B`, which is `A`, so the result is `"BA"`, exactly as for a `B`
> object. There is no `"C"` anywhere, because `C` never overrides `show`.

## oop-basic-067
topic: inheritance
answer: A

```cpp
class Base {
protected:
    int level = 1;
};

class Derived : public Base {
public:
    void up() { level += 2; }   // line 1
};

int main() {
    Derived d;
    d.up();
    d.level = 0;                // line 2
    return 0;
}
```

Which statement about this C++ program is true?

- A: Line 2 fails: `level` can be used inside `Derived`'s members, but not from `main`.
- B: Line 1 fails: `level` belongs to `Base`, so `Derived` cannot change it.
- C: It compiles: `protected` members are public on objects of a derived class.
- D: Both lines fail: a `protected` member can be used only inside `Base` itself.

> `protected` sits between `private` and `public`: the class's own members and
> the members of classes derived from it may use the name, and outside code
> may not. `up()` is a member of `Derived`, so line 1 is fine; `main` is
> outside both classes, so `d.level` is rejected.

## oop-basic-068
topic: inheritance
answer: A, C

```java
class Shape {
    String name;

    Shape(String name) {
        this.name = name;
    }
}

class Circle extends Shape {
    Circle() {
        super("circle");
    }
}
```

Which of these Java expressions compile? Select all that apply.

- A: `new Circle()`
- B: `new Circle("disc")`
- C: `new Shape("blob")`
- D: `new Shape()`

> Constructors are not inherited: a class has exactly the constructors it
> declares. `Circle` declares only `Circle()`, so `new Circle("disc")` finds
> no match even though `Shape` has a `String` constructor. `Shape` declares
> only `Shape(String)`, and because it declares one, Java adds no default
> constructor, so `new Shape()` fails too.

## oop-basic-069
topic: inheritance
answer: C

```java
class Media { }
class Book extends Media { }
class EBook extends Book { }
class Film extends Media { }

class Library {
    static void shelve(Book b) { }
}
```

Which call does not compile?

- A: `Library.shelve(new Book());`
- B: `Library.shelve(new EBook());`
- C: `Library.shelve(new Film());`
- D: `Library.shelve((Book) new EBook());`

> A parameter of type `Book` accepts a `Book` or any subclass of it, at any
> depth: an `EBook` is-a `Book`, so B compiles, and the explicit upcast in D
> is legal but unnecessary. A `Film` is a `Media` but not a `Book`; sharing a
> parent does not make two siblings substitutes for each other.

## oop-basic-070
topic: polymorphism
answer: D
run: python

What does this Python program print?

```python
class Calc:
    def area(self, r):
        return 3 * r * r

    def area(self, w, h=1):
        return w * h


c = Calc()
print(c.area(2), c.area(2, 5))
```

- A: `12 10`
- B: `12 12`
- C: It raises `TypeError` at `c.area(2)`.
- D: `2 10`

> Python has no method overloading. A class body is run top to bottom, and the
> second `def area` rebinds the name, so only the two-parameter version
> exists. Its `h` has a default, so `c.area(2)` is `2 * 1` rather than an
> error, and `c.area(2, 5)` is 10. Optional and default parameters are how
> Python covers what overloading does elsewhere.

## oop-basic-071
topic: polymorphism
answer: A

```java
class Animal { String sound() { return "..."; } }
class Dog extends Animal { String sound() { return "woof"; } }
class Cat extends Animal { String sound() { return "meow"; } }

// in main:
Animal a = new Cat();
Dog d = (Dog) a;
System.out.println(d.sound());
```

What happens?

- A: It compiles, and the cast throws a `ClassCastException` when it runs.
- B: It does not compile, because `Cat` and `Dog` are unrelated classes.
- C: It prints `meow`, since the object really is a `Cat`.
- D: The cast yields `null`, so `d.sound()` throws a `NullPointerException`.

> The compiler sees a cast from `Animal` to `Dog`, which could succeed (an
> `Animal` reference may hold a `Dog`), so it allows it. At run time the JVM
> checks the actual object, finds a `Cat`, and throws `ClassCastException`; a
> failed cast never yields `null`. Writing `(Dog) new Cat()` directly would be
> a compile error, because there the compiler knows the type.

## oop-basic-072
topic: polymorphism
answer: A, C

In Java, `Dog extends Animal`, and a program declares `Animal a = new Dog();`. Which of these are settled by the compiler from the declared types, before the program runs? Select all that apply.

- A: Which overload `p.show(a)` calls, when `show(Animal)` and `show(Dog)` both exist.
- B: Which class's overriding `sound()` runs for `a.sound()`.
- C: Whether `a.fetch()` is allowed, when only `Dog` declares `fetch()`.
- D: Whether the cast `(Dog) a` succeeds or throws.

> The compiler knows only that `a` is declared `Animal`. It uses that to pick
> an overload (`show(Animal)`, A) and to check that a called method exists
> (`fetch()` does not exist on `Animal`, so C is a compile error). Which
> override runs (B) and whether a cast succeeds (D) depend on the object `a`
> refers to, which is only known at run time.

## oop-basic-073
topic: polymorphism
answer: B

```java
class Product {
    double price(int qty) {
        return qty * 10.0;
    }
}
```

Which method, declared in `class Bulk extends Product`, overrides `price`?

- A: `double price(long qty)`
- B: `double price(int qty)`
- C: `int price(int qty)`
- D: `double price(int qty, int discount)`

> An override has the same name and the same parameter types as the inherited
> method, and a compatible return type. A and D change the parameters, so they
> are overloads that sit beside the inherited `price(int)`. C keeps the
> parameters but changes the return type from `double` to `int`, which is not
> allowed, so it does not compile at all.

## oop-basic-074
topic: abstraction
answer: C
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
using namespace std;

class Shape {
public:
    virtual int area() = 0;
    int twice() { return 2 * area(); }
    virtual ~Shape() {}
};

class Square : public Shape {
    int side;
public:
    Square(int s) : side(s) {}
    int area() override { return side * side; }
};

int main() {
    Square sq(3);
    Shape& ref = sq;
    cout << ref.twice() << endl;
    return 0;
}
```

- A: `0`
- B: `9`
- C: `18`
- D: It does not compile, because `Shape` is abstract and `Shape&` is not allowed.

> `= 0` makes `area()` a pure virtual function, which makes `Shape` an
> abstract class: no `Shape` object can be created, but references and
> pointers to `Shape` are allowed and are how it is used. `twice()` is written
> once in `Shape`, and its call to the virtual `area()` runs `Square`'s
> version, 9, so it returns 18.

## oop-basic-075
topic: abstraction
answer: C

```cpp
class Shape {
public:
    virtual double area() = 0;
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    double area() override { return 3.14; }
};

int main() {
    Circle c;                   // line 1
    Shape* p = &c;              // line 2
    Shape s;                    // line 3
    Shape* q = new Circle();    // line 4
    delete q;
    return 0;
}
```

Which line of this C++ program does not compile?

- A: Line 1
- B: Line 2
- C: Line 3
- D: Line 4

> `Shape` has a pure virtual function (`= 0`), so it is abstract and no object
> of type `Shape` itself can be created: line 3 tries to. `Circle` overrides
> `area()`, so it is concrete (lines 1 and 4), and a pointer to `Shape` may
> point at a `Circle` (lines 2 and 4).

## oop-basic-076
topic: abstraction
answer: B

In Java, `Circle`, `Square` and `Triangle` each have a `name` field set the same way in a constructor, and each computes `area()` its own way. No plain `Shape` object should ever be created, and every subclass must be forced to supply `area()`. What should their shared parent `Shape` be?

- A: An interface that declares the `name` field and an `area()` method.
- B: An abstract class with the `name` field, a constructor and an abstract `area()`.
- C: A concrete class whose `area()` returns 0 unless a subclass overrides it.
- D: A concrete class with a `name` field and no `area()` method at all.

> An abstract class can hold per-object state and the constructor that sets
> it, cannot be instantiated, and forces every concrete subclass to implement
> its abstract methods. An interface cannot give objects a `name` (its fields
> are `static final` constants). A concrete class can be instantiated, and
> with C a subclass may forget `area()` and silently report 0, while D gives
> code holding a `Shape` no `area()` to call.

## oop-basic-077
topic: relationships
answer: A
run: python

What does this Python program print?

```python
class Item:
    def __init__(self, price):
        self.price = price


class Cart:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)
        return self

    def total(self):
        return sum(i.price for i in self.items)


shared = Item(50)
a = Cart().add(shared).add(Item(20))
b = Cart().add(shared)
shared.price = 10
print(a.total(), b.total())
```

- A: `30 10`
- B: `70 50`
- C: `30 50`
- D: `70 10`

> Each cart has-a list of items, and the list holds references, not copies.
> Both carts refer to the same `shared` item, so changing its price to 10 is
> seen by both: cart `a` totals 10 + 20 and cart `b` totals 10. The totals are
> computed when `total()` is called, not when items are added.

## oop-basic-078
topic: relationships
answer: A, B

```java
class Wheel { }
class Vehicle { }

class Bike extends Vehicle {
    private Wheel front = new Wheel();
    private Wheel back = new Wheel();
}
```

Which statements about these Java classes are true? Select all that apply.

- A: A `Bike` is-a `Vehicle`.
- B: A `Bike` has-a `Wheel`; in fact it has two.
- C: Every `Vehicle` has two `Wheel`s.
- D: A `Bike` can be passed to a method whose parameter is a `Wheel`.

> `extends Vehicle` makes every `Bike` a `Vehicle` (is-a), and its two `Wheel`
> fields make it a whole with wheels as parts (has-a). The wheels belong to
> `Bike`, not to `Vehicle`, which declares no fields, so a plain `Vehicle` has
> none. Having a `Wheel` does not make a `Bike` a `Wheel`, so it cannot be
> passed where one is expected.

## oop-basic-079
topic: relationships
answer: D

Each `Robot` must be able to switch between walking and rolling while the program runs, independently of other robots, and new ways of moving must be addable later without editing the `Robot` class. Which Java design allows all of that?

- A: Subclasses `WalkingRobot` and `RollingRobot`, changing an object's class when it switches.
- B: A `boolean rolling` field that every method of `Robot` checks with an `if`.
- C: A `static` field `Robot.mode` that every robot reads before it moves.
- D: A field `Movement mover` holding a `Walk` or a `Roll` object, replaced when it switches.

> Composition: the robot has-a `Movement`, and replacing that object changes
> how this one robot moves. A new way of moving is a new class implementing
> `Movement`, with no edit to `Robot`. A Java object can never change its
> class (A), a boolean flag can name only two ways and needs `Robot` edited for
> a third (B), and a static field is shared by every robot (C).

## oop-basic-080
topic: relationships
answer: D

The requirements say: every `Order` contains one or more `LineItem`s, and an `ExpressOrder` is an `Order` that ships faster. How should these classes be related?

- A: `Order extends LineItem`; `ExpressOrder` holds an `Order` field.
- B: `LineItem extends Order`; `ExpressOrder extends LineItem`.
- C: `Order extends ExpressOrder`; `Order` holds a list of `LineItem`.
- D: `ExpressOrder extends Order`; `Order` holds a list of `LineItem`.

> "An `ExpressOrder` is an `Order`" is an is-a sentence, so `ExpressOrder`
> extends `Order`, not the other way round (C would make every order an
> express one). "An `Order` contains `LineItem`s" is has-a, so the order holds
> them in a field; an order is not a kind of line item, nor a line item a kind
> of order.

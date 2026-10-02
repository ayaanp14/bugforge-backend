---
skill: oop
level: intermediate
---

## oop-intermediate-001
topic: classes-objects
answer: B
run: java

What does this program print?

```java
import java.util.*;

class Point {
    final int x, y;

    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() { return 31 * x + y; }
}

class ColorPoint extends Point {
    final String color;

    ColorPoint(int x, int y, String color) {
        super(x, y);
        this.color = color;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ColorPoint)) return false;
        return super.equals(o) && color.equals(((ColorPoint) o).color);
    }
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point(1, 2);
        ColorPoint cp = new ColorPoint(1, 2, "red");
        List<Point> plain = new ArrayList<>(List.of(p));
        List<Point> colored = new ArrayList<>(List.of(cp));
        System.out.println(p.equals(cp) + " " + cp.equals(p) + " "
            + colored.contains(p) + " " + plain.contains(cp));
    }
}
```

- A: `true true true true`
- B: `true false true false`
- C: `true false false true`
- D: `false false false false`

> `p.equals(cp)` asks "is `cp` a `Point` with the same coordinates?" — yes.
> `cp.equals(p)` asks "is `p` a `ColorPoint`?" — no. So `equals` is not
> symmetric, which the contract requires. `ArrayList.contains(o)` calls
> `o.equals(element)`, so `colored.contains(p)` runs `p.equals(cp)` (true) and
> `plain.contains(cp)` runs `cp.equals(p)` (false): a collection's answer now
> depends on which object is passed in. A subclass that adds a field to an
> instantiable class cannot keep the `equals` contract; holding a `Point`
> (composition) instead of extending it avoids the problem.

## oop-intermediate-002
topic: encapsulation
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> src = new ArrayList<>(List.of("a"));
        List<String> view = Collections.unmodifiableList(src);
        List<String> copy = List.copyOf(src);
        List<String> wrapped = Collections.unmodifiableList(new ArrayList<>(src));
        src.add("b");
        System.out.println(view.size() + " " + copy.size() + " " + wrapped.size());
    }
}
```

- A: `1 1 1`
- B: `2 2 2`
- C: `2 1 2`
- D: `2 1 1`

> `Collections.unmodifiableList(src)` is a read-only *view*: it refuses writes
> made through it, but it reads the original list, so a change to `src` shows
> through (size 2). `List.copyOf` takes a snapshot (size 1), and so does
> wrapping a fresh `ArrayList` copy, which nobody else holds (size 1). Handing
> out a view of a field protects the field only if no one else can still
> reach the list underneath.

## oop-intermediate-003
topic: constructors
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Base {
    virtual ~Base() { std::cout << "~" << name() << " "; }
    virtual std::string name() const { return "Base"; }
};

struct Derived : Base {
    ~Derived() override { std::cout << "~Derived "; }
    std::string name() const override { return "Derived"; }
};

int main() {
    {
        Derived d;
        std::cout << d.name() << " ";
    }
    std::cout << "\n";
}
```

- A: `Derived ~Derived ~Base`
- B: `Derived ~Derived ~Derived`
- C: `Derived ~Base ~Derived`
- D: `Derived ~Derived`

> Destruction runs the derived destructor body first, then the base one. By
> the time `~Base` runs, the `Derived` part is already gone and the object's
> dynamic type is `Base`, so the virtual call `name()` inside it resolves to
> `Base::name`. The same rule applies in a constructor: a virtual call made
> while a base part is being built or torn down never reaches the derived
> override.

## oop-intermediate-004
topic: inheritance
answer: C
run: python

What does this program print?

```python
class Base:
    def __init__(self):
        self.log = ["Base"]

class Left(Base):
    def __init__(self):
        super().__init__()
        self.log.append("Left")

class Right(Base):
    def __init__(self):
        super().__init__()
        self.log.append("Right")

class Both(Left, Right):
    def __init__(self):
        super().__init__()
        self.log.append("Both")

print(" ".join(Both().log))
```

- A: `Base Left Right Both`
- B: `Both Left Right Base`
- C: `Base Right Left Both`
- D: `Base Left Base Right Both`

> `Both`'s method resolution order is `Both, Left, Right, Base, object`, and
> `super()` means "the next class in that order", not "my parent". So
> `Both.__init__` calls `Left.__init__`, whose `super()` calls
> `Right.__init__`, whose `super()` calls `Base.__init__` — once. Each
> method appends only after its `super()` call returns, so the names are
> added in reverse: `Base`, then `Right`, then `Left`, then `Both`.

## oop-intermediate-005
topic: polymorphism
answer: D
run: java

What does this program print?

```java
class Animal {
    static String kind() { return "animal"; }

    String sound() { return "..."; }
}

class Dog extends Animal {
    static String kind() { return "dog"; }

    @Override
    String sound() { return "woof"; }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        Animal none = null;
        System.out.println(a.kind() + " " + a.sound() + " " + none.kind());
    }
}
```

- A: `dog woof dog`
- B: `dog woof animal`
- C: It throws a `NullPointerException` at `none.kind()`.
- D: `animal woof animal`

> A static method is hidden, not overridden: a call through a variable is
> compiled as a call on the variable's declared class, so `a.kind()` and
> `none.kind()` both become `Animal.kind()`. The object is never consulted,
> which is why calling it through a `null` reference does not throw.
> `sound()` is an instance method, dispatched on the runtime class `Dog`.

## oop-intermediate-006
topic: abstraction
answer: A
run: python

What does this program print?

```python
from abc import ABC, abstractmethod

class Store(ABC):
    @abstractmethod
    def get(self, key): ...

    @abstractmethod
    def put(self, key, value): ...

    def has(self, key):
        return self.get(key) is not None

class ReadOnly(Store):
    def get(self, key):
        return None

class Memory(ReadOnly):
    def put(self, key, value):
        pass

made = []
for cls in (Store, ReadOnly, Memory):
    try:
        cls()
        made.append(cls.__name__)
    except TypeError:
        made.append("-")
print(" ".join(made))
```

- A: `- - Memory`
- B: `- ReadOnly Memory`
- C: `Store ReadOnly Memory`
- D: `- - -`

> A class derived from `ABC` cannot be instantiated while any
> `@abstractmethod` is left unoverridden; trying raises `TypeError`. `Store`
> has two, `ReadOnly` still lacks `put`, and `Memory` inherits `get` from
> `ReadOnly` and defines `put`, so it is concrete. The concrete helper `has`
> makes no difference either way.

## oop-intermediate-007
topic: relationships
answer: B

A UML class diagram draws a line from `House` to `Room` with a filled (black) diamond at the `House` end. What does the diagram say?

- A: Aggregation: a `House` groups `Room`s that may also belong to other houses.
- B: Composition: each `Room` belongs to exactly one `House` and does not outlive it.
- C: Inheritance: a `Room` is a kind of `House` and inherits its operations.
- D: Dependency: a `House` uses a `Room` only as a parameter of some method.

> In UML the diamond sits at the whole's end. Filled means composition: the
> part has exactly one owner and its lifetime is bound to the owner's —
> destroy the house and its rooms go with it. A hollow diamond would be
> aggregation (a whole–part link with no exclusive ownership), inheritance is
> drawn with a hollow triangle, and a dependency with a dashed arrow.

## oop-intermediate-008
topic: solid
answer: C
run: java

What does this program print?

```java
class Rectangle {
    protected int width, height;

    void setWidth(int w) { width = w; }

    void setHeight(int h) { height = h; }

    int area() { return width * height; }
}

class Square extends Rectangle {
    @Override
    void setWidth(int w) { width = w; height = w; }

    @Override
    void setHeight(int h) { width = h; height = h; }
}

public class Main {
    static int resize(Rectangle r) {
        r.setWidth(5);
        r.setHeight(4);
        return r.area();
    }

    public static void main(String[] args) {
        System.out.println(resize(new Rectangle()) + " " + resize(new Square()));
    }
}
```

- A: `20 20`
- B: `16 16`
- C: `20 16`
- D: `20 25`

> For the rectangle, width 5 and height 4 give 20. For the square,
> `setHeight(4)` also resets the width to 4, so the area is 16. `resize` was
> written against `Rectangle`'s behaviour — setting the height leaves the
> width alone — and a `Square` breaks it. That is a Liskov Substitution
> Principle violation: a subtype that cannot stand in wherever its base type
> is expected, even though the code compiles.

## oop-intermediate-009
topic: design-patterns
answer: A

A Java singleton `Registry` holds a mutable `HashMap`. Which `getInstance()` for it is both lazy (nothing is built until the first call) and correct when many threads call it at the same moment?

- A: The holder idiom: return `Holder.INSTANCE`, created by a nested static class.
- B: `if (instance == null) instance = new Registry(); return instance;` with no locking.
- C: Double-checked locking around the assignment, with the `instance` field not `volatile`.
- D: `synchronized (new Object())` around the null check and the assignment.

> The JVM initialises a class exactly once, under a lock, the first time it is
> used, so the nested `Holder` class builds the instance lazily and safely,
> with no locking on later calls. B lets two threads both see `null` and
> build two instances. C can hand a thread a reference to a not-yet-fully
> constructed object, since without `volatile` the write of the reference may
> become visible before the writes in the constructor. D locks a fresh object
> each call, so no two threads ever contend for the same lock — it excludes
> nothing. (An `enum` with one constant is the other standard answer.)

## oop-intermediate-010
topic: classes-objects
answer: D

An application has a `Money` class (an amount and a currency) and a `Customer` class (a database id, a name and an email). Two `Money` objects of 100 INR must be interchangeable; two customers who happen to share a name are different people; and a customer who changes their email is still the same customer. How should each class define `equals`?

- A: Both compare every field, so two objects are equal exactly when all of their data matches.
- B: Both keep the inherited reference equality, since only the database can decide whether two rows match.
- C: `Money` keeps the inherited reference equality; `Customer` compares its name and its email.
- D: `Money` compares its amount and currency; `Customer` compares its id and nothing else.

> `Money` is a value object: it has no identity beyond its value, so two
> instances with the same amount and currency are equal (and `hashCode` must
> use the same two fields). `Customer` is an entity: its identity is the id
> and survives changes to its attributes. Comparing every field (A) would
> make a customer unequal to its own earlier state after an email change, and
> so does comparing name and email (C); reference equality (B, C) makes two
> `Money` objects of 100 INR unequal.

## oop-intermediate-011
topic: encapsulation
answer: B

```java
final class Team {
    private final List<String> names;

    Team(List<String> names) { this.names = /* (1) */; }

    List<String> names() { return /* (2) */; }
}
```

In the constructor, `names` is the parameter; in the method `names()`, it is the field. Which choice for (1) and (2) means that a `Team`'s names can never change after construction — neither through the list the caller passed in nor through anything `names()` returns?

- A: (1) `names` and (2) `Collections.unmodifiableList(names)`
- B: (1) `List.copyOf(names)` and (2) `names`
- C: (1) `new ArrayList<>(names)` and (2) `names`
- D: (1) `names` and (2) `new ArrayList<>(names)`

> Immutability needs a copy on the way in and nothing mutable on the way out.
> `List.copyOf` makes an unmodifiable copy the caller cannot reach, so the
> field itself can be returned safely. A keeps the caller's list, so the
> caller can still change it, and the unmodifiable view shows the change. C
> copies in but hands out the internal `ArrayList`, which anyone can modify.
> D returns a fresh copy each time but still holds the caller's list.

## oop-intermediate-012
topic: constructors
answer: C

```python
class Widget:
    def __init__(self):
        self.label = self.render()

    def render(self):
        return "widget"

class Button(Widget):
    def __init__(self, text):
        super().__init__()
        self.text = text

    def render(self):
        return "[" + self.text + "]"

b = Button("ok")
print(b.label)
```

What happens when this runs?

- A: It prints `[ok]`, because `render()` sees the finished `Button`.
- B: It prints `widget`, because the base `__init__` calls its own `render()`.
- C: It raises `AttributeError`, because `render()` runs before `self.text` is set.
- D: It prints `[None]`, because `self.text` is `None` until it is assigned.

> `Widget.__init__` calls `self.render()`, and `self` is a `Button`, so the
> override runs — while `Button.__init__` is still waiting for
> `super().__init__()` to return, before `self.text = text` has executed. The
> instance has no `text` attribute yet, so the lookup raises
> `AttributeError`. It is the same hazard as calling an overridable method
> from a Java constructor; Python just reports it as a missing attribute
> rather than a default value.

## oop-intermediate-013
topic: inheritance
answer: A

`B` and `C` both inherit from `A`, and both override `A`'s method `m()`. `D` inherits from `B` and `C`, in that order, and does not define `m()` itself. The forms are: in Java, `A`, `B` and `C` are interfaces with `m()` as a default method and `D` is a class implementing `B` and `C`; in C++, `B` and `C` inherit publicly from `A`, with or without `virtual`; in Python, they are plain classes. In which language does calling `m()` on a `D` compile (where that applies) and run `B`'s version?

- A: Python only.
- B: Java only.
- C: C++ only, provided `B` and `C` inherit `A` with `virtual`.
- D: Python and C++, but not Java.

> Python linearises the hierarchy (`D, B, C, A, object`) and takes the first
> `m` it finds, `B`'s. Java refuses to compile `D`: it inherits two
> unrelated defaults for `m()` and must override it (it may call
> `B.super.m()`). C++ refuses too: without `virtual` inheritance `D` has two
> `A` subobjects and the name `m` is ambiguous; with it, there is one `A`
> but no unique final overrider of `m()`. In both of those languages the
> class must settle the conflict explicitly.

## oop-intermediate-014
topic: polymorphism
answer: D

```java
public class Main {
    static String f(String s) { return "String"; }
    static String f(Integer i) { return "Integer"; }
    static String f(Object o) { return "Object"; }

    public static void main(String[] args) {
        System.out.println(f(null));
    }
}
```

What happens?

- A: It prints `Object`, since `null` has no type more specific than `Object`.
- B: It prints `String`, since `f(String)` is the first overload declared.
- C: It throws a `NullPointerException` while choosing the overload at run time.
- D: It does not compile: the call is ambiguous between `f(String)` and `f(Integer)`.

> Overloads are chosen at compile time, and the compiler picks the most
> specific applicable one. `null` fits all three, and `String` and `Integer`
> are each more specific than `Object` — but neither is more specific than
> the other, so there is no single best choice and the call is rejected as
> ambiguous. Declaration order never matters. Casting, as in
> `f((String) null)`, settles it.

## oop-intermediate-015
topic: abstraction
answer: B, D

In Java 17, which of these can an abstract class declare that an interface cannot? Select all that apply.

- A: Static methods.
- B: Instance fields, of which each object has its own copy.
- C: Private methods.
- D: Constructors.
- E: Methods with a body that implementing classes inherit.

> An interface has no per-object state — any field it declares is implicitly
> `public static final` — and no constructors, since it is never
> instantiated. An abstract class can have both. Static methods (Java 8),
> private methods (Java 9) and default methods with a body (Java 8) are all
> allowed in interfaces now, so they no longer separate the two; state and
> construction still do.

## oop-intermediate-016
topic: relationships
answer: B
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Engine {
    ~Engine() { std::cout << "E"; }
};

struct Driver {
    ~Driver() { std::cout << "D"; }
};

struct Car {
    Engine engine;
    Driver* driver;
    explicit Car(Driver* d) : driver(d) {}
    ~Car() { std::cout << "C"; }
};

int main() {
    Driver d;
    {
        Car car(&d);
    }
    std::cout << "|";
}
```

- A: `CED|`
- B: `CE|D`
- C: `EC|D`
- D: `C|D`

> The `Engine` is part of the `Car` (composition): when the car goes out of
> scope its destructor body runs ("C") and then its members are destroyed
> ("E"). The `Driver` is only referred to (association/aggregation): the
> car's destruction does not touch it, so it lives on until the end of
> `main`, after the `|`. Ownership decides lifetime.

## oop-intermediate-017
topic: solid
answer: C

```java
double total(List<Object> shapes) {
    double sum = 0;
    for (Object s : shapes) {
        if (s instanceof Circle c) sum += Math.PI * c.r * c.r;
        else if (s instanceof Rect r) sum += r.w * r.h;
    }
    return sum;
}
```

Adding a `Triangle` means editing `total()`, and every other method written in the same style. Which principle does this break, and which refactoring serves it?

- A: Single Responsibility: move `total()` into its own `AreaCalculatorService` class.
- B: Interface Segregation: keep circles and rectangles in two lists, with one loop each.
- C: Open/Closed: give each shape an `area()` method behind a `Shape` interface and call it.
- D: Dependency Inversion: pass the list to a constructor rather than to `total()`.

> The Open/Closed Principle asks that new behaviour arrive as new code, not
> as edits to code that already works. A type switch has to be reopened for
> every new shape. With `area()` declared on a `Shape` interface, `total()`
> just sums `s.area()`, and a `Triangle` is one new class. Moving the method
> (A), splitting the lists (B) or changing how the list arrives (D) leaves
> the type switch — and the edit per shape — in place.

## oop-intermediate-018
topic: design-patterns
answer: A
run: java

What does this program print?

```java
interface Text {
    String render();
}

class Plain implements Text {
    private final String s;
    Plain(String s) { this.s = s; }
    public String render() { return s; }
}

class Bold implements Text {
    private final Text inner;
    Bold(Text inner) { this.inner = inner; }
    public String render() { return "<b>" + inner.render() + "</b>"; }
}

class Exclaim implements Text {
    private final Text inner;
    Exclaim(Text inner) { this.inner = inner; }
    public String render() { return inner.render() + "!"; }
}

public class Main {
    public static void main(String[] args) {
        Text a = new Exclaim(new Bold(new Plain("hi")));
        Text b = new Bold(new Exclaim(new Plain("hi")));
        System.out.println(a.render() + " " + b.render());
    }
}
```

- A: `<b>hi</b>! <b>hi!</b>`
- B: `<b>hi!</b> <b>hi!</b>`
- C: `<b>hi</b>! <b>hi</b>!`
- D: `<b>hi!</b> <b>hi</b>!`

> These are decorators: each wraps a `Text` and adds behaviour around the
> inner call, and the outermost one finishes last. In `a`, `Bold` produces
> `<b>hi</b>` and `Exclaim`, wrapped around it, appends `!` after the closing
> tag. In `b`, `Exclaim` produces `hi!` and `Bold` puts the tags around
> that. Decorators compose freely, so the order they are stacked in is part
> of the result.

## oop-intermediate-019
topic: classes-objects
answer: B, E

`Point` is a class with two `int` fields, `x` and `y`, in each language below. Which of these make `b` an independent copy of `a`, so that changing `b.x` afterwards leaves `a.x` alone? Select all that apply.

- A: Java: `Point b = a;`
- B: C++: `Point b = a;`
- C: Python: `b = a`
- D: C++: `Point& b = a;`
- E: Python: `b = copy.copy(a)` (after `import copy`)

> C++ classes have value semantics: `Point b = a;` runs the copy constructor
> and creates a second object. In Java and Python a variable holds a
> reference, so `b = a` makes a second name for the same object, and a C++
> reference (`Point&`) is likewise an alias. `copy.copy` creates a new
> object with the same attribute values; since those are `int`s, a shallow
> copy is already independent.

## oop-intermediate-020
topic: encapsulation
answer: D

A checkout method computes the shipping charge from `order.getCustomer().getAddress().getCity().getZone()`. Which guideline does this break, and what is the usual fix?

- A: Interface Segregation: split `Order` into small interfaces, one for each getter.
- B: Open/Closed: mark each getter `final`, so that the chain can never change.
- C: Single Responsibility: copy `getZone()` into the checkout class itself.
- D: The Law of Demeter: ask `order` for it, e.g. `order.shippingZone()`.

> The Law of Demeter ("talk only to your immediate collaborators") is broken
> when code walks through one object's internals to reach another's. The
> checkout now depends on the structure of `Customer`, `Address` and `City`;
> a change to any of them breaks it. Asking the order for the shipping zone
> keeps that knowledge inside the classes that own it. None of the other
> changes removes the chain.

## oop-intermediate-021
topic: constructors
answer: C

```cpp
class Buffer {
    int* data;
public:
    explicit Buffer(int n) : data(new int[n]) {}
    ~Buffer() { delete[] data; }
};

int main() {
    Buffer a(8);
    Buffer b = a;
}
```

What happens when `main` returns?

- A: Each `Buffer` frees its own array, since the copy gave `b` an array of its own.
- B: Only `b`'s array is freed, so `a`'s array leaks but nothing else goes wrong.
- C: Both destructors `delete[]` the same pointer, so the behaviour is undefined.
- D: It does not compile: a class with a user-declared destructor has no copy constructor.

> The compiler still generates a copy constructor (D is wrong), and it copies
> members one by one — the pointer, not the array — so `a.data` and
> `b.data` point at the same block. Both destructors delete it: a double
> delete, which is undefined behaviour. This is the rule of three: a class
> that needs a custom destructor almost always needs a custom (or deleted)
> copy constructor and copy assignment too — or should hold a
> `std::vector<int>` and need none of them.

## oop-intermediate-022
topic: inheritance
answer: B

```python
class Base:
    def __init__(self):
        print("Base init")

class Left(Base):
    def __init__(self):
        Base.__init__(self)

class Right(Base):
    def __init__(self):
        Base.__init__(self)

class Both(Left, Right):
    def __init__(self):
        Left.__init__(self)
        Right.__init__(self)
```

`Both()` prints `Base init` twice. Which change makes `Base.__init__` run exactly once for `Both()`, while it still runs when `Left()` or `Right()` is created on its own?

- A: Swap the order of the bases, to `class Both(Right, Left)`.
- B: Replace each explicit `X.__init__(self)` call with one `super().__init__()` per class.
- C: Delete the calls in `Left` and `Right`, and call `Base.__init__(self)` once in `Both`.
- D: Keep the calls, but declare `Base` as `class Base(object)`.

> Explicit calls name a fixed class, so both branches of the diamond reach
> `Base`. With `super()` everywhere, each call goes to the next class in the
> instance's MRO: for a `Both` that is `Left`, `Right`, `Base` — each once —
> and for a plain `Left` it is `Base` directly. C fixes `Both` but leaves a
> lone `Left()` without its `Base` set-up; A only changes the order of the
> two calls; D changes nothing in Python 3, where every class already
> derives from `object`.

## oop-intermediate-023
topic: polymorphism
answer: B, D

```cpp
class Animal {
public:
    virtual ~Animal() = default;
    virtual Animal* clone() const;
};
```

Which of these declarations, placed in `class Dog : public Animal`, compile as an override of `clone`? Select all that apply.

- A: `Dog clone() const override;`
- B: `Dog* clone() const override;`
- C: `std::unique_ptr<Dog> clone() const override;`
- D: `Animal* clone() const override;`
- E: `Dog* clone() override;`

> An override may narrow its return type only covariantly: a pointer or
> reference to a class may become a pointer or reference to a class derived
> from it. So `Dog*` (B) and the original `Animal*` (D) work. A returns a
> `Dog` by value and C a smart pointer, neither of which is covariant with
> `Animal*`, so both are errors. E drops `const`, so it is a different
> signature that overrides nothing — and `override` makes that an error.

## oop-intermediate-024
topic: relationships
answer: A

A game has `Enemy`, with subclasses `FlyingEnemy` and `ShootingEnemy`. The designers now want enemies that fly and shoot, enemies that swim and shoot, and an enemy that can start flying halfway through a level. Which design handles this best?

- A: Give `Enemy` a `Movement` and an `Attack` object, each an interface with swappable implementations.
- B: Add `FlyingShootingEnemy`, `SwimmingShootingEnemy` and a new subclass for each further pairing.
- C: Make `FlyingEnemy` extend `ShootingEnemy`, so that every flying enemy can shoot as well.
- D: Put `fly()`, `swim()` and `shoot()` in `Enemy`, each checking a flag field before acting.

> Inheritance fixes behaviour per class at compile time, so every
> combination needs its own subclass (B) and the count grows multiplicatively;
> it also cannot change an object's class mid-level. Composing an `Enemy`
> from behaviour objects lets any movement pair with any attack, and
> replacing the `Movement` object changes behaviour at run time — "favour
> composition over inheritance". C forces shooting on every flyer, and D
> piles every ability and its flags into one class.

## oop-intermediate-025
topic: solid
answer: D

`Employee` has `calculatePay()`, used by the payroll team, and `reportHours()`, used by the operations team. Both call a private helper `regularHours()`. Payroll changes how overtime is counted, edits `regularHours()`, and the operations report silently changes too. This is the textbook illustration of which principle?

- A: Liskov Substitution: `reportHours()` no longer behaves as its callers expect.
- B: Open/Closed: `regularHours()` should have been marked `final` from the start.
- C: Interface Segregation: `Employee` should implement `Payable` and `Reportable`.
- D: Single Responsibility: it answers to two actors with different reasons to change.

> The Single Responsibility Principle is about reasons to change: a class
> should answer to one actor. Here two teams' rules share code, so a change
> for one breaks the other. Splitting the pay and hours logic into separate
> classes fixes it. Liskov is about subtypes (there are none here), `final`
> does not stop an edit to the method itself, and adding two interfaces over
> the same class would still leave the shared helper in place.

## oop-intermediate-026
topic: design-patterns
answer: C

```java
interface WidgetFactory {
    Button createButton();
    Checkbox createCheckbox();
    Menu createMenu();
}

class MacWidgets implements WidgetFactory { /* returns MacButton, MacCheckbox, MacMenu */ }
class WinWidgets implements WidgetFactory { /* returns WinButton, WinCheckbox, WinMenu */ }
```

The application picks one factory at start-up and creates every widget through it. Which pattern is this, and what does it ensure?

- A: Factory Method: each widget class decides which of its own subclasses to create.
- B: Builder: a complex widget is assembled step by step from smaller parts.
- C: Abstract Factory: every widget the application makes comes from one family.
- D: Singleton: only one instance of each kind of widget can ever exist.

> An Abstract Factory is an object whose methods each create one product of
> a family (button, checkbox, menu), with one implementation per family.
> Choosing the factory once guarantees the products match — no Mac button
> beside a Windows menu — and the rest of the code names only the
> interfaces. A Factory Method is a single overridable creation method in a
> class that also uses the product.

## oop-intermediate-027
topic: design-patterns
answer: B

`ReportExporter` has a `final` method `export()` that calls `header()`, `rows()` and `footer()`; `CsvExporter` and `PdfExporter` extend it and override those steps. A teammate proposes instead one `ReportExporter` class that is handed a `Formatter` object and calls its methods for each step. Which patterns are these two designs?

- A: The first is Strategy (steps varied by subclassing); the second is Template Method (varied by an object).
- B: The first is Template Method (steps varied by subclassing); the second is Strategy (varied by an object).
- C: Both are Template Method; the second only moves the steps into another class.
- D: The first is Factory Method; the second is Decorator.

> Template Method fixes an algorithm's outline in a base-class method and
> lets subclasses fill in the steps — variation by inheritance, chosen when
> the subclass is written. Strategy puts the varying behaviour in a separate
> object the class is given — variation by composition, which can be
> swapped at run time and tested on its own. The second design is the
> composition alternative to the first.

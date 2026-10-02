---
skill: oop
level: basic
---

## oop-basic-028
topic: classes-objects
answer: A
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
using namespace std;

class Point {
public:
    int x;
    Point(int v) : x(v) {}
};

int main() {
    Point a(1);
    Point b = a;
    Point* p = &a;
    b.x = 2;
    p->x = 3;
    cout << a.x << " " << b.x << endl;
    return 0;
}
```

- A: `3 2`
- B: `3 3`
- C: `2 2`
- D: `1 2`

> In C++ a variable of class type holds the object itself, so `Point b = a;`
> makes a second object, a copy, and `b.x = 2` changes only the copy. A
> pointer is different: `p` holds the address of `a`, so `p->x = 3` changes
> `a`. (In Java or Python, `b = a` would copy a reference, and both names
> would see every change; that reasoning gives `3 3`.)

## oop-basic-029
topic: classes-objects
answer: B
run: python

What does this Python program print?

```python
class Team:
    members = []

    def add(self, name):
        self.members.append(name)


red = Team()
blue = Team()
red.add("asha")
blue.add("ravi")
print(len(red.members), len(blue.members), red.members is blue.members)
```

- A: `1 1 False`
- B: `2 2 True`
- C: `1 1 True`
- D: `2 2 False`

> `members = []` in the class body creates one list that belongs to the class.
> `self.members.append(...)` only reads the name `members`; neither object has
> an attribute of that name, so both reads find the class's single list, and
> both appends go into it. The fix is `self.members = []` inside `__init__`,
> which gives each object its own list.

## oop-basic-030
topic: classes-objects
answer: C

```python
class Box:
    pass


a = Box()
b = Box()
a.size = 3
print(b.size)
```

What happens when this Python program runs?

- A: It prints `3`.
- B: It prints `None`.
- C: It raises `AttributeError`.
- D: It prints `0`.

> Python lets you add an attribute to one object at run time: `a.size = 3`
> stores `size` in `a`'s own attributes only. It changes neither the class
> nor `b`, and Python has no default value for a missing attribute, so
> reading `b.size` finds nothing on `b` or on `Box` and raises
> `AttributeError`.

## oop-basic-031
topic: classes-objects
answer: D

```java
class Node {
    Node next;

    void linkTo(Node other) {
        other.next = this;
    }
}
```

In Java, after `Node a = new Node(); Node b = new Node(); a.linkTo(b);`, which of these is true?

- A: `a.next == b`
- B: `b.next == b`
- C: `a.next == a`
- D: `b.next == a`

> Inside an instance method, `this` is the object the method was called on.
> The call is `a.linkTo(b)`, so `this` is `a` and `other` is `b`, and the
> method sets `b.next` to `a`. `a.next` is never assigned and stays `null`.

## oop-basic-032
topic: encapsulation
answer: A
run: java

What does this Java program print?

```java
class Wallet {
    private int cash;

    Wallet(int cash) {
        this.cash = cash;
    }

    boolean richerThan(Wallet other) {
        return cash > other.cash;
    }
}

public class Main {
    public static void main(String[] args) {
        Wallet mine = new Wallet(50);
        Wallet yours = new Wallet(30);
        System.out.println(mine.richerThan(yours) + " " + yours.richerThan(mine));
    }
}
```

- A: `true false`
- B: It does not compile, because `other.cash` is another object's private field.
- C: `false true`
- D: `true true`

> In Java, `private` restricts access by class, not by object: any code
> written inside `Wallet` may read the private fields of any `Wallet`,
> including `other`. So it compiles, `mine` (50) is richer than `yours` (30),
> and not the other way round.

## oop-basic-033
topic: encapsulation
answer: B
run: python

What does this Python program print?

```python
class Temperature:
    def __init__(self):
        self._c = 0

    @property
    def celsius(self):
        return self._c

    @celsius.setter
    def celsius(self, value):
        if value < -273:
            value = -273
        self._c = value


t = Temperature()
t.celsius = -500
t.celsius += 10
print(t.celsius)
```

- A: `-490`
- B: `-263`
- C: `-273`
- D: `10`

> A property is Python's getter and setter behind ordinary attribute syntax.
> `t.celsius = -500` calls the setter, which clamps the value to -273.
> `t.celsius += 10` reads through the getter (-273), adds 10 and writes -263
> back through the setter, which accepts it. Skipping the setter's check
> would give -490.

## oop-basic-034
topic: encapsulation
answer: C

```java
class IntStack {
    public int[] items = new int[100];
    public int top = -1;

    public void push(int x) { items[++top] = x; }
    public int pop() { return items[top--]; }
}
```

Code elsewhere in the project has started writing `s.top = 5;` and `s.items[0] = 9;`, and stacks keep ending up corrupted. Which change stops that while keeping `push` and `pop` usable by everyone?

- A: Make `push` and `pop` private, and leave the two fields public.
- B: Make `top` static, so that every stack checks the same counter.
- C: Make `items` and `top` private, and leave `push` and `pop` public.
- D: Make the class `final`, so that no other class can change its fields.

> The stack's state is only safe if the methods that keep it consistent are
> the only way in. Private fields stop outside code from writing `top` or
> `items` directly, while public `push` and `pop` remain the interface. A
> does the opposite, a static `top` would be shared by every stack, and
> `final` on a class only prevents subclassing; its public fields stay
> writable.

## oop-basic-035
topic: encapsulation
answer: B, C

```cpp
class A {
    int x = 1;
public:
    int y = 2;
};

struct B {
    int x = 3;
private:
    int y = 4;
};
```

In a C++ `main` that declares `A a;` and `B b;`, which of these expressions compile? Select all that apply.

- A: `a.x`
- B: `a.y`
- C: `b.x`
- D: `b.y`

> In C++ the only difference between `class` and `struct` is the default
> access: members of a `class` are private until a label says otherwise,
> members of a `struct` are public. So `a.x` is private and `a.y` public,
> while `b.x` is public and `b.y` is private because of its explicit label.

## oop-basic-036
topic: constructors
answer: D
run: python

What does this Python program print?

```python
class Base:
    def __init__(self):
        self.tag = "base"


class Child(Base):
    def __init__(self):
        self.size = 1


c = Child()
print(hasattr(c, "tag"), c.size)
```

- A: `True 1`
- B: It raises `TypeError`, because `Base.__init__` was never called.
- C: It raises `AttributeError` at `c.size`.
- D: `False 1`

> Unlike Java and C++, Python does not run the parent's constructor for you.
> `Child` defines its own `__init__`, which replaces `Base.__init__` for
> `Child` objects, and it never calls `super().__init__()`, so `tag` is never
> set. Nothing checks that, so no error is raised: the object simply has
> `size` and no `tag`.

## oop-basic-037
topic: constructors
answer: A
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
#include <string>
using namespace std;

class Guard {
    string name;
public:
    Guard(string n) : name(n) { cout << "+" << name; }
    ~Guard() { cout << "-" << name; }
};

int main() {
    Guard a("a");
    {
        Guard b("b");
    }
    Guard c("c");
    cout << "|";
    return 0;
}
```

- A: `+a+b-b+c|-c-a`
- B: `+a+b+c|-c-b-a`
- C: `+a+b-b+c|-a-c`
- D: `+a+b+c|-a-b-c`

> A local object is destroyed when the block that declares it ends. `b` lives
> in the inner block, so `-b` prints at its closing brace, before `c` is even
> created. `a` and `c` live until the end of `main`, after `|`, and objects in
> one scope are destroyed in reverse order of construction: `c` first, then
> `a`.

## oop-basic-038
topic: constructors
answer: B

In Java, this line runs: `Robot[] team = new Robot[3];`. What does `team` hold straight afterwards?

- A: Three `Robot` objects, each made by the no-argument constructor.
- B: Three `null` references; no `Robot` object has been created yet.
- C: One `Robot` object, shared by all three slots of the array.
- D: Nothing yet; the array is only created when `team[0]` is first used.

> `new Robot[3]` creates an array object with three slots for `Robot`
> references, each starting as `null`. No `Robot` constructor runs, so no
> `Robot` exists until code such as `team[0] = new Robot();` creates one.
> (C++ is different: `Robot team[3];` constructs three objects.)

## oop-basic-039
topic: constructors
answer: A, C, E

```cpp
class Timer {
    int secs;
public:
    Timer(int s) : secs(s) {}
};
```

Which of these C++ declarations compile? Select all that apply.

- A: `Timer a(5);`
- B: `Timer b;`
- C: `Timer* c = new Timer(2);`
- D: `Timer d[3];`
- E: `Timer e = Timer(7);`

> Declaring any constructor stops the compiler from generating a default
> (no-argument) one, so `Timer` can only be built from an `int`. A, C and E
> all pass one. `Timer b;` needs `Timer()`, and so does `Timer d[3];`: in C++
> an array of objects constructs every element, with no argument to give
> them.

## oop-basic-040
topic: inheritance
answer: C
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
#include <string>
using namespace std;

class Animal {
public:
    string name = "animal";
    string describe() { return "I am " + name; }
};

class Dog : public Animal {
public:
    Dog() { name = "dog"; }
};

int main() {
    Dog d;
    Animal a;
    cout << d.describe() << ", " << a.describe() << endl;
    return 0;
}
```

- A: `I am animal, I am animal`
- B: `I am dog, I am dog`
- C: `I am dog, I am animal`
- D: It does not compile, because `Dog` declares no `describe()`.

> With public inheritance, `Dog` gets `Animal`'s public members: the field
> `name` and the method `describe()`. Each object has its own `name`; `Dog`'s
> constructor runs after `Animal`'s initialiser and overwrites `d`'s copy with
> `"dog"`, while `a` keeps `"animal"`. The inherited `describe()` reads the
> field of whichever object it is called on.

## oop-basic-041
topic: inheritance
answer: B, C, D

In the options below, `Car` and `Boat` are classes, and `Floats` and `Steerable` are Java interfaces. Which declarations are legal? Select all that apply.

- A: Java: `class Amphi extends Car, Boat { }`
- B: C++: `class Amphi : public Car, public Boat { };`
- C: Python: `class Amphi(Car, Boat): pass`
- D: Java: `class Amphi extends Car implements Floats, Steerable { }`
- E: Java: `class Amphi implements Car { }`

> Java allows a class only one superclass, so it rejects `extends Car, Boat`,
> but it may implement any number of interfaces alongside that one superclass
> (D). C++ and Python both allow a class to inherit from several classes at
> once. `implements` takes interfaces only, so naming the class `Car` there is
> an error.

## oop-basic-042
topic: inheritance
answer: D

```java
final class Config {
    int port = 8080;
}

class DevConfig extends Config {
    int debugPort = 5005;
}
```

What happens when this Java code is compiled?

- A: It compiles; `final` only stops `Config`'s fields from being changed.
- B: It compiles, but `DevConfig` may not declare fields of its own.
- C: It compiles, but `new DevConfig()` throws an exception when it runs.
- D: `DevConfig` fails to compile, because a `final` class cannot be extended.

> `final` on a class means it can have no subclasses, so the compiler rejects
> `extends Config`. (`final` on a field makes the field unchangeable, and on a
> method it stops overriding; those are different uses of the same keyword.)
> Classes such as `String` are final for this reason: nobody can subclass
> them and change their behaviour.

## oop-basic-043
topic: inheritance
answer: A

```java
class Base {
    private int id = 7;

    public int getId() {
        return id;
    }
}

class Sub extends Base { }
```

In Java, what does `new Sub().getId()` return, and why?

- A: `7`: the `Sub` object holds `id`, even though code in `Sub` cannot name it.
- B: `0`: private fields are not inherited, so `Sub` gets a default `id` instead.
- C: Nothing: `Sub` does not compile, because the inherited `getId` reads a private field.
- D: Nothing: the call throws at run time, because `id` is private to `Base`.

> A subclass object contains every field of its superclasses, private ones
> included; `private` only controls which code may name the field. `getId()`
> is written inside `Base`, so it may read `id`, and `Sub` inherits it, so the
> call compiles and returns the object's `id`, which was initialised to 7.

## oop-basic-044
topic: polymorphism
answer: B
run: java

What does this Java program print?

```java
class Employee {
    int base() { return 100; }
    int bonus() { return 0; }
    int pay() { return base() + bonus(); }
}

class Manager extends Employee {
    int bonus() { return 50; }
}

class Director extends Manager {
    int base() { return 200; }
}

public class Main {
    public static void main(String[] args) {
        Employee[] staff = { new Employee(), new Manager(), new Director() };
        String out = "";
        for (Employee e : staff) {
            out += e.pay() + " ";
        }
        System.out.println(out.trim());
    }
}
```

- A: `100 100 100`
- B: `100 150 250`
- C: `100 150 200`
- D: `100 150 300`

> Every element is used through an `Employee` reference, yet each call runs
> the version that belongs to the object. Inside `pay()`, `base()` and
> `bonus()` are dispatched the same way: an `Employee` gets 100 + 0, a
> `Manager` 100 + 50, and a `Director` its own `base()` of 200 plus the
> `bonus()` it inherits from `Manager`, 50.

## oop-basic-045
topic: polymorphism
answer: C
run: python

What does this Python program print?

```python
class Cat:
    def speak(self):
        return "meow"


class Lion(Cat):
    def speak(self):
        return "roar"


class Robot:
    def speak(self):
        return "beep"


for thing in [Cat(), Lion(), Robot()]:
    print(thing.speak(), end=" ")
print()
```

- A: `meow meow meow`
- B: `meow meow beep`
- C: `meow roar beep`
- D: It raises `TypeError` on the `Robot`, which is not a `Cat`.

> Python looks a method up on the object at the moment of the call, so each
> object answers with its own `speak()`: `Lion` overrides `Cat`'s. `Robot`
> shares no base class with the others, but it does not need to; any object
> with a `speak()` method works in the loop. This is duck typing, Python's
> usual form of polymorphism.

## oop-basic-046
topic: polymorphism
answer: D

```java
class Parser {
    int parse(String s) { return Integer.parseInt(s); }
    double parse(String s) { return Double.parseDouble(s); }
}
```

Why does this Java class not compile?

- A: Java allows only one method with a given name in each class.
- B: Overloads must differ in how many parameters they take, not only in their types.
- C: Both methods can throw `NumberFormatException`, which neither one declares.
- D: The two differ only in return type; their parameter lists are identical.

> Overloads are told apart by their parameter lists, because that is all the
> compiler can see at a call such as `parse("7")`. Two methods with the same
> name and the same parameters clash, whatever their return types. Different
> parameter types are enough to overload (B), names may repeat (A), and
> `NumberFormatException` is unchecked, so it need not be declared (C).

## oop-basic-047
topic: polymorphism
answer: A

A payroll loop adds up `e.pay()` for every element of an `Employee[]`. Next month a `Contractor`, paid by the hour, must join the list. Using runtime polymorphism, what is the whole change?

- A: Write `Contractor extends Employee`, overriding `pay()`; the loop is not edited.
- B: Add `if (e instanceof Contractor)` in the loop, with the hourly formula inside.
- C: Add `pay(Contractor c)` to `Employee` as an overload of the existing `pay()`.
- D: Change the array's type to `Contractor[]`, so that the new formula is used.

> The loop calls `e.pay()` through an `Employee` reference, and the object
> decides which `pay()` runs. A new subclass with its own `pay()` therefore
> works with no change to the loop. The `instanceof` branch would work, but it
> is exactly the edit polymorphism removes. An overload `pay(Contractor c)` is
> a different method with a different parameter list, and the loop's
> `e.pay()` would never call it.

## oop-basic-048
topic: abstraction
answer: B
run: python

What does this Python program print?

```python
from abc import ABC, abstractmethod


class Storage(ABC):
    @abstractmethod
    def save(self, item):
        pass

    def save_all(self, items):
        return [self.save(x) for x in items]


class Disk(Storage):
    def save(self, item):
        return item * 2


print(Disk().save_all([1, 2, 3]))
```

- A: `[1, 2, 3]`
- B: `[2, 4, 6]`
- C: `[None, None, None]`
- D: It raises `TypeError`, because `Storage` is abstract.

> `Storage` is abstract and could not be instantiated itself, but `Disk`
> implements its one abstract method, so `Disk()` is allowed. `save_all` is a
> concrete method written once in the abstract class, and its `self.save(x)`
> runs `Disk`'s version, doubling each item.

## oop-basic-049
topic: abstraction
answer: C

```python
from abc import ABC, abstractmethod


class Storage(ABC):
    @abstractmethod
    def save(self, item):
        pass


class Cloud(Storage):
    def upload(self, item):
        return "sent " + item


c = Cloud()
print(c.upload("a"))
```

What happens when this Python program runs?

- A: It prints `sent a`; an abstract method only matters if it is called.
- B: It raises `NotImplementedError` as soon as the class `Cloud` is defined.
- C: `Cloud()` raises `TypeError`, because `save` is still abstract.
- D: It prints `sent a`, and calling `c.save(1)` would return `None`.

> A class that derives from `ABC` and still has an abstract method left
> unimplemented is itself abstract. `Cloud` adds `upload` but never defines
> `save`, so creating a `Cloud` object fails with `TypeError` at `Cloud()`,
> before `upload` is called. Defining the class is fine; the check happens at
> instantiation.

## oop-basic-050
topic: abstraction
answer: D

```java
interface Shape {
    double area();
    double perimeter();
}

class Circle implements Shape {
    double r = 1;

    public double area() {
        return Math.PI * r * r;
    }
}
```

Why does `Circle` not compile?

- A: `area()` in `Circle` must not be `public`, since the interface's method is not.
- B: A class that implements an interface may not declare fields of its own.
- C: `Circle` must call `super()` to run the constructor of `Shape`.
- D: `Circle` leaves `perimeter()` unimplemented and is not declared `abstract`.

> A concrete class must provide a body for every abstract method it inherits.
> `Circle` implements `area()` but not `perimeter()`, so it must either add
> one or be declared `abstract`. Interface methods are implicitly `public`, so
> the implementation must be `public` (A has it backwards), and an interface
> has no constructor to call.

## oop-basic-051
topic: abstraction
answer: A

```java
interface Limits {
    int MAX = 10;
}

class App implements Limits {
    void bump() {
        MAX++;
    }
}
```

What happens when this Java code is compiled?

- A: It fails: a field declared in an interface is implicitly `public static final`.
- B: It compiles, and `bump()` raises `MAX` for every class that uses `Limits`.
- C: It compiles, and each `App` object gets its own copy of `MAX` to change.
- D: It fails: an interface may not declare fields at all.

> An interface can declare fields, but every one is implicitly `public`,
> `static` and `final`: a constant shared by everything that uses the
> interface, assigned once. `MAX++` tries to assign to a `final` variable, so
> `App` does not compile. An interface cannot give its implementing objects
> state of their own; that needs an abstract class.

## oop-basic-052
topic: relationships
answer: B
run: cpp

What does this C++ program print?

```cpp
#include <iostream>
using namespace std;

struct Engine {
    Engine() { cout << "E"; }
    ~Engine() { cout << "e"; }
};

struct Car {
    Engine engine;
    Car() { cout << "C"; }
    ~Car() { cout << "c"; }
};

int main() {
    {
        Car car;
    }
    cout << endl;
    return 0;
}
```

- A: `CEce`
- B: `ECce`
- C: `ECec`
- D: `CEec`

> A `Car` has-a `Engine` as a member object, so the engine is part of the
> car. Members are constructed before the constructor body of the object that
> contains them runs (`E`, then `C`), and destroyed after its destructor body
> (`c`, then `e`). The part exists exactly as long as the whole.

## oop-basic-053
topic: relationships
answer: C

A developer writes `class Stack extends ArrayList<Integer>` and adds `push` and `pop`. Callers soon start using `add(0, x)` and `remove(3)` on it, putting items into the middle of the stack. Which design rules that out?

- A: Keep `extends ArrayList<Integer>` and mark the `Stack` class `final`.
- B: Keep `extends ArrayList<Integer>` and mark `push` and `pop` `final`.
- C: Hold a private `ArrayList<Integer>` field and expose only `push`, `pop` and `peek`.
- D: Keep `extends ArrayList<Integer>` and document that only `push` and `pop` may be used.

> Inheriting from `ArrayList` makes a `Stack` an `ArrayList`, so every public
> list method comes with it; no modifier on `Stack` or its own methods takes
> them away, and documentation enforces nothing. With composition, the stack has-a list that outside code
> cannot reach, and its own three methods are the whole interface.

## oop-basic-054
topic: relationships
answer: D

```java
class Document { }

class Invoice extends Document { }

class Report {
    private Document body = new Document();
}

class Printer {
    void print(Document d) { /* ... */ }
}
```

Which description of these Java classes is accurate?

- A: `Invoice` has-a `Document`; `Report` is-a `Document`; `Printer` has-a `Document`.
- B: `Invoice` is-a `Document`; `Report` is-a `Document`; `Printer` has-a `Document`.
- C: `Invoice` has-a `Document`; `Report` has-a `Document`; `Printer` is-a `Document`.
- D: `Invoice` is-a `Document`; `Report` has-a `Document`; `Printer` uses a `Document`.

> `extends` makes `Invoice` a kind of `Document` (is-a). `Report` keeps a
> `Document` in a field for as long as it exists (has-a). `Printer` neither
> inherits nor stores one: it only receives a `Document` as a parameter for
> the length of one call, a looser "uses" relationship.

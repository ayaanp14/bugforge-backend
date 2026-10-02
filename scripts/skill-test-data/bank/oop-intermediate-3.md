---
skill: oop
level: intermediate
---

## oop-intermediate-055
topic: classes-objects
answer: D
run: python

What does this program print?

```python
class User:
    def __init__(self, uid, name):
        self.uid = uid
        self.name = name

    def __eq__(self, other):
        return isinstance(other, User) and self.uid == other.uid

    def __hash__(self):
        return hash(self.uid)

roles = {}
roles[User(1, "ann")] = "admin"
roles[User(1, "bob")] = "viewer"
key, value = next(iter(roles.items()))
print(len(roles), key.name, value)
```

- A: `2 ann admin`
- B: `1 bob viewer`
- C: `1 ann admin`
- D: `1 ann viewer`

> Both `User`s have uid 1, so they hash alike and compare equal: to the dict
> they are the same key, and there is one entry. Assigning to a key that is
> already present replaces the *value* but keeps the key object that was
> stored first, so the key is still the `ann` object while the value is
> `viewer`. Equality by id is right for an entity, but any other data the
> key carries is not what the dict will hand back.

## oop-intermediate-056
topic: encapsulation
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <vector>

class Stats {
    std::vector<int> data;
    int sum = 0;
public:
    void add(int x) { data.push_back(x); sum += x; }
    std::vector<int>& values() { return data; }
    int total() const { return sum; }
    int recount() const {
        int s = 0;
        for (int x : data) s += x;
        return s;
    }
};

int main() {
    Stats s;
    s.add(2);
    s.add(3);
    s.values().push_back(10);
    std::vector<int> snapshot = s.values();
    snapshot.push_back(100);
    std::cout << s.total() << " " << s.recount() << "\n";
}
```

- A: `5 15`
- B: `15 15`
- C: `5 115`
- D: `5 5`

> `values()` returns a non-const reference to the private vector, so
> `s.values().push_back(10)` changes it without going through `add()` — the
> cached `sum` stays 5 while the data now adds up to 15. The class invariant
> (`sum` equals the total of `data`) is broken from outside. `snapshot` is
> declared as a plain `std::vector<int>`, so it is a copy, and the 100 never
> reaches `s`. Returning `const std::vector<int>&` would keep the read and
> forbid the write.

## oop-intermediate-057
topic: constructors
answer: B
run: python

What does this program print?

```python
class Config:
    _instance = None

    def __new__(cls, env):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, env):
        self.env = env

a = Config("dev")
b = Config("prod")
print(a is b, a.env)
```

- A: `True dev`
- B: `True prod`
- C: `False dev`
- D: `False prod`

> Creating an object calls `__new__` to get the instance and then, if that
> instance is of the class being created, `__init__` on it. `__new__` returns
> the same object both times, so `a is b` — but `__init__` runs on every
> call, and the second one overwrites `env` with `"prod"`. A singleton built
> this way has to guard `__init__` too, or skip it altogether (a module-level
> object or a factory function is the usual Python answer).

## oop-intermediate-058
topic: inheritance
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Animal {
    std::string name;
    explicit Animal(std::string n) : name(n) {}
    virtual ~Animal() = default;
    virtual std::string sound() const { return "..."; }
};

struct Dog : Animal {
    std::string trick;
    Dog(std::string n, std::string t) : Animal(n), trick(t) {}
    std::string sound() const override { return "woof"; }
};

int main() {
    Dog a("rex", "sit");
    Dog b("max", "roll");
    Animal& ref = a;
    ref = b;
    std::cout << a.name << " " << a.trick << " " << ref.sound() << "\n";
}
```

- A: `max roll woof`
- B: `rex sit woof`
- C: `max sit woof`
- D: `max sit ...`

> `ref = b` calls `Animal::operator=`, chosen from `ref`'s static type — the
> assignment operator is not virtual. It copies only the `Animal` part, so
> `a.name` becomes `max` while `a.trick` stays `sit`: a partial assignment,
> the assignment form of slicing. The object is still a `Dog`, so the
> virtual `sound()` says `woof`. Base classes meant for polymorphic use are
> often made non-copyable for exactly this reason.

## oop-intermediate-059
topic: polymorphism
answer: A
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

struct Base {
    virtual ~Base() = default;
    std::string run() { return tag() + step(); }
    std::string tag() { return "B"; }
    virtual std::string step() { return "1"; }
};

struct Derived : Base {
    std::string tag() { return "D"; }
    std::string step() override { return "2"; }
};

int main() {
    Derived d;
    Base* p = &d;
    std::cout << p->run() << " " << d.run() << " " << d.tag() << p->tag() << "\n";
}
```

- A: `B2 B2 DB`
- B: `D2 D2 DD`
- C: `B2 D2 DB`
- D: `B1 B2 DB`

> Only `step()` is virtual. `run()` is defined in `Base`, so inside it the
> non-virtual call `tag()` is bound at compile time to `Base::tag`, whether
> `run()` was reached through `p` or through `d` — giving `B` both times —
> while `step()` dispatches to `Derived::step`. Outside, `d.tag()` uses the
> static type `Derived` and `p->tag()` the static type `Base`. A non-virtual
> function redefined in a derived class is hidden, not overridden.

## oop-intermediate-060
topic: abstraction
answer: D
run: java

What does this program print?

```java
abstract class Greeter {
    final String name;

    Greeter(String name) { this.name = name; }

    abstract String greet();

    String twice() { return greet() + greet(); }
}

public class Main {
    public static void main(String[] args) {
        Greeter g = new Greeter("ana") {
            @Override
            String greet() { return name.substring(0, 1).toUpperCase(); }
        };
        System.out.println(g.twice() + " " + g.name);
    }
}
```

- A: `AA null`
- B: It does not compile: an abstract class cannot be instantiated with `new`.
- C: It does not compile: an abstract class cannot declare a constructor.
- D: `AA ana`

> `new Greeter("ana") { … }` does not instantiate `Greeter`: it declares an
> anonymous concrete subclass that implements `greet()`, and creates one of
> those. Its implicit constructor passes `"ana"` on to `Greeter`'s
> constructor — abstract classes may have constructors, which run as part of
> building any subclass — so `name` is set before `twice()` calls the
> implementation.

## oop-intermediate-061
topic: relationships
answer: B, C

```cpp
struct Car {
    Engine engine;                  // held by value
    std::unique_ptr<Radio> radio;   // the only owner of its Radio
    Driver* driver;                 // a Driver created and owned elsewhere
    std::shared_ptr<Tyre> spare;    // a Garage holds another shared_ptr to the same Tyre
};
```

A `Car` is destroyed while the `Garage` and the `Driver`'s owner still exist. Which objects are destroyed along with it? Select all that apply.

- A: The `Driver` that `driver` points to.
- B: The `Engine`, `engine`.
- C: The `Radio` that `radio` owns.
- D: The `Tyre` that `spare` points to.

> Ownership decides lifetime. A member held by value is part of the car, and
> a `unique_ptr` member owns its object exclusively: both are destroyed with
> it — composition. A raw pointer owns nothing, so the driver is untouched
> (an association). A `shared_ptr` shares ownership: destroying the car only
> drops one reference, and the tyre lives on while the garage holds
> another.

## oop-intermediate-062
topic: solid
answer: B

`Square extends Rectangle`, and `Square`'s setters change both sides, so code that sets a rectangle's width and then its height gets the wrong area when handed a square. Which redesign removes the Liskov violation while keeping `Square` a subtype of `Rectangle`?

- A: Have `Square.setHeight` throw `UnsupportedOperationException`.
- B: Make both classes immutable: no setters, and a resized shape is a new object.
- C: Have callers check `r instanceof Square` before they resize a rectangle.
- D: Reverse the hierarchy, so that `Rectangle extends Square` and adds a second side.

> The violation lives in the mutators: `Rectangle` promises that setting the
> height leaves the width alone, and no square can keep that promise.
> Without setters, a square satisfies everything an immutable rectangle
> promises — two sides, an area — so substitution holds. Throwing (A) still
> breaks callers that rely on `setHeight`; type checks in callers (C) admit
> the subtype is not substitutable; and a `Rectangle` cannot keep a
> `Square`'s promise that its sides are equal (D).

## oop-intermediate-063
topic: design-patterns
answer: C
run: cpp

What does this program print?

```cpp
#include <functional>
#include <iostream>

struct Checkout {
    std::function<int(int)> price;
    int total = 0;
    void add(int amount) { total += price(amount); }
};

int main() {
    Checkout c{[](int a) { return a; }};
    c.add(100);
    c.price = [](int a) { return a * 9 / 10; };
    c.add(100);
    c.add(50);
    std::cout << c.total << "\n";
}
```

- A: `250`
- B: `225`
- C: `235`
- D: `240`

> The pricing rule is a strategy held in `price`, and each `add` applies
> whichever strategy is installed at that moment: 100 at full price, then
> 90 and 45 after the discount is swapped in, 235 in all. Replacing the
> strategy does not re-price what was already added. That run-time swap,
> without subclassing `Checkout`, is what Strategy offers over inheritance.

## oop-intermediate-064
topic: classes-objects
answer: D

```java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}

class Polygon {
    final List<Point> points;
    Polygon(List<Point> points) { this.points = points; }
    Polygon copy() { return new Polygon(new ArrayList<>(points)); }
}
```

After `Polygon b = a.copy();`, which statement is true?

- A: Adding a point to `b.points` adds it to `a.points` too.
- B: `b.points.get(0) == a.points.get(0)` is false, since `new ArrayList<>(points)` copies each point.
- C: The copy is fully independent: no change made through `b` can be seen through `a`.
- D: Changing `b.points.get(0).x` changes `a.points.get(0).x` too.

> `new ArrayList<>(points)` is a shallow copy: a new list holding the same
> `Point` references. The lists are separate, so adding or removing points
> on one does not affect the other (A is false), but both lists refer to the
> same mutable `Point` objects (so B and C are false and D is true). A deep
> copy would also copy each point — or `Point` could be made immutable, and
> then sharing it would be harmless.

## oop-intermediate-065
topic: encapsulation
answer: A
run: python

What does this program print?

```python
class Roster:
    def __init__(self, names):
        self._names = list(names)

    def names(self):
        return self._names

    def frozen(self):
        return tuple(self._names)

source = ["ana"]
r = Roster(source)
source.append("ben")
r.names().append("cid")
snap = r.frozen()
r.names().append("dev")
print(len(r.names()), len(snap))
```

- A: `3 2`
- B: `4 3`
- C: `3 3`
- D: `2 2`

> The constructor copies the caller's list, so `ben` never gets in. But
> `names()` hands out the internal list itself, and callers append `cid` and
> then `dev` to it: three names. `frozen()` returns a tuple copy taken when
> there were two, and it cannot change afterwards. Copying on the way in
> protects against the caller; only copying (or freezing) on the way out
> protects against everyone else.

## oop-intermediate-066
topic: constructors
answer: C
run: cpp

What does this program print?

```cpp
#include <iostream>

struct Trace {
    explicit Trace(const char* label) { std::cout << label; }
};

struct Widget {
    Trace first;
    Trace second;
    Trace third;
    Widget() : third("3"), second("2"), first("1") {}
};

struct Panel : Widget {
    Trace extra;
    Panel() : extra("4"), Widget() {}
};

int main() {
    Panel p;
    std::cout << "\n";
}
```

- A: `3214`
- B: `4123`
- C: `1234`
- D: `4321`

> The order of a constructor's initialiser list is ignored: base classes are
> initialised first, then members in the order they are *declared* in the
> class. So `Widget` comes before `Panel`'s own member `extra`, and inside
> `Widget` the members go `first`, `second`, `third`. Compilers warn when
> the list is written in another order (`-Wreorder`), because an initialiser
> that reads a member declared later reads it uninitialised.

## oop-intermediate-067
topic: inheritance
answer: B
run: java

What does this program print?

```java
import java.util.*;

class CountingSet<E> extends HashSet<E> {
    int added = 0;

    @Override
    public boolean add(E e) {
        added++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return super.addAll(c);
    }
}

public class Main {
    public static void main(String[] args) {
        CountingSet<String> s = new CountingSet<>();
        s.addAll(List.of("a", "b", "c"));
        System.out.println(s.added + " " + s.size());
    }
}
```

- A: `3 3`
- B: `6 3`
- C: `6 6`
- D: `0 3`

> `addAll` counts 3 and calls `super.addAll`, which `HashSet` inherits from
> `AbstractCollection`: it calls `add` for each element — and `add` is the
> override, which counts each one again. The subclass depended on how its
> parent implements `addAll`, an internal detail: the fragile base class
> problem. A wrapper that holds a `Set` and forwards to it (composition)
> counts correctly whatever the set does inside.

## oop-intermediate-068
topic: polymorphism
answer: D
run: java

What does this program print?

```java
class Shape {
    String meet(Shape other) { return "S/S"; }

    String meet(Circle other) { return "S/C"; }
}

class Circle extends Shape {
    @Override
    String meet(Shape other) { return "C/S"; }

    @Override
    String meet(Circle other) { return "C/C"; }
}

public class Main {
    public static void main(String[] args) {
        Shape a = new Circle();
        Shape b = new Circle();
        Circle c = new Circle();
        System.out.println(a.meet(b) + " " + a.meet(c) + " " + new Shape().meet(c));
    }
}
```

- A: `C/C C/C S/C`
- B: `S/S S/C S/C`
- C: `C/S C/S S/S`
- D: `C/S C/C S/C`

> Java chooses the overload at compile time from the arguments' static
> types, then dispatches the chosen signature on the receiver's runtime
> class. `a.meet(b)`: `b` is declared `Shape`, so `meet(Shape)` is chosen,
> and the receiver is a `Circle`: `C/S`. `a.meet(c)` picks `meet(Circle)`:
> `C/C`. A plain `Shape` receiver runs its own `meet(Circle)`: `S/C`. Only
> the receiver is dispatched dynamically — reacting to the argument's
> runtime type too needs double dispatch, as in the Visitor pattern.

## oop-intermediate-069
topic: abstraction
answer: A

A `UserRepository` interface declares `findById(long id)`, `save(User u)` and `findWhere(String sqlWhereClause)`. The team now wants an in-memory implementation for tests and one that calls a partner's REST API. What is wrong with this interface?

- A: `findWhere` exposes SQL, a detail of one implementation that the other two cannot honour.
- B: It has too few methods: an interface should declare every query a caller might need.
- C: `findById` takes a `long`, which ties every implementation to an SQL auto-increment key.
- D: Nothing: each implementation can throw `UnsupportedOperationException` for what it cannot do.

> An abstraction should be stated in the caller's terms, not in one
> implementation's. A raw `WHERE` clause leaks the SQL database through the
> interface, so other implementations would have to parse SQL, and callers
> are tied to the database's schema. Methods such as `findByEmail(String)`
> keep it honest. A `long` id is not SQL-specific (C), and throwing for
> unsupported methods (D) breaks substitutability rather than fixing it.

## oop-intermediate-070
topic: relationships
answer: C

In UML's notation a filled diamond means composition and a hollow diamond means aggregation. How should a class diagram connect `Team` and `Player`, given that a player exists before joining a team, can move between teams, and is not deleted when a team is disbanded?

- A: A filled diamond at the `Team` end.
- B: A hollow diamond at the `Player` end.
- C: A hollow diamond at the `Team` end.
- D: A generalisation arrow from `Player` to `Team`.

> A team is a whole made of players, but it does not own their lifetimes:
> they exist independently and can belong to other teams over time. That is
> aggregation, and the diamond goes at the whole's end — the `Team`. A filled
> diamond would say a player belongs to one team and dies with it. A
> generalisation arrow would say a player is a kind of team.

## oop-intermediate-071
topic: solid
answer: B

```java
class OrderService {
    private final MySqlOrderRepository repo = new MySqlOrderRepository();

    void place(Order o) { repo.insert(o); }
}
```

Unit tests of `OrderService` need a running database because of the first line. Which change applies the Dependency Inversion Principle?

- A: Make `MySqlOrderRepository` a singleton, so that every service shares one connection.
- B: Declare an `OrderRepository` interface and pass an implementation into the constructor.
- C: Make `OrderService` extend `MySqlOrderRepository`, so it calls the queries directly.
- D: Make the repository's methods `static`, so `OrderService` never creates an instance.

> Dependency Inversion says high-level policy (placing orders) should depend
> on an abstraction, not on a low-level detail (MySQL). With an
> `OrderRepository` interface passed in, production wires the MySQL version
> and a test passes an in-memory fake. A singleton, inheritance or static
> methods all keep `OrderService` bound to the concrete MySQL class — the
> latter two even more tightly.

## oop-intermediate-072
topic: design-patterns
answer: A
run: java

What does this program print?

```java
import java.util.*;

interface Command {
    void execute();
    void undo();
}

public class Main {
    static int value = 0;

    static Command add(int n) {
        return new Command() {
            public void execute() { value += n; }
            public void undo() { value -= n; }
        };
    }

    static Command times(int n) {
        return new Command() {
            public void execute() { value *= n; }
            public void undo() { value /= n; }
        };
    }

    public static void main(String[] args) {
        Deque<Command> history = new ArrayDeque<>();
        for (Command c : List.of(add(5), times(3), add(2))) {
            c.execute();
            history.push(c);
        }
        history.pop().undo();
        history.pop().undo();
        Command again = add(10);
        again.execute();
        history.push(again);
        System.out.println(value + " " + history.size());
    }
}
```

- A: `15 2`
- B: `14 2`
- C: `15 4`
- D: `27 4`

> Each operation is a Command object that knows how to undo itself, and the
> history is a stack. Executing gives 5, 15, 17. `push` and `pop` work at the
> same end of the deque, so the undos run newest first: undo `add(2)` gives
> 15, undo `times(3)` gives 5. Then `add(10)` gives 15. Two commands were
> popped, leaving `add(5)`, and `again` was pushed: size 2. Undoing in the
> wrong order would give B's 14.

## oop-intermediate-073
topic: encapsulation
answer: D

A Python class started with a plain public attribute, `self.price`, and hundreds of call sites now read `item.price` and assign `item.price = x`. Prices must now be validated so that they are never negative. What is the idiomatic change?

- A: Rename it to `_price`, add `get_price()` and `set_price()`, and update every caller.
- B: Rename it to `__price`, so that name mangling stops callers assigning a negative value.
- C: Add `price` to `__slots__`, which makes Python check each value assigned to it.
- D: Make `price` a `@property` with a validating setter; callers keep writing `item.price`.

> A property turns attribute access into method calls without changing the
> syntax at the call sites — which is why Python classes do not write getters
> and setters up front: a plain attribute can become a property later. Name
> mangling only renames the attribute (and would break every caller), and
> `__slots__` limits which attribute names exist, not their values.

## oop-intermediate-074
topic: constructors
answer: B, C, E

Compared with a public constructor, what can a static factory method such as `Color.of(r, g, b)` do? Select all that apply.

- A: Be overridden in a subclass and chosen by dynamic dispatch.
- B: Return an existing, cached instance instead of a new one.
- C: Return an object of a subclass of its declared return type.
- D: Run before its class has been loaded, which saves start-up time.
- E: Have a name that says how the object is made, such as `fromHex`.

> A constructor always creates a new object of exactly its class and is
> named after the class. A static factory may return a cached instance (B,
> as `Integer.valueOf` and `List.of()` do), choose a subclass or hidden
> implementation class (C, as `EnumSet.of` does), and carry a descriptive
> name (E). Static methods are not overridden — they are hidden, chosen at
> compile time (A) — and calling one loads and initialises the class like
> any other use of it (D).

## oop-intermediate-075
topic: inheritance
answer: C
run: python

What does this program print?

```python
class Exporter:
    ext = "txt"

    def filename(self, stem):
        return stem + "." + self.ext

class CsvExporter(Exporter):
    ext = "csv"

class GzipCsv(CsvExporter):
    def filename(self, stem):
        return super().filename(stem) + ".gz"

print(GzipCsv().filename("r"), Exporter.filename(GzipCsv(), "s"))
```

- A: `r.txt.gz s.txt`
- B: `r.csv.gz s.txt`
- C: `r.csv.gz s.csv`
- D: `r.csv.gz s.csv.gz`

> `self.ext` is looked up when it runs, starting from the object's class:
> for a `GzipCsv` that finds `CsvExporter.ext`, wherever the method was
> defined. So both calls use `csv`. `Exporter.filename(GzipCsv(), "s")`
> calls `Exporter`'s function directly, so `GzipCsv.filename` and its
> `.gz` are skipped. Unlike Java fields, Python class attributes reached
> through `self` behave polymorphically.

## oop-intermediate-076
topic: polymorphism
answer: B
run: java

What does this program print?

```java
class Report {
    private String header() { return "base"; }

    String render() { return header() + "|" + footer(); }

    String footer() { return "end"; }
}

class Invoice extends Report {
    String header() { return "invoice"; }

    @Override
    String footer() { return "total"; }
}

public class Main {
    public static void main(String[] args) {
        Invoice inv = new Invoice();
        System.out.println(inv.render() + " " + inv.header());
    }
}
```

- A: `invoice|total invoice`
- B: `base|total invoice`
- C: `base|end invoice`
- D: It does not compile: `header()` in `Invoice` clashes with the private one in `Report`.

> A private method is not inherited, so it cannot be overridden: `Invoice`'s
> `header()` is a new, unrelated method, and the call inside `Report.render()`
> is bound to `Report`'s own private `header()`. `footer()` is a normal
> instance method and dispatches to `Invoice`'s override. Called directly on
> an `Invoice`, `header()` is `Invoice`'s method. Writing `@Override` on it
> would have turned the mistake into a compile error.

## oop-intermediate-077
topic: abstraction
answer: D

A Python function accepts any object with a `read(n)` method — files, sockets and test fakes that share no base class. Which tool lets a static type checker such as mypy verify those arguments without the classes inheriting from anything?

- A: `abc.ABC` with `@abstractmethod`, which accepts any class that has the methods.
- B: An `isinstance` check against a common base class, made inside the function.
- C: `__slots__ = ("read",)` declared on every class that should be accepted.
- D: `typing.Protocol`, which accepts any class that has the methods.

> A `Protocol` describes a type structurally: any class with a matching
> `read` method satisfies it, with no declared relationship — static duck
> typing. An ABC is nominal: a class conforms by subclassing it (or by an
> explicit `register` call), which is exactly what these classes do not do.
> An `isinstance` check needs the common base the classes lack, and
> `__slots__` controls attribute storage, not types.

## oop-intermediate-078
topic: relationships
answer: A

`Printer` has a method `print(Document doc)` and keeps no reference to the document after the call returns. In UML, how is `Printer`'s relationship to `Document` best drawn?

- A: A dependency: a dashed arrow from `Printer` to `Document`.
- B: A composition: a filled diamond at the `Printer` end of the line.
- C: An association with multiplicity `1`, since each call needs one document.
- D: A realisation: a dashed line with a hollow triangle at `Document`.

> When a class only uses another transiently — as a parameter, a local
> variable or a return type — and holds no lasting reference, UML calls it a
> dependency, drawn as a dashed arrow towards the class used. An association
> means an object keeps a link to the other (typically a field); composition
> adds exclusive ownership; realisation means implementing an interface.

## oop-intermediate-079
topic: solid
answer: C

Under the Dependency Inversion Principle, a billing module (high-level policy) talks to a payment gateway (a low-level detail) through an interface. Where should that interface be declared, and in whose terms?

- A: In the gateway module, mirroring the gateway's own API, so billing depends on the gateway.
- B: In a shared utilities module that both import, mirroring the gateway's own API.
- C: In the billing module, in the terms billing needs, so the gateway code depends on billing.
- D: Nowhere: billing calls the gateway class directly, and tests replace it with reflection.

> The "inversion" is in who owns the abstraction. The high-level module
> declares the interface it needs (`charge(amount, card)`), and the gateway
> adapter implements it, so source dependencies point from the detail to the
> policy. An interface that mirrors the gateway's API (A, B) still drags the
> gateway's concepts into billing, and a new gateway would change it.

## oop-intermediate-080
topic: design-patterns
answer: B

```java
interface Logger {
    void log(String level, String message);
}

class LegacyAudit {                       // third-party; cannot be changed
    void write(int severity, char[] text) { /* ... */ }
}

class AuditLogger implements Logger {
    private final LegacyAudit audit = new LegacyAudit();

    public void log(String level, String message) {
        audit.write(level.equals("ERROR") ? 2 : 1, message.toCharArray());
    }
}
```

Which pattern is `AuditLogger`?

- A: Decorator: it wraps an object of the same interface and adds behaviour.
- B: Adapter: it lets a class be used through an interface it does not implement.
- C: Facade: it gives one simple entry point to a whole subsystem of classes.
- D: Proxy: it controls access to `LegacyAudit` while offering the same interface.

> `AuditLogger` translates calls on the interface the application expects
> (`Logger`) into calls on a class with a different interface that cannot be
> changed (`LegacyAudit`) — the definition of an Adapter. A Decorator and a
> Proxy both present the *same* interface as the object they wrap, and a
> Facade simplifies a subsystem of many classes rather than converting one
> interface into another.

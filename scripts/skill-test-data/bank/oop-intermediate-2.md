---
skill: oop
level: intermediate
---

## oop-intermediate-028
topic: classes-objects
answer: A
run: python

What does this program print?

```python
class Greeter:
    def __init__(self, name):
        self.name = name

    def hello(self):
        return "hi " + self.name

class Robot:
    name = "unit-7"

print(Greeter.hello(Robot()), Greeter("ana").hello())
```

- A: `hi unit-7 hi ana`
- B: It raises `TypeError`: `hello()` must be called on a `Greeter`.
- C: It raises `AttributeError`: a `Robot` instance has no attribute `name`.
- D: `hi None hi ana`

> In Python 3, `Greeter.hello` looked up on the class is a plain function, and
> `self` is just its first parameter — nothing checks its type. `Robot()` has
> no instance attribute `name`, but attribute lookup falls back to the class,
> which has one. So the call works and returns `hi unit-7`. In Java or C++
> the compiler would refuse to call `Greeter`'s method on another class's
> object; Python only cares that the attributes the method uses exist.

## oop-intermediate-029
topic: encapsulation
answer: C
run: java

What does this program print?

```java
class Wallet {
    private int cash;

    Wallet(int cash) { this.cash = cash; }

    void takeAll(Wallet other) {
        cash += other.cash;
        other.cash = 0;
    }

    int cash() { return cash; }
}

public class Main {
    public static void main(String[] args) {
        Wallet a = new Wallet(10);
        Wallet b = new Wallet(20);
        a.takeAll(b);
        System.out.println(a.cash() + " " + b.cash());
    }
}
```

- A: `30 20`
- B: `10 20`
- C: `30 0`
- D: It does not compile: `other.cash` is private to the object `other`.

> Access control in Java (and in C++) is per class, not per object: code
> inside `Wallet` may read and write the private fields of any `Wallet`, not
> only `this` one. So `takeAll` moves the 20 into `a` and zeroes `b`.
> Encapsulation protects a class's representation from other classes; it
> does not hide two instances of the same class from each other.

## oop-intermediate-030
topic: constructors
answer: D
run: java

What does this program print?

```java
import java.util.*;

class Base {
    Base() { init(); }

    void init() { }
}

class Sub extends Base {
    int count = 10;
    List<String> items;

    @Override
    void init() {
        count = 99;
        items = new ArrayList<>();
        items.add("x");
    }
}

public class Main {
    public static void main(String[] args) {
        Sub s = new Sub();
        System.out.println(s.count + " " + s.items.size());
    }
}
```

- A: `99 1`
- B: `0 1`
- C: It throws a `NullPointerException`.
- D: `10 1`

> `new Sub()` first runs `Base()`, which calls the overridden `init()`: it
> sets `count` to 99 and creates `items`. Only after `Base()` returns do
> `Sub`'s own field initialisers run — and `count = 10` overwrites the 99.
> `items` has no initialiser, so nothing resets it and it keeps its one
> element. Calling an overridable method from a constructor lets the
> subclass run before its own initialisation, with results like this.

## oop-intermediate-031
topic: inheritance
answer: B
run: python

What does this program print?

```python
class Base:
    def setup(self):
        return ["Base"]

class Cache(Base):
    def setup(self):
        return super().setup() + ["Cache"]

class Auth(Base):
    def setup(self):
        return ["Auth"]

class App(Cache, Auth):
    def setup(self):
        return super().setup() + ["App"]

print(App().setup())
```

- A: `['Base', 'Cache', 'App']`
- B: `['Auth', 'Cache', 'App']`
- C: `['Base', 'Auth', 'Cache', 'App']`
- D: `['Cache', 'App']`

> `App`'s MRO is `App, Cache, Auth, Base, object`. `super()` inside `Cache`
> goes to the next class in the *instance's* MRO — `Auth`, not `Base`.
> `Auth.setup` does not call `super()`, so the chain stops there and
> `Base.setup` never runs. Cooperative multiple inheritance only works when
> every class in the chain passes the call on.

## oop-intermediate-032
topic: polymorphism
answer: A
run: java

What does this program print?

```java
class Parent {
    String name = "P";

    String getName() { return name; }

    String show() { return getName() + name; }
}

class Child extends Parent {
    String name = "C";

    @Override
    String getName() { return name; }
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.show() + " " + p.name + " " + ((Child) p).name);
    }
}
```

- A: `CP P C`
- B: `CC C C`
- C: `PP P C`
- D: `CP C C`

> A `Child` object has two `name` fields: `Child`'s hides `Parent`'s but does
> not replace it. Methods are dispatched on the runtime class; fields are
> not — a field access is fixed at compile time by the static type of the
> expression. In `show()`, `getName()` dispatches to `Child`'s override
> ("C"), while the bare `name` is `Parent`'s field ("P"). `p.name` reads
> `Parent`'s field and `((Child) p).name` reads `Child`'s.

## oop-intermediate-033
topic: abstraction
answer: D
run: cpp

What does this program print?

```cpp
#include <iostream>
#include <string>

class Job {
public:
    virtual ~Job() = default;
    std::string run() { return "[" + work() + "]"; }
private:
    virtual std::string work() = 0;
};

class Backup : public Job {
    std::string work() override { return "backup"; }
};

int main() {
    Backup b;
    Job& j = b;
    std::cout << j.run() << "\n";
}
```

- A: It does not compile: `work()` is private in `Job`, so `Backup` cannot override it.
- B: `[]`
- C: It stops with a "pure virtual function called" error.
- D: `[backup]`

> Access and overriding are independent in C++: a derived class can override
> a private virtual function even though it cannot call the base version.
> `run()` is a public, non-virtual function that calls the private virtual
> `work()`, which dispatches to `Backup::work`. This is the non-virtual
> interface idiom: the base class fixes the public operation and its
> invariants, and subclasses supply only the step.

## oop-intermediate-034
topic: relationships
answer: C
run: python

What does this program print?

```python
class Engine:
    horsepower = 90

    def start(self):
        return "engine on"

class Car:
    def __init__(self):
        self._engine = Engine()

    def __getattr__(self, name):
        return getattr(self._engine, name)

    def start(self):
        return "car+" + self._engine.start()

c = Car()
print(c.start(), c.horsepower, isinstance(c, Engine))
```

- A: `engine on 90 False`
- B: `car+engine on 90 True`
- C: `car+engine on 90 False`
- D: It raises `AttributeError` for `horsepower`.

> `Car` has an `Engine` (composition) and forwards to it: `__getattr__` is
> called only when normal lookup fails, so `start` is found on `Car` itself,
> while `horsepower`, which `Car` lacks, is delegated to the engine. A `Car`
> is still not an `Engine` — `isinstance` is false — which is the point of
> delegation over inheritance: reuse the behaviour without claiming the
> type.

## oop-intermediate-035
topic: solid
answer: B
run: python

What does this program print?

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

class BoundedStack(Stack):
    def __init__(self, capacity):
        super().__init__()
        self.capacity = capacity

    def push(self, x):
        if len(self.items) < self.capacity:
            super().push(x)

def last_pushed(stack):
    for x in (1, 2, 3):
        stack.push(x)
    return stack.pop()

print(last_pushed(Stack()), last_pushed(BoundedStack(2)))
```

- A: `3 3`
- B: `3 2`
- C: `3 1`
- D: It raises `IndexError` for the bounded stack.

> The bounded stack holds `[1, 2]` and silently ignores the third push, so
> `pop()` returns 2. `last_pushed` relies on `Stack`'s promise that `pop`
> returns the last value pushed; `BoundedStack` weakens that promise without
> saying so. That is a Liskov Substitution violation — a subtype that cannot
> be used wherever its base is — and it fails quietly instead of loudly.

## oop-intermediate-036
topic: design-patterns
answer: D
run: python

What does this program print?

```python
class Button:
    def __init__(self):
        self.listeners = []

    def subscribe(self, fn):
        self.listeners.append(fn)

    def unsubscribe(self, fn):
        self.listeners.remove(fn)

    def click(self):
        for fn in self.listeners:
            fn()

log = []
button = Button()

def once():
    log.append("once")
    button.unsubscribe(once)

def audit():
    log.append("audit")

def metrics():
    log.append("metrics")

button.subscribe(once)
button.subscribe(audit)
button.subscribe(metrics)
button.click()
button.click()
print(" ".join(log))
```

- A: `once audit metrics audit metrics`
- B: `once audit metrics once audit metrics`
- C: It raises `RuntimeError`: the list changed size during iteration.
- D: `once metrics audit metrics`

> An observer that unsubscribes while being notified changes the list the
> subject is iterating over. The `for` loop walks by index: after `once`
> (index 0) removes itself, `audit` moves to index 0 and the loop goes on to
> index 1, `metrics` — so `audit` misses the first click. Python raises
> `RuntimeError` for a dict or set changed during iteration, never for a
> list. Notifying over a copy, `for fn in list(self.listeners)`, fixes it.

## oop-intermediate-037
topic: classes-objects
answer: A

`Product.equals` returns true when two products have the same `sku`. Its `hashCode` returns `Objects.hash(sku, price)`. What is wrong, if anything?

- A: Equal products with different prices can hash differently, so a `HashSet` may keep both.
- B: Nothing: `hashCode` may use extra fields, as long as it includes every field `equals` uses.
- C: Nothing, provided that `price` is declared `final` so that it can never change.
- D: Two products with different skus may share a hash code, which the contract forbids.

> The contract requires equal objects to have equal hash codes, so
> `hashCode` may use only fields that `equals` also uses — B states the rule
> backwards. Products equal by `sku` but with different prices hash
> differently, land in different buckets, and hash-based collections treat
> them as distinct. `final` (C) does not help: the two objects are separate
> and differ from the start. Unequal objects sharing a hash code (D) is
> allowed — it is just a collision.

## oop-intermediate-038
topic: encapsulation
answer: C

An `Account` class has `getBalance()` and `setBalance(long)`. Every caller withdraws with `acc.setBalance(acc.getBalance() - amount)`, and a new rule says that a balance may never go below zero. What is the encapsulation problem?

- A: `getBalance()` should return a copy of the balance, so that callers cannot change it.
- B: The balance field should be `protected`, so that subclasses can enforce the rule.
- C: Each caller must enforce the rule; a `withdraw(amount)` method would do it once.
- D: `setBalance` should be `synchronized`; then no caller can take the balance below zero.

> Exposing state through a getter and setter leaves each caller to compute
> the new value, so a rule about valid states has nowhere to live but in
> every caller ("tell, don't ask"). An operation such as `withdraw(amount)`
> keeps the invariant inside the class, in one place. A `long` is already
> returned by value (A); `protected` widens access instead of narrowing it
> (B); and `synchronized` prevents lost updates between threads, not
> overdrafts (D).

## oop-intermediate-039
topic: constructors
answer: B

The constructor of an `EventLogger` begins with `bus.register(this)`, and then assigns the logger's fields. The bus may deliver an event, from another thread, at any moment after registration. Why is this a bug?

- A: `this` is not a valid reference until the constructor returns, so the call does not compile.
- B: The listener can run before the constructor has assigned the fields, and see them unset.
- C: The bus is given a copy of the object, so the field assignments made later are lost.
- D: Registering inside a constructor makes the constructor run again for each event delivered.

> Passing `this` out of a constructor lets other code use an object that is
> not finished: an event delivered right after `register` sees default
> values (`null`, 0) in fields not yet assigned — and even the guarantee
> that other threads see `final` fields initialised is lost when `this`
> escapes. It compiles (A); Java passes a reference, not a copy (C). The
> usual fix is a static factory that constructs the object fully and only
> then registers it.

## oop-intermediate-040
topic: inheritance
answer: D

A library class `Parser` is not `final`. Its public method `parseAll()` loops over the input and calls the public, overridable method `parseOne()` for each item. Users are allowed to subclass `Parser`. What must its documentation tell them?

- A: Nothing: `parseAll()` was compiled against `Parser`'s own `parseOne()`, so an override cannot affect it.
- B: That `parseOne()` should be overridden only together with `parseAll()`, or the override is ignored.
- C: Nothing, as long as `parseAll()` is `final`, since no override can then change what it does.
- D: That `parseAll()` calls `parseOne()`, because overriding `parseOne()` changes what `parseAll()` does.

> A call from `parseAll()` to `parseOne()` is dynamically dispatched, so a
> subclass that overrides `parseOne()` changes `parseAll()` too — even if
> `parseAll()` is `final` (C). That self-use is part of what a subclass
> depends on: a class open for extension must document it (and keep it
> stable), or else forbid subclassing and offer composition instead.
> Otherwise a library change — say, `parseAll()` no longer going through
> `parseOne()` — silently breaks subclasses that relied on it.

## oop-intermediate-041
topic: polymorphism
answer: A

```python
class Area:
    def of(self, side):
        return side * side

    def of(self, width, height):
        return width * height

print(Area().of(3))
```

What happens?

- A: It raises `TypeError`: the second `def` replaced the first, which needs `height`.
- B: It prints `9`: Python picks the definition whose parameters match the call.
- C: It raises `SyntaxError`: a class body cannot define the same method name twice.
- D: It prints `9`: the first definition wins, and the later one is silently ignored.

> Python has no overloading. A `def` in a class body binds a name, and the
> second `def of` rebinds it, so the class keeps only the two-parameter
> version. Calling it with one argument raises `TypeError` (a missing
> argument). Python code gets the effect of overloads with default
> arguments, `*args`, or `functools.singledispatchmethod`, which chooses by
> the type of the first argument.

## oop-intermediate-042
topic: abstraction
answer: C

```python
class Shape:
    def area(self):
        raise NotImplementedError

class Square(Shape):
    pass

s = Square()      # line 1
print(s.area())   # line 2
```

As written, line 1 succeeds and line 2 raises `NotImplementedError`. Suppose `Shape` is changed to `class Shape(ABC)`, with `@abstractmethod` on `area` (both from `abc`). What changes?

- A: Nothing: both versions fail at line 2, when `area()` is called.
- B: The ABC version fails when `class Square` is defined, before line 1 runs.
- C: The ABC version fails at line 1: `Square()` raises `TypeError`.
- D: The ABC version prints `None`, because an abstract method's body is never run.

> Raising `NotImplementedError` only fails when the method is called, which
> may be far from the class that forgot to implement it. An abstract method
> declared with `abc` is checked when an object is created: a class that
> leaves one unoverridden cannot be instantiated. Defining such a subclass is
> allowed (B) — it may itself be meant as abstract — and nothing is printed
> because the object is never made (D).

## oop-intermediate-043
topic: relationships
answer: B

`ReportA` reads and appends to `cart.items`, a public `ArrayList` field of `Cart`. `ReportB` only calls `cart.addItem(x)` and `cart.total()`. `Cart`'s author replaces the list with a map keyed by product id, keeping the signatures of `addItem` and `total` unchanged. Which classes must change?

- A: Both, because both classes use `Cart`.
- B: Only `ReportA`, because it depended on `Cart`'s representation.
- C: Only `ReportB`, because `addItem` now has to look up a product id.
- D: Neither, because `ArrayList` and `HashMap` both implement `Collection`.

> `ReportA` is coupled to how `Cart` stores its data; `ReportB` only to what
> `Cart` promises to do. A change of representation behind unchanged method
> signatures breaks the first and not the second — loose coupling is exactly
> this. (`HashMap` does not implement `Collection`, and the field's type
> changes anyway, so code that called `add` on it no longer compiles.)

## oop-intermediate-044
topic: solid
answer: B, D

Each subclass below overrides one method of its base class. Which overrides break the Liskov Substitution Principle? Select all that apply.

- A: `FastSorter.sort(list)` uses a different algorithm, but leaves the list in the same sorted order.
- B: `ReadOnlyList.add(x)` throws, where the base `MutableList.add(x)` promises to append `x`.
- C: `DogShelter.adopt()` returns `Dog`, where the base `Shelter.adopt()` is declared to return `Animal`.
- D: `CappedAccount.withdraw(amt)` rejects amounts over 500, where the base accepts any amount up to the balance.
- E: `AuditedRepo.save(x)` writes a log line, then saves exactly as the base does.

> A subtype must honour its base's contract: it may not demand more of its
> callers (stronger preconditions) or promise less (weaker postconditions).
> Throwing from an operation the base promises (B) and rejecting inputs the
> base accepts (D) both break code written against the base. A different
> algorithm with the same result (A), a more specific return type (C) and
> an extra side effect that leaves the promised behaviour intact (E) keep
> the contract.

## oop-intermediate-045
topic: design-patterns
answer: A

```java
abstract class Dialog {
    abstract Button createButton();

    void render() {
        Button ok = createButton();
        ok.onClick(this::close);
        ok.draw();
    }

    void close() { }
}

class WebDialog extends Dialog {
    Button createButton() { return new HtmlButton(); }
}
```

Which pattern does `createButton()` implement?

- A: Factory Method
- B: Abstract Factory
- C: Builder
- D: Adapter

> A Factory Method is an overridable creation method that the class's own
> code calls, so subclasses decide which concrete product it gets: `render()`
> works with any `Button`, and `WebDialog` picks `HtmlButton`. An Abstract
> Factory is a separate object with a creation method per product of a
> family; a Builder assembles one complex object step by step; an Adapter
> converts one interface to another.

## oop-intermediate-046
topic: classes-objects
answer: D

In a test, two `OrderService` objects are created. An order queued on the first one shows up in the second one's `pending()` list, although neither object holds a reference to the other. Which declaration in `OrderService` explains this?

- A: `private final List<Order> pending = new ArrayList<>();`
- B: `protected final List<Order> pending = new ArrayList<>();`
- C: `private List<Order> pending;`, assigned `new ArrayList<>()` in the constructor
- D: `private static final List<Order> pending = new ArrayList<>();`

> A `static` field belongs to the class, not to each object, so every
> `OrderService` shares the one list — in effect a global variable, which
> also leaks state from one test into the next. `final` only stops the field
> being reassigned; the list it refers to can still change. The instance
> fields in A, B and C give each object its own list.

## oop-intermediate-047
topic: encapsulation
answer: A, C, D

A Java class is made immutable: every field is `final` and set in the constructor, there are no setters, and its mutable parts are copied defensively in and out. Which of these follow? Select all that apply.

- A: Instances can be shared between threads without locking.
- B: Producing a modified version never allocates a new object.
- C: An instance can be handed to untrusted code without copying it first.
- D: Instances are safe as `HashMap` keys, since their hash code cannot change.
- E: A subclass can add a setter that changes the parent's fields.

> State that cannot change cannot be corrupted by a race (A), by code that
> receives the object (C), or by a mutation that moves it to another hash
> bucket while it is a key (D). The price is B's opposite: every "change"
> creates a new object. `final` fields can only be assigned in their own
> class's constructor, so a subclass cannot change them (E) — though making
> the class `final` as well stops subclasses adding mutable state of their
> own.

## oop-intermediate-048
topic: constructors
answer: C

```cpp
#include <iostream>
#include <string>

struct Base {
    ~Base() { std::cout << "~Base "; }
};

struct Derived : Base {
    std::string name = "d";
    ~Derived() { std::cout << "~Derived "; }
};

int main() {
    Base* p = new Derived;
    delete p;
}
```

What does the C++ standard say about `delete p`?

- A: It runs `~Derived` and then `~Base`, because `delete` uses the object's dynamic type.
- B: It runs only `~Base`; `name` leaks, but the behaviour is otherwise well defined.
- C: The behaviour is undefined, because `Base` has no virtual destructor.
- D: It does not compile: deleting through a `Base*` needs a cast to `Derived*` first.

> Deleting an object through a pointer to a base class whose destructor is
> not virtual is undefined behaviour. In practice it usually runs only
> `~Base` and skips `Derived`'s members, but the standard promises nothing,
> so B is wrong too. A class meant to be used polymorphically — deleted
> through a base pointer — needs `virtual ~Base()`; then A would be what
> happens.

## oop-intermediate-049
topic: inheritance
answer: B
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Stack<String> s = new Stack<>();
        s.push("a");
        s.push("b");
        s.add(0, "z");
        s.push("c");
        s.remove(1);
        System.out.println(s.pop() + " " + s.pop() + " " + s.pop());
    }
}
```

- A: `c b a`
- B: `c b z`
- C: It does not compile: `Stack` has no method `add(int, E)`.
- D: `z b c`

> `java.util.Stack` extends `Vector`, so every list operation is public on a
> stack. `add(0, "z")` slips an element under the bottom, giving
> `[z, a, b]`; `push("c")` gives `[z, a, b, c]`; `remove(1)` (the index
> overload) drops `a`. Popping then yields `c`, `b`, `z`. Inheriting from a
> class to reuse its code also publishes its whole interface, and here that
> lets callers break last-in, first-out. A stack class that held its list
> privately and offered only `push`, `pop` and `peek` would not.

## oop-intermediate-050
topic: polymorphism
answer: A

With GCC, Clang or MSVC, what does declaring the first `virtual` member function in a class usually add to each object of that class?

- A: A hidden pointer to the class's table of virtual functions.
- B: A full copy of the class's table of virtual functions.
- C: One function pointer for each virtual function the class declares.
- D: Nothing per object: calls are resolved from the variable's declared type.

> The standard does not specify a mechanism, but every mainstream compiler
> uses one virtual table per class and one hidden pointer (the vptr) in each
> object, set by the constructor. A virtual call loads the vptr and jumps
> through the table, which is how a call through a `Base*` reaches the
> derived override — and why `sizeof` grows (by a pointer, plus any padding)
> when the first virtual function appears, however many more are added.

## oop-intermediate-051
topic: abstraction
answer: D

`Invoice` already extends `Document`, and `Photo` already extends `Media`. Both must be accepted by a method `printAll(List<...> items)` that only ever calls `print()` on each item. In Java, what should the element type be?

- A: An abstract class `Printable`, with an abstract `print()`, that both classes extend.
- B: A concrete class `Printer` that both classes create and call.
- C: `Object`, with `printAll` casting each item to `Invoice` or `Photo`.
- D: An interface `Printable`, with `print()`, that both classes implement.

> A Java class has one superclass, and both already have theirs, so A is
> impossible. An interface describes a capability any class can add,
> whatever it extends: `printAll(List<? extends Printable>)` then accepts
> both, and any future printable class. C needs an `instanceof` chain that
> grows with every new type, and B describes a helper, not a type the list
> can hold.

## oop-intermediate-052
topic: solid
answer: C

`interface Machine { void print(Doc d); void scan(Doc d); void fax(Doc d); }` is implemented by a basic printer, which throws from `scan` and `fax`, and a change to `fax`'s signature forces the printer's code to recompile. The team splits `Machine` into `Printer`, `Scanner` and `Fax`, so that each client depends only on the methods it uses. Which principle is this refactoring named for?

- A: Single Responsibility
- B: Liskov Substitution
- C: Interface Segregation
- D: Dependency Inversion

> The Interface Segregation Principle says that no client should be forced
> to depend on methods it does not use — the definition the refactoring is
> quoted from. Fat interfaces force dummy implementations and couple
> unrelated clients through recompiles. (The throwing methods were also a
> Liskov problem; the split removes them, but the principle the change is
> named after is segregation.)

## oop-intermediate-053
topic: design-patterns
answer: B

`HttpRequest` has a required URL and nine optional settings (headers, timeout, retries, body and so on). The team has written `HttpRequest(url)`, `HttpRequest(url, timeout)`, `HttpRequest(url, timeout, retries)` and more, and call sites such as `new HttpRequest(u, 30, 0, null, true, false)` are hard to read and easy to get wrong. Which pattern fits?

- A: Singleton: share one configured `HttpRequest` across the whole application.
- B: Builder: name each option in a chained call, then `build()` the object.
- C: Adapter: wrap the constructors in an interface that takes a `Map` of options.
- D: Factory Method: let subclasses of `HttpRequest` choose their own defaults.

> Telescoping constructors are the classic case for a Builder:
> `HttpRequest.builder(u).timeout(30).retries(0).build()` names each value,
> lets any subset be set in any order, and validates the combination once
> in `build()` — which can then return an immutable object. A singleton
> does not suit many different requests, a `Map` loses the types and the
> names the compiler checks, and subclassing per default set multiplies
> classes.

## oop-intermediate-054
topic: design-patterns
answer: A

`InvoiceService` obtains its mailer by calling `ServiceLocator.get(Mailer.class)` inside its methods. Compared with taking a `Mailer` as a constructor parameter, what is lost?

- A: The dependency is hidden from the constructor, so tests cannot see what the class needs.
- B: The mailer can no longer be swapped for a fake in a unit test, whatever the configuration.
- C: The class can no longer be instantiated more than once in the same program.
- D: Nothing is lost: a service locator is a form of constructor injection too.

> With constructor injection the dependencies are the constructor's
> parameters: visible, impossible to forget, and supplied directly by a
> test. A service locator hides them inside method bodies, so a test learns
> what to register only by reading the code or by failing. A fake can still
> be registered with the locator (B), nothing limits the number of instances
> (C), and a locator is the opposite of injection: the class fetches its
> dependencies instead of being given them (D).

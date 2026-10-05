---
title: Design Patterns for Interviews
order: 9
minutes: 18
level: intermediate
updated: 2026-10-05
seo-title: OOP Design Patterns: Singleton, Factory, Observer
description: OOP design patterns for interviews: creational, structural and behavioural, with Singleton, Factory, Builder, Adapter, Decorator, Observer and Strategy.
question: What are design patterns in object-oriented programming?
answer: Design patterns are named, reusable solutions to problems that keep recurring in object-oriented design — making sure only one instance exists, notifying many objects of a change, swapping an algorithm at run time. The 1994 Gang of Four book catalogued 23 of them in three groups: creational, structural and behavioural. A pattern is a template for a design, not code to copy.
q: What are the three types of design patterns?
a: Creational patterns deal with how objects are created (Singleton, Factory Method, Abstract Factory, Builder, Prototype). Structural patterns deal with how classes and objects are combined into larger structures (Adapter, Decorator, Facade, Proxy and others). Behavioural patterns deal with how objects communicate and share responsibility (Observer, Strategy, Command, Iterator and others).
q: Who are the Gang of Four?
a: Erich Gamma, Richard Helm, Ralph Johnson and John Vlissides, authors of Design Patterns: Elements of Reusable Object-Oriented Software, published in 1994. The book described 23 patterns with C++ and Smalltalk examples and gave the industry the shared names, such as Singleton and Observer, that interviews still use.
q: What is the difference between Factory Method and Abstract Factory?
a: Factory Method is a single method, overridden by subclasses, that decides which concrete class to instantiate for one kind of product. Abstract Factory is an object with several creation methods that produces a whole family of related products, such as buttons and checkboxes that all match one operating system's look.
q: Is Singleton an anti-pattern?
a: It is often called one, because a singleton is global state in disguise: classes reach for it instead of receiving it, which hides dependencies and makes tests share state. It is reasonable for things that genuinely exist once per process, such as a logger or a configuration object, ideally still passed to the classes that use it.
q: What is the difference between Strategy and State patterns?
a: Both delegate behaviour to a swappable object behind an interface. In Strategy the client chooses the algorithm and the strategies know nothing about each other. In State the object switches its own state object as events happen, and each state usually decides which state comes next, as in an order moving from placed to shipped.
q: How is the Observer pattern different from publish-subscribe?
a: In Observer the subject keeps a direct list of its observers and calls them itself, usually synchronously. In publish-subscribe a broker or event channel sits between them: publishers and subscribers do not know about each other, and delivery is often asynchronous, as with message queues.
---
A **design pattern** is a named, proven answer to a design problem that keeps coming up: "this object must exist only once", "many objects need to know when this one changes", "the algorithm should be swappable at run time". Knowing the patterns gives you two things in an interview: ready-made designs for low-level design rounds, and a vocabulary — saying "that is a Strategy" communicates a whole structure in one word. This note covers the three categories and then the seven patterns most often asked about, each with its intent, when to use it and its trade-offs, and runnable code for the most code-shaped ones.

## What a design pattern is

The patterns most people mean come from *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) by Erich Gamma, Richard Helm, Ralph Johnson and John Vlissides — the **Gang of Four (GoF)**. The book describes each pattern by four elements: a **name**, the **problem** it addresses, the **solution** (a structure of classes and their responsibilities), and the **consequences** (the trade-offs).

Two cautions. A pattern is a *design*, not a library: you adapt it to your problem. And patterns depend on the language — Python's first-class functions turn Strategy into "pass a function", and every modern language builds Iterator into its `for` loop.

## The three categories

| Category | Concerned with | The GoF patterns |
| --- | --- | --- |
| Creational (5) | How objects are created | Singleton, Factory Method, Abstract Factory, Builder, Prototype |
| Structural (7) | How objects are combined | Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy |
| Behavioural (11) | How objects communicate | Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor |

## Singleton

**Intent.** Ensure a class has exactly one instance and provide a global point of access to it.

**When to use.** For something that genuinely exists once per process: a configuration object, a logger, a connection pool. **Structure:** a private constructor, a static field holding the instance, and a static method returning it.

**Thread safety** is the follow-up every interviewer asks:

- **C++11 and later**: a function-local `static` is initialised exactly once even if several threads call the function at the same moment — the standard guarantees it. This "Meyers singleton" is the idiomatic form.
- **Java**: an eager `static final` field is safe because class initialisation is. For lazy creation, the **holder idiom** (a nested class whose static field is initialised on first use) is safe and lock-free. **Double-checked locking** works only if the field is `volatile`. A single-element **`enum`** is the form *Effective Java* recommends: it also resists creating a second instance through reflection or deserialisation.
- **Python**: a module is executed once and cached in `sys.modules`, so a module-level object is the idiomatic singleton. A class that overrides `__new__` needs a lock if threads may race to create it.

**Costs.** A singleton is global state: it hides dependencies, couples classes to one implementation and makes tests share state. Prefer passing the single instance to the classes that need it.

```cpp
#include <iostream>
#include <string>
using namespace std;

class Config {
    string logLevel = "INFO";
    static inline int created = 0;  // C++17 inline static member
    Config() { created++; }         // private: nobody else can construct one
public:
    Config(const Config&) = delete;             // no copies
    Config& operator=(const Config&) = delete;
    static Config& instance() {
        static Config only;  // initialised once, thread-safe since C++11
        return only;
    }
    void setLogLevel(const string& level) { logLevel = level; }
    string getLogLevel() const { return logLevel; }
    static int instancesCreated() { return created; }
};

int main() {
    Config& a = Config::instance();
    Config& b = Config::instance();
    a.setLogLevel("DEBUG");
    cout << "same instance: " << (&a == &b ? "yes" : "no") << "\n";
    cout << "log level seen through b: " << b.getLogLevel() << "\n";
    cout << "instances created: " << Config::instancesCreated() << "\n";
    return 0;
}
```

```java
class Config {
    private static int created = 0;
    private String logLevel = "INFO";

    private Config() { created++; }  // private: nobody else can construct one

    private static class Holder {  // loaded, and INSTANCE created, on first use only
        static final Config INSTANCE = new Config();
    }

    static Config instance() { return Holder.INSTANCE; }  // thread-safe: class initialisation is
    void setLogLevel(String level) { logLevel = level; }
    String getLogLevel() { return logLevel; }
    static int instancesCreated() { return created; }
}

public class Main {
    public static void main(String[] args) {
        Config a = Config.instance();
        Config b = Config.instance();
        a.setLogLevel("DEBUG");
        System.out.println("same instance: " + (a == b ? "yes" : "no"));
        System.out.println("log level seen through b: " + b.getLogLevel());
        System.out.println("instances created: " + Config.instancesCreated());
    }
}
```

```python
import threading


class Config:
    _instance = None
    _lock = threading.Lock()
    created = 0

    def __new__(cls):
        with cls._lock:  # two threads cannot both create one
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance.log_level = "INFO"  # set up here: __init__ would run on every call
                cls.created += 1
        return cls._instance


a = Config()
b = Config()
a.log_level = "DEBUG"
print(f"same instance: {'yes' if a is b else 'no'}")
print(f"log level seen through b: {b.log_level}")
print(f"instances created: {Config.created}")
```

```javascript
class Config {
  static #instance = null;
  static created = 0;

  static instance() {
    if (Config.#instance === null) { // Node runs this on one thread, so no lock is needed
      Config.#instance = new Config();
      Config.created++;
    }
    return Config.#instance;
  }

  logLevel = "INFO";
}

const a = Config.instance();
const b = Config.instance();
a.logLevel = "DEBUG";
console.log(`same instance: ${a === b ? "yes" : "no"}`);
console.log(`log level seen through b: ${b.logLevel}`);
console.log(`instances created: ${Config.created}`);
```

```output
same instance: yes
log level seen through b: DEBUG
instances created: 1
```

## Factory

**Intent.** Separate *deciding which class to create* from *using the object*, so callers depend only on an interface.

Three things go by this name, and interviewers like you to tell them apart:

- **Simple factory** — a function or static method that picks a concrete class from a parameter: `NotifierFactory.create("sms")` returns an `SmsNotifier` typed as `Notifier`. Useful, but not one of the 23.
- **Factory Method** (GoF) — a base class declares a creation method and subclasses override it to choose the product. A `Dialog` calls `createButton()`; `WindowsDialog` returns a `WindowsButton`, `WebDialog` an `HtmlButton`. The base class's logic never names a concrete button.
- **Abstract Factory** (GoF) — an object whose several methods create a whole **family** of related products that must match: a `GuiFactory` with `createButton()` and `createCheckbox()`, implemented once per platform.

**When to use.** When the concrete class depends on configuration or input, when creation involves more than a constructor call, or when you want new product types to be addable without touching the code that uses them (the Open/Closed Principle from [SOLID Principles](/notes/oop/solid-principles)).

## Builder

**Intent.** Construct a complex object step by step, separating the construction from the final representation.

**When to use.** When a class has many optional parameters. The alternative, **telescoping constructors** — `Pizza(size)`, `Pizza(size, cheese)`, `Pizza(size, cheese, olives)` and so on — is unreadable at the call site (`new Pizza("L", true, false, 2)`: which `true` was cheese?). A builder names every step, can validate before building, and lets the finished object be immutable. Java's `HttpRequest.newBuilder()` and `StringBuilder` follow this style. Python and Kotlin rarely need it, because keyword arguments with defaults already name each value.

```java
final class Pizza {  // immutable once built
    private final String size;
    private final boolean cheese, olives;
    private final int extras;

    private Pizza(Builder b) { size = b.size; cheese = b.cheese; olives = b.olives; extras = b.extras; }

    @Override public String toString() {
        return size + " pizza, cheese=" + cheese + ", olives=" + olives + ", extras=" + extras;
    }

    static class Builder {
        private final String size;  // required: taken by the builder's constructor
        private boolean cheese, olives;
        private int extras;

        Builder(String size) { this.size = size; }
        Builder cheese() { cheese = true; return this; }  // each step returns the builder
        Builder olives() { olives = true; return this; }
        Builder extras(int n) {
            if (n < 0) throw new IllegalArgumentException("extras cannot be negative");
            extras = n;
            return this;
        }
        Pizza build() { return new Pizza(this); }
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Pizza.Builder("Large").cheese().extras(2).build());
        System.out.println(new Pizza.Builder("Small").olives().build());
    }
}
```

```output
Large pizza, cheese=true, olives=false, extras=2
Small pizza, cheese=false, olives=true, extras=0
```

## Adapter

**Intent.** Convert the interface of an existing class into the interface the client expects, so classes with incompatible interfaces can work together.

**When to use.** When you must use a class you cannot change — a third-party SDK, legacy code — and its methods do not match your abstraction. Your checkout code calls `PaymentProcessor.pay(rupees)`; the gateway's SDK offers `makeTransaction(paise, currencyCode)`. A `GatewayAdapter` implements `PaymentProcessor` and translates each call. The **object adapter** holds the adaptee (composition); the **class adapter** inherits from it, which needs multiple inheritance as in C++. In the JDK, `InputStreamReader` adapts a byte stream into a character reader, and `Arrays.asList` adapts an array into a `List`.

## Decorator

**Intent.** Attach extra responsibilities to an object at run time by wrapping it in another object with the same interface.

**When to use.** When features combine freely and a subclass per combination would explode — milk, sugar and caramel in any mix would need a class for every subset. Each decorator implements the same interface, holds the object it wraps, and adds its bit before or after delegating. Java's I/O streams are the textbook case: `new BufferedReader(new InputStreamReader(stream))`. Python's `@decorator` syntax is a related idea applied to functions at definition time, not this pattern on objects.

```cpp
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Coffee {  // the shared interface
public:
    virtual ~Coffee() = default;
    virtual string describe() const = 0;
    virtual int cost() const = 0;
};

class Espresso : public Coffee {
public:
    string describe() const override { return "espresso"; }
    int cost() const override { return 100; }
};

class AddOn : public Coffee {  // a decorator: is a Coffee and has a Coffee
protected:
    unique_ptr<Coffee> inner;
public:
    explicit AddOn(unique_ptr<Coffee> c) : inner(move(c)) {}
};

class Milk : public AddOn {
public:
    using AddOn::AddOn;
    string describe() const override { return inner->describe() + " + milk"; }
    int cost() const override { return inner->cost() + 30; }
};

class Caramel : public AddOn {
public:
    using AddOn::AddOn;
    string describe() const override { return inner->describe() + " + caramel"; }
    int cost() const override { return inner->cost() + 45; }
};

int main() {
    unique_ptr<Coffee> plain = make_unique<Espresso>();
    cout << plain->describe() << " = Rs " << plain->cost() << "\n";
    unique_ptr<Coffee> order = make_unique<Caramel>(make_unique<Milk>(make_unique<Milk>(make_unique<Espresso>())));
    cout << order->describe() << " = Rs " << order->cost() << "\n";
    return 0;
}
```

```java
interface Coffee {  // the shared interface
    String describe();
    int cost();
}

class Espresso implements Coffee {
    public String describe() { return "espresso"; }
    public int cost() { return 100; }
}

abstract class AddOn implements Coffee {  // a decorator: is a Coffee and has a Coffee
    protected final Coffee inner;
    AddOn(Coffee inner) { this.inner = inner; }
}

class Milk extends AddOn {
    Milk(Coffee c) { super(c); }
    public String describe() { return inner.describe() + " + milk"; }
    public int cost() { return inner.cost() + 30; }
}

class Caramel extends AddOn {
    Caramel(Coffee c) { super(c); }
    public String describe() { return inner.describe() + " + caramel"; }
    public int cost() { return inner.cost() + 45; }
}

public class Main {
    public static void main(String[] args) {
        Coffee plain = new Espresso();
        System.out.println(plain.describe() + " = Rs " + plain.cost());
        Coffee order = new Caramel(new Milk(new Milk(new Espresso())));
        System.out.println(order.describe() + " = Rs " + order.cost());
    }
}
```

```python
class Espresso:
    def describe(self):
        return "espresso"

    def cost(self):
        return 100


class AddOn:  # a decorator: has a coffee and offers the same methods
    def __init__(self, inner):
        self.inner = inner


class Milk(AddOn):
    def describe(self):
        return self.inner.describe() + " + milk"

    def cost(self):
        return self.inner.cost() + 30


class Caramel(AddOn):
    def describe(self):
        return self.inner.describe() + " + caramel"

    def cost(self):
        return self.inner.cost() + 45


plain = Espresso()
print(f"{plain.describe()} = Rs {plain.cost()}")
order = Caramel(Milk(Milk(Espresso())))
print(f"{order.describe()} = Rs {order.cost()}")
```

```output
espresso = Rs 100
espresso + milk + milk + caramel = Rs 205
```

## Observer

**Intent.** Define a one-to-many dependency so that when one object (the **subject**) changes state, all its dependents (the **observers**) are notified automatically.

**When to use.** When several parts of a program must react to one object's changes and the subject should not know what they are: GUI event listeners, a model notifying its views, a price feed updating a display and an alert. Observers **subscribe** and **unsubscribe** at run time. Pitfalls: an observer that never unsubscribes keeps itself alive (a common memory leak, the "lapsed listener"); observers should not depend on notification order; and an observer that changes the subject during a notification can cause loops.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

class PriceObserver {
public:
    virtual ~PriceObserver() = default;
    virtual void onPrice(const string& symbol, int price) = 0;
};

class Ticker {  // the subject: knows only the observer interface
    string symbol;
    vector<PriceObserver*> observers;  // non-owning
public:
    explicit Ticker(string s) : symbol(s) {}
    void subscribe(PriceObserver* o) { observers.push_back(o); }
    void unsubscribe(PriceObserver* o) { observers.erase(remove(observers.begin(), observers.end(), o), observers.end()); }
    void setPrice(int price) {
        for (PriceObserver* o : observers) o->onPrice(symbol, price);  // notify in subscription order
    }
};

class Display : public PriceObserver {
public:
    void onPrice(const string& s, int p) override { cout << "display: " << s << " = " << p << "\n"; }
};

class Alert : public PriceObserver {
    int limit;
public:
    explicit Alert(int limit) : limit(limit) {}
    void onPrice(const string& s, int p) override {
        if (p > limit) cout << "alert: " << s << " above " << limit << " (now " << p << ")\n";
    }
};

int main() {
    Ticker acme("ACME");
    Display display;
    Alert alert(1550);
    acme.subscribe(&display);
    acme.subscribe(&alert);
    acme.setPrice(1500);
    acme.setPrice(1580);
    acme.unsubscribe(&display);
    acme.setPrice(1610);
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

interface PriceObserver {
    void onPrice(String symbol, int price);
}

class Ticker {  // the subject: knows only the observer interface
    private final String symbol;
    private final List<PriceObserver> observers = new ArrayList<>();
    Ticker(String symbol) { this.symbol = symbol; }
    void subscribe(PriceObserver o) { observers.add(o); }
    void unsubscribe(PriceObserver o) { observers.remove(o); }
    void setPrice(int price) {
        for (PriceObserver o : observers) o.onPrice(symbol, price);  // notify in subscription order
    }
}

class Display implements PriceObserver {
    public void onPrice(String s, int p) { System.out.println("display: " + s + " = " + p); }
}

class Alert implements PriceObserver {
    private final int limit;
    Alert(int limit) { this.limit = limit; }
    public void onPrice(String s, int p) {
        if (p > limit) System.out.println("alert: " + s + " above " + limit + " (now " + p + ")");
    }
}

public class Main {
    public static void main(String[] args) {
        Ticker acme = new Ticker("ACME");
        Display display = new Display();
        acme.subscribe(display);
        acme.subscribe(new Alert(1550));
        acme.setPrice(1500);
        acme.setPrice(1580);
        acme.unsubscribe(display);
        acme.setPrice(1610);
    }
}
```

```python
class Ticker:  # the subject: calls anything with on_price(symbol, price)
    def __init__(self, symbol):
        self.symbol = symbol
        self._observers = []

    def subscribe(self, observer):
        self._observers.append(observer)

    def unsubscribe(self, observer):
        self._observers.remove(observer)

    def set_price(self, price):
        for o in list(self._observers):  # notify in subscription order
            o.on_price(self.symbol, price)


class Display:
    def on_price(self, symbol, price):
        print(f"display: {symbol} = {price}")


class Alert:
    def __init__(self, limit):
        self.limit = limit

    def on_price(self, symbol, price):
        if price > self.limit:
            print(f"alert: {symbol} above {self.limit} (now {price})")


acme = Ticker("ACME")
display = Display()
acme.subscribe(display)
acme.subscribe(Alert(1550))
acme.set_price(1500)
acme.set_price(1580)
acme.unsubscribe(display)
acme.set_price(1610)
```

```javascript
class Ticker { // the subject: calls anything with onPrice(symbol, price)
  constructor(symbol) { this.symbol = symbol; this.observers = []; }
  subscribe(o) { this.observers.push(o); }
  unsubscribe(o) { this.observers = this.observers.filter((x) => x !== o); }
  setPrice(price) {
    for (const o of this.observers) o.onPrice(this.symbol, price); // notify in subscription order
  }
}

class Display {
  onPrice(symbol, price) { console.log(`display: ${symbol} = ${price}`); }
}

class Alert {
  constructor(limit) { this.limit = limit; }
  onPrice(symbol, price) {
    if (price > this.limit) console.log(`alert: ${symbol} above ${this.limit} (now ${price})`);
  }
}

const acme = new Ticker("ACME");
const display = new Display();
acme.subscribe(display);
acme.subscribe(new Alert(1550));
acme.setPrice(1500);
acme.setPrice(1580);
acme.unsubscribe(display);
acme.setPrice(1610);
```

```output
display: ACME = 1500
display: ACME = 1580
alert: ACME above 1550 (now 1580)
alert: ACME above 1550 (now 1610)
```

## Strategy

**Intent.** Define a family of algorithms, put each behind a common interface, and make them interchangeable at run time.

**When to use.** When there are several ways to do one job and the choice depends on input or configuration: shipping cost rules, payment methods, sort orders, compression formats. It replaces a growing `if`/`switch` with one polymorphic call. `Comparator` passed to `Collections.sort` is a strategy; so is the `key` function in Python's `sorted`. Where functions are first-class, a strategy is often just a function, as the Python and JavaScript versions below show.

```cpp
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class ShippingStrategy {
public:
    virtual ~ShippingStrategy() = default;
    virtual string name() const = 0;
    virtual int cost(int cartTotal) const = 0;
};

class Standard : public ShippingStrategy {
public:
    string name() const override { return "standard"; }
    int cost(int total) const override { return total >= 500 ? 0 : 40; }  // free above Rs 500
};

class Express : public ShippingStrategy {
public:
    string name() const override { return "express"; }
    int cost(int) const override { return 100; }
};

class Pickup : public ShippingStrategy {
public:
    string name() const override { return "pickup"; }
    int cost(int) const override { return 0; }
};

class Cart {
    int total;
    unique_ptr<ShippingStrategy> shipping;
public:
    explicit Cart(int total) : total(total), shipping(make_unique<Standard>()) {}
    void setShipping(unique_ptr<ShippingStrategy> s) { shipping = move(s); }  // swap at run time
    void checkout() const {
        int fee = shipping->cost(total);
        cout << shipping->name() << ": " << total << " + " << fee << " = " << total + fee << "\n";
    }
};

int main() {
    Cart cart(450);
    cart.checkout();
    cart.setShipping(make_unique<Express>());
    cart.checkout();
    cart.setShipping(make_unique<Pickup>());
    cart.checkout();
    Cart big(800);
    big.checkout();
    return 0;
}
```

```java
interface ShippingStrategy {
    String name();
    int cost(int cartTotal);
}

class Standard implements ShippingStrategy {
    public String name() { return "standard"; }
    public int cost(int total) { return total >= 500 ? 0 : 40; }  // free above Rs 500
}

class Express implements ShippingStrategy {
    public String name() { return "express"; }
    public int cost(int total) { return 100; }
}

class Pickup implements ShippingStrategy {
    public String name() { return "pickup"; }
    public int cost(int total) { return 0; }
}

class Cart {
    private final int total;
    private ShippingStrategy shipping = new Standard();
    Cart(int total) { this.total = total; }
    void setShipping(ShippingStrategy s) { shipping = s; }  // swap at run time
    void checkout() {
        int fee = shipping.cost(total);
        System.out.println(shipping.name() + ": " + total + " + " + fee + " = " + (total + fee));
    }
}

public class Main {
    public static void main(String[] args) {
        Cart cart = new Cart(450);
        cart.checkout();
        cart.setShipping(new Express());
        cart.checkout();
        cart.setShipping(new Pickup());
        cart.checkout();
        new Cart(800).checkout();
    }
}
```

```python
def standard(total):  # in Python a strategy is often just a function
    return 0 if total >= 500 else 40  # free above Rs 500


def express(total):
    return 100


def pickup(total):
    return 0


class Cart:
    def __init__(self, total, shipping=standard):
        self.total = total
        self.shipping = shipping  # swap at run time by assigning another function

    def checkout(self):
        fee = self.shipping(self.total)
        print(f"{self.shipping.__name__}: {self.total} + {fee} = {self.total + fee}")


cart = Cart(450)
cart.checkout()
cart.shipping = express
cart.checkout()
cart.shipping = pickup
cart.checkout()
Cart(800).checkout()
```

```javascript
const strategies = { // in JavaScript a strategy is often just a function
  standard: (total) => (total >= 500 ? 0 : 40), // free above Rs 500
  express: () => 100,
  pickup: () => 0,
};

class Cart {
  constructor(total, shipping = "standard") { this.total = total; this.shipping = shipping; }
  checkout() {
    const fee = strategies[this.shipping](this.total);
    console.log(`${this.shipping}: ${this.total} + ${fee} = ${this.total + fee}`);
  }
}

const cart = new Cart(450);
cart.checkout();
cart.shipping = "express";
cart.checkout();
cart.shipping = "pickup";
cart.checkout();
new Cart(800).checkout();
```

```output
standard: 450 + 40 = 490
express: 450 + 100 = 550
pickup: 450 + 0 = 450
standard: 800 + 0 = 800
```

## The patterns at a glance

| Pattern | Category | One-line intent | Seen in |
| --- | --- | --- | --- |
| Singleton | Creational | Exactly one instance, globally reachable | `Runtime.getRuntime()` in Java |
| Factory Method | Creational | Subclasses decide which class to create | Framework hooks such as `createButton()` |
| Builder | Creational | Build a complex object step by step | `HttpRequest.newBuilder()` |
| Adapter | Structural | Make an incompatible interface fit | `InputStreamReader`, `Arrays.asList` |
| Decorator | Structural | Add behaviour by wrapping | `BufferedReader` around a `Reader` |
| Observer | Behavioural | Notify many dependents of a change | GUI event listeners |
| Strategy | Behavioural | Swap an algorithm behind an interface | `Comparator`, Python's `key=` |

## Common mistakes

- Reaching for a Singleton to avoid passing an object around; that is hidden global state.
- Writing double-checked locking in Java without `volatile`.
- Overriding `__init__` in a Python singleton and being surprised that it runs on every `Config()` call.
- Calling any function that returns an object a "Factory Method"; the GoF pattern is about subclasses choosing the product.
- Forgetting to unsubscribe observers, so they are never garbage collected.
- Using a pattern because it is known rather than because the problem calls for it; patterns add classes.

## Interview questions

**How do you make a Singleton thread-safe in Java?**
Four common ways: an eager `private static final` instance; the holder idiom, which creates the instance lazily when a nested class is first loaded; a single-element `enum`; or double-checked locking on a `volatile` field. A `synchronized` accessor also works but takes a lock on every call. The holder idiom and the enum are the usual recommendations.

**How can a Java Singleton be broken, and how do you prevent it?**
Reflection can call the private constructor after `setAccessible(true)`; deserialising a serialised instance creates a new object; and `clone()` could copy it if the class were cloneable. An enum singleton is protected against reflection and serialisation by the language; for a class, throw from the constructor if an instance exists and add `readResolve()` returning the instance.

**What is the difference between Decorator and Proxy?**
Both wrap an object behind the same interface. A Decorator adds behaviour, and decorators are designed to be stacked in any combination. A Proxy controls access to the object — lazy loading, access checks, remote calls, caching — and usually manages that object's lifecycle itself.

**What is the difference between Adapter and Facade?**
An Adapter converts one existing interface into a different interface that a client already expects; it is about compatibility. A Facade offers a new, simpler interface over a whole subsystem of classes, such as one `placeOrder()` hiding inventory, payment and shipping; it is about convenience.

**What is the difference between Strategy and Template Method?**
Both let a step of an algorithm vary. Template Method uses inheritance: a base class fixes the outline and subclasses override steps, so the choice is fixed per class. Strategy uses composition: the varying part is a separate object passed in, so it can change at run time.

**Name design patterns used in the Java standard library.**
Iterator in `java.util.Iterator`; Decorator in the `java.io` streams; Adapter in `InputStreamReader`; Strategy in `Comparator`; Observer in GUI event listeners; Builder in `StringBuilder` and `HttpRequest.Builder`; Singleton in `Runtime.getRuntime()`. Naming the pattern and the class together is what interviewers look for.

**When should you not use a design pattern?**
When the problem it solves is not present. A pattern adds indirection and classes; applying Strategy to logic with one variant, or a Factory for a class created in one place, makes the code harder to read for no gain. Introduce the pattern when the second or third variant actually appears.

Next, read [Object Equality, Hashing and Copying](/notes/oop/object-equality-and-copying), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

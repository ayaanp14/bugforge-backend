---
title: Composition versus inheritance — is-a, has-a and the shapes to avoid
minutes: 14
---
Inheritance is the most expensive relationship in C++: it couples the derived class to the base's representation, promises that a derived object can stand in for a base one everywhere, and cannot be undone without touching every user. Composition — a member object — makes none of those promises. This lesson gives the test for choosing between them (is-a versus has-a, and what "is-a" actually obliges you to), shows the classic square-and-rectangle failure, covers the two forms of inheritance that are not is-a — private and multiple — and states the rule the Core Guidelines and thirty years of practice agree on: prefer composition, and reach for public inheritance only to get run-time polymorphism through a base interface.

## is-a versus has-a

```cpp
class Engine {
public:
    void start() { running_ = true; }
    bool running() const { return running_; }
private:
    bool running_ = false;
};

class Car {                          // a Car HAS an Engine
public:
    void start() { engine_.start(); }
    bool running() const { return engine_.running(); }
private:
    Engine engine_;
};

class ElectricCar : public Car {};   // an ElectricCar IS a Car
```

A `Car` is not an `Engine`; handing a `Car` to a function that expects an `Engine&` would be nonsense. So the engine is a **member**, and `Car` *delegates* — `start()` forwards to `engine_.start()`. Composition lets `Car` decide what to expose: nothing of `Engine`'s interface leaks unless `Car` chooses to forward it. Public inheritance exposes everything public in the base, and it makes a promise composition does not: an `ElectricCar` can be used wherever a `Car&` is accepted, and every function that works on a `Car` must keep working.

The quick test is to say the sentence aloud. "A car is an engine" fails; "a car has an engine" passes. When the sentence is ambiguous — "a stack is a vector"? — the harder test decides.

## The substitution rule

The **Liskov substitution principle** is the harder test: a derived class must honour every promise the base makes, so that code written against the base keeps working when handed a derived object. Not "has the same functions" — *behaves compatibly*. The classic failure:

```cpp
class Rectangle {
public:
    Rectangle(int w, int h) : w_(w), h_(h) {}
    virtual ~Rectangle() = default;
    virtual void setWidth(int w)  { w_ = w; }
    virtual void setHeight(int h) { h_ = h; }
    int area() const { return w_ * h_; }
protected:
    int w_, h_;
};

class Square : public Rectangle {                // a square IS a rectangle... mathematically
public:
    explicit Square(int side) : Rectangle(side, side) {}
    void setWidth(int w) override  { w_ = h_ = w; }     // keep it square
    void setHeight(int h) override { w_ = h_ = h; }
};

void stretch(Rectangle& r) {
    r.setWidth(5);
    r.setHeight(2);
    std::cout << r.area() << '\n';        // a Rectangle prints 10
}

Square sq(3);
stretch(sq);                              // prints 4
```

`stretch` was written against `Rectangle`'s promise: after `setWidth(5)` and `setHeight(2)` the area is 10. A `Square` cannot keep that promise — keeping its own invariant (sides equal) breaks the base's (width and height independent). The mathematics says a square is a rectangle; the *mutable* interface says it is not. Either drop the setters — an immutable `Rectangle` and an immutable `Square` substitute fine, because nothing can be broken — or do not derive. The general lesson: is-a is decided by the base's interface and invariants, not by the nouns.

## Why composition wins by default

- **Coupling.** A derived class depends on the base's protected members and on the behaviour of every virtual function it does not override. Changing the base can break the derived class without touching its source — the *fragile base class* problem. A member's interface is a smaller, published surface.
- **Choice of interface.** Composition exposes what you forward; inheritance exposes the base's whole public interface, including functions that make no sense for the derived type.
- **Flexibility.** A member can be swapped at run time — a `std::unique_ptr<Logger>` that points at a file logger or a console logger — while a base class is fixed at compile time.
- **Testing.** A class whose collaborators are members can be given test doubles; one whose collaborator is its base cannot.

The Java standard library's `Stack extends Vector` is the cautionary tale: every `Stack` exposes `insertElementAt`, so nothing guarantees it is a stack. C++ chose composition for `std::stack`: it *contains* a `std::deque` and forwards `push`, `pop` and `top`. Do the same with `std::vector` — a class that needs a vector holds one; it does not derive from one, which would also inherit a non-virtual destructor (lesson 4).

## Private inheritance

`class Stack : private std::vector<int>` is legal and means "implemented in terms of": the base's public members become private in `Stack`, no one outside can treat a `Stack` as a `std::vector<int>`, and the relationship is invisible to users. It is composition wearing inheritance's syntax.

```cpp
class Stack : private std::vector<int> {
public:
    using std::vector<int>::empty;              // re-expose selected members
    using std::vector<int>::size;
    void push(int v) { push_back(v); }
    int pop() { int v = back(); pop_back(); return v; }
};
```

Prefer a member. Private inheritance earns its place in three narrow cases: the derived class must override a virtual function of the implementation class; it needs access to that class's protected members; or the base is empty and the *empty base optimisation* saves the byte a member would cost — a concern for library authors, not application code.

## Multiple inheritance and the diamond

A class may have several bases. With interface classes (lesson 3) it is routine and safe: interfaces carry no state, so nothing can collide. With bases that carry data, a shape called the **diamond** appears:

```cpp
struct Device  { std::string id; };
struct Printer : Device { void print() {} };
struct Scanner : Device { void scan() {} };
struct Copier  : Printer, Scanner {};

Copier c;
c.id = "x";           // error: request for member 'id' is ambiguous — two Device subobjects
c.Printer::id = "x";  // one of them
```

A `Copier` contains *two* `Device`s, one through each path, and `c.id` cannot choose. **Virtual inheritance** makes the paths share one:

```cpp
struct Printer : virtual Device { void print() {} };
struct Scanner : virtual Device { void scan() {} };
struct Copier  : Printer, Scanner {};       // one Device; c.id is unambiguous
```

With virtual bases the *most derived* class constructs the shared base — `Copier`'s initialiser list is where `Device(…)` is called, and the `Device(…)` in `Printer`'s and `Scanner`'s lists is ignored when they are parts of a `Copier` — and each object gains a pointer to locate the shared subobject. The standard library's own diamond, `std::iostream` deriving from `std::istream` and `std::ostream`, which both derive virtually from `std::ios`, is why the mechanism exists. It is rare in application code; when a diamond appears in a design, the usual answer is that one of the edges should have been composition.

## Choosing

| Use public inheritance when | Use composition when |
| --- | --- |
| Callers must handle objects through a base interface without knowing the concrete type | You want to reuse an implementation |
| The derived type honours every promise of the base, invariants included | The derived type would have to hide or weaken base functions |
| The set of types is open and the operations are fixed (lesson 5) | The collaborator may change at run time or be a test double |
| The base is an interface: pure virtual functions and no data | The relationship is "uses" or "has", not "is" |

The Core Guidelines summarise it as C.129: *when designing a class hierarchy, distinguish between implementation inheritance and interface inheritance* — and use public inheritance for the interface kind only.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Deriving to reuse code (`class Stack : public std::vector<int>`) | The whole base interface leaks; no virtual destructor. |
| `Square : Rectangle` with setters | Substitution fails; functions written for the base compute wrong answers. |
| Two data-carrying bases sharing a grandparent | Two copies of the grandparent; ambiguous member access. |
| Protected data reached from many derived classes | Every change to the base ripples through all of them. |
| Multiple non-interface bases | Diamonds, ambiguity and initialisation puzzles; keep to one base plus interfaces. |

## Key takeaways

- Public inheritance says *is-a and substitutable*: the derived class must keep every promise of the base's interface, invariants included.
- Composition (a member) says *has-a*: you choose what to expose, can swap the part, and stay decoupled from its representation.
- Prefer composition; use public inheritance to get dynamic dispatch through an interface class.
- Private inheritance is composition in disguise — "implemented in terms of" — and rarely better than a member.
- Multiple inheritance is safe for interfaces; data-carrying diamonds need `virtual` bases and are usually a design mistake.

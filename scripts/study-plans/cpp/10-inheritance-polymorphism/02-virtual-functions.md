---
title: Virtual functions — static type, dynamic type and override
minutes: 15
---
A `Car` bound to a `Vehicle&` is still a `Car`, but which `describe()` runs when you call it through the reference? Without `virtual`, the one `Vehicle` declared — the compiler chose it from the reference's type before the program ran. With `virtual`, the one `Car` provides — chosen at run time from the object's actual type. That single keyword is the difference between inheritance as code reuse and inheritance as polymorphism. This lesson covers what it changes: the two types every expression has, `override` and `final`, calling through a base reference, reaching the base version, and the two places where dispatch does not behave the way intuition says — default arguments and constructors.

## Static type and dynamic type

```cpp
Car car("mini", 3);
Vehicle& v = car;         // static type: Vehicle&   dynamic type: Car
Vehicle* p = &car;        // static type: Vehicle*   dynamic type: Car
Vehicle copy = car;       // static and dynamic type: Vehicle (slicing — lesson 4)
```

The **static type** is the declared type of the expression, known at compile time. The **dynamic type** is the type of the object it actually refers to, known only at run time and only meaningful for references and pointers — an object itself is exactly its declared type. A non-virtual call is resolved from the static type; a virtual call is resolved from the dynamic type. This is why polymorphism in C++ happens through references and pointers and never through values.

## virtual

```cpp
#include <iostream>
#include <string>

class Vehicle {
public:
    virtual ~Vehicle() = default;                                     // lesson 4 explains why
    virtual std::string describe() const { return "a vehicle"; }
    std::string plate() const { return "generic"; }                   // not virtual
};

class Car : public Vehicle {
public:
    std::string describe() const override { return "a car"; }
    std::string plate() const { return "car-plate"; }                 // hides, does not override
};

void show(const Vehicle& v) {
    std::cout << v.describe() << " / " << v.plate() << '\n';
}

int main() {
    Car car;
    show(car);                          // a car / generic
    std::cout << car.plate() << '\n';   // car-plate — on the object itself the static type is Car
}
```

`describe` is virtual, so `v.describe()` consults the dynamic type and finds `Car::describe`. `plate` is not, so `v.plate()` is bound at compile time to `Vehicle::plate`; `Car::plate` merely *hides* it (lesson 1) and is reached only through a `Car`. A function declared `virtual` in a base stays virtual in every derived class whether or not the keyword is repeated — `Car::describe` is virtual, and a `SportsCar::describe` would override it in turn.

Two costs come with the keyword. A virtual call is an indirect call through a table the compiler builds for the class (lesson 5 shows the mechanism), which the optimiser usually cannot inline; and every object of a class with at least one virtual function carries a hidden pointer to that table. Neither is large. Both are why the standard containers have no virtual functions and why `virtual` is a design decision rather than a default.

## override and final

`override` says "this function overrides a virtual function in a base", and the compiler checks the claim. Without it, a mistake in the signature silently declares a *new* function, and the base version keeps running:

```cpp
class Vehicle {
public:
    virtual std::string describe() const;
};
class Car : public Vehicle {
public:
    std::string describe() { return "a car"; }            // no const: a new function, not an override
    std::string describe() const override;                 // the real override
    std::string descrbe() const override;                  // error: marked 'override', but does not override
    std::string describe(int) const override;              // error: marked 'override', but does not override
};
```

A missing `const`, a typo, an extra parameter, a different return type — each compiles without `override` and fails quietly at run time. With it, every one is a compile error. Mark every override; GCC and Clang offer `-Wsuggest-override` to enforce the habit.

`final` closes the door: on a function, no further derived class may override it; on a class, nothing may derive from it at all.

```cpp
class Taxi final : public Car {
public:
    std::string describe() const final { return "a taxi"; }
};
class Cab : public Taxi {};                                // error: cannot derive from 'final' base 'Taxi'
```

`final` documents a design decision, and it lets the compiler replace some virtual calls with direct ones, since it knows no override can exist below.

## Calling the base version

An override often extends rather than replaces. The base version is reached with a qualified name, which is always a non-virtual call:

```cpp
class Car : public Vehicle {
public:
    std::string describe() const override {
        return Vehicle::describe() + " with four wheels";     // "a vehicle with four wheels"
    }
};
```

Forget the qualifier — `return describe() + …` — and the function calls itself until the stack is exhausted.

## Default arguments are bound statically

```cpp
struct Base {
    virtual void greet(const std::string& who = "base") const { std::cout << "Base greets " << who << '\n'; }
};
struct Derived : Base {
    void greet(const std::string& who = "derived") const override { std::cout << "Derived greets " << who << '\n'; }
};

Derived d;
Base& b = d;
b.greet();          // Derived greets base
```

The function chosen is `Derived::greet` — dynamic dispatch — but the default argument comes from the static type, `Base`, because default arguments are filled in by the compiler at the call site, which only knows the static type. The result is a call nobody wrote. Rule: never redefine default arguments in an override; give them in the base only, or use an overload instead.

## Virtual calls in constructors and destructors

```cpp
struct Base {
    Base() { std::cout << name() << '\n'; }
    virtual ~Base() = default;
    virtual std::string name() const { return "Base"; }
};
struct Derived : Base {
    std::string name() const override { return "Derived"; }
};

Derived d;          // prints Base
```

During `Base`'s constructor the object *is* a `Base`: the derived part has not been constructed yet, and C++ sets the dynamic type stage by stage as construction proceeds (lesson 5 explains how). So the virtual call resolves to `Base::name`, not to the override. Java does the opposite — it calls the override on a subclass whose fields are still zero — and C++'s choice is the safer one, but it surprises people arriving from Java. The same applies in destructors, in the other direction: by the time `~Base` runs the derived part is gone and the dynamic type is `Base` again. A call to a *pure* virtual function (lesson 3) from a constructor has no body to reach and terminates the program.

If a derived class needs a hook to run after construction, provide a separate `init()` the creator calls, or use a factory function (Module 8, lesson 2) that constructs the object and then calls it.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Calling a virtual function on a value rather than a reference or pointer | The static type is the dynamic type; no dispatch — and a copy may have sliced. |
| Override without `override` and a signature that differs | A new, hidden function; the base version keeps running. |
| Different default arguments in an override | The base's default with the derived body. |
| Virtual call in a constructor expecting the derived version | The base version runs. |
| `describe()` instead of `Vehicle::describe()` inside the override | Infinite recursion. |
| Deleting through a base pointer with a non-virtual destructor | Undefined behaviour — lesson 4. |

## Key takeaways

- Static type: what the expression is declared as. Dynamic type: what the object really is. Non-virtual calls use the first, virtual calls the second.
- Polymorphism happens only through references and pointers; a value has no separate dynamic type.
- `override` turns a mismatched signature into a compile error; `final` forbids further overriding or deriving.
- `Base::f()` calls the base version non-virtually — the way an override extends behaviour.
- Default arguments are chosen from the static type; virtual calls inside constructors and destructors resolve to the class being constructed.

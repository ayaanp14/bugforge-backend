---
title: Inheritance basics — deriving, protected and the order of construction
minutes: 14
---
A class can be built on another: `class Car : public Vehicle` makes every `Car` contain a `Vehicle` and gives it that class's members. Java has the same idea with `extends`; C++ differs in the details that matter — an access specifier on the base itself, a `protected` level between public and private, a construction sequence the compiler fixes and you cannot reorder, constructors that are not inherited unless you ask, and a name-lookup rule that hides base functions wholesale. This lesson settles those mechanics. The next lesson adds `virtual`, which is where inheritance stops being code reuse and becomes polymorphism.

## Deriving a class

```cpp
#include <iostream>
#include <string>

class Vehicle {
public:
    explicit Vehicle(std::string name) : name_(std::move(name)) {}
    const std::string& name() const { return name_; }
    int wheels() const { return wheels_; }
protected:
    int wheels_ = 4;
private:
    std::string name_;
};

class Car : public Vehicle {
public:
    Car(std::string name, int doors) : Vehicle(std::move(name)), doors_(doors) {}
    int doors() const { return doors_; }
private:
    int doors_;
};

int main() {
    Car car("mini", 3);
    std::cout << car.name() << ' ' << car.wheels() << ' ' << car.doors() << '\n';   // mini 4 3
    return 0;
}
```

`Car` is the *derived* class and `Vehicle` its *base* — C++ says base and derived where Java says super and sub. A `Car` object contains a complete `Vehicle` subobject (on this platform the base's members are laid out first, then the derived class's own), and every public member of `Vehicle` is callable on a `Car` as though `Car` had declared it. What is inherited: data members, member functions including `static` ones, and nested types. What is not: constructors, the destructor and the assignment operators — the derived class gets its own, which call the base's — and friendships. `private` members are present in the object but inaccessible to the derived class's code.

The word `public` before `Vehicle` is the *inheritance access specifier*, and in practice it is not optional. `class Car : Vehicle` means **private** inheritance — the default for `class`, just as private is the default for members — which makes every inherited member private to `Car` and stops a `Car` from being passed where a `Vehicle&` is expected. `struct` defaults to public. Write `public` every time you mean is-a; lesson 6 covers the rare uses of the private form.

A derived object converts implicitly to a reference or pointer to its base — `const Vehicle& v = car;` compiles because a `Car` *is a* `Vehicle`. That upcast is what makes the next lesson possible. A conversion in the other direction never happens by itself.

## Three levels of access

`protected` sits between `public` and `private`: a protected member is accessible inside the class, inside its friends, and inside member functions of derived classes — but only through an object of the derived type. `wheels_` above may be read by `Car`'s member functions; a free function or `main` cannot touch it, and `Car`'s functions cannot read `wheels_` through a plain `Vehicle&` either, only through a `Car`.

| Specifier | Inside the class | In a derived class | Everywhere else |
| --- | --- | --- | --- |
| `public` | yes | yes | yes |
| `protected` | yes | yes | no |
| `private` | yes | no | no |

Protected data is a weak form of public: every derived class becomes a client of the base's representation, and changing that representation breaks them all. Prefer private data with protected *functions* when derived classes need a controlled way in; keep protected data for small, stable hierarchies where the convenience is worth it.

## Construction order

A derived class's constructor runs in three fixed stages, whatever order the initialiser list happens to write them in:

1. The **base class** subobject is constructed — by the constructor named in the initialiser list, or by the base's default constructor when none is named.
2. The derived class's **members** are constructed in declaration order — the same rule as a class with no base (Module 8, lesson 2).
3. The **constructor body** runs.

```cpp
struct Engine { Engine() { std::cout << "Engine "; } ~Engine() { std::cout << "~Engine "; } };
struct Base   { Base()   { std::cout << "Base "; }   ~Base()   { std::cout << "~Base "; } };
struct Derived : Base {
    Engine engine;
    Derived()  { std::cout << "Derived "; }
    ~Derived() { std::cout << "~Derived "; }
};

int main() {
    Derived d;                 // Base Engine Derived
}                              // ~Derived ~Engine ~Base
```

Destruction is the exact reverse: the derived destructor's body, then the derived members in reverse declaration order, then the base. That symmetry is why a derived destructor may still use the base's members — the base stays alive until the derived body has finished — and why a base destructor must never rely on derived state, which is already gone. It also means the base is fully built before the derived body starts, so a derived constructor can call base member functions in its body safely.

## Calling the base constructor

The base constructor is called from the initialiser list, and only from there:

```cpp
class Car : public Vehicle {
public:
    Car(std::string name, int doors) : Vehicle(std::move(name)), doors_(doors) {}
};
```

If the list does not name the base, the compiler inserts `Vehicle()`. When the base has no default constructor — `Vehicle` has only `Vehicle(std::string)` — that is a compile error: `no matching function for call to 'Vehicle::Vehicle()'`. Writing `Vehicle(name);` inside the body instead of the list is legal C++ that does something else entirely: it constructs a temporary `Vehicle` and throws it away, after the base subobject was already default-constructed (or failed to be). The base always goes in the list, and it goes first by rule even when you write it second.

## Inheriting constructors

Constructors are not inherited: a `Car` needs its own, even one that only forwards. When the derived class adds no state that needs arguments, C++11 lets you pull the base's constructors in wholesale:

```cpp
class Taxi : public Vehicle {
public:
    using Vehicle::Vehicle;      // Taxi(std::string) now exists and forwards to Vehicle(std::string)
    int fares = 0;               // derived members get their default member initialisers
};

Taxi t("cab-7");
```

`using Base::Base;` declares a constructor in `Taxi` for every constructor of `Vehicle`, each forwarding its arguments to the base and leaving the derived members to their in-class initialisers. It is the right tool for thin wrappers and tag types. A derived class with members that must be set from arguments still writes its own constructor.

## Name hiding

```cpp
struct Printer {
    void print(int v)    { std::cout << "int " << v << '\n'; }
    void print(double v) { std::cout << "double " << v << '\n'; }
};
struct Fancy : Printer {
    void print(const std::string& s) { std::cout << "string " << s << '\n'; }
};

Fancy f;
f.print("hi");      // string hi
f.print(3);         // error: no conversion from int to std::string
```

Declaring `print` in `Fancy` **hides every** `print` in `Printer`, not only the one with matching parameters. Name lookup stops at the first class, walking upward, that declares the name; overload resolution then runs on what it found there and nothing else. Java merges overloads across the hierarchy; C++ does not. Two fixes: `using Printer::print;` inside `Fancy` brings the base overloads into the derived scope so all three overload together, or call the hidden one explicitly as `f.Printer::print(3)`. The same qualified form, `Printer::print(v)`, is how a derived function calls the base version of the function it replaces — a habit that becomes essential the moment functions are `virtual`.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `class D : B` | Private inheritance; `D` is not usable as a `B` outside itself. |
| Base has no default constructor and the list omits it | Compile error at the derived constructor. |
| `Base(x);` in the constructor body | A temporary; the base subobject was default-constructed already. |
| Relying on initialiser-list order | Ignored: base first, then members in declaration order. |
| A derived `f(double)` next to a base `f(int)` | The base overload is hidden; add `using Base::f;`. |
| Reading a protected member through a `Base&` inside `Derived` | Not allowed; only through a `Derived` object. |
| Using derived state in the base destructor | Already destroyed — the reverse order guarantees it. |

## Key takeaways

- `class D : public B` embeds a complete `B` in every `D` and exposes `B`'s public members; write `public` explicitly or you get private inheritance.
- `protected` is visible to derived classes and friends; prefer protected functions over protected data.
- Construction is base, then members in declaration order, then the body; destruction is the exact reverse.
- The base constructor is named in the initialiser list; omit it and the base's default constructor is used or the build fails.
- `using B::B;` inherits constructors for a derived class that adds nothing needing arguments.
- A derived name hides every base overload of that name; `using B::f;` or `B::f()` gets them back.

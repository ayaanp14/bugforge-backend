---
title: Abstract classes and interfaces — programming to a contract
minutes: 14
seo-title: Abstract Class in C++: Pure Virtual Functions and Interfaces
description: A pure virtual function makes a C++ class abstract, so it cannot be instantiated. Interface classes, the NVI idiom and containers of polymorphic objects.
question: What is an abstract class in C++?
answer: An abstract class in C++ is a class with at least one pure virtual function, declared with `= 0` as in `virtual double area() const = 0;`. It cannot be instantiated and is used only through references and pointers. A derived class becomes concrete once it overrides every pure virtual function. An abstract class with no data and only pure virtual functions is C++'s equivalent of an interface.
q: What is a pure virtual function?
a: A virtual function declared with `= 0`, which the base class does not have to implement and every concrete derived class must override. Its presence makes the class abstract. It may still be given a body outside the class, which overrides can call as `Base::f()`.
q: How do you create an interface in C++?
a: C++ has no `interface` keyword; an interface is an abstract class with no data members, only pure virtual functions and a virtual destructor. A class implements it by deriving publicly and overriding every function, and may implement several interfaces at once through multiple inheritance.
q: Can you have a vector of an abstract class in C++?
a: Not by value: `std::vector<Shape>` cannot hold an abstract type, and for a concrete base it would slice every element. Hold the objects through owning pointers as `std::vector<std::unique_ptr<Shape>>`, filled with `std::make_unique<Circle>(r)`; the vector deletes each object through the base's virtual destructor.
q: What is the non-virtual interface (NVI) idiom?
a: NVI keeps a class's public function non-virtual and has it call a private virtual function that derived classes override. The base keeps control of the public entry point, so it can add checks or logging around every call, while derived classes still customise the behaviour.
---
Some base classes exist only to be derived from. A `Shape` has an area, but there is no formula for the area of "a shape" — only of a circle or a rectangle. C++ expresses that with a *pure virtual function*: a function the base declares and refuses to define, which makes the class *abstract* and forces every concrete derived class to supply the body. This lesson covers the syntax, what an abstract class can and cannot do, the interface class as C++'s version of Java's `interface`, a `Shape` hierarchy used the way library code uses one, and the container that holds a mixed collection of shapes without losing anything: `std::vector<std::unique_ptr<Shape>>`.

## Pure virtual functions

```cpp
#include <algorithm>
#include <iostream>
#include <memory>
#include <numbers>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual std::string name() const = 0;
};
```

`= 0` after the declaration marks the function *pure virtual*: the base has no implementation and a derived class must provide one. A class with at least one pure virtual function is **abstract**, and the compiler refuses to create an object of it:

```cpp
Shape s;                              // error: cannot declare variable 's' to be of abstract type 'Shape'
Shape* p = new Shape;                 // same error
```

References and pointers to `Shape` are fine — that is the whole point — so `const Shape&` parameters and `std::unique_ptr<Shape>` members work as usual. A derived class that overrides *every* pure virtual function is concrete and can be instantiated; one that leaves any of them out is abstract too, and the error message when you try to create it names the missing function, which is the fastest way to find out what an interface requires.

A pure virtual function may still have a body, defined outside the class — `double Shape::area() const { return 0; }` — which derived overrides can call as `Shape::area()`. The class stays abstract. The common use is a pure virtual destructor, a way to make a class abstract when no other function is naturally pure.

## Concrete shapes

```cpp
class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return std::numbers::pi * r_ * r_; }
    double perimeter() const override { return 2 * std::numbers::pi * r_; }
    std::string name() const override { return "circle"; }
private:
    double r_;
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }
    double perimeter() const override { return 2 * (w_ + h_); }
    std::string name() const override { return "rect"; }
private:
    double w_, h_;
};
```

Each concrete class carries its own representation — a radius, a width and a height — and answers the three questions in its own way. Nothing in `Shape` knows either representation exists. `override` on each function makes the compiler confirm that the concrete class really satisfies the contract, rather than silently adding a differently spelled function and remaining abstract.

## Interface classes

An abstract class with no data members and nothing but pure virtual functions (plus a virtual destructor) is an **interface class** — what Java calls an `interface`. `Shape` above is one. The convention matters because such a class promises nothing about representation: any type that can answer `area`, `perimeter` and `name` can be a `Shape`, whether it stores a radius, a polygon's vertices, or a handle into a graphics library.

```cpp
class Drawable {
public:
    virtual ~Drawable() = default;
    virtual void draw(std::ostream& out) const = 0;
};
class Serializable {
public:
    virtual ~Serializable() = default;
    virtual std::string serialize() const = 0;
};

class Sprite : public Drawable, public Serializable { /* implements both */ };
```

A class may implement several interfaces by deriving from all of them — the one form of multiple inheritance (lesson 6) that is routine in C++, because interfaces carry no state and so cannot collide.

## Programming to the interface

```cpp
void report(const Shape& s) {
    std::cout << s.name() << ": area " << s.area() << ", perimeter " << s.perimeter() << '\n';
}

double largest(const std::vector<std::unique_ptr<Shape>>& shapes) {
    double best = 0;
    for (const auto& s : shapes) best = std::max(best, s->area());
    return best;
}
```

`report` and `largest` compile once and work for every shape that will ever be written — a `Triangle` added next year needs no change here. That is the *open–closed* property polymorphism exists for: code is open for extension by new derived classes and closed for modification. Functions should take the most abstract type that gives them what they need, which is usually `const Shape&`; taking `const Circle&` where only `area()` is used couples the function to one representation for no gain.

## A container of shapes

`std::vector<Shape>` is impossible — `Shape` is abstract — and would be wrong even for a concrete base, because copying a `Circle` into a `Shape` slot keeps only the `Shape` part (lesson 4). A mixed collection needs indirection, and the owning indirection is `std::unique_ptr` (Module 7, lesson 4):

```cpp
std::unique_ptr<Shape> makeShape(const std::string& kind, std::istream& in) {
    if (kind == "circle") {
        double r;
        in >> r;
        return std::make_unique<Circle>(r);
    }
    double w, h;
    in >> w >> h;
    return std::make_unique<Rect>(w, h);
}

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string kind;
    while (std::cin >> kind) shapes.push_back(makeShape(kind, std::cin));
    for (const auto& s : shapes) report(*s);
    std::cout << "largest: " << largest(shapes) << '\n';
    return 0;
}
```

`std::make_unique<Circle>(r)` yields a `std::unique_ptr<Circle>`, which converts implicitly to `std::unique_ptr<Shape>` — the same upcast as `Circle*` to `Shape*`, carried through the smart pointer. The vector owns every shape; when it is destroyed, each `unique_ptr` deletes its object through a `Shape*`, which is exactly why `Shape` needs its virtual destructor (lesson 4). The factory `makeShape` is the one place that knows the concrete types; everything after it sees `Shape`. Iterate with `const auto&` — copying a `unique_ptr` is a compile error, and the reference is what you wanted anyway.

When shared ownership is genuinely required, `std::shared_ptr<Shape>` works the same way; when the container does not own the shapes at all, a `std::vector<Shape*>` observes objects that live elsewhere. Owning is the common case, and `unique_ptr` is the default.

## Non-virtual interface

A refinement worth knowing: keep the public function non-virtual and let it call a private virtual one.

```cpp
class Shape {
public:
    double area() const { return computeArea(); }       // public, non-virtual: could validate or log
private:
    virtual double computeArea() const = 0;              // derived classes override this
};
```

Derived classes override `computeArea` — a private virtual can be overridden, because access and virtuality are separate rules — while the public `area` stays under the base's control, free to add checks around the call. The idiom is called NVI. A hierarchy with pre- and post-conditions benefits from it; a plain `Shape` does not need it.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Creating an abstract class by value (`Shape s;`, `std::vector<Shape>`) | Compile error naming the pure function. |
| Overriding with a different signature and no `override` | The class stays abstract; the error appears where it is instantiated. |
| Calling a pure virtual function from the base constructor | No body to reach; the program terminates. |
| Returning `Shape` by value from a factory | Impossible for an abstract base; return `std::unique_ptr<Shape>`. |
| `for (auto s : shapes)` over a vector of `unique_ptr` | Tries to copy a `unique_ptr`; use `const auto&`. |
| Omitting the virtual destructor in the interface | Deleting through `unique_ptr<Shape>` is undefined behaviour. |

## Key takeaways

- `= 0` makes a function pure virtual and its class abstract: no objects, only references and pointers.
- A derived class is concrete once it overrides every pure virtual function; miss one and it is abstract too.
- An interface class has only pure virtual functions and a virtual destructor; a class may implement several.
- Take `const Base&` in functions and let the dynamic type decide — new derived classes need no changes.
- Hold a mixed collection as `std::vector<std::unique_ptr<Base>>`, built by a factory that returns `std::unique_ptr<Base>`.

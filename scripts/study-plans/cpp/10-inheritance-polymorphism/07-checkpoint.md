---
title: Checkpoint — Inheritance and polymorphism
minutes: 25
seo-title: C++ Inheritance and Polymorphism Quiz: Virtual Functions Test
description: Test your C++ polymorphism with 14 questions and three programs on inheritance, virtual functions, virtual destructors, slicing and the vtable.
q: What happens when `delete` runs through a `Base*` whose destructor is not virtual?
a: Undefined behaviour. In practice only the base destructor runs: the derived destructor is skipped, so the derived members are never destroyed and whatever they own leaks. Give every polymorphic base a `virtual ~Base() = default;`.
q: What does `void f(Base b)` do to a `Derived` argument?
a: It slices it: the parameter is a new `Base` copy-constructed from the argument's base part, the derived members are dropped, and virtual calls inside `f` run the base versions. Take `const Base&` instead to keep the object's dynamic type.
q: What does `dynamic_cast<T*>` return on failure?
a: A null pointer, which the caller tests with `if (auto* t = dynamic_cast<T*>(p))`. The reference form, `dynamic_cast<T&>`, cannot return a null reference, so it throws `std::bad_cast` instead.
q: Why does a virtual call inside a base constructor run the base version?
a: While the base constructor runs, the derived part of the object has not been constructed, so its dynamic type is still the base: each constructor points the vptr at its own class's vtable before its body runs. The derived override becomes reachable only once the derived constructor takes over.
---
This checkpoint covers the whole module: deriving with `public` and `protected` and the fixed order of construction and destruction; `virtual`, `override` and `final` and the two places dispatch does not reach; pure virtual functions, interface classes and a container of `std::unique_ptr<Base>`; virtual destructors and slicing; the vtable, `dynamic_cast`, `typeid` and `std::variant`; and is-a against has-a.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- In what order do the base subobject, the derived class's members and the derived constructor body run — and in what order are they destroyed?
- What does `override` catch that the compiler would otherwise accept silently?
- Why does a virtual call inside a base constructor run the base version?
- What happens when `delete` runs through a `Base*` whose destructor is not virtual?
- What does `void f(Base b)` do to a `Derived` argument?
- What does `dynamic_cast<T*>` return on failure, and what does `dynamic_cast<T&>` do instead?
- Why is `Square : Rectangle` with setters a broken design?

The three programs are a bank of polymorphic accounts held through `std::unique_ptr`, an expression tree built on an abstract `Expr`, and a plugin registry whose load and unload trace pins the construction and destruction order. Read each input format before writing a class.

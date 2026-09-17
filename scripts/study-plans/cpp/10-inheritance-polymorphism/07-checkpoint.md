---
title: Checkpoint — Inheritance and polymorphism
minutes: 25
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

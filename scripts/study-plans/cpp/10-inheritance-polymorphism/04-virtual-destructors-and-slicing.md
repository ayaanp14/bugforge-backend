---
title: Virtual destructors and slicing — the two ways a hierarchy loses data
minutes: 14
---
Two bugs follow polymorphic classes everywhere. The first: an object created as a `Derived` and deleted through a `Base*` runs only the base destructor — unless that destructor is virtual — so the derived part is never cleaned up, and the standard calls the whole operation undefined behaviour. The second: an object copied *into* a `Base` — a by-value parameter, an element of a `std::vector<Base>`, a plain `Base b = derived;` — keeps only the base part, silently. Neither is a compile error. This lesson explains both, shows what the compiler and the sanitizers say, and gives the rules that make them impossible: a virtual destructor on every polymorphic base, and references, pointers or `unique_ptr`s wherever a derived object travels.

## Deleting through a base pointer

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Resource {
public:
    Resource() { std::cout << "Resource acquired\n"; }
    ~Resource() { std::cout << "Resource released\n"; }          // not virtual
};

class Logged : public Resource {
public:
    Logged() : log_(1000, 'x') { std::cout << "Logged opened\n"; }
    ~Logged() { std::cout << "Logged closed\n"; }
private:
    std::string log_;
};

int main() {
    Resource* r = new Logged;
    delete r;                    // undefined behaviour: static type Resource, dynamic type Logged
}
```

In practice, on this platform, this prints `Resource acquired`, `Logged opened`, `Resource released` — and nothing else. `delete r` uses the static type of `r`: it calls `~Resource`, then frees the block as though it held a `Resource`. `~Logged` never runs, and `log_`'s thousand bytes leak. The standard's wording is that deleting an object through a pointer to a base whose destructor is not virtual is **undefined behaviour**; the leak is only the visible part, and AddressSanitizer reports the mismatch as `new-delete-type-mismatch`.

`std::unique_ptr<Resource> p = std::make_unique<Logged>();` has the same problem: `unique_ptr<Resource>` deletes through a `Resource*`. `std::shared_ptr` happens to escape it — `std::make_shared<Logged>()` records the deleter for `Logged` in the control block at creation — but a design that relies on that detail breaks the moment someone changes the pointer type.

## The fix: a virtual destructor

```cpp
class Resource {
public:
    virtual ~Resource() { std::cout << "Resource released\n"; }
};
```

A virtual destructor is dispatched like any virtual function: `delete r` now finds `~Logged` through the dynamic type, which runs its body, destroys `log_`, then calls `~Resource` — the reverse of construction (lesson 1), exactly as if the object had been a local `Logged`. Output: `Logged closed`, `Resource released`. When the base has nothing to do in its destructor, write `virtual ~Resource() = default;`. On the derived side, `~Logged() override` is legal and useful: it fails to compile if the base destructor is not virtual.

The rule, stated by the C++ Core Guidelines as C.35: *a base class destructor should be either public and virtual, or protected and non-virtual.* Public and virtual is the normal case — anyone may delete through the base. Protected and non-virtual is for a base that is never deleted polymorphically: nobody outside can `delete` a `Base*`, so the question does not arise and the class avoids a vptr. Practical shortcut: if a class has any virtual function, give it a virtual destructor.

One cost to remember from Module 9: declaring a destructor — even `= default` — suppresses the implicit move constructor and move assignment. A polymorphic base that should be movable declares all five special members, usually all `= default`.

## Slicing

```cpp
class Employee {
public:
    explicit Employee(std::string name) : name_(std::move(name)) {}
    virtual ~Employee() = default;
    virtual std::string role() const { return "employee"; }
protected:
    std::string name_;
};

class Manager : public Employee {
public:
    Manager(std::string name, int reports) : Employee(std::move(name)), reports_(reports) {}
    std::string role() const override { return "manager of " + std::to_string(reports_); }
private:
    int reports_;
};

void byValue(Employee e)      { std::cout << e.role() << '\n'; }
void byRef(const Employee& e) { std::cout << e.role() << '\n'; }

int main() {
    Manager m("ada", 5);
    byValue(m);          // employee          — sliced
    byRef(m);            // manager of 5
    Employee copy = m;   // copy is an Employee; reports_ is gone
    std::cout << copy.role() << '\n';   // employee
}
```

`byValue(Employee e)` copy-constructs an `Employee` from `m`. The copy constructor of `Employee` takes a `const Employee&`, to which `m` binds by the usual upcast, and it copies exactly the `Employee` members — `name_` — because that is all an `Employee` has. `reports_` is not copied; there is nowhere to put it. The result is a complete, valid `Employee` whose dynamic type is `Employee`, so `e.role()` calls the base version. This is **object slicing**: the derived part is cut off by a copy into a base-typed value. Nothing is undefined; the program simply and quietly does the wrong thing.

Slicing happens wherever a derived object is copied into a base object:

| Site | What slices |
| --- | --- |
| `void f(Base b)` called with a `Derived` | The parameter. |
| `Base b = derived;` | The initialisation. |
| `std::vector<Base> v; v.push_back(derived);` | Each element. |
| `Base& r = base; r = derived;` | The assignment — only the base members are assigned, and `r` keeps its dynamic type. |
| `catch (std::exception e)` | The caught exception (Module 15). |
| `return derived;` from a function returning `Base` | The return value. |

The assignment row is the subtle one: a reference does not slice, but assigning *through* it does, because `Base::operator=` is what runs.

## Preventing slicing

The fix is the same in every row: do not copy polymorphic objects into base-typed values. Take parameters as `const Base&` or `Base*`; hold collections as `std::vector<std::unique_ptr<Base>>` (lesson 3); return `std::unique_ptr<Base>` from factories. When a hierarchy must be copied polymorphically, give it a virtual `clone()`:

```cpp
class Employee {
public:
    virtual std::unique_ptr<Employee> clone() const { return std::make_unique<Employee>(*this); }
};
class Manager : public Employee {
public:
    std::unique_ptr<Employee> clone() const override { return std::make_unique<Manager>(*this); }
};
```

`clone()` copies the whole dynamic object because each override copies its own type. The compiler can also be asked to forbid the accidental copy outright. An abstract base cannot be copied into by value at all — it cannot exist as a value, so `void f(Shape s)` is itself an error — and for a concrete base the guideline C.67 suggests deleting or protecting the copy operations: `Employee(const Employee&) = delete;` turns `byValue(m)` into a compile error instead of a wrong answer. Derived classes that need copying for `clone()` declare their own copy constructor and call the base's protected one.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| A virtual function without a virtual destructor | `delete` through the base is undefined behaviour; the derived destructor is skipped. |
| Trusting `shared_ptr` to compensate | It does, until the pointer becomes a `unique_ptr` or a raw `delete`. |
| `void f(Base b)` in a polymorphic hierarchy | Every call slices; virtual calls inside `f` go to the base. |
| `std::vector<Base>` for a mixed collection | Every element is a base; no polymorphism survives. |
| `*base = *derived` or `base = derived` through references | The base part is assigned, the rest ignored. |
| Declaring `~Base()` and forgetting the moves | Implicit move is suppressed; copies happen instead (Module 9). |

## Key takeaways

- Deleting a derived object through a base pointer needs a virtual base destructor; without it the behaviour is undefined and the derived destructor does not run.
- Any class with a virtual function gets `virtual ~Base() = default;` — or a protected non-virtual destructor when it is never deleted through the base.
- Copying a derived object into a base value keeps only the base part: by-value parameters, `std::vector<Base>`, `Base b = d;`, assignment through a reference.
- Pass and hold polymorphic objects by reference, pointer or `std::unique_ptr<Base>`; copy them through a virtual `clone()`.
- Make the base abstract or delete its public copy operations to turn slicing from a silent bug into a compile error.

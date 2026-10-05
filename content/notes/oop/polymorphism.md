---
title: Polymorphism
order: 5
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Polymorphism in OOP: Overloading, Overriding, vtable
description: Polymorphism in OOP: compile-time overloading vs run-time overriding, dynamic dispatch and the vtable, upcasting, downcasting and object slicing.
question: What is polymorphism in OOP?
answer: Polymorphism means one interface with many implementations: the same call does different things depending on the types involved. Compile-time polymorphism is method and operator overloading, resolved by the compiler from argument types. Run-time polymorphism is method overriding, where the object's actual class decides which method runs through dynamic dispatch — virtual functions and a vtable in C++.
q: What are the types of polymorphism in OOP?
a: Interviews usually expect two: compile-time (static) polymorphism, which is method and operator overloading, and run-time (dynamic) polymorphism, which is method overriding with dynamic dispatch. Type theory adds parametric polymorphism, which is generics in Java and templates in C++, where one piece of code works for many types.
q: What is the difference between method overloading and method overriding?
a: Overloading is several methods with the same name but different parameter lists, usually in one class, chosen by the compiler from the argument types. Overriding is a subclass redefining an inherited method with the same signature, chosen at run time from the object's actual class. Overloading needs no inheritance; overriding does.
q: Does Python support method overloading?
a: Not by signature. Defining a second method with the same name simply replaces the first. Python gets the same effect with default argument values, *args and **kwargs, or functools.singledispatch, which picks an implementation from the type of the first argument at run time.
q: What is a virtual function in C++?
a: A virtual function is a member function declared with the virtual keyword in a base class so that a call through a base pointer or reference runs the derived class's override. Without virtual, the call is bound at compile time to the version in the pointer's declared type.
q: Does Java support operator overloading?
a: No. Java does not let programmers define operators for their own classes. The one built-in exception is + on String, which the compiler turns into string concatenation. Classes like BigInteger and BigDecimal therefore offer methods such as add and multiply instead of operators.
---
**Polymorphism** — Greek for "many forms" — is the ability of one interface to work with many types. A single call, `employee.pay()`, does the right thing for a manager, an engineer and an intern; a single operator, `+`, adds numbers, joins strings and adds vectors. It is the pillar that lets you add a new class without editing the code that uses it. This note separates the two kinds interviewers ask about — compile-time and run-time — explains how a virtual call actually works (the vtable), and covers upcasting, downcasting and C++'s object slicing.

## What polymorphism means

There are two moments at which a program can decide which code a call runs:

- **Compile time (static or early binding)** — the compiler picks the function from the declared types of the arguments. This is **overloading**: several functions share a name but have different parameter lists, and operator overloading.
- **Run time (dynamic or late binding)** — the program picks the method while it runs, from the actual class of the object. This is **overriding** with **dynamic dispatch**.

Type theory names a third kind, **parametric polymorphism**: one generic piece of code that works for any type, such as `List<T>` in Java or `vector<T>` in C++. C++ templates are compiled into a separate version per type; Java generics are compiled once and the type parameters are erased.

## Compile-time polymorphism

### Method overloading

Two methods **overload** each other when they share a name and differ in the number, types or order of their parameters. The compiler picks the best match for each call.

- A difference in **return type alone** is not enough: `int area(int)` and `long area(int)` cannot coexist, because the call `area(5)` gives the compiler nothing to choose by.
- Java resolves overloads in phases: first without boxing or varargs (but with widening such as `int` to `long`), then with boxing, then with varargs. So with `f(long)` and `f(Integer)` both present, `f(5)` calls `f(long)`.
- C++ reports an error when two candidates match equally well — an **ambiguous call**.
- **Python and JavaScript have no overloading.** A second `def area(...)` replaces the first. Use default arguments, `*args`, or `functools.singledispatch`, which dispatches on the first argument's type at run time.

### Operator overloading

Operator overloading gives an operator a meaning for your own class. C++ defines `operator+`, `operator==` and so on as functions; Python maps operators to special methods (`+` calls `__add__`, `==` calls `__eq__`, `len()` calls `__len__`). Java and JavaScript do not allow it, so their classes use named methods such as `plus`.

```cpp
#include <iostream>
using namespace std;

int area(int side) { return side * side; }         // two overloads: the compiler
int area(int width, int height) { return width * height; }  // picks one per call

struct Vec2 {
    int x, y;
    Vec2 operator+(const Vec2& o) const { return {x + o.x, y + o.y}; }  // operator overloading
};

ostream& operator<<(ostream& out, const Vec2& v) {  // lets cout print a Vec2
    return out << "(" << v.x << ", " << v.y << ")";
}

int main() {
    cout << "square area: " << area(5) << "\n";
    cout << "rectangle area: " << area(3, 4) << "\n";
    Vec2 a{1, 2}, b{3, 4};
    cout << a << " + " << b << " = " << a + b << "\n";
    return 0;
}
```

```java
class Vec2 {
    final int x, y;
    Vec2(int x, int y) { this.x = x; this.y = y; }
    Vec2 plus(Vec2 o) { return new Vec2(x + o.x, y + o.y); }  // no operator overloading in Java
    @Override public String toString() { return "(" + x + ", " + y + ")"; }
}

public class Main {
    static int area(int side) { return side * side; }               // two overloads: the compiler
    static int area(int width, int height) { return width * height; } // picks one per call

    public static void main(String[] args) {
        System.out.println("square area: " + area(5));
        System.out.println("rectangle area: " + area(3, 4));
        Vec2 a = new Vec2(1, 2), b = new Vec2(3, 4);
        System.out.println(a + " + " + b + " = " + a.plus(b));
    }
}
```

```python
def area(width, height=None):  # one function; a default argument stands in for overloading
    return width * width if height is None else width * height


class Vec2:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):  # a + b calls a.__add__(b)
        return Vec2(self.x + other.x, self.y + other.y)

    def __str__(self):
        return f"({self.x}, {self.y})"


print(f"square area: {area(5)}")
print(f"rectangle area: {area(3, 4)}")
a, b = Vec2(1, 2), Vec2(3, 4)
print(f"{a} + {b} = {a + b}")
```

```javascript
function area(width, height) { // no overloading: one function checks its arguments
  return height === undefined ? width * width : width * height;
}

class Vec2 {
  constructor(x, y) { this.x = x; this.y = y; }
  plus(o) { return new Vec2(this.x + o.x, this.y + o.y); } // no operator overloading in JS
  toString() { return `(${this.x}, ${this.y})`; }
}

console.log(`square area: ${area(5)}`);
console.log(`rectangle area: ${area(3, 4)}`);
const a = new Vec2(1, 2), b = new Vec2(3, 4);
console.log(`${a} + ${b} = ${a.plus(b)}`);
```

```output
square area: 25
rectangle area: 12
(1, 2) + (3, 4) = (4, 6)
```

## Run-time polymorphism

### Overriding and dynamic dispatch

A subclass **overrides** an inherited method by defining one with the same signature. When code calls that method through a reference of the parent type, the program looks at the object's real class and runs that class's version. This is **dynamic dispatch**, and it is what lets `payroll(employees)` handle a class that did not exist when `payroll` was written.

Which methods dispatch dynamically differs by language:

- **C++** — only functions declared `virtual` in the base class. A non-virtual function is bound at compile time to the declared type.
- **Java** — every instance method that is not `static`, `private` or `final`. (A `final` method cannot be overridden, so there is nothing to choose between.)
- **Python and JavaScript** — every method; the name is looked up on the object's class each time it is called.

The program below keeps a list of `Employee` references holding three different classes. The loop never asks what each one is — each object's own `pay()` runs. At the end it **downcasts** to find the managers, the only ones with an `approveLeave` method.

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Employee {
protected:
    string name;
public:
    Employee(string n) : name(n) {}
    virtual ~Employee() = default;
    virtual string role() const = 0;
    virtual int pay() const = 0;  // dispatched at run time
    void describe() const { cout << name << " (" << role() << "): " << pay() << "\n"; }
};

class Manager : public Employee {
    int salary, bonus;
public:
    Manager(string n, int s, int b) : Employee(n), salary(s), bonus(b) {}
    string role() const override { return "Manager"; }
    int pay() const override { return salary + bonus; }
    void approveLeave() const { cout << name << " approves leave\n"; }
};

class Engineer : public Employee {
    int salary;
public:
    Engineer(string n, int s) : Employee(n), salary(s) {}
    string role() const override { return "Engineer"; }
    int pay() const override { return salary; }
};

class Intern : public Employee {
    int stipend;
public:
    Intern(string n, int s) : Employee(n), stipend(s) {}
    string role() const override { return "Intern"; }
    int pay() const override { return stipend; }
};

int main() {
    vector<unique_ptr<Employee>> staff;
    staff.push_back(make_unique<Manager>("Meera", 120000, 30000));
    staff.push_back(make_unique<Engineer>("Arjun", 90000));
    staff.push_back(make_unique<Intern>("Riya", 25000));

    int total = 0;
    for (const auto& e : staff) {  // upcast: every element is used as an Employee
        e->describe();
        total += e->pay();
    }
    cout << "Payroll total: " << total << "\n";

    for (const auto& e : staff)  // checked downcast: nullptr unless e really is a Manager
        if (auto m = dynamic_cast<const Manager*>(e.get())) m->approveLeave();
    return 0;
}
```

```java
import java.util.List;

abstract class Employee {
    protected final String name;
    Employee(String name) { this.name = name; }
    abstract String role();
    abstract int pay();  // dispatched at run time
    void describe() { System.out.println(name + " (" + role() + "): " + pay()); }
}

class Manager extends Employee {
    private final int salary, bonus;
    Manager(String n, int s, int b) { super(n); salary = s; bonus = b; }
    String role() { return "Manager"; }
    int pay() { return salary + bonus; }
    void approveLeave() { System.out.println(name + " approves leave"); }
}

class Engineer extends Employee {
    private final int salary;
    Engineer(String n, int s) { super(n); salary = s; }
    String role() { return "Engineer"; }
    int pay() { return salary; }
}

class Intern extends Employee {
    private final int stipend;
    Intern(String n, int s) { super(n); stipend = s; }
    String role() { return "Intern"; }
    int pay() { return stipend; }
}

public class Main {
    public static void main(String[] args) {
        List<Employee> staff = List.of(  // upcast: every element is used as an Employee
            new Manager("Meera", 120000, 30000), new Engineer("Arjun", 90000), new Intern("Riya", 25000));

        int total = 0;
        for (Employee e : staff) {
            e.describe();
            total += e.pay();
        }
        System.out.println("Payroll total: " + total);

        for (Employee e : staff)  // checked downcast with a type pattern (Java 16+)
            if (e instanceof Manager m) m.approveLeave();
    }
}
```

```python
class Employee:
    def __init__(self, name):
        self.name = name

    def describe(self):
        print(f"{self.name} ({self.role()}): {self.pay()}")


class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name)
        self.salary, self.bonus = salary, bonus

    def role(self): return "Manager"
    def pay(self): return self.salary + self.bonus
    def approve_leave(self): print(f"{self.name} approves leave")


class Engineer(Employee):
    def __init__(self, name, salary):
        super().__init__(name)
        self.salary = salary

    def role(self): return "Engineer"
    def pay(self): return self.salary


class Intern(Employee):
    def __init__(self, name, stipend):
        super().__init__(name)
        self.stipend = stipend

    def role(self): return "Intern"
    def pay(self): return self.stipend


staff = [Manager("Meera", 120000, 30000), Engineer("Arjun", 90000), Intern("Riya", 25000)]
total = 0
for e in staff:  # each object's own pay() runs
    e.describe()
    total += e.pay()
print(f"Payroll total: {total}")

for e in staff:
    if isinstance(e, Manager):  # Python needs no cast, only a type check
        e.approve_leave()
```

```output
Meera (Manager): 150000
Arjun (Engineer): 90000
Riya (Intern): 25000
Payroll total: 265000
Meera approves leave
```

Notice `describe()` in the base class: it calls `role()` and `pay()`, and those calls dispatch to the subclass even though `describe` itself was written in `Employee`. A base class can therefore define the outline of an algorithm and leave steps to subclasses — the Template Method pattern.

### How a virtual call works: the vtable

C++ compilers implement virtual functions with a **virtual table (vtable)**. The standard does not require it, but GCC, Clang and MSVC all work this way:

1. Every class with at least one virtual function gets **one vtable** — an array of function pointers, one slot per virtual function, pointing at that class's version.
2. Every **object** of such a class carries a hidden pointer, the **vptr**, to its class's vtable. The constructor sets it.
3. A call `e->pay()` compiles to: read the object's vptr, read the slot for `pay`, call the function found there.

```text
 Manager object            Manager's vtable                Intern object        Intern's vtable
+----------------+        +----------------------------+  +----------------+   +---------------------------+
| vptr ----------+------> | ~Manager                   |  | vptr ----------+-> | ~Intern                   |
| name           |        | role  -> Manager::role     |  | name           |   | role  -> Intern::role     |
| salary, bonus  |        | pay   -> Manager::pay      |  | stipend        |   | pay   -> Intern::pay      |
+----------------+        +----------------------------+  +----------------+   +---------------------------+
```

The cost is one pointer per object, one table per class and an indirect call that the compiler usually cannot inline — negligible in most code, noticeable in very tight loops. Java's JVM uses the same idea (method tables), and its JIT compiler often removes the indirection when it can prove only one class is ever seen at a call site. Python looks the method name up on the object's class at each call, through the MRO.

### Upcasting and downcasting

**Upcasting** is treating a child object as its parent type: putting a `Manager` into a list of `Employee`. It is always safe and implicit, because every manager is an employee. **Downcasting** goes the other way — treating an `Employee` reference as a `Manager` — and is safe only if the object really is a manager, so it must be checked.

| | C++ | Java | Python |
| --- | --- | --- | --- |
| Upcast | Implicit: `Employee* e = &m;` | Implicit | Not needed |
| Checked downcast | `dynamic_cast<Manager*>(e)` (base must have a virtual function) | `instanceof`, or `e instanceof Manager m` | `isinstance(e, Manager)` |
| Unchecked downcast | `static_cast<Manager*>(e)` | None: every cast is checked at run time | Not needed: just call the method |
| Wrong type | `nullptr` for pointers, `std::bad_cast` for references; undefined behaviour with `static_cast` | `ClassCastException` | `AttributeError` when the method is missing |

A chain of downcasts (`if it is a Manager... else if it is an Intern...`) is usually a sign that the behaviour belongs in an overridden method instead.

### Object slicing in C++

Polymorphism in C++ works only through **pointers and references**. If you copy a derived object into a base-class *value*, only the base part is copied — the derived part is sliced off — and the copy really is a base object, so its virtual calls run the base versions:

```cpp
#include <iostream>
#include <string>
using namespace std;

class Employee {
public:
    virtual ~Employee() = default;
    virtual string role() const { return "Employee"; }
};

class Manager : public Employee {
public:
    string role() const override { return "Manager"; }
};

void byValue(Employee e) { cout << "by value: " << e.role() << "\n"; }  // copies only the Employee part
void byReference(const Employee& e) { cout << "by reference: " << e.role() << "\n"; }

int main() {
    Manager m;
    byValue(m);
    byReference(m);
    Employee copy = m;  // sliced as well
    cout << "assigned copy: " << copy.role() << "\n";
    return 0;
}
```

```output
by value: Employee
by reference: Manager
assigned copy: Employee
```

Java and Python cannot slice, because their variables only ever hold references.

## Overloading vs overriding

| Aspect | Overloading | Overriding |
| --- | --- | --- |
| What it is | Same name, different parameters | Subclass redefines an inherited method |
| Parameters | Must differ | Must be the same |
| Return type | May differ, but cannot be the only difference | Same, or a subtype (covariant) |
| Decided | At compile time, from argument types | At run time, from the object's class |
| Kind of polymorphism | Compile-time (static) | Run-time (dynamic) |
| Needs inheritance | No | Yes |
| Static, private, final methods | Can be overloaded | Cannot be overridden |
| In Python | Not supported; the last definition wins | Supported |

## Common mistakes

- Trying to overload on return type alone; the compiler rejects it.
- Forgetting `virtual` in C++ and wondering why the base version runs through a base pointer.
- Passing a C++ derived object to a function that takes the base **by value**, slicing it.
- Writing two `def` methods with the same name in Python and expecting overloading.
- Calling an overridable method from a Java constructor; it runs the subclass version before the subclass's fields are initialised.
- Using `static_cast` for a downcast whose type you have not checked.

## Interview questions

**Can a method be overloaded on return type only?**
No, in C++ and Java. A call such as `area(5)` must be resolvable from its arguments, and the return type does not appear at the call site — it may even be discarded. Java reports the second method as "already defined"; C++ reports that the functions cannot be overloaded.

**Can a constructor be virtual in C++?**
No. A virtual call needs the object's vptr, which the constructor itself sets up; and when you construct an object you already name its exact type. To create a copy of an object whose type you do not know, give the base class a virtual `clone()` method. Destructors, on the other hand, should be virtual in any base class used polymorphically.

**What happens if a constructor calls a virtual method?**
In C++ the call dispatches to the class whose constructor is running, not the most derived class, because the derived part does not exist yet. In Java and Python the most derived override runs — before the subclass's own constructor has initialised its fields, so it sees default values such as `null` or `0`. Both are reasons to avoid calling overridable methods from constructors.

**What is the difference between early binding and late binding?**
Early (static) binding fixes which function a call runs at compile time — overloads, non-virtual C++ functions, and Java's static, private and final methods. Late (dynamic) binding chooses at run time from the object's actual class — virtual functions in C++, ordinary instance methods in Java, every method in Python.

**What is the difference between static_cast and dynamic_cast?**
`static_cast` converts at compile time with no run-time check, so a wrong downcast is undefined behaviour. `dynamic_cast` checks the object's real type at run time using its type information, returning `nullptr` for a failed pointer cast or throwing `std::bad_cast` for a failed reference cast, and it requires the base class to have at least one virtual function.

**How does Python achieve polymorphism without overloading or declared types?**
Through duck typing: any object with the right method can be used, whatever its class, so a function that calls `obj.pay()` works for anything with a `pay` method. Overloading-like behaviour comes from default arguments, `*args`, and `functools.singledispatch`.

**Are generics and templates a form of polymorphism?**
Yes, parametric polymorphism: one definition works for many types. C++ templates generate a separate compiled version for each type used. Java generics are checked at compile time and then erased, so one compiled class serves every type argument and the type is not available at run time.

**Can you achieve run-time polymorphism with data members?**
No. Fields are not overridden: in Java, a subclass field with the same name hides the parent's, and which one you read depends on the reference's declared type. Only methods dispatch dynamically, which is one more reason to keep fields private and expose behaviour through methods.

Next, read [Abstraction: Abstract Classes and Interfaces](/notes/oop/abstraction), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

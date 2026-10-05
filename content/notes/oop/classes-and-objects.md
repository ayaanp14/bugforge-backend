---
title: Classes and Objects
order: 2
minutes: 14
level: beginner
updated: 2026-10-05
seo-title: Classes and Objects in OOP: Constructors, Destructors
description: Classes and objects in OOP: fields and methods, default, parameterised and copy constructors, destructors vs garbage collection, this, static members.
question: What are classes and objects in object-oriented programming?
answer: A class is a user-defined type that declares fields (the data each object holds) and methods (the operations on that data). An object is an instance of a class, created at run time by a constructor, with its own copy of every instance field. Static members belong to the class itself and are shared by all its objects.
q: What is a constructor in OOP?
a: A constructor is a special method that runs automatically when an object is created and puts its fields into a valid starting state. In C++ and Java it has the same name as the class and no return type; in Python it is the __init__ method.
q: What are the types of constructors?
a: The usual three are the default constructor (no arguments), the parameterised constructor (takes the starting values) and the copy constructor (builds a new object from an existing one). C++ also has move constructors, and Java and C++ let a class declare several constructors with different parameter lists.
q: What is the difference between static and non-static members?
a: A non-static (instance) field has one copy per object, and an instance method runs on a particular object through this or self. A static field has one copy for the whole class, and a static method runs without any object, so it cannot touch instance fields directly.
q: Are objects stored on the stack or the heap?
a: In C++ either: a local object lives on the stack and dies at the end of its scope, while an object made with new lives on the heap until it is deleted. In Java and Python objects live on the heap and variables hold references to them.
q: What is a destructor?
a: A destructor is a C++ member function named ~ClassName that runs automatically at the exact moment an object's lifetime ends, to release what it owns. Java has no destructors; its garbage collector frees memory at an unspecified time. Python's __del__ is a finaliser whose timing depends on the implementation.
---
A **class** is a type you define yourself: it says what data each object of that type holds and what the object can do. An **object** is one value of that type, made while the program runs. This note covers what goes inside a class (fields, methods, constructors, destructors, static members), how `this` and `self` work, and what actually happens in memory when you create, copy and lose an object — in C++, Java and Python, because each answers those questions differently. If you are new to the idea, start with the [Introduction to Object-Oriented Programming](/notes/oop/introduction-to-oop).

## Fields and methods

A class has two kinds of member:

- **Fields** hold state. C++ calls them data members, Python calls them attributes, Java calls them fields or instance variables. Each object gets its own copy of every instance field.
- **Methods** define behaviour. C++ calls them member functions. A method runs *on* an object and can read and change that object's fields.

| Term | C++ | Java | Python |
| --- | --- | --- | --- |
| Field | data member, declared in the class | field, declared in the class | attribute, usually created in `__init__` |
| Method | member function | method | function defined in the class body |
| Creating an object | `Student s;` or `new Student()` | `new Student()` | `Student()` |
| The current object | `this` (a pointer) | `this` (a reference) | `self` (an explicit first parameter) |

Python is the odd one out: attributes are not declared in the class body. Assigning `self.name = name` inside a method creates the attribute on that object, and you can even add attributes to one object later — which is why a typo such as `self.nmae = ...` silently creates a new attribute instead of failing.

## Constructors

A **constructor** runs once, automatically, when an object is created, and its job is to leave the object in a valid state. It has no return type — in Java, `void Student()` is an ordinary method that happens to share the class's name, not a constructor.

### Default constructor

A default constructor takes no arguments. If you declare **no** constructor at all, C++ and Java supply one. In Java, any field no constructor sets holds `0`, `false` or `null`; C++'s generated constructor leaves built-in members such as `int` uninitialised unless the class gives them a default. The moment you declare any constructor yourself, that free default disappears, so `new Student()` stops compiling until you write one (in C++ you can ask for it back with `Student() = default;`).

### Parameterised constructor

A parameterised constructor takes the starting values as arguments. C++ and Java allow several constructors with different parameter lists (constructor **overloading**). Python and JavaScript allow only one constructor per class — a second `__init__` simply replaces the first — so they use default argument values instead.

### Copy constructor

A copy constructor builds a new object from an existing one of the same class. C++ generates one for you that copies each member; you write your own when a plain member-by-member copy is wrong, typically when the class owns a raw pointer. Java generates none: a "copy constructor" such as `Student(Student other)` is just a convention you write by hand. Python uses `copy.copy`, or a class method that plays the same part. [Object Equality, Hashing and Copying](/notes/oop/object-equality-and-copying) goes deeper into shallow and deep copies.

Here are all three, plus a static counter of how many students have been created:

```cpp
#include <iostream>
#include <string>
using namespace std;

class Student {
    string name;
    int roll;
    static int count;  // one copy shared by every Student
public:
    Student() : name("Unknown"), roll(0) { count++; }                    // default
    Student(string name, int roll) : name(name), roll(roll) { count++; }  // parameterised
    Student(const Student& other) : name(other.name), roll(other.roll) { count++; }  // copy

    void rename(const string& name) { this->name = name; }  // this-> is the field
    void describe() const { cout << roll << " " << name << "\n"; }
    static int created() { return count; }  // no this: belongs to the class
};

int Student::count = 0;  // the static member is defined once, outside the class

int main() {
    Student a;               // default constructor
    Student b("Meera", 42);  // parameterised constructor
    Student c = b;           // copy constructor
    c.rename("Meera (copy)");

    a.describe();
    b.describe();
    c.describe();
    cout << "Students created: " << Student::created() << "\n";
    return 0;
}
```

```java
class Student {
    private String name;
    private int roll;
    private static int count = 0;  // one copy shared by every Student

    Student() { this("Unknown", 0); }  // default: delegates to the parameterised one

    Student(String name, int roll) {   // parameterised
        this.name = name;              // this.name is the field, name the parameter
        this.roll = roll;
        count++;
    }

    Student(Student other) { this(other.name, other.roll); }  // copy constructor, by convention

    void rename(String name) { this.name = name; }
    void describe() { System.out.println(roll + " " + name); }
    static int created() { return count; }  // no this: belongs to the class
}

public class Main {
    public static void main(String[] args) {
        Student a = new Student();              // default constructor
        Student b = new Student("Meera", 42);   // parameterised constructor
        Student c = new Student(b);             // copy constructor
        c.rename("Meera (copy)");

        a.describe();
        b.describe();
        c.describe();
        System.out.println("Students created: " + Student.created());
    }
}
```

```python
class Student:
    count = 0  # class attribute: one copy shared by every Student

    def __init__(self, name="Unknown", roll=0):  # default and parameterised in one
        self.name = name
        self.roll = roll
        Student.count += 1  # not self.count += 1, which would make an instance attribute

    @classmethod
    def copy_of(cls, other):  # Python has no copy constructor; a class method plays the part
        return cls(other.name, other.roll)

    def rename(self, name):
        self.name = name

    def describe(self):
        print(f"{self.roll} {self.name}")

    @staticmethod
    def created():  # no self: belongs to the class
        return Student.count


a = Student()             # "default"
b = Student("Meera", 42)  # parameterised
c = Student.copy_of(b)    # copy
c.rename("Meera (copy)")

a.describe()
b.describe()
c.describe()
print(f"Students created: {Student.created()}")
```

```javascript
class Student {
  static count = 0; // one copy shared by every Student

  constructor(name = "Unknown", roll = 0) { // default and parameterised in one
    this.name = name;
    this.roll = roll;
    Student.count++;
  }

  static copyOf(other) { return new Student(other.name, other.roll); } // no copy constructors in JS

  rename(name) { this.name = name; }
  describe() { console.log(`${this.roll} ${this.name}`); }
  static created() { return Student.count; } // no this object needed
}

const a = new Student();            // "default"
const b = new Student("Meera", 42); // parameterised
const c = Student.copyOf(b);        // copy
c.rename("Meera (copy)");

a.describe();
b.describe();
c.describe();
console.log(`Students created: ${Student.created()}`);
```

```output
0 Unknown
42 Meera
42 Meera (copy)
Students created: 3
```

Two details worth saying in an interview. Java's `this("Unknown", 0)` and C++'s delegating constructors (`Student() : Student("Unknown", 0) {}`, since C++11) let one constructor reuse another, so the validation lives in one place. And Python splits creation in two: `__new__` allocates and returns the new object, then `__init__` initialises it. You almost never override `__new__`; it matters for immutable types and singletons.

## this and self

Inside a method, the object the method was called on is available as `this` (C++, Java, JavaScript) or `self` (Python). Its main uses:

- **Telling a field from a parameter** with the same name: `this.name = name`.
- **Passing the current object** to another object: `registry.add(this)`.
- **Returning the object for chaining**: `return *this;` in C++ or `return this;` in Java lets you write `builder.setA(1).setB(2)`.
- **Calling another constructor**: `this(...)` in Java.

In C++, `this` is a pointer, so you write `this->name`; inside a `const` method it points to a `const` object. In Python `self` is not a keyword at all — it is simply the first parameter, and `b.describe()` is shorthand for `Student.describe(b)`. Static methods have no `this` or `self`, which is why they cannot read instance fields.

## Static members

A **static field** has one copy for the whole class instead of one per object — a counter of objects created, a shared configuration value, a cache. A **static method** belongs to the class and is called through it: `Student.created()`, `Math.max(a, b)`.

- **C++**: declare `static int count;` inside the class and define it once outside (`int Student::count = 0;`), or write `inline static int count = 0;` since C++17.
- **Java**: `static` fields and methods; a `static { ... }` block runs once when the class is initialised. Static methods are not overridden — a subclass's static method with the same signature *hides* the parent's.
- **Python**: a variable in the class body is a class attribute. `@staticmethod` receives neither object nor class; `@classmethod` receives the class as `cls`, so it works correctly for subclasses and is the usual way to write alternative constructors.

The classic Python trap is `self.count += 1`. It reads the class attribute but then *assigns* a new instance attribute on that one object, so the shared counter never changes. Write `Student.count += 1` (or `type(self).count += 1`).

## Object lifecycle

Every object goes through the same stages:

1. **Allocation** — memory for the fields is reserved (stack or heap).
2. **Initialisation** — the constructor runs.
3. **Use** — methods are called on it.
4. **End of life** — in C++, the scope ends or `delete` is called; in Java and Python, the object becomes unreachable.
5. **Clean-up and deallocation** — a destructor or finaliser may run, then the memory is returned.

Steps 4 and 5 are where the languages differ most:

| | C++ | Java | Python (CPython) |
| --- | --- | --- | --- |
| Clean-up hook | Destructor `~ClassName()` | None in practice: `finalize()` is deprecated for removal since Java 18 | `__del__` finaliser |
| When it runs | Exactly when the lifetime ends | The garbage collector decides; possibly never | When the reference count reaches zero; objects in cycles wait for the cycle collector |
| Deterministic? | Yes | No | For non-cyclic objects in CPython, but the language does not promise it |
| How to release files and locks | RAII: the destructor releases | `try`-with-resources and `AutoCloseable` | `with` and a context manager |

C++ destructors run in the **reverse order of construction**, which is what makes them safe for releasing resources. This program traces every construction and destruction:

```cpp
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Tracer {
    string name;
public:
    Tracer(string n) : name(n) { cout << "construct " << name << "\n"; }
    ~Tracer() { cout << "destroy " << name << "\n"; }
};

Tracer global("global");  // static storage: built before main, destroyed after it

int main() {
    cout << "main starts\n";
    Tracer a("a");
    {
        Tracer b("b");
        Tracer c("c");
        cout << "inner scope ends\n";
    }  // c, then b: reverse order of construction

    Tracer* raw = new Tracer("heap");                  // heap: lives until delete
    unique_ptr<Tracer> owned = make_unique<Tracer>("owned");  // freed by its owner
    delete raw;
    cout << "main ends\n";
    return 0;
}  // owned, then a; global after main returns
```

```output
construct global
main starts
construct a
construct b
construct c
inner scope ends
destroy c
destroy b
construct heap
construct owned
destroy heap
main ends
destroy owned
destroy a
destroy global
```

Had the program forgotten `delete raw`, "destroy heap" would never print: a raw heap object is a memory leak until someone deletes it. That is why modern C++ wraps heap objects in `unique_ptr` or `shared_ptr`, whose destructors do the `delete`. Java and Python cannot show this trace reliably, which is exactly the point — their clean-up is not tied to a line of code. The Java and Python answers for deterministic clean-up are covered in [Exception Handling in OOP](/notes/oop/exception-handling).

## Stack vs heap: what a variable holds

The most useful mental model for interviews is not "stack or heap" but **what does the variable hold — the object, or a reference to it?**

| | C++ | Java | Python |
| --- | --- | --- | --- |
| Where objects live | Stack (locals), heap (`new`) or static storage | Heap (the language model; the JIT may optimise some allocations away) | Heap |
| What an object variable holds | The object itself, unless declared as a pointer or reference | A reference; primitives such as `int` hold the value | A reference: a name bound to an object |
| What `b = a` does | Copies the whole object | Copies the reference | Binds a second name to the same object |
| Who frees memory | Scope exit for locals; `delete` or a smart pointer for heap objects | Garbage collector | Reference counting plus a cycle collector |

So `b = a` means two very different things. In Java and Python it gives you two names for one object; in C++ it gives you two objects. The C++ program below uses a reference (`Point&`) to get Java-style sharing, then a plain variable to get a copy:

```cpp
#include <iostream>
using namespace std;

struct Point { int x, y; };

int main() {
    Point a{1, 2};
    Point& b = a;  // b is another name for a: what Java and Python variables do
    b.x = 10;
    cout << "after b.x = 10: a.x = " << a.x << "\n";

    Point c = a;   // a C++ variable holds the object itself, so this copies it
    c.x = 99;
    cout << "after c.x = 99: a.x = " << a.x << ", c.x = " << c.x << "\n";
    return 0;
}
```

```java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    Point(Point other) { this(other.x, other.y); }  // a real copy must be written
}

public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);  // a holds a reference; the object is on the heap
        Point b = a;                // copies the reference: one object, two names
        b.x = 10;
        System.out.println("after b.x = 10: a.x = " + a.x);

        Point c = new Point(a);     // a second, independent object
        c.x = 99;
        System.out.println("after c.x = 99: a.x = " + a.x + ", c.x = " + c.x);
    }
}
```

```python
import copy


class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y


a = Point(1, 2)
b = a  # a second name for the same object
b.x = 10
print(f"after b.x = 10: a.x = {a.x}")

c = copy.copy(a)  # a second, independent object
c.x = 99
print(f"after c.x = 99: a.x = {a.x}, c.x = {c.x}")
```

```javascript
class Point {
  constructor(x, y) { this.x = x; this.y = y; }
}

const a = new Point(1, 2);
const b = a; // a second name for the same object
b.x = 10;
console.log(`after b.x = 10: a.x = ${a.x}`);

const c = new Point(a.x, a.y); // a second, independent object
c.x = 99;
console.log(`after c.x = 99: a.x = ${a.x}, c.x = ${c.x}`);
```

```output
after b.x = 10: a.x = 10
after c.x = 99: a.x = 10, c.x = 99
```

The same rule explains parameter passing. Java and Python pass the reference *by value*: a method can change the object it was given, but assigning a new object to the parameter does not affect the caller's variable. C++ copies the whole object unless the parameter is a reference (`const Student&`) or a pointer.

## Common mistakes

- Writing a return type on a constructor (`void Student()` in Java), which turns it into an ordinary method.
- Declaring a parameterised constructor and then calling `new Student()`, expecting the default one to still exist.
- Using `self.count += 1` for a shared counter in Python, which creates an instance attribute instead.
- Expecting Java's `finalize()` or Python's `__del__` to run at a predictable time; use try-with-resources or `with`.
- Forgetting that `b = a` in C++ copies the object, while in Java and Python it only copies the reference.
- Taking a C++ copy constructor's parameter by value instead of `const T&`.

## Interview questions

**What is the difference between a constructor and a method?**
A constructor has no return type, is called automatically exactly once when the object is created, and exists to initialise it. A method has a return type and can be called any number of times on an existing object. Constructors are also not inherited in Java; C++ can opt in with `using Base::Base;`.

**Why must a C++ copy constructor take its argument by reference?**
Passing an object by value itself calls the copy constructor, so a copy constructor that took its argument by value would have to call itself to receive the argument, without end. The language therefore rejects that signature. The parameter is `const T&` so it can also accept temporaries and const objects.

**When does C++ call the copy constructor, and when the copy assignment operator?**
The copy constructor runs when a new object is initialised from an existing one: `Student c = b;`, `Student c(b);`, passing by value, and returning by value when the copy is not elided. The copy assignment operator runs when an already existing object is overwritten: `c = b;` on a `c` that was constructed earlier.

**Can a constructor be private? Why would you do that?**
Yes, in C++ and Java. A private constructor stops other code from creating objects directly, which is how a Singleton controls its single instance, how a class forces callers through a static factory method, and how a utility class such as one holding only static methods prevents instantiation.

**What is the size of an object of an empty class in C++?**
It is at least 1 byte, never 0, so that two distinct objects always have distinct addresses. When an empty class is used as a base class, the compiler may give it zero bytes inside the derived object (the empty base optimisation).

**Does Java have destructors? What replaces them?**
No. The garbage collector frees memory at a time of its choosing, and `finalize()` was deprecated in Java 9 and deprecated for removal in Java 18. For files, sockets and locks, implement `AutoCloseable` and use try-with-resources; `java.lang.ref.Cleaner` exists as a last-resort safety net.

**What is the difference between `__new__` and `__init__` in Python?**
`__new__` is a static method that creates and returns the new instance; `__init__` receives that instance as `self` and initialises it, returning nothing. You override `__new__` only when you must control creation itself — subclassing an immutable type like `tuple`, or returning an existing instance.

**What is the difference between a class method and a static method in Python?**
A `@classmethod` receives the class as its first argument (`cls`), so `cls(...)` builds an object of whichever subclass it was called on — ideal for alternative constructors. A `@staticmethod` receives nothing extra; it is a plain function kept in the class's namespace.

Next, read [Encapsulation](/notes/oop/encapsulation), then check yourself with the [OOP Basic skill test](/skill-tests/oop-basic).

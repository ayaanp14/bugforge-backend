---
title: Object Equality, Hashing and Copying
order: 10
minutes: 16
level: advanced
updated: 2026-10-05
seo-title: equals vs ==, hashCode, Shallow vs Deep Copy in OOP
description: Object identity vs equality in OOP: == vs equals in Java, == vs is in Python, operator== in C++, the equals/hashCode contract, and shallow vs deep copy.
question: What is the difference between object identity and object equality?
answer: Identity asks whether two references point to the very same object; equality asks whether two possibly different objects hold the same value. Java tests identity with == and equality with equals(), Python uses is and ==, and C++ compares addresses for identity and calls operator== for value. A class that defines equality must define a matching hash code too.
q: What is the difference between == and equals() in Java?
a: For objects, == compares references: it is true only when both sides are the same object. equals() compares values as the class defines them; Object's default equals() is also identity, so a class must override it to compare fields. String, Integer and the collections override it, which is why strings are compared with equals().
q: Why must hashCode be overridden when equals is overridden?
a: Hash-based collections such as HashMap and HashSet find an object by its hash code first and only then call equals. If two equal objects return different hash codes, they land in different buckets and the collection never compares them, so contains() returns false for an object that is equal to one already stored.
q: What is the difference between a shallow copy and a deep copy?
a: A shallow copy creates a new object but copies each field as it is, so fields that refer to other objects, such as a list, still point at the same objects as the original. A deep copy also copies those referenced objects, recursively, so the copy and the original share nothing mutable.
q: What is the difference between == and is in Python?
a: The is operator checks identity: whether both names refer to the same object. The == operator checks equality by calling __eq__, which compares values when the class defines it and falls back to identity otherwise. Use is for None and for deliberate identity checks, and == for comparing values.
q: Why is Integer 127 == 127 true but 128 == 128 false in Java?
a: Autoboxing uses Integer.valueOf, which returns cached objects for values from -128 to 127, so two boxed 127s are the same object and == is true. Values outside the cache get new objects, so == compares two different references and is false. Compare boxed numbers with equals() or unbox them first.
q: How do you deep copy an object in Java?
a: Write a copy constructor or static factory that copies every mutable field, recursively creating new lists, arrays and nested objects. Overriding clone() to do the same also works, but Object.clone() on its own is shallow. Serialising and deserialising the object makes a deep copy too, but it is slow and needs every class to be Serializable.
---
Two of the most common bugs in object-oriented code look identical on the surface: a set that "contains" an object yet says it does not, and a copy that changes when you edit the original. Both come from mixing up **what an object is** (its identity) with **what it holds** (its value). This note pins down identity versus equality in C++, Java and Python, the contract between equality and hashing that every hash-based collection relies on, and the difference between shallow and deep copies — including how C++ copy constructors and assignment operators must be written when a class owns memory. It assumes [Classes and Objects](/notes/oop/classes-and-objects), especially what a variable holds in each language.

## Identity vs equality

- **Identity**: are these two references the *same object*? There is one object, reached by two names.
- **Equality**: do these two objects have the *same value*? There may be two separate objects that are interchangeable for the program's purposes, like two `Point(1, 2)`s.

| Language | Same object? | Same value? | Default equality for your class |
| --- | --- | --- | --- |
| Java | `a == b` | `a.equals(b)` | `Object.equals` is identity |
| Python | `a is b` | `a == b`, which calls `__eq__` | Identity |
| C++ | `&a == &b` (compare addresses) | `a == b`, which calls `operator==` | None: `==` does not compile until you define it (C++20 can `= default` it) |
| JavaScript | `a === b` | No built-in protocol; write an `equals` method | Identity |

Two Java traps follow from `==` meaning identity. String literals are **interned** — one shared object per distinct literal — so `"hi" == "hi"` is true, while `new String("hi") == "hi"` is false; always compare strings with `equals`. And boxed integers from -128 to 127 come from a cache, so `Integer a = 127, b = 127; a == b` is true but the same with 128 is false. Python has a similar implementation detail — CPython caches small integers — which is why `is` should be used only for `None` and genuine identity checks.

@figure identity

## Defining equality

A class that represents a **value** (a point, a money amount, a date) should define equality on its significant fields. Java's `equals` contract requires the relation to be:

- **reflexive** — `x.equals(x)` is true;
- **symmetric** — `x.equals(y)` exactly when `y.equals(x)`;
- **transitive** — if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`;
- **consistent** — repeated calls give the same answer while the objects are unchanged;
- and `x.equals(null)` is **false**.

The usual recipe: return true for the same reference; return false for `null` or a different class; then compare the significant fields. Using `getClass() != o.getClass()` keeps symmetry safe when subclasses add fields; `instanceof` lets subclasses compare equal to their parent but can break symmetry if a subclass overrides `equals`. Java 16 **records** generate a correct `equals`, `hashCode` and `toString` from their components. Python's `@dataclass` generates `__eq__`; a hand-written `__eq__` should return `NotImplemented` for types it does not understand, so Python can try the other operand.

## The hashCode contract

Hash tables — `HashMap`, `HashSet`, Python's `dict` and `set`, C++'s `unordered_map` — find an object in two steps: the **hash code** picks a bucket, then **equality** confirms the match among the objects in that bucket. That only works if the two agree:

1. **Equal objects must have equal hash codes.** Break this, and an equal object is looked for in the wrong bucket and never found.
2. A hash code must stay the same while the object's fields are unchanged.
3. Unequal objects **may** share a hash code — a collision. It is legal but slows lookups. `"Aa"` and `"BB"` have the same `String.hashCode()`, 2112.

@figure hash-lookup

Build the hash from exactly the fields that `equals` compares — `Objects.hash(x, y)` in Java, `hash((self.x, self.y))` in Python. The program below defines both and shows that a hash set treats two separate but equal points as one element:

```cpp
#include <functional>
#include <iostream>
#include <unordered_set>
using namespace std;

struct Point {
    int x, y;
    bool operator==(const Point& o) const { return x == o.x && y == o.y; }  // value equality
};

struct PointHash {  // equal points must produce equal hashes
    size_t operator()(const Point& p) const { return hash<int>()(p.x) * 31 + hash<int>()(p.y); }
};

int main() {
    Point p{1, 2}, q{1, 2};
    cout << "same object: " << (&p == &q ? "yes" : "no") << "\n";
    cout << "equal values: " << (p == q ? "yes" : "no") << "\n";
    unordered_set<Point, PointHash> seen;
    seen.insert(p);
    cout << "set contains an equal point: " << (seen.count(q) ? "yes" : "no") << "\n";
    seen.insert(q);
    cout << "set size after adding both: " << seen.size() << "\n";
    return 0;
}
```

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

final class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                                 // same reference
        if (o == null || getClass() != o.getClass()) return false;  // null or another class
        Point p = (Point) o;
        return x == p.x && y == p.y;                                // significant fields
    }

    @Override
    public int hashCode() { return Objects.hash(x, y); }  // the same fields as equals
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point(1, 2), q = new Point(1, 2);
        System.out.println("same object: " + (p == q ? "yes" : "no"));
        System.out.println("equal values: " + (p.equals(q) ? "yes" : "no"));
        Set<Point> seen = new HashSet<>();
        seen.add(p);
        System.out.println("set contains an equal point: " + (seen.contains(q) ? "yes" : "no"));
        seen.add(q);
        System.out.println("set size after adding both: " + seen.size());
    }
}
```

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented  # let Python try the other operand
        return (self.x, self.y) == (other.x, other.y)

    def __hash__(self):  # required: defining __eq__ alone makes the class unhashable
        return hash((self.x, self.y))


p, q = Point(1, 2), Point(1, 2)
print(f"same object: {'yes' if p is q else 'no'}")
print(f"equal values: {'yes' if p == q else 'no'}")
seen = {p}
print(f"set contains an equal point: {'yes' if q in seen else 'no'}")
seen.add(q)
print(f"set size after adding both: {len(seen)}")
```

```output
same object: no
equal values: yes
set contains an equal point: yes
set size after adding both: 1
```

What happens when the contract is broken differs by language. In Java, overriding only `equals` compiles fine and fails quietly: `contains` usually returns false and a set can hold "duplicates". Python is stricter: a class that defines `__eq__` without `__hash__` has its `__hash__` set to `None`, so it cannot be put in a set or used as a dict key at all:

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)


print(f"__hash__ is None: {Point.__hash__ is None}")
try:
    {Point(1, 2)}
except TypeError as e:
    print(f"TypeError: {e}")
```

```output
__hash__ is None: True
TypeError: unhashable type: 'Point'
```

One more rule follows: **do not mutate an object while it is a key** in a hash map or an element of a hash set. Its hash changes, it now sits in the wrong bucket, and the collection can no longer find it. Immutable keys avoid the problem entirely.

## Shallow vs deep copy

A **shallow copy** is a new object whose fields are copied as they are. A field holding a number or an immutable string is effectively independent; a field holding a *reference* to a mutable object — a list, an array, another object — still points at the same object as the original. A **deep copy** also copies those referenced objects, recursively, so nothing mutable is shared.

| Language | Shallow copy | Deep copy |
| --- | --- | --- |
| Java | `Object.clone()` (field by field); a copy constructor that copies references | A copy constructor or `clone()` that also copies mutable fields |
| Python | `copy.copy(obj)`, `list(xs)`, `xs[:]`, `d.copy()` | `copy.deepcopy(obj)` |
| C++ | Members that are pointers are copied as addresses | Members with value semantics (`std::vector`, `std::string`) copy their contents; raw owning pointers need a user-written copy constructor |
| JavaScript | `{ ...obj }`, `Object.assign`, `arr.slice()` | `structuredClone` (Node 17 and later), or copy nested parts by hand |

The program makes a shallow and a deep copy of a team, then changes each copy. Note the difference between **mutating** a shared list (visible through the original) and **reassigning** a field on the copy (not visible):

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

string joined(const vector<string>& v) {
    string out;
    for (size_t i = 0; i < v.size(); i++) out += (i ? ", " : "") + v[i];
    return out;
}

struct Team {
    string name;
    shared_ptr<vector<string>> players;  // a pointer member: copying a Team shares the list
    Team deepCopy() const { return Team{name, make_shared<vector<string>>(*players)}; }
};

int main() {
    Team original{"Blue", make_shared<vector<string>>(vector<string>{"Asha", "Ravi"})};

    Team shallow = original;  // the default copy copies the pointer, not the list
    shallow.players->push_back("Kiran");
    shallow.name = "Red";     // reassigning the copy's own field
    cout << "original after shallow.players gains Kiran: " << joined(*original.players) << "\n";
    cout << "original name after shallow is renamed: " << original.name << "\n";

    Team deep = original.deepCopy();
    deep.players->push_back("Meera");
    cout << "original after deep.players gains Meera: " << joined(*original.players) << "\n";
    cout << "deep copy: " << joined(*deep.players) << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Team implements Cloneable {
    String name;
    List<String> players;

    Team(String name, List<String> players) { this.name = name; this.players = players; }
    Team(Team other) { this(other.name, new ArrayList<>(other.players)); }  // deep: copies the list

    @Override
    public Team clone() {  // Object.clone copies field by field: shallow
        try { return (Team) super.clone(); }
        catch (CloneNotSupportedException e) { throw new AssertionError(e); }
    }
}

public class Main {
    public static void main(String[] args) {
        Team original = new Team("Blue", new ArrayList<>(List.of("Asha", "Ravi")));

        Team shallow = original.clone();
        shallow.players.add("Kiran");
        shallow.name = "Red";  // reassigning the copy's own field
        System.out.println("original after shallow.players gains Kiran: " + String.join(", ", original.players));
        System.out.println("original name after shallow is renamed: " + original.name);

        Team deep = new Team(original);
        deep.players.add("Meera");
        System.out.println("original after deep.players gains Meera: " + String.join(", ", original.players));
        System.out.println("deep copy: " + String.join(", ", deep.players));
    }
}
```

```python
import copy


class Team:
    def __init__(self, name, players):
        self.name = name
        self.players = players


original = Team("Blue", ["Asha", "Ravi"])

shallow = copy.copy(original)  # new Team, same list object
shallow.players.append("Kiran")
shallow.name = "Red"  # reassigning the copy's own field
print(f"original after shallow.players gains Kiran: {', '.join(original.players)}")
print(f"original name after shallow is renamed: {original.name}")

deep = copy.deepcopy(original)  # new Team and a new list
deep.players.append("Meera")
print(f"original after deep.players gains Meera: {', '.join(original.players)}")
print(f"deep copy: {', '.join(deep.players)}")
```

```javascript
const original = { name: "Blue", players: ["Asha", "Ravi"] };

const shallow = { ...original }; // new object, same array
shallow.players.push("Kiran");
shallow.name = "Red"; // reassigning the copy's own field
console.log(`original after shallow.players gains Kiran: ${original.players.join(", ")}`);
console.log(`original name after shallow is renamed: ${original.name}`);

const deep = { ...original, players: [...original.players] }; // copy the nested array too
deep.players.push("Meera");
console.log(`original after deep.players gains Meera: ${original.players.join(", ")}`);
console.log(`deep copy: ${deep.players.join(", ")}`);
```

```output
original after shallow.players gains Kiran: Asha, Ravi, Kiran
original name after shallow is renamed: Blue
original after deep.players gains Meera: Asha, Ravi, Kiran
deep copy: Asha, Ravi, Kiran, Meera
```

@figure shallow-deep

`copy.deepcopy` keeps a memo of objects already copied, so two fields pointing at one object still point at one (new) object in the copy, and cyclic structures do not recurse forever.

## Copy constructors and assignment in C++

In C++, `Team b = a;` calls the **copy constructor** (a new object is being created), while `b = a;` on an existing `b` calls the **copy assignment operator**. The compiler generates both, copying member by member. That is correct for members such as `std::vector` and `std::string`, which copy their own contents — but wrong for a class that owns a raw pointer: both objects would point at one array, and both destructors would free it.

The **rule of three**: if a class needs a user-written destructor, copy constructor or copy assignment operator, it almost certainly needs all three. C++11 extends it to the **rule of five** by adding the move constructor and move assignment. The **rule of zero** is the modern advice: hold resources in members that manage themselves (`std::vector`, `std::unique_ptr`) and write none of them.

The **copy-and-swap** idiom writes the assignment operator once, safely: take the parameter by value (the copy constructor makes the copy), swap its contents into `*this`, and let the parameter's destructor free the old data. It handles self-assignment and gives the strong exception guarantee, because nothing in `*this` changes until the copy has succeeded.

```cpp
#include <algorithm>
#include <iostream>
#include <utility>
using namespace std;

class Buffer {  // owns a heap array, so it defines its own copying (rule of three)
    size_t n;
    int* data;
public:
    explicit Buffer(size_t n) : n(n), data(new int[n]()) {}
    Buffer(const Buffer& o) : n(o.n), data(new int[o.n]) {  // copy constructor: a deep copy
        copy(o.data, o.data + n, data);
        cout << "copy constructor\n";
    }
    Buffer& operator=(Buffer o) {  // copy-and-swap: o is already a fresh copy
        swap(n, o.n);
        swap(data, o.data);
        cout << "copy assignment\n";
        return *this;
    }  // o's destructor frees the old array
    ~Buffer() { delete[] data; }
    int& operator[](size_t i) { return data[i]; }
};

int main() {
    Buffer a(3);
    a[0] = 7;
    Buffer b = a;  // copy constructor: b is a new object
    b[0] = 99;     // does not touch a
    Buffer c(1);
    c = a;         // copy assignment; its by-value parameter is built by the copy constructor
    c = c;         // self-assignment is safe with copy-and-swap
    cout << "a[0] = " << a[0] << ", b[0] = " << b[0] << ", c[0] = " << c[0] << "\n";
    return 0;
}
```

```output
copy constructor
copy constructor
copy assignment
copy constructor
copy assignment
a[0] = 7, b[0] = 99, c[0] = 7
```

@figure copy-and-swap

## Immutability makes copying unnecessary

An immutable object can be shared freely: nobody can change it, so there is nothing to protect with a copy. Java's `String` and `Integer`, Python's `str`, `int` and `frozenset`, and Java records holding immutable fields are all safe to share and safe as hash keys. Watch for *shallow* immutability: a Python `tuple` holding a `list`, or a `final` Java field holding an `ArrayList`, can still change inside. [Encapsulation](/notes/oop/encapsulation) shows how to build immutable classes with defensive copies.

## Common mistakes

- Comparing Java strings or boxed numbers with `==` instead of `equals`.
- Overriding `equals` without `hashCode` (Java) or `__eq__` without `__hash__` (Python).
- Writing `equals(Point other)` in Java, which overloads instead of overriding `equals(Object)`; `@Override` catches it.
- Using a mutable object as a hash key and changing it afterwards.
- Assuming `clone()` or `copy.copy` copies nested lists; both are shallow.
- Giving a C++ class that owns a raw pointer a destructor but no copy constructor or assignment operator.

## Interview questions

**What happens if you override equals but not hashCode in Java?**
The code compiles, but hash-based collections misbehave: two equal objects almost always have different identity-based hash codes, so `HashSet.contains` and `HashMap.get` look in the wrong bucket and miss. A set can then hold two "equal" elements. Overriding both, from the same fields, fixes it.

**Can two unequal objects have the same hash code?**
Yes; that is a collision, and the contract allows it. Hash codes are 32-bit integers, so collisions are unavoidable — `"Aa"` and `"BB"` share `String.hashCode()` 2112. Collisions only cost speed, because the collection then calls `equals` to tell the objects apart.

**Should equals use getClass() or instanceof?**
`getClass()` treats objects of different classes as unequal, which keeps `equals` symmetric when a subclass adds fields. `instanceof` lets a subclass instance equal a parent instance, which is right when subclasses add no state that matters for equality, but it breaks symmetry if a subclass also overrides `equals`. Making value classes `final` avoids the question.

**Why is clone() considered a poor way to copy in Java?**
`Cloneable` has no `clone` method of its own, `Object.clone()` is protected, shallow and throws a checked exception, and it bypasses constructors, so it cannot assign `final` fields a new deep copy. *Effective Java* recommends a copy constructor or copy factory instead.

**When does a C++ class need a user-defined copy constructor?**
When member-by-member copying is wrong — typically when the class owns a resource through a raw pointer or handle. The default copy would make two objects share one resource and free it twice. By the rule of three, such a class also needs a destructor and a copy assignment operator, and under C++11 usually move operations as well.

**Why is a mutable object a dangerous HashMap key?**
The map stores the key in the bucket chosen by its hash code at insertion time. If a field that feeds the hash changes, lookups compute a different bucket and the entry is effectively lost while still taking up space. Use immutable keys, or never change a key while it is in the map.

**How does Python's deepcopy handle shared references and cycles?**
It keeps a memo dictionary from each original object's id to its copy. When it meets an object it has already copied, it reuses that copy, so shared structure stays shared in the copy and a cycle ends instead of recursing forever. Classes can customise the process with `__deepcopy__`.

**Why can == on two Java strings sometimes be true?**
String literals and compile-time constant expressions are interned, so every occurrence of the same literal refers to one shared object, and `==` happens to see the same reference. Strings built at run time, read from input or created with `new String`, are separate objects. Relying on this is a bug; use `equals`.

Next, read [Exception Handling in OOP](/notes/oop/exception-handling), then check yourself with the [OOP Intermediate skill test](/skill-tests/oop-intermediate).

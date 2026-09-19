---
title: Inheritance basics — subclasses, super() and attribute lookup
minutes: 14
---
Inheritance lets a class start from another: `class Dog(Animal)` gives `Dog` every attribute and method of `Animal` and lets it add or replace what differs. Python's version is simple in mechanism — attribute lookup walks from the instance to its class to the base classes — and the only real subtlety is initialisation: a subclass's `__init__` replaces the base's, so it must call `super().__init__()` explicitly or the base's attributes never exist. This lesson covers the syntax, what is inherited, overriding and extending, `super()`, `isinstance`/`issubclass`, the lookup order, and the `object` root that everything descends from.

## The statement

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name} says {self.speak()}"

class Dog(Animal):
    def speak(self):                    # override
        return "woof"

class Puppy(Dog):
    def __init__(self, name, age_weeks):
        super().__init__(name)          # extend: run the base initialiser, then add
        self.age_weeks = age_weeks

    def describe(self):                 # extend a method
        return super().describe() + f" (aged {self.age_weeks} weeks)"

p = Puppy("rex", 8)
p.describe()          # 'rex says woof (aged 8 weeks)'
```

`class Dog(Animal):` names the base in parentheses. `Dog` inherits `__init__`, `describe` and `name`; it overrides `speak`. `describe` in the base calls `self.speak()`, and `self` is a `Dog`, so the *override* runs — that is polymorphism, and it needs nothing declared: every method is virtual.

## What is inherited

Everything in the class namespace: methods, class attributes, properties, dunders, class methods and static methods. Instance attributes are not "inherited" in the same sense — they are created by whichever `__init__` runs, which is why a subclass that defines its own `__init__` must call the base's, or `self.name` is never set and the first `describe()` fails with `AttributeError`.

## super()

`super()` returns a proxy that looks up attributes starting *after the current class* in the method resolution order (next lesson but one). `super().__init__(name)` calls `Animal.__init__` with `self` bound automatically; `super().describe()` calls the base version of a method you are extending. Two rules. Call `super().__init__()` **first** in a subclass initialiser unless there is a reason not to, so the base's attributes exist before your code uses them. And pass the base what it expects — its parameters, not yours: `Puppy.__init__` takes `(name, age_weeks)` and forwards only `name`.

The old spelling `Animal.__init__(self, name)` works but hard-codes the base; `super()` follows the MRO and survives refactoring and multiple inheritance.

## Attribute lookup

`p.describe` is resolved by searching, in order: `p.__dict__` (instance), `Puppy.__dict__`, `Dog.__dict__`, `Animal.__dict__`, `object.__dict__`. The first hit wins. That order — the class's `__mro__` — is what makes overriding work (the subclass is searched first) and what makes an instance attribute shadow a class attribute of the same name. `type(p)` is `Puppy`; `Puppy.__bases__` is `(Dog,)`; `Puppy.__mro__` is `(Puppy, Dog, Animal, object)`.

## isinstance and issubclass

```python
isinstance(p, Puppy)          # True
isinstance(p, Animal)         # True — an instance of a subclass is an instance of the base
isinstance(p, (Dog, int))     # True — any of a tuple
issubclass(Puppy, Animal)     # True
type(p) is Animal             # False — type() is exact; isinstance respects inheritance
```

Use `isinstance`, not `type(x) == C`, when subclasses should count — which is almost always. `isinstance(True, int)` is `True` because `bool` subclasses `int`; `isinstance(3, float)` is `False`. Long `isinstance` chains that switch behaviour on the type are the thing polymorphism replaces (next lesson).

## The object root

Every class inherits from `object`, explicitly or not: `class A:` and `class A(object):` are the same in Python 3. `object` supplies the default `__init__` (no arguments), `__repr__`, `__eq__` (identity), `__hash__`, `__str__` (falls back to `__repr__`) and the machinery of attribute access. That is why a class with no methods at all can be instantiated, printed and compared.

## Overriding dunders and the repr

Overriding `__repr__` in a subclass usually means including the subclass's own fields; `type(self).__name__` makes a base-class repr correct for every subclass automatically:

```python
class Animal:
    def __repr__(self):
        return f"{type(self).__name__}({self.name!r})"
```

`Puppy("rex", 8)` then prints as `Puppy('rex')` without `Puppy` defining anything. The same trick works in `__eq__` (`isinstance(other, type(self))`) and in class-method constructors (`cls(...)`).

## Extending versus replacing

An override that does not call `super()` *replaces* the base behaviour; one that does *extends* it, before or after its own work. Both are legitimate, and the choice should be deliberate: `Cat.speak` replaces because the base answer is a placeholder, while `Puppy.describe` extends because the base text is still wanted. The trap is the accidental replacement — overriding a method that the base class relied on for bookkeeping (a `close()` that flushed, a `__setattr__` that validated) and dropping the call, so the base's invariant quietly stops being maintained.

## Inheriting from built-ins

`class Stack(list)` is tempting and usually wrong: `list` has forty methods that bypass your rules (`insert`, slicing assignment, `extend`), and its C implementation does not call your overridden `__setitem__` from `append`. Prefer composition — hold a list in an attribute and expose the operations you mean — or subclass `collections.UserList`/`UserDict`, which are written in Python and route everything through the basic methods (lesson 6).

## Pitfalls

- A subclass `__init__` that forgets `super().__init__()`, leaving base attributes unset.
- Calling `super().__init__()` with the subclass's extra arguments.
- `type(x) == C` where `isinstance` was meant.
- Overriding a method with a different signature, so code written for the base breaks on the subclass.
- Deep hierarchies for code reuse; three levels is a lot.
- Subclassing `dict`/`list` to add rules.

## Key takeaways

- `class Sub(Base)` inherits the base's namespace; a subclass overrides by redefining and extends by calling `super()`.
- A subclass `__init__` must call `super().__init__(...)` with the base's arguments, first.
- Lookup walks instance → class → bases → `object`; the first match wins, so overrides and shadowing follow.
- `isinstance` respects inheritance; `type()` is exact; `bool` is an `int`.
- Everything descends from `object`; use `type(self).__name__` in shared dunders; compose rather than subclass built-ins.

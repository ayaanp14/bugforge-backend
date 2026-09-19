---
title: Defining classes — __init__, self, attributes and methods
minutes: 14
---
A class bundles data and the functions that operate on it into one kind of object, and Python's version is unusually transparent: an instance is a dictionary of attributes with a pointer to its class, a method is an ordinary function whose first parameter receives the instance, and `self` is nothing more than the name that parameter is given by convention. Seeing that plainly removes most of the mystery. This lesson covers the `class` statement, `__init__`, instance versus class attributes and the trap between them, methods and how `obj.method()` becomes `Class.method(obj)`, and `__repr__` as the first dunder every class should have.

## The statement

```python
class Account:
    """A bank account with a balance that cannot go negative."""

    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

acct = Account("ada", 100)
acct.deposit(50)
acct.withdraw(30)
print(acct.balance)     # 120
```

`class Account:` creates a class object bound to the name `Account`. Calling it — `Account("ada", 100)` — creates a new, empty instance and then calls `__init__` with the instance as `self` and the arguments after it. `__init__` is not a constructor in the C++ sense (the object already exists; `__new__` made it — Module 16) but an *initialiser*: its job is to give the instance its attributes. It returns nothing.

Naming: classes are `PascalCase`, methods and attributes `snake_case`, and there is one blank line between methods, two between top-level definitions.

## self

`self` is the instance, passed automatically. `acct.deposit(50)` is exactly `Account.deposit(acct, 50)`: attribute lookup finds the function on the class, wraps it with the instance as a *bound method*, and the call fills in `self`. That is why every method's first parameter is `self`, why forgetting it produces `TypeError: deposit() takes 1 positional argument but 2 were given`, and why `self` could be named anything — it is a convention so strong that violating it reads as an error.

Inside a method, every attribute access goes through `self`: `self.balance`, `self.deposit(…)`. A bare `balance` would be a local variable of the method, unrelated to the instance — the most common beginner bug in a class.

## Instance attributes

Attributes are created by assignment, usually in `__init__`, and live in the instance's own dictionary:

```python
acct.__dict__          # {'owner': 'ada', 'balance': 120}
acct.nickname = "main" # a new attribute on this instance only — legal, and usually a smell
vars(acct)             # the same dict
```

Reading a missing attribute is `AttributeError`. Because attributes are per instance, two accounts have separate balances. The discipline is to create *every* attribute in `__init__`, even if only as `None` or an empty list, so that the instance's shape is visible in one place and no method can meet an attribute that has not been set yet.

## Class attributes — and the trap

An assignment in the class body (outside any method) creates a *class attribute*, shared by every instance:

```python
class Account:
    interest_rate = 0.02          # class attribute: one value for all accounts
    count = 0

    def __init__(self, owner):
        self.owner = owner
        Account.count += 1        # update the shared counter through the class
```

Reading `acct.interest_rate` finds nothing in the instance dict and falls through to the class. That is right for constants and defaults. It is wrong for a mutable default:

```python
class Team:
    members = []                  # ONE list shared by every Team

    def add(self, name):
        self.members.append(name) # every team sees every name

class Team:
    def __init__(self):
        self.members = []         # a fresh list per instance
```

The same lesson as the mutable default argument (Module 4): a mutable object created once in a class body is shared. Per-instance state belongs in `__init__`.

Assigning `acct.interest_rate = 0.05` creates an *instance* attribute that shadows the class one for that object only — the class value is unchanged. `Account.interest_rate = 0.05` changes it for every instance that has not shadowed it.

## Methods versus functions

A method is a function in the class body. Three consequences: it can be called on the class with an explicit instance (`Account.deposit(acct, 5)`); it can be stored and passed like any function (`f = acct.deposit; f(5)` — a bound method remembers its instance); and a function that does not use `self` at all is either a `@staticmethod` (Module 8 lesson 4) or does not belong in the class. Methods call other methods through `self`, and `__init__` may call them to set things up.

## __repr__ first

Every class should define `__repr__` before anything else, because the default `<__main__.Account object at 0x7f…>` tells you nothing in a traceback, a list, or a debug print:

```python
    def __repr__(self):
        return f"Account(owner={self.owner!r}, balance={self.balance})"
```

The convention is text that looks like the constructor call. `print(acct)` uses `__str__` if defined and falls back to `__repr__`; `print([acct])` always uses `__repr__` for the elements. The next lesson covers the rest of the dunders.

## Pitfalls

- Forgetting `self` in a method's parameter list, or writing `balance` for `self.balance`.
- A mutable class attribute used as per-instance state.
- Creating attributes outside `__init__` so the object's shape depends on which methods have run.
- `Account.deposit(50)` without an instance.
- Treating `__init__` as returning the object (`return self` in it is an error).
- Leaving the default `__repr__`.

## Key takeaways

- `class` creates a class object; calling it makes an instance and runs `__init__(self, …)` to set attributes.
- `obj.method(args)` is `Class.method(obj, args)`; `self` is the instance and every attribute access goes through it.
- Instance attributes live in `obj.__dict__`, created by assignment — all of them in `__init__`.
- Class-body assignments are shared class attributes: fine for constants, a bug for mutable state.
- Define `__repr__` to look like the constructor call; it is what tracebacks and containers show.

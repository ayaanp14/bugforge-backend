---
title: Polymorphism and duck typing — EAFP, hasattr and programming to behaviour
minutes: 13
---
"If it walks like a duck and quacks like a duck, it is a duck." Python does not ask an object what class it is before calling a method on it; it calls the method and either it works or it raises. That is *duck typing*, and it means polymorphism in Python needs no inheritance at all: any object with a `speak()` method can be passed to code that calls `speak()`. This lesson explains how that differs from class-based polymorphism, the EAFP style that goes with it (try the operation, handle the failure) versus LBYL (check first), the `hasattr`/`getattr` tools, the built-ins that are themselves duck-typed (`len`, `iter`, `sorted`), and where an explicit type check is still right.

## Polymorphism without inheritance

```python
class Dog:
    def speak(self):
        return "woof"

class Robot:                      # no common base class
    def speak(self):
        return "beep"

def chorus(things):
    return " ".join(t.speak() for t in things)

chorus([Dog(), Robot()])          # 'woof beep'
```

`chorus` is written against a *behaviour* — has a `speak()` — not a type. Java would need an interface both classes implement; Python needs only the method. The base class in the previous lesson gave `Dog` and `Puppy` a shared implementation to reuse, which is what inheritance is for; it was never needed for `chorus` to work.

The standard library is built this way. `len(x)` works on anything with `__len__`; `for x in y` on anything with `__iter__` or `__getitem__`; `with x:` on anything with `__enter__`/`__exit__`; `sorted(xs)` on anything whose elements have `__lt__`; `json.dump(obj, f)` on anything with a `write` method — a file, a socket wrapper, an `io.StringIO`. A function that accepts "a file-like object" means exactly that: anything with the methods it calls.

## EAFP versus LBYL

**Look Before You Leap** checks the precondition, then acts. **Easier to Ask Forgiveness than Permission** acts and handles the exception. Python idiom leans EAFP:

```python
if key in d:                  # LBYL: two lookups, and a race if d can change between them
    value = d[key]
else:
    value = default

try:                          # EAFP: one lookup, atomic, and the failure path is explicit
    value = d[key]
except KeyError:
    value = default
```

EAFP is preferred when the failure is *exceptional* (the key is usually there), when the check would duplicate the operation, or when the check cannot be made reliably (a file may vanish between `os.path.exists` and `open`). LBYL is preferred when the failure is *common* — a `try` that raises on half the iterations is slower than an `if` — and when the check is cheap and clear (`if not xs: return`). For the specific case above, `d.get(key, default)` beats both. Module 10 covers exception handling in full; the design point here is that duck typing and EAFP go together: you do not check whether the duck can quack, you ask it to.

## hasattr and getattr

When you genuinely need to know whether an object offers a behaviour before committing to a path:

```python
if hasattr(obj, "close"):
    obj.close()

write = getattr(stream, "write", None)
if write is not None:
    write(text)

callable(obj)                    # has __call__
```

`getattr(obj, name, default)` returns the attribute or the default without raising; `hasattr` is `getattr` with a boolean result. These are the duck-typed versions of an `isinstance` check — they ask about capability, not lineage — and they are right for optional protocols: "flush if it can be flushed". A run of `hasattr` checks that dispatches to different code paths is still a type switch in disguise, and the same remedy applies: give each object a method and call it.

## The isinstance chain, and its replacement

```python
def area(shape):                          # the anti-pattern
    if isinstance(shape, Circle):
        return 3.14159 * shape.r ** 2
    elif isinstance(shape, Rect):
        return shape.w * shape.h
    ...

class Circle:                             # the replacement: each type knows its own area
    def area(self):
        return 3.14159 * self.r ** 2

def total_area(shapes):
    return sum(s.area() for s in shapes)
```

Adding a `Triangle` to the chain means editing `area`; adding it to the second design means writing one class. That is the Open/Closed idea in its Python form: behaviour lives with the data it belongs to, and the code that uses it never needs to know the list of types. When the set of types is closed and the operation does not belong to the types (formatting a value for output, say), `functools.singledispatch` (Module 11) or a `match` on class patterns (Module 3) is the honest way to write the switch.

## When a type check is right

- **At a boundary**, validating input: `if not isinstance(n, int): raise TypeError(...)`.
- **In a dunder** deciding whether it can handle `other`: `if not isinstance(other, Money): return NotImplemented`.
- **Distinguishing text from a sequence of text**: a `str` is iterable, so `for item in value` on a string iterates characters — `isinstance(value, str)` is the standard guard in functions that accept "one or many".
- **Dispatching on data that is not yours**: JSON values, where `dict`/`list`/scalar have no methods to call.

Prefer `isinstance` against an abstract base or a protocol (next lessons) over a concrete class, so that anything with the behaviour qualifies.

## Pitfalls

- `isinstance` chains that switch behaviour on concrete types.
- `type(x) == T`, which rejects subclasses.
- Checking a method exists and then calling a *different* one.
- EAFP with a bare `except:` that hides every error, not just the one expected.
- Forgetting that a `str` quacks like a sequence of characters.
- A `try` around a large block where only one call can raise the expected exception.

## Key takeaways

- Duck typing: code against behaviour (the methods you call), not lineage; no shared base class is required.
- The built-ins are duck-typed through dunders — `len`, iteration, `with`, `sorted`, file-like objects.
- EAFP (try, then handle) for exceptional failures and unreliable checks; LBYL for common, cheap conditions.
- `hasattr`/`getattr(obj, name, default)`/`callable` ask about capability, not type.
- Replace `isinstance` chains with a method per class; keep type checks for boundaries, dunders and the string-versus-sequence case.

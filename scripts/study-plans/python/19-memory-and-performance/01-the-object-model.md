---
title: The object model — objects, references, reference counting and the cycle collector
minutes: 15
---
Every value in Python is an object on the heap with a header — a reference count and a pointer to its type — and every variable, container slot and attribute is a *reference* to one. That single fact explains the memory cost of an integer (28 bytes, not 4), why `a = b` copies nothing, why `del` rarely frees anything, when an object actually disappears, and why two objects that point at each other need a separate collector. This lesson covers the object header and what things cost, references and the `is`/`==` distinction, reference counting and its immediate frees, the generational cycle collector and the `gc` module, weak references, and the levers — `__slots__`, sharing, generators — that reduce memory.

## What an object costs

```python
import sys
sys.getsizeof(0)            # 28  — header + one 30-bit digit
sys.getsizeof(2**64)        # 36  — more digits
sys.getsizeof("")           # 49; each ASCII character adds 1
sys.getsizeof([])           # 56; each slot adds 8 (a pointer), over-allocated as it grows
sys.getsizeof((1, 2))       # 56
sys.getsizeof({})           # 64; a compact table that grows in steps
sys.getsizeof(1.5)          # 24
```

The numbers are for the object itself, not what it references: a list of a million ints is 8 MB of pointers plus 28 MB of int objects. (Never print these in a judged program — they vary by build; the lesson quotes CPython 3.11 on a 64-bit Linux.) Small ints from −5 to 256 are pre-allocated and shared; short identifier-like strings are *interned* and shared; everything else is a fresh allocation. Containers hold pointers, so a tuple of three ints is 56 bytes plus three ints that may already exist.

## References, not values

```python
a = [1, 2, 3]
b = a                    # a second reference to the same list — no copy
b.append(4)
a                        # [1, 2, 3, 4]
a is b                   # True: same object
c = a[:]                 # a shallow copy: new list, same element objects
c is a, c == a           # (False, True)
```

Assignment binds a name to an object; passing an argument binds a parameter; storing in a container stores the pointer. `is` compares identity (the same object), `==` compares value (the type's `__eq__`); the idiom `x is None` is right because there is one `None`, and `x is 5` is wrong because it depends on the small-int cache. `copy.copy` is the shallow copy, `copy.deepcopy` copies recursively, and neither is needed for immutable objects, which can be shared freely because nobody can change them.

## Reference counting

Each object's header holds the number of references to it. Binding a name or storing in a container increments it; rebinding, `del`, a container being freed or a function returning (its locals go away) decrements it; at zero the object is freed *immediately* and its `__del__`, if any, runs. This is why a file closed in a `with` block or a large list dropped at the end of a function is released at a predictable moment, and why `del x` frees nothing when another reference exists — it removes one name, not the object. `sys.getrefcount(x)` reports the count (one higher than expected, because the argument is a reference too).

The cost of reference counting is that every operation on an object touches its header, which is one reason a thread-safe interpreter needs the GIL (Module 17), and one reason CPython is slower than a tracing-GC language at pointer-heavy code.

## Cycles and the collector

```python
a = []
b = [a]
a.append(b)             # a → b → a
del a, b                # both counts are still 1: each holds the other
```

Reference counting cannot free a cycle — each object's count never reaches zero. CPython's *cycle collector* finds them: it tracks container objects in three generations, periodically walks the youngest generation, subtracts references that come from within the tracked set, and frees what is not reachable from outside. Young objects are examined often, survivors are promoted, and old generations are examined rarely, on the observation that most objects die young. `gc.collect()` runs a full pass and returns the count freed; `gc.disable()` is a real optimisation for a short allocation-heavy phase that creates no cycles; `gc.get_count()` and `gc.get_threshold()` expose the state. Objects that cannot participate in cycles — ints, strings, tuples of atoms — are not tracked at all.

## Weak references

`weakref.ref(obj)` refers to an object without counting; the referent is freed when the strong references go, and the weak ref then returns `None`. `weakref.WeakValueDictionary` and `WeakKeyDictionary` are caches and registries that do not keep their entries alive — the standard answer to "a cache that keeps everything forever". Most built-in types cannot be weakly referenced (lists, dicts, ints); instances of your own classes can, unless `__slots__` omits `__weakref__`.

## Reducing memory

- `__slots__ = ("x", "y")` on a class replaces the per-instance `__dict__` with fixed slots: roughly 48 bytes per instance instead of ~150, and faster attribute access; the price is no ad-hoc attributes.
- A generator or `itertools` pipeline processes items one at a time instead of materialising a list; `sum(x * x for x in xs)` allocates nothing.
- `array.array("d")`, `bytes`, `bytearray` and NumPy arrays store raw numbers, 8 bytes each, instead of 8-byte pointers to 24-byte floats.
- Share immutable data; `sys.intern` for many repeated strings; tuples instead of lists for fixed records; `dict` keys drawn from a small set are shared through key-sharing dicts on instances.
- Delete or scope out references to large intermediates as soon as they are done; the object is freed when the last reference goes, not when the function ends.

## Pitfalls

- Believing `del x` frees the object.
- `x is 5` or `s is "abc"` — works by accident of caching, fails elsewhere.
- A cache dict that holds every object ever created.
- `__del__` methods that assume the order of finalisation at interpreter shutdown.
- Cycles through closures or bound methods (`self.callback = self.method`) that hold large objects until the collector runs.
- Reading `getsizeof` of a container as the size of its contents.

## Key takeaways

- Every value is a heap object with a refcount and a type pointer; an int costs 28 bytes, a container costs 8 bytes per pointer.
- Names, parameters and container slots are references; `is` is identity, `==` is value; copying is explicit.
- Reference counting frees an object the moment its last reference goes; `del` removes a name.
- Cycles need the generational collector; `gc.collect()` forces it; weak references do not keep objects alive.
- `__slots__`, generators, raw arrays and sharing immutable data are the memory levers.

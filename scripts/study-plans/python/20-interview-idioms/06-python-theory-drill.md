---
title: The Python theory drill — thirty questions, thirty answers
minutes: 25
---
Every Python interview has a theory section, and its questions have barely changed in a decade: what the GIL is, how a dict works, what a generator does, why a mutable default is wrong, the difference between `is` and `==`. This lesson is the drill: thirty questions, each with the answer an interviewer wants to hear — the definition first, the one consequence that matters, then a stop so the follow-up can come — and a pointer to the module that teaches it in depth. Read it twice a week before interviews. A Python answer is expected to name a mechanism: not "lists are slow to search" but "`in` on a list is a linear scan; a set hashes".

## The language and its objects

1. **What does "everything is an object" mean in practice?** Every value — ints, functions, classes, modules — is a heap object with a type and a reference count; a variable is a name bound to one. Consequences: assignment copies nothing, functions are passed as values, and `type(x)` is itself an object. *(Modules 1, 19)*

2. **Mutable versus immutable?** An immutable object's value cannot change after creation (int, float, str, tuple, frozenset, bytes); a mutable one can (list, dict, set, bytearray, most instances). Immutables are hashable by default and safe to share; a "change" to one is a new object. *(2, 6)*

3. **`is` versus `==`?** `is` compares identity (the same object); `==` compares value through `__eq__`. Use `is` only for `None`, `True`, `False` and sentinels; `x is 5` works by the small-int cache and is a bug. *(2, 19)*

4. **How are arguments passed?** By assignment: the parameter is bound to the same object the caller passed ("pass by object reference"). Mutating the object is visible to the caller; rebinding the parameter is not. *(4)*

5. **Why is a mutable default argument a bug?** Defaults are evaluated once at `def` time and stored on the function, so every call that omits the argument shares the same list. Fix with `None` and create inside. *(4, 20)*

6. **What does a closure capture?** The variable, by cell, not its value at creation — late binding. Three lambdas made in a loop all see the loop's final value; bind with a default argument or a factory. *(16)*

7. **`//` and `%` with negatives?** Floor division rounds towards negative infinity and the remainder takes the divisor's sign: `-7 // 2 == -4`, `-7 % 2 == 1`. C and Java truncate instead. *(2)*

8. **Why does `0.1 + 0.2 != 0.3`?** Binary floating point cannot represent those decimals exactly; compare with `math.isclose`, format to a fixed precision, or use `decimal`/`fractions` for exact arithmetic. *(2)*

## Data structures

9. **How does a dict work?** A hash table: `hash(key)` selects a slot in an open-addressed array; equal keys must hash equal; lookups, inserts and deletes are O(1) on average and O(n) in a pathological worst case. Since 3.7 insertion order is guaranteed; the table resizes as it fills. *(7, 20)*

10. **What makes an object hashable, and why must lists not be keys?** It defines `__hash__` consistent with `__eq__` and its hash never changes; a list's contents can change, so its hash would go stale and the key would be lost. Tuples of hashables and frozensets are the substitutes. *(7, 8)*

11. **List versus tuple?** Both are ordered sequences; a list is mutable and over-allocates for appends, a tuple is immutable, slightly smaller, hashable when its elements are, and signals "a fixed record". *(6)*

12. **The cost of the common operations?** List: index O(1), append amortised O(1), `in` and `insert(0)` O(n); dict and set: O(1) average; sort O(n log n); `deque` O(1) at both ends; `heapq` O(log n) push/pop. A linear operation inside a loop over the same data is the quadratic to look for. *(19)*

13. **When do you use a set, a deque, a heap, `bisect`?** Membership and de-duplication; a queue or sliding window; repeated minimum or top-k; queries on a sorted list or search on a monotonic answer. *(7, 13, 20)*

14. **Shallow versus deep copy?** A shallow copy (`list(xs)`, `xs[:]`, `copy.copy`) is a new container with the same element objects; a deep copy (`copy.deepcopy`) recursively copies the elements. `[[0] * n] * m` is m references to one row. *(6, 19)*

## Functions, iteration and classes

15. **What is a generator, and why use one?** A function with `yield` returns an iterator that runs lazily, one value per `next`, keeping its frame between values; it processes streams of any length in constant memory and composes into pipelines. A generator expression is the inline form. *(11)*

16. **Iterable versus iterator?** An iterable has `__iter__` returning an iterator; an iterator has `__next__` and raises `StopIteration` when done (and is its own iterable). A list can be iterated many times; an iterator is consumed once. *(11)*

17. **What does a decorator do?** `@deco` above `def f` rebinds `f = deco(f)`: a function that takes a function and returns a replacement, usually a wrapper with `@functools.wraps`. Used for logging, caching, registration, access control. *(16)*

18. **`*args` and `**kwargs`?** Collect extra positional arguments into a tuple and extra keyword arguments into a dict; in a call, `*` and `**` unpack them. A wrapper forwards both to be transparent. *(4)*

19. **What is a context manager?** An object with `__enter__` and `__exit__` used by `with`; `__exit__` runs on every exit including exceptions, so resources are released deterministically. `contextlib.contextmanager` writes one from a generator. *(10)*

20. **How does attribute lookup and inheritance work?** `obj.x` checks data descriptors on the type, then the instance dict, then the type and its bases in MRO order (C3 linearisation), then `__getattr__`. `super()` follows the MRO, which is why cooperative `__init__` works with multiple inheritance. *(8, 9, 16)*

21. **`@staticmethod` versus `@classmethod`?** A static method receives nothing implicit — a function in the class's namespace; a class method receives the class as `cls` and is the tool for alternative constructors that work in subclasses. *(8)*

22. **What is duck typing, and what are protocols and ABCs for?** Behaviour is decided by what an object can do, not its type; `typing.Protocol` names a set of methods for static checking, and an ABC (`collections.abc`) enforces them at run time and can supply mixin methods. *(9, 15)*

23. **What does `__slots__` do?** Replaces the per-instance `__dict__` with fixed attribute slots: less memory, faster access, no ad-hoc attributes. *(19)*

24. **Dataclass versus named tuple versus plain class?** A dataclass generates `__init__`, `__repr__`, `__eq__` (and ordering, hashing, frozenness on request) for a record with named fields; a named tuple is an immutable tuple with names; a plain class is for behaviour beyond a record. *(8)*

## Errors, modules and the run time

25. **`try/except/else/finally`?** `except` catches; `else` runs only when nothing was raised; `finally` always runs. Catch specific exceptions around specific statements; `raise ... from e` chains a cause; exceptions are the control flow for failure, not return codes. *(10)*

26. **What is the GIL?** A mutex that lets one thread execute bytecode at a time in CPython, released during blocking I/O and by some C extensions. Threads help I/O-bound code, not CPU-bound code; processes give parallelism; asyncio gives single-threaded concurrency for many waits. *(17)*

27. **What is a race condition, and how is it fixed?** Two threads performing a read-modify-write on shared state between bytecodes — `count += 1` is three instructions — so an update is lost. A `Lock` makes the compound operation atomic; a `Queue` avoids the sharing. *(17)*

28. **How does memory management work?** Reference counting frees an object the moment its last reference goes; a generational cycle collector finds reference cycles the counts cannot free; `del` removes a name, not the object. *(19)*

29. **What happens on `import`?** The module is found on `sys.path`, executed once top to bottom, and cached in `sys.modules`; later imports return the cached object. `if __name__ == "__main__":` distinguishes running from importing. Circular imports fail when a name is used before the other module finished executing. *(12)*

30. **How do you make Python code faster?** In order: fix the algorithm, choose the data structure, move the loop into a built-in or a comprehension, batch I/O, then hoist lookups in the profiled hot loop; NumPy for numeric arrays, processes for CPU-bound parallelism. Measure with `cProfile` and `timeit` before and after. *(19)*

## How to use the drill

Read a question, answer aloud in two sentences, then read the answer and note what you left out. The interviewer's follow-up is always "why" or "what happens if" — the mechanism in each answer is what survives that. When an answer references a module number, that module has the code that proves it.

## Key takeaways

- Objects, references and mutability explain most language questions; name the mechanism.
- Dicts hash, lists scan, deques and heaps and bisect each answer one shape of question.
- Generators are lazy frames; decorators rebind; context managers guarantee `__exit__`; the MRO orders lookup.
- Exceptions are for failure, the GIL serialises bytecode, reference counting frees immediately and the collector handles cycles.
- Speed comes from the algorithm and the data structure first, measured before and after.

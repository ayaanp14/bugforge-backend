---
updated: 2026-10-03
question: What does the Python (Intermediate) skill test examine?
answer: The Python a working developer relies on: how arguments bind and names resolve, closures, the class and data model, iterators and generators, comprehensions, decorators and context managers, exceptions, the built-in containers in depth, and standard-library modules such as `collections`, `functools` and `itertools`. Questions show short programs and ask what they print or raise; then you solve easy and medium coding problems in Python.
q: Does the Python Intermediate test cover asyncio, threads or type hints?
a: No. Concurrency is not one of its topics, and type hints are not examined, although the coding round's function signatures use them, so you should be able to read `List[int]` and `-> str`. The questions stay with the core language, its data model and the standard library.
q: Which standard-library modules should I know well?
a: `collections`, `functools`, `itertools`, `copy` and `contextlib`, plus the built-in functions that take or return iterators, such as `sorted`, `map`, `filter`, `zip` and `enumerate`. Knowing a function's name is not enough: know what it returns, whether it is lazy, and what it does with an empty input.
q: Is the test about writing Pythonic code or about knowing the rules?
a: The rules. Every multiple-choice question has one answer the interpreter itself would give: an exact line of output or a specific exception. Style matters in the coding round only in that clear code is easier to get right; the marks there come from the hidden test cases your solution passes.
q: I use Python mainly for data science. Is this the right level?
a: It depends on how much plain Python you write. Notebook work leans on pandas and NumPy, which the test does not cover; it examines the language underneath them. If classes, generators and decorators are part of your own code, sit Intermediate; if not yet, [Python (Basic)](/skill-tests/python-basic) and the [Python study plan](/study-plans/python) are the place to start.
---

Python (Intermediate) is for people who write Python as part of their work, in backend services, data pipelines, automation or tooling, and want a credential that reaches past the syntax. Most real Python bugs are not syntax errors and do not crash on the first run. They come from the rules underneath the code: how a name is looked up, when an expression is evaluated, which object is shared and which is copied, and which special method Python actually calls for an operation. This test asks about those rules directly.

The multiple-choice questions are short programs, each built so that someone who knows the rule gets one answer and someone answering from habit gets another. Some ask what a snippet raises rather than what it prints, and a few ask you to select every correct option, scored only when the set is exact. The coding round that follows draws from the catalogue at easy and medium difficulty, and every solution is written in Python.

## The rules under everyday Python

Ten topics are balanced across every sitting. Basic syntax, simple string handling and plain loops are assumed rather than asked about. The [Python study plan](/study-plans/python) covers this ground in its middle and later modules: iterators and generators, the standard library in depth, and decorators, descriptors and the data model.

- **Functions and arguments.** Every kind of parameter, positional-only and keyword-only included, how a call binds its arguments to them, unpacking in calls and in assignments, and when default values are evaluated.
- **Scope and closures.** How Python decides which variable a name refers to, `global` and `nonlocal`, and what a closure captures.
- **Classes and objects.** Attribute lookup on instances and classes, inheritance and `super()` with more than one base class, class and static methods, properties, and the special methods that control how an object is printed.
- **Iterators and the data model.** Iterables versus iterators, the iterator protocol, and the special methods behind `in`, `len()`, truthiness, equality and hashing.
- **Comprehensions and generators.** Nested comprehensions, generator functions and expressions, and what laziness means for when each line runs.
- **Decorators and context managers.** Decorators with and without arguments, what happens at decoration time, and context managers written as classes or with `contextlib`.
- **Exceptions.** The full `try` statement including `else` and `finally`, custom exception hierarchies, and exception chaining.
- **Dictionaries and sets.** Hashing and key equality, dictionary views, `frozenset`, and changing a dictionary safely.
- **Lists and tuples.** Shallow versus deep copies, and in-place operations versus ones that build a new object.
- **Standard library.** The `collections`, `functools`, `itertools`, `copy` and `contextlib` modules, and sorting with keys.

## Writing solutions under time

The coding round's problems come from the catalogue at easy and medium difficulty, and the harder one usually needs a technique: a [sliding window](/roadmap/sliding-window), a [prefix sum](/roadmap/prefix-sum), [binary search](/roadmap/binary-search) or a [heap](/roadmap/heap). The [Hash Table](/challenges/hash-table), [Sliding Window](/challenges/sliding-window) and [Heap](/challenges/heap) problem lists are good places to practise them at medium difficulty.

Python shortens many of these techniques if you know the library: `collections.Counter` and `defaultdict` for frequencies, `heapq` for the k smallest or largest items (remember it is a min-heap), `bisect` for searching a sorted list, and `deque` for a queue. Pasting is switched off, so those calls have to come from memory, argument order included. You complete a function whose signature is given with type hints, in the catalogue's camelCase naming; the input arrives as its arguments and you return the answer.

Run checks the visible examples; Submit runs thousands of hidden, generated cases, and every case you pass earns its share of the problem's marks. Your best submission per problem is what counts, so submit a correct solution as soon as you have one and refine it afterwards.

## Preparing when you already write Python

1. Go through the topic list and, for each one, try to explain the rule out loud as you would to a colleague. Where you hesitate, read that module of the [Python study plan](/study-plans/python), quiz included.
2. Turn every doubt into a three-line experiment and predict the result before running it. What does `dict.fromkeys("ab", [])` look like after you append to one of its values? A prediction that turns out wrong teaches more than a page of documentation.
3. Read the data-model chapter of the Python reference for the special methods you have never written yourself. Knowing which method Python calls, and when, settles many questions at this level.
4. Solve medium catalogue problems in Python against a timer, and read code you did not write: the Python [bug hunts](/bug-hunts) ask you to find what is wrong in a program that looks fine.

## Where confident Python programmers slip

- **Answering from habit instead of the rule.** Years of code that worked can leave you sure of things the language does not promise. When two options both look plausible, ask which one Python guarantees.
- **Losing track of when code runs.** Some code runs when a `def` or `class` statement executes, some when a function is called, and some only when a value is requested. Decide which applies before deciding what the code does.
- **Mixing up identity, equality and hashing.** `is`, `==` and `hash()` answer different questions, and containers rely on the last two together.
- **Forgetting which objects are shared.** Two names, a default value or a container slot can all point at the same object. Before tracing a mutation, find out how many objects there really are.

## What changes from Basic

[Python (Basic)](/skill-tests/python-basic) checks that you can predict everyday code: operators, loops, strings, the built-in containers, simple functions and classes. Intermediate assumes all of that and asks why Python behaves as it does, and its coding round goes up to medium difficulty. Basic is not a prerequisite, so if the topics above are part of how you already work, start here.

## Sample question
topic: iterators
answer: A
run: python

What does this program print?

```python
class Defaults:
    color = "red"

    def __getattr__(self, name):
        return name.upper()

d = Defaults()
d.size = 3
print(d.color, d.size, d.shape)
```

- A: `red 3 SHAPE`
- B: `COLOR SIZE SHAPE`
- C: `red 3 None`
- D: It raises an `AttributeError`.

> `__getattr__` is a fallback: Python calls it only when the normal lookup, the instance's own attributes and then the class and its bases, finds nothing. `color` is found on the class and `size` on the instance, so both come back as stored; only `shape` is missing, and `__getattr__` turns its name into `SHAPE`. The method that intercepts every attribute read is `__getattribute__`, which would give B; without either, `d.shape` would raise `AttributeError`.

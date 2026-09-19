---
title: The testing mindset — what to test, how to arrange it, and designing for testability
minutes: 13
---
A test is a program that runs your code with known inputs and checks the outputs, so that a change which breaks behaviour is caught by a machine instead of a user. That definition already settles most arguments: tests exist to catch regressions and to pin down what the code promises, not to prove correctness or to reach a coverage number. This lesson covers the kinds of test and where each earns its place, the arrange–act–assert shape, what is worth testing, the properties that make a suite trustworthy, and the design moves — pure functions, injected dependencies, fixed clocks and seeds — that make code testable in the first place.

## Kinds of test

| Kind | Scope | Speed | Count |
| --- | --- | --- | --- |
| Unit | one function or class, no I/O | microseconds to milliseconds | hundreds or thousands |
| Integration | two or more real parts together: code and a database, a parser and a file | milliseconds to seconds | tens |
| End-to-end | the whole system through its real interface: an HTTP request, a CLI invocation | seconds | a handful |

The pyramid — many unit tests, fewer integration tests, few end-to-end — follows from cost: a unit test runs in isolation and tells you *which* line is wrong; an end-to-end test proves the system works but says little about where it failed and takes a thousand times longer. A regression test is any test written to reproduce a bug before fixing it; it belongs at the lowest level that reproduces the problem.

## Arrange, act, assert

```python
def test_discount_applies_over_threshold():
    cart = Cart([Item("book", 40), Item("pen", 70)])     # arrange: the inputs
    total = cart.total(discount_over=100, rate=0.1)      # act: one call
    assert total == 99.0                                 # assert: one behaviour
```

Every test has these three parts, in this order, ideally with a blank line between them. One behaviour per test, named for the behaviour (`test_discount_applies_over_threshold`, not `test_total_2`), so that a failure's name is already a diagnosis. Several assertions are fine when they describe one behaviour; a test that checks five unrelated things stops at the first failure and hides the other four.

## What to test

- **Behaviour, not implementation.** Assert on what the function returns or does to the world, not on which helpers it called; a test coupled to the implementation fails on every refactor and passes on every bug that keeps the same shape.
- **The edges.** Empty input, one element, the boundary value (exactly 100 when the rule is "over 100"), negative, zero, the largest sensible size, Unicode, whitespace.
- **The errors.** The invalid inputs raise the documented exception with a useful message; the recoverable failures are recovered.
- **The bug you just fixed.** A regression test that failed before the fix and passes after.
- **Not** private helpers, trivial getters, or the standard library.

## Properties of a good suite

Fast — a suite that takes minutes is run rarely. Isolated — each test sets up its own state and leaves nothing behind, so order does not matter and one failure does not cascade. Deterministic — the same result every run: no dependence on the clock, randomness, network, the file system's contents, or hash order. Readable — a failing test explains itself from its name and its assertion message. Independent of each other — no test relies on another having run. A flaky test (passes sometimes) is worse than no test: it trains people to ignore red.

## Designing for testability

The code that is easy to test is code whose inputs and outputs are explicit:

```python
# hard to test: reads the clock, the environment and the network inside
def report():
    today = date.today()
    rows = requests.get(URL).json()
    ...

# easy to test: the world is passed in
def report(rows, today):
    ...

def main():
    print(report(fetch_rows(), date.today()))     # the impure shell, thin
```

The pattern is *functional core, imperative shell*: pure functions that compute from arguments, wrapped by a thin layer that does the I/O. Dependencies a function needs — the clock, a random generator, a sender, a store — are parameters with sensible defaults (`now=None` then `now = now or datetime.now()`), so a test passes a fixed value and the production caller passes nothing. `random.Random(seed)` instead of the module functions makes randomness reproducible. A class that takes its collaborators in `__init__` can be given fakes.

## Doubles, briefly

When a dependency is slow, unavailable or nondeterministic, tests replace it with a *double*: a **stub** returns canned answers, a **fake** is a working lightweight implementation (an in-memory dict for a database), a **spy** records what was called, a **mock** does both and can assert on calls. Lesson 4 builds them with `unittest.mock`; the design above is what makes them pluggable.

## Coverage and TDD

Coverage (`coverage run -m pytest`, then `coverage report`) shows which lines tests executed. Untested lines are a signal; 100 % is not a goal — a line can execute without its behaviour being checked. Test-driven development writes the failing test first, then the least code that passes, then refactors; it is a design technique as much as a testing one, because a test written first forces the interface to be usable. Neither is mandatory; both are tools.

## Pitfalls

- Tests that assert on implementation details (which method was called, in what order) rather than outcomes.
- A test with no assertion (it "runs without crashing").
- Hidden dependence on the clock, randomness or test order.
- One giant test per module.
- Mocking so much that the test checks the mocks, not the code.
- Skipping the regression test because "the fix is obvious".

## Key takeaways

- Tests catch regressions and pin promises; unit tests are many and fast, integration tests fewer, end-to-end tests few.
- Arrange, act, assert; one behaviour per test, named for it.
- Test behaviour, edges and errors, and every fixed bug; not private helpers.
- A trustworthy suite is fast, isolated, deterministic and readable — flaky tests are worse than none.
- Make code testable by passing the world in: pure core, thin impure shell, injected clock, seed and collaborators.

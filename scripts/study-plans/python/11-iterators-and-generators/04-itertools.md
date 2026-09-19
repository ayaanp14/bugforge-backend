---
title: itertools — the iterator toolkit
minutes: 15
---
`itertools` is a set of small, fast, lazy building blocks for iterators: infinite counters, chaining, slicing, running totals, grouping, and the combinatoric generators that interviews keep asking for. Each function takes iterables and returns an iterator, so they compose without intermediate lists, and each is written in C, so a chain of them is usually faster than the equivalent Python loop. This lesson catalogues the ones that matter, with the two that everyone misuses — `groupby`, which groups only consecutive runs, and `tee`, which buffers — called out.

## Infinite iterators

```python
from itertools import count, cycle, repeat, islice

list(islice(count(10, 5), 4))         # [10, 15, 20, 25] — count(start, step) never ends
list(islice(cycle("ab"), 5))          # ['a', 'b', 'a', 'b', 'a']
list(repeat("x", 3))                  # ['x', 'x', 'x']; repeat(x) alone is infinite
```

`count` pairs with `zip` to number things without `enumerate`'s start limits; `cycle` alternates values; `repeat` supplies a constant to `map` (`map(pow, xs, repeat(2))`). Each is bounded by the consumer — `islice`, `zip` with a finite partner, or `takewhile`.

## Slicing and terminating

```python
from itertools import islice, takewhile, dropwhile, chain, pairwise, accumulate, compress, zip_longest

islice(it, 5)                          # first five
islice(it, 2, 8, 2)                    # like a slice, on any iterator
takewhile(lambda x: x < 5, xs)         # values until the first failure
dropwhile(lambda x: x < 5, xs)         # skip until the first failure, then everything
chain(a, b, c)                         # one iterator over all of them
chain.from_iterable(list_of_lists)     # flatten one level, lazily
pairwise(xs)                           # (x0, x1), (x1, x2), … (3.10)
accumulate(xs)                         # running totals; accumulate(xs, max) running maxima; initial=0 prepends
compress(xs, mask)                     # the xs where the mask is truthy
zip_longest(a, b, fillvalue=None)      # zip that pads instead of truncating
```

`chain.from_iterable` is the lazy flatten; `accumulate` is prefix sums (Module 3) as an iterator, and with `operator.mul` it is running products; `pairwise` replaces `zip(xs, xs[1:])` and works on any iterator.

## groupby — consecutive runs

```python
from itertools import groupby

data = "aaabbcaa"
[(k, len(list(g))) for k, g in groupby(data)]           # [('a', 3), ('b', 2), ('c', 1), ('a', 2)]

rows = [("eng", "ada"), ("eng", "cy"), ("ops", "bob")]
for dept, group in groupby(sorted(rows), key=lambda r: r[0]):
    print(dept, [name for _, name in group])            # eng ['ada', 'cy'] / ops ['bob']
```

`groupby(iterable, key)` yields `(key, group)` pairs for each *run* of consecutive elements with the same key. On unsorted data it produces one group per run, not per key — the second `'a'` above is a separate group. To group whole data, sort by the same key first; to group without sorting, use `defaultdict(list)` (Module 7). Two more rules: each `group` is an iterator that is invalidated when you advance to the next pair, so consume it (`list(group)`) before moving on; and the run-length behaviour is a *feature* — run-length encoding is `groupby` in one line.

## Combinatorics

```python
from itertools import product, permutations, combinations, combinations_with_replacement

list(product("ab", [1, 2]))                 # [('a', 1), ('a', 2), ('b', 1), ('b', 2)] — the cartesian product
list(product(range(2), repeat=3))           # every 3-bit tuple
list(permutations("abc", 2))                # ('a','b'), ('a','c'), ('b','a'), … — ordered, no repeats
list(combinations("abc", 2))                # ('a','b'), ('a','c'), ('b','c') — unordered, no repeats
list(combinations_with_replacement("ab", 2))   # ('a','a'), ('a','b'), ('b','b')
```

`product` replaces nested loops (and gives a single `break`); `permutations(xs, r)` is the ordered arrangements, `combinations(xs, r)` the subsets of size `r` in input order. Sizes grow fast — `permutations` of 10 is 3.6 million — so filter lazily and never materialise more than you need. The subsets of every size are `chain.from_iterable(combinations(xs, r) for r in range(len(xs) + 1))`, the *powerset* recipe.

## tee, starmap, filterfalse

```python
from itertools import tee, starmap, filterfalse
import operator

a, b = tee(gen, 2)                     # two independent iterators over one source — buffers what one has read and the other has not
list(starmap(operator.mul, [(2, 3), (4, 5)]))   # [6, 20] — apply f(*args) to each tuple
list(filterfalse(lambda x: x % 2, range(6)))    # [0, 2, 4] — the complement of filter
```

`tee` is the way to look at a stream twice without a list, but it stores everything between the two readers, so a slow second reader costs the memory a list would have anyway; do not use the original iterator after tee-ing it.

## Recipes worth knowing

```python
def batched(iterable, n):               # groups of n; itertools.batched exists in 3.12
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch

def sliding_window(iterable, n):        # consecutive windows of n
    it = iter(iterable)
    window = deque(islice(it, n), maxlen=n)
    if len(window) == n:
        yield tuple(window)
    for x in it:
        window.append(x)
        yield tuple(window)

def unique_everseen(iterable):          # deduplicate, keeping order, lazily
    seen = set()
    for x in iterable:
        if x not in seen:
            seen.add(x)
            yield x
```

The `itertools` documentation ends with a page of recipes like these (and the third-party `more-itertools` packages them); they are the idioms to reach for before writing an index loop.

## Pitfalls

- `groupby` on unsorted data expecting one group per key.
- Holding a `groupby` group after advancing to the next one.
- `list(count())` or `list(cycle(...))` — infinite.
- `zip` where `zip_longest` was needed, or the reverse.
- Reusing the source after `tee`.
- Materialising `permutations` or `product` of a large input.

## Key takeaways

- `count`, `cycle`, `repeat` are infinite; bound them with `islice`, `takewhile` or a finite `zip` partner.
- `chain`/`chain.from_iterable`, `islice`, `pairwise`, `accumulate`, `compress`, `zip_longest` transform streams lazily.
- `groupby` groups consecutive runs — sort first for whole-data grouping, consume each group before moving on; it is run-length encoding in one line.
- `product` replaces nested loops; `permutations` are ordered, `combinations` unordered; the powerset is combinations of every size.
- `tee` splits with buffering, `starmap` applies to tuples, the recipes (`batched`, windows, `unique_everseen`) are the idioms.

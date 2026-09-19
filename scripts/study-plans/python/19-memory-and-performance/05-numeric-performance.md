---
title: Numeric performance — boxed numbers, array, bytes and NumPy vectorisation
minutes: 14
---
Numeric code is where Python's object model costs the most: every integer and float in a list is a separate heap object, every `+` dispatches through the type, and a loop that adds a million floats performs a million allocations. The escape is to keep numbers *unboxed* — raw machine values in a contiguous block — and to run the loop in C: built-ins such as `sum` and `max`, the `array` and `bytes` types, and above all NumPy, whose arrays and vectorised operations are how numeric Python reaches C speed without leaving Python. This lesson covers why the loop is slow, the standard-library raw types (`array`, `bytes`, `bytearray`, `memoryview`), NumPy arrays, dtypes and broadcasting, the vectorisation habit, reductions, and what remains for Numba and Cython.

## Why the loop is slow

```python
total = 0.0
for x in xs:               # each x: a pointer to a 24-byte float object
    total += x * 2.0       # x * 2.0 allocates a float; += allocates another
```

Per iteration: two type dispatches, two allocations, two reference-count updates, and the interpreter loop overhead. Roughly 50–100 ns each, so 10⁷ elements is a second. `sum(x * 2.0 for x in xs)` removes the `+=` object churn and the loop bytecode but still allocates per element; `2.0 * sum(xs)` is a C loop over pointers and ten times faster; a NumPy `2.0 * xs` over a float64 array is a C loop over raw doubles, a hundred times faster, and it also uses a tenth of the memory.

## array, bytes, bytearray, memoryview

```python
from array import array
a = array("d", [1.0, 2.0, 3.0])       # typecode: 'b' 'B' 'i' 'I' 'q' 'Q' 'f' 'd' …
a.append(4.0); a[0]; sum(a)           # list-like, 8 bytes per element, no object per element
a.tobytes(); array("d").frombytes(raw)

data = bytes(range(256))              # immutable bytes; indexing gives ints
data.count(0); data.find(b"\x10"); sum(data)      # C-speed scans
buf = bytearray(1024)                 # mutable; buf[0] = 255
view = memoryview(buf)[512:]          # a window with no copy; view[0] = 1 writes through
```

`array` is the standard library's typed, compact sequence: the same memory layout as C, iteration still yields Python objects, but storage and I/O (`tofile`, `frombytes`) are raw. `bytes` and `bytearray` are byte sequences with fast C methods (`count`, `find`, `translate`, `split`); `memoryview` slices any buffer without copying — the tool for parsing binary formats and for passing sub-ranges to functions without allocation. `struct.pack`/`unpack` convert between Python values and packed bytes.

## NumPy arrays

```python
import numpy as np
xs = np.array([1.0, 2.5, 4.0])                  # dtype float64, contiguous
xs = np.arange(1_000_000, dtype=np.int64)       # 8 MB, one object
xs.shape, xs.dtype, xs.ndim                     # ((1000000,), dtype('int64'), 1)
ys = xs * 2 + 1                                 # elementwise, one C loop, no Python objects
mask = xs % 3 == 0                              # a boolean array
xs[mask].sum(); (xs > 500_000).sum()            # boolean indexing; counting
xs.mean(), xs.max(), xs.std(), np.sqrt(xs)      # reductions and ufuncs
grid = np.zeros((3, 4)); grid[1, :] = 5         # 2-D, row 1
np.dot(a, b); a @ b                             # linear algebra in BLAS
```

An `ndarray` is a typed block of memory with a shape; operations are *ufuncs* that loop in C and produce new arrays (or write in place with `out=`, `+=`). `dtype` matters: `int64` overflows silently at 2⁶³ (no automatic promotion to big ints), `float32` halves memory and precision, `bool` arrays are one byte per element. Conversion between a Python list and an array (`np.array(list)`, `arr.tolist()`) is O(n) and boxes every element — do it once at the boundary, never inside a loop.

## Broadcasting

```python
row = np.array([1, 2, 3])            # shape (3,)
col = np.array([[10], [20]])         # shape (2, 1)
row + col                            # shape (2, 3): [[11, 12, 13], [21, 22, 23]]
prices * (1 - discount[:, None])     # a column of discounts applied to each row
```

Arrays of different shapes combine by *broadcasting*: dimensions are aligned from the right, a dimension of size 1 stretches to match, and the loop runs once over the result. It replaces nested loops over rows and columns with one expression, and it is the mechanism behind "subtract the column mean from every row" and every normalisation.

## The vectorisation habit

The rule: no Python-level loop over array elements. `for i in range(len(xs)): ys[i] = f(xs[i])` throws away the whole benefit; the vectorised form is `ys = f(xs)` where `f` is composed of ufuncs and slicing. Conditionals become `np.where(cond, a, b)`; cumulative operations `np.cumsum`; windows, `np.convolve` or stride tricks; pairwise distances, broadcasting; grouping, `np.unique(return_counts=True)` or `np.bincount`. When a computation genuinely needs a per-element loop with state that will not vectorise, that is the case for Numba (`@njit` compiles the loop to machine code) or Cython — both outside the standard library and outside the judge.

## Reductions and precision

`xs.sum()` on float64 uses pairwise summation and is more accurate than a naive loop; `math.fsum` is exact-rounded for Python floats. Integer reductions on `int64` overflow silently — `np.arange(10**6)**3` wraps — so choose `dtype=np.float64` or `object` when values grow, or compute in Python ints when exactness matters. `np.isclose`/`np.allclose` compare floats with tolerance.

## Where the standard library is enough

`sum`, `max`, `min`, `sorted`, `math.fsum`, `statistics.mean/pstdev`, `bytes.count`, `str.count`, `collections.Counter`, `itertools.accumulate` are all C loops; for a single pass over a list of a million numbers they are within a small factor of NumPy and need no conversion. NumPy earns its import when there are several operations over the same data, 2-D structure, broadcasting, or arrays that live for the whole program.

## Pitfalls

- A Python loop over a NumPy array element by element.
- Growing an array with `np.append` in a loop (each call copies) — build a list, convert once, or preallocate.
- `int64` overflow read as a bug in the algorithm.
- Converting list ↔ array inside a hot loop.
- `arr == list` comparisons producing an array where a boolean was expected (`if arr == x:` raises).
- Importing NumPy for one `sum`.

## Key takeaways

- Boxed numbers cost an allocation and a dispatch per operation; the fix is unboxed storage plus C loops.
- `array`, `bytes`, `bytearray` and `memoryview` are the standard library's raw, copy-free types.
- NumPy arrays are typed blocks; ufuncs, boolean masks, reductions and broadcasting replace loops; dtype decides overflow and memory.
- Vectorise: no Python loop over elements; `where`, `cumsum`, `unique`, `bincount` express the common loops.
- Built-in reductions are C loops too; NumPy pays off for repeated, multi-dimensional or long-lived numeric data.

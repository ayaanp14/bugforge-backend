---
title: Grids and nested lists
minutes: 14
---
A two-dimensional grid — a game board, a matrix, a maze, a spreadsheet — is a list of rows, each row a list of cells, indexed `grid[r][c]` with the row first. Almost every interview problem over grids uses the same six operations: read it from input, build an empty one of a given size, walk every cell, visit a cell's neighbours without falling off the edge, transpose or rotate it, and print it back. This lesson gives each as a template, states the row-major convention and the `[[0] * C] * R` trap once more where it does the damage, and shows the flattening trick for problems that are one-dimensional in disguise.

## Reading a grid

```python
R, C = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(R)]      # numbers with spaces
maze = [list(input().rstrip("\n")) for _ in range(R)]           # characters, no spaces
maze = [input().rstrip("\n") for _ in range(R)]                 # rows as strings, if not modified
```

Rows as strings are fine for reading (`maze[r][c]` works) and immutable; convert each row to a list when cells must be changed. Trust the declared `R`; validate `len(row) == C` if the input might be ragged.

## Building an empty grid

```python
grid = [[0] * C for _ in range(R)]        # R independent rows
grid = [[0] * C] * R                      # WRONG: R references to one row
```

The second form is Module 6 lesson 1's trap in its natural habitat: writing `grid[0][0] = 1` sets column 0 of *every* row. The comprehension runs `[0] * C` once per row and is the only correct spelling. For a grid of strings or `None`, the same shape: `[[None] * C for _ in range(R)]`.

## Walking every cell

```python
for r in range(R):
    for c in range(C):
        cell = grid[r][c]

for r, row in enumerate(grid):            # when the row itself is useful
    for c, cell in enumerate(row):
        ...

for row in grid:                          # order does not matter, index not needed
    for cell in row:
        total += cell
```

`sum(sum(row) for row in grid)` sums a numeric grid; `sum(row.count("#") for row in grid)` counts a character; `max(max(row) for row in grid)` finds the largest. Column sums come from the transpose (below) or `sum(grid[r][c] for r in range(R))`.

## Neighbours and bounds

```python
DIRS4 = [(-1, 0), (1, 0), (0, -1), (0, 1)]                      # up, down, left, right
DIRS8 = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)]

def neighbours(r, c):
    for dr, dc in DIRS4:
        nr, nc = r + dr, c + dc
        if 0 <= nr < R and 0 <= nc < C:
            yield nr, nc
```

The bounds check `0 <= nr < R and 0 <= nc < C` is the line that prevents both `IndexError` and the subtler bug of a negative index silently wrapping to the last row (`grid[-1]` is valid Python). A direction list makes the four-way and eight-way cases one loop rather than four or eight `if`s, and it is the shape flood fill, BFS on a grid and counting islands all use. Returning neighbours as a generator (`yield`, Module 11) keeps the caller's loop simple: `for nr, nc in neighbours(r, c):`.

## Transposing and rotating

```python
transposed = [list(col) for col in zip(*grid)]          # columns become rows
rotated_cw = [list(col) for col in zip(*grid[::-1])]    # rotate 90° clockwise
rotated_ccw = [list(col) for col in zip(*grid)][::-1]
flipped_h = [row[::-1] for row in grid]                 # mirror left–right
flipped_v = grid[::-1]                                  # mirror top–bottom (rows shared)
```

`zip(*grid)` is the transpose: the star spreads the rows as separate arguments, and `zip` pairs up their first elements, then their second, and so on. Column sums are `[sum(col) for col in zip(*grid)]`. For a ragged grid `zip` truncates to the shortest row.

## Printing

```python
for row in grid:
    print(" ".join(map(str, row)))        # numbers separated by spaces

for row in maze:
    print("".join(row))                   # characters, no separator

print("\n".join(" ".join(map(str, row)) for row in grid))    # one print
```

`print(row)` shows the list's `repr` with brackets and is almost never the expected format. Aligned columns use a format spec per cell: `" ".join(f"{v:3}" for v in row)`.

## Flattening and the index trick

A grid is also one list of `R * C` cells: cell `(r, c)` is index `r * C + c`, and index `i` is `divmod(i, C)`. Flattening (`[cell for row in grid for cell in row]`) lets you sort every cell, find the k-th smallest, or use `bisect`; the index arithmetic lets you store a grid in a flat list or a `bytearray` when memory matters. Row-major order — all of row 0, then all of row 1 — is also the order the grid is read from input and printed to output, and the order in which walking with `r` outer and `c` inner visits cells.

## Copying a grid

`grid.copy()` copies the outer list only; the rows are shared. `[row[:] for row in grid]` copies every row (a full copy for a grid of immutables); `copy.deepcopy(grid)` for anything nested deeper. A function that mutates a grid it was given should say so; a simulation that needs "the grid at the previous step" needs a real copy, not an alias.

## Pitfalls

- `[[0] * C] * R`.
- `grid[c][r]` — row first, always.
- A missing bounds check, and negative indexes wrapping instead of failing.
- `print(row)`.
- Modifying the grid while walking it and reading cells already changed this step — use a copy or a second grid.
- Comparing a row string with a row list (`"..." != [".", ".", "."]`).

## Key takeaways

- A grid is a list of row lists, `grid[r][c]`, row-major; read rows with a comprehension over `range(R)`.
- Build with `[[0] * C for _ in range(R)]`; copy rows with `[row[:] for row in grid]`.
- Walk with nested `range` or `enumerate`; neighbours through a direction list and the bounds check `0 <= nr < R and 0 <= nc < C`.
- `zip(*grid)` transposes; `zip(*grid[::-1])` rotates; `row[::-1]` mirrors.
- Print with `" ".join(map(str, row))`; flatten with a double comprehension; `(r, c)` ↔ `r * C + c`.

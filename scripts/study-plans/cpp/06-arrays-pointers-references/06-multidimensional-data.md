---
title: Multidimensional data — grids, layout and neighbours
minutes: 15
---
Most "2-D" problems — a board, an image, a maze, a matrix, a spreadsheet — are one-dimensional memory read through two indices. Once you see the layout, choosing a representation, reading a grid from input, visiting a cell's neighbours and staying inside the bounds all become the same small set of idioms. This lesson settles those idioms with `std::vector<std::vector<int>>`, `std::array` of `std::array` and a flat vector, and gives the neighbour loop that every grid exercise in this track — and most grid interview questions — reduces to.

## Four representations

```cpp
int fixed[3][4] = {};                                          // built-in: sizes are constants
std::array<std::array<int, 4>, 3> arr{};                       // same, with value semantics
std::vector<std::vector<int>> vec(3, std::vector<int>(4));     // rows × cols known at run time
std::vector<int> flat(3 * 4);                                  // one block; index r * 4 + c
```

- The **built-in 2-D array** and **`std::array` of `std::array`** need both sizes at compile time. They are one contiguous block, and the `std::array` form can be copied, compared and passed by reference without decay. Right for a chess board or a 3×3 kernel.
- **`std::vector<std::vector<int>>`** is the general-purpose grid: `R` rows, each a separate `std::vector<int>` of `C` elements. The constructor `vec(R, std::vector<int>(C))` makes `R` copies of one `C`-element row; `vec(R, std::vector<int>(C, -1))` fills with `-1`. Rows may differ in length (a jagged grid) — a flexibility and a hazard.
- **A flat vector** stores `R × C` elements in one block: cell `(r, c)` is `flat[r * C + c]`, and an `int& at(int r, int c)` helper makes it read like a grid. One allocation, cache-friendly, the layout performance-minded code prefers (Module 19, Performance and undefined behaviour).

## Row-major layout

Every representation above is **row-major**: row 0's elements come first, then row 1's, and so on. For a 3×4 grid the memory order is

```text
index: 0  1  2  3 | 4  5  6  7 | 8  9  10 11
cell : 00 01 02 03| 10 11 12 13| 20 21 22 23
```

which is where `r * C + c` comes from: skip `r` full rows of `C`, then `c` more. The inverse is `r = i / C`, `c = i % C`. The layout also decides which loop order is fast: iterating `r` outer and `c` inner walks memory sequentially; `c` outer and `r` inner jumps `C` elements every step. Keep rows on the outside.

## Reading a grid from standard input

The conventional input is `R C` on the first line, then `R` lines of `C` values:

```cpp
int rows = 0, cols = 0;
std::cin >> rows >> cols;
std::vector<std::vector<int>> grid(rows, std::vector<int>(cols));
for (int r = 0; r < rows; ++r) {
    for (int c = 0; c < cols; ++c) {
        std::cin >> grid[r][c];
    }
}
```

`>>` skips whitespace, so it does not matter whether the numbers arrive one row per line or all on one line. A character grid (`.` and `#`) is even simpler — a `std::string` *is* a row of `char`:

```cpp
std::vector<std::string> board(rows);
for (std::string& row : board) std::cin >> row;    // one token per row, no spaces inside
char cell = board[1][2];
```

## Visiting the neighbours

Every flood fill, path search, Game of Life step and "count adjacent mines" is the same loop. Put the offsets in two parallel arrays so the body has one shape:

```cpp
constexpr int DR[4] = {-1, 1, 0, 0};    // up, down, left, right
constexpr int DC[4] = {0, 0, -1, 1};

for (int d = 0; d < 4; ++d) {
    int nr = r + DR[d];
    int nc = c + DC[d];
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;   // off the grid
    // grid[nr][nc] is a real neighbour
}
```

For eight neighbours, either extend the arrays to eight entries or loop `dr` and `dc` over `-1..1` and skip `(0, 0)`:

```cpp
for (int dr = -1; dr <= 1; ++dr) {
    for (int dc = -1; dc <= 1; ++dc) {
        if (dr == 0 && dc == 0) continue;
        int nr = r + dr;
        int nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] == '#') ++count;
    }
}
```

The direction-array form is what you want when the neighbour rule is part of the problem — knight moves are eight `(±1, ±2)` pairs, hex grids have six — because the rule lives in data rather than in the code.

## Bounds checks belong before the access

`grid[r][c]` on a vector of vectors, a flat vector and a built-in array all have the same contract: an index outside `[0, size)` is undefined behaviour, and a neighbour loop is where it happens — `r = 0` going up, `c = cols - 1` going right. The check in the loop above is the whole defence; a helper keeps it in one place:

```cpp
bool inside(int r, int c, int rows, int cols) {
    return r >= 0 && r < rows && c >= 0 && c < cols;
}
```

`.at(r).at(c)` throws `std::out_of_range` instead — but an uncaught exception is still a failed run; the check is what you want. With a jagged `std::vector<std::vector<int>>`, the row bound is `grid[r].size()`, not a shared `cols`.

## Passing a grid to a function

```cpp
using Grid = std::vector<std::vector<int>>;

long long row_sum(const Grid& g, int r) {
    long long total = 0;
    for (int x : g[r]) total += x;
    return total;
}

void clear(Grid& g) {
    for (auto& row : g) {
        for (int& x : row) x = 0;
    }
}
```

By `const Grid&` to read, `Grid&` to modify — the rules from lessons 4 and 5. A `Grid` by value copies every row; it is the single most common accidental copy in grid code. A built-in 2-D array is passed as `int (&g)[3][4]` or `int g[][4]` with the row count alongside.

## Transpose and rotate

Index games rather than algorithms:

```cpp
// transpose: R×C → C×R
std::vector<std::vector<int>> t(cols, std::vector<int>(rows));
for (int r = 0; r < rows; ++r) {
    for (int c = 0; c < cols; ++c) t[c][r] = grid[r][c];
}

// rotate 90° clockwise: (r, c) → (c, R - 1 - r)
std::vector<std::vector<int>> rot(cols, std::vector<int>(rows));
for (int r = 0; r < rows; ++r) {
    for (int c = 0; c < cols; ++c) rot[c][rows - 1 - r] = grid[r][c];
}
```

## Pitfalls

- **`std::vector<std::vector<int>> g(R, C);`** does not compile — the second argument must be a row, `std::vector<int>(C)`. The error says no matching constructor for `(int, int)`; the fix is the inner vector.
- **Swapped loop bounds.** `for (r < cols)` and `for (c < rows)` are undefined behaviour the moment `rows != cols`. Name the variables `rows`/`cols` or `R`/`C`, never `n`/`m`.
- **`x`/`y` confusion.** `grid[y][x]` is the row-major order when you think in coordinates; `grid[x][y]` silently transposes. Use `r`/`c` and the question never comes up.
- **Neighbour without the bounds check.** Corner cells reach index `-1`.
- **`std::vector<bool>`** as a visited grid works but is not a real container of `bool` (Module 13); `std::vector<char>` when it matters.

## Key takeaways

- A grid is one block of memory read through two indices; row-major means `(r, c)` lives at `r * C + c`.
- `std::vector<std::vector<int>> g(R, std::vector<int>(C))` for run-time sizes; `std::array` of `std::array` for compile-time; a flat vector for speed.
- Read `R C` then `R × C` values with two nested loops; a character row is a `std::string`.
- Neighbours are direction arrays plus a bounds check *before* the access.
- Pass grids by `const Grid&` or `Grid&`; keep rows as the outer loop.

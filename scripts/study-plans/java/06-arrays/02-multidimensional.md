---
title: Two-dimensional and jagged arrays
minutes: 12
---
Java has no true multi-dimensional arrays. `int[][]` is an *array of arrays*: an outer array whose elements are references to inner arrays, each of which can be any length — or null. That model explains everything about how grids are created, iterated, copied and sized, and it is what makes "jagged" arrays possible.

## Creating a grid

```java
int[][] grid = new int[3][4];       // 3 rows, each a new int[4] of zeros
grid[1][2] = 7;                     // row 1, column 2
grid.length                         // 3 — the number of rows
grid[0].length                      // 4 — the length of row 0
int[][] literal = {
    {1, 2, 3},
    {4, 5, 6},
};                                  // 2 × 3, trailing comma allowed
```

`new int[3][4]` allocates **four** objects: the outer `int[3]` and three `int[4]`s. Row-major is the convention — `grid[row][col]` — but nothing enforces it; it is simply the order of the indices.

## Iterating

```java
for (int r = 0; r < grid.length; r++) {
    for (int c = 0; c < grid[r].length; c++) {     // grid[r].length, not grid[0].length, if rows may differ
        System.out.print(grid[r][c] + " ");
    }
    System.out.println();
}

for (int[] row : grid) {          // for-each over rows
    for (int v : row) { … }
}
```

Iterating row by row (outer loop over rows) walks memory in the order it is laid out and is cache-friendly; column-first loops over a large grid are measurably slower.

## Jagged arrays

Because rows are independent arrays, they need not be the same length:

```java
int[][] triangle = new int[4][];        // 4 rows, all NULL
for (int r = 0; r < 4; r++) {
    triangle[r] = new int[r + 1];        // row r has r + 1 slots
}
// triangle[3].length == 4, triangle[0].length == 1

int[][] ragged = {{1}, {2, 3}, {}, {4, 5, 6}};   // literal jagged array; row 2 is empty
```

`new int[4][]` with the second dimension omitted creates only the outer array; each row is `null` until assigned. Pascal's triangle, adjacency lists, and "rows read from input of varying width" are natural jagged arrays.

Consequences: `grid[0].length` is not "the width" unless you know the grid is rectangular; a row may be `null` (NPE on `grid[r].length`); and `grid[r] = grid[0]` makes two rows the *same* array.

## Rows are references

```java
int[][] a = new int[2][2];
int[] row = a[0];
row[1] = 9;                       // a[0][1] is now 9 — row IS a[0]

int[][] b = a.clone();            // shallow: b is a new outer array, but b[0] == a[0]
b[0][0] = 5;                      // a[0][0] is also 5
```

`clone()`, `Arrays.copyOf` and `System.arraycopy` on the outer array copy the **row references**, not the rows. A deep copy is a loop: `for (r …) b[r] = a[r].clone();` (or `Arrays.stream(a).map(int[]::clone).toArray(int[][]::new)`).

The same applies to printing and comparing: `Arrays.toString(grid)` prints `[[I@…, [I@…]`; use `Arrays.deepToString(grid)`. `Arrays.equals(a, b)` compares row references; `Arrays.deepEquals(a, b)` compares contents.

## Three and more dimensions

`int[][][] cube = new int[2][3][4];` — an array of 2 arrays of 3 arrays of 4 ints. Same rules, one more level. Beyond three dimensions, consider a flat array with computed indices.

## Flat arrays as grids

For performance-critical grids (image processing, dynamic programming tables), a single `int[rows * cols]` indexed as `a[r * cols + c]` avoids the per-row indirection and the extra objects, and keeps everything in one contiguous block. It is less readable; use it when measurement says so.

## Reading a grid from input

```java
int rows = in.nextInt(), cols = in.nextInt();
int[][] g = new int[rows][cols];
for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
        g[r][c] = in.nextInt();
```

For a character grid (mazes, boards): `char[][] board = new char[rows][]; for (r …) board[r] = in.next().toCharArray();` — each line becomes a row.

## Common patterns

- **Transpose** (rectangular): `t[c][r] = g[r][c]` with `t = new int[cols][rows]`.
- **Neighbours**: check bounds `0 <= nr && nr < rows && 0 <= nc && nc < cols` before `g[nr][nc]`; direction arrays `int[] dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1}` avoid four copies of the check.
- **Row sums / column sums**: two nested loops; column sums accumulate into `colSum[c]` while walking rows.
- **Diagonals**: main diagonal `g[i][i]`; anti-diagonal `g[i][n - 1 - i]`.

## Interview angle

- *"Is `int[][]` a matrix?"* An array of arrays; rows are separate objects and may differ in length.
- *"How many objects does `new int[3][4]` create?"* Four.
- *"Why does `clone()` on a 2D array not copy the contents?"* It copies the outer array's references to the same rows.
- *"How do you print a 2D array?"* `Arrays.deepToString`.

## Key takeaways

- `int[][]` is an array of row arrays; `grid.length` is rows, `grid[r].length` is that row's length.
- `new int[n][]` leaves rows null; rows may be jagged and may be shared.
- Copying, comparing and printing the outer array is shallow — use `deepToString`, `deepEquals`, and clone each row.
- Iterate row-major; bounds-check neighbours with direction arrays.

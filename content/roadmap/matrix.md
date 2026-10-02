---
title: Matrix and Grid Traversal
stage: matrix
order: 1
minutes: 13
level: Beginner
hub: matrix
practice: transpose-matrix, matrix-diagonal-sum, flood-fill, spiral-matrix, rotate-image, set-matrix-zeroes, search-a-2d-matrix, search-a-2d-matrix-ii, game-of-life
updated: 2026-10-03
seo-title: Matrix and Grid Traversal: Spiral, Rotate, Search & Code
description: Learn matrix traversal: row-major storage, spiral order, rotating in place, the staircase search and grid neighbours, in C++, Java, Python and JavaScript.
question: How do you traverse a matrix or grid in coding problems?
answer: A matrix is a 2D array indexed by row and then column, stored row by row in memory. Grid problems are traversals with careful bookkeeping: nested loops over rows and columns, four shrinking boundaries for spiral order, a transpose and a row reversal to rotate in place, and direction arrays with a bounds check to visit neighbours. Visiting every cell costs O(m × n).
q: How is a 2D array stored in memory?
a: A true 2D array in C or C++ is one block in row-major order: all of row 0, then all of row 1, so cell (r, c) sits at offset r × cols + c. Java, Python and JavaScript store an array of separate row arrays, but each row is still laid out on its own. Either way, looping row by row reads memory in order and is faster than looping column by column.
q: How do you rotate a matrix by 90 degrees in place?
a: Transpose it, swapping matrix[i][j] with matrix[j][i] for every j greater than i, then reverse each row. The transpose sends (i, j) to (j, i) and the reversal sends that to (j, n − 1 − i), which is exactly where a clockwise quarter turn puts the cell. It takes O(n²) time and O(1) extra space; for an anticlockwise turn, reverse each row first and then transpose.
q: How do you print a matrix in spiral order?
a: Keep four boundaries, top, bottom, left and right, and walk the outer ring: along the top row, down the right column, back along the bottom row and up the left column, moving each boundary inwards once its side is done. Repeat until the boundaries cross, and check that a row or column is still left before the third and fourth sides, or a middle row is printed twice.
q: How do you find the neighbours of a cell in a grid?
a: Store the four moves as direction arrays, dr = [-1, 1, 0, 0] and dc = [0, 0, -1, 1], and loop over them: neighbour k is (r + dr[k], c + dc[k]). Skip any neighbour whose row is outside 0 to rows − 1 or whose column is outside 0 to cols − 1. Problems with eight directions add the four diagonal moves.
q: How do you search a matrix whose rows and columns are sorted?
a: Start at the top-right corner. If the value there is larger than the target, everything below it in that column is larger too, so move left; if it is smaller, everything to its left in that row is smaller, so move down. Each step rules out a whole row or column, so the search takes at most m + n steps.
---
A **matrix** is a grid of values in rows and columns: an image is a matrix of pixels, a map a matrix of land and water, a spreadsheet a matrix of cells. Matrix problems rarely need a clever algorithm. They need exact bookkeeping — which index is the row, where the edges are, which cells have been visited, and in what order to walk so that nothing is skipped or seen twice.

## How a matrix is stored in memory

Memory is one long line, so C, C++, Java, Python and JavaScript all flatten a matrix in **row-major order**: row 0, then row 1, and so on. A Java `int[][]` or a list of lists is an outer array of separate rows, but each row is still laid out on its own, so **neighbours in a row are neighbours in memory, and neighbours in a column are a whole row apart.**

@figure row-major

That is why loop order matters: a processor fetches memory in blocks, so a row-by-row loop uses all of each block and a column-by-column loop one value of it. Put the row loop outside. The offset formula also runs backwards, which is how [Search a 2D Matrix](/problems/search-a-2d-matrix) becomes an ordinary [binary search](/roadmap/binary-search) on the flat index.

## Indexing, bounds and the usual walks

Write every index as `matrix[row][col]` and name the sizes once: `rows = matrix.length`, `cols = matrix[0].length`. If a problem speaks of `(x, y)`, x is usually the column, so translate once at the top. A cell is inside the grid when `0 <= r < rows` and `0 <= c < cols`.

Beyond row by row and column by column, the walks you need are the diagonals, and every diagonal has a number of its own.

@figure diagonals

Grouping cells by `r - c` solves [Sort the Matrix Diagonally](/problems/sort-the-matrix-diagonally) and [Toeplitz Matrix](/problems/toeplitz-matrix). [Matrix Diagonal Sum](/problems/matrix-diagonal-sum) adds both diagonals and subtracts the centre once when n is odd.

## Spiral order: four boundaries

[Spiral Matrix](/problems/spiral-matrix) asks for every element in clockwise spiral order. Keep four **boundaries** — `top`, `bottom`, `left`, `right` — around the part not yet visited:

- Walk the top row, the right column, the bottom row backwards and the left column upwards, moving each boundary inwards once its side is done.
- Stop when `top > bottom` or `left > right`.
- Before the bottom row and the left column, check that a row and a column are still left.

@figure spiral

**Why it works.** The boundaries keep an **invariant**: *the cells not yet visited are exactly the rectangle from row `top` to `bottom` and column `left` to `right`*. Each side walks one edge of that rectangle and then removes it, so every cell is visited once and the loop ends when the rectangle is empty. The checks exist because a rectangle with no rows left has no bottom row to walk.

### The code

The program runs the matrix above and a single column, which needs the other check.

```cpp
#include <iostream>
#include <vector>
using namespace std;

// Every element in clockwise spiral order, starting at the top-left corner.
vector<int> spiralOrder(const vector<vector<int>>& matrix) {
    vector<int> out;
    if (matrix.empty()) return out;
    int top = 0, bottom = (int)matrix.size() - 1;
    int left = 0, right = (int)matrix[0].size() - 1;
    // Invariant: the cells not visited yet are rows top..bottom, columns left..right.
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);    // top row
        top++;
        for (int r = top; r <= bottom; r++) out.push_back(matrix[r][right]);  // right column
        right--;
        if (top <= bottom) {  // a row is still left: the bottom one, backwards
            for (int c = right; c >= left; c--) out.push_back(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {  // a column is still left: the left one, upwards
            for (int r = bottom; r >= top; r--) out.push_back(matrix[r][left]);
            left++;
        }
    }
    return out;
}

int main() {
    vector<vector<vector<int>>> inputs = {
        {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
        {{1}, {2}, {3}},
    };
    for (const vector<vector<int>>& matrix : inputs) {
        cout << matrix.size() << " x " << matrix[0].size() << " spiral:";
        for (int v : spiralOrder(matrix)) cout << " " << v;
        cout << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // Every element in clockwise spiral order, starting at the top-left corner.
    static List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> out = new ArrayList<>();
        if (matrix.length == 0) return out;
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        // Invariant: the cells not visited yet are rows top..bottom, columns left..right.
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(matrix[top][c]);    // top row
            top++;
            for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);  // right column
            right--;
            if (top <= bottom) { // a row is still left: the bottom one, backwards
                for (int c = right; c >= left; c--) out.add(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) { // a column is still left: the left one, upwards
                for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);
                left++;
            }
        }
        return out;
    }

    public static void main(String[] args) {
        int[][][] inputs = {
            {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
            {{1}, {2}, {3}},
        };
        for (int[][] matrix : inputs) {
            StringBuilder line = new StringBuilder(matrix.length + " x " + matrix[0].length + " spiral:");
            for (int v : spiralOrder(matrix)) line.append(" ").append(v);
            System.out.println(line);
        }
    }
}
```

```python
def spiral_order(matrix):
    """Every element in clockwise spiral order, starting at the top-left corner."""
    out = []
    if not matrix:
        return out
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    # Invariant: the cells not visited yet are rows top..bottom, columns left..right.
    while top <= bottom and left <= right:
        for c in range(left, right + 1):  # top row
            out.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):  # right column
            out.append(matrix[r][right])
        right -= 1
        if top <= bottom:  # a row is still left: the bottom one, backwards
            for c in range(right, left - 1, -1):
                out.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:  # a column is still left: the left one, upwards
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out


inputs = [
    [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
    [[1], [2], [3]],
]
for matrix in inputs:
    print(f"{len(matrix)} x {len(matrix[0])} spiral:", *spiral_order(matrix))
```

```javascript
// Every element in clockwise spiral order, starting at the top-left corner.
function spiralOrder(matrix) {
  const out = [];
  if (matrix.length === 0) return out;
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  // Invariant: the cells not visited yet are rows top..bottom, columns left..right.
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]); // top row
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]); // right column
    right--;
    if (top <= bottom) {
      // a row is still left: the bottom one, backwards
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      // a column is still left: the left one, upwards
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}

const inputs = [
  [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
  [[1], [2], [3]],
];
for (const matrix of inputs) {
  console.log(`${matrix.length} x ${matrix[0].length} spiral: ${spiralOrder(matrix).join(" ")}`);
}
```

```output
3 x 4 spiral: 1 2 3 4 8 12 11 10 9 5 6 7
3 x 1 spiral: 1 2 3
```

The same boundaries write a spiral instead of reading one in [Spiral Matrix II](/problems/spiral-matrix-ii).

## Rotating 90° in place: transpose, then reverse

[Rotate Image](/problems/rotate-image) asks for a quarter turn clockwise of an n × n matrix **in place** — a second matrix would cost another million values for a 1,000 × 1,000 image. Two passes of plain swaps do it:

1. **Transpose**: swap `matrix[i][j]` with `matrix[j][i]` for every `j > i`.
2. **Reverse each row** with [two pointers](/roadmap/two-pointers).

@walkthrough

## Why transpose and reverse is a rotation

A quarter turn clockwise sends `(i, j)` to `(j, n - 1 - i)`. The transpose sends `(i, j)` to `(j, i)`, and reversing a row sends column c to `n - 1 - c`, so together they send `(i, j)` to `(j, n - 1 - i)` — the rotation, for every cell at once.

@figure rotate-why

The transpose loop must start `j` at `i + 1`, or each pair swaps twice and nothing changes; and only a **square** matrix transposes in place, which is why [Transpose Matrix](/problems/transpose-matrix) builds a new array. Anticlockwise is the same parts in the other order: reverse each row, then transpose.

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// Mirror across the main diagonal: (i, j) <-> (j, i). Only j > i, or each pair swaps back.
void transpose(vector<vector<int>>& m) {
    int n = (int)m.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);
}

// Reverse every row with two pointers: (r, c) <-> (r, n - 1 - c).
void reverseRows(vector<vector<int>>& m) {
    int n = (int)m.size();
    for (int r = 0; r < n; r++)
        for (int left = 0, right = n - 1; left < right; left++, right--) swap(m[r][left], m[r][right]);
}

void print(const string& label, const vector<vector<int>>& m) {
    cout << label << "\n";
    for (const vector<int>& row : m) {
        for (int c = 0; c < (int)row.size(); c++) cout << (c ? " " : "") << row[c];
        cout << "\n";
    }
}

int main() {
    vector<vector<int>> m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    print("Before:", m);
    transpose(m);    // (i, j) -> (j, i)
    print("Transposed:", m);
    reverseRows(m);  // (j, i) -> (j, n - 1 - i): a quarter turn clockwise
    print("Rotated:", m);
    return 0;
}
```

```java
public class Main {
    // Mirror across the main diagonal: (i, j) <-> (j, i). Only j > i, or each pair swaps back.
    static void transpose(int[][] m) {
        int n = m.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int t = m[i][j];
                m[i][j] = m[j][i];
                m[j][i] = t;
            }
    }

    // Reverse every row with two pointers: (r, c) <-> (r, n - 1 - c).
    static void reverseRows(int[][] m) {
        int n = m.length;
        for (int r = 0; r < n; r++)
            for (int left = 0, right = n - 1; left < right; left++, right--) {
                int t = m[r][left];
                m[r][left] = m[r][right];
                m[r][right] = t;
            }
    }

    static void print(String label, int[][] m) {
        System.out.println(label);
        for (int[] row : m) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < row.length; c++) line.append(c > 0 ? " " : "").append(row[c]);
            System.out.println(line);
        }
    }

    public static void main(String[] args) {
        int[][] m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        print("Before:", m);
        transpose(m);   // (i, j) -> (j, i)
        print("Transposed:", m);
        reverseRows(m); // (j, i) -> (j, n - 1 - i): a quarter turn clockwise
        print("Rotated:", m);
    }
}
```

```python
def transpose(m):
    """Mirror across the main diagonal: (i, j) <-> (j, i). Only j > i, or each pair swaps back."""
    n = len(m)
    for i in range(n):
        for j in range(i + 1, n):
            m[i][j], m[j][i] = m[j][i], m[i][j]


def reverse_rows(m):
    """Reverse every row with two pointers: (r, c) <-> (r, n - 1 - c)."""
    n = len(m)
    for r in range(n):
        left, right = 0, n - 1
        while left < right:
            m[r][left], m[r][right] = m[r][right], m[r][left]
            left += 1
            right -= 1


def show(label, m):
    print(label)
    for row in m:
        print(*row)


m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
show("Before:", m)
transpose(m)     # (i, j) -> (j, i)
show("Transposed:", m)
reverse_rows(m)  # (j, i) -> (j, n - 1 - i): a quarter turn clockwise
show("Rotated:", m)
```

```javascript
// Mirror across the main diagonal: (i, j) <-> (j, i). Only j > i, or each pair swaps back.
function transpose(m) {
  const n = m.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [m[i][j], m[j][i]] = [m[j][i], m[i][j]];
    }
  }
}

// Reverse every row with two pointers: (r, c) <-> (r, n - 1 - c).
function reverseRows(m) {
  const n = m.length;
  for (let r = 0; r < n; r++) {
    for (let left = 0, right = n - 1; left < right; left++, right--) {
      [m[r][left], m[r][right]] = [m[r][right], m[r][left]];
    }
  }
}

function print(label, m) {
  console.log(label);
  for (const row of m) console.log(row.join(" "));
}

const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
print("Before:", m);
transpose(m); // (i, j) -> (j, i)
print("Transposed:", m);
reverseRows(m); // (j, i) -> (j, n - 1 - i): a quarter turn clockwise
print("Rotated:", m);
```

```output
Before:
1 2 3
4 5 6
7 8 9
Transposed:
1 4 7
2 5 8
3 6 9
Rotated:
7 4 1
8 5 2
9 6 3
```

## Set matrix zeroes with O(1) extra space

[Set Matrix Zeroes](/problems/set-matrix-zeroes): wherever there is a 0, set its whole row and column to 0. You must finish **reading** before you start **writing**. Two boolean arrays of marked rows and columns cost O(m + n); for O(1), the marks go into the matrix's own first row and column.

@figure set-zeroes

Each step's place is forced: the first row and column are saved before they become notepads, and they are zeroed last, because doing it earlier would wipe marks the inner pass still reads.

## Searching a sorted matrix: the staircase walk

In [Search a 2D Matrix II](/problems/search-a-2d-matrix-ii) every row and column is sorted, but rows do not continue each other. Scanning is O(m × n) — a million comparisons for a 1,000 × 1,000 matrix. From the **top-right** corner one comparison discards a whole row or column, so the walk takes at most m + n steps: 2,000.

@figure staircase

## Grid neighbours and direction arrays

Most grid problems step from a cell to the cells next to it. Rather than four hand-written `if` blocks, list the moves once as **direction arrays** and loop.

@figure neighbours

[Game of Life](/problems/game-of-life) uses all eight directions, and every cell must be updated from the old board: work from a copy, or keep both states in each cell with a [bit manipulation](/roadmap/bit-manipulation) trick.

## A grid is a graph

Once you can list a cell's neighbours, a grid **is** a graph: each cell is a node, joined to the neighbours the problem lets you step to. [Flood Fill](/problems/flood-fill) is a [depth-first search](/roadmap/depth-first-search); [Number of Islands](/problems/number-of-islands) counts the searches needed to cover the land; a shortest path through a grid is a [breadth-first search](/roadmap/breadth-first-search). Mark each cell visited when you first reach it.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Spiral order | four boundaries | O(m × n) | O(1) |
| Rotate n × n | transpose, then reverse rows | O(n²) | O(1) |
| Set matrix zeroes | first row and column as markers | O(m × n) | O(1) |
| Search, sorted rows and columns | staircase walk | O(m + n) | O(1) |
| Search, rows continue each other | binary search, flat index | O(log(m × n)) | O(1) |
| Flood fill, islands | DFS or BFS | O(m × n) | O(m × n) |

Reading every cell once is the floor; the gains come from not looking (the staircase) or not copying (rotation and zeroes in place).

## How to recognise a matrix problem

- The input is a **grid, board, image or m × n matrix**.
- It asks for an **order of visiting**: spiral, diagonal, layer by layer.
- It says **in place** about a rotation or flip: look for a composition of swaps.
- Rows and columns are **sorted**: the staircase walk or a binary search.
- It says **adjacent, connected, islands**: a graph search over the grid.

## Common mistakes

- **Rows and columns swapped**: test a non-square matrix.
- **Transposing every pair**: starting `j` at 0 swaps each pair back.
- **Skipping the spiral checks**: a middle row is printed twice.
- **Writing while still reading**: new values are read as old ones.
- **Reading before the bounds check**: Python's negative index reads the other end silently.
- **Not marking visited cells**: in Flood Fill, a new colour equal to the old one loops forever.

## Practice in this order

1. [Transpose Matrix](/problems/transpose-matrix): a result of a different shape.
2. [Matrix Diagonal Sum](/problems/matrix-diagonal-sum): the two diagonals.
3. [Flood Fill](/problems/flood-fill): direction arrays and a first grid search.
4. [Spiral Matrix](/problems/spiral-matrix): four boundaries.
5. [Rotate Image](/problems/rotate-image): transpose, then reverse.
6. [Set Matrix Zeroes](/problems/set-matrix-zeroes): markers in row 0 and column 0.
7. [Search a 2D Matrix](/problems/search-a-2d-matrix): one sorted list in disguise.
8. [Search a 2D Matrix II](/problems/search-a-2d-matrix-ii): the staircase walk.
9. [Game of Life](/problems/game-of-life): eight neighbours, updated at once.

The [matrix problem list](/challenges/matrix) has every grid problem in the catalogue, from easy to hard. When these feel routine, the next stage is [bit manipulation](/roadmap/bit-manipulation), and grids come back later as graphs.

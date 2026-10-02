---
title: Matrix and Grid Traversal
stage: matrix
order: 1
minutes: 22
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
A **matrix** is a grid of values arranged in rows and columns: an image is a matrix of pixels, a chessboard a matrix of squares, a map a matrix of land and water, a spreadsheet a matrix of cells. Matrix problems rarely need a clever algorithm. What they need is exact bookkeeping: which index is the row, where the edges are, which cells have been visited, and in what order to walk so that nothing is skipped or seen twice.

This lesson covers how a matrix sits in memory and why that decides your loop order, the standard walks (rows, columns, diagonals, spiral), rotating in place with a proof that it works, setting rows and columns to zero without extra memory, searching a sorted matrix, and the direction arrays that turn a grid into a graph. Every program is shown in C++, Java, Python and JavaScript.

## How a matrix is stored in memory

Memory is one long line of bytes, so a 2D matrix has to be flattened somehow. C, C++, Java, Python and JavaScript all use **row-major order**: row 0 first, then row 1, and so on.

```text
 matrix, 3 rows and 4 columns           how a C++ int[3][4] sits in memory
        c=0  c=1  c=2  c=3
 r=0  [  1    2    3    4 ]             1 2 3 4 | 5 6 7 8 | 9 10 11 12
 r=1  [  5    6    7    8 ]
 r=2  [  9   10   11   12 ]             offset of (r, c) = r × cols + c
                                        (2, 1) -> 2 × 4 + 1 = 9, the value 10
```

A C++ array declared as `int a[3][4]` is exactly that one block. A `vector<vector<int>>` in C++, an `int[][]` in Java, a list of lists in Python and an array of arrays in JavaScript are slightly different: an outer array holding a separate inner array for each row. Each row is laid out on its own, and in those languages rows can even have different lengths. For problem solving the consequence is the same: **neighbours in a row are neighbours in memory; neighbours in a column are a whole row apart.**

That is why the loop order matters. A processor never fetches a single integer from memory. It fetches a **cache line**, usually 64 bytes, which holds sixteen 4-byte integers. A row-by-row loop uses all sixteen before it needs the next line. A column-by-column loop jumps a whole row's width at every step, so each fetched line gives it one useful value, and on a matrix larger than the cache the line is gone again before the loop comes back for its neighbours. In C++ or Java, summing a large matrix column by column can be several times slower than summing it row by row, for exactly the same number of additions. Unless a problem needs column order, put the row loop outside.

The offset formula also works backwards, which is useful on its own. Cell number `k` of an m × n matrix, counted row by row, is at row `k / n` and column `k % n`. That lets you treat a matrix as one flat list of m × n entries, which is how [Search a 2D Matrix](/problems/search-a-2d-matrix) becomes an ordinary [binary search](/roadmap/binary-search) when every row continues where the previous one ended.

## Indexing, bounds and the usual walks

Write every index as `matrix[row][col]`, row first, and name the sizes once: `rows = matrix.length` and `cols = matrix[0].length`. A statement's "m × n matrix" means m rows and n columns. If a problem talks about `(x, y)` coordinates, x is usually the column and y the row, the reverse of the indexing order, so translate them once at the top and never again.

A cell `(r, c)` is inside the grid when `0 <= r < rows` and `0 <= c < cols`. Every walk that steps off a known path needs that test before it reads the cell, and it is the single most common source of crashes in grid code.

The standard walks are short enough to know by heart:

- **Row by row:** the outer loop over `r`, the inner over `c`. The default.
- **Column by column:** swap the two loops. Use it only when the question is about columns.
- **The main diagonal:** cells with `r == c`, so one loop of length n, not two nested loops with an `if`.
- **The anti-diagonal:** cells with `r + c == n - 1`, that is `(i, n - 1 - i)`.
- **Every diagonal:** each top-left to bottom-right diagonal has a constant `r - c`, and each anti-diagonal a constant `r + c`. Grouping cells by that number is how [Sort the Matrix Diagonally](/problems/sort-the-matrix-diagonally) and [Toeplitz Matrix](/problems/toeplitz-matrix) are solved.

```text
 r - c on each cell      r + c on each cell
   0 -1 -2                 0  1  2
   1  0 -1                 1  2  3
   2  1  0                 2  3  4
```

[Matrix Diagonal Sum](/problems/matrix-diagonal-sum) is the first test of this: add `mat[i][i]` and `mat[i][n - 1 - i]` for each i, and subtract the centre once when n is odd, because both diagonals pass through it.

## Spiral order: four boundaries

[Spiral Matrix](/problems/spiral-matrix) asks for every element in clockwise spiral order, starting at the top-left. Simulating a walker that turns right when it hits a wall works, but it needs a visited marker for every cell. The cleaner way is to keep four **boundaries**, `top`, `bottom`, `left` and `right`, around the part of the matrix not yet visited, and peel one ring at a time:

```text
 left        right
  v           v
[ 1   2   3   4 ]  < top        1. top row, left to right, then top++
[ 5   6   7   8 ]               2. right column, downwards, then right--
[ 9  10  11  12 ]  < bottom     3. bottom row, right to left, then bottom--
                                4. left column, upwards, then left++
```

The rules:

- Walk the four sides in that order, and move each boundary inwards as soon as its side is done.
- Stop when `top > bottom` or `left > right`: nothing is left.
- Before sides 3 and 4, check that a row (`top <= bottom`) and a column (`left <= right`) are still left. When the last remaining piece is a single row or column, sides 1 and 2 have already taken it, and walking sides 3 and 4 would visit those cells again.

### Why it works

The boundaries keep an **invariant**: *the cells not yet visited are exactly the rectangle from row `top` to row `bottom` and from column `left` to column `right`*. At the start that rectangle is the whole matrix. Walking the top row visits exactly that rectangle's top row, and `top++` removes it from the rectangle, so the invariant still holds; the same is true of each of the other three sides. Every cell is therefore visited exactly once, in spiral order, and the loop ends when the rectangle is empty. The two checks exist because a side can only be walked if the rectangle still has it: a rectangle with no rows left has no bottom row to walk.

### Dry run

The 3 × 4 matrix above. The boundaries are shown after each side as (top, bottom, left, right):

| Side | Walks | Adds | Boundaries after |
| --- | --- | --- | --- |
| top row | row 0, columns 0 to 3 | 1 2 3 4 | (1, 2, 0, 3) |
| right column | column 3, rows 1 to 2 | 8 12 | (1, 2, 0, 2) |
| bottom row | row 2, columns 2 down to 0 | 11 10 9 | (1, 1, 0, 2) |
| left column | column 0, row 1 | 5 | (1, 1, 1, 2) |
| top row | row 1, columns 1 to 2 | 6 7 | (2, 1, 1, 2) |
| right column | column 2, rows 2 to 1: empty | nothing | (2, 1, 1, 1) |
| bottom row | skipped, since top > bottom | nothing | (2, 1, 1, 1) |
| left column | column 1, rows 1 up to 2: empty | nothing | (2, 1, 2, 1) |

Without the `top <= bottom` check, the seventh row would walk row 1 from column 1 to column 1 and add 6 a second time. The program runs this matrix and a single column, which needs the other check.

### The code

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

The same four boundaries generate a spiral instead of reading one: [Spiral Matrix II](/problems/spiral-matrix-ii) writes 1, 2, 3 … into the cells in this order.

## Rotating 90° in place: transpose, then reverse

[Rotate Image](/problems/rotate-image) asks you to turn an n × n matrix a quarter turn clockwise, **in place**. The easy way is a second matrix: `rotated[j][n - 1 - i] = matrix[i][j]` for every cell. For a 1,000 × 1,000 image that is another million values of memory, and the problem forbids it.

The in-place way is two passes of plain swaps:

1. **Transpose**: swap `matrix[i][j]` with `matrix[j][i]` for every pair with `j > i`. This mirrors the matrix across its main diagonal, so rows become columns.
2. **Reverse each row**: swap `matrix[r][c]` with `matrix[r][n - 1 - c]`, the [two pointers](/roadmap/two-pointers) reversal on every row.

```text
 original        transposed      each row reversed
 1 2 3           1 4 7           7 4 1
 4 5 6    ->     2 5 8    ->     8 5 2
 7 8 9           3 6 9           9 6 3
```

@walkthrough

## Why transpose and reverse is a rotation

First, where does a quarter turn clockwise send the cell at `(i, j)`? Look at the top row: after the turn it is the right-hand column, read from the top. In general, row i becomes column `n - 1 - i`, and a cell's position along its row, j, becomes its position down that column, row j. So the turn sends `(i, j)` to `(j, n - 1 - i)`. You can check it on a corner: the top-left `(0, 0)` goes to `(0, n - 1)`, the top-right.

Now follow a cell through the two passes. The transpose sends `(i, j)` to `(j, i)`. Reversing a row keeps the row and sends column c to `n - 1 - c`, so `(j, i)` goes to `(j, n - 1 - i)`. Composed:

```text
 (i, j)  --transpose-->  (j, i)  --reverse row-->  (j, n - 1 - i)
```

That is exactly the rotation, for every cell, so the two passes together are the rotation. Both passes are made of swaps, which need one temporary variable, so the extra space is O(1). Each cell is touched a constant number of times, so the time is O(n²), the least possible when every value has to move.

Two details carry the proof. The transpose loop must start `j` at `i + 1`: if it ran over every j, each pair would be swapped twice and the matrix would end where it started. And the transpose is only an in-place operation on a **square** matrix; transposing a 2 × 3 matrix gives a 3 × 2 one, which is why [Transpose Matrix](/problems/transpose-matrix) builds a new array.

The other turns come from the same parts. Anticlockwise sends `(i, j)` to `(n - 1 - j, i)`: reverse each row first, then transpose. A half turn sends `(i, j)` to `(n - 1 - i, n - 1 - j)`: reverse each row, then reverse the order of the rows.

### Dry run

The transpose swaps only the three pairs above the diagonal; the diagonal 1, 5, 9 never moves:

| Step | Swap | Matrix after |
| --- | --- | --- |
| transpose | (0, 1) with (1, 0): 2 and 4 | 1 4 3 / 2 5 6 / 7 8 9 |
| transpose | (0, 2) with (2, 0): 3 and 7 | 1 4 7 / 2 5 6 / 3 8 9 |
| transpose | (1, 2) with (2, 1): 6 and 8 | 1 4 7 / 2 5 8 / 3 6 9 |
| reverse row 0 | (0, 0) with (0, 2): 1 and 7 | 7 4 1 / 2 5 8 / 3 6 9 |
| reverse row 1 | (1, 0) with (1, 2): 2 and 8 | 7 4 1 / 8 5 2 / 3 6 9 |
| reverse row 2 | (2, 0) with (2, 2): 3 and 9 | 7 4 1 / 8 5 2 / 9 6 3 |

The old first column, 1 4 7, read from the bottom up, is the new first row, 7 4 1: the left edge has swung round to the top.

### The code

The program prints the matrix after each pass, so you can see the transpose on its own.

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

[Set Matrix Zeroes](/problems/set-matrix-zeroes) says: wherever there is a 0, set its whole row and column to 0. The tempting loop, zeroing rows and columns as soon as you find a 0, is wrong. The zeroes it writes are found later by the same scan and treated as original, and they spread until most of the matrix is 0. You have to finish **reading** before you start **writing**.

The safe version records which rows and columns contain a 0 in two boolean arrays, then zeroes every cell whose row or column is marked: O(m + n) extra space. The follow-up asks for O(1), and the trick is to store those marks inside the matrix itself, in its first row and first column:

```text
1. first_row_zero = row 0 has a 0;  first_col_zero = column 0 has a 0
2. for every cell (r, c) with r >= 1 and c >= 1:
       if matrix[r][c] == 0: matrix[r][0] = 0; matrix[0][c] = 0     # mark row r and column c
3. for every cell (r, c) with r >= 1 and c >= 1:
       if matrix[r][0] == 0 or matrix[0][c] == 0: matrix[r][c] = 0
4. if first_row_zero: zero row 0;  if first_col_zero: zero column 0
```

Each step is there for a reason. The first row and column are about to be used as notepads, so step 1 saves whether they held a 0 of their own before anything is written into them. Step 2 only ever writes 0 into a cell whose row or column was going to be zeroed anyway, so the marks destroy nothing that matters. Step 3 reads the marks, and step 4 runs last because zeroing row 0 or column 0 any earlier would wipe out marks that step 3 still needs.

## Searching a sorted matrix: the staircase walk

In [Search a 2D Matrix II](/problems/search-a-2d-matrix-ii) every row is sorted left to right and every column top to bottom, but a row does not continue from the one above it. Scanning every cell is O(m × n): a million comparisons per query for a 1,000 × 1,000 matrix. The structure allows far fewer.

Start at the **top-right** corner and compare its value with the target:

- **Equal:** found.
- **Larger than the target:** every value below it in this column is larger still, because the column is sorted. None of them can be the target, so drop the column: move left.
- **Smaller than the target:** every value to its left in this row is smaller still. Drop the row: move down.

Each step discards a whole row or column, so the walk takes at most m + n steps: 2,000 instead of a million. The corner matters. From the top-left, moving right and moving down both make the value larger, so a comparison cannot tell you which way to go. From the top-right (or the bottom-left), one move makes it larger and the other smaller, and the comparison decides.

| Position | Value | Compared with 5 | Move |
| --- | --- | --- | --- |
| (0, 3) | 11 | larger | drop column 3, go left |
| (0, 2) | 7 | larger | drop column 2, go left |
| (0, 1) | 4 | smaller | drop row 0, go down |
| (1, 1) | 5 | equal | found |

That trace is the search for 5 in `[[1, 4, 7, 11], [2, 5, 8, 12], [3, 6, 9, 16], [10, 13, 14, 17]]`. If the walk leaves the grid, the target is not there.

## Grid neighbours and direction arrays

Most grid problems move from a cell to the cells next to it. Writing four `if` blocks for up, down, left and right invites a typo in one of them. Instead, list the moves once as **direction arrays** and loop:

```text
            (r-1, c)
               ^
 (r, c-1)  <- (r, c) ->  (r, c+1)
               v
            (r+1, c)

dr = [-1, 1,  0, 0]
dc = [ 0, 0, -1, 1]
for k in 0..3:
    nr = r + dr[k];  nc = c + dc[k]
    if 0 <= nr < rows and 0 <= nc < cols:      # bounds first, then read
        look at grid[nr][nc]
```

For eight directions, as in [Game of Life](/problems/game-of-life), add the four diagonal moves `(-1, -1), (-1, 1), (1, -1), (1, 1)`. Game of Life also shows the next difficulty: every cell must be updated from the old board, so writing new values straight into it would change the neighbour counts of cells not yet processed. Either work from a copy, or keep the old state readable by encoding both states in each cell, for example storing the next state in the second bit, `cell |= next << 1`, and shifting every cell right by one at the end. That second option is a [bit manipulation](/roadmap/bit-manipulation) trick.

## A grid is a graph

Once you can list a cell's neighbours, a grid **is** a graph: each cell is a node, and an edge joins two neighbouring cells when the problem's rule allows the step (same colour, both land, not a wall). Every graph traversal then works on grids unchanged.

- [Flood Fill](/problems/flood-fill) is a [depth-first search](/roadmap/depth-first-search) from the start pixel that recolours every pixel of the original colour it can reach.
- [Number of Islands](/problems/number-of-islands) runs a search from each unvisited land cell and counts how many searches it took.
- The shortest path through a grid, where every step costs the same, is a [breadth-first search](/roadmap/breadth-first-search) from the start, because BFS reaches cells in order of distance.

In each case, mark a cell as visited when you first reach it, either with a separate `visited` matrix or by overwriting the cell. Flood Fill shows why: if the new colour equals the old one, recolouring marks nothing, the search revisits the same cells forever, and the program never ends. Check for that case first and return the image unchanged.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Visit every cell | nested loops, rows outside | O(m × n) | O(1) |
| Spiral order | four boundaries | O(m × n) | O(1) besides the output |
| Rotate n × n | copy into a new matrix | O(n²) | O(n²) |
| Rotate n × n | transpose, then reverse rows | O(n²) | O(1) |
| Set matrix zeroes | marker arrays for rows and columns | O(m × n) | O(m + n) |
| Set matrix zeroes | first row and column as markers | O(m × n) | O(1) |
| Search, rows and columns sorted | scan every cell | O(m × n) | O(1) |
| Search, rows and columns sorted | staircase walk | O(m + n) | O(1) |
| Search, rows continue each other | binary search on the flat index | O(log(m × n)) | O(1) |
| Flood fill, islands | DFS or BFS | O(m × n) | O(m × n) in the worst case |

Visiting every cell once, O(m × n), is the floor for anything that has to look at every value. The improvements in this lesson come from not looking at every cell (the staircase and binary search) or from not copying the matrix (rotation and zeroes in place).

## How to recognise a matrix problem

Read the statement for these signals:

- The input is a **grid, board, image or m × n matrix**, or a 2D array of characters such as `'1'` and `'0'`.
- It asks for an **order of visiting**: spiral, diagonal, zigzag, layer by layer.
- It says **in place** about a rotation, a flip or a transform. Look for a composition of simple swaps, as with the transpose and reverse.
- Rows and columns are **sorted**. That points to the staircase walk or a binary search.
- It mentions **adjacent, 4-directionally, 8-directionally, connected, islands, regions**. That is a graph search over the grid.
- One cell's new value depends on its **neighbours' old values**, as in Game of Life. You need a copy or an encoding that keeps the old state readable.

## Common mistakes

- **Mixing up rows and columns.** Using `rows` for both loop bounds works on every square test and fails on the first m × n one. Name `rows` and `cols` once and test with a non-square matrix.
- **Transposing every pair.** Starting the inner loop at `j = 0` instead of `j = i + 1` swaps each pair twice, and the matrix comes out unchanged.
- **Skipping the spiral checks.** Without `top <= bottom` and `left <= right` before the last two sides, a middle row or column is printed twice.
- **Writing while you are still reading.** In Set Matrix Zeroes and Game of Life, values written mid-scan are read later as if they were original. Finish reading first, or encode the old state so it stays readable.
- **Reading before checking bounds.** Test `0 <= nr < rows` before touching `grid[nr][nc]`. In Python a negative index does not crash, it silently reads from the other end of the row, so the bug hides instead of failing.
- **Forgetting to mark visited cells.** A grid search that does not mark cells revisits them forever; in Flood Fill this happens exactly when the new colour equals the old one.

## Practice in this order

Start with the problems that are pure indexing, then the in-place transforms, then the walks that treat the grid as a graph:

1. [Transpose Matrix](/problems/transpose-matrix): swapping row and column indices, with a result of a different shape.
2. [Matrix Diagonal Sum](/problems/matrix-diagonal-sum): `r == c` and `r + c == n - 1`, counting the centre once.
3. [Flood Fill](/problems/flood-fill): direction arrays, bounds checks and a first grid search.
4. [Spiral Matrix](/problems/spiral-matrix): four boundaries and the two checks.
5. [Rotate Image](/problems/rotate-image): transpose, then reverse each row.
6. [Set Matrix Zeroes](/problems/set-matrix-zeroes): markers in the first row and column.
7. [Search a 2D Matrix](/problems/search-a-2d-matrix): one sorted list in disguise, searched by its flat index.
8. [Search a 2D Matrix II](/problems/search-a-2d-matrix-ii): the staircase walk.
9. [Game of Life](/problems/game-of-life): eight neighbours, all updated at once.

The [matrix problem list](/challenges/matrix) has every grid problem in the catalogue, from easy to hard. When these feel routine, the roadmap's next tier starts with bit manipulation, and the grids come back later as graphs, in breadth-first and depth-first search.

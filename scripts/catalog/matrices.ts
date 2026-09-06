/** Matrix / Grid — hand-authored classics (int[][] support).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtIntMat, ri, type CatalogProblem, type Rng } from "./types.js";

const genMat = (rng: Rng, rMax: number, cMax: number, lo: number, hi: number) => {
  const r = ri(rng, 1, rMax), c = ri(rng, 1, cMax);
  return Array.from({ length: r }, () => Array.from({ length: c }, () => ri(rng, lo, hi)));
};

const genSquare = (rng: Rng, nMax: number, lo: number, hi: number) => {
  const n = ri(rng, 1, nMax);
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, lo, hi)));
};

export const MATRIX_PROBLEMS: CatalogProblem[] = [

  // ── Transpose Matrix ────────────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => mat[0].map((_, j) => mat.map((row) => row[j]));
    return {
      slug: "transpose-matrix",
      title: "Transpose Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation"],
      signature: { funcName: "transpose", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given a 2D integer array `matrix`, return its **transpose** — the matrix flipped over its main diagonal, swapping row and column indices.",
        [
          { in: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", out: "[[1,4,7],[2,5,8],[3,6,9]]" },
          { in: "matrix = [[1,2,3],[4,5,6]]", out: "[[1,4],[2,5],[3,6]]" },
        ],
        ["1 <= rows, cols <= 8", "-100 <= matrix[i][j] <= 100"]),
      hints: [
        "The transposed matrix has dimensions cols × rows.",
        "out[j][i] = matrix[i][j].",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[1,4,7],[2,5,8],[3,6,9]]" },
        { input: "[[1,2,3],[4,5,6]]", expectedOutput: "[[1,4],[2,5],[3,6]]" },
      ],
      gen: (rng: Rng) => {
        const m = genMat(rng, 8, 8, -100, 100);
        return { input: fmtIntMat(m), expectedOutput: fmtIntMat(ref(m)) };
      },
      editorial: explain({
        idea: "Transposing swaps the roles of the two indices: the value at row `i`, column `j` becomes the value at row `j`, column `i`. The only wrinkle is that the result has the **opposite dimensions** — a `rows × cols` matrix transposes to `cols × rows` — so it cannot be done in place unless the matrix is square.",
        steps: [
          "Read the dimensions `rows` and `cols` from the input.",
          "Allocate the output with `cols` rows and `rows` columns.",
          "For every `i` and `j`, write `out[j][i] = matrix[i][j]`.",
          "Return the new matrix.",
        ],
        why: "The transpose is defined entrywise, so a single pass over every cell is both necessary and sufficient — there is no structure to exploit and no way to avoid touching each value once. Building a fresh matrix sidesteps the aliasing problem: an in-place swap only works when the shape is preserved, which is to say only for square matrices.",
        time: "O(rows · cols)",
        space: "O(rows · cols) for the output",
        pitfalls: [
          "The output dimensions are **swapped** — allocating `rows × cols` overflows or truncates for non-square input.",
          "Write `out[j][i]`, not `out[i][j]`; the latter just copies the matrix.",
          "In-place transposition is only valid for square matrices, and even then must swap only one triangle or it undoes itself.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef transpose(matrix: List[List[int]]) -> List[List[int]]:\n    return [list(row) for row in zip(*matrix)]`,
        javascript: `var transpose = function(matrix) {\n    const rows = matrix.length, cols = matrix[0].length;\n    const out = [];\n    for (let j = 0; j < cols; j++) {\n        const row = [];\n        for (let i = 0; i < rows; i++) row.push(matrix[i][j]);\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function transpose(matrix: number[][]): number[][] {\n    const rows = matrix.length;\n    const cols = matrix[0].length;\n    const out: number[][] = [];\n    for (let j = 0; j < cols; j++) {\n        const row: number[] = [];\n        for (let i = 0; i < rows; i++) row.push(matrix[i][j]);\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] transpose(int[][] matrix) {\n    int rows = matrix.length, cols = matrix[0].length;\n    int[][] out = new int[cols][rows];\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) out[j][i] = matrix[i][j];\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> transpose(vector<vector<int>>& matrix) {\n    int rows = (int) matrix.size(), cols = (int) matrix[0].size();\n    vector<vector<int>> out(cols, vector<int>(rows, 0));\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) out[j][i] = matrix[i][j];\n    }\n    return out;\n}`,
              c: `int** transpose(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {\n    int rows = matrixSize;\n    int cols = matrixColSize[0];\n    int** out = (int**) malloc(cols * sizeof(int*));\n    int* sizes = (int*) malloc(cols * sizeof(int));\n    for (int j = 0; j < cols; j++) {\n        out[j] = (int*) malloc(rows * sizeof(int));\n        sizes[j] = rows;\n        for (int i = 0; i < rows; i++) out[j][i] = matrix[i][j];\n    }\n    *returnSize = cols;\n    *returnColumnSizes = sizes;\n    return out;\n}`,
              csharp: `public static int[][] Transpose(int[][] matrix)\n{\n    int rows = matrix.Length, cols = matrix[0].Length;\n    int[][] res = new int[cols][];\n    for (int j = 0; j < cols; j++)\n    {\n        res[j] = new int[rows];\n        for (int i = 0; i < rows; i++) res[j][i] = matrix[i][j];\n    }\n    return res;\n}`,
              go: `func transpose(matrix [][]int) [][]int {\n	rows := len(matrix)\n	cols := len(matrix[0])\n	out := make([][]int, cols)\n	for j := 0; j < cols; j++ {\n		out[j] = make([]int, rows)\n		for i := 0; i < rows; i++ {\n			out[j][i] = matrix[i][j]\n		}\n	}\n	return out\n}`,
              kotlin: `fun transpose(matrix: Array<IntArray>): Array<IntArray> {\n    val rows = matrix.size\n    val cols = matrix[0].size\n    return Array(cols) { j -> IntArray(rows) { i -> matrix[i][j] } }\n}`,
              swift: `func transpose(_ matrix: [[Int]]) -> [[Int]] {\n    let rows = matrix.count\n    let cols = matrix[0].count\n    var out = [[Int]](repeating: [Int](repeating: 0, count: rows), count: cols)\n    for i in 0..<rows {\n        for j in 0..<cols {\n            out[j][i] = matrix[i][j]\n        }\n    }\n    return out\n}`,
              rust: `fn transpose(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let rows = matrix.len();\n    let cols = matrix[0].len();\n    let mut out = vec![vec![0i32; rows]; cols];\n    for i in 0..rows {\n        for j in 0..cols {\n            out[j][i] = matrix[i][j];\n        }\n    }\n    out\n}`,
              php: `function transpose($matrix) {\n    $rows = count($matrix);\n    $cols = count($matrix[0]);\n    $out = array();\n    for ($j = 0; $j < $cols; $j++) {\n        $row = array();\n        for ($i = 0; $i < $rows; $i++) $row[] = $matrix[$i][$j];\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def transpose(matrix)\n  rows = matrix.length\n  cols = matrix[0].length\n  (0...cols).map { |j| (0...rows).map { |i| matrix[i][j] } }\nend`,
      },
    };
  })(),

  // ── Rotate Image ────────────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const n = matrix.length;
      return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => matrix[n - 1 - j][i]));
    };
    return {
      slug: "rotate-image",
      title: "Rotate Image",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Math"],
      signature: { funcName: "rotate", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `n x n` 2D matrix representing an image. Rotate the image by **90 degrees clockwise** and return the result.\n\nThe classic challenge solves it **in place**: transpose, then reverse each row.",
        [
          { in: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", out: "[[7,4,1],[8,5,2],[9,6,3]]" },
          { in: "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", out: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]" },
        ],
        ["1 <= n <= 8", "-100 <= matrix[i][j] <= 100"]),
      hints: [
        "Rotated[i][j] comes from matrix[n-1-j][i].",
        "In place: transpose across the main diagonal, then reverse every row.",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[7,4,1],[8,5,2],[9,6,3]]" },
        { input: "[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", expectedOutput: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]" },
      ],
      gen: (rng: Rng) => {
        const m = genSquare(rng, 8, -100, 100);
        return { input: fmtIntMat(m), expectedOutput: fmtIntMat(ref(m)) };
      },
      editorial: explain({
        idea: "A 90-degree clockwise rotation sends the value at `matrix[n-1-j][i]` to position `[i][j]` — the bottom-left corner becomes the top-left. The memorable in-place recipe is **transpose, then reverse each row**, which composes exactly into that mapping.",
        steps: [
          "Read `n`, the side length of the square matrix.",
          "Direct construction: set `out[i][j] = matrix[n - 1 - j][i]` for every cell.",
          "In-place alternative: swap `matrix[i][j]` with `matrix[j][i]` for `j > i` — a transpose across the main diagonal.",
          "Then reverse each row.",
          "Both produce the same result; the second uses no extra matrix.",
        ],
        why: "Transposing maps `(i, j)` to `(j, i)`, a reflection across the main diagonal. Reversing each row then maps `(i, j)` to `(i, n-1-j)`, a horizontal flip. Composing them sends the original `(i, j)` to `(j, n-1-i)` — precisely a 90-degree clockwise turn. Two reflections about intersecting axes always compose into a rotation, which is why this trick works.",
        time: "O(n^2)",
        space: "O(1) in place, or O(n^2) building a new matrix",
        pitfalls: [
          "When transposing in place, iterate only the upper triangle (`j > i`). Covering all pairs swaps everything twice and leaves the matrix unchanged.",
          "The order matters: transpose then reverse rows gives clockwise; reversing first gives counter-clockwise.",
          "The direct formula is `matrix[n - 1 - j][i]`, easy to confuse with `matrix[j][n - 1 - i]` (which rotates the other way).",
          "This only works because the matrix is square.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef rotate(matrix: List[List[int]]) -> List[List[int]]:\n    n = len(matrix)\n    return [[matrix[n - 1 - j][i] for j in range(n)] for i in range(n)]`,
        javascript: `var rotate = function(matrix) {\n    const n = matrix.length;\n    const out = [];\n    for (let i = 0; i < n; i++) {\n        const row = [];\n        for (let j = 0; j < n; j++) row.push(matrix[n - 1 - j][i]);\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function rotate(matrix: number[][]): number[][] {\n    const n = matrix.length;\n    const out: number[][] = [];\n    for (let i = 0; i < n; i++) {\n        const row: number[] = [];\n        for (let j = 0; j < n; j++) row.push(matrix[n - 1 - j][i]);\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] rotate(int[][] matrix) {\n    int n = matrix.length;\n    int[][] out = new int[n][n];\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) out[i][j] = matrix[n - 1 - j][i];\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> rotate(vector<vector<int>>& matrix) {\n    int n = (int) matrix.size();\n    vector<vector<int>> out(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) out[i][j] = matrix[n - 1 - j][i];\n    }\n    return out;\n}`,
              c: `int** rotate(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {\n    int n = matrixSize;\n    int** out = (int**) malloc(n * sizeof(int*));\n    int* sizes = (int*) malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        out[i] = (int*) malloc(n * sizeof(int));\n        sizes[i] = n;\n        for (int j = 0; j < n; j++) out[i][j] = matrix[n - 1 - j][i];\n    }\n    *returnSize = n;\n    *returnColumnSizes = sizes;\n    return out;\n}`,
              csharp: `public static int[][] Rotate(int[][] matrix)\n{\n    int n = matrix.Length;\n    int[][] res = new int[n][];\n    for (int i = 0; i < n; i++)\n    {\n        res[i] = new int[n];\n        for (int j = 0; j < n; j++) res[i][j] = matrix[n - 1 - j][i];\n    }\n    return res;\n}`,
              go: `func rotate(matrix [][]int) [][]int {\n	n := len(matrix)\n	out := make([][]int, n)\n	for i := 0; i < n; i++ {\n		out[i] = make([]int, n)\n		for j := 0; j < n; j++ {\n			out[i][j] = matrix[n-1-j][i]\n		}\n	}\n	return out\n}`,
              kotlin: `fun rotate(matrix: Array<IntArray>): Array<IntArray> {\n    val n = matrix.size\n    return Array(n) { i -> IntArray(n) { j -> matrix[n - 1 - j][i] } }\n}`,
              swift: `func rotate(_ matrix: [[Int]]) -> [[Int]] {\n    let n = matrix.count\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n {\n        for j in 0..<n {\n            out[i][j] = matrix[n - 1 - j][i]\n        }\n    }\n    return out\n}`,
              rust: `fn rotate(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let n = matrix.len();\n    let mut out = vec![vec![0i32; n]; n];\n    for i in 0..n {\n        for j in 0..n {\n            out[i][j] = matrix[n - 1 - j][i];\n        }\n    }\n    out\n}`,
              php: `function rotate($matrix) {\n    $n = count($matrix);\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        $row = array();\n        for ($j = 0; $j < $n; $j++) $row[] = $matrix[$n - 1 - $j][$i];\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def rotate(matrix)\n  n = matrix.length\n  (0...n).map { |i| (0...n).map { |j| matrix[n - 1 - j][i] } }\nend`,
      },
    };
  })(),

  // ── Spiral Matrix ───────────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const out: number[] = [];
      let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
      while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) out.push(matrix[top][j]);
        top++;
        for (let i = top; i <= bottom; i++) out.push(matrix[i][right]);
        right--;
        if (top <= bottom) {
          for (let j = right; j >= left; j--) out.push(matrix[bottom][j]);
          bottom--;
        }
        if (left <= right) {
          for (let i = bottom; i >= top; i--) out.push(matrix[i][left]);
          left++;
        }
      }
      return out;
    };
    return {
      slug: "spiral-matrix",
      title: "Spiral Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation"],
      signature: { funcName: "spiralOrder", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an `m x n` matrix, return **all its elements in spiral order** (clockwise from the top-left).",
        [
          { in: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", out: "[1,2,3,6,9,8,7,4,5]" },
          { in: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]", out: "[1,2,3,4,8,12,11,10,9,5,6,7]" },
        ],
        ["1 <= m, n <= 8", "-100 <= matrix[i][j] <= 100"]),
      hints: [
        "Maintain four boundaries: top, bottom, left, right.",
        "Walk each edge, then shrink that boundary; re-check bounds before the bottom and left passes.",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[1,2,3,6,9,8,7,4,5]" },
        { input: "[[1,2,3,4],[5,6,7,8],[9,10,11,12]]", expectedOutput: "[1,2,3,4,8,12,11,10,9,5,6,7]" },
      ],
      gen: (rng: Rng) => {
        const m = genMat(rng, 8, 8, -100, 100);
        return { input: fmtIntMat(m), expectedOutput: fmtIntArr(ref(m)) };
      },
      editorial: explain({
        idea: "Track the four edges of the unvisited rectangle — `top`, `bottom`, `left`, `right` — and peel one edge at a time: across the top, down the right, back along the bottom, up the left. After each pass, pull that boundary inward. The rectangle shrinks until nothing is left.",
        steps: [
          "Initialise `top = 0`, `bottom = rows - 1`, `left = 0`, `right = cols - 1`.",
          "Walk left to right along `top`, then increment `top`.",
          "Walk top to bottom along `right`, then decrement `right`.",
          "**If `top <= bottom`**, walk right to left along `bottom`, then decrement `bottom`.",
          "**If `left <= right`**, walk bottom to top along `left`, then increment `left`. Repeat while the rectangle is non-empty.",
        ],
        why: "Each pass consumes exactly one full edge of the remaining rectangle and then removes that line from consideration, so no cell is ever visited twice and the region strictly shrinks — guaranteeing termination after all `rows · cols` cells. The two re-checks matter because a single remaining row or column would otherwise be traversed twice: once by the top pass and again by the bottom pass.",
        time: "O(rows · cols)",
        space: "O(1) beyond the output",
        pitfalls: [
          "The bounds re-check before the bottom and left passes is essential — without it, a one-row or one-column matrix emits duplicate values.",
          "Update each boundary immediately after its pass, not all four at the end.",
          "The outer loop condition must cover both dimensions (`top <= bottom && left <= right`).",
          "Non-square matrices are the common failure case; test a single row and a single column.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef spiralOrder(matrix: List[List[int]]) -> List[int]:\n    out = []\n    top, bottom = 0, len(matrix) - 1\n    left, right = 0, len(matrix[0]) - 1\n    while top <= bottom and left <= right:\n        for j in range(left, right + 1):\n            out.append(matrix[top][j])\n        top += 1\n        for i in range(top, bottom + 1):\n            out.append(matrix[i][right])\n        right -= 1\n        if top <= bottom:\n            for j in range(right, left - 1, -1):\n                out.append(matrix[bottom][j])\n            bottom -= 1\n        if left <= right:\n            for i in range(bottom, top - 1, -1):\n                out.append(matrix[i][left])\n            left += 1\n    return out`,
        javascript: `var spiralOrder = function(matrix) {\n    const out = [];\n    let top = 0, bottom = matrix.length - 1;\n    let left = 0, right = matrix[0].length - 1;\n    while (top <= bottom && left <= right) {\n        for (let j = left; j <= right; j++) out.push(matrix[top][j]);\n        top++;\n        for (let i = top; i <= bottom; i++) out.push(matrix[i][right]);\n        right--;\n        if (top <= bottom) {\n            for (let j = right; j >= left; j--) out.push(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right) {\n            for (let i = bottom; i >= top; i--) out.push(matrix[i][left]);\n            left++;\n        }\n    }\n    return out;\n};`,
              typescript: `function spiralOrder(matrix: number[][]): number[] {\n    const out: number[] = [];\n    let top = 0;\n    let bottom = matrix.length - 1;\n    let left = 0;\n    let right = matrix[0].length - 1;\n    while (top <= bottom && left <= right) {\n        for (let j = left; j <= right; j++) out.push(matrix[top][j]);\n        top++;\n        for (let i = top; i <= bottom; i++) out.push(matrix[i][right]);\n        right--;\n        if (top <= bottom) {\n            for (let j = right; j >= left; j--) out.push(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right) {\n            for (let i = bottom; i >= top; i--) out.push(matrix[i][left]);\n            left++;\n        }\n    }\n    return out;\n}`,
              java: `public static int[] spiralOrder(int[][] matrix) {\n    List<Integer> out = new ArrayList<>();\n    int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;\n    while (top <= bottom && left <= right) {\n        for (int j = left; j <= right; j++) out.add(matrix[top][j]);\n        top++;\n        for (int i = top; i <= bottom; i++) out.add(matrix[i][right]);\n        right--;\n        if (top <= bottom) {\n            for (int j = right; j >= left; j--) out.add(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right) {\n            for (int i = bottom; i >= top; i--) out.add(matrix[i][left]);\n            left++;\n        }\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> spiralOrder(vector<vector<int>>& matrix) {\n    vector<int> out;\n    int top = 0, bottom = (int) matrix.size() - 1, left = 0, right = (int) matrix[0].size() - 1;\n    while (top <= bottom && left <= right) {\n        for (int j = left; j <= right; j++) out.push_back(matrix[top][j]);\n        top++;\n        for (int i = top; i <= bottom; i++) out.push_back(matrix[i][right]);\n        right--;\n        if (top <= bottom) {\n            for (int j = right; j >= left; j--) out.push_back(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right) {\n            for (int i = bottom; i >= top; i--) out.push_back(matrix[i][left]);\n            left++;\n        }\n    }\n    return out;\n}`,
              c: `int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {\n    int rows = matrixSize;\n    int cols = matrixColSize[0];\n    int* out = (int*) malloc(rows * cols * sizeof(int));\n    int count = 0;\n    int top = 0, bottom = rows - 1, left = 0, right = cols - 1;\n    while (top <= bottom && left <= right) {\n        for (int j = left; j <= right; j++) out[count++] = matrix[top][j];\n        top++;\n        for (int i = top; i <= bottom; i++) out[count++] = matrix[i][right];\n        right--;\n        if (top <= bottom) {\n            for (int j = right; j >= left; j--) out[count++] = matrix[bottom][j];\n            bottom--;\n        }\n        if (left <= right) {\n            for (int i = bottom; i >= top; i--) out[count++] = matrix[i][left];\n            left++;\n        }\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] SpiralOrder(int[][] matrix)\n{\n    var res = new List<int>();\n    int top = 0, bottom = matrix.Length - 1, left = 0, right = matrix[0].Length - 1;\n    while (top <= bottom && left <= right)\n    {\n        for (int j = left; j <= right; j++) res.Add(matrix[top][j]);\n        top++;\n        for (int i = top; i <= bottom; i++) res.Add(matrix[i][right]);\n        right--;\n        if (top <= bottom)\n        {\n            for (int j = right; j >= left; j--) res.Add(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right)\n        {\n            for (int i = bottom; i >= top; i--) res.Add(matrix[i][left]);\n            left++;\n        }\n    }\n    return res.ToArray();\n}`,
              go: `func spiralOrder(matrix [][]int) []int {\n	out := []int{}\n	top, bottom := 0, len(matrix)-1\n	left, right := 0, len(matrix[0])-1\n	for top <= bottom && left <= right {\n		for j := left; j <= right; j++ {\n			out = append(out, matrix[top][j])\n		}\n		top++\n		for i := top; i <= bottom; i++ {\n			out = append(out, matrix[i][right])\n		}\n		right--\n		if top <= bottom {\n			for j := right; j >= left; j-- {\n				out = append(out, matrix[bottom][j])\n			}\n			bottom--\n		}\n		if left <= right {\n			for i := bottom; i >= top; i-- {\n				out = append(out, matrix[i][left])\n			}\n			left++\n		}\n	}\n	return out\n}`,
              kotlin: `fun spiralOrder(matrix: Array<IntArray>): IntArray {\n    val out = mutableListOf<Int>()\n    var top = 0\n    var bottom = matrix.size - 1\n    var left = 0\n    var right = matrix[0].size - 1\n    while (top <= bottom && left <= right) {\n        for (j in left..right) out.add(matrix[top][j])\n        top++\n        for (i in top..bottom) out.add(matrix[i][right])\n        right--\n        if (top <= bottom) {\n            for (j in right downTo left) out.add(matrix[bottom][j])\n            bottom--\n        }\n        if (left <= right) {\n            for (i in bottom downTo top) out.add(matrix[i][left])\n            left++\n        }\n    }\n    return out.toIntArray()\n}`,
              swift: `func spiralOrder(_ matrix: [[Int]]) -> [Int] {\n    var out: [Int] = []\n    var top = 0\n    var bottom = matrix.count - 1\n    var left = 0\n    var right = matrix[0].count - 1\n    while top <= bottom && left <= right {\n        var j = left\n        while j <= right {\n            out.append(matrix[top][j])\n            j += 1\n        }\n        top += 1\n        var i = top\n        while i <= bottom {\n            out.append(matrix[i][right])\n            i += 1\n        }\n        right -= 1\n        if top <= bottom {\n            j = right\n            while j >= left {\n                out.append(matrix[bottom][j])\n                j -= 1\n            }\n            bottom -= 1\n        }\n        if left <= right {\n            i = bottom\n            while i >= top {\n                out.append(matrix[i][left])\n                i -= 1\n            }\n            left += 1\n        }\n    }\n    return out\n}`,
              rust: `fn spiralOrder(matrix: Vec<Vec<i32>>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut top: i32 = 0;\n    let mut bottom: i32 = matrix.len() as i32 - 1;\n    let mut left: i32 = 0;\n    let mut right: i32 = matrix[0].len() as i32 - 1;\n    while top <= bottom && left <= right {\n        let mut j = left;\n        while j <= right {\n            out.push(matrix[top as usize][j as usize]);\n            j += 1;\n        }\n        top += 1;\n        let mut i = top;\n        while i <= bottom {\n            out.push(matrix[i as usize][right as usize]);\n            i += 1;\n        }\n        right -= 1;\n        if top <= bottom {\n            j = right;\n            while j >= left {\n                out.push(matrix[bottom as usize][j as usize]);\n                j -= 1;\n            }\n            bottom -= 1;\n        }\n        if left <= right {\n            i = bottom;\n            while i >= top {\n                out.push(matrix[i as usize][left as usize]);\n                i -= 1;\n            }\n            left += 1;\n        }\n    }\n    out\n}`,
              php: `function spiralOrder($matrix) {\n    $out = array();\n    $top = 0;\n    $bottom = count($matrix) - 1;\n    $left = 0;\n    $right = count($matrix[0]) - 1;\n    while ($top <= $bottom && $left <= $right) {\n        for ($j = $left; $j <= $right; $j++) $out[] = $matrix[$top][$j];\n        $top++;\n        for ($i = $top; $i <= $bottom; $i++) $out[] = $matrix[$i][$right];\n        $right--;\n        if ($top <= $bottom) {\n            for ($j = $right; $j >= $left; $j--) $out[] = $matrix[$bottom][$j];\n            $bottom--;\n        }\n        if ($left <= $right) {\n            for ($i = $bottom; $i >= $top; $i--) $out[] = $matrix[$i][$left];\n            $left++;\n        }\n    }\n    return $out;\n}`,
              ruby: `def spiralOrder(matrix)\n  out = []\n  top = 0\n  bottom = matrix.length - 1\n  left = 0\n  right = matrix[0].length - 1\n  while top <= bottom && left <= right\n    (left..right).each { |j| out.push(matrix[top][j]) }\n    top += 1\n    (top..bottom).each { |i| out.push(matrix[i][right]) }\n    right -= 1\n    if top <= bottom\n      right.downto(left) { |j| out.push(matrix[bottom][j]) }\n      bottom -= 1\n    end\n    if left <= right\n      bottom.downto(top) { |i| out.push(matrix[i][left]) }\n      left += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Set Matrix Zeroes ───────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const rows = new Set<number>(), cols = new Set<number>();
      matrix.forEach((row, i) => row.forEach((v, j) => {
        if (v === 0) { rows.add(i); cols.add(j); }
      }));
      return matrix.map((row, i) => row.map((v, j) => (rows.has(i) || cols.has(j) ? 0 : v)));
    };
    return {
      slug: "set-matrix-zeroes",
      title: "Set Matrix Zeroes",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Hash Table"],
      signature: { funcName: "setZeroes", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an `m x n` matrix, if an element is `0`, set its **entire row and column** to `0`, and return the matrix.\n\nThe follow-up asks for an in-place solution using O(1) extra space (use the first row and column as markers).",
        [
          { in: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", out: "[[1,0,1],[0,0,0],[1,0,1]]" },
          { in: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]", out: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]" },
        ],
        ["1 <= m, n <= 7", "-50 <= matrix[i][j] <= 50"]),
      hints: [
        "First record WHICH rows and columns contain a zero, then wipe them.",
        "O(1) space: store the markers in row 0 and column 0 themselves.",
      ],
      examples: [
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "[[1,0,1],[0,0,0],[1,0,1]]" },
        { input: "[[0,1,2,0],[3,4,5,2],[1,3,1,5]]", expectedOutput: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]" },
      ],
      gen: (rng: Rng) => {
        const m = genMat(rng, 7, 7, -50, 50).map((row) => row.map((v) => (Math.abs(v) < 4 ? 0 : v)));
        return { input: fmtIntMat(m), expectedOutput: fmtIntMat(ref(m)) };
      },
      editorial: explain({
        idea: "The trap is doing it in one pass: zeroing a row immediately creates new zeros that the rest of the scan cannot distinguish from originals, and the wipe cascades over the whole matrix. Split it into **two phases** — first record which rows and columns contain an original zero, then apply the wipes.",
        steps: [
          "Allocate a flag per row and per column, all false.",
          "Scan the matrix; on each zero, mark that row and that column.",
          "Scan again, setting a cell to zero when its row flag or its column flag is set.",
          "Return the matrix.",
        ],
        why: "Separating detection from mutation is what keeps the operation faithful to the *original* matrix: the second pass reads only the flags, which were computed before anything changed, so a zero written in phase two can never trigger further wipes. The `O(1)`-space variant stores those same flags inside row 0 and column 0, which works but needs care because those cells serve double duty as both markers and data.",
        time: "O(rows · cols)",
        space: "O(rows + cols), or O(1) using the first row and column as markers",
        pitfalls: [
          "Never wipe during the detection pass — the newly written zeros are indistinguishable from real ones and the whole matrix collapses.",
          "Flags are per row **and** per column; a single set of flags cannot capture both.",
          "In the `O(1)` variant, handle the first row and column separately at the very end, since they hold the markers.",
          "A cell is zeroed if **either** flag is set, not both.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef setZeroes(matrix: List[List[int]]) -> List[List[int]]:\n    rows = set()\n    cols = set()\n    for i, row in enumerate(matrix):\n        for j, v in enumerate(row):\n            if v == 0:\n                rows.add(i)\n                cols.add(j)\n    for i in range(len(matrix)):\n        for j in range(len(matrix[0])):\n            if i in rows or j in cols:\n                matrix[i][j] = 0\n    return matrix`,
        javascript: `var setZeroes = function(matrix) {\n    const rows = new Set(), cols = new Set();\n    for (let i = 0; i < matrix.length; i++) {\n        for (let j = 0; j < matrix[0].length; j++) {\n            if (matrix[i][j] === 0) { rows.add(i); cols.add(j); }\n        }\n    }\n    for (let i = 0; i < matrix.length; i++) {\n        for (let j = 0; j < matrix[0].length; j++) {\n            if (rows.has(i) || cols.has(j)) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n};`,
              typescript: `function setZeroes(matrix: number[][]): number[][] {\n    const rows = matrix.length;\n    const cols = matrix[0].length;\n    const zeroRow: boolean[] = [];\n    const zeroCol: boolean[] = [];\n    for (let i = 0; i < rows; i++) zeroRow.push(false);\n    for (let j = 0; j < cols; j++) zeroCol.push(false);\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (matrix[i][j] === 0) {\n                zeroRow[i] = true;\n                zeroCol[j] = true;\n            }\n        }\n    }\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n}`,
              java: `public static int[][] setZeroes(int[][] matrix) {\n    int rows = matrix.length, cols = matrix[0].length;\n    boolean[] zeroRow = new boolean[rows];\n    boolean[] zeroCol = new boolean[cols];\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (matrix[i][j] == 0) {\n                zeroRow[i] = true;\n                zeroCol[j] = true;\n            }\n        }\n    }\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n}`,
              cpp: `vector<vector<int>> setZeroes(vector<vector<int>>& matrix) {\n    int rows = (int) matrix.size(), cols = (int) matrix[0].size();\n    vector<bool> zeroRow(rows, false), zeroCol(cols, false);\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (matrix[i][j] == 0) {\n                zeroRow[i] = true;\n                zeroCol[j] = true;\n            }\n        }\n    }\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n}`,
              c: `int** setZeroes(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {\n    int rows = matrixSize;\n    int cols = matrixColSize[0];\n    int* zeroRow = (int*) calloc(rows, sizeof(int));\n    int* zeroCol = (int*) calloc(cols, sizeof(int));\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (matrix[i][j] == 0) {\n                zeroRow[i] = 1;\n                zeroCol[j] = 1;\n            }\n        }\n    }\n    int* sizes = (int*) malloc(rows * sizeof(int));\n    for (int i = 0; i < rows; i++) {\n        sizes[i] = cols;\n        for (int j = 0; j < cols; j++) {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0;\n        }\n    }\n    free(zeroRow);\n    free(zeroCol);\n    *returnSize = rows;\n    *returnColumnSizes = sizes;\n    return matrix;\n}`,
              csharp: `public static int[][] SetZeroes(int[][] matrix)\n{\n    int rows = matrix.Length, cols = matrix[0].Length;\n    bool[] zeroRow = new bool[rows];\n    bool[] zeroCol = new bool[cols];\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (matrix[i][j] == 0)\n            {\n                zeroRow[i] = true;\n                zeroCol[j] = true;\n            }\n        }\n    }\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n}`,
              go: `func setZeroes(matrix [][]int) [][]int {\n	rows := len(matrix)\n	cols := len(matrix[0])\n	zeroRow := make([]bool, rows)\n	zeroCol := make([]bool, cols)\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if matrix[i][j] == 0 {\n				zeroRow[i] = true\n				zeroCol[j] = true\n			}\n		}\n	}\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if zeroRow[i] || zeroCol[j] {\n				matrix[i][j] = 0\n			}\n		}\n	}\n	return matrix\n}`,
              kotlin: `fun setZeroes(matrix: Array<IntArray>): Array<IntArray> {\n    val rows = matrix.size\n    val cols = matrix[0].size\n    val zeroRow = BooleanArray(rows)\n    val zeroCol = BooleanArray(cols)\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (matrix[i][j] == 0) {\n                zeroRow[i] = true\n                zeroCol[j] = true\n            }\n        }\n    }\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (zeroRow[i] || zeroCol[j]) matrix[i][j] = 0\n        }\n    }\n    return matrix\n}`,
              swift: `func setZeroes(_ matrix: [[Int]]) -> [[Int]] {\n    var m = matrix\n    let rows = m.count\n    let cols = m[0].count\n    var zeroRow = [Bool](repeating: false, count: rows)\n    var zeroCol = [Bool](repeating: false, count: cols)\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if m[i][j] == 0 {\n                zeroRow[i] = true\n                zeroCol[j] = true\n            }\n        }\n    }\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if zeroRow[i] || zeroCol[j] { m[i][j] = 0 }\n        }\n    }\n    return m\n}`,
              rust: `fn setZeroes(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut m = matrix;\n    let rows = m.len();\n    let cols = m[0].len();\n    let mut zero_row = vec![false; rows];\n    let mut zero_col = vec![false; cols];\n    for i in 0..rows {\n        for j in 0..cols {\n            if m[i][j] == 0 {\n                zero_row[i] = true;\n                zero_col[j] = true;\n            }\n        }\n    }\n    for i in 0..rows {\n        for j in 0..cols {\n            if zero_row[i] || zero_col[j] {\n                m[i][j] = 0;\n            }\n        }\n    }\n    m\n}`,
              php: `function setZeroes($matrix) {\n    $rows = count($matrix);\n    $cols = count($matrix[0]);\n    $zeroRow = array_fill(0, $rows, false);\n    $zeroCol = array_fill(0, $cols, false);\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($matrix[$i][$j] === 0) {\n                $zeroRow[$i] = true;\n                $zeroCol[$j] = true;\n            }\n        }\n    }\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($zeroRow[$i] || $zeroCol[$j]) $matrix[$i][$j] = 0;\n        }\n    }\n    return $matrix;\n}`,
              ruby: `def setZeroes(matrix)\n  rows = matrix.length\n  cols = matrix[0].length\n  zero_row = Array.new(rows, false)\n  zero_col = Array.new(cols, false)\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      if matrix[i][j] == 0\n        zero_row[i] = true\n        zero_col[j] = true\n      end\n    end\n  end\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      matrix[i][j] = 0 if zero_row[i] || zero_col[j]\n    end\n  end\n  matrix\nend`,
      },
    };
  })(),

  // ── Search a 2D Matrix ──────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][], target: number) => matrix.some((row) => row.includes(target));
    return {
      slug: "search-a-2d-matrix",
      title: "Search a 2D Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Binary Search"],
      signature: { funcName: "searchMatrix", params: [{ name: "matrix", type: "int[][]" as const }, { name: "target", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given an `m x n` matrix where each row is sorted in non-decreasing order and the **first integer of each row is greater than the last integer of the previous row**. Given a `target`, return `true` if it is in the matrix.\n\nYour solution must run in `O(log(m*n))` time.",
        [
          { in: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", out: "true" },
          { in: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13", out: "false" },
        ],
        ["1 <= m, n <= 8", "-500 <= values, target <= 500"]),
      hints: [
        "The whole matrix reads as one sorted list of length m*n.",
        "Binary search index k, mapping it to matrix[k / n][k % n].",
      ],
      examples: [
        { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n3", expectedOutput: "true" },
        { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n13", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const r = ri(rng, 1, 8), c = ri(rng, 1, 8);
        const flat: number[] = [];
        let v = ri(rng, -500, -400);
        for (let i = 0; i < r * c; i++) {
          v += ri(rng, 1, 10);
          flat.push(v);
        }
        const matrix = Array.from({ length: r }, (_, i) => flat.slice(i * c, i * c + c));
        const target = rng() < 0.5 ? flat[ri(rng, 0, flat.length - 1)] : ri(rng, -500, 500);
        return { input: `${fmtIntMat(matrix)}\n${target}`, expectedOutput: bool(ref(matrix, target)) };
      },
      editorial: explain({
        idea: "The two guarantees together — each row sorted, and every row starting above the previous row's end — mean the matrix read row by row is **one long sorted list**. So run an ordinary binary search over the virtual index range `[0, m*n)` and translate each index back to a cell with a divide and a modulo.",
        steps: [
          "Treat the matrix as a flat list of `m * n` values.",
          "Binary search `k` over `[0, m*n - 1]`.",
          "Map `k` to a cell: row `k / cols`, column `k % cols`.",
          "Compare and halve the range exactly as in a one-dimensional binary search.",
          "Return whether the target was found.",
        ],
        why: "The row-boundary condition is what makes the flattening valid: without it, rows could overlap in value and the concatenation would not be sorted. With it, reading in row-major order yields a strictly increasing sequence, so the standard invariant holds and one search over `log(m*n)` steps suffices — better than a per-row search, which costs `O(m + log n)` or `O(m log n)` depending on how it is done.",
        time: "O(log(m·n))",
        space: "O(1)",
        pitfalls: [
          "The index mapping divides and mods by the **column** count, not the row count.",
          "This flattening is only sound because of the \"first of each row exceeds last of the previous\" guarantee; a merely row-sorted matrix needs the staircase walk from the top-right corner instead.",
          "The upper bound is `m*n - 1` for an inclusive search; using `m*n` with `lo <= hi` reads out of bounds.",
          "Compute `m*n` in a type wide enough for large matrices.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef searchMatrix(matrix: List[List[int]], target: int) -> bool:\n    m, n = len(matrix), len(matrix[0])\n    lo, hi = 0, m * n - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        v = matrix[mid // n][mid % n]\n        if v == target:\n            return True\n        if v < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False`,
        javascript: `var searchMatrix = function(matrix, target) {\n    const m = matrix.length, n = matrix[0].length;\n    let lo = 0, hi = m * n - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        const v = matrix[Math.floor(mid / n)][mid % n];\n        if (v === target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n};`,
              typescript: `function searchMatrix(matrix: number[][], target: number): boolean {\n    const rows = matrix.length;\n    const cols = matrix[0].length;\n    let lo = 0;\n    let hi = rows * cols - 1;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        const v = matrix[Math.floor(mid / cols)][mid % cols];\n        if (v === target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              java: `public static boolean searchMatrix(int[][] matrix, int target) {\n    int rows = matrix.length, cols = matrix[0].length;\n    int lo = 0, hi = rows * cols - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int v = matrix[mid / cols][mid % cols];\n        if (v == target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              cpp: `bool searchMatrix(vector<vector<int>>& matrix, int target) {\n    int rows = (int) matrix.size(), cols = (int) matrix[0].size();\n    int lo = 0, hi = rows * cols - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int v = matrix[mid / cols][mid % cols];\n        if (v == target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              c: `bool searchMatrix(int** matrix, int matrixSize, int* matrixColSize, int target) {\n    int rows = matrixSize;\n    int cols = matrixColSize[0];\n    int lo = 0, hi = rows * cols - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int v = matrix[mid / cols][mid % cols];\n        if (v == target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              csharp: `public static bool SearchMatrix(int[][] matrix, int target)\n{\n    int rows = matrix.Length, cols = matrix[0].Length;\n    int lo = 0, hi = rows * cols - 1;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        int v = matrix[mid / cols][mid % cols];\n        if (v == target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              go: `func searchMatrix(matrix [][]int, target int) bool {\n	rows := len(matrix)\n	cols := len(matrix[0])\n	lo, hi := 0, rows*cols-1\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		v := matrix[mid/cols][mid%cols]\n		if v == target {\n			return true\n		}\n		if v < target {\n			lo = mid + 1\n		} else {\n			hi = mid - 1\n		}\n	}\n	return false\n}`,
              kotlin: `fun searchMatrix(matrix: Array<IntArray>, target: Int): Boolean {\n    val rows = matrix.size\n    val cols = matrix[0].size\n    var lo = 0\n    var hi = rows * cols - 1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        val v = matrix[mid / cols][mid % cols]\n        if (v == target) return true\n        if (v < target) lo = mid + 1 else hi = mid - 1\n    }\n    return false\n}`,
              swift: `func searchMatrix(_ matrix: [[Int]], _ target: Int) -> Bool {\n    let rows = matrix.count\n    let cols = matrix[0].count\n    var lo = 0\n    var hi = rows * cols - 1\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        let v = matrix[mid / cols][mid % cols]\n        if v == target { return true }\n        if v < target { lo = mid + 1 } else { hi = mid - 1 }\n    }\n    return false\n}`,
              rust: `fn searchMatrix(matrix: Vec<Vec<i32>>, target: i32) -> bool {\n    let rows = matrix.len() as i32;\n    let cols = matrix[0].len() as i32;\n    let mut lo: i32 = 0;\n    let mut hi: i32 = rows * cols - 1;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        let v = matrix[(mid / cols) as usize][(mid % cols) as usize];\n        if v == target {\n            return true;\n        }\n        if v < target {\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    false\n}`,
              php: `function searchMatrix($matrix, $target) {\n    $rows = count($matrix);\n    $cols = count($matrix[0]);\n    $lo = 0;\n    $hi = $rows * $cols - 1;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $v = $matrix[intdiv($mid, $cols)][$mid % $cols];\n        if ($v === $target) return true;\n        if ($v < $target) $lo = $mid + 1;\n        else $hi = $mid - 1;\n    }\n    return false;\n}`,
              ruby: `def searchMatrix(matrix, target)\n  rows = matrix.length\n  cols = matrix[0].length\n  lo = 0\n  hi = rows * cols - 1\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    v = matrix[mid / cols][mid % cols]\n    return true if v == target\n    if v < target\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Pascal's Triangle ───────────────────────────────────────────
  (() => {
    const ref = (numRows: number) => {
      const out: number[][] = [[1]];
      for (let i = 1; i < numRows; i++) {
        const prev = out[i - 1];
        const row = [1];
        for (let j = 1; j < i; j++) row.push(prev[j - 1] + prev[j]);
        row.push(1);
        out.push(row);
      }
      return out.slice(0, numRows);
    };
    return {
      slug: "pascals-triangle",
      title: "Pascal's Triangle",
      difficulty: "EASY" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "generate", params: [{ name: "numRows", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an integer `numRows`, return the first `numRows` rows of **Pascal's triangle**, where each number is the sum of the two numbers directly above it.",
        [
          { in: "numRows = 5", out: "[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]" },
          { in: "numRows = 1", out: "[[1]]" },
        ],
        ["1 <= numRows <= 20"]),
      hints: [
        "Every row starts and ends with 1.",
        "row[j] = prevRow[j-1] + prevRow[j] for the interior entries.",
      ],
      examples: [
        { input: "5", expectedOutput: "[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]" },
        { input: "1", expectedOutput: "[[1]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        return { input: String(n), expectedOutput: fmtIntMat(ref(n)) };
      },
      editorial: explain({
        idea: "Each row is built directly from the one above it: the ends are always `1`, and every interior entry is the sum of the two entries diagonally above. Build the rows in order and each one has everything it needs already computed.",
        steps: [
          "Start with the first row, `[1]`.",
          "For each subsequent row of length `r + 1`, set the first and last entries to `1`.",
          "For each interior index `j`, set `row[j] = prev[j - 1] + prev[j]`.",
          "Append the row and continue until `numRows` rows exist.",
        ],
        why: "This is the additive recurrence for binomial coefficients, `C(n, k) = C(n-1, k-1) + C(n-1, k)`, with the boundary cases `C(n, 0) = C(n, n) = 1`. Because each row depends only on its immediate predecessor, a single forward pass computes them all with no recomputation — the same values would cost exponentially more to derive independently by a naive recursion.",
        time: "O(numRows^2)",
        space: "O(numRows^2) for the output",
        pitfalls: [
          "Row `r` has `r + 1` entries, so the interior loop runs over `1 .. r - 1` only.",
          "Read the previous row, not the row being built — overwriting in place shifts the sums.",
          "`numRows = 1` must return `[[1]]`, which falls out if the seed row is handled before the loop.",
          "Entries grow quickly; at 20 rows they still fit comfortably in a 32-bit integer, but the growth is worth noting.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef generate(numRows: int) -> List[List[int]]:\n    out = [[1]]\n    for i in range(1, numRows):\n        prev = out[-1]\n        row = [1]\n        for j in range(1, i):\n            row.append(prev[j - 1] + prev[j])\n        row.append(1)\n        out.append(row)\n    return out[:numRows]`,
        javascript: `var generate = function(numRows) {\n    const out = [[1]];\n    for (let i = 1; i < numRows; i++) {\n        const prev = out[i - 1];\n        const row = [1];\n        for (let j = 1; j < i; j++) row.push(prev[j - 1] + prev[j]);\n        row.push(1);\n        out.push(row);\n    }\n    return out.slice(0, numRows);\n};`,
              typescript: `function generate(numRows: number): number[][] {\n    const out: number[][] = [];\n    for (let r = 0; r < numRows; r++) {\n        const row: number[] = [];\n        for (let j = 0; j <= r; j++) {\n            if (j === 0 || j === r) row.push(1);\n            else row.push(out[r - 1][j - 1] + out[r - 1][j]);\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] generate(int numRows) {\n    int[][] out = new int[numRows][];\n    for (int r = 0; r < numRows; r++) {\n        out[r] = new int[r + 1];\n        for (int j = 0; j <= r; j++) {\n            if (j == 0 || j == r) out[r][j] = 1;\n            else out[r][j] = out[r - 1][j - 1] + out[r - 1][j];\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> generate(int numRows) {\n    vector<vector<int>> out;\n    for (int r = 0; r < numRows; r++) {\n        vector<int> row(r + 1, 1);\n        for (int j = 1; j < r; j++) row[j] = out[r - 1][j - 1] + out[r - 1][j];\n        out.push_back(row);\n    }\n    return out;\n}`,
              c: `int** generate(int numRows, int* returnSize, int** returnColumnSizes) {\n    int** out = (int**) malloc(numRows * sizeof(int*));\n    int* sizes = (int*) malloc(numRows * sizeof(int));\n    for (int r = 0; r < numRows; r++) {\n        out[r] = (int*) malloc((r + 1) * sizeof(int));\n        sizes[r] = r + 1;\n        for (int j = 0; j <= r; j++) {\n            if (j == 0 || j == r) out[r][j] = 1;\n            else out[r][j] = out[r - 1][j - 1] + out[r - 1][j];\n        }\n    }\n    *returnSize = numRows;\n    *returnColumnSizes = sizes;\n    return out;\n}`,
              csharp: `public static int[][] Generate(int numRows)\n{\n    int[][] res = new int[numRows][];\n    for (int r = 0; r < numRows; r++)\n    {\n        res[r] = new int[r + 1];\n        for (int j = 0; j <= r; j++)\n        {\n            if (j == 0 || j == r) res[r][j] = 1;\n            else res[r][j] = res[r - 1][j - 1] + res[r - 1][j];\n        }\n    }\n    return res;\n}`,
              go: `func generate(numRows int) [][]int {\n	out := make([][]int, numRows)\n	for r := 0; r < numRows; r++ {\n		out[r] = make([]int, r+1)\n		for j := 0; j <= r; j++ {\n			if j == 0 || j == r {\n				out[r][j] = 1\n			} else {\n				out[r][j] = out[r-1][j-1] + out[r-1][j]\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun generate(numRows: Int): Array<IntArray> {\n    val out = Array(numRows) { r -> IntArray(r + 1) }\n    for (r in 0 until numRows) {\n        for (j in 0..r) {\n            out[r][j] = if (j == 0 || j == r) 1 else out[r - 1][j - 1] + out[r - 1][j]\n        }\n    }\n    return out\n}`,
              swift: `func generate(_ numRows: Int) -> [[Int]] {\n    var out: [[Int]] = []\n    for r in 0..<numRows {\n        var row = [Int](repeating: 1, count: r + 1)\n        if r >= 2 {\n            for j in 1..<r {\n                row[j] = out[r - 1][j - 1] + out[r - 1][j]\n            }\n        }\n        out.append(row)\n    }\n    return out\n}`,
              rust: `fn generate(numRows: i32) -> Vec<Vec<i32>> {\n    let n = numRows as usize;\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for r in 0..n {\n        let mut row = vec![1i32; r + 1];\n        for j in 1..r {\n            row[j] = out[r - 1][j - 1] + out[r - 1][j];\n        }\n        out.push(row);\n    }\n    out\n}`,
              php: `function generate($numRows) {\n    $out = array();\n    for ($r = 0; $r < $numRows; $r++) {\n        $row = array();\n        for ($j = 0; $j <= $r; $j++) {\n            if ($j === 0 || $j === $r) $row[] = 1;\n            else $row[] = $out[$r - 1][$j - 1] + $out[$r - 1][$j];\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def generate(numRows)\n  out = []\n  (0...numRows).each do |r|\n    row = []\n    (0..r).each do |j|\n      if j == 0 || j == r\n        row.push(1)\n      else\n        row.push(out[r - 1][j - 1] + out[r - 1][j])\n      end\n    end\n    out.push(row)\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Matrix Diagonal Sum ─────────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const n = mat.length;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += mat[i][i] + mat[i][n - 1 - i];
      }
      if (n % 2 === 1) sum -= mat[(n - 1) / 2][(n - 1) / 2];
      return sum;
    };
    return {
      slug: "matrix-diagonal-sum",
      title: "Matrix Diagonal Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix"],
      signature: { funcName: "diagonalSum", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given a square matrix `mat`, return the sum of the **primary diagonal** and the part of the **secondary diagonal** not on the primary diagonal (the center of an odd-sized matrix counts once).",
        [
          { in: "mat = [[1,2,3],[4,5,6],[7,8,9]]", out: "25", note: "1+5+9 + 3+7 = 25 (5 counted once)." },
          { in: "mat = [[5]]", out: "5" },
        ],
        ["1 <= n <= 8", "1 <= mat[i][j] <= 100"]),
      hints: [
        "Primary: mat[i][i]. Secondary: mat[i][n-1-i].",
        "For odd n, subtract the center once — it was added twice.",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "25" },
        { input: "[[5]]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const m = genSquare(rng, 8, 1, 100);
        return { input: fmtIntMat(m), expectedOutput: String(ref(m)) };
      },
      editorial: explain({
        idea: "Both diagonals can be read off with a single index. Walking `i` down the rows, the primary diagonal is `mat[i][i]` and the secondary is `mat[i][n-1-i]`. The only subtlety is that on an **odd-sized** matrix the two meet at the centre, which must not be counted twice.",
        steps: [
          "Loop `i` from `0` to `n - 1`, adding `mat[i][i]` and `mat[i][n - 1 - i]`.",
          "If `n` is odd, subtract the centre cell `mat[n/2][n/2]` once.",
          "Return the total.",
        ],
        why: "The primary diagonal is exactly the cells where row equals column, and the secondary is where the indices sum to `n - 1`. Those two conditions coincide only when `2i = n - 1`, which has an integer solution precisely when `n` is odd — a single cell, the centre. So the double-count is always either zero cells or exactly one, and subtracting it once fixes the total.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the odd-size correction double-counts the centre; this is the entire difficulty of the problem.",
          "The secondary diagonal index is `n - 1 - i`, not `n - i`.",
          "One loop suffices — there is no need to scan the whole matrix, which would be `O(n^2)`.",
          "For even `n` the diagonals never intersect, so no correction applies.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef diagonalSum(mat: List[List[int]]) -> int:\n    n = len(mat)\n    total = 0\n    for i in range(n):\n        total += mat[i][i] + mat[i][n - 1 - i]\n    if n % 2 == 1:\n        total -= mat[n // 2][n // 2]\n    return total`,
        javascript: `var diagonalSum = function(mat) {\n    const n = mat.length;\n    let sum = 0;\n    for (let i = 0; i < n; i++) {\n        sum += mat[i][i] + mat[i][n - 1 - i];\n    }\n    if (n % 2 === 1) sum -= mat[(n - 1) / 2][(n - 1) / 2];\n    return sum;\n};`,
              typescript: `function diagonalSum(mat: number[][]): number {\n    const n = mat.length;\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        total += mat[i][i] + mat[i][n - 1 - i];\n    }\n    if (n % 2 === 1) total -= mat[(n - 1) / 2][(n - 1) / 2];\n    return total;\n}`,
              java: `public static int diagonalSum(int[][] mat) {\n    int n = mat.length, total = 0;\n    for (int i = 0; i < n; i++) total += mat[i][i] + mat[i][n - 1 - i];\n    if (n % 2 == 1) total -= mat[n / 2][n / 2];\n    return total;\n}`,
              cpp: `int diagonalSum(vector<vector<int>>& mat) {\n    int n = (int) mat.size(), total = 0;\n    for (int i = 0; i < n; i++) total += mat[i][i] + mat[i][n - 1 - i];\n    if (n % 2 == 1) total -= mat[n / 2][n / 2];\n    return total;\n}`,
              c: `int diagonalSum(int** mat, int matSize, int* matColSize) {\n    int n = matSize;\n    int total = 0;\n    for (int i = 0; i < n; i++) total += mat[i][i] + mat[i][n - 1 - i];\n    if (n % 2 == 1) total -= mat[n / 2][n / 2];\n    return total;\n}`,
              csharp: `public static int DiagonalSum(int[][] mat)\n{\n    int n = mat.Length, total = 0;\n    for (int i = 0; i < n; i++) total += mat[i][i] + mat[i][n - 1 - i];\n    if (n % 2 == 1) total -= mat[n / 2][n / 2];\n    return total;\n}`,
              go: `func diagonalSum(mat [][]int) int {\n	n := len(mat)\n	total := 0\n	for i := 0; i < n; i++ {\n		total += mat[i][i] + mat[i][n-1-i]\n	}\n	if n%2 == 1 {\n		total -= mat[n/2][n/2]\n	}\n	return total\n}`,
              kotlin: `fun diagonalSum(mat: Array<IntArray>): Int {\n    val n = mat.size\n    var total = 0\n    for (i in 0 until n) total += mat[i][i] + mat[i][n - 1 - i]\n    if (n % 2 == 1) total -= mat[n / 2][n / 2]\n    return total\n}`,
              swift: `func diagonalSum(_ mat: [[Int]]) -> Int {\n    let n = mat.count\n    var total = 0\n    for i in 0..<n {\n        total += mat[i][i] + mat[i][n - 1 - i]\n    }\n    if n % 2 == 1 { total -= mat[n / 2][n / 2] }\n    return total\n}`,
              rust: `fn diagonalSum(mat: Vec<Vec<i32>>) -> i32 {\n    let n = mat.len();\n    let mut total = 0;\n    for i in 0..n {\n        total += mat[i][i] + mat[i][n - 1 - i];\n    }\n    if n % 2 == 1 {\n        total -= mat[n / 2][n / 2];\n    }\n    total\n}`,
              php: `function diagonalSum($mat) {\n    $n = count($mat);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $total += $mat[$i][$i] + $mat[$i][$n - 1 - $i];\n    }\n    if ($n % 2 === 1) $total -= $mat[intdiv($n, 2)][intdiv($n, 2)];\n    return $total;\n}`,
              ruby: `def diagonalSum(mat)\n  n = mat.length\n  total = 0\n  (0...n).each do |i|\n    total += mat[i][i] + mat[i][n - 1 - i]\n  end\n  total -= mat[n / 2][n / 2] if n.odd?\n  total\nend`,
      },
    };
  })(),

  // ── Richest Customer Wealth ─────────────────────────────────────
  (() => {
    const ref = (accounts: number[][]) => Math.max(...accounts.map((a) => a.reduce((x, y) => x + y, 0)));
    return {
      slug: "richest-customer-wealth",
      title: "Richest Customer Wealth",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix"],
      signature: { funcName: "maximumWealth", params: [{ name: "accounts", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`accounts[i][j]` is the money the `i`-th customer holds in the `j`-th bank. A customer's **wealth** is the sum of their accounts.\n\nReturn the wealth of the **richest** customer.",
        [
          { in: "accounts = [[1,2,3],[3,2,1]]", out: "6" },
          { in: "accounts = [[1,5],[7,3],[3,5]]", out: "10", note: "Customer 2: 7 + 3 = 10." },
        ],
        ["1 <= customers, banks <= 8", "1 <= accounts[i][j] <= 100"]),
      hints: [
        "Sum each row.",
        "Track the running maximum.",
      ],
      examples: [
        { input: "[[1,2,3],[3,2,1]]", expectedOutput: "6" },
        { input: "[[1,5],[7,3],[3,5]]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const m = genMat(rng, 8, 8, 1, 100);
        return { input: fmtIntMat(m), expectedOutput: String(ref(m)) };
      },
      editorial: explain({
        idea: "Each customer's wealth is just the sum of their row, so the answer is the largest row sum. One pass over the matrix, keeping a running maximum — no sorting, no extra storage.",
        steps: [
          "Start the best wealth at zero.",
          "For each row, add up its entries.",
          "If that total beats the current best, keep it.",
          "Return the best.",
        ],
        why: "There is no structure to exploit here — every account must be read to know its customer's total, so `O(rows · cols)` is optimal. Tracking a running maximum rather than collecting all the sums keeps the extra space constant.",
        time: "O(rows · cols)",
        space: "O(1)",
        pitfalls: [
          "Reset the row sum for each customer; carrying it over accumulates across rows.",
          "The answer is the maximum row sum, not the total of the whole matrix.",
          "All values are positive here, so seeding the best at zero is safe — with possible negatives you would seed from the first row instead.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maximumWealth(accounts: List[List[int]]) -> int:\n    return max(sum(a) for a in accounts)`,
        javascript: `var maximumWealth = function(accounts) {\n    let best = 0;\n    for (const a of accounts) {\n        let sum = 0;\n        for (const x of a) sum += x;\n        best = Math.max(best, sum);\n    }\n    return best;\n};`,
              typescript: `function maximumWealth(accounts: number[][]): number {\n    let best = 0;\n    for (let i = 0; i < accounts.length; i++) {\n        let sum = 0;\n        for (let j = 0; j < accounts[i].length; j++) sum += accounts[i][j];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
              java: `public static int maximumWealth(int[][] accounts) {\n    int best = 0;\n    for (int[] row : accounts) {\n        int sum = 0;\n        for (int v : row) sum += v;\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
              cpp: `int maximumWealth(vector<vector<int>>& accounts) {\n    int best = 0;\n    for (const auto& row : accounts) {\n        int sum = 0;\n        for (int v : row) sum += v;\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
              c: `int maximumWealth(int** accounts, int accountsSize, int* accountsColSize) {\n    int best = 0;\n    for (int i = 0; i < accountsSize; i++) {\n        int sum = 0;\n        for (int j = 0; j < accountsColSize[i]; j++) sum += accounts[i][j];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
              csharp: `public static int MaximumWealth(int[][] accounts)\n{\n    int best = 0;\n    foreach (int[] row in accounts)\n    {\n        int sum = 0;\n        foreach (int v in row) sum += v;\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
              go: `func maximumWealth(accounts [][]int) int {\n	best := 0\n	for _, row := range accounts {\n		sum := 0\n		for _, v := range row {\n			sum += v\n		}\n		if sum > best {\n			best = sum\n		}\n	}\n	return best\n}`,
              kotlin: `fun maximumWealth(accounts: Array<IntArray>): Int {\n    var best = 0\n    for (row in accounts) {\n        val sum = row.sum()\n        if (sum > best) best = sum\n    }\n    return best\n}`,
              swift: `func maximumWealth(_ accounts: [[Int]]) -> Int {\n    var best = 0\n    for row in accounts {\n        var sum = 0\n        for v in row { sum += v }\n        if sum > best { best = sum }\n    }\n    return best\n}`,
              rust: `fn maximumWealth(accounts: Vec<Vec<i32>>) -> i32 {\n    let mut best = 0;\n    for row in accounts.iter() {\n        let mut sum = 0;\n        for v in row.iter() {\n            sum += *v;\n        }\n        if sum > best {\n            best = sum;\n        }\n    }\n    best\n}`,
              php: `function maximumWealth($accounts) {\n    $best = 0;\n    foreach ($accounts as $row) {\n        $sum = array_sum($row);\n        if ($sum > $best) $best = $sum;\n    }\n    return $best;\n}`,
              ruby: `def maximumWealth(accounts)\n  accounts.map { |row| row.sum }.max\nend`,
      },
    };
  })(),

  // ── Flood Fill ──────────────────────────────────────────────────
  (() => {
    const ref = (image: number[][], sr: number, sc: number, color: number) => {
      const out = image.map((r) => [...r]);
      const old = out[sr][sc];
      if (old === color) return out;
      const stack: Array<[number, number]> = [[sr, sc]];
      while (stack.length > 0) {
        const [i, j] = stack.pop()!;
        if (i < 0 || j < 0 || i >= out.length || j >= out[0].length || out[i][j] !== old) continue;
        out[i][j] = color;
        stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
      }
      return out;
    };
    return {
      slug: "flood-fill",
      title: "Flood Fill",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search"],
      signature: {
        funcName: "floodFill",
        params: [
          { name: "image", type: "int[][]" as const },
          { name: "sr", type: "int" as const },
          { name: "sc", type: "int" as const },
          { name: "color", type: "int" as const },
        ],
        returns: "int[][]" as const,
      },
      description: describe(
        "Given an image grid, a start pixel `(sr, sc)` and a new `color`, **flood fill**: recolor the start pixel and every pixel connected 4-directionally to it that shares its original color. Return the modified image.",
        [
          { in: "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2", out: "[[2,2,2],[2,2,0],[2,0,1]]" },
          { in: "image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0", out: "[[0,0,0],[0,0,0]]", note: "New color equals the old — nothing changes." },
        ],
        ["1 <= rows, cols <= 7", "0 <= pixel values, color <= 9", "sr/sc are inside the grid."]),
      hints: [
        "DFS or BFS from (sr, sc), only expanding into pixels matching the ORIGINAL color.",
        "If the new color equals the original, return immediately to avoid an infinite loop.",
      ],
      examples: [
        { input: "[[1,1,1],[1,1,0],[1,0,1]]\n1\n1\n2", expectedOutput: "[[2,2,2],[2,2,0],[2,0,1]]" },
        { input: "[[0,0,0],[0,0,0]]\n0\n0\n0", expectedOutput: "[[0,0,0],[0,0,0]]" },
      ],
      gen: (rng: Rng) => {
        const image = genMat(rng, 7, 7, 0, 2);
        const sr = ri(rng, 0, image.length - 1);
        const sc = ri(rng, 0, image[0].length - 1);
        const color = ri(rng, 0, 9);
        return {
          input: `${fmtIntMat(image)}\n${sr}\n${sc}\n${color}`,
          expectedOutput: fmtIntMat(ref(image, sr, sc, color)),
        };
      },
      editorial: explain({
        idea: "Recolouring a connected region is a plain graph traversal on the grid: start at the seed pixel and spread to any 4-directional neighbour that still carries the **original** colour. The one trap is when the new colour equals the original — then repainting changes nothing, and the traversal has no way to tell visited pixels from unvisited ones, so it loops forever.",
        steps: [
          "Read the original colour at `(sr, sc)`.",
          "If it already equals the target colour, return the image unchanged.",
          "Push the seed onto a stack (or queue) and recolour it.",
          "Pop a pixel and, for each of its four neighbours that is in bounds and still holds the original colour, recolour it and push it.",
          "Continue until the frontier is empty.",
        ],
        why: "Recolouring a pixel the moment it is pushed doubles as the \"visited\" mark, since the original colour is the only thing the traversal expands into — so each pixel enters the frontier at most once and the traversal terminates. It reaches exactly the connected component of the seed under 4-adjacency, which is precisely the region the problem defines. The early return is not an optimisation but a correctness requirement: without it the visited mark is invisible and the search revisits pixels forever.",
        time: "O(rows · cols)",
        space: "O(rows · cols)",
        pitfalls: [
          "The `color == original` early return is mandatory — without it the traversal never terminates.",
          "Expand only into pixels matching the **original** colour, not the new one.",
          "Mark (recolour) on push, not on pop, or the same pixel is queued many times.",
          "Connectivity is 4-directional; including diagonals fills too much.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef floodFill(image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:\n    old = image[sr][sc]\n    if old == color:\n        return image\n    stack = [(sr, sc)]\n    while stack:\n        i, j = stack.pop()\n        if i < 0 or j < 0 or i >= len(image) or j >= len(image[0]) or image[i][j] != old:\n            continue\n        image[i][j] = color\n        stack.extend([(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)])\n    return image`,
        javascript: `var floodFill = function(image, sr, sc, color) {\n    const old = image[sr][sc];\n    if (old === color) return image;\n    const stack = [[sr, sc]];\n    while (stack.length > 0) {\n        const cell = stack.pop();\n        const i = cell[0], j = cell[1];\n        if (i < 0 || j < 0 || i >= image.length || j >= image[0].length || image[i][j] !== old) continue;\n        image[i][j] = color;\n        stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);\n    }\n    return image;\n};`,
              typescript: `function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {\n    const original = image[sr][sc];\n    if (original === color) return image;\n    const rows = image.length;\n    const cols = image[0].length;\n    const stack: number[][] = [[sr, sc]];\n    image[sr][sc] = color;\n    const dr = [-1, 1, 0, 0];\n    const dc = [0, 0, -1, 1];\n    while (stack.length > 0) {\n        const cell = stack.pop() as number[];\n        for (let d = 0; d < 4; d++) {\n            const nr = cell[0] + dr[d];\n            const nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] === original) {\n                image[nr][nc] = color;\n                stack.push([nr, nc]);\n            }\n        }\n    }\n    return image;\n}`,
              java: `public static int[][] floodFill(int[][] image, int sr, int sc, int color) {\n    int original = image[sr][sc];\n    if (original == color) return image;\n    int rows = image.length, cols = image[0].length;\n    int[] dr = {-1, 1, 0, 0};\n    int[] dc = {0, 0, -1, 1};\n    Deque<int[]> stack = new ArrayDeque<>();\n    stack.push(new int[]{sr, sc});\n    image[sr][sc] = color;\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original) {\n                image[nr][nc] = color;\n                stack.push(new int[]{nr, nc});\n            }\n        }\n    }\n    return image;\n}`,
              cpp: `vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {\n    int original = image[sr][sc];\n    if (original == color) return image;\n    int rows = (int) image.size(), cols = (int) image[0].size();\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    vector<pair<int, int>> stack;\n    stack.push_back(make_pair(sr, sc));\n    image[sr][sc] = color;\n    while (!stack.empty()) {\n        pair<int, int> cell = stack.back();\n        stack.pop_back();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original) {\n                image[nr][nc] = color;\n                stack.push_back(make_pair(nr, nc));\n            }\n        }\n    }\n    return image;\n}`,
              c: `int** floodFill(int** image, int imageSize, int* imageColSize, int sr, int sc, int color, int* returnSize, int** returnColumnSizes) {\n    int rows = imageSize;\n    int cols = imageColSize[0];\n    int* sizes = (int*) malloc(rows * sizeof(int));\n    for (int i = 0; i < rows; i++) sizes[i] = cols;\n    *returnSize = rows;\n    *returnColumnSizes = sizes;\n    int original = image[sr][sc];\n    if (original == color) return image;\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int* stackR = (int*) malloc(rows * cols * sizeof(int));\n    int* stackC = (int*) malloc(rows * cols * sizeof(int));\n    int top = 0;\n    stackR[top] = sr;\n    stackC[top] = sc;\n    top++;\n    image[sr][sc] = color;\n    while (top > 0) {\n        top--;\n        int r = stackR[top];\n        int c = stackC[top];\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d];\n            int nc = c + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original) {\n                image[nr][nc] = color;\n                stackR[top] = nr;\n                stackC[top] = nc;\n                top++;\n            }\n        }\n    }\n    free(stackR);\n    free(stackC);\n    return image;\n}`,
              csharp: `public static int[][] FloodFill(int[][] image, int sr, int sc, int color)\n{\n    int original = image[sr][sc];\n    if (original == color) return image;\n    int rows = image.Length, cols = image[0].Length;\n    int[] dr = { -1, 1, 0, 0 };\n    int[] dc = { 0, 0, -1, 1 };\n    var stack = new Stack<int[]>();\n    stack.Push(new int[] { sr, sc });\n    image[sr][sc] = color;\n    while (stack.Count > 0)\n    {\n        int[] cell = stack.Pop();\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original)\n            {\n                image[nr][nc] = color;\n                stack.Push(new int[] { nr, nc });\n            }\n        }\n    }\n    return image;\n}`,
              go: `func floodFill(image [][]int, sr int, sc int, color int) [][]int {\n	original := image[sr][sc]\n	if original == color {\n		return image\n	}\n	rows := len(image)\n	cols := len(image[0])\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	stack := [][2]int{{sr, sc}}\n	image[sr][sc] = color\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		for d := 0; d < 4; d++ {\n			nr := cell[0] + dr[d]\n			nc := cell[1] + dc[d]\n			if nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original {\n				image[nr][nc] = color\n				stack = append(stack, [2]int{nr, nc})\n			}\n		}\n	}\n	return image\n}`,
              kotlin: `fun floodFill(image: Array<IntArray>, sr: Int, sc: Int, color: Int): Array<IntArray> {\n    val original = image[sr][sc]\n    if (original == color) return image\n    val rows = image.size\n    val cols = image[0].size\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    val stack = mutableListOf(intArrayOf(sr, sc))\n    image[sr][sc] = color\n    while (stack.isNotEmpty()) {\n        val cell = stack.removeAt(stack.size - 1)\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr in 0 until rows && nc in 0 until cols && image[nr][nc] == original) {\n                image[nr][nc] = color\n                stack.add(intArrayOf(nr, nc))\n            }\n        }\n    }\n    return image\n}`,
              swift: `func floodFill(_ image: [[Int]], _ sr: Int, _ sc: Int, _ color: Int) -> [[Int]] {\n    var img = image\n    let original = img[sr][sc]\n    if original == color { return img }\n    let rows = img.count\n    let cols = img[0].count\n    let dr = [-1, 1, 0, 0]\n    let dc = [0, 0, -1, 1]\n    var stack: [[Int]] = [[sr, sc]]\n    img[sr][sc] = color\n    while !stack.isEmpty {\n        let cell = stack.removeLast()\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr >= 0 && nr < rows && nc >= 0 && nc < cols && img[nr][nc] == original {\n                img[nr][nc] = color\n                stack.append([nr, nc])\n            }\n        }\n    }\n    return img\n}`,
              rust: `fn floodFill(image: Vec<Vec<i32>>, sr: i32, sc: i32, color: i32) -> Vec<Vec<i32>> {\n    let mut img = image;\n    let original = img[sr as usize][sc as usize];\n    if original == color {\n        return img;\n    }\n    let rows = img.len() as i32;\n    let cols = img[0].len() as i32;\n    let dr = [-1, 1, 0, 0];\n    let dc = [0, 0, -1, 1];\n    let mut stack: Vec<(i32, i32)> = vec![(sr, sc)];\n    img[sr as usize][sc as usize] = color;\n    while let Some((r, c)) = stack.pop() {\n        for d in 0..4 {\n            let nr = r + dr[d];\n            let nc = c + dc[d];\n            if nr >= 0 && nr < rows && nc >= 0 && nc < cols && img[nr as usize][nc as usize] == original {\n                img[nr as usize][nc as usize] = color;\n                stack.push((nr, nc));\n            }\n        }\n    }\n    img\n}`,
              php: `function floodFill($image, $sr, $sc, $color) {\n    $original = $image[$sr][$sc];\n    if ($original === $color) return $image;\n    $rows = count($image);\n    $cols = count($image[0]);\n    $dr = array(-1, 1, 0, 0);\n    $dc = array(0, 0, -1, 1);\n    $stack = array(array($sr, $sc));\n    $image[$sr][$sc] = $color;\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $image[$nr][$nc] === $original) {\n                $image[$nr][$nc] = $color;\n                array_push($stack, array($nr, $nc));\n            }\n        }\n    }\n    return $image;\n}`,
              ruby: `def floodFill(image, sr, sc, color)\n  original = image[sr][sc]\n  return image if original == color\n  rows = image.length\n  cols = image[0].length\n  dr = [-1, 1, 0, 0]\n  dc = [0, 0, -1, 1]\n  stack = [[sr, sc]]\n  image[sr][sc] = color\n  while !stack.empty?\n    r, c = stack.pop\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      if nr >= 0 && nr < rows && nc >= 0 && nc < cols && image[nr][nc] == original\n        image[nr][nc] = color\n        stack.push([nr, nc])\n      end\n    end\n  end\n  image\nend`,
      },
    };
  })(),

  // ── Island Perimeter ────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      let per = 0;
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
          if (grid[i][j] !== 1) continue;
          per += 4;
          if (i > 0 && grid[i - 1][j] === 1) per -= 2;
          if (j > 0 && grid[i][j - 1] === 1) per -= 2;
        }
      }
      return per;
    };
    return {
      slug: "island-perimeter",
      title: "Island Perimeter",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix"],
      signature: { funcName: "islandPerimeter", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a grid where `1` is land and `0` is water. Cells connect horizontally/vertically. Return the total **perimeter** of the land in the grid.",
        [
          { in: "grid = [[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]", out: "16" },
          { in: "grid = [[1]]", out: "4" },
        ],
        ["1 <= rows, cols <= 8", "grid[i][j] is 0 or 1."]),
      hints: [
        "Each land cell contributes 4, minus 2 for every land neighbor pair.",
        "Only check up and left neighbors to count each shared edge once.",
      ],
      examples: [
        { input: "[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]", expectedOutput: "16" },
        { input: "[[1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const grid = genMat(rng, 8, 8, 0, 1);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      editorial: explain({
        idea: "Every land cell is a unit square contributing **4** edges, but each edge shared with an adjacent land cell is interior and belongs to neither's perimeter — removing **2** from the total, one for each side. So count the land cells and subtract twice the number of adjacent land pairs.",
        steps: [
          "Sweep every cell of the grid.",
          "For each land cell, add `4` to the total.",
          "If the cell **above** it is land, subtract `2`.",
          "If the cell **to its left** is land, subtract `2`.",
          "Return the total.",
        ],
        why: "Checking only up and left is what makes each shared edge counted exactly once — every adjacent pair has a unique upper or left member, so scanning in row-major order encounters each border once and never twice. Checking all four directions would find every pair twice and would need a subtraction of `1` instead of `2` to compensate.",
        time: "O(rows · cols)",
        space: "O(1)",
        pitfalls: [
          "Check only up and left; checking all four neighbours double-counts every shared edge.",
          "Subtract `2` per adjacent pair — the edge disappears from *both* cells' perimeters.",
          "Guard the bounds before reading the neighbour on the first row and first column.",
          "No traversal is needed at all; this is a pure counting argument, not a flood fill.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef islandPerimeter(grid: List[List[int]]) -> int:\n    per = 0\n    for i in range(len(grid)):\n        for j in range(len(grid[0])):\n            if grid[i][j] != 1:\n                continue\n            per += 4\n            if i > 0 and grid[i - 1][j] == 1:\n                per -= 2\n            if j > 0 and grid[i][j - 1] == 1:\n                per -= 2\n    return per`,
        javascript: `var islandPerimeter = function(grid) {\n    let per = 0;\n    for (let i = 0; i < grid.length; i++) {\n        for (let j = 0; j < grid[0].length; j++) {\n            if (grid[i][j] !== 1) continue;\n            per += 4;\n            if (i > 0 && grid[i - 1][j] === 1) per -= 2;\n            if (j > 0 && grid[i][j - 1] === 1) per -= 2;\n        }\n    }\n    return per;\n};`,
              typescript: `function islandPerimeter(grid: number[][]): number {\n    const rows = grid.length;\n    const cols = grid[0].length;\n    let total = 0;\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (grid[i][j] !== 1) continue;\n            total += 4;\n            if (i > 0 && grid[i - 1][j] === 1) total -= 2;\n            if (j > 0 && grid[i][j - 1] === 1) total -= 2;\n        }\n    }\n    return total;\n}`,
              java: `public static int islandPerimeter(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length, total = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            total += 4;\n            if (i > 0 && grid[i - 1][j] == 1) total -= 2;\n            if (j > 0 && grid[i][j - 1] == 1) total -= 2;\n        }\n    }\n    return total;\n}`,
              cpp: `int islandPerimeter(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size(), total = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            total += 4;\n            if (i > 0 && grid[i - 1][j] == 1) total -= 2;\n            if (j > 0 && grid[i][j - 1] == 1) total -= 2;\n        }\n    }\n    return total;\n}`,
              c: `int islandPerimeter(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize;\n    int cols = gridColSize[0];\n    int total = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            total += 4;\n            if (i > 0 && grid[i - 1][j] == 1) total -= 2;\n            if (j > 0 && grid[i][j - 1] == 1) total -= 2;\n        }\n    }\n    return total;\n}`,
              csharp: `public static int IslandPerimeter(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length, total = 0;\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (grid[i][j] != 1) continue;\n            total += 4;\n            if (i > 0 && grid[i - 1][j] == 1) total -= 2;\n            if (j > 0 && grid[i][j - 1] == 1) total -= 2;\n        }\n    }\n    return total;\n}`,
              go: `func islandPerimeter(grid [][]int) int {\n	rows := len(grid)\n	cols := len(grid[0])\n	total := 0\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if grid[i][j] != 1 {\n				continue\n			}\n			total += 4\n			if i > 0 && grid[i-1][j] == 1 {\n				total -= 2\n			}\n			if j > 0 && grid[i][j-1] == 1 {\n				total -= 2\n			}\n		}\n	}\n	return total\n}`,
              kotlin: `fun islandPerimeter(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    var total = 0\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (grid[i][j] != 1) continue\n            total += 4\n            if (i > 0 && grid[i - 1][j] == 1) total -= 2\n            if (j > 0 && grid[i][j - 1] == 1) total -= 2\n        }\n    }\n    return total\n}`,
              swift: `func islandPerimeter(_ grid: [[Int]]) -> Int {\n    let rows = grid.count\n    let cols = grid[0].count\n    var total = 0\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if grid[i][j] != 1 { continue }\n            total += 4\n            if i > 0 && grid[i - 1][j] == 1 { total -= 2 }\n            if j > 0 && grid[i][j - 1] == 1 { total -= 2 }\n        }\n    }\n    return total\n}`,
              rust: `fn islandPerimeter(grid: Vec<Vec<i32>>) -> i32 {\n    let rows = grid.len();\n    let cols = grid[0].len();\n    let mut total = 0;\n    for i in 0..rows {\n        for j in 0..cols {\n            if grid[i][j] != 1 {\n                continue;\n            }\n            total += 4;\n            if i > 0 && grid[i - 1][j] == 1 {\n                total -= 2;\n            }\n            if j > 0 && grid[i][j - 1] == 1 {\n                total -= 2;\n            }\n        }\n    }\n    total\n}`,
              php: `function islandPerimeter($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $total = 0;\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($grid[$i][$j] !== 1) continue;\n            $total += 4;\n            if ($i > 0 && $grid[$i - 1][$j] === 1) $total -= 2;\n            if ($j > 0 && $grid[$i][$j - 1] === 1) $total -= 2;\n        }\n    }\n    return $total;\n}`,
              ruby: `def islandPerimeter(grid)\n  rows = grid.length\n  cols = grid[0].length\n  total = 0\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      next if grid[i][j] != 1\n      total += 4\n      total -= 2 if i > 0 && grid[i - 1][j] == 1\n      total -= 2 if j > 0 && grid[i][j - 1] == 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Number of Islands ───────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const g = grid.map((r) => [...r]);
      let count = 0;
      const sink = (i: number, j: number) => {
        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return;
        g[i][j] = 0;
        sink(i + 1, j); sink(i - 1, j); sink(i, j + 1); sink(i, j - 1);
      };
      for (let i = 0; i < g.length; i++) {
        for (let j = 0; j < g[0].length; j++) {
          if (g[i][j] === 1) {
            count++;
            sink(i, j);
          }
        }
      }
      return count;
    };
    return {
      slug: "number-of-islands",
      title: "Number of Islands",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search", "Union Find"],
      signature: { funcName: "numIslands", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m x n` grid of `1`s (land) and `0`s (water), return the **number of islands** — groups of land connected horizontally or vertically. The grid edges are surrounded by water.",
        [
          { in: "grid = [[1,1,1,1,0],[1,1,0,1,0],[1,1,0,0,0],[0,0,0,0,0]]", out: "1" },
          { in: "grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]", out: "3" },
        ],
        ["1 <= m, n <= 8", "grid[i][j] is 0 or 1."]),
      hints: [
        "Every time you meet unvisited land, that's a new island — flood it away.",
        "DFS/BFS marking visited land avoids counting a cell twice.",
      ],
      examples: [
        { input: "[[1,1,1,1,0],[1,1,0,1,0],[1,1,0,0,0],[0,0,0,0,0]]", expectedOutput: "1" },
        { input: "[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const grid = genMat(rng, 8, 8, 0, 1);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      editorial: explain({
        idea: "An island is a connected component of land. Sweep the grid, and each time you meet a land cell that has not been absorbed yet, you have found a component nobody has counted — increment the answer and **sink the whole island** so it is never counted again.",
        steps: [
          "Scan every cell in row-major order.",
          "Skip water and land already sunk.",
          "On fresh land, increment the island counter.",
          "Flood the component with a stack or queue, turning each visited land cell into water as it is pushed.",
          "Continue the outer scan; the counter is the answer.",
        ],
        why: "Sinking land as it is visited doubles as the visited marker, so each cell is processed once and the flood reaches exactly the component of its seed. That makes the outer loop start a traversal exactly once per island — never twice, because every other cell of that island is already water by the time the scan reaches it.",
        time: "O(rows · cols)",
        space: "O(rows · cols)",
        pitfalls: [
          "Sink cells when you **push** them, not when you pop, or the same cell enters the frontier repeatedly.",
          "Connectivity is 4-directional; counting diagonals merges islands that should stay separate.",
          "If mutating the input is unacceptable, keep a separate `visited` grid — but then you must check it as well as the land value.",
          "Bounds-check all four neighbours; the grid edge is water by definition, not by indexing luck.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef numIslands(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n    count = 0\n\n    def sink(i, j):\n        if i < 0 or j < 0 or i >= len(g) or j >= len(g[0]) or g[i][j] != 1:\n            return\n        g[i][j] = 0\n        sink(i + 1, j)\n        sink(i - 1, j)\n        sink(i, j + 1)\n        sink(i, j - 1)\n\n    for i in range(len(g)):\n        for j in range(len(g[0])):\n            if g[i][j] == 1:\n                count += 1\n                sink(i, j)\n    return count`,
        javascript: `var numIslands = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    let count = 0;\n    function sink(i, j) {\n        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return;\n        g[i][j] = 0;\n        sink(i + 1, j);\n        sink(i - 1, j);\n        sink(i, j + 1);\n        sink(i, j - 1);\n    }\n    for (let i = 0; i < g.length; i++) {\n        for (let j = 0; j < g[0].length; j++) {\n            if (g[i][j] === 1) {\n                count++;\n                sink(i, j);\n            }\n        }\n    }\n    return count;\n};`,
              typescript: `function numIslands(grid: number[][]): number {\n    const rows = grid.length;\n    const cols = grid[0].length;\n    const dr = [-1, 1, 0, 0];\n    const dc = [0, 0, -1, 1];\n    let islands = 0;\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (grid[i][j] !== 1) continue;\n            islands++;\n            const stack: number[][] = [[i, j]];\n            grid[i][j] = 0;\n            while (stack.length > 0) {\n                const cell = stack.pop() as number[];\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d];\n                    const nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {\n                        grid[nr][nc] = 0;\n                        stack.push([nr, nc]);\n                    }\n                }\n            }\n        }\n    }\n    return islands;\n}`,
              java: `public static int numIslands(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length, islands = 0;\n    int[] dr = {-1, 1, 0, 0};\n    int[] dc = {0, 0, -1, 1};\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            islands++;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{i, j});\n            grid[i][j] = 0;\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stack.push(new int[]{nr, nc});\n                    }\n                }\n            }\n        }\n    }\n    return islands;\n}`,
              cpp: `int numIslands(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size(), islands = 0;\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            islands++;\n            vector<pair<int, int>> stack;\n            stack.push_back(make_pair(i, j));\n            grid[i][j] = 0;\n            while (!stack.empty()) {\n                pair<int, int> cell = stack.back();\n                stack.pop_back();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stack.push_back(make_pair(nr, nc));\n                    }\n                }\n            }\n        }\n    }\n    return islands;\n}`,
              c: `int numIslands(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize;\n    int cols = gridColSize[0];\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int* stackR = (int*) malloc(rows * cols * sizeof(int));\n    int* stackC = (int*) malloc(rows * cols * sizeof(int));\n    int islands = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            islands++;\n            int top = 0;\n            stackR[top] = i;\n            stackC[top] = j;\n            top++;\n            grid[i][j] = 0;\n            while (top > 0) {\n                top--;\n                int r = stackR[top];\n                int c = stackC[top];\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d];\n                    int nc = c + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stackR[top] = nr;\n                        stackC[top] = nc;\n                        top++;\n                    }\n                }\n            }\n        }\n    }\n    free(stackR);\n    free(stackC);\n    return islands;\n}`,
              csharp: `public static int NumIslands(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length, islands = 0;\n    int[] dr = { -1, 1, 0, 0 };\n    int[] dc = { 0, 0, -1, 1 };\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (grid[i][j] != 1) continue;\n            islands++;\n            var stack = new Stack<int[]>();\n            stack.Push(new int[] { i, j });\n            grid[i][j] = 0;\n            while (stack.Count > 0)\n            {\n                int[] cell = stack.Pop();\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1)\n                    {\n                        grid[nr][nc] = 0;\n                        stack.Push(new int[] { nr, nc });\n                    }\n                }\n            }\n        }\n    }\n    return islands;\n}`,
              go: `func numIslands(grid [][]int) int {\n	rows := len(grid)\n	cols := len(grid[0])\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	islands := 0\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if grid[i][j] != 1 {\n				continue\n			}\n			islands++\n			stack := [][2]int{{i, j}}\n			grid[i][j] = 0\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				for d := 0; d < 4; d++ {\n					nr := cell[0] + dr[d]\n					nc := cell[1] + dc[d]\n					if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 {\n						grid[nr][nc] = 0\n						stack = append(stack, [2]int{nr, nc})\n					}\n				}\n			}\n		}\n	}\n	return islands\n}`,
              kotlin: `fun numIslands(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    var islands = 0\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (grid[i][j] != 1) continue\n            islands++\n            val stack = mutableListOf(intArrayOf(i, j))\n            grid[i][j] = 0\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr in 0 until rows && nc in 0 until cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0\n                        stack.add(intArrayOf(nr, nc))\n                    }\n                }\n            }\n        }\n    }\n    return islands\n}`,
              swift: `func numIslands(_ grid: [[Int]]) -> Int {\n    var g = grid\n    let rows = g.count\n    let cols = g[0].count\n    let dr = [-1, 1, 0, 0]\n    let dc = [0, 0, -1, 1]\n    var islands = 0\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if g[i][j] != 1 { continue }\n            islands += 1\n            var stack: [[Int]] = [[i, j]]\n            g[i][j] = 0\n            while !stack.isEmpty {\n                let cell = stack.removeLast()\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] == 1 {\n                        g[nr][nc] = 0\n                        stack.append([nr, nc])\n                    }\n                }\n            }\n        }\n    }\n    return islands\n}`,
              rust: `fn numIslands(grid: Vec<Vec<i32>>) -> i32 {\n    let mut g = grid;\n    let rows = g.len() as i32;\n    let cols = g[0].len() as i32;\n    let dr = [-1, 1, 0, 0];\n    let dc = [0, 0, -1, 1];\n    let mut islands = 0;\n    for i in 0..rows {\n        for j in 0..cols {\n            if g[i as usize][j as usize] != 1 {\n                continue;\n            }\n            islands += 1;\n            let mut stack: Vec<(i32, i32)> = vec![(i, j)];\n            g[i as usize][j as usize] = 0;\n            while let Some((r, c)) = stack.pop() {\n                for d in 0..4 {\n                    let nr = r + dr[d];\n                    let nc = c + dc[d];\n                    if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr as usize][nc as usize] == 1 {\n                        g[nr as usize][nc as usize] = 0;\n                        stack.push((nr, nc));\n                    }\n                }\n            }\n        }\n    }\n    islands\n}`,
              php: `function numIslands($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $dr = array(-1, 1, 0, 0);\n    $dc = array(0, 0, -1, 1);\n    $islands = 0;\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($grid[$i][$j] !== 1) continue;\n            $islands++;\n            $stack = array(array($i, $j));\n            $grid[$i][$j] = 0;\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $grid[$nr][$nc] === 1) {\n                        $grid[$nr][$nc] = 0;\n                        array_push($stack, array($nr, $nc));\n                    }\n                }\n            }\n        }\n    }\n    return $islands;\n}`,
              ruby: `def numIslands(grid)\n  rows = grid.length\n  cols = grid[0].length\n  dr = [-1, 1, 0, 0]\n  dc = [0, 0, -1, 1]\n  islands = 0\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      next if grid[i][j] != 1\n      islands += 1\n      stack = [[i, j]]\n      grid[i][j] = 0\n      while !stack.empty?\n        r, c = stack.pop\n        (0...4).each do |d|\n          nr = r + dr[d]\n          nc = c + dc[d]\n          if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1\n            grid[nr][nc] = 0\n            stack.push([nr, nc])\n          end\n        end\n      end\n    end\n  end\n  islands\nend`,
      },
    };
  })(),

  // ── Max Area of Island ──────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const g = grid.map((r) => [...r]);
      let best = 0;
      const area = (i: number, j: number): number => {
        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return 0;
        g[i][j] = 0;
        return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1);
      };
      for (let i = 0; i < g.length; i++) {
        for (let j = 0; j < g[0].length; j++) {
          best = Math.max(best, area(i, j));
        }
      }
      return best;
    };
    return {
      slug: "max-area-of-island",
      title: "Max Area of Island",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Depth-First Search"],
      signature: { funcName: "maxAreaOfIsland", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m x n` binary grid, return the **area of the largest island** (group of `1`s connected 4-directionally). Return `0` if there is no island.",
        [
          { in: "grid = [[1,1,0,0],[1,0,0,1],[0,0,1,1],[0,0,0,1]]", out: "4" },
          { in: "grid = [[0,0,0,0]]", out: "0" },
        ],
        ["1 <= m, n <= 8", "grid[i][j] is 0 or 1."]),
      hints: [
        "DFS from each land cell returns the island's size while sinking it.",
        "Track the maximum size across all starting cells.",
      ],
      examples: [
        { input: "[[1,1,0,0],[1,0,0,1],[0,0,1,1],[0,0,0,1]]", expectedOutput: "4" },
        { input: "[[0,0,0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const grid = genMat(rng, 8, 8, 0, 1);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      editorial: explain({
        idea: "Same island sweep as counting them, except each flood **returns the size** of the component it consumed instead of just marking it. Track the largest size seen across all starting cells.",
        steps: [
          "Scan every cell; skip anything that is not fresh land.",
          "From a fresh land cell, flood the whole component, sinking each cell as it is pushed and counting how many you sink.",
          "Compare that count with the best so far.",
          "Continue the scan and return the maximum, or `0` if the grid holds no land.",
        ],
        why: "Because the flood sinks each cell exactly once, the count it returns is precisely the number of cells in that connected component — no cell is counted twice and none is missed. Every island is reached by the outer scan exactly once, so the maximum over all floods is the largest island. A grid with no land never enters the flood, leaving the initial `0`, which is the required answer.",
        time: "O(rows · cols)",
        space: "O(rows · cols)",
        pitfalls: [
          "Count a cell when you sink it — counting on pop plus pushing duplicates would inflate the area.",
          "Reset the area counter for each new island; carrying it over sums unrelated islands together.",
          "An empty grid must return `0`, not a sentinel.",
          "Sink on push so no cell is enqueued twice.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxAreaOfIsland(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n\n    def area(i, j):\n        if i < 0 or j < 0 or i >= len(g) or j >= len(g[0]) or g[i][j] != 1:\n            return 0\n        g[i][j] = 0\n        return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1)\n\n    best = 0\n    for i in range(len(g)):\n        for j in range(len(g[0])):\n            best = max(best, area(i, j))\n    return best`,
        javascript: `var maxAreaOfIsland = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    function area(i, j) {\n        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return 0;\n        g[i][j] = 0;\n        return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1);\n    }\n    let best = 0;\n    for (let i = 0; i < g.length; i++) {\n        for (let j = 0; j < g[0].length; j++) {\n            best = Math.max(best, area(i, j));\n        }\n    }\n    return best;\n};`,
              typescript: `function maxAreaOfIsland(grid: number[][]): number {\n    const rows = grid.length;\n    const cols = grid[0].length;\n    const dr = [-1, 1, 0, 0];\n    const dc = [0, 0, -1, 1];\n    let best = 0;\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (grid[i][j] !== 1) continue;\n            let area = 0;\n            const stack: number[][] = [[i, j]];\n            grid[i][j] = 0;\n            while (stack.length > 0) {\n                const cell = stack.pop() as number[];\n                area++;\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d];\n                    const nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {\n                        grid[nr][nc] = 0;\n                        stack.push([nr, nc]);\n                    }\n                }\n            }\n            if (area > best) best = area;\n        }\n    }\n    return best;\n}`,
              java: `public static int maxAreaOfIsland(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length, best = 0;\n    int[] dr = {-1, 1, 0, 0};\n    int[] dc = {0, 0, -1, 1};\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            int area = 0;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{i, j});\n            grid[i][j] = 0;\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                area++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stack.push(new int[]{nr, nc});\n                    }\n                }\n            }\n            if (area > best) best = area;\n        }\n    }\n    return best;\n}`,
              cpp: `int maxAreaOfIsland(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size(), best = 0;\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            int area = 0;\n            vector<pair<int, int>> stack;\n            stack.push_back(make_pair(i, j));\n            grid[i][j] = 0;\n            while (!stack.empty()) {\n                pair<int, int> cell = stack.back();\n                stack.pop_back();\n                area++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stack.push_back(make_pair(nr, nc));\n                    }\n                }\n            }\n            if (area > best) best = area;\n        }\n    }\n    return best;\n}`,
              c: `int maxAreaOfIsland(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize;\n    int cols = gridColSize[0];\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int* stackR = (int*) malloc(rows * cols * sizeof(int));\n    int* stackC = (int*) malloc(rows * cols * sizeof(int));\n    int best = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] != 1) continue;\n            int area = 0;\n            int top = 0;\n            stackR[top] = i;\n            stackC[top] = j;\n            top++;\n            grid[i][j] = 0;\n            while (top > 0) {\n                top--;\n                int r = stackR[top];\n                int c = stackC[top];\n                area++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d];\n                    int nc = c + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0;\n                        stackR[top] = nr;\n                        stackC[top] = nc;\n                        top++;\n                    }\n                }\n            }\n            if (area > best) best = area;\n        }\n    }\n    free(stackR);\n    free(stackC);\n    return best;\n}`,
              csharp: `public static int MaxAreaOfIsland(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length, best = 0;\n    int[] dr = { -1, 1, 0, 0 };\n    int[] dc = { 0, 0, -1, 1 };\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (grid[i][j] != 1) continue;\n            int area = 0;\n            var stack = new Stack<int[]>();\n            stack.Push(new int[] { i, j });\n            grid[i][j] = 0;\n            while (stack.Count > 0)\n            {\n                int[] cell = stack.Pop();\n                area++;\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1)\n                    {\n                        grid[nr][nc] = 0;\n                        stack.Push(new int[] { nr, nc });\n                    }\n                }\n            }\n            if (area > best) best = area;\n        }\n    }\n    return best;\n}`,
              go: `func maxAreaOfIsland(grid [][]int) int {\n	rows := len(grid)\n	cols := len(grid[0])\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	best := 0\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if grid[i][j] != 1 {\n				continue\n			}\n			area := 0\n			stack := [][2]int{{i, j}}\n			grid[i][j] = 0\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				area++\n				for d := 0; d < 4; d++ {\n					nr := cell[0] + dr[d]\n					nc := cell[1] + dc[d]\n					if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 {\n						grid[nr][nc] = 0\n						stack = append(stack, [2]int{nr, nc})\n					}\n				}\n			}\n			if area > best {\n				best = area\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxAreaOfIsland(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    var best = 0\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (grid[i][j] != 1) continue\n            var area = 0\n            val stack = mutableListOf(intArrayOf(i, j))\n            grid[i][j] = 0\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                area++\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr in 0 until rows && nc in 0 until cols && grid[nr][nc] == 1) {\n                        grid[nr][nc] = 0\n                        stack.add(intArrayOf(nr, nc))\n                    }\n                }\n            }\n            if (area > best) best = area\n        }\n    }\n    return best\n}`,
              swift: `func maxAreaOfIsland(_ grid: [[Int]]) -> Int {\n    var g = grid\n    let rows = g.count\n    let cols = g[0].count\n    let dr = [-1, 1, 0, 0]\n    let dc = [0, 0, -1, 1]\n    var best = 0\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if g[i][j] != 1 { continue }\n            var area = 0\n            var stack: [[Int]] = [[i, j]]\n            g[i][j] = 0\n            while !stack.isEmpty {\n                let cell = stack.removeLast()\n                area += 1\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] == 1 {\n                        g[nr][nc] = 0\n                        stack.append([nr, nc])\n                    }\n                }\n            }\n            if area > best { best = area }\n        }\n    }\n    return best\n}`,
              rust: `fn maxAreaOfIsland(grid: Vec<Vec<i32>>) -> i32 {\n    let mut g = grid;\n    let rows = g.len() as i32;\n    let cols = g[0].len() as i32;\n    let dr = [-1, 1, 0, 0];\n    let dc = [0, 0, -1, 1];\n    let mut best = 0;\n    for i in 0..rows {\n        for j in 0..cols {\n            if g[i as usize][j as usize] != 1 {\n                continue;\n            }\n            let mut area = 0;\n            let mut stack: Vec<(i32, i32)> = vec![(i, j)];\n            g[i as usize][j as usize] = 0;\n            while let Some((r, c)) = stack.pop() {\n                area += 1;\n                for d in 0..4 {\n                    let nr = r + dr[d];\n                    let nc = c + dc[d];\n                    if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr as usize][nc as usize] == 1 {\n                        g[nr as usize][nc as usize] = 0;\n                        stack.push((nr, nc));\n                    }\n                }\n            }\n            if area > best {\n                best = area;\n            }\n        }\n    }\n    best\n}`,
              php: `function maxAreaOfIsland($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $dr = array(-1, 1, 0, 0);\n    $dc = array(0, 0, -1, 1);\n    $best = 0;\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($grid[$i][$j] !== 1) continue;\n            $area = 0;\n            $stack = array(array($i, $j));\n            $grid[$i][$j] = 0;\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                $area++;\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $grid[$nr][$nc] === 1) {\n                        $grid[$nr][$nc] = 0;\n                        array_push($stack, array($nr, $nc));\n                    }\n                }\n            }\n            if ($area > $best) $best = $area;\n        }\n    }\n    return $best;\n}`,
              ruby: `def maxAreaOfIsland(grid)\n  rows = grid.length\n  cols = grid[0].length\n  dr = [-1, 1, 0, 0]\n  dc = [0, 0, -1, 1]\n  best = 0\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      next if grid[i][j] != 1\n      area = 0\n      stack = [[i, j]]\n      grid[i][j] = 0\n      while !stack.empty?\n        r, c = stack.pop\n        area += 1\n        (0...4).each do |d|\n          nr = r + dr[d]\n          nc = c + dc[d]\n          if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1\n            grid[nr][nc] = 0\n            stack.push([nr, nc])\n          end\n        end\n      end\n      best = area if area > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Rotting Oranges ─────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const g = grid.map((r) => [...r]);
      const R = g.length, C = g[0].length;
      let fresh = 0;
      let queue: Array<[number, number]> = [];
      for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
          if (g[i][j] === 1) fresh++;
          else if (g[i][j] === 2) queue.push([i, j]);
        }
      }
      let minutes = 0;
      while (fresh > 0 && queue.length > 0) {
        const next: Array<[number, number]> = [];
        for (const [i, j] of queue) {
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && nj >= 0 && ni < R && nj < C && g[ni][nj] === 1) {
              g[ni][nj] = 2;
              fresh--;
              next.push([ni, nj]);
            }
          }
        }
        queue = next;
        if (next.length > 0) minutes++;
      }
      return fresh === 0 ? minutes : -1;
    };
    return {
      slug: "rotting-oranges",
      title: "Rotting Oranges",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Breadth-First Search"],
      signature: { funcName: "orangesRotting", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "In a grid, `0` is empty, `1` is a fresh orange, and `2` is a rotten orange. Every minute, fresh oranges 4-directionally adjacent to a rotten one become rotten.\n\nReturn the **minimum minutes** until no fresh orange remains, or `-1` if that never happens.",
        [
          { in: "grid = [[2,1,1],[1,1,0],[0,1,1]]", out: "4" },
          { in: "grid = [[2,1,1],[0,1,1],[1,0,1]]", out: "-1", note: "The bottom-left orange can never rot." },
          { in: "grid = [[0,2]]", out: "0" },
        ],
        ["1 <= rows, cols <= 8", "grid[i][j] is 0, 1, or 2."]),
      hints: [
        "Multi-source BFS starting from ALL rotten oranges at once.",
        "Each BFS level is one minute; count remaining fresh oranges at the end.",
      ],
      examples: [
        { input: "[[2,1,1],[1,1,0],[0,1,1]]", expectedOutput: "4" },
        { input: "[[2,1,1],[0,1,1],[1,0,1]]", expectedOutput: "-1" },
        { input: "[[0,2]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const grid = genMat(rng, 8, 8, 0, 2);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      editorial: explain({
        idea: "Rot spreads from **every** rotten orange simultaneously, so this is a multi-source BFS. Seed the queue with all initially rotten oranges at once and expand one full level per minute; the number of levels is the answer, and any fresh orange left unreached means it never rots.",
        steps: [
          "Scan the grid: count the fresh oranges and enqueue every rotten one.",
          "If there are no fresh oranges, return `0` immediately.",
          "Process the queue **level by level** — each level is one minute.",
          "For each rotten orange in the level, rot every fresh 4-directional neighbour, decrement the fresh count and enqueue it.",
          "After the BFS, return the number of minutes if no fresh oranges remain, otherwise `-1`.",
        ],
        why: "Seeding all sources together makes the BFS compute, for every cell, the distance to its *nearest* rotten orange — which is exactly when it rots, since rot arrives along the shortest path. Because BFS visits cells in non-decreasing distance, counting levels counts minutes correctly. Any orange still fresh at the end is unreachable from every source, so no amount of waiting will rot it.",
        time: "O(rows · cols)",
        space: "O(rows · cols)",
        pitfalls: [
          "Seed **all** rotten oranges before starting; running BFS from each one separately gives wrong times.",
          "A grid with no fresh oranges answers `0` even if there are no rotten ones either.",
          "Count levels, not cells — incrementing the minute per orange massively over-counts.",
          "Do not increment the minute for the seed level; the initial rotten oranges are at time zero.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef orangesRotting(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n    R, C = len(g), len(g[0])\n    fresh = 0\n    queue = deque()\n    for i in range(R):\n        for j in range(C):\n            if g[i][j] == 1:\n                fresh += 1\n            elif g[i][j] == 2:\n                queue.append((i, j))\n    minutes = 0\n    while fresh > 0 and queue:\n        nxt = deque()\n        for i, j in queue:\n            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                ni, nj = i + di, j + dj\n                if 0 <= ni < R and 0 <= nj < C and g[ni][nj] == 1:\n                    g[ni][nj] = 2\n                    fresh -= 1\n                    nxt.append((ni, nj))\n        queue = nxt\n        if nxt:\n            minutes += 1\n    return minutes if fresh == 0 else -1`,
        javascript: `var orangesRotting = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    const R = g.length, C = g[0].length;\n    let fresh = 0;\n    let queue = [];\n    for (let i = 0; i < R; i++) {\n        for (let j = 0; j < C; j++) {\n            if (g[i][j] === 1) fresh++;\n            else if (g[i][j] === 2) queue.push([i, j]);\n        }\n    }\n    let minutes = 0;\n    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n    while (fresh > 0 && queue.length > 0) {\n        const next = [];\n        for (const cell of queue) {\n            for (const d of dirs) {\n                const ni = cell[0] + d[0], nj = cell[1] + d[1];\n                if (ni >= 0 && nj >= 0 && ni < R && nj < C && g[ni][nj] === 1) {\n                    g[ni][nj] = 2;\n                    fresh--;\n                    next.push([ni, nj]);\n                }\n            }\n        }\n        queue = next;\n        if (next.length > 0) minutes++;\n    }\n    return fresh === 0 ? minutes : -1;\n};`,
              typescript: `function orangesRotting(grid: number[][]): number {\n    const rows = grid.length;\n    const cols = grid[0].length;\n    const dr = [-1, 1, 0, 0];\n    const dc = [0, 0, -1, 1];\n    let fresh = 0;\n    const queue: number[][] = [];\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) {\n            if (grid[i][j] === 1) fresh++;\n            else if (grid[i][j] === 2) queue.push([i, j]);\n        }\n    }\n    if (fresh === 0) return 0;\n    let head = 0;\n    let minutes = 0;\n    while (head < queue.length && fresh > 0) {\n        const levelEnd = queue.length;\n        while (head < levelEnd) {\n            const cell = queue[head++];\n            for (let d = 0; d < 4; d++) {\n                const nr = cell[0] + dr[d];\n                const nc = cell[1] + dc[d];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {\n                    grid[nr][nc] = 2;\n                    fresh--;\n                    queue.push([nr, nc]);\n                }\n            }\n        }\n        minutes++;\n    }\n    return fresh === 0 ? minutes : -1;\n}`,
              java: `public static int orangesRotting(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length;\n    int[] dr = {-1, 1, 0, 0};\n    int[] dc = {0, 0, -1, 1};\n    int fresh = 0;\n    List<int[]> queue = new ArrayList<>();\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] == 1) fresh++;\n            else if (grid[i][j] == 2) queue.add(new int[]{i, j});\n        }\n    }\n    if (fresh == 0) return 0;\n    int head = 0, minutes = 0;\n    while (head < queue.size() && fresh > 0) {\n        int levelEnd = queue.size();\n        while (head < levelEnd) {\n            int[] cell = queue.get(head++);\n            for (int d = 0; d < 4; d++) {\n                int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                    grid[nr][nc] = 2;\n                    fresh--;\n                    queue.add(new int[]{nr, nc});\n                }\n            }\n        }\n        minutes++;\n    }\n    return fresh == 0 ? minutes : -1;\n}`,
              cpp: `int orangesRotting(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size();\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int fresh = 0;\n    vector<pair<int, int>> queue;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] == 1) fresh++;\n            else if (grid[i][j] == 2) queue.push_back(make_pair(i, j));\n        }\n    }\n    if (fresh == 0) return 0;\n    size_t head = 0;\n    int minutes = 0;\n    while (head < queue.size() && fresh > 0) {\n        size_t levelEnd = queue.size();\n        while (head < levelEnd) {\n            pair<int, int> cell = queue[head++];\n            for (int d = 0; d < 4; d++) {\n                int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                    grid[nr][nc] = 2;\n                    fresh--;\n                    queue.push_back(make_pair(nr, nc));\n                }\n            }\n        }\n        minutes++;\n    }\n    return fresh == 0 ? minutes : -1;\n}`,
              c: `int orangesRotting(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize;\n    int cols = gridColSize[0];\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int fresh = 0;\n    int cap = rows * cols;\n    int* qr = (int*) malloc(cap * sizeof(int));\n    int* qc = (int*) malloc(cap * sizeof(int));\n    int tail = 0;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (grid[i][j] == 1) fresh++;\n            else if (grid[i][j] == 2) {\n                qr[tail] = i;\n                qc[tail] = j;\n                tail++;\n            }\n        }\n    }\n    if (fresh == 0) {\n        free(qr);\n        free(qc);\n        return 0;\n    }\n    int head = 0;\n    int minutes = 0;\n    while (head < tail && fresh > 0) {\n        int levelEnd = tail;\n        while (head < levelEnd) {\n            int r = qr[head];\n            int c = qc[head];\n            head++;\n            for (int d = 0; d < 4; d++) {\n                int nr = r + dr[d];\n                int nc = c + dc[d];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                    grid[nr][nc] = 2;\n                    fresh--;\n                    qr[tail] = nr;\n                    qc[tail] = nc;\n                    tail++;\n                }\n            }\n        }\n        minutes++;\n    }\n    free(qr);\n    free(qc);\n    return fresh == 0 ? minutes : -1;\n}`,
              csharp: `public static int OrangesRotting(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length;\n    int[] dr = { -1, 1, 0, 0 };\n    int[] dc = { 0, 0, -1, 1 };\n    int fresh = 0;\n    var queue = new List<int[]>();\n    for (int i = 0; i < rows; i++)\n    {\n        for (int j = 0; j < cols; j++)\n        {\n            if (grid[i][j] == 1) fresh++;\n            else if (grid[i][j] == 2) queue.Add(new int[] { i, j });\n        }\n    }\n    if (fresh == 0) return 0;\n    int head = 0, minutes = 0;\n    while (head < queue.Count && fresh > 0)\n    {\n        int levelEnd = queue.Count;\n        while (head < levelEnd)\n        {\n            int[] cell = queue[head++];\n            for (int d = 0; d < 4; d++)\n            {\n                int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1)\n                {\n                    grid[nr][nc] = 2;\n                    fresh--;\n                    queue.Add(new int[] { nr, nc });\n                }\n            }\n        }\n        minutes++;\n    }\n    return fresh == 0 ? minutes : -1;\n}`,
              go: `func orangesRotting(grid [][]int) int {\n	rows := len(grid)\n	cols := len(grid[0])\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	fresh := 0\n	queue := [][2]int{}\n	for i := 0; i < rows; i++ {\n		for j := 0; j < cols; j++ {\n			if grid[i][j] == 1 {\n				fresh++\n			} else if grid[i][j] == 2 {\n				queue = append(queue, [2]int{i, j})\n			}\n		}\n	}\n	if fresh == 0 {\n		return 0\n	}\n	head := 0\n	minutes := 0\n	for head < len(queue) && fresh > 0 {\n		levelEnd := len(queue)\n		for head < levelEnd {\n			cell := queue[head]\n			head++\n			for d := 0; d < 4; d++ {\n				nr := cell[0] + dr[d]\n				nc := cell[1] + dc[d]\n				if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 {\n					grid[nr][nc] = 2\n					fresh--\n					queue = append(queue, [2]int{nr, nc})\n				}\n			}\n		}\n		minutes++\n	}\n	if fresh == 0 {\n		return minutes\n	}\n	return -1\n}`,
              kotlin: `fun orangesRotting(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    var fresh = 0\n    val queue = mutableListOf<IntArray>()\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (grid[i][j] == 1) fresh++\n            else if (grid[i][j] == 2) queue.add(intArrayOf(i, j))\n        }\n    }\n    if (fresh == 0) return 0\n    var head = 0\n    var minutes = 0\n    while (head < queue.size && fresh > 0) {\n        val levelEnd = queue.size\n        while (head < levelEnd) {\n            val cell = queue[head++]\n            for (d in 0 until 4) {\n                val nr = cell[0] + dr[d]\n                val nc = cell[1] + dc[d]\n                if (nr in 0 until rows && nc in 0 until cols && grid[nr][nc] == 1) {\n                    grid[nr][nc] = 2\n                    fresh--\n                    queue.add(intArrayOf(nr, nc))\n                }\n            }\n        }\n        minutes++\n    }\n    return if (fresh == 0) minutes else -1\n}`,
              swift: `func orangesRotting(_ grid: [[Int]]) -> Int {\n    var g = grid\n    let rows = g.count\n    let cols = g[0].count\n    let dr = [-1, 1, 0, 0]\n    let dc = [0, 0, -1, 1]\n    var fresh = 0\n    var queue: [[Int]] = []\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if g[i][j] == 1 { fresh += 1 }\n            else if g[i][j] == 2 { queue.append([i, j]) }\n        }\n    }\n    if fresh == 0 { return 0 }\n    var head = 0\n    var minutes = 0\n    while head < queue.count && fresh > 0 {\n        let levelEnd = queue.count\n        while head < levelEnd {\n            let cell = queue[head]\n            head += 1\n            for d in 0..<4 {\n                let nr = cell[0] + dr[d]\n                let nc = cell[1] + dc[d]\n                if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] == 1 {\n                    g[nr][nc] = 2\n                    fresh -= 1\n                    queue.append([nr, nc])\n                }\n            }\n        }\n        minutes += 1\n    }\n    return fresh == 0 ? minutes : -1\n}`,
              rust: `fn orangesRotting(grid: Vec<Vec<i32>>) -> i32 {\n    let mut g = grid;\n    let rows = g.len() as i32;\n    let cols = g[0].len() as i32;\n    let dr = [-1, 1, 0, 0];\n    let dc = [0, 0, -1, 1];\n    let mut fresh = 0;\n    let mut queue: Vec<(i32, i32)> = Vec::new();\n    for i in 0..rows {\n        for j in 0..cols {\n            let v = g[i as usize][j as usize];\n            if v == 1 {\n                fresh += 1;\n            } else if v == 2 {\n                queue.push((i, j));\n            }\n        }\n    }\n    if fresh == 0 {\n        return 0;\n    }\n    let mut head = 0usize;\n    let mut minutes = 0;\n    while head < queue.len() && fresh > 0 {\n        let level_end = queue.len();\n        while head < level_end {\n            let (r, c) = queue[head];\n            head += 1;\n            for d in 0..4 {\n                let nr = r + dr[d];\n                let nc = c + dc[d];\n                if nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr as usize][nc as usize] == 1 {\n                    g[nr as usize][nc as usize] = 2;\n                    fresh -= 1;\n                    queue.push((nr, nc));\n                }\n            }\n        }\n        minutes += 1;\n    }\n    if fresh == 0 { minutes } else { -1 }\n}`,
              php: `function orangesRotting($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $dr = array(-1, 1, 0, 0);\n    $dc = array(0, 0, -1, 1);\n    $fresh = 0;\n    $queue = array();\n    for ($i = 0; $i < $rows; $i++) {\n        for ($j = 0; $j < $cols; $j++) {\n            if ($grid[$i][$j] === 1) $fresh++;\n            elseif ($grid[$i][$j] === 2) $queue[] = array($i, $j);\n        }\n    }\n    if ($fresh === 0) return 0;\n    $head = 0;\n    $minutes = 0;\n    while ($head < count($queue) && $fresh > 0) {\n        $levelEnd = count($queue);\n        while ($head < $levelEnd) {\n            $cell = $queue[$head];\n            $head++;\n            for ($d = 0; $d < 4; $d++) {\n                $nr = $cell[0] + $dr[$d];\n                $nc = $cell[1] + $dc[$d];\n                if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $grid[$nr][$nc] === 1) {\n                    $grid[$nr][$nc] = 2;\n                    $fresh--;\n                    $queue[] = array($nr, $nc);\n                }\n            }\n        }\n        $minutes++;\n    }\n    return $fresh === 0 ? $minutes : -1;\n}`,
              ruby: `def orangesRotting(grid)\n  rows = grid.length\n  cols = grid[0].length\n  dr = [-1, 1, 0, 0]\n  dc = [0, 0, -1, 1]\n  fresh = 0\n  queue = []\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      if grid[i][j] == 1\n        fresh += 1\n      elsif grid[i][j] == 2\n        queue.push([i, j])\n      end\n    end\n  end\n  return 0 if fresh == 0\n  head = 0\n  minutes = 0\n  while head < queue.length && fresh > 0\n    level_end = queue.length\n    while head < level_end\n      r, c = queue[head]\n      head += 1\n      (0...4).each do |d|\n        nr = r + dr[d]\n        nc = c + dc[d]\n        if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1\n          grid[nr][nc] = 2\n          fresh -= 1\n          queue.push([nr, nc])\n        end\n      end\n    end\n    minutes += 1\n  end\n  fresh == 0 ? minutes : -1\nend`,
      },
    };
  })(),

  // ── 01 Matrix ───────────────────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const R = mat.length, C = mat[0].length;
      const dist = mat.map((row) => row.map((v) => (v === 0 ? 0 : Infinity)));
      let queue: Array<[number, number]> = [];
      for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
          if (mat[i][j] === 0) queue.push([i, j]);
        }
      }
      while (queue.length > 0) {
        const next: Array<[number, number]> = [];
        for (const [i, j] of queue) {
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && nj >= 0 && ni < R && nj < C && dist[ni][nj] > dist[i][j] + 1) {
              dist[ni][nj] = dist[i][j] + 1;
              next.push([ni, nj]);
            }
          }
        }
        queue = next;
      }
      return dist;
    };
    return {
      slug: "01-matrix",
      title: "01 Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Breadth-First Search", "Dynamic Programming"],
      signature: { funcName: "updateMatrix", params: [{ name: "mat", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given a binary matrix `mat`, return a matrix of the **distance from each cell to the nearest `0`** (steps between 4-directionally adjacent cells). The tests guarantee at least one `0`.",
        [
          { in: "mat = [[0,0,0],[0,1,0],[0,0,0]]", out: "[[0,0,0],[0,1,0],[0,0,0]]" },
          { in: "mat = [[0,0,0],[0,1,0],[1,1,1]]", out: "[[0,0,0],[0,1,0],[1,2,1]]" },
        ],
        ["1 <= rows, cols <= 7", "mat[i][j] is 0 or 1; at least one 0 exists."]),
      hints: [
        "Multi-source BFS from every 0 simultaneously.",
        "The BFS wavefront assigns each 1 its distance the first time it's reached.",
      ],
      examples: [
        { input: "[[0,0,0],[0,1,0],[0,0,0]]", expectedOutput: "[[0,0,0],[0,1,0],[0,0,0]]" },
        { input: "[[0,0,0],[0,1,0],[1,1,1]]", expectedOutput: "[[0,0,0],[0,1,0],[1,2,1]]" },
      ],
      gen: (rng: Rng) => {
        const mat = genMat(rng, 7, 7, 0, 1);
        mat[ri(rng, 0, mat.length - 1)][ri(rng, 0, mat[0].length - 1)] = 0;
        return { input: fmtIntMat(mat), expectedOutput: fmtIntMat(ref(mat)) };
      },
      editorial: explain({
        idea: "Running a separate search from every `1` would be quadratic. Invert it: run **one** BFS seeded with every `0` at once. A multi-source wavefront expanding outward assigns each cell its distance to the nearest source the first time it is reached.",
        steps: [
          "Build a distance grid: `0` where the input is `0`, and an \"unvisited\" marker (say `-1`) where it is `1`.",
          "Enqueue every zero cell as a BFS source.",
          "Pop a cell and look at its four neighbours.",
          "Any neighbour still marked unvisited gets `dist[current] + 1` and joins the queue.",
          "When the queue drains, every cell holds its distance to the nearest zero.",
        ],
        why: "BFS from a single source visits cells in non-decreasing distance; with many sources the wavefront is the union of all of them, so the first time a cell is reached is along a shortest path from the *closest* source. Marking distance at enqueue time is what locks that in — a later, longer path finds the cell already visited and cannot overwrite it. The problem guarantees at least one zero, so every cell is eventually reached.",
        time: "O(rows · cols)",
        space: "O(rows · cols)",
        pitfalls: [
          "Seed **all** zeros before starting; a per-cell BFS is correct but far slower.",
          "Use a distinct unvisited marker — initialising distances to `0` makes zero cells and unvisited cells indistinguishable.",
          "Set the distance when you enqueue, not when you dequeue, or a cell can be queued several times with different values.",
          "Only 4-directional moves count as one step.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef updateMatrix(mat: List[List[int]]) -> List[List[int]]:\n    R, C = len(mat), len(mat[0])\n    INF = float("inf")\n    dist = [[0 if mat[i][j] == 0 else INF for j in range(C)] for i in range(R)]\n    queue = deque((i, j) for i in range(R) for j in range(C) if mat[i][j] == 0)\n    while queue:\n        i, j = queue.popleft()\n        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            ni, nj = i + di, j + dj\n            if 0 <= ni < R and 0 <= nj < C and dist[ni][nj] > dist[i][j] + 1:\n                dist[ni][nj] = dist[i][j] + 1\n                queue.append((ni, nj))\n    return [[int(x) for x in row] for row in dist]`,
        javascript: `var updateMatrix = function(mat) {\n    const R = mat.length, C = mat[0].length;\n    const dist = mat.map(function(row) {\n        return row.map(function(v) { return v === 0 ? 0 : Infinity; });\n    });\n    let queue = [];\n    for (let i = 0; i < R; i++) {\n        for (let j = 0; j < C; j++) {\n            if (mat[i][j] === 0) queue.push([i, j]);\n        }\n    }\n    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n    while (queue.length > 0) {\n        const next = [];\n        for (const cell of queue) {\n            for (const d of dirs) {\n                const ni = cell[0] + d[0], nj = cell[1] + d[1];\n                if (ni >= 0 && nj >= 0 && ni < R && nj < C && dist[ni][nj] > dist[cell[0]][cell[1]] + 1) {\n                    dist[ni][nj] = dist[cell[0]][cell[1]] + 1;\n                    next.push([ni, nj]);\n                }\n            }\n        }\n        queue = next;\n    }\n    return dist;\n};`,
              typescript: `function updateMatrix(mat: number[][]): number[][] {\n    const rows = mat.length;\n    const cols = mat[0].length;\n    const dr = [-1, 1, 0, 0];\n    const dc = [0, 0, -1, 1];\n    const dist: number[][] = [];\n    const queue: number[][] = [];\n    for (let i = 0; i < rows; i++) {\n        const row: number[] = [];\n        for (let j = 0; j < cols; j++) {\n            if (mat[i][j] === 0) {\n                row.push(0);\n                queue.push([i, j]);\n            } else {\n                row.push(-1);\n            }\n        }\n        dist.push(row);\n    }\n    let head = 0;\n    while (head < queue.length) {\n        const cell = queue[head++];\n        for (let d = 0; d < 4; d++) {\n            const nr = cell[0] + dr[d];\n            const nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === -1) {\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.push([nr, nc]);\n            }\n        }\n    }\n    return dist;\n}`,
              java: `public static int[][] updateMatrix(int[][] mat) {\n    int rows = mat.length, cols = mat[0].length;\n    int[] dr = {-1, 1, 0, 0};\n    int[] dc = {0, 0, -1, 1};\n    int[][] dist = new int[rows][cols];\n    List<int[]> queue = new ArrayList<>();\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (mat[i][j] == 0) {\n                dist[i][j] = 0;\n                queue.add(new int[]{i, j});\n            } else {\n                dist[i][j] = -1;\n            }\n        }\n    }\n    int head = 0;\n    while (head < queue.size()) {\n        int[] cell = queue.get(head++);\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.add(new int[]{nr, nc});\n            }\n        }\n    }\n    return dist;\n}`,
              cpp: `vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {\n    int rows = (int) mat.size(), cols = (int) mat[0].size();\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    vector<vector<int>> dist(rows, vector<int>(cols, -1));\n    vector<pair<int, int>> queue;\n    for (int i = 0; i < rows; i++) {\n        for (int j = 0; j < cols; j++) {\n            if (mat[i][j] == 0) {\n                dist[i][j] = 0;\n                queue.push_back(make_pair(i, j));\n            }\n        }\n    }\n    size_t head = 0;\n    while (head < queue.size()) {\n        pair<int, int> cell = queue[head++];\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[cell.first][cell.second] + 1;\n                queue.push_back(make_pair(nr, nc));\n            }\n        }\n    }\n    return dist;\n}`,
              c: `int** updateMatrix(int** mat, int matSize, int* matColSize, int* returnSize, int** returnColumnSizes) {\n    int rows = matSize;\n    int cols = matColSize[0];\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int** dist = (int**) malloc(rows * sizeof(int*));\n    int* sizes = (int*) malloc(rows * sizeof(int));\n    int cap = rows * cols;\n    int* qr = (int*) malloc(cap * sizeof(int));\n    int* qc = (int*) malloc(cap * sizeof(int));\n    int tail = 0;\n    for (int i = 0; i < rows; i++) {\n        dist[i] = (int*) malloc(cols * sizeof(int));\n        sizes[i] = cols;\n        for (int j = 0; j < cols; j++) {\n            if (mat[i][j] == 0) {\n                dist[i][j] = 0;\n                qr[tail] = i;\n                qc[tail] = j;\n                tail++;\n            } else {\n                dist[i][j] = -1;\n            }\n        }\n    }\n    int head = 0;\n    while (head < tail) {\n        int r = qr[head];\n        int c = qc[head];\n        head++;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d];\n            int nc = c + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[r][c] + 1;\n                qr[tail] = nr;\n                qc[tail] = nc;\n                tail++;\n            }\n        }\n    }\n    free(qr);\n    free(qc);\n    *returnSize = rows;\n    *returnColumnSizes = sizes;\n    return dist;\n}`,
              csharp: `public static int[][] UpdateMatrix(int[][] mat)\n{\n    int rows = mat.Length, cols = mat[0].Length;\n    int[] dr = { -1, 1, 0, 0 };\n    int[] dc = { 0, 0, -1, 1 };\n    int[][] dist = new int[rows][];\n    var queue = new List<int[]>();\n    for (int i = 0; i < rows; i++)\n    {\n        dist[i] = new int[cols];\n        for (int j = 0; j < cols; j++)\n        {\n            if (mat[i][j] == 0)\n            {\n                dist[i][j] = 0;\n                queue.Add(new int[] { i, j });\n            }\n            else\n            {\n                dist[i][j] = -1;\n            }\n        }\n    }\n    int head = 0;\n    while (head < queue.Count)\n    {\n        int[] cell = queue[head++];\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1)\n            {\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.Add(new int[] { nr, nc });\n            }\n        }\n    }\n    return dist;\n}`,
              go: `func updateMatrix(mat [][]int) [][]int {\n	rows := len(mat)\n	cols := len(mat[0])\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	dist := make([][]int, rows)\n	queue := [][2]int{}\n	for i := 0; i < rows; i++ {\n		dist[i] = make([]int, cols)\n		for j := 0; j < cols; j++ {\n			if mat[i][j] == 0 {\n				dist[i][j] = 0\n				queue = append(queue, [2]int{i, j})\n			} else {\n				dist[i][j] = -1\n			}\n		}\n	}\n	head := 0\n	for head < len(queue) {\n		cell := queue[head]\n		head++\n		for d := 0; d < 4; d++ {\n			nr := cell[0] + dr[d]\n			nc := cell[1] + dc[d]\n			if nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1 {\n				dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n				queue = append(queue, [2]int{nr, nc})\n			}\n		}\n	}\n	return dist\n}`,
              kotlin: `fun updateMatrix(mat: Array<IntArray>): Array<IntArray> {\n    val rows = mat.size\n    val cols = mat[0].size\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    val dist = Array(rows) { IntArray(cols) { -1 } }\n    val queue = mutableListOf<IntArray>()\n    for (i in 0 until rows) {\n        for (j in 0 until cols) {\n            if (mat[i][j] == 0) {\n                dist[i][j] = 0\n                queue.add(intArrayOf(i, j))\n            }\n        }\n    }\n    var head = 0\n    while (head < queue.size) {\n        val cell = queue[head++]\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr in 0 until rows && nc in 0 until cols && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n                queue.add(intArrayOf(nr, nc))\n            }\n        }\n    }\n    return dist\n}`,
              swift: `func updateMatrix(_ mat: [[Int]]) -> [[Int]] {\n    let rows = mat.count\n    let cols = mat[0].count\n    let dr = [-1, 1, 0, 0]\n    let dc = [0, 0, -1, 1]\n    var dist = [[Int]](repeating: [Int](repeating: -1, count: cols), count: rows)\n    var queue: [[Int]] = []\n    for i in 0..<rows {\n        for j in 0..<cols {\n            if mat[i][j] == 0 {\n                dist[i][j] = 0\n                queue.append([i, j])\n            }\n        }\n    }\n    var head = 0\n    while head < queue.count {\n        let cell = queue[head]\n        head += 1\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1 {\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n                queue.append([nr, nc])\n            }\n        }\n    }\n    return dist\n}`,
              rust: `fn updateMatrix(mat: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let rows = mat.len() as i32;\n    let cols = mat[0].len() as i32;\n    let dr = [-1, 1, 0, 0];\n    let dc = [0, 0, -1, 1];\n    let mut dist = vec![vec![-1i32; cols as usize]; rows as usize];\n    let mut queue: Vec<(i32, i32)> = Vec::new();\n    for i in 0..rows {\n        for j in 0..cols {\n            if mat[i as usize][j as usize] == 0 {\n                dist[i as usize][j as usize] = 0;\n                queue.push((i, j));\n            }\n        }\n    }\n    let mut head = 0usize;\n    while head < queue.len() {\n        let (r, c) = queue[head];\n        head += 1;\n        for d in 0..4 {\n            let nr = r + dr[d];\n            let nc = c + dc[d];\n            if nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr as usize][nc as usize] == -1 {\n                dist[nr as usize][nc as usize] = dist[r as usize][c as usize] + 1;\n                queue.push((nr, nc));\n            }\n        }\n    }\n    dist\n}`,
              php: `function updateMatrix($mat) {\n    $rows = count($mat);\n    $cols = count($mat[0]);\n    $dr = array(-1, 1, 0, 0);\n    $dc = array(0, 0, -1, 1);\n    $dist = array();\n    $queue = array();\n    for ($i = 0; $i < $rows; $i++) {\n        $row = array();\n        for ($j = 0; $j < $cols; $j++) {\n            if ($mat[$i][$j] === 0) {\n                $row[] = 0;\n                $queue[] = array($i, $j);\n            } else {\n                $row[] = -1;\n            }\n        }\n        $dist[] = $row;\n    }\n    $head = 0;\n    while ($head < count($queue)) {\n        $cell = $queue[$head];\n        $head++;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $dist[$nr][$nc] === -1) {\n                $dist[$nr][$nc] = $dist[$cell[0]][$cell[1]] + 1;\n                $queue[] = array($nr, $nc);\n            }\n        }\n    }\n    return $dist;\n}`,
              ruby: `def updateMatrix(mat)\n  rows = mat.length\n  cols = mat[0].length\n  dr = [-1, 1, 0, 0]\n  dc = [0, 0, -1, 1]\n  dist = Array.new(rows) { Array.new(cols, -1) }\n  queue = []\n  (0...rows).each do |i|\n    (0...cols).each do |j|\n      if mat[i][j] == 0\n        dist[i][j] = 0\n        queue.push([i, j])\n      end\n    end\n  end\n  head = 0\n  while head < queue.length\n    r, c = queue[head]\n    head += 1\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      if nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] == -1\n        dist[nr][nc] = dist[r][c] + 1\n        queue.push([nr, nc])\n      end\n    end\n  end\n  dist\nend`,
      },
    };
  })(),

];

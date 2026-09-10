/**
 * Matrices and 2-D grids, second wave — the grid questions Amazon, Google and
 * Microsoft actually ask, from the one-pass scans up to the square-DP
 * classics. Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtIntMat, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

/** A random r×c matrix with values drawn from [lo, hi]. */
const randMat = (rng: Rng, r: number, c: number, lo: number, hi: number) =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => ri(rng, lo, hi)));

export const MATRIX2_PROBLEMS: CatalogProblem[] = [

  // ── Spiral Matrix II ────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      let top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;
      while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) m[top][c] = v++;
        top++;
        for (let r = top; r <= bottom; r++) m[r][right] = v++;
        right--;
        if (top <= bottom) { for (let c = right; c >= left; c--) m[bottom][c] = v++; bottom--; }
        if (left <= right) { for (let r = bottom; r >= top; r--) m[r][left] = v++; left++; }
      }
      return m;
    };
    return {
      slug: "spiral-matrix-ii",
      title: "Spiral Matrix II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "generateMatrix", params: [{ name: "n", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given a positive integer `n`, generate an `n × n` matrix filled with the numbers `1` to `n²` in **spiral order**, starting at the top-left corner and moving right.",
        [
          { in: "n = 3", out: "[[1,2,3],[8,9,4],[7,6,5]]" },
          { in: "n = 1", out: "[[1]]" },
          { in: "n = 2", out: "[[1,2],[4,3]]" },
        ],
        ["1 <= n <= 9"]),
      hints: [
        "Keep four boundaries — top, bottom, left, right — and shrink one after each pass.",
        "Walk right along the top row, down the right column, left along the bottom, up the left column, then repeat.",
        "Re-check the boundaries before the bottom and left passes; on an odd-sized spiral the last ring is a single row or column.",
      ],
      examples: [
        { input: "3", expectedOutput: "[[1,2,3],[8,9,4],[7,6,5]]" },
        { input: "1", expectedOutput: "[[1]]" },
        { input: "2", expectedOutput: "[[1,2],[4,3]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        return { input: String(n), expectedOutput: fmtIntMat(ref(n)) };
      },
      solutions: {
        python: `def generateMatrix(n: int):\n    m = [[0] * n for _ in range(n)]\n    top, bottom, left, right = 0, n - 1, 0, n - 1\n    v = 1\n    while top <= bottom and left <= right:\n        for c in range(left, right + 1):\n            m[top][c] = v\n            v += 1\n        top += 1\n        for r in range(top, bottom + 1):\n            m[r][right] = v\n            v += 1\n        right -= 1\n        if top <= bottom:\n            for c in range(right, left - 1, -1):\n                m[bottom][c] = v\n                v += 1\n            bottom -= 1\n        if left <= right:\n            for r in range(bottom, top - 1, -1):\n                m[r][left] = v\n                v += 1\n            left += 1\n    return m`,
        javascript: `var generateMatrix = function(n) {\n    const m = [];\n    for (let i = 0; i < n; i++) m.push(new Array(n).fill(0));\n    let top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right) {\n        for (let c = left; c <= right; c++) m[top][c] = v++;\n        top++;\n        for (let r = top; r <= bottom; r++) m[r][right] = v++;\n        right--;\n        if (top <= bottom) {\n            for (let c = right; c >= left; c--) m[bottom][c] = v++;\n            bottom--;\n        }\n        if (left <= right) {\n            for (let r = bottom; r >= top; r--) m[r][left] = v++;\n            left++;\n        }\n    }\n    return m;\n};`,
              typescript: `function generateMatrix(n: number): number[][] {\n    var m: number[][] = [];\n    for (var i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (var j = 0; j < n; j++) row.push(0);\n        m.push(row);\n    }\n    var top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right) {\n        for (var c = left; c <= right; c++) { m[top][c] = v; v++; }\n        top++;\n        for (var r = top; r <= bottom; r++) { m[r][right] = v; v++; }\n        right--;\n        if (top <= bottom) {\n            for (var c2 = right; c2 >= left; c2--) { m[bottom][c2] = v; v++; }\n            bottom--;\n        }\n        if (left <= right) {\n            for (var r2 = bottom; r2 >= top; r2--) { m[r2][left] = v; v++; }\n            left++;\n        }\n    }\n    return m;\n}`,
              java: `public static int[][] generateMatrix(int n) {\n    int[][] m = new int[n][n];\n    int top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right) {\n        for (int c = left; c <= right; c++) m[top][c] = v++;\n        top++;\n        for (int r = top; r <= bottom; r++) m[r][right] = v++;\n        right--;\n        if (top <= bottom) {\n            for (int c = right; c >= left; c--) m[bottom][c] = v++;\n            bottom--;\n        }\n        if (left <= right) {\n            for (int r = bottom; r >= top; r--) m[r][left] = v++;\n            left++;\n        }\n    }\n    return m;\n}`,
              cpp: `vector<vector<int>> generateMatrix(int n) {\n    vector<vector<int>> m(n, vector<int>(n, 0));\n    int top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right) {\n        for (int c = left; c <= right; c++) m[top][c] = v++;\n        top++;\n        for (int r = top; r <= bottom; r++) m[r][right] = v++;\n        right--;\n        if (top <= bottom) {\n            for (int c = right; c >= left; c--) m[bottom][c] = v++;\n            bottom--;\n        }\n        if (left <= right) {\n            for (int r = bottom; r >= top; r--) m[r][left] = v++;\n            left++;\n        }\n    }\n    return m;\n}`,
              c: `int** generateMatrix(int n, int* returnSize, int** returnColumnSizes) {\n    int** m = (int**) malloc(sizeof(int*) * n);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) {\n        m[i] = (int*) calloc(n, sizeof(int));\n        (*returnColumnSizes)[i] = n;\n    }\n    int top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right) {\n        for (int c = left; c <= right; c++) m[top][c] = v++;\n        top++;\n        for (int r = top; r <= bottom; r++) m[r][right] = v++;\n        right--;\n        if (top <= bottom) {\n            for (int c = right; c >= left; c--) m[bottom][c] = v++;\n            bottom--;\n        }\n        if (left <= right) {\n            for (int r = bottom; r >= top; r--) m[r][left] = v++;\n            left++;\n        }\n    }\n    *returnSize = n;\n    return m;\n}`,
              csharp: `public static int[][] GenerateMatrix(int n)\n{\n    int[][] m = new int[n][];\n    for (int i = 0; i < n; i++) m[i] = new int[n];\n    int top = 0, bottom = n - 1, left = 0, right = n - 1, v = 1;\n    while (top <= bottom && left <= right)\n    {\n        for (int c = left; c <= right; c++) m[top][c] = v++;\n        top++;\n        for (int r = top; r <= bottom; r++) m[r][right] = v++;\n        right--;\n        if (top <= bottom)\n        {\n            for (int c = right; c >= left; c--) m[bottom][c] = v++;\n            bottom--;\n        }\n        if (left <= right)\n        {\n            for (int r = bottom; r >= top; r--) m[r][left] = v++;\n            left++;\n        }\n    }\n    return m;\n}`,
              go: `func generateMatrix(n int) [][]int {\n	m := make([][]int, n)\n	for i := range m {\n		m[i] = make([]int, n)\n	}\n	top, bottom, left, right, v := 0, n-1, 0, n-1, 1\n	for top <= bottom && left <= right {\n		for c := left; c <= right; c++ {\n			m[top][c] = v\n			v++\n		}\n		top++\n		for r := top; r <= bottom; r++ {\n			m[r][right] = v\n			v++\n		}\n		right--\n		if top <= bottom {\n			for c := right; c >= left; c-- {\n				m[bottom][c] = v\n				v++\n			}\n			bottom--\n		}\n		if left <= right {\n			for r := bottom; r >= top; r-- {\n				m[r][left] = v\n				v++\n			}\n			left++\n		}\n	}\n	return m\n}`,
              kotlin: `fun generateMatrix(n: Int): Array<IntArray> {\n    val m = Array(n) { IntArray(n) }\n    var top = 0\n    var bottom = n - 1\n    var left = 0\n    var right = n - 1\n    var v = 1\n    while (top <= bottom && left <= right) {\n        for (c in left..right) { m[top][c] = v; v++ }\n        top++\n        for (r in top..bottom) { m[r][right] = v; v++ }\n        right--\n        if (top <= bottom) {\n            for (c in right downTo left) { m[bottom][c] = v; v++ }\n            bottom--\n        }\n        if (left <= right) {\n            for (r in bottom downTo top) { m[r][left] = v; v++ }\n            left++\n        }\n    }\n    return m\n}`,
              swift: `func generateMatrix(_ n: Int) -> [[Int]] {\n    var m = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    var top = 0\n    var bottom = n - 1\n    var left = 0\n    var right = n - 1\n    var v = 1\n    while top <= bottom && left <= right {\n        var c = left\n        while c <= right { m[top][c] = v; v += 1; c += 1 }\n        top += 1\n        var r = top\n        while r <= bottom { m[r][right] = v; v += 1; r += 1 }\n        right -= 1\n        if top <= bottom {\n            var c2 = right\n            while c2 >= left { m[bottom][c2] = v; v += 1; c2 -= 1 }\n            bottom -= 1\n        }\n        if left <= right {\n            var r2 = bottom\n            while r2 >= top { m[r2][left] = v; v += 1; r2 -= 1 }\n            left += 1\n        }\n    }\n    return m\n}`,
              rust: `fn generateMatrix(n: i32) -> Vec<Vec<i32>> {\n    let size = n as usize;\n    let mut m = vec![vec![0i32; size]; size];\n    let mut top: i32 = 0;\n    let mut bottom: i32 = n - 1;\n    let mut left: i32 = 0;\n    let mut right: i32 = n - 1;\n    let mut v = 1;\n    while top <= bottom && left <= right {\n        let mut c = left;\n        while c <= right {\n            m[top as usize][c as usize] = v;\n            v += 1;\n            c += 1;\n        }\n        top += 1;\n        let mut r = top;\n        while r <= bottom {\n            m[r as usize][right as usize] = v;\n            v += 1;\n            r += 1;\n        }\n        right -= 1;\n        if top <= bottom {\n            let mut c2 = right;\n            while c2 >= left {\n                m[bottom as usize][c2 as usize] = v;\n                v += 1;\n                c2 -= 1;\n            }\n            bottom -= 1;\n        }\n        if left <= right {\n            let mut r2 = bottom;\n            while r2 >= top {\n                m[r2 as usize][left as usize] = v;\n                v += 1;\n                r2 -= 1;\n            }\n            left += 1;\n        }\n    }\n    m\n}`,
              php: `function generateMatrix($n) {\n    $m = array();\n    for ($i = 0; $i < $n; $i++) $m[] = array_fill(0, $n, 0);\n    $top = 0; $bottom = $n - 1; $left = 0; $right = $n - 1; $v = 1;\n    while ($top <= $bottom && $left <= $right) {\n        for ($c = $left; $c <= $right; $c++) { $m[$top][$c] = $v; $v++; }\n        $top++;\n        for ($r = $top; $r <= $bottom; $r++) { $m[$r][$right] = $v; $v++; }\n        $right--;\n        if ($top <= $bottom) {\n            for ($c = $right; $c >= $left; $c--) { $m[$bottom][$c] = $v; $v++; }\n            $bottom--;\n        }\n        if ($left <= $right) {\n            for ($r = $bottom; $r >= $top; $r--) { $m[$r][$left] = $v; $v++; }\n            $left++;\n        }\n    }\n    return $m;\n}`,
              ruby: `def generateMatrix(n)\n  m = Array.new(n) { Array.new(n, 0) }\n  top = 0\n  bottom = n - 1\n  left = 0\n  right = n - 1\n  v = 1\n  while top <= bottom && left <= right\n    (left..right).each { |c| m[top][c] = v; v += 1 }\n    top += 1\n    (top..bottom).each { |r| m[r][right] = v; v += 1 }\n    right -= 1\n    if top <= bottom\n      right.downto(left) { |c| m[bottom][c] = v; v += 1 }\n      bottom -= 1\n    end\n    if left <= right\n      bottom.downto(top) { |r| m[r][left] = v; v += 1 }\n      left += 1\n    end\n  end\n  m\nend`,
      },
    };
  })(),

  // ── Diagonal Traverse ───────────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const rows = mat.length, cols = mat[0].length;
      const out: number[] = [];
      for (let d = 0; d < rows + cols - 1; d++) {
        if (d % 2 === 0) {
          let r = d < rows ? d : rows - 1;
          let c = d - r;
          while (r >= 0 && c < cols) { out.push(mat[r][c]); r--; c++; }
        } else {
          let c = d < cols ? d : cols - 1;
          let r = d - c;
          while (c >= 0 && r < rows) { out.push(mat[r][c]); r++; c--; }
        }
      }
      return out;
    };
    return {
      slug: "diagonal-traverse",
      title: "Diagonal Traverse",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Meta", "Google", "Walmart"],
      signature: { funcName: "findDiagonalOrder", params: [{ name: "mat", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an `m × n` matrix `mat`, return all its elements in **diagonal order**.\n\nThe traversal walks the anti-diagonals in turn, alternating direction: the first diagonal goes up-right, the second down-left, and so on.",
        [
          { in: "mat = [[1,2,3],[4,5,6],[7,8,9]]", out: "[1,2,4,7,5,3,6,8,9]" },
          { in: "mat = [[1,2],[3,4]]", out: "[1,2,3,4]" },
          { in: "mat = [[5]]", out: "[5]" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "-100 <= mat[i][j] <= 100"]),
      hints: [
        "Cells on the same anti-diagonal all share the sum `r + c`. Group by that sum.",
        "There are `rows + cols - 1` diagonals; walk them in order of that sum.",
        "Reverse the direction on alternate diagonals — even sums go up-right, odd sums go down-left.",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[1,2,4,7,5,3,6,8,9]" },
        { input: "[[1,2],[3,4]]", expectedOutput: "[1,2,3,4]" },
        { input: "[[5]]", expectedOutput: "[5]" },
      ],
      gen: (rng: Rng) => {
        const mat = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), -100, 100);
        return { input: fmtIntMat(mat), expectedOutput: fmtIntArr(ref(mat)) };
      },
      solutions: {
        python: `def findDiagonalOrder(mat):\n    rows, cols = len(mat), len(mat[0])\n    out = []\n    for d in range(rows + cols - 1):\n        if d % 2 == 0:\n            r = d if d < rows else rows - 1\n            c = d - r\n            while r >= 0 and c < cols:\n                out.append(mat[r][c])\n                r -= 1\n                c += 1\n        else:\n            c = d if d < cols else cols - 1\n            r = d - c\n            while c >= 0 and r < rows:\n                out.append(mat[r][c])\n                r += 1\n                c -= 1\n    return out`,
        javascript: `var findDiagonalOrder = function(mat) {\n    const rows = mat.length, cols = mat[0].length;\n    const out = [];\n    for (let d = 0; d < rows + cols - 1; d++) {\n        if (d % 2 === 0) {\n            let r = d < rows ? d : rows - 1;\n            let c = d - r;\n            while (r >= 0 && c < cols) {\n                out.push(mat[r][c]);\n                r--;\n                c++;\n            }\n        } else {\n            let c = d < cols ? d : cols - 1;\n            let r = d - c;\n            while (c >= 0 && r < rows) {\n                out.push(mat[r][c]);\n                r++;\n                c--;\n            }\n        }\n    }\n    return out;\n};`,
              typescript: `function findDiagonalOrder(mat: number[][]): number[] {\n    var rows = mat.length;\n    var cols = mat[0].length;\n    var out: number[] = [];\n    for (var d = 0; d < rows + cols - 1; d++) {\n        if (d % 2 === 0) {\n            var r = d < rows ? d : rows - 1;\n            var c = d - r;\n            while (r >= 0 && c < cols) {\n                out.push(mat[r][c]);\n                r--;\n                c++;\n            }\n        } else {\n            var c2 = d < cols ? d : cols - 1;\n            var r2 = d - c2;\n            while (c2 >= 0 && r2 < rows) {\n                out.push(mat[r2][c2]);\n                r2++;\n                c2--;\n            }\n        }\n    }\n    return out;\n}`,
              java: `public static int[] findDiagonalOrder(int[][] mat) {\n    int rows = mat.length, cols = mat[0].length;\n    int[] out = new int[rows * cols];\n    int pos = 0;\n    for (int d = 0; d < rows + cols - 1; d++) {\n        if (d % 2 == 0) {\n            int r = d < rows ? d : rows - 1;\n            int c = d - r;\n            while (r >= 0 && c < cols) {\n                out[pos++] = mat[r][c];\n                r--;\n                c++;\n            }\n        } else {\n            int c = d < cols ? d : cols - 1;\n            int r = d - c;\n            while (c >= 0 && r < rows) {\n                out[pos++] = mat[r][c];\n                r++;\n                c--;\n            }\n        }\n    }\n    return out;\n}`,
              cpp: `vector<int> findDiagonalOrder(vector<vector<int>>& mat) {\n    int rows = (int) mat.size(), cols = (int) mat[0].size();\n    vector<int> out;\n    for (int d = 0; d < rows + cols - 1; d++) {\n        if (d % 2 == 0) {\n            int r = d < rows ? d : rows - 1;\n            int c = d - r;\n            while (r >= 0 && c < cols) {\n                out.push_back(mat[r][c]);\n                r--;\n                c++;\n            }\n        } else {\n            int c = d < cols ? d : cols - 1;\n            int r = d - c;\n            while (c >= 0 && r < rows) {\n                out.push_back(mat[r][c]);\n                r++;\n                c--;\n            }\n        }\n    }\n    return out;\n}`,
              c: `int* findDiagonalOrder(int** mat, int matSize, int* matColSize, int* returnSize) {\n    int rows = matSize, cols = matColSize[0];\n    int* out = (int*) malloc(sizeof(int) * rows * cols);\n    int pos = 0;\n    for (int d = 0; d < rows + cols - 1; d++) {\n        if (d % 2 == 0) {\n            int r = d < rows ? d : rows - 1;\n            int c = d - r;\n            while (r >= 0 && c < cols) {\n                out[pos++] = mat[r][c];\n                r--;\n                c++;\n            }\n        } else {\n            int c = d < cols ? d : cols - 1;\n            int r = d - c;\n            while (c >= 0 && r < rows) {\n                out[pos++] = mat[r][c];\n                r++;\n                c--;\n            }\n        }\n    }\n    *returnSize = pos;\n    return out;\n}`,
              csharp: `public static int[] FindDiagonalOrder(int[][] mat)\n{\n    int rows = mat.Length, cols = mat[0].Length;\n    int[] out_ = new int[rows * cols];\n    int pos = 0;\n    for (int d = 0; d < rows + cols - 1; d++)\n    {\n        if (d % 2 == 0)\n        {\n            int r = d < rows ? d : rows - 1;\n            int c = d - r;\n            while (r >= 0 && c < cols)\n            {\n                out_[pos++] = mat[r][c];\n                r--;\n                c++;\n            }\n        }\n        else\n        {\n            int c = d < cols ? d : cols - 1;\n            int r = d - c;\n            while (c >= 0 && r < rows)\n            {\n                out_[pos++] = mat[r][c];\n                r++;\n                c--;\n            }\n        }\n    }\n    return out_;\n}`,
              go: `func findDiagonalOrder(mat [][]int) []int {\n	rows, cols := len(mat), len(mat[0])\n	out := make([]int, 0, rows*cols)\n	for d := 0; d < rows+cols-1; d++ {\n		if d%2 == 0 {\n			r := d\n			if r >= rows {\n				r = rows - 1\n			}\n			c := d - r\n			for r >= 0 && c < cols {\n				out = append(out, mat[r][c])\n				r--\n				c++\n			}\n		} else {\n			c := d\n			if c >= cols {\n				c = cols - 1\n			}\n			r := d - c\n			for c >= 0 && r < rows {\n				out = append(out, mat[r][c])\n				r++\n				c--\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun findDiagonalOrder(mat: Array<IntArray>): IntArray {\n    val rows = mat.size\n    val cols = mat[0].size\n    val out = IntArray(rows * cols)\n    var pos = 0\n    for (d in 0 until rows + cols - 1) {\n        if (d % 2 == 0) {\n            var r = if (d < rows) d else rows - 1\n            var c = d - r\n            while (r >= 0 && c < cols) {\n                out[pos++] = mat[r][c]\n                r--\n                c++\n            }\n        } else {\n            var c = if (d < cols) d else cols - 1\n            var r = d - c\n            while (c >= 0 && r < rows) {\n                out[pos++] = mat[r][c]\n                r++\n                c--\n            }\n        }\n    }\n    return out\n}`,
              swift: `func findDiagonalOrder(_ mat: [[Int]]) -> [Int] {\n    let rows = mat.count\n    let cols = mat[0].count\n    var out: [Int] = []\n    for d in 0..<(rows + cols - 1) {\n        if d % 2 == 0 {\n            var r = d < rows ? d : rows - 1\n            var c = d - r\n            while r >= 0 && c < cols {\n                out.append(mat[r][c])\n                r -= 1\n                c += 1\n            }\n        } else {\n            var c = d < cols ? d : cols - 1\n            var r = d - c\n            while c >= 0 && r < rows {\n                out.append(mat[r][c])\n                r += 1\n                c -= 1\n            }\n        }\n    }\n    return out\n}`,
              rust: `fn findDiagonalOrder(mat: Vec<Vec<i32>>) -> Vec<i32> {\n    let rows = mat.len() as i32;\n    let cols = mat[0].len() as i32;\n    let mut out: Vec<i32> = Vec::new();\n    for d in 0..(rows + cols - 1) {\n        if d % 2 == 0 {\n            let mut r = if d < rows { d } else { rows - 1 };\n            let mut c = d - r;\n            while r >= 0 && c < cols {\n                out.push(mat[r as usize][c as usize]);\n                r -= 1;\n                c += 1;\n            }\n        } else {\n            let mut c = if d < cols { d } else { cols - 1 };\n            let mut r = d - c;\n            while c >= 0 && r < rows {\n                out.push(mat[r as usize][c as usize]);\n                r += 1;\n                c -= 1;\n            }\n        }\n    }\n    out\n}`,
              php: `function findDiagonalOrder($mat) {\n    $rows = count($mat);\n    $cols = count($mat[0]);\n    $out = array();\n    for ($d = 0; $d < $rows + $cols - 1; $d++) {\n        if ($d % 2 === 0) {\n            $r = $d < $rows ? $d : $rows - 1;\n            $c = $d - $r;\n            while ($r >= 0 && $c < $cols) {\n                $out[] = $mat[$r][$c];\n                $r--;\n                $c++;\n            }\n        } else {\n            $c = $d < $cols ? $d : $cols - 1;\n            $r = $d - $c;\n            while ($c >= 0 && $r < $rows) {\n                $out[] = $mat[$r][$c];\n                $r++;\n                $c--;\n            }\n        }\n    }\n    return $out;\n}`,
              ruby: `def findDiagonalOrder(mat)\n  rows = mat.length\n  cols = mat[0].length\n  out = []\n  (0...(rows + cols - 1)).each do |d|\n    if d.even?\n      r = d < rows ? d : rows - 1\n      c = d - r\n      while r >= 0 && c < cols\n        out << mat[r][c]\n        r -= 1\n        c += 1\n      end\n    else\n      c = d < cols ? d : cols - 1\n      r = d - c\n      while c >= 0 && r < rows\n        out << mat[r][c]\n        r += 1\n        c -= 1\n      end\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Toeplitz Matrix ─────────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      for (let r = 1; r < matrix.length; r++) {
        for (let c = 1; c < matrix[0].length; c++) {
          if (matrix[r][c] !== matrix[r - 1][c - 1]) return false;
        }
      }
      return true;
    };
    return {
      slug: "toeplitz-matrix",
      title: "Toeplitz Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Meta", "Google"],
      signature: { funcName: "isToeplitzMatrix", params: [{ name: "matrix", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "A matrix is **Toeplitz** if every diagonal running from top-left to bottom-right holds the same value throughout.\n\nGiven an `m × n` matrix, return `true` if it is Toeplitz.",
        [
          { in: "matrix = [[1,2,3,4],[5,1,2,3],[9,5,1,2]]", out: "true", note: "Each descending diagonal is constant." },
          { in: "matrix = [[1,2],[2,2]]", out: "false", note: "The diagonal starting at (0,0) holds 1 then 2." },
          { in: "matrix = [[7]]", out: "true" },
        ],
        ["1 <= matrix.length, matrix[i].length <= 8", "0 <= matrix[i][j] <= 20"],
        "What if the matrix is too large to load into memory at once, and you can only read one row at a time?"),
      hints: [
        "You never need to walk a whole diagonal — comparing each cell with its up-left neighbour covers every diagonal.",
        "Start the loops at row 1 and column 1 so the neighbour always exists.",
      ],
      examples: [
        { input: "[[1,2,3,4],[5,1,2,3],[9,5,1,2]]", expectedOutput: "true" },
        { input: "[[1,2],[2,2]]", expectedOutput: "false" },
        { input: "[[7]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const r = ri(rng, 1, 8), c = ri(rng, 1, 8);
        let mat: number[][];
        if (rng() < 0.4) {
          const diag: number[] = [];
          for (let d = 0; d < r + c; d++) diag.push(ri(rng, 0, 20));
          mat = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => diag[j - i + r]));
          if (rng() < 0.4 && r > 1 && c > 1) mat[ri(rng, 1, r - 1)][ri(rng, 1, c - 1)] = ri(rng, 0, 20);
        } else {
          mat = randMat(rng, r, c, 0, 3);
        }
        return { input: fmtIntMat(mat), expectedOutput: bool(ref(mat)) };
      },
      solutions: {
        python: `def isToeplitzMatrix(matrix) -> bool:\n    for r in range(1, len(matrix)):\n        for c in range(1, len(matrix[0])):\n            if matrix[r][c] != matrix[r - 1][c - 1]:\n                return False\n    return True`,
        javascript: `var isToeplitzMatrix = function(matrix) {\n    for (let r = 1; r < matrix.length; r++) {\n        for (let c = 1; c < matrix[0].length; c++) {\n            if (matrix[r][c] !== matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n};`,
              typescript: `function isToeplitzMatrix(matrix: number[][]): boolean {\n    for (var r = 1; r < matrix.length; r++) {\n        for (var c = 1; c < matrix[0].length; c++) {\n            if (matrix[r][c] !== matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean isToeplitzMatrix(int[][] matrix) {\n    for (int r = 1; r < matrix.length; r++) {\n        for (int c = 1; c < matrix[0].length; c++) {\n            if (matrix[r][c] != matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              cpp: `bool isToeplitzMatrix(vector<vector<int>>& matrix) {\n    for (size_t r = 1; r < matrix.size(); r++) {\n        for (size_t c = 1; c < matrix[0].size(); c++) {\n            if (matrix[r][c] != matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              c: `bool isToeplitzMatrix(int** matrix, int matrixSize, int* matrixColSize) {\n    for (int r = 1; r < matrixSize; r++) {\n        for (int c = 1; c < matrixColSize[0]; c++) {\n            if (matrix[r][c] != matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool IsToeplitzMatrix(int[][] matrix)\n{\n    for (int r = 1; r < matrix.Length; r++)\n    {\n        for (int c = 1; c < matrix[0].Length; c++)\n        {\n            if (matrix[r][c] != matrix[r - 1][c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              go: `func isToeplitzMatrix(matrix [][]int) bool {\n	for r := 1; r < len(matrix); r++ {\n		for c := 1; c < len(matrix[0]); c++ {\n			if matrix[r][c] != matrix[r-1][c-1] {\n				return false\n			}\n		}\n	}\n	return true\n}`,
              kotlin: `fun isToeplitzMatrix(matrix: Array<IntArray>): Boolean {\n    for (r in 1 until matrix.size) {\n        for (c in 1 until matrix[0].size) {\n            if (matrix[r][c] != matrix[r - 1][c - 1]) return false\n        }\n    }\n    return true\n}`,
              swift: `func isToeplitzMatrix(_ matrix: [[Int]]) -> Bool {\n    if matrix.count < 2 || matrix[0].count < 2 { return true }\n    for r in 1..<matrix.count {\n        for c in 1..<matrix[0].count {\n            if matrix[r][c] != matrix[r - 1][c - 1] { return false }\n        }\n    }\n    return true\n}`,
              rust: `fn isToeplitzMatrix(matrix: Vec<Vec<i32>>) -> bool {\n    for r in 1..matrix.len() {\n        for c in 1..matrix[0].len() {\n            if matrix[r][c] != matrix[r - 1][c - 1] {\n                return false;\n            }\n        }\n    }\n    true\n}`,
              php: `function isToeplitzMatrix($matrix) {\n    $rows = count($matrix);\n    $cols = count($matrix[0]);\n    for ($r = 1; $r < $rows; $r++) {\n        for ($c = 1; $c < $cols; $c++) {\n            if ($matrix[$r][$c] !== $matrix[$r - 1][$c - 1]) return false;\n        }\n    }\n    return true;\n}`,
              ruby: `def isToeplitzMatrix(matrix)\n  (1...matrix.length).each do |r|\n    (1...matrix[0].length).each do |c|\n      return false if matrix[r][c] != matrix[r - 1][c - 1]\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Reshape the Matrix ──────────────────────────────────────────
  (() => {
    const ref = (mat: number[][], r: number, c: number) => {
      const rows = mat.length, cols = mat[0].length;
      if (rows * cols !== r * c) return mat;
      const flat: number[] = [];
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) flat.push(mat[i][j]);
      const out: number[][] = [];
      for (let i = 0; i < r; i++) out.push(flat.slice(i * c, i * c + c));
      return out;
    };
    return {
      slug: "reshape-the-matrix",
      title: "Reshape the Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "matrixReshape", params: [{ name: "mat", type: "int[][]" as const }, { name: "r", type: "int" as const }, { name: "c", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `m × n` matrix `mat` and two integers `r` and `c` giving the number of rows and columns of a wanted reshaped matrix.\n\nThe reshaped matrix must contain all the original elements in the same **row-traversing order**. If the reshape is not legal — the element counts differ — return the original matrix.",
        [
          { in: "mat = [[1,2],[3,4]], r = 1, c = 4", out: "[[1,2,3,4]]" },
          { in: "mat = [[1,2],[3,4]], r = 2, c = 4", out: "[[1,2],[3,4]]", note: "4 elements cannot fill 8 slots, so the original is returned." },
          { in: "mat = [[1,2,3,4]], r = 2, c = 2", out: "[[1,2],[3,4]]" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "-1000 <= mat[i][j] <= 1000", "1 <= r, c <= 40"]),
      hints: [
        "Check `m × n == r × c` first; anything else returns the input unchanged.",
        "Flatten in row order, then slice into rows of length `c`.",
        "Without flattening: element `k` of the reading order sits at `(k / n, k % n)` in the source and `(k / c, k % c)` in the target.",
      ],
      examples: [
        { input: "[[1,2],[3,4]]\n1\n4", expectedOutput: "[[1,2,3,4]]" },
        { input: "[[1,2],[3,4]]\n2\n4", expectedOutput: "[[1,2],[3,4]]" },
        { input: "[[1,2,3,4]]\n2\n2", expectedOutput: "[[1,2],[3,4]]" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 6), cols = ri(rng, 1, 6);
        const mat = randMat(rng, rows, cols, -1000, 1000);
        const total = rows * cols;
        let r: number, c: number;
        if (rng() < 0.6) {
          const divisors: number[] = [];
          for (let d = 1; d <= total; d++) if (total % d === 0) divisors.push(d);
          r = divisors[ri(rng, 0, divisors.length - 1)];
          c = total / r;
        } else {
          r = ri(rng, 1, 8);
          c = ri(rng, 1, 8);
        }
        return { input: `${fmtIntMat(mat)}\n${r}\n${c}`, expectedOutput: fmtIntMat(ref(mat, r, c)) };
      },
      solutions: {
        python: `def matrixReshape(mat, r: int, c: int):\n    rows, cols = len(mat), len(mat[0])\n    if rows * cols != r * c:\n        return mat\n    flat = [v for row in mat for v in row]\n    return [flat[i * c:(i + 1) * c] for i in range(r)]`,
        javascript: `var matrixReshape = function(mat, r, c) {\n    const rows = mat.length, cols = mat[0].length;\n    if (rows * cols !== r * c) return mat;\n    const flat = [];\n    for (let i = 0; i < rows; i++) {\n        for (let j = 0; j < cols; j++) flat.push(mat[i][j]);\n    }\n    const out = [];\n    for (let i = 0; i < r; i++) out.push(flat.slice(i * c, i * c + c));\n    return out;\n};`,
              typescript: `function matrixReshape(mat: number[][], r: number, c: number): number[][] {\n    var rows = mat.length;\n    var cols = mat[0].length;\n    if (rows * cols !== r * c) return mat;\n    var flat: number[] = [];\n    for (var i = 0; i < rows; i++) {\n        for (var j = 0; j < cols; j++) flat.push(mat[i][j]);\n    }\n    var out: number[][] = [];\n    for (var k = 0; k < r; k++) out.push(flat.slice(k * c, k * c + c));\n    return out;\n}`,
              java: `public static int[][] matrixReshape(int[][] mat, int r, int c) {\n    int rows = mat.length, cols = mat[0].length;\n    if (rows * cols != r * c) return mat;\n    int[][] out = new int[r][c];\n    for (int k = 0; k < r * c; k++) {\n        out[k / c][k % c] = mat[k / cols][k % cols];\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> matrixReshape(vector<vector<int>>& mat, int r, int c) {\n    int rows = (int) mat.size(), cols = (int) mat[0].size();\n    if (rows * cols != r * c) return mat;\n    vector<vector<int>> out(r, vector<int>(c, 0));\n    for (int k = 0; k < r * c; k++) {\n        out[k / c][k % c] = mat[k / cols][k % cols];\n    }\n    return out;\n}`,
              c: `int** matrixReshape(int** mat, int matSize, int* matColSize, int r, int c, int* returnSize, int** returnColumnSizes) {\n    int rows = matSize, cols = matColSize[0];\n    if (rows * cols != r * c) {\n        int** same = (int**) malloc(sizeof(int*) * rows);\n        *returnColumnSizes = (int*) malloc(sizeof(int) * rows);\n        for (int i = 0; i < rows; i++) {\n            same[i] = (int*) malloc(sizeof(int) * cols);\n            for (int j = 0; j < cols; j++) same[i][j] = mat[i][j];\n            (*returnColumnSizes)[i] = cols;\n        }\n        *returnSize = rows;\n        return same;\n    }\n    int** out = (int**) malloc(sizeof(int*) * r);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * r);\n    for (int i = 0; i < r; i++) {\n        out[i] = (int*) malloc(sizeof(int) * c);\n        (*returnColumnSizes)[i] = c;\n    }\n    for (int k = 0; k < r * c; k++) {\n        out[k / c][k % c] = mat[k / cols][k % cols];\n    }\n    *returnSize = r;\n    return out;\n}`,
              csharp: `public static int[][] MatrixReshape(int[][] mat, int r, int c)\n{\n    int rows = mat.Length, cols = mat[0].Length;\n    if (rows * cols != r * c) return mat;\n    int[][] out_ = new int[r][];\n    for (int i = 0; i < r; i++) out_[i] = new int[c];\n    for (int k = 0; k < r * c; k++)\n    {\n        out_[k / c][k % c] = mat[k / cols][k % cols];\n    }\n    return out_;\n}`,
              go: `func matrixReshape(mat [][]int, r int, c int) [][]int {\n	rows, cols := len(mat), len(mat[0])\n	if rows*cols != r*c {\n		return mat\n	}\n	out := make([][]int, r)\n	for i := range out {\n		out[i] = make([]int, c)\n	}\n	for k := 0; k < r*c; k++ {\n		out[k/c][k%c] = mat[k/cols][k%cols]\n	}\n	return out\n}`,
              kotlin: `fun matrixReshape(mat: Array<IntArray>, r: Int, c: Int): Array<IntArray> {\n    val rows = mat.size\n    val cols = mat[0].size\n    if (rows * cols != r * c) return mat\n    val out = Array(r) { IntArray(c) }\n    for (k in 0 until r * c) {\n        out[k / c][k % c] = mat[k / cols][k % cols]\n    }\n    return out\n}`,
              swift: `func matrixReshape(_ mat: [[Int]], _ r: Int, _ c: Int) -> [[Int]] {\n    let rows = mat.count\n    let cols = mat[0].count\n    if rows * cols != r * c { return mat }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: c), count: r)\n    for k in 0..<(r * c) {\n        out[k / c][k % c] = mat[k / cols][k % cols]\n    }\n    return out\n}`,
              rust: `fn matrixReshape(mat: Vec<Vec<i32>>, r: i32, c: i32) -> Vec<Vec<i32>> {\n    let rows = mat.len();\n    let cols = mat[0].len();\n    let target_r = r as usize;\n    let target_c = c as usize;\n    if rows * cols != target_r * target_c {\n        return mat;\n    }\n    let mut out = vec![vec![0i32; target_c]; target_r];\n    for k in 0..(target_r * target_c) {\n        out[k / target_c][k % target_c] = mat[k / cols][k % cols];\n    }\n    out\n}`,
              php: `function matrixReshape($mat, $r, $c) {\n    $rows = count($mat);\n    $cols = count($mat[0]);\n    if ($rows * $cols !== $r * $c) return $mat;\n    $out = array();\n    for ($i = 0; $i < $r; $i++) $out[] = array_fill(0, $c, 0);\n    for ($k = 0; $k < $r * $c; $k++) {\n        $out[intdiv($k, $c)][$k % $c] = $mat[intdiv($k, $cols)][$k % $cols];\n    }\n    return $out;\n}`,
              ruby: `def matrixReshape(mat, r, c)\n  rows = mat.length\n  cols = mat[0].length\n  return mat if rows * cols != r * c\n  out = Array.new(r) { Array.new(c, 0) }\n  (0...(r * c)).each do |k|\n    out[k / c][k % c] = mat[k / cols][k % cols]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Flipping an Image ───────────────────────────────────────────
  (() => {
    const ref = (image: number[][]) =>
      image.map((row) => row.slice().reverse().map((v) => 1 - v));
    return {
      slug: "flipping-an-image",
      title: "Flipping an Image",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Matrix", "Simulation", "Amazon", "Google", "Adobe"],
      signature: { funcName: "flipAndInvertImage", params: [{ name: "image", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an `n × n` binary matrix `image`, flip it **horizontally** (reverse each row), then **invert** it (swap every 0 and 1), and return the result.",
        [
          { in: "image = [[1,1,0],[1,0,1],[0,0,0]]", out: "[[1,0,0],[0,1,0],[1,1,1]]" },
          { in: "image = [[1,0]]", out: "[[1,0]]", note: "Reversing gives [0,1], and inverting gives [1,0]." },
          { in: "image = [[0]]", out: "[[1]]" },
        ],
        ["1 <= image.length <= 8", "image[i].length == image.length", "image[i][j] is 0 or 1."]),
      hints: [
        "Both steps can happen in one pass: read the row from the right and write `1 - value`.",
        "In place with two pointers: swap the ends, inverting both — and when they meet, invert that middle cell once.",
      ],
      examples: [
        { input: "[[1,1,0],[1,0,1],[0,0,0]]", expectedOutput: "[[1,0,0],[0,1,0],[1,1,1]]" },
        { input: "[[1,0]]", expectedOutput: "[[1,0]]" },
        { input: "[[0]]", expectedOutput: "[[1]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const image = randMat(rng, n, n, 0, 1);
        return { input: fmtIntMat(image), expectedOutput: fmtIntMat(ref(image)) };
      },
      solutions: {
        python: `def flipAndInvertImage(image):\n    return [[1 - v for v in reversed(row)] for row in image]`,
        javascript: `var flipAndInvertImage = function(image) {\n    const out = [];\n    for (let i = 0; i < image.length; i++) {\n        const row = [];\n        for (let j = image[i].length - 1; j >= 0; j--) row.push(1 - image[i][j]);\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function flipAndInvertImage(image: number[][]): number[][] {\n    var out: number[][] = [];\n    for (var i = 0; i < image.length; i++) {\n        var row: number[] = [];\n        for (var j = image[i].length - 1; j >= 0; j--) row.push(1 - image[i][j]);\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] flipAndInvertImage(int[][] image) {\n    int n = image.length;\n    int[][] out = new int[n][];\n    for (int i = 0; i < n; i++) {\n        int cols = image[i].length;\n        out[i] = new int[cols];\n        for (int j = 0; j < cols; j++) out[i][j] = 1 - image[i][cols - 1 - j];\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> flipAndInvertImage(vector<vector<int>>& image) {\n    vector<vector<int>> out;\n    for (size_t i = 0; i < image.size(); i++) {\n        vector<int> row;\n        for (int j = (int) image[i].size() - 1; j >= 0; j--) row.push_back(1 - image[i][j]);\n        out.push_back(row);\n    }\n    return out;\n}`,
              c: `int** flipAndInvertImage(int** image, int imageSize, int* imageColSize, int* returnSize, int** returnColumnSizes) {\n    int n = imageSize;\n    int cols = imageColSize[0];\n    int** out = (int**) malloc(sizeof(int*) * n);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) {\n        out[i] = (int*) malloc(sizeof(int) * cols);\n        (*returnColumnSizes)[i] = cols;\n        for (int j = 0; j < cols; j++) out[i][j] = 1 - image[i][cols - 1 - j];\n    }\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static int[][] FlipAndInvertImage(int[][] image)\n{\n    int n = image.Length;\n    int[][] out_ = new int[n][];\n    for (int i = 0; i < n; i++)\n    {\n        int cols = image[i].Length;\n        out_[i] = new int[cols];\n        for (int j = 0; j < cols; j++) out_[i][j] = 1 - image[i][cols - 1 - j];\n    }\n    return out_;\n}`,
              go: `func flipAndInvertImage(image [][]int) [][]int {\n	out := make([][]int, len(image))\n	for i, row := range image {\n		cols := len(row)\n		out[i] = make([]int, cols)\n		for j := 0; j < cols; j++ {\n			out[i][j] = 1 - row[cols-1-j]\n		}\n	}\n	return out\n}`,
              kotlin: `fun flipAndInvertImage(image: Array<IntArray>): Array<IntArray> {\n    return Array(image.size) { i ->\n        val cols = image[i].size\n        IntArray(cols) { j -> 1 - image[i][cols - 1 - j] }\n    }\n}`,
              swift: `func flipAndInvertImage(_ image: [[Int]]) -> [[Int]] {\n    var out: [[Int]] = []\n    for row in image {\n        out.append(row.reversed().map { 1 - $0 })\n    }\n    return out\n}`,
              rust: `fn flipAndInvertImage(image: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for row in image.iter() {\n        let mut new_row: Vec<i32> = Vec::new();\n        for v in row.iter().rev() {\n            new_row.push(1 - *v);\n        }\n        out.push(new_row);\n    }\n    out\n}`,
              php: `function flipAndInvertImage($image) {\n    $out = array();\n    foreach ($image as $row) {\n        $rev = array_reverse($row);\n        $newRow = array();\n        foreach ($rev as $v) $newRow[] = 1 - $v;\n        $out[] = $newRow;\n    }\n    return $out;\n}`,
              ruby: `def flipAndInvertImage(image)\n  image.map { |row| row.reverse.map { |v| 1 - v } }\nend`,
      },
    };
  })(),

  // ── Image Smoother ──────────────────────────────────────────────
  (() => {
    const ref = (img: number[][]) => {
      const m = img.length, n = img[0].length;
      const out: number[][] = [];
      for (let r = 0; r < m; r++) {
        const row: number[] = [];
        for (let c = 0; c < n; c++) {
          let sum = 0, count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < m && nc >= 0 && nc < n) { sum += img[nr][nc]; count++; }
            }
          }
          row.push(Math.floor(sum / count));
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "image-smoother",
      title: "Image Smoother",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Adobe"],
      signature: { funcName: "imageSmoother", params: [{ name: "img", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "An **image smoother** replaces each cell of a grayscale image by the average of itself and its eight surrounding cells, rounded **down**. Cells that fall outside the image are simply not counted, so a corner averages four cells and an edge six.\n\nGiven an `m × n` integer matrix `img` representing the image, return the smoothed image.",
        [
          { in: "img = [[1,1,1],[1,0,1],[1,1,1]]", out: "[[0,0,0],[0,0,0],[0,0,0]]", note: "Each corner averages 3/4 = 0 after rounding down." },
          { in: "img = [[100,200,100],[200,50,200],[100,200,100]]", out: "[[137,141,137],[141,138,141],[137,141,137]]" },
          { in: "img = [[5]]", out: "[[5]]" },
        ],
        ["1 <= img.length, img[i].length <= 8", "0 <= img[i][j] <= 255"]),
      hints: [
        "For each cell, loop over the nine offsets from (-1,-1) to (1,1).",
        "Skip offsets that leave the grid, and count only the cells you actually used.",
        "Write into a **new** matrix — smoothing in place would feed already-smoothed values into later averages.",
      ],
      examples: [
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "[[0,0,0],[0,0,0],[0,0,0]]" },
        { input: "[[100,200,100],[200,50,200],[100,200,100]]", expectedOutput: "[[137,141,137],[141,138,141],[137,141,137]]" },
        { input: "[[5]]", expectedOutput: "[[5]]" },
      ],
      gen: (rng: Rng) => {
        const img = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), 0, 255);
        return { input: fmtIntMat(img), expectedOutput: fmtIntMat(ref(img)) };
      },
      solutions: {
        python: `def imageSmoother(img):\n    m, n = len(img), len(img[0])\n    out = []\n    for r in range(m):\n        row = []\n        for c in range(n):\n            total = count = 0\n            for dr in (-1, 0, 1):\n                for dc in (-1, 0, 1):\n                    nr, nc = r + dr, c + dc\n                    if 0 <= nr < m and 0 <= nc < n:\n                        total += img[nr][nc]\n                        count += 1\n            row.append(total // count)\n        out.append(row)\n    return out`,
        javascript: `var imageSmoother = function(img) {\n    const m = img.length, n = img[0].length;\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) {\n            let sum = 0, count = 0;\n            for (let dr = -1; dr <= 1; dr++) {\n                for (let dc = -1; dc <= 1; dc++) {\n                    const nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            row.push(Math.floor(sum / count));\n        }\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function imageSmoother(img: number[][]): number[][] {\n    var m = img.length;\n    var n = img[0].length;\n    var out: number[][] = [];\n    for (var r = 0; r < m; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n; c++) {\n            var sum = 0;\n            var count = 0;\n            for (var dr = -1; dr <= 1; dr++) {\n                for (var dc = -1; dc <= 1; dc++) {\n                    var nr = r + dr;\n                    var nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            row.push(Math.floor(sum / count));\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] imageSmoother(int[][] img) {\n    int m = img.length, n = img[0].length;\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int sum = 0, count = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            out[r][c] = sum / count;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> imageSmoother(vector<vector<int>>& img) {\n    int m = (int) img.size(), n = (int) img[0].size();\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int sum = 0, count = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            out[r][c] = sum / count;\n        }\n    }\n    return out;\n}`,
              c: `int** imageSmoother(int** img, int imgSize, int* imgColSize, int* returnSize, int** returnColumnSizes) {\n    int m = imgSize, n = imgColSize[0];\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) {\n            int sum = 0, count = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            out[r][c] = sum / count;\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] ImageSmoother(int[][] img)\n{\n    int m = img.Length, n = img[0].Length;\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++)\n        {\n            int sum = 0, count = 0;\n            for (int dr = -1; dr <= 1; dr++)\n            {\n                for (int dc = -1; dc <= 1; dc++)\n                {\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n)\n                    {\n                        sum += img[nr][nc];\n                        count++;\n                    }\n                }\n            }\n            out_[r][c] = sum / count;\n        }\n    }\n    return out_;\n}`,
              go: `func imageSmoother(img [][]int) [][]int {\n	m, n := len(img), len(img[0])\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			sum, count := 0, 0\n			for dr := -1; dr <= 1; dr++ {\n				for dc := -1; dc <= 1; dc++ {\n					nr, nc := r+dr, c+dc\n					if nr >= 0 && nr < m && nc >= 0 && nc < n {\n						sum += img[nr][nc]\n						count++\n					}\n				}\n			}\n			out[r][c] = sum / count\n		}\n	}\n	return out\n}`,
              kotlin: `fun imageSmoother(img: Array<IntArray>): Array<IntArray> {\n    val m = img.size\n    val n = img[0].size\n    val out = Array(m) { IntArray(n) }\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            var sum = 0\n            var count = 0\n            for (dr in -1..1) {\n                for (dc in -1..1) {\n                    val nr = r + dr\n                    val nc = c + dc\n                    if (nr in 0 until m && nc in 0 until n) {\n                        sum += img[nr][nc]\n                        count++\n                    }\n                }\n            }\n            out[r][c] = sum / count\n        }\n    }\n    return out\n}`,
              swift: `func imageSmoother(_ img: [[Int]]) -> [[Int]] {\n    let m = img.count\n    let n = img[0].count\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for r in 0..<m {\n        for c in 0..<n {\n            var sum = 0\n            var count = 0\n            for dr in -1...1 {\n                for dc in -1...1 {\n                    let nr = r + dr\n                    let nc = c + dc\n                    if nr >= 0 && nr < m && nc >= 0 && nc < n {\n                        sum += img[nr][nc]\n                        count += 1\n                    }\n                }\n            }\n            out[r][c] = sum / count\n        }\n    }\n    return out\n}`,
              rust: `fn imageSmoother(img: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = img.len() as i32;\n    let n = img[0].len() as i32;\n    let mut out = vec![vec![0i32; n as usize]; m as usize];\n    for r in 0..m {\n        for c in 0..n {\n            let mut sum = 0;\n            let mut count = 0;\n            for dr in -1..=1 {\n                for dc in -1..=1 {\n                    let nr = r + dr;\n                    let nc = c + dc;\n                    if nr >= 0 && nr < m && nc >= 0 && nc < n {\n                        sum += img[nr as usize][nc as usize];\n                        count += 1;\n                    }\n                }\n            }\n            out[r as usize][c as usize] = sum / count;\n        }\n    }\n    out\n}`,
              php: `function imageSmoother($img) {\n    $m = count($img);\n    $n = count($img[0]);\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $row = array();\n        for ($c = 0; $c < $n; $c++) {\n            $sum = 0;\n            $count = 0;\n            for ($dr = -1; $dr <= 1; $dr++) {\n                for ($dc = -1; $dc <= 1; $dc++) {\n                    $nr = $r + $dr;\n                    $nc = $c + $dc;\n                    if ($nr >= 0 && $nr < $m && $nc >= 0 && $nc < $n) {\n                        $sum += $img[$nr][$nc];\n                        $count++;\n                    }\n                }\n            }\n            $row[] = intdiv($sum, $count);\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def imageSmoother(img)\n  m = img.length\n  n = img[0].length\n  (0...m).map do |r|\n    (0...n).map do |c|\n      sum = 0\n      count = 0\n      (-1..1).each do |dr|\n        (-1..1).each do |dc|\n          nr = r + dr\n          nc = c + dc\n          if nr >= 0 && nr < m && nc >= 0 && nc < n\n            sum += img[nr][nc]\n            count += 1\n          end\n        end\n      end\n      sum / count\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Count Negative Numbers in a Sorted Matrix ───────────────────
  (() => {
    const ref = (grid: number[][]) => {
      let count = 0;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) if (grid[r][c] < 0) count++;
      }
      return count;
    };
    return {
      slug: "count-negative-numbers-in-a-sorted-matrix",
      title: "Count Negative Numbers in a Sorted Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countNegatives", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m × n` matrix `grid` sorted in **non-increasing order** both row-wise and column-wise, return the number of negative values it contains.",
        [
          { in: "grid = [[4,3,2,-1],[3,2,1,-1],[1,1,-1,-2],[-1,-1,-2,-3]]", out: "8" },
          { in: "grid = [[3,2],[1,0]]", out: "0" },
          { in: "grid = [[-1]]", out: "1" },
        ],
        ["1 <= grid.length, grid[i].length <= 8", "-100 <= grid[i][j] <= 100", "grid is sorted non-increasing along rows and columns."],
        "Counting every cell is O(m·n). The double sortedness allows O(m + n)."),
      hints: [
        "The straightforward count works, but ignores the structure you were given.",
        "Start at the bottom-left corner. A negative there means the whole rest of that row is negative — add them all and move up.",
        "A non-negative there means step right. Each step consumes a row or a column, so the walk is O(m + n).",
      ],
      examples: [
        { input: "[[4,3,2,-1],[3,2,1,-1],[1,1,-1,-2],[-1,-1,-2,-3]]", expectedOutput: "8" },
        { input: "[[3,2],[1,0]]", expectedOutput: "0" },
        { input: "[[-1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const grid: number[][] = [];
        for (let r = 0; r < m; r++) {
          const row: number[] = [];
          for (let c = 0; c < n; c++) {
            const capLeft = c > 0 ? row[c - 1] : 100;
            const capUp = r > 0 ? grid[r - 1][c] : 100;
            const cap = Math.min(capLeft, capUp);
            row.push(ri(rng, -100, cap));
          }
          grid.push(row);
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def countNegatives(grid) -> int:\n    m, n = len(grid), len(grid[0])\n    r, c = m - 1, 0\n    count = 0\n    while r >= 0 and c < n:\n        if grid[r][c] < 0:\n            count += n - c\n            r -= 1\n        else:\n            c += 1\n    return count`,
        javascript: `var countNegatives = function(grid) {\n    const m = grid.length, n = grid[0].length;\n    let r = m - 1, c = 0, count = 0;\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c;\n            r--;\n        } else {\n            c++;\n        }\n    }\n    return count;\n};`,
              typescript: `function countNegatives(grid: number[][]): number {\n    var m = grid.length;\n    var n = grid[0].length;\n    var r = m - 1;\n    var c = 0;\n    var count = 0;\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c;\n            r--;\n        } else {\n            c++;\n        }\n    }\n    return count;\n}`,
              java: `public static int countNegatives(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int r = m - 1, c = 0, count = 0;\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c;\n            r--;\n        } else {\n            c++;\n        }\n    }\n    return count;\n}`,
              cpp: `int countNegatives(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int r = m - 1, c = 0, count = 0;\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c;\n            r--;\n        } else {\n            c++;\n        }\n    }\n    return count;\n}`,
              c: `int countNegatives(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int r = m - 1, c = 0, count = 0;\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c;\n            r--;\n        } else {\n            c++;\n        }\n    }\n    return count;\n}`,
              csharp: `public static int CountNegatives(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int r = m - 1, c = 0, count = 0;\n    while (r >= 0 && c < n)\n    {\n        if (grid[r][c] < 0)\n        {\n            count += n - c;\n            r--;\n        }\n        else\n        {\n            c++;\n        }\n    }\n    return count;\n}`,
              go: `func countNegatives(grid [][]int) int {\n	m, n := len(grid), len(grid[0])\n	r, c, count := m-1, 0, 0\n	for r >= 0 && c < n {\n		if grid[r][c] < 0 {\n			count += n - c\n			r--\n		} else {\n			c++\n		}\n	}\n	return count\n}`,
              kotlin: `fun countNegatives(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    var r = m - 1\n    var c = 0\n    var count = 0\n    while (r >= 0 && c < n) {\n        if (grid[r][c] < 0) {\n            count += n - c\n            r--\n        } else {\n            c++\n        }\n    }\n    return count\n}`,
              swift: `func countNegatives(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var r = m - 1\n    var c = 0\n    var count = 0\n    while r >= 0 && c < n {\n        if grid[r][c] < 0 {\n            count += n - c\n            r -= 1\n        } else {\n            c += 1\n        }\n    }\n    return count\n}`,
              rust: `fn countNegatives(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len() as i32;\n    let n = grid[0].len() as i32;\n    let mut r = m - 1;\n    let mut c = 0;\n    let mut count = 0;\n    while r >= 0 && c < n {\n        if grid[r as usize][c as usize] < 0 {\n            count += n - c;\n            r -= 1;\n        } else {\n            c += 1;\n        }\n    }\n    count\n}`,
              php: `function countNegatives($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $r = $m - 1;\n    $c = 0;\n    $count = 0;\n    while ($r >= 0 && $c < $n) {\n        if ($grid[$r][$c] < 0) {\n            $count += $n - $c;\n            $r--;\n        } else {\n            $c++;\n        }\n    }\n    return $count;\n}`,
              ruby: `def countNegatives(grid)\n  m = grid.length\n  n = grid[0].length\n  r = m - 1\n  c = 0\n  count = 0\n  while r >= 0 && c < n\n    if grid[r][c] < 0\n      count += n - c\n      r -= 1\n    else\n      c += 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Lucky Numbers in a Matrix ───────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const out: number[] = [];
      for (let r = 0; r < m; r++) {
        let minC = 0;
        for (let c = 1; c < n; c++) if (matrix[r][c] < matrix[r][minC]) minC = c;
        let isMax = true;
        for (let rr = 0; rr < m; rr++) if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }
        if (isMax) out.push(matrix[r][minC]);
      }
      return out;
    };
    return {
      slug: "lucky-numbers-in-a-matrix",
      title: "Lucky Numbers in a Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Adobe"],
      signature: { funcName: "luckyNumbers", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an `m × n` matrix of **distinct** numbers, return all the **lucky numbers**, in row order.\n\nA lucky number is an element that is the minimum of its row **and** the maximum of its column.",
        [
          { in: "matrix = [[3,7,8],[9,11,13],[15,16,17]]", out: "[15]", note: "15 is the smallest in its row and the largest in its column." },
          { in: "matrix = [[1,10,4,2],[9,3,8,7],[15,16,17,12]]", out: "[12]" },
          { in: "matrix = [[7,8],[1,2]]", out: "[7]" },
        ],
        ["1 <= matrix.length, matrix[i].length <= 8", "1 <= matrix[i][j] <= 100000", "All elements are distinct."]),
      hints: [
        "Find the minimum of each row, then check whether it also dominates its column.",
        "Because the values are distinct, at most one lucky number can exist — but scanning every row is still the clearest way to find it.",
        "Alternatively, intersect the set of row minima with the set of column maxima.",
      ],
      examples: [
        { input: "[[3,7,8],[9,11,13],[15,16,17]]", expectedOutput: "[15]" },
        { input: "[[1,10,4,2],[9,3,8,7],[15,16,17,12]]", expectedOutput: "[12]" },
        { input: "[[7,8],[1,2]]", expectedOutput: "[7]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const values = new Set<number>();
        while (values.size < m * n) values.add(ri(rng, 1, 100000));
        const flat = shuffle(rng, Array.from(values));
        const matrix: number[][] = [];
        for (let r = 0; r < m; r++) matrix.push(flat.slice(r * n, r * n + n));
        return { input: fmtIntMat(matrix), expectedOutput: fmtIntArr(ref(matrix)) };
      },
      solutions: {
        python: `def luckyNumbers(matrix):\n    row_min = {min(row) for row in matrix}\n    col_max = {max(col) for col in zip(*matrix)}\n    return [v for row in matrix for v in row if v in row_min and v in col_max]`,
        javascript: `var luckyNumbers = function(matrix) {\n    const m = matrix.length, n = matrix[0].length;\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        let minC = 0;\n        for (let c = 1; c < n; c++) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        let isMax = true;\n        for (let rr = 0; rr < m; rr++) {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out.push(matrix[r][minC]);\n    }\n    return out;\n};`,
              typescript: `function luckyNumbers(matrix: number[][]): number[] {\n    var m = matrix.length;\n    var n = matrix[0].length;\n    var out: number[] = [];\n    for (var r = 0; r < m; r++) {\n        var minC = 0;\n        for (var c = 1; c < n; c++) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        var isMax = true;\n        for (var rr = 0; rr < m; rr++) {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out.push(matrix[r][minC]);\n    }\n    return out;\n}`,
              java: `public static int[] luckyNumbers(int[][] matrix) {\n    int m = matrix.length, n = matrix[0].length;\n    List<Integer> out = new ArrayList<>();\n    for (int r = 0; r < m; r++) {\n        int minC = 0;\n        for (int c = 1; c < n; c++) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        boolean isMax = true;\n        for (int rr = 0; rr < m; rr++) {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out.add(matrix[r][minC]);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> luckyNumbers(vector<vector<int>>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<int> out;\n    for (int r = 0; r < m; r++) {\n        int minC = 0;\n        for (int c = 1; c < n; c++) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        bool isMax = true;\n        for (int rr = 0; rr < m; rr++) {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out.push_back(matrix[r][minC]);\n    }\n    return out;\n}`,
              c: `int* luckyNumbers(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {\n    int m = matrixSize, n = matrixColSize[0];\n    int* out = (int*) malloc(sizeof(int) * (m > 0 ? m : 1));\n    int len = 0;\n    for (int r = 0; r < m; r++) {\n        int minC = 0;\n        for (int c = 1; c < n; c++) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        bool isMax = true;\n        for (int rr = 0; rr < m; rr++) {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out[len++] = matrix[r][minC];\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] LuckyNumbers(int[][] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    var out_ = new List<int>();\n    for (int r = 0; r < m; r++)\n    {\n        int minC = 0;\n        for (int c = 1; c < n; c++)\n        {\n            if (matrix[r][c] < matrix[r][minC]) minC = c;\n        }\n        bool isMax = true;\n        for (int rr = 0; rr < m; rr++)\n        {\n            if (matrix[rr][minC] > matrix[r][minC]) { isMax = false; break; }\n        }\n        if (isMax) out_.Add(matrix[r][minC]);\n    }\n    return out_.ToArray();\n}`,
              go: `func luckyNumbers(matrix [][]int) []int {\n	m, n := len(matrix), len(matrix[0])\n	out := []int{}\n	for r := 0; r < m; r++ {\n		minC := 0\n		for c := 1; c < n; c++ {\n			if matrix[r][c] < matrix[r][minC] {\n				minC = c\n			}\n		}\n		isMax := true\n		for rr := 0; rr < m; rr++ {\n			if matrix[rr][minC] > matrix[r][minC] {\n				isMax = false\n				break\n			}\n		}\n		if isMax {\n			out = append(out, matrix[r][minC])\n		}\n	}\n	return out\n}`,
              kotlin: `fun luckyNumbers(matrix: Array<IntArray>): IntArray {\n    val m = matrix.size\n    val n = matrix[0].size\n    val out = ArrayList<Int>()\n    for (r in 0 until m) {\n        var minC = 0\n        for (c in 1 until n) {\n            if (matrix[r][c] < matrix[r][minC]) minC = c\n        }\n        var isMax = true\n        for (rr in 0 until m) {\n            if (matrix[rr][minC] > matrix[r][minC]) {\n                isMax = false\n                break\n            }\n        }\n        if (isMax) out.add(matrix[r][minC])\n    }\n    return out.toIntArray()\n}`,
              swift: `func luckyNumbers(_ matrix: [[Int]]) -> [Int] {\n    let m = matrix.count\n    let n = matrix[0].count\n    var out: [Int] = []\n    for r in 0..<m {\n        var minC = 0\n        for c in 1..<max(n, 1) where matrix[r][c] < matrix[r][minC] { minC = c }\n        var isMax = true\n        for rr in 0..<m where matrix[rr][minC] > matrix[r][minC] { isMax = false }\n        if isMax { out.append(matrix[r][minC]) }\n    }\n    return out\n}`,
              rust: `fn luckyNumbers(matrix: Vec<Vec<i32>>) -> Vec<i32> {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let mut out: Vec<i32> = Vec::new();\n    for r in 0..m {\n        let mut min_c = 0;\n        for c in 1..n {\n            if matrix[r][c] < matrix[r][min_c] {\n                min_c = c;\n            }\n        }\n        let mut is_max = true;\n        for rr in 0..m {\n            if matrix[rr][min_c] > matrix[r][min_c] {\n                is_max = false;\n                break;\n            }\n        }\n        if is_max {\n            out.push(matrix[r][min_c]);\n        }\n    }\n    out\n}`,
              php: `function luckyNumbers($matrix) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $minC = 0;\n        for ($c = 1; $c < $n; $c++) {\n            if ($matrix[$r][$c] < $matrix[$r][$minC]) $minC = $c;\n        }\n        $isMax = true;\n        for ($rr = 0; $rr < $m; $rr++) {\n            if ($matrix[$rr][$minC] > $matrix[$r][$minC]) { $isMax = false; break; }\n        }\n        if ($isMax) $out[] = $matrix[$r][$minC];\n    }\n    return $out;\n}`,
              ruby: `def luckyNumbers(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  out = []\n  (0...m).each do |r|\n    min_c = 0\n    (1...n).each { |c| min_c = c if matrix[r][c] < matrix[r][min_c] }\n    is_max = true\n    (0...m).each do |rr|\n      if matrix[rr][min_c] > matrix[r][min_c]\n        is_max = false\n        break\n      end\n    end\n    out << matrix[r][min_c] if is_max\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Shift 2D Grid ───────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length, total = m * n;
      const shift = k % total;
      const flat: number[] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) flat.push(grid[r][c]);
      const out: number[][] = [];
      for (let r = 0; r < m; r++) {
        const row: number[] = [];
        for (let c = 0; c < n; c++) {
          const idx = ((r * n + c) - shift + total) % total;
          row.push(flat[idx]);
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "shift-2d-grid",
      title: "Shift 2D Grid",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "shiftGrid", params: [{ name: "grid", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given a 2-D `grid` of size `m × n` and an integer `k`, shift the grid `k` times.\n\nOne shift moves every element one column to the right; an element at the end of a row moves to the start of the next row, and the element at the bottom-right corner moves to the top-left. Return the grid after `k` shifts.",
        [
          { in: "grid = [[1,2,3],[4,5,6],[7,8,9]], k = 1", out: "[[9,1,2],[3,4,5],[6,7,8]]" },
          { in: "grid = [[1,2,3],[4,5,6],[7,8,9]], k = 9", out: "[[1,2,3],[4,5,6],[7,8,9]]", note: "A full cycle returns the grid unchanged." },
          { in: "grid = [[1,2],[3,4]], k = 2", out: "[[3,4],[1,2]]" },
        ],
        ["1 <= grid.length, grid[i].length <= 8", "-1000 <= grid[i][j] <= 1000", "0 <= k <= 100"]),
      hints: [
        "Reading the grid row by row makes it a flat list, and the shift is a rotation of that list.",
        "Reduce `k` modulo `m × n` first — anything more is a whole number of cycles.",
        "The element landing at flat position `i` came from `(i - k) mod (m·n)`.",
      ],
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]\n1", expectedOutput: "[[9,1,2],[3,4,5],[6,7,8]]" },
        { input: "[[1,2,3],[4,5,6],[7,8,9]]\n9", expectedOutput: "[[1,2,3],[4,5,6],[7,8,9]]" },
        { input: "[[1,2],[3,4]]\n2", expectedOutput: "[[3,4],[1,2]]" },
      ],
      gen: (rng: Rng) => {
        const grid = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), -1000, 1000);
        const k = ri(rng, 0, 100);
        return { input: `${fmtIntMat(grid)}\n${k}`, expectedOutput: fmtIntMat(ref(grid, k)) };
      },
      solutions: {
        python: `def shiftGrid(grid, k: int):\n    m, n = len(grid), len(grid[0])\n    total = m * n\n    shift = k % total\n    flat = [v for row in grid for v in row]\n    return [[flat[(r * n + c - shift) % total] for c in range(n)] for r in range(m)]`,
        javascript: `var shiftGrid = function(grid, k) {\n    const m = grid.length, n = grid[0].length, total = m * n;\n    const shift = k % total;\n    const flat = [];\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) flat.push(grid[r][c]);\n    }\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) {\n            const idx = ((r * n + c) - shift + total) % total;\n            row.push(flat[idx]);\n        }\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function shiftGrid(grid: number[][], k: number): number[][] {\n    var m = grid.length;\n    var n = grid[0].length;\n    var total = m * n;\n    var shift = k % total;\n    var flat: number[] = [];\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) flat.push(grid[r][c]);\n    }\n    var out: number[][] = [];\n    for (var r2 = 0; r2 < m; r2++) {\n        var row: number[] = [];\n        for (var c2 = 0; c2 < n; c2++) {\n            var idx = ((r2 * n + c2) - shift + total) % total;\n            row.push(flat[idx]);\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] shiftGrid(int[][] grid, int k) {\n    int m = grid.length, n = grid[0].length, total = m * n;\n    int shift = k % total;\n    int[] flat = new int[total];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) flat[r * n + c] = grid[r][c];\n    }\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            out[r][c] = flat[((r * n + c) - shift + total) % total];\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> shiftGrid(vector<vector<int>>& grid, int k) {\n    int m = (int) grid.size(), n = (int) grid[0].size(), total = m * n;\n    int shift = k % total;\n    vector<int> flat(total, 0);\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) flat[r * n + c] = grid[r][c];\n    }\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            out[r][c] = flat[((r * n + c) - shift + total) % total];\n        }\n    }\n    return out;\n}`,
              c: `int** shiftGrid(int** grid, int gridSize, int* gridColSize, int k, int* returnSize, int** returnColumnSizes) {\n    int m = gridSize, n = gridColSize[0], total = m * n;\n    int shift = k % total;\n    int* flat = (int*) malloc(sizeof(int) * total);\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) flat[r * n + c] = grid[r][c];\n    }\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) {\n            out[r][c] = flat[((r * n + c) - shift + total) % total];\n        }\n    }\n    free(flat);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] ShiftGrid(int[][] grid, int k)\n{\n    int m = grid.Length, n = grid[0].Length, total = m * n;\n    int shift = k % total;\n    int[] flat = new int[total];\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++) flat[r * n + c] = grid[r][c];\n    }\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++)\n        {\n            out_[r][c] = flat[((r * n + c) - shift + total) % total];\n        }\n    }\n    return out_;\n}`,
              go: `func shiftGrid(grid [][]int, k int) [][]int {\n	m, n := len(grid), len(grid[0])\n	total := m * n\n	shift := k % total\n	flat := make([]int, total)\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			flat[r*n+c] = grid[r][c]\n		}\n	}\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			out[r][c] = flat[((r*n+c)-shift+total)%total]\n		}\n	}\n	return out\n}`,
              kotlin: `fun shiftGrid(grid: Array<IntArray>, k: Int): Array<IntArray> {\n    val m = grid.size\n    val n = grid[0].size\n    val total = m * n\n    val shift = k % total\n    val flat = IntArray(total)\n    for (r in 0 until m) {\n        for (c in 0 until n) flat[r * n + c] = grid[r][c]\n    }\n    val out = Array(m) { IntArray(n) }\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            out[r][c] = flat[((r * n + c) - shift + total) % total]\n        }\n    }\n    return out\n}`,
              swift: `func shiftGrid(_ grid: [[Int]], _ k: Int) -> [[Int]] {\n    let m = grid.count\n    let n = grid[0].count\n    let total = m * n\n    let shift = k % total\n    var flat = [Int](repeating: 0, count: total)\n    for r in 0..<m {\n        for c in 0..<n { flat[r * n + c] = grid[r][c] }\n    }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for r in 0..<m {\n        for c in 0..<n {\n            out[r][c] = flat[((r * n + c) - shift + total) % total]\n        }\n    }\n    return out\n}`,
              rust: `fn shiftGrid(grid: Vec<Vec<i32>>, k: i32) -> Vec<Vec<i32>> {\n    let m = grid.len();\n    let n = grid[0].len();\n    let total = (m * n) as i32;\n    let shift = k % total;\n    let mut flat: Vec<i32> = Vec::new();\n    for row in grid.iter() {\n        for v in row.iter() {\n            flat.push(*v);\n        }\n    }\n    let mut out = vec![vec![0i32; n]; m];\n    for r in 0..m {\n        for c in 0..n {\n            let idx = (((r * n + c) as i32 - shift + total) % total) as usize;\n            out[r][c] = flat[idx];\n        }\n    }\n    out\n}`,
              php: `function shiftGrid($grid, $k) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $total = $m * $n;\n    $shift = $k % $total;\n    $flat = array();\n    foreach ($grid as $row) {\n        foreach ($row as $v) $flat[] = $v;\n    }\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $row = array();\n        for ($c = 0; $c < $n; $c++) {\n            $idx = (($r * $n + $c) - $shift + $total) % $total;\n            $row[] = $flat[$idx];\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def shiftGrid(grid, k)\n  m = grid.length\n  n = grid[0].length\n  total = m * n\n  shift = k % total\n  flat = grid.flatten\n  (0...m).map do |r|\n    (0...n).map do |c|\n      flat[((r * n + c) - shift + total) % total]\n    end\n  end\nend`,
      },
    };
  })(),

  // ── The K Weakest Rows in a Matrix ──────────────────────────────
  (() => {
    const ref = (mat: number[][], k: number) => {
      const rows = mat.map((row, i) => {
        let soldiers = 0;
        for (let c = 0; c < row.length; c++) soldiers += row[c];
        return { i, soldiers };
      });
      rows.sort((a, b) => (a.soldiers !== b.soldiers ? a.soldiers - b.soldiers : a.i - b.i));
      return rows.slice(0, k).map((r) => r.i);
    };
    return {
      slug: "the-k-weakest-rows-in-a-matrix",
      title: "The K Weakest Rows in a Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Sorting", "Heap", "Matrix", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "kWeakestRows", params: [{ name: "mat", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an `m × n` binary matrix `mat` of `1`s (soldiers) and `0`s (civilians). Every row has its soldiers **before** its civilians.\n\nRow `i` is **weaker** than row `j` if it has fewer soldiers, or if the counts tie and `i < j`. Return the indices of the `k` weakest rows, ordered from weakest.",
        [
          { in: "mat = [[1,1,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,0,0,0],[1,1,1,1,1]], k = 3", out: "[2,0,3]" },
          { in: "mat = [[1,0,0,0],[1,1,1,1],[1,0,0,0],[1,0,0,0]], k = 2", out: "[0,2]" },
          { in: "mat = [[1,1],[0,0]], k = 1", out: "[1]" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "Every row is a block of 1s followed by a block of 0s.", "1 <= k <= mat.length"]),
      hints: [
        "The soldier count of a row is just its sum, since the entries are 0 and 1.",
        "Because each row is sorted, binary search finds the boundary in O(log n) instead of O(n).",
        "Sort by (soldiers, index) so ties break toward the smaller index, then take the first `k`.",
      ],
      examples: [
        { input: "[[1,1,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,0,0,0],[1,1,1,1,1]]\n3", expectedOutput: "[2,0,3]" },
        { input: "[[1,0,0,0],[1,1,1,1],[1,0,0,0],[1,0,0,0]]\n2", expectedOutput: "[0,2]" },
        { input: "[[1,1],[0,0]]\n1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const mat: number[][] = [];
        for (let r = 0; r < m; r++) {
          const soldiers = ri(rng, 0, n);
          mat.push(Array.from({ length: n }, (_, c) => (c < soldiers ? 1 : 0)));
        }
        const k = ri(rng, 1, m);
        return { input: `${fmtIntMat(mat)}\n${k}`, expectedOutput: fmtIntArr(ref(mat, k)) };
      },
      solutions: {
        python: `def kWeakestRows(mat, k: int):\n    order = sorted(range(len(mat)), key=lambda i: (sum(mat[i]), i))\n    return order[:k]`,
        javascript: `var kWeakestRows = function(mat, k) {\n    const rows = [];\n    for (let i = 0; i < mat.length; i++) {\n        let soldiers = 0;\n        for (let c = 0; c < mat[i].length; c++) soldiers += mat[i][c];\n        rows.push([soldiers, i]);\n    }\n    rows.sort(function(a, b) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });\n    const out = [];\n    for (let i = 0; i < k; i++) out.push(rows[i][1]);\n    return out;\n};`,
              typescript: `function kWeakestRows(mat: number[][], k: number): number[] {\n    var rows: number[][] = [];\n    for (var i = 0; i < mat.length; i++) {\n        var soldiers = 0;\n        for (var c = 0; c < mat[i].length; c++) soldiers += mat[i][c];\n        rows.push([soldiers, i]);\n    }\n    rows.sort(function (a, b) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });\n    var out: number[] = [];\n    for (var j = 0; j < k; j++) out.push(rows[j][1]);\n    return out;\n}`,
              java: `public static int[] kWeakestRows(int[][] mat, int k) {\n    int m = mat.length;\n    Integer[] order = new Integer[m];\n    final int[] soldiers = new int[m];\n    for (int i = 0; i < m; i++) {\n        int count = 0;\n        for (int c = 0; c < mat[i].length; c++) count += mat[i][c];\n        soldiers[i] = count;\n        order[i] = i;\n    }\n    Arrays.sort(order, new Comparator<Integer>() {\n        public int compare(Integer a, Integer b) {\n            if (soldiers[a] != soldiers[b]) return soldiers[a] - soldiers[b];\n            return a - b;\n        }\n    });\n    int[] out = new int[k];\n    for (int i = 0; i < k; i++) out[i] = order[i];\n    return out;\n}`,
              cpp: `vector<int> kWeakestRows(vector<vector<int>>& mat, int k) {\n    vector<pair<int, int>> rows;\n    for (int i = 0; i < (int) mat.size(); i++) {\n        int soldiers = 0;\n        for (int v : mat[i]) soldiers += v;\n        rows.push_back(make_pair(soldiers, i));\n    }\n    sort(rows.begin(), rows.end());\n    vector<int> out;\n    for (int i = 0; i < k; i++) out.push_back(rows[i].second);\n    return out;\n}`,
              c: `int* kWeakestRows(int** mat, int matSize, int* matColSize, int k, int* returnSize) {\n    int m = matSize, n = matColSize[0];\n    int* soldiers = (int*) malloc(sizeof(int) * m);\n    int* order = (int*) malloc(sizeof(int) * m);\n    for (int i = 0; i < m; i++) {\n        int count = 0;\n        for (int c = 0; c < n; c++) count += mat[i][c];\n        soldiers[i] = count;\n        order[i] = i;\n    }\n    for (int i = 1; i < m; i++) {\n        int keyIdx = order[i];\n        int j = i - 1;\n        while (j >= 0 && (soldiers[order[j]] > soldiers[keyIdx] ||\n               (soldiers[order[j]] == soldiers[keyIdx] && order[j] > keyIdx))) {\n            order[j + 1] = order[j];\n            j--;\n        }\n        order[j + 1] = keyIdx;\n    }\n    int* out = (int*) malloc(sizeof(int) * k);\n    for (int i = 0; i < k; i++) out[i] = order[i];\n    free(soldiers);\n    free(order);\n    *returnSize = k;\n    return out;\n}`,
              csharp: `public static int[] KWeakestRows(int[][] mat, int k)\n{\n    int m = mat.Length;\n    var rows = new List<int[]>();\n    for (int i = 0; i < m; i++)\n    {\n        int soldiers = 0;\n        foreach (int v in mat[i]) soldiers += v;\n        rows.Add(new int[] { soldiers, i });\n    }\n    rows.Sort(delegate (int[] a, int[] b)\n    {\n        if (a[0] != b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    int[] out_ = new int[k];\n    for (int i = 0; i < k; i++) out_[i] = rows[i][1];\n    return out_;\n}`,
              go: `func kWeakestRows(mat [][]int, k int) []int {\n	m := len(mat)\n	soldiers := make([]int, m)\n	order := make([]int, m)\n	for i := 0; i < m; i++ {\n		count := 0\n		for _, v := range mat[i] {\n			count += v\n		}\n		soldiers[i] = count\n		order[i] = i\n	}\n	sort.Slice(order, func(a, b int) bool {\n		if soldiers[order[a]] != soldiers[order[b]] {\n			return soldiers[order[a]] < soldiers[order[b]]\n		}\n		return order[a] < order[b]\n	})\n	return order[:k]\n}`,
              kotlin: `fun kWeakestRows(mat: Array<IntArray>, k: Int): IntArray {\n    val m = mat.size\n    val soldiers = IntArray(m)\n    for (i in 0 until m) soldiers[i] = mat[i].sum()\n    val order = (0 until m).sortedWith(compareBy({ soldiers[it] }, { it }))\n    return order.take(k).toIntArray()\n}`,
              swift: `func kWeakestRows(_ mat: [[Int]], _ k: Int) -> [Int] {\n    var rows: [(Int, Int)] = []\n    for i in 0..<mat.count {\n        var soldiers = 0\n        for v in mat[i] { soldiers += v }\n        rows.append((soldiers, i))\n    }\n    rows.sort { a, b in a.0 != b.0 ? a.0 < b.0 : a.1 < b.1 }\n    return rows.prefix(k).map { $0.1 }\n}`,
              rust: `fn kWeakestRows(mat: Vec<Vec<i32>>, k: i32) -> Vec<i32> {\n    let mut rows: Vec<(i32, i32)> = Vec::new();\n    for i in 0..mat.len() {\n        let soldiers: i32 = mat[i].iter().sum();\n        rows.push((soldiers, i as i32));\n    }\n    rows.sort();\n    rows.into_iter().take(k as usize).map(|p| p.1).collect()\n}`,
              php: `function kWeakestRows($mat, $k) {\n    $rows = array();\n    for ($i = 0; $i < count($mat); $i++) {\n        $soldiers = array_sum($mat[$i]);\n        $rows[] = array($soldiers, $i);\n    }\n    usort($rows, function ($a, $b) {\n        if ($a[0] !== $b[0]) return $a[0] - $b[0];\n        return $a[1] - $b[1];\n    });\n    $out = array();\n    for ($i = 0; $i < $k; $i++) $out[] = $rows[$i][1];\n    return $out;\n}`,
              ruby: `def kWeakestRows(mat, k)\n  rows = mat.each_with_index.map { |row, i| [row.sum, i] }\n  rows.sort!\n  rows.first(k).map { |pair| pair[1] }\nend`,
      },
    };
  })(),

  // ── Max Increase to Keep City Skyline ───────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const rowMax = grid.map((row) => Math.max.apply(null, row));
      const colMax: number[] = [];
      for (let c = 0; c < n; c++) {
        let best = grid[0][c];
        for (let r = 1; r < m; r++) if (grid[r][c] > best) best = grid[r][c];
        colMax.push(best);
      }
      let total = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) total += Math.min(rowMax[r], colMax[c]) - grid[r][c];
      }
      return total;
    };
    return {
      slug: "max-increase-to-keep-city-skyline",
      title: "Max Increase to Keep City Skyline",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Matrix", "Amazon", "Google"],
      signature: { funcName: "maxIncreaseKeepingSkyline", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There is a city whose buildings sit on an `n × n` grid; `grid[r][c]` is the height of the building at `(r, c)`.\n\nYou may raise any building by any amount, provided the city's **skyline** — the silhouette seen from each of the four cardinal directions — does not change. Return the maximum total increase possible.",
        [
          { in: "grid = [[3,0,8,4],[2,4,5,7],[9,2,6,3],[0,3,1,0]]", out: "35" },
          { in: "grid = [[0,0],[0,0]]", out: "0" },
          { in: "grid = [[5,2],[2,5]]", out: "6" },
        ],
        ["1 <= grid.length <= 8", "grid[i].length == grid.length", "0 <= grid[r][c] <= 100"]),
      hints: [
        "The skyline from the left and right is the maximum of each **row**; from the top and bottom it is the maximum of each **column**.",
        "So a building may grow up to `min(rowMax[r], colMax[c])` without changing either silhouette.",
        "Add up the difference between that ceiling and the current height at every cell.",
      ],
      examples: [
        { input: "[[3,0,8,4],[2,4,5,7],[9,2,6,3],[0,3,1,0]]", expectedOutput: "35" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
        { input: "[[5,2],[2,5]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const grid = randMat(rng, n, n, 0, 100);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def maxIncreaseKeepingSkyline(grid) -> int:\n    row_max = [max(row) for row in grid]\n    col_max = [max(col) for col in zip(*grid)]\n    return sum(min(row_max[r], col_max[c]) - grid[r][c]\n               for r in range(len(grid)) for c in range(len(grid[0])))`,
        javascript: `var maxIncreaseKeepingSkyline = function(grid) {\n    const m = grid.length, n = grid[0].length;\n    const rowMax = [], colMax = [];\n    for (let r = 0; r < m; r++) {\n        let best = grid[r][0];\n        for (let c = 1; c < n; c++) {\n            if (grid[r][c] > best) best = grid[r][c];\n        }\n        rowMax.push(best);\n    }\n    for (let c = 0; c < n; c++) {\n        let best = grid[0][c];\n        for (let r = 1; r < m; r++) {\n            if (grid[r][c] > best) best = grid[r][c];\n        }\n        colMax.push(best);\n    }\n    let total = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            total += Math.min(rowMax[r], colMax[c]) - grid[r][c];\n        }\n    }\n    return total;\n};`,
              typescript: `function maxIncreaseKeepingSkyline(grid: number[][]): number {\n    var m = grid.length;\n    var n = grid[0].length;\n    var rowMax: number[] = [];\n    var colMax: number[] = [];\n    for (var r = 0; r < m; r++) {\n        var best = grid[r][0];\n        for (var c = 1; c < n; c++) {\n            if (grid[r][c] > best) best = grid[r][c];\n        }\n        rowMax.push(best);\n    }\n    for (var c2 = 0; c2 < n; c2++) {\n        var best2 = grid[0][c2];\n        for (var r2 = 1; r2 < m; r2++) {\n            if (grid[r2][c2] > best2) best2 = grid[r2][c2];\n        }\n        colMax.push(best2);\n    }\n    var total = 0;\n    for (var r3 = 0; r3 < m; r3++) {\n        for (var c3 = 0; c3 < n; c3++) {\n            total += Math.min(rowMax[r3], colMax[c3]) - grid[r3][c3];\n        }\n    }\n    return total;\n}`,
              java: `public static int maxIncreaseKeepingSkyline(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[] rowMax = new int[m];\n    int[] colMax = new int[n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] > rowMax[r]) rowMax[r] = grid[r][c];\n            if (grid[r][c] > colMax[c]) colMax[c] = grid[r][c];\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            total += Math.min(rowMax[r], colMax[c]) - grid[r][c];\n        }\n    }\n    return total;\n}`,
              cpp: `int maxIncreaseKeepingSkyline(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> rowMax(m, 0), colMax(n, 0);\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            rowMax[r] = max(rowMax[r], grid[r][c]);\n            colMax[c] = max(colMax[c], grid[r][c]);\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            total += min(rowMax[r], colMax[c]) - grid[r][c];\n        }\n    }\n    return total;\n}`,
              c: `int maxIncreaseKeepingSkyline(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int* rowMax = (int*) calloc(m, sizeof(int));\n    int* colMax = (int*) calloc(n, sizeof(int));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] > rowMax[r]) rowMax[r] = grid[r][c];\n            if (grid[r][c] > colMax[c]) colMax[c] = grid[r][c];\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int cap = rowMax[r] < colMax[c] ? rowMax[r] : colMax[c];\n            total += cap - grid[r][c];\n        }\n    }\n    free(rowMax);\n    free(colMax);\n    return total;\n}`,
              csharp: `public static int MaxIncreaseKeepingSkyline(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int[] rowMax = new int[m];\n    int[] colMax = new int[n];\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (grid[r][c] > rowMax[r]) rowMax[r] = grid[r][c];\n            if (grid[r][c] > colMax[c]) colMax[c] = grid[r][c];\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            total += Math.Min(rowMax[r], colMax[c]) - grid[r][c];\n        }\n    }\n    return total;\n}`,
              go: `func maxIncreaseKeepingSkyline(grid [][]int) int {\n	m, n := len(grid), len(grid[0])\n	rowMax := make([]int, m)\n	colMax := make([]int, n)\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if grid[r][c] > rowMax[r] {\n				rowMax[r] = grid[r][c]\n			}\n			if grid[r][c] > colMax[c] {\n				colMax[c] = grid[r][c]\n			}\n		}\n	}\n	total := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			cap := rowMax[r]\n			if colMax[c] < cap {\n				cap = colMax[c]\n			}\n			total += cap - grid[r][c]\n		}\n	}\n	return total\n}`,
              kotlin: `fun maxIncreaseKeepingSkyline(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val rowMax = IntArray(m)\n    val colMax = IntArray(n)\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (grid[r][c] > rowMax[r]) rowMax[r] = grid[r][c]\n            if (grid[r][c] > colMax[c]) colMax[c] = grid[r][c]\n        }\n    }\n    var total = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            total += Math.min(rowMax[r], colMax[c]) - grid[r][c]\n        }\n    }\n    return total\n}`,
              swift: `func maxIncreaseKeepingSkyline(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var rowMax = [Int](repeating: 0, count: m)\n    var colMax = [Int](repeating: 0, count: n)\n    for r in 0..<m {\n        for c in 0..<n {\n            if grid[r][c] > rowMax[r] { rowMax[r] = grid[r][c] }\n            if grid[r][c] > colMax[c] { colMax[c] = grid[r][c] }\n        }\n    }\n    var total = 0\n    for r in 0..<m {\n        for c in 0..<n {\n            total += min(rowMax[r], colMax[c]) - grid[r][c]\n        }\n    }\n    return total\n}`,
              rust: `fn maxIncreaseKeepingSkyline(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut row_max = vec![0i32; m];\n    let mut col_max = vec![0i32; n];\n    for r in 0..m {\n        for c in 0..n {\n            if grid[r][c] > row_max[r] {\n                row_max[r] = grid[r][c];\n            }\n            if grid[r][c] > col_max[c] {\n                col_max[c] = grid[r][c];\n            }\n        }\n    }\n    let mut total = 0;\n    for r in 0..m {\n        for c in 0..n {\n            let cap = if row_max[r] < col_max[c] { row_max[r] } else { col_max[c] };\n            total += cap - grid[r][c];\n        }\n    }\n    total\n}`,
              php: `function maxIncreaseKeepingSkyline($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $rowMax = array_fill(0, $m, 0);\n    $colMax = array_fill(0, $n, 0);\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($grid[$r][$c] > $rowMax[$r]) $rowMax[$r] = $grid[$r][$c];\n            if ($grid[$r][$c] > $colMax[$c]) $colMax[$c] = $grid[$r][$c];\n        }\n    }\n    $total = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            $cap = min($rowMax[$r], $colMax[$c]);\n            $total += $cap - $grid[$r][$c];\n        }\n    }\n    return $total;\n}`,
              ruby: `def maxIncreaseKeepingSkyline(grid)\n  m = grid.length\n  n = grid[0].length\n  row_max = grid.map(&:max)\n  col_max = (0...n).map { |c| (0...m).map { |r| grid[r][c] }.max }\n  total = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      total += [row_max[r], col_max[c]].min - grid[r][c]\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Number of Equivalent Domino Pairs ───────────────────────────
  (() => {
    const ref = (dominoes: number[][]) => {
      const count = new Map<number, number>();
      let total = 0;
      for (let i = 0; i < dominoes.length; i++) {
        const a = dominoes[i][0], b = dominoes[i][1];
        const key = a < b ? a * 10 + b : b * 10 + a;
        total += count.get(key) ?? 0;
        count.set(key, (count.get(key) ?? 0) + 1);
      }
      return total;
    };
    return {
      slug: "number-of-equivalent-domino-pairs",
      title: "Number of Equivalent Domino Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "numEquivDominoPairs", params: [{ name: "dominoes", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Two dominoes `[a, b]` and `[c, d]` are **equivalent** if `a == c and b == d`, or if `a == d and b == c` — a domino may be rotated.\n\nGiven a list `dominoes`, return the number of pairs `(i, j)` with `i < j` where the two dominoes are equivalent.",
        [
          { in: "dominoes = [[1,2],[2,1],[3,4],[5,6]]", out: "1", note: "[1,2] and [2,1] are the same domino rotated." },
          { in: "dominoes = [[1,2],[1,2],[1,1],[1,2],[2,2]]", out: "3", note: "The three [1,2] dominoes give 3-choose-2 = 3 pairs." },
          { in: "dominoes = [[1,1]]", out: "0" },
        ],
        ["1 <= dominoes.length <= 30", "dominoes[i].length == 2", "1 <= dominoes[i][j] <= 9"]),
      hints: [
        "Rotation means `[a, b]` and `[b, a]` must hash to the same key — normalise by putting the smaller value first.",
        "`min * 10 + max` packs the normalised pair into a single integer key.",
        "Count as you scan: each new domino pairs with every equivalent one already seen.",
      ],
      examples: [
        { input: "[[1,2],[2,1],[3,4],[5,6]]", expectedOutput: "1" },
        { input: "[[1,2],[1,2],[1,1],[1,2],[2,2]]", expectedOutput: "3" },
        { input: "[[1,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.5 ? 3 : 9;
        const dominoes = Array.from({ length: n }, () => [ri(rng, 1, hi), ri(rng, 1, hi)]);
        return { input: fmtIntMat(dominoes), expectedOutput: String(ref(dominoes)) };
      },
      solutions: {
        python: `def numEquivDominoPairs(dominoes) -> int:\n    count = {}\n    total = 0\n    for a, b in dominoes:\n        key = a * 10 + b if a < b else b * 10 + a\n        total += count.get(key, 0)\n        count[key] = count.get(key, 0) + 1\n    return total`,
        javascript: `var numEquivDominoPairs = function(dominoes) {\n    const count = new Map();\n    let total = 0;\n    for (let i = 0; i < dominoes.length; i++) {\n        const a = dominoes[i][0], b = dominoes[i][1];\n        const key = a < b ? a * 10 + b : b * 10 + a;\n        total += count.get(key) || 0;\n        count.set(key, (count.get(key) || 0) + 1);\n    }\n    return total;\n};`,
              typescript: `function numEquivDominoPairs(dominoes: number[][]): number {\n    var count: { [key: string]: number } = {};\n    var total = 0;\n    for (var i = 0; i < dominoes.length; i++) {\n        var a = dominoes[i][0];\n        var b = dominoes[i][1];\n        var key = String(a < b ? a * 10 + b : b * 10 + a);\n        var seen = count[key] === undefined ? 0 : count[key];\n        total += seen;\n        count[key] = seen + 1;\n    }\n    return total;\n}`,
              java: `public static int numEquivDominoPairs(int[][] dominoes) {\n    int[] count = new int[100];\n    int total = 0;\n    for (int[] d : dominoes) {\n        int key = d[0] < d[1] ? d[0] * 10 + d[1] : d[1] * 10 + d[0];\n        total += count[key];\n        count[key]++;\n    }\n    return total;\n}`,
              cpp: `int numEquivDominoPairs(vector<vector<int>>& dominoes) {\n    int count[100] = {0};\n    int total = 0;\n    for (vector<int>& d : dominoes) {\n        int key = d[0] < d[1] ? d[0] * 10 + d[1] : d[1] * 10 + d[0];\n        total += count[key];\n        count[key]++;\n    }\n    return total;\n}`,
              c: `int numEquivDominoPairs(int** dominoes, int dominoesSize, int* dominoesColSize) {\n    int count[100] = {0};\n    int total = 0;\n    for (int i = 0; i < dominoesSize; i++) {\n        int a = dominoes[i][0], b = dominoes[i][1];\n        int key = a < b ? a * 10 + b : b * 10 + a;\n        total += count[key];\n        count[key]++;\n    }\n    return total;\n}`,
              csharp: `public static int NumEquivDominoPairs(int[][] dominoes)\n{\n    int[] count = new int[100];\n    int total = 0;\n    foreach (int[] d in dominoes)\n    {\n        int key = d[0] < d[1] ? d[0] * 10 + d[1] : d[1] * 10 + d[0];\n        total += count[key];\n        count[key]++;\n    }\n    return total;\n}`,
              go: `func numEquivDominoPairs(dominoes [][]int) int {\n	var count [100]int\n	total := 0\n	for _, d := range dominoes {\n		key := d[0]*10 + d[1]\n		if d[1] < d[0] {\n			key = d[1]*10 + d[0]\n		}\n		total += count[key]\n		count[key]++\n	}\n	return total\n}`,
              kotlin: `fun numEquivDominoPairs(dominoes: Array<IntArray>): Int {\n    val count = IntArray(100)\n    var total = 0\n    for (d in dominoes) {\n        val key = if (d[0] < d[1]) d[0] * 10 + d[1] else d[1] * 10 + d[0]\n        total += count[key]\n        count[key]++\n    }\n    return total\n}`,
              swift: `func numEquivDominoPairs(_ dominoes: [[Int]]) -> Int {\n    var count = [Int](repeating: 0, count: 100)\n    var total = 0\n    for d in dominoes {\n        let key = d[0] < d[1] ? d[0] * 10 + d[1] : d[1] * 10 + d[0]\n        total += count[key]\n        count[key] += 1\n    }\n    return total\n}`,
              rust: `fn numEquivDominoPairs(dominoes: Vec<Vec<i32>>) -> i32 {\n    let mut count = [0i32; 100];\n    let mut total = 0;\n    for d in dominoes.iter() {\n        let key = if d[0] < d[1] { d[0] * 10 + d[1] } else { d[1] * 10 + d[0] } as usize;\n        total += count[key];\n        count[key] += 1;\n    }\n    total\n}`,
              php: `function numEquivDominoPairs($dominoes) {\n    $count = array_fill(0, 100, 0);\n    $total = 0;\n    foreach ($dominoes as $d) {\n        $key = $d[0] < $d[1] ? $d[0] * 10 + $d[1] : $d[1] * 10 + $d[0];\n        $total += $count[$key];\n        $count[$key]++;\n    }\n    return $total;\n}`,
              ruby: `def numEquivDominoPairs(dominoes)\n  count = Array.new(100, 0)\n  total = 0\n  dominoes.each do |d|\n    key = d[0] < d[1] ? d[0] * 10 + d[1] : d[1] * 10 + d[0]\n    total += count[key]\n    count[key] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Sort the Matrix Diagonally ──────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length;
      const groups = new Map<number, number[]>();
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          const key = r - c;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(mat[r][c]);
        }
      }
      groups.forEach((arr) => arr.sort((a, b) => a - b));
      const cursor = new Map<number, number>();
      const out: number[][] = [];
      for (let r = 0; r < m; r++) {
        const row: number[] = [];
        for (let c = 0; c < n; c++) {
          const key = r - c;
          const idx = cursor.get(key) ?? 0;
          row.push(groups.get(key)![idx]);
          cursor.set(key, idx + 1);
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "sort-the-matrix-diagonally",
      title: "Sort the Matrix Diagonally",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "diagonalSort", params: [{ name: "mat", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "A **matrix diagonal** is a run of cells starting on the top row or the leftmost column and going down-right to the edge of the matrix.\n\nGiven an `m × n` matrix `mat`, sort each diagonal in ascending order and return the result.",
        [
          { in: "mat = [[3,3,1,1],[2,2,1,2],[1,1,1,2]]", out: "[[1,1,1,1],[1,2,2,2],[1,2,3,3]]" },
          { in: "mat = [[2,1],[1,2]]", out: "[[2,1],[1,2]]", note: "Each diagonal here has at most one out-of-place element." },
          { in: "mat = [[9]]", out: "[[9]]" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "1 <= mat[i][j] <= 100"]),
      hints: [
        "Cells on the same down-right diagonal share the value `r - c`. Bucket by it.",
        "Sort each bucket, then walk the matrix again writing the sorted values back in order.",
        "Keep a per-diagonal cursor so each bucket is consumed from front to back.",
      ],
      examples: [
        { input: "[[3,3,1,1],[2,2,1,2],[1,1,1,2]]", expectedOutput: "[[1,1,1,1],[1,2,2,2],[1,2,3,3]]" },
        { input: "[[2,1],[1,2]]", expectedOutput: "[[2,1],[1,2]]" },
        { input: "[[9]]", expectedOutput: "[[9]]" },
      ],
      gen: (rng: Rng) => {
        const mat = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), 1, rng() < 0.5 ? 5 : 100);
        return { input: fmtIntMat(mat), expectedOutput: fmtIntMat(ref(mat)) };
      },
      solutions: {
        python: `def diagonalSort(mat):\n    m, n = len(mat), len(mat[0])\n    groups = {}\n    for r in range(m):\n        for c in range(n):\n            groups.setdefault(r - c, []).append(mat[r][c])\n    for key in groups:\n        groups[key].sort()\n    cursor = {}\n    out = []\n    for r in range(m):\n        row = []\n        for c in range(n):\n            key = r - c\n            idx = cursor.get(key, 0)\n            row.append(groups[key][idx])\n            cursor[key] = idx + 1\n        out.append(row)\n    return out`,
        javascript: `var diagonalSort = function(mat) {\n    const m = mat.length, n = mat[0].length;\n    const groups = new Map();\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            const key = r - c;\n            if (!groups.has(key)) groups.set(key, []);\n            groups.get(key).push(mat[r][c]);\n        }\n    }\n    groups.forEach(function(arr) { arr.sort(function(a, b) { return a - b; }); });\n    const cursor = new Map();\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) {\n            const key = r - c;\n            const idx = cursor.get(key) || 0;\n            row.push(groups.get(key)[idx]);\n            cursor.set(key, idx + 1);\n        }\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function diagonalSort(mat: number[][]): number[][] {\n    var m = mat.length;\n    var n = mat[0].length;\n    var groups: { [key: string]: number[] } = {};\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            var key = String(r - c);\n            if (groups[key] === undefined) groups[key] = [];\n            groups[key].push(mat[r][c]);\n        }\n    }\n    for (var g in groups) {\n        groups[g].sort(function (a, b) { return a - b; });\n    }\n    var cursor: { [key: string]: number } = {};\n    var out: number[][] = [];\n    for (var r2 = 0; r2 < m; r2++) {\n        var row: number[] = [];\n        for (var c2 = 0; c2 < n; c2++) {\n            var key2 = String(r2 - c2);\n            var idx = cursor[key2] === undefined ? 0 : cursor[key2];\n            row.push(groups[key2][idx]);\n            cursor[key2] = idx + 1;\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] diagonalSort(int[][] mat) {\n    int m = mat.length, n = mat[0].length;\n    Map<Integer, List<Integer>> groups = new HashMap<>();\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            groups.computeIfAbsent(r - c, x -> new ArrayList<>()).add(mat[r][c]);\n        }\n    }\n    for (List<Integer> g : groups.values()) Collections.sort(g);\n    Map<Integer, Integer> cursor = new HashMap<>();\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int key = r - c;\n            int idx = cursor.getOrDefault(key, 0);\n            out[r][c] = groups.get(key).get(idx);\n            cursor.put(key, idx + 1);\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> diagonalSort(vector<vector<int>>& mat) {\n    int m = (int) mat.size(), n = (int) mat[0].size();\n    map<int, vector<int>> groups;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) groups[r - c].push_back(mat[r][c]);\n    }\n    for (auto& kv : groups) sort(kv.second.begin(), kv.second.end());\n    map<int, int> cursor;\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int key = r - c;\n            out[r][c] = groups[key][cursor[key]];\n            cursor[key]++;\n        }\n    }\n    return out;\n}`,
              c: `int** diagonalSort(int** mat, int matSize, int* matColSize, int* returnSize, int** returnColumnSizes) {\n    int m = matSize, n = matColSize[0];\n    int total = m + n;\n    int** groups = (int**) malloc(sizeof(int*) * total);\n    int* lens = (int*) calloc(total, sizeof(int));\n    int* cursor = (int*) calloc(total, sizeof(int));\n    for (int i = 0; i < total; i++) groups[i] = (int*) malloc(sizeof(int) * (m > n ? m : n));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int key = r - c + n;\n            groups[key][lens[key]++] = mat[r][c];\n        }\n    }\n    for (int g = 0; g < total; g++) {\n        for (int i = 1; i < lens[g]; i++) {\n            int keyVal = groups[g][i];\n            int j = i - 1;\n            while (j >= 0 && groups[g][j] > keyVal) { groups[g][j + 1] = groups[g][j]; j--; }\n            groups[g][j + 1] = keyVal;\n        }\n    }\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) {\n            int key = r - c + n;\n            out[r][c] = groups[key][cursor[key]++];\n        }\n    }\n    for (int i = 0; i < total; i++) free(groups[i]);\n    free(groups);\n    free(lens);\n    free(cursor);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] DiagonalSort(int[][] mat)\n{\n    int m = mat.Length, n = mat[0].Length;\n    var groups = new Dictionary<int, List<int>>();\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            int key = r - c;\n            if (!groups.ContainsKey(key)) groups[key] = new List<int>();\n            groups[key].Add(mat[r][c]);\n        }\n    }\n    foreach (var g in groups.Values) g.Sort();\n    var cursor = new Dictionary<int, int>();\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++)\n        {\n            int key = r - c;\n            int idx = cursor.ContainsKey(key) ? cursor[key] : 0;\n            out_[r][c] = groups[key][idx];\n            cursor[key] = idx + 1;\n        }\n    }\n    return out_;\n}`,
              go: `func diagonalSort(mat [][]int) [][]int {\n	m, n := len(mat), len(mat[0])\n	groups := make(map[int][]int)\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			groups[r-c] = append(groups[r-c], mat[r][c])\n		}\n	}\n	for key := range groups {\n		sort.Ints(groups[key])\n	}\n	cursor := make(map[int]int)\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			key := r - c\n			out[r][c] = groups[key][cursor[key]]\n			cursor[key]++\n		}\n	}\n	return out\n}`,
              kotlin: `fun diagonalSort(mat: Array<IntArray>): Array<IntArray> {\n    val m = mat.size\n    val n = mat[0].size\n    val groups = HashMap<Int, ArrayList<Int>>()\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            groups.getOrPut(r - c) { ArrayList() }.add(mat[r][c])\n        }\n    }\n    for (g in groups.values) g.sort()\n    val cursor = HashMap<Int, Int>()\n    val out = Array(m) { IntArray(n) }\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            val key = r - c\n            val idx = cursor[key] ?: 0\n            out[r][c] = groups[key]!![idx]\n            cursor[key] = idx + 1\n        }\n    }\n    return out\n}`,
              swift: `func diagonalSort(_ mat: [[Int]]) -> [[Int]] {\n    let m = mat.count\n    let n = mat[0].count\n    var groups: [Int: [Int]] = [:]\n    for r in 0..<m {\n        for c in 0..<n {\n            groups[r - c, default: []].append(mat[r][c])\n        }\n    }\n    for key in groups.keys {\n        groups[key]!.sort()\n    }\n    var cursor: [Int: Int] = [:]\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for r in 0..<m {\n        for c in 0..<n {\n            let key = r - c\n            let idx = cursor[key] ?? 0\n            out[r][c] = groups[key]![idx]\n            cursor[key] = idx + 1\n        }\n    }\n    return out\n}`,
              rust: `fn diagonalSort(mat: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    use std::collections::HashMap;\n    let m = mat.len();\n    let n = mat[0].len();\n    let mut groups: HashMap<i32, Vec<i32>> = HashMap::new();\n    for r in 0..m {\n        for c in 0..n {\n            groups.entry(r as i32 - c as i32).or_insert_with(Vec::new).push(mat[r][c]);\n        }\n    }\n    for (_, g) in groups.iter_mut() {\n        g.sort();\n    }\n    let mut cursor: HashMap<i32, usize> = HashMap::new();\n    let mut out = vec![vec![0i32; n]; m];\n    for r in 0..m {\n        for c in 0..n {\n            let key = r as i32 - c as i32;\n            let idx = *cursor.get(&key).unwrap_or(&0);\n            out[r][c] = groups[&key][idx];\n            cursor.insert(key, idx + 1);\n        }\n    }\n    out\n}`,
              php: `function diagonalSort($mat) {\n    $m = count($mat);\n    $n = count($mat[0]);\n    $groups = array();\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            $key = $r - $c;\n            if (!isset($groups[$key])) $groups[$key] = array();\n            $groups[$key][] = $mat[$r][$c];\n        }\n    }\n    foreach ($groups as $key => $g) {\n        sort($g);\n        $groups[$key] = $g;\n    }\n    $cursor = array();\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $row = array();\n        for ($c = 0; $c < $n; $c++) {\n            $key = $r - $c;\n            $idx = isset($cursor[$key]) ? $cursor[$key] : 0;\n            $row[] = $groups[$key][$idx];\n            $cursor[$key] = $idx + 1;\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def diagonalSort(mat)\n  m = mat.length\n  n = mat[0].length\n  groups = Hash.new { |h, k| h[k] = [] }\n  (0...m).each do |r|\n    (0...n).each { |c| groups[r - c] << mat[r][c] }\n  end\n  groups.each_value(&:sort!)\n  cursor = Hash.new(0)\n  (0...m).map do |r|\n    (0...n).map do |c|\n      key = r - c\n      value = groups[key][cursor[key]]\n      cursor[key] += 1\n      value\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Minimum Path Sum ────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const dp = grid.map((row) => row.slice());
      for (let c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];
      for (let r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];
      for (let r = 1; r < m; r++) {
        for (let c = 1; c < n; c++) dp[r][c] += Math.min(dp[r - 1][c], dp[r][c - 1]);
      }
      return dp[m - 1][n - 1];
    };
    return {
      slug: "minimum-path-sum",
      title: "Minimum Path Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google", "Microsoft", "Goldman Sachs"],
      signature: { funcName: "minPathSum", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m × n` grid of non-negative numbers, find a path from the top-left corner to the bottom-right corner that minimises the sum of the numbers along it.\n\nYou may only move **down** or **right** at each step. Return that minimum sum.",
        [
          { in: "grid = [[1,3,1],[1,5,1],[4,2,1]]", out: "7", note: "The path 1 → 3 → 1 → 1 → 1 sums to 7." },
          { in: "grid = [[1,2,3],[4,5,6]]", out: "12" },
          { in: "grid = [[5]]", out: "5" },
        ],
        ["1 <= grid.length, grid[i].length <= 8", "0 <= grid[i][j] <= 200"]),
      hints: [
        "A cell is reachable only from above or from the left, so its best cost is its own value plus the cheaper of those two.",
        "The first row and first column have exactly one way in — fill them as running sums first.",
        "You can overwrite the grid in place, since every cell is read only by cells below and to the right.",
      ],
      examples: [
        { input: "[[1,3,1],[1,5,1],[4,2,1]]", expectedOutput: "7" },
        { input: "[[1,2,3],[4,5,6]]", expectedOutput: "12" },
        { input: "[[5]]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const grid = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), 0, 200);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def minPathSum(grid) -> int:\n    m, n = len(grid), len(grid[0])\n    dp = [row[:] for row in grid]\n    for c in range(1, n):\n        dp[0][c] += dp[0][c - 1]\n    for r in range(1, m):\n        dp[r][0] += dp[r - 1][0]\n    for r in range(1, m):\n        for c in range(1, n):\n            dp[r][c] += min(dp[r - 1][c], dp[r][c - 1])\n    return dp[m - 1][n - 1]`,
        javascript: `var minPathSum = function(grid) {\n    const m = grid.length, n = grid[0].length;\n    const dp = [];\n    for (let r = 0; r < m; r++) dp.push(grid[r].slice());\n    for (let c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (let r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (let r = 1; r < m; r++) {\n        for (let c = 1; c < n; c++) {\n            dp[r][c] += Math.min(dp[r - 1][c], dp[r][c - 1]);\n        }\n    }\n    return dp[m - 1][n - 1];\n};`,
              typescript: `function minPathSum(grid: number[][]): number {\n    var m = grid.length;\n    var n = grid[0].length;\n    var dp: number[][] = [];\n    for (var i = 0; i < m; i++) dp.push(grid[i].slice());\n    for (var c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (var r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (var r2 = 1; r2 < m; r2++) {\n        for (var c2 = 1; c2 < n; c2++) {\n            dp[r2][c2] += Math.min(dp[r2 - 1][c2], dp[r2][c2 - 1]);\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              java: `public static int minPathSum(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[][] dp = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) dp[r][c] = grid[r][c];\n    }\n    for (int c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (int r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (int r = 1; r < m; r++) {\n        for (int c = 1; c < n; c++) {\n            dp[r][c] += Math.min(dp[r - 1][c], dp[r][c - 1]);\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              cpp: `int minPathSum(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<int>> dp = grid;\n    for (int c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (int r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (int r = 1; r < m; r++) {\n        for (int c = 1; c < n; c++) {\n            dp[r][c] += min(dp[r - 1][c], dp[r][c - 1]);\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              c: `int minPathSum(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int** dp = (int**) malloc(sizeof(int*) * m);\n    for (int r = 0; r < m; r++) {\n        dp[r] = (int*) malloc(sizeof(int) * n);\n        for (int c = 0; c < n; c++) dp[r][c] = grid[r][c];\n    }\n    for (int c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (int r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (int r = 1; r < m; r++) {\n        for (int c = 1; c < n; c++) {\n            int up = dp[r - 1][c], leftV = dp[r][c - 1];\n            dp[r][c] += up < leftV ? up : leftV;\n        }\n    }\n    int result = dp[m - 1][n - 1];\n    for (int r = 0; r < m; r++) free(dp[r]);\n    free(dp);\n    return result;\n}`,
              csharp: `public static int MinPathSum(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int[][] dp = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        dp[r] = new int[n];\n        for (int c = 0; c < n; c++) dp[r][c] = grid[r][c];\n    }\n    for (int c = 1; c < n; c++) dp[0][c] += dp[0][c - 1];\n    for (int r = 1; r < m; r++) dp[r][0] += dp[r - 1][0];\n    for (int r = 1; r < m; r++)\n    {\n        for (int c = 1; c < n; c++)\n        {\n            dp[r][c] += Math.Min(dp[r - 1][c], dp[r][c - 1]);\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              go: `func minPathSum(grid [][]int) int {\n	m, n := len(grid), len(grid[0])\n	dp := make([][]int, m)\n	for r := 0; r < m; r++ {\n		dp[r] = make([]int, n)\n		copy(dp[r], grid[r])\n	}\n	for c := 1; c < n; c++ {\n		dp[0][c] += dp[0][c-1]\n	}\n	for r := 1; r < m; r++ {\n		dp[r][0] += dp[r-1][0]\n	}\n	for r := 1; r < m; r++ {\n		for c := 1; c < n; c++ {\n			up, leftV := dp[r-1][c], dp[r][c-1]\n			if up < leftV {\n				dp[r][c] += up\n			} else {\n				dp[r][c] += leftV\n			}\n		}\n	}\n	return dp[m-1][n-1]\n}`,
              kotlin: `fun minPathSum(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val dp = Array(m) { grid[it].copyOf() }\n    for (c in 1 until n) dp[0][c] += dp[0][c - 1]\n    for (r in 1 until m) dp[r][0] += dp[r - 1][0]\n    for (r in 1 until m) {\n        for (c in 1 until n) {\n            dp[r][c] += Math.min(dp[r - 1][c], dp[r][c - 1])\n        }\n    }\n    return dp[m - 1][n - 1]\n}`,
              swift: `func minPathSum(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var dp = grid\n    for c in 1..<max(n, 1) { dp[0][c] += dp[0][c - 1] }\n    for r in 1..<max(m, 1) { dp[r][0] += dp[r - 1][0] }\n    if m > 1 && n > 1 {\n        for r in 1..<m {\n            for c in 1..<n {\n                dp[r][c] += min(dp[r - 1][c], dp[r][c - 1])\n            }\n        }\n    }\n    return dp[m - 1][n - 1]\n}`,
              rust: `fn minPathSum(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut dp = grid.clone();\n    for c in 1..n {\n        dp[0][c] += dp[0][c - 1];\n    }\n    for r in 1..m {\n        dp[r][0] += dp[r - 1][0];\n    }\n    for r in 1..m {\n        for c in 1..n {\n            let up = dp[r - 1][c];\n            let left = dp[r][c - 1];\n            dp[r][c] += if up < left { up } else { left };\n        }\n    }\n    dp[m - 1][n - 1]\n}`,
              php: `function minPathSum($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dp = $grid;\n    for ($c = 1; $c < $n; $c++) $dp[0][$c] += $dp[0][$c - 1];\n    for ($r = 1; $r < $m; $r++) $dp[$r][0] += $dp[$r - 1][0];\n    for ($r = 1; $r < $m; $r++) {\n        for ($c = 1; $c < $n; $c++) {\n            $dp[$r][$c] += min($dp[$r - 1][$c], $dp[$r][$c - 1]);\n        }\n    }\n    return $dp[$m - 1][$n - 1];\n}`,
              ruby: `def minPathSum(grid)\n  m = grid.length\n  n = grid[0].length\n  dp = grid.map(&:dup)\n  (1...n).each { |c| dp[0][c] += dp[0][c - 1] }\n  (1...m).each { |r| dp[r][0] += dp[r - 1][0] }\n  (1...m).each do |r|\n    (1...n).each do |c|\n      dp[r][c] += [dp[r - 1][c], dp[r][c - 1]].min\n    end\n  end\n  dp[m - 1][n - 1]\nend`,
      },
    };
  })(),

  // ── Unique Paths II ─────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      if (grid[0][0] === 1) return 0;
      const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
      dp[0][0] = 1;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
          if (r > 0) dp[r][c] += dp[r - 1][c];
          if (c > 0) dp[r][c] += dp[r][c - 1];
        }
      }
      return dp[m - 1][n - 1];
    };
    return {
      slug: "unique-paths-ii",
      title: "Unique Paths II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Microsoft", "Google", "Adobe"],
      signature: { funcName: "uniquePathsWithObstacles", params: [{ name: "obstacleGrid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A robot starts at the top-left corner of an `m × n` grid and wants to reach the bottom-right corner, moving only **down** or **right**.\n\nSome cells contain obstacles, marked `1`; empty cells are `0`. Return the number of distinct paths that avoid every obstacle. If the start or the finish is blocked, the answer is 0.",
        [
          { in: "obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]", out: "2" },
          { in: "obstacleGrid = [[0,1],[0,0]]", out: "1" },
          { in: "obstacleGrid = [[1]]", out: "0", note: "The starting cell itself is blocked." },
        ],
        ["1 <= obstacleGrid.length, obstacleGrid[i].length <= 8", "obstacleGrid[i][j] is 0 or 1.", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Without obstacles, the count of paths to a cell is the sum of the counts above it and to its left.",
        "An obstacle sets that cell's count to 0 — nothing can pass through it.",
        "Seed the start with 1, and remember the start itself may be blocked.",
      ],
      examples: [
        { input: "[[0,0,0],[0,1,0],[0,0,0]]", expectedOutput: "2" },
        { input: "[[0,1],[0,0]]", expectedOutput: "1" },
        { input: "[[1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.25 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def uniquePathsWithObstacles(obstacleGrid) -> int:\n    m, n = len(obstacleGrid), len(obstacleGrid[0])\n    if obstacleGrid[0][0] == 1:\n        return 0\n    dp = [[0] * n for _ in range(m)]\n    dp[0][0] = 1\n    for r in range(m):\n        for c in range(n):\n            if obstacleGrid[r][c] == 1:\n                dp[r][c] = 0\n                continue\n            if r > 0:\n                dp[r][c] += dp[r - 1][c]\n            if c > 0:\n                dp[r][c] += dp[r][c - 1]\n    return dp[m - 1][n - 1]`,
        javascript: `var uniquePathsWithObstacles = function(obstacleGrid) {\n    const m = obstacleGrid.length, n = obstacleGrid[0].length;\n    if (obstacleGrid[0][0] === 1) return 0;\n    const dp = [];\n    for (let r = 0; r < m; r++) dp.push(new Array(n).fill(0));\n    dp[0][0] = 1;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (obstacleGrid[r][c] === 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    return dp[m - 1][n - 1];\n};`,
              typescript: `function uniquePathsWithObstacles(obstacleGrid: number[][]): number {\n    var m = obstacleGrid.length;\n    var n = obstacleGrid[0].length;\n    if (obstacleGrid[0][0] === 1) return 0;\n    var dp: number[][] = [];\n    for (var i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    dp[0][0] = 1;\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            if (obstacleGrid[r][c] === 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              java: `public static int uniquePathsWithObstacles(int[][] obstacleGrid) {\n    int m = obstacleGrid.length, n = obstacleGrid[0].length;\n    if (obstacleGrid[0][0] == 1) return 0;\n    int[][] dp = new int[m][n];\n    dp[0][0] = 1;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (obstacleGrid[r][c] == 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              cpp: `int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {\n    int m = (int) obstacleGrid.size(), n = (int) obstacleGrid[0].size();\n    if (obstacleGrid[0][0] == 1) return 0;\n    vector<vector<int>> dp(m, vector<int>(n, 0));\n    dp[0][0] = 1;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (obstacleGrid[r][c] == 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              c: `int uniquePathsWithObstacles(int** obstacleGrid, int obstacleGridSize, int* obstacleGridColSize) {\n    int m = obstacleGridSize, n = obstacleGridColSize[0];\n    if (obstacleGrid[0][0] == 1) return 0;\n    int** dp = (int**) malloc(sizeof(int*) * m);\n    for (int r = 0; r < m; r++) dp[r] = (int*) calloc(n, sizeof(int));\n    dp[0][0] = 1;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (obstacleGrid[r][c] == 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    int result = dp[m - 1][n - 1];\n    for (int r = 0; r < m; r++) free(dp[r]);\n    free(dp);\n    return result;\n}`,
              csharp: `public static int UniquePathsWithObstacles(int[][] obstacleGrid)\n{\n    int m = obstacleGrid.Length, n = obstacleGrid[0].Length;\n    if (obstacleGrid[0][0] == 1) return 0;\n    int[][] dp = new int[m][];\n    for (int r = 0; r < m; r++) dp[r] = new int[n];\n    dp[0][0] = 1;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (obstacleGrid[r][c] == 1) { dp[r][c] = 0; continue; }\n            if (r > 0) dp[r][c] += dp[r - 1][c];\n            if (c > 0) dp[r][c] += dp[r][c - 1];\n        }\n    }\n    return dp[m - 1][n - 1];\n}`,
              go: `func uniquePathsWithObstacles(obstacleGrid [][]int) int {\n	m, n := len(obstacleGrid), len(obstacleGrid[0])\n	if obstacleGrid[0][0] == 1 {\n		return 0\n	}\n	dp := make([][]int, m)\n	for r := range dp {\n		dp[r] = make([]int, n)\n	}\n	dp[0][0] = 1\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if obstacleGrid[r][c] == 1 {\n				dp[r][c] = 0\n				continue\n			}\n			if r > 0 {\n				dp[r][c] += dp[r-1][c]\n			}\n			if c > 0 {\n				dp[r][c] += dp[r][c-1]\n			}\n		}\n	}\n	return dp[m-1][n-1]\n}`,
              kotlin: `fun uniquePathsWithObstacles(obstacleGrid: Array<IntArray>): Int {\n    val m = obstacleGrid.size\n    val n = obstacleGrid[0].size\n    if (obstacleGrid[0][0] == 1) return 0\n    val dp = Array(m) { IntArray(n) }\n    dp[0][0] = 1\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (obstacleGrid[r][c] == 1) {\n                dp[r][c] = 0\n                continue\n            }\n            if (r > 0) dp[r][c] += dp[r - 1][c]\n            if (c > 0) dp[r][c] += dp[r][c - 1]\n        }\n    }\n    return dp[m - 1][n - 1]\n}`,
              swift: `func uniquePathsWithObstacles(_ obstacleGrid: [[Int]]) -> Int {\n    let m = obstacleGrid.count\n    let n = obstacleGrid[0].count\n    if obstacleGrid[0][0] == 1 { return 0 }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    dp[0][0] = 1\n    for r in 0..<m {\n        for c in 0..<n {\n            if obstacleGrid[r][c] == 1 {\n                dp[r][c] = 0\n                continue\n            }\n            if r > 0 { dp[r][c] += dp[r - 1][c] }\n            if c > 0 { dp[r][c] += dp[r][c - 1] }\n        }\n    }\n    return dp[m - 1][n - 1]\n}`,
              rust: `fn uniquePathsWithObstacles(obstacleGrid: Vec<Vec<i32>>) -> i32 {\n    let m = obstacleGrid.len();\n    let n = obstacleGrid[0].len();\n    if obstacleGrid[0][0] == 1 {\n        return 0;\n    }\n    let mut dp = vec![vec![0i32; n]; m];\n    dp[0][0] = 1;\n    for r in 0..m {\n        for c in 0..n {\n            if obstacleGrid[r][c] == 1 {\n                dp[r][c] = 0;\n                continue;\n            }\n            if r > 0 {\n                dp[r][c] += dp[r - 1][c];\n            }\n            if c > 0 {\n                dp[r][c] += dp[r][c - 1];\n            }\n        }\n    }\n    dp[m - 1][n - 1]\n}`,
              php: `function uniquePathsWithObstacles($obstacleGrid) {\n    $m = count($obstacleGrid);\n    $n = count($obstacleGrid[0]);\n    if ($obstacleGrid[0][0] === 1) return 0;\n    $dp = array();\n    for ($i = 0; $i < $m; $i++) $dp[] = array_fill(0, $n, 0);\n    $dp[0][0] = 1;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($obstacleGrid[$r][$c] === 1) { $dp[$r][$c] = 0; continue; }\n            if ($r > 0) $dp[$r][$c] += $dp[$r - 1][$c];\n            if ($c > 0) $dp[$r][$c] += $dp[$r][$c - 1];\n        }\n    }\n    return $dp[$m - 1][$n - 1];\n}`,
              ruby: `def uniquePathsWithObstacles(obstacleGrid)\n  m = obstacleGrid.length\n  n = obstacleGrid[0].length\n  return 0 if obstacleGrid[0][0] == 1\n  dp = Array.new(m) { Array.new(n, 0) }\n  dp[0][0] = 1\n  (0...m).each do |r|\n    (0...n).each do |c|\n      if obstacleGrid[r][c] == 1\n        dp[r][c] = 0\n        next\n      end\n      dp[r][c] += dp[r - 1][c] if r > 0\n      dp[r][c] += dp[r][c - 1] if c > 0\n    end\n  end\n  dp[m - 1][n - 1]\nend`,
      },
    };
  })(),

  // ── Maximal Square ──────────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
      let best = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (matrix[r][c] === 1) {
            dp[r][c] = r === 0 || c === 0 ? 1 : Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1;
            if (dp[r][c] > best) best = dp[r][c];
          }
        }
      }
      return best * best;
    };
    return {
      slug: "maximal-square",
      title: "Maximal Square",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google", "Meta", "Apple", "Airbnb"],
      signature: { funcName: "maximalSquare", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m × n` binary matrix filled with `0`s and `1`s, find the largest square made entirely of `1`s and return its **area**.",
        [
          { in: "matrix = [[1,0,1,0,0],[1,0,1,1,1],[1,1,1,1,1],[1,0,0,1,0]]", out: "4" },
          { in: "matrix = [[0,1],[1,0]]", out: "1" },
          { in: "matrix = [[0]]", out: "0" },
        ],
        ["1 <= matrix.length, matrix[i].length <= 8", "matrix[i][j] is 0 or 1."]),
      hints: [
        "Let `dp[r][c]` be the side of the largest all-ones square whose **bottom-right corner** is `(r, c)`.",
        "A square of side `k` there requires squares of side `k - 1` ending above, to the left, and up-left — so take the minimum of those three and add one.",
        "The answer is the largest side squared, not the largest side.",
      ],
      examples: [
        { input: "[[1,0,1,0,0],[1,0,1,1,1],[1,1,1,1,1],[1,0,0,1,0]]", expectedOutput: "4" },
        { input: "[[0,1],[1,0]]", expectedOutput: "1" },
        { input: "[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 8), cols = ri(rng, 1, 8);
        const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng() < 0.6 ? 1 : 0)));
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `def maximalSquare(matrix) -> int:\n    m, n = len(matrix), len(matrix[0])\n    dp = [[0] * n for _ in range(m)]\n    best = 0\n    for r in range(m):\n        for c in range(n):\n            if matrix[r][c] == 1:\n                if r == 0 or c == 0:\n                    dp[r][c] = 1\n                else:\n                    dp[r][c] = min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1\n                best = max(best, dp[r][c])\n    return best * best`,
        javascript: `var maximalSquare = function(matrix) {\n    const m = matrix.length, n = matrix[0].length;\n    const dp = [];\n    for (let r = 0; r < m; r++) dp.push(new Array(n).fill(0));\n    let best = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (matrix[r][c] === 1) {\n                if (r === 0 || c === 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1;\n                if (dp[r][c] > best) best = dp[r][c];\n            }\n        }\n    }\n    return best * best;\n};`,
              typescript: `function maximalSquare(matrix: number[][]): number {\n    var m = matrix.length;\n    var n = matrix[0].length;\n    var dp: number[][] = [];\n    for (var i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    var best = 0;\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            if (matrix[r][c] === 1) {\n                if (r === 0 || c === 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], Math.min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                if (dp[r][c] > best) best = dp[r][c];\n            }\n        }\n    }\n    return best * best;\n}`,
              java: `public static int maximalSquare(int[][] matrix) {\n    int m = matrix.length, n = matrix[0].length;\n    int[][] dp = new int[m][n];\n    int best = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], Math.min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                if (dp[r][c] > best) best = dp[r][c];\n            }\n        }\n    }\n    return best * best;\n}`,
              cpp: `int maximalSquare(vector<vector<int>>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<vector<int>> dp(m, vector<int>(n, 0));\n    int best = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = min(dp[r - 1][c], min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                best = max(best, dp[r][c]);\n            }\n        }\n    }\n    return best * best;\n}`,
              c: `int maximalSquare(int** matrix, int matrixSize, int* matrixColSize) {\n    int m = matrixSize, n = matrixColSize[0];\n    int** dp = (int**) malloc(sizeof(int*) * m);\n    for (int r = 0; r < m; r++) dp[r] = (int*) calloc(n, sizeof(int));\n    int best = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) {\n                    dp[r][c] = 1;\n                } else {\n                    int a = dp[r - 1][c], b = dp[r][c - 1], d = dp[r - 1][c - 1];\n                    int smallest = a < b ? a : b;\n                    if (d < smallest) smallest = d;\n                    dp[r][c] = smallest + 1;\n                }\n                if (dp[r][c] > best) best = dp[r][c];\n            }\n        }\n    }\n    for (int r = 0; r < m; r++) free(dp[r]);\n    free(dp);\n    return best * best;\n}`,
              csharp: `public static int MaximalSquare(int[][] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    int[][] dp = new int[m][];\n    for (int r = 0; r < m; r++) dp[r] = new int[n];\n    int best = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (matrix[r][c] == 1)\n            {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = Math.Min(dp[r - 1][c], Math.Min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                if (dp[r][c] > best) best = dp[r][c];\n            }\n        }\n    }\n    return best * best;\n}`,
              go: `func maximalSquare(matrix [][]int) int {\n	m, n := len(matrix), len(matrix[0])\n	dp := make([][]int, m)\n	for r := range dp {\n		dp[r] = make([]int, n)\n	}\n	best := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if matrix[r][c] == 1 {\n				if r == 0 || c == 0 {\n					dp[r][c] = 1\n				} else {\n					smallest := dp[r-1][c]\n					if dp[r][c-1] < smallest {\n						smallest = dp[r][c-1]\n					}\n					if dp[r-1][c-1] < smallest {\n						smallest = dp[r-1][c-1]\n					}\n					dp[r][c] = smallest + 1\n				}\n				if dp[r][c] > best {\n					best = dp[r][c]\n				}\n			}\n		}\n	}\n	return best * best\n}`,
              kotlin: `fun maximalSquare(matrix: Array<IntArray>): Int {\n    val m = matrix.size\n    val n = matrix[0].size\n    val dp = Array(m) { IntArray(n) }\n    var best = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (matrix[r][c] == 1) {\n                dp[r][c] = if (r == 0 || c == 0) 1\n                else minOf(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1\n                if (dp[r][c] > best) best = dp[r][c]\n            }\n        }\n    }\n    return best * best\n}`,
              swift: `func maximalSquare(_ matrix: [[Int]]) -> Int {\n    let m = matrix.count\n    let n = matrix[0].count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    var best = 0\n    for r in 0..<m {\n        for c in 0..<n {\n            if matrix[r][c] == 1 {\n                if r == 0 || c == 0 {\n                    dp[r][c] = 1\n                } else {\n                    dp[r][c] = min(dp[r - 1][c], min(dp[r][c - 1], dp[r - 1][c - 1])) + 1\n                }\n                if dp[r][c] > best { best = dp[r][c] }\n            }\n        }\n    }\n    return best * best\n}`,
              rust: `fn maximalSquare(matrix: Vec<Vec<i32>>) -> i32 {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let mut dp = vec![vec![0i32; n]; m];\n    let mut best = 0;\n    for r in 0..m {\n        for c in 0..n {\n            if matrix[r][c] == 1 {\n                dp[r][c] = if r == 0 || c == 0 {\n                    1\n                } else {\n                    let a = dp[r - 1][c];\n                    let b = dp[r][c - 1];\n                    let d = dp[r - 1][c - 1];\n                    let smallest = if a < b { a } else { b };\n                    let smallest = if d < smallest { d } else { smallest };\n                    smallest + 1\n                };\n                if dp[r][c] > best {\n                    best = dp[r][c];\n                }\n            }\n        }\n    }\n    best * best\n}`,
              php: `function maximalSquare($matrix) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $dp = array();\n    for ($i = 0; $i < $m; $i++) $dp[] = array_fill(0, $n, 0);\n    $best = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($matrix[$r][$c] === 1) {\n                if ($r === 0 || $c === 0) $dp[$r][$c] = 1;\n                else $dp[$r][$c] = min($dp[$r - 1][$c], $dp[$r][$c - 1], $dp[$r - 1][$c - 1]) + 1;\n                if ($dp[$r][$c] > $best) $best = $dp[$r][$c];\n            }\n        }\n    }\n    return $best * $best;\n}`,
              ruby: `def maximalSquare(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  dp = Array.new(m) { Array.new(n, 0) }\n  best = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      next unless matrix[r][c] == 1\n      dp[r][c] = if r == 0 || c == 0\n                   1\n                 else\n                   [dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]].min + 1\n                 end\n      best = dp[r][c] if dp[r][c] > best\n    end\n  end\n  best * best\nend`,
      },
    };
  })(),

  // ── Count Square Submatrices with All Ones ──────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
      let total = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (matrix[r][c] === 1) {
            dp[r][c] = r === 0 || c === 0 ? 1 : Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1;
            total += dp[r][c];
          }
        }
      }
      return total;
    };
    return {
      slug: "count-square-submatrices-with-all-ones",
      title: "Count Square Submatrices with All Ones",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google", "Uber"],
      signature: { funcName: "countSquares", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m × n` matrix of ones and zeros, return how many **square submatrices** consist entirely of ones. Squares of every size count, including 1 × 1.",
        [
          { in: "matrix = [[0,1,1,1],[1,1,1,1],[0,1,1,1]]", out: "15", note: "There are 10 squares of side 1, 4 of side 2 and 1 of side 3." },
          { in: "matrix = [[1,0,1],[1,1,0],[1,1,0]]", out: "7" },
          { in: "matrix = [[1]]", out: "1" },
        ],
        ["1 <= matrix.length, matrix[i].length <= 8", "matrix[i][j] is 0 or 1."]),
      hints: [
        "Reuse the maximal-square recurrence: `dp[r][c]` is the side of the largest all-ones square ending at `(r, c)`.",
        "A cell with `dp[r][c] = k` is the bottom-right corner of exactly `k` squares — one of each side from 1 to k.",
        "So the answer is the **sum** of the whole dp table, not its maximum.",
      ],
      examples: [
        { input: "[[0,1,1,1],[1,1,1,1],[0,1,1,1]]", expectedOutput: "15" },
        { input: "[[1,0,1],[1,1,0],[1,1,0]]", expectedOutput: "7" },
        { input: "[[1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.65 ? 1 : 0)));
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `def countSquares(matrix) -> int:\n    m, n = len(matrix), len(matrix[0])\n    dp = [[0] * n for _ in range(m)]\n    total = 0\n    for r in range(m):\n        for c in range(n):\n            if matrix[r][c] == 1:\n                if r == 0 or c == 0:\n                    dp[r][c] = 1\n                else:\n                    dp[r][c] = min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1\n                total += dp[r][c]\n    return total`,
        javascript: `var countSquares = function(matrix) {\n    const m = matrix.length, n = matrix[0].length;\n    const dp = [];\n    for (let r = 0; r < m; r++) dp.push(new Array(n).fill(0));\n    let total = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (matrix[r][c] === 1) {\n                if (r === 0 || c === 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1;\n                total += dp[r][c];\n            }\n        }\n    }\n    return total;\n};`,
              typescript: `function countSquares(matrix: number[][]): number {\n    var m = matrix.length;\n    var n = matrix[0].length;\n    var dp: number[][] = [];\n    for (var i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    var total = 0;\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            if (matrix[r][c] === 1) {\n                if (r === 0 || c === 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], Math.min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                total += dp[r][c];\n            }\n        }\n    }\n    return total;\n}`,
              java: `public static int countSquares(int[][] matrix) {\n    int m = matrix.length, n = matrix[0].length;\n    int[][] dp = new int[m][n];\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = Math.min(dp[r - 1][c], Math.min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                total += dp[r][c];\n            }\n        }\n    }\n    return total;\n}`,
              cpp: `int countSquares(vector<vector<int>>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<vector<int>> dp(m, vector<int>(n, 0));\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = min(dp[r - 1][c], min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                total += dp[r][c];\n            }\n        }\n    }\n    return total;\n}`,
              c: `int countSquares(int** matrix, int matrixSize, int* matrixColSize) {\n    int m = matrixSize, n = matrixColSize[0];\n    int** dp = (int**) malloc(sizeof(int*) * m);\n    for (int r = 0; r < m; r++) dp[r] = (int*) calloc(n, sizeof(int));\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (matrix[r][c] == 1) {\n                if (r == 0 || c == 0) {\n                    dp[r][c] = 1;\n                } else {\n                    int a = dp[r - 1][c], b = dp[r][c - 1], d = dp[r - 1][c - 1];\n                    int smallest = a < b ? a : b;\n                    if (d < smallest) smallest = d;\n                    dp[r][c] = smallest + 1;\n                }\n                total += dp[r][c];\n            }\n        }\n    }\n    for (int r = 0; r < m; r++) free(dp[r]);\n    free(dp);\n    return total;\n}`,
              csharp: `public static int CountSquares(int[][] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    int[][] dp = new int[m][];\n    for (int r = 0; r < m; r++) dp[r] = new int[n];\n    int total = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (matrix[r][c] == 1)\n            {\n                if (r == 0 || c == 0) dp[r][c] = 1;\n                else dp[r][c] = Math.Min(dp[r - 1][c], Math.Min(dp[r][c - 1], dp[r - 1][c - 1])) + 1;\n                total += dp[r][c];\n            }\n        }\n    }\n    return total;\n}`,
              go: `func countSquares(matrix [][]int) int {\n	m, n := len(matrix), len(matrix[0])\n	dp := make([][]int, m)\n	for r := range dp {\n		dp[r] = make([]int, n)\n	}\n	total := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if matrix[r][c] == 1 {\n				if r == 0 || c == 0 {\n					dp[r][c] = 1\n				} else {\n					smallest := dp[r-1][c]\n					if dp[r][c-1] < smallest {\n						smallest = dp[r][c-1]\n					}\n					if dp[r-1][c-1] < smallest {\n						smallest = dp[r-1][c-1]\n					}\n					dp[r][c] = smallest + 1\n				}\n				total += dp[r][c]\n			}\n		}\n	}\n	return total\n}`,
              kotlin: `fun countSquares(matrix: Array<IntArray>): Int {\n    val m = matrix.size\n    val n = matrix[0].size\n    val dp = Array(m) { IntArray(n) }\n    var total = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (matrix[r][c] == 1) {\n                dp[r][c] = if (r == 0 || c == 0) 1\n                else minOf(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]) + 1\n                total += dp[r][c]\n            }\n        }\n    }\n    return total\n}`,
              swift: `func countSquares(_ matrix: [[Int]]) -> Int {\n    let m = matrix.count\n    let n = matrix[0].count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    var total = 0\n    for r in 0..<m {\n        for c in 0..<n {\n            if matrix[r][c] == 1 {\n                if r == 0 || c == 0 {\n                    dp[r][c] = 1\n                } else {\n                    dp[r][c] = min(dp[r - 1][c], min(dp[r][c - 1], dp[r - 1][c - 1])) + 1\n                }\n                total += dp[r][c]\n            }\n        }\n    }\n    return total\n}`,
              rust: `fn countSquares(matrix: Vec<Vec<i32>>) -> i32 {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let mut dp = vec![vec![0i32; n]; m];\n    let mut total = 0;\n    for r in 0..m {\n        for c in 0..n {\n            if matrix[r][c] == 1 {\n                dp[r][c] = if r == 0 || c == 0 {\n                    1\n                } else {\n                    let a = dp[r - 1][c];\n                    let b = dp[r][c - 1];\n                    let d = dp[r - 1][c - 1];\n                    let smallest = if a < b { a } else { b };\n                    let smallest = if d < smallest { d } else { smallest };\n                    smallest + 1\n                };\n                total += dp[r][c];\n            }\n        }\n    }\n    total\n}`,
              php: `function countSquares($matrix) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $dp = array();\n    for ($i = 0; $i < $m; $i++) $dp[] = array_fill(0, $n, 0);\n    $total = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($matrix[$r][$c] === 1) {\n                if ($r === 0 || $c === 0) $dp[$r][$c] = 1;\n                else $dp[$r][$c] = min($dp[$r - 1][$c], $dp[$r][$c - 1], $dp[$r - 1][$c - 1]) + 1;\n                $total += $dp[$r][$c];\n            }\n        }\n    }\n    return $total;\n}`,
              ruby: `def countSquares(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  dp = Array.new(m) { Array.new(n, 0) }\n  total = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      next unless matrix[r][c] == 1\n      dp[r][c] = if r == 0 || c == 0\n                   1\n                 else\n                   [dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]].min + 1\n                 end\n      total += dp[r][c]\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Pascal's Triangle II ────────────────────────────────────────
  (() => {
    const ref = (rowIndex: number) => {
      const row: number[] = new Array(rowIndex + 1).fill(1);
      for (let i = 1; i <= rowIndex; i++) {
        for (let j = i - 1; j > 0; j--) row[j] += row[j - 1];
      }
      return row;
    };
    return {
      slug: "pascals-triangle-ii",
      title: "Pascal's Triangle II",
      difficulty: "EASY" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Adobe", "TCS"],
      signature: { funcName: "getRow", params: [{ name: "rowIndex", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer `rowIndex`, return the `rowIndex`-th (**0-indexed**) row of Pascal's triangle.\n\nEach number in the triangle is the sum of the two directly above it.",
        [
          { in: "rowIndex = 3", out: "[1,3,3,1]" },
          { in: "rowIndex = 0", out: "[1]" },
          { in: "rowIndex = 4", out: "[1,4,6,4,1]" },
        ],
        ["0 <= rowIndex <= 30", "Every value fits in a signed 32-bit integer."],
        "Can you build the row using only O(rowIndex) extra space?"),
      hints: [
        "Building the whole triangle costs O(n²) space; only the previous row is ever needed.",
        "Update one array in place, walking **right to left** so a slot is read before it is overwritten.",
        "The closed form also works: each entry is the previous one times `(n - i + 1) / i`.",
      ],
      examples: [
        { input: "3", expectedOutput: "[1,3,3,1]" },
        { input: "0", expectedOutput: "[1]" },
        { input: "4", expectedOutput: "[1,4,6,4,1]" },
      ],
      gen: (rng: Rng) => {
        const rowIndex = ri(rng, 0, 30);
        return { input: String(rowIndex), expectedOutput: fmtIntArr(ref(rowIndex)) };
      },
      solutions: {
        python: `def getRow(rowIndex: int):\n    row = [1] * (rowIndex + 1)\n    for i in range(1, rowIndex + 1):\n        for j in range(i - 1, 0, -1):\n            row[j] += row[j - 1]\n    return row`,
        javascript: `var getRow = function(rowIndex) {\n    const row = new Array(rowIndex + 1).fill(1);\n    for (let i = 1; i <= rowIndex; i++) {\n        for (let j = i - 1; j > 0; j--) {\n            row[j] += row[j - 1];\n        }\n    }\n    return row;\n};`,
              typescript: `function getRow(rowIndex: number): number[] {\n    var row: number[] = [];\n    for (var k = 0; k <= rowIndex; k++) row.push(1);\n    for (var i = 1; i <= rowIndex; i++) {\n        for (var j = i - 1; j > 0; j--) row[j] += row[j - 1];\n    }\n    return row;\n}`,
              java: `public static int[] getRow(int rowIndex) {\n    int[] row = new int[rowIndex + 1];\n    Arrays.fill(row, 1);\n    for (int i = 1; i <= rowIndex; i++) {\n        for (int j = i - 1; j > 0; j--) row[j] += row[j - 1];\n    }\n    return row;\n}`,
              cpp: `vector<int> getRow(int rowIndex) {\n    vector<int> row(rowIndex + 1, 1);\n    for (int i = 1; i <= rowIndex; i++) {\n        for (int j = i - 1; j > 0; j--) row[j] += row[j - 1];\n    }\n    return row;\n}`,
              c: `int* getRow(int rowIndex, int* returnSize) {\n    int* row = (int*) malloc(sizeof(int) * (rowIndex + 1));\n    for (int i = 0; i <= rowIndex; i++) row[i] = 1;\n    for (int i = 1; i <= rowIndex; i++) {\n        for (int j = i - 1; j > 0; j--) row[j] += row[j - 1];\n    }\n    *returnSize = rowIndex + 1;\n    return row;\n}`,
              csharp: `public static int[] GetRow(int rowIndex)\n{\n    int[] row = new int[rowIndex + 1];\n    for (int i = 0; i <= rowIndex; i++) row[i] = 1;\n    for (int i = 1; i <= rowIndex; i++)\n    {\n        for (int j = i - 1; j > 0; j--) row[j] += row[j - 1];\n    }\n    return row;\n}`,
              go: `func getRow(rowIndex int) []int {\n	row := make([]int, rowIndex+1)\n	for i := range row {\n		row[i] = 1\n	}\n	for i := 1; i <= rowIndex; i++ {\n		for j := i - 1; j > 0; j-- {\n			row[j] += row[j-1]\n		}\n	}\n	return row\n}`,
              kotlin: `fun getRow(rowIndex: Int): IntArray {\n    val row = IntArray(rowIndex + 1) { 1 }\n    for (i in 1..rowIndex) {\n        for (j in i - 1 downTo 1) row[j] += row[j - 1]\n    }\n    return row\n}`,
              swift: `func getRow(_ rowIndex: Int) -> [Int] {\n    var row = [Int](repeating: 1, count: rowIndex + 1)\n    var i = 1\n    while i <= rowIndex {\n        var j = i - 1\n        while j > 0 {\n            row[j] += row[j - 1]\n            j -= 1\n        }\n        i += 1\n    }\n    return row\n}`,
              rust: `fn getRow(rowIndex: i32) -> Vec<i32> {\n    let n = rowIndex as usize;\n    let mut row = vec![1i32; n + 1];\n    for i in 1..=n {\n        let mut j = i - 1;\n        while j > 0 {\n            row[j] += row[j - 1];\n            j -= 1;\n        }\n    }\n    row\n}`,
              php: `function getRow($rowIndex) {\n    $row = array_fill(0, $rowIndex + 1, 1);\n    for ($i = 1; $i <= $rowIndex; $i++) {\n        for ($j = $i - 1; $j > 0; $j--) $row[$j] += $row[$j - 1];\n    }\n    return $row;\n}`,
              ruby: `def getRow(rowIndex)\n  row = Array.new(rowIndex + 1, 1)\n  (1..rowIndex).each do |i|\n    (i - 1).downto(1) { |j| row[j] += row[j - 1] }\n  end\n  row\nend`,
      },
    };
  })(),

  // ── Game of Life ────────────────────────────────────────────────
  (() => {
    const ref = (board: number[][]) => {
      const m = board.length, n = board[0].length;
      const out: number[][] = [];
      for (let r = 0; r < m; r++) {
        const row: number[] = [];
        for (let c = 0; c < n; c++) {
          let live = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];
            }
          }
          if (board[r][c] === 1) row.push(live === 2 || live === 3 ? 1 : 0);
          else row.push(live === 3 ? 1 : 0);
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "game-of-life",
      title: "Game of Life",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Google", "Meta", "Dropbox", "Microsoft"],
      signature: { funcName: "gameOfLife", params: [{ name: "board", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "The board is an `m × n` grid where each cell is **live** (`1`) or **dead** (`0`). Every cell interacts with its eight neighbours; all cells update **simultaneously** according to four rules:\n\n1. A live cell with fewer than two live neighbours dies.\n2. A live cell with two or three live neighbours lives on.\n3. A live cell with more than three live neighbours dies.\n4. A dead cell with exactly three live neighbours becomes live.\n\nReturn the next state of the board.",
        [
          { in: "board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]", out: "[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]" },
          { in: "board = [[1,1],[1,0]]", out: "[[1,1],[1,1]]" },
          { in: "board = [[0]]", out: "[[0]]" },
        ],
        ["1 <= board.length, board[i].length <= 8", "board[i][j] is 0 or 1."],
        "Can you do it in place? The trap is that an updated cell must not influence its neighbours' updates."),
      hints: [
        "Count each cell's eight live neighbours from the **original** board.",
        "Writing into a fresh board sidesteps the simultaneity problem entirely.",
        "For an in-place version, encode both states in one cell — for instance, 2 for 'was dead, becomes live' — and strip the encoding in a second pass.",
      ],
      examples: [
        { input: "[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]", expectedOutput: "[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]" },
        { input: "[[1,1],[1,0]]", expectedOutput: "[[1,1],[1,1]]" },
        { input: "[[0]]", expectedOutput: "[[0]]" },
      ],
      gen: (rng: Rng) => {
        const board = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), 0, 1);
        return { input: fmtIntMat(board), expectedOutput: fmtIntMat(ref(board)) };
      },
      solutions: {
        python: `def gameOfLife(board):\n    m, n = len(board), len(board[0])\n    out = []\n    for r in range(m):\n        row = []\n        for c in range(n):\n            live = 0\n            for dr in (-1, 0, 1):\n                for dc in (-1, 0, 1):\n                    if dr == 0 and dc == 0:\n                        continue\n                    nr, nc = r + dr, c + dc\n                    if 0 <= nr < m and 0 <= nc < n:\n                        live += board[nr][nc]\n            if board[r][c] == 1:\n                row.append(1 if live in (2, 3) else 0)\n            else:\n                row.append(1 if live == 3 else 0)\n        out.append(row)\n    return out`,
        javascript: `var gameOfLife = function(board) {\n    const m = board.length, n = board[0].length;\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) {\n            let live = 0;\n            for (let dr = -1; dr <= 1; dr++) {\n                for (let dc = -1; dc <= 1; dc++) {\n                    if (dr === 0 && dc === 0) continue;\n                    const nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] === 1) row.push(live === 2 || live === 3 ? 1 : 0);\n            else row.push(live === 3 ? 1 : 0);\n        }\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function gameOfLife(board: number[][]): number[][] {\n    var m = board.length;\n    var n = board[0].length;\n    var out: number[][] = [];\n    for (var r = 0; r < m; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n; c++) {\n            var live = 0;\n            for (var dr = -1; dr <= 1; dr++) {\n                for (var dc = -1; dc <= 1; dc++) {\n                    if (dr === 0 && dc === 0) continue;\n                    var nr = r + dr;\n                    var nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] === 1) row.push(live === 2 || live === 3 ? 1 : 0);\n            else row.push(live === 3 ? 1 : 0);\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] gameOfLife(int[][] board) {\n    int m = board.length, n = board[0].length;\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int live = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    if (dr == 0 && dc == 0) continue;\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] == 1) out[r][c] = (live == 2 || live == 3) ? 1 : 0;\n            else out[r][c] = live == 3 ? 1 : 0;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> gameOfLife(vector<vector<int>>& board) {\n    int m = (int) board.size(), n = (int) board[0].size();\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            int live = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    if (dr == 0 && dc == 0) continue;\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] == 1) out[r][c] = (live == 2 || live == 3) ? 1 : 0;\n            else out[r][c] = live == 3 ? 1 : 0;\n        }\n    }\n    return out;\n}`,
              c: `int** gameOfLife(int** board, int boardSize, int* boardColSize, int* returnSize, int** returnColumnSizes) {\n    int m = boardSize, n = boardColSize[0];\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) {\n            int live = 0;\n            for (int dr = -1; dr <= 1; dr++) {\n                for (int dc = -1; dc <= 1; dc++) {\n                    if (dr == 0 && dc == 0) continue;\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] == 1) out[r][c] = (live == 2 || live == 3) ? 1 : 0;\n            else out[r][c] = live == 3 ? 1 : 0;\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] GameOfLife(int[][] board)\n{\n    int m = board.Length, n = board[0].Length;\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++)\n        {\n            int live = 0;\n            for (int dr = -1; dr <= 1; dr++)\n            {\n                for (int dc = -1; dc <= 1; dc++)\n                {\n                    if (dr == 0 && dc == 0) continue;\n                    int nr = r + dr, nc = c + dc;\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) live += board[nr][nc];\n                }\n            }\n            if (board[r][c] == 1) out_[r][c] = (live == 2 || live == 3) ? 1 : 0;\n            else out_[r][c] = live == 3 ? 1 : 0;\n        }\n    }\n    return out_;\n}`,
              go: `func gameOfLife(board [][]int) [][]int {\n	m, n := len(board), len(board[0])\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			live := 0\n			for dr := -1; dr <= 1; dr++ {\n				for dc := -1; dc <= 1; dc++ {\n					if dr == 0 && dc == 0 {\n						continue\n					}\n					nr, nc := r+dr, c+dc\n					if nr >= 0 && nr < m && nc >= 0 && nc < n {\n						live += board[nr][nc]\n					}\n				}\n			}\n			if board[r][c] == 1 {\n				if live == 2 || live == 3 {\n					out[r][c] = 1\n				}\n			} else if live == 3 {\n				out[r][c] = 1\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun gameOfLife(board: Array<IntArray>): Array<IntArray> {\n    val m = board.size\n    val n = board[0].size\n    val out = Array(m) { IntArray(n) }\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            var live = 0\n            for (dr in -1..1) {\n                for (dc in -1..1) {\n                    if (dr == 0 && dc == 0) continue\n                    val nr = r + dr\n                    val nc = c + dc\n                    if (nr in 0 until m && nc in 0 until n) live += board[nr][nc]\n                }\n            }\n            out[r][c] = if (board[r][c] == 1) {\n                if (live == 2 || live == 3) 1 else 0\n            } else {\n                if (live == 3) 1 else 0\n            }\n        }\n    }\n    return out\n}`,
              swift: `func gameOfLife(_ board: [[Int]]) -> [[Int]] {\n    let m = board.count\n    let n = board[0].count\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for r in 0..<m {\n        for c in 0..<n {\n            var live = 0\n            for dr in -1...1 {\n                for dc in -1...1 {\n                    if dr == 0 && dc == 0 { continue }\n                    let nr = r + dr\n                    let nc = c + dc\n                    if nr >= 0 && nr < m && nc >= 0 && nc < n { live += board[nr][nc] }\n                }\n            }\n            if board[r][c] == 1 {\n                out[r][c] = (live == 2 || live == 3) ? 1 : 0\n            } else {\n                out[r][c] = live == 3 ? 1 : 0\n            }\n        }\n    }\n    return out\n}`,
              rust: `fn gameOfLife(board: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = board.len() as i32;\n    let n = board[0].len() as i32;\n    let mut out = vec![vec![0i32; n as usize]; m as usize];\n    for r in 0..m {\n        for c in 0..n {\n            let mut live = 0;\n            for dr in -1..=1 {\n                for dc in -1..=1 {\n                    if dr == 0 && dc == 0 {\n                        continue;\n                    }\n                    let nr = r + dr;\n                    let nc = c + dc;\n                    if nr >= 0 && nr < m && nc >= 0 && nc < n {\n                        live += board[nr as usize][nc as usize];\n                    }\n                }\n            }\n            let alive = board[r as usize][c as usize] == 1;\n            out[r as usize][c as usize] = if alive {\n                if live == 2 || live == 3 { 1 } else { 0 }\n            } else if live == 3 {\n                1\n            } else {\n                0\n            };\n        }\n    }\n    out\n}`,
              php: `function gameOfLife($board) {\n    $m = count($board);\n    $n = count($board[0]);\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $row = array();\n        for ($c = 0; $c < $n; $c++) {\n            $live = 0;\n            for ($dr = -1; $dr <= 1; $dr++) {\n                for ($dc = -1; $dc <= 1; $dc++) {\n                    if ($dr === 0 && $dc === 0) continue;\n                    $nr = $r + $dr;\n                    $nc = $c + $dc;\n                    if ($nr >= 0 && $nr < $m && $nc >= 0 && $nc < $n) $live += $board[$nr][$nc];\n                }\n            }\n            if ($board[$r][$c] === 1) $row[] = ($live === 2 || $live === 3) ? 1 : 0;\n            else $row[] = $live === 3 ? 1 : 0;\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def gameOfLife(board)\n  m = board.length\n  n = board[0].length\n  (0...m).map do |r|\n    (0...n).map do |c|\n      live = 0\n      (-1..1).each do |dr|\n        (-1..1).each do |dc|\n          next if dr == 0 && dc == 0\n          nr = r + dr\n          nc = c + dc\n          live += board[nr][nc] if nr >= 0 && nr < m && nc >= 0 && nc < n\n        end\n      end\n      if board[r][c] == 1\n        (live == 2 || live == 3) ? 1 : 0\n      else\n        live == 3 ? 1 : 0\n      end\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Surrounded Regions ──────────────────────────────────────────
  (() => {
    const ref = (board: number[][]) => {
      const m = board.length, n = board[0].length;
      const safe: boolean[][] = Array.from({ length: m }, () => new Array(n).fill(false));
      const stack: Array<[number, number]> = [];
      const push = (r: number, c: number) => {
        if (r >= 0 && r < m && c >= 0 && c < n && board[r][c] === 1 && !safe[r][c]) {
          safe[r][c] = true;
          stack.push([r, c]);
        }
      };
      for (let r = 0; r < m; r++) { push(r, 0); push(r, n - 1); }
      for (let c = 0; c < n; c++) { push(0, c); push(m - 1, c); }
      while (stack.length > 0) {
        const [r, c] = stack.pop()!;
        push(r - 1, c); push(r + 1, c); push(r, c - 1); push(r, c + 1);
      }
      return board.map((row, r) => row.map((v, c) => (v === 1 && !safe[r][c] ? 0 : v)));
    };
    return {
      slug: "surrounded-regions",
      title: "Surrounded Regions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "solve", params: [{ name: "board", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `m × n` board where `1` marks an open cell and `0` marks a wall.\n\n**Capture** every region of `1`s that is completely surrounded by `0`s by flipping those cells to `0`. A region is surrounded only if none of its cells touches the border of the board.\n\nReturn the board after the capture.",
        [
          { in: "board = [[0,0,0,0],[0,1,1,0],[0,0,1,0],[0,1,0,0]]", out: "[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,1,0,0]]", note: "The bottom-left 1 touches the border and survives." },
          { in: "board = [[1]]", out: "[[1]]", note: "It is on the border." },
          { in: "board = [[0,0,0],[0,1,0],[0,0,0]]", out: "[[0,0,0],[0,0,0],[0,0,0]]" },
        ],
        ["1 <= board.length, board[i].length <= 8", "board[i][j] is 0 or 1."]),
      hints: [
        "Work backwards: instead of hunting for surrounded regions, find the ones that **escape**.",
        "Flood-fill inward from every `1` on the border and mark everything reachable as safe.",
        "Any `1` left unmarked afterwards is surrounded — flip it.",
      ],
      examples: [
        { input: "[[0,0,0,0],[0,1,1,0],[0,0,1,0],[0,1,0,0]]", expectedOutput: "[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,1,0,0]]" },
        { input: "[[1]]", expectedOutput: "[[1]]" },
        { input: "[[0,0,0],[0,1,0],[0,0,0]]", expectedOutput: "[[0,0,0],[0,0,0],[0,0,0]]" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 8), cols = ri(rng, 1, 8);
        const board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng() < 0.45 ? 1 : 0)));
        return { input: fmtIntMat(board), expectedOutput: fmtIntMat(ref(board)) };
      },
      solutions: {
        python: `def solve(board):\n    m, n = len(board), len(board[0])\n    safe = [[False] * n for _ in range(m)]\n    stack = []\n\n    def push(r, c):\n        if 0 <= r < m and 0 <= c < n and board[r][c] == 1 and not safe[r][c]:\n            safe[r][c] = True\n            stack.append((r, c))\n\n    for r in range(m):\n        push(r, 0)\n        push(r, n - 1)\n    for c in range(n):\n        push(0, c)\n        push(m - 1, c)\n    while stack:\n        r, c = stack.pop()\n        push(r - 1, c)\n        push(r + 1, c)\n        push(r, c - 1)\n        push(r, c + 1)\n    return [[board[r][c] if safe[r][c] else 0 for c in range(n)] for r in range(m)]`,
        javascript: `var solve = function(board) {\n    const m = board.length, n = board[0].length;\n    const safe = [];\n    for (let r = 0; r < m; r++) safe.push(new Array(n).fill(false));\n    const stack = [];\n    const push = function(r, c) {\n        if (r >= 0 && r < m && c >= 0 && c < n && board[r][c] === 1 && !safe[r][c]) {\n            safe[r][c] = true;\n            stack.push([r, c]);\n        }\n    };\n    for (let r = 0; r < m; r++) { push(r, 0); push(r, n - 1); }\n    for (let c = 0; c < n; c++) { push(0, c); push(m - 1, c); }\n    while (stack.length > 0) {\n        const cell = stack.pop();\n        push(cell[0] - 1, cell[1]);\n        push(cell[0] + 1, cell[1]);\n        push(cell[0], cell[1] - 1);\n        push(cell[0], cell[1] + 1);\n    }\n    const out = [];\n    for (let r = 0; r < m; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) row.push(safe[r][c] ? board[r][c] : 0);\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function solve(board: number[][]): number[][] {\n    var m = board.length;\n    var n = board[0].length;\n    var safe: boolean[][] = [];\n    for (var i = 0; i < m; i++) {\n        var srow: boolean[] = [];\n        for (var j = 0; j < n; j++) srow.push(false);\n        safe.push(srow);\n    }\n    var stack: number[][] = [];\n    var push = function (r: number, c: number): void {\n        if (r >= 0 && r < m && c >= 0 && c < n && board[r][c] === 1 && !safe[r][c]) {\n            safe[r][c] = true;\n            stack.push([r, c]);\n        }\n    };\n    for (var r1 = 0; r1 < m; r1++) { push(r1, 0); push(r1, n - 1); }\n    for (var c1 = 0; c1 < n; c1++) { push(0, c1); push(m - 1, c1); }\n    while (stack.length > 0) {\n        var cell = stack.pop() as number[];\n        push(cell[0] - 1, cell[1]);\n        push(cell[0] + 1, cell[1]);\n        push(cell[0], cell[1] - 1);\n        push(cell[0], cell[1] + 1);\n    }\n    var out: number[][] = [];\n    for (var r2 = 0; r2 < m; r2++) {\n        var row: number[] = [];\n        for (var c2 = 0; c2 < n; c2++) row.push(safe[r2][c2] ? board[r2][c2] : 0);\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] solve(int[][] board) {\n    int m = board.length, n = board[0].length;\n    boolean[][] safe = new boolean[m][n];\n    Deque<int[]> stack = new ArrayDeque<>();\n    for (int r = 0; r < m; r++) {\n        if (board[r][0] == 1 && !safe[r][0]) { safe[r][0] = true; stack.push(new int[]{r, 0}); }\n        if (board[r][n - 1] == 1 && !safe[r][n - 1]) { safe[r][n - 1] = true; stack.push(new int[]{r, n - 1}); }\n    }\n    for (int c = 0; c < n; c++) {\n        if (board[0][c] == 1 && !safe[0][c]) { safe[0][c] = true; stack.push(new int[]{0, c}); }\n        if (board[m - 1][c] == 1 && !safe[m - 1][c]) { safe[m - 1][c] = true; stack.push(new int[]{m - 1, c}); }\n    }\n    int[][] steps = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        for (int[] d : steps) {\n            int nr = cell[0] + d[0], nc = cell[1] + d[1];\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] == 1 && !safe[nr][nc]) {\n                safe[nr][nc] = true;\n                stack.push(new int[]{nr, nc});\n            }\n        }\n    }\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) out[r][c] = safe[r][c] ? board[r][c] : 0;\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> solve(vector<vector<int>>& board) {\n    int m = (int) board.size(), n = (int) board[0].size();\n    vector<vector<bool>> safe(m, vector<bool>(n, false));\n    vector<pair<int, int>> stack;\n    for (int r = 0; r < m; r++) {\n        if (board[r][0] == 1 && !safe[r][0]) { safe[r][0] = true; stack.push_back(make_pair(r, 0)); }\n        if (board[r][n - 1] == 1 && !safe[r][n - 1]) { safe[r][n - 1] = true; stack.push_back(make_pair(r, n - 1)); }\n    }\n    for (int c = 0; c < n; c++) {\n        if (board[0][c] == 1 && !safe[0][c]) { safe[0][c] = true; stack.push_back(make_pair(0, c)); }\n        if (board[m - 1][c] == 1 && !safe[m - 1][c]) { safe[m - 1][c] = true; stack.push_back(make_pair(m - 1, c)); }\n    }\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    while (!stack.empty()) {\n        pair<int, int> cell = stack.back();\n        stack.pop_back();\n        for (int k = 0; k < 4; k++) {\n            int nr = cell.first + dr[k], nc = cell.second + dc[k];\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] == 1 && !safe[nr][nc]) {\n                safe[nr][nc] = true;\n                stack.push_back(make_pair(nr, nc));\n            }\n        }\n    }\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) out[r][c] = safe[r][c] ? board[r][c] : 0;\n    }\n    return out;\n}`,
              c: `int** solve(int** board, int boardSize, int* boardColSize, int* returnSize, int** returnColumnSizes) {\n    int m = boardSize, n = boardColSize[0];\n    char* safe = (char*) calloc(m * n, 1);\n    int* stack = (int*) malloc(sizeof(int) * m * n);\n    int top = 0;\n    for (int r = 0; r < m; r++) {\n        if (board[r][0] == 1 && !safe[r * n]) { safe[r * n] = 1; stack[top++] = r * n; }\n        if (board[r][n - 1] == 1 && !safe[r * n + n - 1]) { safe[r * n + n - 1] = 1; stack[top++] = r * n + n - 1; }\n    }\n    for (int c = 0; c < n; c++) {\n        if (board[0][c] == 1 && !safe[c]) { safe[c] = 1; stack[top++] = c; }\n        if (board[m - 1][c] == 1 && !safe[(m - 1) * n + c]) { safe[(m - 1) * n + c] = 1; stack[top++] = (m - 1) * n + c; }\n    }\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    while (top > 0) {\n        int idx = stack[--top];\n        int r = idx / n, c = idx % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] == 1 && !safe[nr * n + nc]) {\n                safe[nr * n + nc] = 1;\n                stack[top++] = nr * n + nc;\n            }\n        }\n    }\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) out[r][c] = safe[r * n + c] ? board[r][c] : 0;\n    }\n    free(safe);\n    free(stack);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] Solve(int[][] board)\n{\n    int m = board.Length, n = board[0].Length;\n    bool[][] safe = new bool[m][];\n    for (int r = 0; r < m; r++) safe[r] = new bool[n];\n    var stack = new Stack<int[]>();\n    for (int r = 0; r < m; r++)\n    {\n        if (board[r][0] == 1 && !safe[r][0]) { safe[r][0] = true; stack.Push(new int[] { r, 0 }); }\n        if (board[r][n - 1] == 1 && !safe[r][n - 1]) { safe[r][n - 1] = true; stack.Push(new int[] { r, n - 1 }); }\n    }\n    for (int c = 0; c < n; c++)\n    {\n        if (board[0][c] == 1 && !safe[0][c]) { safe[0][c] = true; stack.Push(new int[] { 0, c }); }\n        if (board[m - 1][c] == 1 && !safe[m - 1][c]) { safe[m - 1][c] = true; stack.Push(new int[] { m - 1, c }); }\n    }\n    int[][] steps = new int[][] { new int[] { -1, 0 }, new int[] { 1, 0 }, new int[] { 0, -1 }, new int[] { 0, 1 } };\n    while (stack.Count > 0)\n    {\n        int[] cell = stack.Pop();\n        foreach (int[] d in steps)\n        {\n            int nr = cell[0] + d[0], nc = cell[1] + d[1];\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] == 1 && !safe[nr][nc])\n            {\n                safe[nr][nc] = true;\n                stack.Push(new int[] { nr, nc });\n            }\n        }\n    }\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++) out_[r][c] = safe[r][c] ? board[r][c] : 0;\n    }\n    return out_;\n}`,
              go: `func solve(board [][]int) [][]int {\n	m, n := len(board), len(board[0])\n	safe := make([][]bool, m)\n	for r := range safe {\n		safe[r] = make([]bool, n)\n	}\n	stack := [][2]int{}\n	push := func(r, c int) {\n		if r >= 0 && r < m && c >= 0 && c < n && board[r][c] == 1 && !safe[r][c] {\n			safe[r][c] = true\n			stack = append(stack, [2]int{r, c})\n		}\n	}\n	for r := 0; r < m; r++ {\n		push(r, 0)\n		push(r, n-1)\n	}\n	for c := 0; c < n; c++ {\n		push(0, c)\n		push(m-1, c)\n	}\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		push(cell[0]-1, cell[1])\n		push(cell[0]+1, cell[1])\n		push(cell[0], cell[1]-1)\n		push(cell[0], cell[1]+1)\n	}\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			if safe[r][c] {\n				out[r][c] = board[r][c]\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun solve(board: Array<IntArray>): Array<IntArray> {\n    val m = board.size\n    val n = board[0].size\n    val safe = Array(m) { BooleanArray(n) }\n    val stack = java.util.ArrayDeque<IntArray>()\n    fun push(r: Int, c: Int) {\n        if (r in 0 until m && c in 0 until n && board[r][c] == 1 && !safe[r][c]) {\n            safe[r][c] = true\n            stack.push(intArrayOf(r, c))\n        }\n    }\n    for (r in 0 until m) {\n        push(r, 0)\n        push(r, n - 1)\n    }\n    for (c in 0 until n) {\n        push(0, c)\n        push(m - 1, c)\n    }\n    while (stack.isNotEmpty()) {\n        val cell = stack.pop()\n        push(cell[0] - 1, cell[1])\n        push(cell[0] + 1, cell[1])\n        push(cell[0], cell[1] - 1)\n        push(cell[0], cell[1] + 1)\n    }\n    return Array(m) { r -> IntArray(n) { c -> if (safe[r][c]) board[r][c] else 0 } }\n}`,
              swift: `func solve(_ board: [[Int]]) -> [[Int]] {\n    let m = board.count\n    let n = board[0].count\n    var safe = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n    var stack: [(Int, Int)] = []\n    for r in 0..<m {\n        if board[r][0] == 1 && !safe[r][0] { safe[r][0] = true; stack.append((r, 0)) }\n        if board[r][n - 1] == 1 && !safe[r][n - 1] { safe[r][n - 1] = true; stack.append((r, n - 1)) }\n    }\n    for c in 0..<n {\n        if board[0][c] == 1 && !safe[0][c] { safe[0][c] = true; stack.append((0, c)) }\n        if board[m - 1][c] == 1 && !safe[m - 1][c] { safe[m - 1][c] = true; stack.append((m - 1, c)) }\n    }\n    let steps = [(-1, 0), (1, 0), (0, -1), (0, 1)]\n    while let cell = stack.popLast() {\n        for d in steps {\n            let nr = cell.0 + d.0\n            let nc = cell.1 + d.1\n            if nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] == 1 && !safe[nr][nc] {\n                safe[nr][nc] = true\n                stack.append((nr, nc))\n            }\n        }\n    }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for r in 0..<m {\n        for c in 0..<n where safe[r][c] { out[r][c] = board[r][c] }\n    }\n    return out\n}`,
              rust: `fn solve(board: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = board.len();\n    let n = board[0].len();\n    let mut safe = vec![vec![false; n]; m];\n    let mut stack: Vec<(usize, usize)> = Vec::new();\n    for r in 0..m {\n        if board[r][0] == 1 && !safe[r][0] {\n            safe[r][0] = true;\n            stack.push((r, 0));\n        }\n        if board[r][n - 1] == 1 && !safe[r][n - 1] {\n            safe[r][n - 1] = true;\n            stack.push((r, n - 1));\n        }\n    }\n    for c in 0..n {\n        if board[0][c] == 1 && !safe[0][c] {\n            safe[0][c] = true;\n            stack.push((0, c));\n        }\n        if board[m - 1][c] == 1 && !safe[m - 1][c] {\n            safe[m - 1][c] = true;\n            stack.push((m - 1, c));\n        }\n    }\n    while let Some((r, c)) = stack.pop() {\n        let steps: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];\n        for d in steps.iter() {\n            let nr = r as i32 + d.0;\n            let nc = c as i32 + d.1;\n            if nr >= 0 && nr < m as i32 && nc >= 0 && nc < n as i32 {\n                let ur = nr as usize;\n                let uc = nc as usize;\n                if board[ur][uc] == 1 && !safe[ur][uc] {\n                    safe[ur][uc] = true;\n                    stack.push((ur, uc));\n                }\n            }\n        }\n    }\n    let mut out = vec![vec![0i32; n]; m];\n    for r in 0..m {\n        for c in 0..n {\n            if safe[r][c] {\n                out[r][c] = board[r][c];\n            }\n        }\n    }\n    out\n}`,
              php: `function solve($board) {\n    $m = count($board);\n    $n = count($board[0]);\n    $safe = array();\n    for ($i = 0; $i < $m; $i++) $safe[] = array_fill(0, $n, false);\n    $stack = array();\n    for ($r = 0; $r < $m; $r++) {\n        if ($board[$r][0] === 1 && !$safe[$r][0]) { $safe[$r][0] = true; $stack[] = array($r, 0); }\n        if ($board[$r][$n - 1] === 1 && !$safe[$r][$n - 1]) { $safe[$r][$n - 1] = true; $stack[] = array($r, $n - 1); }\n    }\n    for ($c = 0; $c < $n; $c++) {\n        if ($board[0][$c] === 1 && !$safe[0][$c]) { $safe[0][$c] = true; $stack[] = array(0, $c); }\n        if ($board[$m - 1][$c] === 1 && !$safe[$m - 1][$c]) { $safe[$m - 1][$c] = true; $stack[] = array($m - 1, $c); }\n    }\n    $steps = array(array(-1, 0), array(1, 0), array(0, -1), array(0, 1));\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        foreach ($steps as $d) {\n            $nr = $cell[0] + $d[0];\n            $nc = $cell[1] + $d[1];\n            if ($nr >= 0 && $nr < $m && $nc >= 0 && $nc < $n && $board[$nr][$nc] === 1 && !$safe[$nr][$nc]) {\n                $safe[$nr][$nc] = true;\n                $stack[] = array($nr, $nc);\n            }\n        }\n    }\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $row = array();\n        for ($c = 0; $c < $n; $c++) $row[] = $safe[$r][$c] ? $board[$r][$c] : 0;\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def solve(board)\n  m = board.length\n  n = board[0].length\n  safe = Array.new(m) { Array.new(n, false) }\n  stack = []\n  push = lambda do |r, c|\n    if r >= 0 && r < m && c >= 0 && c < n && board[r][c] == 1 && !safe[r][c]\n      safe[r][c] = true\n      stack << [r, c]\n    end\n  end\n  (0...m).each do |r|\n    push.call(r, 0)\n    push.call(r, n - 1)\n  end\n  (0...n).each do |c|\n    push.call(0, c)\n    push.call(m - 1, c)\n  end\n  until stack.empty?\n    r, c = stack.pop\n    push.call(r - 1, c)\n    push.call(r + 1, c)\n    push.call(r, c - 1)\n    push.call(r, c + 1)\n  end\n  (0...m).map { |r| (0...n).map { |c| safe[r][c] ? board[r][c] : 0 } }\nend`,
      },
    };
  })(),

  // ── Number of Closed Islands ────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const seen: boolean[][] = Array.from({ length: m }, () => new Array(n).fill(false));
      let count = 0;
      for (let sr = 0; sr < m; sr++) {
        for (let sc = 0; sc < n; sc++) {
          if (grid[sr][sc] !== 0 || seen[sr][sc]) continue;
          const stack: Array<[number, number]> = [[sr, sc]];
          seen[sr][sc] = true;
          let closed = true;
          while (stack.length > 0) {
            const [r, c] = stack.pop()!;
            if (r === 0 || r === m - 1 || c === 0 || c === n - 1) closed = false;
            const steps: Array<[number, number]> = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
            for (const [nr, nc] of steps) {
              if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 0 && !seen[nr][nc]) {
                seen[nr][nc] = true;
                stack.push([nr, nc]);
              }
            }
          }
          if (closed) count++;
        }
      }
      return count;
    };
    return {
      slug: "number-of-closed-islands",
      title: "Number of Closed Islands",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google", "Uber"],
      signature: { funcName: "closedIsland", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a 2-D `grid` where `0` is land and `1` is water. An **island** is a maximal group of `0`s connected **horizontally or vertically**.\n\nAn island is **closed** if it is completely surrounded by water — that is, none of its cells lies on the border of the grid. Return the number of closed islands.",
        [
          { in: "grid = [[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]", out: "1" },
          { in: "grid = [[0,0,1],[1,1,1],[1,1,1]]", out: "0", note: "The only island touches the border." },
          { in: "grid = [[1,1,1],[1,0,1],[1,1,1]]", out: "1" },
        ],
        ["1 <= grid.length, grid[i].length <= 8", "grid[i][j] is 0 or 1."]),
      hints: [
        "Flood-fill each unvisited land cell to collect its whole island.",
        "While filling, note whether any cell of the island sits on row 0, row m-1, column 0 or column n-1.",
        "Count the island only if no such cell was found.",
      ],
      examples: [
        { input: "[[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]", expectedOutput: "1" },
        { input: "[[0,0,1],[1,1,1],[1,1,1]]", expectedOutput: "0" },
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.55 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def closedIsland(grid) -> int:\n    m, n = len(grid), len(grid[0])\n    seen = [[False] * n for _ in range(m)]\n    count = 0\n    for sr in range(m):\n        for sc in range(n):\n            if grid[sr][sc] != 0 or seen[sr][sc]:\n                continue\n            stack = [(sr, sc)]\n            seen[sr][sc] = True\n            closed = True\n            while stack:\n                r, c = stack.pop()\n                if r == 0 or r == m - 1 or c == 0 or c == n - 1:\n                    closed = False\n                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):\n                    if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 0 and not seen[nr][nc]:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n            if closed:\n                count += 1\n    return count`,
        javascript: `var closedIsland = function(grid) {\n    const m = grid.length, n = grid[0].length;\n    const seen = [];\n    for (let r = 0; r < m; r++) seen.push(new Array(n).fill(false));\n    let count = 0;\n    for (let sr = 0; sr < m; sr++) {\n        for (let sc = 0; sc < n; sc++) {\n            if (grid[sr][sc] !== 0 || seen[sr][sc]) continue;\n            const stack = [[sr, sc]];\n            seen[sr][sc] = true;\n            let closed = true;\n            while (stack.length > 0) {\n                const cell = stack.pop();\n                const r = cell[0], c = cell[1];\n                if (r === 0 || r === m - 1 || c === 0 || c === n - 1) closed = false;\n                const steps = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];\n                for (let s = 0; s < 4; s++) {\n                    const nr = steps[s][0], nc = steps[s][1];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 0 && !seen[nr][nc]) {\n                        seen[nr][nc] = true;\n                        stack.push([nr, nc]);\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    return count;\n};`,
              typescript: `function closedIsland(grid: number[][]): number {\n    var m = grid.length;\n    var n = grid[0].length;\n    var seen: boolean[][] = [];\n    for (var i = 0; i < m; i++) {\n        var srow: boolean[] = [];\n        for (var j = 0; j < n; j++) srow.push(false);\n        seen.push(srow);\n    }\n    var count = 0;\n    for (var sr = 0; sr < m; sr++) {\n        for (var sc = 0; sc < n; sc++) {\n            if (grid[sr][sc] !== 0 || seen[sr][sc]) continue;\n            var stack: number[][] = [[sr, sc]];\n            seen[sr][sc] = true;\n            var closed = true;\n            while (stack.length > 0) {\n                var cell = stack.pop() as number[];\n                var r = cell[0];\n                var c = cell[1];\n                if (r === 0 || r === m - 1 || c === 0 || c === n - 1) closed = false;\n                var steps = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];\n                for (var s = 0; s < 4; s++) {\n                    var nr = steps[s][0];\n                    var nc = steps[s][1];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 0 && !seen[nr][nc]) {\n                        seen[nr][nc] = true;\n                        stack.push([nr, nc]);\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    return count;\n}`,
              java: `public static int closedIsland(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    boolean[][] seen = new boolean[m][n];\n    int[][] steps = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};\n    int count = 0;\n    for (int sr = 0; sr < m; sr++) {\n        for (int sc = 0; sc < n; sc++) {\n            if (grid[sr][sc] != 0 || seen[sr][sc]) continue;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{sr, sc});\n            seen[sr][sc] = true;\n            boolean closed = true;\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                int r = cell[0], c = cell[1];\n                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) closed = false;\n                for (int[] d : steps) {\n                    int nr = r + d[0], nc = c + d[1];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc]) {\n                        seen[nr][nc] = true;\n                        stack.push(new int[]{nr, nc});\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    return count;\n}`,
              cpp: `int closedIsland(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<bool>> seen(m, vector<bool>(n, false));\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int count = 0;\n    for (int sr = 0; sr < m; sr++) {\n        for (int sc = 0; sc < n; sc++) {\n            if (grid[sr][sc] != 0 || seen[sr][sc]) continue;\n            vector<pair<int, int>> stack;\n            stack.push_back(make_pair(sr, sc));\n            seen[sr][sc] = true;\n            bool closed = true;\n            while (!stack.empty()) {\n                pair<int, int> cell = stack.back();\n                stack.pop_back();\n                int r = cell.first, c = cell.second;\n                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) closed = false;\n                for (int k = 0; k < 4; k++) {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc]) {\n                        seen[nr][nc] = true;\n                        stack.push_back(make_pair(nr, nc));\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    return count;\n}`,
              c: `int closedIsland(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    char* seen = (char*) calloc(m * n, 1);\n    int* stack = (int*) malloc(sizeof(int) * m * n);\n    int dr[4] = {-1, 1, 0, 0};\n    int dc[4] = {0, 0, -1, 1};\n    int count = 0;\n    for (int sr = 0; sr < m; sr++) {\n        for (int sc = 0; sc < n; sc++) {\n            if (grid[sr][sc] != 0 || seen[sr * n + sc]) continue;\n            int top = 0;\n            stack[top++] = sr * n + sc;\n            seen[sr * n + sc] = 1;\n            bool closed = true;\n            while (top > 0) {\n                int idx = stack[--top];\n                int r = idx / n, c = idx % n;\n                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) closed = false;\n                for (int k = 0; k < 4; k++) {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr * n + nc]) {\n                        seen[nr * n + nc] = 1;\n                        stack[top++] = nr * n + nc;\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    free(seen);\n    free(stack);\n    return count;\n}`,
              csharp: `public static int ClosedIsland(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    bool[][] seen = new bool[m][];\n    for (int r = 0; r < m; r++) seen[r] = new bool[n];\n    int[][] steps = new int[][] { new int[] { -1, 0 }, new int[] { 1, 0 }, new int[] { 0, -1 }, new int[] { 0, 1 } };\n    int count = 0;\n    for (int sr = 0; sr < m; sr++)\n    {\n        for (int sc = 0; sc < n; sc++)\n        {\n            if (grid[sr][sc] != 0 || seen[sr][sc]) continue;\n            var stack = new Stack<int[]>();\n            stack.Push(new int[] { sr, sc });\n            seen[sr][sc] = true;\n            bool closed = true;\n            while (stack.Count > 0)\n            {\n                int[] cell = stack.Pop();\n                int r = cell[0], c = cell[1];\n                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) closed = false;\n                foreach (int[] d in steps)\n                {\n                    int nr = r + d[0], nc = c + d[1];\n                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc])\n                    {\n                        seen[nr][nc] = true;\n                        stack.Push(new int[] { nr, nc });\n                    }\n                }\n            }\n            if (closed) count++;\n        }\n    }\n    return count;\n}`,
              go: `func closedIsland(grid [][]int) int {\n	m, n := len(grid), len(grid[0])\n	seen := make([][]bool, m)\n	for r := range seen {\n		seen[r] = make([]bool, n)\n	}\n	dr := []int{-1, 1, 0, 0}\n	dc := []int{0, 0, -1, 1}\n	count := 0\n	for sr := 0; sr < m; sr++ {\n		for sc := 0; sc < n; sc++ {\n			if grid[sr][sc] != 0 || seen[sr][sc] {\n				continue\n			}\n			stack := [][2]int{{sr, sc}}\n			seen[sr][sc] = true\n			closed := true\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				r, c := cell[0], cell[1]\n				if r == 0 || r == m-1 || c == 0 || c == n-1 {\n					closed = false\n				}\n				for k := 0; k < 4; k++ {\n					nr, nc := r+dr[k], c+dc[k]\n					if nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc] {\n						seen[nr][nc] = true\n						stack = append(stack, [2]int{nr, nc})\n					}\n				}\n			}\n			if closed {\n				count++\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun closedIsland(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val seen = Array(m) { BooleanArray(n) }\n    val dr = intArrayOf(-1, 1, 0, 0)\n    val dc = intArrayOf(0, 0, -1, 1)\n    var count = 0\n    for (sr in 0 until m) {\n        for (sc in 0 until n) {\n            if (grid[sr][sc] != 0 || seen[sr][sc]) continue\n            val stack = java.util.ArrayDeque<IntArray>()\n            stack.push(intArrayOf(sr, sc))\n            seen[sr][sc] = true\n            var closed = true\n            while (stack.isNotEmpty()) {\n                val cell = stack.pop()\n                val r = cell[0]\n                val c = cell[1]\n                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) closed = false\n                for (k in 0 until 4) {\n                    val nr = r + dr[k]\n                    val nc = c + dc[k]\n                    if (nr in 0 until m && nc in 0 until n && grid[nr][nc] == 0 && !seen[nr][nc]) {\n                        seen[nr][nc] = true\n                        stack.push(intArrayOf(nr, nc))\n                    }\n                }\n            }\n            if (closed) count++\n        }\n    }\n    return count\n}`,
              swift: `func closedIsland(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n    let steps = [(-1, 0), (1, 0), (0, -1), (0, 1)]\n    var count = 0\n    for sr in 0..<m {\n        for sc in 0..<n {\n            if grid[sr][sc] != 0 || seen[sr][sc] { continue }\n            var stack: [(Int, Int)] = [(sr, sc)]\n            seen[sr][sc] = true\n            var closed = true\n            while let cell = stack.popLast() {\n                let r = cell.0\n                let c = cell.1\n                if r == 0 || r == m - 1 || c == 0 || c == n - 1 { closed = false }\n                for d in steps {\n                    let nr = r + d.0\n                    let nc = c + d.1\n                    if nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc] {\n                        seen[nr][nc] = true\n                        stack.append((nr, nc))\n                    }\n                }\n            }\n            if closed { count += 1 }\n        }\n    }\n    return count\n}`,
              rust: `fn closedIsland(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut seen = vec![vec![false; n]; m];\n    let steps: [(i32, i32); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];\n    let mut count = 0;\n    for sr in 0..m {\n        for sc in 0..n {\n            if grid[sr][sc] != 0 || seen[sr][sc] {\n                continue;\n            }\n            let mut stack: Vec<(usize, usize)> = vec![(sr, sc)];\n            seen[sr][sc] = true;\n            let mut closed = true;\n            while let Some((r, c)) = stack.pop() {\n                if r == 0 || r == m - 1 || c == 0 || c == n - 1 {\n                    closed = false;\n                }\n                for d in steps.iter() {\n                    let nr = r as i32 + d.0;\n                    let nc = c as i32 + d.1;\n                    if nr >= 0 && nr < m as i32 && nc >= 0 && nc < n as i32 {\n                        let ur = nr as usize;\n                        let uc = nc as usize;\n                        if grid[ur][uc] == 0 && !seen[ur][uc] {\n                            seen[ur][uc] = true;\n                            stack.push((ur, uc));\n                        }\n                    }\n                }\n            }\n            if closed {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
              php: `function closedIsland($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $seen = array();\n    for ($i = 0; $i < $m; $i++) $seen[] = array_fill(0, $n, false);\n    $steps = array(array(-1, 0), array(1, 0), array(0, -1), array(0, 1));\n    $count = 0;\n    for ($sr = 0; $sr < $m; $sr++) {\n        for ($sc = 0; $sc < $n; $sc++) {\n            if ($grid[$sr][$sc] !== 0 || $seen[$sr][$sc]) continue;\n            $stack = array(array($sr, $sc));\n            $seen[$sr][$sc] = true;\n            $closed = true;\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                $r = $cell[0];\n                $c = $cell[1];\n                if ($r === 0 || $r === $m - 1 || $c === 0 || $c === $n - 1) $closed = false;\n                foreach ($steps as $d) {\n                    $nr = $r + $d[0];\n                    $nc = $c + $d[1];\n                    if ($nr >= 0 && $nr < $m && $nc >= 0 && $nc < $n && $grid[$nr][$nc] === 0 && !$seen[$nr][$nc]) {\n                        $seen[$nr][$nc] = true;\n                        $stack[] = array($nr, $nc);\n                    }\n                }\n            }\n            if ($closed) $count++;\n        }\n    }\n    return $count;\n}`,
              ruby: `def closedIsland(grid)\n  m = grid.length\n  n = grid[0].length\n  seen = Array.new(m) { Array.new(n, false) }\n  steps = [[-1, 0], [1, 0], [0, -1], [0, 1]]\n  count = 0\n  (0...m).each do |sr|\n    (0...n).each do |sc|\n      next if grid[sr][sc] != 0 || seen[sr][sc]\n      stack = [[sr, sc]]\n      seen[sr][sc] = true\n      closed = true\n      until stack.empty?\n        r, c = stack.pop\n        closed = false if r == 0 || r == m - 1 || c == 0 || c == n - 1\n        steps.each do |d|\n          nr = r + d[0]\n          nc = c + d[1]\n          if nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0 && !seen[nr][nc]\n            seen[nr][nc] = true\n            stack << [nr, nc]\n          end\n        end\n      end\n      count += 1 if closed\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Determine Whether Matrix Can Be Obtained By Rotation ─────────
  (() => {
    const rotate = (m: number[][]) => {
      const n = m.length;
      return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => m[n - 1 - c][r]));
    };
    const same = (a: number[][], b: number[][]) => {
      for (let r = 0; r < a.length; r++) for (let c = 0; c < a.length; c++) if (a[r][c] !== b[r][c]) return false;
      return true;
    };
    const ref = (mat: number[][], target: number[][]) => {
      let cur = mat;
      for (let k = 0; k < 4; k++) {
        if (same(cur, target)) return true;
        cur = rotate(cur);
      }
      return false;
    };
    return {
      slug: "determine-whether-matrix-can-be-obtained-by-rotation",
      title: "Determine Whether Matrix Can Be Obtained By Rotation",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Adobe"],
      signature: { funcName: "findRotation", params: [{ name: "mat", type: "int[][]" as const }, { name: "target", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Given two `n × n` binary matrices `mat` and `target`, return `true` if `mat` can be made equal to `target` by rotating it **90 degrees clockwise** any number of times (including zero).",
        [
          { in: "mat = [[0,1],[1,0]], target = [[1,0],[0,1]]", out: "true", note: "One rotation suffices." },
          { in: "mat = [[0,1],[1,1]], target = [[1,0],[0,1]]", out: "false" },
          { in: "mat = [[0,0,0],[0,1,0],[1,1,1]], target = [[1,1,1],[0,1,0],[0,0,0]]", out: "true" },
        ],
        ["1 <= mat.length <= 8", "mat[i].length == mat.length", "mat and target have the same size.", "Entries are 0 or 1."]),
      hints: [
        "There are only four distinct rotations, so try them all.",
        "A 90-degree clockwise rotation maps `(r, c)` to `(c, n - 1 - r)`; equivalently the new `(r, c)` reads the old `(n - 1 - c, r)`.",
        "Compare after each rotation, including before the first one.",
      ],
      examples: [
        { input: "[[0,1],[1,0]]\n[[1,0],[0,1]]", expectedOutput: "true" },
        { input: "[[0,1],[1,1]]\n[[1,0],[0,1]]", expectedOutput: "false" },
        { input: "[[0,0,0],[0,1,0],[1,1,1]]\n[[1,1,1],[0,1,0],[0,0,0]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const mat = randMat(rng, n, n, 0, 1);
        let target: number[][];
        if (rng() < 0.55) {
          target = mat.map((row) => row.slice());
          const turns = ri(rng, 0, 3);
          for (let k = 0; k < turns; k++) target = rotate(target);
        } else {
          target = randMat(rng, n, n, 0, 1);
        }
        return { input: `${fmtIntMat(mat)}\n${fmtIntMat(target)}`, expectedOutput: bool(ref(mat, target)) };
      },
      solutions: {
        python: `def findRotation(mat, target) -> bool:\n    cur = [row[:] for row in mat]\n    n = len(mat)\n    for _ in range(4):\n        if cur == target:\n            return True\n        cur = [[cur[n - 1 - c][r] for c in range(n)] for r in range(n)]\n    return False`,
        javascript: `var findRotation = function(mat, target) {\n    const n = mat.length;\n    let cur = [];\n    for (let r = 0; r < n; r++) cur.push(mat[r].slice());\n    const same = function(a, b) {\n        for (let r = 0; r < n; r++) {\n            for (let c = 0; c < n; c++) {\n                if (a[r][c] !== b[r][c]) return false;\n            }\n        }\n        return true;\n    };\n    for (let k = 0; k < 4; k++) {\n        if (same(cur, target)) return true;\n        const next = [];\n        for (let r = 0; r < n; r++) {\n            const row = [];\n            for (let c = 0; c < n; c++) row.push(cur[n - 1 - c][r]);\n            next.push(row);\n        }\n        cur = next;\n    }\n    return false;\n};`,
              typescript: `function findRotation(mat: number[][], target: number[][]): boolean {\n    var n = mat.length;\n    var cur: number[][] = [];\n    for (var i = 0; i < n; i++) cur.push(mat[i].slice());\n    var same = function (a: number[][], b: number[][]): boolean {\n        for (var r = 0; r < n; r++) {\n            for (var c = 0; c < n; c++) {\n                if (a[r][c] !== b[r][c]) return false;\n            }\n        }\n        return true;\n    };\n    for (var k = 0; k < 4; k++) {\n        if (same(cur, target)) return true;\n        var next: number[][] = [];\n        for (var r2 = 0; r2 < n; r2++) {\n            var row: number[] = [];\n            for (var c2 = 0; c2 < n; c2++) row.push(cur[n - 1 - c2][r2]);\n            next.push(row);\n        }\n        cur = next;\n    }\n    return false;\n}`,
              java: `public static boolean findRotation(int[][] mat, int[][] target) {\n    int n = mat.length;\n    int[][] cur = new int[n][n];\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) cur[r][c] = mat[r][c];\n    }\n    for (int k = 0; k < 4; k++) {\n        boolean same = true;\n        for (int r = 0; r < n && same; r++) {\n            for (int c = 0; c < n; c++) {\n                if (cur[r][c] != target[r][c]) { same = false; break; }\n            }\n        }\n        if (same) return true;\n        int[][] next = new int[n][n];\n        for (int r = 0; r < n; r++) {\n            for (int c = 0; c < n; c++) next[r][c] = cur[n - 1 - c][r];\n        }\n        cur = next;\n    }\n    return false;\n}`,
              cpp: `bool findRotation(vector<vector<int>>& mat, vector<vector<int>>& target) {\n    int n = (int) mat.size();\n    vector<vector<int>> cur = mat;\n    for (int k = 0; k < 4; k++) {\n        if (cur == target) return true;\n        vector<vector<int>> next(n, vector<int>(n, 0));\n        for (int r = 0; r < n; r++) {\n            for (int c = 0; c < n; c++) next[r][c] = cur[n - 1 - c][r];\n        }\n        cur = next;\n    }\n    return false;\n}`,
              c: `bool findRotation(int** mat, int matSize, int* matColSize, int** target, int targetSize, int* targetColSize) {\n    int n = matSize;\n    int* cur = (int*) malloc(sizeof(int) * n * n);\n    int* next = (int*) malloc(sizeof(int) * n * n);\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) cur[r * n + c] = mat[r][c];\n    }\n    bool found = false;\n    for (int k = 0; k < 4 && !found; k++) {\n        bool same = true;\n        for (int r = 0; r < n && same; r++) {\n            for (int c = 0; c < n; c++) {\n                if (cur[r * n + c] != target[r][c]) { same = false; break; }\n            }\n        }\n        if (same) { found = true; break; }\n        for (int r = 0; r < n; r++) {\n            for (int c = 0; c < n; c++) next[r * n + c] = cur[(n - 1 - c) * n + r];\n        }\n        for (int i = 0; i < n * n; i++) cur[i] = next[i];\n    }\n    free(cur);\n    free(next);\n    return found;\n}`,
              csharp: `public static bool FindRotation(int[][] mat, int[][] target)\n{\n    int n = mat.Length;\n    int[][] cur = new int[n][];\n    for (int r = 0; r < n; r++)\n    {\n        cur[r] = new int[n];\n        for (int c = 0; c < n; c++) cur[r][c] = mat[r][c];\n    }\n    for (int k = 0; k < 4; k++)\n    {\n        bool same = true;\n        for (int r = 0; r < n && same; r++)\n        {\n            for (int c = 0; c < n; c++)\n            {\n                if (cur[r][c] != target[r][c]) { same = false; break; }\n            }\n        }\n        if (same) return true;\n        int[][] next = new int[n][];\n        for (int r = 0; r < n; r++)\n        {\n            next[r] = new int[n];\n            for (int c = 0; c < n; c++) next[r][c] = cur[n - 1 - c][r];\n        }\n        cur = next;\n    }\n    return false;\n}`,
              go: `func findRotation(mat [][]int, target [][]int) bool {\n	n := len(mat)\n	cur := make([][]int, n)\n	for r := 0; r < n; r++ {\n		cur[r] = make([]int, n)\n		copy(cur[r], mat[r])\n	}\n	for k := 0; k < 4; k++ {\n		same := true\n		for r := 0; r < n && same; r++ {\n			for c := 0; c < n; c++ {\n				if cur[r][c] != target[r][c] {\n					same = false\n					break\n				}\n			}\n		}\n		if same {\n			return true\n		}\n		next := make([][]int, n)\n		for r := 0; r < n; r++ {\n			next[r] = make([]int, n)\n			for c := 0; c < n; c++ {\n				next[r][c] = cur[n-1-c][r]\n			}\n		}\n		cur = next\n	}\n	return false\n}`,
              kotlin: `fun findRotation(mat: Array<IntArray>, target: Array<IntArray>): Boolean {\n    val n = mat.size\n    var cur = Array(n) { mat[it].copyOf() }\n    for (k in 0 until 4) {\n        var same = true\n        loop@ for (r in 0 until n) {\n            for (c in 0 until n) {\n                if (cur[r][c] != target[r][c]) {\n                    same = false\n                    break@loop\n                }\n            }\n        }\n        if (same) return true\n        val next = Array(n) { IntArray(n) }\n        for (r in 0 until n) {\n            for (c in 0 until n) next[r][c] = cur[n - 1 - c][r]\n        }\n        cur = next\n    }\n    return false\n}`,
              swift: `func findRotation(_ mat: [[Int]], _ target: [[Int]]) -> Bool {\n    let n = mat.count\n    var cur = mat\n    for _ in 0..<4 {\n        if cur == target { return true }\n        var next = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n        for r in 0..<n {\n            for c in 0..<n { next[r][c] = cur[n - 1 - c][r] }\n        }\n        cur = next\n    }\n    return false\n}`,
              rust: `fn findRotation(mat: Vec<Vec<i32>>, target: Vec<Vec<i32>>) -> bool {\n    let n = mat.len();\n    let mut cur = mat.clone();\n    for _ in 0..4 {\n        if cur == target {\n            return true;\n        }\n        let mut next = vec![vec![0i32; n]; n];\n        for r in 0..n {\n            for c in 0..n {\n                next[r][c] = cur[n - 1 - c][r];\n            }\n        }\n        cur = next;\n    }\n    false\n}`,
              php: `function findRotation($mat, $target) {\n    $n = count($mat);\n    $cur = $mat;\n    for ($k = 0; $k < 4; $k++) {\n        if ($cur === $target) return true;\n        $next = array();\n        for ($r = 0; $r < $n; $r++) {\n            $row = array();\n            for ($c = 0; $c < $n; $c++) $row[] = $cur[$n - 1 - $c][$r];\n            $next[] = $row;\n        }\n        $cur = $next;\n    }\n    return false;\n}`,
              ruby: `def findRotation(mat, target)\n  n = mat.length\n  cur = mat.map(&:dup)\n  4.times do\n    return true if cur == target\n    cur = (0...n).map { |r| (0...n).map { |c| cur[n - 1 - c][r] } }\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Check if Matrix Is X-Matrix ─────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const onDiagonal = r === c || r + c === n - 1;
          if (onDiagonal && grid[r][c] === 0) return false;
          if (!onDiagonal && grid[r][c] !== 0) return false;
        }
      }
      return true;
    };
    return {
      slug: "check-if-matrix-is-x-matrix",
      title: "Check if Matrix Is X-Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Adobe"],
      signature: { funcName: "checkXMatrix", params: [{ name: "grid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "A square matrix is an **X-Matrix** when both hold:\n\n1. Every element on one of the two main diagonals is **non-zero**.\n2. Every other element is **zero**.\n\nGiven a square matrix `grid`, return `true` if it is an X-Matrix.",
        [
          { in: "grid = [[2,0,0,1],[0,3,1,0],[0,5,2,0],[4,0,0,2]]", out: "true" },
          { in: "grid = [[5,7,0],[0,3,1],[0,5,0]]", out: "false", note: "The 7 sits off both diagonals but is non-zero." },
          { in: "grid = [[1]]", out: "true" },
        ],
        ["1 <= grid.length <= 8", "grid[i].length == grid.length", "0 <= grid[i][j] <= 100000"]),
      hints: [
        "A cell `(r, c)` is on a diagonal exactly when `r == c` or `r + c == n - 1`.",
        "One pass over every cell checks both rules with a single branch.",
        "The centre of an odd-sized matrix satisfies both conditions at once — it is still just a diagonal cell.",
      ],
      examples: [
        { input: "[[2,0,0,1],[0,3,1,0],[0,5,2,0],[4,0,0,2]]", expectedOutput: "true" },
        { input: "[[5,7,0],[0,3,1],[0,5,0]]", expectedOutput: "false" },
        { input: "[[1]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        let grid: number[][];
        if (rng() < 0.45) {
          grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r === c || r + c === n - 1 ? ri(rng, 1, 100000) : 0)));
          if (rng() < 0.4) grid[ri(rng, 0, n - 1)][ri(rng, 0, n - 1)] = ri(rng, 0, 3);
        } else {
          grid = randMat(rng, n, n, 0, 3);
        }
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: `def checkXMatrix(grid) -> bool:\n    n = len(grid)\n    for r in range(n):\n        for c in range(n):\n            on_diagonal = r == c or r + c == n - 1\n            if on_diagonal and grid[r][c] == 0:\n                return False\n            if not on_diagonal and grid[r][c] != 0:\n                return False\n    return True`,
        javascript: `var checkXMatrix = function(grid) {\n    const n = grid.length;\n    for (let r = 0; r < n; r++) {\n        for (let c = 0; c < n; c++) {\n            const onDiagonal = r === c || r + c === n - 1;\n            if (onDiagonal && grid[r][c] === 0) return false;\n            if (!onDiagonal && grid[r][c] !== 0) return false;\n        }\n    }\n    return true;\n};`,
              typescript: `function checkXMatrix(grid: number[][]): boolean {\n    var n = grid.length;\n    for (var r = 0; r < n; r++) {\n        for (var c = 0; c < n; c++) {\n            var onDiagonal = r === c || r + c === n - 1;\n            if (onDiagonal && grid[r][c] === 0) return false;\n            if (!onDiagonal && grid[r][c] !== 0) return false;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean checkXMatrix(int[][] grid) {\n    int n = grid.length;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            boolean onDiagonal = r == c || r + c == n - 1;\n            if (onDiagonal && grid[r][c] == 0) return false;\n            if (!onDiagonal && grid[r][c] != 0) return false;\n        }\n    }\n    return true;\n}`,
              cpp: `bool checkXMatrix(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            bool onDiagonal = r == c || r + c == n - 1;\n            if (onDiagonal && grid[r][c] == 0) return false;\n            if (!onDiagonal && grid[r][c] != 0) return false;\n        }\n    }\n    return true;\n}`,
              c: `bool checkXMatrix(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            bool onDiagonal = (r == c) || (r + c == n - 1);\n            if (onDiagonal && grid[r][c] == 0) return false;\n            if (!onDiagonal && grid[r][c] != 0) return false;\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool CheckXMatrix(int[][] grid)\n{\n    int n = grid.Length;\n    for (int r = 0; r < n; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            bool onDiagonal = r == c || r + c == n - 1;\n            if (onDiagonal && grid[r][c] == 0) return false;\n            if (!onDiagonal && grid[r][c] != 0) return false;\n        }\n    }\n    return true;\n}`,
              go: `func checkXMatrix(grid [][]int) bool {\n	n := len(grid)\n	for r := 0; r < n; r++ {\n		for c := 0; c < n; c++ {\n			onDiagonal := r == c || r+c == n-1\n			if onDiagonal && grid[r][c] == 0 {\n				return false\n			}\n			if !onDiagonal && grid[r][c] != 0 {\n				return false\n			}\n		}\n	}\n	return true\n}`,
              kotlin: `fun checkXMatrix(grid: Array<IntArray>): Boolean {\n    val n = grid.size\n    for (r in 0 until n) {\n        for (c in 0 until n) {\n            val onDiagonal = r == c || r + c == n - 1\n            if (onDiagonal && grid[r][c] == 0) return false\n            if (!onDiagonal && grid[r][c] != 0) return false\n        }\n    }\n    return true\n}`,
              swift: `func checkXMatrix(_ grid: [[Int]]) -> Bool {\n    let n = grid.count\n    for r in 0..<n {\n        for c in 0..<n {\n            let onDiagonal = r == c || r + c == n - 1\n            if onDiagonal && grid[r][c] == 0 { return false }\n            if !onDiagonal && grid[r][c] != 0 { return false }\n        }\n    }\n    return true\n}`,
              rust: `fn checkXMatrix(grid: Vec<Vec<i32>>) -> bool {\n    let n = grid.len();\n    for r in 0..n {\n        for c in 0..n {\n            let on_diagonal = r == c || r + c == n - 1;\n            if on_diagonal && grid[r][c] == 0 {\n                return false;\n            }\n            if !on_diagonal && grid[r][c] != 0 {\n                return false;\n            }\n        }\n    }\n    true\n}`,
              php: `function checkXMatrix($grid) {\n    $n = count($grid);\n    for ($r = 0; $r < $n; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            $onDiagonal = ($r === $c) || ($r + $c === $n - 1);\n            if ($onDiagonal && $grid[$r][$c] === 0) return false;\n            if (!$onDiagonal && $grid[$r][$c] !== 0) return false;\n        }\n    }\n    return true;\n}`,
              ruby: `def checkXMatrix(grid)\n  n = grid.length\n  (0...n).each do |r|\n    (0...n).each do |c|\n      on_diagonal = r == c || r + c == n - 1\n      return false if on_diagonal && grid[r][c] == 0\n      return false if !on_diagonal && grid[r][c] != 0\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Row With Maximum Ones ───────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      let bestRow = 0, bestCount = -1;
      for (let r = 0; r < mat.length; r++) {
        let count = 0;
        for (let c = 0; c < mat[r].length; c++) count += mat[r][c];
        if (count > bestCount) { bestCount = count; bestRow = r; }
      }
      return [bestRow, bestCount];
    };
    return {
      slug: "row-with-maximum-ones",
      title: "Row With Maximum Ones",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Microsoft"],
      signature: { funcName: "rowAndMaximumOnes", params: [{ name: "mat", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an `m × n` binary matrix `mat`, find the row with the **most** ones.\n\nReturn `[rowIndex, count]`. If several rows tie, return the one with the **smallest** index.",
        [
          { in: "mat = [[0,1],[1,0]]", out: "[0,1]", note: "Both rows hold one 1, so the smaller index wins." },
          { in: "mat = [[0,0,0],[0,1,1]]", out: "[1,2]" },
          { in: "mat = [[0,0],[1,1],[0,0]]", out: "[1,2]" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "mat[i][j] is 0 or 1."]),
      hints: [
        "Since the entries are 0 and 1, a row's count of ones is just its sum.",
        "Scan top to bottom and replace the best only on a **strictly** greater count — that is what keeps the smallest index on a tie.",
      ],
      examples: [
        { input: "[[0,1],[1,0]]", expectedOutput: "[0,1]" },
        { input: "[[0,0,0],[0,1,1]]", expectedOutput: "[1,2]" },
        { input: "[[0,0],[1,1],[0,0]]", expectedOutput: "[1,2]" },
      ],
      gen: (rng: Rng) => {
        const mat = randMat(rng, ri(rng, 1, 8), ri(rng, 1, 8), 0, 1);
        return { input: fmtIntMat(mat), expectedOutput: fmtIntArr(ref(mat)) };
      },
      solutions: {
        python: `def rowAndMaximumOnes(mat):\n    best_row, best_count = 0, -1\n    for r, row in enumerate(mat):\n        count = sum(row)\n        if count > best_count:\n            best_count = count\n            best_row = r\n    return [best_row, best_count]`,
        javascript: `var rowAndMaximumOnes = function(mat) {\n    let bestRow = 0, bestCount = -1;\n    for (let r = 0; r < mat.length; r++) {\n        let count = 0;\n        for (let c = 0; c < mat[r].length; c++) count += mat[r][c];\n        if (count > bestCount) {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    return [bestRow, bestCount];\n};`,
              typescript: `function rowAndMaximumOnes(mat: number[][]): number[] {\n    var bestRow = 0;\n    var bestCount = -1;\n    for (var r = 0; r < mat.length; r++) {\n        var count = 0;\n        for (var c = 0; c < mat[r].length; c++) count += mat[r][c];\n        if (count > bestCount) {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    return [bestRow, bestCount];\n}`,
              java: `public static int[] rowAndMaximumOnes(int[][] mat) {\n    int bestRow = 0, bestCount = -1;\n    for (int r = 0; r < mat.length; r++) {\n        int count = 0;\n        for (int c = 0; c < mat[r].length; c++) count += mat[r][c];\n        if (count > bestCount) {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    return new int[]{bestRow, bestCount};\n}`,
              cpp: `vector<int> rowAndMaximumOnes(vector<vector<int>>& mat) {\n    int bestRow = 0, bestCount = -1;\n    for (int r = 0; r < (int) mat.size(); r++) {\n        int count = 0;\n        for (int v : mat[r]) count += v;\n        if (count > bestCount) {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    return {bestRow, bestCount};\n}`,
              c: `int* rowAndMaximumOnes(int** mat, int matSize, int* matColSize, int* returnSize) {\n    int bestRow = 0, bestCount = -1;\n    for (int r = 0; r < matSize; r++) {\n        int count = 0;\n        for (int c = 0; c < matColSize[0]; c++) count += mat[r][c];\n        if (count > bestCount) {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    int* out = (int*) malloc(sizeof(int) * 2);\n    out[0] = bestRow;\n    out[1] = bestCount;\n    *returnSize = 2;\n    return out;\n}`,
              csharp: `public static int[] RowAndMaximumOnes(int[][] mat)\n{\n    int bestRow = 0, bestCount = -1;\n    for (int r = 0; r < mat.Length; r++)\n    {\n        int count = 0;\n        for (int c = 0; c < mat[r].Length; c++) count += mat[r][c];\n        if (count > bestCount)\n        {\n            bestCount = count;\n            bestRow = r;\n        }\n    }\n    return new int[] { bestRow, bestCount };\n}`,
              go: `func rowAndMaximumOnes(mat [][]int) []int {\n	bestRow, bestCount := 0, -1\n	for r, row := range mat {\n		count := 0\n		for _, v := range row {\n			count += v\n		}\n		if count > bestCount {\n			bestCount = count\n			bestRow = r\n		}\n	}\n	return []int{bestRow, bestCount}\n}`,
              kotlin: `fun rowAndMaximumOnes(mat: Array<IntArray>): IntArray {\n    var bestRow = 0\n    var bestCount = -1\n    for (r in mat.indices) {\n        val count = mat[r].sum()\n        if (count > bestCount) {\n            bestCount = count\n            bestRow = r\n        }\n    }\n    return intArrayOf(bestRow, bestCount)\n}`,
              swift: `func rowAndMaximumOnes(_ mat: [[Int]]) -> [Int] {\n    var bestRow = 0\n    var bestCount = -1\n    for r in 0..<mat.count {\n        var count = 0\n        for v in mat[r] { count += v }\n        if count > bestCount {\n            bestCount = count\n            bestRow = r\n        }\n    }\n    return [bestRow, bestCount]\n}`,
              rust: `fn rowAndMaximumOnes(mat: Vec<Vec<i32>>) -> Vec<i32> {\n    let mut best_row = 0i32;\n    let mut best_count = -1i32;\n    for r in 0..mat.len() {\n        let count: i32 = mat[r].iter().sum();\n        if count > best_count {\n            best_count = count;\n            best_row = r as i32;\n        }\n    }\n    vec![best_row, best_count]\n}`,
              php: `function rowAndMaximumOnes($mat) {\n    $bestRow = 0;\n    $bestCount = -1;\n    for ($r = 0; $r < count($mat); $r++) {\n        $count = array_sum($mat[$r]);\n        if ($count > $bestCount) {\n            $bestCount = $count;\n            $bestRow = $r;\n        }\n    }\n    return array($bestRow, $bestCount);\n}`,
              ruby: `def rowAndMaximumOnes(mat)\n  best_row = 0\n  best_count = -1\n  mat.each_with_index do |row, r|\n    count = row.sum\n    if count > best_count\n      best_count = count\n      best_row = r\n    end\n  end\n  [best_row, best_count]\nend`,
      },
    };
  })(),

  // ── Largest Local Values in a Matrix ────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const out: number[][] = [];
      for (let r = 0; r < n - 2; r++) {
        const row: number[] = [];
        for (let c = 0; c < n - 2; c++) {
          let best = 0;
          for (let dr = 0; dr < 3; dr++) {
            for (let dc = 0; dc < 3; dc++) if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];
          }
          row.push(best);
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "largest-local-values-in-a-matrix",
      title: "Largest Local Values in a Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Adobe"],
      signature: { funcName: "largestLocal", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `n × n` integer matrix `grid`.\n\nReturn an `(n - 2) × (n - 2)` matrix `maxLocal` where `maxLocal[i][j]` is the largest value in the 3 × 3 block of `grid` centred at row `i + 1`, column `j + 1`.",
        [
          { in: "grid = [[9,9,8,1],[5,6,2,6],[8,2,6,4],[6,2,2,2]]", out: "[[9,9],[8,6]]" },
          { in: "grid = [[1,1,1],[1,1,1],[1,1,1]]", out: "[[1]]" },
          { in: "grid = [[1,2,3],[4,5,6],[7,8,9]]", out: "[[9]]" },
        ],
        ["3 <= grid.length <= 8", "grid[i].length == grid.length", "1 <= grid[i][j] <= 100"]),
      hints: [
        "The output has two fewer rows and columns, because the block centre can never sit on the border.",
        "Anchor each block at its **top-left** corner `(i, j)` and take the maximum of the nine cells from there.",
      ],
      examples: [
        { input: "[[9,9,8,1],[5,6,2,6],[8,2,6,4],[6,2,2,2]]", expectedOutput: "[[9,9],[8,6]]" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]", expectedOutput: "[[1]]" },
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[9]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 8);
        const grid = randMat(rng, n, n, 1, 100);
        return { input: fmtIntMat(grid), expectedOutput: fmtIntMat(ref(grid)) };
      },
      solutions: {
        python: `def largestLocal(grid):\n    n = len(grid)\n    return [[max(grid[r + dr][c + dc] for dr in range(3) for dc in range(3))\n             for c in range(n - 2)] for r in range(n - 2)]`,
        javascript: `var largestLocal = function(grid) {\n    const n = grid.length;\n    const out = [];\n    for (let r = 0; r < n - 2; r++) {\n        const row = [];\n        for (let c = 0; c < n - 2; c++) {\n            let best = 0;\n            for (let dr = 0; dr < 3; dr++) {\n                for (let dc = 0; dc < 3; dc++) {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];\n                }\n            }\n            row.push(best);\n        }\n        out.push(row);\n    }\n    return out;\n};`,
              typescript: `function largestLocal(grid: number[][]): number[][] {\n    var n = grid.length;\n    var out: number[][] = [];\n    for (var r = 0; r < n - 2; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n - 2; c++) {\n            var best = 0;\n            for (var dr = 0; dr < 3; dr++) {\n                for (var dc = 0; dc < 3; dc++) {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];\n                }\n            }\n            row.push(best);\n        }\n        out.push(row);\n    }\n    return out;\n}`,
              java: `public static int[][] largestLocal(int[][] grid) {\n    int n = grid.length;\n    int[][] out = new int[n - 2][n - 2];\n    for (int r = 0; r < n - 2; r++) {\n        for (int c = 0; c < n - 2; c++) {\n            int best = 0;\n            for (int dr = 0; dr < 3; dr++) {\n                for (int dc = 0; dc < 3; dc++) {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];\n                }\n            }\n            out[r][c] = best;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> largestLocal(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    vector<vector<int>> out(n - 2, vector<int>(n - 2, 0));\n    for (int r = 0; r < n - 2; r++) {\n        for (int c = 0; c < n - 2; c++) {\n            int best = 0;\n            for (int dr = 0; dr < 3; dr++) {\n                for (int dc = 0; dc < 3; dc++) {\n                    best = max(best, grid[r + dr][c + dc]);\n                }\n            }\n            out[r][c] = best;\n        }\n    }\n    return out;\n}`,
              c: `int** largestLocal(int** grid, int gridSize, int* gridColSize, int* returnSize, int** returnColumnSizes) {\n    int n = gridSize;\n    int size = n - 2;\n    int** out = (int**) malloc(sizeof(int*) * size);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * size);\n    for (int r = 0; r < size; r++) {\n        out[r] = (int*) malloc(sizeof(int) * size);\n        (*returnColumnSizes)[r] = size;\n        for (int c = 0; c < size; c++) {\n            int best = 0;\n            for (int dr = 0; dr < 3; dr++) {\n                for (int dc = 0; dc < 3; dc++) {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];\n                }\n            }\n            out[r][c] = best;\n        }\n    }\n    *returnSize = size;\n    return out;\n}`,
              csharp: `public static int[][] LargestLocal(int[][] grid)\n{\n    int n = grid.Length;\n    int size = n - 2;\n    int[][] out_ = new int[size][];\n    for (int r = 0; r < size; r++)\n    {\n        out_[r] = new int[size];\n        for (int c = 0; c < size; c++)\n        {\n            int best = 0;\n            for (int dr = 0; dr < 3; dr++)\n            {\n                for (int dc = 0; dc < 3; dc++)\n                {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc];\n                }\n            }\n            out_[r][c] = best;\n        }\n    }\n    return out_;\n}`,
              go: `func largestLocal(grid [][]int) [][]int {\n	n := len(grid)\n	size := n - 2\n	out := make([][]int, size)\n	for r := 0; r < size; r++ {\n		out[r] = make([]int, size)\n		for c := 0; c < size; c++ {\n			best := 0\n			for dr := 0; dr < 3; dr++ {\n				for dc := 0; dc < 3; dc++ {\n					if grid[r+dr][c+dc] > best {\n						best = grid[r+dr][c+dc]\n					}\n				}\n			}\n			out[r][c] = best\n		}\n	}\n	return out\n}`,
              kotlin: `fun largestLocal(grid: Array<IntArray>): Array<IntArray> {\n    val n = grid.size\n    val size = n - 2\n    val out = Array(size) { IntArray(size) }\n    for (r in 0 until size) {\n        for (c in 0 until size) {\n            var best = 0\n            for (dr in 0 until 3) {\n                for (dc in 0 until 3) {\n                    if (grid[r + dr][c + dc] > best) best = grid[r + dr][c + dc]\n                }\n            }\n            out[r][c] = best\n        }\n    }\n    return out\n}`,
              swift: `func largestLocal(_ grid: [[Int]]) -> [[Int]] {\n    let n = grid.count\n    let size = n - 2\n    var out = [[Int]](repeating: [Int](repeating: 0, count: size), count: size)\n    for r in 0..<size {\n        for c in 0..<size {\n            var best = 0\n            for dr in 0..<3 {\n                for dc in 0..<3 {\n                    if grid[r + dr][c + dc] > best { best = grid[r + dr][c + dc] }\n                }\n            }\n            out[r][c] = best\n        }\n    }\n    return out\n}`,
              rust: `fn largestLocal(grid: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let n = grid.len();\n    let size = n - 2;\n    let mut out = vec![vec![0i32; size]; size];\n    for r in 0..size {\n        for c in 0..size {\n            let mut best = 0;\n            for dr in 0..3 {\n                for dc in 0..3 {\n                    if grid[r + dr][c + dc] > best {\n                        best = grid[r + dr][c + dc];\n                    }\n                }\n            }\n            out[r][c] = best;\n        }\n    }\n    out\n}`,
              php: `function largestLocal($grid) {\n    $n = count($grid);\n    $size = $n - 2;\n    $out = array();\n    for ($r = 0; $r < $size; $r++) {\n        $row = array();\n        for ($c = 0; $c < $size; $c++) {\n            $best = 0;\n            for ($dr = 0; $dr < 3; $dr++) {\n                for ($dc = 0; $dc < 3; $dc++) {\n                    if ($grid[$r + $dr][$c + $dc] > $best) $best = $grid[$r + $dr][$c + $dc];\n                }\n            }\n            $row[] = $best;\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
              ruby: `def largestLocal(grid)\n  n = grid.length\n  size = n - 2\n  (0...size).map do |r|\n    (0...size).map do |c|\n      best = 0\n      (0...3).each do |dr|\n        (0...3).each do |dc|\n          best = grid[r + dr][c + dc] if grid[r + dr][c + dc] > best\n        end\n      end\n      best\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Count Servers that Communicate ──────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const rowCount = new Array(m).fill(0);
      const colCount = new Array(n).fill(0);
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) if (grid[r][c] === 1) { rowCount[r]++; colCount[c]++; }
      }
      let total = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) if (grid[r][c] === 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;
      }
      return total;
    };
    return {
      slug: "count-servers-that-communicate",
      title: "Count Servers that Communicate",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "countServers", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a map of a server centre as an `m × n` grid, where `1` marks a server and `0` marks an empty cell.\n\nTwo servers communicate if they sit in the same row or the same column. Return the number of servers that communicate with **at least one** other server.",
        [
          { in: "grid = [[1,0],[0,1]]", out: "0", note: "The two servers share neither a row nor a column." },
          { in: "grid = [[1,0],[1,1]]", out: "3" },
          { in: "grid = [[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]", out: "4" },
        ],
        ["1 <= grid.length, grid[i].length <= 8", "grid[i][j] is 0 or 1."]),
      hints: [
        "No graph traversal is needed — a server is connected exactly when its row or its column holds another server.",
        "One pass tallies the servers per row and per column.",
        "A second pass counts every server whose row count or column count exceeds one.",
      ],
      examples: [
        { input: "[[1,0],[0,1]]", expectedOutput: "0" },
        { input: "[[1,0],[1,1]]", expectedOutput: "3" },
        { input: "[[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 8), cols = ri(rng, 1, 8);
        const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng() < 0.35 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def countServers(grid) -> int:\n    m, n = len(grid), len(grid[0])\n    row_count = [sum(row) for row in grid]\n    col_count = [sum(grid[r][c] for r in range(m)) for c in range(n)]\n    return sum(1 for r in range(m) for c in range(n)\n               if grid[r][c] == 1 and (row_count[r] > 1 or col_count[c] > 1))`,
        javascript: `var countServers = function(grid) {\n    const m = grid.length, n = grid[0].length;\n    const rowCount = new Array(m).fill(0);\n    const colCount = new Array(n).fill(0);\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (grid[r][c] === 1) {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    let total = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (grid[r][c] === 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;\n        }\n    }\n    return total;\n};`,
              typescript: `function countServers(grid: number[][]): number {\n    var m = grid.length;\n    var n = grid[0].length;\n    var rowCount: number[] = [];\n    var colCount: number[] = [];\n    for (var i = 0; i < m; i++) rowCount.push(0);\n    for (var j = 0; j < n; j++) colCount.push(0);\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            if (grid[r][c] === 1) {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    var total = 0;\n    for (var r2 = 0; r2 < m; r2++) {\n        for (var c2 = 0; c2 < n; c2++) {\n            if (grid[r2][c2] === 1 && (rowCount[r2] > 1 || colCount[c2] > 1)) total++;\n        }\n    }\n    return total;\n}`,
              java: `public static int countServers(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[] rowCount = new int[m];\n    int[] colCount = new int[n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;\n        }\n    }\n    return total;\n}`,
              cpp: `int countServers(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> rowCount(m, 0), colCount(n, 0);\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;\n        }\n    }\n    return total;\n}`,
              c: `int countServers(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int* rowCount = (int*) calloc(m, sizeof(int));\n    int* colCount = (int*) calloc(n, sizeof(int));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;\n        }\n    }\n    free(rowCount);\n    free(colCount);\n    return total;\n}`,
              csharp: `public static int CountServers(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int[] rowCount = new int[m];\n    int[] colCount = new int[n];\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (grid[r][c] == 1)\n            {\n                rowCount[r]++;\n                colCount[c]++;\n            }\n        }\n    }\n    int total = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++;\n        }\n    }\n    return total;\n}`,
              go: `func countServers(grid [][]int) int {\n	m, n := len(grid), len(grid[0])\n	rowCount := make([]int, m)\n	colCount := make([]int, n)\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if grid[r][c] == 1 {\n				rowCount[r]++\n				colCount[c]++\n			}\n		}\n	}\n	total := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1) {\n				total++\n			}\n		}\n	}\n	return total\n}`,
              kotlin: `fun countServers(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val rowCount = IntArray(m)\n    val colCount = IntArray(n)\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (grid[r][c] == 1) {\n                rowCount[r]++\n                colCount[c]++\n            }\n        }\n    }\n    var total = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (grid[r][c] == 1 && (rowCount[r] > 1 || colCount[c] > 1)) total++\n        }\n    }\n    return total\n}`,
              swift: `func countServers(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var rowCount = [Int](repeating: 0, count: m)\n    var colCount = [Int](repeating: 0, count: n)\n    for r in 0..<m {\n        for c in 0..<n where grid[r][c] == 1 {\n            rowCount[r] += 1\n            colCount[c] += 1\n        }\n    }\n    var total = 0\n    for r in 0..<m {\n        for c in 0..<n where grid[r][c] == 1 {\n            if rowCount[r] > 1 || colCount[c] > 1 { total += 1 }\n        }\n    }\n    return total\n}`,
              rust: `fn countServers(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut row_count = vec![0i32; m];\n    let mut col_count = vec![0i32; n];\n    for r in 0..m {\n        for c in 0..n {\n            if grid[r][c] == 1 {\n                row_count[r] += 1;\n                col_count[c] += 1;\n            }\n        }\n    }\n    let mut total = 0;\n    for r in 0..m {\n        for c in 0..n {\n            if grid[r][c] == 1 && (row_count[r] > 1 || col_count[c] > 1) {\n                total += 1;\n            }\n        }\n    }\n    total\n}`,
              php: `function countServers($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $rowCount = array_fill(0, $m, 0);\n    $colCount = array_fill(0, $n, 0);\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($grid[$r][$c] === 1) {\n                $rowCount[$r]++;\n                $colCount[$c]++;\n            }\n        }\n    }\n    $total = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($grid[$r][$c] === 1 && ($rowCount[$r] > 1 || $colCount[$c] > 1)) $total++;\n        }\n    }\n    return $total;\n}`,
              ruby: `def countServers(grid)\n  m = grid.length\n  n = grid[0].length\n  row_count = Array.new(m, 0)\n  col_count = Array.new(n, 0)\n  (0...m).each do |r|\n    (0...n).each do |c|\n      if grid[r][c] == 1\n        row_count[r] += 1\n        col_count[c] += 1\n      end\n    end\n  end\n  total = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      total += 1 if grid[r][c] == 1 && (row_count[r] > 1 || col_count[c] > 1)\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Cells with Odd Values in a Matrix ───────────────────────────
  (() => {
    const ref = (m: number, n: number, indices: number[][]) => {
      const rowCount = new Array(m).fill(0);
      const colCount = new Array(n).fill(0);
      for (let i = 0; i < indices.length; i++) { rowCount[indices[i][0]]++; colCount[indices[i][1]]++; }
      let odd = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) if ((rowCount[r] + colCount[c]) % 2 === 1) odd++;
      }
      return odd;
    };
    return {
      slug: "cells-with-odd-values-in-a-matrix",
      title: "Cells with Odd Values in a Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "oddCells", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "indices", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There is an `m × n` matrix that starts out all zeros. You are given `indices`, where each `indices[i] = [r, c]` means: increment **every** cell of row `r` and **every** cell of column `c` by one.\n\nReturn the number of cells holding an odd value after all the operations.",
        [
          { in: "m = 2, n = 3, indices = [[0,1],[1,1]]", out: "6", note: "Every cell ends up odd." },
          { in: "m = 2, n = 2, indices = [[1,1],[0,0]]", out: "0" },
          { in: "m = 1, n = 1, indices = [[0,0]]", out: "0", note: "The single cell is incremented twice." },
        ],
        ["1 <= m, n <= 8", "1 <= indices.length <= 20", "indices[i] is a valid [row, column] pair."]),
      hints: [
        "Simulating the whole matrix works, but you only ever need per-row and per-column tallies.",
        "Cell `(r, c)` ends at `rowCount[r] + colCount[c]`.",
        "Its parity is odd exactly when those two counts have different parities.",
      ],
      examples: [
        { input: "2\n3\n[[0,1],[1,1]]", expectedOutput: "6" },
        { input: "2\n2\n[[1,1],[0,0]]", expectedOutput: "0" },
        { input: "1\n1\n[[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const indices = Array.from({ length: ri(rng, 1, 20) }, () => [ri(rng, 0, m - 1), ri(rng, 0, n - 1)]);
        return { input: `${m}\n${n}\n${fmtIntMat(indices)}`, expectedOutput: String(ref(m, n, indices)) };
      },
      solutions: {
        python: `def oddCells(m: int, n: int, indices) -> int:\n    row_count = [0] * m\n    col_count = [0] * n\n    for r, c in indices:\n        row_count[r] += 1\n        col_count[c] += 1\n    return sum(1 for r in range(m) for c in range(n)\n               if (row_count[r] + col_count[c]) % 2 == 1)`,
        javascript: `var oddCells = function(m, n, indices) {\n    const rowCount = new Array(m).fill(0);\n    const colCount = new Array(n).fill(0);\n    for (let i = 0; i < indices.length; i++) {\n        rowCount[indices[i][0]]++;\n        colCount[indices[i][1]]++;\n    }\n    let odd = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if ((rowCount[r] + colCount[c]) % 2 === 1) odd++;\n        }\n    }\n    return odd;\n};`,
              typescript: `function oddCells(m: number, n: number, indices: number[][]): number {\n    var rowCount: number[] = [];\n    var colCount: number[] = [];\n    for (var i = 0; i < m; i++) rowCount.push(0);\n    for (var j = 0; j < n; j++) colCount.push(0);\n    for (var k = 0; k < indices.length; k++) {\n        rowCount[indices[k][0]]++;\n        colCount[indices[k][1]]++;\n    }\n    var odd = 0;\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            if ((rowCount[r] + colCount[c]) % 2 === 1) odd++;\n        }\n    }\n    return odd;\n}`,
              java: `public static int oddCells(int m, int n, int[][] indices) {\n    int[] rowCount = new int[m];\n    int[] colCount = new int[n];\n    for (int[] idx : indices) {\n        rowCount[idx[0]]++;\n        colCount[idx[1]]++;\n    }\n    int odd = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if ((rowCount[r] + colCount[c]) % 2 == 1) odd++;\n        }\n    }\n    return odd;\n}`,
              cpp: `int oddCells(int m, int n, vector<vector<int>>& indices) {\n    vector<int> rowCount(m, 0), colCount(n, 0);\n    for (vector<int>& idx : indices) {\n        rowCount[idx[0]]++;\n        colCount[idx[1]]++;\n    }\n    int odd = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if ((rowCount[r] + colCount[c]) % 2 == 1) odd++;\n        }\n    }\n    return odd;\n}`,
              c: `int oddCells(int m, int n, int** indices, int indicesSize, int* indicesColSize) {\n    int* rowCount = (int*) calloc(m, sizeof(int));\n    int* colCount = (int*) calloc(n, sizeof(int));\n    for (int k = 0; k < indicesSize; k++) {\n        rowCount[indices[k][0]]++;\n        colCount[indices[k][1]]++;\n    }\n    int odd = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if ((rowCount[r] + colCount[c]) % 2 == 1) odd++;\n        }\n    }\n    free(rowCount);\n    free(colCount);\n    return odd;\n}`,
              csharp: `public static int OddCells(int m, int n, int[][] indices)\n{\n    int[] rowCount = new int[m];\n    int[] colCount = new int[n];\n    foreach (int[] idx in indices)\n    {\n        rowCount[idx[0]]++;\n        colCount[idx[1]]++;\n    }\n    int odd = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if ((rowCount[r] + colCount[c]) % 2 == 1) odd++;\n        }\n    }\n    return odd;\n}`,
              go: `func oddCells(m int, n int, indices [][]int) int {\n	rowCount := make([]int, m)\n	colCount := make([]int, n)\n	for _, idx := range indices {\n		rowCount[idx[0]]++\n		colCount[idx[1]]++\n	}\n	odd := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if (rowCount[r]+colCount[c])%2 == 1 {\n				odd++\n			}\n		}\n	}\n	return odd\n}`,
              kotlin: `fun oddCells(m: Int, n: Int, indices: Array<IntArray>): Int {\n    val rowCount = IntArray(m)\n    val colCount = IntArray(n)\n    for (idx in indices) {\n        rowCount[idx[0]]++\n        colCount[idx[1]]++\n    }\n    var odd = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if ((rowCount[r] + colCount[c]) % 2 == 1) odd++\n        }\n    }\n    return odd\n}`,
              swift: `func oddCells(_ m: Int, _ n: Int, _ indices: [[Int]]) -> Int {\n    var rowCount = [Int](repeating: 0, count: m)\n    var colCount = [Int](repeating: 0, count: n)\n    for idx in indices {\n        rowCount[idx[0]] += 1\n        colCount[idx[1]] += 1\n    }\n    var odd = 0\n    for r in 0..<m {\n        for c in 0..<n {\n            if (rowCount[r] + colCount[c]) % 2 == 1 { odd += 1 }\n        }\n    }\n    return odd\n}`,
              rust: `fn oddCells(m: i32, n: i32, indices: Vec<Vec<i32>>) -> i32 {\n    let rows = m as usize;\n    let cols = n as usize;\n    let mut row_count = vec![0i32; rows];\n    let mut col_count = vec![0i32; cols];\n    for idx in indices.iter() {\n        row_count[idx[0] as usize] += 1;\n        col_count[idx[1] as usize] += 1;\n    }\n    let mut odd = 0;\n    for r in 0..rows {\n        for c in 0..cols {\n            if (row_count[r] + col_count[c]) % 2 == 1 {\n                odd += 1;\n            }\n        }\n    }\n    odd\n}`,
              php: `function oddCells($m, $n, $indices) {\n    $rowCount = array_fill(0, $m, 0);\n    $colCount = array_fill(0, $n, 0);\n    foreach ($indices as $idx) {\n        $rowCount[$idx[0]]++;\n        $colCount[$idx[1]]++;\n    }\n    $odd = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if (($rowCount[$r] + $colCount[$c]) % 2 === 1) $odd++;\n        }\n    }\n    return $odd;\n}`,
              ruby: `def oddCells(m, n, indices)\n  row_count = Array.new(m, 0)\n  col_count = Array.new(n, 0)\n  indices.each do |idx|\n    row_count[idx[0]] += 1\n    col_count[idx[1]] += 1\n  end\n  odd = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      odd += 1 if (row_count[r] + col_count[c]).odd?\n    end\n  end\n  odd\nend`,
      },
    };
  })(),

  // ── Convert 1D Array Into 2D Array ──────────────────────────────
  (() => {
    const ref = (original: number[], m: number, n: number) => {
      if (original.length !== m * n) return [];
      const out: number[][] = [];
      for (let r = 0; r < m; r++) out.push(original.slice(r * n, r * n + n));
      return out;
    };
    return {
      slug: "convert-1d-array-into-2d-array",
      title: "Convert 1D Array Into 2D Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "construct2DArray", params: [{ name: "original", type: "int[]" as const }, { name: "m", type: "int" as const }, { name: "n", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given a 1-D array `original` and two integers `m` and `n`. Build a 2-D array of `m` rows and `n` columns using **all** the elements of `original`, in order: the first `n` elements form the first row, the next `n` the second row, and so on.\n\nIf that is impossible, return an **empty** 2-D array.",
        [
          { in: "original = [1,2,3,4], m = 2, n = 2", out: "[[1,2],[3,4]]" },
          { in: "original = [1,2,3], m = 1, n = 3", out: "[[1,2,3]]" },
          { in: "original = [1,2], m = 1, n = 1", out: "[]", note: "Two elements cannot fill a 1 × 1 grid." },
        ],
        ["1 <= original.length <= 40", "1 <= original[i] <= 100000", "1 <= m, n <= 40"]),
      hints: [
        "The build is possible exactly when `original.length == m * n`.",
        "Then row `r` is the slice from `r * n` to `r * n + n`.",
      ],
      examples: [
        { input: "[1,2,3,4]\n2\n2", expectedOutput: "[[1,2],[3,4]]" },
        { input: "[1,2,3]\n1\n3", expectedOutput: "[[1,2,3]]" },
        { input: "[1,2]\n1\n1", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 24);
        const original = Array.from({ length: len }, () => ri(rng, 1, 100000));
        let m: number, n: number;
        if (rng() < 0.6) {
          const divisors: number[] = [];
          for (let d = 1; d <= len; d++) if (len % d === 0) divisors.push(d);
          m = divisors[ri(rng, 0, divisors.length - 1)];
          n = len / m;
        } else {
          m = ri(rng, 1, 8);
          n = ri(rng, 1, 8);
        }
        return { input: `${fmtIntArr(original)}\n${m}\n${n}`, expectedOutput: fmtIntMat(ref(original, m, n)) };
      },
      solutions: {
        python: `def construct2DArray(original, m: int, n: int):\n    if len(original) != m * n:\n        return []\n    return [original[r * n:(r + 1) * n] for r in range(m)]`,
        javascript: `var construct2DArray = function(original, m, n) {\n    if (original.length !== m * n) return [];\n    const out = [];\n    for (let r = 0; r < m; r++) out.push(original.slice(r * n, r * n + n));\n    return out;\n};`,
              typescript: `function construct2DArray(original: number[], m: number, n: number): number[][] {\n    if (original.length !== m * n) return [];\n    var out: number[][] = [];\n    for (var r = 0; r < m; r++) out.push(original.slice(r * n, r * n + n));\n    return out;\n}`,
              java: `public static int[][] construct2DArray(int[] original, int m, int n) {\n    if (original.length != m * n) return new int[0][];\n    int[][] out = new int[m][n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) out[r][c] = original[r * n + c];\n    }\n    return out;\n}`,
              cpp: `vector<vector<int>> construct2DArray(vector<int>& original, int m, int n) {\n    if ((int) original.size() != m * n) return {};\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) out[r][c] = original[r * n + c];\n    }\n    return out;\n}`,
              c: `int** construct2DArray(int* original, int originalSize, int m, int n, int* returnSize, int** returnColumnSizes) {\n    if (originalSize != m * n) {\n        *returnSize = 0;\n        *returnColumnSizes = (int*) malloc(sizeof(int));\n        return (int**) malloc(sizeof(int*));\n    }\n    int** out = (int**) malloc(sizeof(int*) * m);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * m);\n    for (int r = 0; r < m; r++) {\n        out[r] = (int*) malloc(sizeof(int) * n);\n        (*returnColumnSizes)[r] = n;\n        for (int c = 0; c < n; c++) out[r][c] = original[r * n + c];\n    }\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[][] Construct2DArray(int[] original, int m, int n)\n{\n    if (original.Length != m * n) return new int[0][];\n    int[][] out_ = new int[m][];\n    for (int r = 0; r < m; r++)\n    {\n        out_[r] = new int[n];\n        for (int c = 0; c < n; c++) out_[r][c] = original[r * n + c];\n    }\n    return out_;\n}`,
              go: `func construct2DArray(original []int, m int, n int) [][]int {\n	if len(original) != m*n {\n		return [][]int{}\n	}\n	out := make([][]int, m)\n	for r := 0; r < m; r++ {\n		out[r] = make([]int, n)\n		for c := 0; c < n; c++ {\n			out[r][c] = original[r*n+c]\n		}\n	}\n	return out\n}`,
              kotlin: `fun construct2DArray(original: IntArray, m: Int, n: Int): Array<IntArray> {\n    if (original.size != m * n) return arrayOf()\n    return Array(m) { r -> IntArray(n) { c -> original[r * n + c] } }\n}`,
              swift: `func construct2DArray(_ original: [Int], _ m: Int, _ n: Int) -> [[Int]] {\n    if original.count != m * n { return [] }\n    var out: [[Int]] = []\n    for r in 0..<m {\n        out.append(Array(original[(r * n)..<(r * n + n)]))\n    }\n    return out\n}`,
              rust: `fn construct2DArray(original: Vec<i32>, m: i32, n: i32) -> Vec<Vec<i32>> {\n    let rows = m as usize;\n    let cols = n as usize;\n    if original.len() != rows * cols {\n        return vec![];\n    }\n    let mut out = vec![vec![0i32; cols]; rows];\n    for r in 0..rows {\n        for c in 0..cols {\n            out[r][c] = original[r * cols + c];\n        }\n    }\n    out\n}`,
              php: `function construct2DArray($original, $m, $n) {\n    if (count($original) !== $m * $n) return array();\n    $out = array();\n    for ($r = 0; $r < $m; $r++) {\n        $out[] = array_slice($original, $r * $n, $n);\n    }\n    return $out;\n}`,
              ruby: `def construct2DArray(original, m, n)\n  return [] if original.length != m * n\n  (0...m).map { |r| original[r * n, n] }\nend`,
      },
    };
  })(),

  // ── Valid Sudoku ────────────────────────────────────────────────
  (() => {
    const ref = (board: number[][]) => {
      const rows = Array.from({ length: 9 }, () => new Set<number>());
      const cols = Array.from({ length: 9 }, () => new Set<number>());
      const boxes = Array.from({ length: 9 }, () => new Set<number>());
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const v = board[r][c];
          if (v === 0) continue;
          const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
          if (rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) return false;
          rows[r].add(v); cols[c].add(v); boxes[b].add(v);
        }
      }
      return true;
    };
    return {
      slug: "valid-sudoku",
      title: "Valid Sudoku",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Matrix", "Amazon", "Google", "Meta", "Uber", "Apple"],
      signature: { funcName: "isValidSudoku", params: [{ name: "board", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Determine whether a `9 × 9` Sudoku board is **valid**. Only the filled cells need to be checked, according to three rules:\n\n1. Each row must contain the digits `1-9` without repetition.\n2. Each column must contain the digits `1-9` without repetition.\n3. Each of the nine `3 × 3` sub-boxes must contain the digits `1-9` without repetition.\n\nEmpty cells are represented by `0`. A valid board is not necessarily solvable — only the currently filled cells matter.",
        [
          { in: "board = [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]", out: "true" },
          { in: "board = [[8,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]", out: "false", note: "Two 8s share the top-left 3 × 3 box." },
          { in: "board = [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]]", out: "true", note: "An empty board breaks no rule." },
        ],
        ["board.length == 9", "board[i].length == 9", "0 <= board[i][j] <= 9, where 0 means empty."]),
      hints: [
        "Keep nine sets for the rows, nine for the columns and nine for the boxes.",
        "The box index of `(r, c)` is `(r / 3) * 3 + (c / 3)` using integer division.",
        "One pass over the 81 cells fills and checks all three families at once.",
      ],
      examples: [
        { input: "[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]", expectedOutput: "true" },
        { input: "[[8,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]", expectedOutput: "false" },
        { input: "[[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const base = [
          [5, 3, 4, 6, 7, 8, 9, 1, 2], [6, 7, 2, 1, 9, 5, 3, 4, 8], [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3], [4, 2, 6, 8, 5, 3, 7, 9, 1], [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4], [2, 8, 7, 4, 1, 9, 6, 3, 5], [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ];
        const perm = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const board = base.map((row) => row.map((v) => perm[v - 1]));
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) if (rng() < 0.55) board[r][c] = 0;
        }
        if (rng() < 0.4) {
          const r = ri(rng, 0, 8), c = ri(rng, 0, 8);
          board[r][c] = ri(rng, 0, 9);
        }
        return { input: fmtIntMat(board), expectedOutput: bool(ref(board)) };
      },
      solutions: {
        python: `def isValidSudoku(board) -> bool:\n    rows = [set() for _ in range(9)]\n    cols = [set() for _ in range(9)]\n    boxes = [set() for _ in range(9)]\n    for r in range(9):\n        for c in range(9):\n            v = board[r][c]\n            if v == 0:\n                continue\n            b = (r // 3) * 3 + c // 3\n            if v in rows[r] or v in cols[c] or v in boxes[b]:\n                return False\n            rows[r].add(v)\n            cols[c].add(v)\n            boxes[b].add(v)\n    return True`,
        javascript: `var isValidSudoku = function(board) {\n    const rows = [], cols = [], boxes = [];\n    for (let i = 0; i < 9; i++) {\n        rows.push(new Set());\n        cols.push(new Set());\n        boxes.push(new Set());\n    }\n    for (let r = 0; r < 9; r++) {\n        for (let c = 0; c < 9; c++) {\n            const v = board[r][c];\n            if (v === 0) continue;\n            const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);\n            if (rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) return false;\n            rows[r].add(v);\n            cols[c].add(v);\n            boxes[b].add(v);\n        }\n    }\n    return true;\n};`,
              typescript: `function isValidSudoku(board: number[][]): boolean {\n    var rows: boolean[][] = [];\n    var cols: boolean[][] = [];\n    var boxes: boolean[][] = [];\n    for (var i = 0; i < 9; i++) {\n        var a: boolean[] = [];\n        var b: boolean[] = [];\n        var d: boolean[] = [];\n        for (var j = 0; j < 10; j++) { a.push(false); b.push(false); d.push(false); }\n        rows.push(a);\n        cols.push(b);\n        boxes.push(d);\n    }\n    for (var r = 0; r < 9; r++) {\n        for (var c = 0; c < 9; c++) {\n            var v = board[r][c];\n            if (v === 0) continue;\n            var box = Math.floor(r / 3) * 3 + Math.floor(c / 3);\n            if (rows[r][v] || cols[c][v] || boxes[box][v]) return false;\n            rows[r][v] = true;\n            cols[c][v] = true;\n            boxes[box][v] = true;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean isValidSudoku(int[][] board) {\n    boolean[][] rows = new boolean[9][10];\n    boolean[][] cols = new boolean[9][10];\n    boolean[][] boxes = new boolean[9][10];\n    for (int r = 0; r < 9; r++) {\n        for (int c = 0; c < 9; c++) {\n            int v = board[r][c];\n            if (v == 0) continue;\n            int box = (r / 3) * 3 + c / 3;\n            if (rows[r][v] || cols[c][v] || boxes[box][v]) return false;\n            rows[r][v] = true;\n            cols[c][v] = true;\n            boxes[box][v] = true;\n        }\n    }\n    return true;\n}`,
              cpp: `bool isValidSudoku(vector<vector<int>>& board) {\n    bool rows[9][10] = {{false}};\n    bool cols[9][10] = {{false}};\n    bool boxes[9][10] = {{false}};\n    for (int r = 0; r < 9; r++) {\n        for (int c = 0; c < 9; c++) {\n            int v = board[r][c];\n            if (v == 0) continue;\n            int box = (r / 3) * 3 + c / 3;\n            if (rows[r][v] || cols[c][v] || boxes[box][v]) return false;\n            rows[r][v] = true;\n            cols[c][v] = true;\n            boxes[box][v] = true;\n        }\n    }\n    return true;\n}`,
              c: `bool isValidSudoku(int** board, int boardSize, int* boardColSize) {\n    bool rows[9][10];\n    bool cols[9][10];\n    bool boxes[9][10];\n    for (int i = 0; i < 9; i++) {\n        for (int j = 0; j < 10; j++) {\n            rows[i][j] = false;\n            cols[i][j] = false;\n            boxes[i][j] = false;\n        }\n    }\n    for (int r = 0; r < 9; r++) {\n        for (int c = 0; c < 9; c++) {\n            int v = board[r][c];\n            if (v == 0) continue;\n            int box = (r / 3) * 3 + c / 3;\n            if (rows[r][v] || cols[c][v] || boxes[box][v]) return false;\n            rows[r][v] = true;\n            cols[c][v] = true;\n            boxes[box][v] = true;\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool IsValidSudoku(int[][] board)\n{\n    bool[,] rows = new bool[9, 10];\n    bool[,] cols = new bool[9, 10];\n    bool[,] boxes = new bool[9, 10];\n    for (int r = 0; r < 9; r++)\n    {\n        for (int c = 0; c < 9; c++)\n        {\n            int v = board[r][c];\n            if (v == 0) continue;\n            int box = (r / 3) * 3 + c / 3;\n            if (rows[r, v] || cols[c, v] || boxes[box, v]) return false;\n            rows[r, v] = true;\n            cols[c, v] = true;\n            boxes[box, v] = true;\n        }\n    }\n    return true;\n}`,
              go: `func isValidSudoku(board [][]int) bool {\n	var rows, cols, boxes [9][10]bool\n	for r := 0; r < 9; r++ {\n		for c := 0; c < 9; c++ {\n			v := board[r][c]\n			if v == 0 {\n				continue\n			}\n			box := (r/3)*3 + c/3\n			if rows[r][v] || cols[c][v] || boxes[box][v] {\n				return false\n			}\n			rows[r][v] = true\n			cols[c][v] = true\n			boxes[box][v] = true\n		}\n	}\n	return true\n}`,
              kotlin: `fun isValidSudoku(board: Array<IntArray>): Boolean {\n    val rows = Array(9) { BooleanArray(10) }\n    val cols = Array(9) { BooleanArray(10) }\n    val boxes = Array(9) { BooleanArray(10) }\n    for (r in 0 until 9) {\n        for (c in 0 until 9) {\n            val v = board[r][c]\n            if (v == 0) continue\n            val box = (r / 3) * 3 + c / 3\n            if (rows[r][v] || cols[c][v] || boxes[box][v]) return false\n            rows[r][v] = true\n            cols[c][v] = true\n            boxes[box][v] = true\n        }\n    }\n    return true\n}`,
              swift: `func isValidSudoku(_ board: [[Int]]) -> Bool {\n    var rows = [[Bool]](repeating: [Bool](repeating: false, count: 10), count: 9)\n    var cols = [[Bool]](repeating: [Bool](repeating: false, count: 10), count: 9)\n    var boxes = [[Bool]](repeating: [Bool](repeating: false, count: 10), count: 9)\n    for r in 0..<9 {\n        for c in 0..<9 {\n            let v = board[r][c]\n            if v == 0 { continue }\n            let box = (r / 3) * 3 + c / 3\n            if rows[r][v] || cols[c][v] || boxes[box][v] { return false }\n            rows[r][v] = true\n            cols[c][v] = true\n            boxes[box][v] = true\n        }\n    }\n    return true\n}`,
              rust: `fn isValidSudoku(board: Vec<Vec<i32>>) -> bool {\n    let mut rows = [[false; 10]; 9];\n    let mut cols = [[false; 10]; 9];\n    let mut boxes = [[false; 10]; 9];\n    for r in 0..9 {\n        for c in 0..9 {\n            let v = board[r][c] as usize;\n            if v == 0 {\n                continue;\n            }\n            let b = (r / 3) * 3 + c / 3;\n            if rows[r][v] || cols[c][v] || boxes[b][v] {\n                return false;\n            }\n            rows[r][v] = true;\n            cols[c][v] = true;\n            boxes[b][v] = true;\n        }\n    }\n    true\n}`,
              php: `function isValidSudoku($board) {\n    $rows = array();\n    $cols = array();\n    $boxes = array();\n    for ($i = 0; $i < 9; $i++) {\n        $rows[] = array_fill(0, 10, false);\n        $cols[] = array_fill(0, 10, false);\n        $boxes[] = array_fill(0, 10, false);\n    }\n    for ($r = 0; $r < 9; $r++) {\n        for ($c = 0; $c < 9; $c++) {\n            $v = $board[$r][$c];\n            if ($v === 0) continue;\n            $box = intdiv($r, 3) * 3 + intdiv($c, 3);\n            if ($rows[$r][$v] || $cols[$c][$v] || $boxes[$box][$v]) return false;\n            $rows[$r][$v] = true;\n            $cols[$c][$v] = true;\n            $boxes[$box][$v] = true;\n        }\n    }\n    return true;\n}`,
              ruby: `def isValidSudoku(board)\n  rows = Array.new(9) { Array.new(10, false) }\n  cols = Array.new(9) { Array.new(10, false) }\n  boxes = Array.new(9) { Array.new(10, false) }\n  (0...9).each do |r|\n    (0...9).each do |c|\n      v = board[r][c]\n      next if v == 0\n      box = (r / 3) * 3 + c / 3\n      return false if rows[r][v] || cols[c][v] || boxes[box][v]\n      rows[r][v] = true\n      cols[c][v] = true\n      boxes[box][v] = true\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Find Winner on a Tic Tac Toe Game ───────────────────────────
  (() => {
    const ref = (moves: number[][]) => {
      const board: number[][] = Array.from({ length: 3 }, () => new Array(3).fill(0));
      for (let i = 0; i < moves.length; i++) board[moves[i][0]][moves[i][1]] = i % 2 === 0 ? 1 : 2;
      const lines = [
        [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]],
      ];
      for (const line of lines) {
        const v = board[line[0][0]][line[0][1]];
        if (v !== 0 && v === board[line[1][0]][line[1][1]] && v === board[line[2][0]][line[2][1]]) {
          return v === 1 ? "A" : "B";
        }
      }
      return moves.length === 9 ? "Draw" : "Pending";
    };
    return {
      slug: "find-winner-on-a-tic-tac-toe-game",
      title: "Find Winner on a Tic Tac Toe Game",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Matrix", "Simulation", "Amazon", "Adobe", "Microsoft"],
      signature: { funcName: "tictactoe", params: [{ name: "moves", type: "int[][]" as const }], returns: "string" as const },
      description: describe(
        "Two players take turns on a `3 × 3` grid. **A** always moves first and places `X`; **B** places `O`. `moves[i] = [row, col]` is the cell claimed on the i-th turn, and no cell is claimed twice.\n\nReturn `\"A\"` or `\"B\"` if that player has three in a row (horizontally, vertically or diagonally), `\"Draw\"` if all nine cells are filled with no winner, and `\"Pending\"` if the game is unfinished.",
        [
          { in: "moves = [[0,0],[2,0],[1,1],[2,1],[2,2]]", out: "A", note: "A holds the main diagonal." },
          { in: "moves = [[0,0],[1,1],[0,1],[0,2],[1,0],[2,0]]", out: "B", note: "B holds the anti-diagonal." },
          { in: "moves = [[0,0],[1,1]]", out: "Pending" },
        ],
        ["1 <= moves.length <= 9", "moves[i].length == 2", "0 <= moves[i][j] <= 2", "No cell is claimed twice."]),
      hints: [
        "Replay the moves onto a 3 × 3 board — even moves belong to A, odd moves to B.",
        "Then check the eight lines: three rows, three columns and two diagonals.",
        "Only after finding no winner does the move count decide between Draw and Pending.",
      ],
      examples: [
        { input: "[[0,0],[2,0],[1,1],[2,1],[2,2]]", expectedOutput: "A" },
        { input: "[[0,0],[1,1],[0,1],[0,2],[1,0],[2,0]]", expectedOutput: "B" },
        { input: "[[0,0],[1,1]]", expectedOutput: "Pending" },
      ],
      gen: (rng: Rng) => {
        const cells: number[][] = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([r, c]);
        shuffle(rng, cells);
        const take = ri(rng, 1, 9);
        const moves = cells.slice(0, take);
        return { input: fmtIntMat(moves), expectedOutput: ref(moves) };
      },
      solutions: {
        python: `def tictactoe(moves) -> str:\n    board = [[0] * 3 for _ in range(3)]\n    for i, (r, c) in enumerate(moves):\n        board[r][c] = 1 if i % 2 == 0 else 2\n    lines = [\n        [(0, 0), (0, 1), (0, 2)], [(1, 0), (1, 1), (1, 2)], [(2, 0), (2, 1), (2, 2)],\n        [(0, 0), (1, 0), (2, 0)], [(0, 1), (1, 1), (2, 1)], [(0, 2), (1, 2), (2, 2)],\n        [(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)],\n    ]\n    for line in lines:\n        a, b, c = line\n        v = board[a[0]][a[1]]\n        if v != 0 and v == board[b[0]][b[1]] and v == board[c[0]][c[1]]:\n            return "A" if v == 1 else "B"\n    return "Draw" if len(moves) == 9 else "Pending"`,
        javascript: `var tictactoe = function(moves) {\n    const board = [];\n    for (let r = 0; r < 3; r++) board.push(new Array(3).fill(0));\n    for (let i = 0; i < moves.length; i++) {\n        board[moves[i][0]][moves[i][1]] = i % 2 === 0 ? 1 : 2;\n    }\n    const lines = [\n        [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],\n        [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],\n        [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]\n    ];\n    for (let i = 0; i < lines.length; i++) {\n        const line = lines[i];\n        const v = board[line[0][0]][line[0][1]];\n        if (v !== 0 && v === board[line[1][0]][line[1][1]] && v === board[line[2][0]][line[2][1]]) {\n            return v === 1 ? "A" : "B";\n        }\n    }\n    return moves.length === 9 ? "Draw" : "Pending";\n};`,
              typescript: `function tictactoe(moves: number[][]): string {\n    var board: number[][] = [];\n    for (var i = 0; i < 3; i++) board.push([0, 0, 0]);\n    for (var k = 0; k < moves.length; k++) {\n        board[moves[k][0]][moves[k][1]] = k % 2 === 0 ? 1 : 2;\n    }\n    var lines = [\n        [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],\n        [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],\n        [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]\n    ];\n    for (var i2 = 0; i2 < lines.length; i2++) {\n        var line = lines[i2];\n        var v = board[line[0][0]][line[0][1]];\n        if (v !== 0 && v === board[line[1][0]][line[1][1]] && v === board[line[2][0]][line[2][1]]) {\n            return v === 1 ? "A" : "B";\n        }\n    }\n    return moves.length === 9 ? "Draw" : "Pending";\n}`,
              java: `public static String tictactoe(int[][] moves) {\n    int[][] board = new int[3][3];\n    for (int k = 0; k < moves.length; k++) {\n        board[moves[k][0]][moves[k][1]] = k % 2 == 0 ? 1 : 2;\n    }\n    int[][][] lines = {\n        {{0, 0}, {0, 1}, {0, 2}}, {{1, 0}, {1, 1}, {1, 2}}, {{2, 0}, {2, 1}, {2, 2}},\n        {{0, 0}, {1, 0}, {2, 0}}, {{0, 1}, {1, 1}, {2, 1}}, {{0, 2}, {1, 2}, {2, 2}},\n        {{0, 0}, {1, 1}, {2, 2}}, {{0, 2}, {1, 1}, {2, 0}}\n    };\n    for (int[][] line : lines) {\n        int v = board[line[0][0]][line[0][1]];\n        if (v != 0 && v == board[line[1][0]][line[1][1]] && v == board[line[2][0]][line[2][1]]) {\n            return v == 1 ? "A" : "B";\n        }\n    }\n    return moves.length == 9 ? "Draw" : "Pending";\n}`,
              cpp: `string tictactoe(vector<vector<int>>& moves) {\n    int board[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};\n    for (int k = 0; k < (int) moves.size(); k++) {\n        board[moves[k][0]][moves[k][1]] = k % 2 == 0 ? 1 : 2;\n    }\n    int lines[8][3][2] = {\n        {{0, 0}, {0, 1}, {0, 2}}, {{1, 0}, {1, 1}, {1, 2}}, {{2, 0}, {2, 1}, {2, 2}},\n        {{0, 0}, {1, 0}, {2, 0}}, {{0, 1}, {1, 1}, {2, 1}}, {{0, 2}, {1, 2}, {2, 2}},\n        {{0, 0}, {1, 1}, {2, 2}}, {{0, 2}, {1, 1}, {2, 0}}\n    };\n    for (int i = 0; i < 8; i++) {\n        int v = board[lines[i][0][0]][lines[i][0][1]];\n        if (v != 0 && v == board[lines[i][1][0]][lines[i][1][1]] && v == board[lines[i][2][0]][lines[i][2][1]]) {\n            return v == 1 ? "A" : "B";\n        }\n    }\n    return moves.size() == 9 ? "Draw" : "Pending";\n}`,
              c: `char* tictactoe(int** moves, int movesSize, int* movesColSize) {\n    int board[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};\n    for (int k = 0; k < movesSize; k++) {\n        board[moves[k][0]][moves[k][1]] = k % 2 == 0 ? 1 : 2;\n    }\n    int lines[8][3][2] = {\n        {{0, 0}, {0, 1}, {0, 2}}, {{1, 0}, {1, 1}, {1, 2}}, {{2, 0}, {2, 1}, {2, 2}},\n        {{0, 0}, {1, 0}, {2, 0}}, {{0, 1}, {1, 1}, {2, 1}}, {{0, 2}, {1, 2}, {2, 2}},\n        {{0, 0}, {1, 1}, {2, 2}}, {{0, 2}, {1, 1}, {2, 0}}\n    };\n    char* out = (char*) malloc(16);\n    for (int i = 0; i < 8; i++) {\n        int v = board[lines[i][0][0]][lines[i][0][1]];\n        if (v != 0 && v == board[lines[i][1][0]][lines[i][1][1]] && v == board[lines[i][2][0]][lines[i][2][1]]) {\n            strcpy(out, v == 1 ? "A" : "B");\n            return out;\n        }\n    }\n    strcpy(out, movesSize == 9 ? "Draw" : "Pending");\n    return out;\n}`,
              csharp: `public static string Tictactoe(int[][] moves)\n{\n    int[,] board = new int[3, 3];\n    for (int k = 0; k < moves.Length; k++)\n    {\n        board[moves[k][0], moves[k][1]] = k % 2 == 0 ? 1 : 2;\n    }\n    int[][][] lines = new int[][][] {\n        new int[][] { new int[] {0,0}, new int[] {0,1}, new int[] {0,2} },\n        new int[][] { new int[] {1,0}, new int[] {1,1}, new int[] {1,2} },\n        new int[][] { new int[] {2,0}, new int[] {2,1}, new int[] {2,2} },\n        new int[][] { new int[] {0,0}, new int[] {1,0}, new int[] {2,0} },\n        new int[][] { new int[] {0,1}, new int[] {1,1}, new int[] {2,1} },\n        new int[][] { new int[] {0,2}, new int[] {1,2}, new int[] {2,2} },\n        new int[][] { new int[] {0,0}, new int[] {1,1}, new int[] {2,2} },\n        new int[][] { new int[] {0,2}, new int[] {1,1}, new int[] {2,0} }\n    };\n    foreach (int[][] line in lines)\n    {\n        int v = board[line[0][0], line[0][1]];\n        if (v != 0 && v == board[line[1][0], line[1][1]] && v == board[line[2][0], line[2][1]])\n        {\n            return v == 1 ? "A" : "B";\n        }\n    }\n    return moves.Length == 9 ? "Draw" : "Pending";\n}`,
              go: `func tictactoe(moves [][]int) string {\n	var board [3][3]int\n	for k, mv := range moves {\n		if k%2 == 0 {\n			board[mv[0]][mv[1]] = 1\n		} else {\n			board[mv[0]][mv[1]] = 2\n		}\n	}\n	lines := [8][3][2]int{\n		{{0, 0}, {0, 1}, {0, 2}}, {{1, 0}, {1, 1}, {1, 2}}, {{2, 0}, {2, 1}, {2, 2}},\n		{{0, 0}, {1, 0}, {2, 0}}, {{0, 1}, {1, 1}, {2, 1}}, {{0, 2}, {1, 2}, {2, 2}},\n		{{0, 0}, {1, 1}, {2, 2}}, {{0, 2}, {1, 1}, {2, 0}},\n	}\n	for i := 0; i < 8; i++ {\n		v := board[lines[i][0][0]][lines[i][0][1]]\n		if v != 0 && v == board[lines[i][1][0]][lines[i][1][1]] && v == board[lines[i][2][0]][lines[i][2][1]] {\n			if v == 1 {\n				return "A"\n			}\n			return "B"\n		}\n	}\n	if len(moves) == 9 {\n		return "Draw"\n	}\n	return "Pending"\n}`,
              kotlin: `fun tictactoe(moves: Array<IntArray>): String {\n    val board = Array(3) { IntArray(3) }\n    for (k in moves.indices) {\n        board[moves[k][0]][moves[k][1]] = if (k % 2 == 0) 1 else 2\n    }\n    val lines = arrayOf(\n        arrayOf(intArrayOf(0, 0), intArrayOf(0, 1), intArrayOf(0, 2)),\n        arrayOf(intArrayOf(1, 0), intArrayOf(1, 1), intArrayOf(1, 2)),\n        arrayOf(intArrayOf(2, 0), intArrayOf(2, 1), intArrayOf(2, 2)),\n        arrayOf(intArrayOf(0, 0), intArrayOf(1, 0), intArrayOf(2, 0)),\n        arrayOf(intArrayOf(0, 1), intArrayOf(1, 1), intArrayOf(2, 1)),\n        arrayOf(intArrayOf(0, 2), intArrayOf(1, 2), intArrayOf(2, 2)),\n        arrayOf(intArrayOf(0, 0), intArrayOf(1, 1), intArrayOf(2, 2)),\n        arrayOf(intArrayOf(0, 2), intArrayOf(1, 1), intArrayOf(2, 0))\n    )\n    for (line in lines) {\n        val v = board[line[0][0]][line[0][1]]\n        if (v != 0 && v == board[line[1][0]][line[1][1]] && v == board[line[2][0]][line[2][1]]) {\n            return if (v == 1) "A" else "B"\n        }\n    }\n    return if (moves.size == 9) "Draw" else "Pending"\n}`,
              swift: `func tictactoe(_ moves: [[Int]]) -> String {\n    var board = [[Int]](repeating: [Int](repeating: 0, count: 3), count: 3)\n    for k in 0..<moves.count {\n        board[moves[k][0]][moves[k][1]] = k % 2 == 0 ? 1 : 2\n    }\n    let lines: [[(Int, Int)]] = [\n        [(0, 0), (0, 1), (0, 2)], [(1, 0), (1, 1), (1, 2)], [(2, 0), (2, 1), (2, 2)],\n        [(0, 0), (1, 0), (2, 0)], [(0, 1), (1, 1), (2, 1)], [(0, 2), (1, 2), (2, 2)],\n        [(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]\n    ]\n    for line in lines {\n        let v = board[line[0].0][line[0].1]\n        if v != 0 && v == board[line[1].0][line[1].1] && v == board[line[2].0][line[2].1] {\n            return v == 1 ? "A" : "B"\n        }\n    }\n    return moves.count == 9 ? "Draw" : "Pending"\n}`,
              rust: `fn tictactoe(moves: Vec<Vec<i32>>) -> String {\n    let mut board = [[0i32; 3]; 3];\n    for k in 0..moves.len() {\n        board[moves[k][0] as usize][moves[k][1] as usize] = if k % 2 == 0 { 1 } else { 2 };\n    }\n    let lines: [[(usize, usize); 3]; 8] = [\n        [(0, 0), (0, 1), (0, 2)], [(1, 0), (1, 1), (1, 2)], [(2, 0), (2, 1), (2, 2)],\n        [(0, 0), (1, 0), (2, 0)], [(0, 1), (1, 1), (2, 1)], [(0, 2), (1, 2), (2, 2)],\n        [(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)],\n    ];\n    for line in lines.iter() {\n        let v = board[line[0].0][line[0].1];\n        if v != 0 && v == board[line[1].0][line[1].1] && v == board[line[2].0][line[2].1] {\n            return String::from(if v == 1 { "A" } else { "B" });\n        }\n    }\n    String::from(if moves.len() == 9 { "Draw" } else { "Pending" })\n}`,
              php: `function tictactoe($moves) {\n    $board = array(array(0, 0, 0), array(0, 0, 0), array(0, 0, 0));\n    for ($k = 0; $k < count($moves); $k++) {\n        $board[$moves[$k][0]][$moves[$k][1]] = $k % 2 === 0 ? 1 : 2;\n    }\n    $lines = array(\n        array(array(0,0), array(0,1), array(0,2)),\n        array(array(1,0), array(1,1), array(1,2)),\n        array(array(2,0), array(2,1), array(2,2)),\n        array(array(0,0), array(1,0), array(2,0)),\n        array(array(0,1), array(1,1), array(2,1)),\n        array(array(0,2), array(1,2), array(2,2)),\n        array(array(0,0), array(1,1), array(2,2)),\n        array(array(0,2), array(1,1), array(2,0))\n    );\n    foreach ($lines as $line) {\n        $v = $board[$line[0][0]][$line[0][1]];\n        if ($v !== 0 && $v === $board[$line[1][0]][$line[1][1]] && $v === $board[$line[2][0]][$line[2][1]]) {\n            return $v === 1 ? "A" : "B";\n        }\n    }\n    return count($moves) === 9 ? "Draw" : "Pending";\n}`,
              ruby: `def tictactoe(moves)\n  board = Array.new(3) { Array.new(3, 0) }\n  moves.each_with_index do |mv, k|\n    board[mv[0]][mv[1]] = k.even? ? 1 : 2\n  end\n  lines = [\n    [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],\n    [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],\n    [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]\n  ]\n  lines.each do |line|\n    v = board[line[0][0]][line[0][1]]\n    if v != 0 && v == board[line[1][0]][line[1][1]] && v == board[line[2][0]][line[2][1]]\n      return v == 1 ? "A" : "B"\n    end\n  end\n  moves.length == 9 ? "Draw" : "Pending"\nend`,
      },
    };
  })(),

  // ── Matrix Cells in Distance Order ──────────────────────────────
  (() => {
    const ref = (rows: number, cols: number, rCenter: number, cCenter: number) => {
      const cells: number[][] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
      cells.sort((a, b) => {
        const da = Math.abs(a[0] - rCenter) + Math.abs(a[1] - cCenter);
        const db = Math.abs(b[0] - rCenter) + Math.abs(b[1] - cCenter);
        if (da !== db) return da - db;
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
      });
      return cells;
    };
    return {
      slug: "matrix-cells-in-distance-order",
      title: "Matrix Cells in Distance Order",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Matrix", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "allCellsDistOrder", params: [{ name: "rows", type: "int" as const }, { name: "cols", type: "int" as const }, { name: "rCenter", type: "int" as const }, { name: "cCenter", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given four integers describing a `rows × cols` matrix and a starting cell `(rCenter, cCenter)`.\n\nReturn the coordinates of **all** the cells, sorted by their Manhattan distance from the centre. Ties are broken by **row** and then by **column**, both ascending.\n\nThe Manhattan distance between `(r1, c1)` and `(r2, c2)` is `abs(r1 - r2) + abs(c1 - c2)`.",
        [
          { in: "rows = 1, cols = 2, rCenter = 0, cCenter = 0", out: "[[0,0],[0,1]]" },
          { in: "rows = 2, cols = 2, rCenter = 0, cCenter = 1", out: "[[0,1],[0,0],[1,1],[1,0]]" },
          { in: "rows = 2, cols = 3, rCenter = 1, cCenter = 2", out: "[[1,2],[0,2],[1,1],[0,1],[1,0],[0,0]]" },
        ],
        ["1 <= rows, cols <= 8", "0 <= rCenter < rows", "0 <= cCenter < cols"]),
      hints: [
        "Generate every cell, then sort by the distance key.",
        "State the tie-break explicitly — distance alone leaves many valid orders, and this problem fixes one.",
        "A bucket sort by distance also works, since the distance is bounded by `rows + cols`.",
      ],
      examples: [
        { input: "1\n2\n0\n0", expectedOutput: "[[0,0],[0,1]]" },
        { input: "2\n2\n0\n1", expectedOutput: "[[0,1],[0,0],[1,1],[1,0]]" },
        { input: "2\n3\n1\n2", expectedOutput: "[[1,2],[0,2],[1,1],[0,1],[1,0],[0,0]]" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 8), cols = ri(rng, 1, 8);
        const rCenter = ri(rng, 0, rows - 1), cCenter = ri(rng, 0, cols - 1);
        return { input: `${rows}\n${cols}\n${rCenter}\n${cCenter}`, expectedOutput: fmtIntMat(ref(rows, cols, rCenter, cCenter)) };
      },
      solutions: {
        python: `def allCellsDistOrder(rows: int, cols: int, rCenter: int, cCenter: int):\n    cells = [[r, c] for r in range(rows) for c in range(cols)]\n    cells.sort(key=lambda cell: (abs(cell[0] - rCenter) + abs(cell[1] - cCenter), cell[0], cell[1]))\n    return cells`,
        javascript: `var allCellsDistOrder = function(rows, cols, rCenter, cCenter) {\n    const cells = [];\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) cells.push([r, c]);\n    }\n    cells.sort(function(a, b) {\n        const da = Math.abs(a[0] - rCenter) + Math.abs(a[1] - cCenter);\n        const db = Math.abs(b[0] - rCenter) + Math.abs(b[1] - cCenter);\n        if (da !== db) return da - db;\n        if (a[0] !== b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return cells;\n};`,
              typescript: `function allCellsDistOrder(rows: number, cols: number, rCenter: number, cCenter: number): number[][] {\n    var cells: number[][] = [];\n    for (var r = 0; r < rows; r++) {\n        for (var c = 0; c < cols; c++) cells.push([r, c]);\n    }\n    cells.sort(function (a, b) {\n        var da = Math.abs(a[0] - rCenter) + Math.abs(a[1] - cCenter);\n        var db = Math.abs(b[0] - rCenter) + Math.abs(b[1] - cCenter);\n        if (da !== db) return da - db;\n        if (a[0] !== b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return cells;\n}`,
              java: `public static int[][] allCellsDistOrder(int rows, int cols, int rCenter, int cCenter) {\n    int[][] cells = new int[rows * cols][2];\n    int pos = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            cells[pos][0] = r;\n            cells[pos][1] = c;\n            pos++;\n        }\n    }\n    Arrays.sort(cells, new Comparator<int[]>() {\n        public int compare(int[] a, int[] b) {\n            int da = Math.abs(a[0] - rCenter) + Math.abs(a[1] - cCenter);\n            int db = Math.abs(b[0] - rCenter) + Math.abs(b[1] - cCenter);\n            if (da != db) return da - db;\n            if (a[0] != b[0]) return a[0] - b[0];\n            return a[1] - b[1];\n        }\n    });\n    return cells;\n}`,
              cpp: `vector<vector<int>> allCellsDistOrder(int rows, int cols, int rCenter, int cCenter) {\n    vector<vector<int>> cells;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) cells.push_back({r, c});\n    }\n    sort(cells.begin(), cells.end(), [rCenter, cCenter](const vector<int>& a, const vector<int>& b) {\n        int da = abs(a[0] - rCenter) + abs(a[1] - cCenter);\n        int db = abs(b[0] - rCenter) + abs(b[1] - cCenter);\n        if (da != db) return da < db;\n        if (a[0] != b[0]) return a[0] < b[0];\n        return a[1] < b[1];\n    });\n    return cells;\n}`,
              c: `int** allCellsDistOrder(int rows, int cols, int rCenter, int cCenter, int* returnSize, int** returnColumnSizes) {\n    int total = rows * cols;\n    int** cells = (int**) malloc(sizeof(int*) * total);\n    *returnColumnSizes = (int*) malloc(sizeof(int) * total);\n    int pos = 0;\n    for (int d = 0; d <= rows + cols; d++) {\n        for (int r = 0; r < rows; r++) {\n            for (int c = 0; c < cols; c++) {\n                int dr = r - rCenter;\n                if (dr < 0) dr = -dr;\n                int dc = c - cCenter;\n                if (dc < 0) dc = -dc;\n                if (dr + dc != d) continue;\n                cells[pos] = (int*) malloc(sizeof(int) * 2);\n                cells[pos][0] = r;\n                cells[pos][1] = c;\n                (*returnColumnSizes)[pos] = 2;\n                pos++;\n            }\n        }\n    }\n    *returnSize = total;\n    return cells;\n}`,
              csharp: `public static int[][] AllCellsDistOrder(int rows, int cols, int rCenter, int cCenter)\n{\n    var cells = new List<int[]>();\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++) cells.Add(new int[] { r, c });\n    }\n    cells.Sort(delegate (int[] a, int[] b)\n    {\n        int da = Math.Abs(a[0] - rCenter) + Math.Abs(a[1] - cCenter);\n        int db = Math.Abs(b[0] - rCenter) + Math.Abs(b[1] - cCenter);\n        if (da != db) return da - db;\n        if (a[0] != b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return cells.ToArray();\n}`,
              go: `func allCellsDistOrder(rows int, cols int, rCenter int, cCenter int) [][]int {\n	abs := func(x int) int {\n		if x < 0 {\n			return -x\n		}\n		return x\n	}\n	cells := make([][]int, 0, rows*cols)\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			cells = append(cells, []int{r, c})\n		}\n	}\n	sort.Slice(cells, func(i, j int) bool {\n		a, b := cells[i], cells[j]\n		da := abs(a[0]-rCenter) + abs(a[1]-cCenter)\n		db := abs(b[0]-rCenter) + abs(b[1]-cCenter)\n		if da != db {\n			return da < db\n		}\n		if a[0] != b[0] {\n			return a[0] < b[0]\n		}\n		return a[1] < b[1]\n	})\n	return cells\n}`,
              kotlin: `fun allCellsDistOrder(rows: Int, cols: Int, rCenter: Int, cCenter: Int): Array<IntArray> {\n    val cells = ArrayList<IntArray>()\n    for (r in 0 until rows) {\n        for (c in 0 until cols) cells.add(intArrayOf(r, c))\n    }\n    cells.sortWith(Comparator { a, b ->\n        val da = Math.abs(a[0] - rCenter) + Math.abs(a[1] - cCenter)\n        val db = Math.abs(b[0] - rCenter) + Math.abs(b[1] - cCenter)\n        when {\n            da != db -> da - db\n            a[0] != b[0] -> a[0] - b[0]\n            else -> a[1] - b[1]\n        }\n    })\n    return cells.toTypedArray()\n}`,
              swift: `func allCellsDistOrder(_ rows: Int, _ cols: Int, _ rCenter: Int, _ cCenter: Int) -> [[Int]] {\n    var cells: [[Int]] = []\n    for r in 0..<rows {\n        for c in 0..<cols { cells.append([r, c]) }\n    }\n    cells.sort { a, b in\n        let da = abs(a[0] - rCenter) + abs(a[1] - cCenter)\n        let db = abs(b[0] - rCenter) + abs(b[1] - cCenter)\n        if da != db { return da < db }\n        if a[0] != b[0] { return a[0] < b[0] }\n        return a[1] < b[1]\n    }\n    return cells\n}`,
              rust: `fn allCellsDistOrder(rows: i32, cols: i32, rCenter: i32, cCenter: i32) -> Vec<Vec<i32>> {\n    let mut cells: Vec<Vec<i32>> = Vec::new();\n    for r in 0..rows {\n        for c in 0..cols {\n            cells.push(vec![r, c]);\n        }\n    }\n    cells.sort_by(|a, b| {\n        let da = (a[0] - rCenter).abs() + (a[1] - cCenter).abs();\n        let db = (b[0] - rCenter).abs() + (b[1] - cCenter).abs();\n        da.cmp(&db).then(a[0].cmp(&b[0])).then(a[1].cmp(&b[1]))\n    });\n    cells\n}`,
              php: `function allCellsDistOrder($rows, $cols, $rCenter, $cCenter) {\n    $cells = array();\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) $cells[] = array($r, $c);\n    }\n    usort($cells, function ($a, $b) use ($rCenter, $cCenter) {\n        $da = abs($a[0] - $rCenter) + abs($a[1] - $cCenter);\n        $db = abs($b[0] - $rCenter) + abs($b[1] - $cCenter);\n        if ($da !== $db) return $da - $db;\n        if ($a[0] !== $b[0]) return $a[0] - $b[0];\n        return $a[1] - $b[1];\n    });\n    return $cells;\n}`,
              ruby: `def allCellsDistOrder(rows, cols, rCenter, cCenter)\n  cells = []\n  (0...rows).each do |r|\n    (0...cols).each { |c| cells << [r, c] }\n  end\n  cells.sort_by { |cell| [(cell[0] - rCenter).abs + (cell[1] - cCenter).abs, cell[0], cell[1]] }\nend`,
      },
    };
  })(),

  // ── Projection Area of 3D Shapes ────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      let top = 0, front = 0, side = 0;
      for (let r = 0; r < n; r++) {
        let rowMax = 0, colMax = 0;
        for (let c = 0; c < n; c++) {
          if (grid[r][c] > 0) top++;
          if (grid[r][c] > rowMax) rowMax = grid[r][c];
          if (grid[c][r] > colMax) colMax = grid[c][r];
        }
        side += rowMax;
        front += colMax;
      }
      return top + front + side;
    };
    return {
      slug: "projection-area-of-3d-shapes",
      title: "Projection Area of 3D Shapes",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Geometry", "Matrix", "Amazon", "Google"],
      signature: { funcName: "projectionArea", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n × n` grid where `grid[r][c]` is the height of a tower of `1 × 1 × 1` cubes standing on cell `(r, c)`.\n\nReturn the total area of the three projections: looking straight down (the **xy** plane), from the front (the **yz** plane) and from the side (the **zx** plane).",
        [
          { in: "grid = [[1,2],[3,4]]", out: "17", note: "Top view 4, front view 3 + 4 = 7, side view 2 + 4 = 6." },
          { in: "grid = [[2]]", out: "5", note: "1 from above and 2 from each side." },
          { in: "grid = [[1,0],[0,2]]", out: "8" },
        ],
        ["1 <= grid.length <= 8", "grid[i].length == grid.length", "0 <= grid[i][j] <= 50"]),
      hints: [
        "The top view counts every cell with a non-zero height — one unit of area each.",
        "The side view sums the maximum of each **row**; the front view sums the maximum of each **column**.",
        "One nested loop can accumulate all three at once.",
      ],
      examples: [
        { input: "[[1,2],[3,4]]", expectedOutput: "17" },
        { input: "[[2]]", expectedOutput: "5" },
        { input: "[[1,0],[0,2]]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const grid = randMat(rng, n, n, 0, 50);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def projectionArea(grid) -> int:\n    n = len(grid)\n    top = sum(1 for r in range(n) for c in range(n) if grid[r][c] > 0)\n    side = sum(max(row) for row in grid)\n    front = sum(max(grid[r][c] for r in range(n)) for c in range(n))\n    return top + front + side`,
        javascript: `var projectionArea = function(grid) {\n    const n = grid.length;\n    let top = 0, front = 0, side = 0;\n    for (let r = 0; r < n; r++) {\n        let rowMax = 0, colMax = 0;\n        for (let c = 0; c < n; c++) {\n            if (grid[r][c] > 0) top++;\n            if (grid[r][c] > rowMax) rowMax = grid[r][c];\n            if (grid[c][r] > colMax) colMax = grid[c][r];\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n};`,
              typescript: `function projectionArea(grid: number[][]): number {\n    var n = grid.length;\n    var top = 0;\n    var front = 0;\n    var side = 0;\n    for (var r = 0; r < n; r++) {\n        var rowMax = 0;\n        var colMax = 0;\n        for (var c = 0; c < n; c++) {\n            if (grid[r][c] > 0) top++;\n            if (grid[r][c] > rowMax) rowMax = grid[r][c];\n            if (grid[c][r] > colMax) colMax = grid[c][r];\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n}`,
              java: `public static int projectionArea(int[][] grid) {\n    int n = grid.length;\n    int top = 0, front = 0, side = 0;\n    for (int r = 0; r < n; r++) {\n        int rowMax = 0, colMax = 0;\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] > 0) top++;\n            if (grid[r][c] > rowMax) rowMax = grid[r][c];\n            if (grid[c][r] > colMax) colMax = grid[c][r];\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n}`,
              cpp: `int projectionArea(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    int top = 0, front = 0, side = 0;\n    for (int r = 0; r < n; r++) {\n        int rowMax = 0, colMax = 0;\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] > 0) top++;\n            rowMax = max(rowMax, grid[r][c]);\n            colMax = max(colMax, grid[c][r]);\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n}`,
              c: `int projectionArea(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    int top = 0, front = 0, side = 0;\n    for (int r = 0; r < n; r++) {\n        int rowMax = 0, colMax = 0;\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] > 0) top++;\n            if (grid[r][c] > rowMax) rowMax = grid[r][c];\n            if (grid[c][r] > colMax) colMax = grid[c][r];\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n}`,
              csharp: `public static int ProjectionArea(int[][] grid)\n{\n    int n = grid.Length;\n    int top = 0, front = 0, side = 0;\n    for (int r = 0; r < n; r++)\n    {\n        int rowMax = 0, colMax = 0;\n        for (int c = 0; c < n; c++)\n        {\n            if (grid[r][c] > 0) top++;\n            if (grid[r][c] > rowMax) rowMax = grid[r][c];\n            if (grid[c][r] > colMax) colMax = grid[c][r];\n        }\n        side += rowMax;\n        front += colMax;\n    }\n    return top + front + side;\n}`,
              go: `func projectionArea(grid [][]int) int {\n	n := len(grid)\n	top, front, side := 0, 0, 0\n	for r := 0; r < n; r++ {\n		rowMax, colMax := 0, 0\n		for c := 0; c < n; c++ {\n			if grid[r][c] > 0 {\n				top++\n			}\n			if grid[r][c] > rowMax {\n				rowMax = grid[r][c]\n			}\n			if grid[c][r] > colMax {\n				colMax = grid[c][r]\n			}\n		}\n		side += rowMax\n		front += colMax\n	}\n	return top + front + side\n}`,
              kotlin: `fun projectionArea(grid: Array<IntArray>): Int {\n    val n = grid.size\n    var top = 0\n    var front = 0\n    var side = 0\n    for (r in 0 until n) {\n        var rowMax = 0\n        var colMax = 0\n        for (c in 0 until n) {\n            if (grid[r][c] > 0) top++\n            if (grid[r][c] > rowMax) rowMax = grid[r][c]\n            if (grid[c][r] > colMax) colMax = grid[c][r]\n        }\n        side += rowMax\n        front += colMax\n    }\n    return top + front + side\n}`,
              swift: `func projectionArea(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var top = 0\n    var front = 0\n    var side = 0\n    for r in 0..<n {\n        var rowMax = 0\n        var colMax = 0\n        for c in 0..<n {\n            if grid[r][c] > 0 { top += 1 }\n            if grid[r][c] > rowMax { rowMax = grid[r][c] }\n            if grid[c][r] > colMax { colMax = grid[c][r] }\n        }\n        side += rowMax\n        front += colMax\n    }\n    return top + front + side\n}`,
              rust: `fn projectionArea(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut top = 0;\n    let mut front = 0;\n    let mut side = 0;\n    for r in 0..n {\n        let mut row_max = 0;\n        let mut col_max = 0;\n        for c in 0..n {\n            if grid[r][c] > 0 {\n                top += 1;\n            }\n            if grid[r][c] > row_max {\n                row_max = grid[r][c];\n            }\n            if grid[c][r] > col_max {\n                col_max = grid[c][r];\n            }\n        }\n        side += row_max;\n        front += col_max;\n    }\n    top + front + side\n}`,
              php: `function projectionArea($grid) {\n    $n = count($grid);\n    $top = 0;\n    $front = 0;\n    $side = 0;\n    for ($r = 0; $r < $n; $r++) {\n        $rowMax = 0;\n        $colMax = 0;\n        for ($c = 0; $c < $n; $c++) {\n            if ($grid[$r][$c] > 0) $top++;\n            if ($grid[$r][$c] > $rowMax) $rowMax = $grid[$r][$c];\n            if ($grid[$c][$r] > $colMax) $colMax = $grid[$c][$r];\n        }\n        $side += $rowMax;\n        $front += $colMax;\n    }\n    return $top + $front + $side;\n}`,
              ruby: `def projectionArea(grid)\n  n = grid.length\n  top = 0\n  front = 0\n  side = 0\n  (0...n).each do |r|\n    row_max = 0\n    col_max = 0\n    (0...n).each do |c|\n      top += 1 if grid[r][c] > 0\n      row_max = grid[r][c] if grid[r][c] > row_max\n      col_max = grid[c][r] if grid[c][r] > col_max\n    end\n    side += row_max\n    front += col_max\n  end\n  top + front + side\nend`,
      },
    };
  })(),

  // ── Special Positions in a Binary Matrix ────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length;
      const rowSum = mat.map((row) => row.reduce((a, b) => a + b, 0));
      const colSum: number[] = [];
      for (let c = 0; c < n; c++) {
        let s = 0;
        for (let r = 0; r < m; r++) s += mat[r][c];
        colSum.push(s);
      }
      let count = 0;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) if (mat[r][c] === 1 && rowSum[r] === 1 && colSum[c] === 1) count++;
      }
      return count;
    };
    return {
      slug: "special-positions-in-a-binary-matrix",
      title: "Special Positions in a Binary Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Microsoft"],
      signature: { funcName: "numSpecial", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m × n` binary matrix `mat`, return the number of **special** positions.\n\nA position `(i, j)` is special if `mat[i][j] == 1` and every other element in row `i` and column `j` is `0`.",
        [
          { in: "mat = [[1,0,0],[0,0,1],[1,0,0]]", out: "1", note: "Only (1,2) is alone in both its row and its column." },
          { in: "mat = [[1,0,0],[0,1,0],[0,0,1]]", out: "3" },
          { in: "mat = [[0,0],[0,0]]", out: "0" },
        ],
        ["1 <= mat.length, mat[i].length <= 8", "mat[i][j] is 0 or 1."]),
      hints: [
        "Precompute the sum of every row and every column in one pass.",
        "A cell is special exactly when it holds a 1 and both of those sums equal 1.",
      ],
      examples: [
        { input: "[[1,0,0],[0,0,1],[1,0,0]]", expectedOutput: "1" },
        { input: "[[1,0,0],[0,1,0],[0,0,1]]", expectedOutput: "3" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 8), cols = ri(rng, 1, 8);
        const mat = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng() < 0.3 ? 1 : 0)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: `def numSpecial(mat) -> int:\n    m, n = len(mat), len(mat[0])\n    row_sum = [sum(row) for row in mat]\n    col_sum = [sum(mat[r][c] for r in range(m)) for c in range(n)]\n    return sum(1 for r in range(m) for c in range(n)\n               if mat[r][c] == 1 and row_sum[r] == 1 and col_sum[c] == 1)`,
        javascript: `var numSpecial = function(mat) {\n    const m = mat.length, n = mat[0].length;\n    const rowSum = new Array(m).fill(0);\n    const colSum = new Array(n).fill(0);\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    let count = 0;\n    for (let r = 0; r < m; r++) {\n        for (let c = 0; c < n; c++) {\n            if (mat[r][c] === 1 && rowSum[r] === 1 && colSum[c] === 1) count++;\n        }\n    }\n    return count;\n};`,
              typescript: `function numSpecial(mat: number[][]): number {\n    var m = mat.length;\n    var n = mat[0].length;\n    var rowSum: number[] = [];\n    var colSum: number[] = [];\n    for (var i = 0; i < m; i++) rowSum.push(0);\n    for (var j = 0; j < n; j++) colSum.push(0);\n    for (var r = 0; r < m; r++) {\n        for (var c = 0; c < n; c++) {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    var count = 0;\n    for (var r2 = 0; r2 < m; r2++) {\n        for (var c2 = 0; c2 < n; c2++) {\n            if (mat[r2][c2] === 1 && rowSum[r2] === 1 && colSum[c2] === 1) count++;\n        }\n    }\n    return count;\n}`,
              java: `public static int numSpecial(int[][] mat) {\n    int m = mat.length, n = mat[0].length;\n    int[] rowSum = new int[m];\n    int[] colSum = new int[n];\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1) count++;\n        }\n    }\n    return count;\n}`,
              cpp: `int numSpecial(vector<vector<int>>& mat) {\n    int m = (int) mat.size(), n = (int) mat[0].size();\n    vector<int> rowSum(m, 0), colSum(n, 0);\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1) count++;\n        }\n    }\n    return count;\n}`,
              c: `int numSpecial(int** mat, int matSize, int* matColSize) {\n    int m = matSize, n = matColSize[0];\n    int* rowSum = (int*) calloc(m, sizeof(int));\n    int* colSum = (int*) calloc(n, sizeof(int));\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < m; r++) {\n        for (int c = 0; c < n; c++) {\n            if (mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1) count++;\n        }\n    }\n    free(rowSum);\n    free(colSum);\n    return count;\n}`,
              csharp: `public static int NumSpecial(int[][] mat)\n{\n    int m = mat.Length, n = mat[0].Length;\n    int[] rowSum = new int[m];\n    int[] colSum = new int[n];\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            rowSum[r] += mat[r][c];\n            colSum[c] += mat[r][c];\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < m; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1) count++;\n        }\n    }\n    return count;\n}`,
              go: `func numSpecial(mat [][]int) int {\n	m, n := len(mat), len(mat[0])\n	rowSum := make([]int, m)\n	colSum := make([]int, n)\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			rowSum[r] += mat[r][c]\n			colSum[c] += mat[r][c]\n		}\n	}\n	count := 0\n	for r := 0; r < m; r++ {\n		for c := 0; c < n; c++ {\n			if mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1 {\n				count++\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun numSpecial(mat: Array<IntArray>): Int {\n    val m = mat.size\n    val n = mat[0].size\n    val rowSum = IntArray(m)\n    val colSum = IntArray(n)\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            rowSum[r] += mat[r][c]\n            colSum[c] += mat[r][c]\n        }\n    }\n    var count = 0\n    for (r in 0 until m) {\n        for (c in 0 until n) {\n            if (mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1) count++\n        }\n    }\n    return count\n}`,
              swift: `func numSpecial(_ mat: [[Int]]) -> Int {\n    let m = mat.count\n    let n = mat[0].count\n    var rowSum = [Int](repeating: 0, count: m)\n    var colSum = [Int](repeating: 0, count: n)\n    for r in 0..<m {\n        for c in 0..<n {\n            rowSum[r] += mat[r][c]\n            colSum[c] += mat[r][c]\n        }\n    }\n    var count = 0\n    for r in 0..<m {\n        for c in 0..<n {\n            if mat[r][c] == 1 && rowSum[r] == 1 && colSum[c] == 1 { count += 1 }\n        }\n    }\n    return count\n}`,
              rust: `fn numSpecial(mat: Vec<Vec<i32>>) -> i32 {\n    let m = mat.len();\n    let n = mat[0].len();\n    let mut row_sum = vec![0i32; m];\n    let mut col_sum = vec![0i32; n];\n    for r in 0..m {\n        for c in 0..n {\n            row_sum[r] += mat[r][c];\n            col_sum[c] += mat[r][c];\n        }\n    }\n    let mut count = 0;\n    for r in 0..m {\n        for c in 0..n {\n            if mat[r][c] == 1 && row_sum[r] == 1 && col_sum[c] == 1 {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
              php: `function numSpecial($mat) {\n    $m = count($mat);\n    $n = count($mat[0]);\n    $rowSum = array_fill(0, $m, 0);\n    $colSum = array_fill(0, $n, 0);\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            $rowSum[$r] += $mat[$r][$c];\n            $colSum[$c] += $mat[$r][$c];\n        }\n    }\n    $count = 0;\n    for ($r = 0; $r < $m; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($mat[$r][$c] === 1 && $rowSum[$r] === 1 && $colSum[$c] === 1) $count++;\n        }\n    }\n    return $count;\n}`,
              ruby: `def numSpecial(mat)\n  m = mat.length\n  n = mat[0].length\n  row_sum = Array.new(m, 0)\n  col_sum = Array.new(n, 0)\n  (0...m).each do |r|\n    (0...n).each do |c|\n      row_sum[r] += mat[r][c]\n      col_sum[c] += mat[r][c]\n    end\n  end\n  count = 0\n  (0...m).each do |r|\n    (0...n).each do |c|\n      count += 1 if mat[r][c] == 1 && row_sum[r] == 1 && col_sum[c] == 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),
];

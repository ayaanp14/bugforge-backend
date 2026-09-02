/** Matrix / Grid — hand-authored classics (int[][] support).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtIntMat, ri, type CatalogProblem, type Rng } from "./types.js";

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
      solutions: {
        python: `from typing import List\n\ndef transpose(matrix: List[List[int]]) -> List[List[int]]:\n    return [list(row) for row in zip(*matrix)]`,
        javascript: `var transpose = function(matrix) {\n    const rows = matrix.length, cols = matrix[0].length;\n    const out = [];\n    for (let j = 0; j < cols; j++) {\n        const row = [];\n        for (let i = 0; i < rows; i++) row.push(matrix[i][j]);\n        out.push(row);\n    }\n    return out;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef rotate(matrix: List[List[int]]) -> List[List[int]]:\n    n = len(matrix)\n    return [[matrix[n - 1 - j][i] for j in range(n)] for i in range(n)]`,
        javascript: `var rotate = function(matrix) {\n    const n = matrix.length;\n    const out = [];\n    for (let i = 0; i < n; i++) {\n        const row = [];\n        for (let j = 0; j < n; j++) row.push(matrix[n - 1 - j][i]);\n        out.push(row);\n    }\n    return out;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef spiralOrder(matrix: List[List[int]]) -> List[int]:\n    out = []\n    top, bottom = 0, len(matrix) - 1\n    left, right = 0, len(matrix[0]) - 1\n    while top <= bottom and left <= right:\n        for j in range(left, right + 1):\n            out.append(matrix[top][j])\n        top += 1\n        for i in range(top, bottom + 1):\n            out.append(matrix[i][right])\n        right -= 1\n        if top <= bottom:\n            for j in range(right, left - 1, -1):\n                out.append(matrix[bottom][j])\n            bottom -= 1\n        if left <= right:\n            for i in range(bottom, top - 1, -1):\n                out.append(matrix[i][left])\n            left += 1\n    return out`,
        javascript: `var spiralOrder = function(matrix) {\n    const out = [];\n    let top = 0, bottom = matrix.length - 1;\n    let left = 0, right = matrix[0].length - 1;\n    while (top <= bottom && left <= right) {\n        for (let j = left; j <= right; j++) out.push(matrix[top][j]);\n        top++;\n        for (let i = top; i <= bottom; i++) out.push(matrix[i][right]);\n        right--;\n        if (top <= bottom) {\n            for (let j = right; j >= left; j--) out.push(matrix[bottom][j]);\n            bottom--;\n        }\n        if (left <= right) {\n            for (let i = bottom; i >= top; i--) out.push(matrix[i][left]);\n            left++;\n        }\n    }\n    return out;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef setZeroes(matrix: List[List[int]]) -> List[List[int]]:\n    rows = set()\n    cols = set()\n    for i, row in enumerate(matrix):\n        for j, v in enumerate(row):\n            if v == 0:\n                rows.add(i)\n                cols.add(j)\n    for i in range(len(matrix)):\n        for j in range(len(matrix[0])):\n            if i in rows or j in cols:\n                matrix[i][j] = 0\n    return matrix`,
        javascript: `var setZeroes = function(matrix) {\n    const rows = new Set(), cols = new Set();\n    for (let i = 0; i < matrix.length; i++) {\n        for (let j = 0; j < matrix[0].length; j++) {\n            if (matrix[i][j] === 0) { rows.add(i); cols.add(j); }\n        }\n    }\n    for (let i = 0; i < matrix.length; i++) {\n        for (let j = 0; j < matrix[0].length; j++) {\n            if (rows.has(i) || cols.has(j)) matrix[i][j] = 0;\n        }\n    }\n    return matrix;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef searchMatrix(matrix: List[List[int]], target: int) -> bool:\n    m, n = len(matrix), len(matrix[0])\n    lo, hi = 0, m * n - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        v = matrix[mid // n][mid % n]\n        if v == target:\n            return True\n        if v < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False`,
        javascript: `var searchMatrix = function(matrix, target) {\n    const m = matrix.length, n = matrix[0].length;\n    let lo = 0, hi = m * n - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        const v = matrix[Math.floor(mid / n)][mid % n];\n        if (v === target) return true;\n        if (v < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef generate(numRows: int) -> List[List[int]]:\n    out = [[1]]\n    for i in range(1, numRows):\n        prev = out[-1]\n        row = [1]\n        for j in range(1, i):\n            row.append(prev[j - 1] + prev[j])\n        row.append(1)\n        out.append(row)\n    return out[:numRows]`,
        javascript: `var generate = function(numRows) {\n    const out = [[1]];\n    for (let i = 1; i < numRows; i++) {\n        const prev = out[i - 1];\n        const row = [1];\n        for (let j = 1; j < i; j++) row.push(prev[j - 1] + prev[j]);\n        row.push(1);\n        out.push(row);\n    }\n    return out.slice(0, numRows);\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef diagonalSum(mat: List[List[int]]) -> int:\n    n = len(mat)\n    total = 0\n    for i in range(n):\n        total += mat[i][i] + mat[i][n - 1 - i]\n    if n % 2 == 1:\n        total -= mat[n // 2][n // 2]\n    return total`,
        javascript: `var diagonalSum = function(mat) {\n    const n = mat.length;\n    let sum = 0;\n    for (let i = 0; i < n; i++) {\n        sum += mat[i][i] + mat[i][n - 1 - i];\n    }\n    if (n % 2 === 1) sum -= mat[(n - 1) / 2][(n - 1) / 2];\n    return sum;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef maximumWealth(accounts: List[List[int]]) -> int:\n    return max(sum(a) for a in accounts)`,
        javascript: `var maximumWealth = function(accounts) {\n    let best = 0;\n    for (const a of accounts) {\n        let sum = 0;\n        for (const x of a) sum += x;\n        best = Math.max(best, sum);\n    }\n    return best;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef floodFill(image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:\n    old = image[sr][sc]\n    if old == color:\n        return image\n    stack = [(sr, sc)]\n    while stack:\n        i, j = stack.pop()\n        if i < 0 or j < 0 or i >= len(image) or j >= len(image[0]) or image[i][j] != old:\n            continue\n        image[i][j] = color\n        stack.extend([(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)])\n    return image`,
        javascript: `var floodFill = function(image, sr, sc, color) {\n    const old = image[sr][sc];\n    if (old === color) return image;\n    const stack = [[sr, sc]];\n    while (stack.length > 0) {\n        const cell = stack.pop();\n        const i = cell[0], j = cell[1];\n        if (i < 0 || j < 0 || i >= image.length || j >= image[0].length || image[i][j] !== old) continue;\n        image[i][j] = color;\n        stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);\n    }\n    return image;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef islandPerimeter(grid: List[List[int]]) -> int:\n    per = 0\n    for i in range(len(grid)):\n        for j in range(len(grid[0])):\n            if grid[i][j] != 1:\n                continue\n            per += 4\n            if i > 0 and grid[i - 1][j] == 1:\n                per -= 2\n            if j > 0 and grid[i][j - 1] == 1:\n                per -= 2\n    return per`,
        javascript: `var islandPerimeter = function(grid) {\n    let per = 0;\n    for (let i = 0; i < grid.length; i++) {\n        for (let j = 0; j < grid[0].length; j++) {\n            if (grid[i][j] !== 1) continue;\n            per += 4;\n            if (i > 0 && grid[i - 1][j] === 1) per -= 2;\n            if (j > 0 && grid[i][j - 1] === 1) per -= 2;\n        }\n    }\n    return per;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef numIslands(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n    count = 0\n\n    def sink(i, j):\n        if i < 0 or j < 0 or i >= len(g) or j >= len(g[0]) or g[i][j] != 1:\n            return\n        g[i][j] = 0\n        sink(i + 1, j)\n        sink(i - 1, j)\n        sink(i, j + 1)\n        sink(i, j - 1)\n\n    for i in range(len(g)):\n        for j in range(len(g[0])):\n            if g[i][j] == 1:\n                count += 1\n                sink(i, j)\n    return count`,
        javascript: `var numIslands = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    let count = 0;\n    function sink(i, j) {\n        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return;\n        g[i][j] = 0;\n        sink(i + 1, j);\n        sink(i - 1, j);\n        sink(i, j + 1);\n        sink(i, j - 1);\n    }\n    for (let i = 0; i < g.length; i++) {\n        for (let j = 0; j < g[0].length; j++) {\n            if (g[i][j] === 1) {\n                count++;\n                sink(i, j);\n            }\n        }\n    }\n    return count;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef maxAreaOfIsland(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n\n    def area(i, j):\n        if i < 0 or j < 0 or i >= len(g) or j >= len(g[0]) or g[i][j] != 1:\n            return 0\n        g[i][j] = 0\n        return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1)\n\n    best = 0\n    for i in range(len(g)):\n        for j in range(len(g[0])):\n            best = max(best, area(i, j))\n    return best`,
        javascript: `var maxAreaOfIsland = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    function area(i, j) {\n        if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return 0;\n        g[i][j] = 0;\n        return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1);\n    }\n    let best = 0;\n    for (let i = 0; i < g.length; i++) {\n        for (let j = 0; j < g[0].length; j++) {\n            best = Math.max(best, area(i, j));\n        }\n    }\n    return best;\n};`,
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
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef orangesRotting(grid: List[List[int]]) -> int:\n    g = [row[:] for row in grid]\n    R, C = len(g), len(g[0])\n    fresh = 0\n    queue = deque()\n    for i in range(R):\n        for j in range(C):\n            if g[i][j] == 1:\n                fresh += 1\n            elif g[i][j] == 2:\n                queue.append((i, j))\n    minutes = 0\n    while fresh > 0 and queue:\n        nxt = deque()\n        for i, j in queue:\n            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                ni, nj = i + di, j + dj\n                if 0 <= ni < R and 0 <= nj < C and g[ni][nj] == 1:\n                    g[ni][nj] = 2\n                    fresh -= 1\n                    nxt.append((ni, nj))\n        queue = nxt\n        if nxt:\n            minutes += 1\n    return minutes if fresh == 0 else -1`,
        javascript: `var orangesRotting = function(grid) {\n    const g = grid.map(function(r) { return r.slice(); });\n    const R = g.length, C = g[0].length;\n    let fresh = 0;\n    let queue = [];\n    for (let i = 0; i < R; i++) {\n        for (let j = 0; j < C; j++) {\n            if (g[i][j] === 1) fresh++;\n            else if (g[i][j] === 2) queue.push([i, j]);\n        }\n    }\n    let minutes = 0;\n    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n    while (fresh > 0 && queue.length > 0) {\n        const next = [];\n        for (const cell of queue) {\n            for (const d of dirs) {\n                const ni = cell[0] + d[0], nj = cell[1] + d[1];\n                if (ni >= 0 && nj >= 0 && ni < R && nj < C && g[ni][nj] === 1) {\n                    g[ni][nj] = 2;\n                    fresh--;\n                    next.push([ni, nj]);\n                }\n            }\n        }\n        queue = next;\n        if (next.length > 0) minutes++;\n    }\n    return fresh === 0 ? minutes : -1;\n};`,
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
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef updateMatrix(mat: List[List[int]]) -> List[List[int]]:\n    R, C = len(mat), len(mat[0])\n    INF = float("inf")\n    dist = [[0 if mat[i][j] == 0 else INF for j in range(C)] for i in range(R)]\n    queue = deque((i, j) for i in range(R) for j in range(C) if mat[i][j] == 0)\n    while queue:\n        i, j = queue.popleft()\n        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            ni, nj = i + di, j + dj\n            if 0 <= ni < R and 0 <= nj < C and dist[ni][nj] > dist[i][j] + 1:\n                dist[ni][nj] = dist[i][j] + 1\n                queue.append((ni, nj))\n    return [[int(x) for x in row] for row in dist]`,
        javascript: `var updateMatrix = function(mat) {\n    const R = mat.length, C = mat[0].length;\n    const dist = mat.map(function(row) {\n        return row.map(function(v) { return v === 0 ? 0 : Infinity; });\n    });\n    let queue = [];\n    for (let i = 0; i < R; i++) {\n        for (let j = 0; j < C; j++) {\n            if (mat[i][j] === 0) queue.push([i, j]);\n        }\n    }\n    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n    while (queue.length > 0) {\n        const next = [];\n        for (const cell of queue) {\n            for (const d of dirs) {\n                const ni = cell[0] + d[0], nj = cell[1] + d[1];\n                if (ni >= 0 && nj >= 0 && ni < R && nj < C && dist[ni][nj] > dist[cell[0]][cell[1]] + 1) {\n                    dist[ni][nj] = dist[cell[0]][cell[1]] + 1;\n                    next.push([ni, nj]);\n                }\n            }\n        }\n        queue = next;\n    }\n    return dist;\n};`,
      },
    };
  })(),

];

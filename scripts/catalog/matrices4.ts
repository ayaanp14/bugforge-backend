/**
 * Matrix and grid problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" matrix set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, so square roots
 * are replaced by `d * d <= x` style loops.
 */
import {
  bool,
  describe,
  explain,
  fmtIntArr,
  fmtIntMat,
  fmtStrArr,
  pick,
  randLower,
  ri,
  shuffle,
  type CatalogProblem,
  type Rng,
} from "./types.js";

export const MATRICES4_PROBLEMS: CatalogProblem[] = [

  // ── Matrix Similarity After Cyclic Shifts (LC 3033-series) ──────
  (() => {
    const ref = (mat: number[][], k: number) => {
      const n = mat[0].length;
      for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < n; j++) {
          const src = i % 2 === 0 ? (j + k) % n : (((j - k) % n) + n) % n;
          if (mat[i][j] !== mat[i][src]) return false;
        }
      }
      return true;
    };
    return {
      slug: "matrix-similarity-after-cyclic-shifts",
      title: "Matrix Similarity After Cyclic Shifts",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Adobe", "Cognizant"],
      signature: { funcName: "areSimilar", params: [{ name: "mat", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Each second, every **even-indexed** row of `mat` shifts cyclically one place to the **left** and every **odd-indexed** row shifts one place to the **right**. This happens `k` times.\n\nReturn whether the matrix ends up identical to how it started.",
        [
          { in: "mat = [[1,2,1,2],[5,5,5,5],[6,3,6,3]], k = 2", out: "true", note: "Every row has period 2, so two shifts restore it." },
          { in: "mat = [[2,2],[2,2]], k = 3", out: "true", note: "Constant rows never change." },
          { in: "mat = [[1,2]], k = 1", out: "false" },
        ],
        ["1 <= mat.length, mat[i].length <= 25", "1 <= mat[i][j] <= 25", "1 <= k <= 50", "All rows have the same length."]),
      hints: [
        "Do not actually perform `k` shifts — compare each cell against where its value would come from.",
        "After `k` left shifts, position `j` holds what used to be at `(j + k) % n`.",
        "A right shift is the same with `k` negated, normalised into range.",
      ],
      editorial: explain({
        idea: "Shifting `k` times is one shift by `k` modulo the row length, so nothing needs simulating. The matrix is unchanged exactly when every cell already equals the value that would land on it.",
        steps: [
          "For an even row, the value arriving at column `j` comes from `(j + k) % n`.",
          "For an odd row, it comes from `((j - k) % n + n) % n`.",
          "Return false at the first mismatch, true otherwise.",
        ],
        why: "Cyclic shifts compose, so `k` single shifts equal one shift by `k mod n` — which is why the modulo appears and why `k` up to 50 costs nothing. The `+ n` before the second modulo fixes languages where `%` on a negative operand returns a negative result.",
        time: "O(m · n)",
        space: "O(1)",
        pitfalls: [
          "Simulating `k` shifts row by row is unnecessary work and easy to get subtly wrong.",
          "`(j - k) % n` is negative in most languages — normalise it.",
          "Even and odd rows shift in *opposite* directions.",
        ],
      }),
      examples: [
        { input: "[[1,2,1,2],[5,5,5,5],[6,3,6,3]]\n2", expectedOutput: "true" },
        { input: "[[2,2],[2,2]]\n3", expectedOutput: "true" },
        { input: "[[1,2]]\n1", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 5), n = ri(rng, 1, 6);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, rng() < 0.6 ? 3 : 25)));
        const k = ri(rng, 1, 50);
        return { input: `${fmtIntMat(mat)}\n${k}`, expectedOutput: bool(ref(mat, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef areSimilar(mat: List[List[int]], k: int) -> bool:\n    n = len(mat[0])\n    for i, row in enumerate(mat):\n        for j in range(n):\n            src = (j + k) % n if i % 2 == 0 else (j - k) % n\n            if row[j] != row[src]:\n                return False\n    return True`,
        javascript: `var areSimilar = function(mat, k) {\n    var n = mat[0].length;\n    for (var i = 0; i < mat.length; i++) {\n        for (var j = 0; j < n; j++) {\n            var src = i % 2 === 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] !== mat[i][src]) return false;\n        }\n    }\n    return true;\n};`,
        typescript: `function areSimilar(mat: number[][], k: number): boolean {\n    var n = mat[0].length;\n    for (var i = 0; i < mat.length; i++) {\n        for (var j = 0; j < n; j++) {\n            var src = i % 2 === 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] !== mat[i][src]) return false;\n        }\n    }\n    return true;\n}`,
        java: `public static boolean areSimilar(int[][] mat, int k) {\n    int n = mat[0].length;\n    for (int i = 0; i < mat.length; i++) {\n        for (int j = 0; j < n; j++) {\n            int src = i % 2 == 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] != mat[i][src]) return false;\n        }\n    }\n    return true;\n}`,
        cpp: `bool areSimilar(vector<vector<int>>& mat, int k) {\n    int n = (int) mat[0].size();\n    for (int i = 0; i < (int) mat.size(); i++) {\n        for (int j = 0; j < n; j++) {\n            int src = i % 2 == 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] != mat[i][src]) return false;\n        }\n    }\n    return true;\n}`,
        c: `bool areSimilar(int** mat, int matSize, int* matColSize, int k) {\n    int n = matColSize[0];\n    for (int i = 0; i < matSize; i++) {\n        for (int j = 0; j < n; j++) {\n            int src = i % 2 == 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] != mat[i][src]) return false;\n        }\n    }\n    return true;\n}`,
        csharp: `public static bool AreSimilar(int[][] mat, int k)\n{\n    int n = mat[0].Length;\n    for (int i = 0; i < mat.Length; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            int src = i % 2 == 0 ? (j + k) % n : (((j - k) % n) + n) % n;\n            if (mat[i][j] != mat[i][src]) return false;\n        }\n    }\n    return true;\n}`,
        go: `func areSimilar(mat [][]int, k int) bool {\n\tn := len(mat[0])\n\tfor i := 0; i < len(mat); i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tvar src int\n\t\t\tif i%2 == 0 {\n\t\t\t\tsrc = (j + k) % n\n\t\t\t} else {\n\t\t\t\tsrc = ((j-k)%n + n) % n\n\t\t\t}\n\t\t\tif mat[i][j] != mat[i][src] {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun areSimilar(mat: Array<IntArray>, k: Int): Boolean {\n    val n = mat[0].size\n    for (i in mat.indices) {\n        for (j in 0 until n) {\n            val src = if (i % 2 == 0) (j + k) % n else (((j - k) % n) + n) % n\n            if (mat[i][j] != mat[i][src]) return false\n        }\n    }\n    return true\n}`,
        swift: `func areSimilar(_ mat: [[Int]], _ k: Int) -> Bool {\n    let n = mat[0].count\n    for i in 0..<mat.count {\n        for j in 0..<n {\n            let src = i % 2 == 0 ? (j + k) % n : (((j - k) % n) + n) % n\n            if mat[i][j] != mat[i][src] { return false }\n        }\n    }\n    return true\n}`,
        rust: `fn areSimilar(mat: Vec<Vec<i32>>, k: i32) -> bool {\n    let n = mat[0].len() as i32;\n    for i in 0..mat.len() {\n        for j in 0..(n as usize) {\n            let src = if i % 2 == 0 {\n                ((j as i32 + k) % n) as usize\n            } else {\n                (((j as i32 - k) % n + n) % n) as usize\n            };\n            if mat[i][j] != mat[i][src] {\n                return false;\n            }\n        }\n    }\n    true\n}`,
        php: `function areSimilar($mat, $k) {\n    $n = count($mat[0]);\n    for ($i = 0; $i < count($mat); $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            $src = $i % 2 === 0 ? ($j + $k) % $n : ((($j - $k) % $n) + $n) % $n;\n            if ($mat[$i][$j] !== $mat[$i][$src]) return false;\n        }\n    }\n    return true;\n}`,
        ruby: `def areSimilar(mat, k)\n  n = mat[0].length\n  mat.each_with_index do |row, i|\n    (0...n).each do |j|\n      src = i.even? ? (j + k) % n : (j - k) % n\n      return false if row[j] != row[src]\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Prime In Diagonal (LC 2614) ─────────────────────────────────
  (() => {
    const isPrime = (x: number) => {
      if (x < 2) return false;
      for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
      return true;
    };
    const ref = (nums: number[][]) => {
      const n = nums.length;
      let best = 0;
      for (let i = 0; i < n; i++) {
        const a = nums[i][i], b = nums[i][n - 1 - i];
        if (a > best && isPrime(a)) best = a;
        if (b > best && isPrime(b)) best = b;
      }
      return best;
    };
    return {
      slug: "prime-in-diagonal",
      title: "Prime In Diagonal",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Matrix", "Number Theory", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "diagonalPrime", params: [{ name: "nums", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Return the largest **prime** that lies on either diagonal of the square matrix `nums`, or `0` if neither diagonal holds a prime.\n\nThe diagonals are the cells with `i == j` and the cells with `i + j == n - 1`.",
        [
          { in: "nums = [[1,2,3],[5,6,7],[9,10,11]]", out: "11", note: "The diagonals hold 1, 6, 11, 3, 6, 9; the largest prime is 11." },
          { in: "nums = [[1,2,3],[5,17,7],[9,11,10]]", out: "17" },
          { in: "nums = [[1,4],[6,8]]", out: "0", note: "No diagonal entry is prime." },
        ],
        ["1 <= nums.length <= 300", "nums.length == nums[i].length", "1 <= nums[i][j] <= 4000000"]),
      hints: [
        "Only `2n` cells matter — the two diagonals.",
        "Test primality by trial division up to the square root.",
        "Skip the primality test entirely when the value cannot beat the current best.",
      ],
      editorial: explain({
        idea: "Visit the `2n` diagonal cells and keep the largest prime. Checking `value > best` before testing primality keeps the expensive part rare.",
        steps: [
          "For each row `i`, look at `nums[i][i]` and `nums[i][n-1-i]`.",
          "If a value exceeds the current best, test it for primality by trial division up to its square root.",
          "Return the best found, or 0.",
        ],
        why: "Trial division to `sqrt(x)` is enough because a composite `x` must have a factor at or below its square root. Writing the loop bound as `d * d <= x` avoids a floating-point square root entirely, which matters where the harness has no math library. The `> best` guard means most cells cost one comparison.",
        time: "O(n · sqrt(V))",
        space: "O(1)",
        pitfalls: [
          "The two diagonals overlap at the centre of an odd-sized matrix — harmless here, since taking a maximum is idempotent.",
          "1 is not prime, and the answer for 'no prime found' is 0.",
          "A sieve up to 4,000,000 also works but is far more memory than the `2n` cells need.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[5,6,7],[9,10,11]]", expectedOutput: "11" },
        { input: "[[1,2,3],[5,17,7],[9,11,10]]", expectedOutput: "17" },
        { input: "[[1,4],[6,8]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const hi = rng() < 0.6 ? 40 : 4000000;
        const nums = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef diagonalPrime(nums: List[List[int]]) -> int:\n    def is_prime(x: int) -> bool:\n        if x < 2:\n            return False\n        d = 2\n        while d * d <= x:\n            if x % d == 0:\n                return False\n            d += 1\n        return True\n\n    n = len(nums)\n    best = 0\n    for i in range(n):\n        for v in (nums[i][i], nums[i][n - 1 - i]):\n            if v > best and is_prime(v):\n                best = v\n    return best`,
        javascript: `var diagonalPrime = function(nums) {\n    var isPrime = function(x) {\n        if (x < 2) return false;\n        for (var d = 2; d * d <= x; d++) if (x % d === 0) return false;\n        return true;\n    };\n    var n = nums.length;\n    var best = 0;\n    for (var i = 0; i < n; i++) {\n        var a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && isPrime(a)) best = a;\n        if (b > best && isPrime(b)) best = b;\n    }\n    return best;\n};`,
        typescript: `function diagonalPrime(nums: number[][]): number {\n    var isPrime = function(x: number): boolean {\n        if (x < 2) return false;\n        for (var d = 2; d * d <= x; d++) if (x % d === 0) return false;\n        return true;\n    };\n    var n = nums.length;\n    var best = 0;\n    for (var i = 0; i < n; i++) {\n        var a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && isPrime(a)) best = a;\n        if (b > best && isPrime(b)) best = b;\n    }\n    return best;\n}`,
        java: `private static boolean isPrimeDiag(int x) {\n    if (x < 2) return false;\n    for (int d = 2; (long) d * d <= x; d++) if (x % d == 0) return false;\n    return true;\n}\n\npublic static int diagonalPrime(int[][] nums) {\n    int n = nums.length;\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && isPrimeDiag(a)) best = a;\n        if (b > best && isPrimeDiag(b)) best = b;\n    }\n    return best;\n}`,
        cpp: `static bool isPrimeDiag(int x) {\n    if (x < 2) return false;\n    for (int d = 2; (long long) d * d <= x; d++) if (x % d == 0) return false;\n    return true;\n}\n\nint diagonalPrime(vector<vector<int>>& nums) {\n    int n = (int) nums.size();\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && isPrimeDiag(a)) best = a;\n        if (b > best && isPrimeDiag(b)) best = b;\n    }\n    return best;\n}`,
        c: `static int isPrimeDiag(int x) {\n    if (x < 2) return 0;\n    for (int d = 2; (long long) d * d <= (long long) x; d++) if (x % d == 0) return 0;\n    return 1;\n}\n\nint diagonalPrime(int** nums, int numsSize, int* numsColSize) {\n    (void) numsColSize;\n    int n = numsSize;\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && isPrimeDiag(a)) best = a;\n        if (b > best && isPrimeDiag(b)) best = b;\n    }\n    return best;\n}`,
        csharp: `private static bool IsPrimeDiag(int x)\n{\n    if (x < 2) return false;\n    for (int d = 2; (long) d * d <= x; d++) if (x % d == 0) return false;\n    return true;\n}\n\npublic static int DiagonalPrime(int[][] nums)\n{\n    int n = nums.Length;\n    int best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int a = nums[i][i], b = nums[i][n - 1 - i];\n        if (a > best && IsPrimeDiag(a)) best = a;\n        if (b > best && IsPrimeDiag(b)) best = b;\n    }\n    return best;\n}`,
        go: `func isPrimeDiag(x int) bool {\n\tif x < 2 {\n\t\treturn false\n\t}\n\tfor d := 2; d*d <= x; d++ {\n\t\tif x%d == 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\nfunc diagonalPrime(nums [][]int) int {\n\tn := len(nums)\n\tbest := 0\n\tfor i := 0; i < n; i++ {\n\t\ta, b := nums[i][i], nums[i][n-1-i]\n\t\tif a > best && isPrimeDiag(a) {\n\t\t\tbest = a\n\t\t}\n\t\tif b > best && isPrimeDiag(b) {\n\t\t\tbest = b\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `private fun isPrimeDiag(x: Int): Boolean {\n    if (x < 2) return false\n    var d = 2\n    while (d.toLong() * d <= x) {\n        if (x % d == 0) return false\n        d++\n    }\n    return true\n}\n\nfun diagonalPrime(nums: Array<IntArray>): Int {\n    val n = nums.size\n    var best = 0\n    for (i in 0 until n) {\n        val a = nums[i][i]\n        val b = nums[i][n - 1 - i]\n        if (a > best && isPrimeDiag(a)) best = a\n        if (b > best && isPrimeDiag(b)) best = b\n    }\n    return best\n}`,
        swift: `func diagonalPrime(_ nums: [[Int]]) -> Int {\n    func isPrime(_ x: Int) -> Bool {\n        if x < 2 { return false }\n        var d = 2\n        while d * d <= x {\n            if x % d == 0 { return false }\n            d += 1\n        }\n        return true\n    }\n    let n = nums.count\n    var best = 0\n    for i in 0..<n {\n        let a = nums[i][i]\n        let b = nums[i][n - 1 - i]\n        if a > best && isPrime(a) { best = a }\n        if b > best && isPrime(b) { best = b }\n    }\n    return best\n}`,
        rust: `fn diagonalPrime(nums: Vec<Vec<i32>>) -> i32 {\n    fn is_prime(x: i32) -> bool {\n        if x < 2 {\n            return false;\n        }\n        let mut d = 2i64;\n        while d * d <= x as i64 {\n            if x as i64 % d == 0 {\n                return false;\n            }\n            d += 1;\n        }\n        true\n    }\n    let n = nums.len();\n    let mut best = 0i32;\n    for i in 0..n {\n        let a = nums[i][i];\n        let b = nums[i][n - 1 - i];\n        if a > best && is_prime(a) {\n            best = a;\n        }\n        if b > best && is_prime(b) {\n            best = b;\n        }\n    }\n    best\n}`,
        php: `function diagonalPrime($nums) {\n    $isPrime = function($x) {\n        if ($x < 2) return false;\n        for ($d = 2; $d * $d <= $x; $d++) if ($x % $d === 0) return false;\n        return true;\n    };\n    $n = count($nums);\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $a = $nums[$i][$i];\n        $b = $nums[$i][$n - 1 - $i];\n        if ($a > $best && $isPrime($a)) $best = $a;\n        if ($b > $best && $isPrime($b)) $best = $b;\n    }\n    return $best;\n}`,
        ruby: `def diagonalPrime(nums)\n  is_prime = lambda do |x|\n    next false if x < 2\n    d = 2\n    while d * d <= x\n      return false if x % d == 0\n      d += 1\n    end\n    true\n  end\n  n = nums.length\n  best = 0\n  (0...n).each do |i|\n    [nums[i][i], nums[i][n - 1 - i]].each do |v|\n      best = v if v > best && is_prime.call(v)\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Difference Between Ones and Zeros in Row and Column (LC 2482) ──
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const rowOnes = new Array(m).fill(0);
      const colOnes = new Array(n).fill(0);
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          rowOnes[i] += grid[i][j];
          colOnes[j] += grid[i][j];
        }
      }
      const out: number[][] = [];
      for (let i = 0; i < m; i++) {
        const row: number[] = [];
        for (let j = 0; j < n; j++) {
          row.push(rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]));
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "difference-between-ones-and-zeros-in-row-and-column",
      title: "Difference Between Ones and Zeros in Row and Column",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "onesMinusZeros", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "For a binary matrix `grid`, build a matrix `diff` of the same size where\n\n`diff[i][j] = onesRow[i] + onesCol[j] - zerosRow[i] - zerosCol[j]`\n\nwith `onesRow[i]` the number of `1`s in row `i`, `zerosCol[j]` the number of `0`s in column `j`, and so on. Return `diff`.",
        [
          { in: "grid = [[0,1,1],[1,0,1],[0,0,1]]", out: "[[0,0,4],[0,0,4],[-2,-2,2]]" },
          { in: "grid = [[1,1,1],[1,1,1]]", out: "[[5,5,5],[5,5,5]]", note: "Every row has 3 ones and every column 2, so each cell is 3 + 2 - 0 - 0." },
          { in: "grid = [[0]]", out: "[[-2]]" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 100000", "1 <= m · n <= 100000", "grid[i][j] is 0 or 1"]),
      hints: [
        "Every cell's value depends only on its row's and column's one-counts.",
        "Zeros are the complement: `zerosRow[i] = n - onesRow[i]` and `zerosCol[j] = m - onesCol[j]`.",
        "So one pass to tally, then one pass to fill.",
      ],
      editorial: explain({
        idea: "Precompute the per-row and per-column one-counts; every cell's answer is then a constant-time expression, with the zero-counts derived as complements.",
        steps: [
          "Sweep the grid once accumulating `onesRow` and `onesCol`.",
          "Fill the output with `onesRow[i] + onesCol[j] - (n - onesRow[i]) - (m - onesCol[j])`.",
        ],
        why: "The formula never refers to the cell itself, only to its line totals — so all `m · n` answers come from `m + n` precomputed numbers. Deriving the zero-counts by subtraction avoids a second pair of tallies, and the whole thing stays linear in the grid size.",
        time: "O(m · n)",
        space: "O(m + n) beyond the output",
        pitfalls: [
          "Recomputing a row's and column's counts per cell makes it `O(m · n · (m + n))`.",
          "`zerosRow[i]` uses the row *length* `n`, and `zerosCol[j]` the column *height* `m` — swapping them is the classic slip.",
          "Values can be negative, which is expected.",
        ],
      }),
      examples: [
        { input: "[[0,1,1],[1,0,1],[0,0,1]]", expectedOutput: "[[0,0,4],[0,0,4],[-2,-2,2]]" },
        { input: "[[1,1,1],[1,1,1]]", expectedOutput: "[[5,5,5],[5,5,5]]" },
        { input: "[[0]]", expectedOutput: "[[-2]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.5 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: fmtIntMat(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef onesMinusZeros(grid: List[List[int]]) -> List[List[int]]:\n    m, n = len(grid), len(grid[0])\n    row_ones = [sum(r) for r in grid]\n    col_ones = [sum(grid[i][j] for i in range(m)) for j in range(n)]\n    return [[row_ones[i] + col_ones[j] - (n - row_ones[i]) - (m - col_ones[j])\n             for j in range(n)] for i in range(m)]`,
        javascript: `var onesMinusZeros = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j;\n    var rowOnes = [], colOnes = [];\n    for (i = 0; i < m; i++) rowOnes.push(0);\n    for (j = 0; j < n; j++) colOnes.push(0);\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    var out = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) {\n            row.push(rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]));\n        }\n        out.push(row);\n    }\n    return out;\n};`,
        typescript: `function onesMinusZeros(grid: number[][]): number[][] {\n    var m = grid.length, n = grid[0].length, i: number, j: number;\n    var rowOnes: number[] = [], colOnes: number[] = [];\n    for (i = 0; i < m; i++) rowOnes.push(0);\n    for (j = 0; j < n; j++) colOnes.push(0);\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    var out: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) {\n            row.push(rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]));\n        }\n        out.push(row);\n    }\n    return out;\n}`,
        java: `public static int[][] onesMinusZeros(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[] rowOnes = new int[m];\n    int[] colOnes = new int[n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    int[][] out = new int[m][n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            out[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]);\n        }\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> onesMinusZeros(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> rowOnes(m, 0), colOnes(n, 0);\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            out[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]);\n        }\n    }\n    return out;\n}`,
        c: `int** onesMinusZeros(int** grid, int gridSize, int* gridColSize, int* returnSize, int** returnColumnSizes) {\n    int m = gridSize, n = gridColSize[0];\n    int* rowOnes = (int*) calloc((size_t) m, sizeof(int));\n    int* colOnes = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    int** out = (int**) malloc((size_t) m * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < m; i++) {\n        out[i] = (int*) malloc((size_t) n * sizeof(int));\n        (*returnColumnSizes)[i] = n;\n        for (int j = 0; j < n; j++) {\n            out[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]);\n        }\n    }\n    free(rowOnes);\n    free(colOnes);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[][] OnesMinusZeros(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int[] rowOnes = new int[m];\n    int[] colOnes = new int[n];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            rowOnes[i] += grid[i][j];\n            colOnes[j] += grid[i][j];\n        }\n    }\n    var out_ = new int[m][];\n    for (int i = 0; i < m; i++)\n    {\n        out_[i] = new int[n];\n        for (int j = 0; j < n; j++)\n        {\n            out_[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]);\n        }\n    }\n    return out_;\n}`,
        go: `func onesMinusZeros(grid [][]int) [][]int {\n\tm, n := len(grid), len(grid[0])\n\trowOnes := make([]int, m)\n\tcolOnes := make([]int, n)\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\trowOnes[i] += grid[i][j]\n\t\t\tcolOnes[j] += grid[i][j]\n\t\t}\n\t}\n\tout := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tout[i] = make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tout[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j])\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun onesMinusZeros(grid: Array<IntArray>): Array<IntArray> {\n    val m = grid.size\n    val n = grid[0].size\n    val rowOnes = IntArray(m)\n    val colOnes = IntArray(n)\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            rowOnes[i] += grid[i][j]\n            colOnes[j] += grid[i][j]\n        }\n    }\n    return Array(m) { i ->\n        IntArray(n) { j -> rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j]) }\n    }\n}`,
        swift: `func onesMinusZeros(_ grid: [[Int]]) -> [[Int]] {\n    let m = grid.count\n    let n = grid[0].count\n    var rowOnes = [Int](repeating: 0, count: m)\n    var colOnes = [Int](repeating: 0, count: n)\n    for i in 0..<m {\n        for j in 0..<n {\n            rowOnes[i] += grid[i][j]\n            colOnes[j] += grid[i][j]\n        }\n    }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for i in 0..<m {\n        for j in 0..<n {\n            out[i][j] = rowOnes[i] + colOnes[j] - (n - rowOnes[i]) - (m - colOnes[j])\n        }\n    }\n    return out\n}`,
        rust: `fn onesMinusZeros(grid: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut row_ones = vec![0i32; m];\n    let mut col_ones = vec![0i32; n];\n    for i in 0..m {\n        for j in 0..n {\n            row_ones[i] += grid[i][j];\n            col_ones[j] += grid[i][j];\n        }\n    }\n    let mut out = vec![vec![0i32; n]; m];\n    for i in 0..m {\n        for j in 0..n {\n            out[i][j] = row_ones[i] + col_ones[j] - (n as i32 - row_ones[i]) - (m as i32 - col_ones[j]);\n        }\n    }\n    out\n}`,
        php: `function onesMinusZeros($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $rowOnes = array_fill(0, $m, 0);\n    $colOnes = array_fill(0, $n, 0);\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            $rowOnes[$i] += $grid[$i][$j];\n            $colOnes[$j] += $grid[$i][$j];\n        }\n    }\n    $out = [];\n    for ($i = 0; $i < $m; $i++) {\n        $row = [];\n        for ($j = 0; $j < $n; $j++) {\n            $row[] = $rowOnes[$i] + $colOnes[$j] - ($n - $rowOnes[$i]) - ($m - $colOnes[$j]);\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
        ruby: `def onesMinusZeros(grid)\n  m = grid.length\n  n = grid[0].length\n  row_ones = grid.map(&:sum)\n  col_ones = (0...n).map { |j| (0...m).sum { |i| grid[i][j] } }\n  (0...m).map do |i|\n    (0...n).map { |j| row_ones[i] + col_ones[j] - (n - row_ones[i]) - (m - col_ones[j]) }\n  end\nend`,
      },
    };
  })(),

  // ── Maximum Matrix Sum (LC 1975) ────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      let sum = 0, negs = 0, mn = Infinity;
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          const v = matrix[i][j];
          const a = v < 0 ? -v : v;
          sum += a;
          if (v < 0) negs++;
          if (a < mn) mn = a;
        }
      }
      return negs % 2 === 0 ? sum : sum - 2 * mn;
    };
    return {
      slug: "maximum-matrix-sum",
      title: "Maximum Matrix Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Greedy", "Amazon", "Google", "Zoho"],
      signature: { funcName: "maxMatrixSum", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "One operation picks two **adjacent** cells (sharing a side) and multiplies **both** by -1. You may do this any number of times.\n\nReturn the maximum possible sum of all the matrix elements.",
        [
          { in: "matrix = [[1,-1],[-1,1]]", out: "4", note: "Flip each pair of negatives to get all ones." },
          { in: "matrix = [[1,2,3],[-1,-2,-3],[1,2,3]]", out: "16", note: "The number of negatives is even, so all of them can be cleared." },
          { in: "matrix = [[-1,0,-1]]", out: "2" },
        ],
        ["n == matrix.length == matrix[i].length", "2 <= n <= 150", "-10000 <= matrix[i][j] <= 10000"]),
      hints: [
        "Each operation flips **two** signs, so the parity of the number of negative entries never changes.",
        "With an even number of negatives, every sign can be cleared and the answer is the sum of absolute values.",
        "With an odd number, exactly one entry must stay negative — make it the smallest absolute value.",
      ],
      editorial: explain({
        idea: "The parity of the negative count is invariant, and it is the only obstruction. So the answer is the sum of absolute values, minus twice the smallest magnitude when that parity is odd.",
        steps: [
          "Accumulate the sum of absolute values, the count of negatives, and the smallest absolute value.",
          "If the negative count is even, return the sum.",
          "Otherwise return `sum - 2 · minAbs`.",
        ],
        why: "Each operation changes two signs, so the negative count shifts by -2, 0 or +2 — its parity is fixed. Conversely, in a grid of at least two columns any two cells can be connected by a chain of adjacent flips, so any sign pattern with the right parity is reachable. Leaving the smallest magnitude negative costs `2 · minAbs`, the cheapest possible penalty.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Zeros count as non-negative but have absolute value 0 — a single zero makes the odd case free.",
          "The penalty is `2 · minAbs`, not `minAbs`: that entry swings from `+minAbs` to `-minAbs`.",
          "The total reaches about `150² · 10^4 = 2.25 · 10^8`, inside `int`.",
        ],
      }),
      examples: [
        { input: "[[1,-1],[-1,1]]", expectedOutput: "4" },
        { input: "[[1,2,3],[-1,-2,-3],[1,2,3]]", expectedOutput: "16" },
        { input: "[[-1,0,-1]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, -10000, 10000)));
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxMatrixSum(matrix: List[List[int]]) -> int:\n    total = 0\n    negs = 0\n    mn = float("inf")\n    for row in matrix:\n        for v in row:\n            total += abs(v)\n            if v < 0:\n                negs += 1\n            mn = min(mn, abs(v))\n    return total if negs % 2 == 0 else total - 2 * mn`,
        javascript: `var maxMatrixSum = function(matrix) {\n    var sum = 0, negs = 0, mn = Infinity;\n    for (var i = 0; i < matrix.length; i++) {\n        for (var j = 0; j < matrix[i].length; j++) {\n            var v = matrix[i][j];\n            var a = v < 0 ? -v : v;\n            sum += a;\n            if (v < 0) negs++;\n            if (a < mn) mn = a;\n        }\n    }\n    return negs % 2 === 0 ? sum : sum - 2 * mn;\n};`,
        typescript: `function maxMatrixSum(matrix: number[][]): number {\n    var sum = 0, negs = 0, mn = Infinity;\n    for (var i = 0; i < matrix.length; i++) {\n        for (var j = 0; j < matrix[i].length; j++) {\n            var v = matrix[i][j];\n            var a = v < 0 ? -v : v;\n            sum += a;\n            if (v < 0) negs++;\n            if (a < mn) mn = a;\n        }\n    }\n    return negs % 2 === 0 ? sum : sum - 2 * mn;\n}`,
        java: `public static int maxMatrixSum(int[][] matrix) {\n    long sum = 0;\n    int negs = 0, mn = Integer.MAX_VALUE;\n    for (int[] row : matrix) {\n        for (int v : row) {\n            int a = Math.abs(v);\n            sum += a;\n            if (v < 0) negs++;\n            mn = Math.min(mn, a);\n        }\n    }\n    return (int) (negs % 2 == 0 ? sum : sum - 2L * mn);\n}`,
        cpp: `int maxMatrixSum(vector<vector<int>>& matrix) {\n    long long sum = 0;\n    int negs = 0, mn = INT_MAX;\n    for (auto& row : matrix) {\n        for (int v : row) {\n            int a = abs(v);\n            sum += a;\n            if (v < 0) negs++;\n            mn = min(mn, a);\n        }\n    }\n    return (int) (negs % 2 == 0 ? sum : sum - 2LL * mn);\n}`,
        c: `int maxMatrixSum(int** matrix, int matrixSize, int* matrixColSize) {\n    long long sum = 0;\n    int negs = 0, mn = 2147483647;\n    for (int i = 0; i < matrixSize; i++) {\n        for (int j = 0; j < matrixColSize[i]; j++) {\n            int v = matrix[i][j];\n            int a = v < 0 ? -v : v;\n            sum += a;\n            if (v < 0) negs++;\n            if (a < mn) mn = a;\n        }\n    }\n    if (negs % 2 != 0) sum -= 2LL * mn;\n    return (int) sum;\n}`,
        csharp: `public static int MaxMatrixSum(int[][] matrix)\n{\n    long sum = 0;\n    int negs = 0, mn = int.MaxValue;\n    foreach (var row in matrix)\n    {\n        foreach (int v in row)\n        {\n            int a = Math.Abs(v);\n            sum += a;\n            if (v < 0) negs++;\n            if (a < mn) mn = a;\n        }\n    }\n    return (int) (negs % 2 == 0 ? sum : sum - 2L * mn);\n}`,
        go: `func maxMatrixSum(matrix [][]int) int {\n\tsum, negs := 0, 0\n\tmn := 1 << 62\n\tfor _, row := range matrix {\n\t\tfor _, v := range row {\n\t\t\ta := v\n\t\t\tif a < 0 {\n\t\t\t\ta = -a\n\t\t\t}\n\t\t\tsum += a\n\t\t\tif v < 0 {\n\t\t\t\tnegs++\n\t\t\t}\n\t\t\tif a < mn {\n\t\t\t\tmn = a\n\t\t\t}\n\t\t}\n\t}\n\tif negs%2 != 0 {\n\t\tsum -= 2 * mn\n\t}\n\treturn sum\n}`,
        kotlin: `fun maxMatrixSum(matrix: Array<IntArray>): Int {\n    var sum = 0L\n    var negs = 0\n    var mn = Int.MAX_VALUE\n    for (row in matrix) {\n        for (v in row) {\n            val a = Math.abs(v)\n            sum += a\n            if (v < 0) negs++\n            if (a < mn) mn = a\n        }\n    }\n    return (if (negs % 2 == 0) sum else sum - 2L * mn).toInt()\n}`,
        swift: `func maxMatrixSum(_ matrix: [[Int]]) -> Int {\n    var sum = 0\n    var negs = 0\n    var mn = Int.max\n    for row in matrix {\n        for v in row {\n            let a = abs(v)\n            sum += a\n            if v < 0 { negs += 1 }\n            if a < mn { mn = a }\n        }\n    }\n    return negs % 2 == 0 ? sum : sum - 2 * mn\n}`,
        rust: `fn maxMatrixSum(matrix: Vec<Vec<i32>>) -> i32 {\n    let mut sum: i64 = 0;\n    let mut negs = 0i32;\n    let mut mn = i32::MAX;\n    for row in matrix.iter() {\n        for &v in row.iter() {\n            let a = v.abs();\n            sum += a as i64;\n            if v < 0 {\n                negs += 1;\n            }\n            if a < mn {\n                mn = a;\n            }\n        }\n    }\n    if negs % 2 != 0 {\n        sum -= 2 * mn as i64;\n    }\n    sum as i32\n}`,
        php: `function maxMatrixSum($matrix) {\n    $sum = 0;\n    $negs = 0;\n    $mn = PHP_INT_MAX;\n    foreach ($matrix as $row) {\n        foreach ($row as $v) {\n            $a = abs($v);\n            $sum += $a;\n            if ($v < 0) $negs++;\n            if ($a < $mn) $mn = $a;\n        }\n    }\n    return $negs % 2 === 0 ? $sum : $sum - 2 * $mn;\n}`,
        ruby: `def maxMatrixSum(matrix)\n  sum = 0\n  negs = 0\n  mn = Float::INFINITY\n  matrix.each do |row|\n    row.each do |v|\n      a = v.abs\n      sum += a\n      negs += 1 if v < 0\n      mn = a if a < mn\n    end\n  end\n  negs.even? ? sum : sum - 2 * mn\nend`,
      },
    };
  })(),

  // ── Where Will the Ball Fall (LC 1706) ──────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const out: number[] = [];
      for (let start = 0; start < n; start++) {
        let col = start;
        for (let row = 0; row < m; row++) {
          const d = grid[row][col];
          const next = col + d;
          if (next < 0 || next >= n || grid[row][next] !== d) { col = -1; break; }
          col = next;
        }
        out.push(col);
      }
      return out;
    };
    return {
      slug: "where-will-the-ball-fall",
      title: "Where Will the Ball Fall",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Depth-First Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findBall", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A box has a diagonal board in every cell: `1` redirects a ball to the **right** (from the cell's top-left to its bottom-right) and `-1` redirects it to the **left**.\n\nOne ball is dropped into each column from the top. A ball gets stuck if a board sends it into a wall, or if two boards form a \"V\" that traps it. Return an array where entry `i` is the column the ball dropped into column `i` falls out of, or `-1` if it gets stuck.",
        [
          { in: "grid = [[1,1,1,-1,-1],[1,1,1,-1,-1],[-1,-1,-1,1,1],[1,1,1,1,-1],[-1,-1,-1,-1,-1]]", out: "[1,-1,-1,-1,-1]", note: "Only the first ball makes it through." },
          { in: "grid = [[-1]]", out: "[-1]", note: "The board pushes the ball straight into the left wall." },
          { in: "grid = [[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1],[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1]]", out: "[0,1,2,3,4,-1]" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 100", "grid[i][j] is 1 or -1"]),
      hints: [
        "Simulate each ball independently, one row at a time.",
        "A ball in column `c` of row `r` moves to column `c + grid[r][c]`.",
        "It gets stuck if that lands outside the grid, or if the neighbour's board points the other way — the \"V\".",
      ],
      editorial: explain({
        idea: "Each ball's path is determined and never interacts with the others, so simulate them one at a time. Per row there are only two failure modes: walking off the side, or meeting an opposing board.",
        steps: [
          "For each starting column, walk down row by row.",
          "Let `d = grid[row][col]` and `next = col + d`.",
          "Stop with `-1` if `next` is out of range, or if `grid[row][next] != d` (a V).",
          "Otherwise continue from `next` in the following row.",
        ],
        why: "A board in cell `(r, c)` guides the ball diagonally into column `c + d` of the *same* row before it drops. If the neighbouring cell's board slopes the other way, the two form a V that pins the ball — which is exactly the `grid[row][next] != d` test. Nothing else can stop it, so the two checks are complete.",
        time: "O(m · n)",
        space: "O(n) for the output",
        pitfalls: [
          "Checking only the wall misses the V case and reports balls that never escape.",
          "The V is detected against the cell the ball moves *into*, in the same row.",
          "The balls are independent; there is no need to simulate them together.",
        ],
      }),
      examples: [
        { input: "[[1,1,1,-1,-1],[1,1,1,-1,-1],[-1,-1,-1,1,1],[1,1,1,1,-1],[-1,-1,-1,-1,-1]]", expectedOutput: "[1,-1,-1,-1,-1]" },
        { input: "[[-1]]", expectedOutput: "[-1]" },
        { input: "[[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1],[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1]]", expectedOutput: "[0,1,2,3,4,-1]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 7);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.5 ? 1 : -1)));
        return { input: fmtIntMat(grid), expectedOutput: fmtIntArr(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findBall(grid: List[List[int]]) -> List[int]:\n    m, n = len(grid), len(grid[0])\n    out = []\n    for start in range(n):\n        col = start\n        for row in range(m):\n            d = grid[row][col]\n            nxt = col + d\n            if nxt < 0 or nxt >= n or grid[row][nxt] != d:\n                col = -1\n                break\n            col = nxt\n        out.append(col)\n    return out`,
        javascript: `var findBall = function(grid) {\n    var m = grid.length, n = grid[0].length;\n    var out = [];\n    for (var start = 0; start < n; start++) {\n        var col = start;\n        for (var row = 0; row < m; row++) {\n            var d = grid[row][col];\n            var next = col + d;\n            if (next < 0 || next >= n || grid[row][next] !== d) { col = -1; break; }\n            col = next;\n        }\n        out.push(col);\n    }\n    return out;\n};`,
        typescript: `function findBall(grid: number[][]): number[] {\n    var m = grid.length, n = grid[0].length;\n    var out: number[] = [];\n    for (var start = 0; start < n; start++) {\n        var col = start;\n        for (var row = 0; row < m; row++) {\n            var d = grid[row][col];\n            var next = col + d;\n            if (next < 0 || next >= n || grid[row][next] !== d) { col = -1; break; }\n            col = next;\n        }\n        out.push(col);\n    }\n    return out;\n}`,
        java: `public static int[] findBall(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[] out = new int[n];\n    for (int start = 0; start < n; start++) {\n        int col = start;\n        for (int row = 0; row < m; row++) {\n            int d = grid[row][col];\n            int next = col + d;\n            if (next < 0 || next >= n || grid[row][next] != d) {\n                col = -1;\n                break;\n            }\n            col = next;\n        }\n        out[start] = col;\n    }\n    return out;\n}`,
        cpp: `vector<int> findBall(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> out;\n    for (int start = 0; start < n; start++) {\n        int col = start;\n        for (int row = 0; row < m; row++) {\n            int d = grid[row][col];\n            int next = col + d;\n            if (next < 0 || next >= n || grid[row][next] != d) {\n                col = -1;\n                break;\n            }\n            col = next;\n        }\n        out.push_back(col);\n    }\n    return out;\n}`,
        c: `int* findBall(int** grid, int gridSize, int* gridColSize, int* returnSize) {\n    int m = gridSize, n = gridColSize[0];\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    for (int start = 0; start < n; start++) {\n        int col = start;\n        for (int row = 0; row < m; row++) {\n            int d = grid[row][col];\n            int next = col + d;\n            if (next < 0 || next >= n || grid[row][next] != d) {\n                col = -1;\n                break;\n            }\n            col = next;\n        }\n        out[start] = col;\n    }\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] FindBall(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int[] out_ = new int[n];\n    for (int start = 0; start < n; start++)\n    {\n        int col = start;\n        for (int row = 0; row < m; row++)\n        {\n            int d = grid[row][col];\n            int next = col + d;\n            if (next < 0 || next >= n || grid[row][next] != d)\n            {\n                col = -1;\n                break;\n            }\n            col = next;\n        }\n        out_[start] = col;\n    }\n    return out_;\n}`,
        go: `func findBall(grid [][]int) []int {\n\tm, n := len(grid), len(grid[0])\n\tout := make([]int, n)\n\tfor start := 0; start < n; start++ {\n\t\tcol := start\n\t\tfor row := 0; row < m; row++ {\n\t\t\td := grid[row][col]\n\t\t\tnext := col + d\n\t\t\tif next < 0 || next >= n || grid[row][next] != d {\n\t\t\t\tcol = -1\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tcol = next\n\t\t}\n\t\tout[start] = col\n\t}\n\treturn out\n}`,
        kotlin: `fun findBall(grid: Array<IntArray>): IntArray {\n    val m = grid.size\n    val n = grid[0].size\n    val out = IntArray(n)\n    for (start in 0 until n) {\n        var col = start\n        for (row in 0 until m) {\n            val d = grid[row][col]\n            val next = col + d\n            if (next < 0 || next >= n || grid[row][next] != d) {\n                col = -1\n                break\n            }\n            col = next\n        }\n        out[start] = col\n    }\n    return out\n}`,
        swift: `func findBall(_ grid: [[Int]]) -> [Int] {\n    let m = grid.count\n    let n = grid[0].count\n    var out = [Int]()\n    for start in 0..<n {\n        var col = start\n        for row in 0..<m {\n            let d = grid[row][col]\n            let next = col + d\n            if next < 0 || next >= n || grid[row][next] != d {\n                col = -1\n                break\n            }\n            col = next\n        }\n        out.append(col)\n    }\n    return out\n}`,
        rust: `fn findBall(grid: Vec<Vec<i32>>) -> Vec<i32> {\n    let m = grid.len();\n    let n = grid[0].len() as i32;\n    let mut out = Vec::new();\n    for start in 0..n {\n        let mut col = start;\n        for row in 0..m {\n            let d = grid[row][col as usize];\n            let next = col + d;\n            if next < 0 || next >= n || grid[row][next as usize] != d {\n                col = -1;\n                break;\n            }\n            col = next;\n        }\n        out.push(col);\n    }\n    out\n}`,
        php: `function findBall($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $out = [];\n    for ($start = 0; $start < $n; $start++) {\n        $col = $start;\n        for ($row = 0; $row < $m; $row++) {\n            $d = $grid[$row][$col];\n            $next = $col + $d;\n            if ($next < 0 || $next >= $n || $grid[$row][$next] !== $d) {\n                $col = -1;\n                break;\n            }\n            $col = $next;\n        }\n        $out[] = $col;\n    }\n    return $out;\n}`,
        ruby: `def findBall(grid)\n  m = grid.length\n  n = grid[0].length\n  (0...n).map do |start|\n    col = start\n    (0...m).each do |row|\n      d = grid[row][col]\n      nxt = col + d\n      if nxt < 0 || nxt >= n || grid[row][nxt] != d\n        col = -1\n        break\n      end\n      col = nxt\n    end\n    col\n  end\nend`,
      },
    };
  })(),

  // ── Spiral Matrix III (LC 885) ──────────────────────────────────
  (() => {
    const ref = (rows: number, cols: number, rStart: number, cStart: number) => {
      const dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];
      const out: number[][] = [[rStart, cStart]];
      let r = rStart, c = cStart, len = 0, d = 0;
      while (out.length < rows * cols) {
        if (d === 0 || d === 2) len++;
        for (let i = 0; i < len; i++) {
          r += dr[d];
          c += dc[d];
          if (r >= 0 && r < rows && c >= 0 && c < cols) out.push([r, c]);
        }
        d = (d + 1) % 4;
      }
      return out;
    };
    return {
      slug: "spiral-matrix-iii",
      title: "Spiral Matrix III",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "spiralMatrixIII", params: [{ name: "rows", type: "int" as const }, { name: "cols", type: "int" as const }, { name: "rStart", type: "int" as const }, { name: "cStart", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Start at `(rStart, cStart)` in a `rows × cols` grid, facing **east**, and walk a clockwise spiral. Whenever the walk leaves the grid you keep going in the same pattern but visit nothing, and you re-enter later.\n\nReturn the coordinates of the grid cells in the order they are visited, until all `rows · cols` cells have been seen.",
        [
          { in: "rows = 1, cols = 4, rStart = 0, cStart = 0", out: "[[0,0],[0,1],[0,2],[0,3]]" },
          { in: "rows = 2, cols = 2, rStart = 0, cStart = 0", out: "[[0,0],[0,1],[1,1],[1,0]]" },
          { in: "rows = 1, cols = 1, rStart = 0, cStart = 0", out: "[[0,0]]" },
        ],
        ["1 <= rows, cols <= 100", "0 <= rStart < rows", "0 <= cStart < cols"]),
      hints: [
        "The spiral's leg lengths go 1, 1, 2, 2, 3, 3, … — they grow every **two** turns.",
        "Walk the full pattern regardless of the grid, and simply skip recording anything out of bounds.",
        "Stop as soon as all `rows · cols` cells have been recorded.",
      ],
      editorial: explain({
        idea: "Follow the spiral blindly, ignoring the grid's edges, and record only the steps that land inside. The leg lengths grow by one each time the direction returns to east or west, which produces the 1, 1, 2, 2, 3, 3 pattern.",
        steps: [
          "Record the start, then cycle the directions east, south, west, north.",
          "Increase the leg length whenever the direction is east or west.",
          "Take that many steps, recording each in-bounds cell.",
          "Stop once the output holds `rows · cols` entries.",
        ],
        why: "The spiral is an unconditional geometric pattern; only the *recording* depends on the grid. Letting the walk wander outside keeps the pattern simple and is guaranteed to terminate, because the spiral eventually encloses the whole grid — after at most about `2·(rows + cols)` legs every cell has been passed.",
        time: "O((rows + cols)²)",
        space: "O(rows · cols) for the output",
        pitfalls: [
          "Growing the leg length every turn instead of every two turns gives the wrong path.",
          "Trying to clamp the walk to the grid breaks the spiral's shape.",
          "The loop must be bounded by the count of recorded cells, not by the number of steps taken.",
        ],
      }),
      examples: [
        { input: "1\n4\n0\n0", expectedOutput: "[[0,0],[0,1],[0,2],[0,3]]" },
        { input: "2\n2\n0\n0", expectedOutput: "[[0,0],[0,1],[1,1],[1,0]]" },
        { input: "1\n1\n0\n0", expectedOutput: "[[0,0]]" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 6), cols = ri(rng, 1, 6);
        const rStart = ri(rng, 0, rows - 1), cStart = ri(rng, 0, cols - 1);
        return { input: `${rows}\n${cols}\n${rStart}\n${cStart}`, expectedOutput: fmtIntMat(ref(rows, cols, rStart, cStart)) };
      },
      solutions: {
        python: `from typing import List\n\ndef spiralMatrixIII(rows: int, cols: int, rStart: int, cStart: int) -> List[List[int]]:\n    dr = [0, 1, 0, -1]\n    dc = [1, 0, -1, 0]\n    out = [[rStart, cStart]]\n    r, c, length, d = rStart, cStart, 0, 0\n    while len(out) < rows * cols:\n        if d == 0 or d == 2:\n            length += 1\n        for _ in range(length):\n            r += dr[d]\n            c += dc[d]\n            if 0 <= r < rows and 0 <= c < cols:\n                out.append([r, c])\n        d = (d + 1) % 4\n    return out`,
        javascript: `var spiralMatrixIII = function(rows, cols, rStart, cStart) {\n    var dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];\n    var out = [[rStart, cStart]];\n    var r = rStart, c = cStart, len = 0, d = 0;\n    while (out.length < rows * cols) {\n        if (d === 0 || d === 2) len++;\n        for (var i = 0; i < len; i++) {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols) out.push([r, c]);\n        }\n        d = (d + 1) % 4;\n    }\n    return out;\n};`,
        typescript: `function spiralMatrixIII(rows: number, cols: number, rStart: number, cStart: number): number[][] {\n    var dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];\n    var out: number[][] = [[rStart, cStart]];\n    var r = rStart, c = cStart, len = 0, d = 0;\n    while (out.length < rows * cols) {\n        if (d === 0 || d === 2) len++;\n        for (var i = 0; i < len; i++) {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols) out.push([r, c]);\n        }\n        d = (d + 1) % 4;\n    }\n    return out;\n}`,
        java: `public static int[][] spiralMatrixIII(int rows, int cols, int rStart, int cStart) {\n    int[] dr = { 0, 1, 0, -1 };\n    int[] dc = { 1, 0, -1, 0 };\n    int total = rows * cols;\n    int[][] out = new int[total][2];\n    int cnt = 0;\n    out[cnt][0] = rStart;\n    out[cnt][1] = cStart;\n    cnt++;\n    int r = rStart, c = cStart, len = 0, d = 0;\n    while (cnt < total) {\n        if (d == 0 || d == 2) len++;\n        for (int i = 0; i < len && cnt < total; i++) {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols) {\n                out[cnt][0] = r;\n                out[cnt][1] = c;\n                cnt++;\n            }\n        }\n        d = (d + 1) % 4;\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> spiralMatrixIII(int rows, int cols, int rStart, int cStart) {\n    int dr[4] = { 0, 1, 0, -1 };\n    int dc[4] = { 1, 0, -1, 0 };\n    vector<vector<int>> out;\n    out.push_back({ rStart, cStart });\n    int r = rStart, c = cStart, len = 0, d = 0;\n    int total = rows * cols;\n    while ((int) out.size() < total) {\n        if (d == 0 || d == 2) len++;\n        for (int i = 0; i < len; i++) {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols) out.push_back({ r, c });\n        }\n        d = (d + 1) % 4;\n    }\n    return out;\n}`,
        c: `int** spiralMatrixIII(int rows, int cols, int rStart, int cStart, int* returnSize, int** returnColumnSizes) {\n    int dr[4] = { 0, 1, 0, -1 };\n    int dc[4] = { 1, 0, -1, 0 };\n    int total = rows * cols;\n    int** out = (int**) malloc((size_t) total * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) total * sizeof(int));\n    int cnt = 0;\n    out[cnt] = (int*) malloc(2 * sizeof(int));\n    out[cnt][0] = rStart;\n    out[cnt][1] = cStart;\n    (*returnColumnSizes)[cnt] = 2;\n    cnt++;\n    int r = rStart, c = cStart, len = 0, d = 0;\n    while (cnt < total) {\n        if (d == 0 || d == 2) len++;\n        for (int i = 0; i < len && cnt < total; i++) {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols) {\n                out[cnt] = (int*) malloc(2 * sizeof(int));\n                out[cnt][0] = r;\n                out[cnt][1] = c;\n                (*returnColumnSizes)[cnt] = 2;\n                cnt++;\n            }\n        }\n        d = (d + 1) % 4;\n    }\n    *returnSize = total;\n    return out;\n}`,
        csharp: `public static int[][] SpiralMatrixIII(int rows, int cols, int rStart, int cStart)\n{\n    int[] dr = { 0, 1, 0, -1 };\n    int[] dc = { 1, 0, -1, 0 };\n    int total = rows * cols;\n    var out_ = new int[total][];\n    int cnt = 0;\n    out_[cnt++] = new int[] { rStart, cStart };\n    int r = rStart, c = cStart, len = 0, d = 0;\n    while (cnt < total)\n    {\n        if (d == 0 || d == 2) len++;\n        for (int i = 0; i < len && cnt < total; i++)\n        {\n            r += dr[d];\n            c += dc[d];\n            if (r >= 0 && r < rows && c >= 0 && c < cols)\n            {\n                out_[cnt++] = new int[] { r, c };\n            }\n        }\n        d = (d + 1) % 4;\n    }\n    return out_;\n}`,
        go: `func spiralMatrixIII(rows int, cols int, rStart int, cStart int) [][]int {\n\tdr := []int{0, 1, 0, -1}\n\tdc := []int{1, 0, -1, 0}\n\tout := [][]int{{rStart, cStart}}\n\tr, c, length, d := rStart, cStart, 0, 0\n\ttotal := rows * cols\n\tfor len(out) < total {\n\t\tif d == 0 || d == 2 {\n\t\t\tlength++\n\t\t}\n\t\tfor i := 0; i < length; i++ {\n\t\t\tr += dr[d]\n\t\t\tc += dc[d]\n\t\t\tif r >= 0 && r < rows && c >= 0 && c < cols {\n\t\t\t\tout = append(out, []int{r, c})\n\t\t\t}\n\t\t}\n\t\td = (d + 1) % 4\n\t}\n\treturn out\n}`,
        kotlin: `fun spiralMatrixIII(rows: Int, cols: Int, rStart: Int, cStart: Int): Array<IntArray> {\n    val dr = intArrayOf(0, 1, 0, -1)\n    val dc = intArrayOf(1, 0, -1, 0)\n    val out = ArrayList<IntArray>()\n    out.add(intArrayOf(rStart, cStart))\n    var r = rStart\n    var c = cStart\n    var len = 0\n    var d = 0\n    val total = rows * cols\n    while (out.size < total) {\n        if (d == 0 || d == 2) len++\n        for (i in 0 until len) {\n            r += dr[d]\n            c += dc[d]\n            if (r in 0 until rows && c in 0 until cols) out.add(intArrayOf(r, c))\n        }\n        d = (d + 1) % 4\n    }\n    return out.toTypedArray()\n}`,
        swift: `func spiralMatrixIII(_ rows: Int, _ cols: Int, _ rStart: Int, _ cStart: Int) -> [[Int]] {\n    let dr = [0, 1, 0, -1]\n    let dc = [1, 0, -1, 0]\n    var out = [[rStart, cStart]]\n    var r = rStart\n    var c = cStart\n    var len = 0\n    var d = 0\n    let total = rows * cols\n    while out.count < total {\n        if d == 0 || d == 2 { len += 1 }\n        for _ in 0..<len {\n            r += dr[d]\n            c += dc[d]\n            if r >= 0 && r < rows && c >= 0 && c < cols { out.append([r, c]) }\n        }\n        d = (d + 1) % 4\n    }\n    return out\n}`,
        rust: `fn spiralMatrixIII(rows: i32, cols: i32, rStart: i32, cStart: i32) -> Vec<Vec<i32>> {\n    let dr = [0i32, 1, 0, -1];\n    let dc = [1i32, 0, -1, 0];\n    let mut out: Vec<Vec<i32>> = vec![vec![rStart, cStart]];\n    let mut r = rStart;\n    let mut c = cStart;\n    let mut len = 0i32;\n    let mut d = 0usize;\n    let total = (rows * cols) as usize;\n    while out.len() < total {\n        if d == 0 || d == 2 {\n            len += 1;\n        }\n        for _ in 0..len {\n            r += dr[d];\n            c += dc[d];\n            if r >= 0 && r < rows && c >= 0 && c < cols {\n                out.push(vec![r, c]);\n            }\n        }\n        d = (d + 1) % 4;\n    }\n    out\n}`,
        php: `function spiralMatrixIII($rows, $cols, $rStart, $cStart) {\n    $dr = [0, 1, 0, -1];\n    $dc = [1, 0, -1, 0];\n    $out = [[$rStart, $cStart]];\n    $r = $rStart;\n    $c = $cStart;\n    $len = 0;\n    $d = 0;\n    $total = $rows * $cols;\n    while (count($out) < $total) {\n        if ($d === 0 || $d === 2) $len++;\n        for ($i = 0; $i < $len; $i++) {\n            $r += $dr[$d];\n            $c += $dc[$d];\n            if ($r >= 0 && $r < $rows && $c >= 0 && $c < $cols) $out[] = [$r, $c];\n        }\n        $d = ($d + 1) % 4;\n    }\n    return $out;\n}`,
        ruby: `def spiralMatrixIII(rows, cols, rStart, cStart)\n  dr = [0, 1, 0, -1]\n  dc = [1, 0, -1, 0]\n  out = [[rStart, cStart]]\n  r = rStart\n  c = cStart\n  len = 0\n  d = 0\n  total = rows * cols\n  while out.length < total\n    len += 1 if d == 0 || d == 2\n    len.times do\n      r += dr[d]\n      c += dc[d]\n      out << [r, c] if r >= 0 && r < rows && c >= 0 && c < cols\n    end\n    d = (d + 1) % 4\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Matrix Block Sum (LC 1314) ──────────────────────────────────
  (() => {
    const ref = (mat: number[][], k: number) => {
      const m = mat.length, n = mat[0].length;
      const pre = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];
        }
      }
      const out: number[][] = [];
      for (let i = 0; i < m; i++) {
        const row: number[] = [];
        for (let j = 0; j < n; j++) {
          const r1 = Math.max(0, i - k), c1 = Math.max(0, j - k);
          const r2 = Math.min(m - 1, i + k), c2 = Math.min(n - 1, j + k);
          row.push(pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]);
        }
        out.push(row);
      }
      return out;
    };
    return {
      slug: "matrix-block-sum",
      title: "Matrix Block Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Amazon", "Google", "Adobe"],
      signature: { funcName: "matrixBlockSum", params: [{ name: "mat", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Return a matrix `answer` of the same size as `mat` where `answer[i][j]` is the sum of all `mat[r][c]` with `i - k <= r <= i + k` and `j - k <= c <= j + k`, counting only positions inside the matrix.",
        [
          { in: "mat = [[1,2,3],[4,5,6],[7,8,9]], k = 1", out: "[[12,21,16],[27,45,33],[24,39,28]]" },
          { in: "mat = [[1,2,3],[4,5,6],[7,8,9]], k = 2", out: "[[45,45,45],[45,45,45],[45,45,45]]", note: "A radius of 2 covers the whole matrix from every cell." },
          { in: "mat = [[5]], k = 3", out: "[[5]]" },
        ],
        ["m == mat.length", "n == mat[i].length", "1 <= m, n, k <= 100", "1 <= mat[i][j] <= 100"]),
      hints: [
        "Summing each block directly is `O(m · n · k²)`.",
        "Build a 2D prefix-sum table so any rectangle's sum is four lookups.",
        "Clamp the block's corners to the matrix before querying.",
      ],
      editorial: explain({
        idea: "Precompute a 2D prefix-sum table, then answer every block with the standard inclusion-exclusion of four corners. Clamping handles blocks that hang over the edges.",
        steps: [
          "Build `pre` with an extra zero row and column, where `pre[i+1][j+1]` is the sum of `mat[0…i][0…j]`.",
          "For each cell, clamp the block to `[max(0, i-k), min(m-1, i+k)]` and likewise for columns.",
          "The block sum is `pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]`.",
        ],
        why: "The four-corner formula subtracts the two overlapping strips and adds back the doubly-subtracted corner — plain inclusion-exclusion. The padding row and column remove every boundary special case, which is what makes the clamped indices safe to use directly.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Forgetting the `+ pre[r1][c1]` term double-subtracts the overlap.",
          "The clamp is on the *block*, not on the prefix indices — the padded table then handles the rest.",
          "The totals reach `100 · 100 · 100 = 10^6`, comfortably inside `int`.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]\n1", expectedOutput: "[[12,21,16],[27,45,33],[24,39,28]]" },
        { input: "[[1,2,3],[4,5,6],[7,8,9]]\n2", expectedOutput: "[[45,45,45],[45,45,45],[45,45,45]]" },
        { input: "[[5]]\n3", expectedOutput: "[[5]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, 100)));
        const k = ri(rng, 1, 6);
        return { input: `${fmtIntMat(mat)}\n${k}`, expectedOutput: fmtIntMat(ref(mat, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef matrixBlockSum(mat: List[List[int]], k: int) -> List[List[int]]:\n    m, n = len(mat), len(mat[0])\n    pre = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m):\n        for j in range(n):\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]\n    out = []\n    for i in range(m):\n        row = []\n        for j in range(n):\n            r1, c1 = max(0, i - k), max(0, j - k)\n            r2, c2 = min(m - 1, i + k), min(n - 1, j + k)\n            row.append(pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1])\n        out.append(row)\n    return out`,
        javascript: `var matrixBlockSum = function(mat, k) {\n    var m = mat.length, n = mat[0].length, i, j;\n    var pre = [];\n    for (i = 0; i <= m; i++) {\n        var prow = [];\n        for (j = 0; j <= n; j++) prow.push(0);\n        pre.push(prow);\n    }\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];\n        }\n    }\n    var out = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) {\n            var r1 = Math.max(0, i - k), c1 = Math.max(0, j - k);\n            var r2 = Math.min(m - 1, i + k), c2 = Math.min(n - 1, j + k);\n            row.push(pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]);\n        }\n        out.push(row);\n    }\n    return out;\n};`,
        typescript: `function matrixBlockSum(mat: number[][], k: number): number[][] {\n    var m = mat.length, n = mat[0].length, i: number, j: number;\n    var pre: number[][] = [];\n    for (i = 0; i <= m; i++) {\n        var prow: number[] = [];\n        for (j = 0; j <= n; j++) prow.push(0);\n        pre.push(prow);\n    }\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];\n        }\n    }\n    var out: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) {\n            var r1 = Math.max(0, i - k), c1 = Math.max(0, j - k);\n            var r2 = Math.min(m - 1, i + k), c2 = Math.min(n - 1, j + k);\n            row.push(pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]);\n        }\n        out.push(row);\n    }\n    return out;\n}`,
        java: `public static int[][] matrixBlockSum(int[][] mat, int k) {\n    int m = mat.length, n = mat[0].length;\n    int[][] pre = new int[m + 1][n + 1];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];\n        }\n    }\n    int[][] out = new int[m][n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int r1 = Math.max(0, i - k), c1 = Math.max(0, j - k);\n            int r2 = Math.min(m - 1, i + k), c2 = Math.min(n - 1, j + k);\n            out[i][j] = pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1];\n        }\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> matrixBlockSum(vector<vector<int>>& mat, int k) {\n    int m = (int) mat.size(), n = (int) mat[0].size();\n    vector<vector<int>> pre(m + 1, vector<int>(n + 1, 0));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];\n        }\n    }\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int r1 = max(0, i - k), c1 = max(0, j - k);\n            int r2 = min(m - 1, i + k), c2 = min(n - 1, j + k);\n            out[i][j] = pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1];\n        }\n    }\n    return out;\n}`,
        c: `int** matrixBlockSum(int** mat, int matSize, int* matColSize, int k, int* returnSize, int** returnColumnSizes) {\n    int m = matSize, n = matColSize[0];\n    int w = n + 1;\n    int* pre = (int*) calloc((size_t) (m + 1) * (size_t) w, sizeof(int));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            pre[(i + 1) * w + (j + 1)] = mat[i][j] + pre[i * w + (j + 1)] + pre[(i + 1) * w + j] - pre[i * w + j];\n        }\n    }\n    int** out = (int**) malloc((size_t) m * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < m; i++) {\n        out[i] = (int*) malloc((size_t) n * sizeof(int));\n        (*returnColumnSizes)[i] = n;\n        for (int j = 0; j < n; j++) {\n            int r1 = i - k < 0 ? 0 : i - k;\n            int c1 = j - k < 0 ? 0 : j - k;\n            int r2 = i + k > m - 1 ? m - 1 : i + k;\n            int c2 = j + k > n - 1 ? n - 1 : j + k;\n            out[i][j] = pre[(r2 + 1) * w + (c2 + 1)] - pre[r1 * w + (c2 + 1)] - pre[(r2 + 1) * w + c1] + pre[r1 * w + c1];\n        }\n    }\n    free(pre);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[][] MatrixBlockSum(int[][] mat, int k)\n{\n    int m = mat.Length, n = mat[0].Length;\n    int[,] pre = new int[m + 1, n + 1];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            pre[i + 1, j + 1] = mat[i][j] + pre[i, j + 1] + pre[i + 1, j] - pre[i, j];\n        }\n    }\n    var out_ = new int[m][];\n    for (int i = 0; i < m; i++)\n    {\n        out_[i] = new int[n];\n        for (int j = 0; j < n; j++)\n        {\n            int r1 = Math.Max(0, i - k), c1 = Math.Max(0, j - k);\n            int r2 = Math.Min(m - 1, i + k), c2 = Math.Min(n - 1, j + k);\n            out_[i][j] = pre[r2 + 1, c2 + 1] - pre[r1, c2 + 1] - pre[r2 + 1, c1] + pre[r1, c1];\n        }\n    }\n    return out_;\n}`,
        go: `func matrixBlockSum(mat [][]int, k int) [][]int {\n\tm, n := len(mat), len(mat[0])\n\tpre := make([][]int, m+1)\n\tfor i := range pre {\n\t\tpre[i] = make([]int, n+1)\n\t}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tpre[i+1][j+1] = mat[i][j] + pre[i][j+1] + pre[i+1][j] - pre[i][j]\n\t\t}\n\t}\n\tout := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tout[i] = make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tr1, c1 := i-k, j-k\n\t\t\tif r1 < 0 {\n\t\t\t\tr1 = 0\n\t\t\t}\n\t\t\tif c1 < 0 {\n\t\t\t\tc1 = 0\n\t\t\t}\n\t\t\tr2, c2 := i+k, j+k\n\t\t\tif r2 > m-1 {\n\t\t\t\tr2 = m - 1\n\t\t\t}\n\t\t\tif c2 > n-1 {\n\t\t\t\tc2 = n - 1\n\t\t\t}\n\t\t\tout[i][j] = pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun matrixBlockSum(mat: Array<IntArray>, k: Int): Array<IntArray> {\n    val m = mat.size\n    val n = mat[0].size\n    val pre = Array(m + 1) { IntArray(n + 1) }\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]\n        }\n    }\n    return Array(m) { i ->\n        IntArray(n) { j ->\n            val r1 = maxOf(0, i - k)\n            val c1 = maxOf(0, j - k)\n            val r2 = minOf(m - 1, i + k)\n            val c2 = minOf(n - 1, j + k)\n            pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]\n        }\n    }\n}`,
        swift: `func matrixBlockSum(_ mat: [[Int]], _ k: Int) -> [[Int]] {\n    let m = mat.count\n    let n = mat[0].count\n    var pre = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)\n    for i in 0..<m {\n        for j in 0..<n {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]\n        }\n    }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for i in 0..<m {\n        for j in 0..<n {\n            let r1 = max(0, i - k), c1 = max(0, j - k)\n            let r2 = min(m - 1, i + k), c2 = min(n - 1, j + k)\n            out[i][j] = pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]\n        }\n    }\n    return out\n}`,
        rust: `fn matrixBlockSum(mat: Vec<Vec<i32>>, k: i32) -> Vec<Vec<i32>> {\n    let m = mat.len();\n    let n = mat[0].len();\n    let mut pre = vec![vec![0i32; n + 1]; m + 1];\n    for i in 0..m {\n        for j in 0..n {\n            pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j];\n        }\n    }\n    let mut out = vec![vec![0i32; n]; m];\n    for i in 0..m {\n        for j in 0..n {\n            let r1 = std::cmp::max(0, i as i32 - k) as usize;\n            let c1 = std::cmp::max(0, j as i32 - k) as usize;\n            let r2 = std::cmp::min(m as i32 - 1, i as i32 + k) as usize;\n            let c2 = std::cmp::min(n as i32 - 1, j as i32 + k) as usize;\n            out[i][j] = pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1];\n        }\n    }\n    out\n}`,
        php: `function matrixBlockSum($mat, $k) {\n    $m = count($mat);\n    $n = count($mat[0]);\n    $pre = [];\n    for ($i = 0; $i <= $m; $i++) $pre[$i] = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            $pre[$i + 1][$j + 1] = $mat[$i][$j] + $pre[$i][$j + 1] + $pre[$i + 1][$j] - $pre[$i][$j];\n        }\n    }\n    $out = [];\n    for ($i = 0; $i < $m; $i++) {\n        $row = [];\n        for ($j = 0; $j < $n; $j++) {\n            $r1 = max(0, $i - $k);\n            $c1 = max(0, $j - $k);\n            $r2 = min($m - 1, $i + $k);\n            $c2 = min($n - 1, $j + $k);\n            $row[] = $pre[$r2 + 1][$c2 + 1] - $pre[$r1][$c2 + 1] - $pre[$r2 + 1][$c1] + $pre[$r1][$c1];\n        }\n        $out[] = $row;\n    }\n    return $out;\n}`,
        ruby: `def matrixBlockSum(mat, k)\n  m = mat.length\n  n = mat[0].length\n  pre = Array.new(m + 1) { Array.new(n + 1, 0) }\n  (0...m).each do |i|\n    (0...n).each do |j|\n      pre[i + 1][j + 1] = mat[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]\n    end\n  end\n  (0...m).map do |i|\n    (0...n).map do |j|\n      r1 = [0, i - k].max\n      c1 = [0, j - k].max\n      r2 = [m - 1, i + k].min\n      c2 = [n - 1, j + k].min\n      pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1]\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Find All Groups of Farmland (LC 1992) ───────────────────────
  (() => {
    const ref = (land: number[][]) => {
      const m = land.length, n = land[0].length;
      const out: number[][] = [];
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (land[i][j] === 1 && (i === 0 || land[i - 1][j] === 0) && (j === 0 || land[i][j - 1] === 0)) {
            let r = i;
            while (r + 1 < m && land[r + 1][j] === 1) r++;
            let c = j;
            while (c + 1 < n && land[i][c + 1] === 1) c++;
            out.push([i, j, r, c]);
          }
        }
      }
      return out;
    };
    return {
      slug: "find-all-groups-of-farmland",
      title: "Find All Groups of Farmland",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Walmart"],
      signature: { funcName: "findFarmland", params: [{ name: "land", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "`land[i][j]` is `1` for farmland and `0` for forest. Farmland forms **rectangular** groups, and no two groups touch — not even diagonally.\n\nReturn one entry `[r1, c1, r2, c2]` per group, giving its top-left and bottom-right corners, ordered by where the top-left corner appears in a row-by-row scan.",
        [
          { in: "land = [[1,0,0],[0,1,1],[0,1,1]]", out: "[[0,0,0,0],[1,1,2,2]]", note: "A single cell and a 2 × 2 block." },
          { in: "land = [[1,1],[1,1]]", out: "[[0,0,1,1]]" },
          { in: "land = [[0]]", out: "[]", note: "No farmland at all." },
        ],
        ["m == land.length", "n == land[i].length", "1 <= m, n <= 300", "land[i][j] is 0 or 1", "Every group of farmland is rectangular and no two groups are adjacent, even diagonally."]),
      hints: [
        "Because groups are rectangles, no flood fill is needed — the corners can be read off directly.",
        "A cell is a group's top-left corner when it is farmland with forest (or the border) above **and** to its left.",
        "From there, walk down and right to find the opposite corner.",
      ],
      editorial: explain({
        idea: "The rectangle guarantee turns a connected-components problem into a scan. Each group has exactly one top-left corner, identified by a local test, and its extent follows from two straight walks.",
        steps: [
          "Scan row by row. A cell is a top-left corner if it is farmland and the cells above and to the left are forest or off the grid.",
          "Walk down the same column while the cells are farmland to find `r2`.",
          "Walk right along the same row to find `c2`.",
          "Record `[r1, c1, r2, c2]`.",
        ],
        why: "In a rectangle only the top-left cell has forest both above and to the left, so the test fires exactly once per group — which is what makes the row-major scan order well defined. The two walks are enough because the group is a full rectangle: its height is the run down the left column and its width the run along the top row.",
        time: "O(m · n)",
        space: "O(1) beyond the output",
        pitfalls: [
          "A flood fill also works but is more code and needs a visited grid.",
          "The corner test must treat the grid border as forest.",
          "A grid with no farmland returns an empty list, not a list with an empty entry.",
        ],
      }),
      examples: [
        { input: "[[1,0,0],[0,1,1],[0,1,1]]", expectedOutput: "[[0,0,0,0],[1,1,2,2]]" },
        { input: "[[1,1],[1,1]]", expectedOutput: "[[0,0,1,1]]" },
        { input: "[[0]]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        // Build the grid by planting non-touching rectangles, as the statement promises.
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const land = Array.from({ length: m }, () => new Array(n).fill(0));
        const free = (r1: number, c1: number, r2: number, c2: number) => {
          for (let i = r1 - 1; i <= r2 + 1; i++) {
            for (let j = c1 - 1; j <= c2 + 1; j++) {
              if (i >= 0 && i < m && j >= 0 && j < n && land[i][j] === 1) return false;
            }
          }
          return true;
        };
        for (let t = 0; t < 6; t++) {
          const r1 = ri(rng, 0, m - 1), c1 = ri(rng, 0, n - 1);
          const r2 = Math.min(m - 1, r1 + ri(rng, 0, 2));
          const c2 = Math.min(n - 1, c1 + ri(rng, 0, 2));
          if (!free(r1, c1, r2, c2)) continue;
          for (let i = r1; i <= r2; i++) for (let j = c1; j <= c2; j++) land[i][j] = 1;
        }
        return { input: fmtIntMat(land), expectedOutput: fmtIntMat(ref(land)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findFarmland(land: List[List[int]]) -> List[List[int]]:\n    m, n = len(land), len(land[0])\n    out = []\n    for i in range(m):\n        for j in range(n):\n            if land[i][j] == 1 and (i == 0 or land[i - 1][j] == 0) and (j == 0 or land[i][j - 1] == 0):\n                r = i\n                while r + 1 < m and land[r + 1][j] == 1:\n                    r += 1\n                c = j\n                while c + 1 < n and land[i][c + 1] == 1:\n                    c += 1\n                out.append([i, j, r, c])\n    return out`,
        javascript: `var findFarmland = function(land) {\n    var m = land.length, n = land[0].length;\n    var out = [];\n    for (var i = 0; i < m; i++) {\n        for (var j = 0; j < n; j++) {\n            if (land[i][j] === 1 && (i === 0 || land[i - 1][j] === 0) && (j === 0 || land[i][j - 1] === 0)) {\n                var r = i;\n                while (r + 1 < m && land[r + 1][j] === 1) r++;\n                var c = j;\n                while (c + 1 < n && land[i][c + 1] === 1) c++;\n                out.push([i, j, r, c]);\n            }\n        }\n    }\n    return out;\n};`,
        typescript: `function findFarmland(land: number[][]): number[][] {\n    var m = land.length, n = land[0].length;\n    var out: number[][] = [];\n    for (var i = 0; i < m; i++) {\n        for (var j = 0; j < n; j++) {\n            if (land[i][j] === 1 && (i === 0 || land[i - 1][j] === 0) && (j === 0 || land[i][j - 1] === 0)) {\n                var r = i;\n                while (r + 1 < m && land[r + 1][j] === 1) r++;\n                var c = j;\n                while (c + 1 < n && land[i][c + 1] === 1) c++;\n                out.push([i, j, r, c]);\n            }\n        }\n    }\n    return out;\n}`,
        java: `public static int[][] findFarmland(int[][] land) {\n    int m = land.length, n = land[0].length;\n    List<int[]> out = new ArrayList<>();\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0)) {\n                int r = i;\n                while (r + 1 < m && land[r + 1][j] == 1) r++;\n                int c = j;\n                while (c + 1 < n && land[i][c + 1] == 1) c++;\n                out.add(new int[] { i, j, r, c });\n            }\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> findFarmland(vector<vector<int>>& land) {\n    int m = (int) land.size(), n = (int) land[0].size();\n    vector<vector<int>> out;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0)) {\n                int r = i;\n                while (r + 1 < m && land[r + 1][j] == 1) r++;\n                int c = j;\n                while (c + 1 < n && land[i][c + 1] == 1) c++;\n                out.push_back({ i, j, r, c });\n            }\n        }\n    }\n    return out;\n}`,
        c: `int** findFarmland(int** land, int landSize, int* landColSize, int* returnSize, int** returnColumnSizes) {\n    int m = landSize, n = landColSize[0];\n    int cap = m * n + 1;\n    int** out = (int**) malloc((size_t) cap * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) cap * sizeof(int));\n    int cnt = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0)) {\n                int r = i;\n                while (r + 1 < m && land[r + 1][j] == 1) r++;\n                int c = j;\n                while (c + 1 < n && land[i][c + 1] == 1) c++;\n                out[cnt] = (int*) malloc(4 * sizeof(int));\n                out[cnt][0] = i;\n                out[cnt][1] = j;\n                out[cnt][2] = r;\n                out[cnt][3] = c;\n                (*returnColumnSizes)[cnt] = 4;\n                cnt++;\n            }\n        }\n    }\n    *returnSize = cnt;\n    return out;\n}`,
        csharp: `public static int[][] FindFarmland(int[][] land)\n{\n    int m = land.Length, n = land[0].Length;\n    var out_ = new List<int[]>();\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0))\n            {\n                int r = i;\n                while (r + 1 < m && land[r + 1][j] == 1) r++;\n                int c = j;\n                while (c + 1 < n && land[i][c + 1] == 1) c++;\n                out_.Add(new int[] { i, j, r, c });\n            }\n        }\n    }\n    return out_.ToArray();\n}`,
        go: `func findFarmland(land [][]int) [][]int {\n\tm, n := len(land), len(land[0])\n\tout := [][]int{}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif land[i][j] == 1 && (i == 0 || land[i-1][j] == 0) && (j == 0 || land[i][j-1] == 0) {\n\t\t\t\tr := i\n\t\t\t\tfor r+1 < m && land[r+1][j] == 1 {\n\t\t\t\t\tr++\n\t\t\t\t}\n\t\t\t\tc := j\n\t\t\t\tfor c+1 < n && land[i][c+1] == 1 {\n\t\t\t\t\tc++\n\t\t\t\t}\n\t\t\t\tout = append(out, []int{i, j, r, c})\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findFarmland(land: Array<IntArray>): Array<IntArray> {\n    val m = land.size\n    val n = land[0].size\n    val out = ArrayList<IntArray>()\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0)) {\n                var r = i\n                while (r + 1 < m && land[r + 1][j] == 1) r++\n                var c = j\n                while (c + 1 < n && land[i][c + 1] == 1) c++\n                out.add(intArrayOf(i, j, r, c))\n            }\n        }\n    }\n    return out.toTypedArray()\n}`,
        swift: `func findFarmland(_ land: [[Int]]) -> [[Int]] {\n    let m = land.count\n    let n = land[0].count\n    var out = [[Int]]()\n    for i in 0..<m {\n        for j in 0..<n {\n            if land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0) {\n                var r = i\n                while r + 1 < m && land[r + 1][j] == 1 { r += 1 }\n                var c = j\n                while c + 1 < n && land[i][c + 1] == 1 { c += 1 }\n                out.append([i, j, r, c])\n            }\n        }\n    }\n    return out\n}`,
        rust: `fn findFarmland(land: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = land.len();\n    let n = land[0].len();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for i in 0..m {\n        for j in 0..n {\n            if land[i][j] == 1\n                && (i == 0 || land[i - 1][j] == 0)\n                && (j == 0 || land[i][j - 1] == 0)\n            {\n                let mut r = i;\n                while r + 1 < m && land[r + 1][j] == 1 {\n                    r += 1;\n                }\n                let mut c = j;\n                while c + 1 < n && land[i][c + 1] == 1 {\n                    c += 1;\n                }\n                out.push(vec![i as i32, j as i32, r as i32, c as i32]);\n            }\n        }\n    }\n    out\n}`,
        php: `function findFarmland($land) {\n    $m = count($land);\n    $n = count($land[0]);\n    $out = [];\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($land[$i][$j] === 1 && ($i === 0 || $land[$i - 1][$j] === 0) && ($j === 0 || $land[$i][$j - 1] === 0)) {\n                $r = $i;\n                while ($r + 1 < $m && $land[$r + 1][$j] === 1) $r++;\n                $c = $j;\n                while ($c + 1 < $n && $land[$i][$c + 1] === 1) $c++;\n                $out[] = [$i, $j, $r, $c];\n            }\n        }\n    }\n    return $out;\n}`,
        ruby: `def findFarmland(land)\n  m = land.length\n  n = land[0].length\n  out = []\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next unless land[i][j] == 1 && (i == 0 || land[i - 1][j] == 0) && (j == 0 || land[i][j - 1] == 0)\n      r = i\n      r += 1 while r + 1 < m && land[r + 1][j] == 1\n      c = j\n      c += 1 while c + 1 < n && land[i][c + 1] == 1\n      out << [i, j, r, c]\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Rotating the Box (LC 1861) ──────────────────────────────────
  (() => {
    const ref = (box: string[]) => {
      const m = box.length, n = box[0].length;
      const rows = box.map((s) => s.split(""));
      for (let i = 0; i < m; i++) {
        let empty = n - 1;
        for (let j = n - 1; j >= 0; j--) {
          if (rows[i][j] === "*") empty = j - 1;
          else if (rows[i][j] === "#") {
            rows[i][j] = ".";
            rows[i][empty] = "#";
            empty--;
          }
        }
      }
      const out: string[] = [];
      for (let j = 0; j < n; j++) {
        let s = "";
        for (let i = m - 1; i >= 0; i--) s += rows[i][j];
        out.push(s);
      }
      return out;
    };
    return {
      slug: "rotating-the-box",
      title: "Rotating the Box",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Two Pointers", "Simulation", "Amazon", "Microsoft", "Zoho"],
      signature: { funcName: "rotateTheBox", params: [{ name: "grid", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "A grid of stones is given as rows of characters: `#` is a stone, `*` is a fixed obstacle and `.` is empty.\n\nThe grid is rotated **90° clockwise**, then gravity pulls every stone straight down until it rests on the bottom, on an obstacle, or on another stone. Obstacles never move. Return the rows of the grid after the rotation has settled.",
        [
          { in: 'grid = ["#.#"]', out: '[".","#","#"]', note: "One row becomes one column; the two stones settle at the bottom." },
          { in: 'grid = ["#.*.","##*."]', out: '["#.","##","**",".."]' },
          { in: 'grid = ["##*.*.","###*..","###.#."]', out: '[".##",".##","##*","#*.","#.*","#.."]' },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 500", "grid[i][j] is '#', '*' or '.'"]),
      hints: [
        "Rotating clockwise turns each original **row** into a column, so gravity acts along the original rows — towards the right end.",
        "Settle the stones in the original orientation first, then rotate; doing it the other way round is far messier.",
        "Sweep each row from right to left, tracking the rightmost free slot; an obstacle resets it.",
      ],
      editorial: explain({
        idea: "Do gravity before the rotation. After a clockwise turn, \"down\" in the rotated grid is \"right\" in the original, so one right-to-left sweep per row settles everything. The rotation is then a plain index transpose.",
        steps: [
          "For each row, keep `empty` at the rightmost slot a stone may fall into, starting at `n - 1`.",
          "Walk right to left: an obstacle sets `empty = j - 1`; a stone moves to `empty` and decrements it; a gap is skipped.",
          "Rotate by reading column `j` bottom-to-top into output row `j`.",
        ],
        why: "The `empty` pointer only ever moves left, so each row is settled in a single pass: every stone lands in the leftmost-unfilled position to its right, which is precisely where gravity would leave it once the grid is turned. An obstacle blocks the whole column beneath it after the turn, which is why it resets the pointer rather than being skipped.",
        time: "O(m · n)",
        space: "O(m · n) for the output",
        pitfalls: [
          "Applying gravity *after* rotating needs a bottom-up sweep per column and is easy to get wrong.",
          "Setting `empty = j` instead of `j - 1` at an obstacle lets a stone overwrite it.",
          "The rotation reads rows bottom-to-top: output row `j` is `grid[m-1][j] … grid[0][j]`.",
        ],
      }),
      examples: [
        { input: '["#.#"]', expectedOutput: '[".","#","#"]' },
        { input: '["#.*.","##*."]', expectedOutput: '["#.","##","**",".."]' },
        { input: '["##*.*.","###*..","###.#."]', expectedOutput: '[".##",".##","##*","#*.","#.*","#.."]' },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 7);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => pick(rng, ["#", "#", ".", ".", "*"])).join(""));
        return { input: fmtStrArr(grid), expectedOutput: fmtStrArr(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef rotateTheBox(grid: List[str]) -> List[str]:\n    m, n = len(grid), len(grid[0])\n    rows = [list(r) for r in grid]\n    for i in range(m):\n        empty = n - 1\n        for j in range(n - 1, -1, -1):\n            if rows[i][j] == '*':\n                empty = j - 1\n            elif rows[i][j] == '#':\n                rows[i][j] = '.'\n                rows[i][empty] = '#'\n                empty -= 1\n    return [''.join(rows[i][j] for i in range(m - 1, -1, -1)) for j in range(n)]`,
        javascript: `var rotateTheBox = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j;\n    var rows = [];\n    for (i = 0; i < m; i++) rows.push(grid[i].split(""));\n    for (i = 0; i < m; i++) {\n        var empty = n - 1;\n        for (j = n - 1; j >= 0; j--) {\n            if (rows[i][j] === "*") empty = j - 1;\n            else if (rows[i][j] === "#") {\n                rows[i][j] = ".";\n                rows[i][empty] = "#";\n                empty--;\n            }\n        }\n    }\n    var out = [];\n    for (j = 0; j < n; j++) {\n        var s = "";\n        for (i = m - 1; i >= 0; i--) s += rows[i][j];\n        out.push(s);\n    }\n    return out;\n};`,
        typescript: `function rotateTheBox(grid: string[]): string[] {\n    var m = grid.length, n = grid[0].length, i: number, j: number;\n    var rows: string[][] = [];\n    for (i = 0; i < m; i++) rows.push(grid[i].split(""));\n    for (i = 0; i < m; i++) {\n        var empty = n - 1;\n        for (j = n - 1; j >= 0; j--) {\n            if (rows[i][j] === "*") empty = j - 1;\n            else if (rows[i][j] === "#") {\n                rows[i][j] = ".";\n                rows[i][empty] = "#";\n                empty--;\n            }\n        }\n    }\n    var out: string[] = [];\n    for (j = 0; j < n; j++) {\n        var s = "";\n        for (i = m - 1; i >= 0; i--) s += rows[i][j];\n        out.push(s);\n    }\n    return out;\n}`,
        java: `public static String[] rotateTheBox(String[] grid) {\n    int m = grid.length, n = grid[0].length();\n    char[][] rows = new char[m][];\n    for (int i = 0; i < m; i++) rows[i] = grid[i].toCharArray();\n    for (int i = 0; i < m; i++) {\n        int empty = n - 1;\n        for (int j = n - 1; j >= 0; j--) {\n            if (rows[i][j] == '*') empty = j - 1;\n            else if (rows[i][j] == '#') {\n                rows[i][j] = '.';\n                rows[i][empty] = '#';\n                empty--;\n            }\n        }\n    }\n    String[] out = new String[n];\n    for (int j = 0; j < n; j++) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = m - 1; i >= 0; i--) sb.append(rows[i][j]);\n        out[j] = sb.toString();\n    }\n    return out;\n}`,
        cpp: `vector<string> rotateTheBox(vector<string>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<string> rows = grid;\n    for (int i = 0; i < m; i++) {\n        int empty = n - 1;\n        for (int j = n - 1; j >= 0; j--) {\n            if (rows[i][j] == '*') empty = j - 1;\n            else if (rows[i][j] == '#') {\n                rows[i][j] = '.';\n                rows[i][empty] = '#';\n                empty--;\n            }\n        }\n    }\n    vector<string> out;\n    for (int j = 0; j < n; j++) {\n        string s;\n        for (int i = m - 1; i >= 0; i--) s += rows[i][j];\n        out.push_back(s);\n    }\n    return out;\n}`,
        c: `char** rotateTheBox(char** grid, int boxSize, int* returnSize) {\n    int m = boxSize, n = (int) strlen(grid[0]);\n    char** rows = (char**) malloc((size_t) m * sizeof(char*));\n    for (int i = 0; i < m; i++) {\n        rows[i] = (char*) malloc((size_t) n + 1);\n        strcpy(rows[i], grid[i]);\n    }\n    for (int i = 0; i < m; i++) {\n        int empty = n - 1;\n        for (int j = n - 1; j >= 0; j--) {\n            if (rows[i][j] == '*') empty = j - 1;\n            else if (rows[i][j] == '#') {\n                rows[i][j] = '.';\n                rows[i][empty] = '#';\n                empty--;\n            }\n        }\n    }\n    char** out = (char**) malloc((size_t) n * sizeof(char*));\n    for (int j = 0; j < n; j++) {\n        out[j] = (char*) malloc((size_t) m + 1);\n        int p = 0;\n        for (int i = m - 1; i >= 0; i--) out[j][p++] = rows[i][j];\n        out[j][p] = '\\0';\n    }\n    for (int i = 0; i < m; i++) free(rows[i]);\n    free(rows);\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static string[] RotateTheBox(string[] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var rows = new char[m][];\n    for (int i = 0; i < m; i++) rows[i] = grid[i].ToCharArray();\n    for (int i = 0; i < m; i++)\n    {\n        int empty = n - 1;\n        for (int j = n - 1; j >= 0; j--)\n        {\n            if (rows[i][j] == '*') empty = j - 1;\n            else if (rows[i][j] == '#')\n            {\n                rows[i][j] = '.';\n                rows[i][empty] = '#';\n                empty--;\n            }\n        }\n    }\n    var out_ = new string[n];\n    for (int j = 0; j < n; j++)\n    {\n        var sb = new System.Text.StringBuilder();\n        for (int i = m - 1; i >= 0; i--) sb.Append(rows[i][j]);\n        out_[j] = sb.ToString();\n    }\n    return out_;\n}`,
        go: `func rotateTheBox(grid []string) []string {\n\tm, n := len(grid), len(grid[0])\n\trows := make([][]byte, m)\n\tfor i := 0; i < m; i++ {\n\t\trows[i] = []byte(grid[i])\n\t}\n\tfor i := 0; i < m; i++ {\n\t\tempty := n - 1\n\t\tfor j := n - 1; j >= 0; j-- {\n\t\t\tif rows[i][j] == '*' {\n\t\t\t\tempty = j - 1\n\t\t\t} else if rows[i][j] == '#' {\n\t\t\t\trows[i][j] = '.'\n\t\t\t\trows[i][empty] = '#'\n\t\t\t\tempty--\n\t\t\t}\n\t\t}\n\t}\n\tout := make([]string, n)\n\tfor j := 0; j < n; j++ {\n\t\tbuf := make([]byte, 0, m)\n\t\tfor i := m - 1; i >= 0; i-- {\n\t\t\tbuf = append(buf, rows[i][j])\n\t\t}\n\t\tout[j] = string(buf)\n\t}\n\treturn out\n}`,
        kotlin: `fun rotateTheBox(grid: Array<String>): Array<String> {\n    val m = grid.size\n    val n = grid[0].length\n    val rows = Array(m) { grid[it].toCharArray() }\n    for (i in 0 until m) {\n        var empty = n - 1\n        for (j in n - 1 downTo 0) {\n            if (rows[i][j] == '*') {\n                empty = j - 1\n            } else if (rows[i][j] == '#') {\n                rows[i][j] = '.'\n                rows[i][empty] = '#'\n                empty--\n            }\n        }\n    }\n    return Array(n) { j ->\n        val sb = StringBuilder()\n        for (i in m - 1 downTo 0) sb.append(rows[i][j])\n        sb.toString()\n    }\n}`,
        swift: `func rotateTheBox(_ grid: [String]) -> [String] {\n    let m = grid.count\n    let n = grid[0].count\n    var rows = grid.map { Array($0) }\n    for i in 0..<m {\n        var empty = n - 1\n        for j in stride(from: n - 1, through: 0, by: -1) {\n            if rows[i][j] == "*" {\n                empty = j - 1\n            } else if rows[i][j] == "#" {\n                rows[i][j] = "."\n                rows[i][empty] = "#"\n                empty -= 1\n            }\n        }\n    }\n    var out = [String]()\n    for j in 0..<n {\n        var s = ""\n        for i in stride(from: m - 1, through: 0, by: -1) { s.append(rows[i][j]) }\n        out.append(s)\n    }\n    return out\n}`,
        rust: `fn rotateTheBox(grid_: Vec<String>) -> Vec<String> {\n    let m = grid_.len();\n    let n = grid_[0].len();\n    let mut rows: Vec<Vec<u8>> = grid_.iter().map(|s| s.as_bytes().to_vec()).collect();\n    for i in 0..m {\n        let mut empty = n as i32 - 1;\n        for j in (0..n).rev() {\n            if rows[i][j] == b'*' {\n                empty = j as i32 - 1;\n            } else if rows[i][j] == b'#' {\n                rows[i][j] = b'.';\n                rows[i][empty as usize] = b'#';\n                empty -= 1;\n            }\n        }\n    }\n    let mut out = Vec::new();\n    for j in 0..n {\n        let mut s = String::new();\n        for i in (0..m).rev() {\n            s.push(rows[i][j] as char);\n        }\n        out.push(s);\n    }\n    out\n}`,
        php: `function rotateTheBox($grid) {\n    $m = count($grid);\n    $n = strlen($grid[0]);\n    $rows = [];\n    for ($i = 0; $i < $m; $i++) $rows[$i] = str_split($grid[$i]);\n    for ($i = 0; $i < $m; $i++) {\n        $empty = $n - 1;\n        for ($j = $n - 1; $j >= 0; $j--) {\n            if ($rows[$i][$j] === '*') {\n                $empty = $j - 1;\n            } elseif ($rows[$i][$j] === '#') {\n                $rows[$i][$j] = '.';\n                $rows[$i][$empty] = '#';\n                $empty--;\n            }\n        }\n    }\n    $out = [];\n    for ($j = 0; $j < $n; $j++) {\n        $s = '';\n        for ($i = $m - 1; $i >= 0; $i--) $s .= $rows[$i][$j];\n        $out[] = $s;\n    }\n    return $out;\n}`,
        ruby: `def rotateTheBox(grid)\n  m = grid.length\n  n = grid[0].length\n  rows = grid.map { |r| r.chars }\n  (0...m).each do |i|\n    empty = n - 1\n    (n - 1).downto(0) do |j|\n      if rows[i][j] == '*'\n        empty = j - 1\n      elsif rows[i][j] == '#'\n        rows[i][j] = '.'\n        rows[i][empty] = '#'\n        empty -= 1\n      end\n    end\n  end\n  (0...n).map do |j|\n    s = ''\n    (m - 1).downto(0) { |i| s += rows[i][j] }\n    s\n  end\nend`,
      },
    };
  })(),

  // ── First Completely Painted Row or Column (LC 2661) ────────────
  (() => {
    const ref = (arr: number[], mat: number[][]) => {
      const m = mat.length, n = mat[0].length;
      const where = new Map<number, number[]>();
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) where.set(mat[i][j], [i, j]);
      const rowLeft = new Array(m).fill(n);
      const colLeft = new Array(n).fill(m);
      for (let k = 0; k < arr.length; k++) {
        const at = where.get(arr[k]);
        if (!at) continue;
        rowLeft[at[0]]--;
        colLeft[at[1]]--;
        if (rowLeft[at[0]] === 0 || colLeft[at[1]] === 0) return k;
      }
      return -1;
    };
    return {
      slug: "first-completely-painted-row-or-column",
      title: "First Completely Painted Row or Column",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Hash Table", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "firstCompleteIndex", params: [{ name: "arr", type: "int[]" as const }, { name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`arr` is a permutation of the integers `1 … m·n`, and `mat` is an `m × n` matrix holding the same integers, each exactly once.\n\nGo through `arr` in order and paint the matching cell of `mat`. Return the smallest index `i` at which some row or some column of `mat` has become completely painted.",
        [
          { in: "arr = [1,3,4,2], mat = [[1,4],[2,3]]", out: "2", note: "After painting 1, 3 and 4 the top row `[1,4]` is full." },
          { in: "arr = [2,8,7,4,1,3,5,6,9], mat = [[3,2,5],[1,4,6],[8,7,9]]", out: "3", note: "By index 3 the values 2, 4 and 7 — the whole middle column — have been painted." },
          { in: "arr = [3,1,4,2], mat = [[1,2],[3,4]]", out: "1", note: "Painting 3 then 1 completes the left column." },
        ],
        ["m == mat.length", "n == mat[i].length", "arr.length == m * n", "1 <= m, n <= 300", "arr and mat both hold every integer from 1 to m · n exactly once"]),
      hints: [
        "Searching the matrix for each painted value is `O((m·n)²)`.",
        "Map every value to its cell once, up front.",
        "Keep a counter of unpainted cells per row and per column and watch for one hitting zero.",
      ],
      editorial: explain({
        idea: "Precompute where each value lives, then paint in one pass while keeping, for each row and each column, how many cells are still unpainted. The first counter to reach zero answers the question.",
        steps: [
          "Build a lookup from value to `(row, col)` by scanning the matrix once.",
          "Start `rowLeft[i] = n` and `colLeft[j] = m`.",
          "For each `arr[k]`, decrement its row's and column's counters.",
          "Return `k` the moment either counter is zero.",
        ],
        why: "Counting down is equivalent to checking the whole row after each paint, but costs O(1) instead of O(n). Because the values are a permutation, every paint hits a distinct cell, so a counter can never go below zero and hits zero exactly when its line is complete. An answer always exists — the last paint fills the final row.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Re-scanning a row or column after each paint is quadratic and times out at 300 × 300.",
          "Both counters must be decremented for the same paint; one cell belongs to a row *and* a column.",
          "The answer is the index in `arr`, not the painted value.",
        ],
      }),
      examples: [
        { input: "[1,3,4,2]\n[[1,4],[2,3]]", expectedOutput: "2" },
        { input: "[2,8,7,4,1,3,5,6,9]\n[[3,2,5],[1,4,6],[8,7,9]]", expectedOutput: "3" },
        { input: "[3,1,4,2]\n[[1,2],[3,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const vals = shuffle(rng, Array.from({ length: m * n }, (_, i) => i + 1));
        const mat = Array.from({ length: m }, (_, i) => vals.slice(i * n, i * n + n));
        const arr = shuffle(rng, Array.from({ length: m * n }, (_, i) => i + 1));
        return { input: `${fmtIntArr(arr)}\n${fmtIntMat(mat)}`, expectedOutput: String(ref(arr, mat)) };
      },
      solutions: {
        python: `from typing import List\n\ndef firstCompleteIndex(arr: List[int], mat: List[List[int]]) -> int:\n    m, n = len(mat), len(mat[0])\n    where = {}\n    for i in range(m):\n        for j in range(n):\n            where[mat[i][j]] = (i, j)\n    row_left = [n] * m\n    col_left = [m] * n\n    for k, v in enumerate(arr):\n        if v not in where:\n            continue\n        i, j = where[v]\n        row_left[i] -= 1\n        col_left[j] -= 1\n        if row_left[i] == 0 or col_left[j] == 0:\n            return k\n    return -1`,
        javascript: `var firstCompleteIndex = function(arr, mat) {\n    var m = mat.length, n = mat[0].length, i, j;\n    var where = new Map();\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) where.set(mat[i][j], i * n + j);\n    }\n    var rowLeft = [], colLeft = [];\n    for (i = 0; i < m; i++) rowLeft.push(n);\n    for (j = 0; j < n; j++) colLeft.push(m);\n    for (var k = 0; k < arr.length; k++) {\n        if (!where.has(arr[k])) continue;\n        var at = where.get(arr[k]);\n        var r = Math.floor(at / n), c = at % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] === 0 || colLeft[c] === 0) return k;\n    }\n    return -1;\n};`,
        typescript: `function firstCompleteIndex(arr: number[], mat: number[][]): number {\n    var m = mat.length, n = mat[0].length, i: number, j: number;\n    var where: { [key: number]: number } = {};\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) where[mat[i][j]] = i * n + j;\n    }\n    var rowLeft: number[] = [], colLeft: number[] = [];\n    for (i = 0; i < m; i++) rowLeft.push(n);\n    for (j = 0; j < n; j++) colLeft.push(m);\n    for (var k = 0; k < arr.length; k++) {\n        if (where[arr[k]] === undefined) continue;\n        var at = where[arr[k]];\n        var r = Math.floor(at / n), c = at % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] === 0 || colLeft[c] === 0) return k;\n    }\n    return -1;\n}`,
        java: `public static int firstCompleteIndex(int[] arr, int[][] mat) {\n    int m = mat.length, n = mat[0].length;\n    Map<Integer, Integer> where = new HashMap<>();\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) where.put(mat[i][j], i * n + j);\n    }\n    int[] rowLeft = new int[m];\n    int[] colLeft = new int[n];\n    Arrays.fill(rowLeft, n);\n    Arrays.fill(colLeft, m);\n    for (int k = 0; k < arr.length; k++) {\n        Integer at = where.get(arr[k]);\n        if (at == null) continue;\n        int r = at / n, c = at % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] == 0 || colLeft[c] == 0) return k;\n    }\n    return -1;\n}`,
        cpp: `int firstCompleteIndex(vector<int>& arr, vector<vector<int>>& mat) {\n    int m = (int) mat.size(), n = (int) mat[0].size();\n    unordered_map<int, int> where;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) where[mat[i][j]] = i * n + j;\n    }\n    vector<int> rowLeft(m, n), colLeft(n, m);\n    for (int k = 0; k < (int) arr.size(); k++) {\n        auto it = where.find(arr[k]);\n        if (it == where.end()) continue;\n        int r = it->second / n, c = it->second % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] == 0 || colLeft[c] == 0) return k;\n    }\n    return -1;\n}`,
        c: `int firstCompleteIndex(int* arr, int arrSize, int** mat, int matSize, int* matColSize) {\n    int m = matSize, n = matColSize[0];\n    int total = m * n;\n    int* where = (int*) malloc((size_t) (total + 1) * sizeof(int));\n    for (int v = 0; v <= total; v++) where[v] = -1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) where[mat[i][j]] = i * n + j;\n    }\n    int* rowLeft = (int*) malloc((size_t) m * sizeof(int));\n    int* colLeft = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < m; i++) rowLeft[i] = n;\n    for (int j = 0; j < n; j++) colLeft[j] = m;\n    int ans = -1;\n    for (int k = 0; k < arrSize; k++) {\n        int v = arr[k];\n        if (v < 0 || v > total || where[v] < 0) continue;\n        int r = where[v] / n, c = where[v] % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] == 0 || colLeft[c] == 0) { ans = k; break; }\n    }\n    free(where);\n    free(rowLeft);\n    free(colLeft);\n    return ans;\n}`,
        csharp: `public static int FirstCompleteIndex(int[] arr, int[][] mat)\n{\n    int m = mat.Length, n = mat[0].Length;\n    var where = new Dictionary<int, int>();\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++) where[mat[i][j]] = i * n + j;\n    }\n    var rowLeft = new int[m];\n    var colLeft = new int[n];\n    for (int i = 0; i < m; i++) rowLeft[i] = n;\n    for (int j = 0; j < n; j++) colLeft[j] = m;\n    for (int k = 0; k < arr.Length; k++)\n    {\n        if (!where.TryGetValue(arr[k], out int at)) continue;\n        int r = at / n, c = at % n;\n        rowLeft[r]--;\n        colLeft[c]--;\n        if (rowLeft[r] == 0 || colLeft[c] == 0) return k;\n    }\n    return -1;\n}`,
        go: `func firstCompleteIndex(arr []int, mat [][]int) int {\n\tm, n := len(mat), len(mat[0])\n\twhere := make(map[int]int)\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\twhere[mat[i][j]] = i*n + j\n\t\t}\n\t}\n\trowLeft := make([]int, m)\n\tcolLeft := make([]int, n)\n\tfor i := range rowLeft {\n\t\trowLeft[i] = n\n\t}\n\tfor j := range colLeft {\n\t\tcolLeft[j] = m\n\t}\n\tfor k, v := range arr {\n\t\tat, ok := where[v]\n\t\tif !ok {\n\t\t\tcontinue\n\t\t}\n\t\tr, c := at/n, at%n\n\t\trowLeft[r]--\n\t\tcolLeft[c]--\n\t\tif rowLeft[r] == 0 || colLeft[c] == 0 {\n\t\t\treturn k\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun firstCompleteIndex(arr: IntArray, mat: Array<IntArray>): Int {\n    val m = mat.size\n    val n = mat[0].size\n    val where = HashMap<Int, Int>()\n    for (i in 0 until m) {\n        for (j in 0 until n) where[mat[i][j]] = i * n + j\n    }\n    val rowLeft = IntArray(m) { n }\n    val colLeft = IntArray(n) { m }\n    for (k in arr.indices) {\n        val at = where[arr[k]] ?: continue\n        val r = at / n\n        val c = at % n\n        rowLeft[r]--\n        colLeft[c]--\n        if (rowLeft[r] == 0 || colLeft[c] == 0) return k\n    }\n    return -1\n}`,
        swift: `func firstCompleteIndex(_ arr: [Int], _ mat: [[Int]]) -> Int {\n    let m = mat.count\n    let n = mat[0].count\n    var where_ = [Int: Int]()\n    for i in 0..<m {\n        for j in 0..<n { where_[mat[i][j]] = i * n + j }\n    }\n    var rowLeft = [Int](repeating: n, count: m)\n    var colLeft = [Int](repeating: m, count: n)\n    for k in 0..<arr.count {\n        guard let at = where_[arr[k]] else { continue }\n        let r = at / n, c = at % n\n        rowLeft[r] -= 1\n        colLeft[c] -= 1\n        if rowLeft[r] == 0 || colLeft[c] == 0 { return k }\n    }\n    return -1\n}`,
        rust: `use std::collections::HashMap;\n\nfn firstCompleteIndex(arr: Vec<i32>, mat: Vec<Vec<i32>>) -> i32 {\n    let m = mat.len();\n    let n = mat[0].len();\n    let mut place: HashMap<i32, usize> = HashMap::new();\n    for i in 0..m {\n        for j in 0..n {\n            place.insert(mat[i][j], i * n + j);\n        }\n    }\n    let mut row_left = vec![n as i32; m];\n    let mut col_left = vec![m as i32; n];\n    for k in 0..arr.len() {\n        let at = match place.get(&arr[k]) {\n            Some(&p) => p,\n            None => continue,\n        };\n        let r = at / n;\n        let c = at % n;\n        row_left[r] -= 1;\n        col_left[c] -= 1;\n        if row_left[r] == 0 || col_left[c] == 0 {\n            return k as i32;\n        }\n    }\n    -1\n}`,
        php: `function firstCompleteIndex($arr, $mat) {\n    $m = count($mat);\n    $n = count($mat[0]);\n    $where = [];\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) $where[$mat[$i][$j]] = $i * $n + $j;\n    }\n    $rowLeft = array_fill(0, $m, $n);\n    $colLeft = array_fill(0, $n, $m);\n    for ($k = 0; $k < count($arr); $k++) {\n        if (!isset($where[$arr[$k]])) continue;\n        $at = $where[$arr[$k]];\n        $r = intdiv($at, $n);\n        $c = $at % $n;\n        $rowLeft[$r]--;\n        $colLeft[$c]--;\n        if ($rowLeft[$r] === 0 || $colLeft[$c] === 0) return $k;\n    }\n    return -1;\n}`,
        ruby: `def firstCompleteIndex(arr, mat)\n  m = mat.length\n  n = mat[0].length\n  where = {}\n  (0...m).each do |i|\n    (0...n).each { |j| where[mat[i][j]] = i * n + j }\n  end\n  row_left = Array.new(m, n)\n  col_left = Array.new(n, m)\n  arr.each_with_index do |v, k|\n    at = where[v]\n    next if at.nil?\n    r = at / n\n    c = at % n\n    row_left[r] -= 1\n    col_left[c] -= 1\n    return k if row_left[r] == 0 || col_left[c] == 0\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Check Knight Tour Configuration (LC 2596) ───────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      if (grid[0][0] !== 0) return false;
      const pos = new Array(n * n).fill(-1);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] >= 0 && grid[i][j] < n * n) pos[grid[i][j]] = i * n + j;
        }
      }
      for (let k = 1; k < n * n; k++) {
        if (pos[k] < 0 || pos[k - 1] < 0) return false;
        const dr = Math.abs(Math.floor(pos[k] / n) - Math.floor(pos[k - 1] / n));
        const dc = Math.abs((pos[k] % n) - (pos[k - 1] % n));
        if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) return false;
      }
      return true;
    };
    const tour = (n: number) => {
      const dr = [1, 1, -1, -1, 2, 2, -2, -2], dc = [2, -2, 2, -2, 1, -1, 1, -1];
      const seen = Array.from({ length: n }, () => new Array(n).fill(-1));
      let r = 0, c = 0;
      seen[0][0] = 0;
      for (let step = 1; step < n * n; step++) {
        let bestDeg = 9, br = -1, bc = -1;
        for (let d = 0; d < 8; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr < 0 || nr >= n || nc < 0 || nc >= n || seen[nr][nc] >= 0) continue;
          let deg = 0;
          for (let e = 0; e < 8; e++) {
            const mr = nr + dr[e], mc = nc + dc[e];
            if (mr >= 0 && mr < n && mc >= 0 && mc < n && seen[mr][mc] < 0) deg++;
          }
          if (deg < bestDeg) { bestDeg = deg; br = nr; bc = nc; }
        }
        if (br < 0) return null;
        r = br;
        c = bc;
        seen[r][c] = step;
      }
      return seen;
    };
    return {
      slug: "check-knight-tour-configuration",
      title: "Check Knight Tour Configuration",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Simulation", "Amazon", "Google", "Oracle"],
      signature: { funcName: "checkValidGrid", params: [{ name: "grid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "An `n × n` chessboard is given as a grid where `grid[row][col]` is the step at which a knight visited that cell, numbered `0 … n·n - 1`.\n\nReturn `true` if the grid really is a valid knight's tour: the knight starts at the **top-left** cell and every consecutive pair of steps is one legal knight move (two squares one way and one square the other).",
        [
          { in: "grid = [[0,11,16,5,20],[17,4,19,10,15],[12,1,8,21,6],[3,18,23,14,9],[24,13,2,7,22]]", out: "true" },
          { in: "grid = [[0,3,6],[5,8,1],[2,7,4]]", out: "false", note: "Step 0 to step 1 is not a knight move." },
          { in: "grid = [[2,0],[1,3]]", out: "false", note: "The tour must start at the top-left cell." },
        ],
        ["n == grid.length == grid[i].length", "3 <= n <= 7", "0 <= grid[row][col] < n * n", "All values in grid are unique"]),
      hints: [
        "Invert the grid: for each step number, record the cell it happens in.",
        "Then walk the steps in order and check each hop.",
        "A legal knight move has `|dr|, |dc|` equal to `{1, 2}` in some order — and step 0 must be at `(0, 0)`.",
      ],
      editorial: explain({
        idea: "The grid maps cell → step; invert it to step → cell, which turns the check into a simple walk over `n·n - 1` consecutive pairs.",
        steps: [
          "Reject immediately unless `grid[0][0] == 0`.",
          "Fill `pos[grid[i][j]] = i * n + j` in one scan.",
          "For `k` from 1 upward, compare `pos[k]` with `pos[k-1]`.",
          "The hop is legal when `{|dr|, |dc|} == {1, 2}`; otherwise return false.",
        ],
        why: "Because the values are distinct and inside `[0, n·n)`, the inversion is a bijection and the tour is fully described by the sequence `pos[0], pos[1], …`. Checking each adjacent pair is therefore necessary and sufficient — nothing about the tour is left unverified once the start cell and every hop have been confirmed.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Forgetting the start check accepts tours that begin elsewhere.",
          "Only the two `{1,2}` shapes are legal; `|dr| == |dc|` never is.",
          "Storing the cell as `i * n + j` keeps the inversion a flat array.",
        ],
      }),
      examples: [
        { input: "[[0,11,16,5,20],[17,4,19,10,15],[12,1,8,21,6],[3,18,23,14,9],[24,13,2,7,22]]", expectedOutput: "true" },
        { input: "[[0,3,6],[5,8,1],[2,7,4]]", expectedOutput: "false" },
        { input: "[[2,0],[1,3]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 6);
        let grid = n >= 5 && rng() < 0.6 ? tour(n) : null;
        if (!grid) {
          const vals = shuffle(rng, Array.from({ length: n * n }, (_, i) => i));
          grid = Array.from({ length: n }, (_, i) => vals.slice(i * n, i * n + n));
        } else if (rng() < 0.4) {
          const a = ri(rng, 0, n * n - 1), b = ri(rng, 0, n * n - 1);
          const ar = Math.floor(a / n), ac = a % n, br = Math.floor(b / n), bc = b % n;
          const t = grid[ar][ac];
          grid[ar][ac] = grid[br][bc];
          grid[br][bc] = t;
        }
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef checkValidGrid(grid: List[List[int]]) -> bool:\n    n = len(grid)\n    if grid[0][0] != 0:\n        return False\n    pos = [0] * (n * n)\n    for i in range(n):\n        for j in range(n):\n            pos[grid[i][j]] = (i, j)\n    for k in range(1, n * n):\n        dr = abs(pos[k][0] - pos[k - 1][0])\n        dc = abs(pos[k][1] - pos[k - 1][1])\n        if not ((dr == 1 and dc == 2) or (dr == 2 and dc == 1)):\n            return False\n    return True`,
        javascript: `var checkValidGrid = function(grid) {\n    var n = grid.length, i, j;\n    if (grid[0][0] !== 0) return false;\n    var pos = new Array(n * n);\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    for (var k = 1; k < n * n; k++) {\n        var dr = Math.abs(Math.floor(pos[k] / n) - Math.floor(pos[k - 1] / n));\n        var dc = Math.abs((pos[k] % n) - (pos[k - 1] % n));\n        if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) return false;\n    }\n    return true;\n};`,
        typescript: `function checkValidGrid(grid: number[][]): boolean {\n    var n = grid.length, i: number, j: number;\n    if (grid[0][0] !== 0) return false;\n    var pos: number[] = new Array(n * n);\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    for (var k = 1; k < n * n; k++) {\n        var dr = Math.abs(Math.floor(pos[k] / n) - Math.floor(pos[k - 1] / n));\n        var dc = Math.abs((pos[k] % n) - (pos[k - 1] % n));\n        if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) return false;\n    }\n    return true;\n}`,
        java: `public static boolean checkValidGrid(int[][] grid) {\n    int n = grid.length;\n    if (grid[0][0] != 0) return false;\n    int[] pos = new int[n * n];\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    for (int k = 1; k < n * n; k++) {\n        int dr = Math.abs(pos[k] / n - pos[k - 1] / n);\n        int dc = Math.abs(pos[k] % n - pos[k - 1] % n);\n        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) return false;\n    }\n    return true;\n}`,
        cpp: `bool checkValidGrid(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    if (grid[0][0] != 0) return false;\n    vector<int> pos(n * n);\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    for (int k = 1; k < n * n; k++) {\n        int dr = abs(pos[k] / n - pos[k - 1] / n);\n        int dc = abs(pos[k] % n - pos[k - 1] % n);\n        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) return false;\n    }\n    return true;\n}`,
        c: `bool checkValidGrid(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    (void) gridColSize;\n    if (grid[0][0] != 0) return false;\n    int* pos = (int*) malloc((size_t) (n * n) * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    bool ok = true;\n    for (int k = 1; k < n * n; k++) {\n        int dr = pos[k] / n - pos[k - 1] / n;\n        int dc = pos[k] % n - pos[k - 1] % n;\n        if (dr < 0) dr = -dr;\n        if (dc < 0) dc = -dc;\n        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) { ok = false; break; }\n    }\n    free(pos);\n    return ok;\n}`,
        csharp: `public static bool CheckValidGrid(int[][] grid)\n{\n    int n = grid.Length;\n    if (grid[0][0] != 0) return false;\n    var pos = new int[n * n];\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++) pos[grid[i][j]] = i * n + j;\n    }\n    for (int k = 1; k < n * n; k++)\n    {\n        int dr = Math.Abs(pos[k] / n - pos[k - 1] / n);\n        int dc = Math.Abs(pos[k] % n - pos[k - 1] % n);\n        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) return false;\n    }\n    return true;\n}`,
        go: `func checkValidGrid(grid [][]int) bool {\n\tn := len(grid)\n\tif grid[0][0] != 0 {\n\t\treturn false\n\t}\n\tpos := make([]int, n*n)\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tpos[grid[i][j]] = i*n + j\n\t\t}\n\t}\n\tabs := func(x int) int {\n\t\tif x < 0 {\n\t\t\treturn -x\n\t\t}\n\t\treturn x\n\t}\n\tfor k := 1; k < n*n; k++ {\n\t\tdr := abs(pos[k]/n - pos[k-1]/n)\n\t\tdc := abs(pos[k]%n - pos[k-1]%n)\n\t\tif !((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun checkValidGrid(grid: Array<IntArray>): Boolean {\n    val n = grid.size\n    if (grid[0][0] != 0) return false\n    val pos = IntArray(n * n)\n    for (i in 0 until n) {\n        for (j in 0 until n) pos[grid[i][j]] = i * n + j\n    }\n    for (k in 1 until n * n) {\n        val dr = Math.abs(pos[k] / n - pos[k - 1] / n)\n        val dc = Math.abs(pos[k] % n - pos[k - 1] % n)\n        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) return false\n    }\n    return true\n}`,
        swift: `func checkValidGrid(_ grid: [[Int]]) -> Bool {\n    let n = grid.count\n    if grid[0][0] != 0 { return false }\n    var pos = [Int](repeating: 0, count: n * n)\n    for i in 0..<n {\n        for j in 0..<n { pos[grid[i][j]] = i * n + j }\n    }\n    for k in 1..<(n * n) {\n        let dr = abs(pos[k] / n - pos[k - 1] / n)\n        let dc = abs(pos[k] % n - pos[k - 1] % n)\n        if !((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) { return false }\n    }\n    return true\n}`,
        rust: `fn checkValidGrid(grid: Vec<Vec<i32>>) -> bool {\n    let n = grid.len();\n    if grid[0][0] != 0 {\n        return false;\n    }\n    let mut pos = vec![0usize; n * n];\n    for i in 0..n {\n        for j in 0..n {\n            pos[grid[i][j] as usize] = i * n + j;\n        }\n    }\n    for k in 1..(n * n) {\n        let dr = ((pos[k] / n) as i32 - (pos[k - 1] / n) as i32).abs();\n        let dc = ((pos[k] % n) as i32 - (pos[k - 1] % n) as i32).abs();\n        if !((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function checkValidGrid($grid) {\n    $n = count($grid);\n    if ($grid[0][0] !== 0) return false;\n    $pos = array_fill(0, $n * $n, 0);\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) $pos[$grid[$i][$j]] = $i * $n + $j;\n    }\n    for ($k = 1; $k < $n * $n; $k++) {\n        $dr = abs(intdiv($pos[$k], $n) - intdiv($pos[$k - 1], $n));\n        $dc = abs($pos[$k] % $n - $pos[$k - 1] % $n);\n        if (!(($dr === 1 && $dc === 2) || ($dr === 2 && $dc === 1))) return false;\n    }\n    return true;\n}`,
        ruby: `def checkValidGrid(grid)\n  n = grid.length\n  return false if grid[0][0] != 0\n  pos = Array.new(n * n, 0)\n  (0...n).each do |i|\n    (0...n).each { |j| pos[grid[i][j]] = i * n + j }\n  end\n  (1...(n * n)).each do |k|\n    dr = (pos[k] / n - pos[k - 1] / n).abs\n    dc = (pos[k] % n - pos[k - 1] % n).abs\n    return false unless (dr == 1 && dc == 2) || (dr == 2 && dc == 1)\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Convert an Array Into a 2D Array With Conditions (LC 2610) ──
  (() => {
    const ref = (nums: number[]) => {
      let mx = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
      const count = new Array(mx + 1).fill(0);
      for (let i = 0; i < nums.length; i++) count[nums[i]]++;
      let rows = 0;
      for (let v = 1; v <= mx; v++) if (count[v] > rows) rows = count[v];
      const out: number[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let v = 1; v <= mx; v++) if (count[v] > r) row.push(v);
        out.push(row);
      }
      return out;
    };
    return {
      slug: "convert-an-array-into-a-2d-array-with-conditions",
      title: "Convert an Array Into a 2D Array With Conditions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Hash Table", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "findMatrix", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Distribute the values of `nums` into a 2D array so that every row holds **distinct** integers, every value of `nums` appears in exactly one row (with multiplicity), and the number of rows is as small as possible.\n\nSo the answer is pinned down: put each value in the earliest rows that can still take it, and sort every row in **increasing** order.",
        [
          { in: "nums = [1,3,4,1,2,3,1]", out: "[[1,2,3,4],[1,3],[1]]", note: "`1` appears three times, so three rows are needed." },
          { in: "nums = [1,2,3,4]", out: "[[1,2,3,4]]", note: "All distinct — one row is enough." },
          { in: "nums = [2,2,2,2]", out: "[[2],[2],[2],[2]]" },
        ],
        ["1 <= nums.length <= 200", "1 <= nums[i] <= nums.length", "Each row is returned in increasing order, and rows are filled from the first one down."]),
      hints: [
        "How many rows does a value that occurs `c` times force?",
        "The row count is the largest frequency in `nums`.",
        "A value with frequency `c` belongs in rows `0 … c - 1`.",
      ],
      editorial: explain({
        idea: "Count each value. A value occurring `c` times must sit in `c` different rows, so the answer needs exactly `max(count)` rows — and placing each value in the first `count[v]` rows achieves that bound.",
        steps: [
          "Count occurrences of every value.",
          "Set `rows = max(count)`.",
          "For row `r`, take every value `v` with `count[v] > r`, in increasing order of `v`.",
        ],
        why: "Distinctness within a row means a value occurring `c` times needs at least `c` rows, so `max(count)` is a lower bound. Filling row `r` with all values whose count exceeds `r` never repeats a value inside a row and places exactly `count[v]` copies of each `v`, so the bound is reached — and since the rule is deterministic, so is the output.",
        time: "O(n + maxValue)",
        space: "O(n)",
        pitfalls: [
          "The rows are not equal length; shorter rows come last.",
          "`rows` is the largest frequency, not the number of distinct values.",
          "Sorting each row and filling from the top is what makes the answer unique.",
        ],
      }),
      examples: [
        { input: "[1,3,4,1,2,3,1]", expectedOutput: "[[1,2,3,4],[1,3],[1]]" },
        { input: "[1,2,3,4]", expectedOutput: "[[1,2,3,4]]" },
        { input: "[2,2,2,2]", expectedOutput: "[[2],[2],[2],[2]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, n));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMatrix(nums: List[int]) -> List[List[int]]:\n    mx = max(nums)\n    count = [0] * (mx + 1)\n    for v in nums:\n        count[v] += 1\n    rows = max(count)\n    return [[v for v in range(1, mx + 1) if count[v] > r] for r in range(rows)]`,
        javascript: `var findMatrix = function(nums) {\n    var i, v, mx = 0;\n    for (i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];\n    var count = [];\n    for (v = 0; v <= mx; v++) count.push(0);\n    for (i = 0; i < nums.length; i++) count[nums[i]]++;\n    var rows = 0;\n    for (v = 1; v <= mx; v++) if (count[v] > rows) rows = count[v];\n    var out = [];\n    for (var r = 0; r < rows; r++) {\n        var row = [];\n        for (v = 1; v <= mx; v++) if (count[v] > r) row.push(v);\n        out.push(row);\n    }\n    return out;\n};`,
        typescript: `function findMatrix(nums: number[]): number[][] {\n    var i: number, v: number, mx = 0;\n    for (i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];\n    var count: number[] = [];\n    for (v = 0; v <= mx; v++) count.push(0);\n    for (i = 0; i < nums.length; i++) count[nums[i]]++;\n    var rows = 0;\n    for (v = 1; v <= mx; v++) if (count[v] > rows) rows = count[v];\n    var out: number[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: number[] = [];\n        for (v = 1; v <= mx; v++) if (count[v] > r) row.push(v);\n        out.push(row);\n    }\n    return out;\n}`,
        java: `public static int[][] findMatrix(int[] nums) {\n    int mx = 0;\n    for (int v : nums) mx = Math.max(mx, v);\n    int[] count = new int[mx + 1];\n    for (int v : nums) count[v]++;\n    int rows = 0;\n    for (int v = 1; v <= mx; v++) rows = Math.max(rows, count[v]);\n    List<int[]> out = new ArrayList<>();\n    for (int r = 0; r < rows; r++) {\n        List<Integer> row = new ArrayList<>();\n        for (int v = 1; v <= mx; v++) if (count[v] > r) row.add(v);\n        int[] arr = new int[row.size()];\n        for (int k = 0; k < arr.length; k++) arr[k] = row.get(k);\n        out.add(arr);\n    }\n    return out.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> findMatrix(vector<int>& nums) {\n    int mx = 0;\n    for (int v : nums) mx = max(mx, v);\n    vector<int> count(mx + 1, 0);\n    for (int v : nums) count[v]++;\n    int rows = 0;\n    for (int v = 1; v <= mx; v++) rows = max(rows, count[v]);\n    vector<vector<int>> out;\n    for (int r = 0; r < rows; r++) {\n        vector<int> row;\n        for (int v = 1; v <= mx; v++) if (count[v] > r) row.push_back(v);\n        out.push_back(row);\n    }\n    return out;\n}`,
        c: `int** findMatrix(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    int mx = 0;\n    for (int i = 0; i < numsSize; i++) if (nums[i] > mx) mx = nums[i];\n    int* count = (int*) calloc((size_t) mx + 1, sizeof(int));\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int rows = 0;\n    for (int v = 1; v <= mx; v++) if (count[v] > rows) rows = count[v];\n    int** out = (int**) malloc((size_t) rows * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) rows * sizeof(int));\n    for (int r = 0; r < rows; r++) {\n        int len = 0;\n        for (int v = 1; v <= mx; v++) if (count[v] > r) len++;\n        out[r] = (int*) malloc((size_t) (len > 0 ? len : 1) * sizeof(int));\n        int p = 0;\n        for (int v = 1; v <= mx; v++) if (count[v] > r) out[r][p++] = v;\n        (*returnColumnSizes)[r] = len;\n    }\n    free(count);\n    *returnSize = rows;\n    return out;\n}`,
        csharp: `public static int[][] FindMatrix(int[] nums)\n{\n    int mx = 0;\n    foreach (var v in nums) mx = Math.Max(mx, v);\n    var count = new int[mx + 1];\n    foreach (var v in nums) count[v]++;\n    int rows = 0;\n    for (int v = 1; v <= mx; v++) rows = Math.Max(rows, count[v]);\n    var out_ = new int[rows][];\n    for (int r = 0; r < rows; r++)\n    {\n        var row = new List<int>();\n        for (int v = 1; v <= mx; v++) if (count[v] > r) row.Add(v);\n        out_[r] = row.ToArray();\n    }\n    return out_;\n}`,
        go: `func findMatrix(nums []int) [][]int {\n\tmx := 0\n\tfor _, v := range nums {\n\t\tif v > mx {\n\t\t\tmx = v\n\t\t}\n\t}\n\tcount := make([]int, mx+1)\n\tfor _, v := range nums {\n\t\tcount[v]++\n\t}\n\trows := 0\n\tfor v := 1; v <= mx; v++ {\n\t\tif count[v] > rows {\n\t\t\trows = count[v]\n\t\t}\n\t}\n\tout := make([][]int, 0, rows)\n\tfor r := 0; r < rows; r++ {\n\t\trow := []int{}\n\t\tfor v := 1; v <= mx; v++ {\n\t\t\tif count[v] > r {\n\t\t\t\trow = append(row, v)\n\t\t\t}\n\t\t}\n\t\tout = append(out, row)\n\t}\n\treturn out\n}`,
        kotlin: `fun findMatrix(nums: IntArray): Array<IntArray> {\n    val mx = nums.max()\n    val count = IntArray(mx + 1)\n    for (v in nums) count[v]++\n    var rows = 0\n    for (v in 1..mx) if (count[v] > rows) rows = count[v]\n    return Array(rows) { r ->\n        (1..mx).filter { count[it] > r }.toIntArray()\n    }\n}`,
        swift: `func findMatrix(_ nums: [Int]) -> [[Int]] {\n    let mx = nums.max()!\n    var count = [Int](repeating: 0, count: mx + 1)\n    for v in nums { count[v] += 1 }\n    var rows = 0\n    for v in 1...mx where count[v] > rows { rows = count[v] }\n    var out = [[Int]]()\n    for r in 0..<rows {\n        var row = [Int]()\n        for v in 1...mx where count[v] > r { row.append(v) }\n        out.append(row)\n    }\n    return out\n}`,
        rust: `fn findMatrix(nums: Vec<i32>) -> Vec<Vec<i32>> {\n    let mx = *nums.iter().max().unwrap() as usize;\n    let mut count = vec![0usize; mx + 1];\n    for &v in nums.iter() {\n        count[v as usize] += 1;\n    }\n    let rows = *count.iter().max().unwrap();\n    let mut out = Vec::new();\n    for r in 0..rows {\n        let mut row = Vec::new();\n        for v in 1..=mx {\n            if count[v] > r {\n                row.push(v as i32);\n            }\n        }\n        out.push(row);\n    }\n    out\n}`,
        php: `function findMatrix($nums) {\n    $mx = max($nums);\n    $count = array_fill(0, $mx + 1, 0);\n    foreach ($nums as $v) $count[$v]++;\n    $rows = 0;\n    for ($v = 1; $v <= $mx; $v++) if ($count[$v] > $rows) $rows = $count[$v];\n    $out = [];\n    for ($r = 0; $r < $rows; $r++) {\n        $row = [];\n        for ($v = 1; $v <= $mx; $v++) if ($count[$v] > $r) $row[] = $v;\n        $out[] = $row;\n    }\n    return $out;\n}`,
        ruby: `def findMatrix(nums)\n  mx = nums.max\n  count = Array.new(mx + 1, 0)\n  nums.each { |v| count[v] += 1 }\n  rows = count.max\n  (0...rows).map do |r|\n    (1..mx).select { |v| count[v] > r }\n  end\nend`,
      },
    };
  })(),

  // ── Map of Highest Peak (LC 1765) ───────────────────────────────
  (() => {
    const ref = (isWater: number[][]) => {
      const m = isWater.length, n = isWater[0].length;
      const h = Array.from({ length: m }, () => new Array(n).fill(-1));
      const q: number[] = [];
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (isWater[i][j] === 1) { h[i][j] = 0; q.push(i * n + j); }
        }
      }
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const r = Math.floor(cur / n), c = cur % n;
        for (let d = 0; d < 4; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;
          h[nr][nc] = h[r][c] + 1;
          q.push(nr * n + nc);
        }
      }
      return h;
    };
    return {
      slug: "map-of-highest-peak",
      title: "Map of Highest Peak",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "highestPeak", params: [{ name: "isWater", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "`isWater[i][j] == 1` marks a water cell and `0` a land cell. Assign every cell a height so that:\n\n- every water cell has height `0`,\n- the heights of two cells sharing an edge differ by at most `1`,\n- the **maximum** height in the grid is as large as possible.\n\nExactly one assignment satisfies all three, so return that height matrix.",
        [
          { in: "isWater = [[0,1],[0,0]]", out: "[[1,0],[2,1]]", note: "The one water cell is the only source." },
          { in: "isWater = [[0,0,1],[1,0,0],[0,0,0]]", out: "[[1,1,0],[0,1,1],[1,2,2]]" },
          { in: "isWater = [[1]]", out: "[[0]]" },
        ],
        ["m == isWater.length", "n == isWater[i].length", "1 <= m, n <= 1000", "isWater[i][j] is 0 or 1", "At least one water cell is present."]),
      hints: [
        "The second rule means a cell's height is at most one more than any neighbour's.",
        "So a cell's height can never exceed its distance to the nearest water cell.",
        "Run a breadth-first search starting from **all** water cells at once.",
      ],
      editorial: explain({
        idea: "The answer is the grid of distances to the nearest water cell, measured in edge steps. A multi-source BFS computes all of them in one sweep.",
        steps: [
          "Put every water cell in the queue with height `0`.",
          "Pop a cell and give each unvisited neighbour its height plus one.",
          "Continue until the queue empties; every cell has been assigned.",
        ],
        why: "Walking from a cell to the nearest water cell, the heights may drop by at most 1 per step and must reach 0, so the height is bounded by that distance. The distance grid itself satisfies both rules — neighbours' distances differ by at most one — so it is feasible, and it attains the bound at every cell simultaneously. That makes the maximum as large as possible *and* the answer unique.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Seeding the BFS with one water cell is wrong; all of them start at level 0.",
          "Mark a cell as visited when it is *enqueued*, not when it is popped, or cells are queued repeatedly.",
          "Depth-first search does not give shortest distances here.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,0]]", expectedOutput: "[[1,0],[2,1]]" },
        { input: "[[0,0,1],[1,0,0],[0,0,0]]", expectedOutput: "[[1,1,0],[0,1,1],[1,2,2]]" },
        { input: "[[1]]", expectedOutput: "[[0]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const isWater = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.25 ? 1 : 0)));
        // The statement promises at least one water cell, so plant one.
        isWater[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] = 1;
        return { input: fmtIntMat(isWater), expectedOutput: fmtIntMat(ref(isWater)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef highestPeak(isWater: List[List[int]]) -> List[List[int]]:\n    m, n = len(isWater), len(isWater[0])\n    h = [[-1] * n for _ in range(m)]\n    q = deque()\n    for i in range(m):\n        for j in range(n):\n            if isWater[i][j] == 1:\n                h[i][j] = 0\n                q.append((i, j))\n    while q:\n        r, c = q.popleft()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < m and 0 <= nc < n and h[nr][nc] < 0:\n                h[nr][nc] = h[r][c] + 1\n                q.append((nr, nc))\n    return h`,
        javascript: `var highestPeak = function(isWater) {\n    var m = isWater.length, n = isWater[0].length, i, j;\n    var h = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(-1);\n        h.push(row);\n    }\n    var q = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (isWater[i][j] === 1) { h[i][j] = 0; q.push(i * n + j); }\n        }\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q.push(nr * n + nc);\n        }\n    }\n    return h;\n};`,
        typescript: `function highestPeak(isWater: number[][]): number[][] {\n    var m = isWater.length, n = isWater[0].length, i: number, j: number;\n    var h: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(-1);\n        h.push(row);\n    }\n    var q: number[] = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (isWater[i][j] === 1) { h[i][j] = 0; q.push(i * n + j); }\n        }\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q.push(nr * n + nc);\n        }\n    }\n    return h;\n}`,
        java: `public static int[][] highestPeak(int[][] isWater) {\n    int m = isWater.length, n = isWater[0].length;\n    int[][] h = new int[m][n];\n    int[] q = new int[m * n];\n    int tail = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (isWater[i][j] == 1) { h[i][j] = 0; q[tail++] = i * n + j; }\n            else h[i][j] = -1;\n        }\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    for (int head = 0; head < tail; head++) {\n        int r = q[head] / n, c = q[head] % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    return h;\n}`,
        cpp: `vector<vector<int>> highestPeak(vector<vector<int>>& isWater) {\n    int m = (int) isWater.size(), n = (int) isWater[0].size();\n    vector<vector<int>> h(m, vector<int>(n, -1));\n    vector<int> q;\n    q.reserve((size_t) (m * n));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (isWater[i][j] == 1) { h[i][j] = 0; q.push_back(i * n + j); }\n        }\n    }\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    for (size_t head = 0; head < q.size(); head++) {\n        int r = q[head] / n, c = q[head] % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q.push_back(nr * n + nc);\n        }\n    }\n    return h;\n}`,
        c: `int** highestPeak(int** isWater, int isWaterSize, int* isWaterColSize, int* returnSize, int** returnColumnSizes) {\n    int m = isWaterSize, n = isWaterColSize[0];\n    int** h = (int**) malloc((size_t) m * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) m * sizeof(int));\n    int* q = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int tail = 0;\n    for (int i = 0; i < m; i++) {\n        h[i] = (int*) malloc((size_t) n * sizeof(int));\n        (*returnColumnSizes)[i] = n;\n        for (int j = 0; j < n; j++) {\n            if (isWater[i][j] == 1) { h[i][j] = 0; q[tail++] = i * n + j; }\n            else h[i][j] = -1;\n        }\n    }\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    for (int head = 0; head < tail; head++) {\n        int r = q[head] / n, c = q[head] % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    free(q);\n    *returnSize = m;\n    return h;\n}`,
        csharp: `public static int[][] HighestPeak(int[][] isWater)\n{\n    int m = isWater.Length, n = isWater[0].Length;\n    var h = new int[m][];\n    var q = new int[m * n];\n    int tail = 0;\n    for (int i = 0; i < m; i++)\n    {\n        h[i] = new int[n];\n        for (int j = 0; j < n; j++)\n        {\n            if (isWater[i][j] == 1) { h[i][j] = 0; q[tail++] = i * n + j; }\n            else h[i][j] = -1;\n        }\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    for (int head = 0; head < tail; head++)\n    {\n        int r = q[head] / n, c = q[head] % n;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue;\n            h[nr][nc] = h[r][c] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    return h;\n}`,
        go: `func highestPeak(isWater [][]int) [][]int {\n\tm, n := len(isWater), len(isWater[0])\n\th := make([][]int, m)\n\tq := make([]int, 0, m*n)\n\tfor i := 0; i < m; i++ {\n\t\th[i] = make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif isWater[i][j] == 1 {\n\t\t\t\th[i][j] = 0\n\t\t\t\tq = append(q, i*n+j)\n\t\t\t} else {\n\t\t\t\th[i][j] = -1\n\t\t\t}\n\t\t}\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tfor head := 0; head < len(q); head++ {\n\t\tr, c := q[head]/n, q[head]%n\n\t\tfor d := 0; d < 4; d++ {\n\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\th[nr][nc] = h[r][c] + 1\n\t\t\tq = append(q, nr*n+nc)\n\t\t}\n\t}\n\treturn h\n}`,
        kotlin: `fun highestPeak(isWater: Array<IntArray>): Array<IntArray> {\n    val m = isWater.size\n    val n = isWater[0].size\n    val h = Array(m) { IntArray(n) { -1 } }\n    val q = IntArray(m * n)\n    var tail = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (isWater[i][j] == 1) {\n                h[i][j] = 0\n                q[tail++] = i * n + j\n            }\n        }\n    }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var head = 0\n    while (head < tail) {\n        val r = q[head] / n\n        val c = q[head] % n\n        head++\n        for (d in 0 until 4) {\n            val nr = r + dr[d]\n            val nc = c + dc[d]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0) continue\n            h[nr][nc] = h[r][c] + 1\n            q[tail++] = nr * n + nc\n        }\n    }\n    return h\n}`,
        swift: `func highestPeak(_ isWater: [[Int]]) -> [[Int]] {\n    let m = isWater.count\n    let n = isWater[0].count\n    var h = [[Int]](repeating: [Int](repeating: -1, count: n), count: m)\n    var q = [Int]()\n    for i in 0..<m {\n        for j in 0..<n where isWater[i][j] == 1 {\n            h[i][j] = 0\n            q.append(i * n + j)\n        }\n    }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var head = 0\n    while head < q.count {\n        let r = q[head] / n, c = q[head] % n\n        head += 1\n        for d in 0..<4 {\n            let nr = r + dr[d], nc = c + dc[d]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0 { continue }\n            h[nr][nc] = h[r][c] + 1\n            q.append(nr * n + nc)\n        }\n    }\n    return h\n}`,
        rust: `fn highestPeak(isWater: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = isWater.len();\n    let n = isWater[0].len();\n    let mut h = vec![vec![-1i32; n]; m];\n    let mut q: Vec<usize> = Vec::new();\n    for i in 0..m {\n        for j in 0..n {\n            if isWater[i][j] == 1 {\n                h[i][j] = 0;\n                q.push(i * n + j);\n            }\n        }\n    }\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut head = 0;\n    while head < q.len() {\n        let r = (q[head] / n) as i32;\n        let c = (q[head] % n) as i32;\n        head += 1;\n        for d in 0..4 {\n            let nr = r + dr[d];\n            let nc = c + dc[d];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            if h[nr as usize][nc as usize] >= 0 {\n                continue;\n            }\n            h[nr as usize][nc as usize] = h[r as usize][c as usize] + 1;\n            q.push(nr as usize * n + nc as usize);\n        }\n    }\n    h\n}`,
        php: `function highestPeak($isWater) {\n    $m = count($isWater);\n    $n = count($isWater[0]);\n    $h = [];\n    $q = [];\n    for ($i = 0; $i < $m; $i++) {\n        $h[$i] = array_fill(0, $n, -1);\n        for ($j = 0; $j < $n; $j++) {\n            if ($isWater[$i][$j] === 1) {\n                $h[$i][$j] = 0;\n                $q[] = $i * $n + $j;\n            }\n        }\n    }\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    for ($head = 0; $head < count($q); $head++) {\n        $r = intdiv($q[$head], $n);\n        $c = $q[$head] % $n;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $r + $dr[$d];\n            $nc = $c + $dc[$d];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n || $h[$nr][$nc] >= 0) continue;\n            $h[$nr][$nc] = $h[$r][$c] + 1;\n            $q[] = $nr * $n + $nc;\n        }\n    }\n    return $h;\n}`,
        ruby: `def highestPeak(isWater)\n  m = isWater.length\n  n = isWater[0].length\n  h = Array.new(m) { Array.new(n, -1) }\n  q = []\n  (0...m).each do |i|\n    (0...n).each do |j|\n      if isWater[i][j] == 1\n        h[i][j] = 0\n        q << i * n + j\n      end\n    end\n  end\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  head = 0\n  while head < q.length\n    r = q[head] / n\n    c = q[head] % n\n    head += 1\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n || h[nr][nc] >= 0\n      h[nr][nc] = h[r][c] + 1\n      q << nr * n + nc\n    end\n  end\n  h\nend`,
      },
    };
  })(),

  // ── Maximum Number of Moves in a Grid (LC 2684) ─────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let cur = new Array(m).fill(true);
      let best = 0;
      for (let c = 1; c < n; c++) {
        const nxt = new Array(m).fill(false);
        let any = false;
        for (let r = 0; r < m; r++) {
          if (!cur[r]) continue;
          for (let d = -1; d <= 1; d++) {
            const nr = r + d;
            if (nr < 0 || nr >= m) continue;
            if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = true; any = true; }
          }
        }
        if (!any) break;
        cur = nxt;
        best = c;
      }
      return best;
    };
    return {
      slug: "maximum-number-of-moves-in-a-grid",
      title: "Maximum Number of Moves in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Breadth-First Search", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "maxMoves", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You start at any cell of the **first column** of a grid of positive integers. From `(row, col)` you may move to `(row - 1, col + 1)`, `(row, col + 1)` or `(row + 1, col + 1)`, but only to a cell holding a **strictly greater** value.\n\nReturn the maximum number of moves you can make.",
        [
          { in: "grid = [[2,4,3,5],[5,4,9,3],[3,4,2,11],[10,9,13,15]]", out: "3", note: "For example 2 → 4 → 9 → 11 crosses to the last column." },
          { in: "grid = [[3,2,4],[2,1,9],[1,1,7]]", out: "0", note: "No first-column cell has a strictly greater neighbour to its right." },
          { in: "grid = [[1,2],[3,4]]", out: "1" },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 1000", "4 <= m * n <= 10^5", "1 <= grid[i][j] <= 10^6"]),
      hints: [
        "Every move advances exactly one column, so the answer is at most `n - 1`.",
        "Track which rows of the current column are reachable rather than exploring paths one by one.",
        "Sweep columns left to right; stop when no row in the next column can be reached.",
      ],
      editorial: explain({
        idea: "Because each move goes one column right, the state is just the set of reachable rows in the current column. Sweep the columns once, carrying that set forward.",
        steps: [
          "Mark every row of column 0 as reachable.",
          "For column `c`, a row `nr` is reachable if some reachable row `r` in `c - 1` with `|nr - r| <= 1` has `grid[nr][c] > grid[r][c-1]`.",
          "If no row of column `c` is reachable, stop; the answer is `c - 1`.",
          "Otherwise record `c` as the furthest column reached and continue.",
        ],
        why: "Paths never revisit a column, so the reachable-row set is a complete summary of everything the prefix of the walk can matter for. Once that set is empty the walk cannot continue from anywhere, and since every move advances one column, the last non-empty column index is exactly the move count.",
        time: "O(m · n)",
        space: "O(m)",
        pitfalls: [
          "The comparison is *strictly* greater; equal values block the move.",
          "The answer is a count of moves, so a walk reaching column `c` has made `c` moves.",
          "Enumerating individual paths is exponential; the reachable set collapses them.",
        ],
      }),
      examples: [
        { input: "[[2,4,3,5],[5,4,9,3],[3,4,2,11],[10,9,13,15]]", expectedOutput: "3" },
        { input: "[[3,2,4],[2,1,9],[1,1,7]]", expectedOutput: "0" },
        { input: "[[1,2],[3,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6), n = ri(rng, 2, 7);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, 12)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxMoves(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    cur = [True] * m\n    best = 0\n    for c in range(1, n):\n        nxt = [False] * m\n        any_ = False\n        for r in range(m):\n            if not cur[r]:\n                continue\n            for d in (-1, 0, 1):\n                nr = r + d\n                if 0 <= nr < m and grid[nr][c] > grid[r][c - 1]:\n                    nxt[nr] = True\n                    any_ = True\n        if not any_:\n            break\n        cur = nxt\n        best = c\n    return best`,
        javascript: `var maxMoves = function(grid) {\n    var m = grid.length, n = grid[0].length, r;\n    var cur = [];\n    for (r = 0; r < m; r++) cur.push(true);\n    var best = 0;\n    for (var c = 1; c < n; c++) {\n        var nxt = [];\n        for (r = 0; r < m; r++) nxt.push(false);\n        var any = false;\n        for (r = 0; r < m; r++) {\n            if (!cur[r]) continue;\n            for (var d = -1; d <= 1; d++) {\n                var nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = true; any = true; }\n            }\n        }\n        if (!any) break;\n        cur = nxt;\n        best = c;\n    }\n    return best;\n};`,
        typescript: `function maxMoves(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, r: number;\n    var cur: boolean[] = [];\n    for (r = 0; r < m; r++) cur.push(true);\n    var best = 0;\n    for (var c = 1; c < n; c++) {\n        var nxt: boolean[] = [];\n        for (r = 0; r < m; r++) nxt.push(false);\n        var any = false;\n        for (r = 0; r < m; r++) {\n            if (!cur[r]) continue;\n            for (var d = -1; d <= 1; d++) {\n                var nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = true; any = true; }\n            }\n        }\n        if (!any) break;\n        cur = nxt;\n        best = c;\n    }\n    return best;\n}`,
        java: `public static int maxMoves(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    boolean[] cur = new boolean[m];\n    Arrays.fill(cur, true);\n    int best = 0;\n    for (int c = 1; c < n; c++) {\n        boolean[] nxt = new boolean[m];\n        boolean any = false;\n        for (int r = 0; r < m; r++) {\n            if (!cur[r]) continue;\n            for (int d = -1; d <= 1; d++) {\n                int nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = true; any = true; }\n            }\n        }\n        if (!any) break;\n        cur = nxt;\n        best = c;\n    }\n    return best;\n}`,
        cpp: `int maxMoves(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<char> cur(m, 1);\n    int best = 0;\n    for (int c = 1; c < n; c++) {\n        vector<char> nxt(m, 0);\n        bool any = false;\n        for (int r = 0; r < m; r++) {\n            if (!cur[r]) continue;\n            for (int d = -1; d <= 1; d++) {\n                int nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = 1; any = true; }\n            }\n        }\n        if (!any) break;\n        cur = nxt;\n        best = c;\n    }\n    return best;\n}`,
        c: `int maxMoves(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    char* cur = (char*) malloc((size_t) m);\n    char* nxt = (char*) malloc((size_t) m);\n    for (int r = 0; r < m; r++) cur[r] = 1;\n    int best = 0;\n    for (int c = 1; c < n; c++) {\n        for (int r = 0; r < m; r++) nxt[r] = 0;\n        int any = 0;\n        for (int r = 0; r < m; r++) {\n            if (!cur[r]) continue;\n            for (int d = -1; d <= 1; d++) {\n                int nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = 1; any = 1; }\n            }\n        }\n        if (!any) break;\n        char* tmp = cur;\n        cur = nxt;\n        nxt = tmp;\n        best = c;\n    }\n    free(cur);\n    free(nxt);\n    return best;\n}`,
        csharp: `public static int MaxMoves(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var cur = new bool[m];\n    for (int r = 0; r < m; r++) cur[r] = true;\n    int best = 0;\n    for (int c = 1; c < n; c++)\n    {\n        var nxt = new bool[m];\n        bool any = false;\n        for (int r = 0; r < m; r++)\n        {\n            if (!cur[r]) continue;\n            for (int d = -1; d <= 1; d++)\n            {\n                int nr = r + d;\n                if (nr < 0 || nr >= m) continue;\n                if (grid[nr][c] > grid[r][c - 1]) { nxt[nr] = true; any = true; }\n            }\n        }\n        if (!any) break;\n        cur = nxt;\n        best = c;\n    }\n    return best;\n}`,
        go: `func maxMoves(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tcur := make([]bool, m)\n\tfor r := range cur {\n\t\tcur[r] = true\n\t}\n\tbest := 0\n\tfor c := 1; c < n; c++ {\n\t\tnxt := make([]bool, m)\n\t\tany := false\n\t\tfor r := 0; r < m; r++ {\n\t\t\tif !cur[r] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfor d := -1; d <= 1; d++ {\n\t\t\t\tnr := r + d\n\t\t\t\tif nr < 0 || nr >= m {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif grid[nr][c] > grid[r][c-1] {\n\t\t\t\t\tnxt[nr] = true\n\t\t\t\t\tany = true\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tif !any {\n\t\t\tbreak\n\t\t}\n\t\tcur = nxt\n\t\tbest = c\n\t}\n\treturn best\n}`,
        kotlin: `fun maxMoves(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    var cur = BooleanArray(m) { true }\n    var best = 0\n    for (c in 1 until n) {\n        val nxt = BooleanArray(m)\n        var any = false\n        for (r in 0 until m) {\n            if (!cur[r]) continue\n            for (d in -1..1) {\n                val nr = r + d\n                if (nr < 0 || nr >= m) continue\n                if (grid[nr][c] > grid[r][c - 1]) {\n                    nxt[nr] = true\n                    any = true\n                }\n            }\n        }\n        if (!any) break\n        cur = nxt\n        best = c\n    }\n    return best\n}`,
        swift: `func maxMoves(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var cur = [Bool](repeating: true, count: m)\n    var best = 0\n    for c in 1..<n {\n        var nxt = [Bool](repeating: false, count: m)\n        var any = false\n        for r in 0..<m {\n            if !cur[r] { continue }\n            for d in -1...1 {\n                let nr = r + d\n                if nr < 0 || nr >= m { continue }\n                if grid[nr][c] > grid[r][c - 1] {\n                    nxt[nr] = true\n                    any = true\n                }\n            }\n        }\n        if !any { break }\n        cur = nxt\n        best = c\n    }\n    return best\n}`,
        rust: `fn maxMoves(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut cur = vec![true; m];\n    let mut best = 0i32;\n    for c in 1..n {\n        let mut nxt = vec![false; m];\n        let mut any = false;\n        for r in 0..m {\n            if !cur[r] {\n                continue;\n            }\n            for d in -1i32..=1 {\n                let nr = r as i32 + d;\n                if nr < 0 || nr >= m as i32 {\n                    continue;\n                }\n                if grid[nr as usize][c] > grid[r][c - 1] {\n                    nxt[nr as usize] = true;\n                    any = true;\n                }\n            }\n        }\n        if !any {\n            break;\n        }\n        cur = nxt;\n        best = c as i32;\n    }\n    best\n}`,
        php: `function maxMoves($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $cur = array_fill(0, $m, true);\n    $best = 0;\n    for ($c = 1; $c < $n; $c++) {\n        $nxt = array_fill(0, $m, false);\n        $any = false;\n        for ($r = 0; $r < $m; $r++) {\n            if (!$cur[$r]) continue;\n            for ($d = -1; $d <= 1; $d++) {\n                $nr = $r + $d;\n                if ($nr < 0 || $nr >= $m) continue;\n                if ($grid[$nr][$c] > $grid[$r][$c - 1]) {\n                    $nxt[$nr] = true;\n                    $any = true;\n                }\n            }\n        }\n        if (!$any) break;\n        $cur = $nxt;\n        $best = $c;\n    }\n    return $best;\n}`,
        ruby: `def maxMoves(grid)\n  m = grid.length\n  n = grid[0].length\n  cur = Array.new(m, true)\n  best = 0\n  (1...n).each do |c|\n    nxt = Array.new(m, false)\n    any = false\n    (0...m).each do |r|\n      next unless cur[r]\n      (-1..1).each do |d|\n        nr = r + d\n        next if nr < 0 || nr >= m\n        if grid[nr][c] > grid[r][c - 1]\n          nxt[nr] = true\n          any = true\n        end\n      end\n    end\n    break unless any\n    cur = nxt\n    best = c\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Construct Product Matrix (LC 2906) ──────────────────────────
  (() => {
    const MOD = 12345;
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const total = m * n;
      const pre = new Array(total + 1).fill(1);
      for (let k = 0; k < total; k++) {
        pre[k + 1] = (pre[k] * (grid[Math.floor(k / n)][k % n] % MOD)) % MOD;
      }
      const out: number[][] = [];
      let suf = 1;
      const val = new Array(total).fill(0);
      for (let k = total - 1; k >= 0; k--) {
        val[k] = (pre[k] * suf) % MOD;
        suf = (suf * (grid[Math.floor(k / n)][k % n] % MOD)) % MOD;
      }
      for (let i = 0; i < m; i++) out.push(val.slice(i * n, i * n + n));
      return out;
    };
    return {
      slug: "construct-product-matrix",
      title: "Construct Product Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "constructProductMatrix", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an `m × n` grid, build the **product matrix** `p`, where `p[i][j]` is the product of **all** elements of `grid` except `grid[i][j]`, taken modulo `12345`.",
        [
          { in: "grid = [[1,2],[3,4]]", out: "[[24,12],[8,6]]", note: "`p[0][0] = 2 · 3 · 4 = 24`." },
          { in: "grid = [[12345],[2],[1]]", out: "[[2],[0],[0]]", note: "`12345 % 12345` is 0, so every cell but the first becomes 0." },
          { in: "grid = [[1,1,1]]", out: "[[1,1,1]]" },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m * n <= 10^5", "1 <= grid[i][j] <= 10^9"]),
      hints: [
        "Division is not available: `12345` is not prime, so many elements have no modular inverse.",
        "Flatten the grid and think about products of prefixes and suffixes.",
        "`p[k] = prefix[k] · suffix[k + 1]`.",
      ],
      editorial: explain({
        idea: "Read the grid as one flat sequence. The product of everything except position `k` is the product of everything before it times the product of everything after it — two running products, no division.",
        steps: [
          "Compute `pre[k]` = product of the first `k` elements, mod `12345`.",
          "Sweep from the end keeping `suf` = product of everything after the current position.",
          "Set `p[k] = pre[k] · suf`, then fold the current element into `suf`.",
          "Reshape the flat answers back into `m × n`.",
        ],
        why: "The obvious trick — divide the total product by `grid[i][j]` — fails because `12345 = 3 · 5 · 823` is composite, so an element sharing a factor with it has no inverse and a zero total product destroys the information. Prefix-suffix products avoid inverses entirely, which is the whole point of the problem.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Dividing by the element is wrong under a composite modulus.",
          "Reduce each element mod `12345` before multiplying, or the intermediate exceeds 32 bits.",
          "The suffix must exclude the current element, so fold it in *after* writing the answer.",
        ],
      }),
      examples: [
        { input: "[[1,2],[3,4]]", expectedOutput: "[[24,12],[8,6]]" },
        { input: "[[12345],[2],[1]]", expectedOutput: "[[2],[0],[0]]" },
        { input: "[[1,1,1]]", expectedOutput: "[[1,1,1]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => (rng() < 0.12 ? 12345 * ri(rng, 1, 3) : ri(rng, 1, 40000))));
        return { input: fmtIntMat(grid), expectedOutput: fmtIntMat(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef constructProductMatrix(grid: List[List[int]]) -> List[List[int]]:\n    MOD = 12345\n    m, n = len(grid), len(grid[0])\n    flat = [grid[i][j] % MOD for i in range(m) for j in range(n)]\n    total = m * n\n    pre = [1] * (total + 1)\n    for k in range(total):\n        pre[k + 1] = pre[k] * flat[k] % MOD\n    val = [0] * total\n    suf = 1\n    for k in range(total - 1, -1, -1):\n        val[k] = pre[k] * suf % MOD\n        suf = suf * flat[k] % MOD\n    return [val[i * n:(i + 1) * n] for i in range(m)]`,
        javascript: `var constructProductMatrix = function(grid) {\n    var MOD = 12345;\n    var m = grid.length, n = grid[0].length, i, j, k;\n    var total = m * n;\n    var flat = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) flat.push(grid[i][j] % MOD);\n    }\n    var pre = [1];\n    for (k = 0; k < total; k++) pre.push((pre[k] * flat[k]) % MOD);\n    var val = new Array(total);\n    var suf = 1;\n    for (k = total - 1; k >= 0; k--) {\n        val[k] = (pre[k] * suf) % MOD;\n        suf = (suf * flat[k]) % MOD;\n    }\n    var out = [];\n    for (i = 0; i < m; i++) out.push(val.slice(i * n, i * n + n));\n    return out;\n};`,
        typescript: `function constructProductMatrix(grid: number[][]): number[][] {\n    var MOD = 12345;\n    var m = grid.length, n = grid[0].length, i: number, j: number, k: number;\n    var total = m * n;\n    var flat: number[] = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) flat.push(grid[i][j] % MOD);\n    }\n    var pre: number[] = [1];\n    for (k = 0; k < total; k++) pre.push((pre[k] * flat[k]) % MOD);\n    var val: number[] = new Array(total);\n    var suf = 1;\n    for (k = total - 1; k >= 0; k--) {\n        val[k] = (pre[k] * suf) % MOD;\n        suf = (suf * flat[k]) % MOD;\n    }\n    var out: number[][] = [];\n    for (i = 0; i < m; i++) out.push(val.slice(i * n, i * n + n));\n    return out;\n}`,
        java: `public static int[][] constructProductMatrix(int[][] grid) {\n    final int MOD = 12345;\n    int m = grid.length, n = grid[0].length;\n    int total = m * n;\n    int[] flat = new int[total];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) flat[i * n + j] = grid[i][j] % MOD;\n    }\n    int[] pre = new int[total + 1];\n    pre[0] = 1;\n    for (int k = 0; k < total; k++) pre[k + 1] = (int) ((long) pre[k] * flat[k] % MOD);\n    int[] val = new int[total];\n    long suf = 1;\n    for (int k = total - 1; k >= 0; k--) {\n        val[k] = (int) (pre[k] * suf % MOD);\n        suf = suf * flat[k] % MOD;\n    }\n    int[][] out = new int[m][n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) out[i][j] = val[i * n + j];\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> constructProductMatrix(vector<vector<int>>& grid) {\n    const long long MOD = 12345;\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int total = m * n;\n    vector<long long> flat(total);\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) flat[i * n + j] = grid[i][j] % MOD;\n    }\n    vector<long long> pre(total + 1, 1);\n    for (int k = 0; k < total; k++) pre[k + 1] = pre[k] * flat[k] % MOD;\n    vector<vector<int>> out(m, vector<int>(n, 0));\n    long long suf = 1;\n    for (int k = total - 1; k >= 0; k--) {\n        out[k / n][k % n] = (int) (pre[k] * suf % MOD);\n        suf = suf * flat[k] % MOD;\n    }\n    return out;\n}`,
        c: `int** constructProductMatrix(int** grid, int gridSize, int* gridColSize, int* returnSize, int** returnColumnSizes) {\n    const long long MOD = 12345;\n    int m = gridSize, n = gridColSize[0];\n    int total = m * n;\n    long long* flat = (long long*) malloc((size_t) total * sizeof(long long));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) flat[i * n + j] = grid[i][j] % MOD;\n    }\n    long long* pre = (long long*) malloc((size_t) (total + 1) * sizeof(long long));\n    pre[0] = 1;\n    for (int k = 0; k < total; k++) pre[k + 1] = pre[k] * flat[k] % MOD;\n    int** out = (int**) malloc((size_t) m * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < m; i++) {\n        out[i] = (int*) malloc((size_t) n * sizeof(int));\n        (*returnColumnSizes)[i] = n;\n    }\n    long long suf = 1;\n    for (int k = total - 1; k >= 0; k--) {\n        out[k / n][k % n] = (int) (pre[k] * suf % MOD);\n        suf = suf * flat[k] % MOD;\n    }\n    free(flat);\n    free(pre);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[][] ConstructProductMatrix(int[][] grid)\n{\n    const long MOD = 12345;\n    int m = grid.Length, n = grid[0].Length;\n    int total = m * n;\n    var flat = new long[total];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++) flat[i * n + j] = grid[i][j] % MOD;\n    }\n    var pre = new long[total + 1];\n    pre[0] = 1;\n    for (int k = 0; k < total; k++) pre[k + 1] = pre[k] * flat[k] % MOD;\n    var out_ = new int[m][];\n    for (int i = 0; i < m; i++) out_[i] = new int[n];\n    long suf = 1;\n    for (int k = total - 1; k >= 0; k--)\n    {\n        out_[k / n][k % n] = (int) (pre[k] * suf % MOD);\n        suf = suf * flat[k] % MOD;\n    }\n    return out_;\n}`,
        go: `func constructProductMatrix(grid [][]int) [][]int {\n\tconst MOD = 12345\n\tm, n := len(grid), len(grid[0])\n\ttotal := m * n\n\tflat := make([]int, total)\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tflat[i*n+j] = grid[i][j] % MOD\n\t\t}\n\t}\n\tpre := make([]int, total+1)\n\tpre[0] = 1\n\tfor k := 0; k < total; k++ {\n\t\tpre[k+1] = pre[k] * flat[k] % MOD\n\t}\n\tout := make([][]int, m)\n\tfor i := range out {\n\t\tout[i] = make([]int, n)\n\t}\n\tsuf := 1\n\tfor k := total - 1; k >= 0; k-- {\n\t\tout[k/n][k%n] = pre[k] * suf % MOD\n\t\tsuf = suf * flat[k] % MOD\n\t}\n\treturn out\n}`,
        kotlin: `fun constructProductMatrix(grid: Array<IntArray>): Array<IntArray> {\n    val MOD = 12345L\n    val m = grid.size\n    val n = grid[0].size\n    val total = m * n\n    val flat = LongArray(total)\n    for (i in 0 until m) {\n        for (j in 0 until n) flat[i * n + j] = (grid[i][j] % MOD)\n    }\n    val pre = LongArray(total + 1)\n    pre[0] = 1\n    for (k in 0 until total) pre[k + 1] = pre[k] * flat[k] % MOD\n    val out = Array(m) { IntArray(n) }\n    var suf = 1L\n    for (k in total - 1 downTo 0) {\n        out[k / n][k % n] = (pre[k] * suf % MOD).toInt()\n        suf = suf * flat[k] % MOD\n    }\n    return out\n}`,
        swift: `func constructProductMatrix(_ grid: [[Int]]) -> [[Int]] {\n    let MOD = 12345\n    let m = grid.count\n    let n = grid[0].count\n    let total = m * n\n    var flat = [Int](repeating: 0, count: total)\n    for i in 0..<m {\n        for j in 0..<n { flat[i * n + j] = grid[i][j] % MOD }\n    }\n    var pre = [Int](repeating: 1, count: total + 1)\n    for k in 0..<total { pre[k + 1] = pre[k] * flat[k] % MOD }\n    var out = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    var suf = 1\n    for k in stride(from: total - 1, through: 0, by: -1) {\n        out[k / n][k % n] = pre[k] * suf % MOD\n        suf = suf * flat[k] % MOD\n    }\n    return out\n}`,
        rust: `fn constructProductMatrix(grid: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    const MOD: i64 = 12345;\n    let m = grid.len();\n    let n = grid[0].len();\n    let total = m * n;\n    let mut flat = vec![0i64; total];\n    for i in 0..m {\n        for j in 0..n {\n            flat[i * n + j] = grid[i][j] as i64 % MOD;\n        }\n    }\n    let mut pre = vec![1i64; total + 1];\n    for k in 0..total {\n        pre[k + 1] = pre[k] * flat[k] % MOD;\n    }\n    let mut out = vec![vec![0i32; n]; m];\n    let mut suf = 1i64;\n    for k in (0..total).rev() {\n        out[k / n][k % n] = (pre[k] * suf % MOD) as i32;\n        suf = suf * flat[k] % MOD;\n    }\n    out\n}`,
        php: `function constructProductMatrix($grid) {\n    $MOD = 12345;\n    $m = count($grid);\n    $n = count($grid[0]);\n    $total = $m * $n;\n    $flat = [];\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) $flat[] = $grid[$i][$j] % $MOD;\n    }\n    $pre = [1];\n    for ($k = 0; $k < $total; $k++) $pre[] = $pre[$k] * $flat[$k] % $MOD;\n    $out = [];\n    for ($i = 0; $i < $m; $i++) $out[$i] = array_fill(0, $n, 0);\n    $suf = 1;\n    for ($k = $total - 1; $k >= 0; $k--) {\n        $out[intdiv($k, $n)][$k % $n] = $pre[$k] * $suf % $MOD;\n        $suf = $suf * $flat[$k] % $MOD;\n    }\n    return $out;\n}`,
        ruby: `def constructProductMatrix(grid)\n  mod = 12345\n  m = grid.length\n  n = grid[0].length\n  flat = grid.flatten.map { |v| v % mod }\n  total = m * n\n  pre = Array.new(total + 1, 1)\n  (0...total).each { |k| pre[k + 1] = pre[k] * flat[k] % mod }\n  out = Array.new(m) { Array.new(n, 0) }\n  suf = 1\n  (total - 1).downto(0) do |k|\n    out[k / n][k % n] = pre[k] * suf % mod\n    suf = suf * flat[k] % mod\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Maximum Number of Fish in a Grid (LC 2658) ──────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const seen = Array.from({ length: m }, () => new Array(n).fill(false));
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let best = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] === 0 || seen[i][j]) continue;
          let sum = 0;
          const stack = [i * n + j];
          seen[i][j] = true;
          while (stack.length > 0) {
            const cur = stack.pop() as number;
            const r = Math.floor(cur / n), c = cur % n;
            sum += grid[r][c];
            for (let d = 0; d < 4; d++) {
              const nr = r + dr[d], nc = c + dc[d];
              if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
              if (grid[nr][nc] === 0 || seen[nr][nc]) continue;
              seen[nr][nc] = true;
              stack.push(nr * n + nc);
            }
          }
          if (sum > best) best = sum;
        }
      }
      return best;
    };
    return {
      slug: "maximum-number-of-fish-in-a-grid",
      title: "Maximum Number of Fish in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search", "Union Find", "Amazon", "Microsoft", "Paytm"],
      signature: { funcName: "findMaxFish", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A grid represents a pond: `grid[i][j] == 0` is a land cell, and a positive value is a water cell holding that many fish.\n\nA fisher may start at **any** water cell, catch all its fish, and then move to an adjacent water cell (up, down, left or right), repeating as long as they like. Return the largest total catch possible, or `0` if there is no water.",
        [
          { in: "grid = [[0,2,1,0],[4,0,0,3],[1,0,0,4],[0,3,2,0]]", out: "7", note: "Start at `(1,3)` with 3 fish and move down to `(2,3)` with 4." },
          { in: "grid = [[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,1]]", out: "1", note: "Two isolated cells of one fish each." },
          { in: "grid = [[0,0],[0,0]]", out: "0" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10", "0 <= grid[i][j] <= 10"]),
      hints: [
        "The fisher can reach every water cell connected to the start, so the catch is a whole connected region.",
        "Find the connected components of the positive cells.",
        "The answer is the largest component sum.",
      ],
      editorial: explain({
        idea: "Moving between adjacent water cells means the fisher can sweep an entire connected component of water. So the problem reduces to summing each component and taking the largest.",
        steps: [
          "Scan for an unvisited positive cell.",
          "Flood-fill from it with a stack or queue, summing values and marking cells visited.",
          "Track the largest sum seen.",
        ],
        why: "Since moves are reversible and unlimited, everything reachable from the start is exactly its connected component, and the fisher can tour all of it. Nothing outside is reachable, so the best catch is the maximum component sum — no ordering or path optimisation is involved at all.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Cells with `0` are land and break connectivity; they are not empty water.",
          "Mark visited on push, not on pop, or a cell is counted twice.",
          "A grid of all land answers `0`.",
        ],
      }),
      examples: [
        { input: "[[0,2,1,0],[4,0,0,3],[1,0,0,4],[0,3,2,0]]", expectedOutput: "7" },
        { input: "[[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,1]]", expectedOutput: "1" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.45 ? 0 : ri(rng, 1, 10))));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMaxFish(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    seen = [[False] * n for _ in range(m)]\n    best = 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == 0 or seen[i][j]:\n                continue\n            total = 0\n            stack = [(i, j)]\n            seen[i][j] = True\n            while stack:\n                r, c = stack.pop()\n                total += grid[r][c]\n                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n                    if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0 and not seen[nr][nc]:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n            best = max(best, total)\n    return best`,
        javascript: `var findMaxFish = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j;\n    var seen = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var best = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 0 || seen[i][j]) continue;\n            var sum = 0;\n            var stack = [i * n + j];\n            seen[i][j] = true;\n            while (stack.length > 0) {\n                var cur = stack.pop();\n                var r = Math.floor(cur / n), c = cur % n;\n                sum += grid[r][c];\n                for (var d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] === 0 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push(nr * n + nc);\n                }\n            }\n            if (sum > best) best = sum;\n        }\n    }\n    return best;\n};`,
        typescript: `function findMaxFish(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, i: number, j: number;\n    var seen: boolean[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: boolean[] = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var best = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 0 || seen[i][j]) continue;\n            var sum = 0;\n            var stack: number[] = [i * n + j];\n            seen[i][j] = true;\n            while (stack.length > 0) {\n                var cur = stack.pop() as number;\n                var r = Math.floor(cur / n), c = cur % n;\n                sum += grid[r][c];\n                for (var d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] === 0 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push(nr * n + nc);\n                }\n            }\n            if (sum > best) best = sum;\n        }\n    }\n    return best;\n}`,
        java: `public static int findMaxFish(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    boolean[][] seen = new boolean[m][n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[] stack = new int[m * n];\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 0 || seen[i][j]) continue;\n            int sum = 0, top = 0;\n            stack[top++] = i * n + j;\n            seen[i][j] = true;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                sum += grid[r][c];\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] == 0 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            best = Math.max(best, sum);\n        }\n    }\n    return best;\n}`,
        cpp: `int findMaxFish(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<char>> seen(m, vector<char>(n, 0));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 0 || seen[i][j]) continue;\n            int sum = 0;\n            vector<int> stack;\n            stack.push_back(i * n + j);\n            seen[i][j] = 1;\n            while (!stack.empty()) {\n                int cur = stack.back();\n                stack.pop_back();\n                int r = cur / n, c = cur % n;\n                sum += grid[r][c];\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] == 0 || seen[nr][nc]) continue;\n                    seen[nr][nc] = 1;\n                    stack.push_back(nr * n + nc);\n                }\n            }\n            best = max(best, sum);\n        }\n    }\n    return best;\n}`,
        c: `int findMaxFish(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    char* seen = (char*) calloc((size_t) (m * n), 1);\n    int* stack = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 0 || seen[i * n + j]) continue;\n            int sum = 0, top = 0;\n            stack[top++] = i * n + j;\n            seen[i * n + j] = 1;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                sum += grid[r][c];\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] == 0 || seen[nr * n + nc]) continue;\n                    seen[nr * n + nc] = 1;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            if (sum > best) best = sum;\n        }\n    }\n    free(seen);\n    free(stack);\n    return best;\n}`,
        csharp: `public static int FindMaxFish(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var seen = new bool[m, n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var stack = new int[m * n];\n    int best = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] == 0 || seen[i, j]) continue;\n            int sum = 0, top = 0;\n            stack[top++] = i * n + j;\n            seen[i, j] = true;\n            while (top > 0)\n            {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                sum += grid[r][c];\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] == 0 || seen[nr, nc]) continue;\n                    seen[nr, nc] = true;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            best = Math.Max(best, sum);\n        }\n    }\n    return best;\n}`,
        go: `func findMaxFish(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tseen := make([][]bool, m)\n\tfor i := range seen {\n\t\tseen[i] = make([]bool, n)\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tbest := 0\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] == 0 || seen[i][j] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tsum := 0\n\t\t\tstack := []int{i*n + j}\n\t\t\tseen[i][j] = true\n\t\t\tfor len(stack) > 0 {\n\t\t\t\tcur := stack[len(stack)-1]\n\t\t\t\tstack = stack[:len(stack)-1]\n\t\t\t\tr, c := cur/n, cur%n\n\t\t\t\tsum += grid[r][c]\n\t\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tif grid[nr][nc] == 0 || seen[nr][nc] {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tseen[nr][nc] = true\n\t\t\t\t\tstack = append(stack, nr*n+nc)\n\t\t\t\t}\n\t\t\t}\n\t\t\tif sum > best {\n\t\t\t\tbest = sum\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findMaxFish(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val seen = Array(m) { BooleanArray(n) }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var best = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (grid[i][j] == 0 || seen[i][j]) continue\n            var sum = 0\n            val stack = ArrayList<Int>()\n            stack.add(i * n + j)\n            seen[i][j] = true\n            while (stack.isNotEmpty()) {\n                val cur = stack.removeAt(stack.size - 1)\n                val r = cur / n\n                val c = cur % n\n                sum += grid[r][c]\n                for (d in 0 until 4) {\n                    val nr = r + dr[d]\n                    val nc = c + dc[d]\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                    if (grid[nr][nc] == 0 || seen[nr][nc]) continue\n                    seen[nr][nc] = true\n                    stack.add(nr * n + nc)\n                }\n            }\n            if (sum > best) best = sum\n        }\n    }\n    return best\n}`,
        swift: `func findMaxFish(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var best = 0\n    for i in 0..<m {\n        for j in 0..<n {\n            if grid[i][j] == 0 || seen[i][j] { continue }\n            var sum = 0\n            var stack = [i * n + j]\n            seen[i][j] = true\n            while let cur = stack.popLast() {\n                let r = cur / n, c = cur % n\n                sum += grid[r][c]\n                for d in 0..<4 {\n                    let nr = r + dr[d], nc = c + dc[d]\n                    if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                    if grid[nr][nc] == 0 || seen[nr][nc] { continue }\n                    seen[nr][nc] = true\n                    stack.append(nr * n + nc)\n                }\n            }\n            best = max(best, sum)\n        }\n    }\n    return best\n}`,
        rust: `fn findMaxFish(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut seen = vec![vec![false; n]; m];\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut best = 0i32;\n    for i in 0..m {\n        for j in 0..n {\n            if grid[i][j] == 0 || seen[i][j] {\n                continue;\n            }\n            let mut sum = 0i32;\n            let mut stack = vec![i * n + j];\n            seen[i][j] = true;\n            while let Some(cur) = stack.pop() {\n                let r = (cur / n) as i32;\n                let c = (cur % n) as i32;\n                sum += grid[r as usize][c as usize];\n                for d in 0..4 {\n                    let nr = r + dr[d];\n                    let nc = c + dc[d];\n                    if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                        continue;\n                    }\n                    if grid[nr as usize][nc as usize] == 0 || seen[nr as usize][nc as usize] {\n                        continue;\n                    }\n                    seen[nr as usize][nc as usize] = true;\n                    stack.push(nr as usize * n + nc as usize);\n                }\n            }\n            if sum > best {\n                best = sum;\n            }\n        }\n    }\n    best\n}`,
        php: `function findMaxFish($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $seen = [];\n    for ($i = 0; $i < $m; $i++) $seen[$i] = array_fill(0, $n, false);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $best = 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] === 0 || $seen[$i][$j]) continue;\n            $sum = 0;\n            $stack = [$i * $n + $j];\n            $seen[$i][$j] = true;\n            while (count($stack) > 0) {\n                $cur = array_pop($stack);\n                $r = intdiv($cur, $n);\n                $c = $cur % $n;\n                $sum += $grid[$r][$c];\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $r + $dr[$d];\n                    $nc = $c + $dc[$d];\n                    if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                    if ($grid[$nr][$nc] === 0 || $seen[$nr][$nc]) continue;\n                    $seen[$nr][$nc] = true;\n                    $stack[] = $nr * $n + $nc;\n                }\n            }\n            if ($sum > $best) $best = $sum;\n        }\n    }\n    return $best;\n}`,
        ruby: `def findMaxFish(grid)\n  m = grid.length\n  n = grid[0].length\n  seen = Array.new(m) { Array.new(n, false) }\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  best = 0\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next if grid[i][j] == 0 || seen[i][j]\n      sum = 0\n      stack = [i * n + j]\n      seen[i][j] = true\n      until stack.empty?\n        cur = stack.pop\n        r = cur / n\n        c = cur % n\n        sum += grid[r][c]\n        (0...4).each do |d|\n          nr = r + dr[d]\n          nc = c + dc[d]\n          next if nr < 0 || nr >= m || nc < 0 || nc >= n\n          next if grid[nr][nc] == 0 || seen[nr][nc]\n          seen[nr][nc] = true\n          stack << nr * n + nc\n        end\n      end\n      best = sum if sum > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Magic Squares In Grid (LC 840) ──────────────────────────────
  (() => {
    const isMagic = (g: number[][], r: number, c: number) => {
      const seen = new Array(10).fill(0);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const v = g[r + i][c + j];
          if (v < 1 || v > 9 || seen[v]) return false;
          seen[v] = 1;
        }
      }
      for (let i = 0; i < 3; i++) {
        if (g[r + i][c] + g[r + i][c + 1] + g[r + i][c + 2] !== 15) return false;
        if (g[r][c + i] + g[r + 1][c + i] + g[r + 2][c + i] !== 15) return false;
      }
      if (g[r][c] + g[r + 1][c + 1] + g[r + 2][c + 2] !== 15) return false;
      if (g[r][c + 2] + g[r + 1][c + 1] + g[r + 2][c] !== 15) return false;
      return true;
    };
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let count = 0;
      for (let r = 0; r + 2 < m; r++) {
        for (let c = 0; c + 2 < n; c++) if (isMagic(grid, r, c)) count++;
      }
      return count;
    };
    return {
      slug: "magic-squares-in-grid",
      title: "Magic Squares In Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Google", "Infosys"],
      signature: { funcName: "numMagicSquaresInside", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A **3 × 3 magic square** is a grid holding each of the digits `1` to `9` exactly once, where every row, every column and both diagonals add up to the same total.\n\nGiven a grid of integers, count how many 3 × 3 contiguous subgrids are magic squares.",
        [
          { in: "grid = [[4,3,8,4],[9,5,1,9],[2,7,6,2]]", out: "1", note: "The left 3 × 3 block is magic; the right one is not." },
          { in: "grid = [[8]]", out: "0", note: "Too small to hold a 3 × 3 block." },
          { in: "grid = [[4,3,8],[9,5,1],[2,7,6]]", out: "1" },
        ],
        ["row == grid.length", "col == grid[i].length", "1 <= row, col <= 10", "0 <= grid[i][j] <= 15"]),
      hints: [
        "There are at most `(row - 2) · (col - 2)` candidate blocks, so checking each one in full is cheap.",
        "First reject any block that does not hold exactly the digits 1 through 9.",
        "A 3 × 3 magic square always sums to 15 on every line.",
      ],
      editorial: explain({
        idea: "The grid is tiny, so try every 3 × 3 position and validate it directly. Validation is two parts: the digit set, then the eight line sums.",
        steps: [
          "For each top-left corner, mark the nine values and reject unless they are exactly `1 … 9`, each once.",
          "Check the three row sums, the three column sums and the two diagonals all equal 15.",
          "Count the blocks that pass.",
        ],
        why: "The total of `1 … 9` is 45, and the three rows partition the square, so if all rows are equal each must be 15 — the constant is forced, not a choice. Checking the digit set first is what makes the rest safe: without it a block of nine 5s passes every sum test.",
        time: "O(row · col)",
        space: "O(1)",
        pitfalls: [
          "Skipping the distinctness check accepts grids of all 5s.",
          "Both diagonals matter, not just the main one.",
          "Values outside `1 … 9` (including 0) disqualify a block immediately.",
        ],
      }),
      examples: [
        { input: "[[4,3,8,4],[9,5,1,9],[2,7,6,2]]", expectedOutput: "1" },
        { input: "[[8]]", expectedOutput: "0" },
        { input: "[[4,3,8],[9,5,1],[2,7,6]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, 15)));
        // Random grids are almost never magic, so plant a real magic square
        // (one of the eight rotations/reflections) often enough to exercise the
        // positive branch.
        if (m >= 3 && n >= 3 && rng() < 0.5) {
          let sq = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
          const turns = ri(rng, 0, 3);
          for (let t = 0; t < turns; t++) {
            sq = [0, 1, 2].map((i) => [0, 1, 2].map((j) => sq[2 - j][i]));
          }
          if (rng() < 0.5) sq = sq.map((row) => row.slice().reverse());
          const r0 = ri(rng, 0, m - 3), c0 = ri(rng, 0, n - 3);
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) grid[r0 + i][c0 + j] = sq[i][j];
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numMagicSquaresInside(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n\n    def magic(r: int, c: int) -> bool:\n        vals = [grid[r + i][c + j] for i in range(3) for j in range(3)]\n        if sorted(vals) != [1, 2, 3, 4, 5, 6, 7, 8, 9]:\n            return False\n        for i in range(3):\n            if grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15:\n                return False\n            if grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15:\n                return False\n        if grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15:\n            return False\n        if grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15:\n            return False\n        return True\n\n    return sum(1 for r in range(m - 2) for c in range(n - 2) if magic(r, c))`,
        javascript: `var numMagicSquaresInside = function(grid) {\n    var m = grid.length, n = grid[0].length;\n    var magic = function(r, c) {\n        var seen = [];\n        var i, j;\n        for (i = 0; i <= 9; i++) seen.push(0);\n        for (i = 0; i < 3; i++) {\n            for (j = 0; j < 3; j++) {\n                var v = grid[r + i][c + j];\n                if (v < 1 || v > 9 || seen[v]) return false;\n                seen[v] = 1;\n            }\n        }\n        for (i = 0; i < 3; i++) {\n            if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] !== 15) return false;\n            if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] !== 15) return false;\n        }\n        if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] !== 15) return false;\n        if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] !== 15) return false;\n        return true;\n    };\n    var count = 0;\n    for (var r = 0; r + 2 < m; r++) {\n        for (var c = 0; c + 2 < n; c++) if (magic(r, c)) count++;\n    }\n    return count;\n};`,
        typescript: `function numMagicSquaresInside(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length;\n    var magic = function(r: number, c: number): boolean {\n        var seen: number[] = [];\n        var i: number, j: number;\n        for (i = 0; i <= 9; i++) seen.push(0);\n        for (i = 0; i < 3; i++) {\n            for (j = 0; j < 3; j++) {\n                var v = grid[r + i][c + j];\n                if (v < 1 || v > 9 || seen[v]) return false;\n                seen[v] = 1;\n            }\n        }\n        for (i = 0; i < 3; i++) {\n            if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] !== 15) return false;\n            if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] !== 15) return false;\n        }\n        if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] !== 15) return false;\n        if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] !== 15) return false;\n        return true;\n    };\n    var count = 0;\n    for (var r = 0; r + 2 < m; r++) {\n        for (var c = 0; c + 2 < n; c++) if (magic(r, c)) count++;\n    }\n    return count;\n}`,
        java: `public static int numMagicSquaresInside(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int count = 0;\n    for (int r = 0; r + 2 < m; r++) {\n        for (int c = 0; c + 2 < n; c++) if (magicAt(grid, r, c)) count++;\n    }\n    return count;\n}\n\nprivate static boolean magicAt(int[][] grid, int r, int c) {\n    boolean[] seen = new boolean[10];\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            int v = grid[r + i][c + j];\n            if (v < 1 || v > 9 || seen[v]) return false;\n            seen[v] = true;\n        }\n    }\n    for (int i = 0; i < 3; i++) {\n        if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15) return false;\n        if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15) return false;\n    }\n    if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15) return false;\n    if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15) return false;\n    return true;\n}`,
        cpp: `static bool magicAt(vector<vector<int>>& grid, int r, int c) {\n    bool seen[10] = { false };\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            int v = grid[r + i][c + j];\n            if (v < 1 || v > 9 || seen[v]) return false;\n            seen[v] = true;\n        }\n    }\n    for (int i = 0; i < 3; i++) {\n        if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15) return false;\n        if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15) return false;\n    }\n    if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15) return false;\n    if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15) return false;\n    return true;\n}\n\nint numMagicSquaresInside(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int count = 0;\n    for (int r = 0; r + 2 < m; r++) {\n        for (int c = 0; c + 2 < n; c++) if (magicAt(grid, r, c)) count++;\n    }\n    return count;\n}`,
        c: `static bool magicAt(int** grid, int r, int c) {\n    bool seen[10] = { false };\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            int v = grid[r + i][c + j];\n            if (v < 1 || v > 9 || seen[v]) return false;\n            seen[v] = true;\n        }\n    }\n    for (int i = 0; i < 3; i++) {\n        if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15) return false;\n        if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15) return false;\n    }\n    if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15) return false;\n    if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15) return false;\n    return true;\n}\n\nint numMagicSquaresInside(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int count = 0;\n    for (int r = 0; r + 2 < m; r++) {\n        for (int c = 0; c + 2 < n; c++) if (magicAt(grid, r, c)) count++;\n    }\n    return count;\n}`,
        csharp: `public static int NumMagicSquaresInside(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int count = 0;\n    for (int r = 0; r + 2 < m; r++)\n    {\n        for (int c = 0; c + 2 < n; c++) if (MagicAt(grid, r, c)) count++;\n    }\n    return count;\n}\n\nprivate static bool MagicAt(int[][] grid, int r, int c)\n{\n    var seen = new bool[10];\n    for (int i = 0; i < 3; i++)\n    {\n        for (int j = 0; j < 3; j++)\n        {\n            int v = grid[r + i][c + j];\n            if (v < 1 || v > 9 || seen[v]) return false;\n            seen[v] = true;\n        }\n    }\n    for (int i = 0; i < 3; i++)\n    {\n        if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15) return false;\n        if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15) return false;\n    }\n    if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15) return false;\n    if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15) return false;\n    return true;\n}`,
        go: `func numMagicSquaresInside(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tmagicAt := func(r, c int) bool {\n\t\tvar seen [10]bool\n\t\tfor i := 0; i < 3; i++ {\n\t\t\tfor j := 0; j < 3; j++ {\n\t\t\t\tv := grid[r+i][c+j]\n\t\t\t\tif v < 1 || v > 9 || seen[v] {\n\t\t\t\t\treturn false\n\t\t\t\t}\n\t\t\t\tseen[v] = true\n\t\t\t}\n\t\t}\n\t\tfor i := 0; i < 3; i++ {\n\t\t\tif grid[r+i][c]+grid[r+i][c+1]+grid[r+i][c+2] != 15 {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\tif grid[r][c+i]+grid[r+1][c+i]+grid[r+2][c+i] != 15 {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t\tif grid[r][c]+grid[r+1][c+1]+grid[r+2][c+2] != 15 {\n\t\t\treturn false\n\t\t}\n\t\tif grid[r][c+2]+grid[r+1][c+1]+grid[r+2][c] != 15 {\n\t\t\treturn false\n\t\t}\n\t\treturn true\n\t}\n\tcount := 0\n\tfor r := 0; r+2 < m; r++ {\n\t\tfor c := 0; c+2 < n; c++ {\n\t\t\tif magicAt(r, c) {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numMagicSquaresInside(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    fun magicAt(r: Int, c: Int): Boolean {\n        val seen = BooleanArray(10)\n        for (i in 0 until 3) {\n            for (j in 0 until 3) {\n                val v = grid[r + i][c + j]\n                if (v < 1 || v > 9 || seen[v]) return false\n                seen[v] = true\n            }\n        }\n        for (i in 0 until 3) {\n            if (grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15) return false\n            if (grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15) return false\n        }\n        if (grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15) return false\n        if (grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15) return false\n        return true\n    }\n    var count = 0\n    var r = 0\n    while (r + 2 < m) {\n        var c = 0\n        while (c + 2 < n) {\n            if (magicAt(r, c)) count++\n            c++\n        }\n        r++\n    }\n    return count\n}`,
        swift: `func numMagicSquaresInside(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    func magicAt(_ r: Int, _ c: Int) -> Bool {\n        var seen = [Bool](repeating: false, count: 10)\n        for i in 0..<3 {\n            for j in 0..<3 {\n                let v = grid[r + i][c + j]\n                if v < 1 || v > 9 || seen[v] { return false }\n                seen[v] = true\n            }\n        }\n        for i in 0..<3 {\n            if grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15 { return false }\n            if grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15 { return false }\n        }\n        if grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15 { return false }\n        if grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15 { return false }\n        return true\n    }\n    var count = 0\n    var r = 0\n    while r + 2 < m {\n        var c = 0\n        while c + 2 < n {\n            if magicAt(r, c) { count += 1 }\n            c += 1\n        }\n        r += 1\n    }\n    return count\n}`,
        rust: `fn numMagicSquaresInside(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let magic_at = |r: usize, c: usize| -> bool {\n        let mut seen = [false; 10];\n        for i in 0..3 {\n            for j in 0..3 {\n                let v = grid[r + i][c + j];\n                if v < 1 || v > 9 || seen[v as usize] {\n                    return false;\n                }\n                seen[v as usize] = true;\n            }\n        }\n        for i in 0..3 {\n            if grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15 {\n                return false;\n            }\n            if grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15 {\n                return false;\n            }\n        }\n        if grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15 {\n            return false;\n        }\n        if grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15 {\n            return false;\n        }\n        true\n    };\n    let mut count = 0;\n    if m >= 3 && n >= 3 {\n        for r in 0..=(m - 3) {\n            for c in 0..=(n - 3) {\n                if magic_at(r, c) {\n                    count += 1;\n                }\n            }\n        }\n    }\n    count\n}`,
        php: `function numMagicSquaresInside($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $magicAt = function($r, $c) use ($grid) {\n        $seen = array_fill(0, 10, false);\n        for ($i = 0; $i < 3; $i++) {\n            for ($j = 0; $j < 3; $j++) {\n                $v = $grid[$r + $i][$c + $j];\n                if ($v < 1 || $v > 9 || $seen[$v]) return false;\n                $seen[$v] = true;\n            }\n        }\n        for ($i = 0; $i < 3; $i++) {\n            if ($grid[$r + $i][$c] + $grid[$r + $i][$c + 1] + $grid[$r + $i][$c + 2] !== 15) return false;\n            if ($grid[$r][$c + $i] + $grid[$r + 1][$c + $i] + $grid[$r + 2][$c + $i] !== 15) return false;\n        }\n        if ($grid[$r][$c] + $grid[$r + 1][$c + 1] + $grid[$r + 2][$c + 2] !== 15) return false;\n        if ($grid[$r][$c + 2] + $grid[$r + 1][$c + 1] + $grid[$r + 2][$c] !== 15) return false;\n        return true;\n    };\n    $count = 0;\n    for ($r = 0; $r + 2 < $m; $r++) {\n        for ($c = 0; $c + 2 < $n; $c++) if ($magicAt($r, $c)) $count++;\n    }\n    return $count;\n}`,
        ruby: `def numMagicSquaresInside(grid)\n  m = grid.length\n  n = grid[0].length\n  magic = lambda do |r, c|\n    seen = Array.new(10, false)\n    (0...3).each do |i|\n      (0...3).each do |j|\n        v = grid[r + i][c + j]\n        return false if v < 1 || v > 9 || seen[v]\n        seen[v] = true\n      end\n    end\n    (0...3).each do |i|\n      return false if grid[r + i][c] + grid[r + i][c + 1] + grid[r + i][c + 2] != 15\n      return false if grid[r][c + i] + grid[r + 1][c + i] + grid[r + 2][c + i] != 15\n    end\n    return false if grid[r][c] + grid[r + 1][c + 1] + grid[r + 2][c + 2] != 15\n    return false if grid[r][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c] != 15\n    true\n  end\n  count = 0\n  r = 0\n  while r + 2 < m\n    c = 0\n    while c + 2 < n\n      count += 1 if magic.call(r, c)\n      c += 1\n    end\n    r += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Number of Corner Rectangles (LC 750) ────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const seen = Array.from({ length: n }, () => new Array(n).fill(0));
      let ans = 0;
      for (let i = 0; i < m; i++) {
        for (let j1 = 0; j1 < n; j1++) {
          if (grid[i][j1] !== 1) continue;
          for (let j2 = j1 + 1; j2 < n; j2++) {
            if (grid[i][j2] !== 1) continue;
            ans += seen[j1][j2];
            seen[j1][j2]++;
          }
        }
      }
      return ans;
    };
    return {
      slug: "number-of-corner-rectangles",
      title: "Number of Corner Rectangles",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Math", "Dynamic Programming", "Facebook", "Google", "Amazon"],
      signature: { funcName: "countCornerRectangles", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary grid, count the **corner rectangles**: four distinct cells holding `1` that form the corners of an axis-aligned rectangle. The rectangle must have positive width and height, but the cells in between may hold anything.",
        [
          { in: "grid = [[1,0,0,1,0],[0,0,1,0,1],[0,0,0,1,0],[1,0,1,0,1]]", out: "1", note: "Only one set of four 1s lines up as corners." },
          { in: "grid = [[1,1,1],[1,1,1],[1,1,1]]", out: "9", note: "Three column pairs, each shared by three row pairs." },
          { in: "grid = [[1,1,1,1]]", out: "0", note: "A single row cannot give a rectangle any height." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 200", "grid[i][j] is 0 or 1", "The number of 1s in the grid is at most 6000."]),
      hints: [
        "A rectangle is decided by a pair of rows and a pair of columns.",
        "Fix the pair of **columns**; then count the rows that hold a `1` in both.",
        "If `k` rows share a column pair, they contribute `k · (k - 1) / 2` rectangles.",
      ],
      editorial: explain({
        idea: "Every rectangle is determined by two columns and two rows. Sweep the rows, and for each pair of columns that the current row fills, add the number of earlier rows that also filled that pair.",
        steps: [
          "Keep a table `seen[j1][j2]` counting the rows processed so far with `1` in both columns.",
          "For each row, enumerate every pair `(j1 < j2)` of its 1-columns.",
          "Add `seen[j1][j2]` to the answer, then increment it.",
        ],
        why: "Adding before incrementing pairs the current row with each *earlier* row exactly once, so each rectangle is counted from its bottom row alone — no factor-of-two correction and no double counting. The running sum is the same `k · (k - 1) / 2` the hint describes, accumulated incrementally.",
        time: "O(m · n²) in the worst case, and O(Σ ones_per_row²) in practice",
        space: "O(n²)",
        pitfalls: [
          "Counting each rectangle from both of its rows doubles the answer.",
          "The pair must be ordered (`j1 < j2`) or every rectangle is counted twice again.",
          "Enumerating all four corners directly is `O(m² · n²)` and far too slow.",
        ],
      }),
      examples: [
        { input: "[[1,0,0,1,0],[0,0,1,0,1],[0,0,0,1,0],[1,0,1,0,1]]", expectedOutput: "1" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]", expectedOutput: "9" },
        { input: "[[1,1,1,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8), n = ri(rng, 1, 8);
        const p = pick(rng, [0.3, 0.5, 0.75]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countCornerRectangles(grid: List[List[int]]) -> int:\n    n = len(grid[0])\n    seen = [[0] * n for _ in range(n)]\n    ans = 0\n    for row in grid:\n        ones = [j for j in range(n) if row[j] == 1]\n        for a in range(len(ones)):\n            for b in range(a + 1, len(ones)):\n                j1, j2 = ones[a], ones[b]\n                ans += seen[j1][j2]\n                seen[j1][j2] += 1\n    return ans`,
        javascript: `var countCornerRectangles = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j;\n    var seen = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        seen.push(row);\n    }\n    var ans = 0;\n    for (i = 0; i < m; i++) {\n        for (var j1 = 0; j1 < n; j1++) {\n            if (grid[i][j1] !== 1) continue;\n            for (var j2 = j1 + 1; j2 < n; j2++) {\n                if (grid[i][j2] !== 1) continue;\n                ans += seen[j1][j2];\n                seen[j1][j2]++;\n            }\n        }\n    }\n    return ans;\n};`,
        typescript: `function countCornerRectangles(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, i: number, j: number;\n    var seen: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        seen.push(row);\n    }\n    var ans = 0;\n    for (i = 0; i < m; i++) {\n        for (var j1 = 0; j1 < n; j1++) {\n            if (grid[i][j1] !== 1) continue;\n            for (var j2 = j1 + 1; j2 < n; j2++) {\n                if (grid[i][j2] !== 1) continue;\n                ans += seen[j1][j2];\n                seen[j1][j2]++;\n            }\n        }\n    }\n    return ans;\n}`,
        java: `public static int countCornerRectangles(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[][] seen = new int[n][n];\n    int ans = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j1 = 0; j1 < n; j1++) {\n            if (grid[i][j1] != 1) continue;\n            for (int j2 = j1 + 1; j2 < n; j2++) {\n                if (grid[i][j2] != 1) continue;\n                ans += seen[j1][j2];\n                seen[j1][j2]++;\n            }\n        }\n    }\n    return ans;\n}`,
        cpp: `int countCornerRectangles(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<int>> seen(n, vector<int>(n, 0));\n    int ans = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j1 = 0; j1 < n; j1++) {\n            if (grid[i][j1] != 1) continue;\n            for (int j2 = j1 + 1; j2 < n; j2++) {\n                if (grid[i][j2] != 1) continue;\n                ans += seen[j1][j2];\n                seen[j1][j2]++;\n            }\n        }\n    }\n    return ans;\n}`,
        c: `int countCornerRectangles(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int* seen = (int*) calloc((size_t) n * (size_t) n, sizeof(int));\n    int ans = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j1 = 0; j1 < n; j1++) {\n            if (grid[i][j1] != 1) continue;\n            for (int j2 = j1 + 1; j2 < n; j2++) {\n                if (grid[i][j2] != 1) continue;\n                ans += seen[j1 * n + j2];\n                seen[j1 * n + j2]++;\n            }\n        }\n    }\n    free(seen);\n    return ans;\n}`,
        csharp: `public static int CountCornerRectangles(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var seen = new int[n, n];\n    int ans = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j1 = 0; j1 < n; j1++)\n        {\n            if (grid[i][j1] != 1) continue;\n            for (int j2 = j1 + 1; j2 < n; j2++)\n            {\n                if (grid[i][j2] != 1) continue;\n                ans += seen[j1, j2];\n                seen[j1, j2]++;\n            }\n        }\n    }\n    return ans;\n}`,
        go: `func countCornerRectangles(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tseen := make([][]int, n)\n\tfor i := range seen {\n\t\tseen[i] = make([]int, n)\n\t}\n\tans := 0\n\tfor i := 0; i < m; i++ {\n\t\tfor j1 := 0; j1 < n; j1++ {\n\t\t\tif grid[i][j1] != 1 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfor j2 := j1 + 1; j2 < n; j2++ {\n\t\t\t\tif grid[i][j2] != 1 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tans += seen[j1][j2]\n\t\t\t\tseen[j1][j2]++\n\t\t\t}\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun countCornerRectangles(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val seen = Array(n) { IntArray(n) }\n    var ans = 0\n    for (i in 0 until m) {\n        for (j1 in 0 until n) {\n            if (grid[i][j1] != 1) continue\n            for (j2 in j1 + 1 until n) {\n                if (grid[i][j2] != 1) continue\n                ans += seen[j1][j2]\n                seen[j1][j2]++\n            }\n        }\n    }\n    return ans\n}`,
        swift: `func countCornerRectangles(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var seen = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    var ans = 0\n    for i in 0..<m {\n        for j1 in 0..<n {\n            if grid[i][j1] != 1 { continue }\n            var j2 = j1 + 1\n            while j2 < n {\n                if grid[i][j2] == 1 {\n                    ans += seen[j1][j2]\n                    seen[j1][j2] += 1\n                }\n                j2 += 1\n            }\n        }\n    }\n    return ans\n}`,
        rust: `fn countCornerRectangles(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut seen = vec![vec![0i32; n]; n];\n    let mut ans = 0i32;\n    for i in 0..m {\n        for j1 in 0..n {\n            if grid[i][j1] != 1 {\n                continue;\n            }\n            for j2 in (j1 + 1)..n {\n                if grid[i][j2] != 1 {\n                    continue;\n                }\n                ans += seen[j1][j2];\n                seen[j1][j2] += 1;\n            }\n        }\n    }\n    ans\n}`,
        php: `function countCornerRectangles($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $seen = [];\n    for ($i = 0; $i < $n; $i++) $seen[$i] = array_fill(0, $n, 0);\n    $ans = 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j1 = 0; $j1 < $n; $j1++) {\n            if ($grid[$i][$j1] !== 1) continue;\n            for ($j2 = $j1 + 1; $j2 < $n; $j2++) {\n                if ($grid[$i][$j2] !== 1) continue;\n                $ans += $seen[$j1][$j2];\n                $seen[$j1][$j2]++;\n            }\n        }\n    }\n    return $ans;\n}`,
        ruby: `def countCornerRectangles(grid)\n  m = grid.length\n  n = grid[0].length\n  seen = Array.new(n) { Array.new(n, 0) }\n  ans = 0\n  (0...m).each do |i|\n    (0...n).each do |j1|\n      next if grid[i][j1] != 1\n      ((j1 + 1)...n).each do |j2|\n        next if grid[i][j2] != 1\n        ans += seen[j1][j2]\n        seen[j1][j2] += 1\n      end\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Remove All Ones With Row and Column Flips (LC 2128) ─────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      for (let i = 1; i < m; i++) {
        const same = grid[i][0] === grid[0][0];
        for (let j = 0; j < n; j++) {
          if ((grid[i][j] === grid[0][j]) !== same) return false;
        }
      }
      return true;
    };
    return {
      slug: "remove-all-ones-with-row-and-column-flips",
      title: "Remove All Ones With Row and Column Flips",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Bit Manipulation", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "removeOnes", params: [{ name: "grid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "A binary grid is given. In one operation you may pick **any row** or **any column** and flip every cell in it (`0` becomes `1` and `1` becomes `0`).\n\nReturn `true` if some sequence of operations can turn the whole grid into zeros.",
        [
          { in: "grid = [[0,1,0],[1,0,1],[0,1,0]]", out: "true", note: "Flip the middle row, then the middle column, then the middle row again." },
          { in: "grid = [[1,1,0],[0,0,0],[0,0,0]]", out: "false" },
          { in: "grid = [[0]]", out: "true", note: "Already all zeros." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is 0 or 1"]),
      hints: [
        "Flips commute, and flipping the same line twice undoes itself, so only the *parity* of each row and column flip matters.",
        "Compare every row with the first row.",
        "Each row must be either identical to the first or its exact complement.",
      ],
      editorial: explain({
        idea: "Since flips commute and are self-inverse, the answer depends only on which rows and which columns get flipped an odd number of times. That forces every row to be either equal to row 0 or its complement.",
        steps: [
          "For each row `i > 0`, look at whether `grid[i][0]` matches `grid[0][0]`.",
          "Require the same relationship (match or mismatch) in every column of that row.",
          "If any row is neither a copy nor a complement of row 0, return false; otherwise true.",
        ],
        why: "Let `r_i` and `c_j` be the flip parities. Clearing the grid means `grid[i][j] XOR r_i XOR c_j = 0` for every cell, so `grid[i][j] = r_i XOR c_j`. Fixing `r_0 = 0` determines `c_j = grid[0][j]`, and then row `i` is forced to be row 0 XOR `r_i` — exactly \"equal or complemented\". Conversely, any grid of that shape is cleared by those parities, so the condition is both necessary and sufficient.",
        time: "O(m · n)",
        space: "O(1)",
        pitfalls: [
          "Simulating flips and searching is exponential; the algebra collapses it to one pass.",
          "Rows must be *uniformly* equal or *uniformly* complemented — a mix fails.",
          "A single row or a single column grid is always clearable.",
        ],
      }),
      examples: [
        { input: "[[0,1,0],[1,0,1],[0,1,0]]", expectedOutput: "true" },
        { input: "[[1,1,0],[0,0,0],[0,0,0]]", expectedOutput: "false" },
        { input: "[[0]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        let grid: number[][];
        if (rng() < 0.5) {
          // Build a clearable grid from row/column parities, then sometimes
          // break one cell so both answers show up.
          const r = Array.from({ length: m }, () => ri(rng, 0, 1));
          const c = Array.from({ length: n }, () => ri(rng, 0, 1));
          grid = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => r[i] ^ c[j]));
          if (rng() < 0.4) {
            const bi = ri(rng, 0, m - 1), bj = ri(rng, 0, n - 1);
            grid[bi][bj] ^= 1;
          }
        } else {
          grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, 1)));
        }
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef removeOnes(grid: List[List[int]]) -> bool:\n    m, n = len(grid), len(grid[0])\n    for i in range(1, m):\n        same = grid[i][0] == grid[0][0]\n        for j in range(n):\n            if (grid[i][j] == grid[0][j]) != same:\n                return False\n    return True`,
        javascript: `var removeOnes = function(grid) {\n    var m = grid.length, n = grid[0].length;\n    for (var i = 1; i < m; i++) {\n        var same = grid[i][0] === grid[0][0];\n        for (var j = 0; j < n; j++) {\n            if ((grid[i][j] === grid[0][j]) !== same) return false;\n        }\n    }\n    return true;\n};`,
        typescript: `function removeOnes(grid: number[][]): boolean {\n    var m = grid.length, n = grid[0].length;\n    for (var i = 1; i < m; i++) {\n        var same = grid[i][0] === grid[0][0];\n        for (var j = 0; j < n; j++) {\n            if ((grid[i][j] === grid[0][j]) !== same) return false;\n        }\n    }\n    return true;\n}`,
        java: `public static boolean removeOnes(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    for (int i = 1; i < m; i++) {\n        boolean same = grid[i][0] == grid[0][0];\n        for (int j = 0; j < n; j++) {\n            if ((grid[i][j] == grid[0][j]) != same) return false;\n        }\n    }\n    return true;\n}`,
        cpp: `bool removeOnes(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    for (int i = 1; i < m; i++) {\n        bool same = grid[i][0] == grid[0][0];\n        for (int j = 0; j < n; j++) {\n            if ((grid[i][j] == grid[0][j]) != same) return false;\n        }\n    }\n    return true;\n}`,
        c: `bool removeOnes(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    for (int i = 1; i < m; i++) {\n        bool same = grid[i][0] == grid[0][0];\n        for (int j = 0; j < n; j++) {\n            bool eq = grid[i][j] == grid[0][j];\n            if (eq != same) return false;\n        }\n    }\n    return true;\n}`,
        csharp: `public static bool RemoveOnes(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    for (int i = 1; i < m; i++)\n    {\n        bool same = grid[i][0] == grid[0][0];\n        for (int j = 0; j < n; j++)\n        {\n            if ((grid[i][j] == grid[0][j]) != same) return false;\n        }\n    }\n    return true;\n}`,
        go: `func removeOnes(grid [][]int) bool {\n\tm, n := len(grid), len(grid[0])\n\tfor i := 1; i < m; i++ {\n\t\tsame := grid[i][0] == grid[0][0]\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif (grid[i][j] == grid[0][j]) != same {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun removeOnes(grid: Array<IntArray>): Boolean {\n    val m = grid.size\n    val n = grid[0].size\n    for (i in 1 until m) {\n        val same = grid[i][0] == grid[0][0]\n        for (j in 0 until n) {\n            if ((grid[i][j] == grid[0][j]) != same) return false\n        }\n    }\n    return true\n}`,
        swift: `func removeOnes(_ grid: [[Int]]) -> Bool {\n    let m = grid.count\n    let n = grid[0].count\n    if m < 2 { return true }\n    for i in 1..<m {\n        let same = grid[i][0] == grid[0][0]\n        for j in 0..<n {\n            if (grid[i][j] == grid[0][j]) != same { return false }\n        }\n    }\n    return true\n}`,
        rust: `fn removeOnes(grid: Vec<Vec<i32>>) -> bool {\n    let m = grid.len();\n    let n = grid[0].len();\n    for i in 1..m {\n        let same = grid[i][0] == grid[0][0];\n        for j in 0..n {\n            if (grid[i][j] == grid[0][j]) != same {\n                return false;\n            }\n        }\n    }\n    true\n}`,
        php: `function removeOnes($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    for ($i = 1; $i < $m; $i++) {\n        $same = $grid[$i][0] === $grid[0][0];\n        for ($j = 0; $j < $n; $j++) {\n            if (($grid[$i][$j] === $grid[0][$j]) !== $same) return false;\n        }\n    }\n    return true;\n}`,
        ruby: `def removeOnes(grid)\n  m = grid.length\n  n = grid[0].length\n  (1...m).each do |i|\n    same = grid[i][0] == grid[0][0]\n    (0...n).each do |j|\n      return false if (grid[i][j] == grid[0][j]) != same\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Largest Plus Sign (LC 764) ──────────────────────────────────
  (() => {
    const ref = (n: number, mines: number[][]) => {
      const dp = Array.from({ length: n }, () => new Array(n).fill(n));
      const blocked = Array.from({ length: n }, () => new Array(n).fill(false));
      for (let k = 0; k < mines.length; k++) blocked[mines[k][0]][mines[k][1]] = true;
      for (let i = 0; i < n; i++) {
        let cnt = 0;
        for (let j = 0; j < n; j++) {
          cnt = blocked[i][j] ? 0 : cnt + 1;
          if (cnt < dp[i][j]) dp[i][j] = cnt;
        }
        cnt = 0;
        for (let j = n - 1; j >= 0; j--) {
          cnt = blocked[i][j] ? 0 : cnt + 1;
          if (cnt < dp[i][j]) dp[i][j] = cnt;
        }
      }
      for (let j = 0; j < n; j++) {
        let cnt = 0;
        for (let i = 0; i < n; i++) {
          cnt = blocked[i][j] ? 0 : cnt + 1;
          if (cnt < dp[i][j]) dp[i][j] = cnt;
        }
        cnt = 0;
        for (let i = n - 1; i >= 0; i--) {
          cnt = blocked[i][j] ? 0 : cnt + 1;
          if (cnt < dp[i][j]) dp[i][j] = cnt;
        }
      }
      let best = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (dp[i][j] > best) best = dp[i][j];
      return best;
    };
    return {
      slug: "largest-plus-sign",
      title: "Largest Plus Sign",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Google", "Amazon", "Uber"],
      signature: { funcName: "orderOfLargestPlusSign", params: [{ name: "n", type: "int" as const }, { name: "mines", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Start with an `n × n` grid of `1`s, then set every cell listed in `mines` to `0`.\n\nA **plus sign of order k** centred at a cell consists of that cell plus `k - 1` consecutive `1`s going up, down, left and right from it — all inside the grid. Return the order of the largest plus sign of `1`s, or `0` if none exists.",
        [
          { in: "n = 5, mines = [[4,2]]", out: "2", note: "A plus of order 2 fits; order 3 would need arms of length 2 that the mine blocks." },
          { in: "n = 1, mines = [[0,0]]", out: "0", note: "The only cell is a mine." },
          { in: "n = 3, mines = [[0,0]]", out: "2", note: "The centre cell has clear arms of length 1 in all four directions." },
        ],
        ["1 <= n <= 500", "1 <= mines.length <= 5000", "0 <= mines[i][0], mines[i][1] < n", "All the pairs in mines are unique."]),
      hints: [
        "The order at a cell is the shortest of its four runs of consecutive `1`s.",
        "Each of the four run lengths can be filled in with one linear sweep per row or column.",
        "Take the minimum of the four at every cell, then the maximum over the grid.",
      ],
      editorial: explain({
        idea: "For each cell compute how many consecutive `1`s extend left, right, up and down, including the cell itself. The plus order centred there is the smallest of those four; the answer is the largest such value.",
        steps: [
          "Mark the mines in an `n × n` grid and start `dp` at `n` everywhere.",
          "Sweep each row left-to-right and right-to-left, keeping a run length that resets to 0 at a mine, and take the minimum into `dp`.",
          "Do the same down and up each column.",
          "Return the maximum entry of `dp`.",
        ],
        why: "The four sweeps are independent, and `min` is applied in place, so after all four `dp[i][j]` holds exactly the shortest arm. That is precisely the largest order centred there — an arm one longer would run into a mine or the border — and the maximum over all centres answers the question. Four O(n²) passes replace the O(n³) of measuring each arm on demand.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "The run length includes the centre cell, so a lone `1` has order 1.",
          "All four directions must be swept; three is not enough.",
          "Initialising `dp` to `n` matters — the minimum is taken, not the maximum.",
        ],
      }),
      examples: [
        { input: "5\n[[4,2]]", expectedOutput: "2" },
        { input: "1\n[[0,0]]", expectedOutput: "0" },
        { input: "3\n[[0,0]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const count = ri(rng, 1, Math.max(1, Math.floor((n * n) / 2)));
        const taken = new Set<number>();
        const mines: number[][] = [];
        for (let k = 0; k < count; k++) {
          const r = ri(rng, 0, n - 1), c = ri(rng, 0, n - 1);
          const key = r * n + c;
          if (taken.has(key)) continue;
          taken.add(key);
          mines.push([r, c]);
        }
        return { input: `${n}\n${fmtIntMat(mines)}`, expectedOutput: String(ref(n, mines)) };
      },
      solutions: {
        python: `from typing import List\n\ndef orderOfLargestPlusSign(n: int, mines: List[List[int]]) -> int:\n    blocked = [[False] * n for _ in range(n)]\n    for r, c in mines:\n        blocked[r][c] = True\n    dp = [[n] * n for _ in range(n)]\n    for i in range(n):\n        cnt = 0\n        for j in range(n):\n            cnt = 0 if blocked[i][j] else cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        cnt = 0\n        for j in range(n - 1, -1, -1):\n            cnt = 0 if blocked[i][j] else cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n    for j in range(n):\n        cnt = 0\n        for i in range(n):\n            cnt = 0 if blocked[i][j] else cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        cnt = 0\n        for i in range(n - 1, -1, -1):\n            cnt = 0 if blocked[i][j] else cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n    return max(max(row) for row in dp)`,
        javascript: `var orderOfLargestPlusSign = function(n, mines) {\n    var i, j, cnt;\n    var blocked = [], dp = [];\n    for (i = 0; i < n; i++) {\n        var b = [], d = [];\n        for (j = 0; j < n; j++) { b.push(false); d.push(n); }\n        blocked.push(b);\n        dp.push(d);\n    }\n    for (i = 0; i < mines.length; i++) blocked[mines[i][0]][mines[i][1]] = true;\n    for (i = 0; i < n; i++) {\n        cnt = 0;\n        for (j = 0; j < n; j++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n        cnt = 0;\n        for (j = n - 1; j >= 0; j--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n    }\n    for (j = 0; j < n; j++) {\n        cnt = 0;\n        for (i = 0; i < n; i++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n        cnt = 0;\n        for (i = n - 1; i >= 0; i--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n    }\n    var best = 0;\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) if (dp[i][j] > best) best = dp[i][j];\n    }\n    return best;\n};`,
        typescript: `function orderOfLargestPlusSign(n: number, mines: number[][]): number {\n    var i: number, j: number, cnt: number;\n    var blocked: boolean[][] = [], dp: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var b: boolean[] = [], d: number[] = [];\n        for (j = 0; j < n; j++) { b.push(false); d.push(n); }\n        blocked.push(b);\n        dp.push(d);\n    }\n    for (i = 0; i < mines.length; i++) blocked[mines[i][0]][mines[i][1]] = true;\n    for (i = 0; i < n; i++) {\n        cnt = 0;\n        for (j = 0; j < n; j++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n        cnt = 0;\n        for (j = n - 1; j >= 0; j--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n    }\n    for (j = 0; j < n; j++) {\n        cnt = 0;\n        for (i = 0; i < n; i++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n        cnt = 0;\n        for (i = n - 1; i >= 0; i--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            if (cnt < dp[i][j]) dp[i][j] = cnt;\n        }\n    }\n    var best = 0;\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) if (dp[i][j] > best) best = dp[i][j];\n    }\n    return best;\n}`,
        java: `public static int orderOfLargestPlusSign(int n, int[][] mines) {\n    boolean[][] blocked = new boolean[n][n];\n    int[][] dp = new int[n][n];\n    for (int[] row : dp) Arrays.fill(row, n);\n    for (int[] mine : mines) blocked[mine[0]][mine[1]] = true;\n    for (int i = 0; i < n; i++) {\n        int cnt = 0;\n        for (int j = 0; j < n; j++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = Math.min(dp[i][j], cnt);\n        }\n        cnt = 0;\n        for (int j = n - 1; j >= 0; j--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = Math.min(dp[i][j], cnt);\n        }\n    }\n    for (int j = 0; j < n; j++) {\n        int cnt = 0;\n        for (int i = 0; i < n; i++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = Math.min(dp[i][j], cnt);\n        }\n        cnt = 0;\n        for (int i = n - 1; i >= 0; i--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = Math.min(dp[i][j], cnt);\n        }\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) best = Math.max(best, dp[i][j]);\n    }\n    return best;\n}`,
        cpp: `int orderOfLargestPlusSign(int n, vector<vector<int>>& mines) {\n    vector<vector<char>> blocked(n, vector<char>(n, 0));\n    vector<vector<int>> dp(n, vector<int>(n, n));\n    for (auto& mine : mines) blocked[mine[0]][mine[1]] = 1;\n    for (int i = 0; i < n; i++) {\n        int cnt = 0;\n        for (int j = 0; j < n; j++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = min(dp[i][j], cnt);\n        }\n        cnt = 0;\n        for (int j = n - 1; j >= 0; j--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = min(dp[i][j], cnt);\n        }\n    }\n    for (int j = 0; j < n; j++) {\n        int cnt = 0;\n        for (int i = 0; i < n; i++) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = min(dp[i][j], cnt);\n        }\n        cnt = 0;\n        for (int i = n - 1; i >= 0; i--) {\n            cnt = blocked[i][j] ? 0 : cnt + 1;\n            dp[i][j] = min(dp[i][j], cnt);\n        }\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) best = max(best, dp[i][j]);\n    }\n    return best;\n}`,
        c: `int orderOfLargestPlusSign(int n, int** mines, int minesSize, int* minesColSize) {\n    (void) minesColSize;\n    char* blocked = (char*) calloc((size_t) n * (size_t) n, 1);\n    int* dp = (int*) malloc((size_t) n * (size_t) n * sizeof(int));\n    for (int k = 0; k < n * n; k++) dp[k] = n;\n    for (int k = 0; k < minesSize; k++) blocked[mines[k][0] * n + mines[k][1]] = 1;\n    for (int i = 0; i < n; i++) {\n        int cnt = 0;\n        for (int j = 0; j < n; j++) {\n            cnt = blocked[i * n + j] ? 0 : cnt + 1;\n            if (cnt < dp[i * n + j]) dp[i * n + j] = cnt;\n        }\n        cnt = 0;\n        for (int j = n - 1; j >= 0; j--) {\n            cnt = blocked[i * n + j] ? 0 : cnt + 1;\n            if (cnt < dp[i * n + j]) dp[i * n + j] = cnt;\n        }\n    }\n    for (int j = 0; j < n; j++) {\n        int cnt = 0;\n        for (int i = 0; i < n; i++) {\n            cnt = blocked[i * n + j] ? 0 : cnt + 1;\n            if (cnt < dp[i * n + j]) dp[i * n + j] = cnt;\n        }\n        cnt = 0;\n        for (int i = n - 1; i >= 0; i--) {\n            cnt = blocked[i * n + j] ? 0 : cnt + 1;\n            if (cnt < dp[i * n + j]) dp[i * n + j] = cnt;\n        }\n    }\n    int best = 0;\n    for (int k = 0; k < n * n; k++) if (dp[k] > best) best = dp[k];\n    free(blocked);\n    free(dp);\n    return best;\n}`,
        csharp: `public static int OrderOfLargestPlusSign(int n, int[][] mines)\n{\n    var blocked = new bool[n, n];\n    var dp = new int[n, n];\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++) dp[i, j] = n;\n    }\n    foreach (var mine in mines) blocked[mine[0], mine[1]] = true;\n    for (int i = 0; i < n; i++)\n    {\n        int cnt = 0;\n        for (int j = 0; j < n; j++)\n        {\n            cnt = blocked[i, j] ? 0 : cnt + 1;\n            dp[i, j] = Math.Min(dp[i, j], cnt);\n        }\n        cnt = 0;\n        for (int j = n - 1; j >= 0; j--)\n        {\n            cnt = blocked[i, j] ? 0 : cnt + 1;\n            dp[i, j] = Math.Min(dp[i, j], cnt);\n        }\n    }\n    for (int j = 0; j < n; j++)\n    {\n        int cnt = 0;\n        for (int i = 0; i < n; i++)\n        {\n            cnt = blocked[i, j] ? 0 : cnt + 1;\n            dp[i, j] = Math.Min(dp[i, j], cnt);\n        }\n        cnt = 0;\n        for (int i = n - 1; i >= 0; i--)\n        {\n            cnt = blocked[i, j] ? 0 : cnt + 1;\n            dp[i, j] = Math.Min(dp[i, j], cnt);\n        }\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++) best = Math.Max(best, dp[i, j]);\n    }\n    return best;\n}`,
        go: `func orderOfLargestPlusSign(n int, mines [][]int) int {\n\tblocked := make([][]bool, n)\n\tdp := make([][]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tblocked[i] = make([]bool, n)\n\t\tdp[i] = make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tdp[i][j] = n\n\t\t}\n\t}\n\tfor _, mine := range mines {\n\t\tblocked[mine[0]][mine[1]] = true\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tcnt := 0\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif blocked[i][j] {\n\t\t\t\tcnt = 0\n\t\t\t} else {\n\t\t\t\tcnt++\n\t\t\t}\n\t\t\tif cnt < dp[i][j] {\n\t\t\t\tdp[i][j] = cnt\n\t\t\t}\n\t\t}\n\t\tcnt = 0\n\t\tfor j := n - 1; j >= 0; j-- {\n\t\t\tif blocked[i][j] {\n\t\t\t\tcnt = 0\n\t\t\t} else {\n\t\t\t\tcnt++\n\t\t\t}\n\t\t\tif cnt < dp[i][j] {\n\t\t\t\tdp[i][j] = cnt\n\t\t\t}\n\t\t}\n\t}\n\tfor j := 0; j < n; j++ {\n\t\tcnt := 0\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif blocked[i][j] {\n\t\t\t\tcnt = 0\n\t\t\t} else {\n\t\t\t\tcnt++\n\t\t\t}\n\t\t\tif cnt < dp[i][j] {\n\t\t\t\tdp[i][j] = cnt\n\t\t\t}\n\t\t}\n\t\tcnt = 0\n\t\tfor i := n - 1; i >= 0; i-- {\n\t\t\tif blocked[i][j] {\n\t\t\t\tcnt = 0\n\t\t\t} else {\n\t\t\t\tcnt++\n\t\t\t}\n\t\t\tif cnt < dp[i][j] {\n\t\t\t\tdp[i][j] = cnt\n\t\t\t}\n\t\t}\n\t}\n\tbest := 0\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif dp[i][j] > best {\n\t\t\t\tbest = dp[i][j]\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun orderOfLargestPlusSign(n: Int, mines: Array<IntArray>): Int {\n    val blocked = Array(n) { BooleanArray(n) }\n    val dp = Array(n) { IntArray(n) { n } }\n    for (mine in mines) blocked[mine[0]][mine[1]] = true\n    for (i in 0 until n) {\n        var cnt = 0\n        for (j in 0 until n) {\n            cnt = if (blocked[i][j]) 0 else cnt + 1\n            if (cnt < dp[i][j]) dp[i][j] = cnt\n        }\n        cnt = 0\n        for (j in n - 1 downTo 0) {\n            cnt = if (blocked[i][j]) 0 else cnt + 1\n            if (cnt < dp[i][j]) dp[i][j] = cnt\n        }\n    }\n    for (j in 0 until n) {\n        var cnt = 0\n        for (i in 0 until n) {\n            cnt = if (blocked[i][j]) 0 else cnt + 1\n            if (cnt < dp[i][j]) dp[i][j] = cnt\n        }\n        cnt = 0\n        for (i in n - 1 downTo 0) {\n            cnt = if (blocked[i][j]) 0 else cnt + 1\n            if (cnt < dp[i][j]) dp[i][j] = cnt\n        }\n    }\n    var best = 0\n    for (i in 0 until n) {\n        for (j in 0 until n) if (dp[i][j] > best) best = dp[i][j]\n    }\n    return best\n}`,
        swift: `func orderOfLargestPlusSign(_ n: Int, _ mines: [[Int]]) -> Int {\n    var blocked = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)\n    var dp = [[Int]](repeating: [Int](repeating: n, count: n), count: n)\n    for mine in mines { blocked[mine[0]][mine[1]] = true }\n    for i in 0..<n {\n        var cnt = 0\n        for j in 0..<n {\n            cnt = blocked[i][j] ? 0 : cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        }\n        cnt = 0\n        for j in stride(from: n - 1, through: 0, by: -1) {\n            cnt = blocked[i][j] ? 0 : cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        }\n    }\n    for j in 0..<n {\n        var cnt = 0\n        for i in 0..<n {\n            cnt = blocked[i][j] ? 0 : cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        }\n        cnt = 0\n        for i in stride(from: n - 1, through: 0, by: -1) {\n            cnt = blocked[i][j] ? 0 : cnt + 1\n            dp[i][j] = min(dp[i][j], cnt)\n        }\n    }\n    var best = 0\n    for i in 0..<n {\n        for j in 0..<n { best = max(best, dp[i][j]) }\n    }\n    return best\n}`,
        rust: `fn orderOfLargestPlusSign(n: i32, mines: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut blocked = vec![vec![false; n]; n];\n    let mut dp = vec![vec![n as i32; n]; n];\n    for mine in mines.iter() {\n        blocked[mine[0] as usize][mine[1] as usize] = true;\n    }\n    for i in 0..n {\n        let mut cnt = 0i32;\n        for j in 0..n {\n            cnt = if blocked[i][j] { 0 } else { cnt + 1 };\n            if cnt < dp[i][j] {\n                dp[i][j] = cnt;\n            }\n        }\n        cnt = 0;\n        for j in (0..n).rev() {\n            cnt = if blocked[i][j] { 0 } else { cnt + 1 };\n            if cnt < dp[i][j] {\n                dp[i][j] = cnt;\n            }\n        }\n    }\n    for j in 0..n {\n        let mut cnt = 0i32;\n        for i in 0..n {\n            cnt = if blocked[i][j] { 0 } else { cnt + 1 };\n            if cnt < dp[i][j] {\n                dp[i][j] = cnt;\n            }\n        }\n        cnt = 0;\n        for i in (0..n).rev() {\n            cnt = if blocked[i][j] { 0 } else { cnt + 1 };\n            if cnt < dp[i][j] {\n                dp[i][j] = cnt;\n            }\n        }\n    }\n    let mut best = 0i32;\n    for i in 0..n {\n        for j in 0..n {\n            if dp[i][j] > best {\n                best = dp[i][j];\n            }\n        }\n    }\n    best\n}`,
        php: `function orderOfLargestPlusSign($n, $mines) {\n    $blocked = [];\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) {\n        $blocked[$i] = array_fill(0, $n, false);\n        $dp[$i] = array_fill(0, $n, $n);\n    }\n    foreach ($mines as $mine) $blocked[$mine[0]][$mine[1]] = true;\n    for ($i = 0; $i < $n; $i++) {\n        $cnt = 0;\n        for ($j = 0; $j < $n; $j++) {\n            $cnt = $blocked[$i][$j] ? 0 : $cnt + 1;\n            if ($cnt < $dp[$i][$j]) $dp[$i][$j] = $cnt;\n        }\n        $cnt = 0;\n        for ($j = $n - 1; $j >= 0; $j--) {\n            $cnt = $blocked[$i][$j] ? 0 : $cnt + 1;\n            if ($cnt < $dp[$i][$j]) $dp[$i][$j] = $cnt;\n        }\n    }\n    for ($j = 0; $j < $n; $j++) {\n        $cnt = 0;\n        for ($i = 0; $i < $n; $i++) {\n            $cnt = $blocked[$i][$j] ? 0 : $cnt + 1;\n            if ($cnt < $dp[$i][$j]) $dp[$i][$j] = $cnt;\n        }\n        $cnt = 0;\n        for ($i = $n - 1; $i >= 0; $i--) {\n            $cnt = $blocked[$i][$j] ? 0 : $cnt + 1;\n            if ($cnt < $dp[$i][$j]) $dp[$i][$j] = $cnt;\n        }\n    }\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) if ($dp[$i][$j] > $best) $best = $dp[$i][$j];\n    }\n    return $best;\n}`,
        ruby: `def orderOfLargestPlusSign(n, mines)\n  blocked = Array.new(n) { Array.new(n, false) }\n  dp = Array.new(n) { Array.new(n, n) }\n  mines.each { |r, c| blocked[r][c] = true }\n  (0...n).each do |i|\n    cnt = 0\n    (0...n).each do |j|\n      cnt = blocked[i][j] ? 0 : cnt + 1\n      dp[i][j] = cnt if cnt < dp[i][j]\n    end\n    cnt = 0\n    (n - 1).downto(0) do |j|\n      cnt = blocked[i][j] ? 0 : cnt + 1\n      dp[i][j] = cnt if cnt < dp[i][j]\n    end\n  end\n  (0...n).each do |j|\n    cnt = 0\n    (0...n).each do |i|\n      cnt = blocked[i][j] ? 0 : cnt + 1\n      dp[i][j] = cnt if cnt < dp[i][j]\n    end\n    cnt = 0\n    (n - 1).downto(0) do |i|\n      cnt = blocked[i][j] ? 0 : cnt + 1\n      dp[i][j] = cnt if cnt < dp[i][j]\n    end\n  end\n  dp.map(&:max).max\nend`,
      },
    };
  })(),

  // ── Maximal Rectangle (LC 85) ───────────────────────────────────
  (() => {
    const ref = (matrix: string[]) => {
      const m = matrix.length, n = matrix[0].length;
      const heights = new Array(n + 1).fill(0);
      let best = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) heights[j] = matrix[i][j] === "1" ? heights[j] + 1 : 0;
        const stack: number[] = [];
        for (let j = 0; j <= n; j++) {
          while (stack.length > 0 && heights[stack[stack.length - 1]] >= heights[j]) {
            const h = heights[stack.pop() as number];
            const left = stack.length > 0 ? stack[stack.length - 1] : -1;
            const area = h * (j - left - 1);
            if (area > best) best = area;
          }
          stack.push(j);
        }
      }
      return best;
    };
    return {
      slug: "maximal-rectangle",
      title: "Maximal Rectangle",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Stack", "Dynamic Programming", "Monotonic Stack", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maximalRectangle", params: [{ name: "matrix", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A binary matrix is given as rows of the characters `0` and `1`. Find the largest rectangle made entirely of `1`s and return its **area**.",
        [
          { in: 'matrix = ["10100","10111","11111","10010"]', out: "6", note: "The 2 × 3 block of 1s in the middle two rows." },
          { in: 'matrix = ["0"]', out: "0" },
          { in: 'matrix = ["1"]', out: "1" },
        ],
        ["rows == matrix.length", "cols == matrix[i].length", "1 <= rows, cols <= 200", "matrix[i][j] is '0' or '1'"]),
      hints: [
        "Treat each row as the ground of a histogram whose bars are the runs of 1s ending at that row.",
        "Then the answer is the best \"largest rectangle in a histogram\" over all rows.",
        "Solve each histogram in linear time with a stack of increasing bar heights.",
      ],
      editorial: explain({
        idea: "Reduce the 2D problem to `rows` one-dimensional ones. For each row, `heights[j]` is the number of consecutive 1s ending at that row in column `j`; the largest all-1s rectangle whose bottom edge is that row is the largest rectangle in that histogram.",
        steps: [
          "Sweep rows, updating `heights[j]` to `heights[j] + 1` on a `1` and to `0` on a `0`.",
          "For each histogram, keep a stack of indices with increasing heights.",
          "When the incoming bar is not taller, pop: the popped bar's rectangle runs from just after the new stack top to just before the current index.",
          "A sentinel bar of height 0 past the end flushes the stack.",
        ],
        why: "Every all-1s rectangle has a bottom row, and within that row its height in each column is at most the run ending there — so it is counted by that row's histogram, and no rectangle is missed. The stack works because a bar is popped exactly when its right boundary is found, and its left boundary is the element below it, giving each bar's maximal span in O(1) amortised time.",
        time: "O(rows · cols)",
        space: "O(cols)",
        pitfalls: [
          "Resetting `heights[j]` to `0` on a `0` is what keeps the bars contiguous.",
          "Without the trailing sentinel the bars still on the stack are never measured.",
          "Popping on `>=` rather than `>` is safe here: equal bars give the same maximal area when the last of them is popped.",
        ],
      }),
      examples: [
        { input: '["10100","10111","11111","10010"]', expectedOutput: "6" },
        { input: '["0"]', expectedOutput: "0" },
        { input: '["1"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const p = pick(rng, [0.4, 0.6, 0.8]);
        const matrix = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => (rng() < p ? "1" : "0")).join(""));
        return { input: fmtStrArr(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximalRectangle(matrix: List[str]) -> int:\n    m, n = len(matrix), len(matrix[0])\n    heights = [0] * (n + 1)\n    best = 0\n    for i in range(m):\n        for j in range(n):\n            heights[j] = heights[j] + 1 if matrix[i][j] == '1' else 0\n        stack = []\n        for j in range(n + 1):\n            while stack and heights[stack[-1]] >= heights[j]:\n                h = heights[stack.pop()]\n                left = stack[-1] if stack else -1\n                best = max(best, h * (j - left - 1))\n            stack.append(j)\n    return best`,
        javascript: `var maximalRectangle = function(matrix) {\n    var m = matrix.length, n = matrix[0].length, i, j;\n    var heights = [];\n    for (j = 0; j <= n; j++) heights.push(0);\n    var best = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) heights[j] = matrix[i].charAt(j) === "1" ? heights[j] + 1 : 0;\n        var stack = [];\n        for (j = 0; j <= n; j++) {\n            while (stack.length > 0 && heights[stack[stack.length - 1]] >= heights[j]) {\n                var h = heights[stack.pop()];\n                var left = stack.length > 0 ? stack[stack.length - 1] : -1;\n                var area = h * (j - left - 1);\n                if (area > best) best = area;\n            }\n            stack.push(j);\n        }\n    }\n    return best;\n};`,
        typescript: `function maximalRectangle(matrix: string[]): number {\n    var m = matrix.length, n = matrix[0].length, i: number, j: number;\n    var heights: number[] = [];\n    for (j = 0; j <= n; j++) heights.push(0);\n    var best = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) heights[j] = matrix[i].charAt(j) === "1" ? heights[j] + 1 : 0;\n        var stack: number[] = [];\n        for (j = 0; j <= n; j++) {\n            while (stack.length > 0 && heights[stack[stack.length - 1]] >= heights[j]) {\n                var h = heights[stack.pop() as number];\n                var left = stack.length > 0 ? stack[stack.length - 1] : -1;\n                var area = h * (j - left - 1);\n                if (area > best) best = area;\n            }\n            stack.push(j);\n        }\n    }\n    return best;\n}`,
        java: `public static int maximalRectangle(String[] matrix) {\n    int m = matrix.length, n = matrix[0].length();\n    int[] heights = new int[n + 1];\n    int[] stack = new int[n + 2];\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            heights[j] = matrix[i].charAt(j) == '1' ? heights[j] + 1 : 0;\n        }\n        int top = 0;\n        for (int j = 0; j <= n; j++) {\n            while (top > 0 && heights[stack[top - 1]] >= heights[j]) {\n                int h = heights[stack[--top]];\n                int left = top > 0 ? stack[top - 1] : -1;\n                best = Math.max(best, h * (j - left - 1));\n            }\n            stack[top++] = j;\n        }\n    }\n    return best;\n}`,
        cpp: `int maximalRectangle(vector<string>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<int> heights(n + 1, 0);\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;\n        }\n        vector<int> stack;\n        for (int j = 0; j <= n; j++) {\n            while (!stack.empty() && heights[stack.back()] >= heights[j]) {\n                int h = heights[stack.back()];\n                stack.pop_back();\n                int left = stack.empty() ? -1 : stack.back();\n                best = max(best, h * (j - left - 1));\n            }\n            stack.push_back(j);\n        }\n    }\n    return best;\n}`,
        c: `int maximalRectangle(char** matrix, int matrixSize) {\n    int m = matrixSize, n = (int) strlen(matrix[0]);\n    int* heights = (int*) calloc((size_t) n + 1, sizeof(int));\n    int* stack = (int*) malloc((size_t) (n + 2) * sizeof(int));\n    int best = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;\n        }\n        int top = 0;\n        for (int j = 0; j <= n; j++) {\n            while (top > 0 && heights[stack[top - 1]] >= heights[j]) {\n                int h = heights[stack[--top]];\n                int left = top > 0 ? stack[top - 1] : -1;\n                int area = h * (j - left - 1);\n                if (area > best) best = area;\n            }\n            stack[top++] = j;\n        }\n    }\n    free(heights);\n    free(stack);\n    return best;\n}`,
        csharp: `public static int MaximalRectangle(string[] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    var heights = new int[n + 1];\n    var stack = new int[n + 2];\n    int best = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;\n        }\n        int top = 0;\n        for (int j = 0; j <= n; j++)\n        {\n            while (top > 0 && heights[stack[top - 1]] >= heights[j])\n            {\n                int h = heights[stack[--top]];\n                int left = top > 0 ? stack[top - 1] : -1;\n                best = Math.Max(best, h * (j - left - 1));\n            }\n            stack[top++] = j;\n        }\n    }\n    return best;\n}`,
        go: `func maximalRectangle(matrix []string) int {\n\tm, n := len(matrix), len(matrix[0])\n\theights := make([]int, n+1)\n\tbest := 0\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif matrix[i][j] == '1' {\n\t\t\t\theights[j]++\n\t\t\t} else {\n\t\t\t\theights[j] = 0\n\t\t\t}\n\t\t}\n\t\tstack := []int{}\n\t\tfor j := 0; j <= n; j++ {\n\t\t\tfor len(stack) > 0 && heights[stack[len(stack)-1]] >= heights[j] {\n\t\t\t\th := heights[stack[len(stack)-1]]\n\t\t\t\tstack = stack[:len(stack)-1]\n\t\t\t\tleft := -1\n\t\t\t\tif len(stack) > 0 {\n\t\t\t\t\tleft = stack[len(stack)-1]\n\t\t\t\t}\n\t\t\t\tif area := h * (j - left - 1); area > best {\n\t\t\t\t\tbest = area\n\t\t\t\t}\n\t\t\t}\n\t\t\tstack = append(stack, j)\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximalRectangle(matrix: Array<String>): Int {\n    val m = matrix.size\n    val n = matrix[0].length\n    val heights = IntArray(n + 1)\n    val stack = IntArray(n + 2)\n    var best = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            heights[j] = if (matrix[i][j] == '1') heights[j] + 1 else 0\n        }\n        var top = 0\n        for (j in 0..n) {\n            while (top > 0 && heights[stack[top - 1]] >= heights[j]) {\n                val h = heights[stack[--top]]\n                val left = if (top > 0) stack[top - 1] else -1\n                val area = h * (j - left - 1)\n                if (area > best) best = area\n            }\n            stack[top++] = j\n        }\n    }\n    return best\n}`,
        swift: `func maximalRectangle(_ matrix: [String]) -> Int {\n    let m = matrix.count\n    let rows = matrix.map { Array($0) }\n    let n = rows[0].count\n    var heights = [Int](repeating: 0, count: n + 1)\n    var best = 0\n    for i in 0..<m {\n        for j in 0..<n {\n            heights[j] = rows[i][j] == "1" ? heights[j] + 1 : 0\n        }\n        var stack = [Int]()\n        for j in 0...n {\n            while let last = stack.last, heights[last] >= heights[j] {\n                let h = heights[stack.removeLast()]\n                let left = stack.last ?? -1\n                best = max(best, h * (j - left - 1))\n            }\n            stack.append(j)\n        }\n    }\n    return best\n}`,
        rust: `fn maximalRectangle(matrix: Vec<String>) -> i32 {\n    let rows: Vec<Vec<u8>> = matrix.iter().map(|s| s.as_bytes().to_vec()).collect();\n    let m = rows.len();\n    let n = rows[0].len();\n    let mut heights = vec![0i32; n + 1];\n    let mut best = 0i32;\n    for i in 0..m {\n        for j in 0..n {\n            heights[j] = if rows[i][j] == b'1' { heights[j] + 1 } else { 0 };\n        }\n        let mut stack: Vec<usize> = Vec::new();\n        for j in 0..=n {\n            while let Some(&last) = stack.last() {\n                if heights[last] < heights[j] {\n                    break;\n                }\n                stack.pop();\n                let h = heights[last];\n                let left = match stack.last() {\n                    Some(&p) => p as i32,\n                    None => -1,\n                };\n                let area = h * (j as i32 - left - 1);\n                if area > best {\n                    best = area;\n                }\n            }\n            stack.push(j);\n        }\n    }\n    best\n}`,
        php: `function maximalRectangle($matrix) {\n    $m = count($matrix);\n    $n = strlen($matrix[0]);\n    $heights = array_fill(0, $n + 1, 0);\n    $best = 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            $heights[$j] = $matrix[$i][$j] === '1' ? $heights[$j] + 1 : 0;\n        }\n        $stack = [];\n        for ($j = 0; $j <= $n; $j++) {\n            while (count($stack) > 0 && $heights[$stack[count($stack) - 1]] >= $heights[$j]) {\n                $h = $heights[array_pop($stack)];\n                $left = count($stack) > 0 ? $stack[count($stack) - 1] : -1;\n                $area = $h * ($j - $left - 1);\n                if ($area > $best) $best = $area;\n            }\n            $stack[] = $j;\n        }\n    }\n    return $best;\n}`,
        ruby: `def maximalRectangle(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  heights = Array.new(n + 1, 0)\n  best = 0\n  (0...m).each do |i|\n    (0...n).each do |j|\n      heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0\n    end\n    stack = []\n    (0..n).each do |j|\n      while !stack.empty? && heights[stack[-1]] >= heights[j]\n        h = heights[stack.pop]\n        left = stack.empty? ? -1 : stack[-1]\n        area = h * (j - left - 1)\n        best = area if area > best\n      end\n      stack << j\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Increasing Path in a Matrix (LC 329) ────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      const outdeg = Array.from({ length: m }, () => new Array(n).fill(0));
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          for (let d = 0; d < 4; d++) {
            const nr = i + dr[d], nc = j + dc[d];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            if (matrix[nr][nc] > matrix[i][j]) outdeg[i][j]++;
          }
        }
      }
      let q: number[] = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (outdeg[i][j] === 0) q.push(i * n + j);
      let len = 0;
      while (q.length > 0) {
        len++;
        const nq: number[] = [];
        for (let k = 0; k < q.length; k++) {
          const r = Math.floor(q[k] / n), c = q[k] % n;
          for (let d = 0; d < 4; d++) {
            const nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            if (matrix[nr][nc] >= matrix[r][c]) continue;
            if (--outdeg[nr][nc] === 0) nq.push(nr * n + nc);
          }
        }
        q = nq;
      }
      return len;
    };
    return {
      slug: "longest-increasing-path-in-a-matrix",
      title: "Longest Increasing Path in a Matrix",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Depth-First Search", "Topological Sort", "Google", "Amazon", "Flipkart"],
      signature: { funcName: "longestIncreasingPath", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest **strictly increasing** path in a matrix. From a cell you may move up, down, left or right — never diagonally and never off the grid.",
        [
          { in: "matrix = [[9,9,4],[6,6,8],[2,1,1]]", out: "4", note: "The path `1 → 2 → 6 → 9`." },
          { in: "matrix = [[3,4,5],[3,2,6],[2,2,1]]", out: "4", note: "The path `3 → 4 → 5 → 6`; diagonal moves are not allowed." },
          { in: "matrix = [[1]]", out: "1" },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 200", "0 <= matrix[i][j] <= 2^31 - 1"]),
      hints: [
        "Draw an edge from each cell to its strictly larger neighbours. Because values strictly increase, this graph has no cycles.",
        "So the answer is the longest path in a DAG — memoise, or peel the graph layer by layer.",
        "Cells with no larger neighbour are the path endpoints; start there and work backwards.",
      ],
      editorial: explain({
        idea: "The strict increase makes the cell graph a DAG, so the longest path is well defined. Peel it like a topological sort: repeatedly strip the cells that have no larger neighbour left, counting the rounds.",
        steps: [
          "For each cell count `outdeg`, its number of strictly larger neighbours.",
          "Seed a queue with every cell of out-degree 0 — the possible path ends.",
          "Each round, remove the whole current layer and decrement the out-degree of every strictly smaller neighbour, enqueuing those that reach 0.",
          "The number of rounds is the answer.",
        ],
        why: "A cell can only be peeled once every cell it could step to has been peeled, so its round number is exactly one more than the longest path leaving it. The number of rounds is therefore the length of the longest path in the whole grid. This is also why the peel is iterative: a memoised DFS is equally correct but can recurse 40 000 deep on a 200 × 200 spiral.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Equal neighbours are not edges — the increase is strict — so plateaus never connect.",
          "Recomputing the path from every cell without memoising is exponential.",
          "The answer counts cells, so a 1 × 1 matrix answers 1, not 0.",
        ],
      }),
      examples: [
        { input: "[[9,9,4],[6,6,8],[2,1,1]]", expectedOutput: "4" },
        { input: "[[3,4,5],[3,2,6],[2,2,1]]", expectedOutput: "4" },
        { input: "[[1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const hi = pick(rng, [3, 8, 40]);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, hi)));
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef longestIncreasingPath(matrix: List[List[int]]) -> int:\n    m, n = len(matrix), len(matrix[0])\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    outdeg = [[0] * n for _ in range(m)]\n    for i in range(m):\n        for j in range(n):\n            for di, dj in dirs:\n                ni, nj = i + di, j + dj\n                if 0 <= ni < m and 0 <= nj < n and matrix[ni][nj] > matrix[i][j]:\n                    outdeg[i][j] += 1\n    q = deque((i, j) for i in range(m) for j in range(n) if outdeg[i][j] == 0)\n    length = 0\n    while q:\n        length += 1\n        for _ in range(len(q)):\n            r, c = q.popleft()\n            for di, dj in dirs:\n                nr, nc = r + di, c + dj\n                if 0 <= nr < m and 0 <= nc < n and matrix[nr][nc] < matrix[r][c]:\n                    outdeg[nr][nc] -= 1\n                    if outdeg[nr][nc] == 0:\n                        q.append((nr, nc))\n    return length`,
        javascript: `var longestIncreasingPath = function(matrix) {\n    var m = matrix.length, n = matrix[0].length, i, j, d;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var outdeg = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        outdeg.push(row);\n    }\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            for (d = 0; d < 4; d++) {\n                var ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i][j]++;\n            }\n        }\n    }\n    var q = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) if (outdeg[i][j] === 0) q.push(i * n + j);\n    }\n    var len = 0;\n    while (q.length > 0) {\n        len++;\n        var nq = [];\n        for (var k = 0; k < q.length; k++) {\n            var r = Math.floor(q[k] / n), c = q[k] % n;\n            for (d = 0; d < 4; d++) {\n                var nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                outdeg[nr][nc]--;\n                if (outdeg[nr][nc] === 0) nq.push(nr * n + nc);\n            }\n        }\n        q = nq;\n    }\n    return len;\n};`,
        typescript: `function longestIncreasingPath(matrix: number[][]): number {\n    var m = matrix.length, n = matrix[0].length, i: number, j: number, d: number;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var outdeg: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        outdeg.push(row);\n    }\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            for (d = 0; d < 4; d++) {\n                var ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i][j]++;\n            }\n        }\n    }\n    var q: number[] = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) if (outdeg[i][j] === 0) q.push(i * n + j);\n    }\n    var len = 0;\n    while (q.length > 0) {\n        len++;\n        var nq: number[] = [];\n        for (var k = 0; k < q.length; k++) {\n            var r = Math.floor(q[k] / n), c = q[k] % n;\n            for (d = 0; d < 4; d++) {\n                var nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                outdeg[nr][nc]--;\n                if (outdeg[nr][nc] === 0) nq.push(nr * n + nc);\n            }\n        }\n        q = nq;\n    }\n    return len;\n}`,
        java: `public static int longestIncreasingPath(int[][] matrix) {\n    int m = matrix.length, n = matrix[0].length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[][] outdeg = new int[m][n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            for (int d = 0; d < 4; d++) {\n                int ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i][j]++;\n            }\n        }\n    }\n    int[] q = new int[m * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) if (outdeg[i][j] == 0) q[tail++] = i * n + j;\n    }\n    int len = 0;\n    while (head < tail) {\n        len++;\n        int end = tail;\n        while (head < end) {\n            int r = q[head] / n, c = q[head] % n;\n            head++;\n            for (int d = 0; d < 4; d++) {\n                int nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                if (--outdeg[nr][nc] == 0) q[tail++] = nr * n + nc;\n            }\n        }\n    }\n    return len;\n}`,
        cpp: `int longestIncreasingPath(vector<vector<int>>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    vector<vector<int>> outdeg(m, vector<int>(n, 0));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            for (int d = 0; d < 4; d++) {\n                int ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i][j]++;\n            }\n        }\n    }\n    vector<int> q;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) if (outdeg[i][j] == 0) q.push_back(i * n + j);\n    }\n    size_t head = 0;\n    int len = 0;\n    while (head < q.size()) {\n        len++;\n        size_t end = q.size();\n        while (head < end) {\n            int r = q[head] / n, c = q[head] % n;\n            head++;\n            for (int d = 0; d < 4; d++) {\n                int nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                if (--outdeg[nr][nc] == 0) q.push_back(nr * n + nc);\n            }\n        }\n    }\n    return len;\n}`,
        c: `int longestIncreasingPath(int** matrix, int matrixSize, int* matrixColSize) {\n    int m = matrixSize, n = matrixColSize[0];\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int* outdeg = (int*) calloc((size_t) (m * n), sizeof(int));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            for (int d = 0; d < 4; d++) {\n                int ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i * n + j]++;\n            }\n        }\n    }\n    int* q = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) if (outdeg[i * n + j] == 0) q[tail++] = i * n + j;\n    }\n    int len = 0;\n    while (head < tail) {\n        len++;\n        int end = tail;\n        while (head < end) {\n            int r = q[head] / n, c = q[head] % n;\n            head++;\n            for (int d = 0; d < 4; d++) {\n                int nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                if (--outdeg[nr * n + nc] == 0) q[tail++] = nr * n + nc;\n            }\n        }\n    }\n    free(outdeg);\n    free(q);\n    return len;\n}`,
        csharp: `public static int LongestIncreasingPath(int[][] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var outdeg = new int[m, n];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            for (int d = 0; d < 4; d++)\n            {\n                int ni = i + dr[d], nj = j + dc[d];\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i, j]++;\n            }\n        }\n    }\n    var q = new int[m * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++) if (outdeg[i, j] == 0) q[tail++] = i * n + j;\n    }\n    int len = 0;\n    while (head < tail)\n    {\n        len++;\n        int end = tail;\n        while (head < end)\n        {\n            int r = q[head] / n, c = q[head] % n;\n            head++;\n            for (int d = 0; d < 4; d++)\n            {\n                int nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                if (matrix[nr][nc] >= matrix[r][c]) continue;\n                if (--outdeg[nr, nc] == 0) q[tail++] = nr * n + nc;\n            }\n        }\n    }\n    return len;\n}`,
        go: `func longestIncreasingPath(matrix [][]int) int {\n\tm, n := len(matrix), len(matrix[0])\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\toutdeg := make([][]int, m)\n\tfor i := range outdeg {\n\t\toutdeg[i] = make([]int, n)\n\t}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\tni, nj := i+dr[d], j+dc[d]\n\t\t\t\tif ni < 0 || ni >= m || nj < 0 || nj >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif matrix[ni][nj] > matrix[i][j] {\n\t\t\t\t\toutdeg[i][j]++\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\tq := []int{}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif outdeg[i][j] == 0 {\n\t\t\t\tq = append(q, i*n+j)\n\t\t\t}\n\t\t}\n\t}\n\thead, length := 0, 0\n\tfor head < len(q) {\n\t\tlength++\n\t\tend := len(q)\n\t\tfor head < end {\n\t\t\tr, c := q[head]/n, q[head]%n\n\t\t\thead++\n\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif matrix[nr][nc] >= matrix[r][c] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\toutdeg[nr][nc]--\n\t\t\t\tif outdeg[nr][nc] == 0 {\n\t\t\t\t\tq = append(q, nr*n+nc)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn length\n}`,
        kotlin: `fun longestIncreasingPath(matrix: Array<IntArray>): Int {\n    val m = matrix.size\n    val n = matrix[0].size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val outdeg = Array(m) { IntArray(n) }\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            for (d in 0 until 4) {\n                val ni = i + dr[d]\n                val nj = j + dc[d]\n                if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue\n                if (matrix[ni][nj] > matrix[i][j]) outdeg[i][j]++\n            }\n        }\n    }\n    val q = IntArray(m * n)\n    var head = 0\n    var tail = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) if (outdeg[i][j] == 0) q[tail++] = i * n + j\n    }\n    var len = 0\n    while (head < tail) {\n        len++\n        val end = tail\n        while (head < end) {\n            val r = q[head] / n\n            val c = q[head] % n\n            head++\n            for (d in 0 until 4) {\n                val nr = r + dr[d]\n                val nc = c + dc[d]\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                if (matrix[nr][nc] >= matrix[r][c]) continue\n                if (--outdeg[nr][nc] == 0) q[tail++] = nr * n + nc\n            }\n        }\n    }\n    return len\n}`,
        swift: `func longestIncreasingPath(_ matrix: [[Int]]) -> Int {\n    let m = matrix.count\n    let n = matrix[0].count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var outdeg = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n    for i in 0..<m {\n        for j in 0..<n {\n            for d in 0..<4 {\n                let ni = i + dr[d], nj = j + dc[d]\n                if ni < 0 || ni >= m || nj < 0 || nj >= n { continue }\n                if matrix[ni][nj] > matrix[i][j] { outdeg[i][j] += 1 }\n            }\n        }\n    }\n    var q = [Int]()\n    for i in 0..<m {\n        for j in 0..<n where outdeg[i][j] == 0 { q.append(i * n + j) }\n    }\n    var head = 0\n    var len = 0\n    while head < q.count {\n        len += 1\n        let end = q.count\n        while head < end {\n            let r = q[head] / n, c = q[head] % n\n            head += 1\n            for d in 0..<4 {\n                let nr = r + dr[d], nc = c + dc[d]\n                if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                if matrix[nr][nc] >= matrix[r][c] { continue }\n                outdeg[nr][nc] -= 1\n                if outdeg[nr][nc] == 0 { q.append(nr * n + nc) }\n            }\n        }\n    }\n    return len\n}`,
        rust: `fn longestIncreasingPath(matrix: Vec<Vec<i32>>) -> i32 {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut outdeg = vec![vec![0i32; n]; m];\n    for i in 0..m {\n        for j in 0..n {\n            for d in 0..4 {\n                let ni = i as i32 + dr[d];\n                let nj = j as i32 + dc[d];\n                if ni < 0 || ni >= m as i32 || nj < 0 || nj >= n as i32 {\n                    continue;\n                }\n                if matrix[ni as usize][nj as usize] > matrix[i][j] {\n                    outdeg[i][j] += 1;\n                }\n            }\n        }\n    }\n    let mut q: Vec<usize> = Vec::new();\n    for i in 0..m {\n        for j in 0..n {\n            if outdeg[i][j] == 0 {\n                q.push(i * n + j);\n            }\n        }\n    }\n    let mut head = 0usize;\n    let mut len = 0i32;\n    while head < q.len() {\n        len += 1;\n        let end = q.len();\n        while head < end {\n            let r = (q[head] / n) as i32;\n            let c = (q[head] % n) as i32;\n            head += 1;\n            for d in 0..4 {\n                let nr = r + dr[d];\n                let nc = c + dc[d];\n                if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                    continue;\n                }\n                if matrix[nr as usize][nc as usize] >= matrix[r as usize][c as usize] {\n                    continue;\n                }\n                outdeg[nr as usize][nc as usize] -= 1;\n                if outdeg[nr as usize][nc as usize] == 0 {\n                    q.push(nr as usize * n + nc as usize);\n                }\n            }\n        }\n    }\n    len\n}`,
        php: `function longestIncreasingPath($matrix) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $outdeg = [];\n    for ($i = 0; $i < $m; $i++) $outdeg[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            for ($d = 0; $d < 4; $d++) {\n                $ni = $i + $dr[$d];\n                $nj = $j + $dc[$d];\n                if ($ni < 0 || $ni >= $m || $nj < 0 || $nj >= $n) continue;\n                if ($matrix[$ni][$nj] > $matrix[$i][$j]) $outdeg[$i][$j]++;\n            }\n        }\n    }\n    $q = [];\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) if ($outdeg[$i][$j] === 0) $q[] = $i * $n + $j;\n    }\n    $head = 0;\n    $len = 0;\n    while ($head < count($q)) {\n        $len++;\n        $end = count($q);\n        while ($head < $end) {\n            $r = intdiv($q[$head], $n);\n            $c = $q[$head] % $n;\n            $head++;\n            for ($d = 0; $d < 4; $d++) {\n                $nr = $r + $dr[$d];\n                $nc = $c + $dc[$d];\n                if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                if ($matrix[$nr][$nc] >= $matrix[$r][$c]) continue;\n                $outdeg[$nr][$nc]--;\n                if ($outdeg[$nr][$nc] === 0) $q[] = $nr * $n + $nc;\n            }\n        }\n    }\n    return $len;\n}`,
        ruby: `def longestIncreasingPath(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  outdeg = Array.new(m) { Array.new(n, 0) }\n  (0...m).each do |i|\n    (0...n).each do |j|\n      (0...4).each do |d|\n        ni = i + dr[d]\n        nj = j + dc[d]\n        next if ni < 0 || ni >= m || nj < 0 || nj >= n\n        outdeg[i][j] += 1 if matrix[ni][nj] > matrix[i][j]\n      end\n    end\n  end\n  q = []\n  (0...m).each do |i|\n    (0...n).each { |j| q << i * n + j if outdeg[i][j] == 0 }\n  end\n  head = 0\n  len = 0\n  while head < q.length\n    len += 1\n    last = q.length\n    while head < last\n      r = q[head] / n\n      c = q[head] % n\n      head += 1\n      (0...4).each do |d|\n        nr = r + dr[d]\n        nc = c + dc[d]\n        next if nr < 0 || nr >= m || nc < 0 || nc >= n\n        next if matrix[nr][nc] >= matrix[r][c]\n        outdeg[nr][nc] -= 1\n        q << nr * n + nc if outdeg[nr][nc] == 0\n      end\n    end\n  end\n  len\nend`,
      },
    };
  })(),

  // ── Number of Submatrices That Sum to Target (LC 1074) ──────────
  (() => {
    const ref = (matrix: number[][], target: number) => {
      const m = matrix.length, n = matrix[0].length;
      const pre = Array.from({ length: m }, () => new Array(n + 1).fill(0));
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) pre[i][j + 1] = pre[i][j] + matrix[i][j];
      }
      let ans = 0;
      for (let c1 = 0; c1 < n; c1++) {
        for (let c2 = c1; c2 < n; c2++) {
          const map = new Map<number, number>();
          map.set(0, 1);
          let sum = 0;
          for (let i = 0; i < m; i++) {
            sum += pre[i][c2 + 1] - pre[i][c1];
            const need = sum - target;
            const hit = map.get(need);
            if (hit !== undefined) ans += hit;
            map.set(sum, (map.get(sum) || 0) + 1);
          }
        }
      }
      return ans;
    };
    return {
      slug: "number-of-submatrices-that-sum-to-target",
      title: "Number of Submatrices That Sum to Target",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Hash Table", "Prefix Sum", "Facebook", "Google", "Amazon"],
      signature: { funcName: "numSubmatrixSumTarget", params: [{ name: "matrix", type: "int[][]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the non-empty submatrices whose elements sum to `target`. A submatrix is a rectangle `(x1, y1) … (x2, y2)` with `x1 <= x2` and `y1 <= y2`, and two submatrices are different whenever any of those four coordinates differ — even if the values are identical.",
        [
          { in: "matrix = [[0,1,0],[1,1,1],[0,1,0]], target = 0", out: "4", note: "The four single `0` cells." },
          { in: "matrix = [[1,-1],[-1,1]], target = 0", out: "5" },
          { in: "matrix = [[904]], target = 0", out: "0" },
        ],
        ["1 <= matrix.length <= 100", "1 <= matrix[0].length <= 100", "-1000 <= matrix[i][j] <= 1000", "-10^8 <= target <= 10^8"]),
      hints: [
        "Fix the left and right columns of the rectangle. Each row then collapses to a single number.",
        "The question becomes: how many contiguous runs of those row sums add to `target`?",
        "That is the classic \"subarray sum equals k\" counted with a hash map of prefix sums.",
      ],
      editorial: explain({
        idea: "Collapse two of the four degrees of freedom by fixing the column range. Row-wise prefix sums make each row's contribution O(1), and the remaining 1D problem is solved with a prefix-sum frequency map.",
        steps: [
          "Precompute row prefix sums so a row's slice `[c1, c2]` is one subtraction.",
          "For each column pair `c1 <= c2`, sweep the rows keeping a running total.",
          "Look up `running - target` in a map of previously seen totals and add its count.",
          "Record the running total, seeding the map with `{0: 1}` for rectangles starting at row 0.",
        ],
        why: "A rectangle is a column range plus a row range, so fixing the columns leaves exactly one contiguous range to find, and the prefix-sum map counts all of them in one pass. Seeding with `{0: 1}` is what lets a rectangle begin at the first row. Values can repeat and cancel, so a map of counts is required, not a set.",
        time: "O(rows² · cols) — or O(cols² · rows), whichever orientation is cheaper",
        space: "O(rows)",
        pitfalls: [
          "A set instead of a count map loses rectangles that share a prefix sum.",
          "Forgetting the `{0: 1}` seed drops every rectangle anchored at the first row.",
          "Sums reach `100 · 100 · 1000 = 10^7`, so `int` is fine, but the running total must not be reset between column pairs without also clearing the map.",
        ],
      }),
      examples: [
        { input: "[[0,1,0],[1,1,1],[0,1,0]]\n0", expectedOutput: "4" },
        { input: "[[1,-1],[-1,1]]\n0", expectedOutput: "5" },
        { input: "[[904]]\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const lo = pick(rng, [-2, -5, 0]);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, lo, 5)));
        const target = ri(rng, -4, 6);
        return { input: `${fmtIntMat(matrix)}\n${target}`, expectedOutput: String(ref(matrix, target)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict\n\ndef numSubmatrixSumTarget(matrix: List[List[int]], target: int) -> int:\n    m, n = len(matrix), len(matrix[0])\n    pre = [[0] * (n + 1) for _ in range(m)]\n    for i in range(m):\n        for j in range(n):\n            pre[i][j + 1] = pre[i][j] + matrix[i][j]\n    ans = 0\n    for c1 in range(n):\n        for c2 in range(c1, n):\n            seen = defaultdict(int)\n            seen[0] = 1\n            total = 0\n            for i in range(m):\n                total += pre[i][c2 + 1] - pre[i][c1]\n                ans += seen[total - target]\n                seen[total] += 1\n    return ans`,
        javascript: `var numSubmatrixSumTarget = function(matrix, target) {\n    var m = matrix.length, n = matrix[0].length, i, j;\n    var pre = [];\n    for (i = 0; i < m; i++) {\n        var row = [0];\n        for (j = 0; j < n; j++) row.push(row[j] + matrix[i][j]);\n        pre.push(row);\n    }\n    var ans = 0;\n    for (var c1 = 0; c1 < n; c1++) {\n        for (var c2 = c1; c2 < n; c2++) {\n            var map = new Map();\n            map.set(0, 1);\n            var sum = 0;\n            for (i = 0; i < m; i++) {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                var hit = map.get(sum - target);\n                if (hit !== undefined) ans += hit;\n                var cur = map.get(sum);\n                map.set(sum, cur === undefined ? 1 : cur + 1);\n            }\n        }\n    }\n    return ans;\n};`,
        typescript: `function numSubmatrixSumTarget(matrix: number[][], target: number): number {\n    var m = matrix.length, n = matrix[0].length, i: number, j: number;\n    var pre: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [0];\n        for (j = 0; j < n; j++) row.push(row[j] + matrix[i][j]);\n        pre.push(row);\n    }\n    var ans = 0;\n    for (var c1 = 0; c1 < n; c1++) {\n        for (var c2 = c1; c2 < n; c2++) {\n            var map: { [key: string]: number } = { "0": 1 };\n            var sum = 0;\n            for (i = 0; i < m; i++) {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                var hit = map["" + (sum - target)];\n                if (hit !== undefined) ans += hit;\n                var cur = map["" + sum];\n                map["" + sum] = cur === undefined ? 1 : cur + 1;\n            }\n        }\n    }\n    return ans;\n}`,
        java: `public static int numSubmatrixSumTarget(int[][] matrix, int target) {\n    int m = matrix.length, n = matrix[0].length;\n    int[][] pre = new int[m][n + 1];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) pre[i][j + 1] = pre[i][j] + matrix[i][j];\n    }\n    int ans = 0;\n    for (int c1 = 0; c1 < n; c1++) {\n        for (int c2 = c1; c2 < n; c2++) {\n            Map<Integer, Integer> seen = new HashMap<>();\n            seen.put(0, 1);\n            int sum = 0;\n            for (int i = 0; i < m; i++) {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                ans += seen.getOrDefault(sum - target, 0);\n                seen.merge(sum, 1, Integer::sum);\n            }\n        }\n    }\n    return ans;\n}`,
        cpp: `int numSubmatrixSumTarget(vector<vector<int>>& matrix, int target) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<vector<int>> pre(m, vector<int>(n + 1, 0));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) pre[i][j + 1] = pre[i][j] + matrix[i][j];\n    }\n    int ans = 0;\n    for (int c1 = 0; c1 < n; c1++) {\n        for (int c2 = c1; c2 < n; c2++) {\n            unordered_map<int, int> seen;\n            seen[0] = 1;\n            int sum = 0;\n            for (int i = 0; i < m; i++) {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                auto it = seen.find(sum - target);\n                if (it != seen.end()) ans += it->second;\n                seen[sum]++;\n            }\n        }\n    }\n    return ans;\n}`,
        c: `int numSubmatrixSumTarget(int** matrix, int matrixSize, int* matrixColSize, int target) {\n    int m = matrixSize, n = matrixColSize[0];\n    int w = n + 1;\n    int* pre = (int*) calloc((size_t) m * (size_t) w, sizeof(int));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) pre[i * w + j + 1] = pre[i * w + j] + matrix[i][j];\n    }\n    /* The running totals are bounded, so a plain array indexed by the shifted\n       sum is faster and simpler here than a hash table. */\n    int span = 100 * 100 * 1000;\n    int* sums = (int*) malloc((size_t) (m + 1) * sizeof(int));\n    int ans = 0;\n    for (int c1 = 0; c1 < n; c1++) {\n        for (int c2 = c1; c2 < n; c2++) {\n            int sum = 0, cnt = 0;\n            sums[cnt++] = 0;\n            for (int i = 0; i < m; i++) {\n                sum += pre[i * w + c2 + 1] - pre[i * w + c1];\n                long long need = (long long) sum - target;\n                if (need >= -span && need <= span) {\n                    for (int k = 0; k < cnt; k++) if (sums[k] == (int) need) ans++;\n                }\n                sums[cnt++] = sum;\n            }\n        }\n    }\n    free(pre);\n    free(sums);\n    return ans;\n}`,
        csharp: `public static int NumSubmatrixSumTarget(int[][] matrix, int target)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    var pre = new int[m][];\n    for (int i = 0; i < m; i++)\n    {\n        pre[i] = new int[n + 1];\n        for (int j = 0; j < n; j++) pre[i][j + 1] = pre[i][j] + matrix[i][j];\n    }\n    int ans = 0;\n    for (int c1 = 0; c1 < n; c1++)\n    {\n        for (int c2 = c1; c2 < n; c2++)\n        {\n            var seen = new Dictionary<int, int>();\n            seen[0] = 1;\n            int sum = 0;\n            for (int i = 0; i < m; i++)\n            {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                if (seen.TryGetValue(sum - target, out int hit)) ans += hit;\n                seen[sum] = seen.TryGetValue(sum, out int cur) ? cur + 1 : 1;\n            }\n        }\n    }\n    return ans;\n}`,
        go: `func numSubmatrixSumTarget(matrix [][]int, target int) int {\n\tm, n := len(matrix), len(matrix[0])\n\tpre := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tpre[i] = make([]int, n+1)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tpre[i][j+1] = pre[i][j] + matrix[i][j]\n\t\t}\n\t}\n\tans := 0\n\tfor c1 := 0; c1 < n; c1++ {\n\t\tfor c2 := c1; c2 < n; c2++ {\n\t\t\tseen := map[int]int{0: 1}\n\t\t\tsum := 0\n\t\t\tfor i := 0; i < m; i++ {\n\t\t\t\tsum += pre[i][c2+1] - pre[i][c1]\n\t\t\t\tans += seen[sum-target]\n\t\t\t\tseen[sum]++\n\t\t\t}\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun numSubmatrixSumTarget(matrix: Array<IntArray>, target: Int): Int {\n    val m = matrix.size\n    val n = matrix[0].size\n    val pre = Array(m) { IntArray(n + 1) }\n    for (i in 0 until m) {\n        for (j in 0 until n) pre[i][j + 1] = pre[i][j] + matrix[i][j]\n    }\n    var ans = 0\n    for (c1 in 0 until n) {\n        for (c2 in c1 until n) {\n            val seen = HashMap<Int, Int>()\n            seen[0] = 1\n            var sum = 0\n            for (i in 0 until m) {\n                sum += pre[i][c2 + 1] - pre[i][c1]\n                ans += seen.getOrDefault(sum - target, 0)\n                seen[sum] = seen.getOrDefault(sum, 0) + 1\n            }\n        }\n    }\n    return ans\n}`,
        swift: `func numSubmatrixSumTarget(_ matrix: [[Int]], _ target: Int) -> Int {\n    let m = matrix.count\n    let n = matrix[0].count\n    var pre = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m)\n    for i in 0..<m {\n        for j in 0..<n { pre[i][j + 1] = pre[i][j] + matrix[i][j] }\n    }\n    var ans = 0\n    for c1 in 0..<n {\n        for c2 in c1..<n {\n            var seen = [Int: Int]()\n            seen[0] = 1\n            var sum = 0\n            for i in 0..<m {\n                sum += pre[i][c2 + 1] - pre[i][c1]\n                ans += seen[sum - target] ?? 0\n                seen[sum, default: 0] += 1\n            }\n        }\n    }\n    return ans\n}`,
        rust: `use std::collections::HashMap;\n\nfn numSubmatrixSumTarget(matrix: Vec<Vec<i32>>, target: i32) -> i32 {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let mut pre = vec![vec![0i32; n + 1]; m];\n    for i in 0..m {\n        for j in 0..n {\n            pre[i][j + 1] = pre[i][j] + matrix[i][j];\n        }\n    }\n    let mut ans = 0i32;\n    for c1 in 0..n {\n        for c2 in c1..n {\n            let mut seen: HashMap<i32, i32> = HashMap::new();\n            seen.insert(0, 1);\n            let mut sum = 0i32;\n            for i in 0..m {\n                sum += pre[i][c2 + 1] - pre[i][c1];\n                if let Some(&hit) = seen.get(&(sum - target)) {\n                    ans += hit;\n                }\n                *seen.entry(sum).or_insert(0) += 1;\n            }\n        }\n    }\n    ans\n}`,
        php: `function numSubmatrixSumTarget($matrix, $target) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $pre = [];\n    for ($i = 0; $i < $m; $i++) {\n        $pre[$i] = array_fill(0, $n + 1, 0);\n        for ($j = 0; $j < $n; $j++) $pre[$i][$j + 1] = $pre[$i][$j] + $matrix[$i][$j];\n    }\n    $ans = 0;\n    for ($c1 = 0; $c1 < $n; $c1++) {\n        for ($c2 = $c1; $c2 < $n; $c2++) {\n            $seen = [0 => 1];\n            $sum = 0;\n            for ($i = 0; $i < $m; $i++) {\n                $sum += $pre[$i][$c2 + 1] - $pre[$i][$c1];\n                $need = $sum - $target;\n                if (isset($seen[$need])) $ans += $seen[$need];\n                $seen[$sum] = isset($seen[$sum]) ? $seen[$sum] + 1 : 1;\n            }\n        }\n    }\n    return $ans;\n}`,
        ruby: `def numSubmatrixSumTarget(matrix, target)\n  m = matrix.length\n  n = matrix[0].length\n  pre = Array.new(m) { Array.new(n + 1, 0) }\n  (0...m).each do |i|\n    (0...n).each { |j| pre[i][j + 1] = pre[i][j] + matrix[i][j] }\n  end\n  ans = 0\n  (0...n).each do |c1|\n    (c1...n).each do |c2|\n      seen = Hash.new(0)\n      seen[0] = 1\n      sum = 0\n      (0...m).each do |i|\n        sum += pre[i][c2 + 1] - pre[i][c1]\n        ans += seen[sum - target]\n        seen[sum] += 1\n      end\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Unique Paths III (LC 980) ───────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let empty = 0, sr = 0, sc = 0, ends = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] === 0) empty++;
          else if (grid[i][j] === 1) { sr = i; sc = j; }
          else if (grid[i][j] === 2) ends++;
        }
      }
      if (ends === 0) return 0;
      const seen = Array.from({ length: m }, () => new Array(n).fill(false));
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let count = 0;
      const walk = (r: number, c: number, remaining: number) => {
        if (grid[r][c] === 2) {
          if (remaining === 0) count++;
          return;
        }
        seen[r][c] = true;
        const rem = grid[r][c] === 0 ? remaining - 1 : remaining;
        for (let d = 0; d < 4; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
          if (seen[nr][nc] || grid[nr][nc] === -1) continue;
          walk(nr, nc, rem);
        }
        seen[r][c] = false;
      };
      walk(sr, sc, empty);
      return count;
    };
    return {
      slug: "unique-paths-iii",
      title: "Unique Paths III",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Backtracking", "Bit Manipulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "uniquePathsIII", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A grid holds four kinds of cell: `1` the starting square (exactly one), `2` the ending square (exactly one), `0` a square you may walk over, and `-1` an obstacle you may not.\n\nReturn the number of 4-directional walks from start to end that visit **every non-obstacle square exactly once**.",
        [
          { in: "grid = [[1,0,0,0],[0,0,0,0],[0,0,2,-1]]", out: "2", note: "Two ways to cover all ten walkable squares." },
          { in: "grid = [[1,0,0,0],[0,0,0,0],[0,0,0,2]]", out: "4" },
          { in: "grid = [[0,1],[2,0]]", out: "0", note: "Any route from the start to the end must skip one of the two empty squares." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 20", "1 <= m * n <= 20", "-1 <= grid[i][j] <= 2", "There is exactly one starting square and exactly one ending square."]),
      hints: [
        "There are at most 20 cells, so an exhaustive search is affordable.",
        "Backtrack: mark a cell on the way in and unmark it on the way out.",
        "Count how many `0` cells remain, and only accept a route that reaches `2` with that count at zero.",
      ],
      editorial: explain({
        idea: "With at most 20 cells, enumerate every self-avoiding walk from the start. A walk counts only if it arrives at the end having consumed every walkable square.",
        steps: [
          "Count the `0` cells and locate the start.",
          "Recurse from the start, carrying how many `0` cells are still unvisited.",
          "On entering a `0` cell, decrement that counter; on entering the `2` cell, accept the walk if the counter is zero and stop.",
          "Mark cells visited on the way down and clear the mark on the way back up.",
        ],
        why: "The counter is the whole correctness argument: because a walk never revisits a cell, \"remaining reaches zero\" is exactly \"every walkable square has been used once\". Clearing the mark on the way out is what lets different branches reuse a cell — without it the search would find only the first route through each square.",
        time: "O(3^(m · n)) in the worst case, but tiny at `m · n <= 20`",
        space: "O(m · n) for the recursion and the visited grid",
        pitfalls: [
          "Forgetting to unmark a cell on the way out under-counts badly.",
          "The end square is not a `0`, so it must not be counted among the cells to consume.",
          "A walk that reaches the end early must stop there rather than pass through it.",
        ],
      }),
      examples: [
        { input: "[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]", expectedOutput: "2" },
        { input: "[[1,0,0,0],[0,0,0,0],[0,0,0,2]]", expectedOutput: "4" },
        { input: "[[0,1],[2,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 4), n = ri(rng, 1, Math.max(1, Math.floor(20 / ri(rng, 1, 4))));
        const cols = Math.min(5, Math.max(1, n));
        const grid = Array.from({ length: m }, () => Array.from({ length: cols }, () => (rng() < 0.2 ? -1 : 0)));
        // Exactly one start and one end, on distinct cells.
        const total = m * cols;
        const a = ri(rng, 0, total - 1);
        const b = total > 1 ? (a + ri(rng, 1, total - 1)) % total : a;
        grid[Math.floor(a / cols)][a % cols] = 1;
        if (b !== a) grid[Math.floor(b / cols)][b % cols] = 2;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef uniquePathsIII(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    empty = 0\n    sr = sc = 0\n    ends = 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == 0:\n                empty += 1\n            elif grid[i][j] == 1:\n                sr, sc = i, j\n            elif grid[i][j] == 2:\n                ends += 1\n    if ends == 0:\n        return 0\n    seen = [[False] * n for _ in range(m)]\n    count = 0\n\n    def walk(r: int, c: int, remaining: int) -> None:\n        nonlocal count\n        if grid[r][c] == 2:\n            if remaining == 0:\n                count += 1\n            return\n        seen[r][c] = True\n        rem = remaining - 1 if grid[r][c] == 0 else remaining\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc] and grid[nr][nc] != -1:\n                walk(nr, nc, rem)\n        seen[r][c] = False\n\n    walk(sr, sc, empty)\n    return count`,
        javascript: `var uniquePathsIII = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j;\n    var empty = 0, sr = 0, sc = 0, ends = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 0) empty++;\n            else if (grid[i][j] === 1) { sr = i; sc = j; }\n            else if (grid[i][j] === 2) ends++;\n        }\n    }\n    if (ends === 0) return 0;\n    var seen = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var count = 0;\n    var walk = function(r, c, remaining) {\n        if (grid[r][c] === 2) {\n            if (remaining === 0) count++;\n            return;\n        }\n        seen[r][c] = true;\n        var rem = grid[r][c] === 0 ? remaining - 1 : remaining;\n        for (var d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (seen[nr][nc] || grid[nr][nc] === -1) continue;\n            walk(nr, nc, rem);\n        }\n        seen[r][c] = false;\n    };\n    walk(sr, sc, empty);\n    return count;\n};`,
        typescript: `function uniquePathsIII(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, i: number, j: number;\n    var empty = 0, sr = 0, sc = 0, ends = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 0) empty++;\n            else if (grid[i][j] === 1) { sr = i; sc = j; }\n            else if (grid[i][j] === 2) ends++;\n        }\n    }\n    if (ends === 0) return 0;\n    var seen: boolean[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: boolean[] = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var count = 0;\n    var walk = function(r: number, c: number, remaining: number): void {\n        if (grid[r][c] === 2) {\n            if (remaining === 0) count++;\n            return;\n        }\n        seen[r][c] = true;\n        var rem = grid[r][c] === 0 ? remaining - 1 : remaining;\n        for (var d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (seen[nr][nc] || grid[nr][nc] === -1) continue;\n            walk(nr, nc, rem);\n        }\n        seen[r][c] = false;\n    };\n    walk(sr, sc, empty);\n    return count;\n}`,
        java: `private static int upCount;\nprivate static boolean[][] upSeen;\nprivate static int[][] upGrid;\n\npublic static int uniquePathsIII(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int empty = 0, sr = 0, sc = 0, ends = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 0) empty++;\n            else if (grid[i][j] == 1) { sr = i; sc = j; }\n            else if (grid[i][j] == 2) ends++;\n        }\n    }\n    if (ends == 0) return 0;\n    upCount = 0;\n    upSeen = new boolean[m][n];\n    upGrid = grid;\n    upWalk(sr, sc, empty);\n    return upCount;\n}\n\nprivate static void upWalk(int r, int c, int remaining) {\n    int m = upGrid.length, n = upGrid[0].length;\n    if (upGrid[r][c] == 2) {\n        if (remaining == 0) upCount++;\n        return;\n    }\n    upSeen[r][c] = true;\n    int rem = upGrid[r][c] == 0 ? remaining - 1 : remaining;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    for (int d = 0; d < 4; d++) {\n        int nr = r + dr[d], nc = c + dc[d];\n        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n        if (upSeen[nr][nc] || upGrid[nr][nc] == -1) continue;\n        upWalk(nr, nc, rem);\n    }\n    upSeen[r][c] = false;\n}`,
        cpp: `static int upCount;\nstatic vector<vector<char>> upSeen;\n\nstatic void upWalk(vector<vector<int>>& grid, int r, int c, int remaining) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    if (grid[r][c] == 2) {\n        if (remaining == 0) upCount++;\n        return;\n    }\n    upSeen[r][c] = 1;\n    int rem = grid[r][c] == 0 ? remaining - 1 : remaining;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    for (int d = 0; d < 4; d++) {\n        int nr = r + dr[d], nc = c + dc[d];\n        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n        if (upSeen[nr][nc] || grid[nr][nc] == -1) continue;\n        upWalk(grid, nr, nc, rem);\n    }\n    upSeen[r][c] = 0;\n}\n\nint uniquePathsIII(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int empty = 0, sr = 0, sc = 0, ends = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 0) empty++;\n            else if (grid[i][j] == 1) { sr = i; sc = j; }\n            else if (grid[i][j] == 2) ends++;\n        }\n    }\n    if (ends == 0) return 0;\n    upCount = 0;\n    upSeen.assign(m, vector<char>(n, 0));\n    upWalk(grid, sr, sc, empty);\n    return upCount;\n}`,
        c: `static int upCount;\nstatic char* upSeen;\nstatic int** upGrid;\nstatic int upM, upN;\n\nstatic void upWalk(int r, int c, int remaining) {\n    if (upGrid[r][c] == 2) {\n        if (remaining == 0) upCount++;\n        return;\n    }\n    upSeen[r * upN + c] = 1;\n    int rem = upGrid[r][c] == 0 ? remaining - 1 : remaining;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    for (int d = 0; d < 4; d++) {\n        int nr = r + dr[d], nc = c + dc[d];\n        if (nr < 0 || nr >= upM || nc < 0 || nc >= upN) continue;\n        if (upSeen[nr * upN + nc] || upGrid[nr][nc] == -1) continue;\n        upWalk(nr, nc, rem);\n    }\n    upSeen[r * upN + c] = 0;\n}\n\nint uniquePathsIII(int** grid, int gridSize, int* gridColSize) {\n    upM = gridSize;\n    upN = gridColSize[0];\n    upGrid = grid;\n    int empty = 0, sr = 0, sc = 0, ends = 0;\n    for (int i = 0; i < upM; i++) {\n        for (int j = 0; j < upN; j++) {\n            if (grid[i][j] == 0) empty++;\n            else if (grid[i][j] == 1) { sr = i; sc = j; }\n            else if (grid[i][j] == 2) ends++;\n        }\n    }\n    if (ends == 0) return 0;\n    upCount = 0;\n    upSeen = (char*) calloc((size_t) (upM * upN), 1);\n    upWalk(sr, sc, empty);\n    free(upSeen);\n    return upCount;\n}`,
        csharp: `public static int UniquePathsIII(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int empty = 0, sr = 0, sc = 0, ends = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] == 0) empty++;\n            else if (grid[i][j] == 1) { sr = i; sc = j; }\n            else if (grid[i][j] == 2) ends++;\n        }\n    }\n    if (ends == 0) return 0;\n    var seen = new bool[m, n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int count = 0;\n    void Walk(int r, int c, int remaining)\n    {\n        if (grid[r][c] == 2)\n        {\n            if (remaining == 0) count++;\n            return;\n        }\n        seen[r, c] = true;\n        int rem = grid[r][c] == 0 ? remaining - 1 : remaining;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (seen[nr, nc] || grid[nr][nc] == -1) continue;\n            Walk(nr, nc, rem);\n        }\n        seen[r, c] = false;\n    }\n    Walk(sr, sc, empty);\n    return count;\n}`,
        go: `func uniquePathsIII(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tempty, sr, sc, ends := 0, 0, 0, 0\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tswitch grid[i][j] {\n\t\t\tcase 0:\n\t\t\t\tempty++\n\t\t\tcase 1:\n\t\t\t\tsr, sc = i, j\n\t\t\tcase 2:\n\t\t\t\tends++\n\t\t\t}\n\t\t}\n\t}\n\tif ends == 0 {\n\t\treturn 0\n\t}\n\tseen := make([][]bool, m)\n\tfor i := range seen {\n\t\tseen[i] = make([]bool, n)\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tcount := 0\n\tvar walk func(r, c, remaining int)\n\twalk = func(r, c, remaining int) {\n\t\tif grid[r][c] == 2 {\n\t\t\tif remaining == 0 {\n\t\t\t\tcount++\n\t\t\t}\n\t\t\treturn\n\t\t}\n\t\tseen[r][c] = true\n\t\trem := remaining\n\t\tif grid[r][c] == 0 {\n\t\t\trem--\n\t\t}\n\t\tfor d := 0; d < 4; d++ {\n\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif seen[nr][nc] || grid[nr][nc] == -1 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\twalk(nr, nc, rem)\n\t\t}\n\t\tseen[r][c] = false\n\t}\n\twalk(sr, sc, empty)\n\treturn count\n}`,
        kotlin: `fun uniquePathsIII(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    var empty = 0\n    var sr = 0\n    var sc = 0\n    var ends = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            when (grid[i][j]) {\n                0 -> empty++\n                1 -> { sr = i; sc = j }\n                2 -> ends++\n            }\n        }\n    }\n    if (ends == 0) return 0\n    val seen = Array(m) { BooleanArray(n) }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var count = 0\n    fun walk(r: Int, c: Int, remaining: Int) {\n        if (grid[r][c] == 2) {\n            if (remaining == 0) count++\n            return\n        }\n        seen[r][c] = true\n        val rem = if (grid[r][c] == 0) remaining - 1 else remaining\n        for (d in 0 until 4) {\n            val nr = r + dr[d]\n            val nc = c + dc[d]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n            if (seen[nr][nc] || grid[nr][nc] == -1) continue\n            walk(nr, nc, rem)\n        }\n        seen[r][c] = false\n    }\n    walk(sr, sc, empty)\n    return count\n}`,
        swift: `func uniquePathsIII(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    var empty = 0, sr = 0, sc = 0, ends = 0\n    for i in 0..<m {\n        for j in 0..<n {\n            if grid[i][j] == 0 { empty += 1 }\n            else if grid[i][j] == 1 { sr = i; sc = j }\n            else if grid[i][j] == 2 { ends += 1 }\n        }\n    }\n    if ends == 0 { return 0 }\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var count = 0\n    func walk(_ r: Int, _ c: Int, _ remaining: Int) {\n        if grid[r][c] == 2 {\n            if remaining == 0 { count += 1 }\n            return\n        }\n        seen[r][c] = true\n        let rem = grid[r][c] == 0 ? remaining - 1 : remaining\n        for d in 0..<4 {\n            let nr = r + dr[d], nc = c + dc[d]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n            if seen[nr][nc] || grid[nr][nc] == -1 { continue }\n            walk(nr, nc, rem)\n        }\n        seen[r][c] = false\n    }\n    walk(sr, sc, empty)\n    return count\n}`,
        rust: `fn uniquePathsIII(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut empty = 0i32;\n    let mut sr = 0usize;\n    let mut sc = 0usize;\n    let mut ends = 0;\n    for i in 0..m {\n        for j in 0..n {\n            if grid[i][j] == 0 {\n                empty += 1;\n            } else if grid[i][j] == 1 {\n                sr = i;\n                sc = j;\n            } else if grid[i][j] == 2 {\n                ends += 1;\n            }\n        }\n    }\n    if ends == 0 {\n        return 0;\n    }\n    fn walk(\n        grid: &Vec<Vec<i32>>,\n        seen: &mut Vec<Vec<bool>>,\n        r: usize,\n        c: usize,\n        remaining: i32,\n        count: &mut i32,\n    ) {\n        let m = grid.len();\n        let n = grid[0].len();\n        if grid[r][c] == 2 {\n            if remaining == 0 {\n                *count += 1;\n            }\n            return;\n        }\n        seen[r][c] = true;\n        let rem = if grid[r][c] == 0 { remaining - 1 } else { remaining };\n        let dr = [1i32, -1, 0, 0];\n        let dc = [0i32, 0, 1, -1];\n        for d in 0..4 {\n            let nr = r as i32 + dr[d];\n            let nc = c as i32 + dc[d];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            let (nr, nc) = (nr as usize, nc as usize);\n            if seen[nr][nc] || grid[nr][nc] == -1 {\n                continue;\n            }\n            walk(grid, seen, nr, nc, rem, count);\n        }\n        seen[r][c] = false;\n    }\n    let mut seen = vec![vec![false; n]; m];\n    let mut count = 0i32;\n    walk(&grid, &mut seen, sr, sc, empty, &mut count);\n    count\n}`,
        php: `function uniquePathsIII($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $empty = 0; $sr = 0; $sc = 0; $ends = 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] === 0) $empty++;\n            elseif ($grid[$i][$j] === 1) { $sr = $i; $sc = $j; }\n            elseif ($grid[$i][$j] === 2) $ends++;\n        }\n    }\n    if ($ends === 0) return 0;\n    $seen = [];\n    for ($i = 0; $i < $m; $i++) $seen[$i] = array_fill(0, $n, false);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $count = 0;\n    $walk = function($r, $c, $remaining) use (&$walk, &$seen, &$count, $grid, $m, $n, $dr, $dc) {\n        if ($grid[$r][$c] === 2) {\n            if ($remaining === 0) $count++;\n            return;\n        }\n        $seen[$r][$c] = true;\n        $rem = $grid[$r][$c] === 0 ? $remaining - 1 : $remaining;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $r + $dr[$d];\n            $nc = $c + $dc[$d];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n            if ($seen[$nr][$nc] || $grid[$nr][$nc] === -1) continue;\n            $walk($nr, $nc, $rem);\n        }\n        $seen[$r][$c] = false;\n    };\n    $walk($sr, $sc, $empty);\n    return $count;\n}`,
        ruby: `def uniquePathsIII(grid)\n  m = grid.length\n  n = grid[0].length\n  empty = 0\n  sr = 0\n  sc = 0\n  ends = 0\n  (0...m).each do |i|\n    (0...n).each do |j|\n      if grid[i][j] == 0\n        empty += 1\n      elsif grid[i][j] == 1\n        sr = i\n        sc = j\n      elsif grid[i][j] == 2\n        ends += 1\n      end\n    end\n  end\n  return 0 if ends == 0\n  seen = Array.new(m) { Array.new(n, false) }\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  count = 0\n  walk = lambda do |r, c, remaining|\n    if grid[r][c] == 2\n      count += 1 if remaining == 0\n      next\n    end\n    seen[r][c] = true\n    rem = grid[r][c] == 0 ? remaining - 1 : remaining\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n\n      next if seen[nr][nc] || grid[nr][nc] == -1\n      walk.call(nr, nc, rem)\n    end\n    seen[r][c] = false\n  end\n  walk.call(sr, sc, empty)\n  count\nend`,
      },
    };
  })(),

  // ── Making A Large Island (LC 827) ──────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const label = Array.from({ length: n }, () => new Array(n).fill(0));
      const sizes = [0, 0];
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let id = 2;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] !== 1 || label[i][j] !== 0) continue;
          let size = 0;
          const stack = [i * n + j];
          label[i][j] = id;
          while (stack.length > 0) {
            const cur = stack.pop() as number;
            const r = Math.floor(cur / n), c = cur % n;
            size++;
            for (let d = 0; d < 4; d++) {
              const nr = r + dr[d], nc = c + dc[d];
              if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
              if (grid[nr][nc] !== 1 || label[nr][nc] !== 0) continue;
              label[nr][nc] = id;
              stack.push(nr * n + nc);
            }
          }
          sizes.push(size);
          id++;
        }
      }
      let best = 0;
      for (let k = 2; k < sizes.length; k++) if (sizes[k] > best) best = sizes[k];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] !== 0) continue;
          let total = 1;
          const near: number[] = [];
          for (let d = 0; d < 4; d++) {
            const nr = i + dr[d], nc = j + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            const lb = label[nr][nc];
            if (lb === 0 || near.indexOf(lb) >= 0) continue;
            near.push(lb);
            total += sizes[lb];
          }
          if (total > best) best = total;
        }
      }
      return best;
    };
    return {
      slug: "making-a-large-island",
      title: "Making A Large Island",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search", "Union Find", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "largestIsland", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n × n` binary grid. You may change **at most one** `0` into a `1`.\n\nReturn the size of the largest island afterwards. An island is a group of `1`s connected 4-directionally.",
        [
          { in: "grid = [[1,0],[0,1]]", out: "3", note: "Filling either `0` joins the two single cells." },
          { in: "grid = [[1,1],[1,0]]", out: "4", note: "Filling the one `0` makes the whole grid an island." },
          { in: "grid = [[1,1],[1,1]]", out: "4", note: "There is no `0` to change; the island is already the whole grid." },
        ],
        ["n == grid.length == grid[i].length", "1 <= n <= 500", "grid[i][j] is 0 or 1"]),
      hints: [
        "Re-running a flood fill for every `0` is `O(n^4)`.",
        "Label the islands once and record each one's size.",
        "For each `0`, add up the sizes of the **distinct** island labels around it, plus one for the cell itself.",
      ],
      editorial: explain({
        idea: "Label every island with an id and its size in one pass. Then each candidate `0` is answered in O(1): the new island is the cell itself plus the distinct islands touching it.",
        steps: [
          "Flood fill each island, writing an id (starting at 2, so it never collides with 0 or 1) into every cell and recording its size.",
          "Start the answer at the largest existing island, which covers a grid with no `0`.",
          "For each `0`, collect the distinct ids of its up-to-four neighbours, sum their sizes and add 1.",
          "Return the best total.",
        ],
        why: "De-duplicating the neighbour ids is the crux: two neighbouring cells may belong to the *same* island, and counting it twice inflates the answer. Starting the answer at the largest existing island covers the case where the grid is all `1`s and no change is possible.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Counting the same island twice around one `0` over-counts — at most four neighbours, so a small list is enough to de-duplicate.",
          "Ids must start above 1 or they collide with the grid's own values.",
          "An all-ones grid has no `0` to flip; seed the answer with the largest island.",
        ],
      }),
      examples: [
        { input: "[[1,0],[0,1]]", expectedOutput: "3" },
        { input: "[[1,1],[1,0]]", expectedOutput: "4" },
        { input: "[[1,1],[1,1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const p = pick(rng, [0.4, 0.6, 0.85]);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestIsland(grid: List[List[int]]) -> int:\n    n = len(grid)\n    label = [[0] * n for _ in range(n)]\n    sizes = [0, 0]\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    ident = 2\n    for i in range(n):\n        for j in range(n):\n            if grid[i][j] != 1 or label[i][j] != 0:\n                continue\n            size = 0\n            stack = [(i, j)]\n            label[i][j] = ident\n            while stack:\n                r, c = stack.pop()\n                size += 1\n                for di, dj in dirs:\n                    nr, nc = r + di, c + dj\n                    if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 1 and label[nr][nc] == 0:\n                        label[nr][nc] = ident\n                        stack.append((nr, nc))\n            sizes.append(size)\n            ident += 1\n    best = max(sizes)\n    for i in range(n):\n        for j in range(n):\n            if grid[i][j] != 0:\n                continue\n            near = set()\n            for di, dj in dirs:\n                nr, nc = i + di, j + dj\n                if 0 <= nr < n and 0 <= nc < n and label[nr][nc]:\n                    near.add(label[nr][nc])\n            best = max(best, 1 + sum(sizes[k] for k in near))\n    return best`,
        javascript: `var largestIsland = function(grid) {\n    var n = grid.length, i, j, d;\n    var label = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        label.push(row);\n    }\n    var sizes = [0, 0];\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var id = 2;\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 1 || label[i][j] !== 0) continue;\n            var size = 0;\n            var stack = [i * n + j];\n            label[i][j] = id;\n            while (stack.length > 0) {\n                var cur = stack.pop();\n                var r = Math.floor(cur / n), c = cur % n;\n                size++;\n                for (d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] !== 1 || label[nr][nc] !== 0) continue;\n                    label[nr][nc] = id;\n                    stack.push(nr * n + nc);\n                }\n            }\n            sizes.push(size);\n            id++;\n        }\n    }\n    var best = 0;\n    for (var k = 2; k < sizes.length; k++) if (sizes[k] > best) best = sizes[k];\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 0) continue;\n            var total = 1;\n            var near = [];\n            for (d = 0; d < 4; d++) {\n                var ar = i + dr[d], ac = j + dc[d];\n                if (ar < 0 || ar >= n || ac < 0 || ac >= n) continue;\n                var lb = label[ar][ac];\n                if (lb === 0 || near.indexOf(lb) >= 0) continue;\n                near.push(lb);\n                total += sizes[lb];\n            }\n            if (total > best) best = total;\n        }\n    }\n    return best;\n};`,
        typescript: `function largestIsland(grid: number[][]): number {\n    var n = grid.length, i: number, j: number, d: number;\n    var label: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        label.push(row);\n    }\n    var sizes: number[] = [0, 0];\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var id = 2;\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 1 || label[i][j] !== 0) continue;\n            var size = 0;\n            var stack: number[] = [i * n + j];\n            label[i][j] = id;\n            while (stack.length > 0) {\n                var cur = stack.pop() as number;\n                var r = Math.floor(cur / n), c = cur % n;\n                size++;\n                for (d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] !== 1 || label[nr][nc] !== 0) continue;\n                    label[nr][nc] = id;\n                    stack.push(nr * n + nc);\n                }\n            }\n            sizes.push(size);\n            id++;\n        }\n    }\n    var best = 0;\n    for (var k = 2; k < sizes.length; k++) if (sizes[k] > best) best = sizes[k];\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 0) continue;\n            var total = 1;\n            var near: number[] = [];\n            for (d = 0; d < 4; d++) {\n                var ar = i + dr[d], ac = j + dc[d];\n                if (ar < 0 || ar >= n || ac < 0 || ac >= n) continue;\n                var lb = label[ar][ac];\n                if (lb === 0 || near.indexOf(lb) >= 0) continue;\n                near.push(lb);\n                total += sizes[lb];\n            }\n            if (total > best) best = total;\n        }\n    }\n    return best;\n}`,
        java: `public static int largestIsland(int[][] grid) {\n    int n = grid.length;\n    int[][] label = new int[n][n];\n    List<Integer> sizes = new ArrayList<>();\n    sizes.add(0);\n    sizes.add(0);\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[] stack = new int[n * n];\n    int id = 2;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || label[i][j] != 0) continue;\n            int size = 0, top = 0;\n            stack[top++] = i * n + j;\n            label[i][j] = id;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                size++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || label[nr][nc] != 0) continue;\n                    label[nr][nc] = id;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            sizes.add(size);\n            id++;\n        }\n    }\n    int best = 0;\n    for (int k = 2; k < sizes.size(); k++) best = Math.max(best, sizes.get(k));\n    int[] near = new int[4];\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 0) continue;\n            int total = 1, cnt = 0;\n            for (int d = 0; d < 4; d++) {\n                int nr = i + dr[d], nc = j + dc[d];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int lb = label[nr][nc];\n                if (lb == 0) continue;\n                boolean dup = false;\n                for (int k = 0; k < cnt; k++) if (near[k] == lb) dup = true;\n                if (dup) continue;\n                near[cnt++] = lb;\n                total += sizes.get(lb);\n            }\n            best = Math.max(best, total);\n        }\n    }\n    return best;\n}`,
        cpp: `int largestIsland(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    vector<vector<int>> label(n, vector<int>(n, 0));\n    vector<int> sizes = { 0, 0 };\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int id = 2;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || label[i][j] != 0) continue;\n            int size = 0;\n            vector<int> stack;\n            stack.push_back(i * n + j);\n            label[i][j] = id;\n            while (!stack.empty()) {\n                int cur = stack.back();\n                stack.pop_back();\n                int r = cur / n, c = cur % n;\n                size++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || label[nr][nc] != 0) continue;\n                    label[nr][nc] = id;\n                    stack.push_back(nr * n + nc);\n                }\n            }\n            sizes.push_back(size);\n            id++;\n        }\n    }\n    int best = 0;\n    for (size_t k = 2; k < sizes.size(); k++) best = max(best, sizes[k]);\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 0) continue;\n            int total = 1, cnt = 0, near[4] = { 0, 0, 0, 0 };\n            for (int d = 0; d < 4; d++) {\n                int nr = i + dr[d], nc = j + dc[d];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int lb = label[nr][nc];\n                if (lb == 0) continue;\n                bool dup = false;\n                for (int k = 0; k < cnt; k++) if (near[k] == lb) dup = true;\n                if (dup) continue;\n                near[cnt++] = lb;\n                total += sizes[lb];\n            }\n            best = max(best, total);\n        }\n    }\n    return best;\n}`,
        c: `int largestIsland(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    (void) gridColSize;\n    int* label = (int*) calloc((size_t) (n * n), sizeof(int));\n    int* sizes = (int*) calloc((size_t) (n * n + 2), sizeof(int));\n    int* stack = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int id = 2;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || label[i * n + j] != 0) continue;\n            int size = 0, top = 0;\n            stack[top++] = i * n + j;\n            label[i * n + j] = id;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                size++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || label[nr * n + nc] != 0) continue;\n                    label[nr * n + nc] = id;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            sizes[id] = size;\n            id++;\n        }\n    }\n    int best = 0;\n    for (int k = 2; k < id; k++) if (sizes[k] > best) best = sizes[k];\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 0) continue;\n            int total = 1, cnt = 0, near[4] = { 0, 0, 0, 0 };\n            for (int d = 0; d < 4; d++) {\n                int nr = i + dr[d], nc = j + dc[d];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int lb = label[nr * n + nc];\n                if (lb == 0) continue;\n                int dup = 0;\n                for (int k = 0; k < cnt; k++) if (near[k] == lb) dup = 1;\n                if (dup) continue;\n                near[cnt++] = lb;\n                total += sizes[lb];\n            }\n            if (total > best) best = total;\n        }\n    }\n    free(label);\n    free(sizes);\n    free(stack);\n    return best;\n}`,
        csharp: `public static int LargestIsland(int[][] grid)\n{\n    int n = grid.Length;\n    var label = new int[n, n];\n    var sizes = new List<int> { 0, 0 };\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var stack = new int[n * n];\n    int id = 2;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] != 1 || label[i, j] != 0) continue;\n            int size = 0, top = 0;\n            stack[top++] = i * n + j;\n            label[i, j] = id;\n            while (top > 0)\n            {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                size++;\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || label[nr, nc] != 0) continue;\n                    label[nr, nc] = id;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n            sizes.Add(size);\n            id++;\n        }\n    }\n    int best = 0;\n    for (int k = 2; k < sizes.Count; k++) best = Math.Max(best, sizes[k]);\n    var near = new int[4];\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] != 0) continue;\n            int total = 1, cnt = 0;\n            for (int d = 0; d < 4; d++)\n            {\n                int nr = i + dr[d], nc = j + dc[d];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int lb = label[nr, nc];\n                if (lb == 0) continue;\n                bool dup = false;\n                for (int k = 0; k < cnt; k++) if (near[k] == lb) dup = true;\n                if (dup) continue;\n                near[cnt++] = lb;\n                total += sizes[lb];\n            }\n            best = Math.Max(best, total);\n        }\n    }\n    return best;\n}`,
        go: `func largestIsland(grid [][]int) int {\n\tn := len(grid)\n\tlabel := make([][]int, n)\n\tfor i := range label {\n\t\tlabel[i] = make([]int, n)\n\t}\n\tsizes := []int{0, 0}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tid := 2\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] != 1 || label[i][j] != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tsize := 0\n\t\t\tstack := []int{i*n + j}\n\t\t\tlabel[i][j] = id\n\t\t\tfor len(stack) > 0 {\n\t\t\t\tcur := stack[len(stack)-1]\n\t\t\t\tstack = stack[:len(stack)-1]\n\t\t\t\tr, c := cur/n, cur%n\n\t\t\t\tsize++\n\t\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\t\t\tif nr < 0 || nr >= n || nc < 0 || nc >= n {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tif grid[nr][nc] != 1 || label[nr][nc] != 0 {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tlabel[nr][nc] = id\n\t\t\t\t\tstack = append(stack, nr*n+nc)\n\t\t\t\t}\n\t\t\t}\n\t\t\tsizes = append(sizes, size)\n\t\t\tid++\n\t\t}\n\t}\n\tbest := 0\n\tfor k := 2; k < len(sizes); k++ {\n\t\tif sizes[k] > best {\n\t\t\tbest = sizes[k]\n\t\t}\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\ttotal, cnt := 1, 0\n\t\t\tnear := [4]int{}\n\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\tnr, nc := i+dr[d], j+dc[d]\n\t\t\t\tif nr < 0 || nr >= n || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tlb := label[nr][nc]\n\t\t\t\tif lb == 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tdup := false\n\t\t\t\tfor k := 0; k < cnt; k++ {\n\t\t\t\t\tif near[k] == lb {\n\t\t\t\t\t\tdup = true\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tif dup {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tnear[cnt] = lb\n\t\t\t\tcnt++\n\t\t\t\ttotal += sizes[lb]\n\t\t\t}\n\t\t\tif total > best {\n\t\t\t\tbest = total\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun largestIsland(grid: Array<IntArray>): Int {\n    val n = grid.size\n    val label = Array(n) { IntArray(n) }\n    val sizes = ArrayList<Int>()\n    sizes.add(0)\n    sizes.add(0)\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val stack = IntArray(n * n)\n    var id = 2\n    for (i in 0 until n) {\n        for (j in 0 until n) {\n            if (grid[i][j] != 1 || label[i][j] != 0) continue\n            var size = 0\n            var top = 0\n            stack[top++] = i * n + j\n            label[i][j] = id\n            while (top > 0) {\n                val cur = stack[--top]\n                val r = cur / n\n                val c = cur % n\n                size++\n                for (d in 0 until 4) {\n                    val nr = r + dr[d]\n                    val nc = c + dc[d]\n                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue\n                    if (grid[nr][nc] != 1 || label[nr][nc] != 0) continue\n                    label[nr][nc] = id\n                    stack[top++] = nr * n + nc\n                }\n            }\n            sizes.add(size)\n            id++\n        }\n    }\n    var best = 0\n    for (k in 2 until sizes.size) if (sizes[k] > best) best = sizes[k]\n    val near = IntArray(4)\n    for (i in 0 until n) {\n        for (j in 0 until n) {\n            if (grid[i][j] != 0) continue\n            var total = 1\n            var cnt = 0\n            for (d in 0 until 4) {\n                val nr = i + dr[d]\n                val nc = j + dc[d]\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue\n                val lb = label[nr][nc]\n                if (lb == 0) continue\n                var dup = false\n                for (k in 0 until cnt) if (near[k] == lb) dup = true\n                if (dup) continue\n                near[cnt++] = lb\n                total += sizes[lb]\n            }\n            if (total > best) best = total\n        }\n    }\n    return best\n}`,
        swift: `func largestIsland(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var label = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    var sizes = [0, 0]\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var id = 2\n    for i in 0..<n {\n        for j in 0..<n {\n            if grid[i][j] != 1 || label[i][j] != 0 { continue }\n            var size = 0\n            var stack = [i * n + j]\n            label[i][j] = id\n            while let cur = stack.popLast() {\n                let r = cur / n, c = cur % n\n                size += 1\n                for d in 0..<4 {\n                    let nr = r + dr[d], nc = c + dc[d]\n                    if nr < 0 || nr >= n || nc < 0 || nc >= n { continue }\n                    if grid[nr][nc] != 1 || label[nr][nc] != 0 { continue }\n                    label[nr][nc] = id\n                    stack.append(nr * n + nc)\n                }\n            }\n            sizes.append(size)\n            id += 1\n        }\n    }\n    var best = 0\n    for k in 2..<sizes.count where sizes[k] > best { best = sizes[k] }\n    for i in 0..<n {\n        for j in 0..<n {\n            if grid[i][j] != 0 { continue }\n            var total = 1\n            var near = [Int]()\n            for d in 0..<4 {\n                let nr = i + dr[d], nc = j + dc[d]\n                if nr < 0 || nr >= n || nc < 0 || nc >= n { continue }\n                let lb = label[nr][nc]\n                if lb == 0 || near.contains(lb) { continue }\n                near.append(lb)\n                total += sizes[lb]\n            }\n            if total > best { best = total }\n        }\n    }\n    return best\n}`,
        rust: `fn largestIsland(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut label = vec![vec![0usize; n]; n];\n    let mut sizes: Vec<i32> = vec![0, 0];\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut id = 2usize;\n    for i in 0..n {\n        for j in 0..n {\n            if grid[i][j] != 1 || label[i][j] != 0 {\n                continue;\n            }\n            let mut size = 0i32;\n            let mut stack = vec![i * n + j];\n            label[i][j] = id;\n            while let Some(cur) = stack.pop() {\n                let r = (cur / n) as i32;\n                let c = (cur % n) as i32;\n                size += 1;\n                for d in 0..4 {\n                    let nr = r + dr[d];\n                    let nc = c + dc[d];\n                    if nr < 0 || nr >= n as i32 || nc < 0 || nc >= n as i32 {\n                        continue;\n                    }\n                    let (nr, nc) = (nr as usize, nc as usize);\n                    if grid[nr][nc] != 1 || label[nr][nc] != 0 {\n                        continue;\n                    }\n                    label[nr][nc] = id;\n                    stack.push(nr * n + nc);\n                }\n            }\n            sizes.push(size);\n            id += 1;\n        }\n    }\n    let mut best = 0i32;\n    for k in 2..sizes.len() {\n        if sizes[k] > best {\n            best = sizes[k];\n        }\n    }\n    for i in 0..n {\n        for j in 0..n {\n            if grid[i][j] != 0 {\n                continue;\n            }\n            let mut total = 1i32;\n            let mut near: Vec<usize> = Vec::new();\n            for d in 0..4 {\n                let nr = i as i32 + dr[d];\n                let nc = j as i32 + dc[d];\n                if nr < 0 || nr >= n as i32 || nc < 0 || nc >= n as i32 {\n                    continue;\n                }\n                let lb = label[nr as usize][nc as usize];\n                if lb == 0 || near.contains(&lb) {\n                    continue;\n                }\n                near.push(lb);\n                total += sizes[lb];\n            }\n            if total > best {\n                best = total;\n            }\n        }\n    }\n    best\n}`,
        php: `function largestIsland($grid) {\n    $n = count($grid);\n    $label = [];\n    for ($i = 0; $i < $n; $i++) $label[$i] = array_fill(0, $n, 0);\n    $sizes = [0, 0];\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $id = 2;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] !== 1 || $label[$i][$j] !== 0) continue;\n            $size = 0;\n            $stack = [$i * $n + $j];\n            $label[$i][$j] = $id;\n            while (count($stack) > 0) {\n                $cur = array_pop($stack);\n                $r = intdiv($cur, $n);\n                $c = $cur % $n;\n                $size++;\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $r + $dr[$d];\n                    $nc = $c + $dc[$d];\n                    if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $n) continue;\n                    if ($grid[$nr][$nc] !== 1 || $label[$nr][$nc] !== 0) continue;\n                    $label[$nr][$nc] = $id;\n                    $stack[] = $nr * $n + $nc;\n                }\n            }\n            $sizes[] = $size;\n            $id++;\n        }\n    }\n    $best = 0;\n    for ($k = 2; $k < count($sizes); $k++) if ($sizes[$k] > $best) $best = $sizes[$k];\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] !== 0) continue;\n            $total = 1;\n            $near = [];\n            for ($d = 0; $d < 4; $d++) {\n                $nr = $i + $dr[$d];\n                $nc = $j + $dc[$d];\n                if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $n) continue;\n                $lb = $label[$nr][$nc];\n                if ($lb === 0 || in_array($lb, $near, true)) continue;\n                $near[] = $lb;\n                $total += $sizes[$lb];\n            }\n            if ($total > $best) $best = $total;\n        }\n    }\n    return $best;\n}`,
        ruby: `def largestIsland(grid)\n  n = grid.length\n  label = Array.new(n) { Array.new(n, 0) }\n  sizes = [0, 0]\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  id = 2\n  (0...n).each do |i|\n    (0...n).each do |j|\n      next if grid[i][j] != 1 || label[i][j] != 0\n      size = 0\n      stack = [i * n + j]\n      label[i][j] = id\n      until stack.empty?\n        cur = stack.pop\n        r = cur / n\n        c = cur % n\n        size += 1\n        (0...4).each do |d|\n          nr = r + dr[d]\n          nc = c + dc[d]\n          next if nr < 0 || nr >= n || nc < 0 || nc >= n\n          next if grid[nr][nc] != 1 || label[nr][nc] != 0\n          label[nr][nc] = id\n          stack << nr * n + nc\n        end\n      end\n      sizes << size\n      id += 1\n    end\n  end\n  best = sizes.max\n  (0...n).each do |i|\n    (0...n).each do |j|\n      next if grid[i][j] != 0\n      total = 1\n      near = []\n      (0...4).each do |d|\n        nr = i + dr[d]\n        nc = j + dc[d]\n        next if nr < 0 || nr >= n || nc < 0 || nc >= n\n        lb = label[nr][nc]\n        next if lb == 0 || near.include?(lb)\n        near << lb\n        total += sizes[lb]\n      end\n      best = total if total > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Moves to Spread Stones Over Grid (LC 2850) ──────────
  (() => {
    const ref = (grid: number[][]) => {
      const from: number[][] = [], to: number[][] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (grid[i][j] > 1) for (let k = 1; k < grid[i][j]; k++) from.push([i, j]);
          else if (grid[i][j] === 0) to.push([i, j]);
        }
      }
      const k = from.length;
      const used = new Array(k).fill(false);
      let best = Infinity;
      const walk = (idx: number, cost: number) => {
        if (cost >= best) return;
        if (idx === k) { best = cost; return; }
        for (let t = 0; t < k; t++) {
          if (used[t]) continue;
          used[t] = true;
          walk(idx + 1, cost + Math.abs(from[t][0] - to[idx][0]) + Math.abs(from[t][1] - to[idx][1]));
          used[t] = false;
        }
      };
      walk(0, 0);
      return best === Infinity ? 0 : best;
    };
    return {
      slug: "minimum-moves-to-spread-stones-over-grid",
      title: "Minimum Moves to Spread Stones Over Grid",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Breadth-First Search", "Amazon", "Google", "Zomato"],
      signature: { funcName: "minimumMoves", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A `3 × 3` grid holds nine stones in total, but some cells may hold several and some none. In one move you may take **one** stone from a cell and move it to an adjacent cell — up, down, left or right.\n\nReturn the minimum number of moves needed to leave exactly one stone in every cell.",
        [
          { in: "grid = [[1,1,0],[1,1,1],[1,2,1]]", out: "3", note: "Walk a stone from `(2,1)` up and left to the empty `(0,2)`." },
          { in: "grid = [[1,3,0],[1,0,0],[1,0,3]]", out: "4" },
          { in: "grid = [[1,1,1],[1,1,1],[1,1,1]]", out: "0" },
        ],
        ["grid.length == grid[i].length == 3", "0 <= grid[i][j] <= 9", "The sum of grid is 9."]),
      hints: [
        "Break the problem into single stones: a cell holding `c > 1` has `c - 1` spare stones, and a cell holding 0 needs one.",
        "Moving one stone from `(a,b)` to `(x,y)` costs the Manhattan distance, since nothing blocks the way.",
        "So the answer is the cheapest way to pair up the spares with the holes — at most 8 of each.",
      ],
      editorial: explain({
        idea: "Reduce to an assignment problem. Each surplus stone must end in some empty cell, the cost of a pairing is the Manhattan distance, and the answer is the minimum-cost perfect matching between the two equal-sized lists.",
        steps: [
          "Build `from`, one entry per spare stone (a cell with `c` stones contributes `c - 1`).",
          "Build `to`, one entry per empty cell. The two lists have the same length because the grid sums to 9.",
          "Try every way to assign spares to holes, summing Manhattan distances, and keep the cheapest.",
          "Prune a branch as soon as its partial cost reaches the best found.",
        ],
        why: "A stone can always travel along a shortest Manhattan route — the other stones never block it, since a cell may hold any number on the way — so the cost of a pairing really is the sum of distances, and no cleverer routing exists. Both lists have at most 8 entries, so `8! = 40 320` assignments is trivially searchable; bitmask DP over the holes is the `O(2^k · k)` refinement.",
        time: "O(k!) with pruning, k <= 8 — or O(2^k · k) with bitmask DP",
        space: "O(k)",
        pitfalls: [
          "A cell with `c` stones has `c - 1` spares, not `c`.",
          "Stones do not obstruct each other, so the cost is plain Manhattan distance — no BFS needed.",
          "An already-correct grid answers 0; the search must handle both lists being empty.",
        ],
      }),
      examples: [
        { input: "[[1,1,0],[1,1,1],[1,2,1]]", expectedOutput: "3" },
        { input: "[[1,3,0],[1,0,0],[1,0,3]]", expectedOutput: "4" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        // Deal nine stones into the nine cells so the sum is always 9.
        const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let s = 0; s < 9; s++) {
          const c = ri(rng, 0, 8);
          grid[Math.floor(c / 3)][c % 3]++;
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumMoves(grid: List[List[int]]) -> int:\n    src, dst = [], []\n    for i in range(3):\n        for j in range(3):\n            if grid[i][j] > 1:\n                src.extend([(i, j)] * (grid[i][j] - 1))\n            elif grid[i][j] == 0:\n                dst.append((i, j))\n    k = len(src)\n    used = [False] * k\n    best = [float('inf')]\n\n    def walk(idx: int, cost: int) -> None:\n        if cost >= best[0]:\n            return\n        if idx == k:\n            best[0] = cost\n            return\n        for t in range(k):\n            if used[t]:\n                continue\n            used[t] = True\n            walk(idx + 1, cost + abs(src[t][0] - dst[idx][0]) + abs(src[t][1] - dst[idx][1]))\n            used[t] = False\n\n    walk(0, 0)\n    return 0 if best[0] == float('inf') else best[0]`,
        javascript: `var minimumMoves = function(grid) {\n    var from = [], to = [], i, j, kk;\n    for (i = 0; i < 3; i++) {\n        for (j = 0; j < 3; j++) {\n            if (grid[i][j] > 1) {\n                for (kk = 1; kk < grid[i][j]; kk++) from.push([i, j]);\n            } else if (grid[i][j] === 0) {\n                to.push([i, j]);\n            }\n        }\n    }\n    var k = from.length;\n    var used = [];\n    for (i = 0; i < k; i++) used.push(false);\n    var best = Infinity;\n    var walk = function(idx, cost) {\n        if (cost >= best) return;\n        if (idx === k) { best = cost; return; }\n        for (var t = 0; t < k; t++) {\n            if (used[t]) continue;\n            used[t] = true;\n            walk(idx + 1, cost + Math.abs(from[t][0] - to[idx][0]) + Math.abs(from[t][1] - to[idx][1]));\n            used[t] = false;\n        }\n    };\n    walk(0, 0);\n    return best === Infinity ? 0 : best;\n};`,
        typescript: `function minimumMoves(grid: number[][]): number {\n    var from: number[][] = [], to: number[][] = [], i: number, j: number, kk: number;\n    for (i = 0; i < 3; i++) {\n        for (j = 0; j < 3; j++) {\n            if (grid[i][j] > 1) {\n                for (kk = 1; kk < grid[i][j]; kk++) from.push([i, j]);\n            } else if (grid[i][j] === 0) {\n                to.push([i, j]);\n            }\n        }\n    }\n    var k = from.length;\n    var used: boolean[] = [];\n    for (i = 0; i < k; i++) used.push(false);\n    var best = 1e9;\n    var walk = function(idx: number, cost: number): void {\n        if (cost >= best) return;\n        if (idx === k) { best = cost; return; }\n        for (var t = 0; t < k; t++) {\n            if (used[t]) continue;\n            used[t] = true;\n            walk(idx + 1, cost + Math.abs(from[t][0] - to[idx][0]) + Math.abs(from[t][1] - to[idx][1]));\n            used[t] = false;\n        }\n    };\n    walk(0, 0);\n    return best === 1e9 ? 0 : best;\n}`,
        java: `public static int minimumMoves(int[][] grid) {\n    List<int[]> from = new ArrayList<>(), to = new ArrayList<>();\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            if (grid[i][j] > 1) {\n                for (int k = 1; k < grid[i][j]; k++) from.add(new int[] { i, j });\n            } else if (grid[i][j] == 0) {\n                to.add(new int[] { i, j });\n            }\n        }\n    }\n    int k = from.size();\n    if (k == 0) return 0;\n    int full = 1 << k;\n    int[] dp = new int[full];\n    Arrays.fill(dp, Integer.MAX_VALUE / 2);\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        int idx = Integer.bitCount(mask);\n        if (idx == k || dp[mask] >= Integer.MAX_VALUE / 2) continue;\n        for (int t = 0; t < k; t++) {\n            if ((mask & (1 << t)) != 0) continue;\n            int cost = Math.abs(from.get(t)[0] - to.get(idx)[0]) + Math.abs(from.get(t)[1] - to.get(idx)[1]);\n            dp[mask | (1 << t)] = Math.min(dp[mask | (1 << t)], dp[mask] + cost);\n        }\n    }\n    return dp[full - 1];\n}`,
        cpp: `int minimumMoves(vector<vector<int>>& grid) {\n    vector<pair<int,int>> from, to;\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            if (grid[i][j] > 1) {\n                for (int k = 1; k < grid[i][j]; k++) from.push_back({ i, j });\n            } else if (grid[i][j] == 0) {\n                to.push_back({ i, j });\n            }\n        }\n    }\n    int k = (int) from.size();\n    if (k == 0) return 0;\n    int full = 1 << k;\n    vector<int> dp(full, 1 << 29);\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        if (dp[mask] >= (1 << 29)) continue;\n        int idx = __builtin_popcount(mask);\n        if (idx == k) continue;\n        for (int t = 0; t < k; t++) {\n            if (mask & (1 << t)) continue;\n            int cost = abs(from[t].first - to[idx].first) + abs(from[t].second - to[idx].second);\n            dp[mask | (1 << t)] = min(dp[mask | (1 << t)], dp[mask] + cost);\n        }\n    }\n    return dp[full - 1];\n}`,
        c: `int minimumMoves(int** grid, int gridSize, int* gridColSize) {\n    (void) gridSize;\n    (void) gridColSize;\n    int fr[9], fc[9], tr[9], tc[9];\n    int k = 0, t2 = 0;\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++) {\n            if (grid[i][j] > 1) {\n                for (int k2 = 1; k2 < grid[i][j]; k2++) { fr[k] = i; fc[k] = j; k++; }\n            } else if (grid[i][j] == 0) {\n                tr[t2] = i; tc[t2] = j; t2++;\n            }\n        }\n    }\n    if (k == 0) return 0;\n    int full = 1 << k;\n    int* dp = (int*) malloc((size_t) full * sizeof(int));\n    for (int m = 0; m < full; m++) dp[m] = 1 << 29;\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        if (dp[mask] >= (1 << 29)) continue;\n        int idx = 0, tmp = mask;\n        while (tmp) { idx += tmp & 1; tmp >>= 1; }\n        if (idx == k) continue;\n        for (int t = 0; t < k; t++) {\n            if (mask & (1 << t)) continue;\n            int dr = fr[t] - tr[idx];\n            int dc = fc[t] - tc[idx];\n            if (dr < 0) dr = -dr;\n            if (dc < 0) dc = -dc;\n            int nxt = mask | (1 << t);\n            if (dp[mask] + dr + dc < dp[nxt]) dp[nxt] = dp[mask] + dr + dc;\n        }\n    }\n    int ans = dp[full - 1];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int MinimumMoves(int[][] grid)\n{\n    var from = new List<int[]>();\n    var to = new List<int[]>();\n    for (int i = 0; i < 3; i++)\n    {\n        for (int j = 0; j < 3; j++)\n        {\n            if (grid[i][j] > 1)\n            {\n                for (int k = 1; k < grid[i][j]; k++) from.Add(new int[] { i, j });\n            }\n            else if (grid[i][j] == 0)\n            {\n                to.Add(new int[] { i, j });\n            }\n        }\n    }\n    int len = from.Count;\n    if (len == 0) return 0;\n    int full = 1 << len;\n    var dp = new int[full];\n    for (int m = 0; m < full; m++) dp[m] = 1 << 29;\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++)\n    {\n        if (dp[mask] >= (1 << 29)) continue;\n        int idx = 0, tmp = mask;\n        while (tmp != 0) { idx += tmp & 1; tmp >>= 1; }\n        if (idx == len) continue;\n        for (int t = 0; t < len; t++)\n        {\n            if ((mask & (1 << t)) != 0) continue;\n            int cost = Math.Abs(from[t][0] - to[idx][0]) + Math.Abs(from[t][1] - to[idx][1]);\n            int nxt = mask | (1 << t);\n            if (dp[mask] + cost < dp[nxt]) dp[nxt] = dp[mask] + cost;\n        }\n    }\n    return dp[full - 1];\n}`,
        go: `func minimumMoves(grid [][]int) int {\n\tfrom := [][2]int{}\n\tto := [][2]int{}\n\tfor i := 0; i < 3; i++ {\n\t\tfor j := 0; j < 3; j++ {\n\t\t\tif grid[i][j] > 1 {\n\t\t\t\tfor k := 1; k < grid[i][j]; k++ {\n\t\t\t\t\tfrom = append(from, [2]int{i, j})\n\t\t\t\t}\n\t\t\t} else if grid[i][j] == 0 {\n\t\t\t\tto = append(to, [2]int{i, j})\n\t\t\t}\n\t\t}\n\t}\n\tk := len(from)\n\tif k == 0 {\n\t\treturn 0\n\t}\n\tabs := func(x int) int {\n\t\tif x < 0 {\n\t\t\treturn -x\n\t\t}\n\t\treturn x\n\t}\n\tfull := 1 << uint(k)\n\tdp := make([]int, full)\n\tfor m := range dp {\n\t\tdp[m] = 1 << 29\n\t}\n\tdp[0] = 0\n\tfor mask := 0; mask < full; mask++ {\n\t\tif dp[mask] >= 1<<29 {\n\t\t\tcontinue\n\t\t}\n\t\tidx := bits.OnesCount(uint(mask))\n\t\tif idx == k {\n\t\t\tcontinue\n\t\t}\n\t\tfor t := 0; t < k; t++ {\n\t\t\tif mask&(1<<uint(t)) != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tcost := abs(from[t][0]-to[idx][0]) + abs(from[t][1]-to[idx][1])\n\t\t\tnxt := mask | 1<<uint(t)\n\t\t\tif dp[mask]+cost < dp[nxt] {\n\t\t\t\tdp[nxt] = dp[mask] + cost\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[full-1]\n}`,
        kotlin: `fun minimumMoves(grid: Array<IntArray>): Int {\n    val from = ArrayList<IntArray>()\n    val to = ArrayList<IntArray>()\n    for (i in 0 until 3) {\n        for (j in 0 until 3) {\n            if (grid[i][j] > 1) {\n                for (k in 1 until grid[i][j]) from.add(intArrayOf(i, j))\n            } else if (grid[i][j] == 0) {\n                to.add(intArrayOf(i, j))\n            }\n        }\n    }\n    val k = from.size\n    if (k == 0) return 0\n    val full = 1 shl k\n    val dp = IntArray(full) { 1 shl 29 }\n    dp[0] = 0\n    for (mask in 0 until full) {\n        if (dp[mask] >= (1 shl 29)) continue\n        val idx = Integer.bitCount(mask)\n        if (idx == k) continue\n        for (t in 0 until k) {\n            if (mask and (1 shl t) != 0) continue\n            val cost = Math.abs(from[t][0] - to[idx][0]) + Math.abs(from[t][1] - to[idx][1])\n            val nxt = mask or (1 shl t)\n            if (dp[mask] + cost < dp[nxt]) dp[nxt] = dp[mask] + cost\n        }\n    }\n    return dp[full - 1]\n}`,
        swift: `func minimumMoves(_ grid: [[Int]]) -> Int {\n    var from = [(Int, Int)]()\n    var to = [(Int, Int)]()\n    for i in 0..<3 {\n        for j in 0..<3 {\n            if grid[i][j] > 1 {\n                for _ in 1..<grid[i][j] { from.append((i, j)) }\n            } else if grid[i][j] == 0 {\n                to.append((i, j))\n            }\n        }\n    }\n    let k = from.count\n    if k == 0 { return 0 }\n    let full = 1 << k\n    var dp = [Int](repeating: 1 << 29, count: full)\n    dp[0] = 0\n    for mask in 0..<full {\n        if dp[mask] >= (1 << 29) { continue }\n        let idx = mask.nonzeroBitCount\n        if idx == k { continue }\n        for t in 0..<k {\n            if mask & (1 << t) != 0 { continue }\n            let cost = abs(from[t].0 - to[idx].0) + abs(from[t].1 - to[idx].1)\n            let nxt = mask | (1 << t)\n            if dp[mask] + cost < dp[nxt] { dp[nxt] = dp[mask] + cost }\n        }\n    }\n    return dp[full - 1]\n}`,
        rust: `fn minimumMoves(grid: Vec<Vec<i32>>) -> i32 {\n    let mut from: Vec<(i32, i32)> = Vec::new();\n    let mut to: Vec<(i32, i32)> = Vec::new();\n    for i in 0..3 {\n        for j in 0..3 {\n            if grid[i][j] > 1 {\n                for _ in 1..grid[i][j] {\n                    from.push((i as i32, j as i32));\n                }\n            } else if grid[i][j] == 0 {\n                to.push((i as i32, j as i32));\n            }\n        }\n    }\n    let k = from.len();\n    if k == 0 {\n        return 0;\n    }\n    let full = 1usize << k;\n    let mut dp = vec![1 << 29; full];\n    dp[0] = 0;\n    for mask in 0..full {\n        if dp[mask] >= (1 << 29) {\n            continue;\n        }\n        let idx = (mask as u32).count_ones() as usize;\n        if idx == k {\n            continue;\n        }\n        for t in 0..k {\n            if mask & (1 << t) != 0 {\n                continue;\n            }\n            let cost = (from[t].0 - to[idx].0).abs() + (from[t].1 - to[idx].1).abs();\n            let nxt = mask | (1 << t);\n            if dp[mask] + cost < dp[nxt] {\n                dp[nxt] = dp[mask] + cost;\n            }\n        }\n    }\n    dp[full - 1]\n}`,
        php: `function minimumMoves($grid) {\n    $from = [];\n    $to = [];\n    for ($i = 0; $i < 3; $i++) {\n        for ($j = 0; $j < 3; $j++) {\n            if ($grid[$i][$j] > 1) {\n                for ($k = 1; $k < $grid[$i][$j]; $k++) $from[] = [$i, $j];\n            } elseif ($grid[$i][$j] === 0) {\n                $to[] = [$i, $j];\n            }\n        }\n    }\n    $k = count($from);\n    if ($k === 0) return 0;\n    $full = 1 << $k;\n    $dp = array_fill(0, $full, 1 << 29);\n    $dp[0] = 0;\n    for ($mask = 0; $mask < $full; $mask++) {\n        if ($dp[$mask] >= (1 << 29)) continue;\n        $idx = 0;\n        $tmp = $mask;\n        while ($tmp) { $idx += $tmp & 1; $tmp >>= 1; }\n        if ($idx === $k) continue;\n        for ($t = 0; $t < $k; $t++) {\n            if ($mask & (1 << $t)) continue;\n            $cost = abs($from[$t][0] - $to[$idx][0]) + abs($from[$t][1] - $to[$idx][1]);\n            $nxt = $mask | (1 << $t);\n            if ($dp[$mask] + $cost < $dp[$nxt]) $dp[$nxt] = $dp[$mask] + $cost;\n        }\n    }\n    return $dp[$full - 1];\n}`,
        ruby: `def minimumMoves(grid)\n  from = []\n  to = []\n  (0...3).each do |i|\n    (0...3).each do |j|\n      if grid[i][j] > 1\n        (1...grid[i][j]).each { from << [i, j] }\n      elsif grid[i][j] == 0\n        to << [i, j]\n      end\n    end\n  end\n  k = from.length\n  return 0 if k == 0\n  full = 1 << k\n  dp = Array.new(full, 1 << 29)\n  dp[0] = 0\n  (0...full).each do |mask|\n    next if dp[mask] >= (1 << 29)\n    idx = mask.to_s(2).count('1')\n    next if idx == k\n    (0...k).each do |t|\n      next if mask & (1 << t) != 0\n      cost = (from[t][0] - to[idx][0]).abs + (from[t][1] - to[idx][1]).abs\n      nxt = mask | (1 << t)\n      dp[nxt] = dp[mask] + cost if dp[mask] + cost < dp[nxt]\n    end\n  end\n  dp[full - 1]\nend`,
      },
    };
  })(),

  // ── Shortest Distance from All Buildings (LC 317) ───────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const total = new Array(m * n).fill(0);
      const reach = new Array(m * n).fill(0);
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let buildings = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] !== 1) continue;
          buildings++;
          const dist = new Array(m * n).fill(-1);
          dist[i * n + j] = 0;
          const q = [i * n + j];
          let head = 0;
          while (head < q.length) {
            const cur = q[head++];
            const r = Math.floor(cur / n), c = cur % n;
            for (let d = 0; d < 4; d++) {
              const nr = r + dr[d], nc = c + dc[d];
              if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
              const key = nr * n + nc;
              if (dist[key] >= 0 || grid[nr][nc] !== 0) continue;
              dist[key] = dist[cur] + 1;
              total[key] += dist[key];
              reach[key]++;
              q.push(key);
            }
          }
        }
      }
      let best = -1;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          const key = i * n + j;
          if (grid[i][j] !== 0 || reach[key] !== buildings) continue;
          if (best < 0 || total[key] < best) best = total[key];
        }
      }
      return buildings === 0 ? -1 : best;
    };
    return {
      slug: "shortest-distance-from-all-buildings",
      title: "Shortest Distance from All Buildings",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Breadth-First Search", "Google", "Facebook", "Amazon"],
      signature: { funcName: "shortestDistance", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A grid holds `0` for empty land, `1` for a building and `2` for an obstacle. You want to build a house on an **empty** cell so that the total travel distance to **all** buildings is as small as possible. Travel is 4-directional and passes only through empty land.\n\nReturn that smallest total distance, or `-1` if no empty cell can reach every building.",
        [
          { in: "grid = [[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]]", out: "7", note: "The cell `(1,2)` is 3 + 3 + 1 away from the three buildings." },
          { in: "grid = [[1,0]]", out: "1" },
          { in: "grid = [[1]]", out: "-1", note: "There is no empty cell at all." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "grid[i][j] is 0, 1 or 2", "There is at least one building."]),
      hints: [
        "Distances must be measured *through empty land*, so Manhattan distance is wrong.",
        "Run a breadth-first search from each **building**, not from each candidate cell — there are usually far fewer buildings.",
        "Accumulate, per empty cell, the distance total and how many buildings reached it.",
      ],
      editorial: explain({
        idea: "Sweep once per building: a BFS from a building labels every empty cell it can reach with its distance. Adding those into per-cell totals, plus a count of how many buildings got there, answers every candidate at once.",
        steps: [
          "For each building, BFS outward through empty cells only.",
          "Add each cell's distance into `total[cell]` and increment `reach[cell]`.",
          "After all buildings, scan the empty cells whose `reach` equals the building count.",
          "Return the smallest `total` among them, or `-1` if there is none.",
        ],
        why: "Running the BFS from the buildings rather than from each candidate cell is what keeps it affordable: `buildings · m · n` instead of `emptyCells · m · n`, and a grid is usually mostly empty. The `reach` counter is essential — a cell that some building cannot reach is not a valid site no matter how small its partial total is.",
        time: "O(buildings · m · n)",
        space: "O(m · n)",
        pitfalls: [
          "A cell reachable by only some buildings must be rejected, not scored.",
          "The BFS walks through `0` cells only; a building is never a through-route.",
          "Each building needs its own visited grid, or later searches stop early.",
        ],
      }),
      examples: [
        { input: "[[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]]", expectedOutput: "7" },
        { input: "[[1,0]]", expectedOutput: "1" },
        { input: "[[1]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => pick(rng, [0, 0, 0, 0, 1, 2])));
        // The statement promises at least one building.
        grid[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] = 1;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef shortestDistance(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    total = [0] * (m * n)\n    reach = [0] * (m * n)\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    buildings = 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] != 1:\n                continue\n            buildings += 1\n            dist = [-1] * (m * n)\n            dist[i * n + j] = 0\n            q = deque([(i, j)])\n            while q:\n                r, c = q.popleft()\n                for di, dj in dirs:\n                    nr, nc = r + di, c + dj\n                    if not (0 <= nr < m and 0 <= nc < n):\n                        continue\n                    key = nr * n + nc\n                    if dist[key] >= 0 or grid[nr][nc] != 0:\n                        continue\n                    dist[key] = dist[r * n + c] + 1\n                    total[key] += dist[key]\n                    reach[key] += 1\n                    q.append((nr, nc))\n    best = -1\n    for i in range(m):\n        for j in range(n):\n            key = i * n + j\n            if grid[i][j] != 0 or reach[key] != buildings:\n                continue\n            if best < 0 or total[key] < best:\n                best = total[key]\n    return best`,
        javascript: `var shortestDistance = function(grid) {\n    var m = grid.length, n = grid[0].length, i, j, d;\n    var total = [], reach = [];\n    for (i = 0; i < m * n; i++) { total.push(0); reach.push(0); }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var buildings = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 1) continue;\n            buildings++;\n            var dist = [];\n            for (var t = 0; t < m * n; t++) dist.push(-1);\n            dist[i * n + j] = 0;\n            var q = [i * n + j];\n            var head = 0;\n            while (head < q.length) {\n                var cur = q[head++];\n                var r = Math.floor(cur / n), c = cur % n;\n                for (d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    var key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] !== 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q.push(key);\n                }\n            }\n        }\n    }\n    var best = -1;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            var k = i * n + j;\n            if (grid[i][j] !== 0 || reach[k] !== buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    return best;\n};`,
        typescript: `function shortestDistance(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, i: number, j: number, d: number;\n    var total: number[] = [], reach: number[] = [];\n    for (i = 0; i < m * n; i++) { total.push(0); reach.push(0); }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var buildings = 0;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] !== 1) continue;\n            buildings++;\n            var dist: number[] = [];\n            for (var t = 0; t < m * n; t++) dist.push(-1);\n            dist[i * n + j] = 0;\n            var q: number[] = [i * n + j];\n            var head = 0;\n            while (head < q.length) {\n                var cur = q[head++];\n                var r = Math.floor(cur / n), c = cur % n;\n                for (d = 0; d < 4; d++) {\n                    var nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    var key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] !== 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q.push(key);\n                }\n            }\n        }\n    }\n    var best = -1;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            var k = i * n + j;\n            if (grid[i][j] !== 0 || reach[k] !== buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    return best;\n}`,
        java: `public static int shortestDistance(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[] total = new int[m * n];\n    int[] reach = new int[m * n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int buildings = 0;\n    int[] q = new int[m * n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            buildings++;\n            int[] dist = new int[m * n];\n            Arrays.fill(dist, -1);\n            dist[i * n + j] = 0;\n            int head = 0, tail = 0;\n            q[tail++] = i * n + j;\n            while (head < tail) {\n                int cur = q[head++];\n                int r = cur / n, c = cur % n;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    int key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] != 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q[tail++] = key;\n                }\n            }\n        }\n    }\n    int best = -1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int k = i * n + j;\n            if (grid[i][j] != 0 || reach[k] != buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    return best;\n}`,
        cpp: `int shortestDistance(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> total(m * n, 0), reach(m * n, 0);\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int buildings = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            buildings++;\n            vector<int> dist(m * n, -1);\n            dist[i * n + j] = 0;\n            vector<int> q;\n            q.push_back(i * n + j);\n            for (size_t head = 0; head < q.size(); head++) {\n                int cur = q[head];\n                int r = cur / n, c = cur % n;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    int key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] != 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q.push_back(key);\n                }\n            }\n        }\n    }\n    int best = -1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int k = i * n + j;\n            if (grid[i][j] != 0 || reach[k] != buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    return best;\n}`,
        c: `int shortestDistance(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int cells = m * n;\n    int* total = (int*) calloc((size_t) cells, sizeof(int));\n    int* reach = (int*) calloc((size_t) cells, sizeof(int));\n    int* dist = (int*) malloc((size_t) cells * sizeof(int));\n    int* q = (int*) malloc((size_t) cells * sizeof(int));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int buildings = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            buildings++;\n            for (int k = 0; k < cells; k++) dist[k] = -1;\n            dist[i * n + j] = 0;\n            int head = 0, tail = 0;\n            q[tail++] = i * n + j;\n            while (head < tail) {\n                int cur = q[head++];\n                int r = cur / n, c = cur % n;\n                for (int d = 0; d < 4; d++) {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    int key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] != 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q[tail++] = key;\n                }\n            }\n        }\n    }\n    int best = -1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int k = i * n + j;\n            if (grid[i][j] != 0 || reach[k] != buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    free(total);\n    free(reach);\n    free(dist);\n    free(q);\n    return best;\n}`,
        csharp: `public static int ShortestDistance(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    int cells = m * n;\n    var total = new int[cells];\n    var reach = new int[cells];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int buildings = 0;\n    var q = new int[cells];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] != 1) continue;\n            buildings++;\n            var dist = new int[cells];\n            for (int k = 0; k < cells; k++) dist[k] = -1;\n            dist[i * n + j] = 0;\n            int head = 0, tail = 0;\n            q[tail++] = i * n + j;\n            while (head < tail)\n            {\n                int cur = q[head++];\n                int r = cur / n, c = cur % n;\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = r + dr[d], nc = c + dc[d];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    int key = nr * n + nc;\n                    if (dist[key] >= 0 || grid[nr][nc] != 0) continue;\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key]++;\n                    q[tail++] = key;\n                }\n            }\n        }\n    }\n    int best = -1;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            int k = i * n + j;\n            if (grid[i][j] != 0 || reach[k] != buildings) continue;\n            if (best < 0 || total[k] < best) best = total[k];\n        }\n    }\n    return best;\n}`,
        go: `func shortestDistance(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tcells := m * n\n\ttotal := make([]int, cells)\n\treach := make([]int, cells)\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tbuildings := 0\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] != 1 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tbuildings++\n\t\t\tdist := make([]int, cells)\n\t\t\tfor k := range dist {\n\t\t\t\tdist[k] = -1\n\t\t\t}\n\t\t\tdist[i*n+j] = 0\n\t\t\tq := []int{i*n + j}\n\t\t\tfor head := 0; head < len(q); head++ {\n\t\t\t\tcur := q[head]\n\t\t\t\tr, c := cur/n, cur%n\n\t\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tkey := nr*n + nc\n\t\t\t\t\tif dist[key] >= 0 || grid[nr][nc] != 0 {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tdist[key] = dist[cur] + 1\n\t\t\t\t\ttotal[key] += dist[key]\n\t\t\t\t\treach[key]++\n\t\t\t\t\tq = append(q, key)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\tbest := -1\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tk := i*n + j\n\t\t\tif grid[i][j] != 0 || reach[k] != buildings {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif best < 0 || total[k] < best {\n\t\t\t\tbest = total[k]\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun shortestDistance(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val cells = m * n\n    val total = IntArray(cells)\n    val reach = IntArray(cells)\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var buildings = 0\n    val q = IntArray(cells)\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (grid[i][j] != 1) continue\n            buildings++\n            val dist = IntArray(cells) { -1 }\n            dist[i * n + j] = 0\n            var head = 0\n            var tail = 0\n            q[tail++] = i * n + j\n            while (head < tail) {\n                val cur = q[head++]\n                val r = cur / n\n                val c = cur % n\n                for (d in 0 until 4) {\n                    val nr = r + dr[d]\n                    val nc = c + dc[d]\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                    val key = nr * n + nc\n                    if (dist[key] >= 0 || grid[nr][nc] != 0) continue\n                    dist[key] = dist[cur] + 1\n                    total[key] += dist[key]\n                    reach[key]++\n                    q[tail++] = key\n                }\n            }\n        }\n    }\n    var best = -1\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            val k = i * n + j\n            if (grid[i][j] != 0 || reach[k] != buildings) continue\n            if (best < 0 || total[k] < best) best = total[k]\n        }\n    }\n    return best\n}`,
        swift: `func shortestDistance(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    let cells = m * n\n    var total = [Int](repeating: 0, count: cells)\n    var reach = [Int](repeating: 0, count: cells)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var buildings = 0\n    for i in 0..<m {\n        for j in 0..<n {\n            if grid[i][j] != 1 { continue }\n            buildings += 1\n            var dist = [Int](repeating: -1, count: cells)\n            dist[i * n + j] = 0\n            var q = [i * n + j]\n            var head = 0\n            while head < q.count {\n                let cur = q[head]\n                head += 1\n                let r = cur / n, c = cur % n\n                for d in 0..<4 {\n                    let nr = r + dr[d], nc = c + dc[d]\n                    if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                    let key = nr * n + nc\n                    if dist[key] >= 0 || grid[nr][nc] != 0 { continue }\n                    dist[key] = dist[cur] + 1\n                    total[key] += dist[key]\n                    reach[key] += 1\n                    q.append(key)\n                }\n            }\n        }\n    }\n    var best = -1\n    for i in 0..<m {\n        for j in 0..<n {\n            let k = i * n + j\n            if grid[i][j] != 0 || reach[k] != buildings { continue }\n            if best < 0 || total[k] < best { best = total[k] }\n        }\n    }\n    return best\n}`,
        rust: `fn shortestDistance(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    let cells = m * n;\n    let mut total = vec![0i32; cells];\n    let mut reach = vec![0i32; cells];\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut buildings = 0i32;\n    for i in 0..m {\n        for j in 0..n {\n            if grid[i][j] != 1 {\n                continue;\n            }\n            buildings += 1;\n            let mut dist = vec![-1i32; cells];\n            dist[i * n + j] = 0;\n            let mut q: Vec<usize> = vec![i * n + j];\n            let mut head = 0usize;\n            while head < q.len() {\n                let cur = q[head];\n                head += 1;\n                let r = (cur / n) as i32;\n                let c = (cur % n) as i32;\n                for d in 0..4 {\n                    let nr = r + dr[d];\n                    let nc = c + dc[d];\n                    if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                        continue;\n                    }\n                    let key = nr as usize * n + nc as usize;\n                    if dist[key] >= 0 || grid[nr as usize][nc as usize] != 0 {\n                        continue;\n                    }\n                    dist[key] = dist[cur] + 1;\n                    total[key] += dist[key];\n                    reach[key] += 1;\n                    q.push(key);\n                }\n            }\n        }\n    }\n    let mut best = -1i32;\n    for i in 0..m {\n        for j in 0..n {\n            let k = i * n + j;\n            if grid[i][j] != 0 || reach[k] != buildings {\n                continue;\n            }\n            if best < 0 || total[k] < best {\n                best = total[k];\n            }\n        }\n    }\n    best\n}`,
        php: `function shortestDistance($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $cells = $m * $n;\n    $total = array_fill(0, $cells, 0);\n    $reach = array_fill(0, $cells, 0);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $buildings = 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] !== 1) continue;\n            $buildings++;\n            $dist = array_fill(0, $cells, -1);\n            $dist[$i * $n + $j] = 0;\n            $q = [$i * $n + $j];\n            for ($head = 0; $head < count($q); $head++) {\n                $cur = $q[$head];\n                $r = intdiv($cur, $n);\n                $c = $cur % $n;\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $r + $dr[$d];\n                    $nc = $c + $dc[$d];\n                    if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                    $key = $nr * $n + $nc;\n                    if ($dist[$key] >= 0 || $grid[$nr][$nc] !== 0) continue;\n                    $dist[$key] = $dist[$cur] + 1;\n                    $total[$key] += $dist[$key];\n                    $reach[$key]++;\n                    $q[] = $key;\n                }\n            }\n        }\n    }\n    $best = -1;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            $k = $i * $n + $j;\n            if ($grid[$i][$j] !== 0 || $reach[$k] !== $buildings) continue;\n            if ($best < 0 || $total[$k] < $best) $best = $total[$k];\n        }\n    }\n    return $best;\n}`,
        ruby: `def shortestDistance(grid)\n  m = grid.length\n  n = grid[0].length\n  cells = m * n\n  total = Array.new(cells, 0)\n  reach = Array.new(cells, 0)\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  buildings = 0\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next if grid[i][j] != 1\n      buildings += 1\n      dist = Array.new(cells, -1)\n      dist[i * n + j] = 0\n      q = [i * n + j]\n      head = 0\n      while head < q.length\n        cur = q[head]\n        head += 1\n        r = cur / n\n        c = cur % n\n        (0...4).each do |d|\n          nr = r + dr[d]\n          nc = c + dc[d]\n          next if nr < 0 || nr >= m || nc < 0 || nc >= n\n          key = nr * n + nc\n          next if dist[key] >= 0 || grid[nr][nc] != 0\n          dist[key] = dist[cur] + 1\n          total[key] += dist[key]\n          reach[key] += 1\n          q << key\n        end\n      end\n    end\n  end\n  best = -1\n  (0...m).each do |i|\n    (0...n).each do |j|\n      k = i * n + j\n      next if grid[i][j] != 0 || reach[k] != buildings\n      best = total[k] if best < 0 || total[k] < best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Grid Illumination (LC 1001) ─────────────────────────────────
  (() => {
    const ref = (n: number, lamps: number[][], queries: number[][]) => {
      const rows = new Map<number, number>(), cols = new Map<number, number>();
      const diag = new Map<number, number>(), anti = new Map<number, number>();
      const on = new Set<number>();
      const bump = (m: Map<number, number>, k: number, d: number) => {
        const v = (m.get(k) || 0) + d;
        if (v === 0) m.delete(k); else m.set(k, v);
      };
      for (let i = 0; i < lamps.length; i++) {
        const r = lamps[i][0], c = lamps[i][1];
        const key = r * n + c;
        if (on.has(key)) continue;
        on.add(key);
        bump(rows, r, 1);
        bump(cols, c, 1);
        bump(diag, r - c, 1);
        bump(anti, r + c, 1);
      }
      const out: number[] = [];
      for (let i = 0; i < queries.length; i++) {
        const r = queries[i][0], c = queries[i][1];
        const lit = (rows.get(r) || 0) > 0 || (cols.get(c) || 0) > 0
          || (diag.get(r - c) || 0) > 0 || (anti.get(r + c) || 0) > 0;
        out.push(lit ? 1 : 0);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            const key = nr * n + nc;
            if (!on.has(key)) continue;
            on.delete(key);
            bump(rows, nr, -1);
            bump(cols, nc, -1);
            bump(diag, nr - nc, -1);
            bump(anti, nr + nc, -1);
          }
        }
      }
      return out;
    };
    return {
      slug: "grid-illumination",
      title: "Grid Illumination",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Matrix", "Amazon", "Google", "Adobe"],
      signature: { funcName: "gridIllumination", params: [{ name: "n", type: "int" as const }, { name: "lamps", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "On an `n × n` grid, each cell in `lamps` holds a lamp that is switched **on** (duplicates in `lamps` are the same single lamp). A lit lamp illuminates its whole row, its whole column and both of its diagonals.\n\nAnswer the queries in order. For each `queries[i] = [row, col]`, record `1` if that cell is illuminated and `0` otherwise, and then switch **off** every lamp in the 3 × 3 block centred on it (the cell itself and its eight neighbours), ignoring any part of the block outside the grid.",
        [
          { in: "n = 5, lamps = [[0,0],[4,4]], queries = [[1,1],[1,0]]", out: "[1,0]", note: "The first query is on the lamp's diagonal; answering it also switches that lamp off." },
          { in: "n = 5, lamps = [[0,0],[4,4]], queries = [[1,1],[1,1]]", out: "[1,1]", note: "The second query is lit by the lamp at `(4,4)`, which the first query did not reach." },
          { in: "n = 5, lamps = [[0,0],[0,4]], queries = [[0,4],[0,1],[1,4]]", out: "[1,1,0]" },
        ],
        ["1 <= n <= 10^4", "0 <= lamps.length <= 20000", "0 <= queries.length <= 20000", "lamps[i].length == 2", "0 <= lamps[i][0], lamps[i][1] < n", "queries[j].length == 2", "0 <= queries[j][0], queries[j][1] < n"]),
      hints: [
        "Never build the grid: `n` can be 10 000, and only the lamps matter.",
        "A cell is illuminated exactly when some lamp shares its row, its column, or one of its two diagonals.",
        "Keep four counters — by row, by column, by `row - col` and by `row + col` — plus a set of the lamps that are still on.",
      ],
      editorial: explain({
        idea: "Track, for each of the four line families, how many lit lamps lie on each line. A query is lit if any of its four lines has a non-zero count, and switching a lamp off decrements the four counts it contributed to.",
        steps: [
          "Insert each distinct lamp into a set and increment its row, column, `r - c` and `r + c` counters.",
          "For a query, read those four counters; a positive one means the cell is lit.",
          "Then, for each of the nine cells in the block, if a lamp is still on there, remove it and decrement its four counters.",
        ],
        why: "The row, column, and two diagonals through a cell are exactly the lines a lamp must lie on to illuminate it, so four counters are a complete test. Keeping a set of lamps still on is what makes turning off idempotent — switching off an already-dark cell must not decrement anything, and the same duplicate lamp must be inserted only once.",
        time: "O(lamps + queries)",
        space: "O(lamps)",
        pitfalls: [
          "Duplicate entries in `lamps` describe one lamp and must be counted once.",
          "The lamp's own cell is part of the 3 × 3 block that the query switches off.",
          "Decrementing a counter for a lamp that was already off corrupts every later query.",
        ],
      }),
      examples: [
        { input: "5\n[[0,0],[4,4]]\n[[1,1],[1,0]]", expectedOutput: "[1,0]" },
        { input: "5\n[[0,0],[4,4]]\n[[1,1],[1,1]]", expectedOutput: "[1,1]" },
        { input: "5\n[[0,0],[0,4]]\n[[0,4],[0,1],[1,4]]", expectedOutput: "[1,1,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const lamps = Array.from({ length: ri(rng, 1, 6) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        const queries = Array.from({ length: ri(rng, 1, 6) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        return { input: `${n}\n${fmtIntMat(lamps)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(n, lamps, queries)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict\n\ndef gridIllumination(n: int, lamps: List[List[int]], queries: List[List[int]]) -> List[int]:\n    rows, cols = defaultdict(int), defaultdict(int)\n    diag, anti = defaultdict(int), defaultdict(int)\n    on = set()\n    for r, c in lamps:\n        if (r, c) in on:\n            continue\n        on.add((r, c))\n        rows[r] += 1\n        cols[c] += 1\n        diag[r - c] += 1\n        anti[r + c] += 1\n    out = []\n    for r, c in queries:\n        lit = rows[r] > 0 or cols[c] > 0 or diag[r - c] > 0 or anti[r + c] > 0\n        out.append(1 if lit else 0)\n        for dr in (-1, 0, 1):\n            for dc in (-1, 0, 1):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < n and 0 <= nc < n and (nr, nc) in on:\n                    on.discard((nr, nc))\n                    rows[nr] -= 1\n                    cols[nc] -= 1\n                    diag[nr - nc] -= 1\n                    anti[nr + nc] -= 1\n    return out`,
        javascript: `var gridIllumination = function(n, lamps, queries) {\n    var rows = new Map(), cols = new Map(), diag = new Map(), anti = new Map();\n    var on = new Set();\n    var bump = function(m, k, d) {\n        var cur = m.get(k);\n        var v = (cur === undefined ? 0 : cur) + d;\n        if (v === 0) m["delete"](k); else m.set(k, v);\n    };\n    var get = function(m, k) {\n        var cur = m.get(k);\n        return cur === undefined ? 0 : cur;\n    };\n    var i, r, c, key;\n    for (i = 0; i < lamps.length; i++) {\n        r = lamps[i][0];\n        c = lamps[i][1];\n        key = r * n + c;\n        if (on.has(key)) continue;\n        on.add(key);\n        bump(rows, r, 1);\n        bump(cols, c, 1);\n        bump(diag, r - c, 1);\n        bump(anti, r + c, 1);\n    }\n    var out = [];\n    for (i = 0; i < queries.length; i++) {\n        r = queries[i][0];\n        c = queries[i][1];\n        var lit = get(rows, r) > 0 || get(cols, c) > 0 || get(diag, r - c) > 0 || get(anti, r + c) > 0;\n        out.push(lit ? 1 : 0);\n        for (var dr = -1; dr <= 1; dr++) {\n            for (var dc = -1; dc <= 1; dc++) {\n                var nr = r + dr, nc = c + dc;\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                key = nr * n + nc;\n                if (!on.has(key)) continue;\n                on["delete"](key);\n                bump(rows, nr, -1);\n                bump(cols, nc, -1);\n                bump(diag, nr - nc, -1);\n                bump(anti, nr + nc, -1);\n            }\n        }\n    }\n    return out;\n};`,
        typescript: `function gridIllumination(n: number, lamps: number[][], queries: number[][]): number[] {\n    var rows: { [k: string]: number } = {}, cols: { [k: string]: number } = {};\n    var diag: { [k: string]: number } = {}, anti: { [k: string]: number } = {};\n    var on: { [k: string]: boolean } = {};\n    var bump = function(m: { [k: string]: number }, k: number, d: number): void {\n        var cur = m["" + k];\n        m["" + k] = (cur === undefined ? 0 : cur) + d;\n    };\n    var get = function(m: { [k: string]: number }, k: number): number {\n        var cur = m["" + k];\n        return cur === undefined ? 0 : cur;\n    };\n    var i: number, r: number, c: number, key: string;\n    for (i = 0; i < lamps.length; i++) {\n        r = lamps[i][0];\n        c = lamps[i][1];\n        key = "" + (r * n + c);\n        if (on[key]) continue;\n        on[key] = true;\n        bump(rows, r, 1);\n        bump(cols, c, 1);\n        bump(diag, r - c, 1);\n        bump(anti, r + c, 1);\n    }\n    var out: number[] = [];\n    for (i = 0; i < queries.length; i++) {\n        r = queries[i][0];\n        c = queries[i][1];\n        var lit = get(rows, r) > 0 || get(cols, c) > 0 || get(diag, r - c) > 0 || get(anti, r + c) > 0;\n        out.push(lit ? 1 : 0);\n        for (var dr = -1; dr <= 1; dr++) {\n            for (var dc = -1; dc <= 1; dc++) {\n                var nr = r + dr, nc = c + dc;\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                key = "" + (nr * n + nc);\n                if (!on[key]) continue;\n                on[key] = false;\n                bump(rows, nr, -1);\n                bump(cols, nc, -1);\n                bump(diag, nr - nc, -1);\n                bump(anti, nr + nc, -1);\n            }\n        }\n    }\n    return out;\n}`,
        java: `public static int[] gridIllumination(int n, int[][] lamps, int[][] queries) {\n    Map<Integer, Integer> rows = new HashMap<>(), cols = new HashMap<>();\n    Map<Integer, Integer> diag = new HashMap<>(), anti = new HashMap<>();\n    Set<Integer> on = new HashSet<>();\n    for (int[] lamp : lamps) {\n        int r = lamp[0], c = lamp[1];\n        if (!on.add(r * n + c)) continue;\n        rows.merge(r, 1, Integer::sum);\n        cols.merge(c, 1, Integer::sum);\n        diag.merge(r - c, 1, Integer::sum);\n        anti.merge(r + c, 1, Integer::sum);\n    }\n    int[] out = new int[queries.length];\n    for (int q = 0; q < queries.length; q++) {\n        int r = queries[q][0], c = queries[q][1];\n        boolean lit = rows.getOrDefault(r, 0) > 0 || cols.getOrDefault(c, 0) > 0\n                || diag.getOrDefault(r - c, 0) > 0 || anti.getOrDefault(r + c, 0) > 0;\n        out[q] = lit ? 1 : 0;\n        for (int dr = -1; dr <= 1; dr++) {\n            for (int dc = -1; dc <= 1; dc++) {\n                int nr = r + dr, nc = c + dc;\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                if (!on.remove(nr * n + nc)) continue;\n                rows.merge(nr, -1, Integer::sum);\n                cols.merge(nc, -1, Integer::sum);\n                diag.merge(nr - nc, -1, Integer::sum);\n                anti.merge(nr + nc, -1, Integer::sum);\n            }\n        }\n    }\n    return out;\n}`,
        cpp: `vector<int> gridIllumination(int n, vector<vector<int>>& lamps, vector<vector<int>>& queries) {\n    unordered_map<int, int> rows, cols, diag, anti;\n    unordered_set<int> on;\n    for (auto& lamp : lamps) {\n        int r = lamp[0], c = lamp[1];\n        if (!on.insert(r * n + c).second) continue;\n        rows[r]++;\n        cols[c]++;\n        diag[r - c]++;\n        anti[r + c]++;\n    }\n    vector<int> out;\n    for (auto& q : queries) {\n        int r = q[0], c = q[1];\n        bool lit = rows[r] > 0 || cols[c] > 0 || diag[r - c] > 0 || anti[r + c] > 0;\n        out.push_back(lit ? 1 : 0);\n        for (int dr = -1; dr <= 1; dr++) {\n            for (int dc = -1; dc <= 1; dc++) {\n                int nr = r + dr, nc = c + dc;\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                if (on.erase(nr * n + nc) == 0) continue;\n                rows[nr]--;\n                cols[nc]--;\n                diag[nr - nc]--;\n                anti[nr + nc]--;\n            }\n        }\n    }\n    return out;\n}`,
        c: `/* n <= 10000 and there are at most 20000 lamps, so linear scans over the\n   lamp list stay small; no hash table is needed for these limits. */\nint* gridIllumination(int n, int** lamps, int lampsSize, int* lampsColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {\n    (void) lampsColSize;\n    (void) queriesColSize;\n    int* lr = (int*) malloc((size_t) (lampsSize > 0 ? lampsSize : 1) * sizeof(int));\n    int* lc = (int*) malloc((size_t) (lampsSize > 0 ? lampsSize : 1) * sizeof(int));\n    char* alive = (char*) calloc((size_t) (lampsSize > 0 ? lampsSize : 1), 1);\n    int cnt = 0;\n    for (int i = 0; i < lampsSize; i++) {\n        int r = lamps[i][0], c = lamps[i][1];\n        int dup = 0;\n        for (int k = 0; k < cnt; k++) if (lr[k] == r && lc[k] == c) { dup = 1; break; }\n        if (dup) continue;\n        lr[cnt] = r;\n        lc[cnt] = c;\n        alive[cnt] = 1;\n        cnt++;\n    }\n    int* out = (int*) malloc((size_t) (queriesSize > 0 ? queriesSize : 1) * sizeof(int));\n    for (int q = 0; q < queriesSize; q++) {\n        int r = queries[q][0], c = queries[q][1];\n        int lit = 0;\n        for (int k = 0; k < cnt && !lit; k++) {\n            if (!alive[k]) continue;\n            if (lr[k] == r || lc[k] == c || lr[k] - lc[k] == r - c || lr[k] + lc[k] == r + c) lit = 1;\n        }\n        out[q] = lit;\n        for (int k = 0; k < cnt; k++) {\n            if (!alive[k]) continue;\n            int dr = lr[k] - r, dc = lc[k] - c;\n            if (dr >= -1 && dr <= 1 && dc >= -1 && dc <= 1) alive[k] = 0;\n        }\n    }\n    free(lr);\n    free(lc);\n    free(alive);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] GridIllumination(int n, int[][] lamps, int[][] queries)\n{\n    var rows = new Dictionary<int, int>();\n    var cols = new Dictionary<int, int>();\n    var diag = new Dictionary<int, int>();\n    var anti = new Dictionary<int, int>();\n    var on = new HashSet<int>();\n    void Bump(Dictionary<int, int> m, int k, int d)\n    {\n        m.TryGetValue(k, out int cur);\n        m[k] = cur + d;\n    }\n    int Get(Dictionary<int, int> m, int k)\n    {\n        m.TryGetValue(k, out int cur);\n        return cur;\n    }\n    foreach (var lamp in lamps)\n    {\n        int r = lamp[0], c = lamp[1];\n        if (!on.Add(r * n + c)) continue;\n        Bump(rows, r, 1);\n        Bump(cols, c, 1);\n        Bump(diag, r - c, 1);\n        Bump(anti, r + c, 1);\n    }\n    var out_ = new int[queries.Length];\n    for (int q = 0; q < queries.Length; q++)\n    {\n        int r = queries[q][0], c = queries[q][1];\n        bool lit = Get(rows, r) > 0 || Get(cols, c) > 0 || Get(diag, r - c) > 0 || Get(anti, r + c) > 0;\n        out_[q] = lit ? 1 : 0;\n        for (int dr = -1; dr <= 1; dr++)\n        {\n            for (int dc = -1; dc <= 1; dc++)\n            {\n                int nr = r + dr, nc = c + dc;\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                if (!on.Remove(nr * n + nc)) continue;\n                Bump(rows, nr, -1);\n                Bump(cols, nc, -1);\n                Bump(diag, nr - nc, -1);\n                Bump(anti, nr + nc, -1);\n            }\n        }\n    }\n    return out_;\n}`,
        go: `func gridIllumination(n int, lamps [][]int, queries [][]int) []int {\n\trows := map[int]int{}\n\tcols := map[int]int{}\n\tdiag := map[int]int{}\n\tanti := map[int]int{}\n\ton := map[int]bool{}\n\tfor _, lamp := range lamps {\n\t\tr, c := lamp[0], lamp[1]\n\t\tkey := r*n + c\n\t\tif on[key] {\n\t\t\tcontinue\n\t\t}\n\t\ton[key] = true\n\t\trows[r]++\n\t\tcols[c]++\n\t\tdiag[r-c]++\n\t\tanti[r+c]++\n\t}\n\tout := make([]int, len(queries))\n\tfor q, query := range queries {\n\t\tr, c := query[0], query[1]\n\t\tif rows[r] > 0 || cols[c] > 0 || diag[r-c] > 0 || anti[r+c] > 0 {\n\t\t\tout[q] = 1\n\t\t}\n\t\tfor dr := -1; dr <= 1; dr++ {\n\t\t\tfor dc := -1; dc <= 1; dc++ {\n\t\t\t\tnr, nc := r+dr, c+dc\n\t\t\t\tif nr < 0 || nr >= n || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tkey := nr*n + nc\n\t\t\t\tif !on[key] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tdelete(on, key)\n\t\t\t\trows[nr]--\n\t\t\t\tcols[nc]--\n\t\t\t\tdiag[nr-nc]--\n\t\t\t\tanti[nr+nc]--\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun gridIllumination(n: Int, lamps: Array<IntArray>, queries: Array<IntArray>): IntArray {\n    val rows = HashMap<Int, Int>()\n    val cols = HashMap<Int, Int>()\n    val diag = HashMap<Int, Int>()\n    val anti = HashMap<Int, Int>()\n    val on = HashSet<Int>()\n    fun bump(m: HashMap<Int, Int>, k: Int, d: Int) {\n        m[k] = (m[k] ?: 0) + d\n    }\n    for (lamp in lamps) {\n        val r = lamp[0]\n        val c = lamp[1]\n        if (!on.add(r * n + c)) continue\n        bump(rows, r, 1)\n        bump(cols, c, 1)\n        bump(diag, r - c, 1)\n        bump(anti, r + c, 1)\n    }\n    val out = IntArray(queries.size)\n    for (q in queries.indices) {\n        val r = queries[q][0]\n        val c = queries[q][1]\n        val lit = (rows[r] ?: 0) > 0 || (cols[c] ?: 0) > 0 ||\n            (diag[r - c] ?: 0) > 0 || (anti[r + c] ?: 0) > 0\n        out[q] = if (lit) 1 else 0\n        for (dr in -1..1) {\n            for (dc in -1..1) {\n                val nr = r + dr\n                val nc = c + dc\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue\n                if (!on.remove(nr * n + nc)) continue\n                bump(rows, nr, -1)\n                bump(cols, nc, -1)\n                bump(diag, nr - nc, -1)\n                bump(anti, nr + nc, -1)\n            }\n        }\n    }\n    return out\n}`,
        swift: `func gridIllumination(_ n: Int, _ lamps: [[Int]], _ queries: [[Int]]) -> [Int] {\n    var rows = [Int: Int](), cols = [Int: Int]()\n    var diag = [Int: Int](), anti = [Int: Int]()\n    var on = Set<Int>()\n    for lamp in lamps {\n        let r = lamp[0], c = lamp[1]\n        if !on.insert(r * n + c).inserted { continue }\n        rows[r, default: 0] += 1\n        cols[c, default: 0] += 1\n        diag[r - c, default: 0] += 1\n        anti[r + c, default: 0] += 1\n    }\n    var out = [Int]()\n    for q in queries {\n        let r = q[0], c = q[1]\n        let lit = (rows[r] ?? 0) > 0 || (cols[c] ?? 0) > 0\n            || (diag[r - c] ?? 0) > 0 || (anti[r + c] ?? 0) > 0\n        out.append(lit ? 1 : 0)\n        for dr in -1...1 {\n            for dc in -1...1 {\n                let nr = r + dr, nc = c + dc\n                if nr < 0 || nr >= n || nc < 0 || nc >= n { continue }\n                if on.remove(nr * n + nc) == nil { continue }\n                rows[nr, default: 0] -= 1\n                cols[nc, default: 0] -= 1\n                diag[nr - nc, default: 0] -= 1\n                anti[nr + nc, default: 0] -= 1\n            }\n        }\n    }\n    return out\n}`,
        rust: `use std::collections::{HashMap, HashSet};\n\nfn gridIllumination(n: i32, lamps: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {\n    let mut rows: HashMap<i32, i32> = HashMap::new();\n    let mut cols: HashMap<i32, i32> = HashMap::new();\n    let mut diag: HashMap<i32, i32> = HashMap::new();\n    let mut anti: HashMap<i32, i32> = HashMap::new();\n    let mut on: HashSet<i32> = HashSet::new();\n    for lamp in lamps.iter() {\n        let (r, c) = (lamp[0], lamp[1]);\n        if !on.insert(r * n + c) {\n            continue;\n        }\n        *rows.entry(r).or_insert(0) += 1;\n        *cols.entry(c).or_insert(0) += 1;\n        *diag.entry(r - c).or_insert(0) += 1;\n        *anti.entry(r + c).or_insert(0) += 1;\n    }\n    let mut out = Vec::new();\n    for q in queries.iter() {\n        let (r, c) = (q[0], q[1]);\n        let lit = *rows.get(&r).unwrap_or(&0) > 0\n            || *cols.get(&c).unwrap_or(&0) > 0\n            || *diag.get(&(r - c)).unwrap_or(&0) > 0\n            || *anti.get(&(r + c)).unwrap_or(&0) > 0;\n        out.push(if lit { 1 } else { 0 });\n        for dr in -1i32..=1 {\n            for dc in -1i32..=1 {\n                let nr = r + dr;\n                let nc = c + dc;\n                if nr < 0 || nr >= n || nc < 0 || nc >= n {\n                    continue;\n                }\n                if !on.remove(&(nr * n + nc)) {\n                    continue;\n                }\n                *rows.entry(nr).or_insert(0) -= 1;\n                *cols.entry(nc).or_insert(0) -= 1;\n                *diag.entry(nr - nc).or_insert(0) -= 1;\n                *anti.entry(nr + nc).or_insert(0) -= 1;\n            }\n        }\n    }\n    out\n}`,
        php: `function gridIllumination($n, $lamps, $queries) {\n    $rows = [];\n    $cols = [];\n    $diag = [];\n    $anti = [];\n    $on = [];\n    $bump = function(&$m, $k, $d) {\n        $m[$k] = (isset($m[$k]) ? $m[$k] : 0) + $d;\n    };\n    foreach ($lamps as $lamp) {\n        $r = $lamp[0];\n        $c = $lamp[1];\n        $key = $r * $n + $c;\n        if (isset($on[$key])) continue;\n        $on[$key] = true;\n        $bump($rows, $r, 1);\n        $bump($cols, $c, 1);\n        $bump($diag, $r - $c, 1);\n        $bump($anti, $r + $c, 1);\n    }\n    $out = [];\n    foreach ($queries as $q) {\n        $r = $q[0];\n        $c = $q[1];\n        $lit = (isset($rows[$r]) && $rows[$r] > 0)\n            || (isset($cols[$c]) && $cols[$c] > 0)\n            || (isset($diag[$r - $c]) && $diag[$r - $c] > 0)\n            || (isset($anti[$r + $c]) && $anti[$r + $c] > 0);\n        $out[] = $lit ? 1 : 0;\n        for ($dr = -1; $dr <= 1; $dr++) {\n            for ($dc = -1; $dc <= 1; $dc++) {\n                $nr = $r + $dr;\n                $nc = $c + $dc;\n                if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $n) continue;\n                $key = $nr * $n + $nc;\n                if (!isset($on[$key])) continue;\n                unset($on[$key]);\n                $bump($rows, $nr, -1);\n                $bump($cols, $nc, -1);\n                $bump($diag, $nr - $nc, -1);\n                $bump($anti, $nr + $nc, -1);\n            }\n        }\n    }\n    return $out;\n}`,
        ruby: `def gridIllumination(n, lamps, queries)\n  rows = Hash.new(0)\n  cols = Hash.new(0)\n  diag = Hash.new(0)\n  anti = Hash.new(0)\n  on = {}\n  lamps.each do |r, c|\n    key = r * n + c\n    next if on[key]\n    on[key] = true\n    rows[r] += 1\n    cols[c] += 1\n    diag[r - c] += 1\n    anti[r + c] += 1\n  end\n  queries.map do |r, c|\n    lit = rows[r] > 0 || cols[c] > 0 || diag[r - c] > 0 || anti[r + c] > 0\n    (-1..1).each do |dr|\n      (-1..1).each do |dc|\n        nr = r + dr\n        nc = c + dc\n        next if nr < 0 || nr >= n || nc < 0 || nc >= n\n        key = nr * n + nc\n        next unless on[key]\n        on.delete(key)\n        rows[nr] -= 1\n        cols[nc] -= 1\n        diag[nr - nc] -= 1\n        anti[nr + nc] -= 1\n      end\n    end\n    lit ? 1 : 0\n  end\nend`,
      },
    };
  })(),

  // ── Escape the Spreading Fire (LC 2258) ─────────────────────────
  (() => {
    const BIG = 1000000000;
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      const fire = new Array(m * n).fill(BIG);
      const q: number[] = [];
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) if (grid[i][j] === 1) { fire[i * n + j] = 0; q.push(i * n + j); }
      }
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const r = Math.floor(cur / n), c = cur % n;
        for (let d = 0; d < 4; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
          const key = nr * n + nc;
          if (grid[nr][nc] === 2 || fire[key] < BIG) continue;
          fire[key] = fire[cur] + 1;
          q.push(key);
        }
      }
      const canEscape = (wait: number) => {
        if (fire[0] <= wait) return false;
        const seen = new Array(m * n).fill(false);
        const time = new Array(m * n).fill(0);
        const bq = [0];
        seen[0] = true;
        time[0] = wait;
        let h = 0;
        while (h < bq.length) {
          const cur = bq[h++];
          const r = Math.floor(cur / n), c = cur % n;
          for (let d = 0; d < 4; d++) {
            const nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            const key = nr * n + nc;
            if (grid[nr][nc] === 2 || seen[key]) continue;
            const at = time[cur] + 1;
            if (nr === m - 1 && nc === n - 1) {
              // Arriving exactly as the fire does still counts as escaping.
              if (fire[key] >= at) return true;
              continue;
            }
            if (fire[key] <= at) continue;
            seen[key] = true;
            time[key] = at;
            bq.push(key);
          }
        }
        return m === 1 && n === 1;
      };
      if (!canEscape(0)) return -1;
      let lo = 0, hi = m * n;
      if (canEscape(hi)) return BIG;
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo + 1) / 2);
        if (canEscape(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "escape-the-spreading-fire",
      title: "Escape the Spreading Fire",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Binary Search", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maximumMinutes", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A grid holds `0` for grass, `1` for fire and `2` for a wall. You start at the top-left cell and want to reach the safehouse at the bottom-right.\n\nEach minute you may move one cell up, down, left or right onto grass, and **then** the fire spreads to every grass cell adjacent to a burning one. Walls block both of you. You may first wait in place for some minutes before setting off — but not while your cell is on fire.\n\nReturn the maximum number of minutes you can wait and still reach the safehouse, or `-1` if you cannot reach it even without waiting. If you can wait forever, return `10^9`.\n\nReaching the safehouse at the very minute the fire arrives there still counts as escaping.",
        [
          { in: "grid = [[0,2,0,0,0,0,0],[0,0,0,2,2,1,0],[0,2,0,0,1,2,0],[0,0,2,2,2,0,2],[0,0,0,0,0,0,0]]", out: "3" },
          { in: "grid = [[0,0,0,0],[0,1,2,0],[0,2,2,0],[0,0,0,0]]", out: "-1", note: "The fire reaches every route before you do." },
          { in: "grid = [[0,0,0],[2,2,0],[1,2,0]]", out: "1000000000", note: "Walls pen the fire in, so it never spreads." },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 300", "4 <= m * n <= 2 * 10^4", "grid[i][j] is 0, 1 or 2", "grid[0][0] == grid[m-1][n-1] == 0"]),
      hints: [
        "First compute, with a multi-source BFS, the minute the fire reaches each cell — `infinity` for cells it never reaches.",
        "Waiting longer is never easier: if you can escape after waiting `t`, you can escape after waiting `t - 1`. That monotonicity invites a binary search.",
        "For a fixed wait, a BFS works: you may step onto a cell only strictly before the fire gets there — except the safehouse, where arriving together is enough.",
      ],
      editorial: explain({
        idea: "Precompute the fire's arrival time everywhere, then binary search the wait. For a candidate wait, one BFS decides whether a safe route exists.",
        steps: [
          "Multi-source BFS from the fire cells through grass only, giving `fire[cell]`.",
          "`canEscape(t)`: BFS from the start with clock beginning at `t`; step onto a cell only if `arrival < fire[cell]`.",
          "At the safehouse, accept `arrival <= fire[cell]` instead.",
          "Binary search the largest `t` in `[0, m·n]`. If even `m·n` works, the fire can never catch you — return `10^9`; if `0` fails, return `-1`.",
        ],
        why: "Monotonicity is what makes the binary search valid: the route that works after waiting `t` also works after waiting less, since every arrival time only shrinks while the fire's schedule is fixed. And `m·n` is a safe upper bound — a route has at most `m·n` cells, so if waiting that long still works, no reachable cell is ever on fire ahead of you.",
        time: "O(m · n · log(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "The safehouse's `<=` rule is a genuine special case; using `<` there loses cases.",
          "Cells the fire never reaches need an infinite arrival time, not zero.",
          "You cannot wait on a burning start cell, so `canEscape(t)` must reject `t >= fire[start]`.",
        ],
      }),
      examples: [
        { input: "[[0,2,0,0,0,0,0],[0,0,0,2,2,1,0],[0,2,0,0,1,2,0],[0,0,2,2,2,0,2],[0,0,0,0,0,0,0]]", expectedOutput: "3" },
        { input: "[[0,0,0,0],[0,1,2,0],[0,2,2,0],[0,0,0,0]]", expectedOutput: "-1" },
        { input: "[[0,0,0],[2,2,0],[1,2,0]]", expectedOutput: "1000000000" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6), n = ri(rng, 2, 6);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(rng, [0, 0, 0, 0, 1, 2, 2])));
        // The statement pins both corners to grass.
        grid[0][0] = 0;
        grid[m - 1][n - 1] = 0;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef maximumMinutes(grid: List[List[int]]) -> int:\n    BIG = 1000000000\n    m, n = len(grid), len(grid[0])\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    fire = [[BIG] * n for _ in range(m)]\n    q = deque()\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == 1:\n                fire[i][j] = 0\n                q.append((i, j))\n    while q:\n        r, c = q.popleft()\n        for di, dj in dirs:\n            nr, nc = r + di, c + dj\n            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] != 2 and fire[nr][nc] == BIG:\n                fire[nr][nc] = fire[r][c] + 1\n                q.append((nr, nc))\n\n    def can_escape(wait: int) -> bool:\n        if fire[0][0] <= wait:\n            return False\n        seen = [[False] * n for _ in range(m)]\n        seen[0][0] = True\n        bq = deque([(0, 0, wait)])\n        while bq:\n            r, c, t = bq.popleft()\n            for di, dj in dirs:\n                nr, nc = r + di, c + dj\n                if not (0 <= nr < m and 0 <= nc < n) or grid[nr][nc] == 2 or seen[nr][nc]:\n                    continue\n                at = t + 1\n                if nr == m - 1 and nc == n - 1:\n                    if fire[nr][nc] >= at:\n                        return True\n                    continue\n                if fire[nr][nc] <= at:\n                    continue\n                seen[nr][nc] = True\n                bq.append((nr, nc, at))\n        return False\n\n    if not can_escape(0):\n        return -1\n    hi = m * n\n    if can_escape(hi):\n        return BIG\n    lo = 0\n    while lo < hi:\n        mid = lo + (hi - lo + 1) // 2\n        if can_escape(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maximumMinutes = function(grid) {\n    var BIG = 1000000000;\n    var m = grid.length, n = grid[0].length, i, j, d;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var fire = [];\n    for (i = 0; i < m * n; i++) fire.push(BIG);\n    var q = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 1) { fire[i * n + j] = 0; q.push(i * n + j); }\n        }\n    }\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            var key = nr * n + nc;\n            if (grid[nr][nc] === 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q.push(key);\n        }\n    }\n    var canEscape = function(wait) {\n        if (fire[0] <= wait) return false;\n        var seen = [], time = [];\n        for (var t = 0; t < m * n; t++) { seen.push(false); time.push(0); }\n        seen[0] = true;\n        time[0] = wait;\n        var bq = [0], h = 0;\n        while (h < bq.length) {\n            var cur2 = bq[h++];\n            var r2 = Math.floor(cur2 / n), c2 = cur2 % n;\n            for (var dd = 0; dd < 4; dd++) {\n                var ar = r2 + dr[dd], ac = c2 + dc[dd];\n                if (ar < 0 || ar >= m || ac < 0 || ac >= n) continue;\n                var k = ar * n + ac;\n                if (grid[ar][ac] === 2 || seen[k]) continue;\n                var at = time[cur2] + 1;\n                if (ar === m - 1 && ac === n - 1) {\n                    if (fire[k] >= at) return true;\n                    continue;\n                }\n                if (fire[k] <= at) continue;\n                seen[k] = true;\n                time[k] = at;\n                bq.push(k);\n            }\n        }\n        return false;\n    };\n    if (!canEscape(0)) return -1;\n    var hi = m * n;\n    if (canEscape(hi)) return BIG;\n    var lo = 0;\n    while (lo < hi) {\n        var mid = lo + Math.floor((hi - lo + 1) / 2);\n        if (canEscape(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maximumMinutes(grid: number[][]): number {\n    var BIG = 1000000000;\n    var m = grid.length, n = grid[0].length, i: number, j: number, d: number;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var fire: number[] = [];\n    for (i = 0; i < m * n; i++) fire.push(BIG);\n    var q: number[] = [];\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 1) { fire[i * n + j] = 0; q.push(i * n + j); }\n        }\n    }\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (d = 0; d < 4; d++) {\n            var nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            var key = nr * n + nc;\n            if (grid[nr][nc] === 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q.push(key);\n        }\n    }\n    var canEscape = function(wait: number): boolean {\n        if (fire[0] <= wait) return false;\n        var seen: boolean[] = [], time: number[] = [];\n        for (var t = 0; t < m * n; t++) { seen.push(false); time.push(0); }\n        seen[0] = true;\n        time[0] = wait;\n        var bq: number[] = [0];\n        var h = 0;\n        while (h < bq.length) {\n            var cur2 = bq[h++];\n            var r2 = Math.floor(cur2 / n), c2 = cur2 % n;\n            for (var dd = 0; dd < 4; dd++) {\n                var ar = r2 + dr[dd], ac = c2 + dc[dd];\n                if (ar < 0 || ar >= m || ac < 0 || ac >= n) continue;\n                var k = ar * n + ac;\n                if (grid[ar][ac] === 2 || seen[k]) continue;\n                var at = time[cur2] + 1;\n                if (ar === m - 1 && ac === n - 1) {\n                    if (fire[k] >= at) return true;\n                    continue;\n                }\n                if (fire[k] <= at) continue;\n                seen[k] = true;\n                time[k] = at;\n                bq.push(k);\n            }\n        }\n        return false;\n    };\n    if (!canEscape(0)) return -1;\n    var hi = m * n;\n    if (canEscape(hi)) return BIG;\n    var lo = 0;\n    while (lo < hi) {\n        var mid = lo + Math.floor((hi - lo + 1) / 2);\n        if (canEscape(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `public static int maximumMinutes(int[][] grid) {\n    final int BIG = 1000000000;\n    int m = grid.length, n = grid[0].length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[] fire = new int[m * n];\n    Arrays.fill(fire, BIG);\n    int[] q = new int[m * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { fire[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q[tail++] = key;\n        }\n    }\n    if (!escapeOk(grid, fire, 0)) return -1;\n    int hi = m * n;\n    if (escapeOk(grid, fire, hi)) return BIG;\n    int lo = 0;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (escapeOk(grid, fire, mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}\n\nprivate static boolean escapeOk(int[][] grid, int[] fire, int wait) {\n    int m = grid.length, n = grid[0].length;\n    if (fire[0] <= wait) return false;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    boolean[] seen = new boolean[m * n];\n    int[] time = new int[m * n];\n    int[] q = new int[m * n];\n    int head = 0, tail = 0;\n    seen[0] = true;\n    time[0] = wait;\n    q[tail++] = 0;\n    while (head < tail) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || seen[key]) continue;\n            int at = time[cur] + 1;\n            if (nr == m - 1 && nc == n - 1) {\n                if (fire[key] >= at) return true;\n                continue;\n            }\n            if (fire[key] <= at) continue;\n            seen[key] = true;\n            time[key] = at;\n            q[tail++] = key;\n        }\n    }\n    return false;\n}`,
        cpp: `static bool escapeOk(vector<vector<int>>& grid, vector<int>& fire, int wait) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    if (fire[0] <= wait) return false;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    vector<char> seen(m * n, 0);\n    vector<int> time(m * n, 0), q;\n    seen[0] = 1;\n    time[0] = wait;\n    q.push_back(0);\n    for (size_t head = 0; head < q.size(); head++) {\n        int cur = q[head];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || seen[key]) continue;\n            int at = time[cur] + 1;\n            if (nr == m - 1 && nc == n - 1) {\n                if (fire[key] >= at) return true;\n                continue;\n            }\n            if (fire[key] <= at) continue;\n            seen[key] = 1;\n            time[key] = at;\n            q.push_back(key);\n        }\n    }\n    return false;\n}\n\nint maximumMinutes(vector<vector<int>>& grid) {\n    const int BIG = 1000000000;\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    vector<int> fire(m * n, BIG), q;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { fire[i * n + j] = 0; q.push_back(i * n + j); }\n        }\n    }\n    for (size_t head = 0; head < q.size(); head++) {\n        int cur = q[head];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q.push_back(key);\n        }\n    }\n    if (!escapeOk(grid, fire, 0)) return -1;\n    int hi = m * n;\n    if (escapeOk(grid, fire, hi)) return BIG;\n    int lo = 0;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (escapeOk(grid, fire, mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `static int escapeOk(int** grid, int m, int n, int* fire, int wait) {\n    if (fire[0] <= wait) return 0;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    char* seen = (char*) calloc((size_t) (m * n), 1);\n    int* tm = (int*) calloc((size_t) (m * n), sizeof(int));\n    int* q = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int head = 0, tail = 0, ok = 0;\n    seen[0] = 1;\n    tm[0] = wait;\n    q[tail++] = 0;\n    while (head < tail && !ok) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || seen[key]) continue;\n            int at = tm[cur] + 1;\n            if (nr == m - 1 && nc == n - 1) {\n                if (fire[key] >= at) { ok = 1; break; }\n                continue;\n            }\n            if (fire[key] <= at) continue;\n            seen[key] = 1;\n            tm[key] = at;\n            q[tail++] = key;\n        }\n    }\n    free(seen);\n    free(tm);\n    free(q);\n    return ok;\n}\n\nint maximumMinutes(int** grid, int gridSize, int* gridColSize) {\n    const int BIG = 1000000000;\n    int m = gridSize, n = gridColSize[0];\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int* fire = (int*) malloc((size_t) (m * n) * sizeof(int));\n    for (int k = 0; k < m * n; k++) fire[k] = BIG;\n    int* q = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { fire[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q[tail++] = key;\n        }\n    }\n    free(q);\n    int ans;\n    if (!escapeOk(grid, m, n, fire, 0)) {\n        ans = -1;\n    } else if (escapeOk(grid, m, n, fire, m * n)) {\n        ans = BIG;\n    } else {\n        int lo = 0, hi = m * n;\n        while (lo < hi) {\n            int mid = lo + (hi - lo + 1) / 2;\n            if (escapeOk(grid, m, n, fire, mid)) lo = mid;\n            else hi = mid - 1;\n        }\n        ans = lo;\n    }\n    free(fire);\n    return ans;\n}`,
        csharp: `public static int MaximumMinutes(int[][] grid)\n{\n    const int BIG = 1000000000;\n    int m = grid.Length, n = grid[0].Length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var fire = new int[m * n];\n    for (int k = 0; k < m * n; k++) fire[k] = BIG;\n    var q = new int[m * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] == 1) { fire[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail)\n    {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int key = nr * n + nc;\n            if (grid[nr][nc] == 2 || fire[key] < BIG) continue;\n            fire[key] = fire[cur] + 1;\n            q[tail++] = key;\n        }\n    }\n    bool EscapeOk(int wait)\n    {\n        if (fire[0] <= wait) return false;\n        var seen = new bool[m * n];\n        var time = new int[m * n];\n        var bq = new int[m * n];\n        int h = 0, t = 0;\n        seen[0] = true;\n        time[0] = wait;\n        bq[t++] = 0;\n        while (h < t)\n        {\n            int cur = bq[h++];\n            int r = cur / n, c = cur % n;\n            for (int d = 0; d < 4; d++)\n            {\n                int nr = r + dr[d], nc = c + dc[d];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                int key = nr * n + nc;\n                if (grid[nr][nc] == 2 || seen[key]) continue;\n                int at = time[cur] + 1;\n                if (nr == m - 1 && nc == n - 1)\n                {\n                    if (fire[key] >= at) return true;\n                    continue;\n                }\n                if (fire[key] <= at) continue;\n                seen[key] = true;\n                time[key] = at;\n                bq[t++] = key;\n            }\n        }\n        return false;\n    }\n    if (!EscapeOk(0)) return -1;\n    int hi = m * n;\n    if (EscapeOk(hi)) return BIG;\n    int lo = 0;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (EscapeOk(mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func maximumMinutes(grid [][]int) int {\n\tconst BIG = 1000000000\n\tm, n := len(grid), len(grid[0])\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tfire := make([]int, m*n)\n\tfor k := range fire {\n\t\tfire[k] = BIG\n\t}\n\tq := []int{}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] == 1 {\n\t\t\t\tfire[i*n+j] = 0\n\t\t\t\tq = append(q, i*n+j)\n\t\t\t}\n\t\t}\n\t}\n\tfor head := 0; head < len(q); head++ {\n\t\tcur := q[head]\n\t\tr, c := cur/n, cur%n\n\t\tfor d := 0; d < 4; d++ {\n\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tkey := nr*n + nc\n\t\t\tif grid[nr][nc] == 2 || fire[key] < BIG {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfire[key] = fire[cur] + 1\n\t\t\tq = append(q, key)\n\t\t}\n\t}\n\tescapeOk := func(wait int) bool {\n\t\tif fire[0] <= wait {\n\t\t\treturn false\n\t\t}\n\t\tseen := make([]bool, m*n)\n\t\ttm := make([]int, m*n)\n\t\tseen[0] = true\n\t\ttm[0] = wait\n\t\tbq := []int{0}\n\t\tfor head := 0; head < len(bq); head++ {\n\t\t\tcur := bq[head]\n\t\t\tr, c := cur/n, cur%n\n\t\t\tfor d := 0; d < 4; d++ {\n\t\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tkey := nr*n + nc\n\t\t\t\tif grid[nr][nc] == 2 || seen[key] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tat := tm[cur] + 1\n\t\t\t\tif nr == m-1 && nc == n-1 {\n\t\t\t\t\tif fire[key] >= at {\n\t\t\t\t\t\treturn true\n\t\t\t\t\t}\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif fire[key] <= at {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tseen[key] = true\n\t\t\t\ttm[key] = at\n\t\t\t\tbq = append(bq, key)\n\t\t\t}\n\t\t}\n\t\treturn false\n\t}\n\tif !escapeOk(0) {\n\t\treturn -1\n\t}\n\thi := m * n\n\tif escapeOk(hi) {\n\t\treturn BIG\n\t}\n\tlo := 0\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif escapeOk(mid) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun maximumMinutes(grid: Array<IntArray>): Int {\n    val BIG = 1000000000\n    val m = grid.size\n    val n = grid[0].size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val fire = IntArray(m * n) { BIG }\n    val q = IntArray(m * n)\n    var head = 0\n    var tail = 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (grid[i][j] == 1) {\n                fire[i * n + j] = 0\n                q[tail++] = i * n + j\n            }\n        }\n    }\n    while (head < tail) {\n        val cur = q[head++]\n        val r = cur / n\n        val c = cur % n\n        for (d in 0 until 4) {\n            val nr = r + dr[d]\n            val nc = c + dc[d]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n            val key = nr * n + nc\n            if (grid[nr][nc] == 2 || fire[key] < BIG) continue\n            fire[key] = fire[cur] + 1\n            q[tail++] = key\n        }\n    }\n    fun escapeOk(wait: Int): Boolean {\n        if (fire[0] <= wait) return false\n        val seen = BooleanArray(m * n)\n        val tm = IntArray(m * n)\n        val bq = IntArray(m * n)\n        var h = 0\n        var t = 0\n        seen[0] = true\n        tm[0] = wait\n        bq[t++] = 0\n        while (h < t) {\n            val cur = bq[h++]\n            val r = cur / n\n            val c = cur % n\n            for (d in 0 until 4) {\n                val nr = r + dr[d]\n                val nc = c + dc[d]\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                val key = nr * n + nc\n                if (grid[nr][nc] == 2 || seen[key]) continue\n                val at = tm[cur] + 1\n                if (nr == m - 1 && nc == n - 1) {\n                    if (fire[key] >= at) return true\n                    continue\n                }\n                if (fire[key] <= at) continue\n                seen[key] = true\n                tm[key] = at\n                bq[t++] = key\n            }\n        }\n        return false\n    }\n    if (!escapeOk(0)) return -1\n    var hi = m * n\n    if (escapeOk(hi)) return BIG\n    var lo = 0\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (escapeOk(mid)) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func maximumMinutes(_ grid: [[Int]]) -> Int {\n    let BIG = 1000000000\n    let m = grid.count\n    let n = grid[0].count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var fire = [Int](repeating: BIG, count: m * n)\n    var q = [Int]()\n    for i in 0..<m {\n        for j in 0..<n where grid[i][j] == 1 {\n            fire[i * n + j] = 0\n            q.append(i * n + j)\n        }\n    }\n    var head = 0\n    while head < q.count {\n        let cur = q[head]\n        head += 1\n        let r = cur / n, c = cur % n\n        for d in 0..<4 {\n            let nr = r + dr[d], nc = c + dc[d]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n            let key = nr * n + nc\n            if grid[nr][nc] == 2 || fire[key] < BIG { continue }\n            fire[key] = fire[cur] + 1\n            q.append(key)\n        }\n    }\n    func escapeOk(_ wait: Int) -> Bool {\n        if fire[0] <= wait { return false }\n        var seen = [Bool](repeating: false, count: m * n)\n        var tm = [Int](repeating: 0, count: m * n)\n        seen[0] = true\n        tm[0] = wait\n        var bq = [0]\n        var h = 0\n        while h < bq.count {\n            let cur = bq[h]\n            h += 1\n            let r = cur / n, c = cur % n\n            for d in 0..<4 {\n                let nr = r + dr[d], nc = c + dc[d]\n                if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                let key = nr * n + nc\n                if grid[nr][nc] == 2 || seen[key] { continue }\n                let at = tm[cur] + 1\n                if nr == m - 1 && nc == n - 1 {\n                    if fire[key] >= at { return true }\n                    continue\n                }\n                if fire[key] <= at { continue }\n                seen[key] = true\n                tm[key] = at\n                bq.append(key)\n            }\n        }\n        return false\n    }\n    if !escapeOk(0) { return -1 }\n    var hi = m * n\n    if escapeOk(hi) { return BIG }\n    var lo = 0\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if escapeOk(mid) { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maximumMinutes(grid: Vec<Vec<i32>>) -> i32 {\n    const BIG: i32 = 1000000000;\n    let m = grid.len();\n    let n = grid[0].len();\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut fire = vec![BIG; m * n];\n    let mut q: Vec<usize> = Vec::new();\n    for i in 0..m {\n        for j in 0..n {\n            if grid[i][j] == 1 {\n                fire[i * n + j] = 0;\n                q.push(i * n + j);\n            }\n        }\n    }\n    let mut head = 0usize;\n    while head < q.len() {\n        let cur = q[head];\n        head += 1;\n        let r = (cur / n) as i32;\n        let c = (cur % n) as i32;\n        for d in 0..4 {\n            let nr = r + dr[d];\n            let nc = c + dc[d];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            let key = nr as usize * n + nc as usize;\n            if grid[nr as usize][nc as usize] == 2 || fire[key] < BIG {\n                continue;\n            }\n            fire[key] = fire[cur] + 1;\n            q.push(key);\n        }\n    }\n    let escape_ok = |wait: i32| -> bool {\n        if fire[0] <= wait {\n            return false;\n        }\n        let mut seen = vec![false; m * n];\n        let mut tm = vec![0i32; m * n];\n        seen[0] = true;\n        tm[0] = wait;\n        let mut bq: Vec<usize> = vec![0];\n        let mut h = 0usize;\n        while h < bq.len() {\n            let cur = bq[h];\n            h += 1;\n            let r = (cur / n) as i32;\n            let c = (cur % n) as i32;\n            for d in 0..4 {\n                let nr = r + dr[d];\n                let nc = c + dc[d];\n                if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                    continue;\n                }\n                let key = nr as usize * n + nc as usize;\n                if grid[nr as usize][nc as usize] == 2 || seen[key] {\n                    continue;\n                }\n                let at = tm[cur] + 1;\n                if nr == m as i32 - 1 && nc == n as i32 - 1 {\n                    if fire[key] >= at {\n                        return true;\n                    }\n                    continue;\n                }\n                if fire[key] <= at {\n                    continue;\n                }\n                seen[key] = true;\n                tm[key] = at;\n                bq.push(key);\n            }\n        }\n        false\n    };\n    if !escape_ok(0) {\n        return -1;\n    }\n    let mut hi = (m * n) as i32;\n    if escape_ok(hi) {\n        return BIG;\n    }\n    let mut lo = 0i32;\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        if escape_ok(mid) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo\n}`,
        php: `function maximumMinutes($grid) {\n    $BIG = 1000000000;\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $fire = array_fill(0, $m * $n, $BIG);\n    $q = [];\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] === 1) {\n                $fire[$i * $n + $j] = 0;\n                $q[] = $i * $n + $j;\n            }\n        }\n    }\n    for ($head = 0; $head < count($q); $head++) {\n        $cur = $q[$head];\n        $r = intdiv($cur, $n);\n        $c = $cur % $n;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $r + $dr[$d];\n            $nc = $c + $dc[$d];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n            $key = $nr * $n + $nc;\n            if ($grid[$nr][$nc] === 2 || $fire[$key] < $BIG) continue;\n            $fire[$key] = $fire[$cur] + 1;\n            $q[] = $key;\n        }\n    }\n    $escapeOk = function($wait) use ($grid, $fire, $m, $n, $dr, $dc) {\n        if ($fire[0] <= $wait) return false;\n        $seen = array_fill(0, $m * $n, false);\n        $tm = array_fill(0, $m * $n, 0);\n        $seen[0] = true;\n        $tm[0] = $wait;\n        $bq = [0];\n        for ($head = 0; $head < count($bq); $head++) {\n            $cur = $bq[$head];\n            $r = intdiv($cur, $n);\n            $c = $cur % $n;\n            for ($d = 0; $d < 4; $d++) {\n                $nr = $r + $dr[$d];\n                $nc = $c + $dc[$d];\n                if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                $key = $nr * $n + $nc;\n                if ($grid[$nr][$nc] === 2 || $seen[$key]) continue;\n                $at = $tm[$cur] + 1;\n                if ($nr === $m - 1 && $nc === $n - 1) {\n                    if ($fire[$key] >= $at) return true;\n                    continue;\n                }\n                if ($fire[$key] <= $at) continue;\n                $seen[$key] = true;\n                $tm[$key] = $at;\n                $bq[] = $key;\n            }\n        }\n        return false;\n    };\n    if (!$escapeOk(0)) return -1;\n    $hi = $m * $n;\n    if ($escapeOk($hi)) return $BIG;\n    $lo = 0;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($escapeOk($mid)) $lo = $mid;\n        else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maximumMinutes(grid)\n  big = 1000000000\n  m = grid.length\n  n = grid[0].length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  fire = Array.new(m * n, big)\n  q = []\n  (0...m).each do |i|\n    (0...n).each do |j|\n      if grid[i][j] == 1\n        fire[i * n + j] = 0\n        q << i * n + j\n      end\n    end\n  end\n  head = 0\n  while head < q.length\n    cur = q[head]\n    head += 1\n    r = cur / n\n    c = cur % n\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n\n      key = nr * n + nc\n      next if grid[nr][nc] == 2 || fire[key] < big\n      fire[key] = fire[cur] + 1\n      q << key\n    end\n  end\n  escape_ok = lambda do |wait|\n    next false if fire[0] <= wait\n    seen = Array.new(m * n, false)\n    tm = Array.new(m * n, 0)\n    seen[0] = true\n    tm[0] = wait\n    bq = [0]\n    h = 0\n    while h < bq.length\n      cur = bq[h]\n      h += 1\n      r = cur / n\n      c = cur % n\n      (0...4).each do |d|\n        nr = r + dr[d]\n        nc = c + dc[d]\n        next if nr < 0 || nr >= m || nc < 0 || nc >= n\n        key = nr * n + nc\n        next if grid[nr][nc] == 2 || seen[key]\n        at = tm[cur] + 1\n        if nr == m - 1 && nc == n - 1\n          return true if fire[key] >= at\n          next\n        end\n        next if fire[key] <= at\n        seen[key] = true\n        tm[key] = at\n        bq << key\n      end\n    end\n    false\n  end\n  return -1 unless escape_ok.call(0)\n  hi = m * n\n  return big if escape_ok.call(hi)\n  lo = 0\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if escape_ok.call(mid)\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Trapping Rain Water II (LC 407) ─────────────────────────────
  (() => {
    const ref = (heightMap: number[][]) => {
      const m = heightMap.length, n = heightMap[0].length;
      if (m < 3 || n < 3) return 0;
      const seen = Array.from({ length: m }, () => new Array(n).fill(false));
      const heap: number[] = [];
      const push = (v: number) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p] <= heap[i]) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop() as number;
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let s = i;
            if (l < heap.length && heap[l] < heap[s]) s = l;
            if (r < heap.length && heap[r] < heap[s]) s = r;
            if (s === i) break;
            const t = heap[s]; heap[s] = heap[i]; heap[i] = t;
            i = s;
          }
        }
        return top;
      };
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== 0 && i !== m - 1 && j !== 0 && j !== n - 1) continue;
          seen[i][j] = true;
          push(heightMap[i][j] * 40000 + i * n + j);
        }
      }
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let total = 0;
      while (heap.length > 0) {
        const key = pop();
        const level = Math.floor(key / 40000);
        const cell = key % 40000;
        const r = Math.floor(cell / n), c = cell % n;
        for (let d = 0; d < 4; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;
          seen[nr][nc] = true;
          if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];
          const next = heightMap[nr][nc] > level ? heightMap[nr][nc] : level;
          push(next * 40000 + nr * n + nc);
        }
      }
      return total;
    };
    return {
      slug: "trapping-rain-water-ii",
      title: "Trapping Rain Water II",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Heap (Priority Queue)", "Breadth-First Search", "Google", "Amazon", "Twitter"],
      signature: { funcName: "trapRainWater", params: [{ name: "heightMap", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An `m × n` matrix gives the height of each unit cell of a 2D elevation map. Return the volume of water it can trap after raining. Water runs off the edges of the map.",
        [
          { in: "heightMap = [[1,4,3,1,3,2],[3,2,1,3,2,4],[2,3,3,2,3,1]]", out: "4", note: "The four interior cells hold 4 units between them." },
          { in: "heightMap = [[3,3,3,3,3],[3,2,2,2,3],[3,2,1,2,3],[3,2,2,2,3],[3,3,3,3,3]]", out: "10", note: "A wall of 3 all round: eight cells fill by 1 and the centre by 2." },
          { in: "heightMap = [[1,1,1],[1,0,1],[1,1,1]]", out: "1" },
        ],
        ["m == heightMap.length", "n == heightMap[i].length", "1 <= m, n <= 200", "0 <= heightMap[i][j] <= 2 * 10^4"]),
      hints: [
        "The 1D two-pointer trick does not generalise: in 2D, water escapes through the *lowest* point of the surrounding rim, wherever it is.",
        "Start from the border — those cells can hold nothing — and work inward from the lowest rim cell each time.",
        "A min-heap keyed on the current water level gives that order.",
      ],
      editorial: explain({
        idea: "Flood inward from the boundary, always processing the lowest cell on the current rim. When the rim's lowest cell has level `L`, any unvisited neighbour below `L` is filled to `L`, because `L` is the cheapest way out of the basin.",
        steps: [
          "Push every border cell onto a min-heap keyed by its height, and mark it visited.",
          "Pop the lowest cell, with water level `L`.",
          "For each unvisited neighbour: if its height is below `L`, it traps `L - height`; push it back at level `max(L, height)`.",
          "Continue until the heap empties.",
        ],
        why: "Processing the rim in increasing order of level is the whole argument: when a cell is popped at level `L`, every other route out of the region is at least `L` high, so `L` is exactly the water level at its neighbours — no later discovery can lower it. Pushing a neighbour at `max(L, height)` carries that boundary forward, since a taller cell raises the rim rather than letting water out.",
        time: "O(m · n · log(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "Marking a cell visited when it is *pushed* — not when popped — keeps each cell out of the heap more than once.",
          "A grid narrower than 3 in either direction traps nothing; it is all border.",
          "The pushed level is `max(level, height)`, not the raw height, or a basin behind a tall wall leaks.",
        ],
      }),
      examples: [
        { input: "[[1,4,3,1,3,2],[3,2,1,3,2,4],[2,3,3,2,3,1]]", expectedOutput: "4" },
        { input: "[[3,3,3,3,3],[3,2,2,2,3],[3,2,1,2,3],[3,2,2,2,3],[3,3,3,3,3]]", expectedOutput: "10" },
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const hi = pick(rng, [3, 9, 30]);
        const heightMap = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, hi)));
        // A high rim makes the interesting (non-zero) cases far more common.
        if (m >= 3 && n >= 3 && rng() < 0.4) {
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              if (i === 0 || i === m - 1 || j === 0 || j === n - 1) heightMap[i][j] = hi;
            }
          }
        }
        return { input: fmtIntMat(heightMap), expectedOutput: String(ref(heightMap)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef trapRainWater(heightMap: List[List[int]]) -> int:\n    m, n = len(heightMap), len(heightMap[0])\n    if m < 3 or n < 3:\n        return 0\n    seen = [[False] * n for _ in range(m)]\n    heap = []\n    for i in range(m):\n        for j in range(n):\n            if i not in (0, m - 1) and j not in (0, n - 1):\n                continue\n            seen[i][j] = True\n            heapq.heappush(heap, (heightMap[i][j], i, j))\n    total = 0\n    while heap:\n        level, r, c = heapq.heappop(heap)\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if not (0 <= nr < m and 0 <= nc < n) or seen[nr][nc]:\n                continue\n            seen[nr][nc] = True\n            if heightMap[nr][nc] < level:\n                total += level - heightMap[nr][nc]\n            heapq.heappush(heap, (max(level, heightMap[nr][nc]), nr, nc))\n    return total`,
        javascript: `var trapRainWater = function(heightMap) {\n    var m = heightMap.length, n = heightMap[0].length, i, j;\n    if (m < 3 || n < 3) return 0;\n    var seen = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    // The heap holds level * 40000 + cell, so a plain int heap is enough:\n    // m * n <= 40000 and the level fits well inside 32 bits.\n    var heap = [];\n    var push = function(v) {\n        heap.push(v);\n        var k = heap.length - 1;\n        while (k > 0) {\n            var p = (k - 1) >> 1;\n            if (heap[p] <= heap[k]) break;\n            var t = heap[p]; heap[p] = heap[k]; heap[k] = t;\n            k = p;\n        }\n    };\n    var pop = function() {\n        var top = heap[0];\n        var last = heap.pop();\n        if (heap.length > 0) {\n            heap[0] = last;\n            var k = 0;\n            for (;;) {\n                var l = 2 * k + 1, r = l + 1, s = k;\n                if (l < heap.length && heap[l] < heap[s]) s = l;\n                if (r < heap.length && heap[r] < heap[s]) s = r;\n                if (s === k) break;\n                var t = heap[s]; heap[s] = heap[k]; heap[k] = t;\n                k = s;\n            }\n        }\n        return top;\n    };\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (i !== 0 && i !== m - 1 && j !== 0 && j !== n - 1) continue;\n            seen[i][j] = true;\n            push(heightMap[i][j] * 40000 + i * n + j);\n        }\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var total = 0;\n    while (heap.length > 0) {\n        var key = pop();\n        var level = Math.floor(key / 40000);\n        var cell = key % 40000;\n        var cr = Math.floor(cell / n), cc = cell % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;\n            seen[nr][nc] = true;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            var next = heightMap[nr][nc] > level ? heightMap[nr][nc] : level;\n            push(next * 40000 + nr * n + nc);\n        }\n    }\n    return total;\n};`,
        typescript: `function trapRainWater(heightMap: number[][]): number {\n    var m = heightMap.length, n = heightMap[0].length, i: number, j: number;\n    if (m < 3 || n < 3) return 0;\n    var seen: boolean[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: boolean[] = [];\n        for (j = 0; j < n; j++) row.push(false);\n        seen.push(row);\n    }\n    var heap: number[] = [];\n    var push = function(v: number): void {\n        heap.push(v);\n        var k = heap.length - 1;\n        while (k > 0) {\n            var p = (k - 1) >> 1;\n            if (heap[p] <= heap[k]) break;\n            var t = heap[p]; heap[p] = heap[k]; heap[k] = t;\n            k = p;\n        }\n    };\n    var pop = function(): number {\n        var top = heap[0];\n        var last = heap.pop() as number;\n        if (heap.length > 0) {\n            heap[0] = last;\n            var k = 0;\n            for (;;) {\n                var l = 2 * k + 1, r = l + 1, s = k;\n                if (l < heap.length && heap[l] < heap[s]) s = l;\n                if (r < heap.length && heap[r] < heap[s]) s = r;\n                if (s === k) break;\n                var t = heap[s]; heap[s] = heap[k]; heap[k] = t;\n                k = s;\n            }\n        }\n        return top;\n    };\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (i !== 0 && i !== m - 1 && j !== 0 && j !== n - 1) continue;\n            seen[i][j] = true;\n            push(heightMap[i][j] * 40000 + i * n + j);\n        }\n    }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var total = 0;\n    while (heap.length > 0) {\n        var key = pop();\n        var level = Math.floor(key / 40000);\n        var cell = key % 40000;\n        var cr = Math.floor(cell / n), cc = cell % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;\n            seen[nr][nc] = true;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            var next = heightMap[nr][nc] > level ? heightMap[nr][nc] : level;\n            push(next * 40000 + nr * n + nc);\n        }\n    }\n    return total;\n}`,
        java: `public static int trapRainWater(int[][] heightMap) {\n    int m = heightMap.length, n = heightMap[0].length;\n    if (m < 3 || n < 3) return 0;\n    boolean[][] seen = new boolean[m][n];\n    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i != 0 && i != m - 1 && j != 0 && j != n - 1) continue;\n            seen[i][j] = true;\n            heap.add(new int[] { heightMap[i][j], i, j });\n        }\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int total = 0;\n    while (!heap.isEmpty()) {\n        int[] cur = heap.poll();\n        int level = cur[0], r = cur[1], c = cur[2];\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;\n            seen[nr][nc] = true;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            heap.add(new int[] { Math.max(level, heightMap[nr][nc]), nr, nc });\n        }\n    }\n    return total;\n}`,
        cpp: `int trapRainWater(vector<vector<int>>& heightMap) {\n    int m = (int) heightMap.size(), n = (int) heightMap[0].size();\n    if (m < 3 || n < 3) return 0;\n    vector<vector<char>> seen(m, vector<char>(n, 0));\n    priority_queue<array<int, 3>, vector<array<int, 3>>, greater<array<int, 3>>> heap;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i != 0 && i != m - 1 && j != 0 && j != n - 1) continue;\n            seen[i][j] = 1;\n            heap.push({ heightMap[i][j], i, j });\n        }\n    }\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int total = 0;\n    while (!heap.empty()) {\n        auto cur = heap.top();\n        heap.pop();\n        int level = cur[0], r = cur[1], c = cur[2];\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;\n            seen[nr][nc] = 1;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            heap.push({ max(level, heightMap[nr][nc]), nr, nc });\n        }\n    }\n    return total;\n}`,
        c: `/* The heap holds level * 40000 + cell, so a plain int heap suffices:\n   m * n <= 40000 and the level stays well inside 32 bits. */\nstatic void hpush(int* h, int* size, int v) {\n    int k = (*size)++;\n    h[k] = v;\n    while (k > 0) {\n        int p = (k - 1) / 2;\n        if (h[p] <= h[k]) break;\n        int t = h[p];\n        h[p] = h[k];\n        h[k] = t;\n        k = p;\n    }\n}\n\nstatic int hpop(int* h, int* size) {\n    int top = h[0];\n    h[0] = h[--(*size)];\n    int k = 0;\n    for (;;) {\n        int l = 2 * k + 1, r = l + 1, s = k;\n        if (l < *size && h[l] < h[s]) s = l;\n        if (r < *size && h[r] < h[s]) s = r;\n        if (s == k) break;\n        int t = h[s];\n        h[s] = h[k];\n        h[k] = t;\n        k = s;\n    }\n    return top;\n}\n\nint trapRainWater(int** heightMap, int heightMapSize, int* heightMapColSize) {\n    int m = heightMapSize, n = heightMapColSize[0];\n    if (m < 3 || n < 3) return 0;\n    char* seen = (char*) calloc((size_t) (m * n), 1);\n    int* heap = (int*) malloc((size_t) (m * n + 1) * sizeof(int));\n    int size = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i != 0 && i != m - 1 && j != 0 && j != n - 1) continue;\n            seen[i * n + j] = 1;\n            hpush(heap, &size, heightMap[i][j] * 40000 + i * n + j);\n        }\n    }\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int total = 0;\n    while (size > 0) {\n        int key = hpop(heap, &size);\n        int level = key / 40000;\n        int cell = key % 40000;\n        int r = cell / n, c = cell % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr * n + nc]) continue;\n            seen[nr * n + nc] = 1;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            int next = heightMap[nr][nc] > level ? heightMap[nr][nc] : level;\n            hpush(heap, &size, next * 40000 + nr * n + nc);\n        }\n    }\n    free(seen);\n    free(heap);\n    return total;\n}`,
        csharp: `public static int TrapRainWater(int[][] heightMap)\n{\n    int m = heightMap.Length, n = heightMap[0].Length;\n    if (m < 3 || n < 3) return 0;\n    var seen = new bool[m, n];\n    // Keys are level * 40000 + cell and every cell appears once, so they are\n    // distinct and a sorted set behaves as a min-heap.\n    var heap = new SortedSet<int>();\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (i != 0 && i != m - 1 && j != 0 && j != n - 1) continue;\n            seen[i, j] = true;\n            heap.Add(heightMap[i][j] * 40000 + i * n + j);\n        }\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int total = 0;\n    while (heap.Count > 0)\n    {\n        int key = heap.Min;\n        heap.Remove(key);\n        int level = key / 40000;\n        int cell = key % 40000;\n        int r = cell / n, c = cell % n;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr, nc]) continue;\n            seen[nr, nc] = true;\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc];\n            int next = Math.Max(level, heightMap[nr][nc]);\n            heap.Add(next * 40000 + nr * n + nc);\n        }\n    }\n    return total;\n}`,
        go: `type waterHeap []int\n\nfunc (h waterHeap) Len() int            { return len(h) }\nfunc (h waterHeap) Less(i, j int) bool  { return h[i] < h[j] }\nfunc (h waterHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }\nfunc (h *waterHeap) Push(x interface{}) { *h = append(*h, x.(int)) }\nfunc (h *waterHeap) Pop() interface{} {\n\told := *h\n\tn := len(old)\n\tv := old[n-1]\n\t*h = old[:n-1]\n\treturn v\n}\n\nfunc trapRainWater(heightMap [][]int) int {\n\tm, n := len(heightMap), len(heightMap[0])\n\tif m < 3 || n < 3 {\n\t\treturn 0\n\t}\n\tseen := make([][]bool, m)\n\tfor i := range seen {\n\t\tseen[i] = make([]bool, n)\n\t}\n\th := &waterHeap{}\n\theap.Init(h)\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif i != 0 && i != m-1 && j != 0 && j != n-1 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[i][j] = true\n\t\t\theap.Push(h, heightMap[i][j]*40000+i*n+j)\n\t\t}\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\ttotal := 0\n\tfor h.Len() > 0 {\n\t\tkey := heap.Pop(h).(int)\n\t\tlevel := key / 40000\n\t\tcell := key % 40000\n\t\tr, c := cell/n, cell%n\n\t\tfor d := 0; d < 4; d++ {\n\t\t\tnr, nc := r+dr[d], c+dc[d]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[nr][nc] = true\n\t\t\tif heightMap[nr][nc] < level {\n\t\t\t\ttotal += level - heightMap[nr][nc]\n\t\t\t}\n\t\t\tnext := level\n\t\t\tif heightMap[nr][nc] > next {\n\t\t\t\tnext = heightMap[nr][nc]\n\t\t\t}\n\t\t\theap.Push(h, next*40000+nr*n+nc)\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `import java.util.PriorityQueue\n\nfun trapRainWater(heightMap: Array<IntArray>): Int {\n    val m = heightMap.size\n    val n = heightMap[0].size\n    if (m < 3 || n < 3) return 0\n    val seen = Array(m) { BooleanArray(n) }\n    val heap = PriorityQueue<Int>()\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (i != 0 && i != m - 1 && j != 0 && j != n - 1) continue\n            seen[i][j] = true\n            heap.add(heightMap[i][j] * 40000 + i * n + j)\n        }\n    }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var total = 0\n    while (heap.isNotEmpty()) {\n        val key = heap.poll()\n        val level = key / 40000\n        val cell = key % 40000\n        val r = cell / n\n        val c = cell % n\n        for (d in 0 until 4) {\n            val nr = r + dr[d]\n            val nc = c + dc[d]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue\n            seen[nr][nc] = true\n            if (heightMap[nr][nc] < level) total += level - heightMap[nr][nc]\n            val next = maxOf(level, heightMap[nr][nc])\n            heap.add(next * 40000 + nr * n + nc)\n        }\n    }\n    return total\n}`,
        swift: `func trapRainWater(_ heightMap: [[Int]]) -> Int {\n    let m = heightMap.count\n    let n = heightMap[0].count\n    if m < 3 || n < 3 { return 0 }\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n    // Keys are level * 40000 + cell, so a plain int heap is enough.\n    var heap = [Int]()\n    func push(_ v: Int) {\n        heap.append(v)\n        var k = heap.count - 1\n        while k > 0 {\n            let p = (k - 1) / 2\n            if heap[p] <= heap[k] { break }\n            heap.swapAt(p, k)\n            k = p\n        }\n    }\n    func pop() -> Int {\n        let top = heap[0]\n        let last = heap.removeLast()\n        if !heap.isEmpty {\n            heap[0] = last\n            var k = 0\n            while true {\n                let l = 2 * k + 1, r = l + 1\n                var s = k\n                if l < heap.count && heap[l] < heap[s] { s = l }\n                if r < heap.count && heap[r] < heap[s] { s = r }\n                if s == k { break }\n                heap.swapAt(s, k)\n                k = s\n            }\n        }\n        return top\n    }\n    for i in 0..<m {\n        for j in 0..<n {\n            if i != 0 && i != m - 1 && j != 0 && j != n - 1 { continue }\n            seen[i][j] = true\n            push(heightMap[i][j] * 40000 + i * n + j)\n        }\n    }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var total = 0\n    while !heap.isEmpty {\n        let key = pop()\n        let level = key / 40000\n        let cell = key % 40000\n        let r = cell / n, c = cell % n\n        for d in 0..<4 {\n            let nr = r + dr[d], nc = c + dc[d]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc] { continue }\n            seen[nr][nc] = true\n            if heightMap[nr][nc] < level { total += level - heightMap[nr][nc] }\n            push(max(level, heightMap[nr][nc]) * 40000 + nr * n + nc)\n        }\n    }\n    return total\n}`,
        rust: `use std::collections::BinaryHeap;\nuse std::cmp::Reverse;\n\nfn trapRainWater(heightMap: Vec<Vec<i32>>) -> i32 {\n    let m = heightMap.len();\n    let n = heightMap[0].len();\n    if m < 3 || n < 3 {\n        return 0;\n    }\n    let mut seen = vec![vec![false; n]; m];\n    let mut heap: BinaryHeap<Reverse<(i32, usize, usize)>> = BinaryHeap::new();\n    for i in 0..m {\n        for j in 0..n {\n            if i != 0 && i != m - 1 && j != 0 && j != n - 1 {\n                continue;\n            }\n            seen[i][j] = true;\n            heap.push(Reverse((heightMap[i][j], i, j)));\n        }\n    }\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut total = 0i32;\n    while let Some(Reverse((level, r, c))) = heap.pop() {\n        for d in 0..4 {\n            let nr = r as i32 + dr[d];\n            let nc = c as i32 + dc[d];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            let (nr, nc) = (nr as usize, nc as usize);\n            if seen[nr][nc] {\n                continue;\n            }\n            seen[nr][nc] = true;\n            if heightMap[nr][nc] < level {\n                total += level - heightMap[nr][nc];\n            }\n            heap.push(Reverse((std::cmp::max(level, heightMap[nr][nc]), nr, nc)));\n        }\n    }\n    total\n}`,
        php: `function trapRainWater($heightMap) {\n    $m = count($heightMap);\n    $n = count($heightMap[0]);\n    if ($m < 3 || $n < 3) return 0;\n    $seen = [];\n    for ($i = 0; $i < $m; $i++) $seen[$i] = array_fill(0, $n, false);\n    // Keys are level * 40000 + cell, so SplMinHeap over ints orders correctly.\n    $heap = new SplMinHeap();\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($i !== 0 && $i !== $m - 1 && $j !== 0 && $j !== $n - 1) continue;\n            $seen[$i][$j] = true;\n            $heap->insert($heightMap[$i][$j] * 40000 + $i * $n + $j);\n        }\n    }\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $total = 0;\n    while (!$heap->isEmpty()) {\n        $key = $heap->extract();\n        $level = intdiv($key, 40000);\n        $cell = $key % 40000;\n        $r = intdiv($cell, $n);\n        $c = $cell % $n;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $r + $dr[$d];\n            $nc = $c + $dc[$d];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n || $seen[$nr][$nc]) continue;\n            $seen[$nr][$nc] = true;\n            if ($heightMap[$nr][$nc] < $level) $total += $level - $heightMap[$nr][$nc];\n            $next = max($level, $heightMap[$nr][$nc]);\n            $heap->insert($next * 40000 + $nr * $n + $nc);\n        }\n    }\n    return $total;\n}`,
        ruby: `def trapRainWater(heightMap)\n  m = heightMap.length\n  n = heightMap[0].length\n  return 0 if m < 3 || n < 3\n  seen = Array.new(m) { Array.new(n, false) }\n  # Keys are level * 40000 + cell, so a plain integer heap is enough.\n  heap = []\n  push = lambda do |v|\n    heap << v\n    k = heap.length - 1\n    while k > 0\n      p = (k - 1) / 2\n      break if heap[p] <= heap[k]\n      heap[p], heap[k] = heap[k], heap[p]\n      k = p\n    end\n  end\n  pop = lambda do\n    top = heap[0]\n    last = heap.pop\n    unless heap.empty?\n      heap[0] = last\n      k = 0\n      loop do\n        l = 2 * k + 1\n        r = l + 1\n        s = k\n        s = l if l < heap.length && heap[l] < heap[s]\n        s = r if r < heap.length && heap[r] < heap[s]\n        break if s == k\n        heap[s], heap[k] = heap[k], heap[s]\n        k = s\n      end\n    end\n    top\n  end\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next if i != 0 && i != m - 1 && j != 0 && j != n - 1\n      seen[i][j] = true\n      push.call(heightMap[i][j] * 40000 + i * n + j)\n    end\n  end\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  total = 0\n  until heap.empty?\n    key = pop.call\n    level = key / 40000\n    cell = key % 40000\n    r = cell / n\n    c = cell % n\n    (0...4).each do |d|\n      nr = r + dr[d]\n      nc = c + dc[d]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]\n      seen[nr][nc] = true\n      total += level - heightMap[nr][nc] if heightMap[nr][nc] < level\n      nxt = [level, heightMap[nr][nc]].max\n      push.call(nxt * 40000 + nr * n + nc)\n    end\n  end\n  total\nend`,
      },
    };
  })(),
];

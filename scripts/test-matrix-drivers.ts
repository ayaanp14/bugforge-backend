/**
 * Proves int[][] param + return works in every one of the 13 language drivers.
 * Runs a transpose solution per language through applyDriver → runBatch.
 *
 *   npx tsx scripts/test-matrix-drivers.ts
 */

import "dotenv/config";
import { runBatch } from "../src/lib/batch-judge.js";
import { applyDriver, type Language, type Signature } from "../src/lib/driver-codegen.js";

const SIG: Signature = {
  funcName: "transposeMatrix",
  params: [{ name: "mat", type: "int[][]" }],
  returns: "int[][]",
};

const CASES = [
  { input: "[[1,2,3],[4,5,6]]", expectedOutput: "[[1,4],[2,5],[3,6]]" },
  { input: "[[7]]", expectedOutput: "[[7]]" },
  { input: "[[1,2],[3,4]]", expectedOutput: "[[1,3],[2,4]]" },
  { input: "[[2,4,-1],[-10,5,11],[18,-7,6]]", expectedOutput: "[[2,-10,18],[4,5,-7],[-1,11,6]]" },
];

const SOLUTIONS: Record<Language, string> = {
  javascript: `var transposeMatrix = function(mat) {
    const rows = mat.length, cols = mat[0].length;
    const out = [];
    for (let j = 0; j < cols; j++) {
        const row = [];
        for (let i = 0; i < rows; i++) row.push(mat[i][j]);
        out.push(row);
    }
    return out;
};`,
  python: `from typing import List

def transposeMatrix(mat: List[List[int]]) -> List[List[int]]:
    return [list(row) for row in zip(*mat)]`,
  typescript: `function transposeMatrix(mat: number[][]): number[][] {
    const rows = mat.length, cols = mat[0].length;
    const out: number[][] = [];
    for (let j = 0; j < cols; j++) {
        const row: number[] = [];
        for (let i = 0; i < rows; i++) row.push(mat[i][j]);
        out.push(row);
    }
    return out;
}`,
  java: `    public static int[][] transposeMatrix(int[][] mat) {
        int rows = mat.length, cols = mat[0].length;
        int[][] out = new int[cols][rows];
        for (int i = 0; i < rows; i++)
            for (int j = 0; j < cols; j++)
                out[j][i] = mat[i][j];
        return out;
    }`,
  cpp: `vector<vector<int>> transposeMatrix(vector<vector<int>>& mat) {
    int rows = mat.size(), cols = mat[0].size();
    vector<vector<int>> out(cols, vector<int>(rows));
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            out[j][i] = mat[i][j];
    return out;
}`,
  c: `int** transposeMatrix(int** mat, int matSize, int* matColSize, int* returnSize, int** returnColumnSizes) {
    int rows = matSize;
    int cols = matSize > 0 ? matColSize[0] : 0;
    int** out = (int**)malloc(cols * sizeof(int*));
    *returnColumnSizes = (int*)malloc(cols * sizeof(int));
    for (int j = 0; j < cols; j++) {
        out[j] = (int*)malloc(rows * sizeof(int));
        (*returnColumnSizes)[j] = rows;
        for (int i = 0; i < rows; i++) out[j][i] = mat[i][j];
    }
    *returnSize = cols;
    return out;
}`,
  csharp: `    public static int[][] TransposeMatrix(int[][] mat)
    {
        int rows = mat.Length, cols = mat[0].Length;
        var outM = new int[cols][];
        for (int j = 0; j < cols; j++)
        {
            outM[j] = new int[rows];
            for (int i = 0; i < rows; i++) outM[j][i] = mat[i][j];
        }
        return outM;
    }`,
  go: `func transposeMatrix(mat [][]int) [][]int {
	rows := len(mat)
	cols := len(mat[0])
	out := make([][]int, cols)
	for j := 0; j < cols; j++ {
		out[j] = make([]int, rows)
		for i := 0; i < rows; i++ {
			out[j][i] = mat[i][j]
		}
	}
	return out
}`,
  kotlin: `fun transposeMatrix(mat: Array<IntArray>): Array<IntArray> {
    val rows = mat.size
    val cols = mat[0].size
    return Array(cols) { j -> IntArray(rows) { i -> mat[i][j] } }
}`,
  swift: `func transposeMatrix(_ mat: [[Int]]) -> [[Int]] {
    let rows = mat.count
    let cols = mat[0].count
    var out = [[Int]](repeating: [Int](repeating: 0, count: rows), count: cols)
    for i in 0..<rows {
        for j in 0..<cols {
            out[j][i] = mat[i][j]
        }
    }
    return out
}`,
  rust: `fn transposeMatrix(mat: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
    let rows = mat.len();
    let cols = mat[0].len();
    let mut out = vec![vec![0; rows]; cols];
    for i in 0..rows {
        for j in 0..cols {
            out[j][i] = mat[i][j];
        }
    }
    out
}`,
  php: `function transposeMatrix($mat) {
    $rows = count($mat);
    $cols = count($mat[0]);
    $out = [];
    for ($j = 0; $j < $cols; $j++) {
        $row = [];
        for ($i = 0; $i < $rows; $i++) $row[] = $mat[$i][$j];
        $out[] = $row;
    }
    return $out;
}`,
  ruby: `def transposeMatrix(mat)
  mat.transpose
end`,
};

(async () => {
  let pass = 0, fail = 0;
  for (const lang of Object.keys(SOLUTIONS) as Language[]) {
    try {
      const code = applyDriver(lang, SIG, SOLUTIONS[lang]);
      const r = await runBatch(code, lang, CASES, { timeLimitMs: 5000, memoryLimitMb: 256 });
      const ok = r.perCase.filter((x) => x.passed).length;
      if (ok === CASES.length) {
        pass++;
        console.log(`PASS ${lang} (${ok}/${CASES.length})`);
      } else {
        fail++;
        const bad = r.perCase.map((x, i) => ({ x, i })).find(({ x }) => !x.passed)!;
        console.log(`FAIL ${lang} case ${bad.i + 1}: ${bad.x.status} got=${(bad.x.actualOutput ?? bad.x.stderr ?? bad.x.compile_output ?? "").slice(0, 200)}`);
      }
    } catch (e) {
      fail++;
      console.log(`FAIL ${lang} threw: ${(e as Error).message}`);
    }
  }
  console.log(`\n== ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
})();

import { runBatch } from "../src/lib/batch-judge.js";
import { buildDriver } from "../src/lib/driver-codegen.js";

const sig = { funcName: "twoSum", params: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }], returns: "int[]" } as any;
const cases = [
  { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
  { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
];
const limits = { timeLimitMs: 2000, memoryLimitMb: 128 };
const show = (r: { perCase: Array<{ verdict: string; stderr: string | null; actualOutput: string | null }>; userStdout: string | null }) =>
  JSON.stringify({ verdicts: r.perCase.map((c) => c.verdict), out: r.perCase.map((c) => c.actualOutput), user: r.userStdout });

async function main() {
  // JS: a stray debug print — still judged correctly, print returned separately.
  const jsNoisy = 'function twoSum(nums, target) { console.log("debug", nums.length); var m = {}; for (var i = 0; i < nums.length; i++) { if (m[target - nums[i]] !== undefined) return [m[target - nums[i]], i]; m[nums[i]] = i; } return []; }';
  console.log("js noisy  :", show(await runBatch(jsNoisy, "javascript", cases, limits)));

  // JS: forged block, marker assembled at runtime — must NOT pass.
  const jsForge = 'function twoSum(nums, target) { process.stdout.write("[0,1]\\n__CODEXA" + "_CASE__\\n[1,2]\\n__CODEXA" + "_CASE__\\n"); return [9, 9]; }';
  console.log("js forged :", show(await runBatch(jsForge, "javascript", cases, limits)));

  // Python: forged block.
  const pyForge = 'def twoSum(nums, target):\n    print("[0,1]\\n__CODEXA" + "_CASE__\\n[1,2]\\n__CODEXA" + "_CASE__")\n    return [9, 9]\n';
  console.log("py forged :", show(await runBatch(pyForge, "python", cases, limits)));

  // C++: stray cout in user code.
  const cppNoisy = 'vector<int> twoSum(vector<int> nums, int target) { cout << "dbg" << endl; for (int i = 0; i < (int)nums.size(); i++) for (int j = i + 1; j < (int)nums.size(); j++) if (nums[i] + nums[j] == target) return {i, j}; return {}; }';
  console.log("cpp noisy :", show(await runBatch(buildDriver("cpp", sig, cppNoisy).code, "cpp", cases, limits)));

  // C: stray printf in user code.
  const cNoisy = 'int* twoSum(int* nums, int numsSize, int target, int* returnSize) { printf("dbg\\n"); int* r = (int*)malloc(2 * sizeof(int)); *returnSize = 2; for (int i = 0; i < numsSize; i++) for (int j = i + 1; j < numsSize; j++) if (nums[i] + nums[j] == target) { r[0] = i; r[1] = j; return r; } *returnSize = 0; return r; }';
  console.log("c noisy   :", show(await runBatch(buildDriver("c", sig, cNoisy).code, "c", cases, limits)));

  // Rust: stray println in user code.
  const rsNoisy = 'fn twoSum(nums: Vec<i32>, target: i32) -> Vec<i32> { println!("dbg"); for i in 0..nums.len() { for j in i + 1..nums.len() { if nums[i] + nums[j] == target { return vec![i as i32, j as i32]; } } } vec![] }';
  console.log("rust noisy:", show(await runBatch(buildDriver("rust", sig, rsNoisy).code, "rust", cases, limits)));

  // Swift: stray print in user code.
  const swNoisy = 'func twoSum(_ nums: [Int], _ target: Int) -> [Int] { print("dbg"); for i in 0..<nums.count { for j in (i + 1)..<nums.count { if nums[i] + nums[j] == target { return [i, j] } } }; return [] }';
  console.log("swift noisy:", show(await runBatch(buildDriver("swift", sig, swNoisy).code, "swift", cases, limits)));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

/**
 * Math & number theory problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h, so
 * square roots and powers are written as integer loops.
 *
 * Most references here are brute force over small inputs (simulation, BFS,
 * enumeration). Where the generator also wants inputs too large to brute-force
 * (n up to 10^9), the reference switches to an independent closed form and the
 * generator cross-checks that closed form against the brute force on every
 * small case it draws, so a wrong formula fails loudly instead of seeding a
 * wrong answer.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

const gcdTs = (a: number, b: number): number => {
  while (b !== 0) { const t = a % b; a = b; b = t; }
  return a;
};

export const MATH6_PROBLEMS: CatalogProblem[] = [

  // ── Bulb Switcher II (LC 672) ───────────────────────────────────
  (() => {
    // Brute force: a button pressed twice cancels out, so only the parity of
    // each button matters. A parity mask with c ones is reachable in exactly
    // `presses` presses when c <= presses and the spare presses pair up.
    // Bulbs repeat with period 6, so the first min(n, 6) bulbs decide a state.
    const ref = (n: number, presses: number) => {
      const len = Math.min(n, 6);
      const seen = new Set<string>();
      for (let mask = 0; mask < 16; mask++) {
        let c = 0;
        for (let b = 0; b < 4; b++) if (mask & (1 << b)) c++;
        if (c > presses || (presses - c) % 2 !== 0) continue;
        let s = "";
        for (let label = 1; label <= len; label++) {
          let on = 1;
          if (mask & 1) on ^= 1;
          if ((mask & 2) && label % 2 === 0) on ^= 1;
          if ((mask & 4) && label % 2 === 1) on ^= 1;
          if ((mask & 8) && label % 3 === 1) on ^= 1;
          s += on;
        }
        seen.add(s);
      }
      return seen.size;
    };
    return {
      slug: "bulb-switcher-ii",
      title: "Bulb Switcher II",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Bit Manipulation", "Breadth-First Search", "Microsoft", "Google"],
      signature: { funcName: "flipLights", params: [{ name: "n", type: "int" as const }, { name: "presses", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A row of `n` bulbs is labelled `1` to `n`, and every bulb starts **on**. A panel has four buttons:\n\n- **Button 1** flips every bulb.\n- **Button 2** flips the bulbs with even labels.\n- **Button 3** flips the bulbs with odd labels.\n- **Button 4** flips the bulbs whose label is `3k + 1` for some `k >= 0` (labels `1, 4, 7, 10, …`).\n\nYou must make **exactly** `presses` button presses in total; each press may use any of the four buttons, and a button may be pressed any number of times.\n\nReturn how many **different** on/off patterns of the row are possible after all the presses.",
        [
          { in: "n = 1, presses = 1", out: "2", note: "The single bulb ends either off (buttons 1, 3 or 4) or on (button 2)." },
          { in: "n = 2, presses = 1", out: "3", note: "The patterns are [off, off], [on, off] and [off, on]." },
          { in: "n = 3, presses = 1", out: "4" },
        ],
        ["1 <= n <= 1000", "0 <= presses <= 1000"]),
      hints: [
        "Pressing the same button twice changes nothing, so only whether each button was pressed an odd or even number of times matters — at most 16 combinations.",
        "Look at which bulbs each button touches: the pattern repeats every 6 bulbs, and bulbs 4, 5 and 6 are determined by bulbs 1, 2 and 3.",
        "So the answer only depends on min(n, 3) and on whether presses is 0, 1, 2 or at least 3. Work those twelve cases out by hand.",
      ],
      editorial: explain({
        idea: "Only the parity of each button matters, and every bulb's state is a function of the first three bulbs' states, so the answer depends on just `min(n, 3)` and on `presses` capped at 3.",
        steps: [
          "If `presses` is 0, only the all-on pattern exists: return 1.",
          "Let `m = min(n, 3)`.",
          "With one press the four buttons give 2, 3 or 4 patterns for `m` = 1, 2, 3.",
          "With two presses the reachable button sets are the empty set and every pair: 2, 4 or 7 patterns.",
          "With three or more presses every parity combination of the right size is reachable and all 8 patterns of three bulbs appear (2 and 4 for one and two bulbs).",
        ],
        why: "Toggles commute, so the outcome is decided by which buttons were used an odd number of times; a set of `c` buttons is reachable when `c <= presses` and `presses - c` is even (spare presses cancel in pairs). Whether a button touches bulb `i` depends only on `i mod 2` and `i mod 3`, so the row repeats every 6 bulbs. Within those six, bulb 5 always equals bulb 3, bulb 6 equals bulb 2, and bulb 4 is the xor of bulbs 1, 2 and 3 — so the first three bulbs decide the whole row. Listing the toggles on bulbs 1–3 for one press gives 4 patterns; for two presses (no button, or any pair) gives 7, the missing one being button 4 alone (only bulb 1 off); with three or more presses all 8 appear. With one bulb any positive number of presses gives 2 patterns; with two bulbs one press gives 3 and two or more give 4.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "`presses = 0` means exactly one pattern even for large `n`.",
          "Two presses give 7, not 8: the pattern reached by button 4 alone is not reachable with exactly two presses.",
          "Simulating presses one at a time explodes as 4^presses — reduce to parities first.",
        ],
      }),
      examples: [
        { input: "1\n1", expectedOutput: "2" },
        { input: "2\n1", expectedOutput: "3" },
        { input: "3\n1", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 3);
        const n = shape === 0 ? ri(rng, 1, 4) : shape === 1 ? ri(rng, 1, 10) : shape === 2 ? ri(rng, 1, 1000) : pick(rng, [1, 2, 3, 1000]);
        const p = ri(rng, 0, 2) === 0 ? ri(rng, 0, 1000) : ri(rng, 0, 5);
        return { input: `${n}\n${p}`, expectedOutput: String(ref(n, p)) };
      },
      solutions: {
        python: code`
          def flipLights(n: int, presses: int) -> int:
              m = min(n, 3)
              if presses == 0:
                  return 1
              if presses == 1:
                  return [2, 3, 4][m - 1]
              if presses == 2:
                  return [2, 4, 7][m - 1]
              return [2, 4, 8][m - 1]
        `,
        javascript: code`
          var flipLights = function(n, presses) {
              var m = Math.min(n, 3);
              if (presses === 0) return 1;
              if (presses === 1) return [2, 3, 4][m - 1];
              if (presses === 2) return [2, 4, 7][m - 1];
              return [2, 4, 8][m - 1];
          };
        `,
        typescript: code`
          function flipLights(n: number, presses: number): number {
              var m = Math.min(n, 3);
              var one: number[] = [2, 3, 4];
              var two: number[] = [2, 4, 7];
              var many: number[] = [2, 4, 8];
              if (presses === 0) return 1;
              if (presses === 1) return one[m - 1];
              if (presses === 2) return two[m - 1];
              return many[m - 1];
          }
        `,
        java: code`
          public static int flipLights(int n, int presses) {
              int m = Math.min(n, 3);
              int[] one = {2, 3, 4};
              int[] two = {2, 4, 7};
              int[] many = {2, 4, 8};
              if (presses == 0) return 1;
              if (presses == 1) return one[m - 1];
              if (presses == 2) return two[m - 1];
              return many[m - 1];
          }
        `,
        cpp: code`
          int flipLights(int n, int presses) {
              int m = min(n, 3);
              static const int one[3] = {2, 3, 4};
              static const int two[3] = {2, 4, 7};
              static const int many[3] = {2, 4, 8};
              if (presses == 0) return 1;
              if (presses == 1) return one[m - 1];
              if (presses == 2) return two[m - 1];
              return many[m - 1];
          }
        `,
        c: code`
          int flipLights(int n, int presses) {
              int m = n < 3 ? n : 3;
              int one[3] = {2, 3, 4};
              int two[3] = {2, 4, 7};
              int many[3] = {2, 4, 8};
              if (presses == 0) return 1;
              if (presses == 1) return one[m - 1];
              if (presses == 2) return two[m - 1];
              return many[m - 1];
          }
        `,
        csharp: code`
          public static int FlipLights(int n, int presses)
          {
              int m = Math.Min(n, 3);
              int[] one = { 2, 3, 4 };
              int[] two = { 2, 4, 7 };
              int[] many = { 2, 4, 8 };
              if (presses == 0) return 1;
              if (presses == 1) return one[m - 1];
              if (presses == 2) return two[m - 1];
              return many[m - 1];
          }
        `,
        go: code`
          func flipLights(n int, presses int) int {
          	m := n
          	if m > 3 {
          		m = 3
          	}
          	if presses == 0 {
          		return 1
          	}
          	if presses == 1 {
          		return []int{2, 3, 4}[m-1]
          	}
          	if presses == 2 {
          		return []int{2, 4, 7}[m-1]
          	}
          	return []int{2, 4, 8}[m-1]
          }
        `,
        kotlin: code`
          fun flipLights(n: Int, presses: Int): Int {
              val m = minOf(n, 3)
              if (presses == 0) return 1
              if (presses == 1) return intArrayOf(2, 3, 4)[m - 1]
              if (presses == 2) return intArrayOf(2, 4, 7)[m - 1]
              return intArrayOf(2, 4, 8)[m - 1]
          }
        `,
        swift: code`
          func flipLights(_ n: Int, _ presses: Int) -> Int {
              let m = min(n, 3)
              if presses == 0 { return 1 }
              if presses == 1 { return [2, 3, 4][m - 1] }
              if presses == 2 { return [2, 4, 7][m - 1] }
              return [2, 4, 8][m - 1]
          }
        `,
        rust: code`
          fn flipLights(n: i32, presses: i32) -> i32 {
              let m = std::cmp::min(n, 3) as usize;
              let one = [2, 3, 4];
              let two = [2, 4, 7];
              let many = [2, 4, 8];
              if presses == 0 {
                  return 1;
              }
              if presses == 1 {
                  return one[m - 1];
              }
              if presses == 2 {
                  return two[m - 1];
              }
              many[m - 1]
          }
        `,
        php: code`
          function flipLights($n, $presses) {
              $m = $n < 3 ? $n : 3;
              if ($presses == 0) return 1;
              if ($presses == 1) return [2, 3, 4][$m - 1];
              if ($presses == 2) return [2, 4, 7][$m - 1];
              return [2, 4, 8][$m - 1];
          }
        `,
        ruby: code`
          def flipLights(n, presses)
            m = [n, 3].min
            return 1 if presses == 0
            return [2, 3, 4][m - 1] if presses == 1
            return [2, 4, 7][m - 1] if presses == 2
            [2, 4, 8][m - 1]
          end
        `,
      },
    };
  })(),

  // ── Water and Jug Problem (LC 365) ──────────────────────────────
  (() => {
    // Brute force: BFS over every (jug1, jug2) content pair.
    const ref = (x: number, y: number, target: number) => {
      const seen = new Uint8Array((x + 1) * (y + 1));
      const queue: number[] = [0];
      seen[0] = 1;
      for (let qi = 0; qi < queue.length; qi++) {
        const a = Math.floor(queue[qi] / (y + 1)), b = queue[qi] % (y + 1);
        if (a + b === target) return true;
        const pourAB = Math.min(a, y - b), pourBA = Math.min(b, x - a);
        const nexts = [[x, b], [a, y], [0, b], [a, 0], [a - pourAB, b + pourAB], [a + pourBA, b - pourBA]];
        for (const [na, nb] of nexts) {
          const id = na * (y + 1) + nb;
          if (!seen[id]) { seen[id] = 1; queue.push(id); }
        }
      }
      return false;
    };
    return {
      slug: "water-and-jug-problem",
      title: "Water and Jug Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Depth-First Search", "Breadth-First Search", "Microsoft", "Google"],
      signature: { funcName: "canMeasureWater", params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }, { name: "target", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You have two empty jugs holding up to `x` and `y` litres, and an unlimited tap. The allowed operations are:\n\n- fill either jug to the brim;\n- empty either jug completely;\n- pour from one jug into the other until the receiving jug is full or the pouring jug is empty.\n\nReturn `true` if, after some sequence of operations, the **total** amount of water in the two jugs can be exactly `target` litres.",
        [
          { in: "x = 3, y = 5, target = 4", out: "true", note: "Fill the 5, pour into the 3 (leaving 2), empty the 3, pour the 2 across, fill the 5, top the 3 up from it (leaving 4 in the 5-litre jug), then empty the 3: 4 litres in total." },
          { in: "x = 4, y = 6, target = 7", out: "false", note: "Every amount you can ever hold is even." },
          { in: "x = 1, y = 2, target = 3", out: "true" },
        ],
        ["1 <= x, y, target <= 1000"]),
      hints: [
        "Think of the total amount of water. Each operation changes the total by `x`, by `y`, or not at all.",
        "So any total you can reach is a combination `a*x + b*y` — which totals of that form are actually reachable without exceeding the jugs?",
        "By Bézout's identity, the reachable totals are exactly the multiples of `gcd(x, y)` that do not exceed `x + y`.",
      ],
      editorial: explain({
        idea: "The reachable totals are exactly the multiples of `gcd(x, y)` between 0 and `x + y`.",
        steps: [
          "If `target > x + y`, the jugs cannot hold it: return `false`.",
          "Compute `g = gcd(x, y)` with the Euclidean algorithm.",
          "Return whether `target` is a multiple of `g`.",
        ],
        why: "Every operation either leaves the total unchanged (pouring) or adds or removes a full jug's worth (`x` or `y`), so every reachable total is an integer combination of `x` and `y` — a multiple of `g`. Conversely, repeatedly filling one jug and pouring it into the other, emptying the other whenever it is full, walks through the residues `k*x mod y` and produces every multiple of `g` up to `y` in one jug; adding a full second jug covers the rest up to `x + y`. That is Bézout's identity made concrete, and the BFS over all states agrees with it.",
        time: "O(log min(x, y))",
        space: "O(1)",
        pitfalls: [
          "The target is the total in **both** jugs, not the content of one jug.",
          "Forgetting the `target <= x + y` bound: 10 is a multiple of gcd(3, 5) but does not fit.",
          "A full BFS over (x+1)(y+1) states works but costs a million states at the upper limit.",
        ],
      }),
      examples: [
        { input: "3\n5\n4", expectedOutput: "true" },
        { input: "4\n6\n7", expectedOutput: "false" },
        { input: "1\n2\n3", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        const cap = shape < 5 ? 12 : 45;
        let x = ri(rng, 1, cap), y = ri(rng, 1, cap);
        if (shape === 9) { const g = ri(rng, 2, 6); x = g * ri(rng, 1, 7); y = g * ri(rng, 1, 7); }
        let target: number;
        const t = ri(rng, 0, 9);
        if (t === 0) target = ri(rng, 1, 1000);
        else if (t === 1) target = x + y;
        else if (t === 2) target = Math.min(1000, x + y + ri(rng, 1, 3));
        else target = ri(rng, 1, x + y);
        return { input: `${x}\n${y}\n${target}`, expectedOutput: bool(ref(x, y, target)) };
      },
      solutions: {
        python: code`
          def canMeasureWater(x: int, y: int, target: int) -> bool:
              if target > x + y:
                  return False
              a, b = x, y
              while b:
                  a, b = b, a % b
              return target % a == 0
        `,
        javascript: code`
          var canMeasureWater = function(x, y, target) {
              if (target > x + y) return false;
              var a = x, b = y;
              while (b !== 0) {
                  var t = a % b;
                  a = b;
                  b = t;
              }
              return target % a === 0;
          };
        `,
        typescript: code`
          function canMeasureWater(x: number, y: number, target: number): boolean {
              if (target > x + y) return false;
              var a = x, b = y;
              while (b !== 0) {
                  var t = a % b;
                  a = b;
                  b = t;
              }
              return target % a === 0;
          }
        `,
        java: code`
          public static boolean canMeasureWater(int x, int y, int target) {
              if (target > x + y) return false;
              int a = x, b = y;
              while (b != 0) {
                  int t = a % b;
                  a = b;
                  b = t;
              }
              return target % a == 0;
          }
        `,
        cpp: code`
          bool canMeasureWater(int x, int y, int target) {
              if (target > x + y) return false;
              int a = x, b = y;
              while (b != 0) {
                  int t = a % b;
                  a = b;
                  b = t;
              }
              return target % a == 0;
          }
        `,
        c: code`
          bool canMeasureWater(int x, int y, int target) {
              if (target > x + y) return false;
              int a = x, b = y;
              while (b != 0) {
                  int t = a % b;
                  a = b;
                  b = t;
              }
              return target % a == 0;
          }
        `,
        csharp: code`
          public static bool CanMeasureWater(int x, int y, int target)
          {
              if (target > x + y) return false;
              int a = x, b = y;
              while (b != 0)
              {
                  int t = a % b;
                  a = b;
                  b = t;
              }
              return target % a == 0;
          }
        `,
        go: code`
          func canMeasureWater(x int, y int, target int) bool {
          	if target > x+y {
          		return false
          	}
          	a, b := x, y
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return target%a == 0
          }
        `,
        kotlin: code`
          fun canMeasureWater(x: Int, y: Int, target: Int): Boolean {
              if (target > x + y) return false
              var a = x
              var b = y
              while (b != 0) {
                  val t = a % b
                  a = b
                  b = t
              }
              return target % a == 0
          }
        `,
        swift: code`
          func canMeasureWater(_ x: Int, _ y: Int, _ target: Int) -> Bool {
              if target > x + y { return false }
              var a = x
              var b = y
              while b != 0 {
                  let t = a % b
                  a = b
                  b = t
              }
              return target % a == 0
          }
        `,
        rust: code`
          fn canMeasureWater(x: i32, y: i32, target: i32) -> bool {
              if target > x + y {
                  return false;
              }
              let mut a = x;
              let mut b = y;
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              target % a == 0
          }
        `,
        php: code`
          function canMeasureWater($x, $y, $target) {
              if ($target > $x + $y) return false;
              $a = $x;
              $b = $y;
              while ($b != 0) {
                  $t = $a % $b;
                  $a = $b;
                  $b = $t;
              }
              return $target % $a == 0;
          }
        `,
        ruby: code`
          def canMeasureWater(x, y, target)
            return false if target > x + y
            target % x.gcd(y) == 0
          end
        `,
      },
    };
  })(),

  // ── Elimination Game (LC 390) ───────────────────────────────────
  (() => {
    // Brute force for small n: really delete every other element.
    const simulate = (n: number) => {
      let arr: number[] = [];
      for (let i = 1; i <= n; i++) arr.push(i);
      let leftToRight = true;
      while (arr.length > 1) {
        const keep: number[] = [];
        if (leftToRight) {
          for (let i = 1; i < arr.length; i += 2) keep.push(arr[i]);
        } else {
          for (let i = arr.length - 2; i >= 0; i -= 2) keep.push(arr[i]);
          keep.reverse();
        }
        arr = keep;
        leftToRight = !leftToRight;
      }
      return arr[0];
    };
    // Independent closed form for large n: after the first sweep the survivors
    // are 2, 4, …, 2*floor(n/2) and the next sweep runs right to left, which is
    // the mirror image of the game on floor(n/2) numbers.
    const mirror = (n: number): number => (n === 1 ? 1 : 2 * (1 + Math.floor(n / 2) - mirror(Math.floor(n / 2))));
    const ref = (n: number) => {
      if (n <= 4000) {
        const s = simulate(n);
        if (s !== mirror(n)) throw new Error(`elimination-game: mirror formula disagrees at ${n}`);
        return s;
      }
      return mirror(n);
    };
    return {
      slug: "elimination-game",
      title: "Elimination Game",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Recursion", "Bloomberg", "Amazon"],
      signature: { funcName: "lastRemaining", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Write the numbers `1, 2, …, n` in a row, in increasing order. Then repeat these sweeps until a single number is left:\n\n1. Going **left to right**, delete the first number and then every other number after it.\n2. Going **right to left**, delete the rightmost number and then every other number before it.\n\nThe sweeps keep alternating direction. Return the number that survives.",
        [
          { in: "n = 9", out: "6", note: "1 2 3 4 5 6 7 8 9 → 2 4 6 8 → 2 6 → 6." },
          { in: "n = 6", out: "4", note: "1 2 3 4 5 6 → 2 4 6 → 4." },
          { in: "n = 1", out: "1" },
        ],
        ["1 <= n <= 10^9"]),
      hints: [
        "You cannot build the list for n = 10^9. Track only the first surviving number, the gap between survivors, and how many remain.",
        "Every sweep halves the count and doubles the gap between neighbours.",
        "The first survivor moves forward by one gap on a left-to-right sweep, and on a right-to-left sweep only when the count is odd.",
      ],
      editorial: explain({
        idea: "The survivors always form an arithmetic sequence, so it is enough to track its first term (`head`), its common difference (`step`) and its length.",
        steps: [
          "Start with `head = 1`, `step = 1`, `remaining = n` and the direction left-to-right.",
          "While `remaining > 1`: if the sweep goes left to right, or the count is odd, the current head is deleted and `head += step`.",
          "Halve `remaining` (rounding down), double `step`, and flip the direction.",
          "Return `head`.",
        ],
        why: "A left-to-right sweep always deletes the first element, so the new head is the old second element. A right-to-left sweep starts at the last element and deletes alternate ones; it reaches the first element exactly when the count is odd. Either way the survivors are every second element of the old sequence, so they remain an arithmetic sequence with double the difference and half the length (rounded down). After about `log2 n` sweeps one element is left, and it is the head.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "A right-to-left sweep removes the head only when the count is odd — with an even count the head survives.",
          "Simulating the list is O(n) memory and far too slow for 10^9.",
          "The step doubles each round; with n ≤ 10^9 it stays below 2^30, so 32-bit ints are fine.",
        ],
      }),
      examples: [
        { input: "9", expectedOutput: "6" },
        { input: "6", expectedOutput: "4" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let n: number;
        if (shape < 3) n = ri(rng, 1, 40);
        else if (shape < 6) n = ri(rng, 41, 4000);
        else if (shape < 8) n = ri(rng, 4001, 1000000000);
        else if (shape === 8) n = Math.min(1000000000, Math.pow(2, ri(rng, 0, 29)) + ri(rng, -1, 1)) || 1;
        else n = pick(rng, [1, 2, 3, 1000000000, 999999999, 536870912]);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def lastRemaining(n: int) -> int:
              head, step, remaining, left = 1, 1, n, True
              while remaining > 1:
                  if left or remaining % 2 == 1:
                      head += step
                  remaining //= 2
                  step *= 2
                  left = not left
              return head
        `,
        javascript: code`
          var lastRemaining = function(n) {
              var head = 1, step = 1, remaining = n, left = true;
              while (remaining > 1) {
                  if (left || remaining % 2 === 1) head += step;
                  remaining = Math.floor(remaining / 2);
                  step *= 2;
                  left = !left;
              }
              return head;
          };
        `,
        typescript: code`
          function lastRemaining(n: number): number {
              var head = 1, step = 1, remaining = n, left = true;
              while (remaining > 1) {
                  if (left || remaining % 2 === 1) head += step;
                  remaining = Math.floor(remaining / 2);
                  step *= 2;
                  left = !left;
              }
              return head;
          }
        `,
        java: code`
          public static int lastRemaining(int n) {
              int head = 1, step = 1, remaining = n;
              boolean left = true;
              while (remaining > 1) {
                  if (left || remaining % 2 == 1) head += step;
                  remaining /= 2;
                  step *= 2;
                  left = !left;
              }
              return head;
          }
        `,
        cpp: code`
          int lastRemaining(int n) {
              long long head = 1, step = 1, remaining = n;
              bool left = true;
              while (remaining > 1) {
                  if (left || remaining % 2 == 1) head += step;
                  remaining /= 2;
                  step *= 2;
                  left = !left;
              }
              return (int)head;
          }
        `,
        c: code`
          int lastRemaining(int n) {
              long long head = 1, step = 1, remaining = n;
              bool left = true;
              while (remaining > 1) {
                  if (left || remaining % 2 == 1) head += step;
                  remaining /= 2;
                  step *= 2;
                  left = !left;
              }
              return (int)head;
          }
        `,
        csharp: code`
          public static int LastRemaining(int n)
          {
              long head = 1, step = 1, remaining = n;
              bool left = true;
              while (remaining > 1)
              {
                  if (left || remaining % 2 == 1) head += step;
                  remaining /= 2;
                  step *= 2;
                  left = !left;
              }
              return (int)head;
          }
        `,
        go: code`
          func lastRemaining(n int) int {
          	head, step, remaining := 1, 1, n
          	left := true
          	for remaining > 1 {
          		if left || remaining%2 == 1 {
          			head += step
          		}
          		remaining /= 2
          		step *= 2
          		left = !left
          	}
          	return head
          }
        `,
        kotlin: code`
          fun lastRemaining(n: Int): Int {
              var head = 1L
              var step = 1L
              var remaining = n
              var left = true
              while (remaining > 1) {
                  if (left || remaining % 2 == 1) head += step
                  remaining /= 2
                  step *= 2
                  left = !left
              }
              return head.toInt()
          }
        `,
        swift: code`
          func lastRemaining(_ n: Int) -> Int {
              var head = 1
              var step = 1
              var remaining = n
              var left = true
              while remaining > 1 {
                  if left || remaining % 2 == 1 { head += step }
                  remaining /= 2
                  step *= 2
                  left = !left
              }
              return head
          }
        `,
        rust: code`
          fn lastRemaining(n: i32) -> i32 {
              let mut head: i64 = 1;
              let mut step: i64 = 1;
              let mut remaining: i64 = n as i64;
              let mut left = true;
              while remaining > 1 {
                  if left || remaining % 2 == 1 {
                      head += step;
                  }
                  remaining /= 2;
                  step *= 2;
                  left = !left;
              }
              head as i32
          }
        `,
        php: code`
          function lastRemaining($n) {
              $head = 1;
              $step = 1;
              $remaining = $n;
              $left = true;
              while ($remaining > 1) {
                  if ($left || $remaining % 2 == 1) $head += $step;
                  $remaining = intdiv($remaining, 2);
                  $step *= 2;
                  $left = !$left;
              }
              return $head;
          }
        `,
        ruby: code`
          def lastRemaining(n)
            head = 1
            step = 1
            remaining = n
            left = true
            while remaining > 1
              head += step if left || remaining.odd?
              remaining /= 2
              step *= 2
              left = !left
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Poor Pigs (LC 458) ──────────────────────────────────────────
  (() => {
    // Brute force: try pig counts 0, 1, 2, … until (rounds + 1)^pigs covers
    // the buckets (computed with Math.pow, independently of the loops below).
    const ref = (buckets: number, minutesToDie: number, minutesToTest: number) => {
      const rounds = Math.floor(minutesToTest / minutesToDie);
      for (let pigs = 0; ; pigs++) if (Math.pow(rounds + 1, pigs) >= buckets) return pigs;
    };
    return {
      slug: "poor-pigs",
      title: "Poor Pigs",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Google", "Amazon"],
      signature: {
        funcName: "poorPigs",
        params: [{ name: "buckets", type: "int" as const }, { name: "minutesToDie", type: "int" as const }, { name: "minutesToTest", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Exactly one of `buckets` buckets of liquid is poisoned, and you want to find out which one using pigs, within `minutesToTest` minutes.\n\nTesting works in rounds:\n\n1. Choose some live pigs and let each of them drink from any set of buckets (simultaneously, taking no time; a bucket may be shared by many pigs and a pig may drink from many buckets).\n2. Wait `minutesToDie` minutes. A pig that drank the poison dies at the end of the wait; the others survive. No other feeding can happen during the wait.\n3. Repeat with the surviving pigs while time remains.\n\nReturn the **minimum** number of pigs that guarantees identifying the poisoned bucket within the time limit.",
        [
          { in: "buckets = 4, minutesToDie = 15, minutesToTest = 15", out: "2", note: "One round. Pig A drinks buckets 1 and 2, pig B drinks buckets 2 and 3. Their four possible fates (A dies, B dies, both, neither) name the bucket." },
          { in: "buckets = 4, minutesToDie = 15, minutesToTest = 30", out: "2" },
          { in: "buckets = 1000, minutesToDie = 15, minutesToTest = 60", out: "5" },
        ],
        ["1 <= buckets <= 1000", "1 <= minutesToDie <= minutesToTest <= 100"]),
      hints: [
        "With `T = floor(minutesToTest / minutesToDie)` rounds, a single pig's fate has `T + 1` outcomes: it dies after round 1, after round 2, …, or survives.",
        "Pigs are independent, so `p` pigs can produce `(T + 1)^p` distinguishable outcomes.",
        "Find the smallest `p` with `(T + 1)^p >= buckets` — and show that many outcomes can always be realised.",
      ],
      editorial: explain({
        idea: "A pig is a digit in base `T + 1`, where `T` is the number of rounds: the round it dies in (or survival) is its digit, so `p` pigs can tell apart `(T + 1)^p` buckets.",
        steps: [
          "Compute `states = minutesToTest / minutesToDie + 1` (integer division).",
          "Start with `pigs = 0` and `reach = 1` (one bucket needs no test).",
          "While `reach < buckets`, multiply `reach` by `states` and add a pig.",
          "Return `pigs`.",
        ],
        why: "Upper bound: number the buckets 0 … buckets−1 in base `T + 1` with `p` digits. In round `r`, pig `j` drinks from every bucket whose `j`-th digit is `r`. If the poison's `j`-th digit is `d`, pig `j` dies in round `d` (or survives when `d = T`), so the fates spell out the poisoned bucket's number. Lower bound: each pig's whole history is one of `T + 1` outcomes, so `p` pigs produce at most `(T + 1)^p` different observations, and two buckets with the same observation cannot be told apart. Hence the smallest `p` with `(T + 1)^p >= buckets` is exact.",
        time: "O(log buckets)",
        space: "O(1)",
        pitfalls: [
          "One bucket needs zero pigs.",
          "The base is `T + 1`, not `T` — survival is an outcome too.",
          "Floating-point logarithms can round `log(125)/log(5)` to 3.0000000004 and add a pig; multiply integers instead.",
        ],
      }),
      examples: [
        { input: "4\n15\n15", expectedOutput: "2" },
        { input: "4\n15\n30", expectedOutput: "2" },
        { input: "1000\n15\n60", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 4);
        const buckets = shape === 0 ? ri(rng, 1, 10) : shape === 1 ? pick(rng, [1, 2, 8, 9, 16, 25, 27, 64, 81, 125, 243, 256, 625, 729, 1000]) : ri(rng, 1, 1000);
        const minutesToDie = ri(rng, 0, 2) === 0 ? ri(rng, 1, 100) : ri(rng, 1, 30);
        const minutesToTest = ri(rng, minutesToDie, 100);
        return { input: `${buckets}\n${minutesToDie}\n${minutesToTest}`, expectedOutput: String(ref(buckets, minutesToDie, minutesToTest)) };
      },
      solutions: {
        python: code`
          def poorPigs(buckets: int, minutesToDie: int, minutesToTest: int) -> int:
              states = minutesToTest // minutesToDie + 1
              pigs = 0
              reach = 1
              while reach < buckets:
                  reach *= states
                  pigs += 1
              return pigs
        `,
        javascript: code`
          var poorPigs = function(buckets, minutesToDie, minutesToTest) {
              var states = Math.floor(minutesToTest / minutesToDie) + 1;
              var pigs = 0, reach = 1;
              while (reach < buckets) {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          };
        `,
        typescript: code`
          function poorPigs(buckets: number, minutesToDie: number, minutesToTest: number): number {
              var states = Math.floor(minutesToTest / minutesToDie) + 1;
              var pigs = 0, reach = 1;
              while (reach < buckets) {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          }
        `,
        java: code`
          public static int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
              int states = minutesToTest / minutesToDie + 1;
              int pigs = 0;
              long reach = 1;
              while (reach < buckets) {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          }
        `,
        cpp: code`
          int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
              int states = minutesToTest / minutesToDie + 1;
              int pigs = 0;
              long long reach = 1;
              while (reach < buckets) {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          }
        `,
        c: code`
          int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
              int states = minutesToTest / minutesToDie + 1;
              int pigs = 0;
              long long reach = 1;
              while (reach < buckets) {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          }
        `,
        csharp: code`
          public static int PoorPigs(int buckets, int minutesToDie, int minutesToTest)
          {
              int states = minutesToTest / minutesToDie + 1;
              int pigs = 0;
              long reach = 1;
              while (reach < buckets)
              {
                  reach *= states;
                  pigs++;
              }
              return pigs;
          }
        `,
        go: code`
          func poorPigs(buckets int, minutesToDie int, minutesToTest int) int {
          	states := minutesToTest/minutesToDie + 1
          	pigs, reach := 0, 1
          	for reach < buckets {
          		reach *= states
          		pigs++
          	}
          	return pigs
          }
        `,
        kotlin: code`
          fun poorPigs(buckets: Int, minutesToDie: Int, minutesToTest: Int): Int {
              val states = minutesToTest / minutesToDie + 1
              var pigs = 0
              var reach = 1L
              while (reach < buckets) {
                  reach *= states
                  pigs++
              }
              return pigs
          }
        `,
        swift: code`
          func poorPigs(_ buckets: Int, _ minutesToDie: Int, _ minutesToTest: Int) -> Int {
              let states = minutesToTest / minutesToDie + 1
              var pigs = 0
              var reach = 1
              while reach < buckets {
                  reach *= states
                  pigs += 1
              }
              return pigs
          }
        `,
        rust: code`
          fn poorPigs(buckets: i32, minutesToDie: i32, minutesToTest: i32) -> i32 {
              let states = (minutesToTest / minutesToDie + 1) as i64;
              let mut pigs = 0;
              let mut reach: i64 = 1;
              while reach < buckets as i64 {
                  reach *= states;
                  pigs += 1;
              }
              pigs
          }
        `,
        php: code`
          function poorPigs($buckets, $minutesToDie, $minutesToTest) {
              $states = intdiv($minutesToTest, $minutesToDie) + 1;
              $pigs = 0;
              $reach = 1;
              while ($reach < $buckets) {
                  $reach *= $states;
                  $pigs++;
              }
              return $pigs;
          }
        `,
        ruby: code`
          def poorPigs(buckets, minutesToDie, minutesToTest)
            states = minutesToTest / minutesToDie + 1
            pigs = 0
            reach = 1
            while reach < buckets
              reach *= states
              pigs += 1
            end
            pigs
          end
        `,
      },
    };
  })(),

  // ── Smallest Range II (LC 910) ──────────────────────────────────
  (() => {
    // Independent O(n^2) check: fix the lowest value m allowed (every value
    // a ± k is a candidate). Each element then takes the smallest of its two
    // options that is >= m; the range is at most max - m, and when m is the
    // optimum's minimum this is exactly the optimum.
    const ref = (nums: number[], k: number) => {
      let best = Infinity;
      for (const base of nums) {
        for (const m of [base - k, base + k]) {
          let hi = -Infinity, ok = true;
          for (const v of nums) {
            const choice = v - k >= m ? v - k : v + k >= m ? v + k : null;
            if (choice === null) { ok = false; break; }
            hi = Math.max(hi, choice);
          }
          if (ok) best = Math.min(best, hi - m);
        }
      }
      return best;
    };
    return {
      slug: "smallest-range-ii",
      title: "Smallest Range II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Sorting", "Google", "Adobe"],
      signature: { funcName: "smallestRangeII", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `k`. For **every** index `i` you must change `nums[i]` to either `nums[i] + k` or `nums[i] - k` (each index chooses independently).\n\nThe **score** of the resulting array is its maximum element minus its minimum element. Return the smallest score you can achieve.",
        [
          { in: "nums = [1], k = 0", out: "0" },
          { in: "nums = [0,10], k = 2", out: "6", note: "Change to [2,8]: the score is 8 - 2 = 6." },
          { in: "nums = [1,3,6], k = 3", out: "3", note: "Change to [4,6,3]: the score is 6 - 3 = 3." },
        ],
        ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^4", "0 <= k <= 10^4"]),
      hints: [
        "Sort the array. Is there an optimal choice where the smaller values all go up and the larger values all go down?",
        "Yes — if some `a < b` had `a` going down and `b` going up, swapping their directions never widens the range. So the answer is a split point: the first `i + 1` sorted values get `+k`, the rest get `-k`.",
        "For a split after index `i`, the maximum is `max(a[n-1] - k, a[i] + k)` and the minimum is `min(a[0] + k, a[i+1] - k)`. Also consider not splitting at all.",
      ],
      editorial: explain({
        idea: "After sorting, some optimal answer adds `k` to a prefix and subtracts `k` from the suffix, so only `n` split points need checking.",
        steps: [
          "Sort `nums` into `a`; the no-split answer (everyone moves the same way) is `a[n-1] - a[0]`.",
          "For each split after index `i` (from 0 to n−2): the candidates for the maximum are `a[i] + k` and `a[n-1] - k`, and for the minimum `a[0] + k` and `a[i+1] - k`.",
          "Track the smallest `max - min` over all splits and return it.",
        ],
        why: "Take an optimal assignment where some smaller value `a` goes down while a larger value `b` goes up. Swapping them (a up, b down) produces values `a + k` and `b - k`, which both lie between `a - k` and `b + k`, so the minimum does not drop and the maximum does not rise. Repeating the swap yields an optimal assignment shaped as 'prefix up, suffix down'. In that shape the largest value is either the last raised element or the last element lowered, and the smallest is either the first raised element or the first lowered one, which is exactly what each split computes.",
        time: "O(n log n)",
        space: "O(n) for the sorted copy (O(1) extra if sorting in place)",
        pitfalls: [
          "Every element must move — leaving one unchanged is not allowed (that is the variant Smallest Range I relaxes).",
          "The all-same-direction case (`a[n-1] - a[0]`) must be the starting answer; with `k = 0` it is the answer.",
          "The minimum after a split is not always `a[0] + k`: the first lowered element `a[i+1] - k` can be smaller.",
        ],
      }),
      examples: [
        { input: "[1]\n0", expectedOutput: "0" },
        { input: "[0,10]\n2", expectedOutput: "6" },
        { input: "[1,3,6]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const size = pick(rng, [1, 2, 3, ri(rng, 2, 8), ri(rng, 5, 25), ri(rng, 20, 40)]);
        const span = pick(rng, [5, 30, 1000, 10000]);
        const lo = ri(rng, 0, 10000 - span);
        const nums = Array.from({ length: size }, () => lo + ri(rng, 0, span));
        const kShape = ri(rng, 0, 4);
        const k = kShape === 0 ? 0 : kShape === 1 ? ri(rng, 0, 10000) : ri(rng, 0, Math.max(1, Math.floor(span / 2)));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def smallestRangeII(nums: List[int], k: int) -> int:
              a = sorted(nums)
              n = len(a)
              best = a[-1] - a[0]
              for i in range(n - 1):
                  high = max(a[-1] - k, a[i] + k)
                  low = min(a[0] + k, a[i + 1] - k)
                  best = min(best, high - low)
              return best
        `,
        javascript: code`
          var smallestRangeII = function(nums, k) {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var n = a.length;
              var best = a[n - 1] - a[0];
              for (var i = 0; i + 1 < n; i++) {
                  var high = Math.max(a[n - 1] - k, a[i] + k);
                  var low = Math.min(a[0] + k, a[i + 1] - k);
                  best = Math.min(best, high - low);
              }
              return best;
          };
        `,
        typescript: code`
          function smallestRangeII(nums: number[], k: number): number {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var n = a.length;
              var best = a[n - 1] - a[0];
              for (var i = 0; i + 1 < n; i++) {
                  var high = Math.max(a[n - 1] - k, a[i] + k);
                  var low = Math.min(a[0] + k, a[i + 1] - k);
                  best = Math.min(best, high - low);
              }
              return best;
          }
        `,
        java: code`
          public static int smallestRangeII(int[] nums, int k) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              int best = a[n - 1] - a[0];
              for (int i = 0; i + 1 < n; i++) {
                  int high = Math.max(a[n - 1] - k, a[i] + k);
                  int low = Math.min(a[0] + k, a[i + 1] - k);
                  best = Math.min(best, high - low);
              }
              return best;
          }
        `,
        cpp: code`
          int smallestRangeII(vector<int>& nums, int k) {
              vector<int> a = nums;
              sort(a.begin(), a.end());
              int n = a.size();
              int best = a[n - 1] - a[0];
              for (int i = 0; i + 1 < n; i++) {
                  int high = max(a[n - 1] - k, a[i] + k);
                  int low = min(a[0] + k, a[i + 1] - k);
                  best = min(best, high - low);
              }
              return best;
          }
        `,
        c: code`
          static int srCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int smallestRangeII(int* nums, int numsSize, int k) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), srCmp);
              int n = numsSize;
              int best = a[n - 1] - a[0];
              for (int i = 0; i + 1 < n; i++) {
                  int high = a[n - 1] - k > a[i] + k ? a[n - 1] - k : a[i] + k;
                  int low = a[0] + k < a[i + 1] - k ? a[0] + k : a[i + 1] - k;
                  if (high - low < best) best = high - low;
              }
              free(a);
              return best;
          }
        `,
        csharp: code`
          public static int SmallestRangeII(int[] nums, int k)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length;
              int best = a[n - 1] - a[0];
              for (int i = 0; i + 1 < n; i++)
              {
                  int high = Math.Max(a[n - 1] - k, a[i] + k);
                  int low = Math.Min(a[0] + k, a[i + 1] - k);
                  best = Math.Min(best, high - low);
              }
              return best;
          }
        `,
        go: code`
          func smallestRangeII(nums []int, k int) int {
          	a := append([]int(nil), nums...)
          	sort.Ints(a)
          	n := len(a)
          	best := a[n-1] - a[0]
          	for i := 0; i+1 < n; i++ {
          		high := a[n-1] - k
          		if a[i]+k > high {
          			high = a[i] + k
          		}
          		low := a[0] + k
          		if a[i+1]-k < low {
          			low = a[i+1] - k
          		}
          		if high-low < best {
          			best = high - low
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun smallestRangeII(nums: IntArray, k: Int): Int {
              val a = nums.sortedArray()
              val n = a.size
              var best = a[n - 1] - a[0]
              for (i in 0 until n - 1) {
                  val high = maxOf(a[n - 1] - k, a[i] + k)
                  val low = minOf(a[0] + k, a[i + 1] - k)
                  best = minOf(best, high - low)
              }
              return best
          }
        `,
        swift: code`
          func smallestRangeII(_ nums: [Int], _ k: Int) -> Int {
              let a = nums.sorted()
              let n = a.count
              var best = a[n - 1] - a[0]
              var i = 0
              while i + 1 < n {
                  let high = max(a[n - 1] - k, a[i] + k)
                  let low = min(a[0] + k, a[i + 1] - k)
                  best = min(best, high - low)
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn smallestRangeII(nums: Vec<i32>, k: i32) -> i32 {
              let mut a = nums;
              a.sort();
              let n = a.len();
              let mut best = a[n - 1] - a[0];
              for i in 0..n - 1 {
                  let high = std::cmp::max(a[n - 1] - k, a[i] + k);
                  let low = std::cmp::min(a[0] + k, a[i + 1] - k);
                  best = std::cmp::min(best, high - low);
              }
              best
          }
        `,
        php: code`
          function smallestRangeII($nums, $k) {
              $a = $nums;
              sort($a);
              $n = count($a);
              $best = $a[$n - 1] - $a[0];
              for ($i = 0; $i + 1 < $n; $i++) {
                  $high = max($a[$n - 1] - $k, $a[$i] + $k);
                  $low = min($a[0] + $k, $a[$i + 1] - $k);
                  $best = min($best, $high - $low);
              }
              return $best;
          }
        `,
        ruby: code`
          def smallestRangeII(nums, k)
            a = nums.sort
            n = a.length
            best = a[-1] - a[0]
            (0...n - 1).each do |i|
              high = [a[-1] - k, a[i] + k].max
              low = [a[0] + k, a[i + 1] - k].min
              best = high - low if high - low < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Reaching Points (LC 780) ────────────────────────────────────
  (() => {
    // Brute force: walk backwards one subtraction at a time — the predecessor
    // of (x, y) with x != y is unique. Gives up (null) past a step budget, and
    // the generator then draws another case.
    const ref = (sx: number, sy: number, tx: number, ty: number): boolean | null => {
      let x = tx, y = ty;
      for (let steps = 0; steps < 3000000; steps++) {
        if (x === sx && y === sy) return true;
        if (x < sx || y < sy || x === y) return false;
        if (x > y) x -= y; else y -= x;
      }
      return null;
    };
    const LIMIT = 1000000000;
    return {
      slug: "reaching-points",
      title: "Reaching Points",
      difficulty: "HARD" as const,
      tags: ["Math", "Number Theory", "Google", "Amazon", "Goldman Sachs"],
      signature: {
        funcName: "reachingPoints",
        params: [{ name: "sx", type: "int" as const }, { name: "sy", type: "int" as const }, { name: "tx", type: "int" as const }, { name: "ty", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "From a point `(x, y)` one move takes you to either `(x, x + y)` or `(x + y, y)`.\n\nGiven a start `(sx, sy)` and a target `(tx, ty)`, return `true` if some sequence of zero or more moves turns the start into the target, and `false` otherwise.",
        [
          { in: "sx = 1, sy = 1, tx = 3, ty = 5", out: "true", note: "(1, 1) → (1, 2) → (3, 2) → (3, 5)." },
          { in: "sx = 1, sy = 1, tx = 2, ty = 2", out: "false" },
          { in: "sx = 1, sy = 1, tx = 1, ty = 1", out: "true", note: "Zero moves are allowed." },
        ],
        ["1 <= sx, sy, tx, ty <= 10^9"]),
      hints: [
        "Searching forwards branches two ways at every step. Look at the target instead: how many points can move to `(tx, ty)`?",
        "Both coordinates stay positive, so if `tx > ty` the last move must have added `ty` to the first coordinate — the predecessor is unique.",
        "Repeated subtraction of `ty` from `tx` is a modulo. Be careful when one coordinate already equals its start value: then check divisibility instead of reducing past it.",
      ],
      editorial: explain({
        idea: "Run the moves backwards: the larger coordinate must have been produced by adding the smaller one, so the path back is unique and can be compressed with modulo, like the Euclidean algorithm.",
        steps: [
          "While `tx > sx` and `ty > sy`: if `tx > ty` set `tx %= ty`, otherwise set `ty %= tx`.",
          "If now `tx == sx`, the remaining moves can only have added `sx` to the second coordinate: return whether `ty >= sy` and `(ty - sy) % sx == 0`.",
          "If `ty == sy`, symmetrically return whether `tx >= sx` and `(tx - sx) % sy == 0`.",
          "Otherwise one coordinate dropped below its start: return `false`.",
        ],
        why: "Moves keep both coordinates positive and strictly increase one of them, so a point `(x, y)` with `x > y` can only come from `(x - y, y)` and one with `x < y` only from `(x, y - x)`; a point with `x == y` has no predecessor. Hence the backward walk is forced. While both coordinates are still above their starts, the walk must keep subtracting, and a run of subtractions of `ty` from `tx` stops exactly when `tx < ty`, i.e. at `tx % ty` — so the modulo skips the run without missing the start (the start cannot appear mid-run, because there `ty > sy`). Once a coordinate equals its start it must stay fixed, so the other one has to come down to its start in steps of exactly that value.",
        time: "O(log max(tx, ty))",
        space: "O(1)",
        pitfalls: [
          "Subtracting one step at a time is correct but takes 10^9 steps for (1, 1) → (10^9, 1).",
          "Reducing `tx %= ty` when `ty == sy` can jump past `sx`; switch to the divisibility check as soon as a coordinate matches.",
          "A point with equal coordinates other than the start is unreachable, and `x % x` becomes 0 — make sure the loop then reports `false`.",
        ],
      }),
      examples: [
        { input: "1\n1\n3\n5", expectedOutput: "true" },
        { input: "1\n1\n2\n2", expectedOutput: "false" },
        { input: "1\n1\n1\n1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const shape = ri(rng, 0, 9);
          const startCap = pick(rng, [3, 20, 1000, 1000000]);
          const sx = ri(rng, 1, startCap), sy = ri(rng, 1, startCap);
          let tx = sx, ty = sy;
          if (shape < 7) {
            const moves = ri(rng, 0, 40);
            for (let m = 0; m < moves; m++) {
              const reps = ri(rng, 0, 5) === 0 ? ri(rng, 1, 200000) : 1;
              if (rng() < 0.5) {
                const can = Math.floor((LIMIT - tx) / ty);
                tx += ty * Math.min(reps, can);
              } else {
                const can = Math.floor((LIMIT - ty) / tx);
                ty += tx * Math.min(reps, can);
              }
            }
            if (shape >= 4) {
              // Near misses: nudge the reachable target, or swap it.
              const kind = ri(rng, 0, 2);
              if (kind === 0) tx = Math.min(LIMIT, Math.max(1, tx + ri(rng, -2, 2)));
              else if (kind === 1) ty = Math.min(LIMIT, Math.max(1, ty + ri(rng, -2, 2)));
              else { const t = tx; tx = ty; ty = t; }
            }
          } else if (shape === 7) {
            tx = ri(rng, 1, 60); ty = ri(rng, 1, 60);
          } else if (shape === 8) {
            tx = ri(rng, 1, LIMIT); ty = ri(rng, 1, LIMIT);
          } else {
            tx = sx + ri(rng, 0, 3) * sy; ty = sy;
          }
          const ans = ref(sx, sy, tx, ty);
          if (ans === null) continue;
          return { input: `${sx}\n${sy}\n${tx}\n${ty}`, expectedOutput: bool(ans) };
        }
      },
      solutions: {
        python: code`
          def reachingPoints(sx: int, sy: int, tx: int, ty: int) -> bool:
              while tx > sx and ty > sy:
                  if tx > ty:
                      tx %= ty
                  else:
                      ty %= tx
              if tx == sx:
                  return ty >= sy and (ty - sy) % sx == 0
              if ty == sy:
                  return tx >= sx and (tx - sx) % sy == 0
              return False
        `,
        javascript: code`
          var reachingPoints = function(sx, sy, tx, ty) {
              while (tx > sx && ty > sy) {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx === sx) return ty >= sy && (ty - sy) % sx === 0;
              if (ty === sy) return tx >= sx && (tx - sx) % sy === 0;
              return false;
          };
        `,
        typescript: code`
          function reachingPoints(sx: number, sy: number, tx: number, ty: number): boolean {
              while (tx > sx && ty > sy) {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx === sx) return ty >= sy && (ty - sy) % sx === 0;
              if (ty === sy) return tx >= sx && (tx - sx) % sy === 0;
              return false;
          }
        `,
        java: code`
          public static boolean reachingPoints(int sx, int sy, int tx, int ty) {
              while (tx > sx && ty > sy) {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx == sx) return ty >= sy && (ty - sy) % sx == 0;
              if (ty == sy) return tx >= sx && (tx - sx) % sy == 0;
              return false;
          }
        `,
        cpp: code`
          bool reachingPoints(int sx, int sy, int tx, int ty) {
              while (tx > sx && ty > sy) {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx == sx) return ty >= sy && (ty - sy) % sx == 0;
              if (ty == sy) return tx >= sx && (tx - sx) % sy == 0;
              return false;
          }
        `,
        c: code`
          bool reachingPoints(int sx, int sy, int tx, int ty) {
              while (tx > sx && ty > sy) {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx == sx) return ty >= sy && (ty - sy) % sx == 0;
              if (ty == sy) return tx >= sx && (tx - sx) % sy == 0;
              return false;
          }
        `,
        csharp: code`
          public static bool ReachingPoints(int sx, int sy, int tx, int ty)
          {
              while (tx > sx && ty > sy)
              {
                  if (tx > ty) tx %= ty;
                  else ty %= tx;
              }
              if (tx == sx) return ty >= sy && (ty - sy) % sx == 0;
              if (ty == sy) return tx >= sx && (tx - sx) % sy == 0;
              return false;
          }
        `,
        go: code`
          func reachingPoints(sx int, sy int, tx int, ty int) bool {
          	for tx > sx && ty > sy {
          		if tx > ty {
          			tx %= ty
          		} else {
          			ty %= tx
          		}
          	}
          	if tx == sx {
          		return ty >= sy && (ty-sy)%sx == 0
          	}
          	if ty == sy {
          		return tx >= sx && (tx-sx)%sy == 0
          	}
          	return false
          }
        `,
        kotlin: code`
          fun reachingPoints(sx: Int, sy: Int, tx: Int, ty: Int): Boolean {
              var x = tx
              var y = ty
              while (x > sx && y > sy) {
                  if (x > y) x %= y else y %= x
              }
              if (x == sx) return y >= sy && (y - sy) % sx == 0
              if (y == sy) return x >= sx && (x - sx) % sy == 0
              return false
          }
        `,
        swift: code`
          func reachingPoints(_ sx: Int, _ sy: Int, _ tx: Int, _ ty: Int) -> Bool {
              var x = tx
              var y = ty
              while x > sx && y > sy {
                  if x > y { x %= y } else { y %= x }
              }
              if x == sx { return y >= sy && (y - sy) % sx == 0 }
              if y == sy { return x >= sx && (x - sx) % sy == 0 }
              return false
          }
        `,
        rust: code`
          fn reachingPoints(sx: i32, sy: i32, tx: i32, ty: i32) -> bool {
              let mut x = tx;
              let mut y = ty;
              while x > sx && y > sy {
                  if x > y {
                      x %= y;
                  } else {
                      y %= x;
                  }
              }
              if x == sx {
                  return y >= sy && (y - sy) % sx == 0;
              }
              if y == sy {
                  return x >= sx && (x - sx) % sy == 0;
              }
              false
          }
        `,
        php: code`
          function reachingPoints($sx, $sy, $tx, $ty) {
              while ($tx > $sx && $ty > $sy) {
                  if ($tx > $ty) $tx %= $ty;
                  else $ty %= $tx;
              }
              if ($tx == $sx) return $ty >= $sy && ($ty - $sy) % $sx == 0;
              if ($ty == $sy) return $tx >= $sx && ($tx - $sx) % $sy == 0;
              return false;
          }
        `,
        ruby: code`
          def reachingPoints(sx, sy, tx, ty)
            while tx > sx && ty > sy
              if tx > ty
                tx %= ty
              else
                ty %= tx
              end
            end
            return ty >= sy && (ty - sy) % sx == 0 if tx == sx
            return tx >= sx && (tx - sx) % sy == 0 if ty == sy
            false
          end
        `,
      },
    };
  })(),

  // ── Consecutive Numbers Sum (LC 829) ────────────────────────────
  (() => {
    // Brute force for small n: try every first term and add consecutive
    // numbers until the sum reaches or passes n.
    const brute = (n: number) => {
      let count = 0;
      for (let a = 1; a <= n; a++) {
        let s = 0;
        for (let b = a; s < n; b++) s += b;
        if (s === n) count++;
      }
      return count;
    };
    // Independent check for large n: a run of k terms starting at a has sum
    // k*a + k(k-1)/2, so count the k for which a comes out a positive integer.
    const byLength = (n: number) => {
      let count = 0;
      for (let k = 1; k * (k + 1) / 2 <= n; k++) if ((n - k * (k - 1) / 2) % k === 0) count++;
      return count;
    };
    const ref = (n: number) => {
      const r = byLength(n);
      if (n <= 300 && brute(n) !== r) throw new Error(`consecutive-numbers-sum: mismatch at ${n}`);
      return r;
    };
    const isPrime = (x: number) => {
      if (x < 2) return false;
      for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
      return true;
    };
    return {
      slug: "consecutive-numbers-sum",
      title: "Consecutive Numbers Sum",
      difficulty: "HARD" as const,
      tags: ["Math", "Enumeration", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "consecutiveNumbersSum", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, return the number of ways to write `n` as the sum of one or more **consecutive positive** integers.\n\nA single number counts as a run of length one, so the answer is always at least 1.",
        [
          { in: "n = 5", out: "2", note: "5 = 5 = 2 + 3." },
          { in: "n = 9", out: "3", note: "9 = 9 = 4 + 5 = 2 + 3 + 4." },
          { in: "n = 15", out: "4", note: "15 = 15 = 7 + 8 = 4 + 5 + 6 = 1 + 2 + 3 + 4 + 5." },
        ],
        ["1 <= n <= 10^9"]),
      hints: [
        "A run of `k` numbers starting at `a` sums to `k*a + k(k-1)/2`. For a fixed length `k`, is there at most one valid start?",
        "So you could count the lengths `k` (up to about `sqrt(2n)`) for which `n - k(k-1)/2` is a positive multiple of `k`.",
        "Even faster: `2n = k * (2a + k - 1)`, and the two factors have opposite parity. Each odd divisor of `n` gives exactly one such split — count the odd divisors.",
      ],
      editorial: explain({
        idea: "The number of ways equals the number of **odd divisors** of `n`, which a trial-division factorisation counts in O(√n).",
        steps: [
          "Divide out every factor 2 from `n` — powers of two do not change the count.",
          "Factor the remaining odd number by trial division over odd `d` while `d*d <= n`, recording each exponent `e`.",
          "The number of odd divisors is the product of `e + 1` over the odd prime factors; a leftover factor above 1 is a prime with exponent 1 (multiply by 2).",
          "Return that product.",
        ],
        why: "A run of `k` terms starting at `a >= 1` satisfies `2n = k(2a + k - 1)`. The factors `k` and `2a + k - 1` have opposite parity (their difference `2a - 1` is odd) and the second is the larger. Conversely every factorisation `2n = u*v` with `u < v` of opposite parity gives a run with `k = u` and `a = (v - u + 1)/2 >= 1`. In such a pair exactly one factor is odd, and it is an odd divisor `d` of `n` (all the 2s sit in the other factor); each odd divisor determines its pair. So runs and odd divisors are in one-to-one correspondence.",
        time: "O(√n)",
        space: "O(1)",
        pitfalls: [
          "Counting all divisors instead of odd ones: 4 has three divisors but only one way (4 itself).",
          "If you loop over lengths `k`, compute `k*(k+1)/2` in 64-bit or compare carefully — near 10^9 it is close to the int32 limit.",
          "Trying every start `a` is O(n) per start and far too slow for 10^9.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "2" },
        { input: "9", expectedOutput: "3" },
        { input: "15", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 99);
        let n: number;
        if (shape < 25) n = ri(rng, 1, 300);
        else if (shape < 50) n = ri(rng, 301, 100000);
        else if (shape < 75) n = ri(rng, 100001, 1000000000);
        else if (shape < 80) {
          n = ri(rng, 900000000, 999999999) | 1;
          while (!isPrime(n)) n -= 2;
        } else if (shape < 88) n = Math.pow(2, ri(rng, 0, 20)) * pick(rng, [1, 3, 5, 9, 15, 45, 105, 225, 945]);
        else if (shape < 96) {
          n = 1;
          const ps = [3, 5, 7, 11, 13];
          for (let i = 0; i < 8; i++) { const p = pick(rng, ps); if (n * p <= 1000000000) n *= p; }
        } else n = pick(rng, [1, 2, 1000000000, 999999999, 536870912, 945945945]);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def consecutiveNumbersSum(n: int) -> int:
              while n % 2 == 0:
                  n //= 2
              count = 1
              d = 3
              while d * d <= n:
                  e = 0
                  while n % d == 0:
                      n //= d
                      e += 1
                  count *= e + 1
                  d += 2
              if n > 1:
                  count *= 2
              return count
        `,
        javascript: code`
          var consecutiveNumbersSum = function(n) {
              while (n % 2 === 0) n /= 2;
              var count = 1;
              for (var d = 3; d * d <= n; d += 2) {
                  var e = 0;
                  while (n % d === 0) {
                      n /= d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          };
        `,
        typescript: code`
          function consecutiveNumbersSum(n: number): number {
              while (n % 2 === 0) n /= 2;
              var count = 1;
              for (var d = 3; d * d <= n; d += 2) {
                  var e = 0;
                  while (n % d === 0) {
                      n /= d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          }
        `,
        java: code`
          public static int consecutiveNumbersSum(int n) {
              while (n % 2 == 0) n /= 2;
              int count = 1;
              for (long d = 3; d * d <= n; d += 2) {
                  int e = 0;
                  while (n % d == 0) {
                      n /= d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          }
        `,
        cpp: code`
          int consecutiveNumbersSum(int n) {
              while (n % 2 == 0) n /= 2;
              int count = 1;
              for (long long d = 3; d * d <= n; d += 2) {
                  int e = 0;
                  while (n % d == 0) {
                      n /= d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          }
        `,
        c: code`
          int consecutiveNumbersSum(int n) {
              while (n % 2 == 0) n /= 2;
              int count = 1;
              for (long long d = 3; d * d <= n; d += 2) {
                  int e = 0;
                  while (n % d == 0) {
                      n /= d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          }
        `,
        csharp: code`
          public static int ConsecutiveNumbersSum(int n)
          {
              while (n % 2 == 0) n /= 2;
              int count = 1;
              for (long d = 3; d * d <= n; d += 2)
              {
                  int e = 0;
                  while (n % d == 0)
                  {
                      n /= (int)d;
                      e++;
                  }
                  count *= e + 1;
              }
              if (n > 1) count *= 2;
              return count;
          }
        `,
        go: code`
          func consecutiveNumbersSum(n int) int {
          	for n%2 == 0 {
          		n /= 2
          	}
          	count := 1
          	for d := 3; d*d <= n; d += 2 {
          		e := 0
          		for n%d == 0 {
          			n /= d
          			e++
          		}
          		count *= e + 1
          	}
          	if n > 1 {
          		count *= 2
          	}
          	return count
          }
        `,
        kotlin: code`
          fun consecutiveNumbersSum(n: Int): Int {
              var m = n
              while (m % 2 == 0) m /= 2
              var count = 1
              var d = 3L
              while (d * d <= m) {
                  var e = 0
                  while (m % d == 0L) {
                      m = (m / d).toInt()
                      e++
                  }
                  count *= e + 1
                  d += 2
              }
              if (m > 1) count *= 2
              return count
          }
        `,
        swift: code`
          func consecutiveNumbersSum(_ n: Int) -> Int {
              var m = n
              while m % 2 == 0 { m /= 2 }
              var count = 1
              var d = 3
              while d * d <= m {
                  var e = 0
                  while m % d == 0 {
                      m /= d
                      e += 1
                  }
                  count *= e + 1
                  d += 2
              }
              if m > 1 { count *= 2 }
              return count
          }
        `,
        rust: code`
          fn consecutiveNumbersSum(n: i32) -> i32 {
              let mut m = n as i64;
              while m % 2 == 0 {
                  m /= 2;
              }
              let mut count = 1;
              let mut d: i64 = 3;
              while d * d <= m {
                  let mut e = 0;
                  while m % d == 0 {
                      m /= d;
                      e += 1;
                  }
                  count *= e + 1;
                  d += 2;
              }
              if m > 1 {
                  count *= 2;
              }
              count
          }
        `,
        php: code`
          function consecutiveNumbersSum($n) {
              while ($n % 2 == 0) $n = intdiv($n, 2);
              $count = 1;
              for ($d = 3; $d * $d <= $n; $d += 2) {
                  $e = 0;
                  while ($n % $d == 0) {
                      $n = intdiv($n, $d);
                      $e++;
                  }
                  $count *= $e + 1;
              }
              if ($n > 1) $count *= 2;
              return $count;
          }
        `,
        ruby: code`
          def consecutiveNumbersSum(n)
            n /= 2 while n.even?
            count = 1
            d = 3
            while d * d <= n
              e = 0
              while n % d == 0
                n /= d
                e += 1
              end
              count *= e + 1
              d += 2
            end
            count *= 2 if n > 1
            count
          end
        `,
      },
    };
  })(),

  // ── Mirror Reflection (LC 858) ──────────────────────────────────
  (() => {
    // Simulation: unfold the room. After the k-th wall crossing the ray has
    // risen k*q; folding that back into [0, p] gives the real height, and odd
    // k is the east wall, even k the west wall. Stop at the first corner.
    const ref = (p: number, q: number) => {
      for (let k = 1; ; k++) {
        const r = (k * q) % (2 * p);
        const y = r <= p ? r : 2 * p - r;
        const east = k % 2 === 1;
        if (y === 0 && east) return 0;
        if (y === p && east) return 1;
        if (y === p && !east) return 2;
        if (y === 0 && !east) throw new Error("mirror-reflection: returned to the source corner");
      }
    };
    return {
      slug: "mirror-reflection",
      title: "Mirror Reflection",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Geometry", "Number Theory", "Amazon", "Meta"],
      signature: { funcName: "mirrorReflection", params: [{ name: "p", type: "int" as const }, { name: "q", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A square room has mirrors on all four walls and side length `p`. Three corners hold receptors: **0** at the south-east corner, **1** at the north-east corner and **2** at the north-west corner. The south-west corner has none.\n\nA laser is fired from the south-west corner and first strikes the east wall at height `q` above receptor 0. It keeps reflecting off the walls until it hits a receptor.\n\nReturn the number of the receptor the ray reaches first. (It always reaches one.)",
        [
          { in: "p = 2, q = 1", out: "2", note: "The ray hits the east wall halfway up, bounces, and reaches the north-west corner." },
          { in: "p = 3, q = 1", out: "1" },
          { in: "p = 3, q = 2", out: "0" },
        ],
        ["1 <= q <= p <= 1000"]),
      hints: [
        "Instead of reflecting the ray, reflect the room: stack mirrored copies of the square upwards, and the ray becomes a straight line rising `q` per room width.",
        "The ray hits a corner when the height it has risen, `k*q`, is a multiple of `p`. Take the smallest such `k`: then `k*q = m*p` with `m = k*q / p`.",
        "The parity of `k` says east or west wall, and the parity of `m` says top or bottom. Dividing `p` and `q` by 2 while both are even gives the same parities directly.",
      ],
      editorial: explain({
        idea: "Unfold the reflections: the ray travels in a straight line through mirrored copies of the room, and it meets a corner after the least `k` wall-widths with `k*q` a multiple of `p`. Only the parities of `k` and `m = k*q/p` matter.",
        steps: [
          "While `p` and `q` are both even, halve both (this does not change where the ray goes).",
          "If `p` is now even (so `q` is odd), return 2.",
          "If `q` is even (so `p` is odd), return 0.",
          "Otherwise both are odd: return 1.",
        ],
        why: "With `g = gcd(p, q)`, the least `k` with `p | k*q` is `k = p/g`, and then `m = q/g`. Crossing an odd number of widths ends on the east wall and an even number on the west wall; rising an odd number of heights ends at the top and an even number at the bottom (in the unfolded picture each height flips the room). East-bottom is receptor 0, east-top 1, west-top 2; west-bottom is impossible because `p/g` and `q/g` cannot both be even. Halving `p` and `q` together until one is odd leaves `p/g` and `q/g` with the same parities, which is what the steps test.",
        time: "O(log p)",
        space: "O(1)",
        pitfalls: [
          "Simulating the bounces with floating-point geometry drifts; integers are enough.",
          "Forgetting to reduce by the common factor: p = 4, q = 2 behaves exactly like p = 2, q = 1.",
          "Receptor numbering is easy to swap: 0 is south-east, 1 north-east, 2 north-west.",
        ],
      }),
      examples: [
        { input: "2\n1", expectedOutput: "2" },
        { input: "3\n1", expectedOutput: "1" },
        { input: "3\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 4);
        let p: number, q: number;
        if (shape === 0) { p = ri(rng, 1, 12); q = ri(rng, 1, p); }
        else if (shape === 1) { const g = Math.pow(2, ri(rng, 1, 8)); p = g * ri(rng, 1, Math.floor(1000 / g)); q = g * ri(rng, 1, p / g); }
        else if (shape === 2) { p = ri(rng, 1, 1000); q = p; }
        else { p = ri(rng, 1, 1000); q = ri(rng, 1, p); }
        return { input: `${p}\n${q}`, expectedOutput: String(ref(p, q)) };
      },
      solutions: {
        python: code`
          def mirrorReflection(p: int, q: int) -> int:
              while p % 2 == 0 and q % 2 == 0:
                  p //= 2
                  q //= 2
              if p % 2 == 0:
                  return 2
              if q % 2 == 0:
                  return 0
              return 1
        `,
        javascript: code`
          var mirrorReflection = function(p, q) {
              while (p % 2 === 0 && q % 2 === 0) {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 === 0) return 2;
              if (q % 2 === 0) return 0;
              return 1;
          };
        `,
        typescript: code`
          function mirrorReflection(p: number, q: number): number {
              while (p % 2 === 0 && q % 2 === 0) {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 === 0) return 2;
              if (q % 2 === 0) return 0;
              return 1;
          }
        `,
        java: code`
          public static int mirrorReflection(int p, int q) {
              while (p % 2 == 0 && q % 2 == 0) {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 == 0) return 2;
              if (q % 2 == 0) return 0;
              return 1;
          }
        `,
        cpp: code`
          int mirrorReflection(int p, int q) {
              while (p % 2 == 0 && q % 2 == 0) {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 == 0) return 2;
              if (q % 2 == 0) return 0;
              return 1;
          }
        `,
        c: code`
          int mirrorReflection(int p, int q) {
              while (p % 2 == 0 && q % 2 == 0) {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 == 0) return 2;
              if (q % 2 == 0) return 0;
              return 1;
          }
        `,
        csharp: code`
          public static int MirrorReflection(int p, int q)
          {
              while (p % 2 == 0 && q % 2 == 0)
              {
                  p /= 2;
                  q /= 2;
              }
              if (p % 2 == 0) return 2;
              if (q % 2 == 0) return 0;
              return 1;
          }
        `,
        go: code`
          func mirrorReflection(p int, q int) int {
          	for p%2 == 0 && q%2 == 0 {
          		p /= 2
          		q /= 2
          	}
          	if p%2 == 0 {
          		return 2
          	}
          	if q%2 == 0 {
          		return 0
          	}
          	return 1
          }
        `,
        kotlin: code`
          fun mirrorReflection(p: Int, q: Int): Int {
              var a = p
              var b = q
              while (a % 2 == 0 && b % 2 == 0) {
                  a /= 2
                  b /= 2
              }
              if (a % 2 == 0) return 2
              if (b % 2 == 0) return 0
              return 1
          }
        `,
        swift: code`
          func mirrorReflection(_ p: Int, _ q: Int) -> Int {
              var a = p
              var b = q
              while a % 2 == 0 && b % 2 == 0 {
                  a /= 2
                  b /= 2
              }
              if a % 2 == 0 { return 2 }
              if b % 2 == 0 { return 0 }
              return 1
          }
        `,
        rust: code`
          fn mirrorReflection(p: i32, q: i32) -> i32 {
              let mut a = p;
              let mut b = q;
              while a % 2 == 0 && b % 2 == 0 {
                  a /= 2;
                  b /= 2;
              }
              if a % 2 == 0 {
                  return 2;
              }
              if b % 2 == 0 {
                  return 0;
              }
              1
          }
        `,
        php: code`
          function mirrorReflection($p, $q) {
              while ($p % 2 == 0 && $q % 2 == 0) {
                  $p = intdiv($p, 2);
                  $q = intdiv($q, 2);
              }
              if ($p % 2 == 0) return 2;
              if ($q % 2 == 0) return 0;
              return 1;
          }
        `,
        ruby: code`
          def mirrorReflection(p, q)
            while p.even? && q.even?
              p /= 2
              q /= 2
            end
            return 2 if p.even?
            return 0 if q.even?
            1
          end
        `,
      },
    };
  })(),

  // ── Prime Palindrome (LC 866) ───────────────────────────────────
  (() => {
    // Reference: every palindrome of every length (odd AND even) up to 2*10^8,
    // primality by trial division, sorted once — then the first one >= n.
    let table: number[] | null = null;
    const isPrime = (x: number) => {
      if (x < 2) return false;
      for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
      return true;
    };
    const ref = (n: number) => {
      if (!table) {
        const all: number[] = [];
        for (let half = 1; half <= 5; half++) {
          for (let root = Math.pow(10, half - 1); root < Math.pow(10, half); root++) {
            const s = String(root);
            const rev = s.split("").reverse().join("");
            const odd = Number(s + rev.slice(1)), even = Number(s + rev);
            if (odd <= 200000000 && isPrime(odd)) all.push(odd);
            if (even <= 200000000 && isPrime(even)) all.push(even);
          }
        }
        table = all.sort((a, b) => a - b);
      }
      for (const v of table) if (v >= n) return v;
      throw new Error("prime-palindrome: no answer");
    };
    return {
      slug: "prime-palindrome",
      title: "Prime Palindrome",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "Amazon", "Microsoft"],
      signature: { funcName: "primePalindrome", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the smallest integer that is at least `n` and is both **prime** and a **palindrome**.\n\nA prime has exactly two divisors, 1 and itself (so 1 is not prime). A palindrome reads the same forwards and backwards in base 10, like `101` or `7`.\n\nThe answer is guaranteed to exist and to be at most `2 * 10^8`.",
        [
          { in: "n = 6", out: "7" },
          { in: "n = 8", out: "11" },
          { in: "n = 13", out: "101", note: "There is no prime palindrome between 13 and 100." },
        ],
        ["1 <= n <= 10^8"]),
      hints: [
        "Walking upwards from `n` and testing every number is far too slow near 10^7: there is no 8-digit prime palindrome at all.",
        "Every palindrome with an even number of digits is divisible by 11. So apart from 11 itself, only odd-length palindromes matter.",
        "Generate odd-length palindromes in increasing order from their first half (the 'root'): root 123 gives 12321, and increasing roots give increasing palindromes. Start from the right root length and test primality only for palindromes ≥ n.",
      ],
      editorial: explain({
        idea: "Generate only odd-length palindromes, in increasing order, from their left halves; even-length palindromes are multiples of 11, so 11 is the only even-length answer.",
        steps: [
          "If `8 <= n <= 11`, return 11.",
          "Let `d` be the number of digits of `n` and `half = d/2 + 1` (integer division): the root length of the shortest odd-length palindromes that can reach `n`.",
          "If `d` is odd, start the root at the first `half` digits of `n`; otherwise at `10^(half-1)`.",
          "For each root in increasing order, mirror it (the root followed by its reverse without the last digit). If the palindrome is ≥ `n` and passes trial-division primality, return it.",
        ],
        why: "Alternating-digit sums show a palindrome with an even number of digits is divisible by 11, so none except 11 is prime. Mirroring is monotone — a larger root of the same length gives a larger palindrome, and the smallest palindrome of the next length beats the largest of this one — so scanning roots upward visits odd-length palindromes in increasing order and the first prime one that is ≥ `n` is the answer. Starting at the first half of `n` skips only roots whose palindromes are smaller than `n`. Single-digit inputs are covered by the one-digit roots, which are the palindromes 1 … 9.",
        time: "O(R · √A): R roots tried (a few thousand at most) and √A per primality test of an answer-sized number",
        space: "O(1)",
        pitfalls: [
          "Searching upwards from 9,989,900 one number at a time runs about 90 million steps before reaching 100,030,001.",
          "Skipping even lengths drops 11 — handle `n` from 8 to 11 explicitly.",
          "1 is a palindrome but not a prime; `n = 1` must return 2.",
        ],
      }),
      examples: [
        { input: "6", expectedOutput: "7" },
        { input: "8", expectedOutput: "11" },
        { input: "13", expectedOutput: "101" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let n: number;
        if (shape < 3) n = ri(rng, 1, 1000);
        else if (shape < 5) n = ri(rng, 1001, 100000);
        else if (shape < 7) n = ri(rng, 100001, 10000000);
        else if (shape < 9) n = ri(rng, 10000001, 100000000);
        else n = pick(rng, [1, 2, 3, 7, 8, 9, 10, 11, 12, 100, 101, 102, 131, 9989899, 9989900, 99999999, 100000000, 100030001 - 1]);
        n = Math.min(n, 100000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def primePalindrome(n: int) -> int:
              def is_prime(x: int) -> bool:
                  if x < 2:
                      return False
                  if x % 2 == 0:
                      return x == 2
                  d = 3
                  while d * d <= x:
                      if x % d == 0:
                          return False
                      d += 2
                  return True

              if 8 <= n <= 11:
                  return 11
              digits = len(str(n))
              half = digits // 2 + 1
              root = 10 ** (half - 1)
              if digits % 2 == 1:
                  root = n // 10 ** (half - 1)
              while True:
                  s = str(root)
                  pal = int(s + s[-2::-1])
                  if pal >= n and is_prime(pal):
                      return pal
                  root += 1
        `,
        javascript: code`
          var primePalindrome = function(n) {
              var isPrime = function(x) {
                  if (x < 2) return false;
                  if (x % 2 === 0) return x === 2;
                  for (var d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
                  return true;
              };
              if (n >= 8 && n <= 11) return 11;
              var digits = String(n).length;
              var half = Math.floor(digits / 2) + 1;
              var root = Math.pow(10, half - 1);
              if (digits % 2 === 1) root = Math.floor(n / Math.pow(10, half - 1));
              for (;; root++) {
                  var pal = root, t = Math.floor(root / 10);
                  while (t > 0) {
                      pal = pal * 10 + t % 10;
                      t = Math.floor(t / 10);
                  }
                  if (pal >= n && isPrime(pal)) return pal;
              }
          };
        `,
        typescript: code`
          function primePalindrome(n: number): number {
              var isPrime = function(x: number): boolean {
                  if (x < 2) return false;
                  if (x % 2 === 0) return x === 2;
                  for (var d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
                  return true;
              };
              if (n >= 8 && n <= 11) return 11;
              var digits = String(n).length;
              var half = Math.floor(digits / 2) + 1;
              var root = Math.pow(10, half - 1);
              if (digits % 2 === 1) root = Math.floor(n / Math.pow(10, half - 1));
              while (true) {
                  var pal = root, t = Math.floor(root / 10);
                  while (t > 0) {
                      pal = pal * 10 + t % 10;
                      t = Math.floor(t / 10);
                  }
                  if (pal >= n && isPrime(pal)) return pal;
                  root++;
              }
          }
        `,
        java: code`
          static boolean ppIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          public static int primePalindrome(int n) {
              if (n >= 8 && n <= 11) return 11;
              int digits = String.valueOf(n).length();
              int half = digits / 2 + 1;
              int scale = 1;
              for (int i = 1; i < half; i++) scale *= 10;
              int root = digits % 2 == 1 ? n / scale : scale;
              while (true) {
                  int pal = root, t = root / 10;
                  while (t > 0) {
                      pal = pal * 10 + t % 10;
                      t /= 10;
                  }
                  if (pal >= n && ppIsPrime(pal)) return pal;
                  root++;
              }
          }
        `,
        cpp: code`
          static bool ppIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          int primePalindrome(int n) {
              if (n >= 8 && n <= 11) return 11;
              int digits = to_string(n).size();
              int half = digits / 2 + 1;
              int scale = 1;
              for (int i = 1; i < half; i++) scale *= 10;
              int root = digits % 2 == 1 ? n / scale : scale;
              while (true) {
                  int pal = root, t = root / 10;
                  while (t > 0) {
                      pal = pal * 10 + t % 10;
                      t /= 10;
                  }
                  if (pal >= n && ppIsPrime(pal)) return pal;
                  root++;
              }
          }
        `,
        c: code`
          static bool ppIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          int primePalindrome(int n) {
              if (n >= 8 && n <= 11) return 11;
              int digits = 0;
              for (int t = n; t > 0; t /= 10) digits++;
              int half = digits / 2 + 1;
              int scale = 1;
              for (int i = 1; i < half; i++) scale *= 10;
              int root = digits % 2 == 1 ? n / scale : scale;
              while (1) {
                  int pal = root, t = root / 10;
                  while (t > 0) {
                      pal = pal * 10 + t % 10;
                      t /= 10;
                  }
                  if (pal >= n && ppIsPrime(pal)) return pal;
                  root++;
              }
          }
        `,
        csharp: code`
          static bool PpIsPrime(int x)
          {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          public static int PrimePalindrome(int n)
          {
              if (n >= 8 && n <= 11) return 11;
              int digits = n.ToString().Length;
              int half = digits / 2 + 1;
              int scale = 1;
              for (int i = 1; i < half; i++) scale *= 10;
              int root = digits % 2 == 1 ? n / scale : scale;
              while (true)
              {
                  int pal = root, t = root / 10;
                  while (t > 0)
                  {
                      pal = pal * 10 + t % 10;
                      t /= 10;
                  }
                  if (pal >= n && PpIsPrime(pal)) return pal;
                  root++;
              }
          }
        `,
        go: code`
          func ppIsPrime(x int) bool {
          	if x < 2 {
          		return false
          	}
          	if x%2 == 0 {
          		return x == 2
          	}
          	for d := 3; d*d <= x; d += 2 {
          		if x%d == 0 {
          			return false
          		}
          	}
          	return true
          }

          func primePalindrome(n int) int {
          	if n >= 8 && n <= 11 {
          		return 11
          	}
          	digits := 0
          	for t := n; t > 0; t /= 10 {
          		digits++
          	}
          	half := digits/2 + 1
          	scale := 1
          	for i := 1; i < half; i++ {
          		scale *= 10
          	}
          	root := scale
          	if digits%2 == 1 {
          		root = n / scale
          	}
          	for {
          		pal, t := root, root/10
          		for t > 0 {
          			pal = pal*10 + t%10
          			t /= 10
          		}
          		if pal >= n && ppIsPrime(pal) {
          			return pal
          		}
          		root++
          	}
          }
        `,
        kotlin: code`
          fun ppIsPrime(x: Int): Boolean {
              if (x < 2) return false
              if (x % 2 == 0) return x == 2
              var d = 3
              while (d * d <= x) {
                  if (x % d == 0) return false
                  d += 2
              }
              return true
          }

          fun primePalindrome(n: Int): Int {
              if (n in 8..11) return 11
              val digits = n.toString().length
              val half = digits / 2 + 1
              var scale = 1
              for (i in 1 until half) scale *= 10
              var root = if (digits % 2 == 1) n / scale else scale
              while (true) {
                  var pal = root
                  var t = root / 10
                  while (t > 0) {
                      pal = pal * 10 + t % 10
                      t /= 10
                  }
                  if (pal >= n && ppIsPrime(pal)) return pal
                  root++
              }
          }
        `,
        swift: code`
          func ppIsPrime(_ x: Int) -> Bool {
              if x < 2 { return false }
              if x % 2 == 0 { return x == 2 }
              var d = 3
              while d * d <= x {
                  if x % d == 0 { return false }
                  d += 2
              }
              return true
          }

          func primePalindrome(_ n: Int) -> Int {
              if n >= 8 && n <= 11 { return 11 }
              let digits = String(n).count
              let half = digits / 2 + 1
              var scale = 1
              for _ in 1..<half { scale *= 10 }
              var root = digits % 2 == 1 ? n / scale : scale
              while true {
                  var pal = root
                  var t = root / 10
                  while t > 0 {
                      pal = pal * 10 + t % 10
                      t /= 10
                  }
                  if pal >= n && ppIsPrime(pal) { return pal }
                  root += 1
              }
          }
        `,
        rust: code`
          fn pp_is_prime(x: i64) -> bool {
              if x < 2 {
                  return false;
              }
              if x % 2 == 0 {
                  return x == 2;
              }
              let mut d: i64 = 3;
              while d * d <= x {
                  if x % d == 0 {
                      return false;
                  }
                  d += 2;
              }
              true
          }

          fn primePalindrome(n: i32) -> i32 {
              if n >= 8 && n <= 11 {
                  return 11;
              }
              let n = n as i64;
              let digits = n.to_string().len();
              let half = digits / 2 + 1;
              let mut scale: i64 = 1;
              for _ in 1..half {
                  scale *= 10;
              }
              let mut root = if digits % 2 == 1 { n / scale } else { scale };
              loop {
                  let mut pal = root;
                  let mut t = root / 10;
                  while t > 0 {
                      pal = pal * 10 + t % 10;
                      t /= 10;
                  }
                  if pal >= n && pp_is_prime(pal) {
                      return pal as i32;
                  }
                  root += 1;
              }
          }
        `,
        php: code`
          function ppIsPrime($x) {
              if ($x < 2) return false;
              if ($x % 2 == 0) return $x == 2;
              for ($d = 3; $d * $d <= $x; $d += 2) if ($x % $d == 0) return false;
              return true;
          }

          function primePalindrome($n) {
              if ($n >= 8 && $n <= 11) return 11;
              $digits = strlen(strval($n));
              $half = intdiv($digits, 2) + 1;
              $scale = 1;
              for ($i = 1; $i < $half; $i++) $scale *= 10;
              $root = $digits % 2 == 1 ? intdiv($n, $scale) : $scale;
              while (true) {
                  $pal = $root;
                  $t = intdiv($root, 10);
                  while ($t > 0) {
                      $pal = $pal * 10 + $t % 10;
                      $t = intdiv($t, 10);
                  }
                  if ($pal >= $n && ppIsPrime($pal)) return $pal;
                  $root++;
              }
          }
        `,
        ruby: code`
          def pp_prime?(x)
            return false if x < 2
            return x == 2 if x.even?
            d = 3
            while d * d <= x
              return false if x % d == 0
              d += 2
            end
            true
          end

          def primePalindrome(n)
            return 11 if n >= 8 && n <= 11
            digits = n.to_s.length
            half = digits / 2 + 1
            root = 10**(half - 1)
            root = n / 10**(half - 1) if digits.odd?
            while true
              s = root.to_s
              pal = (s + s[0...-1].reverse).to_i
              return pal if pal >= n && pp_prime?(pal)
              root += 1
            end
          end
        `,
      },
    };
  })(),

  // ── Numbers At Most N Given Digit Set (LC 902) ──────────────────
  (() => {
    // Brute force: depth-first enumeration of every number built from the
    // digits that stays <= n (only run when that set is small).
    const brute = (digits: number[], n: number) => {
      let count = 0;
      const dfs = (v: number) => {
        for (const d of digits) {
          const w = v * 10 + d;
          if (w > n) break;
          count++;
          dfs(w);
        }
      };
      dfs(0);
      return count;
    };
    // Independent closed form (written separately from the solutions): all
    // shorter numbers, then a digit-by-digit walk along n.
    const formula = (digits: number[], n: number) => {
      const s = String(n);
      const D = digits.length, K = s.length;
      let total = 0;
      for (let len = 1; len < K; len++) total += Math.pow(D, len);
      for (let i = 0; i < K; i++) {
        const c = Number(s[i]);
        total += digits.filter((d) => d < c).length * Math.pow(D, K - 1 - i);
        if (digits.indexOf(c) < 0) return total;
      }
      return total + 1;
    };
    const ref = (digits: number[], n: number) => {
      const f = formula(digits, n);
      let estimate = 0;
      for (let len = 1; len <= String(n).length; len++) estimate += Math.pow(digits.length, len);
      if (estimate <= 20000 && brute(digits, n) !== f) throw new Error(`digit-set: mismatch for ${digits} ${n}`);
      return f;
    };
    return {
      slug: "numbers-at-most-n-given-digit-set",
      title: "Numbers At Most N Given Digit Set",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Digit DP", "Amazon", "Google"],
      signature: { funcName: "atMostNGivenDigitSet", params: [{ name: "digits", type: "string[]" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`digits` is a list of distinct single-digit strings from `\"1\"` to `\"9\"`, sorted in increasing order. You may write numbers using these digits only, each digit as many times as you like — with `digits = [\"1\",\"3\",\"5\"]` you can write `13`, `551` or `1351315`.\n\nReturn how many **positive** integers you can write that are less than or equal to `n`.",
        [
          { in: "digits = [\"1\",\"3\",\"5\",\"7\"], n = 100", out: "20", note: "The 4 one-digit numbers and the 16 two-digit numbers 11, 13, …, 77 are all at most 100." },
          { in: "digits = [\"1\",\"4\",\"9\"], n = 1000000000", out: "29523", note: "3 + 9 + 27 + … + 3^9 numbers of one to nine digits; no ten-digit number made of these digits is at most 10^9." },
          { in: "digits = [\"7\"], n = 8", out: "1" },
        ],
        ["1 <= digits.length <= 9", "digits[i].length == 1", "digits[i] is a digit from '1' to '9'", "All values in digits are unique and sorted in increasing order", "1 <= n <= 10^9"]),
      hints: [
        "Let `n` have `K` digits and let `D` be the size of the digit set. How many usable numbers have fewer than `K` digits?",
        "All of them: `D + D^2 + … + D^(K-1)`. The remaining work is the numbers with exactly `K` digits.",
        "Walk along `n` from its first digit. At position `i`, every allowed digit smaller than `n[i]` frees up the remaining positions (`D^(K-1-i)` choices). If `n[i]` itself is allowed, continue to the next position; otherwise stop. Reaching the end means `n` itself counts.",
      ],
      editorial: explain({
        idea: "Count numbers shorter than `n` with a geometric sum, then count `K`-digit numbers ≤ `n` digit by digit, the classic digit-DP walk along the tight prefix.",
        steps: [
          "Let `s` be the decimal string of `n`, `K = len(s)` and `D = len(digits)`.",
          "Add `D^len` for every length from 1 to K−1.",
          "For each position `i` of `s`: add `(number of digits < s[i]) * D^(K-1-i)`. If `s[i]` is not in the set, return the total now.",
          "If the loop finishes, `n` itself is writable: return the total plus 1.",
        ],
        why: "A `K`-digit candidate is below `n` exactly when it agrees with `n` on some prefix and then has a smaller digit; the position of the first disagreement partitions those candidates, and once a smaller digit is placed the remaining positions are free, giving `D^(K-1-i)` each. The walk can only continue past position `i` if the candidate copies `s[i]`, which needs `s[i]` in the set. Numbers with fewer digits are always smaller than `n`, and none have leading zeros because the set has no 0.",
        time: "O(K · D) with K ≤ 10",
        space: "O(K)",
        pitfalls: [
          "Forgetting the final +1 for `n` itself when every digit of `n` is available.",
          "Stopping too late: when `s[i]` is missing, the numbers counted so far are complete — do not keep adding.",
          "Computing `D^K` in 32-bit (9^10 overflows); only powers up to `D^(K-1)` are needed.",
        ],
      }),
      examples: [
        { input: "[\"1\",\"3\",\"5\",\"7\"]\n100", expectedOutput: "20" },
        { input: "[\"1\",\"4\",\"9\"]\n1000000000", expectedOutput: "29523" },
        { input: "[\"7\"]\n8", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const size = pick(rng, [1, 2, 3, 4, ri(rng, 1, 9), 9]);
        const digits = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size).sort((a, b) => a - b);
        const shape = ri(rng, 0, 9);
        let n: number;
        if (shape < 4) n = ri(rng, 1, Math.pow(10, ri(rng, 1, 9)));
        else if (shape < 7) {
          // Built from the set (so the walk runs to the end), maybe nudged.
          const len = ri(rng, 1, 9);
          n = 0;
          for (let i = 0; i < len; i++) n = n * 10 + pick(rng, digits);
          n = Math.max(1, n + ri(rng, -1, 1));
        } else if (shape === 7) n = 1000000000;
        else if (shape === 8) n = ri(rng, 1, 1000);
        else n = pick(rng, [1, 9, 10, 99, 100, 999999999]);
        return { input: `${fmtStrArr(digits.map(String))}\n${n}`, expectedOutput: String(ref(digits, n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def atMostNGivenDigitSet(digits: List[str], n: int) -> int:
              s = str(n)
              k = len(s)
              d = len(digits)
              total = sum(d ** length for length in range(1, k))
              for i, ch in enumerate(s):
                  smaller = sum(1 for x in digits if x < ch)
                  total += smaller * d ** (k - 1 - i)
                  if ch not in digits:
                      return total
              return total + 1
        `,
        javascript: code`
          var atMostNGivenDigitSet = function(digits, n) {
              var s = String(n);
              var k = s.length, d = digits.length;
              var pw = [1];
              for (var i = 1; i < k; i++) pw.push(pw[i - 1] * d);
              var total = 0;
              for (var len = 1; len < k; len++) total += pw[len];
              for (var i = 0; i < k; i++) {
                  var smaller = 0, same = false;
                  for (var j = 0; j < d; j++) {
                      if (digits[j] < s[i]) smaller++;
                      else if (digits[j] === s[i]) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return total;
              }
              return total + 1;
          };
        `,
        typescript: code`
          function atMostNGivenDigitSet(digits: string[], n: number): number {
              var s = "" + n;
              var k = s.length, d = digits.length;
              var pw: number[] = [1];
              for (var i = 1; i < k; i++) pw.push(pw[i - 1] * d);
              var total = 0;
              for (var len = 1; len < k; len++) total += pw[len];
              for (var i = 0; i < k; i++) {
                  var c = s.charAt(i);
                  var smaller = 0, same = false;
                  for (var j = 0; j < d; j++) {
                      if (digits[j] < c) smaller++;
                      else if (digits[j] === c) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return total;
              }
              return total + 1;
          }
        `,
        java: code`
          public static int atMostNGivenDigitSet(String[] digits, int n) {
              String s = String.valueOf(n);
              int k = s.length(), d = digits.length;
              long[] pw = new long[k];
              pw[0] = 1;
              for (int i = 1; i < k; i++) pw[i] = pw[i - 1] * d;
              long total = 0;
              for (int len = 1; len < k; len++) total += pw[len];
              for (int i = 0; i < k; i++) {
                  char c = s.charAt(i);
                  int smaller = 0;
                  boolean same = false;
                  for (String dg : digits) {
                      if (dg.charAt(0) < c) smaller++;
                      else if (dg.charAt(0) == c) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return (int) total;
              }
              return (int) (total + 1);
          }
        `,
        cpp: code`
          int atMostNGivenDigitSet(vector<string>& digits, int n) {
              string s = to_string(n);
              int k = s.size(), d = digits.size();
              vector<long long> pw(k, 1);
              for (int i = 1; i < k; i++) pw[i] = pw[i - 1] * d;
              long long total = 0;
              for (int len = 1; len < k; len++) total += pw[len];
              for (int i = 0; i < k; i++) {
                  int smaller = 0;
                  bool same = false;
                  for (const string& dg : digits) {
                      if (dg[0] < s[i]) smaller++;
                      else if (dg[0] == s[i]) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return (int)total;
              }
              return (int)(total + 1);
          }
        `,
        c: code`
          int atMostNGivenDigitSet(char** digits, int digitsSize, int n) {
              char rev[16], s[16];
              int k = 0;
              for (int t = n; t > 0; t /= 10) rev[k++] = (char)('0' + t % 10);
              for (int i = 0; i < k; i++) s[i] = rev[k - 1 - i];
              long long pw[16];
              pw[0] = 1;
              for (int i = 1; i < k; i++) pw[i] = pw[i - 1] * digitsSize;
              long long total = 0;
              for (int len = 1; len < k; len++) total += pw[len];
              for (int i = 0; i < k; i++) {
                  int smaller = 0;
                  bool same = false;
                  for (int j = 0; j < digitsSize; j++) {
                      if (digits[j][0] < s[i]) smaller++;
                      else if (digits[j][0] == s[i]) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return (int)total;
              }
              return (int)(total + 1);
          }
        `,
        csharp: code`
          public static int AtMostNGivenDigitSet(string[] digits, int n)
          {
              string s = n.ToString();
              int k = s.Length, d = digits.Length;
              long[] pw = new long[k];
              pw[0] = 1;
              for (int i = 1; i < k; i++) pw[i] = pw[i - 1] * d;
              long total = 0;
              for (int len = 1; len < k; len++) total += pw[len];
              for (int i = 0; i < k; i++)
              {
                  int smaller = 0;
                  bool same = false;
                  foreach (string dg in digits)
                  {
                      if (dg[0] < s[i]) smaller++;
                      else if (dg[0] == s[i]) same = true;
                  }
                  total += smaller * pw[k - 1 - i];
                  if (!same) return (int)total;
              }
              return (int)(total + 1);
          }
        `,
        go: code`
          func atMostNGivenDigitSet(digits []string, n int) int {
          	s := strconv.Itoa(n)
          	k, d := len(s), len(digits)
          	pw := make([]int, k)
          	pw[0] = 1
          	for i := 1; i < k; i++ {
          		pw[i] = pw[i-1] * d
          	}
          	total := 0
          	for length := 1; length < k; length++ {
          		total += pw[length]
          	}
          	for i := 0; i < k; i++ {
          		smaller, same := 0, false
          		for _, dg := range digits {
          			if dg[0] < s[i] {
          				smaller++
          			} else if dg[0] == s[i] {
          				same = true
          			}
          		}
          		total += smaller * pw[k-1-i]
          		if !same {
          			return total
          		}
          	}
          	return total + 1
          }
        `,
        kotlin: code`
          fun atMostNGivenDigitSet(digits: Array<String>, n: Int): Int {
              val s = n.toString()
              val k = s.length
              val d = digits.size
              val pw = LongArray(k)
              pw[0] = 1L
              for (i in 1 until k) pw[i] = pw[i - 1] * d
              var total = 0L
              for (len in 1 until k) total += pw[len]
              for (i in 0 until k) {
                  var smaller = 0
                  var same = false
                  for (dg in digits) {
                      if (dg[0] < s[i]) smaller++
                      else if (dg[0] == s[i]) same = true
                  }
                  total += smaller * pw[k - 1 - i]
                  if (!same) return total.toInt()
              }
              return (total + 1).toInt()
          }
        `,
        swift: code`
          func atMostNGivenDigitSet(_ digits: [String], _ n: Int) -> Int {
              let s = Array(String(n))
              let k = s.count
              let ds = digits.map { Character($0) }
              let d = ds.count
              var pw = [Int](repeating: 1, count: k)
              var i = 1
              while i < k {
                  pw[i] = pw[i - 1] * d
                  i += 1
              }
              var total = 0
              var len = 1
              while len < k {
                  total += pw[len]
                  len += 1
              }
              for pos in 0..<k {
                  var smaller = 0
                  var same = false
                  for c in ds {
                      if c < s[pos] { smaller += 1 } else if c == s[pos] { same = true }
                  }
                  total += smaller * pw[k - 1 - pos]
                  if !same { return total }
              }
              return total + 1
          }
        `,
        rust: code`
          fn atMostNGivenDigitSet(digits: Vec<String>, n: i32) -> i32 {
              let s = n.to_string().into_bytes();
              let k = s.len();
              let d = digits.len() as i64;
              let mut pw = vec![1i64; k];
              for i in 1..k {
                  pw[i] = pw[i - 1] * d;
              }
              let mut total: i64 = 0;
              for len in 1..k {
                  total += pw[len];
              }
              for i in 0..k {
                  let mut smaller: i64 = 0;
                  let mut same = false;
                  for dg in digits.iter() {
                      let c = dg.as_bytes()[0];
                      if c < s[i] {
                          smaller += 1;
                      } else if c == s[i] {
                          same = true;
                      }
                  }
                  total += smaller * pw[k - 1 - i];
                  if !same {
                      return total as i32;
                  }
              }
              (total + 1) as i32
          }
        `,
        php: code`
          function atMostNGivenDigitSet($digits, $n) {
              $s = strval($n);
              $k = strlen($s);
              $d = count($digits);
              $pw = [1];
              for ($i = 1; $i < $k; $i++) $pw[$i] = $pw[$i - 1] * $d;
              $total = 0;
              for ($len = 1; $len < $k; $len++) $total += $pw[$len];
              for ($i = 0; $i < $k; $i++) {
                  $c = ord($s[$i]);
                  $smaller = 0;
                  $same = false;
                  foreach ($digits as $dg) {
                      $v = ord($dg[0]);
                      if ($v < $c) $smaller++;
                      elseif ($v == $c) $same = true;
                  }
                  $total += $smaller * $pw[$k - 1 - $i];
                  if (!$same) return $total;
              }
              return $total + 1;
          }
        `,
        ruby: code`
          def atMostNGivenDigitSet(digits, n)
            s = n.to_s
            k = s.length
            d = digits.length
            total = 0
            (1...k).each { |len| total += d**len }
            i = 0
            while i < k
              ch = s[i]
              total += digits.count { |x| x < ch } * d**(k - 1 - i)
              return total unless digits.include?(ch)
              i += 1
            end
            total + 1
          end
        `,
      },
    };
  })(),

  // ── Smallest Integer Divisible by K (LC 1015) ───────────────────
  (() => {
    // Independent reference: k divides the repunit of length L exactly when
    // 9k divides 10^L - 1, so the answer is the multiplicative order of 10
    // modulo 9k (which exists iff gcd(k, 10) = 1).
    const ref = (k: number) => {
      if (k % 2 === 0 || k % 5 === 0) return -1;
      const m = 9 * k;
      let p = 10 % m, len = 1;
      while (p !== 1 % m) { p = (p * 10) % m; len++; }
      return len;
    };
    return {
      slug: "smallest-integer-divisible-by-k",
      title: "Smallest Integer Divisible by K",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "Number Theory", "Google", "Amazon"],
      signature: { funcName: "smallestRepunitDivByK", params: [{ name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `k`, find the smallest positive integer `n` that is divisible by `k` and whose decimal digits are **all 1** (like `1`, `11`, `111`, …).\n\nReturn the **number of digits** of `n`, or `-1` if no such `n` exists.\n\nNote that `n` itself can be far too large for any integer type — only its length is returned.",
        [
          { in: "k = 1", out: "1", note: "n = 1." },
          { in: "k = 2", out: "-1", note: "Every number made of ones is odd." },
          { in: "k = 3", out: "3", note: "n = 111 = 3 × 37." },
        ],
        ["1 <= k <= 10^5"]),
      hints: [
        "You only care whether `n` is divisible by `k`, so keep `n mod k` instead of `n`. Appending a digit 1 turns remainder `r` into `(10r + 1) mod k`.",
        "There are only `k` possible remainders. If none of the first `k` lengths gives remainder 0, the remainders are cycling and never will.",
        "If `k` is divisible by 2 or 5 the answer is immediately -1, since every all-ones number ends in 1.",
      ],
      editorial: explain({
        idea: "Track the remainder of the all-ones number modulo `k` as it grows by one digit; by the pigeonhole principle, `k` steps either hit remainder 0 or never will.",
        steps: [
          "If `k` is divisible by 2 or 5, return -1.",
          "Set `r = 0`. For `length` from 1 to `k`: `r = (r * 10 + 1) % k`; if `r == 0`, return `length`.",
          "Return -1 (not reached when `gcd(k, 10) = 1`).",
        ],
        why: "The remainder of the length-`L` repunit determines the next one, so the sequence of remainders is eventually periodic. When `gcd(k, 10) = 1` the step `r → 10r + 1` is a bijection modulo `k`, so the sequence is purely periodic and must return to its starting value 0 within `k` steps — the answer always exists and is at most `k`. When 2 or 5 divides `k`, any multiple of `k` ends in an even digit or in 0 or 5, never in 1.",
        time: "O(k)",
        space: "O(1)",
        pitfalls: [
          "Building the actual number overflows after 10 digits; carry only the remainder.",
          "Without the 2/5 check you need a cycle detector (or the `k`-step bound) to stop.",
          "`r * 10 + 1` stays below 10^6 here, but keep the reduction inside the loop.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "2", expectedOutput: "-1" },
        { input: "3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 99);
        let k: number;
        if (shape < 50) k = ri(rng, 1, 100);
        else if (shape < 82) k = ri(rng, 101, 2000);
        else if (shape < 95) k = ri(rng, 2001, 20000);
        else if (shape < 98) k = ri(rng, 20001, 100000);
        else k = pick(rng, [1, 7, 9, 81, 99999, 100000, 99991, 49999]);
        // Most k divisible by 2 or 5 are a one-line -1; keep a third of those.
        if (shape < 98 && (k % 2 === 0 || k % 5 === 0) && ri(rng, 0, 2) > 0) {
          k |= 1;
          if (k % 5 === 0) k += 2;
          if (k > 100000) k -= 4;
        }
        return { input: String(k), expectedOutput: String(ref(k)) };
      },
      solutions: {
        python: code`
          def smallestRepunitDivByK(k: int) -> int:
              if k % 2 == 0 or k % 5 == 0:
                  return -1
              r = 0
              for length in range(1, k + 1):
                  r = (r * 10 + 1) % k
                  if r == 0:
                      return length
              return -1
        `,
        javascript: code`
          var smallestRepunitDivByK = function(k) {
              if (k % 2 === 0 || k % 5 === 0) return -1;
              var r = 0;
              for (var length = 1; length <= k; length++) {
                  r = (r * 10 + 1) % k;
                  if (r === 0) return length;
              }
              return -1;
          };
        `,
        typescript: code`
          function smallestRepunitDivByK(k: number): number {
              if (k % 2 === 0 || k % 5 === 0) return -1;
              var r = 0;
              for (var length = 1; length <= k; length++) {
                  r = (r * 10 + 1) % k;
                  if (r === 0) return length;
              }
              return -1;
          }
        `,
        java: code`
          public static int smallestRepunitDivByK(int k) {
              if (k % 2 == 0 || k % 5 == 0) return -1;
              int r = 0;
              for (int length = 1; length <= k; length++) {
                  r = (r * 10 + 1) % k;
                  if (r == 0) return length;
              }
              return -1;
          }
        `,
        cpp: code`
          int smallestRepunitDivByK(int k) {
              if (k % 2 == 0 || k % 5 == 0) return -1;
              int r = 0;
              for (int length = 1; length <= k; length++) {
                  r = (r * 10 + 1) % k;
                  if (r == 0) return length;
              }
              return -1;
          }
        `,
        c: code`
          int smallestRepunitDivByK(int k) {
              if (k % 2 == 0 || k % 5 == 0) return -1;
              int r = 0;
              for (int length = 1; length <= k; length++) {
                  r = (r * 10 + 1) % k;
                  if (r == 0) return length;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int SmallestRepunitDivByK(int k)
          {
              if (k % 2 == 0 || k % 5 == 0) return -1;
              int r = 0;
              for (int length = 1; length <= k; length++)
              {
                  r = (r * 10 + 1) % k;
                  if (r == 0) return length;
              }
              return -1;
          }
        `,
        go: code`
          func smallestRepunitDivByK(k int) int {
          	if k%2 == 0 || k%5 == 0 {
          		return -1
          	}
          	r := 0
          	for length := 1; length <= k; length++ {
          		r = (r*10 + 1) % k
          		if r == 0 {
          			return length
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun smallestRepunitDivByK(k: Int): Int {
              if (k % 2 == 0 || k % 5 == 0) return -1
              var r = 0
              for (length in 1..k) {
                  r = (r * 10 + 1) % k
                  if (r == 0) return length
              }
              return -1
          }
        `,
        swift: code`
          func smallestRepunitDivByK(_ k: Int) -> Int {
              if k % 2 == 0 || k % 5 == 0 { return -1 }
              var r = 0
              for length in 1...k {
                  r = (r * 10 + 1) % k
                  if r == 0 { return length }
              }
              return -1
          }
        `,
        rust: code`
          fn smallestRepunitDivByK(k: i32) -> i32 {
              if k % 2 == 0 || k % 5 == 0 {
                  return -1;
              }
              let mut r = 0;
              for length in 1..=k {
                  r = (r * 10 + 1) % k;
                  if r == 0 {
                      return length;
                  }
              }
              -1
          }
        `,
        php: code`
          function smallestRepunitDivByK($k) {
              if ($k % 2 == 0 || $k % 5 == 0) return -1;
              $r = 0;
              for ($length = 1; $length <= $k; $length++) {
                  $r = ($r * 10 + 1) % $k;
                  if ($r == 0) return $length;
              }
              return -1;
          }
        `,
        ruby: code`
          def smallestRepunitDivByK(k)
            return -1 if k % 2 == 0 || k % 5 == 0
            r = 0
            length = 1
            while length <= k
              r = (r * 10 + 1) % k
              return length if r == 0
              length += 1
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Powerful Integers (LC 970) ──────────────────────────────────
  (() => {
    // Brute force over exponent pairs (0..20 covers 10^6 for any base >= 2).
    const ref = (x: number, y: number, bound: number) => {
      const powers = (b: number) => {
        const out: number[] = [];
        for (let e = 0, v = 1; e <= 20 && v <= bound; e++, v *= b) out.push(v);
        return out;
      };
      const found = new Set<number>();
      for (const a of powers(x)) for (const b of powers(y)) if (a + b <= bound) found.add(a + b);
      return Array.from(found).sort((p, q) => p - q);
    };
    return {
      slug: "powerful-integers",
      title: "Powerful Integers",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "Enumeration", "Amazon", "Apple"],
      signature: {
        funcName: "powerfulIntegers",
        params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }, { name: "bound", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "An integer is **powerful** for `x` and `y` if it can be written as `x^i + y^j` for some integers `i >= 0` and `j >= 0`.\n\nReturn every powerful integer that is less than or equal to `bound`, each listed **once**, in **increasing** order.",
        [
          { in: "x = 2, y = 3, bound = 10", out: "[2,3,4,5,7,9,10]", note: "2 = 1+1, 3 = 2+1, 4 = 1+3, 5 = 2+3, 7 = 4+3, 9 = 8+1, 10 = 1+9." },
          { in: "x = 3, y = 5, bound = 15", out: "[2,4,6,8,10,14]" },
          { in: "x = 2, y = 1, bound = 10", out: "[2,3,5,9]", note: "Every power of 1 is 1, so the values are 2^i + 1." },
        ],
        ["1 <= x, y <= 100", "0 <= bound <= 10^6"]),
      hints: [
        "How many powers of `x` are at most 10^6? For `x >= 2`, no more than 20.",
        "So try every pair of a power of `x` and a power of `y` that keeps the sum within `bound`, and collect the sums in a set (different pairs can give the same sum).",
        "Base 1 is the trap: `1^i` is always 1, so a loop that multiplies by `x` until it exceeds the bound never ends. Stop after the first power when the base is 1.",
      ],
      editorial: explain({
        idea: "There are at most about 20 × 20 candidate sums, so enumerate every pair of powers, de-duplicate with a set, and sort.",
        steps: [
          "For `a = 1, x, x^2, …` while `a <= bound`:",
          "For `b = 1, y, y^2, …` while `a + b <= bound`, add `a + b` to a set; if `y == 1`, stop after the first `b`.",
          "If `x == 1`, stop after the first `a`.",
          "Return the set's values in increasing order.",
        ],
        why: "Every powerful integer within the bound is some `x^i + y^j` with both terms at most `bound`, and the loops visit every such pair: powers only grow, so once a sum exceeds `bound` larger exponents cannot help. A base of 1 has a single distinct power, which is why its loop runs once. The set removes sums produced by several pairs, such as `1 + 4 = 4 + 1` when `x = y`.",
        time: "O(log_x(bound) · log_y(bound) · log(answer)) — at most a few hundred sums",
        space: "O(number of results)",
        pitfalls: [
          "An infinite loop when `x` or `y` is 1.",
          "Duplicates: with `x = y = 2`, 3 = 1 + 2 = 2 + 1 must appear once.",
          "`bound` can be 0 or 1, where the answer is empty (the smallest powerful integer is 2).",
        ],
      }),
      examples: [
        { input: "2\n3\n10", expectedOutput: "[2,3,4,5,7,9,10]" },
        { input: "3\n5\n15", expectedOutput: "[2,4,6,8,10,14]" },
        { input: "2\n1\n10", expectedOutput: "[2,3,5,9]" },
      ],
      gen: (rng: Rng) => {
        const base = () => pick(rng, [1, 2, 3, ri(rng, 1, 10), ri(rng, 1, 100)]);
        const x = base(), y = base();
        const shape = ri(rng, 0, 9);
        const bound = shape === 0 ? ri(rng, 0, 2) : shape < 5 ? ri(rng, 0, 100) : shape < 8 ? ri(rng, 0, 10000) : ri(rng, 0, 1000000);
        return { input: `${x}\n${y}\n${bound}`, expectedOutput: fmtIntArr(ref(x, y, bound)) };
      },
      solutions: {
        python: code`
          from typing import List

          def powerfulIntegers(x: int, y: int, bound: int) -> List[int]:
              found = set()
              a = 1
              while a <= bound:
                  b = 1
                  while a + b <= bound:
                      found.add(a + b)
                      if y == 1:
                          break
                      b *= y
                  if x == 1:
                      break
                  a *= x
              return sorted(found)
        `,
        javascript: code`
          var powerfulIntegers = function(x, y, bound) {
              var found = new Set();
              for (var a = 1; a <= bound; a *= x) {
                  for (var b = 1; a + b <= bound; b *= y) {
                      found.add(a + b);
                      if (y === 1) break;
                  }
                  if (x === 1) break;
              }
              return Array.from(found).sort(function(p, q) { return p - q; });
          };
        `,
        typescript: code`
          function powerfulIntegers(x: number, y: number, bound: number): number[] {
              var seen: { [k: string]: boolean } = {};
              var out: number[] = [];
              for (var a = 1; a <= bound; a *= x) {
                  for (var b = 1; a + b <= bound; b *= y) {
                      var key = "" + (a + b);
                      if (!seen[key]) {
                          seen[key] = true;
                          out.push(a + b);
                      }
                      if (y === 1) break;
                  }
                  if (x === 1) break;
              }
              return out.sort(function(p, q) { return p - q; });
          }
        `,
        java: code`
          public static int[] powerfulIntegers(int x, int y, int bound) {
              TreeSet<Integer> found = new TreeSet<>();
              for (long a = 1; a <= bound; a *= x) {
                  for (long b = 1; a + b <= bound; b *= y) {
                      found.add((int) (a + b));
                      if (y == 1) break;
                  }
                  if (x == 1) break;
              }
              int[] out = new int[found.size()];
              int i = 0;
              for (int v : found) out[i++] = v;
              return out;
          }
        `,
        cpp: code`
          vector<int> powerfulIntegers(int x, int y, int bound) {
              set<int> found;
              for (long long a = 1; a <= bound; a *= x) {
                  for (long long b = 1; a + b <= bound; b *= y) {
                      found.insert((int)(a + b));
                      if (y == 1) break;
                  }
                  if (x == 1) break;
              }
              return vector<int>(found.begin(), found.end());
          }
        `,
        c: code`
          static int piCmp(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int* powerfulIntegers(int x, int y, int bound, int* returnSize) {
              int* vals = (int*)malloc(sizeof(int) * 512);
              int cnt = 0;
              for (long long a = 1; a <= bound; a *= x) {
                  for (long long b = 1; a + b <= bound; b *= y) {
                      vals[cnt++] = (int)(a + b);
                      if (y == 1) break;
                  }
                  if (x == 1) break;
              }
              qsort(vals, cnt, sizeof(int), piCmp);
              int m = 0;
              for (int i = 0; i < cnt; i++) {
                  if (m == 0 || vals[i] != vals[m - 1]) vals[m++] = vals[i];
              }
              *returnSize = m;
              return vals;
          }
        `,
        csharp: code`
          public static int[] PowerfulIntegers(int x, int y, int bound)
          {
              var found = new SortedSet<int>();
              for (long a = 1; a <= bound; a *= x)
              {
                  for (long b = 1; a + b <= bound; b *= y)
                  {
                      found.Add((int)(a + b));
                      if (y == 1) break;
                  }
                  if (x == 1) break;
              }
              return found.ToArray();
          }
        `,
        go: code`
          func powerfulIntegers(x int, y int, bound int) []int {
          	seen := map[int]bool{}
          	out := []int{}
          	for a := 1; a <= bound; a *= x {
          		for b := 1; a+b <= bound; b *= y {
          			if !seen[a+b] {
          				seen[a+b] = true
          				out = append(out, a+b)
          			}
          			if y == 1 {
          				break
          			}
          		}
          		if x == 1 {
          			break
          		}
          	}
          	sort.Ints(out)
          	return out
          }
        `,
        kotlin: code`
          fun powerfulIntegers(x: Int, y: Int, bound: Int): IntArray {
              val found = java.util.TreeSet<Int>()
              var a = 1L
              while (a <= bound) {
                  var b = 1L
                  while (a + b <= bound) {
                      found.add((a + b).toInt())
                      if (y == 1) break
                      b *= y
                  }
                  if (x == 1) break
                  a *= x
              }
              return found.toIntArray()
          }
        `,
        swift: code`
          func powerfulIntegers(_ x: Int, _ y: Int, _ bound: Int) -> [Int] {
              var found = Set<Int>()
              var a = 1
              while a <= bound {
                  var b = 1
                  while a + b <= bound {
                      found.insert(a + b)
                      if y == 1 { break }
                      b *= y
                  }
                  if x == 1 { break }
                  a *= x
              }
              return found.sorted()
          }
        `,
        rust: code`
          fn powerfulIntegers(x: i32, y: i32, bound: i32) -> Vec<i32> {
              let bound = bound as i64;
              let mut vals: Vec<i32> = Vec::new();
              let mut a: i64 = 1;
              while a <= bound {
                  let mut b: i64 = 1;
                  while a + b <= bound {
                      vals.push((a + b) as i32);
                      if y == 1 {
                          break;
                      }
                      b *= y as i64;
                  }
                  if x == 1 {
                      break;
                  }
                  a *= x as i64;
              }
              vals.sort();
              vals.dedup();
              vals
          }
        `,
        php: code`
          function powerfulIntegers($x, $y, $bound) {
              $found = [];
              for ($a = 1; $a <= $bound; $a *= $x) {
                  for ($b = 1; $a + $b <= $bound; $b *= $y) {
                      $found[$a + $b] = true;
                      if ($y == 1) break;
                  }
                  if ($x == 1) break;
              }
              $out = array_keys($found);
              sort($out);
              return $out;
          }
        `,
        ruby: code`
          def powerfulIntegers(x, y, bound)
            found = {}
            a = 1
            while a <= bound
              b = 1
              while a + b <= bound
                found[a + b] = true
                break if y == 1
                b *= y
              end
              break if x == 1
              a *= x
            end
            found.keys.sort
          end
        `,
      },
    };
  })(),

  // ── Robot Bounded In Circle (LC 1041) ───────────────────────────
  (() => {
    // Brute force: run the instructions four times; a bounded robot is back at
    // the origin after four rounds, an unbounded one has drifted away.
    const ref = (instructions: string) => {
      let x = 0, y = 0, dir = 0;
      const dx = [0, 1, 0, -1], dy = [1, 0, -1, 0];
      for (let round = 0; round < 4; round++) {
        for (const c of instructions) {
          if (c === "G") { x += dx[dir]; y += dy[dir]; }
          else if (c === "R") dir = (dir + 1) % 4;
          else dir = (dir + 3) % 4;
        }
      }
      return x === 0 && y === 0;
    };
    return {
      slug: "robot-bounded-in-circle",
      title: "Robot Bounded In Circle",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Simulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "isRobotBounded", params: [{ name: "instructions", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A robot stands at the origin `(0, 0)` of an infinite grid, facing **north** (the direction of increasing `y`). It understands three instructions:\n\n- `'G'`: move forward one unit;\n- `'L'`: turn 90 degrees left (anticlockwise);\n- `'R'`: turn 90 degrees right (clockwise).\n\nThe robot performs the string `instructions` in order, and then repeats it from the start, **forever**.\n\nReturn `true` if there is a circle on the plane that the robot never leaves, and `false` if it wanders off arbitrarily far.",
        [
          { in: "instructions = \"GGLLGG\"", out: "true", note: "The robot walks to (0, 2), turns around and walks back to (0, 0): it stays inside a circle of radius 2." },
          { in: "instructions = \"GG\"", out: "false", note: "It moves north two units every round, forever." },
          { in: "instructions = \"GL\"", out: "true", note: "It traces the square (0,0) → (0,1) → (-1,1) → (-1,0) → (0,0) over four rounds." },
        ],
        ["1 <= instructions.length <= 100", "instructions[i] is 'G', 'L' or 'R'"]),
      hints: [
        "Run the instructions once and look at where the robot ends and which way it faces.",
        "If it ends back at the origin, it repeats the same loop forever. If it ends somewhere else but still facing north, every round shifts it by the same vector.",
        "If it ends facing any other direction, after two or four rounds the displacements cancel out.",
      ],
      editorial: explain({
        idea: "After one pass the robot is bounded exactly when it is back at the origin or no longer facing north.",
        steps: [
          "Simulate one pass, keeping the position `(x, y)` and the direction as a unit vector `(dx, dy)` starting at `(0, 1)`.",
          "`'G'` adds the direction to the position; `'L'` turns `(dx, dy)` into `(-dy, dx)`; `'R'` turns it into `(dy, -dx)`.",
          "Return `true` if the position is `(0, 0)` or the direction is not `(0, 1)`.",
        ],
        why: "One pass moves the robot by a displacement `v` and rotates it by some angle. If it faces north again, each pass adds the same `v`, so it stays bounded only if `v = 0`. If it turned by 180°, the second pass adds `-v` and the robot is home after two passes; if it turned by ±90°, the four passes add `v` rotated four ways, which sum to zero. In those cases the path repeats with a finite period and fits in a circle.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking only 'back at the origin' misses \"GL\", which ends elsewhere but turns.",
          "Getting the rotation formulas mixed up: left from north must face west, i.e. `(0, 1) → (-1, 0)`.",
          "Simulating many rounds to 'see' if it escapes is unnecessary — four rounds always settle it.",
        ],
      }),
      examples: [
        { input: "\"GGLLGG\"", expectedOutput: "true" },
        { input: "\"GG\"", expectedOutput: "false" },
        { input: "\"GL\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [1, 2, 3, ri(rng, 1, 8), ri(rng, 5, 30), ri(rng, 30, 100)]);
        const alphabet = pick(rng, ["GLR", "GGGLR", "GGGGGGLR", "G", "LR", "GL", "GR"]);
        let s = "";
        for (let i = 0; i < len; i++) s += alphabet[ri(rng, 0, alphabet.length - 1)];
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def isRobotBounded(instructions: str) -> bool:
              x = y = 0
              dx, dy = 0, 1
              for c in instructions:
                  if c == 'G':
                      x += dx
                      y += dy
                  elif c == 'L':
                      dx, dy = -dy, dx
                  else:
                      dx, dy = dy, -dx
              return (x == 0 and y == 0) or (dx, dy) != (0, 1)
        `,
        javascript: code`
          var isRobotBounded = function(instructions) {
              var x = 0, y = 0, dx = 0, dy = 1;
              for (var i = 0; i < instructions.length; i++) {
                  var c = instructions[i], t;
                  if (c === 'G') {
                      x += dx;
                      y += dy;
                  } else if (c === 'L') {
                      t = dx; dx = -dy; dy = t;
                  } else {
                      t = dx; dx = dy; dy = -t;
                  }
              }
              return (x === 0 && y === 0) || !(dx === 0 && dy === 1);
          };
        `,
        typescript: code`
          function isRobotBounded(instructions: string): boolean {
              var x = 0, y = 0, dx = 0, dy = 1;
              for (var i = 0; i < instructions.length; i++) {
                  var c = instructions.charAt(i), t: number;
                  if (c === 'G') {
                      x += dx;
                      y += dy;
                  } else if (c === 'L') {
                      t = dx; dx = -dy; dy = t;
                  } else {
                      t = dx; dx = dy; dy = -t;
                  }
              }
              return (x === 0 && y === 0) || !(dx === 0 && dy === 1);
          }
        `,
        java: code`
          public static boolean isRobotBounded(String instructions) {
              int x = 0, y = 0, dx = 0, dy = 1;
              for (int i = 0; i < instructions.length(); i++) {
                  char c = instructions.charAt(i);
                  if (c == 'G') {
                      x += dx;
                      y += dy;
                  } else if (c == 'L') {
                      int t = dx; dx = -dy; dy = t;
                  } else {
                      int t = dx; dx = dy; dy = -t;
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1);
          }
        `,
        cpp: code`
          bool isRobotBounded(string instructions) {
              int x = 0, y = 0, dx = 0, dy = 1;
              for (char c : instructions) {
                  if (c == 'G') {
                      x += dx;
                      y += dy;
                  } else if (c == 'L') {
                      int t = dx; dx = -dy; dy = t;
                  } else {
                      int t = dx; dx = dy; dy = -t;
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1);
          }
        `,
        c: code`
          bool isRobotBounded(const char* instructions) {
              int x = 0, y = 0, dx = 0, dy = 1;
              for (const char* p = instructions; *p; p++) {
                  if (*p == 'G') {
                      x += dx;
                      y += dy;
                  } else if (*p == 'L') {
                      int t = dx; dx = -dy; dy = t;
                  } else {
                      int t = dx; dx = dy; dy = -t;
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1);
          }
        `,
        csharp: code`
          public static bool IsRobotBounded(string instructions)
          {
              int x = 0, y = 0, dx = 0, dy = 1;
              foreach (char c in instructions)
              {
                  if (c == 'G')
                  {
                      x += dx;
                      y += dy;
                  }
                  else if (c == 'L')
                  {
                      int t = dx; dx = -dy; dy = t;
                  }
                  else
                  {
                      int t = dx; dx = dy; dy = -t;
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1);
          }
        `,
        go: code`
          func isRobotBounded(instructions string) bool {
          	x, y, dx, dy := 0, 0, 0, 1
          	for i := 0; i < len(instructions); i++ {
          		c := instructions[i]
          		if c == 'G' {
          			x += dx
          			y += dy
          		} else if c == 'L' {
          			dx, dy = -dy, dx
          		} else {
          			dx, dy = dy, -dx
          		}
          	}
          	return (x == 0 && y == 0) || !(dx == 0 && dy == 1)
          }
        `,
        kotlin: code`
          fun isRobotBounded(instructions: String): Boolean {
              var x = 0
              var y = 0
              var dx = 0
              var dy = 1
              for (c in instructions) {
                  if (c == 'G') {
                      x += dx
                      y += dy
                  } else if (c == 'L') {
                      val t = dx
                      dx = -dy
                      dy = t
                  } else {
                      val t = dx
                      dx = dy
                      dy = -t
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1)
          }
        `,
        swift: code`
          func isRobotBounded(_ instructions: String) -> Bool {
              var x = 0, y = 0, dx = 0, dy = 1
              for c in instructions {
                  if c == "G" {
                      x += dx
                      y += dy
                  } else if c == "L" {
                      let t = dx
                      dx = -dy
                      dy = t
                  } else {
                      let t = dx
                      dx = dy
                      dy = -t
                  }
              }
              return (x == 0 && y == 0) || !(dx == 0 && dy == 1)
          }
        `,
        rust: code`
          fn isRobotBounded(instructions: String) -> bool {
              let (mut x, mut y, mut dx, mut dy) = (0i32, 0i32, 0i32, 1i32);
              for c in instructions.chars() {
                  if c == 'G' {
                      x += dx;
                      y += dy;
                  } else if c == 'L' {
                      let t = dx;
                      dx = -dy;
                      dy = t;
                  } else {
                      let t = dx;
                      dx = dy;
                      dy = -t;
                  }
              }
              (x == 0 && y == 0) || !(dx == 0 && dy == 1)
          }
        `,
        php: code`
          function isRobotBounded($instructions) {
              $x = 0; $y = 0; $dx = 0; $dy = 1;
              $n = strlen($instructions);
              for ($i = 0; $i < $n; $i++) {
                  $c = $instructions[$i];
                  if ($c == 'G') {
                      $x += $dx;
                      $y += $dy;
                  } elseif ($c == 'L') {
                      $t = $dx; $dx = -$dy; $dy = $t;
                  } else {
                      $t = $dx; $dx = $dy; $dy = -$t;
                  }
              }
              return ($x == 0 && $y == 0) || !($dx == 0 && $dy == 1);
          }
        `,
        ruby: code`
          def isRobotBounded(instructions)
            x = 0
            y = 0
            dx = 0
            dy = 1
            instructions.each_char do |c|
              if c == 'G'
                x += dx
                y += dy
              elsif c == 'L'
                dx, dy = -dy, dx
              else
                dx, dy = dy, -dx
              end
            end
            (x == 0 && y == 0) || !(dx == 0 && dy == 1)
          end
        `,
      },
    };
  })(),

  // ── Day of the Year (LC 1154) ───────────────────────────────────
  (() => {
    // Reference: the platform's own calendar (Date.UTC, proleptic Gregorian).
    const ref = (y: number, m: number, d: number) => (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000 + 1;
    const pad = (v: number) => (v < 10 ? "0" : "") + v;
    return {
      slug: "day-of-the-year",
      title: "Day of the Year",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Amazon", "TCS"],
      signature: { funcName: "dayOfYear", params: [{ name: "date", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`date` is a valid Gregorian calendar date written as `YYYY-MM-DD`. Return its **day number** within its year: January 1st is day 1, January 2nd is day 2, and so on.\n\nA year is a leap year (with a 29-day February) when it is divisible by 4 but not by 100, or when it is divisible by 400.",
        [
          { in: "date = \"2019-01-09\"", out: "9" },
          { in: "date = \"2016-12-31\"", out: "366", note: "2016 is a leap year." },
          { in: "date = \"1900-03-01\"", out: "60", note: "1900 is divisible by 100 but not by 400, so its February has 28 days." },
        ],
        ["date.length == 10", "date[4] == date[7] == '-', and all other characters are digits", "date is a valid date between January 1st, 1900 and December 31st, 2019"]),
      hints: [
        "Split the string into year, month and day.",
        "Add up the lengths of the months before the given month, then add the day.",
        "February has 29 days only in leap years: divisible by 4 and not by 100, or divisible by 400.",
      ],
      editorial: explain({
        idea: "The day number is the total length of the earlier months plus the day of the month, with February's length decided by the leap-year rule.",
        steps: [
          "Parse `year = date[0..4]`, `month = date[5..7]`, `day = date[8..10]`.",
          "Use month lengths `[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]`, setting February to 29 in a leap year.",
          "Return `day` plus the sum of the first `month - 1` lengths.",
        ],
        why: "Days are numbered consecutively through the year, so the date falls after every day of the earlier months. The Gregorian leap rule (every 4 years, except centuries not divisible by 400) is exactly what decides February's length.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "1900 is not a leap year, 2000 is — the century rule matters inside this range.",
          "Parsing `\"09\"` with a base-guessing parser can read it as octal; always parse in base 10.",
          "The leap day only shifts dates from March onwards.",
        ],
      }),
      examples: [
        { input: "\"2019-01-09\"", expectedOutput: "9" },
        { input: "\"2016-12-31\"", expectedOutput: "366" },
        { input: "\"1900-03-01\"", expectedOutput: "60" },
      ],
      gen: (rng: Rng) => {
        const y = ri(rng, 0, 3) === 0 ? pick(rng, [1900, 1904, 1996, 2000, 2004, 2016, 2019]) : ri(rng, 1900, 2019);
        const m = ri(rng, 0, 3) === 0 ? pick(rng, [1, 2, 3, 12]) : ri(rng, 1, 12);
        const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const d = ri(rng, 0, 3) === 0 ? pick(rng, [1, maxDay]) : ri(rng, 1, maxDay);
        return { input: `"${y}-${pad(m)}-${pad(d)}"`, expectedOutput: String(ref(y, m, d)) };
      },
      solutions: {
        python: code`
          def dayOfYear(date: str) -> int:
              year, month, day = int(date[:4]), int(date[5:7]), int(date[8:])
              lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
              if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
                  lengths[1] = 29
              return sum(lengths[:month - 1]) + day
        `,
        javascript: code`
          var dayOfYear = function(date) {
              var year = parseInt(date.substring(0, 4), 10);
              var month = parseInt(date.substring(5, 7), 10);
              var day = parseInt(date.substring(8, 10), 10);
              var lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) lengths[1] = 29;
              for (var i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          };
        `,
        typescript: code`
          function dayOfYear(date: string): number {
              var year = parseInt(date.substring(0, 4), 10);
              var month = parseInt(date.substring(5, 7), 10);
              var day = parseInt(date.substring(8, 10), 10);
              var lengths: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) lengths[1] = 29;
              for (var i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          }
        `,
        java: code`
          public static int dayOfYear(String date) {
              int year = Integer.parseInt(date.substring(0, 4));
              int month = Integer.parseInt(date.substring(5, 7));
              int day = Integer.parseInt(date.substring(8, 10));
              int[] lengths = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) lengths[1] = 29;
              for (int i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          }
        `,
        cpp: code`
          int dayOfYear(string date) {
              int year = stoi(date.substr(0, 4));
              int month = stoi(date.substr(5, 2));
              int day = stoi(date.substr(8, 2));
              int lengths[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) lengths[1] = 29;
              for (int i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          }
        `,
        c: code`
          int dayOfYear(const char* date) {
              int year = (date[0] - '0') * 1000 + (date[1] - '0') * 100 + (date[2] - '0') * 10 + (date[3] - '0');
              int month = (date[5] - '0') * 10 + (date[6] - '0');
              int day = (date[8] - '0') * 10 + (date[9] - '0');
              int lengths[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) lengths[1] = 29;
              for (int i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          }
        `,
        csharp: code`
          public static int DayOfYear(string date)
          {
              int year = int.Parse(date.Substring(0, 4));
              int month = int.Parse(date.Substring(5, 2));
              int day = int.Parse(date.Substring(8, 2));
              int[] lengths = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) lengths[1] = 29;
              for (int i = 0; i < month - 1; i++) day += lengths[i];
              return day;
          }
        `,
        go: code`
          func dayOfYear(date string) int {
          	year, _ := strconv.Atoi(date[0:4])
          	month, _ := strconv.Atoi(date[5:7])
          	day, _ := strconv.Atoi(date[8:10])
          	lengths := []int{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
          	if (year%4 == 0 && year%100 != 0) || year%400 == 0 {
          		lengths[1] = 29
          	}
          	for i := 0; i < month-1; i++ {
          		day += lengths[i]
          	}
          	return day
          }
        `,
        kotlin: code`
          fun dayOfYear(date: String): Int {
              val year = date.substring(0, 4).toInt()
              val month = date.substring(5, 7).toInt()
              var day = date.substring(8, 10).toInt()
              val lengths = intArrayOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) lengths[1] = 29
              for (i in 0 until month - 1) day += lengths[i]
              return day
          }
        `,
        swift: code`
          func dayOfYear(_ date: String) -> Int {
              let b = Array(date.utf8).map { Int($0) - 48 }
              let year = b[0] * 1000 + b[1] * 100 + b[2] * 10 + b[3]
              let month = b[5] * 10 + b[6]
              var day = b[8] * 10 + b[9]
              var lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
              if (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 { lengths[1] = 29 }
              var i = 0
              while i < month - 1 {
                  day += lengths[i]
                  i += 1
              }
              return day
          }
        `,
        rust: code`
          fn dayOfYear(date: String) -> i32 {
              let year: i32 = date[0..4].parse().unwrap();
              let month: usize = date[5..7].parse().unwrap();
              let mut day: i32 = date[8..10].parse().unwrap();
              let mut lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              if (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 {
                  lengths[1] = 29;
              }
              for i in 0..month - 1 {
                  day += lengths[i];
              }
              day
          }
        `,
        php: code`
          function dayOfYear($date) {
              $year = intval(substr($date, 0, 4));
              $month = intval(substr($date, 5, 2));
              $day = intval(substr($date, 8, 2));
              $lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              if (($year % 4 == 0 && $year % 100 != 0) || $year % 400 == 0) $lengths[1] = 29;
              for ($i = 0; $i < $month - 1; $i++) $day += $lengths[$i];
              return $day;
          }
        `,
        ruby: code`
          def dayOfYear(date)
            year = date[0, 4].to_i
            month = date[5, 2].to_i
            day = date[8, 2].to_i
            lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            lengths[1] = 29 if (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
            day + lengths[0, month - 1].sum
          end
        `,
      },
    };
  })(),

  // ── Number of Days Between Two Dates (LC 1360) ──────────────────
  (() => {
    const ref = (a: number[], b: number[]) => Math.abs(Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(b[0], b[1] - 1, b[2])) / 86400000;
    const pad = (v: number) => (v < 10 ? "0" : "") + v;
    const fmt = (t: number[]) => `${t[0]}-${pad(t[1])}-${pad(t[2])}`;
    const randDate = (rng: Rng) => {
      const y = ri(rng, 0, 4) === 0 ? pick(rng, [1971, 1972, 2000, 2096, 2099, 2100]) : ri(rng, 1971, 2100);
      const m = ri(rng, 0, 3) === 0 ? pick(rng, [1, 2, 3, 12]) : ri(rng, 1, 12);
      const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const d = ri(rng, 0, 3) === 0 ? pick(rng, [1, maxDay]) : ri(rng, 1, maxDay);
      return [y, m, d];
    };
    return {
      slug: "number-of-days-between-two-dates",
      title: "Number of Days Between Two Dates",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Microsoft", "Amazon"],
      signature: { funcName: "daysBetweenDates", params: [{ name: "date1", type: "string" as const }, { name: "date2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two valid dates `date1` and `date2`, each written as `YYYY-MM-DD`, return the number of days between them — the absolute difference, so the order of the two dates does not matter.\n\nUse the Gregorian calendar: a year is a leap year when it is divisible by 4 but not by 100, or when it is divisible by 400.",
        [
          { in: "date1 = \"2019-06-29\", date2 = \"2019-06-30\"", out: "1" },
          { in: "date1 = \"2020-01-15\", date2 = \"2019-12-31\"", out: "15" },
          { in: "date1 = \"2099-12-31\", date2 = \"2100-03-01\"", out: "60", note: "2100 is not a leap year: 31 days of January, 28 of February, then March 1st." },
        ],
        ["date1 and date2 are valid dates between the years 1971 and 2100 (inclusive)", "Both are written as YYYY-MM-DD"]),
      hints: [
        "Comparing two dates directly is messy. Convert each one to a single number first.",
        "Count the days from a fixed starting point, such as January 1st, 1971, up to each date.",
        "The answer is the absolute difference of the two counts. Remember leap years, including the century rule for 2100.",
      ],
      editorial: explain({
        idea: "Map each date to the number of days since a fixed epoch (1971-01-01); the distance is the absolute difference of the two numbers.",
        steps: [
          "Parse year, month and day from each string.",
          "Count days since the epoch: 365 or 366 for every full year from 1971 to `year - 1`, the lengths of the earlier months of `year` (February 29 days in a leap year), plus `day`.",
          "Return `|count(date1) - count(date2)|`.",
        ],
        why: "Counting from a common origin turns each date into a position on one number line, and the gap between two positions is their difference, independent of which comes first. Summing whole years, then whole months, then days counts each calendar day exactly once.",
        time: "O(Y) for the year loop (at most 130 years); O(1) with a closed-form leap count",
        space: "O(1)",
        pitfalls: [
          "2100 is not a leap year, 2000 is.",
          "Forgetting the absolute value when `date1` is later than `date2`.",
          "Off-by-one when converting: count both dates the same way and the offsets cancel.",
        ],
      }),
      examples: [
        { input: "\"2019-06-29\"\n\"2019-06-30\"", expectedOutput: "1" },
        { input: "\"2020-01-15\"\n\"2019-12-31\"", expectedOutput: "15" },
        { input: "\"2099-12-31\"\n\"2100-03-01\"", expectedOutput: "60" },
      ],
      gen: (rng: Rng) => {
        const a = randDate(rng);
        let b: number[];
        const shape = ri(rng, 0, 9);
        if (shape === 0) b = a.slice();
        else if (shape <= 3) {
          const t = new Date(Date.UTC(a[0], a[1] - 1, a[2]) + ri(rng, -400, 400) * 86400000);
          b = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
          if (b[0] < 1971 || b[0] > 2100) b = a.slice();
        } else b = randDate(rng);
        return { input: `"${fmt(a)}"\n"${fmt(b)}"`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          def daysBetweenDates(date1: str, date2: str) -> int:
              def is_leap(y: int) -> bool:
                  return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0

              def days_since_epoch(date: str) -> int:
                  year, month, day = int(date[:4]), int(date[5:7]), int(date[8:])
                  lengths = [31, 29 if is_leap(year) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
                  total = day
                  for y in range(1971, year):
                      total += 366 if is_leap(y) else 365
                  return total + sum(lengths[:month - 1])

              return abs(days_since_epoch(date1) - days_since_epoch(date2))
        `,
        javascript: code`
          var daysBetweenDates = function(date1, date2) {
              var isLeap = function(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
              var count = function(date) {
                  var year = parseInt(date.substring(0, 4), 10);
                  var month = parseInt(date.substring(5, 7), 10);
                  var total = parseInt(date.substring(8, 10), 10);
                  var lengths = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  for (var y = 1971; y < year; y++) total += isLeap(y) ? 366 : 365;
                  for (var m = 0; m < month - 1; m++) total += lengths[m];
                  return total;
              };
              return Math.abs(count(date1) - count(date2));
          };
        `,
        typescript: code`
          function daysBetweenDates(date1: string, date2: string): number {
              var isLeap = function(y: number): boolean { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
              var count = function(date: string): number {
                  var year = parseInt(date.substring(0, 4), 10);
                  var month = parseInt(date.substring(5, 7), 10);
                  var total = parseInt(date.substring(8, 10), 10);
                  var lengths: number[] = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  for (var y = 1971; y < year; y++) total += isLeap(y) ? 366 : 365;
                  for (var m = 0; m < month - 1; m++) total += lengths[m];
                  return total;
              };
              return Math.abs(count(date1) - count(date2));
          }
        `,
        java: code`
          static boolean dbIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          static int dbCount(String date) {
              int year = Integer.parseInt(date.substring(0, 4));
              int month = Integer.parseInt(date.substring(5, 7));
              int total = Integer.parseInt(date.substring(8, 10));
              int[] lengths = {31, dbIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              for (int y = 1971; y < year; y++) total += dbIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return total;
          }

          public static int daysBetweenDates(String date1, String date2) {
              return Math.abs(dbCount(date1) - dbCount(date2));
          }
        `,
        cpp: code`
          static bool dbIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          static int dbCount(const string& date) {
              int year = stoi(date.substr(0, 4));
              int month = stoi(date.substr(5, 2));
              int total = stoi(date.substr(8, 2));
              int lengths[12] = {31, dbIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              for (int y = 1971; y < year; y++) total += dbIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return total;
          }

          int daysBetweenDates(string date1, string date2) {
              return abs(dbCount(date1) - dbCount(date2));
          }
        `,
        c: code`
          static bool dbIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          static int dbCount(const char* date) {
              int year = (date[0] - '0') * 1000 + (date[1] - '0') * 100 + (date[2] - '0') * 10 + (date[3] - '0');
              int month = (date[5] - '0') * 10 + (date[6] - '0');
              int total = (date[8] - '0') * 10 + (date[9] - '0');
              int lengths[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              if (dbIsLeap(year)) lengths[1] = 29;
              for (int y = 1971; y < year; y++) total += dbIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return total;
          }

          int daysBetweenDates(const char* date1, const char* date2) {
              int d = dbCount(date1) - dbCount(date2);
              return d < 0 ? -d : d;
          }
        `,
        csharp: code`
          static bool DbIsLeap(int y)
          {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          static int DbCount(string date)
          {
              int year = int.Parse(date.Substring(0, 4));
              int month = int.Parse(date.Substring(5, 2));
              int total = int.Parse(date.Substring(8, 2));
              int[] lengths = { 31, DbIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
              for (int y = 1971; y < year; y++) total += DbIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return total;
          }

          public static int DaysBetweenDates(string date1, string date2)
          {
              return Math.Abs(DbCount(date1) - DbCount(date2));
          }
        `,
        go: code`
          func dbIsLeap(y int) bool {
          	return (y%4 == 0 && y%100 != 0) || y%400 == 0
          }

          func dbCount(date string) int {
          	year, _ := strconv.Atoi(date[0:4])
          	month, _ := strconv.Atoi(date[5:7])
          	total, _ := strconv.Atoi(date[8:10])
          	lengths := []int{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
          	if dbIsLeap(year) {
          		lengths[1] = 29
          	}
          	for y := 1971; y < year; y++ {
          		if dbIsLeap(y) {
          			total += 366
          		} else {
          			total += 365
          		}
          	}
          	for m := 0; m < month-1; m++ {
          		total += lengths[m]
          	}
          	return total
          }

          func daysBetweenDates(date1 string, date2 string) int {
          	d := dbCount(date1) - dbCount(date2)
          	if d < 0 {
          		return -d
          	}
          	return d
          }
        `,
        kotlin: code`
          fun dbIsLeap(y: Int): Boolean = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0

          fun dbCount(date: String): Int {
              val year = date.substring(0, 4).toInt()
              val month = date.substring(5, 7).toInt()
              var total = date.substring(8, 10).toInt()
              val lengths = intArrayOf(31, if (dbIsLeap(year)) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
              for (y in 1971 until year) total += if (dbIsLeap(y)) 366 else 365
              for (m in 0 until month - 1) total += lengths[m]
              return total
          }

          fun daysBetweenDates(date1: String, date2: String): Int {
              return Math.abs(dbCount(date1) - dbCount(date2))
          }
        `,
        swift: code`
          func dbIsLeap(_ y: Int) -> Bool {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
          }

          func dbCount(_ date: String) -> Int {
              let b = Array(date.utf8).map { Int($0) - 48 }
              let year = b[0] * 1000 + b[1] * 100 + b[2] * 10 + b[3]
              let month = b[5] * 10 + b[6]
              var total = b[8] * 10 + b[9]
              let lengths = [31, dbIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
              var y = 1971
              while y < year {
                  total += dbIsLeap(y) ? 366 : 365
                  y += 1
              }
              var m = 0
              while m < month - 1 {
                  total += lengths[m]
                  m += 1
              }
              return total
          }

          func daysBetweenDates(_ date1: String, _ date2: String) -> Int {
              return abs(dbCount(date1) - dbCount(date2))
          }
        `,
        rust: code`
          fn db_is_leap(y: i32) -> bool {
              (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
          }

          fn db_count(date: &str) -> i32 {
              let year: i32 = date[0..4].parse().unwrap();
              let month: usize = date[5..7].parse().unwrap();
              let mut total: i32 = date[8..10].parse().unwrap();
              let lengths = [31, if db_is_leap(year) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              for y in 1971..year {
                  total += if db_is_leap(y) { 366 } else { 365 };
              }
              for m in 0..month - 1 {
                  total += lengths[m];
              }
              total
          }

          fn daysBetweenDates(date1: String, date2: String) -> i32 {
              (db_count(&date1) - db_count(&date2)).abs()
          }
        `,
        php: code`
          function dbIsLeap($y) {
              return ($y % 4 == 0 && $y % 100 != 0) || $y % 400 == 0;
          }

          function dbCount($date) {
              $year = intval(substr($date, 0, 4));
              $month = intval(substr($date, 5, 2));
              $total = intval(substr($date, 8, 2));
              $lengths = [31, dbIsLeap($year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              for ($y = 1971; $y < $year; $y++) $total += dbIsLeap($y) ? 366 : 365;
              for ($m = 0; $m < $month - 1; $m++) $total += $lengths[$m];
              return $total;
          }

          function daysBetweenDates($date1, $date2) {
              return abs(dbCount($date1) - dbCount($date2));
          }
        `,
        ruby: code`
          def db_leap?(y)
            (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
          end

          def db_count(date)
            year = date[0, 4].to_i
            month = date[5, 2].to_i
            total = date[8, 2].to_i
            lengths = [31, db_leap?(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            (1971...year).each { |y| total += db_leap?(y) ? 366 : 365 }
            total + lengths[0, month - 1].sum
          end

          def daysBetweenDates(date1, date2)
            (db_count(date1) - db_count(date2)).abs
          end
        `,
      },
    };
  })(),

  // ── Day of the Week (LC 1185) ───────────────────────────────────
  (() => {
    const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const ref = (day: number, month: number, year: number) => NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return {
      slug: "day-of-the-week",
      title: "Day of the Week",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Microsoft"],
      signature: {
        funcName: "dayOfTheWeek",
        params: [{ name: "day", type: "int" as const }, { name: "month", type: "int" as const }, { name: "year", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "Given a valid date as three integers `day`, `month` and `year`, return the day of the week it falls on, as one of:\n\n`\"Sunday\"`, `\"Monday\"`, `\"Tuesday\"`, `\"Wednesday\"`, `\"Thursday\"`, `\"Friday\"`, `\"Saturday\"`.\n\nUse the Gregorian calendar (leap years are divisible by 4 but not by 100, or divisible by 400). As an anchor, January 1st, 1971 was a Friday.",
        [
          { in: "day = 31, month = 8, year = 2019", out: "Saturday" },
          { in: "day = 18, month = 7, year = 1999", out: "Sunday" },
          { in: "day = 15, month = 8, year = 1993", out: "Sunday" },
        ],
        ["The date is valid and lies between the years 1971 and 2100 (inclusive)"]),
      hints: [
        "Weekdays repeat every 7 days, so you only need the number of days between the given date and a date whose weekday you know.",
        "January 1st, 1971 was a Friday. Count the days from it: whole years (365 or 366), then whole months of the given year, then the day.",
        "Take that count modulo 7 and step forward from Friday.",
      ],
      editorial: explain({
        idea: "Count the days elapsed since a known Friday (1971-01-01) and reduce modulo 7.",
        steps: [
          "Let `total = day - 1`.",
          "Add 365 or 366 for each year from 1971 up to `year - 1`.",
          "Add the lengths of the months before `month` in `year` (February has 29 days in a leap year).",
          "With the names listed from Sunday (index 0), return `names[(5 + total) % 7]` — Friday is index 5.",
        ],
        why: "`total` is exactly the number of days from 1971-01-01 to the given date, and every 7 days the weekday returns to the same value, so the weekday is Friday shifted by `total mod 7`.",
        time: "O(year − 1971)",
        space: "O(1)",
        pitfalls: [
          "Starting `total` at `day` instead of `day - 1` shifts every answer by one weekday.",
          "The century rule: 2000 is a leap year, 2100 is not.",
          "Zeller's congruence also works but is easy to get wrong for January and February, which it treats as months 13 and 14 of the previous year.",
        ],
      }),
      examples: [
        { input: "31\n8\n2019", expectedOutput: "Saturday" },
        { input: "18\n7\n1999", expectedOutput: "Sunday" },
        { input: "15\n8\n1993", expectedOutput: "Sunday" },
      ],
      gen: (rng: Rng) => {
        const year = ri(rng, 0, 4) === 0 ? pick(rng, [1971, 1972, 2000, 2096, 2100]) : ri(rng, 1971, 2100);
        const month = ri(rng, 0, 3) === 0 ? pick(rng, [1, 2, 3, 12]) : ri(rng, 1, 12);
        const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const day = ri(rng, 0, 3) === 0 ? pick(rng, [1, maxDay]) : ri(rng, 1, maxDay);
        return { input: `${day}\n${month}\n${year}`, expectedOutput: ref(day, month, year) };
      },
      solutions: {
        python: code`
          def dayOfTheWeek(day: int, month: int, year: int) -> str:
              names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

              def is_leap(y: int) -> bool:
                  return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0

              lengths = [31, 29 if is_leap(year) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
              total = day - 1
              for y in range(1971, year):
                  total += 366 if is_leap(y) else 365
              total += sum(lengths[:month - 1])
              return names[(5 + total) % 7]
        `,
        javascript: code`
          var dayOfTheWeek = function(day, month, year) {
              var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              var isLeap = function(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
              var lengths = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              var total = day - 1;
              for (var y = 1971; y < year; y++) total += isLeap(y) ? 366 : 365;
              for (var m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          };
        `,
        typescript: code`
          function dayOfTheWeek(day: number, month: number, year: number): string {
              var names: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              var isLeap = function(y: number): boolean { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
              var lengths: number[] = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              var total = day - 1;
              for (var y = 1971; y < year; y++) total += isLeap(y) ? 366 : 365;
              for (var m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          }
        `,
        java: code`
          static boolean dwIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          public static String dayOfTheWeek(int day, int month, int year) {
              String[] names = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
              int[] lengths = {31, dwIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              int total = day - 1;
              for (int y = 1971; y < year; y++) total += dwIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          }
        `,
        cpp: code`
          static bool dwIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          string dayOfTheWeek(int day, int month, int year) {
              static const string names[7] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
              int lengths[12] = {31, dwIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              int total = day - 1;
              for (int y = 1971; y < year; y++) total += dwIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          }
        `,
        c: code`
          static bool dwIsLeap(int y) {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          char* dayOfTheWeek(int day, int month, int year) {
              static char* names[7] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
              int lengths[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
              if (dwIsLeap(year)) lengths[1] = 29;
              int total = day - 1;
              for (int y = 1971; y < year; y++) total += dwIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          }
        `,
        csharp: code`
          static bool DwIsLeap(int y)
          {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
          }

          public static string DayOfTheWeek(int day, int month, int year)
          {
              string[] names = { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
              int[] lengths = { 31, DwIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
              int total = day - 1;
              for (int y = 1971; y < year; y++) total += DwIsLeap(y) ? 366 : 365;
              for (int m = 0; m < month - 1; m++) total += lengths[m];
              return names[(5 + total) % 7];
          }
        `,
        go: code`
          func dwIsLeap(y int) bool {
          	return (y%4 == 0 && y%100 != 0) || y%400 == 0
          }

          func dayOfTheWeek(day int, month int, year int) string {
          	names := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
          	lengths := []int{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
          	if dwIsLeap(year) {
          		lengths[1] = 29
          	}
          	total := day - 1
          	for y := 1971; y < year; y++ {
          		if dwIsLeap(y) {
          			total += 366
          		} else {
          			total += 365
          		}
          	}
          	for m := 0; m < month-1; m++ {
          		total += lengths[m]
          	}
          	return names[(5+total)%7]
          }
        `,
        kotlin: code`
          fun dwIsLeap(y: Int): Boolean = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0

          fun dayOfTheWeek(day: Int, month: Int, year: Int): String {
              val names = arrayOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              val lengths = intArrayOf(31, if (dwIsLeap(year)) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
              var total = day - 1
              for (y in 1971 until year) total += if (dwIsLeap(y)) 366 else 365
              for (m in 0 until month - 1) total += lengths[m]
              return names[(5 + total) % 7]
          }
        `,
        swift: code`
          func dwIsLeap(_ y: Int) -> Bool {
              return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
          }

          func dayOfTheWeek(_ day: Int, _ month: Int, _ year: Int) -> String {
              let names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
              let lengths = [31, dwIsLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
              var total = day - 1
              var y = 1971
              while y < year {
                  total += dwIsLeap(y) ? 366 : 365
                  y += 1
              }
              var m = 0
              while m < month - 1 {
                  total += lengths[m]
                  m += 1
              }
              return names[(5 + total) % 7]
          }
        `,
        rust: code`
          fn dw_is_leap(y: i32) -> bool {
              (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
          }

          fn dayOfTheWeek(day: i32, month: i32, year: i32) -> String {
              let names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              let lengths = [31, if dw_is_leap(year) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              let mut total = day - 1;
              for y in 1971..year {
                  total += if dw_is_leap(y) { 366 } else { 365 };
              }
              for m in 0..(month - 1) as usize {
                  total += lengths[m];
              }
              names[((5 + total) % 7) as usize].to_string()
          }
        `,
        php: code`
          function dwIsLeap($y) {
              return ($y % 4 == 0 && $y % 100 != 0) || $y % 400 == 0;
          }

          function dayOfTheWeek($day, $month, $year) {
              $names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              $lengths = [31, dwIsLeap($year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              $total = $day - 1;
              for ($y = 1971; $y < $year; $y++) $total += dwIsLeap($y) ? 366 : 365;
              for ($m = 0; $m < $month - 1; $m++) $total += $lengths[$m];
              return $names[(5 + $total) % 7];
          }
        `,
        ruby: code`
          def dayOfTheWeek(day, month, year)
            names = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday]
            leap = ->(y) { (y % 4 == 0 && y % 100 != 0) || y % 400 == 0 }
            lengths = [31, leap.call(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            total = day - 1
            (1971...year).each { |y| total += leap.call(y) ? 366 : 365 }
            total += lengths[0, month - 1].sum
            names[(5 + total) % 7]
          end
        `,
      },
    };
  })(),

  // ── Prime Arrangements (LC 1175) ────────────────────────────────
  (() => {
    // Reference with exact BigInt factorials.
    const ref = (n: number) => {
      let primes = 0;
      for (let x = 2; x <= n; x++) {
        let ok = true;
        for (let d = 2; d < x; d++) if (x % d === 0) { ok = false; break; }
        if (ok) primes++;
      }
      const fact = (m: number) => { let f = BigInt(1); for (let i = 2; i <= m; i++) f *= BigInt(i); return f; };
      return Number((fact(primes) * fact(n - primes)) % BigInt(1000000007));
    };
    return {
      slug: "prime-arrangements",
      title: "Prime Arrangements",
      difficulty: "EASY" as const,
      tags: ["Math", "Combinatorics", "Amazon", "Google"],
      signature: { funcName: "numPrimeArrangements", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the permutations of the numbers `1` to `n` in which every **prime** number sits at a **prime** position (positions are numbered from 1).\n\nA prime is an integer greater than 1 whose only positive divisors are 1 and itself.\n\nThe count can be huge, so return it modulo `10^9 + 7`.",
        [
          { in: "n = 5", out: "12", note: "The primes 2, 3, 5 must fill positions 2, 3, 5 (3! ways) and 1, 4 fill positions 1, 4 (2! ways): 6 × 2 = 12. For example [1,2,5,4,3] is valid, [5,2,3,4,1] is not (5 sits at position 1)." },
          { in: "n = 100", out: "682289015" },
          { in: "n = 1", out: "1" },
        ],
        ["1 <= n <= 100"]),
      hints: [
        "If the primes must occupy prime positions, what must the non-primes occupy?",
        "There are exactly as many prime positions as prime values, so the primes fill the prime positions and the non-primes fill the rest — independently.",
        "With `p` primes up to `n`, the answer is `p! * (n - p)!` modulo 10^9 + 7.",
      ],
      editorial: explain({
        idea: "Primes and prime positions are equinumerous, so a valid permutation is a permutation of the primes among the prime positions times a permutation of the rest: `p! · (n − p)!`.",
        steps: [
          "Count the primes `p` in `[1, n]` (trial division or a sieve).",
          "Multiply `1 · 2 · … · p` and `1 · 2 · … · (n − p)` together, reducing modulo `10^9 + 7` after each multiplication.",
          "Return the product.",
        ],
        why: "The `p` prime values must go to prime positions, and there are exactly `p` prime positions in `1..n`, so the primes fill them exactly and the `n − p` other values fill the other positions. Any arrangement of each group works, and the choices are independent, so the count is the product of the two factorials.",
        time: "O(n √n) for the prime count (O(n log log n) with a sieve)",
        space: "O(1)",
        pitfalls: [
          "1 is not prime, so position 1 is a non-prime position.",
          "Reduce after every multiplication: 25! already overflows 64 bits.",
          "In 32-bit arithmetic `product * i` overflows before the modulo — use a 64-bit accumulator.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "12" },
        { input: "100", expectedOutput: "682289015" },
        { input: "1", expectedOutput: "1" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 4) === 0 ? pick(rng, [1, 2, 3, 4, 97, 99, 100]) : ri(rng, 1, 100);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def numPrimeArrangements(n: int) -> int:
              MOD = 10 ** 9 + 7
              primes = 0
              for x in range(2, n + 1):
                  d = 2
                  while d * d <= x and x % d != 0:
                      d += 1
                  if d * d > x:
                      primes += 1
              result = 1
              for i in range(2, primes + 1):
                  result = result * i % MOD
              for i in range(2, n - primes + 1):
                  result = result * i % MOD
              return result
        `,
        javascript: code`
          var numPrimeArrangements = function(n) {
              var MOD = 1000000007;
              var primes = 0;
              for (var x = 2; x <= n; x++) {
                  var d = 2;
                  while (d * d <= x && x % d !== 0) d++;
                  if (d * d > x) primes++;
              }
              var result = 1;
              for (var i = 2; i <= primes; i++) result = (result * i) % MOD;
              for (var j = 2; j <= n - primes; j++) result = (result * j) % MOD;
              return result;
          };
        `,
        typescript: code`
          function numPrimeArrangements(n: number): number {
              var MOD = 1000000007;
              var primes = 0;
              for (var x = 2; x <= n; x++) {
                  var d = 2;
                  while (d * d <= x && x % d !== 0) d++;
                  if (d * d > x) primes++;
              }
              var result = 1;
              for (var i = 2; i <= primes; i++) result = (result * i) % MOD;
              for (var j = 2; j <= n - primes; j++) result = (result * j) % MOD;
              return result;
          }
        `,
        java: code`
          public static int numPrimeArrangements(int n) {
              final long MOD = 1000000007L;
              int primes = 0;
              for (int x = 2; x <= n; x++) {
                  int d = 2;
                  while (d * d <= x && x % d != 0) d++;
                  if (d * d > x) primes++;
              }
              long result = 1;
              for (int i = 2; i <= primes; i++) result = result * i % MOD;
              for (int i = 2; i <= n - primes; i++) result = result * i % MOD;
              return (int) result;
          }
        `,
        cpp: code`
          int numPrimeArrangements(int n) {
              const long long MOD = 1000000007LL;
              int primes = 0;
              for (int x = 2; x <= n; x++) {
                  int d = 2;
                  while (d * d <= x && x % d != 0) d++;
                  if (d * d > x) primes++;
              }
              long long result = 1;
              for (int i = 2; i <= primes; i++) result = result * i % MOD;
              for (int i = 2; i <= n - primes; i++) result = result * i % MOD;
              return (int)result;
          }
        `,
        c: code`
          int numPrimeArrangements(int n) {
              const long long MOD = 1000000007LL;
              int primes = 0;
              for (int x = 2; x <= n; x++) {
                  int d = 2;
                  while (d * d <= x && x % d != 0) d++;
                  if (d * d > x) primes++;
              }
              long long result = 1;
              for (int i = 2; i <= primes; i++) result = result * i % MOD;
              for (int i = 2; i <= n - primes; i++) result = result * i % MOD;
              return (int)result;
          }
        `,
        csharp: code`
          public static int NumPrimeArrangements(int n)
          {
              const long MOD = 1000000007L;
              int primes = 0;
              for (int x = 2; x <= n; x++)
              {
                  int d = 2;
                  while (d * d <= x && x % d != 0) d++;
                  if (d * d > x) primes++;
              }
              long result = 1;
              for (int i = 2; i <= primes; i++) result = result * i % MOD;
              for (int i = 2; i <= n - primes; i++) result = result * i % MOD;
              return (int)result;
          }
        `,
        go: code`
          func numPrimeArrangements(n int) int {
          	const MOD = 1000000007
          	primes := 0
          	for x := 2; x <= n; x++ {
          		d := 2
          		for d*d <= x && x%d != 0 {
          			d++
          		}
          		if d*d > x {
          			primes++
          		}
          	}
          	result := 1
          	for i := 2; i <= primes; i++ {
          		result = result * i % MOD
          	}
          	for i := 2; i <= n-primes; i++ {
          		result = result * i % MOD
          	}
          	return result
          }
        `,
        kotlin: code`
          fun numPrimeArrangements(n: Int): Int {
              val MOD = 1000000007L
              var primes = 0
              for (x in 2..n) {
                  var d = 2
                  while (d * d <= x && x % d != 0) d++
                  if (d * d > x) primes++
              }
              var result = 1L
              for (i in 2..primes) result = result * i % MOD
              for (i in 2..(n - primes)) result = result * i % MOD
              return result.toInt()
          }
        `,
        swift: code`
          func numPrimeArrangements(_ n: Int) -> Int {
              let MOD = 1000000007
              var primes = 0
              var x = 2
              while x <= n {
                  var d = 2
                  while d * d <= x && x % d != 0 { d += 1 }
                  if d * d > x { primes += 1 }
                  x += 1
              }
              var result = 1
              var i = 2
              while i <= primes {
                  result = result * i % MOD
                  i += 1
              }
              i = 2
              while i <= n - primes {
                  result = result * i % MOD
                  i += 1
              }
              return result
          }
        `,
        rust: code`
          fn numPrimeArrangements(n: i32) -> i32 {
              const MOD: i64 = 1000000007;
              let mut primes: i64 = 0;
              for x in 2..=n {
                  let mut d = 2;
                  while d * d <= x && x % d != 0 {
                      d += 1;
                  }
                  if d * d > x {
                      primes += 1;
                  }
              }
              let mut result: i64 = 1;
              for i in 2..=primes {
                  result = result * i % MOD;
              }
              for i in 2..=(n as i64 - primes) {
                  result = result * i % MOD;
              }
              result as i32
          }
        `,
        php: code`
          function numPrimeArrangements($n) {
              $MOD = 1000000007;
              $primes = 0;
              for ($x = 2; $x <= $n; $x++) {
                  $d = 2;
                  while ($d * $d <= $x && $x % $d != 0) $d++;
                  if ($d * $d > $x) $primes++;
              }
              $result = 1;
              for ($i = 2; $i <= $primes; $i++) $result = $result * $i % $MOD;
              for ($i = 2; $i <= $n - $primes; $i++) $result = $result * $i % $MOD;
              return $result;
          }
        `,
        ruby: code`
          def numPrimeArrangements(n)
            mod = 1_000_000_007
            primes = (2..n).count { |x| (2..Math.sqrt(x).to_i).none? { |d| x % d == 0 } }
            result = 1
            (2..primes).each { |i| result = result * i % mod }
            (2..(n - primes)).each { |i| result = result * i % mod }
            result
          end
        `,
      },
    };
  })(),

  // ── Ugly Number III (LC 1201) ───────────────────────────────────
  (() => {
    // Brute force for small answers: walk the integers. Large answers use an
    // exact BigInt inclusion–exclusion count with a binary search (checked
    // against the walk on every small case).
    const walk = (n: number, a: number, b: number, c: number) => {
      let seen = 0;
      for (let x = 1; ; x++) if (x % a === 0 || x % b === 0 || x % c === 0) { if (++seen === n) return x; }
    };
    const gcdB = (x: bigint, y: bigint): bigint => { while (y !== BigInt(0)) { const t = x % y; x = y; y = t; } return x; };
    const lcmB = (x: bigint, y: bigint) => (x / gcdB(x, y)) * y;
    const countB = (x: bigint, a: bigint, b: bigint, c: bigint) =>
      x / a + x / b + x / c - x / lcmB(a, b) - x / lcmB(a, c) - x / lcmB(b, c) + x / lcmB(lcmB(a, b), c);
    const bySearch = (n: number, a: number, b: number, c: number) => {
      const A = BigInt(a), B = BigInt(b), C = BigInt(c), N = BigInt(n);
      let lo = BigInt(1), hi = BigInt(2000000000);
      while (lo < hi) {
        const mid = (lo + hi) / BigInt(2);
        if (countB(mid, A, B, C) >= N) hi = mid; else lo = mid + BigInt(1);
      }
      return Number(lo);
    };
    const ref = (n: number, a: number, b: number, c: number) => {
      const r = bySearch(n, a, b, c);
      if (r <= 30000 && walk(n, a, b, c) !== r) throw new Error(`ugly-number-iii: mismatch ${n} ${a} ${b} ${c}`);
      return r;
    };
    const maxN = (a: number, b: number, c: number) => Number(countB(BigInt(2000000000), BigInt(a), BigInt(b), BigInt(c)));
    return {
      slug: "ugly-number-iii",
      title: "Ugly Number III",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Binary Search", "Number Theory", "Combinatorics", "Amazon", "Google"],
      signature: {
        funcName: "nthUglyNumber",
        params: [{ name: "n", type: "int" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "c", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Call a positive integer **ugly** if it is divisible by `a`, by `b` or by `c` (at least one of them).\n\nReturn the `n`-th ugly number, counting from 1 in increasing order.",
        [
          { in: "n = 3, a = 2, b = 3, c = 5", out: "4", note: "The ugly numbers are 2, 3, 4, 5, 6, 8, 9, 10, … and the third is 4." },
          { in: "n = 4, a = 2, b = 3, c = 4", out: "6", note: "2, 3, 4, 6, 8, 9, … — 4 and 8 are counted once even though both 2 and 4 divide them." },
          { in: "n = 5, a = 2, b = 11, c = 13", out: "10", note: "2, 4, 6, 8, 10, …" },
        ],
        ["1 <= n, a, b, c <= 10^9", "1 <= a * b * c <= 10^18", "The answer lies in [1, 2 * 10^9]"]),
      hints: [
        "Generating the ugly numbers one by one can take 10^9 steps. Can you instead count how many ugly numbers are at most some value `x`?",
        "By inclusion–exclusion that count is `x/a + x/b + x/c - x/lcm(a,b) - x/lcm(a,c) - x/lcm(b,c) + x/lcm(a,b,c)` (integer divisions).",
        "The count never decreases as `x` grows, so binary search for the smallest `x` whose count reaches `n`. Watch the lcms: they can exceed 64 bits only if you let them — cap them above 2 * 10^9.",
      ],
      editorial: explain({
        idea: "Binary search on the answer, counting ugly numbers up to `x` with inclusion–exclusion over the three divisors.",
        steps: [
          "Precompute `lcm(a,b)`, `lcm(a,c)`, `lcm(b,c)` and `lcm(a,b,c)` using `lcm(x,y) = x / gcd(x,y) * y`; any lcm above `2·10^9` can be replaced by a cap just above that, since it divides no candidate.",
          "Define `count(x)` = `x/a + x/b + x/c − x/lcm(a,b) − x/lcm(a,c) − x/lcm(b,c) + x/lcm(a,b,c)`.",
          "Binary search `x` in `[1, 2·10^9]` for the smallest value with `count(x) >= n`, using 64-bit arithmetic.",
          "Return that `x`.",
        ],
        why: "`count(x)` is the size of the union of the multiples of `a`, `b` and `c` up to `x`; inclusion–exclusion adds the three sets, removes the pairwise overlaps (multiples of the pairwise lcms) and adds back the triple overlap. The count is non-decreasing and jumps by one exactly at each ugly number, so the smallest `x` with `count(x) >= n` is itself ugly and is the `n`-th one.",
        time: "O(log(2·10^9)) ≈ 31 steps, plus O(log) for the gcds",
        space: "O(1)",
        pitfalls: [
          "`lcm(a, b, c)` can reach 10^18 and `lcm(a,b) * c` can overflow 64 bits — cap each lcm once it exceeds the search range.",
          "Using the smallest `x` with `count(x) == n` can land on a non-ugly number; search for `>= n` and take the lower bound.",
          "`lo + hi` exceeds 2^31 near the top of the range; use 64-bit integers in the search.",
        ],
      }),
      examples: [
        { input: "3\n2\n3\n5", expectedOutput: "4" },
        { input: "4\n2\n3\n4", expectedOutput: "6" },
        { input: "5\n2\n11\n13", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let a: number, b: number, c: number;
        if (shape < 4) { a = ri(rng, 1, 30); b = ri(rng, 1, 30); c = ri(rng, 1, 30); }
        else if (shape < 6) { a = ri(rng, 1, 100000); b = ri(rng, 1, 100000); c = ri(rng, 1, 100); }
        else if (shape < 8) {
          a = ri(rng, 1, 1000000000); b = ri(rng, 1, 1000000000);
          const room = Number(BigInt("1000000000000000000") / (BigInt(a) * BigInt(b)));
          c = ri(rng, 1, Math.max(1, Math.min(1000000000, room)));
        } else if (shape === 8) { a = ri(rng, 2, 50); b = a * ri(rng, 1, 5); c = pick(rng, [a, b, ri(rng, 1, 50)]); }
        else {
          a = pick(rng, [1, 2, 1000000000]); b = pick(rng, [1, 3, 999999999]); c = pick(rng, [1, 5, 7]);
          if (BigInt(a) * BigInt(b) * BigInt(c) > BigInt("1000000000000000000")) c = 1;
        }
        const limit = Math.min(1000000000, maxN(a, b, c));
        let n: number;
        if (shape < 4) n = ri(rng, 1, Math.min(limit, 1000));
        else n = ri(rng, 0, 2) === 0 ? limit : ri(rng, 1, limit);
        return { input: `${n}\n${a}\n${b}\n${c}`, expectedOutput: String(ref(n, a, b, c)) };
      },
      solutions: {
        python: code`
          from math import gcd

          def nthUglyNumber(n: int, a: int, b: int, c: int) -> int:
              def lcm(x: int, y: int) -> int:
                  return x // gcd(x, y) * y

              ab, ac, bc = lcm(a, b), lcm(a, c), lcm(b, c)
              abc = lcm(ab, c)

              def count(x: int) -> int:
                  return x // a + x // b + x // c - x // ab - x // ac - x // bc + x // abc

              lo, hi = 1, 2 * 10 ** 9
              while lo < hi:
                  mid = (lo + hi) // 2
                  if count(mid) >= n:
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var nthUglyNumber = function(n, a, b, c) {
              var CAP = 2000000001;
              var gcd = function(x, y) {
                  while (y !== 0) {
                      var t = x % y;
                      x = y;
                      y = t;
                  }
                  return x;
              };
              var lcm = function(x, y) {
                  var l = x / gcd(x, y) * y;
                  return l > 2000000000 ? CAP : l;
              };
              var ab = lcm(a, b), ac = lcm(a, c), bc = lcm(b, c), abc = lcm(ab, c);
              var count = function(x) {
                  return Math.floor(x / a) + Math.floor(x / b) + Math.floor(x / c)
                      - Math.floor(x / ab) - Math.floor(x / ac) - Math.floor(x / bc) + Math.floor(x / abc);
              };
              var lo = 1, hi = 2000000000;
              while (lo < hi) {
                  var mid = Math.floor((lo + hi) / 2);
                  if (count(mid) >= n) hi = mid;
                  else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function nthUglyNumber(n: number, a: number, b: number, c: number): number {
              var CAP = 2000000001;
              var gcd = function(x: number, y: number): number {
                  while (y !== 0) {
                      var t = x % y;
                      x = y;
                      y = t;
                  }
                  return x;
              };
              var lcm = function(x: number, y: number): number {
                  var l = x / gcd(x, y) * y;
                  return l > 2000000000 ? CAP : l;
              };
              var ab = lcm(a, b), ac = lcm(a, c), bc = lcm(b, c), abc = lcm(ab, c);
              var count = function(x: number): number {
                  return Math.floor(x / a) + Math.floor(x / b) + Math.floor(x / c)
                      - Math.floor(x / ab) - Math.floor(x / ac) - Math.floor(x / bc) + Math.floor(x / abc);
              };
              var lo = 1, hi = 2000000000;
              while (lo < hi) {
                  var mid = Math.floor((lo + hi) / 2);
                  if (count(mid) >= n) hi = mid;
                  else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          static long unGcd(long x, long y) {
              while (y != 0) {
                  long t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          static long unLcm(long x, long y) {
              long l = x / unGcd(x, y) * y;
              return l > 2000000000L ? 2000000001L : l;
          }

          public static int nthUglyNumber(int n, int a, int b, int c) {
              long ab = unLcm(a, b), ac = unLcm(a, c), bc = unLcm(b, c), abc = unLcm(ab, c);
              long lo = 1, hi = 2000000000L;
              while (lo < hi) {
                  long mid = (lo + hi) / 2;
                  long cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc;
                  if (cnt >= n) hi = mid;
                  else lo = mid + 1;
              }
              return (int) lo;
          }
        `,
        cpp: code`
          static long long unGcd(long long x, long long y) {
              while (y != 0) {
                  long long t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          static long long unLcm(long long x, long long y) {
              long long l = x / unGcd(x, y) * y;
              return l > 2000000000LL ? 2000000001LL : l;
          }

          int nthUglyNumber(int n, int a, int b, int c) {
              long long ab = unLcm(a, b), ac = unLcm(a, c), bc = unLcm(b, c), abc = unLcm(ab, c);
              long long lo = 1, hi = 2000000000LL;
              while (lo < hi) {
                  long long mid = (lo + hi) / 2;
                  long long cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc;
                  if (cnt >= n) hi = mid;
                  else lo = mid + 1;
              }
              return (int)lo;
          }
        `,
        c: code`
          static long long unGcd(long long x, long long y) {
              while (y != 0) {
                  long long t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          static long long unLcm(long long x, long long y) {
              long long l = x / unGcd(x, y) * y;
              return l > 2000000000LL ? 2000000001LL : l;
          }

          int nthUglyNumber(int n, int a, int b, int c) {
              long long ab = unLcm(a, b), ac = unLcm(a, c), bc = unLcm(b, c), abc = unLcm(ab, c);
              long long lo = 1, hi = 2000000000LL;
              while (lo < hi) {
                  long long mid = (lo + hi) / 2;
                  long long cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc;
                  if (cnt >= n) hi = mid;
                  else lo = mid + 1;
              }
              return (int)lo;
          }
        `,
        csharp: code`
          static long UnGcd(long x, long y)
          {
              while (y != 0)
              {
                  long t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          static long UnLcm(long x, long y)
          {
              long l = x / UnGcd(x, y) * y;
              return l > 2000000000L ? 2000000001L : l;
          }

          public static int NthUglyNumber(int n, int a, int b, int c)
          {
              long ab = UnLcm(a, b), ac = UnLcm(a, c), bc = UnLcm(b, c), abc = UnLcm(ab, c);
              long lo = 1, hi = 2000000000L;
              while (lo < hi)
              {
                  long mid = (lo + hi) / 2;
                  long cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc;
                  if (cnt >= n) hi = mid;
                  else lo = mid + 1;
              }
              return (int)lo;
          }
        `,
        go: code`
          func unGcd(x, y int) int {
          	for y != 0 {
          		x, y = y, x%y
          	}
          	return x
          }

          func unLcm(x, y int) int {
          	l := x / unGcd(x, y) * y
          	if l > 2000000000 {
          		return 2000000001
          	}
          	return l
          }

          func nthUglyNumber(n int, a int, b int, c int) int {
          	ab, ac, bc := unLcm(a, b), unLcm(a, c), unLcm(b, c)
          	abc := unLcm(ab, c)
          	lo, hi := 1, 2000000000
          	for lo < hi {
          		mid := (lo + hi) / 2
          		cnt := mid/a + mid/b + mid/c - mid/ab - mid/ac - mid/bc + mid/abc
          		if cnt >= n {
          			hi = mid
          		} else {
          			lo = mid + 1
          		}
          	}
          	return lo
          }
        `,
        kotlin: code`
          fun unGcd(x0: Long, y0: Long): Long {
              var x = x0
              var y = y0
              while (y != 0L) {
                  val t = x % y
                  x = y
                  y = t
              }
              return x
          }

          fun unLcm(x: Long, y: Long): Long {
              val l = x / unGcd(x, y) * y
              return if (l > 2000000000L) 2000000001L else l
          }

          fun nthUglyNumber(n: Int, a: Int, b: Int, c: Int): Int {
              val la = a.toLong()
              val lb = b.toLong()
              val lc = c.toLong()
              val ab = unLcm(la, lb)
              val ac = unLcm(la, lc)
              val bc = unLcm(lb, lc)
              val abc = unLcm(ab, lc)
              var lo = 1L
              var hi = 2000000000L
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  val cnt = mid / la + mid / lb + mid / lc - mid / ab - mid / ac - mid / bc + mid / abc
                  if (cnt >= n) hi = mid else lo = mid + 1
              }
              return lo.toInt()
          }
        `,
        swift: code`
          func unGcd(_ x0: Int, _ y0: Int) -> Int {
              var x = x0
              var y = y0
              while y != 0 {
                  let t = x % y
                  x = y
                  y = t
              }
              return x
          }

          func unLcm(_ x: Int, _ y: Int) -> Int {
              let l = x / unGcd(x, y) * y
              return l > 2000000000 ? 2000000001 : l
          }

          func nthUglyNumber(_ n: Int, _ a: Int, _ b: Int, _ c: Int) -> Int {
              let ab = unLcm(a, b), ac = unLcm(a, c), bc = unLcm(b, c)
              let abc = unLcm(ab, c)
              var lo = 1
              var hi = 2000000000
              while lo < hi {
                  let mid = (lo + hi) / 2
                  let cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc
                  if cnt >= n { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn un_gcd(x0: i64, y0: i64) -> i64 {
              let mut x = x0;
              let mut y = y0;
              while y != 0 {
                  let t = x % y;
                  x = y;
                  y = t;
              }
              x
          }

          fn un_lcm(x: i64, y: i64) -> i64 {
              let l = x / un_gcd(x, y) * y;
              if l > 2000000000 {
                  2000000001
              } else {
                  l
              }
          }

          fn nthUglyNumber(n: i32, a: i32, b: i32, c: i32) -> i32 {
              let (a, b, c, n) = (a as i64, b as i64, c as i64, n as i64);
              let ab = un_lcm(a, b);
              let ac = un_lcm(a, c);
              let bc = un_lcm(b, c);
              let abc = un_lcm(ab, c);
              let mut lo: i64 = 1;
              let mut hi: i64 = 2000000000;
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  let cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc;
                  if cnt >= n {
                      hi = mid;
                  } else {
                      lo = mid + 1;
                  }
              }
              lo as i32
          }
        `,
        php: code`
          function unGcd($x, $y) {
              while ($y != 0) {
                  $t = $x % $y;
                  $x = $y;
                  $y = $t;
              }
              return $x;
          }

          function unLcm($x, $y) {
              $l = intdiv($x, unGcd($x, $y)) * $y;
              return $l > 2000000000 ? 2000000001 : $l;
          }

          function nthUglyNumber($n, $a, $b, $c) {
              $ab = unLcm($a, $b);
              $ac = unLcm($a, $c);
              $bc = unLcm($b, $c);
              $abc = unLcm($ab, $c);
              $lo = 1;
              $hi = 2000000000;
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  $cnt = intdiv($mid, $a) + intdiv($mid, $b) + intdiv($mid, $c)
                      - intdiv($mid, $ab) - intdiv($mid, $ac) - intdiv($mid, $bc) + intdiv($mid, $abc);
                  if ($cnt >= $n) $hi = $mid;
                  else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def nthUglyNumber(n, a, b, c)
            ab = a.lcm(b)
            ac = a.lcm(c)
            bc = b.lcm(c)
            abc = ab.lcm(c)
            lo = 1
            hi = 2_000_000_000
            while lo < hi
              mid = (lo + hi) / 2
              cnt = mid / a + mid / b + mid / c - mid / ab - mid / ac - mid / bc + mid / abc
              if cnt >= n
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Four Divisors (LC 1390) ─────────────────────────────────────
  (() => {
    // Reference: divisor count and divisor sum for every value up to 10^5 by a
    // harmonic sieve, built once.
    let cnt: Int32Array | null = null, sum: Float64Array | null = null;
    const ref = (nums: number[]) => {
      if (!cnt || !sum) {
        cnt = new Int32Array(100001); sum = new Float64Array(100001);
        for (let d = 1; d <= 100000; d++) for (let m = d; m <= 100000; m += d) { cnt[m]++; sum[m] += d; }
      }
      let total = 0;
      for (const v of nums) if (cnt[v] === 4) total += sum[v];
      return total;
    };
    const primes: number[] = [];
    for (let x = 2; x <= 50000; x++) {
      let ok = true;
      for (let d = 2; d * d <= x; d++) if (x % d === 0) { ok = false; break; }
      if (ok) primes.push(x);
    }
    return {
      slug: "four-divisors",
      title: "Four Divisors",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Number Theory", "Amazon", "Google"],
      signature: { funcName: "sumFourDivisors", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, look at the integers in it that have **exactly four** positive divisors. Return the sum of all the divisors of those integers.\n\nIf no integer in `nums` has exactly four divisors, return `0`. Repeated values are counted each time they appear.",
        [
          { in: "nums = [21,4,7]", out: "32", note: "21 has divisors 1, 3, 7, 21 (sum 32). 4 has three divisors and 7 has two." },
          { in: "nums = [21,21]", out: "64" },
          { in: "nums = [1,2,3,4,5]", out: "0" },
        ],
        ["1 <= nums.length <= 10^4", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Divisors come in pairs `d` and `x / d`, with one of the pair at most `sqrt(x)`.",
        "Enumerate `d` up to `sqrt(x)`, counting and summing both members of each pair (once if `d * d == x`).",
        "Stop as soon as the count passes 4 — most numbers are discarded quickly.",
      ],
      editorial: explain({
        idea: "Enumerate divisors in pairs up to the square root, keep a count and a running sum, and give up on a number as soon as it has more than four.",
        steps: [
          "For each `x` in `nums`, set `count = 0` and `s = 0`.",
          "For `d = 1, 2, …` while `d * d <= x`: if `d` divides `x`, add `d` and `x / d` to `s` and 2 to `count` (only `d` and 1 if `d * d == x`). Break if `count > 4`.",
          "If `count == 4`, add `s` to the answer.",
          "Return the answer.",
        ],
        why: "Every divisor `e` of `x` pairs with `x / e`, and exactly one member of each pair is at most `√x` (both are, when `e = √x`). So scanning `d ≤ √x` meets every divisor once through its pair, giving the exact count and sum. Numbers with exactly four divisors are `p·q` for distinct primes or `p³`, but the scan does not need that characterisation.",
        time: "O(n · √M) where M is the largest value",
        space: "O(1)",
        pitfalls: [
          "Perfect squares: `d = √x` must be counted once, not twice (4 has divisors 1, 2, 4).",
          "Summing divisors of numbers that turn out not to have four — keep the sum local to each number.",
          "Repeated values each contribute.",
        ],
      }),
      examples: [
        { input: "[21,4,7]", expectedOutput: "32" },
        { input: "[21,21]", expectedOutput: "64" },
        { input: "[1,2,3,4,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const size = pick(rng, [1, ri(rng, 1, 5), ri(rng, 1, 10)]);
        const nums: number[] = [];
        for (let i = 0; i < size; i++) {
          const kind = ri(rng, 0, 9);
          if (kind < 3) nums.push(ri(rng, 1, 1000));
          else if (kind < 6) nums.push(ri(rng, 1, 100000));
          else if (kind < 9) {
            // A product of two distinct primes (four divisors) within range.
            const p = pick(rng, primes.slice(0, 60));
            const big = primes.filter((q) => q !== p && p * q <= 100000);
            nums.push(p * pick(rng, big));
          } else nums.push(pick(rng, [1, 8, 27, 125, 343, 1331, 2197, 4913, 6859, 12167, 24389, 29791, 50653, 79507, 64, 81, 99991]));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumFourDivisors(nums: List[int]) -> int:
              total = 0
              for x in nums:
                  count = 0
                  s = 0
                  d = 1
                  while d * d <= x:
                      if x % d == 0:
                          other = x // d
                          if other == d:
                              count += 1
                              s += d
                          else:
                              count += 2
                              s += d + other
                          if count > 4:
                              break
                      d += 1
                  if count == 4:
                      total += s
              return total
        `,
        javascript: code`
          var sumFourDivisors = function(nums) {
              var total = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], count = 0, s = 0;
                  for (var d = 1; d * d <= x; d++) {
                      if (x % d !== 0) continue;
                      var other = x / d;
                      if (other === d) {
                          count += 1;
                          s += d;
                      } else {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count === 4) total += s;
              }
              return total;
          };
        `,
        typescript: code`
          function sumFourDivisors(nums: number[]): number {
              var total = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], count = 0, s = 0;
                  for (var d = 1; d * d <= x; d++) {
                      if (x % d !== 0) continue;
                      var other = x / d;
                      if (other === d) {
                          count += 1;
                          s += d;
                      } else {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count === 4) total += s;
              }
              return total;
          }
        `,
        java: code`
          public static int sumFourDivisors(int[] nums) {
              int total = 0;
              for (int x : nums) {
                  int count = 0, s = 0;
                  for (int d = 1; d * d <= x; d++) {
                      if (x % d != 0) continue;
                      int other = x / d;
                      if (other == d) {
                          count += 1;
                          s += d;
                      } else {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count == 4) total += s;
              }
              return total;
          }
        `,
        cpp: code`
          int sumFourDivisors(vector<int>& nums) {
              int total = 0;
              for (int x : nums) {
                  int count = 0, s = 0;
                  for (int d = 1; d * d <= x; d++) {
                      if (x % d != 0) continue;
                      int other = x / d;
                      if (other == d) {
                          count += 1;
                          s += d;
                      } else {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count == 4) total += s;
              }
              return total;
          }
        `,
        c: code`
          int sumFourDivisors(int* nums, int numsSize) {
              int total = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i], count = 0, s = 0;
                  for (int d = 1; d * d <= x; d++) {
                      if (x % d != 0) continue;
                      int other = x / d;
                      if (other == d) {
                          count += 1;
                          s += d;
                      } else {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count == 4) total += s;
              }
              return total;
          }
        `,
        csharp: code`
          public static int SumFourDivisors(int[] nums)
          {
              int total = 0;
              foreach (int x in nums)
              {
                  int count = 0, s = 0;
                  for (int d = 1; d * d <= x; d++)
                  {
                      if (x % d != 0) continue;
                      int other = x / d;
                      if (other == d)
                      {
                          count += 1;
                          s += d;
                      }
                      else
                      {
                          count += 2;
                          s += d + other;
                      }
                      if (count > 4) break;
                  }
                  if (count == 4) total += s;
              }
              return total;
          }
        `,
        go: code`
          func sumFourDivisors(nums []int) int {
          	total := 0
          	for _, x := range nums {
          		count, s := 0, 0
          		for d := 1; d*d <= x; d++ {
          			if x%d != 0 {
          				continue
          			}
          			other := x / d
          			if other == d {
          				count++
          				s += d
          			} else {
          				count += 2
          				s += d + other
          			}
          			if count > 4 {
          				break
          			}
          		}
          		if count == 4 {
          			total += s
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun sumFourDivisors(nums: IntArray): Int {
              var total = 0
              for (x in nums) {
                  var count = 0
                  var s = 0
                  var d = 1
                  while (d * d <= x) {
                      if (x % d == 0) {
                          val other = x / d
                          if (other == d) {
                              count += 1
                              s += d
                          } else {
                              count += 2
                              s += d + other
                          }
                          if (count > 4) break
                      }
                      d++
                  }
                  if (count == 4) total += s
              }
              return total
          }
        `,
        swift: code`
          func sumFourDivisors(_ nums: [Int]) -> Int {
              var total = 0
              for x in nums {
                  var count = 0
                  var s = 0
                  var d = 1
                  while d * d <= x {
                      if x % d == 0 {
                          let other = x / d
                          if other == d {
                              count += 1
                              s += d
                          } else {
                              count += 2
                              s += d + other
                          }
                          if count > 4 { break }
                      }
                      d += 1
                  }
                  if count == 4 { total += s }
              }
              return total
          }
        `,
        rust: code`
          fn sumFourDivisors(nums: Vec<i32>) -> i32 {
              let mut total = 0;
              for &x in nums.iter() {
                  let mut count = 0;
                  let mut s = 0;
                  let mut d = 1;
                  while d * d <= x {
                      if x % d == 0 {
                          let other = x / d;
                          if other == d {
                              count += 1;
                              s += d;
                          } else {
                              count += 2;
                              s += d + other;
                          }
                          if count > 4 {
                              break;
                          }
                      }
                      d += 1;
                  }
                  if count == 4 {
                      total += s;
                  }
              }
              total
          }
        `,
        php: code`
          function sumFourDivisors($nums) {
              $total = 0;
              foreach ($nums as $x) {
                  $count = 0;
                  $s = 0;
                  for ($d = 1; $d * $d <= $x; $d++) {
                      if ($x % $d != 0) continue;
                      $other = intdiv($x, $d);
                      if ($other == $d) {
                          $count += 1;
                          $s += $d;
                      } else {
                          $count += 2;
                          $s += $d + $other;
                      }
                      if ($count > 4) break;
                  }
                  if ($count == 4) $total += $s;
              }
              return $total;
          }
        `,
        ruby: code`
          def sumFourDivisors(nums)
            total = 0
            nums.each do |x|
              count = 0
              s = 0
              d = 1
              while d * d <= x
                if x % d == 0
                  other = x / d
                  if other == d
                    count += 1
                    s += d
                  else
                    count += 2
                    s += d + other
                  end
                  break if count > 4
                end
                d += 1
              end
              total += s if count == 4
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Find the Minimum Number of Fibonacci Numbers Whose Sum Is K (LC 1414)
  (() => {
    // Reference: unbounded coin-change DP over the Fibonacci numbers for every
    // k up to 10^5 (built once); larger k use the greedy, which the DP checks
    // on every small case.
    const FIB: number[] = [1, 2];
    while (FIB[FIB.length - 1] + FIB[FIB.length - 2] <= 1000000000) FIB.push(FIB[FIB.length - 1] + FIB[FIB.length - 2]);
    let dp: Int32Array | null = null;
    const greedy = (k: number) => {
      let count = 0;
      for (let i = FIB.length - 1; i >= 0 && k > 0; i--) if (FIB[i] <= k) { k -= FIB[i]; count++; }
      return count;
    };
    const ref = (k: number) => {
      if (k <= 100000) {
        if (!dp) {
          dp = new Int32Array(100001);
          for (let v = 1; v <= 100000; v++) {
            let best = 1 << 30;
            for (const f of FIB) { if (f > v) break; best = Math.min(best, dp[v - f] + 1); }
            dp[v] = best;
          }
        }
        if (dp[k] !== greedy(k)) throw new Error(`fibonacci-sum: greedy disagrees at ${k}`);
        return dp[k];
      }
      return greedy(k);
    };
    return {
      slug: "find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k",
      title: "Find the Minimum Number of Fibonacci Numbers Whose Sum Is K",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Microsoft"],
      signature: { funcName: "findMinFibonacciNumbers", params: [{ name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The Fibonacci numbers are `F1 = 1`, `F2 = 1` and `Fn = Fn-1 + Fn-2` for `n > 2`: 1, 1, 2, 3, 5, 8, 13, …\n\nGiven an integer `k`, return the **minimum** number of Fibonacci numbers whose sum is exactly `k`. The same Fibonacci number may be used more than once. Such a sum always exists.",
        [
          { in: "k = 7", out: "2", note: "7 = 2 + 5." },
          { in: "k = 10", out: "2", note: "10 = 2 + 8." },
          { in: "k = 19", out: "3", note: "19 = 1 + 5 + 13." },
        ],
        ["1 <= k <= 10^9"]),
      hints: [
        "Try taking the largest Fibonacci number that does not exceed `k`, then repeat on what is left.",
        "Why is that safe? An optimal sum never needs two consecutive Fibonacci numbers (replace them by their sum) nor the same number twice (2·Fn = Fn+1 + Fn-2).",
        "A sum of non-consecutive, distinct Fibonacci numbers below `F(m+1)` cannot reach `F(m+1)`, so the largest Fibonacci number ≤ k must be in it.",
      ],
      editorial: explain({
        idea: "Greedy works: repeatedly subtract the largest Fibonacci number not exceeding the remainder (Zeckendorf's representation).",
        steps: [
          "List the Fibonacci numbers up to `k`.",
          "Walk the list from the largest: whenever the current number fits in the remainder, subtract it and count it.",
          "Stop when the remainder is 0 and return the count.",
        ],
        why: "Among optimal sums take one with the fewest terms that also avoids two consecutive Fibonacci numbers (merging `Fn + Fn+1` into `Fn+2` reduces the count) and repeated ones (`2·Fn = Fn+1 + Fn-2` keeps the count but removes the repeat, and the process terminates). The largest possible sum of distinct, non-consecutive Fibonacci numbers all below `F(m)` is `F(m) − 1`, so if the largest Fibonacci number `F(m) ≤ k` were missing the terms could not reach `k`. Hence an optimal sum contains it, and induction on `k − F(m)` finishes the proof. After subtracting `F(m)` the remainder is below `F(m−1)`, so the scan never needs to revisit a number.",
        time: "O(log k) — there are about 44 Fibonacci numbers up to 10^9",
        space: "O(log k)",
        pitfalls: [
          "A coin-change DP is correct but needs O(k) memory, impossible for 10^9.",
          "Generating Fibonacci numbers past `k`: the next one after 701,408,733 is 1,134,903,170, still inside int32, but stop before overflowing.",
          "The two leading 1s are the same value; one copy in the list is enough.",
        ],
      }),
      examples: [
        { input: "7", expectedOutput: "2" },
        { input: "10", expectedOutput: "2" },
        { input: "19", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let k: number;
        if (shape < 4) k = ri(rng, 1, 1000);
        else if (shape < 6) k = ri(rng, 1001, 100000);
        else if (shape < 9) k = ri(rng, 100001, 1000000000);
        else {
          const f = pick(rng, FIB);
          k = Math.min(1000000000, Math.max(1, f + ri(rng, -1, 1)));
        }
        return { input: String(k), expectedOutput: String(ref(k)) };
      },
      solutions: {
        python: code`
          def findMinFibonacciNumbers(k: int) -> int:
              fib = [1, 2]
              while fib[-1] + fib[-2] <= k:
                  fib.append(fib[-1] + fib[-2])
              count = 0
              for f in reversed(fib):
                  if f <= k:
                      k -= f
                      count += 1
                      if k == 0:
                          break
              return count
        `,
        javascript: code`
          var findMinFibonacciNumbers = function(k) {
              var fib = [1, 2];
              while (fib[fib.length - 1] + fib[fib.length - 2] <= k) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
              var count = 0;
              for (var i = fib.length - 1; i >= 0 && k > 0; i--) {
                  if (fib[i] <= k) {
                      k -= fib[i];
                      count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function findMinFibonacciNumbers(k: number): number {
              var fib: number[] = [1, 2];
              while (fib[fib.length - 1] + fib[fib.length - 2] <= k) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
              var count = 0;
              for (var i = fib.length - 1; i >= 0 && k > 0; i--) {
                  if (fib[i] <= k) {
                      k -= fib[i];
                      count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int findMinFibonacciNumbers(int k) {
              List<Long> fib = new ArrayList<>();
              fib.add(1L);
              fib.add(2L);
              while (fib.get(fib.size() - 1) + fib.get(fib.size() - 2) <= k) fib.add(fib.get(fib.size() - 1) + fib.get(fib.size() - 2));
              long rest = k;
              int count = 0;
              for (int i = fib.size() - 1; i >= 0 && rest > 0; i--) {
                  if (fib.get(i) <= rest) {
                      rest -= fib.get(i);
                      count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int findMinFibonacciNumbers(int k) {
              vector<long long> fib = {1, 2};
              while (fib[fib.size() - 1] + fib[fib.size() - 2] <= k) fib.push_back(fib[fib.size() - 1] + fib[fib.size() - 2]);
              long long rest = k;
              int count = 0;
              for (int i = (int)fib.size() - 1; i >= 0 && rest > 0; i--) {
                  if (fib[i] <= rest) {
                      rest -= fib[i];
                      count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          int findMinFibonacciNumbers(int k) {
              long long fib[64];
              int n = 2;
              fib[0] = 1;
              fib[1] = 2;
              while (fib[n - 1] + fib[n - 2] <= k) {
                  fib[n] = fib[n - 1] + fib[n - 2];
                  n++;
              }
              long long rest = k;
              int count = 0;
              for (int i = n - 1; i >= 0 && rest > 0; i--) {
                  if (fib[i] <= rest) {
                      rest -= fib[i];
                      count++;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          public static int FindMinFibonacciNumbers(int k)
          {
              var fib = new List<long> { 1, 2 };
              while (fib[fib.Count - 1] + fib[fib.Count - 2] <= k) fib.Add(fib[fib.Count - 1] + fib[fib.Count - 2]);
              long rest = k;
              int count = 0;
              for (int i = fib.Count - 1; i >= 0 && rest > 0; i--)
              {
                  if (fib[i] <= rest)
                  {
                      rest -= fib[i];
                      count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func findMinFibonacciNumbers(k int) int {
          	fib := []int{1, 2}
          	for fib[len(fib)-1]+fib[len(fib)-2] <= k {
          		fib = append(fib, fib[len(fib)-1]+fib[len(fib)-2])
          	}
          	count := 0
          	for i := len(fib) - 1; i >= 0 && k > 0; i-- {
          		if fib[i] <= k {
          			k -= fib[i]
          			count++
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun findMinFibonacciNumbers(k: Int): Int {
              val fib = ArrayList<Long>()
              fib.add(1L)
              fib.add(2L)
              while (fib[fib.size - 1] + fib[fib.size - 2] <= k) fib.add(fib[fib.size - 1] + fib[fib.size - 2])
              var rest = k.toLong()
              var count = 0
              var i = fib.size - 1
              while (i >= 0 && rest > 0) {
                  if (fib[i] <= rest) {
                      rest -= fib[i]
                      count++
                  }
                  i--
              }
              return count
          }
        `,
        swift: code`
          func findMinFibonacciNumbers(_ k: Int) -> Int {
              var fib = [1, 2]
              while fib[fib.count - 1] + fib[fib.count - 2] <= k {
                  fib.append(fib[fib.count - 1] + fib[fib.count - 2])
              }
              var rest = k
              var count = 0
              var i = fib.count - 1
              while i >= 0 && rest > 0 {
                  if fib[i] <= rest {
                      rest -= fib[i]
                      count += 1
                  }
                  i -= 1
              }
              return count
          }
        `,
        rust: code`
          fn findMinFibonacciNumbers(k: i32) -> i32 {
              let k = k as i64;
              let mut fib: Vec<i64> = vec![1, 2];
              while fib[fib.len() - 1] + fib[fib.len() - 2] <= k {
                  let next = fib[fib.len() - 1] + fib[fib.len() - 2];
                  fib.push(next);
              }
              let mut rest = k;
              let mut count = 0;
              for &f in fib.iter().rev() {
                  if rest == 0 {
                      break;
                  }
                  if f <= rest {
                      rest -= f;
                      count += 1;
                  }
              }
              count
          }
        `,
        php: code`
          function findMinFibonacciNumbers($k) {
              $fib = [1, 2];
              while ($fib[count($fib) - 1] + $fib[count($fib) - 2] <= $k) $fib[] = $fib[count($fib) - 1] + $fib[count($fib) - 2];
              $total = 0;
              for ($i = count($fib) - 1; $i >= 0 && $k > 0; $i--) {
                  if ($fib[$i] <= $k) {
                      $k -= $fib[$i];
                      $total++;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def findMinFibonacciNumbers(k)
            fib = [1, 2]
            fib << fib[-1] + fib[-2] while fib[-1] + fib[-2] <= k
            count = 0
            i = fib.length - 1
            while i >= 0 && k > 0
              if fib[i] <= k
                k -= fib[i]
                count += 1
              end
              i -= 1
            end
            count
          end
        `,
      },
    };
  })(),

  // ── The k-th Lexicographical String of All Happy Strings of Length n (LC 1415)
  (() => {
    // Brute force: list every happy string of length n in order.
    const ref = (n: number, k: number) => {
      const all: string[] = [];
      const dfs = (s: string) => {
        if (s.length === n) { all.push(s); return; }
        for (const c of ["a", "b", "c"]) if (s.length === 0 || s[s.length - 1] !== c) dfs(s + c);
      };
      dfs("");
      return k <= all.length ? all[k - 1] : "";
    };
    return {
      slug: "the-k-th-lexicographical-string-of-all-happy-strings-of-length-n",
      title: "The k-th Lexicographical String of All Happy Strings of Length n",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Combinatorics", "Amazon", "Microsoft"],
      signature: { funcName: "getHappyString", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "A string is **happy** if it uses only the letters `'a'`, `'b'` and `'c'`, and no two neighbouring characters are equal. For example `\"abc\"`, `\"ac\"` and `\"b\"` are happy, while `\"aa\"`, `\"baa\"` and `\"ababbc\"` are not.\n\nList all happy strings of length `n` in lexicographical (dictionary) order. Return the `k`-th string of that list (counting from 1), or an **empty string** if the list has fewer than `k` strings.",
        [
          { in: "n = 1, k = 3", out: '"c"', note: "The list is [\"a\", \"b\", \"c\"]." },
          { in: "n = 1, k = 4", out: '""', note: "There are only three happy strings of length 1." },
          { in: "n = 3, k = 9", out: '"cab"', note: "The list is [\"aba\", \"abc\", \"aca\", \"acb\", \"bab\", \"bac\", \"bca\", \"bcb\", \"cab\", \"cac\", \"cba\", \"cbc\"]." },
        ],
        ["1 <= n <= 10", "1 <= k <= 100"]),
      hints: [
        "How many happy strings of length `n` are there? The first letter has 3 choices and every later letter has 2.",
        "So there are `3 * 2^(n-1)` strings; if `k` is larger, the answer is empty. Otherwise the first letter splits the list into three equal blocks of `2^(n-1)`.",
        "Fix the letters one at a time: at each later position the two allowed letters split the remaining block in half, and `k` tells you which half (like reading the bits of `k - 1`).",
      ],
      editorial: explain({
        idea: "The happy strings in order form a complete tree — 3 children at the root, 2 everywhere else — so the `k`-th leaf can be found by division, without listing anything.",
        steps: [
          "If `k > 3 * 2^(n-1)`, return the empty string.",
          "Set `k = k - 1` (0-based) and `block = 2^(n-1)`. The first letter is `\"abc\"[k / block]`; set `k %= block`.",
          "For each next position: halve `block`, list the two letters different from the previous one in alphabetical order, take the one at index `k / block`, and set `k %= block`.",
          "Return the built string.",
        ],
        why: "Sorting the happy strings lexicographically groups them by first letter into three equal blocks of `2^(n-1)`, and inside a block by second letter into two equal halves, and so on. The 0-based index `k` therefore decomposes as `first * 2^(n-1) + second * 2^(n-2) + …`, which is exactly what repeated division and remainder extract.",
        time: "O(n)",
        space: "O(n) for the answer",
        pitfalls: [
          "Forgetting the empty-string case when `k` exceeds the number of happy strings.",
          "The two choices after a letter must be taken in alphabetical order — after `'b'` they are `'a'` then `'c'`.",
          "Generating all strings by backtracking also works for these limits, but it is exponential in `n`.",
        ],
      }),
      examples: [
        { input: "1\n3", expectedOutput: "c" },
        { input: "1\n4", expectedOutput: "" },
        { input: "3\n9", expectedOutput: "cab" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const total = 3 * Math.pow(2, n - 1);
        const k = ri(rng, 0, 4) === 0 ? ri(rng, 1, 100) : ri(rng, 1, Math.min(100, total));
        return { input: `${n}\n${k}`, expectedOutput: ref(n, k) };
      },
      solutions: {
        python: code`
          def getHappyString(n: int, k: int) -> str:
              block = 1 << (n - 1)
              if k > 3 * block:
                  return ""
              k -= 1
              res = ["abc"[k // block]]
              k %= block
              for _ in range(1, n):
                  block //= 2
                  options = [c for c in "abc" if c != res[-1]]
                  res.append(options[k // block])
                  k %= block
              return "".join(res)
        `,
        javascript: code`
          var getHappyString = function(n, k) {
              var block = 1 << (n - 1);
              if (k > 3 * block) return "";
              k--;
              var res = "abc"[Math.floor(k / block)];
              k %= block;
              for (var i = 1; i < n; i++) {
                  block >>= 1;
                  var last = res[res.length - 1];
                  var options = [];
                  for (var j = 0; j < 3; j++) if ("abc"[j] !== last) options.push("abc"[j]);
                  res += options[Math.floor(k / block)];
                  k %= block;
              }
              return res;
          };
        `,
        typescript: code`
          function getHappyString(n: number, k: number): string {
              var block = 1 << (n - 1);
              if (k > 3 * block) return "";
              k--;
              var res = "abc".charAt(Math.floor(k / block));
              k %= block;
              for (var i = 1; i < n; i++) {
                  block >>= 1;
                  var last = res.charAt(res.length - 1);
                  var options: string[] = [];
                  for (var j = 0; j < 3; j++) if ("abc".charAt(j) !== last) options.push("abc".charAt(j));
                  res += options[Math.floor(k / block)];
                  k %= block;
              }
              return res;
          }
        `,
        java: code`
          public static String getHappyString(int n, int k) {
              int block = 1 << (n - 1);
              if (k > 3 * block) return "";
              k--;
              StringBuilder res = new StringBuilder();
              res.append((char) ('a' + k / block));
              k %= block;
              for (int i = 1; i < n; i++) {
                  block >>= 1;
                  char last = res.charAt(i - 1);
                  char[] options = new char[2];
                  int m = 0;
                  for (char c = 'a'; c <= 'c'; c++) if (c != last) options[m++] = c;
                  res.append(options[k / block]);
                  k %= block;
              }
              return res.toString();
          }
        `,
        cpp: code`
          string getHappyString(int n, int k) {
              int block = 1 << (n - 1);
              if (k > 3 * block) return "";
              k--;
              string res(1, (char)('a' + k / block));
              k %= block;
              for (int i = 1; i < n; i++) {
                  block >>= 1;
                  char options[2];
                  int m = 0;
                  for (char c = 'a'; c <= 'c'; c++) if (c != res.back()) options[m++] = c;
                  res += options[k / block];
                  k %= block;
              }
              return res;
          }
        `,
        c: code`
          char* getHappyString(int n, int k) {
              char* res = (char*)malloc(n + 1);
              int block = 1 << (n - 1);
              if (k > 3 * block) {
                  res[0] = '\0';
                  return res;
              }
              k--;
              res[0] = (char)('a' + k / block);
              k %= block;
              for (int i = 1; i < n; i++) {
                  block >>= 1;
                  char options[2];
                  int m = 0;
                  for (char c = 'a'; c <= 'c'; c++) if (c != res[i - 1]) options[m++] = c;
                  res[i] = options[k / block];
                  k %= block;
              }
              res[n] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string GetHappyString(int n, int k)
          {
              int block = 1 << (n - 1);
              if (k > 3 * block) return "";
              k--;
              var res = new System.Text.StringBuilder();
              res.Append((char)('a' + k / block));
              k %= block;
              for (int i = 1; i < n; i++)
              {
                  block >>= 1;
                  char last = res[i - 1];
                  char[] options = new char[2];
                  int m = 0;
                  for (char c = 'a'; c <= 'c'; c++) if (c != last) options[m++] = c;
                  res.Append(options[k / block]);
                  k %= block;
              }
              return res.ToString();
          }
        `,
        go: code`
          func getHappyString(n int, k int) string {
          	block := 1 << uint(n-1)
          	if k > 3*block {
          		return ""
          	}
          	k--
          	res := []byte{byte('a' + k/block)}
          	k %= block
          	for i := 1; i < n; i++ {
          		block >>= 1
          		options := []byte{}
          		for c := byte('a'); c <= 'c'; c++ {
          			if c != res[i-1] {
          				options = append(options, c)
          			}
          		}
          		res = append(res, options[k/block])
          		k %= block
          	}
          	return string(res)
          }
        `,
        kotlin: code`
          fun getHappyString(n: Int, k: Int): String {
              var block = 1 shl (n - 1)
              if (k > 3 * block) return ""
              var idx = k - 1
              val res = StringBuilder()
              res.append('a' + idx / block)
              idx %= block
              for (i in 1 until n) {
                  block = block shr 1
                  val last = res[i - 1]
                  val options = "abc".filter { it != last }
                  res.append(options[idx / block])
                  idx %= block
              }
              return res.toString()
          }
        `,
        swift: code`
          func getHappyString(_ n: Int, _ k: Int) -> String {
              var block = 1 << (n - 1)
              if k > 3 * block { return "" }
              var idx = k - 1
              let letters: [Character] = ["a", "b", "c"]
              var res: [Character] = [letters[idx / block]]
              idx %= block
              var i = 1
              while i < n {
                  block >>= 1
                  let last = res[i - 1]
                  let options = letters.filter { $0 != last }
                  res.append(options[idx / block])
                  idx %= block
                  i += 1
              }
              return String(res)
          }
        `,
        rust: code`
          fn getHappyString(n: i32, k: i32) -> String {
              let mut block: i32 = 1 << (n - 1);
              if k > 3 * block {
                  return String::new();
              }
              let mut idx = k - 1;
              let mut res: Vec<u8> = vec![b'a' + (idx / block) as u8];
              idx %= block;
              for i in 1..n as usize {
                  block >>= 1;
                  let last = res[i - 1];
                  let options: Vec<u8> = vec![b'a', b'b', b'c'].into_iter().filter(|&c| c != last).collect();
                  res.push(options[(idx / block) as usize]);
                  idx %= block;
              }
              String::from_utf8(res).unwrap()
          }
        `,
        php: code`
          function getHappyString($n, $k) {
              $block = 1 << ($n - 1);
              if ($k > 3 * $block) return "";
              $k--;
              $res = "abc"[intdiv($k, $block)];
              $k %= $block;
              for ($i = 1; $i < $n; $i++) {
                  $block >>= 1;
                  $last = $res[$i - 1];
                  $options = [];
                  foreach (['a', 'b', 'c'] as $c) if ($c !== $last) $options[] = $c;
                  $res .= $options[intdiv($k, $block)];
                  $k %= $block;
              }
              return $res;
          }
        `,
        ruby: code`
          def getHappyString(n, k)
            block = 1 << (n - 1)
            return "" if k > 3 * block
            k -= 1
            res = "abc"[k / block]
            k %= block
            (1...n).each do |i|
              block >>= 1
              options = %w[a b c].reject { |c| c == res[i - 1] }
              res += options[k / block]
              k %= block
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Simplified Fractions (LC 1447) ──────────────────────────────
  (() => {
    // Independent reference: the Farey sequence of order n, generated in
    // increasing order by its next-term recurrence.
    const ref = (n: number) => {
      const out: string[] = [];
      let a = 0, b = 1, c = 1, d = n;
      while (!(c === 1 && d === 1)) {
        out.push(`${c}/${d}`);
        const k = Math.floor((n + b) / d);
        const nc = k * c - a, nd = k * d - b;
        a = c; b = d; c = nc; d = nd;
      }
      return out;
    };
    return {
      slug: "simplified-fractions",
      title: "Simplified Fractions",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Number Theory", "Google", "Amazon"],
      signature: { funcName: "simplifiedFractions", params: [{ name: "n", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "Given an integer `n`, return every fraction strictly between `0` and `1` whose denominator is at most `n` and which is in **lowest terms** (numerator and denominator share no common factor above 1).\n\nWrite each fraction as `\"numerator/denominator\"`, and list them in **increasing order of value**. Each value appears once, so `2/4` is not listed separately from `1/2`.",
        [
          { in: "n = 2", out: "[\"1/2\"]" },
          { in: "n = 3", out: "[\"1/3\",\"1/2\",\"2/3\"]" },
          { in: "n = 4", out: "[\"1/4\",\"1/3\",\"1/2\",\"2/3\",\"3/4\"]", note: "2/4 is the same value as 1/2 and is not in lowest terms." },
        ],
        ["1 <= n <= 100"]),
      hints: [
        "Try every denominator `b` from 2 to `n` and every numerator `a` from 1 to `b - 1`.",
        "`a/b` is in lowest terms exactly when `gcd(a, b) == 1`; each value between 0 and 1 has exactly one such form.",
        "To sort by value without floating point, compare `a/b < c/d` as `a*d < c*b`.",
      ],
      editorial: explain({
        idea: "Enumerate all pairs `a < b <= n` with `gcd(a, b) = 1`, then sort them by value using cross-multiplication.",
        steps: [
          "For each `b` from 2 to `n` and each `a` from 1 to `b - 1`, keep the pair if `gcd(a, b) == 1`.",
          "Sort the kept pairs: `(a, b)` comes before `(c, d)` when `a * d < c * b`.",
          "Format each pair as `\"a/b\"` and return the list.",
        ],
        why: "Every rational in (0, 1) with denominator at most `n` has a unique lowest-terms representation `a/b`, and its denominator is at most `n` too, so the coprime pairs list each value exactly once. Distinct reduced fractions have distinct values, so the order is fully determined, and cross-multiplying positive denominators preserves the comparison exactly. (The result is the Farey sequence of order `n` without its endpoints.)",
        time: "O(n² log n) — about 0.3·n² fractions, each needing a gcd, then a sort",
        space: "O(n²) for the output",
        pitfalls: [
          "Listing non-reduced duplicates like `2/4` next to `1/2`.",
          "`n = 1` has no fractions: return an empty list.",
          "Sorting by floating-point quotient works for these sizes, but cross-multiplication is exact and just as short.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "[\"1/2\"]" },
        { input: "3", expectedOutput: "[\"1/3\",\"1/2\",\"2/3\"]" },
        { input: "4", expectedOutput: "[\"1/4\",\"1/3\",\"1/2\",\"2/3\",\"3/4\"]" },
      ],
      hiddenCount: 200,
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        const n = shape < 6 ? ri(rng, 1, 30) : shape < 9 ? ri(rng, 31, 60) : ri(rng, 61, 100);
        return { input: String(n), expectedOutput: fmtStrArr(ref(n)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd
          from functools import cmp_to_key

          def simplifiedFractions(n: int) -> List[str]:
              pairs = [(a, b) for b in range(2, n + 1) for a in range(1, b) if gcd(a, b) == 1]
              pairs.sort(key=cmp_to_key(lambda p, q: p[0] * q[1] - q[0] * p[1]))
              return [str(a) + "/" + str(b) for a, b in pairs]
        `,
        javascript: code`
          var simplifiedFractions = function(n) {
              var gcd = function(x, y) {
                  while (y !== 0) {
                      var t = x % y;
                      x = y;
                      y = t;
                  }
                  return x;
              };
              var pairs = [];
              for (var b = 2; b <= n; b++) {
                  for (var a = 1; a < b; a++) if (gcd(a, b) === 1) pairs.push([a, b]);
              }
              pairs.sort(function(p, q) { return p[0] * q[1] - q[0] * p[1]; });
              return pairs.map(function(p) { return p[0] + "/" + p[1]; });
          };
        `,
        typescript: code`
          function simplifiedFractions(n: number): string[] {
              var gcd = function(x: number, y: number): number {
                  while (y !== 0) {
                      var t = x % y;
                      x = y;
                      y = t;
                  }
                  return x;
              };
              var pairs: number[][] = [];
              for (var b = 2; b <= n; b++) {
                  for (var a = 1; a < b; a++) if (gcd(a, b) === 1) pairs.push([a, b]);
              }
              pairs.sort(function(p, q) { return p[0] * q[1] - q[0] * p[1]; });
              var out: string[] = [];
              for (var i = 0; i < pairs.length; i++) out.push(pairs[i][0] + "/" + pairs[i][1]);
              return out;
          }
        `,
        java: code`
          static int sfGcd(int x, int y) {
              while (y != 0) {
                  int t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          public static String[] simplifiedFractions(int n) {
              List<int[]> pairs = new ArrayList<>();
              for (int b = 2; b <= n; b++) {
                  for (int a = 1; a < b; a++) if (sfGcd(a, b) == 1) pairs.add(new int[] {a, b});
              }
              pairs.sort((p, q) -> Integer.compare(p[0] * q[1], q[0] * p[1]));
              String[] out = new String[pairs.size()];
              for (int i = 0; i < out.length; i++) out[i] = pairs.get(i)[0] + "/" + pairs.get(i)[1];
              return out;
          }
        `,
        cpp: code`
          static int sfGcd(int x, int y) { while (y) { int t = x % y; x = y; y = t; } return x; }

          vector<string> simplifiedFractions(int n) {
              vector<pair<int, int>> pairs;
              for (int b = 2; b <= n; b++) {
                  for (int a = 1; a < b; a++) if (sfGcd(a, b) == 1) pairs.push_back({a, b});
              }
              sort(pairs.begin(), pairs.end(), [](const pair<int, int>& p, const pair<int, int>& q) {
                  return p.first * q.second < q.first * p.second;
              });
              vector<string> out;
              for (auto& p : pairs) out.push_back(to_string(p.first) + "/" + to_string(p.second));
              return out;
          }
        `,
        c: code`
          static int sfGcd(int x, int y) {
              while (y != 0) {
                  int t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          static int sfCmp(const void* x, const void* y) {
              const int* p = (const int*)x;
              const int* q = (const int*)y;
              int l = p[0] * q[1], r = q[0] * p[1];
              return (l > r) - (l < r);
          }

          char** simplifiedFractions(int n, int* returnSize) {
              int* pairs = (int*)malloc(sizeof(int) * 2 * (n * n + 1));
              int cnt = 0;
              for (int b = 2; b <= n; b++) {
                  for (int a = 1; a < b; a++) {
                      if (sfGcd(a, b) == 1) {
                          pairs[2 * cnt] = a;
                          pairs[2 * cnt + 1] = b;
                          cnt++;
                      }
                  }
              }
              qsort(pairs, cnt, sizeof(int) * 2, sfCmp);
              char** out = (char**)malloc(sizeof(char*) * (cnt + 1));
              for (int i = 0; i < cnt; i++) {
                  out[i] = (char*)malloc(12);
                  sprintf(out[i], "%d/%d", pairs[2 * i], pairs[2 * i + 1]);
              }
              free(pairs);
              *returnSize = cnt;
              return out;
          }
        `,
        csharp: code`
          static int SfGcd(int x, int y)
          {
              while (y != 0)
              {
                  int t = x % y;
                  x = y;
                  y = t;
              }
              return x;
          }

          public static string[] SimplifiedFractions(int n)
          {
              var pairs = new List<int[]>();
              for (int b = 2; b <= n; b++)
              {
                  for (int a = 1; a < b; a++) if (SfGcd(a, b) == 1) pairs.Add(new int[] { a, b });
              }
              pairs.Sort((p, q) => (p[0] * q[1]).CompareTo(q[0] * p[1]));
              var out1 = new string[pairs.Count];
              for (int i = 0; i < pairs.Count; i++) out1[i] = pairs[i][0] + "/" + pairs[i][1];
              return out1;
          }
        `,
        go: code`
          func sfGcd(x, y int) int {
          	for y != 0 {
          		x, y = y, x%y
          	}
          	return x
          }

          func simplifiedFractions(n int) []string {
          	pairs := [][2]int{}
          	for b := 2; b <= n; b++ {
          		for a := 1; a < b; a++ {
          			if sfGcd(a, b) == 1 {
          				pairs = append(pairs, [2]int{a, b})
          			}
          		}
          	}
          	sort.Slice(pairs, func(i, j int) bool {
          		return pairs[i][0]*pairs[j][1] < pairs[j][0]*pairs[i][1]
          	})
          	out := make([]string, len(pairs))
          	for i, p := range pairs {
          		out[i] = fmt.Sprintf("%d/%d", p[0], p[1])
          	}
          	return out
          }
        `,
        kotlin: code`
          fun sfGcd(x0: Int, y0: Int): Int {
              var x = x0
              var y = y0
              while (y != 0) {
                  val t = x % y
                  x = y
                  y = t
              }
              return x
          }

          fun simplifiedFractions(n: Int): Array<String> {
              val pairs = ArrayList<IntArray>()
              for (b in 2..n) {
                  for (a in 1 until b) if (sfGcd(a, b) == 1) pairs.add(intArrayOf(a, b))
              }
              pairs.sortWith(Comparator { p, q -> (p[0] * q[1]).compareTo(q[0] * p[1]) })
              return Array(pairs.size) { i -> pairs[i][0].toString() + "/" + pairs[i][1].toString() }
          }
        `,
        swift: code`
          func sfGcd(_ x0: Int, _ y0: Int) -> Int {
              var x = x0
              var y = y0
              while y != 0 {
                  let t = x % y
                  x = y
                  y = t
              }
              return x
          }

          func simplifiedFractions(_ n: Int) -> [String] {
              var pairs: [(Int, Int)] = []
              if n >= 2 {
                  for b in 2...n {
                      for a in 1..<b where sfGcd(a, b) == 1 {
                          pairs.append((a, b))
                      }
                  }
              }
              pairs.sort { $0.0 * $1.1 < $1.0 * $0.1 }
              return pairs.map { String($0.0) + "/" + String($0.1) }
          }
        `,
        rust: code`
          fn sf_gcd(x0: i32, y0: i32) -> i32 {
              let mut x = x0;
              let mut y = y0;
              while y != 0 {
                  let t = x % y;
                  x = y;
                  y = t;
              }
              x
          }

          fn simplifiedFractions(n: i32) -> Vec<String> {
              let mut pairs: Vec<(i32, i32)> = Vec::new();
              for b in 2..=n {
                  for a in 1..b {
                      if sf_gcd(a, b) == 1 {
                          pairs.push((a, b));
                      }
                  }
              }
              pairs.sort_by(|p, q| (p.0 * q.1).cmp(&(q.0 * p.1)));
              pairs.iter().map(|p| format!("{}/{}", p.0, p.1)).collect()
          }
        `,
        php: code`
          function sfGcd($x, $y) {
              while ($y != 0) {
                  $t = $x % $y;
                  $x = $y;
                  $y = $t;
              }
              return $x;
          }

          function simplifiedFractions($n) {
              $pairs = [];
              for ($b = 2; $b <= $n; $b++) {
                  for ($a = 1; $a < $b; $a++) if (sfGcd($a, $b) == 1) $pairs[] = [$a, $b];
              }
              usort($pairs, function ($p, $q) { return ($p[0] * $q[1]) <=> ($q[0] * $p[1]); });
              $out = [];
              foreach ($pairs as $p) $out[] = $p[0] . "/" . $p[1];
              return $out;
          }
        `,
        ruby: code`
          def simplifiedFractions(n)
            pairs = []
            (2..n).each do |b|
              (1...b).each { |a| pairs << [a, b] if a.gcd(b) == 1 }
            end
            pairs.sort! { |p, q| p[0] * q[1] <=> q[0] * p[1] }
            pairs.map { |a, b| a.to_s + "/" + b.to_s }
          end
        `,
      },
    };
  })(),

  // ── Number of Sets of K Non-Overlapping Line Segments (LC 1621) ─
  (() => {
    const MOD = 1000000007;
    // Brute-force DP for small n: f[i][j] = ways to place j segments inside
    // points 0..i (no segment ends at i, or the last one is [s, i]).
    const dpRef = (n: number, k: number) => {
      const f: number[][] = [];
      for (let i = 0; i < n; i++) {
        f.push(new Array(k + 1).fill(0));
        f[i][0] = 1;
        for (let j = 1; j <= k; j++) {
          let v = i > 0 ? f[i - 1][j] : 0;
          for (let s = 0; s < i; s++) v = (v + f[s][j - 1]) % MOD;
          f[i][j] = v;
        }
      }
      return f[n - 1][k];
    };
    // Pascal's triangle mod p (built once) for the closed form C(n+k-1, 2k).
    let pascal: Int32Array[] | null = null;
    const binom = (m: number, r: number) => {
      if (!pascal) {
        pascal = [];
        for (let i = 0; i <= 1999; i++) {
          const row = new Int32Array(i + 1);
          row[0] = 1; row[i] = 1;
          for (let j = 1; j < i; j++) row[j] = (pascal[i - 1][j - 1] + pascal[i - 1][j]) % MOD;
          pascal.push(row);
        }
      }
      return pascal[m][r];
    };
    const ref = (n: number, k: number) => {
      const r = binom(n + k - 1, 2 * k);
      if (n <= 40 && dpRef(n, k) !== r) throw new Error(`segments: mismatch at ${n} ${k}`);
      return r;
    };
    return {
      slug: "number-of-sets-of-k-non-overlapping-line-segments",
      title: "Number of Sets of K Non-Overlapping Line Segments",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Amazon", "Google"],
      signature: { funcName: "numberOfSets", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` points on a line at positions `x = 0, 1, …, n - 1`. Draw **exactly** `k` segments such that:\n\n- each segment starts and ends at one of the points and covers at least two points (its length is at least 1);\n- no two segments overlap, although they may **share an endpoint**;\n- the segments do not have to cover every point.\n\nReturn the number of different ways to draw them, modulo `10^9 + 7`.",
        [
          { in: "n = 4, k = 2", out: "5", note: "{(0,2),(2,3)}, {(0,1),(1,3)}, {(0,1),(2,3)}, {(1,2),(2,3)} and {(0,1),(1,2)}." },
          { in: "n = 3, k = 1", out: "3", note: "{(0,1)}, {(0,2)} and {(1,2)}." },
          { in: "n = 30, k = 7", out: "796297179", note: "The exact count is 3,796,297,200; modulo 10^9 + 7 it is 796,297,179." },
        ],
        ["2 <= n <= 1000", "1 <= k <= n - 1"]),
      hints: [
        "A DP works: let `f(i, j)` be the number of ways to place `j` segments among the first `i + 1` points, and decide whether a segment ends at point `i`. With prefix sums this is O(n·k).",
        "There is a neater view. Shared endpoints are the only obstacle to a plain 'choose 2k endpoints' count. What if you stretched each segment by one unit?",
        "Add `k - 1` extra points so that segments sharing an endpoint get separate ones: the configurations become choices of `2k` distinct points out of `n + k - 1`, so the answer is `C(n + k - 1, 2k)`.",
      ],
      editorial: explain({
        idea: "The answer is the binomial coefficient `C(n + k − 1, 2k)`: giving every segment except the last one an extra unit of length turns 'non-overlapping, possibly touching' into '2k distinct, strictly increasing endpoints'.",
        steps: [
          "Let `m = n + k - 1` and `r = 2k`.",
          "Compute `m · (m−1) · … · (m−r+1)` and `r!` modulo `p = 10^9 + 7`.",
          "Return the first product times the modular inverse of the second (Fermat: `r!^(p−2) mod p`).",
        ],
        why: "List the endpoints in order: `l1 < r1 <= l2 < r2 <= … <= lk < rk`, all in `0..n−1`. Shift the `i`-th segment's endpoints right by `i − 1` (so `l_i' = l_i + i − 1`, `r_i' = r_i + i − 1`). Then every `<=` becomes a strict `<`, the values range over `0..n+k−2`, and the map is reversible. So the sets of segments are exactly the 2k-element subsets of `n + k − 1` points, read off in sorted order.",
        time: "O(k + log p)",
        space: "O(1)",
        pitfalls: [
          "Products of two residues below 10^9 + 7 overflow 32 bits (and lose precision in a JavaScript double) — multiply in 64-bit or split the multiplication.",
          "The obvious DP is O(n²·k) without prefix sums — too slow at n = 1000.",
          "Forgetting that touching segments are allowed gives `C(n, 2k)`, which undercounts.",
        ],
      }),
      examples: [
        { input: "4\n2", expectedOutput: "5" },
        { input: "3\n1", expectedOutput: "3" },
        { input: "30\n7", expectedOutput: "796297179" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 19);
        const n = shape < 12 ? ri(rng, 2, 20) : shape < 17 ? ri(rng, 21, 200) : shape < 19 ? ri(rng, 201, 1000) : pick(rng, [2, 3, 1000, 999]);
        const k = ri(rng, 0, 5) === 0 ? pick(rng, [1, n - 1, Math.max(1, Math.floor(n / 2))]) : ri(rng, 1, n - 1);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: code`
          def numberOfSets(n: int, k: int) -> int:
              MOD = 10 ** 9 + 7
              m, r = n + k - 1, 2 * k
              num = 1
              den = 1
              for i in range(r):
                  num = num * (m - i) % MOD
                  den = den * (i + 1) % MOD
              return num * pow(den, MOD - 2, MOD) % MOD
        `,
        javascript: code`
          var numberOfSets = function(n, k) {
              var MOD = 1000000007;
              var mul = function(a, b) {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var power = function(base, e) {
                  var result = 1;
                  while (e > 0) {
                      if (e % 2 === 1) result = mul(result, base);
                      base = mul(base, base);
                      e = Math.floor(e / 2);
                  }
                  return result;
              };
              var m = n + k - 1, r = 2 * k;
              var num = 1, den = 1;
              for (var i = 0; i < r; i++) {
                  num = mul(num, m - i);
                  den = mul(den, i + 1);
              }
              return mul(num, power(den, MOD - 2));
          };
        `,
        typescript: code`
          function numberOfSets(n: number, k: number): number {
              var MOD = 1000000007;
              var mul = function(a: number, b: number): number {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var power = function(base: number, e: number): number {
                  var result = 1;
                  while (e > 0) {
                      if (e % 2 === 1) result = mul(result, base);
                      base = mul(base, base);
                      e = Math.floor(e / 2);
                  }
                  return result;
              };
              var m = n + k - 1, r = 2 * k;
              var num = 1, den = 1;
              for (var i = 0; i < r; i++) {
                  num = mul(num, m - i);
                  den = mul(den, i + 1);
              }
              return mul(num, power(den, MOD - 2));
          }
        `,
        java: code`
          public static int numberOfSets(int n, int k) {
              final long MOD = 1000000007L;
              long m = n + k - 1, r = 2L * k;
              long num = 1, den = 1;
              for (long i = 0; i < r; i++) {
                  num = num * (m - i) % MOD;
                  den = den * (i + 1) % MOD;
              }
              long inv = 1, base = den, e = MOD - 2;
              while (e > 0) {
                  if ((e & 1) == 1) inv = inv * base % MOD;
                  base = base * base % MOD;
                  e >>= 1;
              }
              return (int) (num * inv % MOD);
          }
        `,
        cpp: code`
          int numberOfSets(int n, int k) {
              const long long MOD = 1000000007LL;
              long long m = n + k - 1, r = 2LL * k;
              long long num = 1, den = 1;
              for (long long i = 0; i < r; i++) {
                  num = num * (m - i) % MOD;
                  den = den * (i + 1) % MOD;
              }
              long long inv = 1, base = den, e = MOD - 2;
              while (e > 0) {
                  if (e & 1) inv = inv * base % MOD;
                  base = base * base % MOD;
                  e >>= 1;
              }
              return (int)(num * inv % MOD);
          }
        `,
        c: code`
          int numberOfSets(int n, int k) {
              const long long MOD = 1000000007LL;
              long long m = n + k - 1, r = 2LL * k;
              long long num = 1, den = 1;
              for (long long i = 0; i < r; i++) {
                  num = num * (m - i) % MOD;
                  den = den * (i + 1) % MOD;
              }
              long long inv = 1, base = den, e = MOD - 2;
              while (e > 0) {
                  if (e & 1) inv = inv * base % MOD;
                  base = base * base % MOD;
                  e >>= 1;
              }
              return (int)(num * inv % MOD);
          }
        `,
        csharp: code`
          public static int NumberOfSets(int n, int k)
          {
              const long MOD = 1000000007L;
              long m = n + k - 1, r = 2L * k;
              long num = 1, den = 1;
              for (long i = 0; i < r; i++)
              {
                  num = num * (m - i) % MOD;
                  den = den * (i + 1) % MOD;
              }
              long inv = 1, b = den, e = MOD - 2;
              while (e > 0)
              {
                  if ((e & 1) == 1) inv = inv * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return (int)(num * inv % MOD);
          }
        `,
        go: code`
          func numberOfSets(n int, k int) int {
          	const MOD = 1000000007
          	m, r := n+k-1, 2*k
          	num, den := 1, 1
          	for i := 0; i < r; i++ {
          		num = num * (m - i) % MOD
          		den = den * (i + 1) % MOD
          	}
          	inv, b, e := 1, den, MOD-2
          	for e > 0 {
          		if e&1 == 1 {
          			inv = inv * b % MOD
          		}
          		b = b * b % MOD
          		e >>= 1
          	}
          	return num * inv % MOD
          }
        `,
        kotlin: code`
          fun numberOfSets(n: Int, k: Int): Int {
              val MOD = 1000000007L
              val m = (n + k - 1).toLong()
              val r = 2 * k
              var num = 1L
              var den = 1L
              for (i in 0 until r) {
                  num = num * (m - i) % MOD
                  den = den * (i + 1) % MOD
              }
              var inv = 1L
              var b = den
              var e = MOD - 2
              while (e > 0) {
                  if ((e and 1L) == 1L) inv = inv * b % MOD
                  b = b * b % MOD
                  e = e shr 1
              }
              return (num * inv % MOD).toInt()
          }
        `,
        swift: code`
          func numberOfSets(_ n: Int, _ k: Int) -> Int {
              let MOD = 1000000007
              let m = n + k - 1, r = 2 * k
              var num = 1
              var den = 1
              for i in 0..<r {
                  num = num * (m - i) % MOD
                  den = den * (i + 1) % MOD
              }
              var inv = 1
              var b = den
              var e = MOD - 2
              while e > 0 {
                  if e & 1 == 1 { inv = inv * b % MOD }
                  b = b * b % MOD
                  e >>= 1
              }
              return num * inv % MOD
          }
        `,
        rust: code`
          fn numberOfSets(n: i32, k: i32) -> i32 {
              const MOD: i64 = 1000000007;
              let m = (n + k - 1) as i64;
              let r = 2 * k as i64;
              let mut num: i64 = 1;
              let mut den: i64 = 1;
              for i in 0..r {
                  num = num * (m - i) % MOD;
                  den = den * (i + 1) % MOD;
              }
              let mut inv: i64 = 1;
              let mut b = den;
              let mut e = MOD - 2;
              while e > 0 {
                  if e & 1 == 1 {
                      inv = inv * b % MOD;
                  }
                  b = b * b % MOD;
                  e >>= 1;
              }
              (num * inv % MOD) as i32
          }
        `,
        php: code`
          function numberOfSets($n, $k) {
              $MOD = 1000000007;
              $m = $n + $k - 1;
              $r = 2 * $k;
              $num = 1;
              $den = 1;
              for ($i = 0; $i < $r; $i++) {
                  $num = $num * ($m - $i) % $MOD;
                  $den = $den * ($i + 1) % $MOD;
              }
              $inv = 1;
              $b = $den;
              $e = $MOD - 2;
              while ($e > 0) {
                  if ($e & 1) $inv = $inv * $b % $MOD;
                  $b = $b * $b % $MOD;
                  $e >>= 1;
              }
              return $num * $inv % $MOD;
          }
        `,
        ruby: code`
          def numberOfSets(n, k)
            mod = 1_000_000_007
            m = n + k - 1
            r = 2 * k
            num = 1
            den = 1
            i = 0
            while i < r
              num = num * (m - i) % mod
              den = den * (i + 1) % mod
              i += 1
            end
            num * den.pow(mod - 2, mod) % mod
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Consecutive Values You Can Make (LC 1798) ─
  (() => {
    // Brute force: the set of all subset sums, then the first missing value.
    const ref = (coins: number[]) => {
      let sums: Set<number>;
      if (coins.length <= 12) {
        sums = new Set<number>([0]);
        for (const c of coins) for (const s of Array.from(sums)) sums.add(s + c);
      } else {
        const total = coins.reduce((a, b) => a + b, 0);
        const can = new Uint8Array(total + 1);
        can[0] = 1;
        for (const c of coins) for (let s = total; s >= c; s--) if (can[s - c]) can[s] = 1;
        sums = new Set<number>();
        for (let s = 0; s <= total; s++) if (can[s]) sums.add(s);
      }
      let v = 0;
      while (sums.has(v)) v++;
      return v;
    };
    return {
      slug: "maximum-number-of-consecutive-values-you-can-make",
      title: "Maximum Number of Consecutive Values You Can Make",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "getMaximumConsecutive", params: [{ name: "coins", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You hold `n` coins with values `coins[0], …, coins[n-1]`. You can **make** a value `x` if some subset of your coins (each coin used at most once) adds up to exactly `x`; the empty subset makes `0`.\n\nReturn how many consecutive integer values, **starting from 0 and including it**, you can make.",
        [
          { in: "coins = [1,3]", out: "2", note: "You can make 0 and 1, but not 2." },
          { in: "coins = [1,1,1,4]", out: "8", note: "Every value from 0 to 7 can be made." },
          { in: "coins = [1,4,10,3,1]", out: "20" },
        ],
        ["coins.length == n", "1 <= n <= 4 * 10^4", "1 <= coins[i] <= 4 * 10^4"]),
      hints: [
        "Suppose you can already make every value in `[0, x)`. What happens when you add a coin of value `c`?",
        "You can now make every value in `[0, x)` and in `[c, c + x)`. These two ranges join into `[0, x + c)` exactly when `c <= x`.",
        "Process the coins from smallest to largest, growing `x`; stop at the first coin larger than `x`.",
      ],
      editorial: explain({
        idea: "Sort the coins and keep the invariant 'every value in `[0, reach)` can be made'; a coin `c` extends `reach` by `c` as long as `c <= reach`.",
        steps: [
          "Sort `coins` in increasing order and set `reach = 1` (only 0 is makeable with no coins).",
          "For each coin `c`: if `c > reach`, stop; otherwise `reach += c`.",
          "Return `reach`.",
        ],
        why: "If `[0, reach)` is makeable and `c <= reach`, then adding `c` to each of those sums covers `[c, c + reach)`, which overlaps or touches `[0, reach)`, so `[0, reach + c)` is makeable. If the next coin in sorted order is larger than `reach`, every remaining coin is too, and any sum that uses one of them is at least `reach + 1`, while sums of the earlier coins only reach `reach - 1` consecutively; so the value `reach` itself can never be made, and the count is `reach`.",
        time: "O(n log n)",
        space: "O(1) besides the sort",
        pitfalls: [
          "The count includes 0, so with coins `[2]` the answer is 1, not 0.",
          "Processing coins unsorted can stop too early at a large coin that a later small coin would have bridged.",
          "The total can reach 1.6·10^9 + 1 — still within int32, but do not add anything beyond it.",
        ],
      }),
      examples: [
        { input: "[1,3]", expectedOutput: "2" },
        { input: "[1,1,1,4]", expectedOutput: "8" },
        { input: "[1,4,10,3,1]", expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let coins: number[];
        if (shape < 4) {
          const top = pick(rng, [3, 10, 40]);
          coins = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, 1, top));
          // Usually hold a 1 — without one the answer is always 1.
          if (ri(rng, 0, 3) > 0) coins[ri(rng, 0, coins.length - 1)] = 1;
        }
        else if (shape < 6) {
          // Doubling-ish runs, so the greedy goes a long way.
          coins = [];
          let reach = 1;
          for (let i = 0, n = ri(rng, 1, 12); i < n; i++) { const c = ri(rng, 1, Math.min(40000, reach + ri(rng, 0, 1))); coins.push(c); reach += c; }
          shuffle(rng, coins);
        } else if (shape < 8) {
          coins = Array.from({ length: ri(rng, 13, 40) }, () => ri(rng, 1, 20));
          if (ri(rng, 0, 2) > 0) coins[ri(rng, 0, coins.length - 1)] = 1;
        } else if (shape === 8) coins = Array.from({ length: ri(rng, 1, 8) }, () => ri(rng, 1, 40000));
        else coins = Array.from({ length: ri(rng, 1, 12) }, () => pick(rng, [1, 2, 40000]));
        return { input: fmtIntArr(coins), expectedOutput: String(ref(coins)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getMaximumConsecutive(coins: List[int]) -> int:
              reach = 1
              for c in sorted(coins):
                  if c > reach:
                      break
                  reach += c
              return reach
        `,
        javascript: code`
          var getMaximumConsecutive = function(coins) {
              var sorted = coins.slice().sort(function(a, b) { return a - b; });
              var reach = 1;
              for (var i = 0; i < sorted.length; i++) {
                  if (sorted[i] > reach) break;
                  reach += sorted[i];
              }
              return reach;
          };
        `,
        typescript: code`
          function getMaximumConsecutive(coins: number[]): number {
              var sorted = coins.slice().sort(function(a, b) { return a - b; });
              var reach = 1;
              for (var i = 0; i < sorted.length; i++) {
                  if (sorted[i] > reach) break;
                  reach += sorted[i];
              }
              return reach;
          }
        `,
        java: code`
          public static int getMaximumConsecutive(int[] coins) {
              int[] sorted = coins.clone();
              Arrays.sort(sorted);
              long reach = 1;
              for (int c : sorted) {
                  if (c > reach) break;
                  reach += c;
              }
              return (int) reach;
          }
        `,
        cpp: code`
          int getMaximumConsecutive(vector<int>& coins) {
              vector<int> sorted = coins;
              sort(sorted.begin(), sorted.end());
              long long reach = 1;
              for (int c : sorted) {
                  if (c > reach) break;
                  reach += c;
              }
              return (int)reach;
          }
        `,
        c: code`
          static int mcCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int getMaximumConsecutive(int* coins, int coinsSize) {
              int* sorted = (int*)malloc(sizeof(int) * coinsSize);
              for (int i = 0; i < coinsSize; i++) sorted[i] = coins[i];
              qsort(sorted, coinsSize, sizeof(int), mcCmp);
              long long reach = 1;
              for (int i = 0; i < coinsSize; i++) {
                  if (sorted[i] > reach) break;
                  reach += sorted[i];
              }
              free(sorted);
              return (int)reach;
          }
        `,
        csharp: code`
          public static int GetMaximumConsecutive(int[] coins)
          {
              int[] sorted = (int[])coins.Clone();
              Array.Sort(sorted);
              long reach = 1;
              foreach (int c in sorted)
              {
                  if (c > reach) break;
                  reach += c;
              }
              return (int)reach;
          }
        `,
        go: code`
          func getMaximumConsecutive(coins []int) int {
          	sorted := append([]int(nil), coins...)
          	sort.Ints(sorted)
          	reach := 1
          	for _, c := range sorted {
          		if c > reach {
          			break
          		}
          		reach += c
          	}
          	return reach
          }
        `,
        kotlin: code`
          fun getMaximumConsecutive(coins: IntArray): Int {
              val sorted = coins.sortedArray()
              var reach = 1L
              for (c in sorted) {
                  if (c > reach) break
                  reach += c
              }
              return reach.toInt()
          }
        `,
        swift: code`
          func getMaximumConsecutive(_ coins: [Int]) -> Int {
              var reach = 1
              for c in coins.sorted() {
                  if c > reach { break }
                  reach += c
              }
              return reach
          }
        `,
        rust: code`
          fn getMaximumConsecutive(coins: Vec<i32>) -> i32 {
              let mut sorted = coins;
              sorted.sort();
              let mut reach: i64 = 1;
              for &c in sorted.iter() {
                  if c as i64 > reach {
                      break;
                  }
                  reach += c as i64;
              }
              reach as i32
          }
        `,
        php: code`
          function getMaximumConsecutive($coins) {
              $sorted = $coins;
              sort($sorted);
              $reach = 1;
              foreach ($sorted as $c) {
                  if ($c > $reach) break;
                  $reach += $c;
              }
              return $reach;
          }
        `,
        ruby: code`
          def getMaximumConsecutive(coins)
            sorted = coins.sort
            reach = 1
            i = 0
            while i < sorted.length && sorted[i] <= reach
              reach += sorted[i]
              i += 1
            end
            reach
          end
        `,
      },
    };
  })(),

  // ── Numbers With Repeated Digits (LC 1012) ──────────────────────
  (() => {
    // Independent reference: every positive integer below 10^9 whose digits are
    // all different (about 5.6 million of them), generated in increasing order
    // once; the answer is n minus how many of them are <= n.
    let unique: Int32Array | null = null;
    const build = () => {
      const out = new Int32Array(5611770);
      let size = 0;
      const dfs = (value: number, used: number, left: number) => {
        if (left === 0) { out[size++] = value; return; }
        for (let d = 0; d <= 9; d++) if (!(used & (1 << d))) dfs(value * 10 + d, used | (1 << d), left - 1);
      };
      for (let len = 1; len <= 9; len++) for (let first = 1; first <= 9; first++) dfs(first, 1 << first, len - 1);
      if (size !== out.length) throw new Error(`repeated-digits: built ${size}`);
      return out;
    };
    const ref = (n: number) => {
      if (!unique) unique = build();
      let lo = 0, hi = unique.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (unique[mid] <= n) lo = mid + 1; else hi = mid; }
      return n - lo;
    };
    return {
      slug: "numbers-with-repeated-digits",
      title: "Numbers With Repeated Digits",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Digit DP", "Combinatorics", "Google", "Amazon"],
      signature: { funcName: "numDupDigitsAtMostN", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return how many integers in the range `[1, n]` have **at least one repeated digit** — some digit appearing two or more times in their decimal form.",
        [
          { in: "n = 20", out: "1", note: "Only 11." },
          { in: "n = 100", out: "10", note: "11, 22, 33, 44, 55, 66, 77, 88, 99 and 100." },
          { in: "n = 1000", out: "262" },
        ],
        ["1 <= n <= 10^9"]),
      hints: [
        "Count the complement: numbers in `[1, n]` whose digits are all **different**, then subtract from `n`.",
        "Numbers with fewer digits than `n` are easy: with `L` digits there are `9 * 9 * 8 * …` of them (the first digit cannot be 0).",
        "For numbers with as many digits as `n`, walk along `n`'s digits: at position `i`, count unused digits smaller than `n[i]` (no leading zero), each followed by any arrangement of the remaining unused digits. Stop if `n[i]` was already used.",
      ],
      editorial: explain({
        idea: "Count the numbers ≤ n with all-distinct digits by permutation counting along the digits of `n` (a digit DP done in closed form), and subtract from `n`.",
        steps: [
          "Work with `n + 1` and count distinct-digit numbers strictly below it; let its digits be `s` with length `L`.",
          "Add numbers with fewer digits: for each length `len < L`, `9 · P(9, len − 1)`, where `P(a, b) = a!/(a−b)!`.",
          "Walk `s` from the left with a set of used digits. At position `i`, for each digit `x < s[i]` (from 1 at the first position, from 0 later) that is not used, add `P(9 − i, L − i − 1)` — the ways to fill the rest with distinct unused digits.",
          "If `s[i]` is already used, stop; otherwise mark it used and continue.",
          "Return `n − count`.",
        ],
        why: "Each number below `n + 1` with the same length agrees with it on a prefix and then has a smaller digit at the first difference; grouping by that position and digit counts each exactly once. After fixing `i + 1` distinct digits, the remaining `L − i − 1` positions take distinct digits from the `10 − (i + 1) = 9 − i` unused ones, in `P(9 − i, L − i − 1)` ways. Once the prefix of `s` itself repeats a digit, every longer extension of it repeats too, so the walk can stop. Using `n + 1` makes the 'strictly below' count include `n` itself.",
        time: "O(L · 10) with L ≤ 10",
        space: "O(1)",
        pitfalls: [
          "Leading zeros: the first digit ranges over 1–9, later digits over 0–9.",
          "Forgetting to stop when a digit of `n` repeats — later positions would count numbers that share that repeated prefix.",
          "Counting below `n` instead of up to `n` misses `n` itself (use `n + 1`, or add 1 when `n` has distinct digits).",
        ],
      }),
      examples: [
        { input: "20", expectedOutput: "1" },
        { input: "100", expectedOutput: "10" },
        { input: "1000", expectedOutput: "262" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        let n: number;
        if (shape < 3) n = ri(rng, 1, 1000);
        else if (shape < 5) n = ri(rng, 1001, 100000);
        else if (shape < 9) n = ri(rng, 100001, 1000000000);
        else n = pick(rng, [1, 10, 11, 99, 100, 1000, 98765, 123456789, 987654321, 999999999, 1000000000]);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def numDupDigitsAtMostN(n: int) -> int:
              def perm(m: int, r: int) -> int:
                  res = 1
                  for i in range(r):
                      res *= m - i
                  return res

              digits = [int(c) for c in str(n + 1)]
              length = len(digits)
              unique = 0
              for size in range(1, length):
                  unique += 9 * perm(9, size - 1)
              seen = set()
              for i, d in enumerate(digits):
                  for x in range(1 if i == 0 else 0, d):
                      if x not in seen:
                          unique += perm(9 - i, length - i - 1)
                  if d in seen:
                      break
                  seen.add(d)
              return n - unique
        `,
        javascript: code`
          var numDupDigitsAtMostN = function(n) {
              var perm = function(m, r) {
                  var res = 1;
                  for (var i = 0; i < r; i++) res *= m - i;
                  return res;
              };
              var s = String(n + 1);
              var length = s.length;
              var unique = 0;
              for (var size = 1; size < length; size++) unique += 9 * perm(9, size - 1);
              var seen = [false, false, false, false, false, false, false, false, false, false];
              for (var i = 0; i < length; i++) {
                  var d = s.charCodeAt(i) - 48;
                  for (var x = i === 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += perm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return n - unique;
          };
        `,
        typescript: code`
          function numDupDigitsAtMostN(n: number): number {
              var perm = function(m: number, r: number): number {
                  var res = 1;
                  for (var i = 0; i < r; i++) res *= m - i;
                  return res;
              };
              var s = "" + (n + 1);
              var length = s.length;
              var unique = 0;
              for (var size = 1; size < length; size++) unique += 9 * perm(9, size - 1);
              var seen: boolean[] = [false, false, false, false, false, false, false, false, false, false];
              for (var i = 0; i < length; i++) {
                  var d = s.charCodeAt(i) - 48;
                  for (var x = i === 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += perm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return n - unique;
          }
        `,
        java: code`
          static int ndPerm(int m, int r) {
              int res = 1;
              for (int i = 0; i < r; i++) res *= m - i;
              return res;
          }

          public static int numDupDigitsAtMostN(int n) {
              String s = String.valueOf((long) n + 1);
              int length = s.length();
              long unique = 0;
              for (int size = 1; size < length; size++) unique += 9L * ndPerm(9, size - 1);
              boolean[] seen = new boolean[10];
              for (int i = 0; i < length; i++) {
                  int d = s.charAt(i) - '0';
                  for (int x = i == 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += ndPerm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return (int) (n - unique);
          }
        `,
        cpp: code`
          static int ndPerm(int m, int r) {
              int res = 1;
              for (int i = 0; i < r; i++) res *= m - i;
              return res;
          }

          int numDupDigitsAtMostN(int n) {
              string s = to_string((long long)n + 1);
              int length = s.size();
              long long unique = 0;
              for (int size = 1; size < length; size++) unique += 9LL * ndPerm(9, size - 1);
              bool seen[10] = {false};
              for (int i = 0; i < length; i++) {
                  int d = s[i] - '0';
                  for (int x = i == 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += ndPerm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return (int)(n - unique);
          }
        `,
        c: code`
          static int ndPerm(int m, int r) {
              int res = 1;
              for (int i = 0; i < r; i++) res *= m - i;
              return res;
          }

          int numDupDigitsAtMostN(int n) {
              int rev[12], digits[12], length = 0;
              for (long long t = (long long)n + 1; t > 0; t /= 10) rev[length++] = (int)(t % 10);
              for (int i = 0; i < length; i++) digits[i] = rev[length - 1 - i];
              long long unique = 0;
              for (int size = 1; size < length; size++) unique += 9LL * ndPerm(9, size - 1);
              bool seen[10] = {false};
              for (int i = 0; i < length; i++) {
                  int d = digits[i];
                  for (int x = i == 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += ndPerm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return (int)(n - unique);
          }
        `,
        csharp: code`
          static int NdPerm(int m, int r)
          {
              int res = 1;
              for (int i = 0; i < r; i++) res *= m - i;
              return res;
          }

          public static int NumDupDigitsAtMostN(int n)
          {
              string s = ((long)n + 1).ToString();
              int length = s.Length;
              long unique = 0;
              for (int size = 1; size < length; size++) unique += 9L * NdPerm(9, size - 1);
              bool[] seen = new bool[10];
              for (int i = 0; i < length; i++)
              {
                  int d = s[i] - '0';
                  for (int x = i == 0 ? 1 : 0; x < d; x++) if (!seen[x]) unique += NdPerm(9 - i, length - i - 1);
                  if (seen[d]) break;
                  seen[d] = true;
              }
              return (int)(n - unique);
          }
        `,
        go: code`
          func ndPerm(m, r int) int {
          	res := 1
          	for i := 0; i < r; i++ {
          		res *= m - i
          	}
          	return res
          }

          func numDupDigitsAtMostN(n int) int {
          	s := strconv.Itoa(n + 1)
          	length := len(s)
          	unique := 0
          	for size := 1; size < length; size++ {
          		unique += 9 * ndPerm(9, size-1)
          	}
          	seen := make([]bool, 10)
          	for i := 0; i < length; i++ {
          		d := int(s[i] - '0')
          		start := 0
          		if i == 0 {
          			start = 1
          		}
          		for x := start; x < d; x++ {
          			if !seen[x] {
          				unique += ndPerm(9-i, length-i-1)
          			}
          		}
          		if seen[d] {
          			break
          		}
          		seen[d] = true
          	}
          	return n - unique
          }
        `,
        kotlin: code`
          fun ndPerm(m: Int, r: Int): Int {
              var res = 1
              for (i in 0 until r) res *= m - i
              return res
          }

          fun numDupDigitsAtMostN(n: Int): Int {
              val s = (n.toLong() + 1).toString()
              val length = s.length
              var unique = 0L
              for (size in 1 until length) unique += 9L * ndPerm(9, size - 1)
              val seen = BooleanArray(10)
              for (i in 0 until length) {
                  val d = s[i] - '0'
                  for (x in (if (i == 0) 1 else 0) until d) if (!seen[x]) unique += ndPerm(9 - i, length - i - 1)
                  if (seen[d]) break
                  seen[d] = true
              }
              return (n - unique).toInt()
          }
        `,
        swift: code`
          func ndPerm(_ m: Int, _ r: Int) -> Int {
              var res = 1
              var i = 0
              while i < r {
                  res *= m - i
                  i += 1
              }
              return res
          }

          func numDupDigitsAtMostN(_ n: Int) -> Int {
              let digits = Array(String(n + 1).utf8).map { Int($0) - 48 }
              let length = digits.count
              var unique = 0
              var size = 1
              while size < length {
                  unique += 9 * ndPerm(9, size - 1)
                  size += 1
              }
              var seen = [Bool](repeating: false, count: 10)
              for i in 0..<length {
                  let d = digits[i]
                  var x = i == 0 ? 1 : 0
                  while x < d {
                      if !seen[x] { unique += ndPerm(9 - i, length - i - 1) }
                      x += 1
                  }
                  if seen[d] { break }
                  seen[d] = true
              }
              return n - unique
          }
        `,
        rust: code`
          fn nd_perm(m: i64, r: i64) -> i64 {
              let mut res: i64 = 1;
              for i in 0..r {
                  res *= m - i;
              }
              res
          }

          fn numDupDigitsAtMostN(n: i32) -> i32 {
              let digits: Vec<i64> = (n as i64 + 1).to_string().bytes().map(|b| (b - b'0') as i64).collect();
              let length = digits.len() as i64;
              let mut unique: i64 = 0;
              for size in 1..length {
                  unique += 9 * nd_perm(9, size - 1);
              }
              let mut seen = [false; 10];
              for i in 0..length {
                  let d = digits[i as usize];
                  let start = if i == 0 { 1 } else { 0 };
                  for x in start..d {
                      if !seen[x as usize] {
                          unique += nd_perm(9 - i, length - i - 1);
                      }
                  }
                  if seen[d as usize] {
                      break;
                  }
                  seen[d as usize] = true;
              }
              (n as i64 - unique) as i32
          }
        `,
        php: code`
          function ndPerm($m, $r) {
              $res = 1;
              for ($i = 0; $i < $r; $i++) $res *= $m - $i;
              return $res;
          }

          function numDupDigitsAtMostN($n) {
              $s = strval($n + 1);
              $length = strlen($s);
              $unique = 0;
              for ($size = 1; $size < $length; $size++) $unique += 9 * ndPerm(9, $size - 1);
              $seen = array_fill(0, 10, false);
              for ($i = 0; $i < $length; $i++) {
                  $d = ord($s[$i]) - 48;
                  for ($x = $i == 0 ? 1 : 0; $x < $d; $x++) if (!$seen[$x]) $unique += ndPerm(9 - $i, $length - $i - 1);
                  if ($seen[$d]) break;
                  $seen[$d] = true;
              }
              return $n - $unique;
          }
        `,
        ruby: code`
          def nd_perm(m, r)
            res = 1
            r.times { |i| res *= m - i }
            res
          end

          def numDupDigitsAtMostN(n)
            digits = (n + 1).to_s.chars.map(&:to_i)
            length = digits.length
            unique = 0
            (1...length).each { |size| unique += 9 * nd_perm(9, size - 1) }
            seen = Array.new(10, false)
            i = 0
            while i < length
              d = digits[i]
              x = i == 0 ? 1 : 0
              while x < d
                unique += nd_perm(9 - i, length - i - 1) unless seen[x]
                x += 1
              end
              break if seen[d]
              seen[d] = true
              i += 1
            end
            n - unique
          end
        `,
      },
    };
  })(),

];

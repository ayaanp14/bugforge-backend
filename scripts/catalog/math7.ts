/**
 * Math II & geometry problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h, so
 * square roots are integer loops and INT_MAX is written out.
 *
 * Modular answers: products of two residues below 1e9+7 pass 2^53, so the
 * JavaScript and TypeScript solutions multiply through a 16-bit split
 * (`mulMod`) instead of `a * b % M`; every typed language multiplies in 64 bits.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const MATH7_PROBLEMS: CatalogProblem[] = [

  // ── Rectangle Area (LC 223) ──────────────────────────────────────
  (() => {
    const ref = (ax1: number, ay1: number, ax2: number, ay2: number, bx1: number, by1: number, bx2: number, by2: number) => {
      const all = [ax1, ay1, ax2, ay2, bx1, by1, bx2, by2];
      if (all.every((v) => Math.abs(v) <= 12)) {
        // Count unit cells covered by either rectangle.
        let c = 0;
        for (let x = -12; x < 12; x++) {
          for (let y = -12; y < 12; y++) {
            const inA = x >= ax1 && x + 1 <= ax2 && y >= ay1 && y + 1 <= ay2;
            const inB = x >= bx1 && x + 1 <= bx2 && y >= by1 && y + 1 <= by2;
            if (inA || inB) c++;
          }
        }
        return c;
      }
      const w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
      const h = Math.min(ay2, by2) - Math.max(ay1, by1);
      return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - (w > 0 && h > 0 ? w * h : 0);
    };
    const fmt = (v: number[]) => v.join("\n");
    return {
      slug: "rectangle-area",
      title: "Rectangle Area",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Geometry", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "computeArea",
        params: [
          { name: "ax1", type: "int" as const }, { name: "ay1", type: "int" as const },
          { name: "ax2", type: "int" as const }, { name: "ay2", type: "int" as const },
          { name: "bx1", type: "int" as const }, { name: "by1", type: "int" as const },
          { name: "bx2", type: "int" as const }, { name: "by2", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "Two rectangles lie in the plane with their sides parallel to the axes. Rectangle A has bottom-left corner `(ax1, ay1)` and top-right corner `(ax2, ay2)`; rectangle B has bottom-left corner `(bx1, by1)` and top-right corner `(bx2, by2)`.\n\nReturn the **total area covered** by the two rectangles together. Ground covered by both counts once.\n\nA rectangle may be degenerate (zero width or zero height); it then covers no area.",
        [
          { in: "ax1 = 0, ay1 = 0, ax2 = 4, ay2 = 3, bx1 = 2, by1 = 1, bx2 = 6, by2 = 5", out: "24", note: "A covers 12, B covers 16, and they share the 2 x 2 square from (2,1) to (4,3), so 12 + 16 - 4 = 24." },
          { in: "ax1 = -2, ay1 = -2, ax2 = 2, ay2 = 2, bx1 = -2, by1 = -2, bx2 = 2, by2 = 2", out: "16", note: "The rectangles coincide." },
          { in: "ax1 = 0, ay1 = 0, ax2 = 1, ay2 = 1, bx1 = 5, by1 = 5, bx2 = 7, by2 = 8", out: "7" },
        ],
        ["-10^4 <= ax1 <= ax2 <= 10^4", "-10^4 <= ay1 <= ay2 <= 10^4", "-10^4 <= bx1 <= bx2 <= 10^4", "-10^4 <= by1 <= by2 <= 10^4"]),
      hints: [
        "Add the two areas, then remove whatever was counted twice.",
        "The shared part of two axis-parallel rectangles is itself a rectangle (or empty).",
        "Its width is `min(ax2, bx2) - max(ax1, bx1)` and its height is the same in y; it is empty if either is not positive.",
      ],
      editorial: explain({
        idea: "Inclusion-exclusion: covered area = area(A) + area(B) - area(A ∩ B), and the intersection of two axis-parallel rectangles is found one axis at a time.",
        steps: [
          "Compute `areaA = (ax2 - ax1) * (ay2 - ay1)` and `areaB` the same way.",
          "The overlap's x-extent runs from `max(ax1, bx1)` to `min(ax2, bx2)`; its width is the difference.",
          "Do the same in y to get the height.",
          "If both width and height are positive, subtract `width * height`; otherwise subtract nothing.",
        ],
        why: "A point lies in both rectangles exactly when its x lies in both x-intervals and its y lies in both y-intervals, so the intersection is the product of the two interval intersections. An interval intersection `[max of starts, min of ends]` is empty when the start passes the end, which is why a non-positive width or height means no overlap. Adding both areas counts the intersection twice, so subtracting it once leaves every covered point counted exactly once.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "If the rectangles are apart, `min - max` is negative in that axis; multiplying two negative extents gives a positive bogus overlap, so test each sign before multiplying.",
          "Rectangles that only touch along an edge share zero area.",
          "Each area is at most 4·10^8, so the sum still fits in 32 bits — but compute the overlap separately rather than as one big expression with signs mixed.",
        ],
      }),
      examples: [
        { input: fmt([0, 0, 4, 3, 2, 1, 6, 5]), expectedOutput: "24" },
        { input: fmt([-2, -2, 2, 2, -2, -2, 2, 2]), expectedOutput: "16" },
        { input: fmt([0, 0, 1, 1, 5, 5, 7, 8]), expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const lim = pick(rng, [12, 12, 12, 100, 10000]);
        const span = () => { const a = ri(rng, -lim, lim); return [a, ri(rng, a, lim)]; };
        let [ax1, ax2] = span(); let [ay1, ay2] = span();
        let [bx1, bx2] = span(); let [by1, by2] = span();
        const shape = ri(rng, 0, 9);
        if (shape === 0) { bx1 = ax1; bx2 = ax2; by1 = ay1; by2 = ay2; }
        else if (shape === 1) { bx1 = ri(rng, ax1, ax2); bx2 = ri(rng, bx1, ax2); by1 = ri(rng, ay1, ay2); by2 = ri(rng, by1, ay2); }
        else if (shape === 2) { bx1 = ax2; bx2 = ri(rng, bx1, lim); }
        else if (shape === 3) { ax2 = ax1; }
        else if (shape === 4 && lim === 10000) { ax1 = -10000; ax2 = 10000; ay1 = -10000; ay2 = 10000; }
        const v = [ax1, ay1, ax2, ay2, bx1, by1, bx2, by2];
        if (rng() < 0.5) { const t = v.slice(0, 4); for (let i = 0; i < 4; i++) { v[i] = v[i + 4]; v[i + 4] = t[i]; } }
        return { input: fmt(v), expectedOutput: String(ref(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7])) };
      },
      solutions: {
        python: code`
          def computeArea(ax1: int, ay1: int, ax2: int, ay2: int, bx1: int, by1: int, bx2: int, by2: int) -> int:
              area_a = (ax2 - ax1) * (ay2 - ay1)
              area_b = (bx2 - bx1) * (by2 - by1)
              w = min(ax2, bx2) - max(ax1, bx1)
              h = min(ay2, by2) - max(ay1, by1)
              overlap = w * h if w > 0 and h > 0 else 0
              return area_a + area_b - overlap
        `,
        javascript: code`
          var computeArea = function(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
              var areaA = (ax2 - ax1) * (ay2 - ay1);
              var areaB = (bx2 - bx1) * (by2 - by1);
              var w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
              var h = Math.min(ay2, by2) - Math.max(ay1, by1);
              var overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          };
        `,
        typescript: code`
          function computeArea(ax1: number, ay1: number, ax2: number, ay2: number, bx1: number, by1: number, bx2: number, by2: number): number {
              var areaA = (ax2 - ax1) * (ay2 - ay1);
              var areaB = (bx2 - bx1) * (by2 - by1);
              var w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
              var h = Math.min(ay2, by2) - Math.max(ay1, by1);
              var overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          }
        `,
        java: code`
          public static int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
              int areaA = (ax2 - ax1) * (ay2 - ay1);
              int areaB = (bx2 - bx1) * (by2 - by1);
              int w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
              int h = Math.min(ay2, by2) - Math.max(ay1, by1);
              int overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          }
        `,
        cpp: code`
          int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
              int areaA = (ax2 - ax1) * (ay2 - ay1);
              int areaB = (bx2 - bx1) * (by2 - by1);
              int w = min(ax2, bx2) - max(ax1, bx1);
              int h = min(ay2, by2) - max(ay1, by1);
              int overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          }
        `,
        c: code`
          int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
              int areaA = (ax2 - ax1) * (ay2 - ay1);
              int areaB = (bx2 - bx1) * (by2 - by1);
              int left = ax1 > bx1 ? ax1 : bx1;
              int right = ax2 < bx2 ? ax2 : bx2;
              int bottom = ay1 > by1 ? ay1 : by1;
              int top = ay2 < by2 ? ay2 : by2;
              int w = right - left;
              int h = top - bottom;
              int overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          }
        `,
        csharp: code`
          public static int ComputeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2)
          {
              int areaA = (ax2 - ax1) * (ay2 - ay1);
              int areaB = (bx2 - bx1) * (by2 - by1);
              int w = Math.Min(ax2, bx2) - Math.Max(ax1, bx1);
              int h = Math.Min(ay2, by2) - Math.Max(ay1, by1);
              int overlap = (w > 0 && h > 0) ? w * h : 0;
              return areaA + areaB - overlap;
          }
        `,
        go: code`
          func computeArea(ax1 int, ay1 int, ax2 int, ay2 int, bx1 int, by1 int, bx2 int, by2 int) int {
              areaA := (ax2 - ax1) * (ay2 - ay1)
              areaB := (bx2 - bx1) * (by2 - by1)
              left, right := ax1, ax2
              if bx1 > left {
                  left = bx1
              }
              if bx2 < right {
                  right = bx2
              }
              bottom, top := ay1, ay2
              if by1 > bottom {
                  bottom = by1
              }
              if by2 < top {
                  top = by2
              }
              overlap := 0
              if right > left && top > bottom {
                  overlap = (right - left) * (top - bottom)
              }
              return areaA + areaB - overlap
          }
        `,
        kotlin: code`
          fun computeArea(ax1: Int, ay1: Int, ax2: Int, ay2: Int, bx1: Int, by1: Int, bx2: Int, by2: Int): Int {
              val areaA = (ax2 - ax1) * (ay2 - ay1)
              val areaB = (bx2 - bx1) * (by2 - by1)
              val w = minOf(ax2, bx2) - maxOf(ax1, bx1)
              val h = minOf(ay2, by2) - maxOf(ay1, by1)
              val overlap = if (w > 0 && h > 0) w * h else 0
              return areaA + areaB - overlap
          }
        `,
        swift: code`
          func computeArea(_ ax1: Int, _ ay1: Int, _ ax2: Int, _ ay2: Int, _ bx1: Int, _ by1: Int, _ bx2: Int, _ by2: Int) -> Int {
              let areaA = (ax2 - ax1) * (ay2 - ay1)
              let areaB = (bx2 - bx1) * (by2 - by1)
              let w = min(ax2, bx2) - max(ax1, bx1)
              let h = min(ay2, by2) - max(ay1, by1)
              let overlap = (w > 0 && h > 0) ? w * h : 0
              return areaA + areaB - overlap
          }
        `,
        rust: code`
          fn computeArea(ax1: i32, ay1: i32, ax2: i32, ay2: i32, bx1: i32, by1: i32, bx2: i32, by2: i32) -> i32 {
              let area_a = (ax2 - ax1) * (ay2 - ay1);
              let area_b = (bx2 - bx1) * (by2 - by1);
              let w = std::cmp::min(ax2, bx2) - std::cmp::max(ax1, bx1);
              let h = std::cmp::min(ay2, by2) - std::cmp::max(ay1, by1);
              let overlap = if w > 0 && h > 0 { w * h } else { 0 };
              area_a + area_b - overlap
          }
        `,
        php: code`
          function computeArea($ax1, $ay1, $ax2, $ay2, $bx1, $by1, $bx2, $by2) {
              $areaA = ($ax2 - $ax1) * ($ay2 - $ay1);
              $areaB = ($bx2 - $bx1) * ($by2 - $by1);
              $w = min($ax2, $bx2) - max($ax1, $bx1);
              $h = min($ay2, $by2) - max($ay1, $by1);
              $overlap = ($w > 0 && $h > 0) ? $w * $h : 0;
              return $areaA + $areaB - $overlap;
          }
        `,
        ruby: code`
          def computeArea(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
            area_a = (ax2 - ax1) * (ay2 - ay1)
            area_b = (bx2 - bx1) * (by2 - by1)
            w = [ax2, bx2].min - [ax1, bx1].max
            h = [ay2, by2].min - [ay1, by1].max
            overlap = (w > 0 && h > 0) ? w * h : 0
            area_a + area_b - overlap
          end
        `,
      },
    };
  })(),

  // ── Valid Square (LC 593) ────────────────────────────────────────
  (() => {
    const d2 = (a: number[], b: number[]) => (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
    const ref = (pts: number[][]) => {
      // Try every cyclic order of the four points as a quadrilateral.
      const orders = [[0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3]];
      for (const o of orders) {
        const [a, b, c, d] = o.map((i) => pts[i]);
        const s = d2(a, b);
        if (s === 0) continue;
        if (d2(b, c) !== s || d2(c, d) !== s || d2(d, a) !== s) continue;
        if (d2(a, c) === 2 * s && d2(b, d) === 2 * s) return true;
      }
      return false;
    };
    return {
      slug: "valid-square",
      title: "Valid Square",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Geometry", "Google", "Amazon"],
      signature: {
        funcName: "validSquare",
        params: [
          { name: "p1", type: "int[]" as const }, { name: "p2", type: "int[]" as const },
          { name: "p3", type: "int[]" as const }, { name: "p4", type: "int[]" as const },
        ],
        returns: "bool" as const,
      },
      description: describe(
        "You are given four points `p1`, `p2`, `p3` and `p4` in the plane, each as `[x, y]` with integer coordinates. They are listed in **no particular order**.\n\nReturn `true` if the four points are the corners of a square. The square does not have to be aligned with the axes, but it must have positive side length: four sides of equal positive length and four right angles.",
        [
          { in: "p1 = [1,0], p2 = [3,1], p3 = [2,3], p4 = [0,2]", out: "true", note: "A square tilted by the vector (2,1): every side has squared length 5 and both diagonals have squared length 10." },
          { in: "p1 = [0,0], p2 = [1,1], p3 = [1,0], p4 = [0,12]", out: "false" },
          { in: "p1 = [5,5], p2 = [5,5], p3 = [5,5], p4 = [5,5]", out: "false", note: "A single point is not a square." },
        ],
        ["p1.length == p2.length == p3.length == p4.length == 2", "-10^4 <= xi, yi <= 10^4"]),
      hints: [
        "The input order means nothing, so look at all six pairwise distances instead of walking around the shape.",
        "Squared distances stay integers — never take a square root.",
        "In a square the four smallest of those six values are equal and positive, and the two largest are equal and exactly twice as big.",
      ],
      editorial: explain({
        idea: "A square is pinned down by its six pairwise distances: four equal sides and two equal diagonals, each diagonal twice the side when squared. Sorting the six squared distances lets you check that without knowing which point is which corner.",
        steps: [
          "Compute the squared distance for each of the six pairs of points.",
          "Sort the six values.",
          "Return `true` exactly when the smallest is positive, the first four are equal, the last two are equal, and the last equals twice the first.",
        ],
        why: "For a real square the four sides are the four smallest distances and the diagonals (squared length `2s`) are the two largest, so the test passes. Conversely, suppose four pairs share the squared length `s > 0` and the other two share `2s`. The two long pairs cannot share a point — a point at squared distance `2s` from two others, with those two at distance `s` from each other and everything else `s`, is impossible — so the long pairs are two disjoint 'diagonals' and the short pairs form a closed 4-cycle with equal sides, a rhombus. A rhombus with equal diagonals is a square, and `d² = 2s²` confirms it.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Duplicate points give zero distances; insist the smallest squared distance is positive.",
          "Checking only 'four equal, two equal' without the factor of 2 is the usual shortcut — it is safe on integer points, but the explicit check costs nothing and does not lean on that fact.",
          "Do not assume `p1, p2, p3, p4` go around the square in order.",
        ],
      }),
      examples: [
        { input: "[1,0]\n[3,1]\n[2,3]\n[0,2]", expectedOutput: "true" },
        { input: "[0,0]\n[1,1]\n[1,0]\n[0,12]", expectedOutput: "false" },
        { input: "[5,5]\n[5,5]\n[5,5]\n[5,5]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const S = pick(rng, [2, 4, 20, 300, 3000]);
        const lim = 10000 - 2 * S;
        const base = [ri(rng, -lim, lim), ri(rng, -lim, lim)];
        const add = (p: number[], v: number[]) => [p[0] + v[0], p[1] + v[1]];
        const vec = () => { let v = [0, 0]; while (v[0] === 0 && v[1] === 0) v = [ri(rng, -S, S), ri(rng, -S, S)]; return v; };
        const kind = ri(rng, 0, 9);
        let pts: number[][];
        if (kind <= 3) {
          const v = vec(); const r = [-v[1], v[0]];
          pts = [base, add(base, v), add(add(base, v), r), add(base, r)];
          if (kind === 3) { const i = ri(rng, 0, 3); pts[i] = [pts[i][0] + pick(rng, [-1, 1]), pts[i][1]]; }
        } else if (kind === 4) {
          // Rhombus that is not a square: sides (a,b) and (b,a).
          let a = ri(rng, 1, S), b = ri(rng, 1, S);
          if (a === b) b = a + 1 <= S ? a + 1 : a - 1;
          if (b === 0) { a = 2; b = 1; }
          const v = [a, b], w = [b, a];
          pts = [base, add(base, v), add(add(base, v), w), add(base, w)];
        } else if (kind === 5) {
          // Rectangle that is not a square.
          const v = vec(); const k = ri(rng, 2, 3); const r = [-v[1] * k, v[0] * k];
          const r2 = [Math.max(-S, Math.min(S, r[0])), Math.max(-S, Math.min(S, r[1]))];
          pts = [base, add(base, v), add(add(base, v), r2), add(base, r2)];
        } else if (kind === 6) {
          const q = [base, add(base, vec())];
          pts = [q[0], q[ri(rng, 0, 1)], q[1], q[ri(rng, 0, 1)]];
        } else if (kind === 7) {
          pts = [base, base, base, base];
        } else {
          pts = Array.from({ length: 4 }, () => add(base, [ri(rng, -S, S), ri(rng, -S, S)]));
        }
        pts = shuffle(rng, pts.map((p) => [p[0], p[1]]));
        return { input: pts.map((p) => fmtIntArr(p)).join("\n"), expectedOutput: bool(ref(pts)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validSquare(p1: List[int], p2: List[int], p3: List[int], p4: List[int]) -> bool:
              pts = [p1, p2, p3, p4]
              d = []
              for i in range(4):
                  for j in range(i + 1, 4):
                      dx = pts[i][0] - pts[j][0]
                      dy = pts[i][1] - pts[j][1]
                      d.append(dx * dx + dy * dy)
              d.sort()
              return d[0] > 0 and d[0] == d[3] and d[4] == d[5] and d[4] == 2 * d[0]
        `,
        javascript: code`
          var validSquare = function(p1, p2, p3, p4) {
              var pts = [p1, p2, p3, p4];
              var d = [];
              for (var i = 0; i < 4; i++) {
                  for (var j = i + 1; j < 4; j++) {
                      var dx = pts[i][0] - pts[j][0];
                      var dy = pts[i][1] - pts[j][1];
                      d.push(dx * dx + dy * dy);
                  }
              }
              d.sort(function(a, b) { return a - b; });
              return d[0] > 0 && d[0] === d[3] && d[4] === d[5] && d[4] === 2 * d[0];
          };
        `,
        typescript: code`
          function validSquare(p1: number[], p2: number[], p3: number[], p4: number[]): boolean {
              var pts: number[][] = [p1, p2, p3, p4];
              var d: number[] = [];
              for (var i = 0; i < 4; i++) {
                  for (var j = i + 1; j < 4; j++) {
                      var dx = pts[i][0] - pts[j][0];
                      var dy = pts[i][1] - pts[j][1];
                      d.push(dx * dx + dy * dy);
                  }
              }
              d.sort(function(a, b) { return a - b; });
              return d[0] > 0 && d[0] === d[3] && d[4] === d[5] && d[4] === 2 * d[0];
          }
        `,
        java: code`
          public static boolean validSquare(int[] p1, int[] p2, int[] p3, int[] p4) {
              int[][] pts = { p1, p2, p3, p4 };
              long[] d = new long[6];
              int k = 0;
              for (int i = 0; i < 4; i++) {
                  for (int j = i + 1; j < 4; j++) {
                      long dx = pts[i][0] - pts[j][0];
                      long dy = pts[i][1] - pts[j][1];
                      d[k++] = dx * dx + dy * dy;
                  }
              }
              Arrays.sort(d);
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0];
          }
        `,
        cpp: code`
          bool validSquare(vector<int>& p1, vector<int>& p2, vector<int>& p3, vector<int>& p4) {
              vector<vector<int>> pts = { p1, p2, p3, p4 };
              vector<long long> d;
              for (int i = 0; i < 4; i++) {
                  for (int j = i + 1; j < 4; j++) {
                      long long dx = pts[i][0] - pts[j][0];
                      long long dy = pts[i][1] - pts[j][1];
                      d.push_back(dx * dx + dy * dy);
                  }
              }
              sort(d.begin(), d.end());
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0];
          }
        `,
        c: code`
          bool validSquare(int* p1, int p1Size, int* p2, int p2Size, int* p3, int p3Size, int* p4, int p4Size) {
              int* pts[4] = { p1, p2, p3, p4 };
              long long d[6];
              int k = 0;
              for (int i = 0; i < 4; i++) {
                  for (int j = i + 1; j < 4; j++) {
                      long long dx = pts[i][0] - pts[j][0];
                      long long dy = pts[i][1] - pts[j][1];
                      d[k++] = dx * dx + dy * dy;
                  }
              }
              for (int i = 1; i < 6; i++) {
                  long long cur = d[i];
                  int j = i - 1;
                  while (j >= 0 && d[j] > cur) {
                      d[j + 1] = d[j];
                      j--;
                  }
                  d[j + 1] = cur;
              }
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0];
          }
        `,
        csharp: code`
          public static bool ValidSquare(int[] p1, int[] p2, int[] p3, int[] p4)
          {
              int[][] pts = new int[][] { p1, p2, p3, p4 };
              var d = new List<long>();
              for (int i = 0; i < 4; i++)
              {
                  for (int j = i + 1; j < 4; j++)
                  {
                      long dx = pts[i][0] - pts[j][0];
                      long dy = pts[i][1] - pts[j][1];
                      d.Add(dx * dx + dy * dy);
                  }
              }
              d.Sort();
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0];
          }
        `,
        go: code`
          func validSquare(p1 []int, p2 []int, p3 []int, p4 []int) bool {
              pts := [][]int{p1, p2, p3, p4}
              d := []int{}
              for i := 0; i < 4; i++ {
                  for j := i + 1; j < 4; j++ {
                      dx := pts[i][0] - pts[j][0]
                      dy := pts[i][1] - pts[j][1]
                      d = append(d, dx*dx+dy*dy)
                  }
              }
              sort.Ints(d)
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2*d[0]
          }
        `,
        kotlin: code`
          fun validSquare(p1: IntArray, p2: IntArray, p3: IntArray, p4: IntArray): Boolean {
              val pts = arrayOf(p1, p2, p3, p4)
              val d = LongArray(6)
              var k = 0
              for (i in 0 until 4) {
                  for (j in i + 1 until 4) {
                      val dx = (pts[i][0] - pts[j][0]).toLong()
                      val dy = (pts[i][1] - pts[j][1]).toLong()
                      d[k++] = dx * dx + dy * dy
                  }
              }
              d.sort()
              return d[0] > 0L && d[0] == d[3] && d[4] == d[5] && d[4] == 2L * d[0]
          }
        `,
        swift: code`
          func validSquare(_ p1: [Int], _ p2: [Int], _ p3: [Int], _ p4: [Int]) -> Bool {
              let pts = [p1, p2, p3, p4]
              var d = [Int]()
              for i in 0..<4 {
                  for j in (i + 1)..<4 {
                      let dx = pts[i][0] - pts[j][0]
                      let dy = pts[i][1] - pts[j][1]
                      d.append(dx * dx + dy * dy)
                  }
              }
              d.sort()
              return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0]
          }
        `,
        rust: code`
          fn validSquare(p1: Vec<i32>, p2: Vec<i32>, p3: Vec<i32>, p4: Vec<i32>) -> bool {
              let pts = vec![p1, p2, p3, p4];
              let mut d: Vec<i64> = Vec::new();
              for i in 0..4 {
                  for j in (i + 1)..4 {
                      let dx = (pts[i][0] - pts[j][0]) as i64;
                      let dy = (pts[i][1] - pts[j][1]) as i64;
                      d.push(dx * dx + dy * dy);
                  }
              }
              d.sort();
              d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0]
          }
        `,
        php: code`
          function validSquare($p1, $p2, $p3, $p4) {
              $pts = [$p1, $p2, $p3, $p4];
              $d = [];
              for ($i = 0; $i < 4; $i++) {
                  for ($j = $i + 1; $j < 4; $j++) {
                      $dx = $pts[$i][0] - $pts[$j][0];
                      $dy = $pts[$i][1] - $pts[$j][1];
                      $d[] = $dx * $dx + $dy * $dy;
                  }
              }
              sort($d);
              return $d[0] > 0 && $d[0] == $d[3] && $d[4] == $d[5] && $d[4] == 2 * $d[0];
          }
        `,
        ruby: code`
          def validSquare(p1, p2, p3, p4)
            pts = [p1, p2, p3, p4]
            d = []
            (0...4).each do |i|
              ((i + 1)...4).each do |j|
                dx = pts[i][0] - pts[j][0]
                dy = pts[i][1] - pts[j][1]
                d << dx * dx + dy * dy
              end
            end
            d.sort!
            d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0]
          end
        `,
      },
    };
  })(),

  // ── Rectangle Overlap (LC 836) ───────────────────────────────────
  (() => {
    const ref = (r1: number[], r2: number[]) => {
      const all = r1.concat(r2);
      if (all.every((v) => Math.abs(v) <= 12)) {
        // Brute force: is some unit cell inside both rectangles?
        for (let x = -12; x < 12; x++) {
          for (let y = -12; y < 12; y++) {
            const in1 = x >= r1[0] && x + 1 <= r1[2] && y >= r1[1] && y + 1 <= r1[3];
            const in2 = x >= r2[0] && x + 1 <= r2[2] && y >= r2[1] && y + 1 <= r2[3];
            if (in1 && in2) return true;
          }
        }
        return false;
      }
      const xOk = Math.max(r1[0], r2[0]) < Math.min(r1[2], r2[2]);
      const yOk = Math.max(r1[1], r2[1]) < Math.min(r1[3], r2[3]);
      return xOk && yOk;
    };
    return {
      slug: "rectangle-overlap",
      title: "Rectangle Overlap",
      difficulty: "EASY" as const,
      tags: ["Math", "Geometry", "Amazon", "Microsoft", "Google"],
      signature: {
        funcName: "isRectangleOverlap",
        params: [{ name: "rec1", type: "int[]" as const }, { name: "rec2", type: "int[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "An axis-aligned rectangle is written as `[x1, y1, x2, y2]`, where `(x1, y1)` is its bottom-left corner and `(x2, y2)` its top-right corner. Both given rectangles have positive area.\n\nTwo rectangles **overlap** when the region they share has positive area. Rectangles that only touch along an edge or at a corner do not overlap.\n\nReturn `true` if `rec1` and `rec2` overlap.",
        [
          { in: "rec1 = [0,0,3,3], rec2 = [2,2,5,4]", out: "true", note: "They share the 1 x 1 square from (2,2) to (3,3)." },
          { in: "rec1 = [0,0,2,2], rec2 = [2,0,4,2]", out: "false", note: "They meet only along the line x = 2." },
          { in: "rec1 = [-5,-5,5,5], rec2 = [-1,-1,1,1]", out: "true" },
        ],
        ["rec1.length == rec2.length == 4", "-10^9 <= rec1[i], rec2[i] <= 10^9", "rec1[0] < rec1[2] and rec1[1] < rec1[3]", "rec2[0] < rec2[2] and rec2[1] < rec2[3]"]),
      hints: [
        "Think about the x-axis and the y-axis separately.",
        "Two open intervals `(a1, a2)` and `(b1, b2)` intersect exactly when `max(a1, b1) < min(a2, b2)`.",
        "The rectangles overlap exactly when their x-intervals overlap and their y-intervals overlap.",
      ],
      editorial: explain({
        idea: "The shared region of two axis-aligned rectangles is the product of the shared x-interval and the shared y-interval, so it has positive area exactly when both shared intervals have positive length.",
        steps: [
          "The shared x-interval runs from `max(rec1[0], rec2[0])` to `min(rec1[2], rec2[2])`; it has positive length when the start is strictly less than the end.",
          "Do the same for the y-interval with indices 1 and 3.",
          "Return `true` only if both are strictly positive.",
        ],
        why: "A point is in both rectangles exactly when its x-coordinate lies in both x-ranges and its y-coordinate lies in both y-ranges. The intersection of two intervals is the interval from the later start to the earlier end, so the intersection region is a rectangle whose sides are those two lengths. Its area is positive if and only if both lengths are positive — equality means the rectangles only touch.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Use strict `<`: touching edges and corners do not count as overlap.",
          "Compare coordinates instead of computing `width * height` — with values up to 10^9 the product overflows 32-bit integers.",
          "Checking whether a corner of one rectangle lies inside the other misses the 'cross' arrangement where neither contains a corner of the other.",
        ],
      }),
      examples: [
        { input: "[0,0,3,3]\n[2,2,5,4]", expectedOutput: "true" },
        { input: "[0,0,2,2]\n[2,0,4,2]", expectedOutput: "false" },
        { input: "[-5,-5,5,5]\n[-1,-1,1,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const lim = pick(rng, [12, 12, 12, 1000, 1000000000]);
        const span = () => { const a = ri(rng, -lim, lim - 1); return [a, ri(rng, a + 1, lim)]; };
        const mk = () => { const [x1, x2] = span(); const [y1, y2] = span(); return [x1, y1, x2, y2]; };
        const r1 = mk(); let r2 = mk();
        const kind = ri(rng, 0, 7);
        if (kind === 0) r2 = r1.slice();
        else if (kind === 1) { const w = ri(rng, 1, Math.max(1, Math.min(lim, 1000))); r2 = [r1[2], r1[1], Math.min(lim, r1[2] + w), r1[3]]; if (r2[2] <= r2[0]) r2 = mk(); }
        else if (kind === 2) { r2 = [r1[0], r1[3], r1[2], r1[3] + 1]; if (r2[3] > lim) r2 = mk(); }
        else if (kind === 3) { r2 = [r1[2], r1[3], r1[2] + 1, r1[3] + 1]; if (r2[2] > lim || r2[3] > lim) r2 = mk(); }
        else if (kind === 4) { // cross shape
          const cx1 = ri(rng, r1[0], r1[2] - 1), cx2 = ri(rng, cx1 + 1, r1[2]);
          r2 = [cx1, Math.max(-lim, r1[1] - 1), cx2, Math.min(lim, r1[3] + 1)];
        }
        const a = rng() < 0.5 ? [r1, r2] : [r2, r1];
        return { input: fmtIntArr(a[0]) + "\n" + fmtIntArr(a[1]), expectedOutput: bool(ref(a[0], a[1])) };
      },
      solutions: {
        python: code`
          from typing import List

          def isRectangleOverlap(rec1: List[int], rec2: List[int]) -> bool:
              x_ok = max(rec1[0], rec2[0]) < min(rec1[2], rec2[2])
              y_ok = max(rec1[1], rec2[1]) < min(rec1[3], rec2[3])
              return x_ok and y_ok
        `,
        javascript: code`
          var isRectangleOverlap = function(rec1, rec2) {
              var xOk = Math.max(rec1[0], rec2[0]) < Math.min(rec1[2], rec2[2]);
              var yOk = Math.max(rec1[1], rec2[1]) < Math.min(rec1[3], rec2[3]);
              return xOk && yOk;
          };
        `,
        typescript: code`
          function isRectangleOverlap(rec1: number[], rec2: number[]): boolean {
              var xOk = Math.max(rec1[0], rec2[0]) < Math.min(rec1[2], rec2[2]);
              var yOk = Math.max(rec1[1], rec2[1]) < Math.min(rec1[3], rec2[3]);
              return xOk && yOk;
          }
        `,
        java: code`
          public static boolean isRectangleOverlap(int[] rec1, int[] rec2) {
              boolean xOk = Math.max(rec1[0], rec2[0]) < Math.min(rec1[2], rec2[2]);
              boolean yOk = Math.max(rec1[1], rec2[1]) < Math.min(rec1[3], rec2[3]);
              return xOk && yOk;
          }
        `,
        cpp: code`
          bool isRectangleOverlap(vector<int>& rec1, vector<int>& rec2) {
              bool xOk = max(rec1[0], rec2[0]) < min(rec1[2], rec2[2]);
              bool yOk = max(rec1[1], rec2[1]) < min(rec1[3], rec2[3]);
              return xOk && yOk;
          }
        `,
        c: code`
          bool isRectangleOverlap(int* rec1, int rec1Size, int* rec2, int rec2Size) {
              int left = rec1[0] > rec2[0] ? rec1[0] : rec2[0];
              int right = rec1[2] < rec2[2] ? rec1[2] : rec2[2];
              int bottom = rec1[1] > rec2[1] ? rec1[1] : rec2[1];
              int top = rec1[3] < rec2[3] ? rec1[3] : rec2[3];
              return left < right && bottom < top;
          }
        `,
        csharp: code`
          public static bool IsRectangleOverlap(int[] rec1, int[] rec2)
          {
              bool xOk = Math.Max(rec1[0], rec2[0]) < Math.Min(rec1[2], rec2[2]);
              bool yOk = Math.Max(rec1[1], rec2[1]) < Math.Min(rec1[3], rec2[3]);
              return xOk && yOk;
          }
        `,
        go: code`
          func isRectangleOverlap(rec1 []int, rec2 []int) bool {
              left, right := rec1[0], rec1[2]
              if rec2[0] > left {
                  left = rec2[0]
              }
              if rec2[2] < right {
                  right = rec2[2]
              }
              bottom, top := rec1[1], rec1[3]
              if rec2[1] > bottom {
                  bottom = rec2[1]
              }
              if rec2[3] < top {
                  top = rec2[3]
              }
              return left < right && bottom < top
          }
        `,
        kotlin: code`
          fun isRectangleOverlap(rec1: IntArray, rec2: IntArray): Boolean {
              val xOk = maxOf(rec1[0], rec2[0]) < minOf(rec1[2], rec2[2])
              val yOk = maxOf(rec1[1], rec2[1]) < minOf(rec1[3], rec2[3])
              return xOk && yOk
          }
        `,
        swift: code`
          func isRectangleOverlap(_ rec1: [Int], _ rec2: [Int]) -> Bool {
              let xOk = max(rec1[0], rec2[0]) < min(rec1[2], rec2[2])
              let yOk = max(rec1[1], rec2[1]) < min(rec1[3], rec2[3])
              return xOk && yOk
          }
        `,
        rust: code`
          fn isRectangleOverlap(rec1: Vec<i32>, rec2: Vec<i32>) -> bool {
              let x_ok = std::cmp::max(rec1[0], rec2[0]) < std::cmp::min(rec1[2], rec2[2]);
              let y_ok = std::cmp::max(rec1[1], rec2[1]) < std::cmp::min(rec1[3], rec2[3]);
              x_ok && y_ok
          }
        `,
        php: code`
          function isRectangleOverlap($rec1, $rec2) {
              $xOk = max($rec1[0], $rec2[0]) < min($rec1[2], $rec2[2]);
              $yOk = max($rec1[1], $rec2[1]) < min($rec1[3], $rec2[3]);
              return $xOk && $yOk;
          }
        `,
        ruby: code`
          def isRectangleOverlap(rec1, rec2)
            x_ok = [rec1[0], rec2[0]].max < [rec1[2], rec2[2]].min
            y_ok = [rec1[1], rec2[1]].max < [rec1[3], rec2[3]].min
            x_ok && y_ok
          end
        `,
      },
    };
  })(),

  // ── Surface Area of 3D Shapes (LC 892) ───────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      // Brute force over unit cubes: count faces with no cube behind them.
      const n = grid.length;
      const h = (i: number, j: number) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : grid[i][j]);
      let faces = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          for (let z = 0; z < grid[i][j]; z++) {
            if (z === 0) faces++;
            if (z === grid[i][j] - 1) faces++;
            const nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
            for (const [a, b] of nb) if (h(a, b) <= z) faces++;
          }
        }
      }
      return faces;
    };
    return {
      slug: "surface-area-of-3d-shapes",
      title: "Surface Area of 3D Shapes",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Geometry", "Matrix", "Google", "Adobe"],
      signature: { funcName: "surfaceArea", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An `n x n` board is covered with stacks of unit cubes: `grid[i][j]` cubes are stacked on cell `(i, j)`. Cubes that touch each other — in the same stack or in neighbouring stacks — are glued together, so the whole thing may form one or more solid shapes.\n\nReturn the **total surface area** of the resulting shapes. The bottom faces resting on the board count as surface too.",
        [
          { in: "grid = [[2]]", out: "10", note: "One stack of two cubes: four sides of area 2, plus top and bottom." },
          { in: "grid = [[1,0],[0,2]]", out: "16", note: "The stacks touch only at an edge, so they are counted separately: 6 + 10." },
          { in: "grid = [[3,3],[3,3]]", out: "32", note: "A 2 x 2 x 3 box: 2·(2·2 + 2·3 + 2·3) = 32." },
        ],
        ["n == grid.length == grid[i].length", "1 <= n <= 50", "0 <= grid[i][j] <= 50"]),
      hints: [
        "Start from each stack on its own: a non-empty stack of height `v` exposes `4v + 2` faces.",
        "Two neighbouring stacks hide the faces where they touch.",
        "Stacks of heights `a` and `b` side by side touch over `min(a, b)` unit squares, which hides `2·min(a, b)` faces.",
      ],
      editorial: explain({
        idea: "Count every stack as if it stood alone, then subtract the faces that disappear where neighbouring stacks are glued together.",
        steps: [
          "For each cell with `v > 0`, add `4v + 2` (four walls of height `v`, a top and a bottom).",
          "For each cell, look at its right neighbour and its lower neighbour (so each adjacent pair is seen once) and subtract `2 · min(v, neighbour)`.",
          "Return the total.",
        ],
        why: "Within one stack, the glued faces between cubes are already excluded by `4v + 2`. Between two adjacent stacks of heights `a` and `b`, the cubes at levels `0 .. min(a, b) - 1` face each other, and each such pair hides one face from each side — `2·min(a, b)` faces. Diagonal stacks touch only along an edge and hide nothing. Every hidden face belongs to exactly one adjacent pair, and visiting only right and down neighbours counts each pair once.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "An empty cell must not contribute its `+2` for top and bottom.",
          "Subtract twice the shared height, not once — both stacks lose a face.",
          "Visiting all four neighbours of every cell double-counts each pair unless you halve the result.",
        ],
      }),
      examples: [
        { input: "[[2]]", expectedOutput: "10" },
        { input: "[[1,0],[0,2]]", expectedOutput: "16" },
        { input: "[[3,3],[3,3]]", expectedOutput: "32" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 4, 5, 6, 8]);
        const top = pick(rng, [1, 2, 4, 10, 50]);
        const zeroRate = pick(rng, [0, 0.2, 0.5]);
        const flat = rng() < 0.1;
        const fixed = ri(rng, 0, top);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (flat ? fixed : rng() < zeroRate ? 0 : ri(rng, 0, top))));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def surfaceArea(grid: List[List[int]]) -> int:
              n = len(grid)
              total = 0
              for i in range(n):
                  for j in range(n):
                      v = grid[i][j]
                      if v > 0:
                          total += 4 * v + 2
                      if i + 1 < n:
                          total -= 2 * min(v, grid[i + 1][j])
                      if j + 1 < n:
                          total -= 2 * min(v, grid[i][j + 1])
              return total
        `,
        javascript: code`
          var surfaceArea = function(grid) {
              var n = grid.length;
              var total = 0;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      var v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) total -= 2 * Math.min(v, grid[i + 1][j]);
                      if (j + 1 < n) total -= 2 * Math.min(v, grid[i][j + 1]);
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function surfaceArea(grid: number[][]): number {
              var n = grid.length;
              var total = 0;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      var v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) total -= 2 * Math.min(v, grid[i + 1][j]);
                      if (j + 1 < n) total -= 2 * Math.min(v, grid[i][j + 1]);
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int surfaceArea(int[][] grid) {
              int n = grid.length;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      int v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) total -= 2 * Math.min(v, grid[i + 1][j]);
                      if (j + 1 < n) total -= 2 * Math.min(v, grid[i][j + 1]);
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int surfaceArea(vector<vector<int>>& grid) {
              int n = grid.size();
              int total = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      int v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) total -= 2 * min(v, grid[i + 1][j]);
                      if (j + 1 < n) total -= 2 * min(v, grid[i][j + 1]);
                  }
              }
              return total;
          }
        `,
        c: code`
          int surfaceArea(int** grid, int gridSize, int* gridColSize) {
              int n = gridSize;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      int v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) {
                          int u = grid[i + 1][j];
                          total -= 2 * (v < u ? v : u);
                      }
                      if (j + 1 < n) {
                          int r = grid[i][j + 1];
                          total -= 2 * (v < r ? v : r);
                      }
                  }
              }
              return total;
          }
        `,
        csharp: code`
          public static int SurfaceArea(int[][] grid)
          {
              int n = grid.Length;
              int total = 0;
              for (int i = 0; i < n; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      int v = grid[i][j];
                      if (v > 0) total += 4 * v + 2;
                      if (i + 1 < n) total -= 2 * Math.Min(v, grid[i + 1][j]);
                      if (j + 1 < n) total -= 2 * Math.Min(v, grid[i][j + 1]);
                  }
              }
              return total;
          }
        `,
        go: code`
          func surfaceArea(grid [][]int) int {
              n := len(grid)
              total := 0
              for i := 0; i < n; i++ {
                  for j := 0; j < n; j++ {
                      v := grid[i][j]
                      if v > 0 {
                          total += 4*v + 2
                      }
                      if i+1 < n {
                          u := grid[i+1][j]
                          if u < v {
                              total -= 2 * u
                          } else {
                              total -= 2 * v
                          }
                      }
                      if j+1 < n {
                          r := grid[i][j+1]
                          if r < v {
                              total -= 2 * r
                          } else {
                              total -= 2 * v
                          }
                      }
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun surfaceArea(grid: Array<IntArray>): Int {
              val n = grid.size
              var total = 0
              for (i in 0 until n) {
                  for (j in 0 until n) {
                      val v = grid[i][j]
                      if (v > 0) total += 4 * v + 2
                      if (i + 1 < n) total -= 2 * minOf(v, grid[i + 1][j])
                      if (j + 1 < n) total -= 2 * minOf(v, grid[i][j + 1])
                  }
              }
              return total
          }
        `,
        swift: code`
          func surfaceArea(_ grid: [[Int]]) -> Int {
              let n = grid.count
              var total = 0
              for i in 0..<n {
                  for j in 0..<n {
                      let v = grid[i][j]
                      if v > 0 { total += 4 * v + 2 }
                      if i + 1 < n { total -= 2 * min(v, grid[i + 1][j]) }
                      if j + 1 < n { total -= 2 * min(v, grid[i][j + 1]) }
                  }
              }
              return total
          }
        `,
        rust: code`
          fn surfaceArea(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid.len();
              let mut total = 0;
              for i in 0..n {
                  for j in 0..n {
                      let v = grid[i][j];
                      if v > 0 {
                          total += 4 * v + 2;
                      }
                      if i + 1 < n {
                          total -= 2 * std::cmp::min(v, grid[i + 1][j]);
                      }
                      if j + 1 < n {
                          total -= 2 * std::cmp::min(v, grid[i][j + 1]);
                      }
                  }
              }
              total
          }
        `,
        php: code`
          function surfaceArea($grid) {
              $n = count($grid);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $v = $grid[$i][$j];
                      if ($v > 0) $total += 4 * $v + 2;
                      if ($i + 1 < $n) $total -= 2 * min($v, $grid[$i + 1][$j]);
                      if ($j + 1 < $n) $total -= 2 * min($v, $grid[$i][$j + 1]);
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def surfaceArea(grid)
            n = grid.length
            total = 0
            (0...n).each do |i|
              (0...n).each do |j|
                v = grid[i][j]
                total += 4 * v + 2 if v > 0
                total -= 2 * [v, grid[i + 1][j]].min if i + 1 < n
                total -= 2 * [v, grid[i][j + 1]].min if j + 1 < n
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Valid Boomerang (LC 1037) ────────────────────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
    const ref = (p: number[][]) => {
      const same = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];
      if (same(p[0], p[1]) || same(p[1], p[2]) || same(p[0], p[2])) return false;
      // Compare the reduced directions from p[0] to the other two points.
      const dir = (a: number[], b: number[]) => {
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const g = gcd(dx, dy);
        dx /= g; dy /= g;
        if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }
        return dx + "," + dy;
      };
      return dir(p[0], p[1]) !== dir(p[0], p[2]);
    };
    return {
      slug: "valid-boomerang",
      title: "Valid Boomerang",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Geometry", "Google", "Amazon"],
      signature: { funcName: "isBoomerang", params: [{ name: "points", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "`points` holds exactly three points `[x, y]` in the plane. They form a **boomerang** when all three are different and they do not lie on one straight line.\n\nReturn `true` if the points form a boomerang.",
        [
          { in: "points = [[1,1],[2,3],[3,2]]", out: "true" },
          { in: "points = [[1,1],[2,2],[3,3]]", out: "false", note: "All three lie on the line y = x." },
          { in: "points = [[0,0],[0,0],[4,7]]", out: "false", note: "Two of the points coincide." },
        ],
        ["points.length == 3", "points[i].length == 2", "0 <= xi, yi <= 100"]),
      hints: [
        "Three points are on one line exactly when the triangle they span has zero area.",
        "Twice that signed area is the cross product of the vectors `p2 - p1` and `p3 - p1`.",
        "If two points coincide, one of those vectors is zero and the cross product is zero too — one test covers both conditions.",
      ],
      editorial: explain({
        idea: "The cross product of `p2 - p1` and `p3 - p1` is twice the signed area of the triangle. It is zero exactly when the three points are collinear — which includes the case where two of them coincide.",
        steps: [
          "Let `(ax, ay) = p2 - p1` and `(bx, by) = p3 - p1`.",
          "Compute `ax * by - ay * bx`.",
          "Return `true` if it is non-zero.",
        ],
        why: "The cross product of two vectors is zero exactly when one is a scalar multiple of the other (or either is zero). If `p3 - p1` is a multiple of `p2 - p1`, then `p3` lies on the line through `p1` and `p2`; if either vector is zero, two points coincide. A non-zero cross product rules out both, which is exactly the boomerang condition. Everything stays in integers, so there is no slope division and no rounding.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Comparing slopes with division breaks on vertical lines and on floating-point rounding; cross-multiply instead.",
          "Do not forget duplicates — the cross product already handles them, a separate equality check is redundant but harmless.",
        ],
      }),
      examples: [
        { input: "[[1,1],[2,3],[3,2]]", expectedOutput: "true" },
        { input: "[[1,1],[2,2],[3,3]]", expectedOutput: "false" },
        { input: "[[0,0],[0,0],[4,7]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const lim = pick(rng, [2, 4, 10, 100]);
        const pt = () => [ri(rng, 0, lim), ri(rng, 0, lim)];
        const kind = ri(rng, 0, 9);
        let pts: number[][] = [pt(), pt(), pt()];
        if (kind <= 2) {
          // Collinear: p, p + a·v, p + b·v, kept inside the box.
          for (let tries = 0; tries < 50; tries++) {
            const p = pt(); const v = [ri(rng, -3, 3), ri(rng, -3, 3)];
            const a = ri(rng, -5, 5), b = ri(rng, -5, 5);
            const q = [[p[0], p[1]], [p[0] + a * v[0], p[1] + a * v[1]], [p[0] + b * v[0], p[1] + b * v[1]]];
            if (q.every((r) => r[0] >= 0 && r[1] >= 0 && r[0] <= 100 && r[1] <= 100)) { pts = q; break; }
          }
        } else if (kind === 3) {
          const a = pt(); pts = [a, [a[0], a[1]], pt()];
        } else if (kind === 4) {
          const a = pt(); pts = [a, [a[0], a[1]], [a[0], a[1]]];
        }
        pts = shuffle(rng, pts);
        return { input: fmtIntMat(pts), expectedOutput: bool(ref(pts)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isBoomerang(points: List[List[int]]) -> bool:
              ax = points[1][0] - points[0][0]
              ay = points[1][1] - points[0][1]
              bx = points[2][0] - points[0][0]
              by = points[2][1] - points[0][1]
              return ax * by - ay * bx != 0
        `,
        javascript: code`
          var isBoomerang = function(points) {
              var ax = points[1][0] - points[0][0];
              var ay = points[1][1] - points[0][1];
              var bx = points[2][0] - points[0][0];
              var by = points[2][1] - points[0][1];
              return ax * by - ay * bx !== 0;
          };
        `,
        typescript: code`
          function isBoomerang(points: number[][]): boolean {
              var ax = points[1][0] - points[0][0];
              var ay = points[1][1] - points[0][1];
              var bx = points[2][0] - points[0][0];
              var by = points[2][1] - points[0][1];
              return ax * by - ay * bx !== 0;
          }
        `,
        java: code`
          public static boolean isBoomerang(int[][] points) {
              int ax = points[1][0] - points[0][0];
              int ay = points[1][1] - points[0][1];
              int bx = points[2][0] - points[0][0];
              int by = points[2][1] - points[0][1];
              return ax * by - ay * bx != 0;
          }
        `,
        cpp: code`
          bool isBoomerang(vector<vector<int>>& points) {
              int ax = points[1][0] - points[0][0];
              int ay = points[1][1] - points[0][1];
              int bx = points[2][0] - points[0][0];
              int by = points[2][1] - points[0][1];
              return ax * by - ay * bx != 0;
          }
        `,
        c: code`
          bool isBoomerang(int** points, int pointsSize, int* pointsColSize) {
              int ax = points[1][0] - points[0][0];
              int ay = points[1][1] - points[0][1];
              int bx = points[2][0] - points[0][0];
              int by = points[2][1] - points[0][1];
              return ax * by - ay * bx != 0;
          }
        `,
        csharp: code`
          public static bool IsBoomerang(int[][] points)
          {
              int ax = points[1][0] - points[0][0];
              int ay = points[1][1] - points[0][1];
              int bx = points[2][0] - points[0][0];
              int by = points[2][1] - points[0][1];
              return ax * by - ay * bx != 0;
          }
        `,
        go: code`
          func isBoomerang(points [][]int) bool {
              ax := points[1][0] - points[0][0]
              ay := points[1][1] - points[0][1]
              bx := points[2][0] - points[0][0]
              by := points[2][1] - points[0][1]
              return ax*by-ay*bx != 0
          }
        `,
        kotlin: code`
          fun isBoomerang(points: Array<IntArray>): Boolean {
              val ax = points[1][0] - points[0][0]
              val ay = points[1][1] - points[0][1]
              val bx = points[2][0] - points[0][0]
              val by = points[2][1] - points[0][1]
              return ax * by - ay * bx != 0
          }
        `,
        swift: code`
          func isBoomerang(_ points: [[Int]]) -> Bool {
              let ax = points[1][0] - points[0][0]
              let ay = points[1][1] - points[0][1]
              let bx = points[2][0] - points[0][0]
              let by = points[2][1] - points[0][1]
              return ax * by - ay * bx != 0
          }
        `,
        rust: code`
          fn isBoomerang(points: Vec<Vec<i32>>) -> bool {
              let ax = points[1][0] - points[0][0];
              let ay = points[1][1] - points[0][1];
              let bx = points[2][0] - points[0][0];
              let by = points[2][1] - points[0][1];
              ax * by - ay * bx != 0
          }
        `,
        php: code`
          function isBoomerang($points) {
              $ax = $points[1][0] - $points[0][0];
              $ay = $points[1][1] - $points[0][1];
              $bx = $points[2][0] - $points[0][0];
              $by = $points[2][1] - $points[0][1];
              return $ax * $by - $ay * $bx != 0;
          }
        `,
        ruby: code`
          def isBoomerang(points)
            ax = points[1][0] - points[0][0]
            ay = points[1][1] - points[0][1]
            bx = points[2][0] - points[0][0]
            by = points[2][1] - points[0][1]
            ax * by - ay * bx != 0
          end
        `,
      },
    };
  })(),

  // ── Circle and Rectangle Overlapping (LC 1401) ───────────────────
  (() => {
    const ref = (r: number, xc: number, yc: number, x1: number, y1: number, x2: number, y2: number) => {
      // Distance from the centre to the rectangle, one axis at a time.
      const gx = Math.max(0, x1 - xc, xc - x2);
      const gy = Math.max(0, y1 - yc, yc - y2);
      return gx * gx + gy * gy <= r * r;
    };
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    return {
      slug: "circle-and-rectangle-overlapping",
      title: "Circle and Rectangle Overlapping",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Geometry", "Amazon", "Google"],
      signature: {
        funcName: "checkOverlap",
        params: [
          { name: "radius", type: "int" as const }, { name: "xCenter", type: "int" as const }, { name: "yCenter", type: "int" as const },
          { name: "x1", type: "int" as const }, { name: "y1", type: "int" as const }, { name: "x2", type: "int" as const }, { name: "y2", type: "int" as const },
        ],
        returns: "bool" as const,
      },
      description: describe(
        "A circle has centre `(xCenter, yCenter)` and radius `radius`. An axis-aligned rectangle has bottom-left corner `(x1, y1)` and top-right corner `(x2, y2)`.\n\nBoth shapes are **closed**: the circle includes its boundary and so does the rectangle. Return `true` if there is at least one point that belongs to both shapes — touching at a single point counts.",
        [
          { in: "radius = 2, xCenter = 0, yCenter = 0, x1 = 2, y1 = -3, x2 = 6, y2 = 1", out: "true", note: "The shapes touch at (2, 0)." },
          { in: "radius = 5, xCenter = 0, yCenter = 0, x1 = 3, y1 = 4, x2 = 8, y2 = 9", out: "true", note: "The corner (3, 4) is exactly 5 away from the centre." },
          { in: "radius = 1, xCenter = 1, yCenter = 1, x1 = -3, y1 = 3, x2 = -1, y2 = 5", out: "false" },
        ],
        ["1 <= radius <= 2000", "-10^4 <= xCenter, yCenter <= 10^4", "-10^4 <= x1 < x2 <= 10^4", "-10^4 <= y1 < y2 <= 10^4"]),
      hints: [
        "The shapes meet exactly when the rectangle point closest to the centre lies inside the circle.",
        "The closest point can be found one axis at a time.",
        "Clamp `xCenter` into `[x1, x2]` and `yCenter` into `[y1, y2]`, then compare squared distances so everything stays an integer.",
      ],
      editorial: explain({
        idea: "The circle and the rectangle share a point exactly when the distance from the centre to the rectangle is at most the radius, and the nearest rectangle point is the centre clamped into the rectangle.",
        steps: [
          "Let `nx = min(max(xCenter, x1), x2)` and `ny = min(max(yCenter, y1), y2)` — the rectangle point nearest the centre.",
          "Let `dx = nx - xCenter` and `dy = ny - yCenter`.",
          "Return `dx² + dy² <= radius²`.",
        ],
        why: "The squared distance from the centre to a rectangle point `(x, y)` is `(x - xCenter)² + (y - yCenter)²`, and the two terms can be minimised independently because the rectangle is a product of an x-interval and a y-interval. The closest value in an interval to a number is that number clamped into the interval. If even the closest point is farther than the radius, no rectangle point is in the circle; if it is within the radius, that point is in both shapes.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Checking only whether a rectangle corner is in the circle, or the centre is in the rectangle, misses a circle that crosses an edge's middle.",
          "Use `<=`: touching counts as overlapping.",
          "Compare squared values — a floating-point square root can misjudge the tangent cases.",
        ],
      }),
      examples: [
        { input: "2\n0\n0\n2\n-3\n6\n1", expectedOutput: "true" },
        { input: "5\n0\n0\n3\n4\n8\n9", expectedOutput: "true" },
        { input: "1\n1\n1\n-3\n3\n-1\n5", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const scale = pick(rng, [4, 30, 500, 2000]);
        const radius = ri(rng, 1, scale);
        const xc = ri(rng, -10000, 10000), yc = ri(rng, -10000, 10000);
        let x1: number, y1: number, x2: number, y2: number;
        const kind = ri(rng, 0, 7);
        const sx = pick(rng, [1, -1]), sy = pick(rng, [1, -1]);
        if (kind === 0 || kind === 1) {
          // An edge exactly at distance radius (true) or radius + 1 (false).
          const gap = radius + (kind === 1 ? 1 : 0);
          x1 = xc + gap; x2 = x1 + ri(rng, 1, scale);
          y1 = yc - ri(rng, 0, scale); y2 = yc + ri(rng, 1, scale);
          if (sx < 0) { const t = x1; x1 = 2 * xc - x2; x2 = 2 * xc - t; }
        } else if (kind === 2 || kind === 3) {
          // A corner on (or just off) the circle via a Pythagorean triple.
          const tr = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
          const k = Math.max(1, Math.floor(Math.min(2000, scale * 2) / tr[2]));
          const r = tr[2] * k - (kind === 3 ? 1 : 0);
          const cx = xc + sx * tr[0] * k, cy = yc + sy * tr[1] * k;
          x1 = sx > 0 ? cx : cx - ri(rng, 1, scale); x2 = sx > 0 ? cx + ri(rng, 1, scale) : cx;
          y1 = sy > 0 ? cy : cy - ri(rng, 1, scale); y2 = sy > 0 ? cy + ri(rng, 1, scale) : cy;
          x1 = clamp(x1, -10000, 9999); x2 = clamp(Math.max(x2, x1 + 1), x1 + 1, 10000);
          y1 = clamp(y1, -10000, 9999); y2 = clamp(Math.max(y2, y1 + 1), y1 + 1, 10000);
          const q = [Math.max(1, r), xc, yc, x1, y1, x2, y2];
          return { input: q.join("\n"), expectedOutput: bool(ref(q[0], q[1], q[2], q[3], q[4], q[5], q[6])) };
        } else {
          x1 = xc + ri(rng, -3 * scale, 3 * scale); x2 = x1 + ri(rng, 1, 3 * scale);
          y1 = yc + ri(rng, -3 * scale, 3 * scale); y2 = y1 + ri(rng, 1, 3 * scale);
        }
        x1 = clamp(x1, -10000, 9999); x2 = clamp(Math.max(x2, x1 + 1), x1 + 1, 10000);
        y1 = clamp(y1, -10000, 9999); y2 = clamp(Math.max(y2, y1 + 1), y1 + 1, 10000);
        const q = [radius, xc, yc, x1, y1, x2, y2];
        return { input: q.join("\n"), expectedOutput: bool(ref(q[0], q[1], q[2], q[3], q[4], q[5], q[6])) };
      },
      solutions: {
        python: code`
          def checkOverlap(radius: int, xCenter: int, yCenter: int, x1: int, y1: int, x2: int, y2: int) -> bool:
              nx = min(max(xCenter, x1), x2)
              ny = min(max(yCenter, y1), y2)
              dx = nx - xCenter
              dy = ny - yCenter
              return dx * dx + dy * dy <= radius * radius
        `,
        javascript: code`
          var checkOverlap = function(radius, xCenter, yCenter, x1, y1, x2, y2) {
              var nx = Math.min(Math.max(xCenter, x1), x2);
              var ny = Math.min(Math.max(yCenter, y1), y2);
              var dx = nx - xCenter;
              var dy = ny - yCenter;
              return dx * dx + dy * dy <= radius * radius;
          };
        `,
        typescript: code`
          function checkOverlap(radius: number, xCenter: number, yCenter: number, x1: number, y1: number, x2: number, y2: number): boolean {
              var nx = Math.min(Math.max(xCenter, x1), x2);
              var ny = Math.min(Math.max(yCenter, y1), y2);
              var dx = nx - xCenter;
              var dy = ny - yCenter;
              return dx * dx + dy * dy <= radius * radius;
          }
        `,
        java: code`
          public static boolean checkOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
              int nx = Math.min(Math.max(xCenter, x1), x2);
              int ny = Math.min(Math.max(yCenter, y1), y2);
              long dx = nx - xCenter;
              long dy = ny - yCenter;
              return dx * dx + dy * dy <= (long) radius * radius;
          }
        `,
        cpp: code`
          bool checkOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
              int nx = min(max(xCenter, x1), x2);
              int ny = min(max(yCenter, y1), y2);
              long long dx = nx - xCenter;
              long long dy = ny - yCenter;
              return dx * dx + dy * dy <= (long long) radius * radius;
          }
        `,
        c: code`
          bool checkOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
              int nx = xCenter < x1 ? x1 : (xCenter > x2 ? x2 : xCenter);
              int ny = yCenter < y1 ? y1 : (yCenter > y2 ? y2 : yCenter);
              long long dx = nx - xCenter;
              long long dy = ny - yCenter;
              return dx * dx + dy * dy <= (long long) radius * radius;
          }
        `,
        csharp: code`
          public static bool CheckOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2)
          {
              int nx = Math.Min(Math.Max(xCenter, x1), x2);
              int ny = Math.Min(Math.Max(yCenter, y1), y2);
              long dx = nx - xCenter;
              long dy = ny - yCenter;
              return dx * dx + dy * dy <= (long) radius * radius;
          }
        `,
        go: code`
          func checkOverlap(radius int, xCenter int, yCenter int, x1 int, y1 int, x2 int, y2 int) bool {
              nx := xCenter
              if nx < x1 {
                  nx = x1
              }
              if nx > x2 {
                  nx = x2
              }
              ny := yCenter
              if ny < y1 {
                  ny = y1
              }
              if ny > y2 {
                  ny = y2
              }
              dx := nx - xCenter
              dy := ny - yCenter
              return dx*dx+dy*dy <= radius*radius
          }
        `,
        kotlin: code`
          fun checkOverlap(radius: Int, xCenter: Int, yCenter: Int, x1: Int, y1: Int, x2: Int, y2: Int): Boolean {
              val nx = minOf(maxOf(xCenter, x1), x2)
              val ny = minOf(maxOf(yCenter, y1), y2)
              val dx = (nx - xCenter).toLong()
              val dy = (ny - yCenter).toLong()
              return dx * dx + dy * dy <= radius.toLong() * radius
          }
        `,
        swift: code`
          func checkOverlap(_ radius: Int, _ xCenter: Int, _ yCenter: Int, _ x1: Int, _ y1: Int, _ x2: Int, _ y2: Int) -> Bool {
              let nx = min(max(xCenter, x1), x2)
              let ny = min(max(yCenter, y1), y2)
              let dx = nx - xCenter
              let dy = ny - yCenter
              return dx * dx + dy * dy <= radius * radius
          }
        `,
        rust: code`
          fn checkOverlap(radius: i32, xCenter: i32, yCenter: i32, x1: i32, y1: i32, x2: i32, y2: i32) -> bool {
              let nx = std::cmp::min(std::cmp::max(xCenter, x1), x2);
              let ny = std::cmp::min(std::cmp::max(yCenter, y1), y2);
              let dx = (nx - xCenter) as i64;
              let dy = (ny - yCenter) as i64;
              dx * dx + dy * dy <= (radius as i64) * (radius as i64)
          }
        `,
        php: code`
          function checkOverlap($radius, $xCenter, $yCenter, $x1, $y1, $x2, $y2) {
              $nx = min(max($xCenter, $x1), $x2);
              $ny = min(max($yCenter, $y1), $y2);
              $dx = $nx - $xCenter;
              $dy = $ny - $yCenter;
              return $dx * $dx + $dy * $dy <= $radius * $radius;
          }
        `,
        ruby: code`
          def checkOverlap(radius, xCenter, yCenter, x1, y1, x2, y2)
            nx = [[xCenter, x1].max, x2].min
            ny = [[yCenter, y1].max, y2].min
            dx = nx - xCenter
            dy = ny - yCenter
            dx * dx + dy * dy <= radius * radius
          end
        `,
      },
    };
  })(),

  // ── Queries on Number of Points Inside a Circle (LC 1828) ────────
  (() => {
    const ref = (points: number[][], queries: number[][]) =>
      queries.map(([qx, qy, r]) => points.filter(([x, y]) => (x - qx) ** 2 + (y - qy) ** 2 <= r * r).length);
    return {
      slug: "queries-on-number-of-points-inside-a-circle",
      title: "Queries on Number of Points Inside a Circle",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Geometry", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "countPoints",
        params: [{ name: "points", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "`points[i] = [xi, yi]` is a point in the plane; several points may share a position. Each query `queries[j] = [xj, yj, rj]` describes a circle with centre `(xj, yj)` and radius `rj`.\n\nFor every query, count the points that lie **inside or on** its circle. Return the counts as an array `answer` where `answer[j]` belongs to `queries[j]`.",
        [
          { in: "points = [[0,0],[2,0],[1,1],[3,3]], queries = [[1,0,1],[0,0,3],[5,5,1]]", out: "[3,3,0]", note: "The first circle passes exactly through (0,0), (2,0) and (1,1)." },
          { in: "points = [[4,4],[4,4]], queries = [[4,5,1]]", out: "[2]", note: "Both copies of (4,4) lie on the boundary." },
          { in: "points = [[10,10]], queries = [[0,0,14],[0,0,15]]", out: "[0,1]" },
        ],
        ["1 <= points.length <= 500", "points[i].length == 2", "0 <= xi, yi <= 500", "1 <= queries.length <= 500", "queries[j].length == 3", "0 <= xj, yj <= 500", "1 <= rj <= 500"],
        "Can you answer each query in better than O(n) time?"),
      hints: [
        "With at most 500 points and 500 queries, checking every pair is only 250,000 tests.",
        "A point `(x, y)` is in the circle when its distance to the centre is at most `r`.",
        "Compare squared values: `(x - xj)² + (y - yj)² <= rj²` keeps everything an exact integer.",
      ],
      editorial: explain({
        idea: "Test every point against every circle with an exact integer distance check.",
        steps: [
          "For each query `[xj, yj, rj]`, start a counter at 0.",
          "For each point, compute `dx = x - xj`, `dy = y - yj` and add one if `dx² + dy² <= rj²`.",
          "Store the counter as `answer[j]`.",
        ],
        why: "A point lies inside or on a circle exactly when its Euclidean distance to the centre is at most the radius; both sides are non-negative, so squaring preserves the comparison. Each point is checked once per query, so every count is exact, and duplicate points are counted as often as they appear.",
        time: "O(n · q)",
        space: "O(q) for the answer",
        pitfalls: [
          "Use `<=` — points on the boundary count.",
          "Avoid `sqrt`; floating-point rounding can flip boundary points.",
          "For the follow-up, sort points by x and only scan the strip `[xj - rj, xj + rj]`, or bucket them on a grid.",
        ],
      }),
      examples: [
        { input: "[[0,0],[2,0],[1,1],[3,3]]\n[[1,0,1],[0,0,3],[5,5,1]]", expectedOutput: "[3,3,0]" },
        { input: "[[4,4],[4,4]]\n[[4,5,1]]", expectedOutput: "[2]" },
        { input: "[[10,10]]\n[[0,0,14],[0,0,15]]", expectedOutput: "[0,1]" },
      ],
      gen: (rng: Rng) => {
        const L = pick(rng, [3, 10, 60, 500]);
        const n = ri(rng, 1, pick(rng, [1, 5, 30]));
        const q = ri(rng, 1, pick(rng, [1, 5, 20]));
        const points = Array.from({ length: n }, () => [ri(rng, 0, L), ri(rng, 0, L)]);
        const queries = Array.from({ length: q }, () => [ri(rng, 0, L), ri(rng, 0, L), ri(rng, 1, Math.min(500, Math.max(1, L)))]);
        return { input: fmtIntMat(points) + "\n" + fmtIntMat(queries), expectedOutput: fmtIntArr(ref(points, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPoints(points: List[List[int]], queries: List[List[int]]) -> List[int]:
              answer = []
              for qx, qy, r in queries:
                  rr = r * r
                  c = 0
                  for x, y in points:
                      dx = x - qx
                      dy = y - qy
                      if dx * dx + dy * dy <= rr:
                          c += 1
                  answer.append(c)
              return answer
        `,
        javascript: code`
          var countPoints = function(points, queries) {
              var answer = [];
              for (var j = 0; j < queries.length; j++) {
                  var qx = queries[j][0], qy = queries[j][1], rr = queries[j][2] * queries[j][2];
                  var c = 0;
                  for (var i = 0; i < points.length; i++) {
                      var dx = points[i][0] - qx, dy = points[i][1] - qy;
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer.push(c);
              }
              return answer;
          };
        `,
        typescript: code`
          function countPoints(points: number[][], queries: number[][]): number[] {
              var answer: number[] = [];
              for (var j = 0; j < queries.length; j++) {
                  var qx = queries[j][0], qy = queries[j][1], rr = queries[j][2] * queries[j][2];
                  var c = 0;
                  for (var i = 0; i < points.length; i++) {
                      var dx = points[i][0] - qx, dy = points[i][1] - qy;
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer.push(c);
              }
              return answer;
          }
        `,
        java: code`
          public static int[] countPoints(int[][] points, int[][] queries) {
              int[] answer = new int[queries.length];
              for (int j = 0; j < queries.length; j++) {
                  int qx = queries[j][0], qy = queries[j][1], rr = queries[j][2] * queries[j][2];
                  int c = 0;
                  for (int[] p : points) {
                      int dx = p[0] - qx, dy = p[1] - qy;
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer[j] = c;
              }
              return answer;
          }
        `,
        cpp: code`
          vector<int> countPoints(vector<vector<int>>& points, vector<vector<int>>& queries) {
              vector<int> answer;
              for (auto& q : queries) {
                  int rr = q[2] * q[2];
                  int c = 0;
                  for (auto& p : points) {
                      int dx = p[0] - q[0], dy = p[1] - q[1];
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer.push_back(c);
              }
              return answer;
          }
        `,
        c: code`
          int* countPoints(int** points, int pointsSize, int* pointsColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* answer = (int*) malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int j = 0; j < queriesSize; j++) {
                  int qx = queries[j][0], qy = queries[j][1], rr = queries[j][2] * queries[j][2];
                  int c = 0;
                  for (int i = 0; i < pointsSize; i++) {
                      int dx = points[i][0] - qx, dy = points[i][1] - qy;
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer[j] = c;
              }
              *returnSize = queriesSize;
              return answer;
          }
        `,
        csharp: code`
          public static int[] CountPoints(int[][] points, int[][] queries)
          {
              int[] answer = new int[queries.Length];
              for (int j = 0; j < queries.Length; j++)
              {
                  int qx = queries[j][0], qy = queries[j][1], rr = queries[j][2] * queries[j][2];
                  int c = 0;
                  foreach (var p in points)
                  {
                      int dx = p[0] - qx, dy = p[1] - qy;
                      if (dx * dx + dy * dy <= rr) c++;
                  }
                  answer[j] = c;
              }
              return answer;
          }
        `,
        go: code`
          func countPoints(points [][]int, queries [][]int) []int {
              answer := make([]int, len(queries))
              for j, q := range queries {
                  rr := q[2] * q[2]
                  c := 0
                  for _, p := range points {
                      dx := p[0] - q[0]
                      dy := p[1] - q[1]
                      if dx*dx+dy*dy <= rr {
                          c++
                      }
                  }
                  answer[j] = c
              }
              return answer
          }
        `,
        kotlin: code`
          fun countPoints(points: Array<IntArray>, queries: Array<IntArray>): IntArray {
              val answer = IntArray(queries.size)
              for (j in queries.indices) {
                  val qx = queries[j][0]
                  val qy = queries[j][1]
                  val rr = queries[j][2] * queries[j][2]
                  var c = 0
                  for (p in points) {
                      val dx = p[0] - qx
                      val dy = p[1] - qy
                      if (dx * dx + dy * dy <= rr) c++
                  }
                  answer[j] = c
              }
              return answer
          }
        `,
        swift: code`
          func countPoints(_ points: [[Int]], _ queries: [[Int]]) -> [Int] {
              var answer = [Int]()
              for q in queries {
                  let rr = q[2] * q[2]
                  var c = 0
                  for p in points {
                      let dx = p[0] - q[0]
                      let dy = p[1] - q[1]
                      if dx * dx + dy * dy <= rr { c += 1 }
                  }
                  answer.append(c)
              }
              return answer
          }
        `,
        rust: code`
          fn countPoints(points: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let mut answer = Vec::with_capacity(queries.len());
              for q in queries.iter() {
                  let rr = q[2] * q[2];
                  let mut c = 0;
                  for p in points.iter() {
                      let dx = p[0] - q[0];
                      let dy = p[1] - q[1];
                      if dx * dx + dy * dy <= rr {
                          c += 1;
                      }
                  }
                  answer.push(c);
              }
              answer
          }
        `,
        php: code`
          function countPoints($points, $queries) {
              $answer = [];
              foreach ($queries as $q) {
                  $rr = $q[2] * $q[2];
                  $c = 0;
                  foreach ($points as $p) {
                      $dx = $p[0] - $q[0];
                      $dy = $p[1] - $q[1];
                      if ($dx * $dx + $dy * $dy <= $rr) $c++;
                  }
                  $answer[] = $c;
              }
              return $answer;
          }
        `,
        ruby: code`
          def countPoints(points, queries)
            queries.map do |qx, qy, r|
              rr = r * r
              points.count { |x, y| (x - qx) * (x - qx) + (y - qy) * (y - qy) <= rr }
            end
          end
        `,
      },
    };
  })(),

  // ── Count Lattice Points Inside a Circle (LC 2249) ───────────────
  (() => {
    const ref = (circles: number[][]) => {
      // Scan the bounding box of all circles and test each lattice point.
      let lx = Infinity, hx = -Infinity, ly = Infinity, hy = -Infinity;
      for (const [x, y, r] of circles) { lx = Math.min(lx, x - r); hx = Math.max(hx, x + r); ly = Math.min(ly, y - r); hy = Math.max(hy, y + r); }
      let count = 0;
      for (let i = lx; i <= hx; i++) {
        for (let j = ly; j <= hy; j++) {
          if (circles.some(([x, y, r]) => (i - x) ** 2 + (j - y) ** 2 <= r * r)) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-lattice-points-inside-a-circle",
      title: "Count Lattice Points Inside a Circle",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Geometry", "Enumeration", "Rubrik", "Amazon"],
      signature: { funcName: "countLatticePoints", params: [{ name: "circles", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`circles[i] = [xi, yi, ri]` is a circle with centre `(xi, yi)` and radius `ri`. A **lattice point** is a point whose coordinates are both integers.\n\nReturn the number of distinct lattice points that lie inside **at least one** circle. Points on a circle's boundary count as inside.",
        [
          { in: "circles = [[3,3,1]]", out: "5", note: "The centre and its four neighbours at distance 1." },
          { in: "circles = [[2,2,2]]", out: "13" },
          { in: "circles = [[2,2,1],[4,2,1]]", out: "9", note: "Each circle covers 5 points and they share (3, 2)." },
        ],
        ["1 <= circles.length <= 200", "circles[i].length == 3", "1 <= xi, yi <= 100", "1 <= ri <= min(xi, yi)"]),
      hints: [
        "Every covered point lies within `[0, 200]` in both coordinates, a grid of only 201 × 201.",
        "Visiting every grid point for every circle works, but you only need to visit each circle's own bounding square.",
        "Mark covered points in a boolean grid so a point inside several circles is counted once.",
      ],
      editorial: explain({
        idea: "The circles live in a small box, so mark every lattice point each circle covers in a boolean grid and count the distinct marks.",
        steps: [
          "Create a 201 × 201 boolean grid (coordinates 0 to 200) and a counter.",
          "For each circle `[x, y, r]`, loop `i` from `x - r` to `x + r` and `j` from `y - r` to `y + r`.",
          "If `(i - x)² + (j - y)² <= r²` and the cell is unmarked, mark it and increment the counter.",
          "Return the counter.",
        ],
        why: "A lattice point inside circle `[x, y, r]` has `|i - x| <= r` and `|j - y| <= r`, so the bounding square contains every candidate; the squared-distance test selects exactly the points in the closed disk. The constraint `r <= min(x, y)` with `x, y <= 100` keeps every candidate in `[0, 200]`, so the grid is never indexed out of range. Marking before counting ensures a point shared by several circles is counted once.",
        time: "O(Σ (2r + 1)²) — at most 200 · 201² checks",
        space: "O(201²)",
        pitfalls: [
          "Counting per circle and summing double-counts points in overlaps; mark first.",
          "Include the boundary (`<=`).",
          "Use the bounding square of each circle, not the whole grid per circle, if you want it fast.",
        ],
      }),
      examples: [
        { input: "[[3,3,1]]", expectedOutput: "5" },
        { input: "[[2,2,2]]", expectedOutput: "13" },
        { input: "[[2,2,1],[4,2,1]]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.01;
        const n = big ? ri(rng, 1, 2) : ri(rng, 1, pick(rng, [1, 3, 6]));
        const L = big ? 100 : pick(rng, [5, 15, 30]);
        const R = big ? 60 : 8;
        const circles = Array.from({ length: n }, () => {
          const x = ri(rng, 1, L), y = ri(rng, 1, L);
          return [x, y, ri(rng, 1, Math.min(x, y, R))];
        });
        if (n > 1 && rng() < 0.15) circles[1] = circles[0].slice();
        return { input: fmtIntMat(circles), expectedOutput: String(ref(circles)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countLatticePoints(circles: List[List[int]]) -> int:
              seen = bytearray(201 * 201)
              count = 0
              for x, y, r in circles:
                  rr = r * r
                  for i in range(x - r, x + r + 1):
                      dx2 = (i - x) * (i - x)
                      base = i * 201
                      for j in range(y - r, y + r + 1):
                          if dx2 + (j - y) * (j - y) <= rr and not seen[base + j]:
                              seen[base + j] = 1
                              count += 1
              return count
        `,
        javascript: code`
          var countLatticePoints = function(circles) {
              var seen = new Uint8Array(201 * 201);
              var count = 0;
              for (var c = 0; c < circles.length; c++) {
                  var x = circles[c][0], y = circles[c][1], r = circles[c][2], rr = r * r;
                  for (var i = x - r; i <= x + r; i++) {
                      for (var j = y - r; j <= y + r; j++) {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j]) {
                              seen[i * 201 + j] = 1;
                              count++;
                          }
                      }
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function countLatticePoints(circles: number[][]): number {
              var seen: { [k: number]: boolean } = {};
              var count = 0;
              for (var c = 0; c < circles.length; c++) {
                  var x = circles[c][0], y = circles[c][1], r = circles[c][2], rr = r * r;
                  for (var i = x - r; i <= x + r; i++) {
                      for (var j = y - r; j <= y + r; j++) {
                          var key = i * 201 + j;
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[key]) {
                              seen[key] = true;
                              count++;
                          }
                      }
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int countLatticePoints(int[][] circles) {
              boolean[] seen = new boolean[201 * 201];
              int count = 0;
              for (int[] c : circles) {
                  int x = c[0], y = c[1], r = c[2], rr = r * r;
                  for (int i = x - r; i <= x + r; i++) {
                      for (int j = y - r; j <= y + r; j++) {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j]) {
                              seen[i * 201 + j] = true;
                              count++;
                          }
                      }
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int countLatticePoints(vector<vector<int>>& circles) {
              vector<char> seen(201 * 201, 0);
              int count = 0;
              for (auto& c : circles) {
                  int x = c[0], y = c[1], r = c[2], rr = r * r;
                  for (int i = x - r; i <= x + r; i++) {
                      for (int j = y - r; j <= y + r; j++) {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j]) {
                              seen[i * 201 + j] = 1;
                              count++;
                          }
                      }
                  }
              }
              return count;
          }
        `,
        c: code`
          static char latticeSeen[201 * 201];

          int countLatticePoints(int** circles, int circlesSize, int* circlesColSize) {
              memset(latticeSeen, 0, sizeof(latticeSeen));
              int count = 0;
              for (int c = 0; c < circlesSize; c++) {
                  int x = circles[c][0], y = circles[c][1], r = circles[c][2], rr = r * r;
                  for (int i = x - r; i <= x + r; i++) {
                      for (int j = y - r; j <= y + r; j++) {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !latticeSeen[i * 201 + j]) {
                              latticeSeen[i * 201 + j] = 1;
                              count++;
                          }
                      }
                  }
              }
              return count;
          }
        `,
        csharp: code`
          public static int CountLatticePoints(int[][] circles)
          {
              bool[] seen = new bool[201 * 201];
              int count = 0;
              foreach (var c in circles)
              {
                  int x = c[0], y = c[1], r = c[2], rr = r * r;
                  for (int i = x - r; i <= x + r; i++)
                  {
                      for (int j = y - r; j <= y + r; j++)
                      {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j])
                          {
                              seen[i * 201 + j] = true;
                              count++;
                          }
                      }
                  }
              }
              return count;
          }
        `,
        go: code`
          func countLatticePoints(circles [][]int) int {
              seen := make([]bool, 201*201)
              count := 0
              for _, c := range circles {
                  x, y, r := c[0], c[1], c[2]
                  rr := r * r
                  for i := x - r; i <= x+r; i++ {
                      for j := y - r; j <= y+r; j++ {
                          if (i-x)*(i-x)+(j-y)*(j-y) <= rr && !seen[i*201+j] {
                              seen[i*201+j] = true
                              count++
                          }
                      }
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun countLatticePoints(circles: Array<IntArray>): Int {
              val seen = BooleanArray(201 * 201)
              var count = 0
              for (c in circles) {
                  val x = c[0]
                  val y = c[1]
                  val r = c[2]
                  val rr = r * r
                  for (i in x - r..x + r) {
                      for (j in y - r..y + r) {
                          if ((i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j]) {
                              seen[i * 201 + j] = true
                              count++
                          }
                      }
                  }
              }
              return count
          }
        `,
        swift: code`
          func countLatticePoints(_ circles: [[Int]]) -> Int {
              var seen = [Bool](repeating: false, count: 201 * 201)
              var count = 0
              for c in circles {
                  let x = c[0], y = c[1], r = c[2]
                  let rr = r * r
                  for i in (x - r)...(x + r) {
                      for j in (y - r)...(y + r) {
                          if (i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[i * 201 + j] {
                              seen[i * 201 + j] = true
                              count += 1
                          }
                      }
                  }
              }
              return count
          }
        `,
        rust: code`
          fn countLatticePoints(circles: Vec<Vec<i32>>) -> i32 {
              let mut seen = vec![false; 201 * 201];
              let mut count = 0;
              for c in circles.iter() {
                  let (x, y, r) = (c[0], c[1], c[2]);
                  let rr = r * r;
                  for i in (x - r)..=(x + r) {
                      for j in (y - r)..=(y + r) {
                          let k = (i * 201 + j) as usize;
                          if (i - x) * (i - x) + (j - y) * (j - y) <= rr && !seen[k] {
                              seen[k] = true;
                              count += 1;
                          }
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function countLatticePoints($circles) {
              $seen = [];
              $count = 0;
              foreach ($circles as $c) {
                  $x = $c[0]; $y = $c[1]; $r = $c[2];
                  $rr = $r * $r;
                  for ($i = $x - $r; $i <= $x + $r; $i++) {
                      for ($j = $y - $r; $j <= $y + $r; $j++) {
                          $k = $i * 201 + $j;
                          if (($i - $x) * ($i - $x) + ($j - $y) * ($j - $y) <= $rr && !isset($seen[$k])) {
                              $seen[$k] = true;
                              $count++;
                          }
                      }
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def countLatticePoints(circles)
            seen = {}
            circles.each do |x, y, r|
              rr = r * r
              (x - r..x + r).each do |i|
                dx2 = (i - x) * (i - x)
                (y - r..y + r).each do |j|
                  seen[i * 201 + j] = true if dx2 + (j - y) * (j - y) <= rr
                end
              end
            end
            seen.size
          end
        `,
      },
    };
  })(),

  // ── Rectangle Area II (LC 850) ───────────────────────────────────
  (() => {
    const MOD = 1000000007n;
    const ref = (rects: number[][]) => {
      if (rects.every((r) => r.every((v) => v <= 12))) {
        // Unit-cell brute force.
        let c = 0;
        for (let x = 0; x < 12; x++) {
          for (let y = 0; y < 12; y++) {
            if (rects.some((r) => r[0] <= x && x + 1 <= r[2] && r[1] <= y && y + 1 <= r[3])) c++;
          }
        }
        return c;
      }
      const xs = [...new Set(rects.flatMap((r) => [r[0], r[2]]))].sort((a, b) => a - b);
      const ys = [...new Set(rects.flatMap((r) => [r[1], r[3]]))].sort((a, b) => a - b);
      let total = 0n;
      for (let i = 0; i + 1 < xs.length; i++) {
        for (let j = 0; j + 1 < ys.length; j++) {
          const hit = rects.some((r) => r[0] <= xs[i] && xs[i + 1] <= r[2] && r[1] <= ys[j] && ys[j + 1] <= r[3]);
          if (hit) total += BigInt(xs[i + 1] - xs[i]) * BigInt(ys[j + 1] - ys[j]);
        }
      }
      return Number(total % MOD);
    };
    return {
      slug: "rectangle-area-ii",
      title: "Rectangle Area II",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Geometry", "Sorting", "Google", "Uber", "Amazon"],
      signature: { funcName: "rectangleArea", params: [{ name: "rectangles", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Each `rectangles[i] = [x1, y1, x2, y2]` is an axis-aligned rectangle with bottom-left corner `(x1, y1)` and top-right corner `(x2, y2)`. Rectangles may overlap, nest, repeat, or be degenerate (zero width or height).\n\nReturn the **total area of the union** of all the rectangles — ground covered by several rectangles counts once. The area can be enormous, so return it **modulo** `10^9 + 7`.",
        [
          { in: "rectangles = [[0,0,3,2],[2,1,5,4]]", out: "14", note: "6 + 9 minus the shared 1 x 1 square." },
          { in: "rectangles = [[0,0,1000000000,1000000000]]", out: "49", note: "10^18 mod (10^9 + 7) = 49." },
          { in: "rectangles = [[1,1,4,4],[2,2,3,3],[0,5,2,5]]", out: "9", note: "The second rectangle lies inside the first and the third has no height." },
        ],
        ["1 <= rectangles.length <= 200", "rectangles[i].length == 4", "0 <= x1, y1, x2, y2 <= 10^9", "x1 <= x2", "y1 <= y2"]),
      hints: [
        "Only the distinct x-coordinates and y-coordinates of the corners matter; between consecutive ones nothing changes.",
        "Those coordinates cut the plane into at most 399 × 399 elementary cells, each fully covered or fully uncovered.",
        "Mark the cells each rectangle covers, then add `width × height` of every marked cell — multiply in 64 bits and reduce modulo 10^9 + 7.",
      ],
      editorial: explain({
        idea: "Coordinate compression: the sorted distinct x- and y-coordinates split the plane into a grid of cells, and every cell is either entirely inside the union or entirely outside it.",
        steps: [
          "Collect every `x1, x2` into a sorted list `xs` without duplicates, and every `y1, y2` into `ys`.",
          "Build a boolean grid `covered` of size `|xs| × |ys|`; cell `(i, j)` stands for the box `[xs[i], xs[i+1]] × [ys[j], ys[j+1]]`.",
          "For each rectangle, find the indices of its corners in `xs` and `ys` and mark every cell between them.",
          "Sum `(xs[i+1] - xs[i]) · (ys[j+1] - ys[j])` over the marked cells, reducing modulo 10^9 + 7 after each addition.",
        ],
        why: "Every rectangle edge lies on one of the compressed coordinates, so no rectangle boundary passes through the interior of a cell: a cell is either inside a given rectangle or disjoint from its interior. The union is therefore exactly the set of marked cells, the cells do not overlap, and summing their areas counts every covered point once.",
        time: "O(n³) — n rectangles each marking up to 2n × 2n cells",
        space: "O(n²)",
        pitfalls: [
          "A single cell can be 10^9 × 10^9 = 10^18, past 32-bit and past JavaScript's exact integers — multiply in 64 bits (or split the multiplication) before reducing.",
          "Reduce the modulus only at the end of each addition; the true area itself is not stored anywhere.",
          "Degenerate rectangles have equal indices and mark nothing — make sure your loops handle an empty range.",
        ],
      }),
      examples: [
        { input: "[[0,0,3,2],[2,1,5,4]]", expectedOutput: "14" },
        { input: "[[0,0,1000000000,1000000000]]", expectedOutput: "49" },
        { input: "[[1,1,4,4],[2,2,3,3],[0,5,2,5]]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const L = pick(rng, [12, 12, 12, 1000, 1000000, 1000000000]);
        const rects = Array.from({ length: n }, () => {
          const x1 = ri(rng, 0, L - 1), y1 = ri(rng, 0, L - 1);
          const w = rng() < 0.04 ? 0 : ri(rng, 1, L - x1), h = rng() < 0.04 ? 0 : ri(rng, 1, L - y1);
          return [x1, y1, x1 + w, y1 + h];
        });
        if (n > 1 && rng() < 0.2) rects[n - 1] = rects[0].slice();
        if (L === 1000000000 && rng() < 0.15) rects[0] = [0, 0, L, L];
        return { input: fmtIntMat(rects), expectedOutput: String(ref(rects)) };
      },
      solutions: {
        python: code`
          from typing import List

          def rectangleArea(rectangles: List[List[int]]) -> int:
              MOD = 10 ** 9 + 7
              xs = sorted(set([r[0] for r in rectangles] + [r[2] for r in rectangles]))
              ys = sorted(set([r[1] for r in rectangles] + [r[3] for r in rectangles]))
              xi = {v: i for i, v in enumerate(xs)}
              yi = {v: i for i, v in enumerate(ys)}
              covered = [[False] * len(ys) for _ in range(len(xs))]
              for x1, y1, x2, y2 in rectangles:
                  for i in range(xi[x1], xi[x2]):
                      row = covered[i]
                      for j in range(yi[y1], yi[y2]):
                          row[j] = True
              total = 0
              for i in range(len(xs) - 1):
                  w = xs[i + 1] - xs[i]
                  row = covered[i]
                  for j in range(len(ys) - 1):
                      if row[j]:
                          total += w * (ys[j + 1] - ys[j])
              return total % MOD
        `,
        javascript: code`
          var rectangleArea = function(rectangles) {
              var MOD = 1000000007;
              var mulMod = function(a, b) {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var uniq = function(a) {
                  a.sort(function(p, q) { return p - q; });
                  var out = [];
                  for (var i = 0; i < a.length; i++) if (i === 0 || a[i] !== a[i - 1]) out.push(a[i]);
                  return out;
              };
              var xs = [], ys = [];
              for (var k = 0; k < rectangles.length; k++) {
                  xs.push(rectangles[k][0], rectangles[k][2]);
                  ys.push(rectangles[k][1], rectangles[k][3]);
              }
              xs = uniq(xs);
              ys = uniq(ys);
              var xi = new Map(), yi = new Map();
              for (k = 0; k < xs.length; k++) xi.set(xs[k], k);
              for (k = 0; k < ys.length; k++) yi.set(ys[k], k);
              var covered = [];
              for (var i = 0; i < xs.length; i++) covered.push(new Array(ys.length).fill(false));
              for (k = 0; k < rectangles.length; k++) {
                  var r = rectangles[k];
                  var a = xi.get(r[0]), b = xi.get(r[2]), c = yi.get(r[1]), d = yi.get(r[3]);
                  for (i = a; i < b; i++) for (var j = c; j < d; j++) covered[i][j] = true;
              }
              var total = 0;
              for (i = 0; i + 1 < xs.length; i++) {
                  for (j = 0; j + 1 < ys.length; j++) {
                      if (covered[i][j]) total = (total + mulMod(xs[i + 1] - xs[i], ys[j + 1] - ys[j])) % MOD;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function rectangleArea(rectangles: number[][]): number {
              var MOD = 1000000007;
              var mulMod = function(a: number, b: number): number {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var uniq = function(a: number[]): number[] {
                  a.sort(function(p, q) { return p - q; });
                  var out: number[] = [];
                  for (var i = 0; i < a.length; i++) if (i === 0 || a[i] !== a[i - 1]) out.push(a[i]);
                  return out;
              };
              var indexOf = function(a: number[], v: number): number {
                  var lo = 0, hi = a.length - 1;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (a[mid] < v) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              var xs: number[] = [], ys: number[] = [];
              for (var k = 0; k < rectangles.length; k++) {
                  xs.push(rectangles[k][0], rectangles[k][2]);
                  ys.push(rectangles[k][1], rectangles[k][3]);
              }
              xs = uniq(xs);
              ys = uniq(ys);
              var covered: boolean[][] = [];
              for (var i = 0; i < xs.length; i++) {
                  var row: boolean[] = [];
                  for (var j = 0; j < ys.length; j++) row.push(false);
                  covered.push(row);
              }
              for (k = 0; k < rectangles.length; k++) {
                  var r = rectangles[k];
                  var a = indexOf(xs, r[0]), b = indexOf(xs, r[2]), c = indexOf(ys, r[1]), d = indexOf(ys, r[3]);
                  for (i = a; i < b; i++) for (j = c; j < d; j++) covered[i][j] = true;
              }
              var total = 0;
              for (i = 0; i + 1 < xs.length; i++) {
                  for (j = 0; j + 1 < ys.length; j++) {
                      if (covered[i][j]) total = (total + mulMod(xs[i + 1] - xs[i], ys[j + 1] - ys[j])) % MOD;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int rectangleArea(int[][] rectangles) {
              final long MOD = 1000000007L;
              TreeSet<Integer> xSet = new TreeSet<>(), ySet = new TreeSet<>();
              for (int[] r : rectangles) {
                  xSet.add(r[0]); xSet.add(r[2]);
                  ySet.add(r[1]); ySet.add(r[3]);
              }
              int[] xs = new int[xSet.size()];
              int k = 0;
              for (int v : xSet) xs[k++] = v;
              int[] ys = new int[ySet.size()];
              k = 0;
              for (int v : ySet) ys[k++] = v;
              boolean[][] covered = new boolean[xs.length][ys.length];
              for (int[] r : rectangles) {
                  int a = Arrays.binarySearch(xs, r[0]), b = Arrays.binarySearch(xs, r[2]);
                  int c = Arrays.binarySearch(ys, r[1]), d = Arrays.binarySearch(ys, r[3]);
                  for (int i = a; i < b; i++)
                      for (int j = c; j < d; j++) covered[i][j] = true;
              }
              long total = 0;
              for (int i = 0; i + 1 < xs.length; i++) {
                  for (int j = 0; j + 1 < ys.length; j++) {
                      if (covered[i][j]) total = (total + (long) (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int rectangleArea(vector<vector<int>>& rectangles) {
              const long long MOD = 1000000007LL;
              vector<int> xs, ys;
              for (auto& r : rectangles) {
                  xs.push_back(r[0]); xs.push_back(r[2]);
                  ys.push_back(r[1]); ys.push_back(r[3]);
              }
              sort(xs.begin(), xs.end());
              xs.erase(unique(xs.begin(), xs.end()), xs.end());
              sort(ys.begin(), ys.end());
              ys.erase(unique(ys.begin(), ys.end()), ys.end());
              vector<vector<char>> covered(xs.size(), vector<char>(ys.size(), 0));
              for (auto& r : rectangles) {
                  int a = lower_bound(xs.begin(), xs.end(), r[0]) - xs.begin();
                  int b = lower_bound(xs.begin(), xs.end(), r[2]) - xs.begin();
                  int c = lower_bound(ys.begin(), ys.end(), r[1]) - ys.begin();
                  int d = lower_bound(ys.begin(), ys.end(), r[3]) - ys.begin();
                  for (int i = a; i < b; i++)
                      for (int j = c; j < d; j++) covered[i][j] = 1;
              }
              long long total = 0;
              for (size_t i = 0; i + 1 < xs.size(); i++) {
                  for (size_t j = 0; j + 1 < ys.size(); j++) {
                      if (covered[i][j]) total = (total + (long long) (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        c: code`
          static int areaCmp(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int areaIdx(int* arr, int len, int v) {
              int lo = 0, hi = len - 1;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (arr[mid] < v) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          int rectangleArea(int** rectangles, int rectanglesSize, int* rectanglesColSize) {
              const long long MOD = 1000000007LL;
              int n = rectanglesSize;
              int* xs = (int*) malloc(sizeof(int) * 2 * n);
              int* ys = (int*) malloc(sizeof(int) * 2 * n);
              for (int k = 0; k < n; k++) {
                  xs[2 * k] = rectangles[k][0]; xs[2 * k + 1] = rectangles[k][2];
                  ys[2 * k] = rectangles[k][1]; ys[2 * k + 1] = rectangles[k][3];
              }
              qsort(xs, 2 * n, sizeof(int), areaCmp);
              qsort(ys, 2 * n, sizeof(int), areaCmp);
              int nx = 0, ny = 0;
              for (int k = 0; k < 2 * n; k++) if (nx == 0 || xs[k] != xs[nx - 1]) xs[nx++] = xs[k];
              for (int k = 0; k < 2 * n; k++) if (ny == 0 || ys[k] != ys[ny - 1]) ys[ny++] = ys[k];
              char* covered = (char*) calloc((size_t) nx * ny, 1);
              for (int k = 0; k < n; k++) {
                  int a = areaIdx(xs, nx, rectangles[k][0]), b = areaIdx(xs, nx, rectangles[k][2]);
                  int c = areaIdx(ys, ny, rectangles[k][1]), d = areaIdx(ys, ny, rectangles[k][3]);
                  for (int i = a; i < b; i++)
                      for (int j = c; j < d; j++) covered[i * ny + j] = 1;
              }
              long long total = 0;
              for (int i = 0; i + 1 < nx; i++) {
                  for (int j = 0; j + 1 < ny; j++) {
                      if (covered[i * ny + j]) total = (total + (long long) (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])) % MOD;
                  }
              }
              free(xs);
              free(ys);
              free(covered);
              return (int) total;
          }
        `,
        csharp: code`
          public static int RectangleArea(int[][] rectangles)
          {
              const long MOD = 1000000007L;
              var xl = new List<int>();
              var yl = new List<int>();
              foreach (var r in rectangles)
              {
                  xl.Add(r[0]); xl.Add(r[2]);
                  yl.Add(r[1]); yl.Add(r[3]);
              }
              int[] xs = xl.Distinct().OrderBy(v => v).ToArray();
              int[] ys = yl.Distinct().OrderBy(v => v).ToArray();
              var covered = new bool[xs.Length, ys.Length];
              foreach (var r in rectangles)
              {
                  int a = Array.BinarySearch(xs, r[0]), b = Array.BinarySearch(xs, r[2]);
                  int c = Array.BinarySearch(ys, r[1]), d = Array.BinarySearch(ys, r[3]);
                  for (int i = a; i < b; i++)
                      for (int j = c; j < d; j++) covered[i, j] = true;
              }
              long total = 0;
              for (int i = 0; i + 1 < xs.Length; i++)
              {
                  for (int j = 0; j + 1 < ys.Length; j++)
                  {
                      if (covered[i, j]) total = (total + (long) (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        go: code`
          func rectangleArea(rectangles [][]int) int {
              const MOD = 1000000007
              xs := []int{}
              ys := []int{}
              for _, r := range rectangles {
                  xs = append(xs, r[0], r[2])
                  ys = append(ys, r[1], r[3])
              }
              xs = areaUniq(xs)
              ys = areaUniq(ys)
              covered := make([][]bool, len(xs))
              for i := range covered {
                  covered[i] = make([]bool, len(ys))
              }
              for _, r := range rectangles {
                  a, b := sort.SearchInts(xs, r[0]), sort.SearchInts(xs, r[2])
                  c, d := sort.SearchInts(ys, r[1]), sort.SearchInts(ys, r[3])
                  for i := a; i < b; i++ {
                      for j := c; j < d; j++ {
                          covered[i][j] = true
                      }
                  }
              }
              total := 0
              for i := 0; i+1 < len(xs); i++ {
                  for j := 0; j+1 < len(ys); j++ {
                      if covered[i][j] {
                          total = (total + (xs[i+1]-xs[i])*(ys[j+1]-ys[j])) % MOD
                      }
                  }
              }
              return total
          }

          func areaUniq(a []int) []int {
              sort.Ints(a)
              out := []int{}
              for i, v := range a {
                  if i == 0 || v != a[i-1] {
                      out = append(out, v)
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun rectangleArea(rectangles: Array<IntArray>): Int {
              val MOD = 1_000_000_007L
              val xs = rectangles.flatMap { listOf(it[0], it[2]) }.distinct().sorted().toIntArray()
              val ys = rectangles.flatMap { listOf(it[1], it[3]) }.distinct().sorted().toIntArray()
              val covered = Array(xs.size) { BooleanArray(ys.size) }
              for (r in rectangles) {
                  val a = java.util.Arrays.binarySearch(xs, r[0])
                  val b = java.util.Arrays.binarySearch(xs, r[2])
                  val c = java.util.Arrays.binarySearch(ys, r[1])
                  val d = java.util.Arrays.binarySearch(ys, r[3])
                  for (i in a until b) {
                      for (j in c until d) covered[i][j] = true
                  }
              }
              var total = 0L
              for (i in 0 until xs.size - 1) {
                  for (j in 0 until ys.size - 1) {
                      if (covered[i][j]) total = (total + (xs[i + 1] - xs[i]).toLong() * (ys[j + 1] - ys[j])) % MOD
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func rectangleArea(_ rectangles: [[Int]]) -> Int {
              let MOD = 1_000_000_007
              var xSet = Set<Int>(), ySet = Set<Int>()
              for r in rectangles {
                  xSet.insert(r[0]); xSet.insert(r[2])
                  ySet.insert(r[1]); ySet.insert(r[3])
              }
              let xs = xSet.sorted(), ys = ySet.sorted()
              var xi = [Int: Int](), yi = [Int: Int]()
              for (i, v) in xs.enumerated() { xi[v] = i }
              for (i, v) in ys.enumerated() { yi[v] = i }
              var covered = [[Bool]](repeating: [Bool](repeating: false, count: ys.count), count: xs.count)
              for r in rectangles {
                  let a = xi[r[0]]!, b = xi[r[2]]!, c = yi[r[1]]!, d = yi[r[3]]!
                  if a < b && c < d {
                      for i in a..<b {
                          for j in c..<d { covered[i][j] = true }
                      }
                  }
              }
              var total = 0
              for i in 0..<(xs.count - 1) {
                  for j in 0..<(ys.count - 1) {
                      if covered[i][j] { total = (total + (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])) % MOD }
                  }
              }
              return total
          }
        `,
        rust: code`
          fn rectangleArea(rectangles: Vec<Vec<i32>>) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let mut xs: Vec<i32> = Vec::new();
              let mut ys: Vec<i32> = Vec::new();
              for r in rectangles.iter() {
                  xs.push(r[0]);
                  xs.push(r[2]);
                  ys.push(r[1]);
                  ys.push(r[3]);
              }
              xs.sort();
              xs.dedup();
              ys.sort();
              ys.dedup();
              let mut covered = vec![vec![false; ys.len()]; xs.len()];
              for r in rectangles.iter() {
                  let a = xs.binary_search(&r[0]).unwrap();
                  let b = xs.binary_search(&r[2]).unwrap();
                  let c = ys.binary_search(&r[1]).unwrap();
                  let d = ys.binary_search(&r[3]).unwrap();
                  for i in a..b {
                      for j in c..d {
                          covered[i][j] = true;
                      }
                  }
              }
              let mut total: i64 = 0;
              for i in 0..xs.len() - 1 {
                  for j in 0..ys.len() - 1 {
                      if covered[i][j] {
                          let w = (xs[i + 1] - xs[i]) as i64;
                          let h = (ys[j + 1] - ys[j]) as i64;
                          total = (total + w * h) % MOD;
                      }
                  }
              }
              total as i32
          }
        `,
        php: code`
          function rectangleArea($rectangles) {
              $MOD = 1000000007;
              $xs = [];
              $ys = [];
              foreach ($rectangles as $r) {
                  $xs[] = $r[0]; $xs[] = $r[2];
                  $ys[] = $r[1]; $ys[] = $r[3];
              }
              $xs = array_values(array_unique($xs));
              sort($xs);
              $ys = array_values(array_unique($ys));
              sort($ys);
              $xi = array_flip($xs);
              $yi = array_flip($ys);
              $nx = count($xs);
              $ny = count($ys);
              $covered = array_fill(0, $nx * $ny, false);
              foreach ($rectangles as $r) {
                  for ($i = $xi[$r[0]]; $i < $xi[$r[2]]; $i++) {
                      for ($j = $yi[$r[1]]; $j < $yi[$r[3]]; $j++) $covered[$i * $ny + $j] = true;
                  }
              }
              $total = 0;
              for ($i = 0; $i + 1 < $nx; $i++) {
                  for ($j = 0; $j + 1 < $ny; $j++) {
                      if ($covered[$i * $ny + $j]) $total = ($total + ($xs[$i + 1] - $xs[$i]) * ($ys[$j + 1] - $ys[$j])) % $MOD;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def rectangleArea(rectangles)
            modulus = 1_000_000_007
            xs = rectangles.flat_map { |r| [r[0], r[2]] }.uniq.sort
            ys = rectangles.flat_map { |r| [r[1], r[3]] }.uniq.sort
            xi = {}
            xs.each_with_index { |v, i| xi[v] = i }
            yi = {}
            ys.each_with_index { |v, i| yi[v] = i }
            covered = Array.new(xs.size) { Array.new(ys.size, false) }
            rectangles.each do |x1, y1, x2, y2|
              (xi[x1]...xi[x2]).each do |i|
                (yi[y1]...yi[y2]).each { |j| covered[i][j] = true }
              end
            end
            total = 0
            (0...xs.size - 1).each do |i|
              (0...ys.size - 1).each do |j|
                total += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]) if covered[i][j]
              end
            end
            total % modulus
          end
        `,
      },
    };
  })(),

  // ── Perfect Rectangle (LC 391) ───────────────────────────────────
  (() => {
    const ref = (rects: number[][]) => {
      // Unit-cell brute force on small coordinates: every cell of the
      // bounding box must be covered exactly once.
      const minX = Math.min(...rects.map((r) => r[0])), minY = Math.min(...rects.map((r) => r[1]));
      const maxX = Math.max(...rects.map((r) => r[2])), maxY = Math.max(...rects.map((r) => r[3]));
      for (let x = minX; x < maxX; x++) {
        for (let y = minY; y < maxY; y++) {
          let c = 0;
          for (const r of rects) if (r[0] <= x && x + 1 <= r[2] && r[1] <= y && y + 1 <= r[3]) c++;
          if (c !== 1) return false;
        }
      }
      return true;
    };
    const split = (rng: Rng, r: number[], pieces: number): number[][] => {
      if (pieces <= 1) return [r];
      const [x1, y1, x2, y2] = r;
      const canV = x2 - x1 >= 2, canH = y2 - y1 >= 2;
      if (!canV && !canH) return [r];
      const vertical = canV && (!canH || rng() < 0.5);
      const left = ri(rng, 1, pieces - 1);
      if (vertical) {
        const m = ri(rng, x1 + 1, x2 - 1);
        return split(rng, [x1, y1, m, y2], left).concat(split(rng, [m, y1, x2, y2], pieces - left));
      }
      const m = ri(rng, y1 + 1, y2 - 1);
      return split(rng, [x1, y1, x2, m], left).concat(split(rng, [x1, m, x2, y2], pieces - left));
    };
    return {
      slug: "perfect-rectangle",
      title: "Perfect Rectangle",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Math", "Geometry", "Google", "Amazon"],
      signature: { funcName: "isRectangleCover", params: [{ name: "rectangles", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Each `rectangles[i] = [xi, yi, ai, bi]` is an axis-aligned rectangle with bottom-left corner `(xi, yi)` and top-right corner `(ai, bi)`; every rectangle has positive width and height.\n\nReturn `true` if the rectangles together form **one exact rectangle**: their union is a rectangle, and no two of them overlap (sharing edges is fine, sharing any area is not). Gaps and overlaps both make the answer `false`.",
        [
          { in: "rectangles = [[0,0,2,1],[2,0,3,2],[1,2,3,3],[0,1,1,3],[1,1,2,2]]", out: "true", note: "A 'pinwheel' of five pieces tiling the 3 x 3 square." },
          { in: "rectangles = [[0,0,2,2],[2,0,3,1]]", out: "false", note: "The square from (2,1) to (3,2) is missing." },
          { in: "rectangles = [[0,0,2,2],[1,1,3,3],[0,2,1,3],[2,0,3,1]]", out: "false", note: "The first two overlap on the square from (1,1) to (2,2)." },
        ],
        ["1 <= rectangles.length <= 2 * 10^4", "rectangles[i].length == 4", "-10^5 <= xi < ai <= 10^5", "-10^5 <= yi < bi <= 10^5"]),
      hints: [
        "The target must be the bounding box of all the rectangles — and the total area must equal its area.",
        "Equal area still allows an overlap that cancels a gap. Look at the corners: inside a perfect tiling, every corner point is shared by an even number of rectangles.",
        "Toggle every rectangle's four corners in a set. A perfect cover leaves exactly the four corners of the bounding box.",
      ],
      editorial: explain({
        idea: "Two conditions together characterise a perfect cover: the areas add up to the bounding box's area, and every corner point occurs an even number of times except the four corners of the bounding box, which occur once.",
        steps: [
          "Track the bounding box `minX, minY, maxX, maxY` and the total area (in 64 bits).",
          "For each rectangle, toggle its four corner points in a set: add a point that is absent, remove one that is present.",
          "Return `false` if the total area differs from `(maxX - minX) · (maxY - minY)`.",
          "Return `true` exactly when the set holds four points and they are the bounding box's corners.",
        ],
        why: "In a perfect tiling, any point that is a corner of some piece but not of the big rectangle is surrounded by pieces meeting there in pairs — two (on an edge) or four (inside) — so it toggles out; the four outer corners belong to exactly one piece each and stay. Conversely, if the areas match but some region is covered twice, a matching region must be uncovered; the boundary of the doubled or missing region creates a corner point shared by an odd number of pieces somewhere other than the outer corners, which the set catches. Area alone misses overlap-plus-gap, and corners alone miss some overlaps; together they are exact.",
        time: "O(n) expected with a hash set",
        space: "O(n)",
        pitfalls: [
          "Areas reach (2·10^5)² = 4·10^10 per rectangle — sum them in 64 bits.",
          "Use toggling (parity), not counting into a set once; a corner shared by two pieces must vanish.",
          "The bounding box is computed from the minimum of left/bottom edges and the maximum of right/top edges, not from any single rectangle.",
        ],
      }),
      examples: [
        { input: "[[0,0,2,1],[2,0,3,2],[1,2,3,3],[0,1,1,3],[1,1,2,2]]", expectedOutput: "true" },
        { input: "[[0,0,2,2],[2,0,3,1]]", expectedOutput: "false" },
        { input: "[[0,0,2,2],[1,1,3,3],[0,2,1,3],[2,0,3,1]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const W = ri(rng, 1, 8), H = ri(rng, 1, 8);
        let rects: number[][];
        if (rng() < 0.12) {
          const k = ri(rng, 1, 2);
          rects = [[0, 0, 2, 1], [2, 0, 3, 2], [1, 2, 3, 3], [0, 1, 1, 3], [1, 1, 2, 2]].map((r) => r.map((v) => v * k));
        } else {
          rects = split(rng, [0, 0, W, H], ri(rng, 1, Math.min(10, W * H)));
        }
        const kind = ri(rng, 0, 9);
        if (kind === 0 && rects.length > 1) rects.splice(ri(rng, 0, rects.length - 1), 1);
        else if (kind === 1) rects.push(rects[ri(rng, 0, rects.length - 1)].slice());
        else if (kind === 2) {
          const i = ri(rng, 0, rects.length - 1); const d = pick(rng, [-1, 1]);
          rects[i] = [rects[i][0] + d, rects[i][1], rects[i][2] + d, rects[i][3]];
        } else if (kind === 3) {
          const i = ri(rng, 0, rects.length - 1);
          rects[i] = [rects[i][0], rects[i][1], rects[i][2] + 1, rects[i][3]];
        } else if (kind === 4 && rects.length > 1) {
          // Swap one piece for a copy of another: area may match, corners do not.
          const i = ri(rng, 0, rects.length - 1), j = ri(rng, 0, rects.length - 1);
          rects[i] = rects[j].slice();
        }
        const expected = ref(rects);
        if (rng() < 0.35) {
          // Scale up and shift: a perfect cover stays perfect, anything else stays broken.
          const lo = Math.min(...rects.map((r) => Math.min(r[0], r[1])));
          const hi = Math.max(...rects.map((r) => Math.max(r[2], r[3])));
          const k = ri(rng, 1, Math.floor(200000 / (hi - lo)));
          const off = ri(rng, -100000, 100000 - k * (hi - lo));
          rects = rects.map((r) => r.map((v) => (v - lo) * k + off));
        } else if (rng() < 0.3) {
          const ox = ri(rng, -99990, 99900), oy = ri(rng, -99990, 99900);
          rects = rects.map((r) => [r[0] + ox, r[1] + oy, r[2] + ox, r[3] + oy]);
        }
        rects = shuffle(rng, rects);
        return { input: fmtIntMat(rects), expectedOutput: bool(expected) };
      },
      solutions: {
        python: code`
          from typing import List

          def isRectangleCover(rectangles: List[List[int]]) -> bool:
              min_x = min(r[0] for r in rectangles)
              min_y = min(r[1] for r in rectangles)
              max_x = max(r[2] for r in rectangles)
              max_y = max(r[3] for r in rectangles)
              area = 0
              corners = set()
              for x1, y1, x2, y2 in rectangles:
                  area += (x2 - x1) * (y2 - y1)
                  for p in ((x1, y1), (x1, y2), (x2, y1), (x2, y2)):
                      if p in corners:
                          corners.remove(p)
                      else:
                          corners.add(p)
              if area != (max_x - min_x) * (max_y - min_y):
                  return False
              return corners == {(min_x, min_y), (min_x, max_y), (max_x, min_y), (max_x, max_y)}
        `,
        javascript: code`
          var isRectangleCover = function(rectangles) {
              var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              var area = 0;
              var corners = new Set();
              var toggle = function(x, y) {
                  var key = x + "," + y;
                  if (corners.has(key)) corners.delete(key); else corners.add(key);
              };
              for (var i = 0; i < rectangles.length; i++) {
                  var r = rectangles[i];
                  minX = Math.min(minX, r[0]); minY = Math.min(minY, r[1]);
                  maxX = Math.max(maxX, r[2]); maxY = Math.max(maxY, r[3]);
                  area += (r[2] - r[0]) * (r[3] - r[1]);
                  toggle(r[0], r[1]); toggle(r[0], r[3]); toggle(r[2], r[1]); toggle(r[2], r[3]);
              }
              if (area !== (maxX - minX) * (maxY - minY)) return false;
              if (corners.size !== 4) return false;
              return corners.has(minX + "," + minY) && corners.has(minX + "," + maxY) &&
                  corners.has(maxX + "," + minY) && corners.has(maxX + "," + maxY);
          };
        `,
        typescript: code`
          function isRectangleCover(rectangles: number[][]): boolean {
              var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              var area = 0;
              var corners: { [k: string]: boolean } = {};
              var toggle = function(x: number, y: number): void {
                  var key = x + "," + y;
                  if (corners[key]) delete corners[key]; else corners[key] = true;
              };
              for (var i = 0; i < rectangles.length; i++) {
                  var r = rectangles[i];
                  minX = Math.min(minX, r[0]); minY = Math.min(minY, r[1]);
                  maxX = Math.max(maxX, r[2]); maxY = Math.max(maxY, r[3]);
                  area += (r[2] - r[0]) * (r[3] - r[1]);
                  toggle(r[0], r[1]); toggle(r[0], r[3]); toggle(r[2], r[1]); toggle(r[2], r[3]);
              }
              if (area !== (maxX - minX) * (maxY - minY)) return false;
              var size = 0;
              for (var k in corners) if (corners.hasOwnProperty(k)) size++;
              if (size !== 4) return false;
              return !!corners[minX + "," + minY] && !!corners[minX + "," + maxY] &&
                  !!corners[maxX + "," + minY] && !!corners[maxX + "," + maxY];
          }
        `,
        java: code`
          public static boolean isRectangleCover(int[][] rectangles) {
              long minX = Long.MAX_VALUE, minY = Long.MAX_VALUE, maxX = Long.MIN_VALUE, maxY = Long.MIN_VALUE;
              long area = 0;
              Set<Long> corners = new HashSet<>();
              for (int[] r : rectangles) {
                  minX = Math.min(minX, r[0]); minY = Math.min(minY, r[1]);
                  maxX = Math.max(maxX, r[2]); maxY = Math.max(maxY, r[3]);
                  area += (long) (r[2] - r[0]) * (r[3] - r[1]);
                  long[] keys = { coverKey(r[0], r[1]), coverKey(r[0], r[3]), coverKey(r[2], r[1]), coverKey(r[2], r[3]) };
                  for (long key : keys) {
                      if (!corners.remove(key)) corners.add(key);
                  }
              }
              if (area != (maxX - minX) * (maxY - minY)) return false;
              if (corners.size() != 4) return false;
              return corners.contains(coverKey(minX, minY)) && corners.contains(coverKey(minX, maxY))
                  && corners.contains(coverKey(maxX, minY)) && corners.contains(coverKey(maxX, maxY));
          }

          private static long coverKey(long x, long y) {
              return (x + 100000L) * 200001L + (y + 100000L);
          }
        `,
        cpp: code`
          bool isRectangleCover(vector<vector<int>>& rectangles) {
              long long minX = LLONG_MAX, minY = LLONG_MAX, maxX = LLONG_MIN, maxY = LLONG_MIN;
              long long area = 0;
              set<pair<long long, long long>> corners;
              for (auto& r : rectangles) {
                  minX = min(minX, (long long) r[0]); minY = min(minY, (long long) r[1]);
                  maxX = max(maxX, (long long) r[2]); maxY = max(maxY, (long long) r[3]);
                  area += (long long) (r[2] - r[0]) * (r[3] - r[1]);
                  pair<long long, long long> ps[4] = { {r[0], r[1]}, {r[0], r[3]}, {r[2], r[1]}, {r[2], r[3]} };
                  for (auto& p : ps) {
                      if (corners.count(p)) corners.erase(p); else corners.insert(p);
                  }
              }
              if (area != (maxX - minX) * (maxY - minY)) return false;
              if (corners.size() != 4) return false;
              return corners.count({minX, minY}) && corners.count({minX, maxY})
                  && corners.count({maxX, minY}) && corners.count({maxX, maxY});
          }
        `,
        c: code`
          static int coverCmp(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          static long long coverKey(long long x, long long y) {
              return (x + 100000LL) * 200001LL + (y + 100000LL);
          }

          bool isRectangleCover(int** rectangles, int rectanglesSize, int* rectanglesColSize) {
              int n = rectanglesSize;
              long long minX = rectangles[0][0], minY = rectangles[0][1], maxX = rectangles[0][2], maxY = rectangles[0][3];
              long long area = 0;
              long long* keys = (long long*) malloc(sizeof(long long) * 4 * n);
              for (int i = 0; i < n; i++) {
                  long long x1 = rectangles[i][0], y1 = rectangles[i][1], x2 = rectangles[i][2], y2 = rectangles[i][3];
                  if (x1 < minX) minX = x1;
                  if (y1 < minY) minY = y1;
                  if (x2 > maxX) maxX = x2;
                  if (y2 > maxY) maxY = y2;
                  area += (x2 - x1) * (y2 - y1);
                  keys[4 * i] = coverKey(x1, y1);
                  keys[4 * i + 1] = coverKey(x1, y2);
                  keys[4 * i + 2] = coverKey(x2, y1);
                  keys[4 * i + 3] = coverKey(x2, y2);
              }
              if (area != (maxX - minX) * (maxY - minY)) {
                  free(keys);
                  return false;
              }
              qsort(keys, 4 * n, sizeof(long long), coverCmp);
              long long want[4] = { coverKey(minX, minY), coverKey(minX, maxY), coverKey(maxX, minY), coverKey(maxX, maxY) };
              int odd = 0;
              bool ok = true;
              for (int i = 0; i < 4 * n && ok; ) {
                  int j = i;
                  while (j < 4 * n && keys[j] == keys[i]) j++;
                  if ((j - i) % 2 == 1) {
                      if (odd >= 4 || keys[i] != want[odd]) ok = false;
                      else odd++;
                  }
                  i = j;
              }
              free(keys);
              return ok && odd == 4;
          }
        `,
        csharp: code`
          public static bool IsRectangleCover(int[][] rectangles)
          {
              long minX = long.MaxValue, minY = long.MaxValue, maxX = long.MinValue, maxY = long.MinValue;
              long area = 0;
              var corners = new HashSet<long>();
              foreach (var r in rectangles)
              {
                  minX = Math.Min(minX, r[0]); minY = Math.Min(minY, r[1]);
                  maxX = Math.Max(maxX, r[2]); maxY = Math.Max(maxY, r[3]);
                  area += (long) (r[2] - r[0]) * (r[3] - r[1]);
                  long[] keys = { CoverKey(r[0], r[1]), CoverKey(r[0], r[3]), CoverKey(r[2], r[1]), CoverKey(r[2], r[3]) };
                  foreach (long key in keys)
                  {
                      if (!corners.Remove(key)) corners.Add(key);
                  }
              }
              if (area != (maxX - minX) * (maxY - minY)) return false;
              if (corners.Count != 4) return false;
              return corners.Contains(CoverKey(minX, minY)) && corners.Contains(CoverKey(minX, maxY))
                  && corners.Contains(CoverKey(maxX, minY)) && corners.Contains(CoverKey(maxX, maxY));
          }

          private static long CoverKey(long x, long y)
          {
              return (x + 100000L) * 200001L + (y + 100000L);
          }
        `,
        go: code`
          func isRectangleCover(rectangles [][]int) bool {
              minX, minY := rectangles[0][0], rectangles[0][1]
              maxX, maxY := rectangles[0][2], rectangles[0][3]
              area := 0
              corners := map[int]bool{}
              key := func(x, y int) int { return (x+100000)*200001 + (y + 100000) }
              for _, r := range rectangles {
                  if r[0] < minX {
                      minX = r[0]
                  }
                  if r[1] < minY {
                      minY = r[1]
                  }
                  if r[2] > maxX {
                      maxX = r[2]
                  }
                  if r[3] > maxY {
                      maxY = r[3]
                  }
                  area += (r[2] - r[0]) * (r[3] - r[1])
                  for _, k := range []int{key(r[0], r[1]), key(r[0], r[3]), key(r[2], r[1]), key(r[2], r[3])} {
                      if corners[k] {
                          delete(corners, k)
                      } else {
                          corners[k] = true
                      }
                  }
              }
              if area != (maxX-minX)*(maxY-minY) || len(corners) != 4 {
                  return false
              }
              return corners[key(minX, minY)] && corners[key(minX, maxY)] && corners[key(maxX, minY)] && corners[key(maxX, maxY)]
          }
        `,
        kotlin: code`
          fun isRectangleCover(rectangles: Array<IntArray>): Boolean {
              var minX = Long.MAX_VALUE
              var minY = Long.MAX_VALUE
              var maxX = Long.MIN_VALUE
              var maxY = Long.MIN_VALUE
              var area = 0L
              val corners = HashSet<Long>()
              fun key(x: Long, y: Long): Long = (x + 100000L) * 200001L + (y + 100000L)
              for (r in rectangles) {
                  minX = minOf(minX, r[0].toLong()); minY = minOf(minY, r[1].toLong())
                  maxX = maxOf(maxX, r[2].toLong()); maxY = maxOf(maxY, r[3].toLong())
                  area += (r[2] - r[0]).toLong() * (r[3] - r[1])
                  val ks = longArrayOf(key(r[0].toLong(), r[1].toLong()), key(r[0].toLong(), r[3].toLong()),
                      key(r[2].toLong(), r[1].toLong()), key(r[2].toLong(), r[3].toLong()))
                  for (k in ks) {
                      if (!corners.remove(k)) corners.add(k)
                  }
              }
              if (area != (maxX - minX) * (maxY - minY)) return false
              if (corners.size != 4) return false
              return corners.contains(key(minX, minY)) && corners.contains(key(minX, maxY)) &&
                  corners.contains(key(maxX, minY)) && corners.contains(key(maxX, maxY))
          }
        `,
        swift: code`
          func isRectangleCover(_ rectangles: [[Int]]) -> Bool {
              var minX = Int.max, minY = Int.max, maxX = Int.min, maxY = Int.min
              var area = 0
              var corners = Set<Int>()
              func key(_ x: Int, _ y: Int) -> Int { return (x + 100000) * 200001 + (y + 100000) }
              for r in rectangles {
                  minX = min(minX, r[0]); minY = min(minY, r[1])
                  maxX = max(maxX, r[2]); maxY = max(maxY, r[3])
                  area += (r[2] - r[0]) * (r[3] - r[1])
                  for k in [key(r[0], r[1]), key(r[0], r[3]), key(r[2], r[1]), key(r[2], r[3])] {
                      if corners.contains(k) { corners.remove(k) } else { corners.insert(k) }
                  }
              }
              if area != (maxX - minX) * (maxY - minY) || corners.count != 4 { return false }
              return corners.contains(key(minX, minY)) && corners.contains(key(minX, maxY)) &&
                  corners.contains(key(maxX, minY)) && corners.contains(key(maxX, maxY))
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn cover_key(x: i64, y: i64) -> i64 {
              (x + 100000) * 200001 + (y + 100000)
          }

          fn isRectangleCover(rectangles: Vec<Vec<i32>>) -> bool {
              let mut min_x = std::i64::MAX;
              let mut min_y = std::i64::MAX;
              let mut max_x = std::i64::MIN;
              let mut max_y = std::i64::MIN;
              let mut area: i64 = 0;
              let mut corners: HashSet<i64> = HashSet::new();
              for r in rectangles.iter() {
                  let (x1, y1, x2, y2) = (r[0] as i64, r[1] as i64, r[2] as i64, r[3] as i64);
                  min_x = min_x.min(x1);
                  min_y = min_y.min(y1);
                  max_x = max_x.max(x2);
                  max_y = max_y.max(y2);
                  area += (x2 - x1) * (y2 - y1);
                  for &k in [cover_key(x1, y1), cover_key(x1, y2), cover_key(x2, y1), cover_key(x2, y2)].iter() {
                      if !corners.remove(&k) {
                          corners.insert(k);
                      }
                  }
              }
              if area != (max_x - min_x) * (max_y - min_y) || corners.len() != 4 {
                  return false;
              }
              corners.contains(&cover_key(min_x, min_y)) && corners.contains(&cover_key(min_x, max_y))
                  && corners.contains(&cover_key(max_x, min_y)) && corners.contains(&cover_key(max_x, max_y))
          }
        `,
        php: code`
          function isRectangleCover($rectangles) {
              $minX = PHP_INT_MAX; $minY = PHP_INT_MAX;
              $maxX = PHP_INT_MIN; $maxY = PHP_INT_MIN;
              $area = 0;
              $corners = [];
              foreach ($rectangles as $r) {
                  $minX = min($minX, $r[0]); $minY = min($minY, $r[1]);
                  $maxX = max($maxX, $r[2]); $maxY = max($maxY, $r[3]);
                  $area += ($r[2] - $r[0]) * ($r[3] - $r[1]);
                  foreach ([[$r[0], $r[1]], [$r[0], $r[3]], [$r[2], $r[1]], [$r[2], $r[3]]] as $p) {
                      $k = $p[0] . "," . $p[1];
                      if (isset($corners[$k])) unset($corners[$k]); else $corners[$k] = true;
                  }
              }
              if ($area != ($maxX - $minX) * ($maxY - $minY) || count($corners) != 4) return false;
              return isset($corners[$minX . "," . $minY]) && isset($corners[$minX . "," . $maxY])
                  && isset($corners[$maxX . "," . $minY]) && isset($corners[$maxX . "," . $maxY]);
          }
        `,
        ruby: code`
          def isRectangleCover(rectangles)
            min_x = rectangles.map { |r| r[0] }.min
            min_y = rectangles.map { |r| r[1] }.min
            max_x = rectangles.map { |r| r[2] }.max
            max_y = rectangles.map { |r| r[3] }.max
            area = 0
            corners = {}
            rectangles.each do |x1, y1, x2, y2|
              area += (x2 - x1) * (y2 - y1)
              [[x1, y1], [x1, y2], [x2, y1], [x2, y2]].each do |p|
                if corners.key?(p)
                  corners.delete(p)
                else
                  corners[p] = true
                end
              end
            end
            return false if area != (max_x - min_x) * (max_y - min_y)
            return false if corners.size != 4
            [[min_x, min_y], [min_x, max_y], [max_x, min_y], [max_x, max_y]].all? { |p| corners.key?(p) }
          end
        `,
      },
    };
  })(),

  // ── Erect the Fence (LC 587) ─────────────────────────────────────
  (() => {
    const ref = (trees: number[][]) => {
      // Brute force: a point is on the fence iff it lies on a supporting
      // line through two trees (all trees on one closed side of it).
      const n = trees.length;
      const on: boolean[] = new Array(n).fill(n <= 2);
      const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let pos = false, neg = false;
          for (let k = 0; k < n; k++) {
            const c = cr(trees[i], trees[j], trees[k]);
            if (c > 0) pos = true;
            if (c < 0) neg = true;
          }
          if (pos && neg) continue;
          for (let k = 0; k < n; k++) if (cr(trees[i], trees[j], trees[k]) === 0) on[k] = true;
        }
      }
      return trees.filter((_, i) => on[i]).map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    };
    return {
      slug: "erect-the-fence",
      title: "Erect the Fence",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Geometry", "Google", "Amazon"],
      signature: { funcName: "outerTrees", params: [{ name: "trees", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "`trees[i] = [xi, yi]` is the position of a tree in a garden; no two trees share a position. You want to wrap the whole garden with the **shortest possible fence** — a rope pulled tight around all the trees.\n\nReturn every tree that lies **on the fence**, including trees that sit on a straight stretch between two corners. Return them sorted by `x`, breaking ties by `y` (both ascending).",
        [
          { in: "trees = [[0,0],[4,0],[4,4],[0,4],[2,2],[2,0],[1,3]]", out: "[[0,0],[0,4],[2,0],[4,0],[4,4]]", note: "The fence is the square; (2,0) sits on its bottom side, while (2,2) and (1,3) are inside." },
          { in: "trees = [[1,2],[2,2],[4,2]]", out: "[[1,2],[2,2],[4,2]]", note: "All trees are on one line, so the 'fence' is that segment and every tree touches it." },
          { in: "trees = [[3,5]]", out: "[[3,5]]" },
        ],
        ["1 <= trees.length <= 3000", "trees[i].length == 2", "0 <= xi, yi <= 100", "All the given positions are unique."]),
      hints: [
        "The fence is the convex hull of the points.",
        "Andrew's monotone chain builds the hull from points sorted by x: a lower chain left to right and an upper chain right to left, popping points that make a clockwise turn.",
        "To keep trees on straight stretches, pop only on a strictly clockwise turn (cross product < 0) and keep collinear points; then merge the two chains without duplicates.",
      ],
      editorial: explain({
        idea: "Compute the convex hull with Andrew's monotone chain, keeping collinear boundary points, and report each hull point once in sorted order.",
        steps: [
          "Sort the trees by x, then y.",
          "Lower chain: scan left to right; while the last two chain points and the new point make a clockwise turn (cross product < 0), pop. Then push the new point.",
          "Upper chain: do the same scanning right to left.",
          "Mark every point that ended up in either chain; output the marked points in sorted order (which also removes the duplicates the two chains share).",
        ],
        why: "For points sorted by x, the lower boundary of the hull turns only counter-clockwise; any point that forms a clockwise turn with its neighbours lies strictly above the segment joining them and cannot be on the lower boundary. Popping only on strictly clockwise turns keeps points that are exactly on a boundary segment, which the fence also touches. The upper chain is the same argument mirrored. Every hull boundary point is on the lower or upper boundary, so the union of the chains is exactly the set of trees on the fence; when all trees are collinear both chains contain all of them.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Popping on `cross <= 0` (the textbook version) drops trees on straight sides — this problem wants them.",
          "With collinear points kept, the two chains overlap heavily (all of them, if every tree is on one line); deduplicate by index rather than appending both chains.",
          "The output order is defined (sorted by x then y), so sort or emit in sorted order.",
        ],
      }),
      examples: [
        { input: "[[0,0],[4,0],[4,4],[0,4],[2,2],[2,0],[1,3]]", expectedOutput: "[[0,0],[0,4],[2,0],[4,0],[4,4]]" },
        { input: "[[1,2],[2,2],[4,2]]", expectedOutput: "[[1,2],[2,2],[4,2]]" },
        { input: "[[3,5]]", expectedOutput: "[[3,5]]" },
      ],
      gen: (rng: Rng) => {
        const L = pick(rng, [2, 3, 5, 8, 12, 100]);
        const cap = Math.min((L + 1) * (L + 1), pick(rng, [1, 3, 6, 12, 20, 32]));
        const n = ri(rng, 1, cap);
        const seen = new Set<string>();
        const trees: number[][] = [];
        const add = (x: number, y: number) => {
          const k = x + "," + y;
          if (x < 0 || y < 0 || x > 100 || y > 100 || seen.has(k)) return;
          seen.add(k); trees.push([x, y]);
        };
        const kind = ri(rng, 0, 9);
        if (kind === 0) {
          const v = pick(rng, [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 3]]);
          const bx = ri(rng, 0, L), by = ri(rng, 0, L);
          for (let t = -L; t <= L && trees.length < n; t++) if (rng() < 0.6) add(bx + t * v[0], by + t * v[1]);
          if (!trees.length) add(bx, by);
        } else if (kind === 1) {
          // Points on a rectangle's border plus a few inside.
          const x2 = ri(rng, 1, L), y2 = ri(rng, 1, L);
          for (let x = 0; x <= x2; x++) { if (rng() < 0.5) add(x, 0); if (rng() < 0.5) add(x, y2); }
          for (let y = 0; y <= y2; y++) { if (rng() < 0.5) add(0, y); if (rng() < 0.5) add(x2, y); }
          add(0, 0); add(x2, y2);
          for (let t = 0; t < 4; t++) add(ri(rng, 0, x2), ri(rng, 0, y2));
        } else {
          while (trees.length < n) add(ri(rng, 0, L), ri(rng, 0, L));
        }
        const pts = shuffle(rng, trees);
        return { input: fmtIntMat(pts), expectedOutput: fmtIntMat(ref(pts)) };
      },
      solutions: {
        python: code`
          from typing import List

          def outerTrees(trees: List[List[int]]) -> List[List[int]]:
              pts = sorted([p[0], p[1]] for p in trees)
              n = len(pts)

              def cross(o, a, b):
                  return (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0])

              on_hull = [False] * n
              for order in (range(n), range(n - 1, -1, -1)):
                  chain = []
                  for i in order:
                      while len(chain) >= 2 and cross(chain[-2], chain[-1], i) < 0:
                          chain.pop()
                      chain.append(i)
                  for i in chain:
                      on_hull[i] = True
              return [pts[i] for i in range(n) if on_hull[i]]
        `,
        javascript: code`
          var outerTrees = function(trees) {
              var pts = trees.map(function(p) { return [p[0], p[1]]; });
              pts.sort(function(a, b) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });
              var n = pts.length;
              var cross = function(o, a, b) {
                  return (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0]);
              };
              var onHull = new Array(n).fill(false);
              var build = function(start, step) {
                  var chain = [];
                  for (var i = start; i >= 0 && i < n; i += step) {
                      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], i) < 0) chain.pop();
                      chain.push(i);
                  }
                  for (var k = 0; k < chain.length; k++) onHull[chain[k]] = true;
              };
              build(0, 1);
              build(n - 1, -1);
              var res = [];
              for (var i = 0; i < n; i++) if (onHull[i]) res.push(pts[i]);
              return res;
          };
        `,
        typescript: code`
          function outerTrees(trees: number[][]): number[][] {
              var pts: number[][] = [];
              for (var t = 0; t < trees.length; t++) pts.push([trees[t][0], trees[t][1]]);
              pts.sort(function(a, b) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });
              var n = pts.length;
              var cross = function(o: number, a: number, b: number): number {
                  return (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0]);
              };
              var onHull: boolean[] = [];
              for (var z = 0; z < n; z++) onHull.push(false);
              var build = function(start: number, step: number): void {
                  var chain: number[] = [];
                  for (var i = start; i >= 0 && i < n; i += step) {
                      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], i) < 0) chain.pop();
                      chain.push(i);
                  }
                  for (var k = 0; k < chain.length; k++) onHull[chain[k]] = true;
              };
              build(0, 1);
              build(n - 1, -1);
              var res: number[][] = [];
              for (var i = 0; i < n; i++) if (onHull[i]) res.push(pts[i]);
              return res;
          }
        `,
        java: code`
          public static int[][] outerTrees(int[][] trees) {
              int n = trees.length;
              int[][] pts = new int[n][];
              for (int i = 0; i < n; i++) pts[i] = new int[] { trees[i][0], trees[i][1] };
              Arrays.sort(pts, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
              boolean[] onHull = new boolean[n];
              for (int pass = 0; pass < 2; pass++) {
                  int[] chain = new int[n];
                  int size = 0;
                  for (int t = 0; t < n; t++) {
                      int i = pass == 0 ? t : n - 1 - t;
                      while (size >= 2 && fenceCross(pts[chain[size - 2]], pts[chain[size - 1]], pts[i]) < 0) size--;
                      chain[size++] = i;
                  }
                  for (int k = 0; k < size; k++) onHull[chain[k]] = true;
              }
              List<int[]> res = new ArrayList<>();
              for (int i = 0; i < n; i++) if (onHull[i]) res.add(pts[i]);
              return res.toArray(new int[0][]);
          }

          private static int fenceCross(int[] o, int[] a, int[] b) {
              return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
          }
        `,
        cpp: code`
          vector<vector<int>> outerTrees(vector<vector<int>>& trees) {
              vector<vector<int>> pts = trees;
              sort(pts.begin(), pts.end());
              int n = pts.size();
              auto cross = [&](int o, int a, int b) {
                  return (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0]);
              };
              vector<bool> onHull(n, false);
              for (int pass = 0; pass < 2; pass++) {
                  vector<int> chain;
                  for (int t = 0; t < n; t++) {
                      int i = pass == 0 ? t : n - 1 - t;
                      while (chain.size() >= 2 && cross(chain[chain.size() - 2], chain.back(), i) < 0) chain.pop_back();
                      chain.push_back(i);
                  }
                  for (int i : chain) onHull[i] = true;
              }
              vector<vector<int>> res;
              for (int i = 0; i < n; i++) if (onHull[i]) res.push_back(pts[i]);
              return res;
          }
        `,
        c: code`
          static int fenceCmp(const void* a, const void* b) {
              const int* p = (const int*) a;
              const int* q = (const int*) b;
              if (p[0] != q[0]) return (p[0] > q[0]) - (p[0] < q[0]);
              return (p[1] > q[1]) - (p[1] < q[1]);
          }

          int** outerTrees(int** trees, int treesSize, int* treesColSize, int* returnSize, int** returnColumnSizes) {
              int n = treesSize;
              int* pts = (int*) malloc(sizeof(int) * 2 * n);
              for (int i = 0; i < n; i++) {
                  pts[2 * i] = trees[i][0];
                  pts[2 * i + 1] = trees[i][1];
              }
              qsort(pts, n, sizeof(int) * 2, fenceCmp);
              char* onHull = (char*) calloc(n, 1);
              int* chain = (int*) malloc(sizeof(int) * n);
              for (int pass = 0; pass < 2; pass++) {
                  int size = 0;
                  for (int t = 0; t < n; t++) {
                      int i = pass == 0 ? t : n - 1 - t;
                      while (size >= 2) {
                          int o = chain[size - 2], a = chain[size - 1];
                          int cr = (pts[2 * a] - pts[2 * o]) * (pts[2 * i + 1] - pts[2 * o + 1])
                                 - (pts[2 * a + 1] - pts[2 * o + 1]) * (pts[2 * i] - pts[2 * o]);
                          if (cr < 0) size--; else break;
                      }
                      chain[size++] = i;
                  }
                  for (int k = 0; k < size; k++) onHull[chain[k]] = 1;
              }
              int cnt = 0;
              for (int i = 0; i < n; i++) if (onHull[i]) cnt++;
              int** res = (int**) malloc(sizeof(int*) * cnt);
              *returnColumnSizes = (int*) malloc(sizeof(int) * cnt);
              int k = 0;
              for (int i = 0; i < n; i++) {
                  if (!onHull[i]) continue;
                  res[k] = (int*) malloc(sizeof(int) * 2);
                  res[k][0] = pts[2 * i];
                  res[k][1] = pts[2 * i + 1];
                  (*returnColumnSizes)[k] = 2;
                  k++;
              }
              *returnSize = cnt;
              free(pts);
              free(onHull);
              free(chain);
              return res;
          }
        `,
        csharp: code`
          public static int[][] OuterTrees(int[][] trees)
          {
              int n = trees.Length;
              int[][] pts = trees.Select(p => new int[] { p[0], p[1] }).OrderBy(p => p[0]).ThenBy(p => p[1]).ToArray();
              bool[] onHull = new bool[n];
              for (int pass = 0; pass < 2; pass++)
              {
                  int[] chain = new int[n];
                  int size = 0;
                  for (int t = 0; t < n; t++)
                  {
                      int i = pass == 0 ? t : n - 1 - t;
                      while (size >= 2 && FenceCross(pts[chain[size - 2]], pts[chain[size - 1]], pts[i]) < 0) size--;
                      chain[size++] = i;
                  }
                  for (int k = 0; k < size; k++) onHull[chain[k]] = true;
              }
              var res = new List<int[]>();
              for (int i = 0; i < n; i++) if (onHull[i]) res.Add(pts[i]);
              return res.ToArray();
          }

          private static int FenceCross(int[] o, int[] a, int[] b)
          {
              return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
          }
        `,
        go: code`
          func outerTrees(trees [][]int) [][]int {
              n := len(trees)
              pts := make([][]int, n)
              for i, p := range trees {
                  pts[i] = []int{p[0], p[1]}
              }
              sort.Slice(pts, func(a, b int) bool {
                  if pts[a][0] != pts[b][0] {
                      return pts[a][0] < pts[b][0]
                  }
                  return pts[a][1] < pts[b][1]
              })
              cross := func(o, a, b int) int {
                  return (pts[a][0]-pts[o][0])*(pts[b][1]-pts[o][1]) - (pts[a][1]-pts[o][1])*(pts[b][0]-pts[o][0])
              }
              onHull := make([]bool, n)
              for pass := 0; pass < 2; pass++ {
                  chain := []int{}
                  for t := 0; t < n; t++ {
                      i := t
                      if pass == 1 {
                          i = n - 1 - t
                      }
                      for len(chain) >= 2 && cross(chain[len(chain)-2], chain[len(chain)-1], i) < 0 {
                          chain = chain[:len(chain)-1]
                      }
                      chain = append(chain, i)
                  }
                  for _, i := range chain {
                      onHull[i] = true
                  }
              }
              res := [][]int{}
              for i := 0; i < n; i++ {
                  if onHull[i] {
                      res = append(res, pts[i])
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun outerTrees(trees: Array<IntArray>): Array<IntArray> {
              val n = trees.size
              val pts = trees.map { intArrayOf(it[0], it[1]) }.sortedWith(compareBy<IntArray>({ it[0] }, { it[1] }))
              fun cross(o: Int, a: Int, b: Int): Int =
                  (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0])
              val onHull = BooleanArray(n)
              for (pass in 0 until 2) {
                  val chain = IntArray(n)
                  var size = 0
                  for (t in 0 until n) {
                      val i = if (pass == 0) t else n - 1 - t
                      while (size >= 2 && cross(chain[size - 2], chain[size - 1], i) < 0) size--
                      chain[size++] = i
                  }
                  for (k in 0 until size) onHull[chain[k]] = true
              }
              val res = ArrayList<IntArray>()
              for (i in 0 until n) if (onHull[i]) res.add(pts[i])
              return res.toTypedArray()
          }
        `,
        swift: code`
          func outerTrees(_ trees: [[Int]]) -> [[Int]] {
              let pts = trees.sorted { $0[0] != $1[0] ? $0[0] < $1[0] : $0[1] < $1[1] }
              let n = pts.count
              func cross(_ o: Int, _ a: Int, _ b: Int) -> Int {
                  return (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0])
              }
              var onHull = [Bool](repeating: false, count: n)
              for pass in 0..<2 {
                  var chain = [Int]()
                  for t in 0..<n {
                      let i = pass == 0 ? t : n - 1 - t
                      while chain.count >= 2 && cross(chain[chain.count - 2], chain[chain.count - 1], i) < 0 {
                          chain.removeLast()
                      }
                      chain.append(i)
                  }
                  for i in chain { onHull[i] = true }
              }
              var res = [[Int]]()
              for i in 0..<n where onHull[i] { res.append(pts[i]) }
              return res
          }
        `,
        rust: code`
          fn outerTrees(trees: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let mut pts = trees.clone();
              pts.sort();
              let n = pts.len();
              let cross = |o: usize, a: usize, b: usize| -> i32 {
                  (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0])
              };
              let mut on_hull = vec![false; n];
              for pass in 0..2 {
                  let mut chain: Vec<usize> = Vec::new();
                  for t in 0..n {
                      let i = if pass == 0 { t } else { n - 1 - t };
                      while chain.len() >= 2 && cross(chain[chain.len() - 2], chain[chain.len() - 1], i) < 0 {
                          chain.pop();
                      }
                      chain.push(i);
                  }
                  for &i in chain.iter() {
                      on_hull[i] = true;
                  }
              }
              let mut res = Vec::new();
              for i in 0..n {
                  if on_hull[i] {
                      res.push(pts[i].clone());
                  }
              }
              res
          }
        `,
        php: code`
          function outerTrees($trees) {
              $pts = $trees;
              usort($pts, function($a, $b) {
                  if ($a[0] != $b[0]) return $a[0] - $b[0];
                  return $a[1] - $b[1];
              });
              $n = count($pts);
              $onHull = array_fill(0, $n, false);
              for ($pass = 0; $pass < 2; $pass++) {
                  $chain = [];
                  for ($t = 0; $t < $n; $t++) {
                      $i = $pass == 0 ? $t : $n - 1 - $t;
                      while (count($chain) >= 2) {
                          $o = $pts[$chain[count($chain) - 2]];
                          $a = $pts[$chain[count($chain) - 1]];
                          $b = $pts[$i];
                          $cr = ($a[0] - $o[0]) * ($b[1] - $o[1]) - ($a[1] - $o[1]) * ($b[0] - $o[0]);
                          if ($cr < 0) array_pop($chain); else break;
                      }
                      $chain[] = $i;
                  }
                  foreach ($chain as $i) $onHull[$i] = true;
              }
              $res = [];
              for ($i = 0; $i < $n; $i++) if ($onHull[$i]) $res[] = $pts[$i];
              return $res;
          }
        `,
        ruby: code`
          def outerTrees(trees)
            pts = trees.map { |p| [p[0], p[1]] }.sort
            n = pts.size
            cross = lambda do |o, a, b|
              (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0])
            end
            on_hull = Array.new(n, false)
            [(0...n).to_a, (0...n).to_a.reverse].each do |order|
              chain = []
              order.each do |i|
                chain.pop while chain.size >= 2 && cross.call(chain[-2], chain[-1], i) < 0
                chain << i
              end
              chain.each { |i| on_hull[i] = true }
            end
            (0...n).select { |i| on_hull[i] }.map { |i| pts[i] }
          end
        `,
      },
    };
  })(),

  // ── Self Crossing (LC 335) ───────────────────────────────────────
  (() => {
    const ref = (d: number[]) => {
      // Brute force: build the segments and test every non-adjacent pair.
      const dirs = [[0, 1], [-1, 0], [0, -1], [1, 0]];
      const segs: number[][] = [];
      let x = 0, y = 0;
      for (let i = 0; i < d.length; i++) {
        const nx = x + dirs[i % 4][0] * d[i], ny = y + dirs[i % 4][1] * d[i];
        segs.push([Math.min(x, nx), Math.min(y, ny), Math.max(x, nx), Math.max(y, ny)]);
        x = nx; y = ny;
      }
      for (let b = 0; b < segs.length; b++) {
        for (let a = 0; a + 2 <= b; a++) {
          const s = segs[a], t = segs[b];
          if (Math.max(s[0], t[0]) <= Math.min(s[2], t[2]) && Math.max(s[1], t[1]) <= Math.min(s[3], t[3])) return true;
        }
      }
      return false;
    };
    return {
      slug: "self-crossing",
      title: "Self Crossing",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Geometry", "Google", "Amazon"],
      signature: { funcName: "isSelfCrossing", params: [{ name: "distance", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "A robot starts at `(0, 0)` and walks `distance[0]` units north, then `distance[1]` units west, then `distance[2]` south, `distance[3]` east, and so on — turning **counter-clockwise** by 90 degrees after every leg.\n\nReturn `true` if its path ever crosses or touches itself (a leg meeting any earlier part of the path other than the corner it starts from), and `false` otherwise.",
        [
          { in: "distance = [3,2,2,3]", out: "true", note: "The fourth leg, heading east at y = 1, cuts through the first leg at (0, 1)." },
          { in: "distance = [2,3,4,5,6]", out: "false", note: "Every leg is longer than the parallel one before it: an outward spiral never meets itself." },
          { in: "distance = [2,2,2,2]", out: "true", note: "The path returns to the origin, touching its starting point." },
        ],
        ["1 <= distance.length <= 10^5", "1 <= distance[i] <= 10^5"],
        "Can you do it in one pass with O(1) extra space?"),
      hints: [
        "A leg can only hit legs that are 3, 4 or 5 steps older; anything older is shielded by those.",
        "Leg `i` hits leg `i - 3` when it is at least as long as leg `i - 2` while leg `i - 1` is no longer than leg `i - 3`.",
        "Leg `i` meets leg `i - 4` when leg `i - 1` exactly equals leg `i - 3` and legs `i` and `i - 4` together reach leg `i - 2`; leg `i` hits leg `i - 5` in the shrinking-after-growing spiral — write out that inequality too.",
      ],
      editorial: explain({
        idea: "Because the path turns the same way every time, it is a spiral that can only grow, only shrink, or grow and then shrink. A new leg can only reach the legs 3, 4 or 5 positions back, so three local inequalities decide the answer.",
        steps: [
          "For each `i >= 3`, let `d = distance`.",
          "Case 1 (meets leg i-3): `d[i] >= d[i-2]` and `d[i-1] <= d[i-3]`.",
          "Case 2 (meets leg i-4 head-on): `i >= 4`, `d[i-1] == d[i-3]` and `d[i] + d[i-4] >= d[i-2]`.",
          "Case 3 (meets leg i-5): `i >= 5`, `d[i-2] >= d[i-4]`, `d[i] + d[i-4] >= d[i-2]`, `d[i-1] <= d[i-3]` and `d[i-1] + d[i-5] >= d[i-3]`.",
          "Return `true` at the first case that holds; `false` if none ever does.",
        ],
        why: "Leg `i` is parallel to legs `i-2`, `i-4`, … and perpendicular to `i-1`, `i-3`, `i-5`, …; it is adjacent to `i-1` and can never touch `i-2`. While the spiral is still growing, the newest leg stays outside everything; once a leg is no longer than the one two before it, the path has turned inward and is boxed in by legs `i-3` to `i-5`, which form the walls around it — any older leg lies outside that box. Case 1 is the inward leg running into the wall `i-3`; case 2 is the leg `i-1` exactly retracing `i-3` so leg `i` lands on `i-4`; case 3 is the transition from growing to shrinking where leg `i` reaches `i-5`. These cover every way the newest leg can touch the box.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Touching counts as crossing: every comparison uses `>=` / `<=`, and case 2 is an exact equality.",
          "Case 3 needs all four inequalities; dropping `d[i-2] >= d[i-4]` reports crossings in shrinking spirals that never reach leg i-5.",
          "A segment-intersection brute force is O(n²) and too slow for 10^5 legs, though it is a good way to test the formula.",
        ],
      }),
      examples: [
        { input: "[3,2,2,3]", expectedOutput: "true" },
        { input: "[2,3,4,5,6]", expectedOutput: "false" },
        { input: "[2,2,2,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [4, 6, 10, 20, 40]));
        const kind = ri(rng, 0, 6);
        const d: number[] = [];
        if (kind === 0) for (let i = 0; i < n; i++) d.push(ri(rng, 1, 3));
        else if (kind === 1) for (let i = 0; i < n; i++) d.push(ri(rng, 1, 100000));
        else if (kind === 2) {
          // Strictly growing spiral.
          for (let i = 0; i < n; i++) d.push(i < 2 ? ri(rng, 1, 5) : d[i - 2] + ri(rng, 1, 3));
        } else if (kind === 3) {
          // Shrinking spiral from large legs.
          for (let i = 0; i < n; i++) {
            const v = i < 2 ? ri(rng, 200, 400) : d[i - 2] - ri(rng, 1, 6);
            if (v < 1) break;
            d.push(v);
          }
        } else {
          // Grow, then turn inward with legs near the critical lengths.
          const grow = ri(rng, 0, Math.max(0, n - 3));
          for (let i = 0; i < grow; i++) d.push(i < 2 ? ri(rng, 1, 4) : d[i - 2] + ri(rng, 1, 3));
          while (d.length < n) {
            const i = d.length;
            const base = i >= 2 ? d[i - 2] : ri(rng, 1, 8);
            const back = i >= 4 ? d[i - 4] : 0;
            const v = pick(rng, [base, base - 1, base + 1, base - back, base - back + 1, base - back - 1, ri(rng, 1, base + 2)]);
            d.push(Math.max(1, Math.min(100000, v)));
          }
        }
        if (!d.length) d.push(ri(rng, 1, 5));
        return { input: fmtIntArr(d), expectedOutput: bool(ref(d)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isSelfCrossing(distance: List[int]) -> bool:
              d = distance
              for i in range(3, len(d)):
                  if d[i] >= d[i - 2] and d[i - 1] <= d[i - 3]:
                      return True
                  if i >= 4 and d[i - 1] == d[i - 3] and d[i] + d[i - 4] >= d[i - 2]:
                      return True
                  if (i >= 5 and d[i - 2] >= d[i - 4] and d[i] + d[i - 4] >= d[i - 2]
                          and d[i - 1] <= d[i - 3] and d[i - 1] + d[i - 5] >= d[i - 3]):
                      return True
              return False
        `,
        javascript: code`
          var isSelfCrossing = function(distance) {
              var d = distance;
              for (var i = 3; i < d.length; i++) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] === d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2] &&
                      d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          };
        `,
        typescript: code`
          function isSelfCrossing(distance: number[]): boolean {
              var d = distance;
              for (var i = 3; i < d.length; i++) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] === d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2] &&
                      d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          }
        `,
        java: code`
          public static boolean isSelfCrossing(int[] distance) {
              int[] d = distance;
              for (int i = 3; i < d.length; i++) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool isSelfCrossing(vector<int>& distance) {
              vector<int>& d = distance;
              for (int i = 3; i < (int) d.size(); i++) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          }
        `,
        c: code`
          bool isSelfCrossing(int* distance, int distanceSize) {
              int* d = distance;
              for (int i = 3; i < distanceSize; i++) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          }
        `,
        csharp: code`
          public static bool IsSelfCrossing(int[] distance)
          {
              int[] d = distance;
              for (int i = 3; i < d.Length; i++)
              {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true;
                  if (i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true;
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true;
              }
              return false;
          }
        `,
        go: code`
          func isSelfCrossing(distance []int) bool {
              d := distance
              for i := 3; i < len(d); i++ {
                  if d[i] >= d[i-2] && d[i-1] <= d[i-3] {
                      return true
                  }
                  if i >= 4 && d[i-1] == d[i-3] && d[i]+d[i-4] >= d[i-2] {
                      return true
                  }
                  if i >= 5 && d[i-2] >= d[i-4] && d[i]+d[i-4] >= d[i-2] && d[i-1] <= d[i-3] && d[i-1]+d[i-5] >= d[i-3] {
                      return true
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun isSelfCrossing(distance: IntArray): Boolean {
              val d = distance
              for (i in 3 until d.size) {
                  if (d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]) return true
                  if (i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]) return true
                  if (i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2] &&
                      d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]) return true
              }
              return false
          }
        `,
        swift: code`
          func isSelfCrossing(_ distance: [Int]) -> Bool {
              let d = distance
              if d.count < 4 { return false }
              for i in 3..<d.count {
                  if d[i] >= d[i - 2] && d[i - 1] <= d[i - 3] { return true }
                  if i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2] { return true }
                  if i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3] { return true }
              }
              return false
          }
        `,
        rust: code`
          fn isSelfCrossing(distance: Vec<i32>) -> bool {
              let d = &distance;
              for i in 3..d.len() {
                  if d[i] >= d[i - 2] && d[i - 1] <= d[i - 3] {
                      return true;
                  }
                  if i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2] {
                      return true;
                  }
                  if i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2]
                      && d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3] {
                      return true;
                  }
              }
              false
          }
        `,
        php: code`
          function isSelfCrossing($distance) {
              $d = $distance;
              $n = count($d);
              for ($i = 3; $i < $n; $i++) {
                  if ($d[$i] >= $d[$i - 2] && $d[$i - 1] <= $d[$i - 3]) return true;
                  if ($i >= 4 && $d[$i - 1] == $d[$i - 3] && $d[$i] + $d[$i - 4] >= $d[$i - 2]) return true;
                  if ($i >= 5 && $d[$i - 2] >= $d[$i - 4] && $d[$i] + $d[$i - 4] >= $d[$i - 2]
                      && $d[$i - 1] <= $d[$i - 3] && $d[$i - 1] + $d[$i - 5] >= $d[$i - 3]) return true;
              }
              return false;
          }
        `,
        ruby: code`
          def isSelfCrossing(distance)
            d = distance
            (3...d.size).each do |i|
              return true if d[i] >= d[i - 2] && d[i - 1] <= d[i - 3]
              return true if i >= 4 && d[i - 1] == d[i - 3] && d[i] + d[i - 4] >= d[i - 2]
              if i >= 5 && d[i - 2] >= d[i - 4] && d[i] + d[i - 4] >= d[i - 2] &&
                 d[i - 1] <= d[i - 3] && d[i - 1] + d[i - 5] >= d[i - 3]
                return true
              end
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Largest Palindrome Product (LC 479) ──────────────────────────
  (() => {
    // Exhaustive search (palindromes from the top, factors from 10^n - 1
    // down to the square root), run once offline in 64-bit Java:
    // n=2 9009, n=3 906609, n=4 99000099, n=5 9966006699, n=6 999000000999,
    // n=7 99956644665999, n=8 9999000000009999; n=1 is 9 = 3 x 3.
    const ANSWERS = [9, 987, 123, 597, 677, 1218, 877, 475];
    return {
      slug: "largest-palindrome-product",
      title: "Largest Palindrome Product",
      difficulty: "HARD" as const,
      tags: ["Math", "Enumeration", "Yahoo", "Google"],
      signature: { funcName: "largestPalindrome", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given `n`, find the **largest palindrome** (a number that reads the same forwards and backwards in decimal) that can be written as the product of two `n`-digit integers.\n\nThe palindrome can be huge, so return it **modulo** `1337`.",
        [
          { in: "n = 2", out: "987", note: "99 × 91 = 9009, and 9009 % 1337 = 987." },
          { in: "n = 1", out: "9", note: "3 × 3 = 9 (or 9 × 1)." },
          { in: "n = 3", out: "123", note: "993 × 913 = 906609, and 906609 % 1337 = 123." },
        ],
        ["1 <= n <= 8"]),
      hints: [
        "For n ≥ 2 the answer has 2n digits, so it is fixed by its upper half — try upper halves from the largest down.",
        "Write the factors as `10^n - p` and `10^n - q`. Their product is `(10^n - (p + q))·10^n + p·q`, which reads as 'upper half `10^n - s`, lower half `p·q`' when `p·q < 10^n`, with `s = p + q`.",
        "For each `s = 2, 3, …`, the lower half must be `L = reverse(10^n - s)`; integers `p, q` with sum `s` and product `L` exist exactly when `s² - 4L` is a perfect square.",
      ],
      editorial: explain({
        idea: "Both factors of the answer sit just below `10^n`. Writing them as `10^n - p` and `10^n - q` turns 'is the product a palindrome?' into a quadratic in `p` and `q`, which can be tested in O(1) for each value of `s = p + q`, scanned upward from 2.",
        steps: [
          "If `n == 1`, return 9.",
          "For `s = 2, 3, 4, …`: let `upper = 10^n - s` and `lower = reverse(upper)` (as a number).",
          "`p` and `q` are the roots of `t² - s·t + lower = 0`; compute `disc = s² - 4·lower`. Skip if it is negative.",
          "If `disc` is a perfect square, the palindrome `upper·10^n + lower` is a product of two n-digit numbers; return `(upper mod 1337 · 10^n mod 1337 + lower) mod 1337`.",
        ],
        why: "`(10^n - p)(10^n - q) = (10^n - s)·10^n + pq`, so if `pq = reverse(10^n - s)` (which is below `10^n`) the product is literally the palindrome with upper half `10^n - s`; conversely the perfect-square test recovers `p = (s + r)/2`, `q = (s - r)/2` exactly. A smaller `s` means a larger upper half, so the first hit is the largest palindrome among products with `pq < 10^n`. A product with `pq ≥ 10^n` needs `s ≥ 2·10^(n/2)`, and its upper half is then at most `10^n - 2·10^(n/2) + 1`; the scan hits first at `s = 10, 100, 340, 1000, 4336, 10000` for `n = 2, 4, 5, 6, 7, 8`, all below that bound, so nothing larger is skipped. For `n = 3` (hit at `s = 94`) an exhaustive search confirms `906609 = 913 × 993` is the maximum.",
        time: "O(s* · n) — about 10^4 tiny steps for n = 8",
        space: "O(1)",
        pitfalls: [
          "The plain search (palindromes downward, try every divisor) is correct but needs ~10^7 divisions for n = 8 — fine in C++, far too slow in Python.",
          "The palindrome for n = 8 exceeds 2^53: in JavaScript never form `upper·10^n` — reduce both factors modulo 1337 first.",
          "`n = 1` is special: its answer 9 has one digit, not two.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "987" },
        { input: "1", expectedOutput: "9" },
        { input: "3", expectedOutput: "123" },
      ],
      hiddenCount: 100,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        return { input: String(n), expectedOutput: String(ANSWERS[n - 1]) };
      },
      solutions: {
        python: code`
          import math

          def largestPalindrome(n: int) -> int:
              if n == 1:
                  return 9
              base = 10 ** n
              for s in range(2, base):
                  upper = base - s
                  lower = int(str(upper)[::-1])
                  disc = s * s - 4 * lower
                  if disc < 0:
                      continue
                  r = math.isqrt(disc)
                  if r * r == disc:
                      return (upper * base + lower) % 1337
              return -1
        `,
        javascript: code`
          var largestPalindrome = function(n) {
              if (n === 1) return 9;
              var base = Math.pow(10, n);
              for (var s = 2; s < base; s++) {
                  var upper = base - s;
                  var lower = 0, t = upper;
                  while (t > 0) {
                      lower = lower * 10 + (t % 10);
                      t = Math.floor(t / 10);
                  }
                  var disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  var r = Math.floor(Math.sqrt(disc));
                  while (r * r > disc) r--;
                  while ((r + 1) * (r + 1) <= disc) r++;
                  if (r * r === disc) return ((upper % 1337) * (base % 1337) + lower) % 1337;
              }
              return -1;
          };
        `,
        typescript: code`
          function largestPalindrome(n: number): number {
              if (n === 1) return 9;
              var base = Math.pow(10, n);
              for (var s = 2; s < base; s++) {
                  var upper = base - s;
                  var lower = 0, t = upper;
                  while (t > 0) {
                      lower = lower * 10 + (t % 10);
                      t = Math.floor(t / 10);
                  }
                  var disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  var r = Math.floor(Math.sqrt(disc));
                  while (r * r > disc) r--;
                  while ((r + 1) * (r + 1) <= disc) r++;
                  if (r * r === disc) return ((upper % 1337) * (base % 1337) + lower) % 1337;
              }
              return -1;
          }
        `,
        java: code`
          public static int largestPalindrome(int n) {
              if (n == 1) return 9;
              long base = 1;
              for (int i = 0; i < n; i++) base *= 10;
              for (long s = 2; s < base; s++) {
                  long upper = base - s;
                  long lower = 0, t = upper;
                  while (t > 0) {
                      lower = lower * 10 + t % 10;
                      t /= 10;
                  }
                  long disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  long r = (long) Math.sqrt((double) disc);
                  while (r * r > disc) r--;
                  while ((r + 1) * (r + 1) <= disc) r++;
                  if (r * r == disc) return (int) ((upper * base + lower) % 1337);
              }
              return -1;
          }
        `,
        cpp: code`
          int largestPalindrome(int n) {
              if (n == 1) return 9;
              long long base = 1;
              for (int i = 0; i < n; i++) base *= 10;
              for (long long s = 2; s < base; s++) {
                  long long upper = base - s;
                  long long lower = 0, t = upper;
                  while (t > 0) {
                      lower = lower * 10 + t % 10;
                      t /= 10;
                  }
                  long long disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  long long r = (long long) sqrt((double) disc);
                  while (r * r > disc) r--;
                  while ((r + 1) * (r + 1) <= disc) r++;
                  if (r * r == disc) return (int) ((upper * base + lower) % 1337);
              }
              return -1;
          }
        `,
        c: code`
          static long long palIsqrt(long long v) {
              long long lo = 0, hi = 3037000499LL;
              while (lo < hi) {
                  long long mid = lo + (hi - lo + 1) / 2;
                  if (mid <= v / mid) lo = mid; else hi = mid - 1;
              }
              return lo;
          }

          int largestPalindrome(int n) {
              if (n == 1) return 9;
              long long base = 1;
              for (int i = 0; i < n; i++) base *= 10;
              for (long long s = 2; s < base; s++) {
                  long long upper = base - s;
                  long long lower = 0, t = upper;
                  while (t > 0) {
                      lower = lower * 10 + t % 10;
                      t /= 10;
                  }
                  long long disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  long long r = palIsqrt(disc);
                  if (r * r == disc) return (int) ((upper * base + lower) % 1337);
              }
              return -1;
          }
        `,
        csharp: code`
          public static int LargestPalindrome(int n)
          {
              if (n == 1) return 9;
              long b = 1;
              for (int i = 0; i < n; i++) b *= 10;
              for (long s = 2; s < b; s++)
              {
                  long upper = b - s;
                  long lower = 0, t = upper;
                  while (t > 0)
                  {
                      lower = lower * 10 + t % 10;
                      t /= 10;
                  }
                  long disc = s * s - 4 * lower;
                  if (disc < 0) continue;
                  long r = (long) Math.Sqrt((double) disc);
                  while (r * r > disc) r--;
                  while ((r + 1) * (r + 1) <= disc) r++;
                  if (r * r == disc) return (int) ((upper * b + lower) % 1337);
              }
              return -1;
          }
        `,
        go: code`
          func largestPalindrome(n int) int {
              if n == 1 {
                  return 9
              }
              base := 1
              for i := 0; i < n; i++ {
                  base *= 10
              }
              for s := 2; s < base; s++ {
                  upper := base - s
                  lower, t := 0, upper
                  for t > 0 {
                      lower = lower*10 + t%10
                      t /= 10
                  }
                  disc := s*s - 4*lower
                  if disc < 0 {
                      continue
                  }
                  r := int(math.Sqrt(float64(disc)))
                  for r*r > disc {
                      r--
                  }
                  for (r+1)*(r+1) <= disc {
                      r++
                  }
                  if r*r == disc {
                      return (upper*base + lower) % 1337
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun largestPalindrome(n: Int): Int {
              if (n == 1) return 9
              var base = 1L
              for (i in 0 until n) base *= 10
              var s = 2L
              while (s < base) {
                  val upper = base - s
                  var lower = 0L
                  var t = upper
                  while (t > 0) {
                      lower = lower * 10 + t % 10
                      t /= 10
                  }
                  val disc = s * s - 4 * lower
                  if (disc >= 0) {
                      var r = Math.sqrt(disc.toDouble()).toLong()
                      while (r * r > disc) r--
                      while ((r + 1) * (r + 1) <= disc) r++
                      if (r * r == disc) return ((upper * base + lower) % 1337).toInt()
                  }
                  s++
              }
              return -1
          }
        `,
        swift: code`
          func largestPalindrome(_ n: Int) -> Int {
              if n == 1 { return 9 }
              var base = 1
              for _ in 0..<n { base *= 10 }
              var s = 2
              while s < base {
                  let upper = base - s
                  var lower = 0, t = upper
                  while t > 0 {
                      lower = lower * 10 + t % 10
                      t /= 10
                  }
                  let disc = s * s - 4 * lower
                  if disc >= 0 {
                      var r = Int(Double(disc).squareRoot())
                      while r * r > disc { r -= 1 }
                      while (r + 1) * (r + 1) <= disc { r += 1 }
                      if r * r == disc { return (upper * base + lower) % 1337 }
                  }
                  s += 1
              }
              return -1
          }
        `,
        rust: code`
          fn largestPalindrome(n: i32) -> i32 {
              if n == 1 {
                  return 9;
              }
              let mut base: i64 = 1;
              for _ in 0..n {
                  base *= 10;
              }
              let mut s: i64 = 2;
              while s < base {
                  let upper = base - s;
                  let mut lower: i64 = 0;
                  let mut t = upper;
                  while t > 0 {
                      lower = lower * 10 + t % 10;
                      t /= 10;
                  }
                  let disc = s * s - 4 * lower;
                  if disc >= 0 {
                      let mut r = (disc as f64).sqrt() as i64;
                      while r * r > disc {
                          r -= 1;
                      }
                      while (r + 1) * (r + 1) <= disc {
                          r += 1;
                      }
                      if r * r == disc {
                          return ((upper * base + lower) % 1337) as i32;
                      }
                  }
                  s += 1;
              }
              -1
          }
        `,
        php: code`
          function largestPalindrome($n) {
              if ($n == 1) return 9;
              $base = 1;
              for ($i = 0; $i < $n; $i++) $base *= 10;
              for ($s = 2; $s < $base; $s++) {
                  $upper = $base - $s;
                  $lower = intval(strrev((string) $upper));
                  $disc = $s * $s - 4 * $lower;
                  if ($disc < 0) continue;
                  $r = intval(sqrt($disc));
                  while ($r * $r > $disc) $r--;
                  while (($r + 1) * ($r + 1) <= $disc) $r++;
                  if ($r * $r == $disc) return ($upper * $base + $lower) % 1337;
              }
              return -1;
          }
        `,
        ruby: code`
          def largestPalindrome(n)
            return 9 if n == 1
            base = 10**n
            s = 2
            while s < base
              upper = base - s
              lower = upper.to_s.reverse.to_i
              disc = s * s - 4 * lower
              if disc >= 0
                r = Integer.sqrt(disc)
                return (upper * base + lower) % 1337 if r * r == disc
              end
              s += 1
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Sum of Floored Pairs (LC 1862) ───────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0;
      for (const a of nums) for (const b of nums) total += Math.floor(a / b);
      return total % 1000000007;
    };
    return {
      slug: "sum-of-floored-pairs",
      title: "Sum of Floored Pairs",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Binary Search", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "sumOfFlooredPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, compute the sum of `floor(nums[i] / nums[j])` over **all** ordered pairs of indices `0 <= i, j < nums.length` — including `i == j`, and counting `(i, j)` and `(j, i)` separately.\n\nThe sum can be very large; return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [3,7,4]", out: "7", note: "Row by row: 3 → 1+0+0, 7 → 2+1+1, 4 → 1+0+1." },
          { in: "nums = [6,6,6]", out: "9", note: "Each of the nine pairs contributes 1." },
          { in: "nums = [1,100000]", out: "100002" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Fix the divisor `d`. Which numerators give a quotient of exactly `k`?",
        "Those in `[k·d, (k+1)·d - 1]` — and a prefix count over values tells you how many there are in O(1).",
        "For each distinct divisor `d`, loop `k = 1, 2, …` while `k·d <= max`; the total work is a harmonic series, about `max · ln(max)`.",
      ],
      editorial: explain({
        idea: "Group numerators by quotient. For a divisor `d`, every numerator in `[k·d, (k+1)·d - 1]` contributes exactly `k`, and counting the numerators in a value range is a prefix-sum lookup.",
        steps: [
          "Let `M = max(nums)`; build `cnt[v]` (how many times `v` occurs) and its prefix sums `pre[v]` (how many values are `<= v`).",
          "For each `d` with `cnt[d] > 0`, for `k = 1, 2, …` while `k·d <= M`: let `c = pre[min(M, (k+1)·d - 1)] - pre[k·d - 1]`.",
          "Add `k · c · cnt[d]` to the answer (every copy of `d` is a separate divisor), reducing modulo 10^9 + 7.",
          "Numerators below `d` give quotient 0 and are never visited.",
        ],
        why: "`floor(a / d) = k` exactly when `k·d <= a < (k+1)·d`, so the ranges for `k = 1, 2, …` partition all numerators `>= d` and each pair `(a, d)` is counted once with its true quotient. The loop for divisor `d` runs `M / d` times, and summing over distinct `d` gives at most `M·(1 + 1/2 + … + 1/M) = O(M log M)`.",
        time: "O(n + M log M) with M = max(nums)",
        space: "O(M)",
        pitfalls: [
          "The pair count `k · c · cnt[d]` can reach 10^15 — use 64-bit arithmetic (or reduce `k · c` first in JavaScript).",
          "Remember the duplicates of the divisor: multiply by `cnt[d]`, and iterate over distinct values only.",
          "The brute-force double loop is O(n²) — 10^10 pairs at the limit.",
        ],
      }),
      examples: [
        { input: "[3,7,4]", expectedOutput: "7" },
        { input: "[6,6,6]", expectedOutput: "9" },
        { input: "[1,100000]", expectedOutput: "100002" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let nums: number[];
        if (roll < 0.004) {
          // Large sums that pass the modulus: ones against big values.
          const n = ri(rng, 500, 600);
          nums = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 1 : ri(rng, 20000, 25000)));
          nums = shuffle(rng, nums);
        } else if (roll < 0.04) {
          const n = ri(rng, 1, 60);
          nums = Array.from({ length: n }, () => ri(rng, 1, 1000));
        } else if (roll < 0.041) {
          nums = [ri(rng, 1, 3), 100000, ri(rng, 90000, 100000)];
        } else {
          const n = ri(rng, 1, 20);
          const V = pick(rng, [1, 3, 10, 50, 150]);
          nums = Array.from({ length: n }, () => ri(rng, 1, V));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfFlooredPairs(nums: List[int]) -> int:
              MOD = 10 ** 9 + 7
              top = max(nums)
              cnt = [0] * (top + 1)
              for v in nums:
                  cnt[v] += 1
              pre = [0] * (top + 1)
              run = 0
              for v in range(top + 1):
                  run += cnt[v]
                  pre[v] = run
              total = 0
              for d in range(1, top + 1):
                  if cnt[d] == 0:
                      continue
                  k = 1
                  while k * d <= top:
                      lo = k * d
                      hi = min(top, lo + d - 1)
                      total += k * (pre[hi] - pre[lo - 1]) * cnt[d]
                      k += 1
              return total % MOD
        `,
        javascript: code`
          var sumOfFlooredPairs = function(nums) {
              var MOD = 1000000007;
              var top = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > top) top = nums[i];
              var cnt = new Array(top + 1).fill(0);
              for (i = 0; i < nums.length; i++) cnt[nums[i]]++;
              var pre = new Array(top + 1).fill(0);
              var run = 0;
              for (var v = 0; v <= top; v++) {
                  run += cnt[v];
                  pre[v] = run;
              }
              var total = 0;
              for (var d = 1; d <= top; d++) {
                  if (cnt[d] === 0) continue;
                  for (var k = 1; k * d <= top; k++) {
                      var lo = k * d, hi = Math.min(top, lo + d - 1);
                      var c = pre[hi] - pre[lo - 1];
                      if (c > 0) total = (total + ((k * c) % MOD) * cnt[d]) % MOD;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function sumOfFlooredPairs(nums: number[]): number {
              var MOD = 1000000007;
              var top = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > top) top = nums[i];
              var cnt: number[] = [];
              for (var z = 0; z <= top; z++) cnt.push(0);
              for (i = 0; i < nums.length; i++) cnt[nums[i]]++;
              var pre: number[] = [];
              var run = 0;
              for (var v = 0; v <= top; v++) {
                  run += cnt[v];
                  pre.push(run);
              }
              var total = 0;
              for (var d = 1; d <= top; d++) {
                  if (cnt[d] === 0) continue;
                  for (var k = 1; k * d <= top; k++) {
                      var lo = k * d, hi = Math.min(top, lo + d - 1);
                      var c = pre[hi] - pre[lo - 1];
                      if (c > 0) total = (total + ((k * c) % MOD) * cnt[d]) % MOD;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int sumOfFlooredPairs(int[] nums) {
              final long MOD = 1000000007L;
              int top = 0;
              for (int v : nums) top = Math.max(top, v);
              int[] cnt = new int[top + 1];
              for (int v : nums) cnt[v]++;
              int[] pre = new int[top + 1];
              int run = 0;
              for (int v = 0; v <= top; v++) {
                  run += cnt[v];
                  pre[v] = run;
              }
              long total = 0;
              for (int d = 1; d <= top; d++) {
                  if (cnt[d] == 0) continue;
                  for (int k = 1; (long) k * d <= top; k++) {
                      int lo = k * d, hi = Math.min(top, lo + d - 1);
                      long c = pre[hi] - pre[lo - 1];
                      total = (total + (long) k * c % MOD * cnt[d]) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int sumOfFlooredPairs(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              int top = *max_element(nums.begin(), nums.end());
              vector<int> cnt(top + 1, 0), pre(top + 1, 0);
              for (int v : nums) cnt[v]++;
              int run = 0;
              for (int v = 0; v <= top; v++) {
                  run += cnt[v];
                  pre[v] = run;
              }
              long long total = 0;
              for (int d = 1; d <= top; d++) {
                  if (cnt[d] == 0) continue;
                  for (long long k = 1; k * d <= top; k++) {
                      int lo = (int) (k * d), hi = min(top, lo + d - 1);
                      long long c = pre[hi] - pre[lo - 1];
                      total = (total + k * c % MOD * cnt[d]) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        c: code`
          int sumOfFlooredPairs(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              int top = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > top) top = nums[i];
              int* cnt = (int*) calloc(top + 1, sizeof(int));
              int* pre = (int*) calloc(top + 1, sizeof(int));
              for (int i = 0; i < numsSize; i++) cnt[nums[i]]++;
              int run = 0;
              for (int v = 0; v <= top; v++) {
                  run += cnt[v];
                  pre[v] = run;
              }
              long long total = 0;
              for (int d = 1; d <= top; d++) {
                  if (cnt[d] == 0) continue;
                  for (long long k = 1; k * d <= top; k++) {
                      int lo = (int) (k * d);
                      int hi = lo + d - 1 < top ? lo + d - 1 : top;
                      long long c = pre[hi] - pre[lo - 1];
                      total = (total + k * c % MOD * cnt[d]) % MOD;
                  }
              }
              free(cnt);
              free(pre);
              return (int) total;
          }
        `,
        csharp: code`
          public static int SumOfFlooredPairs(int[] nums)
          {
              const long MOD = 1000000007L;
              int top = nums.Max();
              int[] cnt = new int[top + 1];
              foreach (int v in nums) cnt[v]++;
              int[] pre = new int[top + 1];
              int run = 0;
              for (int v = 0; v <= top; v++)
              {
                  run += cnt[v];
                  pre[v] = run;
              }
              long total = 0;
              for (int d = 1; d <= top; d++)
              {
                  if (cnt[d] == 0) continue;
                  for (long k = 1; k * d <= top; k++)
                  {
                      int lo = (int) (k * d), hi = Math.Min(top, lo + d - 1);
                      long c = pre[hi] - pre[lo - 1];
                      total = (total + k * c % MOD * cnt[d]) % MOD;
                  }
              }
              return (int) total;
          }
        `,
        go: code`
          func sumOfFlooredPairs(nums []int) int {
              const MOD = 1000000007
              top := 0
              for _, v := range nums {
                  if v > top {
                      top = v
                  }
              }
              cnt := make([]int, top+1)
              for _, v := range nums {
                  cnt[v]++
              }
              pre := make([]int, top+1)
              run := 0
              for v := 0; v <= top; v++ {
                  run += cnt[v]
                  pre[v] = run
              }
              total := 0
              for d := 1; d <= top; d++ {
                  if cnt[d] == 0 {
                      continue
                  }
                  for k := 1; k*d <= top; k++ {
                      lo := k * d
                      hi := lo + d - 1
                      if hi > top {
                          hi = top
                      }
                      c := pre[hi] - pre[lo-1]
                      total = (total + k*c%MOD*cnt[d]) % MOD
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun sumOfFlooredPairs(nums: IntArray): Int {
              val MOD = 1_000_000_007L
              var top = 0
              for (v in nums) if (v > top) top = v
              val cnt = IntArray(top + 1)
              for (v in nums) cnt[v]++
              val pre = IntArray(top + 1)
              var run = 0
              for (v in 0..top) {
                  run += cnt[v]
                  pre[v] = run
              }
              var total = 0L
              for (d in 1..top) {
                  if (cnt[d] == 0) continue
                  var k = 1L
                  while (k * d <= top) {
                      val lo = (k * d).toInt()
                      val hi = minOf(top, lo + d - 1)
                      val c = (pre[hi] - pre[lo - 1]).toLong()
                      total = (total + k * c % MOD * cnt[d]) % MOD
                      k++
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func sumOfFlooredPairs(_ nums: [Int]) -> Int {
              let MOD = 1_000_000_007
              let top = nums.max()!
              var cnt = [Int](repeating: 0, count: top + 1)
              for v in nums { cnt[v] += 1 }
              var pre = [Int](repeating: 0, count: top + 1)
              var run = 0
              for v in 0...top {
                  run += cnt[v]
                  pre[v] = run
              }
              var total = 0
              for d in 1...top where cnt[d] > 0 {
                  var k = 1
                  while k * d <= top {
                      let lo = k * d
                      let hi = min(top, lo + d - 1)
                      let c = pre[hi] - pre[lo - 1]
                      total = (total + k * c % MOD * cnt[d]) % MOD
                      k += 1
                  }
              }
              return total
          }
        `,
        rust: code`
          fn sumOfFlooredPairs(nums: Vec<i32>) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let top = *nums.iter().max().unwrap() as usize;
              let mut cnt = vec![0i64; top + 1];
              for &v in nums.iter() {
                  cnt[v as usize] += 1;
              }
              let mut pre = vec![0i64; top + 1];
              let mut run = 0i64;
              for v in 0..=top {
                  run += cnt[v];
                  pre[v] = run;
              }
              let mut total: i64 = 0;
              for d in 1..=top {
                  if cnt[d] == 0 {
                      continue;
                  }
                  let mut k = 1usize;
                  while k * d <= top {
                      let lo = k * d;
                      let hi = std::cmp::min(top, lo + d - 1);
                      let c = pre[hi] - pre[lo - 1];
                      total = (total + (k as i64) * c % MOD * cnt[d]) % MOD;
                      k += 1;
                  }
              }
              total as i32
          }
        `,
        php: code`
          function sumOfFlooredPairs($nums) {
              $MOD = 1000000007;
              $top = max($nums);
              $cnt = array_fill(0, $top + 1, 0);
              foreach ($nums as $v) $cnt[$v]++;
              $pre = array_fill(0, $top + 1, 0);
              $run = 0;
              for ($v = 0; $v <= $top; $v++) {
                  $run += $cnt[$v];
                  $pre[$v] = $run;
              }
              $total = 0;
              for ($d = 1; $d <= $top; $d++) {
                  if ($cnt[$d] == 0) continue;
                  for ($k = 1; $k * $d <= $top; $k++) {
                      $lo = $k * $d;
                      $hi = min($top, $lo + $d - 1);
                      $c = $pre[$hi] - $pre[$lo - 1];
                      $total = ($total + $k * $c % $MOD * $cnt[$d]) % $MOD;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def sumOfFlooredPairs(nums)
            top = nums.max
            cnt = Array.new(top + 1, 0)
            nums.each { |v| cnt[v] += 1 }
            pre = Array.new(top + 1, 0)
            run = 0
            (0..top).each do |v|
              run += cnt[v]
              pre[v] = run
            end
            total = 0
            (1..top).each do |d|
              next if cnt[d] == 0
              k = 1
              while k * d <= top
                lo = k * d
                hi = [top, lo + d - 1].min
                total += k * (pre[hi] - pre[lo - 1]) * cnt[d]
                k += 1
              end
            end
            total % 1_000_000_007
          end
        `,
      },
    };
  })(),

  // ── Count Good Numbers (LC 1922) ─────────────────────────────────
  (() => {
    const M = 1000000007n;
    const powBig = (b: bigint, e: bigint) => {
      let r = 1n; b %= M;
      while (e > 0n) { if (e & 1n) r = (r * b) % M; b = (b * b) % M; e >>= 1n; }
      return r;
    };
    const ref = (n: number) => Number((powBig(5n, BigInt(Math.ceil(n / 2))) * powBig(4n, BigInt(Math.floor(n / 2)))) % M);
    return {
      slug: "count-good-numbers",
      title: "Count Good Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Recursion", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countGoodNumbers", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A digit string (leading zeros allowed) is **good** when every digit at an **even** index (0-indexed) is even — `0, 2, 4, 6` or `8` — and every digit at an **odd** index is a prime — `2, 3, 5` or `7`.\n\nFor example, `\"2582\"` is good, while `\"3245\"` is not (index 0 holds 3, which is odd).\n\nReturn how many good digit strings of length `n` exist, **modulo** `10^9 + 7`. (Here `n` fits in a 32-bit integer; the original problem allows lengths up to 10^15.)",
        [
          { in: "n = 1", out: "5", note: "\"0\", \"2\", \"4\", \"6\" and \"8\"." },
          { in: "n = 4", out: "400", note: "Two even positions with 5 choices and two odd positions with 4 choices: 5·4·5·4." },
          { in: "n = 50", out: "564908303" },
        ],
        ["1 <= n <= 2 * 10^9"]),
      hints: [
        "Positions are independent: each even index has 5 choices, each odd index has 4.",
        "There are `ceil(n / 2)` even indices and `floor(n / 2)` odd ones, so the count is `5^ceil(n/2) · 4^floor(n/2)`.",
        "The exponents reach 10^9 — use fast exponentiation by squaring, reducing modulo 10^9 + 7 after every multiplication.",
      ],
      editorial: explain({
        idea: "The choice at each position is independent of every other, so the count is a product of powers, computed with binary exponentiation.",
        steps: [
          "Let `even = (n + 1) / 2` and `odd = n / 2` (integer division).",
          "Compute `5^even mod M` and `4^odd mod M` by repeated squaring: square the base each round and multiply it into the result when the current exponent bit is 1.",
          "Return their product modulo `M = 10^9 + 7`.",
        ],
        why: "A good string is exactly a choice of an even digit for each of the `ceil(n/2)` even indices and a prime digit for each of the `floor(n/2)` odd indices, and every combination gives a distinct string — the multiplication principle gives `5^even · 4^odd`. Repeated squaring uses `b^e = (b²)^(e/2)` (times `b` when `e` is odd), so it needs only `O(log n)` multiplications, and reducing after each keeps every value below `M`.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Two residues below 10^9 + 7 multiply to ~10^18: use 64-bit integers, and in JavaScript split the multiplication (or the product loses precision past 2^53).",
          "Index 0 is even: an odd `n` has one more even position than odd ones.",
          "A loop that multiplies `n` times is far too slow for n = 2·10^9.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "5" },
        { input: "4", expectedOutput: "400" },
        { input: "50", expectedOutput: "564908303" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [10, 60, 1000, 1000000, 2000000000]);
        const n = rng() < 0.03 ? 2000000000 : ri(rng, 1, top);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def countGoodNumbers(n: int) -> int:
              MOD = 10 ** 9 + 7
              return pow(5, (n + 1) // 2, MOD) * pow(4, n // 2, MOD) % MOD
        `,
        javascript: code`
          var countGoodNumbers = function(n) {
              var MOD = 1000000007;
              var mulMod = function(a, b) {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var powMod = function(b, e) {
                  var r = 1;
                  b %= MOD;
                  while (e > 0) {
                      if (e % 2 === 1) r = mulMod(r, b);
                      b = mulMod(b, b);
                      e = Math.floor(e / 2);
                  }
                  return r;
              };
              return mulMod(powMod(5, Math.floor((n + 1) / 2)), powMod(4, Math.floor(n / 2)));
          };
        `,
        typescript: code`
          function countGoodNumbers(n: number): number {
              var MOD = 1000000007;
              var mulMod = function(a: number, b: number): number {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var powMod = function(b: number, e: number): number {
                  var r = 1;
                  b %= MOD;
                  while (e > 0) {
                      if (e % 2 === 1) r = mulMod(r, b);
                      b = mulMod(b, b);
                      e = Math.floor(e / 2);
                  }
                  return r;
              };
              return mulMod(powMod(5, Math.floor((n + 1) / 2)), powMod(4, Math.floor(n / 2)));
          }
        `,
        java: code`
          public static int countGoodNumbers(int n) {
              long even = ((long) n + 1) / 2, odd = n / 2;
              return (int) (goodPow(5, even) * goodPow(4, odd) % 1000000007L);
          }

          private static long goodPow(long b, long e) {
              final long MOD = 1000000007L;
              long r = 1;
              b %= MOD;
              while (e > 0) {
                  if ((e & 1) == 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return r;
          }
        `,
        cpp: code`
          long long goodPow(long long b, long long e) {
              const long long MOD = 1000000007LL;
              long long r = 1;
              b %= MOD;
              while (e > 0) {
                  if (e & 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return r;
          }

          int countGoodNumbers(int n) {
              long long even = ((long long) n + 1) / 2, odd = n / 2;
              return (int) (goodPow(5, even) * goodPow(4, odd) % 1000000007LL);
          }
        `,
        c: code`
          static long long goodPow(long long b, long long e) {
              const long long MOD = 1000000007LL;
              long long r = 1;
              b %= MOD;
              while (e > 0) {
                  if (e & 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return r;
          }

          int countGoodNumbers(int n) {
              long long even = ((long long) n + 1) / 2, odd = n / 2;
              return (int) (goodPow(5, even) * goodPow(4, odd) % 1000000007LL);
          }
        `,
        csharp: code`
          public static int CountGoodNumbers(int n)
          {
              long even = ((long) n + 1) / 2, odd = n / 2;
              return (int) (GoodPow(5, even) * GoodPow(4, odd) % 1000000007L);
          }

          private static long GoodPow(long b, long e)
          {
              const long MOD = 1000000007L;
              long r = 1;
              b %= MOD;
              while (e > 0)
              {
                  if ((e & 1) == 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return r;
          }
        `,
        go: code`
          func countGoodNumbers(n int) int {
              const MOD = 1000000007
              powMod := func(b, e int) int {
                  r := 1
                  b %= MOD
                  for e > 0 {
                      if e&1 == 1 {
                          r = r * b % MOD
                      }
                      b = b * b % MOD
                      e >>= 1
                  }
                  return r
              }
              return powMod(5, (n+1)/2) * powMod(4, n/2) % MOD
          }
        `,
        kotlin: code`
          fun countGoodNumbers(n: Int): Int {
              val MOD = 1_000_000_007L
              fun powMod(base: Long, exp: Long): Long {
                  var r = 1L
                  var b = base % MOD
                  var e = exp
                  while (e > 0) {
                      if ((e and 1L) == 1L) r = r * b % MOD
                      b = b * b % MOD
                      e = e shr 1
                  }
                  return r
              }
              val even = (n.toLong() + 1) / 2
              val odd = n.toLong() / 2
              return (powMod(5L, even) * powMod(4L, odd) % MOD).toInt()
          }
        `,
        swift: code`
          func countGoodNumbers(_ n: Int) -> Int {
              let MOD = 1_000_000_007
              func powMod(_ base: Int, _ exp: Int) -> Int {
                  var r = 1, b = base % MOD, e = exp
                  while e > 0 {
                      if e & 1 == 1 { r = r * b % MOD }
                      b = b * b % MOD
                      e >>= 1
                  }
                  return r
              }
              return powMod(5, (n + 1) / 2) * powMod(4, n / 2) % MOD
          }
        `,
        rust: code`
          fn good_pow(base: i64, exp: i64) -> i64 {
              const MOD: i64 = 1_000_000_007;
              let mut r: i64 = 1;
              let mut b = base % MOD;
              let mut e = exp;
              while e > 0 {
                  if e & 1 == 1 {
                      r = r * b % MOD;
                  }
                  b = b * b % MOD;
                  e >>= 1;
              }
              r
          }

          fn countGoodNumbers(n: i32) -> i32 {
              let n = n as i64;
              (good_pow(5, (n + 1) / 2) * good_pow(4, n / 2) % 1_000_000_007) as i32
          }
        `,
        php: code`
          function countGoodNumbers($n) {
              $MOD = 1000000007;
              $powMod = function($b, $e) use ($MOD) {
                  $r = 1;
                  $b %= $MOD;
                  while ($e > 0) {
                      if ($e & 1) $r = $r * $b % $MOD;
                      $b = $b * $b % $MOD;
                      $e >>= 1;
                  }
                  return $r;
              };
              return $powMod(5, intdiv($n + 1, 2)) * $powMod(4, intdiv($n, 2)) % $MOD;
          }
        `,
        ruby: code`
          def countGoodNumbers(n)
            m = 1_000_000_007
            5.pow((n + 1) / 2, m) * 4.pow(n / 2, m) % m
          end
        `,
      },
    };
  })(),

  // ── Minimum Non-Zero Product of the Array Elements (LC 1969) ─────
  (() => {
    const M = 1000000007n;
    const powBig = (b: bigint, e: bigint) => {
      let r = 1n; b %= M;
      while (e > 0n) { if (e & 1n) r = (r * b) % M; b = (b * b) % M; e >>= 1n; }
      return r;
    };
    const ref = (p: number) => {
      const top = (1n << BigInt(p)) - 1n;
      return Number(((top % M) * powBig(top - 1n, (1n << BigInt(p - 1)) - 1n)) % M);
    };
    return {
      slug: "minimum-non-zero-product-of-the-array-elements",
      title: "Minimum Non-Zero Product of the Array Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Recursion", "Google", "Amazon"],
      signature: { funcName: "minNonZeroProduct", params: [{ name: "p", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Start with the array `nums` holding every integer from `1` to `2^p - 1`, each written in binary with `p` bits.\n\nAn operation picks two elements `x` and `y` and a bit position, and **swaps** the bits of `x` and `y` at that position. You may perform any number of operations.\n\nReturn the **smallest positive product** of all the elements that can be reached. Minimise the actual product first, then return it **modulo** `10^9 + 7`.",
        [
          { in: "p = 1", out: "1", note: "nums = [1]; nothing can change." },
          { in: "p = 2", out: "6", note: "nums = [01, 10, 11]; no swap gives a smaller non-zero product than 1·2·3." },
          { in: "p = 3", out: "1512", note: "Turn [001..111] into [1, 6, 1, 6, 1, 6, 7]: 7 · 6³ = 1512." },
        ],
        ["1 <= p <= 60"]),
      hints: [
        "Swapping bits never changes the total number of 1s in each bit position, so the sum of the array is fixed — and a fixed sum gives the smallest product when values are as uneven as possible.",
        "Pair `x` with `2^p - 1 - x`: their bits are complementary, so swaps can turn the pair into `1` and `2^p - 2` (zero would make the product 0, which is not allowed).",
        "That leaves `2^p - 1` alone and `2^(p-1) - 1` pairs, each contributing `2^p - 2`: the answer is `(2^p - 1) · (2^p - 2)^(2^(p-1) - 1)`.",
      ],
      editorial: explain({
        idea: "Push every pair of complementary numbers to the extremes `1` and `2^p - 2`. The minimum product is `(2^p - 1) · (2^p - 2)^(2^(p-1) - 1)`, computed with modular exponentiation.",
        steps: [
          "Let `top = 2^p - 1` (reduced modulo M = 10^9 + 7 for the multiplication) and `base = (2^p - 2) mod M`.",
          "The exponent `2^(p-1) - 1` is `p - 1` one-bits in binary, so the power equals `base^(2^0) · base^(2^1) · … · base^(2^(p-2))`: start with `result = 1, cur = base` and repeat `p - 1` times `result *= cur; cur *= cur` (all modulo M).",
          "Return `top · result mod M`.",
        ],
        why: "Within a pair `x, 2^p - 1 - x` the two numbers have opposite bits everywhere, so every 1-bit except the lowest can be swapped into one of them, leaving `1` and `2^p - 2`. For two positive numbers with a fixed sum `s`, `a·(s - a)` is smallest when `a` is as small as possible, so each pair contributes at least `1·(2^p - 2)` — and no element may become 0. The unpaired maximum `2^p - 1` cannot be reduced without creating a zero elsewhere. Writing the exponent as a run of ones avoids ever storing `2^(p-1) - 1`, which is too large for exact arithmetic in some languages.",
        time: "O(p)",
        space: "O(1)",
        pitfalls: [
          "Reduce `2^p - 2` modulo M before multiplying; with p = 60 the raw value is 10^18.",
          "Do not reduce the exponent modulo M — exponents follow Fermat's rule (mod M - 1), not the value's modulus. The repeated-squaring loop sidesteps it entirely.",
          "p = 1 has no pairs: the loop runs zero times and the answer is 1.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "2", expectedOutput: "6" },
        { input: "3", expectedOutput: "1512" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const p = ri(rng, 1, 60);
        return { input: String(p), expectedOutput: String(ref(p)) };
      },
      solutions: {
        python: code`
          def minNonZeroProduct(p: int) -> int:
              MOD = 10 ** 9 + 7
              top = (1 << p) - 1
              return top % MOD * pow(top - 1, (1 << (p - 1)) - 1, MOD) % MOD
        `,
        javascript: code`
          var minNonZeroProduct = function(p) {
              var MOD = 1000000007;
              var mulMod = function(a, b) {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var pow2 = 1;
              for (var i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              var top = (pow2 - 1 + MOD) % MOD;
              var cur = (pow2 - 2 + MOD) % MOD;
              var result = 1;
              for (i = 0; i < p - 1; i++) {
                  result = mulMod(result, cur);
                  cur = mulMod(cur, cur);
              }
              return mulMod(top, result);
          };
        `,
        typescript: code`
          function minNonZeroProduct(p: number): number {
              var MOD = 1000000007;
              var mulMod = function(a: number, b: number): number {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var pow2 = 1;
              for (var i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              var top = (pow2 - 1 + MOD) % MOD;
              var cur = (pow2 - 2 + MOD) % MOD;
              var result = 1;
              for (i = 0; i < p - 1; i++) {
                  result = mulMod(result, cur);
                  cur = mulMod(cur, cur);
              }
              return mulMod(top, result);
          }
        `,
        java: code`
          public static int minNonZeroProduct(int p) {
              final long MOD = 1000000007L;
              long pow2 = 1;
              for (int i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              long top = (pow2 - 1 + MOD) % MOD;
              long cur = (pow2 - 2 + MOD) % MOD;
              long result = 1;
              for (int i = 0; i < p - 1; i++) {
                  result = result * cur % MOD;
                  cur = cur * cur % MOD;
              }
              return (int) (top * result % MOD);
          }
        `,
        cpp: code`
          int minNonZeroProduct(int p) {
              const long long MOD = 1000000007LL;
              long long pow2 = 1;
              for (int i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              long long top = (pow2 - 1 + MOD) % MOD;
              long long cur = (pow2 - 2 + MOD) % MOD;
              long long result = 1;
              for (int i = 0; i < p - 1; i++) {
                  result = result * cur % MOD;
                  cur = cur * cur % MOD;
              }
              return (int) (top * result % MOD);
          }
        `,
        c: code`
          int minNonZeroProduct(int p) {
              const long long MOD = 1000000007LL;
              long long pow2 = 1;
              for (int i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              long long top = (pow2 - 1 + MOD) % MOD;
              long long cur = (pow2 - 2 + MOD) % MOD;
              long long result = 1;
              for (int i = 0; i < p - 1; i++) {
                  result = result * cur % MOD;
                  cur = cur * cur % MOD;
              }
              return (int) (top * result % MOD);
          }
        `,
        csharp: code`
          public static int MinNonZeroProduct(int p)
          {
              const long MOD = 1000000007L;
              long pow2 = 1;
              for (int i = 0; i < p; i++) pow2 = pow2 * 2 % MOD;
              long top = (pow2 - 1 + MOD) % MOD;
              long cur = (pow2 - 2 + MOD) % MOD;
              long result = 1;
              for (int i = 0; i < p - 1; i++)
              {
                  result = result * cur % MOD;
                  cur = cur * cur % MOD;
              }
              return (int) (top * result % MOD);
          }
        `,
        go: code`
          func minNonZeroProduct(p int) int {
              const MOD = 1000000007
              pow2 := 1
              for i := 0; i < p; i++ {
                  pow2 = pow2 * 2 % MOD
              }
              top := (pow2 - 1 + MOD) % MOD
              cur := (pow2 - 2 + MOD) % MOD
              result := 1
              for i := 0; i < p-1; i++ {
                  result = result * cur % MOD
                  cur = cur * cur % MOD
              }
              return top * result % MOD
          }
        `,
        kotlin: code`
          fun minNonZeroProduct(p: Int): Int {
              val MOD = 1_000_000_007L
              var pow2 = 1L
              for (i in 0 until p) pow2 = pow2 * 2 % MOD
              val top = (pow2 - 1 + MOD) % MOD
              var cur = (pow2 - 2 + MOD) % MOD
              var result = 1L
              for (i in 0 until p - 1) {
                  result = result * cur % MOD
                  cur = cur * cur % MOD
              }
              return (top * result % MOD).toInt()
          }
        `,
        swift: code`
          func minNonZeroProduct(_ p: Int) -> Int {
              let MOD = 1_000_000_007
              var pow2 = 1
              for _ in 0..<p { pow2 = pow2 * 2 % MOD }
              let top = (pow2 - 1 + MOD) % MOD
              var cur = (pow2 - 2 + MOD) % MOD
              var result = 1
              var i = 0
              while i < p - 1 {
                  result = result * cur % MOD
                  cur = cur * cur % MOD
                  i += 1
              }
              return top * result % MOD
          }
        `,
        rust: code`
          fn minNonZeroProduct(p: i32) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let mut pow2: i64 = 1;
              for _ in 0..p {
                  pow2 = pow2 * 2 % MOD;
              }
              let top = (pow2 - 1 + MOD) % MOD;
              let mut cur = (pow2 - 2 + MOD) % MOD;
              let mut result: i64 = 1;
              for _ in 0..(p - 1) {
                  result = result * cur % MOD;
                  cur = cur * cur % MOD;
              }
              (top * result % MOD) as i32
          }
        `,
        php: code`
          function minNonZeroProduct($p) {
              $MOD = 1000000007;
              $pow2 = 1;
              for ($i = 0; $i < $p; $i++) $pow2 = $pow2 * 2 % $MOD;
              $top = ($pow2 - 1 + $MOD) % $MOD;
              $cur = ($pow2 - 2 + $MOD) % $MOD;
              $result = 1;
              for ($i = 0; $i < $p - 1; $i++) {
                  $result = $result * $cur % $MOD;
                  $cur = $cur * $cur % $MOD;
              }
              return $top * $result % $MOD;
          }
        `,
        ruby: code`
          def minNonZeroProduct(p)
            m = 1_000_000_007
            top = (1 << p) - 1
            top % m * (top - 1).pow((1 << (p - 1)) - 1, m) % m
          end
        `,
      },
    };
  })(),

  // ── Sum of Number and Its Reverse (LC 2443) ──────────────────────
  (() => {
    const rev = (k: number) => Number(String(k).split("").reverse().join(""));
    const ref = (num: number) => {
      for (let k = 0; k <= num; k++) if (k + rev(k) === num) return true;
      return false;
    };
    return {
      slug: "sum-of-number-and-its-reverse",
      title: "Sum of Number and Its Reverse",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "sumOfNumberAndReverse", params: [{ name: "num", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given a non-negative integer `num`, return `true` if it can be written as `k + reverse(k)` for some non-negative integer `k`.\n\n`reverse(k)` is the number formed by writing the digits of `k` backwards; leading zeros of the result are dropped, so `reverse(120) = 21`.",
        [
          { in: "num = 121", out: "true", note: "110 + 011 = 110 + 11 = 121 (29 + 92 works too)." },
          { in: "num = 13", out: "false" },
          { in: "num = 0", out: "true", note: "0 + 0 = 0." },
        ],
        ["0 <= num <= 10^5"]),
      hints: [
        "`num` is at most 10^5, so you can simply try every `k` from 0 to `num`.",
        "Reversing a number is a digit loop: `r = r * 10 + k % 10`, then drop the last digit of `k`.",
        "You can start at `num / 2`: if a solution `k` is smaller, then `reverse(k)` is larger and is itself a solution.",
      ],
      editorial: explain({
        idea: "The range is small enough to try every candidate `k`, and half of the range can be skipped because a small solution always has a large partner.",
        steps: [
          "For `k` from `floor(num / 2)` up to `num`, compute `reverse(k)` with a digit loop.",
          "If `k + reverse(k) == num`, return `true`.",
          "If no `k` works, return `false`.",
        ],
        why: "`k + reverse(k)` can only equal `num` for `k <= num`, so the full search `0..num` is exhaustive. For the shortcut: if a solution has `k < num / 2`, then `reverse(k) > num / 2 > k`. A number with trailing zeros reverses to a shorter, smaller number, so `k` has none — which means `reverse(reverse(k)) = k`, and `m = reverse(k)` is a solution with `m >= num / 2`. Hence some solution always lies in the upper half.",
        time: "O(num · log num)",
        space: "O(1)",
        pitfalls: [
          "Reversal drops leading zeros of the result (`reverse(10) = 1`), so `10 + 1 = 11` counts.",
          "`num = 0` is true (`k = 0`); make sure the loop includes it.",
          "Do not try to reverse `num` itself — the question is about the summand `k`.",
        ],
      }),
      examples: [
        { input: "121", expectedOutput: "true" },
        { input: "13", expectedOutput: "false" },
        { input: "0", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let num: number;
        if (roll < 0.004) num = ri(rng, 0, 100000);
        else if (roll < 0.008) {
          const k = ri(rng, 10000, 50000);
          num = k + rev(k);
          if (num > 100000) num = ri(rng, 90000, 100000);
        } else if (roll < 0.26) {
          const k = ri(rng, 0, 1000);
          num = k + rev(k);
        } else if (roll < 0.36) num = ri(rng, 0, 2000);
        else num = ri(rng, 0, 200);
        return { input: String(num), expectedOutput: bool(ref(num)) };
      },
      solutions: {
        python: code`
          def sumOfNumberAndReverse(num: int) -> bool:
              for k in range(num // 2, num + 1):
                  if k + int(str(k)[::-1]) == num:
                      return True
              return False
        `,
        javascript: code`
          var sumOfNumberAndReverse = function(num) {
              for (var k = Math.floor(num / 2); k <= num; k++) {
                  var r = 0, t = k;
                  while (t > 0) {
                      r = r * 10 + t % 10;
                      t = Math.floor(t / 10);
                  }
                  if (k + r === num) return true;
              }
              return false;
          };
        `,
        typescript: code`
          function sumOfNumberAndReverse(num: number): boolean {
              for (var k = Math.floor(num / 2); k <= num; k++) {
                  var r = 0, t = k;
                  while (t > 0) {
                      r = r * 10 + t % 10;
                      t = Math.floor(t / 10);
                  }
                  if (k + r === num) return true;
              }
              return false;
          }
        `,
        java: code`
          public static boolean sumOfNumberAndReverse(int num) {
              for (int k = num / 2; k <= num; k++) {
                  int r = 0, t = k;
                  while (t > 0) {
                      r = r * 10 + t % 10;
                      t /= 10;
                  }
                  if (k + r == num) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool sumOfNumberAndReverse(int num) {
              for (int k = num / 2; k <= num; k++) {
                  int r = 0, t = k;
                  while (t > 0) {
                      r = r * 10 + t % 10;
                      t /= 10;
                  }
                  if (k + r == num) return true;
              }
              return false;
          }
        `,
        c: code`
          bool sumOfNumberAndReverse(int num) {
              for (int k = num / 2; k <= num; k++) {
                  int r = 0, t = k;
                  while (t > 0) {
                      r = r * 10 + t % 10;
                      t /= 10;
                  }
                  if (k + r == num) return true;
              }
              return false;
          }
        `,
        csharp: code`
          public static bool SumOfNumberAndReverse(int num)
          {
              for (int k = num / 2; k <= num; k++)
              {
                  int r = 0, t = k;
                  while (t > 0)
                  {
                      r = r * 10 + t % 10;
                      t /= 10;
                  }
                  if (k + r == num) return true;
              }
              return false;
          }
        `,
        go: code`
          func sumOfNumberAndReverse(num int) bool {
              for k := num / 2; k <= num; k++ {
                  r, t := 0, k
                  for t > 0 {
                      r = r*10 + t%10
                      t /= 10
                  }
                  if k+r == num {
                      return true
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun sumOfNumberAndReverse(num: Int): Boolean {
              for (k in num / 2..num) {
                  var r = 0
                  var t = k
                  while (t > 0) {
                      r = r * 10 + t % 10
                      t /= 10
                  }
                  if (k + r == num) return true
              }
              return false
          }
        `,
        swift: code`
          func sumOfNumberAndReverse(_ num: Int) -> Bool {
              for k in (num / 2)...num {
                  var r = 0, t = k
                  while t > 0 {
                      r = r * 10 + t % 10
                      t /= 10
                  }
                  if k + r == num { return true }
              }
              return false
          }
        `,
        rust: code`
          fn sumOfNumberAndReverse(num: i32) -> bool {
              for k in (num / 2)..=num {
                  let mut r = 0;
                  let mut t = k;
                  while t > 0 {
                      r = r * 10 + t % 10;
                      t /= 10;
                  }
                  if k + r == num {
                      return true;
                  }
              }
              false
          }
        `,
        php: code`
          function sumOfNumberAndReverse($num) {
              for ($k = intdiv($num, 2); $k <= $num; $k++) {
                  if ($k + intval(strrev((string) $k)) == $num) return true;
              }
              return false;
          }
        `,
        ruby: code`
          def sumOfNumberAndReverse(num)
            (num / 2..num).any? { |k| k + k.to_s.reverse.to_i == num }
          end
        `,
      },
    };
  })(),

  // ── Distinct Prime Factors of Product of Array (LC 2521) ─────────
  (() => {
    const isPrime = (p: number) => { if (p < 2) return false; for (let d = 2; d * d <= p; d++) if (p % d === 0) return false; return true; };
    const PRIMES = Array.from({ length: 1001 }, (_, i) => i).filter(isPrime);
    const ref = (nums: number[]) => PRIMES.filter((p) => nums.some((v) => v % p === 0)).length;
    return {
      slug: "distinct-prime-factors-of-product-of-array",
      title: "Distinct Prime Factors of Product of Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Number Theory", "Amazon", "TCS"],
      signature: { funcName: "distinctPrimeFactors", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `nums`, return the number of **distinct prime factors** of the product of all its elements.\n\nA prime factor of `x` is a prime number that divides `x`. The product itself can be astronomically large — you never need to compute it.",
        [
          { in: "nums = [6,10,15]", out: "3", note: "The product 900 = 2² · 3² · 5² has the prime factors 2, 3 and 5." },
          { in: "nums = [16,32,8]", out: "1", note: "Every element is a power of 2." },
          { in: "nums = [7,11,77,49]", out: "2" },
        ],
        ["1 <= nums.length <= 10^4", "2 <= nums[i] <= 1000"]),
      hints: [
        "A prime divides a product exactly when it divides at least one of the factors.",
        "So the answer is the number of distinct primes that divide at least one element.",
        "Factor each element by trial division up to its square root and collect the primes in a set.",
      ],
      editorial: explain({
        idea: "A prime divides the product if and only if it divides one of the elements (Euclid's lemma), so collect the prime factors of every element in a set.",
        steps: [
          "For each element `v`, try divisors `d = 2, 3, …` while `d·d <= v`.",
          "When `d` divides `v`, record `d` and divide it out completely.",
          "If `v > 1` remains afterwards, it is a prime factor too; record it.",
          "Return the number of distinct primes recorded.",
        ],
        why: "Euclid's lemma says a prime dividing `a·b` divides `a` or `b`, so the primes of the product are exactly the union of the elements' primes. In trial division, dividing each found factor out completely guarantees every later divisor that succeeds is prime, and whatever is left above 1 after `d·d > v` has no divisor up to its square root, so it is prime.",
        time: "O(n · √V) with V = 1000",
        space: "O(number of primes ≤ V)",
        pitfalls: [
          "Never multiply the elements together — 10^4 numbers up to 1000 overflow anything.",
          "Do not forget the leftover factor greater than √v (for example 997, or the 7 in 14).",
          "Count primes, not prime powers: 8 contributes only 2.",
        ],
      }),
      examples: [
        { input: "[6,10,15]", expectedOutput: "3" },
        { input: "[16,32,8]", expectedOutput: "1" },
        { input: "[7,11,77,49]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const kind = ri(rng, 0, 3);
        const nums = Array.from({ length: n }, () => {
          if (kind === 0) return ri(rng, 2, 12);
          if (kind === 1) { const p = pick(rng, [2, 3, 5, 7, 31, 997]); let v = p; while (v * p <= 1000 && rng() < 0.5) v *= p; return v; }
          if (kind === 2) return pick(rng, PRIMES.filter((p) => p > 500));
          return ri(rng, 2, 1000);
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def distinctPrimeFactors(nums: List[int]) -> int:
              primes = set()
              for x in nums:
                  v = x
                  d = 2
                  while d * d <= v:
                      if v % d == 0:
                          primes.add(d)
                          while v % d == 0:
                              v //= d
                      d += 1
                  if v > 1:
                      primes.add(v)
              return len(primes)
        `,
        javascript: code`
          var distinctPrimeFactors = function(nums) {
              var primes = new Set();
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  for (var d = 2; d * d <= v; d++) {
                      if (v % d === 0) {
                          primes.add(d);
                          while (v % d === 0) v /= d;
                      }
                  }
                  if (v > 1) primes.add(v);
              }
              return primes.size;
          };
        `,
        typescript: code`
          function distinctPrimeFactors(nums: number[]): number {
              var seen: boolean[] = [];
              for (var z = 0; z <= 1000; z++) seen.push(false);
              var count = 0;
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  for (var d = 2; d * d <= v; d++) {
                      if (v % d === 0) {
                          if (!seen[d]) { seen[d] = true; count++; }
                          while (v % d === 0) v /= d;
                      }
                  }
                  if (v > 1 && !seen[v]) { seen[v] = true; count++; }
              }
              return count;
          }
        `,
        java: code`
          public static int distinctPrimeFactors(int[] nums) {
              boolean[] seen = new boolean[1001];
              int count = 0;
              for (int x : nums) {
                  int v = x;
                  for (int d = 2; d * d <= v; d++) {
                      if (v % d == 0) {
                          if (!seen[d]) { seen[d] = true; count++; }
                          while (v % d == 0) v /= d;
                      }
                  }
                  if (v > 1 && !seen[v]) { seen[v] = true; count++; }
              }
              return count;
          }
        `,
        cpp: code`
          int distinctPrimeFactors(vector<int>& nums) {
              set<int> primes;
              for (int x : nums) {
                  int v = x;
                  for (int d = 2; d * d <= v; d++) {
                      if (v % d == 0) {
                          primes.insert(d);
                          while (v % d == 0) v /= d;
                      }
                  }
                  if (v > 1) primes.insert(v);
              }
              return primes.size();
          }
        `,
        c: code`
          int distinctPrimeFactors(int* nums, int numsSize) {
              bool seen[1001];
              memset(seen, 0, sizeof(seen));
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  int v = nums[i];
                  for (int d = 2; d * d <= v; d++) {
                      if (v % d == 0) {
                          if (!seen[d]) { seen[d] = true; count++; }
                          while (v % d == 0) v /= d;
                      }
                  }
                  if (v > 1 && !seen[v]) { seen[v] = true; count++; }
              }
              return count;
          }
        `,
        csharp: code`
          public static int DistinctPrimeFactors(int[] nums)
          {
              var primes = new HashSet<int>();
              foreach (int x in nums)
              {
                  int v = x;
                  for (int d = 2; d * d <= v; d++)
                  {
                      if (v % d == 0)
                      {
                          primes.Add(d);
                          while (v % d == 0) v /= d;
                      }
                  }
                  if (v > 1) primes.Add(v);
              }
              return primes.Count;
          }
        `,
        go: code`
          func distinctPrimeFactors(nums []int) int {
              primes := map[int]bool{}
              for _, x := range nums {
                  v := x
                  for d := 2; d*d <= v; d++ {
                      if v%d == 0 {
                          primes[d] = true
                          for v%d == 0 {
                              v /= d
                          }
                      }
                  }
                  if v > 1 {
                      primes[v] = true
                  }
              }
              return len(primes)
          }
        `,
        kotlin: code`
          fun distinctPrimeFactors(nums: IntArray): Int {
              val primes = HashSet<Int>()
              for (x in nums) {
                  var v = x
                  var d = 2
                  while (d * d <= v) {
                      if (v % d == 0) {
                          primes.add(d)
                          while (v % d == 0) v /= d
                      }
                      d++
                  }
                  if (v > 1) primes.add(v)
              }
              return primes.size
          }
        `,
        swift: code`
          func distinctPrimeFactors(_ nums: [Int]) -> Int {
              var primes = Set<Int>()
              for x in nums {
                  var v = x
                  var d = 2
                  while d * d <= v {
                      if v % d == 0 {
                          primes.insert(d)
                          while v % d == 0 { v /= d }
                      }
                      d += 1
                  }
                  if v > 1 { primes.insert(v) }
              }
              return primes.count
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn distinctPrimeFactors(nums: Vec<i32>) -> i32 {
              let mut primes: HashSet<i32> = HashSet::new();
              for &x in nums.iter() {
                  let mut v = x;
                  let mut d = 2;
                  while d * d <= v {
                      if v % d == 0 {
                          primes.insert(d);
                          while v % d == 0 {
                              v /= d;
                          }
                      }
                      d += 1;
                  }
                  if v > 1 {
                      primes.insert(v);
                  }
              }
              primes.len() as i32
          }
        `,
        php: code`
          function distinctPrimeFactors($nums) {
              $primes = [];
              foreach ($nums as $x) {
                  $v = $x;
                  for ($d = 2; $d * $d <= $v; $d++) {
                      if ($v % $d == 0) {
                          $primes[$d] = true;
                          while ($v % $d == 0) $v = intdiv($v, $d);
                      }
                  }
                  if ($v > 1) $primes[$v] = true;
              }
              return count($primes);
          }
        `,
        ruby: code`
          def distinctPrimeFactors(nums)
            primes = {}
            nums.each do |x|
              v = x
              d = 2
              while d * d <= v
                if v % d == 0
                  primes[d] = true
                  v /= d while v % d == 0
                end
                d += 1
              end
              primes[v] = true if v > 1
            end
            primes.size
          end
        `,
      },
    };
  })(),

  // ── Closest Prime Numbers in Range (LC 2523) ─────────────────────
  (() => {
    let sieve: Uint8Array | null = null;
    const composite = () => {
      if (!sieve) {
        sieve = new Uint8Array(1000001);
        sieve[0] = 1; sieve[1] = 1;
        for (let i = 2; i * i <= 1000000; i++) if (!sieve[i]) for (let j = i * i; j <= 1000000; j += i) sieve[j] = 1;
      }
      return sieve;
    };
    const ref = (left: number, right: number) => {
      const s = composite();
      const ps: number[] = [];
      for (let x = left; x <= right; x++) if (!s[x]) ps.push(x);
      let best = [-1, -1];
      for (let i = 1; i < ps.length; i++) {
        if (best[0] === -1 || ps[i] - ps[i - 1] < best[1] - best[0]) best = [ps[i - 1], ps[i]];
      }
      return best;
    };
    return {
      slug: "closest-prime-numbers-in-range",
      title: "Closest Prime Numbers in Range",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "closestPrimes",
        params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Given two integers `left` and `right`, find two primes `num1 < num2` with `left <= num1 < num2 <= right` whose difference `num2 - num1` is as **small** as possible.\n\nReturn `[num1, num2]`. If several pairs share the minimum difference, return the one with the smallest `num1`. If the range holds fewer than two primes, return `[-1, -1]`.",
        [
          { in: "left = 30, right = 45", out: "[41,43]", note: "The primes are 31, 37, 41, 43; the gaps are 6, 4 and 2." },
          { in: "left = 24, right = 28", out: "[-1,-1]", note: "There is no prime in this range." },
          { in: "left = 1, right = 3", out: "[2,3]" },
        ],
        ["1 <= left <= right <= 10^6"]),
      hints: [
        "Only consecutive primes in the range can form the closest pair.",
        "Walk through the range, remember the previous prime, and keep the smallest gap seen so far — the first one wins ties automatically.",
        "No two primes differ by less than 2 except 2 and 3, so as soon as you see a gap of 2 (or 1) nothing later can beat it: stop scanning.",
      ],
      editorial: explain({
        idea: "Scan the range in increasing order, keeping the previous prime and the best adjacent pair. A gap of at most 2 is unbeatable, and twin primes are common, so the scan usually stops early.",
        steps: [
          "For `x` from `left` to `right`, test whether `x` is prime by trial division up to `√x` (odd divisors only after 2).",
          "When `x` is prime and a previous prime `prev` exists, replace the best pair with `[prev, x]` if `x - prev` is strictly smaller than the best gap.",
          "If that gap is at most 2, stop — no later pair can be strictly closer.",
          "Set `prev = x` and continue. Return the best pair, or `[-1, -1]` if none was found.",
        ],
        why: "Any pair of primes that is not consecutive has a prime between them, so it is at least as wide as a consecutive pair inside it; checking consecutive pairs is enough. Replacing only on a strictly smaller gap keeps the earliest pair among ties. A gap of 1 occurs only for (2, 3) and every other pair of primes differs by at least 2, so once a gap of 2 is recorded, later pairs can at best tie — and ties keep the earlier pair — which makes the early exit safe.",
        time: "O((right - left) · √right) in the worst case, far less in practice",
        space: "O(1)",
        pitfalls: [
          "1 is not prime; `left = 1` must not produce the pair (1, 2).",
          "Use a strict `<` when comparing gaps, or a later pair will steal a tie.",
          "A sieve up to `right` also works (10^6 entries), but rebuild cost matters if it is called many times — trial division with the early exit avoids it.",
        ],
      }),
      examples: [
        { input: "30\n45", expectedOutput: "[41,43]" },
        { input: "24\n28", expectedOutput: "[-1,-1]" },
        { input: "1\n3", expectedOutput: "[2,3]" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let left: number, right: number;
        if (roll < 0.45) { right = ri(rng, 1, 100); left = ri(rng, 1, right); }
        else if (roll < 0.75) { right = ri(rng, 2, 10000); left = Math.max(1, right - ri(rng, 0, 2000)); }
        else if (roll < 0.95) { right = ri(rng, 900000, 1000000); left = Math.max(1, right - ri(rng, 0, 80)); }
        else { right = ri(rng, 1, 1000000); left = Math.max(1, right - ri(rng, 0, 3000)); }
        return { input: left + "\n" + right, expectedOutput: fmtIntArr(ref(left, right)) };
      },
      solutions: {
        python: code`
          from typing import List

          def closestPrimes(left: int, right: int) -> List[int]:
              def is_prime(x):
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

              prev = -1
              best = [-1, -1]
              for x in range(left, right + 1):
                  if is_prime(x):
                      if prev != -1 and (best[0] == -1 or x - prev < best[1] - best[0]):
                          best = [prev, x]
                          if x - prev <= 2:
                              break
                      prev = x
              return best
        `,
        javascript: code`
          var closestPrimes = function(left, right) {
              var isPrime = function(x) {
                  if (x < 2) return false;
                  if (x % 2 === 0) return x === 2;
                  for (var d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
                  return true;
              };
              var prev = -1, best = [-1, -1];
              for (var x = left; x <= right; x++) {
                  if (!isPrime(x)) continue;
                  if (prev !== -1 && (best[0] === -1 || x - prev < best[1] - best[0])) {
                      best = [prev, x];
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              return best;
          };
        `,
        typescript: code`
          function closestPrimes(left: number, right: number): number[] {
              var isPrime = function(x: number): boolean {
                  if (x < 2) return false;
                  if (x % 2 === 0) return x === 2;
                  for (var d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
                  return true;
              };
              var prev = -1;
              var best: number[] = [-1, -1];
              for (var x = left; x <= right; x++) {
                  if (!isPrime(x)) continue;
                  if (prev !== -1 && (best[0] === -1 || x - prev < best[1] - best[0])) {
                      best = [prev, x];
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              return best;
          }
        `,
        java: code`
          public static int[] closestPrimes(int left, int right) {
              int prev = -1;
              int[] best = { -1, -1 };
              for (int x = left; x <= right; x++) {
                  if (!closeIsPrime(x)) continue;
                  if (prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0])) {
                      best = new int[] { prev, x };
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              return best;
          }

          private static boolean closeIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }
        `,
        cpp: code`
          bool closeIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          vector<int> closestPrimes(int left, int right) {
              int prev = -1;
              vector<int> best = { -1, -1 };
              for (int x = left; x <= right; x++) {
                  if (!closeIsPrime(x)) continue;
                  if (prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0])) {
                      best = { prev, x };
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              return best;
          }
        `,
        c: code`
          static bool closeIsPrime(int x) {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }

          int* closestPrimes(int left, int right, int* returnSize) {
              int* best = (int*) malloc(sizeof(int) * 2);
              best[0] = -1;
              best[1] = -1;
              int prev = -1;
              for (int x = left; x <= right; x++) {
                  if (!closeIsPrime(x)) continue;
                  if (prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0])) {
                      best[0] = prev;
                      best[1] = x;
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              *returnSize = 2;
              return best;
          }
        `,
        csharp: code`
          public static int[] ClosestPrimes(int left, int right)
          {
              int prev = -1;
              int[] best = { -1, -1 };
              for (int x = left; x <= right; x++)
              {
                  if (!CloseIsPrime(x)) continue;
                  if (prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0]))
                  {
                      best = new int[] { prev, x };
                      if (x - prev <= 2) break;
                  }
                  prev = x;
              }
              return best;
          }

          private static bool CloseIsPrime(int x)
          {
              if (x < 2) return false;
              if (x % 2 == 0) return x == 2;
              for (int d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
              return true;
          }
        `,
        go: code`
          func closestPrimes(left int, right int) []int {
              isPrime := func(x int) bool {
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
              prev := -1
              best := []int{-1, -1}
              for x := left; x <= right; x++ {
                  if !isPrime(x) {
                      continue
                  }
                  if prev != -1 && (best[0] == -1 || x-prev < best[1]-best[0]) {
                      best = []int{prev, x}
                      if x-prev <= 2 {
                          break
                      }
                  }
                  prev = x
              }
              return best
          }
        `,
        kotlin: code`
          fun closestPrimes(left: Int, right: Int): IntArray {
              fun isPrime(x: Int): Boolean {
                  if (x < 2) return false
                  if (x % 2 == 0) return x == 2
                  var d = 3
                  while (d * d <= x) {
                      if (x % d == 0) return false
                      d += 2
                  }
                  return true
              }
              var prev = -1
              var best = intArrayOf(-1, -1)
              for (x in left..right) {
                  if (!isPrime(x)) continue
                  if (prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0])) {
                      best = intArrayOf(prev, x)
                      if (x - prev <= 2) break
                  }
                  prev = x
              }
              return best
          }
        `,
        swift: code`
          func closestPrimes(_ left: Int, _ right: Int) -> [Int] {
              func isPrime(_ x: Int) -> Bool {
                  if x < 2 { return false }
                  if x % 2 == 0 { return x == 2 }
                  var d = 3
                  while d * d <= x {
                      if x % d == 0 { return false }
                      d += 2
                  }
                  return true
              }
              var prev = -1
              var best = [-1, -1]
              for x in left...right {
                  if !isPrime(x) { continue }
                  if prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0]) {
                      best = [prev, x]
                      if x - prev <= 2 { break }
                  }
                  prev = x
              }
              return best
          }
        `,
        rust: code`
          fn close_is_prime(x: i32) -> bool {
              if x < 2 {
                  return false;
              }
              if x % 2 == 0 {
                  return x == 2;
              }
              let mut d = 3;
              while d * d <= x {
                  if x % d == 0 {
                      return false;
                  }
                  d += 2;
              }
              true
          }

          fn closestPrimes(left: i32, right: i32) -> Vec<i32> {
              let mut prev = -1;
              let mut best = vec![-1, -1];
              for x in left..=right {
                  if !close_is_prime(x) {
                      continue;
                  }
                  if prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0]) {
                      best = vec![prev, x];
                      if x - prev <= 2 {
                          break;
                      }
                  }
                  prev = x;
              }
              best
          }
        `,
        php: code`
          function closestPrimes($left, $right) {
              $isPrime = function($x) {
                  if ($x < 2) return false;
                  if ($x % 2 == 0) return $x == 2;
                  for ($d = 3; $d * $d <= $x; $d += 2) if ($x % $d == 0) return false;
                  return true;
              };
              $prev = -1;
              $best = [-1, -1];
              for ($x = $left; $x <= $right; $x++) {
                  if (!$isPrime($x)) continue;
                  if ($prev != -1 && ($best[0] == -1 || $x - $prev < $best[1] - $best[0])) {
                      $best = [$prev, $x];
                      if ($x - $prev <= 2) break;
                  }
                  $prev = $x;
              }
              return $best;
          }
        `,
        ruby: code`
          def closestPrimes(left, right)
            is_prime = lambda do |x|
              return false if x < 2
              return x == 2 if x.even?
              d = 3
              while d * d <= x
                return false if x % d == 0
                d += 2
              end
              true
            end
            prev = -1
            best = [-1, -1]
            (left..right).each do |x|
              next unless is_prime.call(x)
              if prev != -1 && (best[0] == -1 || x - prev < best[1] - best[0])
                best = [prev, x]
                break if x - prev <= 2
              end
              prev = x
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Collisions of Monkeys on a Polygon (LC 2550) ───────────
  (() => {
    const M = 1000000007n;
    const powBig = (b: bigint, e: bigint) => {
      let r = 1n; b %= M;
      while (e > 0n) { if (e & 1n) r = (r * b) % M; b = (b * b) % M; e >>= 1n; }
      return r;
    };
    const brute = (n: number) => {
      // Enumerate every choice of directions and look for a collision.
      let count = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        const dest = Array.from({ length: n }, (_, i) => ((mask >> i) & 1 ? (i + 1) % n : (i + n - 1) % n));
        let hit = new Set(dest).size < n;
        for (let i = 0; i < n && !hit; i++) if (dest[dest[i]] === i) hit = true;
        if (hit) count++;
      }
      return count;
    };
    const ref = (n: number) => (n <= 12 ? brute(n) % 1000000007 : Number((powBig(2n, BigInt(n)) - 2n + M) % M));
    return {
      slug: "count-collisions-of-monkeys-on-a-polygon",
      title: "Count Collisions of Monkeys on a Polygon",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Recursion", "Google", "Amazon"],
      signature: { funcName: "monkeyMove", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A regular polygon has `n` vertices numbered `0` to `n - 1` clockwise, and one monkey sits on every vertex. At the same moment every monkey moves to one of its two neighbouring vertices — clockwise or anticlockwise.\n\nA **collision** happens if, after the move, two monkeys share a vertex, or if two monkeys cross each other on an edge.\n\nReturn the number of ways the monkeys can move so that **at least one** collision happens, **modulo** `10^9 + 7`.",
        [
          { in: "n = 3", out: "6", note: "There are 2³ = 8 ways to move; only 'all clockwise' and 'all anticlockwise' avoid a collision." },
          { in: "n = 4", out: "14" },
          { in: "n = 1000000000", out: "140624999" },
        ],
        ["3 <= n <= 10^9"]),
      hints: [
        "Count the complement: in how many ways can the monkeys move with no collision at all?",
        "If one monkey goes clockwise and its clockwise neighbour goes anticlockwise, they cross on the edge between them. What does that force around the polygon?",
        "Only 'everyone clockwise' and 'everyone anticlockwise' are collision-free, so the answer is `2^n - 2` — compute the power by repeated squaring.",
      ],
      editorial: explain({
        idea: "Every monkey has two choices, `2^n` ways in total, and exactly two of them — all clockwise or all anticlockwise — avoid every collision. The answer is `(2^n - 2) mod (10^9 + 7)`.",
        steps: [
          "Compute `2^n mod M` with binary exponentiation (`M = 10^9 + 7`).",
          "Subtract 2 and add `M` before reducing again, so the result never goes negative.",
        ],
        why: "If all monkeys move the same way, the configuration just rotates: no vertex is shared and no two monkeys use the same edge. Otherwise, going around the polygon there is some monkey moving clockwise whose clockwise neighbour moves anticlockwise; they swap along their shared edge and collide. So the collision-free moves are exactly the two uniform ones, and all other `2^n - 2` moves contain a collision.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "`2^n mod M` can be 0 or 1, so `2^n mod M - 2` can be negative — add `M` before taking the modulus again.",
          "n reaches 10^9: a loop that doubles n times is too slow; use repeated squaring.",
          "Multiply two residues in 64 bits (or split the multiplication in JavaScript).",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "6" },
        { input: "4", expectedOutput: "14" },
        { input: "1000000000", expectedOutput: "140624999" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const n = roll < 0.25 ? ri(rng, 3, 12) : roll < 0.5 ? ri(rng, 3, 1000) : roll < 0.97 ? ri(rng, 3, 1000000000) : 1000000000;
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def monkeyMove(n: int) -> int:
              MOD = 10 ** 9 + 7
              return (pow(2, n, MOD) - 2) % MOD
        `,
        javascript: code`
          var monkeyMove = function(n) {
              var MOD = 1000000007;
              var mulMod = function(a, b) {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var r = 1, b = 2, e = n;
              while (e > 0) {
                  if (e % 2 === 1) r = mulMod(r, b);
                  b = mulMod(b, b);
                  e = Math.floor(e / 2);
              }
              return (r - 2 + MOD) % MOD;
          };
        `,
        typescript: code`
          function monkeyMove(n: number): number {
              var MOD = 1000000007;
              var mulMod = function(a: number, b: number): number {
                  var hi = Math.floor(b / 65536), lo = b % 65536;
                  return ((a * hi) % MOD * 65536 + a * lo) % MOD;
              };
              var r = 1, b = 2, e = n;
              while (e > 0) {
                  if (e % 2 === 1) r = mulMod(r, b);
                  b = mulMod(b, b);
                  e = Math.floor(e / 2);
              }
              return (r - 2 + MOD) % MOD;
          }
        `,
        java: code`
          public static int monkeyMove(int n) {
              final long MOD = 1000000007L;
              long r = 1, b = 2;
              int e = n;
              while (e > 0) {
                  if ((e & 1) == 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return (int) ((r - 2 + MOD) % MOD);
          }
        `,
        cpp: code`
          int monkeyMove(int n) {
              const long long MOD = 1000000007LL;
              long long r = 1, b = 2;
              int e = n;
              while (e > 0) {
                  if (e & 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return (int) ((r - 2 + MOD) % MOD);
          }
        `,
        c: code`
          int monkeyMove(int n) {
              const long long MOD = 1000000007LL;
              long long r = 1, b = 2;
              int e = n;
              while (e > 0) {
                  if (e & 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return (int) ((r - 2 + MOD) % MOD);
          }
        `,
        csharp: code`
          public static int MonkeyMove(int n)
          {
              const long MOD = 1000000007L;
              long r = 1, b = 2;
              int e = n;
              while (e > 0)
              {
                  if ((e & 1) == 1) r = r * b % MOD;
                  b = b * b % MOD;
                  e >>= 1;
              }
              return (int) ((r - 2 + MOD) % MOD);
          }
        `,
        go: code`
          func monkeyMove(n int) int {
              const MOD = 1000000007
              r, b, e := 1, 2, n
              for e > 0 {
                  if e&1 == 1 {
                      r = r * b % MOD
                  }
                  b = b * b % MOD
                  e >>= 1
              }
              return (r - 2 + MOD) % MOD
          }
        `,
        kotlin: code`
          fun monkeyMove(n: Int): Int {
              val MOD = 1_000_000_007L
              var r = 1L
              var b = 2L
              var e = n
              while (e > 0) {
                  if ((e and 1) == 1) r = r * b % MOD
                  b = b * b % MOD
                  e = e shr 1
              }
              return ((r - 2 + MOD) % MOD).toInt()
          }
        `,
        swift: code`
          func monkeyMove(_ n: Int) -> Int {
              let MOD = 1_000_000_007
              var r = 1, b = 2, e = n
              while e > 0 {
                  if e & 1 == 1 { r = r * b % MOD }
                  b = b * b % MOD
                  e >>= 1
              }
              return (r - 2 + MOD) % MOD
          }
        `,
        rust: code`
          fn monkeyMove(n: i32) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let mut r: i64 = 1;
              let mut b: i64 = 2;
              let mut e = n;
              while e > 0 {
                  if e & 1 == 1 {
                      r = r * b % MOD;
                  }
                  b = b * b % MOD;
                  e >>= 1;
              }
              ((r - 2 + MOD) % MOD) as i32
          }
        `,
        php: code`
          function monkeyMove($n) {
              $MOD = 1000000007;
              $r = 1;
              $b = 2;
              $e = $n;
              while ($e > 0) {
                  if ($e & 1) $r = $r * $b % $MOD;
                  $b = $b * $b % $MOD;
                  $e >>= 1;
              }
              return ($r - 2 + $MOD) % $MOD;
          }
        `,
        ruby: code`
          def monkeyMove(n)
            m = 1_000_000_007
            (2.pow(n, m) - 2) % m
          end
        `,
      },
    };
  })(),

  // ── Minimize the Maximum of Two Arrays (LC 2513) ─────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    // The u-th positive integer that is not a multiple of d.
    const nth = (u: number, d: number) => u + Math.floor((u - 1) / (d - 1));
    const ref = (d1: number, d2: number, u1: number, u2: number) => {
      const lcm = (d1 / gcd(d1, d2)) * d2;
      return Math.max(nth(u1, d1), nth(u2, d2), nth(u1 + u2, lcm));
    };
    const fmt = (v: number[]) => v.join("\n");
    return {
      slug: "minimize-the-maximum-of-two-arrays",
      title: "Minimize the Maximum of Two Arrays",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Binary Search", "Number Theory", "Google", "Amazon"],
      signature: {
        funcName: "minimizeSet",
        params: [
          { name: "divisor1", type: "int" as const }, { name: "divisor2", type: "int" as const },
          { name: "uniqueCnt1", type: "int" as const }, { name: "uniqueCnt2", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "Fill two initially empty arrays `arr1` and `arr2` with positive integers so that:\n\n- `arr1` holds `uniqueCnt1` **distinct** integers, none of them divisible by `divisor1`;\n- `arr2` holds `uniqueCnt2` **distinct** integers, none of them divisible by `divisor2`;\n- no integer appears in both arrays.\n\nReturn the **smallest possible value of the largest integer** used in either array.",
        [
          { in: "divisor1 = 2, divisor2 = 3, uniqueCnt1 = 2, uniqueCnt2 = 2", out: "4", note: "arr1 = [1, 3] (odd numbers) and arr2 = [2, 4] (not multiples of 3)." },
          { in: "divisor1 = 3, divisor2 = 5, uniqueCnt1 = 2, uniqueCnt2 = 1", out: "3", note: "arr1 = [1, 2], arr2 = [3]." },
          { in: "divisor1 = 2, divisor2 = 2, uniqueCnt1 = 500000000, uniqueCnt2 = 500000000", out: "1999999999", note: "Both arrays need odd numbers, 10^9 of them in total." },
        ],
        ["2 <= divisor1, divisor2 <= 10^5", "1 <= uniqueCnt1, uniqueCnt2 < 10^9", "2 <= uniqueCnt1 + uniqueCnt2 <= 10^9"]),
      hints: [
        "If the arrays can be filled using numbers up to `x`, they can also be filled up to `x + 1` — so binary search on `x`.",
        "Among `1..x`: `x - x/divisor1` numbers are allowed in `arr1`, `x - x/divisor2` in `arr2`, and `x - x/lcm` in at least one of them.",
        "`x` is enough exactly when all three counts reach `uniqueCnt1`, `uniqueCnt2` and `uniqueCnt1 + uniqueCnt2` respectively.",
      ],
      editorial: explain({
        idea: "Feasibility is monotone in the largest allowed value `x`, and it reduces to three counting inequalities. Binary search for the smallest `x` that satisfies all three.",
        steps: [
          "Let `L = lcm(divisor1, divisor2) = divisor1 / gcd · divisor2` (up to 10^10, so use 64 bits).",
          "For a candidate `x`, require `x - floor(x/divisor1) >= uniqueCnt1`, `x - floor(x/divisor2) >= uniqueCnt2` and `x - floor(x/L) >= uniqueCnt1 + uniqueCnt2`.",
          "Binary search `x` over `[1, 2·10^9]` for the smallest value meeting all three.",
        ],
        why: "Split `1..x` into four groups: multiples of `divisor2` only (usable only by `arr1`), multiples of `divisor1` only (only by `arr2`), multiples of neither (either array) and multiples of both (neither). `arr1` takes what it can from its private group and the rest from the shared one, `arr2` likewise, so a filling exists exactly when each array has enough candidates on its own and both together have enough non-multiples of `L` — the three inequalities. Each count grows with `x`, so feasibility is monotone and binary search is valid. The answer never exceeds `2·10^9 - 1` (the worst case is both divisors 2).",
        time: "O(log(2·10^9))",
        space: "O(1)",
        pitfalls: [
          "Checking only the two per-array conditions ignores that the arrays compete for the same numbers.",
          "`lcm` can reach 10^10 and `uniqueCnt1 + uniqueCnt2` is near 10^9 — keep the arithmetic in 64 bits.",
          "Use `lcm`, not `divisor1 · divisor2`, when the divisors share a factor (e.g. 2 and 4).",
        ],
      }),
      examples: [
        { input: fmt([2, 3, 2, 2]), expectedOutput: "4" },
        { input: fmt([3, 5, 2, 1]), expectedOutput: "3" },
        { input: fmt([2, 2, 500000000, 500000000]), expectedOutput: "1999999999" },
      ],
      gen: (rng: Rng) => {
        const div = () => { const c = ri(rng, 0, 2); return c === 0 ? ri(rng, 2, 10) : c === 1 ? ri(rng, 2, 1000) : ri(rng, 2, 100000); };
        const d1 = div();
        let d2 = div();
        const k = ri(rng, 0, 9);
        if (k === 0) d2 = d1;
        else if (k === 1 && d1 * 2 <= 100000) d2 = d1 * ri(rng, 2, Math.min(50, Math.floor(100000 / d1)));
        const total = pick(rng, [20, 2000, 1000000, 1000000000]);
        const s = rng() < 0.05 ? total : ri(rng, 2, total);
        const u1 = ri(rng, 1, s - 1), u2 = s - u1;
        const v = rng() < 0.5 ? [d1, d2, u1, u2] : [d2, d1, u2, u1];
        return { input: fmt(v), expectedOutput: String(ref(v[0], v[1], v[2], v[3])) };
      },
      solutions: {
        python: code`
          import math

          def minimizeSet(divisor1: int, divisor2: int, uniqueCnt1: int, uniqueCnt2: int) -> int:
              lcm = divisor1 // math.gcd(divisor1, divisor2) * divisor2
              lo, hi = 1, 2 * 10 ** 9
              while lo < hi:
                  mid = (lo + hi) // 2
                  if (mid - mid // divisor1 >= uniqueCnt1 and mid - mid // divisor2 >= uniqueCnt2
                          and mid - mid // lcm >= uniqueCnt1 + uniqueCnt2):
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var minimizeSet = function(divisor1, divisor2, uniqueCnt1, uniqueCnt2) {
              var a = divisor1, b = divisor2;
              while (b !== 0) { var t = a % b; a = b; b = t; }
              var lcm = divisor1 / a * divisor2;
              var lo = 1, hi = 2000000000;
              while (lo < hi) {
                  var mid = Math.floor((lo + hi) / 2);
                  var ok = mid - Math.floor(mid / divisor1) >= uniqueCnt1 &&
                      mid - Math.floor(mid / divisor2) >= uniqueCnt2 &&
                      mid - Math.floor(mid / lcm) >= uniqueCnt1 + uniqueCnt2;
                  if (ok) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function minimizeSet(divisor1: number, divisor2: number, uniqueCnt1: number, uniqueCnt2: number): number {
              var a = divisor1, b = divisor2;
              while (b !== 0) { var t = a % b; a = b; b = t; }
              var lcm = divisor1 / a * divisor2;
              var lo = 1, hi = 2000000000;
              while (lo < hi) {
                  var mid = Math.floor((lo + hi) / 2);
                  var ok = mid - Math.floor(mid / divisor1) >= uniqueCnt1 &&
                      mid - Math.floor(mid / divisor2) >= uniqueCnt2 &&
                      mid - Math.floor(mid / lcm) >= uniqueCnt1 + uniqueCnt2;
                  if (ok) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int minimizeSet(int divisor1, int divisor2, int uniqueCnt1, int uniqueCnt2) {
              long a = divisor1, b = divisor2;
              while (b != 0) { long t = a % b; a = b; b = t; }
              long lcm = divisor1 / a * divisor2;
              long need = (long) uniqueCnt1 + uniqueCnt2;
              long lo = 1, hi = 2000000000L;
              while (lo < hi) {
                  long mid = (lo + hi) / 2;
                  if (mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= need) hi = mid;
                  else lo = mid + 1;
              }
              return (int) lo;
          }
        `,
        cpp: code`
          int minimizeSet(int divisor1, int divisor2, int uniqueCnt1, int uniqueCnt2) {
              long long a = divisor1, b = divisor2;
              while (b != 0) { long long t = a % b; a = b; b = t; }
              long long lcm = divisor1 / a * divisor2;
              long long need = (long long) uniqueCnt1 + uniqueCnt2;
              long long lo = 1, hi = 2000000000LL;
              while (lo < hi) {
                  long long mid = (lo + hi) / 2;
                  if (mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= need) hi = mid;
                  else lo = mid + 1;
              }
              return (int) lo;
          }
        `,
        c: code`
          int minimizeSet(int divisor1, int divisor2, int uniqueCnt1, int uniqueCnt2) {
              long long a = divisor1, b = divisor2;
              while (b != 0) { long long t = a % b; a = b; b = t; }
              long long lcm = divisor1 / a * divisor2;
              long long need = (long long) uniqueCnt1 + uniqueCnt2;
              long long lo = 1, hi = 2000000000LL;
              while (lo < hi) {
                  long long mid = (lo + hi) / 2;
                  if (mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= need) hi = mid;
                  else lo = mid + 1;
              }
              return (int) lo;
          }
        `,
        csharp: code`
          public static int MinimizeSet(int divisor1, int divisor2, int uniqueCnt1, int uniqueCnt2)
          {
              long a = divisor1, b = divisor2;
              while (b != 0) { long t = a % b; a = b; b = t; }
              long lcm = divisor1 / a * divisor2;
              long need = (long) uniqueCnt1 + uniqueCnt2;
              long lo = 1, hi = 2000000000L;
              while (lo < hi)
              {
                  long mid = (lo + hi) / 2;
                  if (mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= need) hi = mid;
                  else lo = mid + 1;
              }
              return (int) lo;
          }
        `,
        go: code`
          func minimizeSet(divisor1 int, divisor2 int, uniqueCnt1 int, uniqueCnt2 int) int {
              a, b := divisor1, divisor2
              for b != 0 {
                  a, b = b, a%b
              }
              lcm := divisor1 / a * divisor2
              lo, hi := 1, 2000000000
              for lo < hi {
                  mid := (lo + hi) / 2
                  if mid-mid/divisor1 >= uniqueCnt1 && mid-mid/divisor2 >= uniqueCnt2 && mid-mid/lcm >= uniqueCnt1+uniqueCnt2 {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun minimizeSet(divisor1: Int, divisor2: Int, uniqueCnt1: Int, uniqueCnt2: Int): Int {
              var a = divisor1.toLong()
              var b = divisor2.toLong()
              while (b != 0L) {
                  val t = a % b
                  a = b
                  b = t
              }
              val lcm = divisor1 / a * divisor2
              val need = uniqueCnt1.toLong() + uniqueCnt2
              var lo = 1L
              var hi = 2000000000L
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  if (mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= need) hi = mid
                  else lo = mid + 1
              }
              return lo.toInt()
          }
        `,
        swift: code`
          func minimizeSet(_ divisor1: Int, _ divisor2: Int, _ uniqueCnt1: Int, _ uniqueCnt2: Int) -> Int {
              var a = divisor1, b = divisor2
              while b != 0 {
                  let t = a % b
                  a = b
                  b = t
              }
              let lcm = divisor1 / a * divisor2
              var lo = 1, hi = 2000000000
              while lo < hi {
                  let mid = (lo + hi) / 2
                  if mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 && mid - mid / lcm >= uniqueCnt1 + uniqueCnt2 {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        rust: code`
          fn minimizeSet(divisor1: i32, divisor2: i32, uniqueCnt1: i32, uniqueCnt2: i32) -> i32 {
              let (d1, d2) = (divisor1 as i64, divisor2 as i64);
              let (u1, u2) = (uniqueCnt1 as i64, uniqueCnt2 as i64);
              let (mut a, mut b) = (d1, d2);
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              let lcm = d1 / a * d2;
              let (mut lo, mut hi): (i64, i64) = (1, 2000000000);
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  if mid - mid / d1 >= u1 && mid - mid / d2 >= u2 && mid - mid / lcm >= u1 + u2 {
                      hi = mid;
                  } else {
                      lo = mid + 1;
                  }
              }
              lo as i32
          }
        `,
        php: code`
          function minimizeSet($divisor1, $divisor2, $uniqueCnt1, $uniqueCnt2) {
              $a = $divisor1;
              $b = $divisor2;
              while ($b != 0) {
                  $t = $a % $b;
                  $a = $b;
                  $b = $t;
              }
              $lcm = intdiv($divisor1, $a) * $divisor2;
              $lo = 1;
              $hi = 2000000000;
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if ($mid - intdiv($mid, $divisor1) >= $uniqueCnt1 && $mid - intdiv($mid, $divisor2) >= $uniqueCnt2
                      && $mid - intdiv($mid, $lcm) >= $uniqueCnt1 + $uniqueCnt2) $hi = $mid;
                  else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def minimizeSet(divisor1, divisor2, uniqueCnt1, uniqueCnt2)
            lcm = divisor1.lcm(divisor2)
            lo = 1
            hi = 2_000_000_000
            while lo < hi
              mid = (lo + hi) / 2
              if mid - mid / divisor1 >= uniqueCnt1 && mid - mid / divisor2 >= uniqueCnt2 &&
                 mid - mid / lcm >= uniqueCnt1 + uniqueCnt2
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

  // ── Check if Point Is Reachable (LC 2543) ────────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (x: number, y: number) => {
      let g = gcd(x, y);
      while (g % 2 === 0) g /= 2;
      return g === 1;
    };
    return {
      slug: "check-if-point-is-reachable",
      title: "Check if Point Is Reachable",
      difficulty: "HARD" as const,
      tags: ["Math", "Number Theory", "Google", "Amazon"],
      signature: {
        funcName: "isReachable",
        params: [{ name: "targetX", type: "int" as const }, { name: "targetY", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A token starts at the point `(1, 1)` of an infinite grid. From `(x, y)` one step can move it to any of:\n\n- `(x, y - x)`\n- `(x - y, y)`\n- `(2 * x, y)`\n- `(x, 2 * y)`\n\nGiven a target `(targetX, targetY)`, return `true` if the token can reach it in a finite number of steps.",
        [
          { in: "targetX = 6, targetY = 10", out: "true", note: "One route: (1,1) → (2,1) → (4,1) → (3,1) → (3,2) → (3,4) → (3,8) → (3,5) → (3,10) → (6,10)." },
          { in: "targetX = 12, targetY = 18", out: "false", note: "gcd(12, 18) = 6, and the odd factor 3 can never appear." },
          { in: "targetX = 1, targetY = 1", out: "true" },
        ],
        ["1 <= targetX, targetY <= 10^9"]),
      hints: [
        "Look for an invariant. What happens to `gcd(x, y)` under each move?",
        "Subtracting one coordinate from the other keeps the gcd; doubling one coordinate multiplies the gcd by 1 or 2.",
        "So every reachable point has a power-of-two gcd — and conversely every such point is reachable. Check whether `gcd(targetX, targetY)` is a power of two.",
      ],
      editorial: explain({
        idea: "The gcd of the two coordinates starts at 1, is unchanged by the subtraction moves and at most doubles under the doubling moves — so it is always a power of two. That condition is also sufficient.",
        steps: [
          "Compute `g = gcd(targetX, targetY)` with Euclid's algorithm.",
          "Return `true` exactly when `g` is a power of two, i.e. `g & (g - 1) == 0`.",
        ],
        why: "Necessity: `gcd(x, y - x) = gcd(x, y)`, and `gcd(2x, y)` is `gcd(x, y)` or twice it, so from `gcd = 1` only powers of two can appear. Sufficiency: work backwards from the target, where the reverse moves are `(x, y) → (x, x + y)`, `(x + y, y)` and halving an even coordinate. Halve while a coordinate is even; when both are odd and different, replace the larger by their sum, which is even, and halve again — the larger coordinate strictly shrinks each round. This ends at `(g', g')` where `g'` is the odd part of the gcd, which is 1 exactly when the gcd is a power of two, i.e. at `(1, 1)`.",
        time: "O(log min(targetX, targetY))",
        space: "O(1)",
        pitfalls: [
          "A search over the grid never terminates on its own — coordinates can grow without bound; the invariant is the whole solution.",
          "1 is a power of two (2^0), so coprime targets are reachable.",
          "In Python, PHP and Ruby `&` binds differently from `==`; parenthesise `(g & (g - 1)) == 0`.",
        ],
      }),
      examples: [
        { input: "6\n10", expectedOutput: "true" },
        { input: "12\n18", expectedOutput: "false" },
        { input: "1\n1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const lim = pick(rng, [10, 1000, 1000000, 1000000000]);
        const kind = ri(rng, 0, 4);
        let x = ri(rng, 1, lim), y = ri(rng, 1, lim);
        if (kind >= 1) {
          const g = gcd(x, y); x /= g; y /= g;
          let f = 1;
          if (kind >= 2) f *= pick(rng, [1, 2, 4, 8, 64, 1024]);
          if (kind >= 3) f *= pick(rng, [3, 5, 7, 9, 15, 21, 101]);
          if (x * f <= 1000000000 && y * f <= 1000000000) { x *= f; y *= f; }
        }
        return { input: x + "\n" + y, expectedOutput: bool(ref(x, y)) };
      },
      solutions: {
        python: code`
          import math

          def isReachable(targetX: int, targetY: int) -> bool:
              g = math.gcd(targetX, targetY)
              return (g & (g - 1)) == 0
        `,
        javascript: code`
          var isReachable = function(targetX, targetY) {
              var a = targetX, b = targetY;
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return (a & (a - 1)) === 0;
          };
        `,
        typescript: code`
          function isReachable(targetX: number, targetY: number): boolean {
              var a = targetX, b = targetY;
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return (a & (a - 1)) === 0;
          }
        `,
        java: code`
          public static boolean isReachable(int targetX, int targetY) {
              int a = targetX, b = targetY;
              while (b != 0) { int t = a % b; a = b; b = t; }
              return (a & (a - 1)) == 0;
          }
        `,
        cpp: code`
          bool isReachable(int targetX, int targetY) {
              int a = targetX, b = targetY;
              while (b != 0) { int t = a % b; a = b; b = t; }
              return (a & (a - 1)) == 0;
          }
        `,
        c: code`
          bool isReachable(int targetX, int targetY) {
              int a = targetX, b = targetY;
              while (b != 0) { int t = a % b; a = b; b = t; }
              return (a & (a - 1)) == 0;
          }
        `,
        csharp: code`
          public static bool IsReachable(int targetX, int targetY)
          {
              int a = targetX, b = targetY;
              while (b != 0) { int t = a % b; a = b; b = t; }
              return (a & (a - 1)) == 0;
          }
        `,
        go: code`
          func isReachable(targetX int, targetY int) bool {
              a, b := targetX, targetY
              for b != 0 {
                  a, b = b, a%b
              }
              return a&(a-1) == 0
          }
        `,
        kotlin: code`
          fun isReachable(targetX: Int, targetY: Int): Boolean {
              var a = targetX
              var b = targetY
              while (b != 0) {
                  val t = a % b
                  a = b
                  b = t
              }
              return (a and (a - 1)) == 0
          }
        `,
        swift: code`
          func isReachable(_ targetX: Int, _ targetY: Int) -> Bool {
              var a = targetX, b = targetY
              while b != 0 {
                  let t = a % b
                  a = b
                  b = t
              }
              return (a & (a - 1)) == 0
          }
        `,
        rust: code`
          fn isReachable(targetX: i32, targetY: i32) -> bool {
              let (mut a, mut b) = (targetX, targetY);
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              (a & (a - 1)) == 0
          }
        `,
        php: code`
          function isReachable($targetX, $targetY) {
              $a = $targetX;
              $b = $targetY;
              while ($b != 0) {
                  $t = $a % $b;
                  $a = $b;
                  $b = $t;
              }
              return ($a & ($a - 1)) == 0;
          }
        `,
        ruby: code`
          def isReachable(targetX, targetY)
            g = targetX.gcd(targetY)
            (g & (g - 1)) == 0
          end
        `,
      },
    };
  })(),

  // ── Punishment Number of an Integer (LC 2698) ────────────────────
  (() => {
    const splits = (i: number) => {
      // Try every set of cut positions in the decimal string of i².
      const s = String(i * i);
      for (let mask = 0; mask < 1 << (s.length - 1); mask++) {
        let sum = 0, cur = 0;
        for (let k = 0; k < s.length; k++) {
          cur = cur * 10 + Number(s[k]);
          if (k === s.length - 1 || (mask >> k) & 1) { sum += cur; cur = 0; }
        }
        if (sum === i) return true;
      }
      return false;
    };
    const prefix: number[] = [0];
    for (let i = 1; i <= 1000; i++) prefix.push(prefix[i - 1] + (splits(i) ? i * i : 0));
    return {
      slug: "punishment-number-of-an-integer",
      title: "Punishment Number of an Integer",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Backtracking", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "punishmentNumber", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Call an integer `i` **special** if the decimal digits of `i * i` can be cut into contiguous pieces whose integer values add up to `i` (a piece may start with zeros, so `\"01\"` counts as 1).\n\nThe **punishment number** of `n` is the sum of `i * i` over all special `i` with `1 <= i <= n`. Return it.",
        [
          { in: "n = 9", out: "82", note: "1 (1 = 1) and 9 (81 = 8 + 1) are special: 1 + 81 = 82." },
          { in: "n = 36", out: "1478", note: "Add 10 (100 = 10 + 0) and 36 (1296 = 1 + 29 + 6): 1 + 81 + 100 + 1296." },
          { in: "n = 1000", out: "10804657" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Test each `i` from 1 to `n` independently; `i * i` has at most 7 digits.",
        "Backtrack: choose the first piece, subtract its value from the target, and recurse on the rest of the digits.",
        "Prune when the remaining target goes negative, or when the remaining digits read as a whole number are already smaller than the target (splitting never increases a value).",
      ],
      editorial: explain({
        idea: "For each `i`, search the ways to cut the digits of `i²` with a small backtracking routine; there are at most 2⁶ cuttings of a 7-digit square.",
        steps: [
          "Define `can(x, target)`: can the digits of `x` be split into pieces summing to `target`?",
          "If `target < 0` or `x < target`, return `false`; if `x == target`, return `true` (keep `x` as one piece).",
          "Otherwise, for `p = 10, 100, …` while `p <= x`: cut off the last digits as the piece `x mod p` and recurse on `can(x / p, target - x mod p)`.",
          "Sum `i²` over all `i <= n` with `can(i², i)`.",
        ],
        why: "Every cutting of a digit string is a last piece plus a cutting of the prefix, and the last piece is `x mod 10^k` for some `k` (zeros allowed at its front) while the prefix is `x / 10^k`, so the recursion visits every cutting. Splitting never increases a value (`a·10^k + b >= a + b`), so `x < target` can never succeed and prunes safely.",
        time: "O(n · 2^d) with d ≤ 7 digits — at most ~64 cuttings per i",
        space: "O(d) recursion depth",
        pitfalls: [
          "Pieces may have leading zeros: 100 = 10 + 0 and 1000000 = 1000 + 0 + 0 + 0 … are fine.",
          "Sum the squares `i * i`, not the `i` values.",
          "The total for n = 1000 is about 10^7 — it fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "9", expectedOutput: "82" },
        { input: "36", expectedOutput: "1478" },
        { input: "1000", expectedOutput: "10804657" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const top = pick(rng, [50, 300, 1000, 1000]);
        const n = ri(rng, 1, top);
        return { input: String(n), expectedOutput: String(prefix[n]) };
      },
      solutions: {
        python: code`
          def punishmentNumber(n: int) -> int:
              def can(x, target):
                  if target < 0 or x < target:
                      return False
                  if x == target:
                      return True
                  p = 10
                  while p <= x:
                      if can(x // p, target - x % p):
                          return True
                      p *= 10
                  return False

              total = 0
              for i in range(1, n + 1):
                  if can(i * i, i):
                      total += i * i
              return total
        `,
        javascript: code`
          var punishmentNumber = function(n) {
              var can = function(x, target) {
                  if (target < 0 || x < target) return false;
                  if (x === target) return true;
                  for (var p = 10; p <= x; p *= 10) {
                      if (can(Math.floor(x / p), target - x % p)) return true;
                  }
                  return false;
              };
              var total = 0;
              for (var i = 1; i <= n; i++) if (can(i * i, i)) total += i * i;
              return total;
          };
        `,
        typescript: code`
          function punishmentNumber(n: number): number {
              var can = function(x: number, target: number): boolean {
                  if (target < 0 || x < target) return false;
                  if (x === target) return true;
                  for (var p = 10; p <= x; p *= 10) {
                      if (can(Math.floor(x / p), target - x % p)) return true;
                  }
                  return false;
              };
              var total = 0;
              for (var i = 1; i <= n; i++) if (can(i * i, i)) total += i * i;
              return total;
          }
        `,
        java: code`
          public static int punishmentNumber(int n) {
              int total = 0;
              for (int i = 1; i <= n; i++) if (punishCan(i * i, i)) total += i * i;
              return total;
          }

          private static boolean punishCan(int x, int target) {
              if (target < 0 || x < target) return false;
              if (x == target) return true;
              for (int p = 10; p <= x; p *= 10) {
                  if (punishCan(x / p, target - x % p)) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool punishCan(int x, int target) {
              if (target < 0 || x < target) return false;
              if (x == target) return true;
              for (int p = 10; p <= x; p *= 10) {
                  if (punishCan(x / p, target - x % p)) return true;
              }
              return false;
          }

          int punishmentNumber(int n) {
              int total = 0;
              for (int i = 1; i <= n; i++) if (punishCan(i * i, i)) total += i * i;
              return total;
          }
        `,
        c: code`
          static bool punishCan(int x, int target) {
              if (target < 0 || x < target) return false;
              if (x == target) return true;
              for (int p = 10; p <= x; p *= 10) {
                  if (punishCan(x / p, target - x % p)) return true;
              }
              return false;
          }

          int punishmentNumber(int n) {
              int total = 0;
              for (int i = 1; i <= n; i++) if (punishCan(i * i, i)) total += i * i;
              return total;
          }
        `,
        csharp: code`
          public static int PunishmentNumber(int n)
          {
              int total = 0;
              for (int i = 1; i <= n; i++) if (PunishCan(i * i, i)) total += i * i;
              return total;
          }

          private static bool PunishCan(int x, int target)
          {
              if (target < 0 || x < target) return false;
              if (x == target) return true;
              for (int p = 10; p <= x; p *= 10)
              {
                  if (PunishCan(x / p, target - x % p)) return true;
              }
              return false;
          }
        `,
        go: code`
          func punishmentNumber(n int) int {
              var can func(x, target int) bool
              can = func(x, target int) bool {
                  if target < 0 || x < target {
                      return false
                  }
                  if x == target {
                      return true
                  }
                  for p := 10; p <= x; p *= 10 {
                      if can(x/p, target-x%p) {
                          return true
                      }
                  }
                  return false
              }
              total := 0
              for i := 1; i <= n; i++ {
                  if can(i*i, i) {
                      total += i * i
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun punishmentNumber(n: Int): Int {
              fun can(x: Int, target: Int): Boolean {
                  if (target < 0 || x < target) return false
                  if (x == target) return true
                  var p = 10
                  while (p <= x) {
                      if (can(x / p, target - x % p)) return true
                      p *= 10
                  }
                  return false
              }
              var total = 0
              for (i in 1..n) if (can(i * i, i)) total += i * i
              return total
          }
        `,
        swift: code`
          func punishmentNumber(_ n: Int) -> Int {
              func can(_ x: Int, _ target: Int) -> Bool {
                  if target < 0 || x < target { return false }
                  if x == target { return true }
                  var p = 10
                  while p <= x {
                      if can(x / p, target - x % p) { return true }
                      p *= 10
                  }
                  return false
              }
              var total = 0
              for i in 1...n where can(i * i, i) { total += i * i }
              return total
          }
        `,
        rust: code`
          fn punish_can(x: i32, target: i32) -> bool {
              if target < 0 || x < target {
                  return false;
              }
              if x == target {
                  return true;
              }
              let mut p = 10;
              while p <= x {
                  if punish_can(x / p, target - x % p) {
                      return true;
                  }
                  p *= 10;
              }
              false
          }

          fn punishmentNumber(n: i32) -> i32 {
              let mut total = 0;
              for i in 1..=n {
                  if punish_can(i * i, i) {
                      total += i * i;
                  }
              }
              total
          }
        `,
        php: code`
          function punishmentNumber($n) {
              $can = function($x, $target) use (&$can) {
                  if ($target < 0 || $x < $target) return false;
                  if ($x == $target) return true;
                  for ($p = 10; $p <= $x; $p *= 10) {
                      if ($can(intdiv($x, $p), $target - $x % $p)) return true;
                  }
                  return false;
              };
              $total = 0;
              for ($i = 1; $i <= $n; $i++) if ($can($i * $i, $i)) $total += $i * $i;
              return $total;
          }
        `,
        ruby: code`
          def punishmentNumber(n)
            can = lambda do |x, target|
              return false if target < 0 || x < target
              return true if x == target
              p = 10
              while p <= x
                return true if can.call(x / p, target - x % p)
                p *= 10
              end
              false
            end
            (1..n).select { |i| can.call(i * i, i) }.sum { |i| i * i }
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make the Integer Zero (LC 2749) ────────
  (() => {
    const ref = (num1: number, num2: number) => {
      for (let k = 1; k <= 100; k++) {
        const x = num1 - k * num2;
        if (x < k) continue;
        const ones = x.toString(2).split("").filter((c) => c === "1").length;
        if (ones <= k) return k;
      }
      return -1;
    };
    return {
      slug: "minimum-operations-to-make-the-integer-zero",
      title: "Minimum Operations to Make the Integer Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Brainteaser", "Enumeration", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "makeTheIntegerZero",
        params: [{ name: "num1", type: "int" as const }, { name: "num2", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two integers `num1` and `num2`. In one operation you pick an integer `i` with `0 <= i <= 60` and subtract `2^i + num2` from `num1`.\n\nReturn the **minimum** number of operations needed to make `num1` exactly `0`, or `-1` if it is impossible.",
        [
          { in: "num1 = 10, num2 = 1", out: "2", note: "Subtract 2^2 + 1 = 5 twice: 10 → 5 → 0." },
          { in: "num1 = 6, num2 = 10", out: "-1", note: "Every operation subtracts at least 11, so 6 can never land exactly on 0." },
          { in: "num1 = 7, num2 = 0", out: "3", note: "7 = 4 + 2 + 1 needs three powers of two." },
        ],
        ["1 <= num1 <= 10^9", "-10^9 <= num2 <= 10^9"]),
      hints: [
        "After exactly `k` operations, `num1 - k·num2` must equal a sum of `k` powers of two.",
        "A positive `x` is a sum of exactly `k` powers of two (repeats allowed) if and only if `popcount(x) <= k <= x`.",
        "Try `k = 1, 2, …, 60` and return the first that satisfies the condition — the values involved need 64-bit integers.",
      ],
      editorial: explain({
        idea: "Fix the number of operations `k`. The `num2` parts add up to `k·num2` no matter which powers are chosen, so the question becomes whether `x = num1 - k·num2` is a sum of exactly `k` powers of two — which holds exactly when `popcount(x) <= k <= x`.",
        steps: [
          "For `k` from 1 to 60, compute `x = num1 - k·num2` in 64 bits.",
          "If `x >= k` and the number of 1-bits of `x` is at most `k`, return `k`.",
          "If no `k` works, return `-1`.",
        ],
        why: "The fewest powers of two that sum to `x` is `popcount(x)` (its binary digits), and the most is `x` (all ones). Every count in between is reachable, because splitting a power `2^j` with `j >= 1` into two copies of `2^(j-1)` raises the count by exactly one. So `k` operations suffice exactly when `popcount(x) <= k <= x`. For `k >= 36` any `x >= k` qualifies (`x <= 6.1·10^10 < 2^36` has at most 36 one-bits), and the powers stay within `2^60`, so if an answer exists it appears well before 60.",
        time: "O(60 · 64)",
        space: "O(1)",
        pitfalls: [
          "`k·num2` reaches 6·10^10 — compute `x` in 64 bits (JavaScript numbers are exact here, but 32-bit bitwise operators are not).",
          "`x` must be at least `k`: each operation removes at least 1 from `x`'s power-of-two budget.",
          "Do not stop at the first `k` with `x < k` when `num2` is negative — then `x` grows with `k`.",
        ],
      }),
      examples: [
        { input: "10\n1", expectedOutput: "2" },
        { input: "6\n10", expectedOutput: "-1" },
        { input: "7\n0", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const num1 = ri(rng, 1, pick(rng, [20, 1000, 100000, 1000000000]));
        const c = ri(rng, 0, 4);
        const num2 = c === 0 ? ri(rng, -5, 5) : c === 1 ? ri(rng, -1000, 1000) : c === 2 ? ri(rng, -1000000000, 1000000000)
          : c === 3 ? ri(rng, -1000000000, -100000000) : Math.floor(num1 / ri(rng, 2, 40)) - ri(rng, 0, 3);
        return { input: num1 + "\n" + num2, expectedOutput: String(ref(num1, num2)) };
      },
      solutions: {
        python: code`
          def makeTheIntegerZero(num1: int, num2: int) -> int:
              for k in range(1, 61):
                  x = num1 - k * num2
                  if x >= k and bin(x).count("1") <= k:
                      return k
              return -1
        `,
        javascript: code`
          var makeTheIntegerZero = function(num1, num2) {
              for (var k = 1; k <= 60; k++) {
                  var x = num1 - k * num2;
                  if (x < k) continue;
                  var ones = 0, t = x;
                  while (t > 0) {
                      ones += t % 2;
                      t = Math.floor(t / 2);
                  }
                  if (ones <= k) return k;
              }
              return -1;
          };
        `,
        typescript: code`
          function makeTheIntegerZero(num1: number, num2: number): number {
              for (var k = 1; k <= 60; k++) {
                  var x = num1 - k * num2;
                  if (x < k) continue;
                  var ones = 0, t = x;
                  while (t > 0) {
                      ones += t % 2;
                      t = Math.floor(t / 2);
                  }
                  if (ones <= k) return k;
              }
              return -1;
          }
        `,
        java: code`
          public static int makeTheIntegerZero(int num1, int num2) {
              for (int k = 1; k <= 60; k++) {
                  long x = (long) num1 - (long) k * num2;
                  if (x >= k && Long.bitCount(x) <= k) return k;
              }
              return -1;
          }
        `,
        cpp: code`
          int makeTheIntegerZero(int num1, int num2) {
              for (int k = 1; k <= 60; k++) {
                  long long x = (long long) num1 - (long long) k * num2;
                  if (x >= k && __builtin_popcountll(x) <= k) return k;
              }
              return -1;
          }
        `,
        c: code`
          int makeTheIntegerZero(int num1, int num2) {
              for (int k = 1; k <= 60; k++) {
                  long long x = (long long) num1 - (long long) k * num2;
                  if (x < k) continue;
                  int ones = 0;
                  for (long long t = x; t > 0; t >>= 1) ones += (int) (t & 1);
                  if (ones <= k) return k;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int MakeTheIntegerZero(int num1, int num2)
          {
              for (int k = 1; k <= 60; k++)
              {
                  long x = (long) num1 - (long) k * num2;
                  if (x < k) continue;
                  int ones = 0;
                  for (long t = x; t > 0; t >>= 1) ones += (int) (t & 1);
                  if (ones <= k) return k;
              }
              return -1;
          }
        `,
        go: code`
          func makeTheIntegerZero(num1 int, num2 int) int {
              for k := 1; k <= 60; k++ {
                  x := num1 - k*num2
                  if x < k {
                      continue
                  }
                  ones := 0
                  for t := x; t > 0; t >>= 1 {
                      ones += t & 1
                  }
                  if ones <= k {
                      return k
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun makeTheIntegerZero(num1: Int, num2: Int): Int {
              for (k in 1..60) {
                  val x = num1.toLong() - k.toLong() * num2
                  if (x >= k && java.lang.Long.bitCount(x) <= k) return k
              }
              return -1
          }
        `,
        swift: code`
          func makeTheIntegerZero(_ num1: Int, _ num2: Int) -> Int {
              for k in 1...60 {
                  let x = num1 - k * num2
                  if x >= k && x.nonzeroBitCount <= k { return k }
              }
              return -1
          }
        `,
        rust: code`
          fn makeTheIntegerZero(num1: i32, num2: i32) -> i32 {
              for k in 1..=60i64 {
                  let x = num1 as i64 - k * num2 as i64;
                  if x >= k && (x.count_ones() as i64) <= k {
                      return k as i32;
                  }
              }
              -1
          }
        `,
        php: code`
          function makeTheIntegerZero($num1, $num2) {
              for ($k = 1; $k <= 60; $k++) {
                  $x = $num1 - $k * $num2;
                  if ($x < $k) continue;
                  if (substr_count(decbin($x), "1") <= $k) return $k;
              }
              return -1;
          }
        `,
        ruby: code`
          def makeTheIntegerZero(num1, num2)
            (1..60).each do |k|
              x = num1 - k * num2
              return k if x >= k && x.to_s(2).count("1") <= k
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Prime Pairs With Target Sum (LC 2761) ────────────────────────
  (() => {
    const isPrime = (p: number) => { if (p < 2) return false; for (let d = 2; d * d <= p; d++) if (p % d === 0) return false; return true; };
    const ref = (n: number) => {
      const out: number[][] = [];
      for (let x = 2; x <= n - x; x++) if (isPrime(x) && isPrime(n - x)) out.push([x, n - x]);
      return out;
    };
    return {
      slug: "prime-pairs-with-target-sum",
      title: "Prime Pairs With Target Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Enumeration", "Number Theory", "Amazon", "Google", "TCS"],
      signature: { funcName: "findPrimePairs", params: [{ name: "n", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an integer `n`, find every pair of primes `[x, y]` with `x <= y` and `x + y == n`.\n\nReturn the pairs as a 2D array sorted by `x` in increasing order. Return an empty array if there are none.",
        [
          { in: "n = 16", out: "[[3,13],[5,11]]" },
          { in: "n = 11", out: "[]", note: "An odd sum of two primes needs the prime 2, and 11 - 2 = 9 is not prime." },
          { in: "n = 4", out: "[[2,2]]" },
        ],
        ["1 <= n <= 10^6"]),
      hints: [
        "Precompute which numbers up to `n` are prime with the sieve of Eratosthenes.",
        "Then try every `x` from 2 up to `n / 2` and keep it when both `x` and `n - x` are prime.",
        "Scanning `x` upward produces the pairs already in the required order, and `x <= n - x` guarantees `x <= y`.",
      ],
      editorial: explain({
        idea: "Sieve the primes up to `n` once, then each candidate pair is a constant-time lookup.",
        steps: [
          "Build a sieve: mark 0 and 1 as not prime, and for each prime `i` with `i·i <= n`, mark `i·i, i·i + i, …` as composite.",
          "For `x = 2, 3, …` while `x <= n - x`, add `[x, n - x]` if both are prime.",
          "Return the collected pairs.",
        ],
        why: "The sieve marks exactly the composites: every composite `m <= n` has a prime factor `p <= √m`, and is crossed out from `p²` onward. Requiring `x <= n - x` lists each unordered pair once with the smaller value first, and scanning `x` upward emits the pairs in increasing `x`.",
        time: "O(n log log n)",
        space: "O(n)",
        pitfalls: [
          "`x == y` is allowed: n = 4 gives `[2, 2]`, and n = 10 includes `[5, 5]`.",
          "For n < 4 there are no pairs at all; make sure the sieve and loop handle tiny n.",
          "Testing each candidate by trial division costs O(n√n) — fine for small n, slow near 10^6.",
        ],
      }),
      examples: [
        { input: "16", expectedOutput: "[[3,13],[5,11]]" },
        { input: "11", expectedOutput: "[]" },
        { input: "4", expectedOutput: "[[2,2]]" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let n = roll < 0.003 ? ri(rng, 1, 100000) : roll < 0.15 ? ri(rng, 1, 3000) : roll < 0.3 ? ri(rng, 1, 12) : ri(rng, 1, 500);
        if (n % 2 === 1 && rng() < 0.6) n++; // odd targets mostly have no pair
        return { input: String(n), expectedOutput: fmtIntMat(ref(n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findPrimePairs(n: int) -> List[List[int]]:
              if n < 4:
                  return []
              is_p = bytearray([1]) * (n + 1)
              is_p[0] = 0
              is_p[1] = 0
              i = 2
              while i * i <= n:
                  if is_p[i]:
                      is_p[i * i::i] = bytearray(len(range(i * i, n + 1, i)))
                  i += 1
              return [[x, n - x] for x in range(2, n // 2 + 1) if is_p[x] and is_p[n - x]]
        `,
        javascript: code`
          var findPrimePairs = function(n) {
              var res = [];
              if (n < 4) return res;
              var comp = new Uint8Array(n + 1);
              comp[0] = 1;
              comp[1] = 1;
              for (var i = 2; i * i <= n; i++) {
                  if (!comp[i]) for (var j = i * i; j <= n; j += i) comp[j] = 1;
              }
              for (var x = 2; x <= n - x; x++) if (!comp[x] && !comp[n - x]) res.push([x, n - x]);
              return res;
          };
        `,
        typescript: code`
          function findPrimePairs(n: number): number[][] {
              var res: number[][] = [];
              if (n < 4) return res;
              var comp: boolean[] = [];
              for (var z = 0; z <= n; z++) comp.push(z < 2);
              for (var i = 2; i * i <= n; i++) {
                  if (!comp[i]) for (var j = i * i; j <= n; j += i) comp[j] = true;
              }
              for (var x = 2; x <= n - x; x++) if (!comp[x] && !comp[n - x]) res.push([x, n - x]);
              return res;
          }
        `,
        java: code`
          public static int[][] findPrimePairs(int n) {
              List<int[]> res = new ArrayList<>();
              if (n < 4) return new int[0][];
              boolean[] comp = new boolean[n + 1];
              comp[0] = true;
              comp[1] = true;
              for (int i = 2; (long) i * i <= n; i++) {
                  if (!comp[i]) for (int j = i * i; j <= n; j += i) comp[j] = true;
              }
              for (int x = 2; x <= n - x; x++) if (!comp[x] && !comp[n - x]) res.add(new int[] { x, n - x });
              return res.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> findPrimePairs(int n) {
              vector<vector<int>> res;
              if (n < 4) return res;
              vector<bool> comp(n + 1, false);
              comp[0] = comp[1] = true;
              for (long long i = 2; i * i <= n; i++) {
                  if (!comp[i]) for (long long j = i * i; j <= n; j += i) comp[j] = true;
              }
              for (int x = 2; x <= n - x; x++) if (!comp[x] && !comp[n - x]) res.push_back({ x, n - x });
              return res;
          }
        `,
        c: code`
          int** findPrimePairs(int n, int* returnSize, int** returnColumnSizes) {
              *returnSize = 0;
              if (n < 4) {
                  *returnColumnSizes = (int*) malloc(sizeof(int));
                  return (int**) malloc(sizeof(int*));
              }
              char* comp = (char*) calloc(n + 1, 1);
              comp[0] = 1;
              comp[1] = 1;
              for (long long i = 2; i * i <= n; i++) {
                  if (!comp[i]) for (long long j = i * i; j <= n; j += i) comp[j] = 1;
              }
              int cap = n / 2 + 1;
              int** res = (int**) malloc(sizeof(int*) * cap);
              *returnColumnSizes = (int*) malloc(sizeof(int) * cap);
              int cnt = 0;
              for (int x = 2; x <= n - x; x++) {
                  if (!comp[x] && !comp[n - x]) {
                      res[cnt] = (int*) malloc(sizeof(int) * 2);
                      res[cnt][0] = x;
                      res[cnt][1] = n - x;
                      (*returnColumnSizes)[cnt] = 2;
                      cnt++;
                  }
              }
              free(comp);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static int[][] FindPrimePairs(int n)
          {
              var res = new List<int[]>();
              if (n < 4) return res.ToArray();
              bool[] comp = new bool[n + 1];
              comp[0] = true;
              comp[1] = true;
              for (long i = 2; i * i <= n; i++)
              {
                  if (!comp[i]) for (long j = i * i; j <= n; j += i) comp[j] = true;
              }
              for (int x = 2; x <= n - x; x++) if (!comp[x] && !comp[n - x]) res.Add(new int[] { x, n - x });
              return res.ToArray();
          }
        `,
        go: code`
          func findPrimePairs(n int) [][]int {
              res := [][]int{}
              if n < 4 {
                  return res
              }
              comp := make([]bool, n+1)
              comp[0], comp[1] = true, true
              for i := 2; i*i <= n; i++ {
                  if !comp[i] {
                      for j := i * i; j <= n; j += i {
                          comp[j] = true
                      }
                  }
              }
              for x := 2; x <= n-x; x++ {
                  if !comp[x] && !comp[n-x] {
                      res = append(res, []int{x, n - x})
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun findPrimePairs(n: Int): Array<IntArray> {
              val res = ArrayList<IntArray>()
              if (n < 4) return res.toTypedArray()
              val comp = BooleanArray(n + 1)
              comp[0] = true
              comp[1] = true
              var i = 2
              while (i.toLong() * i <= n) {
                  if (!comp[i]) {
                      var j = i * i
                      while (j <= n) {
                          comp[j] = true
                          j += i
                      }
                  }
                  i++
              }
              var x = 2
              while (x <= n - x) {
                  if (!comp[x] && !comp[n - x]) res.add(intArrayOf(x, n - x))
                  x++
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func findPrimePairs(_ n: Int) -> [[Int]] {
              var res = [[Int]]()
              if n < 4 { return res }
              var comp = [Bool](repeating: false, count: n + 1)
              comp[0] = true
              comp[1] = true
              var i = 2
              while i * i <= n {
                  if !comp[i] {
                      var j = i * i
                      while j <= n {
                          comp[j] = true
                          j += i
                      }
                  }
                  i += 1
              }
              var x = 2
              while x <= n - x {
                  if !comp[x] && !comp[n - x] { res.append([x, n - x]) }
                  x += 1
              }
              return res
          }
        `,
        rust: code`
          fn findPrimePairs(n: i32) -> Vec<Vec<i32>> {
              let mut res: Vec<Vec<i32>> = Vec::new();
              if n < 4 {
                  return res;
              }
              let n = n as usize;
              let mut comp = vec![false; n + 1];
              comp[0] = true;
              comp[1] = true;
              let mut i = 2;
              while i * i <= n {
                  if !comp[i] {
                      let mut j = i * i;
                      while j <= n {
                          comp[j] = true;
                          j += i;
                      }
                  }
                  i += 1;
              }
              let mut x = 2;
              while x <= n - x {
                  if !comp[x] && !comp[n - x] {
                      res.push(vec![x as i32, (n - x) as i32]);
                  }
                  x += 1;
              }
              res
          }
        `,
        php: code`
          function findPrimePairs($n) {
              $res = [];
              if ($n < 4) return $res;
              $comp = array_fill(0, $n + 1, false);
              $comp[0] = true;
              $comp[1] = true;
              for ($i = 2; $i * $i <= $n; $i++) {
                  if (!$comp[$i]) for ($j = $i * $i; $j <= $n; $j += $i) $comp[$j] = true;
              }
              for ($x = 2; $x <= $n - $x; $x++) if (!$comp[$x] && !$comp[$n - $x]) $res[] = [$x, $n - $x];
              return $res;
          }
        `,
        ruby: code`
          def findPrimePairs(n)
            return [] if n < 4
            comp = Array.new(n + 1, false)
            comp[0] = true
            comp[1] = true
            i = 2
            while i * i <= n
              unless comp[i]
                j = i * i
                while j <= n
                  comp[j] = true
                  j += i
                end
              end
              i += 1
            end
            (2..n / 2).select { |x| !comp[x] && !comp[n - x] }.map { |x| [x, n - x] }
          end
        `,
      },
    };
  })(),

];

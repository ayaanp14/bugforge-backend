/**
 * Festival problems — one original problem per festival, pinned as that day's
 * daily kata (services/daily-contest.ts PINNED_DAYS). They stay in the
 * catalogue afterwards like any other problem.
 *
 * Diwali 2026 (8 November): an Easy fixed-size sliding window, so the day's
 * kata is a solve most members can finish — every accepted submission that day
 * also lights a diya (lib/festival.ts) — and it is the technique the Diwali
 * video teaches.
 *
 * JS solutions must be Node 12-safe: no ??, ?., at(), replaceAll, flat.
 */
import { code, describe, explain, fmtIntArr, pick, ri, type CatalogProblem, type Rng } from "./types.js";

export const FESTIVAL_PROBLEMS: CatalogProblem[] = [

  // ── Brightest String of Diyas (Diwali 2026) ─────────────────────
  (() => {
    const ref = (brightness: number[], k: number) => {
      let sum = 0;
      for (let i = 0; i < k; i++) sum += brightness[i];
      let best = sum;
      for (let i = k; i < brightness.length; i++) {
        sum += brightness[i] - brightness[i - k];
        if (sum > best) best = sum;
      }
      return best;
    };
    return {
      slug: "brightest-string-of-diyas",
      title: "Brightest String of Diyas",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window"],
      signature: {
        funcName: "brightestStretch",
        params: [{ name: "brightness", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "It is Diwali, and a row of diyas lines the balcony. `brightness[i]` is how brightly the `i`-th diya burns.\n\nYour camera frame fits exactly `k` **consecutive** diyas. Return the largest total brightness any one photo can capture.",
        [
          { in: "brightness = [3,1,4,1,5,9,2], k = 3", out: "16", note: "Sliding the frame along gives 8, 6, 10, 15 and finally 16, over `[5,9,2]`: no other three neighbours burn brighter together." },
          { in: "brightness = [7,7,7], k = 3", out: "21", note: "The frame holds the whole row." },
          { in: "brightness = [0,8,0,0,6], k = 1", out: "8", note: "With room for one diya, pick the brightest." },
        ],
        ["1 <= k <= brightness.length <= 10^5", "0 <= brightness[i] <= 10^4"]),
      hints: [
        "Adding up every frame from scratch costs `k` steps a frame. What changes when the frame moves one diya to the right?",
        "Exactly one diya enters on the right and one leaves on the left — every diya in between is shared by both frames.",
        "Keep the frame's running total: add the new diya, subtract the one that left, and remember the best total seen.",
      ],
      editorial: explain({
        idea: "Neighbouring frames share all but two diyas, so slide one window of size `k` across the row and update its sum in O(1) per step instead of re-adding `k` numbers.",
        steps: [
          "Sum the first `k` diyas; that is the first frame and the best so far.",
          "For each `i` from `k` to the end: add `brightness[i]`, subtract `brightness[i - k]`.",
          "After each step, keep the larger of the best and the current sum.",
        ],
        why: "Every frame of `k` consecutive diyas starts at some index `0 … n - k`, and the loop visits each start exactly once; the running sum equals that frame's total because it adds the one diya entering and removes the one leaving.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Start `best` at the first frame's sum, not at 0 — that is only safe here because brightness is never negative.",
          "Subtract `brightness[i - k]`, not `brightness[i - k + 1]`: the diya leaving is the one `k` places back.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5,9,2]\n3", expectedOutput: "16" },
        { input: "[7,7,7]\n3", expectedOutput: "21" },
        { input: "[0,8,0,0,6]\n1", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 8), ri(rng, 9, 60), ri(rng, 60, 400)]);
        const hi = pick(rng, [1, 9, 100, 10000]);
        const brightness = Array.from({ length: n }, () => ri(rng, 0, hi));
        const k = rng() < 0.1 ? pick(rng, [1, n]) : ri(rng, 1, n);
        return { input: `${fmtIntArr(brightness)}\n${k}`, expectedOutput: String(ref(brightness, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def brightestStretch(brightness: List[int], k: int) -> int:
              total = sum(brightness[:k])
              best = total
              for i in range(k, len(brightness)):
                  total += brightness[i] - brightness[i - k]
                  best = max(best, total)
              return best
        `,
        javascript: code`
          var brightestStretch = function(brightness, k) {
              var total = 0;
              for (var i = 0; i < k; i++) total += brightness[i];
              var best = total;
              for (var j = k; j < brightness.length; j++) {
                  total += brightness[j] - brightness[j - k];
                  if (total > best) best = total;
              }
              return best;
          };
        `,
        typescript: code`
          function brightestStretch(brightness: number[], k: number): number {
              var total = 0;
              for (var i = 0; i < k; i++) total += brightness[i];
              var best = total;
              for (var j = k; j < brightness.length; j++) {
                  total += brightness[j] - brightness[j - k];
                  if (total > best) best = total;
              }
              return best;
          }
        `,
        java: code`
          public static int brightestStretch(int[] brightness, int k) {
              int total = 0;
              for (int i = 0; i < k; i++) total += brightness[i];
              int best = total;
              for (int i = k; i < brightness.length; i++) {
                  total += brightness[i] - brightness[i - k];
                  if (total > best) best = total;
              }
              return best;
          }
        `,
        cpp: code`
          int brightestStretch(vector<int>& brightness, int k) {
              int total = 0;
              for (int i = 0; i < k; i++) total += brightness[i];
              int best = total;
              for (int i = k; i < (int) brightness.size(); i++) {
                  total += brightness[i] - brightness[i - k];
                  if (total > best) best = total;
              }
              return best;
          }
        `,
        c: code`
          int brightestStretch(int* brightness, int brightnessSize, int k) {
              int total = 0;
              for (int i = 0; i < k; i++) total += brightness[i];
              int best = total;
              for (int i = k; i < brightnessSize; i++) {
                  total += brightness[i] - brightness[i - k];
                  if (total > best) best = total;
              }
              return best;
          }
        `,
        csharp: code`
          public static int BrightestStretch(int[] brightness, int k)
          {
              int total = 0;
              for (int i = 0; i < k; i++) total += brightness[i];
              int best = total;
              for (int i = k; i < brightness.Length; i++)
              {
                  total += brightness[i] - brightness[i - k];
                  if (total > best) best = total;
              }
              return best;
          }
        `,
        go: code`
          func brightestStretch(brightness []int, k int) int {
              total := 0
              for i := 0; i < k; i++ {
                  total += brightness[i]
              }
              best := total
              for i := k; i < len(brightness); i++ {
                  total += brightness[i] - brightness[i-k]
                  if total > best {
                      best = total
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun brightestStretch(brightness: IntArray, k: Int): Int {
              var total = 0
              for (i in 0 until k) total += brightness[i]
              var best = total
              for (i in k until brightness.size) {
                  total += brightness[i] - brightness[i - k]
                  if (total > best) best = total
              }
              return best
          }
        `,
        swift: code`
          func brightestStretch(_ brightness: [Int], _ k: Int) -> Int {
              var total = 0
              for i in 0..<k { total += brightness[i] }
              var best = total
              var i = k
              while i < brightness.count {
                  total += brightness[i] - brightness[i - k]
                  if total > best { best = total }
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn brightestStretch(brightness: Vec<i32>, k: i32) -> i32 {
              let k = k as usize;
              let mut total: i32 = brightness[..k].iter().sum();
              let mut best = total;
              for i in k..brightness.len() {
                  total += brightness[i] - brightness[i - k];
                  if total > best {
                      best = total;
                  }
              }
              best
          }
        `,
        php: code`
          function brightestStretch($brightness, $k) {
              $total = 0;
              for ($i = 0; $i < $k; $i++) $total += $brightness[$i];
              $best = $total;
              $n = count($brightness);
              for ($i = $k; $i < $n; $i++) {
                  $total += $brightness[$i] - $brightness[$i - $k];
                  if ($total > $best) $best = $total;
              }
              return $best;
          }
        `,
        ruby: code`
          def brightestStretch(brightness, k)
            total = brightness[0, k].sum
            best = total
            (k...brightness.length).each do |i|
              total += brightness[i] - brightness[i - k]
              best = total if total > best
            end
            best
          end
        `,
      },
    };
  })(),
];

/** Heap / Priority Queue — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { describe, fmtIntArr, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const HEAP_PROBLEMS: CatalogProblem[] = [

  // ── Kth Largest Element in an Array ─────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => [...nums].sort((a, b) => b - a)[k - 1];
    return {
      slug: "kth-largest-element-in-an-array",
      title: "Kth Largest Element in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Heap", "Quickselect", "Sorting"],
      signature: { funcName: "findKthLargest", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the **`k`-th largest element** (in sorted order, not the k-th distinct element).\n\nCan you solve it without fully sorting the array?",
        [
          { in: "nums = [3,2,1,5,6,4], k = 2", out: "5" },
          { in: "nums = [3,2,3,1,2,4,5,5,6], k = 4", out: "4" },
        ],
        ["1 <= k <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "A min-heap of size k keeps exactly the k largest seen so far.",
        "Quickselect gives O(n) average time without a heap.",
      ],
      examples: [
        { input: "[3,2,1,5,6,4]\n2", expectedOutput: "5" },
        { input: "[3,2,3,1,2,4,5,5,6]\n4", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -100, 100));
        const k = ri(rng, 1, nums.length);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef findKthLargest(nums: List[int], k: int) -> int:\n    heap = []\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]`,
        javascript: `var findKthLargest = function(nums, k) {\n    return nums.slice().sort(function(a, b) { return b - a; })[k - 1];\n};`,
      },
    };
  })(),

  // ── Last Stone Weight ───────────────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      const st = [...stones];
      while (st.length > 1) {
        st.sort((a, b) => a - b);
        const y = st.pop()!, x = st.pop()!;
        if (y !== x) st.push(y - x);
      }
      return st.length === 0 ? 0 : st[0];
    };
    return {
      slug: "last-stone-weight",
      title: "Last Stone Weight",
      difficulty: "EASY" as const,
      tags: ["Array", "Heap"],
      signature: { funcName: "lastStoneWeight", params: [{ name: "stones", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have stones with weights `stones[i]`. Each turn, smash the **two heaviest** stones together: equal weights destroy both; otherwise the heavier survives with weight `y - x`.\n\nReturn the weight of the last remaining stone, or `0` if none remain.",
        [
          { in: "stones = [2,7,4,1,8,1]", out: "1", note: "8&7→1, 4&2→2, 2&1→1, 1&1→0, leaving 1." },
          { in: "stones = [1]", out: "1" },
        ],
        ["1 <= stones.length <= 30", "1 <= stones[i] <= 100"]),
      hints: [
        "A max-heap gives you the two heaviest stones in O(log n).",
        "Push back the difference when it's non-zero.",
      ],
      examples: [
        { input: "[2,7,4,1,8,1]", expectedOutput: "1" },
        { input: "[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const stones = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 100));
        return { input: fmtIntArr(stones), expectedOutput: String(ref(stones)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef lastStoneWeight(stones: List[int]) -> int:\n    heap = [-s for s in stones]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        y = -heapq.heappop(heap)\n        x = -heapq.heappop(heap)\n        if y != x:\n            heapq.heappush(heap, -(y - x))\n    return -heap[0] if heap else 0`,
        javascript: `var lastStoneWeight = function(stones) {\n    const st = stones.slice();\n    while (st.length > 1) {\n        st.sort(function(a, b) { return a - b; });\n        const y = st.pop(), x = st.pop();\n        if (y !== x) st.push(y - x);\n    }\n    return st.length === 0 ? 0 : st[0];\n};`,
      },
    };
  })(),

  // ── Top K Frequent Elements (deterministic tie-break) ───────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const count = new Map<number, number>();
      for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
      return [...count.entries()]
        .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))
        .slice(0, k)
        .map((e) => e[0]);
    };
    return {
      slug: "top-k-frequent-elements",
      title: "Top K Frequent Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Heap", "Hash Table", "Bucket Sort"],
      signature: { funcName: "topKFrequent", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the `k` **most frequent** elements, ordered by frequency from highest to lowest. If two values have the same frequency, put the **smaller value first**.",
        [
          { in: "nums = [1,1,1,2,2,3], k = 2", out: "[1,2]" },
          { in: "nums = [4,4,7,7,5], k = 3", out: "[4,7,5]", note: "4 and 7 tie on frequency — smaller first." },
        ],
        ["1 <= nums.length <= 30", "-50 <= nums[i] <= 50", "k is between 1 and the number of distinct elements."]),
      hints: [
        "Count with a hash map, then pick the top k by (frequency, value).",
        "Bucket sort by frequency achieves O(n).",
      ],
      examples: [
        { input: "[1,1,1,2,2,3]\n2", expectedOutput: "[1,2]" },
        { input: "[4,4,7,7,5]\n3", expectedOutput: "[4,7,5]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -50, 50));
        const distinct = new Set(nums).size;
        const k = ri(rng, 1, distinct);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef topKFrequent(nums: List[int], k: int) -> List[int]:\n    count = Counter(nums)\n    ordered = sorted(count.items(), key=lambda e: (-e[1], e[0]))\n    return [v for v, _ in ordered[:k]]`,
        javascript: `var topKFrequent = function(nums, k) {\n    const count = new Map();\n    for (const x of nums) count.set(x, (count.get(x) || 0) + 1);\n    return Array.from(count.entries())\n        .sort(function(a, b) { return (b[1] - a[1]) || (a[0] - b[0]); })\n        .slice(0, k)\n        .map(function(e) { return e[0]; });\n};`,
      },
    };
  })(),

  // ── Sort an Array ───────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => [...nums].sort((a, b) => a - b);
    return {
      slug: "sort-an-array",
      title: "Sort an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Heap", "Divide and Conquer"],
      signature: { funcName: "sortArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, sort it in **ascending order** and return it — **without using built-in sort functions**, in `O(n log n)` time with the smallest possible extra space.\n\nImplement merge sort, heap sort, or quicksort by hand.",
        [
          { in: "nums = [5,2,3,1]", out: "[1,2,3,5]" },
          { in: "nums = [5,1,1,2,0,0]", out: "[0,0,1,1,2,5]" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Merge sort guarantees O(n log n) and is stable.",
        "Heap sort achieves O(1) extra space; quicksort needs a good pivot strategy.",
      ],
      examples: [
        { input: "[5,2,3,1]", expectedOutput: "[1,2,3,5]" },
        { input: "[5,1,1,2,0,0]", expectedOutput: "[0,0,1,1,2,5]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, -1000, 1000));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sortArray(nums: List[int]) -> List[int]:\n    if len(nums) <= 1:\n        return nums\n    mid = len(nums) // 2\n    left = sortArray(nums[:mid])\n    right = sortArray(nums[mid:])\n    out = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i])\n            i += 1\n        else:\n            out.append(right[j])\n            j += 1\n    out.extend(left[i:])\n    out.extend(right[j:])\n    return out`,
        javascript: `var sortArray = function(nums) {\n    if (nums.length <= 1) return nums;\n    const mid = nums.length >> 1;\n    const left = sortArray(nums.slice(0, mid));\n    const right = sortArray(nums.slice(mid));\n    const out = [];\n    let i = 0, j = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) out.push(left[i++]);\n        else out.push(right[j++]);\n    }\n    while (i < left.length) out.push(left[i++]);\n    while (j < right.length) out.push(right[j++]);\n    return out;\n};`,
      },
    };
  })(),

  // ── Least Number of Unique Integers after K Removals ────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      const count = new Map<number, number>();
      for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
      const freqs = [...count.values()].sort((a, b) => a - b);
      let remaining = freqs.length, budget = k;
      for (const f of freqs) {
        if (budget >= f) {
          budget -= f;
          remaining--;
        } else break;
      }
      return remaining;
    };
    return {
      slug: "least-number-of-unique-integers",
      title: "Least Number of Unique Integers after K Removals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Heap", "Greedy", "Hash Table"],
      signature: { funcName: "findLeastNumOfUniqueInts", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `arr` and an integer `k`, remove **exactly `k`** elements so that the number of **distinct** values remaining is as small as possible, and return that count.",
        [
          { in: "arr = [5,5,4], k = 1", out: "1", note: "Remove the 4; only 5 remains." },
          { in: "arr = [4,3,1,1,3,3,2], k = 3", out: "2", note: "Remove 4, 2 and one 1." },
        ],
        ["1 <= arr.length <= 30", "1 <= arr[i] <= 50", "0 <= k <= arr.length"]),
      hints: [
        "Eliminate the rarest values first — they cost the fewest removals.",
        "Sort the frequency counts ascending and consume k greedily.",
      ],
      examples: [
        { input: "[5,5,4]\n1", expectedOutput: "1" },
        { input: "[4,3,1,1,3,3,2]\n3", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const arr = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 12));
        const k = ri(rng, 0, arr.length);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef findLeastNumOfUniqueInts(arr: List[int], k: int) -> int:\n    freqs = sorted(Counter(arr).values())\n    remaining = len(freqs)\n    for f in freqs:\n        if k >= f:\n            k -= f\n            remaining -= 1\n        else:\n            break\n    return remaining`,
        javascript: `var findLeastNumOfUniqueInts = function(arr, k) {\n    const count = new Map();\n    for (const x of arr) count.set(x, (count.get(x) || 0) + 1);\n    const freqs = Array.from(count.values()).sort(function(a, b) { return a - b; });\n    let remaining = freqs.length;\n    for (const f of freqs) {\n        if (k >= f) {\n            k -= f;\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n};`,
      },
    };
  })(),

  // ── Furthest Building You Can Reach ─────────────────────────────
  (() => {
    const ref = (heights: number[], bricks: number, ladders: number) => {
      const laddered: number[] = [];
      let usedBricks = 0;
      for (let i = 0; i + 1 < heights.length; i++) {
        const diff = heights[i + 1] - heights[i];
        if (diff <= 0) continue;
        laddered.push(diff);
        laddered.sort((a, b) => a - b);
        if (laddered.length > ladders) {
          usedBricks += laddered.shift()!;
          if (usedBricks > bricks) return i;
        }
      }
      return heights.length - 1;
    };
    return {
      slug: "furthest-building-you-can-reach",
      title: "Furthest Building You Can Reach",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Heap", "Greedy"],
      signature: { funcName: "furthestBuilding", params: [{ name: "heights", type: "int[]" as const }, { name: "bricks", type: "int" as const }, { name: "ladders", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You move from building `i` to `i+1`. Going **down or level** is free; climbing up needs either **one ladder** (any height) or `heights[i+1] - heights[i]` **bricks**.\n\nStarting at building `0` with the given `bricks` and `ladders`, return the **furthest building index** you can reach.",
        [
          { in: "heights = [4,2,7,6,9,14,12], bricks = 5, ladders = 1", out: "4", note: "Bricks on +5, ladder on +3, cannot afford +5 again." },
          { in: "heights = [4,12,2,7,3,18,20,3,19], bricks = 10, ladders = 2", out: "7" },
          { in: "heights = [14,3,19,3], bricks = 17, ladders = 0", out: "3" },
        ],
        ["2 <= heights.length <= 30", "1 <= heights[i] <= 100", "0 <= bricks <= 300", "0 <= ladders <= 5"]),
      hints: [
        "Use ladders for the LARGEST climbs; a min-heap of climbs taken so far tells you which to downgrade to bricks.",
        "When the heap exceeds the ladder count, pay the smallest climb with bricks.",
      ],
      examples: [
        { input: "[4,2,7,6,9,14,12]\n5\n1", expectedOutput: "4" },
        { input: "[4,12,2,7,3,18,20,3,19]\n10\n2", expectedOutput: "7" },
        { input: "[14,3,19,3]\n17\n0", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const heights = Array.from({ length: ri(rng, 2, 30) }, () => ri(rng, 1, 100));
        const bricks = ri(rng, 0, 300);
        const ladders = ri(rng, 0, 5);
        return {
          input: `${fmtIntArr(heights)}\n${bricks}\n${ladders}`,
          expectedOutput: String(ref(heights, bricks, ladders)),
        };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef furthestBuilding(heights: List[int], bricks: int, ladders: int) -> int:\n    heap = []\n    used = 0\n    for i in range(len(heights) - 1):\n        diff = heights[i + 1] - heights[i]\n        if diff <= 0:\n            continue\n        heapq.heappush(heap, diff)\n        if len(heap) > ladders:\n            used += heapq.heappop(heap)\n            if used > bricks:\n                return i\n    return len(heights) - 1`,
        javascript: `var furthestBuilding = function(heights, bricks, ladders) {\n    const laddered = [];\n    let usedBricks = 0;\n    for (let i = 0; i + 1 < heights.length; i++) {\n        const diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        laddered.push(diff);\n        laddered.sort(function(a, b) { return a - b; });\n        if (laddered.length > ladders) {\n            usedBricks += laddered.shift();\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heights.length - 1;\n};`,
      },
    };
  })(),

  // ── Relative Ranks ──────────────────────────────────────────────
  (() => {
    const ref = (score: number[]) => {
      const order = score.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
      const out = new Array(score.length).fill("");
      const medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];
      order.forEach((e, rank) => {
        out[e.i] = rank < 3 ? medals[rank] : String(rank + 1);
      });
      return out;
    };
    return {
      slug: "relative-ranks",
      title: "Relative Ranks",
      difficulty: "EASY" as const,
      tags: ["Array", "Heap", "Sorting"],
      signature: { funcName: "findRelativeRanks", params: [{ name: "score", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        'You are given the scores of `n` athletes as an array of numeric strings (all **unique**). Ranks go to the highest scores: the top three earn `"Gold Medal"`, `"Silver Medal"`, `"Bronze Medal"`; everyone else gets their placement number as a string (`"4"`, `"5"`, …).\n\nReturn the rank of each athlete **in the input order**.',
        [
          { in: 'score = ["5","4","3","2","1"]', out: '["Gold Medal","Silver Medal","Bronze Medal","4","5"]' },
          { in: 'score = ["10","3","8","9","4"]', out: '["Gold Medal","5","Bronze Medal","Silver Medal","4"]' },
        ],
        ["1 <= score.length <= 25", "0 <= score[i] <= 100 (unique)"]),
      hints: [
        "Sort indices by score descending, then write ranks back into the original positions.",
        "Convert scores to numbers before comparing — string comparison misorders \"9\" and \"10\".",
      ],
      examples: [
        { input: '["5","4","3","2","1"]', expectedOutput: '["Gold Medal","Silver Medal","Bronze Medal","4","5"]' },
        { input: '["10","3","8","9","4"]', expectedOutput: '["Gold Medal","5","Bronze Medal","Silver Medal","4"]' },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 101 }, (_, i) => i));
        const score = pool.slice(0, ri(rng, 1, 25)).map(String);
        return { input: fmtStrArr(score), expectedOutput: JSON.stringify(ref(score.map(Number).map(String))) };
      },
      solutions: {
        python: `from typing import List\n\ndef findRelativeRanks(score: List[str]) -> List[str]:\n    nums = [int(s) for s in score]\n    order = sorted(range(len(nums)), key=lambda i: -nums[i])\n    medals = ["Gold Medal", "Silver Medal", "Bronze Medal"]\n    out = [""] * len(nums)\n    for rank, i in enumerate(order):\n        out[i] = medals[rank] if rank < 3 else str(rank + 1)\n    return out`,
        javascript: `var findRelativeRanks = function(score) {\n    const order = score\n        .map(function(s, i) { return { s: parseInt(s, 10), i: i }; })\n        .sort(function(a, b) { return b.s - a.s; });\n    const medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];\n    const out = new Array(score.length).fill("");\n    order.forEach(function(e, rank) {\n        out[e.i] = rank < 3 ? medals[rank] : String(rank + 1);\n    });\n    return out;\n};`,
      },
    };
  })(),

  // ── Sort Characters By Frequency (deterministic tie-break) ──────
  (() => {
    const ref = (s: string) => {
      const count = new Map<string, number>();
      for (const ch of s) count.set(ch, (count.get(ch) || 0) + 1);
      return [...count.entries()]
        .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))
        .map((e) => e[0].repeat(e[1]))
        .join("");
    };
    return {
      slug: "sort-characters-by-frequency",
      title: "Sort Characters By Frequency",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Heap", "Hash Table", "Bucket Sort"],
      signature: { funcName: "frequencySort", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, sort its characters by **decreasing frequency** — all copies of a character stay together. If two characters have the same frequency, the **alphabetically smaller** one comes first.\n\nReturn the sorted string.",
        [
          { in: 's = "tree"', out: '"eert"', note: "'e' appears twice; 'r' before 't' on the tie." },
          { in: 's = "cccaaa"', out: '"aaaccc"', note: "Tie on frequency 3 — 'a' first alphabetically." },
        ],
        ["1 <= s.length <= 40", "Lowercase English letters."]),
      hints: [
        "Count frequencies, then sort the distinct characters by (-count, char).",
        "Rebuild by repeating each character count times.",
      ],
      examples: [
        { input: '"tree"', expectedOutput: "eert" },
        { input: '"cccaaa"', expectedOutput: "aaaccc" },
      ],
      gen: (rng: Rng) => {
        const alpha = "abcde";
        const s = Array.from({ length: ri(rng, 1, 40) }, () => alpha[ri(rng, 0, 4)]).join("");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `from collections import Counter\n\ndef frequencySort(s: str) -> str:\n    count = Counter(s)\n    ordered = sorted(count.items(), key=lambda e: (-e[1], e[0]))\n    return "".join(ch * f for ch, f in ordered)`,
        javascript: `var frequencySort = function(s) {\n    const count = new Map();\n    for (const ch of s) count.set(ch, (count.get(ch) || 0) + 1);\n    return Array.from(count.entries())\n        .sort(function(a, b) { return (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1); })\n        .map(function(e) { return new Array(e[1] + 1).join(e[0]); })\n        .join("");\n};`,
      },
    };
  })(),

];

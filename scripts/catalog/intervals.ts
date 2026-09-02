/** Intervals & sorting-based classics (int[][] support).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const genIntervals = (rng: Rng, nMax: number, lo: number, hi: number, maxLen: number) =>
  Array.from({ length: ri(rng, 1, nMax) }, () => {
    const s = ri(rng, lo, hi);
    return [s, s + ri(rng, 0, maxLen)];
  });

export const INTERVAL_PROBLEMS: CatalogProblem[] = [

  // ── Merge Intervals ─────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[0] - b[0]);
      const out: number[][] = [];
      for (const [st, en] of s) {
        if (out.length > 0 && st <= out[out.length - 1][1]) {
          out[out.length - 1][1] = Math.max(out[out.length - 1][1], en);
        } else {
          out.push([st, en]);
        }
      }
      return out;
    };
    return {
      slug: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Intervals"],
      signature: { funcName: "merge", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array of `intervals` where `intervals[i] = [start, end]`, **merge all overlapping intervals** and return the non-overlapping intervals covering the same ranges, **sorted by start**.",
        [
          { in: "intervals = [[1,3],[2,6],[8,10],[15,18]]", out: "[[1,6],[8,10],[15,18]]", note: "[1,3] and [2,6] overlap." },
          { in: "intervals = [[1,4],[4,5]]", out: "[[1,5]]", note: "Touching intervals merge." },
        ],
        ["1 <= intervals.length <= 20", "0 <= start <= end <= 100"]),
      hints: [
        "Sort by start; overlapping intervals become adjacent.",
        "Extend the last merged interval while the next one starts before it ends.",
      ],
      examples: [
        { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
        { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" },
      ],
      gen: (rng: Rng) => {
        const intervals = genIntervals(rng, 20, 0, 90, 10);
        return { input: fmtIntMat(intervals), expectedOutput: fmtIntMat(ref(intervals)) };
      },
      solutions: {
        python: `from typing import List\n\ndef merge(intervals: List[List[int]]) -> List[List[int]]:\n    s = sorted(intervals)\n    out = []\n    for st, en in s:\n        if out and st <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], en)\n        else:\n            out.append([st, en])\n    return out`,
        javascript: `var merge = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });\n    const out = [];\n    for (const iv of s) {\n        if (out.length > 0 && iv[0] <= out[out.length - 1][1]) {\n            out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);\n        } else {\n            out.push([iv[0], iv[1]]);\n        }\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Insert Interval ─────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][], newInterval: number[]) => {
      const out: number[][] = [];
      let [ns, ne] = newInterval;
      let i = 0;
      while (i < intervals.length && intervals[i][1] < ns) out.push(intervals[i++]);
      while (i < intervals.length && intervals[i][0] <= ne) {
        ns = Math.min(ns, intervals[i][0]);
        ne = Math.max(ne, intervals[i][1]);
        i++;
      }
      out.push([ns, ne]);
      while (i < intervals.length) out.push(intervals[i++]);
      return out;
    };
    return {
      slug: "insert-interval",
      title: "Insert Interval",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Intervals"],
      signature: { funcName: "insert", params: [{ name: "intervals", type: "int[][]" as const }, { name: "newInterval", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given non-overlapping `intervals` sorted by start, and a `newInterval`. Insert `newInterval` so the result is still sorted and non-overlapping (merge where necessary), and return it.",
        [
          { in: "intervals = [[1,3],[6,9]], newInterval = [2,5]", out: "[[1,5],[6,9]]" },
          { in: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", out: "[[1,2],[3,10],[12,16]]" },
        ],
        ["0 <= intervals.length <= 20", "0 <= start <= end <= 100", "intervals is sorted and non-overlapping."]),
      hints: [
        "Three phases: intervals entirely before, the merge zone, intervals entirely after.",
        "In the merge zone, absorb every interval that overlaps the growing new interval.",
      ],
      examples: [
        { input: "[[1,3],[6,9]]\n[2,5]", expectedOutput: "[[1,5],[6,9]]" },
        { input: "[[1,2],[3,5],[6,7],[8,10],[12,16]]\n[4,8]", expectedOutput: "[[1,2],[3,10],[12,16]]" },
      ],
      gen: (rng: Rng) => {
        // Build sorted non-overlapping intervals.
        const intervals: number[][] = [];
        let cursor = ri(rng, 0, 5);
        const count = ri(rng, 0, 12);
        for (let i = 0; i < count && cursor < 95; i++) {
          const st = cursor + ri(rng, 1, 4);
          const en = st + ri(rng, 0, 6);
          intervals.push([st, en]);
          cursor = en;
        }
        const ns = ri(rng, 0, 90);
        const newInterval = [ns, ns + ri(rng, 0, 15)];
        return { input: `${fmtIntMat(intervals)}\n${fmtIntArr(newInterval)}`, expectedOutput: fmtIntMat(ref(intervals, newInterval)) };
      },
      solutions: {
        python: `from typing import List\n\ndef insert(intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:\n    out = []\n    ns, ne = newInterval\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < ns:\n        out.append(intervals[i])\n        i += 1\n    while i < n and intervals[i][0] <= ne:\n        ns = min(ns, intervals[i][0])\n        ne = max(ne, intervals[i][1])\n        i += 1\n    out.append([ns, ne])\n    while i < n:\n        out.append(intervals[i])\n        i += 1\n    return out`,
        javascript: `var insert = function(intervals, newInterval) {\n    const out = [];\n    let ns = newInterval[0], ne = newInterval[1];\n    let i = 0;\n    while (i < intervals.length && intervals[i][1] < ns) out.push(intervals[i++]);\n    while (i < intervals.length && intervals[i][0] <= ne) {\n        ns = Math.min(ns, intervals[i][0]);\n        ne = Math.max(ne, intervals[i][1]);\n        i++;\n    }\n    out.push([ns, ne]);\n    while (i < intervals.length) out.push(intervals[i++]);\n    return out;\n};`,
      },
    };
  })(),

  // ── Non-overlapping Intervals ───────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[1] - b[1]);
      let kept = 0, end = -Infinity;
      for (const [st, en] of s) {
        if (st >= end) {
          kept++;
          end = en;
        }
      }
      return intervals.length - kept;
    };
    return {
      slug: "non-overlapping-intervals",
      title: "Non-overlapping Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Intervals"],
      signature: { funcName: "eraseOverlapIntervals", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of `intervals`, return the **minimum number of intervals to remove** so the rest are non-overlapping (intervals touching only at a point do not overlap).",
        [
          { in: "intervals = [[1,2],[2,3],[3,4],[1,3]]", out: "1", note: "Remove [1,3]." },
          { in: "intervals = [[1,2],[1,2],[1,2]]", out: "2" },
        ],
        ["1 <= intervals.length <= 20", "-50 <= start < end <= 50"]),
      hints: [
        "Equivalent to keeping the MAXIMUM number of non-overlapping intervals.",
        "Greedy: sort by end time and always keep the interval that ends earliest.",
      ],
      examples: [
        { input: "[[1,2],[2,3],[3,4],[1,3]]", expectedOutput: "1" },
        { input: "[[1,2],[1,2],[1,2]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, -50, 45);
          return [s, s + ri(rng, 1, 10)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      solutions: {
        python: `from typing import List\n\ndef eraseOverlapIntervals(intervals: List[List[int]]) -> int:\n    s = sorted(intervals, key=lambda iv: iv[1])\n    kept = 0\n    end = float("-inf")\n    for st, en in s:\n        if st >= end:\n            kept += 1\n            end = en\n    return len(intervals) - kept`,
        javascript: `var eraseOverlapIntervals = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[1] - b[1]; });\n    let kept = 0, end = -Infinity;\n    for (const iv of s) {\n        if (iv[0] >= end) {\n            kept++;\n            end = iv[1];\n        }\n    }\n    return intervals.length - kept;\n};`,
      },
    };
  })(),

  // ── Meeting Rooms ───────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < s.length; i++) {
        if (s[i][0] < s[i - 1][1]) return false;
      }
      return true;
    };
    return {
      slug: "meeting-rooms",
      title: "Meeting Rooms",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Intervals"],
      signature: { funcName: "canAttendMeetings", params: [{ name: "intervals", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array of meeting time `intervals` (`[start, end)`), determine whether a person could **attend all meetings** — i.e. no two meetings overlap (a meeting may start exactly when another ends).",
        [
          { in: "intervals = [[0,30],[5,10],[15,20]]", out: "false" },
          { in: "intervals = [[7,10],[2,4]]", out: "true" },
        ],
        ["0 <= intervals.length <= 20", "0 <= start < end <= 100"]),
      hints: [
        "Sort by start time.",
        "Any meeting starting before the previous one ends is a conflict.",
      ],
      examples: [
        { input: "[[0,30],[5,10],[15,20]]", expectedOutput: "false" },
        { input: "[[7,10],[2,4]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 0, 20) }, () => {
          const s = ri(rng, 0, 90);
          return [s, s + ri(rng, 1, 10)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: bool(ref(intervals)) };
      },
      solutions: {
        python: `from typing import List\n\ndef canAttendMeetings(intervals: List[List[int]]) -> bool:\n    s = sorted(intervals)\n    for i in range(1, len(s)):\n        if s[i][0] < s[i - 1][1]:\n            return False\n    return True`,
        javascript: `var canAttendMeetings = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });\n    for (let i = 1; i < s.length; i++) {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n};`,
      },
    };
  })(),

  // ── Meeting Rooms II ────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const events: Array<[number, number]> = [];
      for (const [s, e] of intervals) {
        events.push([s, 1], [e, -1]);
      }
      events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let cur = 0, best = 0;
      for (const [, d] of events) {
        cur += d;
        best = Math.max(best, cur);
      }
      return best;
    };
    return {
      slug: "meeting-rooms-ii",
      title: "Meeting Rooms II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Heap", "Intervals"],
      signature: { funcName: "minMeetingRooms", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of meeting time `intervals` (`[start, end)`), return the **minimum number of conference rooms** required to host them all. A room freed at time `t` can host a meeting starting at `t`.",
        [
          { in: "intervals = [[0,30],[5,10],[15,20]]", out: "2" },
          { in: "intervals = [[7,10],[2,4]]", out: "1" },
        ],
        ["1 <= intervals.length <= 20", "0 <= start < end <= 100"]),
      hints: [
        "Think of +1 events at starts and -1 events at ends on a timeline.",
        "Sort events (ends before starts at the same time); the running sum's peak is the answer.",
      ],
      examples: [
        { input: "[[0,30],[5,10],[15,20]]", expectedOutput: "2" },
        { input: "[[7,10],[2,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, 0, 90);
          return [s, s + ri(rng, 1, 15)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minMeetingRooms(intervals: List[List[int]]) -> int:\n    events = []\n    for s, e in intervals:\n        events.append((s, 1))\n        events.append((e, -1))\n    events.sort()\n    cur = 0\n    best = 0\n    for _, d in events:\n        cur += d\n        best = max(best, cur)\n    return best`,
        javascript: `var minMeetingRooms = function(intervals) {\n    const events = [];\n    for (const iv of intervals) {\n        events.push([iv[0], 1], [iv[1], -1]);\n    }\n    events.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1]; });\n    let cur = 0, best = 0;\n    for (const e of events) {\n        cur += e[1];\n        best = Math.max(best, cur);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Minimum Number of Arrows to Burst Balloons ──────────────────
  (() => {
    const ref = (points: number[][]) => {
      const s = [...points].sort((a, b) => a[1] - b[1]);
      let arrows = 0, x = -Infinity;
      for (const [st, en] of s) {
        if (st > x) {
          arrows++;
          x = en;
        }
      }
      return arrows;
    };
    return {
      slug: "minimum-number-of-arrows",
      title: "Minimum Number of Arrows to Burst Balloons",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Intervals"],
      signature: { funcName: "findMinArrowShots", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Balloons are horizontal segments `points[i] = [xstart, xend]`. An arrow shot vertically at `x` bursts every balloon with `xstart <= x <= xend`.\n\nReturn the **minimum number of arrows** to burst all balloons.",
        [
          { in: "points = [[10,16],[2,8],[1,6],[7,12]]", out: "2", note: "Arrows at x=6 and x=11." },
          { in: "points = [[1,2],[3,4],[5,6],[7,8]]", out: "4" },
        ],
        ["1 <= points.length <= 20", "-100 <= xstart <= xend <= 100"]),
      hints: [
        "Sort by right end; shoot at the first balloon's right edge.",
        "That arrow bursts every balloon starting before it — repeat for the rest.",
      ],
      examples: [
        { input: "[[10,16],[2,8],[1,6],[7,12]]", expectedOutput: "2" },
        { input: "[[1,2],[3,4],[5,6],[7,8]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const points = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, -100, 90);
          return [s, s + ri(rng, 0, 20)];
        });
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMinArrowShots(points: List[List[int]]) -> int:\n    s = sorted(points, key=lambda p: p[1])\n    arrows = 0\n    x = float("-inf")\n    for st, en in s:\n        if st > x:\n            arrows += 1\n            x = en\n    return arrows`,
        javascript: `var findMinArrowShots = function(points) {\n    const s = points.slice().sort(function(a, b) { return a[1] - b[1]; });\n    let arrows = 0, x = -Infinity;\n    for (const p of s) {\n        if (p[0] > x) {\n            arrows++;\n            x = p[1];\n        }\n    }\n    return arrows;\n};`,
      },
    };
  })(),

  // ── Interval List Intersections ─────────────────────────────────
  (() => {
    const ref = (firstList: number[][], secondList: number[][]) => {
      const out: number[][] = [];
      let i = 0, j = 0;
      while (i < firstList.length && j < secondList.length) {
        const lo = Math.max(firstList[i][0], secondList[j][0]);
        const hi = Math.min(firstList[i][1], secondList[j][1]);
        if (lo <= hi) out.push([lo, hi]);
        if (firstList[i][1] < secondList[j][1]) i++;
        else j++;
      }
      return out;
    };
    const genSortedDisjoint = (rng: Rng) => {
      const out: number[][] = [];
      let cursor = ri(rng, 0, 5);
      const count = ri(rng, 0, 10);
      for (let k = 0; k < count && cursor < 95; k++) {
        const st = cursor + ri(rng, 1, 5);
        const en = st + ri(rng, 0, 8);
        out.push([st, en]);
        cursor = en;
      }
      return out;
    };
    return {
      slug: "interval-list-intersections",
      title: "Interval List Intersections",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Intervals"],
      signature: { funcName: "intervalIntersection", params: [{ name: "firstList", type: "int[][]" as const }, { name: "secondList", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given two lists of **closed** intervals, each sorted and pairwise disjoint. Return the **intersection** of the two lists — every interval common to both.",
        [
          { in: "firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]", out: "[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]" },
          { in: "firstList = [[1,3],[5,9]], secondList = []", out: "[]" },
        ],
        ["0 <= list lengths <= 12", "0 <= start <= end <= 100", "Each list is sorted and disjoint."]),
      hints: [
        "Two pointers: intersect the current pair as [max(starts), min(ends)].",
        "Advance the pointer of the interval that ends first.",
      ],
      examples: [
        { input: "[[0,2],[5,10],[13,23],[24,25]]\n[[1,5],[8,12],[15,24],[25,26]]", expectedOutput: "[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]" },
        { input: "[[1,3],[5,9]]\n[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = genSortedDisjoint(rng);
        const b = genSortedDisjoint(rng);
        return { input: `${fmtIntMat(a)}\n${fmtIntMat(b)}`, expectedOutput: fmtIntMat(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef intervalIntersection(firstList: List[List[int]], secondList: List[List[int]]) -> List[List[int]]:\n    out = []\n    i = j = 0\n    while i < len(firstList) and j < len(secondList):\n        lo = max(firstList[i][0], secondList[j][0])\n        hi = min(firstList[i][1], secondList[j][1])\n        if lo <= hi:\n            out.append([lo, hi])\n        if firstList[i][1] < secondList[j][1]:\n            i += 1\n        else:\n            j += 1\n    return out`,
        javascript: `var intervalIntersection = function(firstList, secondList) {\n    const out = [];\n    let i = 0, j = 0;\n    while (i < firstList.length && j < secondList.length) {\n        const lo = Math.max(firstList[i][0], secondList[j][0]);\n        const hi = Math.min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) out.push([lo, hi]);\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Car Pooling ─────────────────────────────────────────────────
  (() => {
    const ref = (trips: number[][], capacity: number) => {
      const diff = new Array(102).fill(0);
      for (const [num, from, to] of trips) {
        diff[from] += num;
        diff[to] -= num;
      }
      let cur = 0;
      for (const d of diff) {
        cur += d;
        if (cur > capacity) return false;
      }
      return true;
    };
    return {
      slug: "car-pooling",
      title: "Car Pooling",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Intervals", "Sorting"],
      signature: { funcName: "carPooling", params: [{ name: "trips", type: "int[][]" as const }, { name: "capacity", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A car with `capacity` seats drives east only. `trips[i] = [numPassengers, from, to]` picks up passengers at `from` and drops them at `to`.\n\nReturn `true` if all trips can be completed without ever exceeding capacity.",
        [
          { in: "trips = [[2,1,5],[3,3,7]], capacity = 4", out: "false" },
          { in: "trips = [[2,1,5],[3,3,7]], capacity = 5", out: "true" },
        ],
        ["1 <= trips.length <= 20", "1 <= numPassengers <= 10", "0 <= from < to <= 100", "1 <= capacity <= 30"]),
      hints: [
        "Difference array over positions: +num at pickup, -num at drop-off.",
        "The running prefix sum is the passenger count at each kilometer.",
      ],
      examples: [
        { input: "[[2,1,5],[3,3,7]]\n4", expectedOutput: "false" },
        { input: "[[2,1,5],[3,3,7]]\n5", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const trips = Array.from({ length: ri(rng, 1, 20) }, () => {
          const from = ri(rng, 0, 95);
          return [ri(rng, 1, 10), from, from + ri(rng, 1, 5)];
        });
        const capacity = ri(rng, 1, 30);
        return { input: `${fmtIntMat(trips)}\n${capacity}`, expectedOutput: bool(ref(trips, capacity)) };
      },
      solutions: {
        python: `from typing import List\n\ndef carPooling(trips: List[List[int]], capacity: int) -> bool:\n    diff = [0] * 102\n    for num, frm, to in trips:\n        diff[frm] += num\n        diff[to] -= num\n    cur = 0\n    for d in diff:\n        cur += d\n        if cur > capacity:\n            return False\n    return True`,
        javascript: `var carPooling = function(trips, capacity) {\n    const diff = new Array(102).fill(0);\n    for (const t of trips) {\n        diff[t[1]] += t[0];\n        diff[t[2]] -= t[0];\n    }\n    let cur = 0;\n    for (const d of diff) {\n        cur += d;\n        if (cur > capacity) return false;\n    }\n    return true;\n};`,
      },
    };
  })(),

  // ── Summary Ranges ──────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: string[] = [];
      let i = 0;
      while (i < nums.length) {
        let j = i;
        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
        out.push(i === j ? String(nums[i]) : `${nums[i]}->${nums[j]}`);
        i = j + 1;
      }
      return out;
    };
    return {
      slug: "summary-ranges",
      title: "Summary Ranges",
      difficulty: "EASY" as const,
      tags: ["Array"],
      signature: { funcName: "summaryRanges", params: [{ name: "nums", type: "int[]" as const }], returns: "string[]" as const },
      description: describe(
        'Given a **sorted, unique** integer array `nums`, return the smallest sorted list of ranges covering exactly the numbers in the array. Format each range as `"a->b"`, or `"a"` when the range is a single number.',
        [
          { in: "nums = [0,1,2,4,5,7]", out: '["0->2","4->5","7"]' },
          { in: "nums = [0,2,3,4,6,8,9]", out: '["0","2->4","6","8->9"]' },
        ],
        ["0 <= nums.length <= 20", "-100 <= nums[i] <= 100", "Sorted, all values unique."]),
      hints: [
        "Walk forward while consecutive numbers differ by exactly 1.",
        "Emit a->b for runs longer than one, else just a.",
      ],
      examples: [
        { input: "[0,1,2,4,5,7]", expectedOutput: '["0->2","4->5","7"]' },
        { input: "[0,2,3,4,6,8,9]", expectedOutput: '["0","2->4","6","8->9"]' },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 201 }, (_, i) => i - 100));
        const nums = pool.slice(0, ri(rng, 0, 20)).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtStrArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef summaryRanges(nums: List[int]) -> List[str]:\n    out = []\n    i = 0\n    while i < len(nums):\n        j = i\n        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:\n            j += 1\n        out.append(str(nums[i]) if i == j else f"{nums[i]}->{nums[j]}")\n        i = j + 1\n    return out`,
        javascript: `var summaryRanges = function(nums) {\n    const out = [];\n    let i = 0;\n    while (i < nums.length) {\n        let j = i;\n        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;\n        out.push(i === j ? String(nums[i]) : nums[i] + "->" + nums[j]);\n        i = j + 1;\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── 3Sum ────────────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => a - b);
      const out: number[][] = [];
      for (let i = 0; i < s.length - 2; i++) {
        if (i > 0 && s[i] === s[i - 1]) continue;
        let l = i + 1, r = s.length - 1;
        while (l < r) {
          const sum = s[i] + s[l] + s[r];
          if (sum === 0) {
            out.push([s[i], s[l], s[r]]);
            while (l < r && s[l] === s[l + 1]) l++;
            while (l < r && s[r] === s[r - 1]) r--;
            l++;
            r--;
          } else if (sum < 0) l++;
          else r--;
        }
      }
      return out;
    };
    return {
      slug: "3sum",
      title: "3Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "threeSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an integer array `nums`, return **all unique triplets** `[a, b, c]` with `a + b + c = 0` (using three different indices).\n\nEach triplet must be sorted in **ascending order**, and the list of triplets sorted **lexicographically**.",
        [
          { in: "nums = [-1,0,1,2,-1,-4]", out: "[[-1,-1,2],[-1,0,1]]" },
          { in: "nums = [0,1,1]", out: "[]" },
          { in: "nums = [0,0,0]", out: "[[0,0,0]]" },
        ],
        ["0 <= nums.length <= 20", "-25 <= nums[i] <= 25"]),
      hints: [
        "Sort first — that makes both deduplication and ordering natural.",
        "Fix the smallest element, then two-pointer the remainder for the pair summing to its negation.",
      ],
      examples: [
        { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
        { input: "[0,1,1]", expectedOutput: "[]" },
        { input: "[0,0,0]", expectedOutput: "[[0,0,0]]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 0, 20) }, () => ri(rng, -25, 25));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef threeSum(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n    for i in range(len(s) - 2):\n        if i > 0 and s[i] == s[i - 1]:\n            continue\n        l, r = i + 1, len(s) - 1\n        while l < r:\n            total = s[i] + s[l] + s[r]\n            if total == 0:\n                out.append([s[i], s[l], s[r]])\n                while l < r and s[l] == s[l + 1]:\n                    l += 1\n                while l < r and s[r] == s[r - 1]:\n                    r -= 1\n                l += 1\n                r -= 1\n            elif total < 0:\n                l += 1\n            else:\n                r -= 1\n    return out`,
        javascript: `var threeSum = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    for (let i = 0; i < s.length - 2; i++) {\n        if (i > 0 && s[i] === s[i - 1]) continue;\n        let l = i + 1, r = s.length - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (sum === 0) {\n                out.push([s[i], s[l], s[r]]);\n                while (l < r && s[l] === s[l + 1]) l++;\n                while (l < r && s[r] === s[r - 1]) r--;\n                l++;\n                r--;\n            } else if (sum < 0) {\n                l++;\n            } else {\n                r--;\n            }\n        }\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── 3Sum Closest (unique answer guaranteed) ─────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const s = [...nums].sort((a, b) => a - b);
      let best = s[0] + s[1] + s[2];
      for (let i = 0; i < s.length - 2; i++) {
        let l = i + 1, r = s.length - 1;
        while (l < r) {
          const sum = s[i] + s[l] + s[r];
          if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;
          if (sum === target) return sum;
          if (sum < target) l++;
          else r--;
        }
      }
      return best;
    };
    const uniqueClosest = (nums: number[], target: number) => {
      const sums = new Set<number>();
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++)
          for (let k = j + 1; k < nums.length; k++)
            sums.add(nums[i] + nums[j] + nums[k]);
      let bestDist = Infinity, count = 0;
      for (const s of sums) {
        const d = Math.abs(s - target);
        if (d < bestDist) { bestDist = d; count = 1; }
        else if (d === bestDist) count++;
      }
      return count === 1;
    };
    return {
      slug: "3sum-closest",
      title: "3Sum Closest",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "threeSumClosest", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `target`, find three numbers in `nums` whose sum is **closest to `target`** and return that sum. Each input has **exactly one** closest sum.",
        [
          { in: "nums = [-1,2,1,-4], target = 1", out: "2", note: "(-1 + 2 + 1) = 2." },
          { in: "nums = [0,0,0], target = 1", out: "0" },
        ],
        ["3 <= nums.length <= 12", "-20 <= nums[i] <= 20", "-60 <= target <= 60"]),
      hints: [
        "Sort, fix one element, two-pointer the rest — like 3Sum but tracking the closest sum.",
        "Early-exit when the sum hits the target exactly.",
      ],
      examples: [
        { input: "[-1,2,1,-4]\n1", expectedOutput: "2" },
        { input: "[0,0,0]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        for (let attempt = 0; attempt < 80; attempt++) {
          const nums = Array.from({ length: ri(rng, 3, 12) }, () => ri(rng, -20, 20));
          const target = ri(rng, -60, 60);
          if (uniqueClosest(nums, target)) {
            return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
          }
        }
        return { input: "[-1,2,1,-4]\n1", expectedOutput: "2" };
      },
      solutions: {
        python: `from typing import List\n\ndef threeSumClosest(nums: List[int], target: int) -> int:\n    s = sorted(nums)\n    best = s[0] + s[1] + s[2]\n    for i in range(len(s) - 2):\n        l, r = i + 1, len(s) - 1\n        while l < r:\n            total = s[i] + s[l] + s[r]\n            if abs(total - target) < abs(best - target):\n                best = total\n            if total == target:\n                return total\n            if total < target:\n                l += 1\n            else:\n                r -= 1\n    return best`,
        javascript: `var threeSumClosest = function(nums, target) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    let best = s[0] + s[1] + s[2];\n    for (let i = 0; i < s.length - 2; i++) {\n        let l = i + 1, r = s.length - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;\n            if (sum === target) return sum;\n            if (sum < target) l++;\n            else r--;\n        }\n    }\n    return best;\n};`,
      },
    };
  })(),

];

/** Heap / Priority Queue — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { describe, explain, fmtIntArr, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "You do not need the whole array in order — only the element that would land in one particular slot. Two ways to get it without a full sort: keep a **min-heap of size k**, which by construction always holds the k largest values seen so far with the k-th largest sitting on top; or run **quickselect**, which partitions around a pivot and recurses into only the side that contains the answer.",
        steps: [
          "Heap approach: push each value into a min-heap; whenever the heap grows past `k`, pop the smallest.",
          "After the scan the heap holds exactly the `k` largest values, and its root is the k-th largest.",
          "Quickselect approach: partition around a pivot, then recurse only into the half that contains index `n - k`.",
          "At these input sizes (`n <= 30`) simply sorting and indexing `n - k` is also entirely reasonable, which is what most of the reference solutions below do.",
        ],
        why: "The min-heap holds a running set of \"best k so far\". Popping the smallest whenever the size exceeds `k` can never discard a value that belongs in the final top `k`, because anything discarded is smaller than `k` other values already seen. So the invariant survives to the end, and the root — the minimum of the top `k` — is precisely the k-th largest.",
        time: "O(n log k) with a heap, O(n) average with quickselect",
        space: "O(k)",
        pitfalls: [
          "This is the k-th largest **by position in sorted order**, not the k-th distinct value — duplicates each occupy a slot.",
          "After sorting ascending the answer is at index `n - k`, not `k` or `k - 1`. Off-by-one here is the classic mistake.",
          "Use a **min**-heap for the k largest. A max-heap of size k keeps the wrong end.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef findKthLargest(nums: List[int], k: int) -> int:\n    heap = []\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]`,
        javascript: `var findKthLargest = function(nums, k) {\n    return nums.slice().sort(function(a, b) { return b - a; })[k - 1];\n};`,
              typescript: `function findKthLargest(nums: number[], k: number): number {\n    const s = nums.slice().sort(function (a, b) { return a - b; });\n    return s[s.length - k];\n}`,
              java: `public static int findKthLargest(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    return s[s.length - k];\n}`,
              cpp: `int findKthLargest(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    return s[(int) s.size() - k];\n}`,
              c: `static int cmpKthAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findKthLargest(int* nums, int numsSize, int k) {\n    int* s = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpKthAsc);\n    int r = s[numsSize - k];\n    free(s);\n    return r;\n}`,
              csharp: `public static int FindKthLargest(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    return s[s.Length - k];\n}`,
              go: `func findKthLargest(nums []int, k int) int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	return s[len(s)-k]\n}`,
              kotlin: `fun findKthLargest(nums: IntArray, k: Int): Int {\n    val s = nums.sortedArray()\n    return s[s.size - k]\n}`,
              swift: `func findKthLargest(_ nums: [Int], _ k: Int) -> Int {\n    let s = nums.sorted()\n    return s[s.count - k]\n}`,
              rust: `fn findKthLargest(nums: Vec<i32>, k: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    s[s.len() - k as usize]\n}`,
              php: `function findKthLargest($nums, $k) {\n    $s = $nums;\n    sort($s);\n    return $s[count($s) - $k];\n}`,
              ruby: `def findKthLargest(nums, k)\n  s = nums.sort\n  s[s.length - k]\nend`,
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
      editorial: explain({
        idea: "The rules always ask for the two heaviest stones, and the smash puts a new stone back into the pile. That is exactly what a **max-heap** is for: it hands you the largest in `O(log n)` and absorbs the new stone just as cheaply. Simulate the process literally.",
        steps: [
          "Put every stone into a max-heap.",
          "While at least two stones remain, pop the two largest, `y` then `x` (so `y >= x`).",
          "If they are equal, both are destroyed — push nothing back.",
          "Otherwise push `y - x`, the surviving fragment.",
          "When fewer than two stones remain, return the last one, or `0` if the pile is empty.",
        ],
        why: "The process is fully determined — at every turn the pair to smash is forced — so a direct simulation cannot go wrong; the only question is how fast you can find the two heaviest. Each turn removes two stones and adds at most one, so the pile shrinks by at least one per turn and the loop always terminates in at most `n` rounds.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The pile can end up **empty**, not just with one stone — the answer is `0` in that case, and indexing blindly will crash.",
          "Push the difference back only when it is non-zero; pushing a `0` stone corrupts later rounds.",
          "Order matters when subtracting: it is `y - x` with `y` the larger, never the other way round.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef lastStoneWeight(stones: List[int]) -> int:\n    heap = [-s for s in stones]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        y = -heapq.heappop(heap)\n        x = -heapq.heappop(heap)\n        if y != x:\n            heapq.heappush(heap, -(y - x))\n    return -heap[0] if heap else 0`,
        javascript: `var lastStoneWeight = function(stones) {\n    const st = stones.slice();\n    while (st.length > 1) {\n        st.sort(function(a, b) { return a - b; });\n        const y = st.pop(), x = st.pop();\n        if (y !== x) st.push(y - x);\n    }\n    return st.length === 0 ? 0 : st[0];\n};`,
              typescript: `function lastStoneWeight(stones: number[]): number {\n    const st = stones.slice();\n    while (st.length > 1) {\n        st.sort(function (a, b) { return a - b; });\n        const y = st.pop() as number;\n        const x = st.pop() as number;\n        if (y !== x) st.push(y - x);\n    }\n    return st.length === 0 ? 0 : st[0];\n}`,
              java: `public static int lastStoneWeight(int[] stones) {\n    PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());\n    for (int s : stones) heap.add(s);\n    while (heap.size() > 1) {\n        int y = heap.poll();\n        int x = heap.poll();\n        if (y != x) heap.add(y - x);\n    }\n    return heap.isEmpty() ? 0 : heap.peek();\n}`,
              cpp: `int lastStoneWeight(vector<int>& stones) {\n    priority_queue<int> heap(stones.begin(), stones.end());\n    while (heap.size() > 1) {\n        int y = heap.top();\n        heap.pop();\n        int x = heap.top();\n        heap.pop();\n        if (y != x) heap.push(y - x);\n    }\n    return heap.empty() ? 0 : heap.top();\n}`,
              c: `int lastStoneWeight(int* stones, int stonesSize) {\n    int n = stonesSize;\n    int* st = (int*) malloc((n + 1) * sizeof(int));\n    for (int i = 0; i < n; i++) st[i] = stones[i];\n    int len = n;\n    while (len > 1) {\n        int i1 = 0;\n        for (int i = 1; i < len; i++) if (st[i] > st[i1]) i1 = i;\n        int y = st[i1];\n        st[i1] = st[len - 1];\n        len--;\n        int i2 = 0;\n        for (int i = 1; i < len; i++) if (st[i] > st[i2]) i2 = i;\n        int x = st[i2];\n        st[i2] = st[len - 1];\n        len--;\n        if (y != x) st[len++] = y - x;\n    }\n    int r = (len == 0) ? 0 : st[0];\n    free(st);\n    return r;\n}`,
              csharp: `public static int LastStoneWeight(int[] stones)\n{\n    var st = new List<int>(stones);\n    while (st.Count > 1)\n    {\n        st.Sort();\n        int y = st[st.Count - 1];\n        st.RemoveAt(st.Count - 1);\n        int x = st[st.Count - 1];\n        st.RemoveAt(st.Count - 1);\n        if (y != x) st.Add(y - x);\n    }\n    return st.Count == 0 ? 0 : st[0];\n}`,
              go: `func lastStoneWeight(stones []int) int {\n	st := append([]int{}, stones...)\n	for len(st) > 1 {\n		sort.Ints(st)\n		y := st[len(st)-1]\n		x := st[len(st)-2]\n		st = st[:len(st)-2]\n		if y != x {\n			st = append(st, y-x)\n		}\n	}\n	if len(st) == 0 {\n		return 0\n	}\n	return st[0]\n}`,
              kotlin: `fun lastStoneWeight(stones: IntArray): Int {\n    val st = stones.toMutableList()\n    while (st.size > 1) {\n        st.sort()\n        val y = st.removeAt(st.size - 1)\n        val x = st.removeAt(st.size - 1)\n        if (y != x) st.add(y - x)\n    }\n    return if (st.isEmpty()) 0 else st[0]\n}`,
              swift: `func lastStoneWeight(_ stones: [Int]) -> Int {\n    var st = stones\n    while st.count > 1 {\n        st.sort()\n        let y = st.removeLast()\n        let x = st.removeLast()\n        if y != x { st.append(y - x) }\n    }\n    return st.isEmpty ? 0 : st[0]\n}`,
              rust: `fn lastStoneWeight(stones: Vec<i32>) -> i32 {\n    let mut st = stones.clone();\n    while st.len() > 1 {\n        st.sort();\n        let y = st.pop().unwrap();\n        let x = st.pop().unwrap();\n        if y != x {\n            st.push(y - x);\n        }\n    }\n    if st.is_empty() { 0 } else { st[0] }\n}`,
              php: `function lastStoneWeight($stones) {\n    $st = $stones;\n    while (count($st) > 1) {\n        sort($st);\n        $y = array_pop($st);\n        $x = array_pop($st);\n        if ($y !== $x) array_push($st, $y - $x);\n    }\n    return count($st) === 0 ? 0 : $st[0];\n}`,
              ruby: `def lastStoneWeight(stones)\n  st = stones.dup\n  while st.length > 1\n    st.sort!\n    y = st.pop\n    x = st.pop\n    st.push(y - x) if y != x\n  end\n  st.empty? ? 0 : st[0]\nend`,
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
      editorial: explain({
        idea: "Two independent steps. First count occurrences with a hash map — that collapses the array to at most one entry per distinct value. Then pick the best `k` entries under the ordering the problem defines: frequency descending, and on a tie the smaller value first.",
        steps: [
          "Sweep the array once, incrementing a counter per value.",
          "Collect the distinct values.",
          "Sort them by `(-frequency, value)` — highest frequency first, and ascending value as the tie-break.",
          "Return the first `k`.",
        ],
        why: "Counting is exact and order-independent, so after the first sweep the frequencies are final. The comparator then encodes the required ordering completely: the primary key selects by popularity, and the secondary key removes the ambiguity between equally frequent values, making the output uniquely determined. With `O(d log d)` for `d` distinct values this is fast enough; a bucket sort indexed by frequency would make the selection step linear.",
        time: "O(n + d log d)",
        space: "O(d)",
        pitfalls: [
          "The tie-break is mandatory here. Without it two equally frequent values may come out in either order and the answer becomes non-deterministic.",
          "Sort the **distinct** values, not the original array.",
          "Frequency is descending while the tie-break is ascending — mixing the directions up is easy in a single comparator.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef topKFrequent(nums: List[int], k: int) -> List[int]:\n    count = Counter(nums)\n    ordered = sorted(count.items(), key=lambda e: (-e[1], e[0]))\n    return [v for v, _ in ordered[:k]]`,
        javascript: `var topKFrequent = function(nums, k) {\n    const count = new Map();\n    for (const x of nums) count.set(x, (count.get(x) || 0) + 1);\n    return Array.from(count.entries())\n        .sort(function(a, b) { return (b[1] - a[1]) || (a[0] - b[0]); })\n        .slice(0, k)\n        .map(function(e) { return e[0]; });\n};`,
              typescript: `function topKFrequent(nums: number[], k: number): number[] {\n    const count: { [v: number]: number } = {};\n    const values: number[] = [];\n    for (let i = 0; i < nums.length; i++) {\n        const v = nums[i];\n        if (count[v] === undefined) {\n            count[v] = 0;\n            values.push(v);\n        }\n        count[v]++;\n    }\n    values.sort(function (a, b) {\n        if (count[b] !== count[a]) return count[b] - count[a];\n        return a - b;\n    });\n    return values.slice(0, k);\n}`,
              java: `public static int[] topKFrequent(int[] nums, int k) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    List<Integer> values = new ArrayList<>(count.keySet());\n    Collections.sort(values, (a, b) -> {\n        int fa = count.get(a);\n        int fb = count.get(b);\n        if (fa != fb) return fb - fa;\n        return a - b;\n    });\n    int[] out = new int[k];\n    for (int i = 0; i < k; i++) out[i] = values.get(i);\n    return out;\n}`,
              cpp: `vector<int> topKFrequent(vector<int>& nums, int k) {\n    map<int, int> count;\n    for (int x : nums) count[x]++;\n    vector<pair<int, int>> items(count.begin(), count.end());\n    sort(items.begin(), items.end(), [](const pair<int, int>& a, const pair<int, int>& b) {\n        if (a.second != b.second) return a.second > b.second;\n        return a.first < b.first;\n    });\n    vector<int> out;\n    for (int i = 0; i < k && i < (int) items.size(); i++) out.push_back(items[i].first);\n    return out;\n}`,
              c: `int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {\n    int count[201];\n    for (int i = 0; i < 201; i++) count[i] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i] + 100]++;\n    int* out = (int*) malloc((k > 0 ? k : 1) * sizeof(int));\n    int written = 0;\n    while (written < k) {\n        int best = -1;\n        for (int i = 0; i < 201; i++) {\n            if (count[i] == 0) continue;\n            if (best == -1 || count[i] > count[best]) best = i;\n        }\n        if (best == -1) break;\n        out[written++] = best - 100;\n        count[best] = 0;\n    }\n    *returnSize = written;\n    return out;\n}`,
              csharp: `public static int[] TopKFrequent(int[] nums, int k)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        if (!count.ContainsKey(x)) count[x] = 0;\n        count[x]++;\n    }\n    var values = new List<int>(count.Keys);\n    values.Sort((a, b) =>\n    {\n        if (count[a] != count[b]) return count[b].CompareTo(count[a]);\n        return a.CompareTo(b);\n    });\n    var res = new int[k];\n    for (int i = 0; i < k; i++) res[i] = values[i];\n    return res;\n}`,
              go: `func topKFrequent(nums []int, k int) []int {\n	count := map[int]int{}\n	for _, x := range nums {\n		count[x]++\n	}\n	values := []int{}\n	for v := range count {\n		values = append(values, v)\n	}\n	sort.Slice(values, func(a, b int) bool {\n		if count[values[a]] != count[values[b]] {\n			return count[values[a]] > count[values[b]]\n		}\n		return values[a] < values[b]\n	})\n	return values[:k]\n}`,
              kotlin: `fun topKFrequent(nums: IntArray, k: Int): IntArray {\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    val values = count.keys.sortedWith(compareByDescending<Int> { count[it] }.thenBy { it })\n    return values.take(k).toIntArray()\n}`,
              swift: `func topKFrequent(_ nums: [Int], _ k: Int) -> [Int] {\n    var count: [Int: Int] = [:]\n    for x in nums { count[x, default: 0] += 1 }\n    let values = count.keys.sorted { a, b in\n        let fa = count[a]!\n        let fb = count[b]!\n        if fa != fb { return fa > fb }\n        return a < b\n    }\n    return Array(values.prefix(k))\n}`,
              rust: `fn topKFrequent(nums: Vec<i32>, k: i32) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in nums.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut values: Vec<i32> = count.keys().cloned().collect();\n    values.sort_by(|a, b| {\n        let fa = count[a];\n        let fb = count[b];\n        if fa != fb { fb.cmp(&fa) } else { a.cmp(b) }\n    });\n    values.truncate(k as usize);\n    values\n}`,
              php: `function topKFrequent($nums, $k) {\n    $count = array();\n    foreach ($nums as $x) {\n        if (!array_key_exists($x, $count)) $count[$x] = 0;\n        $count[$x]++;\n    }\n    $values = array_keys($count);\n    usort($values, function($a, $b) use ($count) {\n        if ($count[$a] !== $count[$b]) return $count[$b] - $count[$a];\n        return $a - $b;\n    });\n    return array_slice($values, 0, $k);\n}`,
              ruby: `def topKFrequent(nums, k)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  count.keys.sort_by { |v| [-count[v], v] }.first(k)\nend`,
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
      editorial: explain({
        idea: "The task is to write the sort itself. **Merge sort** is the safest choice under the constraints: it is `O(n log n)` in the worst case with no dependence on the input's shape, unlike quicksort, whose naive pivot choice degrades to `O(n^2)` on already-sorted or adversarial data.",
        steps: [
          "An array of length 0 or 1 is already sorted — return it.",
          "Split the array at the midpoint into two halves.",
          "Sort each half recursively.",
          "Merge: walk both sorted halves with one index each, repeatedly taking the smaller front element.",
          "When one half runs out, append everything left in the other.",
        ],
        why: "Merging two sorted sequences is correct because the smallest unplaced element overall is always at the front of one of the two halves — nothing behind it in its own half is smaller, and the comparison covers the other half. Each level of recursion does `O(n)` merging work and the depth is `log n`, giving `O(n log n)` regardless of input order. Taking the left element on ties (`<=`) also makes the sort stable.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Do not forget to drain the remaining half after the main merge loop ends — dropping it silently loses elements.",
          "Use `<=` rather than `<` when comparing fronts to keep the sort stable.",
          "Recursing on a half that is not strictly smaller than the original (an off-by-one at the midpoint) gives infinite recursion.",
          "Quicksort with a fixed first-element pivot passes small random tests but degrades badly on sorted input; if you go that route, pick the pivot randomly or use median-of-three.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef sortArray(nums: List[int]) -> List[int]:\n    if len(nums) <= 1:\n        return nums\n    mid = len(nums) // 2\n    left = sortArray(nums[:mid])\n    right = sortArray(nums[mid:])\n    out = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i])\n            i += 1\n        else:\n            out.append(right[j])\n            j += 1\n    out.extend(left[i:])\n    out.extend(right[j:])\n    return out`,
        javascript: `var sortArray = function(nums) {\n    if (nums.length <= 1) return nums;\n    const mid = nums.length >> 1;\n    const left = sortArray(nums.slice(0, mid));\n    const right = sortArray(nums.slice(mid));\n    const out = [];\n    let i = 0, j = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) out.push(left[i++]);\n        else out.push(right[j++]);\n    }\n    while (i < left.length) out.push(left[i++]);\n    while (j < right.length) out.push(right[j++]);\n    return out;\n};`,
              typescript: `function sortArray(nums: number[]): number[] {\n    if (nums.length <= 1) return nums.slice();\n    const mid = nums.length >> 1;\n    const left = sortArray(nums.slice(0, mid));\n    const right = sortArray(nums.slice(mid));\n    const out: number[] = [];\n    let i = 0;\n    let j = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) out.push(left[i++]);\n        else out.push(right[j++]);\n    }\n    while (i < left.length) out.push(left[i++]);\n    while (j < right.length) out.push(right[j++]);\n    return out;\n}`,
              java: `public static int[] sortArray(int[] nums) {\n    if (nums.length <= 1) return nums.clone();\n    int mid = nums.length / 2;\n    int[] left = sortArray(Arrays.copyOfRange(nums, 0, mid));\n    int[] right = sortArray(Arrays.copyOfRange(nums, mid, nums.length));\n    int[] out = new int[nums.length];\n    int i = 0, j = 0, p = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) out[p++] = left[i++];\n        else out[p++] = right[j++];\n    }\n    while (i < left.length) out[p++] = left[i++];\n    while (j < right.length) out[p++] = right[j++];\n    return out;\n}`,
              cpp: `vector<int> sortArray(vector<int>& nums) {\n    if (nums.size() <= 1) return nums;\n    int mid = (int) nums.size() / 2;\n    vector<int> leftPart(nums.begin(), nums.begin() + mid);\n    vector<int> rightPart(nums.begin() + mid, nums.end());\n    vector<int> left = sortArray(leftPart);\n    vector<int> right = sortArray(rightPart);\n    vector<int> out;\n    size_t i = 0, j = 0;\n    while (i < left.size() && j < right.size()) {\n        if (left[i] <= right[j]) out.push_back(left[i++]);\n        else out.push_back(right[j++]);\n    }\n    while (i < left.size()) out.push_back(left[i++]);\n    while (j < right.size()) out.push_back(right[j++]);\n    return out;\n}`,
              c: `static void mergeSortRec(int* a, int* tmp, int lo, int hi) {\n    if (hi - lo <= 1) return;\n    int mid = lo + (hi - lo) / 2;\n    mergeSortRec(a, tmp, lo, mid);\n    mergeSortRec(a, tmp, mid, hi);\n    int i = lo, j = mid, p = lo;\n    while (i < mid && j < hi) {\n        if (a[i] <= a[j]) tmp[p++] = a[i++];\n        else tmp[p++] = a[j++];\n    }\n    while (i < mid) tmp[p++] = a[i++];\n    while (j < hi) tmp[p++] = a[j++];\n    for (int t = lo; t < hi; t++) a[t] = tmp[t];\n}\n\nint* sortArray(int* nums, int numsSize, int* returnSize) {\n    int* a = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    int* tmp = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    mergeSortRec(a, tmp, 0, numsSize);\n    free(tmp);\n    *returnSize = numsSize;\n    return a;\n}`,
              csharp: `public static int[] SortArray(int[] nums)\n{\n    if (nums.Length <= 1) return (int[]) nums.Clone();\n    int mid = nums.Length / 2;\n    int[] leftIn = new int[mid];\n    int[] rightIn = new int[nums.Length - mid];\n    Array.Copy(nums, 0, leftIn, 0, mid);\n    Array.Copy(nums, mid, rightIn, 0, nums.Length - mid);\n    int[] left = SortArray(leftIn);\n    int[] right = SortArray(rightIn);\n    int[] res = new int[nums.Length];\n    int i = 0, j = 0, p = 0;\n    while (i < left.Length && j < right.Length)\n    {\n        if (left[i] <= right[j]) res[p++] = left[i++];\n        else res[p++] = right[j++];\n    }\n    while (i < left.Length) res[p++] = left[i++];\n    while (j < right.Length) res[p++] = right[j++];\n    return res;\n}`,
              go: `func sortArray(nums []int) []int {\n	if len(nums) <= 1 {\n		return append([]int{}, nums...)\n	}\n	mid := len(nums) / 2\n	left := sortArray(nums[:mid])\n	right := sortArray(nums[mid:])\n	out := make([]int, 0, len(nums))\n	i, j := 0, 0\n	for i < len(left) && j < len(right) {\n		if left[i] <= right[j] {\n			out = append(out, left[i])\n			i++\n		} else {\n			out = append(out, right[j])\n			j++\n		}\n	}\n	for i < len(left) {\n		out = append(out, left[i])\n		i++\n	}\n	for j < len(right) {\n		out = append(out, right[j])\n		j++\n	}\n	return out\n}`,
              kotlin: `fun sortArray(nums: IntArray): IntArray {\n    if (nums.size <= 1) return nums.copyOf()\n    val mid = nums.size / 2\n    val left = sortArray(nums.copyOfRange(0, mid))\n    val right = sortArray(nums.copyOfRange(mid, nums.size))\n    val out = IntArray(nums.size)\n    var i = 0\n    var j = 0\n    var p = 0\n    while (i < left.size && j < right.size) {\n        if (left[i] <= right[j]) out[p++] = left[i++] else out[p++] = right[j++]\n    }\n    while (i < left.size) out[p++] = left[i++]\n    while (j < right.size) out[p++] = right[j++]\n    return out\n}`,
              swift: `func sortArray(_ nums: [Int]) -> [Int] {\n    if nums.count <= 1 { return nums }\n    let mid = nums.count / 2\n    let left = sortArray(Array(nums[0..<mid]))\n    let right = sortArray(Array(nums[mid...]))\n    var out: [Int] = []\n    var i = 0\n    var j = 0\n    while i < left.count && j < right.count {\n        if left[i] <= right[j] {\n            out.append(left[i])\n            i += 1\n        } else {\n            out.append(right[j])\n            j += 1\n        }\n    }\n    while i < left.count {\n        out.append(left[i])\n        i += 1\n    }\n    while j < right.count {\n        out.append(right[j])\n        j += 1\n    }\n    return out\n}`,
              rust: `fn sortArray(nums: Vec<i32>) -> Vec<i32> {\n    if nums.len() <= 1 {\n        return nums;\n    }\n    let mid = nums.len() / 2;\n    let left = sortArray(nums[0..mid].to_vec());\n    let right = sortArray(nums[mid..].to_vec());\n    let mut out: Vec<i32> = Vec::with_capacity(nums.len());\n    let mut i = 0;\n    let mut j = 0;\n    while i < left.len() && j < right.len() {\n        if left[i] <= right[j] {\n            out.push(left[i]);\n            i += 1;\n        } else {\n            out.push(right[j]);\n            j += 1;\n        }\n    }\n    while i < left.len() {\n        out.push(left[i]);\n        i += 1;\n    }\n    while j < right.len() {\n        out.push(right[j]);\n        j += 1;\n    }\n    out\n}`,
              php: `function sortArray($nums) {\n    $n = count($nums);\n    if ($n <= 1) return $nums;\n    $mid = intdiv($n, 2);\n    $left = sortArray(array_slice($nums, 0, $mid));\n    $right = sortArray(array_slice($nums, $mid));\n    $out = array();\n    $i = 0;\n    $j = 0;\n    $ln = count($left);\n    $rn = count($right);\n    while ($i < $ln && $j < $rn) {\n        if ($left[$i] <= $right[$j]) { $out[] = $left[$i]; $i++; }\n        else { $out[] = $right[$j]; $j++; }\n    }\n    while ($i < $ln) { $out[] = $left[$i]; $i++; }\n    while ($j < $rn) { $out[] = $right[$j]; $j++; }\n    return $out;\n}`,
              ruby: `def sortArray(nums)\n  return nums if nums.length <= 1\n  mid = nums.length / 2\n  left = sortArray(nums[0...mid])\n  right = sortArray(nums[mid..-1])\n  out = []\n  i = 0\n  j = 0\n  while i < left.length && j < right.length\n    if left[i] <= right[j]\n      out.push(left[i])\n      i += 1\n    else\n      out.push(right[j])\n      j += 1\n    end\n  end\n  while i < left.length\n    out.push(left[i])\n    i += 1\n  end\n  while j < right.length\n    out.push(right[j])\n    j += 1\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "Removing a value entirely costs exactly as many deletions as its frequency, and removing only *some* copies of a value buys you nothing — the value still counts as distinct. So the whole problem is: with a budget of `k`, eliminate as many values as possible, and the cheapest values to eliminate are the rarest ones.",
        steps: [
          "Count how many times each value occurs.",
          "Collect the frequencies and sort them **ascending**.",
          "Walk them from smallest to largest, spending `k` on each frequency you can afford in full and decrementing the count of distinct values.",
          "Stop at the first frequency you cannot pay for — everything after it is at least as expensive.",
          "Return the number of distinct values still standing.",
        ],
        why: "This is a classic exchange argument. Take any optimal solution that eliminates a set of values; if it skips a cheaper value in favour of a dearer one, swapping them keeps the same number of values eliminated and frees budget, so it is no worse. Repeating the swap turns any optimum into the greedy \"cheapest first\" order — so greedy is optimal. Partial removals are provably wasted, because spending on copies without finishing a value does not reduce the distinct count.",
        time: "O(n + d log d)",
        space: "O(d)",
        pitfalls: [
          "You must be able to afford a frequency **in full** before eliminating it; a partial spend does not reduce the answer and just wastes budget.",
          "Sort the frequencies ascending, not the values.",
          "`k` may be `0`, and it may be large enough to remove everything — both must fall out of the loop naturally.",
          "Break out of the loop at the first unaffordable frequency; continuing to scan can wrongly skip past it to a coincidentally cheaper one (there isn't one once sorted, but the logic must not rely on that).",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef findLeastNumOfUniqueInts(arr: List[int], k: int) -> int:\n    freqs = sorted(Counter(arr).values())\n    remaining = len(freqs)\n    for f in freqs:\n        if k >= f:\n            k -= f\n            remaining -= 1\n        else:\n            break\n    return remaining`,
        javascript: `var findLeastNumOfUniqueInts = function(arr, k) {\n    const count = new Map();\n    for (const x of arr) count.set(x, (count.get(x) || 0) + 1);\n    const freqs = Array.from(count.values()).sort(function(a, b) { return a - b; });\n    let remaining = freqs.length;\n    for (const f of freqs) {\n        if (k >= f) {\n            k -= f;\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n};`,
              typescript: `function findLeastNumOfUniqueInts(arr: number[], k: number): number {\n    const count: { [v: number]: number } = {};\n    for (let i = 0; i < arr.length; i++) {\n        const v = arr[i];\n        count[v] = (count[v] === undefined ? 0 : count[v]) + 1;\n    }\n    const freqs: number[] = [];\n    for (const key in count) freqs.push(count[key]);\n    freqs.sort(function (a, b) { return a - b; });\n    let remaining = freqs.length;\n    let budget = k;\n    for (let i = 0; i < freqs.length; i++) {\n        if (budget >= freqs[i]) {\n            budget -= freqs[i];\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n}`,
              java: `public static int findLeastNumOfUniqueInts(int[] arr, int k) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : arr) count.put(x, count.getOrDefault(x, 0) + 1);\n    List<Integer> freqs = new ArrayList<>(count.values());\n    Collections.sort(freqs);\n    int remaining = freqs.size();\n    int budget = k;\n    for (int f : freqs) {\n        if (budget >= f) {\n            budget -= f;\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n}`,
              cpp: `int findLeastNumOfUniqueInts(vector<int>& arr, int k) {\n    map<int, int> count;\n    for (int x : arr) count[x]++;\n    vector<int> freqs;\n    for (const auto& e : count) freqs.push_back(e.second);\n    sort(freqs.begin(), freqs.end());\n    int remaining = (int) freqs.size();\n    int budget = k;\n    for (int f : freqs) {\n        if (budget >= f) {\n            budget -= f;\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n}`,
              c: `static int cmpFreqAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findLeastNumOfUniqueInts(int* arr, int arrSize, int k) {\n    int count[64];\n    for (int i = 0; i < 64; i++) count[i] = 0;\n    for (int i = 0; i < arrSize; i++) count[arr[i]]++;\n    int freqs[64];\n    int m = 0;\n    for (int i = 0; i < 64; i++) if (count[i] > 0) freqs[m++] = count[i];\n    qsort(freqs, m, sizeof(int), cmpFreqAsc);\n    int remaining = m;\n    int budget = k;\n    for (int i = 0; i < m; i++) {\n        if (budget >= freqs[i]) {\n            budget -= freqs[i];\n            remaining--;\n        } else {\n            break;\n        }\n    }\n    return remaining;\n}`,
              csharp: `public static int FindLeastNumOfUniqueInts(int[] arr, int k)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in arr)\n    {\n        if (!count.ContainsKey(x)) count[x] = 0;\n        count[x]++;\n    }\n    var freqs = new List<int>(count.Values);\n    freqs.Sort();\n    int remaining = freqs.Count;\n    int budget = k;\n    foreach (int f in freqs)\n    {\n        if (budget >= f)\n        {\n            budget -= f;\n            remaining--;\n        }\n        else\n        {\n            break;\n        }\n    }\n    return remaining;\n}`,
              go: `func findLeastNumOfUniqueInts(arr []int, k int) int {\n	count := map[int]int{}\n	for _, x := range arr {\n		count[x]++\n	}\n	freqs := []int{}\n	for _, f := range count {\n		freqs = append(freqs, f)\n	}\n	sort.Ints(freqs)\n	remaining := len(freqs)\n	budget := k\n	for _, f := range freqs {\n		if budget >= f {\n			budget -= f\n			remaining--\n		} else {\n			break\n		}\n	}\n	return remaining\n}`,
              kotlin: `fun findLeastNumOfUniqueInts(arr: IntArray, k: Int): Int {\n    val count = HashMap<Int, Int>()\n    for (x in arr) count[x] = (count[x] ?: 0) + 1\n    val freqs = count.values.sorted()\n    var remaining = freqs.size\n    var budget = k\n    for (f in freqs) {\n        if (budget >= f) {\n            budget -= f\n            remaining--\n        } else {\n            break\n        }\n    }\n    return remaining\n}`,
              swift: `func findLeastNumOfUniqueInts(_ arr: [Int], _ k: Int) -> Int {\n    var count: [Int: Int] = [:]\n    for x in arr { count[x, default: 0] += 1 }\n    let freqs = count.values.sorted()\n    var remaining = freqs.count\n    var budget = k\n    for f in freqs {\n        if budget >= f {\n            budget -= f\n            remaining -= 1\n        } else {\n            break\n        }\n    }\n    return remaining\n}`,
              rust: `fn findLeastNumOfUniqueInts(arr: Vec<i32>, k: i32) -> i32 {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in arr.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut freqs: Vec<i32> = count.values().cloned().collect();\n    freqs.sort();\n    let mut remaining = freqs.len() as i32;\n    let mut budget = k;\n    for f in freqs.iter() {\n        if budget >= *f {\n            budget -= *f;\n            remaining -= 1;\n        } else {\n            break;\n        }\n    }\n    remaining\n}`,
              php: `function findLeastNumOfUniqueInts($arr, $k) {\n    $count = array();\n    foreach ($arr as $x) {\n        if (!array_key_exists($x, $count)) $count[$x] = 0;\n        $count[$x]++;\n    }\n    $freqs = array_values($count);\n    sort($freqs);\n    $remaining = count($freqs);\n    $budget = $k;\n    foreach ($freqs as $f) {\n        if ($budget >= $f) {\n            $budget -= $f;\n            $remaining--;\n        } else {\n            break;\n        }\n    }\n    return $remaining;\n}`,
              ruby: `def findLeastNumOfUniqueInts(arr, k)\n  count = Hash.new(0)\n  arr.each { |x| count[x] += 1 }\n  freqs = count.values.sort\n  remaining = freqs.length\n  budget = k\n  freqs.each do |f|\n    if budget >= f\n      budget -= f\n      remaining -= 1\n    else\n      break\n    end\n  end\n  remaining\nend`,
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
      editorial: explain({
        idea: "Ladders are unconditional but scarce, so they should be spent on the **largest** climbs. The catch is that you cannot know which climbs are largest until you have seen them. The fix is to be optimistic: give every climb a ladder as you meet it, and when you have handed out more ladders than you own, take the ladder back from the *smallest* climb so far and pay for that one with bricks instead.",
        steps: [
          "Walk the buildings in order and compute each climb `heights[i+1] - heights[i]`; a non-positive climb is free, so skip it.",
          "Push the climb into a **min-heap** — provisionally, it gets a ladder.",
          "If the heap now holds more climbs than you have ladders, pop the smallest and pay it with bricks.",
          "If the bricks spent ever exceed your supply, you could not make that step: return `i`, the last building you reached.",
          "Surviving the whole walk means you reach the final building, index `n - 1`.",
        ],
        why: "At every point the heap contains exactly the `ladders` largest climbs seen so far, and every other positive climb has been paid with bricks. That is optimal for the prefix: any other assignment either uses a ladder on a smaller climb — which can be swapped for a bigger one without spending more bricks — or wastes bricks on a climb a spare ladder could cover. Since the assignment is optimal at every prefix, the first step where bricks run out is genuinely the first unreachable one.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Downgrade the **smallest** climb in the heap to bricks, never the current one — the current climb may well be the biggest you have seen.",
          "Skip climbs that go down or stay level; charging for them wastes the whole budget.",
          "Return `i` (the building you are standing on), not `i + 1`, when the bricks run out.",
          "The test is `usedBricks > bricks` — spending exactly all your bricks is still a success.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef furthestBuilding(heights: List[int], bricks: int, ladders: int) -> int:\n    heap = []\n    used = 0\n    for i in range(len(heights) - 1):\n        diff = heights[i + 1] - heights[i]\n        if diff <= 0:\n            continue\n        heapq.heappush(heap, diff)\n        if len(heap) > ladders:\n            used += heapq.heappop(heap)\n            if used > bricks:\n                return i\n    return len(heights) - 1`,
        javascript: `var furthestBuilding = function(heights, bricks, ladders) {\n    const laddered = [];\n    let usedBricks = 0;\n    for (let i = 0; i + 1 < heights.length; i++) {\n        const diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        laddered.push(diff);\n        laddered.sort(function(a, b) { return a - b; });\n        if (laddered.length > ladders) {\n            usedBricks += laddered.shift();\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heights.length - 1;\n};`,
              typescript: `function furthestBuilding(heights: number[], bricks: number, ladders: number): number {\n    const climbs: number[] = [];\n    let usedBricks = 0;\n    for (let i = 0; i + 1 < heights.length; i++) {\n        const diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        climbs.push(diff);\n        climbs.sort(function (a, b) { return a - b; });\n        if (climbs.length > ladders) {\n            usedBricks += climbs.shift() as number;\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heights.length - 1;\n}`,
              java: `public static int furthestBuilding(int[] heights, int bricks, int ladders) {\n    PriorityQueue<Integer> heap = new PriorityQueue<>();\n    int usedBricks = 0;\n    for (int i = 0; i + 1 < heights.length; i++) {\n        int diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        heap.add(diff);\n        if (heap.size() > ladders) {\n            usedBricks += heap.poll();\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heights.length - 1;\n}`,
              cpp: `int furthestBuilding(vector<int>& heights, int bricks, int ladders) {\n    priority_queue<int, vector<int>, greater<int>> heap;\n    int usedBricks = 0;\n    for (int i = 0; i + 1 < (int) heights.size(); i++) {\n        int diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        heap.push(diff);\n        if ((int) heap.size() > ladders) {\n            usedBricks += heap.top();\n            heap.pop();\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return (int) heights.size() - 1;\n}`,
              c: `int furthestBuilding(int* heights, int heightsSize, int bricks, int ladders) {\n    int climbs[64];\n    int m = 0;\n    int usedBricks = 0;\n    for (int i = 0; i + 1 < heightsSize; i++) {\n        int diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        int p = m;\n        while (p > 0 && climbs[p - 1] > diff) {\n            climbs[p] = climbs[p - 1];\n            p--;\n        }\n        climbs[p] = diff;\n        m++;\n        if (m > ladders) {\n            usedBricks += climbs[0];\n            for (int t = 1; t < m; t++) climbs[t - 1] = climbs[t];\n            m--;\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heightsSize - 1;\n}`,
              csharp: `public static int FurthestBuilding(int[] heights, int bricks, int ladders)\n{\n    var climbs = new List<int>();\n    int usedBricks = 0;\n    for (int i = 0; i + 1 < heights.Length; i++)\n    {\n        int diff = heights[i + 1] - heights[i];\n        if (diff <= 0) continue;\n        climbs.Add(diff);\n        climbs.Sort();\n        if (climbs.Count > ladders)\n        {\n            usedBricks += climbs[0];\n            climbs.RemoveAt(0);\n            if (usedBricks > bricks) return i;\n        }\n    }\n    return heights.Length - 1;\n}`,
              go: `func furthestBuilding(heights []int, bricks int, ladders int) int {\n	climbs := []int{}\n	usedBricks := 0\n	for i := 0; i+1 < len(heights); i++ {\n		diff := heights[i+1] - heights[i]\n		if diff <= 0 {\n			continue\n		}\n		climbs = append(climbs, diff)\n		sort.Ints(climbs)\n		if len(climbs) > ladders {\n			usedBricks += climbs[0]\n			climbs = climbs[1:]\n			if usedBricks > bricks {\n				return i\n			}\n		}\n	}\n	return len(heights) - 1\n}`,
              kotlin: `fun furthestBuilding(heights: IntArray, bricks: Int, ladders: Int): Int {\n    val climbs = mutableListOf<Int>()\n    var usedBricks = 0\n    for (i in 0 until heights.size - 1) {\n        val diff = heights[i + 1] - heights[i]\n        if (diff <= 0) continue\n        climbs.add(diff)\n        climbs.sort()\n        if (climbs.size > ladders) {\n            usedBricks += climbs.removeAt(0)\n            if (usedBricks > bricks) return i\n        }\n    }\n    return heights.size - 1\n}`,
              swift: `func furthestBuilding(_ heights: [Int], _ bricks: Int, _ ladders: Int) -> Int {\n    var climbs: [Int] = []\n    var usedBricks = 0\n    for i in 0..<(heights.count - 1) {\n        let diff = heights[i + 1] - heights[i]\n        if diff <= 0 { continue }\n        climbs.append(diff)\n        climbs.sort()\n        if climbs.count > ladders {\n            usedBricks += climbs.removeFirst()\n            if usedBricks > bricks { return i }\n        }\n    }\n    return heights.count - 1\n}`,
              rust: `fn furthestBuilding(heights: Vec<i32>, bricks: i32, ladders: i32) -> i32 {\n    let mut climbs: Vec<i32> = Vec::new();\n    let mut used_bricks = 0;\n    for i in 0..(heights.len() - 1) {\n        let diff = heights[i + 1] - heights[i];\n        if diff <= 0 {\n            continue;\n        }\n        climbs.push(diff);\n        climbs.sort();\n        if climbs.len() as i32 > ladders {\n            used_bricks += climbs.remove(0);\n            if used_bricks > bricks {\n                return i as i32;\n            }\n        }\n    }\n    (heights.len() - 1) as i32\n}`,
              php: `function furthestBuilding($heights, $bricks, $ladders) {\n    $climbs = array();\n    $usedBricks = 0;\n    $n = count($heights);\n    for ($i = 0; $i + 1 < $n; $i++) {\n        $diff = $heights[$i + 1] - $heights[$i];\n        if ($diff <= 0) continue;\n        $climbs[] = $diff;\n        sort($climbs);\n        if (count($climbs) > $ladders) {\n            $usedBricks += array_shift($climbs);\n            if ($usedBricks > $bricks) return $i;\n        }\n    }\n    return $n - 1;\n}`,
              ruby: `def furthestBuilding(heights, bricks, ladders)\n  climbs = []\n  used_bricks = 0\n  (0...(heights.length - 1)).each do |i|\n    diff = heights[i + 1] - heights[i]\n    next if diff <= 0\n    climbs.push(diff)\n    climbs.sort!\n    if climbs.length > ladders\n      used_bricks += climbs.shift\n      return i if used_bricks > bricks\n    end\n  end\n  heights.length - 1\nend`,
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
      editorial: explain({
        idea: "Ranking is about *order*, but the answer must come back in *input order*. Sorting the scores themselves loses the connection to each athlete, so sort an array of **indices** instead, ordered by score descending. Position `r` in that sorted list tells you the athlete at that index finished `r + 1`-th.",
        steps: [
          "Convert each score string to a number.",
          "Build the index list `0, 1, ..., n-1` and sort it by score **descending**.",
          "Walk that sorted list. The athlete at sorted position `r` has rank `r + 1`.",
          "Write the medal for `r = 0, 1, 2` and the string `r + 1` otherwise — writing it back at the athlete's **original** index.",
          "Return the result array, which is already in input order.",
        ],
        why: "Sorting indices rather than values keeps each score attached to the athlete it belongs to, so writing the answer back at the original index restores the required output order for free. Because the scores are guaranteed unique, the descending sort is a strict total order and every rank is unambiguous.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Compare scores **numerically**. The input arrives as strings, and lexicographic comparison puts `\"9\"` above `\"10\"`.",
          "Ranks are 1-based while sorted positions are 0-based — the non-medal answer is `r + 1`.",
          "Write results at the original index, not sequentially, or the output ends up in ranked order rather than input order.",
          "Fewer than three athletes is normal; the medal branch must not read past the end of the medal list.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findRelativeRanks(score: List[str]) -> List[str]:\n    nums = [int(s) for s in score]\n    order = sorted(range(len(nums)), key=lambda i: -nums[i])\n    medals = ["Gold Medal", "Silver Medal", "Bronze Medal"]\n    out = [""] * len(nums)\n    for rank, i in enumerate(order):\n        out[i] = medals[rank] if rank < 3 else str(rank + 1)\n    return out`,
        javascript: `var findRelativeRanks = function(score) {\n    const order = score\n        .map(function(s, i) { return { s: parseInt(s, 10), i: i }; })\n        .sort(function(a, b) { return b.s - a.s; });\n    const medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];\n    const out = new Array(score.length).fill("");\n    order.forEach(function(e, rank) {\n        out[e.i] = rank < 3 ? medals[rank] : String(rank + 1);\n    });\n    return out;\n};`,
              typescript: `function findRelativeRanks(score: string[]): string[] {\n    const idx: number[] = [];\n    for (let i = 0; i < score.length; i++) idx.push(i);\n    idx.sort(function (a, b) { return parseInt(score[b], 10) - parseInt(score[a], 10); });\n    const medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];\n    const out: string[] = [];\n    for (let i = 0; i < score.length; i++) out.push("");\n    for (let rank = 0; rank < idx.length; rank++) {\n        out[idx[rank]] = rank < 3 ? medals[rank] : String(rank + 1);\n    }\n    return out;\n}`,
              java: `public static String[] findRelativeRanks(String[] score) {\n    int n = score.length;\n    Integer[] idx = new Integer[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Arrays.sort(idx, (a, b) -> Integer.parseInt(score[b]) - Integer.parseInt(score[a]));\n    String[] medals = {"Gold Medal", "Silver Medal", "Bronze Medal"};\n    String[] out = new String[n];\n    for (int rank = 0; rank < n; rank++) {\n        out[idx[rank]] = rank < 3 ? medals[rank] : String.valueOf(rank + 1);\n    }\n    return out;\n}`,
              cpp: `vector<string> findRelativeRanks(vector<string>& score) {\n    int n = (int) score.size();\n    vector<int> idx(n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    sort(idx.begin(), idx.end(), [&score](int a, int b) {\n        return stoi(score[a]) > stoi(score[b]);\n    });\n    string medals[3] = {"Gold Medal", "Silver Medal", "Bronze Medal"};\n    vector<string> out(n);\n    for (int rank = 0; rank < n; rank++) {\n        out[idx[rank]] = rank < 3 ? medals[rank] : to_string(rank + 1);\n    }\n    return out;\n}`,
              c: `char** findRelativeRanks(char** score, int scoreSize, int* returnSize) {\n    int n = scoreSize;\n    int* vals = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int* idx = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        vals[i] = atoi(score[i]);\n        idx[i] = i;\n    }\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (vals[idx[j]] > vals[idx[i]]) {\n                int t = idx[i];\n                idx[i] = idx[j];\n                idx[j] = t;\n            }\n        }\n    }\n    const char* medals[3] = {"Gold Medal", "Silver Medal", "Bronze Medal"};\n    char** out = (char**) malloc((n > 0 ? n : 1) * sizeof(char*));\n    for (int rank = 0; rank < n; rank++) {\n        char* buf = (char*) malloc(24);\n        if (rank < 3) strcpy(buf, medals[rank]);\n        else sprintf(buf, "%d", rank + 1);\n        out[idx[rank]] = buf;\n    }\n    free(vals);\n    free(idx);\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static string[] FindRelativeRanks(string[] score)\n{\n    int n = score.Length;\n    int[] idx = new int[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Array.Sort(idx, (a, b) => int.Parse(score[b]).CompareTo(int.Parse(score[a])));\n    string[] medals = { "Gold Medal", "Silver Medal", "Bronze Medal" };\n    string[] res = new string[n];\n    for (int rank = 0; rank < n; rank++)\n    {\n        res[idx[rank]] = rank < 3 ? medals[rank] : (rank + 1).ToString();\n    }\n    return res;\n}`,
              go: `func findRelativeRanks(score []string) []string {\n	n := len(score)\n	vals := make([]int, n)\n	idx := make([]int, n)\n	for i := 0; i < n; i++ {\n		vals[i], _ = strconv.Atoi(score[i])\n		idx[i] = i\n	}\n	sort.Slice(idx, func(a, b int) bool { return vals[idx[a]] > vals[idx[b]] })\n	medals := []string{"Gold Medal", "Silver Medal", "Bronze Medal"}\n	out := make([]string, n)\n	for rank := 0; rank < n; rank++ {\n		if rank < 3 {\n			out[idx[rank]] = medals[rank]\n		} else {\n			out[idx[rank]] = strconv.Itoa(rank + 1)\n		}\n	}\n	return out\n}`,
              kotlin: `fun findRelativeRanks(score: Array<String>): Array<String> {\n    val n = score.size\n    val idx = (0 until n).sortedByDescending { score[it].toInt() }\n    val medals = arrayOf("Gold Medal", "Silver Medal", "Bronze Medal")\n    val out = Array(n) { "" }\n    for (rank in 0 until n) {\n        out[idx[rank]] = if (rank < 3) medals[rank] else (rank + 1).toString()\n    }\n    return out\n}`,
              swift: `func findRelativeRanks(_ score: [String]) -> [String] {\n    let n = score.count\n    let idx = (0..<n).sorted { Int(score[$0])! > Int(score[$1])! }\n    let medals = ["Gold Medal", "Silver Medal", "Bronze Medal"]\n    var out = [String](repeating: "", count: n)\n    for rank in 0..<n {\n        out[idx[rank]] = rank < 3 ? medals[rank] : String(rank + 1)\n    }\n    return out\n}`,
              rust: `fn findRelativeRanks(score: Vec<String>) -> Vec<String> {\n    let n = score.len();\n    let vals: Vec<i32> = score.iter().map(|s| s.parse::<i32>().unwrap()).collect();\n    let mut idx: Vec<usize> = (0..n).collect();\n    idx.sort_by(|a, b| vals[*b].cmp(&vals[*a]));\n    let medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];\n    let mut out: Vec<String> = vec![String::new(); n];\n    for rank in 0..n {\n        out[idx[rank]] = if rank < 3 { String::from(medals[rank]) } else { (rank + 1).to_string() };\n    }\n    out\n}`,
              php: `function findRelativeRanks($score) {\n    $n = count($score);\n    $idx = range(0, $n - 1);\n    usort($idx, function($a, $b) use ($score) { return intval($score[$b]) - intval($score[$a]); });\n    $medals = array("Gold Medal", "Silver Medal", "Bronze Medal");\n    $out = array_fill(0, $n, "");\n    for ($rank = 0; $rank < $n; $rank++) {\n        $out[$idx[$rank]] = $rank < 3 ? $medals[$rank] : strval($rank + 1);\n    }\n    return $out;\n}`,
              ruby: `def findRelativeRanks(score)\n  n = score.length\n  idx = (0...n).sort_by { |i| -score[i].to_i }\n  medals = ["Gold Medal", "Silver Medal", "Bronze Medal"]\n  out = Array.new(n, "")\n  (0...n).each do |rank|\n    out[idx[rank]] = rank < 3 ? medals[rank] : (rank + 1).to_s\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "Characters only matter in bulk here — every copy of a letter ends up adjacent — so collapse the string to a frequency table first. The answer is then just the distinct characters written out in the right order, each repeated its count times.",
        steps: [
          "Count how often each character appears.",
          "Collect the distinct characters.",
          "Sort them by `(-frequency, character)`: most frequent first, alphabetically ascending on a tie.",
          "Build the result by repeating each character its frequency times, in that order.",
        ],
        why: "Since all copies of a character must be contiguous, the output is completely determined by the *order of the distinct characters* — the rest is mechanical repetition. The comparator fixes that order uniquely: frequency decides, and the alphabetical tie-break removes the remaining freedom, so there is exactly one valid answer and this produces it.",
        time: "O(n + d log d)",
        space: "O(n)",
        pitfalls: [
          "The tie-break is required — without it, `\"cccaaa\"` could come out as either `\"cccaaa\"` or `\"aaaccc\"`.",
          "Frequency sorts descending but the character tie-break sorts ascending; getting one direction wrong passes some tests and fails others.",
          "Build the output from the counts, not by sorting the original characters with a comparator — that is slower and easier to get wrong.",
          "In a language where a character is an integer, compare the character codes for the tie-break so the ordering really is alphabetical.",
        ],
      }),
      solutions: {
        python: `from collections import Counter\n\ndef frequencySort(s: str) -> str:\n    count = Counter(s)\n    ordered = sorted(count.items(), key=lambda e: (-e[1], e[0]))\n    return "".join(ch * f for ch, f in ordered)`,
        javascript: `var frequencySort = function(s) {\n    const count = new Map();\n    for (const ch of s) count.set(ch, (count.get(ch) || 0) + 1);\n    return Array.from(count.entries())\n        .sort(function(a, b) { return (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1); })\n        .map(function(e) { return new Array(e[1] + 1).join(e[0]); })\n        .join("");\n};`,
              typescript: `function frequencySort(s: string): string {\n    const count: { [ch: string]: number } = {};\n    const chars: string[] = [];\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (count[ch] === undefined) {\n            count[ch] = 0;\n            chars.push(ch);\n        }\n        count[ch]++;\n    }\n    chars.sort(function (a, b) {\n        if (count[b] !== count[a]) return count[b] - count[a];\n        return a < b ? -1 : (a > b ? 1 : 0);\n    });\n    let out = "";\n    for (let i = 0; i < chars.length; i++) {\n        for (let r = 0; r < count[chars[i]]; r++) out += chars[i];\n    }\n    return out;\n}`,
              java: `public static String frequencySort(String s) {\n    int[] count = new int[128];\n    for (char ch : s.toCharArray()) count[ch]++;\n    List<Integer> chars = new ArrayList<>();\n    for (int c = 0; c < 128; c++) if (count[c] > 0) chars.add(c);\n    Collections.sort(chars, (a, b) -> {\n        if (count[a] != count[b]) return count[b] - count[a];\n        return a - b;\n    });\n    StringBuilder out = new StringBuilder();\n    for (int c : chars) {\n        for (int r = 0; r < count[c]; r++) out.append((char) c);\n    }\n    return out.toString();\n}`,
              cpp: `string frequencySort(string s) {\n    int count[128];\n    for (int i = 0; i < 128; i++) count[i] = 0;\n    for (char ch : s) count[(int) ch]++;\n    vector<int> chars;\n    for (int c = 0; c < 128; c++) if (count[c] > 0) chars.push_back(c);\n    sort(chars.begin(), chars.end(), [&count](int a, int b) {\n        if (count[a] != count[b]) return count[a] > count[b];\n        return a < b;\n    });\n    string out;\n    for (int c : chars) {\n        for (int r = 0; r < count[c]; r++) out += (char) c;\n    }\n    return out;\n}`,
              c: `char* frequencySort(const char* s) {\n    int count[128];\n    for (int i = 0; i < 128; i++) count[i] = 0;\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) count[(unsigned char) s[i]]++;\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    while (1) {\n        int best = -1;\n        for (int c = 0; c < 128; c++) {\n            if (count[c] == 0) continue;\n            if (best == -1 || count[c] > count[best]) best = c;\n        }\n        if (best == -1) break;\n        for (int r = 0; r < count[best]; r++) out[pos++] = (char) best;\n        count[best] = 0;\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string FrequencySort(string s)\n{\n    int[] count = new int[128];\n    foreach (char ch in s) count[ch]++;\n    var chars = new List<int>();\n    for (int c = 0; c < 128; c++) if (count[c] > 0) chars.Add(c);\n    chars.Sort((a, b) =>\n    {\n        if (count[a] != count[b]) return count[b].CompareTo(count[a]);\n        return a.CompareTo(b);\n    });\n    var sb = new List<char>();\n    foreach (int c in chars)\n    {\n        for (int r = 0; r < count[c]; r++) sb.Add((char) c);\n    }\n    return new string(sb.ToArray());\n}`,
              go: `func frequencySort(s string) string {\n	count := make([]int, 128)\n	for i := 0; i < len(s); i++ {\n		count[s[i]]++\n	}\n	chars := []int{}\n	for c := 0; c < 128; c++ {\n		if count[c] > 0 {\n			chars = append(chars, c)\n		}\n	}\n	sort.Slice(chars, func(a, b int) bool {\n		if count[chars[a]] != count[chars[b]] {\n			return count[chars[a]] > count[chars[b]]\n		}\n		return chars[a] < chars[b]\n	})\n	out := []byte{}\n	for _, c := range chars {\n		for r := 0; r < count[c]; r++ {\n			out = append(out, byte(c))\n		}\n	}\n	return string(out)\n}`,
              kotlin: `fun frequencySort(s: String): String {\n    val count = IntArray(128)\n    for (ch in s) count[ch.toInt()]++\n    val chars = (0 until 128).filter { count[it] > 0 }\n        .sortedWith(compareByDescending<Int> { count[it] }.thenBy { it })\n    val out = StringBuilder()\n    for (c in chars) {\n        for (r in 0 until count[c]) out.append(c.toChar())\n    }\n    return out.toString()\n}`,
              swift: `func frequencySort(_ s: String) -> String {\n    var count: [Character: Int] = [:]\n    for ch in s { count[ch, default: 0] += 1 }\n    let chars = count.keys.sorted { a, b in\n        let fa = count[a]!\n        let fb = count[b]!\n        if fa != fb { return fa > fb }\n        return a < b\n    }\n    var out = ""\n    for ch in chars {\n        out += String(repeating: ch, count: count[ch]!)\n    }\n    return out\n}`,
              rust: `fn frequencySort(s: String) -> String {\n    let mut count = [0usize; 128];\n    for ch in s.chars() {\n        count[ch as usize] += 1;\n    }\n    let mut chars: Vec<usize> = (0..128).filter(|c| count[*c] > 0).collect();\n    chars.sort_by(|a, b| {\n        if count[*a] != count[*b] { count[*b].cmp(&count[*a]) } else { a.cmp(b) }\n    });\n    let mut out = String::new();\n    for c in chars {\n        for _ in 0..count[c] {\n            out.push(c as u8 as char);\n        }\n    }\n    out\n}`,
              php: `function frequencySort($s) {\n    $count = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $ch = $s[$i];\n        if (!array_key_exists($ch, $count)) $count[$ch] = 0;\n        $count[$ch]++;\n    }\n    $chars = array_keys($count);\n    usort($chars, function($a, $b) use ($count) {\n        if ($count[$a] !== $count[$b]) return $count[$b] - $count[$a];\n        return strcmp($a, $b);\n    });\n    $out = "";\n    foreach ($chars as $ch) {\n        $out .= str_repeat($ch, $count[$ch]);\n    }\n    return $out;\n}`,
              ruby: `def frequencySort(s)\n  count = Hash.new(0)\n  s.each_char { |ch| count[ch] += 1 }\n  count.keys.sort_by { |ch| [-count[ch], ch] }.map { |ch| ch * count[ch] }.join\nend`,
      },
    };
  })(),

];

/**
 * Binary tree problems — wave 7, batch 32.
 * Real problems only: LeetCode numbered problems (Minimum Number of Operations
 * to Sort a Binary Tree by Level, Closest Nodes Queries in a BST, Kth Largest
 * Sum in a Binary Tree, Cousins in Binary Tree II, K-th Largest Perfect Subtree
 * Size) and GeeksforGeeks staples (the top, bottom, boundary and diagonal views,
 * Vertical Sum, Sum Tree, Minimum Distance Between Two Nodes, Floor in BST,
 * Inorder Successor, Predecessor and Successor, Median of BST, Largest BST, Sum
 * of Nodes on the Longest Path, Duplicate Subtree, Foldable Binary Tree).
 * Worked examples are phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a tree is LeetCode's level order
 * with `null` for a missing child and trailing nulls dropped, `[]` for the
 * empty tree; every input and expected output here goes through
 * `fmtTree(treeFrom(…))` so it is always canonical. The node types are the
 * judge's — no solution redefines them. Where GFG answers with "a node" (Inorder
 * Successor, Predecessor and Successor, Minimum Distance) the nodes are named by
 * value and values are distinct; GFG's float median is returned as its exact
 * decimal text ("6" or "6.5"), since a half is the only fraction it can have.
 * Kth Largest Sum's node values are capped at 10^4 (LeetCode allows 10^6) so a
 * level sum provably fits in int32; Cousins II already fits (10^4 × 10^5).
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel; JS
 * solutions are Node 12-safe (no ??, ?., at(), replaceAll, flat or flatMap);
 * the C harness has no math.h or limits.h; Rust is 1.40 (`std::i32::MAX`, no
 * `matches!`); PHP runs inside `namespace Solution;`. Each solution's main
 * function comes first — C and C++ declare their helpers with a prototype
 * above it.
 *
 * Kotlin reads a node's value as `` n.`val` ``, and a code`…` block cannot
 * hold a backtick, so the Kotlin solutions go through `kt` below: a plain
 * template literal (where \` is a backtick) dedented by the same rules.
 *
 * Generated trees stay at or under ~40 nodes so 5,000 hidden cases run well
 * inside the judge's 15 CPU seconds in Python, Ruby and PHP; the statements
 * keep the real constraints.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtTree, pick, randBST, randTree, ri, shuffle, treeFrom,
  type CatalogProblem, type Rng, type TNode,
} from "./types.js";

/** A Kotlin solution: a plain template literal (\` is a backtick), dedented like code`…`. */
const kt = (s: string) => code(Object.assign([s], { raw: [s] }) as unknown as TemplateStringsArray);

/** Level-order array → canonical wire text. */
const lv = (a: Array<number | null>) => fmtTree(treeFrom(a));

/** Every node, preorder (left before right). */
function nodesOf(root: TNode | null): TNode[] {
  const out: TNode[] = [];
  const st: TNode[] = root ? [root] : [];
  while (st.length) {
    const n = st.pop()!;
    out.push(n);
    if (n.right) st.push(n.right);
    if (n.left) st.push(n.left);
  }
  return out;
}

/** Values in order (left, node, right). */
function inorderOf(root: TNode | null): number[] {
  const out: number[] = [];
  const walk = (n: TNode | null) => { if (!n) return; walk(n.left); out.push(n.val); walk(n.right); };
  walk(root);
  return out;
}

/** The tree's nodes level by level, left to right. */
function levelNodes(root: TNode | null): TNode[][] {
  const out: TNode[][] = [];
  let level = root ? [root] : [];
  while (level.length) {
    out.push(level);
    const next: TNode[] = [];
    for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
    level = next;
  }
  return out;
}

const cloneTree = (t: TNode | null): TNode | null => (t ? { val: t.val, left: cloneTree(t.left), right: cloneTree(t.right) } : null);
const isLeaf = (n: TNode) => !n.left && !n.right;

/** Gives the tree's nodes distinct values from [lo, hi] (hi - lo + 1 >= node count). */
function distinctVals(rng: Rng, root: TNode | null, lo: number, hi: number): TNode | null {
  const nodes = nodesOf(root);
  const vals = new Set<number>();
  while (vals.size < nodes.length) vals.add(ri(rng, lo, hi));
  const arr = shuffle(rng, [...vals]);
  nodes.forEach((n, i) => { n.val = arr[i]; });
  return root;
}

/** A random shape of n nodes: usually a random tree, sometimes a chain, a zigzag or a complete tree. */
function shapeTree(rng: Rng, n: number, lo: number, hi: number): TNode | null {
  if (n <= 0) return null;
  const r = rng();
  if (r < 0.7) return randTree(rng, n, lo, hi);
  if (r < 0.85) {
    const mode = ri(rng, 0, 2);
    const root: TNode = { val: ri(rng, lo, hi), left: null, right: null };
    let cur = root;
    for (let i = 1; i < n; i++) {
      const c: TNode = { val: ri(rng, lo, hi), left: null, right: null };
      const goLeft = mode === 0 ? true : mode === 1 ? false : rng() < 0.5;
      if (goLeft) cur.left = c; else cur.right = c;
      cur = c;
    }
    return root;
  }
  return treeFrom(Array.from({ length: n }, () => ri(rng, lo, hi)));
}

/** A BST of n distinct values from [lo, hi]: usually random, sometimes a sorted chain (inserted in order). */
function bstOf(rng: Rng, n: number, lo: number, hi: number): TNode | null {
  if (rng() < 0.85) return randBST(rng, n, lo, hi);
  const vals = new Set<number>();
  while (vals.size < n) vals.add(ri(rng, lo, hi));
  const sorted = [...vals].sort((a, b) => a - b);
  if (rng() < 0.5) sorted.reverse();
  let root: TNode | null = null;
  for (const v of sorted) {
    const node: TNode = { val: v, left: null, right: null };
    if (!root) { root = node; continue; }
    let cur = root;
    for (;;) {
      const side = v < cur.val ? "left" : "right";
      const next = cur[side];
      if (!next) { cur[side] = node; break; }
      cur = next;
    }
  }
  return root;
}

/** Horizontal distance of every node (root 0, left −1, right +1), in level order. */
function hdLevelOrder(root: TNode | null): Array<[TNode, number]> {
  const q: Array<[TNode, number]> = root ? [[root, 0]] : [];
  for (let h = 0; h < q.length; h++) {
    const [n, d] = q[h];
    if (n.left) q.push([n.left, d - 1]);
    if (n.right) q.push([n.right, d + 1]);
  }
  return q;
}

/** A perfect tree of the given depth (depth 1 = one node). */
function perfectTree(rng: Rng, depth: number, lo: number, hi: number): TNode | null {
  if (depth <= 0) return null;
  return { val: ri(rng, lo, hi), left: perfectTree(rng, depth - 1, lo, hi), right: perfectTree(rng, depth - 1, lo, hi) };
}

const sizeOf = (rng: Rng, caps: number[]) => ri(rng, 1, pick(rng, caps));

export const TREES6_PROBLEMS: CatalogProblem[] = [

  // ── Minimum Number of Operations to Sort a Binary Tree by Level (LC 2471) ──
  (() => {
    const ref = (root: TNode | null) => {
      let ops = 0;
      for (const level of levelNodes(root)) {
        const a = level.map((n) => n.val);
        const b = a.slice();
        let swaps = 0;
        // Selection-style swapping: put the smallest remaining value in place each time.
        for (let i = 0; i < b.length; i++) {
          let m = i;
          for (let j = i + 1; j < b.length; j++) if (b[j] < b[m]) m = j;
          if (m !== i) { const t = b[i]; b[i] = b[m]; b[m] = t; swaps++; }
        }
        ops += swaps;
      }
      return ops;
    };
    const EX = [
      { root: [1, 4, 3, 7, 6, 8, 5, null, null, null, null, 9, null, 10], note: "Level 2 [4,3] needs one swap. Level 3 [7,6,8,5] needs two: swap 7 and 5 to get [5,6,8,7], then 8 and 7. Level 4 [9,10] is already sorted. Total 3." },
      { root: [1, 3, 2, 7, 6, 5, 4], note: "Level 2 needs one swap; level 3 [7,6,5,4] needs two (7↔4, 6↔5). Total 3." },
      { root: [1, 2, 3, 4, 5, 6], note: "Every level is already increasing." },
    ];
    return {
      slug: "minimum-number-of-operations-to-sort-a-binary-tree-by-level",
      title: "Minimum Number of Operations to Sort a Binary Tree by Level",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Sorting", "Amazon"],
      signature: { funcName: "minimumOperations", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are all **distinct**.\n\nIn one operation you may pick any two nodes **on the same level** and swap their values.\n\nReturn the minimum number of operations needed so that the values on every level, read left to right, are in **strictly increasing** order.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct"]),
      hints: [
        "Levels never interact: a swap only ever involves two nodes of one level, so solve each level on its own and add the answers.",
        "For one level you need the minimum number of swaps that sorts an array of distinct values — a classic permutation question.",
        "Map each position to the position its value occupies after sorting. That permutation splits into cycles; a cycle of length `L` costs exactly `L - 1` swaps.",
      ],
      editorial: explain({
        idea: "Collect each level with a breadth-first walk. For a level, sorting defines a permutation from current positions to target positions; the minimum number of swaps to apply a permutation is the number of elements minus the number of its cycles.",
        steps: [
          "Walk the tree level by level, collecting each level's values in left-to-right order.",
          "For a level of `m` values, sort the indices by value: `order[j]` is the index of the value that belongs at position `j`.",
          "Follow the permutation `j → order[j]` from every unvisited index, marking indices; each walk traces one cycle.",
          "Add `m - cycles` to the answer, and move on to the next level.",
        ],
        why: "A swap can join two cycles into one or split one into two, so it changes the cycle count by exactly one. The sorted arrangement is the permutation with `m` cycles (every element fixed), so at least `m - cycles` swaps are needed; swapping an element straight into its target position always splits off a fixed point, which reaches that bound.",
        time: "O(n log n) — each level is sorted once",
        space: "O(n) for a level's values and the visited marks",
        pitfalls: [
          "Counting inversions or adjacent swaps gives the wrong answer — any two nodes of a level may be swapped.",
          "Values are only compared within a level; the levels need not be increasing relative to each other.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const shape = rng() < 0.65 ? treeFrom(Array.from({ length: n }, () => 1)) : shapeTree(rng, n, 1, 1);
        const root = distinctVals(rng, shape, 1, pick(rng, [n, n + 5, 100000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def minimumOperations(root: Optional[TreeNode]) -> int:
              ops = 0
              level = [root] if root else []
              while level:
                  vals = [node.val for node in level]
                  m = len(vals)
                  order = sorted(range(m), key=lambda i: vals[i])
                  seen = [False] * m
                  for i in range(m):
                      if seen[i]:
                          continue
                      length = 0
                      j = i
                      while not seen[j]:
                          seen[j] = True
                          j = order[j]
                          length += 1
                      ops += length - 1
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              return ops
        `,
        javascript: code`
          var minimumOperations = function(root) {
              var ops = 0;
              var level = root === null ? [] : [root];
              while (level.length > 0) {
                  var m = level.length, vals = [], order = [], seen = [], i;
                  for (i = 0; i < m; i++) { vals.push(level[i].val); order.push(i); seen.push(false); }
                  order.sort(function(a, b) { return vals[a] - vals[b]; });
                  for (i = 0; i < m; i++) {
                      if (seen[i]) continue;
                      var len = 0, j = i;
                      while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  var next = [];
                  for (i = 0; i < m; i++) {
                      if (level[i].left !== null) next.push(level[i].left);
                      if (level[i].right !== null) next.push(level[i].right);
                  }
                  level = next;
              }
              return ops;
          };
        `,
        typescript: code`
          function minimumOperations(root: TreeNode | null): number {
              var ops = 0;
              var level: TreeNode[] = root === null ? [] : [root];
              while (level.length > 0) {
                  var m = level.length;
                  var vals: number[] = [], order: number[] = [], seen: boolean[] = [];
                  var i: number;
                  for (i = 0; i < m; i++) { vals.push(level[i].val); order.push(i); seen.push(false); }
                  order.sort(function(a, b) { return vals[a] - vals[b]; });
                  for (i = 0; i < m; i++) {
                      if (seen[i]) continue;
                      var len = 0, j = i;
                      while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  var next: TreeNode[] = [];
                  for (i = 0; i < m; i++) {
                      if (level[i].left !== null) next.push(level[i].left);
                      if (level[i].right !== null) next.push(level[i].right);
                  }
                  level = next;
              }
              return ops;
          }
        `,
        java: code`
          public static int minimumOperations(TreeNode root) {
              int ops = 0;
              List<TreeNode> level = new ArrayList<>();
              if (root != null) level.add(root);
              while (!level.isEmpty()) {
                  int m = level.size();
                  long[] keys = new long[m];
                  for (int i = 0; i < m; i++) keys[i] = (long) level.get(i).val * 200000L + i;
                  Arrays.sort(keys);
                  int[] order = new int[m];
                  for (int i = 0; i < m; i++) order[i] = (int) (keys[i] % 200000L);
                  boolean[] seen = new boolean[m];
                  for (int i = 0; i < m; i++) {
                      if (seen[i]) continue;
                      int len = 0, j = i;
                      while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  List<TreeNode> next = new ArrayList<>();
                  for (TreeNode node : level) {
                      if (node.left != null) next.add(node.left);
                      if (node.right != null) next.add(node.right);
                  }
                  level = next;
              }
              return ops;
          }
        `,
        cpp: code`
          int minimumOperations(TreeNode* root) {
              int ops = 0;
              vector<TreeNode*> level;
              if (root) level.push_back(root);
              while (!level.empty()) {
                  int m = (int) level.size();
                  vector<int> order(m);
                  for (int i = 0; i < m; i++) order[i] = i;
                  sort(order.begin(), order.end(), [&](int a, int b) { return level[a]->val < level[b]->val; });
                  vector<bool> seen(m, false);
                  for (int i = 0; i < m; i++) {
                      if (seen[i]) continue;
                      int len = 0, j = i;
                      while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  vector<TreeNode*> next;
                  for (TreeNode* node : level) {
                      if (node->left) next.push_back(node->left);
                      if (node->right) next.push_back(node->right);
                  }
                  level = next;
              }
              return ops;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int cmpLong(const void* a, const void* b);

          int minimumOperations(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              long long* keys = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              int* order = (int*) malloc((size_t) (n + 1) * sizeof(int));
              char* seen = (char*) malloc((size_t) (n + 1));
              int head = 0, tail = 0, ops = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int start = head, end = tail, m = end - start;
                  for (int i = 0; i < m; i++) keys[i] = (long long) queue[start + i]->val * 200000LL + i;
                  qsort(keys, (size_t) m, sizeof(long long), cmpLong);
                  for (int i = 0; i < m; i++) { order[i] = (int) (keys[i] % 200000LL); seen[i] = 0; }
                  for (int i = 0; i < m; i++) {
                      if (seen[i]) continue;
                      int len = 0, j = i;
                      while (!seen[j]) { seen[j] = 1; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
              }
              free(queue); free(keys); free(order); free(seen);
              return ops;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int cmpLong(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return x < y ? -1 : (x > y ? 1 : 0);
          }
        `,
        csharp: code`
          public static int MinimumOperations(TreeNode root)
          {
              int ops = 0;
              var level = new List<TreeNode>();
              if (root != null) level.Add(root);
              while (level.Count > 0)
              {
                  int m = level.Count;
                  var keys = new int[m];
                  var order = new int[m];
                  for (int i = 0; i < m; i++) { keys[i] = level[i].val; order[i] = i; }
                  Array.Sort(keys, order);
                  var seen = new bool[m];
                  for (int i = 0; i < m; i++)
                  {
                      if (seen[i]) continue;
                      int len = 0, j = i;
                      while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
                      ops += len - 1;
                  }
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  level = next;
              }
              return ops;
          }
        `,
        go: code`
          func minimumOperations(root *TreeNode) int {
              ops := 0
              level := []*TreeNode{}
              if root != nil {
                  level = append(level, root)
              }
              for len(level) > 0 {
                  m := len(level)
                  order := make([]int, m)
                  for i := range order {
                      order[i] = i
                  }
                  sort.Slice(order, func(a, b int) bool { return level[order[a]].Val < level[order[b]].Val })
                  seen := make([]bool, m)
                  for i := 0; i < m; i++ {
                      if seen[i] {
                          continue
                      }
                      length, j := 0, i
                      for !seen[j] {
                          seen[j] = true
                          j = order[j]
                          length++
                      }
                      ops += length - 1
                  }
                  next := []*TreeNode{}
                  for _, node := range level {
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  level = next
              }
              return ops
          }
        `,
        kotlin: kt(`
          fun minimumOperations(root: TreeNode?): Int {
              var ops = 0
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  val m = level.size
                  val cur = level
                  val order = (0 until m).sortedBy { cur[it].\`val\` }
                  val seen = BooleanArray(m)
                  for (i in 0 until m) {
                      if (seen[i]) continue
                      var len = 0
                      var j = i
                      while (!seen[j]) {
                          seen[j] = true
                          j = order[j]
                          len++
                      }
                      ops += len - 1
                  }
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
              }
              return ops
          }
        `),
        swift: code`
          func minimumOperations(_ root: TreeNode?) -> Int {
              var ops = 0
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  let m = level.count
                  let vals = level.map { $0.val }
                  let order = (0..<m).sorted { vals[$0] < vals[$1] }
                  var seen = [Bool](repeating: false, count: m)
                  for i in 0..<m {
                      if seen[i] { continue }
                      var len = 0
                      var j = i
                      while !seen[j] {
                          seen[j] = true
                          j = order[j]
                          len += 1
                      }
                      ops += len - 1
                  }
                  var next: [TreeNode] = []
                  for node in level {
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return ops
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn minimumOperations(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut ops = 0;
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let vals: Vec<i32> = level.iter().map(|n| n.borrow().val).collect();
                  let m = vals.len();
                  let mut order: Vec<usize> = (0..m).collect();
                  order.sort_by_key(|&i| vals[i]);
                  let mut seen = vec![false; m];
                  for i in 0..m {
                      if seen[i] {
                          continue;
                      }
                      let mut len = 0;
                      let mut j = i;
                      while !seen[j] {
                          seen[j] = true;
                          j = order[j];
                          len += 1;
                      }
                      ops += len - 1;
                  }
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  level = next;
              }
              ops
          }
        `,
        php: code`
          function minimumOperations($root) {
              $ops = 0;
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $m = count($level);
                  $vals = [];
                  foreach ($level as $node) $vals[] = $node->val;
                  $order = range(0, $m - 1);
                  usort($order, function ($a, $b) use ($vals) { return $vals[$a] - $vals[$b]; });
                  $seen = array_fill(0, $m, false);
                  for ($i = 0; $i < $m; $i++) {
                      if ($seen[$i]) continue;
                      $len = 0;
                      $j = $i;
                      while (!$seen[$j]) { $seen[$j] = true; $j = $order[$j]; $len++; }
                      $ops += $len - 1;
                  }
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $level = $next;
              }
              return $ops;
          }
        `,
        ruby: code`
          def minimumOperations(root)
            ops = 0
            level = root.nil? ? [] : [root]
            until level.empty?
              vals = level.map(&:val)
              m = vals.size
              order = (0...m).sort_by { |i| vals[i] }
              seen = Array.new(m, false)
              (0...m).each do |i|
                next if seen[i]
                len = 0
                j = i
                until seen[j]
                  seen[j] = true
                  j = order[j]
                  len += 1
                end
                ops += len - 1
              end
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            ops
          end
        `,
      },
    };
  })(),

  // ── Closest Nodes Queries in a Binary Search Tree (LC 2476) ────────
  (() => {
    const ref = (root: TNode | null, queries: number[]) => {
      const vals = inorderOf(root);
      return queries.map((q) => {
        let lo = -1, hi = -1;
        for (const v of vals) { if (v <= q) lo = v; if (v >= q && hi === -1) hi = v; }
        return [lo, hi];
      });
    };
    const EX = [
      { root: [6, 2, 13, 1, 4, 9, 15, null, null, null, null, null, null, 14], queries: [2, 5, 16], note: "2 is in the tree, so both answers are 2. For 5 the closest values around it are 4 and 6. Nothing is at least 16, so its upper answer is -1." },
      { root: [4, null, 9], queries: [3], note: "Nothing in the tree is at most 3; the smallest value at least 3 is 4." },
      { root: [8, 3], queries: [8, 1, 20], note: "8 is in the tree, so it answers both sides. Nothing is at most 1 (the smallest value at least 1 is 3), and nothing is at least 20." },
    ];
    return {
      slug: "closest-nodes-queries-in-a-binary-search-tree",
      title: "Closest Nodes Queries in a Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Depth-First Search", "Array", "Amazon"],
      signature: { funcName: "closestNodes", params: [{ name: "root", type: "TreeNode" as const }, { name: "queries", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** and an array `queries` of positive integers.\n\nFor each query `q` return a pair `[mini, maxi]` where:\n\n- `mini` is the **largest** value in the tree that is **less than or equal to** `q`, or `-1` if there is none;\n- `maxi` is the **smallest** value in the tree that is **greater than or equal to** `q`, or `-1` if there is none.\n\nReturn the pairs in the order of the queries.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, queries = ${fmtIntArr(e.queries)}`, out: fmtIntMat(ref(treeFrom(e.root), e.queries)), note: e.note })),
        ["2 <= number of nodes <= 10^5", "1 <= Node.val <= 10^6", "root is a valid binary search tree with distinct values", "1 <= queries.length <= 10^5", "1 <= queries[i] <= 10^6"]),
      hints: [
        "The tree can be badly unbalanced — a chain of 10^5 nodes — so walking it from the root once per query can be too slow.",
        "An in-order traversal of a BST lists its values in increasing order. Do that once.",
        "With the sorted list, each query is a binary search: the first value `>= q` gives `maxi`, and the value just before it (or the found value itself when it equals `q`) gives `mini`.",
      ],
      editorial: explain({
        idea: "Flatten the BST into its sorted in-order sequence once, then answer every query with one binary search for the first value not below it.",
        steps: [
          "Traverse the tree in order to collect its values in increasing order into `vals`.",
          "For a query `q`, find `i`, the first index with `vals[i] >= q` (lower bound).",
          "`maxi` is `vals[i]` if `i < len(vals)`, else `-1`.",
          "`mini` is `q` when `vals[i] == q`; otherwise `vals[i - 1]` if `i > 0`, else `-1`.",
        ],
        why: "`vals` is sorted, so every value before position `i` is below `q` and every value from `i` on is at least `q`. The smallest value at least `q` is therefore `vals[i]`, and the largest value at most `q` is `vals[i]` itself when it equals `q`, or else the last value before it.",
        time: "O(n + m log n) for n nodes and m queries",
        space: "O(n) for the sorted values",
        pitfalls: [
          "Searching from the root per query costs O(height), which is O(n) on a skewed tree — 10^10 steps in the worst case.",
          "A query equal to a tree value answers `[q, q]`; do not take the strictly smaller neighbour.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${fmtIntArr(e.queries)}`, expectedOutput: fmtIntMat(ref(treeFrom(e.root), e.queries)) })),
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 30, 40]));
        const hi = pick(rng, [n + 3, 60, 1000, 1000000]);
        const root = bstOf(rng, n, 1, hi);
        const vals = inorderOf(root);
        const m = ri(rng, 1, pick(rng, [1, 5, 20]));
        const qs = Array.from({ length: m }, () => (rng() < 0.3 ? pick(rng, vals) : ri(rng, 1, Math.min(1000000, hi + 2))));
        return { input: `${fmtTree(root)}\n${fmtIntArr(qs)}`, expectedOutput: fmtIntMat(ref(root, qs)) };
      },
      solutions: {
        python: code`
          from bisect import bisect_left
          from typing import List, Optional

          def closestNodes(root: Optional[TreeNode], queries: List[int]) -> List[List[int]]:
              vals = []
              stack = []
              node = root
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  vals.append(node.val)
                  node = node.right
              out = []
              for q in queries:
                  i = bisect_left(vals, q)
                  hi = vals[i] if i < len(vals) else -1
                  if i < len(vals) and vals[i] == q:
                      lo = q
                  else:
                      lo = vals[i - 1] if i > 0 else -1
                  out.append([lo, hi])
              return out
        `,
        javascript: code`
          var closestNodes = function(root, queries) {
              var vals = [], stack = [], node = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  vals.push(node.val);
                  node = node.right;
              }
              var out = [];
              for (var k = 0; k < queries.length; k++) {
                  var q = queries[k], lo = 0, hi = vals.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (vals[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  var maxi = lo < vals.length ? vals[lo] : -1;
                  var mini = lo < vals.length && vals[lo] === q ? q : (lo > 0 ? vals[lo - 1] : -1);
                  out.push([mini, maxi]);
              }
              return out;
          };
        `,
        typescript: code`
          function closestNodes(root: TreeNode | null, queries: number[]): number[][] {
              var vals: number[] = [], stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  vals.push(top.val);
                  node = top.right;
              }
              var out: number[][] = [];
              for (var k = 0; k < queries.length; k++) {
                  var q = queries[k], lo = 0, hi = vals.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (vals[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  var maxi = lo < vals.length ? vals[lo] : -1;
                  var mini = lo < vals.length && vals[lo] === q ? q : (lo > 0 ? vals[lo - 1] : -1);
                  out.push([mini, maxi]);
              }
              return out;
          }
        `,
        java: code`
          public static int[][] closestNodes(TreeNode root, int[] queries) {
              List<Integer> list = new ArrayList<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  list.add(node.val);
                  node = node.right;
              }
              int n = list.size();
              int[] vals = new int[n];
              for (int i = 0; i < n; i++) vals[i] = list.get(i);
              int[][] out = new int[queries.length][];
              for (int k = 0; k < queries.length; k++) {
                  int q = queries[k], lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (vals[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  int maxi = lo < n ? vals[lo] : -1;
                  int mini = lo < n && vals[lo] == q ? q : (lo > 0 ? vals[lo - 1] : -1);
                  out[k] = new int[] { mini, maxi };
              }
              return out;
          }
        `,
        cpp: code`
          vector<vector<int>> closestNodes(TreeNode* root, vector<int>& queries) {
              vector<int> vals;
              vector<TreeNode*> stack;
              TreeNode* node = root;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  vals.push_back(node->val);
                  node = node->right;
              }
              vector<vector<int>> out;
              for (int q : queries) {
                  int i = (int) (lower_bound(vals.begin(), vals.end(), q) - vals.begin());
                  int n = (int) vals.size();
                  int maxi = i < n ? vals[i] : -1;
                  int mini = i < n && vals[i] == q ? q : (i > 0 ? vals[i - 1] : -1);
                  out.push_back({mini, maxi});
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void inorder(struct TreeNode* t, int* vals, int* len);

          int** closestNodes(struct TreeNode* root, int* queries, int queriesSize, int* returnSize, int** returnColumnSizes) {
              int n = countNodes(root);
              int* vals = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int len = 0;
              inorder(root, vals, &len);
              int** out = (int**) malloc((size_t) (queriesSize + 1) * sizeof(int*));
              *returnColumnSizes = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              for (int k = 0; k < queriesSize; k++) {
                  int q = queries[k], lo = 0, hi = len;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (vals[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  int* pair = (int*) malloc(2 * sizeof(int));
                  pair[1] = lo < len ? vals[lo] : -1;
                  pair[0] = lo < len && vals[lo] == q ? q : (lo > 0 ? vals[lo - 1] : -1);
                  out[k] = pair;
                  (*returnColumnSizes)[k] = 2;
              }
              free(vals);
              *returnSize = queriesSize;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void inorder(struct TreeNode* t, int* vals, int* len) {
              if (t == NULL) return;
              inorder(t->left, vals, len);
              vals[(*len)++] = t->val;
              inorder(t->right, vals, len);
          }
        `,
        csharp: code`
          public static int[][] ClosestNodes(TreeNode root, int[] queries)
          {
              var vals = new List<int>();
              var stack = new Stack<TreeNode>();
              TreeNode node = root;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  vals.Add(node.val);
                  node = node.right;
              }
              int n = vals.Count;
              var output = new int[queries.Length][];
              for (int k = 0; k < queries.Length; k++)
              {
                  int q = queries[k], lo = 0, hi = n;
                  while (lo < hi)
                  {
                      int mid = (lo + hi) / 2;
                      if (vals[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  int maxi = lo < n ? vals[lo] : -1;
                  int mini = lo < n && vals[lo] == q ? q : (lo > 0 ? vals[lo - 1] : -1);
                  output[k] = new int[] { mini, maxi };
              }
              return output;
          }
        `,
        go: code`
          func closestNodes(root *TreeNode, queries []int) [][]int {
              vals := []int{}
              stack := []*TreeNode{}
              node := root
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  vals = append(vals, node.Val)
                  node = node.Right
              }
              n := len(vals)
              out := make([][]int, 0, len(queries))
              for _, q := range queries {
                  i := sort.SearchInts(vals, q)
                  maxi, mini := -1, -1
                  if i < n {
                      maxi = vals[i]
                  }
                  if i < n && vals[i] == q {
                      mini = q
                  } else if i > 0 {
                      mini = vals[i-1]
                  }
                  out = append(out, []int{mini, maxi})
              }
              return out
          }
        `,
        kotlin: kt(`
          fun closestNodes(root: TreeNode?, queries: IntArray): Array<IntArray> {
              val list = ArrayList<Int>()
              val stack = ArrayList<TreeNode>()
              var node = root
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  list.add(top.\`val\`)
                  node = top.right
              }
              val vals = list.toIntArray()
              val n = vals.size
              return Array(queries.size) { k ->
                  val q = queries[k]
                  var lo = 0
                  var hi = n
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (vals[mid] < q) lo = mid + 1 else hi = mid
                  }
                  val maxi = if (lo < n) vals[lo] else -1
                  val mini = if (lo < n && vals[lo] == q) q else if (lo > 0) vals[lo - 1] else -1
                  intArrayOf(mini, maxi)
              }
          }
        `),
        swift: code`
          func closestNodes(_ root: TreeNode?, _ queries: [Int]) -> [[Int]] {
              var vals: [Int] = []
              var stack: [TreeNode] = []
              var node = root
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  vals.append(top.val)
                  node = top.right
              }
              let n = vals.count
              var out: [[Int]] = []
              for q in queries {
                  var lo = 0
                  var hi = n
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if vals[mid] < q { lo = mid + 1 } else { hi = mid }
                  }
                  let maxi = lo < n ? vals[lo] : -1
                  let mini = (lo < n && vals[lo] == q) ? q : (lo > 0 ? vals[lo - 1] : -1)
                  out.append([mini, maxi])
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn closestNodes(root: Option<Rc<RefCell<TreeNode>>>, queries: Vec<i32>) -> Vec<Vec<i32>> {
              let mut vals: Vec<i32> = Vec::new();
              collect_inorder(&root, &mut vals);
              let n = vals.len();
              let mut out: Vec<Vec<i32>> = Vec::new();
              for &q in &queries {
                  let mut lo = 0usize;
                  let mut hi = n;
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if vals[mid] < q {
                          lo = mid + 1;
                      } else {
                          hi = mid;
                      }
                  }
                  let maxi = if lo < n { vals[lo] } else { -1 };
                  let mini = if lo < n && vals[lo] == q { q } else if lo > 0 { vals[lo - 1] } else { -1 };
                  out.push(vec![mini, maxi]);
              }
              out
          }

          fn collect_inorder(node: &Option<Rc<RefCell<TreeNode>>>, vals: &mut Vec<i32>) {
              if let Some(rc) = node {
                  let b = rc.borrow();
                  collect_inorder(&b.left, vals);
                  vals.push(b.val);
                  collect_inorder(&b.right, vals);
              }
          }
        `,
        php: code`
          function closestNodes($root, $queries) {
              $vals = [];
              $stack = [];
              $node = $root;
              while (count($stack) > 0 || $node !== null) {
                  while ($node !== null) { $stack[] = $node; $node = $node->left; }
                  $node = array_pop($stack);
                  $vals[] = $node->val;
                  $node = $node->right;
              }
              $n = count($vals);
              $out = [];
              foreach ($queries as $q) {
                  $lo = 0;
                  $hi = $n;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($vals[$mid] < $q) $lo = $mid + 1; else $hi = $mid;
                  }
                  $maxi = $lo < $n ? $vals[$lo] : -1;
                  $mini = ($lo < $n && $vals[$lo] == $q) ? $q : ($lo > 0 ? $vals[$lo - 1] : -1);
                  $out[] = [$mini, $maxi];
              }
              return $out;
          }
        `,
        ruby: code`
          def closestNodes(root, queries)
            vals = []
            stack = []
            node = root
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              vals << node.val
              node = node.right
            end
            n = vals.size
            queries.map do |q|
              i = vals.bsearch_index { |v| v >= q } || n
              maxi = i < n ? vals[i] : -1
              mini = (i < n && vals[i] == q) ? q : (i > 0 ? vals[i - 1] : -1)
              [mini, maxi]
            end
          end
        `,
      },
    };
  })(),

  // ── Kth Largest Sum in a Binary Tree (LC 2583) ─────────────────────
  (() => {
    const ref = (root: TNode | null, k: number) => {
      const sums = levelNodes(root).map((l) => l.reduce((s, n) => s + n.val, 0)).sort((a, b) => b - a);
      return k <= sums.length ? sums[k - 1] : -1;
    };
    const EX = [
      { root: [5, 8, 9, 2, 1, 3, 7, 4, 6], k: 2, note: "The level sums are 5, 17, 13 and 10. In decreasing order: 17, 13, 10, 5 — the second is 13." },
      { root: [1, 2, null, 3], k: 1, note: "The level sums are 1, 2 and 3; the largest is 3." },
      { root: [4, 2, 6], k: 3, note: "The tree has only two levels, so there is no third largest sum." },
    ];
    return {
      slug: "kth-largest-sum-in-a-binary-tree",
      title: "Kth Largest Sum in a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Sorting", "Heap (Priority Queue)", "Amazon"],
      signature: { funcName: "kthLargestLevelSum", params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree and a positive integer `k`.\n\nThe **level sum** of a level is the sum of the values of all the nodes on that level (nodes at the same distance from the root).\n\nReturn the `k`-th **largest** level sum (sums are not necessarily distinct; equal sums count separately). If the tree has fewer than `k` levels, return `-1`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, k = ${e.k}`, out: String(ref(treeFrom(e.root), e.k)), note: e.note })),
        ["2 <= number of nodes <= 10^5", "1 <= Node.val <= 10^4 (LeetCode allows 10^6; reduced here so every level sum fits in a 32-bit integer)", "1 <= k <= number of nodes"]),
      hints: [
        "First compute every level's sum — a breadth-first walk that processes one level at a time does it in one pass.",
        "There are at most as many levels as nodes, so sorting the sums is cheap.",
        "Check the number of levels before indexing: when it is below `k` the answer is `-1`.",
      ],
      editorial: explain({
        idea: "A level-by-level breadth-first traversal yields each level's sum; sort the sums in decreasing order and read position `k - 1`.",
        steps: [
          "Start with the root as the only node of the current level.",
          "Add up the current level's values into one sum and collect the children as the next level; repeat until no level is left.",
          "If fewer than `k` sums were produced, return `-1`.",
          "Otherwise sort the sums in decreasing order and return the `k`-th one.",
        ],
        why: "The breadth-first walk visits every node exactly once and groups nodes by depth, so each sum is exactly one level's total. Sorting puts them in decreasing order, and equal sums stay as separate entries, which is what the ranking asks for.",
        time: "O(n + L log L), L the number of levels",
        space: "O(n) for the queue and the sums",
        pitfalls: [
          "Equal sums are not merged — two levels both summing to 10 are the first and second largest if nothing is bigger.",
          "On LeetCode the sums need 64-bit integers; here the values are capped so 32 bits suffice, but the levels must still be summed completely.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.k}`, expectedOutput: String(ref(treeFrom(e.root), e.k)) })),
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 15, 30, 40]));
        const top = pick(rng, [1, 3, 100, 10000]);
        const root = shapeTree(rng, n, 1, top);
        const levels = levelNodes(root).length;
        const k = rng() < 0.2 ? ri(rng, 1, n) : ri(rng, 1, Math.max(1, levels));
        return { input: `${fmtTree(root)}\n${k}`, expectedOutput: String(ref(root, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def kthLargestLevelSum(root: Optional[TreeNode], k: int) -> int:
              sums = []
              level = [root] if root else []
              while level:
                  sums.append(sum(node.val for node in level))
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              if len(sums) < k:
                  return -1
              sums.sort(reverse=True)
              return sums[k - 1]
        `,
        javascript: code`
          var kthLargestLevelSum = function(root, k) {
              var sums = [];
              var level = root === null ? [] : [root];
              while (level.length > 0) {
                  var s = 0, next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      s += node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  sums.push(s);
                  level = next;
              }
              if (sums.length < k) return -1;
              sums.sort(function(a, b) { return b - a; });
              return sums[k - 1];
          };
        `,
        typescript: code`
          function kthLargestLevelSum(root: TreeNode | null, k: number): number {
              var sums: number[] = [];
              var level: TreeNode[] = root === null ? [] : [root];
              while (level.length > 0) {
                  var s = 0;
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      s += node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  sums.push(s);
                  level = next;
              }
              if (sums.length < k) return -1;
              sums.sort(function(a, b) { return b - a; });
              return sums[k - 1];
          }
        `,
        java: code`
          public static int kthLargestLevelSum(TreeNode root, int k) {
              List<Integer> sums = new ArrayList<>();
              List<TreeNode> level = new ArrayList<>();
              if (root != null) level.add(root);
              while (!level.isEmpty()) {
                  int s = 0;
                  List<TreeNode> next = new ArrayList<>();
                  for (TreeNode node : level) {
                      s += node.val;
                      if (node.left != null) next.add(node.left);
                      if (node.right != null) next.add(node.right);
                  }
                  sums.add(s);
                  level = next;
              }
              if (sums.size() < k) return -1;
              sums.sort(Collections.reverseOrder());
              return sums.get(k - 1);
          }
        `,
        cpp: code`
          int kthLargestLevelSum(TreeNode* root, int k) {
              vector<int> sums;
              vector<TreeNode*> level;
              if (root) level.push_back(root);
              while (!level.empty()) {
                  int s = 0;
                  vector<TreeNode*> next;
                  for (TreeNode* node : level) {
                      s += node->val;
                      if (node->left) next.push_back(node->left);
                      if (node->right) next.push_back(node->right);
                  }
                  sums.push_back(s);
                  level = next;
              }
              if ((int) sums.size() < k) return -1;
              sort(sums.rbegin(), sums.rend());
              return sums[k - 1];
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int cmpDesc(const void* a, const void* b);

          int kthLargestLevelSum(struct TreeNode* root, int k) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int* sums = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int head = 0, tail = 0, levels = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail, s = 0;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      s += node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  sums[levels++] = s;
              }
              int ans = -1;
              if (levels >= k) {
                  qsort(sums, (size_t) levels, sizeof(int), cmpDesc);
                  ans = sums[k - 1];
              }
              free(queue);
              free(sums);
              return ans;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int cmpDesc(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return x > y ? -1 : (x < y ? 1 : 0);
          }
        `,
        csharp: code`
          public static int KthLargestLevelSum(TreeNode root, int k)
          {
              var sums = new List<int>();
              var level = new List<TreeNode>();
              if (root != null) level.Add(root);
              while (level.Count > 0)
              {
                  int s = 0;
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      s += node.val;
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  sums.Add(s);
                  level = next;
              }
              if (sums.Count < k) return -1;
              sums.Sort();
              sums.Reverse();
              return sums[k - 1];
          }
        `,
        go: code`
          func kthLargestLevelSum(root *TreeNode, k int) int {
              sums := []int{}
              level := []*TreeNode{}
              if root != nil {
                  level = append(level, root)
              }
              for len(level) > 0 {
                  s := 0
                  next := []*TreeNode{}
                  for _, node := range level {
                      s += node.Val
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  sums = append(sums, s)
                  level = next
              }
              if len(sums) < k {
                  return -1
              }
              sort.Sort(sort.Reverse(sort.IntSlice(sums)))
              return sums[k-1]
          }
        `,
        kotlin: kt(`
          fun kthLargestLevelSum(root: TreeNode?, k: Int): Int {
              val sums = ArrayList<Int>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  var s = 0
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      s += node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  sums.add(s)
                  level = next
              }
              if (sums.size < k) return -1
              val sorted = sums.sortedDescending()
              return sorted[k - 1]
          }
        `),
        swift: code`
          func kthLargestLevelSum(_ root: TreeNode?, _ k: Int) -> Int {
              var sums: [Int] = []
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  var s = 0
                  var next: [TreeNode] = []
                  for node in level {
                      s += node.val
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  sums.append(s)
                  level = next
              }
              if sums.count < k { return -1 }
              sums.sort(by: >)
              return sums[k - 1]
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn kthLargestLevelSum(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> i32 {
              let mut sums: Vec<i32> = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let mut s = 0;
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      s += b.val;
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  sums.push(s);
                  level = next;
              }
              let k = k as usize;
              if sums.len() < k {
                  return -1;
              }
              sums.sort_by(|a, b| b.cmp(a));
              sums[k - 1]
          }
        `,
        php: code`
          function kthLargestLevelSum($root, $k) {
              $sums = [];
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $s = 0;
                  $next = [];
                  foreach ($level as $node) {
                      $s += $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $sums[] = $s;
                  $level = $next;
              }
              if (count($sums) < $k) return -1;
              rsort($sums);
              return $sums[$k - 1];
          }
        `,
        ruby: code`
          def kthLargestLevelSum(root, k)
            sums = []
            level = root.nil? ? [] : [root]
            until level.empty?
              sums << level.sum(&:val)
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            return -1 if sums.size < k
            sums.sort.reverse[k - 1]
          end
        `,
      },
    };
  })(),

  // ── Cousins in Binary Tree II (LC 2641) ────────────────────────────
  (() => {
    const ref = (input: TNode | null) => {
      const root = cloneTree(input);
      const parentSum = new Map<TNode, number>();
      for (const level of levelNodes(input)) {
        for (const p of level) {
          const s = (p.left ? p.left.val : 0) + (p.right ? p.right.val : 0);
          if (p.left) parentSum.set(p.left, s);
          if (p.right) parentSum.set(p.right, s);
        }
      }
      const orig = levelNodes(input), copy = levelNodes(root);
      orig.forEach((level, d) => {
        const total = level.reduce((s, n) => s + n.val, 0);
        level.forEach((n, i) => { copy[d][i].val = d === 0 ? 0 : total - parentSum.get(n)!; });
      });
      return root;
    };
    const EX = [
      { root: [5, 4, 9, 1, 10, null, 7], note: "The root and its two children have no cousins, so they become 0. On level 3, 1 and 10 have the cousin 7, and 7 has the cousins 1 and 10: they become 7, 7 and 11." },
      { root: [3, 1, 2], note: "1 and 2 are siblings, not cousins, so every value becomes 0." },
      { root: [1, 2, 3, 4, 5, 6, 7], note: "On level 3, 4 and 5 have the cousins 6 and 7 (sum 13); 6 and 7 have the cousins 4 and 5 (sum 9)." },
    ];
    return {
      slug: "cousins-in-binary-tree-ii",
      title: "Cousins in Binary Tree II",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Hash Table", "Amazon"],
      signature: { funcName: "replaceValueInTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary tree. Two nodes are **cousins** when they are on the same level (the same depth) but have **different parents**.\n\nReplace the value of every node with the **sum of the values of all its cousins**, computed from the original values, and return the `root` of the modified tree. A node with no cousins gets `0`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^4"]),
      hints: [
        "A node's cousins are all the nodes of its level except itself and its sibling.",
        "So its new value is (the whole level's sum) minus (the sum of the children of its parent).",
        "Go level by level: from each node of the current level you can see both its children, so compute the next level's total and each pair's sum before overwriting the children.",
      ],
      editorial: explain({
        idea: "The cousins of a node are its level minus its parent's children. With a breadth-first walk, standing on a level, compute the next level's total from the original child values, then set each child to that total minus its own sibling pair's sum.",
        steps: [
          "Set the root's value to 0 (it has no cousins) and start with the root as the current level.",
          "For each node of the current level, compute `pair` = the sum of its children's values; add every `pair` into `nextTotal`.",
          "Walk the current level again and set each child's value to `nextTotal - pair` of its parent; collect the children as the next level.",
          "Repeat until a level has no children, then return the root.",
        ],
        why: "All the sums on a level are taken before any child on that level is overwritten, so they use the original values. A child's sibling group is exactly its parent's children, so `nextTotal - pair` removes the child and its sibling and keeps every other node of the level — its cousins.",
        time: "O(n)",
        space: "O(w), w the widest level",
        pitfalls: [
          "Overwriting a child before the level's total is computed mixes new and old values; finish the sums first.",
          "Siblings are not cousins — a node's own sibling must be left out of its sum, not just the node itself.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [1, 10, 10000]));
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def replaceValueInTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
              if root is None:
                  return None
              root.val = 0
              level = [root]
              while level:
                  pairs = []
                  total = 0
                  for node in level:
                      s = (node.left.val if node.left else 0) + (node.right.val if node.right else 0)
                      pairs.append(s)
                      total += s
                  nxt = []
                  for node, s in zip(level, pairs):
                      for child in (node.left, node.right):
                          if child:
                              child.val = total - s
                              nxt.append(child)
                  level = nxt
              return root
        `,
        javascript: code`
          var replaceValueInTree = function(root) {
              if (root === null) return null;
              root.val = 0;
              var level = [root];
              while (level.length > 0) {
                  var pairs = [], total = 0, i;
                  for (i = 0; i < level.length; i++) {
                      var node = level[i];
                      var s = (node.left !== null ? node.left.val : 0) + (node.right !== null ? node.right.val : 0);
                      pairs.push(s);
                      total += s;
                  }
                  var next = [];
                  for (i = 0; i < level.length; i++) {
                      var p = level[i];
                      if (p.left !== null) { p.left.val = total - pairs[i]; next.push(p.left); }
                      if (p.right !== null) { p.right.val = total - pairs[i]; next.push(p.right); }
                  }
                  level = next;
              }
              return root;
          };
        `,
        typescript: code`
          function replaceValueInTree(root: TreeNode | null): TreeNode | null {
              if (root === null) return null;
              root.val = 0;
              var level: TreeNode[] = [root];
              while (level.length > 0) {
                  var pairs: number[] = [];
                  var total = 0, i: number;
                  for (i = 0; i < level.length; i++) {
                      var node = level[i];
                      var s = (node.left !== null ? node.left.val : 0) + (node.right !== null ? node.right.val : 0);
                      pairs.push(s);
                      total += s;
                  }
                  var next: TreeNode[] = [];
                  for (i = 0; i < level.length; i++) {
                      var p = level[i];
                      if (p.left !== null) { p.left.val = total - pairs[i]; next.push(p.left); }
                      if (p.right !== null) { p.right.val = total - pairs[i]; next.push(p.right); }
                  }
                  level = next;
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode replaceValueInTree(TreeNode root) {
              if (root == null) return null;
              root.val = 0;
              List<TreeNode> level = new ArrayList<>();
              level.add(root);
              while (!level.isEmpty()) {
                  int m = level.size(), total = 0;
                  int[] pairs = new int[m];
                  for (int i = 0; i < m; i++) {
                      TreeNode node = level.get(i);
                      pairs[i] = (node.left != null ? node.left.val : 0) + (node.right != null ? node.right.val : 0);
                      total += pairs[i];
                  }
                  List<TreeNode> next = new ArrayList<>();
                  for (int i = 0; i < m; i++) {
                      TreeNode p = level.get(i);
                      if (p.left != null) { p.left.val = total - pairs[i]; next.add(p.left); }
                      if (p.right != null) { p.right.val = total - pairs[i]; next.add(p.right); }
                  }
                  level = next;
              }
              return root;
          }
        `,
        cpp: code`
          TreeNode* replaceValueInTree(TreeNode* root) {
              if (!root) return nullptr;
              root->val = 0;
              vector<TreeNode*> level = {root};
              while (!level.empty()) {
                  int m = (int) level.size(), total = 0;
                  vector<int> pairs(m);
                  for (int i = 0; i < m; i++) {
                      TreeNode* node = level[i];
                      pairs[i] = (node->left ? node->left->val : 0) + (node->right ? node->right->val : 0);
                      total += pairs[i];
                  }
                  vector<TreeNode*> next;
                  for (int i = 0; i < m; i++) {
                      TreeNode* p = level[i];
                      if (p->left) { p->left->val = total - pairs[i]; next.push_back(p->left); }
                      if (p->right) { p->right->val = total - pairs[i]; next.push_back(p->right); }
                  }
                  level = next;
              }
              return root;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          struct TreeNode* replaceValueInTree(struct TreeNode* root) {
              if (root == NULL) return NULL;
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int* pairs = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int head = 0, tail = 0;
              root->val = 0;
              queue[tail++] = root;
              while (head < tail) {
                  int start = head, end = tail, total = 0;
                  for (int i = start; i < end; i++) {
                      struct TreeNode* node = queue[i];
                      pairs[i] = (node->left != NULL ? node->left->val : 0) + (node->right != NULL ? node->right->val : 0);
                      total += pairs[i];
                  }
                  for (int i = start; i < end; i++) {
                      struct TreeNode* p = queue[i];
                      if (p->left != NULL) { p->left->val = total - pairs[i]; queue[tail++] = p->left; }
                      if (p->right != NULL) { p->right->val = total - pairs[i]; queue[tail++] = p->right; }
                  }
                  head = end;
              }
              free(queue);
              free(pairs);
              return root;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static TreeNode ReplaceValueInTree(TreeNode root)
          {
              if (root == null) return null;
              root.val = 0;
              var level = new List<TreeNode> { root };
              while (level.Count > 0)
              {
                  int m = level.Count, total = 0;
                  var pairs = new int[m];
                  for (int i = 0; i < m; i++)
                  {
                      var node = level[i];
                      pairs[i] = (node.left != null ? node.left.val : 0) + (node.right != null ? node.right.val : 0);
                      total += pairs[i];
                  }
                  var next = new List<TreeNode>();
                  for (int i = 0; i < m; i++)
                  {
                      var p = level[i];
                      if (p.left != null) { p.left.val = total - pairs[i]; next.Add(p.left); }
                      if (p.right != null) { p.right.val = total - pairs[i]; next.Add(p.right); }
                  }
                  level = next;
              }
              return root;
          }
        `,
        go: code`
          func replaceValueInTree(root *TreeNode) *TreeNode {
              if root == nil {
                  return nil
              }
              root.Val = 0
              level := []*TreeNode{root}
              for len(level) > 0 {
                  pairs := make([]int, len(level))
                  total := 0
                  for i, node := range level {
                      s := 0
                      if node.Left != nil {
                          s += node.Left.Val
                      }
                      if node.Right != nil {
                          s += node.Right.Val
                      }
                      pairs[i] = s
                      total += s
                  }
                  next := []*TreeNode{}
                  for i, p := range level {
                      if p.Left != nil {
                          p.Left.Val = total - pairs[i]
                          next = append(next, p.Left)
                      }
                      if p.Right != nil {
                          p.Right.Val = total - pairs[i]
                          next = append(next, p.Right)
                      }
                  }
                  level = next
              }
              return root
          }
        `,
        kotlin: kt(`
          fun replaceValueInTree(root: TreeNode?): TreeNode? {
              if (root == null) return null
              root.\`val\` = 0
              var level = ArrayList<TreeNode>()
              level.add(root)
              while (level.isNotEmpty()) {
                  val m = level.size
                  val pairs = IntArray(m)
                  var total = 0
                  for (i in 0 until m) {
                      val l = level[i].left
                      val r = level[i].right
                      pairs[i] = (if (l != null) l.\`val\` else 0) + (if (r != null) r.\`val\` else 0)
                      total += pairs[i]
                  }
                  val next = ArrayList<TreeNode>()
                  for (i in 0 until m) {
                      val l = level[i].left
                      val r = level[i].right
                      if (l != null) { l.\`val\` = total - pairs[i]; next.add(l) }
                      if (r != null) { r.\`val\` = total - pairs[i]; next.add(r) }
                  }
                  level = next
              }
              return root
          }
        `),
        swift: code`
          func replaceValueInTree(_ root: TreeNode?) -> TreeNode? {
              guard let r = root else { return nil }
              r.val = 0
              var level: [TreeNode] = [r]
              while !level.isEmpty {
                  var pairs: [Int] = []
                  var total = 0
                  for node in level {
                      let s = (node.left?.val ?? 0) + (node.right?.val ?? 0)
                      pairs.append(s)
                      total += s
                  }
                  var next: [TreeNode] = []
                  for (i, p) in level.enumerated() {
                      if let l = p.left { l.val = total - pairs[i]; next.append(l) }
                      if let rr = p.right { rr.val = total - pairs[i]; next.append(rr) }
                  }
                  level = next
              }
              return r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn replaceValueInTree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = &root {
                  r.borrow_mut().val = 0;
                  level.push(r.clone());
              }
              while !level.is_empty() {
                  let mut total = 0;
                  let mut groups: Vec<(i32, Vec<Rc<RefCell<TreeNode>>>)> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      let mut s = 0;
                      let mut kids: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                      if let Some(l) = &b.left {
                          s += l.borrow().val;
                          kids.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          s += r.borrow().val;
                          kids.push(r.clone());
                      }
                      total += s;
                      groups.push((s, kids));
                  }
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for (s, kids) in &groups {
                      for kid in kids {
                          kid.borrow_mut().val = total - *s;
                          next.push(kid.clone());
                      }
                  }
                  level = next;
              }
              root
          }
        `,
        php: code`
          function replaceValueInTree($root) {
              if ($root === null) return null;
              $root->val = 0;
              $level = [$root];
              while (count($level) > 0) {
                  $pairs = [];
                  $total = 0;
                  foreach ($level as $node) {
                      $s = ($node->left !== null ? $node->left->val : 0) + ($node->right !== null ? $node->right->val : 0);
                      $pairs[] = $s;
                      $total += $s;
                  }
                  $next = [];
                  foreach ($level as $i => $p) {
                      if ($p->left !== null) { $p->left->val = $total - $pairs[$i]; $next[] = $p->left; }
                      if ($p->right !== null) { $p->right->val = $total - $pairs[$i]; $next[] = $p->right; }
                  }
                  $level = $next;
              }
              return $root;
          }
        `,
        ruby: code`
          def replaceValueInTree(root)
            return nil if root.nil?
            root.val = 0
            level = [root]
            until level.empty?
              pairs = level.map { |node| (node.left ? node.left.val : 0) + (node.right ? node.right.val : 0) }
              total = pairs.sum
              nxt = []
              level.each_with_index do |p, i|
                [p.left, p.right].each do |child|
                  next unless child
                  child.val = total - pairs[i]
                  nxt << child
                end
              end
              level = nxt
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Top View of Binary Tree (GFG) ──────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const first = new Map<number, number>();
      for (const [n, d] of hdLevelOrder(root)) if (!first.has(d)) first.set(d, n.val);
      return [...first.keys()].sort((a, b) => a - b).map((d) => first.get(d)!);
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6, 7], note: "Columns −2..2 are first reached by 4, 2, 1, 3 and 7. 5 and 6 share column 0 with 1 and sit below it." },
      { root: [10, 20, 30, 40, 60, 90, 100], note: "Seen from above: 40, 20, 10, 30, 100." },
      { root: [1, 2, null, null, 3, null, 4, null, 5], note: "The chain bends back right: 3 lands in column 0, hidden under the root, while 4 and 5 open columns 1 and 2." },
    ];
    return {
      slug: "top-view-of-binary-tree",
      title: "Top View of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Hash Table", "Amazon", "Walmart", "Samsung"],
      signature: { funcName: "topView", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **top view**: the values you would see looking down on the tree from above, listed from the leftmost column to the rightmost.\n\nThe root is in column `0`; a node's left child is one column to the left (`-1`) and its right child one column to the right (`+1`). For each column, the visible node is the one **closest to the root** (smallest depth); if two nodes of a column are at the same depth, the one that comes first in a left-to-right level-order traversal is visible.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Give every node a column number: root 0, left child column − 1, right child column + 1.",
        "The visible node of a column is the first one met when you go from the top down — that is exactly the order of a breadth-first (level-order) traversal.",
        "Run a BFS carrying each node's column; record a node only if its column has not been seen yet. Then output the columns from the smallest to the largest.",
      ],
      editorial: explain({
        idea: "A level-order traversal meets nodes by increasing depth, left to right within a depth — the visibility rule exactly. Recording the first node per column during BFS gives the top view.",
        steps: [
          "Run a breadth-first traversal from the root, carrying each node's column (left child `c - 1`, right child `c + 1`).",
          "When a node's column has no entry yet, store the node's value for that column.",
          "Track the smallest and largest column seen (columns are contiguous, from `min` to `max`).",
          "Return the stored values for the columns `min, min + 1, …, max`.",
        ],
        why: "BFS visits all nodes of depth `d` before any of depth `d + 1`, and within a depth from left to right, so the first node recorded for a column is its shallowest, leftmost-in-level-order node — the one the view shows. Every column between the extremes is occupied, because the path from the root to an extreme node passes through every column in between.",
        time: "O(n) with an array or hash map indexed by column (O(n log n) with a sorted map)",
        space: "O(n)",
        pitfalls: [
          "A depth-first traversal visits a deep left-subtree node before a shallow right-subtree node of the same column; without tracking depth it records the wrong one.",
          "Columns can be negative — offset them by the node count when indexing an array.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def topView(root: Optional[TreeNode]) -> List[int]:
              if root is None:
                  return []
              first = {}
              queue = [(root, 0)]
              head = 0
              while head < len(queue):
                  node, col = queue[head]
                  head += 1
                  if col not in first:
                      first[col] = node.val
                  if node.left:
                      queue.append((node.left, col - 1))
                  if node.right:
                      queue.append((node.right, col + 1))
              return [first[c] for c in range(min(first), max(first) + 1)]
        `,
        javascript: code`
          var topView = function(root) {
              if (root === null) return [];
              var first = {}, lo = 0, hi = 0;
              var nodes = [root], cols = [0], head = 0;
              while (head < nodes.length) {
                  var node = nodes[head], col = cols[head];
                  head++;
                  if (!(col in first)) first[col] = node.val;
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node.left !== null) { nodes.push(node.left); cols.push(col - 1); }
                  if (node.right !== null) { nodes.push(node.right); cols.push(col + 1); }
              }
              var out = [];
              for (var c = lo; c <= hi; c++) out.push(first[c]);
              return out;
          };
        `,
        typescript: code`
          function topView(root: TreeNode | null): number[] {
              if (root === null) return [];
              var first: { [col: number]: number } = {};
              var lo = 0, hi = 0;
              var nodes: TreeNode[] = [root], cols: number[] = [0];
              var head = 0;
              while (head < nodes.length) {
                  var node = nodes[head], col = cols[head];
                  head++;
                  if (!(col in first)) first[col] = node.val;
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node.left !== null) { nodes.push(node.left); cols.push(col - 1); }
                  if (node.right !== null) { nodes.push(node.right); cols.push(col + 1); }
              }
              var out: number[] = [];
              for (var c = lo; c <= hi; c++) out.push(first[c]);
              return out;
          }
        `,
        java: code`
          public static int[] topView(TreeNode root) {
              if (root == null) return new int[0];
              Map<Integer, Integer> first = new HashMap<>();
              List<TreeNode> nodes = new ArrayList<>();
              List<Integer> cols = new ArrayList<>();
              nodes.add(root);
              cols.add(0);
              int lo = 0, hi = 0;
              for (int h = 0; h < nodes.size(); h++) {
                  TreeNode node = nodes.get(h);
                  int col = cols.get(h);
                  if (!first.containsKey(col)) first.put(col, node.val);
                  lo = Math.min(lo, col);
                  hi = Math.max(hi, col);
                  if (node.left != null) { nodes.add(node.left); cols.add(col - 1); }
                  if (node.right != null) { nodes.add(node.right); cols.add(col + 1); }
              }
              int[] out = new int[hi - lo + 1];
              for (int c = lo; c <= hi; c++) out[c - lo] = first.get(c);
              return out;
          }
        `,
        cpp: code`
          vector<int> topView(TreeNode* root) {
              if (!root) return {};
              map<int, int> first;
              vector<pair<TreeNode*, int>> q = {{root, 0}};
              for (size_t h = 0; h < q.size(); h++) {
                  TreeNode* node = q[h].first;
                  int col = q[h].second;
                  if (!first.count(col)) first[col] = node->val;
                  if (node->left) q.push_back({node->left, col - 1});
                  if (node->right) q.push_back({node->right, col + 1});
              }
              vector<int> out;
              for (auto& kv : first) out.push_back(kv.second);
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int* topView(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int* cols = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* seen = (int*) calloc((size_t) (2 * n + 1), sizeof(int));
              int* val = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int head = 0, tail = 0, lo = 0, hi = 0;
              if (root != NULL) { queue[tail] = root; cols[tail] = 0; tail++; }
              while (head < tail) {
                  struct TreeNode* node = queue[head];
                  int col = cols[head];
                  head++;
                  if (!seen[col + n]) { seen[col + n] = 1; val[col + n] = node->val; }
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node->left != NULL) { queue[tail] = node->left; cols[tail] = col - 1; tail++; }
                  if (node->right != NULL) { queue[tail] = node->right; cols[tail] = col + 1; tail++; }
              }
              int len = root == NULL ? 0 : hi - lo + 1;
              int* out = (int*) malloc((size_t) (len + 1) * sizeof(int));
              for (int i = 0; i < len; i++) out[i] = val[lo + i + n];
              free(queue); free(cols); free(seen); free(val);
              *returnSize = len;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[] TopView(TreeNode root)
          {
              if (root == null) return new int[0];
              var first = new SortedDictionary<int, int>();
              var nodes = new List<TreeNode> { root };
              var cols = new List<int> { 0 };
              for (int h = 0; h < nodes.Count; h++)
              {
                  var node = nodes[h];
                  int col = cols[h];
                  if (!first.ContainsKey(col)) first[col] = node.val;
                  if (node.left != null) { nodes.Add(node.left); cols.Add(col - 1); }
                  if (node.right != null) { nodes.Add(node.right); cols.Add(col + 1); }
              }
              return first.Values.ToArray();
          }
        `,
        go: code`
          func topView(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              first := map[int]int{}
              nodes := []*TreeNode{root}
              cols := []int{0}
              lo, hi := 0, 0
              for h := 0; h < len(nodes); h++ {
                  node, col := nodes[h], cols[h]
                  if _, ok := first[col]; !ok {
                      first[col] = node.Val
                  }
                  if col < lo {
                      lo = col
                  }
                  if col > hi {
                      hi = col
                  }
                  if node.Left != nil {
                      nodes = append(nodes, node.Left)
                      cols = append(cols, col-1)
                  }
                  if node.Right != nil {
                      nodes = append(nodes, node.Right)
                      cols = append(cols, col+1)
                  }
              }
              for c := lo; c <= hi; c++ {
                  out = append(out, first[c])
              }
              return out
          }
        `,
        kotlin: kt(`
          fun topView(root: TreeNode?): IntArray {
              if (root == null) return IntArray(0)
              val first = HashMap<Int, Int>()
              val nodes = ArrayList<TreeNode>()
              val cols = ArrayList<Int>()
              nodes.add(root)
              cols.add(0)
              var lo = 0
              var hi = 0
              var h = 0
              while (h < nodes.size) {
                  val node = nodes[h]
                  val col = cols[h]
                  h++
                  if (!first.containsKey(col)) first[col] = node.\`val\`
                  if (col < lo) lo = col
                  if (col > hi) hi = col
                  val l = node.left
                  val r = node.right
                  if (l != null) { nodes.add(l); cols.add(col - 1) }
                  if (r != null) { nodes.add(r); cols.add(col + 1) }
              }
              return IntArray(hi - lo + 1) { first[lo + it]!! }
          }
        `),
        swift: code`
          func topView(_ root: TreeNode?) -> [Int] {
              guard let r = root else { return [] }
              var first: [Int: Int] = [:]
              var nodes: [TreeNode] = [r]
              var cols: [Int] = [0]
              var lo = 0
              var hi = 0
              var h = 0
              while h < nodes.count {
                  let node = nodes[h]
                  let col = cols[h]
                  h += 1
                  if first[col] == nil { first[col] = node.val }
                  lo = min(lo, col)
                  hi = max(hi, col)
                  if let l = node.left { nodes.append(l); cols.append(col - 1) }
                  if let rr = node.right { nodes.append(rr); cols.append(col + 1) }
              }
              return (lo...hi).map { first[$0]! }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::BTreeMap;

          fn topView(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut first: BTreeMap<i32, i32> = BTreeMap::new();
              let mut queue: Vec<(Rc<RefCell<TreeNode>>, i32)> = Vec::new();
              if let Some(r) = root {
                  queue.push((r, 0));
              }
              let mut h = 0;
              while h < queue.len() {
                  let (node, col) = (queue[h].0.clone(), queue[h].1);
                  h += 1;
                  let b = node.borrow();
                  first.entry(col).or_insert(b.val);
                  if let Some(l) = &b.left {
                      queue.push((l.clone(), col - 1));
                  }
                  if let Some(r) = &b.right {
                      queue.push((r.clone(), col + 1));
                  }
              }
              first.values().cloned().collect()
          }
        `,
        php: code`
          function topView($root) {
              if ($root === null) return [];
              $first = [];
              $nodes = [$root];
              $cols = [0];
              for ($h = 0; $h < count($nodes); $h++) {
                  $node = $nodes[$h];
                  $col = $cols[$h];
                  if (!array_key_exists($col, $first)) $first[$col] = $node->val;
                  if ($node->left !== null) { $nodes[] = $node->left; $cols[] = $col - 1; }
                  if ($node->right !== null) { $nodes[] = $node->right; $cols[] = $col + 1; }
              }
              ksort($first);
              return array_values($first);
          }
        `,
        ruby: code`
          def topView(root)
            return [] if root.nil?
            first = {}
            queue = [[root, 0]]
            h = 0
            while h < queue.size
              node, col = queue[h]
              h += 1
              first[col] = node.val unless first.key?(col)
              queue << [node.left, col - 1] if node.left
              queue << [node.right, col + 1] if node.right
            end
            first.keys.sort.map { |c| first[c] }
          end
        `,
      },
    };
  })(),

  // ── Bottom View of Binary Tree (GFG) ───────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const last = new Map<number, number>();
      for (const [n, d] of hdLevelOrder(root)) last.set(d, n.val);
      return [...last.keys()].sort((a, b) => a - b).map((d) => last.get(d)!);
    };
    const EX = [
      { root: [20, 8, 22, 5, 3, null, 25, null, null, 10, 14], note: "Column 0 holds 20 and, lower down, 3. Column −1 holds 8 and 10, column 1 holds 22 and 14 — in each the lower node shows." },
      { root: [1, 2, 3, 4, 5, 6, 7], note: "5 and 6 share column 0 at the same depth; 6 comes later in level order, so it is the one seen." },
      { root: [7], note: "A single node is its own bottom view." },
    ];
    return {
      slug: "bottom-view-of-binary-tree",
      title: "Bottom View of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Hash Table", "Amazon", "Flipkart", "Walmart"],
      signature: { funcName: "bottomView", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **bottom view**: the values you would see looking up at the tree from below, listed from the leftmost column to the rightmost.\n\nThe root is in column `0`; a node's left child is one column to the left and its right child one column to the right. For each column, the visible node is the **deepest** one; if several nodes of a column share the greatest depth, the one that comes **last** in a left-to-right level-order traversal is visible.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Number the columns: root 0, left child column − 1, right child column + 1.",
        "In a level-order traversal, a later node is never shallower than an earlier one, and ties at the same depth go left to right.",
        "So run a BFS carrying columns and simply overwrite each column's entry with every node you meet — the last write is the visible node.",
      ],
      editorial: explain({
        idea: "A breadth-first traversal meets nodes in non-decreasing depth, left to right within a depth. The last node recorded for a column is therefore its deepest, and among the deepest the last in level order — exactly the bottom-view rule.",
        steps: [
          "Run a BFS from the root carrying each node's column (left `c - 1`, right `c + 1`).",
          "For every node, set `view[column] = node.val`, overwriting what was there.",
          "Track the smallest and largest column.",
          "Return `view[min], …, view[max]`.",
        ],
        why: "When BFS reaches a node, every node before it in the queue is at most as deep, and nodes of the same depth before it lie to its left in level order. Overwriting keeps the latest visit, which is the deepest node of the column and, among equals, the last in level order.",
        time: "O(n) with an array indexed by column (O(n log n) with a sorted map)",
        space: "O(n)",
        pitfalls: [
          "A depth-first traversal can reach a shallower node of a column after a deeper one; it needs explicit depth comparisons.",
          "For a tie at the same depth the later node in level order wins — the opposite of the top view's rule.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def bottomView(root: Optional[TreeNode]) -> List[int]:
              if root is None:
                  return []
              view = {}
              queue = [(root, 0)]
              head = 0
              while head < len(queue):
                  node, col = queue[head]
                  head += 1
                  view[col] = node.val
                  if node.left:
                      queue.append((node.left, col - 1))
                  if node.right:
                      queue.append((node.right, col + 1))
              return [view[c] for c in range(min(view), max(view) + 1)]
        `,
        javascript: code`
          var bottomView = function(root) {
              if (root === null) return [];
              var view = {}, lo = 0, hi = 0;
              var nodes = [root], cols = [0], head = 0;
              while (head < nodes.length) {
                  var node = nodes[head], col = cols[head];
                  head++;
                  view[col] = node.val;
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node.left !== null) { nodes.push(node.left); cols.push(col - 1); }
                  if (node.right !== null) { nodes.push(node.right); cols.push(col + 1); }
              }
              var out = [];
              for (var c = lo; c <= hi; c++) out.push(view[c]);
              return out;
          };
        `,
        typescript: code`
          function bottomView(root: TreeNode | null): number[] {
              if (root === null) return [];
              var view: { [col: number]: number } = {};
              var lo = 0, hi = 0;
              var nodes: TreeNode[] = [root], cols: number[] = [0];
              var head = 0;
              while (head < nodes.length) {
                  var node = nodes[head], col = cols[head];
                  head++;
                  view[col] = node.val;
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node.left !== null) { nodes.push(node.left); cols.push(col - 1); }
                  if (node.right !== null) { nodes.push(node.right); cols.push(col + 1); }
              }
              var out: number[] = [];
              for (var c = lo; c <= hi; c++) out.push(view[c]);
              return out;
          }
        `,
        java: code`
          public static int[] bottomView(TreeNode root) {
              if (root == null) return new int[0];
              Map<Integer, Integer> view = new HashMap<>();
              List<TreeNode> nodes = new ArrayList<>();
              List<Integer> cols = new ArrayList<>();
              nodes.add(root);
              cols.add(0);
              int lo = 0, hi = 0;
              for (int h = 0; h < nodes.size(); h++) {
                  TreeNode node = nodes.get(h);
                  int col = cols.get(h);
                  view.put(col, node.val);
                  lo = Math.min(lo, col);
                  hi = Math.max(hi, col);
                  if (node.left != null) { nodes.add(node.left); cols.add(col - 1); }
                  if (node.right != null) { nodes.add(node.right); cols.add(col + 1); }
              }
              int[] out = new int[hi - lo + 1];
              for (int c = lo; c <= hi; c++) out[c - lo] = view.get(c);
              return out;
          }
        `,
        cpp: code`
          vector<int> bottomView(TreeNode* root) {
              if (!root) return {};
              map<int, int> view;
              vector<pair<TreeNode*, int>> q = {{root, 0}};
              for (size_t h = 0; h < q.size(); h++) {
                  TreeNode* node = q[h].first;
                  int col = q[h].second;
                  view[col] = node->val;
                  if (node->left) q.push_back({node->left, col - 1});
                  if (node->right) q.push_back({node->right, col + 1});
              }
              vector<int> out;
              for (auto& kv : view) out.push_back(kv.second);
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int* bottomView(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int* cols = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* view = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int head = 0, tail = 0, lo = 0, hi = 0;
              if (root != NULL) { queue[tail] = root; cols[tail] = 0; tail++; }
              while (head < tail) {
                  struct TreeNode* node = queue[head];
                  int col = cols[head];
                  head++;
                  view[col + n] = node->val;
                  if (col < lo) lo = col;
                  if (col > hi) hi = col;
                  if (node->left != NULL) { queue[tail] = node->left; cols[tail] = col - 1; tail++; }
                  if (node->right != NULL) { queue[tail] = node->right; cols[tail] = col + 1; tail++; }
              }
              int len = root == NULL ? 0 : hi - lo + 1;
              int* out = (int*) malloc((size_t) (len + 1) * sizeof(int));
              for (int i = 0; i < len; i++) out[i] = view[lo + i + n];
              free(queue); free(cols); free(view);
              *returnSize = len;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[] BottomView(TreeNode root)
          {
              if (root == null) return new int[0];
              var view = new SortedDictionary<int, int>();
              var nodes = new List<TreeNode> { root };
              var cols = new List<int> { 0 };
              for (int h = 0; h < nodes.Count; h++)
              {
                  var node = nodes[h];
                  int col = cols[h];
                  view[col] = node.val;
                  if (node.left != null) { nodes.Add(node.left); cols.Add(col - 1); }
                  if (node.right != null) { nodes.Add(node.right); cols.Add(col + 1); }
              }
              return view.Values.ToArray();
          }
        `,
        go: code`
          func bottomView(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              view := map[int]int{}
              nodes := []*TreeNode{root}
              cols := []int{0}
              lo, hi := 0, 0
              for h := 0; h < len(nodes); h++ {
                  node, col := nodes[h], cols[h]
                  view[col] = node.Val
                  if col < lo {
                      lo = col
                  }
                  if col > hi {
                      hi = col
                  }
                  if node.Left != nil {
                      nodes = append(nodes, node.Left)
                      cols = append(cols, col-1)
                  }
                  if node.Right != nil {
                      nodes = append(nodes, node.Right)
                      cols = append(cols, col+1)
                  }
              }
              for c := lo; c <= hi; c++ {
                  out = append(out, view[c])
              }
              return out
          }
        `,
        kotlin: kt(`
          fun bottomView(root: TreeNode?): IntArray {
              if (root == null) return IntArray(0)
              val view = HashMap<Int, Int>()
              val nodes = ArrayList<TreeNode>()
              val cols = ArrayList<Int>()
              nodes.add(root)
              cols.add(0)
              var lo = 0
              var hi = 0
              var h = 0
              while (h < nodes.size) {
                  val node = nodes[h]
                  val col = cols[h]
                  h++
                  view[col] = node.\`val\`
                  if (col < lo) lo = col
                  if (col > hi) hi = col
                  val l = node.left
                  val r = node.right
                  if (l != null) { nodes.add(l); cols.add(col - 1) }
                  if (r != null) { nodes.add(r); cols.add(col + 1) }
              }
              return IntArray(hi - lo + 1) { view[lo + it]!! }
          }
        `),
        swift: code`
          func bottomView(_ root: TreeNode?) -> [Int] {
              guard let r = root else { return [] }
              var view: [Int: Int] = [:]
              var nodes: [TreeNode] = [r]
              var cols: [Int] = [0]
              var lo = 0
              var hi = 0
              var h = 0
              while h < nodes.count {
                  let node = nodes[h]
                  let col = cols[h]
                  h += 1
                  view[col] = node.val
                  lo = min(lo, col)
                  hi = max(hi, col)
                  if let l = node.left { nodes.append(l); cols.append(col - 1) }
                  if let rr = node.right { nodes.append(rr); cols.append(col + 1) }
              }
              return (lo...hi).map { view[$0]! }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::BTreeMap;

          fn bottomView(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut view: BTreeMap<i32, i32> = BTreeMap::new();
              let mut queue: Vec<(Rc<RefCell<TreeNode>>, i32)> = Vec::new();
              if let Some(r) = root {
                  queue.push((r, 0));
              }
              let mut h = 0;
              while h < queue.len() {
                  let (node, col) = (queue[h].0.clone(), queue[h].1);
                  h += 1;
                  let b = node.borrow();
                  view.insert(col, b.val);
                  if let Some(l) = &b.left {
                      queue.push((l.clone(), col - 1));
                  }
                  if let Some(r) = &b.right {
                      queue.push((r.clone(), col + 1));
                  }
              }
              view.values().cloned().collect()
          }
        `,
        php: code`
          function bottomView($root) {
              if ($root === null) return [];
              $view = [];
              $nodes = [$root];
              $cols = [0];
              for ($h = 0; $h < count($nodes); $h++) {
                  $node = $nodes[$h];
                  $col = $cols[$h];
                  $view[$col] = $node->val;
                  if ($node->left !== null) { $nodes[] = $node->left; $cols[] = $col - 1; }
                  if ($node->right !== null) { $nodes[] = $node->right; $cols[] = $col + 1; }
              }
              ksort($view);
              return array_values($view);
          }
        `,
        ruby: code`
          def bottomView(root)
            return [] if root.nil?
            view = {}
            queue = [[root, 0]]
            h = 0
            while h < queue.size
              node, col = queue[h]
              h += 1
              view[col] = node.val
              queue << [node.left, col - 1] if node.left
              queue << [node.right, col + 1] if node.right
            end
            view.keys.sort.map { |c| view[c] }
          end
        `,
      },
    };
  })(),

  // ── Boundary Traversal of Binary Tree (GFG) ────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      if (!root) return [];
      const out = [root.val];
      if (isLeaf(root)) return out;
      for (let c = root.left; c && !isLeaf(c); c = c.left ? c.left : c.right) out.push(c.val);
      for (const n of nodesOf(root)) if (n !== root && isLeaf(n)) out.push(n.val);
      const right: number[] = [];
      for (let c = root.right; c && !isLeaf(c); c = c.right ? c.right : c.left) right.push(c.val);
      return out.concat(right.reverse());
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6, 7, null, null, 8, 9], note: "Root 1; left boundary 2 (4 is a leaf); leaves 4, 8, 9, 6, 7; right boundary 3 read bottom-up." },
      { root: [1, 2, null, 4, 9, 6, 5, null, 3, null, null, null, null, 7, 8], note: "There is no right subtree, so the boundary is the root, the left edge 2, 4, the leaves 6, 5, 7, 8 and nothing more — 9 is on the inside and not a leaf." },
      { root: [1, null, 2, null, 3], note: "No left subtree: after the root comes the only leaf 3, then the right edge 2 read upwards." },
    ];
    return {
      slug: "boundary-traversal-of-binary-tree",
      title: "Boundary Traversal of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Microsoft", "Flipkart"],
      signature: { funcName: "boundaryTraversal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the values of its **boundary** in anticlockwise order, with no node listed twice:\n\n1. **The root.**\n2. **The left boundary** without its leaf: start at the root's left child and keep moving to the left child, or to the right child when there is no left one, stopping before the first leaf. If the root has no left child, this part is empty.\n3. **All the leaves** (nodes with no children), from left to right.\n4. **The right boundary** without its leaf, **bottom-up**: built like the left boundary from the root's right child, preferring the right child, then listed in reverse. If the root has no right child, this part is empty.\n\nIf the root itself is a leaf, the answer is just the root.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Split the answer into four parts that never overlap: the root, the left edge without leaves, the leaves, and the right edge without leaves.",
        "The two edges are simple walks: down the left side preferring left children, down the right side preferring right children — stop at a leaf, since leaves are listed separately.",
        "Collect leaves with a depth-first traversal that visits left before right; reverse the right edge before appending it.",
      ],
      editorial: explain({
        idea: "Treat the boundary as four disjoint lists built in order: the root, the left edge's internal nodes top-down, every leaf left to right, and the right edge's internal nodes bottom-up.",
        steps: [
          "Output the root. If it is a leaf, stop.",
          "Walk from `root.left`: while the node is not a leaf, output it and move to its left child, or its right child if there is no left one.",
          "Run a preorder DFS (left before right) from the root and output every leaf other than the root.",
          "Walk from `root.right` the same way preferring right children, collecting non-leaf nodes; output them in reverse.",
        ],
        why: "Each node is listed in at most one part: the edges skip leaves, the leaf pass lists only leaves, and the root is excluded from both edges (they start at its children). A preorder DFS reaches leaves in left-to-right order, and reversing the right edge produces the anticlockwise direction up the right side.",
        time: "O(n)",
        space: "O(h) for the DFS plus the output",
        pitfalls: [
          "Leaves at the bottom of the left or right edge must not be listed twice — stop each edge walk before a leaf.",
          "When the root has no left child, the left edge is empty; do not walk down the right subtree instead.",
          "A root that is a leaf appears once, not again among the leaves.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def boundaryTraversal(root: Optional[TreeNode]) -> List[int]:
              if root is None:
                  return []
              def leaf(n):
                  return n.left is None and n.right is None
              out = [root.val]
              if leaf(root):
                  return out
              cur = root.left
              while cur and not leaf(cur):
                  out.append(cur.val)
                  cur = cur.left if cur.left else cur.right
              stack = [root]
              while stack:
                  node = stack.pop()
                  if node is not root and leaf(node):
                      out.append(node.val)
                  if node.right:
                      stack.append(node.right)
                  if node.left:
                      stack.append(node.left)
              right = []
              cur = root.right
              while cur and not leaf(cur):
                  right.append(cur.val)
                  cur = cur.right if cur.right else cur.left
              out.extend(reversed(right))
              return out
        `,
        javascript: code`
          var boundaryTraversal = function(root) {
              if (root === null) return [];
              var leaf = function(n) { return n.left === null && n.right === null; };
              var out = [root.val];
              if (leaf(root)) return out;
              var cur = root.left;
              while (cur !== null && !leaf(cur)) {
                  out.push(cur.val);
                  cur = cur.left !== null ? cur.left : cur.right;
              }
              var stack = [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node !== root && leaf(node)) out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              var right = [];
              cur = root.right;
              while (cur !== null && !leaf(cur)) {
                  right.push(cur.val);
                  cur = cur.right !== null ? cur.right : cur.left;
              }
              for (var i = right.length - 1; i >= 0; i--) out.push(right[i]);
              return out;
          };
        `,
        typescript: code`
          function boundaryTraversal(root: TreeNode | null): number[] {
              if (root === null) return [];
              var leaf = function(n: TreeNode): boolean { return n.left === null && n.right === null; };
              var out: number[] = [root.val];
              if (leaf(root)) return out;
              var cur: TreeNode | null = root.left;
              while (cur !== null && !leaf(cur)) {
                  out.push(cur.val);
                  cur = cur.left !== null ? cur.left : cur.right;
              }
              var stack: TreeNode[] = [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (node !== root && leaf(node)) out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              var right: number[] = [];
              cur = root.right;
              while (cur !== null && !leaf(cur)) {
                  right.push(cur.val);
                  cur = cur.right !== null ? cur.right : cur.left;
              }
              for (var i = right.length - 1; i >= 0; i--) out.push(right[i]);
              return out;
          }
        `,
        java: code`
          public static int[] boundaryTraversal(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              if (root == null) return new int[0];
              out.add(root.val);
              if (root.left != null || root.right != null) {
                  TreeNode cur = root.left;
                  while (cur != null && (cur.left != null || cur.right != null)) {
                      out.add(cur.val);
                      cur = cur.left != null ? cur.left : cur.right;
                  }
                  Deque<TreeNode> stack = new ArrayDeque<>();
                  stack.push(root);
                  while (!stack.isEmpty()) {
                      TreeNode node = stack.pop();
                      if (node != root && node.left == null && node.right == null) out.add(node.val);
                      if (node.right != null) stack.push(node.right);
                      if (node.left != null) stack.push(node.left);
                  }
                  List<Integer> right = new ArrayList<>();
                  cur = root.right;
                  while (cur != null && (cur.left != null || cur.right != null)) {
                      right.add(cur.val);
                      cur = cur.right != null ? cur.right : cur.left;
                  }
                  for (int i = right.size() - 1; i >= 0; i--) out.add(right.get(i));
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          static bool isLeafNode(TreeNode* n);

          vector<int> boundaryTraversal(TreeNode* root) {
              vector<int> out;
              if (!root) return out;
              out.push_back(root->val);
              if (isLeafNode(root)) return out;
              TreeNode* cur = root->left;
              while (cur && !isLeafNode(cur)) {
                  out.push_back(cur->val);
                  cur = cur->left ? cur->left : cur->right;
              }
              vector<TreeNode*> stack = {root};
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  if (node != root && isLeafNode(node)) out.push_back(node->val);
                  if (node->right) stack.push_back(node->right);
                  if (node->left) stack.push_back(node->left);
              }
              vector<int> right;
              cur = root->right;
              while (cur && !isLeafNode(cur)) {
                  right.push_back(cur->val);
                  cur = cur->right ? cur->right : cur->left;
              }
              out.insert(out.end(), right.rbegin(), right.rend());
              return out;
          }

          static bool isLeafNode(TreeNode* n) {
              return !n->left && !n->right;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int isLeafNode(struct TreeNode* n);
          static void addLeaves(struct TreeNode* t, int* out, int* len);

          int* boundaryTraversal(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int len = 0;
              if (root != NULL) {
                  out[len++] = root->val;
                  if (!isLeafNode(root)) {
                      struct TreeNode* cur = root->left;
                      while (cur != NULL && !isLeafNode(cur)) {
                          out[len++] = cur->val;
                          cur = cur->left != NULL ? cur->left : cur->right;
                      }
                      addLeaves(root->left, out, &len);
                      addLeaves(root->right, out, &len);
                      int* right = (int*) malloc((size_t) (n + 1) * sizeof(int));
                      int rl = 0;
                      cur = root->right;
                      while (cur != NULL && !isLeafNode(cur)) {
                          right[rl++] = cur->val;
                          cur = cur->right != NULL ? cur->right : cur->left;
                      }
                      while (rl > 0) out[len++] = right[--rl];
                      free(right);
                  }
              }
              *returnSize = len;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int isLeafNode(struct TreeNode* n) {
              return n->left == NULL && n->right == NULL;
          }

          static void addLeaves(struct TreeNode* t, int* out, int* len) {
              if (t == NULL) return;
              if (isLeafNode(t)) { out[(*len)++] = t->val; return; }
              addLeaves(t->left, out, len);
              addLeaves(t->right, out, len);
          }
        `,
        csharp: code`
          public static int[] BoundaryTraversal(TreeNode root)
          {
              var output = new List<int>();
              if (root == null) return output.ToArray();
              output.Add(root.val);
              if (root.left == null && root.right == null) return output.ToArray();
              TreeNode cur = root.left;
              while (cur != null && (cur.left != null || cur.right != null))
              {
                  output.Add(cur.val);
                  cur = cur.left != null ? cur.left : cur.right;
              }
              var stack = new Stack<TreeNode>();
              stack.Push(root);
              while (stack.Count > 0)
              {
                  var node = stack.Pop();
                  if (node != root && node.left == null && node.right == null) output.Add(node.val);
                  if (node.right != null) stack.Push(node.right);
                  if (node.left != null) stack.Push(node.left);
              }
              var right = new List<int>();
              cur = root.right;
              while (cur != null && (cur.left != null || cur.right != null))
              {
                  right.Add(cur.val);
                  cur = cur.right != null ? cur.right : cur.left;
              }
              right.Reverse();
              output.AddRange(right);
              return output.ToArray();
          }
        `,
        go: code`
          func boundaryTraversal(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              leaf := func(n *TreeNode) bool { return n.Left == nil && n.Right == nil }
              out = append(out, root.Val)
              if leaf(root) {
                  return out
              }
              cur := root.Left
              for cur != nil && !leaf(cur) {
                  out = append(out, cur.Val)
                  if cur.Left != nil {
                      cur = cur.Left
                  } else {
                      cur = cur.Right
                  }
              }
              stack := []*TreeNode{root}
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if node != root && leaf(node) {
                      out = append(out, node.Val)
                  }
                  if node.Right != nil {
                      stack = append(stack, node.Right)
                  }
                  if node.Left != nil {
                      stack = append(stack, node.Left)
                  }
              }
              right := []int{}
              cur = root.Right
              for cur != nil && !leaf(cur) {
                  right = append(right, cur.Val)
                  if cur.Right != nil {
                      cur = cur.Right
                  } else {
                      cur = cur.Left
                  }
              }
              for i := len(right) - 1; i >= 0; i-- {
                  out = append(out, right[i])
              }
              return out
          }
        `,
        kotlin: kt(`
          fun boundaryTraversal(root: TreeNode?): IntArray {
              if (root == null) return IntArray(0)
              val out = ArrayList<Int>()
              out.add(root.\`val\`)
              if (root.left == null && root.right == null) return out.toIntArray()
              var cur = root.left
              while (cur != null && (cur.left != null || cur.right != null)) {
                  out.add(cur.\`val\`)
                  cur = if (cur.left != null) cur.left else cur.right
              }
              val stack = ArrayList<TreeNode>()
              stack.add(root)
              while (stack.isNotEmpty()) {
                  val node = stack.removeAt(stack.size - 1)
                  val l = node.left
                  val r = node.right
                  if (node !== root && l == null && r == null) out.add(node.\`val\`)
                  if (r != null) stack.add(r)
                  if (l != null) stack.add(l)
              }
              val right = ArrayList<Int>()
              cur = root.right
              while (cur != null && (cur.left != null || cur.right != null)) {
                  right.add(cur.\`val\`)
                  cur = if (cur.right != null) cur.right else cur.left
              }
              for (i in right.size - 1 downTo 0) out.add(right[i])
              return out.toIntArray()
          }
        `),
        swift: code`
          func boundaryTraversal(_ root: TreeNode?) -> [Int] {
              guard let r = root else { return [] }
              func leaf(_ n: TreeNode) -> Bool { return n.left == nil && n.right == nil }
              var out: [Int] = [r.val]
              if leaf(r) { return out }
              var cur = r.left
              while let c = cur, !leaf(c) {
                  out.append(c.val)
                  cur = c.left != nil ? c.left : c.right
              }
              var stack: [TreeNode] = [r]
              while !stack.isEmpty {
                  let node = stack.removeLast()
                  if node !== r && leaf(node) { out.append(node.val) }
                  if let rr = node.right { stack.append(rr) }
                  if let l = node.left { stack.append(l) }
              }
              var right: [Int] = []
              cur = r.right
              while let c = cur, !leaf(c) {
                  right.append(c.val)
                  cur = c.right != nil ? c.right : c.left
              }
              out.append(contentsOf: right.reversed())
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn boundaryTraversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              let r = match root {
                  None => return out,
                  Some(r) => r,
              };
              out.push(r.borrow().val);
              if is_leaf(&r) {
                  return out;
              }
              let mut cur = r.borrow().left.clone();
              while let Some(c) = cur {
                  if is_leaf(&c) {
                      break;
                  }
                  out.push(c.borrow().val);
                  let b = c.borrow();
                  cur = if b.left.is_some() { b.left.clone() } else { b.right.clone() };
              }
              add_leaves(&r.borrow().left, &mut out);
              add_leaves(&r.borrow().right, &mut out);
              let mut right: Vec<i32> = Vec::new();
              let mut cur = r.borrow().right.clone();
              while let Some(c) = cur {
                  if is_leaf(&c) {
                      break;
                  }
                  right.push(c.borrow().val);
                  let b = c.borrow();
                  cur = if b.right.is_some() { b.right.clone() } else { b.left.clone() };
              }
              right.reverse();
              out.extend(right);
              out
          }

          fn is_leaf(n: &Rc<RefCell<TreeNode>>) -> bool {
              let b = n.borrow();
              b.left.is_none() && b.right.is_none()
          }

          fn add_leaves(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut Vec<i32>) {
              if let Some(rc) = node {
                  if is_leaf(rc) {
                      out.push(rc.borrow().val);
                      return;
                  }
                  let b = rc.borrow();
                  add_leaves(&b.left, out);
                  add_leaves(&b.right, out);
              }
          }
        `,
        php: code`
          function boundaryTraversal($root) {
              if ($root === null) return [];
              $out = [$root->val];
              if ($root->left === null && $root->right === null) return $out;
              $cur = $root->left;
              while ($cur !== null && ($cur->left !== null || $cur->right !== null)) {
                  $out[] = $cur->val;
                  $cur = $cur->left !== null ? $cur->left : $cur->right;
              }
              $stack = [$root];
              while (count($stack) > 0) {
                  $node = array_pop($stack);
                  if ($node !== $root && $node->left === null && $node->right === null) $out[] = $node->val;
                  if ($node->right !== null) $stack[] = $node->right;
                  if ($node->left !== null) $stack[] = $node->left;
              }
              $right = [];
              $cur = $root->right;
              while ($cur !== null && ($cur->left !== null || $cur->right !== null)) {
                  $right[] = $cur->val;
                  $cur = $cur->right !== null ? $cur->right : $cur->left;
              }
              for ($i = count($right) - 1; $i >= 0; $i--) $out[] = $right[$i];
              return $out;
          }
        `,
        ruby: code`
          def boundaryTraversal(root)
            return [] if root.nil?
            leaf = ->(n) { n.left.nil? && n.right.nil? }
            out = [root.val]
            return out if leaf.call(root)
            cur = root.left
            while cur && !leaf.call(cur)
              out << cur.val
              cur = cur.left ? cur.left : cur.right
            end
            stack = [root]
            until stack.empty?
              node = stack.pop
              out << node.val if !node.equal?(root) && leaf.call(node)
              stack << node.right if node.right
              stack << node.left if node.left
            end
            right = []
            cur = root.right
            while cur && !leaf.call(cur)
              right << cur.val
              cur = cur.right ? cur.right : cur.left
            end
            out + right.reverse
          end
        `,
      },
    };
  })(),

  // ── Diagonal Traversal of Binary Tree (GFG) ────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const diags: number[][] = [];
      const walk = (n: TNode | null, d: number) => {
        if (!n) return;
        (diags[d] = diags[d] || []).push(n.val);
        walk(n.left, d + 1);
        walk(n.right, d);
      };
      walk(root, 0);
      return ([] as number[]).concat(...diags);
    };
    const EX = [
      { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], note: "Diagonal 0 runs 8 → 10 → 14. Diagonal 1 holds 3, 6, 7 and 13; diagonal 2 holds 1 and 4." },
      { root: [1, 2, 3, 4, 5, 6, 7], note: "Diagonal 0 is 1, 3, 7; diagonal 1 is 2, 5, 6; diagonal 2 is 4." },
      { root: [5, 4, null, 3, null, 2], note: "A left chain puts every node on its own diagonal." },
    ];
    return {
      slug: "diagonal-traversal-of-binary-tree",
      title: "Diagonal Traversal of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Queue", "Amazon"],
      signature: { funcName: "diagonal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **diagonal traversal**.\n\nDiagonals are lines of slope −1 through the tree: the root is on diagonal `0`, a node's **right** child is on the **same** diagonal as the node, and its **left** child is on the **next** diagonal (one more).\n\nList diagonal `0` first, then diagonal `1`, and so on. Within one diagonal, list the nodes in the order a **preorder** traversal (node, left subtree, right subtree) visits them.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Following right children never leaves a diagonal, so each diagonal is a set of right-going chains.",
        "Every chain on diagonal `d + 1` starts at the left child of some node on diagonal `d`.",
        "Use a queue: pop a node, walk its whole right chain outputting each value, and enqueue every left child met along the way. The queue hands out the chains diagonal by diagonal, in preorder order.",
      ],
      editorial: explain({
        idea: "A diagonal is made of right-going chains, and the chains of diagonal `d + 1` hang off left children of diagonal `d`. Processing chains first-in-first-out yields all of diagonal `d` before any of `d + 1`, and within a diagonal in preorder order.",
        steps: [
          "Put the root in a queue.",
          "Pop a node and walk from it along right children; output each value on the way and push each node's left child (if any) onto the queue.",
          "Repeat until the queue is empty.",
        ],
        why: "The queue first holds only the root (diagonal 0). Walking diagonal 0's chain enqueues only diagonal-1 nodes; by induction all chains of diagonal `d` are dequeued before any of diagonal `d + 1`, since those are enqueued later. Within a diagonal the chains come out in the order their starting points were met, which is the order preorder visits them, and a chain itself is listed top-down — also preorder order.",
        time: "O(n)",
        space: "O(n) for the queue in the worst case",
        pitfalls: [
          "A plain level-order traversal mixes diagonals; the right chain must be walked in full before moving on.",
          "Grouping by diagonal number with a map works too, but the nodes inside a group must stay in preorder order — append during a preorder walk, not a level-order one.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List, Optional

          def diagonal(root: Optional[TreeNode]) -> List[int]:
              out = []
              queue = deque([root]) if root else deque()
              while queue:
                  node = queue.popleft()
                  while node:
                      out.append(node.val)
                      if node.left:
                          queue.append(node.left)
                      node = node.right
              return out
        `,
        javascript: code`
          var diagonal = function(root) {
              var out = [];
              var queue = root === null ? [] : [root], head = 0;
              while (head < queue.length) {
                  var node = queue[head++];
                  while (node !== null) {
                      out.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      node = node.right;
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function diagonal(root: TreeNode | null): number[] {
              var out: number[] = [];
              var queue: TreeNode[] = root === null ? [] : [root];
              var head = 0;
              while (head < queue.length) {
                  var node: TreeNode | null = queue[head++];
                  while (node !== null) {
                      out.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      node = node.right;
                  }
              }
              return out;
          }
        `,
        java: code`
          public static int[] diagonal(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  TreeNode node = queue.poll();
                  while (node != null) {
                      out.add(node.val);
                      if (node.left != null) queue.add(node.left);
                      node = node.right;
                  }
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> diagonal(TreeNode* root) {
              vector<int> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  TreeNode* node = q.front();
                  q.pop();
                  while (node) {
                      out.push_back(node->val);
                      if (node->left) q.push(node->left);
                      node = node->right;
                  }
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int* diagonal(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, len = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  struct TreeNode* node = queue[head++];
                  while (node != NULL) {
                      out[len++] = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      node = node->right;
                  }
              }
              free(queue);
              *returnSize = len;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[] Diagonal(TreeNode root)
          {
              var output = new List<int>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              while (queue.Count > 0)
              {
                  var node = queue.Dequeue();
                  while (node != null)
                  {
                      output.Add(node.val);
                      if (node.left != null) queue.Enqueue(node.left);
                      node = node.right;
                  }
              }
              return output.ToArray();
          }
        `,
        go: code`
          func diagonal(root *TreeNode) []int {
              out := []int{}
              queue := []*TreeNode{}
              if root != nil {
                  queue = append(queue, root)
              }
              for head := 0; head < len(queue); head++ {
                  for node := queue[head]; node != nil; node = node.Right {
                      out = append(out, node.Val)
                      if node.Left != nil {
                          queue = append(queue, node.Left)
                      }
                  }
              }
              return out
          }
        `,
        kotlin: kt(`
          fun diagonal(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              val queue = java.util.ArrayDeque<TreeNode>()
              if (root != null) queue.add(root)
              while (queue.isNotEmpty()) {
                  var node: TreeNode? = queue.poll()
                  while (node != null) {
                      out.add(node.\`val\`)
                      val l = node.left
                      if (l != null) queue.add(l)
                      node = node.right
                  }
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func diagonal(_ root: TreeNode?) -> [Int] {
              var out: [Int] = []
              var queue: [TreeNode] = []
              if let r = root { queue.append(r) }
              var head = 0
              while head < queue.count {
                  var node: TreeNode? = queue[head]
                  head += 1
                  while let n = node {
                      out.append(n.val)
                      if let l = n.left { queue.append(l) }
                      node = n.right
                  }
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn diagonal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              let mut queue: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  queue.push(r);
              }
              let mut head = 0;
              while head < queue.len() {
                  let mut cur = Some(queue[head].clone());
                  head += 1;
                  while let Some(n) = cur {
                      let b = n.borrow();
                      out.push(b.val);
                      if let Some(l) = &b.left {
                          queue.push(l.clone());
                      }
                      let next = b.right.clone();
                      drop(b);
                      cur = next;
                  }
              }
              out
          }
        `,
        php: code`
          function diagonal($root) {
              $out = [];
              $queue = $root === null ? [] : [$root];
              for ($head = 0; $head < count($queue); $head++) {
                  $node = $queue[$head];
                  while ($node !== null) {
                      $out[] = $node->val;
                      if ($node->left !== null) $queue[] = $node->left;
                      $node = $node->right;
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def diagonal(root)
            out = []
            queue = root.nil? ? [] : [root]
            head = 0
            while head < queue.size
              node = queue[head]
              head += 1
              while node
                out << node.val
                queue << node.left if node.left
                node = node.right
              end
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Vertical Sum of Binary Tree (GFG) ──────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const sum = new Map<number, number>();
      for (const [n, d] of hdLevelOrder(root)) sum.set(d, (sum.get(d) || 0) + n.val);
      return [...sum.keys()].sort((a, b) => a - b).map((d) => sum.get(d)!);
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6, 7], note: "Columns −2..2 hold {4}, {2}, {1, 5, 6}, {3}, {7}: sums 4, 2, 12, 3, 7." },
      { root: [1, 2, 3, 4, 5, null, 6], note: "Column 0 holds 1 and 5; column 1 holds 3; column 2 holds 6." },
      { root: [9], note: "One node, one column." },
    ];
    return {
      slug: "vertical-sum-of-binary-tree",
      title: "Vertical Sum of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Hash Table", "Depth-First Search", "Amazon"],
      signature: { funcName: "verticalSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the sum of the node values in each **vertical line**, from the leftmost line to the rightmost.\n\nThe root is on line `0`; a node's left child is on the line one to the left (`-1`) and its right child on the line one to the right (`+1`).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 10^5"]),
      hints: [
        "Give each node its horizontal distance from the root: root 0, left child − 1, right child + 1.",
        "Any traversal works — accumulate each node's value into the total for its distance.",
        "Distances from the smallest to the largest are contiguous, so after the traversal output the totals in that range.",
      ],
      editorial: explain({
        idea: "Carry the horizontal distance through any traversal and add each value into a per-line total; the lines that occur form a contiguous range, which is output from left to right.",
        steps: [
          "Traverse the tree (DFS or BFS) carrying the line number: left child `d - 1`, right child `d + 1`.",
          "Add the node's value to `total[d]` and update the smallest and largest `d` seen.",
          "Return `total[min], …, total[max]`.",
        ],
        why: "Every node is visited once and added to exactly the line it lies on, so each total is its line's sum. The path from the root to the leftmost or rightmost node steps one line at a time, so every line between the extremes is occupied and the output has no gaps.",
        time: "O(n) with an offset array (O(n log n) with a sorted map)",
        space: "O(n)",
        pitfalls: [
          "Line numbers go negative — shift them by the node count before using them as array indices.",
          "The output runs left to right, not in the order lines were first discovered.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def verticalSum(root: Optional[TreeNode]) -> List[int]:
              total = {}
              stack = [(root, 0)] if root else []
              while stack:
                  node, d = stack.pop()
                  total[d] = total.get(d, 0) + node.val
                  if node.left:
                      stack.append((node.left, d - 1))
                  if node.right:
                      stack.append((node.right, d + 1))
              if not total:
                  return []
              return [total[d] for d in range(min(total), max(total) + 1)]
        `,
        javascript: code`
          var verticalSum = function(root) {
              if (root === null) return [];
              var total = {}, lo = 0, hi = 0;
              var nodes = [root], ds = [0];
              while (nodes.length > 0) {
                  var node = nodes.pop(), d = ds.pop();
                  total[d] = (total[d] || 0) + node.val;
                  if (d < lo) lo = d;
                  if (d > hi) hi = d;
                  if (node.left !== null) { nodes.push(node.left); ds.push(d - 1); }
                  if (node.right !== null) { nodes.push(node.right); ds.push(d + 1); }
              }
              var out = [];
              for (var c = lo; c <= hi; c++) out.push(total[c]);
              return out;
          };
        `,
        typescript: code`
          function verticalSum(root: TreeNode | null): number[] {
              if (root === null) return [];
              var total: { [d: number]: number } = {};
              var lo = 0, hi = 0;
              var nodes: TreeNode[] = [root], ds: number[] = [0];
              while (nodes.length > 0) {
                  var node = nodes.pop() as TreeNode, d = ds.pop() as number;
                  total[d] = (total[d] || 0) + node.val;
                  if (d < lo) lo = d;
                  if (d > hi) hi = d;
                  if (node.left !== null) { nodes.push(node.left); ds.push(d - 1); }
                  if (node.right !== null) { nodes.push(node.right); ds.push(d + 1); }
              }
              var out: number[] = [];
              for (var c = lo; c <= hi; c++) out.push(total[c]);
              return out;
          }
        `,
        java: code`
          public static int[] verticalSum(TreeNode root) {
              if (root == null) return new int[0];
              TreeMap<Integer, Integer> total = new TreeMap<>();
              addColumns(root, 0, total);
              int[] out = new int[total.size()];
              int i = 0;
              for (int v : total.values()) out[i++] = v;
              return out;
          }

          static void addColumns(TreeNode node, int d, TreeMap<Integer, Integer> total) {
              if (node == null) return;
              total.merge(d, node.val, Integer::sum);
              addColumns(node.left, d - 1, total);
              addColumns(node.right, d + 1, total);
          }
        `,
        cpp: code`
          static void addColumns(TreeNode* node, int d, map<int, int>& total);

          vector<int> verticalSum(TreeNode* root) {
              map<int, int> total;
              addColumns(root, 0, total);
              vector<int> out;
              for (auto& kv : total) out.push_back(kv.second);
              return out;
          }

          static void addColumns(TreeNode* node, int d, map<int, int>& total) {
              if (!node) return;
              total[d] += node->val;
              addColumns(node->left, d - 1, total);
              addColumns(node->right, d + 1, total);
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void addColumns(struct TreeNode* node, int d, int* total, int* lo, int* hi);

          int* verticalSum(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* total = (int*) calloc((size_t) (2 * n + 1), sizeof(int));
              int lo = n, hi = n;
              if (root != NULL) addColumns(root, n, total, &lo, &hi);
              int len = root == NULL ? 0 : hi - lo + 1;
              int* out = (int*) malloc((size_t) (len + 1) * sizeof(int));
              for (int i = 0; i < len; i++) out[i] = total[lo + i];
              free(total);
              *returnSize = len;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void addColumns(struct TreeNode* node, int d, int* total, int* lo, int* hi) {
              if (node == NULL) return;
              total[d] += node->val;
              if (d < *lo) *lo = d;
              if (d > *hi) *hi = d;
              addColumns(node->left, d - 1, total, lo, hi);
              addColumns(node->right, d + 1, total, lo, hi);
          }
        `,
        csharp: code`
          public static int[] VerticalSum(TreeNode root)
          {
              var total = new SortedDictionary<int, int>();
              AddColumns(root, 0, total);
              return total.Values.ToArray();
          }

          static void AddColumns(TreeNode node, int d, SortedDictionary<int, int> total)
          {
              if (node == null) return;
              int cur;
              total.TryGetValue(d, out cur);
              total[d] = cur + node.val;
              AddColumns(node.left, d - 1, total);
              AddColumns(node.right, d + 1, total);
          }
        `,
        go: code`
          func verticalSum(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              total := map[int]int{}
              lo, hi := 0, 0
              var walk func(node *TreeNode, d int)
              walk = func(node *TreeNode, d int) {
                  if node == nil {
                      return
                  }
                  total[d] += node.Val
                  if d < lo {
                      lo = d
                  }
                  if d > hi {
                      hi = d
                  }
                  walk(node.Left, d-1)
                  walk(node.Right, d+1)
              }
              walk(root, 0)
              for d := lo; d <= hi; d++ {
                  out = append(out, total[d])
              }
              return out
          }
        `,
        kotlin: kt(`
          fun verticalSum(root: TreeNode?): IntArray {
              val total = java.util.TreeMap<Int, Int>()
              addColumns(root, 0, total)
              return total.values.toIntArray()
          }

          fun addColumns(node: TreeNode?, d: Int, total: java.util.TreeMap<Int, Int>) {
              if (node == null) return
              total[d] = (total[d] ?: 0) + node.\`val\`
              addColumns(node.left, d - 1, total)
              addColumns(node.right, d + 1, total)
          }
        `),
        swift: code`
          func verticalSum(_ root: TreeNode?) -> [Int] {
              var total: [Int: Int] = [:]
              func walk(_ node: TreeNode?, _ d: Int) {
                  guard let n = node else { return }
                  total[d, default: 0] += n.val
                  walk(n.left, d - 1)
                  walk(n.right, d + 1)
              }
              walk(root, 0)
              return total.keys.sorted().map { total[$0]! }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::BTreeMap;

          fn verticalSum(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut total: BTreeMap<i32, i32> = BTreeMap::new();
              add_columns(&root, 0, &mut total);
              total.values().cloned().collect()
          }

          fn add_columns(node: &Option<Rc<RefCell<TreeNode>>>, d: i32, total: &mut BTreeMap<i32, i32>) {
              if let Some(rc) = node {
                  let b = rc.borrow();
                  *total.entry(d).or_insert(0) += b.val;
                  add_columns(&b.left, d - 1, total);
                  add_columns(&b.right, d + 1, total);
              }
          }
        `,
        php: code`
          function verticalSum($root) {
              $total = [];
              $stack = $root === null ? [] : [[$root, 0]];
              while (count($stack) > 0) {
                  $top = array_pop($stack);
                  $node = $top[0];
                  $d = $top[1];
                  $total[$d] = (isset($total[$d]) ? $total[$d] : 0) + $node->val;
                  if ($node->left !== null) $stack[] = [$node->left, $d - 1];
                  if ($node->right !== null) $stack[] = [$node->right, $d + 1];
              }
              ksort($total);
              return array_values($total);
          }
        `,
        ruby: code`
          def verticalSum(root)
            total = Hash.new(0)
            stack = root.nil? ? [] : [[root, 0]]
            until stack.empty?
              node, d = stack.pop
              total[d] += node.val
              stack << [node.left, d - 1] if node.left
              stack << [node.right, d + 1] if node.right
            end
            total.keys.sort.map { |d| total[d] }
          end
        `,
      },
    };
  })(),

  // ── Sum Tree (GFG) ──────────────────────────────────────────────────
  (() => {
    const total = (n: TNode | null): number => (n ? n.val + total(n.left) + total(n.right) : 0);
    const ref = (root: TNode | null): boolean => {
      for (const n of nodesOf(root)) if (!isLeaf(n) && n.val !== total(n.left) + total(n.right)) return false;
      return true;
    };
    /** Makes every internal node the sum of its subtrees, leaves keeping their values. */
    const makeSum = (n: TNode | null): number => {
      if (!n) return 0;
      if (isLeaf(n)) return n.val;
      n.val = makeSum(n.left) + makeSum(n.right);
      return 2 * n.val;
    };
    const EX = [
      { root: [26, 10, 3, 4, 6, null, 3], note: "10 = 4 + 6, 3 = 3, and 26 = (10 + 4 + 6) + (3 + 3)." },
      { root: [3, 1, 2], note: "3 = 1 + 2, and leaves need nothing." },
      { root: [10, 20, 30, 10, 10], note: "20 = 10 + 10, but the root's subtrees add up to 40 + 30 = 70, not 10." },
    ];
    return {
      slug: "check-if-tree-is-a-sum-tree",
      title: "Sum Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon"],
      signature: { funcName: "isSumTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, decide whether it is a **sum tree**: for every node that is not a leaf, the node's value equals the sum of **all** the values in its left subtree plus the sum of **all** the values in its right subtree.\n\nAn empty subtree sums to `0`, and a leaf is a sum tree on its own. Return `true` if the whole tree is a sum tree, otherwise `false`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 10^5"]),
      hints: [
        "Checking each node against freshly computed subtree sums repeats work — O(n²) on a chain.",
        "Have one post-order function return the sum of a subtree, so a parent gets both children's sums in O(1).",
        "In a valid sum tree, a non-leaf subtree's total is exactly twice its root's value. Return a sentinel like `-1` as soon as any node fails, and propagate it.",
      ],
      editorial: explain({
        idea: "A post-order traversal computes subtree sums bottom-up and checks each internal node against its children's sums in the same pass, returning a sentinel once anything fails.",
        steps: [
          "Define `check(node)`: for an empty tree return 0; for a leaf return its value.",
          "Otherwise compute `l = check(left)` and `r = check(right)`; if either is `-1` or `node.val != l + r`, return `-1`.",
          "Else return `node.val + l + r` (which equals `2 · node.val`).",
          "The tree is a sum tree when `check(root)` is not `-1`.",
        ],
        why: "By induction `check` returns the true sum of any subtree that is itself a sum tree, and `-1` otherwise (all values are positive, so `-1` is never a real sum). A node is then valid exactly when its value equals the two returned sums, which is the definition.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Comparing a node with its children's values only is wrong — the definition uses whole-subtree sums.",
          "Leaves are always fine, and a node with one child compares against that child's subtree sum plus 0.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        for (;;) {
          const n = sizeOf(rng, [1, 3, 8, 15, 25]);
          const root = shapeTree(rng, n, 1, pick(rng, [5, 50, 500]));
          if (rng() < 0.75) makeSum(root);
          if (nodesOf(root).some((x) => x.val > 100000)) continue;
          if (rng() < 0.35) {
            const nodes = nodesOf(root);
            const t = pick(rng, nodes);
            t.val = Math.max(1, t.val + pick(rng, [-2, -1, 1, 2]));
          }
          return { input: fmtTree(root), expectedOutput: String(ref(root)) };
        }
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSumTree(root: Optional[TreeNode]) -> bool:
              return _check(root) != -1

          def _check(node):
              if node is None:
                  return 0
              if node.left is None and node.right is None:
                  return node.val
              l = _check(node.left)
              if l == -1:
                  return -1
              r = _check(node.right)
              if r == -1 or node.val != l + r:
                  return -1
              return node.val + l + r
        `,
        javascript: code`
          var isSumTree = function(root) {
              return sumCheck(root) !== -1;
          };

          function sumCheck(node) {
              if (node === null) return 0;
              if (node.left === null && node.right === null) return node.val;
              var l = sumCheck(node.left);
              if (l === -1) return -1;
              var r = sumCheck(node.right);
              if (r === -1 || node.val !== l + r) return -1;
              return node.val + l + r;
          }
        `,
        typescript: code`
          function isSumTree(root: TreeNode | null): boolean {
              return sumCheck(root) !== -1;
          }

          function sumCheck(node: TreeNode | null): number {
              if (node === null) return 0;
              if (node.left === null && node.right === null) return node.val;
              var l = sumCheck(node.left);
              if (l === -1) return -1;
              var r = sumCheck(node.right);
              if (r === -1 || node.val !== l + r) return -1;
              return node.val + l + r;
          }
        `,
        java: code`
          public static boolean isSumTree(TreeNode root) {
              return sumCheck(root) != -1;
          }

          static int sumCheck(TreeNode node) {
              if (node == null) return 0;
              if (node.left == null && node.right == null) return node.val;
              int l = sumCheck(node.left);
              if (l == -1) return -1;
              int r = sumCheck(node.right);
              if (r == -1 || node.val != l + r) return -1;
              return node.val + l + r;
          }
        `,
        cpp: code`
          static long long sumCheck(TreeNode* node);

          bool isSumTree(TreeNode* root) {
              return sumCheck(root) != -1;
          }

          static long long sumCheck(TreeNode* node) {
              if (!node) return 0;
              if (!node->left && !node->right) return node->val;
              long long l = sumCheck(node->left);
              if (l == -1) return -1;
              long long r = sumCheck(node->right);
              if (r == -1 || node->val != l + r) return -1;
              return node->val + l + r;
          }
        `,
        c: code`
          static long long sumCheck(struct TreeNode* node);

          bool isSumTree(struct TreeNode* root) {
              return sumCheck(root) != -1;
          }

          static long long sumCheck(struct TreeNode* node) {
              if (node == NULL) return 0;
              if (node->left == NULL && node->right == NULL) return node->val;
              long long l = sumCheck(node->left);
              if (l == -1) return -1;
              long long r = sumCheck(node->right);
              if (r == -1 || node->val != l + r) return -1;
              return node->val + l + r;
          }
        `,
        csharp: code`
          public static bool IsSumTree(TreeNode root)
          {
              return SumCheck(root) != -1;
          }

          static long SumCheck(TreeNode node)
          {
              if (node == null) return 0;
              if (node.left == null && node.right == null) return node.val;
              long l = SumCheck(node.left);
              if (l == -1) return -1;
              long r = SumCheck(node.right);
              if (r == -1 || node.val != l + r) return -1;
              return node.val + l + r;
          }
        `,
        go: code`
          func isSumTree(root *TreeNode) bool {
              return sumCheck(root) != -1
          }

          func sumCheck(node *TreeNode) int {
              if node == nil {
                  return 0
              }
              if node.Left == nil && node.Right == nil {
                  return node.Val
              }
              l := sumCheck(node.Left)
              if l == -1 {
                  return -1
              }
              r := sumCheck(node.Right)
              if r == -1 || node.Val != l+r {
                  return -1
              }
              return node.Val + l + r
          }
        `,
        kotlin: kt(`
          fun isSumTree(root: TreeNode?): Boolean {
              return sumCheck(root) != -1L
          }

          fun sumCheck(node: TreeNode?): Long {
              if (node == null) return 0L
              val v = node.\`val\`.toLong()
              if (node.left == null && node.right == null) return v
              val l = sumCheck(node.left)
              if (l == -1L) return -1L
              val r = sumCheck(node.right)
              if (r == -1L || v != l + r) return -1L
              return v + l + r
          }
        `),
        swift: code`
          func isSumTree(_ root: TreeNode?) -> Bool {
              return sumCheck(root) != -1
          }

          func sumCheck(_ node: TreeNode?) -> Int {
              guard let n = node else { return 0 }
              if n.left == nil && n.right == nil { return n.val }
              let l = sumCheck(n.left)
              if l == -1 { return -1 }
              let r = sumCheck(n.right)
              if r == -1 || n.val != l + r { return -1 }
              return n.val + l + r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSumTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              sum_check(&root) != -1
          }

          fn sum_check(node: &Option<Rc<RefCell<TreeNode>>>) -> i64 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let b = rc.borrow();
                      let v = b.val as i64;
                      if b.left.is_none() && b.right.is_none() {
                          return v;
                      }
                      let l = sum_check(&b.left);
                      if l == -1 {
                          return -1;
                      }
                      let r = sum_check(&b.right);
                      if r == -1 || v != l + r {
                          return -1;
                      }
                      v + l + r
                  }
              }
          }
        `,
        php: code`
          function isSumTree($root) {
              return sumCheck($root) !== -1;
          }

          function sumCheck($node) {
              if ($node === null) return 0;
              if ($node->left === null && $node->right === null) return $node->val;
              $l = sumCheck($node->left);
              if ($l === -1) return -1;
              $r = sumCheck($node->right);
              if ($r === -1 || $node->val !== $l + $r) return -1;
              return $node->val + $l + $r;
          }
        `,
        ruby: code`
          def isSumTree(root)
            sum_check(root) != -1
          end

          def sum_check(node)
            return 0 if node.nil?
            return node.val if node.left.nil? && node.right.nil?
            l = sum_check(node.left)
            return -1 if l == -1
            r = sum_check(node.right)
            return -1 if r == -1 || node.val != l + r
            node.val + l + r
          end
        `,
      },
    };
  })(),

  // ── Minimum Distance Between Two Given Nodes of a Binary Tree (GFG) ──
  (() => {
    const pathTo = (root: TNode | null, t: number): number[] => {
      const out: number[] = [];
      const walk = (n: TNode | null): boolean => {
        if (!n) return false;
        out.push(n.val);
        if (n.val === t || walk(n.left) || walk(n.right)) return true;
        out.pop();
        return false;
      };
      walk(root);
      return out;
    };
    const ref = (root: TNode | null, a: number, b: number) => {
      const pa = pathTo(root, a), pb = pathTo(root, b);
      let i = 0;
      while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
      return pa.length + pb.length - 2 * i;
    };
    const EX = [
      { root: [1, 2, 3], a: 2, b: 3, note: "2 → 1 → 3 is two edges." },
      { root: [11, 22, 33, 44, 55, 66, 77], a: 77, b: 22, note: "77 → 33 → 11 → 22: three edges." },
      { root: [1, 2, null, 3, null, 4], a: 2, b: 4, note: "4 hangs two levels below 2 on the same branch." },
    ];
    return {
      slug: "minimum-distance-between-two-nodes",
      title: "Minimum Distance Between Two Given Nodes of a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Microsoft"],
      signature: { funcName: "findDist", params: [{ name: "root", type: "TreeNode" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are all **distinct**, and two values `a` and `b` that both occur in the tree.\n\nReturn the **distance** between the node holding `a` and the node holding `b`: the number of edges on the path between them. If `a == b` the distance is `0`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, a = ${e.a}, b = ${e.b}`, out: String(ref(treeFrom(e.root), e.a, e.b)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "a and b are values of nodes in the tree"]),
      hints: [
        "The path between two nodes of a tree goes up from one of them to their lowest common ancestor and then down to the other.",
        "Record the root-to-node path for `a` and for `b`. The two paths agree up to the lowest common ancestor and then split.",
        "If the paths share their first `k` nodes, the distance is `len(pathA) + len(pathB) - 2k`.",
      ],
      editorial: explain({
        idea: "Both root-to-node paths begin with the same nodes down to the lowest common ancestor (LCA). Everything after the shared prefix lies on the path between `a` and `b`.",
        steps: [
          "Find the path of values from the root to `a` with a DFS that pushes a node, recurses, and pops it again if the target was not found below it; do the same for `b`.",
          "Count `k`, the length of the common prefix of the two paths.",
          "Return `len(pathA) + len(pathB) - 2k`.",
        ],
        why: "The last common node of the two paths is the LCA. The path from `a` to `b` climbs `len(pathA) - k` edges from `a` up to the LCA and descends `len(pathB) - k` edges to `b`, and in a tree that path is the only one, so its length is the distance.",
        time: "O(n)",
        space: "O(h) for the paths and the recursion",
        pitfalls: [
          "When one node is an ancestor of the other, the shared prefix is the whole shorter path — the formula still holds.",
          "With `a == b` both paths are identical and the answer is 0.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.a}\n${e.b}`, expectedOutput: String(ref(treeFrom(e.root), e.a, e.b)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = distinctVals(rng, shapeTree(rng, n, 1, 1), 1, pick(rng, [n, 100, 100000]));
        const vals = nodesOf(root).map((x) => x.val);
        const a = pick(rng, vals);
        let b = pick(rng, vals);
        for (let t = 0; t < 3 && b === a && vals.length > 1; t++) b = pick(rng, vals);
        if (rng() < 0.04) b = a;
        return { input: `${fmtTree(root)}\n${a}\n${b}`, expectedOutput: String(ref(root, a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findDist(root: Optional[TreeNode], a: int, b: int) -> int:
              pa, pb = [], []
              _path(root, a, pa)
              _path(root, b, pb)
              k = 0
              while k < len(pa) and k < len(pb) and pa[k] == pb[k]:
                  k += 1
              return len(pa) + len(pb) - 2 * k

          def _path(node, t, out):
              if node is None:
                  return False
              out.append(node.val)
              if node.val == t or _path(node.left, t, out) or _path(node.right, t, out):
                  return True
              out.pop()
              return False
        `,
        javascript: code`
          var findDist = function(root, a, b) {
              var pa = [], pb = [];
              pathTo(root, a, pa);
              pathTo(root, b, pb);
              var k = 0;
              while (k < pa.length && k < pb.length && pa[k] === pb[k]) k++;
              return pa.length + pb.length - 2 * k;
          };

          function pathTo(node, t, out) {
              if (node === null) return false;
              out.push(node.val);
              if (node.val === t || pathTo(node.left, t, out) || pathTo(node.right, t, out)) return true;
              out.pop();
              return false;
          }
        `,
        typescript: code`
          function findDist(root: TreeNode | null, a: number, b: number): number {
              var pa: number[] = [], pb: number[] = [];
              pathTo(root, a, pa);
              pathTo(root, b, pb);
              var k = 0;
              while (k < pa.length && k < pb.length && pa[k] === pb[k]) k++;
              return pa.length + pb.length - 2 * k;
          }

          function pathTo(node: TreeNode | null, t: number, out: number[]): boolean {
              if (node === null) return false;
              out.push(node.val);
              if (node.val === t || pathTo(node.left, t, out) || pathTo(node.right, t, out)) return true;
              out.pop();
              return false;
          }
        `,
        java: code`
          public static int findDist(TreeNode root, int a, int b) {
              List<Integer> pa = new ArrayList<>(), pb = new ArrayList<>();
              pathTo(root, a, pa);
              pathTo(root, b, pb);
              int k = 0;
              while (k < pa.size() && k < pb.size() && pa.get(k).intValue() == pb.get(k).intValue()) k++;
              return pa.size() + pb.size() - 2 * k;
          }

          static boolean pathTo(TreeNode node, int t, List<Integer> out) {
              if (node == null) return false;
              out.add(node.val);
              if (node.val == t || pathTo(node.left, t, out) || pathTo(node.right, t, out)) return true;
              out.remove(out.size() - 1);
              return false;
          }
        `,
        cpp: code`
          static bool pathTo(TreeNode* node, int t, vector<int>& out);

          int findDist(TreeNode* root, int a, int b) {
              vector<int> pa, pb;
              pathTo(root, a, pa);
              pathTo(root, b, pb);
              size_t k = 0;
              while (k < pa.size() && k < pb.size() && pa[k] == pb[k]) k++;
              return (int) (pa.size() + pb.size() - 2 * k);
          }

          static bool pathTo(TreeNode* node, int t, vector<int>& out) {
              if (!node) return false;
              out.push_back(node->val);
              if (node->val == t || pathTo(node->left, t, out) || pathTo(node->right, t, out)) return true;
              out.pop_back();
              return false;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static bool pathTo(struct TreeNode* node, int t, int* out, int* len);

          int findDist(struct TreeNode* root, int a, int b) {
              int n = countNodes(root);
              int* pa = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* pb = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int la = 0, lb = 0, k = 0;
              pathTo(root, a, pa, &la);
              pathTo(root, b, pb, &lb);
              while (k < la && k < lb && pa[k] == pb[k]) k++;
              free(pa);
              free(pb);
              return la + lb - 2 * k;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static bool pathTo(struct TreeNode* node, int t, int* out, int* len) {
              if (node == NULL) return false;
              out[(*len)++] = node->val;
              if (node->val == t || pathTo(node->left, t, out, len) || pathTo(node->right, t, out, len)) return true;
              (*len)--;
              return false;
          }
        `,
        csharp: code`
          public static int FindDist(TreeNode root, int a, int b)
          {
              var pa = new List<int>();
              var pb = new List<int>();
              PathTo(root, a, pa);
              PathTo(root, b, pb);
              int k = 0;
              while (k < pa.Count && k < pb.Count && pa[k] == pb[k]) k++;
              return pa.Count + pb.Count - 2 * k;
          }

          static bool PathTo(TreeNode node, int t, List<int> output)
          {
              if (node == null) return false;
              output.Add(node.val);
              if (node.val == t || PathTo(node.left, t, output) || PathTo(node.right, t, output)) return true;
              output.RemoveAt(output.Count - 1);
              return false;
          }
        `,
        go: code`
          func findDist(root *TreeNode, a int, b int) int {
              pa := pathTo(root, a, []int{})
              pb := pathTo(root, b, []int{})
              k := 0
              for k < len(pa) && k < len(pb) && pa[k] == pb[k] {
                  k++
              }
              return len(pa) + len(pb) - 2*k
          }

          func pathTo(node *TreeNode, t int, prefix []int) []int {
              if node == nil {
                  return nil
              }
              cur := append(append([]int{}, prefix...), node.Val)
              if node.Val == t {
                  return cur
              }
              if p := pathTo(node.Left, t, cur); p != nil {
                  return p
              }
              return pathTo(node.Right, t, cur)
          }
        `,
        kotlin: kt(`
          fun findDist(root: TreeNode?, a: Int, b: Int): Int {
              val pa = ArrayList<Int>()
              val pb = ArrayList<Int>()
              pathTo(root, a, pa)
              pathTo(root, b, pb)
              var k = 0
              while (k < pa.size && k < pb.size && pa[k] == pb[k]) k++
              return pa.size + pb.size - 2 * k
          }

          fun pathTo(node: TreeNode?, t: Int, out: ArrayList<Int>): Boolean {
              if (node == null) return false
              out.add(node.\`val\`)
              if (node.\`val\` == t || pathTo(node.left, t, out) || pathTo(node.right, t, out)) return true
              out.removeAt(out.size - 1)
              return false
          }
        `),
        swift: code`
          func findDist(_ root: TreeNode?, _ a: Int, _ b: Int) -> Int {
              var pa: [Int] = []
              var pb: [Int] = []
              _ = pathTo(root, a, &pa)
              _ = pathTo(root, b, &pb)
              var k = 0
              while k < pa.count && k < pb.count && pa[k] == pb[k] { k += 1 }
              return pa.count + pb.count - 2 * k
          }

          func pathTo(_ node: TreeNode?, _ t: Int, _ out: inout [Int]) -> Bool {
              guard let n = node else { return false }
              out.append(n.val)
              if n.val == t || pathTo(n.left, t, &out) || pathTo(n.right, t, &out) { return true }
              out.removeLast()
              return false
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findDist(root: Option<Rc<RefCell<TreeNode>>>, a: i32, b: i32) -> i32 {
              let mut pa: Vec<i32> = Vec::new();
              let mut pb: Vec<i32> = Vec::new();
              path_to(&root, a, &mut pa);
              path_to(&root, b, &mut pb);
              let mut k = 0;
              while k < pa.len() && k < pb.len() && pa[k] == pb[k] {
                  k += 1;
              }
              (pa.len() + pb.len() - 2 * k) as i32
          }

          fn path_to(node: &Option<Rc<RefCell<TreeNode>>>, t: i32, out: &mut Vec<i32>) -> bool {
              match node {
                  None => false,
                  Some(rc) => {
                      let b = rc.borrow();
                      out.push(b.val);
                      if b.val == t || path_to(&b.left, t, out) || path_to(&b.right, t, out) {
                          return true;
                      }
                      out.pop();
                      false
                  }
              }
          }
        `,
        php: code`
          function findDist($root, $a, $b) {
              $pa = [];
              $pb = [];
              pathTo($root, $a, $pa);
              pathTo($root, $b, $pb);
              $k = 0;
              while ($k < count($pa) && $k < count($pb) && $pa[$k] === $pb[$k]) $k++;
              return count($pa) + count($pb) - 2 * $k;
          }

          function pathTo($node, $t, &$out) {
              if ($node === null) return false;
              $out[] = $node->val;
              if ($node->val === $t || pathTo($node->left, $t, $out) || pathTo($node->right, $t, $out)) return true;
              array_pop($out);
              return false;
          }
        `,
        ruby: code`
          def findDist(root, a, b)
            pa = []
            pb = []
            path_to(root, a, pa)
            path_to(root, b, pb)
            k = 0
            k += 1 while k < pa.size && k < pb.size && pa[k] == pb[k]
            pa.size + pb.size - 2 * k
          end

          def path_to(node, t, out)
            return false if node.nil?
            out << node.val
            return true if node.val == t || path_to(node.left, t, out) || path_to(node.right, t, out)
            out.pop
            false
          end
        `,
      },
    };
  })(),

  // ── Floor in BST (GFG) ─────────────────────────────────────────────
  (() => {
    const ref = (root: TNode | null, x: number) => {
      let best = -1;
      for (const v of inorderOf(root)) if (v <= x) best = v;
      return best;
    };
    const EX = [
      { root: [2, 1, 81, null, null, 42, 87, null, 66, null, null, 45], x: 87, note: "87 is in the tree, so it is its own floor." },
      { root: [6, null, 8, 7, 9], x: 11, note: "Every value is at most 11; the largest is 9." },
      { root: [10, 5, 15, 2, 7], x: 1, note: "Nothing in the tree is 1 or smaller." },
    ];
    return {
      slug: "floor-in-bst",
      title: "Floor in BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Amazon", "Samsung"],
      signature: { funcName: "floor", params: [{ name: "root", type: "TreeNode" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** with distinct values and an integer `x`.\n\nReturn the **floor** of `x` in the tree: the largest node value that is **less than or equal to** `x`. If every value in the tree is greater than `x`, return `-1`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, x = ${e.x}`, out: String(ref(treeFrom(e.root), e.x)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "1 <= x <= 10^5"],
        "Can you do it in O(height) time without visiting the whole tree?"),
      hints: [
        "Compare `x` with the current node: the answer can only lie on one side of it.",
        "If the node's value is greater than `x`, it cannot be the floor, and neither can anything in its right subtree — go left.",
        "If the node's value is at most `x`, it is a candidate; a better (larger) candidate can only be in its right subtree. Remember it and go right.",
      ],
      editorial: explain({
        idea: "Walk down from the root like a search for `x`, remembering the last value that was not larger than `x`. That remembered value is the floor.",
        steps: [
          "Set `best = -1` and start at the root.",
          "If the node's value equals `x`, return `x`.",
          "If it is smaller than `x`, set `best` to it and move to the right child.",
          "If it is larger, move to the left child.",
          "When the walk falls off the tree, return `best`.",
        ],
        why: "Going left from a value larger than `x` discards only values larger than `x`. Going right from a candidate discards only values smaller than that candidate, which cannot beat it. So the floor is never discarded, and each candidate recorded is larger than the previous one; the last is the floor.",
        time: "O(h), h the height of the tree",
        space: "O(1)",
        pitfalls: [
          "Stopping at the first value below `x` is wrong — a larger one may still sit in its right subtree.",
          "Return `-1` only when no candidate was ever recorded.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.x}`, expectedOutput: String(ref(treeFrom(e.root), e.x)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const hi = pick(rng, [n + 3, 100, 100000]);
        const root = bstOf(rng, n, 1, hi);
        const x = rng() < 0.3 ? pick(rng, inorderOf(root)) : ri(rng, 1, Math.min(100000, hi + 2));
        return { input: `${fmtTree(root)}\n${x}`, expectedOutput: String(ref(root, x)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def floor(root: Optional[TreeNode], x: int) -> int:
              best = -1
              node = root
              while node:
                  if node.val == x:
                      return x
                  if node.val < x:
                      best = node.val
                      node = node.right
                  else:
                      node = node.left
              return best
        `,
        javascript: code`
          var floor = function(root, x) {
              var best = -1, node = root;
              while (node !== null) {
                  if (node.val === x) return x;
                  if (node.val < x) { best = node.val; node = node.right; }
                  else node = node.left;
              }
              return best;
          };
        `,
        typescript: code`
          function floor(root: TreeNode | null, x: number): number {
              var best = -1;
              var node: TreeNode | null = root;
              while (node !== null) {
                  if (node.val === x) return x;
                  if (node.val < x) { best = node.val; node = node.right; }
                  else node = node.left;
              }
              return best;
          }
        `,
        java: code`
          public static int floor(TreeNode root, int x) {
              int best = -1;
              TreeNode node = root;
              while (node != null) {
                  if (node.val == x) return x;
                  if (node.val < x) { best = node.val; node = node.right; }
                  else node = node.left;
              }
              return best;
          }
        `,
        cpp: code`
          int floor(TreeNode* root, int x) {
              int best = -1;
              TreeNode* node = root;
              while (node) {
                  if (node->val == x) return x;
                  if (node->val < x) { best = node->val; node = node->right; }
                  else node = node->left;
              }
              return best;
          }
        `,
        c: code`
          int floor(struct TreeNode* root, int x) {
              int best = -1;
              struct TreeNode* node = root;
              while (node != NULL) {
                  if (node->val == x) return x;
                  if (node->val < x) { best = node->val; node = node->right; }
                  else node = node->left;
              }
              return best;
          }
        `,
        csharp: code`
          public static int Floor(TreeNode root, int x)
          {
              int best = -1;
              TreeNode node = root;
              while (node != null)
              {
                  if (node.val == x) return x;
                  if (node.val < x) { best = node.val; node = node.right; }
                  else node = node.left;
              }
              return best;
          }
        `,
        go: code`
          func floor(root *TreeNode, x int) int {
              best := -1
              node := root
              for node != nil {
                  if node.Val == x {
                      return x
                  }
                  if node.Val < x {
                      best = node.Val
                      node = node.Right
                  } else {
                      node = node.Left
                  }
              }
              return best
          }
        `,
        kotlin: kt(`
          fun floor(root: TreeNode?, x: Int): Int {
              var best = -1
              var node = root
              while (node != null) {
                  val v = node.\`val\`
                  if (v == x) return x
                  if (v < x) {
                      best = v
                      node = node.right
                  } else {
                      node = node.left
                  }
              }
              return best
          }
        `),
        swift: code`
          func floor(_ root: TreeNode?, _ x: Int) -> Int {
              var best = -1
              var node = root
              while let n = node {
                  if n.val == x { return x }
                  if n.val < x {
                      best = n.val
                      node = n.right
                  } else {
                      node = n.left
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn floor(root: Option<Rc<RefCell<TreeNode>>>, x: i32) -> i32 {
              let mut best = -1;
              let mut node = root;
              while let Some(rc) = node {
                  let b = rc.borrow();
                  if b.val == x {
                      return x;
                  }
                  let next = if b.val < x {
                      best = b.val;
                      b.right.clone()
                  } else {
                      b.left.clone()
                  };
                  drop(b);
                  node = next;
              }
              best
          }
        `,
        php: code`
          function floor($root, $x) {
              $best = -1;
              $node = $root;
              while ($node !== null) {
                  if ($node->val === $x) return $x;
                  if ($node->val < $x) { $best = $node->val; $node = $node->right; }
                  else $node = $node->left;
              }
              return $best;
          }
        `,
        ruby: code`
          def floor(root, x)
            best = -1
            node = root
            while node
              return x if node.val == x
              if node.val < x
                best = node.val
                node = node.right
              else
                node = node.left
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Inorder Successor in BST (GFG) ─────────────────────────────────
  (() => {
    const ref = (root: TNode | null, x: number) => {
      for (const v of inorderOf(root)) if (v > x) return v;
      return -1;
    };
    const EX = [
      { root: [2, 1, 3], x: 2, note: "In increasing order the values are 1, 2, 3; the one after 2 is 3." },
      { root: [20, 8, 22, 4, 12, null, null, null, null, 10, 14], x: 14, note: "14 has no right subtree; its successor is the nearest ancestor it lies to the left of — 20." },
      { root: [20, 8, 22, 4, 12, null, null, null, null, 10, 14], x: 22, note: "22 is the largest value, so it has no successor." },
    ];
    return {
      slug: "inorder-successor-in-bst",
      title: "Inorder Successor in BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Depth-First Search", "Amazon", "Microsoft"],
      signature: { funcName: "inorderSuccessor", params: [{ name: "root", type: "TreeNode" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** with distinct values and a value `x` that occurs in the tree.\n\nReturn the value of the **in-order successor** of the node holding `x` — the node that comes right after it in an in-order traversal, i.e. the smallest value greater than `x`. If `x` is the largest value in the tree, return `-1`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, x = ${e.x}`, out: String(ref(treeFrom(e.root), e.x)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "x is the value of a node in the tree"],
        "Can you find it in O(height) time?"),
      hints: [
        "The successor is the smallest value larger than `x`, so you never need the full traversal.",
        "If the node of `x` has a right subtree, the successor is that subtree's leftmost node. Otherwise it is an ancestor.",
        "Both cases are covered by one walk from the root: at a node larger than `x`, remember it and go left; otherwise go right. The last remembered node is the answer.",
      ],
      editorial: explain({
        idea: "Search for `x` from the root, and every time the walk goes left from a value larger than `x`, record that value: the last one recorded is the smallest value larger than `x`.",
        steps: [
          "Set `succ = -1` and start at the root.",
          "If the node's value is greater than `x`, set `succ` to it and move left (a smaller candidate may be there).",
          "Otherwise move right (everything at or below this node's left is not larger than `x`).",
          "When the walk ends, return `succ`.",
        ],
        why: "Moving left from a candidate discards only values larger than that candidate; moving right from a value at most `x` discards only values at most `x`. The smallest value above `x` is therefore never discarded, and the walk reaches it — either as the last ancestor turned left at, or as the leftmost node of `x`'s right subtree.",
        time: "O(h)",
        space: "O(1)",
        pitfalls: [
          "Stopping when `x` is found loses the right-subtree case: keep walking right from `x`.",
          "The successor of the maximum does not exist — return `-1`, not `x`.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.x}`, expectedOutput: String(ref(treeFrom(e.root), e.x)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = bstOf(rng, n, 1, pick(rng, [n + 3, 100, 100000]));
        const x = pick(rng, inorderOf(root));
        return { input: `${fmtTree(root)}\n${x}`, expectedOutput: String(ref(root, x)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def inorderSuccessor(root: Optional[TreeNode], x: int) -> int:
              succ = -1
              node = root
              while node:
                  if node.val > x:
                      succ = node.val
                      node = node.left
                  else:
                      node = node.right
              return succ
        `,
        javascript: code`
          var inorderSuccessor = function(root, x) {
              var succ = -1, node = root;
              while (node !== null) {
                  if (node.val > x) { succ = node.val; node = node.left; }
                  else node = node.right;
              }
              return succ;
          };
        `,
        typescript: code`
          function inorderSuccessor(root: TreeNode | null, x: number): number {
              var succ = -1;
              var node: TreeNode | null = root;
              while (node !== null) {
                  if (node.val > x) { succ = node.val; node = node.left; }
                  else node = node.right;
              }
              return succ;
          }
        `,
        java: code`
          public static int inorderSuccessor(TreeNode root, int x) {
              int succ = -1;
              TreeNode node = root;
              while (node != null) {
                  if (node.val > x) { succ = node.val; node = node.left; }
                  else node = node.right;
              }
              return succ;
          }
        `,
        cpp: code`
          int inorderSuccessor(TreeNode* root, int x) {
              int succ = -1;
              TreeNode* node = root;
              while (node) {
                  if (node->val > x) { succ = node->val; node = node->left; }
                  else node = node->right;
              }
              return succ;
          }
        `,
        c: code`
          int inorderSuccessor(struct TreeNode* root, int x) {
              int succ = -1;
              struct TreeNode* node = root;
              while (node != NULL) {
                  if (node->val > x) { succ = node->val; node = node->left; }
                  else node = node->right;
              }
              return succ;
          }
        `,
        csharp: code`
          public static int InorderSuccessor(TreeNode root, int x)
          {
              int succ = -1;
              TreeNode node = root;
              while (node != null)
              {
                  if (node.val > x) { succ = node.val; node = node.left; }
                  else node = node.right;
              }
              return succ;
          }
        `,
        go: code`
          func inorderSuccessor(root *TreeNode, x int) int {
              succ := -1
              for node := root; node != nil; {
                  if node.Val > x {
                      succ = node.Val
                      node = node.Left
                  } else {
                      node = node.Right
                  }
              }
              return succ
          }
        `,
        kotlin: kt(`
          fun inorderSuccessor(root: TreeNode?, x: Int): Int {
              var succ = -1
              var node = root
              while (node != null) {
                  if (node.\`val\` > x) {
                      succ = node.\`val\`
                      node = node.left
                  } else {
                      node = node.right
                  }
              }
              return succ
          }
        `),
        swift: code`
          func inorderSuccessor(_ root: TreeNode?, _ x: Int) -> Int {
              var succ = -1
              var node = root
              while let n = node {
                  if n.val > x {
                      succ = n.val
                      node = n.left
                  } else {
                      node = n.right
                  }
              }
              return succ
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn inorderSuccessor(root: Option<Rc<RefCell<TreeNode>>>, x: i32) -> i32 {
              let mut succ = -1;
              let mut node = root;
              while let Some(rc) = node {
                  let b = rc.borrow();
                  let next = if b.val > x {
                      succ = b.val;
                      b.left.clone()
                  } else {
                      b.right.clone()
                  };
                  drop(b);
                  node = next;
              }
              succ
          }
        `,
        php: code`
          function inorderSuccessor($root, $x) {
              $succ = -1;
              $node = $root;
              while ($node !== null) {
                  if ($node->val > $x) { $succ = $node->val; $node = $node->left; }
                  else $node = $node->right;
              }
              return $succ;
          }
        `,
        ruby: code`
          def inorderSuccessor(root, x)
            succ = -1
            node = root
            while node
              if node.val > x
                succ = node.val
                node = node.left
              else
                node = node.right
              end
            end
            succ
          end
        `,
      },
    };
  })(),

  // ── Predecessor and Successor in BST (GFG) ─────────────────────────
  (() => {
    const ref = (root: TNode | null, key: number) => {
      let pre = -1, suc = -1;
      for (const v of inorderOf(root)) { if (v < key) pre = v; if (v > key && suc === -1) suc = v; }
      return [pre, suc];
    };
    const EX = [
      { root: [50, 30, 70, 20, 40, 60, 80], key: 65, note: "65 is not in the tree; the closest values around it are 60 and 70." },
      { root: [8, 1, 9, null, 4, null, 10, 3], key: 8, note: "8 is in the tree. Its predecessor is the largest value below it (4) and its successor the smallest above it (9)." },
      { root: [10, 2, 11, 1, 5, null, null, null, null, 3, 6, null, 4], key: 0, note: "Every value is above 0: no predecessor, and the successor is the minimum, 1." },
    ];
    return {
      slug: "predecessor-and-successor",
      title: "Predecessor and Successor in BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Amazon", "Microsoft"],
      signature: { funcName: "findPreSuc", params: [{ name: "root", type: "TreeNode" as const }, { name: "key", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** with distinct values and an integer `key` (which may or may not be in the tree).\n\nReturn `[pre, suc]` where `pre` is the **in-order predecessor** of `key` — the largest value in the tree strictly **less than** `key` — and `suc` is its **in-order successor** — the smallest value strictly **greater than** `key`. Use `-1` for whichever does not exist.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, key = ${e.key}`, out: fmtIntArr(ref(treeFrom(e.root), e.key)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^6", "all node values are distinct", "0 <= key <= 10^6"]),
      hints: [
        "The two answers are independent: one is the best value below `key`, the other the best above it.",
        "For the predecessor, walk down from the root: a value below `key` is a candidate and anything better is in its right subtree; a value at or above `key` sends you left.",
        "The successor is the mirror image. Each walk is O(height), and neither needs `key` to be in the tree.",
      ],
      editorial: explain({
        idea: "Two root-to-leaf walks: one that keeps the last value seen below `key` (the predecessor), one that keeps the last value seen above it (the successor). Equality simply counts as \"not below\" or \"not above\".",
        steps: [
          "Predecessor walk: start at the root with `pre = -1`. If the node's value is less than `key`, set `pre` to it and go right; otherwise go left.",
          "Successor walk: start at the root with `suc = -1`. If the node's value is greater than `key`, set `suc` to it and go left; otherwise go right.",
          "Return `[pre, suc]`.",
        ],
        why: "In the predecessor walk, going right from a candidate discards only smaller values, and going left from a value at least `key` discards only values at least `key`, so the largest value below `key` is never discarded and is the last candidate recorded. The successor walk is symmetric.",
        time: "O(h)",
        space: "O(1)",
        pitfalls: [
          "When `key` is in the tree it is neither its own predecessor nor successor — the comparisons are strict.",
          "Do not assume `key` is present; the walks never need to find it.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.key}`, expectedOutput: fmtIntArr(ref(treeFrom(e.root), e.key)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const hi = pick(rng, [n + 3, 100, 1000000]);
        const root = bstOf(rng, n, 1, hi);
        const key = rng() < 0.4 ? pick(rng, inorderOf(root)) : ri(rng, 0, Math.min(1000000, hi + 2));
        return { input: `${fmtTree(root)}\n${key}`, expectedOutput: fmtIntArr(ref(root, key)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def findPreSuc(root: Optional[TreeNode], key: int) -> List[int]:
              pre = -1
              node = root
              while node:
                  if node.val < key:
                      pre = node.val
                      node = node.right
                  else:
                      node = node.left
              suc = -1
              node = root
              while node:
                  if node.val > key:
                      suc = node.val
                      node = node.left
                  else:
                      node = node.right
              return [pre, suc]
        `,
        javascript: code`
          var findPreSuc = function(root, key) {
              var pre = -1, suc = -1, node = root;
              while (node !== null) {
                  if (node.val < key) { pre = node.val; node = node.right; }
                  else node = node.left;
              }
              node = root;
              while (node !== null) {
                  if (node.val > key) { suc = node.val; node = node.left; }
                  else node = node.right;
              }
              return [pre, suc];
          };
        `,
        typescript: code`
          function findPreSuc(root: TreeNode | null, key: number): number[] {
              var pre = -1, suc = -1;
              var node: TreeNode | null = root;
              while (node !== null) {
                  if (node.val < key) { pre = node.val; node = node.right; }
                  else node = node.left;
              }
              node = root;
              while (node !== null) {
                  if (node.val > key) { suc = node.val; node = node.left; }
                  else node = node.right;
              }
              return [pre, suc];
          }
        `,
        java: code`
          public static int[] findPreSuc(TreeNode root, int key) {
              int pre = -1, suc = -1;
              TreeNode node = root;
              while (node != null) {
                  if (node.val < key) { pre = node.val; node = node.right; }
                  else node = node.left;
              }
              node = root;
              while (node != null) {
                  if (node.val > key) { suc = node.val; node = node.left; }
                  else node = node.right;
              }
              return new int[] { pre, suc };
          }
        `,
        cpp: code`
          vector<int> findPreSuc(TreeNode* root, int key) {
              int pre = -1, suc = -1;
              for (TreeNode* node = root; node; ) {
                  if (node->val < key) { pre = node->val; node = node->right; }
                  else node = node->left;
              }
              for (TreeNode* node = root; node; ) {
                  if (node->val > key) { suc = node->val; node = node->left; }
                  else node = node->right;
              }
              return {pre, suc};
          }
        `,
        c: code`
          int* findPreSuc(struct TreeNode* root, int key, int* returnSize) {
              int pre = -1, suc = -1;
              struct TreeNode* node = root;
              while (node != NULL) {
                  if (node->val < key) { pre = node->val; node = node->right; }
                  else node = node->left;
              }
              node = root;
              while (node != NULL) {
                  if (node->val > key) { suc = node->val; node = node->left; }
                  else node = node->right;
              }
              int* out = (int*) malloc(2 * sizeof(int));
              out[0] = pre;
              out[1] = suc;
              *returnSize = 2;
              return out;
          }
        `,
        csharp: code`
          public static int[] FindPreSuc(TreeNode root, int key)
          {
              int pre = -1, suc = -1;
              TreeNode node = root;
              while (node != null)
              {
                  if (node.val < key) { pre = node.val; node = node.right; }
                  else node = node.left;
              }
              node = root;
              while (node != null)
              {
                  if (node.val > key) { suc = node.val; node = node.left; }
                  else node = node.right;
              }
              return new int[] { pre, suc };
          }
        `,
        go: code`
          func findPreSuc(root *TreeNode, key int) []int {
              pre, suc := -1, -1
              for node := root; node != nil; {
                  if node.Val < key {
                      pre = node.Val
                      node = node.Right
                  } else {
                      node = node.Left
                  }
              }
              for node := root; node != nil; {
                  if node.Val > key {
                      suc = node.Val
                      node = node.Left
                  } else {
                      node = node.Right
                  }
              }
              return []int{pre, suc}
          }
        `,
        kotlin: kt(`
          fun findPreSuc(root: TreeNode?, key: Int): IntArray {
              var pre = -1
              var suc = -1
              var node = root
              while (node != null) {
                  if (node.\`val\` < key) {
                      pre = node.\`val\`
                      node = node.right
                  } else {
                      node = node.left
                  }
              }
              node = root
              while (node != null) {
                  if (node.\`val\` > key) {
                      suc = node.\`val\`
                      node = node.left
                  } else {
                      node = node.right
                  }
              }
              return intArrayOf(pre, suc)
          }
        `),
        swift: code`
          func findPreSuc(_ root: TreeNode?, _ key: Int) -> [Int] {
              var pre = -1
              var suc = -1
              var node = root
              while let n = node {
                  if n.val < key {
                      pre = n.val
                      node = n.right
                  } else {
                      node = n.left
                  }
              }
              node = root
              while let n = node {
                  if n.val > key {
                      suc = n.val
                      node = n.left
                  } else {
                      node = n.right
                  }
              }
              return [pre, suc]
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findPreSuc(root: Option<Rc<RefCell<TreeNode>>>, key: i32) -> Vec<i32> {
              let mut pre = -1;
              let mut node = root.clone();
              while let Some(rc) = node {
                  let b = rc.borrow();
                  let next = if b.val < key {
                      pre = b.val;
                      b.right.clone()
                  } else {
                      b.left.clone()
                  };
                  drop(b);
                  node = next;
              }
              let mut suc = -1;
              let mut node = root;
              while let Some(rc) = node {
                  let b = rc.borrow();
                  let next = if b.val > key {
                      suc = b.val;
                      b.left.clone()
                  } else {
                      b.right.clone()
                  };
                  drop(b);
                  node = next;
              }
              vec![pre, suc]
          }
        `,
        php: code`
          function findPreSuc($root, $key) {
              $pre = -1;
              $suc = -1;
              $node = $root;
              while ($node !== null) {
                  if ($node->val < $key) { $pre = $node->val; $node = $node->right; }
                  else $node = $node->left;
              }
              $node = $root;
              while ($node !== null) {
                  if ($node->val > $key) { $suc = $node->val; $node = $node->left; }
                  else $node = $node->right;
              }
              return [$pre, $suc];
          }
        `,
        ruby: code`
          def findPreSuc(root, key)
            pre = -1
            suc = -1
            node = root
            while node
              if node.val < key
                pre = node.val
                node = node.right
              else
                node = node.left
              end
            end
            node = root
            while node
              if node.val > key
                suc = node.val
                node = node.left
              else
                node = node.right
              end
            end
            [pre, suc]
          end
        `,
      },
    };
  })(),

  // ── Median of BST (GFG) ────────────────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const v = inorderOf(root), n = v.length;
      if (n % 2 === 1) return String(v[(n - 1) / 2]);
      const s = v[n / 2 - 1] + v[n / 2];
      return s % 2 === 0 ? String(s / 2) : `${(s - 1) / 2}.5`;
    };
    const EX = [
      { root: [6, 3, 8, 1, 4, 7, 9], note: "Seven values 1, 3, 4, 6, 7, 8, 9: the middle one is 6." },
      { root: [6, 3, 8, 1, 4, 7], note: "Six values 1, 3, 4, 6, 7, 8: the median is (4 + 6) / 2 = 5." },
      { root: [5, 2, 9, 1], note: "Four values 1, 2, 5, 9: (2 + 5) / 2 = 3.5." },
    ];
    return {
      slug: "median-of-bst",
      title: "Median of BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon"],
      signature: { funcName: "findMedian", params: [{ name: "root", type: "TreeNode" as const }], returns: "string" as const },
      description: describe(
        "Given the `root` of a **binary search tree** with `n` distinct values, return the **median** of its values.\n\nWith the values in increasing order, the median is the middle value when `n` is odd (the `(n + 1) / 2`-th value), and the average of the two middle values (the `n / 2`-th and `(n / 2 + 1)`-th) when `n` is even.\n\nReturn it as a string: an integer median is written plainly (`\"5\"`), and a median halfway between two integers is written with `.5` (`\"3.5\"`).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: ref(treeFrom(e.root)), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 10^5", "all node values are distinct"],
        "Can you do it with O(1) extra space (no array of values, no recursion stack)?"),
      hints: [
        "An in-order traversal of a BST visits its values in increasing order — the k-th value visited is the k-th smallest.",
        "Count the nodes first, then traverse again and stop at the middle one (or the middle two).",
        "For O(1) extra space, use Morris traversal (temporarily threading each node's in-order predecessor to it) for both passes. An average of two integers is either an integer or ends in .5.",
      ],
      editorial: explain({
        idea: "The median of a BST is a position in its in-order sequence. Count the nodes, then walk in order to the middle position(s); Morris traversal does both walks without a stack.",
        steps: [
          "Count the nodes, `n`.",
          "Traverse in order, numbering the visited values from 1.",
          "If `n` is odd, the answer is the value numbered `(n + 1) / 2`.",
          "If `n` is even, take the values numbered `n / 2` and `n / 2 + 1`, add them to `s`; the answer is `s / 2` if `s` is even, otherwise `(s - 1) / 2` followed by `.5`.",
        ],
        why: "In-order traversal of a BST lists the values sorted, so the value at position `k` is the `k`-th smallest and the median definition applies directly. The sum of two integers is even or odd, so their half is an integer or an integer plus one half — the string form is exact.",
        time: "O(n)",
        space: "O(h) with a recursive or stack-based traversal; O(1) with Morris traversal",
        pitfalls: [
          "Integer division of an odd sum drops the half — build the `.5` explicitly.",
          "The positions are 1-based in the definition; off-by-one here returns a neighbour of the median.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: ref(treeFrom(e.root)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 2, 4, 10, 25, 40]);
        const root = bstOf(rng, n, 1, pick(rng, [n + 3, 100, 100000]));
        return { input: fmtTree(root), expectedOutput: ref(root) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findMedian(root: Optional[TreeNode]) -> str:
              vals = []
              stack = []
              node = root
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  vals.append(node.val)
                  node = node.right
              n = len(vals)
              if n % 2 == 1:
                  return str(vals[n // 2])
              s = vals[n // 2 - 1] + vals[n // 2]
              return str(s // 2) if s % 2 == 0 else str(s // 2) + ".5"
        `,
        javascript: code`
          var findMedian = function(root) {
              var vals = [], stack = [], node = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  vals.push(node.val);
                  node = node.right;
              }
              var n = vals.length;
              if (n % 2 === 1) return String(vals[(n - 1) / 2]);
              var s = vals[n / 2 - 1] + vals[n / 2];
              return s % 2 === 0 ? String(s / 2) : String((s - 1) / 2) + ".5";
          };
        `,
        typescript: code`
          function findMedian(root: TreeNode | null): string {
              var vals: number[] = [], stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  vals.push(top.val);
                  node = top.right;
              }
              var n = vals.length;
              if (n % 2 === 1) return String(vals[(n - 1) / 2]);
              var s = vals[n / 2 - 1] + vals[n / 2];
              return s % 2 === 0 ? String(s / 2) : String((s - 1) / 2) + ".5";
          }
        `,
        java: code`
          public static String findMedian(TreeNode root) {
              List<Integer> vals = new ArrayList<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  vals.add(node.val);
                  node = node.right;
              }
              int n = vals.size();
              if (n % 2 == 1) return String.valueOf(vals.get(n / 2));
              int s = vals.get(n / 2 - 1) + vals.get(n / 2);
              return s % 2 == 0 ? String.valueOf(s / 2) : (s / 2) + ".5";
          }
        `,
        cpp: code`
          string findMedian(TreeNode* root) {
              vector<int> vals;
              vector<TreeNode*> stack;
              TreeNode* node = root;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  vals.push_back(node->val);
                  node = node->right;
              }
              int n = (int) vals.size();
              if (n % 2 == 1) return to_string(vals[n / 2]);
              int s = vals[n / 2 - 1] + vals[n / 2];
              return s % 2 == 0 ? to_string(s / 2) : to_string(s / 2) + ".5";
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void inorder(struct TreeNode* t, int* vals, int* len);

          char* findMedian(struct TreeNode* root) {
              int n = countNodes(root);
              int* vals = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int len = 0;
              inorder(root, vals, &len);
              char* out = (char*) malloc(32);
              if (n % 2 == 1) {
                  sprintf(out, "%d", vals[n / 2]);
              } else {
                  int s = vals[n / 2 - 1] + vals[n / 2];
                  if (s % 2 == 0) sprintf(out, "%d", s / 2);
                  else sprintf(out, "%d.5", s / 2);
              }
              free(vals);
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void inorder(struct TreeNode* t, int* vals, int* len) {
              if (t == NULL) return;
              inorder(t->left, vals, len);
              vals[(*len)++] = t->val;
              inorder(t->right, vals, len);
          }
        `,
        csharp: code`
          public static string FindMedian(TreeNode root)
          {
              var vals = new List<int>();
              var stack = new Stack<TreeNode>();
              TreeNode node = root;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  vals.Add(node.val);
                  node = node.right;
              }
              int n = vals.Count;
              if (n % 2 == 1) return vals[n / 2].ToString();
              int s = vals[n / 2 - 1] + vals[n / 2];
              return s % 2 == 0 ? (s / 2).ToString() : (s / 2).ToString() + ".5";
          }
        `,
        go: code`
          func findMedian(root *TreeNode) string {
              vals := []int{}
              stack := []*TreeNode{}
              node := root
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  vals = append(vals, node.Val)
                  node = node.Right
              }
              n := len(vals)
              if n%2 == 1 {
                  return strconv.Itoa(vals[n/2])
              }
              s := vals[n/2-1] + vals[n/2]
              if s%2 == 0 {
                  return strconv.Itoa(s / 2)
              }
              return strconv.Itoa(s/2) + ".5"
          }
        `,
        kotlin: kt(`
          fun findMedian(root: TreeNode?): String {
              val vals = ArrayList<Int>()
              val stack = ArrayList<TreeNode>()
              var node = root
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  vals.add(top.\`val\`)
                  node = top.right
              }
              val n = vals.size
              if (n % 2 == 1) return vals[n / 2].toString()
              val s = vals[n / 2 - 1] + vals[n / 2]
              return if (s % 2 == 0) (s / 2).toString() else (s / 2).toString() + ".5"
          }
        `),
        swift: code`
          func findMedian(_ root: TreeNode?) -> String {
              var vals: [Int] = []
              var stack: [TreeNode] = []
              var node = root
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  vals.append(top.val)
                  node = top.right
              }
              let n = vals.count
              if n % 2 == 1 { return String(vals[n / 2]) }
              let s = vals[n / 2 - 1] + vals[n / 2]
              return s % 2 == 0 ? String(s / 2) : String(s / 2) + ".5"
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findMedian(root: Option<Rc<RefCell<TreeNode>>>) -> String {
              let mut vals: Vec<i32> = Vec::new();
              collect_inorder(&root, &mut vals);
              let n = vals.len();
              if n % 2 == 1 {
                  return vals[n / 2].to_string();
              }
              let s = vals[n / 2 - 1] + vals[n / 2];
              if s % 2 == 0 {
                  (s / 2).to_string()
              } else {
                  format!("{}.5", s / 2)
              }
          }

          fn collect_inorder(node: &Option<Rc<RefCell<TreeNode>>>, vals: &mut Vec<i32>) {
              if let Some(rc) = node {
                  let b = rc.borrow();
                  collect_inorder(&b.left, vals);
                  vals.push(b.val);
                  collect_inorder(&b.right, vals);
              }
          }
        `,
        php: code`
          function findMedian($root) {
              $vals = [];
              $stack = [];
              $node = $root;
              while (count($stack) > 0 || $node !== null) {
                  while ($node !== null) { $stack[] = $node; $node = $node->left; }
                  $node = array_pop($stack);
                  $vals[] = $node->val;
                  $node = $node->right;
              }
              $n = count($vals);
              if ($n % 2 == 1) return strval($vals[intdiv($n, 2)]);
              $s = $vals[intdiv($n, 2) - 1] + $vals[intdiv($n, 2)];
              return $s % 2 == 0 ? strval(intdiv($s, 2)) : strval(intdiv($s, 2)) . ".5";
          }
        `,
        ruby: code`
          def findMedian(root)
            vals = []
            stack = []
            node = root
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              vals << node.val
              node = node.right
            end
            n = vals.size
            return vals[n / 2].to_s if n.odd?
            s = vals[n / 2 - 1] + vals[n / 2]
            s.even? ? (s / 2).to_s : "#{s / 2}.5"
          end
        `,
      },
    };
  })(),

  // ── Largest BST in a Binary Tree (GFG) ─────────────────────────────
  (() => {
    const isBst = (n: TNode | null) => {
      const v = inorderOf(n);
      for (let i = 1; i < v.length; i++) if (v[i] <= v[i - 1]) return false;
      return true;
    };
    const ref = (root: TNode | null) => {
      let best = 0;
      for (const n of nodesOf(root)) if (isBst(n)) best = Math.max(best, nodesOf(n).length);
      return best;
    };
    const EX = [
      { root: [5, 2, 4, 1, 3], note: "The whole tree is not a BST (4 sits right of 5). The subtree rooted at 2 — 1, 2, 3 — is, with 3 nodes." },
      { root: [6, 6, 3, null, 2, 9, 3, null, 8, 8, 2], note: "The largest subtree that is a BST is the one rooted at 2 with its right child 8: 2 nodes. Larger subtrees all break the ordering somewhere." },
      { root: [10, 5, 15, 1, 8, null, 7], note: "7 in the right subtree of 10 breaks the whole tree; the subtree 5, 1, 8 is a BST of 3 nodes." },
    ];
    return {
      slug: "largest-bst",
      title: "Largest BST in a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Amazon", "Microsoft", "Samsung"],
      signature: { funcName: "largestBst", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the number of nodes in its **largest subtree that is a binary search tree**.\n\nA subtree here is a node together with **all** of its descendants. It is a binary search tree when, for every node in it, every value in the node's left subtree is **strictly smaller** and every value in its right subtree is **strictly larger** than the node's own value. A single node is always a BST of size 1.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Testing every subtree separately costs O(n) each — O(n²) in total. Let each subtree report what its parent needs instead.",
        "A node's subtree is a BST exactly when both children's subtrees are BSTs, the left one's maximum is below the node and the right one's minimum is above it.",
        "Post-order: return (is it a BST, its size, its minimum, its maximum). An empty subtree is a BST of size 0 with minimum +∞ and maximum −∞, which makes the comparisons work at leaves.",
      ],
      editorial: explain({
        idea: "Compute, bottom-up, for every subtree whether it is a BST together with its size and value range. A parent combines its children's answers in O(1), and the largest size seen on a valid subtree is the answer.",
        steps: [
          "Define `walk(node)` returning `(ok, size, lo, hi)`; for an empty subtree return `(true, 0, +∞, −∞)`.",
          "For a node, get `L = walk(left)` and `R = walk(right)`.",
          "If `L.ok`, `R.ok`, `L.hi < node.val < R.lo`: the subtree is a BST of size `L.size + R.size + 1` with range `min(L.lo, val)` to `max(R.hi, val)`; update the best size.",
          "Otherwise return `ok = false` (the other fields no longer matter).",
          "Return the best size found.",
        ],
        why: "The BST property for a whole subtree is equivalent to: both child subtrees are BSTs and the node separates them — everything left is below it (equivalently the left maximum is) and everything right is above it (the right minimum is). The returned range is exactly the subtree's minimum and maximum, so the parent's test is exact. A subtree that is not a BST makes every ancestor's subtree fail too, which `ok = false` propagates.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Checking only each node against its two children accepts trees like 10 → (5 → right 12): a grandchild can break the ordering.",
          "Equal values are not allowed in a BST here — the comparisons are strict.",
          "The answer counts a subtree with all its descendants; a BST formed by dropping part of a subtree does not count.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        let root: TNode | null;
        if (rng() < 0.75) {
          root = bstOf(rng, n, 1, pick(rng, [n + 5, 1000]));
          const nodes = nodesOf(root);
          for (let t = ri(rng, 0, 2); t > 0; t--) pick(rng, nodes).val = ri(rng, 1, n + 5);
        } else {
          root = shapeTree(rng, n, 1, pick(rng, [3, 20, 100000]));
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def largestBst(root: Optional[TreeNode]) -> int:
              best = [0]
              INF = float("inf")

              def walk(node):
                  if node is None:
                      return True, 0, INF, -INF
                  lok, ls, llo, lhi = walk(node.left)
                  rok, rs, rlo, rhi = walk(node.right)
                  if lok and rok and lhi < node.val < rlo:
                      size = ls + rs + 1
                      best[0] = max(best[0], size)
                      return True, size, min(llo, node.val), max(rhi, node.val)
                  return False, 0, 0, 0

              walk(root)
              return best[0]
        `,
        javascript: code`
          var largestBst = function(root) {
              var best = 0;
              var walk = function(node) {
                  if (node === null) return [1, 0, Infinity, -Infinity];
                  var L = walk(node.left), R = walk(node.right);
                  if (L[0] && R[0] && L[3] < node.val && node.val < R[2]) {
                      var size = L[1] + R[1] + 1;
                      if (size > best) best = size;
                      return [1, size, Math.min(L[2], node.val), Math.max(R[3], node.val)];
                  }
                  return [0, 0, 0, 0];
              };
              walk(root);
              return best;
          };
        `,
        typescript: code`
          function largestBst(root: TreeNode | null): number {
              var best = 0;
              var walk = function(node: TreeNode | null): number[] {
                  if (node === null) return [1, 0, Infinity, -Infinity];
                  var L = walk(node.left), R = walk(node.right);
                  if (L[0] && R[0] && L[3] < node.val && node.val < R[2]) {
                      var size = L[1] + R[1] + 1;
                      if (size > best) best = size;
                      return [1, size, Math.min(L[2], node.val), Math.max(R[3], node.val)];
                  }
                  return [0, 0, 0, 0];
              };
              walk(root);
              return best;
          }
        `,
        java: code`
          public static int largestBst(TreeNode root) {
              int[] best = new int[1];
              bstWalk(root, best);
              return best[0];
          }

          // { ok (1/0), size, min, max }
          static int[] bstWalk(TreeNode node, int[] best) {
              if (node == null) return new int[] { 1, 0, Integer.MAX_VALUE, Integer.MIN_VALUE };
              int[] l = bstWalk(node.left, best), r = bstWalk(node.right, best);
              if (l[0] == 1 && r[0] == 1 && l[3] < node.val && node.val < r[2]) {
                  int size = l[1] + r[1] + 1;
                  best[0] = Math.max(best[0], size);
                  return new int[] { 1, size, Math.min(l[2], node.val), Math.max(r[3], node.val) };
              }
              return new int[] { 0, 0, 0, 0 };
          }
        `,
        cpp: code`
          struct BstInfo { bool ok; int size, lo, hi; };
          static BstInfo bstWalk(TreeNode* node, int& best);

          int largestBst(TreeNode* root) {
              int best = 0;
              bstWalk(root, best);
              return best;
          }

          static BstInfo bstWalk(TreeNode* node, int& best) {
              if (!node) return {true, 0, INT_MAX, INT_MIN};
              BstInfo l = bstWalk(node->left, best), r = bstWalk(node->right, best);
              if (l.ok && r.ok && l.hi < node->val && node->val < r.lo) {
                  int size = l.size + r.size + 1;
                  best = max(best, size);
                  return {true, size, min(l.lo, node->val), max(r.hi, node->val)};
              }
              return {false, 0, 0, 0};
          }
        `,
        c: code`
          static int bstWalk(struct TreeNode* node, int* best, int* lo, int* hi);

          int largestBst(struct TreeNode* root) {
              int best = 0, lo, hi;
              bstWalk(root, &best, &lo, &hi);
              return best;
          }

          /* Returns the subtree's size if it is a BST (0 when empty), -1 otherwise; lo/hi get its range. */
          static int bstWalk(struct TreeNode* node, int* best, int* lo, int* hi) {
              if (node == NULL) { *lo = 2147483647; *hi = -2147483647 - 1; return 0; }
              int llo, lhi, rlo, rhi;
              int ls = bstWalk(node->left, best, &llo, &lhi);
              int rs = bstWalk(node->right, best, &rlo, &rhi);
              if (ls < 0 || rs < 0 || lhi >= node->val || node->val >= rlo) return -1;
              int size = ls + rs + 1;
              if (size > *best) *best = size;
              *lo = llo < node->val ? llo : node->val;
              *hi = rhi > node->val ? rhi : node->val;
              return size;
          }
        `,
        csharp: code`
          public static int LargestBst(TreeNode root)
          {
              int best = 0;
              BstWalk(root, ref best);
              return best;
          }

          // { ok (1/0), size, min, max }
          static int[] BstWalk(TreeNode node, ref int best)
          {
              if (node == null) return new int[] { 1, 0, int.MaxValue, int.MinValue };
              int[] l = BstWalk(node.left, ref best), r = BstWalk(node.right, ref best);
              if (l[0] == 1 && r[0] == 1 && l[3] < node.val && node.val < r[2])
              {
                  int size = l[1] + r[1] + 1;
                  best = Math.Max(best, size);
                  return new int[] { 1, size, Math.Min(l[2], node.val), Math.Max(r[3], node.val) };
              }
              return new int[] { 0, 0, 0, 0 };
          }
        `,
        go: code`
          func largestBst(root *TreeNode) int {
              best := 0
              var walk func(node *TreeNode) (bool, int, int, int)
              walk = func(node *TreeNode) (bool, int, int, int) {
                  if node == nil {
                      return true, 0, 1 << 31, -(1 << 31)
                  }
                  lok, ls, llo, lhi := walk(node.Left)
                  rok, rs, rlo, rhi := walk(node.Right)
                  if lok && rok && lhi < node.Val && node.Val < rlo {
                      size := ls + rs + 1
                      if size > best {
                          best = size
                      }
                      lo, hi := llo, rhi
                      if node.Val < lo {
                          lo = node.Val
                      }
                      if node.Val > hi {
                          hi = node.Val
                      }
                      return true, size, lo, hi
                  }
                  return false, 0, 0, 0
              }
              walk(root)
              return best
          }
        `,
        kotlin: kt(`
          fun largestBst(root: TreeNode?): Int {
              val best = IntArray(1)
              bstWalk(root, best)
              return best[0]
          }

          // { ok (1/0), size, min, max }
          fun bstWalk(node: TreeNode?, best: IntArray): IntArray {
              if (node == null) return intArrayOf(1, 0, Int.MAX_VALUE, Int.MIN_VALUE)
              val l = bstWalk(node.left, best)
              val r = bstWalk(node.right, best)
              val v = node.\`val\`
              if (l[0] == 1 && r[0] == 1 && l[3] < v && v < r[2]) {
                  val size = l[1] + r[1] + 1
                  if (size > best[0]) best[0] = size
                  return intArrayOf(1, size, minOf(l[2], v), maxOf(r[3], v))
              }
              return intArrayOf(0, 0, 0, 0)
          }
        `),
        swift: code`
          func largestBst(_ root: TreeNode?) -> Int {
              var best = 0
              func walk(_ node: TreeNode?) -> (Bool, Int, Int, Int) {
                  guard let n = node else { return (true, 0, Int.max, Int.min) }
                  let l = walk(n.left)
                  let r = walk(n.right)
                  if l.0 && r.0 && l.3 < n.val && n.val < r.2 {
                      let size = l.1 + r.1 + 1
                      best = max(best, size)
                      return (true, size, min(l.2, n.val), max(r.3, n.val))
                  }
                  return (false, 0, 0, 0)
              }
              _ = walk(root)
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn largestBst(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best = 0;
              bst_walk(&root, &mut best);
              best
          }

          // (ok, size, min, max)
          fn bst_walk(node: &Option<Rc<RefCell<TreeNode>>>, best: &mut i32) -> (bool, i32, i32, i32) {
              match node {
                  None => (true, 0, std::i32::MAX, std::i32::MIN),
                  Some(rc) => {
                      let b = rc.borrow();
                      let l = bst_walk(&b.left, best);
                      let r = bst_walk(&b.right, best);
                      if l.0 && r.0 && l.3 < b.val && b.val < r.2 {
                          let size = l.1 + r.1 + 1;
                          if size > *best {
                              *best = size;
                          }
                          (true, size, l.2.min(b.val), r.3.max(b.val))
                      } else {
                          (false, 0, 0, 0)
                      }
                  }
              }
          }
        `,
        php: code`
          function largestBst($root) {
              $best = 0;
              bstWalk($root, $best);
              return $best;
          }

          // [ok, size, min, max]
          function bstWalk($node, &$best) {
              if ($node === null) return [true, 0, PHP_INT_MAX, PHP_INT_MIN];
              $l = bstWalk($node->left, $best);
              $r = bstWalk($node->right, $best);
              if ($l[0] && $r[0] && $l[3] < $node->val && $node->val < $r[2]) {
                  $size = $l[1] + $r[1] + 1;
                  if ($size > $best) $best = $size;
                  return [true, $size, min($l[2], $node->val), max($r[3], $node->val)];
              }
              return [false, 0, 0, 0];
          }
        `,
        ruby: code`
          def largestBst(root)
            best = [0]
            bst_walk(root, best)
            best[0]
          end

          # [ok, size, min, max]
          def bst_walk(node, best)
            return [true, 0, Float::INFINITY, -Float::INFINITY] if node.nil?
            l = bst_walk(node.left, best)
            r = bst_walk(node.right, best)
            if l[0] && r[0] && l[3] < node.val && node.val < r[2]
              size = l[1] + r[1] + 1
              best[0] = size if size > best[0]
              return [true, size, [l[2], node.val].min, [r[3], node.val].max]
            end
            [false, 0, 0, 0]
          end
        `,
      },
    };
  })(),

  // ── Sum of Nodes on the Longest Path from Root to Leaf (GFG) ───────
  (() => {
    const ref = (root: TNode | null) => {
      let bestLen = 0, bestSum = 0;
      const walk = (n: TNode | null, len: number, sum: number) => {
        if (!n) return;
        len++; sum += n.val;
        if (isLeaf(n)) {
          if (len > bestLen || (len === bestLen && sum > bestSum)) { bestLen = len; bestSum = sum; }
          return;
        }
        walk(n.left, len, sum);
        walk(n.right, len, sum);
      };
      walk(root, 0, 0);
      return bestSum;
    };
    const EX = [
      { root: [4, 2, 5, 7, 1, 2, 3, null, null, 6], note: "The longest root-to-leaf path has four nodes, 4 → 2 → 1 → 6, summing to 13." },
      { root: [1, 2, 3, 4, 5, 6, 7], note: "Every path has three nodes; the largest sum is 1 + 3 + 7 = 11." },
      { root: [10, 1, null, 2, 30], note: "Both paths 10 → 1 → 2 and 10 → 1 → 30 are longest; the larger sum is 41." },
    ];
    return {
      slug: "sum-of-nodes-on-the-longest-path",
      title: "Sum of Nodes on the Longest Path from Root to Leaf",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon"],
      signature: { funcName: "sumOfLongRootToLeafPath", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, consider its **longest** paths from the root down to a leaf (the paths with the most nodes).\n\nReturn the sum of the node values on such a path. If several root-to-leaf paths are equally long, return the **largest** of their sums.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^4", "the tree's height is at most 10^5, so every path sum fits in a 32-bit integer"]),
      hints: [
        "Only root-to-leaf paths count, and they are compared first by length and only then by sum.",
        "A depth-first search can carry the length and the sum of the path so far down to each leaf.",
        "At a leaf, the path wins if it is longer than the best so far, or equally long with a larger sum.",
      ],
      editorial: explain({
        idea: "Walk every root-to-leaf path with a DFS carrying (length, sum), and keep the best pair under the order \"longer first, then larger sum\".",
        steps: [
          "Keep `bestLen = 0` and `bestSum = 0`.",
          "DFS from the root with `len` and `sum` of the path including the current node.",
          "At a leaf, if `len > bestLen`, or `len == bestLen` and `sum > bestSum`, record both.",
          "Return `bestSum` after the traversal.",
        ],
        why: "Every root-to-leaf path ends at exactly one leaf, so the DFS examines each path once with its exact length and sum; the comparison implements the required order, so the recorded pair is the longest path with the greatest sum among the longest.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Maximising the sum first is wrong — a short path with large values loses to any longer path.",
          "A node with a single child is not a leaf; its path must continue down that child.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [2, 10, 10000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sumOfLongRootToLeafPath(root: Optional[TreeNode]) -> int:
              best = [0, 0]
              stack = [(root, 1, root.val)] if root else []
              while stack:
                  node, length, total = stack.pop()
                  if node.left is None and node.right is None:
                      if length > best[0] or (length == best[0] and total > best[1]):
                          best[0], best[1] = length, total
                      continue
                  if node.right:
                      stack.append((node.right, length + 1, total + node.right.val))
                  if node.left:
                      stack.append((node.left, length + 1, total + node.left.val))
              return best[1]
        `,
        javascript: code`
          var sumOfLongRootToLeafPath = function(root) {
              var bestLen = 0, bestSum = 0;
              var walk = function(node, len, sum) {
                  len++;
                  sum += node.val;
                  if (node.left === null && node.right === null) {
                      if (len > bestLen || (len === bestLen && sum > bestSum)) { bestLen = len; bestSum = sum; }
                      return;
                  }
                  if (node.left !== null) walk(node.left, len, sum);
                  if (node.right !== null) walk(node.right, len, sum);
              };
              if (root !== null) walk(root, 0, 0);
              return bestSum;
          };
        `,
        typescript: code`
          function sumOfLongRootToLeafPath(root: TreeNode | null): number {
              var bestLen = 0, bestSum = 0;
              var walk = function(node: TreeNode, len: number, sum: number): void {
                  len++;
                  sum += node.val;
                  if (node.left === null && node.right === null) {
                      if (len > bestLen || (len === bestLen && sum > bestSum)) { bestLen = len; bestSum = sum; }
                      return;
                  }
                  if (node.left !== null) walk(node.left, len, sum);
                  if (node.right !== null) walk(node.right, len, sum);
              };
              if (root !== null) walk(root, 0, 0);
              return bestSum;
          }
        `,
        java: code`
          public static int sumOfLongRootToLeafPath(TreeNode root) {
              int[] best = new int[2];
              if (root != null) pathWalk(root, 0, 0, best);
              return best[1];
          }

          static void pathWalk(TreeNode node, int len, int sum, int[] best) {
              len++;
              sum += node.val;
              if (node.left == null && node.right == null) {
                  if (len > best[0] || (len == best[0] && sum > best[1])) { best[0] = len; best[1] = sum; }
                  return;
              }
              if (node.left != null) pathWalk(node.left, len, sum, best);
              if (node.right != null) pathWalk(node.right, len, sum, best);
          }
        `,
        cpp: code`
          static void pathWalk(TreeNode* node, int len, int sum, int& bestLen, int& bestSum);

          int sumOfLongRootToLeafPath(TreeNode* root) {
              int bestLen = 0, bestSum = 0;
              if (root) pathWalk(root, 0, 0, bestLen, bestSum);
              return bestSum;
          }

          static void pathWalk(TreeNode* node, int len, int sum, int& bestLen, int& bestSum) {
              len++;
              sum += node->val;
              if (!node->left && !node->right) {
                  if (len > bestLen || (len == bestLen && sum > bestSum)) { bestLen = len; bestSum = sum; }
                  return;
              }
              if (node->left) pathWalk(node->left, len, sum, bestLen, bestSum);
              if (node->right) pathWalk(node->right, len, sum, bestLen, bestSum);
          }
        `,
        c: code`
          static void pathWalk(struct TreeNode* node, int len, int sum, int* bestLen, int* bestSum);

          int sumOfLongRootToLeafPath(struct TreeNode* root) {
              int bestLen = 0, bestSum = 0;
              if (root != NULL) pathWalk(root, 0, 0, &bestLen, &bestSum);
              return bestSum;
          }

          static void pathWalk(struct TreeNode* node, int len, int sum, int* bestLen, int* bestSum) {
              len++;
              sum += node->val;
              if (node->left == NULL && node->right == NULL) {
                  if (len > *bestLen || (len == *bestLen && sum > *bestSum)) { *bestLen = len; *bestSum = sum; }
                  return;
              }
              if (node->left != NULL) pathWalk(node->left, len, sum, bestLen, bestSum);
              if (node->right != NULL) pathWalk(node->right, len, sum, bestLen, bestSum);
          }
        `,
        csharp: code`
          public static int SumOfLongRootToLeafPath(TreeNode root)
          {
              int bestLen = 0, bestSum = 0;
              if (root != null) PathWalk(root, 0, 0, ref bestLen, ref bestSum);
              return bestSum;
          }

          static void PathWalk(TreeNode node, int len, int sum, ref int bestLen, ref int bestSum)
          {
              len++;
              sum += node.val;
              if (node.left == null && node.right == null)
              {
                  if (len > bestLen || (len == bestLen && sum > bestSum)) { bestLen = len; bestSum = sum; }
                  return;
              }
              if (node.left != null) PathWalk(node.left, len, sum, ref bestLen, ref bestSum);
              if (node.right != null) PathWalk(node.right, len, sum, ref bestLen, ref bestSum);
          }
        `,
        go: code`
          func sumOfLongRootToLeafPath(root *TreeNode) int {
              bestLen, bestSum := 0, 0
              var walk func(node *TreeNode, length int, sum int)
              walk = func(node *TreeNode, length int, sum int) {
                  length++
                  sum += node.Val
                  if node.Left == nil && node.Right == nil {
                      if length > bestLen || (length == bestLen && sum > bestSum) {
                          bestLen, bestSum = length, sum
                      }
                      return
                  }
                  if node.Left != nil {
                      walk(node.Left, length, sum)
                  }
                  if node.Right != nil {
                      walk(node.Right, length, sum)
                  }
              }
              if root != nil {
                  walk(root, 0, 0)
              }
              return bestSum
          }
        `,
        kotlin: kt(`
          fun sumOfLongRootToLeafPath(root: TreeNode?): Int {
              val best = IntArray(2)
              if (root != null) pathWalk(root, 0, 0, best)
              return best[1]
          }

          fun pathWalk(node: TreeNode, len0: Int, sum0: Int, best: IntArray) {
              val len = len0 + 1
              val sum = sum0 + node.\`val\`
              val l = node.left
              val r = node.right
              if (l == null && r == null) {
                  if (len > best[0] || (len == best[0] && sum > best[1])) {
                      best[0] = len
                      best[1] = sum
                  }
                  return
              }
              if (l != null) pathWalk(l, len, sum, best)
              if (r != null) pathWalk(r, len, sum, best)
          }
        `),
        swift: code`
          func sumOfLongRootToLeafPath(_ root: TreeNode?) -> Int {
              var bestLen = 0
              var bestSum = 0
              func walk(_ node: TreeNode, _ len0: Int, _ sum0: Int) {
                  let len = len0 + 1
                  let sum = sum0 + node.val
                  if node.left == nil && node.right == nil {
                      if len > bestLen || (len == bestLen && sum > bestSum) {
                          bestLen = len
                          bestSum = sum
                      }
                      return
                  }
                  if let l = node.left { walk(l, len, sum) }
                  if let r = node.right { walk(r, len, sum) }
              }
              if let r = root { walk(r, 0, 0) }
              return bestSum
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sumOfLongRootToLeafPath(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best = (0, 0);
              path_walk(&root, 0, 0, &mut best);
              best.1
          }

          fn path_walk(node: &Option<Rc<RefCell<TreeNode>>>, len: i32, sum: i32, best: &mut (i32, i32)) {
              if let Some(rc) = node {
                  let b = rc.borrow();
                  let len = len + 1;
                  let sum = sum + b.val;
                  if b.left.is_none() && b.right.is_none() {
                      if len > best.0 || (len == best.0 && sum > best.1) {
                          *best = (len, sum);
                      }
                      return;
                  }
                  path_walk(&b.left, len, sum, best);
                  path_walk(&b.right, len, sum, best);
              }
          }
        `,
        php: code`
          function sumOfLongRootToLeafPath($root) {
              $best = [0, 0];
              if ($root !== null) pathWalk($root, 0, 0, $best);
              return $best[1];
          }

          function pathWalk($node, $len, $sum, &$best) {
              $len++;
              $sum += $node->val;
              if ($node->left === null && $node->right === null) {
                  if ($len > $best[0] || ($len == $best[0] && $sum > $best[1])) $best = [$len, $sum];
                  return;
              }
              if ($node->left !== null) pathWalk($node->left, $len, $sum, $best);
              if ($node->right !== null) pathWalk($node->right, $len, $sum, $best);
          }
        `,
        ruby: code`
          def sumOfLongRootToLeafPath(root)
            best = [0, 0]
            path_walk(root, 0, 0, best) if root
            best[1]
          end

          def path_walk(node, len, sum, best)
            len += 1
            sum += node.val
            if node.left.nil? && node.right.nil?
              if len > best[0] || (len == best[0] && sum > best[1])
                best[0] = len
                best[1] = sum
              end
              return
            end
            path_walk(node.left, len, sum, best) if node.left
            path_walk(node.right, len, sum, best) if node.right
          end
        `,
      },
    };
  })(),

  // ── Duplicate Subtree in Binary Tree (GFG) ─────────────────────────
  (() => {
    const ser = (n: TNode | null): string => (n ? `(${ser(n.left)}${n.val}${ser(n.right)})` : "#");
    const ref = (root: TNode | null) => {
      const seen = new Set<string>();
      for (const n of nodesOf(root)) {
        if (isLeaf(n)) continue;
        const s = ser(n);
        if (seen.has(s)) return true;
        seen.add(s);
      }
      return false;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, null, 2, null, null, null, null, 4, 5], note: "The subtree 2 → (4, 5) appears twice, and it has three nodes." },
      { root: [1, 2, 3], note: "The only repeated shapes would be single leaves, and 2 and 3 differ anyway." },
      { root: [1, 2, 2, 3, null, null, 3], note: "Both 2s have a child 3, but one on the left and one on the right — the subtrees differ." },
    ];
    return {
      slug: "duplicate-subtree-of-size-two",
      title: "Duplicate Subtree in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Hash Table", "Depth-First Search", "Amazon"],
      signature: { funcName: "dupSub", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, return `true` if it contains two **identical subtrees** with **at least two nodes** each, and `false` otherwise.\n\nA subtree is a node together with all of its descendants. Two subtrees are identical when they have the same shape and the same value in every corresponding position. Repeated single leaves do not count.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Comparing every pair of subtrees directly is far too slow; give every subtree a canonical name instead.",
        "Build names bottom-up: a subtree is determined by (name of its left subtree, its value, name of its right subtree), with a fixed name for an empty child.",
        "Map each such triple to a small integer id. If a node that is not a leaf produces a triple already seen, a duplicate of size at least two exists.",
      ],
      editorial: explain({
        idea: "Two subtrees are identical exactly when their roots have equal values and identical left and right subtrees. Assigning each distinct subtree an integer id in post-order turns that recursive test into a lookup of the triple `(leftId, val, rightId)`.",
        steps: [
          "Give the empty subtree id 0 and keep a map from triples to ids.",
          "Post-order: compute the ids of the left and right subtrees, then look up `(leftId, node.val, rightId)`.",
          "If the triple is already in the map and the node is not a leaf, a duplicate subtree of size ≥ 2 exists — answer `true`.",
          "Otherwise store the triple with a fresh id (or reuse the existing one for a leaf) and return it.",
        ],
        why: "By induction two subtrees receive the same id exactly when they are identical: equal triples mean equal values and children with equal ids, hence identical children. A non-leaf node whose triple repeats therefore has an identical twin elsewhere with the same size, which is at least two. Leaves are the only subtrees of size one, and they are excluded.",
        time: "O(n) expected with a hash map",
        space: "O(n)",
        pitfalls: [
          "Serialising with in-order alone is ambiguous — 1 with left child 2 and 2 with right child 1 read the same. Mark empty children, or use ids.",
          "Two equal leaves are not an answer; only subtrees of two or more nodes count.",
          "Building full serialisation strings costs O(n²) on a chain; integer ids keep it linear.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [3, 10, 25, 40, 40]);
        let root = shapeTree(rng, n, 1, pick(rng, [1, 2, 3, 10, 100000]));
        if (rng() < 0.45 && root) {
          // Graft a copy of one subtree onto a free child slot, so a duplicate surely exists.
          const nodes = nodesOf(root);
          const src = pick(rng, nodes);
          const free = nodes.filter((x) => !x.left || !x.right);
          const at = pick(rng, free);
          const copy = cloneTree(src);
          if (!at.left) at.left = copy; else at.right = copy;
          if (nodesOf(root).length > 60) root = shapeTree(rng, n, 1, 3);
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def dupSub(root: Optional[TreeNode]) -> bool:
              ids = {}
              found = [False]

              def walk(node):
                  if node is None:
                      return 0
                  key = (walk(node.left), node.val, walk(node.right))
                  if key in ids:
                      if node.left is not None or node.right is not None:
                          found[0] = True
                      return ids[key]
                  ids[key] = len(ids) + 1
                  return ids[key]

              walk(root)
              return found[0]
        `,
        javascript: code`
          var dupSub = function(root) {
              var ids = {}, count = 0, found = false;
              var walk = function(node) {
                  if (node === null) return 0;
                  var key = walk(node.left) + "," + node.val + "," + walk(node.right);
                  if (ids.hasOwnProperty(key)) {
                      if (node.left !== null || node.right !== null) found = true;
                      return ids[key];
                  }
                  ids[key] = ++count;
                  return count;
              };
              walk(root);
              return found;
          };
        `,
        typescript: code`
          function dupSub(root: TreeNode | null): boolean {
              var ids: { [key: string]: number } = {};
              var count = 0, found = false;
              var walk = function(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var key = walk(node.left) + "," + node.val + "," + walk(node.right);
                  if (ids.hasOwnProperty(key)) {
                      if (node.left !== null || node.right !== null) found = true;
                      return ids[key];
                  }
                  ids[key] = ++count;
                  return count;
              };
              walk(root);
              return found;
          }
        `,
        java: code`
          public static boolean dupSub(TreeNode root) {
              Map<String, Integer> ids = new HashMap<>();
              boolean[] found = new boolean[1];
              subtreeId(root, ids, found);
              return found[0];
          }

          static int subtreeId(TreeNode node, Map<String, Integer> ids, boolean[] found) {
              if (node == null) return 0;
              String key = subtreeId(node.left, ids, found) + "," + node.val + "," + subtreeId(node.right, ids, found);
              Integer id = ids.get(key);
              if (id != null) {
                  if (node.left != null || node.right != null) found[0] = true;
                  return id;
              }
              int fresh = ids.size() + 1;
              ids.put(key, fresh);
              return fresh;
          }
        `,
        cpp: code`
          static int subtreeId(TreeNode* node, map<tuple<int, int, int>, int>& ids, bool& found);

          bool dupSub(TreeNode* root) {
              map<tuple<int, int, int>, int> ids;
              bool found = false;
              subtreeId(root, ids, found);
              return found;
          }

          static int subtreeId(TreeNode* node, map<tuple<int, int, int>, int>& ids, bool& found) {
              if (!node) return 0;
              int l = subtreeId(node->left, ids, found);
              int r = subtreeId(node->right, ids, found);
              auto key = make_tuple(l, node->val, r);
              auto it = ids.find(key);
              if (it != ids.end()) {
                  if (node->left || node->right) found = true;
                  return it->second;
              }
              int fresh = (int) ids.size() + 1;
              ids[key] = fresh;
              return fresh;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int subtreeId(struct TreeNode* node);

          /* Open-addressing table from (leftId, val, rightId) to a subtree id. */
          static int* tabL;
          static int* tabV;
          static int* tabR;
          static int* tabId;
          static int tabMask, nextId, dupFound;

          bool dupSub(struct TreeNode* root) {
              int n = countNodes(root), cap = 4;
              while (cap < 2 * n + 2) cap *= 2;
              tabMask = cap - 1;
              tabL = (int*) malloc((size_t) cap * sizeof(int));
              tabV = (int*) malloc((size_t) cap * sizeof(int));
              tabR = (int*) malloc((size_t) cap * sizeof(int));
              tabId = (int*) calloc((size_t) cap, sizeof(int));
              nextId = 0;
              dupFound = 0;
              subtreeId(root);
              free(tabL); free(tabV); free(tabR); free(tabId);
              return dupFound != 0;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int subtreeId(struct TreeNode* node) {
              if (node == NULL) return 0;
              int l = subtreeId(node->left);
              int r = subtreeId(node->right);
              unsigned int h = ((unsigned int) l * 1000003u) ^ ((unsigned int) node->val * 10007u) ^ ((unsigned int) r * 31u);
              int i = (int) (h & (unsigned int) tabMask);
              while (tabId[i] != 0) {
                  if (tabL[i] == l && tabV[i] == node->val && tabR[i] == r) {
                      if (node->left != NULL || node->right != NULL) dupFound = 1;
                      return tabId[i];
                  }
                  i = (i + 1) & tabMask;
              }
              tabL[i] = l;
              tabV[i] = node->val;
              tabR[i] = r;
              tabId[i] = ++nextId;
              return nextId;
          }
        `,
        csharp: code`
          public static bool DupSub(TreeNode root)
          {
              var ids = new Dictionary<string, int>();
              bool found = false;
              SubtreeId(root, ids, ref found);
              return found;
          }

          static int SubtreeId(TreeNode node, Dictionary<string, int> ids, ref bool found)
          {
              if (node == null) return 0;
              string key = SubtreeId(node.left, ids, ref found) + "," + node.val + "," + SubtreeId(node.right, ids, ref found);
              int id;
              if (ids.TryGetValue(key, out id))
              {
                  if (node.left != null || node.right != null) found = true;
                  return id;
              }
              int fresh = ids.Count + 1;
              ids[key] = fresh;
              return fresh;
          }
        `,
        go: code`
          func dupSub(root *TreeNode) bool {
              ids := map[[3]int]int{}
              found := false
              var walk func(node *TreeNode) int
              walk = func(node *TreeNode) int {
                  if node == nil {
                      return 0
                  }
                  key := [3]int{walk(node.Left), node.Val, walk(node.Right)}
                  if id, ok := ids[key]; ok {
                      if node.Left != nil || node.Right != nil {
                          found = true
                      }
                      return id
                  }
                  ids[key] = len(ids) + 1
                  return ids[key]
              }
              walk(root)
              return found
          }
        `,
        kotlin: kt(`
          fun dupSub(root: TreeNode?): Boolean {
              val ids = HashMap<String, Int>()
              val found = BooleanArray(1)
              subtreeId(root, ids, found)
              return found[0]
          }

          fun subtreeId(node: TreeNode?, ids: HashMap<String, Int>, found: BooleanArray): Int {
              if (node == null) return 0
              val key = subtreeId(node.left, ids, found).toString() + "," + node.\`val\` + "," + subtreeId(node.right, ids, found)
              val id = ids[key]
              if (id != null) {
                  if (node.left != null || node.right != null) found[0] = true
                  return id
              }
              val fresh = ids.size + 1
              ids[key] = fresh
              return fresh
          }
        `),
        swift: code`
          func dupSub(_ root: TreeNode?) -> Bool {
              var ids: [String: Int] = [:]
              var found = false
              func walk(_ node: TreeNode?) -> Int {
                  guard let n = node else { return 0 }
                  let l = walk(n.left)
                  let r = walk(n.right)
                  let key = String(l) + "," + String(n.val) + "," + String(r)
                  if let id = ids[key] {
                      if n.left != nil || n.right != nil { found = true }
                      return id
                  }
                  let fresh = ids.count + 1
                  ids[key] = fresh
                  return fresh
              }
              _ = walk(root)
              return found
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn dupSub(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut ids: HashMap<(i32, i32, i32), i32> = HashMap::new();
              let mut found = false;
              subtree_id(&root, &mut ids, &mut found);
              found
          }

          fn subtree_id(node: &Option<Rc<RefCell<TreeNode>>>, ids: &mut HashMap<(i32, i32, i32), i32>, found: &mut bool) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let b = rc.borrow();
                      let l = subtree_id(&b.left, ids, found);
                      let r = subtree_id(&b.right, ids, found);
                      let key = (l, b.val, r);
                      if let Some(&id) = ids.get(&key) {
                          if b.left.is_some() || b.right.is_some() {
                              *found = true;
                          }
                          return id;
                      }
                      let fresh = ids.len() as i32 + 1;
                      ids.insert(key, fresh);
                      fresh
                  }
              }
          }
        `,
        php: code`
          function dupSub($root) {
              $ids = [];
              $found = false;
              subtreeId($root, $ids, $found);
              return $found;
          }

          function subtreeId($node, &$ids, &$found) {
              if ($node === null) return 0;
              $key = subtreeId($node->left, $ids, $found) . "," . $node->val . "," . subtreeId($node->right, $ids, $found);
              if (isset($ids[$key])) {
                  if ($node->left !== null || $node->right !== null) $found = true;
                  return $ids[$key];
              }
              $ids[$key] = count($ids) + 1;
              return $ids[$key];
          }
        `,
        ruby: code`
          def dupSub(root)
            ids = {}
            found = [false]
            subtree_id(root, ids, found)
            found[0]
          end

          def subtree_id(node, ids, found)
            return 0 if node.nil?
            key = [subtree_id(node.left, ids, found), node.val, subtree_id(node.right, ids, found)]
            if ids.key?(key)
              found[0] = true if node.left || node.right
              return ids[key]
            end
            ids[key] = ids.size + 1
          end
        `,
      },
    };
  })(),

  // ── K-th Largest Perfect Subtree Size in Binary Tree (LC 3319) ─────
  (() => {
    const ref = (root: TNode | null, k: number) => {
      const sizes: number[] = [];
      const height = (n: TNode | null): number => {
        if (!n) return 0;
        const l = height(n.left), r = height(n.right);
        if (l < 0 || r < 0 || l !== r) return -1;
        sizes.push(2 ** (l + 1) - 1);
        return l + 1;
      };
      height(root);
      sizes.sort((a, b) => b - a);
      return k <= sizes.length ? sizes[k - 1] : -1;
    };
    const EX = [
      { root: [5, 3, 6, 5, 2, 5, 7, 1, 8, null, null, 6, 8], k: 2, note: "Each 5 on the third level forms a perfect subtree of 3 nodes with its two leaf children, and each of the six leaves is one of size 1. In decreasing order 3, 3, 1, …: the second is 3." },
      { root: [1, 2, 3, 4, 5, 6, 7], k: 1, note: "The whole tree is perfect, 7 nodes." },
      { root: [1, 2, 3, null, 4], k: 3, note: "Only the two leaves 4 and 3 are perfect subtrees, so there is no third." },
    ];
    return {
      slug: "k-th-largest-perfect-subtree-size-in-binary-tree",
      title: "K-th Largest Perfect Subtree Size in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Sorting", "Google"],
      signature: { funcName: "kthLargestPerfectSubtree", params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree and an integer `k`.\n\nA subtree (a node with all of its descendants) is **perfect** when every one of its leaves is at the same depth and every one of its other nodes has exactly two children. A single leaf is a perfect subtree of size 1.\n\nList the sizes (node counts) of all the perfect subtrees, one entry per subtree, in non-increasing order, and return the `k`-th entry. If there are fewer than `k` perfect subtrees, return `-1`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, k = ${e.k}`, out: String(ref(treeFrom(e.root), e.k)), note: e.note })),
        ["1 <= number of nodes <= 2000", "1 <= Node.val <= 2000", "1 <= k <= 1024"]),
      hints: [
        "A subtree is perfect exactly when both child subtrees are perfect and have the same height. An empty child counts as perfect of height 0.",
        "So a post-order function can return the height of a perfect subtree, or −1 when the subtree is not perfect.",
        "A perfect subtree of height `h` has `2^h − 1` nodes. Collect those sizes, sort them in decreasing order and read the `k`-th.",
      ],
      editorial: explain({
        idea: "Decide perfection bottom-up: a node roots a perfect subtree of height `h + 1` when both children root perfect subtrees of the same height `h`. Every such node contributes one size `2^(h+1) − 1`.",
        steps: [
          "Define `height(node)`: 0 for an empty subtree.",
          "Compute `l = height(left)` and `r = height(right)`. If either is −1 or `l != r`, return −1.",
          "Otherwise the node roots a perfect subtree of height `l + 1`: record its size `2^(l+1) − 1` and return `l + 1`.",
          "Sort the recorded sizes in decreasing order; return the `k`-th, or −1 if there are fewer than `k`.",
        ],
        why: "If both children are perfect with the same height, all leaves of the node's subtree are at one depth and every internal node has two children (the node itself has two non-empty children, or none when `l = r = 0` — a leaf). If the heights differ or a child is not perfect, the leaf depths differ or some node lacks a child, so the subtree is not perfect. Each perfect subtree is recorded exactly once, at its root.",
        time: "O(n log n) — dominated by the sort",
        space: "O(n)",
        pitfalls: [
          "Equal subtree sizes are separate entries in the ranking, not merged.",
          "A node with exactly one child is never perfect, even if that child is.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.k}`, expectedOutput: String(ref(treeFrom(e.root), e.k)) })),
      gen: (rng: Rng) => {
        let root: TNode | null;
        if (rng() < 0.4) {
          root = perfectTree(rng, ri(rng, 1, 5), 1, 2000);
          // Hang a few random extra nodes under leaves so some subtrees stop being perfect.
          const nodes = nodesOf(root);
          for (let t = ri(rng, 0, 4); t > 0; t--) {
            const leaf = pick(rng, nodes.filter((x) => !x.left || !x.right));
            const c: TNode = { val: ri(rng, 1, 2000), left: null, right: null };
            if (!leaf.left) leaf.left = c; else leaf.right = c;
            nodes.push(c);
          }
        } else {
          root = shapeTree(rng, sizeOf(rng, [3, 10, 25, 40, 40]), 1, 2000);
        }
        const k = ri(rng, 1, pick(rng, [1, 3, 10, 30]));
        return { input: `${fmtTree(root)}\n${k}`, expectedOutput: String(ref(root, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def kthLargestPerfectSubtree(root: Optional[TreeNode], k: int) -> int:
              sizes = []

              def height(node):
                  if node is None:
                      return 0
                  l = height(node.left)
                  r = height(node.right)
                  if l < 0 or r < 0 or l != r:
                      return -1
                  sizes.append((1 << (l + 1)) - 1)
                  return l + 1

              height(root)
              if len(sizes) < k:
                  return -1
              sizes.sort(reverse=True)
              return sizes[k - 1]
        `,
        javascript: code`
          var kthLargestPerfectSubtree = function(root, k) {
              var sizes = [];
              var height = function(node) {
                  if (node === null) return 0;
                  var l = height(node.left), r = height(node.right);
                  if (l < 0 || r < 0 || l !== r) return -1;
                  sizes.push((1 << (l + 1)) - 1);
                  return l + 1;
              };
              height(root);
              if (sizes.length < k) return -1;
              sizes.sort(function(a, b) { return b - a; });
              return sizes[k - 1];
          };
        `,
        typescript: code`
          function kthLargestPerfectSubtree(root: TreeNode | null, k: number): number {
              var sizes: number[] = [];
              var height = function(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var l = height(node.left), r = height(node.right);
                  if (l < 0 || r < 0 || l !== r) return -1;
                  sizes.push((1 << (l + 1)) - 1);
                  return l + 1;
              };
              height(root);
              if (sizes.length < k) return -1;
              sizes.sort(function(a, b) { return b - a; });
              return sizes[k - 1];
          }
        `,
        java: code`
          public static int kthLargestPerfectSubtree(TreeNode root, int k) {
              List<Integer> sizes = new ArrayList<>();
              perfectHeight(root, sizes);
              if (sizes.size() < k) return -1;
              sizes.sort(Collections.reverseOrder());
              return sizes.get(k - 1);
          }

          static int perfectHeight(TreeNode node, List<Integer> sizes) {
              if (node == null) return 0;
              int l = perfectHeight(node.left, sizes), r = perfectHeight(node.right, sizes);
              if (l < 0 || r < 0 || l != r) return -1;
              sizes.add((1 << (l + 1)) - 1);
              return l + 1;
          }
        `,
        cpp: code`
          static int perfectHeight(TreeNode* node, vector<int>& sizes);

          int kthLargestPerfectSubtree(TreeNode* root, int k) {
              vector<int> sizes;
              perfectHeight(root, sizes);
              if ((int) sizes.size() < k) return -1;
              sort(sizes.rbegin(), sizes.rend());
              return sizes[k - 1];
          }

          static int perfectHeight(TreeNode* node, vector<int>& sizes) {
              if (!node) return 0;
              int l = perfectHeight(node->left, sizes), r = perfectHeight(node->right, sizes);
              if (l < 0 || r < 0 || l != r) return -1;
              sizes.push_back((1 << (l + 1)) - 1);
              return l + 1;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int perfectHeight(struct TreeNode* node, int* sizes, int* len);
          static int cmpDesc(const void* a, const void* b);

          int kthLargestPerfectSubtree(struct TreeNode* root, int k) {
              int n = countNodes(root), len = 0, ans = -1;
              int* sizes = (int*) malloc((size_t) (n + 1) * sizeof(int));
              perfectHeight(root, sizes, &len);
              if (len >= k) {
                  qsort(sizes, (size_t) len, sizeof(int), cmpDesc);
                  ans = sizes[k - 1];
              }
              free(sizes);
              return ans;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int perfectHeight(struct TreeNode* node, int* sizes, int* len) {
              if (node == NULL) return 0;
              int l = perfectHeight(node->left, sizes, len);
              int r = perfectHeight(node->right, sizes, len);
              if (l < 0 || r < 0 || l != r) return -1;
              sizes[(*len)++] = (1 << (l + 1)) - 1;
              return l + 1;
          }

          static int cmpDesc(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return x > y ? -1 : (x < y ? 1 : 0);
          }
        `,
        csharp: code`
          public static int KthLargestPerfectSubtree(TreeNode root, int k)
          {
              var sizes = new List<int>();
              PerfectHeight(root, sizes);
              if (sizes.Count < k) return -1;
              sizes.Sort();
              sizes.Reverse();
              return sizes[k - 1];
          }

          static int PerfectHeight(TreeNode node, List<int> sizes)
          {
              if (node == null) return 0;
              int l = PerfectHeight(node.left, sizes), r = PerfectHeight(node.right, sizes);
              if (l < 0 || r < 0 || l != r) return -1;
              sizes.Add((1 << (l + 1)) - 1);
              return l + 1;
          }
        `,
        go: code`
          func kthLargestPerfectSubtree(root *TreeNode, k int) int {
              sizes := []int{}
              var height func(node *TreeNode) int
              height = func(node *TreeNode) int {
                  if node == nil {
                      return 0
                  }
                  l, r := height(node.Left), height(node.Right)
                  if l < 0 || r < 0 || l != r {
                      return -1
                  }
                  sizes = append(sizes, (1<<uint(l+1))-1)
                  return l + 1
              }
              height(root)
              if len(sizes) < k {
                  return -1
              }
              sort.Sort(sort.Reverse(sort.IntSlice(sizes)))
              return sizes[k-1]
          }
        `,
        kotlin: kt(`
          fun kthLargestPerfectSubtree(root: TreeNode?, k: Int): Int {
              val sizes = ArrayList<Int>()
              perfectHeight(root, sizes)
              if (sizes.size < k) return -1
              val sorted = sizes.sortedDescending()
              return sorted[k - 1]
          }

          fun perfectHeight(node: TreeNode?, sizes: ArrayList<Int>): Int {
              if (node == null) return 0
              val l = perfectHeight(node.left, sizes)
              val r = perfectHeight(node.right, sizes)
              if (l < 0 || r < 0 || l != r) return -1
              sizes.add((1 shl (l + 1)) - 1)
              return l + 1
          }
        `),
        swift: code`
          func kthLargestPerfectSubtree(_ root: TreeNode?, _ k: Int) -> Int {
              var sizes: [Int] = []
              func height(_ node: TreeNode?) -> Int {
                  guard let n = node else { return 0 }
                  let l = height(n.left)
                  let r = height(n.right)
                  if l < 0 || r < 0 || l != r { return -1 }
                  sizes.append((1 << (l + 1)) - 1)
                  return l + 1
              }
              _ = height(root)
              if sizes.count < k { return -1 }
              sizes.sort(by: >)
              return sizes[k - 1]
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn kthLargestPerfectSubtree(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> i32 {
              let mut sizes: Vec<i32> = Vec::new();
              perfect_height(&root, &mut sizes);
              let k = k as usize;
              if sizes.len() < k {
                  return -1;
              }
              sizes.sort_by(|a, b| b.cmp(a));
              sizes[k - 1]
          }

          fn perfect_height(node: &Option<Rc<RefCell<TreeNode>>>, sizes: &mut Vec<i32>) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let b = rc.borrow();
                      let l = perfect_height(&b.left, sizes);
                      let r = perfect_height(&b.right, sizes);
                      if l < 0 || r < 0 || l != r {
                          return -1;
                      }
                      sizes.push((1 << (l + 1)) - 1);
                      l + 1
                  }
              }
          }
        `,
        php: code`
          function kthLargestPerfectSubtree($root, $k) {
              $sizes = [];
              perfectHeight($root, $sizes);
              if (count($sizes) < $k) return -1;
              rsort($sizes);
              return $sizes[$k - 1];
          }

          function perfectHeight($node, &$sizes) {
              if ($node === null) return 0;
              $l = perfectHeight($node->left, $sizes);
              $r = perfectHeight($node->right, $sizes);
              if ($l < 0 || $r < 0 || $l != $r) return -1;
              $sizes[] = (1 << ($l + 1)) - 1;
              return $l + 1;
          }
        `,
        ruby: code`
          def kthLargestPerfectSubtree(root, k)
            sizes = []
            perfect_height(root, sizes)
            return -1 if sizes.size < k
            sizes.sort.reverse[k - 1]
          end

          def perfect_height(node, sizes)
            return 0 if node.nil?
            l = perfect_height(node.left, sizes)
            r = perfect_height(node.right, sizes)
            return -1 if l < 0 || r < 0 || l != r
            sizes << (1 << (l + 1)) - 1
            l + 1
          end
        `,
      },
    };
  })(),

  // ── Foldable Binary Tree (GFG) ─────────────────────────────────────
  (() => {
    const mirror = (a: TNode | null, b: TNode | null): boolean => (!a || !b ? a === b : mirror(a.left, b.right) && mirror(a.right, b.left));
    const ref = (root: TNode | null) => !root || mirror(root.left, root.right);
    const EX = [
      { root: [10, 7, 15, null, 9, 11], note: "7's right child 9 faces 15's left child 11: the two sides are mirror images in shape (values do not matter)." },
      { root: [10, 7, 15, 5, null, 11], note: "7 has a left child and 15 has a left child too — folded, 5 would land where 15 has no right child." },
      { root: [1], note: "A single node folds onto itself." },
    ];
    return {
      slug: "foldable-binary-tree",
      title: "Foldable Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "isFoldable", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, decide whether it is **foldable**: whether its left and right subtrees are **mirror images of each other in structure**, so that folding the tree along the vertical line through the root lays every node of one side exactly onto a node of the other.\n\nOnly the shape matters; node values are ignored. An empty tree is foldable. Return `true` or `false`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Folding pairs a node on the left with the node in the mirrored position on the right.",
        "Two subtrees are structural mirrors when both are empty, or both are non-empty and the first's left mirrors the second's right and the first's right mirrors the second's left.",
        "Apply that test to `root.left` and `root.right` — exactly the Symmetric Tree check, minus the value comparison.",
      ],
      editorial: explain({
        idea: "The tree is foldable exactly when the root's two subtrees are structural mirror images, which a simultaneous recursion over the pair checks node by node.",
        steps: [
          "If the tree is empty, return `true`.",
          "Define `mirror(a, b)`: if either is empty, return whether both are; otherwise return `mirror(a.left, b.right) && mirror(a.right, b.left)`.",
          "Return `mirror(root.left, root.right)`.",
        ],
        why: "Folding maps a node's left child onto its mirror partner's right child and vice versa. `mirror` checks precisely that every pair of mirrored positions is either filled on both sides or empty on both, recursively down to the leaves, so it returns `true` exactly when the fold matches every node.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Comparing the left subtree with the right subtree directly (left with left) tests equality, not mirroring.",
          "Values are irrelevant here — unlike Symmetric Tree, do not compare them.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        if (rng() < 0.5) {
          // Build one side, mirror its shape onto the other, then maybe break it.
          const side = shapeTree(rng, ri(rng, 0, 18), 1, 100000);
          const mir = (t: TNode | null): TNode | null => (t ? { val: ri(rng, 1, 100000), left: mir(t.right), right: mir(t.left) } : null);
          const root: TNode = { val: ri(rng, 1, 100000), left: side, right: mir(side) };
          if (rng() < 0.4) {
            const nodes = nodesOf(root).filter((x) => !x.left || !x.right);
            const at = pick(rng, nodes);
            const c: TNode = { val: ri(rng, 1, 100000), left: null, right: null };
            if (!at.left) at.left = c; else at.right = c;
          }
          return { input: fmtTree(root), expectedOutput: String(ref(root)) };
        }
        const root = rng() < 0.03 ? null : shapeTree(rng, sizeOf(rng, [1, 3, 7, 15, 31]), 1, 100000);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isFoldable(root: Optional[TreeNode]) -> bool:
              return root is None or _mirror(root.left, root.right)

          def _mirror(a, b):
              if a is None or b is None:
                  return a is None and b is None
              return _mirror(a.left, b.right) and _mirror(a.right, b.left)
        `,
        javascript: code`
          var isFoldable = function(root) {
              return root === null || mirrorShape(root.left, root.right);
          };

          function mirrorShape(a, b) {
              if (a === null || b === null) return a === null && b === null;
              return mirrorShape(a.left, b.right) && mirrorShape(a.right, b.left);
          }
        `,
        typescript: code`
          function isFoldable(root: TreeNode | null): boolean {
              return root === null || mirrorShape(root.left, root.right);
          }

          function mirrorShape(a: TreeNode | null, b: TreeNode | null): boolean {
              if (a === null || b === null) return a === null && b === null;
              return mirrorShape(a.left, b.right) && mirrorShape(a.right, b.left);
          }
        `,
        java: code`
          public static boolean isFoldable(TreeNode root) {
              return root == null || mirrorShape(root.left, root.right);
          }

          static boolean mirrorShape(TreeNode a, TreeNode b) {
              if (a == null || b == null) return a == null && b == null;
              return mirrorShape(a.left, b.right) && mirrorShape(a.right, b.left);
          }
        `,
        cpp: code`
          static bool mirrorShape(TreeNode* a, TreeNode* b);

          bool isFoldable(TreeNode* root) {
              return !root || mirrorShape(root->left, root->right);
          }

          static bool mirrorShape(TreeNode* a, TreeNode* b) {
              if (!a || !b) return !a && !b;
              return mirrorShape(a->left, b->right) && mirrorShape(a->right, b->left);
          }
        `,
        c: code`
          static bool mirrorShape(struct TreeNode* a, struct TreeNode* b);

          bool isFoldable(struct TreeNode* root) {
              return root == NULL || mirrorShape(root->left, root->right);
          }

          static bool mirrorShape(struct TreeNode* a, struct TreeNode* b) {
              if (a == NULL || b == NULL) return a == NULL && b == NULL;
              return mirrorShape(a->left, b->right) && mirrorShape(a->right, b->left);
          }
        `,
        csharp: code`
          public static bool IsFoldable(TreeNode root)
          {
              return root == null || MirrorShape(root.left, root.right);
          }

          static bool MirrorShape(TreeNode a, TreeNode b)
          {
              if (a == null || b == null) return a == null && b == null;
              return MirrorShape(a.left, b.right) && MirrorShape(a.right, b.left);
          }
        `,
        go: code`
          func isFoldable(root *TreeNode) bool {
              return root == nil || mirrorShape(root.Left, root.Right)
          }

          func mirrorShape(a *TreeNode, b *TreeNode) bool {
              if a == nil || b == nil {
                  return a == nil && b == nil
              }
              return mirrorShape(a.Left, b.Right) && mirrorShape(a.Right, b.Left)
          }
        `,
        kotlin: kt(`
          fun isFoldable(root: TreeNode?): Boolean {
              return root == null || mirrorShape(root.left, root.right)
          }

          fun mirrorShape(a: TreeNode?, b: TreeNode?): Boolean {
              if (a == null || b == null) return a == null && b == null
              return mirrorShape(a.left, b.right) && mirrorShape(a.right, b.left)
          }
        `),
        swift: code`
          func isFoldable(_ root: TreeNode?) -> Bool {
              guard let r = root else { return true }
              return mirrorShape(r.left, r.right)
          }

          func mirrorShape(_ a: TreeNode?, _ b: TreeNode?) -> Bool {
              guard let x = a, let y = b else { return a == nil && b == nil }
              return mirrorShape(x.left, y.right) && mirrorShape(x.right, y.left)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isFoldable(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              match &root {
                  None => true,
                  Some(rc) => {
                      let b = rc.borrow();
                      mirror_shape(&b.left, &b.right)
                  }
              }
          }

          fn mirror_shape(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let xb = x.borrow();
                      let yb = y.borrow();
                      mirror_shape(&xb.left, &yb.right) && mirror_shape(&xb.right, &yb.left)
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isFoldable($root) {
              return $root === null || mirrorShape($root->left, $root->right);
          }

          function mirrorShape($a, $b) {
              if ($a === null || $b === null) return $a === null && $b === null;
              return mirrorShape($a->left, $b->right) && mirrorShape($a->right, $b->left);
          }
        `,
        ruby: code`
          def isFoldable(root)
            root.nil? || mirror_shape(root.left, root.right)
          end

          def mirror_shape(a, b)
            return a.nil? && b.nil? if a.nil? || b.nil?
            mirror_shape(a.left, b.right) && mirror_shape(a.right, b.left)
          end
        `,
      },
    };
  })(),

];

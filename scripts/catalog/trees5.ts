/**
 * Binary tree problems — wave 7, batch 31.
 * Real problems only: LeetCode's numbered tree mediums (ancestor differences,
 * pruning insufficient paths, the coloring game, level sums, deepest leaves,
 * merging two BSTs, grandparent sums, deleting target leaves, splitting a tree
 * for the largest product, a linked list as a downward path, zigzag paths,
 * good nodes, pseudo-palindromic paths, good leaf pairs, the even-odd check,
 * step-by-step directions, building a tree from descriptions, subtree
 * averages, infection time and reversing odd levels). Worked examples are
 * phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a tree is LeetCode's level order
 * with `null` for a missing child and trailing nulls dropped, `[]` for the
 * empty tree; a linked list is `[1,2,3]`. Every input and expected output goes
 * through `fmtTree(treeFrom(…))` so it is always canonical. The node types are
 * the judge's — no solution redefines them. Problems LeetCode answers with a
 * changed tree (Insufficient Nodes, Delete Leaves, Reverse Odd Levels) return
 * the root; node arguments (the coloring game's `x`, the directions' start and
 * destination, the infection's `start`) are values, and values are distinct
 * wherever a value names a node. LeetCode's `val` parameter name never
 * appears (Kotlin keyword) — Delete Leaves takes `target`.
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel; JS
 * solutions are Node 12-safe (no ??, ?., at(), replaceAll, flat or flatMap);
 * the C harness has no math.h or limits.h; Rust is 1.40 (`std::i32::MAX`, no
 * `matches!`), PHP runs inside `namespace Solution;`, Kotlin is 1.3. Each
 * solution's main function comes first — C and C++ declare their helpers with
 * a prototype above it. C solutions keep no global state: the judge calls the
 * function thousands of times in one process.
 *
 * Kotlin reads a node's value as `` n.`val` ``, and a code`…` block cannot
 * hold a backtick, so the Kotlin solutions go through `kt` below: a plain
 * template literal (where \` is a backtick) dedented by the same rules — so a
 * Kotlin solution here holds no backslash and no `${`.
 *
 * Generated trees stay at or under ~40 nodes (Reverse Odd Levels: perfect
 * trees up to 63) so 5,000 hidden cases run well inside the judge's 15 CPU
 * seconds in Python, Ruby and PHP; the statements keep the real constraints.
 * Maximum Product of Splitted Binary Tree answers modulo 10^9 + 7 as LeetCode
 * does: the typed languages multiply in 64 bits, and JavaScript picks the best
 * split by |total − 2·part| (the product s·(T − s) grows as s nears T/2) and
 * multiplies once with a 16-bit split so nothing leaves a double's exact range.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtTree, listFrom, pick, randBST, randTree, ri, shuffle, treeFrom,
  type CatalogProblem, type LNode, type Rng, type TNode,
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

/** Every node's parent (the root maps to null). */
function parentsOf(root: TNode | null): Map<TNode, TNode | null> {
  const par = new Map<TNode, TNode | null>();
  if (!root) return par;
  par.set(root, null);
  for (const n of nodesOf(root)) { if (n.left) par.set(n.left, n); if (n.right) par.set(n.right, n); }
  return par;
}

/** Gives the tree's nodes distinct values from [lo, hi] (hi - lo + 1 >= node count). */
function distinctVals(rng: Rng, root: TNode | null, lo: number, hi: number): TNode | null {
  const nodes = nodesOf(root);
  let arr: number[];
  if (hi - lo + 1 <= 4 * nodes.length) {
    arr = shuffle(rng, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, nodes.length);
  } else {
    const vals = new Set<number>();
    while (vals.size < nodes.length) vals.add(ri(rng, lo, hi));
    arr = shuffle(rng, [...vals]);
  }
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

/** A BST of n distinct values from [lo, hi]: usually random, sometimes a sorted chain. */
function bstOf(rng: Rng, n: number, lo: number, hi: number): TNode | null {
  if (n <= 0) return null;
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

const sizeOf = (rng: Rng, caps: number[]) => ri(rng, 1, pick(rng, caps));

export const TREES5_PROBLEMS: CatalogProblem[] = [

  // ── Maximum Difference Between Node and Ancestor (LC 1026) ──────
  (() => {
    const ref = (root: TNode | null) => {
      let best = 0;
      for (const a of nodesOf(root)) for (const d of nodesOf(a)) best = Math.max(best, Math.abs(a.val - d.val));
      return best;
    };
    const EX = [
      { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], note: "Among all ancestor-descendant pairs the widest gap is between 8 and its descendant 1: |8 - 1| = 7." },
      { root: [1, null, 2, null, 0, 3], note: "The chain is 1 → 2 → 0 → 3; the pair 0 (ancestor) and 3 (descendant) gives |0 - 3| = 3." },
      { root: [6, 6, 6], note: "Every value is the same, so every difference is 0." },
    ];
    return {
      slug: "maximum-difference-between-node-and-ancestor",
      title: "Maximum Difference Between Node and Ancestor",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Meta"],
      signature: { funcName: "maxAncestorDiff", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, find the largest value `|a.val - b.val|` over all pairs of **different** nodes `a` and `b` where `a` is an ancestor of `b`.\n\nNode `a` is an ancestor of `b` when `b` is a child of `a`, or a child of some node that is itself a descendant of `a` — that is, `a` lies on the path from the root down to `b`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["2 <= number of nodes <= 5000", "0 <= Node.val <= 10^5"]),
      hints: [
        "For a fixed node `b`, the best ancestor to pair it with is either the smallest or the largest value on the path from the root to `b`.",
        "So it is enough to carry the minimum and the maximum seen so far down every root-to-node path.",
        "When a path ends (you step past a leaf), the widest gap on that path is simply `max - min`; the answer is the largest such gap over all paths.",
      ],
      editorial: explain({
        idea: "Any ancestor-descendant pair lies on one root-to-leaf path, and on a path the widest gap is between its smallest and largest values. Carry the running minimum and maximum down each path and take `max - min` at its end.",
        steps: [
          "Start a depth-first walk at the root with `lo = hi = root.val`.",
          "At each node, update `lo = min(lo, node.val)` and `hi = max(hi, node.val)`.",
          "When the walk reaches a null child, return `hi - lo` for the path that just ended.",
          "Each node returns the larger of its two children's results; the root's result is the answer.",
        ],
        why: "Both nodes of a pair lie on the path from the root to the deeper one, so every pair is covered by some root-to-leaf path. Conversely the minimum and maximum of a path are themselves an ancestor-descendant pair (or the same node, giving 0), so `max - min` is achievable and no pair on the path does better.",
        time: "O(n)",
        space: "O(h) for the recursion, h the height",
        pitfalls: [
          "Comparing each node only with its parent misses gaps that span several levels.",
          "Carrying only the minimum (or only the maximum) misses pairs where the descendant is smaller than its ancestor.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = Math.max(2, sizeOf(rng, [2, 5, 15, 30, 40]));
        const [lo, hi] = pick(rng, [[0, 9], [0, 100], [0, 100000], [0, 100000], [0, 3], [7, 7]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxAncestorDiff(root: Optional[TreeNode]) -> int:
              def walk(node, lo, hi):
                  if node is None:
                      return hi - lo
                  lo = min(lo, node.val)
                  hi = max(hi, node.val)
                  return max(walk(node.left, lo, hi), walk(node.right, lo, hi))

              return walk(root, root.val, root.val)
        `,
        javascript: code`
          var maxAncestorDiff = function(root) {
              return diffWalk(root, root.val, root.val);
          };

          var diffWalk = function(node, lo, hi) {
              if (node === null) return hi - lo;
              lo = Math.min(lo, node.val);
              hi = Math.max(hi, node.val);
              return Math.max(diffWalk(node.left, lo, hi), diffWalk(node.right, lo, hi));
          };
        `,
        typescript: code`
          function maxAncestorDiff(root: TreeNode | null): number {
              return diffWalk(root, root.val, root.val);
          }

          function diffWalk(node: TreeNode | null, lo: number, hi: number): number {
              if (node === null) return hi - lo;
              lo = Math.min(lo, node.val);
              hi = Math.max(hi, node.val);
              return Math.max(diffWalk(node.left, lo, hi), diffWalk(node.right, lo, hi));
          }
        `,
        java: code`
          public static int maxAncestorDiff(TreeNode root) {
              return diffWalk(root, root.val, root.val);
          }

          static int diffWalk(TreeNode node, int lo, int hi) {
              if (node == null) return hi - lo;
              lo = Math.min(lo, node.val);
              hi = Math.max(hi, node.val);
              return Math.max(diffWalk(node.left, lo, hi), diffWalk(node.right, lo, hi));
          }
        `,
        cpp: code`
          int diffWalk(TreeNode* node, int lo, int hi);

          int maxAncestorDiff(TreeNode* root) {
              return diffWalk(root, root->val, root->val);
          }

          int diffWalk(TreeNode* node, int lo, int hi) {
              if (!node) return hi - lo;
              lo = min(lo, node->val);
              hi = max(hi, node->val);
              return max(diffWalk(node->left, lo, hi), diffWalk(node->right, lo, hi));
          }
        `,
        c: code`
          static int diffWalk(struct TreeNode* node, int lo, int hi);

          int maxAncestorDiff(struct TreeNode* root) {
              return diffWalk(root, root->val, root->val);
          }

          static int diffWalk(struct TreeNode* node, int lo, int hi) {
              if (node == NULL) return hi - lo;
              if (node->val < lo) lo = node->val;
              if (node->val > hi) hi = node->val;
              int a = diffWalk(node->left, lo, hi);
              int b = diffWalk(node->right, lo, hi);
              return a > b ? a : b;
          }
        `,
        csharp: code`
          public static int MaxAncestorDiff(TreeNode root)
          {
              return DiffWalk(root, root.val, root.val);
          }

          static int DiffWalk(TreeNode node, int lo, int hi)
          {
              if (node == null) return hi - lo;
              lo = Math.Min(lo, node.val);
              hi = Math.Max(hi, node.val);
              return Math.Max(DiffWalk(node.left, lo, hi), DiffWalk(node.right, lo, hi));
          }
        `,
        go: code`
          func maxAncestorDiff(root *TreeNode) int {
              return diffWalk(root, root.Val, root.Val)
          }

          func diffWalk(node *TreeNode, lo int, hi int) int {
              if node == nil {
                  return hi - lo
              }
              if node.Val < lo {
                  lo = node.Val
              }
              if node.Val > hi {
                  hi = node.Val
              }
              a := diffWalk(node.Left, lo, hi)
              b := diffWalk(node.Right, lo, hi)
              if a > b {
                  return a
              }
              return b
          }
        `,
        kotlin: kt(`
          fun maxAncestorDiff(root: TreeNode?): Int {
              val v = root!!.\`val\`
              return diffWalk(root, v, v)
          }

          fun diffWalk(node: TreeNode?, lo: Int, hi: Int): Int {
              if (node == null) return hi - lo
              val a = minOf(lo, node.\`val\`)
              val b = maxOf(hi, node.\`val\`)
              return maxOf(diffWalk(node.left, a, b), diffWalk(node.right, a, b))
          }
        `),
        swift: code`
          func maxAncestorDiff(_ root: TreeNode?) -> Int {
              return diffWalk(root, root!.val, root!.val)
          }

          func diffWalk(_ node: TreeNode?, _ lo: Int, _ hi: Int) -> Int {
              guard let n = node else { return hi - lo }
              let a = min(lo, n.val)
              let b = max(hi, n.val)
              return max(diffWalk(n.left, a, b), diffWalk(n.right, a, b))
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxAncestorDiff(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let v = root.as_ref().unwrap().borrow().val;
              diff_walk(&root, v, v)
          }

          fn diff_walk(node: &Option<Rc<RefCell<TreeNode>>>, lo: i32, hi: i32) -> i32 {
              match node {
                  None => hi - lo,
                  Some(rc) => {
                      let n = rc.borrow();
                      let lo = lo.min(n.val);
                      let hi = hi.max(n.val);
                      diff_walk(&n.left, lo, hi).max(diff_walk(&n.right, lo, hi))
                  }
              }
          }
        `,
        php: code`
          function maxAncestorDiff($root) {
              return diffWalk($root, $root->val, $root->val);
          }

          function diffWalk($node, $lo, $hi) {
              if ($node === null) return $hi - $lo;
              $lo = min($lo, $node->val);
              $hi = max($hi, $node->val);
              return max(diffWalk($node->left, $lo, $hi), diffWalk($node->right, $lo, $hi));
          }
        `,
        ruby: code`
          def maxAncestorDiff(root)
            diff_walk(root, root.val, root.val)
          end

          def diff_walk(node, lo, hi)
            return hi - lo if node.nil?
            lo = node.val if node.val < lo
            hi = node.val if node.val > hi
            [diff_walk(node.left, lo, hi), diff_walk(node.right, lo, hi)].max
          end
        `,
      },
    };
  })(),

  // ── Insufficient Nodes in Root to Leaf Paths (LC 1080) ──────────
  (() => {
    const ref = (root: TNode | null, limit: number) => {
      const best = (n: TNode): number => {
        if (isLeaf(n)) return n.val;
        let b = -Infinity;
        if (n.left) b = Math.max(b, best(n.left));
        if (n.right) b = Math.max(b, best(n.right));
        return n.val + b;
      };
      const build = (n: TNode, above: number): TNode | null => {
        if (above + best(n) < limit) return null;
        return { val: n.val, left: n.left ? build(n.left, above + n.val) : null, right: n.right ? build(n.right, above + n.val) : null };
      };
      return root ? build(root, 0) : null;
    };
    const EX = [
      { root: [1, 2, 3, 4, -99, -99, 7, 8, 9, -99, -99, 12, 13, -99, 14], limit: 1, note: "Every path through a -99 sums below 1, so those nodes go; the paths 1→2→4→8, 1→2→4→9 and 1→3→7→14 reach at least 1 and stay." },
      { root: [5, 4, 8, 11, null, 17, 4, 7, 1, null, null, 5, 3], limit: 22, note: "The leaf 1 (path sum 21) and the leaf 3 (path sum 20) fall short of 22 and are removed; every other node lies on a path summing to at least 22." },
      { root: [1, 2, -3, -5, null, 4, null], limit: -1, note: "The only path through 2 is 1 + 2 - 5 = -2 < -1, so 2 and -5 go; the path 1 - 3 + 4 = 2 keeps 1, -3 and 4." },
    ];
    return {
      slug: "insufficient-nodes-in-root-to-leaf-paths",
      title: "Insufficient Nodes in Root to Leaf Paths",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google"],
      signature: { funcName: "sufficientSubset", params: [{ name: "root", type: "TreeNode" as const }, { name: "limit", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary tree and an integer `limit`.\n\nA node is **insufficient** if every root-to-leaf path that passes through it has a sum of values strictly smaller than `limit`. (A leaf is a node with no children.)\n\nDelete all insufficient nodes at the same time and return the root of the resulting tree. If the root itself is insufficient, the result is the empty tree `[]`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, limit = ${e.limit}`, out: fmtTree(ref(treeFrom(e.root), e.limit)), note: e.note })),
        ["1 <= number of nodes <= 5000", "-10^5 <= Node.val <= 10^5", "-10^9 <= limit <= 10^9"]),
      hints: [
        "Whether a node survives depends on the best root-to-leaf path through it — so on the sum above it and the best sum below it.",
        "Walk down carrying the sum from the root. At a leaf you know the full path sum and can decide on the spot.",
        "An inner node survives exactly when at least one of its children survived after pruning; if neither did, every path through it was too small.",
      ],
      editorial: explain({
        idea: "Prune bottom-up. A leaf is kept when its full path sum reaches `limit`; an inner node is kept when any child is kept, because a kept child carries a path through the node that is long enough.",
        steps: [
          "Walk depth-first from the root, passing down the sum of the values above the current node.",
          "Add the node's value. If it is a leaf, return it if the sum is at least `limit`, otherwise return null.",
          "Otherwise replace each existing child by the result of pruning it with the new sum.",
          "Return the node if it still has a child, otherwise null.",
          "The pruned root (possibly null) is the answer.",
        ],
        why: "The root-to-leaf paths through an inner node are exactly the paths through its children, extended by the same prefix. So the node has a sufficient path if and only if one of its children does — which is what keeping the node iff a child survived checks. A node with only one child has no path through the missing side, so that side must not count as a leaf.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "A node with one child is not a leaf: do not judge it by the path ending at it.",
          "Decide inner nodes after their children are pruned — a node whose children all disappear must disappear too.",
          "Path sums fit in 32 bits here (5000 · 10^5), but compare with `>= limit`, not `>`.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.limit}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.limit)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[-10, 10], [-5, 5], [-100000, 100000], [-100, 100]]);
        const root = shapeTree(rng, n, lo, hi)!;
        let limit: number;
        const r = rng();
        if (r < 0.1) limit = pick(rng, [-1000000000, 1000000000]);
        else {
          // Somewhere around a real root-to-leaf sum, so pruning is partial.
          let cur = root, s = 0;
          for (;;) {
            s += cur.val;
            const kids = [cur.left, cur.right].filter((c): c is TNode => c !== null);
            if (!kids.length) break;
            cur = pick(rng, kids);
          }
          const spread = Math.max(2, (hi - lo) >> 2);
          limit = s + ri(rng, -spread, spread >> 1);
        }
        return { input: `${fmtTree(root)}\n${limit}`, expectedOutput: fmtTree(ref(root, limit)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sufficientSubset(root: Optional[TreeNode], limit: int) -> Optional[TreeNode]:
              def prune(node, s):
                  s += node.val
                  if node.left is None and node.right is None:
                      return node if s >= limit else None
                  if node.left:
                      node.left = prune(node.left, s)
                  if node.right:
                      node.right = prune(node.right, s)
                  return node if node.left or node.right else None

              return prune(root, 0) if root else None
        `,
        javascript: code`
          var sufficientSubset = function(root, limit) {
              return root === null ? null : pruneWalk(root, 0, limit);
          };

          var pruneWalk = function(node, s, limit) {
              s += node.val;
              if (node.left === null && node.right === null) return s >= limit ? node : null;
              if (node.left !== null) node.left = pruneWalk(node.left, s, limit);
              if (node.right !== null) node.right = pruneWalk(node.right, s, limit);
              return node.left !== null || node.right !== null ? node : null;
          };
        `,
        typescript: code`
          function sufficientSubset(root: TreeNode | null, limit: number): TreeNode | null {
              return root === null ? null : pruneWalk(root, 0, limit);
          }

          function pruneWalk(node: TreeNode, s: number, limit: number): TreeNode | null {
              s += node.val;
              if (node.left === null && node.right === null) return s >= limit ? node : null;
              if (node.left !== null) node.left = pruneWalk(node.left, s, limit);
              if (node.right !== null) node.right = pruneWalk(node.right, s, limit);
              return node.left !== null || node.right !== null ? node : null;
          }
        `,
        java: code`
          public static TreeNode sufficientSubset(TreeNode root, int limit) {
              return root == null ? null : pruneWalk(root, 0, limit);
          }

          static TreeNode pruneWalk(TreeNode node, int s, int limit) {
              s += node.val;
              if (node.left == null && node.right == null) return s >= limit ? node : null;
              if (node.left != null) node.left = pruneWalk(node.left, s, limit);
              if (node.right != null) node.right = pruneWalk(node.right, s, limit);
              return node.left != null || node.right != null ? node : null;
          }
        `,
        cpp: code`
          TreeNode* pruneWalk(TreeNode* node, int s, int limit);

          TreeNode* sufficientSubset(TreeNode* root, int limit) {
              return root ? pruneWalk(root, 0, limit) : nullptr;
          }

          TreeNode* pruneWalk(TreeNode* node, int s, int limit) {
              s += node->val;
              if (!node->left && !node->right) return s >= limit ? node : nullptr;
              if (node->left) node->left = pruneWalk(node->left, s, limit);
              if (node->right) node->right = pruneWalk(node->right, s, limit);
              return (node->left || node->right) ? node : nullptr;
          }
        `,
        c: code`
          static struct TreeNode* pruneWalk(struct TreeNode* node, int s, int limit);

          struct TreeNode* sufficientSubset(struct TreeNode* root, int limit) {
              return root == NULL ? NULL : pruneWalk(root, 0, limit);
          }

          static struct TreeNode* pruneWalk(struct TreeNode* node, int s, int limit) {
              s += node->val;
              if (node->left == NULL && node->right == NULL) return s >= limit ? node : NULL;
              if (node->left != NULL) node->left = pruneWalk(node->left, s, limit);
              if (node->right != NULL) node->right = pruneWalk(node->right, s, limit);
              return (node->left != NULL || node->right != NULL) ? node : NULL;
          }
        `,
        csharp: code`
          public static TreeNode SufficientSubset(TreeNode root, int limit)
          {
              return root == null ? null : PruneWalk(root, 0, limit);
          }

          static TreeNode PruneWalk(TreeNode node, int s, int limit)
          {
              s += node.val;
              if (node.left == null && node.right == null) return s >= limit ? node : null;
              if (node.left != null) node.left = PruneWalk(node.left, s, limit);
              if (node.right != null) node.right = PruneWalk(node.right, s, limit);
              return node.left != null || node.right != null ? node : null;
          }
        `,
        go: code`
          func sufficientSubset(root *TreeNode, limit int) *TreeNode {
              if root == nil {
                  return nil
              }
              return pruneWalk(root, 0, limit)
          }

          func pruneWalk(node *TreeNode, s int, limit int) *TreeNode {
              s += node.Val
              if node.Left == nil && node.Right == nil {
                  if s >= limit {
                      return node
                  }
                  return nil
              }
              if node.Left != nil {
                  node.Left = pruneWalk(node.Left, s, limit)
              }
              if node.Right != nil {
                  node.Right = pruneWalk(node.Right, s, limit)
              }
              if node.Left != nil || node.Right != nil {
                  return node
              }
              return nil
          }
        `,
        kotlin: kt(`
          fun sufficientSubset(root: TreeNode?, limit: Int): TreeNode? {
              if (root == null) return null
              return pruneWalk(root, 0, limit)
          }

          fun pruneWalk(node: TreeNode, sum: Int, limit: Int): TreeNode? {
              val s = sum + node.\`val\`
              val l = node.left
              val r = node.right
              if (l == null && r == null) return if (s >= limit) node else null
              if (l != null) node.left = pruneWalk(l, s, limit)
              if (r != null) node.right = pruneWalk(r, s, limit)
              return if (node.left != null || node.right != null) node else null
          }
        `),
        swift: code`
          func sufficientSubset(_ root: TreeNode?, _ limit: Int) -> TreeNode? {
              guard let r = root else { return nil }
              return pruneWalk(r, 0, limit)
          }

          func pruneWalk(_ node: TreeNode, _ sum: Int, _ limit: Int) -> TreeNode? {
              let s = sum + node.val
              if node.left == nil && node.right == nil { return s >= limit ? node : nil }
              if let l = node.left { node.left = pruneWalk(l, s, limit) }
              if let r = node.right { node.right = pruneWalk(r, s, limit) }
              return (node.left != nil || node.right != nil) ? node : nil
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sufficientSubset(root: Option<Rc<RefCell<TreeNode>>>, limit: i32) -> Option<Rc<RefCell<TreeNode>>> {
              match root {
                  None => None,
                  Some(rc) => prune_walk(rc, 0, limit),
              }
          }

          fn prune_walk(rc: Rc<RefCell<TreeNode>>, sum: i32, limit: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let (s, left, right) = {
                  let mut n = rc.borrow_mut();
                  (sum + n.val, n.left.take(), n.right.take())
              };
              if left.is_none() && right.is_none() {
                  return if s >= limit { Some(rc) } else { None };
              }
              let nl = match left {
                  Some(l) => prune_walk(l, s, limit),
                  None => None,
              };
              let nr = match right {
                  Some(r) => prune_walk(r, s, limit),
                  None => None,
              };
              let keep = nl.is_some() || nr.is_some();
              {
                  let mut n = rc.borrow_mut();
                  n.left = nl;
                  n.right = nr;
              }
              if keep { Some(rc) } else { None }
          }
        `,
        php: code`
          function sufficientSubset($root, $limit) {
              return $root === null ? null : pruneWalk($root, 0, $limit);
          }

          function pruneWalk($node, $s, $limit) {
              $s += $node->val;
              if ($node->left === null && $node->right === null) return $s >= $limit ? $node : null;
              if ($node->left !== null) $node->left = pruneWalk($node->left, $s, $limit);
              if ($node->right !== null) $node->right = pruneWalk($node->right, $s, $limit);
              return ($node->left !== null || $node->right !== null) ? $node : null;
          }
        `,
        ruby: code`
          def sufficientSubset(root, limit)
            return nil if root.nil?
            prune_walk(root, 0, limit)
          end

          def prune_walk(node, s, limit)
            s += node.val
            return (s >= limit ? node : nil) if node.left.nil? && node.right.nil?
            node.left = prune_walk(node.left, s, limit) if node.left
            node.right = prune_walk(node.right, s, limit) if node.right
            node.left || node.right ? node : nil
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Coloring Game (LC 1145) ─────────────────────────
  (() => {
    const ref = (root: TNode | null, n: number, x: number) => {
      // Brute force: the regions left when x is removed; the second player wins by taking the largest.
      const adj = new Map<number, number[]>();
      const link = (a: number, b: number) => { adj.get(a)!.push(b); adj.get(b)!.push(a); };
      for (const v of nodesOf(root)) adj.set(v.val, []);
      for (const v of nodesOf(root)) { if (v.left) link(v.val, v.left.val); if (v.right) link(v.val, v.right.val); }
      const seen = new Set<number>([x]);
      let best = 0;
      for (const start of adj.get(x) || []) {
        if (seen.has(start)) continue;
        let size = 0;
        const st = [start];
        seen.add(start);
        while (st.length) {
          const u = st.pop()!;
          size++;
          for (const w of adj.get(u)!) if (!seen.has(w)) { seen.add(w); st.push(w); }
        }
        best = Math.max(best, size);
      }
      return 2 * best > n;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], n: 11, x: 3, note: "The second player colors 2. Node 3 then cuts the red side off from 1, 2 and 2's whole subtree — 6 of the 11 nodes go blue." },
      { root: [1, 2, 3], n: 3, x: 1, note: "Red holds the root; blue can take only one of the two leaves, 1 node against red's 2." },
      { root: [1, 2, 3], n: 3, x: 2, note: "Blue colors 1 and then reaches 3 as well: 2 nodes against red's 1." },
    ];
    return {
      slug: "binary-tree-coloring-game",
      title: "Binary Tree Coloring Game",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "btreeGameWinningMove", params: [{ name: "root", type: "TreeNode" as const }, { name: "n", type: "int" as const }, { name: "x", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Two players play a turn-based game on a binary tree. You are given its `root` and the number of nodes `n`, which is **odd**; the nodes hold the distinct values `1` to `n`.\n\nThe first player picks a value `x` and colors that node red. The second player then picks a different value `y` and colors that node blue. After that the players alternate, starting with the first: on a turn a player picks a node of their own color and colors one of its **uncolored** neighbours (its left child, right child or parent). A player who cannot move passes. When both players must pass the game ends, and whoever colored more nodes wins.\n\nYou are the second player and `x` has been chosen. Return `true` if you can choose `y` so that you are guaranteed to win, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, n = ${e.n}, x = ${e.x}`, out: String(ref(treeFrom(e.root), e.n, e.x)), note: e.note })),
        ["1 <= n <= 100", "n is odd", "the tree has n nodes with the distinct values 1 to n", "1 <= x <= n"]),
      hints: [
        "Removing the red node splits the tree into at most three regions: its left subtree, its right subtree, and everything above it.",
        "If blue starts next to red in one of those regions, red can never enter that region — the only way in is through red's own node, which blue has blocked.",
        "So blue wins exactly when one of the three regions holds more than half of the `n` nodes. Count the two subtree sizes of `x`; the third region is what is left.",
      ],
      editorial: explain({
        idea: "Blue's best move is to stand on one of red's neighbours, sealing off that neighbour's whole region. The three regions around `x` have sizes `left`, `right` and `n - 1 - left - right`, and blue wins iff the largest is more than `n / 2`.",
        steps: [
          "Walk the tree computing every subtree's size.",
          "At the node whose value is `x`, record the sizes of its left and right subtrees.",
          "The region above `x` has `n - 1 - left - right` nodes.",
          "Return whether the largest of the three regions times 2 exceeds `n`.",
        ],
        why: "The regions around `x` touch each other only through `x`, which red owns. Blue choosing the neighbour of `x` in a region claims that entire region: red cannot get into it, and blue can spread through it one node per turn. Red can at best claim everything else. Choosing a node farther from `x` only gives red a chance to take more, so the neighbour of the largest region is optimal, and blue wins iff that region alone is a majority (n is odd, so there are no ties).",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Do not forget the parent region — when `x` is deep, the part above it is often the largest.",
          "Strictly more than half: compare `2 · size > n`.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.n}\n${e.x}`, expectedOutput: String(ref(treeFrom(e.root), e.n, e.x)) })),
      gen: (rng: Rng) => {
        let n = sizeOf(rng, [1, 5, 15, 31, 39]);
        if (n % 2 === 0) n++;
        const root = distinctVals(rng, shapeTree(rng, n, 1, n), 1, n);
        const x = ri(rng, 1, n);
        return { input: `${fmtTree(root)}\n${n}\n${x}`, expectedOutput: String(ref(root, n, x)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def btreeGameWinningMove(root: Optional[TreeNode], n: int, x: int) -> bool:
              sides = [0, 0]

              def count(node):
                  if node is None:
                      return 0
                  a = count(node.left)
                  b = count(node.right)
                  if node.val == x:
                      sides[0] = a
                      sides[1] = b
                  return a + b + 1

              count(root)
              above = n - 1 - sides[0] - sides[1]
              return 2 * max(above, sides[0], sides[1]) > n
        `,
        javascript: code`
          var btreeGameWinningMove = function(root, n, x) {
              var sides = [0, 0];
              countSides(root, x, sides);
              var above = n - 1 - sides[0] - sides[1];
              return 2 * Math.max(above, sides[0], sides[1]) > n;
          };

          var countSides = function(node, x, sides) {
              if (node === null) return 0;
              var a = countSides(node.left, x, sides);
              var b = countSides(node.right, x, sides);
              if (node.val === x) { sides[0] = a; sides[1] = b; }
              return a + b + 1;
          };
        `,
        typescript: code`
          function btreeGameWinningMove(root: TreeNode | null, n: number, x: number): boolean {
              var sides = [0, 0];
              countSides(root, x, sides);
              var above = n - 1 - sides[0] - sides[1];
              return 2 * Math.max(above, sides[0], sides[1]) > n;
          }

          function countSides(node: TreeNode | null, x: number, sides: number[]): number {
              if (node === null) return 0;
              var a = countSides(node.left, x, sides);
              var b = countSides(node.right, x, sides);
              if (node.val === x) { sides[0] = a; sides[1] = b; }
              return a + b + 1;
          }
        `,
        java: code`
          public static boolean btreeGameWinningMove(TreeNode root, int n, int x) {
              int[] sides = new int[2];
              countSides(root, x, sides);
              int above = n - 1 - sides[0] - sides[1];
              return 2 * Math.max(above, Math.max(sides[0], sides[1])) > n;
          }

          static int countSides(TreeNode node, int x, int[] sides) {
              if (node == null) return 0;
              int a = countSides(node.left, x, sides);
              int b = countSides(node.right, x, sides);
              if (node.val == x) { sides[0] = a; sides[1] = b; }
              return a + b + 1;
          }
        `,
        cpp: code`
          int countSides(TreeNode* node, int x, int& left, int& right);

          bool btreeGameWinningMove(TreeNode* root, int n, int x) {
              int left = 0, right = 0;
              countSides(root, x, left, right);
              int above = n - 1 - left - right;
              return 2 * max(above, max(left, right)) > n;
          }

          int countSides(TreeNode* node, int x, int& left, int& right) {
              if (!node) return 0;
              int a = countSides(node->left, x, left, right);
              int b = countSides(node->right, x, left, right);
              if (node->val == x) { left = a; right = b; }
              return a + b + 1;
          }
        `,
        c: code`
          static int countSides(struct TreeNode* node, int x, int* left, int* right);

          bool btreeGameWinningMove(struct TreeNode* root, int n, int x) {
              int left = 0, right = 0;
              countSides(root, x, &left, &right);
              int best = n - 1 - left - right;
              if (left > best) best = left;
              if (right > best) best = right;
              return 2 * best > n;
          }

          static int countSides(struct TreeNode* node, int x, int* left, int* right) {
              if (node == NULL) return 0;
              int a = countSides(node->left, x, left, right);
              int b = countSides(node->right, x, left, right);
              if (node->val == x) { *left = a; *right = b; }
              return a + b + 1;
          }
        `,
        csharp: code`
          public static bool BtreeGameWinningMove(TreeNode root, int n, int x)
          {
              int[] sides = new int[2];
              CountSides(root, x, sides);
              int above = n - 1 - sides[0] - sides[1];
              return 2 * Math.Max(above, Math.Max(sides[0], sides[1])) > n;
          }

          static int CountSides(TreeNode node, int x, int[] sides)
          {
              if (node == null) return 0;
              int a = CountSides(node.left, x, sides);
              int b = CountSides(node.right, x, sides);
              if (node.val == x) { sides[0] = a; sides[1] = b; }
              return a + b + 1;
          }
        `,
        go: code`
          func btreeGameWinningMove(root *TreeNode, n int, x int) bool {
              left, right := 0, 0
              var count func(node *TreeNode) int
              count = func(node *TreeNode) int {
                  if node == nil {
                      return 0
                  }
                  a := count(node.Left)
                  b := count(node.Right)
                  if node.Val == x {
                      left, right = a, b
                  }
                  return a + b + 1
              }
              count(root)
              best := n - 1 - left - right
              if left > best {
                  best = left
              }
              if right > best {
                  best = right
              }
              return 2*best > n
          }
        `,
        kotlin: kt(`
          fun btreeGameWinningMove(root: TreeNode?, n: Int, x: Int): Boolean {
              val sides = IntArray(2)
              countSides(root, x, sides)
              val above = n - 1 - sides[0] - sides[1]
              return 2 * maxOf(above, maxOf(sides[0], sides[1])) > n
          }

          fun countSides(node: TreeNode?, x: Int, sides: IntArray): Int {
              if (node == null) return 0
              val a = countSides(node.left, x, sides)
              val b = countSides(node.right, x, sides)
              if (node.\`val\` == x) {
                  sides[0] = a
                  sides[1] = b
              }
              return a + b + 1
          }
        `),
        swift: code`
          func btreeGameWinningMove(_ root: TreeNode?, _ n: Int, _ x: Int) -> Bool {
              var left = 0, right = 0
              _ = countSides(root, x, &left, &right)
              let above = n - 1 - left - right
              return 2 * max(above, left, right) > n
          }

          func countSides(_ node: TreeNode?, _ x: Int, _ left: inout Int, _ right: inout Int) -> Int {
              guard let nd = node else { return 0 }
              let a = countSides(nd.left, x, &left, &right)
              let b = countSides(nd.right, x, &left, &right)
              if nd.val == x {
                  left = a
                  right = b
              }
              return a + b + 1
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn btreeGameWinningMove(root: Option<Rc<RefCell<TreeNode>>>, n: i32, x: i32) -> bool {
              let mut sides = (0, 0);
              count_sides(&root, x, &mut sides);
              let above = n - 1 - sides.0 - sides.1;
              2 * above.max(sides.0).max(sides.1) > n
          }

          fn count_sides(node: &Option<Rc<RefCell<TreeNode>>>, x: i32, sides: &mut (i32, i32)) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let nd = rc.borrow();
                      let a = count_sides(&nd.left, x, sides);
                      let b = count_sides(&nd.right, x, sides);
                      if nd.val == x {
                          *sides = (a, b);
                      }
                      a + b + 1
                  }
              }
          }
        `,
        php: code`
          function btreeGameWinningMove($root, $n, $x) {
              $sides = [0, 0];
              countSides($root, $x, $sides);
              $above = $n - 1 - $sides[0] - $sides[1];
              return 2 * max($above, $sides[0], $sides[1]) > $n;
          }

          function countSides($node, $x, &$sides) {
              if ($node === null) return 0;
              $a = countSides($node->left, $x, $sides);
              $b = countSides($node->right, $x, $sides);
              if ($node->val == $x) { $sides[0] = $a; $sides[1] = $b; }
              return $a + $b + 1;
          }
        `,
        ruby: code`
          def btreeGameWinningMove(root, n, x)
            sides = [0, 0]
            count_sides(root, x, sides)
            above = n - 1 - sides[0] - sides[1]
            2 * [above, sides[0], sides[1]].max > n
          end

          def count_sides(node, x, sides)
            return 0 if node.nil?
            a = count_sides(node.left, x, sides)
            b = count_sides(node.right, x, sides)
            if node.val == x
              sides[0] = a
              sides[1] = b
            end
            a + b + 1
          end
        `,
      },
    };
  })(),

  // ── Maximum Level Sum of a Binary Tree (LC 1161) ────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const sums = levelNodes(root).map((l) => l.reduce((s, n) => s + n.val, 0));
      let best = 0;
      for (let i = 1; i < sums.length; i++) if (sums[i] > sums[best]) best = i;
      return best + 1;
    };
    const EX = [
      { root: [1, 7, 0, 7, -8, null, null], note: "The level sums are 1, 7 + 0 = 7 and 7 - 8 = -1; level 2 is the largest." },
      { root: [989, null, 10250, 98693, -89388, null, null, null, -32127], note: "The sums are 989, 10250, 98693 - 89388 = 9305 and -32127; level 2 wins." },
      { root: [1, 2, -1], note: "Levels 1 and 2 both sum to 1; the smaller level number, 1, is returned." },
    ];
    return {
      slug: "maximum-level-sum-of-a-binary-tree",
      title: "Maximum Level Sum of a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "maxLevelSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, number its levels from the top: the root is on level `1`, its children on level `2`, and so on.\n\nReturn the level whose node values add up to the largest sum. If several levels share that largest sum, return the **smallest** such level.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "-10^5 <= Node.val <= 10^5"]),
      hints: [
        "You need one number per level, so visit the tree level by level.",
        "A breadth-first walk that processes exactly the nodes currently in the queue at a time handles one whole level per round.",
        "Keep the best sum and its level; replace them only on a strictly larger sum so ties keep the earlier level. Sums can be negative — do not start the best at 0.",
      ],
      editorial: explain({
        idea: "A breadth-first walk visits the tree one level at a time; sum each level and keep the first level that reaches the maximum.",
        steps: [
          "Put the root in a queue and set the level counter to 0.",
          "While the queue is not empty: increase the level, take exactly the nodes now in the queue, add up their values and enqueue their children.",
          "If this is the first level or its sum is strictly larger than the best so far, record the sum and the level.",
          "Return the recorded level.",
        ],
        why: "Each round of the walk removes exactly the nodes of one level, because those are precisely the nodes enqueued during the previous round. Comparing with a strict `>` keeps the earliest level among equal sums.",
        time: "O(n)",
        space: "O(w), w the widest level",
        pitfalls: [
          "Initialising the best sum to 0 fails when every level sum is negative.",
          "Using `>=` returns the last level among ties instead of the first.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[-10, 10], [-3, 3], [-100000, 100000], [-100000, -1], [0, 5]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxLevelSum(root: Optional[TreeNode]) -> int:
              best_sum = None
              best_level = 1
              level = [root]
              depth = 0
              while level:
                  depth += 1
                  total = 0
                  nxt = []
                  for node in level:
                      total += node.val
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  if best_sum is None or total > best_sum:
                      best_sum = total
                      best_level = depth
                  level = nxt
              return best_level
        `,
        javascript: code`
          var maxLevelSum = function(root) {
              var queue = [root], head = 0, depth = 0, bestLevel = 1, bestSum = 0;
              while (head < queue.length) {
                  var end = queue.length, total = 0;
                  depth++;
                  while (head < end) {
                      var node = queue[head++];
                      total += node.val;
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  if (depth === 1 || total > bestSum) { bestSum = total; bestLevel = depth; }
              }
              return bestLevel;
          };
        `,
        typescript: code`
          function maxLevelSum(root: TreeNode | null): number {
              var queue: TreeNode[] = [root];
              var head = 0, depth = 0, bestLevel = 1, bestSum = 0;
              while (head < queue.length) {
                  var end = queue.length, total = 0;
                  depth++;
                  while (head < end) {
                      var node = queue[head++];
                      total += node.val;
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  if (depth === 1 || total > bestSum) { bestSum = total; bestLevel = depth; }
              }
              return bestLevel;
          }
        `,
        java: code`
          public static int maxLevelSum(TreeNode root) {
              Deque<TreeNode> queue = new ArrayDeque<>();
              queue.add(root);
              int depth = 0, bestLevel = 1;
              long bestSum = Long.MIN_VALUE;
              while (!queue.isEmpty()) {
                  depth++;
                  long total = 0;
                  for (int i = queue.size(); i > 0; i--) {
                      TreeNode node = queue.poll();
                      total += node.val;
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  if (total > bestSum) { bestSum = total; bestLevel = depth; }
              }
              return bestLevel;
          }
        `,
        cpp: code`
          int maxLevelSum(TreeNode* root) {
              queue<TreeNode*> q;
              q.push(root);
              int depth = 0, bestLevel = 1;
              long long bestSum = LLONG_MIN;
              while (!q.empty()) {
                  depth++;
                  long long total = 0;
                  for (int i = (int) q.size(); i > 0; i--) {
                      TreeNode* node = q.front();
                      q.pop();
                      total += node->val;
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  if (total > bestSum) { bestSum = total; bestLevel = depth; }
              }
              return bestLevel;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int maxLevelSum(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, depth = 0, bestLevel = 1;
              long long bestSum = 0;
              queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  long long total = 0;
                  depth++;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      total += node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  if (depth == 1 || total > bestSum) { bestSum = total; bestLevel = depth; }
              }
              free(queue);
              return bestLevel;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int MaxLevelSum(TreeNode root)
          {
              var level = new List<TreeNode> { root };
              int depth = 0, bestLevel = 1;
              long bestSum = long.MinValue;
              while (level.Count > 0)
              {
                  depth++;
                  long total = 0;
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      total += node.val;
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  if (total > bestSum) { bestSum = total; bestLevel = depth; }
                  level = next;
              }
              return bestLevel;
          }
        `,
        go: code`
          func maxLevelSum(root *TreeNode) int {
              level := []*TreeNode{root}
              depth, bestLevel, bestSum := 0, 1, 0
              for len(level) > 0 {
                  depth++
                  total := 0
                  next := []*TreeNode{}
                  for _, node := range level {
                      total += node.Val
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  if depth == 1 || total > bestSum {
                      bestSum = total
                      bestLevel = depth
                  }
                  level = next
              }
              return bestLevel
          }
        `,
        kotlin: kt(`
          fun maxLevelSum(root: TreeNode?): Int {
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              var depth = 0
              var bestLevel = 1
              var bestSum = Long.MIN_VALUE
              while (level.isNotEmpty()) {
                  depth++
                  var total = 0L
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      total += node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  if (total > bestSum) {
                      bestSum = total
                      bestLevel = depth
                  }
                  level = next
              }
              return bestLevel
          }
        `),
        swift: code`
          func maxLevelSum(_ root: TreeNode?) -> Int {
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              var depth = 0, bestLevel = 1, bestSum = Int.min
              while !level.isEmpty {
                  depth += 1
                  var total = 0
                  var next: [TreeNode] = []
                  for node in level {
                      total += node.val
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  if total > bestSum {
                      bestSum = total
                      bestLevel = depth
                  }
                  level = next
              }
              return bestLevel
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxLevelSum(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              let mut depth = 0;
              let mut best_level = 1;
              let mut best_sum = std::i64::MIN;
              while !level.is_empty() {
                  depth += 1;
                  let mut total: i64 = 0;
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      total += b.val as i64;
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  if total > best_sum {
                      best_sum = total;
                      best_level = depth;
                  }
                  level = next;
              }
              best_level
          }
        `,
        php: code`
          function maxLevelSum($root) {
              $level = [$root];
              $depth = 0;
              $bestLevel = 1;
              $bestSum = null;
              while (count($level) > 0) {
                  $depth++;
                  $total = 0;
                  $next = [];
                  foreach ($level as $node) {
                      $total += $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  if ($bestSum === null || $total > $bestSum) { $bestSum = $total; $bestLevel = $depth; }
                  $level = $next;
              }
              return $bestLevel;
          }
        `,
        ruby: code`
          def maxLevelSum(root)
            level = [root]
            depth = 0
            best_level = 1
            best_sum = nil
            until level.empty?
              depth += 1
              total = 0
              nxt = []
              level.each do |node|
                total += node.val
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              if best_sum.nil? || total > best_sum
                best_sum = total
                best_level = depth
              end
              level = nxt
            end
            best_level
          end
        `,
      },
    };
  })(),

  // ── Deepest Leaves Sum (LC 1302) ────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const levels = levelNodes(root);
      return levels.length ? levels[levels.length - 1].reduce((s, n) => s + n.val, 0) : 0;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, null, 6, 7, null, null, null, null, 8], note: "The deepest level holds 7 and 8, so the answer is 15." },
      { root: [6, 7, 8, 2, 7, 1, 3, 9, null, 1, 4, null, null, null, 5], note: "The deepest level holds 9, 1, 4 and 5, which add up to 19." },
      { root: [4], note: "The root is the only (and deepest) leaf." },
    ];
    return {
      slug: "deepest-leaves-sum",
      title: "Deepest Leaves Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "deepestLeavesSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the sum of the values of the leaves that lie on its **deepest** level.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 100"]),
      hints: [
        "Every node on the deepest level is a leaf, so the answer is simply the sum of the last level.",
        "Walk the tree level by level and remember only the sum of the level you just finished.",
        "When a level produces no children, the sum you are holding is the answer.",
      ],
      editorial: explain({
        idea: "The deepest level consists only of leaves, so a level-by-level walk that keeps the sum of the most recent level ends holding the answer.",
        steps: [
          "Start with the level containing only the root.",
          "For each level, add up its values and collect its children as the next level.",
          "When the next level is empty, return the sum of the current one.",
        ],
        why: "A node on the deepest level cannot have children (they would be deeper), so all its nodes are leaves, and every leaf on that level is one of its nodes. The walk ends exactly after processing that level.",
        time: "O(n)",
        space: "O(w), w the widest level",
        pitfalls: [
          "Summing every leaf instead of only the deepest ones.",
          "A depth-first version must reset the running sum whenever it meets a deeper leaf than any seen so far.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deepestLeavesSum(root: Optional[TreeNode]) -> int:
              level = [root]
              while True:
                  total = 0
                  nxt = []
                  for node in level:
                      total += node.val
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  if not nxt:
                      return total
                  level = nxt
        `,
        javascript: code`
          var deepestLeavesSum = function(root) {
              var level = [root];
              for (;;) {
                  var total = 0, next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      total += node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  if (next.length === 0) return total;
                  level = next;
              }
          };
        `,
        typescript: code`
          function deepestLeavesSum(root: TreeNode | null): number {
              var level: TreeNode[] = [root];
              for (;;) {
                  var total = 0;
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      total += node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  if (next.length === 0) return total;
                  level = next;
              }
          }
        `,
        java: code`
          public static int deepestLeavesSum(TreeNode root) {
              List<TreeNode> level = new ArrayList<>();
              level.add(root);
              while (true) {
                  int total = 0;
                  List<TreeNode> next = new ArrayList<>();
                  for (TreeNode node : level) {
                      total += node.val;
                      if (node.left != null) next.add(node.left);
                      if (node.right != null) next.add(node.right);
                  }
                  if (next.isEmpty()) return total;
                  level = next;
              }
          }
        `,
        cpp: code`
          int deepestLeavesSum(TreeNode* root) {
              vector<TreeNode*> level{root};
              while (true) {
                  int total = 0;
                  vector<TreeNode*> next;
                  for (TreeNode* node : level) {
                      total += node->val;
                      if (node->left) next.push_back(node->left);
                      if (node->right) next.push_back(node->right);
                  }
                  if (next.empty()) return total;
                  level.swap(next);
              }
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int deepestLeavesSum(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, total = 0;
              queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  total = 0;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      total += node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
              }
              free(queue);
              return total;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int DeepestLeavesSum(TreeNode root)
          {
              var level = new List<TreeNode> { root };
              while (true)
              {
                  int total = 0;
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      total += node.val;
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  if (next.Count == 0) return total;
                  level = next;
              }
          }
        `,
        go: code`
          func deepestLeavesSum(root *TreeNode) int {
              level := []*TreeNode{root}
              for {
                  total := 0
                  next := []*TreeNode{}
                  for _, node := range level {
                      total += node.Val
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  if len(next) == 0 {
                      return total
                  }
                  level = next
              }
          }
        `,
        kotlin: kt(`
          fun deepestLeavesSum(root: TreeNode?): Int {
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              var total = 0
              while (level.isNotEmpty()) {
                  total = 0
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      total += node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
              }
              return total
          }
        `),
        swift: code`
          func deepestLeavesSum(_ root: TreeNode?) -> Int {
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              var total = 0
              while !level.isEmpty {
                  total = 0
                  var next: [TreeNode] = []
                  for node in level {
                      total += node.val
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return total
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn deepestLeavesSum(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              let mut total = 0;
              while !level.is_empty() {
                  total = 0;
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      total += b.val;
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  level = next;
              }
              total
          }
        `,
        php: code`
          function deepestLeavesSum($root) {
              $level = [$root];
              $total = 0;
              while (count($level) > 0) {
                  $total = 0;
                  $next = [];
                  foreach ($level as $node) {
                      $total += $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $level = $next;
              }
              return $total;
          }
        `,
        ruby: code`
          def deepestLeavesSum(root)
            level = [root]
            total = 0
            until level.empty?
              total = 0
              nxt = []
              level.each do |node|
                total += node.val
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            total
          end
        `,
      },
    };
  })(),

  // ── All Elements in Two Binary Search Trees (LC 1305) ───────────
  (() => {
    const ref = (a: TNode | null, b: TNode | null) => [...inorderOf(a), ...inorderOf(b)].sort((x, y) => x - y);
    const EX = [
      { r1: [2, 1, 4], r2: [1, 0, 3], note: "The first tree holds 1, 2, 4 and the second 0, 1, 3; together, sorted: 0, 1, 1, 2, 3, 4." },
      { r1: [1, null, 8], r2: [8, 1], note: "Values that appear in both trees appear twice in the answer." },
      { r1: [], r2: [5, 1, 7], note: "The first tree is empty, so the answer is just the second tree in order." },
    ];
    return {
      slug: "all-elements-in-two-binary-search-trees",
      title: "All Elements in Two Binary Search Trees",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Sorting", "Meta", "Amazon", "Microsoft"],
      signature: { funcName: "getAllElements", params: [{ name: "root1", type: "TreeNode" as const }, { name: "root2", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the roots `root1` and `root2` of two **binary search trees** (in each, every value in a node's left subtree is smaller than the node's value and every value in its right subtree is larger).\n\nReturn one list holding every value from both trees, sorted in **ascending** order. A value present in both trees appears twice.",
        EX.map((e) => ({ in: `root1 = ${lv(e.r1)}, root2 = ${lv(e.r2)}`, out: fmtIntArr(ref(treeFrom(e.r1), treeFrom(e.r2))), note: e.note })),
        ["0 <= number of nodes in each tree <= 5000", "-10^5 <= Node.val <= 10^5", "each tree is a valid binary search tree"]),
      hints: [
        "An in-order walk of a binary search tree lists its values already sorted.",
        "So you have two sorted lists — you do not need a general sort.",
        "Merge them the way merge sort does: repeatedly take the smaller front element, then append whatever is left.",
      ],
      editorial: explain({
        idea: "In-order traversal turns each BST into a sorted list in linear time, and two sorted lists merge into one in linear time.",
        steps: [
          "Walk each tree in order (left, node, right), appending values to its own list.",
          "Keep an index into each list; while both have elements left, append the smaller front value and advance that index.",
          "Append the rest of whichever list is not exhausted.",
        ],
        why: "The BST property makes every value of the left subtree smaller than the node and every value of the right subtree larger, so in-order output is sorted. The merge always appends the smallest value not yet used, so its output is sorted and contains every value exactly once per occurrence.",
        time: "O(n + m)",
        space: "O(n + m) for the lists, plus O(h) recursion",
        pitfalls: [
          "Concatenating and sorting works but costs O((n + m) log(n + m)); the merge is linear.",
          "Either tree may be empty.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.r1)}\n${lv(e.r2)}`, expectedOutput: fmtIntArr(ref(treeFrom(e.r1), treeFrom(e.r2))) })),
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[-100000, 100000], [0, 50], [-20, 20], [1, 40]]);
        const n1 = rng() < 0.08 ? 0 : sizeOf(rng, [1, 5, 20, 40]);
        const n2 = rng() < 0.08 ? 0 : sizeOf(rng, [1, 5, 20, 40]);
        const a = bstOf(rng, n1, lo, hi), b = bstOf(rng, n2, lo, hi);
        return { input: `${fmtTree(a)}\n${fmtTree(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def getAllElements(root1: Optional[TreeNode], root2: Optional[TreeNode]) -> List[int]:
              def inorder(node, out):
                  if node is None:
                      return
                  inorder(node.left, out)
                  out.append(node.val)
                  inorder(node.right, out)

              a, b = [], []
              inorder(root1, a)
              inorder(root2, b)
              out = []
              i = j = 0
              while i < len(a) and j < len(b):
                  if a[i] <= b[j]:
                      out.append(a[i])
                      i += 1
                  else:
                      out.append(b[j])
                      j += 1
              out.extend(a[i:])
              out.extend(b[j:])
              return out
        `,
        javascript: code`
          var getAllElements = function(root1, root2) {
              var a = [], b = [], out = [];
              inorderInto(root1, a);
              inorderInto(root2, b);
              var i = 0, j = 0;
              while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
              while (i < a.length) out.push(a[i++]);
              while (j < b.length) out.push(b[j++]);
              return out;
          };

          var inorderInto = function(node, out) {
              if (node === null) return;
              inorderInto(node.left, out);
              out.push(node.val);
              inorderInto(node.right, out);
          };
        `,
        typescript: code`
          function getAllElements(root1: TreeNode | null, root2: TreeNode | null): number[] {
              var a: number[] = [], b: number[] = [], out: number[] = [];
              inorderInto(root1, a);
              inorderInto(root2, b);
              var i = 0, j = 0;
              while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
              while (i < a.length) out.push(a[i++]);
              while (j < b.length) out.push(b[j++]);
              return out;
          }

          function inorderInto(node: TreeNode | null, out: number[]): void {
              if (node === null) return;
              inorderInto(node.left, out);
              out.push(node.val);
              inorderInto(node.right, out);
          }
        `,
        java: code`
          public static int[] getAllElements(TreeNode root1, TreeNode root2) {
              List<Integer> a = new ArrayList<>(), b = new ArrayList<>();
              inorderInto(root1, a);
              inorderInto(root2, b);
              int[] out = new int[a.size() + b.size()];
              int i = 0, j = 0, k = 0;
              while (i < a.size() && j < b.size()) out[k++] = a.get(i) <= b.get(j) ? a.get(i++) : b.get(j++);
              while (i < a.size()) out[k++] = a.get(i++);
              while (j < b.size()) out[k++] = b.get(j++);
              return out;
          }

          static void inorderInto(TreeNode node, List<Integer> out) {
              if (node == null) return;
              inorderInto(node.left, out);
              out.add(node.val);
              inorderInto(node.right, out);
          }
        `,
        cpp: code`
          void inorderInto(TreeNode* node, vector<int>& out);

          vector<int> getAllElements(TreeNode* root1, TreeNode* root2) {
              vector<int> a, b, out;
              inorderInto(root1, a);
              inorderInto(root2, b);
              size_t i = 0, j = 0;
              while (i < a.size() && j < b.size()) out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
              while (i < a.size()) out.push_back(a[i++]);
              while (j < b.size()) out.push_back(b[j++]);
              return out;
          }

          void inorderInto(TreeNode* node, vector<int>& out) {
              if (!node) return;
              inorderInto(node->left, out);
              out.push_back(node->val);
              inorderInto(node->right, out);
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void inorderInto(struct TreeNode* node, int* out, int* len);

          int* getAllElements(struct TreeNode* root1, struct TreeNode* root2, int* returnSize) {
              int n1 = countNodes(root1), n2 = countNodes(root2);
              int* a = (int*) malloc((size_t) (n1 + 1) * sizeof(int));
              int* b = (int*) malloc((size_t) (n2 + 1) * sizeof(int));
              int* out = (int*) malloc((size_t) (n1 + n2 + 1) * sizeof(int));
              int la = 0, lb = 0, i = 0, j = 0, k = 0;
              inorderInto(root1, a, &la);
              inorderInto(root2, b, &lb);
              while (i < la && j < lb) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
              while (i < la) out[k++] = a[i++];
              while (j < lb) out[k++] = b[j++];
              free(a);
              free(b);
              *returnSize = k;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void inorderInto(struct TreeNode* node, int* out, int* len) {
              if (node == NULL) return;
              inorderInto(node->left, out, len);
              out[(*len)++] = node->val;
              inorderInto(node->right, out, len);
          }
        `,
        csharp: code`
          public static int[] GetAllElements(TreeNode root1, TreeNode root2)
          {
              var a = new List<int>();
              var b = new List<int>();
              InorderInto(root1, a);
              InorderInto(root2, b);
              var output = new int[a.Count + b.Count];
              int i = 0, j = 0, k = 0;
              while (i < a.Count && j < b.Count) output[k++] = a[i] <= b[j] ? a[i++] : b[j++];
              while (i < a.Count) output[k++] = a[i++];
              while (j < b.Count) output[k++] = b[j++];
              return output;
          }

          static void InorderInto(TreeNode node, List<int> output)
          {
              if (node == null) return;
              InorderInto(node.left, output);
              output.Add(node.val);
              InorderInto(node.right, output);
          }
        `,
        go: code`
          func getAllElements(root1 *TreeNode, root2 *TreeNode) []int {
              a := inorderInto(root1, []int{})
              b := inorderInto(root2, []int{})
              out := make([]int, 0, len(a)+len(b))
              i, j := 0, 0
              for i < len(a) && j < len(b) {
                  if a[i] <= b[j] {
                      out = append(out, a[i])
                      i++
                  } else {
                      out = append(out, b[j])
                      j++
                  }
              }
              out = append(out, a[i:]...)
              out = append(out, b[j:]...)
              return out
          }

          func inorderInto(node *TreeNode, out []int) []int {
              if node == nil {
                  return out
              }
              out = inorderInto(node.Left, out)
              out = append(out, node.Val)
              return inorderInto(node.Right, out)
          }
        `,
        kotlin: kt(`
          fun getAllElements(root1: TreeNode?, root2: TreeNode?): IntArray {
              val a = ArrayList<Int>()
              val b = ArrayList<Int>()
              inorderInto(root1, a)
              inorderInto(root2, b)
              val out = IntArray(a.size + b.size)
              var i = 0
              var j = 0
              var k = 0
              while (i < a.size && j < b.size) {
                  if (a[i] <= b[j]) out[k++] = a[i++] else out[k++] = b[j++]
              }
              while (i < a.size) out[k++] = a[i++]
              while (j < b.size) out[k++] = b[j++]
              return out
          }

          fun inorderInto(node: TreeNode?, out: ArrayList<Int>) {
              if (node == null) return
              inorderInto(node.left, out)
              out.add(node.\`val\`)
              inorderInto(node.right, out)
          }
        `),
        swift: code`
          func getAllElements(_ root1: TreeNode?, _ root2: TreeNode?) -> [Int] {
              var a: [Int] = [], b: [Int] = []
              inorderInto(root1, &a)
              inorderInto(root2, &b)
              var out: [Int] = []
              out.reserveCapacity(a.count + b.count)
              var i = 0, j = 0
              while i < a.count && j < b.count {
                  if a[i] <= b[j] { out.append(a[i]); i += 1 } else { out.append(b[j]); j += 1 }
              }
              out.append(contentsOf: a[i...])
              out.append(contentsOf: b[j...])
              return out
          }

          func inorderInto(_ node: TreeNode?, _ out: inout [Int]) {
              guard let n = node else { return }
              inorderInto(n.left, &out)
              out.append(n.val)
              inorderInto(n.right, &out)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn getAllElements(root1: Option<Rc<RefCell<TreeNode>>>, root2: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut a: Vec<i32> = Vec::new();
              let mut b: Vec<i32> = Vec::new();
              inorder_into(&root1, &mut a);
              inorder_into(&root2, &mut b);
              let mut out: Vec<i32> = Vec::with_capacity(a.len() + b.len());
              let (mut i, mut j) = (0, 0);
              while i < a.len() && j < b.len() {
                  if a[i] <= b[j] {
                      out.push(a[i]);
                      i += 1;
                  } else {
                      out.push(b[j]);
                      j += 1;
                  }
              }
              out.extend_from_slice(&a[i..]);
              out.extend_from_slice(&b[j..]);
              out
          }

          fn inorder_into(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut Vec<i32>) {
              if let Some(rc) = node {
                  let n = rc.borrow();
                  inorder_into(&n.left, out);
                  out.push(n.val);
                  inorder_into(&n.right, out);
              }
          }
        `,
        php: code`
          function getAllElements($root1, $root2) {
              $a = [];
              $b = [];
              inorderInto($root1, $a);
              inorderInto($root2, $b);
              $out = [];
              $i = 0;
              $j = 0;
              $na = count($a);
              $nb = count($b);
              while ($i < $na && $j < $nb) $out[] = $a[$i] <= $b[$j] ? $a[$i++] : $b[$j++];
              while ($i < $na) $out[] = $a[$i++];
              while ($j < $nb) $out[] = $b[$j++];
              return $out;
          }

          function inorderInto($node, &$out) {
              if ($node === null) return;
              inorderInto($node->left, $out);
              $out[] = $node->val;
              inorderInto($node->right, $out);
          }
        `,
        ruby: code`
          def getAllElements(root1, root2)
            a = []
            b = []
            inorder_into(root1, a)
            inorder_into(root2, b)
            out = []
            i = 0
            j = 0
            while i < a.length && j < b.length
              if a[i] <= b[j]
                out << a[i]
                i += 1
              else
                out << b[j]
                j += 1
              end
            end
            out.concat(a[i..-1]).concat(b[j..-1])
          end

          def inorder_into(node, out)
            return if node.nil?
            inorder_into(node.left, out)
            out << node.val
            inorder_into(node.right, out)
          end
        `,
      },
    };
  })(),

  // ── Sum of Nodes with Even-Valued Grandparent (LC 1315) ─────────
  (() => {
    const ref = (root: TNode | null) => {
      let s = 0;
      for (const g of nodesOf(root)) {
        if (g.val % 2 !== 0) continue;
        for (const c of [g.left, g.right]) if (c) for (const gc of [c.left, c.right]) if (gc) s += gc.val;
      }
      return s;
    };
    const EX = [
      { root: [6, 7, 8, 2, 7, 1, 3, 9, null, 1, 4, null, null, null, 5], note: "6 is even, so its grandchildren 2, 7, 1 and 3 count; 8 is even, so its grandchild 5 counts (the even 2 has no grandchildren). Total 2 + 7 + 1 + 3 + 5 = 18." },
      { root: [1], note: "A single node has no grandparent." },
      { root: [2, 4, 6, 8, 10, 12, 14], note: "The even root's four grandchildren add up to 8 + 10 + 12 + 14 = 44." },
    ];
    return {
      slug: "sum-of-nodes-with-even-valued-grandparent",
      title: "Sum of Nodes with Even-Valued Grandparent",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Salesforce", "Amazon"],
      signature: { funcName: "sumEvenGrandparent", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the sum of the values of every node whose **grandparent** (the parent of its parent) has an even value. If no node has an even-valued grandparent, return `0`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 100"]),
      hints: [
        "A node only needs to know two values from above it: its parent's and its grandparent's.",
        "Walk down the tree passing those two values along; a child's grandparent is the current node's parent.",
        "Start the root with a parent and grandparent value that is odd (say 1), so nothing is counted for the top two levels by mistake.",
      ],
      editorial: explain({
        idea: "During a depth-first walk, pass each node its parent's and grandparent's values; add the node when the grandparent's value is even.",
        steps: [
          "Call `walk(root, parent = 1, grandparent = 1)` — 1 is odd, standing for \"no ancestor\".",
          "At a node, start with its own value if `grandparent` is even, else 0.",
          "Add `walk(child, node.val, parent)` for both children and return the total.",
        ],
        why: "Moving one level down shifts the window: the child's parent is the current node and its grandparent is the current node's parent. Every node is visited once and tested against exactly its own grandparent.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Checking the parent's parity instead of the grandparent's.",
          "Using 0 as the \"missing\" value — 0 is even and would count the root's children.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 7, 20, 30, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [2, 10, 100]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sumEvenGrandparent(root: Optional[TreeNode]) -> int:
              def walk(node, parent, grand):
                  if node is None:
                      return 0
                  total = node.val if grand % 2 == 0 else 0
                  return total + walk(node.left, node.val, parent) + walk(node.right, node.val, parent)

              return walk(root, 1, 1)
        `,
        javascript: code`
          var sumEvenGrandparent = function(root) {
              return grandWalk(root, 1, 1);
          };

          var grandWalk = function(node, parent, grand) {
              if (node === null) return 0;
              var total = grand % 2 === 0 ? node.val : 0;
              return total + grandWalk(node.left, node.val, parent) + grandWalk(node.right, node.val, parent);
          };
        `,
        typescript: code`
          function sumEvenGrandparent(root: TreeNode | null): number {
              return grandWalk(root, 1, 1);
          }

          function grandWalk(node: TreeNode | null, parent: number, grand: number): number {
              if (node === null) return 0;
              var total = grand % 2 === 0 ? node.val : 0;
              return total + grandWalk(node.left, node.val, parent) + grandWalk(node.right, node.val, parent);
          }
        `,
        java: code`
          public static int sumEvenGrandparent(TreeNode root) {
              return grandWalk(root, 1, 1);
          }

          static int grandWalk(TreeNode node, int parent, int grand) {
              if (node == null) return 0;
              int total = grand % 2 == 0 ? node.val : 0;
              return total + grandWalk(node.left, node.val, parent) + grandWalk(node.right, node.val, parent);
          }
        `,
        cpp: code`
          int grandWalk(TreeNode* node, int parent, int grand);

          int sumEvenGrandparent(TreeNode* root) {
              return grandWalk(root, 1, 1);
          }

          int grandWalk(TreeNode* node, int parent, int grand) {
              if (!node) return 0;
              int total = grand % 2 == 0 ? node->val : 0;
              return total + grandWalk(node->left, node->val, parent) + grandWalk(node->right, node->val, parent);
          }
        `,
        c: code`
          static int grandWalk(struct TreeNode* node, int parent, int grand);

          int sumEvenGrandparent(struct TreeNode* root) {
              return grandWalk(root, 1, 1);
          }

          static int grandWalk(struct TreeNode* node, int parent, int grand) {
              if (node == NULL) return 0;
              int total = grand % 2 == 0 ? node->val : 0;
              return total + grandWalk(node->left, node->val, parent) + grandWalk(node->right, node->val, parent);
          }
        `,
        csharp: code`
          public static int SumEvenGrandparent(TreeNode root)
          {
              return GrandWalk(root, 1, 1);
          }

          static int GrandWalk(TreeNode node, int parent, int grand)
          {
              if (node == null) return 0;
              int total = grand % 2 == 0 ? node.val : 0;
              return total + GrandWalk(node.left, node.val, parent) + GrandWalk(node.right, node.val, parent);
          }
        `,
        go: code`
          func sumEvenGrandparent(root *TreeNode) int {
              return grandWalk(root, 1, 1)
          }

          func grandWalk(node *TreeNode, parent int, grand int) int {
              if node == nil {
                  return 0
              }
              total := 0
              if grand%2 == 0 {
                  total = node.Val
              }
              return total + grandWalk(node.Left, node.Val, parent) + grandWalk(node.Right, node.Val, parent)
          }
        `,
        kotlin: kt(`
          fun sumEvenGrandparent(root: TreeNode?): Int {
              return grandWalk(root, 1, 1)
          }

          fun grandWalk(node: TreeNode?, parent: Int, grand: Int): Int {
              if (node == null) return 0
              val v = node.\`val\`
              val total = if (grand % 2 == 0) v else 0
              return total + grandWalk(node.left, v, parent) + grandWalk(node.right, v, parent)
          }
        `),
        swift: code`
          func sumEvenGrandparent(_ root: TreeNode?) -> Int {
              return grandWalk(root, 1, 1)
          }

          func grandWalk(_ node: TreeNode?, _ parent: Int, _ grand: Int) -> Int {
              guard let n = node else { return 0 }
              let total = grand % 2 == 0 ? n.val : 0
              return total + grandWalk(n.left, n.val, parent) + grandWalk(n.right, n.val, parent)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sumEvenGrandparent(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              grand_walk(&root, 1, 1)
          }

          fn grand_walk(node: &Option<Rc<RefCell<TreeNode>>>, parent: i32, grand: i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let total = if grand % 2 == 0 { n.val } else { 0 };
                      total + grand_walk(&n.left, n.val, parent) + grand_walk(&n.right, n.val, parent)
                  }
              }
          }
        `,
        php: code`
          function sumEvenGrandparent($root) {
              return grandWalk($root, 1, 1);
          }

          function grandWalk($node, $parent, $grand) {
              if ($node === null) return 0;
              $total = $grand % 2 == 0 ? $node->val : 0;
              return $total + grandWalk($node->left, $node->val, $parent) + grandWalk($node->right, $node->val, $parent);
          }
        `,
        ruby: code`
          def sumEvenGrandparent(root)
            grand_walk(root, 1, 1)
          end

          def grand_walk(node, parent, grand)
            return 0 if node.nil?
            total = grand.even? ? node.val : 0
            total + grand_walk(node.left, node.val, parent) + grand_walk(node.right, node.val, parent)
          end
        `,
      },
    };
  })(),

  // ── Delete Leaves With a Given Value (LC 1325) ──────────────────
  (() => {
    const ref = (root: TNode | null, target: number) => {
      // Brute force: strip one round of matching leaves at a time until a round removes nothing.
      let t = cloneTree(root);
      for (;;) {
        let removed = false;
        const strip = (n: TNode | null): TNode | null => {
          if (!n) return null;
          if (isLeaf(n) && n.val === target) { removed = true; return null; }
          n.left = strip(n.left);
          n.right = strip(n.right);
          return n;
        };
        t = strip(t);
        if (!removed) return t;
      }
    };
    const EX = [
      { root: [1, 2, 3, 2, null, 2, 4], target: 2, note: "The leaves 2 go first; that leaves the left 2 a leaf too, so it goes as well. 1, 3 and 4 remain." },
      { root: [1, 3, 3, 3, 2], target: 3, note: "Only the leaf 3 under the left 3 and the right leaf 3 are removed; the left 3 still has the child 2." },
      { root: [1, 2, null, 2, null, 2], target: 2, note: "The chain of 2s disappears one leaf at a time, leaving just the root." },
      { root: [1, 1, 1], target: 1, note: "Once both leaves go the root is a leaf with the target value, so the whole tree is deleted." },
    ];
    return {
      slug: "delete-leaves-with-a-given-value",
      title: "Delete Leaves With a Given Value",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google"],
      signature: { funcName: "removeLeafNodes", params: [{ name: "root", type: "TreeNode" as const }, { name: "target", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree and an integer `target`, delete every **leaf** (a node with no children) whose value is `target`.\n\nDeleting leaves can turn their parent into a leaf; if that parent's value is also `target`, it must be deleted too. Keep going until no leaf with value `target` remains, and return the root of what is left (the empty tree `[]` if everything was deleted).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, target = ${e.target}`, out: fmtTree(ref(treeFrom(e.root), e.target)), note: e.note })),
        ["1 <= number of nodes <= 3000", "1 <= Node.val, target <= 1000"]),
      hints: [
        "Whether a node becomes a removable leaf depends on what happens to its children first.",
        "So process children before their parent — a post-order walk.",
        "After pruning both subtrees, if the node now has no children and holds `target`, return null in its place; otherwise return the node.",
      ],
      editorial: explain({
        idea: "A post-order walk settles each subtree before looking at its root, so by the time a node is examined its children have already been deleted if they had to be — one pass does all the cascading.",
        steps: [
          "If the node is null, return null.",
          "Replace its left child by the result of processing the left subtree, and the same on the right.",
          "If the node now has no children and its value equals `target`, return null; otherwise return the node.",
          "The value returned for the root is the answer.",
        ],
        why: "When the walk returns from a node, that node's subtree contains no leaf equal to `target`: its children's subtrees were cleaned first, and the node itself is removed exactly when it has become such a leaf. A node that still has a child can never be removed later, because its subtree is final.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Checking a node before its children (pre-order) misses parents that only become leaves afterwards.",
          "The root itself can disappear, giving the empty tree.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.target)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const hi = pick(rng, [1, 2, 2, 3, 3, 1000]);
        const root = shapeTree(rng, n, 1, hi)!;
        const target = rng() < 0.8 ? pick(rng, nodesOf(root)).val : ri(rng, 1, Math.max(hi, 5));
        return { input: `${fmtTree(root)}\n${target}`, expectedOutput: fmtTree(ref(root, target)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def removeLeafNodes(root: Optional[TreeNode], target: int) -> Optional[TreeNode]:
              if root is None:
                  return None
              root.left = removeLeafNodes(root.left, target)
              root.right = removeLeafNodes(root.right, target)
              if root.left is None and root.right is None and root.val == target:
                  return None
              return root
        `,
        javascript: code`
          var removeLeafNodes = function(root, target) {
              if (root === null) return null;
              root.left = removeLeafNodes(root.left, target);
              root.right = removeLeafNodes(root.right, target);
              if (root.left === null && root.right === null && root.val === target) return null;
              return root;
          };
        `,
        typescript: code`
          function removeLeafNodes(root: TreeNode | null, target: number): TreeNode | null {
              if (root === null) return null;
              root.left = removeLeafNodes(root.left, target);
              root.right = removeLeafNodes(root.right, target);
              if (root.left === null && root.right === null && root.val === target) return null;
              return root;
          }
        `,
        java: code`
          public static TreeNode removeLeafNodes(TreeNode root, int target) {
              if (root == null) return null;
              root.left = removeLeafNodes(root.left, target);
              root.right = removeLeafNodes(root.right, target);
              if (root.left == null && root.right == null && root.val == target) return null;
              return root;
          }
        `,
        cpp: code`
          TreeNode* removeLeafNodes(TreeNode* root, int target) {
              if (!root) return nullptr;
              root->left = removeLeafNodes(root->left, target);
              root->right = removeLeafNodes(root->right, target);
              if (!root->left && !root->right && root->val == target) return nullptr;
              return root;
          }
        `,
        c: code`
          struct TreeNode* removeLeafNodes(struct TreeNode* root, int target) {
              if (root == NULL) return NULL;
              root->left = removeLeafNodes(root->left, target);
              root->right = removeLeafNodes(root->right, target);
              if (root->left == NULL && root->right == NULL && root->val == target) return NULL;
              return root;
          }
        `,
        csharp: code`
          public static TreeNode RemoveLeafNodes(TreeNode root, int target)
          {
              if (root == null) return null;
              root.left = RemoveLeafNodes(root.left, target);
              root.right = RemoveLeafNodes(root.right, target);
              if (root.left == null && root.right == null && root.val == target) return null;
              return root;
          }
        `,
        go: code`
          func removeLeafNodes(root *TreeNode, target int) *TreeNode {
              if root == nil {
                  return nil
              }
              root.Left = removeLeafNodes(root.Left, target)
              root.Right = removeLeafNodes(root.Right, target)
              if root.Left == nil && root.Right == nil && root.Val == target {
                  return nil
              }
              return root
          }
        `,
        kotlin: kt(`
          fun removeLeafNodes(root: TreeNode?, target: Int): TreeNode? {
              if (root == null) return null
              root.left = removeLeafNodes(root.left, target)
              root.right = removeLeafNodes(root.right, target)
              if (root.left == null && root.right == null && root.\`val\` == target) return null
              return root
          }
        `),
        swift: code`
          func removeLeafNodes(_ root: TreeNode?, _ target: Int) -> TreeNode? {
              guard let r = root else { return nil }
              r.left = removeLeafNodes(r.left, target)
              r.right = removeLeafNodes(r.right, target)
              if r.left == nil && r.right == nil && r.val == target { return nil }
              return r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn removeLeafNodes(root: Option<Rc<RefCell<TreeNode>>>, target: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let rc = match root {
                  None => return None,
                  Some(rc) => rc,
              };
              let (left, right) = {
                  let mut n = rc.borrow_mut();
                  (n.left.take(), n.right.take())
              };
              let nl = removeLeafNodes(left, target);
              let nr = removeLeafNodes(right, target);
              let gone = nl.is_none() && nr.is_none() && rc.borrow().val == target;
              if gone {
                  return None;
              }
              {
                  let mut n = rc.borrow_mut();
                  n.left = nl;
                  n.right = nr;
              }
              Some(rc)
          }
        `,
        php: code`
          function removeLeafNodes($root, $target) {
              if ($root === null) return null;
              $root->left = removeLeafNodes($root->left, $target);
              $root->right = removeLeafNodes($root->right, $target);
              if ($root->left === null && $root->right === null && $root->val == $target) return null;
              return $root;
          }
        `,
        ruby: code`
          def removeLeafNodes(root, target)
            return nil if root.nil?
            root.left = removeLeafNodes(root.left, target)
            root.right = removeLeafNodes(root.right, target)
            return nil if root.left.nil? && root.right.nil? && root.val == target
            root
          end
        `,
      },
    };
  })(),

  // ── Maximum Product of Splitted Binary Tree (LC 1339) ───────────
  (() => {
    const ref = (root: TNode | null) => {
      const sums: number[] = [];
      const sum = (n: TNode | null): number => { if (!n) return 0; const s = n.val + sum(n.left) + sum(n.right); sums.push(s); return s; };
      const total = sum(root);
      let best = 0n;
      for (const s of sums) { const p = BigInt(s) * BigInt(total - s); if (p > best) best = p; }
      return Number(best % 1000000007n);
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6], note: "Cutting the edge above 2 gives parts summing to 11 (2 + 4 + 5) and 10 (1 + 3 + 6); 11 × 10 = 110 is the largest product." },
      { root: [1, null, 2, 3, 4, null, null, 5, 6], note: "Cutting above 4 splits the total 21 into 15 (4 + 5 + 6) and 6: 15 × 6 = 90." },
      { root: [2, 3], note: "There is one edge: 2 × 3 = 6." },
    ];
    return {
      slug: "maximum-product-of-splitted-binary-tree",
      title: "Maximum Product of Splitted Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maxProduct", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, remove exactly one edge so that the tree falls apart into two subtrees, and make the product of the two subtrees' value sums as large as possible.\n\nReturn that largest product **modulo** `10^9 + 7`. Note that you must maximise the product itself and only then take it modulo `10^9 + 7` — not maximise the remainder.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["2 <= number of nodes <= 5 · 10^4", "1 <= Node.val <= 10^4"]),
      hints: [
        "Cutting the edge above a node separates exactly that node's subtree from the rest.",
        "If the whole tree sums to `T` and the subtree to `s`, the product is `s · (T - s)`. So you need `T` and every subtree sum.",
        "Two walks: one for `T`, then a post-order walk that computes each subtree sum and tracks the best product. The product can exceed 32 bits — use 64-bit arithmetic and reduce modulo only at the end.",
      ],
      editorial: explain({
        idea: "Every cut separates one subtree from the rest, so the candidates are `s · (T - s)` for every subtree sum `s`. Compute the total first, then all subtree sums in one post-order walk.",
        steps: [
          "Compute `T`, the sum of all node values.",
          "Walk the tree in post-order; for each node compute its subtree sum `s = val + left sum + right sum`.",
          "Update the best with `s · (T - s)` in 64-bit arithmetic.",
          "Return `best mod (10^9 + 7)`.",
        ],
        why: "Removing the edge between a node and its parent leaves that node's subtree (sum `s`) and everything else (sum `T - s`); every edge is above exactly one non-root node, so every split is examined. The root's own sum gives the product 0 and never wins.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Taking the modulo before comparing products picks the wrong split.",
          "`T` can reach 5 · 10^8, so the product reaches about 6 · 10^16 — overflow in 32-bit arithmetic, and past exact integers in a JavaScript double: there, choose the split whose `s` is closest to `T / 2` (the product only grows as `s` nears half) and multiply once modulo the prime.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = Math.max(2, sizeOf(rng, [2, 5, 15, 30, 40]));
        const root = shapeTree(rng, n, 1, pick(rng, [10, 100, 10000, 10000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxProduct(root: Optional[TreeNode]) -> int:
              sums = []

              def walk(node):
                  if node is None:
                      return 0
                  s = node.val + walk(node.left) + walk(node.right)
                  sums.append(s)
                  return s

              total = walk(root)
              best = max(s * (total - s) for s in sums)
              return best % 1000000007
        `,
        javascript: code`
          var maxProduct = function(root) {
              var total = sumTree(root);
              var state = { total: total, best: 0 };
              splitWalk(root, state);
              return mulMod(state.best, total - state.best, 1000000007);
          };

          var sumTree = function(node) {
              return node === null ? 0 : node.val + sumTree(node.left) + sumTree(node.right);
          };

          // Keeps the subtree sum closest to total / 2: s * (total - s) grows as s nears half.
          var splitWalk = function(node, state) {
              if (node === null) return 0;
              var s = node.val + splitWalk(node.left, state) + splitWalk(node.right, state);
              if (Math.abs(state.total - 2 * s) < Math.abs(state.total - 2 * state.best)) state.best = s;
              return s;
          };

          var mulMod = function(a, b, m) {
              a %= m;
              b %= m;
              var hi = Math.floor(b / 65536), lo = b % 65536;
              return ((a * hi) % m * 65536 + a * lo) % m;
          };
        `,
        typescript: code`
          function maxProduct(root: TreeNode | null): number {
              var total = sumTree(root);
              var state = { total: total, best: 0 };
              splitWalk(root, state);
              return mulMod(state.best, total - state.best, 1000000007);
          }

          function sumTree(node: TreeNode | null): number {
              return node === null ? 0 : node.val + sumTree(node.left) + sumTree(node.right);
          }

          // Keeps the subtree sum closest to total / 2: s * (total - s) grows as s nears half.
          function splitWalk(node: TreeNode | null, state: { total: number; best: number }): number {
              if (node === null) return 0;
              var s = node.val + splitWalk(node.left, state) + splitWalk(node.right, state);
              if (Math.abs(state.total - 2 * s) < Math.abs(state.total - 2 * state.best)) state.best = s;
              return s;
          }

          function mulMod(a: number, b: number, m: number): number {
              a %= m;
              b %= m;
              var hi = Math.floor(b / 65536), lo = b % 65536;
              return ((a * hi) % m * 65536 + a * lo) % m;
          }
        `,
        java: code`
          public static int maxProduct(TreeNode root) {
              long total = sumTree(root);
              long[] best = {0};
              splitWalk(root, total, best);
              return (int) (best[0] % 1000000007L);
          }

          static long sumTree(TreeNode node) {
              return node == null ? 0 : node.val + sumTree(node.left) + sumTree(node.right);
          }

          static long splitWalk(TreeNode node, long total, long[] best) {
              if (node == null) return 0;
              long s = node.val + splitWalk(node.left, total, best) + splitWalk(node.right, total, best);
              best[0] = Math.max(best[0], s * (total - s));
              return s;
          }
        `,
        cpp: code`
          long long sumTree(TreeNode* node);
          long long splitWalk(TreeNode* node, long long total, long long& best);

          int maxProduct(TreeNode* root) {
              long long total = sumTree(root), best = 0;
              splitWalk(root, total, best);
              return (int) (best % 1000000007LL);
          }

          long long sumTree(TreeNode* node) {
              return node ? node->val + sumTree(node->left) + sumTree(node->right) : 0;
          }

          long long splitWalk(TreeNode* node, long long total, long long& best) {
              if (!node) return 0;
              long long s = node->val + splitWalk(node->left, total, best) + splitWalk(node->right, total, best);
              best = max(best, s * (total - s));
              return s;
          }
        `,
        c: code`
          static long long sumTree(struct TreeNode* node);
          static long long splitWalk(struct TreeNode* node, long long total, long long* best);

          int maxProduct(struct TreeNode* root) {
              long long total = sumTree(root), best = 0;
              splitWalk(root, total, &best);
              return (int) (best % 1000000007LL);
          }

          static long long sumTree(struct TreeNode* node) {
              return node == NULL ? 0 : node->val + sumTree(node->left) + sumTree(node->right);
          }

          static long long splitWalk(struct TreeNode* node, long long total, long long* best) {
              if (node == NULL) return 0;
              long long s = node->val + splitWalk(node->left, total, best) + splitWalk(node->right, total, best);
              if (s * (total - s) > *best) *best = s * (total - s);
              return s;
          }
        `,
        csharp: code`
          public static int MaxProduct(TreeNode root)
          {
              long total = SumTree(root);
              long best = 0;
              SplitWalk(root, total, ref best);
              return (int) (best % 1000000007L);
          }

          static long SumTree(TreeNode node)
          {
              return node == null ? 0 : node.val + SumTree(node.left) + SumTree(node.right);
          }

          static long SplitWalk(TreeNode node, long total, ref long best)
          {
              if (node == null) return 0;
              long s = node.val + SplitWalk(node.left, total, ref best) + SplitWalk(node.right, total, ref best);
              best = Math.Max(best, s * (total - s));
              return s;
          }
        `,
        go: code`
          func maxProduct(root *TreeNode) int {
              var sumTree func(node *TreeNode) int64
              sumTree = func(node *TreeNode) int64 {
                  if node == nil {
                      return 0
                  }
                  return int64(node.Val) + sumTree(node.Left) + sumTree(node.Right)
              }
              total := sumTree(root)
              var best int64
              var walk func(node *TreeNode) int64
              walk = func(node *TreeNode) int64 {
                  if node == nil {
                      return 0
                  }
                  s := int64(node.Val) + walk(node.Left) + walk(node.Right)
                  if s*(total-s) > best {
                      best = s * (total - s)
                  }
                  return s
              }
              walk(root)
              return int(best % 1000000007)
          }
        `,
        kotlin: kt(`
          fun maxProduct(root: TreeNode?): Int {
              val total = sumTree(root)
              val best = LongArray(1)
              splitWalk(root, total, best)
              return (best[0] % 1000000007L).toInt()
          }

          fun sumTree(node: TreeNode?): Long {
              if (node == null) return 0L
              return node.\`val\`.toLong() + sumTree(node.left) + sumTree(node.right)
          }

          fun splitWalk(node: TreeNode?, total: Long, best: LongArray): Long {
              if (node == null) return 0L
              val s = node.\`val\`.toLong() + splitWalk(node.left, total, best) + splitWalk(node.right, total, best)
              if (s * (total - s) > best[0]) best[0] = s * (total - s)
              return s
          }
        `),
        swift: code`
          func maxProduct(_ root: TreeNode?) -> Int {
              let total = sumTree(root)
              var best = 0
              _ = splitWalk(root, total, &best)
              return best % 1000000007
          }

          func sumTree(_ node: TreeNode?) -> Int {
              guard let n = node else { return 0 }
              return n.val + sumTree(n.left) + sumTree(n.right)
          }

          func splitWalk(_ node: TreeNode?, _ total: Int, _ best: inout Int) -> Int {
              guard let n = node else { return 0 }
              let s = n.val + splitWalk(n.left, total, &best) + splitWalk(n.right, total, &best)
              best = max(best, s * (total - s))
              return s
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxProduct(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let total = sum_tree(&root);
              let mut best: i64 = 0;
              split_walk(&root, total, &mut best);
              (best % 1000000007) as i32
          }

          fn sum_tree(node: &Option<Rc<RefCell<TreeNode>>>) -> i64 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      n.val as i64 + sum_tree(&n.left) + sum_tree(&n.right)
                  }
              }
          }

          fn split_walk(node: &Option<Rc<RefCell<TreeNode>>>, total: i64, best: &mut i64) -> i64 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let s = n.val as i64 + split_walk(&n.left, total, best) + split_walk(&n.right, total, best);
                      if s * (total - s) > *best {
                          *best = s * (total - s);
                      }
                      s
                  }
              }
          }
        `,
        php: code`
          function maxProduct($root) {
              $total = sumTree($root);
              $best = 0;
              splitWalk($root, $total, $best);
              return $best % 1000000007;
          }

          function sumTree($node) {
              return $node === null ? 0 : $node->val + sumTree($node->left) + sumTree($node->right);
          }

          function splitWalk($node, $total, &$best) {
              if ($node === null) return 0;
              $s = $node->val + splitWalk($node->left, $total, $best) + splitWalk($node->right, $total, $best);
              if ($s * ($total - $s) > $best) $best = $s * ($total - $s);
              return $s;
          }
        `,
        ruby: code`
          def maxProduct(root)
            total = sum_tree(root)
            best = [0]
            split_walk(root, total, best)
            best[0] % 1_000_000_007
          end

          def sum_tree(node)
            node.nil? ? 0 : node.val + sum_tree(node.left) + sum_tree(node.right)
          end

          def split_walk(node, total, best)
            return 0 if node.nil?
            s = node.val + split_walk(node.left, total, best) + split_walk(node.right, total, best)
            best[0] = s * (total - s) if s * (total - s) > best[0]
            s
          end
        `,
      },
    };
  })(),

  // ── Linked List in Binary Tree (LC 1367) ────────────────────────
  (() => {
    const ref = (head: number[], root: TNode | null) => {
      // Brute force: every downward path is a contiguous piece of some root-to-leaf path.
      const paths: number[][] = [];
      const walk = (n: TNode, path: number[]) => {
        path.push(n.val);
        if (isLeaf(n)) paths.push(path.slice());
        if (n.left) walk(n.left, path);
        if (n.right) walk(n.right, path);
        path.pop();
      };
      if (root) walk(root, []);
      for (const p of paths) {
        for (let i = 0; i + head.length <= p.length; i++) {
          let ok = true;
          for (let j = 0; j < head.length && ok; j++) if (p[i + j] !== head[j]) ok = false;
          if (ok) return true;
        }
      }
      return false;
    };
    const ROOT = [1, 4, 4, null, 2, 2, null, 1, null, 6, 8, null, null, null, null, 1, 3];
    const EX = [
      { head: [4, 2, 8], root: ROOT, note: "The right 4 → its child 2 → that node's child 8 spells 4, 2, 8." },
      { head: [1, 4, 2, 6], root: ROOT, note: "The downward path 1 → 4 → 2 → 6 starts at the root." },
      { head: [1, 4, 2, 6, 8], root: ROOT, note: "6 and 8 are siblings, so no downward path continues from 6 to 8." },
    ];
    return {
      slug: "linked-list-in-binary-tree",
      title: "Linked List in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "isSubPath", params: [{ name: "head", type: "ListNode" as const }, { name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "You are given the `head` of a singly linked list and the `root` of a binary tree.\n\nReturn `true` if the values of the list, from the head onwards, appear in order along some **downward path** of the tree — a path that starts at any node and moves from parent to child at every step — and `false` otherwise.",
        EX.map((e) => ({ in: `head = ${fmtIntArr(e.head)}, root = ${lv(e.root)}`, out: String(ref(e.head, treeFrom(e.root))), note: e.note })),
        ["1 <= number of list nodes <= 100", "1 <= number of tree nodes <= 2500", "1 <= Node.val <= 100"]),
      hints: [
        "The matching path can start at any tree node, so try every node as a starting point.",
        "From a fixed start, matching is a simple recursion: the current tree node must equal the current list value, then either child must match the rest of the list.",
        "Combine the two: `dfs(node)` returns whether a match starts at `node`, or inside its left subtree, or inside its right subtree.",
      ],
      editorial: explain({
        idea: "Try each tree node as the start of the path; from a start, follow the list down the tree, branching to either child at each step.",
        steps: [
          "Read the list into an array `a` of length `m`.",
          "`match(node, i)`: if `i == m` the whole list matched — true. If `node` is null or `node.val != a[i]`, false. Otherwise return `match(node.left, i + 1) or match(node.right, i + 1)`.",
          "`search(node)`: if `node` is null, false; else `match(node, 0) or search(node.left) or search(node.right)`.",
          "Return `search(root)`.",
        ],
        why: "A downward path is fixed by its first node and the left/right choice at each step. `search` reaches every possible first node, and `match` tries both choices at every step while the values agree, so every candidate path is examined and nothing else is accepted.",
        time: "O(n · min(m, h)) — each start explores at most `m` levels",
        space: "O(h) for the recursion",
        pitfalls: [
          "After a mismatch, do not continue the same attempt one node lower — start a fresh attempt from that node instead (that is what `search` does).",
          "Equal values on both children: try both branches, not only the first that matches.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${fmtIntArr(e.head)}\n${lv(e.root)}`, expectedOutput: String(ref(e.head, treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 5, 15, 30, 40]);
        const hi = pick(rng, [1, 2, 3, 100]);
        const root = shapeTree(rng, n, 1, hi)!;
        const len = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        let head: number[];
        if (rng() < 0.6) {
          // A real downward path, sometimes with one value changed.
          head = [];
          let cur: TNode | null = pick(rng, nodesOf(root));
          while (cur && head.length < len) {
            head.push(cur.val);
            const kids: TNode[] = [cur.left, cur.right].filter((c): c is TNode => c !== null);
            cur = kids.length ? pick(rng, kids) : null;
          }
          if (rng() < 0.3) head[ri(rng, 0, head.length - 1)] = ri(rng, 1, hi + 1);
        } else {
          head = Array.from({ length: len }, () => ri(rng, 1, hi));
        }
        return { input: `${fmtIntArr(head)}\n${fmtTree(root)}`, expectedOutput: String(ref(head, root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSubPath(head: Optional[ListNode], root: Optional[TreeNode]) -> bool:
              a = []
              while head:
                  a.append(head.val)
                  head = head.next
              m = len(a)

              def match(node, i):
                  if i == m:
                      return True
                  if node is None or node.val != a[i]:
                      return False
                  return match(node.left, i + 1) or match(node.right, i + 1)

              def search(node):
                  if node is None:
                      return False
                  return match(node, 0) or search(node.left) or search(node.right)

              return search(root)
        `,
        javascript: code`
          var isSubPath = function(head, root) {
              var a = [];
              for (var cur = head; cur !== null; cur = cur.next) a.push(cur.val);
              return searchFrom(root, a);
          };

          var searchFrom = function(node, a) {
              if (node === null) return false;
              return matchFrom(node, a, 0) || searchFrom(node.left, a) || searchFrom(node.right, a);
          };

          var matchFrom = function(node, a, i) {
              if (i === a.length) return true;
              if (node === null || node.val !== a[i]) return false;
              return matchFrom(node.left, a, i + 1) || matchFrom(node.right, a, i + 1);
          };
        `,
        typescript: code`
          function isSubPath(head: ListNode | null, root: TreeNode | null): boolean {
              var a: number[] = [];
              for (var cur = head; cur !== null; cur = cur.next) a.push(cur.val);
              return searchFrom(root, a);
          }

          function searchFrom(node: TreeNode | null, a: number[]): boolean {
              if (node === null) return false;
              return matchFrom(node, a, 0) || searchFrom(node.left, a) || searchFrom(node.right, a);
          }

          function matchFrom(node: TreeNode | null, a: number[], i: number): boolean {
              if (i === a.length) return true;
              if (node === null || node.val !== a[i]) return false;
              return matchFrom(node.left, a, i + 1) || matchFrom(node.right, a, i + 1);
          }
        `,
        java: code`
          public static boolean isSubPath(ListNode head, TreeNode root) {
              List<Integer> list = new ArrayList<>();
              for (ListNode cur = head; cur != null; cur = cur.next) list.add(cur.val);
              int[] a = new int[list.size()];
              for (int i = 0; i < a.length; i++) a[i] = list.get(i);
              return searchFrom(root, a);
          }

          static boolean searchFrom(TreeNode node, int[] a) {
              if (node == null) return false;
              return matchFrom(node, a, 0) || searchFrom(node.left, a) || searchFrom(node.right, a);
          }

          static boolean matchFrom(TreeNode node, int[] a, int i) {
              if (i == a.length) return true;
              if (node == null || node.val != a[i]) return false;
              return matchFrom(node.left, a, i + 1) || matchFrom(node.right, a, i + 1);
          }
        `,
        cpp: code`
          bool searchFrom(TreeNode* node, const vector<int>& a);
          bool matchFrom(TreeNode* node, const vector<int>& a, size_t i);

          bool isSubPath(ListNode* head, TreeNode* root) {
              vector<int> a;
              for (ListNode* cur = head; cur; cur = cur->next) a.push_back(cur->val);
              return searchFrom(root, a);
          }

          bool searchFrom(TreeNode* node, const vector<int>& a) {
              if (!node) return false;
              return matchFrom(node, a, 0) || searchFrom(node->left, a) || searchFrom(node->right, a);
          }

          bool matchFrom(TreeNode* node, const vector<int>& a, size_t i) {
              if (i == a.size()) return true;
              if (!node || node->val != a[i]) return false;
              return matchFrom(node->left, a, i + 1) || matchFrom(node->right, a, i + 1);
          }
        `,
        c: code`
          static bool searchFrom(struct TreeNode* node, int* a, int m);
          static bool matchFrom(struct TreeNode* node, int* a, int m, int i);

          bool isSubPath(struct ListNode* head, struct TreeNode* root) {
              int m = 0;
              for (struct ListNode* cur = head; cur != NULL; cur = cur->next) m++;
              int* a = (int*) malloc((size_t) (m + 1) * sizeof(int));
              int k = 0;
              for (struct ListNode* cur = head; cur != NULL; cur = cur->next) a[k++] = cur->val;
              bool found = searchFrom(root, a, m);
              free(a);
              return found;
          }

          static bool searchFrom(struct TreeNode* node, int* a, int m) {
              if (node == NULL) return false;
              return matchFrom(node, a, m, 0) || searchFrom(node->left, a, m) || searchFrom(node->right, a, m);
          }

          static bool matchFrom(struct TreeNode* node, int* a, int m, int i) {
              if (i == m) return true;
              if (node == NULL || node->val != a[i]) return false;
              return matchFrom(node->left, a, m, i + 1) || matchFrom(node->right, a, m, i + 1);
          }
        `,
        csharp: code`
          public static bool IsSubPath(ListNode head, TreeNode root)
          {
              var a = new List<int>();
              for (var cur = head; cur != null; cur = cur.next) a.Add(cur.val);
              return SearchFrom(root, a);
          }

          static bool SearchFrom(TreeNode node, List<int> a)
          {
              if (node == null) return false;
              return MatchFrom(node, a, 0) || SearchFrom(node.left, a) || SearchFrom(node.right, a);
          }

          static bool MatchFrom(TreeNode node, List<int> a, int i)
          {
              if (i == a.Count) return true;
              if (node == null || node.val != a[i]) return false;
              return MatchFrom(node.left, a, i + 1) || MatchFrom(node.right, a, i + 1);
          }
        `,
        go: code`
          func isSubPath(head *ListNode, root *TreeNode) bool {
              a := []int{}
              for cur := head; cur != nil; cur = cur.Next {
                  a = append(a, cur.Val)
              }
              var match func(node *TreeNode, i int) bool
              match = func(node *TreeNode, i int) bool {
                  if i == len(a) {
                      return true
                  }
                  if node == nil || node.Val != a[i] {
                      return false
                  }
                  return match(node.Left, i+1) || match(node.Right, i+1)
              }
              var search func(node *TreeNode) bool
              search = func(node *TreeNode) bool {
                  if node == nil {
                      return false
                  }
                  return match(node, 0) || search(node.Left) || search(node.Right)
              }
              return search(root)
          }
        `,
        kotlin: kt(`
          fun isSubPath(head: ListNode?, root: TreeNode?): Boolean {
              val a = ArrayList<Int>()
              var cur = head
              while (cur != null) {
                  a.add(cur.\`val\`)
                  cur = cur.next
              }
              return searchFrom(root, a)
          }

          fun searchFrom(node: TreeNode?, a: ArrayList<Int>): Boolean {
              if (node == null) return false
              return matchFrom(node, a, 0) || searchFrom(node.left, a) || searchFrom(node.right, a)
          }

          fun matchFrom(node: TreeNode?, a: ArrayList<Int>, i: Int): Boolean {
              if (i == a.size) return true
              if (node == null || node.\`val\` != a[i]) return false
              return matchFrom(node.left, a, i + 1) || matchFrom(node.right, a, i + 1)
          }
        `),
        swift: code`
          func isSubPath(_ head: ListNode?, _ root: TreeNode?) -> Bool {
              var a: [Int] = []
              var cur = head
              while let c = cur {
                  a.append(c.val)
                  cur = c.next
              }
              return searchFrom(root, a)
          }

          func searchFrom(_ node: TreeNode?, _ a: [Int]) -> Bool {
              guard let n = node else { return false }
              return matchFrom(n, a, 0) || searchFrom(n.left, a) || searchFrom(n.right, a)
          }

          func matchFrom(_ node: TreeNode?, _ a: [Int], _ i: Int) -> Bool {
              if i == a.count { return true }
              guard let n = node, n.val == a[i] else { return false }
              return matchFrom(n.left, a, i + 1) || matchFrom(n.right, a, i + 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSubPath(head: Option<Box<ListNode>>, root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut a: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(node) = cur {
                  a.push(node.val);
                  cur = &node.next;
              }
              search_from(&root, &a)
          }

          fn search_from(node: &Option<Rc<RefCell<TreeNode>>>, a: &Vec<i32>) -> bool {
              match node {
                  None => false,
                  Some(rc) => {
                      if match_from(node, a, 0) {
                          return true;
                      }
                      let n = rc.borrow();
                      search_from(&n.left, a) || search_from(&n.right, a)
                  }
              }
          }

          fn match_from(node: &Option<Rc<RefCell<TreeNode>>>, a: &Vec<i32>, i: usize) -> bool {
              if i == a.len() {
                  return true;
              }
              match node {
                  None => false,
                  Some(rc) => {
                      let n = rc.borrow();
                      if n.val != a[i] {
                          return false;
                      }
                      match_from(&n.left, a, i + 1) || match_from(&n.right, a, i + 1)
                  }
              }
          }
        `,
        php: code`
          function isSubPath($head, $root) {
              $a = [];
              for ($cur = $head; $cur !== null; $cur = $cur->next) $a[] = $cur->val;
              return searchFrom($root, $a);
          }

          function searchFrom($node, &$a) {
              if ($node === null) return false;
              return matchFrom($node, $a, 0) || searchFrom($node->left, $a) || searchFrom($node->right, $a);
          }

          function matchFrom($node, &$a, $i) {
              if ($i == count($a)) return true;
              if ($node === null || $node->val != $a[$i]) return false;
              return matchFrom($node->left, $a, $i + 1) || matchFrom($node->right, $a, $i + 1);
          }
        `,
        ruby: code`
          def isSubPath(head, root)
            a = []
            cur = head
            while cur
              a << cur.val
              cur = cur.next
            end
            search_from(root, a)
          end

          def search_from(node, a)
            return false if node.nil?
            match_from(node, a, 0) || search_from(node.left, a) || search_from(node.right, a)
          end

          def match_from(node, a, i)
            return true if i == a.length
            return false if node.nil? || node.val != a[i]
            match_from(node.left, a, i + 1) || match_from(node.right, a, i + 1)
          end
        `,
      },
    };
  })(),

  // ── Longest ZigZag Path in a Binary Tree (LC 1372) ──────────────
  (() => {
    const ref = (root: TNode | null) => {
      // Brute force: from every node, in both first directions, follow the zigzag as far as it goes.
      let best = 0;
      for (const start of nodesOf(root)) {
        for (const first of ["left", "right"] as const) {
          let cur: TNode | null = start, side: "left" | "right" = first, steps = 0;
          while (cur && cur[side]) { cur = cur[side]; steps++; side = side === "left" ? "right" : "left"; }
          best = Math.max(best, steps);
        }
      }
      return best;
    };
    const EX = [
      { root: [1, null, 1, 1, 1, null, null, 1, 1, null, 1, null, null, null, 1], note: "Starting at the root's right child, the path right → left → right covers 3 edges." },
      { root: [1, 1, 1, null, 1, null, null, 1, 1, null, 1], note: "From the root: left → right → left → right, 4 edges." },
      { root: [1], note: "A single node has a zigzag path of length 0." },
    ];
    return {
      slug: "longest-zigzag-path-in-a-binary-tree",
      title: "Longest ZigZag Path in a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Amazon", "Google", "Meta"],
      signature: { funcName: "longestZigZag", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree. A **zigzag path** starts at any node, first moves to its left or right child, and from then on alternates direction at every step (left, right, left, … or right, left, right, …), stopping whenever the next node in that direction does not exist.\n\nThe length of a zigzag path is the number of edges it uses (a single node has length 0). Return the length of the longest zigzag path in the tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 5 · 10^4", "1 <= Node.val <= 100"]),
      hints: [
        "For each node, the only thing that matters about the path arriving at it is its length and the direction of its last step.",
        "Keep two numbers per node: the longest zigzag ending here whose last move was to the left, and the one whose last move was to the right.",
        "Moving to the left child extends the path that last moved right (`right + 1`) and resets the other to 0; moving to the right child does the mirror. Take the maximum over all nodes.",
      ],
      editorial: explain({
        idea: "A zigzag path ending at a node is determined by its last move. Passing down two lengths — the longest path arriving by a left move and by a right move — lets every node extend the right one in O(1).",
        steps: [
          "Call `walk(root, left = 0, right = 0)`, where `left` is the longest zigzag ending at this node whose last move went left, and `right` likewise.",
          "Record `max(left, right)` in the answer.",
          "For the left child, call `walk(child, right + 1, 0)`: arriving by a left move continues a path whose previous move was right, or starts a new one (length 1 at least, since `right + 1 >= 1`).",
          "For the right child, call `walk(child, 0, left + 1)`.",
        ],
        why: "A zigzag path ending at a left child either is the single edge from its parent or extends a path that reached the parent by a right move — exactly `right + 1`. The `0` passed for the other direction is correct because a path cannot reach a left child by a right move. Every path ends somewhere, so the maximum over nodes covers them all.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Counting nodes instead of edges is off by one.",
          "A path may start anywhere, not only at the root — resetting to 1 on a same-direction step handles that.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [1, 100]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def longestZigZag(root: Optional[TreeNode]) -> int:
              def walk(node, left, right):
                  best = max(left, right)
                  if node.left:
                      best = max(best, walk(node.left, right + 1, 0))
                  if node.right:
                      best = max(best, walk(node.right, 0, left + 1))
                  return best

              return walk(root, 0, 0)
        `,
        javascript: code`
          var longestZigZag = function(root) {
              return zigWalk(root, 0, 0);
          };

          var zigWalk = function(node, left, right) {
              var best = Math.max(left, right);
              if (node.left !== null) best = Math.max(best, zigWalk(node.left, right + 1, 0));
              if (node.right !== null) best = Math.max(best, zigWalk(node.right, 0, left + 1));
              return best;
          };
        `,
        typescript: code`
          function longestZigZag(root: TreeNode | null): number {
              return zigWalk(root, 0, 0);
          }

          function zigWalk(node: TreeNode, left: number, right: number): number {
              var best = Math.max(left, right);
              if (node.left !== null) best = Math.max(best, zigWalk(node.left, right + 1, 0));
              if (node.right !== null) best = Math.max(best, zigWalk(node.right, 0, left + 1));
              return best;
          }
        `,
        java: code`
          public static int longestZigZag(TreeNode root) {
              return zigWalk(root, 0, 0);
          }

          static int zigWalk(TreeNode node, int left, int right) {
              int best = Math.max(left, right);
              if (node.left != null) best = Math.max(best, zigWalk(node.left, right + 1, 0));
              if (node.right != null) best = Math.max(best, zigWalk(node.right, 0, left + 1));
              return best;
          }
        `,
        cpp: code`
          int zigWalk(TreeNode* node, int left, int right);

          int longestZigZag(TreeNode* root) {
              return zigWalk(root, 0, 0);
          }

          int zigWalk(TreeNode* node, int left, int right) {
              int best = max(left, right);
              if (node->left) best = max(best, zigWalk(node->left, right + 1, 0));
              if (node->right) best = max(best, zigWalk(node->right, 0, left + 1));
              return best;
          }
        `,
        c: code`
          static int zigWalk(struct TreeNode* node, int left, int right);

          int longestZigZag(struct TreeNode* root) {
              return zigWalk(root, 0, 0);
          }

          static int zigWalk(struct TreeNode* node, int left, int right) {
              int best = left > right ? left : right;
              if (node->left != NULL) {
                  int t = zigWalk(node->left, right + 1, 0);
                  if (t > best) best = t;
              }
              if (node->right != NULL) {
                  int t = zigWalk(node->right, 0, left + 1);
                  if (t > best) best = t;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LongestZigZag(TreeNode root)
          {
              return ZigWalk(root, 0, 0);
          }

          static int ZigWalk(TreeNode node, int left, int right)
          {
              int best = Math.Max(left, right);
              if (node.left != null) best = Math.Max(best, ZigWalk(node.left, right + 1, 0));
              if (node.right != null) best = Math.Max(best, ZigWalk(node.right, 0, left + 1));
              return best;
          }
        `,
        go: code`
          func longestZigZag(root *TreeNode) int {
              return zigWalk(root, 0, 0)
          }

          func zigWalk(node *TreeNode, left int, right int) int {
              best := left
              if right > best {
                  best = right
              }
              if node.Left != nil {
                  if t := zigWalk(node.Left, right+1, 0); t > best {
                      best = t
                  }
              }
              if node.Right != nil {
                  if t := zigWalk(node.Right, 0, left+1); t > best {
                      best = t
                  }
              }
              return best
          }
        `,
        kotlin: kt(`
          fun longestZigZag(root: TreeNode?): Int {
              return zigWalk(root!!, 0, 0)
          }

          fun zigWalk(node: TreeNode, left: Int, right: Int): Int {
              var best = maxOf(left, right)
              val l = node.left
              val r = node.right
              if (l != null) best = maxOf(best, zigWalk(l, right + 1, 0))
              if (r != null) best = maxOf(best, zigWalk(r, 0, left + 1))
              return best
          }
        `),
        swift: code`
          func longestZigZag(_ root: TreeNode?) -> Int {
              return zigWalk(root!, 0, 0)
          }

          func zigWalk(_ node: TreeNode, _ left: Int, _ right: Int) -> Int {
              var best = max(left, right)
              if let l = node.left { best = max(best, zigWalk(l, right + 1, 0)) }
              if let r = node.right { best = max(best, zigWalk(r, 0, left + 1)) }
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn longestZigZag(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              zig_walk(&root, 0, 0)
          }

          fn zig_walk(node: &Option<Rc<RefCell<TreeNode>>>, left: i32, right: i32) -> i32 {
              let mut best = left.max(right);
              if let Some(rc) = node {
                  let n = rc.borrow();
                  if n.left.is_some() {
                      best = best.max(zig_walk(&n.left, right + 1, 0));
                  }
                  if n.right.is_some() {
                      best = best.max(zig_walk(&n.right, 0, left + 1));
                  }
              }
              best
          }
        `,
        php: code`
          function longestZigZag($root) {
              return zigWalk($root, 0, 0);
          }

          function zigWalk($node, $left, $right) {
              $best = max($left, $right);
              if ($node->left !== null) $best = max($best, zigWalk($node->left, $right + 1, 0));
              if ($node->right !== null) $best = max($best, zigWalk($node->right, 0, $left + 1));
              return $best;
          }
        `,
        ruby: code`
          def longestZigZag(root)
            zig_walk(root, 0, 0)
          end

          def zig_walk(node, left, right)
            best = left > right ? left : right
            if node.left
              t = zig_walk(node.left, right + 1, 0)
              best = t if t > best
            end
            if node.right
              t = zig_walk(node.right, 0, left + 1)
              best = t if t > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Good Nodes in Binary Tree (LC 1448) ───────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const par = parentsOf(root);
      let good = 0;
      for (const n of nodesOf(root)) {
        let ok = true;
        for (let p = par.get(n); p; p = par.get(p)) if (p.val > n.val) ok = false;
        if (ok) good++;
      }
      return good;
    };
    const EX = [
      { root: [3, 1, 4, 3, null, 1, 5], note: "The good nodes are the root 3, 4, 5 (above 3 and 4) and the left 3 (nothing above it is larger than 3)." },
      { root: [3, 3, null, 4, 2], note: "3, its child 3 and 4 are good; 2 has the larger 3 above it." },
      { root: [1], note: "The root is always good." },
    ];
    return {
      slug: "count-good-nodes-in-binary-tree",
      title: "Count Good Nodes in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Microsoft", "Amazon", "Google", "Meta"],
      signature: { funcName: "goodNodes", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, call a node **good** if no node on the path from the root down to it has a value larger than its own.\n\nReturn the number of good nodes in the tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "-10^4 <= Node.val <= 10^4"]),
      hints: [
        "A node is good exactly when its value is at least the maximum of all values above it.",
        "So walk down the tree carrying the largest value seen on the current path.",
        "Count the node if its value is at least that maximum, then pass `max(maximum, node.val)` to its children.",
      ],
      editorial: explain({
        idea: "Carry the maximum value of the path from the root during a depth-first walk; a node is good when it is not smaller than that maximum.",
        steps: [
          "Call `walk(root, root.val)`.",
          "At a node: it is good if `node.val >= maxSoFar`; set `maxSoFar = max(maxSoFar, node.val)`.",
          "Return 1 (if good) plus the counts from both children with the updated maximum.",
        ],
        why: "The path from the root to a node is the path to its parent plus the node itself, so the maximum above a child is the parent's maximum updated with the parent's value — exactly what is passed down. Comparing against it checks the definition directly.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Equal values do not break goodness: compare with `>=`.",
          "Starting the maximum at 0 is wrong when values are negative — start with the root's value.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[-10000, 10000], [1, 5], [-3, 3], [0, 100]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def goodNodes(root: Optional[TreeNode]) -> int:
              def walk(node, top):
                  if node is None:
                      return 0
                  good = 1 if node.val >= top else 0
                  top = max(top, node.val)
                  return good + walk(node.left, top) + walk(node.right, top)

              return walk(root, root.val)
        `,
        javascript: code`
          var goodNodes = function(root) {
              return goodWalk(root, root.val);
          };

          var goodWalk = function(node, top) {
              if (node === null) return 0;
              var good = node.val >= top ? 1 : 0;
              top = Math.max(top, node.val);
              return good + goodWalk(node.left, top) + goodWalk(node.right, top);
          };
        `,
        typescript: code`
          function goodNodes(root: TreeNode | null): number {
              return goodWalk(root, root.val);
          }

          function goodWalk(node: TreeNode | null, top: number): number {
              if (node === null) return 0;
              var good = node.val >= top ? 1 : 0;
              top = Math.max(top, node.val);
              return good + goodWalk(node.left, top) + goodWalk(node.right, top);
          }
        `,
        java: code`
          public static int goodNodes(TreeNode root) {
              return goodWalk(root, root.val);
          }

          static int goodWalk(TreeNode node, int top) {
              if (node == null) return 0;
              int good = node.val >= top ? 1 : 0;
              top = Math.max(top, node.val);
              return good + goodWalk(node.left, top) + goodWalk(node.right, top);
          }
        `,
        cpp: code`
          int goodWalk(TreeNode* node, int top);

          int goodNodes(TreeNode* root) {
              return goodWalk(root, root->val);
          }

          int goodWalk(TreeNode* node, int top) {
              if (!node) return 0;
              int good = node->val >= top ? 1 : 0;
              top = max(top, node->val);
              return good + goodWalk(node->left, top) + goodWalk(node->right, top);
          }
        `,
        c: code`
          static int goodWalk(struct TreeNode* node, int top);

          int goodNodes(struct TreeNode* root) {
              return goodWalk(root, root->val);
          }

          static int goodWalk(struct TreeNode* node, int top) {
              if (node == NULL) return 0;
              int good = node->val >= top ? 1 : 0;
              if (node->val > top) top = node->val;
              return good + goodWalk(node->left, top) + goodWalk(node->right, top);
          }
        `,
        csharp: code`
          public static int GoodNodes(TreeNode root)
          {
              return GoodWalk(root, root.val);
          }

          static int GoodWalk(TreeNode node, int top)
          {
              if (node == null) return 0;
              int good = node.val >= top ? 1 : 0;
              top = Math.Max(top, node.val);
              return good + GoodWalk(node.left, top) + GoodWalk(node.right, top);
          }
        `,
        go: code`
          func goodNodes(root *TreeNode) int {
              return goodWalk(root, root.Val)
          }

          func goodWalk(node *TreeNode, top int) int {
              if node == nil {
                  return 0
              }
              good := 0
              if node.Val >= top {
                  good = 1
                  top = node.Val
              }
              return good + goodWalk(node.Left, top) + goodWalk(node.Right, top)
          }
        `,
        kotlin: kt(`
          fun goodNodes(root: TreeNode?): Int {
              return goodWalk(root, root!!.\`val\`)
          }

          fun goodWalk(node: TreeNode?, top: Int): Int {
              if (node == null) return 0
              val v = node.\`val\`
              val good = if (v >= top) 1 else 0
              val next = maxOf(top, v)
              return good + goodWalk(node.left, next) + goodWalk(node.right, next)
          }
        `),
        swift: code`
          func goodNodes(_ root: TreeNode?) -> Int {
              return goodWalk(root, root!.val)
          }

          func goodWalk(_ node: TreeNode?, _ top: Int) -> Int {
              guard let n = node else { return 0 }
              let good = n.val >= top ? 1 : 0
              let next = max(top, n.val)
              return good + goodWalk(n.left, next) + goodWalk(n.right, next)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn goodNodes(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let v = root.as_ref().unwrap().borrow().val;
              good_walk(&root, v)
          }

          fn good_walk(node: &Option<Rc<RefCell<TreeNode>>>, top: i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let good = if n.val >= top { 1 } else { 0 };
                      let next = top.max(n.val);
                      good + good_walk(&n.left, next) + good_walk(&n.right, next)
                  }
              }
          }
        `,
        php: code`
          function goodNodes($root) {
              return goodWalk($root, $root->val);
          }

          function goodWalk($node, $top) {
              if ($node === null) return 0;
              $good = $node->val >= $top ? 1 : 0;
              $top = max($top, $node->val);
              return $good + goodWalk($node->left, $top) + goodWalk($node->right, $top);
          }
        `,
        ruby: code`
          def goodNodes(root)
            good_walk(root, root.val)
          end

          def good_walk(node, top)
            return 0 if node.nil?
            good = node.val >= top ? 1 : 0
            top = node.val if node.val > top
            good + good_walk(node.left, top) + good_walk(node.right, top)
          end
        `,
      },
    };
  })(),

  // ── Pseudo-Palindromic Paths in a Binary Tree (LC 1457) ─────────
  (() => {
    const ref = (root: TNode | null) => {
      let count = 0;
      const walk = (n: TNode, path: number[]) => {
        path.push(n.val);
        if (isLeaf(n)) {
          const c = new Map<number, number>();
          for (const v of path) c.set(v, (c.get(v) || 0) + 1);
          if ([...c.values()].filter((k) => k % 2 === 1).length <= 1) count++;
        }
        if (n.left) walk(n.left, path);
        if (n.right) walk(n.right, path);
        path.pop();
      };
      if (root) walk(root, []);
      return count;
    };
    const EX = [
      { root: [2, 3, 1, 3, 1, null, 1], note: "The paths are 2-3-3, 2-3-1 and 2-1-1. 2-3-3 can become 3-2-3 and 2-1-1 can become 1-2-1; 2-3-1 cannot be rearranged into a palindrome." },
      { root: [2, 1, 1, 1, 3, null, null, null, null, null, 1], note: "Of the paths 2-1-1, 2-1-3-1 and 2-1, only 2-1-1 (as 1-2-1) works." },
      { root: [9], note: "A single digit is a palindrome." },
    ];
    return {
      slug: "pseudo-palindromic-paths-in-a-binary-tree",
      title: "Pseudo-Palindromic Paths in a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Bit Manipulation", "Amazon", "Google"],
      signature: { funcName: "pseudoPalindromicPaths", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are digits from `1` to `9`.\n\nA root-to-leaf path is **pseudo-palindromic** if its values can be rearranged into a palindrome (a sequence that reads the same forwards and backwards). Return the number of pseudo-palindromic paths from the root to a leaf.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 9"]),
      hints: [
        "A multiset of digits can be arranged into a palindrome exactly when at most one digit appears an odd number of times.",
        "So along a path you only need each digit's count parity — nine bits.",
        "Toggle bit `val` on the way down; at a leaf the path qualifies when the mask has at most one set bit, i.e. `mask & (mask - 1) == 0`.",
      ],
      editorial: explain({
        idea: "Track, for each digit, whether it has appeared an odd number of times on the current path, as one bitmask. A path is pseudo-palindromic when at most one bit is set at its leaf.",
        steps: [
          "Walk depth-first from the root with `mask = 0`.",
          "At each node flip bit `node.val`: `mask ^= 1 << node.val`.",
          "At a leaf, count the path if `mask & (mask - 1) == 0` (zero or one bit set).",
          "Otherwise continue into both children with the current mask and add their counts.",
        ],
        why: "A palindrome pairs up equal values around the centre, so every value appears an even number of times except possibly one (the centre). Conversely, with at most one odd count the pairs can be placed symmetrically and the odd one in the middle. Flipping a bit per occurrence records exactly the parity of each count.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Only root-to-leaf paths count — do not test the mask at inner nodes.",
          "Pass the mask by value (or undo the flip when returning); a shared mask leaks between branches.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [2, 3, 9]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def pseudoPalindromicPaths(root: Optional[TreeNode]) -> int:
              def walk(node, mask):
                  mask ^= 1 << node.val
                  if node.left is None and node.right is None:
                      return 1 if mask & (mask - 1) == 0 else 0
                  total = 0
                  if node.left:
                      total += walk(node.left, mask)
                  if node.right:
                      total += walk(node.right, mask)
                  return total

              return walk(root, 0)
        `,
        javascript: code`
          var pseudoPalindromicPaths = function(root) {
              return palWalk(root, 0);
          };

          var palWalk = function(node, mask) {
              mask ^= 1 << node.val;
              if (node.left === null && node.right === null) return (mask & (mask - 1)) === 0 ? 1 : 0;
              var total = 0;
              if (node.left !== null) total += palWalk(node.left, mask);
              if (node.right !== null) total += palWalk(node.right, mask);
              return total;
          };
        `,
        typescript: code`
          function pseudoPalindromicPaths(root: TreeNode | null): number {
              return palWalk(root, 0);
          }

          function palWalk(node: TreeNode, mask: number): number {
              mask ^= 1 << node.val;
              if (node.left === null && node.right === null) return (mask & (mask - 1)) === 0 ? 1 : 0;
              var total = 0;
              if (node.left !== null) total += palWalk(node.left, mask);
              if (node.right !== null) total += palWalk(node.right, mask);
              return total;
          }
        `,
        java: code`
          public static int pseudoPalindromicPaths(TreeNode root) {
              return palWalk(root, 0);
          }

          static int palWalk(TreeNode node, int mask) {
              mask ^= 1 << node.val;
              if (node.left == null && node.right == null) return (mask & (mask - 1)) == 0 ? 1 : 0;
              int total = 0;
              if (node.left != null) total += palWalk(node.left, mask);
              if (node.right != null) total += palWalk(node.right, mask);
              return total;
          }
        `,
        cpp: code`
          int palWalk(TreeNode* node, int mask);

          int pseudoPalindromicPaths(TreeNode* root) {
              return palWalk(root, 0);
          }

          int palWalk(TreeNode* node, int mask) {
              mask ^= 1 << node->val;
              if (!node->left && !node->right) return (mask & (mask - 1)) == 0 ? 1 : 0;
              int total = 0;
              if (node->left) total += palWalk(node->left, mask);
              if (node->right) total += palWalk(node->right, mask);
              return total;
          }
        `,
        c: code`
          static int palWalk(struct TreeNode* node, int mask);

          int pseudoPalindromicPaths(struct TreeNode* root) {
              return palWalk(root, 0);
          }

          static int palWalk(struct TreeNode* node, int mask) {
              mask ^= 1 << node->val;
              if (node->left == NULL && node->right == NULL) return (mask & (mask - 1)) == 0 ? 1 : 0;
              int total = 0;
              if (node->left != NULL) total += palWalk(node->left, mask);
              if (node->right != NULL) total += palWalk(node->right, mask);
              return total;
          }
        `,
        csharp: code`
          public static int PseudoPalindromicPaths(TreeNode root)
          {
              return PalWalk(root, 0);
          }

          static int PalWalk(TreeNode node, int mask)
          {
              mask ^= 1 << node.val;
              if (node.left == null && node.right == null) return (mask & (mask - 1)) == 0 ? 1 : 0;
              int total = 0;
              if (node.left != null) total += PalWalk(node.left, mask);
              if (node.right != null) total += PalWalk(node.right, mask);
              return total;
          }
        `,
        go: code`
          func pseudoPalindromicPaths(root *TreeNode) int {
              return palWalk(root, 0)
          }

          func palWalk(node *TreeNode, mask int) int {
              mask ^= 1 << uint(node.Val)
              if node.Left == nil && node.Right == nil {
                  if mask&(mask-1) == 0 {
                      return 1
                  }
                  return 0
              }
              total := 0
              if node.Left != nil {
                  total += palWalk(node.Left, mask)
              }
              if node.Right != nil {
                  total += palWalk(node.Right, mask)
              }
              return total
          }
        `,
        kotlin: kt(`
          fun pseudoPalindromicPaths(root: TreeNode?): Int {
              return palWalk(root!!, 0)
          }

          fun palWalk(node: TreeNode, before: Int): Int {
              val mask = before xor (1 shl node.\`val\`)
              val l = node.left
              val r = node.right
              if (l == null && r == null) return if (mask and (mask - 1) == 0) 1 else 0
              var total = 0
              if (l != null) total += palWalk(l, mask)
              if (r != null) total += palWalk(r, mask)
              return total
          }
        `),
        swift: code`
          func pseudoPalindromicPaths(_ root: TreeNode?) -> Int {
              return palWalk(root!, 0)
          }

          func palWalk(_ node: TreeNode, _ before: Int) -> Int {
              let mask = before ^ (1 << node.val)
              if node.left == nil && node.right == nil { return mask & (mask - 1) == 0 ? 1 : 0 }
              var total = 0
              if let l = node.left { total += palWalk(l, mask) }
              if let r = node.right { total += palWalk(r, mask) }
              return total
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn pseudoPalindromicPaths(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              match root {
                  None => 0,
                  Some(rc) => pal_walk(&rc, 0),
              }
          }

          fn pal_walk(rc: &Rc<RefCell<TreeNode>>, before: i32) -> i32 {
              let n = rc.borrow();
              let mask = before ^ (1 << n.val);
              if n.left.is_none() && n.right.is_none() {
                  return if mask & (mask - 1) == 0 { 1 } else { 0 };
              }
              let mut total = 0;
              if let Some(l) = &n.left {
                  total += pal_walk(l, mask);
              }
              if let Some(r) = &n.right {
                  total += pal_walk(r, mask);
              }
              total
          }
        `,
        php: code`
          function pseudoPalindromicPaths($root) {
              return palWalk($root, 0);
          }

          function palWalk($node, $mask) {
              $mask ^= 1 << $node->val;
              if ($node->left === null && $node->right === null) return ($mask & ($mask - 1)) == 0 ? 1 : 0;
              $total = 0;
              if ($node->left !== null) $total += palWalk($node->left, $mask);
              if ($node->right !== null) $total += palWalk($node->right, $mask);
              return $total;
          }
        `,
        ruby: code`
          def pseudoPalindromicPaths(root)
            pal_walk(root, 0)
          end

          def pal_walk(node, mask)
            mask ^= 1 << node.val
            return (mask & (mask - 1)).zero? ? 1 : 0 if node.left.nil? && node.right.nil?
            total = 0
            total += pal_walk(node.left, mask) if node.left
            total += pal_walk(node.right, mask) if node.right
            total
          end
        `,
      },
    };
  })(),

  // ── Number of Good Leaf Nodes Pairs (LC 1530) ───────────────────
  (() => {
    const ref = (root: TNode | null, distance: number) => {
      // Brute force: every pair of leaves, measured by climbing to their lowest common ancestor.
      const par = parentsOf(root);
      const depth = new Map<TNode, number>();
      for (const n of nodesOf(root)) { const p = par.get(n); depth.set(n, p ? depth.get(p)! + 1 : 0); }
      const leaves = nodesOf(root).filter(isLeaf);
      let count = 0;
      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          let a: TNode = leaves[i], b: TNode = leaves[j], d = 0;
          while (depth.get(a)! > depth.get(b)!) { a = par.get(a)!; d++; }
          while (depth.get(b)! > depth.get(a)!) { b = par.get(b)!; d++; }
          while (a !== b) { a = par.get(a)!; b = par.get(b)!; d += 2; }
          if (d <= distance) count++;
        }
      }
      return count;
    };
    const EX = [
      { root: [1, 2, 3, null, 4], distance: 3, note: "The leaves 4 and 3 are joined by the path 4-2-1-3 of length 3, which is within the distance." },
      { root: [1, 2, 3, 4, 5, 6, 7], distance: 3, note: "The pairs [4,5] and [6,7] are 2 apart; every pair across the root is 4 apart, too far." },
      { root: [7, 1, 4, 6, null, 5, 3, null, null, null, null, null, 2], distance: 3, note: "Only the pair [2,5] is close enough (2-3-4-5, length 3)." },
    ];
    return {
      slug: "number-of-good-leaf-nodes-pairs",
      title: "Number of Good Leaf Nodes Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "countPairs", params: [{ name: "root", type: "TreeNode" as const }, { name: "distance", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree and an integer `distance`. A pair of two different **leaves** (nodes with no children) is **good** if the shortest path between them has at most `distance` edges.\n\nReturn the number of good leaf pairs. Each unordered pair counts once.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, distance = ${e.distance}`, out: String(ref(treeFrom(e.root), e.distance)), note: e.note })),
        ["1 <= number of nodes <= 2^10", "1 <= Node.val <= 100", "1 <= distance <= 10"]),
      hints: [
        "The shortest path between two leaves goes up to their lowest common ancestor and back down — so count each pair at that ancestor.",
        "For each node, compute how many leaves of its subtree lie at each depth `1, 2, …, distance` below it; deeper leaves can never be in a good pair through it or above.",
        "At a node, pair every leaf at depth `i` in the left subtree with every leaf at depth `j` in the right subtree when `i + j <= distance`. Then shift both lists by one to hand them to the parent.",
      ],
      editorial: explain({
        idea: "Count every good pair at its lowest common ancestor. Each node returns a histogram of its leaves' distances (only up to `distance` matters), and pairs one side's histogram against the other's.",
        steps: [
          "`walk(node)` returns an array `cnt` where `cnt[d]` is the number of leaves `d` edges below `node`, for `0 <= d <= distance`.",
          "A leaf returns `cnt[0] = 1`.",
          "Otherwise get `L` and `R` from the children (all zero for a missing child). For every `i`, `j` with `(i + 1) + (j + 1) <= distance`, add `L[i] · R[j]` to the answer.",
          "Return `cnt[d] = L[d - 1] + R[d - 1]` for `d = 1 … distance`.",
        ],
        why: "Two leaves in different subtrees of a node have that node as their lowest common ancestor, and their distance is their two depths below it. Every pair of leaves has exactly one lowest common ancestor, where it falls in different subtrees, so every pair is counted exactly once. Leaves deeper than `distance` below a node cannot form a good pair through it or any ancestor, so the histogram can be cut there.",
        time: "O(n · distance^2)",
        space: "O(h · distance)",
        pitfalls: [
          "Counting a leaf at depth 0 in its own node's pairing step — the leaf's own array only matters to its parent.",
          "Adding 1 for the edge from each child: the distance between leaves at depths `i` and `j` below the children is `i + j + 2`.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.distance}`, expectedOutput: String(ref(treeFrom(e.root), e.distance)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 8, 20, 30, 40]);
        const root = shapeTree(rng, n, 1, 100);
        const distance = ri(rng, 1, pick(rng, [3, 6, 10]));
        return { input: `${fmtTree(root)}\n${distance}`, expectedOutput: String(ref(root, distance)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def countPairs(root: Optional[TreeNode], distance: int) -> int:
              total = 0

              def walk(node):
                  nonlocal total
                  cnt = [0] * (distance + 1)
                  if node is None:
                      return cnt
                  if node.left is None and node.right is None:
                      cnt[0] = 1
                      return cnt
                  left = walk(node.left)
                  right = walk(node.right)
                  for i in range(distance):
                      if left[i]:
                          for j in range(distance - 1 - i):
                              total += left[i] * right[j]
                  for d in range(1, distance + 1):
                      cnt[d] = left[d - 1] + right[d - 1]
                  return cnt

              walk(root)
              return total
        `,
        javascript: code`
          var countPairs = function(root, distance) {
              var state = { total: 0 };
              pairWalk(root, distance, state);
              return state.total;
          };

          var pairWalk = function(node, distance, state) {
              var cnt = new Array(distance + 1).fill(0);
              if (node === null) return cnt;
              if (node.left === null && node.right === null) { cnt[0] = 1; return cnt; }
              var left = pairWalk(node.left, distance, state);
              var right = pairWalk(node.right, distance, state);
              for (var i = 0; i < distance; i++)
                  for (var j = 0; i + j + 2 <= distance; j++) state.total += left[i] * right[j];
              for (var d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
              return cnt;
          };
        `,
        typescript: code`
          function countPairs(root: TreeNode | null, distance: number): number {
              var state = { total: 0 };
              pairWalk(root, distance, state);
              return state.total;
          }

          function pairWalk(node: TreeNode | null, distance: number, state: { total: number }): number[] {
              var cnt: number[] = [];
              for (var k = 0; k <= distance; k++) cnt.push(0);
              if (node === null) return cnt;
              if (node.left === null && node.right === null) { cnt[0] = 1; return cnt; }
              var left = pairWalk(node.left, distance, state);
              var right = pairWalk(node.right, distance, state);
              for (var i = 0; i < distance; i++)
                  for (var j = 0; i + j + 2 <= distance; j++) state.total += left[i] * right[j];
              for (var d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
              return cnt;
          }
        `,
        java: code`
          public static int countPairs(TreeNode root, int distance) {
              int[] total = new int[1];
              pairWalk(root, distance, total);
              return total[0];
          }

          static int[] pairWalk(TreeNode node, int distance, int[] total) {
              int[] cnt = new int[distance + 1];
              if (node == null) return cnt;
              if (node.left == null && node.right == null) { cnt[0] = 1; return cnt; }
              int[] left = pairWalk(node.left, distance, total);
              int[] right = pairWalk(node.right, distance, total);
              for (int i = 0; i < distance; i++)
                  for (int j = 0; i + j + 2 <= distance; j++) total[0] += left[i] * right[j];
              for (int d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
              return cnt;
          }
        `,
        cpp: code`
          vector<int> pairWalk(TreeNode* node, int distance, int& total);

          int countPairs(TreeNode* root, int distance) {
              int total = 0;
              pairWalk(root, distance, total);
              return total;
          }

          vector<int> pairWalk(TreeNode* node, int distance, int& total) {
              vector<int> cnt(distance + 1, 0);
              if (!node) return cnt;
              if (!node->left && !node->right) { cnt[0] = 1; return cnt; }
              vector<int> left = pairWalk(node->left, distance, total);
              vector<int> right = pairWalk(node->right, distance, total);
              for (int i = 0; i < distance; i++)
                  for (int j = 0; i + j + 2 <= distance; j++) total += left[i] * right[j];
              for (int d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
              return cnt;
          }
        `,
        c: code`
          static void pairWalk(struct TreeNode* node, int distance, int* cnt, int* total);

          int countPairs(struct TreeNode* root, int distance) {
              int total = 0;
              int cnt[12];
              pairWalk(root, distance, cnt, &total);
              return total;
          }

          /* cnt[d] (d <= distance <= 10) = leaves d edges below node. */
          static void pairWalk(struct TreeNode* node, int distance, int* cnt, int* total) {
              int left[12], right[12];
              for (int d = 0; d <= distance; d++) cnt[d] = 0;
              if (node == NULL) return;
              if (node->left == NULL && node->right == NULL) { cnt[0] = 1; return; }
              pairWalk(node->left, distance, left, total);
              pairWalk(node->right, distance, right, total);
              for (int i = 0; i < distance; i++)
                  for (int j = 0; i + j + 2 <= distance; j++) *total += left[i] * right[j];
              for (int d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
          }
        `,
        csharp: code`
          public static int CountPairs(TreeNode root, int distance)
          {
              int total = 0;
              PairWalk(root, distance, ref total);
              return total;
          }

          static int[] PairWalk(TreeNode node, int distance, ref int total)
          {
              var cnt = new int[distance + 1];
              if (node == null) return cnt;
              if (node.left == null && node.right == null) { cnt[0] = 1; return cnt; }
              var left = PairWalk(node.left, distance, ref total);
              var right = PairWalk(node.right, distance, ref total);
              for (int i = 0; i < distance; i++)
                  for (int j = 0; i + j + 2 <= distance; j++) total += left[i] * right[j];
              for (int d = 1; d <= distance; d++) cnt[d] = left[d - 1] + right[d - 1];
              return cnt;
          }
        `,
        go: code`
          func countPairs(root *TreeNode, distance int) int {
              total := 0
              var walk func(node *TreeNode) []int
              walk = func(node *TreeNode) []int {
                  cnt := make([]int, distance+1)
                  if node == nil {
                      return cnt
                  }
                  if node.Left == nil && node.Right == nil {
                      cnt[0] = 1
                      return cnt
                  }
                  left := walk(node.Left)
                  right := walk(node.Right)
                  for i := 0; i < distance; i++ {
                      for j := 0; i+j+2 <= distance; j++ {
                          total += left[i] * right[j]
                      }
                  }
                  for d := 1; d <= distance; d++ {
                      cnt[d] = left[d-1] + right[d-1]
                  }
                  return cnt
              }
              walk(root)
              return total
          }
        `,
        kotlin: kt(`
          fun countPairs(root: TreeNode?, distance: Int): Int {
              val total = IntArray(1)
              pairWalk(root, distance, total)
              return total[0]
          }

          fun pairWalk(node: TreeNode?, distance: Int, total: IntArray): IntArray {
              val cnt = IntArray(distance + 1)
              if (node == null) return cnt
              if (node.left == null && node.right == null) {
                  cnt[0] = 1
                  return cnt
              }
              val left = pairWalk(node.left, distance, total)
              val right = pairWalk(node.right, distance, total)
              for (i in 0 until distance) {
                  var j = 0
                  while (i + j + 2 <= distance) {
                      total[0] += left[i] * right[j]
                      j++
                  }
              }
              for (d in 1..distance) cnt[d] = left[d - 1] + right[d - 1]
              return cnt
          }
        `),
        swift: code`
          func countPairs(_ root: TreeNode?, _ distance: Int) -> Int {
              var total = 0
              _ = pairWalk(root, distance, &total)
              return total
          }

          func pairWalk(_ node: TreeNode?, _ distance: Int, _ total: inout Int) -> [Int] {
              var cnt = [Int](repeating: 0, count: distance + 1)
              guard let n = node else { return cnt }
              if n.left == nil && n.right == nil {
                  cnt[0] = 1
                  return cnt
              }
              let left = pairWalk(n.left, distance, &total)
              let right = pairWalk(n.right, distance, &total)
              for i in 0..<distance {
                  var j = 0
                  while i + j + 2 <= distance {
                      total += left[i] * right[j]
                      j += 1
                  }
              }
              for d in stride(from: 1, through: distance, by: 1) { cnt[d] = left[d - 1] + right[d - 1] }
              return cnt
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn countPairs(root: Option<Rc<RefCell<TreeNode>>>, distance: i32) -> i32 {
              let mut total = 0;
              pair_walk(&root, distance as usize, &mut total);
              total
          }

          fn pair_walk(node: &Option<Rc<RefCell<TreeNode>>>, distance: usize, total: &mut i32) -> Vec<i32> {
              let mut cnt = vec![0; distance + 1];
              let rc = match node {
                  None => return cnt,
                  Some(rc) => rc,
              };
              let n = rc.borrow();
              if n.left.is_none() && n.right.is_none() {
                  cnt[0] = 1;
                  return cnt;
              }
              let left = pair_walk(&n.left, distance, total);
              let right = pair_walk(&n.right, distance, total);
              for i in 0..distance {
                  let mut j = 0;
                  while i + j + 2 <= distance {
                      *total += left[i] * right[j];
                      j += 1;
                  }
              }
              for d in 1..=distance {
                  cnt[d] = left[d - 1] + right[d - 1];
              }
              cnt
          }
        `,
        php: code`
          function countPairs($root, $distance) {
              $total = 0;
              pairWalk($root, $distance, $total);
              return $total;
          }

          function pairWalk($node, $distance, &$total) {
              $cnt = array_fill(0, $distance + 1, 0);
              if ($node === null) return $cnt;
              if ($node->left === null && $node->right === null) { $cnt[0] = 1; return $cnt; }
              $left = pairWalk($node->left, $distance, $total);
              $right = pairWalk($node->right, $distance, $total);
              for ($i = 0; $i < $distance; $i++)
                  for ($j = 0; $i + $j + 2 <= $distance; $j++) $total += $left[$i] * $right[$j];
              for ($d = 1; $d <= $distance; $d++) $cnt[$d] = $left[$d - 1] + $right[$d - 1];
              return $cnt;
          }
        `,
        ruby: code`
          def countPairs(root, distance)
            total = [0]
            pair_walk(root, distance, total)
            total[0]
          end

          def pair_walk(node, distance, total)
            cnt = Array.new(distance + 1, 0)
            return cnt if node.nil?
            if node.left.nil? && node.right.nil?
              cnt[0] = 1
              return cnt
            end
            left = pair_walk(node.left, distance, total)
            right = pair_walk(node.right, distance, total)
            (0...distance).each do |i|
              j = 0
              while i + j + 2 <= distance
                total[0] += left[i] * right[j]
                j += 1
              end
            end
            (1..distance).each { |d| cnt[d] = left[d - 1] + right[d - 1] }
            cnt
          end
        `,
      },
    };
  })(),

  // ── Even Odd Tree (LC 1609) ─────────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const levels = levelNodes(root);
      for (let d = 0; d < levels.length; d++) {
        const vals = levels[d].map((n) => n.val);
        for (let i = 0; i < vals.length; i++) {
          if (d % 2 === 0 && (vals[i] % 2 === 0 || (i > 0 && vals[i] <= vals[i - 1]))) return false;
          if (d % 2 === 1 && (vals[i] % 2 === 1 || (i > 0 && vals[i] >= vals[i - 1]))) return false;
        }
      }
      return true;
    };
    const EX = [
      { root: [1, 10, 4, 3, null, 7, 9, 12, 8, 6, null, null, 2], note: "Level 0: [1]; level 1: [10, 4] even and decreasing; level 2: [3, 7, 9] odd and increasing; level 3: [12, 8, 6, 2] even and decreasing." },
      { root: [5, 4, 2, 3, 3, 7], note: "Level 2 is [3, 3, 7]: odd, but 3, 3 is not strictly increasing." },
      { root: [5, 9, 1, 3, 5, 7], note: "Level 1 holds the odd values 9 and 1, but an odd-indexed level needs even values." },
      { root: [1], note: "A lone odd root satisfies every rule." },
    ];
    return {
      slug: "even-odd-tree",
      title: "Even Odd Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Bloomberg"],
      signature: { funcName: "isEvenOddTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Number the levels of a binary tree from `0` at the root. The tree is an **Even-Odd** tree when:\n\n- on every even-indexed level, all values are **odd** and strictly **increasing** from left to right;\n- on every odd-indexed level, all values are **even** and strictly **decreasing** from left to right.\n\nGiven the `root`, return `true` if the tree is Even-Odd, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^6"]),
      hints: [
        "Every rule is about one level read left to right — so read the tree level by level.",
        "A breadth-first walk delivers each level's nodes in left-to-right order.",
        "Within a level, check each value's parity and compare it with the previous value on the same level; restart the comparison at every new level.",
      ],
      editorial: explain({
        idea: "Breadth-first order visits each level left to right, so each rule becomes a check against the previous node of the same level.",
        steps: [
          "Put the root in a queue; set `level = 0`.",
          "For each level, walk its nodes in order keeping `prev`, the previous value on this level.",
          "On an even level, fail if a value is even or not greater than `prev`; on an odd level, fail if a value is odd or not smaller than `prev`.",
          "Enqueue the children, move to the next level; return true if every level passes.",
        ],
        why: "Taking exactly the queued nodes in each round yields one complete level in left-to-right order, so comparing neighbours in that order checks strict monotonicity for the whole level, and the parity test checks every node.",
        time: "O(n)",
        space: "O(w), w the widest level",
        pitfalls: [
          "Strictly increasing and decreasing: equal neighbours fail.",
          "Reset `prev` at the start of each level — comparing with the last node of the previous level is wrong.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 1, 1)!;
        const big = rng() < 0.5;
        levelNodes(root).forEach((level, d) => {
          // A valid level first: distinct values of the right parity, sorted the right way.
          const k = level.length, top = big ? 500000 : k + 3;
          const pool = new Set<number>();
          while (pool.size < k) pool.add(ri(rng, 1, top));
          const vals = [...pool].map((v) => (d % 2 === 0 ? 2 * v - 1 : 2 * v)).sort((a, b) => (d % 2 === 0 ? a - b : b - a));
          level.forEach((nd, i) => { nd.val = vals[i]; });
        });
        if (rng() < 0.5) {
          const nodes = nodesOf(root);
          const victim = pick(rng, nodes);
          const r = rng();
          if (r < 0.4) victim.val = victim.val % 2 === 0 ? victim.val - 1 : victim.val + 1;
          else if (r < 0.7) {
            const lvl = levelNodes(root).find((l) => l.includes(victim))!;
            const other = pick(rng, lvl);
            const t = other.val; other.val = victim.val; victim.val = t;
          } else victim.val = ri(rng, 1, big ? 1000000 : 20);
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isEvenOddTree(root: Optional[TreeNode]) -> bool:
              level = [root]
              depth = 0
              while level:
                  prev = None
                  nxt = []
                  for node in level:
                      v = node.val
                      if depth % 2 == 0:
                          if v % 2 == 0 or (prev is not None and v <= prev):
                              return False
                      else:
                          if v % 2 == 1 or (prev is not None and v >= prev):
                              return False
                      prev = v
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
                  depth += 1
              return True
        `,
        javascript: code`
          var isEvenOddTree = function(root) {
              var level = [root], depth = 0;
              while (level.length > 0) {
                  var next = [];
                  for (var i = 0; i < level.length; i++) {
                      var v = level[i].val;
                      if (depth % 2 === 0) {
                          if (v % 2 === 0 || (i > 0 && v <= level[i - 1].val)) return false;
                      } else if (v % 2 === 1 || (i > 0 && v >= level[i - 1].val)) return false;
                      if (level[i].left !== null) next.push(level[i].left);
                      if (level[i].right !== null) next.push(level[i].right);
                  }
                  level = next;
                  depth++;
              }
              return true;
          };
        `,
        typescript: code`
          function isEvenOddTree(root: TreeNode | null): boolean {
              var level: TreeNode[] = [root];
              var depth = 0;
              while (level.length > 0) {
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var v = level[i].val;
                      if (depth % 2 === 0) {
                          if (v % 2 === 0 || (i > 0 && v <= level[i - 1].val)) return false;
                      } else if (v % 2 === 1 || (i > 0 && v >= level[i - 1].val)) return false;
                      if (level[i].left !== null) next.push(level[i].left);
                      if (level[i].right !== null) next.push(level[i].right);
                  }
                  level = next;
                  depth++;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isEvenOddTree(TreeNode root) {
              List<TreeNode> level = new ArrayList<>();
              level.add(root);
              int depth = 0;
              while (!level.isEmpty()) {
                  List<TreeNode> next = new ArrayList<>();
                  for (int i = 0; i < level.size(); i++) {
                      int v = level.get(i).val;
                      if (depth % 2 == 0) {
                          if (v % 2 == 0 || (i > 0 && v <= level.get(i - 1).val)) return false;
                      } else if (v % 2 == 1 || (i > 0 && v >= level.get(i - 1).val)) return false;
                      if (level.get(i).left != null) next.add(level.get(i).left);
                      if (level.get(i).right != null) next.add(level.get(i).right);
                  }
                  level = next;
                  depth++;
              }
              return true;
          }
        `,
        cpp: code`
          bool isEvenOddTree(TreeNode* root) {
              vector<TreeNode*> level{root};
              int depth = 0;
              while (!level.empty()) {
                  vector<TreeNode*> next;
                  for (size_t i = 0; i < level.size(); i++) {
                      int v = level[i]->val;
                      if (depth % 2 == 0) {
                          if (v % 2 == 0 || (i > 0 && v <= level[i - 1]->val)) return false;
                      } else if (v % 2 == 1 || (i > 0 && v >= level[i - 1]->val)) return false;
                      if (level[i]->left) next.push_back(level[i]->left);
                      if (level[i]->right) next.push_back(level[i]->right);
                  }
                  level.swap(next);
                  depth++;
              }
              return true;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          bool isEvenOddTree(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, depth = 0;
              bool ok = true;
              queue[tail++] = root;
              while (head < tail && ok) {
                  int start = head, end = tail;
                  for (int i = start; i < end && ok; i++) {
                      int v = queue[i]->val;
                      if (depth % 2 == 0) {
                          if (v % 2 == 0 || (i > start && v <= queue[i - 1]->val)) ok = false;
                      } else if (v % 2 == 1 || (i > start && v >= queue[i - 1]->val)) ok = false;
                      if (queue[i]->left != NULL) queue[tail++] = queue[i]->left;
                      if (queue[i]->right != NULL) queue[tail++] = queue[i]->right;
                  }
                  head = end;
                  depth++;
              }
              free(queue);
              return ok;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static bool IsEvenOddTree(TreeNode root)
          {
              var level = new List<TreeNode> { root };
              int depth = 0;
              while (level.Count > 0)
              {
                  var next = new List<TreeNode>();
                  for (int i = 0; i < level.Count; i++)
                  {
                      int v = level[i].val;
                      if (depth % 2 == 0)
                      {
                          if (v % 2 == 0 || (i > 0 && v <= level[i - 1].val)) return false;
                      }
                      else if (v % 2 == 1 || (i > 0 && v >= level[i - 1].val)) return false;
                      if (level[i].left != null) next.Add(level[i].left);
                      if (level[i].right != null) next.Add(level[i].right);
                  }
                  level = next;
                  depth++;
              }
              return true;
          }
        `,
        go: code`
          func isEvenOddTree(root *TreeNode) bool {
              level := []*TreeNode{root}
              depth := 0
              for len(level) > 0 {
                  next := []*TreeNode{}
                  for i, node := range level {
                      v := node.Val
                      if depth%2 == 0 {
                          if v%2 == 0 || (i > 0 && v <= level[i-1].Val) {
                              return false
                          }
                      } else if v%2 == 1 || (i > 0 && v >= level[i-1].Val) {
                          return false
                      }
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  level = next
                  depth++
              }
              return true
          }
        `,
        kotlin: kt(`
          fun isEvenOddTree(root: TreeNode?): Boolean {
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              var depth = 0
              while (level.isNotEmpty()) {
                  val next = ArrayList<TreeNode>()
                  for (i in level.indices) {
                      val v = level[i].\`val\`
                      if (depth % 2 == 0) {
                          if (v % 2 == 0 || (i > 0 && v <= level[i - 1].\`val\`)) return false
                      } else if (v % 2 == 1 || (i > 0 && v >= level[i - 1].\`val\`)) return false
                      val l = level[i].left
                      val r = level[i].right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
                  depth++
              }
              return true
          }
        `),
        swift: code`
          func isEvenOddTree(_ root: TreeNode?) -> Bool {
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              var depth = 0
              while !level.isEmpty {
                  var next: [TreeNode] = []
                  for i in 0..<level.count {
                      let v = level[i].val
                      if depth % 2 == 0 {
                          if v % 2 == 0 || (i > 0 && v <= level[i - 1].val) { return false }
                      } else if v % 2 == 1 || (i > 0 && v >= level[i - 1].val) {
                          return false
                      }
                      if let l = level[i].left { next.append(l) }
                      if let r = level[i].right { next.append(r) }
                  }
                  level = next
                  depth += 1
              }
              return true
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isEvenOddTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              let mut depth = 0;
              while !level.is_empty() {
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  let mut prev = 0;
                  for (i, node) in level.iter().enumerate() {
                      let b = node.borrow();
                      let v = b.val;
                      if depth % 2 == 0 {
                          if v % 2 == 0 || (i > 0 && v <= prev) {
                              return false;
                          }
                      } else if v % 2 == 1 || (i > 0 && v >= prev) {
                          return false;
                      }
                      prev = v;
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  level = next;
                  depth += 1;
              }
              true
          }
        `,
        php: code`
          function isEvenOddTree($root) {
              $level = [$root];
              $depth = 0;
              while (count($level) > 0) {
                  $next = [];
                  $k = count($level);
                  for ($i = 0; $i < $k; $i++) {
                      $v = $level[$i]->val;
                      if ($depth % 2 == 0) {
                          if ($v % 2 == 0 || ($i > 0 && $v <= $level[$i - 1]->val)) return false;
                      } elseif ($v % 2 == 1 || ($i > 0 && $v >= $level[$i - 1]->val)) {
                          return false;
                      }
                      if ($level[$i]->left !== null) $next[] = $level[$i]->left;
                      if ($level[$i]->right !== null) $next[] = $level[$i]->right;
                  }
                  $level = $next;
                  $depth++;
              }
              return true;
          }
        `,
        ruby: code`
          def isEvenOddTree(root)
            level = [root]
            depth = 0
            until level.empty?
              nxt = []
              level.each_with_index do |node, i|
                v = node.val
                if depth.even?
                  return false if v.even? || (i > 0 && v <= level[i - 1].val)
                elsif v.odd? || (i > 0 && v >= level[i - 1].val)
                  return false
                end
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
              depth += 1
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Step-By-Step Directions From a Binary Tree Node to Another (LC 2096)
  (() => {
    const ref = (root: TNode | null, startValue: number, destValue: number) => {
      // Brute force: breadth-first search over the tree as an undirected graph, recording each move.
      const par = parentsOf(root);
      const nodes = nodesOf(root);
      const from = nodes.find((n) => n.val === startValue)!;
      const prev = new Map<TNode, [TNode, string]>();
      const seen = new Set<TNode>([from]);
      const q = [from];
      for (let h = 0; h < q.length; h++) {
        const u = q[h];
        const moves: Array<[TNode | null | undefined, string]> = [[par.get(u), "U"], [u.left, "L"], [u.right, "R"]];
        for (const [w, m] of moves) if (w && !seen.has(w)) { seen.add(w); prev.set(w, [u, m]); q.push(w); }
      }
      let cur = nodes.find((n) => n.val === destValue)!;
      const out: string[] = [];
      while (cur !== from) { const [p, m] = prev.get(cur)!; out.push(m); cur = p; }
      return out.reverse().join("");
    };
    const EX = [
      { root: [5, 1, 2, 3, null, 6, 4], start: 3, dest: 6, note: "From 3 go up to 1, up to 5, right to 2, left to 6." },
      { root: [2, 1], start: 2, dest: 1, note: "1 is the left child of 2." },
      { root: [1, 2, 3, 4, 5], start: 5, dest: 4, note: "Up from 5 to their common parent 2, then left to 4." },
    ];
    return {
      slug: "step-by-step-directions-from-a-binary-tree-node-to-another",
      title: "Step-By-Step Directions From a Binary Tree Node to Another",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "String", "Google", "Amazon", "Meta"],
      signature: { funcName: "getDirections", params: [{ name: "root", type: "TreeNode" as const }, { name: "startValue", type: "int" as const }, { name: "destValue", type: "int" as const }], returns: "string" as const },
      description: describe(
        "You are given the `root` of a binary tree with `n` nodes whose values are the distinct integers `1` to `n`, and two different values `startValue` and `destValue`.\n\nReturn the directions for the **shortest** walk from the node holding `startValue` to the node holding `destValue`, as a string of the letters:\n\n- `L` — move to the current node's left child;\n- `R` — move to the current node's right child;\n- `U` — move to the current node's parent.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, startValue = ${e.start}, destValue = ${e.dest}`, out: ref(treeFrom(e.root), e.start, e.dest), note: e.note })),
        ["2 <= n <= 10^5", "1 <= Node.val <= n", "all node values are distinct", "1 <= startValue, destValue <= n", "startValue != destValue"]),
      hints: [
        "The shortest walk goes up from the start to the lowest common ancestor of the two nodes, then down to the destination.",
        "Write down the path from the root to each node as a string of `L`s and `R`s.",
        "The two strings share a prefix — the walk to the common ancestor. Drop it; every remaining step of the start's path becomes a `U`, followed by the rest of the destination's path.",
      ],
      editorial: explain({
        idea: "Both nodes hang off the root by an L/R path. Their longest common prefix leads to the lowest common ancestor; climbing from the start to it is one `U` per remaining start step, and the remaining destination steps lead down.",
        steps: [
          "Find the root-to-start path and the root-to-destination path as `L`/`R` strings (depth-first search with backtracking).",
          "Let `k` be the length of their longest common prefix.",
          "Return `U` repeated `len(startPath) - k` times, followed by `destPath[k:]`.",
        ],
        why: "In a tree there is exactly one simple path between two nodes, and it passes through their lowest common ancestor — the last node shared by the two root paths, reached after exactly `k` common steps. From the start, `len(startPath) - k` parent moves reach it, and the destination's remaining steps lead down from there.",
        time: "O(n)",
        space: "O(n) for the paths and the recursion",
        pitfalls: [
          "Building path strings by concatenation at every call is quadratic — append to one buffer and backtrack.",
          "The common prefix must be compared step by step; do not try to compare node values along it.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.start}\n${e.dest}`, expectedOutput: ref(treeFrom(e.root), e.start, e.dest) })),
      gen: (rng: Rng) => {
        const n = Math.max(2, sizeOf(rng, [2, 5, 15, 30, 40]));
        const root = distinctVals(rng, shapeTree(rng, n, 1, n), 1, n);
        const start = ri(rng, 1, n);
        let dest = ri(rng, 1, n - 1);
        if (dest >= start) dest++;
        return { input: `${fmtTree(root)}\n${start}\n${dest}`, expectedOutput: ref(root, start, dest) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getDirections(root: Optional[TreeNode], startValue: int, destValue: int) -> str:
              def find(node, target, path):
                  if node is None:
                      return False
                  if node.val == target:
                      return True
                  path.append("L")
                  if find(node.left, target, path):
                      return True
                  path[-1] = "R"
                  if find(node.right, target, path):
                      return True
                  path.pop()
                  return False

              ps, pd = [], []
              find(root, startValue, ps)
              find(root, destValue, pd)
              k = 0
              while k < len(ps) and k < len(pd) and ps[k] == pd[k]:
                  k += 1
              return "U" * (len(ps) - k) + "".join(pd[k:])
        `,
        javascript: code`
          var getDirections = function(root, startValue, destValue) {
              var ps = [], pd = [];
              findPath(root, startValue, ps);
              findPath(root, destValue, pd);
              var k = 0;
              while (k < ps.length && k < pd.length && ps[k] === pd[k]) k++;
              var out = [];
              for (var i = k; i < ps.length; i++) out.push("U");
              for (var j = k; j < pd.length; j++) out.push(pd[j]);
              return out.join("");
          };

          var findPath = function(node, target, path) {
              if (node === null) return false;
              if (node.val === target) return true;
              path.push("L");
              if (findPath(node.left, target, path)) return true;
              path[path.length - 1] = "R";
              if (findPath(node.right, target, path)) return true;
              path.pop();
              return false;
          };
        `,
        typescript: code`
          function getDirections(root: TreeNode | null, startValue: number, destValue: number): string {
              var ps: string[] = [], pd: string[] = [];
              findPath(root, startValue, ps);
              findPath(root, destValue, pd);
              var k = 0;
              while (k < ps.length && k < pd.length && ps[k] === pd[k]) k++;
              var out: string[] = [];
              for (var i = k; i < ps.length; i++) out.push("U");
              for (var j = k; j < pd.length; j++) out.push(pd[j]);
              return out.join("");
          }

          function findPath(node: TreeNode | null, target: number, path: string[]): boolean {
              if (node === null) return false;
              if (node.val === target) return true;
              path.push("L");
              if (findPath(node.left, target, path)) return true;
              path[path.length - 1] = "R";
              if (findPath(node.right, target, path)) return true;
              path.pop();
              return false;
          }
        `,
        java: code`
          public static String getDirections(TreeNode root, int startValue, int destValue) {
              StringBuilder ps = new StringBuilder(), pd = new StringBuilder();
              findPath(root, startValue, ps);
              findPath(root, destValue, pd);
              int k = 0;
              while (k < ps.length() && k < pd.length() && ps.charAt(k) == pd.charAt(k)) k++;
              StringBuilder out = new StringBuilder();
              for (int i = k; i < ps.length(); i++) out.append('U');
              out.append(pd, k, pd.length());
              return out.toString();
          }

          static boolean findPath(TreeNode node, int target, StringBuilder path) {
              if (node == null) return false;
              if (node.val == target) return true;
              path.append('L');
              if (findPath(node.left, target, path)) return true;
              path.setCharAt(path.length() - 1, 'R');
              if (findPath(node.right, target, path)) return true;
              path.deleteCharAt(path.length() - 1);
              return false;
          }
        `,
        cpp: code`
          bool findPath(TreeNode* node, int target, string& path);

          string getDirections(TreeNode* root, int startValue, int destValue) {
              string ps, pd;
              findPath(root, startValue, ps);
              findPath(root, destValue, pd);
              size_t k = 0;
              while (k < ps.size() && k < pd.size() && ps[k] == pd[k]) k++;
              return string(ps.size() - k, 'U') + pd.substr(k);
          }

          bool findPath(TreeNode* node, int target, string& path) {
              if (!node) return false;
              if (node->val == target) return true;
              path.push_back('L');
              if (findPath(node->left, target, path)) return true;
              path.back() = 'R';
              if (findPath(node->right, target, path)) return true;
              path.pop_back();
              return false;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static bool findPath(struct TreeNode* node, int target, char* path, int* len);

          char* getDirections(struct TreeNode* root, int startValue, int destValue) {
              int n = countNodes(root);
              char* ps = (char*) malloc((size_t) n + 1);
              char* pd = (char*) malloc((size_t) n + 1);
              int ls = 0, ld = 0, k = 0, p = 0;
              findPath(root, startValue, ps, &ls);
              findPath(root, destValue, pd, &ld);
              while (k < ls && k < ld && ps[k] == pd[k]) k++;
              char* out = (char*) malloc((size_t) (ls - k + ld - k + 1));
              for (int i = k; i < ls; i++) out[p++] = 'U';
              for (int i = k; i < ld; i++) out[p++] = pd[i];
              out[p] = '\0';
              free(ps);
              free(pd);
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static bool findPath(struct TreeNode* node, int target, char* path, int* len) {
              if (node == NULL) return false;
              if (node->val == target) return true;
              path[(*len)++] = 'L';
              if (findPath(node->left, target, path, len)) return true;
              path[*len - 1] = 'R';
              if (findPath(node->right, target, path, len)) return true;
              (*len)--;
              return false;
          }
        `,
        csharp: code`
          public static string GetDirections(TreeNode root, int startValue, int destValue)
          {
              var ps = new System.Text.StringBuilder();
              var pd = new System.Text.StringBuilder();
              FindPath(root, startValue, ps);
              FindPath(root, destValue, pd);
              int k = 0;
              while (k < ps.Length && k < pd.Length && ps[k] == pd[k]) k++;
              var output = new System.Text.StringBuilder();
              output.Append('U', ps.Length - k);
              output.Append(pd.ToString(k, pd.Length - k));
              return output.ToString();
          }

          static bool FindPath(TreeNode node, int target, System.Text.StringBuilder path)
          {
              if (node == null) return false;
              if (node.val == target) return true;
              path.Append('L');
              if (FindPath(node.left, target, path)) return true;
              path[path.Length - 1] = 'R';
              if (FindPath(node.right, target, path)) return true;
              path.Length--;
              return false;
          }
        `,
        go: code`
          func getDirections(root *TreeNode, startValue int, destValue int) string {
              var find func(node *TreeNode, target int, path *[]byte) bool
              find = func(node *TreeNode, target int, path *[]byte) bool {
                  if node == nil {
                      return false
                  }
                  if node.Val == target {
                      return true
                  }
                  *path = append(*path, 'L')
                  if find(node.Left, target, path) {
                      return true
                  }
                  (*path)[len(*path)-1] = 'R'
                  if find(node.Right, target, path) {
                      return true
                  }
                  *path = (*path)[:len(*path)-1]
                  return false
              }
              ps, pd := []byte{}, []byte{}
              find(root, startValue, &ps)
              find(root, destValue, &pd)
              k := 0
              for k < len(ps) && k < len(pd) && ps[k] == pd[k] {
                  k++
              }
              out := make([]byte, 0, len(ps)-k+len(pd)-k)
              for i := k; i < len(ps); i++ {
                  out = append(out, 'U')
              }
              out = append(out, pd[k:]...)
              return string(out)
          }
        `,
        kotlin: kt(`
          fun getDirections(root: TreeNode?, startValue: Int, destValue: Int): String {
              val ps = StringBuilder()
              val pd = StringBuilder()
              findPath(root, startValue, ps)
              findPath(root, destValue, pd)
              var k = 0
              while (k < ps.length && k < pd.length && ps[k] == pd[k]) k++
              val out = StringBuilder()
              for (i in k until ps.length) out.append('U')
              out.append(pd, k, pd.length)
              return out.toString()
          }

          fun findPath(node: TreeNode?, target: Int, path: StringBuilder): Boolean {
              if (node == null) return false
              if (node.\`val\` == target) return true
              path.append('L')
              if (findPath(node.left, target, path)) return true
              path.setCharAt(path.length - 1, 'R')
              if (findPath(node.right, target, path)) return true
              path.deleteCharAt(path.length - 1)
              return false
          }
        `),
        swift: code`
          func getDirections(_ root: TreeNode?, _ startValue: Int, _ destValue: Int) -> String {
              var ps: [Character] = [], pd: [Character] = []
              _ = findPath(root, startValue, &ps)
              _ = findPath(root, destValue, &pd)
              var k = 0
              while k < ps.count && k < pd.count && ps[k] == pd[k] { k += 1 }
              return String(repeating: "U", count: ps.count - k) + String(pd[k...])
          }

          func findPath(_ node: TreeNode?, _ target: Int, _ path: inout [Character]) -> Bool {
              guard let n = node else { return false }
              if n.val == target { return true }
              path.append("L")
              if findPath(n.left, target, &path) { return true }
              path[path.count - 1] = "R"
              if findPath(n.right, target, &path) { return true }
              path.removeLast()
              return false
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn getDirections(root: Option<Rc<RefCell<TreeNode>>>, start_value: i32, dest_value: i32) -> String {
              let mut ps: Vec<u8> = Vec::new();
              let mut pd: Vec<u8> = Vec::new();
              find_path(&root, start_value, &mut ps);
              find_path(&root, dest_value, &mut pd);
              let mut k = 0;
              while k < ps.len() && k < pd.len() && ps[k] == pd[k] {
                  k += 1;
              }
              let mut out = String::with_capacity(ps.len() - k + pd.len() - k);
              for _ in k..ps.len() {
                  out.push('U');
              }
              for &c in &pd[k..] {
                  out.push(c as char);
              }
              out
          }

          fn find_path(node: &Option<Rc<RefCell<TreeNode>>>, target: i32, path: &mut Vec<u8>) -> bool {
              match node {
                  None => false,
                  Some(rc) => {
                      let n = rc.borrow();
                      if n.val == target {
                          return true;
                      }
                      path.push(b'L');
                      if find_path(&n.left, target, path) {
                          return true;
                      }
                      let last = path.len() - 1;
                      path[last] = b'R';
                      if find_path(&n.right, target, path) {
                          return true;
                      }
                      path.pop();
                      false
                  }
              }
          }
        `,
        php: code`
          function getDirections($root, $startValue, $destValue) {
              $ps = [];
              $pd = [];
              findPath($root, $startValue, $ps);
              findPath($root, $destValue, $pd);
              $k = 0;
              $ls = count($ps);
              $ld = count($pd);
              while ($k < $ls && $k < $ld && $ps[$k] === $pd[$k]) $k++;
              return str_repeat("U", $ls - $k) . implode("", array_slice($pd, $k));
          }

          function findPath($node, $target, &$path) {
              if ($node === null) return false;
              if ($node->val == $target) return true;
              $path[] = "L";
              if (findPath($node->left, $target, $path)) return true;
              $path[count($path) - 1] = "R";
              if (findPath($node->right, $target, $path)) return true;
              array_pop($path);
              return false;
          }
        `,
        ruby: code`
          def getDirections(root, startValue, destValue)
            ps = []
            pd = []
            find_path(root, startValue, ps)
            find_path(root, destValue, pd)
            k = 0
            k += 1 while k < ps.length && k < pd.length && ps[k] == pd[k]
            "U" * (ps.length - k) + pd[k..-1].join
          end

          def find_path(node, target, path)
            return false if node.nil?
            return true if node.val == target
            path << "L"
            return true if find_path(node.left, target, path)
            path[-1] = "R"
            return true if find_path(node.right, target, path)
            path.pop
            false
          end
        `,
      },
    };
  })(),

  // ── Create Binary Tree From Descriptions (LC 2196) ──────────────
  (() => {
    const ref = (descriptions: number[][]) => {
      const nodes = new Map<number, TNode>();
      const get = (v: number) => { let n = nodes.get(v); if (!n) { n = { val: v, left: null, right: null }; nodes.set(v, n); } return n; };
      const children = new Set<number>();
      for (const [p, c, isLeft] of descriptions) {
        if (isLeft === 1) get(p).left = get(c); else get(p).right = get(c);
        children.add(c);
      }
      const rootVal = descriptions.map((d) => d[0]).find((p) => !children.has(p))!;
      return nodes.get(rootVal)!;
    };
    const EX = [
      { d: [[20, 15, 1], [20, 17, 0], [50, 20, 1], [50, 80, 0], [80, 19, 1]], note: "50 is never anyone's child, so it is the root; 20 and 80 are its children, and so on." },
      { d: [[1, 2, 1], [2, 3, 0], [3, 4, 1]], note: "A zigzag chain: 2 is 1's left child, 3 is 2's right child, 4 is 3's left child." },
      { d: [[7, 3, 0]], note: "One edge: 3 is the right child of the root 7." },
    ];
    return {
      slug: "create-binary-tree-from-descriptions",
      title: "Create Binary Tree From Descriptions",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Hash Table", "Array", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "createBinaryTree", params: [{ name: "descriptions", type: "int[][]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given a 2D array `descriptions` where `descriptions[i] = [parent, child, isLeft]` says that the node with value `parent` has the node with value `child` as its **left** child when `isLeft == 1`, or as its **right** child when `isLeft == 0`. All node values are distinct.\n\nThe descriptions together form one valid binary tree. Build it and return its root.",
        EX.map((e) => ({ in: `descriptions = ${fmtIntMat(e.d)}`, out: fmtTree(ref(e.d)), note: e.note })),
        ["1 <= descriptions.length <= 10^4", "descriptions[i].length == 3", "1 <= parent, child <= 10^5", "0 <= isLeft <= 1", "the descriptions describe a valid binary tree with distinct values"]),
      hints: [
        "Every value needs exactly one node object, however many descriptions mention it — keep a map from value to node.",
        "Each description is then just one pointer to set on the parent's node.",
        "The root is the one parent value that never appears as a child; record every child value in a set and look for the parent that is missing from it.",
      ],
      editorial: explain({
        idea: "Map each value to a single node, wire up the pointers description by description, and pick as root the only node that is never someone's child.",
        steps: [
          "Create an empty map `value → node` and an empty set of child values.",
          "For each `[p, c, isLeft]`: fetch or create the nodes for `p` and `c`, set `p.left = c` or `p.right = c`, and add `c` to the set.",
          "Scan the parents; the one not in the child set is the root. Return its node.",
        ],
        why: "Using one node per value makes every description refer to the same objects, so the pointers assemble into the described tree. In a tree every node except the root has exactly one parent, so the root is precisely the value that never occurs as a child, and it occurs as a parent because the tree has at least one edge.",
        time: "O(n) expected with a hash map",
        space: "O(n)",
        pitfalls: [
          "Creating a new node every time a value appears splits one node into several disconnected copies.",
          "Do not assume the first description's parent is the root — the descriptions come in any order.",
        ],
      }),
      examples: EX.map((e) => ({ input: fmtIntMat(e.d), expectedOutput: fmtTree(ref(e.d)) })),
      gen: (rng: Rng) => {
        const n = Math.max(2, sizeOf(rng, [2, 5, 15, 30, 40]));
        const hi = pick(rng, [n, 100, 100000]);
        const root = distinctVals(rng, shapeTree(rng, n, 1, 1), 1, hi);
        const d: number[][] = [];
        for (const nd of nodesOf(root)) {
          if (nd.left) d.push([nd.val, nd.left.val, 1]);
          if (nd.right) d.push([nd.val, nd.right.val, 0]);
        }
        const rows = shuffle(rng, d);
        return { input: fmtIntMat(rows), expectedOutput: fmtTree(ref(rows)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def createBinaryTree(descriptions: List[List[int]]) -> Optional[TreeNode]:
              nodes = {}
              children = set()
              for p, c, is_left in descriptions:
                  if p not in nodes:
                      nodes[p] = TreeNode(p)
                  if c not in nodes:
                      nodes[c] = TreeNode(c)
                  if is_left == 1:
                      nodes[p].left = nodes[c]
                  else:
                      nodes[p].right = nodes[c]
                  children.add(c)
              for p, _, _ in descriptions:
                  if p not in children:
                      return nodes[p]
              return None
        `,
        javascript: code`
          var createBinaryTree = function(descriptions) {
              var nodes = new Map(), children = new Set();
              var get = function(v) {
                  var n = nodes.get(v);
                  if (n === undefined) { n = new TreeNode(v); nodes.set(v, n); }
                  return n;
              };
              for (var i = 0; i < descriptions.length; i++) {
                  var d = descriptions[i];
                  if (d[2] === 1) get(d[0]).left = get(d[1]); else get(d[0]).right = get(d[1]);
                  children.add(d[1]);
              }
              for (var j = 0; j < descriptions.length; j++) {
                  if (!children.has(descriptions[j][0])) return nodes.get(descriptions[j][0]);
              }
              return null;
          };
        `,
        typescript: code`
          function createBinaryTree(descriptions: number[][]): TreeNode | null {
              var nodes: { [v: number]: TreeNode } = {};
              var children: { [v: number]: boolean } = {};
              function get(v: number): TreeNode {
                  if (!(v in nodes)) nodes[v] = new TreeNode(v);
                  return nodes[v];
              }
              for (var i = 0; i < descriptions.length; i++) {
                  var d = descriptions[i];
                  if (d[2] === 1) get(d[0]).left = get(d[1]); else get(d[0]).right = get(d[1]);
                  children[d[1]] = true;
              }
              for (var j = 0; j < descriptions.length; j++) {
                  if (!children[descriptions[j][0]]) return nodes[descriptions[j][0]];
              }
              return null;
          }
        `,
        java: code`
          public static TreeNode createBinaryTree(int[][] descriptions) {
              Map<Integer, TreeNode> nodes = new HashMap<>();
              Set<Integer> children = new HashSet<>();
              for (int[] d : descriptions) {
                  TreeNode p = nodes.computeIfAbsent(d[0], TreeNode::new);
                  TreeNode c = nodes.computeIfAbsent(d[1], TreeNode::new);
                  if (d[2] == 1) p.left = c; else p.right = c;
                  children.add(d[1]);
              }
              for (int[] d : descriptions) if (!children.contains(d[0])) return nodes.get(d[0]);
              return null;
          }
        `,
        cpp: code`
          TreeNode* createBinaryTree(vector<vector<int>>& descriptions) {
              unordered_map<int, TreeNode*> nodes;
              unordered_set<int> children;
              auto get = [&](int v) {
                  auto it = nodes.find(v);
                  if (it != nodes.end()) return it->second;
                  TreeNode* n = new TreeNode(v);
                  nodes[v] = n;
                  return n;
              };
              for (auto& d : descriptions) {
                  TreeNode* p = get(d[0]);
                  TreeNode* c = get(d[1]);
                  if (d[2] == 1) p->left = c; else p->right = c;
                  children.insert(d[1]);
              }
              for (auto& d : descriptions) if (!children.count(d[0])) return nodes[d[0]];
              return nullptr;
          }
        `,
        c: code`
          static int slotOf(int* keys, struct TreeNode** nodes, int cap, int key);

          /* Open addressing over the values (all >= 1, so 0 marks an empty slot). */
          struct TreeNode* createBinaryTree(int** descriptions, int descriptionsSize, int* descriptionsColSize) {
              int cap = 1;
              while (cap < 4 * descriptionsSize + 4) cap <<= 1;
              int* keys = (int*) calloc((size_t) cap, sizeof(int));
              struct TreeNode** nodes = (struct TreeNode**) calloc((size_t) cap, sizeof(struct TreeNode*));
              bool* isChild = (bool*) calloc((size_t) cap, sizeof(bool));
              for (int i = 0; i < descriptionsSize; i++) {
                  int p = slotOf(keys, nodes, cap, descriptions[i][0]);
                  int c = slotOf(keys, nodes, cap, descriptions[i][1]);
                  if (descriptions[i][2] == 1) nodes[p]->left = nodes[c]; else nodes[p]->right = nodes[c];
                  isChild[c] = true;
              }
              struct TreeNode* root = NULL;
              for (int i = 0; i < descriptionsSize && root == NULL; i++) {
                  int p = slotOf(keys, nodes, cap, descriptions[i][0]);
                  if (!isChild[p]) root = nodes[p];
              }
              free(keys);
              free(nodes);
              free(isChild);
              return root;
          }

          static int slotOf(int* keys, struct TreeNode** nodes, int cap, int key) {
              unsigned int h = ((unsigned int) key * 2654435761u) & (unsigned int) (cap - 1);
              while (keys[h] != 0 && keys[h] != key) h = (h + 1) & (unsigned int) (cap - 1);
              if (keys[h] == 0) {
                  keys[h] = key;
                  struct TreeNode* n = (struct TreeNode*) malloc(sizeof(struct TreeNode));
                  n->val = key;
                  n->left = NULL;
                  n->right = NULL;
                  nodes[h] = n;
              }
              return (int) h;
          }
        `,
        csharp: code`
          public static TreeNode CreateBinaryTree(int[][] descriptions)
          {
              var nodes = new Dictionary<int, TreeNode>();
              var children = new HashSet<int>();
              foreach (var d in descriptions)
              {
                  if (!nodes.ContainsKey(d[0])) nodes[d[0]] = new TreeNode(d[0]);
                  if (!nodes.ContainsKey(d[1])) nodes[d[1]] = new TreeNode(d[1]);
                  if (d[2] == 1) nodes[d[0]].left = nodes[d[1]]; else nodes[d[0]].right = nodes[d[1]];
                  children.Add(d[1]);
              }
              foreach (var d in descriptions) if (!children.Contains(d[0])) return nodes[d[0]];
              return null;
          }
        `,
        go: code`
          func createBinaryTree(descriptions [][]int) *TreeNode {
              nodes := map[int]*TreeNode{}
              children := map[int]bool{}
              get := func(v int) *TreeNode {
                  n, ok := nodes[v]
                  if !ok {
                      n = &TreeNode{Val: v}
                      nodes[v] = n
                  }
                  return n
              }
              for _, d := range descriptions {
                  p, c := get(d[0]), get(d[1])
                  if d[2] == 1 {
                      p.Left = c
                  } else {
                      p.Right = c
                  }
                  children[d[1]] = true
              }
              for _, d := range descriptions {
                  if !children[d[0]] {
                      return nodes[d[0]]
                  }
              }
              return nil
          }
        `,
        kotlin: kt(`
          fun createBinaryTree(descriptions: Array<IntArray>): TreeNode? {
              val nodes = HashMap<Int, TreeNode>()
              val children = HashSet<Int>()
              for (d in descriptions) {
                  val p = nodes.getOrPut(d[0]) { TreeNode(d[0]) }
                  val c = nodes.getOrPut(d[1]) { TreeNode(d[1]) }
                  if (d[2] == 1) p.left = c else p.right = c
                  children.add(d[1])
              }
              for (d in descriptions) if (!children.contains(d[0])) return nodes[d[0]]
              return null
          }
        `),
        swift: code`
          func createBinaryTree(_ descriptions: [[Int]]) -> TreeNode? {
              var nodes: [Int: TreeNode] = [:]
              var children = Set<Int>()
              func get(_ v: Int) -> TreeNode {
                  if let n = nodes[v] { return n }
                  let n = TreeNode(v)
                  nodes[v] = n
                  return n
              }
              for d in descriptions {
                  let p = get(d[0]), c = get(d[1])
                  if d[2] == 1 { p.left = c } else { p.right = c }
                  children.insert(d[1])
              }
              for d in descriptions where !children.contains(d[0]) { return nodes[d[0]] }
              return nil
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::{HashMap, HashSet};

          fn createBinaryTree(descriptions: Vec<Vec<i32>>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut nodes: HashMap<i32, Rc<RefCell<TreeNode>>> = HashMap::new();
              let mut children: HashSet<i32> = HashSet::new();
              for d in &descriptions {
                  let p = nodes.entry(d[0]).or_insert_with(|| Rc::new(RefCell::new(TreeNode::new(d[0])))).clone();
                  let c = nodes.entry(d[1]).or_insert_with(|| Rc::new(RefCell::new(TreeNode::new(d[1])))).clone();
                  if d[2] == 1 {
                      p.borrow_mut().left = Some(c);
                  } else {
                      p.borrow_mut().right = Some(c);
                  }
                  children.insert(d[1]);
              }
              for d in &descriptions {
                  if !children.contains(&d[0]) {
                      return nodes.get(&d[0]).cloned();
                  }
              }
              None
          }
        `,
        php: code`
          function createBinaryTree($descriptions) {
              $nodes = [];
              $children = [];
              foreach ($descriptions as $d) {
                  if (!isset($nodes[$d[0]])) $nodes[$d[0]] = new TreeNode($d[0]);
                  if (!isset($nodes[$d[1]])) $nodes[$d[1]] = new TreeNode($d[1]);
                  if ($d[2] == 1) $nodes[$d[0]]->left = $nodes[$d[1]]; else $nodes[$d[0]]->right = $nodes[$d[1]];
                  $children[$d[1]] = true;
              }
              foreach ($descriptions as $d) if (!isset($children[$d[0]])) return $nodes[$d[0]];
              return null;
          }
        `,
        ruby: code`
          def createBinaryTree(descriptions)
            nodes = {}
            children = {}
            descriptions.each do |p, c, is_left|
              nodes[p] ||= TreeNode.new(p)
              nodes[c] ||= TreeNode.new(c)
              if is_left == 1
                nodes[p].left = nodes[c]
              else
                nodes[p].right = nodes[c]
              end
              children[c] = true
            end
            descriptions.each { |d| return nodes[d[0]] unless children[d[0]] }
            nil
          end
        `,
      },
    };
  })(),

  // ── Count Nodes Equal to Average of Subtree (LC 2265) ───────────
  (() => {
    const ref = (root: TNode | null) => nodesOf(root).filter((n) => {
      const sub = nodesOf(n);
      return Math.floor(sub.reduce((s, x) => s + x.val, 0) / sub.length) === n.val;
    }).length;
    const EX = [
      { root: [4, 8, 5, 0, 1, null, 6], note: "4: (4+8+5+0+1+6) / 6 = 4. 5: (5+6) / 2 = 5. 0, 1 and 6 are leaves. 8: (8+0+1) / 3 = 3, not 8. Five nodes match." },
      { root: [1], note: "A leaf always equals its own average." },
      { root: [2, 1, 4], note: "The root's average is 7 / 3 = 2 (rounded down), and both leaves match too." },
    ];
    return {
      slug: "count-nodes-equal-to-average-of-subtree",
      title: "Count Nodes Equal to Average of Subtree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Meta"],
      signature: { funcName: "averageOfSubtree", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return how many nodes have a value equal to the **average** of the values in their subtree.\n\nA node's subtree is the node together with all of its descendants. The average of `k` values is their sum divided by `k`, **rounded down** to an integer.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 1000", "0 <= Node.val <= 1000"]),
      hints: [
        "A subtree's average needs only two numbers: its sum and its size.",
        "Both combine from the children: sum = left sum + right sum + value, size = left size + right size + 1.",
        "Compute them in one post-order walk and compare `sum / size` (integer division) with the node's value as you go.",
      ],
      editorial: explain({
        idea: "A post-order walk returns each subtree's sum and size, built from its children's; the node is counted when the integer average equals its value.",
        steps: [
          "`walk(node)` returns `(sum, size)`; a null node returns `(0, 0)`.",
          "For a node, combine its children's pairs into `sum = ls + rs + val` and `size = lc + rc + 1`.",
          "If `sum / size` (rounded down) equals `val`, increase the count.",
          "Return `(sum, size)`; the count after walking the root is the answer.",
        ],
        why: "Each subtree is the disjoint union of the node and its two child subtrees, so the sums and sizes add up exactly. Every node is visited once, after its children, so its pair is ready when it is tested.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Recomputing each subtree's sum from scratch is O(n^2).",
          "Round down: values are non-negative, so plain integer division does it.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 0, pick(rng, [1, 3, 6, 1000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def averageOfSubtree(root: Optional[TreeNode]) -> int:
              count = 0

              def walk(node):
                  nonlocal count
                  if node is None:
                      return 0, 0
                  ls, lc = walk(node.left)
                  rs, rc = walk(node.right)
                  s = ls + rs + node.val
                  c = lc + rc + 1
                  if s // c == node.val:
                      count += 1
                  return s, c

              walk(root)
              return count
        `,
        javascript: code`
          var averageOfSubtree = function(root) {
              var state = { count: 0 };
              avgWalk(root, state);
              return state.count;
          };

          // Returns [sum, size] of the subtree.
          var avgWalk = function(node, state) {
              if (node === null) return [0, 0];
              var l = avgWalk(node.left, state), r = avgWalk(node.right, state);
              var s = l[0] + r[0] + node.val, c = l[1] + r[1] + 1;
              if (Math.floor(s / c) === node.val) state.count++;
              return [s, c];
          };
        `,
        typescript: code`
          function averageOfSubtree(root: TreeNode | null): number {
              var state = { count: 0 };
              avgWalk(root, state);
              return state.count;
          }

          // Returns [sum, size] of the subtree.
          function avgWalk(node: TreeNode | null, state: { count: number }): number[] {
              if (node === null) return [0, 0];
              var l = avgWalk(node.left, state), r = avgWalk(node.right, state);
              var s = l[0] + r[0] + node.val, c = l[1] + r[1] + 1;
              if (Math.floor(s / c) === node.val) state.count++;
              return [s, c];
          }
        `,
        java: code`
          public static int averageOfSubtree(TreeNode root) {
              int[] count = new int[1];
              avgWalk(root, count);
              return count[0];
          }

          // Returns {sum, size} of the subtree.
          static int[] avgWalk(TreeNode node, int[] count) {
              if (node == null) return new int[] {0, 0};
              int[] l = avgWalk(node.left, count), r = avgWalk(node.right, count);
              int s = l[0] + r[0] + node.val, c = l[1] + r[1] + 1;
              if (s / c == node.val) count[0]++;
              return new int[] {s, c};
          }
        `,
        cpp: code`
          pair<int, int> avgWalk(TreeNode* node, int& count);

          int averageOfSubtree(TreeNode* root) {
              int count = 0;
              avgWalk(root, count);
              return count;
          }

          // Returns {sum, size} of the subtree.
          pair<int, int> avgWalk(TreeNode* node, int& count) {
              if (!node) return {0, 0};
              auto l = avgWalk(node->left, count);
              auto r = avgWalk(node->right, count);
              int s = l.first + r.first + node->val, c = l.second + r.second + 1;
              if (s / c == node->val) count++;
              return {s, c};
          }
        `,
        c: code`
          static int avgWalk(struct TreeNode* node, int* size, int* count);

          int averageOfSubtree(struct TreeNode* root) {
              int count = 0, size = 0;
              avgWalk(root, &size, &count);
              return count;
          }

          /* Returns the subtree's sum and writes its size. */
          static int avgWalk(struct TreeNode* node, int* size, int* count) {
              if (node == NULL) { *size = 0; return 0; }
              int lc = 0, rc = 0;
              int ls = avgWalk(node->left, &lc, count);
              int rs = avgWalk(node->right, &rc, count);
              int s = ls + rs + node->val;
              *size = lc + rc + 1;
              if (s / *size == node->val) (*count)++;
              return s;
          }
        `,
        csharp: code`
          public static int AverageOfSubtree(TreeNode root)
          {
              int count = 0;
              AvgWalk(root, ref count);
              return count;
          }

          // Returns {sum, size} of the subtree.
          static int[] AvgWalk(TreeNode node, ref int count)
          {
              if (node == null) return new int[] { 0, 0 };
              var l = AvgWalk(node.left, ref count);
              var r = AvgWalk(node.right, ref count);
              int s = l[0] + r[0] + node.val, c = l[1] + r[1] + 1;
              if (s / c == node.val) count++;
              return new int[] { s, c };
          }
        `,
        go: code`
          func averageOfSubtree(root *TreeNode) int {
              count := 0
              var walk func(node *TreeNode) (int, int)
              walk = func(node *TreeNode) (int, int) {
                  if node == nil {
                      return 0, 0
                  }
                  ls, lc := walk(node.Left)
                  rs, rc := walk(node.Right)
                  s, c := ls+rs+node.Val, lc+rc+1
                  if s/c == node.Val {
                      count++
                  }
                  return s, c
              }
              walk(root)
              return count
          }
        `,
        kotlin: kt(`
          fun averageOfSubtree(root: TreeNode?): Int {
              val count = IntArray(1)
              avgWalk(root, count)
              return count[0]
          }

          // Returns (sum, size) of the subtree.
          fun avgWalk(node: TreeNode?, count: IntArray): Pair<Int, Int> {
              if (node == null) return Pair(0, 0)
              val l = avgWalk(node.left, count)
              val r = avgWalk(node.right, count)
              val s = l.first + r.first + node.\`val\`
              val c = l.second + r.second + 1
              if (s / c == node.\`val\`) count[0]++
              return Pair(s, c)
          }
        `),
        swift: code`
          func averageOfSubtree(_ root: TreeNode?) -> Int {
              var count = 0
              _ = avgWalk(root, &count)
              return count
          }

          // Returns (sum, size) of the subtree.
          func avgWalk(_ node: TreeNode?, _ count: inout Int) -> (Int, Int) {
              guard let n = node else { return (0, 0) }
              let l = avgWalk(n.left, &count)
              let r = avgWalk(n.right, &count)
              let s = l.0 + r.0 + n.val, c = l.1 + r.1 + 1
              if s / c == n.val { count += 1 }
              return (s, c)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn averageOfSubtree(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut count = 0;
              avg_walk(&root, &mut count);
              count
          }

          // Returns (sum, size) of the subtree.
          fn avg_walk(node: &Option<Rc<RefCell<TreeNode>>>, count: &mut i32) -> (i32, i32) {
              match node {
                  None => (0, 0),
                  Some(rc) => {
                      let n = rc.borrow();
                      let (ls, lc) = avg_walk(&n.left, count);
                      let (rs, rcount) = avg_walk(&n.right, count);
                      let s = ls + rs + n.val;
                      let c = lc + rcount + 1;
                      if s / c == n.val {
                          *count += 1;
                      }
                      (s, c)
                  }
              }
          }
        `,
        php: code`
          function averageOfSubtree($root) {
              $count = 0;
              avgWalk($root, $count);
              return $count;
          }

          // Returns [sum, size] of the subtree.
          function avgWalk($node, &$count) {
              if ($node === null) return [0, 0];
              $l = avgWalk($node->left, $count);
              $r = avgWalk($node->right, $count);
              $s = $l[0] + $r[0] + $node->val;
              $c = $l[1] + $r[1] + 1;
              if (intdiv($s, $c) == $node->val) $count++;
              return [$s, $c];
          }
        `,
        ruby: code`
          def averageOfSubtree(root)
            count = [0]
            avg_walk(root, count)
            count[0]
          end

          # Returns [sum, size] of the subtree.
          def avg_walk(node, count)
            return [0, 0] if node.nil?
            ls, lc = avg_walk(node.left, count)
            rs, rc = avg_walk(node.right, count)
            s = ls + rs + node.val
            c = lc + rc + 1
            count[0] += 1 if s / c == node.val
            [s, c]
          end
        `,
      },
    };
  })(),

  // ── Amount of Time for Binary Tree to Be Infected (LC 2385) ─────
  (() => {
    const ref = (root: TNode | null, start: number) => {
      // Brute force: simulate minute by minute.
      const par = parentsOf(root);
      let infected = new Set<TNode>(nodesOf(root).filter((n) => n.val === start));
      const total = nodesOf(root).length;
      let minutes = 0;
      while (infected.size < total) {
        const next = new Set(infected);
        for (const u of infected) for (const w of [par.get(u), u.left, u.right]) if (w) next.add(w);
        infected = next;
        minutes++;
      }
      return minutes;
    };
    const EX = [
      { root: [1, 5, 3, null, 4, 10, 6, 9, 2], start: 3, note: "Minute 1: 1, 10, 6. Minute 2: 5. Minute 3: 4. Minute 4: 9 and 2 — every node is infected." },
      { root: [1], start: 1, note: "The only node is infected from the start." },
      { root: [1, 2, null, 3, null, 4], start: 1, note: "The infection walks down the chain one node a minute: 2, 3, then 4." },
    ];
    return {
      slug: "amount-of-time-for-binary-tree-to-be-infected",
      title: "Amount of Time for Binary Tree to Be Infected",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "amountOfTime", params: [{ name: "root", type: "TreeNode" as const }, { name: "start", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are distinct, and an integer `start`. At minute `0` an infection starts at the node whose value is `start`.\n\nEach minute, every uninfected node that is **adjacent** to an infected node (its parent or one of its children) becomes infected. Return the number of minutes needed for the whole tree to be infected.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, start = ${e.start}`, out: String(ref(treeFrom(e.root), e.start)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "a node with value start exists in the tree"]),
      hints: [
        "The infection spreads to parents as well as children, so treat the tree as an undirected graph.",
        "A node gets infected at a minute equal to its distance from the start node. The answer is the largest distance.",
        "Record each node's neighbours (parent and children) by value in one walk, then run a breadth-first search from `start` and count its rounds.",
      ],
      editorial: explain({
        idea: "The minute a node is infected is its graph distance from `start`, so the answer is the farthest distance — the number of rounds of a breadth-first search from `start` over the tree with parent links added.",
        steps: [
          "Walk the tree once, recording for every value the values of its parent and children (its neighbours).",
          "Run a breadth-first search from `start`, one level per minute, marking values as visited.",
          "Count the levels after the first; that count is the answer.",
        ],
        why: "Each minute the infected set grows by exactly the uninfected neighbours of the infected set, which is what one breadth-first level adds. So level `d` of the search is the set infected at minute `d`, and the last non-empty level is the last minute anything changes.",
        time: "O(n)",
        space: "O(n) for the adjacency and the queue",
        pitfalls: [
          "Following only child pointers misses the spread upwards through the parent.",
          "Count minutes, not nodes: the start alone is minute 0.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.start}`, expectedOutput: String(ref(treeFrom(e.root), e.start)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 8, 20, 30, 40]);
        const root = distinctVals(rng, shapeTree(rng, n, 1, 1), 1, pick(rng, [n, 100, 100000]));
        const start = pick(rng, nodesOf(root)).val;
        return { input: `${fmtTree(root)}\n${start}`, expectedOutput: String(ref(root, start)) };
      },
      solutions: {
        python: code`
          from typing import Optional
          from collections import defaultdict

          def amountOfTime(root: Optional[TreeNode], start: int) -> int:
              adj = defaultdict(list)
              stack = [root]
              while stack:
                  node = stack.pop()
                  for child in (node.left, node.right):
                      if child:
                          adj[node.val].append(child.val)
                          adj[child.val].append(node.val)
                          stack.append(child)
              seen = {start}
              level = [start]
              minutes = -1
              while level:
                  minutes += 1
                  nxt = []
                  for u in level:
                      for w in adj[u]:
                          if w not in seen:
                              seen.add(w)
                              nxt.append(w)
                  level = nxt
              return minutes
        `,
        javascript: code`
          var amountOfTime = function(root, start) {
              var adj = new Map();
              var link = function(a, b) {
                  if (!adj.has(a)) adj.set(a, []);
                  if (!adj.has(b)) adj.set(b, []);
                  adj.get(a).push(b);
                  adj.get(b).push(a);
              };
              var stack = [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.left !== null) { link(node.val, node.left.val); stack.push(node.left); }
                  if (node.right !== null) { link(node.val, node.right.val); stack.push(node.right); }
              }
              var seen = new Set([start]), level = [start], minutes = -1;
              while (level.length > 0) {
                  minutes++;
                  var next = [];
                  for (var i = 0; i < level.length; i++) {
                      var ns = adj.get(level[i]) || [];
                      for (var j = 0; j < ns.length; j++) {
                          if (!seen.has(ns[j])) { seen.add(ns[j]); next.push(ns[j]); }
                      }
                  }
                  level = next;
              }
              return minutes;
          };
        `,
        typescript: code`
          function amountOfTime(root: TreeNode | null, start: number): number {
              var adj: { [v: number]: number[] } = {};
              function link(a: number, b: number): void {
                  if (!(a in adj)) adj[a] = [];
                  if (!(b in adj)) adj[b] = [];
                  adj[a].push(b);
                  adj[b].push(a);
              }
              var stack: TreeNode[] = [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.left !== null) { link(node.val, node.left.val); stack.push(node.left); }
                  if (node.right !== null) { link(node.val, node.right.val); stack.push(node.right); }
              }
              var seen: { [v: number]: boolean } = {};
              seen[start] = true;
              var level: number[] = [start];
              var minutes = -1;
              while (level.length > 0) {
                  minutes++;
                  var next: number[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var ns = adj[level[i]] || [];
                      for (var j = 0; j < ns.length; j++) {
                          if (!seen[ns[j]]) { seen[ns[j]] = true; next.push(ns[j]); }
                      }
                  }
                  level = next;
              }
              return minutes;
          }
        `,
        java: code`
          public static int amountOfTime(TreeNode root, int start) {
              Map<Integer, List<Integer>> adj = new HashMap<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              stack.push(root);
              while (!stack.isEmpty()) {
                  TreeNode node = stack.pop();
                  for (TreeNode child : new TreeNode[] {node.left, node.right}) {
                      if (child == null) continue;
                      adj.computeIfAbsent(node.val, k -> new ArrayList<>()).add(child.val);
                      adj.computeIfAbsent(child.val, k -> new ArrayList<>()).add(node.val);
                      stack.push(child);
                  }
              }
              Set<Integer> seen = new HashSet<>();
              seen.add(start);
              List<Integer> level = new ArrayList<>();
              level.add(start);
              int minutes = -1;
              while (!level.isEmpty()) {
                  minutes++;
                  List<Integer> next = new ArrayList<>();
                  for (int u : level) {
                      for (int w : adj.getOrDefault(u, Collections.emptyList())) {
                          if (seen.add(w)) next.add(w);
                      }
                  }
                  level = next;
              }
              return minutes;
          }
        `,
        cpp: code`
          int amountOfTime(TreeNode* root, int start) {
              unordered_map<int, vector<int>> adj;
              vector<TreeNode*> stack{root};
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  for (TreeNode* child : {node->left, node->right}) {
                      if (!child) continue;
                      adj[node->val].push_back(child->val);
                      adj[child->val].push_back(node->val);
                      stack.push_back(child);
                  }
              }
              unordered_set<int> seen{start};
              vector<int> level{start};
              int minutes = -1;
              while (!level.empty()) {
                  minutes++;
                  vector<int> next;
                  for (int u : level)
                      for (int w : adj[u])
                          if (seen.insert(w).second) next.push_back(w);
                  level.swap(next);
              }
              return minutes;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          /* Nodes in breadth-first order with parent / child indices; then a BFS over indices from start. */
          int amountOfTime(struct TreeNode* root, int start) {
              int n = countNodes(root);
              struct TreeNode** nodes = (struct TreeNode**) malloc((size_t) n * sizeof(struct TreeNode*));
              int* par = (int*) malloc((size_t) n * sizeof(int));
              int* lft = (int*) malloc((size_t) n * sizeof(int));
              int* rgt = (int*) malloc((size_t) n * sizeof(int));
              int* dist = (int*) malloc((size_t) n * sizeof(int));
              int* queue = (int*) malloc((size_t) n * sizeof(int));
              int tail = 0, from = 0, best = 0;
              nodes[tail] = root;
              par[tail++] = -1;
              for (int i = 0; i < tail; i++) {
                  lft[i] = rgt[i] = -1;
                  dist[i] = -1;
                  if (nodes[i]->val == start) from = i;
                  if (nodes[i]->left != NULL) { lft[i] = tail; nodes[tail] = nodes[i]->left; par[tail++] = i; }
                  if (nodes[i]->right != NULL) { rgt[i] = tail; nodes[tail] = nodes[i]->right; par[tail++] = i; }
              }
              int head = 0, qt = 0;
              queue[qt++] = from;
              dist[from] = 0;
              while (head < qt) {
                  int u = queue[head++];
                  int nb[3] = {par[u], lft[u], rgt[u]};
                  if (dist[u] > best) best = dist[u];
                  for (int k = 0; k < 3; k++) {
                      int w = nb[k];
                      if (w >= 0 && dist[w] < 0) { dist[w] = dist[u] + 1; queue[qt++] = w; }
                  }
              }
              free(nodes); free(par); free(lft); free(rgt); free(dist); free(queue);
              return best;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int AmountOfTime(TreeNode root, int start)
          {
              var adj = new Dictionary<int, List<int>>();
              var stack = new Stack<TreeNode>();
              stack.Push(root);
              while (stack.Count > 0)
              {
                  var node = stack.Pop();
                  if (node.left != null) { Link(adj, node.val, node.left.val); stack.Push(node.left); }
                  if (node.right != null) { Link(adj, node.val, node.right.val); stack.Push(node.right); }
              }
              var seen = new HashSet<int> { start };
              var level = new List<int> { start };
              int minutes = -1;
              while (level.Count > 0)
              {
                  minutes++;
                  var next = new List<int>();
                  foreach (int u in level)
                  {
                      if (!adj.ContainsKey(u)) continue;
                      foreach (int w in adj[u]) if (seen.Add(w)) next.Add(w);
                  }
                  level = next;
              }
              return minutes;
          }

          static void Link(Dictionary<int, List<int>> adj, int a, int b)
          {
              if (!adj.ContainsKey(a)) adj[a] = new List<int>();
              if (!adj.ContainsKey(b)) adj[b] = new List<int>();
              adj[a].Add(b);
              adj[b].Add(a);
          }
        `,
        go: code`
          func amountOfTime(root *TreeNode, start int) int {
              adj := map[int][]int{}
              stack := []*TreeNode{root}
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  for _, child := range []*TreeNode{node.Left, node.Right} {
                      if child == nil {
                          continue
                      }
                      adj[node.Val] = append(adj[node.Val], child.Val)
                      adj[child.Val] = append(adj[child.Val], node.Val)
                      stack = append(stack, child)
                  }
              }
              seen := map[int]bool{start: true}
              level := []int{start}
              minutes := -1
              for len(level) > 0 {
                  minutes++
                  next := []int{}
                  for _, u := range level {
                      for _, w := range adj[u] {
                          if !seen[w] {
                              seen[w] = true
                              next = append(next, w)
                          }
                      }
                  }
                  level = next
              }
              return minutes
          }
        `,
        kotlin: kt(`
          fun amountOfTime(root: TreeNode?, start: Int): Int {
              val adj = HashMap<Int, ArrayList<Int>>()
              val stack = ArrayList<TreeNode>()
              if (root != null) stack.add(root)
              while (stack.isNotEmpty()) {
                  val node = stack.removeAt(stack.size - 1)
                  for (child in listOf(node.left, node.right)) {
                      if (child == null) continue
                      adj.getOrPut(node.\`val\`) { ArrayList() }.add(child.\`val\`)
                      adj.getOrPut(child.\`val\`) { ArrayList() }.add(node.\`val\`)
                      stack.add(child)
                  }
              }
              val seen = HashSet<Int>()
              seen.add(start)
              var level = arrayListOf(start)
              var minutes = -1
              while (level.isNotEmpty()) {
                  minutes++
                  val next = ArrayList<Int>()
                  for (u in level) {
                      val ns = adj[u] ?: continue
                      for (w in ns) if (seen.add(w)) next.add(w)
                  }
                  level = next
              }
              return minutes
          }
        `),
        swift: code`
          func amountOfTime(_ root: TreeNode?, _ start: Int) -> Int {
              var adj: [Int: [Int]] = [:]
              var stack: [TreeNode] = []
              if let r = root { stack.append(r) }
              while let node = stack.popLast() {
                  for child in [node.left, node.right] {
                      guard let c = child else { continue }
                      adj[node.val, default: []].append(c.val)
                      adj[c.val, default: []].append(node.val)
                      stack.append(c)
                  }
              }
              var seen: Set<Int> = [start]
              var level = [start]
              var minutes = -1
              while !level.isEmpty {
                  minutes += 1
                  var next: [Int] = []
                  for u in level {
                      for w in adj[u] ?? [] where !seen.contains(w) {
                          seen.insert(w)
                          next.append(w)
                      }
                  }
                  level = next
              }
              return minutes
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::{HashMap, HashSet};

          fn amountOfTime(root: Option<Rc<RefCell<TreeNode>>>, start: i32) -> i32 {
              let mut adj: HashMap<i32, Vec<i32>> = HashMap::new();
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  stack.push(r);
              }
              while let Some(node) = stack.pop() {
                  let b = node.borrow();
                  for child in [&b.left, &b.right].iter() {
                      if let Some(c) = child {
                          let cv = c.borrow().val;
                          adj.entry(b.val).or_insert_with(Vec::new).push(cv);
                          adj.entry(cv).or_insert_with(Vec::new).push(b.val);
                          stack.push(c.clone());
                      }
                  }
              }
              let mut seen: HashSet<i32> = HashSet::new();
              seen.insert(start);
              let mut level = vec![start];
              let mut minutes = -1;
              while !level.is_empty() {
                  minutes += 1;
                  let mut next: Vec<i32> = Vec::new();
                  for u in &level {
                      if let Some(ns) = adj.get(u) {
                          for &w in ns {
                              if seen.insert(w) {
                                  next.push(w);
                              }
                          }
                      }
                  }
                  level = next;
              }
              minutes
          }
        `,
        php: code`
          function amountOfTime($root, $start) {
              $adj = [];
              $stack = [$root];
              while (count($stack) > 0) {
                  $node = array_pop($stack);
                  foreach ([$node->left, $node->right] as $child) {
                      if ($child === null) continue;
                      $adj[$node->val][] = $child->val;
                      $adj[$child->val][] = $node->val;
                      $stack[] = $child;
                  }
              }
              $seen = [$start => true];
              $level = [$start];
              $minutes = -1;
              while (count($level) > 0) {
                  $minutes++;
                  $next = [];
                  foreach ($level as $u) {
                      if (!isset($adj[$u])) continue;
                      foreach ($adj[$u] as $w) {
                          if (!isset($seen[$w])) { $seen[$w] = true; $next[] = $w; }
                      }
                  }
                  $level = $next;
              }
              return $minutes;
          }
        `,
        ruby: code`
          def amountOfTime(root, start)
            adj = Hash.new { |h, k| h[k] = [] }
            stack = [root]
            until stack.empty?
              node = stack.pop
              [node.left, node.right].each do |child|
                next if child.nil?
                adj[node.val] << child.val
                adj[child.val] << node.val
                stack << child
              end
            end
            seen = { start => true }
            level = [start]
            minutes = -1
            until level.empty?
              minutes += 1
              nxt = []
              level.each do |u|
                adj[u].each do |w|
                  next if seen[w]
                  seen[w] = true
                  nxt << w
                end
              end
              level = nxt
            end
            minutes
          end
        `,
      },
    };
  })(),

  // ── Reverse Odd Levels of Binary Tree (LC 2415) ─────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const arr: number[] = [];
      levelNodes(root).forEach((level, d) => {
        const vals = level.map((n) => n.val);
        if (d % 2 === 1) vals.reverse();
        arr.push(...vals);
      });
      return treeFrom(arr);
    };
    const perfect = (rng: Rng, depth: number, hi: number) => treeFrom(Array.from({ length: 2 ** (depth + 1) - 1 }, () => ri(rng, 0, hi)));
    const EX = [
      { root: [2, 3, 5, 8, 13, 21, 34], note: "Only level 1 is odd: [3, 5] becomes [5, 3]." },
      { root: [7, 13, 11], note: "Level 1 [13, 11] becomes [11, 13]." },
      { root: [0, 1, 2, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2], note: "Levels 1 and 3 are reversed: [1, 2] → [2, 1] and [1, 1, 1, 1, 2, 2, 2, 2] → [2, 2, 2, 2, 1, 1, 1, 1]." },
    ];
    return {
      slug: "reverse-odd-levels-of-binary-tree",
      title: "Reverse Odd Levels of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "reverseOddLevels", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a **perfect** binary tree (every inner node has two children and every leaf is on the same level).\n\nReverse the order of the node values on every **odd** level — the root is level `0` — leaving the tree's shape as it is, and return the root.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 2^14", "0 <= Node.val <= 10^5", "root is a perfect binary tree"]),
      hints: [
        "Reversing a level swaps its first and last value, its second and second-to-last, and so on — mirror-image pairs.",
        "In a perfect tree, if `a` and `b` are mirror images, then `a.left` mirrors `b.right` and `a.right` mirrors `b.left`.",
        "Walk mirror pairs together starting from `(root.left, root.right)`, swapping their values whenever the level is odd.",
      ],
      editorial: explain({
        idea: "Reversing a level means swapping values between mirror-image nodes. Mirror pairs are easy to walk in a perfect tree: the children of a mirror pair `(a, b)` form the pairs `(a.left, b.right)` and `(a.right, b.left)`.",
        steps: [
          "Call `walk(root.left, root.right, level = 1)`.",
          "If the nodes are null, stop.",
          "If `level` is odd, swap `a.val` and `b.val`.",
          "Recurse on `(a.left, b.right, level + 1)` and `(a.right, b.left, level + 1)`.",
          "Return the root.",
        ],
        why: "The `i`-th node from the left on a level and the `i`-th from the right are mirror images about the root, and every node on a level below the root belongs to exactly one such pair reached from `(root.left, root.right)`. Swapping each pair once reverses the level; even levels are visited but left alone.",
        time: "O(n)",
        space: "O(h) = O(log n) for the recursion",
        pitfalls: [
          "Swapping node pointers instead of values must also rewire the parents — swapping values is simpler.",
          "Do not swap a pair twice (once from each side), which would undo the reversal; walking pairs avoids that.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const depth = pick(rng, [0, 1, 2, 3, 4, 4, 5]);
        const root = perfect(rng, depth, pick(rng, [9, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reverseOddLevels(root: Optional[TreeNode]) -> Optional[TreeNode]:
              def walk(a, b, level):
                  if a is None or b is None:
                      return
                  if level % 2 == 1:
                      a.val, b.val = b.val, a.val
                  walk(a.left, b.right, level + 1)
                  walk(a.right, b.left, level + 1)

              if root:
                  walk(root.left, root.right, 1)
              return root
        `,
        javascript: code`
          var reverseOddLevels = function(root) {
              if (root !== null) mirrorWalk(root.left, root.right, 1);
              return root;
          };

          var mirrorWalk = function(a, b, level) {
              if (a === null || b === null) return;
              if (level % 2 === 1) { var t = a.val; a.val = b.val; b.val = t; }
              mirrorWalk(a.left, b.right, level + 1);
              mirrorWalk(a.right, b.left, level + 1);
          };
        `,
        typescript: code`
          function reverseOddLevels(root: TreeNode | null): TreeNode | null {
              if (root !== null) mirrorWalk(root.left, root.right, 1);
              return root;
          }

          function mirrorWalk(a: TreeNode | null, b: TreeNode | null, level: number): void {
              if (a === null || b === null) return;
              if (level % 2 === 1) { var t = a.val; a.val = b.val; b.val = t; }
              mirrorWalk(a.left, b.right, level + 1);
              mirrorWalk(a.right, b.left, level + 1);
          }
        `,
        java: code`
          public static TreeNode reverseOddLevels(TreeNode root) {
              if (root != null) mirrorWalk(root.left, root.right, 1);
              return root;
          }

          static void mirrorWalk(TreeNode a, TreeNode b, int level) {
              if (a == null || b == null) return;
              if (level % 2 == 1) { int t = a.val; a.val = b.val; b.val = t; }
              mirrorWalk(a.left, b.right, level + 1);
              mirrorWalk(a.right, b.left, level + 1);
          }
        `,
        cpp: code`
          void mirrorWalk(TreeNode* a, TreeNode* b, int level);

          TreeNode* reverseOddLevels(TreeNode* root) {
              if (root) mirrorWalk(root->left, root->right, 1);
              return root;
          }

          void mirrorWalk(TreeNode* a, TreeNode* b, int level) {
              if (!a || !b) return;
              if (level % 2 == 1) swap(a->val, b->val);
              mirrorWalk(a->left, b->right, level + 1);
              mirrorWalk(a->right, b->left, level + 1);
          }
        `,
        c: code`
          static void mirrorWalk(struct TreeNode* a, struct TreeNode* b, int level);

          struct TreeNode* reverseOddLevels(struct TreeNode* root) {
              if (root != NULL) mirrorWalk(root->left, root->right, 1);
              return root;
          }

          static void mirrorWalk(struct TreeNode* a, struct TreeNode* b, int level) {
              if (a == NULL || b == NULL) return;
              if (level % 2 == 1) { int t = a->val; a->val = b->val; b->val = t; }
              mirrorWalk(a->left, b->right, level + 1);
              mirrorWalk(a->right, b->left, level + 1);
          }
        `,
        csharp: code`
          public static TreeNode ReverseOddLevels(TreeNode root)
          {
              if (root != null) MirrorWalk(root.left, root.right, 1);
              return root;
          }

          static void MirrorWalk(TreeNode a, TreeNode b, int level)
          {
              if (a == null || b == null) return;
              if (level % 2 == 1) { int t = a.val; a.val = b.val; b.val = t; }
              MirrorWalk(a.left, b.right, level + 1);
              MirrorWalk(a.right, b.left, level + 1);
          }
        `,
        go: code`
          func reverseOddLevels(root *TreeNode) *TreeNode {
              if root != nil {
                  mirrorWalk(root.Left, root.Right, 1)
              }
              return root
          }

          func mirrorWalk(a *TreeNode, b *TreeNode, level int) {
              if a == nil || b == nil {
                  return
              }
              if level%2 == 1 {
                  a.Val, b.Val = b.Val, a.Val
              }
              mirrorWalk(a.Left, b.Right, level+1)
              mirrorWalk(a.Right, b.Left, level+1)
          }
        `,
        kotlin: kt(`
          fun reverseOddLevels(root: TreeNode?): TreeNode? {
              if (root != null) mirrorWalk(root.left, root.right, 1)
              return root
          }

          fun mirrorWalk(a: TreeNode?, b: TreeNode?, level: Int) {
              if (a == null || b == null) return
              if (level % 2 == 1) {
                  val t = a.\`val\`
                  a.\`val\` = b.\`val\`
                  b.\`val\` = t
              }
              mirrorWalk(a.left, b.right, level + 1)
              mirrorWalk(a.right, b.left, level + 1)
          }
        `),
        swift: code`
          func reverseOddLevels(_ root: TreeNode?) -> TreeNode? {
              if let r = root { mirrorWalk(r.left, r.right, 1) }
              return root
          }

          func mirrorWalk(_ a: TreeNode?, _ b: TreeNode?, _ level: Int) {
              guard let x = a, let y = b else { return }
              if level % 2 == 1 {
                  let t = x.val
                  x.val = y.val
                  y.val = t
              }
              mirrorWalk(x.left, y.right, level + 1)
              mirrorWalk(x.right, y.left, level + 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn reverseOddLevels(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              if let Some(r) = &root {
                  let (l, rt) = {
                      let n = r.borrow();
                      (n.left.clone(), n.right.clone())
                  };
                  mirror_walk(&l, &rt, 1);
              }
              root
          }

          fn mirror_walk(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>, level: i32) {
              if let (Some(x), Some(y)) = (a, b) {
                  if level % 2 == 1 {
                      let vx = x.borrow().val;
                      let vy = y.borrow().val;
                      x.borrow_mut().val = vy;
                      y.borrow_mut().val = vx;
                  }
                  let (xl, xr) = {
                      let n = x.borrow();
                      (n.left.clone(), n.right.clone())
                  };
                  let (yl, yr) = {
                      let n = y.borrow();
                      (n.left.clone(), n.right.clone())
                  };
                  mirror_walk(&xl, &yr, level + 1);
                  mirror_walk(&xr, &yl, level + 1);
              }
          }
        `,
        php: code`
          function reverseOddLevels($root) {
              if ($root !== null) mirrorWalk($root->left, $root->right, 1);
              return $root;
          }

          function mirrorWalk($a, $b, $level) {
              if ($a === null || $b === null) return;
              if ($level % 2 == 1) { $t = $a->val; $a->val = $b->val; $b->val = $t; }
              mirrorWalk($a->left, $b->right, $level + 1);
              mirrorWalk($a->right, $b->left, $level + 1);
          }
        `,
        ruby: code`
          def reverseOddLevels(root)
            mirror_walk(root.left, root.right, 1) unless root.nil?
            root
          end

          def mirror_walk(a, b, level)
            return if a.nil? || b.nil?
            a.val, b.val = b.val, a.val if level.odd?
            mirror_walk(a.left, b.right, level + 1)
            mirror_walk(a.right, b.left, level + 1)
          end
        `,
      },
    };
  })(),
];

/**
 * Binary tree problems — wave 7, batch 29.
 * Real problems only: LeetCode numbered classics (level-order traversals,
 * BST validation and recovery, tree construction from traversals, path sums,
 * lowest common ancestors, House Robber III) and GeeksforGeeks staples (Count
 * BST Nodes in a Range, Sum of Leaf Nodes at Minimum Level, Level of a Node).
 * Worked examples are phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a tree is LeetCode's level order
 * with `null` for a missing child and trailing nulls dropped, `[]` for the
 * empty tree; every input and expected output here goes through
 * `fmtTree(treeFrom(…))` so it is always canonical. The node types are the
 * judge's — no solution redefines them. A problem LeetCode answers with "a
 * node" (the two Lowest Common Ancestor problems) returns its value, and node
 * values are distinct there; one LeetCode declares `void` (Recover Binary
 * Search Tree, Flatten Binary Tree to Linked List) returns the root after the
 * change; "in any order" (Path Sum II) is fixed to the left-to-right order of
 * the paths' leaves in the statement. LeetCode's `val` parameter names never
 * appear (Kotlin keyword) — the GFG target is `target`.
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel; JS
 * solutions are Node 12-safe (no ??, ?., at(), replaceAll, flat or flatMap);
 * the C harness has no math.h or limits.h. Each solution's main function comes
 * first — C and C++ declare their helpers with a prototype above it.
 *
 * Kotlin reads a node's value as `` n.`val` ``, and a code`…` block cannot
 * hold a backtick, so the Kotlin solutions go through `kt` below: a plain
 * template literal (where \` is a backtick) dedented by the same rules — so a
 * Kotlin solution here holds no backslash and no `${`.
 *
 * Generated trees stay at or under ~40 nodes so 5,000 hidden cases run well
 * inside the judge's 15 CPU seconds in Python, Ruby and PHP; the statements
 * keep the real constraints. Sum Root to Leaf Numbers regenerates a tree whose
 * total would leave int32 (LeetCode guarantees it fits); Path Sum III keeps its
 * ±10^9 values, so its running sums are 64-bit in every typed language.
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
function postorderOf(root: TNode | null): number[] {
  const out: number[] = [];
  const walk = (n: TNode | null) => { if (!n) return; walk(n.left); walk(n.right); out.push(n.val); };
  walk(root);
  return out;
}

/** The tree's values level by level, left to right. */
function levelsOf(root: TNode | null): number[][] {
  const out: number[][] = [];
  let level = root ? [root] : [];
  while (level.length) {
    out.push(level.map((n) => n.val));
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

/** A random tree of about n nodes whose root-to-leaf paths hold at most maxDepth nodes. */
function depthTree(rng: Rng, n: number, maxDepth: number, lo: number, hi: number): TNode | null {
  if (n <= 0) return null;
  const root: TNode = { val: ri(rng, lo, hi), left: null, right: null };
  const nodes: Array<[TNode, number]> = [[root, 1]];
  let guard = 0;
  while (nodes.length < n && guard++ < 50 * n) {
    const [p, d] = nodes[ri(rng, 0, nodes.length - 1)];
    if (d >= maxDepth) continue;
    const side = rng() < 0.5 ? "left" : "right";
    if (!p[side]) { const c: TNode = { val: ri(rng, lo, hi), left: null, right: null }; p[side] = c; nodes.push([c, d + 1]); }
  }
  return root;
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

const sizeOf = (rng: Rng, caps: number[]) => ri(rng, 1, pick(rng, caps));

export const TREES3_PROBLEMS: CatalogProblem[] = [

  // ── Count BST Nodes That Lie in a Given Range (GFG) ─────────────
  (() => {
    const ref = (root: TNode | null, low: number, high: number) => nodesOf(root).filter((n) => n.val >= low && n.val <= high).length;
    const EX = [
      { root: [10, 5, 50, 1, null, 40, 100], low: 5, high: 45, note: "5, 10 and 40 lie in [5, 45]; 1, 50 and 100 do not." },
      { root: [5, 4, 6, 3, null, null, 7], low: 2, high: 8, note: "Every node lies in [2, 8]." },
      { root: [8, 3, 10], low: 4, high: 7, note: "No value lies between 4 and 7." },
    ];
    return {
      slug: "count-bst-nodes-in-a-range",
      title: "Count BST Nodes That Lie in a Given Range",
      difficulty: "EASY" as const,
      tags: ["Tree", "Binary Search", "Depth-First Search", "Amazon", "Microsoft"],
      signature: { funcName: "getCount", params: [{ name: "root", type: "TreeNode" as const }, { name: "low", type: "int" as const }, { name: "high", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** (every value in a node's left subtree is smaller than the node's value, every value in its right subtree is larger) and two integers `low` and `high`.\n\nReturn how many nodes hold a value in the inclusive range `[low, high]`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, low = ${e.low}, high = ${e.high}`, out: String(ref(treeFrom(e.root), e.low, e.high)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "root is a valid binary search tree", "1 <= low <= high <= 10^5"]),
      hints: [
        "Visiting every node and testing it works, but the ordering lets you skip whole subtrees.",
        "If a node's value is below `low`, nothing in its left subtree can be in range — and symmetrically above `high`.",
        "Count the node and descend both ways only when its value is inside the range; otherwise descend into the one side that can still hold in-range values.",
      ],
      editorial: explain({
        idea: "A node outside the range rules out one of its subtrees entirely, so the search only enters the parts of the tree that can still contain in-range values.",
        steps: [
          "If the node is null, it contributes 0.",
          "If its value is below `low`, return the count of its right subtree (the left one is smaller still).",
          "If its value is above `high`, return the count of its left subtree.",
          "Otherwise return 1 plus the counts of both subtrees.",
        ],
        why: "Every value in the left subtree of a node below `low` is smaller than that node and so below `low` too; skipping it loses nothing. The same holds for the right subtree of a node above `high`. Every node that is in range is reached, because its ancestors are either in range (both sides explored) or out of range on the side that keeps it.",
        time: "O(h + k), h the height and k the number of nodes in range",
        space: "O(h) for the recursion",
        pitfalls: [
          "Both ends are inclusive: a node equal to `low` or `high` counts.",
          "Do not stop at a node outside the range — its other subtree can still hold in-range values.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.low}\n${e.high}`, expectedOutput: String(ref(treeFrom(e.root), e.low, e.high)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 2, 100, 100000]);
        const root = bstOf(rng, n, 1, hi);
        let a = ri(rng, 1, hi), b = rng() < 0.1 ? a : ri(rng, 1, hi);
        if (a > b) { const t = a; a = b; b = t; }
        return { input: `${fmtTree(root)}\n${a}\n${b}`, expectedOutput: String(ref(root, a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getCount(root: Optional[TreeNode], low: int, high: int) -> int:
              if root is None:
                  return 0
              if root.val < low:
                  return getCount(root.right, low, high)
              if root.val > high:
                  return getCount(root.left, low, high)
              return 1 + getCount(root.left, low, high) + getCount(root.right, low, high)
        `,
        javascript: code`
          var getCount = function(root, low, high) {
              if (root === null) return 0;
              if (root.val < low) return getCount(root.right, low, high);
              if (root.val > high) return getCount(root.left, low, high);
              return 1 + getCount(root.left, low, high) + getCount(root.right, low, high);
          };
        `,
        typescript: code`
          function getCount(root: TreeNode | null, low: number, high: number): number {
              if (root === null) return 0;
              if (root.val < low) return getCount(root.right, low, high);
              if (root.val > high) return getCount(root.left, low, high);
              return 1 + getCount(root.left, low, high) + getCount(root.right, low, high);
          }
        `,
        java: code`
          public static int getCount(TreeNode root, int low, int high) {
              if (root == null) return 0;
              if (root.val < low) return getCount(root.right, low, high);
              if (root.val > high) return getCount(root.left, low, high);
              return 1 + getCount(root.left, low, high) + getCount(root.right, low, high);
          }
        `,
        cpp: code`
          int getCount(TreeNode* root, int low, int high) {
              if (!root) return 0;
              if (root->val < low) return getCount(root->right, low, high);
              if (root->val > high) return getCount(root->left, low, high);
              return 1 + getCount(root->left, low, high) + getCount(root->right, low, high);
          }
        `,
        c: code`
          int getCount(struct TreeNode* root, int low, int high) {
              if (root == NULL) return 0;
              if (root->val < low) return getCount(root->right, low, high);
              if (root->val > high) return getCount(root->left, low, high);
              return 1 + getCount(root->left, low, high) + getCount(root->right, low, high);
          }
        `,
        csharp: code`
          public static int GetCount(TreeNode root, int low, int high)
          {
              if (root == null) return 0;
              if (root.val < low) return GetCount(root.right, low, high);
              if (root.val > high) return GetCount(root.left, low, high);
              return 1 + GetCount(root.left, low, high) + GetCount(root.right, low, high);
          }
        `,
        go: code`
          func getCount(root *TreeNode, low int, high int) int {
              if root == nil {
                  return 0
              }
              if root.Val < low {
                  return getCount(root.Right, low, high)
              }
              if root.Val > high {
                  return getCount(root.Left, low, high)
              }
              return 1 + getCount(root.Left, low, high) + getCount(root.Right, low, high)
          }
        `,
        kotlin: kt(`
          fun getCount(root: TreeNode?, low: Int, high: Int): Int {
              if (root == null) return 0
              val v = root.\`val\`
              if (v < low) return getCount(root.right, low, high)
              if (v > high) return getCount(root.left, low, high)
              return 1 + getCount(root.left, low, high) + getCount(root.right, low, high)
          }
        `),
        swift: code`
          func getCount(_ root: TreeNode?, _ low: Int, _ high: Int) -> Int {
              guard let node = root else { return 0 }
              if node.val < low { return getCount(node.right, low, high) }
              if node.val > high { return getCount(node.left, low, high) }
              return 1 + getCount(node.left, low, high) + getCount(node.right, low, high)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn getCount(root: Option<Rc<RefCell<TreeNode>>>, low: i32, high: i32) -> i32 {
              count_in(&root, low, high)
          }

          fn count_in(node: &Option<Rc<RefCell<TreeNode>>>, low: i32, high: i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      if n.val < low {
                          count_in(&n.right, low, high)
                      } else if n.val > high {
                          count_in(&n.left, low, high)
                      } else {
                          1 + count_in(&n.left, low, high) + count_in(&n.right, low, high)
                      }
                  }
              }
          }
        `,
        php: code`
          function getCount($root, $low, $high) {
              if ($root === null) return 0;
              if ($root->val < $low) return getCount($root->right, $low, $high);
              if ($root->val > $high) return getCount($root->left, $low, $high);
              return 1 + getCount($root->left, $low, $high) + getCount($root->right, $low, $high);
          }
        `,
        ruby: code`
          def getCount(root, low, high)
            return 0 if root.nil?
            return getCount(root.right, low, high) if root.val < low
            return getCount(root.left, low, high) if root.val > high
            1 + getCount(root.left, low, high) + getCount(root.right, low, high)
          end
        `,
      },
    };
  })(),

  // ── Sum of Leaf Nodes at Minimum Level (GFG) ────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      for (const level of levelNodes(root)) {
        const leaves = level.filter(isLeaf);
        if (leaves.length) return leaves.reduce((s, n) => s + n.val, 0);
      }
      return 0;
    };
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
    const EX = [
      { root: [1, 2, 3, 4, 5, 8, 7, 2], note: "Level 3 is the first level holding leaves: 5, 8 and 7 (4 still has a child), so the sum is 20. The leaf 2 sits a level lower and is ignored." },
      { root: [1, 2, 3, null, null, 4, 5, 8, 7], note: "2 is a leaf on level 2, the shallowest level with a leaf, and the only leaf there." },
      { root: [6], note: "The root alone is a leaf." },
    ];
    return {
      slug: "sum-of-leaf-nodes-at-minimum-level",
      title: "Sum of Leaf Nodes at Minimum Level",
      difficulty: "EASY" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Microsoft"],
      signature: { funcName: "minLeafSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, find the shallowest level that contains at least one **leaf** (a node with no children) and return the sum of the values of all the leaves on that level.\n\nThe root is on level 1. Return `0` for an empty tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 10^3", "1 <= Node.val <= 10^3"]),
      hints: [
        "The answer only concerns one level: the first one, from the top, that has a leaf.",
        "Walk the tree level by level (breadth-first) so that levels are met in order of depth.",
        "On each level add up the values of the nodes with no children; as soon as a level produced any, return its sum without going deeper.",
      ],
      editorial: explain({
        idea: "A breadth-first walk meets the levels from the top down, so the first level on which a leaf appears is the minimum level — sum its leaves and stop.",
        steps: [
          "If the tree is empty, return 0.",
          "Start with the level holding only the root.",
          "For the current level, add up the values of the nodes with no children, and collect every child into the next level.",
          "If the current level had at least one leaf, return the sum; otherwise move to the next level.",
        ],
        why: "Every level above the returned one was scanned completely and held no leaf, and the returned level holds at least one, so it is exactly the minimum leaf level; every leaf on it is added because the whole level is scanned before returning.",
        time: "O(n) in the worst case, and it stops early at the first leaf level",
        space: "O(w), w the largest number of nodes on one level",
        pitfalls: [
          "Return after finishing the level, not at the first leaf found — other leaves on the same level belong in the sum.",
          "A depth-first search must still visit the whole tree to know the minimum depth; the level walk can stop early.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.03 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [9, 100, 1000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def minLeafSum(root: Optional[TreeNode]) -> int:
              level = [root] if root else []
              while level:
                  total = 0
                  found = False
                  nxt = []
                  for node in level:
                      if node.left is None and node.right is None:
                          total += node.val
                          found = True
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  if found:
                      return total
                  level = nxt
              return 0
        `,
        javascript: code`
          var minLeafSum = function(root) {
              var level = root === null ? [] : [root];
              while (level.length > 0) {
                  var total = 0, found = false, next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.left === null && node.right === null) { total += node.val; found = true; }
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  if (found) return total;
                  level = next;
              }
              return 0;
          };
        `,
        typescript: code`
          function minLeafSum(root: TreeNode | null): number {
              var level: TreeNode[] = root === null ? [] : [root];
              while (level.length > 0) {
                  var total = 0, found = false;
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.left === null && node.right === null) { total += node.val; found = true; }
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  if (found) return total;
                  level = next;
              }
              return 0;
          }
        `,
        java: code`
          public static int minLeafSum(TreeNode root) {
              List<TreeNode> level = new ArrayList<>();
              if (root != null) level.add(root);
              while (!level.isEmpty()) {
                  int total = 0;
                  boolean found = false;
                  List<TreeNode> next = new ArrayList<>();
                  for (TreeNode node : level) {
                      if (node.left == null && node.right == null) { total += node.val; found = true; }
                      if (node.left != null) next.add(node.left);
                      if (node.right != null) next.add(node.right);
                  }
                  if (found) return total;
                  level = next;
              }
              return 0;
          }
        `,
        cpp: code`
          int minLeafSum(TreeNode* root) {
              vector<TreeNode*> level;
              if (root) level.push_back(root);
              while (!level.empty()) {
                  int total = 0;
                  bool found = false;
                  vector<TreeNode*> next;
                  for (TreeNode* node : level) {
                      if (!node->left && !node->right) { total += node->val; found = true; }
                      if (node->left) next.push_back(node->left);
                      if (node->right) next.push_back(node->right);
                  }
                  if (found) return total;
                  level.swap(next);
              }
              return 0;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int minLeafSum(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, answer = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail, total = 0, found = 0;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      if (node->left == NULL && node->right == NULL) { total += node->val; found = 1; }
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  if (found) { answer = total; break; }
              }
              free(queue);
              return answer;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int MinLeafSum(TreeNode root)
          {
              var level = new List<TreeNode>();
              if (root != null) level.Add(root);
              while (level.Count > 0)
              {
                  int total = 0;
                  bool found = false;
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      if (node.left == null && node.right == null) { total += node.val; found = true; }
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  if (found) return total;
                  level = next;
              }
              return 0;
          }
        `,
        go: code`
          func minLeafSum(root *TreeNode) int {
              level := []*TreeNode{}
              if root != nil {
                  level = append(level, root)
              }
              for len(level) > 0 {
                  total, found := 0, false
                  next := []*TreeNode{}
                  for _, node := range level {
                      if node.Left == nil && node.Right == nil {
                          total += node.Val
                          found = true
                      }
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  if found {
                      return total
                  }
                  level = next
              }
              return 0
          }
        `,
        kotlin: kt(`
          fun minLeafSum(root: TreeNode?): Int {
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  var total = 0
                  var found = false
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      val l = node.left
                      val r = node.right
                      if (l == null && r == null) { total += node.\`val\`; found = true }
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  if (found) return total
                  level = next
              }
              return 0
          }
        `),
        swift: code`
          func minLeafSum(_ root: TreeNode?) -> Int {
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  var total = 0
                  var found = false
                  var next: [TreeNode] = []
                  for node in level {
                      if node.left == nil && node.right == nil { total += node.val; found = true }
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  if found { return total }
                  level = next
              }
              return 0
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn minLeafSum(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let mut total = 0;
                  let mut found = false;
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      if b.left.is_none() && b.right.is_none() {
                          total += b.val;
                          found = true;
                      }
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  if found {
                      return total;
                  }
                  level = next;
              }
              0
          }
        `,
        php: code`
          function minLeafSum($root) {
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $total = 0;
                  $found = false;
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->left === null && $node->right === null) { $total += $node->val; $found = true; }
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  if ($found) return $total;
                  $level = $next;
              }
              return 0;
          }
        `,
        ruby: code`
          def minLeafSum(root)
            level = root.nil? ? [] : [root]
            until level.empty?
              total = 0
              found = false
              nxt = []
              level.each do |node|
                if node.left.nil? && node.right.nil?
                  total += node.val
                  found = true
                end
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              return total if found
              level = nxt
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Level of a Node in Binary Tree (GFG) ────────────────────────
  (() => {
    const ref = (root: TNode | null, target: number) => {
      const levels = levelsOf(root);
      for (let i = 0; i < levels.length; i++) if (levels[i].includes(target)) return i + 1;
      return 0;
    };
    const EX = [
      { root: [3, 2, 5, 1, 4], target: 4, note: "3 is on level 1, 2 and 5 on level 2, and 1 and 4 on level 3." },
      { root: [3, 2, 5, 1, 4], target: 3, note: "The root itself is on level 1." },
      { root: [7, null, 9, 8], target: 10, note: "No node holds 10." },
    ];
    return {
      slug: "level-of-a-node-in-binary-tree",
      title: "Level of a Node in Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Breadth-First Search", "Depth-First Search", "Amazon", "Samsung"],
      signature: { funcName: "getLevel", params: [{ name: "root", type: "TreeNode" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree whose node values are all **distinct**, and an integer `target`, return the level of the node whose value is `target`.\n\nThe root is on level 1, its children on level 2, and so on. If no node holds `target`, return `0`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, target = ${e.target}`, out: String(ref(treeFrom(e.root), e.target)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "1 <= target <= 10^5"]),
      hints: [
        "A node's level is one more than its parent's.",
        "A breadth-first walk processes the tree one whole level at a time — keep a counter of the level being processed.",
        "Return the counter as soon as a node of the current level holds `target`; if the walk ends without meeting it, return 0.",
      ],
      editorial: explain({
        idea: "Walk the tree level by level with a counter; the counter's value when `target` turns up is its level.",
        steps: [
          "Start with the level holding only the root and a counter of 1.",
          "Scan the current level: if any node holds `target`, return the counter.",
          "Otherwise gather every child into the next level and add 1 to the counter.",
          "When no level is left, return 0.",
        ],
        why: "The k-th level processed holds exactly the nodes k − 1 edges below the root, so the counter equals the level of every node being scanned. Values are distinct, so the first match is the only one.",
        time: "O(n)",
        space: "O(w), w the largest number of nodes on one level",
        pitfalls: [
          "Levels start at 1 for the root here, not 0.",
          "A depth-first search works too, but carry the depth down with the call rather than counting returns on the way up.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}`, expectedOutput: String(ref(treeFrom(e.root), e.target)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const hi = pick(rng, [n + 3, 100, 100000]);
        const root = distinctVals(rng, shapeTree(rng, n, 1, 1), 1, hi);
        const target = rng() < 0.75 ? pick(rng, nodesOf(root).map((x) => x.val)) : ri(rng, 1, hi);
        return { input: `${fmtTree(root)}\n${target}`, expectedOutput: String(ref(root, target)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getLevel(root: Optional[TreeNode], target: int) -> int:
              level = [root] if root else []
              depth = 1
              while level:
                  nxt = []
                  for node in level:
                      if node.val == target:
                          return depth
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
                  depth += 1
              return 0
        `,
        javascript: code`
          var getLevel = function(root, target) {
              var level = root === null ? [] : [root], depth = 1;
              while (level.length > 0) {
                  var next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.val === target) return depth;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  level = next;
                  depth++;
              }
              return 0;
          };
        `,
        typescript: code`
          function getLevel(root: TreeNode | null, target: number): number {
              var level: TreeNode[] = root === null ? [] : [root];
              var depth = 1;
              while (level.length > 0) {
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.val === target) return depth;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  level = next;
                  depth++;
              }
              return 0;
          }
        `,
        java: code`
          public static int getLevel(TreeNode root, int target) {
              List<TreeNode> level = new ArrayList<>();
              if (root != null) level.add(root);
              int depth = 1;
              while (!level.isEmpty()) {
                  List<TreeNode> next = new ArrayList<>();
                  for (TreeNode node : level) {
                      if (node.val == target) return depth;
                      if (node.left != null) next.add(node.left);
                      if (node.right != null) next.add(node.right);
                  }
                  level = next;
                  depth++;
              }
              return 0;
          }
        `,
        cpp: code`
          int getLevel(TreeNode* root, int target) {
              vector<TreeNode*> level;
              if (root) level.push_back(root);
              int depth = 1;
              while (!level.empty()) {
                  vector<TreeNode*> next;
                  for (TreeNode* node : level) {
                      if (node->val == target) return depth;
                      if (node->left) next.push_back(node->left);
                      if (node->right) next.push_back(node->right);
                  }
                  level.swap(next);
                  depth++;
              }
              return 0;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int getLevel(struct TreeNode* root, int target) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, depth = 1, answer = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail && answer == 0) {
                  int end = tail;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      if (node->val == target) { answer = depth; break; }
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  depth++;
              }
              free(queue);
              return answer;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int GetLevel(TreeNode root, int target)
          {
              var level = new List<TreeNode>();
              if (root != null) level.Add(root);
              int depth = 1;
              while (level.Count > 0)
              {
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      if (node.val == target) return depth;
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  level = next;
                  depth++;
              }
              return 0;
          }
        `,
        go: code`
          func getLevel(root *TreeNode, target int) int {
              level := []*TreeNode{}
              if root != nil {
                  level = append(level, root)
              }
              for depth := 1; len(level) > 0; depth++ {
                  next := []*TreeNode{}
                  for _, node := range level {
                      if node.Val == target {
                          return depth
                      }
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  level = next
              }
              return 0
          }
        `,
        kotlin: kt(`
          fun getLevel(root: TreeNode?, target: Int): Int {
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              var depth = 1
              while (level.isNotEmpty()) {
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      if (node.\`val\` == target) return depth
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
                  depth++
              }
              return 0
          }
        `),
        swift: code`
          func getLevel(_ root: TreeNode?, _ target: Int) -> Int {
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              var depth = 1
              while !level.isEmpty {
                  var next: [TreeNode] = []
                  for node in level {
                      if node.val == target { return depth }
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
                  depth += 1
              }
              return 0
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn getLevel(root: Option<Rc<RefCell<TreeNode>>>, target: i32) -> i32 {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              let mut depth = 1;
              while !level.is_empty() {
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      if b.val == target {
                          return depth;
                      }
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
              0
          }
        `,
        php: code`
          function getLevel($root, $target) {
              $level = $root === null ? [] : [$root];
              $depth = 1;
              while (count($level) > 0) {
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->val == $target) return $depth;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $level = $next;
                  $depth++;
              }
              return 0;
          }
        `,
        ruby: code`
          def getLevel(root, target)
            level = root.nil? ? [] : [root]
            depth = 1
            until level.empty?
              nxt = []
              level.each do |node|
                return depth if node.val == target
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
              depth += 1
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Construct String from Binary Tree (LC 606) ──────────────────
  (() => {
    const ref = (root: TNode | null): string => {
      if (!root) return "";
      let s = String(root.val);
      if (root.left || root.right) s += `(${ref(root.left)})`;
      if (root.right) s += `(${ref(root.right)})`;
      return s;
    };
    const EX = [
      { root: [1, 2, 3, 4], note: "2 has only a left child, so its empty right pair is dropped: `1(2(4))(3)`." },
      { root: [1, 2, 3, null, 4], note: "2 has only a right child; its empty left pair `()` must stay, or 4 would read as a left child." },
      { root: [-5, null, 7], note: "Negative values are written with their sign; the empty left pair stays because a right child follows." },
    ];
    return {
      slug: "construct-string-from-binary-tree",
      title: "Construct String from Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "String", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "tree2str", params: [{ name: "root", type: "TreeNode" as const }], returns: "string" as const },
      description: describe(
        "Given the `root` of a binary tree, write it as a string in **preorder**: a node is its value, followed by its left subtree in parentheses, followed by its right subtree in parentheses.\n\nLeave out every pair of empty parentheses that is not needed to read the tree back unambiguously:\n\n- a node with no children is just its value;\n- a node with only a left child drops the empty pair for its right child;\n- a node with only a right child **keeps** an empty pair `()` for its missing left child.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: ref(treeFrom(e.root)), note: e.note })),
        ["1 <= number of nodes <= 10^4", "-1000 <= Node.val <= 1000"]),
      hints: [
        "The string is a preorder walk: the node's value, then the left subtree, then the right subtree.",
        "Wrap each subtree's string in parentheses — the question is only when an empty subtree may be left out.",
        "Write the left pair whenever the node has any child (it is `()` when the left child is missing), and the right pair only when there is a right child.",
      ],
      editorial: explain({
        idea: "Emit the tree in preorder, putting each subtree in parentheses, and keep an empty pair only where dropping it would let a right child be read as a left one.",
        steps: [
          "Write the node's value.",
          "If the node has a left or a right child, write `(`, the left subtree's string (empty if there is none), and `)`.",
          "If the node has a right child, write `(`, the right subtree's string, and `)`.",
          "Build the string in one buffer by recursing from the root.",
        ],
        why: "A reader takes the first parenthesised group after a value as the left subtree and the second as the right. A missing right child leaves no second group, which reads correctly; a missing left child before a present right child needs the placeholder `()`, or the right subtree would occupy the first group. Leaves need neither.",
        time: "O(n)",
        space: "O(n) for the output and O(h) for the recursion",
        pitfalls: [
          "Dropping `()` before a right child changes the tree the string describes.",
          "Concatenating strings returned by every call can cost O(n^2) on a chain; append to one shared buffer.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: ref(treeFrom(e.root)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[0, 9], [-9, 9], [-1000, 1000]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: ref(root) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def tree2str(root: Optional[TreeNode]) -> str:
              out = []

              def walk(node):
                  out.append(str(node.val))
                  if node.left or node.right:
                      out.append("(")
                      if node.left:
                          walk(node.left)
                      out.append(")")
                  if node.right:
                      out.append("(")
                      walk(node.right)
                      out.append(")")

              if root is not None:
                  walk(root)
              return "".join(out)
        `,
        javascript: code`
          var tree2str = function(root) {
              var out = [];
              if (root !== null) strWalk(root, out);
              return out.join("");
          };

          var strWalk = function(node, out) {
              out.push(String(node.val));
              if (node.left !== null || node.right !== null) {
                  out.push("(");
                  if (node.left !== null) strWalk(node.left, out);
                  out.push(")");
              }
              if (node.right !== null) {
                  out.push("(");
                  strWalk(node.right, out);
                  out.push(")");
              }
          };
        `,
        typescript: code`
          function tree2str(root: TreeNode | null): string {
              var out: string[] = [];
              if (root !== null) strWalk(root, out);
              return out.join("");
          }

          function strWalk(node: TreeNode, out: string[]): void {
              out.push(String(node.val));
              if (node.left !== null || node.right !== null) {
                  out.push("(");
                  if (node.left !== null) strWalk(node.left, out);
                  out.push(")");
              }
              if (node.right !== null) {
                  out.push("(");
                  strWalk(node.right, out);
                  out.push(")");
              }
          }
        `,
        java: code`
          public static String tree2str(TreeNode root) {
              StringBuilder sb = new StringBuilder();
              if (root != null) strWalk(root, sb);
              return sb.toString();
          }

          static void strWalk(TreeNode node, StringBuilder sb) {
              sb.append(node.val);
              if (node.left != null || node.right != null) {
                  sb.append('(');
                  if (node.left != null) strWalk(node.left, sb);
                  sb.append(')');
              }
              if (node.right != null) {
                  sb.append('(');
                  strWalk(node.right, sb);
                  sb.append(')');
              }
          }
        `,
        cpp: code`
          void strWalk(TreeNode* node, string& out);

          string tree2str(TreeNode* root) {
              string out;
              if (root) strWalk(root, out);
              return out;
          }

          void strWalk(TreeNode* node, string& out) {
              out += to_string(node->val);
              if (node->left || node->right) {
                  out += '(';
                  if (node->left) strWalk(node->left, out);
                  out += ')';
              }
              if (node->right) {
                  out += '(';
                  strWalk(node->right, out);
                  out += ')';
              }
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void strWalk(struct TreeNode* node, char* buf, int* pos);

          char* tree2str(struct TreeNode* root) {
              int n = countNodes(root);
              char* buf = (char*) malloc((size_t) n * 16 + 1);
              int pos = 0;
              if (root != NULL) strWalk(root, buf, &pos);
              buf[pos] = '\0';
              return buf;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void strWalk(struct TreeNode* node, char* buf, int* pos) {
              *pos += sprintf(buf + *pos, "%d", node->val);
              if (node->left != NULL || node->right != NULL) {
                  buf[(*pos)++] = '(';
                  if (node->left != NULL) strWalk(node->left, buf, pos);
                  buf[(*pos)++] = ')';
              }
              if (node->right != NULL) {
                  buf[(*pos)++] = '(';
                  strWalk(node->right, buf, pos);
                  buf[(*pos)++] = ')';
              }
          }
        `,
        csharp: code`
          public static string Tree2str(TreeNode root)
          {
              var sb = new System.Text.StringBuilder();
              if (root != null) StrWalk(root, sb);
              return sb.ToString();
          }

          static void StrWalk(TreeNode node, System.Text.StringBuilder sb)
          {
              sb.Append(node.val);
              if (node.left != null || node.right != null)
              {
                  sb.Append('(');
                  if (node.left != null) StrWalk(node.left, sb);
                  sb.Append(')');
              }
              if (node.right != null)
              {
                  sb.Append('(');
                  StrWalk(node.right, sb);
                  sb.Append(')');
              }
          }
        `,
        go: code`
          func tree2str(root *TreeNode) string {
              var sb strings.Builder
              var walk func(node *TreeNode)
              walk = func(node *TreeNode) {
                  sb.WriteString(strconv.Itoa(node.Val))
                  if node.Left != nil || node.Right != nil {
                      sb.WriteByte('(')
                      if node.Left != nil {
                          walk(node.Left)
                      }
                      sb.WriteByte(')')
                  }
                  if node.Right != nil {
                      sb.WriteByte('(')
                      walk(node.Right)
                      sb.WriteByte(')')
                  }
              }
              if root != nil {
                  walk(root)
              }
              return sb.String()
          }
        `,
        kotlin: kt(`
          fun tree2str(root: TreeNode?): String {
              val sb = StringBuilder()
              if (root != null) strWalk(root, sb)
              return sb.toString()
          }

          fun strWalk(node: TreeNode, sb: StringBuilder) {
              sb.append(node.\`val\`)
              val l = node.left
              val r = node.right
              if (l != null || r != null) {
                  sb.append('(')
                  if (l != null) strWalk(l, sb)
                  sb.append(')')
              }
              if (r != null) {
                  sb.append('(')
                  strWalk(r, sb)
                  sb.append(')')
              }
          }
        `),
        swift: code`
          func tree2str(_ root: TreeNode?) -> String {
              var out = ""
              if let r = root { strWalk(r, &out) }
              return out
          }

          func strWalk(_ node: TreeNode, _ out: inout String) {
              out += String(node.val)
              if node.left != nil || node.right != nil {
                  out += "("
                  if let l = node.left { strWalk(l, &out) }
                  out += ")"
              }
              if let r = node.right {
                  out += "("
                  strWalk(r, &out)
                  out += ")"
              }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn tree2str(root: Option<Rc<RefCell<TreeNode>>>) -> String {
              let mut out = String::new();
              str_walk(&root, &mut out);
              out
          }

          fn str_walk(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut String) {
              if let Some(rc) = node {
                  let n = rc.borrow();
                  out.push_str(&n.val.to_string());
                  if n.left.is_some() || n.right.is_some() {
                      out.push('(');
                      str_walk(&n.left, out);
                      out.push(')');
                  }
                  if n.right.is_some() {
                      out.push('(');
                      str_walk(&n.right, out);
                      out.push(')');
                  }
              }
          }
        `,
        php: code`
          function tree2str($root) {
              $out = "";
              if ($root !== null) strWalk($root, $out);
              return $out;
          }

          function strWalk($node, &$out) {
              $out .= $node->val;
              if ($node->left !== null || $node->right !== null) {
                  $out .= "(";
                  if ($node->left !== null) strWalk($node->left, $out);
                  $out .= ")";
              }
              if ($node->right !== null) {
                  $out .= "(";
                  strWalk($node->right, $out);
                  $out .= ")";
              }
          }
        `,
        ruby: code`
          def tree2str(root)
            out = +""
            str_walk(root, out) unless root.nil?
            out
          end

          def str_walk(node, out)
            out << node.val.to_s
            if node.left || node.right
              out << "("
              str_walk(node.left, out) if node.left
              out << ")"
            end
            return unless node.right
            out << "("
            str_walk(node.right, out)
            out << ")"
          end
        `,
      },
    };
  })(),

  // ── Validate Binary Search Tree (LC 98) ─────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const a = inorderOf(root);
      for (let i = 1; i < a.length; i++) if (a[i - 1] >= a[i]) return false;
      return true;
    };
    const EX = [
      { root: [2, 1, 3], note: "1 < 2 < 3 with 1 on the left and 3 on the right." },
      { root: [5, 1, 4, null, null, 3, 6], note: "The root's right child 4 is smaller than the root 5." },
      { root: [5, 4, 6, null, null, 3, 7], note: "Each parent-child pair looks right, but 3 sits in the root's right subtree while being smaller than 5." },
    ];
    const INT_MIN = -2147483648, INT_MAX = 2147483647;
    return {
      slug: "validate-binary-search-tree",
      title: "Validate Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Meta", "Microsoft", "Bloomberg"],
      signature: { funcName: "isValidBST", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, decide whether it is a valid **binary search tree**:\n\n- every value in a node's left subtree is **strictly smaller** than the node's value;\n- every value in a node's right subtree is **strictly larger** than the node's value;\n- both subtrees are themselves binary search trees.\n\nReturn `true` if it is, `false` otherwise. Equal values anywhere make the tree invalid.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "-2^31 <= Node.val <= 2^31 - 1"]),
      hints: [
        "Comparing each node only with its two children is not enough — a value deep in a right subtree must still exceed the root.",
        "Think about what an in-order traversal (left, node, right) of a valid binary search tree produces.",
        "Walk the tree in order and check that every value is strictly greater than the one visited just before it; remember whether a previous value exists rather than starting from a sentinel, since values reach the 32-bit limits.",
      ],
      editorial: explain({
        idea: "A binary tree is a binary search tree exactly when its in-order sequence is strictly increasing, so one in-order walk comparing each value with the previous one decides it.",
        steps: [
          "Walk the tree in order with an explicit stack: push the current node and go left until there is no left child.",
          "Pop a node. If a previous value exists and the node's value is not strictly greater, return false.",
          "Record the node's value as the previous one and continue with its right child.",
          "If the walk finishes, return true.",
        ],
        why: "In-order visits a node's whole left subtree, then the node, then its whole right subtree. If the tree is a binary search tree, the sequence is therefore increasing by induction on subtrees. Conversely, if the sequence is strictly increasing, every value of a left subtree comes before the node in the sequence and so is smaller, and every value of a right subtree comes after and is larger — which is the definition.",
        time: "O(n)",
        space: "O(h), h the height of the tree",
        pitfalls: [
          "Checking only `left.val < node.val < right.val` accepts `[5,4,6,null,null,3,7]`.",
          "Starting `prev` at the smallest 32-bit integer rejects a tree whose smallest value is exactly -2^31; use a flag or a wider type.",
          "Duplicates are invalid: compare with `<=`, not `<`.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[1, 50], [-1000, 1000], [INT_MIN, INT_MAX], [-3, 3]] as Array<[number, number]>);
        const n = Math.min(hi - lo + 1, sizeOf(rng, [1, 3, 10, 25, 40]));
        let root: TNode | null;
        const r = rng();
        if (r < 0.1) root = shapeTree(rng, n, lo, hi);
        else {
          root = bstOf(rng, n, lo, hi);
          const nodes = nodesOf(root);
          if (rng() < 0.2) {
            const ord = inorderOf(root);
            const byVal = new Map(nodes.map((x) => [x.val, x] as [number, TNode]));
            if (rng() < 0.5) byVal.get(ord[0])!.val = INT_MIN; else byVal.get(ord[ord.length - 1])!.val = INT_MAX;
          }
          if (r >= 0.45 && nodes.length >= 2) {
            const kind = ri(rng, 0, 2);
            const a = pick(rng, nodes);
            let b = pick(rng, nodes);
            while (b === a) b = pick(rng, nodes);
            if (kind === 0) { const t = a.val; a.val = b.val; b.val = t; }
            else if (kind === 1) a.val = b.val;
            else a.val = ri(rng, lo, hi);
          }
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isValidBST(root: Optional[TreeNode]) -> bool:
              stack = []
              node = root
              prev = None
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  if prev is not None and node.val <= prev:
                      return False
                  prev = node.val
                  node = node.right
              return True
        `,
        javascript: code`
          var isValidBST = function(root) {
              var stack = [], node = root, hasPrev = false, prev = 0;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (hasPrev && node.val <= prev) return false;
                  hasPrev = true;
                  prev = node.val;
                  node = node.right;
              }
              return true;
          };
        `,
        typescript: code`
          function isValidBST(root: TreeNode | null): boolean {
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              var hasPrev = false, prev = 0;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  if (hasPrev && top.val <= prev) return false;
                  hasPrev = true;
                  prev = top.val;
                  node = top.right;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isValidBST(TreeNode root) {
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              boolean hasPrev = false;
              int prev = 0;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (hasPrev && node.val <= prev) return false;
                  hasPrev = true;
                  prev = node.val;
                  node = node.right;
              }
              return true;
          }
        `,
        cpp: code`
          bool isValidBST(TreeNode* root) {
              vector<TreeNode*> stack;
              TreeNode* node = root;
              bool hasPrev = false;
              int prev = 0;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  if (hasPrev && node->val <= prev) return false;
                  hasPrev = true;
                  prev = node->val;
                  node = node->right;
              }
              return true;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          bool isValidBST(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int top = 0, hasPrev = 0, prev = 0;
              bool ok = true;
              struct TreeNode* node = root;
              while (top > 0 || node != NULL) {
                  while (node != NULL) { stack[top++] = node; node = node->left; }
                  node = stack[--top];
                  if (hasPrev && node->val <= prev) { ok = false; break; }
                  hasPrev = 1;
                  prev = node->val;
                  node = node->right;
              }
              free(stack);
              return ok;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static bool IsValidBST(TreeNode root)
          {
              var stack = new Stack<TreeNode>();
              var node = root;
              bool hasPrev = false;
              int prev = 0;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  if (hasPrev && node.val <= prev) return false;
                  hasPrev = true;
                  prev = node.val;
                  node = node.right;
              }
              return true;
          }
        `,
        go: code`
          func isValidBST(root *TreeNode) bool {
              stack := []*TreeNode{}
              node := root
              hasPrev, prev := false, 0
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if hasPrev && node.Val <= prev {
                      return false
                  }
                  hasPrev, prev = true, node.Val
                  node = node.Right
              }
              return true
          }
        `,
        kotlin: kt(`
          fun isValidBST(root: TreeNode?): Boolean {
              val stack = ArrayList<TreeNode>()
              var node = root
              var hasPrev = false
              var prev = 0
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  if (hasPrev && top.\`val\` <= prev) return false
                  hasPrev = true
                  prev = top.\`val\`
                  node = top.right
              }
              return true
          }
        `),
        swift: code`
          func isValidBST(_ root: TreeNode?) -> Bool {
              var stack: [TreeNode] = []
              var node = root
              var prev: Int? = nil
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  if let p = prev, top.val <= p { return false }
                  prev = top.val
                  node = top.right
              }
              return true
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isValidBST(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root;
              let mut prev: Option<i32> = None;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let top = stack.pop().unwrap();
                  let v = top.borrow().val;
                  if let Some(p) = prev {
                      if v <= p {
                          return false;
                      }
                  }
                  prev = Some(v);
                  cur = top.borrow().right.clone();
              }
              true
          }
        `,
        php: code`
          function isValidBST($root) {
              $stack = [];
              $node = $root;
              $prev = null;
              while (count($stack) > 0 || $node !== null) {
                  while ($node !== null) { $stack[] = $node; $node = $node->left; }
                  $node = array_pop($stack);
                  if ($prev !== null && $node->val <= $prev) return false;
                  $prev = $node->val;
                  $node = $node->right;
              }
              return true;
          }
        `,
        ruby: code`
          def isValidBST(root)
            stack = []
            node = root
            prev = nil
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              return false if !prev.nil? && node.val <= prev
              prev = node.val
              node = node.right
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Recover Binary Search Tree (LC 99) ──────────────────────────
  (() => {
    const ref = (input: TNode | null) => {
      const root = cloneTree(input);
      const nodes: TNode[] = [];
      const walk = (n: TNode | null) => { if (!n) return; walk(n.left); nodes.push(n); walk(n.right); };
      walk(root);
      const vals = nodes.map((n) => n.val).sort((a, b) => a - b);
      nodes.forEach((n, i) => { n.val = vals[i]; });
      return root;
    };
    const EX = [
      { root: [1, 3, null, null, 2], note: "3 cannot be the left child of 1. Swapping 1 and 3 makes the tree valid." },
      { root: [3, 1, 4, null, null, 2], note: "2 cannot be in the right subtree of 3. Swapping 2 and 3 makes the tree valid." },
      { root: [2, 3, 1], note: "The two children were swapped with each other." },
    ];
    const INT_MIN = -2147483648, INT_MAX = 2147483647;
    return {
      slug: "recover-binary-search-tree",
      title: "Recover Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Microsoft", "Bloomberg"],
      signature: { funcName: "recoverTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree with distinct values in which **exactly two nodes had their values swapped** by mistake.\n\nRepair the tree in place by swapping those two values back, without changing its shape, and return its `root`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["2 <= number of nodes <= 1000", "-2^31 <= Node.val <= 2^31 - 1", "all node values are distinct", "the tree is a binary search tree after swapping exactly two values back"],
        "The direct way stores the in-order sequence in O(n) space. Can you do it with O(h) — or even O(1) — extra space?"),
      hints: [
        "The in-order sequence of a binary search tree is sorted; here it is sorted except that two values traded places.",
        "Walk in order and look for positions where a value is smaller than the one just before it. There are one or two such drops.",
        "The first misplaced node is the larger value at the first drop; the second is the smaller value at the last drop. Swap their values.",
      ],
      editorial: explain({
        idea: "Swapping two entries of a sorted sequence creates one drop (if they were neighbours) or two; the misplaced values are the left side of the first drop and the right side of the last one.",
        steps: [
          "Walk the tree in order with an explicit stack, remembering the previously visited node.",
          "Whenever `prev.val > node.val`: if no first node is recorded, record `prev` as the first; in every case record `node` as the second.",
          "After the walk, swap the values of the first and second nodes.",
          "Return the root.",
        ],
        why: "Let the sorted in-order sequence have entries at positions i < j exchanged. The larger value now sits at i, so position i is followed by a smaller value — the first drop's left side is position i. The smaller value sits at j, preceded by something larger — the last drop's right side is position j. When j = i + 1 these are the same single drop, which is why `second` is overwritten at every drop while `first` is set only once.",
        time: "O(n)",
        space: "O(h) for the stack (Morris traversal brings it to O(1))",
        pitfalls: [
          "Adjacent swapped values produce only one drop; record both nodes from it.",
          "Swap the values, not the nodes — the shape must not change.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[1, 60], [-1000, 1000], [INT_MIN, INT_MAX]] as Array<[number, number]>);
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 30, 40]));
        const root = bstOf(rng, n, lo, hi);
        const order: TNode[] = [];
        const walk = (x: TNode | null) => { if (!x) return; walk(x.left); order.push(x); walk(x.right); };
        walk(root);
        let i: number, j: number;
        if (rng() < 0.3) { i = ri(rng, 0, n - 2); j = i + 1; }
        else { i = ri(rng, 0, n - 1); j = ri(rng, 0, n - 1); while (j === i) j = ri(rng, 0, n - 1); }
        const t = order[i].val; order[i].val = order[j].val; order[j].val = t;
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def recoverTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
              stack = []
              node = root
              prev = first = second = None
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  if prev is not None and prev.val > node.val:
                      if first is None:
                          first = prev
                      second = node
                  prev = node
                  node = node.right
              first.val, second.val = second.val, first.val
              return root
        `,
        javascript: code`
          var recoverTree = function(root) {
              var stack = [], node = root, prev = null, first = null, second = null;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (prev !== null && prev.val > node.val) {
                      if (first === null) first = prev;
                      second = node;
                  }
                  prev = node;
                  node = node.right;
              }
              var t = first.val;
              first.val = second.val;
              second.val = t;
              return root;
          };
        `,
        typescript: code`
          function recoverTree(root: TreeNode | null): TreeNode | null {
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              var prev: TreeNode | null = null, first: TreeNode | null = null, second: TreeNode | null = null;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  if (prev !== null && prev.val > top.val) {
                      if (first === null) first = prev;
                      second = top;
                  }
                  prev = top;
                  node = top.right;
              }
              if (first !== null && second !== null) {
                  var t = first.val;
                  first.val = second.val;
                  second.val = t;
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode recoverTree(TreeNode root) {
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root, prev = null, first = null, second = null;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (prev != null && prev.val > node.val) {
                      if (first == null) first = prev;
                      second = node;
                  }
                  prev = node;
                  node = node.right;
              }
              int t = first.val;
              first.val = second.val;
              second.val = t;
              return root;
          }
        `,
        cpp: code`
          TreeNode* recoverTree(TreeNode* root) {
              vector<TreeNode*> stack;
              TreeNode *node = root, *prev = nullptr, *first = nullptr, *second = nullptr;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  if (prev && prev->val > node->val) {
                      if (!first) first = prev;
                      second = node;
                  }
                  prev = node;
                  node = node->right;
              }
              swap(first->val, second->val);
              return root;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          struct TreeNode* recoverTree(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              struct TreeNode *node = root, *prev = NULL, *first = NULL, *second = NULL;
              int top = 0;
              while (top > 0 || node != NULL) {
                  while (node != NULL) { stack[top++] = node; node = node->left; }
                  node = stack[--top];
                  if (prev != NULL && prev->val > node->val) {
                      if (first == NULL) first = prev;
                      second = node;
                  }
                  prev = node;
                  node = node->right;
              }
              free(stack);
              int t = first->val;
              first->val = second->val;
              second->val = t;
              return root;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static TreeNode RecoverTree(TreeNode root)
          {
              var stack = new Stack<TreeNode>();
              TreeNode node = root, prev = null, first = null, second = null;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  if (prev != null && prev.val > node.val)
                  {
                      if (first == null) first = prev;
                      second = node;
                  }
                  prev = node;
                  node = node.right;
              }
              int t = first.val;
              first.val = second.val;
              second.val = t;
              return root;
          }
        `,
        go: code`
          func recoverTree(root *TreeNode) *TreeNode {
              stack := []*TreeNode{}
              node := root
              var prev, first, second *TreeNode
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if prev != nil && prev.Val > node.Val {
                      if first == nil {
                          first = prev
                      }
                      second = node
                  }
                  prev = node
                  node = node.Right
              }
              first.Val, second.Val = second.Val, first.Val
              return root
          }
        `,
        kotlin: kt(`
          fun recoverTree(root: TreeNode?): TreeNode? {
              val stack = ArrayList<TreeNode>()
              var node = root
              var prev: TreeNode? = null
              var first: TreeNode? = null
              var second: TreeNode? = null
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  val p = prev
                  if (p != null && p.\`val\` > top.\`val\`) {
                      if (first == null) first = p
                      second = top
                  }
                  prev = top
                  node = top.right
              }
              val a = first
              val b = second
              if (a != null && b != null) {
                  val t = a.\`val\`
                  a.\`val\` = b.\`val\`
                  b.\`val\` = t
              }
              return root
          }
        `),
        swift: code`
          func recoverTree(_ root: TreeNode?) -> TreeNode? {
              var stack: [TreeNode] = []
              var node = root
              var prev: TreeNode? = nil
              var first: TreeNode? = nil
              var second: TreeNode? = nil
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  if let p = prev, p.val > top.val {
                      if first == nil { first = p }
                      second = top
                  }
                  prev = top
                  node = top.right
              }
              if let a = first, let b = second {
                  let t = a.val
                  a.val = b.val
                  b.val = t
              }
              return root
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn recoverTree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root.clone();
              let mut prev: Option<Rc<RefCell<TreeNode>>> = None;
              let mut first: Option<Rc<RefCell<TreeNode>>> = None;
              let mut second: Option<Rc<RefCell<TreeNode>>> = None;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let top = stack.pop().unwrap();
                  if let Some(p) = &prev {
                      if p.borrow().val > top.borrow().val {
                          if first.is_none() {
                              first = Some(p.clone());
                          }
                          second = Some(top.clone());
                      }
                  }
                  cur = top.borrow().right.clone();
                  prev = Some(top);
              }
              if let (Some(a), Some(b)) = (first, second) {
                  let av = a.borrow().val;
                  let bv = b.borrow().val;
                  a.borrow_mut().val = bv;
                  b.borrow_mut().val = av;
              }
              root
          }
        `,
        php: code`
          function recoverTree($root) {
              $stack = [];
              $node = $root;
              $prev = null;
              $first = null;
              $second = null;
              while (count($stack) > 0 || $node !== null) {
                  while ($node !== null) { $stack[] = $node; $node = $node->left; }
                  $node = array_pop($stack);
                  if ($prev !== null && $prev->val > $node->val) {
                      if ($first === null) $first = $prev;
                      $second = $node;
                  }
                  $prev = $node;
                  $node = $node->right;
              }
              $t = $first->val;
              $first->val = $second->val;
              $second->val = $t;
              return $root;
          }
        `,
        ruby: code`
          def recoverTree(root)
            stack = []
            node = root
            prev = first = second = nil
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              if prev && prev.val > node.val
                first ||= prev
                second = node
              end
              prev = node
              node = node.right
            end
            first.val, second.val = second.val, first.val
            root
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Level Order Traversal (LC 102) ──────────────────
  (() => {
    const ref = (root: TNode | null) => levelsOf(root);
    const EX = [
      { root: [3, 9, 20, null, null, 15, 7], note: "Level 1 holds 3, level 2 holds 9 and 20, level 3 holds 15 and 7." },
      { root: [1], note: "A single node is a single level." },
      { root: [], note: "An empty tree has no levels." },
    ];
    return {
      slug: "binary-tree-level-order-traversal",
      title: "Binary Tree Level Order Traversal",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Meta", "Microsoft", "Bloomberg"],
      signature: { funcName: "levelOrder", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[][]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its node values **level by level**: one list per level, from the root's level down, each list reading its level from left to right.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntMat(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 2000", "-1000 <= Node.val <= 1000"]),
      hints: [
        "A queue hands nodes back in the order they were added — add children left before right and the nodes come out level after level.",
        "The difficulty is knowing where one level ends and the next begins.",
        "At the start of each level the queue holds exactly that level: read its size first, then take exactly that many nodes into one list.",
      ],
      editorial: explain({
        idea: "Breadth-first search with a queue visits nodes in level order; fixing the queue's size at the start of each round separates the levels.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Put the root in a queue.",
          "While the queue is not empty: let `size` be its length, take `size` nodes from the front, append their values to a new list and push each one's left then right child.",
          "Append that list to the answer and repeat.",
        ],
        why: "By induction, when a round starts the queue holds exactly the nodes of one level in left-to-right order: the round removes all of them and adds exactly their children, in left-to-right order, which is the next level.",
        time: "O(n)",
        space: "O(w), w the largest number of nodes on one level (plus the output)",
        pitfalls: [
          "Read the queue's size before the inner loop — it grows while children are added.",
          "Return `[]`, not `[[]]`, for an empty tree.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntMat(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[0, 9], [-1000, 1000]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: fmtIntMat(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def levelOrder(root: Optional[TreeNode]) -> List[List[int]]:
              out = []
              level = [root] if root else []
              while level:
                  out.append([node.val for node in level])
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              return out
        `,
        javascript: code`
          var levelOrder = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0;
              while (head < queue.length) {
                  var end = queue.length, row = [];
                  while (head < end) {
                      var node = queue[head++];
                      row.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
              }
              return out;
          };
        `,
        typescript: code`
          function levelOrder(root: TreeNode | null): number[][] {
              var out: number[][] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  var row: number[] = [];
                  while (head < end) {
                      var node = queue[head++];
                      row.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
              }
              return out;
          }
        `,
        java: code`
          public static int[][] levelOrder(TreeNode root) {
              List<int[]> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  int size = queue.size();
                  int[] row = new int[size];
                  for (int i = 0; i < size; i++) {
                      TreeNode node = queue.poll();
                      row[i] = node.val;
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  out.add(row);
              }
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> levelOrder(TreeNode* root) {
              vector<vector<int>> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  int size = (int) q.size();
                  vector<int> row;
                  for (int i = 0; i < size; i++) {
                      TreeNode* node = q.front();
                      q.pop();
                      row.push_back(node->val);
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  out.push_back(row);
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int** levelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
              int n = countNodes(root);
              int** out = (int**) malloc((size_t) (n + 1) * sizeof(int*));
              *returnColumnSizes = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, levels = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail, size = tail - head, k = 0;
                  int* row = (int*) malloc((size_t) size * sizeof(int));
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      row[k++] = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  out[levels] = row;
                  (*returnColumnSizes)[levels] = size;
                  levels++;
              }
              free(queue);
              *returnSize = levels;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[][] LevelOrder(TreeNode root)
          {
              var output = new List<int[]>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              while (queue.Count > 0)
              {
                  int size = queue.Count;
                  var row = new int[size];
                  for (int i = 0; i < size; i++)
                  {
                      var node = queue.Dequeue();
                      row[i] = node.val;
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  output.Add(row);
              }
              return output.ToArray();
          }
        `,
        go: code`
          func levelOrder(root *TreeNode) [][]int {
              out := [][]int{}
              if root == nil {
                  return out
              }
              level := []*TreeNode{root}
              for len(level) > 0 {
                  row := make([]int, 0, len(level))
                  next := []*TreeNode{}
                  for _, node := range level {
                      row = append(row, node.Val)
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  out = append(out, row)
                  level = next
              }
              return out
          }
        `,
        kotlin: kt(`
          fun levelOrder(root: TreeNode?): Array<IntArray> {
              val out = ArrayList<IntArray>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  val row = IntArray(level.size)
                  val next = ArrayList<TreeNode>()
                  for (i in level.indices) {
                      val node = level[i]
                      row[i] = node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  out.add(row)
                  level = next
              }
              return out.toTypedArray()
          }
        `),
        swift: code`
          func levelOrder(_ root: TreeNode?) -> [[Int]] {
              var out: [[Int]] = []
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  out.append(level.map { $0.val })
                  var next: [TreeNode] = []
                  for node in level {
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn levelOrder(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let mut row: Vec<i32> = Vec::new();
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      row.push(b.val);
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  out.push(row);
                  level = next;
              }
              out
          }
        `,
        php: code`
          function levelOrder($root) {
              $out = [];
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $row = [];
                  $next = [];
                  foreach ($level as $node) {
                      $row[] = $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $out[] = $row;
                  $level = $next;
              }
              return $out;
          }
        `,
        ruby: code`
          def levelOrder(root)
            out = []
            level = root.nil? ? [] : [root]
            until level.empty?
              out << level.map(&:val)
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Zigzag Level Order Traversal (LC 103) ───────────
  (() => {
    const ref = (root: TNode | null) => levelsOf(root).map((row, i) => (i % 2 ? row.slice().reverse() : row));
    const EX = [
      { root: [3, 9, 20, null, null, 15, 7], note: "Level 1 reads left to right, level 2 right to left (20 before 9), level 3 left to right again." },
      { root: [1, 2, 3, 4, null, null, 5], note: "Level 2 is read right to left: 3, 2. Level 3 is read left to right: 4, 5." },
      { root: [], note: "An empty tree has no levels." },
    ];
    return {
      slug: "binary-tree-zigzag-level-order-traversal",
      title: "Binary Tree Zigzag Level Order Traversal",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Meta", "Microsoft", "Bloomberg"],
      signature: { funcName: "zigzagLevelOrder", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[][]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its node values level by level in **zigzag** order: the root's level is read from left to right, the next level from right to left, the one after from left to right again, and so on, alternating at every level.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntMat(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 2000", "-100 <= Node.val <= 100"]),
      hints: [
        "Start from an ordinary level-order traversal: one list per level, left to right.",
        "The zigzag only changes the order inside each level, never which nodes are on it.",
        "Keep a flag that flips after every level, and fill each level's list from the front or from the back according to it — the queue itself always runs left to right.",
      ],
      editorial: explain({
        idea: "Run a normal breadth-first level traversal and reverse the direction in which every other level's values are written.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Process the tree level by level with a queue, children added left before right.",
          "For a level of `size` nodes, create a list of that size; the i-th node taken goes to index i on a left-to-right level and to index `size - 1 - i` on a right-to-left one.",
          "Append the list and flip the direction before the next level.",
        ],
        why: "The traversal itself never changes, so every level contains exactly its nodes; writing them into mirrored positions on alternate levels produces precisely the right-to-left reading of those levels.",
        time: "O(n)",
        space: "O(w), w the largest number of nodes on one level (plus the output)",
        pitfalls: [
          "Do not try to reverse the order children are enqueued — that scrambles the next level instead of reversing this one.",
          "The first level (the root) is read left to right.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntMat(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[0, 9], [-100, 100]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: fmtIntMat(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def zigzagLevelOrder(root: Optional[TreeNode]) -> List[List[int]]:
              out = []
              level = [root] if root else []
              left_to_right = True
              while level:
                  row = [node.val for node in level]
                  if not left_to_right:
                      row.reverse()
                  out.append(row)
                  left_to_right = not left_to_right
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              return out
        `,
        javascript: code`
          var zigzagLevelOrder = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0, leftToRight = true;
              while (head < queue.length) {
                  var end = queue.length, size = end - head, row = new Array(size);
                  for (var i = 0; i < size; i++) {
                      var node = queue[head++];
                      row[leftToRight ? i : size - 1 - i] = node.val;
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
                  leftToRight = !leftToRight;
              }
              return out;
          };
        `,
        typescript: code`
          function zigzagLevelOrder(root: TreeNode | null): number[][] {
              var out: number[][] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0, leftToRight = true;
              while (head < queue.length) {
                  var size = queue.length - head;
                  var row: number[] = new Array(size);
                  for (var i = 0; i < size; i++) {
                      var node = queue[head++];
                      row[leftToRight ? i : size - 1 - i] = node.val;
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
                  leftToRight = !leftToRight;
              }
              return out;
          }
        `,
        java: code`
          public static int[][] zigzagLevelOrder(TreeNode root) {
              List<int[]> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              boolean leftToRight = true;
              while (!queue.isEmpty()) {
                  int size = queue.size();
                  int[] row = new int[size];
                  for (int i = 0; i < size; i++) {
                      TreeNode node = queue.poll();
                      row[leftToRight ? i : size - 1 - i] = node.val;
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  out.add(row);
                  leftToRight = !leftToRight;
              }
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
              vector<vector<int>> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              bool leftToRight = true;
              while (!q.empty()) {
                  int size = (int) q.size();
                  vector<int> row(size);
                  for (int i = 0; i < size; i++) {
                      TreeNode* node = q.front();
                      q.pop();
                      row[leftToRight ? i : size - 1 - i] = node->val;
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  out.push_back(row);
                  leftToRight = !leftToRight;
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int** zigzagLevelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
              int n = countNodes(root);
              int** out = (int**) malloc((size_t) (n + 1) * sizeof(int*));
              *returnColumnSizes = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, levels = 0, leftToRight = 1;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int size = tail - head;
                  int* row = (int*) malloc((size_t) size * sizeof(int));
                  for (int i = 0; i < size; i++) {
                      struct TreeNode* node = queue[head++];
                      row[leftToRight ? i : size - 1 - i] = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  out[levels] = row;
                  (*returnColumnSizes)[levels] = size;
                  levels++;
                  leftToRight = !leftToRight;
              }
              free(queue);
              *returnSize = levels;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[][] ZigzagLevelOrder(TreeNode root)
          {
              var output = new List<int[]>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              bool leftToRight = true;
              while (queue.Count > 0)
              {
                  int size = queue.Count;
                  var row = new int[size];
                  for (int i = 0; i < size; i++)
                  {
                      var node = queue.Dequeue();
                      row[leftToRight ? i : size - 1 - i] = node.val;
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  output.Add(row);
                  leftToRight = !leftToRight;
              }
              return output.ToArray();
          }
        `,
        go: code`
          func zigzagLevelOrder(root *TreeNode) [][]int {
              out := [][]int{}
              if root == nil {
                  return out
              }
              level := []*TreeNode{root}
              leftToRight := true
              for len(level) > 0 {
                  size := len(level)
                  row := make([]int, size)
                  next := []*TreeNode{}
                  for i, node := range level {
                      if leftToRight {
                          row[i] = node.Val
                      } else {
                          row[size-1-i] = node.Val
                      }
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  out = append(out, row)
                  leftToRight = !leftToRight
                  level = next
              }
              return out
          }
        `,
        kotlin: kt(`
          fun zigzagLevelOrder(root: TreeNode?): Array<IntArray> {
              val out = ArrayList<IntArray>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              var leftToRight = true
              while (level.isNotEmpty()) {
                  val size = level.size
                  val row = IntArray(size)
                  val next = ArrayList<TreeNode>()
                  for (i in 0 until size) {
                      val node = level[i]
                      row[if (leftToRight) i else size - 1 - i] = node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  out.add(row)
                  leftToRight = !leftToRight
                  level = next
              }
              return out.toTypedArray()
          }
        `),
        swift: code`
          func zigzagLevelOrder(_ root: TreeNode?) -> [[Int]] {
              var out: [[Int]] = []
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              var leftToRight = true
              while !level.isEmpty {
                  let row = level.map { $0.val }
                  out.append(leftToRight ? row : Array(row.reversed()))
                  leftToRight = !leftToRight
                  var next: [TreeNode] = []
                  for node in level {
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn zigzagLevelOrder(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              let mut left_to_right = true;
              while !level.is_empty() {
                  let mut row: Vec<i32> = Vec::new();
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      row.push(b.val);
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  if !left_to_right {
                      row.reverse();
                  }
                  out.push(row);
                  left_to_right = !left_to_right;
                  level = next;
              }
              out
          }
        `,
        php: code`
          function zigzagLevelOrder($root) {
              $out = [];
              $level = $root === null ? [] : [$root];
              $leftToRight = true;
              while (count($level) > 0) {
                  $row = [];
                  $next = [];
                  foreach ($level as $node) {
                      $row[] = $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $out[] = $leftToRight ? $row : array_reverse($row);
                  $leftToRight = !$leftToRight;
                  $level = $next;
              }
              return $out;
          }
        `,
        ruby: code`
          def zigzagLevelOrder(root)
            out = []
            level = root.nil? ? [] : [root]
            left_to_right = true
            until level.empty?
              row = level.map(&:val)
              out << (left_to_right ? row : row.reverse)
              left_to_right = !left_to_right
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Construct Binary Tree from Preorder and Inorder Traversal (LC 105)
  (() => {
    const ref = (preorder: number[], inorder: number[]) => {
      const index = new Map(inorder.map((v, i) => [v, i] as [number, number]));
      let pos = 0;
      const build = (lo: number, hi: number): TNode | null => {
        if (lo > hi) return null;
        const v = preorder[pos++];
        const node: TNode = { val: v, left: null, right: null };
        node.left = build(lo, index.get(v)! - 1);
        node.right = build(index.get(v)! + 1, hi);
        return node;
      };
      return build(0, inorder.length - 1);
    };
    const EX = [
      { pre: [3, 9, 20, 15, 7], ino: [9, 3, 15, 20, 7], note: "3 comes first in preorder, so it is the root; in the inorder list 9 is to its left and 15, 20, 7 to its right. Repeating the split on each side gives the tree." },
      { pre: [-1], ino: [-1], note: "A single node." },
      { pre: [1, 2, 3], ino: [3, 2, 1], note: "Every value sits left of its parent in the inorder list, so the tree is a chain of left children." },
    ];
    return {
      slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
      title: "Construct Binary Tree from Preorder and Inorder Traversal",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Array", "Hash Table", "Divide and Conquer", "Amazon", "Microsoft", "Google", "Bloomberg"],
      signature: { funcName: "buildTree", params: [{ name: "preorder", type: "int[]" as const }, { name: "inorder", type: "int[]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given two integer arrays: `preorder`, the preorder traversal of a binary tree (node, left subtree, right subtree), and `inorder`, the inorder traversal of the same tree (left subtree, node, right subtree). All values are **distinct**.\n\nRebuild the tree and return its `root`.",
        EX.map((e) => ({ in: `preorder = ${fmtIntArr(e.pre)}, inorder = ${fmtIntArr(e.ino)}`, out: fmtTree(ref(e.pre, e.ino)), note: e.note })),
        ["1 <= preorder.length <= 3000", "inorder.length == preorder.length", "-3000 <= preorder[i], inorder[i] <= 3000", "all values are distinct", "every value of inorder appears in preorder", "the two arrays describe the same tree"]),
      hints: [
        "The first value of a preorder traversal is always the root.",
        "Find the root in the inorder list: everything to its left is the left subtree, everything to its right the right subtree — and the counts tell you how to split the preorder list too.",
        "Recurse on index ranges rather than copying subarrays, keep a running pointer into preorder (it consumes roots in exactly the order the recursion needs them, left subtree first), and look positions up in a hash map instead of searching.",
      ],
      editorial: explain({
        idea: "Preorder names each subtree's root first; inorder says which values lie left and right of it. Consuming preorder from the front while splitting inorder ranges rebuilds the tree top-down.",
        steps: [
          "Map every value to its index in `inorder`.",
          "Keep a pointer `pos` into `preorder`, starting at 0.",
          "To build the subtree whose values occupy `inorder[lo..hi]`: if `lo > hi` return null; otherwise take `preorder[pos]` as the root and advance `pos`.",
          "Let `mid` be the root's index in `inorder`; build the left subtree from `[lo, mid - 1]`, then the right subtree from `[mid + 1, hi]`.",
          "Return the root built for the whole range.",
        ],
        why: "Preorder lists a node, then its entire left subtree, then its entire right subtree. Building the left subtree completely before the right one therefore makes `pos` meet exactly the roots in the order they are needed. The inorder split is correct because, values being distinct, the root's position separates the left subtree's values from the right's.",
        time: "O(n)",
        space: "O(n) for the map, O(h) for the recursion",
        pitfalls: [
          "Building the right subtree before the left breaks the shared preorder pointer.",
          "Searching for the root in `inorder` each time makes it O(n^2) on a chain.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${fmtIntArr(e.pre)}\n${fmtIntArr(e.ino)}`, expectedOutput: fmtTree(ref(e.pre, e.ino)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const hi = pick(rng, [n, 100, 3000]);
        const root = distinctVals(rng, shapeTree(rng, n, 0, 0), rng() < 0.5 ? -hi : 1, hi);
        const pre = nodesOf(root).map((x) => x.val), ino = inorderOf(root);
        return { input: `${fmtIntArr(pre)}\n${fmtIntArr(ino)}`, expectedOutput: fmtTree(ref(pre, ino)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def buildTree(preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
              index = {v: i for i, v in enumerate(inorder)}
              pos = 0

              def build(lo, hi):
                  nonlocal pos
                  if lo > hi:
                      return None
                  v = preorder[pos]
                  pos += 1
                  node = TreeNode(v)
                  mid = index[v]
                  node.left = build(lo, mid - 1)
                  node.right = build(mid + 1, hi)
                  return node

              return build(0, len(inorder) - 1)
        `,
        javascript: code`
          var buildTree = function(preorder, inorder) {
              var index = new Map(), pos = 0;
              for (var i = 0; i < inorder.length; i++) index.set(inorder[i], i);
              function build(lo, hi) {
                  if (lo > hi) return null;
                  var v = preorder[pos++];
                  var node = new TreeNode(v);
                  var mid = index.get(v);
                  node.left = build(lo, mid - 1);
                  node.right = build(mid + 1, hi);
                  return node;
              }
              return build(0, inorder.length - 1);
          };
        `,
        typescript: code`
          function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
              var index: { [v: number]: number } = {};
              var pos = 0;
              for (var i = 0; i < inorder.length; i++) index[inorder[i]] = i;
              function build(lo: number, hi: number): TreeNode | null {
                  if (lo > hi) return null;
                  var v = preorder[pos++];
                  var node = new TreeNode(v);
                  var mid = index[v];
                  node.left = build(lo, mid - 1);
                  node.right = build(mid + 1, hi);
                  return node;
              }
              return build(0, inorder.length - 1);
          }
        `,
        java: code`
          public static TreeNode buildTree(int[] preorder, int[] inorder) {
              Map<Integer, Integer> index = new HashMap<>();
              for (int i = 0; i < inorder.length; i++) index.put(inorder[i], i);
              int[] pos = {0};
              return build(preorder, index, pos, 0, inorder.length - 1);
          }

          static TreeNode build(int[] preorder, Map<Integer, Integer> index, int[] pos, int lo, int hi) {
              if (lo > hi) return null;
              int v = preorder[pos[0]++];
              TreeNode node = new TreeNode(v);
              int mid = index.get(v);
              node.left = build(preorder, index, pos, lo, mid - 1);
              node.right = build(preorder, index, pos, mid + 1, hi);
              return node;
          }
        `,
        cpp: code`
          TreeNode* buildRange(vector<int>& preorder, unordered_map<int, int>& index, int& pos, int lo, int hi);

          TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
              unordered_map<int, int> index;
              for (int i = 0; i < (int) inorder.size(); i++) index[inorder[i]] = i;
              int pos = 0;
              return buildRange(preorder, index, pos, 0, (int) inorder.size() - 1);
          }

          TreeNode* buildRange(vector<int>& preorder, unordered_map<int, int>& index, int& pos, int lo, int hi) {
              if (lo > hi) return nullptr;
              int v = preorder[pos++];
              TreeNode* node = new TreeNode(v);
              int mid = index[v];
              node->left = buildRange(preorder, index, pos, lo, mid - 1);
              node->right = buildRange(preorder, index, pos, mid + 1, hi);
              return node;
          }
        `,
        c: code`
          static struct TreeNode* buildRange(int* preorder, int* index, int* pos, int lo, int hi);

          struct TreeNode* buildTree(int* preorder, int preorderSize, int* inorder, int inorderSize) {
              int* index = (int*) malloc(6001 * sizeof(int));
              for (int i = 0; i < inorderSize; i++) index[inorder[i] + 3000] = i;
              int pos = 0;
              struct TreeNode* root = buildRange(preorder, index, &pos, 0, inorderSize - 1);
              free(index);
              return root;
          }

          static struct TreeNode* buildRange(int* preorder, int* index, int* pos, int lo, int hi) {
              if (lo > hi) return NULL;
              int v = preorder[(*pos)++];
              struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              int mid = index[v + 3000];
              node->val = v;
              node->left = buildRange(preorder, index, pos, lo, mid - 1);
              node->right = buildRange(preorder, index, pos, mid + 1, hi);
              return node;
          }
        `,
        csharp: code`
          public static TreeNode BuildTree(int[] preorder, int[] inorder)
          {
              var index = new Dictionary<int, int>();
              for (int i = 0; i < inorder.Length; i++) index[inorder[i]] = i;
              int pos = 0;
              return BuildRange(preorder, index, ref pos, 0, inorder.Length - 1);
          }

          static TreeNode BuildRange(int[] preorder, Dictionary<int, int> index, ref int pos, int lo, int hi)
          {
              if (lo > hi) return null;
              int v = preorder[pos++];
              var node = new TreeNode(v);
              int mid = index[v];
              node.left = BuildRange(preorder, index, ref pos, lo, mid - 1);
              node.right = BuildRange(preorder, index, ref pos, mid + 1, hi);
              return node;
          }
        `,
        go: code`
          func buildTree(preorder []int, inorder []int) *TreeNode {
              index := make(map[int]int, len(inorder))
              for i, v := range inorder {
                  index[v] = i
              }
              pos := 0
              var build func(lo, hi int) *TreeNode
              build = func(lo, hi int) *TreeNode {
                  if lo > hi {
                      return nil
                  }
                  v := preorder[pos]
                  pos++
                  mid := index[v]
                  node := &TreeNode{Val: v}
                  node.Left = build(lo, mid-1)
                  node.Right = build(mid+1, hi)
                  return node
              }
              return build(0, len(inorder)-1)
          }
        `,
        kotlin: kt(`
          fun buildTree(preorder: IntArray, inorder: IntArray): TreeNode? {
              val index = HashMap<Int, Int>()
              for (i in inorder.indices) index[inorder[i]] = i
              var pos = 0
              fun build(lo: Int, hi: Int): TreeNode? {
                  if (lo > hi) return null
                  val v = preorder[pos++]
                  val node = TreeNode(v)
                  val mid = index[v]!!
                  node.left = build(lo, mid - 1)
                  node.right = build(mid + 1, hi)
                  return node
              }
              return build(0, inorder.size - 1)
          }
        `),
        swift: code`
          func buildTree(_ preorder: [Int], _ inorder: [Int]) -> TreeNode? {
              var index: [Int: Int] = [:]
              for (i, v) in inorder.enumerated() { index[v] = i }
              var pos = 0
              func build(_ lo: Int, _ hi: Int) -> TreeNode? {
                  if lo > hi { return nil }
                  let v = preorder[pos]
                  pos += 1
                  let node = TreeNode(v)
                  let mid = index[v]!
                  node.left = build(lo, mid - 1)
                  node.right = build(mid + 1, hi)
                  return node
              }
              return build(0, inorder.count - 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn buildTree(preorder: Vec<i32>, inorder: Vec<i32>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut index: HashMap<i32, i32> = HashMap::new();
              for (i, v) in inorder.iter().enumerate() {
                  index.insert(*v, i as i32);
              }
              let mut pos: usize = 0;
              build_range(&preorder, &index, &mut pos, 0, inorder.len() as i32 - 1)
          }

          fn build_range(preorder: &Vec<i32>, index: &HashMap<i32, i32>, pos: &mut usize, lo: i32, hi: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if lo > hi {
                  return None;
              }
              let v = preorder[*pos];
              *pos += 1;
              let mid = index[&v];
              let left = build_range(preorder, index, pos, lo, mid - 1);
              let right = build_range(preorder, index, pos, mid + 1, hi);
              let node = Rc::new(RefCell::new(TreeNode::new(v)));
              node.borrow_mut().left = left;
              node.borrow_mut().right = right;
              Some(node)
          }
        `,
        php: code`
          function buildTree($preorder, $inorder) {
              $index = [];
              foreach ($inorder as $i => $v) $index[$v] = $i;
              $pos = 0;
              return buildRange($preorder, $index, $pos, 0, count($inorder) - 1);
          }

          function buildRange(&$preorder, &$index, &$pos, $lo, $hi) {
              if ($lo > $hi) return null;
              $v = $preorder[$pos++];
              $node = new TreeNode($v);
              $mid = $index[$v];
              $node->left = buildRange($preorder, $index, $pos, $lo, $mid - 1);
              $node->right = buildRange($preorder, $index, $pos, $mid + 1, $hi);
              return $node;
          }
        `,
        ruby: code`
          def buildTree(preorder, inorder)
            index = {}
            inorder.each_with_index { |v, i| index[v] = i }
            state = { pos: 0 }
            build_range(preorder, index, state, 0, inorder.length - 1)
          end

          def build_range(preorder, index, state, lo, hi)
            return nil if lo > hi
            v = preorder[state[:pos]]
            state[:pos] += 1
            node = TreeNode.new(v)
            mid = index[v]
            node.left = build_range(preorder, index, state, lo, mid - 1)
            node.right = build_range(preorder, index, state, mid + 1, hi)
            node
          end
        `,
      },
    };
  })(),

  // ── Construct Binary Tree from Inorder and Postorder Traversal (LC 106)
  (() => {
    const ref = (inorder: number[], postorder: number[]) => {
      const index = new Map(inorder.map((v, i) => [v, i] as [number, number]));
      let pos = postorder.length - 1;
      const build = (lo: number, hi: number): TNode | null => {
        if (lo > hi) return null;
        const v = postorder[pos--];
        const node: TNode = { val: v, left: null, right: null };
        node.right = build(index.get(v)! + 1, hi);
        node.left = build(lo, index.get(v)! - 1);
        return node;
      };
      return build(0, inorder.length - 1);
    };
    const EX = [
      { ino: [9, 3, 15, 20, 7], post: [9, 15, 7, 20, 3], note: "3 comes last in postorder, so it is the root; in the inorder list 9 is to its left and 15, 20, 7 to its right. Repeating the split on each side gives the tree." },
      { ino: [-1], post: [-1], note: "A single node." },
      { ino: [1, 2, 3], post: [3, 2, 1], note: "Every value sits right of its parent in the inorder list, so the tree is a chain of right children." },
    ];
    return {
      slug: "construct-binary-tree-from-inorder-and-postorder-traversal",
      title: "Construct Binary Tree from Inorder and Postorder Traversal",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Array", "Hash Table", "Divide and Conquer", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "buildTree", params: [{ name: "inorder", type: "int[]" as const }, { name: "postorder", type: "int[]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given two integer arrays: `inorder`, the inorder traversal of a binary tree (left subtree, node, right subtree), and `postorder`, the postorder traversal of the same tree (left subtree, right subtree, node). All values are **distinct**.\n\nRebuild the tree and return its `root`.",
        EX.map((e) => ({ in: `inorder = ${fmtIntArr(e.ino)}, postorder = ${fmtIntArr(e.post)}`, out: fmtTree(ref(e.ino, e.post)), note: e.note })),
        ["1 <= inorder.length <= 3000", "postorder.length == inorder.length", "-3000 <= inorder[i], postorder[i] <= 3000", "all values are distinct", "every value of postorder appears in inorder", "the two arrays describe the same tree"]),
      hints: [
        "The last value of a postorder traversal is always the root.",
        "Find the root in the inorder list: everything to its left is the left subtree, everything to its right the right subtree.",
        "Walk postorder from the back with one shared pointer. Read backwards it lists node, right subtree, left subtree — so build the right subtree before the left. Look positions up in a hash map.",
      ],
      editorial: explain({
        idea: "Postorder read from the end names each subtree's root first, then its right subtree, then its left; inorder says which values lie on each side of a root. Consuming postorder backwards while splitting inorder ranges rebuilds the tree.",
        steps: [
          "Map every value to its index in `inorder`.",
          "Keep a pointer `pos` into `postorder`, starting at its last index.",
          "To build the subtree whose values occupy `inorder[lo..hi]`: if `lo > hi` return null; otherwise take `postorder[pos]` as the root and move `pos` one step left.",
          "Let `mid` be the root's index in `inorder`; build the **right** subtree from `[mid + 1, hi]` first, then the left subtree from `[lo, mid - 1]`.",
          "Return the root built for the whole range.",
        ],
        why: "Postorder is left subtree, right subtree, node; reversed it is node, right subtree, left subtree — the mirror of preorder. Building the right subtree completely before the left therefore makes the backwards pointer meet exactly the roots the recursion needs, and the inorder position of each root splits its range correctly because values are distinct.",
        time: "O(n)",
        space: "O(n) for the map, O(h) for the recursion",
        pitfalls: [
          "Building the left subtree first, as in the preorder version, pairs the wrong roots with the ranges.",
          "Searching for the root in `inorder` each time makes it O(n^2) on a chain.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${fmtIntArr(e.ino)}\n${fmtIntArr(e.post)}`, expectedOutput: fmtTree(ref(e.ino, e.post)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const hi = pick(rng, [n, 100, 3000]);
        const root = distinctVals(rng, shapeTree(rng, n, 0, 0), rng() < 0.5 ? -hi : 1, hi);
        const ino = inorderOf(root), post = postorderOf(root);
        return { input: `${fmtIntArr(ino)}\n${fmtIntArr(post)}`, expectedOutput: fmtTree(ref(ino, post)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def buildTree(inorder: List[int], postorder: List[int]) -> Optional[TreeNode]:
              index = {v: i for i, v in enumerate(inorder)}
              pos = len(postorder) - 1

              def build(lo, hi):
                  nonlocal pos
                  if lo > hi:
                      return None
                  v = postorder[pos]
                  pos -= 1
                  node = TreeNode(v)
                  mid = index[v]
                  node.right = build(mid + 1, hi)
                  node.left = build(lo, mid - 1)
                  return node

              return build(0, len(inorder) - 1)
        `,
        javascript: code`
          var buildTree = function(inorder, postorder) {
              var index = new Map(), pos = postorder.length - 1;
              for (var i = 0; i < inorder.length; i++) index.set(inorder[i], i);
              function build(lo, hi) {
                  if (lo > hi) return null;
                  var v = postorder[pos--];
                  var node = new TreeNode(v);
                  var mid = index.get(v);
                  node.right = build(mid + 1, hi);
                  node.left = build(lo, mid - 1);
                  return node;
              }
              return build(0, inorder.length - 1);
          };
        `,
        typescript: code`
          function buildTree(inorder: number[], postorder: number[]): TreeNode | null {
              var index: { [v: number]: number } = {};
              var pos = postorder.length - 1;
              for (var i = 0; i < inorder.length; i++) index[inorder[i]] = i;
              function build(lo: number, hi: number): TreeNode | null {
                  if (lo > hi) return null;
                  var v = postorder[pos--];
                  var node = new TreeNode(v);
                  var mid = index[v];
                  node.right = build(mid + 1, hi);
                  node.left = build(lo, mid - 1);
                  return node;
              }
              return build(0, inorder.length - 1);
          }
        `,
        java: code`
          public static TreeNode buildTree(int[] inorder, int[] postorder) {
              Map<Integer, Integer> index = new HashMap<>();
              for (int i = 0; i < inorder.length; i++) index.put(inorder[i], i);
              int[] pos = {postorder.length - 1};
              return build(postorder, index, pos, 0, inorder.length - 1);
          }

          static TreeNode build(int[] postorder, Map<Integer, Integer> index, int[] pos, int lo, int hi) {
              if (lo > hi) return null;
              int v = postorder[pos[0]--];
              TreeNode node = new TreeNode(v);
              int mid = index.get(v);
              node.right = build(postorder, index, pos, mid + 1, hi);
              node.left = build(postorder, index, pos, lo, mid - 1);
              return node;
          }
        `,
        cpp: code`
          TreeNode* buildRange(vector<int>& postorder, unordered_map<int, int>& index, int& pos, int lo, int hi);

          TreeNode* buildTree(vector<int>& inorder, vector<int>& postorder) {
              unordered_map<int, int> index;
              for (int i = 0; i < (int) inorder.size(); i++) index[inorder[i]] = i;
              int pos = (int) postorder.size() - 1;
              return buildRange(postorder, index, pos, 0, (int) inorder.size() - 1);
          }

          TreeNode* buildRange(vector<int>& postorder, unordered_map<int, int>& index, int& pos, int lo, int hi) {
              if (lo > hi) return nullptr;
              int v = postorder[pos--];
              TreeNode* node = new TreeNode(v);
              int mid = index[v];
              node->right = buildRange(postorder, index, pos, mid + 1, hi);
              node->left = buildRange(postorder, index, pos, lo, mid - 1);
              return node;
          }
        `,
        c: code`
          static struct TreeNode* buildRange(int* postorder, int* index, int* pos, int lo, int hi);

          struct TreeNode* buildTree(int* inorder, int inorderSize, int* postorder, int postorderSize) {
              int* index = (int*) malloc(6001 * sizeof(int));
              for (int i = 0; i < inorderSize; i++) index[inorder[i] + 3000] = i;
              int pos = postorderSize - 1;
              struct TreeNode* root = buildRange(postorder, index, &pos, 0, inorderSize - 1);
              free(index);
              return root;
          }

          static struct TreeNode* buildRange(int* postorder, int* index, int* pos, int lo, int hi) {
              if (lo > hi) return NULL;
              int v = postorder[(*pos)--];
              struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              int mid = index[v + 3000];
              node->val = v;
              node->right = buildRange(postorder, index, pos, mid + 1, hi);
              node->left = buildRange(postorder, index, pos, lo, mid - 1);
              return node;
          }
        `,
        csharp: code`
          public static TreeNode BuildTree(int[] inorder, int[] postorder)
          {
              var index = new Dictionary<int, int>();
              for (int i = 0; i < inorder.Length; i++) index[inorder[i]] = i;
              int pos = postorder.Length - 1;
              return BuildRange(postorder, index, ref pos, 0, inorder.Length - 1);
          }

          static TreeNode BuildRange(int[] postorder, Dictionary<int, int> index, ref int pos, int lo, int hi)
          {
              if (lo > hi) return null;
              int v = postorder[pos--];
              var node = new TreeNode(v);
              int mid = index[v];
              node.right = BuildRange(postorder, index, ref pos, mid + 1, hi);
              node.left = BuildRange(postorder, index, ref pos, lo, mid - 1);
              return node;
          }
        `,
        go: code`
          func buildTree(inorder []int, postorder []int) *TreeNode {
              index := make(map[int]int, len(inorder))
              for i, v := range inorder {
                  index[v] = i
              }
              pos := len(postorder) - 1
              var build func(lo, hi int) *TreeNode
              build = func(lo, hi int) *TreeNode {
                  if lo > hi {
                      return nil
                  }
                  v := postorder[pos]
                  pos--
                  mid := index[v]
                  node := &TreeNode{Val: v}
                  node.Right = build(mid+1, hi)
                  node.Left = build(lo, mid-1)
                  return node
              }
              return build(0, len(inorder)-1)
          }
        `,
        kotlin: kt(`
          fun buildTree(inorder: IntArray, postorder: IntArray): TreeNode? {
              val index = HashMap<Int, Int>()
              for (i in inorder.indices) index[inorder[i]] = i
              var pos = postorder.size - 1
              fun build(lo: Int, hi: Int): TreeNode? {
                  if (lo > hi) return null
                  val v = postorder[pos--]
                  val node = TreeNode(v)
                  val mid = index[v]!!
                  node.right = build(mid + 1, hi)
                  node.left = build(lo, mid - 1)
                  return node
              }
              return build(0, inorder.size - 1)
          }
        `),
        swift: code`
          func buildTree(_ inorder: [Int], _ postorder: [Int]) -> TreeNode? {
              var index: [Int: Int] = [:]
              for (i, v) in inorder.enumerated() { index[v] = i }
              var pos = postorder.count - 1
              func build(_ lo: Int, _ hi: Int) -> TreeNode? {
                  if lo > hi { return nil }
                  let v = postorder[pos]
                  pos -= 1
                  let node = TreeNode(v)
                  let mid = index[v]!
                  node.right = build(mid + 1, hi)
                  node.left = build(lo, mid - 1)
                  return node
              }
              return build(0, inorder.count - 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn buildTree(inorder: Vec<i32>, postorder: Vec<i32>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut index: HashMap<i32, i32> = HashMap::new();
              for (i, v) in inorder.iter().enumerate() {
                  index.insert(*v, i as i32);
              }
              let mut pos: i32 = postorder.len() as i32 - 1;
              build_range(&postorder, &index, &mut pos, 0, inorder.len() as i32 - 1)
          }

          fn build_range(postorder: &Vec<i32>, index: &HashMap<i32, i32>, pos: &mut i32, lo: i32, hi: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if lo > hi {
                  return None;
              }
              let v = postorder[*pos as usize];
              *pos -= 1;
              let mid = index[&v];
              let right = build_range(postorder, index, pos, mid + 1, hi);
              let left = build_range(postorder, index, pos, lo, mid - 1);
              let node = Rc::new(RefCell::new(TreeNode::new(v)));
              node.borrow_mut().left = left;
              node.borrow_mut().right = right;
              Some(node)
          }
        `,
        php: code`
          function buildTree($inorder, $postorder) {
              $index = [];
              foreach ($inorder as $i => $v) $index[$v] = $i;
              $pos = count($postorder) - 1;
              return buildRange($postorder, $index, $pos, 0, count($inorder) - 1);
          }

          function buildRange(&$postorder, &$index, &$pos, $lo, $hi) {
              if ($lo > $hi) return null;
              $v = $postorder[$pos--];
              $node = new TreeNode($v);
              $mid = $index[$v];
              $node->right = buildRange($postorder, $index, $pos, $mid + 1, $hi);
              $node->left = buildRange($postorder, $index, $pos, $lo, $mid - 1);
              return $node;
          }
        `,
        ruby: code`
          def buildTree(inorder, postorder)
            index = {}
            inorder.each_with_index { |v, i| index[v] = i }
            state = { pos: postorder.length - 1 }
            build_range(postorder, index, state, 0, inorder.length - 1)
          end

          def build_range(postorder, index, state, lo, hi)
            return nil if lo > hi
            v = postorder[state[:pos]]
            state[:pos] -= 1
            node = TreeNode.new(v)
            mid = index[v]
            node.right = build_range(postorder, index, state, mid + 1, hi)
            node.left = build_range(postorder, index, state, lo, mid - 1)
            node
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Level Order Traversal II (LC 107) ───────────────
  (() => {
    const ref = (root: TNode | null) => levelsOf(root).reverse();
    const EX = [
      { root: [3, 9, 20, null, null, 15, 7], note: "The deepest level (15, 7) comes first and the root's level last; each level still reads left to right." },
      { root: [1], note: "A single node is a single level." },
      { root: [], note: "An empty tree has no levels." },
    ];
    return {
      slug: "binary-tree-level-order-traversal-ii",
      title: "Binary Tree Level Order Traversal II",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon", "Microsoft"],
      signature: { funcName: "levelOrderBottom", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[][]" as const },
      description: describe(
        "Given the `root` of a binary tree, return its node values level by level **from the bottom up**: the deepest level first and the root's level last, each level read from left to right.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntMat(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 2000", "-1000 <= Node.val <= 1000"]),
      hints: [
        "The levels themselves are the ordinary top-down level-order ones — only their order in the answer changes.",
        "Collect the levels top-down with a breadth-first queue, one list per level.",
        "Reverse the list of levels at the end (not the values inside each level).",
      ],
      editorial: explain({
        idea: "Bottom-up order is top-down level order with the list of levels reversed, so do a normal breadth-first traversal and reverse once at the end.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Process the tree level by level with a queue, children added left before right, appending one list of values per level.",
          "Reverse the order of the lists and return them.",
        ],
        why: "The breadth-first traversal produces each level's values left to right, in order of depth; reversing the outer list puts the deepest level first without touching the left-to-right order inside a level.",
        time: "O(n)",
        space: "O(w) for the queue, w the largest number of nodes on one level (plus the output)",
        pitfalls: [
          "Reverse the list of levels, not the values within each level.",
          "Inserting every level at the front of an array list costs O(L^2) moves; collect then reverse once.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntMat(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[0, 9], [-1000, 1000]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: fmtIntMat(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def levelOrderBottom(root: Optional[TreeNode]) -> List[List[int]]:
              out = []
              level = [root] if root else []
              while level:
                  out.append([node.val for node in level])
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              out.reverse()
              return out
        `,
        javascript: code`
          var levelOrderBottom = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0;
              while (head < queue.length) {
                  var end = queue.length, row = [];
                  while (head < end) {
                      var node = queue[head++];
                      row.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
              }
              return out.reverse();
          };
        `,
        typescript: code`
          function levelOrderBottom(root: TreeNode | null): number[][] {
              var out: number[][] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  var row: number[] = [];
                  while (head < end) {
                      var node = queue[head++];
                      row.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  out.push(row);
              }
              return out.reverse();
          }
        `,
        java: code`
          public static int[][] levelOrderBottom(TreeNode root) {
              List<int[]> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  int size = queue.size();
                  int[] row = new int[size];
                  for (int i = 0; i < size; i++) {
                      TreeNode node = queue.poll();
                      row[i] = node.val;
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  out.add(row);
              }
              Collections.reverse(out);
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> levelOrderBottom(TreeNode* root) {
              vector<vector<int>> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  int size = (int) q.size();
                  vector<int> row;
                  for (int i = 0; i < size; i++) {
                      TreeNode* node = q.front();
                      q.pop();
                      row.push_back(node->val);
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  out.push_back(row);
              }
              reverse(out.begin(), out.end());
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int** levelOrderBottom(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
              int n = countNodes(root);
              int** out = (int**) malloc((size_t) (n + 1) * sizeof(int*));
              int* cols = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, levels = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail, size = tail - head, k = 0;
                  int* row = (int*) malloc((size_t) size * sizeof(int));
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      row[k++] = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  out[levels] = row;
                  cols[levels] = size;
                  levels++;
              }
              for (int i = 0, j = levels - 1; i < j; i++, j--) {
                  int* tr = out[i]; out[i] = out[j]; out[j] = tr;
                  int tc = cols[i]; cols[i] = cols[j]; cols[j] = tc;
              }
              free(queue);
              *returnColumnSizes = cols;
              *returnSize = levels;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[][] LevelOrderBottom(TreeNode root)
          {
              var output = new List<int[]>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              while (queue.Count > 0)
              {
                  int size = queue.Count;
                  var row = new int[size];
                  for (int i = 0; i < size; i++)
                  {
                      var node = queue.Dequeue();
                      row[i] = node.val;
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  output.Add(row);
              }
              output.Reverse();
              return output.ToArray();
          }
        `,
        go: code`
          func levelOrderBottom(root *TreeNode) [][]int {
              out := [][]int{}
              if root == nil {
                  return out
              }
              level := []*TreeNode{root}
              for len(level) > 0 {
                  row := make([]int, 0, len(level))
                  next := []*TreeNode{}
                  for _, node := range level {
                      row = append(row, node.Val)
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  out = append(out, row)
                  level = next
              }
              for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
                  out[i], out[j] = out[j], out[i]
              }
              return out
          }
        `,
        kotlin: kt(`
          fun levelOrderBottom(root: TreeNode?): Array<IntArray> {
              val out = ArrayList<IntArray>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  val row = IntArray(level.size)
                  val next = ArrayList<TreeNode>()
                  for (i in level.indices) {
                      val node = level[i]
                      row[i] = node.\`val\`
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  out.add(row)
                  level = next
              }
              out.reverse()
              return out.toTypedArray()
          }
        `),
        swift: code`
          func levelOrderBottom(_ root: TreeNode?) -> [[Int]] {
              var out: [[Int]] = []
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  out.append(level.map { $0.val })
                  var next: [TreeNode] = []
                  for node in level {
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return Array(out.reversed())
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn levelOrderBottom(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let mut row: Vec<i32> = Vec::new();
                  let mut next: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
                  for node in &level {
                      let b = node.borrow();
                      row.push(b.val);
                      if let Some(l) = &b.left {
                          next.push(l.clone());
                      }
                      if let Some(r) = &b.right {
                          next.push(r.clone());
                      }
                  }
                  out.push(row);
                  level = next;
              }
              out.reverse();
              out
          }
        `,
        php: code`
          function levelOrderBottom($root) {
              $out = [];
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $row = [];
                  $next = [];
                  foreach ($level as $node) {
                      $row[] = $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $out[] = $row;
                  $level = $next;
              }
              return array_reverse($out);
          }
        `,
        ruby: code`
          def levelOrderBottom(root)
            out = []
            level = root.nil? ? [] : [root]
            until level.empty?
              out << level.map(&:val)
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            out.reverse
          end
        `,
      },
    };
  })(),

  // ── Path Sum II (LC 113) ────────────────────────────────────────
  (() => {
    const ref = (root: TNode | null, targetSum: number) => {
      const out: number[][] = [];
      const path: number[] = [];
      const walk = (n: TNode, rem: number) => {
        path.push(n.val);
        rem -= n.val;
        if (isLeaf(n) && rem === 0) out.push(path.slice());
        if (n.left) walk(n.left, rem);
        if (n.right) walk(n.right, rem);
        path.pop();
      };
      if (root) walk(root, targetSum);
      return out;
    };
    const EX = [
      { root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], target: 22, note: "5 + 4 + 11 + 2 = 22 and 5 + 8 + 4 + 5 = 22. The path ending at leaf 2 is listed first because that leaf is further left." },
      { root: [1, 2, 3], target: 5, note: "The two root-to-leaf paths sum to 3 and 4." },
      { root: [1, 2], target: 1, note: "The root alone sums to 1, but it is not a leaf — a path must end at a leaf." },
    ];
    return {
      slug: "path-sum-ii",
      title: "Path Sum II",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Backtracking", "Amazon", "Meta", "Google", "Bloomberg"],
      signature: { funcName: "pathSum", params: [{ name: "root", type: "TreeNode" as const }, { name: "targetSum", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given the `root` of a binary tree and an integer `targetSum`, return every **root-to-leaf** path whose node values add up to `targetSum`. A leaf is a node with no children, and each path is listed as the node values from the root down to the leaf.\n\nList the paths in the left-to-right order of their leaves. Return an empty list if there are none.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, targetSum = ${e.target}`, out: fmtIntMat(ref(treeFrom(e.root), e.target)), note: e.note })),
        ["0 <= number of nodes <= 5000", "-1000 <= Node.val <= 1000", "-1000 <= targetSum <= 1000"]),
      hints: [
        "Every candidate path starts at the root and ends at a leaf, so a depth-first walk from the root meets each one exactly once.",
        "Carry the remaining sum down the walk, and keep the current path in one list: add the node on the way in, remove it on the way out.",
        "At a leaf whose remaining sum is exactly 0, record a copy of the path. Visiting the left child before the right one lists the paths in left-to-right order of their leaves.",
      ],
      editorial: explain({
        idea: "Depth-first search with backtracking: one shared path list grows and shrinks as the walk goes down and back up, and a copy is saved at each leaf where the remaining sum reaches zero.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Visit a node with the sum still needed: append its value to the path and subtract it.",
          "If the node is a leaf and nothing remains, append a copy of the path to the answer.",
          "Visit the left child, then the right child, with the new remaining sum.",
          "Remove the node's value from the path before returning.",
        ],
        why: "Each root-to-leaf path corresponds to exactly one leaf, and the walk reaches every leaf with the path list holding exactly the nodes from the root to it (values are added on entry and removed on exit), so the checks are exact. Left-before-right recursion reaches the leaves in left-to-right order.",
        time: "O(n · h): each node is visited once, and copying a matching path costs up to its length h",
        space: "O(h) besides the output",
        pitfalls: [
          "Store a copy of the path — the shared list keeps changing.",
          "Values can be negative, so you cannot stop early when the running sum passes the target.",
          "Only paths that end at a leaf count; an inner node reaching the target is not an answer.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}`, expectedOutput: fmtIntMat(ref(treeFrom(e.root), e.target)) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.03 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[-2, 2], [-5, 5], [0, 3], [-25, 25]]);
        const root = shapeTree(rng, n, lo, hi);
        let target = ri(rng, -20, 20);
        if (root && rng() < 0.7) {
          let node = root, s = root.val;
          while (!isLeaf(node)) {
            node = node.left && node.right ? (rng() < 0.5 ? node.left : node.right) : (node.left || node.right)!;
            s += node.val;
          }
          target = s;
        }
        return { input: `${fmtTree(root)}\n${target}`, expectedOutput: fmtIntMat(ref(root, target)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def pathSum(root: Optional[TreeNode], targetSum: int) -> List[List[int]]:
              out = []
              path = []

              def walk(node, remaining):
                  path.append(node.val)
                  remaining -= node.val
                  if node.left is None and node.right is None and remaining == 0:
                      out.append(list(path))
                  if node.left:
                      walk(node.left, remaining)
                  if node.right:
                      walk(node.right, remaining)
                  path.pop()

              if root is not None:
                  walk(root, targetSum)
              return out
        `,
        javascript: code`
          var pathSum = function(root, targetSum) {
              var out = [], path = [];
              function walk(node, remaining) {
                  path.push(node.val);
                  remaining -= node.val;
                  if (node.left === null && node.right === null && remaining === 0) out.push(path.slice());
                  if (node.left !== null) walk(node.left, remaining);
                  if (node.right !== null) walk(node.right, remaining);
                  path.pop();
              }
              if (root !== null) walk(root, targetSum);
              return out;
          };
        `,
        typescript: code`
          function pathSum(root: TreeNode | null, targetSum: number): number[][] {
              var out: number[][] = [];
              var path: number[] = [];
              function walk(node: TreeNode, remaining: number): void {
                  path.push(node.val);
                  remaining -= node.val;
                  if (node.left === null && node.right === null && remaining === 0) out.push(path.slice());
                  if (node.left !== null) walk(node.left, remaining);
                  if (node.right !== null) walk(node.right, remaining);
                  path.pop();
              }
              if (root !== null) walk(root, targetSum);
              return out;
          }
        `,
        java: code`
          public static int[][] pathSum(TreeNode root, int targetSum) {
              List<int[]> out = new ArrayList<>();
              if (root != null) sumWalk(root, targetSum, new ArrayList<Integer>(), out);
              return out.toArray(new int[0][]);
          }

          static void sumWalk(TreeNode node, int remaining, List<Integer> path, List<int[]> out) {
              path.add(node.val);
              remaining -= node.val;
              if (node.left == null && node.right == null && remaining == 0) {
                  int[] copy = new int[path.size()];
                  for (int i = 0; i < copy.length; i++) copy[i] = path.get(i);
                  out.add(copy);
              }
              if (node.left != null) sumWalk(node.left, remaining, path, out);
              if (node.right != null) sumWalk(node.right, remaining, path, out);
              path.remove(path.size() - 1);
          }
        `,
        cpp: code`
          void sumWalk(TreeNode* node, int remaining, vector<int>& path, vector<vector<int>>& out);

          vector<vector<int>> pathSum(TreeNode* root, int targetSum) {
              vector<vector<int>> out;
              vector<int> path;
              if (root) sumWalk(root, targetSum, path, out);
              return out;
          }

          void sumWalk(TreeNode* node, int remaining, vector<int>& path, vector<vector<int>>& out) {
              path.push_back(node->val);
              remaining -= node->val;
              if (!node->left && !node->right && remaining == 0) out.push_back(path);
              if (node->left) sumWalk(node->left, remaining, path, out);
              if (node->right) sumWalk(node->right, remaining, path, out);
              path.pop_back();
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void sumWalk(struct TreeNode* node, int remaining, int* path, int depth, int** out, int* cols, int* k);

          int** pathSum(struct TreeNode* root, int targetSum, int* returnSize, int** returnColumnSizes) {
              int n = countNodes(root);
              int** out = (int**) malloc((size_t) (n + 1) * sizeof(int*));
              int* cols = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* path = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int k = 0;
              if (root != NULL) sumWalk(root, targetSum, path, 0, out, cols, &k);
              free(path);
              *returnSize = k;
              *returnColumnSizes = cols;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void sumWalk(struct TreeNode* node, int remaining, int* path, int depth, int** out, int* cols, int* k) {
              path[depth] = node->val;
              remaining -= node->val;
              if (node->left == NULL && node->right == NULL && remaining == 0) {
                  int* copy = (int*) malloc((size_t) (depth + 1) * sizeof(int));
                  memcpy(copy, path, (size_t) (depth + 1) * sizeof(int));
                  out[*k] = copy;
                  cols[*k] = depth + 1;
                  (*k)++;
              }
              if (node->left != NULL) sumWalk(node->left, remaining, path, depth + 1, out, cols, k);
              if (node->right != NULL) sumWalk(node->right, remaining, path, depth + 1, out, cols, k);
          }
        `,
        csharp: code`
          public static int[][] PathSum(TreeNode root, int targetSum)
          {
              var output = new List<int[]>();
              if (root != null) SumWalk(root, targetSum, new List<int>(), output);
              return output.ToArray();
          }

          static void SumWalk(TreeNode node, int remaining, List<int> path, List<int[]> output)
          {
              path.Add(node.val);
              remaining -= node.val;
              if (node.left == null && node.right == null && remaining == 0) output.Add(path.ToArray());
              if (node.left != null) SumWalk(node.left, remaining, path, output);
              if (node.right != null) SumWalk(node.right, remaining, path, output);
              path.RemoveAt(path.Count - 1);
          }
        `,
        go: code`
          func pathSum(root *TreeNode, targetSum int) [][]int {
              out := [][]int{}
              path := []int{}
              var walk func(node *TreeNode, remaining int)
              walk = func(node *TreeNode, remaining int) {
                  path = append(path, node.Val)
                  remaining -= node.Val
                  if node.Left == nil && node.Right == nil && remaining == 0 {
                      out = append(out, append([]int{}, path...))
                  }
                  if node.Left != nil {
                      walk(node.Left, remaining)
                  }
                  if node.Right != nil {
                      walk(node.Right, remaining)
                  }
                  path = path[:len(path)-1]
              }
              if root != nil {
                  walk(root, targetSum)
              }
              return out
          }
        `,
        kotlin: kt(`
          fun pathSum(root: TreeNode?, targetSum: Int): Array<IntArray> {
              val out = ArrayList<IntArray>()
              if (root != null) sumWalk(root, targetSum, ArrayList<Int>(), out)
              return out.toTypedArray()
          }

          fun sumWalk(node: TreeNode, remaining0: Int, path: ArrayList<Int>, out: ArrayList<IntArray>) {
              path.add(node.\`val\`)
              val remaining = remaining0 - node.\`val\`
              val l = node.left
              val r = node.right
              if (l == null && r == null && remaining == 0) out.add(path.toIntArray())
              if (l != null) sumWalk(l, remaining, path, out)
              if (r != null) sumWalk(r, remaining, path, out)
              path.removeAt(path.size - 1)
          }
        `),
        swift: code`
          func pathSum(_ root: TreeNode?, _ targetSum: Int) -> [[Int]] {
              var out: [[Int]] = []
              var path: [Int] = []
              if let r = root { sumWalk(r, targetSum, &path, &out) }
              return out
          }

          func sumWalk(_ node: TreeNode, _ remaining0: Int, _ path: inout [Int], _ out: inout [[Int]]) {
              path.append(node.val)
              let remaining = remaining0 - node.val
              if node.left == nil && node.right == nil && remaining == 0 { out.append(path) }
              if let l = node.left { sumWalk(l, remaining, &path, &out) }
              if let r = node.right { sumWalk(r, remaining, &path, &out) }
              path.removeLast()
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn pathSum(root: Option<Rc<RefCell<TreeNode>>>, targetSum: i32) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut path: Vec<i32> = Vec::new();
              sum_walk(&root, targetSum, &mut path, &mut out);
              out
          }

          fn sum_walk(node: &Option<Rc<RefCell<TreeNode>>>, remaining: i32, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              if let Some(rc) = node {
                  let n = rc.borrow();
                  path.push(n.val);
                  let rest = remaining - n.val;
                  if n.left.is_none() && n.right.is_none() && rest == 0 {
                      out.push(path.clone());
                  }
                  sum_walk(&n.left, rest, path, out);
                  sum_walk(&n.right, rest, path, out);
                  path.pop();
              }
          }
        `,
        php: code`
          function pathSum($root, $targetSum) {
              $out = [];
              $path = [];
              if ($root !== null) sumWalk($root, $targetSum, $path, $out);
              return $out;
          }

          function sumWalk($node, $remaining, &$path, &$out) {
              $path[] = $node->val;
              $remaining -= $node->val;
              if ($node->left === null && $node->right === null && $remaining == 0) $out[] = $path;
              if ($node->left !== null) sumWalk($node->left, $remaining, $path, $out);
              if ($node->right !== null) sumWalk($node->right, $remaining, $path, $out);
              array_pop($path);
          }
        `,
        ruby: code`
          def pathSum(root, targetSum)
            out = []
            sum_walk(root, targetSum, [], out) unless root.nil?
            out
          end

          def sum_walk(node, remaining, path, out)
            path << node.val
            remaining -= node.val
            out << path.dup if node.left.nil? && node.right.nil? && remaining.zero?
            sum_walk(node.left, remaining, path, out) if node.left
            sum_walk(node.right, remaining, path, out) if node.right
            path.pop
          end
        `,
      },
    };
  })(),

  // ── Flatten Binary Tree to Linked List (LC 114) ─────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let head: TNode | null = null;
      const vals = nodesOf(root).map((n) => n.val);
      for (let i = vals.length - 1; i >= 0; i--) head = { val: vals[i], left: null, right: head };
      return head;
    };
    const EX = [
      { root: [1, 2, 5, 3, 4, null, 6], note: "The preorder is 1, 2, 3, 4, 5, 6; each node becomes the right child of the one before it." },
      { root: [], note: "An empty tree stays empty." },
      { root: [0], note: "A single node is already a list." },
    ];
    return {
      slug: "flatten-binary-tree-to-linked-list",
      title: "Flatten Binary Tree to Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Meta", "Microsoft", "Amazon"],
      signature: { funcName: "flatten", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree, flatten it **in place** into a \"linked list\" made of the same nodes:\n\n- the list follows the tree's **preorder** (node, left subtree, right subtree);\n- each node's `right` pointer points to the next node of the list, and its `left` pointer is null.\n\nReturn the `root` once the tree is flattened.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 2000", "-100 <= Node.val <= 100"],
        "Can you flatten the tree with O(1) extra space?"),
      hints: [
        "In preorder, a node's whole left subtree comes right after it, and its right subtree comes after the last node of the left subtree.",
        "The last node of a left subtree in preorder is its rightmost node — follow `right` pointers from the left child until there are none.",
        "At each node with a left child: hang the node's right subtree off that rightmost node, move the left subtree to the right, clear the left pointer, then continue to the right.",
      ],
      editorial: explain({
        idea: "Splice each left subtree in between a node and its right subtree. The left subtree's last preorder node — its rightmost node — is where the old right subtree reattaches. Doing this top-down along the right spine flattens the tree with no stack.",
        steps: [
          "Let `cur` be the root.",
          "While `cur` is not null: if it has a left child, find `pre`, the rightmost node of the left subtree.",
          "Set `pre.right = cur.right`, then `cur.right = cur.left` and `cur.left = null`.",
          "Move `cur` to `cur.right` and repeat.",
          "Return the root.",
        ],
        why: "After the splice, the order that follows `cur` is: its old left subtree (in which `pre` is the last node in preorder) and then its old right subtree — exactly the preorder of `cur`'s subtree. The splice keeps every subtree's internal preorder, and the walk then repeats the step on every node of the new right chain, so when it ends no left pointer remains and the chain is the full preorder.",
        time: "O(n): each node is passed over a constant number of times as `cur` and as part of a rightmost search",
        space: "O(1)",
        pitfalls: [
          "Save the right subtree before overwriting `cur.right`, or it is lost.",
          "Clear `left` on every node — a list node with a leftover left child is not flattened.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, -100, 100);
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def flatten(root: Optional[TreeNode]) -> Optional[TreeNode]:
              cur = root
              while cur:
                  if cur.left:
                      pre = cur.left
                      while pre.right:
                          pre = pre.right
                      pre.right = cur.right
                      cur.right = cur.left
                      cur.left = None
                  cur = cur.right
              return root
        `,
        javascript: code`
          var flatten = function(root) {
              var cur = root;
              while (cur !== null) {
                  if (cur.left !== null) {
                      var pre = cur.left;
                      while (pre.right !== null) pre = pre.right;
                      pre.right = cur.right;
                      cur.right = cur.left;
                      cur.left = null;
                  }
                  cur = cur.right;
              }
              return root;
          };
        `,
        typescript: code`
          function flatten(root: TreeNode | null): TreeNode | null {
              var cur = root;
              while (cur !== null) {
                  if (cur.left !== null) {
                      var pre = cur.left;
                      while (pre.right !== null) pre = pre.right;
                      pre.right = cur.right;
                      cur.right = cur.left;
                      cur.left = null;
                  }
                  cur = cur.right;
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode flatten(TreeNode root) {
              TreeNode cur = root;
              while (cur != null) {
                  if (cur.left != null) {
                      TreeNode pre = cur.left;
                      while (pre.right != null) pre = pre.right;
                      pre.right = cur.right;
                      cur.right = cur.left;
                      cur.left = null;
                  }
                  cur = cur.right;
              }
              return root;
          }
        `,
        cpp: code`
          TreeNode* flatten(TreeNode* root) {
              TreeNode* cur = root;
              while (cur) {
                  if (cur->left) {
                      TreeNode* pre = cur->left;
                      while (pre->right) pre = pre->right;
                      pre->right = cur->right;
                      cur->right = cur->left;
                      cur->left = nullptr;
                  }
                  cur = cur->right;
              }
              return root;
          }
        `,
        c: code`
          struct TreeNode* flatten(struct TreeNode* root) {
              struct TreeNode* cur = root;
              while (cur != NULL) {
                  if (cur->left != NULL) {
                      struct TreeNode* pre = cur->left;
                      while (pre->right != NULL) pre = pre->right;
                      pre->right = cur->right;
                      cur->right = cur->left;
                      cur->left = NULL;
                  }
                  cur = cur->right;
              }
              return root;
          }
        `,
        csharp: code`
          public static TreeNode Flatten(TreeNode root)
          {
              var cur = root;
              while (cur != null)
              {
                  if (cur.left != null)
                  {
                      var pre = cur.left;
                      while (pre.right != null) pre = pre.right;
                      pre.right = cur.right;
                      cur.right = cur.left;
                      cur.left = null;
                  }
                  cur = cur.right;
              }
              return root;
          }
        `,
        go: code`
          func flatten(root *TreeNode) *TreeNode {
              cur := root
              for cur != nil {
                  if cur.Left != nil {
                      pre := cur.Left
                      for pre.Right != nil {
                          pre = pre.Right
                      }
                      pre.Right = cur.Right
                      cur.Right = cur.Left
                      cur.Left = nil
                  }
                  cur = cur.Right
              }
              return root
          }
        `,
        kotlin: kt(`
          fun flatten(root: TreeNode?): TreeNode? {
              var cur = root
              while (cur != null) {
                  val left = cur.left
                  if (left != null) {
                      var pre: TreeNode = left
                      while (true) {
                          val next = pre.right ?: break
                          pre = next
                      }
                      pre.right = cur.right
                      cur.right = left
                      cur.left = null
                  }
                  cur = cur.right
              }
              return root
          }
        `),
        swift: code`
          func flatten(_ root: TreeNode?) -> TreeNode? {
              var cur = root
              while let node = cur {
                  if let left = node.left {
                      var pre = left
                      while let next = pre.right { pre = next }
                      pre.right = node.right
                      node.right = left
                      node.left = nil
                  }
                  cur = node.right
              }
              return root
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn flatten(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut cur = root.clone();
              while let Some(node) = cur {
                  let left = node.borrow_mut().left.take();
                  if let Some(l) = left {
                      let mut pre = l.clone();
                      loop {
                          let next = pre.borrow().right.clone();
                          match next {
                              Some(nx) => pre = nx,
                              None => break,
                          }
                      }
                      let right = node.borrow_mut().right.take();
                      pre.borrow_mut().right = right;
                      node.borrow_mut().right = Some(l);
                  }
                  cur = node.borrow().right.clone();
              }
              root
          }
        `,
        php: code`
          function flatten($root) {
              $cur = $root;
              while ($cur !== null) {
                  if ($cur->left !== null) {
                      $pre = $cur->left;
                      while ($pre->right !== null) $pre = $pre->right;
                      $pre->right = $cur->right;
                      $cur->right = $cur->left;
                      $cur->left = null;
                  }
                  $cur = $cur->right;
              }
              return $root;
          }
        `,
        ruby: code`
          def flatten(root)
            cur = root
            while cur
              if cur.left
                pre = cur.left
                pre = pre.right while pre.right
                pre.right = cur.right
                cur.right = cur.left
                cur.left = nil
              end
              cur = cur.right
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Sum Root to Leaf Numbers (LC 129) ───────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let total = 0;
      const walk = (n: TNode, cur: number) => {
        cur = cur * 10 + n.val;
        if (isLeaf(n)) { total += cur; return; }
        if (n.left) walk(n.left, cur);
        if (n.right) walk(n.right, cur);
      };
      if (root) walk(root, 0);
      return total;
    };
    const EX = [
      { root: [1, 2, 3], note: "The paths spell 12 and 13, and 12 + 13 = 25." },
      { root: [4, 9, 0, 5, 1], note: "The paths spell 495, 491 and 40, and 495 + 491 + 40 = 1026." },
      { root: [0, 1], note: "The only path spells 01, which is the number 1." },
    ];
    return {
      slug: "sum-root-to-leaf-numbers",
      title: "Sum Root to Leaf Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Meta", "Google"],
      signature: { funcName: "sumNumbers", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree in which every node holds a single digit from `0` to `9`. Each **root-to-leaf** path spells a number: the digits read from the root down to the leaf (a node with no children). For example the path `1 → 2 → 3` spells `123`.\n\nReturn the sum of the numbers spelled by all root-to-leaf paths. The answer fits in a 32-bit signed integer.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 1000", "0 <= Node.val <= 9", "the depth of the tree does not exceed 10", "the answer fits in a 32-bit signed integer"]),
      hints: [
        "Appending a digit `d` to a number `x` gives `10 * x + d`.",
        "Walk from the root downwards carrying the number spelled so far.",
        "At a leaf the carried number is complete — add it to the total. An inner node only passes its number on to its children.",
      ],
      editorial: explain({
        idea: "Carry the number spelled so far down a depth-first walk; at each node it becomes `10 * carried + digit`, and each leaf contributes the number that reaches it.",
        steps: [
          "Visit the root with a carried value of 0.",
          "At a node, set `cur = 10 * carried + node.val`.",
          "If the node is a leaf, return `cur`.",
          "Otherwise return the sum of the results for its existing children, each visited with `cur`.",
        ],
        why: "The value reaching a node is exactly the number spelled by the path from the root to it, by induction: the root gets its own digit, and a child gets its parent's number with its digit appended. Every leaf is reached once, so every root-to-leaf number is added once.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "A node with one child is not a leaf — do not count its partial number.",
          "Leading zeros are fine: the path `0 → 1` spells 1.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        for (;;) {
          const depth = pick(rng, [1, 3, 5, 8, 10, 10]);
          const root = depthTree(rng, sizeOf(rng, [1, 5, 15, 30, 40]), depth, 0, 9);
          const total = ref(root);
          if (total <= 2147483647) return { input: fmtTree(root), expectedOutput: String(total) };
        }
      },
      solutions: {
        python: code`
          from typing import Optional

          def sumNumbers(root: Optional[TreeNode]) -> int:
              def walk(node, cur):
                  cur = cur * 10 + node.val
                  if node.left is None and node.right is None:
                      return cur
                  total = 0
                  if node.left:
                      total += walk(node.left, cur)
                  if node.right:
                      total += walk(node.right, cur)
                  return total

              return walk(root, 0) if root else 0
        `,
        javascript: code`
          var sumNumbers = function(root) {
              return root === null ? 0 : digitWalk(root, 0);
          };

          var digitWalk = function(node, cur) {
              cur = cur * 10 + node.val;
              if (node.left === null && node.right === null) return cur;
              var total = 0;
              if (node.left !== null) total += digitWalk(node.left, cur);
              if (node.right !== null) total += digitWalk(node.right, cur);
              return total;
          };
        `,
        typescript: code`
          function sumNumbers(root: TreeNode | null): number {
              return root === null ? 0 : digitWalk(root, 0);
          }

          function digitWalk(node: TreeNode, cur: number): number {
              cur = cur * 10 + node.val;
              if (node.left === null && node.right === null) return cur;
              var total = 0;
              if (node.left !== null) total += digitWalk(node.left, cur);
              if (node.right !== null) total += digitWalk(node.right, cur);
              return total;
          }
        `,
        java: code`
          public static int sumNumbers(TreeNode root) {
              return root == null ? 0 : digitWalk(root, 0);
          }

          static int digitWalk(TreeNode node, int cur) {
              cur = cur * 10 + node.val;
              if (node.left == null && node.right == null) return cur;
              int total = 0;
              if (node.left != null) total += digitWalk(node.left, cur);
              if (node.right != null) total += digitWalk(node.right, cur);
              return total;
          }
        `,
        cpp: code`
          int digitWalk(TreeNode* node, int cur);

          int sumNumbers(TreeNode* root) {
              return root ? digitWalk(root, 0) : 0;
          }

          int digitWalk(TreeNode* node, int cur) {
              cur = cur * 10 + node->val;
              if (!node->left && !node->right) return cur;
              int total = 0;
              if (node->left) total += digitWalk(node->left, cur);
              if (node->right) total += digitWalk(node->right, cur);
              return total;
          }
        `,
        c: code`
          static int digitWalk(struct TreeNode* node, int cur);

          int sumNumbers(struct TreeNode* root) {
              return root == NULL ? 0 : digitWalk(root, 0);
          }

          static int digitWalk(struct TreeNode* node, int cur) {
              cur = cur * 10 + node->val;
              if (node->left == NULL && node->right == NULL) return cur;
              int total = 0;
              if (node->left != NULL) total += digitWalk(node->left, cur);
              if (node->right != NULL) total += digitWalk(node->right, cur);
              return total;
          }
        `,
        csharp: code`
          public static int SumNumbers(TreeNode root)
          {
              return root == null ? 0 : DigitWalk(root, 0);
          }

          static int DigitWalk(TreeNode node, int cur)
          {
              cur = cur * 10 + node.val;
              if (node.left == null && node.right == null) return cur;
              int total = 0;
              if (node.left != null) total += DigitWalk(node.left, cur);
              if (node.right != null) total += DigitWalk(node.right, cur);
              return total;
          }
        `,
        go: code`
          func sumNumbers(root *TreeNode) int {
              if root == nil {
                  return 0
              }
              return digitWalk(root, 0)
          }

          func digitWalk(node *TreeNode, cur int) int {
              cur = cur*10 + node.Val
              if node.Left == nil && node.Right == nil {
                  return cur
              }
              total := 0
              if node.Left != nil {
                  total += digitWalk(node.Left, cur)
              }
              if node.Right != nil {
                  total += digitWalk(node.Right, cur)
              }
              return total
          }
        `,
        kotlin: kt(`
          fun sumNumbers(root: TreeNode?): Int {
              return if (root == null) 0 else digitWalk(root, 0)
          }

          fun digitWalk(node: TreeNode, carried: Int): Int {
              val cur = carried * 10 + node.\`val\`
              val l = node.left
              val r = node.right
              if (l == null && r == null) return cur
              var total = 0
              if (l != null) total += digitWalk(l, cur)
              if (r != null) total += digitWalk(r, cur)
              return total
          }
        `),
        swift: code`
          func sumNumbers(_ root: TreeNode?) -> Int {
              guard let r = root else { return 0 }
              return digitWalk(r, 0)
          }

          func digitWalk(_ node: TreeNode, _ carried: Int) -> Int {
              let cur = carried * 10 + node.val
              if node.left == nil && node.right == nil { return cur }
              var total = 0
              if let l = node.left { total += digitWalk(l, cur) }
              if let r = node.right { total += digitWalk(r, cur) }
              return total
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sumNumbers(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              digit_walk(&root, 0)
          }

          fn digit_walk(node: &Option<Rc<RefCell<TreeNode>>>, carried: i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let cur = carried * 10 + n.val;
                      if n.left.is_none() && n.right.is_none() {
                          cur
                      } else {
                          digit_walk(&n.left, cur) + digit_walk(&n.right, cur)
                      }
                  }
              }
          }
        `,
        php: code`
          function sumNumbers($root) {
              return $root === null ? 0 : digitWalk($root, 0);
          }

          function digitWalk($node, $cur) {
              $cur = $cur * 10 + $node->val;
              if ($node->left === null && $node->right === null) return $cur;
              $total = 0;
              if ($node->left !== null) $total += digitWalk($node->left, $cur);
              if ($node->right !== null) $total += digitWalk($node->right, $cur);
              return $total;
          }
        `,
        ruby: code`
          def sumNumbers(root)
            root.nil? ? 0 : digit_walk(root, 0)
          end

          def digit_walk(node, cur)
            cur = cur * 10 + node.val
            return cur if node.left.nil? && node.right.nil?
            total = 0
            total += digit_walk(node.left, cur) if node.left
            total += digit_walk(node.right, cur) if node.right
            total
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Right Side View (LC 199) ────────────────────────
  (() => {
    const ref = (root: TNode | null) => levelsOf(root).map((row) => row[row.length - 1]);
    const EX = [
      { root: [1, 2, 3, null, 5, null, 4], note: "Standing on the right you see 1, then 3, then 4 — the last node of each level." },
      { root: [1, 2, 3, 4], note: "The deepest level holds only 4, a left descendant, yet nothing to its right hides it." },
      { root: [], note: "An empty tree shows nothing." },
    ];
    return {
      slug: "binary-tree-right-side-view",
      title: "Binary Tree Right Side View",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Depth-First Search", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "rightSideView", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Imagine standing to the right of a binary tree and looking at it. On every level you see only the node furthest to the right.\n\nGiven the `root` of the tree, return the values you can see, from the top level down. Return an empty list for an empty tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 100", "-100 <= Node.val <= 100"]),
      hints: [
        "You see exactly one node per level.",
        "The visible node is the last one of its level when the level is read from left to right — it need not be a right child.",
        "Do a level-order traversal and record the last node taken from each level.",
      ],
      editorial: explain({
        idea: "Traverse level by level; the last node of each level is the one visible from the right.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Put the root in a queue.",
          "While the queue is not empty, take the `size` nodes of the current level, enqueuing each one's left then right child; append the value of the last of them.",
          "Return the collected values.",
        ],
        why: "With children enqueued left before right, each round of the queue holds one complete level in left-to-right order, so its last node is the rightmost node of that level — the only one not hidden by a node further right.",
        time: "O(n)",
        space: "O(w), w the largest number of nodes on one level",
        pitfalls: [
          "Following only right children misses levels where the rightmost node hangs off a left branch, as in `[1,2,3,4]`.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const [lo, hi] = pick(rng, [[0, 9], [-100, 100]]);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def rightSideView(root: Optional[TreeNode]) -> List[int]:
              out = []
              level = [root] if root else []
              while level:
                  out.append(level[-1].val)
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
              return out
        `,
        javascript: code`
          var rightSideView = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  out.push(queue[end - 1].val);
                  while (head < end) {
                      var node = queue[head++];
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function rightSideView(root: TreeNode | null): number[] {
              var out: number[] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  out.push(queue[end - 1].val);
                  while (head < end) {
                      var node = queue[head++];
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
              }
              return out;
          }
        `,
        java: code`
          public static int[] rightSideView(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  out.add(queue.peekLast().val);
                  for (int i = queue.size(); i > 0; i--) {
                      TreeNode node = queue.poll();
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> rightSideView(TreeNode* root) {
              vector<int> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  out.push_back(q.back()->val);
                  for (int i = (int) q.size(); i > 0; i--) {
                      TreeNode* node = q.front();
                      q.pop();
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int* rightSideView(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, len = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  out[len++] = queue[end - 1]->val;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
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
          public static int[] RightSideView(TreeNode root)
          {
              var output = new List<int>();
              var level = new List<TreeNode>();
              if (root != null) level.Add(root);
              while (level.Count > 0)
              {
                  output.Add(level[level.Count - 1].val);
                  var next = new List<TreeNode>();
                  foreach (var node in level)
                  {
                      if (node.left != null) next.Add(node.left);
                      if (node.right != null) next.Add(node.right);
                  }
                  level = next;
              }
              return output.ToArray();
          }
        `,
        go: code`
          func rightSideView(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              level := []*TreeNode{root}
              for len(level) > 0 {
                  out = append(out, level[len(level)-1].Val)
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
              return out
          }
        `,
        kotlin: kt(`
          fun rightSideView(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  out.add(level[level.size - 1].\`val\`)
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      val l = node.left
                      val r = node.right
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func rightSideView(_ root: TreeNode?) -> [Int] {
              var out: [Int] = []
              var level: [TreeNode] = []
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  out.append(level[level.count - 1].val)
                  var next: [TreeNode] = []
                  for node in level {
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  level = next
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn rightSideView(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  out.push(level[level.len() - 1].borrow().val);
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
              out
          }
        `,
        php: code`
          function rightSideView($root) {
              $out = [];
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $out[] = $level[count($level) - 1]->val;
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $level = $next;
              }
              return $out;
          }
        `,
        ruby: code`
          def rightSideView(root)
            out = []
            level = root.nil? ? [] : [root]
            until level.empty?
              out << level[-1].val
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Kth Smallest Element in a BST (LC 230) ──────────────────────
  (() => {
    const ref = (root: TNode | null, k: number) => inorderOf(root)[k - 1];
    const EX = [
      { root: [3, 1, 4, null, 2], k: 1, note: "In increasing order the values are 1, 2, 3, 4; the first is 1." },
      { root: [5, 3, 6, 2, 4, null, null, 1], k: 3, note: "In increasing order the values are 1, 2, 3, 4, 5, 6; the third is 3." },
      { root: [2, 1], k: 2, note: "The largest of two values is the second smallest." },
    ];
    return {
      slug: "kth-smallest-element-in-a-bst",
      title: "Kth Smallest Element in a BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Meta", "Google"],
      signature: { funcName: "kthSmallest", params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a **binary search tree** with distinct values and an integer `k`, return the `k`-th smallest value in the tree (counting from 1).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, k = ${e.k}`, out: String(ref(treeFrom(e.root), e.k)), note: e.note })),
        ["1 <= k <= number of nodes <= 10^4", "0 <= Node.val <= 10^4", "all node values are distinct", "root is a valid binary search tree"],
        "If the tree were modified often (inserts and deletes) and you had to answer this query many times, how would you speed it up?"),
      hints: [
        "An in-order traversal (left, node, right) of a binary search tree lists its values in increasing order.",
        "You do not need the whole sorted list — only its k-th entry.",
        "Run the in-order traversal iteratively with a stack and stop the moment the k-th node is popped.",
      ],
      editorial: explain({
        idea: "In-order traversal visits a binary search tree's values in increasing order, so the k-th node it visits holds the answer; an explicit stack lets the walk stop right there.",
        steps: [
          "Start with an empty stack and `cur = root`.",
          "Push `cur` and move left until `cur` is null.",
          "Pop a node and decrease `k`; if `k` reaches 0, return the node's value.",
          "Otherwise set `cur` to the popped node's right child and repeat.",
        ],
        why: "For every node, in-order visits all of its (smaller) left subtree, then the node, then its (larger) right subtree, so by induction the nodes are popped in increasing order of value. The k-th pop is therefore the k-th smallest value.",
        time: "O(h + k), h the height of the tree",
        space: "O(h)",
        pitfalls: [
          "k counts from 1.",
          "For the follow-up, store each node's subtree size: the rank of the root is then known and the search descends one side, O(h) per query.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.k}`, expectedOutput: String(ref(treeFrom(e.root), e.k)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 2, 100, 10000]);
        const root = bstOf(rng, n, 0, hi);
        const k = rng() < 0.15 ? pick(rng, [1, n]) : ri(rng, 1, n);
        return { input: `${fmtTree(root)}\n${k}`, expectedOutput: String(ref(root, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def kthSmallest(root: Optional[TreeNode], k: int) -> int:
              stack = []
              node = root
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  k -= 1
                  if k == 0:
                      return node.val
                  node = node.right
              return -1
        `,
        javascript: code`
          var kthSmallest = function(root, k) {
              var stack = [], node = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (--k === 0) return node.val;
                  node = node.right;
              }
              return -1;
          };
        `,
        typescript: code`
          function kthSmallest(root: TreeNode | null, k: number): number {
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  if (--k === 0) return top.val;
                  node = top.right;
              }
              return -1;
          }
        `,
        java: code`
          public static int kthSmallest(TreeNode root, int k) {
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  if (--k == 0) return node.val;
                  node = node.right;
              }
              return -1;
          }
        `,
        cpp: code`
          int kthSmallest(TreeNode* root, int k) {
              vector<TreeNode*> stack;
              TreeNode* node = root;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  if (--k == 0) return node->val;
                  node = node->right;
              }
              return -1;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int kthSmallest(struct TreeNode* root, int k) {
              int n = countNodes(root);
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              struct TreeNode* node = root;
              int top = 0, answer = -1;
              while (top > 0 || node != NULL) {
                  while (node != NULL) { stack[top++] = node; node = node->left; }
                  node = stack[--top];
                  if (--k == 0) { answer = node->val; break; }
                  node = node->right;
              }
              free(stack);
              return answer;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int KthSmallest(TreeNode root, int k)
          {
              var stack = new Stack<TreeNode>();
              var node = root;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  if (--k == 0) return node.val;
                  node = node.right;
              }
              return -1;
          }
        `,
        go: code`
          func kthSmallest(root *TreeNode, k int) int {
              stack := []*TreeNode{}
              node := root
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  k--
                  if k == 0 {
                      return node.Val
                  }
                  node = node.Right
              }
              return -1
          }
        `,
        kotlin: kt(`
          fun kthSmallest(root: TreeNode?, k: Int): Int {
              val stack = ArrayList<TreeNode>()
              var node = root
              var left = k
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  left--
                  if (left == 0) return top.\`val\`
                  node = top.right
              }
              return -1
          }
        `),
        swift: code`
          func kthSmallest(_ root: TreeNode?, _ k: Int) -> Int {
              var stack: [TreeNode] = []
              var node = root
              var left = k
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  left -= 1
                  if left == 0 { return top.val }
                  node = top.right
              }
              return -1
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn kthSmallest(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> i32 {
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root;
              let mut left = k;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let top = stack.pop().unwrap();
                  left -= 1;
                  if left == 0 {
                      return top.borrow().val;
                  }
                  cur = top.borrow().right.clone();
              }
              -1
          }
        `,
        php: code`
          function kthSmallest($root, $k) {
              $stack = [];
              $node = $root;
              while (count($stack) > 0 || $node !== null) {
                  while ($node !== null) { $stack[] = $node; $node = $node->left; }
                  $node = array_pop($stack);
                  if (--$k == 0) return $node->val;
                  $node = $node->right;
              }
              return -1;
          }
        `,
        ruby: code`
          def kthSmallest(root, k)
            stack = []
            node = root
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              k -= 1
              return node.val if k.zero?
              node = node.right
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Lowest Common Ancestor of a Binary Search Tree (LC 235) ─────
  (() => {
    const ref = (root: TNode | null, p: number, q: number) => {
      let node = root;
      while (node) {
        if (p < node.val && q < node.val) node = node.left;
        else if (p > node.val && q > node.val) node = node.right;
        else return node.val;
      }
      return -1;
    };
    const T = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5];
    const EX = [
      { root: T, p: 2, q: 8, note: "2 is in the root's left subtree and 8 in its right, so they part ways at the root 6." },
      { root: T, p: 2, q: 4, note: "4 lies below 2, and a node counts as its own descendant, so the answer is 2." },
      { root: [2, 1], p: 2, q: 1, note: "The root is an ancestor of 1 and of itself." },
    ];
    return {
      slug: "lowest-common-ancestor-of-a-binary-search-tree",
      title: "Lowest Common Ancestor of a Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Depth-First Search", "Amazon", "Meta", "Microsoft", "LinkedIn"],
      signature: { funcName: "lowestCommonAncestor", params: [{ name: "root", type: "TreeNode" as const }, { name: "p", type: "int" as const }, { name: "q", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** with distinct values and the values `p` and `q` of two different nodes in it.\n\nThe **lowest common ancestor** of two nodes is the deepest node that has both of them in its subtree — where a node counts as being in its own subtree, so a node can be the ancestor of itself. Return the value of the lowest common ancestor of the nodes holding `p` and `q`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, p = ${e.p}, q = ${e.q}`, out: String(ref(treeFrom(e.root), e.p, e.q)), note: e.note })),
        ["2 <= number of nodes <= 10^5", "-10^9 <= Node.val <= 10^9", "all node values are distinct", "root is a valid binary search tree", "p != q", "p and q both exist in the tree"]),
      hints: [
        "Compare `p` and `q` with the root's value: when both are smaller, both nodes are in the left subtree; when both are larger, both are in the right subtree.",
        "Keep moving down while `p` and `q` are on the same side of the current node.",
        "The first node where they split — or where one of them equals the node — is the answer.",
      ],
      editorial: explain({
        idea: "The ordering tells you which side each value is on, so walk down from the root while `p` and `q` lie on the same side; the node where they separate is their lowest common ancestor.",
        steps: [
          "Start at the root.",
          "If `p` and `q` are both smaller than the node's value, move to the left child.",
          "If both are larger, move to the right child.",
          "Otherwise (they are on different sides, or one equals the node) return the node's value.",
        ],
        why: "While both values lie on the same side of a node, both nodes are in that child's subtree, so the child is a common ancestor deeper than the current one. At the first node where they do not, one is in its left subtree (or is the node) and the other in its right subtree (or is the node), so no child contains both — this node is the deepest common ancestor.",
        time: "O(h), h the height of the tree",
        space: "O(1)",
        pitfalls: [
          "A node is its own descendant: when `p` is the current node, it is the answer even though `q` is below it.",
          "The general binary-tree method also works but ignores the ordering that makes this a single walk.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.p}\n${e.q}`, expectedOutput: String(ref(treeFrom(e.root), e.p, e.q)) })),
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 30, 40]));
        const [lo, hi] = pick(rng, [[0, 60], [-1000, 1000], [-1000000000, 1000000000]] as Array<[number, number]>);
        const root = bstOf(rng, n, lo, hi);
        const vals = shuffle(rng, nodesOf(root).map((x) => x.val));
        return { input: `${fmtTree(root)}\n${vals[0]}\n${vals[1]}`, expectedOutput: String(ref(root, vals[0], vals[1])) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def lowestCommonAncestor(root: Optional[TreeNode], p: int, q: int) -> int:
              node = root
              while node:
                  if p < node.val and q < node.val:
                      node = node.left
                  elif p > node.val and q > node.val:
                      node = node.right
                  else:
                      return node.val
              return -1
        `,
        javascript: code`
          var lowestCommonAncestor = function(root, p, q) {
              var node = root;
              while (node !== null) {
                  if (p < node.val && q < node.val) node = node.left;
                  else if (p > node.val && q > node.val) node = node.right;
                  else return node.val;
              }
              return -1;
          };
        `,
        typescript: code`
          function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
              var node = root;
              while (node !== null) {
                  if (p < node.val && q < node.val) node = node.left;
                  else if (p > node.val && q > node.val) node = node.right;
                  else return node.val;
              }
              return -1;
          }
        `,
        java: code`
          public static int lowestCommonAncestor(TreeNode root, int p, int q) {
              TreeNode node = root;
              while (node != null) {
                  if (p < node.val && q < node.val) node = node.left;
                  else if (p > node.val && q > node.val) node = node.right;
                  else return node.val;
              }
              return -1;
          }
        `,
        cpp: code`
          int lowestCommonAncestor(TreeNode* root, int p, int q) {
              TreeNode* node = root;
              while (node) {
                  if (p < node->val && q < node->val) node = node->left;
                  else if (p > node->val && q > node->val) node = node->right;
                  else return node->val;
              }
              return -1;
          }
        `,
        c: code`
          int lowestCommonAncestor(struct TreeNode* root, int p, int q) {
              struct TreeNode* node = root;
              while (node != NULL) {
                  if (p < node->val && q < node->val) node = node->left;
                  else if (p > node->val && q > node->val) node = node->right;
                  else return node->val;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int LowestCommonAncestor(TreeNode root, int p, int q)
          {
              var node = root;
              while (node != null)
              {
                  if (p < node.val && q < node.val) node = node.left;
                  else if (p > node.val && q > node.val) node = node.right;
                  else return node.val;
              }
              return -1;
          }
        `,
        go: code`
          func lowestCommonAncestor(root *TreeNode, p int, q int) int {
              node := root
              for node != nil {
                  if p < node.Val && q < node.Val {
                      node = node.Left
                  } else if p > node.Val && q > node.Val {
                      node = node.Right
                  } else {
                      return node.Val
                  }
              }
              return -1
          }
        `,
        kotlin: kt(`
          fun lowestCommonAncestor(root: TreeNode?, p: Int, q: Int): Int {
              var node = root
              while (node != null) {
                  val v = node.\`val\`
                  node = if (p < v && q < v) node.left else if (p > v && q > v) node.right else return v
              }
              return -1
          }
        `),
        swift: code`
          func lowestCommonAncestor(_ root: TreeNode?, _ p: Int, _ q: Int) -> Int {
              var node = root
              while let n = node {
                  if p < n.val && q < n.val {
                      node = n.left
                  } else if p > n.val && q > n.val {
                      node = n.right
                  } else {
                      return n.val
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn lowestCommonAncestor(root: Option<Rc<RefCell<TreeNode>>>, p: i32, q: i32) -> i32 {
              let mut cur = root;
              while let Some(n) = cur {
                  let v = n.borrow().val;
                  if p < v && q < v {
                      cur = n.borrow().left.clone();
                  } else if p > v && q > v {
                      cur = n.borrow().right.clone();
                  } else {
                      return v;
                  }
              }
              -1
          }
        `,
        php: code`
          function lowestCommonAncestor($root, $p, $q) {
              $node = $root;
              while ($node !== null) {
                  if ($p < $node->val && $q < $node->val) $node = $node->left;
                  elseif ($p > $node->val && $q > $node->val) $node = $node->right;
                  else return $node->val;
              }
              return -1;
          }
        `,
        ruby: code`
          def lowestCommonAncestor(root, p, q)
            node = root
            while node
              if p < node.val && q < node.val
                node = node.left
              elsif p > node.val && q > node.val
                node = node.right
              else
                return node.val
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Lowest Common Ancestor of a Binary Tree (LC 236) ────────────
  (() => {
    const ref = (root: TNode | null, p: number, q: number) => {
      const pathTo = (n: TNode | null, x: number, acc: number[]): boolean => {
        if (!n) return false;
        acc.push(n.val);
        if (n.val === x || pathTo(n.left, x, acc) || pathTo(n.right, x, acc)) return true;
        acc.pop();
        return false;
      };
      const a: number[] = [], b: number[] = [];
      pathTo(root, p, a); pathTo(root, q, b);
      let i = 0;
      while (i + 1 < a.length && i + 1 < b.length && a[i + 1] === b[i + 1]) i++;
      return a[i];
    };
    const T = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4];
    const EX = [
      { root: T, p: 5, q: 1, note: "5 is in the root's left subtree and 1 in its right, so the deepest node holding both is the root 3." },
      { root: T, p: 5, q: 4, note: "4 lies below 5, and a node counts as its own descendant, so the answer is 5." },
      { root: [1, 2], p: 1, q: 2, note: "The root is an ancestor of 2 and of itself." },
    ];
    return {
      slug: "lowest-common-ancestor-of-a-binary-tree",
      title: "Lowest Common Ancestor of a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Meta", "Microsoft", "Google"],
      signature: { funcName: "lowestCommonAncestor", params: [{ name: "root", type: "TreeNode" as const }, { name: "p", type: "int" as const }, { name: "q", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree (not necessarily a search tree) whose node values are all **distinct**, and the values `p` and `q` of two different nodes in it.\n\nThe **lowest common ancestor** of two nodes is the deepest node that has both of them in its subtree — where a node counts as being in its own subtree, so a node can be the ancestor of itself. Return the value of the lowest common ancestor of the nodes holding `p` and `q`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, p = ${e.p}, q = ${e.q}`, out: String(ref(treeFrom(e.root), e.p, e.q)), note: e.note })),
        ["2 <= number of nodes <= 10^5", "-10^9 <= Node.val <= 10^9", "all node values are distinct", "p != q", "p and q both exist in the tree"]),
      hints: [
        "Without an ordering you have to search both subtrees, so think recursively: what should a subtree report back to its parent?",
        "Let a call return the node holding `p` or `q` if it finds one (stopping there), and null if its subtree holds neither.",
        "If both the left and the right call come back non-null, the current node is where the two paths meet; otherwise pass up whichever side is non-null.",
      ],
      editorial: explain({
        idea: "One post-order search answers \"which of p and q are below here?\" for every subtree; the first node that finds one target on each side — or is a target with the other below it — is the lowest common ancestor.",
        steps: [
          "Define `find(node)`: if the node is null, or holds `p` or `q`, return the node.",
          "Otherwise call `find` on the left and right children.",
          "If both calls return a node, return the current node: `p` and `q` are on different sides.",
          "Otherwise return the non-null result (or null if both are null).",
          "The answer is the value of `find(root)`.",
        ],
        why: "`find` returns null exactly when its subtree holds neither target, and otherwise a node inside it. A call stops at the first target it meets; if the other target is below it, that target is never reached, and that is correct because the stopping node is then the ancestor. If the targets are in different child subtrees, both children report back and the current node is the deepest node containing both. Because the targets exist and are distinct, these cases cover everything, and the result bubbles up unchanged to the root.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Stopping at a target is not a shortcut that loses the answer: if the other target is below it, this node is the ancestor.",
          "This relies on both values being present; with a missing value the function would wrongly return the one it found.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.p}\n${e.q}`, expectedOutput: String(ref(treeFrom(e.root), e.p, e.q)) })),
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 30, 40]));
        const [lo, hi] = pick(rng, [[0, 60], [-1000, 1000], [-1000000000, 1000000000]] as Array<[number, number]>);
        const root = distinctVals(rng, shapeTree(rng, n, 0, 0), lo, hi);
        const vals = shuffle(rng, nodesOf(root).map((x) => x.val));
        return { input: `${fmtTree(root)}\n${vals[0]}\n${vals[1]}`, expectedOutput: String(ref(root, vals[0], vals[1])) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def lowestCommonAncestor(root: Optional[TreeNode], p: int, q: int) -> int:
              def find(node):
                  if node is None or node.val == p or node.val == q:
                      return node
                  left = find(node.left)
                  right = find(node.right)
                  if left and right:
                      return node
                  return left if left else right

              return find(root).val
        `,
        javascript: code`
          var lowestCommonAncestor = function(root, p, q) {
              return lcaFind(root, p, q).val;
          };

          var lcaFind = function(node, p, q) {
              if (node === null || node.val === p || node.val === q) return node;
              var left = lcaFind(node.left, p, q), right = lcaFind(node.right, p, q);
              if (left !== null && right !== null) return node;
              return left !== null ? left : right;
          };
        `,
        typescript: code`
          function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
              return (lcaFind(root, p, q) as TreeNode).val;
          }

          function lcaFind(node: TreeNode | null, p: number, q: number): TreeNode | null {
              if (node === null || node.val === p || node.val === q) return node;
              var left = lcaFind(node.left, p, q), right = lcaFind(node.right, p, q);
              if (left !== null && right !== null) return node;
              return left !== null ? left : right;
          }
        `,
        java: code`
          public static int lowestCommonAncestor(TreeNode root, int p, int q) {
              return lcaFind(root, p, q).val;
          }

          static TreeNode lcaFind(TreeNode node, int p, int q) {
              if (node == null || node.val == p || node.val == q) return node;
              TreeNode left = lcaFind(node.left, p, q), right = lcaFind(node.right, p, q);
              if (left != null && right != null) return node;
              return left != null ? left : right;
          }
        `,
        cpp: code`
          TreeNode* lcaFind(TreeNode* node, int p, int q);

          int lowestCommonAncestor(TreeNode* root, int p, int q) {
              return lcaFind(root, p, q)->val;
          }

          TreeNode* lcaFind(TreeNode* node, int p, int q) {
              if (!node || node->val == p || node->val == q) return node;
              TreeNode* left = lcaFind(node->left, p, q);
              TreeNode* right = lcaFind(node->right, p, q);
              if (left && right) return node;
              return left ? left : right;
          }
        `,
        c: code`
          static struct TreeNode* lcaFind(struct TreeNode* node, int p, int q);

          int lowestCommonAncestor(struct TreeNode* root, int p, int q) {
              return lcaFind(root, p, q)->val;
          }

          static struct TreeNode* lcaFind(struct TreeNode* node, int p, int q) {
              if (node == NULL || node->val == p || node->val == q) return node;
              struct TreeNode* left = lcaFind(node->left, p, q);
              struct TreeNode* right = lcaFind(node->right, p, q);
              if (left != NULL && right != NULL) return node;
              return left != NULL ? left : right;
          }
        `,
        csharp: code`
          public static int LowestCommonAncestor(TreeNode root, int p, int q)
          {
              return LcaFind(root, p, q).val;
          }

          static TreeNode LcaFind(TreeNode node, int p, int q)
          {
              if (node == null || node.val == p || node.val == q) return node;
              var left = LcaFind(node.left, p, q);
              var right = LcaFind(node.right, p, q);
              if (left != null && right != null) return node;
              return left ?? right;
          }
        `,
        go: code`
          func lowestCommonAncestor(root *TreeNode, p int, q int) int {
              return lcaFind(root, p, q).Val
          }

          func lcaFind(node *TreeNode, p int, q int) *TreeNode {
              if node == nil || node.Val == p || node.Val == q {
                  return node
              }
              left := lcaFind(node.Left, p, q)
              right := lcaFind(node.Right, p, q)
              if left != nil && right != nil {
                  return node
              }
              if left != nil {
                  return left
              }
              return right
          }
        `,
        kotlin: kt(`
          fun lowestCommonAncestor(root: TreeNode?, p: Int, q: Int): Int {
              return lcaFind(root, p, q)!!.\`val\`
          }

          fun lcaFind(node: TreeNode?, p: Int, q: Int): TreeNode? {
              if (node == null || node.\`val\` == p || node.\`val\` == q) return node
              val left = lcaFind(node.left, p, q)
              val right = lcaFind(node.right, p, q)
              if (left != null && right != null) return node
              return left ?: right
          }
        `),
        swift: code`
          func lowestCommonAncestor(_ root: TreeNode?, _ p: Int, _ q: Int) -> Int {
              return lcaFind(root, p, q)!.val
          }

          func lcaFind(_ node: TreeNode?, _ p: Int, _ q: Int) -> TreeNode? {
              guard let n = node else { return nil }
              if n.val == p || n.val == q { return n }
              let left = lcaFind(n.left, p, q)
              let right = lcaFind(n.right, p, q)
              if left != nil && right != nil { return n }
              return left ?? right
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn lowestCommonAncestor(root: Option<Rc<RefCell<TreeNode>>>, p: i32, q: i32) -> i32 {
              let found = lca_find(&root, p, q).unwrap();
              let v = found.borrow().val;
              v
          }

          fn lca_find(node: &Option<Rc<RefCell<TreeNode>>>, p: i32, q: i32) -> Option<Rc<RefCell<TreeNode>>> {
              match node {
                  None => None,
                  Some(rc) => {
                      let n = rc.borrow();
                      if n.val == p || n.val == q {
                          return Some(rc.clone());
                      }
                      let left = lca_find(&n.left, p, q);
                      let right = lca_find(&n.right, p, q);
                      if left.is_some() && right.is_some() {
                          return Some(rc.clone());
                      }
                      if left.is_some() { left } else { right }
                  }
              }
          }
        `,
        php: code`
          function lowestCommonAncestor($root, $p, $q) {
              return lcaFind($root, $p, $q)->val;
          }

          function lcaFind($node, $p, $q) {
              if ($node === null || $node->val == $p || $node->val == $q) return $node;
              $left = lcaFind($node->left, $p, $q);
              $right = lcaFind($node->right, $p, $q);
              if ($left !== null && $right !== null) return $node;
              return $left !== null ? $left : $right;
          }
        `,
        ruby: code`
          def lowestCommonAncestor(root, p, q)
            lca_find(root, p, q).val
          end

          def lca_find(node, p, q)
            return node if node.nil? || node.val == p || node.val == q
            left = lca_find(node.left, p, q)
            right = lca_find(node.right, p, q)
            return node if left && right
            left || right
          end
        `,
      },
    };
  })(),

  // ── House Robber III (LC 337) ───────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const best = (n: TNode | null): [number, number] => {
        if (!n) return [0, 0];
        const [lt, ls] = best(n.left), [rt, rs] = best(n.right);
        return [n.val + ls + rs, Math.max(lt, ls) + Math.max(rt, rs)];
      };
      return Math.max(...best(root));
    };
    const EX = [
      { root: [3, 2, 3, null, 3, null, 1], note: "Rob the root 3 and the two grandchildren 3 and 1: 3 + 3 + 1 = 7." },
      { root: [3, 4, 5, 1, 3, null, 1], note: "Rob the root's two children 4 and 5: 4 + 5 = 9." },
      { root: [4, 1, null, 2, null, 3], note: "A chain 4 - 1 - 2 - 3: robbing 4 and 3 gives 7; 4 and 2 would give only 6." },
    ];
    return {
      slug: "house-robber-iii",
      title: "House Robber III",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "rob", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "The houses of a neighbourhood are arranged as a binary tree: every house except the `root` has exactly one parent house, and each node's value is the money inside that house.\n\nA thief may rob any set of houses, except that two houses joined directly by an edge (a parent and its child) can never both be robbed — the alarm would go off. Return the most money the thief can take.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "0 <= Node.val <= 10^4"]),
      hints: [
        "Whether a house can be robbed depends only on whether its parent was robbed.",
        "For each subtree, compute two answers: the best total if its root is robbed, and the best total if its root is left alone.",
        "Robbing a node means skipping both children; skipping it leaves each child free to be robbed or not — take the better of its two answers. Compute both answers bottom-up in one post-order pass.",
      ],
      editorial: explain({
        idea: "Dynamic programming on the tree: for every node keep the best loot of its subtree with the node robbed and with it skipped, both computed from the children's pairs.",
        steps: [
          "Define `best(node)` returning a pair `(take, skip)`; for a null node it is `(0, 0)`.",
          "Compute the pairs `(lt, ls)` and `(rt, rs)` of the two children.",
          "`take = node.val + ls + rs` — robbing the node forces both children to be skipped.",
          "`skip = max(lt, ls) + max(rt, rs)` — each child may go either way.",
          "Return `max(take, skip)` for the root.",
        ],
        why: "The only constraint links a node to its children, so once a node's choice is fixed its two subtrees are independent problems, each needing only its own root's choice. The pair therefore captures everything a parent needs, and by induction each pair is optimal for its subtree.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Robbing alternate levels is not optimal: in the chain 4 - 1 - 2 - 3 the best picks 4 and 3, two levels apart.",
          "A plain recursion that recomputes grandchildren's answers for each choice is exponential; return both values from one call.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 4, 12, 25, 40]);
        const root = shapeTree(rng, n, 0, pick(rng, [5, 100, 10000]));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def rob(root: Optional[TreeNode]) -> int:
              def best(node):
                  if node is None:
                      return 0, 0
                  lt, ls = best(node.left)
                  rt, rs = best(node.right)
                  return node.val + ls + rs, max(lt, ls) + max(rt, rs)

              return max(best(root))
        `,
        javascript: code`
          var rob = function(root) {
              var r = robPair(root);
              return Math.max(r[0], r[1]);
          };

          var robPair = function(node) {
              if (node === null) return [0, 0];
              var l = robPair(node.left), r = robPair(node.right);
              return [node.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])];
          };
        `,
        typescript: code`
          function rob(root: TreeNode | null): number {
              var r = robPair(root);
              return Math.max(r[0], r[1]);
          }

          function robPair(node: TreeNode | null): number[] {
              if (node === null) return [0, 0];
              var l = robPair(node.left), r = robPair(node.right);
              return [node.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])];
          }
        `,
        java: code`
          public static int rob(TreeNode root) {
              int[] r = robPair(root);
              return Math.max(r[0], r[1]);
          }

          static int[] robPair(TreeNode node) {
              if (node == null) return new int[] {0, 0};
              int[] l = robPair(node.left), r = robPair(node.right);
              return new int[] {node.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])};
          }
        `,
        cpp: code`
          pair<int, int> robPair(TreeNode* node);

          int rob(TreeNode* root) {
              pair<int, int> r = robPair(root);
              return max(r.first, r.second);
          }

          pair<int, int> robPair(TreeNode* node) {
              if (!node) return {0, 0};
              pair<int, int> l = robPair(node->left), r = robPair(node->right);
              return {node->val + l.second + r.second, max(l.first, l.second) + max(r.first, r.second)};
          }
        `,
        c: code`
          static void robPair(struct TreeNode* node, int* take, int* skip);

          int rob(struct TreeNode* root) {
              int take, skip;
              robPair(root, &take, &skip);
              return take > skip ? take : skip;
          }

          static void robPair(struct TreeNode* node, int* take, int* skip) {
              if (node == NULL) { *take = 0; *skip = 0; return; }
              int lt, ls, rt, rs;
              robPair(node->left, &lt, &ls);
              robPair(node->right, &rt, &rs);
              *take = node->val + ls + rs;
              *skip = (lt > ls ? lt : ls) + (rt > rs ? rt : rs);
          }
        `,
        csharp: code`
          public static int Rob(TreeNode root)
          {
              var r = RobPair(root);
              return Math.Max(r[0], r[1]);
          }

          static int[] RobPair(TreeNode node)
          {
              if (node == null) return new int[] { 0, 0 };
              var l = RobPair(node.left);
              var r = RobPair(node.right);
              return new int[] { node.val + l[1] + r[1], Math.Max(l[0], l[1]) + Math.Max(r[0], r[1]) };
          }
        `,
        go: code`
          func rob(root *TreeNode) int {
              take, skip := robPair(root)
              if take > skip {
                  return take
              }
              return skip
          }

          func robPair(node *TreeNode) (int, int) {
              if node == nil {
                  return 0, 0
              }
              lt, ls := robPair(node.Left)
              rt, rs := robPair(node.Right)
              return node.Val + ls + rs, maxOf(lt, ls) + maxOf(rt, rs)
          }

          func maxOf(a, b int) int {
              if a > b {
                  return a
              }
              return b
          }
        `,
        kotlin: kt(`
          fun rob(root: TreeNode?): Int {
              val r = robPair(root)
              return maxOf(r[0], r[1])
          }

          fun robPair(node: TreeNode?): IntArray {
              if (node == null) return intArrayOf(0, 0)
              val l = robPair(node.left)
              val r = robPair(node.right)
              return intArrayOf(node.\`val\` + l[1] + r[1], maxOf(l[0], l[1]) + maxOf(r[0], r[1]))
          }
        `),
        swift: code`
          func rob(_ root: TreeNode?) -> Int {
              let r = robPair(root)
              return max(r.0, r.1)
          }

          func robPair(_ node: TreeNode?) -> (Int, Int) {
              guard let n = node else { return (0, 0) }
              let l = robPair(n.left)
              let r = robPair(n.right)
              return (n.val + l.1 + r.1, max(l.0, l.1) + max(r.0, r.1))
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn rob(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let (take, skip) = rob_pair(&root);
              take.max(skip)
          }

          fn rob_pair(node: &Option<Rc<RefCell<TreeNode>>>) -> (i32, i32) {
              match node {
                  None => (0, 0),
                  Some(rc) => {
                      let n = rc.borrow();
                      let (lt, ls) = rob_pair(&n.left);
                      let (rt, rs) = rob_pair(&n.right);
                      (n.val + ls + rs, lt.max(ls) + rt.max(rs))
                  }
              }
          }
        `,
        php: code`
          function rob($root) {
              $r = robPair($root);
              return max($r[0], $r[1]);
          }

          function robPair($node) {
              if ($node === null) return [0, 0];
              $l = robPair($node->left);
              $r = robPair($node->right);
              return [$node->val + $l[1] + $r[1], max($l[0], $l[1]) + max($r[0], $r[1])];
          }
        `,
        ruby: code`
          def rob(root)
            rob_pair(root).max
          end

          def rob_pair(node)
            return [0, 0] if node.nil?
            lt, ls = rob_pair(node.left)
            rt, rs = rob_pair(node.right)
            [node.val + ls + rs, [lt, ls].max + [rt, rs].max]
          end
        `,
      },
    };
  })(),

  // ── Path Sum III (LC 437) ───────────────────────────────────────
  (() => {
    const ref = (root: TNode | null, targetSum: number) => {
      let count = 0;
      const path: number[] = [];
      const walk = (n: TNode | null) => {
        if (!n) return;
        path.push(n.val);
        let s = 0;
        for (let i = path.length - 1; i >= 0; i--) { s += path[i]; if (s === targetSum) count++; }
        walk(n.left); walk(n.right);
        path.pop();
      };
      walk(root);
      return count;
    };
    const EX = [
      { root: [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], target: 8, note: "Three downward paths sum to 8: 5 → 3, 5 → 2 → 1, and -3 → 11." },
      { root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], target: 22, note: "5 → 4 → 11 → 2, 5 → 8 → 4 → 5, and 4 → 11 → 7 all sum to 22; a path need not start at the root." },
      { root: [], target: 0, note: "An empty tree has no paths." },
    ];
    return {
      slug: "path-sum-iii",
      title: "Path Sum III",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Prefix Sum", "Hash Table", "Amazon", "Meta", "Google"],
      signature: { funcName: "pathSum", params: [{ name: "root", type: "TreeNode" as const }, { name: "targetSum", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree and an integer `targetSum`, count the **downward paths** whose node values add up to `targetSum`.\n\nA downward path is a sequence of one or more nodes in which each node is the child of the one before it. It may start at any node and end at any node below it (or at the same node) — it does not have to start at the root or end at a leaf.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, targetSum = ${e.target}`, out: String(ref(treeFrom(e.root), e.target)), note: e.note })),
        ["0 <= number of nodes <= 1000", "-10^9 <= Node.val <= 10^9", "-1000 <= targetSum <= 1000"]),
      hints: [
        "A downward path ending at a node is a suffix of the root-to-node path. Its sum is the difference of two prefix sums of that root path.",
        "While walking down, keep how many times each prefix sum occurs on the current root path. At a node with running sum `S`, the paths ending here that sum to the target correspond to earlier prefixes equal to `S - targetSum`.",
        "Start the counts with prefix 0 seen once, add the node's sum before visiting its children and remove it afterwards — the counts must describe only the current root path. Running sums need 64 bits.",
      ],
      editorial: explain({
        idea: "The sum of a downward path from `u` to `v` is `prefix(v) - prefix(parent of u)`, prefix sums taken from the root. Counting, at every node, the earlier prefix sums on its root path that equal `prefix(node) - targetSum` counts every path exactly once.",
        steps: [
          "Keep a hash map `counts` of prefix sums on the current root path, starting with `{0: 1}` (the empty prefix).",
          "Visit a node with the running sum `S` of its parent: set `S += node.val`.",
          "Add `counts[S - targetSum]` to the answer — each such earlier prefix starts a path ending here with the target sum.",
          "Increment `counts[S]`, visit both children with `S`, then decrement `counts[S]` on the way back.",
        ],
        why: "Every downward path ends at exactly one node `v` and starts after exactly one earlier prefix on `v`'s root path, so it is counted once, at `v`, by that prefix. Decrementing on exit keeps `counts` equal to the prefixes of the current root path only, so prefixes from other branches never pair up.",
        time: "O(n) expected",
        space: "O(h) for the map entries in use and the recursion",
        pitfalls: [
          "Values reach ±10^9 and a path holds up to 1000 of them: running sums overflow 32 bits.",
          "Forgetting the initial `{0: 1}` misses the paths that start at the root.",
          "Forgetting to decrement lets a prefix from a finished branch pair with nodes in another branch.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}`, expectedOutput: String(ref(treeFrom(e.root), e.target)) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.03 ? 0 : sizeOf(rng, [1, 4, 12, 25, 40]);
        const mode = ri(rng, 0, 3);
        const root = shapeTree(rng, n, mode === 0 ? -2 : -10, mode === 0 ? 2 : 10);
        if (mode === 3) for (const x of nodesOf(root)) if (rng() < 0.4) x.val = pick(rng, [1000000000, -1000000000, 999999999, -999999999]);
        if (mode === 2) for (const x of nodesOf(root)) x.val = ri(rng, -1000000000, 1000000000);
        const target = mode === 2 && root && rng() < 0.5 && Math.abs(root.val) <= 1000 ? root.val : ri(rng, mode === 0 ? -4 : -15, mode === 0 ? 4 : 15);
        return { input: `${fmtTree(root)}\n${target}`, expectedOutput: String(ref(root, target)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def pathSum(root: Optional[TreeNode], targetSum: int) -> int:
              counts = {0: 1}

              def walk(node, running):
                  if node is None:
                      return 0
                  running += node.val
                  total = counts.get(running - targetSum, 0)
                  counts[running] = counts.get(running, 0) + 1
                  total += walk(node.left, running) + walk(node.right, running)
                  counts[running] -= 1
                  return total

              return walk(root, 0)
        `,
        javascript: code`
          var pathSum = function(root, targetSum) {
              var counts = new Map();
              counts.set(0, 1);
              function walk(node, running) {
                  if (node === null) return 0;
                  running += node.val;
                  var total = counts.get(running - targetSum) || 0;
                  counts.set(running, (counts.get(running) || 0) + 1);
                  total += walk(node.left, running) + walk(node.right, running);
                  counts.set(running, counts.get(running) - 1);
                  return total;
              }
              return walk(root, 0);
          };
        `,
        typescript: code`
          function pathSum(root: TreeNode | null, targetSum: number): number {
              var counts: { [sum: number]: number } = {};
              counts[0] = 1;
              function walk(node: TreeNode | null, running: number): number {
                  if (node === null) return 0;
                  running += node.val;
                  var total = counts[running - targetSum] || 0;
                  counts[running] = (counts[running] || 0) + 1;
                  total += walk(node.left, running) + walk(node.right, running);
                  counts[running]--;
                  return total;
              }
              return walk(root, 0);
          }
        `,
        java: code`
          public static int pathSum(TreeNode root, int targetSum) {
              Map<Long, Integer> counts = new HashMap<>();
              counts.put(0L, 1);
              return prefixWalk(root, 0L, targetSum, counts);
          }

          static int prefixWalk(TreeNode node, long running, int targetSum, Map<Long, Integer> counts) {
              if (node == null) return 0;
              running += node.val;
              int total = counts.getOrDefault(running - targetSum, 0);
              counts.merge(running, 1, Integer::sum);
              total += prefixWalk(node.left, running, targetSum, counts) + prefixWalk(node.right, running, targetSum, counts);
              counts.merge(running, -1, Integer::sum);
              return total;
          }
        `,
        cpp: code`
          int prefixWalk(TreeNode* node, long long running, int targetSum, unordered_map<long long, int>& counts);

          int pathSum(TreeNode* root, int targetSum) {
              unordered_map<long long, int> counts;
              counts[0] = 1;
              return prefixWalk(root, 0, targetSum, counts);
          }

          int prefixWalk(TreeNode* node, long long running, int targetSum, unordered_map<long long, int>& counts) {
              if (!node) return 0;
              running += node->val;
              auto it = counts.find(running - targetSum);
              int total = it == counts.end() ? 0 : it->second;
              counts[running]++;
              total += prefixWalk(node->left, running, targetSum, counts) + prefixWalk(node->right, running, targetSum, counts);
              counts[running]--;
              return total;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static int prefixWalk(struct TreeNode* node, long long* prefix, int depth, int targetSum);

          /* C has no hash map: compare the node's running sum with each earlier
             prefix on its root path instead, O(n * h) — fine for n <= 1000. */
          int pathSum(struct TreeNode* root, int targetSum) {
              int n = countNodes(root);
              long long* prefix = (long long*) malloc((size_t) (n + 2) * sizeof(long long));
              prefix[0] = 0;
              int total = prefixWalk(root, prefix, 1, targetSum);
              free(prefix);
              return total;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static int prefixWalk(struct TreeNode* node, long long* prefix, int depth, int targetSum) {
              if (node == NULL) return 0;
              long long running = prefix[depth - 1] + node->val;
              prefix[depth] = running;
              int total = 0;
              for (int i = 0; i < depth; i++) if (running - prefix[i] == targetSum) total++;
              return total + prefixWalk(node->left, prefix, depth + 1, targetSum) + prefixWalk(node->right, prefix, depth + 1, targetSum);
          }
        `,
        csharp: code`
          public static int PathSum(TreeNode root, int targetSum)
          {
              var counts = new Dictionary<long, int>();
              counts[0] = 1;
              return PrefixWalk(root, 0L, targetSum, counts);
          }

          static int PrefixWalk(TreeNode node, long running, int targetSum, Dictionary<long, int> counts)
          {
              if (node == null) return 0;
              running += node.val;
              int total;
              counts.TryGetValue(running - targetSum, out total);
              int seen;
              counts.TryGetValue(running, out seen);
              counts[running] = seen + 1;
              total += PrefixWalk(node.left, running, targetSum, counts) + PrefixWalk(node.right, running, targetSum, counts);
              counts[running]--;
              return total;
          }
        `,
        go: code`
          func pathSum(root *TreeNode, targetSum int) int {
              counts := map[int]int{0: 1}
              var walk func(node *TreeNode, running int) int
              walk = func(node *TreeNode, running int) int {
                  if node == nil {
                      return 0
                  }
                  running += node.Val
                  total := counts[running-targetSum]
                  counts[running]++
                  total += walk(node.Left, running) + walk(node.Right, running)
                  counts[running]--
                  return total
              }
              return walk(root, 0)
          }
        `,
        kotlin: kt(`
          fun pathSum(root: TreeNode?, targetSum: Int): Int {
              val counts = HashMap<Long, Int>()
              counts[0L] = 1
              return prefixWalk(root, 0L, targetSum, counts)
          }

          fun prefixWalk(node: TreeNode?, before: Long, targetSum: Int, counts: HashMap<Long, Int>): Int {
              if (node == null) return 0
              val running = before + node.\`val\`
              var total = counts.getOrDefault(running - targetSum, 0)
              counts[running] = counts.getOrDefault(running, 0) + 1
              total += prefixWalk(node.left, running, targetSum, counts) + prefixWalk(node.right, running, targetSum, counts)
              counts[running] = counts.getValue(running) - 1
              return total
          }
        `),
        swift: code`
          func pathSum(_ root: TreeNode?, _ targetSum: Int) -> Int {
              var counts: [Int: Int] = [0: 1]
              return prefixWalk(root, 0, targetSum, &counts)
          }

          func prefixWalk(_ node: TreeNode?, _ before: Int, _ targetSum: Int, _ counts: inout [Int: Int]) -> Int {
              guard let n = node else { return 0 }
              let running = before + n.val
              var total = counts[running - targetSum, default: 0]
              counts[running, default: 0] += 1
              total += prefixWalk(n.left, running, targetSum, &counts)
              total += prefixWalk(n.right, running, targetSum, &counts)
              counts[running, default: 0] -= 1
              return total
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn pathSum(root: Option<Rc<RefCell<TreeNode>>>, targetSum: i32) -> i32 {
              let mut counts: HashMap<i64, i32> = HashMap::new();
              counts.insert(0, 1);
              prefix_walk(&root, 0, targetSum as i64, &mut counts)
          }

          fn prefix_walk(node: &Option<Rc<RefCell<TreeNode>>>, before: i64, target: i64, counts: &mut HashMap<i64, i32>) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let running = before + n.val as i64;
                      let mut total = *counts.get(&(running - target)).unwrap_or(&0);
                      *counts.entry(running).or_insert(0) += 1;
                      total += prefix_walk(&n.left, running, target, counts);
                      total += prefix_walk(&n.right, running, target, counts);
                      *counts.get_mut(&running).unwrap() -= 1;
                      total
                  }
              }
          }
        `,
        php: code`
          function pathSum($root, $targetSum) {
              $counts = [0 => 1];
              return prefixWalk($root, 0, $targetSum, $counts);
          }

          function prefixWalk($node, $running, $targetSum, &$counts) {
              if ($node === null) return 0;
              $running += $node->val;
              $total = $counts[$running - $targetSum] ?? 0;
              $counts[$running] = ($counts[$running] ?? 0) + 1;
              $total += prefixWalk($node->left, $running, $targetSum, $counts);
              $total += prefixWalk($node->right, $running, $targetSum, $counts);
              $counts[$running]--;
              return $total;
          }
        `,
        ruby: code`
          def pathSum(root, targetSum)
            counts = Hash.new(0)
            counts[0] = 1
            prefix_walk(root, 0, targetSum, counts)
          end

          def prefix_walk(node, running, target_sum, counts)
            return 0 if node.nil?
            running += node.val
            total = counts[running - target_sum]
            counts[running] += 1
            total += prefix_walk(node.left, running, target_sum, counts)
            total += prefix_walk(node.right, running, target_sum, counts)
            counts[running] -= 1
            total
          end
        `,
      },
    };
  })(),

];

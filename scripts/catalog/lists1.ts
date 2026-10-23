/**
 * Binary trees and singly linked lists — wave 7, batch 33.
 * Real problems only: LeetCode numbered problems and GeeksforGeeks classics
 * that companies list. Worked examples are phrased for CodeKairo.
 *
 * These are the first catalogue problems on the structured drivers
 * (src/lib/driver-structures.ts): a `TreeNode` travels as LeetCode's level
 * order with nulls (`[3,9,20,null,null,15,7]`, trailing nulls dropped) and a
 * `ListNode` as its values head to tail (`[1,2,3]`). The node types belong to
 * the judge, so no solution here defines one. Where LeetCode declares a
 * problem in place, the function returns the head it changed; where a GFG
 * problem answers "the node", it answers its value.
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel. JS
 * solutions must be Node 12-safe: no ??, ?., at(), replaceAll, flat or
 * flatMap. The C harness has no math.h or limits.h. Each language's entry
 * function comes first; C declares its static helpers above it.
 *
 * Kotlin reads a node's value as n.`val`, and a code`…` block cannot hold a
 * backtick, so the Kotlin solutions use the `kt` tag below, which writes \`
 * in the source as a plain backtick.
 *
 * Every generator stays at 40 nodes or fewer, because the judge runs all 5,000
 * cases of a problem in one process and Python/Ruby/PHP pay ~30× V8. The
 * references are brute force wherever the size allows (every pair of nodes
 * for a path sum, every subtree checked from scratch for a BST, the tree
 * re-measured per removal query), so they share nothing with the authored
 * solutions but the statement.
 *
 * int32 rule: the multiplied linked lists answer modulo 1e9+7 as GFG does;
 * the binary-number list keeps at most 30 bits as LeetCode does; every tree
 * sum is bounded by its constraints (4·10^4 nodes × 4·10^4 for a BST sum).
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtTree, pick, randBST, randTree, ri, shuffle,
  type CatalogProblem, type Rng, type TNode,
} from "./types.js";

/** A Kotlin solution: like code`…`, with \` standing for the backtick `val` needs. */
const kt = (s: TemplateStringsArray) => code(s).replace(/\\`/g, "`");

/** Every node of a tree with its undirected neighbours (ids in BFS order). */
function graphOf(root: TNode | null): { nodes: TNode[]; adj: number[][] } {
  const nodes: TNode[] = [];
  const adj: number[][] = [];
  if (!root) return { nodes, adj };
  nodes.push(root);
  adj.push([]);
  for (let h = 0; h < nodes.length; h++) {
    for (const c of [nodes[h].left, nodes[h].right]) {
      if (!c) continue;
      const id = nodes.length;
      nodes.push(c);
      adj.push([h]);
      adj[h].push(id);
    }
  }
  return { nodes, adj };
}

/** Sum of the node values on the path from `from` to every other node. */
function pathSumsFrom(nodes: TNode[], adj: number[][], from: number): number[] {
  const sum = new Array<number>(nodes.length).fill(NaN);
  sum[from] = nodes[from].val;
  const stack = [from];
  while (stack.length) {
    const u = stack.pop()!;
    for (const v of adj[u]) if (Number.isNaN(sum[v])) { sum[v] = sum[u] + nodes[v].val; stack.push(v); }
  }
  return sum;
}

/** A tree size for a generator: mostly small, sometimes up to 40. */
const treeSize = (rng: Rng) => ri(rng, 1, pick(rng, [1, 2, 3, 6, 12, 25, 40]));

/** A random tree with the distinct values 1..n (in random positions). */
function distinctTree(rng: Rng, n: number): TNode | null {
  const root = randTree(rng, n, 0, 0);
  const vals = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
  graphOf(root).nodes.forEach((nd, i) => { nd.val = vals[i]; });
  return root;
}


/** A list length for a generator: mostly short, sometimes up to 40. */
const listLen = (rng: Rng, min = 0) => ri(rng, min, pick(rng, [Math.max(min, 1), 2, 4, 10, 25, 40]));

export const LISTS1_PROBLEMS: CatalogProblem[] = [

  // ── Binary Tree Maximum Path Sum (LC 124) ───────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const { nodes, adj } = graphOf(root);
      let best = -Infinity;
      for (let i = 0; i < nodes.length; i++) for (const s of pathSumsFrom(nodes, adj, i)) best = Math.max(best, s);
      return best;
    };
    return {
      slug: "binary-tree-maximum-path-sum",
      title: "Binary Tree Maximum Path Sum",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Recursion", "Amazon", "Google", "Meta", "Microsoft"],
      signature: { funcName: "maxPathSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "A **path** in a binary tree is a sequence of nodes where every two consecutive nodes are joined by an edge, and no node appears more than once. A path holds at least one node and does not have to pass through the root.\n\nThe **path sum** is the total of the values of the nodes on the path.\n\nGiven the `root` of a non-empty binary tree, return the **largest** path sum of any path in it.",
        [
          { in: "root = [1,2,3]", out: "6", note: "The path 2 → 1 → 3 adds up to 2 + 1 + 3 = 6." },
          { in: "root = [-10,9,20,null,null,15,7]", out: "42", note: "The path 15 → 20 → 7 gives 42; dragging in -10 and 9 would only lower it." },
          { in: "root = [-3]", out: "-3", note: "A path needs at least one node, so the only path is the root itself." },
        ],
        ["The number of nodes is in the range [1, 3 * 10^4]", "-1000 <= Node.val <= 1000"]),
      hints: [
        "Every path has one highest node — the place where it stops going up and starts going down. Try each node as that peak.",
        "For a peak, the best path is its value plus the best downward chain into the left subtree and into the right, each only if it is positive.",
        "One post-order pass can return, for every node, its best downward chain (value plus the better positive child chain) while updating a global answer with value + left + right.",
      ],
      editorial: explain({
        idea: "Hang every path from its highest node. At that peak the path is the node itself plus, optionally, one chain going down-left and one going down-right — so all we need per node is the best chain that starts there and goes downward, which its children can report.",
        steps: [
          "Define `gain(node)` = the largest sum of a downward chain that starts at `node` (0 for a missing child).",
          "Compute it post-order: `left = max(gain(node.left), 0)`, `right = max(gain(node.right), 0)`; a negative chain is better left out.",
          "Before returning, treat `node` as a peak: update the answer with `node.val + left + right`.",
          "Return `node.val + max(left, right)` — a chain that continues upward can take only one side.",
          "Start the answer at the root's value and return it after the pass.",
        ],
        why: "Every path has exactly one node closest to the root, and the path splits there into at most two downward chains into different subtrees. The best path with that peak takes the best non-negative chain on each side, which is exactly what the update computes; taking the maximum over all peaks covers every path.",
        time: "O(n)",
        space: "O(h) for the recursion, h the height of the tree",
        pitfalls: [
          "Starting the answer at 0 is wrong when every value is negative — the answer is then the largest single value.",
          "The value returned upward may use only one child; the value that updates the answer may use both.",
          "Clamp a child's chain at 0 rather than skipping the node: the node itself must always be on its own path.",
        ],
      }),
      examples: [
        { input: "[1,2,3]", expectedOutput: "6" },
        { input: "[-10,9,20,null,null,15,7]", expectedOutput: "42" },
        { input: "[-3]", expectedOutput: "-3" },
      ],
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[-10, 10], [-1000, 1000], [-1000, -1], [0, 1000], [-5, 3]]);
        const root = randTree(rng, treeSize(rng), lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxPathSum(root: Optional[TreeNode]) -> int:
              best = [root.val]

              def gain(node):
                  if node is None:
                      return 0
                  left = max(gain(node.left), 0)
                  right = max(gain(node.right), 0)
                  best[0] = max(best[0], node.val + left + right)
                  return node.val + max(left, right)

              gain(root)
              return best[0]
        `,
        javascript: code`
          var maxPathSum = function(root) {
              var best = root.val;
              var gain = function(node) {
                  if (node === null) return 0;
                  var left = Math.max(gain(node.left), 0);
                  var right = Math.max(gain(node.right), 0);
                  best = Math.max(best, node.val + left + right);
                  return node.val + Math.max(left, right);
              };
              gain(root);
              return best;
          };
        `,
        typescript: code`
          function maxPathSum(root: TreeNode | null): number {
              var best = root.val;
              function gain(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var left = Math.max(gain(node.left), 0);
                  var right = Math.max(gain(node.right), 0);
                  best = Math.max(best, node.val + left + right);
                  return node.val + Math.max(left, right);
              }
              gain(root);
              return best;
          }
        `,
        java: code`
          public static int maxPathSum(TreeNode root) {
              int[] best = { root.val };
              pathGain(root, best);
              return best[0];
          }

          static int pathGain(TreeNode node, int[] best) {
              if (node == null) return 0;
              int left = Math.max(pathGain(node.left, best), 0);
              int right = Math.max(pathGain(node.right, best), 0);
              best[0] = Math.max(best[0], node.val + left + right);
              return node.val + Math.max(left, right);
          }
        `,
        cpp: code`
          int maxPathSum(TreeNode* root) {
              int best = root->val;
              function<int(TreeNode*)> gain = [&](TreeNode* node) -> int {
                  if (!node) return 0;
                  int left = max(gain(node->left), 0);
                  int right = max(gain(node->right), 0);
                  best = max(best, node->val + left + right);
                  return node->val + max(left, right);
              };
              gain(root);
              return best;
          }
        `,
        c: code`
          static int pathGain(struct TreeNode* node, int* best);

          int maxPathSum(struct TreeNode* root) {
              int best = root->val;
              pathGain(root, &best);
              return best;
          }

          static int pathGain(struct TreeNode* node, int* best) {
              if (node == NULL) return 0;
              int left = pathGain(node->left, best);
              int right = pathGain(node->right, best);
              if (left < 0) left = 0;
              if (right < 0) right = 0;
              if (node->val + left + right > *best) *best = node->val + left + right;
              return node->val + (left > right ? left : right);
          }
        `,
        csharp: code`
          public static int MaxPathSum(TreeNode root)
          {
              int best = root.val;
              PathGain(root, ref best);
              return best;
          }

          static int PathGain(TreeNode node, ref int best)
          {
              if (node == null) return 0;
              int left = Math.Max(PathGain(node.left, ref best), 0);
              int right = Math.Max(PathGain(node.right, ref best), 0);
              best = Math.Max(best, node.val + left + right);
              return node.val + Math.Max(left, right);
          }
        `,
        go: code`
          func maxPathSum(root *TreeNode) int {
              best := root.Val
              var gain func(node *TreeNode) int
              gain = func(node *TreeNode) int {
                  if node == nil {
                      return 0
                  }
                  left, right := gain(node.Left), gain(node.Right)
                  if left < 0 {
                      left = 0
                  }
                  if right < 0 {
                      right = 0
                  }
                  if node.Val+left+right > best {
                      best = node.Val + left + right
                  }
                  if left > right {
                      return node.Val + left
                  }
                  return node.Val + right
              }
              gain(root)
              return best
          }
        `,
        kotlin: kt`
          fun maxPathSum(root: TreeNode?): Int {
              var best = root!!.\`val\`
              fun gain(node: TreeNode?): Int {
                  if (node == null) return 0
                  val left = maxOf(gain(node.left), 0)
                  val right = maxOf(gain(node.right), 0)
                  best = maxOf(best, node.\`val\` + left + right)
                  return node.\`val\` + maxOf(left, right)
              }
              gain(root)
              return best
          }
        `,
        swift: code`
          func maxPathSum(_ root: TreeNode?) -> Int {
              var best = root!.val
              func gain(_ node: TreeNode?) -> Int {
                  guard let n = node else { return 0 }
                  let left = max(gain(n.left), 0)
                  let right = max(gain(n.right), 0)
                  best = max(best, n.val + left + right)
                  return n.val + max(left, right)
              }
              _ = gain(root)
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxPathSum(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              fn gain(node: &Option<Rc<RefCell<TreeNode>>>, best: &mut i32) -> i32 {
                  match node {
                      None => 0,
                      Some(n) => {
                          let n = n.borrow();
                          let left = gain(&n.left, best).max(0);
                          let right = gain(&n.right, best).max(0);
                          *best = (*best).max(n.val + left + right);
                          n.val + left.max(right)
                      }
                  }
              }
              let mut best = std::i32::MIN;
              gain(&root, &mut best);
              best
          }
        `,
        php: code`
          function maxPathSum($root) {
              $best = $root->val;
              $gain = function ($node) use (&$gain, &$best) {
                  if ($node === null) return 0;
                  $left = max($gain($node->left), 0);
                  $right = max($gain($node->right), 0);
                  $best = max($best, $node->val + $left + $right);
                  return $node->val + max($left, $right);
              };
              $gain($root);
              return $best;
          }
        `,
        ruby: code`
          def maxPathSum(root)
            best = root.val
            gain = lambda do |node|
              return 0 if node.nil?
              left = [gain.call(node.left), 0].max
              right = [gain.call(node.right), 0].max
              best = [best, node.val + left + right].max
              node.val + [left, right].max
            end
            gain.call(root)
            best
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Cameras (LC 968) ────────────────────────────────
  (() => {
    // A different formulation from the greedy the solutions use: an exact
    // three-state DP — camera here, covered by a child, or not yet covered.
    const INF = 1e9;
    const dp = (n: TNode | null): [number, number, number] => {
      if (!n) return [INF, 0, INF];
      const kids = [dp(n.left), dp(n.right)];
      const cam = 1 + kids.reduce((s, k) => s + Math.min(k[0], k[1], k[2]), 0);
      const open = kids.reduce((s, k) => s + k[1], 0);
      let covered = INF;
      for (let i = 0; i < 2; i++) {
        let s = kids[i][0];
        if (s >= INF) continue;
        const o = kids[1 - i];
        s += Math.min(o[0], o[1]);
        covered = Math.min(covered, s);
      }
      return [cam, covered, open];
    };
    const ref = (root: TNode | null) => { const r = dp(root); return Math.min(r[0], r[1]); };
    return {
      slug: "binary-tree-cameras",
      title: "Binary Tree Cameras",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Greedy", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "minCameraCover", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree. A camera can be installed on any node, and a camera watches the node it sits on, that node's parent, and that node's immediate children.\n\nReturn the **minimum** number of cameras needed so that every node of the tree is watched.\n\nEvery node's value is `0` — only the shape of the tree matters.",
        [
          { in: "root = [0,0,null,0,0]", out: "1", note: "One camera on the root's left child watches it, the root and both of its children." },
          { in: "root = [0,0,null,0,null,0,null,null,0]", out: "2", note: "The tree is a chain of five nodes; cameras on the second and fourth nodes from the top watch all five." },
          { in: "root = [0]", out: "1", note: "A lone node must hold the camera itself." },
        ],
        ["The number of nodes is in the range [1, 1000]", "Node.val == 0"]),
      hints: [
        "A leaf should never hold a camera: moving it to the leaf's parent watches everything it did and more.",
        "Work bottom-up. Each node can report one of three states to its parent: it needs watching, it holds a camera, or it is watched without a camera.",
        "Put a camera on a node exactly when some child needs watching. A missing child counts as watched. At the end, the root may still need a camera of its own.",
      ],
      editorial: explain({
        idea: "Decide cameras from the leaves upward. A leaf's parent is always a better camera spot than the leaf, and in general a node only needs a camera when one of its children would otherwise go unwatched — so a post-order pass with three states places cameras greedily and optimally.",
        steps: [
          "Let `visit(node)` return 0 = needs watching, 1 = holds a camera, 2 = watched without a camera; a missing child returns 2.",
          "Visit both children first.",
          "If either child returns 0, install a camera here (count it) and return 1.",
          "Otherwise, if either child returns 1, this node is watched: return 2.",
          "Otherwise both children are watched without cameras, so this node is not: return 0 and let the parent handle it.",
          "After visiting the root, add one more camera if it returned 0.",
        ],
        why: "Consider the deepest unwatched node. Any camera that watches it sits on it, its parent or a child; its children are already watched (they are deeper), so a camera on the parent watches a superset of what the other choices would newly watch. The greedy makes exactly that choice each time, so an exchange argument turns any optimal placement into the greedy one without adding cameras.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "A missing child must count as watched, or every leaf would force a camera on itself.",
          "The root has no parent to rescue it — check its state after the pass.",
          "Check 'a child needs watching' before 'a child holds a camera': a node with one of each still needs its own camera.",
        ],
      }),
      examples: [
        { input: "[0,0,null,0,0]", expectedOutput: "1" },
        { input: "[0,0,null,0,null,0,null,null,0]", expectedOutput: "2" },
        { input: "[0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const root = randTree(rng, treeSize(rng), 0, 0);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def minCameraCover(root: Optional[TreeNode]) -> int:
              cameras = [0]

              # 0 = needs watching, 1 = holds a camera, 2 = watched without one
              def visit(node):
                  if node is None:
                      return 2
                  left, right = visit(node.left), visit(node.right)
                  if left == 0 or right == 0:
                      cameras[0] += 1
                      return 1
                  if left == 1 or right == 1:
                      return 2
                  return 0

              if visit(root) == 0:
                  cameras[0] += 1
              return cameras[0]
        `,
        javascript: code`
          var minCameraCover = function(root) {
              var cameras = 0;
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              var visit = function(node) {
                  if (node === null) return 2;
                  var left = visit(node.left), right = visit(node.right);
                  if (left === 0 || right === 0) { cameras++; return 1; }
                  if (left === 1 || right === 1) return 2;
                  return 0;
              };
              if (visit(root) === 0) cameras++;
              return cameras;
          };
        `,
        typescript: code`
          function minCameraCover(root: TreeNode | null): number {
              var cameras = 0;
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              function visit(node: TreeNode | null): number {
                  if (node === null) return 2;
                  var left = visit(node.left), right = visit(node.right);
                  if (left === 0 || right === 0) { cameras++; return 1; }
                  if (left === 1 || right === 1) return 2;
                  return 0;
              }
              if (visit(root) === 0) cameras++;
              return cameras;
          }
        `,
        java: code`
          public static int minCameraCover(TreeNode root) {
              int[] cameras = { 0 };
              if (cameraVisit(root, cameras) == 0) cameras[0]++;
              return cameras[0];
          }

          // 0 = needs watching, 1 = holds a camera, 2 = watched without one
          static int cameraVisit(TreeNode node, int[] cameras) {
              if (node == null) return 2;
              int left = cameraVisit(node.left, cameras), right = cameraVisit(node.right, cameras);
              if (left == 0 || right == 0) { cameras[0]++; return 1; }
              if (left == 1 || right == 1) return 2;
              return 0;
          }
        `,
        cpp: code`
          int minCameraCover(TreeNode* root) {
              int cameras = 0;
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              function<int(TreeNode*)> visit = [&](TreeNode* node) -> int {
                  if (!node) return 2;
                  int left = visit(node->left), right = visit(node->right);
                  if (left == 0 || right == 0) { cameras++; return 1; }
                  if (left == 1 || right == 1) return 2;
                  return 0;
              };
              if (visit(root) == 0) cameras++;
              return cameras;
          }
        `,
        c: code`
          static int cameraVisit(struct TreeNode* node, int* cameras);

          int minCameraCover(struct TreeNode* root) {
              int cameras = 0;
              if (cameraVisit(root, &cameras) == 0) cameras++;
              return cameras;
          }

          /* 0 = needs watching, 1 = holds a camera, 2 = watched without one */
          static int cameraVisit(struct TreeNode* node, int* cameras) {
              if (node == NULL) return 2;
              int left = cameraVisit(node->left, cameras);
              int right = cameraVisit(node->right, cameras);
              if (left == 0 || right == 0) { (*cameras)++; return 1; }
              if (left == 1 || right == 1) return 2;
              return 0;
          }
        `,
        csharp: code`
          public static int MinCameraCover(TreeNode root)
          {
              int cameras = 0;
              if (CameraVisit(root, ref cameras) == 0) cameras++;
              return cameras;
          }

          // 0 = needs watching, 1 = holds a camera, 2 = watched without one
          static int CameraVisit(TreeNode node, ref int cameras)
          {
              if (node == null) return 2;
              int left = CameraVisit(node.left, ref cameras);
              int right = CameraVisit(node.right, ref cameras);
              if (left == 0 || right == 0) { cameras++; return 1; }
              if (left == 1 || right == 1) return 2;
              return 0;
          }
        `,
        go: code`
          func minCameraCover(root *TreeNode) int {
              cameras := 0
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              var visit func(node *TreeNode) int
              visit = func(node *TreeNode) int {
                  if node == nil {
                      return 2
                  }
                  left, right := visit(node.Left), visit(node.Right)
                  if left == 0 || right == 0 {
                      cameras++
                      return 1
                  }
                  if left == 1 || right == 1 {
                      return 2
                  }
                  return 0
              }
              if visit(root) == 0 {
                  cameras++
              }
              return cameras
          }
        `,
        kotlin: kt`
          fun minCameraCover(root: TreeNode?): Int {
              var cameras = 0
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              fun visit(node: TreeNode?): Int {
                  if (node == null) return 2
                  val left = visit(node.left)
                  val right = visit(node.right)
                  if (left == 0 || right == 0) { cameras++; return 1 }
                  if (left == 1 || right == 1) return 2
                  return 0
              }
              if (visit(root) == 0) cameras++
              return cameras
          }
        `,
        swift: code`
          func minCameraCover(_ root: TreeNode?) -> Int {
              var cameras = 0
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              func visit(_ node: TreeNode?) -> Int {
                  guard let n = node else { return 2 }
                  let left = visit(n.left), right = visit(n.right)
                  if left == 0 || right == 0 { cameras += 1; return 1 }
                  if left == 1 || right == 1 { return 2 }
                  return 0
              }
              if visit(root) == 0 { cameras += 1 }
              return cameras
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn minCameraCover(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              fn visit(node: &Option<Rc<RefCell<TreeNode>>>, cameras: &mut i32) -> i32 {
                  match node {
                      None => 2,
                      Some(n) => {
                          let n = n.borrow();
                          let left = visit(&n.left, cameras);
                          let right = visit(&n.right, cameras);
                          if left == 0 || right == 0 {
                              *cameras += 1;
                              1
                          } else if left == 1 || right == 1 {
                              2
                          } else {
                              0
                          }
                      }
                  }
              }
              let mut cameras = 0;
              if visit(&root, &mut cameras) == 0 {
                  cameras += 1;
              }
              cameras
          }
        `,
        php: code`
          function minCameraCover($root) {
              $cameras = 0;
              // 0 = needs watching, 1 = holds a camera, 2 = watched without one
              $visit = function ($node) use (&$visit, &$cameras) {
                  if ($node === null) return 2;
                  $left = $visit($node->left);
                  $right = $visit($node->right);
                  if ($left == 0 || $right == 0) { $cameras++; return 1; }
                  if ($left == 1 || $right == 1) return 2;
                  return 0;
              };
              if ($visit($root) == 0) $cameras++;
              return $cameras;
          }
        `,
        ruby: code`
          def minCameraCover(root)
            cameras = 0
            # 0 = needs watching, 1 = holds a camera, 2 = watched without one
            visit = lambda do |node|
              return 2 if node.nil?
              left = visit.call(node.left)
              right = visit.call(node.right)
              if left == 0 || right == 0
                cameras += 1
                return 1
              end
              return 2 if left == 1 || right == 1
              0
            end
            cameras += 1 if visit.call(root) == 0
            cameras
          end
        `,
      },
    };
  })(),

  // ── Vertical Order Traversal of a Binary Tree (LC 987) ──────────
  (() => {
    const ref = (root: TNode | null) => {
      const items: number[][] = [];
      const walk = (n: TNode | null, row: number, col: number) => {
        if (!n) return;
        items.push([col, row, n.val]);
        walk(n.left, row + 1, col - 1);
        walk(n.right, row + 1, col + 1);
      };
      walk(root, 0, 0);
      items.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      const out: number[][] = [];
      for (let i = 0; i < items.length; i++) {
        if (i === 0 || items[i][0] !== items[i - 1][0]) out.push([]);
        out[out.length - 1].push(items[i][2]);
      }
      return out;
    };
    return {
      slug: "vertical-order-traversal-of-a-binary-tree",
      title: "Vertical Order Traversal of a Binary Tree",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Hash Table", "Sorting", "Meta", "Amazon", "Google"],
      signature: { funcName: "verticalTraversal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[][]" as const },
      description: describe(
        "Place the `root` of a binary tree at position `(row, col) = (0, 0)`. For a node at `(row, col)`, its left child sits at `(row + 1, col - 1)` and its right child at `(row + 1, col + 1)`.\n\nThe **vertical order traversal** lists the tree column by column, from the leftmost column to the rightmost. Within one column the nodes go from top to bottom (increasing `row`); nodes that share both the row and the column are listed by increasing **value**.\n\nReturn the vertical order traversal as a list of columns.",
        [
          { in: "root = [3,9,20,null,null,15,7]", out: "[[9],[3,15],[20],[7]]", note: "Column -1 holds 9; column 0 holds 3 (row 0) then 15 (row 2); column 1 holds 20; column 2 holds 7." },
          { in: "root = [1,2,3,4,5,6,7]", out: "[[4],[2],[1,5,6],[3],[7]]", note: "5 and 6 both sit at row 2, column 0, so the smaller value comes first." },
          { in: "root = [1,2,3,4,6,5,7]", out: "[[4],[2],[1,5,6],[3],[7]]", note: "Swapping 5 and 6 in the tree does not change the answer: ties are broken by value, not by position." },
        ],
        ["The number of nodes is in the range [1, 1000]", "0 <= Node.val <= 1000"]),
      hints: [
        "Give every node its `(row, col)` with one traversal — the order of the traversal does not matter once you have the coordinates.",
        "The required order is a sort: by column, then by row, then by value.",
        "Sort the triples `(col, row, value)` and cut the sorted list wherever the column changes.",
      ],
      editorial: explain({
        idea: "The traversal order is defined entirely by each node's coordinates and value, so compute `(col, row, value)` for every node and sort. The columns are then consecutive runs of the sorted list.",
        steps: [
          "Traverse the tree (DFS or BFS), passing `(row, col)` down: the left child gets `(row + 1, col - 1)`, the right `(row + 1, col + 1)`.",
          "Record a triple `(col, row, value)` for each node.",
          "Sort the triples lexicographically.",
          "Walk the sorted triples, starting a new column whenever `col` differs from the previous triple's, and append each value to the current column.",
        ],
        why: "Lexicographic order on `(col, row, value)` is exactly the order the statement asks for: columns left to right, inside a column top to bottom, and value as the final tie-break for nodes sharing a position. Columns are contiguous in that order, so cutting at column changes yields the lists.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "A plain BFS that appends values in visit order breaks the tie between nodes at the same row and column — they must be ordered by value.",
          "Nodes in the same column but on different rows are ordered by row, not by value.",
          "Column indices are negative to the left of the root; offset them or sort rather than indexing an array with them.",
        ],
      }),
      examples: [
        { input: "[3,9,20,null,null,15,7]", expectedOutput: "[[9],[3,15],[20],[7]]" },
        { input: "[1,2,3,4,5,6,7]", expectedOutput: "[[4],[2],[1,5,6],[3],[7]]" },
        { input: "[1,2,3,4,6,5,7]", expectedOutput: "[[4],[2],[1,5,6],[3],[7]]" },
      ],
      gen: (rng: Rng) => {
        const root = randTree(rng, treeSize(rng), 0, pick(rng, [0, 3, 20, 1000]));
        return { input: fmtTree(root), expectedOutput: fmtIntMat(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def verticalTraversal(root: Optional[TreeNode]) -> List[List[int]]:
              items = []
              stack = [(root, 0, 0)]
              while stack:
                  node, row, col = stack.pop()
                  if node is None:
                      continue
                  items.append((col, row, node.val))
                  stack.append((node.left, row + 1, col - 1))
                  stack.append((node.right, row + 1, col + 1))
              items.sort()
              result = []
              for i, (col, _, val) in enumerate(items):
                  if i == 0 or col != items[i - 1][0]:
                      result.append([])
                  result[-1].append(val)
              return result
        `,
        javascript: code`
          var verticalTraversal = function(root) {
              var items = [];
              var stack = [[root, 0, 0]];
              while (stack.length > 0) {
                  var top = stack.pop();
                  var node = top[0], row = top[1], col = top[2];
                  if (node === null) continue;
                  items.push([col, row, node.val]);
                  stack.push([node.left, row + 1, col - 1]);
                  stack.push([node.right, row + 1, col + 1]);
              }
              items.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
              var result = [];
              for (var i = 0; i < items.length; i++) {
                  if (i === 0 || items[i][0] !== items[i - 1][0]) result.push([]);
                  result[result.length - 1].push(items[i][2]);
              }
              return result;
          };
        `,
        typescript: code`
          function verticalTraversal(root: TreeNode | null): number[][] {
              var items: number[][] = [];
              var stack: Array<[TreeNode | null, number, number]> = [[root, 0, 0]];
              while (stack.length > 0) {
                  var top = stack.pop() as [TreeNode | null, number, number];
                  var node = top[0], row = top[1], col = top[2];
                  if (node === null) continue;
                  items.push([col, row, node.val]);
                  stack.push([node.left, row + 1, col - 1]);
                  stack.push([node.right, row + 1, col + 1]);
              }
              items.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
              var result: number[][] = [];
              for (var i = 0; i < items.length; i++) {
                  if (i === 0 || items[i][0] !== items[i - 1][0]) result.push([]);
                  result[result.length - 1].push(items[i][2]);
              }
              return result;
          }
        `,
        java: code`
          public static int[][] verticalTraversal(TreeNode root) {
              List<int[]> items = new ArrayList<>();
              collectVertical(root, 0, 0, items);
              items.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : a[1] != b[1] ? Integer.compare(a[1], b[1]) : Integer.compare(a[2], b[2]));
              List<List<Integer>> cols = new ArrayList<>();
              for (int i = 0; i < items.size(); i++) {
                  if (i == 0 || items.get(i)[0] != items.get(i - 1)[0]) cols.add(new ArrayList<>());
                  cols.get(cols.size() - 1).add(items.get(i)[2]);
              }
              int[][] result = new int[cols.size()][];
              for (int i = 0; i < cols.size(); i++) result[i] = cols.get(i).stream().mapToInt(Integer::intValue).toArray();
              return result;
          }

          static void collectVertical(TreeNode node, int row, int col, List<int[]> items) {
              if (node == null) return;
              items.add(new int[] { col, row, node.val });
              collectVertical(node.left, row + 1, col - 1, items);
              collectVertical(node.right, row + 1, col + 1, items);
          }
        `,
        cpp: code`
          vector<vector<int>> verticalTraversal(TreeNode* root) {
              vector<array<int, 3>> items;
              function<void(TreeNode*, int, int)> walk = [&](TreeNode* node, int row, int col) {
                  if (!node) return;
                  items.push_back({col, row, node->val});
                  walk(node->left, row + 1, col - 1);
                  walk(node->right, row + 1, col + 1);
              };
              walk(root, 0, 0);
              sort(items.begin(), items.end());
              vector<vector<int>> result;
              for (size_t i = 0; i < items.size(); i++) {
                  if (i == 0 || items[i][0] != items[i - 1][0]) result.push_back({});
                  result.back().push_back(items[i][2]);
              }
              return result;
          }
        `,
        c: code`
          typedef struct { int col, row, val; } VerticalItem;

          static int cmpVerticalItem(const void* a, const void* b);

          int** verticalTraversal(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
              int cap = 64, n = 0;
              struct TreeNode** queue = (struct TreeNode**) malloc(cap * sizeof(struct TreeNode*));
              VerticalItem* items = (VerticalItem*) malloc(cap * sizeof(VerticalItem));
              if (root != NULL) {
                  queue[0] = root;
                  items[0].col = 0; items[0].row = 0; items[0].val = root->val;
                  n = 1;
              }
              for (int h = 0; h < n; h++) {
                  struct TreeNode* kids[2] = { queue[h]->left, queue[h]->right };
                  for (int k = 0; k < 2; k++) {
                      if (kids[k] == NULL) continue;
                      if (n == cap) {
                          cap *= 2;
                          queue = (struct TreeNode**) realloc(queue, cap * sizeof(struct TreeNode*));
                          items = (VerticalItem*) realloc(items, cap * sizeof(VerticalItem));
                      }
                      queue[n] = kids[k];
                      items[n].col = items[h].col + (k == 0 ? -1 : 1);
                      items[n].row = items[h].row + 1;
                      items[n].val = kids[k]->val;
                      n++;
                  }
              }
              qsort(items, n, sizeof(VerticalItem), cmpVerticalItem);
              int** result = (int**) malloc((n + 1) * sizeof(int*));
              *returnColumnSizes = (int*) malloc((n + 1) * sizeof(int));
              int cols = 0;
              for (int i = 0; i < n; ) {
                  int j = i;
                  while (j < n && items[j].col == items[i].col) j++;
                  result[cols] = (int*) malloc((j - i) * sizeof(int));
                  for (int t = i; t < j; t++) result[cols][t - i] = items[t].val;
                  (*returnColumnSizes)[cols] = j - i;
                  cols++;
                  i = j;
              }
              *returnSize = cols;
              free(queue);
              free(items);
              return result;
          }

          static int cmpVerticalItem(const void* a, const void* b) {
              const VerticalItem* x = (const VerticalItem*) a;
              const VerticalItem* y = (const VerticalItem*) b;
              if (x->col != y->col) return x->col - y->col;
              if (x->row != y->row) return x->row - y->row;
              return x->val - y->val;
          }
        `,
        csharp: code`
          public static int[][] VerticalTraversal(TreeNode root)
          {
              var items = new List<int[]>();
              var stack = new Stack<Tuple<TreeNode, int, int>>();
              stack.Push(Tuple.Create(root, 0, 0));
              while (stack.Count > 0)
              {
                  var top = stack.Pop();
                  var node = top.Item1;
                  if (node == null) continue;
                  items.Add(new[] { top.Item3, top.Item2, node.val });
                  stack.Push(Tuple.Create(node.left, top.Item2 + 1, top.Item3 - 1));
                  stack.Push(Tuple.Create(node.right, top.Item2 + 1, top.Item3 + 1));
              }
              items.Sort((a, b) => a[0] != b[0] ? a[0].CompareTo(b[0]) : a[1] != b[1] ? a[1].CompareTo(b[1]) : a[2].CompareTo(b[2]));
              var cols = new List<List<int>>();
              for (int i = 0; i < items.Count; i++)
              {
                  if (i == 0 || items[i][0] != items[i - 1][0]) cols.Add(new List<int>());
                  cols[cols.Count - 1].Add(items[i][2]);
              }
              return cols.Select(c => c.ToArray()).ToArray();
          }
        `,
        go: code`
          func verticalTraversal(root *TreeNode) [][]int {
              items := [][3]int{}
              var walk func(node *TreeNode, row, col int)
              walk = func(node *TreeNode, row, col int) {
                  if node == nil {
                      return
                  }
                  items = append(items, [3]int{col, row, node.Val})
                  walk(node.Left, row+1, col-1)
                  walk(node.Right, row+1, col+1)
              }
              walk(root, 0, 0)
              sort.Slice(items, func(i, j int) bool {
                  a, b := items[i], items[j]
                  if a[0] != b[0] {
                      return a[0] < b[0]
                  }
                  if a[1] != b[1] {
                      return a[1] < b[1]
                  }
                  return a[2] < b[2]
              })
              result := [][]int{}
              for i, it := range items {
                  if i == 0 || it[0] != items[i-1][0] {
                      result = append(result, []int{})
                  }
                  result[len(result)-1] = append(result[len(result)-1], it[2])
              }
              return result
          }
        `,
        kotlin: kt`
          fun verticalTraversal(root: TreeNode?): Array<IntArray> {
              val items = ArrayList<IntArray>()
              fun walk(node: TreeNode?, row: Int, col: Int) {
                  if (node == null) return
                  items.add(intArrayOf(col, row, node.\`val\`))
                  walk(node.left, row + 1, col - 1)
                  walk(node.right, row + 1, col + 1)
              }
              walk(root, 0, 0)
              items.sortWith(compareBy<IntArray>({ it[0] }, { it[1] }, { it[2] }))
              val cols = ArrayList<ArrayList<Int>>()
              for (i in items.indices) {
                  if (i == 0 || items[i][0] != items[i - 1][0]) cols.add(ArrayList())
                  cols[cols.size - 1].add(items[i][2])
              }
              return Array(cols.size) { cols[it].toIntArray() }
          }
        `,
        swift: code`
          func verticalTraversal(_ root: TreeNode?) -> [[Int]] {
              // One sortable key per node: (col + 1024, row, value), 11 bits each.
              var keys: [Int] = []
              var stack: [(TreeNode, Int, Int)] = []
              if let r = root { stack.append((r, 0, 0)) }
              while let (node, row, col) = stack.popLast() {
                  keys.append(((col + 1024) << 22) | (row << 11) | node.val)
                  if let l = node.left { stack.append((l, row + 1, col - 1)) }
                  if let r = node.right { stack.append((r, row + 1, col + 1)) }
              }
              keys.sort()
              var result: [[Int]] = []
              var lastCol = -1
              for k in keys {
                  let col = k >> 22
                  if col != lastCol { result.append([]); lastCol = col }
                  result[result.count - 1].append(k & 2047)
              }
              return result
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn verticalTraversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {
              let mut items: Vec<(i32, i32, i32)> = Vec::new();
              let mut stack: Vec<(Option<Rc<RefCell<TreeNode>>>, i32, i32)> = vec![(root, 0, 0)];
              while let Some((node, row, col)) = stack.pop() {
                  if let Some(n) = node {
                      let n = n.borrow();
                      items.push((col, row, n.val));
                      stack.push((n.left.clone(), row + 1, col - 1));
                      stack.push((n.right.clone(), row + 1, col + 1));
                  }
              }
              items.sort();
              let mut result: Vec<Vec<i32>> = Vec::new();
              for i in 0..items.len() {
                  if i == 0 || items[i].0 != items[i - 1].0 {
                      result.push(Vec::new());
                  }
                  result.last_mut().unwrap().push(items[i].2);
              }
              result
          }
        `,
        php: code`
          function verticalTraversal($root) {
              $items = [];
              $stack = [[$root, 0, 0]];
              while (count($stack) > 0) {
                  [$node, $row, $col] = array_pop($stack);
                  if ($node === null) continue;
                  $items[] = [$col, $row, $node->val];
                  $stack[] = [$node->left, $row + 1, $col - 1];
                  $stack[] = [$node->right, $row + 1, $col + 1];
              }
              usort($items, function ($a, $b) {
                  if ($a[0] != $b[0]) return $a[0] <=> $b[0];
                  if ($a[1] != $b[1]) return $a[1] <=> $b[1];
                  return $a[2] <=> $b[2];
              });
              $result = [];
              foreach ($items as $i => $it) {
                  if ($i == 0 || $it[0] != $items[$i - 1][0]) $result[] = [];
                  $result[count($result) - 1][] = $it[2];
              }
              return $result;
          }
        `,
        ruby: code`
          def verticalTraversal(root)
            items = []
            stack = [[root, 0, 0]]
            until stack.empty?
              node, row, col = stack.pop
              next if node.nil?
              items << [col, row, node.val]
              stack << [node.left, row + 1, col - 1]
              stack << [node.right, row + 1, col + 1]
            end
            items.sort!
            result = []
            items.each_with_index do |it, i|
              result << [] if i == 0 || it[0] != items[i - 1][0]
              result[-1] << it[2]
            end
            result
          end
        `,
      },
    };
  })(),

  // ── Recover a Tree From Preorder Traversal (LC 1028) ────────────
  (() => {
    const serialize = (root: TNode | null) => {
      const parts: string[] = [];
      const walk = (n: TNode | null, d: number) => {
        if (!n) return;
        parts.push("-".repeat(d) + n.val);
        walk(n.left, d + 1);
        walk(n.right, d + 1);
      };
      walk(root, 0);
      return parts.join("");
    };
    /** LeetCode's promise: a node with one child has it on the left. */
    const leftOnly = (n: TNode | null) => {
      if (!n) return;
      if (!n.left && n.right) { n.left = n.right; n.right = null; }
      leftOnly(n.left);
      leftOnly(n.right);
    };
    return {
      slug: "recover-a-tree-from-preorder-traversal",
      title: "Recover a Tree From Preorder Traversal",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "String", "Stack", "Google", "Amazon"],
      signature: { funcName: "recoverFromPreorder", params: [{ name: "traversal", type: "string" as const }], returns: "TreeNode" as const },
      description: describe(
        "A binary tree was walked in **preorder** (node, then its left subtree, then its right subtree). For every node the walk wrote `D` dashes, where `D` is the node's depth (the root has depth 0), immediately followed by the node's value. Everything was written into one string with no separators.\n\nWhenever a node has exactly one child, that child is its **left** child.\n\nGiven the string `traversal`, rebuild the tree and return its `root`.",
        [
          { in: "traversal = \"1-2--3--4-5--6--7\"", out: "[1,2,5,3,4,6,7]", note: "1 is the root; 2 and 5 are at depth 1; 3, 4 hang under 2 and 6, 7 under 5." },
          { in: "traversal = \"1-2--3---4-5--6---7\"", out: "[1,2,5,3,null,6,null,4,null,7]", note: "3 and 6 each have one child, which is therefore on the left." },
          { in: "traversal = \"1-401--349---90--88\"", out: "[1,401,null,349,88,90]", note: "After 90 at depth 3 the walk climbs back to depth 2 for 88, the second child of 401." },
        ],
        ["The number of nodes is in the range [1, 1000]", "1 <= Node.val <= 10^9"]),
      hints: [
        "Read the string as a sequence of (depth, value) pairs: count the dashes, then read the digits.",
        "In preorder, the parent of a node at depth `D` is the most recent node seen at depth `D - 1`.",
        "Keep a stack holding the current root-to-node path. Before attaching a node at depth `D`, pop until the stack has exactly `D` nodes; then it is the left child of the top if that slot is empty, otherwise the right child.",
      ],
      editorial: explain({
        idea: "Preorder visits a node right after its parent's earlier descendants, so the node's parent is always on the current root-to-node path, at depth one less. A stack holding that path, trimmed to the right depth before each node, rebuilds the tree in one left-to-right scan.",
        steps: [
          "Scan the string. Count consecutive dashes to get the depth `D`, then parse the following digits as the value.",
          "Pop the stack until its size equals `D` — what remains is the path from the root to the new node's parent.",
          "If the stack is not empty, attach the new node to the top: as the left child if that is still empty, otherwise as the right child.",
          "Push the new node.",
          "When the string ends, the bottom of the stack is the root.",
        ],
        why: "In a preorder walk, once a node at depth `D` is written, every node written later at a depth greater than `D` belongs to its subtree until a node at depth `D` or less appears. So the deepest node at depth `D - 1` written so far is the new node's parent, and the stack, trimmed to size `D`, has exactly that node on top. A parent receives its left child first, so filling the left slot before the right reproduces the tree — and a single child lands on the left, as promised.",
        time: "O(L), L the length of the string",
        space: "O(h) for the stack",
        pitfalls: [
          "Values have several digits — read until the next dash, not a single character.",
          "Pop to size `D`, not `D - 1`: the stack's size is the depth of the next free level.",
          "Values reach 10^9, which still fits a 32-bit int; accumulate them as you read digits.",
        ],
      }),
      examples: [
        { input: "\"1-2--3--4-5--6--7\"", expectedOutput: "[1,2,5,3,4,6,7]" },
        { input: "\"1-2--3---4-5--6---7\"", expectedOutput: "[1,2,5,3,null,6,null,4,null,7]" },
        { input: "\"1-401--349---90--88\"", expectedOutput: "[1,401,null,349,88,90]" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [9, 1000, 1000000000]);
        const root = randTree(rng, treeSize(rng), 1, hi);
        leftOnly(root);
        return { input: JSON.stringify(serialize(root)), expectedOutput: fmtTree(root) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def recoverFromPreorder(traversal: str) -> Optional[TreeNode]:
              stack = []
              i, n = 0, len(traversal)
              while i < n:
                  depth = 0
                  while traversal[i] == '-':
                      depth += 1
                      i += 1
                  value = 0
                  while i < n and traversal[i] != '-':
                      value = value * 10 + ord(traversal[i]) - 48
                      i += 1
                  node = TreeNode(value)
                  del stack[depth:]
                  if stack:
                      parent = stack[-1]
                      if parent.left is None:
                          parent.left = node
                      else:
                          parent.right = node
                  stack.append(node)
              return stack[0]
        `,
        javascript: code`
          var recoverFromPreorder = function(traversal) {
              var stack = [];
              var i = 0, n = traversal.length;
              while (i < n) {
                  var depth = 0;
                  while (traversal[i] === '-') { depth++; i++; }
                  var value = 0;
                  while (i < n && traversal[i] !== '-') { value = value * 10 + (traversal.charCodeAt(i) - 48); i++; }
                  var node = new TreeNode(value);
                  stack.length = depth;
                  if (depth > 0) {
                      var parent = stack[depth - 1];
                      if (parent.left === null) parent.left = node; else parent.right = node;
                  }
                  stack.push(node);
              }
              return stack[0];
          };
        `,
        typescript: code`
          function recoverFromPreorder(traversal: string): TreeNode | null {
              var stack: TreeNode[] = [];
              var i = 0, n = traversal.length;
              while (i < n) {
                  var depth = 0;
                  while (traversal.charAt(i) === '-') { depth++; i++; }
                  var value = 0;
                  while (i < n && traversal.charAt(i) !== '-') { value = value * 10 + (traversal.charCodeAt(i) - 48); i++; }
                  var node = new TreeNode(value);
                  stack.length = depth;
                  if (depth > 0) {
                      var parent = stack[depth - 1];
                      if (parent.left === null) parent.left = node; else parent.right = node;
                  }
                  stack.push(node);
              }
              return stack[0];
          }
        `,
        java: code`
          public static TreeNode recoverFromPreorder(String traversal) {
              List<TreeNode> stack = new ArrayList<>();
              int i = 0, n = traversal.length();
              while (i < n) {
                  int depth = 0;
                  while (traversal.charAt(i) == '-') { depth++; i++; }
                  int value = 0;
                  while (i < n && traversal.charAt(i) != '-') { value = value * 10 + (traversal.charAt(i) - '0'); i++; }
                  TreeNode node = new TreeNode(value);
                  while (stack.size() > depth) stack.remove(stack.size() - 1);
                  if (!stack.isEmpty()) {
                      TreeNode parent = stack.get(stack.size() - 1);
                      if (parent.left == null) parent.left = node; else parent.right = node;
                  }
                  stack.add(node);
              }
              return stack.get(0);
          }
        `,
        cpp: code`
          TreeNode* recoverFromPreorder(string traversal) {
              vector<TreeNode*> stack;
              size_t i = 0, n = traversal.size();
              while (i < n) {
                  size_t depth = 0;
                  while (traversal[i] == '-') { depth++; i++; }
                  int value = 0;
                  while (i < n && traversal[i] != '-') { value = value * 10 + (traversal[i] - '0'); i++; }
                  TreeNode* node = new TreeNode(value);
                  stack.resize(depth);
                  if (!stack.empty()) {
                      TreeNode* parent = stack.back();
                      if (!parent->left) parent->left = node; else parent->right = node;
                  }
                  stack.push_back(node);
              }
              return stack[0];
          }
        `,
        c: code`
          struct TreeNode* recoverFromPreorder(char* traversal) {
              int n = (int) strlen(traversal);
              struct TreeNode** stack = (struct TreeNode**) malloc((n + 1) * sizeof(struct TreeNode*));
              int size = 0, i = 0;
              while (i < n) {
                  int depth = 0;
                  while (traversal[i] == '-') { depth++; i++; }
                  int value = 0;
                  while (i < n && traversal[i] != '-') { value = value * 10 + (traversal[i] - '0'); i++; }
                  struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
                  node->val = value;
                  node->left = NULL;
                  node->right = NULL;
                  size = depth;
                  if (size > 0) {
                      struct TreeNode* parent = stack[size - 1];
                      if (parent->left == NULL) parent->left = node; else parent->right = node;
                  }
                  stack[size++] = node;
              }
              struct TreeNode* root = stack[0];
              free(stack);
              return root;
          }
        `,
        csharp: code`
          public static TreeNode RecoverFromPreorder(string traversal)
          {
              var stack = new List<TreeNode>();
              int i = 0, n = traversal.Length;
              while (i < n)
              {
                  int depth = 0;
                  while (traversal[i] == '-') { depth++; i++; }
                  int value = 0;
                  while (i < n && traversal[i] != '-') { value = value * 10 + (traversal[i] - '0'); i++; }
                  var node = new TreeNode(value);
                  stack.RemoveRange(depth, stack.Count - depth);
                  if (stack.Count > 0)
                  {
                      var parent = stack[stack.Count - 1];
                      if (parent.left == null) parent.left = node; else parent.right = node;
                  }
                  stack.Add(node);
              }
              return stack[0];
          }
        `,
        go: code`
          func recoverFromPreorder(traversal string) *TreeNode {
              stack := []*TreeNode{}
              i, n := 0, len(traversal)
              for i < n {
                  depth := 0
                  for traversal[i] == '-' {
                      depth++
                      i++
                  }
                  value := 0
                  for i < n && traversal[i] != '-' {
                      value = value*10 + int(traversal[i]-'0')
                      i++
                  }
                  node := &TreeNode{Val: value}
                  stack = stack[:depth]
                  if depth > 0 {
                      parent := stack[depth-1]
                      if parent.Left == nil {
                          parent.Left = node
                      } else {
                          parent.Right = node
                      }
                  }
                  stack = append(stack, node)
              }
              return stack[0]
          }
        `,
        kotlin: kt`
          fun recoverFromPreorder(traversal: String): TreeNode? {
              val stack = ArrayList<TreeNode>()
              var i = 0
              val n = traversal.length
              while (i < n) {
                  var depth = 0
                  while (traversal[i] == '-') { depth++; i++ }
                  var value = 0
                  while (i < n && traversal[i] != '-') { value = value * 10 + (traversal[i] - '0'); i++ }
                  val node = TreeNode(value)
                  while (stack.size > depth) stack.removeAt(stack.size - 1)
                  if (stack.isNotEmpty()) {
                      val parent = stack[stack.size - 1]
                      if (parent.left == null) parent.left = node else parent.right = node
                  }
                  stack.add(node)
              }
              return stack[0]
          }
        `,
        swift: code`
          func recoverFromPreorder(_ traversal: String) -> TreeNode? {
              let s = Array(traversal.utf8)
              var stack: [TreeNode] = []
              var i = 0
              while i < s.count {
                  var depth = 0
                  while s[i] == 45 { depth += 1; i += 1 }
                  var value = 0
                  while i < s.count && s[i] != 45 { value = value * 10 + Int(s[i]) - 48; i += 1 }
                  let node = TreeNode(value)
                  stack.removeLast(stack.count - depth)
                  if let parent = stack.last {
                      if parent.left == nil { parent.left = node } else { parent.right = node }
                  }
                  stack.append(node)
              }
              return stack[0]
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn recoverFromPreorder(traversal: String) -> Option<Rc<RefCell<TreeNode>>> {
              let s = traversal.as_bytes();
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut i = 0;
              while i < s.len() {
                  let mut depth = 0;
                  while s[i] == b'-' {
                      depth += 1;
                      i += 1;
                  }
                  let mut value: i32 = 0;
                  while i < s.len() && s[i] != b'-' {
                      value = value * 10 + (s[i] - b'0') as i32;
                      i += 1;
                  }
                  let node = Rc::new(RefCell::new(TreeNode::new(value)));
                  stack.truncate(depth);
                  if let Some(parent) = stack.last() {
                      let mut p = parent.borrow_mut();
                      if p.left.is_none() {
                          p.left = Some(node.clone());
                      } else {
                          p.right = Some(node.clone());
                      }
                  }
                  stack.push(node);
              }
              stack.first().cloned()
          }
        `,
        php: code`
          function recoverFromPreorder($traversal) {
              $stack = [];
              $i = 0;
              $n = strlen($traversal);
              while ($i < $n) {
                  $depth = 0;
                  while ($traversal[$i] === '-') { $depth++; $i++; }
                  $value = 0;
                  while ($i < $n && $traversal[$i] !== '-') { $value = $value * 10 + (ord($traversal[$i]) - 48); $i++; }
                  $node = new TreeNode($value);
                  $stack = array_slice($stack, 0, $depth);
                  if ($depth > 0) {
                      $parent = $stack[$depth - 1];
                      if ($parent->left === null) $parent->left = $node; else $parent->right = $node;
                  }
                  $stack[] = $node;
              }
              return $stack[0];
          }
        `,
        ruby: code`
          def recoverFromPreorder(traversal)
            stack = []
            i = 0
            n = traversal.length
            while i < n
              depth = 0
              while traversal[i] == '-'
                depth += 1
                i += 1
              end
              value = 0
              while i < n && traversal[i] != '-'
                value = value * 10 + traversal[i].ord - 48
                i += 1
              end
              node = TreeNode.new(value)
              stack.pop while stack.length > depth
              unless stack.empty?
                parent = stack[-1]
                if parent.left.nil? then parent.left = node else parent.right = node end
              end
              stack << node
            end
            stack[0]
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum BST in Binary Tree (LC 1373) ────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let best = 0;
      for (const node of graphOf(root).nodes) {
        const vals: number[] = [];
        const inorder = (n: TNode | null) => { if (!n) return; inorder(n.left); vals.push(n.val); inorder(n.right); };
        inorder(node);
        let ok = true;
        for (let i = 1; i < vals.length; i++) if (vals[i] <= vals[i - 1]) ok = false;
        if (ok) best = Math.max(best, vals.reduce((s, v) => s + v, 0));
      }
      return best;
    };
    return {
      slug: "maximum-sum-bst-in-binary-tree",
      title: "Maximum Sum BST in Binary Tree",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Dynamic Programming", "Recursion", "Amazon", "Google"],
      signature: { funcName: "maxSumBST", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, consider every subtree of it (a node together with all of its descendants). Return the **largest sum of node values** among the subtrees that are **binary search trees**.\n\nA subtree is a binary search tree when, for every node in it:\n- every value in the node's left subtree is **strictly less** than the node's value,\n- every value in the node's right subtree is **strictly greater** than the node's value,\n- and both of those subtrees are binary search trees themselves.\n\nAn empty subtree counts as a binary search tree with sum `0`, so the answer is never negative.",
        [
          { in: "root = [1,4,3,2,4,2,5,null,null,null,null,null,null,4,6]", out: "20", note: "The subtree rooted at 3 — values 2, 3, 4, 5, 6 — is a binary search tree with sum 20." },
          { in: "root = [4,3,null,1,2]", out: "2", note: "3 has 1 and 2 below it in the wrong order; the best binary search tree is the single node 2." },
          { in: "root = [-4,-2,-5]", out: "0", note: "Every non-empty binary search tree here has a negative sum, so the empty one wins." },
        ],
        ["The number of nodes is in the range [1, 4 * 10^4]", "-4 * 10^4 <= Node.val <= 4 * 10^4"]),
      hints: [
        "Checking each subtree from scratch costs O(n) per node. What would a node need to know about its children to decide in O(1)?",
        "A node roots a binary search tree when both children do, the left child's maximum is below the node's value and the right child's minimum is above it.",
        "Return four facts from each subtree in post-order — is it a BST, its minimum, its maximum, its sum — with an empty subtree reporting (yes, +∞, −∞, 0).",
      ],
      editorial: explain({
        idea: "Whether a subtree is a binary search tree depends only on its two child subtrees being binary search trees and on how their extreme values compare with the root. So one post-order pass, carrying (is BST, min, max, sum) upward, decides every subtree in constant time.",
        steps: [
          "Define `info(node)` returning `(isBST, min, max, sum)`; an empty subtree returns `(true, +∞, −∞, 0)`.",
          "For a node, compute `L = info(left)` and `R = info(right)` first.",
          "If `L.isBST`, `R.isBST` and `L.max < node.val < R.min`, the subtree is a BST: its sum is `L.sum + R.sum + node.val`; update the answer and return `(true, min(L.min, val), max(R.max, val), sum)`.",
          "Otherwise return `(false, …)` — no ancestor can be a BST either.",
          "Start the answer at 0 (the empty subtree) and return it.",
        ],
        why: "A tree is a BST exactly when its subtrees are BSTs and every left value is below the root and every right value above it; within a BST the extreme values are its minimum and maximum, so comparing `L.max` and `R.min` with the root checks all of those inequalities at once. Using +∞/−∞ for an empty side makes the comparison pass automatically.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Comparing a node only with its direct children is not enough — a grandchild can break the order.",
          "The empty subtree makes the answer at least 0; do not return a negative sum.",
          "The order is strict: a duplicate value anywhere in a subtree stops it being a BST.",
          "Once a subtree is not a BST, no subtree containing it is — return early instead of computing bogus extremes.",
        ],
      }),
      examples: [
        { input: "[1,4,3,2,4,2,5,null,null,null,null,null,null,4,6]", expectedOutput: "20" },
        { input: "[4,3,null,1,2]", expectedOutput: "2" },
        { input: "[-4,-2,-5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const v = pick(rng, [5, 30, 40000]);
        let n = Math.min(treeSize(rng), 2 * v + 1);
        if (rng() < 0.25) return ((root) => ({ input: fmtTree(root), expectedOutput: String(ref(root)) }))(randTree(rng, n, -v, v));
        n = Math.max(n, 1);
        const root = randBST(rng, n, -v, v);
        // Break the order at a few nodes so that only some subtrees stay BSTs.
        const nodes = graphOf(root).nodes;
        for (let k = ri(rng, 0, 3); k > 0; k--) pick(rng, nodes).val = ri(rng, -v, v);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxSumBST(root: Optional[TreeNode]) -> int:
              best = [0]
              INF = float('inf')

              # (is BST, min, max, sum) of the subtree at node
              def info(node):
                  if node is None:
                      return True, INF, -INF, 0
                  lb, lmin, lmax, lsum = info(node.left)
                  rb, rmin, rmax, rsum = info(node.right)
                  if lb and rb and lmax < node.val < rmin:
                      total = lsum + rsum + node.val
                      best[0] = max(best[0], total)
                      return True, min(lmin, node.val), max(rmax, node.val), total
                  return False, 0, 0, 0

              info(root)
              return best[0]
        `,
        javascript: code`
          var maxSumBST = function(root) {
              var best = 0;
              // [is BST, min, max, sum] of the subtree at node
              var info = function(node) {
                  if (node === null) return [true, Infinity, -Infinity, 0];
                  var l = info(node.left), r = info(node.right);
                  if (l[0] && r[0] && l[2] < node.val && node.val < r[1]) {
                      var total = l[3] + r[3] + node.val;
                      best = Math.max(best, total);
                      return [true, Math.min(l[1], node.val), Math.max(r[2], node.val), total];
                  }
                  return [false, 0, 0, 0];
              };
              info(root);
              return best;
          };
        `,
        typescript: code`
          function maxSumBST(root: TreeNode | null): number {
              var best = 0;
              // [is BST (1/0), min, max, sum] of the subtree at node
              function info(node: TreeNode | null): number[] {
                  if (node === null) return [1, Infinity, -Infinity, 0];
                  var l = info(node.left), r = info(node.right);
                  if (l[0] === 1 && r[0] === 1 && l[2] < node.val && node.val < r[1]) {
                      var total = l[3] + r[3] + node.val;
                      best = Math.max(best, total);
                      return [1, Math.min(l[1], node.val), Math.max(r[2], node.val), total];
                  }
                  return [0, 0, 0, 0];
              }
              info(root);
              return best;
          }
        `,
        java: code`
          public static int maxSumBST(TreeNode root) {
              int[] best = { 0 };
              bstInfo(root, best);
              return best[0];
          }

          // {is BST (1/0), min, max, sum} of the subtree at node
          static int[] bstInfo(TreeNode node, int[] best) {
              if (node == null) return new int[] { 1, Integer.MAX_VALUE, Integer.MIN_VALUE, 0 };
              int[] l = bstInfo(node.left, best), r = bstInfo(node.right, best);
              if (l[0] == 1 && r[0] == 1 && l[2] < node.val && node.val < r[1]) {
                  int total = l[3] + r[3] + node.val;
                  best[0] = Math.max(best[0], total);
                  return new int[] { 1, Math.min(l[1], node.val), Math.max(r[2], node.val), total };
              }
              return new int[] { 0, 0, 0, 0 };
          }
        `,
        cpp: code`
          int maxSumBST(TreeNode* root) {
              int best = 0;
              // {is BST (1/0), min, max, sum} of the subtree at node
              function<array<int, 4>(TreeNode*)> info = [&](TreeNode* node) -> array<int, 4> {
                  if (!node) return {1, INT_MAX, INT_MIN, 0};
                  array<int, 4> l = info(node->left), r = info(node->right);
                  if (l[0] && r[0] && l[2] < node->val && node->val < r[1]) {
                      int total = l[3] + r[3] + node->val;
                      best = max(best, total);
                      return {1, min(l[1], node->val), max(r[2], node->val), total};
                  }
                  return {0, 0, 0, 0};
              };
              info(root);
              return best;
          }
        `,
        c: code`
          typedef struct { int bst, lo, hi, sum; } BstInfo;

          static BstInfo bstInfo(struct TreeNode* node, int* best);

          int maxSumBST(struct TreeNode* root) {
              int best = 0;
              bstInfo(root, &best);
              return best;
          }

          static BstInfo bstInfo(struct TreeNode* node, int* best) {
              BstInfo out = { 1, 2147483647, -2147483647 - 1, 0 };
              if (node == NULL) return out;
              BstInfo l = bstInfo(node->left, best);
              BstInfo r = bstInfo(node->right, best);
              if (l.bst && r.bst && l.hi < node->val && node->val < r.lo) {
                  out.sum = l.sum + r.sum + node->val;
                  out.lo = l.lo < node->val ? l.lo : node->val;
                  out.hi = r.hi > node->val ? r.hi : node->val;
                  if (out.sum > *best) *best = out.sum;
                  return out;
              }
              out.bst = 0;
              return out;
          }
        `,
        csharp: code`
          public static int MaxSumBST(TreeNode root)
          {
              int best = 0;
              BstInfo(root, ref best);
              return best;
          }

          // {is BST (1/0), min, max, sum} of the subtree at node
          static int[] BstInfo(TreeNode node, ref int best)
          {
              if (node == null) return new[] { 1, int.MaxValue, int.MinValue, 0 };
              var l = BstInfo(node.left, ref best);
              var r = BstInfo(node.right, ref best);
              if (l[0] == 1 && r[0] == 1 && l[2] < node.val && node.val < r[1])
              {
                  int total = l[3] + r[3] + node.val;
                  best = Math.Max(best, total);
                  return new[] { 1, Math.Min(l[1], node.val), Math.Max(r[2], node.val), total };
              }
              return new[] { 0, 0, 0, 0 };
          }
        `,
        go: code`
          func maxSumBST(root *TreeNode) int {
              best := 0
              // is BST, min, max, sum of the subtree at node
              var info func(node *TreeNode) (bool, int, int, int)
              info = func(node *TreeNode) (bool, int, int, int) {
                  if node == nil {
                      return true, 1 << 31, -(1 << 31), 0
                  }
                  lb, lmin, lmax, lsum := info(node.Left)
                  rb, rmin, rmax, rsum := info(node.Right)
                  if lb && rb && lmax < node.Val && node.Val < rmin {
                      total := lsum + rsum + node.Val
                      if total > best {
                          best = total
                      }
                      lo, hi := lmin, rmax
                      if node.Val < lo {
                          lo = node.Val
                      }
                      if node.Val > hi {
                          hi = node.Val
                      }
                      return true, lo, hi, total
                  }
                  return false, 0, 0, 0
              }
              info(root)
              return best
          }
        `,
        kotlin: kt`
          fun maxSumBST(root: TreeNode?): Int {
              var best = 0
              // {is BST (1/0), min, max, sum} of the subtree at node
              fun info(node: TreeNode?): IntArray {
                  if (node == null) return intArrayOf(1, Int.MAX_VALUE, Int.MIN_VALUE, 0)
                  val l = info(node.left)
                  val r = info(node.right)
                  val v = node.\`val\`
                  if (l[0] == 1 && r[0] == 1 && l[2] < v && v < r[1]) {
                      val total = l[3] + r[3] + v
                      best = maxOf(best, total)
                      return intArrayOf(1, minOf(l[1], v), maxOf(r[2], v), total)
                  }
                  return intArrayOf(0, 0, 0, 0)
              }
              info(root)
              return best
          }
        `,
        swift: code`
          func maxSumBST(_ root: TreeNode?) -> Int {
              var best = 0
              // (is BST, min, max, sum) of the subtree at node
              func info(_ node: TreeNode?) -> (Bool, Int, Int, Int) {
                  guard let n = node else { return (true, Int.max, Int.min, 0) }
                  let l = info(n.left), r = info(n.right)
                  if l.0 && r.0 && l.2 < n.val && n.val < r.1 {
                      let total = l.3 + r.3 + n.val
                      best = max(best, total)
                      return (true, min(l.1, n.val), max(r.2, n.val), total)
                  }
                  return (false, 0, 0, 0)
              }
              _ = info(root)
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxSumBST(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              // (is BST, min, max, sum) of the subtree at node
              fn info(node: &Option<Rc<RefCell<TreeNode>>>, best: &mut i32) -> (bool, i32, i32, i32) {
                  match node {
                      None => (true, std::i32::MAX, std::i32::MIN, 0),
                      Some(n) => {
                          let n = n.borrow();
                          let l = info(&n.left, best);
                          let r = info(&n.right, best);
                          if l.0 && r.0 && l.2 < n.val && n.val < r.1 {
                              let total = l.3 + r.3 + n.val;
                              *best = (*best).max(total);
                              (true, l.1.min(n.val), r.2.max(n.val), total)
                          } else {
                              (false, 0, 0, 0)
                          }
                      }
                  }
              }
              let mut best = 0;
              info(&root, &mut best);
              best
          }
        `,
        php: code`
          function maxSumBST($root) {
              $best = 0;
              // [is BST, min, max, sum] of the subtree at node
              $info = function ($node) use (&$info, &$best) {
                  if ($node === null) return [true, PHP_INT_MAX, PHP_INT_MIN, 0];
                  $l = $info($node->left);
                  $r = $info($node->right);
                  $v = $node->val;
                  if ($l[0] && $r[0] && $l[2] < $v && $v < $r[1]) {
                      $total = $l[3] + $r[3] + $v;
                      $best = max($best, $total);
                      return [true, min($l[1], $v), max($r[2], $v), $total];
                  }
                  return [false, 0, 0, 0];
              };
              $info($root);
              return $best;
          }
        `,
        ruby: code`
          def maxSumBST(root)
            best = 0
            inf = Float::INFINITY
            # [is BST, min, max, sum] of the subtree at node
            info = lambda do |node|
              return [true, inf, -inf, 0] if node.nil?
              l = info.call(node.left)
              r = info.call(node.right)
              v = node.val
              if l[0] && r[0] && l[2] < v && v < r[1]
                total = l[3] + r[3] + v
                best = total if total > best
                return [true, [l[1], v].min, [r[2], v].max, total]
              end
              [false, 0, 0, 0]
            end
            info.call(root)
            best
          end
        `,
      },
    };
  })(),

  // ── Height of Binary Tree After Subtree Removal Queries (LC 2458) ─
  (() => {
    const ref = (root: TNode | null, queries: number[]) => queries.map((q) => {
      let best = 0;
      const walk = (n: TNode | null, d: number) => {
        if (!n || n.val === q) return;
        best = Math.max(best, d);
        walk(n.left, d + 1);
        walk(n.right, d + 1);
      };
      walk(root, 0);
      return best;
    });
    return {
      slug: "height-of-binary-tree-after-subtree-removal-queries",
      title: "Height of Binary Tree After Subtree Removal Queries",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Array", "Google", "Amazon"],
      signature: { funcName: "treeQueries", params: [{ name: "root", type: "TreeNode" as const }, { name: "queries", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the `root` of a binary tree with `n` nodes, whose values are exactly `1` to `n` (each used once), and an array `queries` of `m` values.\n\nAnswer each query **independently**: for `queries[i]`, remove the whole subtree rooted at the node with that value, and report the **height** of what is left. The tree goes back to its original shape before the next query.\n\nThe height of a tree is the number of edges on the longest path from the root down to some node. No query names the root.\n\nReturn an array `answer` where `answer[i]` is the height after the `i`-th removal.",
        [
          { in: "root = [1,3,4,2,null,6,5,null,null,null,null,null,7], queries = [4]", out: "[2]", note: "Removing 4 takes 6, 5 and 7 with it; the longest remaining path is 1 → 3 → 2, two edges." },
          { in: "root = [5,8,9,2,1,3,7,4,6], queries = [3,2,4,8]", out: "[3,2,3,2]", note: "Removing 2 takes 4 and 6 away, so the deepest remaining nodes are at depth 2." },
          { in: "root = [1,2], queries = [2]", out: "[0]", note: "Only the root is left." },
        ],
        ["The number of nodes is n, 2 <= n <= 10^5", "1 <= Node.val <= n, all values are distinct", "m == queries.length", "1 <= m <= min(n, 10^4)", "1 <= queries[i] <= n", "queries[i] != root.val"]),
      hints: [
        "Recomputing the height per query is O(n) each. Think about what the answer for a node depends on — it is the deepest node *outside* its subtree.",
        "Walk down from the root carrying `rest`: the deepest depth reachable without entering the current node's subtree.",
        "Going into the left child, the right subtree becomes available: `rest' = max(rest, depth + 1 + height(right))` (with height of an empty tree = -1). Precompute every node's height first.",
      ],
      editorial: explain({
        idea: "After removing the subtree at `x`, the height is the depth of the deepest node outside that subtree. Walking from the root, the region outside a child's subtree is the region outside its parent's subtree plus the parent itself plus the sibling's subtree — so the answer for every node follows from its parent's answer and its sibling's height.",
        steps: [
          "First pass (post-order): record `height[v]` for every node (a leaf has height 0, an empty tree -1).",
          "Second pass from the root with `(node, depth, rest)`; the root starts with `rest = 0`.",
          "Record `answer[node.val] = rest`.",
          "Recurse into the left child with `rest' = max(rest, depth + 1 + height(right))`, and into the right child with `rest' = max(rest, depth + 1 + height(left))`, where a missing sibling contributes `depth` (the parent alone).",
          "Answer each query by looking up `answer[queries[i]]`.",
        ],
        why: "The nodes outside a child's subtree are: the nodes outside its parent's subtree (deepest is `rest`), the parent itself (depth `depth`), and the sibling's subtree (deepest is `depth + 1 + height(sibling)`, which is `depth` again when the sibling is missing). Taking the maximum gives the exact height after removing the child's subtree, by induction from the root.",
        time: "O(n + m)",
        space: "O(n)",
        pitfalls: [
          "Queries are independent — never actually delete anything.",
          "A missing sibling still leaves the parent, so it contributes the parent's depth, not depth + 1.",
          "Height counts edges: a tree of one node has height 0.",
        ],
      }),
      examples: [
        { input: "[1,3,4,2,null,6,5,null,null,null,null,null,7]\n[4]", expectedOutput: "[2]" },
        { input: "[5,8,9,2,1,3,7,4,6]\n[3,2,4,8]", expectedOutput: "[3,2,3,2]" },
        { input: "[1,2]\n[2]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = Math.max(2, treeSize(rng));
        const root = distinctTree(rng, n)!;
        const others = Array.from({ length: n }, (_, i) => i + 1).filter((v) => v !== root.val);
        const m = ri(rng, 1, n);
        const queries = Array.from({ length: m }, () => pick(rng, others));
        return { input: `${fmtTree(root)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(root, queries)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def treeQueries(root: Optional[TreeNode], queries: List[int]) -> List[int]:
              height = {}

              def measure(node):
                  if node is None:
                      return -1
                  h = 1 + max(measure(node.left), measure(node.right))
                  height[node.val] = h
                  return h

              def h_of(node):
                  return -1 if node is None else height[node.val]

              answer = {}

              def fill(node, depth, rest):
                  if node is None:
                      return
                  answer[node.val] = rest
                  fill(node.left, depth + 1, max(rest, depth + 1 + h_of(node.right)))
                  fill(node.right, depth + 1, max(rest, depth + 1 + h_of(node.left)))

              measure(root)
              fill(root, 0, 0)
              return [answer[q] for q in queries]
        `,
        javascript: code`
          var treeQueries = function(root, queries) {
              var height = {}, answer = {};
              var measure = function(node) {
                  if (node === null) return -1;
                  var h = 1 + Math.max(measure(node.left), measure(node.right));
                  height[node.val] = h;
                  return h;
              };
              var hOf = function(node) { return node === null ? -1 : height[node.val]; };
              var fill = function(node, depth, rest) {
                  if (node === null) return;
                  answer[node.val] = rest;
                  fill(node.left, depth + 1, Math.max(rest, depth + 1 + hOf(node.right)));
                  fill(node.right, depth + 1, Math.max(rest, depth + 1 + hOf(node.left)));
              };
              measure(root);
              fill(root, 0, 0);
              return queries.map(function (q) { return answer[q]; });
          };
        `,
        typescript: code`
          function treeQueries(root: TreeNode | null, queries: number[]): number[] {
              var height: { [v: number]: number } = {}, answer: { [v: number]: number } = {};
              function measure(node: TreeNode | null): number {
                  if (node === null) return -1;
                  var h = 1 + Math.max(measure(node.left), measure(node.right));
                  height[node.val] = h;
                  return h;
              }
              function hOf(node: TreeNode | null): number { return node === null ? -1 : height[node.val]; }
              function fill(node: TreeNode | null, depth: number, rest: number): void {
                  if (node === null) return;
                  answer[node.val] = rest;
                  fill(node.left, depth + 1, Math.max(rest, depth + 1 + hOf(node.right)));
                  fill(node.right, depth + 1, Math.max(rest, depth + 1 + hOf(node.left)));
              }
              measure(root);
              fill(root, 0, 0);
              return queries.map(function (q) { return answer[q]; });
          }
        `,
        java: code`
          public static int[] treeQueries(TreeNode root, int[] queries) {
              int n = countNodes(root);
              int[] height = new int[n + 1], answer = new int[n + 1];
              measure(root, height);
              fill(root, 0, 0, height, answer);
              int[] res = new int[queries.length];
              for (int i = 0; i < queries.length; i++) res[i] = answer[queries[i]];
              return res;
          }

          static int countNodes(TreeNode node) {
              return node == null ? 0 : 1 + countNodes(node.left) + countNodes(node.right);
          }

          static int measure(TreeNode node, int[] height) {
              if (node == null) return -1;
              int h = 1 + Math.max(measure(node.left, height), measure(node.right, height));
              height[node.val] = h;
              return h;
          }

          static void fill(TreeNode node, int depth, int rest, int[] height, int[] answer) {
              if (node == null) return;
              answer[node.val] = rest;
              int hl = node.left == null ? -1 : height[node.left.val];
              int hr = node.right == null ? -1 : height[node.right.val];
              fill(node.left, depth + 1, Math.max(rest, depth + 1 + hr), height, answer);
              fill(node.right, depth + 1, Math.max(rest, depth + 1 + hl), height, answer);
          }
        `,
        cpp: code`
          vector<int> treeQueries(TreeNode* root, vector<int>& queries) {
              unordered_map<int, int> height, answer;
              function<int(TreeNode*)> measure = [&](TreeNode* node) -> int {
                  if (!node) return -1;
                  int h = 1 + max(measure(node->left), measure(node->right));
                  height[node->val] = h;
                  return h;
              };
              auto hOf = [&](TreeNode* node) { return node ? height[node->val] : -1; };
              function<void(TreeNode*, int, int)> fill = [&](TreeNode* node, int depth, int rest) {
                  if (!node) return;
                  answer[node->val] = rest;
                  fill(node->left, depth + 1, max(rest, depth + 1 + hOf(node->right)));
                  fill(node->right, depth + 1, max(rest, depth + 1 + hOf(node->left)));
              };
              measure(root);
              fill(root, 0, 0);
              vector<int> res;
              for (int q : queries) res.push_back(answer[q]);
              return res;
          }
        `,
        c: code`
          static int tqCount(struct TreeNode* node);
          static int tqMeasure(struct TreeNode* node, int* height);
          static void tqFill(struct TreeNode* node, int depth, int rest, int* height, int* answer);

          int* treeQueries(struct TreeNode* root, int* queries, int queriesSize, int* returnSize) {
              int n = tqCount(root);
              int* height = (int*) calloc(n + 1, sizeof(int));
              int* answer = (int*) calloc(n + 1, sizeof(int));
              tqMeasure(root, height);
              tqFill(root, 0, 0, height, answer);
              int* res = (int*) malloc((queriesSize + 1) * sizeof(int));
              for (int i = 0; i < queriesSize; i++) res[i] = answer[queries[i]];
              *returnSize = queriesSize;
              free(height);
              free(answer);
              return res;
          }

          static int tqCount(struct TreeNode* node) {
              return node == NULL ? 0 : 1 + tqCount(node->left) + tqCount(node->right);
          }

          static int tqMeasure(struct TreeNode* node, int* height) {
              if (node == NULL) return -1;
              int l = tqMeasure(node->left, height), r = tqMeasure(node->right, height);
              height[node->val] = 1 + (l > r ? l : r);
              return height[node->val];
          }

          static void tqFill(struct TreeNode* node, int depth, int rest, int* height, int* answer) {
              if (node == NULL) return;
              answer[node->val] = rest;
              int hl = node->left == NULL ? -1 : height[node->left->val];
              int hr = node->right == NULL ? -1 : height[node->right->val];
              int toLeft = depth + 1 + hr > rest ? depth + 1 + hr : rest;
              int toRight = depth + 1 + hl > rest ? depth + 1 + hl : rest;
              tqFill(node->left, depth + 1, toLeft, height, answer);
              tqFill(node->right, depth + 1, toRight, height, answer);
          }
        `,
        csharp: code`
          public static int[] TreeQueries(TreeNode root, int[] queries)
          {
              var height = new Dictionary<int, int>();
              var answer = new Dictionary<int, int>();
              Measure(root, height);
              Fill(root, 0, 0, height, answer);
              return queries.Select(q => answer[q]).ToArray();
          }

          static int Measure(TreeNode node, Dictionary<int, int> height)
          {
              if (node == null) return -1;
              int h = 1 + Math.Max(Measure(node.left, height), Measure(node.right, height));
              height[node.val] = h;
              return h;
          }

          static void Fill(TreeNode node, int depth, int rest, Dictionary<int, int> height, Dictionary<int, int> answer)
          {
              if (node == null) return;
              answer[node.val] = rest;
              int hl = node.left == null ? -1 : height[node.left.val];
              int hr = node.right == null ? -1 : height[node.right.val];
              Fill(node.left, depth + 1, Math.Max(rest, depth + 1 + hr), height, answer);
              Fill(node.right, depth + 1, Math.Max(rest, depth + 1 + hl), height, answer);
          }
        `,
        go: code`
          func treeQueries(root *TreeNode, queries []int) []int {
              height, answer := map[int]int{}, map[int]int{}
              var measure func(node *TreeNode) int
              measure = func(node *TreeNode) int {
                  if node == nil {
                      return -1
                  }
                  l, r := measure(node.Left), measure(node.Right)
                  if r > l {
                      l = r
                  }
                  height[node.Val] = l + 1
                  return l + 1
              }
              hOf := func(node *TreeNode) int {
                  if node == nil {
                      return -1
                  }
                  return height[node.Val]
              }
              var fill func(node *TreeNode, depth, rest int)
              fill = func(node *TreeNode, depth, rest int) {
                  if node == nil {
                      return
                  }
                  answer[node.Val] = rest
                  toLeft, toRight := rest, rest
                  if depth+1+hOf(node.Right) > toLeft {
                      toLeft = depth + 1 + hOf(node.Right)
                  }
                  if depth+1+hOf(node.Left) > toRight {
                      toRight = depth + 1 + hOf(node.Left)
                  }
                  fill(node.Left, depth+1, toLeft)
                  fill(node.Right, depth+1, toRight)
              }
              measure(root)
              fill(root, 0, 0)
              res := make([]int, len(queries))
              for i, q := range queries {
                  res[i] = answer[q]
              }
              return res
          }
        `,
        kotlin: kt`
          fun treeQueries(root: TreeNode?, queries: IntArray): IntArray {
              val height = HashMap<Int, Int>()
              val answer = HashMap<Int, Int>()
              fun measure(node: TreeNode?): Int {
                  if (node == null) return -1
                  val h = 1 + maxOf(measure(node.left), measure(node.right))
                  height[node.\`val\`] = h
                  return h
              }
              fun hOf(node: TreeNode?): Int = if (node == null) -1 else height[node.\`val\`]!!
              fun fill(node: TreeNode?, depth: Int, rest: Int) {
                  if (node == null) return
                  answer[node.\`val\`] = rest
                  fill(node.left, depth + 1, maxOf(rest, depth + 1 + hOf(node.right)))
                  fill(node.right, depth + 1, maxOf(rest, depth + 1 + hOf(node.left)))
              }
              measure(root)
              fill(root, 0, 0)
              return IntArray(queries.size) { answer[queries[it]]!! }
          }
        `,
        swift: code`
          func treeQueries(_ root: TreeNode?, _ queries: [Int]) -> [Int] {
              var height: [Int: Int] = [:]
              var answer: [Int: Int] = [:]
              func measure(_ node: TreeNode?) -> Int {
                  guard let n = node else { return -1 }
                  let h = 1 + max(measure(n.left), measure(n.right))
                  height[n.val] = h
                  return h
              }
              func hOf(_ node: TreeNode?) -> Int {
                  guard let n = node else { return -1 }
                  return height[n.val]!
              }
              func fill(_ node: TreeNode?, _ depth: Int, _ rest: Int) {
                  guard let n = node else { return }
                  answer[n.val] = rest
                  fill(n.left, depth + 1, max(rest, depth + 1 + hOf(n.right)))
                  fill(n.right, depth + 1, max(rest, depth + 1 + hOf(n.left)))
              }
              _ = measure(root)
              fill(root, 0, 0)
              return queries.map { answer[$0]! }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn treeQueries(root: Option<Rc<RefCell<TreeNode>>>, queries: Vec<i32>) -> Vec<i32> {
              fn measure(node: &Option<Rc<RefCell<TreeNode>>>, height: &mut HashMap<i32, i32>) -> i32 {
                  match node {
                      None => -1,
                      Some(n) => {
                          let n = n.borrow();
                          let h = 1 + measure(&n.left, height).max(measure(&n.right, height));
                          height.insert(n.val, h);
                          h
                      }
                  }
              }
              fn h_of(node: &Option<Rc<RefCell<TreeNode>>>, height: &HashMap<i32, i32>) -> i32 {
                  match node {
                      None => -1,
                      Some(n) => height[&n.borrow().val],
                  }
              }
              fn fill(node: &Option<Rc<RefCell<TreeNode>>>, depth: i32, rest: i32, height: &HashMap<i32, i32>, answer: &mut HashMap<i32, i32>) {
                  if let Some(n) = node {
                      let n = n.borrow();
                      answer.insert(n.val, rest);
                      fill(&n.left, depth + 1, rest.max(depth + 1 + h_of(&n.right, height)), height, answer);
                      fill(&n.right, depth + 1, rest.max(depth + 1 + h_of(&n.left, height)), height, answer);
                  }
              }
              let mut height = HashMap::new();
              let mut answer = HashMap::new();
              measure(&root, &mut height);
              fill(&root, 0, 0, &height, &mut answer);
              queries.iter().map(|q| answer[q]).collect()
          }
        `,
        php: code`
          function treeQueries($root, $queries) {
              $height = [];
              $answer = [];
              $measure = function ($node) use (&$measure, &$height) {
                  if ($node === null) return -1;
                  $h = 1 + max($measure($node->left), $measure($node->right));
                  $height[$node->val] = $h;
                  return $h;
              };
              $hOf = function ($node) use (&$height) {
                  return $node === null ? -1 : $height[$node->val];
              };
              $fill = function ($node, $depth, $rest) use (&$fill, &$answer, $hOf) {
                  if ($node === null) return;
                  $answer[$node->val] = $rest;
                  $fill($node->left, $depth + 1, max($rest, $depth + 1 + $hOf($node->right)));
                  $fill($node->right, $depth + 1, max($rest, $depth + 1 + $hOf($node->left)));
              };
              $measure($root);
              $fill($root, 0, 0);
              $res = [];
              foreach ($queries as $q) $res[] = $answer[$q];
              return $res;
          }
        `,
        ruby: code`
          def treeQueries(root, queries)
            height = {}
            answer = {}
            measure = lambda do |node|
              return -1 if node.nil?
              h = 1 + [measure.call(node.left), measure.call(node.right)].max
              height[node.val] = h
              h
            end
            h_of = lambda { |node| node.nil? ? -1 : height[node.val] }
            fill = lambda do |node, depth, rest|
              return if node.nil?
              answer[node.val] = rest
              fill.call(node.left, depth + 1, [rest, depth + 1 + h_of.call(node.right)].max)
              fill.call(node.right, depth + 1, [rest, depth + 1 + h_of.call(node.left)].max)
            end
            measure.call(root)
            fill.call(root, 0, 0)
            queries.map { |q| answer[q] }
          end
        `,
      },
    };
  })(),

  // ── Maximum Path Sum Between Two Leaves (GFG) ───────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const { nodes, adj } = graphOf(root);
      const special = nodes.map((_, i) => adj[i].length === 1);
      let best = -Infinity;
      for (let s = 0; s < nodes.length; s++) {
        if (!special[s]) continue;
        const sums = pathSumsFrom(nodes, adj, s);
        for (let t = 0; t < nodes.length; t++) if (t !== s && special[t]) best = Math.max(best, sums[t]);
      }
      return best;
    };
    return {
      slug: "maximum-path-sum-between-two-leaves",
      title: "Maximum Path Sum Between Two Leaves",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "maxPathSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree with at least two nodes, call a node **special** when it is joined by an edge to exactly one other node. Every leaf is special; so is the root when it has only one child.\n\nReturn the **largest sum of node values** on a path that starts at one special node and ends at a **different** special node. Both ends count towards the sum.",
        [
          { in: "root = [3,4,5,-10,4]", out: "16", note: "The leaves are -10, 4 (under 4) and 5. The path 4 → 4 → 3 → 5 adds up to 16." },
          { in: "root = [-15,5,6,-8,1,3,9,2,-3,null,null,null,null,null,0,null,null,null,null,4,-1,null,null,10]", out: "27", note: "The best path runs from leaf 3 up through 6 and down 9 → 0 → -1 → 10: 3 + 6 + 9 + 0 + (-1) + 10 = 27." },
          { in: "root = [10,-3,null,4,5]", out: "12", note: "The root has a single child, so it is special too: 10 → -3 → 5 gives 12." },
        ],
        ["2 <= number of nodes <= 10^4", "-10^3 <= Node.val <= 10^3"]),
      hints: [
        "Every path between two leaves turns around at exactly one node — the one closest to the root. That node has a leaf below it on both sides.",
        "For each node compute the best sum of a path going down from it to a leaf. A node with two children can be the turning point: left best + right best + its value.",
        "A node with only one child cannot be a turning point; it just extends its child's best downward path. Handle the root separately: with one child it is itself an end, so pair it with the best downward path below it.",
      ],
      editorial: explain({
        idea: "A leaf-to-leaf path climbs from one leaf to a turning node and descends to another leaf in its other subtree. So compute, for every node, the best root-to-leaf sum of its subtree going down; a node with two children combines both sides, and the root, when it has one child, is a leaf-like end of its own.",
        steps: [
          "Let `down(node)` be the best sum of a path from `node` down to a leaf below it (the node itself if it is a leaf).",
          "For a leaf, return its value.",
          "For a node with two children: `l = down(left)`, `r = down(right)`; update the answer with `l + r + node.val` and return `max(l, r) + node.val`.",
          "For a node with one child, return `down(child) + node.val` — it cannot be an endpoint or a turning point.",
          "Call `down(root)`. If the root has exactly one child, the root is special too: update the answer with `down(root)` itself, a path from the root to a leaf.",
        ],
        why: "Every valid path has a highest node. If both ends are below it, it has two children and the path is the best leaf path on each side — which `l + r + val` takes. Otherwise one end is the highest node itself; that can only happen at the root with one child, and the best such path is `down(root)`. A downward path must end at a leaf, so a one-child node passes its only option up unchanged.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Clamping negative branches to 0 (as in the any-to-any path problem) is wrong here — both ends must be special nodes.",
          "A node with one child is not a turning point: using it with an empty side would end a path at a non-special node.",
          "Forgetting the single-child root misses paths that start at the root.",
        ],
      }),
      examples: [
        { input: "[3,4,5,-10,4]", expectedOutput: "16" },
        { input: "[-15,5,6,-8,1,3,9,2,-3,null,null,null,null,null,0,null,null,null,null,4,-1,null,null,10]", expectedOutput: "27" },
        { input: "[10,-3,null,4,5]", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[-10, 10], [-1000, 1000], [-1000, -1], [0, 1000], [-20, 5]]);
        const root = randTree(rng, Math.max(2, treeSize(rng)), lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxPathSum(root: Optional[TreeNode]) -> int:
              best = [float('-inf')]

              def down(node):
                  if node.left is None and node.right is None:
                      return node.val
                  if node.left is not None and node.right is not None:
                      l, r = down(node.left), down(node.right)
                      best[0] = max(best[0], l + r + node.val)
                      return max(l, r) + node.val
                  return down(node.left if node.left is not None else node.right) + node.val

              top = down(root)
              if root.left is None or root.right is None:
                  best[0] = max(best[0], top)  # the root is special too
              return best[0]
        `,
        javascript: code`
          var maxPathSum = function(root) {
              var best = -Infinity;
              var down = function(node) {
                  if (node.left === null && node.right === null) return node.val;
                  if (node.left !== null && node.right !== null) {
                      var l = down(node.left), r = down(node.right);
                      best = Math.max(best, l + r + node.val);
                      return Math.max(l, r) + node.val;
                  }
                  return down(node.left !== null ? node.left : node.right) + node.val;
              };
              var top = down(root);
              if (root.left === null || root.right === null) best = Math.max(best, top); // the root is special too
              return best;
          };
        `,
        typescript: code`
          function maxPathSum(root: TreeNode | null): number {
              var best = -Infinity;
              function down(node: TreeNode): number {
                  if (node.left === null && node.right === null) return node.val;
                  if (node.left !== null && node.right !== null) {
                      var l = down(node.left), r = down(node.right);
                      best = Math.max(best, l + r + node.val);
                      return Math.max(l, r) + node.val;
                  }
                  return down(node.left !== null ? node.left : node.right) + node.val;
              }
              var top = down(root);
              if (root.left === null || root.right === null) best = Math.max(best, top); // the root is special too
              return best;
          }
        `,
        java: code`
          public static int maxPathSum(TreeNode root) {
              int[] best = { Integer.MIN_VALUE };
              int top = leafDown(root, best);
              if (root.left == null || root.right == null) best[0] = Math.max(best[0], top); // the root is special too
              return best[0];
          }

          static int leafDown(TreeNode node, int[] best) {
              if (node.left == null && node.right == null) return node.val;
              if (node.left != null && node.right != null) {
                  int l = leafDown(node.left, best), r = leafDown(node.right, best);
                  best[0] = Math.max(best[0], l + r + node.val);
                  return Math.max(l, r) + node.val;
              }
              return leafDown(node.left != null ? node.left : node.right, best) + node.val;
          }
        `,
        cpp: code`
          int maxPathSum(TreeNode* root) {
              int best = INT_MIN;
              function<int(TreeNode*)> down = [&](TreeNode* node) -> int {
                  if (!node->left && !node->right) return node->val;
                  if (node->left && node->right) {
                      int l = down(node->left), r = down(node->right);
                      best = max(best, l + r + node->val);
                      return max(l, r) + node->val;
                  }
                  return down(node->left ? node->left : node->right) + node->val;
              };
              int top = down(root);
              if (!root->left || !root->right) best = max(best, top); // the root is special too
              return best;
          }
        `,
        c: code`
          static int leafDown(struct TreeNode* node, int* best);

          int maxPathSum(struct TreeNode* root) {
              int best = -2147483647 - 1;
              int top = leafDown(root, &best);
              if ((root->left == NULL || root->right == NULL) && top > best) best = top; /* the root is special too */
              return best;
          }

          static int leafDown(struct TreeNode* node, int* best) {
              if (node->left == NULL && node->right == NULL) return node->val;
              if (node->left != NULL && node->right != NULL) {
                  int l = leafDown(node->left, best), r = leafDown(node->right, best);
                  if (l + r + node->val > *best) *best = l + r + node->val;
                  return (l > r ? l : r) + node->val;
              }
              return leafDown(node->left != NULL ? node->left : node->right, best) + node->val;
          }
        `,
        csharp: code`
          public static int MaxPathSum(TreeNode root)
          {
              int best = int.MinValue;
              int top = LeafDown(root, ref best);
              if (root.left == null || root.right == null) best = Math.Max(best, top); // the root is special too
              return best;
          }

          static int LeafDown(TreeNode node, ref int best)
          {
              if (node.left == null && node.right == null) return node.val;
              if (node.left != null && node.right != null)
              {
                  int l = LeafDown(node.left, ref best), r = LeafDown(node.right, ref best);
                  best = Math.Max(best, l + r + node.val);
                  return Math.Max(l, r) + node.val;
              }
              return LeafDown(node.left ?? node.right, ref best) + node.val;
          }
        `,
        go: code`
          func maxPathSum(root *TreeNode) int {
              best := -(1 << 31)
              var down func(node *TreeNode) int
              down = func(node *TreeNode) int {
                  if node.Left == nil && node.Right == nil {
                      return node.Val
                  }
                  if node.Left != nil && node.Right != nil {
                      l, r := down(node.Left), down(node.Right)
                      if l+r+node.Val > best {
                          best = l + r + node.Val
                      }
                      if r > l {
                          l = r
                      }
                      return l + node.Val
                  }
                  if node.Left != nil {
                      return down(node.Left) + node.Val
                  }
                  return down(node.Right) + node.Val
              }
              top := down(root)
              if (root.Left == nil || root.Right == nil) && top > best {
                  best = top // the root is special too
              }
              return best
          }
        `,
        kotlin: kt`
          fun maxPathSum(root: TreeNode?): Int {
              var best = Int.MIN_VALUE
              fun down(node: TreeNode): Int {
                  val l = node.left
                  val r = node.right
                  if (l == null && r == null) return node.\`val\`
                  if (l != null && r != null) {
                      val a = down(l)
                      val b = down(r)
                      best = maxOf(best, a + b + node.\`val\`)
                      return maxOf(a, b) + node.\`val\`
                  }
                  return down(l ?: r!!) + node.\`val\`
              }
              val top = down(root!!)
              if (root.left == null || root.right == null) best = maxOf(best, top) // the root is special too
              return best
          }
        `,
        swift: code`
          func maxPathSum(_ root: TreeNode?) -> Int {
              var best = Int.min
              func down(_ node: TreeNode) -> Int {
                  if node.left == nil && node.right == nil { return node.val }
                  if let l = node.left, let r = node.right {
                      let a = down(l), b = down(r)
                      best = max(best, a + b + node.val)
                      return max(a, b) + node.val
                  }
                  return down(node.left ?? node.right!) + node.val
              }
              let r = root!
              let top = down(r)
              if r.left == nil || r.right == nil { best = max(best, top) } // the root is special too
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxPathSum(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              fn down(node: &Rc<RefCell<TreeNode>>, best: &mut i32) -> i32 {
                  let n = node.borrow();
                  match (&n.left, &n.right) {
                      (None, None) => n.val,
                      (Some(l), Some(r)) => {
                          let a = down(l, best);
                          let b = down(r, best);
                          *best = (*best).max(a + b + n.val);
                          a.max(b) + n.val
                      }
                      (Some(c), None) | (None, Some(c)) => down(c, best) + n.val,
                  }
              }
              let r = root.unwrap();
              let mut best = std::i32::MIN;
              let top = down(&r, &mut best);
              let one_child = r.borrow().left.is_none() || r.borrow().right.is_none();
              if one_child {
                  best = best.max(top); // the root is special too
              }
              best
          }
        `,
        php: code`
          function maxPathSum($root) {
              $best = PHP_INT_MIN;
              $down = function ($node) use (&$down, &$best) {
                  if ($node->left === null && $node->right === null) return $node->val;
                  if ($node->left !== null && $node->right !== null) {
                      $l = $down($node->left);
                      $r = $down($node->right);
                      $best = max($best, $l + $r + $node->val);
                      return max($l, $r) + $node->val;
                  }
                  return $down($node->left !== null ? $node->left : $node->right) + $node->val;
              };
              $top = $down($root);
              if ($root->left === null || $root->right === null) $best = max($best, $top); // the root is special too
              return $best;
          }
        `,
        ruby: code`
          def maxPathSum(root)
            best = -Float::INFINITY
            down = lambda do |node|
              return node.val if node.left.nil? && node.right.nil?
              if node.left && node.right
                l = down.call(node.left)
                r = down.call(node.right)
                best = l + r + node.val if l + r + node.val > best
                return [l, r].max + node.val
              end
              down.call(node.left || node.right) + node.val
            end
            top = down.call(root)
            best = top if (root.left.nil? || root.right.nil?) && top > best # the root is special too
            best
          end
        `,
      },
    };
  })(),

  // ── Merge Two Sorted Lists (LC 21) ──────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => a.concat(b).sort((x, y) => x - y);
    const sortedList = (rng: Rng) => Array.from({ length: listLen(rng) }, () => ri(rng, -100, 100)).sort((x, y) => x - y);
    return {
      slug: "merge-two-sorted-lists",
      title: "Merge Two Sorted Lists",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Recursion", "Two Pointers", "Amazon", "Microsoft", "Apple", "Adobe"],
      signature: { funcName: "mergeTwoLists", params: [{ name: "list1", type: "ListNode" as const }, { name: "list2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the heads of two singly linked lists, `list1` and `list2`, each sorted in **non-decreasing** order.\n\nJoin them into one sorted list by relinking the nodes of the two lists (no new values are created), and return the head of the merged list.",
        [
          { in: "list1 = [1,2,4], list2 = [1,3,4]", out: "[1,1,2,3,4,4]" },
          { in: "list1 = [], list2 = []", out: "[]", note: "Two empty lists merge into an empty list." },
          { in: "list1 = [], list2 = [0]", out: "[0]" },
        ],
        ["The number of nodes in both lists is in the range [0, 50]", "-100 <= Node.val <= 100", "Both list1 and list2 are sorted in non-decreasing order"]),
      hints: [
        "The smallest value of the merged list is the smaller of the two heads.",
        "Repeatedly take the smaller head, append it to the result, and advance that list.",
        "A dummy node in front of the result removes the special case for the first node; when one list runs out, attach the rest of the other in one step.",
      ],
      editorial: explain({
        idea: "The merged list is built front to back by always taking the smaller of the two current heads — the merge step of merge sort, done on links instead of array slots.",
        steps: [
          "Create a dummy node and a `tail` pointer at it.",
          "While both lists are non-empty, compare their heads; link the smaller one after `tail`, advance that list and move `tail` forward.",
          "When one list is exhausted, link the remainder of the other after `tail` — it is already sorted.",
          "Return `dummy.next`.",
        ],
        why: "At every step the chosen node is no larger than any node not yet taken, because both lists are sorted and we compare their smallest remaining elements. So the output is sorted and contains every node exactly once.",
        time: "O(n + m)",
        space: "O(1) — only links change",
        pitfalls: [
          "Either input may be empty; the dummy node handles both without special code.",
          "Take from `list1` on ties (`<=`) — any choice is sorted, but be consistent.",
          "Do not forget the leftover tail after the loop.",
        ],
      }),
      examples: [
        { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]" },
        { input: "[]\n[]", expectedOutput: "[]" },
        { input: "[]\n[0]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const a = sortedList(rng), b = sortedList(rng);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def mergeTwoLists(list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0)
              tail = dummy
              while list1 and list2:
                  if list1.val <= list2.val:
                      tail.next, list1 = list1, list1.next
                  else:
                      tail.next, list2 = list2, list2.next
                  tail = tail.next
              tail.next = list1 if list1 else list2
              return dummy.next
        `,
        javascript: code`
          var mergeTwoLists = function(list1, list2) {
              var dummy = new ListNode(0), tail = dummy;
              while (list1 !== null && list2 !== null) {
                  if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
                  else { tail.next = list2; list2 = list2.next; }
                  tail = tail.next;
              }
              tail.next = list1 !== null ? list1 : list2;
              return dummy.next;
          };
        `,
        typescript: code`
          function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
              var dummy = new ListNode(0), tail = dummy;
              while (list1 !== null && list2 !== null) {
                  if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
                  else { tail.next = list2; list2 = list2.next; }
                  tail = tail.next;
              }
              tail.next = list1 !== null ? list1 : list2;
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode mergeTwoLists(ListNode list1, ListNode list2) {
              ListNode dummy = new ListNode(0), tail = dummy;
              while (list1 != null && list2 != null) {
                  if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
                  else { tail.next = list2; list2 = list2.next; }
                  tail = tail.next;
              }
              tail.next = list1 != null ? list1 : list2;
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
              ListNode dummy(0);
              ListNode* tail = &dummy;
              while (list1 && list2) {
                  if (list1->val <= list2->val) { tail->next = list1; list1 = list1->next; }
                  else { tail->next = list2; list2 = list2->next; }
                  tail = tail->next;
              }
              tail->next = list1 ? list1 : list2;
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {
              struct ListNode dummy;
              struct ListNode* tail = &dummy;
              dummy.next = NULL;
              while (list1 != NULL && list2 != NULL) {
                  if (list1->val <= list2->val) { tail->next = list1; list1 = list1->next; }
                  else { tail->next = list2; list2 = list2->next; }
                  tail = tail->next;
              }
              tail->next = list1 != NULL ? list1 : list2;
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode MergeTwoLists(ListNode list1, ListNode list2)
          {
              var dummy = new ListNode(0);
              var tail = dummy;
              while (list1 != null && list2 != null)
              {
                  if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
                  else { tail.next = list2; list2 = list2.next; }
                  tail = tail.next;
              }
              tail.next = list1 ?? list2;
              return dummy.next;
          }
        `,
        go: code`
          func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
              dummy := &ListNode{}
              tail := dummy
              for list1 != nil && list2 != nil {
                  if list1.Val <= list2.Val {
                      tail.Next, list1 = list1, list1.Next
                  } else {
                      tail.Next, list2 = list2, list2.Next
                  }
                  tail = tail.Next
              }
              if list1 != nil {
                  tail.Next = list1
              } else {
                  tail.Next = list2
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun mergeTwoLists(list1: ListNode?, list2: ListNode?): ListNode? {
              var a = list1
              var b = list2
              val dummy = ListNode(0)
              var tail = dummy
              while (a != null && b != null) {
                  if (a.\`val\` <= b.\`val\`) { tail.next = a; tail = a; a = a.next }
                  else { tail.next = b; tail = b; b = b.next }
              }
              tail.next = a ?: b
              return dummy.next
          }
        `,
        swift: code`
          func mergeTwoLists(_ list1: ListNode?, _ list2: ListNode?) -> ListNode? {
              var a = list1, b = list2
              let dummy = ListNode(0)
              var tail = dummy
              while let x = a, let y = b {
                  if x.val <= y.val { tail.next = x; tail = x; a = x.next }
                  else { tail.next = y; tail = y; b = y.next }
              }
              tail.next = a ?? b
              return dummy.next
          }
        `,
        rust: code`
          fn mergeTwoLists(list1: Option<Box<ListNode>>, list2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              match (list1, list2) {
                  (None, rest) | (rest, None) => rest,
                  (Some(mut a), Some(mut b)) => {
                      if a.val <= b.val {
                          a.next = mergeTwoLists(a.next.take(), Some(b));
                          Some(a)
                      } else {
                          b.next = mergeTwoLists(Some(a), b.next.take());
                          Some(b)
                      }
                  }
              }
          }
        `,
        php: code`
          function mergeTwoLists($list1, $list2) {
              $dummy = new ListNode(0);
              $tail = $dummy;
              while ($list1 !== null && $list2 !== null) {
                  if ($list1->val <= $list2->val) { $tail->next = $list1; $list1 = $list1->next; }
                  else { $tail->next = $list2; $list2 = $list2->next; }
                  $tail = $tail->next;
              }
              $tail->next = $list1 !== null ? $list1 : $list2;
              return $dummy->next;
          }
        `,
        ruby: code`
          def mergeTwoLists(list1, list2)
            dummy = ListNode.new(0)
            tail = dummy
            while list1 && list2
              if list1.val <= list2.val
                tail.next = list1
                list1 = list1.next
              else
                tail.next = list2
                list2 = list2.next
              end
              tail = tail.next
            end
            tail.next = list1 || list2
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Remove Duplicates from Sorted List (LC 83) ──────────────────
  (() => {
    const ref = (a: number[]) => a.filter((v, i) => i === 0 || v !== a[i - 1]);
    return {
      slug: "remove-duplicates-from-sorted-list",
      title: "Remove Duplicates from Sorted List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "deleteDuplicates", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list sorted in **non-decreasing** order. Delete nodes so that every value appears **exactly once**, and return the head of the list, which stays sorted.",
        [
          { in: "head = [1,1,2]", out: "[1,2]" },
          { in: "head = [1,1,2,3,3]", out: "[1,2,3]", note: "One node of each value is kept; the list is still sorted." },
          { in: "head = []", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 300]", "-100 <= Node.val <= 100", "The list is sorted in non-decreasing order"]),
      hints: [
        "In a sorted list, equal values sit next to each other.",
        "Walk the list once, comparing each node with the node after it.",
        "When the next node has the same value, unlink it (`cur.next = cur.next.next`) and stay put; otherwise move on.",
      ],
      editorial: explain({
        idea: "Sorting puts all copies of a value in one consecutive run, so a duplicate is always the immediate successor of a node with the same value. Unlinking such successors in a single pass leaves one node per run.",
        steps: [
          "Set `cur = head`.",
          "While `cur` and `cur.next` exist: if `cur.next.val == cur.val`, skip it with `cur.next = cur.next.next`; otherwise advance `cur = cur.next`.",
          "Return `head`.",
        ],
        why: "`cur` only advances to a node with a new value, and before it does, every following node equal to `cur` has been unlinked. So each run collapses to its first node and nothing else is removed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Do not advance `cur` after removing a duplicate — the new `cur.next` may be another copy.",
          "Handle the empty list: the loop must not touch `head.next` when `head` is null.",
        ],
      }),
      examples: [
        { input: "[1,1,2]", expectedOutput: "[1,2]" },
        { input: "[1,1,2,3,3]", expectedOutput: "[1,2,3]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [0, 2, 5, 100]);
        const a = Array.from({ length: listLen(rng) }, () => ri(rng, -span, span)).sort((x, y) => x - y);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteDuplicates(head: Optional[ListNode]) -> Optional[ListNode]:
              cur = head
              while cur and cur.next:
                  if cur.next.val == cur.val:
                      cur.next = cur.next.next
                  else:
                      cur = cur.next
              return head
        `,
        javascript: code`
          var deleteDuplicates = function(head) {
              var cur = head;
              while (cur !== null && cur.next !== null) {
                  if (cur.next.val === cur.val) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return head;
          };
        `,
        typescript: code`
          function deleteDuplicates(head: ListNode | null): ListNode | null {
              var cur = head;
              while (cur !== null && cur.next !== null) {
                  if (cur.next.val === cur.val) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode deleteDuplicates(ListNode head) {
              ListNode cur = head;
              while (cur != null && cur.next != null) {
                  if (cur.next.val == cur.val) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* deleteDuplicates(ListNode* head) {
              ListNode* cur = head;
              while (cur && cur->next) {
                  if (cur->next->val == cur->val) cur->next = cur->next->next;
                  else cur = cur->next;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* deleteDuplicates(struct ListNode* head) {
              struct ListNode* cur = head;
              while (cur != NULL && cur->next != NULL) {
                  if (cur->next->val == cur->val) {
                      struct ListNode* dup = cur->next;
                      cur->next = dup->next;
                      free(dup);
                  } else {
                      cur = cur->next;
                  }
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode DeleteDuplicates(ListNode head)
          {
              var cur = head;
              while (cur != null && cur.next != null)
              {
                  if (cur.next.val == cur.val) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return head;
          }
        `,
        go: code`
          func deleteDuplicates(head *ListNode) *ListNode {
              cur := head
              for cur != nil && cur.Next != nil {
                  if cur.Next.Val == cur.Val {
                      cur.Next = cur.Next.Next
                  } else {
                      cur = cur.Next
                  }
              }
              return head
          }
        `,
        kotlin: kt`
          fun deleteDuplicates(head: ListNode?): ListNode? {
              var cur = head
              while (cur?.next != null) {
                  val nx = cur.next!!
                  if (nx.\`val\` == cur.\`val\`) cur.next = nx.next else cur = nx
              }
              return head
          }
        `,
        swift: code`
          func deleteDuplicates(_ head: ListNode?) -> ListNode? {
              var cur = head
              while let c = cur, let nx = c.next {
                  if nx.val == c.val { c.next = nx.next } else { cur = nx }
              }
              return head
          }
        `,
        rust: code`
          fn deleteDuplicates(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut last: Option<i32> = None;
              let mut cur = &mut head;
              while cur.is_some() {
                  let v = cur.as_ref().unwrap().val;
                  if last == Some(v) {
                      let next = cur.as_mut().unwrap().next.take();
                      *cur = next;
                  } else {
                      last = Some(v);
                      cur = &mut cur.as_mut().unwrap().next;
                  }
              }
              head
          }
        `,
        php: code`
          function deleteDuplicates($head) {
              $cur = $head;
              while ($cur !== null && $cur->next !== null) {
                  if ($cur->next->val === $cur->val) $cur->next = $cur->next->next;
                  else $cur = $cur->next;
              }
              return $head;
          }
        `,
        ruby: code`
          def deleteDuplicates(head)
            cur = head
            while cur && cur.next
              if cur.next.val == cur.val
                cur.next = cur.next.next
              else
                cur = cur.next
              end
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Remove Linked List Elements (LC 203) ────────────────────────
  (() => {
    const ref = (a: number[], v: number) => a.filter((x) => x !== v);
    return {
      slug: "remove-linked-list-elements",
      title: "Remove Linked List Elements",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "removeElements", params: [{ name: "head", type: "ListNode" as const }, { name: "value", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and an integer `value`, remove **every** node whose value equals `value`, and return the head of the resulting list.",
        [
          { in: "head = [1,2,6,3,4,5,6], value = 6", out: "[1,2,3,4,5]" },
          { in: "head = [], value = 1", out: "[]" },
          { in: "head = [7,7,7,7], value = 7", out: "[]", note: "Every node goes, including the head — the answer is the empty list." },
        ],
        ["The number of nodes in the list is in the range [0, 10^4]", "1 <= Node.val <= 50", "0 <= value <= 50"]),
      hints: [
        "Removing a node means pointing its predecessor past it — but the head has no predecessor.",
        "Put a dummy node in front of the head, so every real node has one.",
        "Walk with `cur` starting at the dummy: if `cur.next` must go, skip it and stay; otherwise step forward. Return `dummy.next`.",
      ],
      editorial: explain({
        idea: "Deleting from a singly linked list is done from the predecessor. A dummy node before the head gives every node a predecessor, so leading matches need no special case.",
        steps: [
          "Create `dummy` with `dummy.next = head` and set `cur = dummy`.",
          "While `cur.next` exists: if `cur.next.val == value`, set `cur.next = cur.next.next`; otherwise move `cur = cur.next`.",
          "Return `dummy.next`.",
        ],
        why: "`cur` always points at a node that is kept (the dummy or a non-matching node), and each matching successor is unlinked before `cur` moves on. Every node is examined exactly once as `cur.next`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Returning `head` instead of `dummy.next` is wrong when the head itself is removed.",
          "After unlinking, do not advance — consecutive matches would be skipped.",
        ],
      }),
      examples: [
        { input: "[1,2,6,3,4,5,6]\n6", expectedOutput: "[1,2,3,4,5]" },
        { input: "[]\n1", expectedOutput: "[]" },
        { input: "[7,7,7,7]\n7", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [1, 3, 8, 50]);
        const a = Array.from({ length: listLen(rng) }, () => ri(rng, 1, top));
        const v = rng() < 0.8 ? ri(rng, 1, top) : ri(rng, 0, 50);
        return { input: `${fmtIntArr(a)}\n${v}`, expectedOutput: fmtIntArr(ref(a, v)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def removeElements(head: Optional[ListNode], value: int) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              cur = dummy
              while cur.next:
                  if cur.next.val == value:
                      cur.next = cur.next.next
                  else:
                      cur = cur.next
              return dummy.next
        `,
        javascript: code`
          var removeElements = function(head, value) {
              var dummy = new ListNode(0, head), cur = dummy;
              while (cur.next !== null) {
                  if (cur.next.val === value) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function removeElements(head: ListNode | null, value: number): ListNode | null {
              var dummy = new ListNode(0, head), cur = dummy;
              while (cur.next !== null) {
                  if (cur.next.val === value) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode removeElements(ListNode head, int value) {
              ListNode dummy = new ListNode(0, head), cur = dummy;
              while (cur.next != null) {
                  if (cur.next.val == value) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* removeElements(ListNode* head, int value) {
              ListNode dummy(0, head);
              ListNode* cur = &dummy;
              while (cur->next) {
                  if (cur->next->val == value) cur->next = cur->next->next;
                  else cur = cur->next;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* removeElements(struct ListNode* head, int value) {
              struct ListNode dummy;
              dummy.next = head;
              struct ListNode* cur = &dummy;
              while (cur->next != NULL) {
                  if (cur->next->val == value) {
                      struct ListNode* gone = cur->next;
                      cur->next = gone->next;
                      free(gone);
                  } else {
                      cur = cur->next;
                  }
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode RemoveElements(ListNode head, int value)
          {
              var dummy = new ListNode(0, head);
              var cur = dummy;
              while (cur.next != null)
              {
                  if (cur.next.val == value) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        go: code`
          func removeElements(head *ListNode, value int) *ListNode {
              dummy := &ListNode{Next: head}
              cur := dummy
              for cur.Next != nil {
                  if cur.Next.Val == value {
                      cur.Next = cur.Next.Next
                  } else {
                      cur = cur.Next
                  }
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun removeElements(head: ListNode?, value: Int): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var cur = dummy
              while (cur.next != null) {
                  val nx = cur.next!!
                  if (nx.\`val\` == value) cur.next = nx.next else cur = nx
              }
              return dummy.next
          }
        `,
        swift: code`
          func removeElements(_ head: ListNode?, _ value: Int) -> ListNode? {
              let dummy = ListNode(0)
              dummy.next = head
              var cur = dummy
              while let nx = cur.next {
                  if nx.val == value { cur.next = nx.next } else { cur = nx }
              }
              return dummy.next
          }
        `,
        rust: code`
          fn removeElements(head: Option<Box<ListNode>>, value: i32) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut cur = &mut head;
              while cur.is_some() {
                  if cur.as_ref().unwrap().val == value {
                      let next = cur.as_mut().unwrap().next.take();
                      *cur = next;
                  } else {
                      cur = &mut cur.as_mut().unwrap().next;
                  }
              }
              head
          }
        `,
        php: code`
          function removeElements($head, $value) {
              $dummy = new ListNode(0, $head);
              $cur = $dummy;
              while ($cur->next !== null) {
                  if ($cur->next->val === $value) $cur->next = $cur->next->next;
                  else $cur = $cur->next;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def removeElements(head, value)
            dummy = ListNode.new(0, head)
            cur = dummy
            while cur.next
              if cur.next.val == value
                cur.next = cur.next.next
              else
                cur = cur.next
              end
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Reverse Linked List (LC 206) ────────────────────────────────
  (() => {
    const ref = (a: number[]) => a.slice().reverse();
    return {
      slug: "reverse-linked-list",
      title: "Reverse Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Recursion", "Amazon", "Microsoft", "Apple", "Adobe"],
      signature: { funcName: "reverseList", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, reverse the list in place and return the head of the reversed list.",
        [
          { in: "head = [1,2,3,4,5]", out: "[5,4,3,2,1]" },
          { in: "head = [1,2]", out: "[2,1]" },
          { in: "head = []", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 5000]", "-5000 <= Node.val <= 5000"],
        "A linked list can be reversed either iteratively or recursively. Could you do both?"),
      hints: [
        "Reversing means every `next` pointer should point at the node that used to come before it.",
        "Walk the list keeping two pointers: `prev` (already reversed part) and `cur` (the rest).",
        "Save `cur.next` before overwriting it with `prev`, then shift both pointers one step. At the end `prev` is the new head.",
      ],
      editorial: explain({
        idea: "Turn each arrow around as you pass it. Keeping the already reversed prefix in `prev` and the untouched suffix in `cur`, one node moves from the suffix to the front of the prefix per step.",
        steps: [
          "Set `prev = null`, `cur = head`.",
          "While `cur` is not null: remember `next = cur.next`; set `cur.next = prev`; then `prev = cur`, `cur = next`.",
          "Return `prev`.",
        ],
        why: "Invariant: `prev` heads the reversal of the nodes visited so far and `cur` heads the nodes not yet visited, in their original order. Each step moves one node from `cur` to the front of `prev`, preserving it; when `cur` is empty, `prev` is the whole list reversed.",
        time: "O(n)",
        space: "O(1) iteratively (O(n) stack for the recursive version)",
        pitfalls: [
          "Overwriting `cur.next` before saving it loses the rest of the list.",
          "Return `prev`, not `head` — the old head is now the tail.",
          "The recursive version must set the old head's `next` to null, or the last two nodes form a cycle.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
        { input: "[1,2]", expectedOutput: "[2,1]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = Array.from({ length: listLen(rng) }, () => ri(rng, -5000, 5000));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:
              prev, cur = None, head
              while cur:
                  nxt = cur.next
                  cur.next = prev
                  prev, cur = cur, nxt
              return prev
        `,
        javascript: code`
          var reverseList = function(head) {
              var prev = null, cur = head;
              while (cur !== null) {
                  var next = cur.next;
                  cur.next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          };
        `,
        typescript: code`
          function reverseList(head: ListNode | null): ListNode | null {
              var prev: ListNode | null = null, cur = head;
              while (cur !== null) {
                  var next = cur.next;
                  cur.next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          }
        `,
        java: code`
          public static ListNode reverseList(ListNode head) {
              ListNode prev = null, cur = head;
              while (cur != null) {
                  ListNode next = cur.next;
                  cur.next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          }
        `,
        cpp: code`
          ListNode* reverseList(ListNode* head) {
              ListNode* prev = nullptr;
              ListNode* cur = head;
              while (cur) {
                  ListNode* next = cur->next;
                  cur->next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          }
        `,
        c: code`
          struct ListNode* reverseList(struct ListNode* head) {
              struct ListNode* prev = NULL;
              struct ListNode* cur = head;
              while (cur != NULL) {
                  struct ListNode* next = cur->next;
                  cur->next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          }
        `,
        csharp: code`
          public static ListNode ReverseList(ListNode head)
          {
              ListNode prev = null, cur = head;
              while (cur != null)
              {
                  var next = cur.next;
                  cur.next = prev;
                  prev = cur;
                  cur = next;
              }
              return prev;
          }
        `,
        go: code`
          func reverseList(head *ListNode) *ListNode {
              var prev *ListNode
              cur := head
              for cur != nil {
                  next := cur.Next
                  cur.Next = prev
                  prev = cur
                  cur = next
              }
              return prev
          }
        `,
        kotlin: kt`
          fun reverseList(head: ListNode?): ListNode? {
              var prev: ListNode? = null
              var cur = head
              while (cur != null) {
                  val next = cur.next
                  cur.next = prev
                  prev = cur
                  cur = next
              }
              return prev
          }
        `,
        swift: code`
          func reverseList(_ head: ListNode?) -> ListNode? {
              var prev: ListNode? = nil
              var cur = head
              while let c = cur {
                  let next = c.next
                  c.next = prev
                  prev = c
                  cur = next
              }
              return prev
          }
        `,
        rust: code`
          fn reverseList(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut prev: Option<Box<ListNode>> = None;
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  node.next = prev;
                  prev = Some(node);
              }
              prev
          }
        `,
        php: code`
          function reverseList($head) {
              $prev = null;
              $cur = $head;
              while ($cur !== null) {
                  $next = $cur->next;
                  $cur->next = $prev;
                  $prev = $cur;
                  $cur = $next;
              }
              return $prev;
          }
        `,
        ruby: code`
          def reverseList(head)
            prev = nil
            cur = head
            while cur
              nxt = cur.next
              cur.next = prev
              prev = cur
              cur = nxt
            end
            prev
          end
        `,
      },
    };
  })(),

  // ── Palindrome Linked List (LC 234) ─────────────────────────────
  (() => {
    const ref = (a: number[]) => a.join(",") === a.slice().reverse().join(",");
    return {
      slug: "palindrome-linked-list",
      title: "Palindrome Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Two Pointers", "Stack", "Recursion", "Amazon", "Meta", "Microsoft", "Apple"],
      signature: { funcName: "isPalindrome", params: [{ name: "head", type: "ListNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `head` of a singly linked list, return `true` if its values read the same from front to back as from back to front, and `false` otherwise.",
        [
          { in: "head = [1,2,2,1]", out: "true" },
          { in: "head = [1,2]", out: "false" },
          { in: "head = [3,0,3]", out: "true", note: "An odd-length palindrome: the middle value is compared with nothing." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "0 <= Node.val <= 9"],
        "Could you do it in O(n) time and O(1) extra space?"),
      hints: [
        "Copying the values into an array and checking it with two indices works, but costs O(n) space.",
        "With a slow and a fast pointer you can find the middle in one pass — and the slow pointer can reverse the first half as it goes.",
        "Once the first half is reversed, walk it and the second half side by side (skip the middle node when the length is odd) and compare.",
      ],
      editorial: explain({
        idea: "A palindrome's first half, reversed, equals its second half. Find the middle with slow/fast pointers while reversing the links of the first half on the way, then compare the two halves node by node — no extra memory.",
        steps: [
          "Set `slow = fast = head`, `prev = null`.",
          "While `fast` and `fast.next` exist: advance `fast` two steps; then move `slow` one step forward, reversing its link to point at `prev` (save `slow.next` first).",
          "If `fast` is not null the length is odd: step `slow` past the middle node.",
          "Now `prev` heads the reversed first half and `slow` the second half. Walk both together; any differing pair means `false`.",
          "If they all match, return `true`.",
        ],
        why: "When `fast` reaches the end, `slow` has moved `floor(n / 2)` times, so exactly the first half has been reversed into `prev`. Reading `prev` forward gives the first half backwards, which must equal the second half read forward for a palindrome.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Odd lengths: the middle node belongs to neither half — skip it.",
          "Advance `fast` before relinking `slow`, or the reversal can cut the path `fast` needs.",
          "This modifies the list; restore it by reversing again if the caller needs it intact.",
        ],
      }),
      examples: [
        { input: "[1,2,2,1]", expectedOutput: "true" },
        { input: "[1,2]", expectedOutput: "false" },
        { input: "[3,0,3]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [1, 2, 9]);
        let a = Array.from({ length: listLen(rng, 1) }, () => ri(rng, 0, top));
        if (rng() < 0.5) {
          // Mirror it into a palindrome, sometimes with one value changed.
          const half = a.slice(0, Math.ceil(a.length / 2));
          a = half.concat(half.slice(0, Math.floor(a.length / 2)).reverse());
          if (rng() < 0.3) a[ri(rng, 0, a.length - 1)] = ri(rng, 0, 9);
        }
        return { input: fmtIntArr(a), expectedOutput: bool(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isPalindrome(head: Optional[ListNode]) -> bool:
              slow = fast = head
              prev = None
              while fast and fast.next:
                  fast = fast.next.next
                  nxt = slow.next
                  slow.next = prev
                  prev, slow = slow, nxt
              if fast:
                  slow = slow.next  # odd length: skip the middle
              while prev:
                  if prev.val != slow.val:
                      return False
                  prev, slow = prev.next, slow.next
              return True
        `,
        javascript: code`
          var isPalindrome = function(head) {
              var slow = head, fast = head, prev = null;
              while (fast !== null && fast.next !== null) {
                  fast = fast.next.next;
                  var next = slow.next;
                  slow.next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast !== null) slow = slow.next; // odd length: skip the middle
              while (prev !== null) {
                  if (prev.val !== slow.val) return false;
                  prev = prev.next;
                  slow = slow.next;
              }
              return true;
          };
        `,
        typescript: code`
          function isPalindrome(head: ListNode | null): boolean {
              var slow = head, fast = head, prev: ListNode | null = null;
              while (fast !== null && fast.next !== null) {
                  fast = fast.next.next;
                  var next = slow.next;
                  slow.next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast !== null) slow = slow.next; // odd length: skip the middle
              while (prev !== null) {
                  if (prev.val !== slow.val) return false;
                  prev = prev.next;
                  slow = slow.next;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isPalindrome(ListNode head) {
              ListNode slow = head, fast = head, prev = null;
              while (fast != null && fast.next != null) {
                  fast = fast.next.next;
                  ListNode next = slow.next;
                  slow.next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast != null) slow = slow.next; // odd length: skip the middle
              while (prev != null) {
                  if (prev.val != slow.val) return false;
                  prev = prev.next;
                  slow = slow.next;
              }
              return true;
          }
        `,
        cpp: code`
          bool isPalindrome(ListNode* head) {
              ListNode *slow = head, *fast = head, *prev = nullptr;
              while (fast && fast->next) {
                  fast = fast->next->next;
                  ListNode* next = slow->next;
                  slow->next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast) slow = slow->next; // odd length: skip the middle
              while (prev) {
                  if (prev->val != slow->val) return false;
                  prev = prev->next;
                  slow = slow->next;
              }
              return true;
          }
        `,
        c: code`
          bool isPalindrome(struct ListNode* head) {
              struct ListNode *slow = head, *fast = head, *prev = NULL;
              while (fast != NULL && fast->next != NULL) {
                  fast = fast->next->next;
                  struct ListNode* next = slow->next;
                  slow->next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast != NULL) slow = slow->next; /* odd length: skip the middle */
              while (prev != NULL) {
                  if (prev->val != slow->val) return false;
                  prev = prev->next;
                  slow = slow->next;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool IsPalindrome(ListNode head)
          {
              ListNode slow = head, fast = head, prev = null;
              while (fast != null && fast.next != null)
              {
                  fast = fast.next.next;
                  var next = slow.next;
                  slow.next = prev;
                  prev = slow;
                  slow = next;
              }
              if (fast != null) slow = slow.next; // odd length: skip the middle
              while (prev != null)
              {
                  if (prev.val != slow.val) return false;
                  prev = prev.next;
                  slow = slow.next;
              }
              return true;
          }
        `,
        go: code`
          func isPalindrome(head *ListNode) bool {
              slow, fast := head, head
              var prev *ListNode
              for fast != nil && fast.Next != nil {
                  fast = fast.Next.Next
                  next := slow.Next
                  slow.Next = prev
                  prev = slow
                  slow = next
              }
              if fast != nil {
                  slow = slow.Next // odd length: skip the middle
              }
              for prev != nil {
                  if prev.Val != slow.Val {
                      return false
                  }
                  prev, slow = prev.Next, slow.Next
              }
              return true
          }
        `,
        kotlin: kt`
          fun isPalindrome(head: ListNode?): Boolean {
              var slow = head
              var fast = head
              var prev: ListNode? = null
              while (fast?.next != null) {
                  fast = fast.next!!.next
                  val s = slow!!
                  val next = s.next
                  s.next = prev
                  prev = s
                  slow = next
              }
              if (fast != null) slow = slow!!.next // odd length: skip the middle
              while (prev != null) {
                  if (prev.\`val\` != slow!!.\`val\`) return false
                  prev = prev.next
                  slow = slow.next
              }
              return true
          }
        `,
        swift: code`
          func isPalindrome(_ head: ListNode?) -> Bool {
              var slow = head, fast = head
              var prev: ListNode? = nil
              while let f = fast, let f2 = f.next {
                  fast = f2.next
                  let s = slow!
                  let next = s.next
                  s.next = prev
                  prev = s
                  slow = next
              }
              if fast != nil { slow = slow!.next } // odd length: skip the middle
              while let p = prev, let s = slow {
                  if p.val != s.val { return false }
                  prev = p.next
                  slow = s.next
              }
              return true
          }
        `,
        rust: code`
          fn isPalindrome(head: Option<Box<ListNode>>) -> bool {
              let mut n = 0;
              let mut p = &head;
              while let Some(node) = p {
                  n += 1;
                  p = &node.next;
              }
              // Reverse the first half by moving its nodes onto rev.
              let mut cur = head;
              let mut rev: Option<Box<ListNode>> = None;
              for _ in 0..n / 2 {
                  let mut node = cur.unwrap();
                  cur = node.next.take();
                  node.next = rev;
                  rev = Some(node);
              }
              if n % 2 == 1 {
                  cur = cur.unwrap().next; // odd length: skip the middle
              }
              let (mut a, mut b) = (&rev, &cur);
              while let (Some(x), Some(y)) = (a, b) {
                  if x.val != y.val {
                      return false;
                  }
                  a = &x.next;
                  b = &y.next;
              }
              true
          }
        `,
        php: code`
          function isPalindrome($head) {
              $slow = $head;
              $fast = $head;
              $prev = null;
              while ($fast !== null && $fast->next !== null) {
                  $fast = $fast->next->next;
                  $next = $slow->next;
                  $slow->next = $prev;
                  $prev = $slow;
                  $slow = $next;
              }
              if ($fast !== null) $slow = $slow->next; // odd length: skip the middle
              while ($prev !== null) {
                  if ($prev->val !== $slow->val) return false;
                  $prev = $prev->next;
                  $slow = $slow->next;
              }
              return true;
          }
        `,
        ruby: code`
          def isPalindrome(head)
            slow = fast = head
            prev = nil
            while fast && fast.next
              fast = fast.next.next
              nxt = slow.next
              slow.next = prev
              prev = slow
              slow = nxt
            end
            slow = slow.next if fast # odd length: skip the middle
            while prev
              return false if prev.val != slow.val
              prev = prev.next
              slow = slow.next
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Middle of the Linked List (LC 876) ──────────────────────────
  (() => {
    const ref = (a: number[]) => a.slice(Math.floor(a.length / 2));
    return {
      slug: "middle-of-the-linked-list",
      title: "Middle of the Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "middleNode", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a non-empty singly linked list, return its **middle node** — the list from that node to the end is what gets printed.\n\nWhen the list has two middle nodes (an even number of nodes), return the **second** one.",
        [
          { in: "head = [1,2,3,4,5]", out: "[3,4,5]", note: "The middle node is 3." },
          { in: "head = [1,2,3,4,5,6]", out: "[4,5,6]", note: "3 and 4 are both middle nodes; the second one, 4, is returned." },
          { in: "head = [7]", out: "[7]" },
        ],
        ["The number of nodes in the list is in the range [1, 100]", "1 <= Node.val <= 100"]),
      hints: [
        "Counting the nodes first and then walking half way works in two passes.",
        "Can one pass do it? Move one pointer one step at a time and another two steps at a time.",
        "When the fast pointer cannot take two more steps (it is null, or its next is null), the slow pointer is on the (second) middle node.",
      ],
      editorial: explain({
        idea: "A pointer moving at twice the speed reaches the end exactly when the slower one reaches the middle.",
        steps: [
          "Set `slow = fast = head`.",
          "While `fast` and `fast.next` are not null: `slow = slow.next`, `fast = fast.next.next`.",
          "Return `slow`.",
        ],
        why: "After `k` iterations `slow` is at index `k` and `fast` at index `2k`. The loop stops at the first `k` with `2k >= n - 1`, i.e. `k = floor(n / 2)` — the middle for odd `n` and the second middle for even `n`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Testing `fast.next.next` instead of `fast.next` in the loop condition returns the first middle on even lengths.",
          "Check `fast` before `fast.next` to avoid dereferencing null.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "[3,4,5]" },
        { input: "[1,2,3,4,5,6]", expectedOutput: "[4,5,6]" },
        { input: "[7]", expectedOutput: "[7]" },
      ],
      gen: (rng: Rng) => {
        const a = Array.from({ length: listLen(rng, 1) }, () => ri(rng, 1, 100));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def middleNode(head: Optional[ListNode]) -> Optional[ListNode]:
              slow = fast = head
              while fast and fast.next:
                  slow = slow.next
                  fast = fast.next.next
              return slow
        `,
        javascript: code`
          var middleNode = function(head) {
              var slow = head, fast = head;
              while (fast !== null && fast.next !== null) {
                  slow = slow.next;
                  fast = fast.next.next;
              }
              return slow;
          };
        `,
        typescript: code`
          function middleNode(head: ListNode | null): ListNode | null {
              var slow = head, fast = head;
              while (fast !== null && fast.next !== null) {
                  slow = slow.next;
                  fast = fast.next.next;
              }
              return slow;
          }
        `,
        java: code`
          public static ListNode middleNode(ListNode head) {
              ListNode slow = head, fast = head;
              while (fast != null && fast.next != null) {
                  slow = slow.next;
                  fast = fast.next.next;
              }
              return slow;
          }
        `,
        cpp: code`
          ListNode* middleNode(ListNode* head) {
              ListNode *slow = head, *fast = head;
              while (fast && fast->next) {
                  slow = slow->next;
                  fast = fast->next->next;
              }
              return slow;
          }
        `,
        c: code`
          struct ListNode* middleNode(struct ListNode* head) {
              struct ListNode *slow = head, *fast = head;
              while (fast != NULL && fast->next != NULL) {
                  slow = slow->next;
                  fast = fast->next->next;
              }
              return slow;
          }
        `,
        csharp: code`
          public static ListNode MiddleNode(ListNode head)
          {
              ListNode slow = head, fast = head;
              while (fast != null && fast.next != null)
              {
                  slow = slow.next;
                  fast = fast.next.next;
              }
              return slow;
          }
        `,
        go: code`
          func middleNode(head *ListNode) *ListNode {
              slow, fast := head, head
              for fast != nil && fast.Next != nil {
                  slow = slow.Next
                  fast = fast.Next.Next
              }
              return slow
          }
        `,
        kotlin: kt`
          fun middleNode(head: ListNode?): ListNode? {
              var slow = head
              var fast = head
              while (fast?.next != null) {
                  slow = slow!!.next
                  fast = fast.next!!.next
              }
              return slow
          }
        `,
        swift: code`
          func middleNode(_ head: ListNode?) -> ListNode? {
              var slow = head, fast = head
              while let f = fast, let f2 = f.next {
                  slow = slow!.next
                  fast = f2.next
              }
              return slow
          }
        `,
        rust: code`
          fn middleNode(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              // Two pointers cannot share an owned list, so measure first, then walk half way.
              let mut n = 0;
              let mut p = &head;
              while let Some(node) = p {
                  n += 1;
                  p = &node.next;
              }
              let mut cur = head;
              for _ in 0..n / 2 {
                  cur = cur.unwrap().next;
              }
              cur
          }
        `,
        php: code`
          function middleNode($head) {
              $slow = $head;
              $fast = $head;
              while ($fast !== null && $fast->next !== null) {
                  $slow = $slow->next;
                  $fast = $fast->next->next;
              }
              return $slow;
          }
        `,
        ruby: code`
          def middleNode(head)
            slow = fast = head
            while fast && fast.next
              slow = slow.next
              fast = fast.next.next
            end
            slow
          end
        `,
      },
    };
  })(),

  // ── Convert Binary Number in a Linked List to Integer (LC 1290) ─
  (() => {
    const ref = (a: number[]) => parseInt(a.join(""), 2);
    return {
      slug: "convert-binary-number-in-a-linked-list-to-integer",
      title: "Convert Binary Number in a Linked List to Integer",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Math", "Bit Manipulation", "Amazon", "Apple"],
      signature: { funcName: "getDecimalValue", params: [{ name: "head", type: "ListNode" as const }], returns: "int" as const },
      description: describe(
        "The `head` of a singly linked list is given, and every node holds a bit — `0` or `1`. Read from head to tail, the bits spell a binary number with the **most significant bit first**.\n\nReturn the decimal value of that number.",
        [
          { in: "head = [1,0,1]", out: "5", note: "Binary 101 is 4 + 0 + 1 = 5." },
          { in: "head = [0]", out: "0" },
          { in: "head = [0,0,1,1,0]", out: "6", note: "Leading zeros do not change the value: 00110 is 6." },
        ],
        ["The list is not empty", "The number of nodes does not exceed 30", "Each Node.val is 0 or 1"]),
      hints: [
        "You do not know the length in advance, so you cannot know each bit's power of two up front.",
        "Reading a number left to right, each new digit shifts what you have one place to the left.",
        "Keep `value = value * 2 + bit` (or `(value << 1) | bit`) for each node.",
      ],
      editorial: explain({
        idea: "Horner's rule: reading a binary number from its most significant bit, each new bit doubles the value accumulated so far and adds itself. No length is needed.",
        steps: [
          "Set `value = 0`.",
          "For each node from head to tail: `value = value * 2 + node.val`.",
          "Return `value`.",
        ],
        why: "After reading the bits `b1 … bk`, `value` equals the number they spell, because appending a bit `b` to a number `x` gives `2x + b`. Induction over the list finishes the argument.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Starting from the tail with increasing powers requires the length or a reversal — unnecessary here.",
          "At most 30 bits keeps the value below 2^30, inside a 32-bit int.",
        ],
      }),
      examples: [
        { input: "[1,0,1]", expectedOutput: "5" },
        { input: "[0]", expectedOutput: "0" },
        { input: "[0,0,1,1,0]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 30]));
        const p1 = pick(rng, [0, 0.5, 1]);
        const a = Array.from({ length: n }, () => (rng() < p1 ? 1 : 0));
        return { input: fmtIntArr(a), expectedOutput: String(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getDecimalValue(head: Optional[ListNode]) -> int:
              value = 0
              while head:
                  value = value * 2 + head.val
                  head = head.next
              return value
        `,
        javascript: code`
          var getDecimalValue = function(head) {
              var value = 0;
              for (var node = head; node !== null; node = node.next) value = value * 2 + node.val;
              return value;
          };
        `,
        typescript: code`
          function getDecimalValue(head: ListNode | null): number {
              var value = 0;
              for (var node = head; node !== null; node = node.next) value = value * 2 + node.val;
              return value;
          }
        `,
        java: code`
          public static int getDecimalValue(ListNode head) {
              int value = 0;
              for (ListNode node = head; node != null; node = node.next) value = value * 2 + node.val;
              return value;
          }
        `,
        cpp: code`
          int getDecimalValue(ListNode* head) {
              int value = 0;
              for (ListNode* node = head; node; node = node->next) value = value * 2 + node->val;
              return value;
          }
        `,
        c: code`
          int getDecimalValue(struct ListNode* head) {
              int value = 0;
              for (struct ListNode* node = head; node != NULL; node = node->next) value = value * 2 + node->val;
              return value;
          }
        `,
        csharp: code`
          public static int GetDecimalValue(ListNode head)
          {
              int value = 0;
              for (var node = head; node != null; node = node.next) value = value * 2 + node.val;
              return value;
          }
        `,
        go: code`
          func getDecimalValue(head *ListNode) int {
              value := 0
              for node := head; node != nil; node = node.Next {
                  value = value*2 + node.Val
              }
              return value
          }
        `,
        kotlin: kt`
          fun getDecimalValue(head: ListNode?): Int {
              var value = 0
              var node = head
              while (node != null) {
                  value = value * 2 + node.\`val\`
                  node = node.next
              }
              return value
          }
        `,
        swift: code`
          func getDecimalValue(_ head: ListNode?) -> Int {
              var value = 0
              var node = head
              while let n = node {
                  value = value * 2 + n.val
                  node = n.next
              }
              return value
          }
        `,
        rust: code`
          fn getDecimalValue(head: Option<Box<ListNode>>) -> i32 {
              let mut value = 0;
              let mut node = &head;
              while let Some(n) = node {
                  value = value * 2 + n.val;
                  node = &n.next;
              }
              value
          }
        `,
        php: code`
          function getDecimalValue($head) {
              $value = 0;
              for ($node = $head; $node !== null; $node = $node->next) $value = $value * 2 + $node->val;
              return $value;
          }
        `,
        ruby: code`
          def getDecimalValue(head)
            value = 0
            node = head
            while node
              value = value * 2 + node.val
              node = node.next
            end
            value
          end
        `,
      },
    };
  })(),

  // ── Intersection of Two Sorted Linked Lists (GFG) ───────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const left = b.slice();
      const out: number[] = [];
      for (const v of a) { const i = left.indexOf(v); if (i >= 0) { out.push(v); left.splice(i, 1); } }
      return out.sort((x, y) => x - y);
    };
    return {
      slug: "intersection-of-two-sorted-linked-lists",
      title: "Intersection of Two Sorted Linked Lists",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft"],
      signature: { funcName: "findIntersection", params: [{ name: "head1", type: "ListNode" as const }, { name: "head2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the heads of two singly linked lists, `head1` and `head2`, each sorted in **non-decreasing** order. Build and return a **new** sorted linked list holding the values the two lists have in common; the input lists must not be changed.\n\nValues may repeat. A value that appears `a` times in the first list and `b` times in the second appears `min(a, b)` times in the result. If the lists share nothing, return the empty list.",
        [
          { in: "head1 = [1,2,3,4,6], head2 = [2,4,6,8]", out: "[2,4,6]" },
          { in: "head1 = [10,20,40,50], head2 = [15,40]", out: "[40]" },
          { in: "head1 = [1,1,2,2,2,5], head2 = [1,2,2,3]", out: "[1,2,2]", note: "1 is shared once and 2 twice — as often as the list with fewer copies holds it." },
        ],
        ["1 <= number of nodes in each list <= 10^4", "1 <= Node.val <= 10^4", "Both lists are sorted in non-decreasing order"]),
      hints: [
        "Both lists are sorted — think of how merge sort walks two sorted sequences side by side.",
        "Compare the two current values: the smaller one cannot appear in the other list from here on, so skip it.",
        "When the values are equal, append a new node with that value to the result and advance both lists.",
      ],
      editorial: explain({
        idea: "Walk both sorted lists with one pointer each, exactly like the merge step of merge sort, but keep a value only when both pointers show it — then move both on, which pairs copies one to one.",
        steps: [
          "Set `p = head1`, `q = head2`, and a dummy head for the result with `tail` at it.",
          "While both pointers are non-null: if `p.val < q.val` advance `p`; if `p.val > q.val` advance `q`.",
          "Otherwise append a new node with `p.val` after `tail`, move `tail`, and advance both `p` and `q`.",
          "Return `dummy.next`.",
        ],
        why: "When `p.val < q.val`, every remaining value of the second list is at least `q.val`, so `p`'s value has no partner left and can be skipped; symmetrically for `q`. Equal values are matched one copy from each list, so a value is emitted exactly `min(a, b)` times, in sorted order.",
        time: "O(n + m)",
        space: "O(k) for the k result nodes",
        pitfalls: [
          "Build new nodes; relinking the input nodes would change the original lists.",
          "Advance both pointers on a match, otherwise a single copy would be counted repeatedly.",
          "The result can be empty.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,6]\n[2,4,6,8]", expectedOutput: "[2,4,6]" },
        { input: "[10,20,40,50]\n[15,40]", expectedOutput: "[40]" },
        { input: "[1,1,2,2,2,5]\n[1,2,2,3]", expectedOutput: "[1,2,2]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [2, 5, 15, 60, 10000]);
        const mk = () => Array.from({ length: listLen(rng, 1) }, () => ri(rng, 1, top)).sort((x, y) => x - y);
        const a = mk(), b = mk();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findIntersection(head1: Optional[ListNode], head2: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0)
              tail = dummy
              p, q = head1, head2
              while p and q:
                  if p.val < q.val:
                      p = p.next
                  elif p.val > q.val:
                      q = q.next
                  else:
                      tail.next = ListNode(p.val)
                      tail = tail.next
                      p, q = p.next, q.next
              return dummy.next
        `,
        javascript: code`
          var findIntersection = function(head1, head2) {
              var dummy = new ListNode(0), tail = dummy;
              var p = head1, q = head2;
              while (p !== null && q !== null) {
                  if (p.val < q.val) p = p.next;
                  else if (p.val > q.val) q = q.next;
                  else {
                      tail.next = new ListNode(p.val);
                      tail = tail.next;
                      p = p.next;
                      q = q.next;
                  }
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function findIntersection(head1: ListNode | null, head2: ListNode | null): ListNode | null {
              var dummy = new ListNode(0), tail = dummy;
              var p = head1, q = head2;
              while (p !== null && q !== null) {
                  if (p.val < q.val) p = p.next;
                  else if (p.val > q.val) q = q.next;
                  else {
                      tail.next = new ListNode(p.val);
                      tail = tail.next;
                      p = p.next;
                      q = q.next;
                  }
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode findIntersection(ListNode head1, ListNode head2) {
              ListNode dummy = new ListNode(0), tail = dummy;
              ListNode p = head1, q = head2;
              while (p != null && q != null) {
                  if (p.val < q.val) p = p.next;
                  else if (p.val > q.val) q = q.next;
                  else {
                      tail.next = new ListNode(p.val);
                      tail = tail.next;
                      p = p.next;
                      q = q.next;
                  }
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* findIntersection(ListNode* head1, ListNode* head2) {
              ListNode dummy(0);
              ListNode* tail = &dummy;
              ListNode *p = head1, *q = head2;
              while (p && q) {
                  if (p->val < q->val) p = p->next;
                  else if (p->val > q->val) q = q->next;
                  else {
                      tail->next = new ListNode(p->val);
                      tail = tail->next;
                      p = p->next;
                      q = q->next;
                  }
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* findIntersection(struct ListNode* head1, struct ListNode* head2) {
              struct ListNode dummy;
              struct ListNode* tail = &dummy;
              struct ListNode *p = head1, *q = head2;
              dummy.next = NULL;
              while (p != NULL && q != NULL) {
                  if (p->val < q->val) p = p->next;
                  else if (p->val > q->val) q = q->next;
                  else {
                      struct ListNode* node = (struct ListNode*) malloc(sizeof(struct ListNode));
                      node->val = p->val;
                      node->next = NULL;
                      tail->next = node;
                      tail = node;
                      p = p->next;
                      q = q->next;
                  }
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode FindIntersection(ListNode head1, ListNode head2)
          {
              var dummy = new ListNode(0);
              var tail = dummy;
              ListNode p = head1, q = head2;
              while (p != null && q != null)
              {
                  if (p.val < q.val) p = p.next;
                  else if (p.val > q.val) q = q.next;
                  else
                  {
                      tail.next = new ListNode(p.val);
                      tail = tail.next;
                      p = p.next;
                      q = q.next;
                  }
              }
              return dummy.next;
          }
        `,
        go: code`
          func findIntersection(head1 *ListNode, head2 *ListNode) *ListNode {
              dummy := &ListNode{}
              tail := dummy
              p, q := head1, head2
              for p != nil && q != nil {
                  if p.Val < q.Val {
                      p = p.Next
                  } else if p.Val > q.Val {
                      q = q.Next
                  } else {
                      tail.Next = &ListNode{Val: p.Val}
                      tail = tail.Next
                      p, q = p.Next, q.Next
                  }
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun findIntersection(head1: ListNode?, head2: ListNode?): ListNode? {
              val dummy = ListNode(0)
              var tail = dummy
              var p = head1
              var q = head2
              while (p != null && q != null) {
                  if (p.\`val\` < q.\`val\`) p = p.next
                  else if (p.\`val\` > q.\`val\`) q = q.next
                  else {
                      val node = ListNode(p.\`val\`)
                      tail.next = node
                      tail = node
                      p = p.next
                      q = q.next
                  }
              }
              return dummy.next
          }
        `,
        swift: code`
          func findIntersection(_ head1: ListNode?, _ head2: ListNode?) -> ListNode? {
              let dummy = ListNode(0)
              var tail = dummy
              var p = head1, q = head2
              while let x = p, let y = q {
                  if x.val < y.val { p = x.next }
                  else if x.val > y.val { q = y.next }
                  else {
                      let node = ListNode(x.val)
                      tail.next = node
                      tail = node
                      p = x.next
                      q = y.next
                  }
              }
              return dummy.next
          }
        `,
        rust: code`
          fn findIntersection(head1: Option<Box<ListNode>>, head2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut common: Vec<i32> = Vec::new();
              let (mut p, mut q) = (&head1, &head2);
              while let (Some(x), Some(y)) = (p, q) {
                  if x.val < y.val {
                      p = &x.next;
                  } else if x.val > y.val {
                      q = &y.next;
                  } else {
                      common.push(x.val);
                      p = &x.next;
                      q = &y.next;
                  }
              }
              // Build the new list back to front.
              let mut head: Option<Box<ListNode>> = None;
              for &v in common.iter().rev() {
                  let mut node = Box::new(ListNode::new(v));
                  node.next = head;
                  head = Some(node);
              }
              head
          }
        `,
        php: code`
          function findIntersection($head1, $head2) {
              $dummy = new ListNode(0);
              $tail = $dummy;
              $p = $head1;
              $q = $head2;
              while ($p !== null && $q !== null) {
                  if ($p->val < $q->val) $p = $p->next;
                  elseif ($p->val > $q->val) $q = $q->next;
                  else {
                      $tail->next = new ListNode($p->val);
                      $tail = $tail->next;
                      $p = $p->next;
                      $q = $q->next;
                  }
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def findIntersection(head1, head2)
            dummy = ListNode.new(0)
            tail = dummy
            p = head1
            q = head2
            while p && q
              if p.val < q.val
                p = p.next
              elsif p.val > q.val
                q = q.next
              else
                tail.next = ListNode.new(p.val)
                tail = tail.next
                p = p.next
                q = q.next
              end
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Remove Duplicates from an Unsorted Linked List (GFG) ────────
  (() => {
    const ref = (a: number[]) => a.filter((v, i) => a.indexOf(v) === i);
    return {
      slug: "remove-duplicates-from-an-unsorted-linked-list",
      title: "Remove Duplicates from an Unsorted Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Hash Table", "Amazon", "Microsoft"],
      signature: { funcName: "removeDuplicates", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list whose values are in no particular order. Remove every node whose value has **already appeared earlier** in the list, so that only the first occurrence of each value remains, and return the head. The surviving nodes keep their original order.",
        [
          { in: "head = [5,2,2,4]", out: "[5,2,4]" },
          { in: "head = [2,2,2,2,2]", out: "[2]" },
          { in: "head = [3,1,3,2,1,4]", out: "[3,1,2,4]", note: "The second 3 and the second 1 are dropped; the first copies stay where they were." },
        ],
        ["1 <= number of nodes <= 10^6", "0 <= Node.val <= 10^6"]),
      hints: [
        "Unlike a sorted list, copies of a value need not be next to each other.",
        "Remember every value you have already kept — a hash set answers 'seen before?' in O(1).",
        "Walk with a pointer to the last kept node; if the next node's value is in the set, unlink it, otherwise add the value and move on.",
      ],
      editorial: explain({
        idea: "Scan once, keeping a set of the values kept so far. A node whose value is in the set is a later copy and gets unlinked; otherwise its value joins the set. Unlinking from the previous kept node preserves the order of the rest.",
        steps: [
          "Put `head.val` in a set and set `prev = head`.",
          "While `prev.next` exists: if its value is in the set, skip it with `prev.next = prev.next.next`; otherwise add the value and set `prev = prev.next`.",
          "Return `head` (the first node is always kept).",
        ],
        why: "When a node is examined, the set holds exactly the values of the nodes kept before it, which are the values that have appeared earlier (every earlier copy shares a value with a kept node). So a node is removed precisely when its value appeared earlier.",
        time: "O(n) expected",
        space: "O(d) for the d distinct values",
        pitfalls: [
          "Sorting the list first would change the order of the survivors.",
          "Comparing each node with every earlier node is O(n²) — too slow for 10^6 nodes.",
          "After unlinking, stay on `prev`: the new next node must be checked as well.",
        ],
      }),
      examples: [
        { input: "[5,2,2,4]", expectedOutput: "[5,2,4]" },
        { input: "[2,2,2,2,2]", expectedOutput: "[2]" },
        { input: "[3,1,3,2,1,4]", expectedOutput: "[3,1,2,4]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [0, 3, 10, 50, 1000000]);
        const a = Array.from({ length: listLen(rng, 1) }, () => ri(rng, 0, top));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def removeDuplicates(head: Optional[ListNode]) -> Optional[ListNode]:
              if head is None:
                  return None
              seen = {head.val}
              prev = head
              while prev.next:
                  if prev.next.val in seen:
                      prev.next = prev.next.next
                  else:
                      seen.add(prev.next.val)
                      prev = prev.next
              return head
        `,
        javascript: code`
          var removeDuplicates = function(head) {
              if (head === null) return null;
              var seen = new Set([head.val]);
              var prev = head;
              while (prev.next !== null) {
                  if (seen.has(prev.next.val)) prev.next = prev.next.next;
                  else { seen.add(prev.next.val); prev = prev.next; }
              }
              return head;
          };
        `,
        typescript: code`
          function removeDuplicates(head: ListNode | null): ListNode | null {
              if (head === null) return null;
              var seen: { [v: number]: boolean } = {};
              seen[head.val] = true;
              var prev = head;
              while (prev.next !== null) {
                  if (seen[prev.next.val]) prev.next = prev.next.next;
                  else { seen[prev.next.val] = true; prev = prev.next; }
              }
              return head;
          }
        `,
        java: code`
          public static ListNode removeDuplicates(ListNode head) {
              if (head == null) return null;
              Set<Integer> seen = new HashSet<>();
              seen.add(head.val);
              ListNode prev = head;
              while (prev.next != null) {
                  if (seen.contains(prev.next.val)) prev.next = prev.next.next;
                  else { seen.add(prev.next.val); prev = prev.next; }
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* removeDuplicates(ListNode* head) {
              if (!head) return nullptr;
              unordered_set<int> seen{head->val};
              ListNode* prev = head;
              while (prev->next) {
                  if (seen.count(prev->next->val)) prev->next = prev->next->next;
                  else { seen.insert(prev->next->val); prev = prev->next; }
              }
              return head;
          }
        `,
        c: code`
          static int seenInsert(int* table, int mask, int v);

          struct ListNode* removeDuplicates(struct ListNode* head) {
              if (head == NULL) return NULL;
              int n = 0;
              for (struct ListNode* p = head; p != NULL; p = p->next) n++;
              int size = 1;
              while (size < 2 * n) size <<= 1;
              /* Open addressing over value + 1, so 0 marks an empty slot. */
              int* table = (int*) calloc(size, sizeof(int));
              seenInsert(table, size - 1, head->val);
              struct ListNode* prev = head;
              while (prev->next != NULL) {
                  if (!seenInsert(table, size - 1, prev->next->val)) {
                      struct ListNode* dup = prev->next;
                      prev->next = dup->next;
                      free(dup);
                  } else {
                      prev = prev->next;
                  }
              }
              free(table);
              return head;
          }

          /* Adds v; returns 1 if it was new, 0 if it was already there. */
          static int seenInsert(int* table, int mask, int v) {
              int i = (int) (((unsigned) v * 2654435761u) & (unsigned) mask);
              while (table[i] != 0) {
                  if (table[i] == v + 1) return 0;
                  i = (i + 1) & mask;
              }
              table[i] = v + 1;
              return 1;
          }
        `,
        csharp: code`
          public static ListNode RemoveDuplicates(ListNode head)
          {
              if (head == null) return null;
              var seen = new HashSet<int> { head.val };
              var prev = head;
              while (prev.next != null)
              {
                  if (seen.Contains(prev.next.val)) prev.next = prev.next.next;
                  else { seen.Add(prev.next.val); prev = prev.next; }
              }
              return head;
          }
        `,
        go: code`
          func removeDuplicates(head *ListNode) *ListNode {
              if head == nil {
                  return nil
              }
              seen := map[int]bool{head.Val: true}
              prev := head
              for prev.Next != nil {
                  if seen[prev.Next.Val] {
                      prev.Next = prev.Next.Next
                  } else {
                      seen[prev.Next.Val] = true
                      prev = prev.Next
                  }
              }
              return head
          }
        `,
        kotlin: kt`
          fun removeDuplicates(head: ListNode?): ListNode? {
              if (head == null) return null
              val seen = hashSetOf(head.\`val\`)
              var prev: ListNode = head
              while (prev.next != null) {
                  val nx = prev.next!!
                  if (nx.\`val\` in seen) prev.next = nx.next
                  else { seen.add(nx.\`val\`); prev = nx }
              }
              return head
          }
        `,
        swift: code`
          func removeDuplicates(_ head: ListNode?) -> ListNode? {
              guard let h = head else { return nil }
              var seen: Set<Int> = [h.val]
              var prev = h
              while let nx = prev.next {
                  if seen.contains(nx.val) { prev.next = nx.next }
                  else { seen.insert(nx.val); prev = nx }
              }
              return h
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn removeDuplicates(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut seen: HashSet<i32> = HashSet::new();
              let mut cur = &mut head;
              while cur.is_some() {
                  let v = cur.as_ref().unwrap().val;
                  if seen.contains(&v) {
                      let next = cur.as_mut().unwrap().next.take();
                      *cur = next;
                  } else {
                      seen.insert(v);
                      cur = &mut cur.as_mut().unwrap().next;
                  }
              }
              head
          }
        `,
        php: code`
          function removeDuplicates($head) {
              if ($head === null) return null;
              $seen = [$head->val => true];
              $prev = $head;
              while ($prev->next !== null) {
                  if (isset($seen[$prev->next->val])) $prev->next = $prev->next->next;
                  else { $seen[$prev->next->val] = true; $prev = $prev->next; }
              }
              return $head;
          }
        `,
        ruby: code`
          require 'set'

          def removeDuplicates(head)
            return nil if head.nil?
            seen = Set.new([head.val])
            prev = head
            while prev.next
              if seen.include?(prev.next.val)
                prev.next = prev.next.next
              else
                seen << prev.next.val
                prev = prev.next
              end
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Sort a Linked List of 0s, 1s and 2s (GFG) ───────────────────
  (() => {
    const ref = (a: number[]) => a.slice().sort((x, y) => x - y);
    return {
      slug: "sort-a-linked-list-of-0s-1s-and-2s",
      title: "Sort a Linked List of 0s, 1s and 2s",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Sorting", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "segregate", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list in which every node holds `0`, `1` or `2`. Rearrange it so that all the 0s come first, then all the 1s, then all the 2s, and return the head of the sorted list.",
        [
          { in: "head = [1,2,2,1,2,0,2,2]", out: "[0,1,1,2,2,2,2,2]" },
          { in: "head = [2,2,0,1]", out: "[0,1,2,2]" },
          { in: "head = [1]", out: "[1]" },
        ],
        ["1 <= number of nodes <= 10^6", "Node.val is 0, 1 or 2"]),
      hints: [
        "There are only three possible values — a general sort is more than you need.",
        "Count how many 0s, 1s and 2s the list holds in one pass.",
        "In a second pass, overwrite the values: the first `c0` nodes get 0, the next `c1` get 1, the rest 2. (Relinking nodes into three chains works too.)",
      ],
      editorial: explain({
        idea: "With only three distinct values, the sorted list is fully determined by how many of each there are. Count them, then write the values back in order.",
        steps: [
          "Walk the list and count `c0`, `c1`, `c2`.",
          "Walk it again: write 0 into the first `c0` nodes, 1 into the next `c1`, 2 into the rest.",
          "Return `head`.",
        ],
        why: "The sorted sequence of the values is `c0` zeros, `c1` ones and `c2` twos, and the list has exactly `c0 + c1 + c2` nodes, so overwriting them in that order produces the sorted list.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "If the nodes carry more than the value (data you must keep with it), overwrite is not allowed — instead relink the nodes into three chains (zeros, ones, twos) and join them, taking care with empty chains.",
          "A comparison sort on a linked list costs O(n log n) and is easy to get wrong.",
        ],
      }),
      examples: [
        { input: "[1,2,2,1,2,0,2,2]", expectedOutput: "[0,1,1,2,2,2,2,2]" },
        { input: "[2,2,0,1]", expectedOutput: "[0,1,2,2]" },
        { input: "[1]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const vals = pick(rng, [[0, 1, 2], [2], [0, 2], [1, 2], [0]]);
        const a = Array.from({ length: listLen(rng, 1) }, () => pick(rng, vals));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def segregate(head: Optional[ListNode]) -> Optional[ListNode]:
              count = [0, 0, 0]
              node = head
              while node:
                  count[node.val] += 1
                  node = node.next
              node, value = head, 0
              while node:
                  while count[value] == 0:
                      value += 1
                  node.val = value
                  count[value] -= 1
                  node = node.next
              return head
        `,
        javascript: code`
          var segregate = function(head) {
              var count = [0, 0, 0];
              for (var node = head; node !== null; node = node.next) count[node.val]++;
              var value = 0;
              for (node = head; node !== null; node = node.next) {
                  while (count[value] === 0) value++;
                  node.val = value;
                  count[value]--;
              }
              return head;
          };
        `,
        typescript: code`
          function segregate(head: ListNode | null): ListNode | null {
              var count = [0, 0, 0];
              for (var node = head; node !== null; node = node.next) count[node.val]++;
              var value = 0;
              for (node = head; node !== null; node = node.next) {
                  while (count[value] === 0) value++;
                  node.val = value;
                  count[value]--;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode segregate(ListNode head) {
              int[] count = new int[3];
              for (ListNode node = head; node != null; node = node.next) count[node.val]++;
              int value = 0;
              for (ListNode node = head; node != null; node = node.next) {
                  while (count[value] == 0) value++;
                  node.val = value;
                  count[value]--;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* segregate(ListNode* head) {
              int count[3] = {0, 0, 0};
              for (ListNode* node = head; node; node = node->next) count[node->val]++;
              int value = 0;
              for (ListNode* node = head; node; node = node->next) {
                  while (count[value] == 0) value++;
                  node->val = value;
                  count[value]--;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* segregate(struct ListNode* head) {
              int count[3] = {0, 0, 0};
              for (struct ListNode* node = head; node != NULL; node = node->next) count[node->val]++;
              int value = 0;
              for (struct ListNode* node = head; node != NULL; node = node->next) {
                  while (count[value] == 0) value++;
                  node->val = value;
                  count[value]--;
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode Segregate(ListNode head)
          {
              var count = new int[3];
              for (var node = head; node != null; node = node.next) count[node.val]++;
              int value = 0;
              for (var node = head; node != null; node = node.next)
              {
                  while (count[value] == 0) value++;
                  node.val = value;
                  count[value]--;
              }
              return head;
          }
        `,
        go: code`
          func segregate(head *ListNode) *ListNode {
              count := [3]int{}
              for node := head; node != nil; node = node.Next {
                  count[node.Val]++
              }
              value := 0
              for node := head; node != nil; node = node.Next {
                  for count[value] == 0 {
                      value++
                  }
                  node.Val = value
                  count[value]--
              }
              return head
          }
        `,
        kotlin: kt`
          fun segregate(head: ListNode?): ListNode? {
              val count = IntArray(3)
              var node = head
              while (node != null) { count[node.\`val\`]++; node = node.next }
              var value = 0
              node = head
              while (node != null) {
                  while (count[value] == 0) value++
                  node.\`val\` = value
                  count[value]--
                  node = node.next
              }
              return head
          }
        `,
        swift: code`
          func segregate(_ head: ListNode?) -> ListNode? {
              var count = [0, 0, 0]
              var node = head
              while let n = node { count[n.val] += 1; node = n.next }
              var value = 0
              node = head
              while let n = node {
                  while count[value] == 0 { value += 1 }
                  n.val = value
                  count[value] -= 1
                  node = n.next
              }
              return head
          }
        `,
        rust: code`
          fn segregate(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut count = [0usize; 3];
              let mut p = &head;
              while let Some(node) = p {
                  count[node.val as usize] += 1;
                  p = &node.next;
              }
              let mut value = 0;
              let mut q = head.as_mut();
              while let Some(node) = q {
                  while count[value] == 0 {
                      value += 1;
                  }
                  node.val = value as i32;
                  count[value] -= 1;
                  q = node.next.as_mut();
              }
              head
          }
        `,
        php: code`
          function segregate($head) {
              $count = [0, 0, 0];
              for ($node = $head; $node !== null; $node = $node->next) $count[$node->val]++;
              $value = 0;
              for ($node = $head; $node !== null; $node = $node->next) {
                  while ($count[$value] == 0) $value++;
                  $node->val = $value;
                  $count[$value]--;
              }
              return $head;
          }
        `,
        ruby: code`
          def segregate(head)
            count = [0, 0, 0]
            node = head
            while node
              count[node.val] += 1
              node = node.next
            end
            value = 0
            node = head
            while node
              value += 1 while count[value] == 0
              node.val = value
              count[value] -= 1
              node = node.next
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Multiply Two Linked Lists (GFG) ─────────────────────────────
  (() => {
    const MOD = BigInt(1000000007);
    const ref = (a: number[], b: number[]) => String((BigInt(a.join("")) * BigInt(b.join(""))) % MOD);
    return {
      slug: "multiply-two-linked-lists",
      title: "Multiply Two Linked Lists",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Math", "Amazon"],
      signature: { funcName: "multiplyTwoLists", params: [{ name: "first", type: "ListNode" as const }, { name: "second", type: "ListNode" as const }], returns: "int" as const },
      description: describe(
        "Each of the two singly linked lists `first` and `second` holds the decimal digits of a non-negative number, **most significant digit first** (leading zeros are possible). The numbers can be far too large for any integer type.\n\nReturn the product of the two numbers **modulo** `10^9 + 7`.",
        [
          { in: "first = [3,2], second = [2]", out: "64", note: "32 × 2 = 64." },
          { in: "first = [1,0,0], second = [1,0]", out: "1000", note: "100 × 10 = 1000." },
          { in: "first = [9,9,9,9,9,9,9,9,9,9], second = [9,9]", out: "999992978", note: "9,999,999,999 × 99 = 989,999,999,901, which leaves 999,992,978 modulo 10^9 + 7." },
        ],
        ["1 <= number of nodes in each list <= 100", "0 <= Node.val <= 9"]),
      hints: [
        "A 100-digit number does not fit any built-in integer — but you only need its value modulo 10^9 + 7.",
        "Read a number digit by digit with `x = x * 10 + digit`, reducing modulo 10^9 + 7 after every step.",
        "Multiply the two reduced values and reduce again. The product of two values below 10^9 + 7 needs 64-bit arithmetic.",
      ],
      editorial: explain({
        idea: "Taking remainders commutes with addition and multiplication, so each list can be folded into its value modulo `M = 10^9 + 7` with Horner's rule, and the product of those two remainders, reduced once more, is the answer.",
        steps: [
          "Fold the first list: `x = (x * 10 + digit) mod M` for each node.",
          "Fold the second list the same way into `y`.",
          "Return `(x * y) mod M`, computing the product in 64-bit arithmetic.",
        ],
        why: "`(a * 10 + d) mod M = ((a mod M) * 10 + d) mod M` and `(x * y) mod M = ((x mod M) * (y mod M)) mod M`, so reducing at every step never changes the final remainder while keeping every intermediate below `M * 10 + 9` and `M²`.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "`x * y` can reach about 10^18 — use a 64-bit type (and in JavaScript, split the multiplication or use BigInt: a double loses the low digits).",
          "Reduce while folding, not only at the end — the number itself overflows after a few digits.",
          "Leading zeros are ordinary digits; Horner's rule handles them.",
        ],
      }),
      examples: [
        { input: "[3,2]\n[2]", expectedOutput: "64" },
        { input: "[1,0,0]\n[1,0]", expectedOutput: "1000" },
        { input: "[9,9,9,9,9,9,9,9,9,9]\n[9,9]", expectedOutput: "999992978" },
      ],
      gen: (rng: Rng) => {
        const mk = () => {
          const n = ri(rng, 1, pick(rng, [1, 3, 9, 20, 40]));
          const z = rng() < 0.15;
          return Array.from({ length: n }, () => (z && rng() < 0.7 ? 0 : ri(rng, 0, 9)));
        };
        const a = mk(), b = mk();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: ref(a, b) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def multiplyTwoLists(first: Optional[ListNode], second: Optional[ListNode]) -> int:
              MOD = 1000000007

              def fold(node):
                  x = 0
                  while node:
                      x = (x * 10 + node.val) % MOD
                      node = node.next
                  return x

              return fold(first) * fold(second) % MOD
        `,
        javascript: code`
          var multiplyTwoLists = function(first, second) {
              var MOD = 1000000007;
              var fold = function(node) {
                  var x = 0;
                  for (; node !== null; node = node.next) x = (x * 10 + node.val) % MOD;
                  return x;
              };
              var a = fold(first), b = fold(second);
              // a * b can reach 10^18, beyond a double's 2^53: split b into 16-bit halves.
              var hi = Math.floor(b / 65536), lo = b % 65536;
              return ((a * hi) % MOD * 65536 + a * lo) % MOD;
          };
        `,
        typescript: code`
          function multiplyTwoLists(first: ListNode | null, second: ListNode | null): number {
              var MOD = 1000000007;
              function fold(node: ListNode | null): number {
                  var x = 0;
                  for (; node !== null; node = node.next) x = (x * 10 + node.val) % MOD;
                  return x;
              }
              var a = fold(first), b = fold(second);
              // a * b can reach 10^18, beyond a double's 2^53: split b into 16-bit halves.
              var hi = Math.floor(b / 65536), lo = b % 65536;
              return ((a * hi) % MOD * 65536 + a * lo) % MOD;
          }
        `,
        java: code`
          public static int multiplyTwoLists(ListNode first, ListNode second) {
              final long MOD = 1000000007L;
              long a = 0, b = 0;
              for (ListNode node = first; node != null; node = node.next) a = (a * 10 + node.val) % MOD;
              for (ListNode node = second; node != null; node = node.next) b = (b * 10 + node.val) % MOD;
              return (int) (a * b % MOD);
          }
        `,
        cpp: code`
          int multiplyTwoLists(ListNode* first, ListNode* second) {
              const long long MOD = 1000000007LL;
              long long a = 0, b = 0;
              for (ListNode* node = first; node; node = node->next) a = (a * 10 + node->val) % MOD;
              for (ListNode* node = second; node; node = node->next) b = (b * 10 + node->val) % MOD;
              return (int) (a * b % MOD);
          }
        `,
        c: code`
          int multiplyTwoLists(struct ListNode* first, struct ListNode* second) {
              const long long MOD = 1000000007LL;
              long long a = 0, b = 0;
              for (struct ListNode* node = first; node != NULL; node = node->next) a = (a * 10 + node->val) % MOD;
              for (struct ListNode* node = second; node != NULL; node = node->next) b = (b * 10 + node->val) % MOD;
              return (int) (a * b % MOD);
          }
        `,
        csharp: code`
          public static int MultiplyTwoLists(ListNode first, ListNode second)
          {
              const long MOD = 1000000007L;
              long a = 0, b = 0;
              for (var node = first; node != null; node = node.next) a = (a * 10 + node.val) % MOD;
              for (var node = second; node != null; node = node.next) b = (b * 10 + node.val) % MOD;
              return (int) (a * b % MOD);
          }
        `,
        go: code`
          func multiplyTwoLists(first *ListNode, second *ListNode) int {
              const MOD = 1000000007
              var a, b int64
              for node := first; node != nil; node = node.Next {
                  a = (a*10 + int64(node.Val)) % MOD
              }
              for node := second; node != nil; node = node.Next {
                  b = (b*10 + int64(node.Val)) % MOD
              }
              return int(a * b % MOD)
          }
        `,
        kotlin: kt`
          fun multiplyTwoLists(first: ListNode?, second: ListNode?): Int {
              val MOD = 1000000007L
              fun fold(head: ListNode?): Long {
                  var x = 0L
                  var node = head
                  while (node != null) { x = (x * 10 + node.\`val\`) % MOD; node = node.next }
                  return x
              }
              return (fold(first) * fold(second) % MOD).toInt()
          }
        `,
        swift: code`
          func multiplyTwoLists(_ first: ListNode?, _ second: ListNode?) -> Int {
              let MOD = 1000000007
              func fold(_ head: ListNode?) -> Int {
                  var x = 0
                  var node = head
                  while let n = node { x = (x * 10 + n.val) % MOD; node = n.next }
                  return x
              }
              return fold(first) * fold(second) % MOD
          }
        `,
        rust: code`
          fn multiplyTwoLists(first: Option<Box<ListNode>>, second: Option<Box<ListNode>>) -> i32 {
              const MOD: i64 = 1000000007;
              fn fold(head: &Option<Box<ListNode>>) -> i64 {
                  let mut x: i64 = 0;
                  let mut node = head;
                  while let Some(n) = node {
                      x = (x * 10 + n.val as i64) % MOD;
                      node = &n.next;
                  }
                  x
              }
              (fold(&first) * fold(&second) % MOD) as i32
          }
        `,
        php: code`
          function multiplyTwoLists($first, $second) {
              $MOD = 1000000007;
              $a = 0;
              $b = 0;
              for ($node = $first; $node !== null; $node = $node->next) $a = ($a * 10 + $node->val) % $MOD;
              for ($node = $second; $node !== null; $node = $node->next) $b = ($b * 10 + $node->val) % $MOD;
              return $a * $b % $MOD;
          }
        `,
        ruby: code`
          def multiplyTwoLists(first, second)
            mod = 1_000_000_007
            fold = lambda do |node|
              x = 0
              while node
                x = (x * 10 + node.val) % mod
                node = node.next
              end
              x
            end
            fold.call(first) * fold.call(second) % mod
          end
        `,
      },
    };
  })(),

  // ── Nth Node From End of Linked List (GFG) ──────────────────────
  (() => {
    const ref = (a: number[], n: number) => (n > a.length ? -1 : a[a.length - n]);
    return {
      slug: "nth-node-from-end-of-linked-list",
      title: "Nth Node From End of Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Samsung"],
      signature: { funcName: "getNthFromLast", params: [{ name: "head", type: "ListNode" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given the `head` of a singly linked list and an integer `n`, return the **value** of the `n`-th node counted from the end of the list (the last node is the 1st from the end).\n\nIf the list has fewer than `n` nodes, return `-1`.",
        [
          { in: "head = [1,2,3,4,5,6,7,8,9], n = 2", out: "8" },
          { in: "head = [10,5,100,5], n = 5", out: "-1", note: "The list has only four nodes." },
          { in: "head = [4,7], n = 2", out: "4", note: "The 2nd node from the end of a two-node list is its head." },
        ],
        ["1 <= number of nodes <= 10^6", "1 <= Node.val <= 10^4", "1 <= n <= 10^6"]),
      hints: [
        "Counting the nodes and walking `length - n` steps takes two passes.",
        "For one pass, use two pointers that stay exactly `n` nodes apart.",
        "Advance the first pointer `n` steps (if it falls off the list, return -1), then move both until the first one falls off; the second is on the answer.",
      ],
      editorial: explain({
        idea: "Keep a gap of `n` nodes between two pointers. When the leading pointer runs off the end, the trailing one is exactly `n` nodes before the end.",
        steps: [
          "Move `lead` forward `n` times from `head`; if it becomes null before finishing, the list is too short — return -1.",
          "Set `trail = head`.",
          "While `lead` is not null, advance both `lead` and `trail` by one.",
          "Return `trail.val`.",
        ],
        why: "After the first phase `lead` is `n` nodes ahead of `trail`, and moving both keeps that gap. When `lead` is past the last node (position `L`), `trail` is at position `L - n`, which is the `n`-th node from the end.",
        time: "O(L)",
        space: "O(1)",
        pitfalls: [
          "`n` equal to the length is valid and gives the head; only `n > L` returns -1.",
          "Check for null on every step of the first phase, not just at the end.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8,9]\n2", expectedOutput: "8" },
        { input: "[10,5,100,5]\n5", expectedOutput: "-1" },
        { input: "[4,7]\n2", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const a = Array.from({ length: listLen(rng, 1) }, () => ri(rng, 1, 10000));
        const n = rng() < 0.85 ? ri(rng, 1, a.length) : ri(rng, a.length + 1, a.length + pick(rng, [1, 5, 1000000 - a.length]));
        return { input: `${fmtIntArr(a)}\n${n}`, expectedOutput: String(ref(a, n)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getNthFromLast(head: Optional[ListNode], n: int) -> int:
              lead = head
              for _ in range(n):
                  if lead is None:
                      return -1
                  lead = lead.next
              trail = head
              while lead:
                  lead, trail = lead.next, trail.next
              return trail.val
        `,
        javascript: code`
          var getNthFromLast = function(head, n) {
              var lead = head;
              for (var i = 0; i < n; i++) {
                  if (lead === null) return -1;
                  lead = lead.next;
              }
              var trail = head;
              while (lead !== null) { lead = lead.next; trail = trail.next; }
              return trail.val;
          };
        `,
        typescript: code`
          function getNthFromLast(head: ListNode | null, n: number): number {
              var lead = head;
              for (var i = 0; i < n; i++) {
                  if (lead === null) return -1;
                  lead = lead.next;
              }
              var trail = head;
              while (lead !== null) { lead = lead.next; trail = trail.next; }
              return trail.val;
          }
        `,
        java: code`
          public static int getNthFromLast(ListNode head, int n) {
              ListNode lead = head;
              for (int i = 0; i < n; i++) {
                  if (lead == null) return -1;
                  lead = lead.next;
              }
              ListNode trail = head;
              while (lead != null) { lead = lead.next; trail = trail.next; }
              return trail.val;
          }
        `,
        cpp: code`
          int getNthFromLast(ListNode* head, int n) {
              ListNode* lead = head;
              for (int i = 0; i < n; i++) {
                  if (!lead) return -1;
                  lead = lead->next;
              }
              ListNode* trail = head;
              while (lead) { lead = lead->next; trail = trail->next; }
              return trail->val;
          }
        `,
        c: code`
          int getNthFromLast(struct ListNode* head, int n) {
              struct ListNode* lead = head;
              for (int i = 0; i < n; i++) {
                  if (lead == NULL) return -1;
                  lead = lead->next;
              }
              struct ListNode* trail = head;
              while (lead != NULL) { lead = lead->next; trail = trail->next; }
              return trail->val;
          }
        `,
        csharp: code`
          public static int GetNthFromLast(ListNode head, int n)
          {
              var lead = head;
              for (int i = 0; i < n; i++)
              {
                  if (lead == null) return -1;
                  lead = lead.next;
              }
              var trail = head;
              while (lead != null) { lead = lead.next; trail = trail.next; }
              return trail.val;
          }
        `,
        go: code`
          func getNthFromLast(head *ListNode, n int) int {
              lead := head
              for i := 0; i < n; i++ {
                  if lead == nil {
                      return -1
                  }
                  lead = lead.Next
              }
              trail := head
              for lead != nil {
                  lead, trail = lead.Next, trail.Next
              }
              return trail.Val
          }
        `,
        kotlin: kt`
          fun getNthFromLast(head: ListNode?, n: Int): Int {
              var lead = head
              for (i in 0 until n) {
                  if (lead == null) return -1
                  lead = lead.next
              }
              var trail = head!!
              while (lead != null) { lead = lead.next; trail = trail.next!! }
              return trail.\`val\`
          }
        `,
        swift: code`
          func getNthFromLast(_ head: ListNode?, _ n: Int) -> Int {
              var lead = head
              for _ in 0..<n {
                  guard let l = lead else { return -1 }
                  lead = l.next
              }
              var trail = head!
              while let l = lead { lead = l.next; trail = trail.next! }
              return trail.val
          }
        `,
        rust: code`
          fn getNthFromLast(head: Option<Box<ListNode>>, n: i32) -> i32 {
              let mut lead = &head;
              for _ in 0..n {
                  match lead {
                      None => return -1,
                      Some(node) => lead = &node.next,
                  }
              }
              let mut trail = &head;
              while let Some(node) = lead {
                  lead = &node.next;
                  trail = &trail.as_ref().unwrap().next;
              }
              trail.as_ref().unwrap().val
          }
        `,
        php: code`
          function getNthFromLast($head, $n) {
              $lead = $head;
              for ($i = 0; $i < $n; $i++) {
                  if ($lead === null) return -1;
                  $lead = $lead->next;
              }
              $trail = $head;
              while ($lead !== null) { $lead = $lead->next; $trail = $trail->next; }
              return $trail->val;
          }
        `,
        ruby: code`
          def getNthFromLast(head, n)
            lead = head
            n.times do
              return -1 if lead.nil?
              lead = lead.next
            end
            trail = head
            while lead
              lead = lead.next
              trail = trail.next
            end
            trail.val
          end
        `,
      },
    };
  })(),

  // ── Insert in a Sorted Linked List (GFG) ────────────────────────
  (() => {
    const ref = (a: number[], data: number) => a.concat([data]).sort((x, y) => x - y);
    return {
      slug: "insert-in-a-sorted-linked-list",
      title: "Insert in a Sorted Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Amazon", "Microsoft"],
      signature: { funcName: "sortedInsert", params: [{ name: "head", type: "ListNode" as const }, { name: "data", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list sorted in **non-decreasing** order and an integer `data`. Insert a new node holding `data` so that the list stays sorted, and return the head of the list.",
        [
          { in: "head = [25,36,47,58,69,80], data = 19", out: "[19,25,36,47,58,69,80]", note: "19 is smaller than everything, so the new node becomes the head." },
          { in: "head = [50,100], data = 75", out: "[50,75,100]" },
          { in: "head = [1,3,3,7], data = 3", out: "[1,3,3,3,7]" },
        ],
        ["0 <= number of nodes <= 10^4", "-10^4 <= Node.val, data <= 10^4", "The list is sorted in non-decreasing order"]),
      hints: [
        "The new node goes right before the first node whose value is larger than `data` (or at the end).",
        "To insert there you need the node before that position — and the head has none.",
        "Handle the new-head case first (empty list or `data` < head's value); otherwise walk while `cur.next` exists and `cur.next.val < data`, then splice the node in after `cur`.",
      ],
      editorial: explain({
        idea: "Find the last node whose value is smaller than `data` and splice the new node in after it. If there is no such node, the new node becomes the head.",
        steps: [
          "Create the node `x` holding `data`.",
          "If the list is empty or `data <= head.val`, set `x.next = head` and return `x`.",
          "Otherwise walk `cur` from `head` while `cur.next` exists and `cur.next.val < data`.",
          "Set `x.next = cur.next`, `cur.next = x`, and return `head`.",
        ],
        why: "When the walk stops, every node up to `cur` holds a value below `data`, and `cur.next` (if any) holds a value at least `data`. Putting `x` between them keeps every adjacent pair in order, so the list stays sorted.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Inserting before the head changes the head — return the new node in that case.",
          "Check `cur.next` for null before reading its value; the new node may belong at the tail.",
          "An empty list becomes a single node.",
        ],
      }),
      examples: [
        { input: "[25,36,47,58,69,80]\n19", expectedOutput: "[19,25,36,47,58,69,80]" },
        { input: "[50,100]\n75", expectedOutput: "[50,75,100]" },
        { input: "[1,3,3,7]\n3", expectedOutput: "[1,3,3,3,7]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [3, 50, 10000]);
        const a = Array.from({ length: listLen(rng) }, () => ri(rng, -span, span)).sort((x, y) => x - y);
        const data = rng() < 0.3 && a.length ? pick(rng, a) : ri(rng, -span - 2, span + 2);
        return { input: `${fmtIntArr(a)}\n${data}`, expectedOutput: fmtIntArr(ref(a, data)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sortedInsert(head: Optional[ListNode], data: int) -> Optional[ListNode]:
              node = ListNode(data)
              if head is None or data <= head.val:
                  node.next = head
                  return node
              cur = head
              while cur.next and cur.next.val < data:
                  cur = cur.next
              node.next = cur.next
              cur.next = node
              return head
        `,
        javascript: code`
          var sortedInsert = function(head, data) {
              var node = new ListNode(data);
              if (head === null || data <= head.val) { node.next = head; return node; }
              var cur = head;
              while (cur.next !== null && cur.next.val < data) cur = cur.next;
              node.next = cur.next;
              cur.next = node;
              return head;
          };
        `,
        typescript: code`
          function sortedInsert(head: ListNode | null, data: number): ListNode | null {
              var node = new ListNode(data);
              if (head === null || data <= head.val) { node.next = head; return node; }
              var cur = head;
              while (cur.next !== null && cur.next.val < data) cur = cur.next;
              node.next = cur.next;
              cur.next = node;
              return head;
          }
        `,
        java: code`
          public static ListNode sortedInsert(ListNode head, int data) {
              ListNode node = new ListNode(data);
              if (head == null || data <= head.val) { node.next = head; return node; }
              ListNode cur = head;
              while (cur.next != null && cur.next.val < data) cur = cur.next;
              node.next = cur.next;
              cur.next = node;
              return head;
          }
        `,
        cpp: code`
          ListNode* sortedInsert(ListNode* head, int data) {
              ListNode* node = new ListNode(data);
              if (!head || data <= head->val) { node->next = head; return node; }
              ListNode* cur = head;
              while (cur->next && cur->next->val < data) cur = cur->next;
              node->next = cur->next;
              cur->next = node;
              return head;
          }
        `,
        c: code`
          struct ListNode* sortedInsert(struct ListNode* head, int data) {
              struct ListNode* node = (struct ListNode*) malloc(sizeof(struct ListNode));
              node->val = data;
              if (head == NULL || data <= head->val) { node->next = head; return node; }
              struct ListNode* cur = head;
              while (cur->next != NULL && cur->next->val < data) cur = cur->next;
              node->next = cur->next;
              cur->next = node;
              return head;
          }
        `,
        csharp: code`
          public static ListNode SortedInsert(ListNode head, int data)
          {
              var node = new ListNode(data);
              if (head == null || data <= head.val) { node.next = head; return node; }
              var cur = head;
              while (cur.next != null && cur.next.val < data) cur = cur.next;
              node.next = cur.next;
              cur.next = node;
              return head;
          }
        `,
        go: code`
          func sortedInsert(head *ListNode, data int) *ListNode {
              node := &ListNode{Val: data}
              if head == nil || data <= head.Val {
                  node.Next = head
                  return node
              }
              cur := head
              for cur.Next != nil && cur.Next.Val < data {
                  cur = cur.Next
              }
              node.Next = cur.Next
              cur.Next = node
              return head
          }
        `,
        kotlin: kt`
          fun sortedInsert(head: ListNode?, data: Int): ListNode? {
              val node = ListNode(data)
              if (head == null || data <= head.\`val\`) { node.next = head; return node }
              var cur: ListNode = head
              while (true) {
                  val nx = cur.next
                  if (nx == null || nx.\`val\` >= data) break
                  cur = nx
              }
              node.next = cur.next
              cur.next = node
              return head
          }
        `,
        swift: code`
          func sortedInsert(_ head: ListNode?, _ data: Int) -> ListNode? {
              let node = ListNode(data)
              guard let h = head, data > h.val else { node.next = head; return node }
              var cur = h
              while let nx = cur.next, nx.val < data { cur = nx }
              node.next = cur.next
              cur.next = node
              return h
          }
        `,
        rust: code`
          fn sortedInsert(head: Option<Box<ListNode>>, data: i32) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut cur = &mut head;
              while cur.as_ref().map_or(false, |n| n.val < data) {
                  cur = &mut cur.as_mut().unwrap().next;
              }
              let mut node = Box::new(ListNode::new(data));
              node.next = cur.take();
              *cur = Some(node);
              head
          }
        `,
        php: code`
          function sortedInsert($head, $data) {
              $node = new ListNode($data);
              if ($head === null || $data <= $head->val) { $node->next = $head; return $node; }
              $cur = $head;
              while ($cur->next !== null && $cur->next->val < $data) $cur = $cur->next;
              $node->next = $cur->next;
              $cur->next = $node;
              return $head;
          }
        `,
        ruby: code`
          def sortedInsert(head, data)
            node = ListNode.new(data)
            if head.nil? || data <= head.val
              node.next = head
              return node
            end
            cur = head
            cur = cur.next while cur.next && cur.next.val < data
            node.next = cur.next
            cur.next = node
            head
          end
        `,
      },
    };
  })(),

];

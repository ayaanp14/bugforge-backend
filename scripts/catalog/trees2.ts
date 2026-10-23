/**
 * Binary tree problems — wave 7, batch 28.
 * Real problems only: LeetCode numbered classics and GeeksforGeeks staples
 * (Left View, Sum Tree, Children Sum, Isomorphic Trees, Ceil in BST, …).
 * Worked examples are phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a tree is LeetCode's level order
 * with `null` for a missing child and trailing nulls dropped, `[]` for the
 * empty tree; every input and expected output here goes through
 * `fmtTree(treeFrom(…))` so it is always canonical. The node types are the
 * judge's — no solution redefines them. A problem LeetCode or GFG answers with
 * "a node" returns its value; one GFG declares `void` (Transform to Sum Tree)
 * returns the root after the change; "in any order" is fixed to level order
 * (left to right, top to bottom) in the statement.
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel; JS
 * solutions are Node 12-safe (no ??, ?., at(), replaceAll, flat or flatMap);
 * the C harness has no math.h or limits.h. Each solution's main function comes
 * first — C and C++ declare their helpers with a prototype above it.
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
  code, describe, explain, fmtIntArr, fmtTree, pick, randBST, randTree, ri, shuffle, treeFrom,
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

const cloneTree = (t: TNode | null): TNode | null => (t ? { val: t.val, left: cloneTree(t.left), right: cloneTree(t.right) } : null);
const heightOf = (t: TNode | null): number => (t ? 1 + Math.max(heightOf(t.left), heightOf(t.right)) : 0);
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

const sizeOf = (rng: Rng, caps: number[]) => ri(rng, 1, pick(rng, caps));

export const TREES2_PROBLEMS: CatalogProblem[] = [

  // ── Search in a Binary Search Tree (LC 700) ─────────────────────
  (() => {
    const ref = (root: TNode | null, target: number) => {
      let node = root;
      while (node && node.val !== target) node = target < node.val ? node.left : node.right;
      return node;
    };
    const EX = [
      { root: [4, 2, 7, 1, 3], target: 2, note: "The node holding 2 has children 1 and 3, so its subtree is `[2,1,3]`." },
      { root: [4, 2, 7, 1, 3], target: 5, note: "5 would sit as the left child of 7, but that spot is empty: no node holds 5." },
      { root: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], target: 10, note: "10 has no left child and a right child 14, whose left child is 13." },
    ];
    return {
      slug: "search-in-a-binary-search-tree",
      title: "Search in a Binary Search Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Binary Search", "Amazon", "Microsoft", "Apple"],
      signature: { funcName: "searchBST", params: [{ name: "root", type: "TreeNode" as const }, { name: "target", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a **binary search tree** (every value in a node's left subtree is smaller than the node's value, every value in its right subtree is larger) and an integer `target`.\n\nFind the node whose value equals `target` and return the **subtree rooted at that node**. If no node holds `target`, return the empty tree `[]`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, target = ${e.target}`, out: fmtTree(ref(treeFrom(e.root), e.target)), note: e.note })),
        ["1 <= number of nodes <= 5000", "1 <= Node.val <= 10^7", "all node values are distinct", "root is a valid binary search tree", "1 <= target <= 10^7"]),
      hints: [
        "You never need to look at both subtrees: the ordering tells you which side `target` must be on.",
        "Compare `target` with the current node — equal means found, smaller means go left, larger means go right.",
        "Walk down until you either hit the value or fall off the tree; the node you stopped on (or null) is the answer.",
      ],
      editorial: explain({
        idea: "The search-tree ordering turns the search into a single walk from the root: at each node exactly one subtree can contain `target`, so the other is skipped entirely.",
        steps: [
          "Start at the root.",
          "While the current node exists and its value is not `target`: move to the left child if `target` is smaller, otherwise to the right child.",
          "Return the current node — the subtree rooted there, or null (the empty tree) if the walk fell off.",
        ],
        why: "If `target` is smaller than a node's value, every value in the right subtree is larger still, so `target` can only be on the left — and symmetrically on the right. The walk therefore never skips the node that holds `target`, and stops on it if it exists.",
        time: "O(h), h the height of the tree (O(log n) when balanced, O(n) for a chain)",
        space: "O(1)",
        pitfalls: [
          "Return the node itself, not a copy of its value: the answer is the whole subtree hanging below it.",
          "Searching both subtrees still works but throws away the reason the tree is ordered.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.target)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 2, 100, 10000000]);
        const root = randBST(rng, n, 1, hi);
        const target = rng() < 0.65 ? pick(rng, nodesOf(root).map((x) => x.val)) : ri(rng, 1, hi);
        return { input: `${fmtTree(root)}\n${target}`, expectedOutput: fmtTree(ref(root, target)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def searchBST(root: Optional[TreeNode], target: int) -> Optional[TreeNode]:
              node = root
              while node is not None and node.val != target:
                  node = node.left if target < node.val else node.right
              return node
        `,
        javascript: code`
          var searchBST = function(root, target) {
              var node = root;
              while (node !== null && node.val !== target) node = target < node.val ? node.left : node.right;
              return node;
          };
        `,
        typescript: code`
          function searchBST(root: TreeNode | null, target: number): TreeNode | null {
              var node = root;
              while (node !== null && node.val !== target) node = target < node.val ? node.left : node.right;
              return node;
          }
        `,
        java: code`
          public static TreeNode searchBST(TreeNode root, int target) {
              TreeNode node = root;
              while (node != null && node.val != target) node = target < node.val ? node.left : node.right;
              return node;
          }
        `,
        cpp: code`
          TreeNode* searchBST(TreeNode* root, int target) {
              TreeNode* node = root;
              while (node && node->val != target) node = target < node->val ? node->left : node->right;
              return node;
          }
        `,
        c: code`
          struct TreeNode* searchBST(struct TreeNode* root, int target) {
              struct TreeNode* node = root;
              while (node != NULL && node->val != target) node = target < node->val ? node->left : node->right;
              return node;
          }
        `,
        csharp: code`
          public static TreeNode SearchBST(TreeNode root, int target)
          {
              var node = root;
              while (node != null && node.val != target) node = target < node.val ? node.left : node.right;
              return node;
          }
        `,
        go: code`
          func searchBST(root *TreeNode, target int) *TreeNode {
              node := root
              for node != nil && node.Val != target {
                  if target < node.Val {
                      node = node.Left
                  } else {
                      node = node.Right
                  }
              }
              return node
          }
        `,
        kotlin: kt(`
          fun searchBST(root: TreeNode?, target: Int): TreeNode? {
              var node = root
              while (node != null && node.\`val\` != target) node = if (target < node.\`val\`) node.left else node.right
              return node
          }
        `),
        swift: code`
          func searchBST(_ root: TreeNode?, _ target: Int) -> TreeNode? {
              var node = root
              while let n = node, n.val != target {
                  node = target < n.val ? n.left : n.right
              }
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn searchBST(root: Option<Rc<RefCell<TreeNode>>>, target: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let mut cur = root;
              while let Some(n) = cur {
                  let v = n.borrow().val;
                  if v == target {
                      return Some(n);
                  }
                  let next = if target < v { n.borrow().left.clone() } else { n.borrow().right.clone() };
                  cur = next;
              }
              None
          }
        `,
        php: code`
          function searchBST($root, $target) {
              $node = $root;
              while ($node !== null && $node->val != $target) {
                  $node = $target < $node->val ? $node->left : $node->right;
              }
              return $node;
          }
        `,
        ruby: code`
          def searchBST(root, target)
            node = root
            node = target < node.val ? node.left : node.right while node && node.val != target
            node
          end
        `,
      },
    };
  })(),

  // ── Leaf-Similar Trees (LC 872) ─────────────────────────────────
  (() => {
    const leavesOf = (root: TNode | null) => nodesOf(root).filter(isLeaf).map((n) => n.val);
    const ref = (a: TNode | null, b: TNode | null) => JSON.stringify(leavesOf(a)) === JSON.stringify(leavesOf(b));
    const EX = [
      { r1: [3, 5, 1, 6, 2, 9, 8, null, null, 7, 4], r2: [3, 5, 1, 6, 7, 4, 2, null, null, null, null, null, null, 9, 8], note: "Both trees read 6, 7, 4, 9, 8 along their leaves from left to right." },
      { r1: [1, 2, 3], r2: [1, 3, 2], note: "The leaves read 2, 3 in the first tree and 3, 2 in the second: same values, different order." },
      { r1: [1], r2: [2, null, 1], note: "A lone root is its own leaf. The second tree's only leaf is also 1." },
    ];
    return {
      slug: "leaf-similar-trees",
      title: "Leaf-Similar Trees",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google"],
      signature: { funcName: "leafSimilar", params: [{ name: "root1", type: "TreeNode" as const }, { name: "root2", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Read the leaves of a binary tree (the nodes with no children) from left to right: that sequence of values is the tree's **leaf value sequence**.\n\nGiven the roots of two binary trees `root1` and `root2`, return `true` if their leaf value sequences are identical, and `false` otherwise. The two trees may have completely different shapes.",
        EX.map((e) => ({ in: `root1 = ${lv(e.r1)}, root2 = ${lv(e.r2)}`, out: String(ref(treeFrom(e.r1), treeFrom(e.r2))), note: e.note })),
        ["1 <= number of nodes in each tree <= 200", "0 <= Node.val <= 200"]),
      hints: [
        "Only the leaves matter, and only their left-to-right order.",
        "Any depth-first traversal that visits the left subtree before the right one meets the leaves in left-to-right order.",
        "Collect each tree's leaves into a list and compare the two lists element by element (lengths included).",
      ],
      editorial: explain({
        idea: "A depth-first traversal that always goes left before right reaches the leaves in exactly left-to-right order, so each tree's leaf sequence is one traversal away.",
        steps: [
          "Traverse the first tree depth-first (left before right), appending every node with no children to a list.",
          "Do the same for the second tree.",
          "Return whether the two lists are equal — same length and the same value at every position.",
        ],
        why: "In a preorder walk every node of a left subtree is visited before any node of the right subtree, at every level of the recursion, so two leaves are appended in the order they appear across the tree from left to right.",
        time: "O(n1 + n2)",
        space: "O(n1 + n2) for the two sequences and the traversal stacks",
        pitfalls: [
          "Comparing only the multiset of leaf values is wrong: `[1,2,3]` and `[1,3,2]` hold the same leaves in a different order.",
          "Push the right child before the left on an explicit stack, or the leaves come out right to left.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.r1)}\n${lv(e.r2)}`, expectedOutput: String(ref(treeFrom(e.r1), treeFrom(e.r2))) })),
      gen: (rng: Rng) => {
        const hi = pick(rng, [2, 5, 200]);
        const t1 = shapeTree(rng, sizeOf(rng, [1, 4, 12, 30]), 0, hi);
        let t2: TNode | null = null;
        if (rng() < 0.6) {
          const leaves = leavesOf(t1);
          for (let tries = 0; tries < 400 && !t2; tries++) {
            const c = shapeTree(rng, ri(rng, leaves.length, Math.min(40, 3 * leaves.length)), 0, hi);
            const cl = nodesOf(c).filter(isLeaf);
            if (cl.length === leaves.length) { cl.forEach((n, i) => { n.val = leaves[i]; }); t2 = c; }
          }
          if (t2 && rng() < 0.3) {
            const cl = nodesOf(t2).filter(isLeaf);
            if (cl.length >= 2 && rng() < 0.5) { const i = ri(rng, 0, cl.length - 2); const t = cl[i].val; cl[i].val = cl[i + 1].val; cl[i + 1].val = t; }
            else pick(rng, cl).val = ri(rng, 0, hi);
          }
        }
        if (!t2) t2 = shapeTree(rng, sizeOf(rng, [1, 4, 12, 30]), 0, hi);
        return { input: `${fmtTree(t1)}\n${fmtTree(t2)}`, expectedOutput: String(ref(t1, t2)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def leafSimilar(root1: Optional[TreeNode], root2: Optional[TreeNode]) -> bool:
              return leaves(root1) == leaves(root2)

          def leaves(root: Optional[TreeNode]) -> List[int]:
              out = []
              stack = [root] if root else []
              while stack:
                  node = stack.pop()
                  if node.left is None and node.right is None:
                      out.append(node.val)
                  if node.right:
                      stack.append(node.right)
                  if node.left:
                      stack.append(node.left)
              return out
        `,
        javascript: code`
          var leafSimilar = function(root1, root2) {
              var a = leaves(root1), b = leaves(root2);
              if (a.length !== b.length) return false;
              for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
              return true;
          };

          var leaves = function(root) {
              var out = [], stack = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.left === null && node.right === null) out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              return out;
          };
        `,
        typescript: code`
          function leafSimilar(root1: TreeNode | null, root2: TreeNode | null): boolean {
              var a = leaves(root1), b = leaves(root2);
              if (a.length !== b.length) return false;
              for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
              return true;
          }

          function leaves(root: TreeNode | null): number[] {
              var out: number[] = [];
              var stack: TreeNode[] = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (node.left === null && node.right === null) out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              return out;
          }
        `,
        java: code`
          public static boolean leafSimilar(TreeNode root1, TreeNode root2) {
              return leaves(root1).equals(leaves(root2));
          }

          static List<Integer> leaves(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              if (root != null) stack.push(root);
              while (!stack.isEmpty()) {
                  TreeNode node = stack.pop();
                  if (node.left == null && node.right == null) out.add(node.val);
                  if (node.right != null) stack.push(node.right);
                  if (node.left != null) stack.push(node.left);
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> leaves(TreeNode* root);

          bool leafSimilar(TreeNode* root1, TreeNode* root2) {
              return leaves(root1) == leaves(root2);
          }

          vector<int> leaves(TreeNode* root) {
              vector<int> out;
              vector<TreeNode*> stack;
              if (root) stack.push_back(root);
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  if (!node->left && !node->right) out.push_back(node->val);
                  if (node->right) stack.push_back(node->right);
                  if (node->left) stack.push_back(node->left);
              }
              return out;
          }
        `,
        c: code`
          static int leaves(struct TreeNode* root, int* out);

          bool leafSimilar(struct TreeNode* root1, struct TreeNode* root2) {
              int a[256], b[256];
              int na = leaves(root1, a), nb = leaves(root2, b);
              if (na != nb) return false;
              for (int i = 0; i < na; i++) if (a[i] != b[i]) return false;
              return true;
          }

          static int leaves(struct TreeNode* root, int* out) {
              struct TreeNode* stack[256];
              int top = 0, n = 0;
              if (root != NULL) stack[top++] = root;
              while (top > 0) {
                  struct TreeNode* node = stack[--top];
                  if (node->left == NULL && node->right == NULL) out[n++] = node->val;
                  if (node->right != NULL) stack[top++] = node->right;
                  if (node->left != NULL) stack[top++] = node->left;
              }
              return n;
          }
        `,
        csharp: code`
          public static bool LeafSimilar(TreeNode root1, TreeNode root2)
          {
              var a = Leaves(root1);
              var b = Leaves(root2);
              if (a.Count != b.Count) return false;
              for (int i = 0; i < a.Count; i++) if (a[i] != b[i]) return false;
              return true;
          }

          static List<int> Leaves(TreeNode root)
          {
              var output = new List<int>();
              var stack = new Stack<TreeNode>();
              if (root != null) stack.Push(root);
              while (stack.Count > 0)
              {
                  var node = stack.Pop();
                  if (node.left == null && node.right == null) output.Add(node.val);
                  if (node.right != null) stack.Push(node.right);
                  if (node.left != null) stack.Push(node.left);
              }
              return output;
          }
        `,
        go: code`
          func leafSimilar(root1 *TreeNode, root2 *TreeNode) bool {
              a, b := leaves(root1), leaves(root2)
              if len(a) != len(b) {
                  return false
              }
              for i := range a {
                  if a[i] != b[i] {
                      return false
                  }
              }
              return true
          }

          func leaves(root *TreeNode) []int {
              out := []int{}
              stack := []*TreeNode{}
              if root != nil {
                  stack = append(stack, root)
              }
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if node.Left == nil && node.Right == nil {
                      out = append(out, node.Val)
                  }
                  if node.Right != nil {
                      stack = append(stack, node.Right)
                  }
                  if node.Left != nil {
                      stack = append(stack, node.Left)
                  }
              }
              return out
          }
        `,
        kotlin: kt(`
          fun leafSimilar(root1: TreeNode?, root2: TreeNode?): Boolean {
              return leaves(root1) == leaves(root2)
          }

          fun leaves(root: TreeNode?): List<Int> {
              val out = ArrayList<Int>()
              val stack = ArrayList<TreeNode>()
              if (root != null) stack.add(root)
              while (stack.isNotEmpty()) {
                  val node = stack.removeAt(stack.size - 1)
                  val l = node.left
                  val r = node.right
                  if (l == null && r == null) out.add(node.\`val\`)
                  if (r != null) stack.add(r)
                  if (l != null) stack.add(l)
              }
              return out
          }
        `),
        swift: code`
          func leafSimilar(_ root1: TreeNode?, _ root2: TreeNode?) -> Bool {
              return leaves(root1) == leaves(root2)
          }

          func leaves(_ root: TreeNode?) -> [Int] {
              var out: [Int] = []
              var stack: [TreeNode] = []
              if let r = root { stack.append(r) }
              while let node = stack.popLast() {
                  if node.left == nil && node.right == nil { out.append(node.val) }
                  if let r = node.right { stack.append(r) }
                  if let l = node.left { stack.append(l) }
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn leafSimilar(root1: Option<Rc<RefCell<TreeNode>>>, root2: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut a: Vec<i32> = Vec::new();
              let mut b: Vec<i32> = Vec::new();
              leaves(&root1, &mut a);
              leaves(&root2, &mut b);
              a == b
          }

          fn leaves(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut Vec<i32>) {
              if let Some(n) = node {
                  let n = n.borrow();
                  if n.left.is_none() && n.right.is_none() {
                      out.push(n.val);
                  }
                  leaves(&n.left, out);
                  leaves(&n.right, out);
              }
          }
        `,
        php: code`
          function leafSimilar($root1, $root2) {
              return leavesOf($root1) === leavesOf($root2);
          }

          function leavesOf($root) {
              $out = [];
              $stack = $root === null ? [] : [$root];
              while (!empty($stack)) {
                  $node = array_pop($stack);
                  if ($node->left === null && $node->right === null) $out[] = $node->val;
                  if ($node->right !== null) $stack[] = $node->right;
                  if ($node->left !== null) $stack[] = $node->left;
              }
              return $out;
          }
        `,
        ruby: code`
          def leafSimilar(root1, root2)
            leaves_of(root1) == leaves_of(root2)
          end

          def leaves_of(root)
            out = []
            stack = root ? [root] : []
            until stack.empty?
              node = stack.pop
              out << node.val if node.left.nil? && node.right.nil?
              stack << node.right if node.right
              stack << node.left if node.left
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Increasing Order Search Tree (LC 897) ───────────────────────
  (() => {
    const ref = (root: TNode | null): TNode | null => {
      const vals: number[] = [];
      const walk = (n: TNode | null) => { if (!n) return; walk(n.left); vals.push(n.val); walk(n.right); };
      walk(root);
      let head: TNode | null = null;
      for (let i = vals.length - 1; i >= 0; i--) head = { val: vals[i], left: null, right: head };
      return head;
    };
    const EX = [
      { root: [5, 3, 6, 2, 4, null, 8, 1, null, null, null, 7, 9], note: "In order the values are 1, 2, …, 9; each becomes the right child of the one before." },
      { root: [5, 1, 7], note: "In order: 1, 5, 7." },
      { root: [1], note: "A single node is already a chain." },
    ];
    return {
      slug: "increasing-order-search-tree",
      title: "Increasing Order Search Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Amazon", "Google"],
      signature: { funcName: "increasingBST", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree.\n\nRearrange the tree so that it becomes a chain in **increasing (in-order) order**: the node with the smallest value is the new root, no node has a left child, and every node's right child is the node that follows it in order. Return the new root.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 100", "0 <= Node.val <= 1000", "all node values are distinct"]),
      hints: [
        "In a binary search tree the in-order traversal visits the values in increasing order — that order is exactly the chain you need.",
        "Traverse in order and link each visited node as the right child of the previously visited one.",
        "A dummy head makes the first link like every other; clear each node's left pointer as you link it.",
      ],
      editorial: explain({
        idea: "The required chain is the in-order sequence of the tree. Walk the tree in order and splice each node onto the end of the chain built so far, reusing the nodes themselves.",
        steps: [
          "Create a dummy node and keep `tail` pointing at it.",
          "Traverse in order with an explicit stack: push left children down to the leftmost node, pop a node, then continue from its right child.",
          "For every popped node: set its left pointer to null, make it `tail.right`, and move `tail` to it.",
          "Return `dummy.right`.",
        ],
        why: "When a node is popped its whole left subtree has already been emitted, and its right child was read into the traversal before `tail.right` is ever overwritten, so relinking never loses a node. The last node popped is the largest, whose right pointer is already null.",
        time: "O(n)",
        space: "O(h) for the stack, h the height",
        pitfalls: [
          "Forgetting to clear the left pointers leaves cycles or stray branches in the output.",
          "Read a node's right child before relinking — or, as here, link the node only after it is popped, when its right child is the next thing to visit.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = randBST(rng, n, 0, pick(rng, [n + 3, 1000]));
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def increasingBST(root: Optional[TreeNode]) -> Optional[TreeNode]:
              dummy = TreeNode(0)
              tail = dummy
              stack = []
              node = root
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.left
                  node = stack.pop()
                  node.left = None
                  tail.right = node
                  tail = node
                  node = node.right
              return dummy.right
        `,
        javascript: code`
          var increasingBST = function(root) {
              var dummy = new TreeNode(0), tail = dummy;
              var stack = [], node = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  node.left = null;
                  tail.right = node;
                  tail = node;
                  node = node.right;
              }
              return dummy.right;
          };
        `,
        typescript: code`
          function increasingBST(root: TreeNode | null): TreeNode | null {
              var dummy = new TreeNode(0), tail = dummy;
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.left; }
                  var top = stack.pop() as TreeNode;
                  top.left = null;
                  tail.right = top;
                  tail = top;
                  node = top.right;
              }
              return dummy.right;
          }
        `,
        java: code`
          public static TreeNode increasingBST(TreeNode root) {
              TreeNode dummy = new TreeNode(0), tail = dummy;
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.left; }
                  node = stack.pop();
                  node.left = null;
                  tail.right = node;
                  tail = node;
                  node = node.right;
              }
              return dummy.right;
          }
        `,
        cpp: code`
          TreeNode* increasingBST(TreeNode* root) {
              TreeNode dummy(0);
              TreeNode* tail = &dummy;
              vector<TreeNode*> stack;
              TreeNode* node = root;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->left; }
                  node = stack.back();
                  stack.pop_back();
                  node->left = nullptr;
                  tail->right = node;
                  tail = node;
                  node = node->right;
              }
              return dummy.right;
          }
        `,
        c: code`
          struct TreeNode* increasingBST(struct TreeNode* root) {
              struct TreeNode dummy;
              dummy.left = NULL;
              dummy.right = NULL;
              struct TreeNode* tail = &dummy;
              struct TreeNode* stack[128];
              int top = 0;
              struct TreeNode* node = root;
              while (top > 0 || node != NULL) {
                  while (node != NULL) { stack[top++] = node; node = node->left; }
                  node = stack[--top];
                  node->left = NULL;
                  tail->right = node;
                  tail = node;
                  node = node->right;
              }
              return dummy.right;
          }
        `,
        csharp: code`
          public static TreeNode IncreasingBST(TreeNode root)
          {
              var dummy = new TreeNode(0);
              var tail = dummy;
              var stack = new Stack<TreeNode>();
              var node = root;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.left; }
                  node = stack.Pop();
                  node.left = null;
                  tail.right = node;
                  tail = node;
                  node = node.right;
              }
              return dummy.right;
          }
        `,
        go: code`
          func increasingBST(root *TreeNode) *TreeNode {
              dummy := &TreeNode{}
              tail := dummy
              stack := []*TreeNode{}
              node := root
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Left
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  node.Left = nil
                  tail.Right = node
                  tail = node
                  node = node.Right
              }
              return dummy.Right
          }
        `,
        kotlin: kt(`
          fun increasingBST(root: TreeNode?): TreeNode? {
              val dummy = TreeNode(0)
              var tail = dummy
              val stack = ArrayList<TreeNode>()
              var node = root
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.left
                  }
                  val top = stack.removeAt(stack.size - 1)
                  top.left = null
                  tail.right = top
                  tail = top
                  node = top.right
              }
              return dummy.right
          }
        `),
        swift: code`
          func increasingBST(_ root: TreeNode?) -> TreeNode? {
              let dummy = TreeNode(0)
              var tail = dummy
              var stack: [TreeNode] = []
              var node = root
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.left
                  }
                  let top = stack.removeLast()
                  top.left = nil
                  tail.right = top
                  tail = top
                  node = top.right
              }
              return dummy.right
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn increasingBST(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              // Collect the in-order values, then build the chain from its far end.
              let mut vals: Vec<i32> = Vec::new();
              inorder(&root, &mut vals);
              let mut head: Option<Rc<RefCell<TreeNode>>> = None;
              for &v in vals.iter().rev() {
                  let n = Rc::new(RefCell::new(TreeNode::new(v)));
                  n.borrow_mut().right = head;
                  head = Some(n);
              }
              head
          }

          fn inorder(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut Vec<i32>) {
              if let Some(n) = node {
                  let n = n.borrow();
                  inorder(&n.left, out);
                  out.push(n.val);
                  inorder(&n.right, out);
              }
          }
        `,
        php: code`
          function increasingBST($root) {
              $dummy = new TreeNode(0);
              $tail = $dummy;
              $stack = [];
              $node = $root;
              while (!empty($stack) || $node !== null) {
                  while ($node !== null) {
                      $stack[] = $node;
                      $node = $node->left;
                  }
                  $node = array_pop($stack);
                  $node->left = null;
                  $tail->right = $node;
                  $tail = $node;
                  $node = $node->right;
              }
              return $dummy->right;
          }
        `,
        ruby: code`
          def increasingBST(root)
            dummy = TreeNode.new(0)
            tail = dummy
            stack = []
            node = root
            while !stack.empty? || node
              while node
                stack << node
                node = node.left
              end
              node = stack.pop
              node.left = nil
              tail.right = node
              tail = node
              node = node.right
            end
            dummy.right
          end
        `,
      },
    };
  })(),

  // ── Range Sum of BST (LC 938) ───────────────────────────────────
  (() => {
    const ref = (root: TNode | null, low: number, high: number) =>
      nodesOf(root).reduce((s, n) => s + (n.val >= low && n.val <= high ? n.val : 0), 0);
    const EX = [
      { root: [10, 5, 15, 3, 7, null, 18], low: 7, high: 15, note: "7 + 10 + 15 = 32." },
      { root: [10, 5, 15, 3, 7, 13, 18, 1, null, 6], low: 6, high: 10, note: "6 + 7 + 10 = 23." },
      { root: [5], low: 6, high: 9, note: "The only value lies outside the range." },
    ];
    return {
      slug: "range-sum-of-bst",
      title: "Range Sum of BST",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Binary Search", "Meta", "Amazon", "Google"],
      signature: { funcName: "rangeSumBST", params: [{ name: "root", type: "TreeNode" as const }, { name: "low", type: "int" as const }, { name: "high", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary search tree and two integers `low` and `high`.\n\nReturn the sum of the values of all nodes whose value lies in the inclusive range `[low, high]`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, low = ${e.low}, high = ${e.high}`, out: String(ref(treeFrom(e.root), e.low, e.high)), note: e.note })),
        ["1 <= number of nodes <= 2 * 10^4", "1 <= Node.val <= 10^5", "1 <= low <= high <= 10^5", "all node values are distinct"]),
      hints: [
        "Visiting every node and adding the ones in range works — but the tree is ordered, so some subtrees cannot contribute at all.",
        "If a node's value is at most `low`, nothing in its left subtree can be in range; if it is at least `high`, nothing in its right subtree can.",
        "Do a depth-first search that adds the node when it is in range and descends only into the sides that can still hold values in range.",
      ],
      editorial: explain({
        idea: "A plain traversal sums the in-range values; the search-tree order lets it skip every subtree that lies entirely below `low` or above `high`.",
        steps: [
          "Push the root onto a stack and keep a running `total`.",
          "Pop a node. If `low <= val <= high`, add `val` to `total`.",
          "Descend left only if `val > low` (smaller values may still be in range), and right only if `val < high`.",
          "When the stack is empty, return `total`.",
        ],
        why: "Every value in a left subtree is smaller than its node, so when `val <= low` the whole left subtree is below the range; symmetrically for the right subtree when `val >= high`. No skipped node could have contributed.",
        time: "O(n) worst case, O(h + k) when only k nodes fall in the range",
        space: "O(h) for the stack",
        pitfalls: [
          "The range is inclusive at both ends.",
          "The sum fits in 32 bits under these limits (at most 2·10^4 distinct values up to 10^5 add up to under 1.9·10^9).",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.low}\n${e.high}`, expectedOutput: String(ref(treeFrom(e.root), e.low, e.high)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 5, 100, 100000]);
        const root = randBST(rng, n, 1, hi);
        let a = ri(rng, 1, hi), b = ri(rng, 1, hi);
        if (a > b) { const t = a; a = b; b = t; }
        if (rng() < 0.1) b = a;
        return { input: `${fmtTree(root)}\n${a}\n${b}`, expectedOutput: String(ref(root, a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def rangeSumBST(root: Optional[TreeNode], low: int, high: int) -> int:
              total = 0
              stack = [root] if root else []
              while stack:
                  node = stack.pop()
                  if low <= node.val <= high:
                      total += node.val
                  if node.left and node.val > low:
                      stack.append(node.left)
                  if node.right and node.val < high:
                      stack.append(node.right)
              return total
        `,
        javascript: code`
          var rangeSumBST = function(root, low, high) {
              var total = 0, stack = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.val >= low && node.val <= high) total += node.val;
                  if (node.left !== null && node.val > low) stack.push(node.left);
                  if (node.right !== null && node.val < high) stack.push(node.right);
              }
              return total;
          };
        `,
        typescript: code`
          function rangeSumBST(root: TreeNode | null, low: number, high: number): number {
              var total = 0;
              var stack: TreeNode[] = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (node.val >= low && node.val <= high) total += node.val;
                  if (node.left !== null && node.val > low) stack.push(node.left);
                  if (node.right !== null && node.val < high) stack.push(node.right);
              }
              return total;
          }
        `,
        java: code`
          public static int rangeSumBST(TreeNode root, int low, int high) {
              int total = 0;
              Deque<TreeNode> stack = new ArrayDeque<>();
              if (root != null) stack.push(root);
              while (!stack.isEmpty()) {
                  TreeNode node = stack.pop();
                  if (node.val >= low && node.val <= high) total += node.val;
                  if (node.left != null && node.val > low) stack.push(node.left);
                  if (node.right != null && node.val < high) stack.push(node.right);
              }
              return total;
          }
        `,
        cpp: code`
          int rangeSumBST(TreeNode* root, int low, int high) {
              int total = 0;
              vector<TreeNode*> stack;
              if (root) stack.push_back(root);
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  if (node->val >= low && node->val <= high) total += node->val;
                  if (node->left && node->val > low) stack.push_back(node->left);
                  if (node->right && node->val < high) stack.push_back(node->right);
              }
              return total;
          }
        `,
        c: code`
          int rangeSumBST(struct TreeNode* root, int low, int high) {
              if (root == NULL) return 0;
              int total = 0;
              if (root->val >= low && root->val <= high) total += root->val;
              if (root->val > low) total += rangeSumBST(root->left, low, high);
              if (root->val < high) total += rangeSumBST(root->right, low, high);
              return total;
          }
        `,
        csharp: code`
          public static int RangeSumBST(TreeNode root, int low, int high)
          {
              int total = 0;
              var stack = new Stack<TreeNode>();
              if (root != null) stack.Push(root);
              while (stack.Count > 0)
              {
                  var node = stack.Pop();
                  if (node.val >= low && node.val <= high) total += node.val;
                  if (node.left != null && node.val > low) stack.Push(node.left);
                  if (node.right != null && node.val < high) stack.Push(node.right);
              }
              return total;
          }
        `,
        go: code`
          func rangeSumBST(root *TreeNode, low int, high int) int {
              if root == nil {
                  return 0
              }
              total := 0
              if root.Val >= low && root.Val <= high {
                  total += root.Val
              }
              if root.Val > low {
                  total += rangeSumBST(root.Left, low, high)
              }
              if root.Val < high {
                  total += rangeSumBST(root.Right, low, high)
              }
              return total
          }
        `,
        kotlin: kt(`
          fun rangeSumBST(root: TreeNode?, low: Int, high: Int): Int {
              if (root == null) return 0
              val v = root.\`val\`
              var total = if (v in low..high) v else 0
              if (v > low) total += rangeSumBST(root.left, low, high)
              if (v < high) total += rangeSumBST(root.right, low, high)
              return total
          }
        `),
        swift: code`
          func rangeSumBST(_ root: TreeNode?, _ low: Int, _ high: Int) -> Int {
              guard let node = root else { return 0 }
              var total = (node.val >= low && node.val <= high) ? node.val : 0
              if node.val > low { total += rangeSumBST(node.left, low, high) }
              if node.val < high { total += rangeSumBST(node.right, low, high) }
              return total
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn rangeSumBST(root: Option<Rc<RefCell<TreeNode>>>, low: i32, high: i32) -> i32 {
              let mut total = 0;
              let mut stack = vec![root];
              while let Some(top) = stack.pop() {
                  if let Some(n) = top {
                      let n = n.borrow();
                      if n.val >= low && n.val <= high {
                          total += n.val;
                      }
                      if n.val > low {
                          stack.push(n.left.clone());
                      }
                      if n.val < high {
                          stack.push(n.right.clone());
                      }
                  }
              }
              total
          }
        `,
        php: code`
          function rangeSumBST($root, $low, $high) {
              $total = 0;
              $stack = $root === null ? [] : [$root];
              while (!empty($stack)) {
                  $node = array_pop($stack);
                  if ($node->val >= $low && $node->val <= $high) $total += $node->val;
                  if ($node->left !== null && $node->val > $low) $stack[] = $node->left;
                  if ($node->right !== null && $node->val < $high) $stack[] = $node->right;
              }
              return $total;
          }
        `,
        ruby: code`
          def rangeSumBST(root, low, high)
            total = 0
            stack = root ? [root] : []
            until stack.empty?
              node = stack.pop
              total += node.val if node.val >= low && node.val <= high
              stack << node.left if node.left && node.val > low
              stack << node.right if node.right && node.val < high
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Univalued Binary Tree (LC 965) ──────────────────────────────
  (() => {
    const ref = (root: TNode | null) => nodesOf(root).every((n) => n.val === root!.val);
    const EX = [
      { root: [1, 1, 1, 1, 1, null, 1], note: "Every node holds 1." },
      { root: [2, 2, 2, 5, 2], note: "One node holds 5." },
      { root: [7], note: "A single node is trivially uni-valued." },
    ];
    return {
      slug: "univalued-binary-tree",
      title: "Univalued Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon"],
      signature: { funcName: "isUnivalTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "A binary tree is **uni-valued** if every node in it holds the same value.\n\nGiven the `root` of a binary tree, return `true` if the tree is uni-valued, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 100", "0 <= Node.val < 100"]),
      hints: [
        "If the tree is uni-valued, the shared value must be the root's.",
        "Visit every node and compare it with the root's value.",
        "Stop at the first node that differs — one mismatch is enough to answer `false`.",
      ],
      editorial: explain({
        idea: "The only candidate for the common value is the root's value, so the question becomes: does any node differ from the root?",
        steps: [
          "Remember `v = root.val`.",
          "Traverse the tree (depth-first with a stack, or breadth-first with a queue).",
          "If a node's value is not `v`, return `false` immediately.",
          "If the traversal finishes, return `true`.",
        ],
        time: "O(n)",
        space: "O(h) for a depth-first stack",
        pitfalls: [
          "Comparing each node only with its parent also works, but comparing everything with one fixed value is simpler and just as fast.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const v = ri(rng, 0, 99);
        const root = shapeTree(rng, n, v, v);
        if (rng() < 0.5) pick(rng, nodesOf(root)).val = rng() < 0.5 ? ri(rng, 0, 99) : (v + 1) % 100;
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isUnivalTree(root: Optional[TreeNode]) -> bool:
              v = root.val
              stack = [root]
              while stack:
                  node = stack.pop()
                  if node.val != v:
                      return False
                  if node.left:
                      stack.append(node.left)
                  if node.right:
                      stack.append(node.right)
              return True
        `,
        javascript: code`
          var isUnivalTree = function(root) {
              var v = root.val, stack = [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.val !== v) return false;
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return true;
          };
        `,
        typescript: code`
          function isUnivalTree(root: TreeNode | null): boolean {
              if (root === null) return true;
              var v = root.val;
              var stack: TreeNode[] = [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (node.val !== v) return false;
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return true;
          }
        `,
        java: code`
          public static boolean isUnivalTree(TreeNode root) {
              return same(root, root.val);
          }

          static boolean same(TreeNode node, int v) {
              if (node == null) return true;
              return node.val == v && same(node.left, v) && same(node.right, v);
          }
        `,
        cpp: code`
          bool sameValue(TreeNode* node, int v);

          bool isUnivalTree(TreeNode* root) {
              return sameValue(root, root->val);
          }

          bool sameValue(TreeNode* node, int v) {
              if (!node) return true;
              return node->val == v && sameValue(node->left, v) && sameValue(node->right, v);
          }
        `,
        c: code`
          static bool sameValue(struct TreeNode* node, int v);

          bool isUnivalTree(struct TreeNode* root) {
              return sameValue(root, root->val);
          }

          static bool sameValue(struct TreeNode* node, int v) {
              if (node == NULL) return true;
              return node->val == v && sameValue(node->left, v) && sameValue(node->right, v);
          }
        `,
        csharp: code`
          public static bool IsUnivalTree(TreeNode root)
          {
              return Same(root, root.val);
          }

          static bool Same(TreeNode node, int v)
          {
              if (node == null) return true;
              return node.val == v && Same(node.left, v) && Same(node.right, v);
          }
        `,
        go: code`
          func isUnivalTree(root *TreeNode) bool {
              v := root.Val
              stack := []*TreeNode{root}
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if node.Val != v {
                      return false
                  }
                  if node.Left != nil {
                      stack = append(stack, node.Left)
                  }
                  if node.Right != nil {
                      stack = append(stack, node.Right)
                  }
              }
              return true
          }
        `,
        kotlin: kt(`
          fun isUnivalTree(root: TreeNode?): Boolean {
              if (root == null) return true
              val v = root.\`val\`
              fun same(node: TreeNode?): Boolean =
                  node == null || (node.\`val\` == v && same(node.left) && same(node.right))
              return same(root)
          }
        `),
        swift: code`
          func isUnivalTree(_ root: TreeNode?) -> Bool {
              guard let r = root else { return true }
              let v = r.val
              var stack: [TreeNode] = [r]
              while let node = stack.popLast() {
                  if node.val != v { return false }
                  if let l = node.left { stack.append(l) }
                  if let rt = node.right { stack.append(rt) }
              }
              return true
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isUnivalTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let v = match &root {
                  Some(n) => n.borrow().val,
                  None => return true,
              };
              same(&root, v)
          }

          fn same(node: &Option<Rc<RefCell<TreeNode>>>, v: i32) -> bool {
              match node {
                  None => true,
                  Some(n) => {
                      let n = n.borrow();
                      let ok = n.val == v && same(&n.left, v) && same(&n.right, v);
                      ok
                  }
              }
          }
        `,
        php: code`
          function isUnivalTree($root) {
              $v = $root->val;
              $stack = [$root];
              while (!empty($stack)) {
                  $node = array_pop($stack);
                  if ($node->val != $v) return false;
                  if ($node->left !== null) $stack[] = $node->left;
                  if ($node->right !== null) $stack[] = $node->right;
              }
              return true;
          }
        `,
        ruby: code`
          def isUnivalTree(root)
            v = root.val
            stack = [root]
            until stack.empty?
              node = stack.pop
              return false if node.val != v
              stack << node.left if node.left
              stack << node.right if node.right
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Cousins in Binary Tree (LC 993) ─────────────────────────────
  (() => {
    const ref = (root: TNode | null, x: number, y: number) => {
      const info = new Map<number, [number, number]>();
      const walk = (n: TNode | null, d: number, p: number) => {
        if (!n) return;
        info.set(n.val, [d, p]);
        walk(n.left, d + 1, n.val);
        walk(n.right, d + 1, n.val);
      };
      walk(root, 0, 0);
      const a = info.get(x)!, b = info.get(y)!;
      return a[0] === b[0] && a[1] !== b[1];
    };
    const EX = [
      { root: [1, 2, 3, 4], x: 4, y: 3, note: "4 is two levels down, 3 only one: different depths." },
      { root: [1, 2, 3, null, 4, null, 5], x: 5, y: 4, note: "4 and 5 are both at depth 2, with parents 2 and 3." },
      { root: [1, 2, 3, null, 4], x: 2, y: 3, note: "2 and 3 share the same depth but also the same parent — they are siblings, not cousins." },
    ];
    return {
      slug: "cousins-in-binary-tree",
      title: "Cousins in Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "isCousins", params: [{ name: "root", type: "TreeNode" as const }, { name: "x", type: "int" as const }, { name: "y", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are all **distinct**, and the values `x` and `y` of two different nodes in it.\n\nTwo nodes are **cousins** if they are at the same depth but have **different parents**. The root is at depth `0` and each child is one deeper than its parent.\n\nReturn `true` if the nodes holding `x` and `y` are cousins, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, x = ${e.x}, y = ${e.y}`, out: String(ref(treeFrom(e.root), e.x, e.y)), note: e.note })),
        ["2 <= number of nodes <= 100", "1 <= Node.val <= 100", "all node values are distinct", "x != y", "x and y are both values in the tree"]),
      hints: [
        "Two facts decide the answer for each of `x` and `y`: how deep the node is, and who its parent is.",
        "One traversal can record both facts for both values — pass the depth and the parent down as you go.",
        "Cousins means equal depths and different parents; siblings fail the second test.",
      ],
      editorial: explain({
        idea: "Being cousins depends only on each node's depth and parent, so one traversal that carries `(depth, parent)` down to every node finds everything needed.",
        steps: [
          "Traverse the tree from the root with depth 0 and no parent (use a value that cannot occur, such as 0).",
          "At each node pass `depth + 1` and the node's own value as the parent to its children.",
          "When the node's value is `x` or `y`, record its depth and parent.",
          "Return `true` exactly when the two depths are equal and the two parents differ.",
        ],
        why: "Values are distinct, so each of `x` and `y` is recorded once, with the true depth and parent of that node. The definition of cousins is precisely the final comparison.",
        time: "O(n)",
        space: "O(h) for the recursion or stack",
        pitfalls: [
          "Same depth alone is not enough — siblings share a parent and are not cousins.",
          "A breadth-first search works too: check, level by level, whether both values appear in the same level and are not children of the same node.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.x}\n${e.y}`, expectedOutput: String(ref(treeFrom(e.root), e.x, e.y)) })),
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 8, 20, 40]));
        const root = distinctVals(rng, shapeTree(rng, n, 1, 1), 1, 100);
        const depth = new Map<number, number>();
        const walk = (t: TNode | null, d: number) => { if (!t) return; depth.set(t.val, d); walk(t.left, d + 1); walk(t.right, d + 1); };
        walk(root, 0);
        const vals = [...depth.keys()];
        let x = pick(rng, vals), y = pick(rng, vals);
        if (rng() < 0.5) {
          const same = vals.filter((v) => v !== x && depth.get(v) === depth.get(x));
          if (same.length) y = pick(rng, same);
        }
        while (y === x) y = pick(rng, vals);
        return { input: `${fmtTree(root)}\n${x}\n${y}`, expectedOutput: String(ref(root, x, y)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isCousins(root: Optional[TreeNode], x: int, y: int) -> bool:
              found = {}
              stack = [(root, 0, 0)]  # node, depth, parent value (0: no parent)
              while stack:
                  node, depth, parent = stack.pop()
                  if node.val == x or node.val == y:
                      found[node.val] = (depth, parent)
                  for child in (node.left, node.right):
                      if child:
                          stack.append((child, depth + 1, node.val))
              dx, px = found[x]
              dy, py = found[y]
              return dx == dy and px != py
        `,
        javascript: code`
          var isCousins = function(root, x, y) {
              var info = [0, 0, 0, 0]; // depth of x, parent of x, depth of y, parent of y
              var stack = [[root, 0, 0]];
              while (stack.length > 0) {
                  var top = stack.pop(), node = top[0], depth = top[1], parent = top[2];
                  if (node.val === x) { info[0] = depth; info[1] = parent; }
                  if (node.val === y) { info[2] = depth; info[3] = parent; }
                  if (node.left !== null) stack.push([node.left, depth + 1, node.val]);
                  if (node.right !== null) stack.push([node.right, depth + 1, node.val]);
              }
              return info[0] === info[2] && info[1] !== info[3];
          };
        `,
        typescript: code`
          function isCousins(root: TreeNode | null, x: number, y: number): boolean {
              var info = [0, 0, 0, 0]; // depth of x, parent of x, depth of y, parent of y
              locate(root, 0, 0, x, y, info);
              return info[0] === info[2] && info[1] !== info[3];
          }

          function locate(node: TreeNode | null, depth: number, parent: number, x: number, y: number, info: number[]): void {
              if (node === null) return;
              if (node.val === x) { info[0] = depth; info[1] = parent; }
              if (node.val === y) { info[2] = depth; info[3] = parent; }
              locate(node.left, depth + 1, node.val, x, y, info);
              locate(node.right, depth + 1, node.val, x, y, info);
          }
        `,
        java: code`
          public static boolean isCousins(TreeNode root, int x, int y) {
              int[] info = new int[4]; // depth of x, parent of x, depth of y, parent of y
              locate(root, 0, 0, x, y, info);
              return info[0] == info[2] && info[1] != info[3];
          }

          static void locate(TreeNode node, int depth, int parent, int x, int y, int[] info) {
              if (node == null) return;
              if (node.val == x) { info[0] = depth; info[1] = parent; }
              if (node.val == y) { info[2] = depth; info[3] = parent; }
              locate(node.left, depth + 1, node.val, x, y, info);
              locate(node.right, depth + 1, node.val, x, y, info);
          }
        `,
        cpp: code`
          void locate(TreeNode* node, int depth, int parent, int x, int y, int* info);

          bool isCousins(TreeNode* root, int x, int y) {
              int info[4] = {0, 0, 0, 0}; // depth of x, parent of x, depth of y, parent of y
              locate(root, 0, 0, x, y, info);
              return info[0] == info[2] && info[1] != info[3];
          }

          void locate(TreeNode* node, int depth, int parent, int x, int y, int* info) {
              if (!node) return;
              if (node->val == x) { info[0] = depth; info[1] = parent; }
              if (node->val == y) { info[2] = depth; info[3] = parent; }
              locate(node->left, depth + 1, node->val, x, y, info);
              locate(node->right, depth + 1, node->val, x, y, info);
          }
        `,
        c: code`
          static void locate(struct TreeNode* node, int depth, int parent, int x, int y, int* info);

          bool isCousins(struct TreeNode* root, int x, int y) {
              int info[4] = {0, 0, 0, 0}; // depth of x, parent of x, depth of y, parent of y
              locate(root, 0, 0, x, y, info);
              return info[0] == info[2] && info[1] != info[3];
          }

          static void locate(struct TreeNode* node, int depth, int parent, int x, int y, int* info) {
              if (node == NULL) return;
              if (node->val == x) { info[0] = depth; info[1] = parent; }
              if (node->val == y) { info[2] = depth; info[3] = parent; }
              locate(node->left, depth + 1, node->val, x, y, info);
              locate(node->right, depth + 1, node->val, x, y, info);
          }
        `,
        csharp: code`
          public static bool IsCousins(TreeNode root, int x, int y)
          {
              var info = new int[4]; // depth of x, parent of x, depth of y, parent of y
              Locate(root, 0, 0, x, y, info);
              return info[0] == info[2] && info[1] != info[3];
          }

          static void Locate(TreeNode node, int depth, int parent, int x, int y, int[] info)
          {
              if (node == null) return;
              if (node.val == x) { info[0] = depth; info[1] = parent; }
              if (node.val == y) { info[2] = depth; info[3] = parent; }
              Locate(node.left, depth + 1, node.val, x, y, info);
              Locate(node.right, depth + 1, node.val, x, y, info);
          }
        `,
        go: code`
          func isCousins(root *TreeNode, x int, y int) bool {
              var info [4]int // depth of x, parent of x, depth of y, parent of y
              var locate func(node *TreeNode, depth, parent int)
              locate = func(node *TreeNode, depth, parent int) {
                  if node == nil {
                      return
                  }
                  if node.Val == x {
                      info[0], info[1] = depth, parent
                  }
                  if node.Val == y {
                      info[2], info[3] = depth, parent
                  }
                  locate(node.Left, depth+1, node.Val)
                  locate(node.Right, depth+1, node.Val)
              }
              locate(root, 0, 0)
              return info[0] == info[2] && info[1] != info[3]
          }
        `,
        kotlin: kt(`
          fun isCousins(root: TreeNode?, x: Int, y: Int): Boolean {
              val info = IntArray(4) // depth of x, parent of x, depth of y, parent of y
              fun locate(node: TreeNode?, depth: Int, parent: Int) {
                  if (node == null) return
                  val v = node.\`val\`
                  if (v == x) { info[0] = depth; info[1] = parent }
                  if (v == y) { info[2] = depth; info[3] = parent }
                  locate(node.left, depth + 1, v)
                  locate(node.right, depth + 1, v)
              }
              locate(root, 0, 0)
              return info[0] == info[2] && info[1] != info[3]
          }
        `),
        swift: code`
          func isCousins(_ root: TreeNode?, _ x: Int, _ y: Int) -> Bool {
              var info = [0, 0, 0, 0] // depth of x, parent of x, depth of y, parent of y
              func locate(_ node: TreeNode?, _ depth: Int, _ parent: Int) {
                  guard let n = node else { return }
                  if n.val == x { info[0] = depth; info[1] = parent }
                  if n.val == y { info[2] = depth; info[3] = parent }
                  locate(n.left, depth + 1, n.val)
                  locate(n.right, depth + 1, n.val)
              }
              locate(root, 0, 0)
              return info[0] == info[2] && info[1] != info[3]
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isCousins(root: Option<Rc<RefCell<TreeNode>>>, x: i32, y: i32) -> bool {
              let mut info = [0i32; 4]; // depth of x, parent of x, depth of y, parent of y
              locate(&root, 0, 0, x, y, &mut info);
              info[0] == info[2] && info[1] != info[3]
          }

          fn locate(node: &Option<Rc<RefCell<TreeNode>>>, depth: i32, parent: i32, x: i32, y: i32, info: &mut [i32; 4]) {
              if let Some(n) = node {
                  let n = n.borrow();
                  if n.val == x {
                      info[0] = depth;
                      info[1] = parent;
                  }
                  if n.val == y {
                      info[2] = depth;
                      info[3] = parent;
                  }
                  locate(&n.left, depth + 1, n.val, x, y, info);
                  locate(&n.right, depth + 1, n.val, x, y, info);
              }
          }
        `,
        php: code`
          function isCousins($root, $x, $y) {
              $info = [0, 0, 0, 0]; // depth of x, parent of x, depth of y, parent of y
              locateXY($root, 0, 0, $x, $y, $info);
              return $info[0] == $info[2] && $info[1] != $info[3];
          }

          function locateXY($node, $depth, $parent, $x, $y, &$info) {
              if ($node === null) return;
              if ($node->val == $x) { $info[0] = $depth; $info[1] = $parent; }
              if ($node->val == $y) { $info[2] = $depth; $info[3] = $parent; }
              locateXY($node->left, $depth + 1, $node->val, $x, $y, $info);
              locateXY($node->right, $depth + 1, $node->val, $x, $y, $info);
          }
        `,
        ruby: code`
          def isCousins(root, x, y)
            found = {}
            stack = [[root, 0, 0]] # node, depth, parent value (0: no parent)
            until stack.empty?
              node, depth, parent = stack.pop
              found[node.val] = [depth, parent] if node.val == x || node.val == y
              stack << [node.left, depth + 1, node.val] if node.left
              stack << [node.right, depth + 1, node.val] if node.right
            end
            found[x][0] == found[y][0] && found[x][1] != found[y][1]
          end
        `,
      },
    };
  })(),

  // ── Sum of Root To Leaf Binary Numbers (LC 1022) ────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let total = 0;
      const walk = (n: TNode | null, acc: number) => {
        if (!n) return;
        const cur = acc * 2 + n.val;
        if (isLeaf(n)) total += cur;
        walk(n.left, cur);
        walk(n.right, cur);
      };
      walk(root, 0);
      return total;
    };
    const EX = [
      { root: [1, 0, 1, 0, 1, 0, 1], note: "The paths read 100, 101, 110 and 111 — that is 4 + 5 + 6 + 7 = 22." },
      { root: [0], note: "The only path is the number 0." },
      { root: [1, 1], note: "One path, 11 in binary." },
    ];
    return {
      slug: "sum-of-root-to-leaf-binary-numbers",
      title: "Sum of Root To Leaf Binary Numbers",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Bit Manipulation", "Amazon", "Microsoft"],
      signature: { funcName: "sumRootToLeaf", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Every node of a binary tree holds a single bit, `0` or `1`. Each path from the root down to a leaf spells a binary number, most significant bit first — the path `1 → 0 → 1` is `101`, which is `5`.\n\nGiven the `root` of the tree, return the **sum** of the numbers spelled by all root-to-leaf paths.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 1000", "Node.val is 0 or 1", "the answer fits in a signed 32-bit integer"]),
      hints: [
        "Reading one more bit `b` of a binary number turns the value `v` read so far into `2 * v + b`.",
        "Carry that running value down the tree: each child receives its parent's value, doubled, plus its own bit.",
        "Add the running value to the answer only at leaves — a node with no children ends a path.",
      ],
      editorial: explain({
        idea: "Appending a bit to a binary number doubles it and adds the bit, so the value of the path to any node is computed from its parent's value in one step. A depth-first walk carries it down and adds it up at the leaves.",
        steps: [
          "Start a depth-first traversal at the root with running value 0.",
          "At each node compute `cur = 2 * acc + node.val`.",
          "If the node is a leaf, add `cur` to the total; otherwise visit both children with `cur`.",
          "Return the total.",
        ],
        why: "By induction on depth, `cur` at a node equals the binary number spelled by the path from the root to that node; at a leaf that is exactly one of the numbers to sum, and every leaf is reached once.",
        time: "O(n)",
        space: "O(h) for the recursion or stack",
        pitfalls: [
          "Only leaves end a path: a node with one child must not add its value.",
          "Do not build the path as a string and parse it — the running value is simpler and avoids long strings.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = depthTree(rng, n, pick(rng, [3, 8, 16, 24]), 0, 1);
        const out = ref(root);
        if (out > 2147483647) throw new Error("sum-of-root-to-leaf-binary-numbers: answer overflows int32");
        return { input: fmtTree(root), expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sumRootToLeaf(root: Optional[TreeNode]) -> int:
              total = 0
              stack = [(root, 0)]
              while stack:
                  node, acc = stack.pop()
                  cur = acc * 2 + node.val
                  if node.left is None and node.right is None:
                      total += cur
                  if node.left:
                      stack.append((node.left, cur))
                  if node.right:
                      stack.append((node.right, cur))
              return total
        `,
        javascript: code`
          var sumRootToLeaf = function(root) {
              return pathSum(root, 0);
          };

          var pathSum = function(node, acc) {
              if (node === null) return 0;
              var cur = acc * 2 + node.val;
              if (node.left === null && node.right === null) return cur;
              return pathSum(node.left, cur) + pathSum(node.right, cur);
          };
        `,
        typescript: code`
          function sumRootToLeaf(root: TreeNode | null): number {
              return pathSum(root, 0);
          }

          function pathSum(node: TreeNode | null, acc: number): number {
              if (node === null) return 0;
              var cur = acc * 2 + node.val;
              if (node.left === null && node.right === null) return cur;
              return pathSum(node.left, cur) + pathSum(node.right, cur);
          }
        `,
        java: code`
          public static int sumRootToLeaf(TreeNode root) {
              return pathSum(root, 0);
          }

          static int pathSum(TreeNode node, int acc) {
              if (node == null) return 0;
              int cur = acc * 2 + node.val;
              if (node.left == null && node.right == null) return cur;
              return pathSum(node.left, cur) + pathSum(node.right, cur);
          }
        `,
        cpp: code`
          int pathSum(TreeNode* node, int acc);

          int sumRootToLeaf(TreeNode* root) {
              return pathSum(root, 0);
          }

          int pathSum(TreeNode* node, int acc) {
              if (!node) return 0;
              int cur = acc * 2 + node->val;
              if (!node->left && !node->right) return cur;
              return pathSum(node->left, cur) + pathSum(node->right, cur);
          }
        `,
        c: code`
          static int pathSum(struct TreeNode* node, int acc);

          int sumRootToLeaf(struct TreeNode* root) {
              return pathSum(root, 0);
          }

          static int pathSum(struct TreeNode* node, int acc) {
              if (node == NULL) return 0;
              int cur = acc * 2 + node->val;
              if (node->left == NULL && node->right == NULL) return cur;
              return pathSum(node->left, cur) + pathSum(node->right, cur);
          }
        `,
        csharp: code`
          public static int SumRootToLeaf(TreeNode root)
          {
              return PathSum(root, 0);
          }

          static int PathSum(TreeNode node, int acc)
          {
              if (node == null) return 0;
              int cur = acc * 2 + node.val;
              if (node.left == null && node.right == null) return cur;
              return PathSum(node.left, cur) + PathSum(node.right, cur);
          }
        `,
        go: code`
          func sumRootToLeaf(root *TreeNode) int {
              return pathSum(root, 0)
          }

          func pathSum(node *TreeNode, acc int) int {
              if node == nil {
                  return 0
              }
              cur := acc*2 + node.Val
              if node.Left == nil && node.Right == nil {
                  return cur
              }
              return pathSum(node.Left, cur) + pathSum(node.Right, cur)
          }
        `,
        kotlin: kt(`
          fun sumRootToLeaf(root: TreeNode?): Int {
              return pathSum(root, 0)
          }

          fun pathSum(node: TreeNode?, acc: Int): Int {
              if (node == null) return 0
              val cur = acc * 2 + node.\`val\`
              if (node.left == null && node.right == null) return cur
              return pathSum(node.left, cur) + pathSum(node.right, cur)
          }
        `),
        swift: code`
          func sumRootToLeaf(_ root: TreeNode?) -> Int {
              return pathSum(root, 0)
          }

          func pathSum(_ node: TreeNode?, _ acc: Int) -> Int {
              guard let n = node else { return 0 }
              let cur = acc * 2 + n.val
              if n.left == nil && n.right == nil { return cur }
              return pathSum(n.left, cur) + pathSum(n.right, cur)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sumRootToLeaf(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              pathSum(&root, 0)
          }

          fn pathSum(node: &Option<Rc<RefCell<TreeNode>>>, acc: i32) -> i32 {
              match node {
                  None => 0,
                  Some(n) => {
                      let n = n.borrow();
                      let cur = acc * 2 + n.val;
                      let total = if n.left.is_none() && n.right.is_none() {
                          cur
                      } else {
                          pathSum(&n.left, cur) + pathSum(&n.right, cur)
                      };
                      total
                  }
              }
          }
        `,
        php: code`
          function sumRootToLeaf($root) {
              return pathSum($root, 0);
          }

          function pathSum($node, $acc) {
              if ($node === null) return 0;
              $cur = $acc * 2 + $node->val;
              if ($node->left === null && $node->right === null) return $cur;
              return pathSum($node->left, $cur) + pathSum($node->right, $cur);
          }
        `,
        ruby: code`
          def sumRootToLeaf(root)
            path_sum(root, 0)
          end

          def path_sum(node, acc)
            return 0 if node.nil?
            cur = acc * 2 + node.val
            return cur if node.left.nil? && node.right.nil?
            path_sum(node.left, cur) + path_sum(node.right, cur)
          end
        `,
      },
    };
  })(),

  // ── Root Equals Sum of Children (LC 2236) ───────────────────────
  (() => {
    const ref = (root: TNode | null) => root!.val === root!.left!.val + root!.right!.val;
    const EX = [
      { root: [10, 4, 6], note: "4 + 6 = 10." },
      { root: [5, 3, 1], note: "3 + 1 = 4, not 5." },
      { root: [0, -7, 7], note: "-7 + 7 = 0." },
    ];
    return {
      slug: "root-equals-sum-of-children",
      title: "Root Equals Sum of Children",
      difficulty: "EASY" as const,
      tags: ["Tree", "Amazon"],
      signature: { funcName: "checkTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "You are given the `root` of a binary tree that has **exactly three nodes**: the root, its left child and its right child.\n\nReturn `true` if the root's value equals the sum of its two children's values, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["the tree has exactly 3 nodes: root, root.left and root.right", "-100 <= Node.val <= 100"]),
      hints: [
        "The shape is fixed, so there is nothing to traverse.",
        "Both children are guaranteed to exist.",
        "Compare `root.val` with `root.left.val + root.right.val`.",
      ],
      editorial: explain({
        idea: "With the shape guaranteed, the question is one comparison between the root and its two children.",
        steps: [
          "Read the left child's value and the right child's value.",
          "Return whether their sum equals the root's value.",
        ],
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Values may be negative; the sum is still a plain integer sum.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const l = ri(rng, -100, 100), r = ri(rng, -100, 100);
        let v = l + r;
        if (v < -100 || v > 100 || rng() < 0.45) v = ri(rng, -100, 100);
        const root = treeFrom([v, l, r]);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def checkTree(root: Optional[TreeNode]) -> bool:
              return root.val == root.left.val + root.right.val
        `,
        javascript: code`
          var checkTree = function(root) {
              return root.val === root.left.val + root.right.val;
          };
        `,
        typescript: code`
          function checkTree(root: TreeNode | null): boolean {
              var r = root as TreeNode;
              return r.val === (r.left as TreeNode).val + (r.right as TreeNode).val;
          }
        `,
        java: code`
          public static boolean checkTree(TreeNode root) {
              return root.val == root.left.val + root.right.val;
          }
        `,
        cpp: code`
          bool checkTree(TreeNode* root) {
              return root->val == root->left->val + root->right->val;
          }
        `,
        c: code`
          bool checkTree(struct TreeNode* root) {
              return root->val == root->left->val + root->right->val;
          }
        `,
        csharp: code`
          public static bool CheckTree(TreeNode root)
          {
              return root.val == root.left.val + root.right.val;
          }
        `,
        go: code`
          func checkTree(root *TreeNode) bool {
              return root.Val == root.Left.Val+root.Right.Val
          }
        `,
        kotlin: kt(`
          fun checkTree(root: TreeNode?): Boolean {
              val r = root!!
              return r.\`val\` == r.left!!.\`val\` + r.right!!.\`val\`
          }
        `),
        swift: code`
          func checkTree(_ root: TreeNode?) -> Bool {
              let r = root!
              return r.val == r.left!.val + r.right!.val
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn checkTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let node = root.unwrap();
              let r = node.borrow();
              let left = r.left.as_ref().unwrap().borrow().val;
              let right = r.right.as_ref().unwrap().borrow().val;
              let ok = r.val == left + right;
              ok
          }
        `,
        php: code`
          function checkTree($root) {
              return $root->val == $root->left->val + $root->right->val;
          }
        `,
        ruby: code`
          def checkTree(root)
            root.val == root.left.val + root.right.val
          end
        `,
      },
    };
  })(),

  // ── Evaluate Boolean Binary Tree (LC 2331) ──────────────────────
  (() => {
    const ref = (n: TNode | null): boolean => {
      const t = n!;
      if (t.val === 0) return false;
      if (t.val === 1) return true;
      return t.val === 2 ? ref(t.left) || ref(t.right) : ref(t.left) && ref(t.right);
    };
    const EX = [
      { root: [2, 1, 3, null, null, 0, 1], note: "The AND node gives `False AND True = False`; the root gives `True OR False = True`." },
      { root: [0], note: "The root is a leaf holding False." },
      { root: [3, 1, 2, null, null, 0, 0], note: "`False OR False = False`, then `True AND False = False`." },
    ];
    return {
      slug: "evaluate-boolean-binary-tree",
      title: "Evaluate Boolean Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "evaluateTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "You are given the `root` of a **full** binary tree (every node has either zero or two children) that encodes a boolean expression:\n\n- A **leaf** holds `0` (False) or `1` (True).\n- A **non-leaf** node holds `2` (OR) or `3` (AND), applied to the values of its two children.\n\nReturn the boolean value of the root.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 1000", "0 <= Node.val <= 3", "every node has 0 or 2 children", "leaves hold 0 or 1; non-leaf nodes hold 2 or 3"]),
      hints: [
        "A node's value depends only on its children's values — evaluate bottom-up.",
        "A leaf answers directly: 1 is true, 0 is false.",
        "For an internal node, evaluate both children recursively and combine them with OR (2) or AND (3).",
      ],
      editorial: explain({
        idea: "The tree is an expression tree, so evaluating it is a post-order recursion: leaves are constants, internal nodes combine their children's results.",
        steps: [
          "If the node holds 0 or 1, return false or true.",
          "Otherwise evaluate the left and right children.",
          "Return their OR if the node holds 2, their AND if it holds 3.",
        ],
        why: "Each internal node's value is defined in terms of its children's values only, and the children are smaller subtrees, so structural induction gives the right value at every node, the root included.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Short-circuiting (`||`, `&&`) is fine — the skipped subtree cannot change the result.",
          "The tree is full, so an internal node always has both children; no null checks are needed beyond that guarantee.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const root: TNode = { val: ri(rng, 0, 1), left: null, right: null };
        const leaves = [root];
        const k = ri(rng, 0, pick(rng, [0, 2, 6, 19]));
        for (let i = 0; i < k; i++) {
          const j = ri(rng, 0, leaves.length - 1);
          const t = leaves[j];
          t.val = ri(rng, 2, 3);
          t.left = { val: ri(rng, 0, 1), left: null, right: null };
          t.right = { val: ri(rng, 0, 1), left: null, right: null };
          leaves.splice(j, 1, t.left, t.right);
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def evaluateTree(root: Optional[TreeNode]) -> bool:
              if root.val < 2:
                  return root.val == 1
              if root.val == 2:
                  return evaluateTree(root.left) or evaluateTree(root.right)
              return evaluateTree(root.left) and evaluateTree(root.right)
        `,
        javascript: code`
          var evaluateTree = function(root) {
              if (root.val < 2) return root.val === 1;
              if (root.val === 2) return evaluateTree(root.left) || evaluateTree(root.right);
              return evaluateTree(root.left) && evaluateTree(root.right);
          };
        `,
        typescript: code`
          function evaluateTree(root: TreeNode | null): boolean {
              var r = root as TreeNode;
              if (r.val < 2) return r.val === 1;
              if (r.val === 2) return evaluateTree(r.left) || evaluateTree(r.right);
              return evaluateTree(r.left) && evaluateTree(r.right);
          }
        `,
        java: code`
          public static boolean evaluateTree(TreeNode root) {
              if (root.val < 2) return root.val == 1;
              if (root.val == 2) return evaluateTree(root.left) || evaluateTree(root.right);
              return evaluateTree(root.left) && evaluateTree(root.right);
          }
        `,
        cpp: code`
          bool evaluateTree(TreeNode* root) {
              if (root->val < 2) return root->val == 1;
              if (root->val == 2) return evaluateTree(root->left) || evaluateTree(root->right);
              return evaluateTree(root->left) && evaluateTree(root->right);
          }
        `,
        c: code`
          bool evaluateTree(struct TreeNode* root) {
              if (root->val < 2) return root->val == 1;
              if (root->val == 2) return evaluateTree(root->left) || evaluateTree(root->right);
              return evaluateTree(root->left) && evaluateTree(root->right);
          }
        `,
        csharp: code`
          public static bool EvaluateTree(TreeNode root)
          {
              if (root.val < 2) return root.val == 1;
              if (root.val == 2) return EvaluateTree(root.left) || EvaluateTree(root.right);
              return EvaluateTree(root.left) && EvaluateTree(root.right);
          }
        `,
        go: code`
          func evaluateTree(root *TreeNode) bool {
              if root.Val < 2 {
                  return root.Val == 1
              }
              if root.Val == 2 {
                  return evaluateTree(root.Left) || evaluateTree(root.Right)
              }
              return evaluateTree(root.Left) && evaluateTree(root.Right)
          }
        `,
        kotlin: kt(`
          fun evaluateTree(root: TreeNode?): Boolean {
              val r = root!!
              val v = r.\`val\`
              if (v < 2) return v == 1
              if (v == 2) return evaluateTree(r.left) || evaluateTree(r.right)
              return evaluateTree(r.left) && evaluateTree(r.right)
          }
        `),
        swift: code`
          func evaluateTree(_ root: TreeNode?) -> Bool {
              let r = root!
              if r.val < 2 { return r.val == 1 }
              if r.val == 2 { return evaluateTree(r.left) || evaluateTree(r.right) }
              return evaluateTree(r.left) && evaluateTree(r.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn evaluateTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              evalNode(&root)
          }

          fn evalNode(node: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              let n = node.as_ref().unwrap().borrow();
              let res = match n.val {
                  0 => false,
                  1 => true,
                  2 => evalNode(&n.left) || evalNode(&n.right),
                  _ => evalNode(&n.left) && evalNode(&n.right),
              };
              res
          }
        `,
        php: code`
          function evaluateTree($root) {
              if ($root->val < 2) return $root->val == 1;
              if ($root->val == 2) return evaluateTree($root->left) || evaluateTree($root->right);
              return evaluateTree($root->left) && evaluateTree($root->right);
          }
        `,
        ruby: code`
          def evaluateTree(root)
            return root.val == 1 if root.val < 2
            return evaluateTree(root.left) || evaluateTree(root.right) if root.val == 2
            evaluateTree(root.left) && evaluateTree(root.right)
          end
        `,
      },
    };
  })(),

  // ── Convert Sorted Array to Binary Search Tree (LC 108) ─────────
  (() => {
    const ref = (nums: number[]) => {
      const build = (lo: number, hi: number): TNode | null => {
        if (lo > hi) return null;
        const mid = Math.floor((lo + hi) / 2);
        return { val: nums[mid], left: build(lo, mid - 1), right: build(mid + 1, hi) };
      };
      return build(0, nums.length - 1);
    };
    const EX = [
      { nums: [-10, -3, 0, 5, 9], note: "0 is the middle element. The left half [-10,-3] takes its left-middle -10 as root with -3 to its right; the right half [5,9] likewise takes 5 with 9 to its right." },
      { nums: [1, 3], note: "With two elements the left-middle one, 1, is the root." },
      { nums: [7], note: "A single element is a single node." },
    ];
    return {
      slug: "convert-sorted-array-to-binary-search-tree",
      title: "Convert Sorted Array to Binary Search Tree",
      difficulty: "EASY" as const,
      tags: ["Array", "Divide and Conquer", "Tree", "Amazon", "Microsoft", "Google", "Meta"],
      signature: { funcName: "sortedArrayToBST", params: [{ name: "nums", type: "int[]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given an integer array `nums` sorted in strictly increasing order. Build a **height-balanced** binary search tree holding exactly these values — one in which the depths of the two subtrees of every node differ by at most one — and return its root.\n\nMany balanced trees are possible, so build this one: the root of every range `nums[lo..hi]` is its **left-middle** element `nums[(lo + hi) / 2]` (integer division), the elements before it form the left subtree and the elements after it the right subtree, built the same way.",
        EX.map((e) => ({ in: `nums = ${fmtIntArr(e.nums)}`, out: fmtTree(ref(e.nums)), note: e.note })),
        ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "nums is sorted in strictly increasing order"]),
      hints: [
        "The root of a balanced search tree over a sorted range should split the range into two halves of nearly equal size.",
        "Once the root is chosen, the left and right halves are the same problem on smaller ranges.",
        "Recurse on index ranges `[lo, hi]` with `mid = (lo + hi) / 2`; an empty range (`lo > hi`) gives null.",
      ],
      editorial: explain({
        idea: "In-order traversal of a search tree is the sorted array, so any node can root a range as long as smaller elements go left and larger go right. Choosing the middle element each time keeps the two sides within one element of each other, which keeps the tree balanced.",
        steps: [
          "Define `build(lo, hi)`: if `lo > hi`, return null.",
          "Let `mid = (lo + hi) / 2` and create a node with `nums[mid]`.",
          "Set its left child to `build(lo, mid - 1)` and its right child to `build(mid + 1, hi)`.",
          "Return `build(0, n - 1)`.",
        ],
        why: "Every element left of `mid` is smaller and every element right of it is larger, so the search-tree property holds at each node. The two halves differ in size by at most one, so by induction their heights differ by at most one as well.",
        time: "O(n)",
        space: "O(log n) for the recursion (plus the n nodes of the answer)",
        pitfalls: [
          "Use the left-middle element `(lo + hi) / 2`, as the statement fixes — the right-middle also balances but builds a different tree.",
          "Pass indices, not copies of sub-arrays, or the copying costs O(n log n).",
        ],
      }),
      examples: EX.map((e) => ({ input: fmtIntArr(e.nums), expectedOutput: fmtTree(ref(e.nums)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 2, 7, 20, 40]);
        const span = pick(rng, [n + 3, 100, 10000]);
        const set = new Set<number>();
        while (set.size < n) set.add(ri(rng, -span, span));
        const nums = [...set].sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtTree(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def sortedArrayToBST(nums: List[int]) -> Optional[TreeNode]:
              def build(lo: int, hi: int) -> Optional[TreeNode]:
                  if lo > hi:
                      return None
                  mid = (lo + hi) // 2
                  return TreeNode(nums[mid], build(lo, mid - 1), build(mid + 1, hi))
              return build(0, len(nums) - 1)
        `,
        javascript: code`
          var sortedArrayToBST = function(nums) {
              return build(nums, 0, nums.length - 1);
          };

          var build = function(nums, lo, hi) {
              if (lo > hi) return null;
              var mid = (lo + hi) >> 1;
              return new TreeNode(nums[mid], build(nums, lo, mid - 1), build(nums, mid + 1, hi));
          };
        `,
        typescript: code`
          function sortedArrayToBST(nums: number[]): TreeNode | null {
              return build(nums, 0, nums.length - 1);
          }

          function build(nums: number[], lo: number, hi: number): TreeNode | null {
              if (lo > hi) return null;
              var mid = (lo + hi) >> 1;
              return new TreeNode(nums[mid], build(nums, lo, mid - 1), build(nums, mid + 1, hi));
          }
        `,
        java: code`
          public static TreeNode sortedArrayToBST(int[] nums) {
              return build(nums, 0, nums.length - 1);
          }

          static TreeNode build(int[] nums, int lo, int hi) {
              if (lo > hi) return null;
              int mid = (lo + hi) / 2;
              return new TreeNode(nums[mid], build(nums, lo, mid - 1), build(nums, mid + 1, hi));
          }
        `,
        cpp: code`
          TreeNode* build(vector<int>& nums, int lo, int hi);

          TreeNode* sortedArrayToBST(vector<int>& nums) {
              return build(nums, 0, (int) nums.size() - 1);
          }

          TreeNode* build(vector<int>& nums, int lo, int hi) {
              if (lo > hi) return nullptr;
              int mid = (lo + hi) / 2;
              return new TreeNode(nums[mid], build(nums, lo, mid - 1), build(nums, mid + 1, hi));
          }
        `,
        c: code`
          static struct TreeNode* build(int* nums, int lo, int hi);

          struct TreeNode* sortedArrayToBST(int* nums, int numsSize) {
              return build(nums, 0, numsSize - 1);
          }

          static struct TreeNode* build(int* nums, int lo, int hi) {
              if (lo > hi) return NULL;
              int mid = (lo + hi) / 2;
              struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              node->val = nums[mid];
              node->left = build(nums, lo, mid - 1);
              node->right = build(nums, mid + 1, hi);
              return node;
          }
        `,
        csharp: code`
          public static TreeNode SortedArrayToBST(int[] nums)
          {
              return Build(nums, 0, nums.Length - 1);
          }

          static TreeNode Build(int[] nums, int lo, int hi)
          {
              if (lo > hi) return null;
              int mid = (lo + hi) / 2;
              return new TreeNode(nums[mid], Build(nums, lo, mid - 1), Build(nums, mid + 1, hi));
          }
        `,
        go: code`
          func sortedArrayToBST(nums []int) *TreeNode {
              return build(nums, 0, len(nums)-1)
          }

          func build(nums []int, lo, hi int) *TreeNode {
              if lo > hi {
                  return nil
              }
              mid := (lo + hi) / 2
              return &TreeNode{Val: nums[mid], Left: build(nums, lo, mid-1), Right: build(nums, mid+1, hi)}
          }
        `,
        kotlin: kt(`
          fun sortedArrayToBST(nums: IntArray): TreeNode? {
              return build(nums, 0, nums.size - 1)
          }

          fun build(nums: IntArray, lo: Int, hi: Int): TreeNode? {
              if (lo > hi) return null
              val mid = (lo + hi) / 2
              val node = TreeNode(nums[mid])
              node.left = build(nums, lo, mid - 1)
              node.right = build(nums, mid + 1, hi)
              return node
          }
        `),
        swift: code`
          func sortedArrayToBST(_ nums: [Int]) -> TreeNode? {
              return build(nums, 0, nums.count - 1)
          }

          func build(_ nums: [Int], _ lo: Int, _ hi: Int) -> TreeNode? {
              if lo > hi { return nil }
              let mid = (lo + hi) / 2
              let node = TreeNode(nums[mid])
              node.left = build(nums, lo, mid - 1)
              node.right = build(nums, mid + 1, hi)
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sortedArrayToBST(nums: Vec<i32>) -> Option<Rc<RefCell<TreeNode>>> {
              build(&nums, 0, nums.len() as i32 - 1)
          }

          fn build(nums: &Vec<i32>, lo: i32, hi: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if lo > hi {
                  return None;
              }
              let mid = (lo + hi) / 2;
              let node = Rc::new(RefCell::new(TreeNode::new(nums[mid as usize])));
              let left = build(nums, lo, mid - 1);
              let right = build(nums, mid + 1, hi);
              node.borrow_mut().left = left;
              node.borrow_mut().right = right;
              Some(node)
          }
        `,
        php: code`
          function sortedArrayToBST($nums) {
              return buildRange($nums, 0, count($nums) - 1);
          }

          function buildRange($nums, $lo, $hi) {
              if ($lo > $hi) return null;
              $mid = intdiv($lo + $hi, 2);
              return new TreeNode($nums[$mid], buildRange($nums, $lo, $mid - 1), buildRange($nums, $mid + 1, $hi));
          }
        `,
        ruby: code`
          def sortedArrayToBST(nums)
            build_range(nums, 0, nums.length - 1)
          end

          def build_range(nums, lo, hi)
            return nil if lo > hi
            mid = (lo + hi) / 2
            TreeNode.new(nums[mid], build_range(nums, lo, mid - 1), build_range(nums, mid + 1, hi))
          end
        `,
      },
    };
  })(),

  // ── Count Complete Tree Nodes (LC 222) ──────────────────────────
  (() => {
    const ref = (root: TNode | null) => nodesOf(root).length;
    const EX = [
      { root: [1, 2, 3, 4, 5, 6], note: "Two full levels plus three nodes on the last one." },
      { root: [], note: "The empty tree has no nodes." },
      { root: [1], note: "Just the root." },
    ];
    return {
      slug: "count-complete-tree-nodes",
      title: "Count Complete Tree Nodes",
      difficulty: "EASY" as const,
      tags: ["Binary Search", "Bit Manipulation", "Tree", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "countNodes", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a **complete** binary tree: every level is completely filled except possibly the last, and the nodes of the last level are packed as far left as possible.\n\nReturn the number of nodes in the tree. Aim for an algorithm that runs in less than `O(n)` time.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 5 * 10^4", "0 <= Node.val <= 5 * 10^4", "the tree is complete"]),
      hints: [
        "Counting every node is O(n). The completeness should let you skip whole subtrees.",
        "Walk down the leftmost path and the rightmost path. If they are equally long, the tree is perfect and has `2^h - 1` nodes.",
        "Otherwise count `1 + count(left) + count(right)`: at least one of the two subtrees is perfect and is answered by the height check at once.",
      ],
      editorial: explain({
        idea: "A perfect tree of height `h` has `2^h - 1` nodes, and checking whether a complete subtree is perfect costs only its height: compare the length of its leftmost path with the length of its rightmost path. Recursing only where the check fails touches O(log n) subtrees.",
        steps: [
          "If the node is null, return 0.",
          "Measure `lh`, the number of nodes on the path that always goes left, and `rh`, the number on the path that always goes right.",
          "If `lh == rh`, the subtree is perfect: return `2^lh - 1`.",
          "Otherwise return `1 + countNodes(left) + countNodes(right)`.",
        ],
        why: "In a complete tree, the leftmost path reaches the deepest level. If the rightmost path is just as long, the last level is full, so the tree is perfect. If not, the last level's boundary lies in one subtree: the other subtree is perfect and stops after one height check, so each level of the recursion does real work in only one subtree.",
        time: "O(log² n) — O(log n) levels, each with O(log n) height walks",
        space: "O(log n) for the recursion",
        pitfalls: [
          "Count heights in nodes, not edges, so a perfect tree of height `h` has `2^h - 1` nodes.",
          "A plain traversal is accepted for correctness but misses what the problem is about.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 0 : sizeOf(rng, [1, 3, 15, 31, 40]);
        const root = treeFrom(Array.from({ length: n }, () => ri(rng, 0, pick(rng, [9, 50000]))));
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def countNodes(root: Optional[TreeNode]) -> int:
              if root is None:
                  return 0
              lh, node = 0, root
              while node:
                  lh += 1
                  node = node.left
              rh, node = 0, root
              while node:
                  rh += 1
                  node = node.right
              if lh == rh:
                  return (1 << lh) - 1
              return 1 + countNodes(root.left) + countNodes(root.right)
        `,
        javascript: code`
          var countNodes = function(root) {
              if (root === null) return 0;
              var lh = 0, rh = 0, node;
              for (node = root; node !== null; node = node.left) lh++;
              for (node = root; node !== null; node = node.right) rh++;
              if (lh === rh) return (1 << lh) - 1;
              return 1 + countNodes(root.left) + countNodes(root.right);
          };
        `,
        typescript: code`
          function countNodes(root: TreeNode | null): number {
              if (root === null) return 0;
              var lh = 0, rh = 0;
              var node: TreeNode | null;
              for (node = root; node !== null; node = node.left) lh++;
              for (node = root; node !== null; node = node.right) rh++;
              if (lh === rh) return (1 << lh) - 1;
              return 1 + countNodes(root.left) + countNodes(root.right);
          }
        `,
        java: code`
          public static int countNodes(TreeNode root) {
              if (root == null) return 0;
              int lh = 0, rh = 0;
              for (TreeNode node = root; node != null; node = node.left) lh++;
              for (TreeNode node = root; node != null; node = node.right) rh++;
              if (lh == rh) return (1 << lh) - 1;
              return 1 + countNodes(root.left) + countNodes(root.right);
          }
        `,
        cpp: code`
          int countNodes(TreeNode* root) {
              if (!root) return 0;
              int lh = 0, rh = 0;
              for (TreeNode* node = root; node; node = node->left) lh++;
              for (TreeNode* node = root; node; node = node->right) rh++;
              if (lh == rh) return (1 << lh) - 1;
              return 1 + countNodes(root->left) + countNodes(root->right);
          }
        `,
        c: code`
          int countNodes(struct TreeNode* root) {
              if (root == NULL) return 0;
              int lh = 0, rh = 0;
              for (struct TreeNode* node = root; node != NULL; node = node->left) lh++;
              for (struct TreeNode* node = root; node != NULL; node = node->right) rh++;
              if (lh == rh) return (1 << lh) - 1;
              return 1 + countNodes(root->left) + countNodes(root->right);
          }
        `,
        csharp: code`
          public static int CountNodes(TreeNode root)
          {
              if (root == null) return 0;
              int lh = 0, rh = 0;
              for (var node = root; node != null; node = node.left) lh++;
              for (var node = root; node != null; node = node.right) rh++;
              if (lh == rh) return (1 << lh) - 1;
              return 1 + CountNodes(root.left) + CountNodes(root.right);
          }
        `,
        go: code`
          func countNodes(root *TreeNode) int {
              if root == nil {
                  return 0
              }
              lh, rh := 0, 0
              for node := root; node != nil; node = node.Left {
                  lh++
              }
              for node := root; node != nil; node = node.Right {
                  rh++
              }
              if lh == rh {
                  return (1 << lh) - 1
              }
              return 1 + countNodes(root.Left) + countNodes(root.Right)
          }
        `,
        kotlin: kt(`
          fun countNodes(root: TreeNode?): Int {
              if (root == null) return 0
              var lh = 0
              var rh = 0
              var node: TreeNode? = root
              while (node != null) { lh++; node = node.left }
              node = root
              while (node != null) { rh++; node = node.right }
              if (lh == rh) return (1 shl lh) - 1
              return 1 + countNodes(root.left) + countNodes(root.right)
          }
        `),
        swift: code`
          func countNodes(_ root: TreeNode?) -> Int {
              guard let r = root else { return 0 }
              var lh = 0, rh = 0
              var node: TreeNode? = r
              while let n = node { lh += 1; node = n.left }
              node = r
              while let n = node { rh += 1; node = n.right }
              if lh == rh { return (1 << lh) - 1 }
              return 1 + countNodes(r.left) + countNodes(r.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn countNodes(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              countFrom(&root)
          }

          fn countFrom(node: &Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let n = match node {
                  None => return 0,
                  Some(n) => n,
              };
              let mut lh = 0;
              let mut cur = node.clone();
              while let Some(c) = cur {
                  lh += 1;
                  cur = c.borrow().left.clone();
              }
              let mut rh = 0;
              let mut cur = node.clone();
              while let Some(c) = cur {
                  rh += 1;
                  cur = c.borrow().right.clone();
              }
              if lh == rh {
                  return (1 << lh) - 1;
              }
              let b = n.borrow();
              let total = 1 + countFrom(&b.left) + countFrom(&b.right);
              total
          }
        `,
        php: code`
          function countNodes($root) {
              if ($root === null) return 0;
              $lh = 0;
              $rh = 0;
              for ($node = $root; $node !== null; $node = $node->left) $lh++;
              for ($node = $root; $node !== null; $node = $node->right) $rh++;
              if ($lh == $rh) return (1 << $lh) - 1;
              return 1 + countNodes($root->left) + countNodes($root->right);
          }
        `,
        ruby: code`
          def countNodes(root)
            return 0 if root.nil?
            lh = 0
            node = root
            while node
              lh += 1
              node = node.left
            end
            rh = 0
            node = root
            while node
              rh += 1
              node = node.right
            end
            return (1 << lh) - 1 if lh == rh
            1 + countNodes(root.left) + countNodes(root.right)
          end
        `,
      },
    };
  })(),

  // ── Left View of Binary Tree (GFG) ──────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const out: number[] = [];
      const walk = (n: TNode | null, d: number) => { if (!n) return; if (d === out.length) out.push(n.val); walk(n.left, d + 1); walk(n.right, d + 1); };
      walk(root, 0);
      return out;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6, 7, null, 8], note: "Looking from the left you see 1, then 2, then 4, and finally 8 on the deepest level." },
      { root: [1, null, 2, null, 3], note: "Every level holds one node, so each is the first on its level even though they hang to the right." },
      { root: [], note: "An empty tree shows nothing." },
    ];
    return {
      slug: "left-view-of-binary-tree",
      title: "Left View of Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Breadth-First Search", "Depth-First Search", "Amazon", "Flipkart", "Paytm", "Samsung"],
      signature: { funcName: "leftView", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "The **left view** of a binary tree is the set of nodes you would see standing to the left of it: the first (leftmost) node of every level.\n\nGiven the `root` of a binary tree, return the values of its left view from the top level down. Return an empty list for an empty tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["0 <= number of nodes <= 10^5", "0 <= Node.val <= 10^5"]),
      hints: [
        "The answer has exactly one value per level.",
        "A level-order traversal (BFS) meets each level's nodes from left to right — take the first one of every level.",
        "Alternatively, a depth-first search that visits left before right reaches each depth first through its leftmost node: record a node when its depth equals the number of values collected so far.",
      ],
      editorial: explain({
        idea: "Process the tree one level at a time; the first node dequeued on each level is the one seen from the left.",
        steps: [
          "If the tree is empty, return an empty list.",
          "Put the root in a queue.",
          "While the queue is not empty: note `size`, the number of nodes on the current level, and append the value of the node at the front.",
          "Dequeue those `size` nodes, enqueuing each one's left child then right child.",
          "Return the collected values.",
        ],
        why: "Children are enqueued left before right and level by level, so the queue always holds one complete level in left-to-right order when a new level starts, and its front is that level's leftmost node.",
        time: "O(n)",
        space: "O(w), w the largest number of nodes on one level",
        pitfalls: [
          "The leftmost node of a level need not be a left child — on a level reached only through right children it is a right child.",
          "Iterative traversal avoids the deep recursion a 10^5-node chain would cause.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = shapeTree(rng, n, 0, pick(rng, [9, 1000, 100000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List, Optional

          def leftView(root: Optional[TreeNode]) -> List[int]:
              out = []
              queue = deque([root]) if root else deque()
              while queue:
                  out.append(queue[0].val)
                  for _ in range(len(queue)):
                      node = queue.popleft()
                      if node.left:
                          queue.append(node.left)
                      if node.right:
                          queue.append(node.right)
              return out
        `,
        javascript: code`
          var leftView = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  out.push(queue[head].val);
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
          function leftView(root: TreeNode | null): number[] {
              var out: number[] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0;
              while (head < queue.length) {
                  var end = queue.length;
                  out.push(queue[head].val);
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
          public static int[] leftView(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  out.add(queue.peek().val);
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
          vector<int> leftView(TreeNode* root) {
              vector<int> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  out.push_back(q.front()->val);
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
          static int countAll(struct TreeNode* node);

          int* leftView(struct TreeNode* root, int* returnSize) {
              int n = countAll(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, len = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  out[len++] = queue[head]->val;
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

          static int countAll(struct TreeNode* node) {
              if (node == NULL) return 0;
              return 1 + countAll(node->left) + countAll(node->right);
          }
        `,
        csharp: code`
          public static int[] LeftView(TreeNode root)
          {
              var output = new List<int>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              while (queue.Count > 0)
              {
                  output.Add(queue.Peek().val);
                  for (int i = queue.Count; i > 0; i--)
                  {
                      var node = queue.Dequeue();
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
              }
              return output.ToArray();
          }
        `,
        go: code`
          func leftView(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              queue := []*TreeNode{root}
              head := 0
              for head < len(queue) {
                  end := len(queue)
                  out = append(out, queue[head].Val)
                  for ; head < end; head++ {
                      node := queue[head]
                      if node.Left != nil {
                          queue = append(queue, node.Left)
                      }
                      if node.Right != nil {
                          queue = append(queue, node.Right)
                      }
                  }
              }
              return out
          }
        `,
        kotlin: kt(`
          fun leftView(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              if (root == null) return IntArray(0)
              val queue = ArrayList<TreeNode>()
              queue.add(root)
              var head = 0
              while (head < queue.size) {
                  val end = queue.size
                  out.add(queue[head].\`val\`)
                  while (head < end) {
                      val node = queue[head++]
                      val l = node.left
                      val r = node.right
                      if (l != null) queue.add(l)
                      if (r != null) queue.add(r)
                  }
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func leftView(_ root: TreeNode?) -> [Int] {
              var out: [Int] = []
              guard let r = root else { return out }
              var queue: [TreeNode] = [r]
              var head = 0
              while head < queue.count {
                  let end = queue.count
                  out.append(queue[head].val)
                  while head < end {
                      let node = queue[head]
                      head += 1
                      if let l = node.left { queue.append(l) }
                      if let rt = node.right { queue.append(rt) }
                  }
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::VecDeque;

          fn leftView(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              let mut queue: VecDeque<Rc<RefCell<TreeNode>>> = VecDeque::new();
              if let Some(r) = root {
                  queue.push_back(r);
              }
              while !queue.is_empty() {
                  out.push(queue.front().unwrap().borrow().val);
                  for _ in 0..queue.len() {
                      let node = queue.pop_front().unwrap();
                      let b = node.borrow();
                      if let Some(l) = &b.left {
                          queue.push_back(l.clone());
                      }
                      if let Some(r) = &b.right {
                          queue.push_back(r.clone());
                      }
                  }
              }
              out
          }
        `,
        php: code`
          function leftView($root) {
              $out = [];
              if ($root === null) return $out;
              $queue = [$root];
              $head = 0;
              while ($head < count($queue)) {
                  $end = count($queue);
                  $out[] = $queue[$head]->val;
                  while ($head < $end) {
                      $node = $queue[$head++];
                      if ($node->left !== null) $queue[] = $node->left;
                      if ($node->right !== null) $queue[] = $node->right;
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def leftView(root)
            out = []
            return out if root.nil?
            level = [root]
            until level.empty?
              out << level[0].val
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

  // ── Transform to Sum Tree (GFG) ─────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const fold = (n: TNode | null): number => {
        if (!n) return 0;
        const old = n.val;
        n.val = fold(n.left) + fold(n.right);
        return old + n.val;
      };
      fold(root);
      return root;
    };
    const EX = [
      { root: [10, -2, 6, 8, -4, 7, 5], note: "The root's subtrees hold -2 + 8 - 4 = 2 and 6 + 7 + 5 = 18, so it becomes 20; -2 becomes 8 - 4 = 4, 6 becomes 12, and every leaf becomes 0." },
      { root: [1], note: "A single leaf has nothing below it." },
      { root: [3, 1, null, 2], note: "3 becomes 1 + 2 = 3, 1 becomes 2, and the leaf 2 becomes 0." },
    ];
    return {
      slug: "transform-to-sum-tree",
      title: "Transform to Sum Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "toSumTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree, convert it **in place** into a sum tree: every node's new value is the sum of the **original** values of all nodes in its left and right subtrees. Leaves therefore become `0`.\n\nReturn the root of the transformed tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^4", "-1000 <= Node.val <= 1000"]),
      hints: [
        "A node's new value needs the totals of both subtrees, so the subtrees must be handled first — a post-order traversal.",
        "Let the recursion return the sum of the original values in the subtree it processed.",
        "At a node: remember its old value, set it to (left result + right result), and return old value + new value.",
      ],
      editorial: explain({
        idea: "Post-order recursion computes each subtree's total on the way back up. A node's new value is the total of its two subtrees, and the total it reports to its parent is that plus its own original value.",
        steps: [
          "Define `fold(node)` returning the sum of the original values in `node`'s subtree; `fold(null) = 0`.",
          "At a node: save `old = node.val`, compute `below = fold(left) + fold(right)`, set `node.val = below`.",
          "Return `old + below`.",
          "Call `fold(root)` and return `root`.",
        ],
        why: "When `fold` returns from a child, that child's subtree has been rewritten but the value returned is the sum of its original values, which is exactly what the parent's new value needs.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Reading a child's value after it was rewritten gives its subtree sum without its own original value — return the original total instead.",
          "A leaf becomes 0, not its own value.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const m = pick(rng, [5, 100, 1000]);
        const root = shapeTree(rng, n, -m, m);
        const input = fmtTree(root);
        return { input, expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def toSumTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
              fold(root)
              return root

          def fold(node: Optional[TreeNode]) -> int:
              # Rewrites the subtree and returns the sum of its original values.
              if node is None:
                  return 0
              old = node.val
              node.val = fold(node.left) + fold(node.right)
              return old + node.val
        `,
        javascript: code`
          var toSumTree = function(root) {
              fold(root);
              return root;
          };

          // Rewrites the subtree and returns the sum of its original values.
          var fold = function(node) {
              if (node === null) return 0;
              var old = node.val;
              node.val = fold(node.left) + fold(node.right);
              return old + node.val;
          };
        `,
        typescript: code`
          function toSumTree(root: TreeNode | null): TreeNode | null {
              fold(root);
              return root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          function fold(node: TreeNode | null): number {
              if (node === null) return 0;
              var old = node.val;
              node.val = fold(node.left) + fold(node.right);
              return old + node.val;
          }
        `,
        java: code`
          public static TreeNode toSumTree(TreeNode root) {
              fold(root);
              return root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          static int fold(TreeNode node) {
              if (node == null) return 0;
              int old = node.val;
              node.val = fold(node.left) + fold(node.right);
              return old + node.val;
          }
        `,
        cpp: code`
          int fold(TreeNode* node);

          TreeNode* toSumTree(TreeNode* root) {
              fold(root);
              return root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          int fold(TreeNode* node) {
              if (!node) return 0;
              int old = node->val;
              node->val = fold(node->left) + fold(node->right);
              return old + node->val;
          }
        `,
        c: code`
          static int fold(struct TreeNode* node);

          struct TreeNode* toSumTree(struct TreeNode* root) {
              fold(root);
              return root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          static int fold(struct TreeNode* node) {
              if (node == NULL) return 0;
              int old = node->val;
              node->val = fold(node->left) + fold(node->right);
              return old + node->val;
          }
        `,
        csharp: code`
          public static TreeNode ToSumTree(TreeNode root)
          {
              Fold(root);
              return root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          static int Fold(TreeNode node)
          {
              if (node == null) return 0;
              int old = node.val;
              node.val = Fold(node.left) + Fold(node.right);
              return old + node.val;
          }
        `,
        go: code`
          func toSumTree(root *TreeNode) *TreeNode {
              fold(root)
              return root
          }

          // fold rewrites the subtree and returns the sum of its original values.
          func fold(node *TreeNode) int {
              if node == nil {
                  return 0
              }
              old := node.Val
              node.Val = fold(node.Left) + fold(node.Right)
              return old + node.Val
          }
        `,
        kotlin: kt(`
          fun toSumTree(root: TreeNode?): TreeNode? {
              fold(root)
              return root
          }

          // Rewrites the subtree and returns the sum of its original values.
          fun fold(node: TreeNode?): Int {
              if (node == null) return 0
              val old = node.\`val\`
              node.\`val\` = fold(node.left) + fold(node.right)
              return old + node.\`val\`
          }
        `),
        swift: code`
          func toSumTree(_ root: TreeNode?) -> TreeNode? {
              fold(root)
              return root
          }

          // Rewrites the subtree and returns the sum of its original values.
          @discardableResult
          func fold(_ node: TreeNode?) -> Int {
              guard let n = node else { return 0 }
              let old = n.val
              n.val = fold(n.left) + fold(n.right)
              return old + n.val
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn toSumTree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              fold(&root);
              root
          }

          // Rewrites the subtree and returns the sum of its original values.
          fn fold(node: &Option<Rc<RefCell<TreeNode>>>) -> i32 {
              match node {
                  None => 0,
                  Some(n) => {
                      let (l, r) = {
                          let b = n.borrow();
                          (b.left.clone(), b.right.clone())
                      };
                      let below = fold(&l) + fold(&r);
                      let mut b = n.borrow_mut();
                      let old = b.val;
                      b.val = below;
                      old + below
                  }
              }
          }
        `,
        php: code`
          function toSumTree($root) {
              foldSum($root);
              return $root;
          }

          // Rewrites the subtree and returns the sum of its original values.
          function foldSum($node) {
              if ($node === null) return 0;
              $old = $node->val;
              $node->val = foldSum($node->left) + foldSum($node->right);
              return $old + $node->val;
          }
        `,
        ruby: code`
          def toSumTree(root)
            fold_sum(root)
            root
          end

          # Rewrites the subtree and returns the sum of its original values.
          def fold_sum(node)
            return 0 if node.nil?
            old = node.val
            node.val = fold_sum(node.left) + fold_sum(node.right)
            old + node.val
          end
        `,
      },
    };
  })(),

  // ── Children Sum in a Binary Tree (GFG) ─────────────────────────
  (() => {
    const ref = (root: TNode | null) =>
      nodesOf(root).every((n) => isLeaf(n) || n.val === (n.left ? n.left.val : 0) + (n.right ? n.right.val : 0));
    const EX = [
      { root: [35, 20, 15, 15, 5, 10, 5], note: "20 = 15 + 5, 15 = 10 + 5 and 35 = 20 + 15; leaves need no check." },
      { root: [1, 4, 3, 5], note: "4 has the single child 5, and 4 ≠ 5 (the root fails too: 1 ≠ 4 + 3)." },
      { root: [10, 10], note: "A missing child counts as 0: 10 = 10 + 0." },
    ];
    return {
      slug: "children-sum-property",
      title: "Children Sum in a Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Microsoft", "Samsung"],
      signature: { funcName: "isSumProperty", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "A binary tree has the **children sum property** if, for every node that has at least one child, the node's value equals the sum of its children's values. A missing child counts as `0`, and leaves satisfy the property automatically.\n\nGiven the `root` of a binary tree, return `true` if every node satisfies the property, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "The property is local: each node only needs its own value and its children's values.",
        "Skip leaves; for any other node add up the children that exist and compare.",
        "Visit every node (any traversal) and stop at the first one that fails.",
      ],
      editorial: explain({
        idea: "The condition involves a node and its direct children only, so checking it at every non-leaf node during one traversal decides the whole tree.",
        steps: [
          "Traverse the tree.",
          "At a leaf, do nothing.",
          "At any other node, compute `sum` = left child's value (or 0) + right child's value (or 0); if `sum != node.val`, return `false`.",
          "If the traversal finishes, return `true`.",
        ],
        time: "O(n)",
        space: "O(h) for the recursion or stack",
        pitfalls: [
          "A node with one child must equal that child's value alone — the missing child adds 0.",
          "Leaves have no children to sum; do not require them to be 0.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = shapeTree(rng, n, 1, pick(rng, [5, 1000]));
        if (rng() < 0.75) {
          const fix = (t: TNode | null): number => {
            if (!t) return 0;
            const s = fix(t.left) + fix(t.right);
            if (!isLeaf(t)) t.val = s;
            return t.val;
          };
          fix(root);
          if (rng() < 0.4) { const t = pick(rng, nodesOf(root)); t.val = Math.max(1, t.val + pick(rng, [-3, -1, 1, 2, 7])); }
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSumProperty(root: Optional[TreeNode]) -> bool:
              stack = [root] if root else []
              while stack:
                  node = stack.pop()
                  if node.left is None and node.right is None:
                      continue
                  total = (node.left.val if node.left else 0) + (node.right.val if node.right else 0)
                  if total != node.val:
                      return False
                  if node.left:
                      stack.append(node.left)
                  if node.right:
                      stack.append(node.right)
              return True
        `,
        javascript: code`
          var isSumProperty = function(root) {
              var stack = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (node.left === null && node.right === null) continue;
                  var total = (node.left !== null ? node.left.val : 0) + (node.right !== null ? node.right.val : 0);
                  if (total !== node.val) return false;
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return true;
          };
        `,
        typescript: code`
          function isSumProperty(root: TreeNode | null): boolean {
              var stack: TreeNode[] = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (node.left === null && node.right === null) continue;
                  var total = (node.left !== null ? node.left.val : 0) + (node.right !== null ? node.right.val : 0);
                  if (total !== node.val) return false;
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return true;
          }
        `,
        java: code`
          public static boolean isSumProperty(TreeNode root) {
              if (root == null || (root.left == null && root.right == null)) return true;
              int total = (root.left != null ? root.left.val : 0) + (root.right != null ? root.right.val : 0);
              return total == root.val && isSumProperty(root.left) && isSumProperty(root.right);
          }
        `,
        cpp: code`
          bool isSumProperty(TreeNode* root) {
              if (!root || (!root->left && !root->right)) return true;
              int total = (root->left ? root->left->val : 0) + (root->right ? root->right->val : 0);
              return total == root->val && isSumProperty(root->left) && isSumProperty(root->right);
          }
        `,
        c: code`
          bool isSumProperty(struct TreeNode* root) {
              if (root == NULL || (root->left == NULL && root->right == NULL)) return true;
              int total = (root->left != NULL ? root->left->val : 0) + (root->right != NULL ? root->right->val : 0);
              return total == root->val && isSumProperty(root->left) && isSumProperty(root->right);
          }
        `,
        csharp: code`
          public static bool IsSumProperty(TreeNode root)
          {
              if (root == null || (root.left == null && root.right == null)) return true;
              int total = (root.left != null ? root.left.val : 0) + (root.right != null ? root.right.val : 0);
              return total == root.val && IsSumProperty(root.left) && IsSumProperty(root.right);
          }
        `,
        go: code`
          func isSumProperty(root *TreeNode) bool {
              if root == nil || (root.Left == nil && root.Right == nil) {
                  return true
              }
              total := 0
              if root.Left != nil {
                  total += root.Left.Val
              }
              if root.Right != nil {
                  total += root.Right.Val
              }
              return total == root.Val && isSumProperty(root.Left) && isSumProperty(root.Right)
          }
        `,
        kotlin: kt(`
          fun isSumProperty(root: TreeNode?): Boolean {
              if (root == null) return true
              val l = root.left
              val r = root.right
              if (l == null && r == null) return true
              val total = (l?.\`val\` ?: 0) + (r?.\`val\` ?: 0)
              return total == root.\`val\` && isSumProperty(l) && isSumProperty(r)
          }
        `),
        swift: code`
          func isSumProperty(_ root: TreeNode?) -> Bool {
              guard let r = root else { return true }
              if r.left == nil && r.right == nil { return true }
              let total = (r.left?.val ?? 0) + (r.right?.val ?? 0)
              return total == r.val && isSumProperty(r.left) && isSumProperty(r.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSumProperty(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              holds(&root)
          }

          fn holds(node: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match node {
                  None => true,
                  Some(n) => {
                      let b = n.borrow();
                      if b.left.is_none() && b.right.is_none() {
                          return true;
                      }
                      let mut total = 0;
                      if let Some(l) = &b.left {
                          total += l.borrow().val;
                      }
                      if let Some(r) = &b.right {
                          total += r.borrow().val;
                      }
                      let ok = total == b.val && holds(&b.left) && holds(&b.right);
                      ok
                  }
              }
          }
        `,
        php: code`
          function isSumProperty($root) {
              if ($root === null || ($root->left === null && $root->right === null)) return true;
              $total = ($root->left !== null ? $root->left->val : 0) + ($root->right !== null ? $root->right->val : 0);
              return $total == $root->val && isSumProperty($root->left) && isSumProperty($root->right);
          }
        `,
        ruby: code`
          def isSumProperty(root)
            return true if root.nil? || (root.left.nil? && root.right.nil?)
            total = (root.left ? root.left.val : 0) + (root.right ? root.right.val : 0)
            total == root.val && isSumProperty(root.left) && isSumProperty(root.right)
          end
        `,
      },
    };
  })(),

  // ── Check if All Leaves are at Same Level (GFG) ─────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const depths = new Set<number>();
      const walk = (n: TNode | null, d: number) => { if (!n) return; if (isLeaf(n)) depths.add(d); walk(n.left, d + 1); walk(n.right, d + 1); };
      walk(root, 0);
      return depths.size <= 1;
    };
    const EX = [
      { root: [1, 2, 3], note: "Both leaves, 2 and 3, are one level below the root." },
      { root: [10, 20, 30, 10, 15], note: "The leaves 10 and 15 are two levels down, but the leaf 30 is only one." },
      { root: [7, 3, null, null, 1], note: "The tree is a path, so its single leaf is trivially level with itself." },
    ];
    return {
      slug: "check-if-leaves-are-at-same-level",
      title: "Check if All Leaves are at Same Level",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Paytm"],
      signature: { funcName: "check", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, return `true` if **all of its leaves** (nodes with no children) are at the same depth, and `false` otherwise.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Only the depths of the leaves matter.",
        "Traverse the tree carrying the current depth; the first leaf you meet fixes the depth every other leaf must have.",
        "Return `false` as soon as a leaf at a different depth turns up.",
      ],
      editorial: explain({
        idea: "Record the depth of the first leaf the traversal reaches, then require every later leaf to match it.",
        steps: [
          "Set `leafDepth = -1` (no leaf seen yet).",
          "Traverse the tree depth-first, passing each node its depth.",
          "At a leaf: if `leafDepth` is -1, set it to this depth; otherwise, if the depths differ, the answer is `false`.",
          "If the traversal finishes, return `true`.",
        ],
        why: "All leaves are at one depth exactly when each of them equals the depth of any one of them — the first one found serves as that reference.",
        time: "O(n)",
        space: "O(h) for the recursion (or O(w) with a level-order traversal)",
        pitfalls: [
          "A node with one child is not a leaf, even though one side is empty.",
          "A level-order variant works too: once a level contains a leaf, it must be the last level.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        let root: TNode | null;
        if (rng() < 0.55) {
          const D = ri(rng, 0, 4);
          const grow = (d: number): TNode => {
            const t: TNode = { val: ri(rng, 1, 1000), left: null, right: null };
            if (d < D) {
              const k = ri(rng, 0, 2);
              if (k !== 1) t.left = grow(d + 1);
              if (k !== 0) t.right = grow(d + 1);
            }
            return t;
          };
          root = grow(0);
          if (rng() < 0.3) {
            const nodes = nodesOf(root).filter((t) => !isLeaf(t));
            if (nodes.length) {
              const t = pick(rng, nodes);
              if (rng() < 0.5) { if (t.left && t.right) t.left = null; } else if (!t.left) t.left = { val: ri(rng, 1, 1000), left: null, right: null }; else if (!t.right) t.right = { val: ri(rng, 1, 1000), left: null, right: null };
            }
          }
        } else {
          root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 1, 1000);
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def check(root: Optional[TreeNode]) -> bool:
              leaf_depth = -1
              stack = [(root, 0)]
              while stack:
                  node, depth = stack.pop()
                  if node.left is None and node.right is None:
                      if leaf_depth < 0:
                          leaf_depth = depth
                      elif depth != leaf_depth:
                          return False
                  if node.left:
                      stack.append((node.left, depth + 1))
                  if node.right:
                      stack.append((node.right, depth + 1))
              return True
        `,
        javascript: code`
          var check = function(root) {
              var leafDepth = -1;
              var stack = [[root, 0]];
              while (stack.length > 0) {
                  var top = stack.pop(), node = top[0], depth = top[1];
                  if (node.left === null && node.right === null) {
                      if (leafDepth < 0) leafDepth = depth;
                      else if (depth !== leafDepth) return false;
                  }
                  if (node.left !== null) stack.push([node.left, depth + 1]);
                  if (node.right !== null) stack.push([node.right, depth + 1]);
              }
              return true;
          };
        `,
        typescript: code`
          function check(root: TreeNode | null): boolean {
              var leafDepth = [-1];
              return sameLevel(root, 0, leafDepth);
          }

          function sameLevel(node: TreeNode | null, depth: number, leafDepth: number[]): boolean {
              if (node === null) return true;
              if (node.left === null && node.right === null) {
                  if (leafDepth[0] < 0) leafDepth[0] = depth;
                  return leafDepth[0] === depth;
              }
              return sameLevel(node.left, depth + 1, leafDepth) && sameLevel(node.right, depth + 1, leafDepth);
          }
        `,
        java: code`
          public static boolean check(TreeNode root) {
              int[] leafDepth = { -1 };
              return sameLevel(root, 0, leafDepth);
          }

          static boolean sameLevel(TreeNode node, int depth, int[] leafDepth) {
              if (node == null) return true;
              if (node.left == null && node.right == null) {
                  if (leafDepth[0] < 0) leafDepth[0] = depth;
                  return leafDepth[0] == depth;
              }
              return sameLevel(node.left, depth + 1, leafDepth) && sameLevel(node.right, depth + 1, leafDepth);
          }
        `,
        cpp: code`
          bool sameLevel(TreeNode* node, int depth, int& leafDepth);

          bool check(TreeNode* root) {
              int leafDepth = -1;
              return sameLevel(root, 0, leafDepth);
          }

          bool sameLevel(TreeNode* node, int depth, int& leafDepth) {
              if (!node) return true;
              if (!node->left && !node->right) {
                  if (leafDepth < 0) leafDepth = depth;
                  return leafDepth == depth;
              }
              return sameLevel(node->left, depth + 1, leafDepth) && sameLevel(node->right, depth + 1, leafDepth);
          }
        `,
        c: code`
          static bool sameLevel(struct TreeNode* node, int depth, int* leafDepth);

          bool check(struct TreeNode* root) {
              int leafDepth = -1;
              return sameLevel(root, 0, &leafDepth);
          }

          static bool sameLevel(struct TreeNode* node, int depth, int* leafDepth) {
              if (node == NULL) return true;
              if (node->left == NULL && node->right == NULL) {
                  if (*leafDepth < 0) *leafDepth = depth;
                  return *leafDepth == depth;
              }
              return sameLevel(node->left, depth + 1, leafDepth) && sameLevel(node->right, depth + 1, leafDepth);
          }
        `,
        csharp: code`
          public static bool Check(TreeNode root)
          {
              int leafDepth = -1;
              return SameLevel(root, 0, ref leafDepth);
          }

          static bool SameLevel(TreeNode node, int depth, ref int leafDepth)
          {
              if (node == null) return true;
              if (node.left == null && node.right == null)
              {
                  if (leafDepth < 0) leafDepth = depth;
                  return leafDepth == depth;
              }
              return SameLevel(node.left, depth + 1, ref leafDepth) && SameLevel(node.right, depth + 1, ref leafDepth);
          }
        `,
        go: code`
          func check(root *TreeNode) bool {
              leafDepth := -1
              var sameLevel func(node *TreeNode, depth int) bool
              sameLevel = func(node *TreeNode, depth int) bool {
                  if node == nil {
                      return true
                  }
                  if node.Left == nil && node.Right == nil {
                      if leafDepth < 0 {
                          leafDepth = depth
                      }
                      return leafDepth == depth
                  }
                  return sameLevel(node.Left, depth+1) && sameLevel(node.Right, depth+1)
              }
              return sameLevel(root, 0)
          }
        `,
        kotlin: kt(`
          fun check(root: TreeNode?): Boolean {
              var leafDepth = -1
              fun sameLevel(node: TreeNode?, depth: Int): Boolean {
                  if (node == null) return true
                  if (node.left == null && node.right == null) {
                      if (leafDepth < 0) leafDepth = depth
                      return leafDepth == depth
                  }
                  return sameLevel(node.left, depth + 1) && sameLevel(node.right, depth + 1)
              }
              return sameLevel(root, 0)
          }
        `),
        swift: code`
          func check(_ root: TreeNode?) -> Bool {
              var leafDepth = -1
              func sameLevel(_ node: TreeNode?, _ depth: Int) -> Bool {
                  guard let n = node else { return true }
                  if n.left == nil && n.right == nil {
                      if leafDepth < 0 { leafDepth = depth }
                      return leafDepth == depth
                  }
                  return sameLevel(n.left, depth + 1) && sameLevel(n.right, depth + 1)
              }
              return sameLevel(root, 0)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn check(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut leaf_depth = -1;
              sameLevel(&root, 0, &mut leaf_depth)
          }

          fn sameLevel(node: &Option<Rc<RefCell<TreeNode>>>, depth: i32, leaf_depth: &mut i32) -> bool {
              match node {
                  None => true,
                  Some(n) => {
                      let b = n.borrow();
                      if b.left.is_none() && b.right.is_none() {
                          if *leaf_depth < 0 {
                              *leaf_depth = depth;
                          }
                          return *leaf_depth == depth;
                      }
                      let ok = sameLevel(&b.left, depth + 1, leaf_depth) && sameLevel(&b.right, depth + 1, leaf_depth);
                      ok
                  }
              }
          }
        `,
        php: code`
          function check($root) {
              $leafDepth = -1;
              return sameLevel($root, 0, $leafDepth);
          }

          function sameLevel($node, $depth, &$leafDepth) {
              if ($node === null) return true;
              if ($node->left === null && $node->right === null) {
                  if ($leafDepth < 0) $leafDepth = $depth;
                  return $leafDepth == $depth;
              }
              return sameLevel($node->left, $depth + 1, $leafDepth) && sameLevel($node->right, $depth + 1, $leafDepth);
          }
        `,
        ruby: code`
          def check(root)
            leaf_depth = -1
            stack = [[root, 0]]
            until stack.empty?
              node, depth = stack.pop
              if node.left.nil? && node.right.nil?
                if leaf_depth < 0
                  leaf_depth = depth
                elsif depth != leaf_depth
                  return false
                end
              end
              stack << [node.left, depth + 1] if node.left
              stack << [node.right, depth + 1] if node.right
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Check if Two Trees are Isomorphic (GFG) ─────────────────────
  (() => {
    const iso = (a: TNode | null, b: TNode | null): boolean => {
      if (!a && !b) return true;
      if (!a || !b || a.val !== b.val) return false;
      return (iso(a.left, b.left) && iso(a.right, b.right)) || (iso(a.left, b.right) && iso(a.right, b.left));
    };
    const EX = [
      { r1: [1, 2, 3, 4, 5, 6, null, null, null, 7, 8], r2: [1, 3, 2, null, 6, 4, 5, null, null, null, null, 8, 7], note: "Swap the children of 1, of 3 and of 5 in the first tree and it becomes the second." },
      { r1: [1, 2, 3, 4], r2: [1, 3, 2, 4], note: "In the first tree 4 hangs below 2; in the second it hangs below 3. No swaps move a node to a different parent." },
      { r1: [1, 2], r2: [1, null, 2], note: "Swapping the root's children turns one into the other." },
    ];
    return {
      slug: "isomorphic-trees",
      title: "Check if Two Trees are Isomorphic",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "isIsomorphic", params: [{ name: "root1", type: "TreeNode" as const }, { name: "root2", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Two binary trees are **isomorphic** if one can be turned into the other by swapping the left and right children of any number of its nodes (possibly none). Node values must match too: a node can only correspond to a node holding the same value.\n\nGiven the roots `root1` and `root2` of two binary trees, return `true` if they are isomorphic, and `false` otherwise.",
        EX.map((e) => ({ in: `root1 = ${lv(e.r1)}, root2 = ${lv(e.r2)}`, out: String(iso(treeFrom(e.r1), treeFrom(e.r2))), note: e.note })),
        ["1 <= number of nodes in each tree <= 10^5", "1 <= Node.val <= 10^5"]),
      hints: [
        "Matching roots must hold the same value; after that the question repeats for their children.",
        "The children can be matched straight (left with left, right with right) or crossed (left with right) — at each node, either is allowed.",
        "Write `iso(a, b)`: both null → true, one null or different values → false, otherwise straight-match or cross-match the children recursively.",
      ],
      editorial: explain({
        idea: "Swaps at different nodes are independent, so two trees are isomorphic exactly when their roots agree and their pairs of subtrees are isomorphic either in the same order or in the crossed order.",
        steps: [
          "If both nodes are null, return `true`; if exactly one is null, return `false`.",
          "If their values differ, return `false`.",
          "Return `(iso(a.left, b.left) and iso(a.right, b.right))` or `(iso(a.left, b.right) and iso(a.right, b.left))`.",
        ],
        why: "A sequence of swaps either swaps the root's children or does not; the remaining swaps act inside the subtrees. So the root pair matches if and only if one of the two pairings of the subtrees matches, which is exactly the recursion.",
        time: "O(n) in typical trees (each pair of nodes is compared a bounded number of times); O(n²) in adversarial cases where the straight match fails late",
        space: "O(h) for the recursion",
        pitfalls: [
          "Comparing only the multiset of values per level is not enough — parents must match too.",
          "Short-circuit evaluation keeps the crossed check from running when the straight one already succeeds.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.r1)}\n${lv(e.r2)}`, expectedOutput: String(iso(treeFrom(e.r1), treeFrom(e.r2))) })),
      gen: (rng: Rng) => {
        const hi = pick(rng, [2, 3, 1000]);
        const t1 = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 1, hi);
        let t2: TNode | null;
        if (rng() < 0.65) {
          t2 = cloneTree(t1);
          for (const t of nodesOf(t2)) if (rng() < 0.5) { const s = t.left; t.left = t.right; t.right = s; }
          if (rng() < 0.35) {
            const t = pick(rng, nodesOf(t2));
            const r = rng();
            if (r < 0.4) t.val = ri(rng, 1, hi);
            else if (r < 0.7) { if (!t.left) t.left = { val: ri(rng, 1, hi), left: null, right: null }; else if (!t.right) t.right = { val: ri(rng, 1, hi), left: null, right: null }; }
            else if (t.left && isLeaf(t.left)) t.left = null;
            else if (t.right && isLeaf(t.right)) t.right = null;
          }
        } else {
          t2 = shapeTree(rng, sizeOf(rng, [1, 3, 10]), 1, hi);
        }
        return { input: `${fmtTree(t1)}\n${fmtTree(t2)}`, expectedOutput: String(iso(t1, t2)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isIsomorphic(root1: Optional[TreeNode], root2: Optional[TreeNode]) -> bool:
              if root1 is None and root2 is None:
                  return True
              if root1 is None or root2 is None or root1.val != root2.val:
                  return False
              return (isIsomorphic(root1.left, root2.left) and isIsomorphic(root1.right, root2.right)) or \
                  (isIsomorphic(root1.left, root2.right) and isIsomorphic(root1.right, root2.left))
        `,
        javascript: code`
          var isIsomorphic = function(root1, root2) {
              if (root1 === null && root2 === null) return true;
              if (root1 === null || root2 === null || root1.val !== root2.val) return false;
              return (isIsomorphic(root1.left, root2.left) && isIsomorphic(root1.right, root2.right)) ||
                  (isIsomorphic(root1.left, root2.right) && isIsomorphic(root1.right, root2.left));
          };
        `,
        typescript: code`
          function isIsomorphic(root1: TreeNode | null, root2: TreeNode | null): boolean {
              if (root1 === null && root2 === null) return true;
              if (root1 === null || root2 === null || root1.val !== root2.val) return false;
              return (isIsomorphic(root1.left, root2.left) && isIsomorphic(root1.right, root2.right)) ||
                  (isIsomorphic(root1.left, root2.right) && isIsomorphic(root1.right, root2.left));
          }
        `,
        java: code`
          public static boolean isIsomorphic(TreeNode root1, TreeNode root2) {
              if (root1 == null && root2 == null) return true;
              if (root1 == null || root2 == null || root1.val != root2.val) return false;
              return (isIsomorphic(root1.left, root2.left) && isIsomorphic(root1.right, root2.right))
                  || (isIsomorphic(root1.left, root2.right) && isIsomorphic(root1.right, root2.left));
          }
        `,
        cpp: code`
          bool isIsomorphic(TreeNode* root1, TreeNode* root2) {
              if (!root1 && !root2) return true;
              if (!root1 || !root2 || root1->val != root2->val) return false;
              return (isIsomorphic(root1->left, root2->left) && isIsomorphic(root1->right, root2->right))
                  || (isIsomorphic(root1->left, root2->right) && isIsomorphic(root1->right, root2->left));
          }
        `,
        c: code`
          bool isIsomorphic(struct TreeNode* root1, struct TreeNode* root2) {
              if (root1 == NULL && root2 == NULL) return true;
              if (root1 == NULL || root2 == NULL || root1->val != root2->val) return false;
              return (isIsomorphic(root1->left, root2->left) && isIsomorphic(root1->right, root2->right))
                  || (isIsomorphic(root1->left, root2->right) && isIsomorphic(root1->right, root2->left));
          }
        `,
        csharp: code`
          public static bool IsIsomorphic(TreeNode root1, TreeNode root2)
          {
              if (root1 == null && root2 == null) return true;
              if (root1 == null || root2 == null || root1.val != root2.val) return false;
              return (IsIsomorphic(root1.left, root2.left) && IsIsomorphic(root1.right, root2.right))
                  || (IsIsomorphic(root1.left, root2.right) && IsIsomorphic(root1.right, root2.left));
          }
        `,
        go: code`
          func isIsomorphic(root1 *TreeNode, root2 *TreeNode) bool {
              if root1 == nil && root2 == nil {
                  return true
              }
              if root1 == nil || root2 == nil || root1.Val != root2.Val {
                  return false
              }
              return (isIsomorphic(root1.Left, root2.Left) && isIsomorphic(root1.Right, root2.Right)) ||
                  (isIsomorphic(root1.Left, root2.Right) && isIsomorphic(root1.Right, root2.Left))
          }
        `,
        kotlin: kt(`
          fun isIsomorphic(root1: TreeNode?, root2: TreeNode?): Boolean {
              if (root1 == null && root2 == null) return true
              if (root1 == null || root2 == null || root1.\`val\` != root2.\`val\`) return false
              return (isIsomorphic(root1.left, root2.left) && isIsomorphic(root1.right, root2.right)) ||
                  (isIsomorphic(root1.left, root2.right) && isIsomorphic(root1.right, root2.left))
          }
        `),
        swift: code`
          func isIsomorphic(_ root1: TreeNode?, _ root2: TreeNode?) -> Bool {
              if root1 == nil && root2 == nil { return true }
              guard let a = root1, let b = root2, a.val == b.val else { return false }
              return (isIsomorphic(a.left, b.left) && isIsomorphic(a.right, b.right)) ||
                  (isIsomorphic(a.left, b.right) && isIsomorphic(a.right, b.left))
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isIsomorphic(root1: Option<Rc<RefCell<TreeNode>>>, root2: Option<Rc<RefCell<TreeNode>>>) -> bool {
              iso(&root1, &root2)
          }

          fn iso(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let x = x.borrow();
                      let y = y.borrow();
                      if x.val != y.val {
                          return false;
                      }
                      let ok = (iso(&x.left, &y.left) && iso(&x.right, &y.right))
                          || (iso(&x.left, &y.right) && iso(&x.right, &y.left));
                      ok
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isIsomorphic($root1, $root2) {
              if ($root1 === null && $root2 === null) return true;
              if ($root1 === null || $root2 === null || $root1->val != $root2->val) return false;
              return (isIsomorphic($root1->left, $root2->left) && isIsomorphic($root1->right, $root2->right))
                  || (isIsomorphic($root1->left, $root2->right) && isIsomorphic($root1->right, $root2->left));
          }
        `,
        ruby: code`
          def isIsomorphic(root1, root2)
            return true if root1.nil? && root2.nil?
            return false if root1.nil? || root2.nil? || root1.val != root2.val
            (isIsomorphic(root1.left, root2.left) && isIsomorphic(root1.right, root2.right)) ||
              (isIsomorphic(root1.left, root2.right) && isIsomorphic(root1.right, root2.left))
          end
        `,
      },
    };
  })(),

  // ── Nodes at Distance K from Root (GFG) ─────────────────────────
  (() => {
    const ref = (root: TNode | null, k: number) => {
      const out: number[] = [];
      const walk = (n: TNode | null, d: number) => { if (!n) return; if (d === k) { out.push(n.val); return; } walk(n.left, d + 1); walk(n.right, d + 1); };
      walk(root, 0);
      return out;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 8], k: 2, note: "Two levels below the root sit 4, 5 and 8." },
      { root: [1, 3, 2], k: 0, note: "Distance 0 is the root itself." },
      { root: [1, 2, 3], k: 3, note: "The tree has no level three steps down." },
    ];
    return {
      slug: "k-distance-from-root",
      title: "Nodes at Distance K from Root",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Microsoft", "Samsung"],
      signature: { funcName: "kDistance", params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree and an integer `k`, return the values of all nodes that are exactly `k` edges below the root (the root itself is at distance `0`), from **left to right**. If the tree has no node that deep, return an empty list.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, k = ${e.k}`, out: fmtIntArr(ref(treeFrom(e.root), e.k)), note: e.note })),
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 10^5", "0 <= k <= 30"]),
      hints: [
        "The nodes at distance `k` are exactly one level of the tree.",
        "Walk down depth-first with a counter of how many steps remain; when it reaches 0, record the node and stop descending.",
        "Visiting the left child before the right one yields the level from left to right.",
      ],
      editorial: explain({
        idea: "Distance from the root is depth, so the answer is level `k`. A depth-first walk that counts down the remaining steps reaches every node of that level, left subtree before right, and never goes deeper.",
        steps: [
          "Call `collect(root, k)`.",
          "In `collect(node, steps)`: return if `node` is null; if `steps == 0`, append `node.val` and return.",
          "Otherwise call `collect(node.left, steps - 1)` then `collect(node.right, steps - 1)`.",
        ],
        why: "A node is reached with `steps == 0` exactly when it is `k` edges below the root. Because every left subtree is finished before its right sibling starts, nodes of the same level are appended in left-to-right order.",
        time: "O(n) in the worst case (only nodes at depth ≤ k are visited)",
        space: "O(k) for the recursion",
        pitfalls: [
          "Stop at depth `k` — descending further wastes time and could add deeper nodes by mistake.",
          "A level-order traversal works too: return the `k`-th level, or an empty list if the queue runs dry first.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.k}`, expectedOutput: fmtIntArr(ref(treeFrom(e.root), e.k)) })),
      gen: (rng: Rng) => {
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 1, pick(rng, [9, 100000]));
        const k = Math.min(30, ri(rng, 0, heightOf(root)));
        return { input: `${fmtTree(root)}\n${k}`, expectedOutput: fmtIntArr(ref(root, k)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def kDistance(root: Optional[TreeNode], k: int) -> List[int]:
              out = []

              def collect(node: Optional[TreeNode], steps: int) -> None:
                  if node is None:
                      return
                  if steps == 0:
                      out.append(node.val)
                      return
                  collect(node.left, steps - 1)
                  collect(node.right, steps - 1)

              collect(root, k)
              return out
        `,
        javascript: code`
          var kDistance = function(root, k) {
              var out = [];
              collect(root, k, out);
              return out;
          };

          var collect = function(node, steps, out) {
              if (node === null) return;
              if (steps === 0) { out.push(node.val); return; }
              collect(node.left, steps - 1, out);
              collect(node.right, steps - 1, out);
          };
        `,
        typescript: code`
          function kDistance(root: TreeNode | null, k: number): number[] {
              var out: number[] = [];
              collect(root, k, out);
              return out;
          }

          function collect(node: TreeNode | null, steps: number, out: number[]): void {
              if (node === null) return;
              if (steps === 0) { out.push(node.val); return; }
              collect(node.left, steps - 1, out);
              collect(node.right, steps - 1, out);
          }
        `,
        java: code`
          public static int[] kDistance(TreeNode root, int k) {
              List<Integer> out = new ArrayList<>();
              collect(root, k, out);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }

          static void collect(TreeNode node, int steps, List<Integer> out) {
              if (node == null) return;
              if (steps == 0) { out.add(node.val); return; }
              collect(node.left, steps - 1, out);
              collect(node.right, steps - 1, out);
          }
        `,
        cpp: code`
          void collect(TreeNode* node, int steps, vector<int>& out);

          vector<int> kDistance(TreeNode* root, int k) {
              vector<int> out;
              collect(root, k, out);
              return out;
          }

          void collect(TreeNode* node, int steps, vector<int>& out) {
              if (!node) return;
              if (steps == 0) { out.push_back(node->val); return; }
              collect(node->left, steps - 1, out);
              collect(node->right, steps - 1, out);
          }
        `,
        c: code`
          static int countAll(struct TreeNode* node);
          static void collect(struct TreeNode* node, int steps, int* out, int* len);

          int* kDistance(struct TreeNode* root, int k, int* returnSize) {
              int* out = (int*) malloc((size_t) (countAll(root) + 1) * sizeof(int));
              int len = 0;
              collect(root, k, out, &len);
              *returnSize = len;
              return out;
          }

          static int countAll(struct TreeNode* node) {
              if (node == NULL) return 0;
              return 1 + countAll(node->left) + countAll(node->right);
          }

          static void collect(struct TreeNode* node, int steps, int* out, int* len) {
              if (node == NULL) return;
              if (steps == 0) { out[(*len)++] = node->val; return; }
              collect(node->left, steps - 1, out, len);
              collect(node->right, steps - 1, out, len);
          }
        `,
        csharp: code`
          public static int[] KDistance(TreeNode root, int k)
          {
              var output = new List<int>();
              Collect(root, k, output);
              return output.ToArray();
          }

          static void Collect(TreeNode node, int steps, List<int> output)
          {
              if (node == null) return;
              if (steps == 0) { output.Add(node.val); return; }
              Collect(node.left, steps - 1, output);
              Collect(node.right, steps - 1, output);
          }
        `,
        go: code`
          func kDistance(root *TreeNode, k int) []int {
              out := []int{}
              var collect func(node *TreeNode, steps int)
              collect = func(node *TreeNode, steps int) {
                  if node == nil {
                      return
                  }
                  if steps == 0 {
                      out = append(out, node.Val)
                      return
                  }
                  collect(node.Left, steps-1)
                  collect(node.Right, steps-1)
              }
              collect(root, k)
              return out
          }
        `,
        kotlin: kt(`
          fun kDistance(root: TreeNode?, k: Int): IntArray {
              val out = ArrayList<Int>()
              fun collect(node: TreeNode?, steps: Int) {
                  if (node == null) return
                  if (steps == 0) { out.add(node.\`val\`); return }
                  collect(node.left, steps - 1)
                  collect(node.right, steps - 1)
              }
              collect(root, k)
              return out.toIntArray()
          }
        `),
        swift: code`
          func kDistance(_ root: TreeNode?, _ k: Int) -> [Int] {
              var out: [Int] = []
              func collect(_ node: TreeNode?, _ steps: Int) {
                  guard let n = node else { return }
                  if steps == 0 { out.append(n.val); return }
                  collect(n.left, steps - 1)
                  collect(n.right, steps - 1)
              }
              collect(root, k)
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn kDistance(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              collect(&root, k, &mut out);
              out
          }

          fn collect(node: &Option<Rc<RefCell<TreeNode>>>, steps: i32, out: &mut Vec<i32>) {
              if let Some(n) = node {
                  let b = n.borrow();
                  if steps == 0 {
                      out.push(b.val);
                      return;
                  }
                  collect(&b.left, steps - 1, out);
                  collect(&b.right, steps - 1, out);
              }
          }
        `,
        php: code`
          function kDistance($root, $k) {
              $out = [];
              collectAt($root, $k, $out);
              return $out;
          }

          function collectAt($node, $steps, &$out) {
              if ($node === null) return;
              if ($steps == 0) { $out[] = $node->val; return; }
              collectAt($node->left, $steps - 1, $out);
              collectAt($node->right, $steps - 1, $out);
          }
        `,
        ruby: code`
          def kDistance(root, k)
            out = []
            collect_at(root, k, out)
            out
          end

          def collect_at(node, steps, out)
            return if node.nil?
            if steps.zero?
              out << node.val
              return
            end
            collect_at(node.left, steps - 1, out)
            collect_at(node.right, steps - 1, out)
          end
        `,
      },
    };
  })(),

  // ── Ceil in BST (GFG) ───────────────────────────────────────────
  (() => {
    const ref = (root: TNode | null, x: number) => {
      const ge = nodesOf(root).map((n) => n.val).filter((v) => v >= x);
      return ge.length ? Math.min(...ge) : -1;
    };
    const EX = [
      { root: [8, 4, 12, 2, 6, 10, 14], x: 5, note: "The values not below 5 are 6, 8, 10, 12 and 14; the smallest is 6." },
      { root: [8, 4, 12, 2, 6, 10, 14], x: 14, note: "14 is in the tree, so it is its own ceil." },
      { root: [8, 4, 12, 2, 6, 10, 14], x: 15, note: "Every value is below 15." },
    ];
    return {
      slug: "ceil-in-bst",
      title: "Ceil in BST",
      difficulty: "EASY" as const,
      tags: ["Tree", "Binary Search", "Amazon", "Microsoft"],
      signature: { funcName: "findCeil", params: [{ name: "root", type: "TreeNode" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary search tree with distinct values and an integer `x`.\n\nReturn the **ceil** of `x` in the tree: the smallest node value that is greater than or equal to `x`. If every value is smaller than `x`, return `-1`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, x = ${e.x}`, out: String(ref(treeFrom(e.root), e.x)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "1 <= x <= 10^5"]),
      hints: [
        "Walk down from the root as in a search; the ordering tells you which side can hold better candidates.",
        "If a node's value is at least `x`, it is a candidate — and anything smaller that still qualifies is in its left subtree.",
        "If a node's value is below `x`, neither it nor its left subtree qualifies: go right. Keep the last candidate seen.",
      ],
      editorial: explain({
        idea: "Search for `x` as usual. Every node where the walk turns left has a value ≥ `x` and is a candidate; each later candidate is smaller than the previous one, so the last one recorded is the ceil.",
        steps: [
          "Set `ceil = -1` and start at the root.",
          "If the node's value equals `x`, return it.",
          "If it is greater than `x`, record it as `ceil` and move left; otherwise move right.",
          "When the walk falls off the tree, return `ceil`.",
        ],
        why: "When a node's value `v` is above `x`, its right subtree holds only values above `v` — never a better ceil — so the search narrows to the left. When `v` is below `x`, the node and its whole left subtree are below `x` and are excluded. The candidates recorded shrink each time, ending at the smallest value ≥ `x`.",
        time: "O(h)",
        space: "O(1)",
        pitfalls: [
          "Return `-1`, not the largest value, when `x` exceeds every value in the tree.",
          "An exact match is its own ceil — return it at once.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.x}`, expectedOutput: String(ref(treeFrom(e.root), e.x)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 4, 100, 99998]);
        const root = randBST(rng, n, 1, hi);
        const x = rng() < 0.3 ? pick(rng, nodesOf(root).map((t) => t.val)) : ri(rng, 1, hi + 2);
        return { input: `${fmtTree(root)}\n${x}`, expectedOutput: String(ref(root, x)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findCeil(root: Optional[TreeNode], x: int) -> int:
              ceil = -1
              node = root
              while node is not None:
                  if node.val == x:
                      return x
                  if node.val > x:
                      ceil = node.val
                      node = node.left
                  else:
                      node = node.right
              return ceil
        `,
        javascript: code`
          var findCeil = function(root, x) {
              var ceil = -1, node = root;
              while (node !== null) {
                  if (node.val === x) return x;
                  if (node.val > x) { ceil = node.val; node = node.left; }
                  else node = node.right;
              }
              return ceil;
          };
        `,
        typescript: code`
          function findCeil(root: TreeNode | null, x: number): number {
              var ceil = -1;
              var node = root;
              while (node !== null) {
                  if (node.val === x) return x;
                  if (node.val > x) { ceil = node.val; node = node.left; }
                  else node = node.right;
              }
              return ceil;
          }
        `,
        java: code`
          public static int findCeil(TreeNode root, int x) {
              int ceil = -1;
              TreeNode node = root;
              while (node != null) {
                  if (node.val == x) return x;
                  if (node.val > x) { ceil = node.val; node = node.left; }
                  else node = node.right;
              }
              return ceil;
          }
        `,
        cpp: code`
          int findCeil(TreeNode* root, int x) {
              int ceil = -1;
              TreeNode* node = root;
              while (node) {
                  if (node->val == x) return x;
                  if (node->val > x) { ceil = node->val; node = node->left; }
                  else node = node->right;
              }
              return ceil;
          }
        `,
        c: code`
          int findCeil(struct TreeNode* root, int x) {
              int ceil = -1;
              struct TreeNode* node = root;
              while (node != NULL) {
                  if (node->val == x) return x;
                  if (node->val > x) { ceil = node->val; node = node->left; }
                  else node = node->right;
              }
              return ceil;
          }
        `,
        csharp: code`
          public static int FindCeil(TreeNode root, int x)
          {
              int ceil = -1;
              var node = root;
              while (node != null)
              {
                  if (node.val == x) return x;
                  if (node.val > x) { ceil = node.val; node = node.left; }
                  else node = node.right;
              }
              return ceil;
          }
        `,
        go: code`
          func findCeil(root *TreeNode, x int) int {
              ceil := -1
              node := root
              for node != nil {
                  if node.Val == x {
                      return x
                  }
                  if node.Val > x {
                      ceil = node.Val
                      node = node.Left
                  } else {
                      node = node.Right
                  }
              }
              return ceil
          }
        `,
        kotlin: kt(`
          fun findCeil(root: TreeNode?, x: Int): Int {
              var ceil = -1
              var node = root
              while (node != null) {
                  val v = node.\`val\`
                  if (v == x) return x
                  if (v > x) {
                      ceil = v
                      node = node.left
                  } else {
                      node = node.right
                  }
              }
              return ceil
          }
        `),
        swift: code`
          func findCeil(_ root: TreeNode?, _ x: Int) -> Int {
              var ceil = -1
              var node = root
              while let n = node {
                  if n.val == x { return x }
                  if n.val > x {
                      ceil = n.val
                      node = n.left
                  } else {
                      node = n.right
                  }
              }
              return ceil
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findCeil(root: Option<Rc<RefCell<TreeNode>>>, x: i32) -> i32 {
              let mut ceil = -1;
              let mut cur = root;
              while let Some(n) = cur {
                  let v = n.borrow().val;
                  if v == x {
                      return x;
                  }
                  let next = if v > x {
                      ceil = v;
                      n.borrow().left.clone()
                  } else {
                      n.borrow().right.clone()
                  };
                  cur = next;
              }
              ceil
          }
        `,
        php: code`
          function findCeil($root, $x) {
              $ceil = -1;
              $node = $root;
              while ($node !== null) {
                  if ($node->val == $x) return $x;
                  if ($node->val > $x) {
                      $ceil = $node->val;
                      $node = $node->left;
                  } else {
                      $node = $node->right;
                  }
              }
              return $ceil;
          }
        `,
        ruby: code`
          def findCeil(root, x)
            ceil = -1
            node = root
            while node
              return x if node.val == x
              if node.val > x
                ceil = node.val
                node = node.left
              else
                node = node.right
              end
            end
            ceil
          end
        `,
      },
    };
  })(),

  // ── Kth Largest Element in BST (GFG) ────────────────────────────
  (() => {
    const ref = (root: TNode | null, k: number) => nodesOf(root).map((n) => n.val).sort((a, b) => b - a)[k - 1];
    const EX = [
      { root: [4, 2, 9], k: 2, note: "In decreasing order the values are 9, 4, 2; the second is 4." },
      { root: [9, null, 10], k: 1, note: "The largest value is 10." },
      { root: [50, 30, 70, 20, 40, 60, 80], k: 3, note: "80, 70, 60, … — the third largest is 60." },
    ];
    return {
      slug: "kth-largest-element-in-bst",
      title: "Kth Largest Element in BST",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Amazon", "Microsoft", "Samsung"],
      signature: { funcName: "kthLargest", params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary search tree with distinct values and an integer `k`, return the `k`-th **largest** value in the tree (`k = 1` is the maximum).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, k = ${e.k}`, out: String(ref(treeFrom(e.root), e.k)), note: e.note })),
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^5", "all node values are distinct", "1 <= k <= number of nodes"]),
      hints: [
        "An in-order traversal of a search tree lists the values in increasing order. Which traversal lists them in decreasing order?",
        "Reverse in-order: right subtree, node, left subtree.",
        "Count the nodes as the reverse in-order traversal emits them and stop at the `k`-th — no need to visit the rest.",
      ],
      editorial: explain({
        idea: "Reverse in-order traversal (right, node, left) visits a search tree's values from largest to smallest, so the `k`-th node it visits is the answer.",
        steps: [
          "Start at the root with an empty stack.",
          "Push nodes while moving right, down to the largest unvisited node.",
          "Pop a node: it is the next value in decreasing order. Decrement `k`; when `k` reaches 0, return its value.",
          "Otherwise continue from the popped node's left child.",
        ],
        why: "For any node, every value in its right subtree is larger and every value in its left subtree is smaller, so visiting right, then the node, then left emits a strictly decreasing sequence; its `k`-th element is the `k`-th largest value.",
        time: "O(h + k)",
        space: "O(h) for the stack",
        pitfalls: [
          "Collecting all values and sorting is O(n log n) and ignores the ordering already in the tree.",
          "k counts from the largest: `k = 1` is the maximum, not the minimum.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.k}`, expectedOutput: String(ref(treeFrom(e.root), e.k)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = randBST(rng, n, 1, pick(rng, [n + 4, 1000, 100000]));
        const k = rng() < 0.15 ? pick(rng, [1, n]) : ri(rng, 1, n);
        return { input: `${fmtTree(root)}\n${k}`, expectedOutput: String(ref(root, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def kthLargest(root: Optional[TreeNode], k: int) -> int:
              stack = []
              node = root
              while stack or node:
                  while node:
                      stack.append(node)
                      node = node.right
                  node = stack.pop()
                  k -= 1
                  if k == 0:
                      return node.val
                  node = node.left
              return -1
        `,
        javascript: code`
          var kthLargest = function(root, k) {
              var stack = [], node = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.right; }
                  node = stack.pop();
                  if (--k === 0) return node.val;
                  node = node.left;
              }
              return -1;
          };
        `,
        typescript: code`
          function kthLargest(root: TreeNode | null, k: number): number {
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (stack.length > 0 || node !== null) {
                  while (node !== null) { stack.push(node); node = node.right; }
                  var top = stack.pop() as TreeNode;
                  if (--k === 0) return top.val;
                  node = top.left;
              }
              return -1;
          }
        `,
        java: code`
          public static int kthLargest(TreeNode root, int k) {
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (!stack.isEmpty() || node != null) {
                  while (node != null) { stack.push(node); node = node.right; }
                  node = stack.pop();
                  if (--k == 0) return node.val;
                  node = node.left;
              }
              return -1;
          }
        `,
        cpp: code`
          int kthLargest(TreeNode* root, int k) {
              vector<TreeNode*> stack;
              TreeNode* node = root;
              while (!stack.empty() || node) {
                  while (node) { stack.push_back(node); node = node->right; }
                  node = stack.back();
                  stack.pop_back();
                  if (--k == 0) return node->val;
                  node = node->left;
              }
              return -1;
          }
        `,
        c: code`
          static void reverseWalk(struct TreeNode* node, int* left, int* ans);

          int kthLargest(struct TreeNode* root, int k) {
              int left = k, ans = -1;
              reverseWalk(root, &left, &ans);
              return ans;
          }

          // Right subtree, node, left subtree: values in decreasing order.
          static void reverseWalk(struct TreeNode* node, int* left, int* ans) {
              if (node == NULL || *left == 0) return;
              reverseWalk(node->right, left, ans);
              if (*left == 0) return;
              if (--(*left) == 0) { *ans = node->val; return; }
              reverseWalk(node->left, left, ans);
          }
        `,
        csharp: code`
          public static int KthLargest(TreeNode root, int k)
          {
              var stack = new Stack<TreeNode>();
              var node = root;
              while (stack.Count > 0 || node != null)
              {
                  while (node != null) { stack.Push(node); node = node.right; }
                  node = stack.Pop();
                  if (--k == 0) return node.val;
                  node = node.left;
              }
              return -1;
          }
        `,
        go: code`
          func kthLargest(root *TreeNode, k int) int {
              stack := []*TreeNode{}
              node := root
              for len(stack) > 0 || node != nil {
                  for node != nil {
                      stack = append(stack, node)
                      node = node.Right
                  }
                  node = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  k--
                  if k == 0 {
                      return node.Val
                  }
                  node = node.Left
              }
              return -1
          }
        `,
        kotlin: kt(`
          fun kthLargest(root: TreeNode?, k: Int): Int {
              val stack = ArrayList<TreeNode>()
              var node = root
              var left = k
              while (stack.isNotEmpty() || node != null) {
                  while (node != null) {
                      stack.add(node)
                      node = node.right
                  }
                  val top = stack.removeAt(stack.size - 1)
                  left--
                  if (left == 0) return top.\`val\`
                  node = top.left
              }
              return -1
          }
        `),
        swift: code`
          func kthLargest(_ root: TreeNode?, _ k: Int) -> Int {
              var stack: [TreeNode] = []
              var node = root
              var left = k
              while !stack.isEmpty || node != nil {
                  while let n = node {
                      stack.append(n)
                      node = n.right
                  }
                  let top = stack.removeLast()
                  left -= 1
                  if left == 0 { return top.val }
                  node = top.left
              }
              return -1
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn kthLargest(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> i32 {
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut node = root;
              let mut left = k;
              loop {
                  while let Some(n) = node {
                      node = n.borrow().right.clone();
                      stack.push(n);
                  }
                  let top = match stack.pop() {
                      Some(t) => t,
                      None => return -1,
                  };
                  left -= 1;
                  let v = top.borrow().val;
                  if left == 0 {
                      return v;
                  }
                  node = top.borrow().left.clone();
              }
          }
        `,
        php: code`
          function kthLargest($root, $k) {
              $stack = [];
              $node = $root;
              while (!empty($stack) || $node !== null) {
                  while ($node !== null) {
                      $stack[] = $node;
                      $node = $node->right;
                  }
                  $node = array_pop($stack);
                  $k--;
                  if ($k == 0) return $node->val;
                  $node = $node->left;
              }
              return -1;
          }
        `,
        ruby: code`
          def kthLargest(root, k)
            stack = []
            node = root
            while !stack.empty? || node
              while node
                stack << node
                node = node.right
              end
              node = stack.pop
              k -= 1
              return node.val if k.zero?
              node = node.left
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Nodes at Odd Levels (GFG) ───────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const out: number[] = [];
      let level: TNode[] = root ? [root] : [];
      for (let d = 1; level.length; d++) {
        if (d % 2 === 1) for (const n of level) out.push(n.val);
        const next: TNode[] = [];
        for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        level = next;
      }
      return out;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, null, 6, null, null, 7, 8], note: "Level 1 holds 1, level 3 holds 4, 5 and 6; levels 2 and 4 are even." },
      { root: [1, 2, 3], note: "Only the root's level is odd." },
      { root: [5, null, 9, 8], note: "5 is on level 1 and 8 on level 3." },
    ];
    return {
      slug: "nodes-at-odd-levels",
      title: "Nodes at Odd Levels",
      difficulty: "EASY" as const,
      tags: ["Tree", "Breadth-First Search", "Amazon"],
      signature: { funcName: "nodesAtOddLevels", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the values of all nodes on its **odd levels**, where the root is on level `1`, its children on level `2`, and so on.\n\nList them in level order: level 1, then level 3, then level 5, …, and within a level from left to right.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["1 <= number of nodes <= 10^3", "1 <= Node.val <= 10^3"]),
      hints: [
        "You need to know each node's level — process the tree one level at a time.",
        "A breadth-first search with a queue, taking one whole level per round, tells you which level you are on.",
        "Keep a level counter starting at 1 and collect the round's values only when it is odd.",
      ],
      editorial: explain({
        idea: "Level-order traversal visits the tree level by level and, within a level, left to right — exactly the required output order. Counting the rounds gives the level number.",
        steps: [
          "Start with a queue holding the root and `level = 1`.",
          "While the queue is not empty, take the `size` nodes currently in it — one full level.",
          "If `level` is odd, append their values in order. Enqueue each node's left then right child.",
          "Increase `level` and repeat.",
        ],
        why: "At the start of each round the queue holds exactly the nodes of one level, in left-to-right order, because children are enqueued left before right and parents are processed in order.",
        time: "O(n)",
        space: "O(w), w the widest level",
        pitfalls: [
          "Levels count from 1 at the root, so the root is always included.",
          "A depth-first search can find the odd-level nodes too, but it lists them in a different order from the one required.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 1, pick(rng, [9, 1000]));
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def nodesAtOddLevels(root: Optional[TreeNode]) -> List[int]:
              out = []
              level = [root] if root else []
              depth = 1
              while level:
                  if depth % 2 == 1:
                      out.extend(node.val for node in level)
                  nxt = []
                  for node in level:
                      if node.left:
                          nxt.append(node.left)
                      if node.right:
                          nxt.append(node.right)
                  level = nxt
                  depth += 1
              return out
        `,
        javascript: code`
          var nodesAtOddLevels = function(root) {
              var out = [];
              if (root === null) return out;
              var queue = [root], head = 0, level = 1;
              while (head < queue.length) {
                  var end = queue.length;
                  for (; head < end; head++) {
                      var node = queue[head];
                      if (level % 2 === 1) out.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  level++;
              }
              return out;
          };
        `,
        typescript: code`
          function nodesAtOddLevels(root: TreeNode | null): number[] {
              var out: number[] = [];
              if (root === null) return out;
              var queue: TreeNode[] = [root];
              var head = 0, level = 1;
              while (head < queue.length) {
                  var end = queue.length;
                  for (; head < end; head++) {
                      var node = queue[head];
                      if (level % 2 === 1) out.push(node.val);
                      if (node.left !== null) queue.push(node.left);
                      if (node.right !== null) queue.push(node.right);
                  }
                  level++;
              }
              return out;
          }
        `,
        java: code`
          public static int[] nodesAtOddLevels(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              int level = 1;
              while (!queue.isEmpty()) {
                  for (int i = queue.size(); i > 0; i--) {
                      TreeNode node = queue.poll();
                      if (level % 2 == 1) out.add(node.val);
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  level++;
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> nodesAtOddLevels(TreeNode* root) {
              vector<int> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              int level = 1;
              while (!q.empty()) {
                  for (int i = (int) q.size(); i > 0; i--) {
                      TreeNode* node = q.front();
                      q.pop();
                      if (level % 2 == 1) out.push_back(node->val);
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  level++;
              }
              return out;
          }
        `,
        c: code`
          static int countAll(struct TreeNode* node);

          int* nodesAtOddLevels(struct TreeNode* root, int* returnSize) {
              int n = countAll(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0, len = 0, level = 1;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  for (; head < end; head++) {
                      struct TreeNode* node = queue[head];
                      if (level % 2 == 1) out[len++] = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  level++;
              }
              free(queue);
              *returnSize = len;
              return out;
          }

          static int countAll(struct TreeNode* node) {
              if (node == NULL) return 0;
              return 1 + countAll(node->left) + countAll(node->right);
          }
        `,
        csharp: code`
          public static int[] NodesAtOddLevels(TreeNode root)
          {
              var output = new List<int>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              int level = 1;
              while (queue.Count > 0)
              {
                  for (int i = queue.Count; i > 0; i--)
                  {
                      var node = queue.Dequeue();
                      if (level % 2 == 1) output.Add(node.val);
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  level++;
              }
              return output.ToArray();
          }
        `,
        go: code`
          func nodesAtOddLevels(root *TreeNode) []int {
              out := []int{}
              if root == nil {
                  return out
              }
              queue := []*TreeNode{root}
              head, level := 0, 1
              for head < len(queue) {
                  end := len(queue)
                  for ; head < end; head++ {
                      node := queue[head]
                      if level%2 == 1 {
                          out = append(out, node.Val)
                      }
                      if node.Left != nil {
                          queue = append(queue, node.Left)
                      }
                      if node.Right != nil {
                          queue = append(queue, node.Right)
                      }
                  }
                  level++
              }
              return out
          }
        `,
        kotlin: kt(`
          fun nodesAtOddLevels(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              if (root == null) return IntArray(0)
              val queue = ArrayList<TreeNode>()
              queue.add(root)
              var head = 0
              var level = 1
              while (head < queue.size) {
                  val end = queue.size
                  while (head < end) {
                      val node = queue[head++]
                      if (level % 2 == 1) out.add(node.\`val\`)
                      val l = node.left
                      val r = node.right
                      if (l != null) queue.add(l)
                      if (r != null) queue.add(r)
                  }
                  level++
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func nodesAtOddLevels(_ root: TreeNode?) -> [Int] {
              var out: [Int] = []
              guard let r = root else { return out }
              var queue: [TreeNode] = [r]
              var head = 0, level = 1
              while head < queue.count {
                  let end = queue.count
                  while head < end {
                      let node = queue[head]
                      head += 1
                      if level % 2 == 1 { out.append(node.val) }
                      if let l = node.left { queue.append(l) }
                      if let rt = node.right { queue.append(rt) }
                  }
                  level += 1
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::VecDeque;

          fn nodesAtOddLevels(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              let mut queue: VecDeque<Rc<RefCell<TreeNode>>> = VecDeque::new();
              if let Some(r) = root {
                  queue.push_back(r);
              }
              let mut level = 1;
              while !queue.is_empty() {
                  for _ in 0..queue.len() {
                      let node = queue.pop_front().unwrap();
                      let b = node.borrow();
                      if level % 2 == 1 {
                          out.push(b.val);
                      }
                      if let Some(l) = &b.left {
                          queue.push_back(l.clone());
                      }
                      if let Some(r) = &b.right {
                          queue.push_back(r.clone());
                      }
                  }
                  level += 1;
              }
              out
          }
        `,
        php: code`
          function nodesAtOddLevels($root) {
              $out = [];
              if ($root === null) return $out;
              $queue = [$root];
              $head = 0;
              $level = 1;
              while ($head < count($queue)) {
                  $end = count($queue);
                  for (; $head < $end; $head++) {
                      $node = $queue[$head];
                      if ($level % 2 == 1) $out[] = $node->val;
                      if ($node->left !== null) $queue[] = $node->left;
                      if ($node->right !== null) $queue[] = $node->right;
                  }
                  $level++;
              }
              return $out;
          }
        `,
        ruby: code`
          def nodesAtOddLevels(root)
            out = []
            level = root ? [root] : []
            depth = 1
            until level.empty?
              level.each { |node| out << node.val } if depth.odd?
              nxt = []
              level.each do |node|
                nxt << node.left if node.left
                nxt << node.right if node.right
              end
              level = nxt
              depth += 1
            end
            out
          end
        `,
      },
    };
  })(),
];

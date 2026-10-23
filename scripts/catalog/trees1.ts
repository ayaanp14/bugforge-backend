/**
 * Binary tree fundamentals — wave 7, batch 27.
 * Real problems only: the LeetCode Easy tree classics (traversals, depth,
 * symmetry, paths, BST walks). Worked examples are phrased for CodeKairo.
 *
 * Trees travel in LeetCode's level-order wire format (`[3,9,20,null,null,15,7]`,
 * `[]` for an empty tree) and the TreeNode type is defined by each language's
 * judge driver (src/lib/driver-structures.ts) — no solution redefines it.
 * Every input and expected output is produced by `treeFrom` / `fmtTree` so
 * both are canonical. Where LeetCode accepts any order (Binary Tree Paths,
 * Find Mode) the statement fixes one: paths in left-to-right order of their
 * leaves, modes ascending.
 *
 * Judge contract: JS solutions are Node 12-safe (no ??, ?., at(), flat); the
 * C harness has no math.h or limits.h; Go solutions may use only the driver's
 * imports (fmt and strings, no strconv or sort). Kotlin runs 1.3, and its
 * TreeNode field is the keyword `val`, which a String.raw `code` block cannot
 * hold in backticks — the Kotlin solutions write `@val` and `kt()` swaps the
 * quoted name in.
 *
 * Hidden trees stay at ≤ 40 nodes so the 5,000-case suite runs in one process
 * well inside the judge's budget in Python, Ruby and PHP; the statements keep
 * LeetCode's limits except where the int32 rule needs them lowered (Binary
 * Tree Tilt, noted there).
 */
import {
  code, describe, explain, fmtStrArr, fmtTree, pick, randBST, randTree, ri, shuffle, treeFrom,
  type CatalogProblem, type Rng, type TNode,
} from "./types.js";

/** Kotlin's TreeNode field is `val`, a keyword: written `@val` inside code blocks. */
const kt = (s: string) => s.split("@val").join("`val`");

const T = (a: Array<number | null>) => fmtTree(treeFrom(a));

const cloneT = (t: TNode | null): TNode | null => (t ? { val: t.val, left: cloneT(t.left), right: cloneT(t.right) } : null);
const mirrorT = (t: TNode | null): TNode | null => (t ? { val: t.val, left: mirrorT(t.right), right: mirrorT(t.left) } : null);
const nodesOf = (t: TNode | null): TNode[] => {
  const out: TNode[] = [];
  const walk = (n: TNode | null) => { if (n) { out.push(n); walk(n.left); walk(n.right); } };
  walk(t);
  return out;
};
const sameT = (a: TNode | null, b: TNode | null): boolean =>
  a === null || b === null ? a === b : a.val === b.val && sameT(a.left, b.left) && sameT(a.right, b.right);
const heightT = (t: TNode | null): number => (t ? 1 + Math.max(heightT(t.left), heightT(t.right)) : 0);
const inorderT = (t: TNode | null, out: number[] = []): number[] => {
  if (t) { inorderT(t.left, out); out.push(t.val); inorderT(t.right, out); }
  return out;
};
/** A size from a spread of small and moderate trees, so every suite has empty/one-node/deep cases. */
const treeSize = (rng: Rng, min = 0) => {
  if (min === 0 && rng() < 0.04) return 0;
  const lo = Math.max(1, min);
  return ri(rng, lo, Math.max(lo, pick(rng, [1, 3, 6, 12, 25, 40, 40])));
};
/** A height-balanced tree: the remaining nodes split as evenly as possible at every node. */
const evenTree = (rng: Rng, n: number, lo: number, hi: number): TNode | null => {
  if (n <= 0) return null;
  const rest = n - 1;
  const small = Math.floor(rest / 2);
  const leftN = rng() < 0.5 ? small : rest - small;
  return { val: ri(rng, lo, hi), left: evenTree(rng, leftN, lo, hi), right: evenTree(rng, rest - leftN, lo, hi) };
};
/** A chain leaning one way or zig-zagging: the deep, skinny trees recursion has to survive. */
const chainTree = (rng: Rng, n: number, lo: number, hi: number): TNode | null => {
  if (n <= 0) return null;
  const root: TNode = { val: ri(rng, lo, hi), left: null, right: null };
  let cur = root;
  const mode = ri(rng, 0, 2);
  for (let i = 1; i < n; i++) {
    const c: TNode = { val: ri(rng, lo, hi), left: null, right: null };
    const goLeft = mode === 0 ? true : mode === 1 ? false : rng() < 0.5;
    if (goLeft) cur.left = c; else cur.right = c;
    cur = c;
  }
  return root;
};
/** Any shape: mostly random, sometimes balanced, sometimes a chain. */
const anyTree = (rng: Rng, n: number, lo: number, hi: number): TNode | null => {
  const r = rng();
  return r < 0.6 ? randTree(rng, n, lo, hi) : r < 0.8 ? evenTree(rng, n, lo, hi) : chainTree(rng, n, lo, hi);
};

export const TREES1_PROBLEMS: CatalogProblem[] = [

  // ── Binary Tree Inorder Traversal (LC 94) ───────────────────────
  (() => {
    const ref = (root: TNode | null) => inorderT(root);
    return {
      slug: "binary-tree-inorder-traversal",
      title: "Binary Tree Inorder Traversal",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Microsoft", "Amazon", "Google"],
      signature: { funcName: "inorderTraversal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the values of its nodes in **inorder**: for every node, first everything in its left subtree, then the node itself, then everything in its right subtree.",
        [
          { in: "root = [1,null,2,3]", out: "[1,3,2]", note: "Node 1 has no left child, so it comes first; then its right subtree, where 3 (the left child of 2) precedes 2." },
          { in: "root = [4,2,6,1,3,5,7]", out: "[1,2,3,4,5,6,7]", note: "This tree is a binary search tree, and an inorder walk of a BST always lists its values in sorted order." },
          { in: "root = []", out: "[]" },
        ],
        ["The number of nodes in the tree is in the range [0, 100]", "-100 <= Node.val <= 100"],
        "The recursive walk is short — can you do it iteratively with an explicit stack?"),
      hints: [
        "Inorder is a rule you apply at every node: left subtree, the node, right subtree.",
        "A recursive helper that appends to one shared list follows that rule directly; the base case is an empty subtree.",
        "Iteratively: push nodes while walking left; when you fall off, pop a node, record it, and continue from its right child.",
      ],
      editorial: explain({
        idea: "Inorder is defined recursively — left subtree, node, right subtree — so a depth-first walk that records each node between its two recursive calls produces the order exactly. An explicit stack does the same work without recursion.",
        steps: [
          "Start with an empty result list and an empty stack; set `cur = root`.",
          "While `cur` is not null, push it and move to `cur.left`.",
          "When `cur` is null and the stack is not empty, pop a node, append its value, and set `cur` to its right child.",
          "Stop when both `cur` is null and the stack is empty.",
        ],
        why: "A node is popped only after its entire left chain — and so its entire left subtree — has been pushed and popped, and its right subtree is started only after it has been recorded. That is precisely the inorder rule applied at every node.",
        time: "O(n) — every node is pushed and popped once",
        space: "O(h) for the stack (or the recursion), where h is the tree's height — O(n) for a chain",
        pitfalls: [
          "An empty tree returns an empty list, not an error.",
          "Recording the node before descending left gives preorder, not inorder.",
          "A tree that is a long left chain makes the stack as tall as the tree.",
        ],
      }),
      examples: [
        { input: T([1, null, 2, 3]), expectedOutput: "[1,3,2]" },
        { input: T([4, 2, 6, 1, 3, 5, 7]), expectedOutput: "[1,2,3,4,5,6,7]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -100, 100);
        return { input: fmtTree(t), expectedOutput: JSON.stringify(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def inorderTraversal(root: Optional[TreeNode]) -> List[int]:
              out = []
              stack = []
              cur = root
              while cur is not None or stack:
                  while cur is not None:
                      stack.append(cur)
                      cur = cur.left
                  cur = stack.pop()
                  out.append(cur.val)
                  cur = cur.right
              return out
        `,
        javascript: code`
          var inorderTraversal = function(root) {
              var out = [], stack = [], cur = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  out.push(cur.val);
                  cur = cur.right;
              }
              return out;
          };
        `,
        typescript: code`
          function inorderTraversal(root: TreeNode | null): number[] {
              var out: number[] = [];
              var stack: TreeNode[] = [];
              var cur: TreeNode | null = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  var top = stack.pop() as TreeNode;
                  out.push(top.val);
                  cur = top.right;
              }
              return out;
          }
        `,
        java: code`
          public static int[] inorderTraversal(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode cur = root;
              while (cur != null || !stack.isEmpty()) {
                  while (cur != null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  out.add(cur.val);
                  cur = cur.right;
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> inorderTraversal(TreeNode* root) {
              vector<int> out;
              vector<TreeNode*> stack;
              TreeNode* cur = root;
              while (cur || !stack.empty()) {
                  while (cur) {
                      stack.push_back(cur);
                      cur = cur->left;
                  }
                  cur = stack.back();
                  stack.pop_back();
                  out.push_back(cur->val);
                  cur = cur->right;
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          int* inorderTraversal(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int top = 0, k = 0;
              struct TreeNode* cur = root;
              while (cur != NULL || top > 0) {
                  while (cur != NULL) {
                      stack[top++] = cur;
                      cur = cur->left;
                  }
                  cur = stack[--top];
                  out[k++] = cur->val;
                  cur = cur->right;
              }
              free(stack);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] InorderTraversal(TreeNode root)
          {
              var output = new List<int>();
              var stack = new Stack<TreeNode>();
              TreeNode cur = root;
              while (cur != null || stack.Count > 0)
              {
                  while (cur != null)
                  {
                      stack.Push(cur);
                      cur = cur.left;
                  }
                  cur = stack.Pop();
                  output.Add(cur.val);
                  cur = cur.right;
              }
              return output.ToArray();
          }
        `,
        go: code`
          func inorderTraversal(root *TreeNode) []int {
              out := []int{}
              stack := []*TreeNode{}
              cur := root
              for cur != nil || len(stack) > 0 {
                  for cur != nil {
                      stack = append(stack, cur)
                      cur = cur.Left
                  }
                  cur = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  out = append(out, cur.Val)
                  cur = cur.Right
              }
              return out
          }
        `,
        kotlin: kt(code`
          fun inorderTraversal(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              val stack = ArrayList<TreeNode>()
              var cur = root
              while (cur != null || stack.isNotEmpty()) {
                  while (cur != null) {
                      stack.add(cur)
                      cur = cur.left
                  }
                  val node = stack.removeAt(stack.size - 1)
                  out.add(node.@val)
                  cur = node.right
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func inorderTraversal(_ root: TreeNode?) -> [Int] {
              var out = [Int]()
              var stack = [TreeNode]()
              var cur = root
              while cur != nil || !stack.isEmpty {
                  while let c = cur {
                      stack.append(c)
                      cur = c.left
                  }
                  let node = stack.removeLast()
                  out.append(node.val)
                  cur = node.right
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn inorderTraversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out = Vec::new();
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let n = stack.pop().unwrap();
                  out.push(n.borrow().val);
                  cur = n.borrow().right.clone();
              }
              out
          }
        `,
        php: code`
          function inorderTraversal($root) {
              $out = [];
              $stack = [];
              $cur = $root;
              while ($cur !== null || count($stack) > 0) {
                  while ($cur !== null) {
                      $stack[] = $cur;
                      $cur = $cur->left;
                  }
                  $cur = array_pop($stack);
                  $out[] = $cur->val;
                  $cur = $cur->right;
              }
              return $out;
          }
        `,
        ruby: code`
          def inorderTraversal(root)
            out = []
            stack = []
            cur = root
            while !cur.nil? || !stack.empty?
              until cur.nil?
                stack << cur
                cur = cur.left
              end
              cur = stack.pop
              out << cur.val
              cur = cur.right
            end
            out
          end
        `,
      },
    };
  })(),


  // ── Binary Tree Preorder Traversal (LC 144) ─────────────────────
  (() => {
    const ref = (root: TNode | null) => nodesOf(root).map((n) => n.val);
    return {
      slug: "binary-tree-preorder-traversal",
      title: "Binary Tree Preorder Traversal",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Microsoft", "Amazon", "Google"],
      signature: { funcName: "preorderTraversal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the values of its nodes in **preorder**: for every node, first the node itself, then everything in its left subtree, then everything in its right subtree.",
        [
          { in: "root = [1,null,2,3]", out: "[1,2,3]", note: "1 is visited first; its only child is 2, which is visited before its own left child 3." },
          { in: "root = [1,2,3,4,5,null,8,null,null,6,7,9]", out: "[1,2,4,5,6,7,3,8,9]", note: "The whole left subtree of 1 (rooted at 2) is listed before anything in the right subtree (rooted at 3)." },
          { in: "root = []", out: "[]" },
        ],
        ["The number of nodes in the tree is in the range [0, 100]", "-100 <= Node.val <= 100"],
        "The recursive walk is short — can you do it iteratively with an explicit stack?"),
      hints: [
        "Preorder records a node the moment you reach it, before either child.",
        "Recursively: record the node, recurse left, recurse right. The empty subtree records nothing.",
        "Iteratively, a stack serves nodes last-in-first-out — so push the right child before the left one, and the left subtree is finished first.",
      ],
      editorial: explain({
        idea: "Preorder is node, left subtree, right subtree. A stack reproduces the recursion: pop a node, record it, and push its children so that the left one comes off first.",
        steps: [
          "If the tree is empty return an empty list; otherwise push the root.",
          "While the stack is not empty, pop a node and append its value.",
          "Push its right child (if any), then its left child (if any).",
          "Return the list.",
        ],
        why: "The left child is pushed last, so it is popped next, and every node of its subtree is pushed above the waiting right child — the right subtree is reached only after the entire left subtree has been emptied off the stack. Each node is recorded before any of its descendants, which is the preorder rule.",
        time: "O(n)",
        space: "O(h) for the recursion; the stack version holds at most O(h) waiting right children plus the current path",
        pitfalls: [
          "Pushing the left child first visits the right subtree first.",
          "Push only non-null children, or the loop has to skip nulls.",
          "An empty tree returns `[]`.",
        ],
      }),
      examples: [
        { input: T([1, null, 2, 3]), expectedOutput: "[1,2,3]" },
        { input: T([1, 2, 3, 4, 5, null, 8, null, null, 6, 7, 9]), expectedOutput: "[1,2,4,5,6,7,3,8,9]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -100, 100);
        return { input: fmtTree(t), expectedOutput: JSON.stringify(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def preorderTraversal(root: Optional[TreeNode]) -> List[int]:
              out = []
              stack = [root] if root is not None else []
              while stack:
                  node = stack.pop()
                  out.append(node.val)
                  if node.right is not None:
                      stack.append(node.right)
                  if node.left is not None:
                      stack.append(node.left)
              return out
        `,
        javascript: code`
          var preorderTraversal = function(root) {
              var out = [];
              var stack = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              return out;
          };
        `,
        typescript: code`
          function preorderTraversal(root: TreeNode | null): number[] {
              var out: number[] = [];
              var stack: TreeNode[] = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  out.push(node.val);
                  if (node.right !== null) stack.push(node.right);
                  if (node.left !== null) stack.push(node.left);
              }
              return out;
          }
        `,
        java: code`
          public static int[] preorderTraversal(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              if (root != null) stack.push(root);
              while (!stack.isEmpty()) {
                  TreeNode node = stack.pop();
                  out.add(node.val);
                  if (node.right != null) stack.push(node.right);
                  if (node.left != null) stack.push(node.left);
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> preorderTraversal(TreeNode* root) {
              vector<int> out;
              vector<TreeNode*> stack;
              if (root) stack.push_back(root);
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  out.push_back(node->val);
                  if (node->right) stack.push_back(node->right);
                  if (node->left) stack.push_back(node->left);
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          int* preorderTraversal(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int top = 0, k = 0;
              if (root != NULL) stack[top++] = root;
              while (top > 0) {
                  struct TreeNode* node = stack[--top];
                  out[k++] = node->val;
                  if (node->right != NULL) stack[top++] = node->right;
                  if (node->left != NULL) stack[top++] = node->left;
              }
              free(stack);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] PreorderTraversal(TreeNode root)
          {
              var output = new List<int>();
              var stack = new Stack<TreeNode>();
              if (root != null) stack.Push(root);
              while (stack.Count > 0)
              {
                  TreeNode node = stack.Pop();
                  output.Add(node.val);
                  if (node.right != null) stack.Push(node.right);
                  if (node.left != null) stack.Push(node.left);
              }
              return output.ToArray();
          }
        `,
        go: code`
          func preorderTraversal(root *TreeNode) []int {
              out := []int{}
              stack := []*TreeNode{}
              if root != nil {
                  stack = append(stack, root)
              }
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  out = append(out, node.Val)
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
        kotlin: kt(code`
          fun preorderTraversal(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              val stack = ArrayList<TreeNode>()
              if (root != null) stack.add(root)
              while (stack.isNotEmpty()) {
                  val node = stack.removeAt(stack.size - 1)
                  out.add(node.@val)
                  val r = node.right
                  if (r != null) stack.add(r)
                  val l = node.left
                  if (l != null) stack.add(l)
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func preorderTraversal(_ root: TreeNode?) -> [Int] {
              var out = [Int]()
              var stack = [TreeNode]()
              if let r = root { stack.append(r) }
              while !stack.isEmpty {
                  let node = stack.removeLast()
                  out.append(node.val)
                  if let r = node.right { stack.append(r) }
                  if let l = node.left { stack.append(l) }
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn preorderTraversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out = Vec::new();
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  stack.push(r);
              }
              while let Some(rc) = stack.pop() {
                  let node = rc.borrow();
                  out.push(node.val);
                  if let Some(r) = node.right.clone() {
                      stack.push(r);
                  }
                  if let Some(l) = node.left.clone() {
                      stack.push(l);
                  }
              }
              out
          }
        `,
        php: code`
          function preorderTraversal($root) {
              $out = [];
              $stack = [];
              if ($root !== null) $stack[] = $root;
              while (count($stack) > 0) {
                  $node = array_pop($stack);
                  $out[] = $node->val;
                  if ($node->right !== null) $stack[] = $node->right;
                  if ($node->left !== null) $stack[] = $node->left;
              }
              return $out;
          }
        `,
        ruby: code`
          def preorderTraversal(root)
            out = []
            stack = root.nil? ? [] : [root]
            until stack.empty?
              node = stack.pop
              out << node.val
              stack << node.right unless node.right.nil?
              stack << node.left unless node.left.nil?
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Postorder Traversal (LC 145) ────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const out: number[] = [];
      const walk = (n: TNode | null) => { if (n) { walk(n.left); walk(n.right); out.push(n.val); } };
      walk(root);
      return out;
    };
    return {
      slug: "binary-tree-postorder-traversal",
      title: "Binary Tree Postorder Traversal",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Stack", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "postorderTraversal", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return the values of its nodes in **postorder**: for every node, first everything in its left subtree, then everything in its right subtree, and the node itself last.",
        [
          { in: "root = [1,null,2,3]", out: "[3,2,1]", note: "3 is the deepest node and comes first; the root 1 is always last." },
          { in: "root = [1,2,3,4,5,null,8,null,null,6,7,9]", out: "[4,6,7,5,2,9,8,3,1]" },
          { in: "root = [5]", out: "[5]" },
        ],
        ["The number of nodes in the tree is in the range [0, 100]", "-100 <= Node.val <= 100"],
        "The recursive walk is short — can you do it iteratively?"),
      hints: [
        "In postorder a node is recorded only after both of its subtrees are finished — the root is always last.",
        "A recursive helper that recurses left, recurses right and then appends the node follows the rule directly.",
        "For an iterative version: a modified preorder (node, right, left) produces exactly the reverse of postorder.",
      ],
      editorial: explain({
        idea: "Postorder is left subtree, right subtree, then the node. A depth-first helper that appends a node after both of its recursive calls return writes the values in exactly that order.",
        steps: [
          "Define `walk(node)`: if `node` is null, return.",
          "Call `walk(node.left)`, then `walk(node.right)`.",
          "Append `node.val` to the result.",
          "Call `walk(root)` and return the result.",
        ],
        why: "By induction on the height: `walk` lists a subtree in postorder because it first lists the left subtree in postorder, then the right one, then the subtree's root — which is the definition. An iterative alternative runs preorder with the children swapped (node, right, left) and reverses the list, since reversing that order gives left, right, node at every level.",
        time: "O(n)",
        space: "O(h) for the recursion stack, O(n) for a chain-shaped tree",
        pitfalls: [
          "Appending before the recursive calls gives preorder.",
          "In the reversed-preorder trick, push the left child before the right one (the reverse of a normal preorder).",
        ],
      }),
      examples: [
        { input: T([1, null, 2, 3]), expectedOutput: "[3,2,1]" },
        { input: T([1, 2, 3, 4, 5, null, 8, null, null, 6, 7, 9]), expectedOutput: "[4,6,7,5,2,9,8,3,1]" },
        { input: T([5]), expectedOutput: "[5]" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -100, 100);
        return { input: fmtTree(t), expectedOutput: JSON.stringify(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def postorderTraversal(root: Optional[TreeNode]) -> List[int]:
              out = []

              def walk(node):
                  if node is None:
                      return
                  walk(node.left)
                  walk(node.right)
                  out.append(node.val)

              walk(root)
              return out
        `,
        javascript: code`
          var postorderTraversal = function(root) {
              var out = [];
              postWalk(root, out);
              return out;
          };

          var postWalk = function(node, out) {
              if (node === null) return;
              postWalk(node.left, out);
              postWalk(node.right, out);
              out.push(node.val);
          };
        `,
        typescript: code`
          function postorderTraversal(root: TreeNode | null): number[] {
              var out: number[] = [];
              postWalk(root, out);
              return out;
          }

          function postWalk(node: TreeNode | null, out: number[]): void {
              if (node === null) return;
              postWalk(node.left, out);
              postWalk(node.right, out);
              out.push(node.val);
          }
        `,
        java: code`
          public static int[] postorderTraversal(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              postWalk(root, out);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }

          static void postWalk(TreeNode node, List<Integer> out) {
              if (node == null) return;
              postWalk(node.left, out);
              postWalk(node.right, out);
              out.add(node.val);
          }
        `,
        cpp: code`
          void postWalk(TreeNode* node, vector<int>& out) {
              if (!node) return;
              postWalk(node->left, out);
              postWalk(node->right, out);
              out.push_back(node->val);
          }

          vector<int> postorderTraversal(TreeNode* root) {
              vector<int> out;
              postWalk(root, out);
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void postWalk(struct TreeNode* node, int* out, int* k) {
              if (node == NULL) return;
              postWalk(node->left, out, k);
              postWalk(node->right, out, k);
              out[(*k)++] = node->val;
          }

          int* postorderTraversal(struct TreeNode* root, int* returnSize) {
              int* out = (int*) malloc((size_t) (countNodes(root) + 1) * sizeof(int));
              int k = 0;
              postWalk(root, out, &k);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] PostorderTraversal(TreeNode root)
          {
              var output = new List<int>();
              PostWalk(root, output);
              return output.ToArray();
          }

          static void PostWalk(TreeNode node, List<int> output)
          {
              if (node == null) return;
              PostWalk(node.left, output);
              PostWalk(node.right, output);
              output.Add(node.val);
          }
        `,
        go: code`
          func postorderTraversal(root *TreeNode) []int {
              out := []int{}
              postWalk(root, &out)
              return out
          }

          func postWalk(node *TreeNode, out *[]int) {
              if node == nil {
                  return
              }
              postWalk(node.Left, out)
              postWalk(node.Right, out)
              *out = append(*out, node.Val)
          }
        `,
        kotlin: kt(code`
          fun postorderTraversal(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              postWalk(root, out)
              return out.toIntArray()
          }

          fun postWalk(node: TreeNode?, out: ArrayList<Int>) {
              if (node == null) return
              postWalk(node.left, out)
              postWalk(node.right, out)
              out.add(node.@val)
          }
        `),
        swift: code`
          func postorderTraversal(_ root: TreeNode?) -> [Int] {
              var out = [Int]()
              postWalk(root, &out)
              return out
          }

          func postWalk(_ node: TreeNode?, _ out: inout [Int]) {
              guard let n = node else { return }
              postWalk(n.left, &out)
              postWalk(n.right, &out)
              out.append(n.val)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn postorderTraversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out = Vec::new();
              post_walk(&root, &mut out);
              out
          }

          fn post_walk(node: &Option<Rc<RefCell<TreeNode>>>, out: &mut Vec<i32>) {
              if let Some(rc) = node {
                  let n = rc.borrow();
                  post_walk(&n.left, out);
                  post_walk(&n.right, out);
                  out.push(n.val);
              }
          }
        `,
        php: code`
          function postorderTraversal($root) {
              $out = [];
              postWalk($root, $out);
              return $out;
          }

          function postWalk($node, &$out) {
              if ($node === null) return;
              postWalk($node->left, $out);
              postWalk($node->right, $out);
              $out[] = $node->val;
          }
        `,
        ruby: code`
          def postorderTraversal(root)
            out = []
            post_walk(root, out)
            out
          end

          def post_walk(node, out)
            return if node.nil?
            post_walk(node.left, out)
            post_walk(node.right, out)
            out << node.val
          end
        `,
      },
    };
  })(),

  // ── Same Tree (LC 100) ──────────────────────────────────────────
  (() => {
    const ref = (p: TNode | null, q: TNode | null) => sameT(p, q);
    return {
      slug: "same-tree",
      title: "Same Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Microsoft", "Bloomberg"],
      signature: {
        funcName: "isSameTree",
        params: [{ name: "p", type: "TreeNode" as const }, { name: "q", type: "TreeNode" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You are given the roots `p` and `q` of two binary trees. Return `true` if the two trees are **identical** — the same shape, with equal values in every corresponding node — and `false` otherwise.",
        [
          { in: "p = [1,2,3], q = [1,2,3]", out: "true" },
          { in: "p = [1,2], q = [1,null,2]", out: "false", note: "Both trees hold 1 and 2, but in `p` the 2 is a left child and in `q` a right child — the shapes differ." },
          { in: "p = [1,2,1], q = [1,1,2]", out: "false", note: "Same shape, but the left children hold 2 and 1." },
        ],
        ["The number of nodes in both trees is in the range [0, 100]", "-10^4 <= Node.val <= 10^4"]),
      hints: [
        "Two empty trees are identical; an empty tree and a non-empty one are not.",
        "Two non-empty trees are identical exactly when their roots hold the same value and their left subtrees are identical and their right subtrees are identical.",
        "That sentence is the whole recursion — compare, then recurse on the left pair and the right pair, stopping at the first mismatch.",
      ],
      editorial: explain({
        idea: "Identity is defined recursively: equal roots, identical left subtrees, identical right subtrees. Walk both trees in lock-step and stop at the first difference in shape or value.",
        steps: [
          "If both nodes are null, return `true`.",
          "If exactly one is null, return `false` — the shapes differ.",
          "If the values differ, return `false`.",
          "Otherwise return `same(p.left, q.left) && same(p.right, q.right)`.",
        ],
        why: "Each call compares one pair of positions that occupy the same place in both trees. Every position present in either tree is reached, because the recursion only stops early on a mismatch (which already decides the answer) or when both sides are empty (nothing left to compare there).",
        time: "O(min(n, m)) — the walk stops at the smaller tree's boundary or the first mismatch",
        space: "O(h) recursion depth",
        pitfalls: [
          "Comparing one traversal list is not enough: `[1,2]` and `[1,null,2]` have the same preorder `[1,2]` but different shapes.",
          "Check the null cases before reading `.val`.",
        ],
      }),
      examples: [
        { input: `${T([1, 2, 3])}\n${T([1, 2, 3])}`, expectedOutput: "true" },
        { input: `${T([1, 2])}\n${T([1, null, 2])}`, expectedOutput: "false" },
        { input: `${T([1, 2, 1])}\n${T([1, 1, 2])}`, expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [1, 3, 10000]);
        const p = anyTree(rng, treeSize(rng), -span, span);
        let q = cloneT(p);
        const mode = rng();
        if (mode < 0.2 && q) {
          // one value changed
          const ns = nodesOf(q);
          const n = ns[ri(rng, 0, ns.length - 1)];
          n.val = n.val === span ? n.val - 1 : n.val + 1;
        } else if (mode < 0.4 && q) {
          // one leaf removed, or one leaf added
          const ns = nodesOf(q);
          const n = ns[ri(rng, 0, ns.length - 1)];
          if (rng() < 0.5 && n.left === null) n.left = { val: ri(rng, -span, span), left: null, right: null };
          else if (n.right === null) n.right = { val: ri(rng, -span, span), left: null, right: null };
          else if (n === q) q = null;
          else n.right = null;
        } else if (mode < 0.55) {
          q = anyTree(rng, treeSize(rng), -span, span);
        } else if (mode < 0.65) {
          q = mirrorT(q);
        }
        return { input: `${fmtTree(p)}\n${fmtTree(q)}`, expectedOutput: String(ref(p, q)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSameTree(p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
              if p is None or q is None:
                  return p is q
              return p.val == q.val and isSameTree(p.left, q.left) and isSameTree(p.right, q.right)
        `,
        javascript: code`
          var isSameTree = function(p, q) {
              if (p === null || q === null) return p === q;
              return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
          };
        `,
        typescript: code`
          function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
              if (p === null || q === null) return p === q;
              return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
          }
        `,
        java: code`
          public static boolean isSameTree(TreeNode p, TreeNode q) {
              if (p == null || q == null) return p == q;
              return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
          }
        `,
        cpp: code`
          bool isSameTree(TreeNode* p, TreeNode* q) {
              if (!p || !q) return p == q;
              return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
          }
        `,
        c: code`
          bool isSameTree(struct TreeNode* p, struct TreeNode* q) {
              if (p == NULL || q == NULL) return p == q;
              return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
          }
        `,
        csharp: code`
          public static bool IsSameTree(TreeNode p, TreeNode q)
          {
              if (p == null || q == null) return p == q;
              return p.val == q.val && IsSameTree(p.left, q.left) && IsSameTree(p.right, q.right);
          }
        `,
        go: code`
          func isSameTree(p *TreeNode, q *TreeNode) bool {
              if p == nil || q == nil {
                  return p == q
              }
              return p.Val == q.Val && isSameTree(p.Left, q.Left) && isSameTree(p.Right, q.Right)
          }
        `,
        kotlin: kt(code`
          fun isSameTree(p: TreeNode?, q: TreeNode?): Boolean {
              if (p == null || q == null) return p === q
              return p.@val == q.@val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
          }
        `),
        swift: code`
          func isSameTree(_ p: TreeNode?, _ q: TreeNode?) -> Bool {
              guard let a = p, let b = q else { return p == nil && q == nil }
              return a.val == b.val && isSameTree(a.left, b.left) && isSameTree(a.right, b.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSameTree(p: Option<Rc<RefCell<TreeNode>>>, q: Option<Rc<RefCell<TreeNode>>>) -> bool {
              same(&p, &q)
          }

          fn same(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let x = x.borrow();
                      let y = y.borrow();
                      x.val == y.val && same(&x.left, &y.left) && same(&x.right, &y.right)
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isSameTree($p, $q) {
              if ($p === null || $q === null) return $p === $q;
              return $p->val == $q->val && isSameTree($p->left, $q->left) && isSameTree($p->right, $q->right);
          }
        `,
        ruby: code`
          def isSameTree(p, q)
            return p.nil? && q.nil? if p.nil? || q.nil?
            p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
          end
        `,
      },
    };
  })(),

  // ── Symmetric Tree (LC 101) ─────────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => sameT(root, mirrorT(root));
    return {
      slug: "symmetric-tree",
      title: "Symmetric Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Microsoft", "LinkedIn", "Bloomberg"],
      signature: { funcName: "isSymmetric", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, return `true` if the tree is a **mirror image of itself** around its centre line — its left subtree is the reflection of its right subtree, in shape and in values — and `false` otherwise.",
        [
          { in: "root = [1,2,2,3,4,4,3]", out: "true", note: "Reflecting the left subtree `2 → (3, 4)` gives `2 → (4, 3)`, which is exactly the right subtree." },
          { in: "root = [1,2,2,null,3,null,3]", out: "false", note: "Both 3s are right children; a mirror image would need one of them on the left." },
          { in: "root = [7]", out: "true" },
        ],
        ["The number of nodes in the tree is in the range [1, 1000]", "-100 <= Node.val <= 100"],
        "Can you solve it both recursively and iteratively?"),
      hints: [
        "Symmetry is a relation between two subtrees: the root's left and right.",
        "Two trees `a` and `b` are mirrors when their roots match, `a.left` mirrors `b.right`, and `a.right` mirrors `b.left`.",
        "Iteratively, put pairs `(a, b)` on a queue and push `(a.left, b.right)` and `(a.right, b.left)` for each matching pair.",
      ],
      editorial: explain({
        idea: "A tree is symmetric when its left subtree is the mirror of its right subtree. Check that with a helper `mirror(a, b)` that walks the two subtrees in opposite directions at the same time.",
        steps: [
          "Return `mirror(root.left, root.right)`.",
          "`mirror(a, b)`: if both are null return `true`; if exactly one is null return `false`.",
          "If `a.val != b.val` return `false`.",
          "Return `mirror(a.left, b.right) && mirror(a.right, b.left)`.",
        ],
        why: "Reflecting a tree swaps left and right at every level, so the node at the position reached by a path of left/right turns on one side must equal the node reached by the opposite turns on the other. The helper compares exactly those position pairs, outer with outer and inner with inner.",
        time: "O(n)",
        space: "O(h) recursion depth (a queue of pairs uses O(width) instead)",
        pitfalls: [
          "Comparing `a.left` with `b.left` checks equality, not reflection.",
          "Equal level-order value lists are not enough when nulls are ignored — positions matter.",
        ],
      }),
      examples: [
        { input: T([1, 2, 2, 3, 4, 4, 3]), expectedOutput: "true" },
        { input: T([1, 2, 2, null, 3, null, 3]), expectedOutput: "false" },
        { input: T([7]), expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [1, 3, 100]);
        let root: TNode | null;
        if (rng() < 0.15) {
          root = anyTree(rng, treeSize(rng, 1), -span, span);
        } else {
          const half = anyTree(rng, ri(rng, 0, pick(rng, [0, 2, 6, 19])), -span, span);
          root = { val: ri(rng, -span, span), left: half, right: mirrorT(cloneT(half)) };
          const mode = rng();
          const ns = nodesOf(root);
          if (mode < 0.25 && ns.length > 1) {
            const n = ns[ri(rng, 1, ns.length - 1)];
            n.val = n.val === span ? n.val - 1 : n.val + 1;
          } else if (mode < 0.4) {
            const n = ns[ri(rng, 0, ns.length - 1)];
            if (n.left === null) n.left = { val: ri(rng, -span, span), left: null, right: null };
            else if (n.right === null) n.right = { val: ri(rng, -span, span), left: null, right: null };
          } else if (mode < 0.5 && root.left) {
            // the same subtree on both sides, not its reflection
            root.right = cloneT(root.left);
          }
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSymmetric(root: Optional[TreeNode]) -> bool:
              def mirror(a, b):
                  if a is None or b is None:
                      return a is b
                  return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)

              return root is None or mirror(root.left, root.right)
        `,
        javascript: code`
          var isSymmetric = function(root) {
              return root === null || mirror(root.left, root.right);
          };

          var mirror = function(a, b) {
              if (a === null || b === null) return a === b;
              return a.val === b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
          };
        `,
        typescript: code`
          function isSymmetric(root: TreeNode | null): boolean {
              return root === null || mirror(root.left, root.right);
          }

          function mirror(a: TreeNode | null, b: TreeNode | null): boolean {
              if (a === null || b === null) return a === b;
              return a.val === b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
          }
        `,
        java: code`
          public static boolean isSymmetric(TreeNode root) {
              return root == null || mirror(root.left, root.right);
          }

          static boolean mirror(TreeNode a, TreeNode b) {
              if (a == null || b == null) return a == b;
              return a.val == b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
          }
        `,
        cpp: code`
          bool mirrorPair(TreeNode* a, TreeNode* b) {
              if (!a || !b) return a == b;
              return a->val == b->val && mirrorPair(a->left, b->right) && mirrorPair(a->right, b->left);
          }

          bool isSymmetric(TreeNode* root) {
              return !root || mirrorPair(root->left, root->right);
          }
        `,
        c: code`
          static bool mirrorPair(struct TreeNode* a, struct TreeNode* b) {
              if (a == NULL || b == NULL) return a == b;
              return a->val == b->val && mirrorPair(a->left, b->right) && mirrorPair(a->right, b->left);
          }

          bool isSymmetric(struct TreeNode* root) {
              return root == NULL || mirrorPair(root->left, root->right);
          }
        `,
        csharp: code`
          public static bool IsSymmetric(TreeNode root)
          {
              return root == null || Mirror(root.left, root.right);
          }

          static bool Mirror(TreeNode a, TreeNode b)
          {
              if (a == null || b == null) return a == b;
              return a.val == b.val && Mirror(a.left, b.right) && Mirror(a.right, b.left);
          }
        `,
        go: code`
          func isSymmetric(root *TreeNode) bool {
              return root == nil || mirrorPair(root.Left, root.Right)
          }

          func mirrorPair(a *TreeNode, b *TreeNode) bool {
              if a == nil || b == nil {
                  return a == b
              }
              return a.Val == b.Val && mirrorPair(a.Left, b.Right) && mirrorPair(a.Right, b.Left)
          }
        `,
        kotlin: kt(code`
          fun isSymmetric(root: TreeNode?): Boolean {
              return root == null || mirrorPair(root.left, root.right)
          }

          fun mirrorPair(a: TreeNode?, b: TreeNode?): Boolean {
              if (a == null || b == null) return a === b
              return a.@val == b.@val && mirrorPair(a.left, b.right) && mirrorPair(a.right, b.left)
          }
        `),
        swift: code`
          func isSymmetric(_ root: TreeNode?) -> Bool {
              guard let r = root else { return true }
              return mirrorPair(r.left, r.right)
          }

          func mirrorPair(_ a: TreeNode?, _ b: TreeNode?) -> Bool {
              guard let x = a, let y = b else { return a == nil && b == nil }
              return x.val == y.val && mirrorPair(x.left, y.right) && mirrorPair(x.right, y.left)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSymmetric(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              match root {
                  None => true,
                  Some(rc) => {
                      let n = rc.borrow();
                      mirror_pair(&n.left, &n.right)
                  }
              }
          }

          fn mirror_pair(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let x = x.borrow();
                      let y = y.borrow();
                      x.val == y.val && mirror_pair(&x.left, &y.right) && mirror_pair(&x.right, &y.left)
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isSymmetric($root) {
              return $root === null || mirrorPair($root->left, $root->right);
          }

          function mirrorPair($a, $b) {
              if ($a === null || $b === null) return $a === $b;
              return $a->val == $b->val && mirrorPair($a->left, $b->right) && mirrorPair($a->right, $b->left);
          }
        `,
        ruby: code`
          def isSymmetric(root)
            root.nil? || mirror_pair(root.left, root.right)
          end

          def mirror_pair(a, b)
            return a.nil? && b.nil? if a.nil? || b.nil?
            a.val == b.val && mirror_pair(a.left, b.right) && mirror_pair(a.right, b.left)
          end
        `,
      },
    };
  })(),


  // ── Maximum Depth of Binary Tree (LC 104) ───────────────────────
  (() => {
    const ref = (root: TNode | null) => heightT(root);
    return {
      slug: "maximum-depth-of-binary-tree",
      title: "Maximum Depth of Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "LinkedIn", "Microsoft", "Google"],
      signature: { funcName: "maxDepth", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **maximum depth**: the number of nodes on the longest path from the root down to the farthest leaf. An empty tree has depth `0`.",
        [
          { in: "root = [3,9,20,null,null,15,7]", out: "3", note: "The longest root-to-leaf paths are 3 → 20 → 15 and 3 → 20 → 7, each with three nodes." },
          { in: "root = [1,null,2]", out: "2" },
          { in: "root = []", out: "0" },
        ],
        ["The number of nodes in the tree is in the range [0, 10^4]", "-100 <= Node.val <= 100"]),
      hints: [
        "The depth of a tree is one more than the depth of its deeper subtree.",
        "That gives a two-line recursion whose base case is the empty tree, with depth 0.",
        "Without recursion: a breadth-first search counts how many levels it processes.",
      ],
      editorial: explain({
        idea: "Depth satisfies `depth(node) = 1 + max(depth(node.left), depth(node.right))` with `depth(null) = 0`, so one post-order recursion computes it.",
        steps: [
          "If `root` is null, return 0.",
          "Compute the depths of the left and right subtrees recursively.",
          "Return `1 + max(left, right)`.",
        ],
        why: "Any root-to-leaf path leaves the root through exactly one child, so the longest one is the root plus the longest path in whichever subtree is deeper — exactly what the recurrence takes.",
        time: "O(n)",
        space: "O(h) recursion depth; a level-by-level BFS uses O(width) instead",
        pitfalls: [
          "Depth counts nodes, not edges: a single node has depth 1.",
          "An empty tree has depth 0.",
        ],
      }),
      examples: [
        { input: T([3, 9, 20, null, null, 15, 7]), expectedOutput: "3" },
        { input: T([1, null, 2]), expectedOutput: "2" },
        { input: "[]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -100, 100);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def maxDepth(root: Optional[TreeNode]) -> int:
              if root is None:
                  return 0
              return 1 + max(maxDepth(root.left), maxDepth(root.right))
        `,
        javascript: code`
          var maxDepth = function(root) {
              if (root === null) return 0;
              return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
          };
        `,
        typescript: code`
          function maxDepth(root: TreeNode | null): number {
              if (root === null) return 0;
              return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
          }
        `,
        java: code`
          public static int maxDepth(TreeNode root) {
              if (root == null) return 0;
              return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
          }
        `,
        cpp: code`
          int maxDepth(TreeNode* root) {
              if (!root) return 0;
              return 1 + max(maxDepth(root->left), maxDepth(root->right));
          }
        `,
        c: code`
          int maxDepth(struct TreeNode* root) {
              if (root == NULL) return 0;
              int l = maxDepth(root->left), r = maxDepth(root->right);
              return 1 + (l > r ? l : r);
          }
        `,
        csharp: code`
          public static int MaxDepth(TreeNode root)
          {
              if (root == null) return 0;
              return 1 + Math.Max(MaxDepth(root.left), MaxDepth(root.right));
          }
        `,
        go: code`
          func maxDepth(root *TreeNode) int {
              if root == nil {
                  return 0
              }
              l, r := maxDepth(root.Left), maxDepth(root.Right)
              if l > r {
                  return 1 + l
              }
              return 1 + r
          }
        `,
        kotlin: code`
          fun maxDepth(root: TreeNode?): Int {
              if (root == null) return 0
              return 1 + maxOf(maxDepth(root.left), maxDepth(root.right))
          }
        `,
        swift: code`
          func maxDepth(_ root: TreeNode?) -> Int {
              guard let r = root else { return 0 }
              return 1 + max(maxDepth(r.left), maxDepth(r.right))
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn maxDepth(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              depth(&root)
          }

          fn depth(node: &Option<Rc<RefCell<TreeNode>>>) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      1 + depth(&n.left).max(depth(&n.right))
                  }
              }
          }
        `,
        php: code`
          function maxDepth($root) {
              if ($root === null) return 0;
              return 1 + max(maxDepth($root->left), maxDepth($root->right));
          }
        `,
        ruby: code`
          def maxDepth(root)
            return 0 if root.nil?
            1 + [maxDepth(root.left), maxDepth(root.right)].max
          end
        `,
      },
    };
  })(),

  // ── Minimum Depth of Binary Tree (LC 111) ───────────────────────
  (() => {
    const ref = (root: TNode | null): number => {
      if (!root) return 0;
      if (!root.left && !root.right) return 1;
      if (!root.left) return 1 + ref(root.right);
      if (!root.right) return 1 + ref(root.left);
      return 1 + Math.min(ref(root.left), ref(root.right));
    };
    return {
      slug: "minimum-depth-of-binary-tree",
      title: "Minimum Depth of Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "minDepth", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **minimum depth**: the number of nodes on the shortest path from the root down to the nearest **leaf**. A leaf is a node with no children. An empty tree has minimum depth `0`.",
        [
          { in: "root = [3,9,20,null,null,15,7]", out: "2", note: "9 is a leaf, so the path 3 → 9 of two nodes is the shortest." },
          { in: "root = [2,null,3,null,4,null,5,null,6]", out: "5", note: "The tree is one chain; the only leaf is 6, five nodes down. The root's missing left child is not a leaf." },
          { in: "root = []", out: "0" },
        ],
        ["The number of nodes in the tree is in the range [0, 10^5]", "-1000 <= Node.val <= 1000"]),
      hints: [
        "This is not `1 + min(left, right)`: a node with one child is not a leaf, so its missing side must not count as depth 0.",
        "Handle the cases separately — no children (depth 1), one child (follow it), two children (take the smaller).",
        "A breadth-first search can stop at the first leaf it meets, which is the shallowest one.",
      ],
      editorial: explain({
        idea: "The answer is the depth of the shallowest leaf. A level-by-level BFS meets leaves in order of depth, so the first leaf it dequeues gives the answer — and it never explores below that level.",
        steps: [
          "If `root` is null, return 0.",
          "Put `root` on a queue with depth 1.",
          "Dequeue a node; if it has no children, return its depth.",
          "Otherwise enqueue each existing child with depth + 1, and repeat.",
        ],
        why: "BFS dequeues every node at depth `d` before any node at depth `d + 1`, so the first leaf dequeued is at the smallest depth any leaf has. A recursive alternative must treat a one-child node as having only that child — taking the min with an empty side would report a path that ends at a non-leaf.",
        time: "O(n) in the worst case, and only the levels above the shallowest leaf with BFS",
        space: "O(width) for the queue",
        pitfalls: [
          "`1 + min(minDepth(left), minDepth(right))` returns 1 for `[1,2]`, but the root is not a leaf there — the answer is 2.",
          "An empty tree is 0, a single node is 1.",
        ],
      }),
      examples: [
        { input: T([3, 9, 20, null, null, 15, 7]), expectedOutput: "2" },
        { input: T([2, null, 3, null, 4, null, 5, null, 6]), expectedOutput: "5" },
        { input: "[]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -1000, 1000);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional
          from collections import deque

          def minDepth(root: Optional[TreeNode]) -> int:
              if root is None:
                  return 0
              queue = deque([(root, 1)])
              while queue:
                  node, d = queue.popleft()
                  if node.left is None and node.right is None:
                      return d
                  if node.left is not None:
                      queue.append((node.left, d + 1))
                  if node.right is not None:
                      queue.append((node.right, d + 1))
              return 0
        `,
        javascript: code`
          var minDepth = function(root) {
              if (root === null) return 0;
              var level = [root], depth = 1;
              for (;;) {
                  var next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.left === null && node.right === null) return depth;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  level = next;
                  depth++;
              }
          };
        `,
        typescript: code`
          function minDepth(root: TreeNode | null): number {
              if (root === null) return 0;
              var level: TreeNode[] = [root];
              var depth = 1;
              while (level.length > 0) {
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.left === null && node.right === null) return depth;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  level = next;
                  depth++;
              }
              return depth;
          }
        `,
        java: code`
          public static int minDepth(TreeNode root) {
              if (root == null) return 0;
              ArrayDeque<TreeNode> queue = new ArrayDeque<>();
              queue.add(root);
              int depth = 1;
              while (!queue.isEmpty()) {
                  for (int k = queue.size(); k > 0; k--) {
                      TreeNode node = queue.poll();
                      if (node.left == null && node.right == null) return depth;
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  depth++;
              }
              return depth;
          }
        `,
        cpp: code`
          int minDepth(TreeNode* root) {
              if (!root) return 0;
              queue<TreeNode*> q;
              q.push(root);
              int depth = 1;
              while (!q.empty()) {
                  for (int k = (int) q.size(); k > 0; k--) {
                      TreeNode* node = q.front();
                      q.pop();
                      if (!node->left && !node->right) return depth;
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  depth++;
              }
              return depth;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          int minDepth(struct TreeNode* root) {
              if (root == NULL) return 0;
              int n = countNodes(root);
              struct TreeNode** q = (struct TreeNode**) malloc((size_t) n * sizeof(struct TreeNode*));
              int head = 0, tail = 0, depth = 1, answer = 0;
              q[tail++] = root;
              while (head < tail && answer == 0) {
                  int end = tail;
                  while (head < end) {
                      struct TreeNode* node = q[head++];
                      if (node->left == NULL && node->right == NULL) { answer = depth; break; }
                      if (node->left != NULL) q[tail++] = node->left;
                      if (node->right != NULL) q[tail++] = node->right;
                  }
                  depth++;
              }
              free(q);
              return answer;
          }
        `,
        csharp: code`
          public static int MinDepth(TreeNode root)
          {
              if (root == null) return 0;
              var queue = new Queue<TreeNode>();
              queue.Enqueue(root);
              int depth = 1;
              while (queue.Count > 0)
              {
                  for (int k = queue.Count; k > 0; k--)
                  {
                      TreeNode node = queue.Dequeue();
                      if (node.left == null && node.right == null) return depth;
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  depth++;
              }
              return depth;
          }
        `,
        go: code`
          func minDepth(root *TreeNode) int {
              if root == nil {
                  return 0
              }
              level := []*TreeNode{root}
              depth := 1
              for len(level) > 0 {
                  next := []*TreeNode{}
                  for _, node := range level {
                      if node.Left == nil && node.Right == nil {
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
                  depth++
              }
              return depth
          }
        `,
        kotlin: code`
          fun minDepth(root: TreeNode?): Int {
              if (root == null) return 0
              var level = listOf(root)
              var depth = 1
              while (level.isNotEmpty()) {
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      val l = node.left
                      val r = node.right
                      if (l == null && r == null) return depth
                      if (l != null) next.add(l)
                      if (r != null) next.add(r)
                  }
                  level = next
                  depth++
              }
              return depth
          }
        `,
        swift: code`
          func minDepth(_ root: TreeNode?) -> Int {
              guard let r = root else { return 0 }
              var level = [r]
              var depth = 1
              while !level.isEmpty {
                  var next = [TreeNode]()
                  for node in level {
                      if node.left == nil && node.right == nil { return depth }
                      if let l = node.left { next.append(l) }
                      if let rt = node.right { next.append(rt) }
                  }
                  level = next
                  depth += 1
              }
              return depth
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn minDepth(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut level: Vec<Rc<RefCell<TreeNode>>> = match root {
                  None => return 0,
                  Some(r) => vec![r],
              };
              let mut depth = 1;
              while !level.is_empty() {
                  let mut next = Vec::new();
                  for rc in level.iter() {
                      let node = rc.borrow();
                      if node.left.is_none() && node.right.is_none() {
                          return depth;
                      }
                      if let Some(l) = node.left.clone() {
                          next.push(l);
                      }
                      if let Some(r) = node.right.clone() {
                          next.push(r);
                      }
                  }
                  level = next;
                  depth += 1;
              }
              depth
          }
        `,
        php: code`
          function minDepth($root) {
              if ($root === null) return 0;
              $level = [$root];
              $depth = 1;
              while (count($level) > 0) {
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->left === null && $node->right === null) return $depth;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $level = $next;
                  $depth++;
              }
              return $depth;
          }
        `,
        ruby: code`
          def minDepth(root)
            return 0 if root.nil?
            level = [root]
            depth = 1
            until level.empty?
              nxt = []
              level.each do |node|
                return depth if node.left.nil? && node.right.nil?
                nxt << node.left unless node.left.nil?
                nxt << node.right unless node.right.nil?
              end
              level = nxt
              depth += 1
            end
            depth
          end
        `,
      },
    };
  })(),

  // ── Balanced Binary Tree (LC 110) ───────────────────────────────
  (() => {
    const ref = (root: TNode | null): boolean =>
      !root || (Math.abs(heightT(root.left) - heightT(root.right)) <= 1 && ref(root.left) && ref(root.right));
    return {
      slug: "balanced-binary-tree",
      title: "Balanced Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Microsoft", "Bloomberg"],
      signature: { funcName: "isBalanced", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, return `true` if it is **height-balanced** and `false` otherwise.\n\nA tree is height-balanced when, **at every node**, the heights of the left and right subtrees differ by at most one. The height of an empty subtree is `0`.",
        [
          { in: "root = [3,9,20,null,null,15,7]", out: "true", note: "At the root the subtrees have heights 1 and 2; every other node is also within one." },
          { in: "root = [1,2,2,3,3,null,null,4,4]", out: "false", note: "At the root the left subtree has height 3 and the right one height 1." },
          { in: "root = []", out: "true" },
        ],
        ["The number of nodes in the tree is in the range [0, 5000]", "-10^4 <= Node.val <= 10^4"]),
      hints: [
        "Checking the root alone is not enough — the condition must hold at every node.",
        "Calling a height function at every node works but recomputes heights over and over: O(n^2) on a chain.",
        "Compute heights bottom-up and let the helper return a sentinel such as -1 as soon as any subtree is unbalanced.",
      ],
      editorial: explain({
        idea: "One post-order walk can compute every subtree's height and check balance at the same time: a helper returns a node's height, or `-1` if anything below it is already unbalanced, and the `-1` propagates straight up.",
        steps: [
          "`check(null) = 0`.",
          "For a node, compute `l = check(left)`; if it is -1 return -1. Do the same for `r`.",
          "If `|l - r| > 1` return -1.",
          "Otherwise return `1 + max(l, r)`.",
          "The tree is balanced when `check(root) != -1`.",
        ],
        why: "Every node's balance condition is tested exactly when both of its subtree heights are known, so every node is checked, and a single failure anywhere forces -1 all the way to the root. Heights are each computed once, instead of once per ancestor.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "Comparing only the root's two subtree heights accepts trees like `[1,2,2,3,null,null,3,4,null,null,4]` that are unbalanced lower down.",
          "The top-down version (height at every node) is O(n^2) on skewed trees.",
          "An empty tree is balanced.",
        ],
      }),
      examples: [
        { input: T([3, 9, 20, null, null, 15, 7]), expectedOutput: "true" },
        { input: T([1, 2, 2, 3, 3, null, null, 4, 4]), expectedOutput: "false" },
        { input: "[]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = treeSize(rng);
        const r = rng();
        let t: TNode | null;
        if (r < 0.45) t = evenTree(rng, n, -10000, 10000);
        else if (r < 0.65) {
          // a balanced tree with one leaf grown two levels deeper — sometimes still balanced, often not
          t = evenTree(rng, n, -10000, 10000);
          const ns = nodesOf(t).filter((x) => !x.left || !x.right);
          if (ns.length) {
            const x = ns[ri(rng, 0, ns.length - 1)];
            const add: TNode = { val: ri(rng, -10000, 10000), left: rng() < 0.5 ? { val: 1, left: null, right: null } : null, right: null };
            if (!x.left) x.left = add; else x.right = add;
          }
        } else t = randTree(rng, n, -10000, 10000);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isBalanced(root: Optional[TreeNode]) -> bool:
              def check(node):
                  if node is None:
                      return 0
                  l = check(node.left)
                  if l < 0:
                      return -1
                  r = check(node.right)
                  if r < 0 or abs(l - r) > 1:
                      return -1
                  return 1 + max(l, r)

              return check(root) >= 0
        `,
        javascript: code`
          var isBalanced = function(root) {
              return balancedHeight(root) >= 0;
          };

          var balancedHeight = function(node) {
              if (node === null) return 0;
              var l = balancedHeight(node.left);
              if (l < 0) return -1;
              var r = balancedHeight(node.right);
              if (r < 0 || Math.abs(l - r) > 1) return -1;
              return 1 + Math.max(l, r);
          };
        `,
        typescript: code`
          function isBalanced(root: TreeNode | null): boolean {
              return balancedHeight(root) >= 0;
          }

          function balancedHeight(node: TreeNode | null): number {
              if (node === null) return 0;
              var l = balancedHeight(node.left);
              if (l < 0) return -1;
              var r = balancedHeight(node.right);
              if (r < 0 || Math.abs(l - r) > 1) return -1;
              return 1 + Math.max(l, r);
          }
        `,
        java: code`
          public static boolean isBalanced(TreeNode root) {
              return balancedHeight(root) >= 0;
          }

          static int balancedHeight(TreeNode node) {
              if (node == null) return 0;
              int l = balancedHeight(node.left);
              if (l < 0) return -1;
              int r = balancedHeight(node.right);
              if (r < 0 || Math.abs(l - r) > 1) return -1;
              return 1 + Math.max(l, r);
          }
        `,
        cpp: code`
          int balancedHeight(TreeNode* node) {
              if (!node) return 0;
              int l = balancedHeight(node->left);
              if (l < 0) return -1;
              int r = balancedHeight(node->right);
              if (r < 0 || abs(l - r) > 1) return -1;
              return 1 + max(l, r);
          }

          bool isBalanced(TreeNode* root) {
              return balancedHeight(root) >= 0;
          }
        `,
        c: code`
          static int balancedHeight(struct TreeNode* node) {
              if (node == NULL) return 0;
              int l = balancedHeight(node->left);
              if (l < 0) return -1;
              int r = balancedHeight(node->right);
              if (r < 0 || l - r > 1 || r - l > 1) return -1;
              return 1 + (l > r ? l : r);
          }

          bool isBalanced(struct TreeNode* root) {
              return balancedHeight(root) >= 0;
          }
        `,
        csharp: code`
          public static bool IsBalanced(TreeNode root)
          {
              return BalancedHeight(root) >= 0;
          }

          static int BalancedHeight(TreeNode node)
          {
              if (node == null) return 0;
              int l = BalancedHeight(node.left);
              if (l < 0) return -1;
              int r = BalancedHeight(node.right);
              if (r < 0 || Math.Abs(l - r) > 1) return -1;
              return 1 + Math.Max(l, r);
          }
        `,
        go: code`
          func isBalanced(root *TreeNode) bool {
              return balancedHeight(root) >= 0
          }

          func balancedHeight(node *TreeNode) int {
              if node == nil {
                  return 0
              }
              l := balancedHeight(node.Left)
              if l < 0 {
                  return -1
              }
              r := balancedHeight(node.Right)
              if r < 0 || l-r > 1 || r-l > 1 {
                  return -1
              }
              if l > r {
                  return 1 + l
              }
              return 1 + r
          }
        `,
        kotlin: code`
          fun isBalanced(root: TreeNode?): Boolean {
              return balancedHeight(root) >= 0
          }

          fun balancedHeight(node: TreeNode?): Int {
              if (node == null) return 0
              val l = balancedHeight(node.left)
              if (l < 0) return -1
              val r = balancedHeight(node.right)
              if (r < 0 || Math.abs(l - r) > 1) return -1
              return 1 + maxOf(l, r)
          }
        `,
        swift: code`
          func isBalanced(_ root: TreeNode?) -> Bool {
              return balancedHeight(root) >= 0
          }

          func balancedHeight(_ node: TreeNode?) -> Int {
              guard let n = node else { return 0 }
              let l = balancedHeight(n.left)
              if l < 0 { return -1 }
              let r = balancedHeight(n.right)
              if r < 0 || abs(l - r) > 1 { return -1 }
              return 1 + max(l, r)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isBalanced(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              balanced_height(&root) >= 0
          }

          fn balanced_height(node: &Option<Rc<RefCell<TreeNode>>>) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let l = balanced_height(&n.left);
                      if l < 0 {
                          return -1;
                      }
                      let r = balanced_height(&n.right);
                      if r < 0 || (l - r).abs() > 1 {
                          return -1;
                      }
                      1 + l.max(r)
                  }
              }
          }
        `,
        php: code`
          function isBalanced($root) {
              return balancedHeight($root) >= 0;
          }

          function balancedHeight($node) {
              if ($node === null) return 0;
              $l = balancedHeight($node->left);
              if ($l < 0) return -1;
              $r = balancedHeight($node->right);
              if ($r < 0 || abs($l - $r) > 1) return -1;
              return 1 + max($l, $r);
          }
        `,
        ruby: code`
          def isBalanced(root)
            balanced_height(root) >= 0
          end

          def balanced_height(node)
            return 0 if node.nil?
            l = balanced_height(node.left)
            return -1 if l < 0
            r = balanced_height(node.right)
            return -1 if r < 0 || (l - r).abs > 1
            1 + [l, r].max
          end
        `,
      },
    };
  })(),

  // ── Path Sum (LC 112) ───────────────────────────────────────────
  (() => {
    const leafSums = (root: TNode | null): number[] => {
      const out: number[] = [];
      const walk = (n: TNode | null, s: number) => {
        if (!n) return;
        const t = s + n.val;
        if (!n.left && !n.right) out.push(t);
        walk(n.left, t); walk(n.right, t);
      };
      walk(root, 0);
      return out;
    };
    const ref = (root: TNode | null, targetSum: number) => leafSums(root).includes(targetSum);
    return {
      slug: "path-sum",
      title: "Path Sum",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Microsoft", "Meta"],
      signature: {
        funcName: "hasPathSum",
        params: [{ name: "root", type: "TreeNode" as const }, { name: "targetSum", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given the `root` of a binary tree and an integer `targetSum`, return `true` if some path from the root down to a **leaf** has node values adding up to exactly `targetSum`, and `false` otherwise. A leaf is a node with no children; an empty tree has no paths.",
        [
          { in: "root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22", out: "true", note: "The path 5 → 4 → 11 → 2 sums to 22." },
          { in: "root = [1,2,3], targetSum = 5", out: "false", note: "The two root-to-leaf paths sum to 3 and 4." },
          { in: "root = [], targetSum = 0", out: "false", note: "An empty tree has no root-to-leaf path at all, not even one with sum 0." },
        ],
        ["The number of nodes in the tree is in the range [0, 5000]", "-1000 <= Node.val <= 1000", "-1000 <= targetSum <= 1000"]),
      hints: [
        "Walking down from the root, keep track of how much of the target is still left.",
        "Subtract each node's value as you descend; at a leaf, check whether exactly zero remains.",
        "The path must end at a leaf — a node with one child is not an end point. Values may be negative, so you cannot stop early when the running sum passes the target.",
      ],
      editorial: explain({
        idea: "Carry the remaining target down the tree. At a leaf the path is complete, and it qualifies exactly when the remainder equals the leaf's value.",
        steps: [
          "If `root` is null, return `false`.",
          "Let `rest = targetSum - root.val`.",
          "If `root` is a leaf, return `rest == 0`.",
          "Otherwise return `hasPathSum(root.left, rest) || hasPathSum(root.right, rest)`.",
        ],
        why: "Every root-to-leaf path is followed by exactly one chain of recursive calls, and along that chain `rest` equals the target minus the values seen so far. The null base case returns `false`, so a node with one child cannot end a path through its missing side.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "Returning `targetSum == 0` at a null child lets a one-child node count as a leaf.",
          "Negative values mean partial sums can overshoot and come back — no pruning on sign.",
          "An empty tree with `targetSum = 0` is `false`.",
        ],
      }),
      examples: [
        { input: `${T([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1])}\n22`, expectedOutput: "true" },
        { input: `${T([1, 2, 3])}\n5`, expectedOutput: "false" },
        { input: "[]\n0", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [3, 10, 25]);
        const t = anyTree(rng, treeSize(rng), -span, span);
        const sums = leafSums(t);
        let target: number;
        if (sums.length && rng() < 0.5) target = pick(rng, sums);
        else if (sums.length && rng() < 0.5) target = pick(rng, sums) + pick(rng, [-1, 1]);
        else target = ri(rng, -60, 60);
        return { input: `${fmtTree(t)}\n${target}`, expectedOutput: String(ref(t, target)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def hasPathSum(root: Optional[TreeNode], targetSum: int) -> bool:
              if root is None:
                  return False
              rest = targetSum - root.val
              if root.left is None and root.right is None:
                  return rest == 0
              return hasPathSum(root.left, rest) or hasPathSum(root.right, rest)
        `,
        javascript: code`
          var hasPathSum = function(root, targetSum) {
              if (root === null) return false;
              var rest = targetSum - root.val;
              if (root.left === null && root.right === null) return rest === 0;
              return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
          };
        `,
        typescript: code`
          function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
              if (root === null) return false;
              var rest = targetSum - root.val;
              if (root.left === null && root.right === null) return rest === 0;
              return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
          }
        `,
        java: code`
          public static boolean hasPathSum(TreeNode root, int targetSum) {
              if (root == null) return false;
              int rest = targetSum - root.val;
              if (root.left == null && root.right == null) return rest == 0;
              return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
          }
        `,
        cpp: code`
          bool hasPathSum(TreeNode* root, int targetSum) {
              if (!root) return false;
              int rest = targetSum - root->val;
              if (!root->left && !root->right) return rest == 0;
              return hasPathSum(root->left, rest) || hasPathSum(root->right, rest);
          }
        `,
        c: code`
          bool hasPathSum(struct TreeNode* root, int targetSum) {
              if (root == NULL) return false;
              int rest = targetSum - root->val;
              if (root->left == NULL && root->right == NULL) return rest == 0;
              return hasPathSum(root->left, rest) || hasPathSum(root->right, rest);
          }
        `,
        csharp: code`
          public static bool HasPathSum(TreeNode root, int targetSum)
          {
              if (root == null) return false;
              int rest = targetSum - root.val;
              if (root.left == null && root.right == null) return rest == 0;
              return HasPathSum(root.left, rest) || HasPathSum(root.right, rest);
          }
        `,
        go: code`
          func hasPathSum(root *TreeNode, targetSum int) bool {
              if root == nil {
                  return false
              }
              rest := targetSum - root.Val
              if root.Left == nil && root.Right == nil {
                  return rest == 0
              }
              return hasPathSum(root.Left, rest) || hasPathSum(root.Right, rest)
          }
        `,
        kotlin: kt(code`
          fun hasPathSum(root: TreeNode?, targetSum: Int): Boolean {
              if (root == null) return false
              val rest = targetSum - root.@val
              if (root.left == null && root.right == null) return rest == 0
              return hasPathSum(root.left, rest) || hasPathSum(root.right, rest)
          }
        `),
        swift: code`
          func hasPathSum(_ root: TreeNode?, _ targetSum: Int) -> Bool {
              guard let r = root else { return false }
              let rest = targetSum - r.val
              if r.left == nil && r.right == nil { return rest == 0 }
              return hasPathSum(r.left, rest) || hasPathSum(r.right, rest)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn hasPathSum(root: Option<Rc<RefCell<TreeNode>>>, targetSum: i32) -> bool {
              path_from(&root, targetSum)
          }

          fn path_from(node: &Option<Rc<RefCell<TreeNode>>>, target: i32) -> bool {
              match node {
                  None => false,
                  Some(rc) => {
                      let n = rc.borrow();
                      let rest = target - n.val;
                      if n.left.is_none() && n.right.is_none() {
                          return rest == 0;
                      }
                      path_from(&n.left, rest) || path_from(&n.right, rest)
                  }
              }
          }
        `,
        php: code`
          function hasPathSum($root, $targetSum) {
              if ($root === null) return false;
              $rest = $targetSum - $root->val;
              if ($root->left === null && $root->right === null) return $rest == 0;
              return hasPathSum($root->left, $rest) || hasPathSum($root->right, $rest);
          }
        `,
        ruby: code`
          def hasPathSum(root, targetSum)
            return false if root.nil?
            rest = targetSum - root.val
            return rest == 0 if root.left.nil? && root.right.nil?
            hasPathSum(root.left, rest) || hasPathSum(root.right, rest)
          end
        `,
      },
    };
  })(),

  // ── Invert Binary Tree (LC 226) ─────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => mirrorT(root);
    return {
      slug: "invert-binary-tree",
      title: "Invert Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "invertTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree, **invert** it — swap the left and right children of every node, producing the tree's mirror image — and return its root.",
        [
          { in: "root = [4,2,7,1,3,6,9]", out: "[4,7,2,9,6,3,1]", note: "Every level now reads right to left." },
          { in: "root = [2,1]", out: "[2,null,1]", note: "The single left child becomes a right child." },
          { in: "root = []", out: "[]" },
        ],
        ["The number of nodes in the tree is in the range [0, 100]", "-100 <= Node.val <= 100"]),
      hints: [
        "Inverting a tree means inverting both subtrees and then swapping them.",
        "Write it as a recursion whose base case is the empty tree.",
        "Any traversal order works as long as every node has its two child pointers swapped exactly once — a BFS queue does it iteratively.",
      ],
      editorial: explain({
        idea: "The mirror of a tree is its root with the mirror of the right subtree on the left and the mirror of the left subtree on the right. Swapping the two child pointers at every node, in any order, builds exactly that.",
        steps: [
          "If `root` is null, return null.",
          "Invert the left and right subtrees recursively.",
          "Assign the inverted right subtree to `root.left` and the inverted left subtree to `root.right`.",
          "Return `root`.",
        ],
        why: "By induction on height: the recursive calls return mirrored subtrees, and placing them on the opposite sides mirrors the whole tree. Each node is visited once and its pointers swapped once, so nothing is swapped back.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "Overwriting `root.left` before saving it loses the left subtree — keep one side in a temporary.",
          "Swapping a node's pointers twice (for example, once on the way down and once on the way up) undoes the inversion.",
        ],
      }),
      examples: [
        { input: T([4, 2, 7, 1, 3, 6, 9]), expectedOutput: "[4,7,2,9,6,3,1]" },
        { input: T([2, 1]), expectedOutput: "[2,null,1]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng), -100, 100);
        return { input: fmtTree(t), expectedOutput: fmtTree(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def invertTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
              if root is None:
                  return None
              root.left, root.right = invertTree(root.right), invertTree(root.left)
              return root
        `,
        javascript: code`
          var invertTree = function(root) {
              if (root === null) return null;
              var l = invertTree(root.left);
              root.left = invertTree(root.right);
              root.right = l;
              return root;
          };
        `,
        typescript: code`
          function invertTree(root: TreeNode | null): TreeNode | null {
              if (root === null) return null;
              var l = invertTree(root.left);
              root.left = invertTree(root.right);
              root.right = l;
              return root;
          }
        `,
        java: code`
          public static TreeNode invertTree(TreeNode root) {
              if (root == null) return null;
              TreeNode l = invertTree(root.left);
              root.left = invertTree(root.right);
              root.right = l;
              return root;
          }
        `,
        cpp: code`
          TreeNode* invertTree(TreeNode* root) {
              if (!root) return nullptr;
              TreeNode* l = invertTree(root->left);
              root->left = invertTree(root->right);
              root->right = l;
              return root;
          }
        `,
        c: code`
          struct TreeNode* invertTree(struct TreeNode* root) {
              if (root == NULL) return NULL;
              struct TreeNode* l = invertTree(root->left);
              root->left = invertTree(root->right);
              root->right = l;
              return root;
          }
        `,
        csharp: code`
          public static TreeNode InvertTree(TreeNode root)
          {
              if (root == null) return null;
              TreeNode l = InvertTree(root.left);
              root.left = InvertTree(root.right);
              root.right = l;
              return root;
          }
        `,
        go: code`
          func invertTree(root *TreeNode) *TreeNode {
              if root == nil {
                  return nil
              }
              root.Left, root.Right = invertTree(root.Right), invertTree(root.Left)
              return root
          }
        `,
        kotlin: code`
          fun invertTree(root: TreeNode?): TreeNode? {
              if (root == null) return null
              val l = invertTree(root.left)
              root.left = invertTree(root.right)
              root.right = l
              return root
          }
        `,
        swift: code`
          func invertTree(_ root: TreeNode?) -> TreeNode? {
              guard let r = root else { return nil }
              let l = invertTree(r.left)
              r.left = invertTree(r.right)
              r.right = l
              return r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn invertTree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              if let Some(n) = root.clone() {
                  let l = n.borrow_mut().left.take();
                  let r = n.borrow_mut().right.take();
                  n.borrow_mut().left = invertTree(r);
                  n.borrow_mut().right = invertTree(l);
              }
              root
          }
        `,
        php: code`
          function invertTree($root) {
              if ($root === null) return null;
              $l = $root->left;
              $root->left = invertTree($root->right);
              $root->right = invertTree($l);
              return $root;
          }
        `,
        ruby: code`
          def invertTree(root)
            return nil if root.nil?
            root.left, root.right = invertTree(root.right), invertTree(root.left)
            root
          end
        `,
      },
    };
  })(),


  // ── Binary Tree Paths (LC 257) ──────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const out: string[] = [];
      const walk = (n: TNode, path: number[]) => {
        path.push(n.val);
        if (!n.left && !n.right) out.push(path.join("->"));
        if (n.left) walk(n.left, path);
        if (n.right) walk(n.right, path);
        path.pop();
      };
      if (root) walk(root, []);
      return out;
    };
    return {
      slug: "binary-tree-paths",
      title: "Binary Tree Paths",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Backtracking", "String", "Google", "Meta", "Amazon"],
      signature: { funcName: "binaryTreePaths", params: [{ name: "root", type: "TreeNode" as const }], returns: "string[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return every path from the root to a **leaf** (a node with no children). Write each path as its node values joined by `\"->\"`, for example `\"1->2->5\"`.\n\nList the paths in the left-to-right order of their leaves — the order a depth-first walk that visits left children before right children reaches them.",
        [
          { in: "root = [1,2,3,null,5]", out: "[\"1->2->5\",\"1->3\"]", note: "The leaves are 5 (under 2) and 3; 5 is further left, so its path comes first." },
          { in: "root = [1]", out: "[\"1\"]" },
          { in: "root = [-3,null,4,8,-2]", out: "[\"-3->4->8\",\"-3->4->-2\"]", note: "Negative values keep their minus sign inside the path text." },
        ],
        ["The number of nodes in the tree is in the range [1, 100]", "-100 <= Node.val <= 100"]),
      hints: [
        "A root-to-leaf path is exactly what a depth-first walk holds on its call stack when it reaches a leaf.",
        "Carry the current path down — as a list of values or as the string built so far — and record it at each leaf.",
        "Visiting the left child before the right one produces the leaves, and so the paths, in the required left-to-right order.",
      ],
      editorial: explain({
        idea: "Depth-first search from the root, keeping the values on the way down. Each time the walk stands on a leaf, the values it holds form one complete path; visiting left before right emits the paths in left-to-right leaf order.",
        steps: [
          "Start a DFS at the root with an empty path.",
          "On entering a node, append its value to the path.",
          "If the node is a leaf, join the path with `\"->\"` and add it to the answer.",
          "Recurse into the left child, then the right child, then remove the node's value again (backtrack).",
        ],
        why: "Each leaf is reached exactly once, and at that moment the path holds precisely the nodes from the root to it — every node appended on the way down has not yet been popped, and every finished branch has been. A preorder walk with left before right reaches leaves from left to right.",
        time: "O(n · h) — each of up to n/2 leaves copies a path of length up to h",
        space: "O(h) for the recursion and the current path, plus the output",
        pitfalls: [
          "Only leaves end a path; a node with one child must not emit one.",
          "Forgetting to pop the value after the recursive calls leaks one branch's nodes into the next path.",
          "A single-node tree has the one path `\"<value>\"` with no arrow.",
        ],
      }),
      examples: [
        { input: T([1, 2, 3, null, 5]), expectedOutput: fmtStrArr(["1->2->5", "1->3"]) },
        { input: T([1]), expectedOutput: fmtStrArr(["1"]) },
        { input: T([-3, null, 4, 8, -2]), expectedOutput: fmtStrArr(["-3->4->8", "-3->4->-2"]) },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng, 1), -100, 100);
        return { input: fmtTree(t), expectedOutput: fmtStrArr(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def binaryTreePaths(root: Optional[TreeNode]) -> List[str]:
              out = []
              path = []

              def walk(node):
                  path.append(str(node.val))
                  if node.left is None and node.right is None:
                      out.append("->".join(path))
                  if node.left is not None:
                      walk(node.left)
                  if node.right is not None:
                      walk(node.right)
                  path.pop()

              if root is not None:
                  walk(root)
              return out
        `,
        javascript: code`
          var binaryTreePaths = function(root) {
              var out = [];
              if (root !== null) pathWalk(root, [], out);
              return out;
          };

          var pathWalk = function(node, path, out) {
              path.push(node.val);
              if (node.left === null && node.right === null) out.push(path.join("->"));
              if (node.left !== null) pathWalk(node.left, path, out);
              if (node.right !== null) pathWalk(node.right, path, out);
              path.pop();
          };
        `,
        typescript: code`
          function binaryTreePaths(root: TreeNode | null): string[] {
              var out: string[] = [];
              if (root !== null) pathWalk(root, [], out);
              return out;
          }

          function pathWalk(node: TreeNode, path: number[], out: string[]): void {
              path.push(node.val);
              if (node.left === null && node.right === null) out.push(path.join("->"));
              if (node.left !== null) pathWalk(node.left, path, out);
              if (node.right !== null) pathWalk(node.right, path, out);
              path.pop();
          }
        `,
        java: code`
          public static String[] binaryTreePaths(TreeNode root) {
              List<String> out = new ArrayList<>();
              if (root != null) pathWalk(root, new ArrayList<Integer>(), out);
              return out.toArray(new String[0]);
          }

          static void pathWalk(TreeNode node, List<Integer> path, List<String> out) {
              path.add(node.val);
              if (node.left == null && node.right == null) {
                  StringBuilder sb = new StringBuilder();
                  for (int i = 0; i < path.size(); i++) {
                      if (i > 0) sb.append("->");
                      sb.append(path.get(i));
                  }
                  out.add(sb.toString());
              }
              if (node.left != null) pathWalk(node.left, path, out);
              if (node.right != null) pathWalk(node.right, path, out);
              path.remove(path.size() - 1);
          }
        `,
        cpp: code`
          void pathWalk(TreeNode* node, vector<int>& path, vector<string>& out) {
              path.push_back(node->val);
              if (!node->left && !node->right) {
                  string s;
                  for (size_t i = 0; i < path.size(); i++) {
                      if (i > 0) s += "->";
                      s += to_string(path[i]);
                  }
                  out.push_back(s);
              }
              if (node->left) pathWalk(node->left, path, out);
              if (node->right) pathWalk(node->right, path, out);
              path.pop_back();
          }

          vector<string> binaryTreePaths(TreeNode* root) {
              vector<string> out;
              vector<int> path;
              if (root) pathWalk(root, path, out);
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          static void pathWalk(struct TreeNode* node, int* path, int depth, char** out, int* k) {
              path[depth] = node->val;
              if (node->left == NULL && node->right == NULL) {
                  char* s = (char*) malloc((size_t) (depth + 1) * 16 + 1);
                  int pos = 0;
                  for (int i = 0; i <= depth; i++) {
                      if (i > 0) { s[pos++] = '-'; s[pos++] = '>'; }
                      pos += sprintf(s + pos, "%d", path[i]);
                  }
                  s[pos] = '\0';
                  out[(*k)++] = s;
              }
              if (node->left != NULL) pathWalk(node->left, path, depth + 1, out, k);
              if (node->right != NULL) pathWalk(node->right, path, depth + 1, out, k);
          }

          char** binaryTreePaths(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              char** out = (char**) malloc((size_t) (n + 1) * sizeof(char*));
              int* path = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int k = 0;
              if (root != NULL) pathWalk(root, path, 0, out, &k);
              free(path);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static string[] BinaryTreePaths(TreeNode root)
          {
              var output = new List<string>();
              if (root != null) PathWalk(root, new List<int>(), output);
              return output.ToArray();
          }

          static void PathWalk(TreeNode node, List<int> path, List<string> output)
          {
              path.Add(node.val);
              if (node.left == null && node.right == null) output.Add(string.Join("->", path));
              if (node.left != null) PathWalk(node.left, path, output);
              if (node.right != null) PathWalk(node.right, path, output);
              path.RemoveAt(path.Count - 1);
          }
        `,
        go: code`
          func binaryTreePaths(root *TreeNode) []string {
              out := []string{}
              path := []string{}
              var walk func(node *TreeNode)
              walk = func(node *TreeNode) {
                  path = append(path, fmt.Sprint(node.Val))
                  if node.Left == nil && node.Right == nil {
                      out = append(out, strings.Join(path, "->"))
                  }
                  if node.Left != nil {
                      walk(node.Left)
                  }
                  if node.Right != nil {
                      walk(node.Right)
                  }
                  path = path[:len(path)-1]
              }
              if root != nil {
                  walk(root)
              }
              return out
          }
        `,
        kotlin: kt(code`
          fun binaryTreePaths(root: TreeNode?): Array<String> {
              val out = ArrayList<String>()
              if (root != null) pathWalk(root, ArrayList<Int>(), out)
              return out.toTypedArray()
          }

          fun pathWalk(node: TreeNode, path: ArrayList<Int>, out: ArrayList<String>) {
              path.add(node.@val)
              val l = node.left
              val r = node.right
              if (l == null && r == null) out.add(path.joinToString("->"))
              if (l != null) pathWalk(l, path, out)
              if (r != null) pathWalk(r, path, out)
              path.removeAt(path.size - 1)
          }
        `),
        swift: code`
          func binaryTreePaths(_ root: TreeNode?) -> [String] {
              var out = [String]()
              var path = [Int]()
              if let r = root { pathWalk(r, &path, &out) }
              return out
          }

          func pathWalk(_ node: TreeNode, _ path: inout [Int], _ out: inout [String]) {
              path.append(node.val)
              if node.left == nil && node.right == nil {
                  out.append(path.map { String($0) }.joined(separator: "->"))
              }
              if let l = node.left { pathWalk(l, &path, &out) }
              if let r = node.right { pathWalk(r, &path, &out) }
              path.removeLast()
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn binaryTreePaths(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<String> {
              let mut out = Vec::new();
              let mut path: Vec<String> = Vec::new();
              path_walk(&root, &mut path, &mut out);
              out
          }

          fn path_walk(node: &Option<Rc<RefCell<TreeNode>>>, path: &mut Vec<String>, out: &mut Vec<String>) {
              if let Some(rc) = node {
                  let n = rc.borrow();
                  path.push(n.val.to_string());
                  if n.left.is_none() && n.right.is_none() {
                      out.push(path.join("->"));
                  }
                  path_walk(&n.left, path, out);
                  path_walk(&n.right, path, out);
                  path.pop();
              }
          }
        `,
        php: code`
          function binaryTreePaths($root) {
              $out = [];
              $path = [];
              if ($root !== null) pathWalk($root, $path, $out);
              return $out;
          }

          function pathWalk($node, &$path, &$out) {
              $path[] = $node->val;
              if ($node->left === null && $node->right === null) $out[] = implode("->", $path);
              if ($node->left !== null) pathWalk($node->left, $path, $out);
              if ($node->right !== null) pathWalk($node->right, $path, $out);
              array_pop($path);
          }
        `,
        ruby: code`
          def binaryTreePaths(root)
            out = []
            path_walk(root, [], out) unless root.nil?
            out
          end

          def path_walk(node, path, out)
            path << node.val
            out << path.join("->") if node.left.nil? && node.right.nil?
            path_walk(node.left, path, out) unless node.left.nil?
            path_walk(node.right, path, out) unless node.right.nil?
            path.pop
          end
        `,
      },
    };
  })(),

  // ── Sum of Left Leaves (LC 404) ─────────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let s = 0;
      for (const n of nodesOf(root)) if (n.left && !n.left.left && !n.left.right) s += n.left.val;
      return s;
    };
    return {
      slug: "sum-of-left-leaves",
      title: "Sum of Left Leaves",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Adobe", "Bloomberg"],
      signature: { funcName: "sumOfLeftLeaves", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the sum of all its **left leaves**.\n\nA leaf is a node with no children; a left leaf is a leaf that is the **left child** of its parent. The root itself is never a left leaf.",
        [
          { in: "root = [3,9,20,null,null,15,7]", out: "24", note: "The left leaves are 9 and 15; 7 is a right leaf and does not count." },
          { in: "root = [1]", out: "0", note: "The root has no parent, so it is not a left leaf." },
          { in: "root = [1,2,3,4,5]", out: "4", note: "2 is a left child but not a leaf; its left child 4 is the only left leaf." },
        ],
        ["The number of nodes in the tree is in the range [1, 1000]", "-1000 <= Node.val <= 1000"]),
      hints: [
        "Whether a node is a left leaf depends on its parent, so decide it while standing on the parent.",
        "At a node, look at its left child: if that child exists and has no children, add its value.",
        "Otherwise keep walking into both subtrees — left leaves can sit under right children too.",
      ],
      editorial: explain({
        idea: "A node is a left leaf when its parent reached it through a left pointer and it has no children. Checking from the parent's side makes that test local: at every node, inspect `node.left`.",
        steps: [
          "If `root` is null, return 0.",
          "If `root.left` exists and is a leaf, count `root.left.val`; otherwise recurse into `root.left`.",
          "Recurse into `root.right` and add its result.",
        ],
        why: "Every left leaf has exactly one parent, and the walk visits every non-leaf node, so each left leaf is counted exactly once — at its parent. Right leaves are never added because only `.left` children are tested.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "A single-node tree answers 0: the root is not a left leaf.",
          "A left child that has children is not a leaf — descend into it instead.",
          "Values can be negative; the sum can be negative too.",
        ],
      }),
      examples: [
        { input: T([3, 9, 20, null, null, 15, 7]), expectedOutput: "24" },
        { input: T([1]), expectedOutput: "0" },
        { input: T([1, 2, 3, 4, 5]), expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng, 1), -1000, 1000);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sumOfLeftLeaves(root: Optional[TreeNode]) -> int:
              if root is None:
                  return 0
              total = 0
              left = root.left
              if left is not None and left.left is None and left.right is None:
                  total += left.val
              else:
                  total += sumOfLeftLeaves(left)
              return total + sumOfLeftLeaves(root.right)
        `,
        javascript: code`
          var sumOfLeftLeaves = function(root) {
              if (root === null) return 0;
              var total = 0, left = root.left;
              if (left !== null && left.left === null && left.right === null) total += left.val;
              else total += sumOfLeftLeaves(left);
              return total + sumOfLeftLeaves(root.right);
          };
        `,
        typescript: code`
          function sumOfLeftLeaves(root: TreeNode | null): number {
              if (root === null) return 0;
              var total = 0;
              var left = root.left;
              if (left !== null && left.left === null && left.right === null) total += left.val;
              else total += sumOfLeftLeaves(left);
              return total + sumOfLeftLeaves(root.right);
          }
        `,
        java: code`
          public static int sumOfLeftLeaves(TreeNode root) {
              if (root == null) return 0;
              int total = 0;
              TreeNode left = root.left;
              if (left != null && left.left == null && left.right == null) total += left.val;
              else total += sumOfLeftLeaves(left);
              return total + sumOfLeftLeaves(root.right);
          }
        `,
        cpp: code`
          int sumOfLeftLeaves(TreeNode* root) {
              if (!root) return 0;
              int total = 0;
              TreeNode* left = root->left;
              if (left && !left->left && !left->right) total += left->val;
              else total += sumOfLeftLeaves(left);
              return total + sumOfLeftLeaves(root->right);
          }
        `,
        c: code`
          int sumOfLeftLeaves(struct TreeNode* root) {
              if (root == NULL) return 0;
              int total = 0;
              struct TreeNode* left = root->left;
              if (left != NULL && left->left == NULL && left->right == NULL) total += left->val;
              else total += sumOfLeftLeaves(left);
              return total + sumOfLeftLeaves(root->right);
          }
        `,
        csharp: code`
          public static int SumOfLeftLeaves(TreeNode root)
          {
              if (root == null) return 0;
              int total = 0;
              TreeNode left = root.left;
              if (left != null && left.left == null && left.right == null) total += left.val;
              else total += SumOfLeftLeaves(left);
              return total + SumOfLeftLeaves(root.right);
          }
        `,
        go: code`
          func sumOfLeftLeaves(root *TreeNode) int {
              if root == nil {
                  return 0
              }
              total := 0
              left := root.Left
              if left != nil && left.Left == nil && left.Right == nil {
                  total += left.Val
              } else {
                  total += sumOfLeftLeaves(left)
              }
              return total + sumOfLeftLeaves(root.Right)
          }
        `,
        kotlin: kt(code`
          fun sumOfLeftLeaves(root: TreeNode?): Int {
              if (root == null) return 0
              var total = 0
              val left = root.left
              if (left != null && left.left == null && left.right == null) total += left.@val
              else total += sumOfLeftLeaves(left)
              return total + sumOfLeftLeaves(root.right)
          }
        `),
        swift: code`
          func sumOfLeftLeaves(_ root: TreeNode?) -> Int {
              guard let r = root else { return 0 }
              var total = 0
              if let l = r.left, l.left == nil, l.right == nil {
                  total += l.val
              } else {
                  total += sumOfLeftLeaves(r.left)
              }
              return total + sumOfLeftLeaves(r.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sumOfLeftLeaves(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              left_leaves(&root)
          }

          fn left_leaves(node: &Option<Rc<RefCell<TreeNode>>>) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let mut total = 0;
                      let mut leaf = false;
                      if let Some(l) = &n.left {
                          let l = l.borrow();
                          if l.left.is_none() && l.right.is_none() {
                              total += l.val;
                              leaf = true;
                          }
                      }
                      if !leaf {
                          total += left_leaves(&n.left);
                      }
                      total + left_leaves(&n.right)
                  }
              }
          }
        `,
        php: code`
          function sumOfLeftLeaves($root) {
              if ($root === null) return 0;
              $total = 0;
              $left = $root->left;
              if ($left !== null && $left->left === null && $left->right === null) $total += $left->val;
              else $total += sumOfLeftLeaves($left);
              return $total + sumOfLeftLeaves($root->right);
          }
        `,
        ruby: code`
          def sumOfLeftLeaves(root)
            return 0 if root.nil?
            left = root.left
            total = if !left.nil? && left.left.nil? && left.right.nil?
                      left.val
                    else
                      sumOfLeftLeaves(left)
                    end
            total + sumOfLeftLeaves(root.right)
          end
        `,
      },
    };
  })(),

  // ── Find Mode in Binary Search Tree (LC 501) ────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const cnt = new Map<number, number>();
      for (const n of nodesOf(root)) cnt.set(n.val, (cnt.get(n.val) || 0) + 1);
      let best = 0;
      for (const c of cnt.values()) best = Math.max(best, c);
      return [...cnt.keys()].filter((k) => cnt.get(k) === best).sort((a, b) => a - b);
    };
    /** A BST that allows duplicates: an equal value may go either way, keeping left <= node <= right. */
    const dupBST = (rng: Rng, n: number, lo: number, hi: number): TNode | null => {
      let root: TNode | null = null;
      for (let i = 0; i < n; i++) {
        const node: TNode = { val: ri(rng, lo, hi), left: null, right: null };
        if (!root) { root = node; continue; }
        let cur: TNode = root;
        for (;;) {
          const goLeft = node.val < cur.val || (node.val === cur.val && rng() < 0.5);
          const next = goLeft ? cur.left : cur.right;
          if (!next) { if (goLeft) cur.left = node; else cur.right = node; break; }
          cur = next;
        }
      }
      return root;
    };
    return {
      slug: "find-mode-in-binary-search-tree",
      title: "Find Mode in Binary Search Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "findMode", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the `root` of a binary search tree that **may contain duplicate values**. Return all of its **modes** — the values that occur most often — in **ascending order**.\n\nHere a BST satisfies, at every node: every value in the left subtree is `<=` the node's value, and every value in the right subtree is `>=` it.",
        [
          { in: "root = [1,null,2,2]", out: "[2]", note: "2 occurs twice and 1 once." },
          { in: "root = [0]", out: "[0]" },
          { in: "root = [5,3,7,3,5,6,7]", out: "[3,5,7]", note: "3, 5 and 7 each occur twice; 6 once. All three are modes, listed ascending." },
        ],
        ["The number of nodes in the tree is in the range [1, 10^4]", "-10^5 <= Node.val <= 10^5"],
        "Could you do it without a hash map — using no extra space apart from the recursion or traversal stack?"),
      hints: [
        "An inorder walk of a BST visits its values in non-decreasing order, so equal values come out next to each other.",
        "Count the length of each run of equal values as the walk produces them, remembering the longest run so far.",
        "When a run beats the best count, restart the answer with that value; when it ties, append it. Values arrive ascending, so the answer is already sorted.",
      ],
      editorial: explain({
        idea: "Inorder traversal turns the BST into a sorted sequence, where every value's copies form one contiguous run. The modes are the values with the longest runs, found in one pass with a run counter and a best counter — no hash map.",
        steps: [
          "Walk the tree inorder (an explicit stack or recursion).",
          "For each value: if it equals the previous one, increment `count`; otherwise reset `count = 1`.",
          "If `count > best`, set `best = count` and make the answer just `[value]`; if `count == best`, append `value`.",
          "After the walk, the answer holds every mode in ascending order.",
        ],
        why: "With `left <= node <= right` at every node, inorder emits the values in non-decreasing order, so all copies of a value are consecutive and `count` reaches that value's total frequency at its last copy. A value is kept in the answer exactly when that frequency equals the final maximum — any value kept earlier for a smaller `best` is discarded when the answer restarts.",
        time: "O(n)",
        space: "O(h) for the traversal stack, besides the output",
        pitfalls: [
          "Restart the list when `count > best` and append only when `count == best`; a value appended on a tie and then extended simply restarts the list with itself, so it is never listed twice.",
          "Several modes are possible; all of them must be returned.",
          "Do not assume distinct values: this BST allows duplicates on either side.",
        ],
      }),
      examples: [
        { input: T([1, null, 2, 2]), expectedOutput: "[2]" },
        { input: T([0]), expectedOutput: "[0]" },
        { input: T([5, 3, 7, 3, 5, 6, 7]), expectedOutput: "[3,5,7]" },
      ],
      gen: (rng: Rng) => {
        const n = treeSize(rng, 1);
        const span = pick(rng, [0, 2, 5, 15, 100000]);
        const lo = rng() < 0.5 ? -span : ri(rng, -100000, 100000 - span);
        const t = dupBST(rng, n, lo, lo + span);
        return { input: fmtTree(t), expectedOutput: JSON.stringify(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def findMode(root: Optional[TreeNode]) -> List[int]:
              modes = []
              best = count = 0
              prev = None
              stack = []
              cur = root
              while cur is not None or stack:
                  while cur is not None:
                      stack.append(cur)
                      cur = cur.left
                  cur = stack.pop()
                  count = count + 1 if cur.val == prev else 1
                  prev = cur.val
                  if count > best:
                      best = count
                      modes = [cur.val]
                  elif count == best:
                      modes.append(cur.val)
                  cur = cur.right
              return modes
        `,
        javascript: code`
          var findMode = function(root) {
              var modes = [], best = 0, count = 0, prev = null;
              var stack = [], cur = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  count = cur.val === prev ? count + 1 : 1;
                  prev = cur.val;
                  if (count > best) {
                      best = count;
                      modes = [cur.val];
                  } else if (count === best) {
                      modes.push(cur.val);
                  }
                  cur = cur.right;
              }
              return modes;
          };
        `,
        typescript: code`
          function findMode(root: TreeNode | null): number[] {
              var modes: number[] = [];
              var best = 0, count = 0;
              var prev: number | null = null;
              var stack: TreeNode[] = [];
              var cur: TreeNode | null = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  var node = stack.pop() as TreeNode;
                  count = node.val === prev ? count + 1 : 1;
                  prev = node.val;
                  if (count > best) {
                      best = count;
                      modes = [node.val];
                  } else if (count === best) {
                      modes.push(node.val);
                  }
                  cur = node.right;
              }
              return modes;
          }
        `,
        java: code`
          public static int[] findMode(TreeNode root) {
              List<Integer> modes = new ArrayList<>();
              int best = 0, count = 0;
              long prev = Long.MIN_VALUE;
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode cur = root;
              while (cur != null || !stack.isEmpty()) {
                  while (cur != null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  count = cur.val == prev ? count + 1 : 1;
                  prev = cur.val;
                  if (count > best) {
                      best = count;
                      modes.clear();
                      modes.add(cur.val);
                  } else if (count == best) {
                      modes.add(cur.val);
                  }
                  cur = cur.right;
              }
              int[] res = new int[modes.size()];
              for (int i = 0; i < res.length; i++) res[i] = modes.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> findMode(TreeNode* root) {
              vector<int> modes;
              int best = 0, count = 0;
              long long prev = LLONG_MIN;
              vector<TreeNode*> stack;
              TreeNode* cur = root;
              while (cur || !stack.empty()) {
                  while (cur) {
                      stack.push_back(cur);
                      cur = cur->left;
                  }
                  cur = stack.back();
                  stack.pop_back();
                  count = cur->val == prev ? count + 1 : 1;
                  prev = cur->val;
                  if (count > best) {
                      best = count;
                      modes.assign(1, cur->val);
                  } else if (count == best) {
                      modes.push_back(cur->val);
                  }
                  cur = cur->right;
              }
              return modes;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          int* findMode(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* modes = (int*) malloc((size_t) (n + 1) * sizeof(int));
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int k = 0, top = 0, best = 0, count = 0;
              long long prev = -4000000000LL;
              struct TreeNode* cur = root;
              while (cur != NULL || top > 0) {
                  while (cur != NULL) {
                      stack[top++] = cur;
                      cur = cur->left;
                  }
                  cur = stack[--top];
                  count = cur->val == prev ? count + 1 : 1;
                  prev = cur->val;
                  if (count > best) {
                      best = count;
                      k = 0;
                      modes[k++] = cur->val;
                  } else if (count == best) {
                      modes[k++] = cur->val;
                  }
                  cur = cur->right;
              }
              free(stack);
              *returnSize = k;
              return modes;
          }
        `,
        csharp: code`
          public static int[] FindMode(TreeNode root)
          {
              var modes = new List<int>();
              int best = 0, count = 0;
              long prev = long.MinValue;
              var stack = new Stack<TreeNode>();
              TreeNode cur = root;
              while (cur != null || stack.Count > 0)
              {
                  while (cur != null)
                  {
                      stack.Push(cur);
                      cur = cur.left;
                  }
                  cur = stack.Pop();
                  count = cur.val == prev ? count + 1 : 1;
                  prev = cur.val;
                  if (count > best)
                  {
                      best = count;
                      modes.Clear();
                      modes.Add(cur.val);
                  }
                  else if (count == best)
                  {
                      modes.Add(cur.val);
                  }
                  cur = cur.right;
              }
              return modes.ToArray();
          }
        `,
        go: code`
          func findMode(root *TreeNode) []int {
              modes := []int{}
              best, count := 0, 0
              var prev *TreeNode
              stack := []*TreeNode{}
              cur := root
              for cur != nil || len(stack) > 0 {
                  for cur != nil {
                      stack = append(stack, cur)
                      cur = cur.Left
                  }
                  cur = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if prev != nil && prev.Val == cur.Val {
                      count++
                  } else {
                      count = 1
                  }
                  prev = cur
                  if count > best {
                      best = count
                      modes = []int{cur.Val}
                  } else if count == best {
                      modes = append(modes, cur.Val)
                  }
                  cur = cur.Right
              }
              return modes
          }
        `,
        kotlin: kt(code`
          fun findMode(root: TreeNode?): IntArray {
              val modes = ArrayList<Int>()
              var best = 0
              var count = 0
              var prev = Long.MIN_VALUE
              val stack = ArrayList<TreeNode>()
              var cur = root
              while (cur != null || stack.isNotEmpty()) {
                  while (cur != null) {
                      stack.add(cur)
                      cur = cur.left
                  }
                  val node = stack.removeAt(stack.size - 1)
                  val v = node.@val
                  count = if (v.toLong() == prev) count + 1 else 1
                  prev = v.toLong()
                  if (count > best) {
                      best = count
                      modes.clear()
                      modes.add(v)
                  } else if (count == best) {
                      modes.add(v)
                  }
                  cur = node.right
              }
              return modes.toIntArray()
          }
        `),
        swift: code`
          func findMode(_ root: TreeNode?) -> [Int] {
              var modes = [Int]()
              var best = 0, count = 0
              var prev: Int? = nil
              var stack = [TreeNode]()
              var cur = root
              while cur != nil || !stack.isEmpty {
                  while let c = cur {
                      stack.append(c)
                      cur = c.left
                  }
                  let node = stack.removeLast()
                  count = node.val == prev ? count + 1 : 1
                  prev = node.val
                  if count > best {
                      best = count
                      modes = [node.val]
                  } else if count == best {
                      modes.append(node.val)
                  }
                  cur = node.right
              }
              return modes
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findMode(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut modes: Vec<i32> = Vec::new();
              let (mut best, mut count) = (0, 0);
              let mut prev: Option<i32> = None;
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let n = stack.pop().unwrap();
                  let v = n.borrow().val;
                  count = if prev == Some(v) { count + 1 } else { 1 };
                  prev = Some(v);
                  if count > best {
                      best = count;
                      modes.clear();
                      modes.push(v);
                  } else if count == best {
                      modes.push(v);
                  }
                  cur = n.borrow().right.clone();
              }
              modes
          }
        `,
        php: code`
          function findMode($root) {
              $modes = [];
              $best = 0;
              $count = 0;
              $prev = null;
              $stack = [];
              $cur = $root;
              while ($cur !== null || count($stack) > 0) {
                  while ($cur !== null) {
                      $stack[] = $cur;
                      $cur = $cur->left;
                  }
                  $cur = array_pop($stack);
                  $count = ($prev !== null && $cur->val == $prev) ? $count + 1 : 1;
                  $prev = $cur->val;
                  if ($count > $best) {
                      $best = $count;
                      $modes = [$cur->val];
                  } elseif ($count == $best) {
                      $modes[] = $cur->val;
                  }
                  $cur = $cur->right;
              }
              return $modes;
          }
        `,
        ruby: code`
          def findMode(root)
            modes = []
            best = 0
            count = 0
            prev = nil
            stack = []
            cur = root
            while !cur.nil? || !stack.empty?
              until cur.nil?
                stack << cur
                cur = cur.left
              end
              cur = stack.pop
              count = cur.val == prev ? count + 1 : 1
              prev = cur.val
              if count > best
                best = count
                modes = [cur.val]
              elsif count == best
                modes << cur.val
              end
              cur = cur.right
            end
            modes
          end
        `,
      },
    };
  })(),

  // ── Minimum Absolute Difference in BST (LC 530) ─────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const v = inorderT(root);
      let best = Infinity;
      for (let i = 1; i < v.length; i++) best = Math.min(best, v[i] - v[i - 1]);
      return best;
    };
    return {
      slug: "minimum-absolute-difference-in-bst",
      title: "Minimum Absolute Difference in BST",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "getMinimumDifference", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary search tree with **distinct** values, return the minimum absolute difference between the values of any two different nodes.",
        [
          { in: "root = [4,2,6,1,3]", out: "1", note: "Several pairs differ by 1, for example 1 and 2, or 3 and 4." },
          { in: "root = [1,0,48,null,null,12,49]", out: "1", note: "Inorder the values are 0, 1, 12, 48, 49; both 0 and 1 and 48 and 49 differ by 1." },
          { in: "root = [10,null,100000]", out: "99990" },
        ],
        ["The number of nodes in the tree is in the range [2, 10^4]", "0 <= Node.val <= 10^5", "All values are distinct"]),
      hints: [
        "In sorted order, the closest pair of numbers is always a pair of neighbours.",
        "An inorder walk of a BST lists its values in sorted order.",
        "So walk inorder, remembering only the previous value, and take the smallest gap between consecutive values.",
      ],
      editorial: explain({
        idea: "Sorted order puts the closest two values next to each other, and inorder traversal of a BST *is* sorted order. One inorder pass comparing each value with the one before it finds the answer.",
        steps: [
          "Walk the BST inorder, keeping the previously visited value (none at the start).",
          "At each node, if there is a previous value, update `best = min(best, val - prev)`.",
          "Set `prev = val` and continue.",
          "Return `best`.",
        ],
        why: "For sorted values `a1 < a2 < … < an`, any pair `ai < aj` with a gap of more than one position has `aj - ai >= a(i+1) - ai`, so some adjacent pair is at least as close. Inorder visits exactly the sorted sequence, so its consecutive differences include the minimum.",
        time: "O(n)",
        space: "O(h) for the traversal",
        pitfalls: [
          "Comparing only parents with children is not enough: in the first example 3 and 4 differ by 1, yet 3 is a grandchild of 4.",
          "Values start at 0, so do not use 0 as a 'no previous value' marker.",
        ],
      }),
      examples: [
        { input: T([4, 2, 6, 1, 3]), expectedOutput: "1" },
        { input: T([1, 0, 48, null, null, 12, 49]), expectedOutput: "1" },
        { input: T([10, null, 100000]), expectedOutput: "99990" },
      ],
      gen: (rng: Rng) => {
        const n = Math.max(2, treeSize(rng, 2));
        const hi = pick(rng, [n - 1, n + 5, 100, 1000, 100000]);
        const t = randBST(rng, n, 0, hi);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def getMinimumDifference(root: Optional[TreeNode]) -> int:
              best = float("inf")
              prev = None
              stack = []
              cur = root
              while cur is not None or stack:
                  while cur is not None:
                      stack.append(cur)
                      cur = cur.left
                  cur = stack.pop()
                  if prev is not None:
                      best = min(best, cur.val - prev)
                  prev = cur.val
                  cur = cur.right
              return int(best)
        `,
        javascript: code`
          var getMinimumDifference = function(root) {
              var best = Infinity, prev = null;
              var stack = [], cur = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  if (prev !== null) best = Math.min(best, cur.val - prev);
                  prev = cur.val;
                  cur = cur.right;
              }
              return best;
          };
        `,
        typescript: code`
          function getMinimumDifference(root: TreeNode | null): number {
              var best = Infinity;
              var prev: number | null = null;
              var stack: TreeNode[] = [];
              var cur: TreeNode | null = root;
              while (cur !== null || stack.length > 0) {
                  while (cur !== null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  var node = stack.pop() as TreeNode;
                  if (prev !== null) best = Math.min(best, node.val - prev);
                  prev = node.val;
                  cur = node.right;
              }
              return best;
          }
        `,
        java: code`
          public static int getMinimumDifference(TreeNode root) {
              int best = Integer.MAX_VALUE, prev = -1;
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode cur = root;
              while (cur != null || !stack.isEmpty()) {
                  while (cur != null) {
                      stack.push(cur);
                      cur = cur.left;
                  }
                  cur = stack.pop();
                  if (prev >= 0) best = Math.min(best, cur.val - prev);
                  prev = cur.val;
                  cur = cur.right;
              }
              return best;
          }
        `,
        cpp: code`
          int getMinimumDifference(TreeNode* root) {
              int best = INT_MAX, prev = -1;
              vector<TreeNode*> stack;
              TreeNode* cur = root;
              while (cur || !stack.empty()) {
                  while (cur) {
                      stack.push_back(cur);
                      cur = cur->left;
                  }
                  cur = stack.back();
                  stack.pop_back();
                  if (prev >= 0) best = min(best, cur->val - prev);
                  prev = cur->val;
                  cur = cur->right;
              }
              return best;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }

          int getMinimumDifference(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int top = 0, best = 2147483647, prev = -1;
              struct TreeNode* cur = root;
              while (cur != NULL || top > 0) {
                  while (cur != NULL) {
                      stack[top++] = cur;
                      cur = cur->left;
                  }
                  cur = stack[--top];
                  if (prev >= 0 && cur->val - prev < best) best = cur->val - prev;
                  prev = cur->val;
                  cur = cur->right;
              }
              free(stack);
              return best;
          }
        `,
        csharp: code`
          public static int GetMinimumDifference(TreeNode root)
          {
              int best = int.MaxValue, prev = -1;
              var stack = new Stack<TreeNode>();
              TreeNode cur = root;
              while (cur != null || stack.Count > 0)
              {
                  while (cur != null)
                  {
                      stack.Push(cur);
                      cur = cur.left;
                  }
                  cur = stack.Pop();
                  if (prev >= 0) best = Math.Min(best, cur.val - prev);
                  prev = cur.val;
                  cur = cur.right;
              }
              return best;
          }
        `,
        go: code`
          func getMinimumDifference(root *TreeNode) int {
              best, prev := 1<<31-1, -1
              stack := []*TreeNode{}
              cur := root
              for cur != nil || len(stack) > 0 {
                  for cur != nil {
                      stack = append(stack, cur)
                      cur = cur.Left
                  }
                  cur = stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if prev >= 0 && cur.Val-prev < best {
                      best = cur.Val - prev
                  }
                  prev = cur.Val
                  cur = cur.Right
              }
              return best
          }
        `,
        kotlin: kt(code`
          fun getMinimumDifference(root: TreeNode?): Int {
              var best = Int.MAX_VALUE
              var prev = -1
              val stack = ArrayList<TreeNode>()
              var cur = root
              while (cur != null || stack.isNotEmpty()) {
                  while (cur != null) {
                      stack.add(cur)
                      cur = cur.left
                  }
                  val node = stack.removeAt(stack.size - 1)
                  if (prev >= 0) best = minOf(best, node.@val - prev)
                  prev = node.@val
                  cur = node.right
              }
              return best
          }
        `),
        swift: code`
          func getMinimumDifference(_ root: TreeNode?) -> Int {
              var best = Int.max
              var prev = -1
              var stack = [TreeNode]()
              var cur = root
              while cur != nil || !stack.isEmpty {
                  while let c = cur {
                      stack.append(c)
                      cur = c.left
                  }
                  let node = stack.removeLast()
                  if prev >= 0 { best = min(best, node.val - prev) }
                  prev = node.val
                  cur = node.right
              }
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn getMinimumDifference(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best = std::i32::MAX;
              let mut prev = -1;
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              let mut cur = root;
              while cur.is_some() || !stack.is_empty() {
                  while let Some(n) = cur {
                      cur = n.borrow().left.clone();
                      stack.push(n);
                  }
                  let n = stack.pop().unwrap();
                  let v = n.borrow().val;
                  if prev >= 0 {
                      best = best.min(v - prev);
                  }
                  prev = v;
                  cur = n.borrow().right.clone();
              }
              best
          }
        `,
        php: code`
          function getMinimumDifference($root) {
              $best = PHP_INT_MAX;
              $prev = -1;
              $stack = [];
              $cur = $root;
              while ($cur !== null || count($stack) > 0) {
                  while ($cur !== null) {
                      $stack[] = $cur;
                      $cur = $cur->left;
                  }
                  $cur = array_pop($stack);
                  if ($prev >= 0) $best = min($best, $cur->val - $prev);
                  $prev = $cur->val;
                  $cur = $cur->right;
              }
              return $best;
          }
        `,
        ruby: code`
          def getMinimumDifference(root)
            best = nil
            prev = nil
            stack = []
            cur = root
            while !cur.nil? || !stack.empty?
              until cur.nil?
                stack << cur
                cur = cur.left
              end
              cur = stack.pop
              unless prev.nil?
                d = cur.val - prev
                best = d if best.nil? || d < best
              end
              prev = cur.val
              cur = cur.right
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Diameter of Binary Tree (LC 543) ────────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let best = 0;
      for (const n of nodesOf(root)) best = Math.max(best, heightT(n.left) + heightT(n.right));
      return best;
    };
    return {
      slug: "diameter-of-binary-tree",
      title: "Diameter of Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Meta", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "diameterOfBinaryTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the length of its **diameter**: the longest path between any two nodes, measured in **edges**. The path may or may not pass through the root.",
        [
          { in: "root = [1,2,3,4,5]", out: "3", note: "The paths 4 → 2 → 1 → 3 and 5 → 2 → 1 → 3 each have three edges." },
          { in: "root = [1,2]", out: "1" },
          { in: "root = [1,2,null,3,4,5,null,null,6]", out: "4", note: "The longest path, 5 → 3 → 2 → 4 → 6, never reaches the root." },
        ],
        ["The number of nodes in the tree is in the range [1, 10^4]", "-100 <= Node.val <= 100"]),
      hints: [
        "Every path has one highest node; at that node the path goes down into the left subtree, the right subtree, or both.",
        "The longest path whose highest node is `x` has `height(x.left) + height(x.right)` edges, with height counted in nodes.",
        "Compute heights bottom-up in one walk and update a running maximum of that sum at every node.",
      ],
      editorial: explain({
        idea: "For each node, the longest path that turns at it is the height of its left subtree plus the height of its right subtree. One post-order walk computes every height once and keeps the best such sum.",
        steps: [
          "Define `height(null) = 0`.",
          "At each node, compute `l = height(left)` and `r = height(right)`.",
          "Update `best = max(best, l + r)`.",
          "Return `1 + max(l, r)` as this node's height.",
          "After `height(root)`, return `best`.",
        ],
        why: "Any path has a unique topmost node, and from there it descends at most once into each subtree; the longest such descent into a subtree has exactly that subtree's height in edges, counting the edge from the top node. So the best path topped at `x` has `l + r` edges, and taking the maximum over all `x` covers every path.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "The diameter counts edges, not nodes — a single node has diameter 0.",
          "Returning only `height(root.left) + height(root.right)` misses paths that do not pass through the root (third example).",
          "Computing heights separately at every node is O(n^2) on a chain.",
        ],
      }),
      examples: [
        { input: T([1, 2, 3, 4, 5]), expectedOutput: "3" },
        { input: T([1, 2]), expectedOutput: "1" },
        { input: T([1, 2, null, 3, 4, 5, null, null, 6]), expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const t = anyTree(rng, treeSize(rng, 1), -100, 100);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def diameterOfBinaryTree(root: Optional[TreeNode]) -> int:
              best = 0

              def height(node):
                  nonlocal best
                  if node is None:
                      return 0
                  l = height(node.left)
                  r = height(node.right)
                  best = max(best, l + r)
                  return 1 + max(l, r)

              height(root)
              return best
        `,
        javascript: code`
          var diameterOfBinaryTree = function(root) {
              var best = { value: 0 };
              diameterHeight(root, best);
              return best.value;
          };

          var diameterHeight = function(node, best) {
              if (node === null) return 0;
              var l = diameterHeight(node.left, best);
              var r = diameterHeight(node.right, best);
              if (l + r > best.value) best.value = l + r;
              return 1 + Math.max(l, r);
          };
        `,
        typescript: code`
          function diameterOfBinaryTree(root: TreeNode | null): number {
              var best = { value: 0 };
              diameterHeight(root, best);
              return best.value;
          }

          function diameterHeight(node: TreeNode | null, best: { value: number }): number {
              if (node === null) return 0;
              var l = diameterHeight(node.left, best);
              var r = diameterHeight(node.right, best);
              if (l + r > best.value) best.value = l + r;
              return 1 + Math.max(l, r);
          }
        `,
        java: code`
          public static int diameterOfBinaryTree(TreeNode root) {
              int[] best = new int[1];
              diameterHeight(root, best);
              return best[0];
          }

          static int diameterHeight(TreeNode node, int[] best) {
              if (node == null) return 0;
              int l = diameterHeight(node.left, best);
              int r = diameterHeight(node.right, best);
              best[0] = Math.max(best[0], l + r);
              return 1 + Math.max(l, r);
          }
        `,
        cpp: code`
          int diameterHeight(TreeNode* node, int& best) {
              if (!node) return 0;
              int l = diameterHeight(node->left, best);
              int r = diameterHeight(node->right, best);
              best = max(best, l + r);
              return 1 + max(l, r);
          }

          int diameterOfBinaryTree(TreeNode* root) {
              int best = 0;
              diameterHeight(root, best);
              return best;
          }
        `,
        c: code`
          static int diameterHeight(struct TreeNode* node, int* best) {
              if (node == NULL) return 0;
              int l = diameterHeight(node->left, best);
              int r = diameterHeight(node->right, best);
              if (l + r > *best) *best = l + r;
              return 1 + (l > r ? l : r);
          }

          int diameterOfBinaryTree(struct TreeNode* root) {
              int best = 0;
              diameterHeight(root, &best);
              return best;
          }
        `,
        csharp: code`
          public static int DiameterOfBinaryTree(TreeNode root)
          {
              int best = 0;
              DiameterHeight(root, ref best);
              return best;
          }

          static int DiameterHeight(TreeNode node, ref int best)
          {
              if (node == null) return 0;
              int l = DiameterHeight(node.left, ref best);
              int r = DiameterHeight(node.right, ref best);
              best = Math.Max(best, l + r);
              return 1 + Math.Max(l, r);
          }
        `,
        go: code`
          func diameterOfBinaryTree(root *TreeNode) int {
              best := 0
              diameterHeight(root, &best)
              return best
          }

          func diameterHeight(node *TreeNode, best *int) int {
              if node == nil {
                  return 0
              }
              l := diameterHeight(node.Left, best)
              r := diameterHeight(node.Right, best)
              if l+r > *best {
                  *best = l + r
              }
              if l > r {
                  return 1 + l
              }
              return 1 + r
          }
        `,
        kotlin: code`
          fun diameterOfBinaryTree(root: TreeNode?): Int {
              val best = IntArray(1)
              diameterHeight(root, best)
              return best[0]
          }

          fun diameterHeight(node: TreeNode?, best: IntArray): Int {
              if (node == null) return 0
              val l = diameterHeight(node.left, best)
              val r = diameterHeight(node.right, best)
              best[0] = maxOf(best[0], l + r)
              return 1 + maxOf(l, r)
          }
        `,
        swift: code`
          func diameterOfBinaryTree(_ root: TreeNode?) -> Int {
              var best = 0
              _ = diameterHeight(root, &best)
              return best
          }

          func diameterHeight(_ node: TreeNode?, _ best: inout Int) -> Int {
              guard let n = node else { return 0 }
              let l = diameterHeight(n.left, &best)
              let r = diameterHeight(n.right, &best)
              best = max(best, l + r)
              return 1 + max(l, r)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn diameterOfBinaryTree(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best = 0;
              diameter_height(&root, &mut best);
              best
          }

          fn diameter_height(node: &Option<Rc<RefCell<TreeNode>>>, best: &mut i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let l = diameter_height(&n.left, best);
                      let r = diameter_height(&n.right, best);
                      *best = (*best).max(l + r);
                      1 + l.max(r)
                  }
              }
          }
        `,
        php: code`
          function diameterOfBinaryTree($root) {
              $best = 0;
              diameterHeight($root, $best);
              return $best;
          }

          function diameterHeight($node, &$best) {
              if ($node === null) return 0;
              $l = diameterHeight($node->left, $best);
              $r = diameterHeight($node->right, $best);
              $best = max($best, $l + $r);
              return 1 + max($l, $r);
          }
        `,
        ruby: code`
          def diameterOfBinaryTree(root)
            best = [0]
            diameter_height(root, best)
            best[0]
          end

          def diameter_height(node, best)
            return 0 if node.nil?
            l = diameter_height(node.left, best)
            r = diameter_height(node.right, best)
            best[0] = l + r if l + r > best[0]
            1 + [l, r].max
          end
        `,
      },
    };
  })(),


  // ── Binary Tree Tilt (LC 563) ───────────────────────────────────
  (() => {
    const sumT = (t: TNode | null): number => (t ? t.val + sumT(t.left) + sumT(t.right) : 0);
    const ref = (root: TNode | null) => {
      let s = 0;
      for (const n of nodesOf(root)) s += Math.abs(sumT(n.left) - sumT(n.right));
      return s;
    };
    return {
      slug: "binary-tree-tilt",
      title: "Binary Tree Tilt",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Meta"],
      signature: { funcName: "findTilt", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the sum of the **tilts** of all its nodes.\n\nThe tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree. A missing subtree has sum `0`, so a leaf has tilt `0`.",
        [
          { in: "root = [1,2,3]", out: "1", note: "The leaves 2 and 3 have tilt 0; the root has tilt |2 - 3| = 1." },
          { in: "root = [4,2,9,3,5,null,7]", out: "15", note: "Tilts: 3, 5 and 7 are leaves (0); 2 → |3 - 5| = 2; 9 → |0 - 7| = 7; 4 → |(2+3+5) - (9+7)| = 6. Total 2 + 7 + 6 = 15." },
          { in: "root = [21,7,14,1,1,2,2,3,3]", out: "9" },
        ],
        ["The number of nodes in the tree is in the range [0, 1000] (LeetCode allows 10^4; lowered here so the total tilt provably fits in a 32-bit integer)", "-1000 <= Node.val <= 1000"]),
      hints: [
        "A node's tilt needs the sums of its two subtrees — information that flows up from the children.",
        "Recomputing a subtree's sum for every ancestor costs O(n^2) on a chain.",
        "Let one post-order helper return its subtree's sum while adding `|leftSum - rightSum|` to a running total.",
      ],
      editorial: explain({
        idea: "Subtree sums combine bottom-up: `sum(node) = node.val + sum(left) + sum(right)`. A post-order walk that returns each subtree's sum has both children's sums in hand at every node — exactly what its tilt needs.",
        steps: [
          "Define `sum(null) = 0`.",
          "At a node, compute `l = sum(left)` and `r = sum(right)`.",
          "Add `|l - r|` to the running total.",
          "Return `node.val + l + r`.",
          "Call `sum(root)` and return the total.",
        ],
        why: "Each node's tilt is added exactly once — when its own call has both subtree sums — and each subtree sum is computed exactly once, by the call at that subtree's root, so the walk is linear.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "The tilt uses the sums of whole subtrees, not just the two children's values.",
          "Return the subtree sum from the helper, not the tilt — the parent needs the sum.",
          "An empty tree has total tilt 0.",
        ],
      }),
      examples: [
        { input: T([1, 2, 3]), expectedOutput: "1" },
        { input: T([4, 2, 9, 3, 5, null, 7]), expectedOutput: "15" },
        { input: T([21, 7, 14, 1, 1, 2, 2, 3, 3]), expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [1, 10, 1000]);
        const t = anyTree(rng, treeSize(rng), -span, span);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findTilt(root: Optional[TreeNode]) -> int:
              total = 0

              def subtree_sum(node):
                  nonlocal total
                  if node is None:
                      return 0
                  l = subtree_sum(node.left)
                  r = subtree_sum(node.right)
                  total += abs(l - r)
                  return node.val + l + r

              subtree_sum(root)
              return total
        `,
        javascript: code`
          var findTilt = function(root) {
              var total = { value: 0 };
              tiltSum(root, total);
              return total.value;
          };

          var tiltSum = function(node, total) {
              if (node === null) return 0;
              var l = tiltSum(node.left, total);
              var r = tiltSum(node.right, total);
              total.value += Math.abs(l - r);
              return node.val + l + r;
          };
        `,
        typescript: code`
          function findTilt(root: TreeNode | null): number {
              var total = { value: 0 };
              tiltSum(root, total);
              return total.value;
          }

          function tiltSum(node: TreeNode | null, total: { value: number }): number {
              if (node === null) return 0;
              var l = tiltSum(node.left, total);
              var r = tiltSum(node.right, total);
              total.value += Math.abs(l - r);
              return node.val + l + r;
          }
        `,
        java: code`
          public static int findTilt(TreeNode root) {
              int[] total = new int[1];
              tiltSum(root, total);
              return total[0];
          }

          static int tiltSum(TreeNode node, int[] total) {
              if (node == null) return 0;
              int l = tiltSum(node.left, total);
              int r = tiltSum(node.right, total);
              total[0] += Math.abs(l - r);
              return node.val + l + r;
          }
        `,
        cpp: code`
          int tiltSum(TreeNode* node, int& total) {
              if (!node) return 0;
              int l = tiltSum(node->left, total);
              int r = tiltSum(node->right, total);
              total += abs(l - r);
              return node->val + l + r;
          }

          int findTilt(TreeNode* root) {
              int total = 0;
              tiltSum(root, total);
              return total;
          }
        `,
        c: code`
          static int tiltSum(struct TreeNode* node, int* total) {
              if (node == NULL) return 0;
              int l = tiltSum(node->left, total);
              int r = tiltSum(node->right, total);
              *total += l > r ? l - r : r - l;
              return node->val + l + r;
          }

          int findTilt(struct TreeNode* root) {
              int total = 0;
              tiltSum(root, &total);
              return total;
          }
        `,
        csharp: code`
          public static int FindTilt(TreeNode root)
          {
              int total = 0;
              TiltSum(root, ref total);
              return total;
          }

          static int TiltSum(TreeNode node, ref int total)
          {
              if (node == null) return 0;
              int l = TiltSum(node.left, ref total);
              int r = TiltSum(node.right, ref total);
              total += Math.Abs(l - r);
              return node.val + l + r;
          }
        `,
        go: code`
          func findTilt(root *TreeNode) int {
              total := 0
              tiltSum(root, &total)
              return total
          }

          func tiltSum(node *TreeNode, total *int) int {
              if node == nil {
                  return 0
              }
              l := tiltSum(node.Left, total)
              r := tiltSum(node.Right, total)
              if l > r {
                  *total += l - r
              } else {
                  *total += r - l
              }
              return node.Val + l + r
          }
        `,
        kotlin: kt(code`
          fun findTilt(root: TreeNode?): Int {
              val total = IntArray(1)
              tiltSum(root, total)
              return total[0]
          }

          fun tiltSum(node: TreeNode?, total: IntArray): Int {
              if (node == null) return 0
              val l = tiltSum(node.left, total)
              val r = tiltSum(node.right, total)
              total[0] += Math.abs(l - r)
              return node.@val + l + r
          }
        `),
        swift: code`
          func findTilt(_ root: TreeNode?) -> Int {
              var total = 0
              _ = tiltSum(root, &total)
              return total
          }

          func tiltSum(_ node: TreeNode?, _ total: inout Int) -> Int {
              guard let n = node else { return 0 }
              let l = tiltSum(n.left, &total)
              let r = tiltSum(n.right, &total)
              total += abs(l - r)
              return n.val + l + r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findTilt(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut total = 0;
              tilt_sum(&root, &mut total);
              total
          }

          fn tilt_sum(node: &Option<Rc<RefCell<TreeNode>>>, total: &mut i32) -> i32 {
              match node {
                  None => 0,
                  Some(rc) => {
                      let n = rc.borrow();
                      let l = tilt_sum(&n.left, total);
                      let r = tilt_sum(&n.right, total);
                      *total += (l - r).abs();
                      n.val + l + r
                  }
              }
          }
        `,
        php: code`
          function findTilt($root) {
              $total = 0;
              tiltSum($root, $total);
              return $total;
          }

          function tiltSum($node, &$total) {
              if ($node === null) return 0;
              $l = tiltSum($node->left, $total);
              $r = tiltSum($node->right, $total);
              $total += abs($l - $r);
              return $node->val + $l + $r;
          }
        `,
        ruby: code`
          def findTilt(root)
            total = [0]
            tilt_sum(root, total)
            total[0]
          end

          def tilt_sum(node, total)
            return 0 if node.nil?
            l = tilt_sum(node.left, total)
            r = tilt_sum(node.right, total)
            total[0] += (l - r).abs
            node.val + l + r
          end
        `,
      },
    };
  })(),

  // ── Subtree of Another Tree (LC 572) ────────────────────────────
  (() => {
    const ref = (root: TNode | null, subRoot: TNode | null) => nodesOf(root).some((n) => sameT(n, subRoot));
    return {
      slug: "subtree-of-another-tree",
      title: "Subtree of Another Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "String Matching", "Amazon", "Meta", "Microsoft", "Google"],
      signature: {
        funcName: "isSubtree",
        params: [{ name: "root", type: "TreeNode" as const }, { name: "subRoot", type: "TreeNode" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You are given the roots `root` and `subRoot` of two binary trees. Return `true` if `root` contains a subtree that is **identical** to `subRoot` — the same shape and the same values — and `false` otherwise.\n\nA subtree of `root` is some node of `root` together with **all** of its descendants; `root` is a subtree of itself.",
        [
          { in: "root = [3,4,5,1,2], subRoot = [4,1,2]", out: "true", note: "The node 4 of `root`, with its children 1 and 2, matches `subRoot` exactly." },
          { in: "root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]", out: "false", note: "The node 4 has the right values on top, but its subtree also contains the 0 under 2 — a subtree must include every descendant." },
          { in: "root = [1,1], subRoot = [1]", out: "true", note: "The leaf 1 matches; the root 1 does not, because it has a child." },
        ],
        ["The number of nodes in `root` is in the range [1, 2000]", "The number of nodes in `subRoot` is in the range [1, 1000]", "-10^4 <= root.val <= 10^4", "-10^4 <= subRoot.val <= 10^4"]),
      hints: [
        "Use the Same Tree check as a building block: is the tree rooted at this node identical to `subRoot`?",
        "Try that check at every node of `root` — if any succeeds, the answer is `true`.",
        "Matching tops are not enough: the comparison must fail when either side has a node the other lacks, all the way down to the leaves.",
      ],
      editorial: explain({
        idea: "`subRoot` occurs in `root` exactly when some node of `root` roots a tree identical to `subRoot`. Walk every node of `root` and run an identical-trees check from it.",
        steps: [
          "`same(a, b)`: both null → `true`; one null → `false`; otherwise equal values and `same` on both child pairs.",
          "`isSubtree(node, sub)`: if `node` is null return `false`.",
          "If `same(node, sub)` return `true`.",
          "Otherwise return `isSubtree(node.left, sub) || isSubtree(node.right, sub)`.",
        ],
        why: "A subtree is determined by its top node, so trying every node of `root` as the top covers every candidate, and `same` accepts a candidate only if it matches `subRoot` node for node including where each one ends.",
        time: "O(n · m) in the worst case, for n and m nodes; serialising both trees and string-matching brings it to O(n + m)",
        space: "O(h) recursion depth",
        pitfalls: [
          "Checking only that `subRoot`'s values appear starting at some node accepts a match with extra descendants (second example).",
          "Serialising without null markers (or without separators between values) makes different trees look alike, e.g. `12` vs `1` `2`.",
        ],
      }),
      examples: [
        { input: `${T([3, 4, 5, 1, 2])}\n${T([4, 1, 2])}`, expectedOutput: "true" },
        { input: `${T([3, 4, 5, 1, 2, null, null, null, null, 0])}\n${T([4, 1, 2])}`, expectedOutput: "false" },
        { input: `${T([1, 1])}\n${T([1])}`, expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [0, 1, 2, 10000]);
        const root = anyTree(rng, treeSize(rng, 1), -span, span) as TNode;
        let sub: TNode | null;
        const mode = rng();
        const ns = nodesOf(root);
        if (mode < 0.5) sub = cloneT(ns[ri(rng, 0, ns.length - 1)]);
        else if (mode < 0.7) {
          sub = cloneT(ns[ri(rng, 0, ns.length - 1)]) as TNode;
          const sn = nodesOf(sub);
          const x = sn[ri(rng, 0, sn.length - 1)];
          if (rng() < 0.5) x.val = x.val === span ? x.val - 1 : x.val + 1;
          else if (!x.left) x.left = { val: ri(rng, -span, span), left: null, right: null };
          else if (!x.right) x.right = { val: ri(rng, -span, span), left: null, right: null };
          else x.val = x.val === span ? x.val - 1 : x.val + 1;
        } else sub = anyTree(rng, ri(rng, 1, pick(rng, [1, 3, 6])), -span, span);
        return { input: `${fmtTree(root)}\n${fmtTree(sub)}`, expectedOutput: String(ref(root, sub)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isSubtree(root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
              def same(a, b):
                  if a is None or b is None:
                      return a is b
                  return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

              def walk(node):
                  if node is None:
                      return False
                  return same(node, subRoot) or walk(node.left) or walk(node.right)

              return walk(root)
        `,
        javascript: code`
          var isSubtree = function(root, subRoot) {
              if (root === null) return false;
              return sameShape(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
          };

          var sameShape = function(a, b) {
              if (a === null || b === null) return a === b;
              return a.val === b.val && sameShape(a.left, b.left) && sameShape(a.right, b.right);
          };
        `,
        typescript: code`
          function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
              if (root === null) return false;
              return sameShape(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
          }

          function sameShape(a: TreeNode | null, b: TreeNode | null): boolean {
              if (a === null || b === null) return a === b;
              return a.val === b.val && sameShape(a.left, b.left) && sameShape(a.right, b.right);
          }
        `,
        java: code`
          public static boolean isSubtree(TreeNode root, TreeNode subRoot) {
              if (root == null) return false;
              return sameShape(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
          }

          static boolean sameShape(TreeNode a, TreeNode b) {
              if (a == null || b == null) return a == b;
              return a.val == b.val && sameShape(a.left, b.left) && sameShape(a.right, b.right);
          }
        `,
        cpp: code`
          bool sameShape(TreeNode* a, TreeNode* b) {
              if (!a || !b) return a == b;
              return a->val == b->val && sameShape(a->left, b->left) && sameShape(a->right, b->right);
          }

          bool isSubtree(TreeNode* root, TreeNode* subRoot) {
              if (!root) return false;
              return sameShape(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
          }
        `,
        c: code`
          static bool sameShape(struct TreeNode* a, struct TreeNode* b) {
              if (a == NULL || b == NULL) return a == b;
              return a->val == b->val && sameShape(a->left, b->left) && sameShape(a->right, b->right);
          }

          bool isSubtree(struct TreeNode* root, struct TreeNode* subRoot) {
              if (root == NULL) return false;
              return sameShape(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
          }
        `,
        csharp: code`
          public static bool IsSubtree(TreeNode root, TreeNode subRoot)
          {
              if (root == null) return false;
              return SameShape(root, subRoot) || IsSubtree(root.left, subRoot) || IsSubtree(root.right, subRoot);
          }

          static bool SameShape(TreeNode a, TreeNode b)
          {
              if (a == null || b == null) return a == b;
              return a.val == b.val && SameShape(a.left, b.left) && SameShape(a.right, b.right);
          }
        `,
        go: code`
          func isSubtree(root *TreeNode, subRoot *TreeNode) bool {
              if root == nil {
                  return false
              }
              return sameShape(root, subRoot) || isSubtree(root.Left, subRoot) || isSubtree(root.Right, subRoot)
          }

          func sameShape(a *TreeNode, b *TreeNode) bool {
              if a == nil || b == nil {
                  return a == b
              }
              return a.Val == b.Val && sameShape(a.Left, b.Left) && sameShape(a.Right, b.Right)
          }
        `,
        kotlin: kt(code`
          fun isSubtree(root: TreeNode?, subRoot: TreeNode?): Boolean {
              if (root == null) return false
              return sameShape(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot)
          }

          fun sameShape(a: TreeNode?, b: TreeNode?): Boolean {
              if (a == null || b == null) return a === b
              return a.@val == b.@val && sameShape(a.left, b.left) && sameShape(a.right, b.right)
          }
        `),
        swift: code`
          func isSubtree(_ root: TreeNode?, _ subRoot: TreeNode?) -> Bool {
              guard let r = root else { return false }
              return sameShape(r, subRoot) || isSubtree(r.left, subRoot) || isSubtree(r.right, subRoot)
          }

          func sameShape(_ a: TreeNode?, _ b: TreeNode?) -> Bool {
              guard let x = a, let y = b else { return a == nil && b == nil }
              return x.val == y.val && sameShape(x.left, y.left) && sameShape(x.right, y.right)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isSubtree(root: Option<Rc<RefCell<TreeNode>>>, subRoot: Option<Rc<RefCell<TreeNode>>>) -> bool {
              contains(&root, &subRoot)
          }

          fn contains(node: &Option<Rc<RefCell<TreeNode>>>, sub: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match node {
                  None => false,
                  Some(rc) => {
                      if same_shape(node, sub) {
                          return true;
                      }
                      let n = rc.borrow();
                      contains(&n.left, sub) || contains(&n.right, sub)
                  }
              }
          }

          fn same_shape(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let x = x.borrow();
                      let y = y.borrow();
                      x.val == y.val && same_shape(&x.left, &y.left) && same_shape(&x.right, &y.right)
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isSubtree($root, $subRoot) {
              if ($root === null) return false;
              return sameShape($root, $subRoot) || isSubtree($root->left, $subRoot) || isSubtree($root->right, $subRoot);
          }

          function sameShape($a, $b) {
              if ($a === null || $b === null) return $a === $b;
              return $a->val == $b->val && sameShape($a->left, $b->left) && sameShape($a->right, $b->right);
          }
        `,
        ruby: code`
          def isSubtree(root, subRoot)
            return false if root.nil?
            same_shape(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot)
          end

          def same_shape(a, b)
            return a.nil? && b.nil? if a.nil? || b.nil?
            a.val == b.val && same_shape(a.left, b.left) && same_shape(a.right, b.right)
          end
        `,
      },
    };
  })(),

  // ── Merge Two Binary Trees (LC 617) ─────────────────────────────
  (() => {
    const ref = (a: TNode | null, b: TNode | null): TNode | null => {
      if (!a) return cloneT(b);
      if (!b) return cloneT(a);
      return { val: a.val + b.val, left: ref(a.left, b.left), right: ref(a.right, b.right) };
    };
    return {
      slug: "merge-two-binary-trees",
      title: "Merge Two Binary Trees",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Adobe", "Microsoft"],
      signature: {
        funcName: "mergeTrees",
        params: [{ name: "root1", type: "TreeNode" as const }, { name: "root2", type: "TreeNode" as const }],
        returns: "TreeNode" as const,
      },
      description: describe(
        "You are given the roots `root1` and `root2` of two binary trees. Imagine laying one over the other, root on root. **Merge** them into one tree: where both trees have a node in the same position, the merged node's value is the sum of the two; where only one tree has a node, that node (with its whole subtree) is used as it is.\n\nReturn the root of the merged tree. Merging starts at the roots.",
        [
          { in: "root1 = [1,3,2,5], root2 = [2,1,3,null,4,null,7]", out: "[3,4,5,5,4,null,7]", note: "Overlapping positions add up (1+2, 3+1, 2+3); 5 exists only in the first tree, 4 and 7 only in the second." },
          { in: "root1 = [1], root2 = [1,2]", out: "[2,2]" },
          { in: "root1 = [], root2 = [4,null,-6]", out: "[4,null,-6]", note: "With one tree empty, the merge is just the other tree." },
        ],
        ["The number of nodes in both trees is in the range [0, 2000]", "-10^4 <= Node.val <= 10^4"]),
      hints: [
        "Merge position by position, starting at the two roots.",
        "If one of the two nodes is missing, the answer for this position is simply the other node — its whole subtree comes along unchanged.",
        "Otherwise add the values and merge the left children with each other and the right children with each other.",
      ],
      editorial: explain({
        idea: "Walk both trees together. Where both have a node, add the second's value into the first and recurse on the child pairs; where one side is missing, reuse the other side's subtree as it stands.",
        steps: [
          "If `root1` is null return `root2`; if `root2` is null return `root1`.",
          "Set `root1.val += root2.val`.",
          "Set `root1.left = merge(root1.left, root2.left)` and `root1.right = merge(root1.right, root2.right)`.",
          "Return `root1`.",
        ],
        why: "Every position that exists in either tree is reached: positions present in both are handled by the summing case, and a position present in only one tree lies in a subtree that is attached whole by a base case — its nodes need no change, because there is nothing to add to them.",
        time: "O(min(n, m)) — the walk only continues where both trees have nodes",
        space: "O(h) recursion depth",
        pitfalls: [
          "Do not stop at the first missing node on one side; the other side's subtree must be kept.",
          "Merging into `root1` in place modifies the input — build new nodes if the inputs must stay intact.",
        ],
      }),
      examples: [
        { input: `${T([1, 3, 2, 5])}\n${T([2, 1, 3, null, 4, null, 7])}`, expectedOutput: "[3,4,5,5,4,null,7]" },
        { input: `${T([1])}\n${T([1, 2])}`, expectedOutput: "[2,2]" },
        { input: `[]\n${T([4, null, -6])}`, expectedOutput: "[4,null,-6]" },
      ],
      gen: (rng: Rng) => {
        const a = anyTree(rng, treeSize(rng), -10000, 10000);
        const b = anyTree(rng, treeSize(rng), -10000, 10000);
        return { input: `${fmtTree(a)}\n${fmtTree(b)}`, expectedOutput: fmtTree(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def mergeTrees(root1: Optional[TreeNode], root2: Optional[TreeNode]) -> Optional[TreeNode]:
              if root1 is None:
                  return root2
              if root2 is None:
                  return root1
              root1.val += root2.val
              root1.left = mergeTrees(root1.left, root2.left)
              root1.right = mergeTrees(root1.right, root2.right)
              return root1
        `,
        javascript: code`
          var mergeTrees = function(root1, root2) {
              if (root1 === null) return root2;
              if (root2 === null) return root1;
              root1.val += root2.val;
              root1.left = mergeTrees(root1.left, root2.left);
              root1.right = mergeTrees(root1.right, root2.right);
              return root1;
          };
        `,
        typescript: code`
          function mergeTrees(root1: TreeNode | null, root2: TreeNode | null): TreeNode | null {
              if (root1 === null) return root2;
              if (root2 === null) return root1;
              root1.val += root2.val;
              root1.left = mergeTrees(root1.left, root2.left);
              root1.right = mergeTrees(root1.right, root2.right);
              return root1;
          }
        `,
        java: code`
          public static TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
              if (root1 == null) return root2;
              if (root2 == null) return root1;
              root1.val += root2.val;
              root1.left = mergeTrees(root1.left, root2.left);
              root1.right = mergeTrees(root1.right, root2.right);
              return root1;
          }
        `,
        cpp: code`
          TreeNode* mergeTrees(TreeNode* root1, TreeNode* root2) {
              if (!root1) return root2;
              if (!root2) return root1;
              root1->val += root2->val;
              root1->left = mergeTrees(root1->left, root2->left);
              root1->right = mergeTrees(root1->right, root2->right);
              return root1;
          }
        `,
        c: code`
          struct TreeNode* mergeTrees(struct TreeNode* root1, struct TreeNode* root2) {
              if (root1 == NULL) return root2;
              if (root2 == NULL) return root1;
              root1->val += root2->val;
              root1->left = mergeTrees(root1->left, root2->left);
              root1->right = mergeTrees(root1->right, root2->right);
              return root1;
          }
        `,
        csharp: code`
          public static TreeNode MergeTrees(TreeNode root1, TreeNode root2)
          {
              if (root1 == null) return root2;
              if (root2 == null) return root1;
              root1.val += root2.val;
              root1.left = MergeTrees(root1.left, root2.left);
              root1.right = MergeTrees(root1.right, root2.right);
              return root1;
          }
        `,
        go: code`
          func mergeTrees(root1 *TreeNode, root2 *TreeNode) *TreeNode {
              if root1 == nil {
                  return root2
              }
              if root2 == nil {
                  return root1
              }
              root1.Val += root2.Val
              root1.Left = mergeTrees(root1.Left, root2.Left)
              root1.Right = mergeTrees(root1.Right, root2.Right)
              return root1
          }
        `,
        kotlin: kt(code`
          fun mergeTrees(root1: TreeNode?, root2: TreeNode?): TreeNode? {
              if (root1 == null) return root2
              if (root2 == null) return root1
              root1.@val += root2.@val
              root1.left = mergeTrees(root1.left, root2.left)
              root1.right = mergeTrees(root1.right, root2.right)
              return root1
          }
        `),
        swift: code`
          func mergeTrees(_ root1: TreeNode?, _ root2: TreeNode?) -> TreeNode? {
              guard let a = root1 else { return root2 }
              guard let b = root2 else { return a }
              a.val += b.val
              a.left = mergeTrees(a.left, b.left)
              a.right = mergeTrees(a.right, b.right)
              return a
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn mergeTrees(root1: Option<Rc<RefCell<TreeNode>>>, root2: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              match (root1, root2) {
                  (None, other) => other,
                  (one, None) => one,
                  (Some(a), Some(b)) => {
                      {
                          let mut x = a.borrow_mut();
                          let mut y = b.borrow_mut();
                          x.val += y.val;
                          let l = mergeTrees(x.left.take(), y.left.take());
                          x.left = l;
                          let r = mergeTrees(x.right.take(), y.right.take());
                          x.right = r;
                      }
                      Some(a)
                  }
              }
          }
        `,
        php: code`
          function mergeTrees($root1, $root2) {
              if ($root1 === null) return $root2;
              if ($root2 === null) return $root1;
              $root1->val += $root2->val;
              $root1->left = mergeTrees($root1->left, $root2->left);
              $root1->right = mergeTrees($root1->right, $root2->right);
              return $root1;
          }
        `,
        ruby: code`
          def mergeTrees(root1, root2)
            return root2 if root1.nil?
            return root1 if root2.nil?
            root1.val += root2.val
            root1.left = mergeTrees(root1.left, root2.left)
            root1.right = mergeTrees(root1.right, root2.right)
            root1
          end
        `,
      },
    };
  })(),

  // ── Two Sum IV - Input is a BST (LC 653) ────────────────────────
  (() => {
    const ref = (root: TNode | null, k: number) => {
      const v = nodesOf(root).map((n) => n.val);
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[i] + v[j] === k) return true;
      return false;
    };
    return {
      slug: "two-sum-iv-input-is-a-bst",
      title: "Two Sum IV - Input is a BST",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "Hash Table", "Two Pointers", "Amazon", "Meta", "Microsoft"],
      signature: {
        funcName: "findTarget",
        params: [{ name: "root", type: "TreeNode" as const }, { name: "k", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given the `root` of a binary search tree with distinct values and an integer `k`, return `true` if there are **two different nodes** whose values add up to `k`, and `false` otherwise.",
        [
          { in: "root = [5,3,6,2,4,null,7], k = 9", out: "true", note: "For example 2 + 7 = 9 (and 3 + 6, 4 + 5)." },
          { in: "root = [5,3,6,2,4,null,7], k = 28", out: "false", note: "The two largest values add up to only 13." },
          { in: "root = [1], k = 2", out: "false", note: "1 + 1 would use the same node twice." },
        ],
        ["The number of nodes in the tree is in the range [1, 10^4]", "-10^4 <= Node.val <= 10^4", "All values in the tree are distinct", "-10^5 <= k <= 10^5"]),
      hints: [
        "This is Two Sum, with the numbers stored in a tree instead of an array.",
        "Walk the tree; for each value `v`, ask whether `k - v` has already been seen. A hash set answers in O(1).",
        "Alternatively, an inorder walk gives the values sorted, and two pointers from both ends find a pair in one pass.",
      ],
      editorial: explain({
        idea: "Visit every node once, keeping a set of the values seen so far. A pair summing to `k` exists exactly when, at some node, its complement `k - val` is already in the set.",
        steps: [
          "Start with an empty set and traverse the tree (any order).",
          "At each node with value `v`: if `k - v` is in the set, return `true`.",
          "Otherwise add `v` to the set and continue.",
          "If the traversal ends, return `false`.",
        ],
        why: "If nodes `a` and `b` (visited in that order) satisfy `a + b = k`, then when `b` is visited `a` is already in the set and the check succeeds. Conversely the check only succeeds against a value stored at a different, earlier node, so the same node is never used twice.",
        time: "O(n)",
        space: "O(n) for the set (the sorted-list two-pointer version also needs O(n), or O(h) with two BST iterators)",
        pitfalls: [
          "Check the complement before inserting the current value, or `v + v = k` would match a single node.",
          "The BST order is not needed for the hash-set solution — it is what makes the two-pointer one possible.",
        ],
      }),
      examples: [
        { input: `${T([5, 3, 6, 2, 4, null, 7])}\n9`, expectedOutput: "true" },
        { input: `${T([5, 3, 6, 2, 4, null, 7])}\n28`, expectedOutput: "false" },
        { input: `${T([1])}\n2`, expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = treeSize(rng, 1);
        const hi = pick(rng, [n + 3, 50, 10000]);
        const t = randBST(rng, n, rng() < 0.5 ? -hi : 0, hi);
        const vals = nodesOf(t).map((x) => x.val);
        let k: number;
        const r = rng();
        if (r < 0.45 && vals.length >= 2) {
          const s = shuffle(rng, vals.slice());
          k = s[0] + s[1];
        } else if (r < 0.6) k = 2 * pick(rng, vals);
        else if (r < 0.8 && vals.length >= 2) {
          const s = shuffle(rng, vals.slice());
          k = s[0] + s[1] + pick(rng, [-1, 1]);
        } else k = ri(rng, -100000, 100000);
        return { input: `${fmtTree(t)}\n${k}`, expectedOutput: String(ref(t, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findTarget(root: Optional[TreeNode], k: int) -> bool:
              seen = set()
              stack = [root] if root is not None else []
              while stack:
                  node = stack.pop()
                  if k - node.val in seen:
                      return True
                  seen.add(node.val)
                  if node.left is not None:
                      stack.append(node.left)
                  if node.right is not None:
                      stack.append(node.right)
              return False
        `,
        javascript: code`
          var findTarget = function(root, k) {
              var seen = new Set();
              var stack = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  if (seen.has(k - node.val)) return true;
                  seen.add(node.val);
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return false;
          };
        `,
        typescript: code`
          function findTarget(root: TreeNode | null, k: number): boolean {
              var seen: { [v: number]: boolean } = {};
              var stack: TreeNode[] = root === null ? [] : [root];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  if (seen[k - node.val]) return true;
                  seen[node.val] = true;
                  if (node.left !== null) stack.push(node.left);
                  if (node.right !== null) stack.push(node.right);
              }
              return false;
          }
        `,
        java: code`
          public static boolean findTarget(TreeNode root, int k) {
              Set<Integer> seen = new HashSet<>();
              Deque<TreeNode> stack = new ArrayDeque<>();
              if (root != null) stack.push(root);
              while (!stack.isEmpty()) {
                  TreeNode node = stack.pop();
                  if (seen.contains(k - node.val)) return true;
                  seen.add(node.val);
                  if (node.left != null) stack.push(node.left);
                  if (node.right != null) stack.push(node.right);
              }
              return false;
          }
        `,
        cpp: code`
          bool findTarget(TreeNode* root, int k) {
              unordered_set<int> seen;
              vector<TreeNode*> stack;
              if (root) stack.push_back(root);
              while (!stack.empty()) {
                  TreeNode* node = stack.back();
                  stack.pop_back();
                  if (seen.count(k - node->val)) return true;
                  seen.insert(node->val);
                  if (node->left) stack.push_back(node->left);
                  if (node->right) stack.push_back(node->right);
              }
              return false;
          }
        `,
        c: code`
          bool findTarget(struct TreeNode* root, int k) {
              // Values lie in [-10^4, 10^4]: a presence table replaces the hash set.
              static bool seen[20001];
              memset(seen, 0, sizeof(seen));
              struct TreeNode* stack[10001];
              int top = 0;
              bool found = false;
              if (root != NULL) stack[top++] = root;
              while (top > 0 && !found) {
                  struct TreeNode* node = stack[--top];
                  int want = k - node->val;
                  if (want >= -10000 && want <= 10000 && seen[want + 10000]) found = true;
                  seen[node->val + 10000] = true;
                  if (node->left != NULL) stack[top++] = node->left;
                  if (node->right != NULL) stack[top++] = node->right;
              }
              return found;
          }
        `,
        csharp: code`
          public static bool FindTarget(TreeNode root, int k)
          {
              var seen = new HashSet<int>();
              var stack = new Stack<TreeNode>();
              if (root != null) stack.Push(root);
              while (stack.Count > 0)
              {
                  TreeNode node = stack.Pop();
                  if (seen.Contains(k - node.val)) return true;
                  seen.Add(node.val);
                  if (node.left != null) stack.Push(node.left);
                  if (node.right != null) stack.Push(node.right);
              }
              return false;
          }
        `,
        go: code`
          func findTarget(root *TreeNode, k int) bool {
              seen := map[int]bool{}
              stack := []*TreeNode{}
              if root != nil {
                  stack = append(stack, root)
              }
              for len(stack) > 0 {
                  node := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  if seen[k-node.Val] {
                      return true
                  }
                  seen[node.Val] = true
                  if node.Left != nil {
                      stack = append(stack, node.Left)
                  }
                  if node.Right != nil {
                      stack = append(stack, node.Right)
                  }
              }
              return false
          }
        `,
        kotlin: kt(code`
          fun findTarget(root: TreeNode?, k: Int): Boolean {
              val seen = HashSet<Int>()
              val stack = ArrayList<TreeNode>()
              if (root != null) stack.add(root)
              while (stack.isNotEmpty()) {
                  val node = stack.removeAt(stack.size - 1)
                  if (seen.contains(k - node.@val)) return true
                  seen.add(node.@val)
                  val l = node.left
                  if (l != null) stack.add(l)
                  val r = node.right
                  if (r != null) stack.add(r)
              }
              return false
          }
        `),
        swift: code`
          func findTarget(_ root: TreeNode?, _ k: Int) -> Bool {
              var seen = Set<Int>()
              var stack = [TreeNode]()
              if let r = root { stack.append(r) }
              while !stack.isEmpty {
                  let node = stack.removeLast()
                  if seen.contains(k - node.val) { return true }
                  seen.insert(node.val)
                  if let l = node.left { stack.append(l) }
                  if let r = node.right { stack.append(r) }
              }
              return false
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashSet;

          fn findTarget(root: Option<Rc<RefCell<TreeNode>>>, k: i32) -> bool {
              let mut seen: HashSet<i32> = HashSet::new();
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  stack.push(r);
              }
              while let Some(rc) = stack.pop() {
                  let node = rc.borrow();
                  if seen.contains(&(k - node.val)) {
                      return true;
                  }
                  seen.insert(node.val);
                  if let Some(l) = node.left.clone() {
                      stack.push(l);
                  }
                  if let Some(r) = node.right.clone() {
                      stack.push(r);
                  }
              }
              false
          }
        `,
        php: code`
          function findTarget($root, $k) {
              $seen = [];
              $stack = [];
              if ($root !== null) $stack[] = $root;
              while (count($stack) > 0) {
                  $node = array_pop($stack);
                  if (isset($seen[$k - $node->val])) return true;
                  $seen[$node->val] = true;
                  if ($node->left !== null) $stack[] = $node->left;
                  if ($node->right !== null) $stack[] = $node->right;
              }
              return false;
          }
        `,
        ruby: code`
          require 'set'

          def findTarget(root, k)
            seen = Set.new
            stack = root.nil? ? [] : [root]
            until stack.empty?
              node = stack.pop
              return true if seen.include?(k - node.val)
              seen << node.val
              stack << node.left unless node.left.nil?
              stack << node.right unless node.right.nil?
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Second Minimum Node In a Binary Tree (LC 671) ───────────────
  (() => {
    const MAXV = 2147483647;
    const ref = (root: TNode | null) => {
      if (!root) return -1;
      let best = -1;
      for (const n of nodesOf(root)) if (n.val > root.val && (best === -1 || n.val < best)) best = n.val;
      return best;
    };
    /** A "special" tree: every node has 0 or 2 children, and a parent's value is the smaller of its children's. */
    const special = (rng: Rng, maxNodes: number, rootVal: number, step: number): TNode => {
      const budget = { left: maxNodes - 1 };
      const build = (v: number): TNode => {
        const node: TNode = { val: v, left: null, right: null };
        if (budget.left >= 2 && rng() < 0.85) {
          budget.left -= 2;
          const other = rng() < 0.2 || v === MAXV ? v : v + ri(rng, 1, Math.min(step, MAXV - v));
          const a = build(v), b = build(other);
          if (rng() < 0.5) { node.left = a; node.right = b; } else { node.left = b; node.right = a; }
        }
        return node;
      };
      return build(rootVal);
    };
    return {
      slug: "second-minimum-node-in-a-binary-tree",
      title: "Second Minimum Node In a Binary Tree",
      difficulty: "EASY" as const,
      tags: ["Tree", "Depth-First Search", "LinkedIn", "Amazon", "Microsoft"],
      signature: { funcName: "findSecondMinimumValue", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a non-empty **special** binary tree of positive values: every node has either **zero or two** children, and a node with two children holds the **smaller** of its two children's values — `node.val == min(node.left.val, node.right.val)`.\n\nReturn the **second smallest distinct value** in the whole tree, or `-1` if there is none (all values are equal).",
        [
          { in: "root = [2,2,5,null,null,5,7]", out: "5", note: "The smallest value is 2 and the next distinct value is 5." },
          { in: "root = [2,2,2]", out: "-1", note: "Every value is 2, so there is no second distinct value." },
          { in: "root = [5,5,2147483647]", out: "2147483647", note: "Values may reach 2^31 - 1, so do not use that number as an 'unset' marker." },
        ],
        ["The number of nodes in the tree is in the range [1, 25]", "1 <= Node.val <= 2^31 - 1", "Every node has 0 or 2 children, and `root.val == min(root.left.val, root.right.val)` at every node with children"]),
      hints: [
        "The rule `node.val == min(children)` forces the root to hold the smallest value of the whole tree.",
        "So the answer is the smallest value strictly greater than `root.val`.",
        "Once a node's value exceeds `root.val`, everything below it is at least that large — it is a candidate, and its subtree need not be explored further.",
      ],
      editorial: explain({
        idea: "Because every parent holds the minimum of its children, the root holds the global minimum, and every subtree's root is the minimum of that subtree. The answer is the smallest value above `root.val`, and a search can stop descending at the first node above it on each path.",
        steps: [
          "Let `m = root.val`.",
          "DFS from the root. At a node with value greater than `m`, return its value as a candidate (its descendants are no smaller).",
          "At a node equal to `m`, return the smaller of its children's candidates, ignoring children that found none.",
          "If no candidate exists anywhere, return -1.",
        ],
        why: "Every node's value is the minimum of its subtree, so if a node exceeds `m` its whole subtree is at least its value and contributes nothing smaller. Only nodes equal to `m` can hide a smaller second value below them, and those are exactly the ones the search descends through.",
        time: "O(n)",
        space: "O(h) recursion depth",
        pitfalls: [
          "Values go up to `2^31 - 1`; use a 64-bit sentinel or an explicit 'not found', not `INT_MAX`, for 'no candidate'.",
          "The second minimum must be distinct: duplicates of the minimum do not count.",
          "Searching only the root's two children is not enough — the second value may sit deeper under a child equal to the root.",
        ],
      }),
      examples: [
        { input: T([2, 2, 5, null, null, 5, 7]), expectedOutput: "5" },
        { input: T([2, 2, 2]), expectedOutput: "-1" },
        { input: T([5, 5, MAXV]), expectedOutput: String(MAXV) },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [1, 5, 100, MAXV]);
        const rootVal = ri(rng, 1, top);
        const step = pick(rng, [1, 3, 1000, MAXV]);
        const t = special(rng, ri(rng, 1, pick(rng, [1, 7, 15, 25, 25])), rootVal, step);
        return { input: fmtTree(t), expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def findSecondMinimumValue(root: Optional[TreeNode]) -> int:
              m = root.val

              def search(node):
                  # The smallest value above m in this subtree, or -1.
                  if node is None:
                      return -1
                  if node.val > m:
                      return node.val
                  a = search(node.left)
                  b = search(node.right)
                  if a == -1:
                      return b
                  if b == -1:
                      return a
                  return min(a, b)

              return search(root)
        `,
        javascript: code`
          var findSecondMinimumValue = function(root) {
              return secondSearch(root, root.val);
          };

          var secondSearch = function(node, m) {
              if (node === null) return -1;
              if (node.val > m) return node.val;
              var a = secondSearch(node.left, m);
              var b = secondSearch(node.right, m);
              if (a === -1) return b;
              if (b === -1) return a;
              return Math.min(a, b);
          };
        `,
        typescript: code`
          function findSecondMinimumValue(root: TreeNode | null): number {
              if (root === null) return -1;
              return secondSearch(root, root.val);
          }

          function secondSearch(node: TreeNode | null, m: number): number {
              if (node === null) return -1;
              if (node.val > m) return node.val;
              var a = secondSearch(node.left, m);
              var b = secondSearch(node.right, m);
              if (a === -1) return b;
              if (b === -1) return a;
              return Math.min(a, b);
          }
        `,
        java: code`
          public static int findSecondMinimumValue(TreeNode root) {
              return (int) secondSearch(root, root.val);
          }

          static long secondSearch(TreeNode node, int m) {
              if (node == null) return -1;
              if (node.val > m) return node.val;
              long a = secondSearch(node.left, m);
              long b = secondSearch(node.right, m);
              if (a == -1) return b;
              if (b == -1) return a;
              return Math.min(a, b);
          }
        `,
        cpp: code`
          long long secondSearch(TreeNode* node, int m) {
              if (!node) return -1;
              if (node->val > m) return node->val;
              long long a = secondSearch(node->left, m);
              long long b = secondSearch(node->right, m);
              if (a == -1) return b;
              if (b == -1) return a;
              return min(a, b);
          }

          int findSecondMinimumValue(TreeNode* root) {
              return (int) secondSearch(root, root->val);
          }
        `,
        c: code`
          static long long secondSearch(struct TreeNode* node, int m) {
              if (node == NULL) return -1;
              if (node->val > m) return node->val;
              long long a = secondSearch(node->left, m);
              long long b = secondSearch(node->right, m);
              if (a == -1) return b;
              if (b == -1) return a;
              return a < b ? a : b;
          }

          int findSecondMinimumValue(struct TreeNode* root) {
              return (int) secondSearch(root, root->val);
          }
        `,
        csharp: code`
          public static int FindSecondMinimumValue(TreeNode root)
          {
              return (int) SecondSearch(root, root.val);
          }

          static long SecondSearch(TreeNode node, int m)
          {
              if (node == null) return -1;
              if (node.val > m) return node.val;
              long a = SecondSearch(node.left, m);
              long b = SecondSearch(node.right, m);
              if (a == -1) return b;
              if (b == -1) return a;
              return Math.Min(a, b);
          }
        `,
        go: code`
          func findSecondMinimumValue(root *TreeNode) int {
              return secondSearch(root, root.Val)
          }

          func secondSearch(node *TreeNode, m int) int {
              if node == nil {
                  return -1
              }
              if node.Val > m {
                  return node.Val
              }
              a := secondSearch(node.Left, m)
              b := secondSearch(node.Right, m)
              if a == -1 {
                  return b
              }
              if b == -1 || a < b {
                  return a
              }
              return b
          }
        `,
        kotlin: kt(code`
          fun findSecondMinimumValue(root: TreeNode?): Int {
              if (root == null) return -1
              return secondSearch(root, root.@val).toInt()
          }

          fun secondSearch(node: TreeNode?, m: Int): Long {
              if (node == null) return -1L
              if (node.@val > m) return node.@val.toLong()
              val a = secondSearch(node.left, m)
              val b = secondSearch(node.right, m)
              if (a == -1L) return b
              if (b == -1L) return a
              return minOf(a, b)
          }
        `),
        swift: code`
          func findSecondMinimumValue(_ root: TreeNode?) -> Int {
              guard let r = root else { return -1 }
              return secondSearch(r, r.val)
          }

          func secondSearch(_ node: TreeNode?, _ m: Int) -> Int {
              guard let n = node else { return -1 }
              if n.val > m { return n.val }
              let a = secondSearch(n.left, m)
              let b = secondSearch(n.right, m)
              if a == -1 { return b }
              if b == -1 { return a }
              return min(a, b)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findSecondMinimumValue(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let m = match &root {
                  None => return -1,
                  Some(rc) => rc.borrow().val,
              };
              second_search(&root, m) as i32
          }

          fn second_search(node: &Option<Rc<RefCell<TreeNode>>>, m: i32) -> i64 {
              match node {
                  None => -1,
                  Some(rc) => {
                      let n = rc.borrow();
                      if n.val > m {
                          return n.val as i64;
                      }
                      let a = second_search(&n.left, m);
                      let b = second_search(&n.right, m);
                      if a == -1 {
                          b
                      } else if b == -1 {
                          a
                      } else {
                          a.min(b)
                      }
                  }
              }
          }
        `,
        php: code`
          function findSecondMinimumValue($root) {
              return secondSearch($root, $root->val);
          }

          function secondSearch($node, $m) {
              if ($node === null) return -1;
              if ($node->val > $m) return $node->val;
              $a = secondSearch($node->left, $m);
              $b = secondSearch($node->right, $m);
              if ($a == -1) return $b;
              if ($b == -1) return $a;
              return min($a, $b);
          }
        `,
        ruby: code`
          def findSecondMinimumValue(root)
            second_search(root, root.val)
          end

          def second_search(node, m)
            return -1 if node.nil?
            return node.val if node.val > m
            a = second_search(node.left, m)
            b = second_search(node.right, m)
            return b if a == -1
            return a if b == -1
            [a, b].min
          end
        `,
      },
    };
  })(),

];

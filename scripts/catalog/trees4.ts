/**
 * Binary tree problems, medium — wave 7, batch 30.
 * Real problems only: LeetCode's Medium tree classics (BST edits, level-order
 * scans, subtree sums, tree construction, distances and shape checks).
 * Worked examples are phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a tree is LeetCode's level order
 * with `null` for a missing child and trailing nulls dropped, `[]` for the
 * empty tree; every input and expected output goes through
 * `fmtTree(treeFrom(…))` so it is always canonical. The node types are the
 * judge's — no solution redefines them. Where LeetCode accepts more than one
 * answer the statement fixes one: Delete Node in a BST replaces a node with
 * two children by its in-order successor, Insert into a BST adds a new leaf
 * where the search falls off, and the "any order" lists (Most Frequent
 * Subtree Sum, All Nodes Distance K) are sorted ascending. LeetCode's `val`
 * parameter is called `value` (Kotlin reserves the word).
 *
 * Judge contract: no input or output holds a `__CODEKAIRO_` sentinel; JS
 * solutions are Node 12-safe (no ??, ?., at(), replaceAll, flat or flatMap);
 * the C harness has no math.h or limits.h; Go may use only the driver's
 * imports (no sort, no strconv); Rust is 1.40 (`std::i32::MAX`, no
 * `matches!`). Each solution's main function comes first — C and C++ declare
 * their helpers with a prototype above it.
 *
 * Kotlin reads a node's value as `` n.`val` ``, which a code`…` block cannot
 * hold, so the Kotlin solutions write `@val` and `kt` swaps the quoted name in.
 *
 * Generated trees stay at or under ~40 nodes so 5,000 hidden cases run well
 * inside the judge's 15 CPU seconds in Python, Ruby and PHP; the statements
 * keep LeetCode's constraints. Maximum Width of Binary Tree keeps its hidden
 * trees at most 31 levels deep, so the width — which LeetCode promises fits
 * a 32-bit integer — provably does.
 */
import {
  code, describe, explain, fmtIntArr, fmtTree, pick, randBST, randTree, ri, shuffle, treeFrom,
  type CatalogProblem, type Rng, type TNode,
} from "./types.js";

/** Kotlin's TreeNode field is `val`, a keyword: written `@val` inside code blocks. */
const kt = (s: string) => s.split("@val").join("`val`");

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
const leaf = (v: number): TNode => ({ val: v, left: null, right: null });

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
    const root = leaf(ri(rng, lo, hi));
    let cur = root;
    for (let i = 1; i < n; i++) {
      const c = leaf(ri(rng, lo, hi));
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
  const root = leaf(ri(rng, lo, hi));
  const nodes: Array<[TNode, number]> = [[root, 1]];
  let guard = 0;
  while (nodes.length < n && guard++ < 50 * n) {
    const [p, d] = nodes[ri(rng, 0, nodes.length - 1)];
    if (d >= maxDepth) continue;
    const side = rng() < 0.5 ? "left" : "right";
    if (!p[side]) { const c = leaf(ri(rng, lo, hi)); p[side] = c; nodes.push([c, d + 1]); }
  }
  return root;
}

/** Inserts each value as a new leaf of a binary search tree, in order. */
function bstOf(vals: number[]): TNode | null {
  let root: TNode | null = null;
  for (const v of vals) {
    const node = leaf(v);
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

export const TREES4_PROBLEMS: CatalogProblem[] = [

  // ── Delete Node in a BST (LC 450) ───────────────────────────────
  (() => {
    const del = (n: TNode | null, key: number): TNode | null => {
      if (!n) return null;
      if (key < n.val) n.left = del(n.left, key);
      else if (key > n.val) n.right = del(n.right, key);
      else {
        if (!n.left) return n.right;
        if (!n.right) return n.left;
        let s = n.right;
        while (s.left) s = s.left;
        n.val = s.val;
        n.right = del(n.right, s.val);
      }
      return n;
    };
    const ref = (root: TNode | null, key: number) => del(cloneTree(root), key);
    const EX = [
      { root: [5, 3, 6, 2, 4, null, 7], key: 3, note: "Node 3 has two children, so it takes the value of its in-order successor 4 (the smallest value in its right subtree), and that leaf is removed." },
      { root: [5, 3, 6, 2, 4, null, 7], key: 5, note: "The root's successor is 6; 6 moves up into the root and its old node is replaced by its only child 7." },
      { root: [], key: 0, note: "There is nothing to delete in an empty tree." },
    ];
    return {
      slug: "delete-node-in-a-bst",
      title: "Delete Node in a BST",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Recursion", "Amazon", "Microsoft", "Bloomberg"],
      signature: { funcName: "deleteNode", params: [{ name: "root", type: "TreeNode" as const }, { name: "key", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree with distinct values and an integer `key`. Remove the node holding `key`, if there is one, and return the root of the resulting tree, which must still be a binary search tree.\n\nSeveral trees are valid after a deletion, so delete this way:\n- a node with no children is simply removed;\n- a node with one child is replaced by that child;\n- a node with two children takes the value of its **in-order successor** (the smallest value in its right subtree), and then that successor is deleted from the right subtree by the same rules.\n\nIf no node holds `key`, return the tree unchanged.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, key = ${e.key}`, out: fmtTree(ref(treeFrom(e.root), e.key)), note: e.note })),
        ["The number of nodes in the tree is in the range [0, 10^4]", "-10^5 <= Node.val <= 10^5", "Each node has a unique value", "root is a valid binary search tree", "-10^5 <= key <= 10^5"],
        "Can you do it in O(height of tree) time?"),
      hints: [
        "First find the node: the search-tree order tells you at every step whether `key` is to the left or the right.",
        "Removing a leaf or a node with one child is easy — its parent simply points at the child (or at nothing). The hard case is a node with two children.",
        "For two children, copy the in-order successor's value into the node (the leftmost node of its right subtree) and then delete that value from the right subtree; the successor has no left child, so that second deletion is one of the easy cases.",
      ],
      editorial: explain({
        idea: "Write the deletion as a recursive function that returns the new root of the subtree it was given. Searching moves left or right by comparing with `key`; at the node itself, the number of children decides how it is removed.",
        steps: [
          "If the subtree is empty, return null — the key is not there.",
          "If `key < node.val`, set `node.left = deleteNode(node.left, key)`; if `key > node.val`, do the same on the right. Return `node`.",
          "Otherwise this is the node to delete. If it has no left child, return its right child; if it has no right child, return its left child.",
          "With two children, walk to the leftmost node of the right subtree, copy its value into `node`, then set `node.right = deleteNode(node.right, thatValue)`.",
        ],
        why: "The in-order successor is larger than everything in the left subtree and smaller than everything else in the right subtree, so placing its value at the node keeps the search-tree order. The successor has no left child, so deleting it from the right subtree falls into the zero- or one-child case and does not cascade further.",
        time: "O(h), where h is the height of the tree — one search path, plus one more down the right subtree",
        space: "O(h) for the recursion",
        pitfalls: [
          "Return the subtree's new root from every call and assign it back to the parent's link — that is how a removed node actually disappears.",
          "Deleting the root itself must also work: the function's return value is the new root.",
          "Use the successor, as the statement fixes; using the in-order predecessor also gives a valid search tree, but a different one.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.key}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.key)) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const span = pick(rng, [n + 5, 100, 100000]);
        const root = randBST(rng, n, -span, span);
        const vals = nodesOf(root).map((x) => x.val);
        let key: number;
        if (vals.length && rng() < 0.75) key = pick(rng, vals);
        else { do key = ri(rng, -span, span); while (vals.indexOf(key) >= 0); }
        return { input: `${fmtTree(root)}\n${key}`, expectedOutput: fmtTree(ref(root, key)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteNode(root: Optional[TreeNode], key: int) -> Optional[TreeNode]:
              if root is None:
                  return None
              if key < root.val:
                  root.left = deleteNode(root.left, key)
              elif key > root.val:
                  root.right = deleteNode(root.right, key)
              else:
                  if root.left is None:
                      return root.right
                  if root.right is None:
                      return root.left
                  succ = root.right
                  while succ.left is not None:
                      succ = succ.left
                  root.val = succ.val
                  root.right = deleteNode(root.right, succ.val)
              return root
        `,
        javascript: code`
          var deleteNode = function(root, key) {
              if (root === null) return null;
              if (key < root.val) root.left = deleteNode(root.left, key);
              else if (key > root.val) root.right = deleteNode(root.right, key);
              else {
                  if (root.left === null) return root.right;
                  if (root.right === null) return root.left;
                  var succ = root.right;
                  while (succ.left !== null) succ = succ.left;
                  root.val = succ.val;
                  root.right = deleteNode(root.right, succ.val);
              }
              return root;
          };
        `,
        typescript: code`
          function deleteNode(root: TreeNode | null, key: number): TreeNode | null {
              if (root === null) return null;
              if (key < root.val) root.left = deleteNode(root.left, key);
              else if (key > root.val) root.right = deleteNode(root.right, key);
              else {
                  if (root.left === null) return root.right;
                  if (root.right === null) return root.left;
                  var succ: TreeNode = root.right;
                  while (succ.left !== null) succ = succ.left;
                  root.val = succ.val;
                  root.right = deleteNode(root.right, succ.val);
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode deleteNode(TreeNode root, int key) {
              if (root == null) return null;
              if (key < root.val) root.left = deleteNode(root.left, key);
              else if (key > root.val) root.right = deleteNode(root.right, key);
              else {
                  if (root.left == null) return root.right;
                  if (root.right == null) return root.left;
                  TreeNode succ = root.right;
                  while (succ.left != null) succ = succ.left;
                  root.val = succ.val;
                  root.right = deleteNode(root.right, succ.val);
              }
              return root;
          }
        `,
        cpp: code`
          TreeNode* deleteNode(TreeNode* root, int key) {
              if (!root) return nullptr;
              if (key < root->val) root->left = deleteNode(root->left, key);
              else if (key > root->val) root->right = deleteNode(root->right, key);
              else {
                  if (!root->left) return root->right;
                  if (!root->right) return root->left;
                  TreeNode* succ = root->right;
                  while (succ->left) succ = succ->left;
                  root->val = succ->val;
                  root->right = deleteNode(root->right, succ->val);
              }
              return root;
          }
        `,
        c: code`
          struct TreeNode* deleteNode(struct TreeNode* root, int key) {
              if (root == NULL) return NULL;
              if (key < root->val) root->left = deleteNode(root->left, key);
              else if (key > root->val) root->right = deleteNode(root->right, key);
              else {
                  if (root->left == NULL) return root->right;
                  if (root->right == NULL) return root->left;
                  struct TreeNode* succ = root->right;
                  while (succ->left != NULL) succ = succ->left;
                  root->val = succ->val;
                  root->right = deleteNode(root->right, succ->val);
              }
              return root;
          }
        `,
        csharp: code`
          public static TreeNode DeleteNode(TreeNode root, int key)
          {
              if (root == null) return null;
              if (key < root.val) root.left = DeleteNode(root.left, key);
              else if (key > root.val) root.right = DeleteNode(root.right, key);
              else
              {
                  if (root.left == null) return root.right;
                  if (root.right == null) return root.left;
                  TreeNode succ = root.right;
                  while (succ.left != null) succ = succ.left;
                  root.val = succ.val;
                  root.right = DeleteNode(root.right, succ.val);
              }
              return root;
          }
        `,
        go: code`
          func deleteNode(root *TreeNode, key int) *TreeNode {
              if root == nil {
                  return nil
              }
              if key < root.Val {
                  root.Left = deleteNode(root.Left, key)
              } else if key > root.Val {
                  root.Right = deleteNode(root.Right, key)
              } else {
                  if root.Left == nil {
                      return root.Right
                  }
                  if root.Right == nil {
                      return root.Left
                  }
                  succ := root.Right
                  for succ.Left != nil {
                      succ = succ.Left
                  }
                  root.Val = succ.Val
                  root.Right = deleteNode(root.Right, succ.Val)
              }
              return root
          }
        `,
        kotlin: kt(code`
          fun deleteNode(root: TreeNode?, key: Int): TreeNode? {
              if (root == null) return null
              if (key < root.@val) root.left = deleteNode(root.left, key)
              else if (key > root.@val) root.right = deleteNode(root.right, key)
              else {
                  if (root.left == null) return root.right
                  if (root.right == null) return root.left
                  var succ: TreeNode = root.right!!
                  while (succ.left != null) succ = succ.left!!
                  root.@val = succ.@val
                  root.right = deleteNode(root.right, succ.@val)
              }
              return root
          }
        `),
        swift: code`
          func deleteNode(_ root: TreeNode?, _ key: Int) -> TreeNode? {
              guard let node = root else { return nil }
              if key < node.val {
                  node.left = deleteNode(node.left, key)
              } else if key > node.val {
                  node.right = deleteNode(node.right, key)
              } else {
                  guard let left = node.left else { return node.right }
                  guard var succ = node.right else { return left }
                  while let next = succ.left { succ = next }
                  node.val = succ.val
                  node.right = deleteNode(node.right, succ.val)
              }
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn deleteNode(root: Option<Rc<RefCell<TreeNode>>>, key: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let node = match root {
                  None => return None,
                  Some(n) => n,
              };
              let v = node.borrow().val;
              if key < v {
                  let l = node.borrow_mut().left.take();
                  let nl = deleteNode(l, key);
                  node.borrow_mut().left = nl;
              } else if key > v {
                  let r = node.borrow_mut().right.take();
                  let nr = deleteNode(r, key);
                  node.borrow_mut().right = nr;
              } else {
                  let l = node.borrow().left.clone();
                  let r = node.borrow().right.clone();
                  if l.is_none() {
                      return r;
                  }
                  if r.is_none() {
                      return l;
                  }
                  let mut succ = r.unwrap();
                  loop {
                      let next = succ.borrow().left.clone();
                      match next {
                          Some(x) => succ = x,
                          None => break,
                      }
                  }
                  let sv = succ.borrow().val;
                  node.borrow_mut().val = sv;
                  let right = node.borrow_mut().right.take();
                  let nr = deleteNode(right, sv);
                  node.borrow_mut().right = nr;
              }
              Some(node)
          }
        `,
        php: code`
          function deleteNode($root, $key) {
              if ($root === null) return null;
              if ($key < $root->val) $root->left = deleteNode($root->left, $key);
              elseif ($key > $root->val) $root->right = deleteNode($root->right, $key);
              else {
                  if ($root->left === null) return $root->right;
                  if ($root->right === null) return $root->left;
                  $succ = $root->right;
                  while ($succ->left !== null) $succ = $succ->left;
                  $root->val = $succ->val;
                  $root->right = deleteNode($root->right, $succ->val);
              }
              return $root;
          }
        `,
        ruby: code`
          def deleteNode(root, key)
            return nil if root.nil?
            if key < root.val
              root.left = deleteNode(root.left, key)
            elsif key > root.val
              root.right = deleteNode(root.right, key)
            else
              return root.right if root.left.nil?
              return root.left if root.right.nil?
              succ = root.right
              succ = succ.left until succ.left.nil?
              root.val = succ.val
              root.right = deleteNode(root.right, succ.val)
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Most Frequent Subtree Sum (LC 508) ──────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const cnt = new Map<number, number>();
      const sum = (n: TNode | null): number => {
        if (!n) return 0;
        const s = n.val + sum(n.left) + sum(n.right);
        cnt.set(s, (cnt.get(s) || 0) + 1);
        return s;
      };
      sum(root);
      let best = 0;
      cnt.forEach((c) => { if (c > best) best = c; });
      return [...cnt.keys()].filter((k) => cnt.get(k) === best).sort((a, b) => a - b);
    };
    const EX = [
      { root: [5, 2, -3], note: "The three subtree sums are 2, -3 and 4; each occurs once, so all of them are returned, smallest first." },
      { root: [5, 2, -5], note: "The sums are 2, -5 and 2 — the root's subtree also adds up to 2, so 2 occurs twice." },
      { root: [3, -1, -1, 1, null, null, 1], note: "The two leaves give 1 and 1, the two -1 nodes give 0 and 0, and the whole tree gives 3. Both 0 and 1 occur twice." },
    ];
    return {
      slug: "most-frequent-subtree-sum",
      title: "Most Frequent Subtree Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Tree", "Depth-First Search", "Amazon", "Google"],
      signature: { funcName: "findFrequentTreeSum", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "The **subtree sum** of a node is the sum of the values of every node in the subtree rooted at it, the node itself included.\n\nGiven the `root` of a binary tree, find the subtree sum (or sums) that occur most often among all its nodes. If several sums tie for the highest frequency, return all of them, **sorted in ascending order**.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 10^4]", "-10^5 <= Node.val <= 10^5"]),
      hints: [
        "A node's subtree sum is its own value plus the subtree sums of its two children — so compute the children first.",
        "One post-order walk gives every node's subtree sum; count how many times each sum appears in a hash map as you go.",
        "After the walk, find the highest count and collect every sum that reaches it, then sort them.",
      ],
      editorial: explain({
        idea: "Subtree sums compose bottom-up: a post-order DFS returns each subtree's sum to its parent, and recording every returned sum in a frequency map gives the counts in a single pass.",
        steps: [
          "Define `sum(node)`: 0 for an empty subtree; otherwise `node.val + sum(left) + sum(right)`.",
          "Before returning, increment `count[s]` for that node's sum `s`.",
          "Call `sum(root)`, then find the largest value in `count`.",
          "Collect every sum whose count equals it and sort them ascending.",
        ],
        why: "Every node's subtree sum is computed exactly once and recorded exactly once, so the map holds the true frequency of each sum; the answer is just the keys with the maximum frequency.",
        time: "O(n + k log k), where k is the number of tied sums — O(n log n) at worst",
        space: "O(n) for the map and the recursion",
        pitfalls: [
          "Sums can be negative and repeat — use a hash map, not an array indexed by sum.",
          "Every node counts, the leaves included, and the root's sum is the whole tree's total.",
          "Return all tied sums, sorted ascending as the statement fixes.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const span = pick(rng, [1, 2, 3, 10, 100000]);
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), -span, span);
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def findFrequentTreeSum(root: Optional[TreeNode]) -> List[int]:
              count = {}

              def total(node):
                  if node is None:
                      return 0
                  s = node.val + total(node.left) + total(node.right)
                  count[s] = count.get(s, 0) + 1
                  return s

              total(root)
              best = max(count.values())
              return sorted(s for s, c in count.items() if c == best)
        `,
        javascript: code`
          var findFrequentTreeSum = function(root) {
              var count = new Map();
              var total = function(node) {
                  if (node === null) return 0;
                  var s = node.val + total(node.left) + total(node.right);
                  count.set(s, (count.get(s) || 0) + 1);
                  return s;
              };
              total(root);
              var best = 0;
              count.forEach(function(c) { if (c > best) best = c; });
              var out = [];
              count.forEach(function(c, s) { if (c === best) out.push(s); });
              return out.sort(function(a, b) { return a - b; });
          };
        `,
        typescript: code`
          function findFrequentTreeSum(root: TreeNode | null): number[] {
              var count: { [key: string]: number } = {};
              var keys: number[] = [];
              var total = function(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var s = node.val + total(node.left) + total(node.right);
                  if (count[s] === undefined) { count[s] = 0; keys.push(s); }
                  count[s]++;
                  return s;
              };
              total(root);
              var best = 0;
              for (var i = 0; i < keys.length; i++) if (count[keys[i]] > best) best = count[keys[i]];
              var out: number[] = [];
              for (var j = 0; j < keys.length; j++) if (count[keys[j]] === best) out.push(keys[j]);
              return out.sort(function(a, b) { return a - b; });
          }
        `,
        java: code`
          public static int[] findFrequentTreeSum(TreeNode root) {
              Map<Integer, Integer> count = new HashMap<>();
              total(root, count);
              int best = 0;
              for (int c : count.values()) best = Math.max(best, c);
              List<Integer> out = new ArrayList<>();
              for (Map.Entry<Integer, Integer> e : count.entrySet()) if (e.getValue() == best) out.add(e.getKey());
              Collections.sort(out);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }

          static int total(TreeNode node, Map<Integer, Integer> count) {
              if (node == null) return 0;
              int s = node.val + total(node.left, count) + total(node.right, count);
              count.merge(s, 1, Integer::sum);
              return s;
          }
        `,
        cpp: code`
          int subtreeTotal(TreeNode* node, unordered_map<int, int>& count);

          vector<int> findFrequentTreeSum(TreeNode* root) {
              unordered_map<int, int> count;
              subtreeTotal(root, count);
              int best = 0;
              for (auto& e : count) best = max(best, e.second);
              vector<int> out;
              for (auto& e : count) if (e.second == best) out.push_back(e.first);
              sort(out.begin(), out.end());
              return out;
          }

          int subtreeTotal(TreeNode* node, unordered_map<int, int>& count) {
              if (!node) return 0;
              int s = node->val + subtreeTotal(node->left, count) + subtreeTotal(node->right, count);
              count[s]++;
              return s;
          }
        `,
        c: code`
          static int collectSums(struct TreeNode* node, int* sums, int* k);
          static int cmpInt(const void* a, const void* b);
          static int countNodes(struct TreeNode* t);

          int* findFrequentTreeSum(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              int* sums = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int k = 0;
              collectSums(root, sums, &k);
              qsort(sums, (size_t) k, sizeof(int), cmpInt);
              int best = 0;
              for (int i = 0; i < k; ) {
                  int j = i;
                  while (j < k && sums[j] == sums[i]) j++;
                  if (j - i > best) best = j - i;
                  i = j;
              }
              int* out = (int*) malloc((size_t) (k + 1) * sizeof(int));
              int m = 0;
              for (int i = 0; i < k; ) {
                  int j = i;
                  while (j < k && sums[j] == sums[i]) j++;
                  if (j - i == best) out[m++] = sums[i];
                  i = j;
              }
              free(sums);
              *returnSize = m;
              return out;
          }

          static int collectSums(struct TreeNode* node, int* sums, int* k) {
              if (node == NULL) return 0;
              int s = node->val + collectSums(node->left, sums, k) + collectSums(node->right, sums, k);
              sums[(*k)++] = s;
              return s;
          }

          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[] FindFrequentTreeSum(TreeNode root)
          {
              var count = new Dictionary<int, int>();
              Total(root, count);
              int best = count.Values.Max();
              return count.Where(e => e.Value == best).Select(e => e.Key).OrderBy(s => s).ToArray();
          }

          static int Total(TreeNode node, Dictionary<int, int> count)
          {
              if (node == null) return 0;
              int s = node.val + Total(node.left, count) + Total(node.right, count);
              count.TryGetValue(s, out int c);
              count[s] = c + 1;
              return s;
          }
        `,
        go: code`
          func findFrequentTreeSum(root *TreeNode) []int {
              count := map[int]int{}
              subtreeTotal(root, count)
              best := 0
              for _, c := range count {
                  if c > best {
                      best = c
                  }
              }
              out := []int{}
              for s, c := range count {
                  if c == best {
                      out = append(out, s)
                  }
              }
              for i := 1; i < len(out); i++ {
                  for j := i; j > 0 && out[j-1] > out[j]; j-- {
                      out[j-1], out[j] = out[j], out[j-1]
                  }
              }
              return out
          }

          func subtreeTotal(node *TreeNode, count map[int]int) int {
              if node == nil {
                  return 0
              }
              s := node.Val + subtreeTotal(node.Left, count) + subtreeTotal(node.Right, count)
              count[s]++
              return s
          }
        `,
        kotlin: kt(code`
          fun findFrequentTreeSum(root: TreeNode?): IntArray {
              val count = HashMap<Int, Int>()
              subtreeTotal(root, count)
              var best = 0
              for (c in count.values) if (c > best) best = c
              return count.filter { it.value == best }.keys.sorted().toIntArray()
          }

          fun subtreeTotal(node: TreeNode?, count: HashMap<Int, Int>): Int {
              if (node == null) return 0
              val s = node.@val + subtreeTotal(node.left, count) + subtreeTotal(node.right, count)
              count[s] = (count[s] ?: 0) + 1
              return s
          }
        `),
        swift: code`
          func findFrequentTreeSum(_ root: TreeNode?) -> [Int] {
              var count = [Int: Int]()
              subtreeTotal(root, &count)
              let best = count.values.max() ?? 0
              return count.filter { $0.value == best }.map { $0.key }.sorted()
          }

          @discardableResult
          func subtreeTotal(_ node: TreeNode?, _ count: inout [Int: Int]) -> Int {
              guard let n = node else { return 0 }
              let s = n.val + subtreeTotal(n.left, &count) + subtreeTotal(n.right, &count)
              count[s, default: 0] += 1
              return s
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;
          use std::collections::HashMap;

          fn findFrequentTreeSum(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut count: HashMap<i32, i32> = HashMap::new();
              subtree_total(&root, &mut count);
              let best = count.values().cloned().max().unwrap_or(0);
              let mut out: Vec<i32> = count.iter().filter(|e| *e.1 == best).map(|e| *e.0).collect();
              out.sort();
              out
          }

          fn subtree_total(node: &Option<Rc<RefCell<TreeNode>>>, count: &mut HashMap<i32, i32>) -> i32 {
              match node {
                  None => 0,
                  Some(n) => {
                      let (l, r, v) = {
                          let b = n.borrow();
                          (b.left.clone(), b.right.clone(), b.val)
                      };
                      let s = v + subtree_total(&l, count) + subtree_total(&r, count);
                      *count.entry(s).or_insert(0) += 1;
                      s
                  }
              }
          }
        `,
        php: code`
          function findFrequentTreeSum($root) {
              $count = [];
              subtreeTotal($root, $count);
              $best = max($count);
              $out = [];
              foreach ($count as $s => $c) if ($c == $best) $out[] = (int) $s;
              sort($out);
              return $out;
          }

          function subtreeTotal($node, &$count) {
              if ($node === null) return 0;
              $s = $node->val + subtreeTotal($node->left, $count) + subtreeTotal($node->right, $count);
              $count[$s] = ($count[$s] ?? 0) + 1;
              return $s;
          }
        `,
        ruby: code`
          def findFrequentTreeSum(root)
            count = Hash.new(0)
            subtree_total(root, count)
            best = count.values.max
            count.select { |_, c| c == best }.keys.sort
          end

          def subtree_total(node, count)
            return 0 if node.nil?
            s = node.val + subtree_total(node.left, count) + subtree_total(node.right, count)
            count[s] += 1
            s
          end
        `,
      },
    };
  })(),

  // ── Find Bottom Left Tree Value (LC 513) ────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let level: TNode[] = root ? [root] : [];
      let ans = 0;
      while (level.length) {
        ans = level[0].val;
        const next: TNode[] = [];
        for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        level = next;
      }
      return ans;
    };
    const EX = [
      { root: [2, 1, 3], note: "The last row is 1, 3; its leftmost value is 1." },
      { root: [1, 2, 3, 4, null, 5, 6, null, null, 7], note: "The deepest row holds only 7, the left child of 5." },
      { root: [1, null, 2, 3, 4], note: "The bottom row is 3, 4 — both in the root's right subtree. The leftmost node of the last row need not be a left child of anything near the root." },
    ];
    return {
      slug: "find-bottom-left-tree-value",
      title: "Find Bottom Left Tree Value",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "findBottomLeftValue", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a non-empty binary tree, return the value of the **leftmost node in its last row** — among the nodes at the greatest depth, the one furthest to the left.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 10^4]", "-2^31 <= Node.val <= 2^31 - 1"]),
      hints: [
        "A level-order (breadth-first) walk visits the tree row by row, each row from left to right.",
        "The first node of the last row is the answer — so remember the first value of every row; the last one remembered wins.",
        "A neat variant: walk each row right to left (enqueue the right child before the left). Then the very last node dequeued is the answer.",
      ],
      editorial: explain({
        idea: "Breadth-first search processes the tree one row at a time. If each row is processed from right to left, the final node taken off the queue lies in the deepest row and is the leftmost one there.",
        steps: [
          "Put the root in a queue.",
          "Repeatedly dequeue a node, record its value, then enqueue its right child and then its left child (when present).",
          "When the queue is empty, the last recorded value is the answer.",
        ],
        why: "BFS dequeues all nodes of one depth before any node of the next depth, so the last node dequeued is in the deepest row. Within a row, enqueuing right before left makes the row come out right to left, so the last node of the deepest row is its leftmost.",
        time: "O(n)",
        space: "O(w), where w is the widest row — O(n) at worst",
        pitfalls: [
          "The answer is the leftmost node of the deepest row, not the deepest node reached by always going left.",
          "Values span the whole 32-bit range; never use a value such as 0 or -1 as a 'not found' marker.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[-100, 100], [0, 9], [-2147483648, 2147483647]] as Array<[number, number]>);
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), lo, hi);
        if (rng() < 0.1) root!.val = pick(rng, [-2147483648, 2147483647]);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import Optional

          def findBottomLeftValue(root: Optional[TreeNode]) -> int:
              queue = deque([root])
              ans = root.val
              while queue:
                  node = queue.popleft()
                  ans = node.val
                  if node.right is not None:
                      queue.append(node.right)
                  if node.left is not None:
                      queue.append(node.left)
              return ans
        `,
        javascript: code`
          var findBottomLeftValue = function(root) {
              var queue = [root], head = 0, ans = root.val;
              while (head < queue.length) {
                  var node = queue[head++];
                  ans = node.val;
                  if (node.right !== null) queue.push(node.right);
                  if (node.left !== null) queue.push(node.left);
              }
              return ans;
          };
        `,
        typescript: code`
          function findBottomLeftValue(root: TreeNode | null): number {
              var queue: TreeNode[] = [root as TreeNode];
              var head = 0, ans = (root as TreeNode).val;
              while (head < queue.length) {
                  var node = queue[head++];
                  ans = node.val;
                  if (node.right !== null) queue.push(node.right);
                  if (node.left !== null) queue.push(node.left);
              }
              return ans;
          }
        `,
        java: code`
          public static int findBottomLeftValue(TreeNode root) {
              ArrayDeque<TreeNode> queue = new ArrayDeque<>();
              queue.add(root);
              int ans = root.val;
              while (!queue.isEmpty()) {
                  TreeNode node = queue.poll();
                  ans = node.val;
                  if (node.right != null) queue.add(node.right);
                  if (node.left != null) queue.add(node.left);
              }
              return ans;
          }
        `,
        cpp: code`
          int findBottomLeftValue(TreeNode* root) {
              queue<TreeNode*> q;
              q.push(root);
              int ans = root->val;
              while (!q.empty()) {
                  TreeNode* node = q.front();
                  q.pop();
                  ans = node->val;
                  if (node->right) q.push(node->right);
                  if (node->left) q.push(node->left);
              }
              return ans;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int findBottomLeftValue(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int head = 0, tail = 0;
              queue[tail++] = root;
              int ans = root->val;
              while (head < tail) {
                  struct TreeNode* node = queue[head++];
                  ans = node->val;
                  if (node->right != NULL) queue[tail++] = node->right;
                  if (node->left != NULL) queue[tail++] = node->left;
              }
              free(queue);
              return ans;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int FindBottomLeftValue(TreeNode root)
          {
              var queue = new Queue<TreeNode>();
              queue.Enqueue(root);
              int ans = root.val;
              while (queue.Count > 0)
              {
                  TreeNode node = queue.Dequeue();
                  ans = node.val;
                  if (node.right != null) queue.Enqueue(node.right);
                  if (node.left != null) queue.Enqueue(node.left);
              }
              return ans;
          }
        `,
        go: code`
          func findBottomLeftValue(root *TreeNode) int {
              queue := []*TreeNode{root}
              ans := root.Val
              for head := 0; head < len(queue); head++ {
                  node := queue[head]
                  ans = node.Val
                  if node.Right != nil {
                      queue = append(queue, node.Right)
                  }
                  if node.Left != nil {
                      queue = append(queue, node.Left)
                  }
              }
              return ans
          }
        `,
        kotlin: kt(code`
          fun findBottomLeftValue(root: TreeNode?): Int {
              val queue = ArrayList<TreeNode>()
              queue.add(root!!)
              var ans = root.@val
              var head = 0
              while (head < queue.size) {
                  val node = queue[head++]
                  ans = node.@val
                  node.right?.let { queue.add(it) }
                  node.left?.let { queue.add(it) }
              }
              return ans
          }
        `),
        swift: code`
          func findBottomLeftValue(_ root: TreeNode?) -> Int {
              var queue: [TreeNode] = [root!]
              var head = 0
              var ans = root!.val
              while head < queue.count {
                  let node = queue[head]
                  head += 1
                  ans = node.val
                  if let r = node.right { queue.append(r) }
                  if let l = node.left { queue.append(l) }
              }
              return ans
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn findBottomLeftValue(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut queue: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  queue.push(r);
              }
              let mut head = 0;
              let mut ans = 0;
              while head < queue.len() {
                  let node = queue[head].clone();
                  head += 1;
                  let b = node.borrow();
                  ans = b.val;
                  if let Some(r) = b.right.clone() {
                      queue.push(r);
                  }
                  if let Some(l) = b.left.clone() {
                      queue.push(l);
                  }
              }
              ans
          }
        `,
        php: code`
          function findBottomLeftValue($root) {
              $queue = [$root];
              $head = 0;
              $ans = $root->val;
              while ($head < count($queue)) {
                  $node = $queue[$head++];
                  $ans = $node->val;
                  if ($node->right !== null) $queue[] = $node->right;
                  if ($node->left !== null) $queue[] = $node->left;
              }
              return $ans;
          }
        `,
        ruby: code`
          def findBottomLeftValue(root)
            queue = [root]
            head = 0
            ans = root.val
            while head < queue.length
              node = queue[head]
              head += 1
              ans = node.val
              queue << node.right unless node.right.nil?
              queue << node.left unless node.left.nil?
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Find Largest Value in Each Tree Row (LC 515) ────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const out: number[] = [];
      let level: TNode[] = root ? [root] : [];
      while (level.length) {
        out.push(Math.max(...level.map((n) => n.val)));
        const next: TNode[] = [];
        for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        level = next;
      }
      return out;
    };
    const EX = [
      { root: [1, 3, 2, 5, 3, null, 9], note: "Row by row: {1}, {3, 2}, {5, 3, 9}. The largest of each is 1, 3 and 9." },
      { root: [1, 2, 3], note: "The second row holds 2 and 3." },
      { root: [], note: "An empty tree has no rows." },
    ];
    return {
      slug: "find-largest-value-in-each-tree-row",
      title: "Find Largest Value in Each Tree Row",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Meta", "LinkedIn", "Amazon"],
      signature: { funcName: "largestValues", params: [{ name: "root", type: "TreeNode" as const }], returns: "int[]" as const },
      description: describe(
        "Given the `root` of a binary tree, return an array whose `i`-th element is the **largest value in row `i`** of the tree (row 0 holds the root, row 1 its children, and so on).",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtIntArr(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [0, 10^4]", "-2^31 <= Node.val <= 2^31 - 1"]),
      hints: [
        "You need to know which nodes share a row — a breadth-first walk hands them to you one row at a time.",
        "Process the queue in batches: the queue's size at the start of a batch is exactly the number of nodes in that row.",
        "Start each row's maximum from its first node rather than from a sentinel — the values reach the full 32-bit range.",
      ],
      editorial: explain({
        idea: "Level-order traversal groups the nodes by row. Scanning each row while it is dequeued and keeping its maximum gives the answer in one pass.",
        steps: [
          "If the tree is empty, return an empty array.",
          "Put the root in a queue. While the queue is not empty, let `size` be its length.",
          "Dequeue `size` nodes, tracking the largest value among them and enqueuing their children.",
          "Append that row's largest value to the answer.",
        ],
        why: "At the start of each batch the queue holds exactly the nodes of one row — the previous batch enqueued precisely the children of the row before — so each batch's maximum is that row's maximum.",
        time: "O(n)",
        space: "O(w), the widest row — O(n) at worst",
        pitfalls: [
          "Values can be -2^31; starting a row's maximum at 0 or at -1 gives wrong answers on all-negative rows.",
          "Read the row size before the loop that dequeues it; the queue grows while the row is processed.",
          "An empty tree returns an empty array.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtIntArr(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const [lo, hi] = pick(rng, [[-100, 100], [-50, -1], [-2147483648, 2147483647]] as Array<[number, number]>);
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = shapeTree(rng, n, lo, hi);
        if (root && rng() < 0.1) root.val = pick(rng, [-2147483648, 2147483647]);
        return { input: fmtTree(root), expectedOutput: fmtIntArr(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def largestValues(root: Optional[TreeNode]) -> List[int]:
              out = []
              level = [root] if root is not None else []
              while level:
                  best = level[0].val
                  nxt = []
                  for node in level:
                      if node.val > best:
                          best = node.val
                      if node.left is not None:
                          nxt.append(node.left)
                      if node.right is not None:
                          nxt.append(node.right)
                  out.append(best)
                  level = nxt
              return out
        `,
        javascript: code`
          var largestValues = function(root) {
              var out = [];
              var level = root === null ? [] : [root];
              while (level.length > 0) {
                  var best = level[0].val, next = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.val > best) best = node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  out.push(best);
                  level = next;
              }
              return out;
          };
        `,
        typescript: code`
          function largestValues(root: TreeNode | null): number[] {
              var out: number[] = [];
              var level: TreeNode[] = root === null ? [] : [root];
              while (level.length > 0) {
                  var best = level[0].val;
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      var node = level[i];
                      if (node.val > best) best = node.val;
                      if (node.left !== null) next.push(node.left);
                      if (node.right !== null) next.push(node.right);
                  }
                  out.push(best);
                  level = next;
              }
              return out;
          }
        `,
        java: code`
          public static int[] largestValues(TreeNode root) {
              List<Integer> out = new ArrayList<>();
              ArrayDeque<TreeNode> queue = new ArrayDeque<>();
              if (root != null) queue.add(root);
              while (!queue.isEmpty()) {
                  int size = queue.size();
                  int best = queue.peek().val;
                  for (int i = 0; i < size; i++) {
                      TreeNode node = queue.poll();
                      best = Math.max(best, node.val);
                      if (node.left != null) queue.add(node.left);
                      if (node.right != null) queue.add(node.right);
                  }
                  out.add(best);
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> largestValues(TreeNode* root) {
              vector<int> out;
              queue<TreeNode*> q;
              if (root) q.push(root);
              while (!q.empty()) {
                  int size = (int) q.size();
                  int best = q.front()->val;
                  for (int i = 0; i < size; i++) {
                      TreeNode* node = q.front();
                      q.pop();
                      best = max(best, node->val);
                      if (node->left) q.push(node->left);
                      if (node->right) q.push(node->right);
                  }
                  out.push_back(best);
              }
              return out;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int* largestValues(struct TreeNode* root, int* returnSize) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int head = 0, tail = 0, k = 0;
              if (root != NULL) queue[tail++] = root;
              while (head < tail) {
                  int end = tail;
                  int best = queue[head]->val;
                  while (head < end) {
                      struct TreeNode* node = queue[head++];
                      if (node->val > best) best = node->val;
                      if (node->left != NULL) queue[tail++] = node->left;
                      if (node->right != NULL) queue[tail++] = node->right;
                  }
                  out[k++] = best;
              }
              free(queue);
              *returnSize = k;
              return out;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int[] LargestValues(TreeNode root)
          {
              var output = new List<int>();
              var queue = new Queue<TreeNode>();
              if (root != null) queue.Enqueue(root);
              while (queue.Count > 0)
              {
                  int size = queue.Count;
                  int best = queue.Peek().val;
                  for (int i = 0; i < size; i++)
                  {
                      TreeNode node = queue.Dequeue();
                      best = Math.Max(best, node.val);
                      if (node.left != null) queue.Enqueue(node.left);
                      if (node.right != null) queue.Enqueue(node.right);
                  }
                  output.Add(best);
              }
              return output.ToArray();
          }
        `,
        go: code`
          func largestValues(root *TreeNode) []int {
              out := []int{}
              level := []*TreeNode{}
              if root != nil {
                  level = append(level, root)
              }
              for len(level) > 0 {
                  best := level[0].Val
                  next := []*TreeNode{}
                  for _, node := range level {
                      if node.Val > best {
                          best = node.Val
                      }
                      if node.Left != nil {
                          next = append(next, node.Left)
                      }
                      if node.Right != nil {
                          next = append(next, node.Right)
                      }
                  }
                  out = append(out, best)
                  level = next
              }
              return out
          }
        `,
        kotlin: kt(code`
          fun largestValues(root: TreeNode?): IntArray {
              val out = ArrayList<Int>()
              var level = ArrayList<TreeNode>()
              if (root != null) level.add(root)
              while (level.isNotEmpty()) {
                  var best = level[0].@val
                  val next = ArrayList<TreeNode>()
                  for (node in level) {
                      if (node.@val > best) best = node.@val
                      node.left?.let { next.add(it) }
                      node.right?.let { next.add(it) }
                  }
                  out.add(best)
                  level = next
              }
              return out.toIntArray()
          }
        `),
        swift: code`
          func largestValues(_ root: TreeNode?) -> [Int] {
              var out = [Int]()
              var level = [TreeNode]()
              if let r = root { level.append(r) }
              while !level.isEmpty {
                  var best = level[0].val
                  var next = [TreeNode]()
                  for node in level {
                      if node.val > best { best = node.val }
                      if let l = node.left { next.append(l) }
                      if let r = node.right { next.append(r) }
                  }
                  out.append(best)
                  level = next
              }
              return out
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn largestValues(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32> {
              let mut out = Vec::new();
              let mut level: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              if let Some(r) = root {
                  level.push(r);
              }
              while !level.is_empty() {
                  let mut best = level[0].borrow().val;
                  let mut next = Vec::new();
                  for node in level.iter() {
                      let b = node.borrow();
                      if b.val > best {
                          best = b.val;
                      }
                      if let Some(l) = b.left.clone() {
                          next.push(l);
                      }
                      if let Some(r) = b.right.clone() {
                          next.push(r);
                      }
                  }
                  out.push(best);
                  level = next;
              }
              out
          }
        `,
        php: code`
          function largestValues($root) {
              $out = [];
              $level = $root === null ? [] : [$root];
              while (count($level) > 0) {
                  $best = $level[0]->val;
                  $next = [];
                  foreach ($level as $node) {
                      if ($node->val > $best) $best = $node->val;
                      if ($node->left !== null) $next[] = $node->left;
                      if ($node->right !== null) $next[] = $node->right;
                  }
                  $out[] = $best;
                  $level = $next;
              }
              return $out;
          }
        `,
        ruby: code`
          def largestValues(root)
            out = []
            level = root.nil? ? [] : [root]
            until level.empty?
              out << level.map(&:val).max
              nxt = []
              level.each do |node|
                nxt << node.left unless node.left.nil?
                nxt << node.right unless node.right.nil?
              end
              level = nxt
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Convert BST to Greater Tree (LC 538) ────────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const t = cloneTree(root);
      let acc = 0;
      const walk = (n: TNode | null) => {
        if (!n) return;
        walk(n.right);
        acc += n.val;
        n.val = acc;
        walk(n.left);
      };
      walk(t);
      return t;
    };
    const EX = [
      { root: [4, 1, 6, 0, 2, 5, 7, null, null, null, 3, null, null, null, 8], note: "The largest value, 8, stays 8; 7 becomes 7 + 8 = 15; 6 becomes 6 + 7 + 8 = 21; and so on down to 0, which becomes the sum of every value, 36." },
      { root: [0, null, 1], note: "1 has nothing greater and stays 1; 0 becomes 0 + 1 = 1." },
      { root: [], note: "An empty tree stays empty." },
    ];
    return {
      slug: "convert-bst-to-greater-tree",
      title: "Convert BST to Greater Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Binary Search", "Amazon", "Meta"],
      signature: { funcName: "convertBST", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree whose values are all distinct. Turn it into a **greater tree**: replace every node's value with the sum of its original value and all values in the tree that are greater than it. Keep the tree's shape and return its root.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [0, 10^4]", "-10^4 <= Node.val <= 10^4", "All the values in the tree are unique", "root is guaranteed to be a valid binary search tree"]),
      hints: [
        "Which nodes are greater than a given node? In a search tree, they are exactly the ones an in-order walk visits after it.",
        "Walk the tree in reverse in-order — right subtree, node, left subtree — so the nodes come largest first.",
        "Keep one running total across the whole walk: add each node's value to it, then write the total back into the node.",
      ],
      editorial: explain({
        idea: "An in-order walk of a BST lists values in increasing order, so the reverse walk (right, node, left) lists them in decreasing order. A running sum along that walk is, at each node, the sum of that node and everything greater.",
        steps: [
          "Keep an accumulator `acc = 0` shared by the whole walk.",
          "Visit a node: first recurse into its right subtree.",
          "Then add the node's value to `acc` and set the node's value to `acc`.",
          "Then recurse into its left subtree. Return the root when the walk ends.",
        ],
        why: "When a node is reached in reverse in-order, every node with a greater value has already been visited and added to `acc`, and no smaller one has. So `acc + node.val` is exactly the required sum.",
        time: "O(n)",
        space: "O(h) for the recursion, h being the tree's height",
        pitfalls: [
          "The accumulator must persist across recursive calls — pass it by reference or keep it outside the recursion.",
          "Add the node's original value before overwriting it; the overwritten value is the new total.",
          "Going left first produces sums of smaller values instead.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const span = pick(rng, [n + 2, 100, 10000]);
        const root = randBST(rng, n, -span, span);
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def convertBST(root: Optional[TreeNode]) -> Optional[TreeNode]:
              acc = 0
              stack = []
              node = root
              while node is not None or stack:
                  while node is not None:
                      stack.append(node)
                      node = node.right
                  node = stack.pop()
                  acc += node.val
                  node.val = acc
                  node = node.left
              return root
        `,
        javascript: code`
          var convertBST = function(root) {
              var acc = 0, stack = [], node = root;
              while (node !== null || stack.length > 0) {
                  while (node !== null) {
                      stack.push(node);
                      node = node.right;
                  }
                  node = stack.pop();
                  acc += node.val;
                  node.val = acc;
                  node = node.left;
              }
              return root;
          };
        `,
        typescript: code`
          function convertBST(root: TreeNode | null): TreeNode | null {
              var acc = 0;
              var stack: TreeNode[] = [];
              var node: TreeNode | null = root;
              while (node !== null || stack.length > 0) {
                  while (node !== null) {
                      stack.push(node);
                      node = node.right;
                  }
                  var top = stack.pop() as TreeNode;
                  acc += top.val;
                  top.val = acc;
                  node = top.left;
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode convertBST(TreeNode root) {
              int acc = 0;
              Deque<TreeNode> stack = new ArrayDeque<>();
              TreeNode node = root;
              while (node != null || !stack.isEmpty()) {
                  while (node != null) {
                      stack.push(node);
                      node = node.right;
                  }
                  node = stack.pop();
                  acc += node.val;
                  node.val = acc;
                  node = node.left;
              }
              return root;
          }
        `,
        cpp: code`
          void greaterWalk(TreeNode* node, int& acc);

          TreeNode* convertBST(TreeNode* root) {
              int acc = 0;
              greaterWalk(root, acc);
              return root;
          }

          void greaterWalk(TreeNode* node, int& acc) {
              if (!node) return;
              greaterWalk(node->right, acc);
              acc += node->val;
              node->val = acc;
              greaterWalk(node->left, acc);
          }
        `,
        c: code`
          static void greaterWalk(struct TreeNode* node, int* acc);

          struct TreeNode* convertBST(struct TreeNode* root) {
              int acc = 0;
              greaterWalk(root, &acc);
              return root;
          }

          static void greaterWalk(struct TreeNode* node, int* acc) {
              if (node == NULL) return;
              greaterWalk(node->right, acc);
              *acc += node->val;
              node->val = *acc;
              greaterWalk(node->left, acc);
          }
        `,
        csharp: code`
          public static TreeNode ConvertBST(TreeNode root)
          {
              int acc = 0;
              GreaterWalk(root, ref acc);
              return root;
          }

          static void GreaterWalk(TreeNode node, ref int acc)
          {
              if (node == null) return;
              GreaterWalk(node.right, ref acc);
              acc += node.val;
              node.val = acc;
              GreaterWalk(node.left, ref acc);
          }
        `,
        go: code`
          func convertBST(root *TreeNode) *TreeNode {
              acc := 0
              greaterWalk(root, &acc)
              return root
          }

          func greaterWalk(node *TreeNode, acc *int) {
              if node == nil {
                  return
              }
              greaterWalk(node.Right, acc)
              *acc += node.Val
              node.Val = *acc
              greaterWalk(node.Left, acc)
          }
        `,
        kotlin: kt(code`
          fun convertBST(root: TreeNode?): TreeNode? {
              var acc = 0
              val stack = ArrayList<TreeNode>()
              var node = root
              while (node != null || stack.isNotEmpty()) {
                  while (node != null) {
                      stack.add(node)
                      node = node.right
                  }
                  val top = stack.removeAt(stack.size - 1)
                  acc += top.@val
                  top.@val = acc
                  node = top.left
              }
              return root
          }
        `),
        swift: code`
          func convertBST(_ root: TreeNode?) -> TreeNode? {
              var acc = 0
              greaterWalk(root, &acc)
              return root
          }

          func greaterWalk(_ node: TreeNode?, _ acc: inout Int) {
              guard let n = node else { return }
              greaterWalk(n.right, &acc)
              acc += n.val
              n.val = acc
              greaterWalk(n.left, &acc)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn convertBST(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut acc = 0;
              greater_walk(&root, &mut acc);
              root
          }

          fn greater_walk(node: &Option<Rc<RefCell<TreeNode>>>, acc: &mut i32) {
              if let Some(n) = node {
                  let right = n.borrow().right.clone();
                  greater_walk(&right, acc);
                  *acc += n.borrow().val;
                  n.borrow_mut().val = *acc;
                  let left = n.borrow().left.clone();
                  greater_walk(&left, acc);
              }
          }
        `,
        php: code`
          function convertBST($root) {
              $acc = 0;
              greaterWalk($root, $acc);
              return $root;
          }

          function greaterWalk($node, &$acc) {
              if ($node === null) return;
              greaterWalk($node->right, $acc);
              $acc += $node->val;
              $node->val = $acc;
              greaterWalk($node->left, $acc);
          }
        `,
        ruby: code`
          def convertBST(root)
            acc = 0
            stack = []
            node = root
            while !node.nil? || !stack.empty?
              until node.nil?
                stack << node
                node = node.right
              end
              node = stack.pop
              acc += node.val
              node.val = acc
              node = node.left
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Add One Row to Tree (LC 623) ────────────────────────────────
  (() => {
    const ref = (root: TNode | null, value: number, depth: number) => {
      const t = cloneTree(root);
      if (depth === 1) return { val: value, left: t, right: null } as TNode;
      const add = (n: TNode | null, d: number) => {
        if (!n) return;
        if (d === depth - 1) {
          n.left = { val: value, left: n.left, right: null };
          n.right = { val: value, left: null, right: n.right };
          return;
        }
        add(n.left, d + 1);
        add(n.right, d + 1);
      };
      add(t, 1);
      return t;
    };
    const EX = [
      { root: [4, 2, 6, 3, 1, 5], value: 1, depth: 2, note: "Both children of the root get a new parent holding 1: the old left subtree hangs to the left of the new left node, the old right subtree to the right of the new right node." },
      { root: [4, 2, null, 3, 1], value: 1, depth: 3, note: "Only node 2 is at depth 2, so it alone gets two new children; 3 moves under the new left node and 1 under the new right node." },
      { root: [5], value: 7, depth: 1, note: "With depth 1 the new node becomes the root, and the whole old tree becomes its left subtree." },
    ];
    return {
      slug: "add-one-row-to-tree",
      title: "Add One Row to Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google"],
      signature: { funcName: "addOneRow", params: [{ name: "root", type: "TreeNode" as const }, { name: "value", type: "int" as const }, { name: "depth", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree and two integers `value` and `depth`, insert a new row of nodes holding `value` at the given depth (the root is at depth 1) and return the root.\n\n- For every node `cur` at depth `depth - 1`, create two new nodes holding `value`: one becomes `cur`'s new left child and the other its new right child.\n- `cur`'s original left subtree becomes the left subtree of the new left node, and its original right subtree becomes the right subtree of the new right node.\n- If `depth == 1`, there is no depth 0: create a single new root holding `value`, with the whole original tree as its left subtree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, value = ${e.value}, depth = ${e.depth}`, out: fmtTree(ref(treeFrom(e.root), e.value, e.depth)), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 10^4]", "The depth of the tree is in the range [1, 10^4]", "-100 <= Node.val <= 100", "-10^5 <= value <= 10^5", "1 <= depth <= the depth of the tree + 1"]),
      hints: [
        "Only the nodes at depth `depth - 1` change; everything else stays exactly where it is.",
        "Walk down the tree carrying the current depth (DFS) or row by row (BFS) until you reach depth `depth - 1`.",
        "At such a node, the new left node adopts the old left child as its left child and the new right node adopts the old right child as its right child. Handle `depth == 1` separately.",
      ],
      editorial: explain({
        idea: "The new row sits between the nodes at depth `depth - 1` and their children, so the only work is to find those nodes and splice two new nodes under each. Depth 1 is the special case where a new root is placed above everything.",
        steps: [
          "If `depth == 1`, return a new node holding `value` whose left child is `root`.",
          "Otherwise run a DFS carrying the depth `d` of the current node, starting at `d = 1`.",
          "When `d == depth - 1`, set `node.left = new Node(value, left = old left)` and `node.right = new Node(value, right = old right)`, and stop descending.",
          "Otherwise recurse into both children with `d + 1`. Return the root.",
        ],
        why: "Every node at depth `depth - 1` is reached exactly once and gets the two new nodes, so the new nodes form exactly the row at depth `depth`. Old subtrees are reattached on the side the statement fixes, so nothing else moves.",
        time: "O(n) at worst — only the nodes above the new row are visited",
        space: "O(h) for the recursion",
        pitfalls: [
          "The old left subtree goes under the new left node's left, the old right subtree under the new right node's right — not the other way round.",
          "Stop at depth `depth - 1`; recursing further would also visit the newly added nodes.",
          "A node at depth `depth - 1` with no children still gets both new nodes.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.value}\n${e.depth}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.value, e.depth)) })),
      gen: (rng: Rng) => {
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), -100, 100);
        const h = heightOf(root);
        const depth = rng() < 0.15 ? pick(rng, [1, h + 1]) : ri(rng, 1, h + 1);
        const value = rng() < 0.5 ? ri(rng, -100, 100) : ri(rng, -100000, 100000);
        return { input: `${fmtTree(root)}\n${value}\n${depth}`, expectedOutput: fmtTree(ref(root, value, depth)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def addOneRow(root: Optional[TreeNode], value: int, depth: int) -> Optional[TreeNode]:
              if depth == 1:
                  return TreeNode(value, root, None)
              level = [root]
              for _ in range(depth - 2):
                  nxt = []
                  for node in level:
                      if node.left is not None:
                          nxt.append(node.left)
                      if node.right is not None:
                          nxt.append(node.right)
                  level = nxt
              for node in level:
                  node.left = TreeNode(value, node.left, None)
                  node.right = TreeNode(value, None, node.right)
              return root
        `,
        javascript: code`
          var addOneRow = function(root, value, depth) {
              if (depth === 1) return new TreeNode(value, root, null);
              var level = [root];
              for (var d = 1; d < depth - 1; d++) {
                  var next = [];
                  for (var i = 0; i < level.length; i++) {
                      if (level[i].left !== null) next.push(level[i].left);
                      if (level[i].right !== null) next.push(level[i].right);
                  }
                  level = next;
              }
              for (var j = 0; j < level.length; j++) {
                  var node = level[j];
                  node.left = new TreeNode(value, node.left, null);
                  node.right = new TreeNode(value, null, node.right);
              }
              return root;
          };
        `,
        typescript: code`
          function addOneRow(root: TreeNode | null, value: number, depth: number): TreeNode | null {
              if (depth === 1) return new TreeNode(value, root, null);
              var level: TreeNode[] = [root as TreeNode];
              for (var d = 1; d < depth - 1; d++) {
                  var next: TreeNode[] = [];
                  for (var i = 0; i < level.length; i++) {
                      if (level[i].left !== null) next.push(level[i].left as TreeNode);
                      if (level[i].right !== null) next.push(level[i].right as TreeNode);
                  }
                  level = next;
              }
              for (var j = 0; j < level.length; j++) {
                  var node = level[j];
                  node.left = new TreeNode(value, node.left, null);
                  node.right = new TreeNode(value, null, node.right);
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode addOneRow(TreeNode root, int value, int depth) {
              if (depth == 1) return new TreeNode(value, root, null);
              insertRow(root, value, depth, 1);
              return root;
          }

          static void insertRow(TreeNode node, int value, int depth, int d) {
              if (node == null) return;
              if (d == depth - 1) {
                  node.left = new TreeNode(value, node.left, null);
                  node.right = new TreeNode(value, null, node.right);
                  return;
              }
              insertRow(node.left, value, depth, d + 1);
              insertRow(node.right, value, depth, d + 1);
          }
        `,
        cpp: code`
          void insertRow(TreeNode* node, int value, int depth, int d);

          TreeNode* addOneRow(TreeNode* root, int value, int depth) {
              if (depth == 1) return new TreeNode(value, root, nullptr);
              insertRow(root, value, depth, 1);
              return root;
          }

          void insertRow(TreeNode* node, int value, int depth, int d) {
              if (!node) return;
              if (d == depth - 1) {
                  node->left = new TreeNode(value, node->left, nullptr);
                  node->right = new TreeNode(value, nullptr, node->right);
                  return;
              }
              insertRow(node->left, value, depth, d + 1);
              insertRow(node->right, value, depth, d + 1);
          }
        `,
        c: code`
          static struct TreeNode* makeNode(int v, struct TreeNode* left, struct TreeNode* right);
          static void insertRow(struct TreeNode* node, int value, int depth, int d);

          struct TreeNode* addOneRow(struct TreeNode* root, int value, int depth) {
              if (depth == 1) return makeNode(value, root, NULL);
              insertRow(root, value, depth, 1);
              return root;
          }

          static void insertRow(struct TreeNode* node, int value, int depth, int d) {
              if (node == NULL) return;
              if (d == depth - 1) {
                  node->left = makeNode(value, node->left, NULL);
                  node->right = makeNode(value, NULL, node->right);
                  return;
              }
              insertRow(node->left, value, depth, d + 1);
              insertRow(node->right, value, depth, d + 1);
          }

          static struct TreeNode* makeNode(int v, struct TreeNode* left, struct TreeNode* right) {
              struct TreeNode* n = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              n->val = v;
              n->left = left;
              n->right = right;
              return n;
          }
        `,
        csharp: code`
          public static TreeNode AddOneRow(TreeNode root, int value, int depth)
          {
              if (depth == 1) return new TreeNode(value, root, null);
              InsertRow(root, value, depth, 1);
              return root;
          }

          static void InsertRow(TreeNode node, int value, int depth, int d)
          {
              if (node == null) return;
              if (d == depth - 1)
              {
                  node.left = new TreeNode(value, node.left, null);
                  node.right = new TreeNode(value, null, node.right);
                  return;
              }
              InsertRow(node.left, value, depth, d + 1);
              InsertRow(node.right, value, depth, d + 1);
          }
        `,
        go: code`
          func addOneRow(root *TreeNode, value int, depth int) *TreeNode {
              if depth == 1 {
                  return &TreeNode{Val: value, Left: root}
              }
              insertRow(root, value, depth, 1)
              return root
          }

          func insertRow(node *TreeNode, value, depth, d int) {
              if node == nil {
                  return
              }
              if d == depth-1 {
                  node.Left = &TreeNode{Val: value, Left: node.Left}
                  node.Right = &TreeNode{Val: value, Right: node.Right}
                  return
              }
              insertRow(node.Left, value, depth, d+1)
              insertRow(node.Right, value, depth, d+1)
          }
        `,
        kotlin: kt(code`
          fun addOneRow(root: TreeNode?, value: Int, depth: Int): TreeNode? {
              if (depth == 1) {
                  val top = TreeNode(value)
                  top.left = root
                  return top
              }
              insertRow(root, value, depth, 1)
              return root
          }

          fun insertRow(node: TreeNode?, value: Int, depth: Int, d: Int) {
              if (node == null) return
              if (d == depth - 1) {
                  val l = TreeNode(value)
                  l.left = node.left
                  val r = TreeNode(value)
                  r.right = node.right
                  node.left = l
                  node.right = r
                  return
              }
              insertRow(node.left, value, depth, d + 1)
              insertRow(node.right, value, depth, d + 1)
          }
        `),
        swift: code`
          func addOneRow(_ root: TreeNode?, _ value: Int, _ depth: Int) -> TreeNode? {
              if depth == 1 { return TreeNode(value, root, nil) }
              insertRow(root, value, depth, 1)
              return root
          }

          func insertRow(_ node: TreeNode?, _ value: Int, _ depth: Int, _ d: Int) {
              guard let n = node else { return }
              if d == depth - 1 {
                  n.left = TreeNode(value, n.left, nil)
                  n.right = TreeNode(value, nil, n.right)
                  return
              }
              insertRow(n.left, value, depth, d + 1)
              insertRow(n.right, value, depth, d + 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn addOneRow(root: Option<Rc<RefCell<TreeNode>>>, value: i32, depth: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if depth == 1 {
                  let top = Rc::new(RefCell::new(TreeNode::new(value)));
                  top.borrow_mut().left = root;
                  return Some(top);
              }
              insert_row(&root, value, depth, 1);
              root
          }

          fn insert_row(node: &Option<Rc<RefCell<TreeNode>>>, value: i32, depth: i32, d: i32) {
              if let Some(n) = node {
                  if d == depth - 1 {
                      let nl = Rc::new(RefCell::new(TreeNode::new(value)));
                      let nr = Rc::new(RefCell::new(TreeNode::new(value)));
                      let mut b = n.borrow_mut();
                      nl.borrow_mut().left = b.left.take();
                      nr.borrow_mut().right = b.right.take();
                      b.left = Some(nl);
                      b.right = Some(nr);
                      return;
                  }
                  let (l, r) = {
                      let b = n.borrow();
                      (b.left.clone(), b.right.clone())
                  };
                  insert_row(&l, value, depth, d + 1);
                  insert_row(&r, value, depth, d + 1);
              }
          }
        `,
        php: code`
          function addOneRow($root, $value, $depth) {
              if ($depth == 1) return new TreeNode($value, $root, null);
              insertRow($root, $value, $depth, 1);
              return $root;
          }

          function insertRow($node, $value, $depth, $d) {
              if ($node === null) return;
              if ($d == $depth - 1) {
                  $node->left = new TreeNode($value, $node->left, null);
                  $node->right = new TreeNode($value, null, $node->right);
                  return;
              }
              insertRow($node->left, $value, $depth, $d + 1);
              insertRow($node->right, $value, $depth, $d + 1);
          }
        `,
        ruby: code`
          def addOneRow(root, value, depth)
            return TreeNode.new(value, root, nil) if depth == 1
            insert_row(root, value, depth, 1)
            root
          end

          def insert_row(node, value, depth, d)
            return if node.nil?
            if d == depth - 1
              node.left = TreeNode.new(value, node.left, nil)
              node.right = TreeNode.new(value, nil, node.right)
              return
            end
            insert_row(node.left, value, depth, d + 1)
            insert_row(node.right, value, depth, d + 1)
          end
        `,
      },
    };
  })(),

  // ── Maximum Binary Tree (LC 654) ────────────────────────────────
  (() => {
    const build = (a: number[], lo: number, hi: number): TNode | null => {
      if (lo > hi) return null;
      let m = lo;
      for (let i = lo + 1; i <= hi; i++) if (a[i] > a[m]) m = i;
      return { val: a[m], left: build(a, lo, m - 1), right: build(a, m + 1, hi) };
    };
    const ref = (nums: number[]) => build(nums, 0, nums.length - 1);
    const EX = [
      { nums: [3, 2, 1, 6, 0, 5], note: "6 is the maximum, so it is the root; [3,2,1] builds its left subtree (3 with the chain 2 → 1 to its right) and [0,5] its right subtree (5 with 0 to its left)." },
      { nums: [3, 2, 1], note: "Each maximum is the first element of what remains, so every node hangs to the right of the previous one." },
      { nums: [1, 2, 3], note: "Now each maximum is the last element, so the tree leans left." },
    ];
    return {
      slug: "maximum-binary-tree",
      title: "Maximum Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Divide and Conquer", "Stack", "Tree", "Monotonic Stack", "Amazon", "Microsoft"],
      signature: { funcName: "constructMaximumBinaryTree", params: [{ name: "nums", type: "int[]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given an integer array `nums` with no duplicates. Its **maximum binary tree** is built recursively:\n\n1. The root holds the maximum value in `nums`.\n2. The left subtree is the maximum binary tree of the elements to the **left** of that maximum.\n3. The right subtree is the maximum binary tree of the elements to the **right** of that maximum.\n\nAn empty range gives an empty subtree. Build the maximum binary tree of `nums` and return its root.",
        EX.map((e) => ({ in: `nums = ${fmtIntArr(e.nums)}`, out: fmtTree(ref(e.nums)), note: e.note })),
        ["1 <= nums.length <= 1000", "0 <= nums[i] <= 1000", "All integers in nums are unique"],
        "The direct recursion is O(n^2) on a sorted array. Can you build the tree in O(n)?"),
      hints: [
        "The definition is already an algorithm: find the maximum, split around it, recurse on both sides. That is O(n^2) in the worst case.",
        "Process the array left to right and think about where each new element ends up: it becomes the right child of the nearest greater element to its left…",
        "…and the chain of smaller elements just before it becomes its left subtree. A stack kept in decreasing order holds exactly the candidates.",
      ],
      editorial: explain({
        idea: "In the maximum tree, each element's parent is the smaller of its nearest greater neighbour on the left and on the right. A monotonic decreasing stack finds those neighbours in one left-to-right pass and wires up the links as it goes.",
        steps: [
          "Keep a stack of nodes whose values decrease from bottom to top.",
          "For each value `x`, create its node. Pop every node smaller than `x`; the last one popped becomes the new node's left child.",
          "If the stack is not empty afterwards, the new node becomes the right child of the node on top (the nearest greater element to its left).",
          "Push the new node. When the array ends, the bottom of the stack is the root.",
        ],
        why: "The popped nodes form a decreasing run of smaller elements immediately to the left of `x`, and the largest of them (the last popped) is the maximum of the range between `x` and its nearest greater left neighbour — exactly `x`'s left subtree root. The node left on top is greater than `x` and nearer than any other greater element, and any later right child it takes is replaced only by an element larger than `x`, which then adopts `x` on its left. The global maximum is never popped, so it ends at the bottom.",
        time: "O(n) — every node is pushed and popped at most once",
        space: "O(n) for the stack",
        pitfalls: [
          "Setting the right child of the stack's top must happen after the pops; it overwrites a right child that has just been moved into the new node's left subtree.",
          "The root is the bottom of the stack, not the top.",
          "The plain recursion is fine for small inputs but degrades to O(n^2) on sorted arrays.",
        ],
      }),
      examples: EX.map((e) => ({ input: fmtIntArr(e.nums), expectedOutput: fmtTree(ref(e.nums)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const set = new Set<number>();
        const hi = pick(rng, [n + 2, 1000]);
        while (set.size < n) set.add(ri(rng, 0, hi));
        let nums = shuffle(rng, [...set]);
        const r = rng();
        if (r < 0.1) nums.sort((a, b) => a - b);
        else if (r < 0.2) nums.sort((a, b) => b - a);
        else if (r < 0.25) nums = [...nums.filter((_, i) => i % 2 === 0).sort((a, b) => a - b), ...nums.filter((_, i) => i % 2 === 1).sort((a, b) => b - a)];
        return { input: fmtIntArr(nums), expectedOutput: fmtTree(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def constructMaximumBinaryTree(nums: List[int]) -> Optional[TreeNode]:
              stack = []
              for x in nums:
                  node = TreeNode(x)
                  last = None
                  while stack and stack[-1].val < x:
                      last = stack.pop()
                  node.left = last
                  if stack:
                      stack[-1].right = node
                  stack.append(node)
              return stack[0]
        `,
        javascript: code`
          var constructMaximumBinaryTree = function(nums) {
              var stack = [];
              for (var i = 0; i < nums.length; i++) {
                  var node = new TreeNode(nums[i]);
                  var last = null;
                  while (stack.length > 0 && stack[stack.length - 1].val < nums[i]) last = stack.pop();
                  node.left = last;
                  if (stack.length > 0) stack[stack.length - 1].right = node;
                  stack.push(node);
              }
              return stack[0];
          };
        `,
        typescript: code`
          function constructMaximumBinaryTree(nums: number[]): TreeNode | null {
              var stack: TreeNode[] = [];
              for (var i = 0; i < nums.length; i++) {
                  var node = new TreeNode(nums[i]);
                  var last: TreeNode | null = null;
                  while (stack.length > 0 && stack[stack.length - 1].val < nums[i]) last = stack.pop() as TreeNode;
                  node.left = last;
                  if (stack.length > 0) stack[stack.length - 1].right = node;
                  stack.push(node);
              }
              return stack[0];
          }
        `,
        java: code`
          public static TreeNode constructMaximumBinaryTree(int[] nums) {
              ArrayList<TreeNode> stack = new ArrayList<>();
              for (int x : nums) {
                  TreeNode node = new TreeNode(x);
                  TreeNode last = null;
                  while (!stack.isEmpty() && stack.get(stack.size() - 1).val < x) last = stack.remove(stack.size() - 1);
                  node.left = last;
                  if (!stack.isEmpty()) stack.get(stack.size() - 1).right = node;
                  stack.add(node);
              }
              return stack.get(0);
          }
        `,
        cpp: code`
          TreeNode* constructMaximumBinaryTree(vector<int>& nums) {
              vector<TreeNode*> stack;
              for (int x : nums) {
                  TreeNode* node = new TreeNode(x);
                  TreeNode* last = nullptr;
                  while (!stack.empty() && stack.back()->val < x) {
                      last = stack.back();
                      stack.pop_back();
                  }
                  node->left = last;
                  if (!stack.empty()) stack.back()->right = node;
                  stack.push_back(node);
              }
              return stack[0];
          }
        `,
        c: code`
          struct TreeNode* constructMaximumBinaryTree(int* nums, int numsSize) {
              struct TreeNode** stack = (struct TreeNode**) malloc((size_t) (numsSize + 1) * sizeof(struct TreeNode*));
              int top = 0;
              for (int i = 0; i < numsSize; i++) {
                  struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
                  node->val = nums[i];
                  node->left = NULL;
                  node->right = NULL;
                  struct TreeNode* last = NULL;
                  while (top > 0 && stack[top - 1]->val < nums[i]) last = stack[--top];
                  node->left = last;
                  if (top > 0) stack[top - 1]->right = node;
                  stack[top++] = node;
              }
              struct TreeNode* root = stack[0];
              free(stack);
              return root;
          }
        `,
        csharp: code`
          public static TreeNode ConstructMaximumBinaryTree(int[] nums)
          {
              var stack = new List<TreeNode>();
              foreach (int x in nums)
              {
                  var node = new TreeNode(x);
                  TreeNode last = null;
                  while (stack.Count > 0 && stack[stack.Count - 1].val < x)
                  {
                      last = stack[stack.Count - 1];
                      stack.RemoveAt(stack.Count - 1);
                  }
                  node.left = last;
                  if (stack.Count > 0) stack[stack.Count - 1].right = node;
                  stack.Add(node);
              }
              return stack[0];
          }
        `,
        go: code`
          func constructMaximumBinaryTree(nums []int) *TreeNode {
              stack := []*TreeNode{}
              for _, x := range nums {
                  node := &TreeNode{Val: x}
                  var last *TreeNode
                  for len(stack) > 0 && stack[len(stack)-1].Val < x {
                      last = stack[len(stack)-1]
                      stack = stack[:len(stack)-1]
                  }
                  node.Left = last
                  if len(stack) > 0 {
                      stack[len(stack)-1].Right = node
                  }
                  stack = append(stack, node)
              }
              return stack[0]
          }
        `,
        kotlin: kt(code`
          fun constructMaximumBinaryTree(nums: IntArray): TreeNode? {
              val stack = ArrayList<TreeNode>()
              for (x in nums) {
                  val node = TreeNode(x)
                  var last: TreeNode? = null
                  while (stack.isNotEmpty() && stack[stack.size - 1].@val < x) last = stack.removeAt(stack.size - 1)
                  node.left = last
                  if (stack.isNotEmpty()) stack[stack.size - 1].right = node
                  stack.add(node)
              }
              return stack[0]
          }
        `),
        swift: code`
          func constructMaximumBinaryTree(_ nums: [Int]) -> TreeNode? {
              var stack = [TreeNode]()
              for x in nums {
                  let node = TreeNode(x)
                  var last: TreeNode? = nil
                  while let top = stack.last, top.val < x {
                      last = stack.removeLast()
                  }
                  node.left = last
                  if let top = stack.last { top.right = node }
                  stack.append(node)
              }
              return stack.first
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn constructMaximumBinaryTree(nums: Vec<i32>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut stack: Vec<Rc<RefCell<TreeNode>>> = Vec::new();
              for &x in nums.iter() {
                  let node = Rc::new(RefCell::new(TreeNode::new(x)));
                  let mut last: Option<Rc<RefCell<TreeNode>>> = None;
                  loop {
                      let smaller = match stack.last() {
                          Some(t) => t.borrow().val < x,
                          None => false,
                      };
                      if !smaller {
                          break;
                      }
                      last = stack.pop();
                  }
                  node.borrow_mut().left = last;
                  if let Some(t) = stack.last() {
                      t.borrow_mut().right = Some(node.clone());
                  }
                  stack.push(node);
              }
              if stack.is_empty() { None } else { Some(stack[0].clone()) }
          }
        `,
        php: code`
          function constructMaximumBinaryTree($nums) {
              $stack = [];
              foreach ($nums as $x) {
                  $node = new TreeNode($x);
                  $last = null;
                  while (count($stack) > 0 && $stack[count($stack) - 1]->val < $x) $last = array_pop($stack);
                  $node->left = $last;
                  if (count($stack) > 0) $stack[count($stack) - 1]->right = $node;
                  $stack[] = $node;
              }
              return $stack[0];
          }
        `,
        ruby: code`
          def constructMaximumBinaryTree(nums)
            stack = []
            nums.each do |x|
              node = TreeNode.new(x)
              last = nil
              last = stack.pop while !stack.empty? && stack[-1].val < x
              node.left = last
              stack[-1].right = node unless stack.empty?
              stack << node
            end
            stack[0]
          end
        `,
      },
    };
  })(),

  // ── Maximum Width of Binary Tree (LC 662) ───────────────────────
  (() => {
    const ref = (root: TNode | null) => {
      let best = 0;
      let level: Array<[TNode, number]> = root ? [[root, 0]] : [];
      while (level.length) {
        const first = level[0][1];
        best = Math.max(best, level[level.length - 1][1] - first + 1);
        const next: Array<[TNode, number]> = [];
        for (const [n, i0] of level) {
          const i = i0 - first;
          if (n.left) next.push([n.left, 2 * i]);
          if (n.right) next.push([n.right, 2 * i + 1]);
        }
        level = next;
      }
      return best;
    };
    /** A left spine and a right spine of `len` levels each — width 2^(len-1) on the last level. */
    const spines = (rng: Rng, len: number): TNode => {
      const root = leaf(ri(rng, -100, 100));
      let l = root, r = root;
      for (let i = 1; i < len; i++) {
        const a = leaf(ri(rng, -100, 100)), b = leaf(ri(rng, -100, 100));
        if (i === 1 || rng() < 0.8) l.left = a; else l.right = a;
        if (i === 1 || rng() < 0.8) r.right = b; else r.left = b;
        l = a; r = b;
      }
      return root;
    };
    const EX = [
      { root: [1, 3, 2, 5, 3, null, 9], note: "The widest level is the third: from 5 to 9 it spans four positions (5, 3, an empty slot, 9)." },
      { root: [1, 3, 2, 5, null, null, 9, 6, null, 7], note: "On the fourth level 6 sits at the far left and 7 at the far right of a span of seven positions; the five empty slots between them count." },
      { root: [1, 3, 2, 5], note: "The second level, 3 and 2, has width 2; the third holds only 5." },
    ];
    return {
      slug: "maximum-width-of-binary-tree",
      title: "Maximum Width of Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Microsoft", "Meta"],
      signature: { funcName: "widthOfBinaryTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return its **maximum width** — the largest width among all its levels.\n\nThe width of a level is the number of positions between its leftmost and rightmost non-null nodes, both included, counting the empty slots in between as they would be in a complete binary tree reaching that level.\n\nThe answer is guaranteed to fit in a 32-bit signed integer.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 3000]", "-100 <= Node.val <= 100", "The answer fits in a 32-bit signed integer"]),
      hints: [
        "Number the positions as in a heap: the root is 0, and a node at position `i` has children at `2i` and `2i + 1`.",
        "A level's width is then (last position − first position + 1) — a breadth-first walk gives you each level's first and last node.",
        "Positions double on every level and overflow after ~60 levels even in 64 bits. Subtract each level's first position before computing the children's positions.",
      ],
      editorial: explain({
        idea: "Give every node the index it would have in a complete binary tree. Within one level, the width is the difference between the rightmost and leftmost indices plus one, null slots included automatically. Re-basing each level's indices at its leftmost node keeps the numbers small.",
        steps: [
          "Start a BFS with `(root, 0)`.",
          "For each level, let `first` be the index of its first node and `last` that of its last; update `best = max(best, last - first + 1)`.",
          "For every node of the level with index `i`, let `j = i - first` and enqueue its left child with `2j` and its right child with `2j + 1`.",
          "Return `best` after the last level.",
        ],
        why: "In a complete-tree numbering, positions on a level are consecutive integers, so the count of slots between two nodes is the difference of their indices plus one. Subtracting the same `first` from every index on a level shifts the next level's indices by a constant, which leaves every difference — and so every width — unchanged.",
        time: "O(n)",
        space: "O(w) for one level, w being the widest level",
        pitfalls: [
          "Without re-basing, indices on a deep, skinny tree grow like 2^depth and overflow any fixed-width integer.",
          "Even after re-basing, `2j + 1` can reach about 2^32 on a level whose width is near the limit — compute indices in 64 bits.",
          "Empty slots between the end nodes count; nulls outside them do not.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        // At most 31 levels keeps every width, and the answer, below 2^31.
        const root = rng() < 0.2 ? spines(rng, ri(rng, 1, 31)) : depthTree(rng, sizeOf(rng, [3, 10, 25, 40]), pick(rng, [4, 6, 8, 31]), -100, 100);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def widthOfBinaryTree(root: Optional[TreeNode]) -> int:
              best = 0
              level = [(root, 0)]
              while level:
                  first = level[0][1]
                  best = max(best, level[-1][1] - first + 1)
                  nxt = []
                  for node, i in level:
                      j = i - first
                      if node.left is not None:
                          nxt.append((node.left, 2 * j))
                      if node.right is not None:
                          nxt.append((node.right, 2 * j + 1))
                  level = nxt
              return best
        `,
        javascript: code`
          var widthOfBinaryTree = function(root) {
              var best = 0;
              var nodes = [root], idx = [0];
              while (nodes.length > 0) {
                  var first = idx[0];
                  best = Math.max(best, idx[idx.length - 1] - first + 1);
                  var nn = [], ni = [];
                  for (var k = 0; k < nodes.length; k++) {
                      var j = idx[k] - first;
                      if (nodes[k].left !== null) { nn.push(nodes[k].left); ni.push(2 * j); }
                      if (nodes[k].right !== null) { nn.push(nodes[k].right); ni.push(2 * j + 1); }
                  }
                  nodes = nn;
                  idx = ni;
              }
              return best;
          };
        `,
        typescript: code`
          function widthOfBinaryTree(root: TreeNode | null): number {
              var best = 0;
              var nodes: TreeNode[] = [root as TreeNode];
              var idx: number[] = [0];
              while (nodes.length > 0) {
                  var first = idx[0];
                  best = Math.max(best, idx[idx.length - 1] - first + 1);
                  var nn: TreeNode[] = [], ni: number[] = [];
                  for (var k = 0; k < nodes.length; k++) {
                      var j = idx[k] - first;
                      var cur = nodes[k];
                      if (cur.left !== null) { nn.push(cur.left); ni.push(2 * j); }
                      if (cur.right !== null) { nn.push(cur.right); ni.push(2 * j + 1); }
                  }
                  nodes = nn;
                  idx = ni;
              }
              return best;
          }
        `,
        java: code`
          public static int widthOfBinaryTree(TreeNode root) {
              long best = 0;
              List<TreeNode> nodes = new ArrayList<>();
              List<Long> idx = new ArrayList<>();
              nodes.add(root);
              idx.add(0L);
              while (!nodes.isEmpty()) {
                  long first = idx.get(0);
                  best = Math.max(best, idx.get(idx.size() - 1) - first + 1);
                  List<TreeNode> nn = new ArrayList<>();
                  List<Long> ni = new ArrayList<>();
                  for (int k = 0; k < nodes.size(); k++) {
                      long j = idx.get(k) - first;
                      TreeNode cur = nodes.get(k);
                      if (cur.left != null) { nn.add(cur.left); ni.add(2 * j); }
                      if (cur.right != null) { nn.add(cur.right); ni.add(2 * j + 1); }
                  }
                  nodes = nn;
                  idx = ni;
              }
              return (int) best;
          }
        `,
        cpp: code`
          int widthOfBinaryTree(TreeNode* root) {
              long long best = 0;
              vector<pair<TreeNode*, long long>> level = {{root, 0}};
              while (!level.empty()) {
                  long long first = level.front().second;
                  best = max(best, level.back().second - first + 1);
                  vector<pair<TreeNode*, long long>> next;
                  for (auto& p : level) {
                      long long j = p.second - first;
                      if (p.first->left) next.push_back({p.first->left, 2 * j});
                      if (p.first->right) next.push_back({p.first->right, 2 * j + 1});
                  }
                  level.swap(next);
              }
              return (int) best;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          int widthOfBinaryTree(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** q = (struct TreeNode**) malloc((size_t) (n + 1) * sizeof(struct TreeNode*));
              long long* idx = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              int head = 0, tail = 0;
              q[tail] = root;
              idx[tail++] = 0;
              long long best = 0;
              while (head < tail) {
                  int end = tail;
                  long long first = idx[head];
                  if (idx[end - 1] - first + 1 > best) best = idx[end - 1] - first + 1;
                  while (head < end) {
                      struct TreeNode* cur = q[head];
                      long long j = idx[head] - first;
                      head++;
                      if (cur->left != NULL) { q[tail] = cur->left; idx[tail++] = 2 * j; }
                      if (cur->right != NULL) { q[tail] = cur->right; idx[tail++] = 2 * j + 1; }
                  }
              }
              free(q);
              free(idx);
              return (int) best;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static int WidthOfBinaryTree(TreeNode root)
          {
              long best = 0;
              var nodes = new List<TreeNode> { root };
              var idx = new List<long> { 0 };
              while (nodes.Count > 0)
              {
                  long first = idx[0];
                  best = Math.Max(best, idx[idx.Count - 1] - first + 1);
                  var nn = new List<TreeNode>();
                  var ni = new List<long>();
                  for (int k = 0; k < nodes.Count; k++)
                  {
                      long j = idx[k] - first;
                      TreeNode cur = nodes[k];
                      if (cur.left != null) { nn.Add(cur.left); ni.Add(2 * j); }
                      if (cur.right != null) { nn.Add(cur.right); ni.Add(2 * j + 1); }
                  }
                  nodes = nn;
                  idx = ni;
              }
              return (int) best;
          }
        `,
        go: code`
          func widthOfBinaryTree(root *TreeNode) int {
              best := 0
              nodes := []*TreeNode{root}
              idx := []int{0}
              for len(nodes) > 0 {
                  first := idx[0]
                  if w := idx[len(idx)-1] - first + 1; w > best {
                      best = w
                  }
                  nn := []*TreeNode{}
                  ni := []int{}
                  for k, cur := range nodes {
                      j := idx[k] - first
                      if cur.Left != nil {
                          nn = append(nn, cur.Left)
                          ni = append(ni, 2*j)
                      }
                      if cur.Right != nil {
                          nn = append(nn, cur.Right)
                          ni = append(ni, 2*j+1)
                      }
                  }
                  nodes, idx = nn, ni
              }
              return best
          }
        `,
        kotlin: kt(code`
          fun widthOfBinaryTree(root: TreeNode?): Int {
              var best = 0L
              var nodes = ArrayList<TreeNode>()
              var idx = ArrayList<Long>()
              nodes.add(root!!)
              idx.add(0L)
              while (nodes.isNotEmpty()) {
                  val first = idx[0]
                  best = maxOf(best, idx[idx.size - 1] - first + 1)
                  val nn = ArrayList<TreeNode>()
                  val ni = ArrayList<Long>()
                  for (k in nodes.indices) {
                      val j = idx[k] - first
                      val cur = nodes[k]
                      cur.left?.let { nn.add(it); ni.add(2 * j) }
                      cur.right?.let { nn.add(it); ni.add(2 * j + 1) }
                  }
                  nodes = nn
                  idx = ni
              }
              return best.toInt()
          }
        `),
        swift: code`
          func widthOfBinaryTree(_ root: TreeNode?) -> Int {
              var best = 0
              var nodes: [TreeNode] = [root!]
              var idx: [Int] = [0]
              while !nodes.isEmpty {
                  let first = idx[0]
                  best = max(best, idx[idx.count - 1] - first + 1)
                  var nn = [TreeNode]()
                  var ni = [Int]()
                  for k in 0..<nodes.count {
                      let j = idx[k] - first
                      if let l = nodes[k].left { nn.append(l); ni.append(2 * j) }
                      if let r = nodes[k].right { nn.append(r); ni.append(2 * j + 1) }
                  }
                  nodes = nn
                  idx = ni
              }
              return best
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn widthOfBinaryTree(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best: i64 = 0;
              let mut level: Vec<(Rc<RefCell<TreeNode>>, i64)> = Vec::new();
              if let Some(r) = root {
                  level.push((r, 0));
              }
              while !level.is_empty() {
                  let first = level[0].1;
                  let w = level[level.len() - 1].1 - first + 1;
                  if w > best {
                      best = w;
                  }
                  let mut next: Vec<(Rc<RefCell<TreeNode>>, i64)> = Vec::new();
                  for (node, i) in level.iter() {
                      let j = *i - first;
                      let b = node.borrow();
                      if let Some(l) = b.left.clone() {
                          next.push((l, 2 * j));
                      }
                      if let Some(r) = b.right.clone() {
                          next.push((r, 2 * j + 1));
                      }
                  }
                  level = next;
              }
              best as i32
          }
        `,
        php: code`
          function widthOfBinaryTree($root) {
              $best = 0;
              $nodes = [$root];
              $idx = [0];
              while (count($nodes) > 0) {
                  $first = $idx[0];
                  $best = max($best, $idx[count($idx) - 1] - $first + 1);
                  $nn = [];
                  $ni = [];
                  foreach ($nodes as $k => $cur) {
                      $j = $idx[$k] - $first;
                      if ($cur->left !== null) { $nn[] = $cur->left; $ni[] = 2 * $j; }
                      if ($cur->right !== null) { $nn[] = $cur->right; $ni[] = 2 * $j + 1; }
                  }
                  $nodes = $nn;
                  $idx = $ni;
              }
              return $best;
          }
        `,
        ruby: code`
          def widthOfBinaryTree(root)
            best = 0
            level = [[root, 0]]
            until level.empty?
              first = level[0][1]
              best = [best, level[-1][1] - first + 1].max
              nxt = []
              level.each do |node, i|
                j = i - first
                nxt << [node.left, 2 * j] unless node.left.nil?
                nxt << [node.right, 2 * j + 1] unless node.right.nil?
              end
              level = nxt
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Trim a Binary Search Tree (LC 669) ──────────────────────────
  (() => {
    const trim = (n: TNode | null, low: number, high: number): TNode | null => {
      if (!n) return null;
      if (n.val < low) return trim(n.right, low, high);
      if (n.val > high) return trim(n.left, low, high);
      n.left = trim(n.left, low, high);
      n.right = trim(n.right, low, high);
      return n;
    };
    const ref = (root: TNode | null, low: number, high: number) => trim(cloneTree(root), low, high);
    const EX = [
      { root: [1, 0, 2], low: 1, high: 2, note: "0 is below the range and is removed; 1 and 2 stay where they were." },
      { root: [3, 0, 4, null, 2, null, null, 1], low: 1, high: 3, note: "0 is too small, so its right subtree (2 with child 1) takes its place under 3; 4 is too large and has no children to keep." },
      { root: [2, 1, 3], low: 4, high: 5, note: "Every value is below 4, so nothing survives." },
    ];
    return {
      slug: "trim-a-binary-search-tree",
      title: "Trim a Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Recursion", "Amazon", "Microsoft", "Bloomberg"],
      signature: { funcName: "trimBST", params: [{ name: "root", type: "TreeNode" as const }, { name: "low", type: "int" as const }, { name: "high", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree with distinct values and two integers `low` and `high`. Trim the tree so that every remaining value lies in the inclusive range `[low, high]`.\n\nTrimming must not change the relative structure of the nodes that remain: any node that stays keeps every remaining descendant as a descendant. The result is unique. Return the root of the trimmed tree, which may be different from the original root, or an empty tree.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, low = ${e.low}, high = ${e.high}`, out: fmtTree(ref(treeFrom(e.root), e.low, e.high)), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 10^4]", "0 <= Node.val <= 10^4", "The value of each node in the tree is unique", "root is guaranteed to be a valid binary search tree", "0 <= low <= high <= 10^4"]),
      hints: [
        "If a node's value is below `low`, the node and its entire left subtree are below `low` too.",
        "So for such a node, the answer is simply the trimmed version of its right subtree — and symmetrically for a value above `high`.",
        "A node inside the range stays: trim its two subtrees recursively and reattach the results.",
      ],
      editorial: explain({
        idea: "The search-tree order lets a whole subtree be discarded at once: a node below `low` drags its left subtree with it, a node above `high` its right subtree. A recursive function that returns the trimmed root of any subtree expresses this directly.",
        steps: [
          "`trim(node)`: if `node` is null, return null.",
          "If `node.val < low`, return `trim(node.right)`.",
          "If `node.val > high`, return `trim(node.left)`.",
          "Otherwise set `node.left = trim(node.left)` and `node.right = trim(node.right)`, and return `node`.",
        ],
        why: "Every node in the left subtree of a node below `low` is smaller still, so none of them can remain; the trimmed right subtree, whose values are all greater than that node, takes its place under the same parent and keeps the order. In-range nodes keep their position and recurse, so remaining nodes keep their ancestor relations.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "A node out of range is not simply deleted: its valid subtree must be spliced into its place.",
          "The root itself can be out of range — the new root is whatever the recursion returns.",
          "The result can be empty.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.low}\n${e.high}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.low, e.high)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 3, 60, 10000]);
        const root = randBST(rng, n, 0, hi);
        let low = ri(rng, 0, hi), high = ri(rng, 0, hi);
        if (low > high) { const t = low; low = high; high = t; }
        if (rng() < 0.1) { low = 0; high = pick(rng, [0, hi, 10000]); }
        return { input: `${fmtTree(root)}\n${low}\n${high}`, expectedOutput: fmtTree(ref(root, low, high)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def trimBST(root: Optional[TreeNode], low: int, high: int) -> Optional[TreeNode]:
              if root is None:
                  return None
              if root.val < low:
                  return trimBST(root.right, low, high)
              if root.val > high:
                  return trimBST(root.left, low, high)
              root.left = trimBST(root.left, low, high)
              root.right = trimBST(root.right, low, high)
              return root
        `,
        javascript: code`
          var trimBST = function(root, low, high) {
              if (root === null) return null;
              if (root.val < low) return trimBST(root.right, low, high);
              if (root.val > high) return trimBST(root.left, low, high);
              root.left = trimBST(root.left, low, high);
              root.right = trimBST(root.right, low, high);
              return root;
          };
        `,
        typescript: code`
          function trimBST(root: TreeNode | null, low: number, high: number): TreeNode | null {
              if (root === null) return null;
              if (root.val < low) return trimBST(root.right, low, high);
              if (root.val > high) return trimBST(root.left, low, high);
              root.left = trimBST(root.left, low, high);
              root.right = trimBST(root.right, low, high);
              return root;
          }
        `,
        java: code`
          public static TreeNode trimBST(TreeNode root, int low, int high) {
              if (root == null) return null;
              if (root.val < low) return trimBST(root.right, low, high);
              if (root.val > high) return trimBST(root.left, low, high);
              root.left = trimBST(root.left, low, high);
              root.right = trimBST(root.right, low, high);
              return root;
          }
        `,
        cpp: code`
          TreeNode* trimBST(TreeNode* root, int low, int high) {
              if (!root) return nullptr;
              if (root->val < low) return trimBST(root->right, low, high);
              if (root->val > high) return trimBST(root->left, low, high);
              root->left = trimBST(root->left, low, high);
              root->right = trimBST(root->right, low, high);
              return root;
          }
        `,
        c: code`
          struct TreeNode* trimBST(struct TreeNode* root, int low, int high) {
              if (root == NULL) return NULL;
              if (root->val < low) return trimBST(root->right, low, high);
              if (root->val > high) return trimBST(root->left, low, high);
              root->left = trimBST(root->left, low, high);
              root->right = trimBST(root->right, low, high);
              return root;
          }
        `,
        csharp: code`
          public static TreeNode TrimBST(TreeNode root, int low, int high)
          {
              if (root == null) return null;
              if (root.val < low) return TrimBST(root.right, low, high);
              if (root.val > high) return TrimBST(root.left, low, high);
              root.left = TrimBST(root.left, low, high);
              root.right = TrimBST(root.right, low, high);
              return root;
          }
        `,
        go: code`
          func trimBST(root *TreeNode, low int, high int) *TreeNode {
              if root == nil {
                  return nil
              }
              if root.Val < low {
                  return trimBST(root.Right, low, high)
              }
              if root.Val > high {
                  return trimBST(root.Left, low, high)
              }
              root.Left = trimBST(root.Left, low, high)
              root.Right = trimBST(root.Right, low, high)
              return root
          }
        `,
        kotlin: kt(code`
          fun trimBST(root: TreeNode?, low: Int, high: Int): TreeNode? {
              if (root == null) return null
              if (root.@val < low) return trimBST(root.right, low, high)
              if (root.@val > high) return trimBST(root.left, low, high)
              root.left = trimBST(root.left, low, high)
              root.right = trimBST(root.right, low, high)
              return root
          }
        `),
        swift: code`
          func trimBST(_ root: TreeNode?, _ low: Int, _ high: Int) -> TreeNode? {
              guard let node = root else { return nil }
              if node.val < low { return trimBST(node.right, low, high) }
              if node.val > high { return trimBST(node.left, low, high) }
              node.left = trimBST(node.left, low, high)
              node.right = trimBST(node.right, low, high)
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn trimBST(root: Option<Rc<RefCell<TreeNode>>>, low: i32, high: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let node = match root {
                  None => return None,
                  Some(n) => n,
              };
              let v = node.borrow().val;
              if v < low {
                  let r = node.borrow_mut().right.take();
                  return trimBST(r, low, high);
              }
              if v > high {
                  let l = node.borrow_mut().left.take();
                  return trimBST(l, low, high);
              }
              let l = node.borrow_mut().left.take();
              let r = node.borrow_mut().right.take();
              let nl = trimBST(l, low, high);
              let nr = trimBST(r, low, high);
              node.borrow_mut().left = nl;
              node.borrow_mut().right = nr;
              Some(node)
          }
        `,
        php: code`
          function trimBST($root, $low, $high) {
              if ($root === null) return null;
              if ($root->val < $low) return trimBST($root->right, $low, $high);
              if ($root->val > $high) return trimBST($root->left, $low, $high);
              $root->left = trimBST($root->left, $low, $high);
              $root->right = trimBST($root->right, $low, $high);
              return $root;
          }
        `,
        ruby: code`
          def trimBST(root, low, high)
            return nil if root.nil?
            return trimBST(root.right, low, high) if root.val < low
            return trimBST(root.left, low, high) if root.val > high
            root.left = trimBST(root.left, low, high)
            root.right = trimBST(root.right, low, high)
            root
          end
        `,
      },
    };
  })(),

  // ── Longest Univalue Path (LC 687) ──────────────────────────────
  (() => {
    // Brute force: from every node, the longest same-value downward arm on each side.
    const down = (n: TNode | null, v: number): number => (!n || n.val !== v ? 0 : 1 + Math.max(down(n.left, v), down(n.right, v)));
    const ref = (root: TNode | null) => {
      let best = 0;
      for (const n of nodesOf(root)) best = Math.max(best, down(n.left, n.val) + down(n.right, n.val));
      return best;
    };
    const EX = [
      { root: [5, 4, 5, 1, 1, null, 5], note: "The path 5 → 5 → 5 down the right side has two edges." },
      { root: [1, 4, 5, 4, 4, null, 5], note: "The path 4 – 4 – 4 runs through the left child of the root and both its children: two edges." },
      { root: [], note: "An empty tree has no path." },
    ];
    return {
      slug: "longest-univalue-path",
      title: "Longest Univalue Path",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "longestUnivaluePath", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "Given the `root` of a binary tree, return the length of the longest path in which **every node has the same value**. The path may or may not pass through the root, and it may bend at one node (go up through it from one child and down into the other).\n\nThe length of a path is the number of **edges** on it.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [0, 10^4]", "-1000 <= Node.val <= 1000", "The depth of the tree will not exceed 1000"]),
      hints: [
        "Every path has one highest node. At that node, the path is an arm going down the left plus an arm going down the right.",
        "Compute, for every node, the longest downward arm of equal values starting there. A child extends the arm only if its value equals the node's.",
        "In one post-order DFS: return the longer arm to the parent, but update the global answer with the sum of both arms.",
      ],
      editorial: explain({
        idea: "Like the diameter of a tree, but an edge only counts when both its ends hold the same value. A post-order DFS returns, for each node, the longest single downward arm of equal values, and combines the two arms at the node to try the bent path.",
        steps: [
          "`arm(node)`: return 0 for null; otherwise compute `l = arm(left)` and `r = arm(right)` first.",
          "`al = l + 1` if the left child exists and has the same value as `node`, else 0; `ar` likewise on the right.",
          "Update `best = max(best, al + ar)` — the path that bends at `node`.",
          "Return `max(al, ar)`: a path continuing upward can use only one side.",
        ],
        why: "Any univalue path has a unique topmost node, and from it the path is two downward arms of that value (either possibly empty). `al` and `ar` are exactly the longest such arms, so `al + ar` is the longest path topped at that node, and the maximum over all nodes is the answer.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Count edges, not nodes — a single node is a path of length 0.",
          "Recurse into a child even when its value differs: a longer path may lie entirely below it.",
          "Return only one arm upward; returning `al + ar` would let a path fork.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 0 : sizeOf(rng, [2, 5, 10, 25, 40]);
        const [lo, hi] = pick(rng, [[1, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [0, 3], [-1000, 1000]] as Array<[number, number]>);
        const root = shapeTree(rng, n, lo, hi);
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def longestUnivaluePath(root: Optional[TreeNode]) -> int:
              best = 0

              def arm(node):
                  nonlocal best
                  if node is None:
                      return 0
                  l = arm(node.left)
                  r = arm(node.right)
                  al = l + 1 if node.left is not None and node.left.val == node.val else 0
                  ar = r + 1 if node.right is not None and node.right.val == node.val else 0
                  best = max(best, al + ar)
                  return max(al, ar)

              arm(root)
              return best
        `,
        javascript: code`
          var longestUnivaluePath = function(root) {
              var best = 0;
              var arm = function(node) {
                  if (node === null) return 0;
                  var l = arm(node.left), r = arm(node.right);
                  var al = node.left !== null && node.left.val === node.val ? l + 1 : 0;
                  var ar = node.right !== null && node.right.val === node.val ? r + 1 : 0;
                  if (al + ar > best) best = al + ar;
                  return Math.max(al, ar);
              };
              arm(root);
              return best;
          };
        `,
        typescript: code`
          function longestUnivaluePath(root: TreeNode | null): number {
              var best = 0;
              var arm = function(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var l = arm(node.left), r = arm(node.right);
                  var al = node.left !== null && node.left.val === node.val ? l + 1 : 0;
                  var ar = node.right !== null && node.right.val === node.val ? r + 1 : 0;
                  if (al + ar > best) best = al + ar;
                  return Math.max(al, ar);
              };
              arm(root);
              return best;
          }
        `,
        java: code`
          public static int longestUnivaluePath(TreeNode root) {
              int[] best = new int[1];
              arm(root, best);
              return best[0];
          }

          static int arm(TreeNode node, int[] best) {
              if (node == null) return 0;
              int l = arm(node.left, best), r = arm(node.right, best);
              int al = node.left != null && node.left.val == node.val ? l + 1 : 0;
              int ar = node.right != null && node.right.val == node.val ? r + 1 : 0;
              best[0] = Math.max(best[0], al + ar);
              return Math.max(al, ar);
          }
        `,
        cpp: code`
          int univalueArm(TreeNode* node, int& best);

          int longestUnivaluePath(TreeNode* root) {
              int best = 0;
              univalueArm(root, best);
              return best;
          }

          int univalueArm(TreeNode* node, int& best) {
              if (!node) return 0;
              int l = univalueArm(node->left, best), r = univalueArm(node->right, best);
              int al = node->left && node->left->val == node->val ? l + 1 : 0;
              int ar = node->right && node->right->val == node->val ? r + 1 : 0;
              best = max(best, al + ar);
              return max(al, ar);
          }
        `,
        c: code`
          static int univalueArm(struct TreeNode* node, int* best);

          int longestUnivaluePath(struct TreeNode* root) {
              int best = 0;
              univalueArm(root, &best);
              return best;
          }

          static int univalueArm(struct TreeNode* node, int* best) {
              if (node == NULL) return 0;
              int l = univalueArm(node->left, best), r = univalueArm(node->right, best);
              int al = node->left != NULL && node->left->val == node->val ? l + 1 : 0;
              int ar = node->right != NULL && node->right->val == node->val ? r + 1 : 0;
              if (al + ar > *best) *best = al + ar;
              return al > ar ? al : ar;
          }
        `,
        csharp: code`
          public static int LongestUnivaluePath(TreeNode root)
          {
              int best = 0;
              Arm(root, ref best);
              return best;
          }

          static int Arm(TreeNode node, ref int best)
          {
              if (node == null) return 0;
              int l = Arm(node.left, ref best), r = Arm(node.right, ref best);
              int al = node.left != null && node.left.val == node.val ? l + 1 : 0;
              int ar = node.right != null && node.right.val == node.val ? r + 1 : 0;
              best = Math.Max(best, al + ar);
              return Math.Max(al, ar);
          }
        `,
        go: code`
          func longestUnivaluePath(root *TreeNode) int {
              best := 0
              univalueArm(root, &best)
              return best
          }

          func univalueArm(node *TreeNode, best *int) int {
              if node == nil {
                  return 0
              }
              l, r := univalueArm(node.Left, best), univalueArm(node.Right, best)
              al, ar := 0, 0
              if node.Left != nil && node.Left.Val == node.Val {
                  al = l + 1
              }
              if node.Right != nil && node.Right.Val == node.Val {
                  ar = r + 1
              }
              if al+ar > *best {
                  *best = al + ar
              }
              if al > ar {
                  return al
              }
              return ar
          }
        `,
        kotlin: kt(code`
          fun longestUnivaluePath(root: TreeNode?): Int {
              val best = IntArray(1)
              univalueArm(root, best)
              return best[0]
          }

          fun univalueArm(node: TreeNode?, best: IntArray): Int {
              if (node == null) return 0
              val l = univalueArm(node.left, best)
              val r = univalueArm(node.right, best)
              val left = node.left
              val right = node.right
              val al = if (left != null && left.@val == node.@val) l + 1 else 0
              val ar = if (right != null && right.@val == node.@val) r + 1 else 0
              best[0] = maxOf(best[0], al + ar)
              return maxOf(al, ar)
          }
        `),
        swift: code`
          func longestUnivaluePath(_ root: TreeNode?) -> Int {
              var best = 0
              univalueArm(root, &best)
              return best
          }

          @discardableResult
          func univalueArm(_ node: TreeNode?, _ best: inout Int) -> Int {
              guard let n = node else { return 0 }
              let l = univalueArm(n.left, &best)
              let r = univalueArm(n.right, &best)
              var al = 0, ar = 0
              if let c = n.left, c.val == n.val { al = l + 1 }
              if let c = n.right, c.val == n.val { ar = r + 1 }
              best = max(best, al + ar)
              return max(al, ar)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn longestUnivaluePath(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut best = 0;
              univalue_arm(&root, &mut best);
              best
          }

          fn univalue_arm(node: &Option<Rc<RefCell<TreeNode>>>, best: &mut i32) -> i32 {
              match node {
                  None => 0,
                  Some(n) => {
                      let b = n.borrow();
                      let l = univalue_arm(&b.left, best);
                      let r = univalue_arm(&b.right, best);
                      let mut al = 0;
                      let mut ar = 0;
                      if let Some(c) = &b.left {
                          if c.borrow().val == b.val {
                              al = l + 1;
                          }
                      }
                      if let Some(c) = &b.right {
                          if c.borrow().val == b.val {
                              ar = r + 1;
                          }
                      }
                      if al + ar > *best {
                          *best = al + ar;
                      }
                      if al > ar { al } else { ar }
                  }
              }
          }
        `,
        php: code`
          function longestUnivaluePath($root) {
              $best = 0;
              univalueArm($root, $best);
              return $best;
          }

          function univalueArm($node, &$best) {
              if ($node === null) return 0;
              $l = univalueArm($node->left, $best);
              $r = univalueArm($node->right, $best);
              $al = $node->left !== null && $node->left->val == $node->val ? $l + 1 : 0;
              $ar = $node->right !== null && $node->right->val == $node->val ? $r + 1 : 0;
              $best = max($best, $al + $ar);
              return max($al, $ar);
          }
        `,
        ruby: code`
          def longestUnivaluePath(root)
            best = [0]
            univalue_arm(root, best)
            best[0]
          end

          def univalue_arm(node, best)
            return 0 if node.nil?
            l = univalue_arm(node.left, best)
            r = univalue_arm(node.right, best)
            al = !node.left.nil? && node.left.val == node.val ? l + 1 : 0
            ar = !node.right.nil? && node.right.val == node.val ? r + 1 : 0
            best[0] = al + ar if al + ar > best[0]
            [al, ar].max
          end
        `,
      },
    };
  })(),

  // ── Insert into a Binary Search Tree (LC 701) ───────────────────
  (() => {
    const ref = (root: TNode | null, value: number) => {
      const t = cloneTree(root);
      if (!t) return leaf(value);
      let cur = t;
      for (;;) {
        const side = value < cur.val ? "left" : "right";
        const next = cur[side];
        if (!next) { cur[side] = leaf(value); break; }
        cur = next;
      }
      return t;
    };
    const EX = [
      { root: [4, 2, 7, 1, 3], value: 5, note: "5 > 4 goes right to 7, then 5 < 7 goes left — an empty spot, so 5 becomes 7's left child." },
      { root: [40, 20, 60, 10, 30, 50, 70], value: 25, note: "The search goes 40 → 20 → 30 and falls off to the left of 30." },
      { root: [], value: 5, note: "Inserting into an empty tree makes the new node the root." },
    ];
    return {
      slug: "insert-into-a-binary-search-tree",
      title: "Insert into a Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "insertIntoBST", params: [{ name: "root", type: "TreeNode" as const }, { name: "value", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary search tree and an integer `value` that is not yet in the tree. Insert `value` and return the root of the tree.\n\nMore than one valid search tree can result, so insert it this way: search for `value` from the root as usual (left when it is smaller than a node, right when it is larger), and place a new node holding `value` at the empty spot where the search falls off the tree. Nothing else moves.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, value = ${e.value}`, out: fmtTree(ref(treeFrom(e.root), e.value)), note: e.note })),
        ["The number of nodes in the tree is in the range [0, 10^4]", "-10^8 <= Node.val <= 10^8", "All the values Node.val are unique", "-10^8 <= value <= 10^8", "value does not exist in the original BST"]),
      hints: [
        "Where would a search for `value` end? At a node whose child on the side `value` points to is missing.",
        "That missing child is exactly where the new node goes; the tree stays a valid search tree.",
        "Walk down iteratively and keep the current node, or recurse and return the subtree's root so the parent can reattach it. Don't forget the empty tree.",
      ],
      editorial: explain({
        idea: "A search for a missing value ends at an empty child pointer, and that position is consistent with every ancestor's ordering. Hanging the new node there is the simplest valid insertion and leaves the rest of the tree untouched.",
        steps: [
          "If `root` is null, return a new node holding `value`.",
          "Start at `cur = root`. If `value < cur.val`, look at `cur.left`; otherwise at `cur.right`.",
          "If that child is null, attach the new node there and stop; otherwise move to it and repeat.",
          "Return `root`.",
        ],
        why: "At each step `value` goes to the side the search-tree property requires relative to the current node, so on the final path every ancestor sees it on its correct side. Attaching a leaf changes no other link, so all other order relations still hold.",
        time: "O(h), the tree's height — O(log n) when balanced, O(n) for a chain",
        space: "O(1) iteratively (O(h) recursively)",
        pitfalls: [
          "The empty tree: the new node is the root.",
          "Do not try to rebalance or insert higher up — the statement fixes the insertion as a new leaf.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.value}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.value)) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const span = pick(rng, [n + 5, 1000, 100000000]);
        const root = randBST(rng, n, -span, span);
        const vals = nodesOf(root).map((x) => x.val);
        let value: number;
        do value = ri(rng, -span, span); while (vals.indexOf(value) >= 0);
        return { input: `${fmtTree(root)}\n${value}`, expectedOutput: fmtTree(ref(root, value)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def insertIntoBST(root: Optional[TreeNode], value: int) -> Optional[TreeNode]:
              node = TreeNode(value)
              if root is None:
                  return node
              cur = root
              while True:
                  if value < cur.val:
                      if cur.left is None:
                          cur.left = node
                          break
                      cur = cur.left
                  else:
                      if cur.right is None:
                          cur.right = node
                          break
                      cur = cur.right
              return root
        `,
        javascript: code`
          var insertIntoBST = function(root, value) {
              var node = new TreeNode(value);
              if (root === null) return node;
              var cur = root;
              while (true) {
                  if (value < cur.val) {
                      if (cur.left === null) { cur.left = node; break; }
                      cur = cur.left;
                  } else {
                      if (cur.right === null) { cur.right = node; break; }
                      cur = cur.right;
                  }
              }
              return root;
          };
        `,
        typescript: code`
          function insertIntoBST(root: TreeNode | null, value: number): TreeNode | null {
              var node = new TreeNode(value);
              if (root === null) return node;
              var cur: TreeNode = root;
              while (true) {
                  if (value < cur.val) {
                      if (cur.left === null) { cur.left = node; break; }
                      cur = cur.left;
                  } else {
                      if (cur.right === null) { cur.right = node; break; }
                      cur = cur.right;
                  }
              }
              return root;
          }
        `,
        java: code`
          public static TreeNode insertIntoBST(TreeNode root, int value) {
              TreeNode node = new TreeNode(value);
              if (root == null) return node;
              TreeNode cur = root;
              while (true) {
                  if (value < cur.val) {
                      if (cur.left == null) { cur.left = node; break; }
                      cur = cur.left;
                  } else {
                      if (cur.right == null) { cur.right = node; break; }
                      cur = cur.right;
                  }
              }
              return root;
          }
        `,
        cpp: code`
          TreeNode* insertIntoBST(TreeNode* root, int value) {
              TreeNode* node = new TreeNode(value);
              if (!root) return node;
              TreeNode* cur = root;
              while (true) {
                  if (value < cur->val) {
                      if (!cur->left) { cur->left = node; break; }
                      cur = cur->left;
                  } else {
                      if (!cur->right) { cur->right = node; break; }
                      cur = cur->right;
                  }
              }
              return root;
          }
        `,
        c: code`
          struct TreeNode* insertIntoBST(struct TreeNode* root, int value) {
              struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              node->val = value;
              node->left = NULL;
              node->right = NULL;
              if (root == NULL) return node;
              struct TreeNode* cur = root;
              while (1) {
                  if (value < cur->val) {
                      if (cur->left == NULL) { cur->left = node; break; }
                      cur = cur->left;
                  } else {
                      if (cur->right == NULL) { cur->right = node; break; }
                      cur = cur->right;
                  }
              }
              return root;
          }
        `,
        csharp: code`
          public static TreeNode InsertIntoBST(TreeNode root, int value)
          {
              var node = new TreeNode(value);
              if (root == null) return node;
              TreeNode cur = root;
              while (true)
              {
                  if (value < cur.val)
                  {
                      if (cur.left == null) { cur.left = node; break; }
                      cur = cur.left;
                  }
                  else
                  {
                      if (cur.right == null) { cur.right = node; break; }
                      cur = cur.right;
                  }
              }
              return root;
          }
        `,
        go: code`
          func insertIntoBST(root *TreeNode, value int) *TreeNode {
              node := &TreeNode{Val: value}
              if root == nil {
                  return node
              }
              cur := root
              for {
                  if value < cur.Val {
                      if cur.Left == nil {
                          cur.Left = node
                          break
                      }
                      cur = cur.Left
                  } else {
                      if cur.Right == nil {
                          cur.Right = node
                          break
                      }
                      cur = cur.Right
                  }
              }
              return root
          }
        `,
        kotlin: kt(code`
          fun insertIntoBST(root: TreeNode?, value: Int): TreeNode? {
              val node = TreeNode(value)
              if (root == null) return node
              var cur: TreeNode = root
              while (true) {
                  if (value < cur.@val) {
                      val next = cur.left
                      if (next == null) { cur.left = node; break }
                      cur = next
                  } else {
                      val next = cur.right
                      if (next == null) { cur.right = node; break }
                      cur = next
                  }
              }
              return root
          }
        `),
        swift: code`
          func insertIntoBST(_ root: TreeNode?, _ value: Int) -> TreeNode? {
              let node = TreeNode(value)
              guard let r = root else { return node }
              var cur = r
              while true {
                  if value < cur.val {
                      guard let next = cur.left else { cur.left = node; break }
                      cur = next
                  } else {
                      guard let next = cur.right else { cur.right = node; break }
                      cur = next
                  }
              }
              return r
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn insertIntoBST(root: Option<Rc<RefCell<TreeNode>>>, value: i32) -> Option<Rc<RefCell<TreeNode>>> {
              let node = Rc::new(RefCell::new(TreeNode::new(value)));
              let start = match root {
                  None => return Some(node),
                  Some(r) => r,
              };
              let mut cur = start.clone();
              loop {
                  let go_left = value < cur.borrow().val;
                  let next = if go_left { cur.borrow().left.clone() } else { cur.borrow().right.clone() };
                  match next {
                      Some(n) => cur = n,
                      None => {
                          if go_left {
                              cur.borrow_mut().left = Some(node);
                          } else {
                              cur.borrow_mut().right = Some(node);
                          }
                          break;
                      }
                  }
              }
              Some(start)
          }
        `,
        php: code`
          function insertIntoBST($root, $value) {
              $node = new TreeNode($value);
              if ($root === null) return $node;
              $cur = $root;
              while (true) {
                  if ($value < $cur->val) {
                      if ($cur->left === null) { $cur->left = $node; break; }
                      $cur = $cur->left;
                  } else {
                      if ($cur->right === null) { $cur->right = $node; break; }
                      $cur = $cur->right;
                  }
              }
              return $root;
          }
        `,
        ruby: code`
          def insertIntoBST(root, value)
            node = TreeNode.new(value)
            return node if root.nil?
            cur = root
            loop do
              if value < cur.val
                if cur.left.nil?
                  cur.left = node
                  break
                end
                cur = cur.left
              else
                if cur.right.nil?
                  cur.right = node
                  break
                end
                cur = cur.right
              end
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Binary Tree Pruning (LC 814) ────────────────────────────────
  (() => {
    const hasOne = (n: TNode | null): boolean => !!n && (n.val === 1 || hasOne(n.left) || hasOne(n.right));
    // Straightforward: keep a node exactly when its subtree holds a 1.
    const keep = (n: TNode | null): TNode | null => (n && hasOne(n) ? { val: n.val, left: keep(n.left), right: keep(n.right) } : null);
    const ref = (root: TNode | null) => keep(root);
    const EX = [
      { root: [1, null, 0, 0, 1], note: "The left child of the 0 is a lone 0 and is removed; the 0 itself stays because its subtree contains a 1." },
      { root: [1, 0, 1, 0, 0, 0, 1], note: "The whole left subtree is zeros and goes; on the right only the path down to the last 1 survives." },
      { root: [0, 0, 0], note: "No node holds a 1, so the entire tree is pruned away." },
    ];
    return {
      slug: "binary-tree-pruning",
      title: "Binary Tree Pruning",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "pruneTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given the `root` of a binary tree in which every node holds `0` or `1`. Remove every subtree that does not contain a `1`, and return the root of what remains (an empty tree if nothing does).\n\nThe subtree of a node is the node together with all of its descendants.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 200]", "Node.val is either 0 or 1"]),
      hints: [
        "Whether a node survives depends on its subtree — so decide for the children before deciding for the node.",
        "Prune both children recursively first. Afterwards, a node with no remaining children survives only if it holds 1.",
        "Return null for a pruned subtree and assign the results back to `left` and `right`; the root itself can disappear.",
      ],
      editorial: explain({
        idea: "A post-order walk prunes the children first; then a node is removable exactly when both its pruned children are empty and its own value is 0.",
        steps: [
          "`prune(node)`: return null for null.",
          "Set `node.left = prune(node.left)` and `node.right = prune(node.right)`.",
          "If both are now null and `node.val == 0`, return null; otherwise return `node`.",
          "The answer is `prune(root)`.",
        ],
        why: "After pruning, a child subtree is non-empty exactly when it contains a 1 (by induction from the leaves). So a node's whole subtree lacks a 1 precisely when both pruned children are empty and the node is 0 — the case that returns null.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Checking the node before pruning its children misses zero-leaves whose removal turns their parent into a removable zero-leaf.",
          "The root itself may be pruned — the result can be empty.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 0, 0);
        const p = pick(rng, [0, 0.05, 0.15, 0.3, 0.5, 0.9]);
        for (const n of nodesOf(root)) n.val = rng() < p ? 1 : 0;
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def pruneTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
              if root is None:
                  return None
              root.left = pruneTree(root.left)
              root.right = pruneTree(root.right)
              if root.left is None and root.right is None and root.val == 0:
                  return None
              return root
        `,
        javascript: code`
          var pruneTree = function(root) {
              if (root === null) return null;
              root.left = pruneTree(root.left);
              root.right = pruneTree(root.right);
              if (root.left === null && root.right === null && root.val === 0) return null;
              return root;
          };
        `,
        typescript: code`
          function pruneTree(root: TreeNode | null): TreeNode | null {
              if (root === null) return null;
              root.left = pruneTree(root.left);
              root.right = pruneTree(root.right);
              if (root.left === null && root.right === null && root.val === 0) return null;
              return root;
          }
        `,
        java: code`
          public static TreeNode pruneTree(TreeNode root) {
              if (root == null) return null;
              root.left = pruneTree(root.left);
              root.right = pruneTree(root.right);
              if (root.left == null && root.right == null && root.val == 0) return null;
              return root;
          }
        `,
        cpp: code`
          TreeNode* pruneTree(TreeNode* root) {
              if (!root) return nullptr;
              root->left = pruneTree(root->left);
              root->right = pruneTree(root->right);
              if (!root->left && !root->right && root->val == 0) return nullptr;
              return root;
          }
        `,
        c: code`
          struct TreeNode* pruneTree(struct TreeNode* root) {
              if (root == NULL) return NULL;
              root->left = pruneTree(root->left);
              root->right = pruneTree(root->right);
              if (root->left == NULL && root->right == NULL && root->val == 0) return NULL;
              return root;
          }
        `,
        csharp: code`
          public static TreeNode PruneTree(TreeNode root)
          {
              if (root == null) return null;
              root.left = PruneTree(root.left);
              root.right = PruneTree(root.right);
              if (root.left == null && root.right == null && root.val == 0) return null;
              return root;
          }
        `,
        go: code`
          func pruneTree(root *TreeNode) *TreeNode {
              if root == nil {
                  return nil
              }
              root.Left = pruneTree(root.Left)
              root.Right = pruneTree(root.Right)
              if root.Left == nil && root.Right == nil && root.Val == 0 {
                  return nil
              }
              return root
          }
        `,
        kotlin: kt(code`
          fun pruneTree(root: TreeNode?): TreeNode? {
              if (root == null) return null
              root.left = pruneTree(root.left)
              root.right = pruneTree(root.right)
              if (root.left == null && root.right == null && root.@val == 0) return null
              return root
          }
        `),
        swift: code`
          func pruneTree(_ root: TreeNode?) -> TreeNode? {
              guard let node = root else { return nil }
              node.left = pruneTree(node.left)
              node.right = pruneTree(node.right)
              if node.left == nil && node.right == nil && node.val == 0 { return nil }
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn pruneTree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              let node = match root {
                  None => return None,
                  Some(n) => n,
              };
              let l = node.borrow_mut().left.take();
              let r = node.borrow_mut().right.take();
              let nl = pruneTree(l);
              let nr = pruneTree(r);
              let keep = node.borrow().val == 1 || nl.is_some() || nr.is_some();
              if !keep {
                  return None;
              }
              node.borrow_mut().left = nl;
              node.borrow_mut().right = nr;
              Some(node)
          }
        `,
        php: code`
          function pruneTree($root) {
              if ($root === null) return null;
              $root->left = pruneTree($root->left);
              $root->right = pruneTree($root->right);
              if ($root->left === null && $root->right === null && $root->val == 0) return null;
              return $root;
          }
        `,
        ruby: code`
          def pruneTree(root)
            return nil if root.nil?
            root.left = pruneTree(root.left)
            root.right = pruneTree(root.right)
            return nil if root.left.nil? && root.right.nil? && root.val == 0
            root
          end
        `,
      },
    };
  })(),

  // ── All Nodes Distance K in Binary Tree (LC 863) ────────────────
  (() => {
    const ref = (root: TNode | null, target: number, k: number) => {
      // Path from the root to every node; distance = depths minus twice the shared prefix.
      const paths = new Map<number, number[]>();
      const walk = (n: TNode | null, path: number[]) => {
        if (!n) return;
        const p = [...path, n.val];
        paths.set(n.val, p);
        walk(n.left, p);
        walk(n.right, p);
      };
      walk(root, []);
      const pt = paths.get(target)!;
      const out: number[] = [];
      paths.forEach((p, v) => {
        let c = 0;
        while (c < p.length && c < pt.length && p[c] === pt[c]) c++;
        if (p.length + pt.length - 2 * c === k) out.push(v);
      });
      return out.sort((a, b) => a - b);
    };
    const EX = [
      { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], target: 5, k: 2, note: "Two edges from 5: down to 7 and 4 (through 2), and up through 3 to 1. Sorted, that is 1, 4, 7." },
      { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], target: 7, k: 1, note: "7 is a leaf; its only neighbour is its parent 2." },
      { root: [1], target: 1, k: 3, note: "No node is three edges away in a one-node tree." },
    ];
    return {
      slug: "all-nodes-distance-k-in-binary-tree",
      title: "All Nodes Distance K in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Meta", "Microsoft", "Google"],
      signature: { funcName: "distanceK", params: [{ name: "root", type: "TreeNode" as const }, { name: "target", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the `root` of a binary tree whose node values are all distinct, the value `target` of one of its nodes, and an integer `k`.\n\nReturn the values of all nodes that are exactly `k` edges away from the target node — moving along tree edges in either direction, up to a parent or down to a child — **sorted in ascending order**.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, target = ${e.target}, k = ${e.k}`, out: fmtIntArr(ref(treeFrom(e.root), e.target, e.k)), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 500]", "0 <= Node.val <= 500", "All the values Node.val are unique", "target is the value of one of the nodes in the tree", "0 <= k <= 1000"]),
      hints: [
        "Going down from the target is easy; the trouble is going up, because a node does not know its parent.",
        "Record every node's parent in one traversal (or turn the tree into an undirected graph). Then the tree is just a graph.",
        "Run a breadth-first search from the target over children and parent links, never revisiting a node, and collect what sits at distance `k`.",
      ],
      editorial: explain({
        idea: "Distances in a tree run through parents as well as children. Once each node's neighbours — its two children and its parent — are known, the nodes at distance `k` are exactly BFS layer `k` from the target.",
        steps: [
          "Traverse the tree once and record, for every node, its neighbours: the parent link in both directions. Since values are distinct (and at most 500), an adjacency list indexed by value works.",
          "Run BFS from `target` with a `dist` array (−1 = unseen); stop expanding a node once it is at distance `k`.",
          "Collect every value whose distance is exactly `k`, in ascending order of value.",
        ],
        why: "Every tree edge appears in both directions in the adjacency lists, so the graph's shortest paths are the tree's paths; BFS assigns each node its true edge distance from the target, and the nodes with distance `k` are the answer.",
        time: "O(n) — plus O(V) to scan values in order, V = 501 here",
        space: "O(n)",
        pitfalls: [
          "Mark nodes as visited, or the walk bounces between a child and its parent forever.",
          "`k = 0` answers just the target itself; a large `k` can answer an empty list.",
          "Return the values sorted ascending, as the statement fixes.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.target}\n${e.k}`, expectedOutput: fmtIntArr(ref(treeFrom(e.root), e.target, e.k)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = distinctVals(rng, shapeTree(rng, n, 0, 0), 0, pick(rng, [n + 2, 500]));
        const target = pick(rng, nodesOf(root)).val;
        const r = rng();
        // Mostly the distance to some node of the tree, so most answers are non-empty.
        const adj = new Map<number, number[]>();
        for (const x of nodesOf(root)) for (const c of [x.left, x.right]) if (c) {
          adj.set(x.val, [...(adj.get(x.val) || []), c.val]);
          adj.set(c.val, [...(adj.get(c.val) || []), x.val]);
        }
        const dist = new Map<number, number>([[target, 0]]);
        const queue = [target];
        for (let h = 0; h < queue.length; h++) for (const v of adj.get(queue[h]) || []) if (!dist.has(v)) { dist.set(v, dist.get(queue[h])! + 1); queue.push(v); }
        const k = r < 0.75 ? dist.get(pick(rng, queue))! : r < 0.95 ? ri(rng, 0, 12) : pick(rng, [999, 1000]);
        return { input: `${fmtTree(root)}\n${target}\n${k}`, expectedOutput: fmtIntArr(ref(root, target, k)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def distanceK(root: Optional[TreeNode], target: int, k: int) -> List[int]:
              adj = {}
              stack = [root]
              adj[root.val] = []
              while stack:
                  node = stack.pop()
                  for child in (node.left, node.right):
                      if child is not None:
                          adj[child.val] = [node.val]
                          adj[node.val].append(child.val)
                          stack.append(child)
              dist = {target: 0}
              queue = [target]
              head = 0
              while head < len(queue):
                  u = queue[head]
                  head += 1
                  if dist[u] == k:
                      continue
                  for v in adj[u]:
                      if v not in dist:
                          dist[v] = dist[u] + 1
                          queue.append(v)
              return sorted(v for v, d in dist.items() if d == k)
        `,
        javascript: code`
          var distanceK = function(root, target, k) {
              var adj = {};
              adj[root.val] = [];
              var stack = [root];
              while (stack.length > 0) {
                  var node = stack.pop();
                  var kids = [node.left, node.right];
                  for (var c = 0; c < 2; c++) {
                      var child = kids[c];
                      if (child !== null) {
                          adj[child.val] = [node.val];
                          adj[node.val].push(child.val);
                          stack.push(child);
                      }
                  }
              }
              var dist = {};
              dist[target] = 0;
              var queue = [target], out = [];
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  if (dist[u] === k) { out.push(u); continue; }
                  for (var i = 0; i < adj[u].length; i++) {
                      var v = adj[u][i];
                      if (dist[v] === undefined) { dist[v] = dist[u] + 1; queue.push(v); }
                  }
              }
              return out.sort(function(a, b) { return a - b; });
          };
        `,
        typescript: code`
          function distanceK(root: TreeNode | null, target: number, k: number): number[] {
              var adj: { [v: number]: number[] } = {};
              var top = root as TreeNode;
              adj[top.val] = [];
              var stack: TreeNode[] = [top];
              while (stack.length > 0) {
                  var node = stack.pop() as TreeNode;
                  var kids = [node.left, node.right];
                  for (var c = 0; c < 2; c++) {
                      var child = kids[c];
                      if (child !== null) {
                          adj[child.val] = [node.val];
                          adj[node.val].push(child.val);
                          stack.push(child);
                      }
                  }
              }
              var dist: { [v: number]: number } = {};
              dist[target] = 0;
              var queue: number[] = [target], out: number[] = [];
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  if (dist[u] === k) { out.push(u); continue; }
                  for (var i = 0; i < adj[u].length; i++) {
                      var v = adj[u][i];
                      if (dist[v] === undefined) { dist[v] = dist[u] + 1; queue.push(v); }
                  }
              }
              return out.sort(function(a, b) { return a - b; });
          }
        `,
        java: code`
          public static int[] distanceK(TreeNode root, int target, int k) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i <= 500; i++) adj.add(new ArrayList<>());
              link(root, adj);
              int[] dist = new int[501];
              Arrays.fill(dist, -1);
              dist[target] = 0;
              ArrayDeque<Integer> queue = new ArrayDeque<>();
              queue.add(target);
              while (!queue.isEmpty()) {
                  int u = queue.poll();
                  if (dist[u] == k) continue;
                  for (int v : adj.get(u)) {
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.add(v); }
                  }
              }
              List<Integer> out = new ArrayList<>();
              for (int v = 0; v <= 500; v++) if (dist[v] == k) out.add(v);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }

          static void link(TreeNode node, List<List<Integer>> adj) {
              for (TreeNode child : new TreeNode[] { node.left, node.right }) {
                  if (child == null) continue;
                  adj.get(node.val).add(child.val);
                  adj.get(child.val).add(node.val);
                  link(child, adj);
              }
          }
        `,
        cpp: code`
          void linkTree(TreeNode* node, vector<vector<int>>& adj);

          vector<int> distanceK(TreeNode* root, int target, int k) {
              vector<vector<int>> adj(501);
              linkTree(root, adj);
              vector<int> dist(501, -1);
              dist[target] = 0;
              vector<int> queue = {target};
              for (size_t h = 0; h < queue.size(); h++) {
                  int u = queue[h];
                  if (dist[u] == k) continue;
                  for (int v : adj[u]) {
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push_back(v); }
                  }
              }
              vector<int> out;
              for (int v = 0; v <= 500; v++) if (dist[v] == k) out.push_back(v);
              return out;
          }

          void linkTree(TreeNode* node, vector<vector<int>>& adj) {
              for (TreeNode* child : {node->left, node->right}) {
                  if (!child) continue;
                  adj[node->val].push_back(child->val);
                  adj[child->val].push_back(node->val);
                  linkTree(child, adj);
              }
          }
        `,
        c: code`
          static void linkTree(struct TreeNode* node, int adj[][3], int* deg);

          int* distanceK(struct TreeNode* root, int target, int k, int* returnSize) {
              int adj[501][3];
              int deg[501], dist[501], queue[501];
              for (int i = 0; i <= 500; i++) { deg[i] = 0; dist[i] = -1; }
              linkTree(root, adj, deg);
              int head = 0, tail = 0;
              dist[target] = 0;
              queue[tail++] = target;
              while (head < tail) {
                  int u = queue[head++];
                  if (dist[u] == k) continue;
                  for (int i = 0; i < deg[u]; i++) {
                      int v = adj[u][i];
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue[tail++] = v; }
                  }
              }
              int* out = (int*) malloc(501 * sizeof(int));
              int m = 0;
              for (int v = 0; v <= 500; v++) if (dist[v] == k) out[m++] = v;
              *returnSize = m;
              return out;
          }

          static void linkTree(struct TreeNode* node, int adj[][3], int* deg) {
              struct TreeNode* kids[2] = { node->left, node->right };
              for (int c = 0; c < 2; c++) {
                  struct TreeNode* child = kids[c];
                  if (child == NULL) continue;
                  adj[node->val][deg[node->val]++] = child->val;
                  adj[child->val][deg[child->val]++] = node->val;
                  linkTree(child, adj, deg);
              }
          }
        `,
        csharp: code`
          public static int[] DistanceK(TreeNode root, int target, int k)
          {
              var adj = new List<int>[501];
              for (int i = 0; i <= 500; i++) adj[i] = new List<int>();
              Link(root, adj);
              var dist = new int[501];
              for (int i = 0; i <= 500; i++) dist[i] = -1;
              dist[target] = 0;
              var queue = new Queue<int>();
              queue.Enqueue(target);
              while (queue.Count > 0)
              {
                  int u = queue.Dequeue();
                  if (dist[u] == k) continue;
                  foreach (int v in adj[u])
                  {
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.Enqueue(v); }
                  }
              }
              var output = new List<int>();
              for (int v = 0; v <= 500; v++) if (dist[v] == k) output.Add(v);
              return output.ToArray();
          }

          static void Link(TreeNode node, List<int>[] adj)
          {
              foreach (TreeNode child in new[] { node.left, node.right })
              {
                  if (child == null) continue;
                  adj[node.val].Add(child.val);
                  adj[child.val].Add(node.val);
                  Link(child, adj);
              }
          }
        `,
        go: code`
          func distanceK(root *TreeNode, target int, k int) []int {
              adj := make([][]int, 501)
              linkTree(root, adj)
              dist := make([]int, 501)
              for i := range dist {
                  dist[i] = -1
              }
              dist[target] = 0
              queue := []int{target}
              for h := 0; h < len(queue); h++ {
                  u := queue[h]
                  if dist[u] == k {
                      continue
                  }
                  for _, v := range adj[u] {
                      if dist[v] < 0 {
                          dist[v] = dist[u] + 1
                          queue = append(queue, v)
                      }
                  }
              }
              out := []int{}
              for v := 0; v <= 500; v++ {
                  if dist[v] == k {
                      out = append(out, v)
                  }
              }
              return out
          }

          func linkTree(node *TreeNode, adj [][]int) {
              for _, child := range []*TreeNode{node.Left, node.Right} {
                  if child == nil {
                      continue
                  }
                  adj[node.Val] = append(adj[node.Val], child.Val)
                  adj[child.Val] = append(adj[child.Val], node.Val)
                  linkTree(child, adj)
              }
          }
        `,
        kotlin: kt(code`
          fun distanceK(root: TreeNode?, target: Int, k: Int): IntArray {
              val adj = Array(501) { ArrayList<Int>() }
              linkTree(root!!, adj)
              val dist = IntArray(501) { -1 }
              dist[target] = 0
              val queue = ArrayList<Int>()
              queue.add(target)
              var head = 0
              while (head < queue.size) {
                  val u = queue[head++]
                  if (dist[u] == k) continue
                  for (v in adj[u]) {
                      if (dist[v] < 0) {
                          dist[v] = dist[u] + 1
                          queue.add(v)
                      }
                  }
              }
              return (0..500).filter { dist[it] == k }.toIntArray()
          }

          fun linkTree(node: TreeNode, adj: Array<ArrayList<Int>>) {
              for (child in listOf(node.left, node.right)) {
                  if (child == null) continue
                  adj[node.@val].add(child.@val)
                  adj[child.@val].add(node.@val)
                  linkTree(child, adj)
              }
          }
        `),
        swift: code`
          func distanceK(_ root: TreeNode?, _ target: Int, _ k: Int) -> [Int] {
              var adj = [[Int]](repeating: [], count: 501)
              linkTree(root!, &adj)
              var dist = [Int](repeating: -1, count: 501)
              dist[target] = 0
              var queue = [target]
              var head = 0
              while head < queue.count {
                  let u = queue[head]
                  head += 1
                  if dist[u] == k { continue }
                  for v in adj[u] where dist[v] < 0 {
                      dist[v] = dist[u] + 1
                      queue.append(v)
                  }
              }
              return (0...500).filter { dist[$0] == k }
          }

          func linkTree(_ node: TreeNode, _ adj: inout [[Int]]) {
              for c in [node.left, node.right] {
                  guard let child = c else { continue }
                  adj[node.val].append(child.val)
                  adj[child.val].append(node.val)
                  linkTree(child, &adj)
              }
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn distanceK(root: Option<Rc<RefCell<TreeNode>>>, target: i32, k: i32) -> Vec<i32> {
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); 501];
              link_tree(&root, &mut adj);
              let mut dist = vec![-1i32; 501];
              dist[target as usize] = 0;
              let mut queue = vec![target as usize];
              let mut head = 0;
              while head < queue.len() {
                  let u = queue[head];
                  head += 1;
                  if dist[u] == k {
                      continue;
                  }
                  for i in 0..adj[u].len() {
                      let v = adj[u][i];
                      if dist[v] < 0 {
                          dist[v] = dist[u] + 1;
                          queue.push(v);
                      }
                  }
              }
              (0..501).filter(|&v| dist[v] == k).map(|v| v as i32).collect()
          }

          fn link_tree(node: &Option<Rc<RefCell<TreeNode>>>, adj: &mut Vec<Vec<usize>>) {
              if let Some(n) = node {
                  let b = n.borrow();
                  let me = b.val as usize;
                  for child in [b.left.clone(), b.right.clone()].iter() {
                      if let Some(c) = child {
                          let cv = c.borrow().val as usize;
                          adj[me].push(cv);
                          adj[cv].push(me);
                      }
                      link_tree(child, adj);
                  }
              }
          }
        `,
        php: code`
          function distanceK($root, $target, $k) {
              $adj = [$root->val => []];
              $stack = [$root];
              while (count($stack) > 0) {
                  $node = array_pop($stack);
                  foreach ([$node->left, $node->right] as $child) {
                      if ($child === null) continue;
                      $adj[$child->val] = [$node->val];
                      $adj[$node->val][] = $child->val;
                      $stack[] = $child;
                  }
              }
              $dist = [$target => 0];
              $queue = [$target];
              for ($h = 0; $h < count($queue); $h++) {
                  $u = $queue[$h];
                  if ($dist[$u] == $k) continue;
                  foreach ($adj[$u] as $v) {
                      if (!isset($dist[$v])) { $dist[$v] = $dist[$u] + 1; $queue[] = $v; }
                  }
              }
              $out = [];
              foreach ($dist as $v => $d) if ($d == $k) $out[] = $v;
              sort($out);
              return $out;
          }
        `,
        ruby: code`
          def distanceK(root, target, k)
            adj = { root.val => [] }
            stack = [root]
            until stack.empty?
              node = stack.pop
              [node.left, node.right].each do |child|
                next if child.nil?
                adj[child.val] = [node.val]
                adj[node.val] << child.val
                stack << child
              end
            end
            dist = { target => 0 }
            queue = [target]
            head = 0
            while head < queue.length
              u = queue[head]
              head += 1
              next if dist[u] == k
              adj[u].each do |v|
                next if dist.key?(v)
                dist[v] = dist[u] + 1
                queue << v
              end
            end
            dist.select { |_, d| d == k }.keys.sort
          end
        `,
      },
    };
  })(),

  // ── Smallest Subtree with all the Deepest Nodes (LC 865) ────────
  (() => {
    const ref = (root: TNode | null) => {
      // Brute force: the deepest nodes, then the lowest node whose subtree holds them all.
      const h = heightOf(root);
      const deepest: TNode[] = [];
      const mark = (n: TNode | null, d: number) => { if (!n) return; if (d === h) deepest.push(n); mark(n.left, d + 1); mark(n.right, d + 1); };
      mark(root, 1);
      const holds = (n: TNode | null, x: TNode): boolean => !!n && (n === x || holds(n.left, x) || holds(n.right, x));
      let cur = root!;
      for (;;) {
        if (cur.left && deepest.every((x) => holds(cur.left, x))) cur = cur.left;
        else if (cur.right && deepest.every((x) => holds(cur.right, x))) cur = cur.right;
        else return cur;
      }
    };
    const EX = [
      { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], note: "The deepest nodes are 7 and 4; the smallest subtree holding both is the one rooted at their parent 2." },
      { root: [1], note: "The root is the only, and so the deepest, node." },
      { root: [0, 1, 3, null, 2], note: "2 is the single deepest node, and the smallest subtree containing it is 2 alone." },
    ];
    return {
      slug: "smallest-subtree-with-all-the-deepest-nodes",
      title: "Smallest Subtree with all the Deepest Nodes",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Tree", "Depth-First Search", "Breadth-First Search", "Meta", "Amazon", "Google"],
      signature: { funcName: "subtreeWithAllDeepest", params: [{ name: "root", type: "TreeNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `root` of a binary tree with distinct values, the **deepest nodes** are those at the greatest distance from the root.\n\nReturn the smallest subtree that contains all of the deepest nodes — that is, the subtree rooted at their lowest common ancestor. The subtree of a node is the node plus all of its descendants; return it as that subtree's level order.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: fmtTree(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 500]", "0 <= Node.val <= 500", "The values of the nodes in the tree are unique"]),
      hints: [
        "If the left subtree is deeper than the right one, every deepest node is on the left — the answer is inside the left subtree.",
        "If both subtrees have the same depth, the deepest nodes are split between them (or the node is a leaf), so the node itself is the answer.",
        "One post-order DFS can return two things per node: its subtree's depth and the answer for that subtree.",
      ],
      editorial: explain({
        idea: "Compare the depths of the two subtrees at every node. The deeper side holds all the deepest nodes, so its answer carries up unchanged; when the depths tie, the deepest nodes lie on both sides and the current node is their lowest common ancestor.",
        steps: [
          "`deep(node)` returns `(depth, answer)`; for null it is `(0, null)`.",
          "Compute `(dl, l) = deep(left)` and `(dr, r) = deep(right)`.",
          "If `dl > dr`, return `(dl + 1, l)`; if `dr > dl`, return `(dr + 1, r)`.",
          "If they are equal, return `(dl + 1, node)`. The answer is the second part of `deep(root)`.",
        ],
        why: "By induction, `deep` returns the height of a subtree and the lowest node containing all of that subtree's deepest nodes. If one side is strictly deeper, the subtree's deepest nodes all lie in it, so its answer is correct here too; if the sides tie, deepest nodes occur on both sides (or the node is a leaf), and the only node containing both groups is the node itself.",
        time: "O(n) — each node is visited once",
        space: "O(h) for the recursion",
        pitfalls: [
          "Computing heights separately at every node makes it O(n^2) on a chain; return depth and answer together.",
          "A single deepest node is its own answer — the subtree is just that node (with its descendants, of which it has none).",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: fmtTree(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const root = distinctVals(rng, shapeTree(rng, n, 0, 0), 0, pick(rng, [n + 2, 500]));
        return { input: fmtTree(root), expectedOutput: fmtTree(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def subtreeWithAllDeepest(root: Optional[TreeNode]) -> Optional[TreeNode]:
              def deep(node):
                  if node is None:
                      return 0, None
                  dl, l = deep(node.left)
                  dr, r = deep(node.right)
                  if dl > dr:
                      return dl + 1, l
                  if dr > dl:
                      return dr + 1, r
                  return dl + 1, node
              return deep(root)[1]
        `,
        javascript: code`
          var subtreeWithAllDeepest = function(root) {
              return deepest(root)[1];
          };

          var deepest = function(node) {
              if (node === null) return [0, null];
              var a = deepest(node.left), b = deepest(node.right);
              if (a[0] > b[0]) return [a[0] + 1, a[1]];
              if (b[0] > a[0]) return [b[0] + 1, b[1]];
              return [a[0] + 1, node];
          };
        `,
        typescript: code`
          function subtreeWithAllDeepest(root: TreeNode | null): TreeNode | null {
              return deepest(root).node;
          }

          function deepest(node: TreeNode | null): { depth: number; node: TreeNode | null } {
              if (node === null) return { depth: 0, node: null };
              var a = deepest(node.left), b = deepest(node.right);
              if (a.depth > b.depth) return { depth: a.depth + 1, node: a.node };
              if (b.depth > a.depth) return { depth: b.depth + 1, node: b.node };
              return { depth: a.depth + 1, node: node };
          }
        `,
        java: code`
          public static TreeNode subtreeWithAllDeepest(TreeNode root) {
              return deepest(root, new int[1]);
          }

          // Returns the answer for the subtree and stores its depth in depth[0].
          static TreeNode deepest(TreeNode node, int[] depth) {
              if (node == null) { depth[0] = 0; return null; }
              int[] a = new int[1], b = new int[1];
              TreeNode l = deepest(node.left, a), r = deepest(node.right, b);
              if (a[0] > b[0]) { depth[0] = a[0] + 1; return l; }
              if (b[0] > a[0]) { depth[0] = b[0] + 1; return r; }
              depth[0] = a[0] + 1;
              return node;
          }
        `,
        cpp: code`
          pair<int, TreeNode*> deepest(TreeNode* node);

          TreeNode* subtreeWithAllDeepest(TreeNode* root) {
              return deepest(root).second;
          }

          pair<int, TreeNode*> deepest(TreeNode* node) {
              if (!node) return {0, nullptr};
              auto a = deepest(node->left), b = deepest(node->right);
              if (a.first > b.first) return {a.first + 1, a.second};
              if (b.first > a.first) return {b.first + 1, b.second};
              return {a.first + 1, node};
          }
        `,
        c: code`
          static struct TreeNode* deepest(struct TreeNode* node, int* depth);

          struct TreeNode* subtreeWithAllDeepest(struct TreeNode* root) {
              int depth = 0;
              return deepest(root, &depth);
          }

          // Returns the answer for the subtree and stores its depth in *depth.
          static struct TreeNode* deepest(struct TreeNode* node, int* depth) {
              if (node == NULL) { *depth = 0; return NULL; }
              int a = 0, b = 0;
              struct TreeNode* l = deepest(node->left, &a);
              struct TreeNode* r = deepest(node->right, &b);
              if (a > b) { *depth = a + 1; return l; }
              if (b > a) { *depth = b + 1; return r; }
              *depth = a + 1;
              return node;
          }
        `,
        csharp: code`
          public static TreeNode SubtreeWithAllDeepest(TreeNode root)
          {
              return Deepest(root, out int depth);
          }

          static TreeNode Deepest(TreeNode node, out int depth)
          {
              if (node == null) { depth = 0; return null; }
              TreeNode l = Deepest(node.left, out int a);
              TreeNode r = Deepest(node.right, out int b);
              if (a > b) { depth = a + 1; return l; }
              if (b > a) { depth = b + 1; return r; }
              depth = a + 1;
              return node;
          }
        `,
        go: code`
          func subtreeWithAllDeepest(root *TreeNode) *TreeNode {
              _, node := deepest(root)
              return node
          }

          func deepest(node *TreeNode) (int, *TreeNode) {
              if node == nil {
                  return 0, nil
              }
              a, l := deepest(node.Left)
              b, r := deepest(node.Right)
              if a > b {
                  return a + 1, l
              }
              if b > a {
                  return b + 1, r
              }
              return a + 1, node
          }
        `,
        kotlin: kt(code`
          fun subtreeWithAllDeepest(root: TreeNode?): TreeNode? {
              return deepest(root).second
          }

          fun deepest(node: TreeNode?): Pair<Int, TreeNode?> {
              if (node == null) return Pair(0, null)
              val a = deepest(node.left)
              val b = deepest(node.right)
              if (a.first > b.first) return Pair(a.first + 1, a.second)
              if (b.first > a.first) return Pair(b.first + 1, b.second)
              return Pair(a.first + 1, node)
          }
        `),
        swift: code`
          func subtreeWithAllDeepest(_ root: TreeNode?) -> TreeNode? {
              return deepest(root).node
          }

          func deepest(_ node: TreeNode?) -> (depth: Int, node: TreeNode?) {
              guard let n = node else { return (0, nil) }
              let a = deepest(n.left)
              let b = deepest(n.right)
              if a.depth > b.depth { return (a.depth + 1, a.node) }
              if b.depth > a.depth { return (b.depth + 1, b.node) }
              return (a.depth + 1, n)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn subtreeWithAllDeepest(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {
              deepest(&root).1
          }

          fn deepest(node: &Option<Rc<RefCell<TreeNode>>>) -> (i32, Option<Rc<RefCell<TreeNode>>>) {
              match node {
                  None => (0, None),
                  Some(n) => {
                      let (l, r) = {
                          let b = n.borrow();
                          (b.left.clone(), b.right.clone())
                      };
                      let (a, la) = deepest(&l);
                      let (b, ra) = deepest(&r);
                      if a > b {
                          (a + 1, la)
                      } else if b > a {
                          (b + 1, ra)
                      } else {
                          (a + 1, Some(n.clone()))
                      }
                  }
              }
          }
        `,
        php: code`
          function subtreeWithAllDeepest($root) {
              return deepestPair($root)[1];
          }

          function deepestPair($node) {
              if ($node === null) return [0, null];
              $a = deepestPair($node->left);
              $b = deepestPair($node->right);
              if ($a[0] > $b[0]) return [$a[0] + 1, $a[1]];
              if ($b[0] > $a[0]) return [$b[0] + 1, $b[1]];
              return [$a[0] + 1, $node];
          }
        `,
        ruby: code`
          def subtreeWithAllDeepest(root)
            deepest_pair(root)[1]
          end

          def deepest_pair(node)
            return [0, nil] if node.nil?
            a = deepest_pair(node.left)
            b = deepest_pair(node.right)
            return [a[0] + 1, a[1]] if a[0] > b[0]
            return [b[0] + 1, b[1]] if b[0] > a[0]
            [a[0] + 1, node]
          end
        `,
      },
    };
  })(),

  // ── Flip Equivalent Binary Trees (LC 951) ───────────────────────
  (() => {
    // Canonical form: at every node put the child with the smaller value (null first) on the left.
    const canon = (n: TNode | null): TNode | null => {
      if (!n) return null;
      let l = canon(n.left), r = canon(n.right);
      const key = (t: TNode | null) => (t ? t.val : -1);
      if (key(l) > key(r)) { const t = l; l = r; r = t; }
      return { val: n.val, left: l, right: r };
    };
    const ref = (a: TNode | null, b: TNode | null) => fmtTree(canon(a)) === fmtTree(canon(b));
    const flipRand = (rng: Rng, n: TNode | null) => {
      if (!n) return;
      if (rng() < 0.5) { const t = n.left; n.left = n.right; n.right = t; }
      flipRand(rng, n.left);
      flipRand(rng, n.right);
    };
    const EX = [
      { r1: [1, 2, 3, 4, 5, 6, null, null, null, 7, 8], r2: [1, 3, 2, null, 6, 4, 5, null, null, null, null, 8, 7], note: "Flip the children of 1, of 3 and of 5 in the first tree and you get the second." },
      { r1: [1, 2, 3, 4], r2: [1, 3, 2, 4], note: "In the first tree 4 hangs under 2, in the second under 3. Flips only swap a node's two children, so they can never move 4 to another parent." },
      { r1: [], r2: [], note: "Two empty trees are equivalent without any flip." },
    ];
    return {
      slug: "flip-equivalent-binary-trees",
      title: "Flip Equivalent Binary Trees",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "flipEquiv", params: [{ name: "root1", type: "TreeNode" as const }, { name: "root2", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "A **flip** on a binary tree chooses one node and swaps its left and right subtrees.\n\nTwo trees are **flip equivalent** if some sequence of flips (possibly none) turns the first into the second. Given the roots `root1` and `root2` of two binary trees, each with distinct values, return `true` if they are flip equivalent and `false` otherwise.",
        EX.map((e) => ({ in: `root1 = ${lv(e.r1)}, root2 = ${lv(e.r2)}`, out: String(ref(treeFrom(e.r1), treeFrom(e.r2))), note: e.note })),
        ["The number of nodes in each tree is in the range [0, 100]", "Each tree has unique node values in the range [0, 99]"]),
      hints: [
        "Flips never change which node is whose parent — only the left/right order. So the roots must match first.",
        "Then the pair of children must match as a pair: either left with left and right with right, or left with right and right with left.",
        "Recurse: `equiv(a, b)` is true when both are null, false when exactly one is null or the values differ, and otherwise one of the two pairings must be equivalent on both sides.",
      ],
      editorial: explain({
        idea: "A flip only reorders a node's two children, so two trees are flip equivalent exactly when their roots agree and their children can be paired up — straight or crossed — into flip-equivalent subtrees. That is a direct recursion.",
        steps: [
          "If both nodes are null, return true; if only one is null, return false.",
          "If their values differ, return false.",
          "Return `(equiv(a.left, b.left) && equiv(a.right, b.right)) || (equiv(a.left, b.right) && equiv(a.right, b.left))`.",
        ],
        why: "Any sequence of flips can be reordered so that the flip at the root (if any) is decided first and the rest act independently inside the two subtrees; so the trees match exactly when one of the two pairings matches recursively. With distinct values, at most one pairing can have matching child roots, so the recursion does constant work per node.",
        time: "O(min(n1, n2)) with distinct values",
        space: "O(h) for the recursion",
        pitfalls: [
          "Compare values before recursing; otherwise the two-way branching can explode.",
          "Two empty trees are equivalent; an empty and a non-empty tree are not.",
          "Matching the multiset of values is not enough — the parent of every node must agree.",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.r1)}\n${lv(e.r2)}`, expectedOutput: String(ref(treeFrom(e.r1), treeFrom(e.r2))) })),
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 0 : sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 2, 99]);
        const t1 = distinctVals(rng, shapeTree(rng, n, 0, 0), 0, hi);
        let t2 = cloneTree(t1);
        flipRand(rng, t2);
        const r = rng();
        if (r < 0.15 && t2) {
          // change one value to one the tree does not use
          const used = new Set(nodesOf(t2).map((x) => x.val));
          if (used.size < 100) { let v: number; do v = ri(rng, 0, 99); while (used.has(v)); pick(rng, nodesOf(t2)).val = v; }
        } else if (r < 0.35 && t2 && n > 1) {
          // move one leaf under another node with a free slot
          const nodes = nodesOf(t2);
          const leafNode = pick(rng, nodes.filter((x) => x !== t2 && !x.left && !x.right));
          for (const p of nodes) { if (p.left === leafNode) p.left = null; if (p.right === leafNode) p.right = null; }
          const free = nodesOf(t2).filter((x) => !x.left || !x.right);
          const p = pick(rng, free);
          if (!p.left && (!p.right || rng() < 0.5)) p.left = leafNode; else p.right = leafNode;
        } else if (r < 0.45) {
          t2 = distinctVals(rng, shapeTree(rng, n, 0, 0), 0, hi);
        } else if (r < 0.48) {
          // one side empty
          if (rng() < 0.5) t2 = null;
          else return { input: `[]\n${fmtTree(t2)}`, expectedOutput: String(ref(null, t2)) };
        }
        return { input: `${fmtTree(t1)}\n${fmtTree(t2)}`, expectedOutput: String(ref(t1, t2)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def flipEquiv(root1: Optional[TreeNode], root2: Optional[TreeNode]) -> bool:
              if root1 is None or root2 is None:
                  return root1 is root2
              if root1.val != root2.val:
                  return False
              return (flipEquiv(root1.left, root2.left) and flipEquiv(root1.right, root2.right)) or \
                  (flipEquiv(root1.left, root2.right) and flipEquiv(root1.right, root2.left))
        `,
        javascript: code`
          var flipEquiv = function(root1, root2) {
              if (root1 === null || root2 === null) return root1 === root2;
              if (root1.val !== root2.val) return false;
              return (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right)) ||
                  (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left));
          };
        `,
        typescript: code`
          function flipEquiv(root1: TreeNode | null, root2: TreeNode | null): boolean {
              if (root1 === null || root2 === null) return root1 === root2;
              if (root1.val !== root2.val) return false;
              return (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right)) ||
                  (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left));
          }
        `,
        java: code`
          public static boolean flipEquiv(TreeNode root1, TreeNode root2) {
              if (root1 == null || root2 == null) return root1 == root2;
              if (root1.val != root2.val) return false;
              return (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right))
                  || (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left));
          }
        `,
        cpp: code`
          bool flipEquiv(TreeNode* root1, TreeNode* root2) {
              if (!root1 || !root2) return root1 == root2;
              if (root1->val != root2->val) return false;
              return (flipEquiv(root1->left, root2->left) && flipEquiv(root1->right, root2->right))
                  || (flipEquiv(root1->left, root2->right) && flipEquiv(root1->right, root2->left));
          }
        `,
        c: code`
          bool flipEquiv(struct TreeNode* root1, struct TreeNode* root2) {
              if (root1 == NULL || root2 == NULL) return root1 == root2;
              if (root1->val != root2->val) return false;
              return (flipEquiv(root1->left, root2->left) && flipEquiv(root1->right, root2->right))
                  || (flipEquiv(root1->left, root2->right) && flipEquiv(root1->right, root2->left));
          }
        `,
        csharp: code`
          public static bool FlipEquiv(TreeNode root1, TreeNode root2)
          {
              if (root1 == null || root2 == null) return root1 == root2;
              if (root1.val != root2.val) return false;
              return (FlipEquiv(root1.left, root2.left) && FlipEquiv(root1.right, root2.right))
                  || (FlipEquiv(root1.left, root2.right) && FlipEquiv(root1.right, root2.left));
          }
        `,
        go: code`
          func flipEquiv(root1 *TreeNode, root2 *TreeNode) bool {
              if root1 == nil || root2 == nil {
                  return root1 == root2
              }
              if root1.Val != root2.Val {
                  return false
              }
              return (flipEquiv(root1.Left, root2.Left) && flipEquiv(root1.Right, root2.Right)) ||
                  (flipEquiv(root1.Left, root2.Right) && flipEquiv(root1.Right, root2.Left))
          }
        `,
        kotlin: kt(code`
          fun flipEquiv(root1: TreeNode?, root2: TreeNode?): Boolean {
              if (root1 == null || root2 == null) return root1 === root2
              if (root1.@val != root2.@val) return false
              return (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right)) ||
                  (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left))
          }
        `),
        swift: code`
          func flipEquiv(_ root1: TreeNode?, _ root2: TreeNode?) -> Bool {
              guard let a = root1, let b = root2 else { return root1 == nil && root2 == nil }
              if a.val != b.val { return false }
              return (flipEquiv(a.left, b.left) && flipEquiv(a.right, b.right)) ||
                  (flipEquiv(a.left, b.right) && flipEquiv(a.right, b.left))
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn flipEquiv(root1: Option<Rc<RefCell<TreeNode>>>, root2: Option<Rc<RefCell<TreeNode>>>) -> bool {
              equiv(&root1, &root2)
          }

          fn equiv(a: &Option<Rc<RefCell<TreeNode>>>, b: &Option<Rc<RefCell<TreeNode>>>) -> bool {
              match (a, b) {
                  (None, None) => true,
                  (Some(x), Some(y)) => {
                      let x = x.borrow();
                      let y = y.borrow();
                      if x.val != y.val {
                          return false;
                      }
                      let same = (equiv(&x.left, &y.left) && equiv(&x.right, &y.right))
                          || (equiv(&x.left, &y.right) && equiv(&x.right, &y.left));
                      same
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function flipEquiv($root1, $root2) {
              if ($root1 === null || $root2 === null) return $root1 === $root2;
              if ($root1->val != $root2->val) return false;
              return (flipEquiv($root1->left, $root2->left) && flipEquiv($root1->right, $root2->right))
                  || (flipEquiv($root1->left, $root2->right) && flipEquiv($root1->right, $root2->left));
          }
        `,
        ruby: code`
          def flipEquiv(root1, root2)
            return root1.nil? && root2.nil? if root1.nil? || root2.nil?
            return false if root1.val != root2.val
            (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right)) ||
              (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left))
          end
        `,
      },
    };
  })(),

  // ── Check Completeness of a Binary Tree (LC 958) ────────────────
  (() => {
    // Heap numbering: the tree is complete exactly when the largest position equals the node count.
    const ref = (root: TNode | null) => {
      let count = 0, maxPos = 0;
      const walk = (n: TNode | null, pos: number) => {
        if (!n) return;
        count++;
        if (pos > maxPos) maxPos = pos;
        walk(n.left, 2 * pos);
        walk(n.right, 2 * pos + 1);
      };
      walk(root, 1);
      return maxPos === count;
    };
    const EX = [
      { root: [1, 2, 3, 4, 5, 6], note: "The first two levels are full and the last one, 4 5 6, is packed to the left." },
      { root: [1, 2, 3, 4, 5, null, 7], note: "On the last level there is a gap (3 has no left child) before 7." },
      { root: [1, 2, 3, null, 4], note: "2 has a right child but no left child, so the last level is not packed to the left." },
    ];
    return {
      slug: "check-completeness-of-a-binary-tree",
      title: "Check Completeness of a Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Breadth-First Search", "Meta", "Amazon", "Microsoft"],
      signature: { funcName: "isCompleteTree", params: [{ name: "root", type: "TreeNode" as const }], returns: "bool" as const },
      description: describe(
        "Given the `root` of a binary tree, determine whether it is a **complete binary tree**.\n\nIn a complete binary tree every level is completely filled except possibly the last one, and all nodes of the last level are as far left as possible. (The last level `h` may hold anywhere from 1 to 2^h nodes.)",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 100]", "1 <= Node.val <= 1000"]),
      hints: [
        "Read the tree in level order, writing down a marker for every missing child as well as every node.",
        "In a complete tree, all the real nodes come first and all the missing ones after — once you meet a gap, nothing real may follow.",
        "So run a BFS that also enqueues null children; after the first null is dequeued, any non-null node means the tree is not complete.",
      ],
      editorial: explain({
        idea: "A complete tree, read level by level from left to right, is a contiguous run of nodes followed only by empty slots. A BFS that enqueues null children sees exactly that sequence, so the tree is complete if no node appears after the first null.",
        steps: [
          "Put the root in a queue and set `seenGap = false`.",
          "Dequeue an entry. If it is null, set `seenGap = true` and continue.",
          "If it is a node and `seenGap` is already true, return false. Otherwise enqueue both of its children, null or not.",
          "If the queue empties without a violation, return true.",
        ],
        why: "The BFS produces the nodes in the order of their positions in a complete-tree numbering, with a null at every missing position whose parent exists. The tree is complete exactly when the occupied positions are 1..n with no hole, i.e. when no real node follows a null in that order.",
        time: "O(n)",
        space: "O(n) for the queue",
        pitfalls: [
          "Enqueue null children too — skipping them hides the gaps the check is looking for.",
          "A node with a right child but no left child is never complete.",
          "Checking only that every level but the last is full is not enough; the last level must also be packed to the left.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        let root: TNode | null = treeFrom(Array.from({ length: n }, () => ri(rng, 1, 1000)));
        const r = rng();
        if (r < 0.25 && n > 1) {
          // cut one subtree
          const victim = pick(rng, nodesOf(root).slice(1));
          for (const p of nodesOf(root)) { if (p.left === victim) p.left = null; if (p.right === victim) p.right = null; }
        } else if (r < 0.45) {
          // add one leaf in some free slot
          const p = pick(rng, nodesOf(root).filter((x) => !x.left || !x.right));
          const c = leaf(ri(rng, 1, 1000));
          if (!p.left && (!p.right || rng() < 0.5)) p.left = c; else p.right = c;
        } else if (r < 0.6) {
          root = shapeTree(rng, n, 1, 1000);
        }
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def isCompleteTree(root: Optional[TreeNode]) -> bool:
              queue = [root]
              head = 0
              seen_gap = False
              while head < len(queue):
                  node = queue[head]
                  head += 1
                  if node is None:
                      seen_gap = True
                      continue
                  if seen_gap:
                      return False
                  queue.append(node.left)
                  queue.append(node.right)
              return True
        `,
        javascript: code`
          var isCompleteTree = function(root) {
              var queue = [root], seenGap = false;
              for (var h = 0; h < queue.length; h++) {
                  var node = queue[h];
                  if (node === null) { seenGap = true; continue; }
                  if (seenGap) return false;
                  queue.push(node.left);
                  queue.push(node.right);
              }
              return true;
          };
        `,
        typescript: code`
          function isCompleteTree(root: TreeNode | null): boolean {
              var queue: Array<TreeNode | null> = [root];
              var seenGap = false;
              for (var h = 0; h < queue.length; h++) {
                  var node = queue[h];
                  if (node === null) { seenGap = true; continue; }
                  if (seenGap) return false;
                  queue.push(node.left);
                  queue.push(node.right);
              }
              return true;
          }
        `,
        java: code`
          public static boolean isCompleteTree(TreeNode root) {
              List<TreeNode> queue = new ArrayList<>();
              queue.add(root);
              boolean seenGap = false;
              for (int h = 0; h < queue.size(); h++) {
                  TreeNode node = queue.get(h);
                  if (node == null) { seenGap = true; continue; }
                  if (seenGap) return false;
                  queue.add(node.left);
                  queue.add(node.right);
              }
              return true;
          }
        `,
        cpp: code`
          bool isCompleteTree(TreeNode* root) {
              vector<TreeNode*> queue = {root};
              bool seenGap = false;
              for (size_t h = 0; h < queue.size(); h++) {
                  TreeNode* node = queue[h];
                  if (!node) { seenGap = true; continue; }
                  if (seenGap) return false;
                  queue.push_back(node->left);
                  queue.push_back(node->right);
              }
              return true;
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);

          bool isCompleteTree(struct TreeNode* root) {
              int n = countNodes(root);
              struct TreeNode** queue = (struct TreeNode**) malloc((size_t) (2 * n + 2) * sizeof(struct TreeNode*));
              int head = 0, tail = 0;
              bool seenGap = false, ok = true;
              queue[tail++] = root;
              while (head < tail) {
                  struct TreeNode* node = queue[head++];
                  if (node == NULL) { seenGap = true; continue; }
                  if (seenGap) { ok = false; break; }
                  queue[tail++] = node->left;
                  queue[tail++] = node->right;
              }
              free(queue);
              return ok;
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static bool IsCompleteTree(TreeNode root)
          {
              var queue = new List<TreeNode> { root };
              bool seenGap = false;
              for (int h = 0; h < queue.Count; h++)
              {
                  TreeNode node = queue[h];
                  if (node == null) { seenGap = true; continue; }
                  if (seenGap) return false;
                  queue.Add(node.left);
                  queue.Add(node.right);
              }
              return true;
          }
        `,
        go: code`
          func isCompleteTree(root *TreeNode) bool {
              queue := []*TreeNode{root}
              seenGap := false
              for h := 0; h < len(queue); h++ {
                  node := queue[h]
                  if node == nil {
                      seenGap = true
                      continue
                  }
                  if seenGap {
                      return false
                  }
                  queue = append(queue, node.Left, node.Right)
              }
              return true
          }
        `,
        kotlin: kt(code`
          fun isCompleteTree(root: TreeNode?): Boolean {
              val queue = ArrayList<TreeNode?>()
              queue.add(root)
              var seenGap = false
              var h = 0
              while (h < queue.size) {
                  val node = queue[h++]
                  if (node == null) {
                      seenGap = true
                      continue
                  }
                  if (seenGap) return false
                  queue.add(node.left)
                  queue.add(node.right)
              }
              return true
          }
        `),
        swift: code`
          func isCompleteTree(_ root: TreeNode?) -> Bool {
              var queue: [TreeNode?] = [root]
              var head = 0
              var seenGap = false
              while head < queue.count {
                  let entry = queue[head]
                  head += 1
                  guard let node = entry else {
                      seenGap = true
                      continue
                  }
                  if seenGap { return false }
                  queue.append(node.left)
                  queue.append(node.right)
              }
              return true
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn isCompleteTree(root: Option<Rc<RefCell<TreeNode>>>) -> bool {
              let mut queue: Vec<Option<Rc<RefCell<TreeNode>>>> = vec![root];
              let mut head = 0;
              let mut seen_gap = false;
              while head < queue.len() {
                  let entry = queue[head].clone();
                  head += 1;
                  match entry {
                      None => seen_gap = true,
                      Some(n) => {
                          if seen_gap {
                              return false;
                          }
                          let b = n.borrow();
                          queue.push(b.left.clone());
                          queue.push(b.right.clone());
                      }
                  }
              }
              true
          }
        `,
        php: code`
          function isCompleteTree($root) {
              $queue = [$root];
              $seenGap = false;
              for ($h = 0; $h < count($queue); $h++) {
                  $node = $queue[$h];
                  if ($node === null) { $seenGap = true; continue; }
                  if ($seenGap) return false;
                  $queue[] = $node->left;
                  $queue[] = $node->right;
              }
              return true;
          }
        `,
        ruby: code`
          def isCompleteTree(root)
            queue = [root]
            head = 0
            seen_gap = false
            while head < queue.length
              node = queue[head]
              head += 1
              if node.nil?
                seen_gap = true
                next
              end
              return false if seen_gap
              queue << node.left
              queue << node.right
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Distribute Coins in Binary Tree (LC 979) ────────────────────
  (() => {
    const size = (n: TNode | null): number => (n ? 1 + size(n.left) + size(n.right) : 0);
    const coins = (n: TNode | null): number => (n ? n.val + coins(n.left) + coins(n.right) : 0);
    // Every edge above a subtree carries |coins in it − nodes in it| coins, each crossing once.
    const ref = (root: TNode | null) => nodesOf(root).filter((n) => n !== root).reduce((s, n) => s + Math.abs(coins(n) - size(n)), 0);
    const EX = [
      { root: [3, 0, 0], note: "The root sends one coin to each child: 2 moves." },
      { root: [0, 3, 0], note: "The left child sends one coin up to the root and another up and then down to the right child: 1 + 2 = 3 moves." },
      { root: [1, 0, 0, null, 3], note: "Node 3 passes two coins up to its parent (2 moves), which keeps one and passes the other up to the root (1 move); the root keeps its own coin and passes the arriving one down to its right child (1 move). 4 moves in all." },
    ];
    return {
      slug: "distribute-coins-in-binary-tree",
      title: "Distribute Coins in Binary Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "distributeCoins", params: [{ name: "root", type: "TreeNode" as const }], returns: "int" as const },
      description: describe(
        "You are given the `root` of a binary tree with `n` nodes, where `node.val` is the number of coins on that node. There are exactly `n` coins in the whole tree.\n\nIn one move you may take one coin from a node and move it to an adjacent node — its parent or one of its children. Return the **minimum number of moves** needed so that every node holds exactly one coin.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: String(ref(treeFrom(e.root))), note: e.note })),
        ["The number of nodes in the tree is n", "1 <= n <= 100", "0 <= Node.val <= n", "The sum of all Node.val is n"]),
      hints: [
        "Look at a single edge between a node and its parent. How many coins must cross it, in total, whatever else happens?",
        "The subtree below the edge holds some number of coins and needs exactly as many as it has nodes. The difference — its excess, positive or negative — must cross that edge, and never more than that.",
        "A post-order DFS can return each subtree's excess (`coins − nodes`); the answer is the sum of `|excess|` over all edges.",
      ],
      editorial: explain({
        idea: "Each edge must carry exactly the imbalance of the subtree below it, and an optimal schedule never moves a coin across an edge in both directions. So the minimum is the sum, over every edge, of the absolute excess of the subtree it leads to.",
        steps: [
          "`excess(node)`: 0 for null. Otherwise compute `l = excess(left)` and `r = excess(right)`.",
          "Add `|l| + |r|` to the move count — those many coins cross the two child edges.",
          "Return `node.val + l + r - 1`: the coins this subtree has minus the one this node keeps (negative means it needs coins from above).",
          "Call `excess(root)` (the root's own excess is 0) and return the move count.",
        ],
        why: "Any valid plan must move at least |excess| coins across an edge, since the subtree below ends with exactly as many coins as nodes. Moving surplus up and deficits down along each edge achieves exactly that many crossings per edge, so the lower bound is met.",
        time: "O(n)",
        space: "O(h) for the recursion",
        pitfalls: [
          "Excess can be negative — count its absolute value as moves, but pass the signed value up.",
          "Count moves on child edges only; the root has no parent edge.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: String(ref(treeFrom(e.root))) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [2, 5, 10, 25, 40]);
        const root = shapeTree(rng, n, 0, 0)!;
        const nodes = nodesOf(root);
        const mode = rng();
        if (mode < 0.05) nodes.forEach((x) => { x.val = 1; });
        else if (mode < 0.3) pick(rng, nodes).val = n;
        else for (let c = 0; c < n; c++) pick(rng, nodes).val++;
        return { input: fmtTree(root), expectedOutput: String(ref(root)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def distributeCoins(root: Optional[TreeNode]) -> int:
              moves = 0

              def excess(node):
                  nonlocal moves
                  if node is None:
                      return 0
                  l = excess(node.left)
                  r = excess(node.right)
                  moves += abs(l) + abs(r)
                  return node.val + l + r - 1

              excess(root)
              return moves
        `,
        javascript: code`
          var distributeCoins = function(root) {
              var moves = 0;
              var excess = function(node) {
                  if (node === null) return 0;
                  var l = excess(node.left), r = excess(node.right);
                  moves += Math.abs(l) + Math.abs(r);
                  return node.val + l + r - 1;
              };
              excess(root);
              return moves;
          };
        `,
        typescript: code`
          function distributeCoins(root: TreeNode | null): number {
              var moves = 0;
              var excess = function(node: TreeNode | null): number {
                  if (node === null) return 0;
                  var l = excess(node.left), r = excess(node.right);
                  moves += Math.abs(l) + Math.abs(r);
                  return node.val + l + r - 1;
              };
              excess(root);
              return moves;
          }
        `,
        java: code`
          public static int distributeCoins(TreeNode root) {
              int[] moves = new int[1];
              excess(root, moves);
              return moves[0];
          }

          static int excess(TreeNode node, int[] moves) {
              if (node == null) return 0;
              int l = excess(node.left, moves), r = excess(node.right, moves);
              moves[0] += Math.abs(l) + Math.abs(r);
              return node.val + l + r - 1;
          }
        `,
        cpp: code`
          int coinExcess(TreeNode* node, int& moves);

          int distributeCoins(TreeNode* root) {
              int moves = 0;
              coinExcess(root, moves);
              return moves;
          }

          int coinExcess(TreeNode* node, int& moves) {
              if (!node) return 0;
              int l = coinExcess(node->left, moves), r = coinExcess(node->right, moves);
              moves += abs(l) + abs(r);
              return node->val + l + r - 1;
          }
        `,
        c: code`
          static int coinExcess(struct TreeNode* node, int* moves);

          int distributeCoins(struct TreeNode* root) {
              int moves = 0;
              coinExcess(root, &moves);
              return moves;
          }

          static int coinExcess(struct TreeNode* node, int* moves) {
              if (node == NULL) return 0;
              int l = coinExcess(node->left, moves), r = coinExcess(node->right, moves);
              *moves += (l < 0 ? -l : l) + (r < 0 ? -r : r);
              return node->val + l + r - 1;
          }
        `,
        csharp: code`
          public static int DistributeCoins(TreeNode root)
          {
              int moves = 0;
              Excess(root, ref moves);
              return moves;
          }

          static int Excess(TreeNode node, ref int moves)
          {
              if (node == null) return 0;
              int l = Excess(node.left, ref moves), r = Excess(node.right, ref moves);
              moves += Math.Abs(l) + Math.Abs(r);
              return node.val + l + r - 1;
          }
        `,
        go: code`
          func distributeCoins(root *TreeNode) int {
              moves := 0
              coinExcess(root, &moves)
              return moves
          }

          func coinExcess(node *TreeNode, moves *int) int {
              if node == nil {
                  return 0
              }
              l := coinExcess(node.Left, moves)
              r := coinExcess(node.Right, moves)
              *moves += absInt(l) + absInt(r)
              return node.Val + l + r - 1
          }

          func absInt(x int) int {
              if x < 0 {
                  return -x
              }
              return x
          }
        `,
        kotlin: kt(code`
          fun distributeCoins(root: TreeNode?): Int {
              val moves = IntArray(1)
              coinExcess(root, moves)
              return moves[0]
          }

          fun coinExcess(node: TreeNode?, moves: IntArray): Int {
              if (node == null) return 0
              val l = coinExcess(node.left, moves)
              val r = coinExcess(node.right, moves)
              moves[0] += Math.abs(l) + Math.abs(r)
              return node.@val + l + r - 1
          }
        `),
        swift: code`
          func distributeCoins(_ root: TreeNode?) -> Int {
              var moves = 0
              coinExcess(root, &moves)
              return moves
          }

          @discardableResult
          func coinExcess(_ node: TreeNode?, _ moves: inout Int) -> Int {
              guard let n = node else { return 0 }
              let l = coinExcess(n.left, &moves)
              let r = coinExcess(n.right, &moves)
              moves += abs(l) + abs(r)
              return n.val + l + r - 1
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn distributeCoins(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
              let mut moves = 0;
              coin_excess(&root, &mut moves);
              moves
          }

          fn coin_excess(node: &Option<Rc<RefCell<TreeNode>>>, moves: &mut i32) -> i32 {
              match node {
                  None => 0,
                  Some(n) => {
                      let b = n.borrow();
                      let l = coin_excess(&b.left, moves);
                      let r = coin_excess(&b.right, moves);
                      *moves += l.abs() + r.abs();
                      b.val + l + r - 1
                  }
              }
          }
        `,
        php: code`
          function distributeCoins($root) {
              $moves = 0;
              coinExcess($root, $moves);
              return $moves;
          }

          function coinExcess($node, &$moves) {
              if ($node === null) return 0;
              $l = coinExcess($node->left, $moves);
              $r = coinExcess($node->right, $moves);
              $moves += abs($l) + abs($r);
              return $node->val + $l + $r - 1;
          }
        `,
        ruby: code`
          def distributeCoins(root)
            moves = [0]
            coin_excess(root, moves)
            moves[0]
          end

          def coin_excess(node, moves)
            return 0 if node.nil?
            l = coin_excess(node.left, moves)
            r = coin_excess(node.right, moves)
            moves[0] += l.abs + r.abs
            node.val + l + r - 1
          end
        `,
      },
    };
  })(),

  // ── Smallest String Starting From Leaf (LC 988) ─────────────────
  (() => {
    const ref = (root: TNode | null) => {
      const all: string[] = [];
      const walk = (n: TNode | null, suffix: string) => {
        if (!n) return;
        const s = String.fromCharCode(97 + n.val) + suffix;
        if (!n.left && !n.right) all.push(s);
        walk(n.left, s);
        walk(n.right, s);
      };
      walk(root, "");
      let best = all[0];
      for (const s of all) if (s < best) best = s;
      return best;
    };
    const EX = [
      { root: [0, 1, 2, 3, 4, 3, 4], note: "The four leaf-to-root strings are \"dba\", \"eba\", \"dca\" and \"eca\"; the smallest is \"dba\"." },
      { root: [25, 1, 3, 1, 3, 0, 2], note: "Reading up from the leaf 0 (a) through 3 (d) to the root 25 (z) gives \"adz\", smaller than \"bbz\", \"dbz\" and \"cdz\"." },
      { root: [2, 2, 1, null, 1, 0, null, 0], note: "The leaf on the left side spells \"abcc\" (0 → 1 → 2 → 2) and the one on the right side \"abc\" (0 → 1 → 2). \"abc\" is a prefix of \"abcc\", so it is the smaller." },
    ];
    return {
      slug: "smallest-string-starting-from-leaf",
      title: "Smallest String Starting From Leaf",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Tree", "Depth-First Search", "Amazon", "Google"],
      signature: { funcName: "smallestFromLeaf", params: [{ name: "root", type: "TreeNode" as const }], returns: "string" as const },
      description: describe(
        "You are given the `root` of a binary tree in which every node holds a value from `0` to `25`, standing for the letters `'a'` to `'z'`.\n\nEvery path from a leaf up to the root spells a string, starting with the leaf's letter and ending with the root's. Return the **lexicographically smallest** of these strings.\n\nAs usual, a string that is a proper prefix of another is the smaller one: \"ab\" comes before \"aba\". A leaf is a node with no children.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}`, out: `"${ref(treeFrom(e.root))}"`, note: e.note })),
        ["The number of nodes in the tree is in the range [1, 8500]", "0 <= Node.val <= 25"]),
      hints: [
        "Every candidate starts at a leaf, so you need the whole path from the root down to each leaf.",
        "Walk down with a DFS, keeping the letters of the current root-to-node path. At a leaf, reverse the path to get its string and compare it with the best so far.",
        "Merging bottom-up — keeping only the smaller of the two children's answers and appending the node's letter — fails: a string that loses below can win once the letters above are added (\"a\" beats \"aba\", but \"abz\" loses to \"ababz\"). Compare complete strings.",
      ],
      editorial: explain({
        idea: "There is one candidate per leaf, read from the leaf up. A DFS that carries the root-to-node path builds each candidate when it reaches a leaf, and the minimum over all leaves is the answer.",
        steps: [
          "DFS from the root, appending each node's letter to a `path` buffer on the way down and removing it on the way back.",
          "At a leaf, form the string `reverse(path)` — leaf first, root last.",
          "Keep it if it is smaller than the best string found so far (or if it is the first one).",
          "Return the best string after the DFS.",
        ],
        why: "Every leaf-to-root string is generated exactly once, and the comparison keeps the smallest. Comparing whole strings sidesteps the trap in local choices: two subtrees can start with the same letters near the leaves, and which one wins depends on letters much higher up.",
        time: "O(n · h) — each leaf builds a string of length at most h",
        space: "O(h) for the path, the recursion and the best string",
        pitfalls: [
          "Read the string from the leaf to the root, not from the root down.",
          "Only leaves start candidates; a node with one child is not a leaf.",
          "Keeping only the smaller child answer at each node gives `abz` for `[25,1,null,0,0,1,null,null,null,0]`, but the answer is `ababz`.",
        ],
      }),
      examples: EX.map((e) => ({ input: lv(e.root), expectedOutput: ref(treeFrom(e.root)) })),
      gen: (rng: Rng) => {
        const hi = pick(rng, [0, 1, 2, 3, 25, 25]);
        const root = shapeTree(rng, sizeOf(rng, [1, 3, 10, 25, 40]), 0, hi);
        return { input: fmtTree(root), expectedOutput: ref(root) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def smallestFromLeaf(root: Optional[TreeNode]) -> str:
              best = None
              path = []

              def walk(node):
                  nonlocal best
                  if node is None:
                      return
                  path.append(chr(97 + node.val))
                  if node.left is None and node.right is None:
                      s = "".join(reversed(path))
                      if best is None or s < best:
                          best = s
                  walk(node.left)
                  walk(node.right)
                  path.pop()

              walk(root)
              return best
        `,
        javascript: code`
          var smallestFromLeaf = function(root) {
              var best = null, path = [];
              var walk = function(node) {
                  if (node === null) return;
                  path.push(String.fromCharCode(97 + node.val));
                  if (node.left === null && node.right === null) {
                      var s = path.slice().reverse().join("");
                      if (best === null || s < best) best = s;
                  }
                  walk(node.left);
                  walk(node.right);
                  path.pop();
              };
              walk(root);
              return best;
          };
        `,
        typescript: code`
          function smallestFromLeaf(root: TreeNode | null): string {
              var best: string | null = null;
              var path: string[] = [];
              var walk = function(node: TreeNode | null): void {
                  if (node === null) return;
                  path.push(String.fromCharCode(97 + node.val));
                  if (node.left === null && node.right === null) {
                      var s = path.slice().reverse().join("");
                      if (best === null || s < best) best = s;
                  }
                  walk(node.left);
                  walk(node.right);
                  path.pop();
              };
              walk(root);
              return best as string;
          }
        `,
        java: code`
          public static String smallestFromLeaf(TreeNode root) {
              String[] best = new String[1];
              walk(root, new StringBuilder(), best);
              return best[0];
          }

          static void walk(TreeNode node, StringBuilder path, String[] best) {
              if (node == null) return;
              path.append((char) ('a' + node.val));
              if (node.left == null && node.right == null) {
                  String s = new StringBuilder(path).reverse().toString();
                  if (best[0] == null || s.compareTo(best[0]) < 0) best[0] = s;
              }
              walk(node.left, path, best);
              walk(node.right, path, best);
              path.setLength(path.length() - 1);
          }
        `,
        cpp: code`
          void leafWalk(TreeNode* node, string& path, string& best, bool& have);

          string smallestFromLeaf(TreeNode* root) {
              string path, best;
              bool have = false;
              leafWalk(root, path, best, have);
              return best;
          }

          void leafWalk(TreeNode* node, string& path, string& best, bool& have) {
              if (!node) return;
              path.push_back((char) ('a' + node->val));
              if (!node->left && !node->right) {
                  string s(path.rbegin(), path.rend());
                  if (!have || s < best) { best = s; have = true; }
              }
              leafWalk(node->left, path, best, have);
              leafWalk(node->right, path, best, have);
              path.pop_back();
          }
        `,
        c: code`
          static int countNodes(struct TreeNode* t);
          static void leafWalk(struct TreeNode* node, char* path, int len, char* best, char* cand, int* have);

          char* smallestFromLeaf(struct TreeNode* root) {
              int n = countNodes(root);
              char* path = (char*) malloc((size_t) n + 2);
              char* best = (char*) malloc((size_t) n + 2);
              char* cand = (char*) malloc((size_t) n + 2);
              int have = 0;
              best[0] = '\0';
              leafWalk(root, path, 0, best, cand, &have);
              free(path);
              free(cand);
              return best;
          }

          static void leafWalk(struct TreeNode* node, char* path, int len, char* best, char* cand, int* have) {
              if (node == NULL) return;
              path[len++] = (char) ('a' + node->val);
              if (node->left == NULL && node->right == NULL) {
                  for (int i = 0; i < len; i++) cand[i] = path[len - 1 - i];
                  cand[len] = '\0';
                  if (!*have || strcmp(cand, best) < 0) {
                      strcpy(best, cand);
                      *have = 1;
                  }
              }
              leafWalk(node->left, path, len, best, cand, have);
              leafWalk(node->right, path, len, best, cand, have);
          }

          static int countNodes(struct TreeNode* t) {
              return t == NULL ? 0 : 1 + countNodes(t->left) + countNodes(t->right);
          }
        `,
        csharp: code`
          public static string SmallestFromLeaf(TreeNode root)
          {
              string best = null;
              Walk(root, new List<char>(), ref best);
              return best;
          }

          static void Walk(TreeNode node, List<char> path, ref string best)
          {
              if (node == null) return;
              path.Add((char) ('a' + node.val));
              if (node.left == null && node.right == null)
              {
                  var chars = path.ToArray();
                  Array.Reverse(chars);
                  string s = new string(chars);
                  if (best == null || string.CompareOrdinal(s, best) < 0) best = s;
              }
              Walk(node.left, path, ref best);
              Walk(node.right, path, ref best);
              path.RemoveAt(path.Count - 1);
          }
        `,
        go: code`
          func smallestFromLeaf(root *TreeNode) string {
              best := ""
              have := false
              path := []byte{}
              var walk func(node *TreeNode)
              walk = func(node *TreeNode) {
                  if node == nil {
                      return
                  }
                  path = append(path, byte('a'+node.Val))
                  if node.Left == nil && node.Right == nil {
                      s := make([]byte, len(path))
                      for i := range path {
                          s[i] = path[len(path)-1-i]
                      }
                      if !have || string(s) < best {
                          best = string(s)
                          have = true
                      }
                  }
                  walk(node.Left)
                  walk(node.Right)
                  path = path[:len(path)-1]
              }
              walk(root)
              return best
          }
        `,
        kotlin: kt(code`
          fun smallestFromLeaf(root: TreeNode?): String {
              val best = arrayOfNulls<String>(1)
              leafWalk(root, StringBuilder(), best)
              return best[0]!!
          }

          fun leafWalk(node: TreeNode?, path: StringBuilder, best: Array<String?>) {
              if (node == null) return
              path.append('a' + node.@val)
              if (node.left == null && node.right == null) {
                  val s = StringBuilder(path).reverse().toString()
                  val cur = best[0]
                  if (cur == null || s < cur) best[0] = s
              }
              leafWalk(node.left, path, best)
              leafWalk(node.right, path, best)
              path.setLength(path.length - 1)
          }
        `),
        swift: code`
          func smallestFromLeaf(_ root: TreeNode?) -> String {
              var best: [UInt8]? = nil
              var path = [UInt8]()
              leafWalk(root, &path, &best)
              return String(decoding: best ?? [], as: UTF8.self)
          }

          func leafWalk(_ node: TreeNode?, _ path: inout [UInt8], _ best: inout [UInt8]?) {
              guard let n = node else { return }
              path.append(UInt8(97 + n.val))
              if n.left == nil && n.right == nil {
                  let s = Array(path.reversed())
                  if let b = best {
                      if s.lexicographicallyPrecedes(b) { best = s }
                  } else {
                      best = s
                  }
              }
              leafWalk(n.left, &path, &best)
              leafWalk(n.right, &path, &best)
              path.removeLast()
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn smallestFromLeaf(root: Option<Rc<RefCell<TreeNode>>>) -> String {
              let mut path: Vec<u8> = Vec::new();
              let mut best: Option<Vec<u8>> = None;
              leaf_walk(&root, &mut path, &mut best);
              String::from_utf8(best.unwrap_or_default()).unwrap()
          }

          fn leaf_walk(node: &Option<Rc<RefCell<TreeNode>>>, path: &mut Vec<u8>, best: &mut Option<Vec<u8>>) {
              if let Some(n) = node {
                  let b = n.borrow();
                  path.push(b'a' + b.val as u8);
                  if b.left.is_none() && b.right.is_none() {
                      let s: Vec<u8> = path.iter().rev().cloned().collect();
                      let better = match best {
                          None => true,
                          Some(cur) => s < *cur,
                      };
                      if better {
                          *best = Some(s);
                      }
                  }
                  leaf_walk(&b.left, path, best);
                  leaf_walk(&b.right, path, best);
                  path.pop();
              }
          }
        `,
        php: code`
          function smallestFromLeaf($root) {
              $best = null;
              leafWalk($root, "", $best);
              return $best;
          }

          function leafWalk($node, $suffix, &$best) {
              if ($node === null) return;
              $s = chr(97 + $node->val) . $suffix;
              if ($node->left === null && $node->right === null) {
                  if ($best === null || strcmp($s, $best) < 0) $best = $s;
              }
              leafWalk($node->left, $s, $best);
              leafWalk($node->right, $s, $best);
          }
        `,
        ruby: code`
          def smallestFromLeaf(root)
            best = [nil]
            leaf_walk(root, "", best)
            best[0]
          end

          def leaf_walk(node, suffix, best)
            return if node.nil?
            s = (97 + node.val).chr + suffix
            if node.left.nil? && node.right.nil?
              best[0] = s if best[0].nil? || s < best[0]
            end
            leaf_walk(node.left, s, best)
            leaf_walk(node.right, s, best)
          end
        `,
      },
    };
  })(),

  // ── Maximum Binary Tree II (LC 998) ─────────────────────────────
  (() => {
    const build = (a: number[], lo: number, hi: number): TNode | null => {
      if (lo > hi) return null;
      let m = lo;
      for (let i = lo + 1; i <= hi; i++) if (a[i] > a[m]) m = i;
      return { val: a[m], left: build(a, lo, m - 1), right: build(a, m + 1, hi) };
    };
    const maxTree = (a: number[]) => build(a, 0, a.length - 1);
    const inorder = (t: TNode | null, out: number[] = []): number[] => {
      if (t) { inorder(t.left, out); out.push(t.val); inorder(t.right, out); }
      return out;
    };
    // The in-order walk of a maximum tree gives back its array; append and rebuild.
    const ref = (root: TNode | null, value: number) => maxTree([...inorder(root), value]);
    const EX = [
      { root: [4, 1, 3, null, null, 2], value: 5, note: "The tree was built from [1,4,2,3]; the new array [1,4,2,3,5] has 5 as its maximum, at the very end, so 5 becomes the root with the old tree as its left subtree." },
      { root: [5, 2, 4, null, 1], value: 3, note: "Built from [2,1,5,4]; appending 3 gives [2,1,5,4,3], where 3 ends up as the right child of 4." },
      { root: [5, 2, 3, null, 1], value: 4, note: "Built from [2,1,5,3]; in [2,1,5,3,4] the 4 sits right of 5 and takes 3 as its left child." },
    ];
    return {
      slug: "maximum-binary-tree-ii",
      title: "Maximum Binary Tree II",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Binary Search", "Amazon"],
      signature: { funcName: "insertIntoMaxTree", params: [{ name: "root", type: "TreeNode" as const }, { name: "value", type: "int" as const }], returns: "TreeNode" as const },
      description: describe(
        "A **maximum tree** is built from an array `a` of distinct values: its root holds the maximum of `a`, the left subtree is the maximum tree of the elements before that maximum, and the right subtree the maximum tree of the elements after it (an empty part gives an empty subtree).\n\nYou are given the `root` of the maximum tree of some array `a` — but not `a` itself — and an integer `value` that does not occur in `a`. Let `b` be `a` with `value` appended at the end. Return the root of the maximum tree of `b`.",
        EX.map((e) => ({ in: `root = ${lv(e.root)}, value = ${e.value}`, out: fmtTree(ref(treeFrom(e.root), e.value)), note: e.note })),
        ["The number of nodes in the tree is in the range [1, 100]", "1 <= Node.val <= 100", "All the values of the tree are unique", "1 <= value <= 100", "value does not occur in the tree"]),
      hints: [
        "The new element is the last one of `b`. Where does the last element of an array end up in its maximum tree?",
        "If `value` is larger than the root, it is the new maximum and everything before it is its left part: a new root with the old tree on the left.",
        "Otherwise the root stays, and `value` belongs to the part after the root's position — that part is the root's right subtree. Recurse to the right.",
      ],
      editorial: explain({
        idea: "Appending at the end only touches the right spine of the tree, which holds the suffix maxima of `a`. Walk down that spine until a node smaller than `value` (or the end) is reached; `value` takes that position and adopts the rest of the spine as its left subtree.",
        steps: [
          "If `root` is null or `root.val < value`, return a new node holding `value` whose left child is `root`.",
          "Otherwise set `root.right = insertIntoMaxTree(root.right, value)` and return `root`.",
        ],
        why: "The root's position in `b` is unchanged when `root.val > value`, and `value` falls in the part after it, which is exactly the root's right subtree built from that suffix plus `value` — the same problem, smaller. When `value` exceeds the current subtree's maximum, it is the maximum of that range in `b`; since it is the last element, everything else in the range lies to its left, which is precisely the old subtree.",
        time: "O(h) — one walk down the right spine",
        space: "O(h) for the recursion (O(1) iteratively)",
        pitfalls: [
          "Only the right spine can change: never descend into a left subtree.",
          "When `value` is the overall maximum, the entire old tree becomes its left subtree.",
          "Rebuilding the whole tree from the in-order array also works but costs O(n^2).",
        ],
      }),
      examples: EX.map((e) => ({ input: `${lv(e.root)}\n${e.value}`, expectedOutput: fmtTree(ref(treeFrom(e.root), e.value)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 1, n + 4, 100]);
        const set = new Set<number>();
        while (set.size < n + 1) set.add(ri(rng, 1, hi));
        let vals = shuffle(rng, [...set]);
        const r = rng();
        if (r < 0.1) vals.sort((x, y) => x - y);
        else if (r < 0.2) vals.sort((x, y) => y - x);
        else if (r < 0.3) vals = [...vals.slice(0, n).sort((x, y) => y - x), vals[n]];
        const a = vals.slice(0, n), value = vals[n];
        const root = maxTree(a);
        return { input: `${fmtTree(root)}\n${value}`, expectedOutput: fmtTree(maxTree([...a, value])) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def insertIntoMaxTree(root: Optional[TreeNode], value: int) -> Optional[TreeNode]:
              if root is None or root.val < value:
                  return TreeNode(value, root, None)
              root.right = insertIntoMaxTree(root.right, value)
              return root
        `,
        javascript: code`
          var insertIntoMaxTree = function(root, value) {
              if (root === null || root.val < value) return new TreeNode(value, root, null);
              root.right = insertIntoMaxTree(root.right, value);
              return root;
          };
        `,
        typescript: code`
          function insertIntoMaxTree(root: TreeNode | null, value: number): TreeNode | null {
              if (root === null || root.val < value) return new TreeNode(value, root, null);
              root.right = insertIntoMaxTree(root.right, value);
              return root;
          }
        `,
        java: code`
          public static TreeNode insertIntoMaxTree(TreeNode root, int value) {
              if (root == null || root.val < value) return new TreeNode(value, root, null);
              root.right = insertIntoMaxTree(root.right, value);
              return root;
          }
        `,
        cpp: code`
          TreeNode* insertIntoMaxTree(TreeNode* root, int value) {
              if (!root || root->val < value) return new TreeNode(value, root, nullptr);
              root->right = insertIntoMaxTree(root->right, value);
              return root;
          }
        `,
        c: code`
          struct TreeNode* insertIntoMaxTree(struct TreeNode* root, int value) {
              if (root == NULL || root->val < value) {
                  struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
                  node->val = value;
                  node->left = root;
                  node->right = NULL;
                  return node;
              }
              root->right = insertIntoMaxTree(root->right, value);
              return root;
          }
        `,
        csharp: code`
          public static TreeNode InsertIntoMaxTree(TreeNode root, int value)
          {
              if (root == null || root.val < value) return new TreeNode(value, root, null);
              root.right = InsertIntoMaxTree(root.right, value);
              return root;
          }
        `,
        go: code`
          func insertIntoMaxTree(root *TreeNode, value int) *TreeNode {
              if root == nil || root.Val < value {
                  return &TreeNode{Val: value, Left: root}
              }
              root.Right = insertIntoMaxTree(root.Right, value)
              return root
          }
        `,
        kotlin: kt(code`
          fun insertIntoMaxTree(root: TreeNode?, value: Int): TreeNode? {
              if (root == null || root.@val < value) {
                  val node = TreeNode(value)
                  node.left = root
                  return node
              }
              root.right = insertIntoMaxTree(root.right, value)
              return root
          }
        `),
        swift: code`
          func insertIntoMaxTree(_ root: TreeNode?, _ value: Int) -> TreeNode? {
              guard let node = root, node.val > value else { return TreeNode(value, root, nil) }
              node.right = insertIntoMaxTree(node.right, value)
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn insertIntoMaxTree(root: Option<Rc<RefCell<TreeNode>>>, value: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if let Some(n) = root.clone() {
                  let v = n.borrow().val;
                  if v > value {
                      let r = n.borrow_mut().right.take();
                      let nr = insertIntoMaxTree(r, value);
                      n.borrow_mut().right = nr;
                      return Some(n);
                  }
              }
              let node = Rc::new(RefCell::new(TreeNode::new(value)));
              node.borrow_mut().left = root;
              Some(node)
          }
        `,
        php: code`
          function insertIntoMaxTree($root, $value) {
              if ($root === null || $root->val < $value) return new TreeNode($value, $root, null);
              $root->right = insertIntoMaxTree($root->right, $value);
              return $root;
          }
        `,
        ruby: code`
          def insertIntoMaxTree(root, value)
            return TreeNode.new(value, root, nil) if root.nil? || root.val < value
            root.right = insertIntoMaxTree(root.right, value)
            root
          end
        `,
      },
    };
  })(),

  // ── Construct Binary Search Tree from Preorder Traversal (LC 1008) ──
  (() => {
    // Inserting the values one by one, in preorder, rebuilds exactly the tree they came from.
    const ref = (preorder: number[]) => bstOf(preorder);
    const preorderOf = (t: TNode | null): number[] => nodesOf(t).map((n) => n.val);
    const EX = [
      { preorder: [8, 5, 1, 7, 10, 12], note: "8 is the root; 5, 1, 7 are smaller and form its left subtree (5 with children 1 and 7); 10, 12 are larger and form the right subtree." },
      { preorder: [1, 3], note: "3 is larger than the root, so it is the root's right child." },
      { preorder: [3, 2, 1], note: "Each value is smaller than the one before it, so the tree is a chain going left." },
    ];
    return {
      slug: "construct-binary-search-tree-from-preorder-traversal",
      title: "Construct Binary Search Tree from Preorder Traversal",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Tree", "Binary Search", "Monotonic Stack", "Amazon", "Microsoft", "Meta"],
      signature: { funcName: "bstFromPreorder", params: [{ name: "preorder", type: "int[]" as const }], returns: "TreeNode" as const },
      description: describe(
        "You are given an array `preorder` of distinct integers that is the **preorder traversal** of a binary search tree — each node listed before its left subtree, which comes before its right subtree. Rebuild the tree and return its root.\n\nIn a binary search tree every value in a node's left subtree is strictly smaller than the node's value, and every value in its right subtree is strictly larger. It is guaranteed that `preorder` describes such a tree, and that tree is unique.",
        EX.map((e) => ({ in: `preorder = ${fmtIntArr(e.preorder)}`, out: fmtTree(ref(e.preorder)), note: e.note })),
        ["1 <= preorder.length <= 100", "1 <= preorder[i] <= 1000", "All the values of preorder are unique"]),
      hints: [
        "The first value is the root. The values after it that are smaller form the left subtree's preorder, and the rest the right subtree's.",
        "Splitting by scanning for the first larger value is O(n^2) on a chain. Instead, build while reading: pass down an upper bound for the current subtree.",
        "`build(bound)`: if the next value exceeds `bound`, this subtree is empty. Otherwise take it as the node, build its left subtree with the bound `node.val`, then its right subtree with the inherited `bound`.",
      ],
      editorial: explain({
        idea: "Read the preorder array once with a shared index. Each recursive call builds the largest subtree whose values stay below an upper bound; the bound tells it exactly when its subtree has ended, so no searching is needed.",
        steps: [
          "Keep an index `i = 0` into `preorder`.",
          "`build(bound)`: if `i` is past the end or `preorder[i] > bound`, return null.",
          "Otherwise create a node with `preorder[i]`, advance `i`, set `left = build(node.val)` and `right = build(bound)`, and return the node.",
          "Return `build(+infinity)` (the largest 32-bit integer works).",
        ],
        why: "In preorder, a node is followed first by all of its left subtree (values below it) and then by its right subtree (values above it but below the bound inherited from the nearest ancestor it hangs left of). The first value that breaks the bound is therefore the first value outside the current subtree, so each call consumes exactly its subtree's values.",
        time: "O(n) — every value is consumed once",
        space: "O(h) for the recursion",
        pitfalls: [
          "The left subtree's bound is the node's value; the right subtree inherits the parent's bound, not the node's value.",
          "Keep the index shared across calls (a field, a reference or a one-element array), not a copy.",
          "Inserting each value from the root also works but is O(n^2) on a sorted input.",
        ],
      }),
      examples: EX.map((e) => ({ input: fmtIntArr(e.preorder), expectedOutput: fmtTree(ref(e.preorder)) })),
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [1, 3, 10, 25, 40]);
        const hi = pick(rng, [n + 2, 100, 1000]);
        const vals = new Set<number>();
        while (vals.size < n) vals.add(ri(rng, 1, hi));
        let order = shuffle(rng, [...vals]);
        const r = rng();
        if (r < 0.1) order.sort((a, b) => a - b);
        else if (r < 0.2) order.sort((a, b) => b - a);
        const pre = preorderOf(bstOf(order));
        return { input: fmtIntArr(pre), expectedOutput: fmtTree(ref(pre)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def bstFromPreorder(preorder: List[int]) -> Optional[TreeNode]:
              i = 0

              def build(bound):
                  nonlocal i
                  if i == len(preorder) or preorder[i] > bound:
                      return None
                  node = TreeNode(preorder[i])
                  i += 1
                  node.left = build(node.val)
                  node.right = build(bound)
                  return node

              return build(float("inf"))
        `,
        javascript: code`
          var bstFromPreorder = function(preorder) {
              var i = 0;
              var build = function(bound) {
                  if (i === preorder.length || preorder[i] > bound) return null;
                  var node = new TreeNode(preorder[i++]);
                  node.left = build(node.val);
                  node.right = build(bound);
                  return node;
              };
              return build(Infinity);
          };
        `,
        typescript: code`
          function bstFromPreorder(preorder: number[]): TreeNode | null {
              var i = 0;
              var build = function(bound: number): TreeNode | null {
                  if (i === preorder.length || preorder[i] > bound) return null;
                  var node = new TreeNode(preorder[i++]);
                  node.left = build(node.val);
                  node.right = build(bound);
                  return node;
              };
              return build(Infinity);
          }
        `,
        java: code`
          public static TreeNode bstFromPreorder(int[] preorder) {
              return build(preorder, new int[1], Integer.MAX_VALUE);
          }

          static TreeNode build(int[] pre, int[] i, int bound) {
              if (i[0] == pre.length || pre[i[0]] > bound) return null;
              TreeNode node = new TreeNode(pre[i[0]++]);
              node.left = build(pre, i, node.val);
              node.right = build(pre, i, bound);
              return node;
          }
        `,
        cpp: code`
          TreeNode* buildBounded(vector<int>& pre, int& i, int bound);

          TreeNode* bstFromPreorder(vector<int>& preorder) {
              int i = 0;
              return buildBounded(preorder, i, INT_MAX);
          }

          TreeNode* buildBounded(vector<int>& pre, int& i, int bound) {
              if (i == (int) pre.size() || pre[i] > bound) return nullptr;
              TreeNode* node = new TreeNode(pre[i++]);
              node->left = buildBounded(pre, i, node->val);
              node->right = buildBounded(pre, i, bound);
              return node;
          }
        `,
        c: code`
          static struct TreeNode* buildBounded(int* pre, int n, int* i, int bound);

          struct TreeNode* bstFromPreorder(int* preorder, int preorderSize) {
              int i = 0;
              return buildBounded(preorder, preorderSize, &i, 2147483647);
          }

          static struct TreeNode* buildBounded(int* pre, int n, int* i, int bound) {
              if (*i == n || pre[*i] > bound) return NULL;
              struct TreeNode* node = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              node->val = pre[(*i)++];
              node->left = buildBounded(pre, n, i, node->val);
              node->right = buildBounded(pre, n, i, bound);
              return node;
          }
        `,
        csharp: code`
          public static TreeNode BstFromPreorder(int[] preorder)
          {
              int i = 0;
              return Build(preorder, ref i, int.MaxValue);
          }

          static TreeNode Build(int[] pre, ref int i, int bound)
          {
              if (i == pre.Length || pre[i] > bound) return null;
              var node = new TreeNode(pre[i++]);
              node.left = Build(pre, ref i, node.val);
              node.right = Build(pre, ref i, bound);
              return node;
          }
        `,
        go: code`
          func bstFromPreorder(preorder []int) *TreeNode {
              i := 0
              return buildBounded(preorder, &i, 1<<31-1)
          }

          func buildBounded(pre []int, i *int, bound int) *TreeNode {
              if *i == len(pre) || pre[*i] > bound {
                  return nil
              }
              node := &TreeNode{Val: pre[*i]}
              *i++
              node.Left = buildBounded(pre, i, node.Val)
              node.Right = buildBounded(pre, i, bound)
              return node
          }
        `,
        kotlin: kt(code`
          fun bstFromPreorder(preorder: IntArray): TreeNode? {
              return buildBounded(preorder, IntArray(1), Int.MAX_VALUE)
          }

          fun buildBounded(pre: IntArray, i: IntArray, bound: Int): TreeNode? {
              if (i[0] == pre.size || pre[i[0]] > bound) return null
              val node = TreeNode(pre[i[0]])
              i[0]++
              node.left = buildBounded(pre, i, node.@val)
              node.right = buildBounded(pre, i, bound)
              return node
          }
        `),
        swift: code`
          func bstFromPreorder(_ preorder: [Int]) -> TreeNode? {
              var i = 0
              return buildBounded(preorder, &i, Int.max)
          }

          func buildBounded(_ pre: [Int], _ i: inout Int, _ bound: Int) -> TreeNode? {
              if i == pre.count || pre[i] > bound { return nil }
              let node = TreeNode(pre[i])
              i += 1
              node.left = buildBounded(pre, &i, node.val)
              node.right = buildBounded(pre, &i, bound)
              return node
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn bstFromPreorder(preorder: Vec<i32>) -> Option<Rc<RefCell<TreeNode>>> {
              let mut i = 0usize;
              build_bounded(&preorder, &mut i, std::i32::MAX)
          }

          fn build_bounded(pre: &Vec<i32>, i: &mut usize, bound: i32) -> Option<Rc<RefCell<TreeNode>>> {
              if *i == pre.len() || pre[*i] > bound {
                  return None;
              }
              let v = pre[*i];
              *i += 1;
              let node = Rc::new(RefCell::new(TreeNode::new(v)));
              let left = build_bounded(pre, i, v);
              let right = build_bounded(pre, i, bound);
              node.borrow_mut().left = left;
              node.borrow_mut().right = right;
              Some(node)
          }
        `,
        php: code`
          function bstFromPreorder($preorder) {
              $i = 0;
              return buildBounded($preorder, $i, PHP_INT_MAX);
          }

          function buildBounded($pre, &$i, $bound) {
              if ($i == count($pre) || $pre[$i] > $bound) return null;
              $node = new TreeNode($pre[$i]);
              $i++;
              $node->left = buildBounded($pre, $i, $node->val);
              $node->right = buildBounded($pre, $i, $bound);
              return $node;
          }
        `,
        ruby: code`
          def bstFromPreorder(preorder)
            idx = [0]
            build_bounded(preorder, idx, Float::INFINITY)
          end

          def build_bounded(pre, idx, bound)
            return nil if idx[0] == pre.length || pre[idx[0]] > bound
            node = TreeNode.new(pre[idx[0]])
            idx[0] += 1
            node.left = build_bounded(pre, idx, node.val)
            node.right = build_bounded(pre, idx, bound)
            node
          end
        `,
      },
    };
  })(),
];

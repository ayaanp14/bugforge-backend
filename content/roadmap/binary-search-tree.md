---
title: Binary Search Tree (BST)
stage: heaps
order: 2
minutes: 22
level: Intermediate
hub: trees
practice: unique-binary-search-trees, minimum-absolute-difference-between-elements-with-constraint, the-number-of-the-smallest-unoccupied-chair, longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit, continuous-subarrays, odd-even-jump, number-of-ways-to-reorder-array-to-get-same-bst, max-sum-of-rectangle-no-larger-than-k
updated: 2026-10-03
seo-title: Binary Search Tree (BST): Insert, Delete, Search, Validate
description: Learn the binary search tree: search, insert, delete with its three cases, validating with bounds, and balanced trees, in C++, Java, Python and JavaScript.
question: What is a binary search tree?
answer: A binary search tree (BST) is a binary tree in which every node's value is larger than every value in its left subtree and smaller than every value in its right subtree. Search, insert and delete each follow one path down from the root, so they cost O(h): O(log n) when the tree is balanced and O(n) when it degenerates into a chain. An inorder traversal lists its values in sorted order.
q: What is a binary search tree used for?
a: It keeps a changing collection in sorted order. Inserting, deleting and searching take O(log n) when the tree is balanced, and it also answers questions a hash table cannot: the smallest value, the next value above x, everything in a range. The ordered sets and maps of C++ and Java are balanced binary search trees.
q: Why is searching a BST O(log n)?
a: Each comparison sends the search into one subtree and rules out the other, so a search walks a single path from the root and costs O(h), the height of the tree. A balanced tree of n nodes has a height of about log₂ n. A tree built from sorted input is a chain of height n − 1, and then a search is O(n).
q: Can a binary search tree have duplicate values?
a: The basic definition assumes distinct values. To allow duplicates, either keep a count in each node or send equal values consistently to one side, and make search and delete follow the same rule. In the libraries, std::multiset allows duplicates while std::set and Java's TreeSet do not; a TreeMap from value to count is the usual Java workaround.
q: How do you check whether a binary tree is a valid BST?
a: Pass every node the range its value must lie in: the root may be anything, a left child must be below its parent's value and a right child above it, and each child inherits the rest of its parent's range. Comparing a node only with its children is not enough. Equivalently, an inorder traversal of a valid BST is strictly increasing. Both checks take O(n).
q: What is the difference between a BST and a heap?
a: A BST orders every left subtree below its node and every right subtree above it, so it can find any value, list everything in sorted order and answer next-larger queries. A heap only keeps each parent no larger than its children, so it can find just the minimum quickly — but it is always a complete tree stored in an array, so its O(log n) bound needs no balancing.
q: Does Python have a built-in balanced BST?
a: No. Python's standard library has no balanced search tree. The usual substitutes are a sorted list kept with the bisect module, whose insert is O(n) but fast in practice, heapq when only the smallest item matters, or the third-party sortedcontainers package where a judge provides it.
---
A plain [binary tree](/roadmap/binary-tree) lets a value sit anywhere, so finding one means visiting every node. Add one rule about where values may sit and a search never needs more than a single path from the root: at every node you know which side the value must be on, and you can ignore the other side completely. That rule makes a **binary search tree**.

It is the structure behind the ordered sets and maps of C++ and Java, and behind every question of the form "what is the smallest value above x that I have seen so far?". This lesson covers the rule, search and insert, the three cases of delete, why inorder traversal comes out sorted, how to validate a tree properly, the lowest common ancestor, and why balance decides whether all of this is fast. Every example is shown in C++, Java, Python and JavaScript.

## Why a sorted array or a hash set is not enough

Suppose values arrive one at a time and you must keep them searchable and in order. A **sorted array** finds a value in O(log n) with [binary search](/roadmap/binary-search), but inserting a value means shifting everything after it one place to the right: O(n) per insert. Insert 100,000 values in random order and the shifts add up to about n² / 4, some 2.5 × 10⁹ element moves.

A **hash set** inserts, finds and deletes in O(1) on average (see [hashing](/roadmap/hashing)), but it keeps no order at all. It cannot tell you the smallest value, the value just above x, or everything between 10 and 20, without looking at every element.

A **balanced binary search tree** does both jobs in O(log n):

| Operation | Sorted array | Hash set | Balanced BST |
| --- | --- | --- | --- |
| Find a value | O(log n) | O(1) average | O(log n) |
| Insert or delete | O(n) | O(1) average | O(log n) |
| Smallest or largest | O(1) | O(n) | O(log n) |
| Smallest value above x | O(log n) | O(n) | O(log n) |
| Every value in order | O(n) | O(n log n), sorting first | O(n) |

When a problem needs order *and* changes, the tree is the only row without an O(n) in it.

## The BST property

A binary tree is a binary search tree when, for **every** node, every value in its left subtree is smaller than the node's value and every value in its right subtree is larger. Here is the tree you get by inserting 8, 3, 10, 1, 6, 14, 4, 7, 13 in that order; every example below uses it:

```text
             8
          /     \
         3       10
        / \        \
       1   6        14
          / \       /
         4   7    13
```

Check the rule at 8: its left subtree holds 1, 3, 4, 6 and 7, all smaller; its right subtree holds 10, 13 and 14, all larger. At 3: 1 on the left, and 4, 6, 7 on the right. At 14: 13 on the left. It holds everywhere.

Note the word **every**. The rule is about whole subtrees, not just about a node and its two children, and confusing the two is the most common bug in BST code (the validation section shows it failing). Three consequences follow straight from the rule:

- The **smallest** value is the leftmost node: keep going left until you cannot. The largest is the rightmost.
- The tree is the decision structure of binary search: the root plays the middle element, each subtree a half.
- The shape depends on the **insertion order**. The same nine values inserted in sorted order would make a chain.

Duplicates need a decision. This lesson keeps values distinct and ignores a repeated insert. If a problem needs duplicates, store a count in the node, or send equal values consistently to one side and make search and delete follow the same rule.

## Search and insert

**Search** starts at the root. If the value equals the node's, it is found. If it is smaller, go left; if larger, go right. If you step off the tree, the value is not there.

Why is it safe to ignore the other side? If the value you want is smaller than the node's value, then every value in the right subtree is larger than the node's value, and so larger than the one you want. It cannot be there. Each comparison throws away a whole subtree, which is exactly how binary search throws away half of an array.

**Insert** is a search that does not expect to succeed. Search for the new value; the empty spot where the search falls off the tree is precisely where the value belongs, so attach it there as a new leaf. Every comparison on the way down put the new value on the correct side of that ancestor, so the property still holds everywhere, and no existing node moves.

The code writes insert so that it **returns the root of the subtree** it was given: `node.left = insert(node.left, v)`. Every call hands back the same node it received, except the call that reaches the empty spot, which hands back the new leaf, and its caller stores it in the right link. This avoids keeping track of the parent and is the same trick delete uses below.

### Dry run

Searching for 7, then inserting 5:

| Step | Search 7: node | Decision | Insert 5: node | Decision |
| --- | --- | --- | --- | --- |
| 1 | 8 | 7 < 8, go left | 8 | 5 < 8, go left |
| 2 | 3 | 7 > 3, go right | 3 | 5 > 3, go right |
| 3 | 6 | 7 > 6, go right | 6 | 5 < 6, go left |
| 4 | 7 | equal: found | 4 | 5 > 4, go right: empty, so 5 becomes the right child of 4 |

Four comparisons each, out of nine or ten values. A search for 5 before the insert would follow exactly the insert's path and fall off at the same empty spot, reporting "not found".

## Delete: the three cases

Deleting must leave a tree that still obeys the rule. Find the node with a search, then look at how many children it has.

- **A leaf.** Remove it: its parent's link becomes empty. Nothing hangs below it, so nothing else changes.
- **One child.** Splice the node out: its only child takes its place. This is safe because the child's whole subtree lay on the same side of every ancestor as the deleted node did, so it still lies on the correct side of all of them.
- **Two children.** Two subtrees cannot both hang from the parent's single link. Instead, replace the node's value with its **inorder successor** — the smallest value in its right subtree, found by going right once and then left as far as possible — and then delete the successor from the right subtree.

Why the successor? It is larger than the deleted value, so it is larger than everything in the left subtree. It is the smallest value in the right subtree, so it is smaller than everything left there. It fits the vacated position exactly. And the successor has **no left child** — a left child would be smaller still — so deleting it is a leaf or one-child case, and the recursion stops one step later. The **inorder predecessor**, the largest value in the left subtree, works the same way from the other side.

### Dry run

After inserting 5, delete 3, which has two children:

```text
   before deleting 3            after deleting 3
           8                           8
         /   \                       /   \
        3     10                    4     10
       / \      \                  / \      \
      1   6      14               1   6      14
         / \     /                   / \     /
        4   7  13                   5   7  13
         \
          5
```

| Step | What happens |
| --- | --- |
| 1 | Search reaches 3: it has two children, 1 and 6. |
| 2 | The successor: go right to 6, then left to 4. 4 has no left child, so it is the smallest value on the right. |
| 3 | Copy 4 into the node that held 3. |
| 4 | Delete 4 from the right subtree: 4 has one child, 5, so 5 takes its place as the left child of 6. |

Deleting 1 next is the leaf case, and deleting 10 is the one-child case: 14 moves up to become the right child of 8.

### The code

The program builds the example tree, searches, inserts 5, and then deletes one node of each kind, printing the inorder traversal after every change so you can see the values stay sorted.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : val(v) {}
};

// Inserts v and returns the subtree's root, so the caller can re-link it.
Node* insert(Node* node, int v) {
    if (!node) return new Node(v);                    // fell off the tree: v belongs here
    if (v < node->val) node->left = insert(node->left, v);
    else if (v > node->val) node->right = insert(node->right, v);
    return node;                                      // an equal value is already present
}

bool search(Node* node, int v) {
    while (node && node->val != v)
        node = v < node->val ? node->left : node->right;  // the other side cannot hold v
    return node != nullptr;
}

// Deletes v and returns the subtree's root.
Node* remove(Node* node, int v) {
    if (!node) return nullptr;                        // v is not in the tree
    if (v < node->val) { node->left = remove(node->left, v); return node; }
    if (v > node->val) { node->right = remove(node->right, v); return node; }
    if (!node->left || !node->right) {                // a leaf or one child: splice it out
        Node* child = node->left ? node->left : node->right;
        delete node;
        return child;
    }
    Node* succ = node->right;                         // two children: the inorder successor,
    while (succ->left) succ = succ->left;             // the smallest value on the right
    node->val = succ->val;
    node->right = remove(node->right, succ->val);     // it has no left child: an easy case
    return node;
}

void inorder(Node* n, vector<int>& out) {
    if (!n) return;
    inorder(n->left, out);
    out.push_back(n->val);
    inorder(n->right, out);
}

void show(const string& label, Node* root) {
    vector<int> values;
    inorder(root, values);
    cout << label << ":";
    for (int v : values) cout << " " << v;
    cout << "\n";
}

int main() {
    Node* root = nullptr;
    for (int v : {8, 3, 10, 1, 6, 14, 4, 7, 13}) root = insert(root, v);
    show("Inorder", root);
    for (int v : {7, 5}) cout << "Search " << v << ": " << (search(root, v) ? "found" : "not found") << "\n";
    root = insert(root, 5);
    show("After insert 5", root);
    root = remove(root, 3);                           // two children
    show("After delete 3", root);
    root = remove(root, 1);                           // a leaf
    show("After delete 1", root);
    root = remove(root, 10);                          // one child
    show("After delete 10", root);
    cout << "Root " << root->val << ", children " << root->left->val << " and " << root->right->val << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    // Inserts v and returns the subtree's root, so the caller can re-link it.
    static Node insert(Node node, int v) {
        if (node == null) return new Node(v);             // fell off the tree: v belongs here
        if (v < node.val) node.left = insert(node.left, v);
        else if (v > node.val) node.right = insert(node.right, v);
        return node;                                      // an equal value is already present
    }

    static boolean search(Node node, int v) {
        while (node != null && node.val != v)
            node = v < node.val ? node.left : node.right; // the other side cannot hold v
        return node != null;
    }

    // Deletes v and returns the subtree's root.
    static Node remove(Node node, int v) {
        if (node == null) return null;                    // v is not in the tree
        if (v < node.val) { node.left = remove(node.left, v); return node; }
        if (v > node.val) { node.right = remove(node.right, v); return node; }
        if (node.left == null || node.right == null)      // a leaf or one child: splice it out
            return node.left != null ? node.left : node.right;
        Node succ = node.right;                           // two children: the inorder successor,
        while (succ.left != null) succ = succ.left;       // the smallest value on the right
        node.val = succ.val;
        node.right = remove(node.right, succ.val);        // it has no left child: an easy case
        return node;
    }

    static void inorder(Node n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);
        inorder(n.right, out);
    }

    static void show(String label, Node root) {
        List<Integer> values = new ArrayList<>();
        inorder(root, values);
        StringBuilder line = new StringBuilder(label + ":");
        for (int v : values) line.append(" ").append(v);
        System.out.println(line);
    }

    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[] {8, 3, 10, 1, 6, 14, 4, 7, 13}) root = insert(root, v);
        show("Inorder", root);
        for (int v : new int[] {7, 5}) System.out.println("Search " + v + ": " + (search(root, v) ? "found" : "not found"));
        root = insert(root, 5);
        show("After insert 5", root);
        root = remove(root, 3);                           // two children
        show("After delete 3", root);
        root = remove(root, 1);                           // a leaf
        show("After delete 1", root);
        root = remove(root, 10);                          // one child
        show("After delete 10", root);
        System.out.println("Root " + root.val + ", children " + root.left.val + " and " + root.right.val);
    }
}
```

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def insert(node, v):
    """Insert v and return the subtree's root, so the caller can re-link it."""
    if node is None:
        return Node(v)                            # fell off the tree: v belongs here
    if v < node.val:
        node.left = insert(node.left, v)
    elif v > node.val:
        node.right = insert(node.right, v)
    return node                                   # an equal value is already present


def search(node, v):
    while node is not None and node.val != v:
        node = node.left if v < node.val else node.right  # the other side cannot hold v
    return node is not None


def remove(node, v):
    """Delete v and return the subtree's root."""
    if node is None:
        return None                               # v is not in the tree
    if v < node.val:
        node.left = remove(node.left, v)
        return node
    if v > node.val:
        node.right = remove(node.right, v)
        return node
    if node.left is None or node.right is None:   # a leaf or one child: splice it out
        return node.left if node.left is not None else node.right
    succ = node.right                             # two children: the inorder successor,
    while succ.left is not None:                  # the smallest value on the right
        succ = succ.left
    node.val = succ.val
    node.right = remove(node.right, succ.val)     # it has no left child: an easy case
    return node


def inorder(n, out):
    if n is not None:
        inorder(n.left, out)
        out.append(n.val)
        inorder(n.right, out)


def show(label, root):
    values = []
    inorder(root, values)
    print(label + ":", *values)


root = None
for v in [8, 3, 10, 1, 6, 14, 4, 7, 13]:
    root = insert(root, v)
show("Inorder", root)
for v in (7, 5):
    print(f"Search {v}:", "found" if search(root, v) else "not found")
root = insert(root, 5)
show("After insert 5", root)
root = remove(root, 3)                            # two children
show("After delete 3", root)
root = remove(root, 1)                            # a leaf
show("After delete 1", root)
root = remove(root, 10)                           # one child
show("After delete 10", root)
print(f"Root {root.val}, children {root.left.val} and {root.right.val}")
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Inserts v and returns the subtree's root, so the caller can re-link it.
function insert(node, v) {
  if (node === null) return new Node(v); // fell off the tree: v belongs here
  if (v < node.val) node.left = insert(node.left, v);
  else if (v > node.val) node.right = insert(node.right, v);
  return node; // an equal value is already present
}

function search(node, v) {
  while (node !== null && node.val !== v) {
    node = v < node.val ? node.left : node.right; // the other side cannot hold v
  }
  return node !== null;
}

// Deletes v and returns the subtree's root.
function remove(node, v) {
  if (node === null) return null; // v is not in the tree
  if (v < node.val) { node.left = remove(node.left, v); return node; }
  if (v > node.val) { node.right = remove(node.right, v); return node; }
  if (node.left === null || node.right === null) {
    return node.left !== null ? node.left : node.right; // a leaf or one child: splice it out
  }
  let succ = node.right; // two children: the inorder successor,
  while (succ.left !== null) succ = succ.left; // the smallest value on the right
  node.val = succ.val;
  node.right = remove(node.right, succ.val); // it has no left child: an easy case
  return node;
}

function inorder(n, out) {
  if (n === null) return;
  inorder(n.left, out);
  out.push(n.val);
  inorder(n.right, out);
}

function show(label, root) {
  const values = [];
  inorder(root, values);
  console.log(`${label}: ${values.join(" ")}`);
}

let root = null;
for (const v of [8, 3, 10, 1, 6, 14, 4, 7, 13]) root = insert(root, v);
show("Inorder", root);
for (const v of [7, 5]) console.log(`Search ${v}: ${search(root, v) ? "found" : "not found"}`);
root = insert(root, 5);
show("After insert 5", root);
root = remove(root, 3); // two children
show("After delete 3", root);
root = remove(root, 1); // a leaf
show("After delete 1", root);
root = remove(root, 10); // one child
show("After delete 10", root);
console.log(`Root ${root.val}, children ${root.left.val} and ${root.right.val}`);
```

```output
Inorder: 1 3 4 6 7 8 10 13 14
Search 7: found
Search 5: not found
After insert 5: 1 3 4 5 6 7 8 10 13 14
After delete 3: 1 4 5 6 7 8 10 13 14
After delete 1: 4 5 6 7 8 10 13 14
After delete 10: 4 5 6 7 8 13 14
Root 8, children 4 and 14
```

## Inorder traversal gives sorted order

Inorder visits a node's left subtree, then the node, then its right subtree. In a BST that is: everything smaller, then the node, then everything larger. Since the same holds inside each subtree, the whole traversal comes out in increasing order — which is why every line of the output above is sorted. This one fact powers several standard questions:

- **Sorted output.** Inserting n values and reading them back in inorder sorts them: O(n log n) on a balanced tree, the idea behind tree sort.
- **The kth smallest value.** It is the kth node an inorder traversal visits. Use the iterative inorder from the [binary tree](/roadmap/binary-tree) lesson and stop at the kth visit: O(h + k) instead of listing all n values. If each node also stores the size of its subtree, you can go straight to the kth value in O(h): when the left subtree holds L values, the node is the (L + 1)th, so go left if k ≤ L, stop if k = L + 1, otherwise go right looking for the (k − L − 1)th.
- **Range queries.** To list every value between lo and hi, run inorder but skip a left subtree when the node is already below lo, and a right subtree when it is above hi.
- **Successor and predecessor.** The next larger value after a node is the leftmost node of its right subtree, or, if it has no right subtree, the nearest ancestor whose left subtree contains it.

```text
kthSmallest(root, k):
    stack = empty, cur = root
    while cur is not empty or stack is not empty:
        while cur is not empty: push cur, cur = cur.left
        cur = pop()
        k = k - 1
        if k == 0: return cur.value       # the kth visit in sorted order
        cur = cur.right
```

## Validating a BST

The tempting check compares each node with its two children: the left child must be smaller, the right child larger. It is wrong, because the rule is about whole subtrees. This tree passes the tempting check at every node:

```text
        5
      /   \
     3     8
          / \
         4   9
```

3 < 5, 8 > 5, 4 < 8 and 9 > 8 — yet 4 sits in the right subtree of 5 while being smaller than 5. The damage is real: a search for 4 goes left at 5 (4 < 5), then right at 3, falls off the tree and reports that 4 is missing, although it is right there.

The correct check passes each node the **open range** its value must lie in. The root may hold anything: (−∞, +∞). Going left from a node with value v narrows the top of the range to v; going right narrows the bottom to v. Each child inherits its parent's range and tightens one end, so the range carries the constraint of **every** ancestor, not just the parent.

| Node | Allowed range | Inside? |
| --- | --- | --- |
| 5 | (−∞, +∞) | yes |
| 3 | (−∞, 5) | yes |
| 8 | (5, +∞) | yes |
| 4 | (5, 8) | no: 4 is not above 5, so the tree is invalid |
| 9 | (8, +∞) | not reached; the answer is already known |

An equivalent check runs an inorder traversal and confirms every value is larger than the one before: this tree gives 3 5 4 8 9, and 4 after 5 gives it away. Both take O(n). In C++ and Java, use 64-bit sentinels (or "no bound yet" markers) for the infinities: a node may legitimately hold the smallest or largest 32-bit integer, and an `int` sentinel equal to it would reject a valid tree.

## Lowest common ancestor in a BST

The **lowest common ancestor** (LCA) of two nodes is the deepest node that has both of them in its subtree — where their paths from the root part ways. In a plain binary tree, finding it means searching both subtrees. In a BST the values say where to go. If both values are smaller than the current node, both lie in its left subtree, so the LCA is there too; if both are larger, go right. The first node whose value lies **between** them, or equals one of them, is where the paths split, and it is the answer — no deeper node can contain both, because they are on different sides of it.

In our tree, LCA(4, 7): at 8 both are smaller, go left; at 3 both are larger, go right; at 6, 4 < 6 < 7, so 6 is the answer. LCA(4, 14) is 8 straight away, since 4 < 8 < 14. One walk down: O(h).

### The code

The program checks two trees with both validation methods, then finds the 3rd smallest value and two lowest common ancestors in the example tree. Tree B is built by hand, because inserting values can never produce an invalid tree.

```cpp
#include <climits>
#include <iostream>
#include <stack>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : val(v) {}
};

Node* insert(Node* node, int v) {
    if (!node) return new Node(v);
    if (v < node->val) node->left = insert(node->left, v);
    else if (v > node->val) node->right = insert(node->right, v);
    return node;
}

// The tempting check: each node against its own children only. It is wrong.
bool parentOnly(Node* n) {
    if (!n) return true;
    if (n->left && n->left->val >= n->val) return false;
    if (n->right && n->right->val <= n->val) return false;
    return parentOnly(n->left) && parentOnly(n->right);
}

// The right check: each value must lie strictly inside the range its ancestors allow.
bool isValid(Node* n, long long low, long long high) {
    if (!n) return true;
    if (n->val <= low || n->val >= high) return false;
    return isValid(n->left, low, n->val) && isValid(n->right, n->val, high);
}

// Inorder visits values in sorted order, so the kth visit is the kth smallest.
int kthSmallest(Node* root, int k) {
    stack<Node*> st;
    Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        if (--k == 0) return cur->val;
        cur = cur->right;
    }
    return -1;                                    // fewer than k values
}

// The first node whose value lies between p and q splits them: it is their LCA.
int lca(Node* node, int p, int q) {
    while (node) {
        if (p < node->val && q < node->val) node = node->left;
        else if (p > node->val && q > node->val) node = node->right;
        else return node->val;
    }
    return -1;
}

const char* verdict(bool ok) { return ok ? "valid" : "invalid"; }

int main() {
    Node* a = nullptr;
    for (int v : {8, 3, 10, 1, 6, 14, 4, 7, 13}) a = insert(a, v);
    Node* b = new Node(5);                        // built by hand: 4 is on the wrong side of 5
    b->left = new Node(3);
    b->right = new Node(8);
    b->right->left = new Node(4);
    b->right->right = new Node(9);
    cout << "Tree A, parent-only check: " << verdict(parentOnly(a)) << "\n";
    cout << "Tree A, range check: " << verdict(isValid(a, LLONG_MIN, LLONG_MAX)) << "\n";
    cout << "Tree B, parent-only check: " << verdict(parentOnly(b)) << "\n";
    cout << "Tree B, range check: " << verdict(isValid(b, LLONG_MIN, LLONG_MAX)) << "\n";
    cout << "3rd smallest in A: " << kthSmallest(a, 3) << "\n";
    cout << "LCA of 4 and 7: " << lca(a, 4, 7) << "\n";
    cout << "LCA of 4 and 14: " << lca(a, 4, 14) << "\n";
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    static Node insert(Node node, int v) {
        if (node == null) return new Node(v);
        if (v < node.val) node.left = insert(node.left, v);
        else if (v > node.val) node.right = insert(node.right, v);
        return node;
    }

    // The tempting check: each node against its own children only. It is wrong.
    static boolean parentOnly(Node n) {
        if (n == null) return true;
        if (n.left != null && n.left.val >= n.val) return false;
        if (n.right != null && n.right.val <= n.val) return false;
        return parentOnly(n.left) && parentOnly(n.right);
    }

    // The right check: each value must lie strictly inside the range its ancestors allow.
    static boolean isValid(Node n, long low, long high) {
        if (n == null) return true;
        if (n.val <= low || n.val >= high) return false;
        return isValid(n.left, low, n.val) && isValid(n.right, n.val, high);
    }

    // Inorder visits values in sorted order, so the kth visit is the kth smallest.
    static int kthSmallest(Node root, int k) {
        Deque<Node> st = new ArrayDeque<>();
        Node cur = root;
        while (cur != null || !st.isEmpty()) {
            while (cur != null) { st.push(cur); cur = cur.left; }
            cur = st.pop();
            if (--k == 0) return cur.val;
            cur = cur.right;
        }
        return -1;                                // fewer than k values
    }

    // The first node whose value lies between p and q splits them: it is their LCA.
    static int lca(Node node, int p, int q) {
        while (node != null) {
            if (p < node.val && q < node.val) node = node.left;
            else if (p > node.val && q > node.val) node = node.right;
            else return node.val;
        }
        return -1;
    }

    static String verdict(boolean ok) { return ok ? "valid" : "invalid"; }

    public static void main(String[] args) {
        Node a = null;
        for (int v : new int[] {8, 3, 10, 1, 6, 14, 4, 7, 13}) a = insert(a, v);
        Node b = new Node(5);                     // built by hand: 4 is on the wrong side of 5
        b.left = new Node(3);
        b.right = new Node(8);
        b.right.left = new Node(4);
        b.right.right = new Node(9);
        System.out.println("Tree A, parent-only check: " + verdict(parentOnly(a)));
        System.out.println("Tree A, range check: " + verdict(isValid(a, Long.MIN_VALUE, Long.MAX_VALUE)));
        System.out.println("Tree B, parent-only check: " + verdict(parentOnly(b)));
        System.out.println("Tree B, range check: " + verdict(isValid(b, Long.MIN_VALUE, Long.MAX_VALUE)));
        System.out.println("3rd smallest in A: " + kthSmallest(a, 3));
        System.out.println("LCA of 4 and 7: " + lca(a, 4, 7));
        System.out.println("LCA of 4 and 14: " + lca(a, 4, 14));
    }
}
```

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def insert(node, v):
    if node is None:
        return Node(v)
    if v < node.val:
        node.left = insert(node.left, v)
    elif v > node.val:
        node.right = insert(node.right, v)
    return node


def parent_only(n):
    """The tempting check: each node against its own children only. It is wrong."""
    if n is None:
        return True
    if n.left is not None and n.left.val >= n.val:
        return False
    if n.right is not None and n.right.val <= n.val:
        return False
    return parent_only(n.left) and parent_only(n.right)


def is_valid(n, low, high):
    """The right check: each value must lie strictly inside the range its ancestors allow."""
    if n is None:
        return True
    if n.val <= low or n.val >= high:
        return False
    return is_valid(n.left, low, n.val) and is_valid(n.right, n.val, high)


def kth_smallest(root, k):
    """Inorder visits values in sorted order, so the kth visit is the kth smallest."""
    stack, cur = [], root
    while cur is not None or stack:
        while cur is not None:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right
    return -1                                     # fewer than k values


def lca(node, p, q):
    """The first node whose value lies between p and q splits them: it is their LCA."""
    while node is not None:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node.val
    return -1


def verdict(ok):
    return "valid" if ok else "invalid"


a = None
for v in [8, 3, 10, 1, 6, 14, 4, 7, 13]:
    a = insert(a, v)
b = Node(5)                                       # built by hand: 4 is on the wrong side of 5
b.left, b.right = Node(3), Node(8)
b.right.left, b.right.right = Node(4), Node(9)
INF = float("inf")
print("Tree A, parent-only check:", verdict(parent_only(a)))
print("Tree A, range check:", verdict(is_valid(a, -INF, INF)))
print("Tree B, parent-only check:", verdict(parent_only(b)))
print("Tree B, range check:", verdict(is_valid(b, -INF, INF)))
print("3rd smallest in A:", kth_smallest(a, 3))
print("LCA of 4 and 7:", lca(a, 4, 7))
print("LCA of 4 and 14:", lca(a, 4, 14))
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function insert(node, v) {
  if (node === null) return new Node(v);
  if (v < node.val) node.left = insert(node.left, v);
  else if (v > node.val) node.right = insert(node.right, v);
  return node;
}

// The tempting check: each node against its own children only. It is wrong.
function parentOnly(n) {
  if (n === null) return true;
  if (n.left !== null && n.left.val >= n.val) return false;
  if (n.right !== null && n.right.val <= n.val) return false;
  return parentOnly(n.left) && parentOnly(n.right);
}

// The right check: each value must lie strictly inside the range its ancestors allow.
function isValid(n, low, high) {
  if (n === null) return true;
  if (n.val <= low || n.val >= high) return false;
  return isValid(n.left, low, n.val) && isValid(n.right, n.val, high);
}

// Inorder visits values in sorted order, so the kth visit is the kth smallest.
function kthSmallest(root, k) {
  const stack = [];
  let cur = root;
  while (cur !== null || stack.length > 0) {
    while (cur !== null) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
  return -1; // fewer than k values
}

// The first node whose value lies between p and q splits them: it is their LCA.
function lca(node, p, q) {
  while (node !== null) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node.val;
  }
  return -1;
}

const verdict = (ok) => (ok ? "valid" : "invalid");

let a = null;
for (const v of [8, 3, 10, 1, 6, 14, 4, 7, 13]) a = insert(a, v);
const b = new Node(5); // built by hand: 4 is on the wrong side of 5
b.left = new Node(3);
b.right = new Node(8);
b.right.left = new Node(4);
b.right.right = new Node(9);
console.log(`Tree A, parent-only check: ${verdict(parentOnly(a))}`);
console.log(`Tree A, range check: ${verdict(isValid(a, -Infinity, Infinity))}`);
console.log(`Tree B, parent-only check: ${verdict(parentOnly(b))}`);
console.log(`Tree B, range check: ${verdict(isValid(b, -Infinity, Infinity))}`);
console.log(`3rd smallest in A: ${kthSmallest(a, 3)}`);
console.log(`LCA of 4 and 7: ${lca(a, 4, 7)}`);
console.log(`LCA of 4 and 14: ${lca(a, 4, 14)}`);
```

```output
Tree A, parent-only check: valid
Tree A, range check: valid
Tree B, parent-only check: valid
Tree B, range check: invalid
3rd smallest in A: 4
LCA of 4 and 7: 6
LCA of 4 and 14: 8
```

## Balanced and skewed trees

Every operation so far walks one path, so it costs O(h), and everything depends on the height. Insert 1, 2, 3, 4, 5 in that order and each value is larger than all before it, so each becomes the right child of the last: a chain of height n − 1. The BST has become a linked list, and search, insert and delete are all O(n). Sorted input is common — timestamps, ids, a list that was already sorted — so this is not a rare case to dismiss.

Inserting values in random order does much better: the average depth of a node is about 1.39 log₂ n. But "on average" is no guarantee against an unlucky or adversarial order. **Self-balancing** trees give the guarantee by repairing the shape after every insert and delete with **rotations**, which move a node up or down while keeping the inorder order intact:

```text
          y                          x
         / \     rotate right       / \
        x   C    ----------->      A   y
       / \                            / \
      A   B                          B   C

   inorder before and after: A, x, B, y, C
```

A rotation changes three links, so it is O(1). An **AVL tree** keeps the two subtree heights of every node within 1 of each other, which bounds its height by about 1.44 log₂ n. A **red-black tree** follows looser colouring rules, which bound its height by 2 log₂(n + 1) and need fewer rotations per update. Interviews rarely ask you to write either; they expect you to know they exist and to use the library:

| Language | Ordered set and map | Smallest ≥ x | Smallest > x | Largest ≤ x |
| --- | --- | --- | --- | --- |
| C++ | `std::set`, `std::multiset`, `std::map` | `s.lower_bound(x)` | `s.upper_bound(x)` | `prev(s.upper_bound(x))`, if not `begin()` |
| Java | `TreeSet`, `TreeMap` | `ceiling(x)`, `ceilingKey(x)` | `higher(x)` | `floor(x)`, `floorKey(x)` |
| Python | none built in | `bisect_left` on a sorted list | `bisect_right` | index `bisect_right − 1` |
| JavaScript | none built in | binary search on a sorted array | | |

The C++ standard only demands logarithmic operations, but every major library implements `std::set` and `std::map` as red-black trees; Java documents `TreeMap` as one, and `TreeSet` is built on it. Python has no balanced tree in its standard library: a sorted list maintained with `bisect.insort` is the usual stand-in, with an O(n) insert that is a fast memory move and fine for 10⁵ values; `heapq` serves when you only need the minimum (see [heaps](/roadmap/heap)). JavaScript has nothing either, so the same sorted-array approach applies.

## Time and space complexity

| Operation | Balanced BST | Skewed BST |
| --- | --- | --- |
| Search, insert, delete | O(log n) | O(n) |
| Minimum, maximum, successor | O(log n) | O(n) |
| kth smallest by inorder | O(log n + k) | O(n) |
| Lowest common ancestor | O(log n) | O(n) |
| Validate, list in sorted order | O(n) | O(n) |

The tree itself takes O(n) space. The recursive insert and delete also use O(h) of call stack, the kth-smallest loop O(h) for its explicit stack, and the loops for search and the LCA only O(1). The whole table rests on the height, which is why the library's balanced trees, not hand-written plain ones, are what you reach for in real code.

## How to recognise a BST problem

- The statement says **binary search tree**: validate it, find the kth smallest, find the LCA, build a balanced tree from a sorted array (make the middle element the root, recursively).
- Values **arrive over time** and you need the nearest one: "the smallest earlier value above x", "the closest value seen so far", floor and ceiling. That is an ordered set.
- A sliding window must report its **minimum and maximum** while arbitrary elements leave it: an ordered multiset does it in O(log n) per step (monotonic deques can do it in O(1)).
- You need the **kth smallest** or the median of a set that keeps changing: a BST with subtree sizes, or the two-heap trick from the [heap](/roadmap/heap) lesson.
- The question **counts trees**: how many BSTs hold 1 to n, or how many insertion orders build the same tree. Choosing the root splits the values into a left and a right group, which turns into [dynamic programming](/roadmap/dynamic-programming) or combinatorics.

## Common mistakes

- **Validating against the parent only.** The rule covers whole subtrees; pass a range down, or check that the inorder sequence is strictly increasing.
- **32-bit sentinels.** Using the smallest and largest `int` as "no bound" rejects a valid tree that contains those values. Use 64-bit bounds or nullable ones.
- **Dropping the returned subtree.** With the return-the-root style, `insert(node.left, v)` without `node.left =` in front does nothing for an empty child. Always store the result.
- **Mishandling the two-children delete.** After copying the successor's value, delete the successor from the **right subtree**, not from the whole tree, which would find and delete the node you just overwrote.
- **Assuming O(log n) from a hand-written tree.** A plain BST fed sorted data is O(n) per operation. Use the library's balanced tree, or shuffle the input when you control it.
- **Using the free `std::lower_bound` on a `std::set`.** Set iterators are not random-access, so the generic algorithm walks linearly: O(n). Call the member, `s.lower_bound(x)`, which is O(log n).

## Practice in this order

The catalogue states its problems with arrays rather than linked nodes, so these practise the BST property itself and the library's balanced trees:

1. [Unique Binary Search Trees](/problems/unique-binary-search-trees): choosing the root splits 1..n into a left and a right group — the BST property as a counting rule.
2. [Minimum Absolute Difference Between Elements With Constraint](/problems/minimum-absolute-difference-between-elements-with-constraint): an ordered set and its floor and ceiling queries as you sweep.
3. [The Number of the Smallest Unoccupied Chair](/problems/the-number-of-the-smallest-unoccupied-chair): the smallest free chair from an ordered set of free ones.
4. [Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit): an ordered multiset holds a window's minimum and maximum.
5. [Continuous Subarrays](/problems/continuous-subarrays): the same window, now counting every valid subarray.
6. [Odd Even Jump](/problems/odd-even-jump): ceiling and floor lookups in a tree map, filled from the right.
7. [Number of Ways to Reorder Array to Get Same BST](/problems/number-of-ways-to-reorder-array-to-get-same-bst): insertion order decides the shape; the left and right groups interleave.
8. [Max Sum of Rectangle No Larger Than K](/problems/max-sum-of-rectangle-no-larger-than-k): prefix sums and a ceiling query in an ordered set.

The [trees problem list](/challenges/trees) and the [ordered set list](/challenges/ordered-set) hold the rest. Next on the road is the [heap](/roadmap/heap): a different ordering rule on the same kind of tree, weaker than a BST's but enough to hand back the smallest value in O(log n), with no balancing needed.

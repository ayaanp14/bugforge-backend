---
title: Binary Search Tree (BST)
stage: heaps
order: 2
minutes: 13
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
A plain [binary tree](/roadmap/binary-tree) lets a value sit anywhere, so finding one means visiting every node. Add one rule about where values may sit and a search needs only one path from the root, because at every node you know which side the value must be on. That rule makes a **binary search tree**, the structure behind the ordered sets and maps of C++ and Java.

@figure property

## Why a sorted array or a hash set is not enough

Values arrive one at a time and must stay searchable and in order. A **sorted array** finds one with [binary search](/roadmap/binary-search), but every insert shifts what follows: 100,000 random inserts make some 2.5 × 10⁹ moves. A **hash set** (see [hashing](/roadmap/hashing)) keeps no order, so "the value just above x" means looking at everything.

| Operation | Sorted array | Hash set | Balanced BST |
| --- | --- | --- | --- |
| Find a value | O(log n) | O(1) average | O(log n) |
| Insert or delete | O(n) | O(1) average | O(log n) |
| Smallest value above x | O(log n) | O(n) | O(log n) |
| Every value in order | O(n) | O(n log n) | O(n) |

When a problem needs order *and* change, the tree is the only column without an O(n) in it.

## What the rule gives you

The rule is about **whole subtrees**, not just a node and its two children; confusing the two is the most common bug in BST code. Three consequences follow. The **smallest** value is the leftmost node. The tree is binary search made solid: the root plays the middle element, each subtree a half. And the **shape depends on the insertion order** — sorted input makes a chain. This lesson keeps values distinct; for duplicates, store a count in the node.

## Search and insert

**Search** starts at the root: equal means found, smaller goes left, larger goes right, and stepping off the tree means the value is not there. **Insert** is a search that does not expect to succeed: the empty spot where it falls off is exactly where the new value belongs.

@figure search

The code's insert **returns the root of the subtree** it was given — `node.left = insert(node.left, v)` — so the call that reaches the empty spot hands back the new leaf for its caller to link in. No parent pointer is needed; delete uses the same trick.

## Delete: the three cases

Find the node, then count its children. A **leaf** is simply removed. With **one child**, the child takes its place: its subtree lay on the same side of every ancestor as the deleted node, so it still does. With **two children**, copy in the **inorder successor** — the smallest value in the right subtree — and delete that instead.

@figure delete

Why the successor? It is larger than everything on the left and smaller than everything else on the right, so it fits exactly; and it has **no left child**, which would be smaller still, so removing it is an easy case. The largest value on the left, the **predecessor**, works too.

### The code

The program builds the example tree, searches, inserts 5 and deletes one node of each kind, printing the inorder traversal after every change.

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

Inorder visits the left subtree, the node, then the right subtree — in a BST, everything smaller, the node, everything larger — so it comes out sorted:

@walkthrough

So the **kth smallest** is the kth node inorder visits, O(h + k) — or O(h) if each node stores its subtree's size: with L values on the left, go left when k ≤ L, stop at k = L + 1, else go right for the (k − L − 1)th. A **range** query is inorder that skips subtrees wholly below lo or above hi.

## Validating a BST

Comparing each node with its two children is not enough: a node deep on the right can be smaller than an ancestor while every parent–child pair looks fine. The correct check hands each node the **open range** its value must lie in, so the limit of every ancestor travels down.

@figure validate

An inorder traversal that must strictly increase is an equivalent check; both are O(n).

## Lowest common ancestor in a BST

The **lowest common ancestor** (LCA) of two nodes is the deepest node with both in its subtree, where their paths from the root part. In a BST the values steer: while both lie on one side, go that way; the first node **between** them, or equal to one, is the answer.

@figure lca

### The code

The program checks two trees both ways, then finds the 3rd smallest value and two LCAs. Tree B is built by hand: inserting can never produce an invalid tree.

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

Every operation here walks one path, so it costs O(h). Sorted input — timestamps, ids — is common, and it is the worst case:

@figure skewed

**Self-balancing** trees guarantee O(log n) height by repairing the shape after every update with **rotations**, which move nodes up and down without disturbing the order:

@figure rotation

An **AVL tree** keeps every node's two subtree heights within 1; a **red-black tree** follows looser colour rules with fewer rotations. You will rarely write either — use the library:

| Language | Ordered set and map | Smallest ≥ x | Smallest > x | Largest ≤ x |
| --- | --- | --- | --- | --- |
| C++ | `std::set`, `std::multiset`, `std::map` | `s.lower_bound(x)` | `s.upper_bound(x)` | `prev(s.upper_bound(x))`, if not `begin()` |
| Java | `TreeSet`, `TreeMap` | `ceiling(x)`, `ceilingKey(x)` | `higher(x)` | `floor(x)`, `floorKey(x)` |
| Python | none built in | `bisect_left` on a sorted list | `bisect_right` | index `bisect_right − 1` |
| JavaScript | none built in | binary search on a sorted array | | |

C++'s `std::set` and Java's `TreeMap` are red-black trees. Python and JavaScript have none: keep a sorted list (`bisect.insort`), whose O(n) insert is a fast memory move, or a [heap](/roadmap/heap) when only the minimum matters.

## Time and space complexity

| Operation | Balanced BST | Skewed BST |
| --- | --- | --- |
| Search, insert, delete | O(log n) | O(n) |
| Minimum, maximum, successor | O(log n) | O(n) |
| kth smallest by inorder | O(log n + k) | O(n) |
| Lowest common ancestor | O(log n) | O(n) |
| Validate, list in sorted order | O(n) | O(n) |

The tree takes O(n) space, and recursion adds O(h).

## How to recognise a BST problem

- The statement says **binary search tree**: validate it, find the kth smallest or the LCA, build one from a sorted array.
- Values **arrive over time** and you need the nearest: floor, ceiling, "the smallest earlier value above x".
- A sliding window must report its **minimum and maximum** as arbitrary elements leave.
- The **kth smallest or median** of a changing set.
- The question **counts trees** or insertion orders: choosing the root splits the values, which becomes [dynamic programming](/roadmap/dynamic-programming).

## Common mistakes

- **Validating against the parent only**: pass a range down, or check that inorder strictly increases.
- **32-bit sentinels** that reject a valid tree holding `INT_MIN` or `INT_MAX`.
- **Dropping the returned subtree**: write `node.left = insert(node.left, v)`, not just the call.
- **Deleting the successor from the whole tree** instead of the right subtree, which finds the value you just copied.
- **Expecting O(log n) from a hand-written tree** fed sorted data; use the library's balanced tree.
- **The free `std::lower_bound` on a `std::set`**: it walks linearly. Call the member `s.lower_bound(x)`.

## Practice in this order

The catalogue states its problems with arrays, not linked nodes, so these practise the property and the library's trees:

1. [Unique Binary Search Trees](/problems/unique-binary-search-trees): choosing the root splits 1..n into two groups.
2. [Minimum Absolute Difference Between Elements With Constraint](/problems/minimum-absolute-difference-between-elements-with-constraint): floor and ceiling in an ordered set.
3. [The Number of the Smallest Unoccupied Chair](/problems/the-number-of-the-smallest-unoccupied-chair): the smallest free chair from an ordered set.
4. [Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit): a window's minimum and maximum in a multiset.
5. [Continuous Subarrays](/problems/continuous-subarrays): the same window, counting every valid subarray.
6. [Odd Even Jump](/problems/odd-even-jump): ceiling and floor lookups in a tree map, filled from the right.
7. [Number of Ways to Reorder Array to Get Same BST](/problems/number-of-ways-to-reorder-array-to-get-same-bst): insertion order decides the shape.
8. [Max Sum of Rectangle No Larger Than K](/problems/max-sum-of-rectangle-no-larger-than-k): prefix sums and a ceiling query.

The [trees problem list](/challenges/trees) and the [ordered set list](/challenges/ordered-set) hold the rest. Next on the road is the [heap](/roadmap/heap): a weaker ordering rule on the same kind of tree, enough to hand back the smallest value in O(log n) with no balancing needed.

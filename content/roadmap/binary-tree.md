---
title: Binary Trees and Tree Traversals
stage: heaps
order: 1
minutes: 24
level: Beginner
hub: trees
practice: reachable-nodes-with-restrictions, time-needed-to-inform-all-employees, count-nodes-with-the-highest-score, number-of-nodes-in-the-sub-tree-with-the-same-label, minimum-fuel-cost-to-report-to-the-capital, graph-valid-tree, minimum-height-trees, longest-path-with-different-adjacent-characters, sum-of-distances-in-tree
updated: 2026-10-03
seo-title: Binary Tree Traversal: Preorder, Inorder, Postorder, BFS
description: Learn binary trees: terms, node structure, preorder, inorder, postorder and level order traversal, and tree height, in C++, Java, Python and JavaScript.
question: What is a binary tree and how do you traverse it?
answer: A binary tree is a hierarchy of nodes in which every node holds a value and links to at most two children, a left one and a right one. Traversing it means visiting every node once. Preorder, inorder and postorder go depth-first and differ only in when a node is visited relative to its two subtrees; level order goes breadth-first with a queue. Each traversal takes O(n) time.
q: What is the difference between a binary tree and a binary search tree?
a: A binary tree only limits every node to at most two children; the values can sit anywhere. A binary search tree adds an ordering rule — everything in a node's left subtree is smaller than it and everything in its right subtree is larger — and that rule is what lets a search follow one path instead of visiting every node.
q: What is the difference between depth and height in a tree?
a: Depth is measured downwards from the root: the number of edges from the root to the node, so the root has depth 0. Height is measured from the node down to its deepest leaf, so every leaf has height 0. The height of the whole tree equals the largest depth of any node.
q: Which tree traversal should I use?
a: Use postorder when a node's answer depends on its children's answers (sizes, heights, freeing a tree), preorder when a node hands something down to its children or when you want to copy the tree, inorder when you need a binary search tree's values in sorted order, and level order when the question is about levels or the shortest distance from the root.
q: Is level order traversal the same as BFS?
a: Yes. Level order traversal is breadth-first search on a tree: a queue holds the nodes waiting to be visited, so every node at depth d is visited before any node at depth d + 1. Preorder, inorder and postorder are the three depth-first orders.
q: What is the time complexity of a tree traversal?
a: Every traversal visits each node once and does constant work there, so it takes O(n) time for n nodes. The extra space is the stack, O(h) for a tree of height h — O(log n) when the tree is balanced and O(n) when it degenerates into a chain — or, for level order, the queue, which is as long as the widest level.
q: How many nodes can a binary tree of height h have?
a: At most 2ʰ⁺¹ − 1, when every level is completely full, because level d holds at most 2ᵈ nodes. At least h + 1, when every node has a single child and the tree is really a chain. Turned around, a tree of n nodes has height at least ⌊log₂ n⌋.
---
Arrays, linked lists, stacks and queues are all **linear**: every element has at most one element after it. A great deal of data is not shaped like that. A company has a chief executive, who has managers, who have teams. A folder holds files and other folders. A web page is an element containing elements. An arithmetic expression such as (2 + 3) × 4 is an operation whose operands are themselves operations. All of these are **trees**: one item at the top, and every other item hanging below exactly one parent.

The **binary tree**, in which every node has at most two children, is the tree you will meet most in interviews, and it is the shape underneath the [binary search tree](/roadmap/binary-search-tree), the [heap](/roadmap/heap) and, with more children per node, the [trie](/roadmap/trie). This lesson gives you the vocabulary, how a tree is stored and built, the four ways to visit every node, and the one recursive pattern behind most tree problems. Every example is shown in C++, Java, Python and JavaScript.

## Why a tree and not a list

A list makes you walk it from one end. To find an item among a million, you may look at a million items. A tree with the same million items can be much shallower: if every node has two children and the levels are full, level 0 holds 1 node, level 1 holds 2, level 2 holds 4, and level d holds 2ᵈ. Twenty levels already hold more than a million nodes, because 2²⁰ = 1,048,576.

So anything that walks **one path from the root to a leaf** — checking a value, inserting one, removing the smallest — costs about 20 steps instead of a million, provided the tree stays bushy rather than stringy. That single fact is why search trees, heaps and tries exist. The other reason to learn trees is simpler: when the data is a hierarchy, a tree is not a speed trick but the honest shape of the problem, and the code that follows that shape is short.

## The vocabulary of trees

Here is the tree every example in this lesson uses:

```text
            1              depth 0  (level 0)
          /   \
         2     3           depth 1
        / \     \
       4   5     6         depth 2
          /
         7                 depth 3
```

- The **root** is the one node with no parent: 1.
- Every other node has exactly one **parent**; the nodes below it are its **children**. 2 and 3 are the children of 1, and they are **siblings** of each other.
- A **leaf** has no children: 4, 6 and 7. A node with at least one child is an **internal** node.
- An **edge** joins a parent to a child. A tree with n nodes has exactly n − 1 edges, because every node except the root has one edge up to its parent.
- The **subtree** of a node is that node with everything below it. The subtree of 2 is {2, 4, 5, 7}.
- The **depth** of a node is the number of edges from the root down to it. All nodes at the same depth form a **level**.
- The **height** of a node is the number of edges on the longest path from it down to a leaf. The height of the tree is the height of the root, which equals the largest depth: 3 here.

| Node | Parent | Children | Depth | Height | Kind |
| --- | --- | --- | --- | --- | --- |
| 1 | none | 2, 3 | 0 | 3 | root |
| 2 | 1 | 4, 5 | 1 | 2 | internal |
| 3 | 1 | 6 | 1 | 1 | internal |
| 4 | 2 | none | 2 | 0 | leaf |
| 5 | 2 | 7 | 2 | 1 | internal |
| 6 | 3 | none | 2 | 0 | leaf |
| 7 | 5 | none | 3 | 0 | leaf |

One warning about height: this lesson counts **edges**, as textbooks do, so a single node has height 0. Many coding problems, including the well-known "maximum depth of a binary tree", count **nodes** instead, so the same tree has depth 4 there. Neither is wrong; read which one the problem means.

## How a binary tree is stored

The usual representation is a **node** object holding a value and two references, `left` and `right`, each pointing at a child or at nothing. The whole tree is reached through a reference to the root. This is a [linked list](/roadmap/linked-list) with two "next" pointers instead of one, and like a linked list it can grow and change shape cheaply.

Problems give you the tree in one of three ways, and you should recognise each:

- **Linked nodes**, already built. Common in interviews on a whiteboard.
- **A level-order listing with gaps**, such as `[1, 2, 3, 4, 5, null, 6, null, null, 7]` for the tree above. It lists the nodes level by level, left to right, and writes `null` where a child is missing, but only for children of nodes that exist.
- **A parent array or an edge list**: `parents[i]` is the parent of node `i`, or a list of pairs of connected nodes. This is how most problems in the catalogue describe a tree, and a later section shows how to work with it.

A fourth form, a plain array in which the children of index i sit at 2i + 1 and 2i + 2, works only when every level is full except the last, filled from the left. That is exactly the shape of a heap, which is why heaps are stored that way.

### Building a tree from a level-order listing

The listing is in level order, so nodes receive their children in the same order in which they were created: first created, first given children. That is a first-in, first-out rule, so the builder uses a [queue](/roadmap/queue). Take the next node from the queue, give it the next two entries of the listing as its left and right child (skipping `null`s), and put any new children at the back of the queue.

| Taken from the queue | Next two entries | Left child | Right child | Queue afterwards |
| --- | --- | --- | --- | --- |
| 1 | 2, 3 | 2 | 3 | 2, 3 |
| 2 | 4, 5 | 4 | 5 | 3, 4, 5 |
| 3 | null, 6 | none | 6 | 4, 5, 6 |
| 4 | null, null | none | none | 5, 6 |
| 5 | 7, end of listing | 7 | none | 6, 7 |

The listing runs out, so 6 and 7 stay leaves. Every entry is read once: building takes O(n) time.

## The four traversals

A **traversal** visits every node exactly once. A list has one natural order; a tree has several, and choosing the right one is half of most tree problems.

The three **depth-first** traversals all follow the same recursive plan — handle the left subtree completely, handle the right subtree completely — and differ only in *when* they visit the node itself:

- **Preorder**: the node, then its left subtree, then its right subtree.
- **Inorder**: the left subtree, then the node, then the right subtree.
- **Postorder**: the left subtree, then the right subtree, then the node.

The fourth, **level order**, is breadth-first: all of level 0, then all of level 1, and so on, left to right within each level.

A picture makes the three depth-first orders easy to remember. Walk around the outside of the tree, starting above the root and going down its left side, keeping the tree on your left hand side. You pass every node three times: once on its left (before its left subtree), once underneath it (between its subtrees) and once on its right (after both). Preorder writes a node down at the first pass, inorder at the second and postorder at the third.

The figure below runs an inorder traversal. Its tree happens to be a binary search tree, the subject of the next lesson; for now, ignore the values and watch the order of the visits and the call stack, which holds exactly the nodes whose left subtree is still being visited.

@walkthrough

### Dry run

Preorder on our tree: visit 1, go left to 2 and visit it, go left to 4 and visit it. 4 has no children, so return to 2 and go right to 5: visit 5, go left to 7 and visit it. The subtree of 2 is finished, so return to 1 and go right to 3: visit 3, find no left child, go right to 6 and visit it.

The other two depth-first orders follow the same walk and only write the node down at a different moment. Level order uses a queue: take a node from the front, write it down, put its children at the back.

| Step | Taken from the queue | Queue afterwards | Written so far |
| --- | --- | --- | --- |
| 1 | 1 | 2, 3 | 1 |
| 2 | 2 | 3, 4, 5 | 1 2 |
| 3 | 3 | 4, 5, 6 | 1 2 3 |
| 4 | 4 | 5, 6 | 1 2 3 4 |
| 5 | 5 | 6, 7 | 1 2 3 4 5 |
| 6 | 6 | 7 | 1 2 3 4 5 6 |
| 7 | 7 | empty | 1 2 3 4 5 6 7 |

The queue is what keeps the levels apart. When a node of depth d is taken, its children (depth d + 1) join the back, behind every remaining node of depth d, so no deeper node can be visited before its whole level is done. All four orders side by side:

| Traversal | Order on our tree | Typical use |
| --- | --- | --- |
| Preorder | 1 2 4 5 7 3 6 | Copying or saving a tree: a parent comes before its children, so it can be rebuilt in the same order. Passing a value down, such as a node's depth. |
| Inorder | 4 2 7 5 1 3 6 | A binary search tree's values in sorted order. |
| Postorder | 4 7 5 2 6 3 1 | Anything computed from the children: sizes, heights, freeing memory, evaluating an expression tree. |
| Level order | 1 2 3 4 5 6 7 | Questions about levels: the shallowest leaf, the width of each level, the view from one side. |

## Ask the children, combine the answers

Here is the pattern that solves most tree problems. To compute something about a tree, ask each child's subtree for its answer, then combine those answers with the node's own value. The height of a node is one more than the larger height of its children. The size of a subtree is one plus the sizes of its children's subtrees. The sum, the largest value, the number of leaves: all the same shape.

```text
height(node):
    if node is empty: return -1          # so that a leaf gets 1 + max(-1, -1) = 0
    return 1 + max(height(node.left), height(node.right))

size(node):
    if node is empty: return 0
    return 1 + size(node.left) + size(node.right)
```

Why is it safe to trust the recursive calls? Because each one is about a **smaller** tree, and the chain of smaller and smaller trees always ends at the empty tree, whose answer is written down directly. If the answer is right for every smaller tree, the combining line makes it right for this one — the same reasoning as a proof by induction, and the reason [recursion](/roadmap/recursion) and trees fit together so naturally. When you write a tree function, do not trace every call in your head. Decide what the function returns for an empty tree, then decide how to build a node's answer from its children's answers, and you are done.

Notice that `height` and `size` finish a node only after both children have finished: they are postorder computations. Information can also flow the other way. A node's **depth** depends on its parent, not its children, so it is passed **down** as a parameter, in preorder. A useful rule: what flows down is a parameter, what flows up is a return value.

### Dry run

The calls of `height` finish in postorder, so this table lists the nodes in the order their answers become known:

| Node | height(left) | height(right) | height(node) |
| --- | --- | --- | --- |
| 4 | −1 (empty) | −1 (empty) | 0 |
| 7 | −1 | −1 | 0 |
| 5 | 0 (node 7) | −1 | 1 |
| 2 | 0 (node 4) | 1 (node 5) | 2 |
| 6 | −1 | −1 | 0 |
| 3 | −1 | 0 (node 6) | 1 |
| 1 | 2 (node 2) | 1 (node 3) | 3 |

### The code

The program builds the example tree from its level-order listing, prints the four traversals, and computes the height and the size by asking the children.

```cpp
#include <algorithm>
#include <iostream>
#include <optional>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : val(v) {}
};

// Builds a tree from its level-order listing; nullopt marks a missing child.
Node* build(const vector<optional<int>>& arr) {
    if (arr.empty() || !arr[0]) return nullptr;
    Node* root = new Node(*arr[0]);
    queue<Node*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < arr.size()) {
        Node* node = q.front(); q.pop();     // nodes get children in creation order
        if (arr[i]) { node->left = new Node(*arr[i]); q.push(node->left); }
        i++;
        if (i < arr.size() && arr[i]) { node->right = new Node(*arr[i]); q.push(node->right); }
        i++;
    }
    return root;
}

void preorder(Node* n, vector<int>& out) {
    if (!n) return;
    out.push_back(n->val);                   // the node first
    preorder(n->left, out);
    preorder(n->right, out);
}

void inorder(Node* n, vector<int>& out) {
    if (!n) return;
    inorder(n->left, out);
    out.push_back(n->val);                   // the node between its subtrees
    inorder(n->right, out);
}

void postorder(Node* n, vector<int>& out) {
    if (!n) return;
    postorder(n->left, out);
    postorder(n->right, out);
    out.push_back(n->val);                   // the node after both subtrees
}

vector<int> levelOrder(Node* root) {
    vector<int> out;
    queue<Node*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        Node* n = q.front(); q.pop();
        out.push_back(n->val);
        if (n->left) q.push(n->left);        // children wait behind the rest of this level
        if (n->right) q.push(n->right);
    }
    return out;
}

// Ask the children, combine the answers.
int height(Node* n) { return n ? 1 + max(height(n->left), height(n->right)) : -1; }
int treeSize(Node* n) { return n ? 1 + treeSize(n->left) + treeSize(n->right) : 0; }

void print(const string& label, const vector<int>& values) {
    cout << label << ":";
    for (int v : values) cout << " " << v;
    cout << "\n";
}

int main() {
    Node* root = build({1, 2, 3, 4, 5, nullopt, 6, nullopt, nullopt, 7});
    vector<int> preList, inList, postList;
    preorder(root, preList);
    inorder(root, inList);
    postorder(root, postList);
    print("Preorder", preList);
    print("Inorder", inList);
    print("Postorder", postList);
    print("Level order", levelOrder(root));
    cout << "Height: " << height(root) << "\n";
    cout << "Size: " << treeSize(root) << "\n";
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    // Builds a tree from its level-order listing; null marks a missing child.
    static Node build(Integer[] arr) {
        if (arr.length == 0 || arr[0] == null) return null;
        Node root = new Node(arr[0]);
        Queue<Node> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.length) {
            Node node = q.poll();                // nodes get children in creation order
            if (arr[i] != null) { node.left = new Node(arr[i]); q.add(node.left); }
            i++;
            if (i < arr.length && arr[i] != null) { node.right = new Node(arr[i]); q.add(node.right); }
            i++;
        }
        return root;
    }

    static void preorder(Node n, List<Integer> out) {
        if (n == null) return;
        out.add(n.val);                          // the node first
        preorder(n.left, out);
        preorder(n.right, out);
    }

    static void inorder(Node n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);                          // the node between its subtrees
        inorder(n.right, out);
    }

    static void postorder(Node n, List<Integer> out) {
        if (n == null) return;
        postorder(n.left, out);
        postorder(n.right, out);
        out.add(n.val);                          // the node after both subtrees
    }

    static List<Integer> levelOrder(Node root) {
        List<Integer> out = new ArrayList<>();
        Queue<Node> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            Node n = q.poll();
            out.add(n.val);
            if (n.left != null) q.add(n.left);   // children wait behind the rest of this level
            if (n.right != null) q.add(n.right);
        }
        return out;
    }

    // Ask the children, combine the answers.
    static int height(Node n) { return n == null ? -1 : 1 + Math.max(height(n.left), height(n.right)); }
    static int treeSize(Node n) { return n == null ? 0 : 1 + treeSize(n.left) + treeSize(n.right); }

    static void print(String label, List<Integer> values) {
        StringBuilder line = new StringBuilder(label + ":");
        for (int v : values) line.append(" ").append(v);
        System.out.println(line);
    }

    public static void main(String[] args) {
        Node root = build(new Integer[] {1, 2, 3, 4, 5, null, 6, null, null, 7});
        List<Integer> preList = new ArrayList<>(), inList = new ArrayList<>(), postList = new ArrayList<>();
        preorder(root, preList);
        inorder(root, inList);
        postorder(root, postList);
        print("Preorder", preList);
        print("Inorder", inList);
        print("Postorder", postList);
        print("Level order", levelOrder(root));
        System.out.println("Height: " + height(root));
        System.out.println("Size: " + treeSize(root));
    }
}
```

```python
from collections import deque


class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def build(arr):
    """Build a tree from its level-order listing; None marks a missing child."""
    if not arr or arr[0] is None:
        return None
    root = Node(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()                   # nodes get children in creation order
        if arr[i] is not None:
            node.left = Node(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = Node(arr[i])
            q.append(node.right)
        i += 1
    return root


def preorder(n, out):
    if n is not None:
        out.append(n.val)                    # the node first
        preorder(n.left, out)
        preorder(n.right, out)


def inorder(n, out):
    if n is not None:
        inorder(n.left, out)
        out.append(n.val)                    # the node between its subtrees
        inorder(n.right, out)


def postorder(n, out):
    if n is not None:
        postorder(n.left, out)
        postorder(n.right, out)
        out.append(n.val)                    # the node after both subtrees


def level_order(root):
    out = []
    q = deque([root] if root is not None else [])
    while q:
        n = q.popleft()
        out.append(n.val)
        if n.left is not None:               # children wait behind the rest of this level
            q.append(n.left)
        if n.right is not None:
            q.append(n.right)
    return out


# Ask the children, combine the answers.
def height(n):
    return -1 if n is None else 1 + max(height(n.left), height(n.right))


def tree_size(n):
    return 0 if n is None else 1 + tree_size(n.left) + tree_size(n.right)


root = build([1, 2, 3, 4, 5, None, 6, None, None, 7])
pre_list, in_list, post_list = [], [], []
preorder(root, pre_list)
inorder(root, in_list)
postorder(root, post_list)
print("Preorder:", *pre_list)
print("Inorder:", *in_list)
print("Postorder:", *post_list)
print("Level order:", *level_order(root))
print("Height:", height(root))
print("Size:", tree_size(root))
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Builds a tree from its level-order listing; null marks a missing child.
function build(arr) {
  if (arr.length === 0 || arr[0] === null) return null;
  const root = new Node(arr[0]);
  const q = [root];
  let head = 0; // index of the queue's front: shift() would cost O(n)
  let i = 1;
  while (head < q.length && i < arr.length) {
    const node = q[head++]; // nodes get children in creation order
    if (arr[i] !== null) { node.left = new Node(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new Node(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
}

function preorder(n, out) {
  if (n === null) return;
  out.push(n.val); // the node first
  preorder(n.left, out);
  preorder(n.right, out);
}

function inorder(n, out) {
  if (n === null) return;
  inorder(n.left, out);
  out.push(n.val); // the node between its subtrees
  inorder(n.right, out);
}

function postorder(n, out) {
  if (n === null) return;
  postorder(n.left, out);
  postorder(n.right, out);
  out.push(n.val); // the node after both subtrees
}

function levelOrder(root) {
  const out = [];
  const q = root === null ? [] : [root];
  for (let head = 0; head < q.length; head++) {
    const n = q[head];
    out.push(n.val);
    if (n.left !== null) q.push(n.left); // children wait behind the rest of this level
    if (n.right !== null) q.push(n.right);
  }
  return out;
}

// Ask the children, combine the answers.
const height = (n) => (n === null ? -1 : 1 + Math.max(height(n.left), height(n.right)));
const treeSize = (n) => (n === null ? 0 : 1 + treeSize(n.left) + treeSize(n.right));

const show = (label, values) => console.log(`${label}: ${values.join(" ")}`);

const root = build([1, 2, 3, 4, 5, null, 6, null, null, 7]);
const preList = [], inList = [], postList = [];
preorder(root, preList);
inorder(root, inList);
postorder(root, postList);
show("Preorder", preList);
show("Inorder", inList);
show("Postorder", postList);
show("Level order", levelOrder(root));
console.log(`Height: ${height(root)}`);
console.log(`Size: ${treeSize(root)}`);
```

```output
Preorder: 1 2 4 5 7 3 6
Inorder: 4 2 7 5 1 3 6
Postorder: 4 7 5 2 6 3 1
Level order: 1 2 3 4 5 6 7
Height: 3
Size: 7
```

## Traversals without recursion

Recursion uses the call stack, one frame per node on the current path, so its depth equals the height of the tree. On a balanced tree that is tiny. On a tree that has degenerated into a chain of 100,000 nodes it is 100,000 frames: Python stops at its default limit of 1,000, and C++, Java and JavaScript can run out of stack space well before 100,000. The cure is to keep the stack yourself.

For **inorder**, look at what the recursive version's call stack holds: the nodes whose left subtree is still being visited. Make that explicit. Go left from the current node as far as you can, pushing each node on the way. When you can go no further, pop a node: its left subtree is finished, so visit it, then move to its right subtree and repeat. Preorder is the same loop with the visit moved to the moment a node is pushed.

| Step | Action | Stack (bottom to top) | Visited |
| --- | --- | --- | --- |
| 1 | push 1, 2, 4 going left | 1, 2, 4 | |
| 2 | pop 4, visit, no right child | 1, 2 | 4 |
| 3 | pop 2, visit, go right: push 5, 7 | 1, 5, 7 | 4 2 |
| 4 | pop 7, visit | 1, 5 | 4 2 7 |
| 5 | pop 5, visit | 1 | 4 2 7 5 |
| 6 | pop 1, visit, go right: push 3 | 3 | 4 2 7 5 1 |
| 7 | pop 3, visit, go right: push 6 | 6 | 4 2 7 5 1 3 |
| 8 | pop 6, visit; stack empty, done | empty | 4 2 7 5 1 3 6 |

Level order is already iterative, but many problems want the levels kept apart — the values of each level as their own list. The trick is to read the queue's length at the start of a level: at that moment the queue holds exactly that level's nodes, so take that many, and everything added meanwhile belongs to the next level.

```cpp
#include <iostream>
#include <optional>
#include <queue>
#include <stack>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : val(v) {}
};

Node* build(const vector<optional<int>>& arr) {
    if (arr.empty() || !arr[0]) return nullptr;
    Node* root = new Node(*arr[0]);
    queue<Node*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < arr.size()) {
        Node* node = q.front(); q.pop();
        if (arr[i]) { node->left = new Node(*arr[i]); q.push(node->left); }
        i++;
        if (i < arr.size() && arr[i]) { node->right = new Node(*arr[i]); q.push(node->right); }
        i++;
    }
    return root;
}

vector<int> inorderIterative(Node* root) {
    vector<int> out;
    stack<Node*> st;
    Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) {                 // go left as far as possible, keeping the path
            st.push(cur);
            cur = cur->left;
        }
        cur = st.top(); st.pop();     // its left subtree is finished
        out.push_back(cur->val);
        cur = cur->right;             // now its right subtree
    }
    return out;
}

vector<vector<int>> levels(Node* root) {
    vector<vector<int>> out;
    queue<Node*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int width = q.size();         // exactly the nodes of the current level
        vector<int> level;
        for (int k = 0; k < width; k++) {
            Node* n = q.front(); q.pop();
            level.push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        out.push_back(level);
    }
    return out;
}

int main() {
    Node* root = build({1, 2, 3, 4, 5, nullopt, 6, nullopt, nullopt, 7});
    cout << "Inorder with a stack:";
    for (int v : inorderIterative(root)) cout << " " << v;
    cout << "\n";
    vector<vector<int>> byLevel = levels(root);
    for (size_t d = 0; d < byLevel.size(); d++) {
        cout << "Level " << d << ":";
        for (int v : byLevel[d]) cout << " " << v;
        cout << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Queue;

public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    static Node build(Integer[] arr) {
        if (arr.length == 0 || arr[0] == null) return null;
        Node root = new Node(arr[0]);
        Queue<Node> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.length) {
            Node node = q.poll();
            if (arr[i] != null) { node.left = new Node(arr[i]); q.add(node.left); }
            i++;
            if (i < arr.length && arr[i] != null) { node.right = new Node(arr[i]); q.add(node.right); }
            i++;
        }
        return root;
    }

    static List<Integer> inorderIterative(Node root) {
        List<Integer> out = new ArrayList<>();
        Deque<Node> st = new ArrayDeque<>();
        Node cur = root;
        while (cur != null || !st.isEmpty()) {
            while (cur != null) {         // go left as far as possible, keeping the path
                st.push(cur);
                cur = cur.left;
            }
            cur = st.pop();               // its left subtree is finished
            out.add(cur.val);
            cur = cur.right;              // now its right subtree
        }
        return out;
    }

    static List<List<Integer>> levels(Node root) {
        List<List<Integer>> out = new ArrayList<>();
        Queue<Node> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            int width = q.size();         // exactly the nodes of the current level
            List<Integer> level = new ArrayList<>();
            for (int k = 0; k < width; k++) {
                Node n = q.poll();
                level.add(n.val);
                if (n.left != null) q.add(n.left);
                if (n.right != null) q.add(n.right);
            }
            out.add(level);
        }
        return out;
    }

    public static void main(String[] args) {
        Node root = build(new Integer[] {1, 2, 3, 4, 5, null, 6, null, null, 7});
        StringBuilder line = new StringBuilder("Inorder with a stack:");
        for (int v : inorderIterative(root)) line.append(" ").append(v);
        System.out.println(line);
        List<List<Integer>> byLevel = levels(root);
        for (int d = 0; d < byLevel.size(); d++) {
            StringBuilder row = new StringBuilder("Level " + d + ":");
            for (int v : byLevel.get(d)) row.append(" ").append(v);
            System.out.println(row);
        }
    }
}
```

```python
from collections import deque


class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def build(arr):
    if not arr or arr[0] is None:
        return None
    root = Node(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if arr[i] is not None:
            node.left = Node(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = Node(arr[i])
            q.append(node.right)
        i += 1
    return root


def inorder_iterative(root):
    out = []
    stack = []
    cur = root
    while cur is not None or stack:
        while cur is not None:        # go left as far as possible, keeping the path
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()             # its left subtree is finished
        out.append(cur.val)
        cur = cur.right               # now its right subtree
    return out


def levels(root):
    out = []
    q = deque([root] if root is not None else [])
    while q:
        width = len(q)                # exactly the nodes of the current level
        level = []
        for _ in range(width):
            n = q.popleft()
            level.append(n.val)
            if n.left is not None:
                q.append(n.left)
            if n.right is not None:
                q.append(n.right)
        out.append(level)
    return out


root = build([1, 2, 3, 4, 5, None, 6, None, None, 7])
print("Inorder with a stack:", *inorder_iterative(root))
for d, level in enumerate(levels(root)):
    print(f"Level {d}:", *level)
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function build(arr) {
  if (arr.length === 0 || arr[0] === null) return null;
  const root = new Node(arr[0]);
  const q = [root];
  let head = 0;
  let i = 1;
  while (head < q.length && i < arr.length) {
    const node = q[head++];
    if (arr[i] !== null) { node.left = new Node(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new Node(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
}

function inorderIterative(root) {
  const out = [];
  const stack = [];
  let cur = root;
  while (cur !== null || stack.length > 0) {
    while (cur !== null) { // go left as far as possible, keeping the path
      stack.push(cur);
      cur = cur.left;
    }
    cur = stack.pop(); // its left subtree is finished
    out.push(cur.val);
    cur = cur.right; // now its right subtree
  }
  return out;
}

function levels(root) {
  const out = [];
  let level = root === null ? [] : [root];
  while (level.length > 0) { // the whole current level, nothing else
    out.push(level.map((n) => n.val));
    const next = [];
    for (const n of level) {
      if (n.left !== null) next.push(n.left);
      if (n.right !== null) next.push(n.right);
    }
    level = next;
  }
  return out;
}

const root = build([1, 2, 3, 4, 5, null, 6, null, null, 7]);
console.log(`Inorder with a stack: ${inorderIterative(root).join(" ")}`);
levels(root).forEach((values, d) => console.log(`Level ${d}: ${values.join(" ")}`));
```

```output
Inorder with a stack: 4 2 7 5 1 3 6
Level 0: 1
Level 1: 2 3
Level 2: 4 5 6
Level 3: 7
```

The JavaScript version keeps each level in its own array instead of reading a queue's length, because JavaScript has no built-in queue and `shift()` on an array costs O(n). The idea is the same: a level is finished before the next one starts.

## Trees given as a parent array or an edge list

Most tree problems in the catalogue never hand you node objects. [Count Nodes With the Highest Score](/problems/count-nodes-with-the-highest-score) gives `parents`, where `parents[i]` is the parent of node `i` and the root has −1. [Minimum Fuel Cost to Report to the Capital](/problems/minimum-fuel-cost-to-report-to-the-capital) gives a list of roads. The tree is the same idea; only the storage differs.

From a parent array, build a list of children for every node in one pass: for each node `i` other than the root, add `i` to `children[parents[i]]`. Then the recursive pattern works unchanged, looping over a node's children instead of looking at `left` and `right`. From an undirected edge list, build adjacency lists instead and pass each call the node it came from, so that it never walks back up to its parent — that is the one new rule, and forgetting it makes the recursion go round in circles. This is ordinary [depth-first search](/roadmap/depth-first-search) on a graph with no cycles.

The program below takes `parents = [-1, 0, 0, 1, 1, 2, 4]`, a tree of 7 nodes rooted at 0, and computes two things in one walk: each node's depth, which flows **down** as a parameter, and each node's subtree size, which flows **up** as the return value.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> children;
vector<int> depthOf, sizeOf;

// Depth flows down as a parameter; size flows up as the return value.
int dfs(int node, int depth) {
    depthOf[node] = depth;
    int size = 1;                                    // the node itself
    for (int child : children[node]) size += dfs(child, depth + 1);
    sizeOf[node] = size;
    return size;
}

int main() {
    vector<int> parents = {-1, 0, 0, 1, 1, 2, 4};
    int n = parents.size();
    children.assign(n, vector<int>());
    depthOf.assign(n, 0);
    sizeOf.assign(n, 0);
    int root = -1;
    for (int i = 0; i < n; i++) {
        if (parents[i] == -1) root = i;
        else children[parents[i]].push_back(i);      // one pass turns parents into children
    }
    dfs(root, 0);
    for (int i = 0; i < n; i++)
        cout << "node " << i << ": depth " << depthOf[i] << ", subtree size " << sizeOf[i] << "\n";
    cout << "Height: " << *max_element(depthOf.begin(), depthOf.end()) << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static List<List<Integer>> children = new ArrayList<>();
    static int[] depthOf, sizeOf;

    // Depth flows down as a parameter; size flows up as the return value.
    static int dfs(int node, int depth) {
        depthOf[node] = depth;
        int size = 1;                                // the node itself
        for (int child : children.get(node)) size += dfs(child, depth + 1);
        sizeOf[node] = size;
        return size;
    }

    public static void main(String[] args) {
        int[] parents = {-1, 0, 0, 1, 1, 2, 4};
        int n = parents.length;
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        depthOf = new int[n];
        sizeOf = new int[n];
        int root = -1;
        for (int i = 0; i < n; i++) {
            if (parents[i] == -1) root = i;
            else children.get(parents[i]).add(i);    // one pass turns parents into children
        }
        dfs(root, 0);
        int height = 0;
        for (int i = 0; i < n; i++) {
            System.out.println("node " + i + ": depth " + depthOf[i] + ", subtree size " + sizeOf[i]);
            height = Math.max(height, depthOf[i]);
        }
        System.out.println("Height: " + height);
    }
}
```

```python
parents = [-1, 0, 0, 1, 1, 2, 4]
n = len(parents)
children = [[] for _ in range(n)]
depth_of = [0] * n
size_of = [0] * n
root = -1
for i in range(n):
    if parents[i] == -1:
        root = i
    else:
        children[parents[i]].append(i)   # one pass turns parents into children


def dfs(node, depth):
    """Depth flows down as a parameter; size flows up as the return value."""
    depth_of[node] = depth
    size = 1                             # the node itself
    for child in children[node]:
        size += dfs(child, depth + 1)
    size_of[node] = size
    return size


dfs(root, 0)
for i in range(n):
    print(f"node {i}: depth {depth_of[i]}, subtree size {size_of[i]}")
print("Height:", max(depth_of))
```

```javascript
const parents = [-1, 0, 0, 1, 1, 2, 4];
const n = parents.length;
const children = Array.from({ length: n }, () => []);
const depthOf = new Array(n).fill(0);
const sizeOf = new Array(n).fill(0);
let root = -1;
for (let i = 0; i < n; i++) {
  if (parents[i] === -1) root = i;
  else children[parents[i]].push(i); // one pass turns parents into children
}

// Depth flows down as a parameter; size flows up as the return value.
function dfs(node, depth) {
  depthOf[node] = depth;
  let size = 1; // the node itself
  for (const child of children[node]) size += dfs(child, depth + 1);
  sizeOf[node] = size;
  return size;
}

dfs(root, 0);
for (let i = 0; i < n; i++) console.log(`node ${i}: depth ${depthOf[i]}, subtree size ${sizeOf[i]}`);
console.log(`Height: ${Math.max(...depthOf)}`);
```

```output
node 0: depth 0, subtree size 7
node 1: depth 1, subtree size 4
node 2: depth 1, subtree size 2
node 3: depth 2, subtree size 1
node 4: depth 2, subtree size 2
node 5: depth 2, subtree size 1
node 6: depth 3, subtree size 1
Height: 3
```

With subtree sizes in hand, Count Nodes With the Highest Score is one more line: removing a node leaves its children's subtrees and the rest of the tree, n − size(node) nodes, so the node's score is the product of those sizes. [Time Needed to Inform All Employees](/problems/time-needed-to-inform-all-employees) passes a running time down instead of a depth.

## Full, complete, perfect and balanced trees

Interviewers use these words precisely, and each matters somewhere later on the road:

- A **full** binary tree: every node has zero or two children, never one. Expression trees are full: every operator has two operands.
- A **complete** binary tree: every level is full except possibly the last, and the last is filled from the left with no gaps. This is the shape of a heap, and it is what lets a heap live in an array with no wasted slots.
- A **perfect** binary tree: every internal node has two children and every leaf is at the same depth. A perfect tree of height h has exactly 2ʰ⁺¹ − 1 nodes.
- A **balanced** binary tree: for every node, the heights of its two subtrees differ by at most 1. Balance guarantees a height of O(log n), which is what keeps root-to-leaf walks cheap.
- A **degenerate** or skewed tree: every node has one child. It is a linked list in disguise, with height n − 1.

Our example tree is not full (3 and 5 have one child each), not complete (level 2 has a gap — 3 has no left child — with 6 to the right of it) and not perfect, but it is balanced: at every node the two subtree heights differ by at most 1. Checking balance is itself an "ask the children" problem, as long as each call returns its height together with its verdict — calling a separate `height` at every node would cost up to O(n²).

## Time and space complexity

| Operation | Time | Extra space |
| --- | --- | --- |
| Build from a level-order listing | O(n) | O(n) for the queue |
| Preorder, inorder, postorder (recursive or with a stack) | O(n) | O(h): O(log n) balanced, O(n) for a chain |
| Level order | O(n) | O(w), w the widest level: up to about n / 2 |
| Height, size, sum, any "ask the children" value | O(n) | O(h) |
| Find a value in a plain binary tree | O(n) | O(h) |

Every node is visited once with constant work, so all of these are linear. The last row is worth noticing: a plain binary tree has no order, so finding a value means looking everywhere. Putting the values in order is what the [binary search tree](/roadmap/binary-search-tree) adds, and it turns that row into O(h).

## How to recognise a tree problem

- The statement talks about a **hierarchy**: a manager and employees, a capital and roads leading to it, a parent and children, folders, a root.
- The input has **n nodes and n − 1 edges** and is connected, or it is a parent array. Both mean a tree, even when the word is not used.
- You need something **for every subtree**: its size, its sum, the number of nodes with some label. That is postorder — ask the children, combine.
- Something accumulates **along the path from the root**: a depth, a running time, a cost. That is a parameter passed down, in preorder.
- The question mentions **levels**, the shallowest or nearest node, or the view from one side. That is level order, [breadth-first search](/roadmap/breadth-first-search) on a tree.

## Common mistakes

- **Forgetting the empty-tree case.** Every recursive tree function starts with "if the node is empty, return …". Without it the code reads a field of a null reference on the first leaf.
- **Mixing the two height conventions.** Decide whether you count edges (an empty tree is −1, a leaf 0) or nodes (an empty tree is 0, a leaf 1), and check which the problem's examples use.
- **Walking back to the parent.** In an undirected edge list, the parent is also a neighbour. Pass the parent into each call and skip it, or the recursion never ends.
- **Deep recursion on a chain.** A tree of 10⁵ nodes can be a single path. In Python, raise the limit with `sys.setrecursionlimit` or write the walk with your own stack; in other languages, prefer the iterative form when the height can be that large.
- **Recomputing instead of returning.** Calling `height` from inside another recursive function at every node turns O(n) into as much as O(n²) on a deep tree. Return everything a parent needs from one call, for example the height and a balanced flag together.
- **A slow queue.** `list.pop(0)` in Python and `shift()` in JavaScript move every element. Use `collections.deque`, or a head index into an array.

## Practice in this order

The catalogue gives its trees as parent arrays and edge lists, so these problems also practise the conversion from the section above:

1. [Reachable Nodes With Restrictions](/problems/reachable-nodes-with-restrictions): a plain traversal from the root that skips forbidden nodes.
2. [Time Needed to Inform All Employees](/problems/time-needed-to-inform-all-employees): a parent array, and a time passed down each path.
3. [Count Nodes With the Highest Score](/problems/count-nodes-with-the-highest-score): a true binary tree, and subtree sizes combined into a product.
4. [Number of Nodes in the Sub-Tree With the Same Label](/problems/number-of-nodes-in-the-sub-tree-with-the-same-label): each child returns a count per letter, and the parent adds them up.
5. [Minimum Fuel Cost to Report to the Capital](/problems/minimum-fuel-cost-to-report-to-the-capital): subtree sizes decide how many cars cross each road.
6. [Graph Valid Tree](/problems/graph-valid-tree): what makes a graph a tree — n − 1 edges and connected.
7. [Minimum Height Trees](/problems/minimum-height-trees): heights from every possible root, found by peeling leaves level by level.
8. [Longest Path With Different Adjacent Characters](/problems/longest-path-with-different-adjacent-characters): each node combines its two best children, the shape of every "diameter" problem.
9. [Sum of Distances in Tree](/problems/sum-of-distances-in-tree): two passes, one up and one down, to get an answer for every root.

The [trees problem list](/challenges/trees) has every tree problem in the catalogue. Next on the road is the [binary search tree](/roadmap/binary-search-tree), which adds one ordering rule to the structure you have just learned and turns an O(n) search into a single walk down one path.

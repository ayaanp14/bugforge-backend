---
title: Binary Trees and Tree Traversals
stage: heaps
order: 1
minutes: 13
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
Arrays, linked lists, stacks and queues are **linear**: each element has at most one after it. A lot of data is not shaped like that: a company's managers and teams, folders inside folders, an expression such as (2 + 3) × 4. These are **trees**: one item at the top, every other item hanging below exactly one parent. In a **binary tree** each node has at most two children, a left and a right. It is the tree interviews ask about most, and the shape underneath the [binary search tree](/roadmap/binary-search-tree), the [heap](/roadmap/heap) and the [trie](/roadmap/trie).

## Why a tree and not a list

Finding one item in a list of a million can take a million steps. A tree whose levels are full doubles at every level — 1, 2, 4, 8 nodes — so twenty levels already hold more than a million (2²⁰ = 1,048,576). Anything that walks **one path from the root to a leaf** then costs about 20 steps, as long as the tree stays bushy rather than stringy. That is why search trees, heaps and tries exist; and when the data is a hierarchy anyway, the tree is simply its honest shape.

## The parts of a tree

Every example in this lesson uses the same seven-node tree:

@figure vocabulary

This lesson counts height in **edges**, as textbooks do: a leaf has height 0 and an empty tree −1. Many problems, such as "maximum depth of a binary tree", count nodes instead and give this tree a depth of 4. Check the examples.

## How a binary tree is stored

A **node** holds a value and two references, `left` and `right`, each pointing at a child or at nothing — a [linked list](/roadmap/linked-list) with two "next" pointers. Problems hand you a tree as linked nodes, as a **parent array or edge list** (most of the catalogue, see below), or as a **level-order listing** with `null` for each missing child: `[1, 2, 3, 4, 5, null, 6, null, null, 7]` is the tree above. Nodes receive their children in the order they were created, so a [queue](/roadmap/queue) builds it:

@figure build

A tree with no gaps can even live in a plain array with no pointers at all: that is the heap's trick.

## The four traversals

A **traversal** visits every node once, and choosing the right order is half of most tree problems. The three **depth-first** orders finish the left subtree, then the right, and differ only in *when* they visit the node: **preorder** before both subtrees, **inorder** between them, **postorder** after both. One walk round the tree gives all three:

@figure one-walk

**Level order** is breadth-first, level by level. A queue does it, and the queue is what keeps the levels apart:

@figure level-order

Use preorder when a node hands something down to its children or to copy a tree; inorder for a binary search tree's values in sorted order; postorder when a node's answer depends on its children's; level order for levels and the nearest node to the root.

## Ask the children, combine the answers

Most tree problems are one pattern: ask each child's subtree for its answer, then combine the answers with the node's own value. Height, size, sums and leaf counts all have this shape.

@figure heights

Why trust the recursive calls? Each is about a **smaller** tree, and the shrinking always ends at the empty tree, whose answer is written down directly. If every smaller tree gets the right answer, the combining line makes this one right too — a proof by induction, and the reason [recursion](/roadmap/recursion) and trees fit so well. So never trace every call: decide what the empty tree returns and how a node combines its children, and you are done. Answers that come from the children flow up as return values, in postorder; a node's **depth** comes from its parent, so it flows down as a parameter, in preorder.

### The code

The program builds the example tree from its listing, prints the four traversals, and computes the height and the size by asking the children.

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

Recursion keeps one call frame per node on the current path. On a chain of 100,000 nodes that is 100,000 frames: Python stops at 1,000 by default, and the other languages can run out of stack. Keep the stack yourself instead:

@figure stack-inorder

Preorder is the same loop, visiting each node as it is pushed; the [binary search tree](/roadmap/binary-search-tree) lesson's `kthSmallest` is this loop in all four languages. To get level order one level at a time, read the queue's length when a level starts and take exactly that many nodes.

## Trees given as a parent array or an edge list

Most catalogue problems never hand you node objects. [Count Nodes With the Highest Score](/problems/count-nodes-with-the-highest-score) gives `parents`, with −1 for the root; [Minimum Fuel Cost to Report to the Capital](/problems/minimum-fuel-cost-to-report-to-the-capital) gives roads. Build **children lists** in one pass and the pattern works unchanged:

@figure parent-array

From an undirected edge list, build adjacency lists and pass each call the node it came from, so it never walks back up — this is [depth-first search](/roadmap/depth-first-search) on a graph without cycles. The program computes both directions in one walk:

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

With sizes known, a node's score in Count Nodes With the Highest Score is the product of its children's sizes and n − size(node), the rest of the tree.

## Full, complete, perfect and balanced trees

Interviewers use these four words precisely:

@figure shapes

A **balanced** tree keeps walks cheap: at every node the two subtree heights differ by at most 1, which guarantees O(log n) height. The example tree is balanced. Checking it is an "ask the children" problem if each call returns its height with its verdict; calling `height` separately at every node costs up to O(n²).

## Time and space complexity

| Operation | Time | Extra space |
| --- | --- | --- |
| Build from a level-order listing | O(n) | O(n) for the queue |
| Preorder, inorder, postorder | O(n) | O(h): O(log n) balanced, O(n) for a chain |
| Level order | O(n) | O(w), the widest level |
| Height, size, any "ask the children" value | O(n) | O(h) |
| Find a value in a plain binary tree | O(n) | O(h) |

A plain binary tree has no order, so finding a value means looking everywhere; the [binary search tree](/roadmap/binary-search-tree) adds the order and makes that O(h).

## How to recognise a tree problem

- A **hierarchy**: a manager and employees, a capital and its roads, folders, a root.
- **n nodes and n − 1 edges**, connected, or a parent array: a tree, even unnamed.
- Something **for every subtree** — a size, a sum, a count: postorder.
- Something accumulated **from the root down** — a depth, a time: a parameter, preorder.
- **Levels** or the nearest node: level order, [breadth-first search](/roadmap/breadth-first-search) on a tree.

## Common mistakes

- **No empty-tree case**: every recursive tree function starts with "if the node is empty, return …".
- **Walking back to the parent** in an undirected edge list: pass the parent in and skip it.
- **Deep recursion on a chain**: 10⁵ nodes can be one path; raise Python's limit or keep your own stack.
- **Recomputing instead of returning**: return everything a parent needs from one call.
- **A slow queue**: `list.pop(0)` and `shift()` move every element; use `collections.deque` or a head index.

## Practice in this order

The catalogue gives its trees as parent arrays and edge lists, so these also practise the conversion above:

1. [Reachable Nodes With Restrictions](/problems/reachable-nodes-with-restrictions): a plain traversal that skips forbidden nodes.
2. [Time Needed to Inform All Employees](/problems/time-needed-to-inform-all-employees): a time passed down each path.
3. [Count Nodes With the Highest Score](/problems/count-nodes-with-the-highest-score): subtree sizes combined into a product.
4. [Number of Nodes in the Sub-Tree With the Same Label](/problems/number-of-nodes-in-the-sub-tree-with-the-same-label): each child returns counts per letter.
5. [Minimum Fuel Cost to Report to the Capital](/problems/minimum-fuel-cost-to-report-to-the-capital): subtree sizes decide the cars on each road.
6. [Graph Valid Tree](/problems/graph-valid-tree): n − 1 edges and connected.
7. [Minimum Height Trees](/problems/minimum-height-trees): peeling leaves level by level.
8. [Longest Path With Different Adjacent Characters](/problems/longest-path-with-different-adjacent-characters): each node combines its two best children.
9. [Sum of Distances in Tree](/problems/sum-of-distances-in-tree): one pass up, one down, an answer for every root.

The [trees problem list](/challenges/trees) has every tree problem in the catalogue. Next on the road is the [binary search tree](/roadmap/binary-search-tree), which adds one ordering rule and turns an O(n) search into a walk down one path.

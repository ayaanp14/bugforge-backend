import type { AptitudeSeed } from "./types.js";

/**
 * Core computer science, asked the way placement papers ask it: data
 * structures and algorithms in one half, operating systems, DBMS and computer
 * networks in the other. Every computed answer — a traversal, a partition, an
 * average waiting time, a page-fault count — is worked out step by step.
 */

const GRAPH_ADJ = `| Vertex | Adjacent vertices |
|--------|-------------------|
| A      | B, C              |
| B      | A, D              |
| C      | A, E              |
| D      | B, E              |
| E      | C, D, F           |
| F      | E                 |`;

const BURST_TABLE = `| Process | Burst time |
|---------|------------|
| P1      | 24         |
| P2      | 3          |
| P3      | 3          |`;

const SJF_TABLE = `| Process | Burst time |
|---------|------------|
| P1      | 6          |
| P2      | 8          |
| P3      | 7          |
| P4      | 3          |`;

const SRTF_TABLE = `| Process | Arrival time | Burst time |
|---------|--------------|------------|
| P1      | 0            | 8          |
| P2      | 1            | 4          |
| P3      | 2            | 9          |
| P4      | 3            | 5          |`;

const EMPLOYEE_TABLE = `| emp_id | dept  | salary |
|--------|-------|--------|
| 1      | Sales | 30000  |
| 2      | Sales | 50000  |
| 3      | HR    | 40000  |
| 4      | HR    | 60000  |
| 5      | IT    | 45000  |`;

const MANAGER_TABLE = `| emp_id | name  | manager_id |
|--------|-------|------------|
| 1      | Asha  | NULL       |
| 2      | Ravi  | 1          |
| 3      | Meena | 1          |
| 4      | Sunil | NULL       |
| 5      | Kiran | 2          |`;

const JOIN_TABLES = `**students**

| id | name  |
|----|-------|
| 1  | Asha  |
| 2  | Ravi  |
| 3  | Meena |

**marks**

| student_id | score |
|------------|-------|
| 1          | 80    |
| 1          | 90    |
| 3          | 70    |`;

export const BANK_CORE_CS: AptitudeSeed[] = [
  /* ── Expressions and stacks ────────────────────────────────────── */
  {
    slug: "ds-postfix-evaluate",
    topic: "data-structures-mcq",
    title: "Evaluating a postfix expression",
    prompt:
      "Evaluate the postfix expression `5 6 2 + * 12 4 / -` using the usual stack method.",
    options: ["33", "37", "40", "43"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Push operands; when an operator appears, pop two and push the result.",
      "The second operand popped is the left-hand side of the operation.",
    ],
    solution:
      "1. Push 5, 6 and 2 onto the stack.\n2. `+` pops 2 and 6, computing 6 + 2 = 8. The stack holds 5, 8.\n3. `*` pops 8 and 5, computing 5 × 8 = 40. The stack holds 40.\n4. Push 12 and 4; `/` pops 4 and 12, computing 12 ÷ 4 = 3. The stack holds 40, 3.\n5. `-` pops 3 and 40, computing 40 − 3 = 37.\n\nAnswer: **37**.",
    approach:
      "Postfix needs no brackets because the operator arrives after both of its operands. One left-to-right scan with a stack evaluates it, and the order of popping matters for the non-commutative operators.",
    tags: ["stack", "expression"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-infix-to-postfix",
    topic: "data-structures-mcq",
    title: "Infix to postfix",
    prompt:
      "Convert `A + B * C - D / E` to **postfix**, with `*` and `/` binding tighter than `+` and `-` and all operators left associative.",
    options: ["A B + C * D E / -", "A B C * + D E / -", "A B C * D E / + -", "A B C + * D / E -"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Bracket the expression fully by precedence before converting anything.",
      "Convert each bracketed piece on its own, then join them.",
    ],
    solution:
      "1. Precedence groups the expression as `(A + (B * C)) - (D / E)`.\n2. `B * C` becomes `B C *`.\n3. `A + (B C *)` becomes `A B C * +`.\n4. `D / E` becomes `D E /`.\n5. The outer subtraction places its two postfix operands first and the operator last, giving `A B C * + D E / -`.\n\nAnswer: **A B C * + D E / -**.",
    approach:
      "Fully parenthesising by precedence turns conversion into mechanical work: each bracket becomes operand, operand, operator. It is faster and safer than running the shunting-yard algorithm in your head.",
    tags: ["expression", "conversion"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-prefix-evaluate",
    topic: "data-structures-mcq",
    title: "Evaluating a prefix expression",
    prompt: "Evaluate the prefix expression `+ 9 * 3 - 5 2`.",
    options: ["9", "12", "15", "18"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Prefix expressions are scanned from right to left.",
      "When an operator is met, the first value popped is the left operand.",
    ],
    solution:
      "1. Scanning right to left, push 2 and then 5.\n2. `-` pops 5 and 2, computing 5 − 2 = 3. Push 3.\n3. Push the next operand, 3.\n4. `*` pops 3 and 3, computing 3 × 3 = 9. Push 9.\n5. Push 9, then `+` pops 9 and 9, computing 9 + 9 = 18.\n\nAnswer: **18**.",
    approach:
      "Prefix is postfix read backwards, so the same stack works with the scan reversed and the popping order flipped. The expression is 9 + 3 × (5 − 2).",
    tags: ["stack", "expression"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-stack-permutation",
    topic: "data-structures-mcq",
    title: "An impossible stack output",
    prompt:
      "The numbers 1, 2, 3, 4 are pushed onto a stack in that order, and a pop may be performed at any point. Which output sequence is **impossible**?",
    options: ["1, 4, 3, 2", "2, 4, 3, 1", "3, 1, 2, 4", "4, 3, 2, 1"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Work out what must already be on the stack for the first number of the output to be popped.",
      "Values pushed before the first output are trapped in reverse order.",
    ],
    solution:
      "1. To emit 3 first, the numbers 1, 2 and 3 must all have been pushed, leaving 1 at the bottom with 2 above it.\n2. After popping 3, the top of the stack is 2, so the next pop yields 2, or else a number pushed later.\n3. The sequence demands 1 next, but 1 is buried under 2, so **3, 1, 2, 4** cannot be produced.\n4. The other three are realisable: pushing and popping alternately gives 1, 4, 3, 2 and 2, 4, 3, 1, while pushing everything and then popping gives 4, 3, 2, 1.\n\nAnswer: **3, 1, 2, 4**.",
    approach:
      "A stack output is impossible exactly when some later value is popped before an earlier value that lies above it. Checking what is trapped under the first popped element settles most of these instantly.",
    tags: ["stack", "permutation"],
    timeTargetSec: 120,
  },
  {
    slug: "ds-queue-two-stacks",
    topic: "data-structures-mcq",
    title: "A queue from two stacks",
    prompt:
      "A queue is built from two stacks: `enqueue` pushes onto stack A, and `dequeue` pops from stack B, refilling B by emptying A into it whenever B is empty. What is the **amortised** cost of one dequeue?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "A single dequeue can be slow, but ask how often the slow case can happen.",
      "Count how many times one particular element is touched over its whole lifetime.",
    ],
    solution:
      "1. One dequeue can be expensive: transferring k elements from A to B costs k pops and k pushes.\n2. But an element moves from A to B exactly once, so over its lifetime it is pushed twice and popped twice — a constant amount of work.\n3. Spreading that constant per-element cost across the whole sequence of operations gives an amortised **O(1)** per dequeue.\n\nAnswer: **O(1)**.",
    approach:
      "Amortised analysis charges each element for its own total work instead of pricing the worst single operation. The expensive transfer is paid for by the many cheap enqueues that preceded it.",
    tags: ["stack", "queue", "amortised"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-circular-queue-count",
    topic: "data-structures-mcq",
    title: "Elements in a circular queue",
    prompt:
      "A circular queue occupies an array of **8** slots, with one slot always left empty so that full and empty can be told apart. `front` indexes the first element and `rear` indexes the next free slot. If `front = 4` and `rear = 3`, how many elements does the queue hold?",
    options: ["0", "1", "7", "8"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The count wraps around, so use modular arithmetic rather than a plain subtraction.",
      "With one slot deliberately wasted, the array can never hold all 8 elements.",
    ],
    solution:
      "1. With `rear` pointing at the next free slot, the number of elements is (rear − front + n) mod n.\n2. Substituting the values gives (3 − 4 + 8) mod 8 = 7 mod 8 = 7.\n3. Since one slot is deliberately left empty, 7 is the largest an eight-slot array can hold, so the queue is in fact full.\n\nAnswer: **7**.",
    approach:
      "Adding n before taking the modulus keeps the arithmetic correct when rear has wrapped past front. Leaving one slot unused is the standard trick that makes (rear + 1) mod n == front mean 'full'.",
    tags: ["queue", "circular"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-level-order-structure",
    topic: "data-structures-mcq",
    title: "Structure behind level-order traversal",
    prompt: "Which data structure does a level-order (breadth-first) traversal of a binary tree rely on?",
    options: ["A hash table", "A min-heap", "A queue", "A stack"],
    answer: 2,
    difficulty: "easy",
    hints: [
      "Every node of one level must be visited before any node of the next.",
      "Ask which structure returns items in the order they arrived.",
    ],
    solution:
      "1. Level-order visits all nodes at depth d before any node at depth d + 1.\n2. Removing a node and adding its children keeps that order, because children join behind everything already waiting.\n3. **A queue** is exactly that discipline — first in, first out — whereas a stack would reverse the order and produce a depth-first walk instead.\n\nAnswer: **A queue**.",
    approach:
      "Breadth-first anything — tree levels, shortest paths in an unweighted graph — is a queue. Depth-first anything is a stack, whether explicit or the recursion stack.",
    tags: ["tree", "traversal", "queue"],
    timeTargetSec: 45,
  },

  /* ── Linked lists ──────────────────────────────────────────────── */
  {
    slug: "ds-singly-list-o1-operation",
    topic: "data-structures-mcq",
    title: "Constant-time list operation",
    prompt: "A singly linked list is kept with **only a head pointer**. Which operation runs in O(1) time?",
    options: [
      "Deleting the last node",
      "Inserting a node at the front",
      "Inserting a node at the end",
      "Searching for a given value",
    ],
    answer: 1,
    difficulty: "easy",
    hints: [
      "The head pointer gives direct access to exactly one node.",
      "Anything that needs the last node, or its predecessor, costs a walk.",
    ],
    solution:
      "1. The head pointer reaches the first node immediately and nothing else.\n2. **Inserting a node at the front** means pointing the new node at the old head and moving the head — two assignments, whatever the length.\n3. Reaching the last node, its predecessor, or a searched value all require walking the list, which is O(n).\n\nAnswer: **Inserting a node at the front**.",
    approach:
      "Cost in a linked structure is the number of links you must follow. Keeping a tail pointer as well would make end insertion constant too, but end deletion would still need the predecessor.",
    tags: ["linked list", "complexity"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-dll-insert-pointers",
    topic: "data-structures-mcq",
    title: "Pointer updates in a doubly linked list",
    prompt:
      "A new node is inserted **between two existing nodes** of a doubly linked list. How many pointer fields have to be assigned?",
    options: ["1", "2", "3", "4"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Count the links the new node itself needs first.",
      "Both neighbours also have to be told about the newcomer.",
    ],
    solution:
      "1. The new node needs two links of its own: one to its predecessor and one to its successor.\n2. The predecessor's `next` pointer must be redirected to the new node.\n3. The successor's `prev` pointer must be redirected to the new node.\n4. That is 2 + 1 + 1 = 4 pointer assignments in total.\n\nAnswer: **4**.",
    approach:
      "Every doubly linked splice touches four fields on insertion and two on deletion — a favourite way of separating candidates who have written the code from those who have only read about it.",
    tags: ["linked list", "doubly"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-circular-list-tail-pointer",
    topic: "data-structures-mcq",
    title: "Circular list with a tail pointer",
    prompt:
      "A circular singly linked list is kept with a single pointer to its **last** node. Which insertions are possible in O(1) time?",
    options: [
      "At the front only",
      "At the end only",
      "Both at the front and at the end",
      "Neither, since both need a traversal",
    ],
    answer: 2,
    difficulty: "medium",
    hints: [
      "In a circular list, what does the last node point to?",
      "Inserting at the end and inserting at the front differ only in where the tail pointer finishes.",
    ],
    solution:
      "1. In a circular list the last node's `next` field already points at the first node, so the head is one hop from the tail pointer.\n2. Inserting at the front splices the new node between the last node and the current first node — a constant number of assignments.\n3. Inserting at the end is the same splice, plus moving the tail pointer to the new node — again constant.\n4. So **Both at the front and at the end** are O(1).\n\nAnswer: **Both at the front and at the end**.",
    approach:
      "Keeping the tail rather than the head of a circular list buys both ends for the price of one pointer. It is why circular lists are the usual implementation of a round-robin ready queue.",
    tags: ["linked list", "circular"],
    timeTargetSec: 75,
  },
  {
    slug: "ds-loop-detection",
    topic: "data-structures-mcq",
    title: "Detecting a loop in constant space",
    prompt: "Which technique detects a loop in a singly linked list using only **O(1)** extra space?",
    options: [
      "Floyd's cycle-finding algorithm with a slow and a fast pointer",
      "Kadane's algorithm",
      "Recording every visited node in a hash set",
      "Sorting the node addresses and looking for a repeat",
    ],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Two of the choices do detect a loop, but their memory grows with the list.",
      "Think about two walkers moving at different speeds around a running track.",
    ],
    solution:
      "1. A hash set of visited nodes does detect a loop, but it grows to O(n) space.\n2. Sorting addresses needs the addresses collected first, which is also O(n) space, and Kadane's algorithm solves a maximum-subarray problem entirely unrelated to lists.\n3. **Floyd's cycle-finding algorithm with a slow and a fast pointer** advances one pointer one node at a time and the other two at a time; inside a loop the fast pointer gains one node per step until the two meet, and only two pointers are ever stored.\n\nAnswer: **Floyd's cycle-finding algorithm with a slow and a fast pointer**.",
    approach:
      "The tortoise-and-hare test is the standard O(1)-space loop detector, and the meeting point also lets you find where the loop starts and how long it is.",
    tags: ["linked list", "cycle"],
    timeTargetSec: 60,
  },

  /* ── Trees ─────────────────────────────────────────────────────── */
  {
    slug: "ds-max-nodes-height",
    topic: "data-structures-mcq",
    title: "Maximum nodes for a given height",
    prompt:
      "A binary tree has **height 5**, taking the height of a single-node tree to be 0. What is the maximum number of nodes it can contain?",
    options: ["31", "32", "63", "64"],
    answer: 2,
    difficulty: "easy",
    hints: ["Count the largest possible number of nodes on each level.", "The levels form a geometric series."],
    solution:
      "1. With the root on level 0, level i can hold at most 2^i nodes.\n2. Height 5 means levels 0 through 5 exist.\n3. The total is 1 + 2 + 4 + 8 + 16 + 32 = 63, which is the familiar 2^(h+1) − 1.\n\nAnswer: **63**.",
    approach:
      "Fix the convention first: height counted in edges makes the maximum 2^(h+1) − 1, while height counted in nodes makes it 2^h − 1. Papers state the convention precisely because the answers differ.",
    tags: ["tree", "counting"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-full-binary-tree-leaves",
    topic: "data-structures-mcq",
    title: "Leaves of a full binary tree",
    prompt:
      "In a binary tree every node has either **0 or 2 children**. If the tree contains **10 internal nodes**, how many leaves does it have?",
    options: ["9", "10", "11", "20"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Start from a single node and add children two at a time.",
      "Each addition converts one leaf into an internal node and creates two new leaves.",
    ],
    solution:
      "1. Begin with a single node: 0 internal nodes and 1 leaf.\n2. Giving a leaf two children turns it into an internal node and adds two leaves, so each step adds 1 internal node and a net 1 leaf.\n3. After 10 such steps the tree has 10 internal nodes and 1 + 10 = 11 leaves, matching the rule that leaves exceed internal nodes by exactly one.\n\nAnswer: **11**.",
    approach:
      "In a tree where every node has 0 or 2 children, L = I + 1 always holds, and the total node count 2I + 1 is therefore always odd. Both facts are worth carrying into the exam hall.",
    tags: ["tree", "counting"],
    timeTargetSec: 75,
  },
  {
    slug: "ds-postorder-from-two-traversals",
    topic: "data-structures-mcq",
    title: "Rebuilding a tree from two traversals",
    prompt:
      "A binary tree has **preorder** `A B D E C F` and **inorder** `D B E A C F`. What is its **postorder** traversal?",
    options: ["D E B F C A", "D B E F C A", "D E B C F A", "E D B F C A"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The first letter of a preorder traversal is the root.",
      "In the inorder list the root splits the letters into the left and right subtrees.",
    ],
    solution:
      "1. Preorder begins with the root, so **A** is the root.\n2. In the inorder list, `D B E` lies left of A and `C F` lies right of it.\n3. The preorder of the left subtree is `B D E`, so B is its root with D on the left and E on the right.\n4. The preorder of the right subtree is `C F`, and inorder `C F` puts F to the right of C.\n5. Postorder visits left, then right, then root: `D E B` for the left subtree, `F C` for the right, then `A`, giving `D E B F C A`.\n\nAnswer: **D E B F C A**.",
    approach:
      "Preorder or postorder names the root; inorder splits the rest into the two subtrees. Either pair reconstructs the tree, but preorder with postorder does not — those two cannot tell a left child from a right one.",
    tags: ["tree", "traversal"],
    timeTargetSec: 150,
  },
  {
    slug: "ds-bst-inorder-sorted",
    topic: "data-structures-mcq",
    title: "The sorted traversal",
    prompt: "Which traversal of a **binary search tree** visits the keys in ascending sorted order?",
    options: ["Inorder", "Level-order", "Postorder", "Preorder"],
    answer: 0,
    difficulty: "easy",
    hints: ["Write down the BST ordering rule and compare it with each traversal order.", "The root should be visited in the middle."],
    solution:
      "1. **Inorder** visits the left subtree, then the node, then the right subtree.\n2. In a BST every key on the left is smaller than the node and every key on the right is larger.\n3. Applying that at every node makes the visit sequence sorted from smallest to largest.\n\nAnswer: **Inorder**.",
    approach:
      "Inorder traversal of a BST is the cheapest sorted listing you can get from one, which is why an inorder walk is the standard test that a tree really is a BST.",
    tags: ["bst", "traversal"],
    timeTargetSec: 45,
  },
  {
    slug: "ds-bst-search-worst",
    topic: "data-structures-mcq",
    title: "Worst-case BST search",
    prompt: "What is the worst-case time complexity of searching for a key in a binary search tree holding n keys?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 2,
    difficulty: "easy",
    hints: ["The cost of a search is the length of the path taken.", "What shape does a BST take if keys are inserted already sorted?"],
    solution:
      "1. Each comparison moves one level down, so the cost equals the height of the tree.\n2. A balanced BST has height about log n, but inserting keys in sorted order gives every node only a right child.\n3. That degenerate chain has height n − 1, so the worst case is **O(n)**.\n\nAnswer: **O(n)**.",
    approach:
      "An unbalanced BST is just a linked list with extra pointers. Self-balancing variants such as AVL and red-black trees exist precisely to keep the height at O(log n).",
    tags: ["bst", "complexity"],
    timeTargetSec: 45,
  },
  {
    slug: "ds-bst-delete-two-children",
    topic: "data-structures-mcq",
    title: "Deleting the root of a BST",
    prompt:
      "A BST has 50 at the root, 30 and 70 as its children, 20 and 40 below 30, and 60 and 80 below 70. The root is deleted and replaced by its **inorder successor**. Which key becomes the new root?",
    options: ["20", "30", "40", "60"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "The inorder successor is the next key in sorted order.",
      "Look for it in the right subtree of the deleted node.",
    ],
    solution:
      "1. The inorder successor of a node with two children is the smallest key in its right subtree.\n2. The right subtree of 50 is rooted at 70, with 60 on its left and 80 on its right.\n3. The leftmost key there is 60, so 60 moves up to the root and its old slot is freed.\n\nAnswer: **60**.",
    approach:
      "Replacing a deleted node with its inorder successor (or predecessor) is the only substitution that preserves the BST ordering, because it is the key immediately adjacent in sorted order.",
    tags: ["bst", "deletion"],
    timeTargetSec: 75,
  },
  {
    slug: "ds-bst-preorder-to-postorder",
    topic: "data-structures-mcq",
    title: "From BST preorder to postorder",
    prompt:
      "The preorder traversal of a binary search tree is `50, 30, 20, 40, 70, 60, 80`. What is its postorder traversal?",
    options: [
      "20, 30, 40, 50, 60, 70, 80",
      "20, 30, 40, 60, 80, 70, 50",
      "20, 40, 60, 80, 30, 70, 50",
      "20, 40, 30, 60, 80, 70, 50",
    ],
    answer: 3,
    difficulty: "hard",
    hints: [
      "For a BST the inorder traversal is free — it is the sorted list of keys.",
      "The first preorder key is the root, and it splits the remaining keys by value.",
    ],
    solution:
      "1. The first preorder key is the root, so 50 is the root.\n2. Keys smaller than 50 form the left subtree — 30, 20, 40 — and the larger ones form the right subtree — 70, 60, 80.\n3. The left subtree has root 30 with 20 on its left and 40 on its right, so its postorder is 20, 40, 30.\n4. The right subtree has root 70 with 60 on its left and 80 on its right, so its postorder is 60, 80, 70.\n5. Postorder visits left, right, root, giving 20, 40, 30, 60, 80, 70, 50.\n\nAnswer: **20, 40, 30, 60, 80, 70, 50**.",
    approach:
      "A BST needs only one traversal to be reconstructed, because sorting the keys supplies the inorder traversal for free. Recurse on the value split rather than drawing the whole tree.",
    tags: ["bst", "traversal"],
    timeTargetSec: 150,
  },
  {
    slug: "ds-avl-min-nodes",
    topic: "data-structures-mcq",
    title: "Sparsest AVL tree",
    prompt:
      "What is the **minimum** number of nodes in an AVL tree of **height 4**, counting the height of a single node as 0?",
    options: ["7", "11", "12", "15"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "To be as sparse as possible, make the two subtrees of the root differ in height by the maximum the AVL rule allows.",
      "Build the answer upwards from heights 0 and 1.",
    ],
    solution:
      "1. A sparsest AVL tree of height h has a root, a sparsest subtree of height h − 1 and a sparsest subtree of height h − 2, so N(h) = N(h − 1) + N(h − 2) + 1.\n2. N(0) = 1 and N(1) = 2.\n3. N(2) = 2 + 1 + 1 = 4.\n4. N(3) = 4 + 2 + 1 = 7.\n5. N(4) = 7 + 4 + 1 = 12.\n\nAnswer: **12**.",
    approach:
      "The minimum-node AVL trees are the Fibonacci trees, and the recurrence N(h) = N(h−1) + N(h−2) + 1 is what proves an AVL tree's height stays O(log n).",
    tags: ["avl", "tree", "recurrence"],
    timeTargetSec: 150,
  },

  /* ── Heaps ─────────────────────────────────────────────────────── */
  {
    slug: "ds-min-heap-insert",
    topic: "data-structures-mcq",
    title: "Inserting into a min-heap",
    prompt:
      "A min-heap is stored as the array `[10, 20, 15, 30, 40]`. The key **5** is inserted. What does the array look like afterwards?",
    options: [
      "5, 10, 20, 30, 40, 15",
      "5, 20, 10, 30, 40, 15",
      "5, 20, 15, 30, 40, 10",
      "10, 20, 15, 30, 40, 5",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A new key is appended at the end, then sifted up while it beats its parent.",
      "The parent of index i sits at index (i − 1) / 2, rounded down.",
    ],
    solution:
      "1. The key is appended at index 5, giving `[10, 20, 15, 30, 40, 5]`.\n2. Its parent is index (5 − 1) / 2 = 2, holding 15. Since 5 < 15 they swap, giving `[10, 20, 5, 30, 40, 15]`.\n3. The parent of index 2 is index 0, holding 10. Since 5 < 10 they swap, giving `[5, 20, 10, 30, 40, 15]`.\n4. The key is now at the root, so sifting stops.\n\nAnswer: **5, 20, 10, 30, 40, 15**.",
    approach:
      "Sifting up touches only the path from the new leaf to the root, so insertion costs O(log n). Note that a heap is only partially ordered — the array is not, and need not be, sorted.",
    tags: ["heap", "insertion"],
    timeTargetSec: 105,
  },
  {
    slug: "ds-valid-max-heap",
    topic: "data-structures-mcq",
    title: "Spotting a valid max-heap",
    prompt:
      "Reading each array as a complete binary tree in which the children of index i sit at 2i + 1 and 2i + 2, which array satisfies the **max-heap** property?",
    options: ["[8, 9, 7, 3, 2, 1]", "[9, 7, 8, 3, 2, 5]", "[9, 8, 7, 6, 5, 10]", "[10, 5, 9, 2, 6, 3]"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Check only parent-to-child pairs; siblings have no ordering rule between them.",
      "The last parent to check is at index ⌊n/2⌋ − 1.",
    ],
    solution:
      "1. In `[8, 9, 7, 3, 2, 1]` the root 8 is smaller than its child 9, so it fails.\n2. In `[9, 8, 7, 6, 5, 10]` index 2 holds 7 while its child at index 5 holds 10, so it fails.\n3. In `[10, 5, 9, 2, 6, 3]` index 1 holds 5 while its child at index 4 holds 6, so it fails.\n4. In `[9, 7, 8, 3, 2, 5]` the root 9 dominates 7 and 8, index 1 dominates 3 and 2, and index 2 dominates 5, so every parent is at least as large as its children.\n\nAnswer: **[9, 7, 8, 3, 2, 5]**.",
    approach:
      "A heap constrains parents against children and nothing else, so a valid heap can look thoroughly unsorted. Checking the ⌊n/2⌋ parents is enough — leaves are trivially fine.",
    tags: ["heap", "array"],
    timeTargetSec: 105,
  },
  {
    slug: "ds-heap-extract-max",
    topic: "data-structures-mcq",
    title: "Extract-max on a heap",
    prompt:
      "A max-heap is stored as `[50, 30, 40, 10, 20, 35]`. One **extract-max** operation is performed. What is the resulting array?",
    options: [
      "35, 30, 40, 10, 20",
      "40, 30, 20, 10, 35",
      "40, 35, 30, 20, 10",
      "40, 30, 35, 10, 20",
    ],
    answer: 3,
    difficulty: "hard",
    hints: [
      "The last element is moved to the root before the heap shrinks.",
      "When sifting down, always swap with the larger of the two children.",
    ],
    solution:
      "1. The maximum 50 is removed and the last element, 35, is moved to the root, leaving the five-element array `[35, 30, 40, 10, 20]`.\n2. Sift 35 down: its children are 30 at index 1 and 40 at index 2, and the larger is 40.\n3. Since 40 > 35 the two swap, giving `[40, 30, 35, 10, 20]`.\n4. Index 2 has no children in a five-element array, so sifting stops and the heap property holds.\n\nAnswer: **40, 30, 35, 10, 20**.",
    approach:
      "Extract-max is always the same three moves: take the root, promote the last leaf, sift down against the larger child. Swapping with the smaller child would break the heap immediately.",
    tags: ["heap", "deletion"],
    timeTargetSec: 120,
  },

  /* ── Sorting and searching ─────────────────────────────────────── */
  {
    slug: "ds-quicksort-worst-case",
    topic: "data-structures-mcq",
    title: "Quicksort on sorted input",
    prompt:
      "Quicksort always takes the **first element** as its pivot. What is its running time on an array that is already sorted in ascending order?",
    options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
    answer: 3,
    difficulty: "easy",
    hints: ["Work out how the array splits when the pivot is the smallest element.", "How deep does the recursion go?"],
    solution:
      "1. On sorted input the first element is the smallest, so partitioning leaves nothing on the left and n − 1 elements on the right.\n2. The recursion therefore strips off one element at a time and reaches depth n.\n3. The work at each level is proportional to the size still being processed, so the total is n + (n − 1) + … + 1, which is about n²/2 and hence **O(n²)**.\n\nAnswer: **O(n²)**.",
    approach:
      "Quicksort is fast when partitions are balanced and quadratic when they are not. Choosing a random pivot or the median of three makes the sorted-input worst case vanishingly unlikely.",
    tags: ["sorting", "quicksort", "complexity"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-lomuto-partition",
    topic: "data-structures-mcq",
    title: "One partition step",
    prompt:
      "The array `[7, 2, 1, 6, 8, 5, 3, 4]` is partitioned by the Lomuto scheme with the **last element as pivot**: a boundary index i starts at −1, every element less than or equal to the pivot advances the boundary and is swapped into it, and the pivot is finally swapped into position i + 1. What is the array after this single partition?",
    options: [
      "1, 2, 3, 4, 8, 5, 7, 6",
      "2, 1, 3, 4, 5, 6, 8, 7",
      "2, 3, 1, 4, 8, 5, 7, 6",
      "2, 1, 3, 4, 8, 5, 7, 6",
    ],
    answer: 3,
    difficulty: "hard",
    hints: [
      "Only elements at most as large as the pivot cause a swap.",
      "Partitioning does not sort either side — it only separates them.",
    ],
    solution:
      "1. The pivot is 4 and the boundary starts at i = −1.\n2. 7 is larger and is skipped. 2 is smaller, so i becomes 0 and 2 swaps into index 0: `[2, 7, 1, 6, 8, 5, 3, 4]`.\n3. 1 is smaller, so i becomes 1 and 1 swaps into index 1: `[2, 1, 7, 6, 8, 5, 3, 4]`.\n4. 6, 8 and 5 are all larger and are skipped.\n5. 3 is smaller, so i becomes 2 and 3 swaps with index 2: `[2, 1, 3, 6, 8, 5, 7, 4]`.\n6. Finally the pivot swaps with index i + 1 = 3: `[2, 1, 3, 4, 8, 5, 7, 6]`.\n\nAnswer: **2, 1, 3, 4, 8, 5, 7, 6**.",
    approach:
      "After one partition the pivot alone is in its final position, everything to its left is no larger and everything to its right is no smaller. Neither side is sorted, which is what rules out the tidy-looking options.",
    tags: ["sorting", "quicksort", "partition"],
    timeTargetSec: 180,
  },
  {
    slug: "ds-unstable-sort",
    topic: "data-structures-mcq",
    title: "Which sort is unstable",
    prompt: "Which of these sorting algorithms is **not stable** in its usual implementation?",
    options: ["Bubble sort", "Insertion sort", "Merge sort", "Quicksort"],
    answer: 3,
    difficulty: "easy",
    hints: [
      "A stable sort never changes the relative order of two records with equal keys.",
      "Algorithms that only swap adjacent elements cannot break stability.",
    ],
    solution:
      "1. Bubble sort and insertion sort move elements only past strictly larger neighbours, so equal keys never cross each other.\n2. Merge sort stays stable by taking from the left run whenever two keys tie.\n3. **Quicksort** swaps elements across long distances during partitioning, which can push one equal key past another, so it is the unstable one.\n\nAnswer: **Quicksort**.",
    approach:
      "Stability matters when records are sorted by one field after another. Heapsort and selection sort are the other classic unstable sorts, for the same reason: they move elements far from where they started.",
    tags: ["sorting", "stability"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-bubble-sort-swaps",
    topic: "data-structures-mcq",
    title: "Swaps in a bubble sort",
    prompt: "How many **swaps** does bubble sort perform while sorting `[5, 4, 3, 2, 1]` into ascending order?",
    options: ["4", "5", "10", "20"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Bubble sort only exchanges neighbours, and each exchange fixes exactly one out-of-order pair.",
      "Count the out-of-order pairs in the starting array.",
    ],
    solution:
      "1. Each swap in bubble sort exchanges two adjacent elements, removing exactly one inversion.\n2. The array is in exactly reverse order, so every pair of positions is an inversion.\n3. There are C(5, 2) = 10 such pairs, so bubble sort performs 10 swaps.\n\nAnswer: **10**.",
    approach:
      "The swap count of any adjacent-exchange sort equals the number of inversions in the input. That is also why insertion sort runs in O(n + inversions) and is excellent on nearly sorted data.",
    tags: ["sorting", "inversions"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-insertion-sort-best",
    topic: "data-structures-mcq",
    title: "Best case of insertion sort",
    prompt: "What is the best-case running time of insertion sort, and on which input does it occur?",
    options: [
      "O(1) on a single-element array",
      "O(n) on an already sorted array",
      "O(n log n) on a randomly shuffled array",
      "O(n²) on a reverse-sorted array",
    ],
    answer: 1,
    difficulty: "easy",
    hints: [
      "Best case means the cheapest input of size n, not the smallest input.",
      "Ask how many comparisons each pass makes when nothing needs to move.",
    ],
    solution:
      "1. Insertion sort takes each element and shifts it left past the larger elements already placed.\n2. On sorted input the very first comparison of each pass fails and no shifting happens at all.\n3. That is one comparison per element, n − 1 in total, so the best case is **O(n) on an already sorted array**.\n\nAnswer: **O(n) on an already sorted array**.",
    approach:
      "Best, average and worst case all describe inputs of the same size n. Insertion sort's linear best case makes it the standard finishing pass inside hybrid sorts such as introsort and Timsort.",
    tags: ["sorting", "complexity"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-merge-sort-space",
    topic: "data-structures-mcq",
    title: "The sort that needs a buffer",
    prompt: "Which of these comparison sorts needs **O(n) auxiliary space** in its usual array implementation?",
    options: ["Heapsort", "Insertion sort", "Merge sort", "Selection sort"],
    answer: 2,
    difficulty: "easy",
    hints: ["Three of the four rearrange the array in place.", "Which operation cannot easily be done without somewhere to copy to?"],
    solution:
      "1. Heapsort, insertion sort and selection sort all rearrange elements within the array and need only a fixed number of temporary variables.\n2. Merging two sorted runs cannot be done in place without a far more elaborate algorithm, so the standard implementation copies the runs into a scratch buffer.\n3. That buffer is as large as the segment being merged, which reaches n at the top level, so **Merge sort** is the one needing O(n) extra space.\n\nAnswer: **Merge sort**.",
    approach:
      "Merge sort trades memory for a guaranteed O(n log n) and for stability. Heapsort gives the same time bound in place but is unstable — there is no free lunch among the three properties.",
    tags: ["sorting", "space"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-binary-search-comparisons",
    topic: "data-structures-mcq",
    title: "Comparisons in a binary search",
    prompt: "What is the **maximum** number of comparisons binary search makes on a sorted array of 1000 elements?",
    options: ["9", "10", "11", "500"],
    answer: 1,
    difficulty: "medium",
    hints: ["Each comparison halves the range that remains.", "Find the smallest k with 2^k at least 1000."],
    solution:
      "1. Each comparison halves the search space, so k comparisons can distinguish at most 2^k positions.\n2. 2^9 = 512 is less than 1000, so nine comparisons are not enough.\n3. 2^10 = 1024 is more than 1000, so the maximum needed is 10.\n\nAnswer: **10**.",
    approach:
      "The bound is ⌊log₂ n⌋ + 1 comparisons. Doubling the array adds exactly one comparison, which is why binary search stays usable at any realistic size.",
    tags: ["searching", "complexity"],
    timeTargetSec: 75,
  },
  {
    slug: "ds-min-max-comparisons",
    topic: "data-structures-mcq",
    title: "Finding both the minimum and the maximum",
    prompt:
      "What is the **minimum number of comparisons** needed to find both the smallest and the largest of 100 distinct integers?",
    options: ["99", "148", "150", "198"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Comparing elements in pairs first cuts the work almost in half.",
      "A pair winner can never be the minimum, and a pair loser can never be the maximum.",
    ],
    solution:
      "1. First compare the elements in pairs: 100 elements give 50 comparisons.\n2. The winner of each pair joins a set of 50 candidates for the maximum; the loser joins a set of 50 candidates for the minimum.\n3. Finding the maximum among 50 candidates takes 49 comparisons, and the minimum among the other 50 takes 49 more.\n4. The total is 50 + 49 + 49 = 148, which is the general bound ⌈3n/2⌉ − 2.\n\nAnswer: **148**.",
    approach:
      "Scanning naively costs about 2n comparisons. Pairing first halves the number of candidates each element can belong to, and 3n/2 − 2 is provably optimal.",
    tags: ["comparisons", "lower bound"],
    timeTargetSec: 150,
  },

  /* ── Hashing ───────────────────────────────────────────────────── */
  {
    slug: "ds-linear-probing-index",
    topic: "data-structures-mcq",
    title: "Where linear probing lands",
    prompt:
      "Keys are inserted into a hash table of size 10 with h(k) = k mod 10 and **linear probing**. The keys 12, 22 and 32 are inserted in that order into an empty table. At which index does 32 end up?",
    options: ["2", "3", "4", "5"],
    answer: 2,
    difficulty: "medium",
    hints: ["All three keys hash to the same slot.", "Linear probing tries the very next index, wrapping round at the end."],
    solution:
      "1. 12 mod 10 = 2, so 12 takes index 2.\n2. 22 mod 10 = 2 as well; index 2 is occupied, so probing puts 22 at index 3.\n3. 32 mod 10 = 2; indices 2 and 3 are both taken, so probing continues to index 4, which is free.\n\nAnswer: **4**.",
    approach:
      "Open addressing keeps every key inside the table, so collisions displace keys into neighbouring slots. Deletions then need tombstones, or the probe sequence for later keys breaks.",
    tags: ["hashing", "probing"],
    timeTargetSec: 75,
  },
  {
    slug: "ds-primary-clustering",
    topic: "data-structures-mcq",
    title: "Primary clustering",
    prompt:
      "Which collision-resolution scheme suffers from **primary clustering**, in which occupied slots pile up into long consecutive runs?",
    options: ["Double hashing", "Linear probing", "Quadratic probing", "Separate chaining"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Clustering needs collisions to be resolved into adjacent slots.",
      "Which scheme gives two keys with different home slots the same probe path?",
    ],
    solution:
      "1. Separate chaining stores colliding keys in lists outside the table, so no runs form inside it.\n2. Quadratic probing and double hashing spread successive probes with a growing or key-dependent step, so two keys rarely follow the same path.\n3. **Linear probing** always tries the next slot, so any run of occupied slots absorbs every key that hashes anywhere into it and grows longer still — that is primary clustering.\n\nAnswer: **Linear probing**.",
    approach:
      "Quadratic probing cures primary clustering but leaves secondary clustering, where keys sharing a home slot still share a probe path. Double hashing removes that too, at the cost of a second hash function.",
    tags: ["hashing", "clustering"],
    timeTargetSec: 75,
  },

  /* ── Graphs ────────────────────────────────────────────────────── */
  {
    slug: "ds-complete-graph-edges",
    topic: "data-structures-mcq",
    title: "Edges of a complete graph",
    prompt: "How many edges does a **complete undirected graph** on 12 vertices have?",
    options: ["12", "66", "132", "144"],
    answer: 1,
    difficulty: "easy",
    hints: ["Every pair of distinct vertices is joined exactly once.", "Count pairs, not ordered pairs."],
    solution:
      "1. A complete graph joins every pair of distinct vertices with exactly one edge.\n2. The number of unordered pairs is C(12, 2) = (12 × 11) / 2 = 66.\n3. So the graph has 66 edges. A directed complete graph would have twice as many.\n\nAnswer: **66**.",
    approach:
      "Undirected edges are unordered pairs, so the count is n(n − 1)/2. Forgetting to divide by two is the standard slip and is exactly what one of the distractors rewards.",
    tags: ["graph", "counting"],
    timeTargetSec: 45,
  },
  {
    slug: "ds-adjacency-list-space",
    topic: "data-structures-mcq",
    title: "Space of an adjacency list",
    prompt: "A graph has V vertices and E edges. How much space does its **adjacency list** representation take?",
    options: ["O(E)", "O(V)", "O(V + E)", "O(V²)"],
    answer: 2,
    difficulty: "easy",
    hints: ["There is one list header per vertex, whether or not the vertex has neighbours.", "Each edge contributes a fixed number of list nodes."],
    solution:
      "1. The representation keeps one list header per vertex, which costs O(V) even for isolated vertices.\n2. Every edge contributes one list node in a directed graph, or one in each endpoint's list in an undirected graph, which costs O(E).\n3. Adding the two gives **O(V + E)**, which beats the O(V²) adjacency matrix whenever the graph is sparse.\n\nAnswer: **O(V + E)**.",
    approach:
      "Adjacency lists win on sparse graphs and on iterating a vertex's neighbours; adjacency matrices win when you must answer 'is there an edge from u to v?' in constant time.",
    tags: ["graph", "representation"],
    timeTargetSec: 60,
  },
  {
    slug: "ds-dfs-order",
    topic: "data-structures-mcq",
    title: "Depth-first visiting order",
    prompt: `An undirected graph has these adjacency lists:\n\n${GRAPH_ADJ}\n\nA depth-first search starts at **A** and always moves to the unvisited neighbour that comes **first alphabetically**. In what order are the vertices visited?`,
    options: ["A, B, C, D, E, F", "A, B, D, E, C, F", "A, B, D, E, F, C", "A, C, E, D, B, F"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Depth-first goes as deep as it can before backing up.",
      "When a vertex has no unvisited neighbour left, return to the previous one and try again.",
    ],
    solution:
      "1. From A the alphabetically first neighbour is B, so B is visited.\n2. B's neighbours are A (visited) and D, so D is visited.\n3. D's neighbours are B (visited) and E, so E is visited.\n4. E's unvisited neighbours are C and F, and C comes first; C is visited, and both of C's neighbours are already visited.\n5. Backtracking to E leaves F, which is visited last, giving A, B, D, E, C, F.\n\nAnswer: **A, B, D, E, C, F**.",
    approach:
      "A DFS order is fixed only once the tie-breaking rule is fixed. Backtracking is the step candidates forget: the walk resumes at the deepest vertex that still has an unvisited neighbour.",
    tags: ["graph", "dfs"],
    timeTargetSec: 120,
  },
  {
    slug: "ds-bfs-shortest-path",
    topic: "data-structures-mcq",
    title: "Shortest path by breadth-first search",
    prompt: `An undirected graph has these adjacency lists:\n\n${GRAPH_ADJ}\n\nA breadth-first search from **A** is used to find the shortest path to **F**. How many **edges** does that path contain?`,
    options: ["2", "3", "4", "5"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "BFS labels every vertex with its distance in edges from the start.",
      "Work outwards one level at a time rather than following a single path.",
    ],
    solution:
      "1. BFS from A places B and C at distance 1.\n2. Expanding those puts D (reached from B) and E (reached from C) at distance 2.\n3. F is adjacent only to E, so F is discovered at distance 3, along A → C → E → F.\n4. That path uses 3 edges; the alternative A → B → D → E → F needs 4.\n\nAnswer: **3**.",
    approach:
      "In an unweighted graph, BFS finds shortest paths because it settles all vertices at distance d before any at distance d + 1. Dijkstra's algorithm is the weighted generalisation.",
    tags: ["graph", "bfs", "shortest path"],
    timeTargetSec: 105,
  },
  {
    slug: "ds-topological-sort-condition",
    topic: "data-structures-mcq",
    title: "When a topological order exists",
    prompt: "A directed graph has a topological ordering **exactly when** the graph...",
    options: ["contains no directed cycle", "is complete", "is connected", "is strongly connected"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "A topological order lists every vertex before all the vertices it points to.",
      "Try to order the vertices of a three-vertex cycle.",
    ],
    solution:
      "1. A topological order places each vertex before every vertex it points to.\n2. If there were a directed cycle, each of its vertices would have to precede the next and so, going round, precede itself — impossible.\n3. Conversely, an acyclic directed graph always has a vertex with no incoming edge; removing it repeatedly produces a valid order.\n4. Connectivity is irrelevant, since a graph in several pieces can still be ordered. So a topological order exists exactly when the graph **contains no directed cycle**.\n\nAnswer: **contains no directed cycle**.",
    approach:
      "Topological sorting and cycle detection are the same computation: Kahn's algorithm outputs an order, and any vertices it cannot output lie on a cycle.",
    tags: ["graph", "topological sort"],
    timeTargetSec: 60,
  },

  /* ── Arrays, recursion and complexity ──────────────────────────── */
  {
    slug: "ds-row-major-address",
    topic: "data-structures-mcq",
    title: "Address in a row-major array",
    prompt:
      "An array `A[10][20]` of 4-byte integers is stored in **row-major** order with base address 1000, indices starting at 0. What is the address of `A[3][5]`?",
    options: ["1160", "1200", "1260", "1320"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Row-major stores each complete row before the next one begins.",
      "Count how many elements come before the one you want, then multiply by the element size.",
    ],
    solution:
      "1. In row-major order the elements before A[3][5] are the three complete rows 0, 1 and 2, plus five elements of row 3.\n2. That is 3 × 20 + 5 = 65 elements.\n3. At 4 bytes each the offset is 65 × 4 = 260 bytes.\n4. The address is 1000 + 260 = 1260.\n\nAnswer: **1260**.",
    approach:
      "The row-major formula is base + w × (i × columns + j). Column-major swaps the roles, using base + w × (j × rows + i), and papers often ask for both from the same array.",
    tags: ["array", "addressing"],
    timeTargetSec: 90,
  },
  {
    slug: "ds-fib-recursive-calls",
    topic: "data-structures-mcq",
    title: "Counting recursive calls",
    prompt:
      "The naive recursion `fib(n) = fib(n − 1) + fib(n − 2)`, with `fib(0)` and `fib(1)` returned directly, is used to compute `fib(5)`. How many calls to `fib` are made in total, including the first one?",
    options: ["8", "9", "15", "25"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Write a recurrence for the number of calls, not for the Fibonacci value.",
      "A call to fib(0) or fib(1) still counts as one call.",
    ],
    solution:
      "1. Let T(n) be the total number of calls. T(0) = T(1) = 1, since those return without recursing.\n2. Otherwise T(n) = 1 + T(n − 1) + T(n − 2), counting the call itself.\n3. T(2) = 1 + 1 + 1 = 3 and T(3) = 1 + 3 + 1 = 5.\n4. T(4) = 1 + 5 + 3 = 9.\n5. T(5) = 1 + 9 + 5 = 15.\n\nAnswer: **15**.",
    approach:
      "The call count is 2·fib(n + 1) − 1, so it grows exponentially — the standard argument for memoising the recursion or rewriting it as a loop.",
    tags: ["recursion", "counting"],
    timeTargetSec: 105,
  },
  {
    slug: "ds-tower-of-hanoi-moves",
    topic: "data-structures-mcq",
    title: "Tower of Hanoi",
    prompt: "What is the minimum number of moves needed to solve the Tower of Hanoi puzzle with **6** disks?",
    options: ["31", "36", "63", "64"],
    answer: 2,
    difficulty: "easy",
    hints: ["Moving n disks means moving n − 1 disks twice, plus one move of the largest.", "The count is one less than a power of two."],
    solution:
      "1. To move n disks you move n − 1 aside, move the largest disk, then move the n − 1 back: M(n) = 2M(n − 1) + 1.\n2. With M(1) = 1 this solves to M(n) = 2^n − 1.\n3. For n = 6 that gives 2^6 − 1 = 63 moves.\n\nAnswer: **63**.",
    approach:
      "The recurrence M(n) = 2M(n − 1) + 1 is the archetype of exponential recursion, and 2^n − 1 is worth recognising on sight.",
    tags: ["recursion", "hanoi"],
    timeTargetSec: 60,
  },

  /* ── OS: scheduling ────────────────────────────────────────────── */
  {
    slug: "cs-fcfs-avg-waiting",
    topic: "os-dbms-networks",
    title: "Average waiting time under FCFS",
    prompt: `Three processes arrive together at time 0, in the order P1, P2, P3:\n\n${BURST_TABLE}\n\nUnder **first-come first-served** scheduling, what is the average waiting time?`,
    options: ["13", "17", "20", "27"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Waiting time is the time a process spends ready but not running.",
      "With all arrivals at 0, each process waits for the sum of the bursts before it.",
    ],
    solution:
      "1. FCFS runs the processes in arrival order: P1 from 0 to 24, P2 from 24 to 27, P3 from 27 to 30.\n2. Waiting time is start time minus arrival time, so P1 waits 0, P2 waits 24 and P3 waits 27.\n3. The total waiting time is 0 + 24 + 27 = 51.\n4. The average is 51 / 3 = 17 units.\n\nAnswer: **17**.",
    approach:
      "FCFS is simple but suffers the convoy effect: one long process at the front inflates everybody else's wait. Running the same three in the order P2, P3, P1 would cut the average to 3.",
    tags: ["scheduling", "fcfs"],
    timeTargetSec: 105,
  },
  {
    slug: "cs-sjf-avg-waiting",
    topic: "os-dbms-networks",
    title: "Average waiting time under SJF",
    prompt: `Four processes are all present at time 0:\n\n${SJF_TABLE}\n\nUnder **non-preemptive shortest-job-first** scheduling, what is the average waiting time?`,
    options: ["5.50", "7.00", "7.75", "8.25"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "With everything available at time 0, SJF simply runs the processes in increasing order of burst.",
      "Each process waits for the sum of the bursts scheduled before it.",
    ],
    solution:
      "1. All four are ready at time 0, so SJF runs them in burst order: P4, P1, P3, P2.\n2. The schedule is P4 from 0 to 3, P1 from 3 to 9, P3 from 9 to 16 and P2 from 16 to 24.\n3. The waiting times are P4 = 0, P1 = 3, P3 = 9 and P2 = 16.\n4. The total is 0 + 3 + 9 + 16 = 28, so the average is 28 / 4 = 7.00 units.\n\nAnswer: **7.00**.",
    approach:
      "SJF provably minimises average waiting time for a fixed set of jobs, which is why it is the benchmark every other algorithm is measured against. Its problem is that burst lengths must be predicted, and long jobs can starve.",
    tags: ["scheduling", "sjf"],
    timeTargetSec: 120,
  },
  {
    slug: "cs-round-robin-waiting",
    topic: "os-dbms-networks",
    title: "Round robin with a quantum of 4",
    prompt: `Three processes arrive together at time 0, in the order P1, P2, P3:\n\n${BURST_TABLE}\n\nUnder **round-robin** scheduling with a time quantum of **4**, what is the average waiting time?`,
    options: ["4.33", "5.67", "6.33", "7.00"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Draw the Gantt chart first; a process that outlives its quantum goes to the back of the queue.",
      "Waiting time is turnaround time minus burst time.",
    ],
    solution:
      "1. The Gantt chart is P1 from 0 to 4, P2 from 4 to 7, P3 from 7 to 10, then P1 again from 10 to 30.\n2. P1 finishes at 30 with a burst of 24, so it waits 30 − 24 = 6 units.\n3. P2 finishes at 7 with a burst of 3, so it waits 4 units; P3 finishes at 10 with a burst of 3, so it waits 7 units.\n4. The total is 6 + 4 + 7 = 17, so the average is 17 / 3 = 5.67 units.\n\nAnswer: **5.67**.",
    approach:
      "Round robin trades average waiting time for responsiveness. A quantum far larger than every burst degenerates into FCFS, while a tiny quantum spends most of the CPU on context switches.",
    tags: ["scheduling", "round robin"],
    timeTargetSec: 135,
  },
  {
    slug: "cs-srtf-avg-waiting",
    topic: "os-dbms-networks",
    title: "Preemptive shortest remaining time first",
    prompt: `Four processes arrive at different times:\n\n${SRTF_TABLE}\n\nUnder **shortest-remaining-time-first** (preemptive SJF) scheduling, what is the average waiting time?`,
    options: ["4.50", "5.50", "6.50", "7.75"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "The scheduler reconsiders at every arrival, comparing remaining times rather than original bursts.",
      "Waiting time equals turnaround time minus burst time, which handles the preemptions automatically.",
    ],
    solution:
      "1. P1 starts at 0. At time 1, P2 arrives needing 4 while P1 still needs 7, so P2 preempts and runs to completion at time 5.\n2. P3 arrives at 2 needing 9 and P4 at 3 needing 5; neither beats P2's remaining time, so neither preempts.\n3. At time 5 the remaining times are P1 = 7, P3 = 9, P4 = 5, so P4 runs from 5 to 10, then P1 from 10 to 17, then P3 from 17 to 26.\n4. Waiting time is turnaround minus burst: P1 = 17 − 8 = 9, P2 = 4 − 4 = 0, P3 = 24 − 9 = 15, P4 = 7 − 5 = 2.\n5. The total is 26, so the average is 26 / 4 = 6.50 units.\n\nAnswer: **6.50**.",
    approach:
      "Compute turnaround as completion minus arrival, then subtract the burst — that route survives any number of preemptions, whereas trying to add up idle intervals by hand rarely does.",
    tags: ["scheduling", "srtf", "preemption"],
    timeTargetSec: 180,
  },

  /* ── OS: deadlock ──────────────────────────────────────────────── */
  {
    slug: "cs-deadlock-not-a-condition",
    topic: "os-dbms-networks",
    title: "The four deadlock conditions",
    prompt: "Which of these is **not** one of the four necessary conditions for deadlock?",
    options: ["Circular wait", "Hold and wait", "Mutual exclusion", "Priority inversion"],
    answer: 3,
    difficulty: "easy",
    hints: ["List the four conditions before looking at the options.", "One of the options is a scheduling problem, not a resource-allocation one."],
    solution:
      "1. The four conditions that must hold simultaneously are mutual exclusion, hold and wait, no preemption and circular wait.\n2. Break any one of them and deadlock becomes impossible, which is exactly how prevention schemes are designed.\n3. **Priority inversion** describes a high-priority task delayed by a lower-priority one holding a lock; it degrades response time but is not a deadlock condition.\n\nAnswer: **Priority inversion**.",
    approach:
      "Deadlock needs all four conditions at once. Coffman's list is worth memorising in order, because prevention questions always ask which condition a given rule attacks.",
    tags: ["deadlock", "os"],
    timeTargetSec: 60,
  },
  {
    slug: "cs-deadlock-resource-ordering",
    topic: "os-dbms-networks",
    title: "Numbering the resources",
    prompt:
      "An operating system numbers every resource and insists that a process request resources only in **increasing order of number**. Which deadlock condition does this rule break?",
    options: ["Circular wait", "Hold and wait", "Mutual exclusion", "No preemption"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Imagine the wait-for graph and ask what a cycle in it would require.",
      "The rule does not stop a process holding one resource while asking for another.",
    ],
    solution:
      "1. A deadlock cycle needs at least one process holding a higher-numbered resource while waiting for a lower-numbered one.\n2. The ordering rule forbids exactly that request, so that edge can never appear in the wait-for graph.\n3. Without it the cycle cannot close, which eliminates **Circular wait**. Processes still hold resources while waiting, resources are still non-preemptable and mutual exclusion is untouched.\n\nAnswer: **Circular wait**.",
    approach:
      "Total ordering of resources is the cheapest practical deadlock prevention and is why lock hierarchies are a standard rule in multithreaded code.",
    tags: ["deadlock", "prevention"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-min-resources-deadlock-free",
    topic: "os-dbms-networks",
    title: "Units needed to rule out deadlock",
    prompt:
      "Four processes share identical units of a single resource, and each process may need up to **3** units to finish. What is the smallest number of units that makes deadlock impossible?",
    options: ["7", "8", "9", "12"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Imagine the worst case: every process holds as much as it can without being able to finish.",
      "One extra unit beyond that deadlock must let somebody complete.",
    ],
    solution:
      "1. The worst case has every process holding one unit short of its maximum, that is 2 units each.\n2. Four processes holding 2 units each account for 8 units, and none of them can proceed.\n3. With one more unit available, some process reaches its maximum of 3, finishes and releases everything it holds, so 9 units guarantee progress.\n\nAnswer: **9**.",
    approach:
      "The general rule is P × (N − 1) + 1 units for P processes each needing at most N. It is the standard 'minimum resources for a deadlock-free system' question and appears in nearly every paper that covers deadlock.",
    tags: ["deadlock", "resources"],
    timeTargetSec: 135,
  },

  /* ── OS: memory ────────────────────────────────────────────────── */
  {
    slug: "cs-fifo-page-faults",
    topic: "os-dbms-networks",
    title: "Counting FIFO page faults",
    prompt:
      "A process references the pages `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`. With **three** frames and **FIFO** replacement, how many page faults occur? Count the initial loads as faults.",
    options: ["7", "8", "9", "10"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "FIFO evicts the page that has been resident longest, regardless of how often it is used.",
      "Track the frames in the order they were filled and tick off each fault as you go.",
    ],
    solution:
      "1. Pages 1, 2 and 3 fault into the empty frames, leaving [1, 2, 3].\n2. 4 faults and evicts the oldest page 1, giving [2, 3, 4]; 1 faults and evicts 2, giving [3, 4, 1]; 2 faults and evicts 3, giving [4, 1, 2].\n3. 5 faults and evicts 4, giving [1, 2, 5]; the following references to 1 and to 2 are both hits.\n4. 3 faults and evicts 1, giving [2, 5, 3]; 4 faults and evicts 2, giving [5, 3, 4]; the last reference to 5 is a hit.\n5. The faults are on 1, 2, 3, 4, 1, 2, 5, 3 and 4 — 9 faults in total, with only three hits.\n\nAnswer: **9**.",
    approach:
      "Write the frame contents after every reference rather than trying to hold them in your head. FIFO's queue order is what makes it cheap to implement and poor at keeping hot pages resident.",
    tags: ["paging", "fifo", "page fault"],
    timeTargetSec: 180,
  },
  {
    slug: "cs-lru-page-faults",
    topic: "os-dbms-networks",
    title: "Counting LRU page faults",
    prompt:
      "A process references the pages `7, 0, 1, 2, 0, 3, 0, 4`. With **three** frames and **LRU** replacement, how many page faults occur?",
    options: ["4", "5", "6", "7"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "LRU evicts the page whose last use is furthest in the past.",
      "A hit also updates recency, which changes who the next victim is.",
    ],
    solution:
      "1. 7, 0 and 1 fault into the empty frames, leaving [7, 0, 1] with 7 the least recently used.\n2. 2 faults and evicts 7, giving [0, 1, 2].\n3. The reference to 0 is a hit and makes 0 the most recently used, so 1 becomes the least recently used.\n4. 3 faults and evicts 1, giving [0, 2, 3]; the next reference to 0 is a hit, leaving 2 least recently used.\n5. 4 faults and evicts 2. The faults are on 7, 0, 1, 2, 3 and 4 — 6 in total.\n\nAnswer: **6**.",
    approach:
      "LRU approximates the optimal policy by assuming the recent past predicts the near future. Its cost is the bookkeeping: real systems approximate it with reference bits or a second-chance clock.",
    tags: ["paging", "lru", "page fault"],
    timeTargetSec: 165,
  },
  {
    slug: "cs-belady-anomaly",
    topic: "os-dbms-networks",
    title: "Belady's anomaly",
    prompt:
      "Belady's anomaly — adding a frame producing *more* page faults — can occur with which page-replacement algorithm?",
    options: ["FIFO", "LRU", "Optimal (OPT)", "Both LRU and Optimal"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "Some algorithms guarantee that the pages held with n frames are also held with n + 1 frames.",
      "Which algorithm ignores how recently or how soon a page is used?",
    ],
    solution:
      "1. LRU and OPT are stack algorithms: the set of pages resident with n frames is always a subset of the set resident with n + 1 frames, so extra frames can never add faults.\n2. **FIFO** ranks pages only by arrival, which does not have that nesting property.\n3. The classic string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 gives FIFO 9 faults with three frames but 10 with four.\n\nAnswer: **FIFO**.",
    approach:
      "The stack property is the whole explanation. Second-chance and clock, being FIFO in disguise, can show the anomaly too, while anything ranking pages by a fixed priority cannot.",
    tags: ["paging", "belady"],
    timeTargetSec: 75,
  },
  {
    slug: "cs-page-table-entries",
    topic: "os-dbms-networks",
    title: "Size of a page table",
    prompt:
      "A system uses **32-bit** logical addresses with a page size of **4 KB**. How many entries does a single-level page table contain?",
    options: ["2^12 (4 K)", "2^16 (64 K)", "2^20 (1 M)", "2^32 (4 G)"],
    answer: 2,
    difficulty: "medium",
    hints: ["Split the logical address into a page number and an offset.", "The offset must be wide enough to address any byte within one page."],
    solution:
      "1. A 4 KB page is 2^12 bytes, so 12 bits of the address are the offset.\n2. That leaves 32 − 12 = 20 bits for the page number.\n3. A page table holds one entry per possible page number, so it has **2^20 (1 M)** entries.\n\nAnswer: **2^20 (1 M)**.",
    approach:
      "A table of a million entries per process is exactly why real systems use multi-level page tables, inverted page tables or hashed page tables rather than one flat array.",
    tags: ["paging", "memory"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-tlb-effective-access",
    topic: "os-dbms-networks",
    title: "Effective memory access time",
    prompt:
      "A paged system has a TLB hit ratio of **80%**. A TLB lookup takes **20 ns** and a memory access takes **100 ns**. On a TLB miss the page table must be read from memory before the data itself is fetched. What is the effective memory access time?",
    options: ["100 ns", "120 ns", "140 ns", "220 ns"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Price the hit path and the miss path separately, then weight them by their probabilities.",
      "A miss costs two memory accesses: one for the page table entry and one for the data.",
    ],
    solution:
      "1. On a hit the cost is the TLB lookup plus one memory access: 20 + 100 = 120 ns, which happens 80% of the time.\n2. On a miss the cost is the TLB lookup, a memory access for the page table and a second one for the data: 20 + 100 + 100 = 220 ns, which happens 20% of the time.\n3. The weighted average is 0.8 × 120 + 0.2 × 220 = 96 + 44 = 140 ns.\n\nAnswer: **140 ns**.",
    approach:
      "Read the question carefully for whether the TLB lookup is charged on a miss as well, and whether the hit ratio is given as a fraction or a percentage — both are where marks are lost.",
    tags: ["tlb", "paging", "performance"],
    timeTargetSec: 150,
  },
  {
    slug: "cs-internal-fragmentation",
    topic: "os-dbms-networks",
    title: "Internal fragmentation",
    prompt: "Which memory-management scheme suffers from **internal** fragmentation?",
    options: ["Paging", "Segmentation", "Both equally", "Neither"],
    answer: 0,
    difficulty: "easy",
    hints: ["Internal fragmentation is space wasted *inside* an allocated block.", "Which scheme allocates in fixed-size units?"],
    solution:
      "1. **Paging** divides memory into fixed-size frames, and a process rarely fills its final page exactly; the unused tail of that frame is wasted inside an allocated block, which is internal fragmentation.\n2. Segmentation allocates variable-size blocks sized to each segment, so nothing is wasted inside a block. Its waste appears as unusable gaps between blocks, which is external fragmentation.\n\nAnswer: **Paging**.",
    approach:
      "Fixed-size allocation means internal fragmentation; variable-size allocation means external fragmentation. Remembering which way round they go settles most memory-management MCQs.",
    tags: ["memory", "fragmentation"],
    timeTargetSec: 60,
  },

  /* ── OS: processes, threads and synchronisation ────────────────── */
  {
    slug: "cs-thread-private-stack",
    topic: "os-dbms-networks",
    title: "What threads do not share",
    prompt: "Two threads belong to the same process. Which of these does each thread keep **private**?",
    options: ["The code section", "The global data section", "The list of open files", "The stack and register set"],
    answer: 3,
    difficulty: "easy",
    hints: ["Threads share the address space of their process.", "Ask what each thread needs in order to be at a different point in the program."],
    solution:
      "1. Threads of one process share its address space, so the code and the global data are common to all of them — which is why they need locks around shared variables.\n2. The file descriptor table belongs to the process, so a file opened by one thread is visible to the others.\n3. Each thread runs its own chain of function calls and sits at its own instruction. **The stack and register set** are therefore private to every thread.\n\nAnswer: **The stack and register set**.",
    approach:
      "The dividing line is simple: anything describing where a thread is in the program is private, and anything describing what the program owns is shared.",
    tags: ["threads", "process"],
    timeTargetSec: 60,
  },
  {
    slug: "cs-counting-semaphore-value",
    topic: "os-dbms-networks",
    title: "Value of a counting semaphore",
    prompt:
      "A counting semaphore is initialised to **10**. Six `wait` (P) operations and four `signal` (V) operations are then completed on it. What is its value?",
    options: ["0", "4", "8", "10"],
    answer: 2,
    difficulty: "medium",
    hints: ["A wait decrements the semaphore; a signal increments it.", "Every operation stated has completed, so none is still blocked."],
    solution:
      "1. Each completed `wait` decrements the semaphore by one, so six of them subtract 6.\n2. Each `signal` increments it by one, so four of them add 4.\n3. The value is 10 − 6 + 4 = 8, meaning eight units of the resource are still free.\n\nAnswer: **8**.",
    approach:
      "A counting semaphore's value is the number of units still available. A wait that would take it below zero blocks instead, so a stated 'completed' wait is one that got through.",
    tags: ["semaphore", "synchronisation"],
    timeTargetSec: 75,
  },

  /* ── DBMS: normalisation and keys ──────────────────────────────── */
  {
    slug: "cs-relation-2nf-not-3nf",
    topic: "os-dbms-networks",
    title: "Which normal form is it in?",
    prompt:
      "A relation R(A, B, C, D) has A as its only candidate key, with the functional dependencies A → B, B → C and A → D. What is the highest normal form R satisfies?",
    options: ["1NF but not 2NF", "2NF but not 3NF", "3NF but not BCNF", "BCNF"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A single-attribute key rules out one kind of violation immediately.",
      "Follow the chain A → B → C and name what it is.",
    ],
    solution:
      "1. The key A is a single attribute, so no non-key attribute can depend on part of the key; the relation is automatically in 2NF.\n2. The dependency B → C has a determinant, B, that is not a superkey, and C belongs to no candidate key.\n3. That is a transitive dependency A → B → C, which 3NF forbids, so R is in **2NF but not 3NF**.\n\nAnswer: **2NF but not 3NF**.",
    approach:
      "2NF is about partial dependencies on part of a composite key, 3NF about transitive dependencies through a non-key attribute, and BCNF about any determinant that is not a superkey. A single-attribute key gives 2NF for free.",
    tags: ["dbms", "normalisation"],
    timeTargetSec: 105,
  },
  {
    slug: "cs-3nf-not-bcnf",
    topic: "os-dbms-networks",
    title: "The gap between 3NF and BCNF",
    prompt:
      "A relation R(A, B, C) has the functional dependencies AB → C and C → B. What is the highest normal form R satisfies?",
    options: ["2NF but not 3NF", "3NF but not BCNF", "BCNF but not 4NF", "It is not even in 1NF"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Find all the candidate keys with closures before judging any dependency.",
      "3NF forgives a bad determinant when the attribute on the right belongs to a key.",
    ],
    solution:
      "1. Taking closures, (AB)+ is A, B, C and (AC)+ is A, C and then B through C → B, so both AB and AC are candidate keys.\n2. In C → B the determinant C is not a superkey, so BCNF is violated.\n3. 3NF permits such a dependency provided the attribute on the right is prime, and B belongs to the candidate key AB.\n4. So the relation is in **3NF but not BCNF**.\n\nAnswer: **3NF but not BCNF**.",
    approach:
      "The only difference between 3NF and BCNF is 3NF's escape clause for prime attributes on the right-hand side. This tiny relation is the textbook example that lives in that gap.",
    tags: ["dbms", "normalisation", "bcnf"],
    timeTargetSec: 165,
  },
  {
    slug: "cs-candidate-key-count",
    topic: "os-dbms-networks",
    title: "Counting candidate keys",
    prompt:
      "For R(A, B, C, D) with the functional dependencies AB → C, C → D and D → A, how many **candidate keys** does R have?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "An attribute that never appears on the right-hand side must be part of every candidate key.",
      "Start from that attribute and test what has to be added to close over everything.",
    ],
    solution:
      "1. B never appears on the right of any dependency, so B belongs to every candidate key, and (B)+ is just B.\n2. (AB)+ gives C through AB → C and then D through C → D, covering all four attributes, so AB is a candidate key.\n3. (BC)+ gives D through C → D and then A through D → A, so BC is a candidate key.\n4. (BD)+ gives A through D → A and then C through AB → C, so BD is a candidate key.\n5. No single attribute suffices and no other pair closes over everything, so R has 3 candidate keys.\n\nAnswer: **3**.",
    approach:
      "Attributes on no right-hand side are in every key; attributes on no left-hand side are in none. Seeding the closure with the forced attributes cuts the search from every subset to a handful.",
    tags: ["dbms", "keys", "closure"],
    timeTargetSec: 180,
  },

  /* ── DBMS: SQL ─────────────────────────────────────────────────── */
  {
    slug: "cs-sql-having-average",
    topic: "os-dbms-networks",
    title: "GROUP BY with HAVING",
    prompt: `Table **employee**:\n\n${EMPLOYEE_TABLE}\n\nWhat does this query return?\n\n\`\`\`sql\nSELECT dept\nFROM employee\nGROUP BY dept\nHAVING AVG(salary) > 40000;\n\`\`\``,
    options: ["HR and IT", "HR only", "Sales and HR", "Sales, HR and IT"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Form the groups first, then compute the aggregate for each one.",
      "The comparison is strictly greater than, not greater than or equal.",
    ],
    solution:
      "1. GROUP BY dept forms three groups: Sales with 30000 and 50000, HR with 40000 and 60000, and IT with 45000.\n2. The averages are Sales = 40000, HR = 50000 and IT = 45000.\n3. HAVING keeps only groups whose average is strictly greater than 40000, so Sales is dropped on the boundary and **HR and IT** remain.\n\nAnswer: **HR and IT**.",
    approach:
      "WHERE filters rows before grouping; HAVING filters groups after the aggregate is computed. Boundary values like Sales here are exactly what a HAVING question is testing.",
    tags: ["sql", "group by"],
    timeTargetSec: 120,
  },
  {
    slug: "cs-sql-count-null",
    topic: "os-dbms-networks",
    title: "COUNT and NULL",
    prompt: `Table **employee**:\n\n${MANAGER_TABLE}\n\nWhat does this query return?\n\n\`\`\`sql\nSELECT COUNT(*), COUNT(manager_id) FROM employee;\n\`\`\``,
    options: ["3 and 3", "3 and 5", "5 and 3", "5 and 5"],
    answer: 2,
    difficulty: "medium",
    hints: ["COUNT(*) and COUNT(column) do not always agree.", "Aggregate functions in SQL skip NULL values."],
    solution:
      "1. COUNT(*) counts rows whatever they contain, and the table has 5 rows.\n2. COUNT(manager_id) counts only the rows where that column is not NULL.\n3. Two rows, for Asha and Sunil, hold NULL there, leaving 3.\n4. The query therefore returns 5 and 3.\n\nAnswer: **5 and 3**.",
    approach:
      "Every aggregate except COUNT(*) ignores NULLs, which also makes AVG(col) divide by the non-null count rather than the row count — a favourite source of surprising averages.",
    tags: ["sql", "null", "aggregate"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-left-outer-join-rows",
    topic: "os-dbms-networks",
    title: "Rows from a left outer join",
    prompt: `Two tables:\n\n${JOIN_TABLES}\n\nHow many rows does this query return?\n\n\`\`\`sql\nSELECT * FROM students s LEFT JOIN marks m ON s.id = m.student_id;\n\`\`\``,
    options: ["3", "4", "5", "6"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A left join keeps every row of the left table, matched or not.",
      "A left row matching two right rows appears twice.",
    ],
    solution:
      "1. A left outer join emits every matching pair, and for a left row with no match it emits one row padded with NULLs.\n2. Student 1 matches the two mark rows 80 and 90, contributing 2 rows.\n3. Student 3 matches the single mark row 70, contributing 1 row.\n4. Student 2 matches nothing but is still kept, contributing 1 row of NULLs.\n5. The result has 2 + 1 + 1 = 4 rows.\n\nAnswer: **4**.",
    approach:
      "Row counts from a join are driven by matching multiplicities, not by table sizes. An inner join here would return 3 rows, since student 2 would disappear.",
    tags: ["sql", "join"],
    timeTargetSec: 105,
  },
  {
    slug: "cs-natural-join-max-tuples",
    topic: "os-dbms-networks",
    title: "Largest possible natural join",
    prompt:
      "R(A, B) holds 200 tuples and S(B, C) holds 100 tuples. What is the **maximum** possible number of tuples in the natural join of R and S?",
    options: ["0", "100", "200", "20000"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "The join pairs tuples that agree on the common attribute B.",
      "What if every tuple in both relations carries the same value of B?",
    ],
    solution:
      "1. The natural join pairs a tuple of R with a tuple of S whenever the two agree on B.\n2. If every tuple of both relations happens to carry the same B value, each of the 200 tuples of R matches each of the 100 tuples of S.\n3. That gives 200 × 100 = 20000 tuples, the same size as the cross product, and nothing can exceed it.\n\nAnswer: **20000**.",
    approach:
      "The natural join is a selection over the cross product, so its size runs from 0 to |R| × |S|. If B were a key of S, the maximum would collapse to 200.",
    tags: ["dbms", "join", "relational algebra"],
    timeTargetSec: 105,
  },
  {
    slug: "cs-sql-clause-order",
    topic: "os-dbms-networks",
    title: "Where an alias may be used",
    prompt:
      "Why can a column alias defined in the `SELECT` list be referenced in `ORDER BY` but not in `WHERE`?",
    options: [
      "WHERE is evaluated before SELECT, while ORDER BY is evaluated after it",
      "WHERE accepts only indexed columns",
      "Aliases are case sensitive inside WHERE",
      "ORDER BY runs on the client and WHERE runs on the server",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Write down the logical order in which the clauses of a query are evaluated.",
      "An alias only exists once the SELECT list has been computed.",
    ],
    solution:
      "1. A query is evaluated in the logical order FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.\n2. When WHERE is evaluated the SELECT list has not been computed, so its aliases do not yet exist.\n3. ORDER BY is evaluated after SELECT, by which point the alias names a column of the result and can be referenced.\n4. In short, **WHERE is evaluated before SELECT, while ORDER BY is evaluated after it**.\n\nAnswer: **WHERE is evaluated before SELECT, while ORDER BY is evaluated after it**.",
    approach:
      "The logical clause order explains a whole family of SQL puzzles: why aggregates cannot appear in WHERE, why HAVING can use them, and why ORDER BY may use an alias or even an output column number.",
    tags: ["sql", "semantics"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-truncate-vs-delete",
    topic: "os-dbms-networks",
    title: "TRUNCATE against DELETE",
    prompt:
      "Which command removes every row of a table while keeping the table itself, and is classed as **DDL** rather than DML?",
    options: ["DELETE", "DROP", "TRUNCATE", "UPDATE"],
    answer: 2,
    difficulty: "easy",
    hints: ["One of these removes the table definition as well.", "DML operations are logged row by row and can carry a WHERE clause."],
    solution:
      "1. DELETE is DML: it removes rows one at a time, logs each of them and may carry a WHERE clause.\n2. DROP removes the table definition itself, not merely its contents.\n3. **TRUNCATE** deallocates the data pages in a single DDL operation, leaving an empty table with its columns, indexes and constraints intact.\n\nAnswer: **TRUNCATE**.",
    approach:
      "TRUNCATE is fast because it does not log individual rows, which is also why it cannot be filtered with WHERE and, in most engines, resets identity counters.",
    tags: ["sql", "ddl"],
    timeTargetSec: 60,
  },

  /* ── DBMS: transactions, indexing and constraints ──────────────── */
  {
    slug: "cs-acid-durability",
    topic: "os-dbms-networks",
    title: "Surviving a crash",
    prompt:
      "A transaction commits and the server loses power a second later. Which ACID property guarantees the committed changes are still present when the database restarts?",
    options: ["Atomicity", "Consistency", "Durability", "Isolation"],
    answer: 2,
    difficulty: "easy",
    hints: ["Three of the four say nothing about what happens after the commit.", "Think about what the write-ahead log is forced to disk for."],
    solution:
      "1. Atomicity guarantees a transaction is all or nothing, and isolation guarantees concurrent transactions do not see one another's intermediate state.\n2. Consistency guarantees a transaction moves the database from one valid state to another.\n3. Surviving a crash after a commit is exactly the promise of **Durability**, normally kept by forcing the log to stable storage before the commit is acknowledged.\n\nAnswer: **Durability**.",
    approach:
      "Map each ACID letter to the failure it defends against: atomicity against a mid-transaction abort, isolation against concurrency, durability against a crash.",
    tags: ["dbms", "acid", "transactions"],
    timeTargetSec: 60,
  },
  {
    slug: "cs-isolation-level-dirty-read",
    topic: "os-dbms-networks",
    title: "Choosing an isolation level",
    prompt: "Which isolation level prevents dirty reads but still permits non-repeatable reads?",
    options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A dirty read sees data another transaction has not committed.",
      "A non-repeatable read sees a row change between two reads inside one transaction.",
    ],
    solution:
      "1. Read Uncommitted lets a transaction see rows another transaction has not committed, which is precisely a dirty read.\n2. **Read Committed** reads only committed rows, so dirty reads disappear; but a row read twice may differ if another transaction commits an update in between, which is a non-repeatable read.\n3. Repeatable Read stops that as well, and Serializable additionally stops phantom rows.\n\nAnswer: **Read Committed**.",
    approach:
      "The four levels form a ladder against three anomalies: dirty read, non-repeatable read and phantom. Naming the anomaly the question describes points straight at the level.",
    tags: ["dbms", "isolation", "transactions"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-clustered-index",
    topic: "os-dbms-networks",
    title: "Clustered indexes",
    prompt: "Which statement about a **clustered index** is correct?",
    options: [
      "A table can have at most one clustered index",
      "A table can have one clustered index per column",
      "A clustered index cannot be built on the primary key",
      "A clustered index stores only pointers and never the rows themselves",
    ],
    answer: 0,
    difficulty: "medium",
    hints: ["A clustered index decides the physical order of the rows.", "In how many orders can one set of rows be laid out on disk?"],
    solution:
      "1. A clustered index determines the physical order in which the rows are stored, and rows can be laid out in only one order at a time.\n2. So **A table can have at most one clustered index**, though it may carry many non-clustered ones.\n3. The primary key is in fact the usual choice for it, and the leaf level of a clustered index holds the rows themselves rather than pointers to them.\n\nAnswer: **A table can have at most one clustered index**.",
    approach:
      "Clustered means the index *is* the table's storage order; non-clustered means a separate structure pointing back at the rows. Range scans are fast on a clustered key and slower through a non-clustered one.",
    tags: ["dbms", "indexing"],
    timeTargetSec: 75,
  },
  {
    slug: "cs-primary-key-vs-unique",
    topic: "os-dbms-networks",
    title: "PRIMARY KEY against UNIQUE",
    prompt: "What distinguishes a `PRIMARY KEY` constraint from a `UNIQUE` constraint?",
    options: [
      "A UNIQUE column may hold NULL, a PRIMARY KEY column may not",
      "A PRIMARY KEY column may hold NULL, a UNIQUE column may not",
      "Both allow NULL values freely",
      "Neither allows NULL, and a table may have only one of each",
    ],
    answer: 0,
    difficulty: "easy",
    hints: ["Both constraints reject duplicate values, so the difference lies elsewhere.", "A key must identify a row unambiguously."],
    solution:
      "1. Both constraints reject duplicate values, and a table may carry several UNIQUE constraints but only one primary key.\n2. A primary key identifies a row, so its columns are implicitly NOT NULL.\n3. A UNIQUE constraint carries no such rule, so **A UNIQUE column may hold NULL, a PRIMARY KEY column may not**.\n\nAnswer: **A UNIQUE column may hold NULL, a PRIMARY KEY column may not**.",
    approach:
      "Entity integrity is the rule at work: no part of a primary key may be null, because a null cannot identify anything. UNIQUE only promises no two non-null values repeat.",
    tags: ["dbms", "constraints", "keys"],
    timeTargetSec: 60,
  },

  /* ── Networks ──────────────────────────────────────────────────── */
  {
    slug: "cs-router-layer",
    topic: "os-dbms-networks",
    title: "Where a router works",
    prompt: "A router forwards packets by examining destination **IP addresses**. At which OSI layer does it operate?",
    options: ["Data link layer", "Network layer", "Physical layer", "Transport layer"],
    answer: 1,
    difficulty: "easy",
    hints: ["Match the address the device reads to the layer that defines it.", "MAC addresses and IP addresses belong to different layers."],
    solution:
      "1. IP addressing, routing and forwarding between different networks are the responsibility of layer 3, the **Network layer**.\n2. A switch works one layer below, forwarding frames by MAC address, and a hub or repeater works at the physical layer.\n3. Port numbers and end-to-end delivery belong to the transport layer above.\n\nAnswer: **Network layer**.",
    approach:
      "Identify a device by the address it reads: bits at layer 1, MAC at layer 2, IP at layer 3, ports at layer 4. That single rule answers most 'which layer' questions.",
    tags: ["networks", "osi", "routing"],
    timeTargetSec: 45,
  },
  {
    slug: "cs-presentation-layer",
    topic: "os-dbms-networks",
    title: "The translation layer",
    prompt:
      "Which OSI layer handles encryption, compression and the translation of data between different character representations?",
    options: ["Application layer", "Presentation layer", "Session layer", "Transport layer"],
    answer: 1,
    difficulty: "easy",
    hints: ["Two of the seven OSI layers have no direct counterpart in the TCP/IP model.", "Its name describes how data is presented, not what it means."],
    solution:
      "1. The session layer opens, manages and closes dialogues between applications, while the transport layer provides end-to-end delivery, segmentation and flow control.\n2. The application layer is where the user's protocol itself lives, such as HTTP or SMTP.\n3. Anything concerning the *form* the data takes on the wire — encoding, encryption, compression — belongs to the **Presentation layer**, layer 6.\n\nAnswer: **Presentation layer**.",
    approach:
      "The presentation and session layers exist only in the OSI model; in TCP/IP their duties are folded into the application layer, which is why TLS sits awkwardly between layers in practice.",
    tags: ["networks", "osi"],
    timeTargetSec: 45,
  },
  {
    slug: "cs-tcp-not-a-feature",
    topic: "os-dbms-networks",
    title: "TCP against UDP",
    prompt: "Which of these statements about TCP is **false**?",
    options: [
      "It is connection oriented",
      "It delivers bytes to the application in order",
      "It has a minimum header size of 8 bytes",
      "It provides flow control through a receiver-advertised window",
    ],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Three of the statements describe the guarantees TCP is built to provide.",
      "Compare how much bookkeeping TCP's header must carry against UDP's.",
    ],
    solution:
      "1. TCP opens a connection with a three-way handshake, numbers every byte so the receiver can rebuild the stream in order, and advertises a window for flow control — three true statements.\n2. TCP's header is 20 bytes without options, because it carries sequence and acknowledgement numbers, a window size, flags and a checksum.\n3. The 8-byte header belongs to UDP, which carries only source port, destination port, length and checksum, so **It has a minimum header size of 8 bytes** is the false statement.\n\nAnswer: **It has a minimum header size of 8 bytes**.",
    approach:
      "Header sizes are the quickest way to remember the difference: 20 bytes of guarantees against 8 bytes of best effort. UDP wins where latency beats reliability — DNS queries, live audio and video, gaming.",
    tags: ["networks", "tcp", "udp"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-three-way-handshake",
    topic: "os-dbms-networks",
    title: "The three-way handshake",
    prompt: "What is the correct order of segments in the TCP three-way handshake?",
    options: ["ACK, SYN, SYN-ACK", "SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN-ACK, SYN, ACK"],
    answer: 2,
    difficulty: "easy",
    hints: ["The client speaks first.", "One of the three segments does two jobs at once, which is why only three are needed."],
    solution:
      "1. The client opens by sending a SYN carrying its initial sequence number.\n2. The server replies with a single segment that both acknowledges the client's SYN and carries its own SYN — the SYN-ACK.\n3. The client acknowledges the server's SYN with an ACK, and the connection is open: **SYN, SYN-ACK, ACK**.\n\nAnswer: **SYN, SYN-ACK, ACK**.",
    approach:
      "Each side must announce a sequence number and have it acknowledged, which would take four segments; combining the server's SYN with its ACK is what reduces it to three.",
    tags: ["networks", "tcp"],
    timeTargetSec: 45,
  },
  {
    slug: "cs-dns-port",
    topic: "os-dbms-networks",
    title: "The port DNS uses",
    prompt: "Which well-known port does DNS use by default?",
    options: ["20", "25", "53", "110"],
    answer: 2,
    difficulty: "easy",
    hints: ["The other three all belong to mail or file transfer.", "It is one of the few well-known ports used over UDP as well as TCP."],
    solution:
      "1. Port 20 carries FTP data, port 25 is SMTP for sending mail and port 110 is POP3 for retrieving it.\n2. DNS name resolution runs on port 53 — over UDP for ordinary queries, and over TCP for zone transfers and responses too large for a datagram.\n\nAnswer: **53**.",
    approach:
      "Learn the small set that appears in every paper: 20 and 21 FTP, 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 80 HTTP, 110 POP3, 143 IMAP, 443 HTTPS.",
    tags: ["networks", "ports", "dns"],
    timeTargetSec: 45,
  },
  {
    slug: "cs-dns-a-record",
    topic: "os-dbms-networks",
    title: "Which DNS record",
    prompt: "Which DNS record type maps a host name to an **IPv4** address?",
    options: ["A", "CNAME", "MX", "NS"],
    answer: 0,
    difficulty: "easy",
    hints: ["Two of the four point at other names rather than at addresses.", "One of them exists to route mail."],
    solution:
      "1. CNAME makes a name an alias for another name, MX names the mail servers for a domain, and NS names its authoritative name servers.\n2. The record carrying a 32-bit IPv4 address for a host name is the **A** record; its IPv6 counterpart is AAAA.\n\nAnswer: **A**.",
    approach:
      "Resolution often follows a chain: a CNAME leads to another name, which must itself resolve to an A or AAAA record before a connection can be made.",
    tags: ["networks", "dns"],
    timeTargetSec: 45,
  },
  {
    slug: "cs-subnet-usable-hosts",
    topic: "os-dbms-networks",
    title: "Hosts in a /26",
    prompt: "How many **usable host addresses** does an IPv4 subnet with a `/26` prefix provide?",
    options: ["30", "62", "64", "126"],
    answer: 1,
    difficulty: "medium",
    hints: ["The prefix length says how many bits identify the network.", "Two addresses in every subnet cannot be given to a host."],
    solution:
      "1. A /26 prefix leaves 32 − 26 = 6 bits for the host part.\n2. Six bits address 2^6 = 64 distinct values within the subnet.\n3. The all-zeros value names the network and the all-ones value is the broadcast address, so 64 − 2 = 62 addresses remain usable by hosts.\n\nAnswer: **62**.",
    approach:
      "The formula is 2^(32 − prefix) − 2. Forgetting to subtract the network and broadcast addresses is what the neighbouring distractor is there to catch.",
    tags: ["networks", "subnetting"],
    timeTargetSec: 75,
  },
  {
    slug: "cs-broadcast-address",
    topic: "os-dbms-networks",
    title: "Finding the broadcast address",
    prompt:
      "A host is configured with the address `192.168.10.75` and the subnet mask `255.255.255.192`. What is the **broadcast address** of its subnet?",
    options: ["192.168.10.63", "192.168.10.64", "192.168.10.127", "192.168.10.255"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Work out the block size from the last non-255 octet of the mask.",
      "Find which block the host address falls into, then take the last address of that block.",
    ],
    solution:
      "1. The mask 255.255.255.192 is a /26, so subnets step through the last octet in blocks of 256 − 192 = 64.\n2. The subnet boundaries are therefore .0, .64, .128 and .192, and 75 falls inside the block that starts at .64.\n3. That block ends one address below the next boundary at .128, so the broadcast address is 192.168.10.127 and the usable range is .65 to .126.\n\nAnswer: **192.168.10.127**.",
    approach:
      "The block-size trick — 256 minus the interesting octet of the mask — converts every subnetting question into simple counting, with no binary conversion needed.",
    tags: ["networks", "subnetting", "addressing"],
    timeTargetSec: 150,
  },
  {
    slug: "cs-http-403",
    topic: "os-dbms-networks",
    title: "Reading an HTTP status code",
    prompt:
      "A server fully understands a request but refuses to authorise it, and repeating the request with the same credentials will not help. Which HTTP status code fits?",
    options: ["301 Moved Permanently", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "One code invites the client to try again with credentials; the other refuses outright.",
      "The server here knows exactly what was asked and where it is.",
    ],
    solution:
      "1. 301 says the resource has moved to a new permanent URL, and 404 says the server cannot find it at all.\n2. 401 means authentication is missing or invalid and invites the client to retry with credentials.\n3. **403 Forbidden** means the request was understood and any credentials were accepted, but the server refuses to authorise the action, so retrying identically achieves nothing.\n\nAnswer: **403 Forbidden**.",
    approach:
      "Read the class first: 2xx succeeded, 3xx redirected, 4xx the client is at fault, 5xx the server is. Within 4xx, 401 is about who you are and 403 is about what you may do.",
    tags: ["networks", "http"],
    timeTargetSec: 75,
  },
  {
    slug: "cs-switch-domains",
    topic: "os-dbms-networks",
    title: "Collision and broadcast domains",
    prompt:
      "A single 24-port Ethernet switch has one host on each port and no VLANs configured. How many collision domains and broadcast domains exist?",
    options: [
      "1 collision domain and 1 broadcast domain",
      "1 collision domain and 24 broadcast domains",
      "24 collision domains and 1 broadcast domain",
      "24 collision domains and 24 broadcast domains",
    ],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Each switch port is its own segment; each hub port is not.",
      "What does a switch do with a frame addressed to the broadcast MAC address?",
    ],
    solution:
      "1. A switch gives every port its own segment, so a collision on one port cannot affect another: 24 ports mean 24 collision domains.\n2. A switch floods a broadcast frame out of every other port, so all 24 hosts hear one another's broadcasts and form one broadcast domain.\n3. So there are **24 collision domains and 1 broadcast domain**; splitting the broadcast domain would need VLANs or a router.\n\nAnswer: **24 collision domains and 1 broadcast domain**.",
    approach:
      "A switch breaks collision domains, a router breaks broadcast domains, and a hub breaks neither. Those three sentences answer every question in this family.",
    tags: ["networks", "switching"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-tcp-flow-control",
    topic: "os-dbms-networks",
    title: "Flow control in TCP",
    prompt:
      "Which mechanism does TCP use for **flow control** — that is, to stop a fast sender from overwhelming a slow receiver?",
    options: [
      "A leaky-bucket shaper in the network layer",
      "A sliding window whose size the receiver advertises",
      "The slow-start congestion window",
      "The time-to-live field of the IP header",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Flow control protects the receiver; congestion control protects the network.",
      "Every acknowledgement carries a field saying how much more the sender may send.",
    ],
    solution:
      "1. Slow start and the congestion window are congestion control, which protects the network rather than the receiver, and TTL merely limits how many hops a packet may take.\n2. Every TCP acknowledgement carries a window field stating how much buffer space the receiver still has free.\n3. The sender may keep at most that many bytes unacknowledged, so the receiver throttles the sender directly through **A sliding window whose size the receiver advertises**.\n\nAnswer: **A sliding window whose size the receiver advertises**.",
    approach:
      "TCP runs two limits at once and sends no more than the smaller of them: the receiver's advertised window and its own congestion window.",
    tags: ["networks", "tcp", "flow control"],
    timeTargetSec: 90,
  },
  {
    slug: "cs-go-back-n-window",
    topic: "os-dbms-networks",
    title: "Window size in Go-Back-N",
    prompt:
      "A Go-Back-N protocol numbers its frames with a **4-bit** sequence number. What is the largest sender window it may use?",
    options: ["4", "8", "15", "16"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Four bits give a fixed number of distinct sequence numbers.",
      "If the window filled the whole number space, a lost acknowledgement would make a retransmission look like a new frame.",
    ],
    solution:
      "1. Four bits give 2^4 = 16 distinct sequence numbers, 0 through 15.\n2. If the window used all 16, a receiver that lost every acknowledgement could not tell a retransmitted frame from a fresh one carrying the same number.\n3. Leaving one number unused removes the ambiguity, so the largest safe window is 16 − 1 = 15 frames. Selective repeat is stricter still and allows only half the space, 8.\n\nAnswer: **15**.",
    approach:
      "Go-Back-N allows 2^n − 1 and selective repeat 2^(n−1), because selective repeat buffers out-of-order frames and so needs the old and new windows never to overlap.",
    tags: ["networks", "sliding window", "data link"],
    timeTargetSec: 120,
  },
];

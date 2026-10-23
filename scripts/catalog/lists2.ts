/**
 * Singly linked lists — wave 7, batch 34.
 * Real problems only: LeetCode numbered problems and GeeksforGeeks classics
 * that companies list. Worked examples are phrased for CodeKairo.
 *
 * Every problem runs on the structured drivers (src/lib/driver-structures.ts):
 * a `ListNode` travels as its values head to tail (`[1,2,3]`, empty `[]`) and
 * a `TreeNode` (Convert Sorted List to BST) as LeetCode's level order with
 * nulls. The node types belong to the judge, so no solution defines one.
 * Where LeetCode declares a problem in place (Reorder List), the function
 * returns the head it changed.
 *
 * Judge contract: no input or output may hold a `__CODEKAIRO_` sentinel. JS
 * solutions must be Node 12-safe: no ??, ?., at(), replaceAll, flat or
 * flatMap. The C harness has no math.h or limits.h; the judge's Rust is 1.40.
 * Each language's entry function comes first; C declares its static helpers
 * above it.
 *
 * Kotlin reads a node's value as n.`val`, and a code`…` block cannot hold a
 * backtick, so the Kotlin solutions use the `kt` tag below, which writes \`
 * in the source as a plain backtick.
 *
 * Rust owns its nodes through `Option<Box<ListNode>>`, which has no aliasing
 * tail pointer; where a solution elsewhere keeps two or three moving pointers
 * (partition, odd/even, reorder, reverse a range) the Rust one detaches the
 * boxes into a Vec, reorders the boxes and relinks them — the same nodes,
 * the same order, no new values.
 *
 * Every generator stays at 40 nodes or fewer, because the judge runs all 5,000
 * cases of a problem in one process and Python/Ruby/PHP pay ~30× V8. The
 * references work on plain arrays (filter, splice, sort, BigInt arithmetic,
 * an O(n²) scan for the next greater value), so they share nothing with the
 * authored pointer solutions but the statement.
 *
 * int32 rule: the digit-list sums are lists of digits, never a number; Rotate
 * List's k stays at LeetCode's 2·10^9; every other answer is a list of the
 * input's own values or a count/distance below the list's length.
 */
import {
  code, describe, explain, fmtIntArr, fmtTree, pick, ri, shuffle,
  type CatalogProblem, type Rng, type TNode,
} from "./types.js";

/** A Kotlin solution: like code`…`, with \` standing for the backtick `val` needs. */
const kt = (s: TemplateStringsArray) => code(s).replace(/\\`/g, "`");

/** A list length for a generator: mostly short, sometimes up to 40. */
const listLen = (rng: Rng, min = 0) => ri(rng, min, Math.max(min, pick(rng, [1, 2, 4, 10, 25, 40])));

/** `len` values from [lo, hi]. */
const randVals = (rng: Rng, len: number, lo: number, hi: number) => Array.from({ length: len }, () => ri(rng, lo, hi));

export const LISTS2_PROBLEMS: CatalogProblem[] = [

  // ── Remove Every k-th Node (GFG) ────────────────────────────────
  (() => {
    const ref = (a: number[], k: number) => a.filter((_, i) => (i + 1) % k !== 0);
    return {
      slug: "remove-every-kth-node",
      title: "Remove Every k-th Node of a Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Simulation", "Amazon"],
      signature: { funcName: "deleteK", params: [{ name: "head", type: "ListNode" as const }, { name: "k", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and an integer `k`, delete every `k`-th node of the list — the `k`-th, the `2k`-th, the `3k`-th node and so on, counting positions from 1 in the **original** list — and return the head of what remains.\n\nIf `k` is larger than the length of the list nothing is deleted; if `k` is 1 every node is deleted and the answer is the empty list.",
        [
          { in: "head = [1,2,3,4,5,6,7,8], k = 3", out: "[1,2,4,5,7,8]", note: "The 3rd and 6th nodes (values 3 and 6) are removed." },
          { in: "head = [1,2,3,4,5,6,7,8,9,10], k = 2", out: "[1,3,5,7,9]" },
          { in: "head = [4,9], k = 1", out: "[]", note: "With k = 1 every position is a multiple of k." },
        ],
        ["1 <= number of nodes <= 10^5", "1 <= Node.val <= 10^6", "1 <= k <= 10^5"]),
      hints: [
        "A node is deleted exactly when its 1-based position is a multiple of `k`.",
        "Walk the list once with a counter, keeping a pointer to the node before the current one so it can be unlinked.",
        "A dummy node in front of the head makes deleting the first node (k = 1) no different from deleting any other.",
      ],
      editorial: explain({
        idea: "Positions are fixed by the original list, so a single walk with a counter decides every node: a position that is a multiple of `k` is unlinked, every other node is kept.",
        steps: [
          "Put a dummy node before `head` and set `prev = dummy`, `count = 0`.",
          "While `prev.next` exists, increase `count`; if `count % k == 0`, unlink the node with `prev.next = prev.next.next` and stay put; otherwise move `prev` forward.",
          "Return `dummy.next`.",
        ],
        why: "`count` is incremented exactly once for every node of the original list, in order, whether the node is kept or removed — so it always equals that node's original position, and the test `count % k == 0` removes exactly the multiples of `k`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Do not advance `prev` after unlinking — its new successor still has to be counted.",
          "k = 1 empties the list; without a dummy node the head needs special handling.",
          "Counting positions in the shrinking list instead of the original one deletes the wrong nodes.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8]\n3", expectedOutput: "[1,2,4,5,7,8]" },
        { input: "[1,2,3,4,5,6,7,8,9,10]\n2", expectedOutput: "[1,3,5,7,9]" },
        { input: "[4,9]\n1", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng, 1), 1, pick(rng, [10, 1000, 1000000]));
        const r = rng();
        const k = r < 0.1 ? 1 : r < 0.8 ? ri(rng, 1, a.length) : ri(rng, a.length + 1, pick(rng, [a.length + 3, 100000]));
        return { input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteK(head: Optional[ListNode], k: int) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              prev = dummy
              count = 0
              while prev.next:
                  count += 1
                  if count % k == 0:
                      prev.next = prev.next.next
                  else:
                      prev = prev.next
              return dummy.next
        `,
        javascript: code`
          var deleteK = function(head, k) {
              var dummy = new ListNode(0, head), prev = dummy, count = 0;
              while (prev.next !== null) {
                  count++;
                  if (count % k === 0) prev.next = prev.next.next;
                  else prev = prev.next;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function deleteK(head: ListNode | null, k: number): ListNode | null {
              var dummy = new ListNode(0, head), prev = dummy, count = 0;
              while (prev.next !== null) {
                  count++;
                  if (count % k === 0) prev.next = prev.next.next;
                  else prev = prev.next;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode deleteK(ListNode head, int k) {
              ListNode dummy = new ListNode(0, head), prev = dummy;
              int count = 0;
              while (prev.next != null) {
                  count++;
                  if (count % k == 0) prev.next = prev.next.next;
                  else prev = prev.next;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* deleteK(ListNode* head, int k) {
              ListNode dummy(0, head);
              ListNode* prev = &dummy;
              int count = 0;
              while (prev->next) {
                  count++;
                  if (count % k == 0) prev->next = prev->next->next;
                  else prev = prev->next;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* deleteK(struct ListNode* head, int k) {
              struct ListNode dummy;
              struct ListNode* prev = &dummy;
              int count = 0;
              dummy.next = head;
              while (prev->next != NULL) {
                  count++;
                  if (count % k == 0) {
                      struct ListNode* gone = prev->next;
                      prev->next = gone->next;
                      free(gone);
                  } else {
                      prev = prev->next;
                  }
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode DeleteK(ListNode head, int k)
          {
              var dummy = new ListNode(0, head);
              var prev = dummy;
              int count = 0;
              while (prev.next != null)
              {
                  count++;
                  if (count % k == 0) prev.next = prev.next.next;
                  else prev = prev.next;
              }
              return dummy.next;
          }
        `,
        go: code`
          func deleteK(head *ListNode, k int) *ListNode {
              dummy := &ListNode{Next: head}
              prev := dummy
              count := 0
              for prev.Next != nil {
                  count++
                  if count%k == 0 {
                      prev.Next = prev.Next.Next
                  } else {
                      prev = prev.Next
                  }
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun deleteK(head: ListNode?, k: Int): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var prev = dummy
              var count = 0
              while (prev.next != null) {
                  count++
                  if (count % k == 0) prev.next = prev.next!!.next
                  else prev = prev.next!!
              }
              return dummy.next
          }
        `,
        swift: code`
          func deleteK(_ head: ListNode?, _ k: Int) -> ListNode? {
              let dummy = ListNode(0, head)
              var prev = dummy
              var count = 0
              while let nx = prev.next {
                  count += 1
                  if count % k == 0 { prev.next = nx.next } else { prev = nx }
              }
              return dummy.next
          }
        `,
        rust: code`
          fn deleteK(head: Option<Box<ListNode>>, k: i32) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut count = 0;
              let mut cur = &mut head;
              while cur.is_some() {
                  count += 1;
                  if count % k == 0 {
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
          function deleteK($head, $k) {
              $dummy = new ListNode(0, $head);
              $prev = $dummy;
              $count = 0;
              while ($prev->next !== null) {
                  $count++;
                  if ($count % $k === 0) $prev->next = $prev->next->next;
                  else $prev = $prev->next;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def deleteK(head, k)
            dummy = ListNode.new(0, head)
            prev = dummy
            count = 0
            while prev.next
              count += 1
              if count % k == 0
                prev.next = prev.next.next
              else
                prev = prev.next
              end
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Delete N Nodes After M Nodes (GFG / LC 1474) ────────────────
  (() => {
    const ref = (a: number[], m: number, n: number) => a.filter((_, i) => i % (m + n) < m);
    return {
      slug: "delete-n-nodes-after-m-nodes",
      title: "Delete N Nodes After M Nodes of a Linked List",
      difficulty: "EASY" as const,
      tags: ["Linked List", "Simulation", "Microsoft", "Amazon"],
      signature: { funcName: "deleteNodes", params: [{ name: "head", type: "ListNode" as const }, { name: "m", type: "int" as const }, { name: "n", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list and two integers `m` and `n`. Walk the list from the head and repeat this pattern until the list runs out:\n\n- **keep** the next `m` nodes,\n- then **delete** the next `n` nodes.\n\nIf the list ends in the middle of either step, simply stop. Return the head of the list after the deletions.",
        [
          { in: "head = [1,2,3,4,5,6,7,8,9,10,11,12,13], m = 2, n = 3", out: "[1,2,6,7,11,12]", note: "Keep 1,2; delete 3,4,5; keep 6,7; delete 8,9,10; keep 11,12; delete 13." },
          { in: "head = [1,2,3,4,5,6,7,8,9,10,11], m = 1, n = 3", out: "[1,5,9]" },
          { in: "head = [7,3,5], m = 4, n = 2", out: "[7,3,5]", note: "The list ends while still keeping, so nothing is deleted." },
        ],
        ["1 <= number of nodes <= 10^4", "1 <= Node.val <= 10^6", "1 <= m, n <= 1000"]),
      hints: [
        "The pattern repeats every `m + n` nodes.",
        "Walk `m - 1` steps to the last node you keep, then walk past the next `n` nodes.",
        "Link the last kept node directly to the node after the deleted block, and start the next round from there. Stop as soon as a pointer becomes null.",
      ],
      editorial: explain({
        idea: "Each round keeps a block of `m` nodes and cuts out the following block of `n`. Cutting a block out of a singly linked list is one pointer change: link the block's predecessor to its successor.",
        steps: [
          "Set `cur = head`.",
          "While `cur` is not null: advance `cur` `m - 1` times (stopping if it becomes null) — `cur` is now the last kept node of this round.",
          "From `cur.next`, skip `n` nodes (stopping at null) to reach `after`.",
          "Set `cur.next = after` and `cur = after`; repeat.",
          "Return `head` — the first node is always kept because `m >= 1`.",
        ],
        why: "Every round starts at the first node of a fresh keep-block, keeps exactly `m` nodes (or fewer if the list ends) and removes exactly the next `n`, which is precisely the pattern. Each node is visited once.",
        time: "O(L) for a list of L nodes",
        space: "O(1)",
        pitfalls: [
          "The list may end inside the keep block; check for null while advancing `m - 1` steps.",
          "The list may end inside the delete block; `after` is then null and the list simply ends at `cur`.",
          "Off by one: reaching the last kept node takes `m - 1` steps, not `m`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8,9,10,11,12,13]\n2\n3", expectedOutput: "[1,2,6,7,11,12]" },
        { input: "[1,2,3,4,5,6,7,8,9,10,11]\n1\n3", expectedOutput: "[1,5,9]" },
        { input: "[7,3,5]\n4\n2", expectedOutput: "[7,3,5]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng, 1), 1, pick(rng, [9, 1000, 1000000]));
        const m = rng() < 0.85 ? ri(rng, 1, Math.min(6, a.length + 1)) : ri(rng, 1, 1000);
        const n = rng() < 0.85 ? ri(rng, 1, 6) : ri(rng, 1, 1000);
        return { input: `${fmtIntArr(a)}\n${m}\n${n}`, expectedOutput: fmtIntArr(ref(a, m, n)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteNodes(head: Optional[ListNode], m: int, n: int) -> Optional[ListNode]:
              cur = head
              while cur:
                  for _ in range(m - 1):
                      if cur is None:
                          break
                      cur = cur.next
                  if cur is None:
                      break
                  after = cur.next
                  for _ in range(n):
                      if after is None:
                          break
                      after = after.next
                  cur.next = after
                  cur = after
              return head
        `,
        javascript: code`
          var deleteNodes = function(head, m, n) {
              var cur = head;
              while (cur !== null) {
                  for (var i = 1; i < m && cur !== null; i++) cur = cur.next;
                  if (cur === null) break;
                  var after = cur.next;
                  for (var j = 0; j < n && after !== null; j++) after = after.next;
                  cur.next = after;
                  cur = after;
              }
              return head;
          };
        `,
        typescript: code`
          function deleteNodes(head: ListNode | null, m: number, n: number): ListNode | null {
              var cur = head;
              while (cur !== null) {
                  for (var i = 1; i < m && cur !== null; i++) cur = cur.next;
                  if (cur === null) break;
                  var after = cur.next;
                  for (var j = 0; j < n && after !== null; j++) after = after.next;
                  cur.next = after;
                  cur = after;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode deleteNodes(ListNode head, int m, int n) {
              ListNode cur = head;
              while (cur != null) {
                  for (int i = 1; i < m && cur != null; i++) cur = cur.next;
                  if (cur == null) break;
                  ListNode after = cur.next;
                  for (int j = 0; j < n && after != null; j++) after = after.next;
                  cur.next = after;
                  cur = after;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* deleteNodes(ListNode* head, int m, int n) {
              ListNode* cur = head;
              while (cur) {
                  for (int i = 1; i < m && cur; i++) cur = cur->next;
                  if (!cur) break;
                  ListNode* after = cur->next;
                  for (int j = 0; j < n && after; j++) after = after->next;
                  cur->next = after;
                  cur = after;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* deleteNodes(struct ListNode* head, int m, int n) {
              struct ListNode* cur = head;
              while (cur != NULL) {
                  for (int i = 1; i < m && cur != NULL; i++) cur = cur->next;
                  if (cur == NULL) break;
                  struct ListNode* after = cur->next;
                  for (int j = 0; j < n && after != NULL; j++) {
                      struct ListNode* gone = after;
                      after = after->next;
                      free(gone);
                  }
                  cur->next = after;
                  cur = after;
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode DeleteNodes(ListNode head, int m, int n)
          {
              var cur = head;
              while (cur != null)
              {
                  for (int i = 1; i < m && cur != null; i++) cur = cur.next;
                  if (cur == null) break;
                  var after = cur.next;
                  for (int j = 0; j < n && after != null; j++) after = after.next;
                  cur.next = after;
                  cur = after;
              }
              return head;
          }
        `,
        go: code`
          func deleteNodes(head *ListNode, m int, n int) *ListNode {
              cur := head
              for cur != nil {
                  for i := 1; i < m && cur != nil; i++ {
                      cur = cur.Next
                  }
                  if cur == nil {
                      break
                  }
                  after := cur.Next
                  for j := 0; j < n && after != nil; j++ {
                      after = after.Next
                  }
                  cur.Next = after
                  cur = after
              }
              return head
          }
        `,
        kotlin: kt`
          fun deleteNodes(head: ListNode?, m: Int, n: Int): ListNode? {
              var cur = head
              while (cur != null) {
                  var i = 1
                  while (i < m && cur != null) { cur = cur.next; i++ }
                  if (cur == null) break
                  var after = cur.next
                  var j = 0
                  while (j < n && after != null) { after = after.next; j++ }
                  cur.next = after
                  cur = after
              }
              return head
          }
        `,
        swift: code`
          func deleteNodes(_ head: ListNode?, _ m: Int, _ n: Int) -> ListNode? {
              var cur = head
              while cur != nil {
                  var i = 1
                  while i < m && cur != nil { cur = cur!.next; i += 1 }
                  guard let last = cur else { break }
                  var after = last.next
                  var j = 0
                  while j < n && after != nil { after = after!.next; j += 1 }
                  last.next = after
                  cur = after
              }
              return head
          }
        `,
        rust: code`
          fn deleteNodes(head: Option<Box<ListNode>>, m: i32, n: i32) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut pos = 0;
              let mut cur = &mut head;
              while cur.is_some() {
                  if pos % (m + n) >= m {
                      let next = cur.as_mut().unwrap().next.take();
                      *cur = next;
                  } else {
                      cur = &mut cur.as_mut().unwrap().next;
                  }
                  pos += 1;
              }
              head
          }
        `,
        php: code`
          function deleteNodes($head, $m, $n) {
              $cur = $head;
              while ($cur !== null) {
                  for ($i = 1; $i < $m && $cur !== null; $i++) $cur = $cur->next;
                  if ($cur === null) break;
                  $after = $cur->next;
                  for ($j = 0; $j < $n && $after !== null; $j++) $after = $after->next;
                  $cur->next = $after;
                  $cur = $after;
              }
              return $head;
          }
        `,
        ruby: code`
          def deleteNodes(head, m, n)
            cur = head
            while cur
              i = 1
              while i < m && cur
                cur = cur.next
                i += 1
              end
              break if cur.nil?
              after = cur.next
              j = 0
              while j < n && after
                after = after.next
                j += 1
              end
              cur.next = after
              cur = after
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Add Two Numbers (LC 2) ──────────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const num = (d: number[]) => BigInt(d.slice().reverse().join(""));
      return String(num(a) + num(b)).split("").reverse().map(Number);
    };
    const digits = (rng: Rng) => {
      const len = listLen(rng, 1);
      const r = rng();
      const d = randVals(rng, len, r < 0.15 ? 9 : 0, 9);
      if (len === 1 && rng() < 0.2) d[0] = 0;
      else if (d[len - 1] === 0) d[len - 1] = ri(rng, 1, 9);
      return d;
    };
    return {
      slug: "add-two-numbers",
      title: "Add Two Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Math", "Recursion", "Amazon", "Microsoft", "Google", "Bloomberg"],
      signature: { funcName: "addTwoNumbers", params: [{ name: "l1", type: "ListNode" as const }, { name: "l2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Two non-negative integers are stored in two non-empty singly linked lists, `l1` and `l2`, one decimal digit per node, with the digits in **reverse order** — the head holds the ones digit. Neither number has leading zeros, except the number 0 itself.\n\nReturn their sum as a linked list in the same reversed-digit form.",
        [
          { in: "l1 = [2,4,3], l2 = [5,6,4]", out: "[7,0,8]", note: "342 + 465 = 807, stored as 7 → 0 → 8." },
          { in: "l1 = [0], l2 = [0]", out: "[0]" },
          { in: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", out: "[8,9,9,9,0,0,0,1]", note: "9999999 + 9999 = 10009998; the final carry adds a new node." },
        ],
        ["The number of nodes in each list is in the range [1, 100]", "0 <= Node.val <= 9", "Neither number has leading zeros, except the number 0 itself"]),
      hints: [
        "The heads are the ones digits, so the lists are already in the order grade-school addition works in.",
        "Walk both lists together, adding the two digits and the carry; the new digit is `sum % 10` and the new carry `sum / 10`.",
        "Keep going while either list has nodes **or** the carry is non-zero — the last carry can create one extra node.",
      ],
      editorial: explain({
        idea: "Reversed digits mean the least significant digits come first, which is exactly the order column addition proceeds in. One simultaneous walk of both lists, with a carry, produces the answer digit by digit.",
        steps: [
          "Create a dummy node and a `tail` pointer; set `carry = 0`.",
          "While `l1`, `l2` or `carry` is non-zero: `sum = carry + (l1 ? l1.val : 0) + (l2 ? l2.val : 0)`.",
          "Append a node with `sum % 10`, set `carry = sum / 10`, and advance whichever lists are not exhausted.",
          "Return `dummy.next`.",
        ],
        why: "This is the column method: each output digit is the sum of the two digits in that column plus the carry from the column to its right, and the carry is always 0 or 1. Treating a finished list as contributing 0s handles numbers of different lengths.",
        time: "O(max(m, n))",
        space: "O(max(m, n)) for the result list",
        pitfalls: [
          "Converting the lists to built-in integers overflows — a number can have 100 digits.",
          "Forgetting the final carry loses the leading 1 (e.g. 5 + 5 = 10).",
          "The lists can have different lengths; keep reading the longer one after the shorter one ends.",
        ],
      }),
      examples: [
        { input: "[2,4,3]\n[5,6,4]", expectedOutput: "[7,0,8]" },
        { input: "[0]\n[0]", expectedOutput: "[0]" },
        { input: "[9,9,9,9,9,9,9]\n[9,9,9,9]", expectedOutput: "[8,9,9,9,0,0,0,1]" },
      ],
      gen: (rng: Rng) => {
        const a = digits(rng), b = digits(rng);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def addTwoNumbers(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0)
              tail = dummy
              carry = 0
              while l1 or l2 or carry:
                  total = carry
                  if l1:
                      total += l1.val
                      l1 = l1.next
                  if l2:
                      total += l2.val
                      l2 = l2.next
                  tail.next = ListNode(total % 10)
                  tail = tail.next
                  carry = total // 10
              return dummy.next
        `,
        javascript: code`
          var addTwoNumbers = function(l1, l2) {
              var dummy = new ListNode(0), tail = dummy, carry = 0;
              while (l1 !== null || l2 !== null || carry !== 0) {
                  var sum = carry;
                  if (l1 !== null) { sum += l1.val; l1 = l1.next; }
                  if (l2 !== null) { sum += l2.val; l2 = l2.next; }
                  tail.next = new ListNode(sum % 10);
                  tail = tail.next;
                  carry = Math.floor(sum / 10);
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
              var dummy = new ListNode(0), tail = dummy, carry = 0;
              while (l1 !== null || l2 !== null || carry !== 0) {
                  var sum = carry;
                  if (l1 !== null) { sum += l1.val; l1 = l1.next; }
                  if (l2 !== null) { sum += l2.val; l2 = l2.next; }
                  tail.next = new ListNode(sum % 10);
                  tail = tail.next;
                  carry = Math.floor(sum / 10);
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode addTwoNumbers(ListNode l1, ListNode l2) {
              ListNode dummy = new ListNode(0), tail = dummy;
              int carry = 0;
              while (l1 != null || l2 != null || carry != 0) {
                  int sum = carry;
                  if (l1 != null) { sum += l1.val; l1 = l1.next; }
                  if (l2 != null) { sum += l2.val; l2 = l2.next; }
                  tail.next = new ListNode(sum % 10);
                  tail = tail.next;
                  carry = sum / 10;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
              ListNode dummy(0);
              ListNode* tail = &dummy;
              int carry = 0;
              while (l1 || l2 || carry) {
                  int sum = carry;
                  if (l1) { sum += l1->val; l1 = l1->next; }
                  if (l2) { sum += l2->val; l2 = l2->next; }
                  tail->next = new ListNode(sum % 10);
                  tail = tail->next;
                  carry = sum / 10;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
              struct ListNode dummy;
              struct ListNode* tail = &dummy;
              int carry = 0;
              dummy.next = NULL;
              while (l1 != NULL || l2 != NULL || carry != 0) {
                  int sum = carry;
                  if (l1 != NULL) { sum += l1->val; l1 = l1->next; }
                  if (l2 != NULL) { sum += l2->val; l2 = l2->next; }
                  struct ListNode* node = (struct ListNode*) malloc(sizeof(struct ListNode));
                  node->val = sum % 10;
                  node->next = NULL;
                  tail->next = node;
                  tail = node;
                  carry = sum / 10;
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode AddTwoNumbers(ListNode l1, ListNode l2)
          {
              var dummy = new ListNode(0);
              var tail = dummy;
              int carry = 0;
              while (l1 != null || l2 != null || carry != 0)
              {
                  int sum = carry;
                  if (l1 != null) { sum += l1.val; l1 = l1.next; }
                  if (l2 != null) { sum += l2.val; l2 = l2.next; }
                  tail.next = new ListNode(sum % 10);
                  tail = tail.next;
                  carry = sum / 10;
              }
              return dummy.next;
          }
        `,
        go: code`
          func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
              dummy := &ListNode{}
              tail := dummy
              carry := 0
              for l1 != nil || l2 != nil || carry != 0 {
                  sum := carry
                  if l1 != nil {
                      sum += l1.Val
                      l1 = l1.Next
                  }
                  if l2 != nil {
                      sum += l2.Val
                      l2 = l2.Next
                  }
                  tail.Next = &ListNode{Val: sum % 10}
                  tail = tail.Next
                  carry = sum / 10
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {
              var a = l1
              var b = l2
              val dummy = ListNode(0)
              var tail = dummy
              var carry = 0
              while (a != null || b != null || carry != 0) {
                  var sum = carry
                  if (a != null) { sum += a.\`val\`; a = a.next }
                  if (b != null) { sum += b.\`val\`; b = b.next }
                  val node = ListNode(sum % 10)
                  tail.next = node
                  tail = node
                  carry = sum / 10
              }
              return dummy.next
          }
        `,
        swift: code`
          func addTwoNumbers(_ l1: ListNode?, _ l2: ListNode?) -> ListNode? {
              var a = l1, b = l2
              let dummy = ListNode(0)
              var tail = dummy
              var carry = 0
              while a != nil || b != nil || carry != 0 {
                  var sum = carry
                  if let x = a { sum += x.val; a = x.next }
                  if let y = b { sum += y.val; b = y.next }
                  let node = ListNode(sum % 10)
                  tail.next = node
                  tail = node
                  carry = sum / 10
              }
              return dummy.next
          }
        `,
        rust: code`
          fn addTwoNumbers(l1: Option<Box<ListNode>>, l2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let (mut a, mut b) = (l1, l2);
              let mut carry = 0;
              let mut digits: Vec<i32> = Vec::new();
              while a.is_some() || b.is_some() || carry != 0 {
                  let mut sum = carry;
                  if let Some(n) = a { sum += n.val; a = n.next; }
                  if let Some(n) = b { sum += n.val; b = n.next; }
                  digits.push(sum % 10);
                  carry = sum / 10;
              }
              let mut head: Option<Box<ListNode>> = None;
              for &d in digits.iter().rev() {
                  let mut node = Box::new(ListNode::new(d));
                  node.next = head;
                  head = Some(node);
              }
              head
          }
        `,
        php: code`
          function addTwoNumbers($l1, $l2) {
              $dummy = new ListNode(0);
              $tail = $dummy;
              $carry = 0;
              while ($l1 !== null || $l2 !== null || $carry !== 0) {
                  $sum = $carry;
                  if ($l1 !== null) { $sum += $l1->val; $l1 = $l1->next; }
                  if ($l2 !== null) { $sum += $l2->val; $l2 = $l2->next; }
                  $tail->next = new ListNode($sum % 10);
                  $tail = $tail->next;
                  $carry = intdiv($sum, 10);
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def addTwoNumbers(l1, l2)
            dummy = ListNode.new(0)
            tail = dummy
            carry = 0
            while l1 || l2 || carry != 0
              sum = carry
              if l1
                sum += l1.val
                l1 = l1.next
              end
              if l2
                sum += l2.val
                l2 = l2.next
              end
              tail.next = ListNode.new(sum % 10)
              tail = tail.next
              carry = sum / 10
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Remove Nth Node From End of List (LC 19) ────────────────────
  (() => {
    const ref = (a: number[], n: number) => a.filter((_, i) => i !== a.length - n);
    return {
      slug: "remove-nth-node-from-end-of-list",
      title: "Remove Nth Node From End of List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Meta", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "removeNthFromEnd", params: [{ name: "head", type: "ListNode" as const }, { name: "n", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and an integer `n`, remove the `n`-th node **counted from the end** of the list (the last node is the 1st from the end), and return the head of the resulting list.",
        [
          { in: "head = [1,2,3,4,5], n = 2", out: "[1,2,3,5]", note: "The 2nd node from the end holds 4." },
          { in: "head = [1], n = 1", out: "[]", note: "Removing the only node leaves an empty list." },
          { in: "head = [1,2], n = 2", out: "[2]", note: "The node to remove can be the head itself." },
        ],
        ["The number of nodes in the list is sz", "1 <= sz <= 30", "0 <= Node.val <= 100", "1 <= n <= sz"],
        "Can you do it in one pass?"),
      hints: [
        "Counting the length first and then walking `length - n` steps works, in two passes.",
        "For one pass, keep two pointers exactly `n` nodes apart; when the front one reaches the end, the back one is just before the node to delete.",
        "Start both pointers at a dummy node placed before the head, so deleting the head needs no special case.",
      ],
      editorial: explain({
        idea: "Two pointers with a fixed gap: move `fast` `n` nodes ahead of `slow`, then advance both until `fast` is on the last node. `slow` then sits right before the node to remove.",
        steps: [
          "Create a dummy node pointing at `head`; set `fast = slow = dummy`.",
          "Advance `fast` `n` times.",
          "While `fast.next` is not null, advance both `fast` and `slow`.",
          "Unlink with `slow.next = slow.next.next` and return `dummy.next`.",
        ],
        why: "With the dummy at position 0 and the list at positions 1..L, `fast` ends at position L and `slow` at L − n, the predecessor of position L − n + 1, which is the n-th node from the end.",
        time: "O(L)",
        space: "O(1)",
        pitfalls: [
          "When n equals the length, the head itself is removed — the dummy node makes that the ordinary case.",
          "Stopping when `fast` is null (instead of `fast.next`) leaves `slow` one node too far.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[1,2,3,5]" },
        { input: "[1]\n1", expectedOutput: "[]" },
        { input: "[1,2]\n2", expectedOutput: "[2]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, ri(rng, 1, pick(rng, [1, 3, 10, 30])), 0, 100);
        const n = ri(rng, 1, a.length);
        return { input: `${fmtIntArr(a)}\n${n}`, expectedOutput: fmtIntArr(ref(a, n)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def removeNthFromEnd(head: Optional[ListNode], n: int) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              fast = slow = dummy
              for _ in range(n):
                  fast = fast.next
              while fast.next:
                  fast = fast.next
                  slow = slow.next
              slow.next = slow.next.next
              return dummy.next
        `,
        javascript: code`
          var removeNthFromEnd = function(head, n) {
              var dummy = new ListNode(0, head), fast = dummy, slow = dummy;
              for (var i = 0; i < n; i++) fast = fast.next;
              while (fast.next !== null) { fast = fast.next; slow = slow.next; }
              slow.next = slow.next.next;
              return dummy.next;
          };
        `,
        typescript: code`
          function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
              var dummy = new ListNode(0, head), fast = dummy, slow = dummy;
              for (var i = 0; i < n; i++) fast = fast.next;
              while (fast.next !== null) { fast = fast.next; slow = slow.next; }
              slow.next = slow.next.next;
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode removeNthFromEnd(ListNode head, int n) {
              ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
              for (int i = 0; i < n; i++) fast = fast.next;
              while (fast.next != null) { fast = fast.next; slow = slow.next; }
              slow.next = slow.next.next;
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* removeNthFromEnd(ListNode* head, int n) {
              ListNode dummy(0, head);
              ListNode *fast = &dummy, *slow = &dummy;
              for (int i = 0; i < n; i++) fast = fast->next;
              while (fast->next) { fast = fast->next; slow = slow->next; }
              slow->next = slow->next->next;
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* removeNthFromEnd(struct ListNode* head, int n) {
              struct ListNode dummy;
              struct ListNode *fast = &dummy, *slow = &dummy;
              dummy.next = head;
              for (int i = 0; i < n; i++) fast = fast->next;
              while (fast->next != NULL) { fast = fast->next; slow = slow->next; }
              struct ListNode* gone = slow->next;
              slow->next = gone->next;
              free(gone);
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode RemoveNthFromEnd(ListNode head, int n)
          {
              var dummy = new ListNode(0, head);
              ListNode fast = dummy, slow = dummy;
              for (int i = 0; i < n; i++) fast = fast.next;
              while (fast.next != null) { fast = fast.next; slow = slow.next; }
              slow.next = slow.next.next;
              return dummy.next;
          }
        `,
        go: code`
          func removeNthFromEnd(head *ListNode, n int) *ListNode {
              dummy := &ListNode{Next: head}
              fast, slow := dummy, dummy
              for i := 0; i < n; i++ {
                  fast = fast.Next
              }
              for fast.Next != nil {
                  fast, slow = fast.Next, slow.Next
              }
              slow.Next = slow.Next.Next
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun removeNthFromEnd(head: ListNode?, n: Int): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var fast: ListNode = dummy
              var slow: ListNode = dummy
              repeat(n) { fast = fast.next!! }
              while (fast.next != null) { fast = fast.next!!; slow = slow.next!! }
              slow.next = slow.next!!.next
              return dummy.next
          }
        `,
        swift: code`
          func removeNthFromEnd(_ head: ListNode?, _ n: Int) -> ListNode? {
              let dummy = ListNode(0, head)
              var fast = dummy, slow = dummy
              for _ in 0..<n { fast = fast.next! }
              while let nx = fast.next { fast = nx; slow = slow.next! }
              slow.next = slow.next!.next
              return dummy.next
          }
        `,
        rust: code`
          fn removeNthFromEnd(head: Option<Box<ListNode>>, n: i32) -> Option<Box<ListNode>> {
              let mut len = 0;
              let mut p = &head;
              while let Some(node) = p { len += 1; p = &node.next; }
              let mut head = head;
              let mut cur = &mut head;
              for _ in 0..(len - n) { cur = &mut cur.as_mut().unwrap().next; }
              let next = cur.as_mut().unwrap().next.take();
              *cur = next;
              head
          }
        `,
        php: code`
          function removeNthFromEnd($head, $n) {
              $dummy = new ListNode(0, $head);
              $fast = $dummy;
              $slow = $dummy;
              for ($i = 0; $i < $n; $i++) $fast = $fast->next;
              while ($fast->next !== null) { $fast = $fast->next; $slow = $slow->next; }
              $slow->next = $slow->next->next;
              return $dummy->next;
          }
        `,
        ruby: code`
          def removeNthFromEnd(head, n)
            dummy = ListNode.new(0, head)
            fast = slow = dummy
            n.times { fast = fast.next }
            while fast.next
              fast = fast.next
              slow = slow.next
            end
            slow.next = slow.next.next
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Swap Nodes in Pairs (LC 24) ─────────────────────────────────
  (() => {
    const ref = (a: number[]) => {
      const b = a.slice();
      for (let i = 0; i + 1 < b.length; i += 2) [b[i], b[i + 1]] = [b[i + 1], b[i]];
      return b;
    };
    return {
      slug: "swap-nodes-in-pairs",
      title: "Swap Nodes in Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Recursion", "Amazon", "Microsoft", "Meta", "Bloomberg"],
      signature: { funcName: "swapPairs", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, swap every two adjacent nodes — the 1st with the 2nd, the 3rd with the 4th, and so on — and return the head of the new list. A last node without a partner stays where it is.\n\nChange the links, not the values: the nodes themselves must move.",
        [
          { in: "head = [1,2,3,4]", out: "[2,1,4,3]" },
          { in: "head = []", out: "[]" },
          { in: "head = [1,2,3]", out: "[2,1,3]", note: "Node 3 has no partner and keeps its place." },
        ],
        ["The number of nodes in the list is in the range [0, 100]", "0 <= Node.val <= 100"]),
      hints: [
        "Work on one pair at a time: the pair `(a, b)` that follows some node `prev` becomes `(b, a)`.",
        "Three links change per pair: `prev.next = b`, `a.next = b.next`, `b.next = a`.",
        "Then `a` is the node before the next pair. A dummy node before the head plays `prev` for the first pair.",
      ],
      editorial: explain({
        idea: "Walk the list pair by pair, keeping the node before each pair. Swapping a pair is three link changes, and the first node of the old pair ends up as the predecessor of the next one.",
        steps: [
          "Create a dummy node pointing at `head`; set `prev = dummy`.",
          "While `prev.next` and `prev.next.next` exist: let `a = prev.next`, `b = a.next`.",
          "Relink: `a.next = b.next`, `b.next = a`, `prev.next = b`.",
          "Move on with `prev = a`.",
          "Return `dummy.next`.",
        ],
        why: "Each iteration turns `prev → a → b → rest` into `prev → b → a → rest`, touching nothing else, and leaves `prev` before `rest`. The loop stops when fewer than two nodes remain, which leaves an odd last node untouched.",
        time: "O(n)",
        space: "O(1) iteratively (the recursive version uses O(n) stack)",
        pitfalls: [
          "Order the three assignments so no link is lost: save `b.next` (via `a.next = b.next`) before overwriting `b.next`.",
          "Swapping values instead of nodes defeats the exercise.",
          "Both the empty list and a single node must come back unchanged.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[2,1,4,3]" },
        { input: "[]", expectedOutput: "[]" },
        { input: "[1,2,3]", expectedOutput: "[2,1,3]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng), 0, 100);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def swapPairs(head: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              prev = dummy
              while prev.next and prev.next.next:
                  a = prev.next
                  b = a.next
                  a.next = b.next
                  b.next = a
                  prev.next = b
                  prev = a
              return dummy.next
        `,
        javascript: code`
          var swapPairs = function(head) {
              var dummy = new ListNode(0, head), prev = dummy;
              while (prev.next !== null && prev.next.next !== null) {
                  var a = prev.next, b = a.next;
                  a.next = b.next;
                  b.next = a;
                  prev.next = b;
                  prev = a;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function swapPairs(head: ListNode | null): ListNode | null {
              var dummy = new ListNode(0, head), prev = dummy;
              while (prev.next !== null && prev.next.next !== null) {
                  var a = prev.next, b = a.next;
                  a.next = b.next;
                  b.next = a;
                  prev.next = b;
                  prev = a;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode swapPairs(ListNode head) {
              ListNode dummy = new ListNode(0, head), prev = dummy;
              while (prev.next != null && prev.next.next != null) {
                  ListNode a = prev.next, b = a.next;
                  a.next = b.next;
                  b.next = a;
                  prev.next = b;
                  prev = a;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* swapPairs(ListNode* head) {
              ListNode dummy(0, head);
              ListNode* prev = &dummy;
              while (prev->next && prev->next->next) {
                  ListNode* a = prev->next;
                  ListNode* b = a->next;
                  a->next = b->next;
                  b->next = a;
                  prev->next = b;
                  prev = a;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* swapPairs(struct ListNode* head) {
              struct ListNode dummy;
              struct ListNode* prev = &dummy;
              dummy.next = head;
              while (prev->next != NULL && prev->next->next != NULL) {
                  struct ListNode* a = prev->next;
                  struct ListNode* b = a->next;
                  a->next = b->next;
                  b->next = a;
                  prev->next = b;
                  prev = a;
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode SwapPairs(ListNode head)
          {
              var dummy = new ListNode(0, head);
              var prev = dummy;
              while (prev.next != null && prev.next.next != null)
              {
                  var a = prev.next;
                  var b = a.next;
                  a.next = b.next;
                  b.next = a;
                  prev.next = b;
                  prev = a;
              }
              return dummy.next;
          }
        `,
        go: code`
          func swapPairs(head *ListNode) *ListNode {
              dummy := &ListNode{Next: head}
              prev := dummy
              for prev.Next != nil && prev.Next.Next != nil {
                  a := prev.Next
                  b := a.Next
                  a.Next = b.Next
                  b.Next = a
                  prev.Next = b
                  prev = a
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun swapPairs(head: ListNode?): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var prev = dummy
              while (prev.next != null && prev.next!!.next != null) {
                  val a = prev.next!!
                  val b = a.next!!
                  a.next = b.next
                  b.next = a
                  prev.next = b
                  prev = a
              }
              return dummy.next
          }
        `,
        swift: code`
          func swapPairs(_ head: ListNode?) -> ListNode? {
              let dummy = ListNode(0, head)
              var prev = dummy
              while let a = prev.next, let b = a.next {
                  a.next = b.next
                  b.next = a
                  prev.next = b
                  prev = a
              }
              return dummy.next
          }
        `,
        rust: code`
          fn swapPairs(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              match head {
                  None => None,
                  Some(mut a) => match a.next.take() {
                      None => Some(a),
                      Some(mut b) => {
                          a.next = swapPairs(b.next.take());
                          b.next = Some(a);
                          Some(b)
                      }
                  },
              }
          }
        `,
        php: code`
          function swapPairs($head) {
              $dummy = new ListNode(0, $head);
              $prev = $dummy;
              while ($prev->next !== null && $prev->next->next !== null) {
                  $a = $prev->next;
                  $b = $a->next;
                  $a->next = $b->next;
                  $b->next = $a;
                  $prev->next = $b;
                  $prev = $a;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def swapPairs(head)
            dummy = ListNode.new(0, head)
            prev = dummy
            while prev.next && prev.next.next
              a = prev.next
              b = a.next
              a.next = b.next
              b.next = a
              prev.next = b
              prev = a
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Rotate List (LC 61) ─────────────────────────────────────────
  (() => {
    const ref = (a: number[], k: number) => {
      if (a.length === 0) return a;
      const s = k % a.length;
      return a.slice(a.length - s).concat(a.slice(0, a.length - s));
    };
    return {
      slug: "rotate-list",
      title: "Rotate List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Bloomberg", "LinkedIn"],
      signature: { funcName: "rotateRight", params: [{ name: "head", type: "ListNode" as const }, { name: "k", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, rotate the list to the **right** by `k` places: `k` times, the last node moves to the front. Return the head of the rotated list.",
        [
          { in: "head = [1,2,3,4,5], k = 2", out: "[4,5,1,2,3]", note: "One rotation gives [5,1,2,3,4], a second gives [4,5,1,2,3]." },
          { in: "head = [0,1,2], k = 4", out: "[2,0,1]", note: "Rotating a 3-node list 3 times brings it back, so 4 rotations equal 1." },
          { in: "head = [], k = 7", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 500]", "-100 <= Node.val <= 100", "0 <= k <= 2 * 10^9"]),
      hints: [
        "Rotating a list of length `n` by `n` changes nothing, so only `k % n` matters — `k` can be two billion.",
        "After rotating by `s = k % n`, the last `s` nodes come first. The new tail is the node at position `n - s` (1-based).",
        "Find the length and the old tail in one walk, link the tail to the head to form a ring, walk to the new tail, and cut the ring after it.",
      ],
      editorial: explain({
        idea: "A right rotation by `s` moves the last `s` nodes to the front. Closing the list into a ring and cutting it at the right place does that with two pointer changes.",
        steps: [
          "If the list is empty, return it.",
          "Walk to the last node, counting the length `n`.",
          "Set `s = k % n`; if `s == 0` return `head`.",
          "Link the tail to `head`, then walk `n - s` steps from the tail (or `n - s - 1` from the head) to the new tail.",
          "The node after it is the new head; set the new tail's `next` to null and return the new head.",
        ],
        why: "In the ring every node keeps its successor, so the order is unchanged up to where we cut; cutting after position `n - s` makes position `n - s + 1` the first node, which is exactly the list rotated right by `s`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Simulating `k` single rotations is far too slow for `k` up to 2·10^9 — reduce `k` modulo the length first.",
          "Guard the empty list before taking `k % n` (division by zero).",
          "When `k % n == 0` return the list unchanged rather than cutting the ring in the wrong place.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[4,5,1,2,3]" },
        { input: "[0,1,2]\n4", expectedOutput: "[2,0,1]" },
        { input: "[]\n7", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng), -100, 100);
        const r = rng();
        const k = r < 0.1 ? 0 : r < 0.75 ? ri(rng, 0, 3 * Math.max(1, a.length)) : ri(rng, 0, 2000000000);
        return { input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def rotateRight(head: Optional[ListNode], k: int) -> Optional[ListNode]:
              if head is None:
                  return head
              n = 1
              tail = head
              while tail.next:
                  tail = tail.next
                  n += 1
              s = k % n
              if s == 0:
                  return head
              tail.next = head
              new_tail = head
              for _ in range(n - s - 1):
                  new_tail = new_tail.next
              new_head = new_tail.next
              new_tail.next = None
              return new_head
        `,
        javascript: code`
          var rotateRight = function(head, k) {
              if (head === null) return head;
              var n = 1, tail = head;
              while (tail.next !== null) { tail = tail.next; n++; }
              var s = k % n;
              if (s === 0) return head;
              tail.next = head;
              var newTail = head;
              for (var i = 0; i < n - s - 1; i++) newTail = newTail.next;
              var newHead = newTail.next;
              newTail.next = null;
              return newHead;
          };
        `,
        typescript: code`
          function rotateRight(head: ListNode | null, k: number): ListNode | null {
              if (head === null) return head;
              var n = 1, tail = head;
              while (tail.next !== null) { tail = tail.next; n++; }
              var s = k % n;
              if (s === 0) return head;
              tail.next = head;
              var newTail = head;
              for (var i = 0; i < n - s - 1; i++) newTail = newTail.next;
              var newHead = newTail.next;
              newTail.next = null;
              return newHead;
          }
        `,
        java: code`
          public static ListNode rotateRight(ListNode head, int k) {
              if (head == null) return head;
              int n = 1;
              ListNode tail = head;
              while (tail.next != null) { tail = tail.next; n++; }
              int s = k % n;
              if (s == 0) return head;
              tail.next = head;
              ListNode newTail = head;
              for (int i = 0; i < n - s - 1; i++) newTail = newTail.next;
              ListNode newHead = newTail.next;
              newTail.next = null;
              return newHead;
          }
        `,
        cpp: code`
          ListNode* rotateRight(ListNode* head, int k) {
              if (!head) return head;
              int n = 1;
              ListNode* tail = head;
              while (tail->next) { tail = tail->next; n++; }
              int s = k % n;
              if (s == 0) return head;
              tail->next = head;
              ListNode* newTail = head;
              for (int i = 0; i < n - s - 1; i++) newTail = newTail->next;
              ListNode* newHead = newTail->next;
              newTail->next = nullptr;
              return newHead;
          }
        `,
        c: code`
          struct ListNode* rotateRight(struct ListNode* head, int k) {
              if (head == NULL) return head;
              int n = 1;
              struct ListNode* tail = head;
              while (tail->next != NULL) { tail = tail->next; n++; }
              int s = k % n;
              if (s == 0) return head;
              tail->next = head;
              struct ListNode* newTail = head;
              for (int i = 0; i < n - s - 1; i++) newTail = newTail->next;
              struct ListNode* newHead = newTail->next;
              newTail->next = NULL;
              return newHead;
          }
        `,
        csharp: code`
          public static ListNode RotateRight(ListNode head, int k)
          {
              if (head == null) return head;
              int n = 1;
              var tail = head;
              while (tail.next != null) { tail = tail.next; n++; }
              int s = k % n;
              if (s == 0) return head;
              tail.next = head;
              var newTail = head;
              for (int i = 0; i < n - s - 1; i++) newTail = newTail.next;
              var newHead = newTail.next;
              newTail.next = null;
              return newHead;
          }
        `,
        go: code`
          func rotateRight(head *ListNode, k int) *ListNode {
              if head == nil {
                  return head
              }
              n, tail := 1, head
              for tail.Next != nil {
                  tail = tail.Next
                  n++
              }
              s := k % n
              if s == 0 {
                  return head
              }
              tail.Next = head
              newTail := head
              for i := 0; i < n-s-1; i++ {
                  newTail = newTail.Next
              }
              newHead := newTail.Next
              newTail.Next = nil
              return newHead
          }
        `,
        kotlin: kt`
          fun rotateRight(head: ListNode?, k: Int): ListNode? {
              if (head == null) return head
              var n = 1
              var tail: ListNode = head
              while (tail.next != null) { tail = tail.next!!; n++ }
              val s = k % n
              if (s == 0) return head
              tail.next = head
              var newTail: ListNode = head
              repeat(n - s - 1) { newTail = newTail.next!! }
              val newHead = newTail.next
              newTail.next = null
              return newHead
          }
        `,
        swift: code`
          func rotateRight(_ head: ListNode?, _ k: Int) -> ListNode? {
              guard let first = head else { return head }
              var n = 1
              var tail = first
              while let nx = tail.next { tail = nx; n += 1 }
              let s = k % n
              if s == 0 { return head }
              tail.next = first
              var newTail = first
              for _ in 0..<(n - s - 1) { newTail = newTail.next! }
              let newHead = newTail.next
              newTail.next = nil
              return newHead
          }
        `,
        rust: code`
          fn rotateRight(head: Option<Box<ListNode>>, k: i32) -> Option<Box<ListNode>> {
              // Detach the boxes, rotate them, relink: the ring-and-cut of the
              // other languages needs an aliasing pointer Box does not allow.
              let mut nodes: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  nodes.push(node);
              }
              if nodes.is_empty() { return None; }
              let s = (k as usize) % nodes.len();
              nodes.rotate_right(s);
              let mut out: Option<Box<ListNode>> = None;
              for mut node in nodes.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function rotateRight($head, $k) {
              if ($head === null) return $head;
              $n = 1;
              $tail = $head;
              while ($tail->next !== null) { $tail = $tail->next; $n++; }
              $s = $k % $n;
              if ($s === 0) return $head;
              $tail->next = $head;
              $newTail = $head;
              for ($i = 0; $i < $n - $s - 1; $i++) $newTail = $newTail->next;
              $newHead = $newTail->next;
              $newTail->next = null;
              return $newHead;
          }
        `,
        ruby: code`
          def rotateRight(head, k)
            return head if head.nil?
            n = 1
            tail = head
            while tail.next
              tail = tail.next
              n += 1
            end
            s = k % n
            return head if s == 0
            tail.next = head
            new_tail = head
            (n - s - 1).times { new_tail = new_tail.next }
            new_head = new_tail.next
            new_tail.next = nil
            new_head
          end
        `,
      },
    };
  })(),

  // ── Remove Duplicates from Sorted List II (LC 82) ───────────────
  (() => {
    const ref = (a: number[]) => a.filter((v) => a.indexOf(v) === a.lastIndexOf(v));
    return {
      slug: "remove-duplicates-from-sorted-list-ii",
      title: "Remove Duplicates from Sorted List II",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Meta", "Bloomberg"],
      signature: { funcName: "deleteDuplicates", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list sorted in **non-decreasing** order. Delete **every** node whose value appears more than once in the list, keeping only the values that occur exactly once, and return the head of the resulting list (still sorted).",
        [
          { in: "head = [1,2,3,3,4,4,5]", out: "[1,2,5]", note: "3 and 4 each appear twice, so all their nodes go." },
          { in: "head = [1,1,1,2,3]", out: "[2,3]", note: "The run of 1s at the head is removed completely." },
          { in: "head = [7,7]", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 300]", "-100 <= Node.val <= 100", "The list is sorted in non-decreasing order"]),
      hints: [
        "In a sorted list, all copies of a value form one consecutive run. A value survives exactly when its run has length 1.",
        "Keep `prev`, the last node known to survive, and look at the run that starts at `prev.next`.",
        "If the run is longer than one node, skip all of it with `prev.next = <first node after the run>`; otherwise advance `prev`. A dummy node handles a duplicated head.",
      ],
      editorial: explain({
        idea: "Examine the list run by run. A run of equal values of length one is kept; a longer run is cut out entirely by linking the last kept node past it.",
        steps: [
          "Create a dummy node before `head` and set `prev = dummy`.",
          "While `prev.next` exists, let `cur = prev.next`.",
          "If `cur.next` exists and has the same value, advance `cur` to the last node of the run and set `prev.next = cur.next` (the whole run disappears; `prev` stays).",
          "Otherwise the value is unique: `prev = prev.next`.",
          "Return `dummy.next`.",
        ],
        why: "`prev` only ever moves onto a node whose run has length one, and every longer run is unlinked as a whole before `prev` looks past it. So exactly the unique values remain, in their original sorted order.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Unlike LC 83, the first copy is not kept — the whole run goes.",
          "After removing a run, do not advance `prev`: the next run may also be duplicated.",
          "The head itself may be part of a duplicated run; the dummy node covers that.",
        ],
      }),
      examples: [
        { input: "[1,2,3,3,4,4,5]", expectedOutput: "[1,2,5]" },
        { input: "[1,1,1,2,3]", expectedOutput: "[2,3]" },
        { input: "[7,7]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [0, 2, 6, 20, 100]);
        const a = randVals(rng, listLen(rng), -span, span).sort((x, y) => x - y);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteDuplicates(head: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              prev = dummy
              while prev.next:
                  cur = prev.next
                  if cur.next and cur.next.val == cur.val:
                      while cur.next and cur.next.val == cur.val:
                          cur = cur.next
                      prev.next = cur.next
                  else:
                      prev = cur
              return dummy.next
        `,
        javascript: code`
          var deleteDuplicates = function(head) {
              var dummy = new ListNode(0, head), prev = dummy;
              while (prev.next !== null) {
                  var cur = prev.next;
                  if (cur.next !== null && cur.next.val === cur.val) {
                      while (cur.next !== null && cur.next.val === cur.val) cur = cur.next;
                      prev.next = cur.next;
                  } else {
                      prev = cur;
                  }
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function deleteDuplicates(head: ListNode | null): ListNode | null {
              var dummy = new ListNode(0, head), prev = dummy;
              while (prev.next !== null) {
                  var cur = prev.next;
                  if (cur.next !== null && cur.next.val === cur.val) {
                      while (cur.next !== null && cur.next.val === cur.val) cur = cur.next;
                      prev.next = cur.next;
                  } else {
                      prev = cur;
                  }
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode deleteDuplicates(ListNode head) {
              ListNode dummy = new ListNode(0, head), prev = dummy;
              while (prev.next != null) {
                  ListNode cur = prev.next;
                  if (cur.next != null && cur.next.val == cur.val) {
                      while (cur.next != null && cur.next.val == cur.val) cur = cur.next;
                      prev.next = cur.next;
                  } else {
                      prev = cur;
                  }
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* deleteDuplicates(ListNode* head) {
              ListNode dummy(0, head);
              ListNode* prev = &dummy;
              while (prev->next) {
                  ListNode* cur = prev->next;
                  if (cur->next && cur->next->val == cur->val) {
                      while (cur->next && cur->next->val == cur->val) cur = cur->next;
                      prev->next = cur->next;
                  } else {
                      prev = cur;
                  }
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* deleteDuplicates(struct ListNode* head) {
              struct ListNode dummy;
              struct ListNode* prev = &dummy;
              dummy.next = head;
              while (prev->next != NULL) {
                  struct ListNode* cur = prev->next;
                  if (cur->next != NULL && cur->next->val == cur->val) {
                      while (cur->next != NULL && cur->next->val == cur->val) cur = cur->next;
                      prev->next = cur->next;
                  } else {
                      prev = cur;
                  }
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode DeleteDuplicates(ListNode head)
          {
              var dummy = new ListNode(0, head);
              var prev = dummy;
              while (prev.next != null)
              {
                  var cur = prev.next;
                  if (cur.next != null && cur.next.val == cur.val)
                  {
                      while (cur.next != null && cur.next.val == cur.val) cur = cur.next;
                      prev.next = cur.next;
                  }
                  else prev = cur;
              }
              return dummy.next;
          }
        `,
        go: code`
          func deleteDuplicates(head *ListNode) *ListNode {
              dummy := &ListNode{Next: head}
              prev := dummy
              for prev.Next != nil {
                  cur := prev.Next
                  if cur.Next != nil && cur.Next.Val == cur.Val {
                      for cur.Next != nil && cur.Next.Val == cur.Val {
                          cur = cur.Next
                      }
                      prev.Next = cur.Next
                  } else {
                      prev = cur
                  }
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun deleteDuplicates(head: ListNode?): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var prev = dummy
              while (prev.next != null) {
                  var cur = prev.next!!
                  if (cur.next != null && cur.next!!.\`val\` == cur.\`val\`) {
                      while (cur.next != null && cur.next!!.\`val\` == cur.\`val\`) cur = cur.next!!
                      prev.next = cur.next
                  } else {
                      prev = cur
                  }
              }
              return dummy.next
          }
        `,
        swift: code`
          func deleteDuplicates(_ head: ListNode?) -> ListNode? {
              let dummy = ListNode(0, head)
              var prev = dummy
              while var cur = prev.next {
                  if let nx = cur.next, nx.val == cur.val {
                      while let nx = cur.next, nx.val == cur.val { cur = nx }
                      prev.next = cur.next
                  } else {
                      prev = cur
                  }
              }
              return dummy.next
          }
        `,
        rust: code`
          fn deleteDuplicates(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut nodes: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  nodes.push(node);
              }
              let vals: Vec<i32> = nodes.iter().map(|n| n.val).collect();
              let n = vals.len();
              let mut kept: Vec<Box<ListNode>> = Vec::new();
              for (i, node) in nodes.into_iter().enumerate() {
                  let same_prev = i > 0 && vals[i - 1] == vals[i];
                  let same_next = i + 1 < n && vals[i + 1] == vals[i];
                  if !same_prev && !same_next { kept.push(node); }
              }
              let mut out: Option<Box<ListNode>> = None;
              for mut node in kept.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function deleteDuplicates($head) {
              $dummy = new ListNode(0, $head);
              $prev = $dummy;
              while ($prev->next !== null) {
                  $cur = $prev->next;
                  if ($cur->next !== null && $cur->next->val === $cur->val) {
                      while ($cur->next !== null && $cur->next->val === $cur->val) $cur = $cur->next;
                      $prev->next = $cur->next;
                  } else {
                      $prev = $cur;
                  }
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def deleteDuplicates(head)
            dummy = ListNode.new(0, head)
            prev = dummy
            while prev.next
              cur = prev.next
              if cur.next && cur.next.val == cur.val
                cur = cur.next while cur.next && cur.next.val == cur.val
                prev.next = cur.next
              else
                prev = cur
              end
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Partition List (LC 86) ──────────────────────────────────────
  (() => {
    const ref = (a: number[], x: number) => a.filter((v) => v < x).concat(a.filter((v) => v >= x));
    return {
      slug: "partition-list",
      title: "Partition List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Adobe", "Bloomberg"],
      signature: { funcName: "partition", params: [{ name: "head", type: "ListNode" as const }, { name: "x", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and a value `x`, rearrange the list so that every node with a value **less than** `x` comes before every node with a value **greater than or equal to** `x`.\n\nKeep the original relative order of the nodes inside each of the two groups, and return the head of the rearranged list.",
        [
          { in: "head = [1,4,3,2,5,2], x = 3", out: "[1,2,2,4,3,5]", note: "Smaller than 3: 1, 2, 2 (in their order); the rest: 4, 3, 5." },
          { in: "head = [2,1], x = 2", out: "[1,2]" },
          { in: "head = [], x = 0", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 200]", "-100 <= Node.val <= 100", "-200 <= x <= 200"]),
      hints: [
        "The answer is a stable split: the small nodes in order, followed by the large nodes in order.",
        "Build two separate lists while walking the original once — one for values `< x`, one for the rest.",
        "Give each list a dummy head and a tail pointer; at the end link the small list's tail to the large list's head, and end the large list with null.",
      ],
      editorial: explain({
        idea: "Distribute the nodes into two chains as you meet them — values below `x` and the rest — then join the chains. Appending at a tail keeps each chain in its original order.",
        steps: [
          "Create dummy heads `small` and `large` with tails `s` and `l`.",
          "Walk the list; append each node to `s` if its value is `< x`, otherwise to `l`.",
          "Set `l.next = null` (the last large node may still point into the old list).",
          "Set `s.next = large.next` and return `small.next`.",
        ],
        why: "Each node is appended exactly once to the chain its value selects, and appending preserves the order of arrival, so each group keeps its relative order. Joining small before large puts every smaller value first.",
        time: "O(n)",
        space: "O(1) — the nodes are relinked, not copied",
        pitfalls: [
          "Forgetting `l.next = null` can leave a cycle back into the small chain.",
          "Values equal to `x` belong to the second group.",
          "Swapping values in place (like an array partition) breaks the required stable order.",
        ],
      }),
      examples: [
        { input: "[1,4,3,2,5,2]\n3", expectedOutput: "[1,2,2,4,3,5]" },
        { input: "[2,1]\n2", expectedOutput: "[1,2]" },
        { input: "[]\n0", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [5, 100]);
        const a = randVals(rng, listLen(rng), -span, span);
        const x = rng() < 0.7 && a.length ? pick(rng, a) + ri(rng, 0, 1) : ri(rng, -200, 200);
        return { input: `${fmtIntArr(a)}\n${x}`, expectedOutput: fmtIntArr(ref(a, x)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def partition(head: Optional[ListNode], x: int) -> Optional[ListNode]:
              small = ListNode(0)
              large = ListNode(0)
              s, l = small, large
              while head:
                  if head.val < x:
                      s.next = head
                      s = head
                  else:
                      l.next = head
                      l = head
                  head = head.next
              l.next = None
              s.next = large.next
              return small.next
        `,
        javascript: code`
          var partition = function(head, x) {
              var small = new ListNode(0), large = new ListNode(0), s = small, l = large;
              while (head !== null) {
                  if (head.val < x) { s.next = head; s = head; }
                  else { l.next = head; l = head; }
                  head = head.next;
              }
              l.next = null;
              s.next = large.next;
              return small.next;
          };
        `,
        typescript: code`
          function partition(head: ListNode | null, x: number): ListNode | null {
              var small = new ListNode(0), large = new ListNode(0), s = small, l = large;
              while (head !== null) {
                  if (head.val < x) { s.next = head; s = head; }
                  else { l.next = head; l = head; }
                  head = head.next;
              }
              l.next = null;
              s.next = large.next;
              return small.next;
          }
        `,
        java: code`
          public static ListNode partition(ListNode head, int x) {
              ListNode small = new ListNode(0), large = new ListNode(0), s = small, l = large;
              while (head != null) {
                  if (head.val < x) { s.next = head; s = head; }
                  else { l.next = head; l = head; }
                  head = head.next;
              }
              l.next = null;
              s.next = large.next;
              return small.next;
          }
        `,
        cpp: code`
          ListNode* partition(ListNode* head, int x) {
              ListNode small(0), large(0);
              ListNode *s = &small, *l = &large;
              while (head) {
                  if (head->val < x) { s->next = head; s = head; }
                  else { l->next = head; l = head; }
                  head = head->next;
              }
              l->next = nullptr;
              s->next = large.next;
              return small.next;
          }
        `,
        c: code`
          struct ListNode* partition(struct ListNode* head, int x) {
              struct ListNode small, large;
              struct ListNode *s = &small, *l = &large;
              small.next = NULL;
              large.next = NULL;
              while (head != NULL) {
                  if (head->val < x) { s->next = head; s = head; }
                  else { l->next = head; l = head; }
                  head = head->next;
              }
              l->next = NULL;
              s->next = large.next;
              return small.next;
          }
        `,
        csharp: code`
          public static ListNode Partition(ListNode head, int x)
          {
              ListNode small = new ListNode(0), large = new ListNode(0);
              ListNode s = small, l = large;
              while (head != null)
              {
                  if (head.val < x) { s.next = head; s = head; }
                  else { l.next = head; l = head; }
                  head = head.next;
              }
              l.next = null;
              s.next = large.next;
              return small.next;
          }
        `,
        go: code`
          func partition(head *ListNode, x int) *ListNode {
              small, large := &ListNode{}, &ListNode{}
              s, l := small, large
              for head != nil {
                  if head.Val < x {
                      s.Next = head
                      s = head
                  } else {
                      l.Next = head
                      l = head
                  }
                  head = head.Next
              }
              l.Next = nil
              s.Next = large.Next
              return small.Next
          }
        `,
        kotlin: kt`
          fun partition(head: ListNode?, x: Int): ListNode? {
              val small = ListNode(0)
              val large = ListNode(0)
              var s = small
              var l = large
              var cur = head
              while (cur != null) {
                  if (cur.\`val\` < x) { s.next = cur; s = cur }
                  else { l.next = cur; l = cur }
                  cur = cur.next
              }
              l.next = null
              s.next = large.next
              return small.next
          }
        `,
        swift: code`
          func partition(_ head: ListNode?, _ x: Int) -> ListNode? {
              let small = ListNode(0), large = ListNode(0)
              var s = small, l = large
              var cur = head
              while let node = cur {
                  if node.val < x { s.next = node; s = node }
                  else { l.next = node; l = node }
                  cur = node.next
              }
              l.next = nil
              s.next = large.next
              return small.next
          }
        `,
        rust: code`
          fn partition(head: Option<Box<ListNode>>, x: i32) -> Option<Box<ListNode>> {
              let mut small: Vec<Box<ListNode>> = Vec::new();
              let mut large: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  if node.val < x { small.push(node); } else { large.push(node); }
              }
              small.extend(large);
              let mut out: Option<Box<ListNode>> = None;
              for mut node in small.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function partition($head, $x) {
              $small = new ListNode(0);
              $large = new ListNode(0);
              $s = $small;
              $l = $large;
              while ($head !== null) {
                  if ($head->val < $x) { $s->next = $head; $s = $head; }
                  else { $l->next = $head; $l = $head; }
                  $head = $head->next;
              }
              $l->next = null;
              $s->next = $large->next;
              return $small->next;
          }
        `,
        ruby: code`
          def partition(head, x)
            small = ListNode.new(0)
            large = ListNode.new(0)
            s = small
            l = large
            while head
              if head.val < x
                s.next = head
                s = head
              else
                l.next = head
                l = head
              end
              head = head.next
            end
            l.next = nil
            s.next = large.next
            small.next
          end
        `,
      },
    };
  })(),

  // ── Reverse Linked List II (LC 92) ──────────────────────────────
  (() => {
    const ref = (a: number[], left: number, right: number) =>
      a.slice(0, left - 1).concat(a.slice(left - 1, right).reverse(), a.slice(right));
    return {
      slug: "reverse-linked-list-ii",
      title: "Reverse Linked List II",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Meta", "Apple"],
      signature: { funcName: "reverseBetween", params: [{ name: "head", type: "ListNode" as const }, { name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and two integers `left <= right`, reverse the nodes from position `left` to position `right` (positions counted from 1), leaving the rest of the list as it is. Return the head of the list.",
        [
          { in: "head = [1,2,3,4,5], left = 2, right = 4", out: "[1,4,3,2,5]", note: "The segment 2 → 3 → 4 becomes 4 → 3 → 2." },
          { in: "head = [5], left = 1, right = 1", out: "[5]" },
          { in: "head = [3,5,8], left = 1, right = 3", out: "[8,5,3]", note: "The range can cover the whole list, head included." },
        ],
        ["The number of nodes in the list is n", "1 <= n <= 500", "-500 <= Node.val <= 500", "1 <= left <= right <= n"],
        "Could you do it in one pass?"),
      hints: [
        "Find the node just before position `left`; everything before it stays put.",
        "Reverse the segment by repeatedly taking the node right after the segment's (moving) first node and moving it to the front of the segment.",
        "That front insertion is three link changes per node, done `right - left` times. A dummy node in front of the head covers `left = 1`.",
      ],
      editorial: explain({
        idea: "Stand on the node before the segment (`pre`). The segment's first node `cur` will end up last; one by one, pull the node after `cur` out and insert it right after `pre`. After `right - left` moves the segment is reversed, in a single pass.",
        steps: [
          "Create a dummy node before `head`; walk `pre` forward `left - 1` steps from the dummy.",
          "Let `cur = pre.next` (the first node of the segment).",
          "Repeat `right - left` times: `nxt = cur.next`; `cur.next = nxt.next`; `nxt.next = pre.next`; `pre.next = nxt`.",
          "Return `dummy.next`.",
        ],
        why: "Each move takes the next unreversed node of the segment and places it at the segment's front, so after `i` moves the first `i + 1` nodes of the segment appear in reverse order directly after `pre`, with `cur` linked to the rest. After `right - left` moves the whole segment is reversed and still attached on both sides.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "When `left = 1` the head changes — return `dummy.next`, not the original `head`.",
          "`cur` never moves: it is always the segment's last node, and its `next` keeps the tail attached.",
          "`left == right` needs no work; the loop runs zero times.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2\n4", expectedOutput: "[1,4,3,2,5]" },
        { input: "[5]\n1\n1", expectedOutput: "[5]" },
        { input: "[3,5,8]\n1\n3", expectedOutput: "[8,5,3]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng, 1), -500, 500);
        const x = ri(rng, 1, a.length), y = ri(rng, 1, a.length);
        const left = Math.min(x, y), right = Math.max(x, y);
        return { input: `${fmtIntArr(a)}\n${left}\n${right}`, expectedOutput: fmtIntArr(ref(a, left, right)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reverseBetween(head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              pre = dummy
              for _ in range(left - 1):
                  pre = pre.next
              cur = pre.next
              for _ in range(right - left):
                  nxt = cur.next
                  cur.next = nxt.next
                  nxt.next = pre.next
                  pre.next = nxt
              return dummy.next
        `,
        javascript: code`
          var reverseBetween = function(head, left, right) {
              var dummy = new ListNode(0, head), pre = dummy;
              for (var i = 1; i < left; i++) pre = pre.next;
              var cur = pre.next;
              for (var j = 0; j < right - left; j++) {
                  var nxt = cur.next;
                  cur.next = nxt.next;
                  nxt.next = pre.next;
                  pre.next = nxt;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function reverseBetween(head: ListNode | null, left: number, right: number): ListNode | null {
              var dummy = new ListNode(0, head), pre = dummy;
              for (var i = 1; i < left; i++) pre = pre.next;
              var cur = pre.next;
              for (var j = 0; j < right - left; j++) {
                  var nxt = cur.next;
                  cur.next = nxt.next;
                  nxt.next = pre.next;
                  pre.next = nxt;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode reverseBetween(ListNode head, int left, int right) {
              ListNode dummy = new ListNode(0, head), pre = dummy;
              for (int i = 1; i < left; i++) pre = pre.next;
              ListNode cur = pre.next;
              for (int j = 0; j < right - left; j++) {
                  ListNode nxt = cur.next;
                  cur.next = nxt.next;
                  nxt.next = pre.next;
                  pre.next = nxt;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* reverseBetween(ListNode* head, int left, int right) {
              ListNode dummy(0, head);
              ListNode* pre = &dummy;
              for (int i = 1; i < left; i++) pre = pre->next;
              ListNode* cur = pre->next;
              for (int j = 0; j < right - left; j++) {
                  ListNode* nxt = cur->next;
                  cur->next = nxt->next;
                  nxt->next = pre->next;
                  pre->next = nxt;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* reverseBetween(struct ListNode* head, int left, int right) {
              struct ListNode dummy;
              struct ListNode* pre = &dummy;
              dummy.next = head;
              for (int i = 1; i < left; i++) pre = pre->next;
              struct ListNode* cur = pre->next;
              for (int j = 0; j < right - left; j++) {
                  struct ListNode* nxt = cur->next;
                  cur->next = nxt->next;
                  nxt->next = pre->next;
                  pre->next = nxt;
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode ReverseBetween(ListNode head, int left, int right)
          {
              var dummy = new ListNode(0, head);
              var pre = dummy;
              for (int i = 1; i < left; i++) pre = pre.next;
              var cur = pre.next;
              for (int j = 0; j < right - left; j++)
              {
                  var nxt = cur.next;
                  cur.next = nxt.next;
                  nxt.next = pre.next;
                  pre.next = nxt;
              }
              return dummy.next;
          }
        `,
        go: code`
          func reverseBetween(head *ListNode, left int, right int) *ListNode {
              dummy := &ListNode{Next: head}
              pre := dummy
              for i := 1; i < left; i++ {
                  pre = pre.Next
              }
              cur := pre.Next
              for j := 0; j < right-left; j++ {
                  nxt := cur.Next
                  cur.Next = nxt.Next
                  nxt.Next = pre.Next
                  pre.Next = nxt
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun reverseBetween(head: ListNode?, left: Int, right: Int): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var pre: ListNode = dummy
              repeat(left - 1) { pre = pre.next!! }
              val cur = pre.next!!
              repeat(right - left) {
                  val nxt = cur.next!!
                  cur.next = nxt.next
                  nxt.next = pre.next
                  pre.next = nxt
              }
              return dummy.next
          }
        `,
        swift: code`
          func reverseBetween(_ head: ListNode?, _ left: Int, _ right: Int) -> ListNode? {
              let dummy = ListNode(0, head)
              var pre = dummy
              for _ in 1..<left { pre = pre.next! }
              let cur = pre.next!
              for _ in 0..<(right - left) {
                  let nxt = cur.next!
                  cur.next = nxt.next
                  nxt.next = pre.next
                  pre.next = nxt
              }
              return dummy.next
          }
        `,
        rust: code`
          fn reverseBetween(head: Option<Box<ListNode>>, left: i32, right: i32) -> Option<Box<ListNode>> {
              let mut nodes: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  nodes.push(node);
              }
              nodes[(left - 1) as usize..right as usize].reverse();
              let mut out: Option<Box<ListNode>> = None;
              for mut node in nodes.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function reverseBetween($head, $left, $right) {
              $dummy = new ListNode(0, $head);
              $pre = $dummy;
              for ($i = 1; $i < $left; $i++) $pre = $pre->next;
              $cur = $pre->next;
              for ($j = 0; $j < $right - $left; $j++) {
                  $nxt = $cur->next;
                  $cur->next = $nxt->next;
                  $nxt->next = $pre->next;
                  $pre->next = $nxt;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def reverseBetween(head, left, right)
            dummy = ListNode.new(0, head)
            pre = dummy
            (left - 1).times { pre = pre.next }
            cur = pre.next
            (right - left).times do
              nxt = cur.next
              cur.next = nxt.next
              nxt.next = pre.next
              pre.next = nxt
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Convert Sorted List to Binary Search Tree (LC 109) ──────────
  (() => {
    const build = (a: number[], lo: number, hi: number): TNode | null => {
      if (lo > hi) return null;
      const mid = (lo + hi) >> 1;
      return { val: a[mid], left: build(a, lo, mid - 1), right: build(a, mid + 1, hi) };
    };
    const ref = (a: number[]) => fmtTree(build(a, 0, a.length - 1));
    return {
      slug: "convert-sorted-list-to-binary-search-tree",
      title: "Convert Sorted List to Binary Search Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Tree", "Divide and Conquer", "Recursion", "Meta", "Amazon", "Microsoft"],
      signature: { funcName: "sortedListToBST", params: [{ name: "head", type: "ListNode" as const }], returns: "TreeNode" as const },
      description: describe(
        "Given the `head` of a singly linked list whose values are in **strictly increasing** order, build a **height-balanced** binary search tree holding the same values and return its root. (Height-balanced: for every node, the depths of its two subtrees differ by at most one.)\n\nTo make the answer unique, build it this way: for the values at positions `lo..hi` (0-based), the root is the value at position `(lo + hi) / 2` rounded down — the left-middle one — its left subtree is built from `lo..mid-1` and its right subtree from `mid+1..hi`.",
        [
          { in: "head = [-10,-3,0,5,9]", out: "[0,-10,5,null,-3,null,9]", note: "0 is the middle value; -10 roots [-10,-3] and 5 roots [5,9]." },
          { in: "head = []", out: "[]" },
          { in: "head = [1,3]", out: "[1,null,3]", note: "For two values the left-middle one, 1, is the root." },
        ],
        ["The number of nodes in the list is in the range [0, 2 * 10^4]", "-10^5 <= Node.val <= 10^5", "The values are strictly increasing"]),
      hints: [
        "In a BST built from sorted values, the root splits the values into the smaller ones (left) and larger ones (right). Taking the middle as root keeps the two sides balanced.",
        "With an array you could jump to the middle; a list cannot. But an in-order traversal of the finished tree visits the values in exactly the list's order.",
        "Count the nodes, then build recursively by index range: build the left subtree first (it consumes the list's next values), then create the root from the current list node and advance, then build the right subtree.",
      ],
      editorial: explain({
        idea: "The tree's in-order sequence must equal the list. So build the tree in in-order: recursing on the index range `lo..hi`, first build the left subtree from `lo..mid-1`, which consumes exactly the list's next `mid - lo` values, then the list's current node is the root, then build the right subtree. A single cursor walks the list once.",
        steps: [
          "Count the nodes `n`; set a cursor `cur = head`.",
          "Define `build(lo, hi)`: if `lo > hi` return null; `mid = (lo + hi) / 2`.",
          "`left = build(lo, mid - 1)`; create `root` with `cur.val`; advance `cur`; `root.left = left`; `root.right = build(mid + 1, hi)`; return `root`.",
          "Return `build(0, n - 1)`.",
        ],
        why: "By induction, `build(lo, hi)` consumes exactly `hi - lo + 1` list nodes in order and returns a tree whose in-order sequence is those values, rooted at position `mid` of the range. Since the list is sorted, every left value is smaller and every right value larger, so it is a BST; choosing the middle makes the two sides differ in size by at most one, which keeps it height-balanced, and the left-middle rule fixes the exact shape.",
        time: "O(n)",
        space: "O(log n) for the recursion",
        pitfalls: [
          "Finding the middle with slow/fast pointers on every call works but costs O(n log n), and the usual slow/fast loop picks the right-middle of an even range — a different tree.",
          "Build the left subtree before creating the root; the cursor must have passed the left values first.",
          "Copying the values into an array and building from the middle index is a simpler O(n)-space alternative that gives the same tree.",
        ],
      }),
      examples: [
        { input: "[-10,-3,0,5,9]", expectedOutput: "[0,-10,5,null,-3,null,9]" },
        { input: "[]", expectedOutput: "[]" },
        { input: "[1,3]", expectedOutput: "[1,null,3]" },
      ],
      gen: (rng: Rng) => {
        const n = listLen(rng);
        const span = pick(rng, [n + 5, 1000, 100000]);
        const set = new Set<number>();
        while (set.size < n) set.add(ri(rng, -span, span));
        const a = [...set].sort((x, y) => x - y);
        return { input: fmtIntArr(a), expectedOutput: ref(a) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sortedListToBST(head: Optional[ListNode]) -> Optional[TreeNode]:
              n = 0
              p = head
              while p:
                  n += 1
                  p = p.next
              cur = head

              def build(lo, hi):
                  nonlocal cur
                  if lo > hi:
                      return None
                  mid = (lo + hi) // 2
                  left = build(lo, mid - 1)
                  root = TreeNode(cur.val)
                  cur = cur.next
                  root.left = left
                  root.right = build(mid + 1, hi)
                  return root

              return build(0, n - 1)
        `,
        javascript: code`
          var sortedListToBST = function(head) {
              var n = 0;
              for (var p = head; p !== null; p = p.next) n++;
              var cur = head;
              var build = function(lo, hi) {
                  if (lo > hi) return null;
                  var mid = Math.floor((lo + hi) / 2);
                  var left = build(lo, mid - 1);
                  var root = new TreeNode(cur.val);
                  cur = cur.next;
                  root.left = left;
                  root.right = build(mid + 1, hi);
                  return root;
              };
              return build(0, n - 1);
          };
        `,
        typescript: code`
          function sortedListToBST(head: ListNode | null): TreeNode | null {
              var n = 0;
              for (var p = head; p !== null; p = p.next) n++;
              var cur = head;
              function build(lo: number, hi: number): TreeNode | null {
                  if (lo > hi) return null;
                  var mid = Math.floor((lo + hi) / 2);
                  var left = build(lo, mid - 1);
                  var root = new TreeNode(cur.val);
                  cur = cur.next;
                  root.left = left;
                  root.right = build(mid + 1, hi);
                  return root;
              }
              return build(0, n - 1);
          }
        `,
        java: code`
          public static TreeNode sortedListToBST(ListNode head) {
              int n = 0;
              for (ListNode p = head; p != null; p = p.next) n++;
              ListNode[] cur = { head };
              return buildRange(cur, 0, n - 1);
          }

          static TreeNode buildRange(ListNode[] cur, int lo, int hi) {
              if (lo > hi) return null;
              int mid = (lo + hi) / 2;
              TreeNode left = buildRange(cur, lo, mid - 1);
              TreeNode root = new TreeNode(cur[0].val);
              cur[0] = cur[0].next;
              root.left = left;
              root.right = buildRange(cur, mid + 1, hi);
              return root;
          }
        `,
        cpp: code`
          TreeNode* sortedListToBST(ListNode* head) {
              int n = 0;
              for (ListNode* p = head; p; p = p->next) n++;
              ListNode* cur = head;
              function<TreeNode*(int, int)> build = [&](int lo, int hi) -> TreeNode* {
                  if (lo > hi) return nullptr;
                  int mid = (lo + hi) / 2;
                  TreeNode* left = build(lo, mid - 1);
                  TreeNode* root = new TreeNode(cur->val);
                  cur = cur->next;
                  root->left = left;
                  root->right = build(mid + 1, hi);
                  return root;
              };
              return build(0, n - 1);
          }
        `,
        c: code`
          static struct TreeNode* buildRange(struct ListNode** cur, int lo, int hi);

          struct TreeNode* sortedListToBST(struct ListNode* head) {
              int n = 0;
              for (struct ListNode* p = head; p != NULL; p = p->next) n++;
              struct ListNode* cur = head;
              return buildRange(&cur, 0, n - 1);
          }

          static struct TreeNode* buildRange(struct ListNode** cur, int lo, int hi) {
              if (lo > hi) return NULL;
              int mid = (lo + hi) / 2;
              struct TreeNode* left = buildRange(cur, lo, mid - 1);
              struct TreeNode* root = (struct TreeNode*) malloc(sizeof(struct TreeNode));
              root->val = (*cur)->val;
              *cur = (*cur)->next;
              root->left = left;
              root->right = buildRange(cur, mid + 1, hi);
              return root;
          }
        `,
        csharp: code`
          public static TreeNode SortedListToBST(ListNode head)
          {
              int n = 0;
              for (var p = head; p != null; p = p.next) n++;
              var cur = head;
              return BuildRange(ref cur, 0, n - 1);
          }

          static TreeNode BuildRange(ref ListNode cur, int lo, int hi)
          {
              if (lo > hi) return null;
              int mid = (lo + hi) / 2;
              var left = BuildRange(ref cur, lo, mid - 1);
              var root = new TreeNode(cur.val);
              cur = cur.next;
              root.left = left;
              root.right = BuildRange(ref cur, mid + 1, hi);
              return root;
          }
        `,
        go: code`
          func sortedListToBST(head *ListNode) *TreeNode {
              n := 0
              for p := head; p != nil; p = p.Next {
                  n++
              }
              cur := head
              var build func(lo, hi int) *TreeNode
              build = func(lo, hi int) *TreeNode {
                  if lo > hi {
                      return nil
                  }
                  mid := (lo + hi) / 2
                  left := build(lo, mid-1)
                  root := &TreeNode{Val: cur.Val}
                  cur = cur.Next
                  root.Left = left
                  root.Right = build(mid+1, hi)
                  return root
              }
              return build(0, n-1)
          }
        `,
        kotlin: kt`
          fun sortedListToBST(head: ListNode?): TreeNode? {
              var n = 0
              var p = head
              while (p != null) { n++; p = p.next }
              var cur = head
              fun build(lo: Int, hi: Int): TreeNode? {
                  if (lo > hi) return null
                  val mid = (lo + hi) / 2
                  val left = build(lo, mid - 1)
                  val root = TreeNode(cur!!.\`val\`)
                  cur = cur!!.next
                  root.left = left
                  root.right = build(mid + 1, hi)
                  return root
              }
              return build(0, n - 1)
          }
        `,
        swift: code`
          func sortedListToBST(_ head: ListNode?) -> TreeNode? {
              var n = 0
              var p = head
              while let node = p { n += 1; p = node.next }
              var cur = head
              func build(_ lo: Int, _ hi: Int) -> TreeNode? {
                  if lo > hi { return nil }
                  let mid = (lo + hi) / 2
                  let left = build(lo, mid - 1)
                  let root = TreeNode(cur!.val)
                  cur = cur!.next
                  root.left = left
                  root.right = build(mid + 1, hi)
                  return root
              }
              return build(0, n - 1)
          }
        `,
        rust: code`
          use std::rc::Rc;
          use std::cell::RefCell;

          fn sortedListToBST(head: Option<Box<ListNode>>) -> Option<Rc<RefCell<TreeNode>>> {
              // The list is read once into its values; build() then walks them
              // with a cursor in in-order, exactly as the pointer version does.
              let mut vals: Vec<i32> = Vec::new();
              let mut p = &head;
              while let Some(node) = p { vals.push(node.val); p = &node.next; }
              fn build(vals: &[i32], cur: &mut usize, lo: i32, hi: i32) -> Option<Rc<RefCell<TreeNode>>> {
                  if lo > hi { return None; }
                  let mid = (lo + hi) / 2;
                  let left = build(vals, cur, lo, mid - 1);
                  let root = Rc::new(RefCell::new(TreeNode::new(vals[*cur])));
                  *cur += 1;
                  root.borrow_mut().left = left;
                  root.borrow_mut().right = build(vals, cur, mid + 1, hi);
                  Some(root)
              }
              let mut cur = 0usize;
              let n = vals.len() as i32;
              build(&vals, &mut cur, 0, n - 1)
          }
        `,
        php: code`
          function sortedListToBST($head) {
              $n = 0;
              for ($p = $head; $p !== null; $p = $p->next) $n++;
              $cur = $head;
              $build = function ($lo, $hi) use (&$build, &$cur) {
                  if ($lo > $hi) return null;
                  $mid = intdiv($lo + $hi, 2);
                  $left = $build($lo, $mid - 1);
                  $root = new TreeNode($cur->val);
                  $cur = $cur->next;
                  $root->left = $left;
                  $root->right = $build($mid + 1, $hi);
                  return $root;
              };
              return $build(0, $n - 1);
          }
        `,
        ruby: code`
          def sortedListToBST(head)
            n = 0
            p = head
            while p
              n += 1
              p = p.next
            end
            cur = head
            build = lambda do |lo, hi|
              return nil if lo > hi
              mid = (lo + hi) / 2
              left = build.call(lo, mid - 1)
              root = TreeNode.new(cur.val)
              cur = cur.next
              root.left = left
              root.right = build.call(mid + 1, hi)
              root
            end
            build.call(0, n - 1)
          end
        `,
      },
    };
  })(),

  // ── Reorder List (LC 143) ───────────────────────────────────────
  (() => {
    const ref = (a: number[]) => {
      const out: number[] = [];
      for (let i = 0, j = a.length - 1; i <= j; i++, j--) { out.push(a[i]); if (i !== j) out.push(a[j]); }
      return out;
    };
    return {
      slug: "reorder-list",
      title: "Reorder List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Stack", "Recursion", "Amazon", "Meta", "Microsoft", "Adobe"],
      signature: { funcName: "reorderList", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list `L0 → L1 → … → Ln-1 → Ln`. Reorder it in place to\n\n`L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …`\n\nalternating between the front and the back of the list. Only the links may change, not the values. LeetCode's version returns nothing; here, return the `head` of the reordered list (it is still `L0`).",
        [
          { in: "head = [1,2,3,4]", out: "[1,4,2,3]" },
          { in: "head = [1,2,3,4,5]", out: "[1,5,2,4,3]", note: "The middle node 3 ends up last." },
          { in: "head = [7]", out: "[7]" },
        ],
        ["The number of nodes in the list is in the range [1, 5 * 10^4]", "1 <= Node.val <= 1000"]),
      hints: [
        "The result interleaves the first half of the list with the second half read backwards.",
        "Find the middle with slow and fast pointers, then reverse the second half in place.",
        "Cut the list after the middle, then merge the two halves by alternately taking one node from each.",
      ],
      editorial: explain({
        idea: "Split, reverse, weave. The front half is read forwards and the back half backwards, so reversing the back half turns the problem into merging two lists by alternation.",
        steps: [
          "Find the middle: `slow = fast = head`; while `fast.next` and `fast.next.next` exist, move `slow` one step and `fast` two.",
          "Reverse the list after `slow` to get `second`, and cut with `slow.next = null`.",
          "Weave: with `first = head`, while `second` is not null, save both `next` pointers, link `first.next = second` and `second.next = savedFirstNext`, then advance both.",
          "Return `head`.",
        ],
        why: "The slow pointer stops at the last node of the first half (which has the extra node when the length is odd). After reversing, `second` lists Ln, Ln-1, … and the weave places each of them right after L0, L1, … in turn, which is exactly the required order; the first half is never shorter, so it absorbs every node of the second.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting to cut the first half (`slow.next = null`) leaves a cycle.",
          "Pushing all nodes onto a stack also works but costs O(n) extra space.",
          "For one or two nodes nothing changes — make sure the loops handle that without special cases.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[1,4,2,3]" },
        { input: "[1,2,3,4,5]", expectedOutput: "[1,5,2,4,3]" },
        { input: "[7]", expectedOutput: "[7]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng, 1), 1, pick(rng, [9, 1000]));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reorderList(head: Optional[ListNode]) -> Optional[ListNode]:
              slow = fast = head
              while fast.next and fast.next.next:
                  slow = slow.next
                  fast = fast.next.next
              second, prev = slow.next, None
              slow.next = None
              while second:
                  second.next, prev, second = prev, second, second.next
              first, second = head, prev
              while second:
                  a, b = first.next, second.next
                  first.next = second
                  second.next = a
                  first, second = a, b
              return head
        `,
        javascript: code`
          var reorderList = function(head) {
              var slow = head, fast = head;
              while (fast.next !== null && fast.next.next !== null) { slow = slow.next; fast = fast.next.next; }
              var cur = slow.next, prev = null;
              slow.next = null;
              while (cur !== null) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
              var first = head, second = prev;
              while (second !== null) {
                  var a = first.next, b = second.next;
                  first.next = second;
                  second.next = a;
                  first = a;
                  second = b;
              }
              return head;
          };
        `,
        typescript: code`
          function reorderList(head: ListNode | null): ListNode | null {
              var slow = head, fast = head;
              while (fast.next !== null && fast.next.next !== null) { slow = slow.next; fast = fast.next.next; }
              var cur = slow.next, prev: ListNode | null = null;
              slow.next = null;
              while (cur !== null) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
              var first = head, second = prev;
              while (second !== null) {
                  var a = first.next, b = second.next;
                  first.next = second;
                  second.next = a;
                  first = a;
                  second = b;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode reorderList(ListNode head) {
              ListNode slow = head, fast = head;
              while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
              ListNode cur = slow.next, prev = null;
              slow.next = null;
              while (cur != null) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
              ListNode first = head, second = prev;
              while (second != null) {
                  ListNode a = first.next, b = second.next;
                  first.next = second;
                  second.next = a;
                  first = a;
                  second = b;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* reorderList(ListNode* head) {
              ListNode *slow = head, *fast = head;
              while (fast->next && fast->next->next) { slow = slow->next; fast = fast->next->next; }
              ListNode *cur = slow->next, *prev = nullptr;
              slow->next = nullptr;
              while (cur) { ListNode* nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
              ListNode *first = head, *second = prev;
              while (second) {
                  ListNode *a = first->next, *b = second->next;
                  first->next = second;
                  second->next = a;
                  first = a;
                  second = b;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* reorderList(struct ListNode* head) {
              struct ListNode *slow = head, *fast = head;
              while (fast->next != NULL && fast->next->next != NULL) { slow = slow->next; fast = fast->next->next; }
              struct ListNode *cur = slow->next, *prev = NULL;
              slow->next = NULL;
              while (cur != NULL) { struct ListNode* nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
              struct ListNode *first = head, *second = prev;
              while (second != NULL) {
                  struct ListNode *a = first->next, *b = second->next;
                  first->next = second;
                  second->next = a;
                  first = a;
                  second = b;
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode ReorderList(ListNode head)
          {
              ListNode slow = head, fast = head;
              while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
              ListNode cur = slow.next, prev = null;
              slow.next = null;
              while (cur != null) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
              ListNode first = head, second = prev;
              while (second != null)
              {
                  ListNode a = first.next, b = second.next;
                  first.next = second;
                  second.next = a;
                  first = a;
                  second = b;
              }
              return head;
          }
        `,
        go: code`
          func reorderList(head *ListNode) *ListNode {
              slow, fast := head, head
              for fast.Next != nil && fast.Next.Next != nil {
                  slow, fast = slow.Next, fast.Next.Next
              }
              cur := slow.Next
              var prev *ListNode
              slow.Next = nil
              for cur != nil {
                  nx := cur.Next
                  cur.Next = prev
                  prev, cur = cur, nx
              }
              first, second := head, prev
              for second != nil {
                  a, b := first.Next, second.Next
                  first.Next = second
                  second.Next = a
                  first, second = a, b
              }
              return head
          }
        `,
        kotlin: kt`
          fun reorderList(head: ListNode?): ListNode? {
              var slow: ListNode = head!!
              var fast: ListNode = head
              while (fast.next != null && fast.next!!.next != null) { slow = slow.next!!; fast = fast.next!!.next!! }
              var cur = slow.next
              var prev: ListNode? = null
              slow.next = null
              while (cur != null) { val nx = cur.next; cur.next = prev; prev = cur; cur = nx }
              var first: ListNode? = head
              var second = prev
              while (second != null) {
                  val a = first!!.next
                  val b = second.next
                  first.next = second
                  second.next = a
                  first = a
                  second = b
              }
              return head
          }
        `,
        swift: code`
          func reorderList(_ head: ListNode?) -> ListNode? {
              var slow = head!, fast = head!
              while let f1 = fast.next, let f2 = f1.next { slow = slow.next!; fast = f2 }
              var cur = slow.next
              var prev: ListNode? = nil
              slow.next = nil
              while let node = cur { cur = node.next; node.next = prev; prev = node }
              var first = head, second = prev
              while let s = second, let f = first {
                  let a = f.next, b = s.next
                  f.next = s
                  s.next = a
                  first = a
                  second = b
              }
              return head
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn reorderList(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut nodes: VecDeque<Box<ListNode>> = VecDeque::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  nodes.push_back(node);
              }
              let mut order: Vec<Box<ListNode>> = Vec::new();
              let mut front = true;
              while !nodes.is_empty() {
                  let node = if front { nodes.pop_front() } else { nodes.pop_back() };
                  order.push(node.unwrap());
                  front = !front;
              }
              let mut out: Option<Box<ListNode>> = None;
              for mut node in order.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function reorderList($head) {
              $slow = $head;
              $fast = $head;
              while ($fast->next !== null && $fast->next->next !== null) { $slow = $slow->next; $fast = $fast->next->next; }
              $cur = $slow->next;
              $prev = null;
              $slow->next = null;
              while ($cur !== null) { $nx = $cur->next; $cur->next = $prev; $prev = $cur; $cur = $nx; }
              $first = $head;
              $second = $prev;
              while ($second !== null) {
                  $a = $first->next;
                  $b = $second->next;
                  $first->next = $second;
                  $second->next = $a;
                  $first = $a;
                  $second = $b;
              }
              return $head;
          }
        `,
        ruby: code`
          def reorderList(head)
            slow = fast = head
            while fast.next && fast.next.next
              slow = slow.next
              fast = fast.next.next
            end
            cur = slow.next
            prev = nil
            slow.next = nil
            while cur
              nx = cur.next
              cur.next = prev
              prev = cur
              cur = nx
            end
            first = head
            second = prev
            while second
              a = first.next
              b = second.next
              first.next = second
              second.next = a
              first = a
              second = b
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Insertion Sort List (LC 147) ────────────────────────────────
  (() => {
    const ref = (a: number[]) => a.slice().sort((x, y) => x - y);
    return {
      slug: "insertion-sort-list",
      title: "Insertion Sort List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Sorting", "Microsoft", "Amazon"],
      signature: { funcName: "insertionSortList", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, sort it in **ascending** order using **insertion sort**, and return the head of the sorted list.\n\nInsertion sort keeps a sorted part that starts empty; at each step it takes the next node of the unsorted input and inserts it at its correct place in the sorted part, until no input remains.",
        [
          { in: "head = [4,2,1,3]", out: "[1,2,3,4]" },
          { in: "head = [-1,5,3,4,0]", out: "[-1,0,3,4,5]" },
          { in: "head = [2,2,1]", out: "[1,2,2]", note: "Equal values simply sit next to each other." },
        ],
        ["The number of nodes in the list is in the range [1, 5000]", "-5000 <= Node.val <= 5000"]),
      hints: [
        "Build the sorted list separately, starting from a dummy node, and move input nodes into it one at a time.",
        "To insert a node, walk the sorted list from the dummy until the next node is larger than the one being inserted.",
        "Remember the input node's `next` before relinking it — that is where the input continues.",
      ],
      editorial: explain({
        idea: "Keep a sorted list behind a dummy node. Detach each node of the input in turn and splice it in after the last sorted node whose value does not exceed it.",
        steps: [
          "Create `dummy` (the sorted list starts empty) and set `cur = head`.",
          "While `cur` is not null: save `next = cur.next`.",
          "Walk `prev` from `dummy` while `prev.next` exists and `prev.next.val <= cur.val`.",
          "Splice: `cur.next = prev.next`, `prev.next = cur`; then `cur = next`.",
          "Return `dummy.next`.",
        ],
        why: "The list behind `dummy` is sorted before each step, and inserting `cur` after the last node not greater than it keeps it sorted. Every input node is moved exactly once, so at the end the sorted list holds all of them.",
        time: "O(n²) in the worst case (O(n) for an already sorted list if you first check the last sorted node)",
        space: "O(1)",
        pitfalls: [
          "Losing the rest of the input by relinking `cur` before saving `cur.next`.",
          "Starting the search from the head of the *input* rather than the sorted list.",
          "Using `<` instead of `<=` also sorts correctly, but `<=` keeps equal values in their original order (a stable sort).",
        ],
      }),
      examples: [
        { input: "[4,2,1,3]", expectedOutput: "[1,2,3,4]" },
        { input: "[-1,5,3,4,0]", expectedOutput: "[-1,0,3,4,5]" },
        { input: "[2,2,1]", expectedOutput: "[1,2,2]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [3, 50, 5000]);
        let a = randVals(rng, listLen(rng, 1), -span, span);
        const r = rng();
        if (r < 0.1) a = ref(a);
        else if (r < 0.2) a = ref(a).reverse();
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def insertionSortList(head: Optional[ListNode]) -> Optional[ListNode]:
              dummy = ListNode(0)
              cur = head
              while cur:
                  nxt = cur.next
                  prev = dummy
                  while prev.next and prev.next.val <= cur.val:
                      prev = prev.next
                  cur.next = prev.next
                  prev.next = cur
                  cur = nxt
              return dummy.next
        `,
        javascript: code`
          var insertionSortList = function(head) {
              var dummy = new ListNode(0), cur = head;
              while (cur !== null) {
                  var nxt = cur.next, prev = dummy;
                  while (prev.next !== null && prev.next.val <= cur.val) prev = prev.next;
                  cur.next = prev.next;
                  prev.next = cur;
                  cur = nxt;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function insertionSortList(head: ListNode | null): ListNode | null {
              var dummy = new ListNode(0), cur = head;
              while (cur !== null) {
                  var nxt = cur.next, prev = dummy;
                  while (prev.next !== null && prev.next.val <= cur.val) prev = prev.next;
                  cur.next = prev.next;
                  prev.next = cur;
                  cur = nxt;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode insertionSortList(ListNode head) {
              ListNode dummy = new ListNode(0), cur = head;
              while (cur != null) {
                  ListNode nxt = cur.next, prev = dummy;
                  while (prev.next != null && prev.next.val <= cur.val) prev = prev.next;
                  cur.next = prev.next;
                  prev.next = cur;
                  cur = nxt;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* insertionSortList(ListNode* head) {
              ListNode dummy(0);
              ListNode* cur = head;
              while (cur) {
                  ListNode* nxt = cur->next;
                  ListNode* prev = &dummy;
                  while (prev->next && prev->next->val <= cur->val) prev = prev->next;
                  cur->next = prev->next;
                  prev->next = cur;
                  cur = nxt;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* insertionSortList(struct ListNode* head) {
              struct ListNode dummy;
              struct ListNode* cur = head;
              dummy.next = NULL;
              while (cur != NULL) {
                  struct ListNode* nxt = cur->next;
                  struct ListNode* prev = &dummy;
                  while (prev->next != NULL && prev->next->val <= cur->val) prev = prev->next;
                  cur->next = prev->next;
                  prev->next = cur;
                  cur = nxt;
              }
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode InsertionSortList(ListNode head)
          {
              var dummy = new ListNode(0);
              var cur = head;
              while (cur != null)
              {
                  var nxt = cur.next;
                  var prev = dummy;
                  while (prev.next != null && prev.next.val <= cur.val) prev = prev.next;
                  cur.next = prev.next;
                  prev.next = cur;
                  cur = nxt;
              }
              return dummy.next;
          }
        `,
        go: code`
          func insertionSortList(head *ListNode) *ListNode {
              dummy := &ListNode{}
              cur := head
              for cur != nil {
                  nxt := cur.Next
                  prev := dummy
                  for prev.Next != nil && prev.Next.Val <= cur.Val {
                      prev = prev.Next
                  }
                  cur.Next = prev.Next
                  prev.Next = cur
                  cur = nxt
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun insertionSortList(head: ListNode?): ListNode? {
              val dummy = ListNode(0)
              var cur = head
              while (cur != null) {
                  val nxt = cur.next
                  var prev = dummy
                  while (prev.next != null && prev.next!!.\`val\` <= cur.\`val\`) prev = prev.next!!
                  cur.next = prev.next
                  prev.next = cur
                  cur = nxt
              }
              return dummy.next
          }
        `,
        swift: code`
          func insertionSortList(_ head: ListNode?) -> ListNode? {
              let dummy = ListNode(0)
              var cur = head
              while let node = cur {
                  let nxt = node.next
                  var prev = dummy
                  while let p = prev.next, p.val <= node.val { prev = p }
                  node.next = prev.next
                  prev.next = node
                  cur = nxt
              }
              return dummy.next
          }
        `,
        rust: code`
          fn insertionSortList(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              // The sorted part is a Vec of the detached boxes; each input node
              // is inserted after the last sorted node not greater than it.
              let mut sorted: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  let mut pos = 0;
                  while pos < sorted.len() && sorted[pos].val <= node.val { pos += 1; }
                  sorted.insert(pos, node);
              }
              let mut out: Option<Box<ListNode>> = None;
              for mut node in sorted.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function insertionSortList($head) {
              $dummy = new ListNode(0);
              $cur = $head;
              while ($cur !== null) {
                  $nxt = $cur->next;
                  $prev = $dummy;
                  while ($prev->next !== null && $prev->next->val <= $cur->val) $prev = $prev->next;
                  $cur->next = $prev->next;
                  $prev->next = $cur;
                  $cur = $nxt;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          def insertionSortList(head)
            dummy = ListNode.new(0)
            cur = head
            while cur
              nxt = cur.next
              prev = dummy
              prev = prev.next while prev.next && prev.next.val <= cur.val
              cur.next = prev.next
              prev.next = cur
              cur = nxt
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Sort List (LC 148) ──────────────────────────────────────────
  (() => {
    const ref = (a: number[]) => a.slice().sort((x, y) => x - y);
    return {
      slug: "sort-list",
      title: "Sort List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Sorting", "Merge Sort", "Divide and Conquer", "Two Pointers", "Amazon", "Meta", "Microsoft", "Bloomberg"],
      signature: { funcName: "sortList", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, return the list sorted in **ascending** order.",
        [
          { in: "head = [4,2,1,3]", out: "[1,2,3,4]" },
          { in: "head = [-1,5,3,4,0]", out: "[-1,0,3,4,5]" },
          { in: "head = []", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 5 * 10^4]", "-10^5 <= Node.val <= 10^5"],
        "Can you sort the list in O(n log n) time with only O(1) extra memory (the bottom-up merge sort)?"),
      hints: [
        "Quadratic sorts are too slow for 5·10^4 nodes; merge sort suits linked lists because merging needs no random access.",
        "Split the list in half with slow and fast pointers, sort each half recursively, and merge the two sorted halves.",
        "Merging two sorted lists takes a dummy node and a tail pointer. Cut the first half off (`slow.next = null`) before recursing.",
      ],
      editorial: explain({
        idea: "Top-down merge sort on the links: find the middle, cut the list in two, sort each half recursively, then merge. Lists are a natural fit — splitting and merging only move pointers.",
        steps: [
          "If the list has 0 or 1 nodes, it is sorted; return it.",
          "Find the middle: `slow = head`, `fast = head.next`; while `fast` and `fast.next` exist, advance `slow` once and `fast` twice.",
          "`right = slow.next`; cut with `slow.next = null`.",
          "Recursively sort `head` and `right`, then merge them: repeatedly append the smaller head to a tail pointer behind a dummy node, then attach whatever remains.",
          "Return the merged head.",
        ],
        why: "Starting `fast` at `head.next` makes `slow` stop at the end of the first half, so both halves are non-empty and strictly shorter, and the recursion terminates. Merging two sorted lists by always taking the smaller head yields a sorted list of all their nodes, so by induction every call returns its nodes sorted.",
        time: "O(n log n)",
        space: "O(log n) for the recursion; the bottom-up variant that merges runs of size 1, 2, 4, … uses O(1)",
        pitfalls: [
          "Starting `fast` at `head` leaves a two-node list split into 2 + 0 and recursing forever.",
          "Forgetting to cut the first half off makes the recursion see the whole list again.",
          "Insertion sort or repeated minimum selection is O(n²) and times out on the full constraints.",
        ],
      }),
      examples: [
        { input: "[4,2,1,3]", expectedOutput: "[1,2,3,4]" },
        { input: "[-1,5,3,4,0]", expectedOutput: "[-1,0,3,4,5]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [2, 100, 100000]);
        let a = randVals(rng, listLen(rng), -span, span);
        const r = rng();
        if (r < 0.1) a = ref(a);
        else if (r < 0.2) a = ref(a).reverse();
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def sortList(head: Optional[ListNode]) -> Optional[ListNode]:
              if head is None or head.next is None:
                  return head
              slow, fast = head, head.next
              while fast and fast.next:
                  slow = slow.next
                  fast = fast.next.next
              right = slow.next
              slow.next = None
              a, b = sortList(head), sortList(right)
              dummy = ListNode(0)
              tail = dummy
              while a and b:
                  if a.val <= b.val:
                      tail.next, a = a, a.next
                  else:
                      tail.next, b = b, b.next
                  tail = tail.next
              tail.next = a if a else b
              return dummy.next
        `,
        javascript: code`
          var sortList = function(head) {
              if (head === null || head.next === null) return head;
              var slow = head, fast = head.next;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              var right = slow.next;
              slow.next = null;
              var a = sortList(head), b = sortList(right);
              var dummy = new ListNode(0), tail = dummy;
              while (a !== null && b !== null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; }
                  else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a !== null ? a : b;
              return dummy.next;
          };
        `,
        typescript: code`
          function sortList(head: ListNode | null): ListNode | null {
              if (head === null || head.next === null) return head;
              var slow = head, fast = head.next;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              var right = slow.next;
              slow.next = null;
              var a = sortList(head), b = sortList(right);
              var dummy = new ListNode(0), tail = dummy;
              while (a !== null && b !== null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; }
                  else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a !== null ? a : b;
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode sortList(ListNode head) {
              if (head == null || head.next == null) return head;
              ListNode slow = head, fast = head.next;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              ListNode right = slow.next;
              slow.next = null;
              ListNode a = sortList(head), b = sortList(right);
              ListNode dummy = new ListNode(0), tail = dummy;
              while (a != null && b != null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; }
                  else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a != null ? a : b;
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* sortList(ListNode* head) {
              if (!head || !head->next) return head;
              ListNode *slow = head, *fast = head->next;
              while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
              ListNode* right = slow->next;
              slow->next = nullptr;
              ListNode* a = sortList(head);
              ListNode* b = sortList(right);
              ListNode dummy(0);
              ListNode* tail = &dummy;
              while (a && b) {
                  if (a->val <= b->val) { tail->next = a; a = a->next; }
                  else { tail->next = b; b = b->next; }
                  tail = tail->next;
              }
              tail->next = a ? a : b;
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* sortList(struct ListNode* head) {
              if (head == NULL || head->next == NULL) return head;
              struct ListNode *slow = head, *fast = head->next;
              while (fast != NULL && fast->next != NULL) { slow = slow->next; fast = fast->next->next; }
              struct ListNode* right = slow->next;
              slow->next = NULL;
              struct ListNode* a = sortList(head);
              struct ListNode* b = sortList(right);
              struct ListNode dummy;
              struct ListNode* tail = &dummy;
              dummy.next = NULL;
              while (a != NULL && b != NULL) {
                  if (a->val <= b->val) { tail->next = a; a = a->next; }
                  else { tail->next = b; b = b->next; }
                  tail = tail->next;
              }
              tail->next = a != NULL ? a : b;
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode SortList(ListNode head)
          {
              if (head == null || head.next == null) return head;
              ListNode slow = head, fast = head.next;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              var right = slow.next;
              slow.next = null;
              ListNode a = SortList(head), b = SortList(right);
              var dummy = new ListNode(0);
              var tail = dummy;
              while (a != null && b != null)
              {
                  if (a.val <= b.val) { tail.next = a; a = a.next; }
                  else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a ?? b;
              return dummy.next;
          }
        `,
        go: code`
          func sortList(head *ListNode) *ListNode {
              if head == nil || head.Next == nil {
                  return head
              }
              slow, fast := head, head.Next
              for fast != nil && fast.Next != nil {
                  slow, fast = slow.Next, fast.Next.Next
              }
              right := slow.Next
              slow.Next = nil
              a, b := sortList(head), sortList(right)
              dummy := &ListNode{}
              tail := dummy
              for a != nil && b != nil {
                  if a.Val <= b.Val {
                      tail.Next, a = a, a.Next
                  } else {
                      tail.Next, b = b, b.Next
                  }
                  tail = tail.Next
              }
              if a != nil {
                  tail.Next = a
              } else {
                  tail.Next = b
              }
              return dummy.Next
          }
        `,
        kotlin: kt`
          fun sortList(head: ListNode?): ListNode? {
              if (head?.next == null) return head
              var slow: ListNode = head
              var fast = head.next
              while (fast?.next != null) { slow = slow.next!!; fast = fast.next!!.next }
              val right = slow.next
              slow.next = null
              var a = sortList(head)
              var b = sortList(right)
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
          func sortList(_ head: ListNode?) -> ListNode? {
              guard let first = head, first.next != nil else { return head }
              var slow = first
              var fast = first.next
              while let f = fast, let f2 = f.next { slow = slow.next!; fast = f2.next }
              let right = slow.next
              slow.next = nil
              var a = sortList(first), b = sortList(right)
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
          fn sortList(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              fn merge(a: Option<Box<ListNode>>, b: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
                  match (a, b) {
                      (None, rest) | (rest, None) => rest,
                      (Some(mut x), Some(mut y)) => {
                          if x.val <= y.val {
                              x.next = merge(x.next.take(), Some(y));
                              Some(x)
                          } else {
                              y.next = merge(Some(x), y.next.take());
                              Some(y)
                          }
                      }
                  }
              }
              let mut len = 0;
              let mut p = &head;
              while let Some(node) = p { len += 1; p = &node.next; }
              if len < 2 { return head; }
              let mut head = head;
              let right = {
                  let mut cur = &mut head;
                  for _ in 0..len / 2 { cur = &mut cur.as_mut().unwrap().next; }
                  cur.take()
              };
              merge(sortList(head), sortList(right))
          }
        `,
        php: code`
          function sortList($head) {
              if ($head === null || $head->next === null) return $head;
              $slow = $head;
              $fast = $head->next;
              while ($fast !== null && $fast->next !== null) { $slow = $slow->next; $fast = $fast->next->next; }
              $right = $slow->next;
              $slow->next = null;
              $a = sortList($head);
              $b = sortList($right);
              $dummy = new ListNode(0);
              $tail = $dummy;
              while ($a !== null && $b !== null) {
                  if ($a->val <= $b->val) { $tail->next = $a; $a = $a->next; }
                  else { $tail->next = $b; $b = $b->next; }
                  $tail = $tail->next;
              }
              $tail->next = $a !== null ? $a : $b;
              return $dummy->next;
          }
        `,
        ruby: code`
          def sortList(head)
            return head if head.nil? || head.next.nil?
            slow = head
            fast = head.next
            while fast && fast.next
              slow = slow.next
              fast = fast.next.next
            end
            right = slow.next
            slow.next = nil
            a = sortList(head)
            b = sortList(right)
            dummy = ListNode.new(0)
            tail = dummy
            while a && b
              if a.val <= b.val
                tail.next = a
                a = a.next
              else
                tail.next = b
                b = b.next
              end
              tail = tail.next
            end
            tail.next = a || b
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Odd Even Linked List (LC 328) ───────────────────────────────
  (() => {
    const ref = (a: number[]) => a.filter((_, i) => i % 2 === 0).concat(a.filter((_, i) => i % 2 === 1));
    return {
      slug: "odd-even-linked-list",
      title: "Odd Even Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Bloomberg", "Adobe"],
      signature: { funcName: "oddEvenList", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list, group all the nodes at **odd positions** first, followed by the nodes at **even positions**, and return the head of the reordered list. Positions count from 1, so the head is odd and the second node even — this is about positions, not values.\n\nKeep the relative order inside each group. Use O(1) extra space and O(n) time.",
        [
          { in: "head = [1,2,3,4,5]", out: "[1,3,5,2,4]" },
          { in: "head = [2,1,3,5,6,4,7]", out: "[2,3,6,7,1,5,4]", note: "Positions 1, 3, 5, 7 hold 2, 3, 6, 7; positions 2, 4, 6 hold 1, 5, 4." },
          { in: "head = []", out: "[]" },
        ],
        ["The number of nodes in the list is in the range [0, 10^4]", "-10^6 <= Node.val <= 10^6"]),
      hints: [
        "Think of the list as two interleaved lists: odd positions and even positions.",
        "Walk with two pointers, `odd` and `even`, each skipping over the other: `odd.next = even.next`, then `even.next = odd.next`.",
        "Remember the head of the even chain before you start, and attach it after the last odd node at the end.",
      ],
      editorial: explain({
        idea: "Unzip the list into its odd-position chain and its even-position chain in one pass by letting each pointer jump over the other, then join the even chain after the odd one.",
        steps: [
          "If the list is empty, return it. Set `odd = head`, `even = head.next`, `evenHead = even`.",
          "While `even` and `even.next` exist: `odd.next = even.next`; `odd = odd.next`; `even.next = odd.next`; `even = even.next`.",
          "Link `odd.next = evenHead` and return `head`.",
        ],
        why: "Each step links an odd node to the next odd node (two ahead) and an even node to the next even node, so the two chains keep their original orders. The loop stops when no odd node remains after `even`, and at that point `odd` is the last odd-position node, where the even chain belongs.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Positions, not values: an even value at position 1 still goes first.",
          "Save `evenHead` before relinking — `head.next` will no longer point at it.",
          "The loop condition must check `even` and `even.next` so `odd` never becomes null.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "[1,3,5,2,4]" },
        { input: "[2,1,3,5,6,4,7]", expectedOutput: "[2,3,6,7,1,5,4]" },
        { input: "[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [10, 1000000]);
        const a = randVals(rng, listLen(rng), -span, span);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def oddEvenList(head: Optional[ListNode]) -> Optional[ListNode]:
              if head is None:
                  return head
              odd, even = head, head.next
              even_head = even
              while even and even.next:
                  odd.next = even.next
                  odd = odd.next
                  even.next = odd.next
                  even = even.next
              odd.next = even_head
              return head
        `,
        javascript: code`
          var oddEvenList = function(head) {
              if (head === null) return head;
              var odd = head, even = head.next, evenHead = even;
              while (even !== null && even.next !== null) {
                  odd.next = even.next;
                  odd = odd.next;
                  even.next = odd.next;
                  even = even.next;
              }
              odd.next = evenHead;
              return head;
          };
        `,
        typescript: code`
          function oddEvenList(head: ListNode | null): ListNode | null {
              if (head === null) return head;
              var odd = head, even = head.next, evenHead = even;
              while (even !== null && even.next !== null) {
                  odd.next = even.next;
                  odd = odd.next;
                  even.next = odd.next;
                  even = even.next;
              }
              odd.next = evenHead;
              return head;
          }
        `,
        java: code`
          public static ListNode oddEvenList(ListNode head) {
              if (head == null) return head;
              ListNode odd = head, even = head.next, evenHead = even;
              while (even != null && even.next != null) {
                  odd.next = even.next;
                  odd = odd.next;
                  even.next = odd.next;
                  even = even.next;
              }
              odd.next = evenHead;
              return head;
          }
        `,
        cpp: code`
          ListNode* oddEvenList(ListNode* head) {
              if (!head) return head;
              ListNode *odd = head, *even = head->next, *evenHead = even;
              while (even && even->next) {
                  odd->next = even->next;
                  odd = odd->next;
                  even->next = odd->next;
                  even = even->next;
              }
              odd->next = evenHead;
              return head;
          }
        `,
        c: code`
          struct ListNode* oddEvenList(struct ListNode* head) {
              if (head == NULL) return head;
              struct ListNode *odd = head, *even = head->next, *evenHead = even;
              while (even != NULL && even->next != NULL) {
                  odd->next = even->next;
                  odd = odd->next;
                  even->next = odd->next;
                  even = even->next;
              }
              odd->next = evenHead;
              return head;
          }
        `,
        csharp: code`
          public static ListNode OddEvenList(ListNode head)
          {
              if (head == null) return head;
              ListNode odd = head, even = head.next, evenHead = even;
              while (even != null && even.next != null)
              {
                  odd.next = even.next;
                  odd = odd.next;
                  even.next = odd.next;
                  even = even.next;
              }
              odd.next = evenHead;
              return head;
          }
        `,
        go: code`
          func oddEvenList(head *ListNode) *ListNode {
              if head == nil {
                  return head
              }
              odd, even := head, head.Next
              evenHead := even
              for even != nil && even.Next != nil {
                  odd.Next = even.Next
                  odd = odd.Next
                  even.Next = odd.Next
                  even = even.Next
              }
              odd.Next = evenHead
              return head
          }
        `,
        kotlin: kt`
          fun oddEvenList(head: ListNode?): ListNode? {
              if (head == null) return head
              var odd: ListNode = head
              var even = head.next
              val evenHead = even
              while (even != null && even.next != null) {
                  odd.next = even.next
                  odd = odd.next!!
                  even.next = odd.next
                  even = even.next
              }
              odd.next = evenHead
              return head
          }
        `,
        swift: code`
          func oddEvenList(_ head: ListNode?) -> ListNode? {
              guard let first = head else { return head }
              var odd = first
              var even = first.next
              let evenHead = even
              while let e = even, let nextOdd = e.next {
                  odd.next = nextOdd
                  odd = nextOdd
                  e.next = nextOdd.next
                  even = e.next
              }
              odd.next = evenHead
              return head
          }
        `,
        rust: code`
          fn oddEvenList(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut odd: Vec<Box<ListNode>> = Vec::new();
              let mut even: Vec<Box<ListNode>> = Vec::new();
              let mut cur = head;
              let mut pos = 1;
              while let Some(mut node) = cur {
                  cur = node.next.take();
                  if pos % 2 == 1 { odd.push(node); } else { even.push(node); }
                  pos += 1;
              }
              odd.extend(even);
              let mut out: Option<Box<ListNode>> = None;
              for mut node in odd.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function oddEvenList($head) {
              if ($head === null) return $head;
              $odd = $head;
              $even = $head->next;
              $evenHead = $even;
              while ($even !== null && $even->next !== null) {
                  $odd->next = $even->next;
                  $odd = $odd->next;
                  $even->next = $odd->next;
                  $even = $even->next;
              }
              $odd->next = $evenHead;
              return $head;
          }
        `,
        ruby: code`
          def oddEvenList(head)
            return head if head.nil?
            odd = head
            even = head.next
            even_head = even
            while even && even.next
              odd.next = even.next
              odd = odd.next
              even.next = odd.next
              even = even.next
            end
            odd.next = even_head
            head
          end
        `,
      },
    };
  })(),

  // ── Add Two Numbers II (LC 445) ─────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => String(BigInt(a.join("")) + BigInt(b.join(""))).split("").map(Number);
    const digits = (rng: Rng) => {
      const len = listLen(rng, 1);
      const d = randVals(rng, len, rng() < 0.15 ? 9 : 0, 9);
      if (len === 1 && rng() < 0.2) d[0] = 0;
      else if (d[0] === 0) d[0] = ri(rng, 1, 9);
      return d;
    };
    return {
      slug: "add-two-numbers-ii",
      title: "Add Two Numbers II",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Math", "Stack", "Amazon", "Microsoft", "Bloomberg"],
      signature: { funcName: "addTwoNumbers", params: [{ name: "l1", type: "ListNode" as const }, { name: "l2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Two non-negative integers are stored in two non-empty singly linked lists, `l1` and `l2`, one decimal digit per node, with the **most significant digit first**. Neither number has leading zeros, except the number 0 itself.\n\nReturn their sum as a linked list in the same form (most significant digit first).",
        [
          { in: "l1 = [7,2,4,3], l2 = [5,6,4]", out: "[7,8,0,7]", note: "7243 + 564 = 7807." },
          { in: "l1 = [2,4,3], l2 = [5,6,4]", out: "[8,0,7]" },
          { in: "l1 = [0], l2 = [0]", out: "[0]" },
        ],
        ["The number of nodes in each list is in the range [1, 100]", "0 <= Node.val <= 9", "Neither number has leading zeros, except the number 0 itself"],
        "Could you solve it without reversing the input lists?"),
      hints: [
        "Addition starts from the ones digits, which are at the *ends* of the lists.",
        "Push the digits of each list onto a stack; popping then yields them from least significant to most significant.",
        "Add popped digits with a carry, and build the answer by inserting each new digit at the **front** of the result list.",
      ],
      editorial: explain({
        idea: "The digits arrive in the wrong order for column addition, so reverse the reading order with two stacks instead of reversing the lists. Building the result by front insertion turns the least-significant-first sums back into most-significant-first order.",
        steps: [
          "Push every digit of `l1` onto stack `s1` and every digit of `l2` onto `s2`.",
          "Set `carry = 0`, `head = null`.",
          "While either stack is non-empty or `carry` is non-zero: `sum = carry + pop(s1, or 0) + pop(s2, or 0)`; create a node with `sum % 10` whose `next` is `head`, make it the new `head`; `carry = sum / 10`.",
          "Return `head`.",
        ],
        why: "Popping the stacks walks both numbers from the ones digit upward in lockstep, which is the column method; each new digit is more significant than the ones already built, so prepending it keeps the result most-significant-first, with the final carry ending up in front.",
        time: "O(m + n)",
        space: "O(m + n) for the stacks and the result",
        pitfalls: [
          "Converting to built-in integers overflows — up to 100 digits.",
          "Do not forget the final carry, which becomes a new leading 1.",
          "Appending at the tail instead of prepending gives the digits backwards.",
        ],
      }),
      examples: [
        { input: "[7,2,4,3]\n[5,6,4]", expectedOutput: "[7,8,0,7]" },
        { input: "[2,4,3]\n[5,6,4]", expectedOutput: "[8,0,7]" },
        { input: "[0]\n[0]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const a = digits(rng), b = digits(rng);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def addTwoNumbers(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
              s1, s2 = [], []
              while l1:
                  s1.append(l1.val)
                  l1 = l1.next
              while l2:
                  s2.append(l2.val)
                  l2 = l2.next
              head = None
              carry = 0
              while s1 or s2 or carry:
                  total = carry
                  if s1:
                      total += s1.pop()
                  if s2:
                      total += s2.pop()
                  head = ListNode(total % 10, head)
                  carry = total // 10
              return head
        `,
        javascript: code`
          var addTwoNumbers = function(l1, l2) {
              var s1 = [], s2 = [];
              for (; l1 !== null; l1 = l1.next) s1.push(l1.val);
              for (; l2 !== null; l2 = l2.next) s2.push(l2.val);
              var head = null, carry = 0;
              while (s1.length > 0 || s2.length > 0 || carry !== 0) {
                  var sum = carry;
                  if (s1.length > 0) sum += s1.pop();
                  if (s2.length > 0) sum += s2.pop();
                  head = new ListNode(sum % 10, head);
                  carry = Math.floor(sum / 10);
              }
              return head;
          };
        `,
        typescript: code`
          function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
              var s1: number[] = [], s2: number[] = [];
              for (; l1 !== null; l1 = l1.next) s1.push(l1.val);
              for (; l2 !== null; l2 = l2.next) s2.push(l2.val);
              var head: ListNode | null = null, carry = 0;
              while (s1.length > 0 || s2.length > 0 || carry !== 0) {
                  var sum = carry;
                  if (s1.length > 0) sum += s1.pop();
                  if (s2.length > 0) sum += s2.pop();
                  head = new ListNode(sum % 10, head);
                  carry = Math.floor(sum / 10);
              }
              return head;
          }
        `,
        java: code`
          public static ListNode addTwoNumbers(ListNode l1, ListNode l2) {
              java.util.ArrayDeque<Integer> s1 = new java.util.ArrayDeque<>(), s2 = new java.util.ArrayDeque<>();
              for (; l1 != null; l1 = l1.next) s1.push(l1.val);
              for (; l2 != null; l2 = l2.next) s2.push(l2.val);
              ListNode head = null;
              int carry = 0;
              while (!s1.isEmpty() || !s2.isEmpty() || carry != 0) {
                  int sum = carry;
                  if (!s1.isEmpty()) sum += s1.pop();
                  if (!s2.isEmpty()) sum += s2.pop();
                  head = new ListNode(sum % 10, head);
                  carry = sum / 10;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
              vector<int> s1, s2;
              for (; l1; l1 = l1->next) s1.push_back(l1->val);
              for (; l2; l2 = l2->next) s2.push_back(l2->val);
              ListNode* head = nullptr;
              int carry = 0;
              while (!s1.empty() || !s2.empty() || carry) {
                  int sum = carry;
                  if (!s1.empty()) { sum += s1.back(); s1.pop_back(); }
                  if (!s2.empty()) { sum += s2.back(); s2.pop_back(); }
                  head = new ListNode(sum % 10, head);
                  carry = sum / 10;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
              int n1 = 0, n2 = 0;
              for (struct ListNode* p = l1; p != NULL; p = p->next) n1++;
              for (struct ListNode* p = l2; p != NULL; p = p->next) n2++;
              int* s1 = (int*) malloc(sizeof(int) * (n1 + 1));
              int* s2 = (int*) malloc(sizeof(int) * (n2 + 1));
              int t1 = 0, t2 = 0;
              for (; l1 != NULL; l1 = l1->next) s1[t1++] = l1->val;
              for (; l2 != NULL; l2 = l2->next) s2[t2++] = l2->val;
              struct ListNode* head = NULL;
              int carry = 0;
              while (t1 > 0 || t2 > 0 || carry != 0) {
                  int sum = carry;
                  if (t1 > 0) sum += s1[--t1];
                  if (t2 > 0) sum += s2[--t2];
                  struct ListNode* node = (struct ListNode*) malloc(sizeof(struct ListNode));
                  node->val = sum % 10;
                  node->next = head;
                  head = node;
                  carry = sum / 10;
              }
              free(s1);
              free(s2);
              return head;
          }
        `,
        csharp: code`
          public static ListNode AddTwoNumbers(ListNode l1, ListNode l2)
          {
              var s1 = new Stack<int>();
              var s2 = new Stack<int>();
              for (; l1 != null; l1 = l1.next) s1.Push(l1.val);
              for (; l2 != null; l2 = l2.next) s2.Push(l2.val);
              ListNode head = null;
              int carry = 0;
              while (s1.Count > 0 || s2.Count > 0 || carry != 0)
              {
                  int sum = carry;
                  if (s1.Count > 0) sum += s1.Pop();
                  if (s2.Count > 0) sum += s2.Pop();
                  head = new ListNode(sum % 10, head);
                  carry = sum / 10;
              }
              return head;
          }
        `,
        go: code`
          func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
              var s1, s2 []int
              for ; l1 != nil; l1 = l1.Next {
                  s1 = append(s1, l1.Val)
              }
              for ; l2 != nil; l2 = l2.Next {
                  s2 = append(s2, l2.Val)
              }
              var head *ListNode
              carry := 0
              for len(s1) > 0 || len(s2) > 0 || carry != 0 {
                  sum := carry
                  if len(s1) > 0 {
                      sum += s1[len(s1)-1]
                      s1 = s1[:len(s1)-1]
                  }
                  if len(s2) > 0 {
                      sum += s2[len(s2)-1]
                      s2 = s2[:len(s2)-1]
                  }
                  head = &ListNode{Val: sum % 10, Next: head}
                  carry = sum / 10
              }
              return head
          }
        `,
        kotlin: kt`
          fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {
              val s1 = ArrayList<Int>()
              val s2 = ArrayList<Int>()
              var p = l1
              while (p != null) { s1.add(p.\`val\`); p = p.next }
              p = l2
              while (p != null) { s2.add(p.\`val\`); p = p.next }
              var head: ListNode? = null
              var carry = 0
              while (s1.isNotEmpty() || s2.isNotEmpty() || carry != 0) {
                  var sum = carry
                  if (s1.isNotEmpty()) sum += s1.removeAt(s1.size - 1)
                  if (s2.isNotEmpty()) sum += s2.removeAt(s2.size - 1)
                  val node = ListNode(sum % 10)
                  node.next = head
                  head = node
                  carry = sum / 10
              }
              return head
          }
        `,
        swift: code`
          func addTwoNumbers(_ l1: ListNode?, _ l2: ListNode?) -> ListNode? {
              var s1: [Int] = [], s2: [Int] = []
              var p = l1
              while let node = p { s1.append(node.val); p = node.next }
              p = l2
              while let node = p { s2.append(node.val); p = node.next }
              var head: ListNode? = nil
              var carry = 0
              while !s1.isEmpty || !s2.isEmpty || carry != 0 {
                  var sum = carry
                  if let d = s1.popLast() { sum += d }
                  if let d = s2.popLast() { sum += d }
                  head = ListNode(sum % 10, head)
                  carry = sum / 10
              }
              return head
          }
        `,
        rust: code`
          fn addTwoNumbers(l1: Option<Box<ListNode>>, l2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut s1: Vec<i32> = Vec::new();
              let mut s2: Vec<i32> = Vec::new();
              let mut p = &l1;
              while let Some(node) = p { s1.push(node.val); p = &node.next; }
              let mut p = &l2;
              while let Some(node) = p { s2.push(node.val); p = &node.next; }
              let mut head: Option<Box<ListNode>> = None;
              let mut carry = 0;
              while !s1.is_empty() || !s2.is_empty() || carry != 0 {
                  let sum = carry + s1.pop().unwrap_or(0) + s2.pop().unwrap_or(0);
                  let mut node = Box::new(ListNode::new(sum % 10));
                  node.next = head;
                  head = Some(node);
                  carry = sum / 10;
              }
              head
          }
        `,
        php: code`
          function addTwoNumbers($l1, $l2) {
              $s1 = [];
              $s2 = [];
              for (; $l1 !== null; $l1 = $l1->next) $s1[] = $l1->val;
              for (; $l2 !== null; $l2 = $l2->next) $s2[] = $l2->val;
              $head = null;
              $carry = 0;
              while (count($s1) > 0 || count($s2) > 0 || $carry !== 0) {
                  $sum = $carry;
                  if (count($s1) > 0) $sum += array_pop($s1);
                  if (count($s2) > 0) $sum += array_pop($s2);
                  $head = new ListNode($sum % 10, $head);
                  $carry = intdiv($sum, 10);
              }
              return $head;
          }
        `,
        ruby: code`
          def addTwoNumbers(l1, l2)
            s1 = []
            s2 = []
            while l1
              s1 << l1.val
              l1 = l1.next
            end
            while l2
              s2 << l2.val
              l2 = l2.next
            end
            head = nil
            carry = 0
            while !s1.empty? || !s2.empty? || carry != 0
              sum = carry
              sum += s1.pop unless s1.empty?
              sum += s2.pop unless s2.empty?
              head = ListNode.new(sum % 10, head)
              carry = sum / 10
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Linked List Components (LC 817) ─────────────────────────────
  (() => {
    const ref = (a: number[], nums: number[]) => {
      const s = new Set(nums);
      let count = 0;
      for (let i = 0; i < a.length; i++) if (s.has(a[i]) && (i === 0 || !s.has(a[i - 1]))) count++;
      return count;
    };
    return {
      slug: "linked-list-components",
      title: "Linked List Components",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Hash Table", "Array", "Google"],
      signature: { funcName: "numComponents", params: [{ name: "head", type: "ListNode" as const }, { name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given the `head` of a singly linked list of `n` nodes whose values are the distinct integers `0` to `n - 1` (in some order), and an array `nums` holding some of those values, each at most once.\n\nTwo values of `nums` are **connected** if their nodes are adjacent in the list. Return the number of **connected components** of `nums` — the number of maximal runs of consecutive list nodes whose values all belong to `nums`.",
        [
          { in: "head = [0,1,2,3], nums = [0,1,3]", out: "2", note: "0 and 1 are adjacent and form one component; 3 is alone." },
          { in: "head = [0,1,2,3,4], nums = [0,3,1,4]", out: "2", note: "The runs are [0,1] and [3,4]." },
          { in: "head = [2,0,1], nums = [1]", out: "1" },
        ],
        ["The number of nodes in the list is n", "1 <= n <= 10^4", "0 <= Node.val < n", "All the values Node.val are unique", "1 <= nums.length <= n", "0 <= nums[i] < n", "All the values of nums are unique"]),
      hints: [
        "Only the list's order matters; `nums`'s own order is irrelevant. Put `nums` in a set for O(1) membership tests.",
        "Walk the list. A component is a maximal run of nodes in the set.",
        "Count the nodes that **end** a run: a node in the set whose next node is missing or not in the set.",
      ],
      editorial: explain({
        idea: "A component is a maximal run of set members along the list, and every run has exactly one last node. So count the nodes that are in the set but whose successor is not.",
        steps: [
          "Insert all of `nums` into a hash set (or a boolean array indexed by value).",
          "Walk the list; for each node in the set, if `node.next` is null or `node.next.val` is not in the set, increase the count.",
          "Return the count.",
        ],
        why: "Runs are disjoint, and each one ends at exactly one node — the member whose successor is not a member (or does not exist). Counting those nodes therefore counts each run exactly once.",
        time: "O(n + |nums|)",
        space: "O(|nums|) for the set",
        pitfalls: [
          "Counting nodes in `nums` instead of runs overcounts adjacent members.",
          "Adjacency is about list neighbours, not consecutive integers: 3 and 4 are connected only if their nodes touch.",
          "Checking `nums.includes` inside the loop makes it O(n·|nums|).",
        ],
      }),
      examples: [
        { input: "[0,1,2,3]\n[0,1,3]", expectedOutput: "2" },
        { input: "[0,1,2,3,4]\n[0,3,1,4]", expectedOutput: "2" },
        { input: "[2,0,1]\n[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = listLen(rng, 1);
        const a = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const k = rng() < 0.15 ? n : ri(rng, 1, n);
        const nums = shuffle(rng, a.slice()).slice(0, k);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(nums)}`, expectedOutput: String(ref(a, nums)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def numComponents(head: Optional[ListNode], nums: List[int]) -> int:
              members = set(nums)
              count = 0
              while head:
                  if head.val in members and (head.next is None or head.next.val not in members):
                      count += 1
                  head = head.next
              return count
        `,
        javascript: code`
          var numComponents = function(head, nums) {
              var members = new Set(nums), count = 0;
              for (; head !== null; head = head.next) {
                  if (members.has(head.val) && (head.next === null || !members.has(head.next.val))) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function numComponents(head: ListNode | null, nums: number[]): number {
              var members: { [v: number]: boolean } = {};
              for (var i = 0; i < nums.length; i++) members[nums[i]] = true;
              var count = 0;
              for (; head !== null; head = head.next) {
                  if (members[head.val] && (head.next === null || !members[head.next.val])) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int numComponents(ListNode head, int[] nums) {
              java.util.HashSet<Integer> members = new java.util.HashSet<>();
              for (int x : nums) members.add(x);
              int count = 0;
              for (; head != null; head = head.next) {
                  if (members.contains(head.val) && (head.next == null || !members.contains(head.next.val))) count++;
              }
              return count;
          }
        `,
        cpp: code`
          int numComponents(ListNode* head, vector<int>& nums) {
              unordered_set<int> members(nums.begin(), nums.end());
              int count = 0;
              for (; head; head = head->next) {
                  if (members.count(head->val) && (!head->next || !members.count(head->next->val))) count++;
              }
              return count;
          }
        `,
        c: code`
          int numComponents(struct ListNode* head, int* nums, int numsSize) {
              int n = 0;
              for (struct ListNode* p = head; p != NULL; p = p->next) n++;
              char* member = (char*) calloc(n + 1, 1);
              for (int i = 0; i < numsSize; i++) member[nums[i]] = 1;
              int count = 0;
              for (; head != NULL; head = head->next) {
                  if (member[head->val] && (head->next == NULL || !member[head->next->val])) count++;
              }
              free(member);
              return count;
          }
        `,
        csharp: code`
          public static int NumComponents(ListNode head, int[] nums)
          {
              var members = new HashSet<int>(nums);
              int count = 0;
              for (; head != null; head = head.next)
              {
                  if (members.Contains(head.val) && (head.next == null || !members.Contains(head.next.val))) count++;
              }
              return count;
          }
        `,
        go: code`
          func numComponents(head *ListNode, nums []int) int {
              members := make(map[int]bool, len(nums))
              for _, x := range nums {
                  members[x] = true
              }
              count := 0
              for ; head != nil; head = head.Next {
                  if members[head.Val] && (head.Next == nil || !members[head.Next.Val]) {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: kt`
          fun numComponents(head: ListNode?, nums: IntArray): Int {
              val members = nums.toHashSet()
              var count = 0
              var cur = head
              while (cur != null) {
                  val nx = cur.next
                  if (cur.\`val\` in members && (nx == null || nx.\`val\` !in members)) count++
                  cur = nx
              }
              return count
          }
        `,
        swift: code`
          func numComponents(_ head: ListNode?, _ nums: [Int]) -> Int {
              let members = Set(nums)
              var count = 0
              var cur = head
              while let node = cur {
                  if members.contains(node.val) {
                      if let nx = node.next, members.contains(nx.val) {} else { count += 1 }
                  }
                  cur = node.next
              }
              return count
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn numComponents(head: Option<Box<ListNode>>, nums: Vec<i32>) -> i32 {
              let members: HashSet<i32> = nums.into_iter().collect();
              let mut count = 0;
              let mut cur = &head;
              while let Some(node) = cur {
                  if members.contains(&node.val) {
                      let ends = match &node.next {
                          None => true,
                          Some(nx) => !members.contains(&nx.val),
                      };
                      if ends { count += 1; }
                  }
                  cur = &node.next;
              }
              count
          }
        `,
        php: code`
          function numComponents($head, $nums) {
              $members = array_flip($nums);
              $count = 0;
              for (; $head !== null; $head = $head->next) {
                  if (isset($members[$head->val]) && ($head->next === null || !isset($members[$head->next->val]))) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          require 'set'

          def numComponents(head, nums)
            members = nums.to_set
            count = 0
            while head
              count += 1 if members.include?(head.val) && (head.next.nil? || !members.include?(head.next.val))
              head = head.next
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Next Greater Node In Linked List (LC 1019) ──────────────────
  (() => {
    const ref = (a: number[]) => a.map((v, i) => {
      for (let j = i + 1; j < a.length; j++) if (a[j] > v) return a[j];
      return 0;
    });
    return {
      slug: "next-greater-node-in-linked-list",
      title: "Next Greater Node In Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Stack", "Monotonic Stack", "Array", "Amazon", "Microsoft"],
      signature: { funcName: "nextLargerNodes", params: [{ name: "head", type: "ListNode" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the `head` of a singly linked list with `n` nodes. For each node, find the value of the **first node after it** whose value is **strictly larger**.\n\nReturn an integer array `answer` where `answer[i]` is that value for the `i`-th node (0-indexed), or `0` if no later node is larger.",
        [
          { in: "head = [2,1,5]", out: "[5,5,0]", note: "Both 2 and 1 first meet 5; nothing after 5 is larger." },
          { in: "head = [2,7,4,3,5]", out: "[7,0,5,5,0]" },
          { in: "head = [4,4,4]", out: "[0,0,0]", note: "An equal value is not larger." },
        ],
        ["The number of nodes in the list is n", "1 <= n <= 10^4", "1 <= Node.val <= 10^9"]),
      hints: [
        "Checking every later node for every node is O(n²) — too slow for 10^4 nodes in the worst case.",
        "Copy the values into an array so positions can be addressed, and keep a stack of positions that are still waiting for a larger value.",
        "Keep the waiting values decreasing: when a new value arrives, it is the answer for every waiting position with a smaller value — pop them and record it. Then push the new position.",
      ],
      editorial: explain({
        idea: "A monotonic stack: the positions still waiting for a larger value always have non-increasing values from bottom to top, so a new value resolves a run of them from the top in one go.",
        steps: [
          "Read the list into an array `vals`; let `answer` be `n` zeros.",
          "For each index `i`: while the stack is non-empty and `vals[top] < vals[i]`, pop `top` and set `answer[top] = vals[i]`.",
          "Push `i`.",
          "Positions left on the stack never meet a larger value and keep their 0; return `answer`.",
        ],
        why: "When `vals[i]` pops index `j`, every index between them was either popped earlier by a value ≤ `vals[i]`'s competitors or is still above `j` — in both cases no value between them exceeded `vals[j]` before `i`, otherwise `j` would already have been popped. So `vals[i]` is the first larger value after `j`. Each index is pushed and popped at most once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Use strict `<` when popping: an equal value does not count as larger.",
          "Store indices, not values, on the stack — the answer is written by position.",
          "Values reach 10^9, which still fits in a 32-bit int; no arithmetic is done on them.",
        ],
      }),
      examples: [
        { input: "[2,1,5]", expectedOutput: "[5,5,0]" },
        { input: "[2,7,4,3,5]", expectedOutput: "[7,0,5,5,0]" },
        { input: "[4,4,4]", expectedOutput: "[0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [3, 20, 1000, 1000000000]);
        let a = randVals(rng, listLen(rng, 1), 1, hi);
        const r = rng();
        if (r < 0.08) a = a.sort((x, y) => x - y);
        else if (r < 0.16) a = a.sort((x, y) => y - x);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def nextLargerNodes(head: Optional[ListNode]) -> List[int]:
              vals = []
              while head:
                  vals.append(head.val)
                  head = head.next
              answer = [0] * len(vals)
              stack = []
              for i, v in enumerate(vals):
                  while stack and vals[stack[-1]] < v:
                      answer[stack.pop()] = v
                  stack.append(i)
              return answer
        `,
        javascript: code`
          var nextLargerNodes = function(head) {
              var vals = [];
              for (; head !== null; head = head.next) vals.push(head.val);
              var answer = new Array(vals.length).fill(0), stack = [];
              for (var i = 0; i < vals.length; i++) {
                  while (stack.length > 0 && vals[stack[stack.length - 1]] < vals[i]) answer[stack.pop()] = vals[i];
                  stack.push(i);
              }
              return answer;
          };
        `,
        typescript: code`
          function nextLargerNodes(head: ListNode | null): number[] {
              var vals: number[] = [];
              for (; head !== null; head = head.next) vals.push(head.val);
              var answer: number[] = [], stack: number[] = [];
              for (var k = 0; k < vals.length; k++) answer.push(0);
              for (var i = 0; i < vals.length; i++) {
                  while (stack.length > 0 && vals[stack[stack.length - 1]] < vals[i]) answer[stack.pop()] = vals[i];
                  stack.push(i);
              }
              return answer;
          }
        `,
        java: code`
          public static int[] nextLargerNodes(ListNode head) {
              java.util.ArrayList<Integer> vals = new java.util.ArrayList<>();
              for (; head != null; head = head.next) vals.add(head.val);
              int n = vals.size();
              int[] answer = new int[n];
              int[] stack = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  int v = vals.get(i);
                  while (top > 0 && vals.get(stack[top - 1]) < v) answer[stack[--top]] = v;
                  stack[top++] = i;
              }
              return answer;
          }
        `,
        cpp: code`
          vector<int> nextLargerNodes(ListNode* head) {
              vector<int> vals;
              for (; head; head = head->next) vals.push_back(head->val);
              vector<int> answer(vals.size(), 0), stack;
              for (int i = 0; i < (int) vals.size(); i++) {
                  while (!stack.empty() && vals[stack.back()] < vals[i]) { answer[stack.back()] = vals[i]; stack.pop_back(); }
                  stack.push_back(i);
              }
              return answer;
          }
        `,
        c: code`
          int* nextLargerNodes(struct ListNode* head, int* returnSize) {
              int n = 0;
              for (struct ListNode* p = head; p != NULL; p = p->next) n++;
              int* vals = (int*) malloc(sizeof(int) * (n + 1));
              int* answer = (int*) malloc(sizeof(int) * (n + 1));
              int* stack = (int*) malloc(sizeof(int) * (n + 1));
              int i = 0, top = 0;
              for (struct ListNode* p = head; p != NULL; p = p->next) vals[i++] = p->val;
              for (i = 0; i < n; i++) {
                  answer[i] = 0;
                  while (top > 0 && vals[stack[top - 1]] < vals[i]) answer[stack[--top]] = vals[i];
                  stack[top++] = i;
              }
              free(vals);
              free(stack);
              *returnSize = n;
              return answer;
          }
        `,
        csharp: code`
          public static int[] NextLargerNodes(ListNode head)
          {
              var vals = new List<int>();
              for (; head != null; head = head.next) vals.Add(head.val);
              int n = vals.Count;
              var answer = new int[n];
              var stack = new Stack<int>();
              for (int i = 0; i < n; i++)
              {
                  while (stack.Count > 0 && vals[stack.Peek()] < vals[i]) answer[stack.Pop()] = vals[i];
                  stack.Push(i);
              }
              return answer;
          }
        `,
        go: code`
          func nextLargerNodes(head *ListNode) []int {
              var vals []int
              for ; head != nil; head = head.Next {
                  vals = append(vals, head.Val)
              }
              answer := make([]int, len(vals))
              stack := []int{}
              for i, v := range vals {
                  for len(stack) > 0 && vals[stack[len(stack)-1]] < v {
                      answer[stack[len(stack)-1]] = v
                      stack = stack[:len(stack)-1]
                  }
                  stack = append(stack, i)
              }
              return answer
          }
        `,
        kotlin: kt`
          fun nextLargerNodes(head: ListNode?): IntArray {
              val vals = ArrayList<Int>()
              var p = head
              while (p != null) { vals.add(p.\`val\`); p = p.next }
              val answer = IntArray(vals.size)
              val stack = IntArray(vals.size)
              var top = 0
              for (i in vals.indices) {
                  while (top > 0 && vals[stack[top - 1]] < vals[i]) { top--; answer[stack[top]] = vals[i] }
                  stack[top++] = i
              }
              return answer
          }
        `,
        swift: code`
          func nextLargerNodes(_ head: ListNode?) -> [Int] {
              var vals: [Int] = []
              var p = head
              while let node = p { vals.append(node.val); p = node.next }
              var answer = [Int](repeating: 0, count: vals.count)
              var stack: [Int] = []
              for i in 0..<vals.count {
                  while let top = stack.last, vals[top] < vals[i] {
                      answer[top] = vals[i]
                      stack.removeLast()
                  }
                  stack.append(i)
              }
              return answer
          }
        `,
        rust: code`
          fn nextLargerNodes(head: Option<Box<ListNode>>) -> Vec<i32> {
              let mut vals: Vec<i32> = Vec::new();
              let mut p = &head;
              while let Some(node) = p { vals.push(node.val); p = &node.next; }
              let mut answer = vec![0; vals.len()];
              let mut stack: Vec<usize> = Vec::new();
              for i in 0..vals.len() {
                  while let Some(&top) = stack.last() {
                      if vals[top] >= vals[i] { break; }
                      answer[top] = vals[i];
                      stack.pop();
                  }
                  stack.push(i);
              }
              answer
          }
        `,
        php: code`
          function nextLargerNodes($head) {
              $vals = [];
              for (; $head !== null; $head = $head->next) $vals[] = $head->val;
              $n = count($vals);
              $answer = array_fill(0, $n, 0);
              $stack = [];
              for ($i = 0; $i < $n; $i++) {
                  while (count($stack) > 0 && $vals[$stack[count($stack) - 1]] < $vals[$i]) $answer[array_pop($stack)] = $vals[$i];
                  $stack[] = $i;
              }
              return $answer;
          }
        `,
        ruby: code`
          def nextLargerNodes(head)
            vals = []
            while head
              vals << head.val
              head = head.next
            end
            answer = Array.new(vals.size, 0)
            stack = []
            vals.each_with_index do |v, i|
              answer[stack.pop] = v while !stack.empty? && vals[stack[-1]] < v
              stack << i
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Merge In Between Linked Lists (LC 1669) ─────────────────────
  (() => {
    const ref = (a: number[], x: number, y: number, b: number[]) => a.slice(0, x).concat(b, a.slice(y + 1));
    return {
      slug: "merge-in-between-linked-lists",
      title: "Merge In Between Linked Lists",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon"],
      signature: { funcName: "mergeInBetween", params: [{ name: "list1", type: "ListNode" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "list2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given two singly linked lists, `list1` and `list2`, and two integers `a <= b`. Remove the nodes of `list1` at positions `a` through `b` (0-indexed, inclusive) and put the whole of `list2` in their place.\n\nReturn the head of the resulting list.",
        [
          { in: "list1 = [10,1,13,6,9,5], a = 3, b = 4, list2 = [100,101,102]", out: "[10,1,13,100,101,102,5]", note: "Positions 3 and 4 (values 6 and 9) are replaced by list2." },
          { in: "list1 = [0,1,2,3,4,5,6], a = 2, b = 5, list2 = [90,91,92,93,94]", out: "[0,1,90,91,92,93,94,6]" },
          { in: "list1 = [4,8,15], a = 1, b = 1, list2 = [16]", out: "[4,16,15]" },
        ],
        ["3 <= list1.length <= 10^4", "1 <= a <= b < list1.length - 1", "1 <= list2.length <= 10^4", "0 <= Node.val <= 10^6"]),
      hints: [
        "Only two places in `list1` matter: the node just before position `a` and the node just after position `b`.",
        "Walk `list1` once to find both (positions `a - 1` and `b + 1`); the constraints guarantee they exist.",
        "Find the tail of `list2`, then link `before.next = list2` and `tail.next = after`.",
      ],
      editorial: explain({
        idea: "Splicing a list in costs two link changes once the two boundary nodes are found: the node before the removed block points at `list2`, and `list2`'s tail points at the node after the block.",
        steps: [
          "Walk `a - 1` steps from `list1` to `before`.",
          "Continue from `before` another `b - a + 2` steps to `after`, the node at position `b + 1`.",
          "Walk `list2` to its last node `tail`.",
          "Set `before.next = list2`, `tail.next = after`, and return `list1`.",
        ],
        why: "Positions `a..b` are exactly the nodes strictly between `before` and `after`; redirecting `before` to `list2` and `list2`'s tail to `after` removes them and inserts `list2` in their place, leaving the rest of `list1` linked as before. Since `a >= 1`, the head of `list1` never changes.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "Off by one: `before` is at position `a - 1` and `after` at `b + 1`.",
          "Forgetting to connect `list2`'s tail cuts off the rest of `list1`.",
          "Find `after` before changing `before.next`, or the removed block is no longer reachable from `before`.",
        ],
      }),
      examples: [
        { input: "[10,1,13,6,9,5]\n3\n4\n[100,101,102]", expectedOutput: "[10,1,13,100,101,102,5]" },
        { input: "[0,1,2,3,4,5,6]\n2\n5\n[90,91,92,93,94]", expectedOutput: "[0,1,90,91,92,93,94,6]" },
        { input: "[4,8,15]\n1\n1\n[16]", expectedOutput: "[4,16,15]" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [9, 1000, 1000000]);
        const l1 = randVals(rng, ri(rng, 3, pick(rng, [3, 6, 15, 30])), 0, hi);
        const l2 = randVals(rng, ri(rng, 1, pick(rng, [1, 3, 10, 20])), 0, hi);
        const x = ri(rng, 1, l1.length - 2), y = ri(rng, 1, l1.length - 2);
        const a = Math.min(x, y), b = Math.max(x, y);
        return { input: `${fmtIntArr(l1)}\n${a}\n${b}\n${fmtIntArr(l2)}`, expectedOutput: fmtIntArr(ref(l1, a, b, l2)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def mergeInBetween(list1: Optional[ListNode], a: int, b: int, list2: Optional[ListNode]) -> Optional[ListNode]:
              before = list1
              for _ in range(a - 1):
                  before = before.next
              after = before
              for _ in range(b - a + 2):
                  after = after.next
              tail = list2
              while tail.next:
                  tail = tail.next
              before.next = list2
              tail.next = after
              return list1
        `,
        javascript: code`
          var mergeInBetween = function(list1, a, b, list2) {
              var before = list1;
              for (var i = 0; i < a - 1; i++) before = before.next;
              var after = before;
              for (var j = 0; j < b - a + 2; j++) after = after.next;
              var tail = list2;
              while (tail.next !== null) tail = tail.next;
              before.next = list2;
              tail.next = after;
              return list1;
          };
        `,
        typescript: code`
          function mergeInBetween(list1: ListNode | null, a: number, b: number, list2: ListNode | null): ListNode | null {
              var before = list1;
              for (var i = 0; i < a - 1; i++) before = before.next;
              var after = before;
              for (var j = 0; j < b - a + 2; j++) after = after.next;
              var tail = list2;
              while (tail.next !== null) tail = tail.next;
              before.next = list2;
              tail.next = after;
              return list1;
          }
        `,
        java: code`
          public static ListNode mergeInBetween(ListNode list1, int a, int b, ListNode list2) {
              ListNode before = list1;
              for (int i = 0; i < a - 1; i++) before = before.next;
              ListNode after = before;
              for (int j = 0; j < b - a + 2; j++) after = after.next;
              ListNode tail = list2;
              while (tail.next != null) tail = tail.next;
              before.next = list2;
              tail.next = after;
              return list1;
          }
        `,
        cpp: code`
          ListNode* mergeInBetween(ListNode* list1, int a, int b, ListNode* list2) {
              ListNode* before = list1;
              for (int i = 0; i < a - 1; i++) before = before->next;
              ListNode* after = before;
              for (int j = 0; j < b - a + 2; j++) after = after->next;
              ListNode* tail = list2;
              while (tail->next) tail = tail->next;
              before->next = list2;
              tail->next = after;
              return list1;
          }
        `,
        c: code`
          struct ListNode* mergeInBetween(struct ListNode* list1, int a, int b, struct ListNode* list2) {
              struct ListNode* before = list1;
              for (int i = 0; i < a - 1; i++) before = before->next;
              struct ListNode* after = before;
              for (int j = 0; j < b - a + 2; j++) after = after->next;
              struct ListNode* tail = list2;
              while (tail->next != NULL) tail = tail->next;
              before->next = list2;
              tail->next = after;
              return list1;
          }
        `,
        csharp: code`
          public static ListNode MergeInBetween(ListNode list1, int a, int b, ListNode list2)
          {
              var before = list1;
              for (int i = 0; i < a - 1; i++) before = before.next;
              var after = before;
              for (int j = 0; j < b - a + 2; j++) after = after.next;
              var tail = list2;
              while (tail.next != null) tail = tail.next;
              before.next = list2;
              tail.next = after;
              return list1;
          }
        `,
        go: code`
          func mergeInBetween(list1 *ListNode, a int, b int, list2 *ListNode) *ListNode {
              before := list1
              for i := 0; i < a-1; i++ {
                  before = before.Next
              }
              after := before
              for j := 0; j < b-a+2; j++ {
                  after = after.Next
              }
              tail := list2
              for tail.Next != nil {
                  tail = tail.Next
              }
              before.Next = list2
              tail.Next = after
              return list1
          }
        `,
        kotlin: kt`
          fun mergeInBetween(list1: ListNode?, a: Int, b: Int, list2: ListNode?): ListNode? {
              var before: ListNode = list1!!
              repeat(a - 1) { before = before.next!! }
              var after: ListNode? = before
              repeat(b - a + 2) { after = after!!.next }
              var tail: ListNode = list2!!
              while (tail.next != null) tail = tail.next!!
              before.next = list2
              tail.next = after
              return list1
          }
        `,
        swift: code`
          func mergeInBetween(_ list1: ListNode?, _ a: Int, _ b: Int, _ list2: ListNode?) -> ListNode? {
              var before = list1!
              for _ in 0..<(a - 1) { before = before.next! }
              var after: ListNode? = before
              for _ in 0..<(b - a + 2) { after = after!.next }
              var tail = list2!
              while let nx = tail.next { tail = nx }
              before.next = list2
              tail.next = after
              return list1
          }
        `,
        rust: code`
          fn mergeInBetween(list1: Option<Box<ListNode>>, a: i32, b: i32, list2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let detach = |head: Option<Box<ListNode>>| -> Vec<Box<ListNode>> {
                  let mut nodes = Vec::new();
                  let mut cur = head;
                  while let Some(mut node) = cur {
                      cur = node.next.take();
                      nodes.push(node);
                  }
                  nodes
              };
              let first = detach(list1);
              let second = detach(list2);
              let (a, b) = (a as usize, b as usize);
              let mut order: Vec<Box<ListNode>> = Vec::new();
              let mut rest: Vec<Box<ListNode>> = Vec::new();
              for (i, node) in first.into_iter().enumerate() {
                  if i < a { order.push(node); } else if i > b { rest.push(node); }
              }
              order.extend(second);
              order.extend(rest);
              let mut out: Option<Box<ListNode>> = None;
              for mut node in order.into_iter().rev() {
                  node.next = out;
                  out = Some(node);
              }
              out
          }
        `,
        php: code`
          function mergeInBetween($list1, $a, $b, $list2) {
              $before = $list1;
              for ($i = 0; $i < $a - 1; $i++) $before = $before->next;
              $after = $before;
              for ($j = 0; $j < $b - $a + 2; $j++) $after = $after->next;
              $tail = $list2;
              while ($tail->next !== null) $tail = $tail->next;
              $before->next = $list2;
              $tail->next = $after;
              return $list1;
          }
        `,
        ruby: code`
          def mergeInBetween(list1, a, b, list2)
            before = list1
            (a - 1).times { before = before.next }
            after = before
            (b - a + 2).times { after = after.next }
            tail = list2
            tail = tail.next while tail.next
            before.next = list2
            tail.next = after
            list1
          end
        `,
      },
    };
  })(),

  // ── Swapping Nodes in a Linked List (LC 1721) ───────────────────
  (() => {
    const ref = (a: number[], k: number) => {
      const b = a.slice();
      const i = k - 1, j = a.length - k;
      [b[i], b[j]] = [b[j], b[i]];
      return b;
    };
    return {
      slug: "swapping-nodes-in-a-linked-list",
      title: "Swapping Nodes in a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft"],
      signature: { funcName: "swapNodes", params: [{ name: "head", type: "ListNode" as const }, { name: "k", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "Given the `head` of a singly linked list and an integer `k`, swap the **values** of the `k`-th node from the beginning and the `k`-th node from the end (positions counted from 1), and return the head of the list.",
        [
          { in: "head = [1,2,3,4,5], k = 2", out: "[1,4,3,2,5]", note: "The 2nd node from the front holds 2, the 2nd from the end holds 4." },
          { in: "head = [7,9,6,6,7,8,3,0,9,5], k = 5", out: "[7,9,6,6,8,7,3,0,9,5]" },
          { in: "head = [1,2,3], k = 2", out: "[1,2,3]", note: "Both counts land on the middle node, so nothing changes." },
        ],
        ["The number of nodes in the list is n", "1 <= k <= n <= 10^5", "0 <= Node.val <= 100"]),
      hints: [
        "The k-th node from the end is the (n − k + 1)-th from the front.",
        "To find it in one pass, walk a pointer to the k-th node first; then start a second pointer at the head and move both until the first one reaches the last node.",
        "The second pointer then sits on the k-th node from the end. Swap the two nodes' values.",
      ],
      editorial: explain({
        idea: "The k-th node from the front is reached by walking `k - 1` steps. From there, a second pointer started at the head and moved in lockstep until the front pointer hits the last node lands on the k-th node from the end. Swapping their values finishes the job.",
        steps: [
          "Walk `first` from `head` `k - 1` steps — the k-th node.",
          "Set `fast = first` and `second = head`; while `fast.next` exists, advance both.",
          "Swap `first.val` and `second.val`; return `head`.",
        ],
        why: "When `fast` stops on the last node (position n) it has moved `n - k` steps from position k, so `second` has moved the same `n - k` steps from position 1 and is at position `n - k + 1` — the k-th node from the end.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "When both positions coincide (the middle of an odd list) the swap is a no-op — that is correct.",
          "`k` may be larger than `n / 2`; the two pointers simply cross, and the swap is still right.",
          "Swapping values is what the problem asks for; relinking the nodes is possible but much more error-prone when they are adjacent.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[1,4,3,2,5]" },
        { input: "[7,9,6,6,7,8,3,0,9,5]\n5", expectedOutput: "[7,9,6,6,8,7,3,0,9,5]" },
        { input: "[1,2,3]\n2", expectedOutput: "[1,2,3]" },
      ],
      gen: (rng: Rng) => {
        const a = randVals(rng, listLen(rng, 1), 0, 100);
        const k = ri(rng, 1, a.length);
        return { input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def swapNodes(head: Optional[ListNode], k: int) -> Optional[ListNode]:
              first = head
              for _ in range(k - 1):
                  first = first.next
              fast, second = first, head
              while fast.next:
                  fast = fast.next
                  second = second.next
              first.val, second.val = second.val, first.val
              return head
        `,
        javascript: code`
          var swapNodes = function(head, k) {
              var first = head;
              for (var i = 1; i < k; i++) first = first.next;
              var fast = first, second = head;
              while (fast.next !== null) { fast = fast.next; second = second.next; }
              var t = first.val;
              first.val = second.val;
              second.val = t;
              return head;
          };
        `,
        typescript: code`
          function swapNodes(head: ListNode | null, k: number): ListNode | null {
              var first = head;
              for (var i = 1; i < k; i++) first = first.next;
              var fast = first, second = head;
              while (fast.next !== null) { fast = fast.next; second = second.next; }
              var t = first.val;
              first.val = second.val;
              second.val = t;
              return head;
          }
        `,
        java: code`
          public static ListNode swapNodes(ListNode head, int k) {
              ListNode first = head;
              for (int i = 1; i < k; i++) first = first.next;
              ListNode fast = first, second = head;
              while (fast.next != null) { fast = fast.next; second = second.next; }
              int t = first.val;
              first.val = second.val;
              second.val = t;
              return head;
          }
        `,
        cpp: code`
          ListNode* swapNodes(ListNode* head, int k) {
              ListNode* first = head;
              for (int i = 1; i < k; i++) first = first->next;
              ListNode *fast = first, *second = head;
              while (fast->next) { fast = fast->next; second = second->next; }
              swap(first->val, second->val);
              return head;
          }
        `,
        c: code`
          struct ListNode* swapNodes(struct ListNode* head, int k) {
              struct ListNode* first = head;
              for (int i = 1; i < k; i++) first = first->next;
              struct ListNode *fast = first, *second = head;
              while (fast->next != NULL) { fast = fast->next; second = second->next; }
              int t = first->val;
              first->val = second->val;
              second->val = t;
              return head;
          }
        `,
        csharp: code`
          public static ListNode SwapNodes(ListNode head, int k)
          {
              var first = head;
              for (int i = 1; i < k; i++) first = first.next;
              ListNode fast = first, second = head;
              while (fast.next != null) { fast = fast.next; second = second.next; }
              int t = first.val;
              first.val = second.val;
              second.val = t;
              return head;
          }
        `,
        go: code`
          func swapNodes(head *ListNode, k int) *ListNode {
              first := head
              for i := 1; i < k; i++ {
                  first = first.Next
              }
              fast, second := first, head
              for fast.Next != nil {
                  fast, second = fast.Next, second.Next
              }
              first.Val, second.Val = second.Val, first.Val
              return head
          }
        `,
        kotlin: kt`
          fun swapNodes(head: ListNode?, k: Int): ListNode? {
              var first: ListNode = head!!
              repeat(k - 1) { first = first.next!! }
              var fast: ListNode = first
              var second: ListNode = head
              while (fast.next != null) { fast = fast.next!!; second = second.next!! }
              val t = first.\`val\`
              first.\`val\` = second.\`val\`
              second.\`val\` = t
              return head
          }
        `,
        swift: code`
          func swapNodes(_ head: ListNode?, _ k: Int) -> ListNode? {
              var first = head!
              for _ in 1..<k { first = first.next! }
              var fast = first, second = head!
              while let nx = fast.next { fast = nx; second = second.next! }
              let t = first.val
              first.val = second.val
              second.val = t
              return head
          }
        `,
        rust: code`
          fn swapNodes(head: Option<Box<ListNode>>, k: i32) -> Option<Box<ListNode>> {
              let mut head = head;
              let mut vals: Vec<i32> = Vec::new();
              let mut p = &head;
              while let Some(node) = p { vals.push(node.val); p = &node.next; }
              let n = vals.len();
              let k = k as usize;
              vals.swap(k - 1, n - k);
              let mut i = 0;
              let mut cur = head.as_mut();
              while let Some(node) = cur {
                  node.val = vals[i];
                  i += 1;
                  cur = node.next.as_mut();
              }
              head
          }
        `,
        php: code`
          function swapNodes($head, $k) {
              $first = $head;
              for ($i = 1; $i < $k; $i++) $first = $first->next;
              $fast = $first;
              $second = $head;
              while ($fast->next !== null) { $fast = $fast->next; $second = $second->next; }
              $t = $first->val;
              $first->val = $second->val;
              $second->val = $t;
              return $head;
          }
        `,
        ruby: code`
          def swapNodes(head, k)
            first = head
            (k - 1).times { first = first.next }
            fast = first
            second = head
            while fast.next
              fast = fast.next
              second = second.next
            end
            first.val, second.val = second.val, first.val
            head
          end
        `,
      },
    };
  })(),

  // ── Find the Minimum and Maximum Number of Nodes Between Critical Points (LC 2058) ──
  (() => {
    const ref = (a: number[]) => {
      const crit: number[] = [];
      for (let i = 1; i + 1 < a.length; i++) {
        if ((a[i] > a[i - 1] && a[i] > a[i + 1]) || (a[i] < a[i - 1] && a[i] < a[i + 1])) crit.push(i);
      }
      if (crit.length < 2) return [-1, -1];
      let best = Infinity;
      for (let i = 0; i < crit.length; i++) for (let j = i + 1; j < crit.length; j++) best = Math.min(best, crit[j] - crit[i]);
      return [best, crit[crit.length - 1] - crit[0]];
    };
    return {
      slug: "find-the-minimum-and-maximum-number-of-nodes-between-critical-points",
      title: "Find the Minimum and Maximum Number of Nodes Between Critical Points",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Simulation", "Amazon"],
      signature: { funcName: "nodesBetweenCriticalPoints", params: [{ name: "head", type: "ListNode" as const }], returns: "int[]" as const },
      description: describe(
        "A **critical point** of a linked list is a node that is either a **local maximum** (its value is strictly greater than both its previous and next nodes' values) or a **local minimum** (strictly smaller than both). A node is only critical if it has both a previous and a next node.\n\nGiven the `head` of a linked list, return `[minDistance, maxDistance]`, where `minDistance` is the smallest and `maxDistance` the largest distance (difference of positions) between any two **distinct** critical points. If there are fewer than two critical points, return `[-1, -1]`.",
        [
          { in: "head = [3,1]", out: "[-1,-1]", note: "There are no critical points." },
          { in: "head = [5,3,1,2,5,1,2]", out: "[1,3]", note: "Critical points are at positions 2 (value 1, a minimum), 4 (value 5, a maximum) and 5 (value 1, a minimum), counting from 0. The closest pair is 4 and 5; the farthest is 2 and 5." },
          { in: "head = [1,3,2,2,3,2,2,2,7]", out: "[3,3]", note: "Only positions 1 and 4 are critical; equal neighbours never make a point critical." },
        ],
        ["The number of nodes in the list is in the range [2, 10^5]", "1 <= Node.val <= 10^5"]),
      hints: [
        "Walk the list with a window of three consecutive values to decide whether the middle node is critical.",
        "The maximum distance is always between the first and the last critical point.",
        "The minimum distance is always between two **consecutive** critical points, so remember the previous critical position and update the minimum gap as you go.",
      ],
      editorial: explain({
        idea: "One pass with three consecutive values identifies every critical point in order. The farthest pair is the first and last of them, and the closest pair must be two neighbours in that order, so only the first, the previous and the current critical positions need to be kept.",
        steps: [
          "Set `first = last = -1`, `minGap = ∞`, and walk with `prev` (value before), `cur` (current node) and its index `i`, starting at the second node.",
          "If `cur.next` exists and `cur.val` is strictly above or strictly below both `prev` and `cur.next.val`, it is critical: if `last != -1`, set `minGap = min(minGap, i - last)`; if `first == -1`, set `first = i`; set `last = i`.",
          "Advance `prev`, `cur` and `i`.",
          "If `first == last` (zero or one critical point), return `[-1, -1]`; otherwise return `[minGap, last - first]`.",
        ],
        why: "Critical points are discovered in increasing position. For any two non-adjacent critical points in that order there is one between them, which is closer to each — so the minimum is attained by consecutive ones. The maximum difference of an increasing sequence is last minus first.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The first and last nodes can never be critical.",
          "Use strict comparisons: a node equal to a neighbour is not a local extremum.",
          "Comparing every pair of critical points is O(k²) — unnecessary given the consecutive-pair argument.",
        ],
      }),
      examples: [
        { input: "[3,1]", expectedOutput: "[-1,-1]" },
        { input: "[5,3,1,2,5,1,2]", expectedOutput: "[1,3]" },
        { input: "[1,3,2,2,3,2,2,2,7]", expectedOutput: "[3,3]" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [1, 2, 3, 10, 100000]);
        const a = randVals(rng, listLen(rng, 2), 1, hi);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def nodesBetweenCriticalPoints(head: Optional[ListNode]) -> List[int]:
              first = last = -1
              min_gap = float("inf")
              prev, cur, i = head.val, head.next, 1
              while cur.next:
                  nxt = cur.next.val
                  if (cur.val > prev and cur.val > nxt) or (cur.val < prev and cur.val < nxt):
                      if last != -1:
                          min_gap = min(min_gap, i - last)
                      if first == -1:
                          first = i
                      last = i
                  prev, cur, i = cur.val, cur.next, i + 1
              if first == last:
                  return [-1, -1]
              return [min_gap, last - first]
        `,
        javascript: code`
          var nodesBetweenCriticalPoints = function(head) {
              var first = -1, last = -1, minGap = Infinity;
              var prev = head.val, cur = head.next, i = 1;
              while (cur.next !== null) {
                  var nxt = cur.next.val;
                  if ((cur.val > prev && cur.val > nxt) || (cur.val < prev && cur.val < nxt)) {
                      if (last !== -1) minGap = Math.min(minGap, i - last);
                      if (first === -1) first = i;
                      last = i;
                  }
                  prev = cur.val;
                  cur = cur.next;
                  i++;
              }
              return first === last ? [-1, -1] : [minGap, last - first];
          };
        `,
        typescript: code`
          function nodesBetweenCriticalPoints(head: ListNode | null): number[] {
              var first = -1, last = -1, minGap = Infinity;
              var prev = head.val, cur = head.next, i = 1;
              while (cur.next !== null) {
                  var nxt = cur.next.val;
                  if ((cur.val > prev && cur.val > nxt) || (cur.val < prev && cur.val < nxt)) {
                      if (last !== -1) minGap = Math.min(minGap, i - last);
                      if (first === -1) first = i;
                      last = i;
                  }
                  prev = cur.val;
                  cur = cur.next;
                  i++;
              }
              return first === last ? [-1, -1] : [minGap, last - first];
          }
        `,
        java: code`
          public static int[] nodesBetweenCriticalPoints(ListNode head) {
              int first = -1, last = -1, minGap = Integer.MAX_VALUE;
              int prev = head.val, i = 1;
              ListNode cur = head.next;
              while (cur.next != null) {
                  int nxt = cur.next.val;
                  if ((cur.val > prev && cur.val > nxt) || (cur.val < prev && cur.val < nxt)) {
                      if (last != -1) minGap = Math.min(minGap, i - last);
                      if (first == -1) first = i;
                      last = i;
                  }
                  prev = cur.val;
                  cur = cur.next;
                  i++;
              }
              return first == last ? new int[] { -1, -1 } : new int[] { minGap, last - first };
          }
        `,
        cpp: code`
          vector<int> nodesBetweenCriticalPoints(ListNode* head) {
              int first = -1, last = -1, minGap = INT_MAX;
              int prev = head->val, i = 1;
              ListNode* cur = head->next;
              while (cur->next) {
                  int nxt = cur->next->val;
                  if ((cur->val > prev && cur->val > nxt) || (cur->val < prev && cur->val < nxt)) {
                      if (last != -1) minGap = min(minGap, i - last);
                      if (first == -1) first = i;
                      last = i;
                  }
                  prev = cur->val;
                  cur = cur->next;
                  i++;
              }
              if (first == last) return { -1, -1 };
              return { minGap, last - first };
          }
        `,
        c: code`
          int* nodesBetweenCriticalPoints(struct ListNode* head, int* returnSize) {
              int first = -1, last = -1, minGap = 2147483647;
              int prev = head->val, i = 1;
              struct ListNode* cur = head->next;
              while (cur->next != NULL) {
                  int nxt = cur->next->val;
                  if ((cur->val > prev && cur->val > nxt) || (cur->val < prev && cur->val < nxt)) {
                      if (last != -1 && i - last < minGap) minGap = i - last;
                      if (first == -1) first = i;
                      last = i;
                  }
                  prev = cur->val;
                  cur = cur->next;
                  i++;
              }
              int* res = (int*) malloc(sizeof(int) * 2);
              if (first == last) { res[0] = -1; res[1] = -1; }
              else { res[0] = minGap; res[1] = last - first; }
              *returnSize = 2;
              return res;
          }
        `,
        csharp: code`
          public static int[] NodesBetweenCriticalPoints(ListNode head)
          {
              int first = -1, last = -1, minGap = int.MaxValue;
              int prev = head.val, i = 1;
              var cur = head.next;
              while (cur.next != null)
              {
                  int nxt = cur.next.val;
                  if ((cur.val > prev && cur.val > nxt) || (cur.val < prev && cur.val < nxt))
                  {
                      if (last != -1) minGap = Math.Min(minGap, i - last);
                      if (first == -1) first = i;
                      last = i;
                  }
                  prev = cur.val;
                  cur = cur.next;
                  i++;
              }
              return first == last ? new[] { -1, -1 } : new[] { minGap, last - first };
          }
        `,
        go: code`
          func nodesBetweenCriticalPoints(head *ListNode) []int {
              first, last, minGap := -1, -1, 1<<31-1
              prev, cur, i := head.Val, head.Next, 1
              for cur.Next != nil {
                  nxt := cur.Next.Val
                  if (cur.Val > prev && cur.Val > nxt) || (cur.Val < prev && cur.Val < nxt) {
                      if last != -1 && i-last < minGap {
                          minGap = i - last
                      }
                      if first == -1 {
                          first = i
                      }
                      last = i
                  }
                  prev, cur, i = cur.Val, cur.Next, i+1
              }
              if first == last {
                  return []int{-1, -1}
              }
              return []int{minGap, last - first}
          }
        `,
        kotlin: kt`
          fun nodesBetweenCriticalPoints(head: ListNode?): IntArray {
              var first = -1
              var last = -1
              var minGap = Int.MAX_VALUE
              var prev = head!!.\`val\`
              var cur: ListNode = head.next!!
              var i = 1
              while (cur.next != null) {
                  val nxt = cur.next!!.\`val\`
                  val v = cur.\`val\`
                  if ((v > prev && v > nxt) || (v < prev && v < nxt)) {
                      if (last != -1) minGap = minOf(minGap, i - last)
                      if (first == -1) first = i
                      last = i
                  }
                  prev = v
                  cur = cur.next!!
                  i++
              }
              return if (first == last) intArrayOf(-1, -1) else intArrayOf(minGap, last - first)
          }
        `,
        swift: code`
          func nodesBetweenCriticalPoints(_ head: ListNode?) -> [Int] {
              var first = -1, last = -1, minGap = Int.max
              var prev = head!.val
              var cur = head!.next!
              var i = 1
              while let nx = cur.next {
                  let v = cur.val
                  if (v > prev && v > nx.val) || (v < prev && v < nx.val) {
                      if last != -1 { minGap = min(minGap, i - last) }
                      if first == -1 { first = i }
                      last = i
                  }
                  prev = v
                  cur = nx
                  i += 1
              }
              return first == last ? [-1, -1] : [minGap, last - first]
          }
        `,
        rust: code`
          fn nodesBetweenCriticalPoints(head: Option<Box<ListNode>>) -> Vec<i32> {
              let (mut first, mut last, mut min_gap) = (-1i32, -1i32, std::i32::MAX);
              let head = head.unwrap();
              let mut prev = head.val;
              let mut cur = head.next.as_ref().unwrap();
              let mut i = 1;
              while let Some(nx) = cur.next.as_ref() {
                  let v = cur.val;
                  if (v > prev && v > nx.val) || (v < prev && v < nx.val) {
                      if last != -1 { min_gap = min_gap.min(i - last); }
                      if first == -1 { first = i; }
                      last = i;
                  }
                  prev = v;
                  cur = nx;
                  i += 1;
              }
              if first == last { vec![-1, -1] } else { vec![min_gap, last - first] }
          }
        `,
        php: code`
          function nodesBetweenCriticalPoints($head) {
              $first = -1;
              $last = -1;
              $minGap = PHP_INT_MAX;
              $prev = $head->val;
              $cur = $head->next;
              $i = 1;
              while ($cur->next !== null) {
                  $nxt = $cur->next->val;
                  if (($cur->val > $prev && $cur->val > $nxt) || ($cur->val < $prev && $cur->val < $nxt)) {
                      if ($last !== -1) $minGap = min($minGap, $i - $last);
                      if ($first === -1) $first = $i;
                      $last = $i;
                  }
                  $prev = $cur->val;
                  $cur = $cur->next;
                  $i++;
              }
              return $first === $last ? [-1, -1] : [$minGap, $last - $first];
          }
        `,
        ruby: code`
          def nodesBetweenCriticalPoints(head)
            first = last = -1
            min_gap = nil
            prev = head.val
            cur = head.next
            i = 1
            while cur.next
              nxt = cur.next.val
              if (cur.val > prev && cur.val > nxt) || (cur.val < prev && cur.val < nxt)
                min_gap = [min_gap || (i - last), i - last].min if last != -1
                first = i if first == -1
                last = i
              end
              prev = cur.val
              cur = cur.next
              i += 1
            end
            first == last ? [-1, -1] : [min_gap, last - first]
          end
        `,
      },
    };
  })(),

];

/**
 * Linked lists & design classes — wave 7, batch 35.
 * Real problems only: LeetCode numbered problems and GeeksforGeeks classics.
 * Worked examples are phrased for CodeKairo.
 *
 * These are the catalogue's first linked-list and design problems, judged by
 * the structured drivers (src/lib/driver-structures.ts): a `ListNode` travels
 * as its values head to tail (`[1,2,3]`, empty `[]`), a `ListNode[]` as one
 * array per list, and a design case is two lines — the operations, then each
 * one's arguments — answered by one array with `null` for the constructor and
 * every void method. The node types are the judge's; no solution redefines
 * them.
 *
 * Where LeetCode accepts more than one answer the statement fixes one: the
 * union of two lists is sorted ascending, and every in-place problem returns
 * the head after the change.
 *
 * Per-language notes. Rust's `Option<Box<ListNode>>` makes pointer surgery a
 * fight with the borrow checker for no gain, so the Rust solutions read the
 * values into a Vec, apply the same rule, and rebuild — still O(n). Kotlin
 * reads a node's value as n.`val`, and a code`` block cannot hold a backtick,
 * so the Kotlin solutions write `n.KVAL` and `kt()` swaps the backticked name
 * in. Every value and every answer fits a signed 32-bit int; JavaScript is
 * Node 12 (no ??, ?., at(), flat) and the C harness has no math.h/limits.h.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, listArr, listFrom, pick, ri, shuffle, designInput,
  type CatalogProblem, type Rng, type LNode,
} from "./types.js";

/** Kotlin's ListNode names its value `val`, a keyword, reached as n.`val`; see the header. */
const kt = (s: string) => s.replace(/\bKVAL\b/g, "`val`");

/** A random list of `lo..hi` values whose length is drawn from 1..one of `sizes`. */
const randVals = (rng: Rng, sizes: number[], lo: number, hi: number, minLen = 1) =>
  Array.from({ length: ri(rng, minLen, Math.max(minLen, pick(rng, sizes))) }, () => ri(rng, lo, hi));

export const DESIGN1_PROBLEMS: CatalogProblem[] = [

  // ── Reverse Nodes in Even Length Groups (LC 2074) ─────────────────
  (() => {
    const ref = (a: number[]) => {
      const out = a.slice();
      for (let i = 0, g = 1; i < out.length; g++) {
        const len = Math.min(g, out.length - i);
        if (len % 2 === 0) {
          const part = out.slice(i, i + len).reverse();
          for (let j = 0; j < len; j++) out[i + j] = part[j];
        }
        i += len;
      }
      return out;
    };
    const ex = [[8, 1, 4, 2, 7, 5, 9, 3, 6, 0], [3, 7, 1, 4], [2, 6, 9, 1, 5]];
    return {
      slug: "reverse-nodes-in-even-length-groups",
      title: "Reverse Nodes in Even Length Groups",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Simulation", "Amazon", "Google"],
      signature: { funcName: "reverseEvenLengthGroups", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list. Cut the list, from the front, into consecutive groups whose intended sizes are `1, 2, 3, 4, …` — the first node alone, the next two nodes, the next three, and so on. The **last** group takes whatever nodes remain, so its actual length may be smaller than its intended size.\n\nReverse the nodes of every group whose **actual** length is even, leave the odd-length groups as they are, and return the head of the resulting list.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "The groups are [8], [1,4], [2,7,5] and [9,3,6,0]. Only the groups of length 2 and 4 are even, so they are reversed." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "The groups are [3], [7,1] and [4]. The last group was meant to hold three nodes but only one is left — its length is 1, odd, so it stays." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "The groups are [2], [6,9] and [1,5]. The last group has only two nodes, an even length, so it is reversed too." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "0 <= Node.val <= 10^5"]),
      hints: [
        "The decision for each group depends on its *actual* length, which only differs from the intended size for the last group — count before you reverse.",
        "Keep a pointer to the node just before the current group. Walk at most `size` nodes ahead to learn the group's real length and the node that follows it.",
        "Reversing a run of `k` nodes in place: start the reversed run pointing at the node after the group, then relink each node in turn; afterwards the old first node of the group is the new tail and the next group's predecessor.",
      ],
      editorial: explain({
        idea: "Walk the list group by group, remembering the node before the group. For each group first count how many nodes it really has (at most its intended size), and reverse exactly those nodes in place when the count is even.",
        steps: [
          "The first group is the head alone — length 1, never reversed — so start with `prev = head` and the intended size `2`.",
          "While `prev.next` exists, walk from `prev.next` up to `size` nodes, counting them in `cnt`; `node` ends at the first node after the group.",
          "If `cnt` is even, reverse the `cnt` nodes: set `rev = node`, then for each node of the group point it at `rev` and make it the new `rev`. Link `prev.next = rev`, and move `prev` to the group's old first node, which is now its last.",
          "If `cnt` is odd, just advance `prev` by `cnt` nodes.",
          "Increase `size` by one and continue; return `head`, which never changes.",
        ],
        why: "Every group is handled exactly once and only its own links change. Starting the reversed run at the node after the group keeps the rest of the list attached, and the old first node of the group becomes the predecessor of the next group, so the walk continues from the right place.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Deciding by the intended size: a last group meant to hold 5 nodes that only has 4 must be reversed.",
          "Forgetting to reconnect the reversed group's tail to the following node — the counting walk already found it.",
          "The head never moves, because the first group has length 1.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const a = randVals(rng, [1, 3, 6, 10, 20, 40], 0, pick(rng, [9, 1000, 100000]));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reverseEvenLengthGroups(head: Optional[ListNode]) -> Optional[ListNode]:
              prev = head  # the first group is the head alone: length 1, never reversed
              size = 2
              while prev.next:
                  node, cnt = prev.next, 0
                  while node and cnt < size:
                      node = node.next
                      cnt += 1
                  if cnt % 2 == 0:
                      first = cur = prev.next
                      rev = node
                      for _ in range(cnt):
                          nxt = cur.next
                          cur.next = rev
                          rev = cur
                          cur = nxt
                      prev.next = rev
                      prev = first
                  else:
                      for _ in range(cnt):
                          prev = prev.next
                  size += 1
              return head
        `,
        javascript: code`
          var reverseEvenLengthGroups = function(head) {
              var prev = head, size = 2; // the first group is the head alone
              while (prev.next !== null) {
                  var node = prev.next, cnt = 0;
                  while (node !== null && cnt < size) { node = node.next; cnt++; }
                  if (cnt % 2 === 0) {
                      var first = prev.next, cur = prev.next, rev = node;
                      for (var i = 0; i < cnt; i++) { var nxt = cur.next; cur.next = rev; rev = cur; cur = nxt; }
                      prev.next = rev;
                      prev = first;
                  } else {
                      for (var j = 0; j < cnt; j++) prev = prev.next;
                  }
                  size++;
              }
              return head;
          };
        `,
        typescript: code`
          function reverseEvenLengthGroups(head: ListNode | null): ListNode | null {
              var prev: ListNode = head, size = 2; // the first group is the head alone
              while (prev.next !== null) {
                  var node: ListNode | null = prev.next, cnt = 0;
                  while (node !== null && cnt < size) { node = node.next; cnt++; }
                  if (cnt % 2 === 0) {
                      var first: ListNode = prev.next, cur: ListNode = prev.next, rev: ListNode | null = node;
                      for (var i = 0; i < cnt; i++) { var nxt: ListNode = cur.next; cur.next = rev; rev = cur; cur = nxt; }
                      prev.next = rev;
                      prev = first;
                  } else {
                      for (var j = 0; j < cnt; j++) prev = prev.next;
                  }
                  size++;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode reverseEvenLengthGroups(ListNode head) {
              ListNode prev = head; // the first group is the head alone
              int size = 2;
              while (prev.next != null) {
                  ListNode node = prev.next;
                  int cnt = 0;
                  while (node != null && cnt < size) { node = node.next; cnt++; }
                  if (cnt % 2 == 0) {
                      ListNode first = prev.next, cur = prev.next, rev = node;
                      for (int i = 0; i < cnt; i++) { ListNode nxt = cur.next; cur.next = rev; rev = cur; cur = nxt; }
                      prev.next = rev;
                      prev = first;
                  } else {
                      for (int i = 0; i < cnt; i++) prev = prev.next;
                  }
                  size++;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* reverseEvenLengthGroups(ListNode* head) {
              ListNode* prev = head; // the first group is the head alone
              int size = 2;
              while (prev->next) {
                  ListNode* node = prev->next;
                  int cnt = 0;
                  while (node && cnt < size) { node = node->next; cnt++; }
                  if (cnt % 2 == 0) {
                      ListNode *first = prev->next, *cur = prev->next, *rev = node;
                      for (int i = 0; i < cnt; i++) { ListNode* nxt = cur->next; cur->next = rev; rev = cur; cur = nxt; }
                      prev->next = rev;
                      prev = first;
                  } else {
                      for (int i = 0; i < cnt; i++) prev = prev->next;
                  }
                  size++;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* reverseEvenLengthGroups(struct ListNode* head) {
              struct ListNode* prev = head; /* the first group is the head alone */
              int size = 2;
              while (prev->next) {
                  struct ListNode* node = prev->next;
                  int cnt = 0;
                  while (node && cnt < size) { node = node->next; cnt++; }
                  if (cnt % 2 == 0) {
                      struct ListNode *first = prev->next, *cur = prev->next, *rev = node;
                      for (int i = 0; i < cnt; i++) { struct ListNode* nxt = cur->next; cur->next = rev; rev = cur; cur = nxt; }
                      prev->next = rev;
                      prev = first;
                  } else {
                      for (int i = 0; i < cnt; i++) prev = prev->next;
                  }
                  size++;
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode ReverseEvenLengthGroups(ListNode head)
          {
              ListNode prev = head; // the first group is the head alone
              int size = 2;
              while (prev.next != null)
              {
                  ListNode node = prev.next;
                  int cnt = 0;
                  while (node != null && cnt < size) { node = node.next; cnt++; }
                  if (cnt % 2 == 0)
                  {
                      ListNode first = prev.next, cur = prev.next, rev = node;
                      for (int i = 0; i < cnt; i++) { ListNode nxt = cur.next; cur.next = rev; rev = cur; cur = nxt; }
                      prev.next = rev;
                      prev = first;
                  }
                  else
                  {
                      for (int i = 0; i < cnt; i++) prev = prev.next;
                  }
                  size++;
              }
              return head;
          }
        `,
        go: code`
          func reverseEvenLengthGroups(head *ListNode) *ListNode {
          	prev := head // the first group is the head alone
          	size := 2
          	for prev.Next != nil {
          		node, cnt := prev.Next, 0
          		for node != nil && cnt < size {
          			node = node.Next
          			cnt++
          		}
          		if cnt%2 == 0 {
          			first, cur, rev := prev.Next, prev.Next, node
          			for i := 0; i < cnt; i++ {
          				nxt := cur.Next
          				cur.Next = rev
          				rev = cur
          				cur = nxt
          			}
          			prev.Next = rev
          			prev = first
          		} else {
          			for i := 0; i < cnt; i++ {
          				prev = prev.Next
          			}
          		}
          		size++
          	}
          	return head
          }
        `,
        kotlin: kt(code`
          fun reverseEvenLengthGroups(head: ListNode?): ListNode? {
              var prev = head!! // the first group is the head alone
              var size = 2
              while (prev.next != null) {
                  var node = prev.next
                  var cnt = 0
                  while (node != null && cnt < size) { node = node.next; cnt++ }
                  if (cnt % 2 == 0) {
                      val first = prev.next!!
                      var cur: ListNode? = first
                      var rev = node
                      for (i in 0 until cnt) { val c = cur!!; val nxt = c.next; c.next = rev; rev = c; cur = nxt }
                      prev.next = rev
                      prev = first
                  } else {
                      for (i in 0 until cnt) prev = prev.next!!
                  }
                  size++
              }
              return head
          }
        `),
        swift: code`
          func reverseEvenLengthGroups(_ head: ListNode?) -> ListNode? {
              var prev = head! // the first group is the head alone
              var size = 2
              while prev.next != nil {
                  var node = prev.next
                  var cnt = 0
                  while node != nil && cnt < size { node = node!.next; cnt += 1 }
                  if cnt % 2 == 0 {
                      let first = prev.next!
                      var cur: ListNode? = first
                      var rev = node
                      for _ in 0..<cnt { let c = cur!; let nxt = c.next; c.next = rev; rev = c; cur = nxt }
                      prev.next = rev
                      prev = first
                  } else {
                      for _ in 0..<cnt { prev = prev.next! }
                  }
                  size += 1
              }
              return head
          }
        `,
        rust: code`
          fn reverseEvenLengthGroups(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let (mut i, mut size) = (0usize, 1usize);
              while i < v.len() {
                  let len = size.min(v.len() - i);
                  if len % 2 == 0 { v[i..i + len].reverse(); }
                  i += len;
                  size += 1;
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function reverseEvenLengthGroups($head) {
              $prev = $head; // the first group is the head alone
              $size = 2;
              while ($prev->next !== null) {
                  $node = $prev->next;
                  $cnt = 0;
                  while ($node !== null && $cnt < $size) { $node = $node->next; $cnt++; }
                  if ($cnt % 2 == 0) {
                      $first = $prev->next; $cur = $prev->next; $rev = $node;
                      for ($i = 0; $i < $cnt; $i++) { $nxt = $cur->next; $cur->next = $rev; $rev = $cur; $cur = $nxt; }
                      $prev->next = $rev;
                      $prev = $first;
                  } else {
                      for ($i = 0; $i < $cnt; $i++) $prev = $prev->next;
                  }
                  $size++;
              }
              return $head;
          }
        `,
        ruby: code`
          def reverseEvenLengthGroups(head)
            prev = head # the first group is the head alone
            size = 2
            until prev.next.nil?
              node = prev.next
              cnt = 0
              while !node.nil? && cnt < size
                node = node.next
                cnt += 1
              end
              if cnt.even?
                first = cur = prev.next
                rev = node
                cnt.times do
                  nxt = cur.next
                  cur.next = rev
                  rev = cur
                  cur = nxt
                end
                prev.next = rev
                prev = first
              else
                cnt.times { prev = prev.next }
              end
              size += 1
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Delete the Middle Node of a Linked List (LC 2095) ─────────────
  (() => {
    const ref = (a: number[]) => a.filter((_, i) => i !== Math.floor(a.length / 2));
    const ex = [[4, 8, 15, 16, 23, 42], [7, 2], [9]];
    return {
      slug: "delete-the-middle-node-of-a-linked-list",
      title: "Delete the Middle Node of a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "deleteMiddle", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list with `n` nodes. Remove its **middle node** and return the head of the modified list.\n\nCounting positions from `0`, the middle node of a list of `n` nodes is the one at index `⌊n / 2⌋`: for `n = 1, 2, 3, 4, 5` that is index `0, 1, 1, 2, 2`. A one-node list therefore becomes empty.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "n = 6, so the middle is index 3 — the node holding 16." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "n = 2, so index 1 (the node holding 2) is removed." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "The only node is the middle one; nothing is left." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "1 <= Node.val <= 10^5"]),
      hints: [
        "To unlink a node you need the node *before* it, so aim to stop one step short of the middle.",
        "A slow pointer that moves one step while a fast pointer moves two reaches the middle when the fast one runs out — no need to count first.",
        "Give the fast pointer a two-node head start (`fast = head.next.next`) and the slow pointer stops exactly at the node before index `⌊n / 2⌋`. Handle `n = 1` separately.",
      ],
      editorial: explain({
        idea: "Use the slow/fast pointer race, but start the fast pointer two nodes ahead so the slow pointer finishes on the node *before* the middle, which is the one whose link must change.",
        steps: [
          "If the list has one node, return an empty list.",
          "Set `slow = head` and `fast = head.next.next`.",
          "While `fast` and `fast.next` both exist, move `slow` one step and `fast` two steps.",
          "Unlink the middle: `slow.next = slow.next.next`. Return `head`.",
        ],
        why: "After `k` loop iterations `slow` is at index `k` and `fast` at index `2k + 2`. The loop stops at the first `k` with `2k + 2 >= n - 1`, which makes `k = ⌊n / 2⌋ - 1` — the predecessor of the middle — for both even and odd `n`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "With an even length the middle is the *second* of the two central nodes (index `n / 2`).",
          "Starting both pointers at the head leaves `slow` on the middle itself, which cannot be unlinked in a singly linked list without its predecessor.",
          "A one-node list has no predecessor at all — return the empty list.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const a = randVals(rng, [1, 2, 3, 5, 12, 40], 1, pick(rng, [9, 1000, 100000]));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def deleteMiddle(head: Optional[ListNode]) -> Optional[ListNode]:
              if head.next is None:
                  return None
              slow, fast = head, head.next.next
              while fast and fast.next:
                  slow = slow.next
                  fast = fast.next.next
              slow.next = slow.next.next
              return head
        `,
        javascript: code`
          var deleteMiddle = function(head) {
              if (head.next === null) return null;
              var slow = head, fast = head.next.next;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              slow.next = slow.next.next;
              return head;
          };
        `,
        typescript: code`
          function deleteMiddle(head: ListNode | null): ListNode | null {
              if (head.next === null) return null;
              var slow: ListNode = head, fast: ListNode | null = head.next.next;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              slow.next = slow.next.next;
              return head;
          }
        `,
        java: code`
          public static ListNode deleteMiddle(ListNode head) {
              if (head.next == null) return null;
              ListNode slow = head, fast = head.next.next;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              slow.next = slow.next.next;
              return head;
          }
        `,
        cpp: code`
          ListNode* deleteMiddle(ListNode* head) {
              if (!head->next) return nullptr;
              ListNode *slow = head, *fast = head->next->next;
              while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
              slow->next = slow->next->next;
              return head;
          }
        `,
        c: code`
          struct ListNode* deleteMiddle(struct ListNode* head) {
              if (!head->next) return NULL;
              struct ListNode *slow = head, *fast = head->next->next;
              while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
              slow->next = slow->next->next;
              return head;
          }
        `,
        csharp: code`
          public static ListNode DeleteMiddle(ListNode head)
          {
              if (head.next == null) return null;
              ListNode slow = head, fast = head.next.next;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              slow.next = slow.next.next;
              return head;
          }
        `,
        go: code`
          func deleteMiddle(head *ListNode) *ListNode {
          	if head.Next == nil {
          		return nil
          	}
          	slow, fast := head, head.Next.Next
          	for fast != nil && fast.Next != nil {
          		slow = slow.Next
          		fast = fast.Next.Next
          	}
          	slow.Next = slow.Next.Next
          	return head
          }
        `,
        kotlin: kt(code`
          fun deleteMiddle(head: ListNode?): ListNode? {
              if (head!!.next == null) return null
              var slow: ListNode = head
              var fast: ListNode? = head.next!!.next
              while (fast != null && fast.next != null) { slow = slow.next!!; fast = fast.next!!.next }
              slow.next = slow.next!!.next
              return head
          }
        `),
        swift: code`
          func deleteMiddle(_ head: ListNode?) -> ListNode? {
              guard let h = head, h.next != nil else { return nil }
              var slow = h
              var fast = h.next!.next
              while let f = fast, f.next != nil { slow = slow.next!; fast = f.next!.next }
              slow.next = slow.next!.next
              return h
          }
        `,
        rust: code`
          fn deleteMiddle(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let mid = v.len() / 2;
              v.remove(mid);
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function deleteMiddle($head) {
              if ($head->next === null) return null;
              $slow = $head; $fast = $head->next->next;
              while ($fast !== null && $fast->next !== null) { $slow = $slow->next; $fast = $fast->next->next; }
              $slow->next = $slow->next->next;
              return $head;
          }
        `,
        ruby: code`
          def deleteMiddle(head)
            return nil if head.next.nil?
            slow = head
            fast = head.next.next
            while !fast.nil? && !fast.next.nil?
              slow = slow.next
              fast = fast.next.next
            end
            slow.next = slow.next.next
            head
          end
        `,
      },
    };
  })(),

  // ── Maximum Twin Sum of a Linked List (LC 2130) ───────────────────
  (() => {
    const ref = (a: number[]) => {
      let best = 0;
      for (let i = 0; i < a.length / 2; i++) best = Math.max(best, a[i] + a[a.length - 1 - i]);
      return best;
    };
    const ex = [[3, 8, 1, 6], [4, 2, 2, 3], [1, 100000]];
    return {
      slug: "maximum-twin-sum-of-a-linked-list",
      title: "Maximum Twin Sum of a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Stack", "Amazon", "Microsoft"],
      signature: { funcName: "pairSum", params: [{ name: "head", type: "ListNode" as const }], returns: "int" as const },
      description: describe(
        "A singly linked list has an **even** number of nodes `n`. Counting from `0`, node `i` and node `n - 1 - i` are called **twins** for every `0 <= i <= n / 2 - 1`: the first node pairs with the last, the second with the second-to-last, and so on. A twin sum is the sum of the values of two twins.\n\nGiven the `head` of such a list, return the **largest** twin sum.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: String(ref(ex[0])), note: "The twin pairs are (3, 6) and (8, 1), with sums 9 and 9." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: String(ref(ex[1])), note: "The twin sums are 4 + 3 = 7 and 2 + 2 = 4; the larger is 7." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: String(ref(ex[2])), note: "Two nodes are each other's twin." },
        ],
        ["The number of nodes in the list is an even integer in the range [2, 10^5]", "1 <= Node.val <= 10^5"]),
      hints: [
        "Node `i` pairs with node `n - 1 - i`, so the first half is read forwards while the second half is read backwards.",
        "Find the start of the second half with a slow/fast pointer race.",
        "Reverse the second half in place; then walk the first half and the reversed second half side by side, adding pairs.",
      ],
      editorial: explain({
        idea: "Twins mirror each other around the middle, so if the second half is reversed the twins line up: walking both halves together visits each twin pair once.",
        steps: [
          "Move `slow` one step and `fast` two steps from the head until `fast` runs out; `slow` is then the first node of the second half (index `n / 2`).",
          "Reverse the list starting at `slow`; call its new head `second`.",
          "Walk `first = head` and `second` together until `second` ends, tracking the largest `first.val + second.val`.",
        ],
        why: "After reversal the `k`-th node of the reversed half is original index `n - 1 - k`, while the `k`-th node from the head is index `k` — exactly a twin pair, for every `k < n / 2`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "With an even length, slow lands on index `n / 2` when fast becomes null — the start of the second half, not the end of the first.",
          "Copying the values into an array also works in O(n) time but uses O(n) memory; the in-place reversal is what interviewers look for.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: String(ref(a)) })),
      gen: (rng: Rng) => {
        const half = ri(rng, 1, pick(rng, [1, 2, 5, 10, 20]));
        const top = pick(rng, [9, 1000, 100000]);
        const a = Array.from({ length: 2 * half }, () => ri(rng, 1, top));
        return { input: fmtIntArr(a), expectedOutput: String(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def pairSum(head: Optional[ListNode]) -> int:
              slow = fast = head
              while fast and fast.next:
                  slow = slow.next
                  fast = fast.next.next
              prev = None  # reverse the second half
              while slow:
                  slow.next, prev, slow = prev, slow, slow.next
              best = 0
              while prev:
                  best = max(best, head.val + prev.val)
                  head = head.next
                  prev = prev.next
              return best
        `,
        javascript: code`
          var pairSum = function(head) {
              var slow = head, fast = head;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              var prev = null; // reverse the second half
              while (slow !== null) { var nx = slow.next; slow.next = prev; prev = slow; slow = nx; }
              var best = 0;
              for (var a = head, b = prev; b !== null; a = a.next, b = b.next) best = Math.max(best, a.val + b.val);
              return best;
          };
        `,
        typescript: code`
          function pairSum(head: ListNode | null): number {
              var slow: ListNode | null = head, fast: ListNode | null = head;
              while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }
              var prev: ListNode | null = null; // reverse the second half
              while (slow !== null) { var nx: ListNode | null = slow.next; slow.next = prev; prev = slow; slow = nx; }
              var best = 0;
              for (var a = head, b = prev; b !== null; a = a.next, b = b.next) best = Math.max(best, a.val + b.val);
              return best;
          }
        `,
        java: code`
          public static int pairSum(ListNode head) {
              ListNode slow = head, fast = head;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              ListNode prev = null; // reverse the second half
              while (slow != null) { ListNode nx = slow.next; slow.next = prev; prev = slow; slow = nx; }
              int best = 0;
              for (ListNode a = head, b = prev; b != null; a = a.next, b = b.next) best = Math.max(best, a.val + b.val);
              return best;
          }
        `,
        cpp: code`
          int pairSum(ListNode* head) {
              ListNode *slow = head, *fast = head;
              while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
              ListNode* prev = nullptr; // reverse the second half
              while (slow) { ListNode* nx = slow->next; slow->next = prev; prev = slow; slow = nx; }
              int best = 0;
              for (ListNode *a = head, *b = prev; b; a = a->next, b = b->next) best = max(best, a->val + b->val);
              return best;
          }
        `,
        c: code`
          int pairSum(struct ListNode* head) {
              struct ListNode *slow = head, *fast = head;
              while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
              struct ListNode* prev = NULL; /* reverse the second half */
              while (slow) { struct ListNode* nx = slow->next; slow->next = prev; prev = slow; slow = nx; }
              int best = 0;
              for (struct ListNode *a = head, *b = prev; b; a = a->next, b = b->next)
                  if (a->val + b->val > best) best = a->val + b->val;
              return best;
          }
        `,
        csharp: code`
          public static int PairSum(ListNode head)
          {
              ListNode slow = head, fast = head;
              while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
              ListNode prev = null; // reverse the second half
              while (slow != null) { var nx = slow.next; slow.next = prev; prev = slow; slow = nx; }
              int best = 0;
              for (ListNode a = head, b = prev; b != null; a = a.next, b = b.next) best = Math.Max(best, a.val + b.val);
              return best;
          }
        `,
        go: code`
          func pairSum(head *ListNode) int {
          	slow, fast := head, head
          	for fast != nil && fast.Next != nil {
          		slow = slow.Next
          		fast = fast.Next.Next
          	}
          	var prev *ListNode // reverse the second half
          	for slow != nil {
          		nx := slow.Next
          		slow.Next = prev
          		prev = slow
          		slow = nx
          	}
          	best := 0
          	for a, b := head, prev; b != nil; a, b = a.Next, b.Next {
          		if a.Val+b.Val > best {
          			best = a.Val + b.Val
          		}
          	}
          	return best
          }
        `,
        kotlin: kt(code`
          fun pairSum(head: ListNode?): Int {
              var slow = head
              var fast = head
              while (fast != null && fast.next != null) { slow = slow!!.next; fast = fast.next!!.next }
              var prev: ListNode? = null // reverse the second half
              while (slow != null) { val nx = slow.next; slow.next = prev; prev = slow; slow = nx }
              var best = 0
              var a = head
              var b = prev
              while (b != null) { best = maxOf(best, a!!.KVAL + b.KVAL); a = a.next; b = b.next }
              return best
          }
        `),
        swift: code`
          func pairSum(_ head: ListNode?) -> Int {
              var slow = head
              var fast = head
              while let f = fast, let fn = f.next { slow = slow!.next; fast = fn.next }
              var prev: ListNode? = nil // reverse the second half
              while let s = slow { let nx = s.next; s.next = prev; prev = s; slow = nx }
              var best = 0
              var a = head
              var b = prev
              while let y = b { let x = a!; best = max(best, x.val + y.val); a = x.next; b = y.next }
              return best
          }
        `,
        rust: code`
          fn pairSum(head: Option<Box<ListNode>>) -> i32 {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let n = v.len();
              (0..n / 2).map(|i| v[i] + v[n - 1 - i]).max().unwrap_or(0)
          }
        `,
        php: code`
          function pairSum($head) {
              $slow = $head; $fast = $head;
              while ($fast !== null && $fast->next !== null) { $slow = $slow->next; $fast = $fast->next->next; }
              $prev = null; // reverse the second half
              while ($slow !== null) { $nx = $slow->next; $slow->next = $prev; $prev = $slow; $slow = $nx; }
              $best = 0;
              for ($a = $head, $b = $prev; $b !== null; $a = $a->next, $b = $b->next) $best = max($best, $a->val + $b->val);
              return $best;
          }
        `,
        ruby: code`
          def pairSum(head)
            slow = fast = head
            while !fast.nil? && !fast.next.nil?
              slow = slow.next
              fast = fast.next.next
            end
            prev = nil # reverse the second half
            until slow.nil?
              nx = slow.next
              slow.next = prev
              prev = slow
              slow = nx
            end
            best = 0
            a = head
            until prev.nil?
              best = [best, a.val + prev.val].max
              a = a.next
              prev = prev.next
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Merge Nodes in Between Zeros (LC 2181) ────────────────────────
  (() => {
    const ref = (a: number[]) => {
      const out: number[] = [];
      let s = 0;
      for (let i = 1; i < a.length; i++) {
        if (a[i] === 0) { out.push(s); s = 0; } else s += a[i];
      }
      return out;
    };
    const ex = [[0, 4, 2, 0, 7, 0, 1, 1, 1, 0], [0, 5, 0], [0, 3, 1, 0, 4, 5, 2, 0]];
    return {
      slug: "merge-nodes-in-between-zeros",
      title: "Merge Nodes in Between Zeros",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Simulation", "Amazon", "Google"],
      signature: { funcName: "mergeNodes", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a linked list of integers separated by zeros: the list both **starts and ends** with a node of value `0`, and no two `0` nodes are adjacent.\n\nFor every stretch of nodes lying between two consecutive `0`s, replace the whole stretch by a single node whose value is the sum of the stretch. The resulting list contains no `0` nodes at all. Return its head.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "The stretches are [4,2], [7] and [1,1,1], summing to 6, 7 and 3." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "A single stretch holding one node." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "The stretches [3,1] and [4,5,2] sum to 4 and 11." },
        ],
        ["The number of nodes in the list is in the range [3, 2 * 10^5]", "0 <= Node.val <= 1000", "There are no two consecutive nodes with Node.val == 0", "The first and the last nodes have Node.val == 0"]),
      hints: [
        "Every `0` after the first closes one stretch, so a single pass with a running sum is enough.",
        "You do not need new nodes: the sums can be written into nodes the pass has already read.",
        "There are fewer stretches than nodes read so far, so write each finished sum into the next node of the list from the front, and cut the list after the last one written.",
      ],
      editorial: explain({
        idea: "Scan once with a running sum, and every time a `0` closes a stretch write the sum into a node at the front of the list. The writer always trails the reader, so writing never destroys a value still to be read.",
        steps: [
          "Let `write = head` and `last = null`; start reading at `head.next` with `sum = 0`.",
          "For each node: if its value is `0`, store `sum` in `write`, remember `last = write`, move `write` on and reset `sum`; otherwise add the value to `sum`.",
          "Cut the list after `last` (`last.next = null`) and return `head`.",
        ],
        why: "When the `k`-th stretch closes, the reader has passed at least `2k` nodes (each stretch holds at least one non-zero node plus its closing zero), while the writer stands at node `k - 1`. So the writer only overwrites nodes that were read already.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The leading `0` opens the first stretch; it is not a separator that produces an empty sum.",
          "Forgetting to cut the list after the last written sum leaves the old tail attached.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const segs = ri(rng, 1, pick(rng, [1, 3, 6, 12]));
        const top = pick(rng, [1, 9, 1000]);
        const a = [0];
        for (let s = 0; s < segs; s++) {
          const len = ri(rng, 1, pick(rng, [1, 2, 4]));
          for (let i = 0; i < len; i++) a.push(ri(rng, 1, top));
          a.push(0);
        }
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def mergeNodes(head: Optional[ListNode]) -> Optional[ListNode]:
              write, last = head, None
              cur, s = head.next, 0
              while cur:
                  if cur.val == 0:
                      write.val = s
                      last = write
                      write = write.next
                      s = 0
                  else:
                      s += cur.val
                  cur = cur.next
              last.next = None
              return head
        `,
        javascript: code`
          var mergeNodes = function(head) {
              var write = head, last = null, s = 0;
              for (var cur = head.next; cur !== null; cur = cur.next) {
                  if (cur.val === 0) { write.val = s; last = write; write = write.next; s = 0; }
                  else s += cur.val;
              }
              last.next = null;
              return head;
          };
        `,
        typescript: code`
          function mergeNodes(head: ListNode | null): ListNode | null {
              var write: ListNode = head, last: ListNode = null, s = 0;
              for (var cur = head.next; cur !== null; cur = cur.next) {
                  if (cur.val === 0) { write.val = s; last = write; write = write.next; s = 0; }
                  else s += cur.val;
              }
              last.next = null;
              return head;
          }
        `,
        java: code`
          public static ListNode mergeNodes(ListNode head) {
              ListNode write = head, last = null;
              int s = 0;
              for (ListNode cur = head.next; cur != null; cur = cur.next) {
                  if (cur.val == 0) { write.val = s; last = write; write = write.next; s = 0; }
                  else s += cur.val;
              }
              last.next = null;
              return head;
          }
        `,
        cpp: code`
          ListNode* mergeNodes(ListNode* head) {
              ListNode *write = head, *last = nullptr;
              int s = 0;
              for (ListNode* cur = head->next; cur; cur = cur->next) {
                  if (cur->val == 0) { write->val = s; last = write; write = write->next; s = 0; }
                  else s += cur->val;
              }
              last->next = nullptr;
              return head;
          }
        `,
        c: code`
          struct ListNode* mergeNodes(struct ListNode* head) {
              struct ListNode *write = head, *last = NULL;
              int s = 0;
              for (struct ListNode* cur = head->next; cur; cur = cur->next) {
                  if (cur->val == 0) { write->val = s; last = write; write = write->next; s = 0; }
                  else s += cur->val;
              }
              last->next = NULL;
              return head;
          }
        `,
        csharp: code`
          public static ListNode MergeNodes(ListNode head)
          {
              ListNode write = head, last = null;
              int s = 0;
              for (ListNode cur = head.next; cur != null; cur = cur.next)
              {
                  if (cur.val == 0) { write.val = s; last = write; write = write.next; s = 0; }
                  else s += cur.val;
              }
              last.next = null;
              return head;
          }
        `,
        go: code`
          func mergeNodes(head *ListNode) *ListNode {
          	write := head
          	var last *ListNode
          	s := 0
          	for cur := head.Next; cur != nil; cur = cur.Next {
          		if cur.Val == 0 {
          			write.Val = s
          			last = write
          			write = write.Next
          			s = 0
          		} else {
          			s += cur.Val
          		}
          	}
          	last.Next = nil
          	return head
          }
        `,
        kotlin: kt(code`
          fun mergeNodes(head: ListNode?): ListNode? {
              var write = head!!
              var last: ListNode = head
              var s = 0
              var cur = head.next
              while (cur != null) {
                  if (cur.KVAL == 0) { write.KVAL = s; last = write; write = write.next ?: write; s = 0 }
                  else s += cur.KVAL
                  cur = cur.next
              }
              last.next = null
              return head
          }
        `),
        swift: code`
          func mergeNodes(_ head: ListNode?) -> ListNode? {
              var write = head!
              var last = write
              var s = 0
              var cur = write.next
              while let c = cur {
                  if c.val == 0 { write.val = s; last = write; if let w = write.next { write = w }; s = 0 }
                  else { s += c.val }
                  cur = c.next
              }
              last.next = nil
              return head
          }
        `,
        rust: code`
          fn mergeNodes(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut sums: Vec<i32> = Vec::new();
              let mut s = 0;
              let mut cur = &head.as_ref().unwrap().next;
              while let Some(n) = cur {
                  if n.val == 0 { sums.push(s); s = 0; } else { s += n.val; }
                  cur = &n.next;
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in sums.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function mergeNodes($head) {
              $write = $head; $last = null; $s = 0;
              for ($cur = $head->next; $cur !== null; $cur = $cur->next) {
                  if ($cur->val == 0) { $write->val = $s; $last = $write; $write = $write->next; $s = 0; }
                  else $s += $cur->val;
              }
              $last->next = null;
              return $head;
          }
        `,
        ruby: code`
          def mergeNodes(head)
            write = head
            last = nil
            s = 0
            cur = head.next
            until cur.nil?
              if cur.val == 0
                write.val = s
                last = write
                write = write.next
                s = 0
              else
                s += cur.val
              end
              cur = cur.next
            end
            last.next = nil
            head
          end
        `,
      },
    };
  })(),

  // ── Spiral Matrix IV (LC 2326) ────────────────────────────────────
  (() => {
    const ref = (m: number, n: number, a: number[]) => {
      const mat = Array.from({ length: m }, () => new Array<number>(n).fill(-1));
      const dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];
      let r = 0, c = 0, d = 0;
      for (const v of a) {
        mat[r][c] = v;
        let nr = r + dr[d], nc = c + dc[d];
        if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] !== -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
        r = nr; c = nc;
      }
      return mat;
    };
    const ex: Array<[number, number, number[]]> = [[3, 4, [1, 2, 3, 4, 5, 6, 7, 8, 9]], [1, 4, [0, 1, 2]], [2, 2, [5, 6, 7, 8]]];
    return {
      slug: "spiral-matrix-iv",
      title: "Spiral Matrix IV",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Matrix", "Simulation", "Array", "Amazon"],
      signature: { funcName: "spiralMatrix", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "head", type: "ListNode" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given two integers `m` and `n`, the dimensions of a matrix, and the `head` of a linked list of integers.\n\nBuild an `m x n` matrix by writing the list's values in **spiral order**, clockwise, starting from the top-left cell: along the top row to the right, down the right column, back along the bottom row, up the left column, and inwards. If the list runs out before the matrix is full, every remaining cell holds `-1`.\n\nReturn the matrix.",
        [
          { in: `m = ${ex[0][0]}, n = ${ex[0][1]}, head = ${fmtIntArr(ex[0][2])}`, out: fmtIntMat(ref(...ex[0])), note: "The top row takes 1–4, the right column 5 and 6, the bottom row 7, 8, 9 leftwards. The two middle cells are never reached and stay -1." },
          { in: `m = ${ex[1][0]}, n = ${ex[1][1]}, head = ${fmtIntArr(ex[1][2])}`, out: fmtIntMat(ref(...ex[1])), note: "A single row is filled left to right; the last cell gets -1." },
          { in: `m = ${ex[2][0]}, n = ${ex[2][1]}, head = ${fmtIntArr(ex[2][2])}`, out: fmtIntMat(ref(...ex[2])), note: "The spiral turns at every corner of the 2 x 2 matrix." },
        ],
        ["1 <= m, n <= 10^5", "1 <= m * n <= 10^5", "The number of nodes in the list is in the range [1, m * n]", "0 <= Node.val <= 1000"]),
      hints: [
        "Start with every cell set to `-1`; then you only have to place the list's values.",
        "Walk the matrix with a position and a direction (right, down, left, up), placing one value per step.",
        "Turn clockwise whenever the next cell would leave the matrix or is already filled — node values are never negative, so `-1` doubles as \"not filled yet\".",
      ],
      editorial: explain({
        idea: "Simulate the spiral directly: keep the current cell and direction, write the next list value, and turn clockwise when the step ahead is blocked by the border or a written cell.",
        steps: [
          "Create the `m x n` matrix filled with `-1`; set `r = c = 0` and the direction to right.",
          "For each node: write its value at `(r, c)`, then look at the next cell in the current direction.",
          "If that cell is outside the matrix or not `-1`, rotate the direction clockwise (right → down → left → up → right) and recompute the next cell.",
          "Move to it and continue with the next node. Return the matrix when the list ends.",
        ],
        why: "The spiral is exactly the path that goes straight until blocked and then turns right. Written cells block exactly like a border, so one turn per blocked step reproduces the spiral ring by ring, and since the list has at most `m * n` values the walk never needs a cell that does not exist.",
        time: "O(m * n)",
        space: "O(1) besides the output",
        pitfalls: [
          "Using `0` as the empty marker breaks on lists that contain `0`; `-1` is safe because values are non-negative.",
          "After the last value the computed next step may point outside the matrix — just never use it.",
        ],
      }),
      examples: ex.map(([m, n, a]) => ({ input: `${m}\n${n}\n${fmtIntArr(a)}`, expectedOutput: fmtIntMat(ref(m, n, a)) })),
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 7])), n = ri(rng, 1, pick(rng, [1, 3, 7]));
        const len = rng() < 0.3 ? m * n : ri(rng, 1, m * n);
        const top = pick(rng, [9, 1000]);
        const a = Array.from({ length: len }, () => ri(rng, 0, top));
        return { input: `${m}\n${n}\n${fmtIntArr(a)}`, expectedOutput: fmtIntMat(ref(m, n, a)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def spiralMatrix(m: int, n: int, head: Optional[ListNode]) -> List[List[int]]:
              mat = [[-1] * n for _ in range(m)]
              dr, dc = (0, 1, 0, -1), (1, 0, -1, 0)
              r = c = d = 0
              while head:
                  mat[r][c] = head.val
                  nr, nc = r + dr[d], c + dc[d]
                  if not (0 <= nr < m and 0 <= nc < n) or mat[nr][nc] != -1:
                      d = (d + 1) % 4
                      nr, nc = r + dr[d], c + dc[d]
                  r, c = nr, nc
                  head = head.next
              return mat
        `,
        javascript: code`
          var spiralMatrix = function(m, n, head) {
              var mat = [];
              for (var i = 0; i < m; i++) { mat.push([]); for (var j = 0; j < n; j++) mat[i].push(-1); }
              var dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];
              var r = 0, c = 0, d = 0;
              for (; head !== null; head = head.next) {
                  mat[r][c] = head.val;
                  var nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] !== -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          };
        `,
        typescript: code`
          function spiralMatrix(m: number, n: number, head: ListNode | null): number[][] {
              var mat: number[][] = [];
              for (var i = 0; i < m; i++) { mat.push([]); for (var j = 0; j < n; j++) mat[i].push(-1); }
              var dr = [0, 1, 0, -1], dc = [1, 0, -1, 0];
              var r = 0, c = 0, d = 0;
              for (; head !== null; head = head.next) {
                  mat[r][c] = head.val;
                  var nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] !== -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          }
        `,
        java: code`
          public static int[][] spiralMatrix(int m, int n, ListNode head) {
              int[][] mat = new int[m][n];
              for (int[] row : mat) Arrays.fill(row, -1);
              int[] dr = {0, 1, 0, -1}, dc = {1, 0, -1, 0};
              int r = 0, c = 0, d = 0;
              for (; head != null; head = head.next) {
                  mat[r][c] = head.val;
                  int nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          }
        `,
        cpp: code`
          vector<vector<int>> spiralMatrix(int m, int n, ListNode* head) {
              vector<vector<int>> mat(m, vector<int>(n, -1));
              int dr[4] = {0, 1, 0, -1}, dc[4] = {1, 0, -1, 0};
              int r = 0, c = 0, d = 0;
              for (; head; head = head->next) {
                  mat[r][c] = head->val;
                  int nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          }
        `,
        c: code`
          int** spiralMatrix(int m, int n, struct ListNode* head, int* returnSize, int** returnColumnSizes) {
              int** mat = (int**)malloc(m * sizeof(int*));
              *returnColumnSizes = (int*)malloc(m * sizeof(int));
              for (int i = 0; i < m; i++) {
                  mat[i] = (int*)malloc(n * sizeof(int));
                  (*returnColumnSizes)[i] = n;
                  for (int j = 0; j < n; j++) mat[i][j] = -1;
              }
              *returnSize = m;
              int dr[4] = {0, 1, 0, -1}, dc[4] = {1, 0, -1, 0};
              int r = 0, c = 0, d = 0;
              for (; head; head = head->next) {
                  mat[r][c] = head->val;
                  int nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          }
        `,
        csharp: code`
          public static int[][] SpiralMatrix(int m, int n, ListNode head)
          {
              var mat = new int[m][];
              for (int i = 0; i < m; i++) { mat[i] = new int[n]; for (int j = 0; j < n; j++) mat[i][j] = -1; }
              int[] dr = { 0, 1, 0, -1 }, dc = { 1, 0, -1, 0 };
              int r = 0, c = 0, d = 0;
              for (; head != null; head = head.next)
              {
                  mat[r][c] = head.val;
                  int nr = r + dr[d], nc = c + dc[d];
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d]; }
                  r = nr; c = nc;
              }
              return mat;
          }
        `,
        go: code`
          func spiralMatrix(m int, n int, head *ListNode) [][]int {
          	mat := make([][]int, m)
          	for i := range mat {
          		mat[i] = make([]int, n)
          		for j := range mat[i] {
          			mat[i][j] = -1
          		}
          	}
          	dr, dc := []int{0, 1, 0, -1}, []int{1, 0, -1, 0}
          	r, c, d := 0, 0, 0
          	for ; head != nil; head = head.Next {
          		mat[r][c] = head.Val
          		nr, nc := r+dr[d], c+dc[d]
          		if nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1 {
          			d = (d + 1) % 4
          			nr, nc = r+dr[d], c+dc[d]
          		}
          		r, c = nr, nc
          	}
          	return mat
          }
        `,
        kotlin: kt(code`
          fun spiralMatrix(m: Int, n: Int, head: ListNode?): Array<IntArray> {
              val mat = Array(m) { IntArray(n) { -1 } }
              val dr = intArrayOf(0, 1, 0, -1)
              val dc = intArrayOf(1, 0, -1, 0)
              var r = 0
              var c = 0
              var d = 0
              var cur = head
              while (cur != null) {
                  mat[r][c] = cur.KVAL
                  var nr = r + dr[d]
                  var nc = c + dc[d]
                  if (nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1) { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d] }
                  r = nr; c = nc
                  cur = cur.next
              }
              return mat
          }
        `),
        swift: code`
          func spiralMatrix(_ m: Int, _ n: Int, _ head: ListNode?) -> [[Int]] {
              var mat = [[Int]](repeating: [Int](repeating: -1, count: n), count: m)
              let dr = [0, 1, 0, -1], dc = [1, 0, -1, 0]
              var r = 0, c = 0, d = 0
              var cur = head
              while let node = cur {
                  mat[r][c] = node.val
                  var nr = r + dr[d], nc = c + dc[d]
                  if nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1 { d = (d + 1) % 4; nr = r + dr[d]; nc = c + dc[d] }
                  r = nr; c = nc
                  cur = node.next
              }
              return mat
          }
        `,
        rust: code`
          fn spiralMatrix(m: i32, n: i32, head: Option<Box<ListNode>>) -> Vec<Vec<i32>> {
              let mut mat = vec![vec![-1; n as usize]; m as usize];
              let dr = [0, 1, 0, -1];
              let dc = [1, 0, -1, 0];
              let (mut r, mut c, mut d) = (0i32, 0i32, 0usize);
              let mut cur = &head;
              while let Some(node) = cur {
                  mat[r as usize][c as usize] = node.val;
                  let (mut nr, mut nc) = (r + dr[d], c + dc[d]);
                  if nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr as usize][nc as usize] != -1 {
                      d = (d + 1) % 4;
                      nr = r + dr[d];
                      nc = c + dc[d];
                  }
                  r = nr;
                  c = nc;
                  cur = &node.next;
              }
              mat
          }
        `,
        php: code`
          function spiralMatrix($m, $n, $head) {
              $mat = array_fill(0, $m, array_fill(0, $n, -1));
              $dr = [0, 1, 0, -1]; $dc = [1, 0, -1, 0];
              $r = 0; $c = 0; $d = 0;
              for (; $head !== null; $head = $head->next) {
                  $mat[$r][$c] = $head->val;
                  $nr = $r + $dr[$d]; $nc = $c + $dc[$d];
                  if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n || $mat[$nr][$nc] != -1) { $d = ($d + 1) % 4; $nr = $r + $dr[$d]; $nc = $c + $dc[$d]; }
                  $r = $nr; $c = $nc;
              }
              return $mat;
          }
        `,
        ruby: code`
          def spiralMatrix(m, n, head)
            mat = Array.new(m) { Array.new(n, -1) }
            dr = [0, 1, 0, -1]
            dc = [1, 0, -1, 0]
            r = c = d = 0
            until head.nil?
              mat[r][c] = head.val
              nr = r + dr[d]
              nc = c + dc[d]
              if nr < 0 || nr >= m || nc < 0 || nc >= n || mat[nr][nc] != -1
                d = (d + 1) % 4
                nr = r + dr[d]
                nc = c + dc[d]
              end
              r = nr
              c = nc
              head = head.next
            end
            mat
          end
        `,
      },
    };
  })(),


  // ── Remove Nodes From Linked List (LC 2487) ───────────────────────
  (() => {
    const ref = (a: number[]) => {
      const out: number[] = [];
      let mx = -Infinity;
      for (let i = a.length - 1; i >= 0; i--) if (a[i] >= mx) { out.push(a[i]); mx = a[i]; }
      return out.reverse();
    };
    const ex = [[6, 3, 14, 2, 9, 5], [4, 4, 4], [1, 2, 3]];
    return {
      slug: "remove-nodes-from-linked-list",
      title: "Remove Nodes From Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Stack", "Monotonic Stack", "Recursion", "Amazon", "Microsoft"],
      signature: { funcName: "removeNodes", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a linked list. Remove every node that has a node with a **strictly greater** value anywhere to its right.\n\nReturn the head of the list that remains. The surviving nodes keep their original order.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "6 and 3 have 14 to their right; 2 has 9 to its right. 14, 9 and 5 have nothing larger after them." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "Equal values do not remove each other — only a strictly greater one does." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "Each node is beaten by the one after it; only the last survives." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "1 <= Node.val <= 10^5"]),
      hints: [
        "A node survives exactly when it is at least as large as every value after it — so the answer depends on suffix maxima.",
        "Suffix maxima are easy if you walk the list from the back. How can you walk a singly linked list from the back?",
        "Reverse the list, keep each node that is at least the largest value kept so far (dropping the rest), then reverse the result back.",
      ],
      editorial: explain({
        idea: "A node stays if and only if no later node is larger, i.e. its value is at least the maximum of the suffix after it. Reversing the list turns suffixes into prefixes, where a running maximum decides each node in one pass.",
        steps: [
          "Reverse the list. Its first node (the original last) always survives; set `mx` to its value.",
          "Walk the reversed list: if the next node's value is below `mx`, unlink it; otherwise move onto it and set `mx` to its value.",
          "Reverse the filtered list back and return its head.",
        ],
        why: "In the reversed list the nodes before a node are exactly the original nodes after it, and `mx` is the largest value among the kept ones — which equals the largest value among all of them, because a dropped node was smaller than some kept node. So a node is dropped exactly when a strictly greater value lies to its right in the original list.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Use `<` for dropping, not `<=`: equal values survive.",
          "A monotonic stack (pop smaller values, push the current node) gives the same list in O(n) extra space; recursion from the tail works too but can overflow the stack on 10^5 nodes.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const a = randVals(rng, [1, 3, 8, 20, 40], 1, pick(rng, [3, 20, 100000]));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def flip_list(h):
              prev = None
              while h:
                  h.next, prev, h = prev, h, h.next
              return prev

          def removeNodes(head: Optional[ListNode]) -> Optional[ListNode]:
              rev = flip_list(head)
              mx, cur = rev.val, rev
              while cur.next:
                  if cur.next.val < mx:
                      cur.next = cur.next.next
                  else:
                      cur = cur.next
                      mx = cur.val
              return flip_list(rev)
        `,
        javascript: code`
          var flipList = function(h) {
              var prev = null;
              while (h !== null) { var nx = h.next; h.next = prev; prev = h; h = nx; }
              return prev;
          };

          var removeNodes = function(head) {
              var rev = flipList(head);
              var mx = rev.val, cur = rev;
              while (cur.next !== null) {
                  if (cur.next.val < mx) cur.next = cur.next.next;
                  else { cur = cur.next; mx = cur.val; }
              }
              return flipList(rev);
          };
        `,
        typescript: code`
          function flipList(h: ListNode | null): ListNode | null {
              var prev: ListNode | null = null;
              while (h !== null) { var nx: ListNode | null = h.next; h.next = prev; prev = h; h = nx; }
              return prev;
          }

          function removeNodes(head: ListNode | null): ListNode | null {
              var rev: ListNode = flipList(head);
              var mx = rev.val, cur: ListNode = rev;
              while (cur.next !== null) {
                  if (cur.next.val < mx) cur.next = cur.next.next;
                  else { cur = cur.next; mx = cur.val; }
              }
              return flipList(rev);
          }
        `,
        java: code`
          static ListNode flipList(ListNode h) {
              ListNode prev = null;
              while (h != null) { ListNode nx = h.next; h.next = prev; prev = h; h = nx; }
              return prev;
          }

          public static ListNode removeNodes(ListNode head) {
              ListNode rev = flipList(head), cur = rev;
              int mx = rev.val;
              while (cur.next != null) {
                  if (cur.next.val < mx) cur.next = cur.next.next;
                  else { cur = cur.next; mx = cur.val; }
              }
              return flipList(rev);
          }
        `,
        cpp: code`
          ListNode* flipList(ListNode* h) {
              ListNode* prev = nullptr;
              while (h) { ListNode* nx = h->next; h->next = prev; prev = h; h = nx; }
              return prev;
          }

          ListNode* removeNodes(ListNode* head) {
              ListNode *rev = flipList(head), *cur = rev;
              int mx = rev->val;
              while (cur->next) {
                  if (cur->next->val < mx) cur->next = cur->next->next;
                  else { cur = cur->next; mx = cur->val; }
              }
              return flipList(rev);
          }
        `,
        c: code`
          static struct ListNode* flipList(struct ListNode* h) {
              struct ListNode* prev = NULL;
              while (h) { struct ListNode* nx = h->next; h->next = prev; prev = h; h = nx; }
              return prev;
          }

          struct ListNode* removeNodes(struct ListNode* head) {
              struct ListNode *rev = flipList(head), *cur = rev;
              int mx = rev->val;
              while (cur->next) {
                  if (cur->next->val < mx) cur->next = cur->next->next;
                  else { cur = cur->next; mx = cur->val; }
              }
              return flipList(rev);
          }
        `,
        csharp: code`
          static ListNode FlipList(ListNode h)
          {
              ListNode prev = null;
              while (h != null) { var nx = h.next; h.next = prev; prev = h; h = nx; }
              return prev;
          }

          public static ListNode RemoveNodes(ListNode head)
          {
              ListNode rev = FlipList(head), cur = rev;
              int mx = rev.val;
              while (cur.next != null)
              {
                  if (cur.next.val < mx) cur.next = cur.next.next;
                  else { cur = cur.next; mx = cur.val; }
              }
              return FlipList(rev);
          }
        `,
        go: code`
          func flipList(h *ListNode) *ListNode {
          	var prev *ListNode
          	for h != nil {
          		nx := h.Next
          		h.Next = prev
          		prev = h
          		h = nx
          	}
          	return prev
          }

          func removeNodes(head *ListNode) *ListNode {
          	rev := flipList(head)
          	cur, mx := rev, rev.Val
          	for cur.Next != nil {
          		if cur.Next.Val < mx {
          			cur.Next = cur.Next.Next
          		} else {
          			cur = cur.Next
          			mx = cur.Val
          		}
          	}
          	return flipList(rev)
          }
        `,
        kotlin: kt(code`
          fun flipList(h0: ListNode?): ListNode? {
              var h = h0
              var prev: ListNode? = null
              while (h != null) { val nx = h.next; h.next = prev; prev = h; h = nx }
              return prev
          }

          fun removeNodes(head: ListNode?): ListNode? {
              val rev = flipList(head)!!
              var mx = rev.KVAL
              var cur: ListNode = rev
              while (cur.next != null) {
                  val nx = cur.next!!
                  if (nx.KVAL < mx) cur.next = nx.next else { cur = nx; mx = nx.KVAL }
              }
              return flipList(rev)
          }
        `),
        swift: code`
          func flipList(_ h0: ListNode?) -> ListNode? {
              var h = h0
              var prev: ListNode? = nil
              while let n = h { let nx = n.next; n.next = prev; prev = n; h = nx }
              return prev
          }

          func removeNodes(_ head: ListNode?) -> ListNode? {
              let rev = flipList(head)!
              var mx = rev.val
              var cur = rev
              while let nx = cur.next {
                  if nx.val < mx { cur.next = nx.next } else { cur = nx; mx = nx.val }
              }
              return flipList(rev)
          }
        `,
        rust: code`
          fn removeNodes(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              // Walk from the back with a running maximum, building the survivors front-first.
              let mut out: Option<Box<ListNode>> = None;
              let mut mx = 0; // values are at least 1
              for &x in v.iter().rev() {
                  if x >= mx {
                      mx = x;
                      let mut n = ListNode::new(x);
                      n.next = out;
                      out = Some(Box::new(n));
                  }
              }
              out
          }
        `,
        php: code`
          function flipList($h) {
              $prev = null;
              while ($h !== null) { $nx = $h->next; $h->next = $prev; $prev = $h; $h = $nx; }
              return $prev;
          }

          function removeNodes($head) {
              $rev = flipList($head);
              $mx = $rev->val; $cur = $rev;
              while ($cur->next !== null) {
                  if ($cur->next->val < $mx) $cur->next = $cur->next->next;
                  else { $cur = $cur->next; $mx = $cur->val; }
              }
              return flipList($rev);
          }
        `,
        ruby: code`
          def flip_list(h)
            prev = nil
            until h.nil?
              nx = h.next
              h.next = prev
              prev = h
              h = nx
            end
            prev
          end

          def removeNodes(head)
            rev = flip_list(head)
            mx = rev.val
            cur = rev
            until cur.next.nil?
              if cur.next.val < mx
                cur.next = cur.next.next
              else
                cur = cur.next
                mx = cur.val
              end
            end
            flip_list(rev)
          end
        `,
      },
    };
  })(),

  // ── Insert Greatest Common Divisors in Linked List (LC 2807) ──────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (a: number[]) => {
      const out: number[] = [];
      a.forEach((v, i) => { if (i > 0) out.push(gcd(a[i - 1], v)); out.push(v); });
      return out;
    };
    const ex = [[12, 18, 7, 21], [5], [8, 8, 1000]];
    return {
      slug: "insert-greatest-common-divisors-in-linked-list",
      title: "Insert Greatest Common Divisors in Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Math", "Number Theory", "Amazon", "Google"],
      signature: { funcName: "insertGreatestCommonDivisors", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a linked list of positive integers. Between every pair of **adjacent** nodes, insert a new node whose value is the greatest common divisor of those two nodes' values.\n\nReturn the head of the list after all insertions. (The greatest common divisor of two numbers is the largest positive integer that divides both of them evenly.)",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "gcd(12, 18) = 6, gcd(18, 7) = 1 and gcd(7, 21) = 7 are inserted between the original pairs." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "A single node has no adjacent pair, so nothing is inserted." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "gcd(8, 8) = 8 and gcd(8, 1000) = 8." },
        ],
        ["The number of nodes in the list is in the range [1, 5000]", "1 <= Node.val <= 1000"]),
      hints: [
        "Each insertion depends only on the two original neighbours, so one pass over the original pairs is enough.",
        "Compute a gcd with Euclid's algorithm: `gcd(a, b) = gcd(b, a mod b)`, ending at `gcd(a, 0) = a`.",
        "After inserting a node between `cur` and `cur.next`, jump straight to the original next node — otherwise you would start pairing the new node with its neighbours.",
      ],
      editorial: explain({
        idea: "Walk the original nodes; for each node with a successor, splice a new gcd node between them and then step over it to the successor.",
        steps: [
          "Set `cur = head`.",
          "While `cur.next` exists: create a node with value `gcd(cur.val, cur.next.val)` pointing at `cur.next`, link `cur.next` to it, and move `cur` to the new node's `next` (the original successor).",
          "Return `head`.",
        ],
        why: "Every original adjacent pair is visited once, before any insertion separates it, and skipping the freshly inserted node keeps it out of the pairing. Euclid's algorithm is correct because any common divisor of `a` and `b` also divides `a mod b`.",
        time: "O(n log V) — V is the largest value",
        space: "O(1) besides the new nodes",
        pitfalls: [
          "Advancing to `cur.next` after the insertion lands on the new gcd node and inserts again, forever growing the list.",
          "The gcd of equal values is the value itself.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const base = pick(rng, [1, 2, 6, 12, 30]);
        const top = pick(rng, [10, 100, 1000]);
        const a = randVals(rng, [1, 3, 8, 20], 1, Math.max(1, Math.floor(top / base))).map((v) => (rng() < 0.6 ? Math.min(1000, v * base) : v));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from math import gcd
          from typing import Optional

          def insertGreatestCommonDivisors(head: Optional[ListNode]) -> Optional[ListNode]:
              cur = head
              while cur.next:
                  nxt = cur.next
                  cur.next = ListNode(gcd(cur.val, nxt.val), nxt)
                  cur = nxt
              return head
        `,
        javascript: code`
          var gcdOf = function(a, b) {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          };

          var insertGreatestCommonDivisors = function(head) {
              for (var cur = head; cur.next !== null; ) {
                  var nxt = cur.next;
                  cur.next = new ListNode(gcdOf(cur.val, nxt.val), nxt);
                  cur = nxt;
              }
              return head;
          };
        `,
        typescript: code`
          function gcdOf(a: number, b: number): number {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          }

          function insertGreatestCommonDivisors(head: ListNode | null): ListNode | null {
              for (var cur: ListNode = head; cur.next !== null; ) {
                  var nxt: ListNode = cur.next;
                  cur.next = new ListNode(gcdOf(cur.val, nxt.val), nxt);
                  cur = nxt;
              }
              return head;
          }
        `,
        java: code`
          static int gcdOf(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static ListNode insertGreatestCommonDivisors(ListNode head) {
              for (ListNode cur = head; cur.next != null; ) {
                  ListNode nxt = cur.next;
                  cur.next = new ListNode(gcdOf(cur.val, nxt.val), nxt);
                  cur = nxt;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* insertGreatestCommonDivisors(ListNode* head) {
              for (ListNode* cur = head; cur->next; ) {
                  ListNode* nxt = cur->next;
                  cur->next = new ListNode(__gcd(cur->val, nxt->val), nxt);
                  cur = nxt;
              }
              return head;
          }
        `,
        c: code`
          static int gcdOf(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          struct ListNode* insertGreatestCommonDivisors(struct ListNode* head) {
              for (struct ListNode* cur = head; cur->next; ) {
                  struct ListNode* nxt = cur->next;
                  struct ListNode* g = (struct ListNode*)malloc(sizeof(struct ListNode));
                  g->val = gcdOf(cur->val, nxt->val);
                  g->next = nxt;
                  cur->next = g;
                  cur = nxt;
              }
              return head;
          }
        `,
        csharp: code`
          static int GcdOf(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static ListNode InsertGreatestCommonDivisors(ListNode head)
          {
              for (ListNode cur = head; cur.next != null; )
              {
                  ListNode nxt = cur.next;
                  cur.next = new ListNode(GcdOf(cur.val, nxt.val), nxt);
                  cur = nxt;
              }
              return head;
          }
        `,
        go: code`
          func gcdOf(a, b int) int {
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return a
          }

          func insertGreatestCommonDivisors(head *ListNode) *ListNode {
          	for cur := head; cur.Next != nil; {
          		nxt := cur.Next
          		cur.Next = &ListNode{Val: gcdOf(cur.Val, nxt.Val), Next: nxt}
          		cur = nxt
          	}
          	return head
          }
        `,
        kotlin: kt(code`
          fun gcdOf(a0: Int, b0: Int): Int {
              var a = a0
              var b = b0
              while (b != 0) { val t = a % b; a = b; b = t }
              return a
          }

          fun insertGreatestCommonDivisors(head: ListNode?): ListNode? {
              var cur = head!!
              while (cur.next != null) {
                  val nxt = cur.next!!
                  val g = ListNode(gcdOf(cur.KVAL, nxt.KVAL))
                  g.next = nxt
                  cur.next = g
                  cur = nxt
              }
              return head
          }
        `),
        swift: code`
          func gcdOf(_ a0: Int, _ b0: Int) -> Int {
              var a = a0, b = b0
              while b != 0 { (a, b) = (b, a % b) }
              return a
          }

          func insertGreatestCommonDivisors(_ head: ListNode?) -> ListNode? {
              var cur = head!
              while let nxt = cur.next {
                  cur.next = ListNode(gcdOf(cur.val, nxt.val), nxt)
                  cur = nxt
              }
              return head
          }
        `,
        rust: code`
          fn insertGreatestCommonDivisors(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              fn gcd(a: i32, b: i32) -> i32 { if b == 0 { a } else { gcd(b, a % b) } }
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let mut w: Vec<i32> = Vec::with_capacity(2 * v.len());
              for i in 0..v.len() {
                  if i > 0 { w.push(gcd(v[i - 1], v[i])); }
                  w.push(v[i]);
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in w.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function gcdOf($a, $b) {
              while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
              return $a;
          }

          function insertGreatestCommonDivisors($head) {
              for ($cur = $head; $cur->next !== null; ) {
                  $nxt = $cur->next;
                  $cur->next = new ListNode(gcdOf($cur->val, $nxt->val), $nxt);
                  $cur = $nxt;
              }
              return $head;
          }
        `,
        ruby: code`
          def insertGreatestCommonDivisors(head)
            cur = head
            until cur.next.nil?
              nxt = cur.next
              cur.next = ListNode.new(cur.val.gcd(nxt.val), nxt)
              cur = nxt
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Double a Number Represented as a Linked List (LC 2816) ────────
  (() => {
    const ref = (a: number[]) => String(BigInt(a.join("")) * 2n).split("").map(Number);
    const ex = [[1, 8, 9], [9, 9, 9], [0]];
    return {
      slug: "double-a-number-represented-as-a-linked-list",
      title: "Double a Number Represented as a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Math", "Stack", "Amazon", "Google"],
      signature: { funcName: "doubleIt", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "A non-negative integer is stored in a linked list, one decimal digit per node, with the **most significant** digit at the `head`. The number has no leading zeros, except for the number `0` itself, which is a single node.\n\nDouble the number and return the `head` of a linked list representing the result in the same form.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "189 * 2 = 378." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "999 * 2 = 1998 — the result has one more digit than the input." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "0 * 2 = 0." },
        ],
        ["The number of nodes in the list is in the range [1, 10^4]", "0 <= Node.val <= 9", "The number has no leading zeros, except the number 0 itself"]),
      hints: [
        "Doubling a digit `d` gives at most 18, so each position sends a carry of at most 1 to the position on its left.",
        "The carry into a digit comes from its right neighbour: it is 1 exactly when that neighbour is 5 or more.",
        "So each new digit is `(2 * d) mod 10`, plus 1 if the next node's digit is at least 5 — one left-to-right pass, with an extra leading `1` when the head digit is at least 5.",
      ],
      editorial: explain({
        idea: "Carries normally flow right to left, against the list's links. But when doubling, the carry a digit receives is decided by its right neighbour alone (`1` if that digit is `>= 5`), so every digit can be finalised walking left to right.",
        steps: [
          "If the head digit is at least 5, the result gains a digit: put a new node `0` in front of the head.",
          "For each node: set its digit to `(2 * d) mod 10`, and add 1 if the next node exists and its (original) digit is at least 5.",
          "Return the (possibly new) head.",
        ],
        why: "The carry out of a position when doubling is `floor(2d / 10)` plus the carry into it, and `2d + 1 <= 19` keeps that at most 1; moreover `2d + carry >= 10` exactly when `d >= 5`, whatever the incoming carry. So the carry each digit receives is a function of its right neighbour only, which the forward pass reads before overwriting it.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Converting to a built-in integer overflows: the number has up to 10^4 digits.",
          "Read the next node's digit before it is overwritten — the pass changes each node only after its left neighbour has looked at it.",
          "The number 0 stays a single node `0`.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const len = ri(rng, 1, pick(rng, [1, 3, 10, 40]));
        const hi = rng() < 0.3 ? 9 : 0;
        const a = Array.from({ length: len }, () => (hi ? ri(rng, 5, 9) : ri(rng, 0, 9)));
        if (a[0] === 0) a[0] = len === 1 && rng() < 0.3 ? 0 : ri(rng, 1, 9);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def doubleIt(head: Optional[ListNode]) -> Optional[ListNode]:
              if head.val > 4:
                  head = ListNode(0, head)
              cur = head
              while cur:
                  cur.val = cur.val * 2 % 10
                  if cur.next and cur.next.val > 4:
                      cur.val += 1
                  cur = cur.next
              return head
        `,
        javascript: code`
          var doubleIt = function(head) {
              if (head.val > 4) head = new ListNode(0, head);
              for (var cur = head; cur !== null; cur = cur.next) {
                  cur.val = cur.val * 2 % 10;
                  if (cur.next !== null && cur.next.val > 4) cur.val += 1;
              }
              return head;
          };
        `,
        typescript: code`
          function doubleIt(head: ListNode | null): ListNode | null {
              if (head.val > 4) head = new ListNode(0, head);
              for (var cur = head; cur !== null; cur = cur.next) {
                  cur.val = cur.val * 2 % 10;
                  if (cur.next !== null && cur.next.val > 4) cur.val += 1;
              }
              return head;
          }
        `,
        java: code`
          public static ListNode doubleIt(ListNode head) {
              if (head.val > 4) head = new ListNode(0, head);
              for (ListNode cur = head; cur != null; cur = cur.next) {
                  cur.val = cur.val * 2 % 10;
                  if (cur.next != null && cur.next.val > 4) cur.val += 1;
              }
              return head;
          }
        `,
        cpp: code`
          ListNode* doubleIt(ListNode* head) {
              if (head->val > 4) head = new ListNode(0, head);
              for (ListNode* cur = head; cur; cur = cur->next) {
                  cur->val = cur->val * 2 % 10;
                  if (cur->next && cur->next->val > 4) cur->val += 1;
              }
              return head;
          }
        `,
        c: code`
          struct ListNode* doubleIt(struct ListNode* head) {
              if (head->val > 4) {
                  struct ListNode* z = (struct ListNode*)malloc(sizeof(struct ListNode));
                  z->val = 0;
                  z->next = head;
                  head = z;
              }
              for (struct ListNode* cur = head; cur; cur = cur->next) {
                  cur->val = cur->val * 2 % 10;
                  if (cur->next && cur->next->val > 4) cur->val += 1;
              }
              return head;
          }
        `,
        csharp: code`
          public static ListNode DoubleIt(ListNode head)
          {
              if (head.val > 4) head = new ListNode(0, head);
              for (ListNode cur = head; cur != null; cur = cur.next)
              {
                  cur.val = cur.val * 2 % 10;
                  if (cur.next != null && cur.next.val > 4) cur.val += 1;
              }
              return head;
          }
        `,
        go: code`
          func doubleIt(head *ListNode) *ListNode {
          	if head.Val > 4 {
          		head = &ListNode{Val: 0, Next: head}
          	}
          	for cur := head; cur != nil; cur = cur.Next {
          		cur.Val = cur.Val * 2 % 10
          		if cur.Next != nil && cur.Next.Val > 4 {
          			cur.Val++
          		}
          	}
          	return head
          }
        `,
        kotlin: kt(code`
          fun doubleIt(head: ListNode?): ListNode? {
              var h = head!!
              if (h.KVAL > 4) { val z = ListNode(0); z.next = h; h = z }
              var cur: ListNode? = h
              while (cur != null) {
                  cur.KVAL = cur.KVAL * 2 % 10
                  val nx = cur.next
                  if (nx != null && nx.KVAL > 4) cur.KVAL += 1
                  cur = nx
              }
              return h
          }
        `),
        swift: code`
          func doubleIt(_ head: ListNode?) -> ListNode? {
              var h = head!
              if h.val > 4 { h = ListNode(0, h) }
              var cur: ListNode? = h
              while let c = cur {
                  c.val = c.val * 2 % 10
                  if let nx = c.next, nx.val > 4 { c.val += 1 }
                  cur = c.next
              }
              return h
          }
        `,
        rust: code`
          fn doubleIt(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let mut out: Option<Box<ListNode>> = None;
              let mut carry = 0;
              for &d in v.iter().rev() {
                  let x = d * 2 + carry;
                  carry = x / 10;
                  let mut n = ListNode::new(x % 10);
                  n.next = out;
                  out = Some(Box::new(n));
              }
              if carry > 0 { let mut n = ListNode::new(carry); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function doubleIt($head) {
              if ($head->val > 4) $head = new ListNode(0, $head);
              for ($cur = $head; $cur !== null; $cur = $cur->next) {
                  $cur->val = $cur->val * 2 % 10;
                  if ($cur->next !== null && $cur->next->val > 4) $cur->val += 1;
              }
              return $head;
          }
        `,
        ruby: code`
          def doubleIt(head)
            head = ListNode.new(0, head) if head.val > 4
            cur = head
            until cur.nil?
              cur.val = cur.val * 2 % 10
              cur.val += 1 if !cur.next.nil? && cur.next.val > 4
              cur = cur.next
            end
            head
          end
        `,
      },
    };
  })(),

  // ── Delete Nodes From Linked List Present in Array (LC 3217) ──────
  (() => {
    const ref = (nums: number[], a: number[]) => { const s = new Set(nums); return a.filter((v) => !s.has(v)); };
    const ex: Array<[number[], number[]]> = [[[3, 7], [7, 1, 3, 9, 7, 4]], [[2], [2, 5, 2, 2]], [[8, 6, 4], [1, 2, 3]]];
    return {
      slug: "delete-nodes-from-linked-list-present-in-array",
      title: "Delete Nodes From Linked List Present in Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Linked List", "Amazon", "Google"],
      signature: { funcName: "modifiedList", params: [{ name: "nums", type: "int[]" as const }, { name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given an array of distinct integers `nums` and the `head` of a linked list. Remove from the list every node whose value appears in `nums`, keeping the other nodes in their original order, and return the head of the modified list.",
        [
          { in: `nums = ${fmtIntArr(ex[0][0])}, head = ${fmtIntArr(ex[0][1])}`, out: fmtIntArr(ref(...ex[0])), note: "Both 7s and the 3 are removed." },
          { in: `nums = ${fmtIntArr(ex[1][0])}, head = ${fmtIntArr(ex[1][1])}`, out: fmtIntArr(ref(...ex[1])), note: "Every 2 goes, including the head — the new head is the node holding 5." },
          { in: `nums = ${fmtIntArr(ex[2][0])}, head = ${fmtIntArr(ex[2][1])}`, out: fmtIntArr(ref(...ex[2])), note: "No value of the list is in `nums`, so nothing changes." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5", "All elements in nums are distinct", "The number of nodes in the list is in the range [1, 10^5]", "1 <= Node.val <= 10^5", "At least one node of the list has a value not present in nums"]),
      hints: [
        "Checking each node against the whole array costs `O(n * m)`; load `nums` into a hash set first.",
        "Deleting the head is the awkward case. A dummy node in front of the head makes every node, the head included, have a predecessor.",
        "Walk with `cur` starting at the dummy: while `cur.next` is to be removed, skip it; otherwise advance. Return `dummy.next`.",
      ],
      editorial: explain({
        idea: "Membership tests against a hash set are O(1), and a dummy node before the head turns head deletions into ordinary unlinking.",
        steps: [
          "Put every value of `nums` into a set.",
          "Create `dummy` with `dummy.next = head` and set `cur = dummy`.",
          "While `cur.next` exists: if its value is in the set, unlink it (`cur.next = cur.next.next`) without moving; otherwise move `cur` forward.",
          "Return `dummy.next`.",
        ],
        why: "`cur` always points at a node that is kept (the dummy, or a node already checked), so each unlinking removes exactly the node examined and never skips one: after an unlink, `cur.next` is the next unexamined node.",
        time: "O(n + m)",
        space: "O(m)",
        pitfalls: [
          "Advancing `cur` after an unlink skips the node that moved up, so two consecutive values to delete would leave the second.",
          "Several leading nodes may need removing — the dummy handles them without special cases.",
        ],
      }),
      examples: ex.map(([nums, a]) => ({ input: `${fmtIntArr(nums)}\n${fmtIntArr(a)}`, expectedOutput: fmtIntArr(ref(nums, a)) })),
      gen: (rng: Rng) => {
        const top = pick(rng, [4, 10, 50, 100000]);
        const a = randVals(rng, [1, 3, 10, 30], 1, top);
        const keep = pick(rng, a);
        const pool = new Set<number>();
        const want = ri(rng, 1, pick(rng, [1, 3, 8, 20]));
        for (let tries = 0; pool.size < want && tries < 200; tries++) {
          const v = rng() < 0.6 ? pick(rng, a) : ri(rng, 1, top);
          if (v !== keep) pool.add(v);
        }
        if (pool.size === 0) pool.add(keep === 100000 ? 1 : keep + 1);
        const nums = shuffle(rng, [...pool]);
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(a)}`, expectedOutput: fmtIntArr(ref(nums, a)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def modifiedList(nums: List[int], head: Optional[ListNode]) -> Optional[ListNode]:
              drop = set(nums)
              dummy = ListNode(0, head)
              cur = dummy
              while cur.next:
                  if cur.next.val in drop:
                      cur.next = cur.next.next
                  else:
                      cur = cur.next
              return dummy.next
        `,
        javascript: code`
          var modifiedList = function(nums, head) {
              var drop = new Set(nums);
              var dummy = new ListNode(0, head), cur = dummy;
              while (cur.next !== null) {
                  if (drop.has(cur.next.val)) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          };
        `,
        typescript: code`
          function modifiedList(nums: number[], head: ListNode | null): ListNode | null {
              var drop: { [v: number]: boolean } = {};
              for (var i = 0; i < nums.length; i++) drop[nums[i]] = true;
              var dummy = new ListNode(0, head), cur: ListNode = dummy;
              while (cur.next !== null) {
                  if (drop[cur.next.val]) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode modifiedList(int[] nums, ListNode head) {
              HashSet<Integer> drop = new HashSet<>();
              for (int x : nums) drop.add(x);
              ListNode dummy = new ListNode(0, head), cur = dummy;
              while (cur.next != null) {
                  if (drop.contains(cur.next.val)) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* modifiedList(vector<int>& nums, ListNode* head) {
              unordered_set<int> drop(nums.begin(), nums.end());
              ListNode dummy(0, head);
              ListNode* cur = &dummy;
              while (cur->next) {
                  if (drop.count(cur->next->val)) cur->next = cur->next->next;
                  else cur = cur->next;
              }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* modifiedList(int* nums, int numsSize, struct ListNode* head) {
              /* Values are at most 10^5, so a flag array is the set. */
              char* drop = (char*)calloc(100001, 1);
              for (int i = 0; i < numsSize; i++) drop[nums[i]] = 1;
              struct ListNode dummy;
              dummy.next = head;
              struct ListNode* cur = &dummy;
              while (cur->next) {
                  if (drop[cur->next->val]) cur->next = cur->next->next;
                  else cur = cur->next;
              }
              free(drop);
              return dummy.next;
          }
        `,
        csharp: code`
          public static ListNode ModifiedList(int[] nums, ListNode head)
          {
              var drop = new HashSet<int>(nums);
              ListNode dummy = new ListNode(0, head), cur = dummy;
              while (cur.next != null)
              {
                  if (drop.Contains(cur.next.val)) cur.next = cur.next.next;
                  else cur = cur.next;
              }
              return dummy.next;
          }
        `,
        go: code`
          func modifiedList(nums []int, head *ListNode) *ListNode {
          	drop := make(map[int]bool, len(nums))
          	for _, x := range nums {
          		drop[x] = true
          	}
          	dummy := &ListNode{Next: head}
          	cur := dummy
          	for cur.Next != nil {
          		if drop[cur.Next.Val] {
          			cur.Next = cur.Next.Next
          		} else {
          			cur = cur.Next
          		}
          	}
          	return dummy.Next
          }
        `,
        kotlin: kt(code`
          fun modifiedList(nums: IntArray, head: ListNode?): ListNode? {
              val drop = nums.toHashSet()
              val dummy = ListNode(0)
              dummy.next = head
              var cur = dummy
              while (cur.next != null) {
                  val nx = cur.next!!
                  if (nx.KVAL in drop) cur.next = nx.next else cur = nx
              }
              return dummy.next
          }
        `),
        swift: code`
          func modifiedList(_ nums: [Int], _ head: ListNode?) -> ListNode? {
              let drop = Set(nums)
              let dummy = ListNode(0, head)
              var cur = dummy
              while let nx = cur.next {
                  if drop.contains(nx.val) { cur.next = nx.next } else { cur = nx }
              }
              return dummy.next
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn modifiedList(nums: Vec<i32>, head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let drop: HashSet<i32> = nums.into_iter().collect();
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { if !drop.contains(&n.val) { v.push(n.val); } cur = &n.next; }
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function modifiedList($nums, $head) {
              $drop = array_flip($nums);
              $dummy = new ListNode(0, $head);
              $cur = $dummy;
              while ($cur->next !== null) {
                  if (isset($drop[$cur->next->val])) $cur->next = $cur->next->next;
                  else $cur = $cur->next;
              }
              return $dummy->next;
          }
        `,
        ruby: code`
          require 'set'

          def modifiedList(nums, head)
            drop = nums.to_set
            dummy = ListNode.new(0, head)
            cur = dummy
            until cur.next.nil?
              if drop.include?(cur.next.val)
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

  // ── Add 1 to a Number Represented as Linked List (GFG) ────────────
  (() => {
    const ref = (a: number[]) => String(BigInt(a.join("")) + 1n).split("").map(Number);
    const ex = [[4, 5, 6], [1, 2, 9, 9], [9, 9]];
    return {
      slug: "add-one-to-a-number-represented-as-linked-list",
      title: "Add 1 to a Number Represented as Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Math", "Recursion", "Amazon", "Microsoft", "Samsung", "Flipkart"],
      signature: { funcName: "addOne", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "A non-negative integer is stored in a singly linked list, one decimal digit per node, with the **most significant** digit at the `head`. The number has no leading zeros, except for the number `0` itself.\n\nAdd `1` to the number and return the `head` of the list representing the result, in the same form.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "456 + 1 = 457." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "1299 + 1 = 1300: the trailing 9s turn into 0s and the 2 becomes 3." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "99 + 1 = 100 — every digit is 9, so a new leading digit appears." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "0 <= Node.val <= 9", "The number has no leading zeros, except the number 0 itself"]),
      hints: [
        "Adding 1 only changes the trailing run of 9s and the digit just before it.",
        "Find the **last** node whose digit is not 9 in one forward pass.",
        "Increment that node and set every node after it to 0. If there is no such node, every digit is 9: put a new node 1 in front and set all old digits to 0.",
      ],
      editorial: explain({
        idea: "A carry only travels through 9s. So the digit that absorbs the `+1` is the last digit that is not 9; everything after it was 9 and becomes 0.",
        steps: [
          "Walk the list and remember the last node whose value is not 9.",
          "If there is one, increase it by 1 and set every node after it to 0; return `head`.",
          "Otherwise every digit is 9: set them all to 0 and return a new node `1` placed in front of `head`.",
        ],
        why: "Adding 1 to `x 9 9 … 9` (where `x != 9`) gives `(x + 1) 0 0 … 0` — the carry dies at `x` because `x + 1 <= 9`. Digits before `x` are untouched. When there is no such `x` the number is `10^k - 1` and the result is `10^k`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Converting the list to a built-in integer overflows for long lists.",
          "Reversing the list twice also works but costs two extra passes; recursion from the tail risks a stack overflow on 10^5 nodes.",
          "The number 0 becomes 1.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const len = ri(rng, 1, pick(rng, [1, 3, 10, 40]));
        const nines = rng() < 0.5 ? ri(rng, 0, len) : 0;
        const a = Array.from({ length: len }, (_, i) => (i >= len - nines ? 9 : ri(rng, 0, 9)));
        if (a[0] === 0 && len > 1) a[0] = ri(rng, 1, 9);
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def addOne(head: Optional[ListNode]) -> Optional[ListNode]:
              last = None
              cur = head
              while cur:
                  if cur.val != 9:
                      last = cur
                  cur = cur.next
              if last is None:
                  result, cur = ListNode(1, head), head
              else:
                  last.val += 1
                  result, cur = head, last.next
              while cur:
                  cur.val = 0
                  cur = cur.next
              return result
        `,
        javascript: code`
          var addOne = function(head) {
              var last = null, cur;
              for (cur = head; cur !== null; cur = cur.next) if (cur.val !== 9) last = cur;
              var result = head;
              if (last === null) { result = new ListNode(1, head); cur = head; }
              else { last.val += 1; cur = last.next; }
              for (; cur !== null; cur = cur.next) cur.val = 0;
              return result;
          };
        `,
        typescript: code`
          function addOne(head: ListNode | null): ListNode | null {
              var last: ListNode | null = null, cur: ListNode | null;
              for (cur = head; cur !== null; cur = cur.next) if (cur.val !== 9) last = cur;
              var result: ListNode = head;
              if (last === null) { result = new ListNode(1, head); cur = head; }
              else { last.val += 1; cur = last.next; }
              for (; cur !== null; cur = cur.next) cur.val = 0;
              return result;
          }
        `,
        java: code`
          public static ListNode addOne(ListNode head) {
              ListNode last = null, cur;
              for (cur = head; cur != null; cur = cur.next) if (cur.val != 9) last = cur;
              ListNode result = head;
              if (last == null) { result = new ListNode(1, head); cur = head; }
              else { last.val += 1; cur = last.next; }
              for (; cur != null; cur = cur.next) cur.val = 0;
              return result;
          }
        `,
        cpp: code`
          ListNode* addOne(ListNode* head) {
              ListNode *last = nullptr, *cur;
              for (cur = head; cur; cur = cur->next) if (cur->val != 9) last = cur;
              ListNode* result = head;
              if (!last) { result = new ListNode(1, head); cur = head; }
              else { last->val += 1; cur = last->next; }
              for (; cur; cur = cur->next) cur->val = 0;
              return result;
          }
        `,
        c: code`
          struct ListNode* addOne(struct ListNode* head) {
              struct ListNode *last = NULL, *cur;
              for (cur = head; cur; cur = cur->next) if (cur->val != 9) last = cur;
              struct ListNode* result = head;
              if (!last) {
                  result = (struct ListNode*)malloc(sizeof(struct ListNode));
                  result->val = 1;
                  result->next = head;
                  cur = head;
              } else {
                  last->val += 1;
                  cur = last->next;
              }
              for (; cur; cur = cur->next) cur->val = 0;
              return result;
          }
        `,
        csharp: code`
          public static ListNode AddOne(ListNode head)
          {
              ListNode last = null, cur;
              for (cur = head; cur != null; cur = cur.next) if (cur.val != 9) last = cur;
              ListNode result = head;
              if (last == null) { result = new ListNode(1, head); cur = head; }
              else { last.val += 1; cur = last.next; }
              for (; cur != null; cur = cur.next) cur.val = 0;
              return result;
          }
        `,
        go: code`
          func addOne(head *ListNode) *ListNode {
          	var last *ListNode
          	for cur := head; cur != nil; cur = cur.Next {
          		if cur.Val != 9 {
          			last = cur
          		}
          	}
          	result, cur := head, head
          	if last == nil {
          		result = &ListNode{Val: 1, Next: head}
          	} else {
          		last.Val++
          		cur = last.Next
          	}
          	for ; cur != nil; cur = cur.Next {
          		cur.Val = 0
          	}
          	return result
          }
        `,
        kotlin: kt(code`
          fun addOne(head: ListNode?): ListNode? {
              var last: ListNode? = null
              var cur = head
              while (cur != null) { if (cur.KVAL != 9) last = cur; cur = cur.next }
              var result = head
              if (last == null) { val one = ListNode(1); one.next = head; result = one; cur = head }
              else { last.KVAL += 1; cur = last.next }
              while (cur != null) { cur.KVAL = 0; cur = cur.next }
              return result
          }
        `),
        swift: code`
          func addOne(_ head: ListNode?) -> ListNode? {
              var last: ListNode? = nil
              var cur = head
              while let c = cur { if c.val != 9 { last = c }; cur = c.next }
              var result = head
              if let l = last { l.val += 1; cur = l.next }
              else { result = ListNode(1, head); cur = head }
              while let c = cur { c.val = 0; cur = c.next }
              return result
          }
        `,
        rust: code`
          fn addOne(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              match v.iter().rposition(|&d| d != 9) {
                  Some(i) => { v[i] += 1; for d in v.iter_mut().skip(i + 1) { *d = 0; } }
                  None => { for d in v.iter_mut() { *d = 0; } v.insert(0, 1); }
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function addOne($head) {
              $last = null;
              for ($cur = $head; $cur !== null; $cur = $cur->next) if ($cur->val != 9) $last = $cur;
              $result = $head;
              if ($last === null) { $result = new ListNode(1, $head); $cur = $head; }
              else { $last->val += 1; $cur = $last->next; }
              for (; $cur !== null; $cur = $cur->next) $cur->val = 0;
              return $result;
          }
        `,
        ruby: code`
          def addOne(head)
            last = nil
            cur = head
            until cur.nil?
              last = cur if cur.val != 9
              cur = cur.next
            end
            if last.nil?
              result = ListNode.new(1, head)
              cur = head
            else
              last.val += 1
              result = head
              cur = last.next
            end
            until cur.nil?
              cur.val = 0
              cur = cur.next
            end
            result
          end
        `,
      },
    };
  })(),


  // ── Segregate Even and Odd Nodes in a Linked List (GFG) ───────────
  (() => {
    const ref = (a: number[]) => [...a.filter((v) => v % 2 === 0), ...a.filter((v) => v % 2 !== 0)];
    const ex = [[17, 15, 8, 9, 2, 4, 6], [1, 9, 1], [12, 3, 10, 7]];
    return {
      slug: "segregate-even-and-odd-nodes-in-a-linked-list",
      title: "Segregate Even and Odd Nodes in a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft"],
      signature: { funcName: "divide", params: [{ name: "head", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a linked list of positive integers. Rearrange the nodes so that every node holding an **even** value comes before every node holding an **odd** value.\n\nThe relative order of the even nodes must stay as it was, and so must the relative order of the odd nodes. Return the head of the rearranged list.",
        [
          { in: `head = ${fmtIntArr(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "The even values 8, 2, 4, 6 move to the front in their original order, followed by the odd values 17, 15, 9." },
          { in: `head = ${fmtIntArr(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "There are no even values, so the list is unchanged." },
          { in: `head = ${fmtIntArr(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "Evens 12, 10 first, then odds 3, 7." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "1 <= Node.val <= 10^5"]),
      hints: [
        "The result is two sublists glued together: the even nodes in order, then the odd nodes in order.",
        "Build both sublists as you walk the original list once, appending each node to the tail of the sublist it belongs to.",
        "Dummy heads for the two sublists avoid special cases; at the end link the even tail to the first odd node and terminate the odd tail.",
      ],
      editorial: explain({
        idea: "A stable partition of a linked list needs no swapping: detach each node and append it to one of two growing lists — evens and odds — then concatenate them.",
        steps: [
          "Create dummy heads `evenHead` and `oddHead`, with tails `e` and `o` starting at them.",
          "For each node of the list, append it to `e` if its value is even, otherwise to `o`, advancing that tail.",
          "Set `o.next = null` (the last odd node may still point into the old list), then `e.next = oddHead.next`.",
          "Return `evenHead.next`.",
        ],
        why: "Nodes are appended in the order they are met, so each sublist preserves its original relative order, and every node lands in exactly one sublist. Joining evens before odds gives exactly the required arrangement.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting to terminate the odd tail creates a cycle when the last node of the original list is even.",
          "If there are no even nodes, `evenHead.next` is the odd list itself — the dummy makes that case free.",
        ],
      }),
      examples: ex.map((a) => ({ input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) })),
      gen: (rng: Rng) => {
        const bias = pick(rng, [0, 0.2, 0.5, 0.8, 1]);
        const top = pick(rng, [20, 1000, 100000]);
        const a = randVals(rng, [1, 3, 10, 40], 1, top).map((v) => {
          const wantEven = rng() < bias;
          if ((v % 2 === 0) === wantEven) return v;
          return v + 1 <= top ? v + 1 : v - 1;
        }).map((v) => Math.max(1, v));
        return { input: fmtIntArr(a), expectedOutput: fmtIntArr(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def divide(head: Optional[ListNode]) -> Optional[ListNode]:
              even_head, odd_head = ListNode(0), ListNode(0)
              e, o = even_head, odd_head
              while head:
                  if head.val % 2 == 0:
                      e.next = head
                      e = head
                  else:
                      o.next = head
                      o = head
                  head = head.next
              o.next = None
              e.next = odd_head.next
              return even_head.next
        `,
        javascript: code`
          var divide = function(head) {
              var evenHead = new ListNode(0), oddHead = new ListNode(0);
              var e = evenHead, o = oddHead;
              for (; head !== null; head = head.next) {
                  if (head.val % 2 === 0) { e.next = head; e = head; }
                  else { o.next = head; o = head; }
              }
              o.next = null;
              e.next = oddHead.next;
              return evenHead.next;
          };
        `,
        typescript: code`
          function divide(head: ListNode | null): ListNode | null {
              var evenHead = new ListNode(0), oddHead = new ListNode(0);
              var e: ListNode = evenHead, o: ListNode = oddHead;
              for (; head !== null; head = head.next) {
                  if (head.val % 2 === 0) { e.next = head; e = head; }
                  else { o.next = head; o = head; }
              }
              o.next = null;
              e.next = oddHead.next;
              return evenHead.next;
          }
        `,
        java: code`
          public static ListNode divide(ListNode head) {
              ListNode evenHead = new ListNode(0), oddHead = new ListNode(0);
              ListNode e = evenHead, o = oddHead;
              for (; head != null; head = head.next) {
                  if (head.val % 2 == 0) { e.next = head; e = head; }
                  else { o.next = head; o = head; }
              }
              o.next = null;
              e.next = oddHead.next;
              return evenHead.next;
          }
        `,
        cpp: code`
          ListNode* divide(ListNode* head) {
              ListNode evenHead(0), oddHead(0);
              ListNode *e = &evenHead, *o = &oddHead;
              for (; head; head = head->next) {
                  if (head->val % 2 == 0) { e->next = head; e = head; }
                  else { o->next = head; o = head; }
              }
              o->next = nullptr;
              e->next = oddHead.next;
              return evenHead.next;
          }
        `,
        c: code`
          struct ListNode* divide(struct ListNode* head) {
              struct ListNode evenHead, oddHead;
              evenHead.next = NULL;
              oddHead.next = NULL;
              struct ListNode *e = &evenHead, *o = &oddHead;
              for (; head; head = head->next) {
                  if (head->val % 2 == 0) { e->next = head; e = head; }
                  else { o->next = head; o = head; }
              }
              o->next = NULL;
              e->next = oddHead.next;
              return evenHead.next;
          }
        `,
        csharp: code`
          public static ListNode Divide(ListNode head)
          {
              ListNode evenHead = new ListNode(0), oddHead = new ListNode(0);
              ListNode e = evenHead, o = oddHead;
              for (; head != null; head = head.next)
              {
                  if (head.val % 2 == 0) { e.next = head; e = head; }
                  else { o.next = head; o = head; }
              }
              o.next = null;
              e.next = oddHead.next;
              return evenHead.next;
          }
        `,
        go: code`
          func divide(head *ListNode) *ListNode {
          	evenHead, oddHead := &ListNode{}, &ListNode{}
          	e, o := evenHead, oddHead
          	for ; head != nil; head = head.Next {
          		if head.Val%2 == 0 {
          			e.Next = head
          			e = head
          		} else {
          			o.Next = head
          			o = head
          		}
          	}
          	o.Next = nil
          	e.Next = oddHead.Next
          	return evenHead.Next
          }
        `,
        kotlin: kt(code`
          fun divide(head: ListNode?): ListNode? {
              val evenHead = ListNode(0)
              val oddHead = ListNode(0)
              var e = evenHead
              var o = oddHead
              var cur = head
              while (cur != null) {
                  if (cur.KVAL % 2 == 0) { e.next = cur; e = cur } else { o.next = cur; o = cur }
                  cur = cur.next
              }
              o.next = null
              e.next = oddHead.next
              return evenHead.next
          }
        `),
        swift: code`
          func divide(_ head: ListNode?) -> ListNode? {
              let evenHead = ListNode(0), oddHead = ListNode(0)
              var e = evenHead, o = oddHead
              var cur = head
              while let c = cur {
                  if c.val % 2 == 0 { e.next = c; e = c } else { o.next = c; o = c }
                  cur = c.next
              }
              o.next = nil
              e.next = oddHead.next
              return evenHead.next
          }
        `,
        rust: code`
          fn divide(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let mut order: Vec<i32> = v.iter().cloned().filter(|x| x % 2 == 0).collect();
              order.extend(v.iter().cloned().filter(|x| x % 2 != 0));
              let mut out: Option<Box<ListNode>> = None;
              for &x in order.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function divide($head) {
              $evenHead = new ListNode(0); $oddHead = new ListNode(0);
              $e = $evenHead; $o = $oddHead;
              for (; $head !== null; $head = $head->next) {
                  if ($head->val % 2 == 0) { $e->next = $head; $e = $head; }
                  else { $o->next = $head; $o = $head; }
              }
              $o->next = null;
              $e->next = $oddHead->next;
              return $evenHead->next;
          }
        `,
        ruby: code`
          def divide(head)
            even_head = ListNode.new(0)
            odd_head = ListNode.new(0)
            e = even_head
            o = odd_head
            until head.nil?
              if head.val.even?
                e.next = head
                e = head
              else
                o.next = head
                o = head
              end
              head = head.next
            end
            o.next = nil
            e.next = odd_head.next
            even_head.next
          end
        `,
      },
    };
  })(),

  // ── Union of Two Linked Lists (GFG) ───────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => [...new Set([...a, ...b])].sort((x, y) => x - y);
    const ex: Array<[number[], number[]]> = [[[9, 6, 4, 2, 3, 8], [1, 2, 8, 6, 2]], [[5, 5, 5], [5]], [[7, 3], [10, 1]]];
    return {
      slug: "union-of-two-linked-lists",
      title: "Union of Two Linked Lists",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Hash Table", "Sorting", "Amazon", "Microsoft", "Flipkart"],
      signature: { funcName: "makeUnion", params: [{ name: "head1", type: "ListNode" as const }, { name: "head2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the heads of two linked lists, `head1` and `head2`. Neither list is sorted, and a value may appear several times in either.\n\nReturn the head of a new linked list holding the **union** of the two lists: every value that appears in at least one of them, each value **exactly once**, in **ascending** order.",
        [
          { in: `head1 = ${fmtIntArr(ex[0][0])}, head2 = ${fmtIntArr(ex[0][1])}`, out: fmtIntArr(ref(...ex[0])), note: "The distinct values of both lists together, sorted." },
          { in: `head1 = ${fmtIntArr(ex[1][0])}, head2 = ${fmtIntArr(ex[1][1])}`, out: fmtIntArr(ref(...ex[1])), note: "Duplicates within and across the lists collapse to one node." },
          { in: `head1 = ${fmtIntArr(ex[2][0])}, head2 = ${fmtIntArr(ex[2][1])}`, out: fmtIntArr(ref(...ex[2])), note: "The lists share nothing, so all four values appear." },
        ],
        ["1 <= number of nodes in each list <= 10^4", "1 <= Node.val <= 10^4"]),
      hints: [
        "The output is fully determined by the *set* of values present — the order and repetitions in the inputs do not matter.",
        "Collect the values of both lists into a set (or a sorted set) to remove duplicates.",
        "Sort the distinct values and build a fresh list from them — or, with values bounded by 10^4, mark them in a boolean array and read it in increasing order.",
      ],
      editorial: explain({
        idea: "The union is just the set of distinct values, so gather them, sort them, and turn the sorted values into a list.",
        steps: [
          "Walk both lists, adding every value to a hash set.",
          "Sort the set's values in ascending order.",
          "Build a new linked list from the sorted values (append behind a dummy head) and return it.",
        ],
        why: "A value is in the union exactly when it occurs in one of the lists, which is exactly when it is in the set; the set holds each value once, and sorting fixes the required order.",
        time: "O((n + m) + u log u) — u distinct values",
        space: "O(u)",
        pitfalls: [
          "Merging the lists first and removing *adjacent* duplicates only works after sorting — the inputs are unsorted.",
          "A value repeated inside a single list must still appear once.",
        ],
      }),
      examples: ex.map(([a, b]) => ({ input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) })),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 15, 100, 10000]);
        const a = randVals(rng, [1, 3, 10, 25], 1, top);
        const b = randVals(rng, [1, 3, 10, 25], 1, top);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def makeUnion(head1: Optional[ListNode], head2: Optional[ListNode]) -> Optional[ListNode]:
              seen = set()
              for h in (head1, head2):
                  while h:
                      seen.add(h.val)
                      h = h.next
              dummy = ListNode(0)
              tail = dummy
              for v in sorted(seen):
                  tail.next = ListNode(v)
                  tail = tail.next
              return dummy.next
        `,
        javascript: code`
          var makeUnion = function(head1, head2) {
              var seen = new Set(), heads = [head1, head2];
              for (var i = 0; i < 2; i++) for (var h = heads[i]; h !== null; h = h.next) seen.add(h.val);
              var vals = Array.from(seen).sort(function (a, b) { return a - b; });
              var dummy = new ListNode(0), tail = dummy;
              for (var j = 0; j < vals.length; j++) { tail.next = new ListNode(vals[j]); tail = tail.next; }
              return dummy.next;
          };
        `,
        typescript: code`
          function makeUnion(head1: ListNode | null, head2: ListNode | null): ListNode | null {
              var seen: { [v: number]: boolean } = {}, vals: number[] = [], heads = [head1, head2];
              for (var i = 0; i < 2; i++) for (var h = heads[i]; h !== null; h = h.next) {
                  if (!seen[h.val]) { seen[h.val] = true; vals.push(h.val); }
              }
              vals.sort(function (a, b) { return a - b; });
              var dummy = new ListNode(0), tail: ListNode = dummy;
              for (var j = 0; j < vals.length; j++) { tail.next = new ListNode(vals[j]); tail = tail.next; }
              return dummy.next;
          }
        `,
        java: code`
          public static ListNode makeUnion(ListNode head1, ListNode head2) {
              TreeSet<Integer> seen = new TreeSet<>();
              for (ListNode h = head1; h != null; h = h.next) seen.add(h.val);
              for (ListNode h = head2; h != null; h = h.next) seen.add(h.val);
              ListNode dummy = new ListNode(0), tail = dummy;
              for (int v : seen) { tail.next = new ListNode(v); tail = tail.next; }
              return dummy.next;
          }
        `,
        cpp: code`
          ListNode* makeUnion(ListNode* head1, ListNode* head2) {
              set<int> seen;
              for (ListNode* h = head1; h; h = h->next) seen.insert(h->val);
              for (ListNode* h = head2; h; h = h->next) seen.insert(h->val);
              ListNode dummy(0);
              ListNode* tail = &dummy;
              for (int v : seen) { tail->next = new ListNode(v); tail = tail->next; }
              return dummy.next;
          }
        `,
        c: code`
          struct ListNode* makeUnion(struct ListNode* head1, struct ListNode* head2) {
              /* Values are at most 10^4: a flag array read upwards is the sorted set. */
              char* seen = (char*)calloc(10001, 1);
              for (struct ListNode* h = head1; h; h = h->next) seen[h->val] = 1;
              for (struct ListNode* h = head2; h; h = h->next) seen[h->val] = 1;
              struct ListNode* head = NULL;
              for (int v = 10000; v >= 0; v--) {
                  if (!seen[v]) continue;
                  struct ListNode* x = (struct ListNode*)malloc(sizeof(struct ListNode));
                  x->val = v;
                  x->next = head;
                  head = x;
              }
              free(seen);
              return head;
          }
        `,
        csharp: code`
          public static ListNode MakeUnion(ListNode head1, ListNode head2)
          {
              var seen = new SortedSet<int>();
              for (var h = head1; h != null; h = h.next) seen.Add(h.val);
              for (var h = head2; h != null; h = h.next) seen.Add(h.val);
              ListNode dummy = new ListNode(0), tail = dummy;
              foreach (int v in seen) { tail.next = new ListNode(v); tail = tail.next; }
              return dummy.next;
          }
        `,
        go: code`
          func makeUnion(head1 *ListNode, head2 *ListNode) *ListNode {
          	seen := map[int]bool{}
          	vals := []int{}
          	for _, h := range []*ListNode{head1, head2} {
          		for ; h != nil; h = h.Next {
          			if !seen[h.Val] {
          				seen[h.Val] = true
          				vals = append(vals, h.Val)
          			}
          		}
          	}
          	sort.Ints(vals)
          	dummy := &ListNode{}
          	tail := dummy
          	for _, v := range vals {
          		tail.Next = &ListNode{Val: v}
          		tail = tail.Next
          	}
          	return dummy.Next
          }
        `,
        kotlin: kt(code`
          fun makeUnion(head1: ListNode?, head2: ListNode?): ListNode? {
              val seen = java.util.TreeSet<Int>()
              for (start in arrayOf(head1, head2)) {
                  var h = start
                  while (h != null) { seen.add(h.KVAL); h = h.next }
              }
              val dummy = ListNode(0)
              var tail = dummy
              for (v in seen) { val n = ListNode(v); tail.next = n; tail = n }
              return dummy.next
          }
        `),
        swift: code`
          func makeUnion(_ head1: ListNode?, _ head2: ListNode?) -> ListNode? {
              var seen = Set<Int>()
              for start in [head1, head2] {
                  var h = start
                  while let n = h { seen.insert(n.val); h = n.next }
              }
              let dummy = ListNode(0)
              var tail = dummy
              for v in seen.sorted() { let n = ListNode(v); tail.next = n; tail = n }
              return dummy.next
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn makeUnion(head1: Option<Box<ListNode>>, head2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut seen: BTreeSet<i32> = BTreeSet::new();
              for start in [&head1, &head2].iter() {
                  let mut cur = *start;
                  while let Some(n) = cur { seen.insert(n.val); cur = &n.next; }
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in seen.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function makeUnion($head1, $head2) {
              $seen = [];
              foreach ([$head1, $head2] as $h) {
                  for (; $h !== null; $h = $h->next) $seen[$h->val] = true;
              }
              $vals = array_keys($seen);
              sort($vals);
              $dummy = new ListNode(0); $tail = $dummy;
              foreach ($vals as $v) { $tail->next = new ListNode($v); $tail = $tail->next; }
              return $dummy->next;
          }
        `,
        ruby: code`
          def makeUnion(head1, head2)
            vals = []
            [head1, head2].each do |h|
              until h.nil?
                vals << h.val
                h = h.next
              end
            end
            dummy = ListNode.new(0)
            tail = dummy
            vals.uniq.sort.each do |v|
              tail.next = ListNode.new(v)
              tail = tail.next
            end
            dummy.next
          end
        `,
      },
    };
  })(),

  // ── Rotate a Linked List (GFG) ────────────────────────────────────
  (() => {
    const ref = (a: number[], k: number) => { const s = k % a.length; return [...a.slice(s), ...a.slice(0, s)]; };
    const ex: Array<[number[], number]> = [[[10, 20, 30, 40, 50], 4], [[2, 4, 7, 8, 9], 3], [[6, 1, 5], 7]];
    return {
      slug: "rotate-a-linked-list",
      title: "Rotate a Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Amazon", "Microsoft", "Accenture"],
      signature: { funcName: "rotate", params: [{ name: "head", type: "ListNode" as const }, { name: "k", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a singly linked list and an integer `k`. **Left-rotate** the list `k` times: one left rotation moves the first node to the end of the list.\n\nReturn the head of the rotated list. Note that `k` may be larger than the length of the list.",
        [
          { in: `head = ${fmtIntArr(ex[0][0])}, k = ${ex[0][1]}`, out: fmtIntArr(ref(...ex[0])), note: "Four left rotations move 10, 20, 30 and 40 to the back, one after another." },
          { in: `head = ${fmtIntArr(ex[1][0])}, k = ${ex[1][1]}`, out: fmtIntArr(ref(...ex[1])), note: "The first three nodes move behind 9 in their order." },
          { in: `head = ${fmtIntArr(ex[2][0])}, k = ${ex[2][1]}`, out: fmtIntArr(ref(...ex[2])), note: "Every 3 rotations restore a 3-node list, so 7 rotations act like 1." },
        ],
        ["The number of nodes in the list is in the range [1, 10^5]", "0 <= k <= 10^9", "0 <= Node.val <= 10^9"]),
      hints: [
        "Rotating a list of length `n` exactly `n` times gives back the same list — only `k mod n` matters.",
        "After `s = k mod n` left rotations, the old node at index `s` is the new head, and the old last node is followed by the old head.",
        "Find the length and the tail in one pass, close the list into a ring (`tail.next = head`), then walk `s` steps from the tail and cut the ring there.",
      ],
      editorial: explain({
        idea: "A left rotation by `s = k mod n` splits the list after its first `s` nodes and swaps the two parts. With the tail in hand that is a constant number of relinks.",
        steps: [
          "Walk the list once to find its length `n` and its last node `tail`.",
          "Let `s = k mod n`; if `s == 0`, return `head` unchanged.",
          "Find `newTail`, the node at index `s - 1`; the new head is `newTail.next`.",
          "Link `tail.next = head`, cut `newTail.next = null`, and return the new head.",
        ],
        why: "After `s` left rotations the order is `a[s], …, a[n-1], a[0], …, a[s-1]`. The relinks produce exactly that: the run from `a[s]` to the old tail, then the old head, ending at `a[s-1]`, whose link is cleared.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Simulating `k` single rotations is far too slow for `k` up to 10^9 — reduce by `n` first.",
          "When `k` is a multiple of `n` nothing moves; without the early return the cut would land on the tail and break the list.",
          "This is a *left* rotation (LeetCode's Rotate List rotates right).",
        ],
      }),
      examples: ex.map(([a, k]) => ({ input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) })),
      gen: (rng: Rng) => {
        const a = randVals(rng, [1, 3, 10, 40], 0, pick(rng, [9, 1000, 1000000000]));
        const k = pick(rng, [0, 1, a.length, ri(rng, 0, 2 * a.length + 1), ri(rng, 0, 1000000000)]);
        return { input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def rotate(head: Optional[ListNode], k: int) -> Optional[ListNode]:
              n, tail = 1, head
              while tail.next:
                  tail = tail.next
                  n += 1
              s = k % n
              if s == 0:
                  return head
              new_tail = head
              for _ in range(s - 1):
                  new_tail = new_tail.next
              new_head = new_tail.next
              new_tail.next = None
              tail.next = head
              return new_head
        `,
        javascript: code`
          var rotate = function(head, k) {
              var n = 1, tail = head;
              while (tail.next !== null) { tail = tail.next; n++; }
              var s = k % n;
              if (s === 0) return head;
              var newTail = head;
              for (var i = 1; i < s; i++) newTail = newTail.next;
              var newHead = newTail.next;
              newTail.next = null;
              tail.next = head;
              return newHead;
          };
        `,
        typescript: code`
          function rotate(head: ListNode | null, k: number): ListNode | null {
              var n = 1, tail: ListNode = head;
              while (tail.next !== null) { tail = tail.next; n++; }
              var s = k % n;
              if (s === 0) return head;
              var newTail: ListNode = head;
              for (var i = 1; i < s; i++) newTail = newTail.next;
              var newHead = newTail.next;
              newTail.next = null;
              tail.next = head;
              return newHead;
          }
        `,
        java: code`
          public static ListNode rotate(ListNode head, int k) {
              int n = 1;
              ListNode tail = head;
              while (tail.next != null) { tail = tail.next; n++; }
              int s = k % n;
              if (s == 0) return head;
              ListNode newTail = head;
              for (int i = 1; i < s; i++) newTail = newTail.next;
              ListNode newHead = newTail.next;
              newTail.next = null;
              tail.next = head;
              return newHead;
          }
        `,
        cpp: code`
          ListNode* rotate(ListNode* head, int k) {
              int n = 1;
              ListNode* tail = head;
              while (tail->next) { tail = tail->next; n++; }
              int s = k % n;
              if (s == 0) return head;
              ListNode* newTail = head;
              for (int i = 1; i < s; i++) newTail = newTail->next;
              ListNode* newHead = newTail->next;
              newTail->next = nullptr;
              tail->next = head;
              return newHead;
          }
        `,
        c: code`
          struct ListNode* rotate(struct ListNode* head, int k) {
              int n = 1;
              struct ListNode* tail = head;
              while (tail->next) { tail = tail->next; n++; }
              int s = k % n;
              if (s == 0) return head;
              struct ListNode* newTail = head;
              for (int i = 1; i < s; i++) newTail = newTail->next;
              struct ListNode* newHead = newTail->next;
              newTail->next = NULL;
              tail->next = head;
              return newHead;
          }
        `,
        csharp: code`
          public static ListNode Rotate(ListNode head, int k)
          {
              int n = 1;
              ListNode tail = head;
              while (tail.next != null) { tail = tail.next; n++; }
              int s = k % n;
              if (s == 0) return head;
              ListNode newTail = head;
              for (int i = 1; i < s; i++) newTail = newTail.next;
              ListNode newHead = newTail.next;
              newTail.next = null;
              tail.next = head;
              return newHead;
          }
        `,
        go: code`
          func rotate(head *ListNode, k int) *ListNode {
          	n, tail := 1, head
          	for tail.Next != nil {
          		tail = tail.Next
          		n++
          	}
          	s := k % n
          	if s == 0 {
          		return head
          	}
          	newTail := head
          	for i := 1; i < s; i++ {
          		newTail = newTail.Next
          	}
          	newHead := newTail.Next
          	newTail.Next = nil
          	tail.Next = head
          	return newHead
          }
        `,
        kotlin: kt(code`
          fun rotate(head: ListNode?, k: Int): ListNode? {
              var n = 1
              var tail = head!!
              while (tail.next != null) { tail = tail.next!!; n++ }
              val s = k % n
              if (s == 0) return head
              var newTail: ListNode = head
              for (i in 1 until s) newTail = newTail.next!!
              val newHead = newTail.next
              newTail.next = null
              tail.next = head
              return newHead
          }
        `),
        swift: code`
          func rotate(_ head: ListNode?, _ k: Int) -> ListNode? {
              guard let h = head else { return nil }
              var n = 1
              var tail = h
              while let nx = tail.next { tail = nx; n += 1 }
              let s = k % n
              if s == 0 { return h }
              var newTail = h
              for _ in 1..<s { newTail = newTail.next! }
              let newHead = newTail.next
              newTail.next = nil
              tail.next = h
              return newHead
          }
        `,
        rust: code`
          fn rotate(head: Option<Box<ListNode>>, k: i32) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let s = (k as usize) % v.len();
              v.rotate_left(s);
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function rotate($head, $k) {
              $n = 1; $tail = $head;
              while ($tail->next !== null) { $tail = $tail->next; $n++; }
              $s = $k % $n;
              if ($s == 0) return $head;
              $newTail = $head;
              for ($i = 1; $i < $s; $i++) $newTail = $newTail->next;
              $newHead = $newTail->next;
              $newTail->next = null;
              $tail->next = $head;
              return $newHead;
          }
        `,
        ruby: code`
          def rotate(head, k)
            n = 1
            tail = head
            until tail.next.nil?
              tail = tail.next
              n += 1
            end
            s = k % n
            return head if s == 0
            new_tail = head
            (s - 1).times { new_tail = new_tail.next }
            new_head = new_tail.next
            new_tail.next = nil
            tail.next = head
            new_head
          end
        `,
      },
    };
  })(),

  // ── Merge Two Sorted Linked Lists in Reverse Order (GFG) ──────────
  (() => {
    const ref = (a: number[], b: number[]) => [...a, ...b].sort((x, y) => y - x);
    const ex: Array<[number[], number[]]> = [[[5, 10, 15, 40], [2, 3, 20]], [[1, 1], [2, 4]], [[], [3, 8, 9]]];
    return {
      slug: "merge-two-sorted-linked-lists-in-reverse-order",
      title: "Merge Two Sorted Linked Lists in Reverse Order",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Two Pointers", "Sorting", "Microsoft", "Amazon"],
      signature: { funcName: "mergeResult", params: [{ name: "node1", type: "ListNode" as const }, { name: "node2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the heads `node1` and `node2` of two linked lists, each sorted in **non-decreasing** order. Merge them into one list sorted in **non-increasing** order (largest value first) and return its head.\n\nReuse the existing nodes; either list may be empty.",
        [
          { in: `node1 = ${fmtIntArr(ex[0][0])}, node2 = ${fmtIntArr(ex[0][1])}`, out: fmtIntArr(ref(...ex[0])), note: "All seven values, from the largest down." },
          { in: `node1 = ${fmtIntArr(ex[1][0])}, node2 = ${fmtIntArr(ex[1][1])}`, out: fmtIntArr(ref(...ex[1])), note: "Equal values both stay." },
          { in: `node1 = ${fmtIntArr(ex[2][0])}, node2 = ${fmtIntArr(ex[2][1])}`, out: fmtIntArr(ref(...ex[2])), note: "With one list empty the answer is the other list reversed." },
        ],
        ["0 <= number of nodes in each list <= 10^4", "The two lists hold at least one node in total", "0 <= Node.val <= 10^5", "Both lists are sorted in non-decreasing order"]),
      hints: [
        "An ordinary merge produces the nodes smallest first — exactly the reverse of what is wanted.",
        "Instead of appending each chosen node at the tail of the result, insert it at the **front**.",
        "Repeatedly take the smaller head of the two lists, detach it, and push it onto the front of the result; when one list runs out, push the rest of the other the same way.",
      ],
      editorial: explain({
        idea: "Run the usual two-pointer merge, which visits the nodes in ascending order, but prepend each visited node to the result. Prepending reverses the order, so the result comes out descending — in one pass, without a separate reversal.",
        steps: [
          "Set `result = null`.",
          "While either list has nodes: pick `node1`'s head if `node2` is empty or `node1.val <= node2.val`, otherwise `node2`'s head; advance that list.",
          "Point the picked node at `result` and make it the new `result`.",
          "Return `result`.",
        ],
        why: "The merge visits all nodes in non-decreasing order, and pushing each onto the front of a list stores them in the reverse of the visiting order — non-increasing.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "Save the picked node's `next` before relinking it, or the rest of its list is lost.",
          "Do not stop when one list ends: its partner's remaining nodes must still be pushed (they are the largest).",
        ],
      }),
      examples: ex.map(([a, b]) => ({ input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) })),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 100, 100000]);
        const sizes = [0, 1, 4, 12, 20];
        const mk = () => Array.from({ length: ri(rng, 0, pick(rng, sizes)) }, () => ri(rng, 0, top)).sort((x, y) => x - y);
        let a = mk(), b = mk();
        if (a.length + b.length === 0) a = [ri(rng, 0, top)];
        if (rng() < 0.5) [a, b] = [b, a];
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def mergeResult(node1: Optional[ListNode], node2: Optional[ListNode]) -> Optional[ListNode]:
              result = None
              while node1 or node2:
                  if node2 is None or (node1 is not None and node1.val <= node2.val):
                      pick, node1 = node1, node1.next
                  else:
                      pick, node2 = node2, node2.next
                  pick.next = result
                  result = pick
              return result
        `,
        javascript: code`
          var mergeResult = function(node1, node2) {
              var result = null, pick;
              while (node1 !== null || node2 !== null) {
                  if (node2 === null || (node1 !== null && node1.val <= node2.val)) { pick = node1; node1 = node1.next; }
                  else { pick = node2; node2 = node2.next; }
                  pick.next = result;
                  result = pick;
              }
              return result;
          };
        `,
        typescript: code`
          function mergeResult(node1: ListNode | null, node2: ListNode | null): ListNode | null {
              var result: ListNode | null = null, pick: ListNode;
              while (node1 !== null || node2 !== null) {
                  if (node2 === null || (node1 !== null && node1.val <= node2.val)) { pick = node1; node1 = node1.next; }
                  else { pick = node2; node2 = node2.next; }
                  pick.next = result;
                  result = pick;
              }
              return result;
          }
        `,
        java: code`
          public static ListNode mergeResult(ListNode node1, ListNode node2) {
              ListNode result = null, pick;
              while (node1 != null || node2 != null) {
                  if (node2 == null || (node1 != null && node1.val <= node2.val)) { pick = node1; node1 = node1.next; }
                  else { pick = node2; node2 = node2.next; }
                  pick.next = result;
                  result = pick;
              }
              return result;
          }
        `,
        cpp: code`
          ListNode* mergeResult(ListNode* node1, ListNode* node2) {
              ListNode *result = nullptr, *pick;
              while (node1 || node2) {
                  if (!node2 || (node1 && node1->val <= node2->val)) { pick = node1; node1 = node1->next; }
                  else { pick = node2; node2 = node2->next; }
                  pick->next = result;
                  result = pick;
              }
              return result;
          }
        `,
        c: code`
          struct ListNode* mergeResult(struct ListNode* node1, struct ListNode* node2) {
              struct ListNode *result = NULL, *pick;
              while (node1 || node2) {
                  if (!node2 || (node1 && node1->val <= node2->val)) { pick = node1; node1 = node1->next; }
                  else { pick = node2; node2 = node2->next; }
                  pick->next = result;
                  result = pick;
              }
              return result;
          }
        `,
        csharp: code`
          public static ListNode MergeResult(ListNode node1, ListNode node2)
          {
              ListNode result = null, pick;
              while (node1 != null || node2 != null)
              {
                  if (node2 == null || (node1 != null && node1.val <= node2.val)) { pick = node1; node1 = node1.next; }
                  else { pick = node2; node2 = node2.next; }
                  pick.next = result;
                  result = pick;
              }
              return result;
          }
        `,
        go: code`
          func mergeResult(node1 *ListNode, node2 *ListNode) *ListNode {
          	var result *ListNode
          	for node1 != nil || node2 != nil {
          		var pick *ListNode
          		if node2 == nil || (node1 != nil && node1.Val <= node2.Val) {
          			pick, node1 = node1, node1.Next
          		} else {
          			pick, node2 = node2, node2.Next
          		}
          		pick.Next = result
          		result = pick
          	}
          	return result
          }
        `,
        kotlin: kt(code`
          fun mergeResult(node1: ListNode?, node2: ListNode?): ListNode? {
              var a = node1
              var b = node2
              var result: ListNode? = null
              while (a != null || b != null) {
                  val pick: ListNode
                  if (b == null || (a != null && a.KVAL <= b.KVAL)) { pick = a!!; a = pick.next }
                  else { pick = b!!; b = pick.next }
                  pick.next = result
                  result = pick
              }
              return result
          }
        `),
        swift: code`
          func mergeResult(_ node1: ListNode?, _ node2: ListNode?) -> ListNode? {
              var a = node1, b = node2
              var result: ListNode? = nil
              while a != nil || b != nil {
                  let pick: ListNode
                  if b == nil || (a != nil && a!.val <= b!.val) { pick = a!; a = pick.next }
                  else { pick = b!; b = pick.next }
                  pick.next = result
                  result = pick
              }
              return result
          }
        `,
        rust: code`
          fn mergeResult(node1: Option<Box<ListNode>>, node2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              let mut a: Vec<i32> = Vec::new();
              let mut b: Vec<i32> = Vec::new();
              let mut cur = &node1;
              while let Some(n) = cur { a.push(n.val); cur = &n.next; }
              cur = &node2;
              while let Some(n) = cur { b.push(n.val); cur = &n.next; }
              // Merge ascending, pushing each value onto the front of the result.
              let (mut i, mut j) = (0, 0);
              let mut out: Option<Box<ListNode>> = None;
              while i < a.len() || j < b.len() {
                  let x = if j == b.len() || (i < a.len() && a[i] <= b[j]) { i += 1; a[i - 1] } else { j += 1; b[j - 1] };
                  let mut n = ListNode::new(x);
                  n.next = out;
                  out = Some(Box::new(n));
              }
              out
          }
        `,
        php: code`
          function mergeResult($node1, $node2) {
              $result = null;
              while ($node1 !== null || $node2 !== null) {
                  if ($node2 === null || ($node1 !== null && $node1->val <= $node2->val)) { $pick = $node1; $node1 = $node1->next; }
                  else { $pick = $node2; $node2 = $node2->next; }
                  $pick->next = $result;
                  $result = $pick;
              }
              return $result;
          }
        `,
        ruby: code`
          def mergeResult(node1, node2)
            result = nil
            until node1.nil? && node2.nil?
              if node2.nil? || (!node1.nil? && node1.val <= node2.val)
                pick = node1
                node1 = node1.next
              else
                pick = node2
                node2 = node2.next
              end
              pick.next = result
              result = pick
            end
            result
          end
        `,
      },
    };
  })(),

  // ── Merge k Sorted Lists (LC 23) ──────────────────────────────────
  (() => {
    const ref = (ls: number[][]) => ls.reduce<number[]>((acc, l) => acc.concat(l), []).sort((x, y) => x - y);
    const ex: number[][][] = [[[1, 4, 9], [2, 3, 8], [5, 6]], [], [[], [7], []]];
    return {
      slug: "merge-k-sorted-lists",
      title: "Merge k Sorted Lists",
      difficulty: "HARD" as const,
      tags: ["Linked List", "Divide and Conquer", "Heap (Priority Queue)", "Amazon", "Google", "Meta", "Microsoft"],
      signature: { funcName: "mergeKLists", params: [{ name: "lists", type: "ListNode[]" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given an array `lists` of `k` linked lists, each sorted in ascending order. Merge all of them into a single sorted linked list and return its head.",
        [
          { in: `lists = ${JSON.stringify(ex[0])}`, out: fmtIntArr(ref(ex[0])), note: "The three sorted lists interleave into one sorted list of eight nodes." },
          { in: `lists = ${JSON.stringify(ex[1])}`, out: fmtIntArr(ref(ex[1])), note: "There are no lists at all, so the result is empty." },
          { in: `lists = ${JSON.stringify(ex[2])}`, out: fmtIntArr(ref(ex[2])), note: "Empty lists contribute nothing." },
        ],
        ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500", "-10^4 <= lists[i][j] <= 10^4", "lists[i] is sorted in ascending order", "The sum of lists[i].length does not exceed 10^4"]),
      hints: [
        "Merging two sorted lists is a standard linear-time step. How can you build a k-way merge out of it?",
        "Merging the lists one after another into a growing result costs `O(k * N)` in the worst case — the early nodes get copied over and over.",
        "Merge in rounds: pair list 0 with 1, 2 with 3, … then merge the results in pairs again. Every node takes part in only `log k` merges. (A min-heap of the `k` current heads works too.)",
      ],
      editorial: explain({
        idea: "Divide and conquer: merging lists pairwise in rounds halves the number of lists each round, so after `⌈log2 k⌉` rounds one list remains, and each node is touched once per round.",
        steps: [
          "If `lists` is empty, return an empty list.",
          "With `step = 1`, merge `lists[i]` and `lists[i + step]` into `lists[i]` for `i = 0, 2·step, 4·step, …` while `i + step < k`.",
          "Double `step` and repeat while `step < k`.",
          "Return `lists[0]`.",
          "Merging two lists: keep a dummy head and a tail; repeatedly attach the smaller of the two current heads, then attach whatever remains.",
        ],
        why: "Each round merges disjoint pairs, so after the round with step `s` every `lists[i]` with `i` a multiple of `2s` holds the merge of lists `i … i + 2s - 1`. When `step` reaches `k`, `lists[0]` holds all of them, in order because each two-list merge preserves sortedness.",
        time: "O(N log k) — N nodes in total",
        space: "O(1) (the merges relink existing nodes)",
        pitfalls: [
          "Empty lists (null heads) inside `lists`, and `lists` itself empty, are both allowed.",
          "Merging sequentially into one accumulator is correct but quadratic in `k` on adversarial inputs.",
          "A heap-based merge must not compare node objects directly in languages that cannot order them — store `(value, index)` pairs.",
        ],
      }),
      examples: ex.map((ls) => ({ input: JSON.stringify(ls), expectedOutput: fmtIntArr(ref(ls)) })),
      gen: (rng: Rng) => {
        const k = ri(rng, 0, pick(rng, [0, 1, 3, 6, 10]));
        const top = pick(rng, [5, 100, 10000]);
        const ls = Array.from({ length: k }, () =>
          Array.from({ length: ri(rng, 0, pick(rng, [0, 2, 5, 8])) }, () => ri(rng, -top, top)).sort((x, y) => x - y));
        return { input: JSON.stringify(ls), expectedOutput: fmtIntArr(ref(ls)) };
      },
      solutions: {
        python: code`
          from typing import List, Optional

          def merge_two(a, b):
              dummy = tail = ListNode(0)
              while a and b:
                  if a.val <= b.val:
                      tail.next, a = a, a.next
                  else:
                      tail.next, b = b, b.next
                  tail = tail.next
              tail.next = a if a else b
              return dummy.next

          def mergeKLists(lists: List[Optional[ListNode]]) -> Optional[ListNode]:
              if not lists:
                  return None
              k, step = len(lists), 1
              while step < k:
                  for i in range(0, k - step, 2 * step):
                      lists[i] = merge_two(lists[i], lists[i + step])
                  step *= 2
              return lists[0]
        `,
        javascript: code`
          var mergeTwo = function(a, b) {
              var dummy = new ListNode(0), tail = dummy;
              while (a !== null && b !== null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a !== null ? a : b;
              return dummy.next;
          };

          var mergeKLists = function(lists) {
              if (lists.length === 0) return null;
              for (var step = 1; step < lists.length; step *= 2)
                  for (var i = 0; i + step < lists.length; i += 2 * step) lists[i] = mergeTwo(lists[i], lists[i + step]);
              return lists[0];
          };
        `,
        typescript: code`
          function mergeTwo(a: ListNode | null, b: ListNode | null): ListNode | null {
              var dummy = new ListNode(0), tail: ListNode = dummy;
              while (a !== null && b !== null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a !== null ? a : b;
              return dummy.next;
          }

          function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
              if (lists.length === 0) return null;
              for (var step = 1; step < lists.length; step *= 2)
                  for (var i = 0; i + step < lists.length; i += 2 * step) lists[i] = mergeTwo(lists[i], lists[i + step]);
              return lists[0];
          }
        `,
        java: code`
          static ListNode mergeTwo(ListNode a, ListNode b) {
              ListNode dummy = new ListNode(0), tail = dummy;
              while (a != null && b != null) {
                  if (a.val <= b.val) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a != null ? a : b;
              return dummy.next;
          }

          public static ListNode mergeKLists(ListNode[] lists) {
              if (lists.length == 0) return null;
              for (int step = 1; step < lists.length; step *= 2)
                  for (int i = 0; i + step < lists.length; i += 2 * step) lists[i] = mergeTwo(lists[i], lists[i + step]);
              return lists[0];
          }
        `,
        cpp: code`
          ListNode* mergeTwo(ListNode* a, ListNode* b) {
              ListNode dummy(0);
              ListNode* tail = &dummy;
              while (a && b) {
                  if (a->val <= b->val) { tail->next = a; a = a->next; } else { tail->next = b; b = b->next; }
                  tail = tail->next;
              }
              tail->next = a ? a : b;
              return dummy.next;
          }

          ListNode* mergeKLists(vector<ListNode*>& lists) {
              if (lists.empty()) return nullptr;
              int k = lists.size();
              for (int step = 1; step < k; step *= 2)
                  for (int i = 0; i + step < k; i += 2 * step) lists[i] = mergeTwo(lists[i], lists[i + step]);
              return lists[0];
          }
        `,
        c: code`
          static struct ListNode* mergeTwo(struct ListNode* a, struct ListNode* b) {
              struct ListNode dummy;
              struct ListNode* tail = &dummy;
              while (a && b) {
                  if (a->val <= b->val) { tail->next = a; a = a->next; } else { tail->next = b; b = b->next; }
                  tail = tail->next;
              }
              tail->next = a ? a : b;
              return dummy.next;
          }

          struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
              if (listsSize == 0) return NULL;
              for (int step = 1; step < listsSize; step *= 2)
                  for (int i = 0; i + step < listsSize; i += 2 * step) lists[i] = mergeTwo(lists[i], lists[i + step]);
              return lists[0];
          }
        `,
        csharp: code`
          static ListNode MergeTwo(ListNode a, ListNode b)
          {
              ListNode dummy = new ListNode(0), tail = dummy;
              while (a != null && b != null)
              {
                  if (a.val <= b.val) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
                  tail = tail.next;
              }
              tail.next = a ?? b;
              return dummy.next;
          }

          public static ListNode MergeKLists(ListNode[] lists)
          {
              if (lists.Length == 0) return null;
              for (int step = 1; step < lists.Length; step *= 2)
                  for (int i = 0; i + step < lists.Length; i += 2 * step) lists[i] = MergeTwo(lists[i], lists[i + step]);
              return lists[0];
          }
        `,
        go: code`
          func mergeTwo(a, b *ListNode) *ListNode {
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

          func mergeKLists(lists []*ListNode) *ListNode {
          	if len(lists) == 0 {
          		return nil
          	}
          	for step := 1; step < len(lists); step *= 2 {
          		for i := 0; i+step < len(lists); i += 2 * step {
          			lists[i] = mergeTwo(lists[i], lists[i+step])
          		}
          	}
          	return lists[0]
          }
        `,
        kotlin: kt(code`
          fun mergeTwo(a0: ListNode?, b0: ListNode?): ListNode? {
              var a = a0
              var b = b0
              val dummy = ListNode(0)
              var tail = dummy
              while (a != null && b != null) {
                  if (a.KVAL <= b.KVAL) { tail.next = a; tail = a; a = a.next } else { tail.next = b; tail = b; b = b.next }
              }
              tail.next = a ?: b
              return dummy.next
          }

          fun mergeKLists(lists: Array<ListNode?>): ListNode? {
              if (lists.isEmpty()) return null
              var step = 1
              while (step < lists.size) {
                  var i = 0
                  while (i + step < lists.size) { lists[i] = mergeTwo(lists[i], lists[i + step]); i += 2 * step }
                  step *= 2
              }
              return lists[0]
          }
        `),
        swift: code`
          func mergeTwo(_ a0: ListNode?, _ b0: ListNode?) -> ListNode? {
              var a = a0, b = b0
              let dummy = ListNode(0)
              var tail = dummy
              while let x = a, let y = b {
                  if x.val <= y.val { tail.next = x; tail = x; a = x.next } else { tail.next = y; tail = y; b = y.next }
              }
              tail.next = a ?? b
              return dummy.next
          }

          func mergeKLists(_ lists0: [ListNode?]) -> ListNode? {
              var lists = lists0
              if lists.isEmpty { return nil }
              var step = 1
              while step < lists.count {
                  var i = 0
                  while i + step < lists.count { lists[i] = mergeTwo(lists[i], lists[i + step]); i += 2 * step }
                  step *= 2
              }
              return lists[0]
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn mergeKLists(lists: Vec<Option<Box<ListNode>>>) -> Option<Box<ListNode>> {
              // Read each list's values, then k-way merge them with a min-heap of (value, list, position).
              let mut vals: Vec<Vec<i32>> = Vec::new();
              for l in lists.iter() {
                  let mut v: Vec<i32> = Vec::new();
                  let mut cur = l;
                  while let Some(n) = cur { v.push(n.val); cur = &n.next; }
                  vals.push(v);
              }
              let mut heap = BinaryHeap::new();
              for (i, v) in vals.iter().enumerate() { if !v.is_empty() { heap.push(Reverse((v[0], i, 0usize))); } }
              let mut merged: Vec<i32> = Vec::new();
              while let Some(Reverse((x, i, j))) = heap.pop() {
                  merged.push(x);
                  if j + 1 < vals[i].len() { heap.push(Reverse((vals[i][j + 1], i, j + 1))); }
              }
              let mut out: Option<Box<ListNode>> = None;
              for &x in merged.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function mergeTwo($a, $b) {
              $dummy = new ListNode(0); $tail = $dummy;
              while ($a !== null && $b !== null) {
                  if ($a->val <= $b->val) { $tail->next = $a; $a = $a->next; } else { $tail->next = $b; $b = $b->next; }
                  $tail = $tail->next;
              }
              $tail->next = $a !== null ? $a : $b;
              return $dummy->next;
          }

          function mergeKLists($lists) {
              $k = count($lists);
              if ($k == 0) return null;
              for ($step = 1; $step < $k; $step *= 2)
                  for ($i = 0; $i + $step < $k; $i += 2 * $step) $lists[$i] = mergeTwo($lists[$i], $lists[$i + $step]);
              return $lists[0];
          }
        `,
        ruby: code`
          def merge_two(a, b)
            dummy = ListNode.new(0)
            tail = dummy
            while !a.nil? && !b.nil?
              if a.val <= b.val
                tail.next = a
                a = a.next
              else
                tail.next = b
                b = b.next
              end
              tail = tail.next
            end
            tail.next = a.nil? ? b : a
            dummy.next
          end

          def mergeKLists(lists)
            return nil if lists.empty?
            k = lists.length
            step = 1
            while step < k
              i = 0
              while i + step < k
                lists[i] = merge_two(lists[i], lists[i + step])
                i += 2 * step
              end
              step *= 2
            end
            lists[0]
          end
        `,
      },
    };
  })(),


  // ── Reverse Nodes in k-Group (LC 25) ──────────────────────────────
  (() => {
    const ref = (a: number[], k: number) => {
      const out: number[] = [];
      for (let i = 0; i < a.length; i += k) {
        const part = a.slice(i, i + k);
        out.push(...(part.length === k ? part.reverse() : part));
      }
      return out;
    };
    const ex: Array<[number[], number]> = [[[1, 2, 3, 4, 5, 6, 7, 8], 3], [[4, 9, 2], 1], [[5, 6, 7, 8], 4]];
    return {
      slug: "reverse-nodes-in-k-group",
      title: "Reverse Nodes in k-Group",
      difficulty: "HARD" as const,
      tags: ["Linked List", "Recursion", "Amazon", "Microsoft", "Meta", "Google"],
      signature: { funcName: "reverseKGroup", params: [{ name: "head", type: "ListNode" as const }, { name: "k", type: "int" as const }], returns: "ListNode" as const },
      description: describe(
        "You are given the `head` of a linked list and a positive integer `k`. Split the list, from the front, into consecutive blocks of `k` nodes and reverse the nodes inside every **complete** block. If the number of nodes is not a multiple of `k`, the nodes left over at the end stay in their original order.\n\nOnly the links may change — not the values stored in the nodes. Return the head of the modified list.",
        [
          { in: `head = ${fmtIntArr(ex[0][0])}, k = ${ex[0][1]}`, out: fmtIntArr(ref(...ex[0])), note: "The blocks [1,2,3] and [4,5,6] are reversed; the last two nodes do not form a full block and keep their order." },
          { in: `head = ${fmtIntArr(ex[1][0])}, k = ${ex[1][1]}`, out: fmtIntArr(ref(...ex[1])), note: "Blocks of one node are unchanged by reversal." },
          { in: `head = ${fmtIntArr(ex[2][0])}, k = ${ex[2][1]}`, out: fmtIntArr(ref(...ex[2])), note: "With k equal to the length, the whole list is reversed." },
        ],
        ["The number of nodes in the list is n", "1 <= k <= n <= 5000", "0 <= Node.val <= 1000"],
        "Can you solve it using only O(1) extra memory?"),
      hints: [
        "Before reversing a block, make sure it is complete: look `k` nodes ahead from the node before the block.",
        "Reversing a block in place needs three facts: the node before it, its first node, and the node right after it.",
        "Start the reversal with `prev` set to the node after the block, so the reversed block is already attached to the rest; then hook the node before the block to the block's old last node, and continue from the block's old first node, now its last.",
      ],
      editorial: explain({
        idea: "Process the list block by block with a dummy node in front. For each block, find its `k`-th node; if it does not exist, stop. Otherwise reverse exactly the nodes of the block in place and splice the block back between its neighbours.",
        steps: [
          "Create `dummy` before `head`; `groupPrev = dummy`.",
          "Walk `k` steps from `groupPrev` to find `kth`. If the walk falls off the list, return `dummy.next`.",
          "Let `groupNext = kth.next`. Reverse the block: `prev = groupNext`, `cur = groupPrev.next`; while `cur != groupNext`, point `cur` at `prev` and step forward.",
          "The block's old first node is now its last: remember it, set `groupPrev.next = kth`, and make the old first node the new `groupPrev`. Repeat.",
        ],
        why: "Each reversal touches only the `k` nodes of one complete block and leaves it linked to `groupNext`, so the rest of the list stays attached; relinking `groupPrev` to `kth` (the block's new first node) connects it to what came before. An incomplete tail is detected before anything changes, so it keeps its order.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Reversing the final partial block — check that `k` nodes exist first.",
          "Losing the rest of the list: reverse into `groupNext`, not into `null`.",
          "A recursive solution is also accepted on LeetCode, but uses O(n / k) stack.",
        ],
      }),
      examples: ex.map(([a, k]) => ({ input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) })),
      gen: (rng: Rng) => {
        const a = randVals(rng, [1, 4, 10, 25, 40], 0, pick(rng, [9, 1000]));
        const k = rng() < 0.15 ? a.length : ri(rng, 1, Math.min(a.length, pick(rng, [2, 3, 5, 40])));
        return { input: `${fmtIntArr(a)}\n${k}`, expectedOutput: fmtIntArr(ref(a, k)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def reverseKGroup(head: Optional[ListNode], k: int) -> Optional[ListNode]:
              dummy = ListNode(0, head)
              group_prev = dummy
              while True:
                  kth = group_prev
                  for _ in range(k):
                      kth = kth.next
                      if kth is None:
                          return dummy.next
                  group_next = kth.next
                  prev, cur = group_next, group_prev.next
                  while cur is not group_next:
                      cur.next, prev, cur = prev, cur, cur.next
                  first = group_prev.next
                  group_prev.next = kth
                  group_prev = first
        `,
        javascript: code`
          var reverseKGroup = function(head, k) {
              var dummy = new ListNode(0, head), groupPrev = dummy;
              for (;;) {
                  var kth = groupPrev;
                  for (var i = 0; i < k && kth !== null; i++) kth = kth.next;
                  if (kth === null) return dummy.next;
                  var groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
                  while (cur !== groupNext) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
                  var first = groupPrev.next;
                  groupPrev.next = kth;
                  groupPrev = first;
              }
          };
        `,
        typescript: code`
          function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
              var dummy = new ListNode(0, head), groupPrev: ListNode = dummy;
              for (;;) {
                  var kth: ListNode | null = groupPrev;
                  for (var i = 0; i < k && kth !== null; i++) kth = kth.next;
                  if (kth === null) return dummy.next;
                  var groupNext = kth.next, prev = groupNext, cur: ListNode = groupPrev.next;
                  while (cur !== groupNext) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
                  var first: ListNode = groupPrev.next;
                  groupPrev.next = kth;
                  groupPrev = first;
              }
          }
        `,
        java: code`
          public static ListNode reverseKGroup(ListNode head, int k) {
              ListNode dummy = new ListNode(0, head), groupPrev = dummy;
              while (true) {
                  ListNode kth = groupPrev;
                  for (int i = 0; i < k && kth != null; i++) kth = kth.next;
                  if (kth == null) return dummy.next;
                  ListNode groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
                  while (cur != groupNext) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
                  ListNode first = groupPrev.next;
                  groupPrev.next = kth;
                  groupPrev = first;
              }
          }
        `,
        cpp: code`
          ListNode* reverseKGroup(ListNode* head, int k) {
              ListNode dummy(0, head);
              ListNode* groupPrev = &dummy;
              while (true) {
                  ListNode* kth = groupPrev;
                  for (int i = 0; i < k && kth; i++) kth = kth->next;
                  if (!kth) return dummy.next;
                  ListNode *groupNext = kth->next, *prev = groupNext, *cur = groupPrev->next;
                  while (cur != groupNext) { ListNode* nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
                  ListNode* first = groupPrev->next;
                  groupPrev->next = kth;
                  groupPrev = first;
              }
          }
        `,
        c: code`
          struct ListNode* reverseKGroup(struct ListNode* head, int k) {
              struct ListNode dummy;
              dummy.next = head;
              struct ListNode* groupPrev = &dummy;
              while (1) {
                  struct ListNode* kth = groupPrev;
                  for (int i = 0; i < k && kth; i++) kth = kth->next;
                  if (!kth) return dummy.next;
                  struct ListNode *groupNext = kth->next, *prev = groupNext, *cur = groupPrev->next;
                  while (cur != groupNext) { struct ListNode* nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
                  struct ListNode* first = groupPrev->next;
                  groupPrev->next = kth;
                  groupPrev = first;
              }
          }
        `,
        csharp: code`
          public static ListNode ReverseKGroup(ListNode head, int k)
          {
              ListNode dummy = new ListNode(0, head), groupPrev = dummy;
              while (true)
              {
                  ListNode kth = groupPrev;
                  for (int i = 0; i < k && kth != null; i++) kth = kth.next;
                  if (kth == null) return dummy.next;
                  ListNode groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
                  while (cur != groupNext) { var nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
                  ListNode first = groupPrev.next;
                  groupPrev.next = kth;
                  groupPrev = first;
              }
          }
        `,
        go: code`
          func reverseKGroup(head *ListNode, k int) *ListNode {
          	dummy := &ListNode{Next: head}
          	groupPrev := dummy
          	for {
          		kth := groupPrev
          		for i := 0; i < k && kth != nil; i++ {
          			kth = kth.Next
          		}
          		if kth == nil {
          			return dummy.Next
          		}
          		groupNext := kth.Next
          		prev, cur := groupNext, groupPrev.Next
          		for cur != groupNext {
          			nx := cur.Next
          			cur.Next = prev
          			prev = cur
          			cur = nx
          		}
          		first := groupPrev.Next
          		groupPrev.Next = kth
          		groupPrev = first
          	}
          }
        `,
        kotlin: kt(code`
          fun reverseKGroup(head: ListNode?, k: Int): ListNode? {
              val dummy = ListNode(0)
              dummy.next = head
              var groupPrev = dummy
              while (true) {
                  var kth: ListNode? = groupPrev
                  var i = 0
                  while (i < k && kth != null) { kth = kth.next; i++ }
                  if (kth == null) return dummy.next
                  val groupNext = kth.next
                  var prev = groupNext
                  var cur = groupPrev.next
                  while (cur !== groupNext) { val c = cur!!; val nx = c.next; c.next = prev; prev = c; cur = nx }
                  val first = groupPrev.next!!
                  groupPrev.next = kth
                  groupPrev = first
              }
          }
        `),
        swift: code`
          func reverseKGroup(_ head: ListNode?, _ k: Int) -> ListNode? {
              let dummy = ListNode(0, head)
              var groupPrev = dummy
              while true {
                  var kth: ListNode? = groupPrev
                  var i = 0
                  while i < k, let t = kth { kth = t.next; i += 1 }
                  guard let last = kth else { return dummy.next }
                  let groupNext = last.next
                  var prev = groupNext
                  var cur = groupPrev.next
                  while cur !== groupNext { let c = cur!; let nx = c.next; c.next = prev; prev = c; cur = nx }
                  let first = groupPrev.next!
                  groupPrev.next = last
                  groupPrev = first
              }
          }
        `,
        rust: code`
          fn reverseKGroup(head: Option<Box<ListNode>>, k: i32) -> Option<Box<ListNode>> {
              let mut v: Vec<i32> = Vec::new();
              let mut cur = &head;
              while let Some(n) = cur { v.push(n.val); cur = &n.next; }
              let k = k as usize;
              let full = v.len() / k * k;
              for block in v[..full].chunks_mut(k) { block.reverse(); }
              let mut out: Option<Box<ListNode>> = None;
              for &x in v.iter().rev() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function reverseKGroup($head, $k) {
              $dummy = new ListNode(0, $head);
              $groupPrev = $dummy;
              while (true) {
                  $kth = $groupPrev;
                  for ($i = 0; $i < $k && $kth !== null; $i++) $kth = $kth->next;
                  if ($kth === null) return $dummy->next;
                  $groupNext = $kth->next; $prev = $groupNext; $cur = $groupPrev->next;
                  while ($cur !== $groupNext) { $nx = $cur->next; $cur->next = $prev; $prev = $cur; $cur = $nx; }
                  $first = $groupPrev->next;
                  $groupPrev->next = $kth;
                  $groupPrev = $first;
              }
          }
        `,
        ruby: code`
          def reverseKGroup(head, k)
            dummy = ListNode.new(0, head)
            group_prev = dummy
            loop do
              kth = group_prev
              i = 0
              while i < k && !kth.nil?
                kth = kth.next
                i += 1
              end
              return dummy.next if kth.nil?
              group_next = kth.next
              prev = group_next
              cur = group_prev.next
              until cur.equal?(group_next)
                nx = cur.next
                cur.next = prev
                prev = cur
                cur = nx
              end
              first = group_prev.next
              group_prev.next = kth
              group_prev = first
            end
          end
        `,
      },
    };
  })(),

  // ── Subtraction in Linked List (GFG) ──────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const x = BigInt(a.join("")), y = BigInt(b.join(""));
      return String(x > y ? x - y : y - x).split("").map(Number);
    };
    const ex: Array<[number[], number[]]> = [[[1, 0, 0], [1, 2]], [[0, 0, 6, 3], [7, 1, 0]], [[4, 5], [4, 5]]];
    return {
      slug: "subtraction-in-linked-list",
      title: "Subtraction in Linked List",
      difficulty: "HARD" as const,
      tags: ["Linked List", "Math", "Amazon", "Microsoft"],
      signature: { funcName: "subLinkedList", params: [{ name: "head1", type: "ListNode" as const }, { name: "head2", type: "ListNode" as const }], returns: "ListNode" as const },
      description: describe(
        "Two non-negative integers are stored in linked lists `head1` and `head2`, one decimal digit per node, with the **most significant** digit first. The lists may have different lengths and may start with **leading zeros**.\n\nSubtract the smaller number from the larger one and return the difference as a linked list in the same form, but **without** leading zeros. If the two numbers are equal, return a single node `0`.",
        [
          { in: `head1 = ${fmtIntArr(ex[0][0])}, head2 = ${fmtIntArr(ex[0][1])}`, out: fmtIntArr(ref(...ex[0])), note: "100 - 12 = 88." },
          { in: `head1 = ${fmtIntArr(ex[1][0])}, head2 = ${fmtIntArr(ex[1][1])}`, out: fmtIntArr(ref(...ex[1])), note: "The first number is 63 once its leading zeros are dropped, so the larger is 710: 710 - 63 = 647." },
          { in: `head1 = ${fmtIntArr(ex[2][0])}, head2 = ${fmtIntArr(ex[2][1])}`, out: fmtIntArr(ref(...ex[2])), note: "Equal numbers give 0." },
        ],
        ["1 <= number of nodes in each list <= 10^4", "0 <= Node.val <= 9"]),
      hints: [
        "First decide which number is larger. Leading zeros make list length a misleading guide — strip them before comparing.",
        "After stripping, the longer number is larger; with equal lengths, the first differing digit from the front decides.",
        "Subtract digit by digit from the least significant end with a borrow, then remove the leading zeros the subtraction leaves behind (keep one digit if the result is 0).",
      ],
      editorial: explain({
        idea: "This is grade-school subtraction on digit sequences. The only list-specific work is that digits are stored most significant first, so read each list into an array (or reverse it) to subtract from the right, and handle leading zeros on both the inputs and the result.",
        steps: [
          "Read each list's digits and drop leading zeros, keeping at least one digit.",
          "Make `a` the larger number: the longer sequence, or on equal length the one with the larger first differing digit.",
          "Walk both from the least significant digit: `d = a[i] - borrow - (b's digit or 0)`; if `d < 0` add 10 and set `borrow = 1`, otherwise `borrow = 0`.",
          "Drop leading zeros from the result (keep one), and build the output list most significant digit first.",
        ],
        why: "Subtracting the smaller from the larger never needs a final borrow, so the column method yields the exact difference. Comparing after stripping leading zeros is correct because then the number of digits is the order of magnitude.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Comparing raw lengths: `0063` has four nodes but is smaller than `710`.",
          "Numbers have up to 10^4 digits — no built-in integer type holds them.",
          "Equal numbers produce all zeros; the answer is the single node `0`, not an empty list.",
        ],
      }),
      examples: ex.map(([a, b]) => ({ input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) })),
      gen: (rng: Rng) => {
        const mk = () => {
          const len = ri(rng, 1, pick(rng, [1, 3, 8, 20]));
          const d = Array.from({ length: len }, () => ri(rng, 0, 9));
          const zeros = rng() < 0.25 ? ri(rng, 1, 3) : 0;
          return [...new Array<number>(zeros).fill(0), ...d];
        };
        const a = mk();
        let b = mk();
        const r = rng();
        if (r < 0.1) b = a.slice();
        else if (r < 0.2) { b = a.slice(); b[b.length - 1] = ri(rng, 0, 9); }
        else if (r < 0.3 && a.length > 1) { b = a.slice(); b[0] = ri(rng, 0, 9); }
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import Optional

          def digits_of(h):
              d = []
              while h:
                  d.append(h.val)
                  h = h.next
              i = 0
              while i < len(d) - 1 and d[i] == 0:
                  i += 1
              return d[i:]

          def subLinkedList(head1: Optional[ListNode], head2: Optional[ListNode]) -> Optional[ListNode]:
              a, b = digits_of(head1), digits_of(head2)
              if len(a) < len(b) or (len(a) == len(b) and a < b):
                  a, b = b, a
              res, borrow, j = [], 0, len(b) - 1
              for i in range(len(a) - 1, -1, -1):
                  d = a[i] - borrow - (b[j] if j >= 0 else 0)
                  j -= 1
                  borrow = 1 if d < 0 else 0
                  res.append(d + 10 if d < 0 else d)
              while len(res) > 1 and res[-1] == 0:
                  res.pop()
              head = None
              for d in res:  # least significant first, so prepending puts the top digit at the head
                  head = ListNode(d, head)
              return head
        `,
        javascript: code`
          var digitsOf = function(h) {
              var d = [];
              for (; h !== null; h = h.next) d.push(h.val);
              var i = 0;
              while (i < d.length - 1 && d[i] === 0) i++;
              return d.slice(i);
          };

          var subLinkedList = function(head1, head2) {
              var a = digitsOf(head1), b = digitsOf(head2);
              var swap = a.length < b.length;
              if (a.length === b.length) {
                  for (var t = 0; t < a.length; t++) if (a[t] !== b[t]) { swap = a[t] < b[t]; break; }
              }
              if (swap) { var tmp = a; a = b; b = tmp; }
              var res = [], borrow = 0, j = b.length - 1;
              for (var i = a.length - 1; i >= 0; i--, j--) {
                  var d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res.push(d < 0 ? d + 10 : d);
              }
              while (res.length > 1 && res[res.length - 1] === 0) res.pop();
              var head = null;
              for (var r = 0; r < res.length; r++) head = new ListNode(res[r], head);
              return head;
          };
        `,
        typescript: code`
          function digitsOf(h: ListNode | null): number[] {
              var d: number[] = [];
              for (; h !== null; h = h.next) d.push(h.val);
              var i = 0;
              while (i < d.length - 1 && d[i] === 0) i++;
              return d.slice(i);
          }

          function subLinkedList(head1: ListNode | null, head2: ListNode | null): ListNode | null {
              var a = digitsOf(head1), b = digitsOf(head2);
              var swap = a.length < b.length;
              if (a.length === b.length) {
                  for (var t = 0; t < a.length; t++) if (a[t] !== b[t]) { swap = a[t] < b[t]; break; }
              }
              if (swap) { var tmp = a; a = b; b = tmp; }
              var res: number[] = [], borrow = 0, j = b.length - 1;
              for (var i = a.length - 1; i >= 0; i--, j--) {
                  var d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res.push(d < 0 ? d + 10 : d);
              }
              while (res.length > 1 && res[res.length - 1] === 0) res.pop();
              var head: ListNode | null = null;
              for (var r = 0; r < res.length; r++) head = new ListNode(res[r], head);
              return head;
          }
        `,
        java: code`
          static int[] digitsOf(ListNode h) {
              ArrayList<Integer> d = new ArrayList<>();
              for (; h != null; h = h.next) d.add(h.val);
              int i = 0;
              while (i < d.size() - 1 && d.get(i) == 0) i++;
              int[] out = new int[d.size() - i];
              for (int t = i; t < d.size(); t++) out[t - i] = d.get(t);
              return out;
          }

          public static ListNode subLinkedList(ListNode head1, ListNode head2) {
              int[] a = digitsOf(head1), b = digitsOf(head2);
              boolean swap = a.length < b.length;
              if (a.length == b.length) {
                  for (int t = 0; t < a.length; t++) if (a[t] != b[t]) { swap = a[t] < b[t]; break; }
              }
              if (swap) { int[] tmp = a; a = b; b = tmp; }
              int[] res = new int[a.length];
              int borrow = 0, len = 0;
              for (int i = a.length - 1, j = b.length - 1; i >= 0; i--, j--) {
                  int d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res[len++] = d < 0 ? d + 10 : d;
              }
              while (len > 1 && res[len - 1] == 0) len--;
              ListNode head = null;
              for (int r = 0; r < len; r++) head = new ListNode(res[r], head);
              return head;
          }
        `,
        cpp: code`
          vector<int> digitsOf(ListNode* h) {
              vector<int> d;
              for (; h; h = h->next) d.push_back(h->val);
              size_t i = 0;
              while (i + 1 < d.size() && d[i] == 0) i++;
              return vector<int>(d.begin() + i, d.end());
          }

          ListNode* subLinkedList(ListNode* head1, ListNode* head2) {
              vector<int> a = digitsOf(head1), b = digitsOf(head2);
              if (a.size() < b.size() || (a.size() == b.size() && a < b)) swap(a, b);
              vector<int> res;
              int borrow = 0;
              for (int i = (int)a.size() - 1, j = (int)b.size() - 1; i >= 0; i--, j--) {
                  int d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res.push_back(d < 0 ? d + 10 : d);
              }
              while (res.size() > 1 && res.back() == 0) res.pop_back();
              ListNode* head = nullptr;
              for (int d : res) head = new ListNode(d, head);
              return head;
          }
        `,
        c: code`
          /* Reads a list's digits into a fresh array, leading zeros dropped (one digit kept). */
          static int* digitsOf(struct ListNode* h, int* len) {
              int n = 0;
              for (struct ListNode* p = h; p; p = p->next) n++;
              int* d = (int*)malloc((n + 1) * sizeof(int));
              int k = 0, started = 0, i = 0;
              for (struct ListNode* p = h; p; p = p->next, i++) {
                  if (!started && p->val == 0 && i < n - 1) continue;
                  started = 1;
                  d[k++] = p->val;
              }
              *len = k;
              return d;
          }

          struct ListNode* subLinkedList(struct ListNode* head1, struct ListNode* head2) {
              int na, nb;
              int *a = digitsOf(head1, &na), *b = digitsOf(head2, &nb);
              int swap = na < nb;
              if (na == nb) {
                  for (int t = 0; t < na; t++) if (a[t] != b[t]) { swap = a[t] < b[t]; break; }
              }
              if (swap) { int* tp = a; a = b; b = tp; int tn = na; na = nb; nb = tn; }
              int* res = (int*)malloc((na + 1) * sizeof(int));
              int borrow = 0, len = 0;
              for (int i = na - 1, j = nb - 1; i >= 0; i--, j--) {
                  int d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res[len++] = d < 0 ? d + 10 : d;
              }
              while (len > 1 && res[len - 1] == 0) len--;
              struct ListNode* head = NULL;
              for (int r = 0; r < len; r++) {
                  struct ListNode* x = (struct ListNode*)malloc(sizeof(struct ListNode));
                  x->val = res[r];
                  x->next = head;
                  head = x;
              }
              free(a); free(b); free(res);
              return head;
          }
        `,
        csharp: code`
          static List<int> DigitsOf(ListNode h)
          {
              var d = new List<int>();
              for (; h != null; h = h.next) d.Add(h.val);
              int i = 0;
              while (i < d.Count - 1 && d[i] == 0) i++;
              return d.GetRange(i, d.Count - i);
          }

          public static ListNode SubLinkedList(ListNode head1, ListNode head2)
          {
              List<int> a = DigitsOf(head1), b = DigitsOf(head2);
              bool swap = a.Count < b.Count;
              if (a.Count == b.Count)
              {
                  for (int t = 0; t < a.Count; t++) if (a[t] != b[t]) { swap = a[t] < b[t]; break; }
              }
              if (swap) { var tmp = a; a = b; b = tmp; }
              var res = new List<int>();
              int borrow = 0;
              for (int i = a.Count - 1, j = b.Count - 1; i >= 0; i--, j--)
              {
                  int d = a[i] - borrow - (j >= 0 ? b[j] : 0);
                  borrow = d < 0 ? 1 : 0;
                  res.Add(d < 0 ? d + 10 : d);
              }
              while (res.Count > 1 && res[res.Count - 1] == 0) res.RemoveAt(res.Count - 1);
              ListNode head = null;
              foreach (int d in res) head = new ListNode(d, head);
              return head;
          }
        `,
        go: code`
          func digitsOf(h *ListNode) []int {
          	d := []int{}
          	for ; h != nil; h = h.Next {
          		d = append(d, h.Val)
          	}
          	i := 0
          	for i < len(d)-1 && d[i] == 0 {
          		i++
          	}
          	return d[i:]
          }

          func subLinkedList(head1 *ListNode, head2 *ListNode) *ListNode {
          	a, b := digitsOf(head1), digitsOf(head2)
          	swap := len(a) < len(b)
          	if len(a) == len(b) {
          		for t := range a {
          			if a[t] != b[t] {
          				swap = a[t] < b[t]
          				break
          			}
          		}
          	}
          	if swap {
          		a, b = b, a
          	}
          	res := []int{}
          	borrow := 0
          	for i, j := len(a)-1, len(b)-1; i >= 0; i, j = i-1, j-1 {
          		d := a[i] - borrow
          		if j >= 0 {
          			d -= b[j]
          		}
          		borrow = 0
          		if d < 0 {
          			d += 10
          			borrow = 1
          		}
          		res = append(res, d)
          	}
          	for len(res) > 1 && res[len(res)-1] == 0 {
          		res = res[:len(res)-1]
          	}
          	var head *ListNode
          	for _, d := range res {
          		head = &ListNode{Val: d, Next: head}
          	}
          	return head
          }
        `,
        kotlin: kt(code`
          fun digitsOf(h0: ListNode?): List<Int> {
              val d = ArrayList<Int>()
              var h = h0
              while (h != null) { d.add(h.KVAL); h = h.next }
              var i = 0
              while (i < d.size - 1 && d[i] == 0) i++
              return d.subList(i, d.size)
          }

          fun subLinkedList(head1: ListNode?, head2: ListNode?): ListNode? {
              var a = digitsOf(head1)
              var b = digitsOf(head2)
              var swap = a.size < b.size
              if (a.size == b.size) {
                  for (t in a.indices) if (a[t] != b[t]) { swap = a[t] < b[t]; break }
              }
              if (swap) { val tmp = a; a = b; b = tmp }
              val res = ArrayList<Int>()
              var borrow = 0
              var j = b.size - 1
              for (i in a.size - 1 downTo 0) {
                  var d = a[i] - borrow - (if (j >= 0) b[j] else 0)
                  j--
                  borrow = if (d < 0) 1 else 0
                  if (d < 0) d += 10
                  res.add(d)
              }
              while (res.size > 1 && res[res.size - 1] == 0) res.removeAt(res.size - 1)
              var head: ListNode? = null
              for (d in res) { val n = ListNode(d); n.next = head; head = n }
              return head
          }
        `),
        swift: code`
          func digitsOf(_ h0: ListNode?) -> [Int] {
              var d: [Int] = []
              var h = h0
              while let n = h { d.append(n.val); h = n.next }
              var i = 0
              while i < d.count - 1 && d[i] == 0 { i += 1 }
              return Array(d[i...])
          }

          func subLinkedList(_ head1: ListNode?, _ head2: ListNode?) -> ListNode? {
              var a = digitsOf(head1), b = digitsOf(head2)
              if a.count < b.count || (a.count == b.count && a.lexicographicallyPrecedes(b)) { swap(&a, &b) }
              var res: [Int] = []
              var borrow = 0
              var j = b.count - 1
              for i in stride(from: a.count - 1, through: 0, by: -1) {
                  var d = a[i] - borrow - (j >= 0 ? b[j] : 0)
                  j -= 1
                  borrow = d < 0 ? 1 : 0
                  if d < 0 { d += 10 }
                  res.append(d)
              }
              while res.count > 1 && res[res.count - 1] == 0 { res.removeLast() }
              var head: ListNode? = nil
              for d in res { head = ListNode(d, head) }
              return head
          }
        `,
        rust: code`
          fn subLinkedList(head1: Option<Box<ListNode>>, head2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
              fn digits(h: &Option<Box<ListNode>>) -> Vec<i32> {
                  let mut d: Vec<i32> = Vec::new();
                  let mut cur = h;
                  while let Some(n) = cur { d.push(n.val); cur = &n.next; }
                  let mut i = 0;
                  while i + 1 < d.len() && d[i] == 0 { i += 1; }
                  d[i..].to_vec()
              }
              let (mut a, mut b) = (digits(&head1), digits(&head2));
              if a.len() < b.len() || (a.len() == b.len() && a < b) { std::mem::swap(&mut a, &mut b); }
              let mut res: Vec<i32> = Vec::new();
              let mut borrow = 0;
              for k in 0..a.len() {
                  let i = a.len() - 1 - k;
                  let sub = if k < b.len() { b[b.len() - 1 - k] } else { 0 };
                  let mut d = a[i] - borrow - sub;
                  borrow = if d < 0 { 1 } else { 0 };
                  if d < 0 { d += 10; }
                  res.push(d);
              }
              while res.len() > 1 && res[res.len() - 1] == 0 { res.pop(); }
              let mut out: Option<Box<ListNode>> = None;
              for &x in res.iter() { let mut n = ListNode::new(x); n.next = out; out = Some(Box::new(n)); }
              out
          }
        `,
        php: code`
          function digitsOf($h) {
              $d = [];
              for (; $h !== null; $h = $h->next) $d[] = $h->val;
              $i = 0;
              while ($i < count($d) - 1 && $d[$i] == 0) $i++;
              return array_slice($d, $i);
          }

          function subLinkedList($head1, $head2) {
              $a = digitsOf($head1); $b = digitsOf($head2);
              $swap = count($a) < count($b);
              if (count($a) == count($b)) {
                  for ($t = 0; $t < count($a); $t++) if ($a[$t] != $b[$t]) { $swap = $a[$t] < $b[$t]; break; }
              }
              if ($swap) { $tmp = $a; $a = $b; $b = $tmp; }
              $res = []; $borrow = 0;
              for ($i = count($a) - 1, $j = count($b) - 1; $i >= 0; $i--, $j--) {
                  $d = $a[$i] - $borrow - ($j >= 0 ? $b[$j] : 0);
                  $borrow = $d < 0 ? 1 : 0;
                  $res[] = $d < 0 ? $d + 10 : $d;
              }
              while (count($res) > 1 && end($res) == 0) array_pop($res);
              $head = null;
              foreach ($res as $d) $head = new ListNode($d, $head);
              return $head;
          }
        `,
        ruby: code`
          def digits_of(h)
            d = []
            until h.nil?
              d << h.val
              h = h.next
            end
            i = 0
            i += 1 while i < d.length - 1 && d[i] == 0
            d[i..-1]
          end

          def subLinkedList(head1, head2)
            a = digits_of(head1)
            b = digits_of(head2)
            a, b = b, a if a.length < b.length || (a.length == b.length && (a <=> b) < 0)
            res = []
            borrow = 0
            j = b.length - 1
            (a.length - 1).downto(0) do |i|
              d = a[i] - borrow - (j >= 0 ? b[j] : 0)
              j -= 1
              borrow = d < 0 ? 1 : 0
              res << (d < 0 ? d + 10 : d)
            end
            res.pop while res.length > 1 && res[-1] == 0
            head = nil
            res.each { |d| head = ListNode.new(d, head) }
            head
          end
        `,
      },
    };
  })(),

  // ── Implement Stack using Queues (LC 225) ─────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const st: number[] = [];
      return ops.map((op, i) => {
        if (op === "MyStack") return null;
        if (op === "push") { st.push(args[i][0]); return null; }
        if (op === "pop") return st.pop() as number;
        if (op === "top") return st[st.length - 1];
        return st.length === 0;
      });
    };
    const make = (rng: Rng) => {
      const ops = ["MyStack"], args: number[][] = [[]];
      let size = 0;
      for (let m = ri(rng, 1, pick(rng, [2, 8, 20, 40])); m > 0; m--) {
        const r = rng();
        if (size === 0 ? r < 0.8 : r < 0.4) { ops.push("push"); args.push([ri(rng, 1, 9)]); size++; }
        else if (size > 0 && r < 0.65) { ops.push("pop"); args.push([]); size--; }
        else if (size > 0 && r < 0.85) { ops.push("top"); args.push([]); }
        else { ops.push("empty"); args.push([]); }
      }
      return { ops, args };
    };
    const ex = [
      { ops: ["MyStack", "push", "push", "top", "pop", "empty"], args: [[], [4], [7], [], [], []] },
      { ops: ["MyStack", "empty", "push", "push", "push", "pop", "top", "pop", "pop", "empty"], args: [[], [], [1], [9], [5], [], [], [], [], []] },
    ];
    return {
      slug: "implement-stack-using-queues",
      title: "Implement Stack using Queues",
      difficulty: "EASY" as const,
      tags: ["Stack", "Queue", "Design", "Amazon", "Microsoft", "Bloomberg"],
      signature: {
        funcName: "MyStack", params: [], returns: "void" as const,
        methods: [
          { name: "push", params: [{ name: "x", type: "int" as const }], returns: "void" as const },
          { name: "pop", params: [], returns: "int" as const },
          { name: "top", params: [], returns: "int" as const },
          { name: "empty", params: [], returns: "bool" as const },
        ],
      },
      description: describe(
        "Implement a last-in-first-out (LIFO) stack using only **queues**. Write the class `MyStack`:\n\n- `MyStack()` creates an empty stack.\n- `void push(int x)` pushes `x` onto the top of the stack.\n- `int pop()` removes the element on the top of the stack and returns it.\n- `int top()` returns the element on the top of the stack without removing it.\n- `boolean empty()` returns `true` if the stack is empty, `false` otherwise.\n\nYour stack may use only the standard queue operations: push to the back, peek at or pop from the front, size, and is-empty. (In a language without a queue type, a list or deque used only through those operations is fine.)\n\nThe judge calls the methods in the order listed in the first input line, with the arguments in the second; the expected output holds each call's result, `null` for the constructor and for `push`.",
        [
          { in: `${JSON.stringify(ex[0].ops)}\n${JSON.stringify(ex[0].args)}`, out: JSON.stringify(run(ex[0].ops, ex[0].args)), note: "After pushing 4 then 7, the top is 7; pop removes 7, leaving 4, so the stack is not empty." },
          { in: `${JSON.stringify(ex[1].ops)}\n${JSON.stringify(ex[1].args)}`, out: JSON.stringify(run(ex[1].ops, ex[1].args)), note: "The stack starts empty. 1, 9, 5 are pushed; they come off in the order 5, 9, 1, after which the stack is empty again." },
        ],
        ["1 <= x <= 9", "At most 100 calls are made to push, pop, top and empty", "Every call to pop and top is made on a non-empty stack"],
        "Can you implement the stack with only one queue?"),
      hints: [
        "A queue hands elements back oldest first, a stack newest first. Arrange the queue so that its front is always the newest element.",
        "When a new element is pushed to the back of the queue, every older element is in front of it.",
        "After pushing `x`, rotate the queue `size - 1` times (pop from the front, push to the back). Now `x` is at the front, so `pop` and `top` are ordinary front operations.",
      ],
      editorial: explain({
        idea: "Keep one queue in stack order — newest element at the front. A push appends the new element and then rotates every older element behind it; after that, `pop`, `top` and `empty` are plain queue operations.",
        steps: [
          "`push(x)`: enqueue `x`, then repeat `size - 1` times: dequeue the front element and enqueue it again.",
          "`pop()`: dequeue and return the front element.",
          "`top()`: return the front element without removing it.",
          "`empty()`: return whether the queue is empty.",
        ],
        why: "By induction the queue, read front to back, is the stack from top to bottom. Pushing `x` puts it last; rotating the `size - 1` older elements from the front to the back moves them behind `x` in their existing order, so `x` is now first and the rest keep their stack order.",
        time: "push O(n); pop, top and empty O(1)",
        space: "O(n)",
        pitfalls: [
          "Rotating `size` times instead of `size - 1` puts the new element back at the end.",
          "The two-queue version (move all but the last element across on each pop) is also accepted; it makes `pop` the O(n) operation instead of `push`.",
        ],
      }),
      examples: ex.map((e) => ({ input: designInput(e.ops, e.args), expectedOutput: JSON.stringify(run(e.ops, e.args)) })),
      gen: (rng: Rng) => {
        const { ops, args } = make(rng);
        return { input: designInput(ops, args), expectedOutput: JSON.stringify(run(ops, args)) };
      },
      solutions: {
        python: code`
          from collections import deque

          class MyStack:

              def __init__(self):
                  self.q = deque()

              def push(self, x: int) -> None:
                  self.q.append(x)
                  for _ in range(len(self.q) - 1):  # bring x to the front
                      self.q.append(self.q.popleft())

              def pop(self) -> int:
                  return self.q.popleft()

              def top(self) -> int:
                  return self.q[0]

              def empty(self) -> bool:
                  return len(self.q) == 0
        `,
        javascript: code`
          var MyStack = function() {
              this.q = [];
          };

          MyStack.prototype.push = function(x) {
              this.q.push(x);
              for (var i = 1; i < this.q.length; i++) this.q.push(this.q.shift()); // bring x to the front
          };

          MyStack.prototype.pop = function() {
              return this.q.shift();
          };

          MyStack.prototype.top = function() {
              return this.q[0];
          };

          MyStack.prototype.empty = function() {
              return this.q.length === 0;
          };
        `,
        typescript: code`
          class MyStack {
              q: number[];

              constructor() {
                  this.q = [];
              }

              push(x: number): void {
                  this.q.push(x);
                  for (var i = 1; i < this.q.length; i++) this.q.push(this.q.shift()); // bring x to the front
              }

              pop(): number {
                  return this.q.shift();
              }

              top(): number {
                  return this.q[0];
              }

              empty(): boolean {
                  return this.q.length === 0;
              }
          }
        `,
        java: code`
          class MyStack {
              private Queue<Integer> q = new ArrayDeque<>();

              public MyStack() {
              }

              public void push(int x) {
                  q.offer(x);
                  for (int i = 1; i < q.size(); i++) q.offer(q.poll()); // bring x to the front
              }

              public int pop() {
                  return q.poll();
              }

              public int top() {
                  return q.peek();
              }

              public boolean empty() {
                  return q.isEmpty();
              }
          }
        `,
        cpp: code`
          class MyStack {
              queue<int> q;
          public:
              MyStack() {}

              void push(int x) {
                  q.push(x);
                  for (size_t i = 1; i < q.size(); i++) { q.push(q.front()); q.pop(); } // bring x to the front
              }

              int pop() {
                  int x = q.front();
                  q.pop();
                  return x;
              }

              int top() {
                  return q.front();
              }

              bool empty() {
                  return q.empty();
              }
          };
        `,
        c: code`
          /* A circular queue; at most 100 calls means at most 100 elements. */
          #define MS_CAP 128

          typedef struct {
              int buf[MS_CAP];
              int head, size;
          } MyStack;

          static void msEnqueue(MyStack* s, int x) { s->buf[(s->head + s->size) % MS_CAP] = x; s->size++; }

          static int msDequeue(MyStack* s) { int x = s->buf[s->head]; s->head = (s->head + 1) % MS_CAP; s->size--; return x; }

          MyStack* myStackCreate() {
              MyStack* s = (MyStack*)malloc(sizeof(MyStack));
              s->head = 0;
              s->size = 0;
              return s;
          }

          void myStackPush(MyStack* obj, int x) {
              msEnqueue(obj, x);
              for (int i = 1; i < obj->size; i++) msEnqueue(obj, msDequeue(obj)); /* bring x to the front */
          }

          int myStackPop(MyStack* obj) {
              return msDequeue(obj);
          }

          int myStackTop(MyStack* obj) {
              return obj->buf[obj->head];
          }

          bool myStackEmpty(MyStack* obj) {
              return obj->size == 0;
          }

          void myStackFree(MyStack* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class MyStack {
              private Queue<int> q = new Queue<int>();

              public MyStack() {
              }

              public void Push(int x) {
                  q.Enqueue(x);
                  for (int i = 1; i < q.Count; i++) q.Enqueue(q.Dequeue()); // bring x to the front
              }

              public int Pop() {
                  return q.Dequeue();
              }

              public int Top() {
                  return q.Peek();
              }

              public bool Empty() {
                  return q.Count == 0;
              }
          }
        `,
        go: code`
          type MyStack struct {
          	q []int
          }

          func Constructor() MyStack {
          	return MyStack{}
          }

          func (this *MyStack) Push(x int) {
          	this.q = append(this.q, x)
          	for i := 1; i < len(this.q); i++ { // bring x to the front
          		front := this.q[0]
          		this.q = append(this.q[1:], front)
          	}
          }

          func (this *MyStack) Pop() int {
          	x := this.q[0]
          	this.q = this.q[1:]
          	return x
          }

          func (this *MyStack) Top() int {
          	return this.q[0]
          }

          func (this *MyStack) Empty() bool {
          	return len(this.q) == 0
          }
        `,
        kotlin: code`
          class MyStack() {
              private val q = java.util.ArrayDeque<Int>()

              fun push(x: Int) {
                  q.offer(x)
                  repeat(q.size - 1) { q.offer(q.poll()) } // bring x to the front
              }

              fun pop(): Int = q.poll()

              fun top(): Int = q.peek()

              fun empty(): Boolean = q.isEmpty()
          }
        `,
        swift: code`
          class MyStack {
              var q: [Int] = []

              init() {}

              func push(_ x: Int) {
                  q.append(x)
                  for _ in 0..<(q.count - 1) { q.append(q.removeFirst()) } // bring x to the front
              }

              func pop() -> Int {
                  return q.removeFirst()
              }

              func top() -> Int {
                  return q[0]
              }

              func empty() -> Bool {
                  return q.isEmpty
              }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          struct MyStack {
              q: VecDeque<i32>,
          }

          impl MyStack {
              fn new() -> Self { MyStack { q: VecDeque::new() } }

              fn push(&mut self, x: i32) {
                  self.q.push_back(x);
                  for _ in 1..self.q.len() { // bring x to the front
                      let f = self.q.pop_front().unwrap();
                      self.q.push_back(f);
                  }
              }

              fn pop(&mut self) -> i32 { self.q.pop_front().unwrap() }

              fn top(&mut self) -> i32 { *self.q.front().unwrap() }

              fn empty(&mut self) -> bool { self.q.is_empty() }
          }
        `,
        php: code`
          class MyStack {
              private $q;

              function __construct() {
                  $this->q = new \SplQueue(); // the judge's PHP runs in a namespace
              }

              function push($x) {
                  $this->q->enqueue($x);
                  for ($i = 1; $i < count($this->q); $i++) $this->q->enqueue($this->q->dequeue()); // bring x to the front
              }

              function pop() {
                  return $this->q->dequeue();
              }

              function top() {
                  return $this->q->bottom();
              }

              function empty() {
                  return $this->q->isEmpty();
              }
          }
        `,
        ruby: code`
          class MyStack
            def initialize
              @q = []
            end

            def push(x)
              @q.push(x)
              (@q.length - 1).times { @q.push(@q.shift) } # bring x to the front
            end

            def pop
              @q.shift
            end

            def top
              @q.first
            end

            def empty
              @q.empty?
            end
          end
        `,
      },
    };
  })(),

  // ── Implement Queue using Stacks (LC 232) ─────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const q: number[] = [];
      return ops.map((op, i) => {
        if (op === "MyQueue") return null;
        if (op === "push") { q.push(args[i][0]); return null; }
        if (op === "pop") return q.shift() as number;
        if (op === "peek") return q[0];
        return q.length === 0;
      });
    };
    const make = (rng: Rng) => {
      const ops = ["MyQueue"], args: number[][] = [[]];
      let size = 0;
      for (let m = ri(rng, 1, pick(rng, [2, 8, 20, 40])); m > 0; m--) {
        const r = rng();
        if (size === 0 ? r < 0.8 : r < 0.4) { ops.push("push"); args.push([ri(rng, 1, 9)]); size++; }
        else if (size > 0 && r < 0.65) { ops.push("pop"); args.push([]); size--; }
        else if (size > 0 && r < 0.85) { ops.push("peek"); args.push([]); }
        else { ops.push("empty"); args.push([]); }
      }
      return { ops, args };
    };
    const ex = [
      { ops: ["MyQueue", "push", "push", "peek", "pop", "empty"], args: [[], [3], [8], [], [], []] },
      { ops: ["MyQueue", "push", "pop", "push", "push", "peek", "pop", "pop", "empty"], args: [[], [6], [], [2], [5], [], [], [], []] },
    ];
    return {
      slug: "implement-queue-using-stacks",
      title: "Implement Queue using Stacks",
      difficulty: "EASY" as const,
      tags: ["Stack", "Queue", "Design", "Amazon", "Microsoft", "Bloomberg", "Apple"],
      signature: {
        funcName: "MyQueue", params: [], returns: "void" as const,
        methods: [
          { name: "push", params: [{ name: "x", type: "int" as const }], returns: "void" as const },
          { name: "pop", params: [], returns: "int" as const },
          { name: "peek", params: [], returns: "int" as const },
          { name: "empty", params: [], returns: "bool" as const },
        ],
      },
      description: describe(
        "Implement a first-in-first-out (FIFO) queue using only **stacks**. Write the class `MyQueue`:\n\n- `MyQueue()` creates an empty queue.\n- `void push(int x)` adds `x` to the back of the queue.\n- `int pop()` removes the element at the front of the queue and returns it.\n- `int peek()` returns the element at the front of the queue without removing it.\n- `boolean empty()` returns `true` if the queue is empty, `false` otherwise.\n\nYour queue may use only the standard stack operations: push to the top, peek at or pop from the top, size, and is-empty. (In a language without a stack type, a list used only through those operations is fine.)\n\nThe judge calls the methods in the order listed in the first input line, with the arguments in the second; the expected output holds each call's result, `null` for the constructor and for `push`.",
        [
          { in: `${JSON.stringify(ex[0].ops)}\n${JSON.stringify(ex[0].args)}`, out: JSON.stringify(run(ex[0].ops, ex[0].args)), note: "3 arrives before 8, so it is at the front: peek and pop both give 3, and 8 is still queued." },
          { in: `${JSON.stringify(ex[1].ops)}\n${JSON.stringify(ex[1].args)}`, out: JSON.stringify(run(ex[1].ops, ex[1].args)), note: "6 leaves at once; then 2 and 5 come out in arrival order and the queue is empty." },
        ],
        ["1 <= x <= 9", "At most 100 calls are made to push, pop, peek and empty", "Every call to pop and peek is made on a non-empty queue"],
        "Can you make every operation amortized O(1) — n operations in O(n) total time, even if one of them takes longer?"),
      hints: [
        "Pouring one stack into another reverses the order of its elements — and reversed LIFO order is FIFO order.",
        "Use an `in` stack that takes every push, and an `out` stack that serves pops and peeks.",
        "Only when `out` is empty, move everything from `in` to `out`. Each element is moved at most once, so the cost averages out to O(1).",
      ],
      editorial: explain({
        idea: "Two stacks make a queue: new elements land on `in`; the front of the queue is the top of `out`. When `out` runs dry, pouring `in` into it reverses those elements so the oldest ends on top.",
        steps: [
          "`push(x)`: push `x` onto `in`.",
          "`pop()` / `peek()`: if `out` is empty, pop every element of `in` and push it onto `out`. Then pop / read the top of `out`.",
          "`empty()`: the queue is empty when both stacks are.",
        ],
        why: "Every element in `out` is older than every element in `in`, because `out` is only refilled when empty, from elements that were all pushed earlier than anything pushed afterwards. Within `out` the order is reversed arrival order, so its top is the oldest element overall — the queue's front.",
        time: "amortized O(1) per operation",
        space: "O(n)",
        pitfalls: [
          "Pouring `in` into `out` while `out` still holds elements breaks the order — only transfer when `out` is empty.",
          "`empty()` must check both stacks.",
        ],
      }),
      examples: ex.map((e) => ({ input: designInput(e.ops, e.args), expectedOutput: JSON.stringify(run(e.ops, e.args)) })),
      gen: (rng: Rng) => {
        const { ops, args } = make(rng);
        return { input: designInput(ops, args), expectedOutput: JSON.stringify(run(ops, args)) };
      },
      solutions: {
        python: code`
          class MyQueue:

              def __init__(self):
                  self.inbox = []
                  self.outbox = []

              def push(self, x: int) -> None:
                  self.inbox.append(x)

              def _shift(self) -> None:
                  if not self.outbox:
                      while self.inbox:
                          self.outbox.append(self.inbox.pop())

              def pop(self) -> int:
                  self._shift()
                  return self.outbox.pop()

              def peek(self) -> int:
                  self._shift()
                  return self.outbox[-1]

              def empty(self) -> bool:
                  return not self.inbox and not self.outbox
        `,
        javascript: code`
          var MyQueue = function() {
              this.inbox = [];
              this.outbox = [];
          };

          MyQueue.prototype.push = function(x) {
              this.inbox.push(x);
          };

          MyQueue.prototype.shiftStacks = function() {
              if (this.outbox.length === 0) while (this.inbox.length > 0) this.outbox.push(this.inbox.pop());
          };

          MyQueue.prototype.pop = function() {
              this.shiftStacks();
              return this.outbox.pop();
          };

          MyQueue.prototype.peek = function() {
              this.shiftStacks();
              return this.outbox[this.outbox.length - 1];
          };

          MyQueue.prototype.empty = function() {
              return this.inbox.length === 0 && this.outbox.length === 0;
          };
        `,
        typescript: code`
          class MyQueue {
              inbox: number[];
              outbox: number[];

              constructor() {
                  this.inbox = [];
                  this.outbox = [];
              }

              push(x: number): void {
                  this.inbox.push(x);
              }

              shiftStacks(): void {
                  if (this.outbox.length === 0) while (this.inbox.length > 0) this.outbox.push(this.inbox.pop());
              }

              pop(): number {
                  this.shiftStacks();
                  return this.outbox.pop();
              }

              peek(): number {
                  this.shiftStacks();
                  return this.outbox[this.outbox.length - 1];
              }

              empty(): boolean {
                  return this.inbox.length === 0 && this.outbox.length === 0;
              }
          }
        `,
        java: code`
          class MyQueue {
              private Deque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();

              public MyQueue() {
              }

              public void push(int x) {
                  in.push(x);
              }

              private void shift() {
                  if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop());
              }

              public int pop() {
                  shift();
                  return out.pop();
              }

              public int peek() {
                  shift();
                  return out.peek();
              }

              public boolean empty() {
                  return in.isEmpty() && out.isEmpty();
              }
          }
        `,
        cpp: code`
          class MyQueue {
              stack<int> in, out;

              void shift() {
                  if (out.empty()) while (!in.empty()) { out.push(in.top()); in.pop(); }
              }
          public:
              MyQueue() {}

              void push(int x) {
                  in.push(x);
              }

              int pop() {
                  shift();
                  int x = out.top();
                  out.pop();
                  return x;
              }

              int peek() {
                  shift();
                  return out.top();
              }

              bool empty() {
                  return in.empty() && out.empty();
              }
          };
        `,
        c: code`
          /* Two array stacks; at most 100 calls means at most 100 elements. */
          #define MQ_CAP 128

          typedef struct {
              int in[MQ_CAP], out[MQ_CAP];
              int nin, nout;
          } MyQueue;

          static void mqShift(MyQueue* q) {
              if (q->nout == 0) while (q->nin > 0) q->out[q->nout++] = q->in[--q->nin];
          }

          MyQueue* myQueueCreate() {
              MyQueue* q = (MyQueue*)malloc(sizeof(MyQueue));
              q->nin = 0;
              q->nout = 0;
              return q;
          }

          void myQueuePush(MyQueue* obj, int x) {
              obj->in[obj->nin++] = x;
          }

          int myQueuePop(MyQueue* obj) {
              mqShift(obj);
              return obj->out[--obj->nout];
          }

          int myQueuePeek(MyQueue* obj) {
              mqShift(obj);
              return obj->out[obj->nout - 1];
          }

          bool myQueueEmpty(MyQueue* obj) {
              return obj->nin == 0 && obj->nout == 0;
          }

          void myQueueFree(MyQueue* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class MyQueue {
              private Stack<int> inbox = new Stack<int>(), outbox = new Stack<int>();

              public MyQueue() {
              }

              public void Push(int x) {
                  inbox.Push(x);
              }

              private void Shift() {
                  if (outbox.Count == 0) while (inbox.Count > 0) outbox.Push(inbox.Pop());
              }

              public int Pop() {
                  Shift();
                  return outbox.Pop();
              }

              public int Peek() {
                  Shift();
                  return outbox.Peek();
              }

              public bool Empty() {
                  return inbox.Count == 0 && outbox.Count == 0;
              }
          }
        `,
        go: code`
          type MyQueue struct {
          	in, out []int
          }

          func Constructor() MyQueue {
          	return MyQueue{}
          }

          func (this *MyQueue) Push(x int) {
          	this.in = append(this.in, x)
          }

          func (this *MyQueue) shift() {
          	if len(this.out) == 0 {
          		for len(this.in) > 0 {
          			n := len(this.in) - 1
          			this.out = append(this.out, this.in[n])
          			this.in = this.in[:n]
          		}
          	}
          }

          func (this *MyQueue) Pop() int {
          	this.shift()
          	n := len(this.out) - 1
          	x := this.out[n]
          	this.out = this.out[:n]
          	return x
          }

          func (this *MyQueue) Peek() int {
          	this.shift()
          	return this.out[len(this.out)-1]
          }

          func (this *MyQueue) Empty() bool {
          	return len(this.in) == 0 && len(this.out) == 0
          }
        `,
        kotlin: code`
          class MyQueue() {
              private val inbox = java.util.ArrayDeque<Int>()
              private val outbox = java.util.ArrayDeque<Int>()

              fun push(x: Int) { inbox.push(x) }

              private fun shift() {
                  if (outbox.isEmpty()) while (inbox.isNotEmpty()) outbox.push(inbox.pop())
              }

              fun pop(): Int { shift(); return outbox.pop() }

              fun peek(): Int { shift(); return outbox.peek() }

              fun empty(): Boolean = inbox.isEmpty() && outbox.isEmpty()
          }
        `,
        swift: code`
          class MyQueue {
              var inbox: [Int] = []
              var outbox: [Int] = []

              init() {}

              func push(_ x: Int) {
                  inbox.append(x)
              }

              private func shift() {
                  if outbox.isEmpty { while let x = inbox.popLast() { outbox.append(x) } }
              }

              func pop() -> Int {
                  shift()
                  return outbox.removeLast()
              }

              func peek() -> Int {
                  shift()
                  return outbox[outbox.count - 1]
              }

              func empty() -> Bool {
                  return inbox.isEmpty && outbox.isEmpty
              }
          }
        `,
        rust: code`
          struct MyQueue {
              inbox: Vec<i32>,
              outbox: Vec<i32>,
          }

          impl MyQueue {
              fn new() -> Self { MyQueue { inbox: Vec::new(), outbox: Vec::new() } }

              fn push(&mut self, x: i32) { self.inbox.push(x); }

              fn shift(&mut self) {
                  if self.outbox.is_empty() { while let Some(x) = self.inbox.pop() { self.outbox.push(x); } }
              }

              fn pop(&mut self) -> i32 { self.shift(); self.outbox.pop().unwrap() }

              fn peek(&mut self) -> i32 { self.shift(); *self.outbox.last().unwrap() }

              fn empty(&mut self) -> bool { self.inbox.is_empty() && self.outbox.is_empty() }
          }
        `,
        php: code`
          class MyQueue {
              private $inbox = [];
              private $outbox = [];

              function __construct() {
              }

              function push($x) {
                  $this->inbox[] = $x;
              }

              private function shiftStacks() {
                  if (count($this->outbox) == 0) while (count($this->inbox) > 0) $this->outbox[] = array_pop($this->inbox);
              }

              function pop() {
                  $this->shiftStacks();
                  return array_pop($this->outbox);
              }

              function peek() {
                  $this->shiftStacks();
                  return $this->outbox[count($this->outbox) - 1];
              }

              function empty() {
                  return count($this->inbox) == 0 && count($this->outbox) == 0;
              }
          }
        `,
        ruby: code`
          class MyQueue
            def initialize
              @inbox = []
              @outbox = []
            end

            def push(x)
              @inbox.push(x)
            end

            def pop
              shift_stacks
              @outbox.pop
            end

            def peek
              shift_stacks
              @outbox.last
            end

            def empty
              @inbox.empty? && @outbox.empty?
            end

            private

            def shift_stacks
              @outbox.push(@inbox.pop) until @inbox.empty? if @outbox.empty?
            end
          end
        `,
      },
    };
  })(),

  // ── Range Sum Query - Immutable (LC 303) ──────────────────────────
  (() => {
    const run = (nums: number[], qs: number[][]) => [null, ...qs.map(([l, r]) => nums.slice(l, r + 1).reduce((s, v) => s + v, 0))];
    const ex = [
      { nums: [-3, 5, 0, 2, -6, 4], qs: [[0, 2], [2, 5], [0, 5]] },
      { nums: [7], qs: [[0, 0], [0, 0]] },
    ];
    const input = (nums: number[], qs: number[][]) => designInput(["NumArray", ...qs.map(() => "sumRange")], [[nums], ...qs]);
    return {
      slug: "range-sum-query-immutable",
      title: "Range Sum Query - Immutable",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Design", "Meta", "Amazon", "Google"],
      signature: {
        funcName: "NumArray", params: [{ name: "nums", type: "int[]" as const }], returns: "void" as const,
        methods: [{ name: "sumRange", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const }],
      },
      description: describe(
        "Given an integer array `nums`, answer many queries of the form: what is the sum of the elements of `nums` between indices `left` and `right`, inclusive? The array never changes.\n\nWrite the class `NumArray`:\n\n- `NumArray(int[] nums)` initialises the object with the array `nums`.\n- `int sumRange(int left, int right)` returns `nums[left] + nums[left + 1] + … + nums[right]`.\n\nThe judge calls the constructor and then `sumRange` with the arguments listed in the second input line; the expected output holds each call's result, `null` for the constructor.",
        [
          { in: input(ex[0].nums, ex[0].qs), out: JSON.stringify(run(ex[0].nums, ex[0].qs)), note: "-3 + 5 + 0 = 2; 0 + 2 + (-6) + 4 = 0; the whole array sums to 2." },
          { in: input(ex[1].nums, ex[1].qs), out: JSON.stringify(run(ex[1].nums, ex[1].qs)), note: "A one-element array answers every query with that element." },
        ],
        ["1 <= nums.length <= 10^4", "-10^5 <= nums[i] <= 10^5", "0 <= left <= right < nums.length", "At most 10^4 calls are made to sumRange"]),
      hints: [
        "Summing the range on every query costs O(n) per call — up to 10^8 work. Precompute something once instead.",
        "If you knew the sum of every prefix `nums[0..i-1]`, how would you get the sum of `nums[left..right]`?",
        "Store `prefix[i] = nums[0] + … + nums[i-1]` (with `prefix[0] = 0`). Then `sumRange(left, right) = prefix[right + 1] - prefix[left]`.",
      ],
      editorial: explain({
        idea: "Precompute prefix sums once in the constructor; every range sum is then the difference of two prefix sums, answered in O(1).",
        steps: [
          "In the constructor build `prefix` of length `n + 1`: `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + nums[i]`.",
          "`sumRange(left, right)` returns `prefix[right + 1] - prefix[left]`.",
        ],
        why: "`prefix[right + 1]` is the sum of `nums[0..right]` and `prefix[left]` the sum of `nums[0..left-1]`; their difference leaves exactly `nums[left..right]`. The extra leading zero makes `left = 0` need no special case.",
        time: "O(n) to build, O(1) per query",
        space: "O(n)",
        pitfalls: [
          "Off-by-one: with the leading zero the right end is `prefix[right + 1]`, not `prefix[right]`.",
          "The prefix sums stay within ±10^9 under the constraints, so 32-bit integers are enough.",
        ],
      }),
      examples: ex.map((e) => ({ input: input(e.nums, e.qs), expectedOutput: JSON.stringify(run(e.nums, e.qs)) })),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 1000, 100000]);
        const nums = randVals(rng, [1, 4, 12, 30], -top, top);
        const qs = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 15, 30])) }, () => {
          const l = ri(rng, 0, nums.length - 1);
          return [l, ri(rng, l, nums.length - 1)];
        });
        return { input: input(nums, qs), expectedOutput: JSON.stringify(run(nums, qs)) };
      },
      solutions: {
        python: code`
          from typing import List

          class NumArray:

              def __init__(self, nums: List[int]):
                  self.prefix = [0]
                  for x in nums:
                      self.prefix.append(self.prefix[-1] + x)

              def sumRange(self, left: int, right: int) -> int:
                  return self.prefix[right + 1] - self.prefix[left]
        `,
        javascript: code`
          var NumArray = function(nums) {
              this.prefix = [0];
              for (var i = 0; i < nums.length; i++) this.prefix.push(this.prefix[i] + nums[i]);
          };

          NumArray.prototype.sumRange = function(left, right) {
              return this.prefix[right + 1] - this.prefix[left];
          };
        `,
        typescript: code`
          class NumArray {
              prefix: number[];

              constructor(nums: number[]) {
                  this.prefix = [0];
                  for (var i = 0; i < nums.length; i++) this.prefix.push(this.prefix[i] + nums[i]);
              }

              sumRange(left: number, right: number): number {
                  return this.prefix[right + 1] - this.prefix[left];
              }
          }
        `,
        java: code`
          class NumArray {
              private int[] prefix;

              public NumArray(int[] nums) {
                  prefix = new int[nums.length + 1];
                  for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
              }

              public int sumRange(int left, int right) {
                  return prefix[right + 1] - prefix[left];
              }
          }
        `,
        cpp: code`
          class NumArray {
              vector<int> prefix;
          public:
              NumArray(vector<int>& nums) : prefix(nums.size() + 1, 0) {
                  for (size_t i = 0; i < nums.size(); i++) prefix[i + 1] = prefix[i] + nums[i];
              }

              int sumRange(int left, int right) {
                  return prefix[right + 1] - prefix[left];
              }
          };
        `,
        c: code`
          typedef struct {
              int* prefix;
          } NumArray;

          NumArray* numArrayCreate(int* nums, int numsSize) {
              NumArray* o = (NumArray*)malloc(sizeof(NumArray));
              o->prefix = (int*)malloc((numsSize + 1) * sizeof(int));
              o->prefix[0] = 0;
              for (int i = 0; i < numsSize; i++) o->prefix[i + 1] = o->prefix[i] + nums[i];
              return o;
          }

          int numArraySumRange(NumArray* obj, int left, int right) {
              return obj->prefix[right + 1] - obj->prefix[left];
          }

          void numArrayFree(NumArray* obj) {
              free(obj->prefix);
              free(obj);
          }
        `,
        csharp: code`
          public class NumArray {
              private int[] prefix;

              public NumArray(int[] nums) {
                  prefix = new int[nums.Length + 1];
                  for (int i = 0; i < nums.Length; i++) prefix[i + 1] = prefix[i] + nums[i];
              }

              public int SumRange(int left, int right) {
                  return prefix[right + 1] - prefix[left];
              }
          }
        `,
        go: code`
          type NumArray struct {
          	prefix []int
          }

          func Constructor(nums []int) NumArray {
          	prefix := make([]int, len(nums)+1)
          	for i, x := range nums {
          		prefix[i+1] = prefix[i] + x
          	}
          	return NumArray{prefix: prefix}
          }

          func (this *NumArray) SumRange(left int, right int) int {
          	return this.prefix[right+1] - this.prefix[left]
          }
        `,
        kotlin: code`
          class NumArray(nums: IntArray) {
              private val prefix = IntArray(nums.size + 1)

              init {
                  for (i in nums.indices) prefix[i + 1] = prefix[i] + nums[i]
              }

              fun sumRange(left: Int, right: Int): Int = prefix[right + 1] - prefix[left]
          }
        `,
        swift: code`
          class NumArray {
              var prefix: [Int]

              init(_ nums: [Int]) {
                  prefix = [0]
                  for x in nums { prefix.append(prefix[prefix.count - 1] + x) }
              }

              func sumRange(_ left: Int, _ right: Int) -> Int {
                  return prefix[right + 1] - prefix[left]
              }
          }
        `,
        rust: code`
          struct NumArray {
              prefix: Vec<i32>,
          }

          impl NumArray {
              fn new(nums: Vec<i32>) -> Self {
                  let mut prefix = vec![0; nums.len() + 1];
                  for i in 0..nums.len() { prefix[i + 1] = prefix[i] + nums[i]; }
                  NumArray { prefix }
              }

              fn sumRange(&mut self, left: i32, right: i32) -> i32 {
                  self.prefix[right as usize + 1] - self.prefix[left as usize]
              }
          }
        `,
        php: code`
          class NumArray {
              private $prefix;

              function __construct($nums) {
                  $this->prefix = [0];
                  foreach ($nums as $i => $x) $this->prefix[] = $this->prefix[$i] + $x;
              }

              function sumRange($left, $right) {
                  return $this->prefix[$right + 1] - $this->prefix[$left];
              }
          }
        `,
        ruby: code`
          class NumArray
            def initialize(nums)
              @prefix = [0]
              nums.each { |x| @prefix << @prefix[-1] + x }
            end

            def sumRange(left, right)
              @prefix[right + 1] - @prefix[left]
            end
          end
        `,
      },
    };
  })(),

];

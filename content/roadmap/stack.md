---
title: Stack Data Structure
stage: stacks
order: 2
minutes: 14
level: Beginner
hub: stack
practice: valid-parentheses, baseball-game, remove-all-adjacent-duplicates, backspace-string-compare, evaluate-reverse-polish-notation, simplify-path, asteroid-collision, decode-string
updated: 2026-10-03
seo-title: Stack Data Structure: LIFO, Operations and Patterns
description: Learn the stack: LIFO, why push and pop are O(1), valid parentheses, postfix evaluation and a min stack, with code in C++, Java, Python and JavaScript.
question: What is a stack data structure?
answer: A stack is a collection where the last item added is the first one removed — last in, first out (LIFO). It supports push (add on top), pop (remove the top) and peek (read the top), each in O(1) time, usually on a dynamic array. Stacks solve problems where the most recent unfinished item must be dealt with first: brackets, expressions, undo.
q: What is LIFO in a stack?
a: LIFO stands for last in, first out: the item pushed most recently is the first one popped, like a pile of plates where you only ever touch the top plate. A queue is the opposite, first in, first out (FIFO), where the oldest item leaves first.
q: Why are push and pop O(1)?
a: An array-backed stack only ever touches its last slot: push writes one past the current top and pop removes the top, so no other element moves. When the array is full it grows by a constant factor and copies everything, which is O(n) once in a while but O(1) amortised per push, because the copies add up to less than twice the number of pushes.
q: Should I use Stack or ArrayDeque in Java?
a: Use ArrayDeque through the Deque interface: push, pop and peek work on its front. The old java.util.Stack extends Vector, so every call is synchronised and it exposes index methods such as get and add(index, x) that break the last-in-first-out rule. Its own documentation recommends Deque instead.
q: How do you check for balanced parentheses using a stack?
a: Scan the string left to right. Push every opening bracket. On a closing bracket, the stack's top must be its matching opener; if the stack is empty or the top is a different bracket, the string is invalid, otherwise pop. At the end the string is valid only if the stack is empty. It takes O(n) time and O(n) space.
q: What is the difference between a stack and the call stack?
a: The call stack is a stack the runtime keeps for you: each function call pushes a frame holding its arguments, local variables and return address, and each return pops it. That is why the most recent call always finishes first, and why recursion that goes too deep overflows it.
---
A **stack** is a pile: you add items on top and take them off the top, so the last item put on is the first one back. That rule is **last in, first out**, or LIFO. It sounds like a limitation, but it is exactly the order a whole family of problems needs: the bracket opened most recently must be closed first, the function called most recently must return first, and undo takes back the newest edit.

## Why last in, first out

Is a string of brackets such as `{[()]}([)]` correctly nested? Counting is not enough: `([)]` has one of each, yet the pairs cross. Deleting adjacent matching pairs until none are left works, but a deeply nested string loses one pair per O(n) sweep — around 5 × 10⁹ steps for n = 100,000. The insight is that a closer may only match the **most recent opener not yet matched**, and "most recent first" is a stack.

@figure nesting

The same shape appears whenever work is **nested** or **interrupted**: an inner expression before the outer one, a call before its caller, the newest edit before older ones.

## How a stack is stored

The usual implementation is a dynamic array plus a count, with the bottom at index 0 and the top in the last used slot. Push, pop and peek each touch that one slot, which is why they are O(1).

@figure push-pop

When the array is full, it is replaced by one a constant factor larger and everything is copied across. That push costs O(n), but the copies are rare enough that a push is **O(1) amortised**: constant on average over any sequence.

@figure growth

A stack can also be a [linked list](/roadmap/linked-list) whose head is the top: O(1) in the worst case, but every push allocates a node, so the array is usually faster.

## The operations and their cost

Push, pop, peek and the size check are all O(1); searching for a value is O(n). A stack offers nothing else on purpose.

| Language | Stack type | push | pop | peek | empty? |
| --- | --- | --- | --- | --- | --- |
| C++ | `std::stack<T>` or `std::vector<T>` | `push(x)` / `push_back(x)` | `pop()` / `pop_back()` | `top()` / `back()` | `empty()` |
| Java | `Deque<T> s = new ArrayDeque<>()` | `push(x)` | `pop()` | `peek()` | `isEmpty()` |
| Python | `list` | `append(x)` | `pop()` | `s[-1]` | `not s` |
| JavaScript | `Array` | `push(x)` | `pop()` | `s[s.length - 1]` | `s.length === 0` |

In C++, `pop()` returns nothing, so read `top()` first. In Java, use `ArrayDeque`: the old `java.util.Stack` takes a lock on every call and lets code index into the middle. In Python never use `pop(0)`, which shifts every element, and in JavaScript remember that `pop()` on an empty array quietly returns `undefined`.

## The call stack

You have used a stack in every program you have written. Each function call pushes a **stack frame** holding its arguments, local variables and the place to return to; each return pops it.

@figure call-stack

The call stack has a fixed size, so recursion 100,000 levels deep can overflow it (Python stops at about 1,000). Any recursive algorithm can push and pop its own stack in heap memory instead — see [Recursion](/roadmap/recursion) and [Depth-First Search](/roadmap/depth-first-search).

## Matching brackets: valid parentheses

[Valid Parentheses](/problems/valid-parentheses) is the stack's signature problem. Read the string left to right with a stack of openers still waiting for a partner:

- An **opener** is pushed.
- A **closer** must match the opener on top. An empty stack or a different opener means invalid; otherwise pop.
- At the end the stack must be **empty**; anything left was never closed.

@walkthrough

### Why the top is the only candidate

If `)` arrives while `[` is on top, could it close a `(` deeper down? No: the `[` was opened inside that `(` and must close first. So the invariant is: *after each character, the stack holds exactly the unmatched openers, oldest at the bottom*. Every push or pop keeps it, and the string is valid exactly when the stack ends empty with no closer rejected. Each character is pushed and popped at most once: O(n) time and space.

### The code

The program checks five strings: two valid, one with crossing pairs, one with an opener never closed and one with a closer that has nothing to close.

```cpp
#include <iostream>
#include <stack>
#include <string>
#include <vector>
using namespace std;

// The opener a closing bracket must match, or 0 if c is not a closer.
char openerFor(char c) {
    if (c == ')') return '(';
    if (c == ']') return '[';
    if (c == '}') return '{';
    return 0;
}

bool isValid(const string& s) {
    stack<char> openers;  // openers still waiting for their partner
    for (char c : s) {
        char need = openerFor(c);
        if (need == 0) {
            openers.push(c);  // an opener: wait on the stack
        } else {
            if (openers.empty() || openers.top() != need) return false;  // nothing to close, or pairs cross
            openers.pop();    // matched the most recent opener
        }
    }
    return openers.empty();  // anything left was never closed
}

int main() {
    vector<string> tests = {"()[]{}", "{[()]}", "{[()]}([)]", "(()", "())"};
    for (const string& s : tests) {
        cout << s << " -> " << (isValid(s) ? "valid" : "invalid") << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    // The opener a closing bracket must match, or 0 if c is not a closer.
    static char openerFor(char c) {
        if (c == ')') return '(';
        if (c == ']') return '[';
        if (c == '}') return '{';
        return 0;
    }

    static boolean isValid(String s) {
        Deque<Character> openers = new ArrayDeque<>();  // openers still waiting for their partner
        for (char c : s.toCharArray()) {
            char need = openerFor(c);
            if (need == 0) {
                openers.push(c);  // an opener: wait on the stack
            } else {
                if (openers.isEmpty() || openers.peek() != need) return false;  // nothing to close, or pairs cross
                openers.pop();    // matched the most recent opener
            }
        }
        return openers.isEmpty();  // anything left was never closed
    }

    public static void main(String[] args) {
        String[] tests = {"()[]{}", "{[()]}", "{[()]}([)]", "(()", "())"};
        for (String s : tests) {
            System.out.println(s + " -> " + (isValid(s) ? "valid" : "invalid"));
        }
    }
}
```

```python
OPENER_FOR = {")": "(", "]": "[", "}": "{"}  # the opener each closer must match


def is_valid(s):
    openers = []  # openers still waiting for their partner
    for c in s:
        need = OPENER_FOR.get(c)
        if need is None:
            openers.append(c)  # an opener: wait on the stack
        else:
            if not openers or openers[-1] != need:
                return False   # nothing to close, or the pairs cross
            openers.pop()      # matched the most recent opener
    return not openers         # anything left was never closed


tests = ["()[]{}", "{[()]}", "{[()]}([)]", "(()", "())"]
for s in tests:
    print(f"{s} -> {'valid' if is_valid(s) else 'invalid'}")
```

```javascript
const OPENER_FOR = { ")": "(", "]": "[", "}": "{" }; // the opener each closer must match

function isValid(s) {
  const openers = []; // openers still waiting for their partner
  for (const c of s) {
    const need = OPENER_FOR[c];
    if (need === undefined) {
      openers.push(c); // an opener: wait on the stack
    } else {
      if (openers.length === 0 || openers[openers.length - 1] !== need) return false; // nothing to close, or pairs cross
      openers.pop(); // matched the most recent opener
    }
  }
  return openers.length === 0; // anything left was never closed
}

const tests = ["()[]{}", "{[()]}", "{[()]}([)]", "(()", "())"];
for (const s of tests) {
  console.log(`${s} -> ${isValid(s) ? "valid" : "invalid"}`);
}
```

```output
()[]{} -> valid
{[()]} -> valid
{[()]}([)] -> invalid
(() -> invalid
()) -> invalid
```

## Evaluating postfix expressions

In **postfix** notation, or **reverse Polish notation** (RPN), the operator comes after its operands: `2 1 + 3 *` is `(2 + 1) × 3`. It needs no brackets and no precedence, because the order of the tokens is the order of the work. A number is pushed; an operator pops two values and pushes the result; the one value left is the answer.

@figure rpn

### The code

The third expression divides 6 by −132, which catches Python and JavaScript: [Evaluate Reverse Polish Notation](/problems/evaluate-reverse-polish-notation) truncates towards zero, giving 0 and a final answer of 22, but Python's `//` floors to −1 and JavaScript's `/` gives a fraction. So Python uses `int(a / b)` and JavaScript `Math.trunc`; C++ and Java already truncate.

```cpp
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int evalRPN(const string& expr) {
    vector<int> stack;
    istringstream in(expr);
    string tok;
    while (in >> tok) {
        if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
            int b = stack.back(); stack.pop_back();  // the right operand is on top
            int a = stack.back(); stack.pop_back();
            if (tok == "+") stack.push_back(a + b);
            else if (tok == "-") stack.push_back(a - b);
            else if (tok == "*") stack.push_back(a * b);
            else stack.push_back(a / b);  // C++ integer division truncates towards zero
        } else {
            stack.push_back(stoi(tok));   // a number, possibly negative such as -11
        }
    }
    return stack.back();
}

int main() {
    vector<string> tests = {"2 1 + 3 *", "4 13 5 / +", "10 6 9 3 + -11 * / * 17 + 5 +"};
    for (const string& expr : tests) cout << expr << " = " << evalRPN(expr) << "\n";
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    static int evalRPN(String expr) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String tok : expr.split(" ")) {
            if (tok.equals("+") || tok.equals("-") || tok.equals("*") || tok.equals("/")) {
                int b = stack.pop();  // the right operand is on top
                int a = stack.pop();
                if (tok.equals("+")) stack.push(a + b);
                else if (tok.equals("-")) stack.push(a - b);
                else if (tok.equals("*")) stack.push(a * b);
                else stack.push(a / b);  // Java integer division truncates towards zero
            } else {
                stack.push(Integer.parseInt(tok));  // a number, possibly negative such as -11
            }
        }
        return stack.pop();
    }

    public static void main(String[] args) {
        String[] tests = {"2 1 + 3 *", "4 13 5 / +", "10 6 9 3 + -11 * / * 17 + 5 +"};
        for (String expr : tests) System.out.println(expr + " = " + evalRPN(expr));
    }
}
```

```python
def eval_rpn(expr):
    stack = []
    for tok in expr.split():
        if tok in ("+", "-", "*", "/"):
            b = stack.pop()  # the right operand is on top
            a = stack.pop()
            if tok == "+":
                stack.append(a + b)
            elif tok == "-":
                stack.append(a - b)
            elif tok == "*":
                stack.append(a * b)
            else:
                stack.append(int(a / b))  # truncate towards zero; a // b would floor
        else:
            stack.append(int(tok))  # a number, possibly negative such as -11
    return stack.pop()


tests = ["2 1 + 3 *", "4 13 5 / +", "10 6 9 3 + -11 * / * 17 + 5 +"]
for expr in tests:
    print(f"{expr} = {eval_rpn(expr)}")
```

```javascript
function evalRPN(expr) {
  const stack = [];
  for (const tok of expr.split(" ")) {
    if (tok === "+" || tok === "-" || tok === "*" || tok === "/") {
      const b = stack.pop(); // the right operand is on top
      const a = stack.pop();
      if (tok === "+") stack.push(a + b);
      else if (tok === "-") stack.push(a - b);
      else if (tok === "*") stack.push(a * b);
      else stack.push(Math.trunc(a / b)); // truncate towards zero, as the problem asks
    } else {
      stack.push(Number(tok)); // a number, possibly negative such as -11
    }
  }
  return stack.pop();
}

const tests = ["2 1 + 3 *", "4 13 5 / +", "10 6 9 3 + -11 * / * 17 + 5 +"];
for (const expr of tests) console.log(`${expr} = ${evalRPN(expr)}`);
```

```output
2 1 + 3 * = 9
4 13 5 / + = 6
10 6 9 3 + -11 * / * 17 + 5 + = 22
```

Turning infix into postfix is itself a stack algorithm, Dijkstra's **shunting-yard**: practise it on [Infix to Postfix](/problems/infix-to-postfix). [Basic Calculator II](/problems/basic-calculator-ii) evaluates infix directly by pushing terms and folding `×` and `/` into the top.

## A stack that knows its minimum

Build a stack with push, pop, top and **getMin**, all O(1). Scanning for the minimum is O(n), and one variable for "the minimum" fails as soon as the minimum is popped. Instead, let every entry remember the minimum of itself and everything below it.

@figure min-stack

It works because a stack only changes at the top: while an entry is on the stack nothing below it can change, so the minimum it recorded stays true until it is popped. A space-saving variant keeps a second stack of minimums, pushing when a value is **less than or equal to** its top — the "or equal" keeps duplicates.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// Each entry stores its value and the minimum of itself and everything below it.
class MinStack {
    vector<pair<int, int>> entries;  // (value, minimum so far)
public:
    void push(int x) {
        int m = entries.empty() ? x : min(x, entries.back().second);
        entries.push_back({x, m});
    }
    void pop() { entries.pop_back(); }
    int top() const { return entries.back().first; }
    int getMin() const { return entries.back().second; }  // O(1): already recorded
};

int main() {
    MinStack s;
    for (int x : {5, 3, 7, 3, 1}) {
        s.push(x);
        cout << "push " << x << " -> min " << s.getMin() << "\n";
    }
    for (int i = 0; i < 4; i++) {
        int x = s.top();
        s.pop();
        cout << "pop " << x << " -> min " << s.getMin() << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    // Each entry stores its value and the minimum of itself and everything below it.
    static class MinStack {
        private final Deque<int[]> entries = new ArrayDeque<>();  // {value, minimum so far}

        void push(int x) {
            int m = entries.isEmpty() ? x : Math.min(x, entries.peek()[1]);
            entries.push(new int[] {x, m});
        }
        void pop() { entries.pop(); }
        int top() { return entries.peek()[0]; }
        int getMin() { return entries.peek()[1]; }  // O(1): already recorded
    }

    public static void main(String[] args) {
        MinStack s = new MinStack();
        for (int x : new int[] {5, 3, 7, 3, 1}) {
            s.push(x);
            System.out.println("push " + x + " -> min " + s.getMin());
        }
        for (int i = 0; i < 4; i++) {
            int x = s.top();
            s.pop();
            System.out.println("pop " + x + " -> min " + s.getMin());
        }
    }
}
```

```python
class MinStack:
    """Each entry stores its value and the minimum of itself and everything below it."""

    def __init__(self):
        self.entries = []  # (value, minimum so far)

    def push(self, x):
        m = x if not self.entries else min(x, self.entries[-1][1])
        self.entries.append((x, m))

    def pop(self):
        self.entries.pop()

    def top(self):
        return self.entries[-1][0]

    def get_min(self):
        return self.entries[-1][1]  # O(1): already recorded


s = MinStack()
for x in [5, 3, 7, 3, 1]:
    s.push(x)
    print(f"push {x} -> min {s.get_min()}")
for _ in range(4):
    x = s.top()
    s.pop()
    print(f"pop {x} -> min {s.get_min()}")
```

```javascript
// Each entry stores its value and the minimum of itself and everything below it.
class MinStack {
  constructor() {
    this.entries = []; // [value, minimum so far]
  }
  push(x) {
    const m = this.entries.length === 0 ? x : Math.min(x, this.entries[this.entries.length - 1][1]);
    this.entries.push([x, m]);
  }
  pop() {
    this.entries.pop();
  }
  top() {
    return this.entries[this.entries.length - 1][0];
  }
  getMin() {
    return this.entries[this.entries.length - 1][1]; // O(1): already recorded
  }
}

const s = new MinStack();
for (const x of [5, 3, 7, 3, 1]) {
  s.push(x);
  console.log(`push ${x} -> min ${s.getMin()}`);
}
for (let i = 0; i < 4; i++) {
  const x = s.top();
  s.pop();
  console.log(`pop ${x} -> min ${s.getMin()}`);
}
```

```output
push 5 -> min 5
push 3 -> min 3
push 7 -> min 3
push 3 -> min 3
push 1 -> min 1
pop 1 -> min 3
pop 3 -> min 3
pop 7 -> min 3
pop 3 -> min 5
```

## Undo, backspace and other stack shapes

- **Undo and redo**: undo pops the newest action; redo is a second stack. Browser back and forward work the same way.
- **Backspace**: typing pushes and backspace pops, as in [Backspace String Compare](/problems/backspace-string-compare).
- **Cancelling neighbours**: a letter equal to the top cancels it in [Remove All Adjacent Duplicates In String](/problems/remove-all-adjacent-duplicates); [Asteroid Collision](/problems/asteroid-collision) is the same with a fight.
- **Paths and nested state**: [Simplify Path](/problems/simplify-path) pops on `..`, and [Decode String](/problems/decode-string) pushes its state at `[`.

When the question is "the **next greater** or **previous smaller** element", the stack is kept sorted and becomes the [monotonic stack](/roadmap/monotonic-stack).

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Valid parentheses | Delete matched pairs until none are left | O(n²) | O(n) |
| Valid parentheses | One pass with a stack of openers | O(n) | O(n) |
| Postfix evaluation | One pass with a stack of values | O(n) | O(n) |
| Min stack | Scan for the minimum on each getMin | O(n) per getMin | O(1) |
| Min stack | Store the minimum with each entry | O(1) per operation | O(n) |

Behind every O(n) row: each element is pushed at most once and popped at most once, so there are at most 2n stack operations in all.

## How to recognise a stack problem

- **Nesting**: brackets, tags, expressions such as `3[a2[c]]`, directories.
- **The most recent item decides**: the last unmatched opener, the previous score, the newest edit.
- **Cancelling or collapsing neighbours**: removals that bring older items back together.
- **Expressions** to evaluate or convert.
- **Undo**, **back**, or recursion you need to make iterative.

## Common mistakes

- **Popping or peeking an empty stack**: a closer with nothing to close must return "invalid", not crash.
- **Forgetting the final check**: `(((` never fails on the way through; the stack must end empty.
- **Popping operands in the wrong order**: the first pop is the right operand.
- **Floor division in Python**: `-7 // 2` is −4, not −3.
- **Using `java.util.Stack`**: use `ArrayDeque` through `Deque`.
- **Losing duplicates in a min stack**: push on `<=`, not just `<`.

## Practice in this order

1. [Valid Parentheses](/problems/valid-parentheses): the walkthrough above.
2. [Baseball Game](/problems/baseball-game): a stack as a record you add to and cancel from.
3. [Remove All Adjacent Duplicates In String](/problems/remove-all-adjacent-duplicates): cancel the top when the new item matches it.
4. [Backspace String Compare](/problems/backspace-string-compare): typing and backspace as push and pop.
5. [Evaluate Reverse Polish Notation](/problems/evaluate-reverse-polish-notation): the second program, with its division rule.
6. [Simplify Path](/problems/simplify-path): a stack of directory names, popped on `..`.
7. [Asteroid Collision](/problems/asteroid-collision): a new item may destroy several before it settles.
8. [Decode String](/problems/decode-string): push the state at `[`, rebuild it at `]`.

The [stack problem list](/challenges/stack) has every stack problem in the catalogue. Next in this stage is the stack's mirror image, the [queue](/roadmap/queue), and after it the [monotonic stack](/roadmap/monotonic-stack).

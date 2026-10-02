---
title: Stack Data Structure
stage: stacks
order: 2
minutes: 20
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
A **stack** is a pile. You add items on top, and you take items off the top, so the last item you put on is the first one you get back. That rule is called **last in, first out**, or LIFO. It sounds like a limitation, but it is exactly the order a whole family of problems needs: the bracket opened most recently must be closed first, the function called most recently must return first, the edit made most recently is the one "undo" takes back.

This lesson shows how a stack is stored and why its operations cost O(1), how each language spells it (and why Java's `Stack` class is the wrong choice), and the patterns that turn up in interviews: matching brackets, evaluating postfix expressions, a stack that knows its minimum, and undo. Every example is a whole program in C++, Java, Python and JavaScript.

## Why last in, first out

Take a classic question: is a string of brackets such as `{[()]}([)]` correctly nested? Counting is not enough: `([)]` has one of each opener and closer, yet the pairs cross, so it is invalid. A correct brute force repeatedly deletes adjacent matching pairs — `()`, `[]`, `{}` — until none are left, and checks whether the string is empty. Each sweep is O(n), and a deeply nested string loses only one pair per sweep, so up to n / 2 sweeps are needed. For n = 100,000 that is around 5 × 10⁹ character steps, far over a one-second limit.

The brute force is slow because it keeps re-reading the parts it has already understood. Look at what it is really doing: when it sees a closer, the only opener that may match it is the **most recent one not yet matched**. Everything older must wait until that one is closed. "Most recent first" is LIFO, so a stack holds exactly the right information: the openers still waiting, newest on top. One pass, O(n).

The same shape appears whenever work is **nested** or **interrupted**: an inner expression must be finished before the outer one, a function call before its caller, the newest edit before the older ones. Spotting it is most of the skill.

## How a stack is stored

The usual implementation is a dynamic array plus a count. The bottom of the stack is index 0, and the top is the last used slot.

```text
 push 4, push 7, push 2:

 index:   0   1   2   3   4
 data:  [ 4,  7,  2,  _,  _ ]      size = 3, top = data[size - 1] = 2
                  ^
                 top

 pop  -> returns 2, size = 2       (the slot is simply reused later)
 push 9 -> data[2] = 9, size = 3
```

- **Push** writes the value into `data[size]` and adds one to `size`.
- **Pop** subtracts one from `size` and returns `data[size]`.
- **Peek** reads `data[size - 1]` without changing anything.

None of these touches any other element, which is why they are O(1). Compare inserting at the front of an array, which shifts all n elements: a stack only ever works at the end that is cheap.

When the array fills up, it is replaced by one a constant factor larger (1.5 or 2 times, depending on the library) and the elements are copied across. That one push costs O(n), but it happens so rarely that it averages out: with doubling, the copies over n pushes total 1 + 2 + 4 + … + n, which is less than 2n. So a push is **O(1) amortised** — constant on average over any sequence of operations, even though an individual push is occasionally slow.

A stack can also be a singly [linked list](/roadmap/linked-list) whose head is the top: push inserts a node at the front, pop removes the first node. Both are O(1) in the worst case, not just amortised, but every push allocates a node, so in practice the array version is faster.

## The operations and their cost

| Operation | What it does | Time |
| --- | --- | --- |
| push(x) | put x on top | O(1) amortised |
| pop() | remove and return the top | O(1) |
| peek() / top() | read the top without removing it | O(1) |
| isEmpty(), size() | how many items there are | O(1) |
| search for a value | look through every item | O(n) |

A stack deliberately offers nothing else. If you find yourself wanting the third item from the top, you probably need a different structure — or a different idea.

### Stacks in each language

| Language | Stack type | push | pop | peek | empty? |
| --- | --- | --- | --- | --- | --- |
| C++ | `std::stack<T>` or `std::vector<T>` | `push(x)` / `push_back(x)` | `pop()` / `pop_back()` | `top()` / `back()` | `empty()` |
| Java | `Deque<T> s = new ArrayDeque<>()` | `push(x)` | `pop()` | `peek()` | `isEmpty()` |
| Python | `list` | `append(x)` | `pop()` | `s[-1]` | `not s` |
| JavaScript | `Array` | `push(x)` | `pop()` | `s[s.length - 1]` | `s.length === 0` |

A few details matter in real code:

- In **C++**, `std::stack` is an adapter over `std::deque` by default, and its `pop()` returns nothing — read `top()` first, then `pop()`. Calling either on an empty stack is undefined behaviour, so check `empty()` first. Many people simply use a `vector`.
- In **Java**, use `ArrayDeque`. The old `java.util.Stack` extends `Vector`: its methods are synchronised, so each call takes a lock you do not need, and it inherits index methods such as `get(i)` and `add(i, x)` that let code reach into the middle and break the LIFO rule. Its own documentation says to prefer `Deque`. `ArrayDeque.pop()` throws on an empty stack, while `peek()` returns null, and it cannot store null.
- In **Python**, a plain list is the stack: `append` and `pop()` work at the end in O(1). Never use `pop(0)` or `insert(0, x)` for a stack — those shift every element.
- In **JavaScript**, an array's `push` and `pop` are the stack. `pop()` on an empty array quietly returns `undefined` rather than failing, so check the length when an empty stack would be a bug.

## The call stack

You have used a stack in every program you have written. When a function is called, the runtime pushes a **stack frame** holding its arguments, its local variables and the place to return to. When it returns, the frame is popped and execution carries on in the caller. The most recent call always finishes first: last in, first out.

This explains two things you will meet later. First, recursion is a stack in disguise: every recursive call is a push, every return a pop. Second, the call stack has a fixed size, so recursion that goes 100,000 levels deep can crash with a stack overflow (Python stops at about 1,000 levels by default). Any recursive algorithm can be rewritten as a loop that pushes and pops its own stack in heap memory, which has no such limit. Depth-first search is the usual example — see [Recursion](/roadmap/recursion) and [Depth-First Search](/roadmap/depth-first-search).

## Matching brackets: valid parentheses

The problem from the start of the lesson: given a string of `()[]{}`, decide whether every bracket is closed by the right partner in the right order. This is [Valid Parentheses](/problems/valid-parentheses), and it is the stack's signature problem.

Read the string left to right and keep a stack of the openers that are still waiting for a partner:

- An **opener** is pushed. It waits on the stack until its partner arrives.
- A **closer** must match the opener on top. If the stack is empty, there is nothing for it to close: invalid. If the top is a different kind of opener, the pairs cross: invalid. Otherwise pop the top — that pair is done.
- At the end, the stack must be **empty**. Anything left is an opener that was never closed.

@walkthrough

### Why the top is the only candidate

Suppose a closer `)` arrives and the top of the stack is `[`. Could the `)` legitimately close some `(` deeper down? No: the `[` was opened after that `(`, so it sits inside it, and an inner bracket must be closed before its outer one. Closing the `(` now would leave the `[` straddling the boundary, which is exactly what "crossing" means. So the most recent unmatched opener is the only one a closer can match, and the stack keeps that opener on top at all times.

That gives the invariant: *after reading each character, the stack holds precisely the openers read so far that have not been matched, oldest at the bottom*. It is true at the start (empty), each push or pop keeps it true, and at the end the string is valid exactly when that set is empty and no closer was rejected on the way. Each character is pushed at most once and popped at most once, so the pass is O(n) time and O(n) space in the worst case, a string of all openers.

### Dry run

The string `{[()]}([)]`, as in the figure above:

| i | Char | Top before | Action | Stack after (bottom → top) |
| --- | --- | --- | --- | --- |
| 0 | { | — | opener, push | { |
| 1 | [ | { | opener, push | { [ |
| 2 | ( | [ | opener, push | { [ ( |
| 3 | ) | ( | matches, pop | { [ |
| 4 | ] | [ | matches, pop | { |
| 5 | } | { | matches, pop | empty |
| 6 | ( | — | opener, push | ( |
| 7 | [ | ( | opener, push | ( [ |
| 8 | ) | [ | needs ( but top is [: invalid | stop |

The first six characters balance on their own; the last four cross, and the scan stops at index 8 without reading the rest.

### The code

The program assumes the string holds only bracket characters, as the problem promises, and checks five strings: two valid, one with crossing pairs, one with an opener never closed and one with a closer that has nothing to close.

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

In ordinary **infix** notation the operator sits between its operands, `(2 + 1) × 3`, and you need brackets and precedence rules to know what to do first. In **postfix** notation, also called **reverse Polish notation** (RPN), the operator comes after its operands: `2 1 + 3 *`. Postfix needs no brackets and no precedence at all, because the order of the tokens is the order of the work. Compilers and old calculators use it for exactly that reason.

A stack evaluates it in one pass:

- A **number** is pushed.
- An **operator** pops two values, applies itself, and pushes the result.
- At the end, the one value left on the stack is the answer.

Why does this work? Each operator applies to the two most recent results that have not been used yet — which are the top two items of the stack. A sub-expression such as `13 5 /` collapses into a single value on the stack, and from then on the rest of the expression treats it like any number.

The one trap is **operand order**. The first value popped is the *right* operand, the second is the *left*: for `13 5 /` you pop 5, then 13, and compute 13 / 5. Getting this backwards does not matter for `+` and `×`, which is why it slips through simple tests, but it breaks `-` and `/`.

### Dry run

`4 13 5 / +`, which is 4 + 13 / 5 in infix:

| Token | Action | Stack after (bottom → top) |
| --- | --- | --- |
| 4 | push | 4 |
| 13 | push | 4, 13 |
| 5 | push | 4, 13, 5 |
| / | pop b = 5, pop a = 13, push 13 / 5 = 2 | 4, 2 |
| + | pop b = 2, pop a = 4, push 4 + 2 = 6 | 6 |

The answer is 6. Division here **truncates towards zero**, as [Evaluate Reverse Polish Notation](/problems/evaluate-reverse-polish-notation) specifies.

### The code

The third expression is the one that catches Python and JavaScript programmers: it divides 6 by −132. Truncating gives 0 and the answer is 22. Python's `//` floors instead, giving −1 and a final answer of 12; JavaScript's `/` gives a fraction. So Python uses `int(a / b)` (exact while the values stay below 2⁵³, as they do here) and JavaScript uses `Math.trunc`. C++ and Java integer division already truncates.

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

Turning infix into postfix is itself a stack algorithm, Dijkstra's **shunting-yard**: operands go straight to the output, and operators wait on a stack until an operator of lower precedence or a closing bracket releases them. Practise it on [Infix to Postfix](/problems/infix-to-postfix); [Basic Calculator II](/problems/basic-calculator-ii) evaluates infix directly by pushing terms and folding `×` and `/` into the top as they arrive.

## A stack that knows its minimum

A classic design question: build a stack that supports push, pop, top and **getMin**, all in O(1). Scanning the stack for the minimum is O(n). Keeping one variable for "the minimum" fails as soon as the minimum is popped, because you no longer know the next smallest.

The fix is to let every entry remember the minimum **of itself and everything below it**. On push, that is the smaller of the new value and the minimum stored in the entry below. On pop, nothing needs recomputing: the entry that becomes the top already recorded the minimum of everything still on the stack.

It works because a stack only ever changes at the top. While an entry is on the stack, nothing below it can change, so the minimum it recorded when it was pushed stays true until the moment it is popped.

| Operation | Entry pushed (value, min so far) | Stack (bottom → top) | getMin |
| --- | --- | --- | --- |
| push 5 | (5, 5) | (5,5) | 5 |
| push 3 | (3, 3) | (5,5) (3,3) | 3 |
| push 7 | (7, 3) | (5,5) (3,3) (7,3) | 3 |
| push 3 | (3, 3) | (5,5) (3,3) (7,3) (3,3) | 3 |
| push 1 | (1, 1) | … (3,3) (1,1) | 1 |
| pop | — | (5,5) (3,3) (7,3) (3,3) | 3 |
| pop ×3 | — | (5,5) | 5 |

A common space-saving variant keeps a second stack holding only the minimums, pushing to it when a new value is **less than or equal to** its top and popping from it when the popped value equals its top. The "or equal" matters: with two 3s on the stack, popping one must not forget the other.

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

Once you see the stack as "the unfinished work, newest on top", it turns up in many disguises:

- **Undo.** An editor pushes every action; undo pops the newest and reverses it. Redo is a second stack that receives what undo popped and is cleared by any new action. A browser's back and forward buttons are the same two stacks.
- **Backspace.** Typing pushes a character and backspace pops one, so the stack ends as the visible text. [Backspace String Compare](/problems/backspace-string-compare) is this, twice; [Removing Stars From a String](/problems/removing-stars-from-a-string) is the same with a different key.
- **Cancelling neighbours.** In [Remove All Adjacent Duplicates In String](/problems/remove-all-adjacent-duplicates), a new letter equal to the top cancels it, and removing a pair can bring two older letters together — which is exactly what comparing with the new top handles. [Asteroid Collision](/problems/asteroid-collision) is the same idea with a fight instead of a match.
- **A record you can amend.** [Baseball Game](/problems/baseball-game) keeps scores on a stack because its operations only ever look at, double, add or cancel the most recent scores.
- **Paths.** [Simplify Path](/problems/simplify-path) pushes each directory name and pops on `..`, so the stack is the current location.
- **Nested state.** [Decode String](/problems/decode-string) pushes the count and the string built so far at each `[`, and pops them at `]` to repeat the inner part — the explicit-stack version of a recursive parser.

When the question becomes "for each element, the **next greater** or **previous smaller** element", the stack is kept in sorted order and gets a name of its own, the [monotonic stack](/roadmap/monotonic-stack).

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Valid parentheses | Delete matched pairs until none are left | O(n²) | O(n) |
| Valid parentheses | One pass with a stack of openers | O(n) | O(n) |
| Postfix evaluation | One pass with a stack of values | O(n) | O(n) |
| Min stack | Scan for the minimum on each getMin | O(n) per getMin | O(1) |
| Min stack | Store the minimum with each entry | O(1) per operation | O(n) |

The pattern behind every O(n) row is the same: each element is pushed at most once and popped at most once, so however the pushes and pops interleave, there are at most 2n stack operations in total.

## How to recognise a stack problem

Look for these signals in a statement:

- **Nesting**: brackets, tags, nested expressions such as `3[a2[c]]`, directories inside directories.
- **The most recent item decides**: the last unmatched opener, the previous score, the latest directory, the newest edit.
- **Cancelling or collapsing neighbours**: removing adjacent pairs, collisions, backspaces — a removal that can bring older items back together.
- **Expressions** to evaluate or convert, with operators and precedence.
- **Undo, back, or "process in reverse order"**.
- **Recursion you need to make iterative**, or recursion that would go too deep.

## Common mistakes

- **Popping or peeking an empty stack.** A closer with nothing on the stack must return "invalid", not crash. Check emptiness before every pop or peek on input you do not control.
- **Forgetting the final check.** A string like `(((` never fails on the way through. The answer is "valid" only if the stack is empty at the end.
- **Popping operands in the wrong order.** The first pop is the right operand: compute `a - b` and `a / b` with `b` popped first.
- **Floor division in Python.** `-7 // 2` is −4, not −3. When a problem says "truncate towards zero", use `int(a / b)` or adjust the sign yourself.
- **Using `java.util.Stack`.** It works, but it is synchronised, lets code index into the middle, and iterates from the bottom. Use `ArrayDeque` through `Deque`.
- **Losing duplicates in a min stack.** With a separate stack of minimums, push when the new value is `<=` the current minimum, not just `<`.

## Practice in this order

1. [Valid Parentheses](/problems/valid-parentheses): the example above, the problem every stack round starts with.
2. [Baseball Game](/problems/baseball-game): a stack as a record you add to and cancel from.
3. [Remove All Adjacent Duplicates In String](/problems/remove-all-adjacent-duplicates): cancel the top when the new item matches it.
4. [Backspace String Compare](/problems/backspace-string-compare): typing and backspace as push and pop.
5. [Evaluate Reverse Polish Notation](/problems/evaluate-reverse-polish-notation): the second example, with its division rule.
6. [Simplify Path](/problems/simplify-path): a stack of directory names, popped on `..`.
7. [Asteroid Collision](/problems/asteroid-collision): a new item may destroy several on top before it settles.
8. [Decode String](/problems/decode-string): push the state at `[`, rebuild it at `]`.

The [stack problem list](/challenges/stack) has every stack problem in the catalogue, from easy to hard. Next in this stage is the stack's mirror image, the [queue](/roadmap/queue), and after it the [monotonic stack](/roadmap/monotonic-stack).

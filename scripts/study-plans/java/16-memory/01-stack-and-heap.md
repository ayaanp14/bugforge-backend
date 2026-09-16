---
title: Stack and heap — where every value lives
minutes: 14
---
Every Java value lives in one of two places. Local variables, parameters and the bookkeeping of a method call live on a **thread's stack**, in a frame that is created on call and discarded on return. Objects — every `new`, every array, every string — live on the **heap**, shared by all threads and reclaimed by the garbage collector. A reference is a stack (or field) value that *points at* a heap object. Almost every "why did this happen" question about Java memory — aliasing, `StackOverflowError`, `OutOfMemoryError`, why passing an array to a method lets the method change it — is answered by drawing this picture correctly. This lesson draws it.

## The call stack

Each thread has its own stack. A method call pushes a **frame** holding the method's local variables (including parameters and `this`), an operand stack for intermediate results, and a return address. The frame is fixed-size — the compiler computed how many slots the method needs — and it is popped in one step on return, which is why locals are "free": no allocation, no collection, no fragmentation.

```java
static int area(int w, int h) {   // frame: w, h, and a slot for the product
    int a = w * h;
    return a;
}                                  // frame popped; a, w, h cease to exist
```

The stack is small — 512 KB to 1 MB per thread by default (`-Xss`), a few thousand to a few tens of thousands of frames. Recursion without a base case, or a legitimate recursion that is simply too deep (a linked list of a million nodes walked recursively), exhausts it:

```java
static int depth(int n) { return depth(n + 1); }   // StackOverflowError after ~10 000–20 000 frames
```

`StackOverflowError` is an `Error`, not an `Exception`: it means the program's structure is wrong, and you fix it by making the recursion iterative or bounded, not by catching it. Each thread's stack is its own, so a deep recursion in one thread does not affect another.

## The heap

`new` allocates on the heap and returns a reference. The heap is shared by every thread, sized by `-Xms` (initial) and `-Xmx` (maximum), and managed by the collector, which finds objects nothing refers to and reclaims them (next two lessons). Objects never live on the stack in the language model — even a `Point` created and dropped inside one method is a heap object, although the JIT's *escape analysis* may quietly avoid the allocation when it can prove the object never leaves the method.

An object's memory is its **header** (12 bytes on a 64-bit JVM with compressed class pointers: a *mark word* for the identity hash, lock state and GC age, plus a pointer to its class) followed by its fields, padded to a multiple of 8. So `new Object()` is 16 bytes; an `Integer` is 16 bytes for 4 bytes of payload; an `int[10]` is 16 bytes of header-plus-length and 40 bytes of data, padded to 56. A `String` is two objects — the `String` and its `byte[]` — around 40 bytes before a single character. These numbers are why `int[]` beats `List<Integer>` by a factor of four or five in memory, and why "a million small objects" is where Java programs discover they have a memory budget.

## References: the arrow, not the box

```java
int[] a = {1, 2, 3};
int[] b = a;          // b is a second arrow to the SAME array
b[0] = 99;
System.out.println(a[0]);   // 99
```

`a` and `b` are two stack slots holding the same reference. There is one array. This is **aliasing**, and it is the single most common source of "my data changed and I did not change it" bugs: a getter that returns the internal array, a constructor that stores the caller's list, a `static` collection handed to two callers. `int[] c = a.clone()` or `new ArrayList<>(list)` makes a second object — a shallow copy, so the *elements* are still shared if they are themselves references.

Method calls copy the reference, not the object:

```java
static void fill(int[] arr) { arr[0] = 7; }      // changes the caller's array
static void swap(int[] arr) { arr = new int[]{0}; }   // rebinds the local copy; the caller sees nothing
```

Java is strictly pass-by-value; the value happens to be an arrow. The method can follow the arrow and modify the object; it cannot make the caller's variable point somewhere else.

## Primitives versus references

A primitive local (`int`, `double`, `boolean`, …) sits in the frame itself — the number is the slot. A reference local is a pointer to the heap. Fields follow the same rule inside the object: an `int` field is stored in the object; a `String` field is a pointer to another object. `null` is a reference that points nowhere; following it is a `NullPointerException`, whose helpful message since Java 14 names the variable that was null.

Boxing crosses the line: `Integer x = 5` allocates an object (or fetches a cached one — lesson 4). An `Integer[]` is an array of pointers to sixteen-byte objects scattered across the heap; an `int[]` is a contiguous block of numbers. The cache behaviour of the CPU, not just the byte count, is why the primitive array is faster.

## Two errors, two causes

| Error | Where | Why | Fix |
| --- | --- | --- | --- |
| `StackOverflowError` | one thread's stack | recursion too deep | make it iterative, bound the depth, or raise `-Xss` (rarely right) |
| `OutOfMemoryError: Java heap space` | the heap | live objects exceed `-Xmx` | find the leak or the oversized structure; raising `-Xmx` only delays a leak |

Neither should be caught in ordinary code. Both are `Error`s precisely because the program cannot sensibly continue.

## Threads and the heap

Every thread sees the same heap, which is what makes shared data possible — and what makes the concurrency module necessary. The stack is private: a local variable can never be seen by another thread, so anything that lives only in locals is automatically thread-safe. "Keep it in a local" is the cheapest concurrency strategy there is.

## Interview angle

- *"Where are objects stored? Where are local variables?"* Objects on the shared heap; locals and parameters in the thread's stack frame; a reference local is a pointer into the heap.
- *"Is Java pass-by-reference?"* No — pass-by-value; for objects the value copied is the reference, so the callee can mutate the object but cannot rebind the caller's variable.
- *"What causes `StackOverflowError`?"* Frames exhausting the thread stack — usually unbounded recursion.
- *"How big is `new Object()`?"* About 16 bytes: a 12-byte header padded to 8-byte alignment.
- *"Why is `int[]` so much smaller than `List<Integer>`?"* One contiguous block of 4-byte values versus an array of pointers to 16-byte objects.

## Key takeaways

- Stack: per thread, frames of locals pushed on call and popped on return; small and fast.
- Heap: shared, holds every object and array, sized by `-Xmx`, cleaned by the GC.
- A reference is an arrow; copying it makes an alias, not a copy. Methods receive the arrow.
- Object header ≈ 12 bytes plus 8-byte alignment; boxing multiplies memory and scatters it.
- `StackOverflowError` = recursion; `OutOfMemoryError` = too many live objects. Fix the cause, never catch.

---
title: Memory layout and the cache — contiguity, padding and traversal order
minutes: 15
seo-title: C++ Cache-Friendly Code: Struct Padding and Loop Order
description: Memory moves in 64-byte cache lines. Why std::vector beats std::list, how C++ struct padding and alignment work, row-major loop order, and AoS vs SoA layouts.
question: What is struct padding in C++?
answer: Struct padding is the unused bytes a C++ compiler inserts so that every member sits at an offset that is a multiple of its alignment, and so that the struct's size is a multiple of its largest alignment. `struct { char tag; int value; char flag; }` is 12 bytes on x86-64, half of it padding; ordering the members by descending size makes it 8. `sizeof` includes the padding.
q: Why is std::vector faster than std::list?
a: A `std::vector` stores its elements in one contiguous block, so each 64-byte cache line brings in the next several elements and the prefetcher streams the rest. A `std::list` puts each element in its own node, reachable only through the previous node's pointer, so a traversal can pay a cache miss per element. The list's O(1) insert still needs a traversal to find the position.
q: What is the difference between row-major and column-major traversal?
a: C++ stores a two-dimensional array row-major: `a[r][c]` sits at index `r * C + c`, so a row is contiguous. Looping with the column index innermost walks memory sequentially; putting the row index innermost jumps a whole row per step and can load a new cache line on every access. Make the innermost loop walk the innermost index.
q: What is a cache line?
a: A cache line is the unit in which a processor moves memory between RAM and its caches — 64 bytes on ordinary x86-64 hardware. Reading one `int` brings in the fifteen after it, so sequential access is nearly free, while scattered access pays roughly 100 ns for each miss to main memory.
q: What is the difference between array of structs and struct of arrays?
a: An array of structs (AoS) keeps each element's fields together; a struct of arrays (SoA) keeps one array per field. When a hot loop reads one field of many elements, SoA makes those values contiguous so no cache line carries unused fields; when a loop uses every field of each element, AoS is just as fast and simpler to write.
q: Why is processing a sorted array faster?
a: Because of branch prediction. A branch such as `if (value < threshold)` over sorted data follows a pattern the processor predicts almost perfectly, while over random data it guesses wrong about half the time, and each misprediction costs roughly fifteen to twenty cycles. A branchless form avoids the cost on unpredictable data.
---
A modern processor does not read memory a byte at a time; it reads **cache lines** of 64 bytes, keeps the lines it used recently in a small fast cache, and stalls for a hundred nanoseconds whenever it needs one that is not there. That one fact decides more C++ performance questions than any algorithm: why `std::vector` beats `std::list` at everything the complexity table says the list should win, why the order of two nested loops changes a matrix sum tenfold, why a struct's members should be sorted by size, and why an array of structs is sometimes the wrong shape. This lesson gives the model — lines, locality, padding, stride — and two counting exercises that make it concrete.

## Lines and locality

An ordinary x86-64 core has three cache levels — L1 around 32–48 KB at about 4 cycles, L2 up to a couple of megabytes at about 12, a shared L3 of many megabytes at about 40 — and main memory beyond at 200 cycles and more. Every level moves whole 64-byte lines. When your code reads `v[i]`, the line holding `v[i]` arrives, and with it `v[i + 1]` to `v[i + 15]` for a four-byte element: the next fifteen reads are free. That is **spatial locality**, and the hardware **prefetcher** improves on it by recognising a sequential pattern and fetching the following lines before they are asked for.

The model for this module counts *line loads*: a cache of *K* lines, least-recently-used replacement, one load each time a line not in the cache is touched. It ignores associativity and the prefetcher, and still predicts which of two traversals is cheaper.

## Why `std::vector` beats `std::list`

A `std::vector<int>` keeps a million ints in one four-megabyte block: sixteen per line, sequential, prefetchable. A `std::list<int>` keeps each in a separately allocated node of at least 24 bytes (two pointers and the value, padded), scattered wherever the allocator put them, each reachable only through the previous node's pointer. Walking the list is a chain of dependent loads — node *i + 1*'s address is unknown until node *i* has arrived — so the prefetcher cannot help, and a traversal can pay a million cache misses where the vector paid sixty-five thousand line loads, mostly prefetched. The list's O(1) insertion in the middle is real, but finding the position is a traversal, and the vector's O(n) shuffle of contiguous bytes is a `memmove` at memory bandwidth. Default to the vector; reach for `std::list` only when iterator stability is the requirement (Module 13, lesson 3).

## Struct padding

Each fundamental type has an **alignment**: on x86-64 it equals its size — `char` 1, `short` 2, `int` and `float` 4, `long long`, `double` and pointers 8. A member is placed at the next offset that is a multiple of its alignment, and the struct's size is rounded up to a multiple of its largest member alignment so that arrays of it keep every element aligned. `alignof(T)` reports the alignment; `sizeof(T)` includes the padding.

```cpp
struct Loose { char tag; int value; char flag; };   // 0, 4, 8 → size 12, alignment 4
struct Tight { int value; char tag; char flag; };   // 0, 4, 5 → size 8,  alignment 4
static_assert(sizeof(Loose) == 12 && sizeof(Tight) == 8);
```

`Loose` spends three bytes after `tag` to align `value` and three at the end to round to four; half the struct is padding. Reordering members by **descending size** removes the interior padding entirely — only tail padding can remain. For a million elements the difference between 12 and 8 bytes is four megabytes and a third fewer cache lines on every traversal. Clang's `-Wpadded` reports every padded struct; `static_assert(sizeof(Packet) == 8)` locks a layout you depend on. `#pragma pack(1)` removes the padding by force and makes every access misaligned — slower on x86, a fault on some architectures; a tool for matching a wire format, not for saving memory.

The rule is exact only for fundamental members on this platform's ABI; a library type has whatever size and alignment it has, which is why the padding exercise takes member sizes as input rather than printing `sizeof` of anything but a plain struct.

## Row-major traversal

A two-dimensional array is stored **row-major**: `a[r][c]` lives at element index `r * C + c`, so a row is contiguous and consecutive rows follow each other. `int a[R][C]` and `std::array<std::array<int, C>, R>` are one block; a `std::vector<std::vector<int>>` is a block per row, contiguous within but not across (Module 6, lesson 6).

```cpp
long long sumRows = 0, sumCols = 0;
for (int r = 0; r < R; ++r)
    for (int c = 0; c < C; ++c) sumRows += a[r][c];   // stride 4 bytes: sequential

for (int c = 0; c < C; ++c)
    for (int r = 0; r < R; ++r) sumCols += a[r][c];   // stride 4·C bytes: a new line each step
```

The two loops add the same numbers. The first touches each line once, sixteen elements per load. The second jumps `4·C` bytes per step; once `C ≥ 16` every access lands on a different line, and unless the cache can hold a line per row until the next column comes round, every access is a load — sixteen times the traffic for the same arithmetic. The exercise models this with an LRU cache of *K* lines: with *K* at least *R* the column-major loop costs the same as the row-major one; below that it collapses. The rule: **make the innermost loop walk the innermost index**. Flattening a grid into one `std::vector<int>` indexed by `r * C + c` gives the same layout with one allocation.

## Arrays of structs and structs of arrays

```cpp
struct Particle { double x, y, z; float mass; };   // 32 bytes with tail padding
std::vector<Particle> aos;                          // array of structs

struct Particles { std::vector<double> x, y, z; std::vector<float> mass; };   // struct of arrays
```

Summing every mass over the **AoS** layout reads four useful bytes out of every 32 — two particles per line, the doubles along for the ride. Over the **SoA** layout the masses are contiguous: sixteen per line, an eighth of the traffic. When a loop touches every field of each element, AoS is the natural shape and equally fast; when hot loops touch one or two fields of many elements — physics, graphics, analytics — SoA is the shape the cache wants, at the price of less convenient code. The checkpoint's second program counts the lines each layout touches for one hot field.

## Branch prediction, in outline

A processor runs instructions many pipeline stages deep and cannot wait for a branch's condition before fetching what follows, so it *guesses* from the branch's history and discards the work when wrong — a **misprediction** of roughly fifteen to twenty cycles. A branch with a pattern (a loop's back edge, `if (value < threshold)` over sorted data) is predicted almost perfectly; the same branch over random data is wrong about half the time. That is why sorting an array can make a loop over it several times faster with identical arithmetic, and why branchless forms (`total += (value < threshold) * value`, `std::min`, the conditional move the optimiser emits) win on unpredictable data. Lesson 4's exercise models a two-bit predictor over sorted and unsorted input. The related **false sharing** — two threads writing different variables on one line — is Module 17's.

## Pitfalls

| Layout decision | Cost |
| --- | --- |
| `std::list` for "lots of inserts" | A cache miss per node on every traversal |
| Members declared `char, double, char` | Size 24 instead of 16; a third more lines |
| Column-major inner loop over a wide matrix | A line load per element instead of per sixteen |
| `std::vector<std::vector<int>>` for a dense grid | Rows scattered; one allocation per row |
| AoS with one hot field of many | Most of every line is wasted |

## Key takeaways

- Memory moves in 64-byte lines; sequential access gets the next fifteen elements free and the prefetcher's help, scattered access pays a miss each.
- Contiguity is why `std::vector` beats node-based containers at traversal regardless of the complexity table.
- Members align to their size; order them by descending size to remove interior padding; `sizeof` includes the padding.
- Row-major storage means the innermost loop must walk the innermost index; stride is what a cache line notices.
- Choose SoA when hot loops touch few fields of many elements; sort or go branchless when a branch on data is unpredictable.

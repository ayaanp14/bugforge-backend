---
title: Memory errors and the tools that find them
minutes: 15
---
Every memory error in C++ is the same event in different clothing: the program reads or writes storage it does not own at that moment. The compiler cannot see it, the language calls it undefined behaviour, and the optimiser assumes it never happens, so the symptom — a crash, a wrong number, a test that passes on one machine — appears somewhere far from the cause. This lesson catalogues the seven errors, shows what each looks like in source and in the report of the tool that catches it, and closes with the ownership rules from this module that make each one impossible to write.

## The catalogue

| Error | The code | The symptom |
| --- | --- | --- |
| leak | `new` without `delete`; a `shared_ptr` cycle | memory grows; destructors never run |
| dangling pointer or reference | `&local` returned; a pointer into a vector after `push_back` | reads garbage or another object's value |
| use after free | `delete p; *p` | wrong values now, corruption later |
| double free | `delete p; delete p;` — two owners | an allocator crash, often much later |
| buffer overflow | `a[n]` on an array of `n`; `strcpy` into a short buffer | overwrites a neighbour; a security hole |
| uninitialised read | `int x; if (x > 0)`; `new int` read before written | differs between runs and optimisation levels |
| invalidated iterator | `v.erase(it)` in a loop over `v`; `it` held across `push_back` | skipped elements, crashes |

Each is undefined behaviour: the standard places no requirement on what happens next. In practice the optimiser reasons from "this cannot happen" — it may delete a null check that follows a dereference, keep in a register a value that memory says has changed, or fold a read of uninitialised storage into a constant. The judge's `-O2` build of a program with a dangling read once printed `0` and passed; the same program under another compiler printed a neighbouring variable. Neither is right; the program has no meaning.

## Reading the source

```cpp
std::vector<int> v{1, 2, 3};
int& first = v[0];
v.push_back(4);              // may reallocate: first now refers to freed storage
std::cout << first << '\n';  // use after free through a dangling reference

int* make() {
    int local = 5;
    return &local;           // dangling: the frame is gone when the caller reads it
}

char name[8];
std::strcpy(name, "a long name");   // stack buffer overflow: 12 bytes into 8
```

The common feature is a pointer or reference that outlived what it pointed at, or a count that was not checked. None of them is caught by the compiler, though `-Wall` reports `return &local` and `-Wextra` some uninitialised reads. Finding the rest is the job of run-time tools.

## AddressSanitizer

ASan instruments every load and store with a check against a shadow map of which bytes are valid. Compile with `-fsanitize=address -g` (add `-fno-omit-frame-pointer` for better stack traces), run normally, and it aborts at the first bad access with a report naming the kind of error, the access, and where the memory came from:

```text
$ g++ -std=c++20 -g -fsanitize=address main.cpp -o main && ./main
==4242==ERROR: AddressSanitizer: heap-use-after-free on address 0x602000000010
READ of size 4 at 0x602000000010 thread T0
    #0 0x55d0c4 in main main.cpp:7
0x602000000010 is located 0 bytes inside of 12-byte region
freed by thread T0 here:
    #0 0x7f3a12 in operator delete(void*)
    #1 0x55d0a1 in std::vector<int>::push_back main.cpp:6
previously allocated by thread T0 here:
    #1 0x55d033 in main main.cpp:4
```

Three stacks: where the bad access is, where the block was freed, where it was allocated — which is the whole story of a use-after-free. ASan also catches heap and stack buffer overflows, double frees and (through the LeakSanitizer it includes on Linux) leaks, reported at exit as `Direct leak of 400 byte(s) in 1 object(s) allocated from:` with the allocating stack. The cost is around 2× run time and 2–3× memory: a development flag, never a release one.

## UndefinedBehaviorSanitizer

UBSan checks for undefined behaviour that is not a memory access: signed overflow, shifts by too much, null dereference, misaligned access, out-of-range enum values, and out-of-bounds indexing into arrays whose bound the compiler knows. Compile with `-fsanitize=undefined`, usually together with ASan, and it prints one line per violation and continues:

```text
main.cpp:12:15: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
main.cpp:20:9: runtime error: index 8 out of bounds for type 'int [8]'
```

ASan and UBSan together are the standard local test configuration for any program that uses pointers; Module 19 returns to them for the wider undefined-behaviour catalogue.

## Valgrind

Valgrind's `memcheck` runs the *unmodified* binary on a synthetic CPU and tracks every byte's validity and every allocation. No recompilation, so it works on code you cannot rebuild, and it catches uninitialised reads that ASan does not. The price is a 20–50× slowdown.

```text
$ valgrind --leak-check=full ./main
==5151== Invalid read of size 4
==5151==    at 0x1091A3: main (main.cpp:7)
==5151==  Address 0x4dbec80 is 0 bytes inside a block of size 12 free'd
==5151== Conditional jump or move depends on uninitialised value(s)
==5151==    at 0x1091C8: main (main.cpp:15)
==5151== LEAK SUMMARY:
==5151==    definitely lost: 400 bytes in 1 blocks
==5151==    indirectly lost: 0 bytes in 0 blocks
```

"Definitely lost" is a block nothing points at any more; "indirectly lost" is a block reachable only from a lost block (the children of a leaked tree); "still reachable" is memory a global still points at when the program exits, which is usually not a bug. Compile with `-g` for line numbers and `-O0` or `-O1` so that the lines mean what they say.

## Cheaper checks

`-D_GLIBCXX_ASSERTIONS` makes libstdc++'s `operator[]` on `std::vector` and `std::string` check bounds and abort with a message — nearly free, and a good default for every debug build. `-fanalyzer` (GCC) is a static analysis that finds some leaks, double frees and null dereferences at compile time. `-Wall -Wextra` remain the first line. And the judge has none of these: a submission that passes has not been shown correct, only not shown wrong.

## The rules that prevent them

Each error in the table maps to a rule from the earlier lessons:

1. **No naked `new`/`delete` outside a class that owns the result.** Leaks and double frees come from manual ownership; `std::vector`, `std::string`, `std::make_unique` and `std::make_shared` do it correctly.
2. **One owner; everyone else borrows, and a borrow never outlives the owner.** Raw pointers and references are non-owning: never store one past the scope that guarantees the owner is alive.
3. **A container may move its elements.** Do not keep pointers, references or iterators into a `std::vector` or `std::string` across an insertion; keep the index instead.
4. **Initialise everything.** `int x{};`, `new int[n]{}`, member initialisers. There is no reason to declare an uninitialised variable in C++20.
5. **Bounds come from the container.** Loop to `v.size()`, use `.at()` when the index comes from outside, and use `std::array` or `std::vector` rather than a raw array and a separate count.
6. **Break every cycle with `weak_ptr`.**
7. **Test with ASan and UBSan before you trust a passing run.**

The two exercises are detectors written in well-defined code: a leak detector that reads a ledger of allocations and frees and reports leaks, double frees and invalid frees, and a bounds-checked buffer that answers `out of range` where an unchecked one would corrupt its neighbour — the tools' logic, modelled, since a real memory error cannot be judged.

## Pitfalls

| Mistake | Consequence |
| --- | --- |
| Trusting a test that passes without sanitizers | Undefined behaviour that happened to be benign on one build. |
| Running ASan at `-O3` without frame pointers | Stack traces lose frames; use `-O1 -g -fno-omit-frame-pointer`. |
| Ignoring "indirectly lost" | The leaked children of the block you did see. |
| Silencing a warning about a returned local's address | The bug is real. |
| Fixing a double free with `p = nullptr` | Hides the second owner; find it. |

## Key takeaways

- Seven errors, one cause: accessing storage the program does not own at that moment; all are undefined behaviour the optimiser may hide.
- AddressSanitizer (`-fsanitize=address -g`) reports use-after-free, overflows, double frees and leaks with three stacks: access, free, allocation.
- UBSan (`-fsanitize=undefined`) adds overflow, bad shifts, null dereference and known-bound indexing; Valgrind needs no recompile and finds uninitialised reads.
- `-D_GLIBCXX_ASSERTIONS` checks `[]` on standard containers almost for free.
- The ownership rules prevent the errors: no naked `new`, one owner, no pointers across container growth, initialise everything, `weak_ptr` for cycles.

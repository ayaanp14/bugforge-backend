---
title: File streams — open modes, RAII and reading back
minutes: 14
---
A file stream is `std::cin` or `std::cout` with a file behind the buffer. Everything from lessons 1 and 2 — `>>`, `getline`, the state bits, the recovery loop — works unchanged; what is new is opening, the modes that decide whether a file is truncated or appended to, the fact that a stream object *is* the open handle (so its destructor closes the file), and a handful of failure modes that a console program never meets: the file is missing, the directory does not exist, the data was written but never flushed before another stream tried to read it. The study judge lets a program create, write and read files in its working directory, so this lesson's programs write a file and read it straight back.

## The three classes

`<fstream>` declares `std::ofstream` (output), `std::ifstream` (input) and `std::fstream` (both). The constructor takes a path — a `std::string`, a C string or a `std::filesystem::path` (lesson 5) — and opens it at once:

```cpp
#include <fstream>
#include <iostream>
#include <string>

int main() {
    {
        std::ofstream out("notes.txt");
        if (!out) { std::cout << "cannot create notes.txt\n"; return 0; }
        out << "first line\n" << "second line\n";
    }                                            // out is destroyed here: flushed and closed

    std::ifstream in("notes.txt");
    std::string line;
    int count = 0;
    while (std::getline(in, line)) ++count;
    std::cout << count << " lines\n";
    return 0;
}
```

A path is resolved against the process's *working directory* — where the program was run from, not where the source file lives. `"notes.txt"` in the judge is a file beside the compiled program; the same string on your machine is a file in whatever directory your terminal was in.

## Did it open?

The one check every file program needs. `is_open()` reports the handle; `operator bool` (that is, `!fail()`) reports the same thing right after construction and is the idiom, because it also catches a later failure. An `ifstream` for a file that does not exist does not throw — it sets `failbit` and every read silently fails, which is how a program prints `0 lines` for a typo in the filename. An `ofstream` fails when the directory does not exist or is not writable; it *creates* the file when only the file is missing.

## Open modes

The second constructor argument is a bit mask from `std::ios`:

| Mode | Meaning |
| --- | --- |
| `in` | open for reading (the default for `ifstream`) |
| `out` | open for writing; on its own, **truncates** to empty (the default for `ofstream`) |
| `app` | append: every write goes to the end, whatever the position |
| `trunc` | discard existing contents (implied by `out` alone) |
| `ate` | start positioned *at the end*, but later writes may seek elsewhere |
| `binary` | no newline translation (lesson 5) |

Combine them with `|`. The three that matter in practice: `std::ofstream out("log.txt")` starts a fresh file every run; `std::ofstream out("log.txt", std::ios::app)` keeps what is there and adds to it — a second open with `app` continues after what the first open wrote, which is how a ledger accumulates across runs; and `std::fstream io("data.txt", std::ios::in | std::ios::out)` opens for both directions *without* truncating, but fails if the file does not already exist — add `std::ios::trunc` or create it first.

## RAII: the object is the open file

A file stream closes itself in its destructor. That is why the writing code above sits in its own block: when `out` goes out of scope, its buffer is flushed and the descriptor released *before* `in` opens the same file. Without that block the write might still be sitting in `out`'s buffer when `in` reads, and the count comes back short. The explicit calls exist for the cases the scope cannot express — `out.close()` to finish a file and then reopen the same object with `out.open("other.txt")`, or `out.flush()` to push the bytes without closing — but the scope is the idiom, exactly as Module 7 lesson 3 described: the resource's lifetime *is* the object's lifetime, and an early return or an exception still closes the file.

Writes are not on disk until flushed. `std::endl` flushes after every line, which is the reason it is slow in loops and also the reason logs written with it survive a crash; a judged program writes with `'\n'` and lets the destructor flush once.

## Reading a file

Every reading pattern from lesson 2 applies, with `in` in place of `std::cin`: `while (std::getline(in, line))` for lines, `while (in >> x)` for tokens, `in >> n; in.ignore(...)` before switching to lines. Two whole-file idioms are worth knowing:

```cpp
std::ifstream in("notes.txt");
std::string all((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());   // the whole file
```

The extra parentheses around the first argument stop the compiler reading the line as a function declaration (the "most vexing parse"). For a file too large to hold, stream it line by line instead — a 2 GB log does not need 2 GB of memory to be counted.

The position is queryable: `out.tellp()` is how many bytes have been written so far, `in.tellg()` where the next read starts, and `in.seekg(0)` rewinds — the basis of lesson 5's record file. A read that ran off the end leaves the stream with `eofbit` and `failbit` set, so to read a file twice you `clear()` before the `seekg`.

## Deleting and checking

A program that writes a scratch file should remove it: `std::remove("notes.txt")` from `<cstdio>` returns `0` on success, or `std::filesystem::remove("notes.txt")` (lesson 5) returns whether anything was deleted. Closing the stream first is essential — on some platforms an open file cannot be removed, and on all of them a buffered write may not have happened yet.

## Error handling in a file program

The stream never throws unless asked (`exceptions()`, lesson 1). The checkable moments are: after opening (`if (!out)`), after the reading loop (`in.bad()` distinguishes a disk error from a plain end of file), and after closing (`out.close(); if (out.fail())` — the flush can fail on a full disk). A judged program that reads its own freshly written file will not hit these, but a tool that does not check its open is one typo away from computing statistics on an empty stream and reporting them with confidence.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Not checking the open | Every read fails silently; the program reports zeros. |
| Reading a file another stream is still writing | The writer's buffer has not been flushed: the reader sees a short file. Close or scope the writer first. |
| `std::ofstream out("f.txt")` to add to a file | The default truncates. Use `std::ios::app`. |
| `std::ios::in \| std::ios::out` on a missing file | The open fails; `fstream` does not create it. |
| A relative path "to the source file" | Paths are relative to the working directory. |
| `std::endl` on every line of a big file | A flush per line; use `'\n'` and let the close flush. |

## Key takeaways

- `std::ofstream`, `std::ifstream` and `std::fstream` are `cout`/`cin` with a file behind the buffer; every reading pattern carries over.
- Check the open with `if (!stream)`; a missing input file is a silent `failbit`, not an exception.
- `out` truncates, `app` appends across opens, `in | out` needs an existing file, `binary` disables newline translation.
- The destructor flushes and closes: scope the writer so it finishes before the reader opens the same file.
- Paths are relative to the working directory; remove scratch files after closing them.

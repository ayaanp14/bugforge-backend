---
title: Reading and writing files — open, modes, encoding and with
minutes: 13
---
`open` returns a file object, and everything about files in Python follows from three choices made in that call: the *mode* (read, write, append; text or binary), the *encoding* (which should always be stated for text), and whether the object is used inside a `with` block (it should be). This lesson covers those choices, the read and write methods and when each is right, line iteration and the newline rules, `print(file=)`, in-memory files with `io.StringIO`, and the facts that matter for the judge — a program may create and read files in its working directory — and for real systems, where a file that is not closed is a resource leak and a partly written file is data loss.

## open

```python
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("first line\n")
    f.write("second line\n")

with open("notes.txt", encoding="utf-8") as f:      # mode "r" is the default
    text = f.read()
```

| Mode | Meaning |
| --- | --- |
| `"r"` | read text (default); `FileNotFoundError` if absent |
| `"w"` | write text; **truncates** an existing file or creates it |
| `"a"` | append text; creates if absent |
| `"x"` | create for writing; `FileExistsError` if present |
| `"r+"` | read and write, no truncation |
| `"rb"`, `"wb"`, `"ab"` | the same in binary: `bytes` in, `bytes` out |

Text mode decodes and encodes with `encoding` and translates line endings (`\r\n` on Windows becomes `\n` on read, and `\n` becomes the platform's on write — `newline=""` disables that, which `csv` requires). Binary mode does neither. State `encoding="utf-8"` on every text open: the default is the platform's preferred encoding, which is not UTF-8 on every Windows machine, and a file written on one system is then unreadable on another.

## with

`open` acquires a file descriptor — a limited OS resource — and buffers writes in memory. `with` guarantees `close()` on every exit (Module 10), which flushes the buffer to disk and releases the descriptor. Without it, a write may sit in the buffer until the interpreter exits, and a loop that opens files without closing them runs out of descriptors. The rule has no exceptions worth learning.

## Reading

```python
with open(path, encoding="utf-8") as f:
    everything = f.read()                 # the whole file as one string
    # — or —
    lines = f.readlines()                 # a list of lines, each with its "\n"
    # — or —
    for line in f:                        # one line at a time, lazily — the idiom
        line = line.rstrip("\n")
    # — or —
    first = f.readline()                  # one line; "" at end of file
    chunk = f.read(4096)                  # up to n characters
```

Iterating the file object is the right default: it reads as it goes and never holds more than one line, so a multi-gigabyte log costs the memory of its longest line. `read()` is right for small files that are processed as a whole (a config, a template); `read(n)` in a loop for binary streams. After a full read the position is at the end; `f.seek(0)` rewinds.

## Writing

```python
with open(path, "w", encoding="utf-8") as f:
    f.write("one line\n")                          # write adds no newline
    f.writelines(f"{x}\n" for x in xs)             # an iterable of strings, no separators added
    print("via print", file=f)                     # print adds the newline and str()s its arguments
    print(*values, sep=",", file=f)
```

`write` takes a string and returns the count written; it does not add a newline. `print(..., file=f)` is often the most convenient for line-oriented output because it formats and terminates. Writing is buffered; `f.flush()` pushes the buffer without closing (for progress files another process reads).

The safe way to replace a file is to write a new one and rename it over the old, so a crash mid-write leaves the original intact: `tempfile.NamedTemporaryFile(dir=..., delete=False)`, write, close, `os.replace(tmp, path)`. Overwriting in place with `"w"` truncates first and loses the data if the write fails.

## Paths, briefly

The path passed to `open` is relative to the *current working directory* — wherever the process was started, which is not necessarily the script's directory. Build paths from a known base (`pathlib.Path(__file__).parent`, next lesson) rather than assuming. Forward slashes work on every platform. On the judge the working directory is writable, and a program may create, write, read and delete files there — which is how the file exercises in this module work; they leave nothing behind.

## In-memory files

```python
import io

buf = io.StringIO()
print("captured", file=buf)
buf.getvalue()                    # 'captured\n'

reader = io.StringIO("a,b\n1,2\n")
for line in reader:               # behaves like an open text file
    ...
bio = io.BytesIO(b"\x00\x01")     # the bytes equivalent
```

`StringIO` and `BytesIO` are file objects backed by memory: the way to test code that takes a file, to capture output, and to feed `csv`/`json` from a string. Anything that accepts "a file-like object" accepts them.

## Errors

`FileNotFoundError`, `PermissionError`, `IsADirectoryError` are subclasses of `OSError` and carry `.filename`; `UnicodeDecodeError` means the encoding was wrong (`errors="replace"` substitutes U+FFFD, `errors="ignore"` drops, both hide the problem). EAFP applies: `try: open(...)` rather than `if os.path.exists(...)`, because the file can vanish between the check and the open.

## Pitfalls

- No `encoding=` on a text open.
- A file opened without `with` — unflushed writes, leaked descriptors, `ResourceWarning`.
- `"w"` when `"a"` was meant: the file is truncated.
- `read()` on a huge file when iteration would do.
- `readlines()` then indexing, when a loop was meant; and forgetting the `\n` on each element.
- A relative path that depends on the working directory.

## Key takeaways

- `open(path, mode, encoding="utf-8")` inside `with`; modes `r`/`w`/`a`/`x` and `b` for binary; `w` truncates.
- Iterate the file object for lines; `read()` for small whole files; `readline()` returns `""` at the end.
- `write` adds nothing; `print(file=f)` formats and terminates; writes are buffered until `flush`/close.
- Replace files by writing a temporary and `os.replace`-ing it; paths are relative to the working directory.
- `io.StringIO`/`BytesIO` are in-memory files for tests and captured output; file errors are `OSError` subclasses — use EAFP.

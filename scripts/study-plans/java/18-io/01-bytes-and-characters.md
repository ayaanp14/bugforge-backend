---
title: Bytes and characters — streams, readers and encodings
minutes: 14
---
Java's I/O library looks enormous — sixty-odd classes in `java.io` alone — and is built from three ideas. **Byte streams** (`InputStream`/`OutputStream`) move raw bytes. **Character streams** (`Reader`/`Writer`) move text, and the bridge between the two is a **charset**, the rule for turning characters into bytes. And every stream class is a **decorator**: you wrap a raw source in layers that add buffering, encoding, or typed reads. Once those three ideas are in place the sixty classes are four small families, and the encoding bugs that fill Stack Overflow — mojibake, "unmappable character", wrong byte counts — become predictable.

## Two hierarchies

| | Bytes | Characters |
| --- | --- | --- |
| read | `InputStream` — `int read()`, `int read(byte[])`, `byte[] readAllBytes()` | `Reader` — `int read()`, `int read(char[])`, `String readLine()` via `BufferedReader` |
| write | `OutputStream` — `write(int)`, `write(byte[])`, `flush()`, `close()` | `Writer` — `write(String)`, `append`, `flush()`, `close()` |
| sources | `FileInputStream`, `ByteArrayInputStream`, `System.in`, sockets | `FileReader`, `StringReader`, `InputStreamReader` |
| sinks | `FileOutputStream`, `ByteArrayOutputStream`, `System.out` (a `PrintStream`) | `FileWriter`, `StringWriter`, `OutputStreamWriter`, `PrintWriter` |

`read()` on either returns the next unit as an `int` — a byte 0–255 or a `char` 0–65535 — and **−1 at end of stream**, which is why it returns `int` and not `byte`: −1 must be distinguishable from the byte `0xFF`. A file, a network socket and `System.in` are byte streams; text is a *view* over them that a `Reader` provides once you tell it the charset.

## Charsets: where text meets bytes

A `String` is a sequence of UTF-16 code units in memory (compact Latin-1 internally since Java 9, but that is invisible). A file or a socket holds bytes. The mapping is a `Charset`:

```java
byte[] utf8 = "héllo".getBytes(StandardCharsets.UTF_8);     // 6 bytes: h=68, é=c3 a9, l l o
byte[] latin = "héllo".getBytes(StandardCharsets.ISO_8859_1); // 5 bytes: é = e9
String back = new String(utf8, StandardCharsets.UTF_8);      // "héllo"
String wrong = new String(utf8, StandardCharsets.ISO_8859_1); // "hÃ©llo" — mojibake
```

UTF-8 encodes ASCII in one byte, most European letters in two, CJK in three, emoji in four. **Always name the charset.** Before Java 18 `getBytes()`, `new String(bytes)`, `FileReader` and `FileWriter` used the *platform default* — UTF-8 on Linux, Windows-1252 on many Windows machines — so the same program wrote different bytes on different machines. Java 18 (JEP 400) made UTF-8 the default everywhere, which removes the trap for new code, but code that must run on older JDKs, and any interview answer, still says `StandardCharsets.UTF_8` explicitly.

`s.length()` counts UTF-16 units, `s.getBytes(UTF_8).length` counts bytes, `s.codePointCount(0, s.length())` counts characters as a human would — three different numbers for the same emoji-laden string.

## The decorator pattern in practice

```java
try (BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream("data.txt"), StandardCharsets.UTF_8))) {
    String line;
    while ((line = in.readLine()) != null) process(line);
}
```

Read it inside out: a `FileInputStream` produces bytes; an `InputStreamReader` decodes them as UTF-8 into characters; a `BufferedReader` batches reads into 8 KB chunks and adds `readLine()`. Each layer has the same interface as the one it wraps, so you can add or remove layers freely — that is the pattern. Closing the outermost closes the chain. The symmetrical output stack is `PrintWriter(new BufferedWriter(new OutputStreamWriter(new FileOutputStream(f), UTF_8)))`, and `Files.newBufferedReader(path)` / `Files.newBufferedWriter(path)` build the common stacks in one call (UTF-8 by default).

`System.in` is a raw `InputStream`; `System.out` is a `PrintStream` — a byte stream that knows how to format text, which is why `println` works on it. `new Scanner(System.in)` and `new BufferedReader(new InputStreamReader(System.in))` are the two text views over it you have been using since module 1.

## In-memory streams: testing and building

`ByteArrayOutputStream` collects everything written to it into a growing `byte[]` (`toByteArray()`, `toString(UTF_8)`); `ByteArrayInputStream` serves a `byte[]` as a stream. `StringWriter`/`StringReader` are the character twins. They let you test any code written against `InputStream`/`Reader` without a file, and they are how you build a byte image in memory — a serialised object, an encoded message — before sending it anywhere.

## Typed binary I/O

`DataOutputStream`/`DataInputStream` write and read primitives in a fixed **big-endian** binary form: `writeInt(258)` emits the four bytes `00 00 01 02`; `writeUTF` writes a length-prefixed modified-UTF-8 string. `ObjectOutputStream` (lesson 4) sits on top for whole object graphs. Reading with the wrong method (`readInt` where `readLong` was written) does not fail — it silently produces garbage, so binary formats need a header and a version.

## Closing, flushing and try-with-resources

Every stream holds a native resource — a file descriptor, a socket — and must be closed. `try-with-resources` (`try (var in = …) { }`) closes in reverse order of opening even when an exception escapes, and adds any exception from `close()` as a *suppressed* exception rather than losing the original. Writers and buffered output streams hold data in memory until `flush()` or `close()`: a program that writes a file and exits without closing may write nothing at all. `System.out` flushes on `println` only when it is a console; redirected to a file it buffers, which matters for the output-heavy exercises of the next lesson.

## `IOException` is checked

Almost every I/O method throws `IOException`, a checked exception, because the outside world fails in ways the program cannot prevent (disk full, connection reset). Handle it where you can do something (retry, report), otherwise let it propagate with a `throws` clause; wrap it in `UncheckedIOException` when an API that takes a lambda (`Stream.map`) forbids checked exceptions.

## Interview angle

- *"Byte stream versus character stream?"* `InputStream`/`OutputStream` move bytes; `Reader`/`Writer` move characters; `InputStreamReader`/`OutputStreamWriter` bridge them with a charset.
- *"Why does `read()` return `int`?"* To return −1 at end of stream without clashing with byte `0xFF`.
- *"What is the decorator pattern in `java.io`?"* Streams wrap streams with the same interface, adding buffering, encoding or typed reads.
- *"What happens if you forget the charset?"* Before Java 18, the platform default — different bytes on different machines; always pass `StandardCharsets.UTF_8`.
- *"`length()` versus `getBytes().length`?"* UTF-16 units versus encoded bytes; they differ for anything outside ASCII.

## Key takeaways

- Bytes: `InputStream`/`OutputStream`. Characters: `Reader`/`Writer`. `read()` gives −1 at the end.
- A charset maps text to bytes; UTF-8 is the answer; name it, even on Java 18+.
- Decorate: raw source → `InputStreamReader` → `BufferedReader`; `Files.newBufferedReader` for the common stack.
- `ByteArrayOutputStream`/`StringWriter` for in-memory work and tests; `DataOutputStream` for big-endian primitives.
- Close with try-with-resources; buffered output is not written until flushed or closed.

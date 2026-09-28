---
title: Files and paths — java.nio.file
minutes: 14
seo-title: How to Read and Write Files in Java with Path and Files
description: java.nio.file replaces java.io.File: Path names a location and Files reads, writes, copies, lists and walks. Path resolve, normalize and closing Files.lines.
question: How do you read a file in Java?
answer: To read a file in Java, use the `java.nio.file` API: `Files.readString(path)` returns the whole file as a UTF-8 string (Java 11+), `Files.readAllLines(path)` returns a list of lines, and `Files.lines(path)` streams them lazily for large files — inside try-with-resources, because it holds the file open. `Files.newBufferedReader(path)` gives a `BufferedReader` for line-by-line reading.
q: What is the difference between Path and File in Java?
a: `java.nio.file.Path` is an immutable description of a location, and the `Files` methods that act on it throw exceptions naming the problem, such as `NoSuchFileException`. `java.io.File` is the legacy class whose methods mostly return `false` on failure; convert between them with `toPath()` and `toFile()`.
q: What does Path resolve do with an absolute path?
a: It returns the absolute argument and discards the base: resolving `/etc/passwd` against `/srv/app` gives `/etc/passwd`. Before resolving user input against a trusted directory, normalise the result and check that it still `startsWith` the base directory.
q: What is the difference between normalize and toRealPath in Java?
a: `normalize()` is purely syntactic: it removes `.` and `..` without touching the disk or following links. `toRealPath()` resolves the path against the real file system, following symbolic links, and throws if the file does not exist.
q: Why must Files.lines and Files.walk be closed?
a: They are lazy streams that hold a file or directory handle open while the stream is alive. Use them in try-with-resources, or a long-running process eventually runs out of file descriptors.
q: How do you write to a file in Java?
a: `Files.writeString(path, text)` creates or truncates the file; pass `StandardOpenOption.APPEND` to append instead. `Files.write(path, lines)` writes one line per list element, and `Files.newBufferedWriter(path)` gives a buffered writer for larger output.
---
The `java.io.File` class you may have met is twenty-five years old and mostly returns `false` when things go wrong. Since Java 7 the file system API is `java.nio.file`: **`Path`** is an immutable, purely syntactic description of a location; **`Files`** is a utility class of static operations on paths that throw real exceptions with real messages; and the two together read, write, copy, move, list and walk with one-liners that were fifteen lines before. This lesson covers the API you will use ninety-five percent of the time, the path arithmetic behind `..` and relative paths, and the handful of operations that are still surprising.

## `Path`: a location, not a file

```java
Path p = Path.of("/srv/app", "logs", "today.log");     // Java 11; Paths.get(...) before
p.getFileName();          // today.log
p.getParent();            // /srv/app/logs
p.getRoot();              // /  (null for a relative path)
p.getNameCount();         // 4
p.isAbsolute();           // true
p.toString();             // /srv/app/logs/today.log — separators are the platform's
```

Nothing touches the disk. A `Path` can name a file that does not exist; `Files.exists(p)` is the question, not the constructor. Separators are platform-specific (`/` on Linux and macOS, `\` on Windows) but `Path.of("a/b")` is accepted everywhere.

## Path arithmetic

```java
Path base = Path.of("/srv/app");
base.resolve("conf/app.yml");                 // /srv/app/conf/app.yml          — join a child
base.resolve("/etc/passwd");                  // /etc/passwd                    — an absolute argument REPLACES the base
base.resolve("../logs/./x.log").normalize();  // /srv/logs/x.log                — remove . and ..
base.relativize(Path.of("/srv/logs/x.log"));  // ../logs/x.log                  — how to get from base to there
base.resolveSibling("backup");                // /srv/backup
Path.of("a/b/c").subpath(1, 3);               // b/c
Path.of("x.tar.gz").getFileName().toString(); // the extension is yours to split: after the LAST dot → "gz"
```

`normalize()` is syntactic: it does not check that the directories exist or follow symbolic links; `toRealPath()` does both and throws if the file is missing. `resolve` with an absolute path replacing the base is a security classic — never resolve a user-supplied string against a trusted directory without checking that the result still `startsWith` it after normalising.

## `Files`: reading and writing

```java
String text = Files.readString(p);                             // Java 11, UTF-8
List<String> lines = Files.readAllLines(p);                    // whole file in memory
byte[] bytes = Files.readAllBytes(p);
Files.writeString(p, "hello\n");                               // create or truncate
Files.writeString(p, "more\n", StandardOpenOption.APPEND);
Files.write(p, lines);                                         // one line per element
try (Stream<String> s = Files.lines(p)) { s.filter(...).count(); }   // lazy; MUST be closed
try (BufferedReader r = Files.newBufferedReader(p)) { … }
try (BufferedWriter w = Files.newBufferedWriter(p, StandardOpenOption.CREATE, StandardOpenOption.APPEND)) { … }
```

`readString`/`readAllLines` are right for files that fit comfortably in memory (configuration, inputs measured in megabytes). `Files.lines` streams lazily and is the choice for anything large — but it holds a file handle, so it goes in a try-with-resources. `Files.newBufferedReader` builds the decorator stack from lesson 1 with UTF-8 already in it.

## `Files`: the file system

```java
Files.exists(p); Files.isDirectory(p); Files.isRegularFile(p); Files.isReadable(p);
Files.size(p);                                          // bytes
Files.getLastModifiedTime(p);                           // FileTime → toInstant()
Files.createDirectories(dir);                           // mkdir -p: no error if it exists
Files.createFile(p);                                    // FileAlreadyExistsException if it does
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);   // rename; atomic on the same file system
Files.delete(p);                                        // NoSuchFileException if missing
Files.deleteIfExists(p);                                // returns boolean, never throws for a missing file
Path tmp = Files.createTempFile("report-", ".csv");     // in the system temp dir; delete it yourself
```

The exceptions are the improvement: `NoSuchFileException`, `AccessDeniedException`, `DirectoryNotEmptyException`, `FileAlreadyExistsException` — each an `IOException` subclass naming the path. `java.io.File.delete()` just returned `false`.

## Listing and walking

```java
try (Stream<Path> children = Files.list(dir)) { … }                     // one level, unsorted
try (Stream<Path> all = Files.walk(dir)) {                              // recursive, depth-first, the dir itself first
    long javaFiles = all.filter(x -> x.toString().endsWith(".java")).count();
}
try (Stream<Path> found = Files.find(dir, 10, (path, attrs) -> attrs.size() > 1_000_000)) { … }
Files.walkFileTree(dir, new SimpleFileVisitor<>() { … });               // the callback form: control descent, handle errors per file
```

All of these are lazy streams over open directory handles — **close them** with try-with-resources, or a long-running process runs out of file descriptors. Order is not specified; sort if it matters. For "delete a directory tree", walk it, sort in reverse (children before parents), and `deleteIfExists` each.

## Attributes, permissions and links

`Files.readAttributes(p, BasicFileAttributes.class)` returns size, times and type in one system call — cheaper than four separate queries. `PosixFileAttributes` and `Files.setPosixFilePermissions` handle Unix modes; `Files.isSymbolicLink`, `Files.readSymbolicLink` and the `LinkOption.NOFOLLOW_LINKS` flag control whether operations follow links. `Files.probeContentType(p)` guesses a MIME type from the name.

## The `WatchService`, briefly

`FileSystems.getDefault().newWatchService()` plus `dir.register(watcher, ENTRY_CREATE, ENTRY_MODIFY)` delivers events when a directory changes — the basis of hot-reload and log tailers. Events can coalesce and overflow; production code re-scans on `OVERFLOW`.

## Legacy `File`, and when you still meet it

`java.io.File` is not deprecated and many APIs still take one. Convert both ways: `path.toFile()` and `file.toPath()`. Prefer `Path` in new code; the `Files` methods are clearer, faster (fewer system calls) and honest about errors.

## Interview angle

- *"`Path` versus `File`?"* `Path` is an immutable syntactic location with real exceptions from `Files`; `File` is the legacy class returning booleans.
- *"What does `resolve` do with an absolute argument?"* Returns the argument — the base is discarded; check `startsWith` after `normalize` for user input.
- *"`normalize` versus `toRealPath`?"* Syntactic `.`/`..` removal versus resolving links against the real file system (and failing if absent).
- *"Why must `Files.lines`/`Files.walk` be closed?"* They hold a file or directory handle open while the stream is alive.
- *"How do you read a whole file as a string?"* `Files.readString(path)` (Java 11), UTF-8 by default.

## Key takeaways

- `Path` is arithmetic — `resolve`, `normalize`, `relativize`, `getFileName` — and touches no disk.
- `Files` does the work: `readString`/`writeString`, `readAllLines`, `lines` (close it), `newBufferedReader/Writer`.
- `createDirectories`, `copy`/`move` with options, `delete`/`deleteIfExists`, temp files; exceptions name the path.
- `list`/`walk`/`find` are lazy streams over open handles — try-with-resources every time.
- Never trust `resolve` on user input without a `startsWith` check on the normalised result.

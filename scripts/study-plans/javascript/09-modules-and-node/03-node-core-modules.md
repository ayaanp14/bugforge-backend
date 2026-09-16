---
title: The core modules you use every week — fs, path, os, process, util, events, url, crypto
minutes: 14
---
Node's standard library is small by design and almost entirely I/O and OS: files, paths, the process, events, URLs, hashing, and utilities. Every one of these you will reach for weekly, and each has one or two rules that are not obvious — `path.join` versus `path.resolve`, three flavours of `fs`, `process.exit` cutting off pending output, `EventEmitter` throwing on an unhandled `"error"`. This lesson is a working tour with the idioms and the traps, organised by module; streams and child processes get their own lessons.

## `path`

```js
const path = require("node:path");
path.join("/app", "src", "../lib", "x.js");   // "/app/lib/x.js"  — joins and normalises; relative stays relative
path.resolve("src", "x.js");                  // "/current/working/dir/src/x.js" — always absolute, from the right
path.basename("/a/b/file.txt");               // "file.txt";  basename(p, ".txt") → "file"
path.extname("archive.tar.gz");               // ".gz"
path.dirname("/a/b/file.txt");                // "/a/b"
path.relative("/a/b", "/a/c/d");              // "../c/d"
path.parse("/a/b/file.txt");                  // { root: "/", dir: "/a/b", base: "file.txt", ext: ".txt", name: "file" }
path.sep; path.delimiter;                     // "/" and ":" (POSIX), "\\" and ";" (Windows)
path.posix.join(…); path.win32.join(…);       // force a flavour — for URLs use posix, always
```

Never concatenate paths with `+` and `/`; `join` handles separators, doubled slashes and `..`. `resolve` is `cd` semantics — the first absolute segment from the right wins. Build paths relative to the source file with `path.join(__dirname, …)` (CJS) or `new URL("./x", import.meta.url)` (ESM), never relative to the current working directory, which is wherever the user ran the command.

## `fs`, three ways

```js
const fs = require("node:fs");
const fsp = require("node:fs/promises");
fs.readFileSync("a.txt", "utf8");                                  // sync: fine for startup/config/CLIs; blocks the loop
fs.readFile("a.txt", "utf8", (err, text) => { … });                // callback: legacy
const text = await fsp.readFile("a.txt", "utf8");                  // promises: the modern default
await fsp.writeFile("out.json", JSON.stringify(data, null, 2));    // creates or truncates
await fsp.appendFile("log.txt", line + "\n");
await fsp.mkdir("dir/sub", { recursive: true });                   // no error if it exists
await fsp.rm("dir", { recursive: true, force: true });             // rm -rf
const entries = await fsp.readdir("dir", { withFileTypes: true }); // Dirent: entry.isDirectory(), entry.name
const st = await fsp.stat("a.txt");  st.size; st.mtime; st.isFile();
await fsp.access("a.txt").then(() => true, () => false);           // exists? — but prefer to just try the operation
const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "app-"));     // a unique temp directory
```

Without an encoding argument you get a `Buffer`, not a string. Errors carry a `code`: `ENOENT` (no such file), `EACCES` (permission), `EEXIST`, `EISDIR`, `ENOTDIR` — branch on `err.code`. Checking existence then opening is a race; open and handle `ENOENT`. For large files use streams (next lesson); `readFile` loads the whole thing. `fs.watch` is platform-inconsistent — use chokidar for real watching.

## `os` and `process`

```js
os.tmpdir(); os.homedir(); os.platform(); os.cpus().length; os.EOL; os.totalmem();
process.argv;            // ["/path/node", "/path/script.js", ...args]
process.env.PORT;        // strings only; undefined when unset — validate at startup
process.cwd(); process.chdir(dir); process.pid; process.version; process.platform;
process.exitCode = 1;    // set and let the loop drain — flushes stdout; process.exit(1) is immediate and can cut output
process.on("exit", (code) => …);              // synchronous only — no async work here
process.stdout.write("no newline");           // console.log is stdout + newline; console.error is stderr
process.hrtime.bigint(); process.memoryUsage().heapUsed;
```

`process.exit()` kills pending writes and skips `finally` blocks in flight — set `exitCode` instead unless you truly must stop now. Environment variables are the configuration channel for deployments (twelve-factor); read them once into a validated config object.

## `util`

`util.promisify(fn)` for error-first callbacks; `util.inspect(obj, { depth: null, colors: true })` for full nested printing (what `console.log` uses, at depth 2); `util.format("%s has %d items", name, n)`; `util.types.isPromise(x)`, `util.isDeepStrictEqual(a, b)`; `util.parseArgs` (Node 18.3+ — hand-roll on 16); `util.deprecate(fn, msg)`; `util.TextEncoder`/`TextDecoder` (also global). `util.inherits` is the pre-class inheritance helper you will meet in old code.

## `events` — `EventEmitter`

```js
const { EventEmitter, once } = require("node:events");
class Job extends EventEmitter { run() { this.emit("progress", 50); this.emit("done", { ok: true }); } }
const job = new Job();
job.on("progress", (p) => …);                 // any number of listeners, called synchronously in order
job.once("done", handler);                    // auto-removed after the first call
job.off("progress", fn);                      // remove (same function reference)
job.emit("done", payload);                    // returns true if anyone listened
await once(job, "done");                      // promise of the first emission's arguments (rejects on "error")
```

`emit` is **synchronous**: listeners run before `emit` returns, in registration order — so a slow listener slows the emitter, and a throw in a listener propagates to the `emit` call. An emitted `"error"` with **no listener throws** — always attach one on emitters that can fail (streams, sockets, servers). More than 10 listeners on one event prints a leak warning (`setMaxListeners` if intentional). The browser's `EventTarget` is the same idea with `addEventListener`; Node has `EventTarget` too.

## `url`, `querystring`

```js
const u = new URL("https://user:pw@example.com:8443/a/b?x=1&y=2#frag");   // WHATWG URL — the standard; global
u.hostname; u.port; u.pathname; u.search; u.hash; u.origin;
u.searchParams.get("x"); u.searchParams.append("z", "3"); [...u.searchParams];  // URLSearchParams handles encoding
new URL("../c", "https://example.com/a/b/");                                  // relative resolution: "https://example.com/a/c"
const { fileURLToPath, pathToFileURL } = require("node:url");                  // import.meta.url ↔ paths
```

Never build query strings by hand; `URLSearchParams` encodes correctly. The legacy `url.parse` and `querystring` modules are superseded.

## `crypto`

`crypto.randomUUID()` (ids), `crypto.randomBytes(16).toString("hex")` (tokens — never `Math.random`), `crypto.createHash("sha256").update(text).digest("hex")` (checksums — **not** for passwords), `crypto.scrypt`/`pbkdf2` or the `bcrypt`/`argon2` packages for passwords, `crypto.createHmac("sha256", secret)` for signatures, `crypto.timingSafeEqual` when comparing secrets, `crypto.subtle` (WebCrypto) for the standard API. The rule: use the library's high-level primitive for the job; never invent a scheme.

## `Buffer` (preview) and others

`Buffer.from("héllo", "utf8").length` is bytes, not characters; `buf.toString("base64")`; next lesson. Also worth knowing by name: `readline` (line-by-line stdin/files), `zlib` (gzip), `http`/`https` (servers and requests — frameworks sit on these), `net`/`dgram`, `dns`, `timers/promises`, `worker_threads`, `assert`, `test` (Node 18+).

## Common mistakes

- Paths relative to `process.cwd()` instead of the module; string concatenation instead of `path.join`.
- `readFile` without encoding, then treating the Buffer as a string; checking `existsSync` before opening (race).
- `process.exit()` right after `console.log` in a script with buffered output — the log is lost.
- No `"error"` listener on an emitter; expecting `emit` to be asynchronous.
- Hand-built query strings; `Math.random` for anything security-relevant; `sha256` for passwords.
- Reading `process.env` all over the code instead of once into a validated config.

## Interview angle

- *"`path.join` versus `path.resolve`?"* `join` concatenates and normalises (may stay relative); `resolve` produces an absolute path, processing right-to-left until an absolute segment.
- *"Sync versus async fs?"* Sync blocks the loop — acceptable at startup and in CLIs; async (promises) in anything serving concurrent work.
- *"What happens on `emit('error')` with no listener?"* It throws.
- *"`process.exit(1)` versus `process.exitCode = 1`?"* Immediate termination (pending writes lost) versus a graceful exit when the loop drains.
- *"How do you generate a secure token?"* `crypto.randomBytes`/`randomUUID`, never `Math.random`.

## Key takeaways

- `path.join`/`resolve`/`basename`/`extname`/`relative`; build from `__dirname`/`import.meta.url`, `posix` for URLs.
- `fs/promises` by default, sync at startup; encoding for strings; branch on `err.code`; temp dirs via `mkdtemp`.
- `process.argv`/`env`/`exitCode`; `exit()` is abrupt; env is strings, validate once.
- `EventEmitter` is synchronous; attach `"error"`; `once` returns a promise.
- `URL`/`URLSearchParams` for URLs; `crypto` primitives for ids, tokens, hashes, HMACs — never roll your own.

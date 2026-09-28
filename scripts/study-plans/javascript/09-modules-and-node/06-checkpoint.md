---
title: Checkpoint — Modules and Node
minutes: 24
seo-title: Node.js Modules Quiz: npm, Streams and Process Practice Test
description: Test your Node.js with 12 questions and three programs on CommonJS and ES modules, npm and semver, core modules, streams and backpressure, and processes.
q: What does CommonJS do on a circular require?
a: It returns the partially filled `exports` of the module that is still loading, often an empty object, so the module that asked sees `undefined` for anything defined later. The failure is silent, which is why the fix is to break the cycle by moving the shared code into a third module.
q: Why does chunk.toString() break UTF-8 text in a stream?
a: A chunk boundary can fall in the middle of a multi-byte UTF-8 character, so decoding each chunk separately produces garbage at the seams. Call `setEncoding("utf8")` on the stream, use a `StringDecoder`, which buffers partial characters, or collect the buffers and decode once with `Buffer.concat`.
q: What must a SIGTERM handler do in Node.js?
a: Stop accepting new work, finish or fail in-flight work quickly, close connections and flush logs, then call `process.exit`. Installing the handler replaces Node's default exit, so a handler that forgets to exit can leave the process running until the grace period ends and the orchestrator sends an uncatchable `SIGKILL`.
---
This checkpoint covers CommonJS versus ES modules (loading, caching, copies versus live bindings, module type detection, interop, cycles, dynamic `import()`), `package.json` fields, the resolution algorithm, semver ranges and lockfiles, the core modules (`path`, `fs`, `process`, `events`, `url`, `crypto`), `Buffer` and streams with `pipeline` and backpressure, and the process surface — arguments, environment, exit codes, signals, child processes and workers.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- How Node decides whether a `.js` file is CJS or ESM; why ESM imports need extensions; what a live binding is; what CJS does on a circular `require`.
- The three steps of resolving `require("x")`; `^` versus `~` and what `^0.x` means; why `npm ci` and a committed lockfile.
- `path.join` versus `resolve`; the three `fs` styles; what `emit("error")` with no listener does; `exitCode` versus `exit()`.
- Why `pipeline` beats `pipe`; what backpressure is; why `chunk.toString()` per chunk breaks on UTF-8.
- `exec` versus `execFile`/`spawn`; what a `SIGTERM` handler must do; when to use `worker_threads`.

The programs are a module-graph loader that reproduces CommonJS load order and detects cycles, a stream pipeline that parses and summarises log lines with a `Transform` in object mode, and a configuration CLI that merges flags, environment and defaults with the standard precedence.

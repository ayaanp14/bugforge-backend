---
title: Checkpoint — Modules and Node
minutes: 24
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

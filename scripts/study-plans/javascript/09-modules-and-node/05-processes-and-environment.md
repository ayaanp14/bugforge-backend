---
title: The process — arguments, environment, exit codes, signals, child processes and workers
minutes: 13
---
A Node program is an operating-system process: it is started with arguments and an environment, it reads stdin and writes stdout/stderr, it ends with an exit code, it receives signals, and it can start other processes or threads. Command-line tools and servers live or die on getting these right — a CLI that exits 0 on failure breaks every script that calls it; a server that ignores `SIGTERM` loses in-flight requests on every deploy. This lesson covers each surface, the hand-rolled argument parser you can write in twenty lines (Node 16 has no `util.parseArgs`), configuration through environment variables, graceful shutdown, `child_process` and its injection hazard, and when `worker_threads` are the right tool.

## Arguments

`process.argv` is `[nodePath, scriptPath, ...userArgs]` — slice from 2. Conventions every CLI follows: `--flag` (boolean), `--key value` or `--key=value`, `-v` short flags (and clusters `-abc`), `--no-color` to negate, positional arguments, and `--` meaning "everything after is positional, even if it starts with a dash". A minimal parser:

```js
function parseArgs(argv) {
  const opts = {}, positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") { positional.push(...argv.slice(i + 1)); break; }
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split("=", 2);
      if (inline !== undefined) opts[key] = inline;
      else if (key.startsWith("no-")) opts[key.slice(3)] = false;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) opts[key] = argv[++i];
      else opts[key] = true;
    } else if (a.startsWith("-") && a.length > 1) {
      for (const ch of a.slice(1)) opts[ch] = true;
    } else positional.push(a);
  }
  return { opts, positional };
}
```

Real tools use `commander`, `yargs` or Node 18's `util.parseArgs` for help text, types and validation — but the shape above is what they all produce.

## Environment variables

`process.env` is a plain object of **strings** (or `undefined`); `process.env.DEBUG = "1"` sets it for this process and its children only. Configuration belongs here in deployments (twelve-factor): ports, URLs, credentials, feature flags — never in code, never committed. The `.env` file convention (`KEY=value` lines, `#` comments, quotes for spaces, loaded by `dotenv` or Node 20's `--env-file`) is for local development; production injects real environment variables. Read them **once at startup** into a validated, typed config object with defaults and required checks, so a missing `DATABASE_URL` fails at boot with a clear message rather than at the first query — and precedence is explicit: command-line flag > environment variable > config file > default.

## stdin, stdout, stderr, exit codes

`process.stdout` is for program **output** (the thing a pipe would consume), `process.stderr` for diagnostics and progress — `console.log` versus `console.error`. Read stdin with `for await (const line of readline.createInterface({ input: process.stdin }))` or by collecting chunks; check `process.stdin.isTTY` to know whether a human or a pipe is on the other end. Exit code **0 means success**, anything else failure — shells, CI systems and `&&` chains depend on it. Set `process.exitCode = 1` and return normally so buffered output flushes; reserve `process.exit(code)` for "stop now" and know it skips pending I/O and `finally` blocks. Uncaught exceptions exit 1; unhandled rejections exit 1 on Node 15+.

## Signals and graceful shutdown

```js
let shuttingDown = false;
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`${sig}: draining…`);
    server.close();                                  // stop accepting; finish in-flight requests
    await db.end();
    process.exit(0);                                 // now nothing pending is worth keeping
  });
}
```

`SIGINT` is Ctrl-C; `SIGTERM` is what `kill`, Docker and Kubernetes send before `SIGKILL` (which cannot be handled — you have a grace period, typically 10–30 s). Installing a handler **replaces** Node's default exit, so you must exit yourself. Graceful shutdown: stop taking new work, finish or fail current work quickly, close connections, flush logs, exit. Also `process.on("uncaughtException")`/`("unhandledRejection")` — log and exit (module 7), and `"beforeExit"` fires when the loop drains (async work allowed) versus `"exit"` (synchronous only).

## Child processes

```js
const { execFile, spawn, exec } = require("node:child_process");
const { promisify } = require("node:util");
const { stdout } = await promisify(execFile)("git", ["rev-parse", "HEAD"]);    // program + argument ARRAY: no shell, no injection
const child = spawn("ffmpeg", ["-i", input, output], { stdio: "inherit" });     // streaming stdio; for long-running or large output
child.on("exit", (code, signal) => …);
exec(`ls ${userInput}`, cb);      // runs through a SHELL — userInput of "; rm -rf /" is executed. Avoid exec with untrusted data.
```

`execFile`/`spawn` take an argument array and start the program directly — no shell parsing, so no injection and no quoting problems. `exec` (and `spawn` with `shell: true`) run a shell command string: only for trusted, fixed commands that need shell features. `execFileSync`/`spawnSync` block the loop — fine in scripts. Buffered variants (`exec`, `execFile`) have a `maxBuffer` (1 MB default) and reject beyond it; use `spawn` and stream for big output. `fork()` starts another Node script with an IPC channel (`child.send`/`process.on("message")`). Always handle the `"error"` event (program not found) and check the exit code.

## Threads: `worker_threads`

The event loop is one thread; a CPU-bound task (image processing, big JSON, crypto, a long computation) blocks every request for its duration. `worker_threads` run JavaScript on other threads with **separate** event loops and heaps, communicating by message passing (`postMessage` — structured clone, or transferable `ArrayBuffer`s, or `SharedArrayBuffer` for true sharing). A worker pool (`piscina`) reuses a fixed number of them. Use workers for CPU work; I/O is already non-blocking and gains nothing. `cluster` (or a process manager) runs several whole Node processes sharing a port for multi-core HTTP throughput.

## A well-behaved CLI, summarised

Parse arguments; support `--help` and `--version`; read config in the flag > env > file > default order; write results to stdout and messages to stderr; exit non-zero on failure with a one-line reason; handle `SIGINT` if you hold resources; never print secrets; behave sanely when stdout is a pipe (no colours unless `isTTY`).

## Common mistakes

- Exiting 0 on failure; `process.exit()` before output flushes.
- Reading `process.env` everywhere, treating values as numbers/booleans without parsing, committing `.env`.
- `exec` with interpolated user input.
- A `SIGTERM` handler that never calls `process.exit`, or none at all so deploys drop requests.
- Using workers for I/O, or `spawnSync` in a server.
- Progress messages on stdout, corrupting the output a pipe consumes.

## Interview angle

- *"How does a CLI receive its arguments?"* `process.argv.slice(2)`; parse `--key=value`, `--flag`, `-x`, `--`, positionals.
- *"Where does configuration come from?"* Environment variables (strings) validated once at startup, with flags overriding and defaults below.
- *"`exec` versus `spawn`/`execFile`?"* `exec` runs a shell string (injection risk, buffered); `execFile`/`spawn` run a program with an argument array (safe, `spawn` streams).
- *"What is graceful shutdown?"* On `SIGTERM`, stop accepting work, finish in-flight work, close connections, then exit within the grace period.
- *"When do you use `worker_threads`?"* CPU-bound work that would block the event loop; not for I/O.

## Key takeaways

- `argv.slice(2)` with the standard flag conventions; help/version; positionals after `--`.
- Env is strings, read once, validated, precedence flag > env > file > default; `.env` for local only.
- stdout for output, stderr for messages; exit 0 on success, `exitCode` over `exit()`.
- Handle `SIGINT`/`SIGTERM` for graceful shutdown and exit yourself; `SIGKILL` cannot be caught.
- `execFile`/`spawn` with argument arrays (no shell); workers for CPU work, `cluster` for multi-core serving.

---
title: Engines, runtimes and running code with Node
minutes: 13
---
"JavaScript is slow" was true in 2005 and false by 2010, and the reason is the **engine**: the program inside every browser and inside Node that turns your source into machine code while it runs. Understanding roughly how V8 does that — and what Node adds around it — explains why some code is fast, why `node --version` matters, what `process` and `console` really are, and how a script starts and stops. This lesson is the runtime tour: engine, host, and the command line.

## The engine

An engine takes source text and executes it. The three that matter: **V8** (Chrome, Edge, Node, Deno), **SpiderMonkey** (Firefox) and **JavaScriptCore** (Safari, Bun). All three follow the same pipeline:

1. **Parse** the source into an abstract syntax tree; report syntax errors here, before anything runs.
2. **Compile to bytecode** (V8's *Ignition*) and start **interpreting** it immediately — fast start-up.
3. **Profile** while running: which functions are hot, what types flow through them.
4. **JIT-compile** hot functions to optimised machine code (V8's *TurboFan*), speculating on the observed types — an `add(a, b)` that has only ever seen numbers gets a machine-code integer add.
5. **Deoptimise** if a speculation fails (a string arrives), falling back to bytecode and recompiling later.

Two consequences you can see in your own code: **monomorphic** code — functions that always receive the same shapes of object — is much faster than polymorphic code, and objects created with the same properties in the same order share a *hidden class* and stay fast. "Write predictable, boring code" is performance advice as well as style advice.

Memory is managed by a **generational garbage collector** (young objects in a nursery collected often, survivors promoted), the same idea as every other managed runtime; you never free memory by hand, and a leak is an object still reachable from something long-lived — a global, a closure, an event listener.

## The runtime: Node around V8

V8 knows nothing about files, sockets or timers — the *host* provides them. Node wraps V8 with **libuv** (the event loop and asynchronous I/O), and a standard library of modules: `fs`, `path`, `http`, `crypto`, `os`, `child_process`, `readline`, `events`, `stream`. It also provides the globals you meet immediately:

- `console` — `log`, `error` (to stderr), `table`, `time`/`timeEnd`, `dir`.
- `process` — `argv` (command-line arguments), `env` (environment variables), `exit(code)`, `stdin`/`stdout`/`stderr`, `version`, `platform`, `cwd()`, `hrtime`.
- `setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask` — the timer and scheduling functions (lesson 5).
- `require` / `module` / `__dirname` in CommonJS files; `import`/`export` in ES modules.
- `Buffer`, `URL`, `TextEncoder`, `fetch` (18+), `structuredClone` (17+) — the web-flavoured extras.

In the browser the same slot is filled by `window`/`document`/`fetch`/`localStorage`. Code that touches none of the host objects — pure logic — runs unchanged in both.

## Running code

```
node hello.js              # run a file
node -e "console.log(1+1)" # run a one-liner
node                       # start the REPL: type expressions, see results, .exit to leave
node --version             # v16.17.1 on this plan's judge
node --check hello.js      # parse only: catch syntax errors without running
```

Node reads the file, wraps it (in CommonJS) in a function that provides `require`, `module`, `exports`, `__filename` and `__dirname`, runs it top to bottom, then keeps the process alive **as long as anything is pending** — a timer, an open socket, an unfinished read. A script with no pending work exits when the last statement finishes; `process.exit(1)` ends it immediately with a non-zero exit code (the convention for "failed"), and `process.exitCode = 1` sets the code while letting pending work finish.

## Versions and releases

Node ships a new major every six months; even-numbered majors become **LTS** (long-term support) in October and are maintained for 30 months — 16, 18, 20, 22. Projects pin a version with `.nvmrc` or `engines` in `package.json`, and switch with **nvm** or **fnm**. The version decides which ECMAScript features and which built-ins exist: Node 16 has class fields and `at()`, not `structuredClone` or `Array.prototype.toSorted`. When an exercise here says "not on this runtime", that is why.

## Errors you will meet on day one

- `SyntaxError: Unexpected token` at start-up — the parse step failed; the line number is exact, the cause is usually a bracket or a stray comma.
- `ReferenceError: x is not defined` — you used a name that was never declared (a typo, or a browser global in Node).
- `TypeError: undefined is not a function` / `Cannot read properties of undefined (reading 'x')` — you called or dereferenced something that is not there; the most common runtime error in the language.
- `Error: Cannot find module './x'` — a `require` path or a missing `npm install`.

Every uncaught error prints a **stack trace**: the message, then one line per frame from the point of failure outward, each with `file:line:column`. Read the top frame first; the first frame in *your* code is where to look.

## The ecosystem, in one paragraph

**npm** (bundled with Node) is the package manager and registry — the largest in any language. `npm init` creates `package.json`, `npm install lodash` adds a dependency to `node_modules/` and records it, `npx` runs a package's binary without installing it globally. You will meet **TypeScript** (types on top of JavaScript), **ESLint** and **Prettier** (linting and formatting), **Jest**/**Vitest** (tests), and bundlers (**Vite**, **esbuild**) in any real project; none is needed for this plan, where every exercise is one file on plain Node.

## Interview angle

- *"How does V8 execute JavaScript?"* Parse → bytecode interpreted by Ignition → profiling → TurboFan JIT for hot code, with deoptimisation on failed type speculation.
- *"What is Node.js?"* V8 plus libuv (event loop, async I/O) plus a standard library, running JavaScript outside the browser.
- *"What is `process`?"* Node's global for the running process: arguments, environment, stdio, exit.
- *"Why do objects with the same property order run faster?"* They share a hidden class; the JIT emits monomorphic, inline-cached code.
- *"When does a Node program exit?"* When the event loop has nothing pending — or on `process.exit`.

## Key takeaways

- Engines parse, interpret, profile and JIT-compile; predictable shapes and types are fast.
- Node = V8 + libuv + standard modules; `console`, `process`, timers and `require` are host globals.
- `node file.js`, `-e`, the REPL, `--check`; the process lives while work is pending; exit codes signal failure.
- Even majors are LTS; the version fixes the available features — this judge is Node 16.
- Read a stack trace from the top; the four day-one errors each have one usual cause.

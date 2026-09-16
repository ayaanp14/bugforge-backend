---
title: Runtimes and the ecosystem — Node, Deno, Bun, browsers, edge, and the web-standard core
minutes: 12
---
JavaScript runs in more places than any other language: four browser engines, Node, Deno, Bun, a dozen edge/serverless platforms, and inside other programs. They share the language and increasingly share the **web-standard APIs** — `fetch`, `URL`, `Request`/`Response`, Web Streams, `crypto.subtle`, `TextEncoder` — but differ in globals, module defaults, permissions and what they consider core. This lesson maps the runtimes, the common core that makes code portable, the differences that bite, how to write for several targets at once, the package ecosystem's shape and hazards, and where WebAssembly fits.

## The runtimes

- **Browsers** — V8 (Chrome/Edge), SpiderMonkey (Firefox), JavaScriptCore (Safari). Sandboxed, DOM, no file system, ESM natively, permission prompts for capabilities; the only place your code runs on hardware you do not control.
- **Node** — V8 + libuv; the incumbent server runtime and the toolchain host; CommonJS heritage with ESM support; npm; the largest ecosystem; LTS every even major (16 → 18 → 20 → 22 → 24).
- **Deno** — V8, TypeScript first-class, ESM only, URL and npm imports, secure by default (`--allow-net`, `--allow-read` flags), web-standard APIs as the core (`fetch`, `Deno.serve` returning `Response`), built-in formatter/linter/tester.
- **Bun** — JavaScriptCore, written in Zig; a drop-in Node-compatible runtime with a very fast package manager, bundler and test runner built in; TypeScript/JSX without a build step; `Bun.serve`, SQLite built in.
- **Edge / serverless** — Cloudflare Workers (V8 isolates, no Node APIs, request/response model), Vercel Edge, Deno Deploy, Fastly; millisecond cold starts, tight CPU/memory limits, web-standard APIs only.
- **Embedded and others** — Electron/Tauri (desktop with Node/browser combined), React Native/Hermes (mobile), QuickJS (tiny embeddable), Node in AWS Lambda (serverless with Node APIs).

## The common core: web-standard APIs

The **WinterCG** (Web-interoperable Runtimes Community Group, now WinterTC) standardised a minimum common API so server code can be portable: `fetch`, `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, `AbortController`/`AbortSignal`, `TextEncoder`/`TextDecoder`, `ReadableStream`/`WritableStream`/`TransformStream`, `crypto.subtle`/`crypto.randomUUID`, `structuredClone`, `queueMicrotask`, `setTimeout`, `atob`/`btoa`, `performance`, `EventTarget`/`Event`, `Blob`/`File`, `FormData`, `WebSocket` (client), `console`. Node reached most of this by version 18–20 (global `fetch` in 18, `WebSocket` in 22), Deno and Bun from the start. Write against these and your handler runs on Node, Deno, Bun and a Worker with no changes — the frameworks that do this (Hono, Remix's adapters, SvelteKit adapters) are the portable ones.

## Where they differ

- **Globals**: `window`/`document` only in browsers; `process`, `Buffer`, `__dirname`, `require` in Node (Bun provides them; Deno via `node:` compatibility; Workers do not).
- **Modules**: Deno and Workers are ESM-only; Node and Bun accept both; browsers need `type="module"` and full URLs or import maps.
- **File and network access**: browsers have none/limited; Node/Bun unrestricted; Deno permission-gated; Workers have no file system and fetch-only networking (plus their own storage APIs).
- **Timers and event loop details**: `process.nextTick`/`setImmediate` are Node-specific; browsers have `requestAnimationFrame`.
- **Node compatibility**: Bun aims for full; Deno supports `node:` builtins and npm packages; Workers offer a `nodejs_compat` subset. Test on the real target — compatibility layers have gaps (native addons, `fs` semantics, `worker_threads`).
- **Package management**: npm/pnpm/yarn for Node; Bun's `bun install` (npm-compatible, fast); Deno's URL imports, JSR registry and npm specifiers.

## Writing for several targets

Detect capabilities, not runtimes: `typeof fetch === "function"`, `"Deno" in globalThis`, `typeof process !== "undefined" && process.versions?.node`. Isolate platform code behind small adapters (a `readConfig()` that uses `fs` on Node and `Deno.readTextFile` on Deno, or `KV` on Workers) and keep the core pure (module 11). Use package `exports` **conditions** — `"node"`, `"deno"`, `"browser"`, `"workerd"`, `"default"` — to ship different entry files per runtime. Avoid Node-only globals in shared code; prefer `globalThis` and the WinterCG set. TypeScript's `lib` and `@types/node`/`@cloudflare/workers-types` keep each target honest.

## The ecosystem's shape and hazards

npm is the largest package registry in existence — and the most attacked. Practical rules from module 9 apply everywhere: lockfiles and `npm ci`, few dependencies, scoped names, audit with judgement. Beyond security: **dependency churn** (a framework's major version every year), **duplicate installs** (two Reacts break hooks — `npm ls react`), **CJS/ESM dual-package hazards**, **abandoned packages** (check last publish, open issues, bus factor), and **transitive weight** (one convenience package pulling 300 others). Prefer platform APIs where they exist (`fetch` over `axios`, `URL` over query-string libraries, `crypto.randomUUID` over `uuid`, `Intl` over `moment`) — fewer dependencies and portable by construction. Standard-library gaps (a real date type, a schema validator, a robust CLI parser) are where a dependency earns its place.

## WebAssembly

Wasm is a portable binary format every runtime executes: compile Rust, C, Go or AssemblyScript to `.wasm`, load it (`WebAssembly.instantiate`), and call exported functions from JavaScript with near-native speed for CPU-heavy work — image codecs, compression, crypto, physics, SQLite in the browser, ffmpeg.wasm. It is not a JavaScript replacement (no DOM access; JS glue calls it) and not automatically faster for ordinary code (crossing the boundary costs; V8's JIT is excellent at JavaScript). Reach for it when a library already exists in Wasm or a hot numeric kernel dominates a profile.

## Staying current without churning

Follow Node's release schedule and upgrade LTS majors yearly; read the yearly ECMAScript summary and the State of JS survey once; watch TC39 stage 3; try a new tool in a side project before a codebase; prefer boring, standard, portable choices in production (`fetch`, ESM, web APIs, TypeScript) — they age best. The knowledge in this plan (the language, the loop, the module system, the runtime model) outlasts every framework cycle.

## Common mistakes

- Node-only globals (`Buffer`, `process`, `__dirname`) in code meant for browsers or edge.
- Assuming a compatibility layer equals Node (native addons, `fs` edge cases).
- Sniffing user agents or runtime names instead of features.
- A dependency for something the platform provides; two copies of a singleton-style package.
- Choosing a runtime or framework by novelty rather than by the deployment target and team.

## Interview angle

- *"Node versus Deno versus Bun?"* V8 + npm incumbent with CJS heritage; V8 + TypeScript-first, secure-by-default, web-standard core; JSC-based Node-compatible all-in-one with a fast package manager and test runner.
- *"What are the WinterCG APIs?"* The web-standard core (`fetch`, `URL`, Web Streams, `crypto.subtle`, `structuredClone`…) shared by servers and edge runtimes for portability.
- *"How do edge runtimes differ from Node?"* V8 isolates with request/response handlers, millisecond cold starts, no file system, web APIs only, tight limits.
- *"When would you use WebAssembly?"* CPU-heavy kernels or existing native libraries (codecs, compression, SQLite) — not for ordinary application code.
- *"How do you write code that runs on several runtimes?"* Web-standard APIs, feature detection, adapters for platform I/O, `exports` conditions per runtime.

## Key takeaways

- Browsers, Node (LTS even majors), Deno (TS-first, permissions, ESM), Bun (Node-compatible, fast tooling), edge isolates (web APIs, no Node) — same language, different globals and capabilities.
- The WinterCG core (`fetch`, `URL`, streams, `crypto.subtle`, `structuredClone`) is the portable surface; write to it.
- Detect features, isolate platform I/O, use `exports` conditions; test on the real target.
- Fewer dependencies, platform APIs first, lockfiles, watch for duplicates and abandonment.
- Wasm for hot kernels and existing native libraries; JavaScript for everything else.

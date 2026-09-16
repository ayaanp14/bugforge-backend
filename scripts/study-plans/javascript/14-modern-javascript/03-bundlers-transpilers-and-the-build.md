---
title: Bundlers, transpilers and the build — what happens to your code before it runs
minutes: 13
---
Almost no front-end JavaScript runs as written: a **build** parses every module, resolves imports, rewrites new syntax for older targets, removes code nothing uses, splits the result into chunks, minifies it, and emits source maps so errors still point at your lines. Servers increasingly go through the same pipeline (TypeScript, path aliases, bundling for cold-start speed). Understanding the pipeline is what lets you debug "works locally, breaks in production", keep bundles small, and configure a tool instead of copying a config from a blog post. This lesson covers the stages, the major tools and where each fits, tree-shaking and side effects, code splitting, targets and polyfills, source maps, and the package fields that make a library bundle well.

## The stages

1. **Resolve** — turn `import x from "lib"` into a file path (module 9's algorithm plus `exports` conditions, aliases, extensions).
2. **Load & transform** — read the file; run loaders/plugins: TypeScript and JSX → JavaScript, CSS modules, images to URLs or inline data, JSON to objects.
3. **Transpile** — rewrite syntax newer than the **target** (optional chaining → ternaries for old browsers, class fields → constructor assignments) and inject **polyfills** for missing built-ins.
4. **Build the graph** — every import edge; detect circularities; mark side-effect-free modules.
5. **Tree-shake** — drop exports nothing imports (statically analysable only with ESM).
6. **Split** — decide chunks: entry points, dynamic `import()` boundaries, shared vendor code.
7. **Minify** — shorten names, drop whitespace and dead branches (`if (false)`), inline constants.
8. **Emit** — hashed file names for caching, an HTML/manifest that references them, and **source maps**.

Development builds skip 5–7 and serve modules individually for fast reloads; production builds do everything.

## The tools

- **esbuild** — Go, extremely fast transpile + bundle + minify; the engine inside Vite's dev server and many build scripts; less plugin depth.
- **Rollup** — the ESM-native bundler with the best tree-shaking and output control; the classic choice for **libraries**; Vite's production bundler (Rolldown, its Rust successor, is replacing both — this repository's frontend builds with it).
- **Vite** — the application dev server + build: native ESM in development (no bundling, instant start, HMR), Rollup/Rolldown for production, framework plugins for React/Vue/Svelte.
- **webpack** — the long-standing, most configurable bundler; huge ecosystem; slower and more config-heavy; still common in large existing apps and Next.js (moving to Turbopack).
- **Parcel** — zero-config bundler. **Turbopack**, **Rspack** — Rust rewrites of the webpack model.
- **Babel** — the transpiler with the plugin ecosystem (JSX, proposals, `preset-env` with browserslist); slower than esbuild/swc, still used where a plugin is needed.
- **swc** — Rust transpiler used by Next.js and Jest alternatives; **tsc** for type-checking (and emitting, if you want).

Rule of thumb today: applications → Vite; libraries → Rollup/tsup (esbuild-based); scripts → tsx/esbuild; type-check with tsc separately.

## Tree-shaking and side effects

Tree-shaking removes **unused exports**, which requires knowing statically what is imported — ESM's static `import`/`export` make that possible; CommonJS's dynamic `require` largely defeats it. Two things block it:

- **Side effects**: a module that *does* something at import time (registers a polyfill, patches a global, adds CSS) cannot be dropped even if nothing imports its exports. `"sideEffects": false` in a package's `package.json` tells bundlers every module is pure (or an array lists the impure ones); libraries that omit it ship whole.
- **Non-analysable patterns**: `export default { a, b }` (one object — importing `a` keeps `b`), re-exporting a whole CommonJS module, or property access on a namespace at runtime.

Import named exports from ESM packages (`import { debounce } from "lodash-es"` not `import _ from "lodash"`), keep modules pure, and check the output: a bundle analyser (`rollup-plugin-visualizer`, `source-map-explorer`) shows exactly what shipped and why.

## Code splitting

One giant bundle means every visitor downloads every page's code. Splitting points:

- **Dynamic `import()`** — the bundler turns each into a separate chunk loaded on demand (`React.lazy`, route-level splitting — this repository lazy-loads every route).
- **Multiple entries** and **shared chunks** — modules imported by several chunks are hoisted into a common chunk so they download once (module 9's `node_modules` dedupe, at the bundle level).
- **Vendor splitting** — third-party code changes rarely; a separate hashed chunk stays cached across your deploys.

Too many tiny chunks cost round trips (HTTP/2 helps); too few cost download size. Hashed names (`main.3f9a1c.js`) with immutable cache headers make caching safe. Preloading the next likely chunk (`<link rel="modulepreload">`, or a hover-prefetch) hides the latency.

## Targets, browserslist, polyfills

The `target` (esbuild/TypeScript) or **browserslist** query (Babel, Vite, Autoprefixer) decides which syntax gets rewritten. Lower targets mean more, slower output — `async/await` into generator state machines, classes into functions. Set the target to the **oldest supported runtime**, not to ES5 "to be safe". Built-ins are separate: `core-js` via `preset-env`'s `useBuiltIns: "usage"` injects only the polyfills the code uses for the targets that lack them. Modern default: `"defaults"` browserslist (roughly 2–3 years of evergreen browsers), no polyfills at all for most apps.

## Source maps

A `.map` file (or inline comment) maps every position in the output back to the source file, line, column and original name. Browsers and Node (`--enable-source-maps`) apply them for stack traces and breakpoints; error trackers (Sentry) ingest them so production traces read like development. Emit them for every production build; whether to *serve* them publicly is a policy choice (they expose source) — many teams upload to the tracker only. Without them a production error reads `main.js:1:48213` (module 7).

## Environment and constants

Bundlers substitute `process.env.NODE_ENV`/`import.meta.env.*` (Vite: only `VITE_*` variables, inlined at build time — this repository's `VITE_API_URL`) and `define`d constants, then dead-code-eliminate the branches (`if (process.env.NODE_ENV !== "production")` vanishes in production). Anything inlined is public — secrets never go into a front-end build.

## Shipping a library

`package.json` for a library that bundles well: `"type": "module"`, `"exports"` with `import`/`require`/`types` conditions, `"sideEffects": false` (or the honest list), `"files": ["dist"]`, ESM output (plus CJS if consumers need it), **no** bundling of dependencies (declare them; let the app's bundler dedupe), `.d.ts` alongside, source maps included, and a `target` no lower than your consumers need.

## Common mistakes

- Importing a whole CJS utility library (`import _ from "lodash"`) into a tree-shaken app.
- Missing `"sideEffects": false` in a pure library (ships everything); marking it `false` on a library with a CSS import (drops the CSS).
- Transpiling to ES5 for a modern audience — bigger, slower output.
- No source maps in production, or serving them with secrets in comments.
- Secrets in `VITE_*`/`NEXT_PUBLIC_*` variables.
- Ignoring the bundle analyser until the app is slow.

## Interview angle

- *"What does a bundler do?"* Resolves the module graph, transforms and transpiles, tree-shakes, splits into chunks, minifies, emits hashed files with source maps.
- *"What is tree-shaking and what defeats it?"* Removing unused exports using ESM's static structure; side effects and dynamic/CommonJS patterns block it.
- *"How do you reduce bundle size?"* Named ESM imports, route-level dynamic imports, vendor splitting, a modern target, no unneeded polyfills, and an analyser to find the culprits.
- *"Why source maps?"* Production stack traces and breakpoints map back to original code; upload to the error tracker.
- *"esbuild versus Rollup versus Vite versus webpack?"* Fast transpiler/bundler; ESM library bundler with the best output; app dev server + build; the configurable incumbent.

## Key takeaways

- Build stages: resolve → transform → transpile → graph → tree-shake → split → minify → emit (+ source maps).
- Vite for apps, Rollup/tsup for libraries, esbuild/tsx for scripts, tsc for types; Babel/swc where plugins demand.
- Tree-shaking needs ESM, named imports and honest `sideEffects`; check with an analyser.
- Split at routes with dynamic `import()`, share vendor chunks, hash names for caching; target the oldest supported runtime, polyfill by usage.
- Source maps always; inlined env is public; libraries ship ESM with `exports`, `sideEffects` and types.

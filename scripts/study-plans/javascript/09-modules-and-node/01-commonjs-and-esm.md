---
title: CommonJS and ES modules — two module systems, one runtime
minutes: 14
---
JavaScript had no module system for its first fifteen years; Node invented one (**CommonJS**, `require`/`module.exports`) and the language later standardised another (**ES modules**, `import`/`export`). Today both run in Node, they differ in ways that matter — synchronous versus asynchronous loading, copied values versus live bindings, `__dirname` versus `import.meta.url` — and most real projects mix them through the interop rules. This lesson covers what a module *is* (a file with its own scope), each system's mechanics and caching, the differences, the interop rules as they stand on Node 16, circular imports, and dynamic `import()`.

## A module is a file with private scope

Every file is a module: top-level `const`/`function` declarations are private to it, and only what it exports is visible outside. There is no shared global namespace to pollute (a browser `<script>` without `type="module"` is the exception — its top level *is* global). Modules are evaluated **once** and cached: two `require`s or `import`s of the same file return the same instance, so module-level state is a process-wide singleton — a cache, a connection pool, a config object.

## CommonJS

```js
// math.js
const PI = 3.14159;
function area(r) { return PI * r * r; }
module.exports = { PI, area };            // the exports object is what require() returns
// or: exports.area = area;   (exports is an alias for module.exports — do not reassign `exports` itself)

// app.js
const math = require("./math");          // relative path: ./ or ../ — resolves .js, .json, .node, then a directory's index.js
const { area } = require("./math");      // destructure a copy
const fs = require("fs");                // a core module (also "node:fs")
const express = require("express");      // a package: walks up node_modules/ directories
```

`require` is a **synchronous function call**: the file is read, wrapped in `function (exports, require, module, __filename, __dirname) { … }`, executed, and `module.exports` is returned and cached in `require.cache` keyed by absolute path. Because it is a plain function you can call it conditionally, in a loop, with a computed path. Values are **copied** at the moment of `require`: a destructured `count` does not change when the module later changes its own `count`. JSON files can be required directly.

## ES modules

```js
// math.mjs  (or .js with "type": "module" in package.json)
export const PI = 3.14159;
export function area(r) { return PI * r * r; }
export default class Circle { … }

// app.mjs
import Circle, { area, PI as pi } from "./math.mjs";   // default + named; extension REQUIRED in Node
import * as math from "./math.mjs";                     // namespace object (frozen, live)
import fs from "node:fs";                               // core modules
export { area } from "./math.mjs";                      // re-export
```

Imports and exports are **static** — declared at the top level, resolved before any code runs — which lets bundlers tree-shake unused exports and lets the engine link modules before executing them. Loading is **asynchronous**: the whole graph is fetched and linked, then evaluated in dependency order. Bindings are **live**: `import { count }` reflects every later change the exporting module makes to `count` (you cannot assign to it from outside). ES modules are always strict mode, top-level `this` is `undefined`, `await` is allowed at the top level, and `__dirname`/`__filename`/`require` do not exist — use `import.meta.url` (a `file://` URL string) with `fileURLToPath`, and `createRequire(import.meta.url)` when you must `require`.

## Which system a file is

Node decides by extension and the nearest `package.json`: `.mjs` is always ESM, `.cjs` always CommonJS, `.js` follows `"type"` in package.json (`"module"` → ESM, absent or `"commonjs"` → CJS). Getting this wrong produces the two most-searched errors: `Cannot use import statement outside a module` (ESM syntax in a CJS file) and `require is not defined in ES module scope` (the reverse).

## Interop on Node 16

- **ESM importing CJS** works: `import pkg from "./legacy.cjs"` gives `module.exports` as the default export; named imports of CJS work only for exports Node can detect statically (a heuristic — when it fails, import the default and destructure).
- **CJS requiring ESM** does **not** work on Node 16 (`ERR_REQUIRE_ESM`); use `await import("./x.mjs")` from CJS — dynamic import works in both systems. (Node 22 later added `require(esm)` for graphs without top-level `await`.)
- A package can offer both through `"exports"` conditions (`"import"`/`"require"`) — the dual-package pattern, which risks two copies of the module's state if both are loaded.

## Circular dependencies

A requires B, B requires A. CommonJS returns B the **partial** `exports` of A as filled in so far — often an empty object — so `B` sees `undefined` for things A defines later; ESM's live bindings are in their temporal dead zone until evaluated, so reading one throws `ReferenceError: Cannot access 'x' before initialization`. Both are symptoms of the same design problem; break the cycle (move the shared piece to a third module) or defer the use to call time. CommonJS's "sometimes undefined" is the nastier failure because it is silent.

## Dynamic `import()`

```js
const { default: heavy } = await import("./heavy.js");   // returns a promise of the namespace; works in CJS and ESM
if (needsChart) await import("chart.js");                // code-splitting: bundlers make it a separate chunk
const ns = await import("data:text/javascript,export const x = 1");   // any URL Node can load — handy for experiments
```

Use it for conditional or lazy loading, for loading ESM from CJS, and for plugins named at runtime. It is the only form of import that can appear inside functions.

## Choosing, and migrating

New code: ESM (`"type": "module"`), the standard, the one browsers and TypeScript target, the one bundlers optimise. Existing Node projects: often still CJS, and fine. Libraries: ship ESM, add a CJS build only if users need `require`. Migrating a CJS codebase means renaming or setting `"type"`, adding file extensions to relative imports, replacing `__dirname`/`require.resolve`/JSON requires, and dealing with any dependency that is ESM-only or CJS-only.

## Common mistakes

- ESM syntax in a `.js` file without `"type": "module"` (or the reverse).
- Omitting the file extension in ESM relative imports (`import "./math"` fails in Node; bundlers hid this).
- Expecting a destructured CJS value to update; expecting an ESM import to be assignable.
- `require` of an ESM package on Node 16; expecting named imports from every CJS package.
- Reassigning `exports = …` (breaks the alias; assign `module.exports`).
- Module-level state assumed per-import — it is per-process.

## Interview angle

- *"CommonJS versus ESM?"* Synchronous `require` returning copied values versus static, asynchronously-linked `import` with live bindings; ESM is strict, supports top-level `await`, lacks `__dirname`/`require`.
- *"How does Node decide the module type of a file?"* Extension (`.mjs`/`.cjs`) or the nearest `package.json` `"type"`.
- *"Can CJS require ESM?"* Not on Node 16 — use `import()`; ESM can import CJS (default = `module.exports`).
- *"What is a live binding?"* An import that reflects the exporter's current value instead of a copy.
- *"What happens with circular imports?"* CJS hands out partially-filled exports; ESM throws on reading an uninitialised binding.

## Key takeaways

- Every file is a private scope, evaluated once and cached — module state is process-wide.
- CJS: `require`/`module.exports`, synchronous, dynamic, copies; ESM: `import`/`export`, static, asynchronous, live, strict, `import.meta.url`.
- Type by `.mjs`/`.cjs` or `package.json` `"type"`; extensions are mandatory in ESM imports.
- ESM imports CJS (default export); CJS uses `import()` for ESM on Node 16; dual packages risk duplicate state.
- Break circular dependencies; use `import()` for lazy, conditional and runtime-named loading.

---
title: TypeScript in practice — tsconfig, declaration files, builds, migration and the errors you will see
minutes: 12
---
Knowing the type system is half of using TypeScript; the other half is the toolchain around it — a `tsconfig.json` whose dozen important options decide how strict and how compatible your build is, declaration files that describe JavaScript to the compiler, a build step that has to fit next to bundlers and test runners, and a migration path for existing JavaScript. This lesson is the practical layer: the options that matter and why, `.d.ts` files and `@types`, type-only imports, `tsc` versus fast transpilers, the migration recipe, runtime validation as the type system's partner, and the compiler errors you will meet most, decoded.

## `tsconfig.json`, the options that matter

```jsonc
{
  "compilerOptions": {
    "strict": true,                         // the whole strict family — non-negotiable for new code
    "target": "ES2022",                     // the JS syntax to emit; match your runtime (Node 16 → ES2021/ES2022)
    "module": "NodeNext",                   // how imports are emitted/resolved: NodeNext follows package.json "type"; ESNext for bundlers
    "moduleResolution": "NodeNext",         // (or "Bundler" for Vite/webpack projects)
    "lib": ["ES2022", "DOM"],               // built-in type libraries; drop DOM for Node-only code
    "esModuleInterop": true,                // sane default imports from CommonJS
    "noUncheckedIndexedAccess": true,       // arr[i] is T | undefined — catches the most common runtime crash
    "exactOptionalPropertyTypes": true,     // optional means absent, not "or undefined"
    "noImplicitOverride": true, "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,                   // do not re-check node_modules .d.ts — faster, and their errors are not yours
    "outDir": "dist", "rootDir": "src", "declaration": true, "sourceMap": true,
    "isolatedModules": true                 // each file transpilable alone — required by esbuild/swc; forbids const enum & re-exporting types without `type`
  },
  "include": ["src"]
}
```

`strict` enables `noImplicitAny`, `strictNullChecks` (the big one — `null`/`undefined` are not in every type), `strictFunctionTypes`, `strictPropertyInitialization`, `useUnknownInCatchVariables` and more. Turning `strict` off to make errors disappear removes most of TypeScript's value; turn *on* the extra checks above as the project matures. `target` decides which syntax is downlevelled (`??`, `?.`, class fields) — set it to what your Node/browsers support so output stays readable and fast. `module`/`moduleResolution` mismatches produce the `Cannot use import statement`/`ERR_REQUIRE_ESM` family at run time (module 9): for Node projects use `NodeNext` and let `package.json` `"type"` decide.

## Declaration files and `@types`

A `.d.ts` file declares types with no implementation — how the compiler knows about `fs`, the DOM, and every JavaScript library:

```ts
// types/legacy-lib.d.ts
declare module "legacy-lib" {
  export function parse(input: string, opts?: { strict?: boolean }): Record<string, unknown>;
}
declare global { interface Window { analytics?: { track(event: string): void } } }   // augment a global
```

Libraries ship their own (`"types"` in package.json) or the community provides them in **DefinitelyTyped** (`npm i -D @types/express`). Missing types → `Could not find a declaration file for module 'x'` → install `@types/x`, or write a minimal `declare module "x";` (everything `any` — a stopgap). `tsc --declaration` emits `.d.ts` for your own package so consumers get types without your source. `declare` means "this exists at run time; here is its type" — variables, functions, modules, globals.

## Type-only imports and erasure

```ts
import type { User } from "./types";          // erased entirely — no runtime import
import { type Config, loadConfig } from "./config";   // mixed: Config erased, loadConfig kept
export type { User };
```

With `isolatedModules`/`verbatimModuleSyntax`, imports used only as types must say so, or the transpiler cannot know whether to keep the import (a runtime import of a types-only module would fail or run side effects). Habit: `import type` for anything that is only a type.

## Building and running

`tsc` type-checks **and** emits, but it is slow on large projects. The common setup separates the two: a fast transpiler strips types for running and bundling — **esbuild**, **swc**, **tsx**/**ts-node** for scripts (this repository runs its scripts with `tsx`), Vite/Next/webpack loaders for apps, **Bun**/**Deno** natively — and `tsc --noEmit` runs the type check in the editor, in a pre-commit hook and in CI. Fast transpilers do not type-check; if CI skips `tsc --noEmit`, type errors ship. Node 22.6+ can strip types itself (`--experimental-strip-types`); still no checking.

## Migrating JavaScript

1. Add `tsconfig.json` with `allowJs: true`, `checkJs: true`, `strict: false`, `noEmit: true` — the checker runs over `.js` with inference and JSDoc, and reports nothing you have not asked for.
2. Fix what `checkJs` finds; add JSDoc types at module boundaries.
3. Rename files to `.ts` leaf-first (utilities before the code that imports them); `any` where needed with a `// TODO(types)` comment.
4. Turn on `strict` flags one at a time (`noImplicitAny`, then `strictNullChecks` — the largest batch).
5. Delete the `any`s. Track their count; it should only go down.

Big-bang rewrites fail; the incremental path works because TypeScript accepts a mixed codebase.

## Types and runtime validation

Types vanish at run time, so anything from outside needs a check the compiler can rely on. A schema library defines the shape **once** and provides both:

```ts
import { z } from "zod";
const User = z.object({ id: z.string(), name: z.string().min(1), email: z.string().email().optional() });
type User = z.infer<typeof User>;                  // the static type, derived from the schema
const user = User.parse(await res.json());          // runtime validation → a typed value, or a ZodError with paths
```

Hand-written guards (lesson 4) scale to a few shapes; schemas scale to an API. Either way the rule is the same: validate at the boundary, then trust the types inside.

## The errors you will see most

| Error | Means | Fix |
| --- | --- | --- |
| `TS2322: Type 'X' is not assignable to type 'Y'` | shapes differ; read the *last* line of the message for the exact property | fix the value or the type; do not `as` |
| `TS2339: Property 'x' does not exist on type 'Y'` | typo, missing narrowing, or the type is a union without `x` on every member | narrow first; check spelling |
| `TS2345: Argument of type 'A' is not assignable to parameter of type 'B'` | wrong argument shape | same as 2322 |
| `TS7006: Parameter 'x' implicitly has an 'any' type` | un-annotated parameter under `noImplicitAny` | annotate it |
| `TS2531/TS18047/TS18048: Object is possibly 'null' / 'undefined'` | `strictNullChecks` — the value may be absent | check, `?.`, `??`, or handle the case; `!` only when certain |
| `TS2307: Cannot find module 'x' or its corresponding type declarations` | not installed, wrong path/extension, or missing `@types` | install; fix the path; add a declaration |
| `TS2564: Property 'x' has no initializer and is not definitely assigned` | class field not set in the constructor | initialise, make optional, or `!` when a framework assigns it |
| `TS2352: Conversion of type 'A' to type 'B' may be a mistake` | `as` between unrelated types | fix the logic; `as unknown as B` only knowingly |
| `TS1259/TS1192: Module has no default export` | CJS/ESM interop | `esModuleInterop`, or `import * as x` |
| `TS2589: Type instantiation is excessively deep` | a recursive type exploded | simplify the type |

Read errors bottom-up: the last "Type 'X' is not assignable to type 'Y'" line names the actual mismatch.

## Common mistakes

- `strict: false` in a new project; `skipLibCheck` off (slow) or `noEmit` misunderstood.
- Running only a transpiler (esbuild/tsx) with no `tsc --noEmit` in CI — errors ship.
- `import` of a type without `type` under isolated modules; `const enum` in bundled projects.
- `as User` on parsed JSON instead of a schema/guard.
- Migrating by rewriting everything at once; leaving `any` uncounted.
- Ignoring the last line of a long error message.

## Interview angle

- *"Which tsconfig options matter most?"* `strict`, `target`, `module`/`moduleResolution`, `esModuleInterop`, `noUncheckedIndexedAccess`, `skipLibCheck`, `isolatedModules`.
- *"What is a `.d.ts` file?"* Type declarations without implementation — how the compiler knows JavaScript libraries and globals; `@types/*` from DefinitelyTyped.
- *"How do you run TypeScript in production?"* Transpile with tsc/esbuild/swc to JavaScript; type-check separately with `tsc --noEmit` in CI.
- *"How would you migrate a JavaScript codebase?"* `allowJs` + `checkJs`, JSDoc at boundaries, rename leaf-first, enable strict flags incrementally, drive `any` to zero.
- *"How do types relate to runtime validation?"* Types are erased; validate at boundaries with guards or a schema library and infer the type from the schema.

## Key takeaways

- `strict: true` always; match `target` to the runtime; `NodeNext` for Node; `noUncheckedIndexedAccess`, `skipLibCheck`, `isolatedModules` on.
- `.d.ts` and `@types` describe JavaScript to the compiler; `declare module`/`declare global` for gaps; `import type` for type-only imports.
- Transpile fast (esbuild/swc/tsx), type-check separately (`tsc --noEmit`) in editor, hook and CI.
- Migrate incrementally: `checkJs` → JSDoc → rename leaf-first → strict flags → zero `any`.
- Validate at boundaries with schemas whose types you infer; read compiler errors from the last line.

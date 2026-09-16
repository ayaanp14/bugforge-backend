---
title: Checkpoint — TypeScript preview
minutes: 24
---
This checkpoint covers erased types and inference, literal types and widening, `any`/`unknown`/`never`; object types, `interface` versus `type`, structural typing and excess-property checks, intersections, discriminated unions and `satisfies`; function types, generics with constraints, `keyof`/indexed access and the utility types; narrowing, exhaustiveness, type guards, assertion functions and the escape hatches; and the toolchain — tsconfig, declaration files, builds, migration, runtime validation.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module. The programs are JavaScript (the judge runs Node) that model the type system's own rules — inference and widening, structural assignability, utility types over schemas, narrowing — so you reason about what the compiler would do.

**Before you start**, make sure you can answer:

- What `const x = "a"` versus `let x = "a"` infers; what `as const` does; the difference between `any`, `unknown` and `never`.
- Why a class name does not matter for assignability; when excess properties are an error; what a discriminated union's tag is for.
- What `K extends keyof T` and `T[K]` express; how `Omit` is built; what a mapped type is.
- Which checks narrow; why `typeof x === "object"` keeps `null`; what `x is T` and `asserts x is T` do; when `as` is acceptable.
- What `strict` turns on; what a `.d.ts` is; why `tsc --noEmit` must run in CI when esbuild builds; how to migrate JavaScript.

The programs are a schema builder that both validates values and prints the TypeScript type it would infer, an exhaustive state machine over discriminated-union states and events, and a declaration-file generator that infers `.d.ts` text from runtime values.

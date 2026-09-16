---
title: Checkpoint — Modern JavaScript and its tooling
minutes: 24
---
This checkpoint covers the ES2020–2022 features and their pitfalls, the 2023+ additions and the TC39 stage process, how to detect features and write spec-faithful polyfills, the build pipeline (resolve, transpile, tree-shake, split, minify, source maps), the quality toolchain (ESLint flat config, Prettier, test runners, mocking, hooks and CI), and the runtime landscape with its web-standard core.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- `??` versus `||`; how `a?.b.c` short-circuits; why BigInt refuses to mix; which 2022 class features exist.
- What `toSorted`/`with`/`Object.groupBy`/`Promise.withResolvers` do; the TC39 stages and when a proposal is safe to adopt; why syntax cannot be polyfilled.
- The build stages; what defeats tree-shaking; how code splitting and hashed chunks work; what source maps are for.
- Linter versus formatter; the shape of a good test; when to mock; what pre-commit and CI each run.
- Node/Deno/Bun/edge differences; the WinterCG common APIs; feature detection over sniffing.

The programs are a spec-faithful `structuredClone` polyfill (cycles, Dates, Maps, Sets, regexes, and a `DataCloneError` for functions), a miniature bundler that resolves an ESM graph, tree-shakes unused exports and emits one file, and a runtime-support planner that turns feature requirements and a target list into the polyfills and transpile target a build needs.

---
title: Linting, formatting and testing — the quality toolchain
minutes: 12
---
The code you write is checked by three kinds of tool before anyone reviews it: a **linter** that finds likely bugs and enforces rules, a **formatter** that removes every argument about style, and a **test runner** that proves behaviour and keeps proving it. Together with type-checking (module 13) and a pre-commit hook plus CI, they form the pipeline every serious JavaScript project runs. This lesson covers what each does and does not do, how ESLint's flat config and Prettier fit together, the shape of a good test (and what `node:test`, Vitest and Jest share), mocking with restraint, coverage as a signal, and the hook-and-CI wiring that makes the whole thing automatic.

## Linting

A linter parses code into an AST and runs **rules** over it: `no-undef` (an identifier that is never declared), `no-unused-vars`, `eqeqeq` (`==` where `===` was meant), `no-var`, `prefer-const`, `no-floating-promises` (a promise nobody awaits — TypeScript-aware), `react-hooks/rules-of-hooks`, and hundreds more. Rules catch **likely bugs** and **agreed conventions**; they do not prove correctness. Every rule can be `off`, `warn` or `error`, with options.

ESLint's **flat config** (`eslint.config.js`, ESLint 9 default) is an array of config objects:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default [
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["src/**/*.ts"], rules: { eqeqeq: "error", "no-console": ["warn", { allow: ["error"] }] } },
];
```

Later objects override earlier ones for the files they match. Start from the recommended presets, add the type-aware rules where TypeScript is present, and disable rules only with a reason. `eslint --fix` applies the safe autofixes (quote style, unused imports, `let`→`const`); some fixes change semantics and are marked as suggestions instead. A rule that fires hundreds of times in a healthy codebase is the wrong rule, not a hundred bugs.

## Formatting

Formatting is not linting: a **formatter** rewrites whitespace, line breaks, quotes and commas to a canonical layout and has (almost) no options by design — **Prettier** for JavaScript/TypeScript/CSS/Markdown, or **Biome** as a fast Rust alternative that lints too. The gain is not the specific style but the end of style discussions and style diffs: every file looks the same, and reviews see only meaning. Wire it to format on save and in the pre-commit hook; disable ESLint's formatting rules (`eslint-config-prettier`) so the two do not fight. `.editorconfig` covers indentation and line endings for editors that read nothing else.

## Testing

A unit test is a function that arranges inputs, acts, and asserts:

```js
import { test, describe } from "node:test";           // Node 18+; Vitest/Jest have the same shape
import assert from "node:assert/strict";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  test("lower-cases and joins with dashes", () => { assert.equal(slugify("Hello, World!"), "hello-world"); });
  test("collapses repeated separators", () => { assert.equal(slugify("a  --  b"), "a-b"); });
  test("rejects non-strings", () => { assert.throws(() => slugify(42), TypeError); });
});
```

What the runners share: `describe`/`test` (or `it`) blocks, `beforeEach`/`afterEach` hooks, an assertion library (`expect(x).toBe(y)` in Jest/Vitest; `assert.equal`/`deepEqual` in Node), async tests (return a promise or use `await`), `test.only`/`test.skip`, watch mode, and output in a standard format (TAP for Node, which `node --test` prints; `ok 1 - name`, `not ok 2 - name` with a YAML diagnostic block, a `1..N` plan). **Vitest** is the default for Vite projects (same config, ESM-native, Jest-compatible API, fast); **Jest** is the incumbent (CommonJS-first, huge ecosystem); **node:test** needs no dependency and suits libraries and scripts.

Good tests: one behaviour per test, a name that reads as a sentence, arrange/act/assert, no logic (loops/conditions) in the test body, deterministic (no real time, randomness or network), and independent (order must not matter). Test the **behaviour** through the public interface, not the implementation — tests coupled to private structure break on every refactor and catch nothing.

## Mocking, sparingly

A mock replaces a dependency (the clock, a network call, a module) so the test is fast and deterministic. Prefer **dependency injection** — pass `now`, `fetch`, `random` as parameters (module 11's pure core) — so most tests need no mocking framework. Where you must, use the runner's tools: `mock.method(obj, "name", impl)` in Node, `vi.fn()`/`vi.spyOn`/`vi.mock` in Vitest, `jest.fn()`/`jest.mock` in Jest; fake timers (`vi.useFakeTimers()`, `mock.timers` in Node 20) for debounce/retry code. Over-mocked tests pass while the real system fails: mock at the boundary (I/O), not between your own modules, and keep a few **integration tests** that use real pieces.

## Kinds of tests and where they run

Unit (one module, milliseconds, thousands of them), integration (several modules or a real database/HTTP layer — this repository's `billing.test.ts` runs the money path on an in-memory fake), end-to-end (a browser driving the deployed app — Playwright, as in this repository's `e2e/`; slow, few, catch what unit tests cannot). The pyramid: many unit, some integration, few e2e. **Coverage** (`c8`/`--experimental-test-coverage`, Vitest `--coverage`) shows untested lines — useful for finding gaps, harmful as a target (100% coverage of code with no assertions proves nothing).

## Hooks and CI

**Pre-commit** (husky + lint-staged): run the formatter and `eslint --fix` on staged files, and a type-check or fast tests if they finish in seconds — the developer sees problems before the commit exists (this repository's frontend hook runs `eslint --fix` on staged `src/**/*.{ts,tsx}` and must reach zero errors; the backend's runs `tsc`). **CI** (GitHub Actions or similar) runs the full set on every push/PR: install with `npm ci`, lint, `tsc --noEmit`, unit tests, build, e2e on the built app. CI is the gate; hooks are the convenience. Never bypass the hook (`--no-verify`) — fix the finding.

## Common mistakes

- Turning off rules to make the linter quiet instead of understanding them; ESLint formatting rules fighting Prettier.
- Tests with logic, shared mutable state, real timers/network, or names like `test 1`.
- Mocking your own modules until the tests test the mocks.
- Coverage as a goal; snapshot tests of large output that everyone approves blindly.
- Running only a transpiler in CI without types, lint and tests.
- `--no-verify` to skip a failing hook.

## Interview angle

- *"Linter versus formatter?"* Linter finds likely bugs and enforces rules via the AST; formatter canonicalises layout with no semantic checks; run both, and stop ESLint from formatting.
- *"What makes a good unit test?"* One behaviour, arrange/act/assert, deterministic, independent, tests behaviour through the public interface, readable name.
- *"When do you mock?"* At I/O boundaries and for time/randomness — preferably by injecting dependencies; not between your own modules.
- *"What is the testing pyramid?"* Many fast unit tests, fewer integration tests, few end-to-end tests.
- *"What should CI run?"* `npm ci`, lint, type-check, tests, build, then e2e against the build.

## Key takeaways

- ESLint (flat config, recommended presets, type-aware rules) for likely bugs and conventions; Prettier/Biome for layout; `eslint-config-prettier` so they do not overlap.
- Tests: `describe`/`test`, arrange/act/assert, deterministic and independent; `node:test`, Vitest or Jest share the shape; TAP is the common output.
- Inject dependencies instead of mocking; mock only at boundaries; keep some integration tests.
- Pyramid: unit ≫ integration > e2e; coverage is a map, not a score.
- Pre-commit for fast checks on staged files, CI for the full gate; never skip the hook.

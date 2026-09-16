---
title: Maybe, Result and railway-oriented code — making absence and failure values
minutes: 13
---
`undefined` and exceptions are JavaScript's answers to "there is no value" and "this failed", and both are invisible in a function's signature: nothing tells the caller that `findUser` may return `undefined` or that `parseConfig` may throw. Two small wrapper types make those outcomes explicit **values**: `Maybe` (a value that may be absent) and `Result` (a success or a typed failure). With `map` and `flatMap` on them, a chain of steps that might each fail becomes a straight line — the "railway": success rides one track, the first failure switches to the other and skips the rest. This lesson builds both types in a few dozen lines, shows the railway, relates them to things you already use (`?.`, `??`, arrays, promises), and is frank about when plain JavaScript idioms are the better choice.

## Maybe

```js
const Some = (value) => ({
  isSome: true,
  map: (f) => Some(f(value)),
  flatMap: (f) => f(value),                    // f returns a Maybe — avoids Some(Some(x))
  filter: (p) => (p(value) ? Some(value) : None),
  getOrElse: () => value,
  toString: () => `Some(${JSON.stringify(value)})`,
});
const None = {
  isSome: false,
  map: () => None, flatMap: () => None, filter: () => None,
  getOrElse: (fallback) => fallback,
  toString: () => "None",
};
const fromNullable = (v) => (v === null || v === undefined ? None : Some(v));

const city = fromNullable(users.find((u) => u.id === id))
  .flatMap((u) => fromNullable(u.address))
  .map((a) => a.city.toUpperCase())
  .getOrElse("unknown");
```

`map` transforms the value if present; `flatMap` chains a step that itself may produce absence; `None` short-circuits everything; `getOrElse` leaves the type at the end. Compare with the built-in: `users.find(…)?.address?.city?.toUpperCase() ?? "unknown"`. For a chain of property accesses, **optional chaining wins** — shorter, standard, no allocation. `Maybe` earns its place when steps are *functions* that may return nothing (lookups, parses, `find`s), when you want to `filter` in the middle, or when you pass the possibly-absent value around before deciding what to do with it.

## Result

```js
const Ok = (value) => ({
  ok: true, value,
  map: (f) => Ok(f(value)),
  mapErr: () => Ok(value),
  flatMap: (f) => f(value),
  getOrElse: () => value,
  match: ({ ok }) => ok(value),
});
const Err = (error) => ({
  ok: false, error,
  map: () => Err(error),
  mapErr: (f) => Err(f(error)),
  flatMap: () => Err(error),
  getOrElse: (fallback) => fallback,
  match: ({ err }) => err(error),
});
const attempt = (fn) => { try { return Ok(fn()); } catch (e) { return Err(e); } };   // exceptions → Result at the boundary
```

`Result` carries **why** it failed, which `Maybe` cannot. `map` transforms a success; `mapErr` transforms a failure (add context, translate to a user message); `flatMap` chains a step that may fail; `match` forces the caller to handle both cases. `attempt` wraps a throwing function — the adapter between exception-based code (`JSON.parse`) and Result-based code.

## The railway

```js
const parseJson = (text) => attempt(() => JSON.parse(text)).mapErr(() => "not valid JSON");
const requireObject = (v) => (v !== null && typeof v === "object" && !Array.isArray(v) ? Ok(v) : Err("config must be an object"));
const requirePort = (cfg) => (Number.isInteger(cfg.port) && cfg.port > 0 && cfg.port < 65536 ? Ok(cfg) : Err(`port must be 1-65535, got ${JSON.stringify(cfg.port)}`));
const withDefaults = (cfg) => ({ retries: 3, ...cfg });

const loadConfig = (text) => parseJson(text).flatMap(requireObject).flatMap(requirePort).map(withDefaults);

loadConfig('{"port":8080}').match({ ok: (cfg) => start(cfg), err: (msg) => console.error(msg) });
```

Each step is a small pure function; `flatMap` connects those that can fail, `map` those that cannot; the first `Err` rides the failure track to the end untouched, so no step needs an `if (!ok) return`. Errors are values: collect them, count them, log them, return them from an API. Module 7's result objects (`{ ok, value } | { ok, error }`) are this pattern without the methods; adding `map`/`flatMap` is what removes the `if (!r.ok) return r` from every line.

## Collecting many results

`Result` short-circuits at the first failure. For a form or a batch you want **all** failures: fold the results — `const errors = results.filter((r) => !r.ok).map((r) => r.error)`; if none, `Ok(results.map((r) => r.value))`. That is a `sequence`/`traverse` in functional vocabulary; write it as a plain reduce. `Promise.allSettled` is the async version of the same idea.

## You already use these shapes

- **Arrays** have `map`/`flatMap`: an array is "zero or more values" and `flatMap` chains steps that return arrays.
- **Promises** are `Result` for the future: `then` is `map`/`flatMap` (returned promises flatten), `catch` is `mapErr`+recovery, a rejection rides the failure track past every `then`.
- **`?.`/`??`** are a built-in `Maybe` for property paths.

The word for a type with a lawful `map` is *functor*; with `flatMap` (`chain`, `bind`) and a constructor (`Some`, `Ok`, `Promise.resolve`), *monad*. The laws just say `map(identity)` changes nothing and chaining composes associatively — properties you can check in a test and otherwise ignore. You do not need the vocabulary to use the pattern well.

## Where to draw the line

Use `Maybe`/`Result` when: a pipeline has several steps that may each fail or return nothing; failures must be data (APIs, validation reports, batch jobs); or you want the signature to *say* that absence/failure is possible (TypeScript makes this compelling — `Result<Config, ConfigError>`). Prefer plain idioms when: a chain is property access (`?.`), a single call may fail (`try`/`catch` at the boundary), or the code is a script whose failure should simply stop it. A codebase where every function returns `Result` and every call site unwraps it has replaced exceptions with ceremony; the railway is for the stretches where several fallible steps line up.

## Common mistakes

- `map` where `flatMap` was needed — `Some(Some(x))`, `Ok(Ok(x))`, a `Result` inside a `Result`.
- Unwrapping (`getOrElse`, `.value`) in the middle of a chain instead of at the end.
- Losing the error: converting `Err` to `None`, or `mapErr` to a message too early to distinguish causes.
- Mixing exceptions and Results inside one layer — convert at the boundary with `attempt`.
- Building a `Maybe` for a three-level property access that `?.` already handles.
- Making the types heavier (classes, prototypes, generics) than the problem needs.

## Interview angle

- *"What problem do `Maybe`/`Result` solve?"* They make absence and failure explicit values with `map`/`flatMap`, so chains of fallible steps read as straight lines and callers must handle both outcomes.
- *"`map` versus `flatMap` on these?"* `map` applies a plain function to the inner value; `flatMap` applies a function that itself returns the wrapper, avoiding nesting.
- *"How do promises relate?"* A promise is a `Result` over time — `then` maps/chains, rejection is the failure track.
- *"When is optional chaining better than `Maybe`?"* For property paths; `Maybe` for chaining functions that may return nothing.
- *"How do you collect all errors instead of stopping at the first?"* Fold the results: partition into failures and successes (`sequence`/`traverse`).

## Key takeaways

- `Maybe` = `Some(v)` | `None` with `map`/`flatMap`/`filter`/`getOrElse`; `Result` = `Ok(v)` | `Err(e)` with `map`/`mapErr`/`flatMap`/`match`; `attempt` converts throws.
- Railway: `flatMap` for fallible steps, `map` for safe ones; the first failure skips the rest; unwrap once at the end.
- Collect all failures with a fold when partial results matter.
- Arrays, promises and `?.`/`??` are the same shapes you already use; the laws are just sanity checks.
- Use the pattern for stretches of several fallible steps and for failures-as-data; plain idioms elsewhere.

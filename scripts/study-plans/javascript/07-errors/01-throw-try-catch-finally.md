---
title: throw, try, catch, finally — the mechanics, precisely
minutes: 12
---
Errors in JavaScript are values that travel: `throw` hands one up the call stack until some `catch` takes it, running every `finally` on the way. The rules are small but the corners are sharp — a `finally` can override a `return`, you can throw anything (and people do), `catch` catches *everything* including bugs, and in async code the stack it unwinds is not the one you think (module 8). This lesson pins the synchronous mechanics down exactly, describes what an `Error` object carries, and sets the vocabulary — throw, propagate, catch, rethrow, wrap — the rest of the module uses.

## `throw`

```js
throw new Error("amount must be positive");
throw new RangeError(`age ${age} out of range`);   // a built-in subtype (next lesson)
throw "oops";                                        // legal, and a bad idea
```

`throw` takes **any** value. Throwing a non-`Error` — a string, an object literal — loses the stack trace, breaks `instanceof Error` checks and `err.message` reads downstream, and shows up in logs as `Uncaught oops` with no location. Always throw an `Error` (or subclass). A linter rule (`no-throw-literal`) enforces it.

Execution stops at the `throw`: nothing after it in the function runs, and the same is true of every caller up the stack until a `catch` is found. If none is found the exception is **uncaught**: Node prints it and exits with code 1; a browser logs it and continues with the next event.

## `try` / `catch`

```js
try {
  const data = JSON.parse(text);          // may throw SyntaxError
  use(data);
} catch (err) {
  console.error("bad input:", err.message);
}
```

`catch` receives whatever was thrown. It catches **everything** thrown inside the `try` block — including `TypeError`s from your own bugs — so a `catch` that recovers silently can hide real defects. Check what you caught (`if (err instanceof SyntaxError) … else throw err`) or keep the `try` block small enough that only the expected failure can occur in it. Since 2019 the binding is optional: `catch { … }` when you do not need the error.

Variables declared with `let`/`const` inside `try` are not visible in `catch` or after — declare before the `try` if you need the value later.

## `finally`

```js
const handle = open(path);
try {
  return process(handle);
} finally {
  handle.close();                        // runs whether process returned, threw, or the function returned early
}
```

`finally` runs after `try`/`catch` finish, **no matter how**: normal completion, `return`, `break`, `continue`, or a throw that is propagating. It is the place for cleanup — releasing a lock, closing a handle, restoring state — because it is the only construct guaranteed to run on every path. Two corners:

- A `return` or `throw` **inside** `finally` overrides whatever the `try`/`catch` was completing with — a `return` in `finally` swallows a propagating exception. Do not return from `finally`.
- `finally` runs even when `catch` rethrows — the order is `try` → `catch` → `finally` → the exception continues upward.

`try`/`finally` without a `catch` is common and correct: "I do not handle this, but I must clean up."

## The `Error` object

```js
const err = new Error("disk full", { cause: originalError });   // cause: ES2022, Node 16.9+
err.name;        // "Error" — subclasses set their own
err.message;     // "disk full"
err.stack;       // "Error: disk full\n    at save (app.js:12:9)\n    at …" — a string, captured at construction
err.cause;       // the wrapped error
String(err);     // "Error: disk full"   (name: message)
```

`stack` is captured when the object is **created**, not when thrown — creating errors ahead of time gives misleading traces. It is an ordinary string; there is no structured API in the language (Node's `Error.captureStackTrace` and `Error.prepareStackTrace` are V8 extras). `message` and `stack` are own, non-enumerable properties, so `JSON.stringify(err)` gives `{}` — serialise explicitly (`{ name, message, stack }`) for logs and APIs.

## Rethrow and wrap

```js
try { return JSON.parse(text); }
catch (err) {
  if (err instanceof SyntaxError) throw new Error(`config ${path} is not valid JSON`, { cause: err });
  throw err;                              // not ours to handle — propagate unchanged
}
```

**Rethrow** (`throw err`) passes an error you cannot handle onward, keeping its stack. **Wrap** adds context at a layer boundary — the caller learns *which* config, and the original stays reachable as `cause`. Never `throw new Error(err.message)` — it discards the original type, stack and cause. Whether to rethrow or wrap is the subject of lesson 3.

## Errors are values

An exception is only special while it is propagating. Once caught it is an ordinary object: store it, return it, put it in an array of failures, attach it to a result. `const results = items.map((x) => { try { return { ok: true, value: f(x) }; } catch (err) { return { ok: false, err }; } });` processes a batch without one failure aborting the rest — the **result object** pattern, again in lesson 3.

## Common mistakes

- Throwing strings or plain objects.
- `catch (e) {}` — swallowing everything, including bugs.
- Returning from `finally` (silently discards exceptions).
- Wrapping an error by copying `message` into a new `Error` — lose type, stack and cause.
- A huge `try` block around a whole function so the `catch` cannot know what failed.
- Expecting `JSON.stringify(err)` to contain the message.

## Interview angle

- *"What does `finally` guarantee?"* It runs on every exit path — normal, `return`, `throw` — after `try`/`catch`; a `return` inside it overrides the outcome.
- *"Can you throw a non-Error?"* Yes; you should not — no stack, no `message`, breaks `instanceof`.
- *"What is `Error.cause`?"* An option (`new Error(msg, { cause })`) that keeps the original error when wrapping with context.
- *"When is the stack captured?"* At construction, not at `throw`.
- *"Why is `catch (e) {}` dangerous?"* It hides bugs (TypeErrors) alongside the expected failure.

## Key takeaways

- `throw` any value, but always an `Error`; propagation unwinds callers until a `catch`.
- `catch` takes everything — check the type or keep `try` small; the binding is optional.
- `finally` always runs; never `return` from it; `try`/`finally` alone is fine for cleanup.
- `Error` has `name`, `message`, `stack` (captured at construction), optional `cause`; serialise explicitly.
- Rethrow to propagate unchanged; wrap with `{ cause }` to add context; caught errors are ordinary values.

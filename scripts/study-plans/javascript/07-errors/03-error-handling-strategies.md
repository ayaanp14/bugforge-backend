---
title: Where to catch — strategies, boundaries and the result-object alternative
minutes: 13
---
Knowing the syntax of `try`/`catch` is the easy part; knowing *where* to put one is the skill. Catch too early and you swallow information the caller needed; catch too late and one bad record aborts a batch of ten thousand; never catch and the process dies on a typo in a config file. The working rule: errors are handled at **boundaries** — the places where a failure has a meaning to someone (a request, a job, a file, a UI action) — and everything between the throw and the boundary lets them pass, adding context at most. This lesson gives that rule its details: expected failures versus bugs, rethrow versus wrap, per-item recovery, retries, result objects, and the two process-level nets.

## Two kinds of failure

**Expected failures** are part of the domain: invalid input, a missing record, a network timeout, a file that is not there. They will happen in production every day; code must handle them and users must see something sensible. **Bugs** are defects: `undefined.x`, a wrong argument type, an impossible state. Handling them means *finding* them — logging with a stack trace and, usually, failing the current operation loudly so the defect is noticed. The most common error-handling mistake is treating both the same: a `catch` that shows "something went wrong" for a `TypeError` hides a bug behind a friendly message forever.

The type system from the previous lesson is how you tell them apart: `err instanceof AppError` (or a `code`) is expected; anything else is a bug.

## Boundaries

A boundary is where an error stops being a control-flow event and becomes an *outcome*: an HTTP handler turning it into a status code, a CLI's main function printing a message and exiting non-zero, a UI event handler showing a toast, a job runner marking the job failed, a batch loop recording one item's failure. Catch there. Between the throw site and the boundary, functions should **not** catch unless they can do one of three things:

1. **Recover** — try an alternative that satisfies the caller (a cache miss falls through to the database; a missing optional file yields defaults).
2. **Add context** — wrap with `{ cause }` and information only this layer has (which file, which record id, which step), then rethrow.
3. **Clean up** — with `finally`, which is not catching at all.

A `catch` that logs and rethrows at every layer produces the same error in the log five times; log once, at the boundary.

## Rethrow versus wrap

Rethrow (`throw err`) when the caller would handle the original type just as well — most of the time. Wrap when crossing an abstraction: a `ConfigError("config.json invalid", { cause: syntaxError })` tells the operator what to fix; the raw `SyntaxError: Unexpected token }` does not. Wrapping also converts a third-party library's error types into yours, so callers depend on your API rather than on the library's. Keep the `cause`.

## Per-item recovery

```js
const outcomes = records.map((r) => {
  try { return { ok: true, value: importRecord(r) }; }
  catch (err) {
    if (!(err instanceof ValidationError)) throw err;     // a bug aborts the batch — loudly
    return { ok: false, id: r.id, error: err.message };   // an expected failure is recorded and we move on
  }
});
```

A batch has two natural boundaries: the item (expected failures are recorded, processing continues) and the batch (a bug stops everything). Note the `instanceof` guard — the pattern is *not* "catch everything per item".

## Retries

Retry only failures that are **transient** (timeouts, 503s, connection resets) and only operations that are **idempotent** (safe to repeat). A validation error will fail identically every time; retrying a non-idempotent payment charges twice. Bound the attempts, back off between them, and wrap the final failure with the attempt count and the last cause:

```js
function withRetry(fn, { attempts = 3, isTransient }) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return fn(i); }
    catch (err) {
      if (!isTransient(err)) throw err;
      last = err;
    }
  }
  throw new Error(`gave up after ${attempts} attempts`, { cause: last });
}
```

(Asynchronous retries with real delays are the same shape with `await` — module 8.)

## Result objects instead of exceptions

Some failures are so ordinary that throwing is noise: a parser that rejects half its inputs, a lookup that often finds nothing, a validator that reports many problems at once. Return a value that says so:

```js
function parsePort(text) {
  const n = Number(text);
  return Number.isInteger(n) && n > 0 && n < 65536 ? { ok: true, value: n } : { ok: false, error: `invalid port: ${text}` };
}
const r = parsePort(input);
if (!r.ok) return usage(r.error);
```

Discriminated results (`{ ok: true, value } | { ok: false, error }`) make failure visible in the signature, compose with `map`/`filter`, and collect naturally (a list of all validation errors rather than the first). Exceptions remain right for failures that are exceptional, cross many layers, or would otherwise need `if (!r.ok) return r` on every line. Neither is "correct"; mixing them by layer is normal — parsers and validators return results, I/O and invariants throw.

## Do not swallow

`catch (e) {}` and `catch (e) { console.log(e) }` (then continuing as if it worked) are the two forms of the worst bug: the program proceeds in a state it never expected, and the failure surfaces later somewhere unrelated. If you truly cannot handle an error, let it propagate. If a failure genuinely does not matter (best-effort telemetry, optional cache warm-up), say so in a comment *and* keep the `try` block to the single call that may fail.

## The last nets

`process.on("uncaughtException", handler)` and `process.on("unhandledRejection", handler)` catch what nothing else did. They are for **logging and exiting cleanly** — flush the log, close connections, `process.exit(1)` — not for continuing: after an uncaught exception the process may be in an inconsistent state, and Node's documentation says to restart. A supervisor (systemd, a container orchestrator, PM2) restarts the process; that is the recovery. In a browser, `window.onerror`/`unhandledrejection` are the equivalents, used to report to telemetry.

## Messages that help

A good message says **what** failed, **which** (the id, path or field), and if possible **what would fix it**: `config db.port must be 1–65535, got 70000` rather than `invalid config`. Include values, never secrets. Messages are for developers and operators; the boundary decides what a user sees.

## Common mistakes

- One `try`/`catch` around everything, showing a generic message for bugs and expected failures alike.
- Catching at every layer to log — five copies of one error.
- Catching per item without a type guard, so a bug in the loop body silently fails every record.
- Retrying non-transient or non-idempotent operations, or without a bound.
- Continuing after `uncaughtException`.
- Messages without the identifying value.

## Interview angle

- *"Where should errors be caught?"* At boundaries — where a failure becomes an outcome; intermediate layers recover, add context, or clean up, otherwise let it pass.
- *"Expected failure versus bug?"* Domain failures are handled and shown; bugs are logged with a stack and fail loudly; `instanceof AppError`/`code` separates them.
- *"When would you return a result object instead of throwing?"* Ordinary, frequent, or multiple failures — parsers and validators — where the signature should show it.
- *"When is a retry appropriate?"* Transient failure, idempotent operation, bounded attempts with backoff.
- *"What should `uncaughtException` do?"* Log, clean up, exit; let a supervisor restart.

## Key takeaways

- Separate expected failures (handle, show) from bugs (log with stack, fail loudly) by type or code.
- Catch at boundaries; in between, recover, wrap-with-cause, or `finally` — otherwise propagate.
- Per-item recovery needs a type guard; a bug should still abort the batch.
- Retry only transient + idempotent, bounded, with backoff; wrap the final failure.
- Result objects for ordinary failures; exceptions for exceptional ones; never swallow; `uncaughtException` means exit.

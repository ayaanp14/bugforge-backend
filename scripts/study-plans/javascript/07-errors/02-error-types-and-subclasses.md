---
title: The built-in error types, and designing your own
minutes: 12
---
The language ships seven error constructors, and the runtime throws each for a specific class of mistake — `TypeError` for "wrong kind of value", `RangeError` for "right kind, impossible value", `SyntaxError` for text that does not parse, `ReferenceError` for a name that does not exist. Knowing which is which tells you what a stack trace means before you read the message, and it tells you which to throw yourself when input is bad. Above them you build **your own** hierarchy — an `AppError` base with a machine-readable `code`, subclasses per failure kind, `cause` for wrapping — so callers can handle by type instead of parsing messages. This lesson covers both halves and how errors should cross a JSON boundary.

## The built-ins

| Type | The runtime throws it when… | You throw it when… |
| --- | --- | --- |
| `TypeError` | a value is the wrong type for an operation: `undefined.x`, `null()`, `x is not a function`, assigning to a frozen property, `new` on an arrow | an argument is the wrong type (`expected a string, got number`) |
| `RangeError` | a value is the right type but out of range: `new Array(-1)`, `(1).toFixed(101)`, `"x".repeat(-1)`, `BigInt(1.5)`, stack overflow (`Maximum call stack size exceeded`) | a numeric argument is out of bounds (`age must be 0–150`) |
| `SyntaxError` | source or `JSON.parse` input does not parse: `JSON.parse("{")`, `eval("(")`, a bad regex literal | your parser rejects input |
| `ReferenceError` | an undeclared identifier is read: `undefinedVariable`, or a `let`/`const` in its temporal dead zone | rarely — it signals a bug, not bad input |
| `URIError` | `decodeURIComponent("%")` and friends get malformed escapes | almost never |
| `EvalError` | historically from `eval`; unused by modern engines | never |
| `AggregateError` | `Promise.any` rejects with every rejection in `.errors` (2021) | you collect several failures into one |

All inherit from `Error`, so `instanceof Error` is true for each and `err.name` is the type's name. A **stack overflow** is a `RangeError` (V8), not a special crash — you can catch it, though the recovery options are few.

Messages are **not** part of the specification. `Cannot read properties of undefined (reading 'x')` is V8's wording; Firefox says `x is undefined`. Never branch on message text; branch on type (`instanceof`) or on a code you attached yourself.

## Which to throw

Pick by *kind of wrongness*: wrong type → `TypeError`; right type, bad value → `RangeError`; unparsable text → `SyntaxError`; anything domain-specific → your own class. Reserve `ReferenceError` for the engine. A plain `Error` is fine for one-off failures that no caller will distinguish.

## Your own error classes

```js
class AppError extends Error {
  constructor(message, { code, cause, ...extra } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;      // "ValidationError" etc., without repeating it in each subclass
    this.code = code;                       // machine-readable: "E_VALIDATION"
    Object.assign(this, extra);             // any structured fields (field, status, retryable)
  }
}
class ValidationError extends AppError {
  constructor(field, message, options) { super(message, { code: "E_VALIDATION", field, ...options }); }
}
class NotFoundError extends AppError {
  constructor(what, id) { super(`${what} ${id} not found`, { code: "E_NOT_FOUND", status: 404 }); }
}

try { … }
catch (err) {
  if (err instanceof ValidationError) respond(400, { field: err.field, message: err.message });
  else if (err instanceof NotFoundError) respond(404, { message: err.message });
  else throw err;                            // unknown: not ours to handle here
}
```

Rules that make a hierarchy useful:

- **One base class** per package or application so `err instanceof AppError` separates "expected, ours" from "unexpected, a bug".
- **A `code`** — a stable string constant. Types can be checked with `instanceof` only inside one process with one copy of the class; a code survives serialisation, logging, a different bundle, and a different language on the other end of the wire.
- **Structured fields** (`field`, `status`, `retryable`) instead of data embedded in the message.
- **Set `name`**; V8 prints `${name}: ${message}` at the top of the stack, so a wrong name misleads every log line.
- **Keep the constructor signature small**; a subclass that takes `(field, message)` is nicer to throw than one that takes an options bag.

Two to three levels is plenty. A twelve-class error tree is a smell; a base class plus a `code` per case usually does the job.

## `cause` and chains

`new AppError("could not save order", { cause: dbError })` keeps the low-level error attached. Walk the chain when logging:

```js
function describe(err) {
  const parts = [];
  for (let e = err; e; e = e.cause) parts.push(`${e.name}: ${e.message}`);
  return parts.join(" <- ");
}
```

`cause` is set only when passed as an option; `err.cause` is `undefined` otherwise. It can be any value, but keep it an `Error`.

## Errors across a boundary

`JSON.stringify(err)` yields `{}` (own properties `message`/`stack` are non-enumerable; your added fields *are* enumerable and would appear alone). Serialise deliberately:

```js
const toJSON = (err) => ({ name: err.name, code: err.code, message: err.message, ...(err.field && { field: err.field }) });
```

Never send `stack` to an end user (leaks paths and internals); do send it to your logs. On the receiving side rebuild by `code`, not by `name`, and treat the message as display text.

## Checking the type

`err instanceof ValidationError` is the normal check. It fails when two copies of the class exist (duplicate package versions, iframes) — the same failure `instanceof` has everywhere. `err.code === "E_VALIDATION"` and `err.name === "ValidationError"` survive that; `code` is the robust one because nobody renames it by accident.

## `AggregateError`

```js
try { await Promise.any([a(), b()]); }
catch (err) { err instanceof AggregateError && err.errors.forEach(log); }

throw new AggregateError(failures, `${failures.length} items failed`);   // your own batch failure
```

The one built-in for "several things went wrong at once".

## Common mistakes

- Branching on `err.message` text.
- Throwing `Error` with the type encoded in the message (`"VALIDATION: bad email"`) instead of a class or code.
- Forgetting `this.name`, so logs read `Error: …` for every custom class.
- `instanceof` across package copies; or `err.name` checks that break when a subclass is added.
- Sending `stack` to clients; or `JSON.stringify(err)` and wondering where the message went.

## Interview angle

- *"TypeError versus RangeError?"* Wrong type of value versus right type but impossible value.
- *"What throws `ReferenceError`?"* Reading an undeclared name or a `let`/`const` in its TDZ — a bug signal.
- *"How do you design custom errors?"* `extends Error`, set `name`, add a stable `code` and structured fields, one base class, `cause` for wrapping.
- *"Why a `code` when you have classes?"* It survives serialisation, duplicate class copies and other languages.
- *"Is a stack overflow catchable?"* Yes — it is a `RangeError` in V8.

## Key takeaways

- `TypeError` (wrong type), `RangeError` (bad value / stack overflow), `SyntaxError` (unparsable, incl. JSON), `ReferenceError` (unknown name), `AggregateError` (many at once).
- Messages are engine-specific display text; branch on type or `code`, never on text.
- Custom errors: `extends Error`, `this.name = this.constructor.name`, a `code`, structured fields, one base class, shallow tree.
- Wrap with `{ cause }` and walk the chain when logging.
- Serialise errors explicitly; stack to logs only; match by `code` across boundaries.

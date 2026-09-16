---
title: Validation, guard clauses and assertions — failing early with a useful message
minutes: 12
---
Most exceptions worth having are thrown on purpose, at the edge, the moment a bad value arrives — because the alternative is a `TypeError` twelve calls later in code that had nothing to do with the mistake. This lesson is the craft of that early failure: validating inputs where they enter, guard clauses that keep the happy path flat, `TypeError`/`RangeError` with messages that name the value, collecting *all* problems for a form, invariants asserted with `node:assert`, and the specific traps around `JSON.parse`, numbers and property lookups that make JavaScript validation different from other languages.

## Validate at the edge

Data enters a program at a few places: request bodies, CLI arguments, files, environment variables, third-party responses, user events. Validate **there**, once, and convert to well-typed values; code behind the edge then trusts its inputs. Validation sprinkled through internal functions is repetitive, inconsistent and still misses the edges. The internal functions get *assertions* instead (below) — cheap checks of things that must already be true.

## Guard clauses

```js
function withdraw(account, amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) throw new TypeError(`amount must be a number, got ${typeof amount}`);
  if (amount <= 0) throw new RangeError(`amount must be positive, got ${amount}`);
  if (amount > account.balance) throw new InsufficientFundsError(account.id, amount, account.balance);
  account.balance -= amount;                 // the happy path, unindented, last
}
```

Check and throw at the top, in order from "wrong type" to "wrong value" to "domain rule"; the real work follows without nesting. Each guard names **the parameter, the rule, and the actual value** — `got ${amount}` is the difference between a message that fixes the bug and one that starts a search. Interpolate `typeof x` for type failures, `JSON.stringify(x)` for small values, never entire request bodies or secrets.

## JavaScript-specific checks

- **Numbers.** `typeof x === "number"` admits `NaN` and `Infinity`. Use `Number.isFinite(x)` for "a real number", `Number.isInteger(x)` for integers, `Number.isSafeInteger` for ids. `Number("")` is `0` and `Number(" 12 ")` is `12` — parse then check, do not trust `Number()` alone; `parseInt("12px")` is `12`, which may or may not be what you want.
- **Strings.** Check `typeof`, then `trim()`, then length and pattern. An empty string is falsy — `if (!name)` rejects it, which is usually right, but `if (!count)` rejects a legitimate `0`. Compare against `undefined`/`""` explicitly when zero is valid.
- **Objects and arrays.** `typeof [] === "object"` and `typeof null === "object"`: test `Array.isArray(x)` and `x !== null && typeof x === "object"`. Test fields with `Object.hasOwn(x, "k")` or `"k" in x`; `x.k !== undefined` cannot tell "absent" from "present as undefined".
- **Optional values.** `x ?? default` treats `null` and `undefined` as missing and keeps `0`/`""`/`false`; `x || default` does not. Choose deliberately.
- **`JSON.parse`.** Always inside `try`/`catch` for external text; it throws `SyntaxError`. Parsing succeeds for `"null"`, `"42"` and `"[]"` — check the *shape* after parsing, not just that parsing worked.
- **Prototype keys.** Data keyed by user strings: reject or skip `__proto__`, `constructor`, `prototype`, or use a `Map`.

## Collect everything, or fail on the first?

A function called from code fails on the first problem — one throw, one message. A **form** or **config file** should report *all* problems at once, or the user fixes one and discovers the next on every round trip. Collect into an array and throw one error (or return a result) at the end:

```js
function validateUser(u) {
  const errors = [];
  if (typeof u.name !== "string" || u.name.trim() === "") errors.push("name: required");
  if (!Number.isInteger(u.age) || u.age < 0 || u.age > 150) errors.push(`age: must be 0–150, got ${JSON.stringify(u.age)}`);
  if (typeof u.email !== "string" || !u.email.includes("@")) errors.push("email: must contain @");
  if (errors.length) throw new ValidationError(errors);
  return { name: u.name.trim(), age: u.age, email: u.email.toLowerCase() };
}
```

Validation is also **normalisation**: return the cleaned value (trimmed, lower-cased, defaults applied) so the rest of the program handles one canonical shape. Schema libraries (zod, Joi, Ajv) do exactly this at scale; the hand-rolled version teaches what they generate.

## Assertions: invariants, not input

```js
const assert = require("node:assert/strict");
function take(queue) {
  assert(queue.length > 0, "take() on an empty queue");        // AssertionError if false
  assert.equal(typeof queue[0].id, "string");
  …
}
```

An **assertion** states something the code believes is already true — a precondition guaranteed by the caller, a postcondition of your own algorithm, a loop invariant. It is not validation of external input: if it fails, the bug is in the program, not in the data, and the right outcome is a loud `AssertionError` (`err.code === "ERR_ASSERTION"`, `err.actual`/`err.expected` populated) that stops the operation. `node:assert/strict` uses `===` semantics for `equal`/`deepEqual`; the legacy `assert.equal` uses `==` — prefer strict. Assertions document assumptions for the reader as much as they check them; they should never have side effects, because some codebases strip them in production.

## Fail fast

The principle behind all of this: detect a bad state as **early** and as **close to its cause** as possible, and stop rather than continue with corrupted data. A crash with a good message at the edge costs minutes; a wrong number written to a database because a `NaN` slipped through costs a weekend. Fail fast is not "crash the server" — the boundary decides the outcome (400 to the client, a logged failure for the job); it is "do not proceed past a check you know has failed".

## Common mistakes

- `if (!value)` when `0`, `""` or `false` are valid inputs.
- Trusting `typeof x === "number"` (NaN passes) or `Number(text)` (empty string gives 0).
- `JSON.parse` without `try`/`catch`, or without checking the parsed shape.
- Validating deep inside internal functions instead of at the edge; or asserting external input instead of validating it.
- Messages without the actual value; messages that leak secrets.
- Returning the first error from a form validator.

## Interview angle

- *"Where do you validate input?"* At the edges, once, converting to trusted, normalised values; internals assert invariants.
- *"How do you check for a real number in JavaScript?"* `Number.isFinite(x)` (or `Number.isInteger`), not `typeof` alone.
- *"Assertion versus validation?"* Validation guards external data and produces a user-facing outcome; an assertion checks an internal invariant and its failure means a bug.
- *"Why collect all validation errors?"* One round trip for the user; the caller sees the whole picture.
- *"What is fail fast?"* Detect bad state as early and as near its cause as possible and stop, rather than continue and corrupt.

## Key takeaways

- Validate at the edge, normalise, and trust inside; guard clauses first, happy path last, flat.
- Messages name the parameter, the rule and the actual value (`got …`); never secrets.
- `Number.isFinite`/`isInteger`, `Array.isArray`, `x !== null && typeof x === "object"`, `Object.hasOwn`, `??` versus `||`, `JSON.parse` in `try`, guard prototype keys.
- Forms and configs collect every error; functions fail on the first.
- `node:assert/strict` for invariants — a failed assertion is a bug, not bad input; fail fast.

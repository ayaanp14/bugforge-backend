import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "errors",
  title: "Errors and error handling",
  blurb: "throw/try/catch/finally precisely; the built-in error types and custom hierarchies with codes and cause; where to catch — boundaries, per-item recovery, retries, result objects; validation and assertions; reading stack traces and decoding the common messages.",
  icon: "alert",
  overview: `Error handling is the part of a program that runs when the plan failed, and it is judged by whether anyone can tell what happened. JavaScript gives you very little structure — \`throw\` takes any value, \`catch\` takes everything, messages are engine-specific text — so the discipline has to come from you: throw real \`Error\`s of the right type, give your own errors a name and a stable code, wrap with \`cause\` when crossing a layer, and catch only where a failure becomes an outcome.

The module starts with the mechanics, including the corners (\`finally\` overriding a \`return\`, the stack captured at construction, \`JSON.stringify(err)\` being \`{}\`). The type lesson maps each built-in to what triggers it and shows a small, useful custom hierarchy. The strategy lesson answers the real question — where to catch — with boundaries, expected-versus-bug, per-item recovery guarded by type, bounded retries, and result objects for ordinary failures. Validation and assertions follow: fail early at the edge with messages that name the value, collect all problems for a form, assert invariants inside. The last lesson teaches you to read a stack trace top to bottom and decodes the fourteen messages that account for most bugs.

The exercises trace \`finally\` order, classify real runtime errors by type, build an error hierarchy with \`cause\` chains, run a batch with per-item recovery that still aborts on a bug, implement retry, validate and normalise records, parse a stack trace, and decode error messages — then a transaction processor, a config loader with wrapped causes, and an RPN calculator that raises the right type for each bad input.`,
  lessons: [
    {
      slug: "throw-try-catch-finally",
      file: "01-throw-try-catch-finally.md",
      exercises: [
        {
          title: "In what order does it run?",
          prompt: `Write \`run(mode, log)\` with a \`try\`/\`catch\`/\`finally\`. The \`try\` pushes \`"try"\` and, for modes \`throw\` and \`rethrow\`, throws \`new Error("boom")\`; otherwise it returns \`"from try"\`. The \`catch\` pushes \`catch <message>\`, rethrows in mode \`rethrow\`, otherwise returns \`"from catch"\`. The \`finally\` pushes \`"finally"\` and, in mode \`override\` only, returns \`"from finally"\`. For each input line (a mode) call \`run\` inside an outer \`try\`/\`catch\` and print \`mode=<mode>: <log joined by ,> -> <returned value>\` or \`-> outer caught <message>\`.

Example: \`ok\`, \`throw\`, \`override\`, \`rethrow\` →
\`\`\`
mode=ok: try,finally -> from try
mode=throw: try,catch boom,finally -> from catch
mode=override: try,finally -> from finally
mode=rethrow: try,catch boom,finally -> outer caught boom
\`\`\`
\`finally\` ran every time, and its \`return\` replaced the \`try\`'s.`,
          starterFile: "code/finally-order.starter.js",
          solutionFile: "code/finally-order.solution.js",
          hints: ["A return inside finally overrides both a return from try and a propagating exception — which is exactly why you should not write one outside an exercise.", "The outer try/catch is the boundary that observes the rethrow."],
          cases: [
            { stdin: "ok\nthrow\noverride\nrethrow\n", expected: "mode=ok: try,finally -> from try\nmode=throw: try,catch boom,finally -> from catch\nmode=override: try,finally -> from finally\nmode=rethrow: try,catch boom,finally -> outer caught boom\n" },
            { stdin: "rethrow\nok\n", expected: "mode=rethrow: try,catch boom,finally -> outer caught boom\nmode=ok: try,finally -> from try\n", hidden: true },
          ],
        },
        {
          title: "Safe division with the right error types",
          prompt: `Write \`divide(a, b)\` that throws \`TypeError("operands must be finite numbers, got <a> and <b>")\` unless both are finite numbers and \`RangeError("division by zero")\` when \`b\` is 0. For each input line \`a b\` (converted with \`Number\`) print \`<a> / <b> = <result>\` or \`<name>: <message>\`. Count failures in the \`catch\` and every line in the \`finally\`; end with \`processed=<n> failed=<m>\`.

Example: \`10 2\`, \`1 0\`, \`x 3\`, \`7 -2\` →
\`\`\`
10 / 2 = 5
RangeError: division by zero
TypeError: operands must be finite numbers, got NaN and 3
7 / -2 = -3.5
processed=4 failed=2
\`\`\``,
          starterFile: "code/safe-divide.starter.js",
          solutionFile: "code/safe-divide.solution.js",
          hints: ["Number.isFinite rejects NaN and Infinity; typeof would not.", "finally is the one place a counter runs on both the success and the failure path."],
          cases: [
            { stdin: "10 2\n1 0\nx 3\n7 -2\n", expected: "10 / 2 = 5\nRangeError: division by zero\nTypeError: operands must be finite numbers, got NaN and 3\n7 / -2 = -3.5\nprocessed=4 failed=2\n" },
            { stdin: "0 5\n", expected: "0 / 5 = 0\nprocessed=1 failed=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A `try` block throws and the `finally` block contains `return 1;`. The caller sees…",
          options: ["The exception", "The value `1` — a `return` in `finally` overrides the propagating exception", "Both", "`undefined`"],
          answer: 1,
          explanation: "Which is why returning from `finally` is a bug in real code.",
        },
        {
          prompt: "`throw \"not found\"` is discouraged because…",
          options: ["It is a syntax error", "A string has no stack trace, fails `instanceof Error`, and has no `.message` — every consumer breaks", "Strings cannot be caught", "It is slower"],
          answer: 1,
          explanation: "Always throw an `Error` or a subclass.",
        },
        {
          prompt: "When is `err.stack` captured?",
          options: ["At `throw`", "At `new Error(...)` — construction, not throwing", "At `catch`", "Lazily when read"],
          answer: 1,
          explanation: "An error created in a helper and thrown elsewhere points at the helper.",
        },
        {
          prompt: "`JSON.stringify(new Error(\"x\"))` gives…",
          options: ["`{\"message\":\"x\"}`", "`{}` — `message` and `stack` are own but non-enumerable", "`\"Error: x\"`", "An error"],
          answer: 1,
          explanation: "Serialise explicitly with `{ name, message, code }`.",
        },
        {
          prompt: "`catch (e) {}` around a block is dangerous because…",
          options: ["It is slow", "It swallows every error including `TypeError`s from bugs, and the program continues in a state it never expected", "It prevents `finally`", "It only catches strings"],
          answer: 1,
          explanation: "Check the type or keep the `try` small enough that only the expected failure can happen inside.",
        },
      ],
    },
    {
      slug: "error-types-and-subclasses",
      file: "02-error-types-and-subclasses.md",
      exercises: [
        {
          title: "Classify what the runtime throws",
          prompt: `The starter holds twelve named snippets that each fail in a different way — reading a property of \`undefined\`, \`new Array(-1)\`, \`JSON.parse("{")\`, an undeclared name, \`decodeURIComponent("%")\`, \`BigInt(1.5)\`, \`(1).toFixed(101)\`, writing to a frozen object, assigning to a \`const\`, a negative \`repeat\` count, throwing a string. For each snippet name on input run it and print \`<name>: <error.constructor.name> instanceofError=<bool>\` (or \`<name>: no error\`).

Example: \`read-undefined\`, \`negative-array\`, \`bad-json\`, \`unknown-name\`, \`repeat-negative\`, \`throw-string\` →
\`\`\`
read-undefined: TypeError instanceofError=true
negative-array: RangeError instanceofError=true
bad-json: SyntaxError instanceofError=true
unknown-name: ReferenceError instanceofError=true
repeat-negative: RangeError instanceofError=true
throw-string: String instanceofError=false
\`\`\`
Print the constructor name only — messages are engine-specific text.`,
          starterFile: "code/classify-errors.starter.js",
          solutionFile: "code/classify-errors.solution.js",
          hints: ["err.constructor.name works for the thrown string too: \"just text\".constructor is String.", "A negative repeat count is the right kind of value with an impossible size — a RangeError, like new Array(-1)."],
          cases: [
            { stdin: "read-undefined\ncall-undefined\nnegative-array\nbad-json\nunknown-name\nbad-uri\nbigint-fraction\ntoo-many-digits\nfrozen-write\nconst-assign\nrepeat-negative\nthrow-string\n", expected: "read-undefined: TypeError instanceofError=true\ncall-undefined: TypeError instanceofError=true\nnegative-array: RangeError instanceofError=true\nbad-json: SyntaxError instanceofError=true\nunknown-name: ReferenceError instanceofError=true\nbad-uri: URIError instanceofError=true\nbigint-fraction: RangeError instanceofError=true\ntoo-many-digits: RangeError instanceofError=true\nfrozen-write: TypeError instanceofError=true\nconst-assign: TypeError instanceofError=true\nrepeat-negative: RangeError instanceofError=true\nthrow-string: String instanceofError=false\n" },
            { stdin: "bad-json\nrepeat-negative\n", expected: "bad-json: SyntaxError instanceofError=true\nrepeat-negative: RangeError instanceofError=true\n", hidden: true },
          ],
        },
        {
          title: "A small error hierarchy with cause",
          prompt: `Given \`AppError(message, { code, cause, ...extra })\` (sets \`name\` from the constructor, stores \`code\` and any extra fields), write \`ValidationError(field, message)\` (code \`E_VALIDATION\`, stores \`field\`) and \`NotFoundError(what, id)\` (message \`<what> <id> not found\`, code \`E_NOT_FOUND\`, \`status\` 404), plus \`describe(err)\` that walks \`cause\` producing \`Name: message <- Name: message\`. Commands: \`validate <field> <value>\` throws a ValidationError \`<field> is required\` when the value is \`-\`, else prints \`valid <field>=<value>\`; \`find <what> <id>\` throws NotFoundError when the id ends in \`0\`, else prints \`found <what> <id>\`; \`wrap <message...>\` throws a \`RangeError("inner value out of range")\`, catches it and rethrows \`AppError(message, { code: "E_WRAP", cause })\`. Caught errors print \`<name> [<code>] <message> field=<field or -> status=<status or -> isAppError=<bool> chain=<describe>\`.

Example: \`validate email -\`, \`find order 120\`, \`wrap could not save\` →
\`\`\`
ValidationError [E_VALIDATION] email is required field=email status=- isAppError=true chain=ValidationError: email is required
NotFoundError [E_NOT_FOUND] order 120 not found field=- status=404 isAppError=true chain=NotFoundError: order 120 not found
AppError [E_WRAP] could not save field=- status=- isAppError=true chain=AppError: could not save <- RangeError: inner value out of range
\`\`\``,
          starterFile: "code/error-hierarchy.starter.js",
          solutionFile: "code/error-hierarchy.solution.js",
          hints: ["Subclass constructors just call super(message, { code, ...fields }); the base sets this.name = this.constructor.name.", "for (let e = err; e; e = e.cause) walks the chain."],
          cases: [
            { stdin: "validate email -\nvalidate email ada@x\nfind order 120\nfind order 121\nwrap could not save\n", expected: "ValidationError [E_VALIDATION] email is required field=email status=- isAppError=true chain=ValidationError: email is required\nvalid email=ada@x\nNotFoundError [E_NOT_FOUND] order 120 not found field=- status=404 isAppError=true chain=NotFoundError: order 120 not found\nfound order 121\nAppError [E_WRAP] could not save field=- status=- isAppError=true chain=AppError: could not save <- RangeError: inner value out of range\n" },
            { stdin: "find user 0\n", expected: "NotFoundError [E_NOT_FOUND] user 0 not found field=- status=404 isAppError=true chain=NotFoundError: user 0 not found\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`(1).toFixed(101)` throws a…",
          options: ["`TypeError`", "`RangeError` — the right type of value, but out of the allowed range", "`SyntaxError`", "`ReferenceError`"],
          answer: 1,
          explanation: "`new Array(-1)`, `\"x\".repeat(-1)` and stack overflow are also `RangeError`s.",
        },
        {
          prompt: "Why give custom errors a `code` string when they already have a class?",
          options: ["Classes cannot be caught", "A code survives serialisation, logging, duplicate copies of the class and other languages; `instanceof` does not", "Codes are faster", "It is required by `Error`"],
          answer: 1,
          explanation: "Match by `code` across a boundary; `instanceof` inside one process.",
        },
        {
          prompt: "Branching on `err.message` text is fragile because…",
          options: ["Messages are frozen", "Messages are engine-specific and unspecified — V8 and Firefox word the same error differently", "Messages are always empty", "`message` is not a string"],
          answer: 1,
          explanation: "Branch on the type or on a code you attached.",
        },
        {
          prompt: "`new Error(\"save failed\", { cause: dbErr })` — what does `cause` give you?",
          options: ["A retry", "The original error stays attached for logging and diagnosis while the message gains context", "A different `name`", "Nothing — it is ignored"],
          answer: 1,
          explanation: "Never `throw new Error(err.message)` — that drops type, stack and cause.",
        },
        {
          prompt: "A `ReferenceError` in production most likely means…",
          options: ["Bad user input", "A bug — an undeclared identifier or a `let`/`const` used before its line", "A network failure", "A JSON problem"],
          answer: 1,
          explanation: "You almost never throw it yourself.",
        },
      ],
    },
    {
      slug: "error-handling-strategies",
      file: "03-error-handling-strategies.md",
      exercises: [
        {
          title: "A batch with two boundaries",
          prompt: `Records arrive one per line: \`ok <id>\`, \`invalid <id> <reason>\` (the starter's \`importRecord\` throws a \`ValidationError\`) or \`crash <id>\` (it throws a \`TypeError\` — a bug). Process every record inside an item-level \`try\`/\`catch\` that recovers **only** from \`ValidationError\` (print \`skipped <id>: <message>\`), rethrowing anything else; successes print \`imported <id>\`. Wrap the loop in a batch-level \`try\`/\`catch\`: on normal completion print \`done: imported=<n> skipped=<m>\`; when a bug escapes print \`fatal: <name>: <message> - batch aborted after <records seen> records (imported=<n> skipped=<m>)\`.

Example: \`ok r1\`, \`invalid r2 bad\`, \`crash r3\`, \`ok r4\` →
\`\`\`
imported r1
skipped r2: r2: bad
fatal: TypeError: unexpected null record at r3 - batch aborted after 3 records (imported=1 skipped=1)
\`\`\`
\`r4\` was never processed — a bug stops the batch, an expected failure does not.`,
          starterFile: "code/batch-import.starter.js",
          solutionFile: "code/batch-import.solution.js",
          hints: ["if (!(err instanceof ValidationError)) throw err; is the whole point of the item-level catch.", "Count records as they are seen so the fatal line can report how far the batch got."],
          cases: [
            { stdin: "ok r1\ninvalid r2 missing name\nok r3\ninvalid r4 age out of range\nok r5\n", expected: "imported r1\nskipped r2: r2: missing name\nimported r3\nskipped r4: r4: age out of range\nimported r5\ndone: imported=3 skipped=2\n" },
            { stdin: "ok r1\ninvalid r2 bad\ncrash r3\nok r4\n", expected: "imported r1\nskipped r2: r2: bad\nfatal: TypeError: unexpected null record at r3 - batch aborted after 3 records (imported=1 skipped=1)\n" },
          ],
        },
        {
          title: "Bounded retry with a wrapped final failure",
          prompt: `Implement \`withRetry(fn, { attempts, isTransient })\`: call \`fn(i)\` for \`i = 1…attempts\`; on success print \`attempt <i>: ok\` and return the value; on a transient error print \`attempt <i>: failed (transient)\` and try again; on a non-transient error print \`attempt <i>: failed (permanent) - not retrying\` and rethrow; after the last attempt throw \`Error("gave up after <attempts> attempts", { cause: lastError })\`. Input \`attempts failures kind\`: the flaky function fails for the first \`failures\` calls with a \`TransientError("attempt i timed out")\` (or \`PermanentError("attempt i rejected")\` when kind is \`permanent\`), then returns \`ok on attempt i\`. Print \`result=<value>\` or \`failed: <cause chain joined by " <- ">\`.

Example: \`3 2 transient\` →
\`\`\`
attempt 1: failed (transient)
attempt 2: failed (transient)
attempt 3: ok
result=ok on attempt 3
\`\`\`
\`3 5 transient\` → three failures then \`failed: Error: gave up after 3 attempts <- TransientError: attempt 3 timed out\`.`,
          starterFile: "code/retry.starter.js",
          solutionFile: "code/retry.solution.js",
          hints: ["Retry only when isTransient(err) is true; a permanent failure is rethrown immediately.", "Keep the last error so the final wrapper can carry it as cause."],
          cases: [
            { stdin: "3 2 transient\n", expected: "attempt 1: failed (transient)\nattempt 2: failed (transient)\nattempt 3: ok\nresult=ok on attempt 3\n" },
            { stdin: "3 5 transient\n", expected: "attempt 1: failed (transient)\nattempt 2: failed (transient)\nattempt 3: failed (transient)\nfailed: Error: gave up after 3 attempts <- TransientError: attempt 3 timed out\n" },
            { stdin: "3 1 permanent\n", expected: "attempt 1: failed (permanent) - not retrying\nfailed: PermanentError: attempt 1 rejected\n", hidden: true },
            { stdin: "2 0 transient\n", expected: "attempt 1: ok\nresult=ok on attempt 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Errors should be caught…",
          options: ["In every function, to be safe", "At boundaries — where a failure becomes an outcome (a request, a job, a UI action, a batch item); layers in between recover, add context, or clean up", "Only at the top level", "Never — let the process crash"],
          answer: 1,
          explanation: "Catching to log at every layer produces the same error five times.",
        },
        {
          prompt: "Per-item recovery in a batch should…",
          options: ["Catch everything and continue", "Catch only the expected failure types and rethrow the rest — a bug should still abort the batch loudly", "Skip the `catch`", "Retry each item forever"],
          answer: 1,
          explanation: "Without the type guard a bug in the loop body silently fails every record.",
        },
        {
          prompt: "A retry is appropriate when the failure is…",
          options: ["Any failure", "Transient (timeout, 503) **and** the operation is idempotent, with bounded attempts and backoff", "A validation error", "A `TypeError`"],
          answer: 1,
          explanation: "Retrying a non-idempotent payment charges twice; a validation error fails identically every time.",
        },
        {
          prompt: "A result object `{ ok, value } | { ok: false, error }` is preferable to throwing when…",
          options: ["Never", "The failure is ordinary and frequent (a parser, a validator reporting many problems) and belongs in the signature", "The failure is a bug", "Performance is critical"],
          answer: 1,
          explanation: "Exceptions remain right for exceptional failures that cross many layers.",
        },
        {
          prompt: "`process.on(\"uncaughtException\", …)` should…",
          options: ["Resume normal operation", "Log, clean up and exit — the process may be inconsistent; a supervisor restarts it", "Retry the request", "Be avoided entirely"],
          answer: 1,
          explanation: "Node's documentation says exactly this.",
        },
      ],
    },
    {
      slug: "validation-and-assertions",
      file: "04-validation-and-assertions.md",
      exercises: [
        {
          title: "Validate, collect and normalise",
          prompt: `Write \`validateUser(u)\`: throw a \`TypeError("user must be an object, got <null|array|typeof>")\` when \`u\` is not a plain object; otherwise collect **every** problem — \`name: required\` (non-empty string after trim), \`age: must be an integer 0-150, got <JSON>\`, \`email: must contain @\` — and throw one \`Error\` with the problems joined by \`; \`; when valid return the normalised record (trimmed name, lower-cased email). Input lines are JSON users, or \`assert <a> <b>\`, which runs \`assert.equal(Number(a), Number(b))\` from \`node:assert/strict\` and prints \`assert <a> <b>: passed\` or \`AssertionError code=<code> actual=<> expected=<>\`. Print \`ok: <JSON>\`, \`invalid: <message>\` or \`type error: <message>\`.

Example: \`{"name":" Ada ","age":36,"email":"ADA@X.io"}\`, \`{"name":"","age":-1,"email":"nope"}\`, \`assert 2 3\`, \`[1,2]\` →
\`\`\`
ok: {"name":"Ada","age":36,"email":"ada@x.io"}
invalid: name: required; age: must be an integer 0-150, got -1; email: must contain @
AssertionError code=ERR_ASSERTION actual=2 expected=3
type error: user must be an object, got array
\`\`\``,
          starterFile: "code/validate-users.starter.js",
          solutionFile: "code/validate-users.solution.js",
          hints: ["Number.isInteger(u.age) rejects 30.5, NaN and strings in one check.", "An AssertionError carries code, actual and expected as fields."],
          cases: [
            { stdin: "{\"name\":\" Ada \",\"age\":36,\"email\":\"ADA@X.io\"}\n{\"name\":\"\",\"age\":-1,\"email\":\"nope\"}\n{\"name\":\"Bo\",\"age\":30.5,\"email\":\"b@c\"}\nassert 1 1\nassert 2 3\n[1,2]\n", expected: "ok: {\"name\":\"Ada\",\"age\":36,\"email\":\"ada@x.io\"}\ninvalid: name: required; age: must be an integer 0-150, got -1; email: must contain @\ninvalid: age: must be an integer 0-150, got 30.5\nassert 1 1: passed\nAssertionError code=ERR_ASSERTION actual=2 expected=3\ntype error: user must be an object, got array\n" },
            { stdin: "42\n", expected: "type error: user must be an object, got number\n", hidden: true },
          ],
        },
        {
          title: "Result objects for parsing and lookups",
          prompt: `Write \`parseJson(text)\` returning \`{ ok: true, value }\` or \`{ ok: false, error: "parse failed (<error name>)" }\` — never throwing — and \`getPath(obj, "a.b.c")\` that walks the path with \`Object.hasOwn\`, returning \`{ ok: true, value }\` or \`{ ok: false, error: "missing '<key>' at <path so far or <root>>" }\` (a non-object along the way counts as missing). Line 1 is the JSON text; every following line is a path. If parsing failed print its error and nothing else; otherwise print \`<path> = <JSON of value>\` or \`<path>: <error>\` per path.

Example: \`{"db":{"host":"x","port":5432},"tags":["a"]}\` then \`db.port\`, \`db.user\`, \`tags\`, \`db.host.length\` →
\`\`\`
db.port = 5432
db.user: missing 'user' at db
tags = ["a"]
db.host.length: missing 'length' at db.host
\`\`\`
\`length\` is a property of the string, but not an **own** property of a plain-data object — the lookup is deliberately strict.`,
          starterFile: "code/safe-json-get.starter.js",
          solutionFile: "code/safe-json-get.solution.js",
          hints: ["Print only the error's name for JSON failures: the message wording differs between engines.", "Keep an array of keys walked so far to build the 'at' location."],
          cases: [
            { stdin: "{\"db\":{\"host\":\"x\",\"port\":5432},\"tags\":[\"a\"]}\ndb.port\ndb.user\ntags\ndb.host.length\n", expected: "db.port = 5432\ndb.user: missing 'user' at db\ntags = [\"a\"]\ndb.host.length: missing 'length' at db.host\n" },
            { stdin: "{oops\ndb.port\n", expected: "parse failed (SyntaxError)\n", hidden: true },
            { stdin: "{\"a\":null}\na\na.b\n", expected: "a = null\na.b: missing 'b' at a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The check for \"a real number\" in JavaScript is…",
          options: ["`typeof x === \"number\"`", "`Number.isFinite(x)` — `typeof` lets `NaN` and `Infinity` through", "`x == +x`", "`!isNaN(x)`"],
          answer: 1,
          explanation: "`Number.isInteger` for integers; `Number(\"\")` is 0, so parse then check.",
        },
        {
          prompt: "A form validator should…",
          options: ["Throw on the first problem", "Collect every problem and report them together, so the user fixes all of them in one round", "Return `false`", "Log and continue"],
          answer: 1,
          explanation: "A function called from code fails on the first; a form or config reports all.",
        },
        {
          prompt: "Assertion versus validation:",
          options: ["Synonyms", "Validation guards external input and yields a user-facing outcome; an assertion checks an internal invariant and its failure means a bug", "Assertions are for input", "Validation is only in tests"],
          answer: 1,
          explanation: "`node:assert/strict` throws an `AssertionError` with `code: \"ERR_ASSERTION\"`.",
        },
        {
          prompt: "`if (!count) throw …` is wrong when…",
          options: ["Never", "`0` is a legitimate value — `0`, `\"\"` and `false` are falsy; compare against `undefined` explicitly", "`count` is a string", "In strict mode"],
          answer: 1,
          explanation: "`x ?? default` keeps `0`/`\"\"`/`false`; `x || default` does not.",
        },
        {
          prompt: "`JSON.parse(text)` succeeded. What else must be checked?",
          options: ["Nothing", "The **shape** — `\"null\"`, `\"42\"` and `\"[]\"` all parse successfully", "The text length", "The encoding"],
          answer: 1,
          explanation: "Parsing in `try`/`catch` handles syntax; validation handles meaning.",
        },
      ],
    },
    {
      slug: "debugging-and-stack-traces",
      file: "05-debugging-and-stack-traces.md",
      exercises: [
        {
          title: "Parse a stack trace",
          prompt: `The input is a V8-style stack trace: a header \`<Name>: <message>\` and frames \`    at fn (file:line:col)\` or \`    at file:line:col\` (function-less; treat the function as \`<anonymous>\`) or \`    at fn (<anonymous>)\` (native). Print \`error: <Name> - <message>\`; \`frames=<count> top=<fn>@<file>:<line>:<col>\`; \`yours=<fn> <file>:<line> col <col>\` for the first frame whose file is neither \`<anonymous>\` nor starts with \`node:\` (or \`yours=none\`); and \`route=<function names of those non-native frames joined by " <- ">\`.

Example:
\`\`\`
TypeError: Cannot read properties of undefined (reading 'name')
    at greet (/app/src/greet.js:12:22)
    at Array.map (<anonymous>)
    at renderList (/app/src/list.js:40:15)
    at main (/app/src/index.js:8:3)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
\`\`\`
→
\`\`\`
error: TypeError - Cannot read properties of undefined (reading 'name')
frames=5 top=greet@/app/src/greet.js:12:22
yours=greet /app/src/greet.js:12 col 22
route=greet <- renderList <- main
\`\`\``,
          starterFile: "code/stack-parser.starter.js",
          solutionFile: "code/stack-parser.solution.js",
          hints: ["One regex with alternatives covers the three frame shapes; check which capture group matched.", "The frames are innermost first — the first one is the top."],
          cases: [
            { stdin: "TypeError: Cannot read properties of undefined (reading 'name')\n    at greet (/app/src/greet.js:12:22)\n    at Array.map (<anonymous>)\n    at renderList (/app/src/list.js:40:15)\n    at main (/app/src/index.js:8:3)\n    at Module._compile (node:internal/modules/cjs/loader:1105:14)\n", expected: "error: TypeError - Cannot read properties of undefined (reading 'name')\nframes=5 top=greet@/app/src/greet.js:12:22\nyours=greet /app/src/greet.js:12 col 22\nroute=greet <- renderList <- main\n" },
            { stdin: "RangeError: Maximum call stack size exceeded\n    at f (/x/a.js:2:20)\n    at f (/x/a.js:2:20)\n    at /x/a.js:5:1\n", expected: "error: RangeError - Maximum call stack size exceeded\nframes=3 top=f@/x/a.js:2:20\nyours=f /x/a.js:2 col 20\nroute=f <- f <- <anonymous>\n", hidden: true },
          ],
        },
        {
          title: "Decode the message",
          prompt: `Build a table of \`[regex, category, hint(match)]\` rules and classify each input line (an error message) into: \`undefined-read\` (\`Cannot read properties of undefined/null (reading 'k')\` → \`the expression before .k is undefined\`), \`undefined-write\` (\`Cannot set properties of null\` → \`assigning through null - the object was never created\`), \`not-a-function\` (\`x is not a function\` → \`x holds data, a wrong import, or the wrong receiver\`), \`not-defined\` (\`x is not defined\` → \`no x in scope: typo or missing import\`), \`tdz\` (\`Cannot access 'x' before initialization\` → \`x is used before its let/const/class line runs\`), \`const-assign\`, \`stack-overflow\`, \`json\` (any \`Unexpected token\`/\`Unexpected end of JSON\`/\`in JSON at position\`), \`circular\`, \`class-without-new\` (→ \`call new X(...)\`), else \`unknown: read the top frame of the stack\`. Print \`<category>: <hint>\` per line.

Example: \`Cannot read properties of undefined (reading 'name')\`, \`user.save is not a function\`, \`foo is not defined\`, \`Class constructor Point cannot be invoked without 'new'\` →
\`\`\`
undefined-read: the expression before .name is undefined
not-a-function: user.save holds data, a wrong import, or the wrong receiver
not-defined: no foo in scope: typo or missing import
class-without-new: call new Point(...)
\`\`\``,
          starterFile: "code/decode-messages.starter.js",
          solutionFile: "code/decode-messages.solution.js",
          hints: ["Order the rules: the specific 'is not a function' before the generic ones; capture the identifier with (.+?).", "Match the four fixed hints exactly: 'you reassigned a const - use let, or mutate a property', 'unbounded recursion: check the base case', 'JSON.parse got text that is not JSON - log the raw text', 'JSON.stringify met a cycle - break it or use a replacer'."],
          cases: [
            { stdin: "Cannot read properties of undefined (reading 'name')\nuser.save is not a function\nfoo is not defined\nCannot access 'x' before initialization\nAssignment to constant variable.\nMaximum call stack size exceeded\nUnexpected token } in JSON at position 42\nConverting circular structure to JSON\nClass constructor Point cannot be invoked without 'new'\nsomething entirely different\n", expected: "undefined-read: the expression before .name is undefined\nnot-a-function: user.save holds data, a wrong import, or the wrong receiver\nnot-defined: no foo in scope: typo or missing import\ntdz: x is used before its let/const/class line runs\nconst-assign: you reassigned a const - use let, or mutate a property\nstack-overflow: unbounded recursion: check the base case\njson: JSON.parse got text that is not JSON - log the raw text\ncircular: JSON.stringify met a cycle - break it or use a replacer\nclass-without-new: call new Point(...)\nunknown: read the top frame of the stack\n" },
            { stdin: "Cannot set properties of null (setting 'x')\nUnexpected end of JSON input\n", expected: "undefined-write: assigning through null - the object was never created\njson: JSON.parse got text that is not JSON - log the raw text\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a stack trace, the frames are listed…",
          options: ["Outermost first", "Innermost first — the top frame is where the error was created", "Alphabetically", "Randomly"],
          answer: 1,
          explanation: "Find the first frame in your own code and read its line **and column**.",
        },
        {
          prompt: "`Cannot read properties of undefined (reading 'x')` means…",
          options: ["`x` is undefined", "The expression to the **left** of `.x` evaluated to `undefined`", "`x` is not declared", "`x` is not a function"],
          answer: 1,
          explanation: "Look at what produced the object — a `find` that returned `undefined`, an unawaited promise, a misspelled key.",
        },
        {
          prompt: "Stack traces through a `setTimeout` callback are short because…",
          options: ["Callbacks have no stack", "The callback runs later from the event loop; the frames that scheduled it have already returned", "V8 truncates them", "They are hidden for security"],
          answer: 1,
          explanation: "V8 reconstructs `await` chains (async stack traces), not callback chains.",
        },
        {
          prompt: "A source map…",
          options: ["Compresses code", "Maps positions in minified or bundled output back to the original files and lines; devtools apply it, Node needs `--enable-source-maps`", "Lists dependencies", "Is only for CSS"],
          answer: 1,
          explanation: "Without it a production trace says `main.js:1:48213`.",
        },
        {
          prompt: "`console.log(err.message)` in a `catch` is worse than `console.error(err)` because…",
          options: ["It is slower", "It discards the stack, the name and any `code`/fields, and writes to stdout instead of stderr", "It throws", "Messages are private"],
          answer: 1,
          explanation: "Log the error object; walk `cause` for wrapped errors.",
        },
      ],
    },
    {
      slug: "errors-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A transaction processor with all-or-nothing transfers",
          prompt: `Using the starter's \`AppError\`, define \`AccountNotFound(id)\` (code \`E_NOT_FOUND\`, message \`account <id> not found\`), \`InvalidAmount(text)\` (code \`E_INVALID_AMOUNT\`, \`invalid amount <text>\` — for anything not a finite positive number) and \`InsufficientFunds(id, need, have)\` (code \`E_INSUFFICIENT\`, \`<id> has <have>, needs <need>\`). Commands: \`open <id> <amount>\`, \`deposit <id> <amount>\`, \`withdraw <id> <amount>\`, \`transfer <from> <to> <amount>\` — which must validate **both** accounts and the balance before changing anything, so a failed transfer leaves every balance untouched — and \`show\` (prints \`balances: id=balance ...\` in creation order). Print \`<code>: <message>\` for each \`AppError\`; rethrow anything else. End with \`errors: <code=count sorted by code>\` (or \`errors: none\`).

Example (excerpt): \`open ada 100\`, \`open bob 20\`, \`transfer ada bob 60\`, \`transfer ada cy 10\`, \`transfer bob ada 500\`, \`show\` →
\`\`\`
E_NOT_FOUND: account cy not found
E_INSUFFICIENT: bob has 80, needs 500
balances: ada=40 bob=80
errors: E_INSUFFICIENT=1 E_NOT_FOUND=1
\`\`\``,
          starterFile: "code/transactions.starter.js",
          solutionFile: "code/transactions.solution.js",
          hints: ["Helpers account(id) and amountOf(text) throw the right error; transfer calls both lookups first, then checks the balance, then mutates.", "Count errors by code in a Map and sort the entries by code at the end."],
          cases: [
            { stdin: "open ada 100\nopen bob 20\ndeposit ada 50\nwithdraw bob 30\ntransfer ada bob 60\ntransfer ada cy 10\ntransfer bob ada 500\ndeposit ada -5\nwithdraw zed 1\nshow\n", expected: "E_INSUFFICIENT: bob has 20, needs 30\nE_NOT_FOUND: account cy not found\nE_INSUFFICIENT: bob has 80, needs 500\nE_INVALID_AMOUNT: invalid amount -5\nE_NOT_FOUND: account zed not found\nbalances: ada=90 bob=80\nerrors: E_INSUFFICIENT=2 E_INVALID_AMOUNT=1 E_NOT_FOUND=2\n" },
            { stdin: "open a 10\ntransfer a b 5\nshow\n", expected: "E_NOT_FOUND: account b not found\nbalances: a=10\nerrors: E_NOT_FOUND=1\n", hidden: true },
          ],
        },
        {
          title: "A config loader that keeps the cause",
          prompt: `Each line is a JSON config. \`loadConfig(text)\` parses it (a \`SyntaxError\` is wrapped as \`ConfigError("config is not valid JSON", { cause })\`), requires a plain object (\`ConfigError("config must be an object")\` with a \`TypeError("got <null|array|typeof>")\` cause), then validates \`host\` (non-empty string, trimmed; \`TypeError("host must be a non-empty string, got <JSON>")\`), \`port\` (integer 1–65535; \`RangeError("port must be 1-65535, got <JSON>")\`) and \`retries\` (default 3; non-negative integer; \`RangeError("retries must be a non-negative integer, got <JSON>")\`) — each field failure wrapped as \`ConfigError("invalid config at <field>", { cause })\`. Print \`ok: host=<> port=<> retries=<>\` or \`error chain: <Name: message <- Name: message>\`, showing a \`SyntaxError\` by name only (its message differs between engines).

Example: \`{"host":"db.local","port":5432}\`, \`{"host":"x","port":70000}\`, \`{oops\`, \`[1,2]\` →
\`\`\`
ok: host=db.local port=5432 retries=3
error chain: ConfigError: invalid config at port <- RangeError: port must be 1-65535, got 70000
error chain: ConfigError: config is not valid JSON <- SyntaxError
error chain: ConfigError: config must be an object <- TypeError: got array
\`\`\``,
          starterFile: "code/config-loader.starter.js",
          solutionFile: "code/config-loader.solution.js",
          hints: ["A check(field, fn) helper that catches and wraps keeps the three validations uniform.", "In describe, print e instanceof SyntaxError ? e.name : `${e.name}: ${e.message}`."],
          cases: [
            { stdin: "{\"host\":\"db.local\",\"port\":5432}\n{\"host\":\"\",\"port\":5432}\n{\"host\":\"x\",\"port\":70000}\n{\"host\":\"x\",\"port\":80,\"retries\":-1}\n{oops\n[1,2]\n", expected: "ok: host=db.local port=5432 retries=3\nerror chain: ConfigError: invalid config at host <- TypeError: host must be a non-empty string, got \"\"\nerror chain: ConfigError: invalid config at port <- RangeError: port must be 1-65535, got 70000\nerror chain: ConfigError: invalid config at retries <- RangeError: retries must be a non-negative integer, got -1\nerror chain: ConfigError: config is not valid JSON <- SyntaxError\nerror chain: ConfigError: config must be an object <- TypeError: got array\n" },
            { stdin: "{\"host\":\" h \",\"port\":1,\"retries\":0}\n", expected: "ok: host=h port=1 retries=0\n", hidden: true },
          ],
        },
        {
          title: "An RPN calculator with typed failures",
          prompt: `Evaluate each line as a reverse-Polish expression over \`+ - * /\` and decimal numbers. Throw \`SyntaxError("unknown token '<t>'")\` for anything else, \`SyntaxError("not enough operands for '<op>'")\` when an operator finds fewer than two values, \`SyntaxError("too many operands: <n> left on the stack")\` when more than one value remains, and \`RangeError("division by zero")\`. Print \`<expression> = <result>\` or \`<name>: <message>\`; count every line in a \`finally\` and failures in the \`catch\`; end with \`evaluated=<n> failed=<m>\`.

Example: \`3 4 +\`, \`5 1 2 + 4 * + 3 -\`, \`1 0 /\`, \`1 +\`, \`1 2 3\`, \`2 x *\` →
\`\`\`
3 4 + = 7
5 1 2 + 4 * + 3 - = 14
RangeError: division by zero
SyntaxError: not enough operands for '+'
SyntaxError: too many operands: 3 left on the stack
SyntaxError: unknown token 'x'
evaluated=6 failed=4
\`\`\``,
          starterFile: "code/rpn-calculator.starter.js",
          solutionFile: "code/rpn-calculator.solution.js",
          hints: ["A table of operator functions keyed by token, tested with Object.hasOwn, keeps the loop to three branches.", "Pop b then a — the order matters for - and /."],
          cases: [
            { stdin: "3 4 +\n5 1 2 + 4 * + 3 -\n1 0 /\n1 +\n1 2 3\n2 x *\n", expected: "3 4 + = 7\n5 1 2 + 4 * + 3 - = 14\nRangeError: division by zero\nSyntaxError: not enough operands for '+'\nSyntaxError: too many operands: 3 left on the stack\nSyntaxError: unknown token 'x'\nevaluated=6 failed=4\n" },
            { stdin: "10 2 /\n-3 3 +\n", expected: "10 2 / = 5\n-3 3 + = 0\nevaluated=2 failed=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Order of execution for `try { A } catch { B } finally { C }` when `A` throws:",
          options: ["A, C", "A (until the throw), B, C", "A, C, B", "B, A, C"],
          answer: 1,
          explanation: "`finally` runs after `catch`, even when `catch` rethrows.",
        },
        {
          prompt: "`let`/`const` declared inside `try` are…",
          options: ["Visible in `catch` and after", "Block-scoped to the `try` block — declare before the `try` if you need them later", "Hoisted to the function", "Global"],
          answer: 1,
          explanation: "A common source of `ReferenceError` after a `try`.",
        },
        {
          prompt: "`JSON.parse(\"{\")` throws a…",
          options: ["`TypeError`", "`SyntaxError`", "`RangeError`", "`JSONError`"],
          answer: 1,
          explanation: "Any unparsable text — source or JSON — is a `SyntaxError`.",
        },
        {
          prompt: "`Promise.any` rejects with…",
          options: ["The first rejection", "An `AggregateError` whose `.errors` holds every rejection", "`undefined`", "An array"],
          answer: 1,
          explanation: "The one built-in for several failures at once; you can construct it yourself for batches.",
        },
        {
          prompt: "Why set `this.name = this.constructor.name` in an error base class?",
          options: ["For `instanceof` to work", "So logs and `String(err)` show the subclass name instead of `Error`, without repeating it in every subclass", "It is required", "To make it enumerable"],
          answer: 1,
          explanation: "V8 prints `${name}: ${message}` at the top of the stack.",
        },
        {
          prompt: "`err instanceof ValidationError` can be `false` for a genuine `ValidationError` when…",
          options: ["It was thrown asynchronously", "Two copies of the class exist (duplicate package versions, iframes) — a `code` check survives this", "It was caught twice", "It has a `cause`"],
          answer: 1,
          explanation: "Same failure mode `instanceof` has everywhere.",
        },
        {
          prompt: "Wrapping an error by `throw new Error(err.message)` loses…",
          options: ["Nothing", "The original type, stack and any `cause`/fields — use `{ cause: err }` instead", "Only the stack", "Only the name"],
          answer: 1,
          explanation: "Add context; keep the original attached.",
        },
        {
          prompt: "A per-item `catch` in a batch loop without a type guard will…",
          options: ["Work correctly", "Silently record a bug (a `TypeError` in the loop body) as a failed item for every record", "Abort the batch", "Retry"],
          answer: 1,
          explanation: "Recover from expected failures; let bugs escape to the batch boundary.",
        },
        {
          prompt: "Which value does `x ?? 10` **not** replace?",
          options: ["`null`", "`undefined`", "`0` — nullish coalescing only replaces `null` and `undefined`", "Both `null` and `undefined`"],
          answer: 2,
          explanation: "`x || 10` would replace `0`, `\"\"` and `false` too.",
        },
        {
          prompt: "`node:assert/strict` differs from legacy `assert` in that…",
          options: ["It is slower", "`equal`/`deepEqual` use `===` semantics instead of `==`", "It cannot throw", "It only works in tests"],
          answer: 1,
          explanation: "Prefer strict.",
        },
        {
          prompt: "The column number in a stack frame tells you…",
          options: ["Nothing useful", "Which expression on the line failed — `a.b.c` has two reads, and the column says which", "The indentation", "The error code"],
          answer: 1,
          explanation: "Read line **and** column.",
        },
        {
          prompt: "`console.error` versus `console.log` for errors:",
          options: ["Identical", "`console.error` writes to stderr so diagnostics can be separated from program output", "`console.error` throws", "`console.log` is for errors"],
          answer: 1,
          explanation: "And log the error object, not just `.message`.",
        },
      ],
    },
  ],
});

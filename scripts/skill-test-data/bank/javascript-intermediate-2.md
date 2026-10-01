---
skill: javascript
level: intermediate
---

## javascript-intermediate-026
topic: functions-closures
answer: B

Which statement about closures in JavaScript is correct?

- A: A closure copies the values of the outer variables at the moment the inner function is created.
- B: A closure refers to the outer variables themselves, so it sees later assignments to them.
- C: A closure can read outer variables, but assigning to one from inside it throws a `TypeError`.
- D: Only functions returned from another function form closures; callbacks never do.

> A function keeps a reference to the scope it was created in — the variable bindings, not snapshots of their values — so it sees later assignments, and the variables it uses stay alive as long as the function does. An inner function may assign to outer variables (that is how a counter works), and every function closes over its scope, whether it is returned, passed as a callback or neither.

## javascript-intermediate-027
topic: async
answer: D
run: javascript

What does this script print?

```javascript
Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => {
    x * 10;
  })
  .then((x) => console.log(x));
```

- A: `20`
- B: `2`
- C: It prints nothing.
- D: `undefined`

> Each `then` passes on whatever its callback returns. The second callback has a block body with no `return`, so it returns `undefined` and the computed `20` is thrown away — the chain does not stop, the next callback simply receives `undefined`. An arrow function returns its expression implicitly only when its body has no braces.

## javascript-intermediate-028
topic: async
answer: A
run: javascript

What does this script print?

```javascript
Promise.reject(new Error("boom"))
  .then(() => "a")
  .catch((e) => e.message)
  .then((v) => v + "!")
  .finally(() => "ignored")
  .then((v) => console.log(v));
```

- A: `boom!`
- B: `ignored`
- C: `a!`
- D: `boom`

> The rejection skips the first `then` and is handled by `catch`, whose return value fulfils the next promise with `"boom"`; from there the chain continues normally to `"boom!"`. A `finally` callback's return value is ignored — only a throw or a rejected promise from it would change the outcome — so `"boom!"` passes through.

## javascript-intermediate-029
topic: async
answer: C
run: javascript

What does this script print?

```javascript
async function fail() {
  throw new Error("x");
}
async function withoutAwait() {
  try {
    return fail();
  } catch {
    return "caught";
  }
}
async function withAwait() {
  try {
    return await fail();
  } catch {
    return "caught";
  }
}
withoutAwait()
  .catch(() => "escaped")
  .then((a) => withAwait().then((b) => console.log(a, b)));
```

- A: `caught caught`
- B: `caught escaped`
- C: `escaped caught`
- D: `escaped escaped`

> `fail()` does not throw synchronously; it returns a rejected promise. `return fail()` hands that promise out of the `try` block untouched, so the rejection escapes to the caller. `return await fail()` waits *inside* the `try`, so the rejection is thrown there and the `catch` block handles it.

## javascript-intermediate-030
topic: async
answer: B
run: javascript

What does this script print?

```javascript
const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
Promise.all([delay(30, "slow"), delay(10, "fast"), "plain"]).then((values) =>
  console.log(values.join(" "))
);
```

- A: `fast slow plain`
- B: `slow fast plain`
- C: `plain fast slow`
- D: `fast plain slow`

> `Promise.all` fulfils with the results in the order of its input, whatever order the promises settled in. A non-promise value such as `"plain"` is treated as an already-fulfilled promise and keeps its position.

## javascript-intermediate-031
topic: async
answer: D
run: javascript

What does this script print?

```javascript
const delay = (ms, value, ok = true) =>
  new Promise((resolve, reject) => setTimeout(() => (ok ? resolve : reject)(value), ms));
const race = Promise.race([delay(20, "a"), delay(10, "b", false)]).catch((e) => "rejected " + e);
const any = Promise.any([delay(20, "a"), delay(10, "b", false)]);
Promise.all([race, any]).then(([r, a]) => console.log(r + " | " + a));
```

- A: `a | a`
- B: `rejected b | rejected b`
- C: `a | rejected b`
- D: `rejected b | a`

> `Promise.race` settles the same way as the first input to settle, fulfilled or rejected — here `b` rejects at 10 ms. `Promise.any` skips rejections and fulfils with the first fulfilment (`a` at 20 ms); it rejects, with an `AggregateError`, only when every input rejects.

## javascript-intermediate-032
topic: async
answer: A
run: javascript

What does this script print?

```javascript
Promise.allSettled([Promise.resolve(1), Promise.reject("no"), 3]).then((results) =>
  console.log(
    results.map((r) => r.status + ":" + (r.status === "fulfilled" ? r.value : r.reason)).join(" ")
  )
);
```

- A: `fulfilled:1 rejected:no fulfilled:3`
- B: `fulfilled:1 fulfilled:3`
- C: `resolved:1 rejected:no resolved:3`
- D: `fulfilled:1 rejected:no fulfilled:undefined`

> `Promise.allSettled` never rejects: it waits for every input and describes each one as `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`, in input order. A plain value such as `3` counts as a fulfilled promise.

## javascript-intermediate-033
topic: async
answer: C
run: javascript

What does this script print?

```javascript
const log = [];
const task = (name, ms) =>
  new Promise((resolve) =>
    setTimeout(() => {
      log.push(name);
      resolve(name);
    }, ms)
  );
async function main() {
  const a = task("a", 30);
  const b = task("b", 10);
  await a;
  log.push("after-a");
  await b;
  log.push("after-b");
  console.log(log.join(" "));
}
main();
```

- A: `a after-a b after-b`
- B: `a b after-a after-b`
- C: `b a after-a after-b`
- D: `b after-b a after-a`

> Both timers start when `task` is called, before anything is awaited — `await` waits for a promise, it does not start the work. So `b` finishes at 10 ms and `a` at 30 ms. `main` resumes once `a` is done, and by then `b` is already fulfilled, so the second `await` continues straight away.

## javascript-intermediate-034
topic: async
answer: B
run: javascript

What does this script print?

```javascript
const log = [];
const save = (item) =>
  new Promise((resolve) =>
    setTimeout(() => {
      log.push(item);
      resolve();
    }, 10)
  );
async function saveAll(items) {
  items.forEach(async (item) => {
    await save(item);
  });
  log.push("done");
}
saveAll([1, 2]).then(() => setTimeout(() => console.log(log.join(" ")), 50));
```

- A: `1 2 done`
- B: `done 1 2`
- C: `done`
- D: `1 done 2`

> `forEach` ignores what its callback returns, so the promises returned by the async callbacks are never awaited: both saves start, `forEach` returns at once, and `"done"` is logged before either timer fires. To wait, use `for...of` with `await`, or `await Promise.all(items.map(save))`.

## javascript-intermediate-035
topic: async
answer: D
run: javascript

What does this script print?

```javascript
async function check(n) {
  if (n < 0) throw new Error("negative");
  return n;
}
let state = "before";
try {
  check(-1).catch((e) => console.log(state + " / " + e.message));
  state = "after";
} catch (e) {
  state = "threw";
}
```

- A: `threw / negative`
- B: `before / negative`
- C: It prints nothing.
- D: `after / negative`

> A `throw` inside an `async` function never escapes synchronously: it rejects the promise that the call returns. So the `try` block carries on and updates `state`, and the `catch` callback runs later as a microtask — after the synchronous code — and sees the updated value.

## javascript-intermediate-036
topic: async
answer: C

`await Promise.all([p1, p2, p3])` is in progress. `p2` rejects while `p1` and `p3` are still pending. What happens?

- A: It rejects at once with `p2`'s reason, and `p1` and `p3` are cancelled.
- B: It waits for `p1` and `p3` to settle, then rejects with an `AggregateError`.
- C: It rejects at once with `p2`'s reason; `p1` and `p3` keep running.
- D: It fulfils with the values of `p1` and `p3`, and `undefined` for `p2`.

> `Promise.all` rejects as soon as any input rejects, with that input's reason. Promises cannot be cancelled, so the other operations carry on; their eventual results are simply not observed by `Promise.all`. Waiting for everything is what `Promise.allSettled` does, and `AggregateError` belongs to `Promise.any`.

## javascript-intermediate-037
topic: event-loop
answer: A
run: javascript

What does this script print when run with Node.js as a CommonJS script (`node main.js`)?

```javascript
const out = [];
setTimeout(() => out.push("timeout"), 0);
Promise.resolve().then(() => out.push("promise"));
process.nextTick(() => out.push("tick"));
out.push("sync");
setTimeout(() => console.log(out.join(" ")), 10);
```

- A: `sync tick promise timeout`
- B: `sync promise tick timeout`
- C: `tick sync promise timeout`
- D: `sync timeout tick promise`

> Synchronous code always finishes first. Node then drains the `process.nextTick` queue before the promise microtask queue, and only when both are empty does the event loop move on to timers — even a 0 ms timer.

## javascript-intermediate-038
topic: event-loop
answer: B
run: javascript

What does this script print?

```javascript
const out = [];
async function f() {
  out.push("f start");
  await null;
  out.push("f end");
}
out.push("1");
f();
out.push("2");
Promise.resolve().then(() => out.push("3"));
setTimeout(() => console.log(out.join(", ")), 0);
```

- A: `1, f start, f end, 2, 3`
- B: `1, f start, 2, f end, 3`
- C: `1, f start, 2, 3, f end`
- D: `1, 2, f start, 3, f end`

> An async function runs synchronously up to its first `await`, so `"f start"` comes straight after `"1"`. The `await` then queues the rest of `f` as a microtask and returns to the caller. That microtask was queued before the `.then` callback, so `"f end"` comes before `"3"`.

## javascript-intermediate-039
topic: event-loop
answer: D
run: javascript

What does this script print?

```javascript
const out = [];
setTimeout(() => out.push("T1"), 0);
queueMicrotask(() => {
  out.push("M1");
  queueMicrotask(() => out.push("M3"));
});
Promise.resolve().then(() => out.push("M2"));
setTimeout(() => console.log(out.join(" ")), 0);
```

- A: `M1 M3 M2 T1`
- B: `T1 M1 M2 M3`
- C: `M1 M2 T1 M3`
- D: `M1 M2 M3 T1`

> `queueMicrotask` and promise callbacks share one first-in, first-out microtask queue. `M3` is queued while `M1` runs, so it lands behind the already-queued `M2`. The queue is drained completely — including microtasks added during the drain — before any timer callback runs.

## javascript-intermediate-040
topic: event-loop
answer: C
run: javascript

What does this script print with Node.js 16?

```javascript
const out = [];
setTimeout(() => {
  out.push("t1");
  Promise.resolve().then(() => out.push("p1"));
}, 0);
setTimeout(() => out.push("t2"), 0);
setTimeout(() => console.log(out.join(" ")), 5);
```

- A: `t1 t2 p1`
- B: `p1 t1 t2`
- C: `t1 p1 t2`
- D: `t2 t1 p1`

> The microtask queue is drained after every macrotask callback, not just after a whole batch of timers, so `p1` — queued while `t1` runs — runs before the next timer, `t2`. Browsers and Node.js 11+ agree on this; Node.js 10 and earlier ran all expired timers first and printed `t1 t2 p1`.

## javascript-intermediate-041
topic: event-loop
answer: A
run: javascript

What does this script print?

```javascript
const out = [];
async function worker(name) {
  for (let i = 1; i <= 2; i++) {
    out.push(name + i);
    await null;
  }
}
worker("a");
worker("b");
out.push("sync");
setTimeout(() => console.log(out.join(" ")), 0);
```

- A: `a1 b1 sync a2 b2`
- B: `a1 a2 b1 b2 sync`
- C: `a1 b1 a2 b2 sync`
- D: `sync a1 b1 a2 b2`

> Each call runs synchronously until its first `await`, which suspends it and returns control to the caller: `a1`, then `b1`, then `sync`. The two continuations were queued as microtasks in that order, so after the synchronous code the workers resume alternately: `a2`, then `b2`.

## javascript-intermediate-042
topic: event-loop
answer: D
run: javascript

What does this script print?

```javascript
const out = [];
const p = new Promise((resolve) => {
  out.push("executor");
  resolve("value");
  out.push("after resolve");
});
p.then((v) => out.push(v));
out.push("sync end");
setTimeout(() => console.log(out.join(" | ")), 0);
```

- A: `sync end | executor | after resolve | value`
- B: `executor | value | after resolve | sync end`
- C: `executor | after resolve | value | sync end`
- D: `executor | after resolve | sync end | value`

> The executor runs synchronously inside the `Promise` constructor, and calling `resolve` does not stop it — the rest of the executor still runs. Even though `p` is already fulfilled when `.then` is attached, the callback is always queued as a microtask, so it runs after the remaining synchronous code.

## javascript-intermediate-043
topic: event-loop
answer: B
run: javascript

What does this Node.js script print?

```javascript
const out = [];
(async () => {
  out.push("A");
  await new Promise((resolve) => setTimeout(resolve, 0));
  out.push("B");
})();
Promise.resolve().then(() => out.push("C"));
setTimeout(() => out.push("D"), 0);
out.push("E");
setTimeout(() => console.log(out.join("")), 5);
```

- A: `AEBCD`
- B: `AECBD`
- C: `ACEBD`
- D: `AECDB`

> `A` and `E` are synchronous, and `C` is a microtask, so it runs before any timer. The async function is waiting on the first timer; when that timer fires it fulfils the promise, and the continuation (`B`) runs as a microtask straight after that timer's callback — before the second timer (`D`) gets its turn.

## javascript-intermediate-044
topic: event-loop
answer: C

When does `timer` print?

```javascript
setTimeout(() => console.log("timer"), 0);
function spin() {
  Promise.resolve().then(spin);
}
spin();
```

- A: After roughly 0 ms, interleaved with the `spin` callbacks.
- B: First, because it was scheduled before the promise chain began.
- C: Never: the microtask queue never empties, so timers never run.
- D: Once the engine hits its microtask limit and yields to timers.

> The event loop takes the next macrotask, such as a timer, only when the microtask queue is empty — and microtasks queued during a drain run in that same drain. Every `spin` queues another, so the queue never empties: the timer never runs and the process spins forever. There is no built-in microtask limit.

## javascript-intermediate-045
topic: event-loop
answer: A

Which describes what this script does?

```javascript
setTimeout(() => console.log("fired"), 0);
const start = Date.now();
while (Date.now() - start < 200) {
  // busy work
}
console.log("loop done");
```

- A: `loop done` prints first, then `fired`, once the loop has ended.
- B: `fired` prints after about 0 ms, interrupting the loop, and then `loop done`.
- C: `fired` prints first, because a 0 ms timer runs before any other code.
- D: `fired` never prints, because its 0 ms deadline passed while the loop ran.

> JavaScript runs one task at a time, to completion: a timer callback can run only once the call stack is empty. A timer's delay is a minimum, not a guarantee, so the overdue callback runs right after the synchronous loop and `console.log("loop done")` have finished.

## javascript-intermediate-046
topic: types-coercion
answer: D
run: javascript

What does this script print?

```javascript
console.log(NaN === NaN, Object.is(NaN, NaN), 0 === -0, Object.is(0, -0));
```

- A: `false false true true`
- B: `true true true false`
- C: `false true false false`
- D: `false true true false`

> `===` treats `NaN` as unequal to everything, itself included, and treats `0` and `-0` as equal. `Object.is` (the SameValue algorithm) differs in exactly those two cases: `NaN` is the same as `NaN`, and `0` is not the same as `-0`.

## javascript-intermediate-047
topic: types-coercion
answer: B
run: javascript

What does this script print?

```javascript
console.log(null >= 0, null == 0, [] == false, undefined == null);
```

- A: `false false false true`
- B: `true false true true`
- C: `true true false true`
- D: `false false true false`

> Relational operators convert `null` to the number `0`, so `null >= 0` is true. `==` does not: `null` is loosely equal only to `undefined` (and to itself), so `null == 0` is false. `[] == false` converts both sides to numbers — `[]` becomes `""` and then `0`, and `false` becomes `0` — so it is true.

## javascript-intermediate-048
topic: types-coercion
answer: C
run: javascript

What does this script print?

```javascript
console.log([typeof null, typeof [], typeof NaN, typeof notDeclared].join(" "));
```

- A: `null array number undefined`
- B: `object array NaN undefined`
- C: `object object number undefined`
- D: It throws a `ReferenceError` for `notDeclared`.

> `typeof null` is `"object"` — a historical bug kept for compatibility. Arrays are objects (use `Array.isArray` to detect them), and `NaN` is a value of type number. `typeof` is the one operator that may be applied to an undeclared identifier without a `ReferenceError`: it returns `"undefined"`.

## javascript-intermediate-049
topic: types-coercion
answer: A
run: javascript

What does this script print?

```javascript
const z = -0;
console.log(z === 0, String(z), JSON.stringify(z), 1 / z, Object.is(z * 1, -0));
```

- A: `true 0 0 -Infinity true`
- B: `true -0 -0 -Infinity true`
- C: `false -0 0 -Infinity true`
- D: `true 0 0 Infinity false`

> `-0` compares equal to `0` with `===`, and both `String` and `JSON.stringify` print it as `0`, hiding the sign. The sign is still there: dividing by `-0` gives `-Infinity`, and multiplying it by `1` keeps it negative zero, which `Object.is` can tell apart.

## javascript-intermediate-050
topic: types-coercion
answer: D
run: javascript

What does this script print?

```javascript
const values = [1, NaN, -0];
console.log(values.indexOf(NaN), values.includes(NaN), values.indexOf(0), values.includes(0));
```

- A: `1 true 2 true`
- B: `-1 false 2 true`
- C: `1 true -1 false`
- D: `-1 true 2 true`

> `indexOf` compares with `===`, under which `NaN` never matches, so it returns `-1`. `includes` uses SameValueZero, which treats `NaN` as equal to `NaN`. Both treat `-0` and `0` as equal, so `0` is found at index 2.

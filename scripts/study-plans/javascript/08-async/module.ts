import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "async",
  title: "Asynchronous JavaScript",
  blurb: "The event loop and its two queues; error-first callbacks; promises and the chaining rules; async/await semantics, sequential versus concurrent, return await; the combinators, concurrency pools, timeouts and AbortController; timers, debounce and throttle.",
  icon: "clock",
  overview: `JavaScript never waits. One thread runs your code to completion, and everything that takes time — a timer, a file, a request — hands its result back later through the event loop. Every asynchronous abstraction the language has grown since then is a way of *writing down* what happens later: a callback, a promise, an \`await\`. Understanding the loop is what makes the ordering predictable; understanding promises is what makes composition possible; \`async\`/\`await\` is what makes it readable.

The module builds up in that order. The event-loop lesson gives the two-queue model that answers every "why did this print first" question and the error-first callback convention Node was built on. The promise lesson pins down the state machine and the chaining rules — return the inner promise, end in a catch, never construct a promise around a promise. \`async\`/\`await\` follows with the rules people learn by getting wrong: awaits in a loop are sequential, \`forEach(async)\` waits for nothing, \`return await\` matters inside \`try\`, state changes across an \`await\`. The combinators lesson covers \`all\`/\`allSettled\`/\`race\`/\`any\`, a concurrency pool, timeouts, cancellation with \`AbortController\`, retry with backoff and \`for await\`. Timers close it: minimum delays, recursive \`setTimeout\` over \`setInterval\`, the "soon" family, \`timers/promises\`, debounce and throttle.

Every exercise runs on the real event loop with real timers: predict the print order, write \`series\`/\`parallel\` with callbacks, build a promise chain and a \`promisify\`, prove that \`forEach(async)\` does not wait, drive the four combinators, write a pool and a timeout, debounce and throttle, and finish with a dependency-aware job scheduler, a fetch pipeline with retry and timeout, and an async queue.`,
  lessons: [
    {
      slug: "callbacks-and-the-event-loop",
      file: "01-callbacks-and-the-event-loop.md",
      exercises: [
        {
          title: "Predict the print order",
          prompt: `Each input line schedules a print of its label: \`sync <label>\` prints immediately, \`timeout <label> <ms>\` uses \`setTimeout\`, \`micro <label>\` uses \`Promise.resolve().then\`, \`tick <label>\` uses \`process.nextTick\`. Schedule them all in input order; the output is the order in which the labels actually print, one per line.

Example: \`sync A\`, \`timeout B 0\`, \`micro C\`, \`tick D\`, \`timeout E 10\`, \`sync F\` →
\`\`\`
A
F
D
C
B
E
\`\`\`
Synchronous code first, then the nextTick queue, then promise microtasks, then timers in order of expiry.`,
          starterFile: "code/event-loop-order.starter.js",
          solutionFile: "code/event-loop-order.solution.js",
          hints: ["The program is just the four scheduling calls; the event loop does the ordering.", "process.nextTick runs before Promise microtasks; both run before any timer."],
          cases: [
            { stdin: "sync A\ntimeout B 0\nmicro C\ntick D\ntimeout E 10\nsync F\n", expected: "A\nF\nD\nC\nB\nE\n" },
            { stdin: "timeout X 20\ntimeout Y 0\nmicro Z\n", expected: "Z\nY\nX\n", hidden: true },
          ],
        },
        {
          title: "series and parallel, callback style",
          prompt: `The starter's \`loadUser(name, cb)\` is an error-first callback API (it fails for the name \`bad\`, and its delay depends on the name's length). Write \`series(names, cb)\` — load one after another, stop at the first error calling \`cb(err, resultsSoFar)\`, else \`cb(null, results)\` — and \`parallel(names, cb)\` — start all at once, place results **by index** so input order is preserved, call \`cb\` exactly once (with the first error, or with all results). Line 1 is the series input, line 2 the parallel input. Print \`series: <results joined by ,>\` or \`series error: <message> after <n> loaded\`, then \`parallel: <results>\` or \`parallel error: <message>\`.

Example: \`ann bob cy\` / \`dave eve\` →
\`\`\`
series: ANN,BOB,CY
parallel: DAVE,EVE
\`\`\`
\`ann bad cy\` / \`bob bad\` → \`series error: no user bad after 1 loaded\` and \`parallel error: no user bad\`.`,
          starterFile: "code/callback-series.starter.js",
          solutionFile: "code/callback-series.solution.js",
          hints: ["series: a recursive next() that loads names[i++] and recurses from the callback.", "parallel: a pending counter and a finished flag so cb runs exactly once, even if a second load also fails."],
          cases: [
            { stdin: "ann bob cy\ndave eve\n", expected: "series: ANN,BOB,CY\nparallel: DAVE,EVE\n" },
            { stdin: "ann bad cy\nbob bad\n", expected: "series error: no user bad after 1 loaded\nparallel error: no user bad\n" },
            { stdin: "ann\nzed yy x\n", expected: "series: ANN\nparallel: ZED,YY,X\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Order of output: `setTimeout(() => log(1), 0); Promise.resolve().then(() => log(2)); process.nextTick(() => log(3)); log(4);`",
          options: ["1 2 3 4", "4 3 2 1", "4 2 3 1", "4 1 3 2"],
          answer: 1,
          explanation: "Sync → nextTick → promise microtasks → timers.",
        },
        {
          prompt: "A microtask that always queues another microtask…",
          options: ["Runs once per timer tick", "Starves the event loop — no timer or I/O callback ever runs, because all microtasks drain before the next task", "Is throttled by Node", "Is a syntax error"],
          answer: 1,
          explanation: "To really yield, use `setImmediate` or `setTimeout(fn, 0)`.",
        },
        {
          prompt: "`setTimeout(fn, 100)` guarantees…",
          options: ["`fn` runs at exactly 100 ms", "`fn` runs no sooner than 100 ms, once the stack is free — later under load", "`fn` runs before any pending promise", "Nothing"],
          answer: 1,
          explanation: "Timers are minimums; same-delay timers fire in creation order.",
        },
        {
          prompt: "In the error-first callback convention, after handling `err` you should…",
          options: ["Continue with the success path", "`return` — otherwise the success code runs with an undefined result", "Throw it", "Call the callback again"],
          answer: 1,
          explanation: "`if (err) return cb(err);` is the idiom; call the callback exactly once.",
        },
        {
          prompt: "An error thrown inside a `setTimeout` callback…",
          options: ["Is caught by a `try` around the `setTimeout` call", "Cannot be caught by the scheduling code — its stack is gone; it becomes an uncaught exception", "Is ignored", "Rejects a promise"],
          answer: 1,
          explanation: "Callbacks must pass errors to their callback, not throw; promises fix this.",
        },
      ],
    },
    {
      slug: "promises",
      file: "02-promises.md",
      exercises: [
        {
          title: "A chain with one catch",
          prompt: `Given \`parse\` (throws \`TypeError("not a number: <text>")\`), \`validate\` (returns a rejected promise \`RangeError("negative: <n>")\` for negatives, else the number), \`double\` (asynchronous, returns a promise) and \`format\`, process each input token through the chain \`parse → validate → double → format\` using \`then\`, print \`<token> -> <result>\`, recover in a single \`catch\` printing \`<token> -> <name>: <message>\`, and count settled chains in \`finally\`. Process the tokens **one after another** (a \`reduce\` over a promise chain) so the lines print in input order; end with \`settled=<n>\`.

Example: \`3 -2 x 7\` →
\`\`\`
3 -> 6.0
-2 -> RangeError: negative: -2
x -> TypeError: not a number: x
7 -> 14.0
settled=4
\`\`\``,
          starterFile: "code/promise-chain.starter.js",
          solutionFile: "code/promise-chain.solution.js",
          hints: ["Start each token with Promise.resolve(token).then(parse) so a throw in parse becomes a rejection the catch sees.", "tokens.reduce((chain, t) => chain.then(() => processOne(t)), Promise.resolve()) sequences the work."],
          cases: [
            { stdin: "3 -2 x 7", expected: "3 -> 6.0\n-2 -> RangeError: negative: -2\nx -> TypeError: not a number: x\n7 -> 14.0\nsettled=4\n" },
            { stdin: "0 abc", expected: "0 -> 0.0\nabc -> TypeError: not a number: abc\nsettled=2\n", hidden: true },
          ],
        },
        {
          title: "promisify by hand",
          prompt: `Write \`promisify(fn)\` that turns an error-first callback function into one returning a promise. Use it on the starter's \`readFile(name, cb)\` (fails with \`code: "ENOENT"\` for names starting with \`missing\`). Read the input names one after another, printing \`<name>: <contents>\` or \`<name>: <error.code>\`. Then print \`identity=<Promise.resolve(p) === p for a promise p>\` and resolve a thenable \`{ then(resolve) { resolve("adopted"); } }\` through \`Promise.resolve\`, printing \`thenable=<value>\`.

Example: \`a.txt missing.txt b.txt\` →
\`\`\`
a.txt: <contents of a.txt>
missing.txt: ENOENT
b.txt: <contents of b.txt>
identity=true
thenable=adopted
\`\`\``,
          starterFile: "code/promisify-by-hand.starter.js",
          solutionFile: "code/promisify-by-hand.solution.js",
          hints: ["(...args) => new Promise((resolve, reject) => fn(...args, (err, v) => err ? reject(err) : resolve(v))).", "Promise.resolve returns a real promise unchanged and adopts anything with a then method."],
          cases: [
            { stdin: "a.txt missing.txt b.txt", expected: "a.txt: <contents of a.txt>\nmissing.txt: ENOENT\nb.txt: <contents of b.txt>\nidentity=true\nthenable=adopted\n" },
            { stdin: "missing1 missing2", expected: "missing1: ENOENT\nmissing2: ENOENT\nidentity=true\nthenable=adopted\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Inside a `then` handler you call an async function but do not `return` its promise. The consequence is…",
          options: ["Nothing", "The chain continues immediately with `undefined`, and the inner promise's rejection is unhandled", "The chain waits anyway", "A syntax error"],
          answer: 1,
          explanation: "Always return the inner promise so the chain adopts it.",
        },
        {
          prompt: "`Promise.resolve(42).then(log); log(\"sync\")` prints…",
          options: ["42 then sync", "sync then 42 — `then` callbacks always run asynchronously as microtasks, even for a settled promise", "Only 42", "Only sync"],
          answer: 1,
          explanation: "That guarantee is what makes ordering predictable.",
        },
        {
          prompt: "`p.then(ok, fail)` versus `p.then(ok).catch(fail)`:",
          options: ["Identical", "Only the second catches an error thrown inside `ok`", "Only the first catches rejections of `p`", "The second is slower"],
          answer: 1,
          explanation: "Prefer `then(ok).catch(fail)`.",
        },
        {
          prompt: "A rejected promise with no handler attached, in Node 16…",
          options: ["Is silently ignored", "Triggers an unhandled rejection that terminates the process by default", "Retries", "Is logged once"],
          answer: 1,
          explanation: "Every chain must end in `catch` or be returned to code that handles it.",
        },
        {
          prompt: "Wrapping `fetchUser()` (which already returns a promise) in `new Promise((res, rej) => fetchUser().then(res, rej))` is…",
          options: ["Required", "The explicit-construction antipattern — just use `fetchUser()`; `new Promise` is for callback/event APIs", "Faster", "Safer"],
          answer: 1,
          explanation: "`util.promisify` or `async` functions cover the other cases.",
        },
      ],
    },
    {
      slug: "async-await",
      file: "03-async-await.md",
      exercises: [
        {
          title: "Sequential versus concurrent, observed",
          prompt: `Each line is a task \`name ms\`. Run them **sequentially** (\`await\` in a \`for…of\`, recording the completion order) and then **concurrently** (\`Promise.all\` over async callbacks that each record their completion). Print \`sequential: <order>\`, \`parallel: <order>\`, and \`sequentialTime=<sum of ms> parallelTime=<max ms>\` (computed from the numbers, not measured).

Example: \`a 30\`, \`b 10\`, \`c 20\` →
\`\`\`
sequential: a b c
parallel: b c a
sequentialTime=60 parallelTime=30
\`\`\`
Sequential completes in input order; concurrent completes in duration order.`,
          starterFile: "code/sequential-vs-parallel.starter.js",
          solutionFile: "code/sequential-vs-parallel.solution.js",
          hints: ["for (const t of tasks) { await sleep(t.ms); order.push(t.name); } — one at a time.", "await Promise.all(tasks.map(async (t) => { await sleep(t.ms); order.push(t.name); })) — all at once."],
          cases: [
            { stdin: "a 30\nb 10\nc 20\n", expected: "sequential: a b c\nparallel: b c a\nsequentialTime=60 parallelTime=30\n" },
            { stdin: "x 15\ny 5\n", expected: "sequential: x y\nparallel: y x\nsequentialTime=20 parallelTime=15\n", hidden: true },
          ],
        },
        {
          title: "return await, and the forEach that waits for nothing",
          prompt: `The starter's \`work(id)\` rejects for ids ending in \`x\`. \`withoutAwait(id)\` does \`try { return work(id); } catch { … }\`; write \`withAwait(id)\` identically but with \`return await work(id)\`. For each id call both inside an outer \`try\`/\`catch\` and print \`<id>: withoutAwait -> <result> | withAwait -> <result>\`, where a rejection caught inside prints \`caught inside: <message>\` and one caught by the outer block prints \`caught outside: <message>\`. Then run \`ids.forEach(async (id) => { await work(id).catch(() => {}); finished++; })\` and immediately print \`afterForEach=<finished>\`; then \`await Promise.all(ids.map(...))\` the same way and print \`afterPromiseAll=<finished>\`.

Example: \`a bx c\` →
\`\`\`
a: withoutAwait -> a done | withAwait -> a done
bx: withoutAwait -> caught outside: bx failed | withAwait -> caught inside: bx failed
c: withoutAwait -> c done | withAwait -> c done
afterForEach=0
afterPromiseAll=3
\`\`\``,
          starterFile: "code/return-await.starter.js",
          solutionFile: "code/return-await.solution.js",
          hints: ["Returning a promise leaves the try block before it rejects; return await keeps the rejection inside.", "forEach ignores the promises its callback returns — the counter is still 0 on the next line."],
          cases: [
            { stdin: "a bx c", expected: "a: withoutAwait -> a done | withAwait -> a done\nbx: withoutAwait -> caught outside: bx failed | withAwait -> caught inside: bx failed\nc: withoutAwait -> c done | withAwait -> c done\nafterForEach=0\nafterPromiseAll=3\n" },
            { stdin: "zx", expected: "zx: withoutAwait -> caught outside: zx failed | withAwait -> caught inside: zx failed\nafterForEach=0\nafterPromiseAll=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const a = await f(); const b = await g();` for independent `f` and `g`…",
          options: ["Runs them concurrently", "Runs them one after another — start both first (`const pa = f(), pb = g()`) or use `Promise.all` to overlap", "Is a syntax error", "Runs `g` first"],
          answer: 1,
          explanation: "Sequential awaits are the most common async performance bug.",
        },
        {
          prompt: "`items.forEach(async (x) => { await save(x); })` followed by `console.log(\"done\")`…",
          options: ["Logs after every save", "Logs immediately — `forEach` ignores the returned promises; errors are lost too", "Throws", "Saves sequentially"],
          answer: 1,
          explanation: "Use `for…of` with `await`, or `await Promise.all(items.map(...))`.",
        },
        {
          prompt: "Inside `try { return doWork(); } catch (e) { … }` in an async function, a rejection from `doWork()`…",
          options: ["Is caught by the `catch`", "Skips the `catch` — the function already returned the promise; write `return await doWork()`", "Is swallowed", "Crashes"],
          answer: 1,
          explanation: "Outside `try`/`finally`, a bare `return promise` is fine.",
        },
        {
          prompt: "`const data = fetchData(); data.items` (no `await`) fails because…",
          options: ["`fetchData` is slow", "`data` is a promise, so `.items` is `undefined`", "`items` is private", "It does not fail"],
          answer: 1,
          explanation: "A floating promise as a statement is the other form of the missing `await`.",
        },
        {
          prompt: "`if (!cache.has(k)) { cache.set(k, await load(k)); }` called twice at once loads twice because…",
          options: ["Maps are slow", "Both callers pass the check before either `await` resumes — state changes across an `await`; cache the promise instead", "`await` is synchronous", "`has` is async"],
          answer: 1,
          explanation: "Check-then-act across an `await` is the async race condition.",
        },
      ],
    },
    {
      slug: "combinators-and-concurrency",
      file: "04-combinators-and-concurrency.md",
      exercises: [
        {
          title: "The four combinators on one set of tasks",
          prompt: `Each line is \`name ms ok|fail\`; \`start(spec)\` (in the starter) returns a promise that fulfils with the name or rejects with \`Error("<name> failed")\` after \`ms\`. Run fresh promises through each combinator and print: \`all: <names joined by ,>\` or \`all: rejected <message>\`; \`allSettled: <name:status ...>\`; \`race: <name> fulfilled\` or \`race: <name> rejected\`; \`any: <name>\` or \`any: AggregateError with <n> errors\`.

Example: \`a 30 ok\`, \`b 10 ok\`, \`c 20 fail\` →
\`\`\`
all: rejected c failed
allSettled: a:fulfilled b:fulfilled c:rejected
race: b fulfilled
any: b
\`\`\``,
          starterFile: "code/combinators.starter.js",
          solutionFile: "code/combinators.solution.js",
          hints: ["Call specs.map(start) again for each combinator — a settled promise cannot be re-run.", "Promise.any rejects with an AggregateError whose .errors array holds every rejection."],
          cases: [
            { stdin: "a 30 ok\nb 10 ok\nc 20 fail\n", expected: "all: rejected c failed\nallSettled: a:fulfilled b:fulfilled c:rejected\nrace: b fulfilled\nany: b\n" },
            { stdin: "a 20 ok\nb 10 ok\n", expected: "all: a,b\nallSettled: a:fulfilled b:fulfilled\nrace: b fulfilled\nany: b\n", hidden: true },
            { stdin: "a 10 fail\nb 20 fail\n", expected: "all: rejected a failed\nallSettled: a:rejected b:rejected\nrace: a rejected\nany: AggregateError with 2 errors\n", hidden: true },
          ],
        },
        {
          title: "A concurrency pool and a timeout",
          prompt: `Write \`mapLimit(items, limit, worker)\` — at most \`limit\` workers run at once, results stored by index — and \`withTimeout(promise, ms)\` — a \`race\` against a timer that rejects with \`Error("timed out after <ms> ms")\`, clearing the timer in \`finally\`. Line 1 is the limit; following lines are tasks \`name ms\`, plus one \`timeout <taskMs> <limitMs>\` line. Run the tasks through the pool (each worker sleeps \`ms\`, tracks the running count, records completion order and returns the upper-cased name) and print \`results=<in input order> completed=<completion order> maxConcurrent=<n>\`; then run \`withTimeout(sleep(taskMs, "finished"), limitMs)\` and print \`timeout: finished\` or \`timeout: <message>\`.

Example: \`2\`, \`a 40\`, \`b 10\`, \`c 15\`, \`d 5\`, \`timeout 50 10\` →
\`\`\`
results=A,B,C,D completed=b,c,d,a maxConcurrent=2
timeout: timed out after 10 ms
\`\`\`
\`b\` finishes at 10 and frees a slot for \`c\` (done at 25), then \`d\` (30); \`a\` runs until 40.`,
          starterFile: "code/pool-and-timeout.starter.js",
          solutionFile: "code/pool-and-timeout.solution.js",
          hints: ["Runners share a next index: const i = next++ — no await between reading and incrementing, so no two runners take the same item.", "Promise.race([promise, timeout]).finally(() => clearTimeout(timer))."],
          cases: [
            { stdin: "2\na 40\nb 10\nc 15\nd 5\ntimeout 50 10\n", expected: "results=A,B,C,D completed=b,c,d,a maxConcurrent=2\ntimeout: timed out after 10 ms\n" },
            { stdin: "3\na 30\nb 20\nc 10\ntimeout 5 50\n", expected: "results=A,B,C completed=c,b,a maxConcurrent=3\ntimeout: finished\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Promise.all([a, b, c])` when `b` rejects…",
          options: ["Waits for `a` and `c` then rejects", "Rejects immediately with `b`'s reason; `a` and `c` keep running but their results are dropped", "Fulfils with the two successes", "Cancels `a` and `c`"],
          answer: 1,
          explanation: "`allSettled` when every outcome matters.",
        },
        {
          prompt: "`Promise.race` versus `Promise.any`:",
          options: ["Identical", "`race` settles with the first to settle (fulfil **or** reject); `any` fulfils with the first to fulfil and rejects only if all reject", "`any` is faster", "`race` ignores rejections"],
          answer: 1,
          explanation: "`race` against a timer is how timeouts are built.",
        },
        {
          prompt: "Why bound concurrency instead of `Promise.all(urls.map(fetch))` for 5,000 URLs?",
          options: ["`Promise.all` has a size limit", "All 5,000 requests start at once — memory, sockets and the remote server suffer; a pool runs `n` at a time", "`map` is synchronous", "Fetch cannot be mapped"],
          answer: 1,
          explanation: "A pool of `n` runners pulling from a shared index preserves order by index.",
        },
        {
          prompt: "Cancelling a promise-based operation is done by…",
          options: ["`promise.cancel()`", "Passing an `AbortSignal` the operation honours; on abort it rejects with an `AbortError`", "Rejecting the promise from outside", "Garbage collection"],
          answer: 1,
          explanation: "Promises cannot be cancelled; `fetch`, `timers/promises` and `fs` accept `signal`.",
        },
        {
          prompt: "A timeout built with `race` should also…",
          options: ["Retry", "Clear its timer in `finally` (and abort the underlying work if it supports a signal) — otherwise the timer keeps running", "Log", "Use `setInterval`"],
          answer: 1,
          explanation: "`race` does not stop the loser.",
        },
      ],
    },
    {
      slug: "timers-and-scheduling",
      file: "05-timers-and-scheduling.md",
      exercises: [
        {
          title: "Debounce and throttle, side by side",
          prompt: `Write \`debounce(fn, wait)\` (run \`fn\` once, \`wait\` ms after the **last** call, with the last arguments) and a leading-edge \`throttle(fn, wait)\` (run immediately, then at most once per \`wait\` ms, using \`Date.now()\`). Line 1 is \`wait\`; each following line \`t label\` schedules a call to **both** wrappers at \`t\` ms. The wrapped functions print \`debounce:<label>\` / \`throttle:<label>\`; after the last call plus \`2 × wait\` print \`calls=<n> debounceFired=<n> throttleFired=<n>\`.

Example: \`40\`, then calls \`0 A\`, \`10 B\`, \`20 C\`, \`100 D\`, \`110 E\` →
\`\`\`
throttle:A
debounce:C
throttle:D
debounce:E
calls=5 debounceFired=2 throttleFired=2
\`\`\`
Throttle fires at the start of each burst; debounce fires once each burst is over.`,
          starterFile: "code/debounce-throttle.starter.js",
          solutionFile: "code/debounce-throttle.solution.js",
          hints: ["debounce: clearTimeout(timer) then a new setTimeout on every call.", "throttle: remember the last run time; run when now - last >= wait."],
          cases: [
            { stdin: "40\n0 A\n10 B\n20 C\n100 D\n110 E\n", expected: "throttle:A\ndebounce:C\nthrottle:D\ndebounce:E\ncalls=5 debounceFired=2 throttleFired=2\n" },
            { stdin: "30\n0 only\n", expected: "throttle:only\ndebounce:only\ncalls=1 debounceFired=1 throttleFired=1\n", hidden: true },
          ],
        },
        {
          title: "Intervals, promise timers and an aborted sleep",
          prompt: `Write \`ticks(n, everyMs)\` returning a promise: a \`setInterval\` every \`everyMs\` prints \`tick <i>\` and, after \`n\` ticks, clears itself and resolves with the count. Then, using \`require("timers/promises")\`: \`await timers.setTimeout(5, "value")\` and print \`promise timer resolved with <value>\`; create an \`AbortController\`, abort it after 5 ms, and \`await timers.setTimeout(1000, undefined, { signal })\` inside \`try\`/\`catch\`, printing \`long sleep aborted: <err.name> aborted=<signal.aborted>\`; finally create an interval, call \`.unref()\` on it and print \`unref: process may exit\` — the program must end on its own.

Example: \`3\` →
\`\`\`
tick 1
tick 2
tick 3
interval done after 3 ticks
promise timer resolved with value
long sleep aborted: AbortError aborted=true
unref: process may exit
\`\`\``,
          starterFile: "code/interval-ticker.starter.js",
          solutionFile: "code/interval-ticker.solution.js",
          hints: ["Wrap setInterval in new Promise and resolve from inside the callback after clearInterval.", "An unref()'d timer does not keep the event loop alive, so the process exits although the interval is pending."],
          cases: [
            { stdin: "3\n", expected: "tick 1\ntick 2\ntick 3\ninterval done after 3 ticks\npromise timer resolved with value\nlong sleep aborted: AbortError aborted=true\nunref: process may exit\n" },
            { stdin: "1\n", expected: "tick 1\ninterval done after 1 ticks\npromise timer resolved with value\nlong sleep aborted: AbortError aborted=true\nunref: process may exit\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Debounce versus throttle:",
          options: ["Synonyms", "Debounce runs once after the calls stop; throttle runs at most once per interval while the calls continue", "Throttle waits for quiet", "Debounce is for scroll, throttle for typing"],
          answer: 1,
          explanation: "Search-as-you-type debounces; scroll handlers throttle.",
        },
        {
          prompt: "`setInterval(job, 1000)` where `job` is an async I/O task risks…",
          options: ["Nothing", "Overlapping runs and drift — the next run is scheduled regardless of whether the last one finished; use a recursive `setTimeout`/`await` loop", "Running too rarely", "A syntax error"],
          answer: 1,
          explanation: "`setInterval` suits cheap, fixed-cadence work like a clock display.",
        },
        {
          prompt: "A Node script prints its result but does not exit. The most likely cause is…",
          options: ["A syntax error", "A pending timer or interval keeping the event loop alive — clear it or `unref()` it", "Too much output", "Missing `return`"],
          answer: 1,
          explanation: "Active handles keep the loop running.",
        },
        {
          prompt: "`process.nextTick` versus `setImmediate`:",
          options: ["Same thing", "nextTick runs before any I/O, timer or promise microtask; setImmediate runs in the check phase after I/O — the true \"yield to the loop\"", "setImmediate is first", "nextTick is a timer"],
          answer: 1,
          explanation: "Recursive nextTick starves the loop; recursive setImmediate does not.",
        },
        {
          prompt: "To measure a duration use…",
          options: ["`Date.now()` — it is precise", "`performance.now()` — monotonic and high-resolution; `Date.now()` is wall-clock and can jump", "`new Date()`", "`setTimeout`"],
          answer: 1,
          explanation: "`console.time`/`timeEnd` is the quick form.",
        },
      ],
    },
    {
      slug: "async-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A dependency-aware job scheduler",
          prompt: `Each line is a job \`name ms deps\` where \`deps\` is a comma list of job names or \`-\`. Write a memoised \`promiseFor(name)\`: it waits for every dependency's promise, then \`await sleep(ms)\`, records the completion order, and resolves with \`{ finish }\` — a **virtual** finish time equal to the latest dependency finish plus \`ms\`. Start every job, wait for all, and print \`order: <completion order>\`, \`finish: <name=finish ...>\` (input order) and \`makespan=<max finish>\`.

Example: \`a 20 -\`, \`b 40 -\`, \`c 10 a\`, \`d 10 a,b\` →
\`\`\`
order: a c b d
finish: a=20 b=40 c=30 d=50
makespan=50
\`\`\`
\`c\` starts as soon as \`a\` is done; \`d\` must wait for \`b\` too.`,
          starterFile: "code/job-scheduler.starter.js",
          solutionFile: "code/job-scheduler.solution.js",
          hints: ["Memoise in a Map so a job shared by two dependants runs once and both wait on the same promise.", "const finished = await Promise.all(job.deps.map(promiseFor)); startAt = max of their finish values."],
          cases: [
            { stdin: "a 20 -\nb 40 -\nc 10 a\nd 10 a,b\n", expected: "order: a c b d\nfinish: a=20 b=40 c=30 d=50\nmakespan=50\n" },
            { stdin: "x 10 -\ny 10 x\nz 10 y\n", expected: "order: x y z\nfinish: x=10 y=20 z=30\nmakespan=30\n", hidden: true },
          ],
        },
        {
          title: "A fetch pipeline with retry, backoff and timeout",
          prompt: `The starter's \`fakeFetch(spec)\` takes \`ms\` and fails with a \`TransientError\` for its first \`failures\` calls. Write \`withTimeout(promise, ms)\` (race + timer, cleared in \`finally\`, \`Error("timed out after <ms> ms")\`) and \`retry(fn, { attempts, isTransient })\` that retries transient failures with a backoff of \`2^(i-1)\` ms and otherwise throws \`Error("gave up after <i> attempts", { cause })\`. Line 1 is \`attempts timeoutMs\`; each following line is \`url ms failures\`. Run every url through \`retry(() => withTimeout(fakeFetch(spec), timeoutMs))\` with \`Promise.allSettled\` and print, in input order, \`<url>: ok after <n> attempt(s)\` or \`<url>: failed - <message> <- <cause name>: <cause message>\`, then \`summary: ok=<n> failed=<n>\`.

Example: \`3 50\`, \`u1 5 0\`, \`u2 5 2\`, \`u3 5 5\`, \`u4 100 0\` →
\`\`\`
u1: ok after 1 attempt(s)
u2: ok after 3 attempt(s)
u3: failed - gave up after 3 attempts <- TransientError: u3 attempt 3 failed
u4: failed - gave up after 1 attempts <- Error: timed out after 50 ms
summary: ok=2 failed=2
\`\`\``,
          starterFile: "code/fetch-pipeline.starter.js",
          solutionFile: "code/fetch-pipeline.solution.js",
          hints: ["A timeout error is not transient, so retry gives up on it after the first attempt.", "The starter's attemptsSeen Map already counts calls per url — read it for the report."],
          cases: [
            { stdin: "3 50\nu1 5 0\nu2 5 2\nu3 5 5\nu4 100 0\n", expected: "u1: ok after 1 attempt(s)\nu2: ok after 3 attempt(s)\nu3: failed - gave up after 3 attempts <- TransientError: u3 attempt 3 failed\nu4: failed - gave up after 1 attempts <- Error: timed out after 50 ms\nsummary: ok=2 failed=2\n" },
            { stdin: "2 50\nu1 5 1\n", expected: "u1: ok after 2 attempt(s)\nsummary: ok=1 failed=0\n", hidden: true },
          ],
        },
        {
          title: "An async queue with waiting consumers",
          prompt: `Implement \`AsyncQueue\` with a private items array and a private list of waiting resolvers: \`put(value)\` hands the value straight to the oldest waiting consumer if there is one, otherwise stores it; \`take()\` returns a promise — resolved immediately when an item is available, otherwise pending until a \`put\`; \`get size\` and \`get waiting\`. Commands: \`take <consumer>\` (the consumer prints \`<consumer> got <value>\` when its promise resolves), \`put <value>\`, \`status\` (prints \`size=<items> waiting=<consumers>\`). After every command \`await null\` so the pending \`then\` callbacks print before the next command runs.

Example: \`take c1\`, \`take c2\`, \`status\`, \`put apple\`, \`put pear\`, \`status\`, \`put fig\`, \`status\`, \`take c3\`, \`status\` →
\`\`\`
size=0 waiting=2
c1 got apple
c2 got pear
size=0 waiting=0
size=1 waiting=0
c3 got fig
size=0 waiting=0
\`\`\``,
          starterFile: "code/async-queue.starter.js",
          solutionFile: "code/async-queue.solution.js",
          hints: ["take(): if items exist return Promise.resolve(items.shift()); else return new Promise((resolve) => waiting.push(resolve)).", "put(): waiting.length ? waiting.shift()(value) : items.push(value)."],
          cases: [
            { stdin: "take c1\ntake c2\nstatus\nput apple\nput pear\nstatus\nput fig\nstatus\ntake c3\nstatus\n", expected: "size=0 waiting=2\nc1 got apple\nc2 got pear\nsize=0 waiting=0\nsize=1 waiting=0\nc3 got fig\nsize=0 waiting=0\n" },
            { stdin: "put a\nput b\ntake x\nstatus\n", expected: "x got a\nsize=1 waiting=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many threads run your JavaScript in Node?",
          options: ["One per request", "One — asynchronous means non-blocking, not parallel; `worker_threads` add real threads with separate heaps", "As many as CPU cores", "Two"],
          answer: 1,
          explanation: "That is why a long synchronous loop delays every pending callback.",
        },
        {
          prompt: "Node's `setImmediate` versus `setTimeout(fn, 0)` inside an I/O callback:",
          options: ["Same order always", "`setImmediate` runs first — the check phase follows the poll phase before the next timers phase", "`setTimeout` runs first", "Unspecified"],
          answer: 1,
          explanation: "From the main module (no I/O callback) their order is unspecified.",
        },
        {
          prompt: "`await 5`…",
          options: ["Is a syntax error", "Wraps the value in a resolved promise and yields one microtask before resuming with 5", "Waits 5 ms", "Returns a promise"],
          answer: 1,
          explanation: "Every `await` yields to the loop, even on non-promises.",
        },
        {
          prompt: "An `async` function that throws before its first `await`…",
          options: ["Throws synchronously to the caller", "Returns a rejected promise — `async` functions never throw synchronously", "Crashes", "Returns `undefined`"],
          answer: 1,
          explanation: "The caller sees a rejection to `await` or `catch`.",
        },
        {
          prompt: "Resolving a promise with another promise…",
          options: ["Nests them", "Adopts the inner promise's eventual state — chains flatten, which is why `then` can return promises", "Throws", "Fulfils with the promise object"],
          answer: 1,
          explanation: "Any thenable is adopted the same way.",
        },
        {
          prompt: "`Promise.allSettled([])` and `Promise.race([])`:",
          options: ["Both fulfil with `[]`", "`allSettled` fulfils with `[]` immediately; `race` stays pending forever", "Both reject", "Both pend"],
          answer: 1,
          explanation: "An empty `any` rejects with an `AggregateError`.",
        },
        {
          prompt: "A retry loop should add jitter because…",
          options: ["Timers are inaccurate", "Many clients retrying in lockstep after the same failure hit the server together; randomness spreads them out", "Backoff is illegal", "It is faster"],
          answer: 1,
          explanation: "Exponential backoff with jitter is the standard.",
        },
        {
          prompt: "`for await (const x of asyncGen())` processes items…",
          options: ["All at once", "One at a time, in order — awaiting each `next()`; `break` calls `return()` on the generator", "In reverse", "Concurrently up to a limit"],
          answer: 1,
          explanation: "Use a pool when concurrency is wanted.",
        },
        {
          prompt: "Callers of a function that `throw`s inside a `setTimeout` callback can catch it…",
          options: ["With `try` around the call", "Not at all — wrap the timer in a promise so the failure becomes a rejection they can handle", "With `finally`", "With `process.on(\"exit\")`"],
          answer: 1,
          explanation: "Promises turn asynchronous throws into values.",
        },
        {
          prompt: "`timer.unref()` in Node…",
          options: ["Cancels the timer", "Lets the process exit even though the timer is pending", "Speeds it up", "Makes it repeat"],
          answer: 1,
          explanation: "Right for heartbeats and periodic sweeps that should not hold the process open.",
        },
        {
          prompt: "A debounced handler attached to a component that unmounts should…",
          options: ["Keep running", "Be cancelled on teardown (`cancel()`), or it fires after the component is gone", "Be throttled instead", "Use `setInterval`"],
          answer: 1,
          explanation: "A classic source of \"setState on unmounted component\" warnings.",
        },
        {
          prompt: "Node's `util.promisify(fn)` expects `fn` to…",
          options: ["Return a promise", "Take an error-first callback as its last argument", "Be synchronous", "Be a class"],
          answer: 1,
          explanation: "It resolves with the callback's value and rejects with its error.",
        },
      ],
    },
  ],
});

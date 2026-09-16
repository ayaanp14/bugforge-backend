import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "functional-patterns",
  title: "Functional patterns",
  blurb: "Pure functions and immutability with structural sharing; pipe, compose, currying and data-last design; reduce as the universal fold, recursion limits and trampolines; memoization, once and laziness; Maybe, Result and railway-oriented pipelines.",
  icon: "lambda",
  overview: `Functional programming in JavaScript is a set of habits rather than a framework: functions that compute only from their inputs, data that is replaced rather than changed, and programs assembled from small functions that compose. The payoff is code you can test with a table, cache without fear, and reason about locally — and JavaScript's first-class functions, closures and array methods make every one of these habits a few lines to adopt.

The module starts with the two disciplines — purity and immutability — and where their boundary lies (a pure core, an impure shell). Composition follows: \`pipe\`/\`compose\`, currying and partial application, and the data-last convention that decides whether helpers compose. The fold lesson shows every list operation as \`reduce\`, the O(n²) trap of spreading the accumulator, and the honest state of recursion in V8 — no tail calls, so loops or trampolines. Memoization and laziness cover the two optimisations purity makes legal, with their failure modes. The last lesson makes absence and failure into values — \`Maybe\` and \`Result\` — and shows the railway pattern that turns a chain of fallible steps into a straight line.

The exercises deep-freeze state, implement undo/redo on immutable snapshots, write \`curry\` and data-last pipelines, rebuild the array toolbox with \`reduce\`, trampoline a million-step recursion, memoize Fibonacci and measure the calls, build lazy values and a \`LazyList\`, chain \`Maybe\`s and \`Result\`s — then a tiny immutable store with a memoized selector, a pipeline DSL compiled to functions, and a Result-based configuration loader.`,
  lessons: [
    {
      slug: "pure-functions-and-immutability",
      file: "01-pure-functions-and-immutability.md",
      exercises: [
        {
          title: "Deep freeze, then try to break it",
          prompt: `Write \`deepFreeze(value)\` that recursively freezes every nested object and array (children first) and returns the value. Parse the JSON on line 1, deep-freeze it, then run commands in strict mode: \`set <path> <json>\` assigns through the dotted path, \`push <path> <json>\` pushes onto an array, \`frozen <path>\` prints \`Object.isFrozen\` of that value. Each command prints \`<command>: changed\`, \`<command>: <error constructor name>\`, or \`<command>: <bool>\`; finish with \`state=<JSON>\` to prove nothing moved.

Example: \`{"a":{"b":1,"list":[1,2]},"c":"x"}\` then \`set c "y"\`, \`set a.b 5\`, \`push a.list 3\`, \`frozen a.list\` →
\`\`\`
set c "y": TypeError
set a.b 5: TypeError
push a.list 3: TypeError
frozen a.list: true
state={"a":{"b":1,"list":[1,2]},"c":"x"}
\`\`\`
A shallow \`Object.freeze\` would have let \`set a.b\` and \`push a.list\` through.`,
          starterFile: "code/deep-freeze.starter.js",
          solutionFile: "code/deep-freeze.solution.js",
          hints: ["Object.values(value) covers both objects and arrays; recurse, then Object.freeze(value).", "Array#push on a frozen array throws a TypeError in strict mode just like a property write."],
          cases: [
            { stdin: "{\"a\":{\"b\":1,\"list\":[1,2]},\"c\":\"x\"}\nset c \"y\"\nset a.b 5\npush a.list 3\nfrozen a\nfrozen a.list\nfrozen c\n", expected: "set c \"y\": TypeError\nset a.b 5: TypeError\npush a.list 3: TypeError\nfrozen a: true\nfrozen a.list: true\nfrozen c: true\nstate={\"a\":{\"b\":1,\"list\":[1,2]},\"c\":\"x\"}\n" },
            { stdin: "{\"n\":1}\nset n 2\nfrozen n\n", expected: "set n 2: TypeError\nfrozen n: true\nstate={\"n\":1}\n", hidden: true },
          ],
        },
        {
          title: "Undo and redo on immutable snapshots",
          prompt: `Keep a \`history\` array of states and a \`cursor\`. \`set <path> <json>\` builds the next state with an immutable \`setIn\` (spreading each object on the path), discards any redo future (\`history.splice(cursor + 1)\`), pushes it and prints \`set <path>: shared=<top-level keys whose values are the same reference as in the previous state, or ->\`; \`undo\`/\`redo\` move the cursor within bounds and print \`undo -> <cursor>\`/\`redo -> <cursor>\`; \`show\` prints \`state=<JSON> history=<length>\`.

Example: \`{"user":{"name":"ada","age":36},"tags":["x"]}\` then \`set user.age 37\`, \`set user.name "Ada"\`, \`show\`, \`undo\`, \`show\`, \`undo\`, \`undo\`, \`show\`, \`redo\`, \`show\`, \`set tags []\`, \`redo\`, \`show\` →
\`\`\`
set user.age: shared=tags
set user.name: shared=tags
state={"user":{"name":"Ada","age":37},"tags":["x"]} history=3
undo -> 1
state={"user":{"name":"ada","age":37},"tags":["x"]} history=3
undo -> 0
undo -> 0
state={"user":{"name":"ada","age":36},"tags":["x"]} history=3
redo -> 1
state={"user":{"name":"ada","age":37},"tags":["x"]} history=3
set tags: shared=user
redo -> 2
state={"user":{"name":"ada","age":37},"tags":[]} history=3
\`\`\`
Because old states are never mutated, undo is just moving a pointer.`,
          starterFile: "code/undo-redo.starter.js",
          solutionFile: "code/undo-redo.solution.js",
          hints: ["setIn returns { ...obj, [head]: setIn(obj[head] ?? {}, tail, value) } — untouched siblings keep their references.", "Compare Object.keys(prev).filter((k) => prev[k] === next[k]) to see structural sharing."],
          cases: [
            { stdin: "{\"user\":{\"name\":\"ada\",\"age\":36},\"tags\":[\"x\"]}\nset user.age 37\nset user.name \"Ada\"\nshow\nundo\nshow\nundo\nundo\nshow\nredo\nshow\nset tags []\nredo\nshow\n", expected: "set user.age: shared=tags\nset user.name: shared=tags\nstate={\"user\":{\"name\":\"Ada\",\"age\":37},\"tags\":[\"x\"]} history=3\nundo -> 1\nstate={\"user\":{\"name\":\"ada\",\"age\":37},\"tags\":[\"x\"]} history=3\nundo -> 0\nundo -> 0\nstate={\"user\":{\"name\":\"ada\",\"age\":36},\"tags\":[\"x\"]} history=3\nredo -> 1\nstate={\"user\":{\"name\":\"ada\",\"age\":37},\"tags\":[\"x\"]} history=3\nset tags: shared=user\nredo -> 2\nstate={\"user\":{\"name\":\"ada\",\"age\":37},\"tags\":[]} history=3\n" },
            { stdin: "{\"x\":1}\nundo\nredo\nshow\n", expected: "undo -> 0\nredo -> 0\nstate={\"x\":1} history=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A function is pure when…",
          options: ["It has no parameters", "Its result depends only on its arguments and it has no observable side effects — no mutation, I/O, time or randomness", "It returns an object", "It is an arrow function"],
          answer: 1,
          explanation: "Pure functions are testable as tables and safe to cache and reorder.",
        },
        {
          prompt: "After `next = { ...prev, address: { ...prev.address, city } }`, `prev.tags === next.tags` is…",
          options: ["`false` — everything was copied", "`true` — only the changed path is new; untouched values are shared (structural sharing), which makes `===` a change detector", "An error", "`undefined`"],
          answer: 1,
          explanation: "That is the mechanism behind React/Redux change detection and cheap undo.",
        },
        {
          prompt: "Where should effects (I/O, time, randomness) live?",
          options: ["Everywhere", "In a thin outer shell that passes results into a pure core and applies its outputs", "In constructors", "Nowhere — programs must be pure"],
          answer: 1,
          explanation: "A function that needs \"now\" takes it as a parameter.",
        },
        {
          prompt: "`Object.freeze(config)` followed by `config.hosts.push(\"x\")`…",
          options: ["Throws", "Succeeds — freeze is shallow; deep-freeze recursively to lock nested values", "Freezes the array", "Is ignored"],
          answer: 1,
          explanation: "In strict mode a write to a frozen object's own property throws; nested objects are separate.",
        },
        {
          prompt: "Mutating a local accumulator inside a function that returns a new value is…",
          options: ["Impure", "Fine — nothing outside can observe it; immutability matters at the function's boundary", "Slow", "A memory leak"],
          answer: 1,
          explanation: "Copy-per-step \"to stay immutable\" inside a loop is the O(n²) mistake.",
        },
      ],
    },
    {
      slug: "composition-currying-and-point-free",
      file: "02-composition-currying-and-point-free.md",
      exercises: [
        {
          title: "curry, partial, pipe and compose",
          prompt: `Implement an auto-currying \`curry(fn)\` (calls \`fn\` once \`fn.length\` arguments have arrived, accepting any grouping). With the numbers on line 1 print \`curry=<add3(a)(b)(c)>,<add3(a, b)(c)>,<add3(a)(b, c)>,<add3(a, b, c)>\`; then \`pipe(inc,double)(a)=<> compose(inc,double)(a)=<>\`; then \`partial=<partial(greet, "Hello", "!")("Ada")> | <partial(greet, "Hi")("?", "Bob")>\` for \`greet(greeting, punctuation, name)\` → \`<greeting>, <name><punctuation>\`; then \`slug=<slugify(line)>\` for each remaining line via a \`pipe\` of trim+lower-case, non-alphanumerics → \`-\`, strip edge dashes; finally \`arityTrap: length=<((x, y = 0) => x + y).length> curried(5)=<what curry gives for that function called with 5>\`.

Example: \`1 2 3\` / \`  Hello, World! \` →
\`\`\`
curry=6,6,6,6
pipe(inc,double)(1)=4 compose(inc,double)(1)=3
partial=Hello, Ada! | Hi, Bob?
slug=hello-world
arityTrap: length=1 curried(5)=5
\`\`\`
A default parameter does not count toward \`length\`, so the curried function fires after one argument.`,
          starterFile: "code/compose-curry.starter.js",
          solutionFile: "code/compose-curry.solution.js",
          hints: ["return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more).", "pipe applies left to right, compose right to left — (1 + 1) * 2 versus (1 * 2) + 1."],
          cases: [
            { stdin: "1 2 3\n  Hello, World! \nAlready-slug\n", expected: "curry=6,6,6,6\npipe(inc,double)(1)=4 compose(inc,double)(1)=3\npartial=Hello, Ada! | Hi, Bob?\nslug=hello-world\nslug=already-slug\narityTrap: length=1 curried(5)=5\n" },
            { stdin: "10 20 30\n", expected: "curry=60,60,60,60\npipe(inc,double)(10)=22 compose(inc,double)(10)=21\npartial=Hello, Ada! | Hi, Bob?\narityTrap: length=1 curried(5)=5\n", hidden: true },
          ],
        },
        {
          title: "A data-last pipeline over records",
          prompt: `Write curried, data-last helpers \`map(f, xs)\`, \`filter(p, xs)\`, \`sortBy(key, xs)\` (a sorted copy), \`take(k, xs)\`, \`prop(k)\` and \`countBy(f, xs)\` (a \`Map\`). Line 1 is \`n\`; the rest are \`name age city\`. Build \`youngestAdults = pipe(filter(age ≥ 18), sortBy("age"), map(prop("name")), take(n))\` and print \`youngestAdults=<JSON>\`; then \`byCity=<city=count sorted by city>\` via \`countBy(prop("city"))\`; then \`over30=<names with age > 30 via a pipeline built by a function namesOver(age)> reusedOnSubset=<youngestAdults applied to the first two records>\`.

Example: \`2\` then \`ada 36 london\`, \`bob 17 paris\`, \`cy 22 london\`, \`dee 41 rome\`, \`eve 19 paris\` →
\`\`\`
youngestAdults=["eve","cy"]
byCity=london=2 paris=2 rome=1
over30=["ada","dee"] reusedOnSubset=["ada"]
\`\`\`
The same composed function ran on two different arrays — that is what data-last buys.`,
          starterFile: "code/data-last-pipeline.starter.js",
          solutionFile: "code/data-last-pipeline.solution.js",
          hints: ["Configuration first, data last: map(f)(xs) — partially applying f yields the unary step a pipe needs.", "sortBy must copy ([...xs].sort) so the pipeline never mutates its input."],
          cases: [
            { stdin: "2\nada 36 london\nbob 17 paris\ncy 22 london\ndee 41 rome\neve 19 paris\n", expected: "youngestAdults=[\"eve\",\"cy\"]\nbyCity=london=2 paris=2 rome=1\nover30=[\"ada\",\"dee\"] reusedOnSubset=[\"ada\"]\n" },
            { stdin: "5\nzed 30 oslo\n", expected: "youngestAdults=[\"zed\"]\nbyCity=oslo=1\nover30=[] reusedOnSubset=[\"zed\"]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`pipe(f, g)(x)` equals…",
          options: ["`f(g(x))`", "`g(f(x))` — left to right; `compose(f, g)(x)` is `f(g(x))`", "`f(x) + g(x)`", "`[f(x), g(x)]`"],
          answer: 1,
          explanation: "Both are folds over the function list with the value as accumulator.",
        },
        {
          prompt: "Auto-currying by `fn.length` fails for…",
          options: ["Arrow functions", "Functions with default or rest parameters (they do not count) and variadic functions — state the arity explicitly", "Methods", "Async functions"],
          answer: 1,
          explanation: "`((x, y = 0) => …).length` is 1.",
        },
        {
          prompt: "Data-last means…",
          options: ["Returning the data", "Putting configuration parameters first and the collection last, so partial application yields a unary function that composes", "Sorting descending", "Passing arrays only"],
          answer: 1,
          explanation: "Lodash is data-first (chains well); Ramda and `lodash/fp` are data-last (compose well).",
        },
        {
          prompt: "Currying versus partial application:",
          options: ["Synonyms", "Currying turns `f(a, b, c)` into `f(a)(b)(c)`; partial application fixes some arguments in one call and returns a function for the rest", "Partial application is for arrays", "Currying needs classes"],
          answer: 1,
          explanation: "`partial(greet, \"Hello\")` versus `curry(greet)(\"Hello\")` — same idea, different mechanics.",
        },
        {
          prompt: "Point-free style becomes a problem when…",
          options: ["Functions have names", "The combinator expression is harder to read than an arrow with a named parameter — or a function takes more arguments than expected (`map(parseInt)`)", "Used with `pipe`", "Never"],
          answer: 1,
          explanation: "The test of a style is whether the next developer finds it obvious.",
        },
      ],
    },
    {
      slug: "folds-recursion-and-trampolines",
      file: "03-folds-recursion-and-trampolines.md",
      exercises: [
        {
          title: "The array toolbox, rebuilt with reduce",
          prompt: `Using **only** \`reduce\` inside each (no \`map\`/\`filter\` calls), implement \`map(f, xs)\`, \`filter(p, xs)\`, \`flatMap(f, xs)\`, \`groupBy(key, xs)\`, \`partition(p, xs)\`, \`zip(xs, ys)\`, \`unique(xs)\` (via a \`Set\` accumulator) and \`countBy(key, xs)\` (a \`Map\`). Over the input numbers print, one per line: \`map=<squares>\`, \`filter=<evens>\`, \`flatMap=<[x, -x] for positives>\`, \`groupBy=<odd/even>\`, \`partition=<[≥5, <5]>\`, \`zip=<with ["a","b","c"]>\`, \`unique=<>\`, \`countBy=<entries of x % 3 sorted by key>\`, \`sum=<> max=<>\`.

Example: \`3 8 0 12 5 8 -1\` →
\`\`\`
map=[9,64,0,144,25,64,1]
filter=[8,0,12,8]
flatMap=[3,-3,8,-8,12,-12,5,-5,8,-8]
groupBy={"odd":[3,5,-1],"even":[8,0,12,8]}
partition=[[8,12,5,8],[3,0,-1]]
zip=[[3,"a"],[8,"b"],[0,"c"]]
unique=[3,8,0,12,5,-1]
countBy=[[-1,1],[0,3],[2,3]]
sum=35 max=12
\`\`\``,
          starterFile: "code/reduce-toolkit.starter.js",
          solutionFile: "code/reduce-toolkit.solution.js",
          hints: ["Mutate the accumulator you created — (acc.push(x), acc) — never spread it per step.", "-1 % 3 is -1 in JavaScript: the remainder takes the dividend's sign."],
          cases: [
            { stdin: "3 8 0 12 5 8 -1", expected: "map=[9,64,0,144,25,64,1]\nfilter=[8,0,12,8]\nflatMap=[3,-3,8,-8,12,-12,5,-5,8,-8]\ngroupBy={\"odd\":[3,5,-1],\"even\":[8,0,12,8]}\npartition=[[8,12,5,8],[3,0,-1]]\nzip=[[3,\"a\"],[8,\"b\"],[0,\"c\"]]\nunique=[3,8,0,12,5,-1]\ncountBy=[[-1,1],[0,3],[2,3]]\nsum=35 max=12\n" },
            { stdin: "7", expected: "map=[49]\nfilter=[]\nflatMap=[7,-7]\ngroupBy={\"odd\":[7]}\npartition=[[7],[]]\nzip=[[7,\"a\"]]\nunique=[7]\ncountBy=[[1,1]]\nsum=7 max=7\n", hidden: true },
          ],
        },
        {
          title: "A trampoline for deep recursion",
          prompt: `Write \`trampoline(f)\`: returns a function that calls \`f\` and, while the result is a function, keeps calling it. Using it, write a tail-recursive \`sumTo(n)\` whose recursive step returns a thunk instead of recursing, a plain-loop \`sumLoop(n)\`, and mutually recursive \`isEven\`/\`isOdd\` via thunks. Print \`sumTo=<> sumLoop=<> equal=<>\`; \`isEven(n)=<> isEven(n+1)=<>\`; \`bounces for <n>: <thunks executed by a counting version> result=<its return for 0>\`; and \`plainRecursion(2000)=<the naive recursive sum for 2000> (small depths are fine without a trampoline)\`.

Example: \`100000\` →
\`\`\`
sumTo=5000050000 sumLoop=5000050000 equal=true
isEven(100000)=true isEven(100001)=false
bounces for 100000: 100001 result=done
plainRecursion(2000)=2001000 (small depths are fine without a trampoline)
\`\`\`
Plain recursion to 100000 would overflow the stack; the trampolined version uses constant stack.`,
          starterFile: "code/trampoline.starter.js",
          solutionFile: "code/trampoline.solution.js",
          hints: ["Return () => go(n - 1, acc + n) — describe the next call, do not make it.", "while (typeof result === \"function\") result = result(); is the whole driver."],
          cases: [
            { stdin: "100000\n", expected: "sumTo=5000050000 sumLoop=5000050000 equal=true\nisEven(100000)=true isEven(100001)=false\nbounces for 100000: 100001 result=done\nplainRecursion(2000)=2001000 (small depths are fine without a trampoline)\n" },
            { stdin: "10\n", expected: "sumTo=55 sumLoop=55 equal=true\nisEven(10)=true isEven(11)=false\nbounces for 10: 11 result=done\nplainRecursion(2000)=2001000 (small depths are fine without a trampoline)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`xs.reduce((acc, x) => [...acc, f(x)], [])` is…",
          options: ["The idiomatic `map`", "O(n²) — the accumulator is copied on every step; push into the local accumulator instead", "Faster than `map`", "Lazy"],
          answer: 1,
          explanation: "Ten thousand items become fifty million element copies.",
        },
        {
          prompt: "Does V8 perform tail-call optimisation?",
          options: ["Yes, since ES2015", "No — it was specified but never shipped; deep tail recursion overflows the stack, so use a loop or a trampoline", "Only in strict mode", "Only for arrow functions"],
          answer: 1,
          explanation: "Safari is the one major engine that implemented it.",
        },
        {
          prompt: "A trampoline works by…",
          options: ["Increasing the stack size", "Having the recursive function return a thunk for the next step while a driver loop calls thunks until a value comes back — constant stack depth", "Caching results", "Running in a worker"],
          answer: 1,
          explanation: "It handles tail calls only; tree recursion needs an explicit stack.",
        },
        {
          prompt: "`reduce` without an initial value on `[]`…",
          options: ["Returns `undefined`", "Throws a `TypeError` — always pass the seed", "Returns `0`", "Returns `[]`"],
          answer: 1,
          explanation: "The seed also makes the accumulator's type explicit.",
        },
        {
          prompt: "You need to stop iterating as soon as a condition holds. Use…",
          options: ["`reduce` with a flag", "`for…of` with `break`, or `some`/`find` — `reduce` cannot exit early", "`forEach`", "`map`"],
          answer: 1,
          explanation: "Choose the construct by readability: folds for one-idea folds, loops for early exit and several accumulators.",
        },
      ],
    },
    {
      slug: "memoization-and-laziness",
      file: "04-memoization-and-laziness.md",
      exercises: [
        {
          title: "memoize, and Fibonacci as dynamic programming",
          prompt: `Write \`memoize(fn, key = (...args) => JSON.stringify(args))\` with a \`Map\` cache and \`hits\`/\`misses\` counters on the returned function. Count calls of a naive recursive \`fibNaive(n)\` and of a memoized \`fib\` (keyed by \`n\`, recursing through the memoized name) and print \`fib(n)=<> naiveCalls=<> memoCalls=<> hits=<> misses=<>\`; call \`fib(n)\` again and print \`secondCall: memoCalls=<> hits=<>\`; then a memoized two-argument function called with \`(1,2)\`, \`(1,2)\`, \`(2,1)\` → \`jsonKey: hits=1 misses=2 keys=["[1,2]","[2,1]"]\`; finally cache \`area(rect)\` by object identity in a \`WeakMap\` for two objects with equal contents → \`identity: 6,6,6 areaCalls=2 (equal contents, two objects)\`.

Example: \`20\` →
\`\`\`
fib(20)=6765 naiveCalls=21891 memoCalls=21 hits=18 misses=21
secondCall: memoCalls=21 hits=19
jsonKey: hits=1 misses=2 keys=["[1,2]","[2,1]"]
identity: 6,6,6 areaCalls=2 (equal contents, two objects)
\`\`\``,
          starterFile: "code/memoize.starter.js",
          solutionFile: "code/memoize.solution.js",
          hints: ["const fib = memoize((k) => ... fib(k - 1) + fib(k - 2), (k) => k) — the inner calls must hit the cache.", "Attach hits/misses as properties on the wrapper function so callers can read them."],
          cases: [
            { stdin: "20\n", expected: "fib(20)=6765 naiveCalls=21891 memoCalls=21 hits=18 misses=21\nsecondCall: memoCalls=21 hits=19\njsonKey: hits=1 misses=2 keys=[\"[1,2]\",\"[2,1]\"]\nidentity: 6,6,6 areaCalls=2 (equal contents, two objects)\n" },
            { stdin: "5\n", expected: "fib(5)=5 naiveCalls=15 memoCalls=6 hits=3 misses=6\nsecondCall: memoCalls=6 hits=4\njsonKey: hits=1 misses=2 keys=[\"[1,2]\",\"[2,1]\"]\nidentity: 6,6,6 areaCalls=2 (equal contents, two objects)\n", hidden: true },
          ],
        },
        {
          title: "once, thunks and a LazyList",
          prompt: `The input is a number of reads. Print \`builds: eager=<> defaultParam=<> thunk=<>\` counting how many times \`buildLogger\` ran when a logger **was** supplied for three fallback styles: \`opts.logger ?? buildLogger()\`, a default parameter \`fallback = buildLogger()\`, and a thunk default \`fallback = buildLogger\` called only on the fallback path. Then \`once\`: wrap a config builder, call it \`reads\` times, print \`once: reads=<> builds=1 sameObject=true\`. Then a lazy getter that computes once and replaces itself → \`lazyGetter: reads=<> computed=1 total=42\`. Finally a \`LazyList\` over the naturals with \`filter\`/\`map\`/\`take\`/\`toArray\` built on generators, counting how many naturals were produced: print \`beforeForce=0\` and \`first <reads>: <squares of the first reads odd numbers> evaluated=<count>\`.

Example: \`4\` →
\`\`\`
builds: eager=0 defaultParam=1 thunk=0
once: reads=4 builds=1 sameObject=true
lazyGetter: reads=4 computed=1 total=42
beforeForce=0
first 4: [1,9,25,49] evaluated=7
\`\`\`
Only seven naturals were generated for four results, and nothing ran until \`toArray\`.`,
          starterFile: "code/lazy-values.starter.js",
          solutionFile: "code/lazy-values.solution.js",
          hints: ["A default parameter expression runs whenever the argument is omitted — even if the value is never used; pass the function itself and call it lazily.", "Each LazyList method wraps the previous generator in a new generator function; only toArray iterates."],
          cases: [
            { stdin: "4\n", expected: "builds: eager=0 defaultParam=1 thunk=0\nonce: reads=4 builds=1 sameObject=true\nlazyGetter: reads=4 computed=1 total=42\nbeforeForce=0\nfirst 4: [1,9,25,49] evaluated=7\n" },
            { stdin: "1\n", expected: "builds: eager=0 defaultParam=1 thunk=0\nonce: reads=1 builds=1 sameObject=true\nlazyGetter: reads=1 computed=1 total=42\nbeforeForce=0\nfirst 1: [1] evaluated=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Memoizing a function that takes object arguments should key by…",
          options: ["`String(obj)`", "Object identity in a `WeakMap` (or a stable id field) — not `JSON.stringify`, which is slow and collides on key order", "`obj.length`", "The call count"],
          answer: 1,
          explanation: "`String(obj)` is `[object Object]` for everything.",
        },
        {
          prompt: "A memoized function called with a million distinct inputs in a long-running server…",
          options: ["Is fine", "Holds a million cache entries forever — bound the cache (LRU/TTL) or do not memoize", "Speeds up", "Evicts automatically"],
          answer: 1,
          explanation: "Memoize functions with repeated inputs and a bounded domain.",
        },
        {
          prompt: "In `const fib = memoize((n) => n < 2 ? n : inner(n - 1) + inner(n - 2))` where `inner` is the raw function…",
          options: ["Everything is cached", "The recursive calls bypass the cache — recurse through the memoized `fib`", "It throws", "It is faster"],
          answer: 1,
          explanation: "Memoized recursion is dynamic programming only if the subcalls hit the table.",
        },
        {
          prompt: "A thunk is…",
          options: ["A cached value", "A zero-argument function standing for a computation not yet performed — the unit of laziness", "A promise", "A generator"],
          answer: 1,
          explanation: "`once` + a thunk gives a lazy value: computed on first use, cached after.",
        },
        {
          prompt: "`[...lazySequence]` on a lazy pipeline over an infinite source…",
          options: ["Takes the first few", "Forces the whole sequence and never terminates — force explicitly with `take(n)` first", "Throws", "Returns `[]`"],
          answer: 1,
          explanation: "`Array.from`, `Promise.all` and `JSON.stringify` force too.",
        },
      ],
    },
    {
      slug: "maybe-result-and-railways",
      file: "05-maybe-result-and-railways.md",
      exercises: [
        {
          title: "Chaining Maybes",
          prompt: `Using the starter's \`Some\`/\`None\`/\`fromNullable\`, for each id on the input lines: find the user (\`fromNullable\`), \`flatMap\` to its \`address\`, \`map\` the city to upper case, \`filter\` cities longer than 3 characters, and print \`<id>: maybe=<String(maybe)> value=<getOrElse("unknown")> optionalChaining=<the same lookup with ?. and ??> name=<user's name via Maybe or nobody>\`. Finally print \`nested: map -> Some containing <Some(2).map((x) => Some(x)).getOrElse()> | flatMap -> <Some(2).flatMap((x) => Some(x))>\`.

Example: users \`[{"id":1,"name":"Ada","address":{"city":"London"}},{"id":2,"name":"Bob"},{"id":3,"name":"Cy","address":{"city":"Rio"}}]\` then \`1\`, \`2\`, \`3\`, \`9\` →
\`\`\`
1: maybe=Some("LONDON") value=LONDON optionalChaining=LONDON name=Ada
2: maybe=None value=unknown optionalChaining=unknown name=Bob
3: maybe=None value=unknown optionalChaining=RIO name=Cy
9: maybe=None value=unknown optionalChaining=unknown name=nobody
nested: map -> Some containing Some(2) | flatMap -> Some(2)
\`\`\`
\`filter\` is what the Maybe chain can do that optional chaining cannot — Rio is too short.`,
          starterFile: "code/maybe-chain.starter.js",
          solutionFile: "code/maybe-chain.solution.js",
          hints: ["flatMap when the step returns a Maybe (fromNullable(u.address)); map when it returns a plain value.", "map with a Maybe-returning function nests: Some(Some(2)); flatMap flattens."],
          cases: [
            { stdin: "[{\"id\":1,\"name\":\"Ada\",\"address\":{\"city\":\"London\"}},{\"id\":2,\"name\":\"Bob\"},{\"id\":3,\"name\":\"Cy\",\"address\":{\"city\":\"Rio\"}}]\n1\n2\n3\n9\n", expected: "1: maybe=Some(\"LONDON\") value=LONDON optionalChaining=LONDON name=Ada\n2: maybe=None value=unknown optionalChaining=unknown name=Bob\n3: maybe=None value=unknown optionalChaining=RIO name=Cy\n9: maybe=None value=unknown optionalChaining=unknown name=nobody\nnested: map -> Some containing Some(2) | flatMap -> Some(2)\n" },
            { stdin: "[]\n1\n", expected: "1: maybe=None value=unknown optionalChaining=unknown name=nobody\nnested: map -> Some containing Some(2) | flatMap -> Some(2)\n", hidden: true },
          ],
        },
        {
          title: "A Result railway",
          prompt: `With the starter's \`Ok\`/\`Err\`/\`attempt\`, build \`loadUser(text) = parseJson → requireObject → requireName → requireAge → normalise\`: \`parseJson\` wraps \`JSON.parse\` with \`attempt\` and maps the error to \`"not valid JSON"\`; \`requireObject\` rejects non-objects with \`"expected an object"\`; \`requireName\` needs a non-blank string (\`"name is required"\`); \`requireAge\` needs an integer 0–150 (\`age must be an integer 0-150, got <JSON>\`); \`normalise\` returns \`{ name: trimmed lower-case, age, adult: age >= 18 }\`. Print \`<i>: ok <JSON>\` or \`<i>: err <message>\` per line, then a \`sequence\` over all results: \`all ok: <n> users\` or \`<n> failed: <messages joined by " | ">\`, then \`recovered=<first result's name or anonymous> mapErrDemo=<Err("x").mapErr(upper).error>\`.

Example: \`{"name":" Ada ","age":36}\`, \`{"name":"Bob","age":-1}\`, \`not json\`, \`[1,2]\`, \`{"age":5}\` →
\`\`\`
0: ok {"name":"ada","age":36,"adult":true}
1: err age must be an integer 0-150, got -1
2: err not valid JSON
3: err expected an object
4: err name is required
4 failed: age must be an integer 0-150, got -1 | not valid JSON | expected an object | name is required
recovered=ada mapErrDemo=X
\`\`\``,
          starterFile: "code/result-railway.starter.js",
          solutionFile: "code/result-railway.solution.js",
          hints: ["flatMap for steps that return a Result, map for normalise which cannot fail.", "sequence: collect the errors of failed results; if none, Ok(values)."],
          cases: [
            { stdin: "{\"name\":\" Ada \",\"age\":36}\n{\"name\":\"Bob\",\"age\":-1}\nnot json\n[1,2]\n{\"age\":5}\n", expected: "0: ok {\"name\":\"ada\",\"age\":36,\"adult\":true}\n1: err age must be an integer 0-150, got -1\n2: err not valid JSON\n3: err expected an object\n4: err name is required\n4 failed: age must be an integer 0-150, got -1 | not valid JSON | expected an object | name is required\nrecovered=ada mapErrDemo=X\n" },
            { stdin: "{\"name\":\"Zed\",\"age\":7}\n", expected: "0: ok {\"name\":\"zed\",\"age\":7,\"adult\":false}\nall ok: 1 users\nrecovered=zed mapErrDemo=X\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`map` versus `flatMap` on a `Maybe`:",
          options: ["Identical", "`map` applies a plain function inside; `flatMap` applies a function that itself returns a `Maybe`, avoiding `Some(Some(x))`", "`flatMap` is for arrays only", "`map` can fail"],
          answer: 1,
          explanation: "Same distinction as arrays and promises.",
        },
        {
          prompt: "In a Result railway, after the first `Err`…",
          options: ["Later steps still run", "Every following `flatMap`/`map` is skipped and the `Err` reaches the end unchanged", "It throws", "It becomes `None`"],
          answer: 1,
          explanation: "No step needs `if (!ok) return`.",
        },
        {
          prompt: "For `user?.address?.city ?? \"unknown\"`, a `Maybe` chain is…",
          options: ["Required", "Overkill — optional chaining already handles property paths; `Maybe` earns its place when chaining functions that may return nothing, or filtering", "Faster", "Standard"],
          answer: 1,
          explanation: "Use the built-in idiom for property access.",
        },
        {
          prompt: "Converting exception-based code into Results is done…",
          options: ["Everywhere", "At the boundary with an `attempt(fn)` wrapper — inside one layer, use one style", "Never", "By catching in every function"],
          answer: 1,
          explanation: "Mixing both inside a layer defeats the point.",
        },
        {
          prompt: "A promise is like a `Result` because…",
          options: ["It is synchronous", "`then` maps/chains, a rejection rides the failure track past every `then` to the `catch`", "It has a `value` field", "It cannot fail"],
          answer: 1,
          explanation: "Arrays are the \"zero or more\" container with the same `map`/`flatMap` shape.",
        },
      ],
    },
    {
      slug: "functional-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A tiny immutable store with a memoized selector",
          prompt: `Write a pure \`reducer(state, action)\` for \`{ title, todos }\`: \`add <text>\` appends \`{ id, text, done: false }\` (ids from 1), \`toggle <id>\` flips \`done\` via \`map\`, \`remove <id>\` filters, \`rename <title>\` changes only the title. Keep a \`history\` of states (\`undo\` pops the last one and prints \`undo -> <texts>\`). A memoized selector \`completedCount(state)\` recomputes only when \`state.todos\` is a new reference and counts its runs. After each action print \`<command>: todos=<["id:text*" for done]> todosChanged=<next.todos !== prev.todos> sharedItems=<how many todo objects are the same references as before> completed=<selector> selectorRuns=<runs>\`; finish with \`history=<length> firstStateStillEmpty=<the initial state's todos is still empty>\`.

Example: \`add buy milk\`, \`add write code\`, \`toggle 1\`, \`rename shopping\`, \`remove 2\`, \`undo\`, \`toggle 1\` →
\`\`\`
add buy milk: todos=["1:buy milk"] todosChanged=true sharedItems=0 completed=0 selectorRuns=1
add write code: todos=["1:buy milk","2:write code"] todosChanged=true sharedItems=1 completed=0 selectorRuns=2
toggle 1: todos=["1:buy milk*","2:write code"] todosChanged=true sharedItems=1 completed=1 selectorRuns=3
rename shopping: todos=["1:buy milk*","2:write code"] todosChanged=false sharedItems=2 completed=1 selectorRuns=3
remove 2: todos=["1:buy milk*"] todosChanged=true sharedItems=1 completed=1 selectorRuns=4
undo -> ["buy milk","write code"]
toggle 1: todos=["1:buy milk","2:write code"] todosChanged=true sharedItems=1 completed=0 selectorRuns=5
history=6 firstStateStillEmpty=true
\`\`\`
\`rename\` left \`todos\` untouched, so the selector did not run — that is why immutable updates matter.`,
          starterFile: "code/immutable-store.starter.js",
          solutionFile: "code/immutable-store.solution.js",
          hints: ["Every case returns { ...state, todos: <new array> } — toggle maps, remove filters, add spreads.", "The selector closes over lastTodos/lastValue and compares by reference."],
          cases: [
            { stdin: "add buy milk\nadd write code\ntoggle 1\nrename shopping\nremove 2\nundo\ntoggle 1\n", expected: "add buy milk: todos=[\"1:buy milk\"] todosChanged=true sharedItems=0 completed=0 selectorRuns=1\nadd write code: todos=[\"1:buy milk\",\"2:write code\"] todosChanged=true sharedItems=1 completed=0 selectorRuns=2\ntoggle 1: todos=[\"1:buy milk*\",\"2:write code\"] todosChanged=true sharedItems=1 completed=1 selectorRuns=3\nrename shopping: todos=[\"1:buy milk*\",\"2:write code\"] todosChanged=false sharedItems=2 completed=1 selectorRuns=3\nremove 2: todos=[\"1:buy milk*\"] todosChanged=true sharedItems=1 completed=1 selectorRuns=4\nundo -> [\"buy milk\",\"write code\"]\ntoggle 1: todos=[\"1:buy milk\",\"2:write code\"] todosChanged=true sharedItems=1 completed=0 selectorRuns=5\nhistory=6 firstStateStillEmpty=true\n" },
            { stdin: "toggle 9\nadd x\n", expected: "toggle 9: todos=[] todosChanged=true sharedItems=0 completed=0 selectorRuns=1\nadd x: todos=[\"1:x\"] todosChanged=true sharedItems=0 completed=0 selectorRuns=2\nhistory=3 firstStateStillEmpty=true\n", hidden: true },
          ],
        },
        {
          title: "A pipeline DSL compiled to functions",
          prompt: `Line 1 is a pipeline such as \`filter age>=30 | sort age desc | map name\`; the rest are JSON records. Write \`compile(step)\` returning a function over an array for: \`filter <field><op><value>\` (ops \`> < >= <= == !=\`; numeric literals become numbers), \`map <field>\`, \`sort [field] [desc]\` (a sorted copy), \`take <n>\`, \`uniq\`, \`count\`, \`sum [field]\`. Split the spec on \`|\`, compile each step, \`pipe\` them and print \`<spec> => <JSON result>\`; an unknown step prints \`SyntaxError: unknown step '<name>'\`.

Example: \`filter age>=30 | sort age desc | map name\` over \`{"name":"ada","age":36}\`, \`{"name":"bob","age":17}\`, \`{"name":"cy","age":41}\` →
\`\`\`
filter age>=30 | sort age desc | map name => ["cy","ada"]
\`\`\`
\`filter city==london | count\` → \`2\`; \`map city | uniq | sort\` → \`["oslo","rome"]\`.`,
          starterFile: "code/pipeline-dsl.starter.js",
          solutionFile: "code/pipeline-dsl.solution.js",
          hints: ["Parse the filter with /^(\\w+)(>=|<=|==|!=|>|<)(.+)$/ after joining the arguments — try the two-character operators first.", "Each compiled step is (xs) => ...; pipe(...steps)(records) runs them in order."],
          cases: [
            { stdin: "filter age>=30 | sort age desc | map name\n{\"name\":\"ada\",\"age\":36}\n{\"name\":\"bob\",\"age\":17}\n{\"name\":\"cy\",\"age\":41}\n", expected: "filter age>=30 | sort age desc | map name => [\"cy\",\"ada\"]\n" },
            { stdin: "filter city==london | count\n{\"name\":\"ada\",\"city\":\"london\"}\n{\"name\":\"bob\",\"city\":\"paris\"}\n{\"name\":\"cy\",\"city\":\"london\"}\n", expected: "filter city==london | count => 2\n" },
            { stdin: "map city | uniq | sort\n{\"city\":\"rome\"}\n{\"city\":\"oslo\"}\n{\"city\":\"rome\"}\n", expected: "map city | uniq | sort => [\"oslo\",\"rome\"]\n", hidden: true },
            { stdin: "filter age<40 | sum age\n{\"age\":36}\n{\"age\":41}\n{\"age\":10}\n", expected: "filter age<40 | sum age => 46\n", hidden: true },
            { stdin: "explode now\n{\"a\":1}\n", expected: "SyntaxError: unknown step 'explode'\n", hidden: true },
            { stdin: "filter age!=36 | take 1 | map name\n{\"name\":\"ada\",\"age\":36}\n{\"name\":\"bob\",\"age\":17}\n", expected: "filter age!=36 | take 1 | map name => [\"bob\"]\n", hidden: true },
          ],
        },
        {
          title: "The config loader, Result style",
          prompt: `Rebuild module 7's configuration loader with \`Result\` and **every** field error collected. \`parseJson\` maps a parse failure to \`["config is not valid JSON"]\`; \`requireObject\` rejects with \`["config must be an object, got <null|array|typeof>"]\`; field validators return \`Ok(value)\` or \`Err(message)\`: \`host\` (non-empty string, trimmed), \`port\` (integer 1–65535), \`retries\` (default 3; non-negative integer) with messages \`host must be a non-empty string, got <JSON>\`, \`port must be 1-65535, got <JSON>\`, \`retries must be a non-negative integer, got <JSON>\`; \`validateFields\` runs all three and returns \`Err(["<field>: <message>", …])\` or \`Ok(config)\`. Print \`ok: host=<> port=<> retries=<>\` or \`errors(<n>): <joined by "; ">\` per line.

Example: \`{"host":"db.local","port":5432}\`, \`{"host":"","port":70000,"retries":-1}\`, \`{oops\`, \`[1]\` →
\`\`\`
ok: host=db.local port=5432 retries=3
errors(3): host: host must be a non-empty string, got ""; port: port must be 1-65535, got 70000; retries: retries must be a non-negative integer, got -1
errors(1): config is not valid JSON
errors(1): config must be an object, got array
\`\`\`
Module 7's version stopped at the first bad field; this one reports all three.`,
          starterFile: "code/result-config-loader.starter.js",
          solutionFile: "code/result-config-loader.solution.js",
          hints: ["Run every validator, partition the results, and only then decide Ok or Err — that is the traverse/sequence step.", "Keep the error payload an array from the start so every path has the same shape."],
          cases: [
            { stdin: "{\"host\":\"db.local\",\"port\":5432}\n{\"host\":\"\",\"port\":70000,\"retries\":-1}\n{oops\n[1]\n{\"host\":\"x\",\"port\":80,\"retries\":0}\n", expected: "ok: host=db.local port=5432 retries=3\nerrors(3): host: host must be a non-empty string, got \"\"; port: port must be 1-65535, got 70000; retries: retries must be a non-negative integer, got -1\nerrors(1): config is not valid JSON\nerrors(1): config must be an object, got array\nok: host=x port=80 retries=0\n" },
            { stdin: "{\"port\":1}\n", expected: "errors(1): host: host must be a non-empty string, got undefined\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const b = a; b.x = 1;` — is this an immutable update?",
          options: ["Yes", "No — `b` is an alias; `a.x` changed too. `const b = { ...a, x: 1 }` is the immutable form", "Yes, in strict mode", "Only for arrays"],
          answer: 1,
          explanation: "`const` prevents rebinding, not mutation.",
        },
        {
          prompt: "Why do memoized selectors (Redux `reselect`, React `useMemo`) rely on immutability?",
          options: ["They deep-compare", "They compare inputs by reference — an unchanged slice keeps its reference, a changed one is a new object, so `===` decides whether to recompute", "They copy the state", "They do not"],
          answer: 1,
          explanation: "Mutating in place would make the reference stale and the selector wrong.",
        },
        {
          prompt: "`const map = curry((f, xs) => xs.map(f))` — `map(double)` returns…",
          options: ["An array", "A function waiting for the array — a unary step for `pipe`", "`undefined`", "An error"],
          answer: 1,
          explanation: "Data-last plus currying is what makes helpers composable.",
        },
        {
          prompt: "`groupBy` as a `reduce`:",
          options: ["`xs.reduce((g, x) => ({ ...g, [k(x)]: [...(g[k(x)] ?? []), x] }), {})`", "`xs.reduce((g, x) => { (g[k(x)] ??= []).push(x); return g; }, {})` — mutating the local accumulator, O(n)", "`xs.map(k)`", "`xs.filter(k)`"],
          answer: 1,
          explanation: "The first option is correct but O(n²) from spreading.",
        },
        {
          prompt: "Tree recursion (two recursive calls whose results combine) at great depth should use…",
          options: ["A trampoline", "An explicit stack or queue — trampolines only handle tail calls", "`setTimeout`", "Deeper recursion"],
          answer: 1,
          explanation: "Depth-first with a stack array is the standard iterative form.",
        },
        {
          prompt: "Memoizing `getUser(id)` when users change in the database…",
          options: ["Is fine", "Returns stale data — the inputs do not capture everything the result depends on; add invalidation or do not cache", "Speeds writes", "Is required"],
          answer: 1,
          explanation: "Cache pure results, or impure ones with an explicit invalidation story.",
        },
        {
          prompt: "`once(fn)` is best described as…",
          options: ["A timer", "Memoization with a single slot and no key — run-exactly-once initialisation", "A generator", "A promise"],
          answer: 1,
          explanation: "The lazy alternative to doing work at import time.",
        },
        {
          prompt: "`fallback = buildLogger()` as a default parameter…",
          options: ["Is lazy", "Runs `buildLogger()` whenever the argument is omitted, even if the value is never used — pass the thunk `buildLogger` and call it only when needed", "Runs once", "Is cached"],
          answer: 1,
          explanation: "Default parameter expressions are evaluated per call.",
        },
        {
          prompt: "`Some(2).map((x) => Some(x))` yields…",
          options: ["`Some(2)`", "`Some(Some(2))` — nested; `flatMap` is needed for a `Maybe`-returning function", "`None`", "`2`"],
          answer: 1,
          explanation: "Same as `[1].map((x) => [x])` giving `[[1]]`.",
        },
        {
          prompt: "To report every validation error rather than the first, you…",
          options: ["Use `flatMap`", "Run all validators, collect the `Err`s, and return `Err(list)` or `Ok(values)` — a `sequence`/`traverse`", "Throw", "Use `Maybe`"],
          answer: 1,
          explanation: "`flatMap` short-circuits by design; collection is a fold.",
        },
        {
          prompt: "Which is a legitimate reason to prefer a plain `for` loop over a fold?",
          options: ["Loops are always faster", "The body needs early exit or several accumulators, or the callback would be long — readability", "Folds are deprecated", "Loops are immutable"],
          answer: 1,
          explanation: "Choose by readability first, then measure.",
        },
        {
          prompt: "The `attempt(fn)` adapter…",
          options: ["Retries", "Runs a throwing function and returns `Ok(result)` or `Err(error)` — the bridge from exceptions to Results at a boundary", "Logs errors", "Makes functions pure"],
          answer: 1,
          explanation: "`JSON.parse` becomes `parseJson` returning a Result.",
        },
      ],
    },
  ],
});

import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "functions-and-scope",
  title: "Functions, scope and closures",
  blurb: "Declarations, expressions and arrows; parameters with defaults and rest; lexical scope and hoisting; closures and their patterns; the five rules for this with call, apply and bind; higher-order functions, composition and currying.",
  icon: "function",
  overview: `Functions are the unit of everything in JavaScript — the module, the method, the callback, the component — and the three ideas that make them powerful are the three that trip people up: lexical scope, closures, and the way this is decided at the call rather than at the definition.

This module takes them in order. First the syntax: declarations, expressions and arrows, how each hoists, and parameters with defaults, rest and spread. Then scope: the chain the engine builds when it parses the file, hoisting stated precisely, and what modules do to the global namespace. Closures get a full lesson — the mechanism, private state, configured functions, memoisation, and the loop-variable and memory pitfalls. The this lesson states the five binding rules in precedence order and gives the three fixes for a detached method. The module ends with the higher-order style: pipe and compose, currying and partial application, debounce and throttle, and the error-first callback convention Node still uses.

The exercises build the machinery — a scope-chain resolver, a counter factory, a this-rule tracer, a pipeline interpreter — so that each idea is something you have implemented, not just read.`,
  lessons: [
    {
      slug: "declaring-functions",
      file: "01-declaring-functions.md",
      exercises: [
        {
          title: "Three forms, one table",
          prompt: `Define \`add\` as a function **declaration**, \`sub\` as a function **expression**, \`mul\` as an **arrow**, and \`stats(...nums)\` with a rest parameter returning \`{ count, total }\`. Read \`n\` pairs \`a b\` and print \`<a> <b>: add=<> sub=<> mul=<>\` for each, then \`names=<add.name>,<sub.name>,<mul.name> lengths=<add.length>,<sub.length>,<mul.length>,<stats.length>\`, then \`stats: count=<> total=<>\` over every number read. Note that a rest parameter does not count toward \`length\`.

Example: \`2\` then \`3 4\`, \`10 -2\` →
\`\`\`
3 4: add=7 sub=-1 mul=12
10 -2: add=8 sub=12 mul=-20
names=add,sub,mul lengths=2,2,2,0
stats: count=4 total=15
\`\`\``,
          starterFile: "code/three-forms.starter.js",
          solutionFile: "code/three-forms.solution.js",
          hints: ["A function expression assigned to a const takes the variable's name.", "Spread the collected numbers into stats: stats(...all)."],
          cases: [
            { stdin: "2\n3 4\n10 -2\n", expected: "3 4: add=7 sub=-1 mul=12\n10 -2: add=8 sub=12 mul=-20\nnames=add,sub,mul lengths=2,2,2,0\nstats: count=4 total=15\n" },
            { stdin: "1\n5 5\n", expected: "5 5: add=10 sub=0 mul=25\nnames=add,sub,mul lengths=2,2,2,0\nstats: count=2 total=10\n" },
            { stdin: "0\n", expected: "names=add,sub,mul lengths=2,2,2,0\nstats: count=0 total=0\n", hidden: true },
          ],
        },
        {
          title: "Defaults trigger on undefined",
          prompt: `Given \`greet(name = "world", punctuation = "!")\` and \`sum(...nums)\`, read \`n\` commands: \`greet <name> <punct>\` where \`-\` means "pass \`undefined\`" and \`null\` means "pass \`null\`" (so the default applies only for \`-\`); \`sum <k> <k numbers>\` spreads the numbers into \`sum\`. Print each result.

Example: \`4\` then \`greet - -\`, \`greet Ada ?\`, \`greet null -\`, \`sum 3 1 2 3\` →
\`\`\`
Hello, world!
Hello, Ada?
Hello, null!
sum=6
\`\`\``,
          starterFile: "code/defaults-and-rest.starter.js",
          solutionFile: "code/defaults-and-rest.solution.js",
          hints: ["Map - to undefined and null to null before calling; the default fires for undefined only.", "Collect the k numbers in an array and call sum(...values)."],
          cases: [
            { stdin: "4\ngreet - -\ngreet Ada ?\ngreet null -\nsum 3 1 2 3\n", expected: "Hello, world!\nHello, Ada?\nHello, null!\nsum=6\n" },
            { stdin: "2\nsum 0\ngreet - .\n", expected: "sum=0\nHello, world.\n" },
            { stdin: "2\ngreet Bo -\nsum 2 -5 5\n", expected: "Hello, Bo!\nsum=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which can be called before the line that defines it?",
          options: ["`const f = () => 1`", "`function f() {}` — declarations hoist with their body", "`const f = function () {}`", "None"],
          answer: 1,
          explanation: "Expressions and arrows assigned to `const` are in the temporal dead zone until their line.",
        },
        {
          prompt: "`(() => { a: 1 })()` returns…",
          options: ["`{ a: 1 }`", "`undefined` — the braces are a block body with a label; wrap the object in parentheses", "`1`", "A syntax error"],
          answer: 1,
          explanation: "`() => ({ a: 1 })` returns the object.",
        },
        {
          prompt: "`function f(x = 5) {}; f(null)` — inside, `x` is…",
          options: ["`5`", "`null` — defaults apply only for `undefined`", "`0`", "`undefined`"],
          answer: 1,
          explanation: "`f()` and `f(undefined)` would both give 5.",
        },
        {
          prompt: "Rest parameters versus the `arguments` object:",
          options: ["Identical", "Rest is a real array, works in arrows, and must be last; `arguments` is array-like and absent in arrows", "`arguments` is newer", "Rest cannot be empty"],
          answer: 1,
          explanation: "Use rest in all new code.",
        },
        {
          prompt: "`f.length` for `function f(a, b = 1, ...rest) {}` is…",
          options: ["3", "2", "1 — parameters before the first default", "0"],
          answer: 2,
          explanation: "`length` counts leading parameters without defaults; rest never counts.",
        },
      ],
    },
    {
      slug: "scope-and-hoisting",
      file: "02-scope-and-hoisting.md",
      exercises: [
        {
          title: "A scope-chain resolver",
          prompt: `Model lexical scope. Read \`n\` scopes, one per line: \`<name> <parent or -> <declared names…>\`. Then \`q\` queries \`<scope> <identifier>\`. Resolve each the way the engine does — look in the scope, then its parent, and so on — and print \`<identifier> from <scope>: found in <scope> (<hops> up)\` or \`<identifier> from <scope>: ReferenceError\`.

Example
\`\`\`
3
global - app
order global id total
loop order line
2
loop total
loop app
\`\`\`
→
\`\`\`
total from loop: found in order (1 up)
app from loop: found in global (2 up)
\`\`\``,
          starterFile: "code/scope-chain.starter.js",
          solutionFile: "code/scope-chain.solution.js",
          hints: ["Walk parent pointers until you find a scope whose set has the name or run out of parents.", "The number of hops is how many parents you followed."],
          cases: [
            { stdin: "3\nglobal - app\norder global id total\nloop order line\n3\nloop total\nloop app\nloop id2\n", expected: "total from loop: found in order (1 up)\napp from loop: found in global (2 up)\nid2 from loop: ReferenceError\n" },
            { stdin: "1\ng - x\n2\ng x\ng y\n", expected: "x from g: found in g (0 up)\ny from g: ReferenceError\n" },
            { stdin: "2\nouter - x\ninner outer x\n2\ninner x\nouter x\n", expected: "x from inner: found in inner (0 up)\nx from outer: found in outer (0 up)\n", hidden: true },
          ],
        },
        {
          title: "Hoisting, observed",
          prompt: `Read \`n\`. Call \`main()\` on the line **above** its declaration. Inside \`main\`: call \`square(n)\` (a function declaration written below \`main\`) and print \`declaration: square(<n>)=<…>\`; try to call \`cube(n)\` (a \`const\` arrow written at the bottom of the file) inside \`try\`/\`catch\` and print \`expression: cube(<n>)=<…>\` or \`expression: <error class>\`; print \`var before assignment: <typeof v>\`, then \`var v = n\`, then \`var after assignment: <typeof v>\`.

Example: \`3\` →
\`\`\`
declaration: square(3)=9
expression: ReferenceError
var before assignment: undefined
var after assignment: number
\`\`\``,
          starterFile: "code/hoisting-observed.starter.js",
          solutionFile: "code/hoisting-observed.solution.js",
          hints: ["main() runs before the const cube line executes, so cube is in its dead zone.", "typeof on a hoisted var is \"undefined\" — the variable exists, without a value."],
          cases: [
            { stdin: "3\n", expected: "declaration: square(3)=9\nexpression: ReferenceError\nvar before assignment: undefined\nvar after assignment: number\n" },
            { stdin: "0\n", expected: "declaration: square(0)=0\nexpression: ReferenceError\nvar before assignment: undefined\nvar after assignment: number\n" },
            { stdin: "-4\n", expected: "declaration: square(-4)=16\nexpression: ReferenceError\nvar before assignment: undefined\nvar after assignment: number\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Lexical scope means a function sees…",
          options: ["The variables of whoever calls it", "The variables of the scopes it was written inside, fixed at definition", "Only its parameters", "Only globals"],
          answer: 1,
          explanation: "Dynamic scoping would use the call site; JavaScript never does (except for `this`).",
        },
        {
          prompt: "In a Node CommonJS file, top-level `var x`…",
          options: ["Becomes a global", "Stays private to the file — Node wraps each file in a function", "Is a syntax error", "Becomes `module.exports.x`"],
          answer: 1,
          explanation: "In a browser script it would become `window.x`.",
        },
        {
          prompt: "Two `const y` declarations in different `case` clauses of one `switch`…",
          options: ["Are fine", "Clash — case clauses share the switch block; wrap each case body in braces", "Shadow each other", "Are hoisted"],
          answer: 1,
          explanation: "`SyntaxError: Identifier 'y' has already been declared`.",
        },
        {
          prompt: "`import` declarations…",
          options: ["Run where written", "Are hoisted and resolved before the module body runs", "Are in a TDZ", "Are lazy"],
          answer: 1,
          explanation: "You may use an import above the `import` line (though style says keep imports at the top).",
        },
        {
          prompt: "Shadowing is…",
          options: ["A syntax error", "An inner declaration hiding an outer one of the same name — legal, often confusing", "Copying a variable", "Hoisting"],
          answer: 1,
          explanation: "Linters offer `no-shadow` for a reason.",
        },
      ],
    },
    {
      slug: "closures",
      file: "03-closures.md",
      exercises: [
        {
          title: "A counter factory",
          prompt: `Write \`makeCounter(start = 0)\` returning \`{ inc, dec, get }\` over a **private** \`count\` — no property holds it. Read \`n\` commands: \`new <name> <start>\`, \`inc <name>\`, \`dec <name>\`, \`get <name>\` (prints \`<name>=<count>\`). Keep the counters in a \`Map\`. Finish with \`counters=<how many>\`. Two counters never interfere: each call to the factory makes a fresh scope.

Example: \`7\` then \`new a 5\`, \`inc a\`, \`inc a\`, \`get a\`, \`new b 0\`, \`dec b\`, \`get b\` →
\`\`\`
a=7
b=-1
counters=2
\`\`\``,
          starterFile: "code/counter-factory.starter.js",
          solutionFile: "code/counter-factory.solution.js",
          hints: ["let count inside the factory; the three arrows close over it.", "Nothing outside can read count except through get — that is the encapsulation."],
          cases: [
            { stdin: "7\nnew a 5\ninc a\ninc a\nget a\nnew b 0\ndec b\nget b\n", expected: "a=7\nb=-1\ncounters=2\n" },
            { stdin: "3\nnew x 0\nget x\nget x\n", expected: "x=0\nx=0\ncounters=1\n" },
            { stdin: "5\nnew p 10\nnew q 10\ndec p\nget p\nget q\n", expected: "p=9\nq=10\ncounters=2\n", hidden: true },
          ],
        },
        {
          title: "Memoise, and count the hits",
          prompt: `Write \`memoize(f)\` returning a function that caches results by argument in a closure-held \`Map\` and exposes \`hits\` and \`misses\` counters as properties on the returned function. Memoise the provided \`collatzSteps\`. Read \`n\` integers; print \`steps(<x>)=<result>\` for each, then \`computed=<misses> cached=<hits>\`.

Example: \`5\` then \`6 6 27 6 27\` →
\`\`\`
steps(6)=8
steps(6)=8
steps(27)=111
steps(6)=8
steps(27)=111
computed=2 cached=3
\`\`\``,
          starterFile: "code/memoize.starter.js",
          solutionFile: "code/memoize.solution.js",
          hints: ["Functions are objects: wrapped.hits = 0 attaches a counter the caller can read.", "Check the cache with has(), not get() — a cached value could itself be falsy."],
          cases: [
            { stdin: "5\n6 6 27 6 27\n", expected: "steps(6)=8\nsteps(6)=8\nsteps(27)=111\nsteps(6)=8\nsteps(27)=111\ncomputed=2 cached=3\n" },
            { stdin: "1\n1\n", expected: "steps(1)=0\ncomputed=1 cached=0\n" },
            { stdin: "3\n7 7 7\n", expected: "steps(7)=16\nsteps(7)=16\nsteps(7)=16\ncomputed=1 cached=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A closure is…",
          options: ["A function with no parameters", "A function together with the lexical scope it was created in, still usable after that scope's function returned", "A sealed object", "An IIFE"],
          answer: 1,
          explanation: "Every function is technically one; the term matters when the scope outlives its call.",
        },
        {
          prompt: "Closures capture…",
          options: ["Copies of values at creation time", "Live variable bindings — later changes to the outer variable are visible inside", "Only constants", "Only parameters"],
          answer: 1,
          explanation: "Two closures over the same `n` (an `inc` and a `get`) see the same value.",
        },
        {
          prompt: "`for (var i …) fns.push(() => i)` yields identical results because…",
          options: ["Arrows cannot close over loop variables", "There is one `var i` binding shared by every closure, read after the loop ended", "`push` copies the function", "`i` is a constant"],
          answer: 1,
          explanation: "`let` creates a binding per iteration and fixes it.",
        },
        {
          prompt: "Private state before `#fields` was done with…",
          options: ["`private` keyword", "A factory function whose returned methods close over local variables", "`Object.freeze`", "Underscored property names"],
          answer: 1,
          explanation: "The module pattern; nothing outside can reach the variable.",
        },
        {
          prompt: "A memory leak through a closure happens when…",
          options: ["The closure is called twice", "A long-lived reference (listener, timer, cache) holds a callback that holds a large captured scope", "Closures are used in loops", "The closure returns an object"],
          answer: 1,
          explanation: "Capture only what you need and remove listeners when done.",
        },
      ],
    },
    {
      slug: "this-call-apply-bind",
      file: "04-this-call-apply-bind.md",
      exercises: [
        {
          title: "Which rule decided?",
          prompt: `Given \`ada = { name: "Ada", who() {…}, viaArrow() {…} }\` (\`who\` returns \`this.name\`, or \`"undefined"\` when \`this\` is undefined; \`viaArrow\` maps over \`[1]\` with an arrow returning \`this.name\`), \`bo = { name: "Bo" }\` and a constructor \`Thing(name)\`, read \`n\` call kinds and print \`<kind>: <result>\`: \`method\` (\`ada.who()\`), \`detached\` (\`const f = ada.who; f()\`), \`bound\` (\`ada.who.bind(bo)()\`), \`call\` (\`ada.who.call({ name: "Cy" })\`), \`arrow-in-method\` (\`ada.viaArrow()\`), \`new\` (\`new Thing("instance").name\`).

Example: \`3\` then \`method detached bound\` →
\`\`\`
method: Ada
detached: undefined
bound: Bo
\`\`\``,
          starterFile: "code/which-rule.starter.js",
          solutionFile: "code/which-rule.solution.js",
          hints: ["Run the five rules in order: arrow → new → call/apply/bind → dot → plain.", "The detached call is a plain call: in strict mode this is undefined."],
          cases: [
            { stdin: "3\nmethod detached bound\n", expected: "method: Ada\ndetached: undefined\nbound: Bo\n" },
            { stdin: "3\ncall arrow-in-method new\n", expected: "call: Cy\narrow-in-method: Ada\nnew: instance\n" },
            { stdin: "2\ndetached method\n", expected: "detached: undefined\nmethod: Ada\n", hidden: true },
          ],
        },
        {
          title: "Fix the callback, three ways",
          prompt: `A \`Counter\` class has \`count\`, a method \`increment()\` and an arrow field \`incrementArrow\`. Read \`n\`. Register \`n\` callbacks in a \`later\` array in four ways — the **broken** detached method \`broken.increment\`, an arrow wrapper \`() => wrapped.increment()\`, a bound copy \`bound.increment.bind(bound)\`, and the arrow field \`field.incrementArrow\` — each on its own \`Counter\` instance. Then run every callback inside \`try\`/\`catch\`, counting the errors, and print \`broken=<count> errors=<n>\` and \`wrapped=<> bound=<> field=<>\`.

Example: \`3\` →
\`\`\`
broken=0 errors=3
wrapped=3 bound=3 field=3
\`\`\``,
          starterFile: "code/fix-the-callback.starter.js",
          solutionFile: "code/fix-the-callback.solution.js",
          hints: ["The detached method runs as a plain call — this is undefined and this.count++ throws.", "Each of the three fixes keeps this pointing at the right instance."],
          cases: [
            { stdin: "3\n", expected: "broken=0 errors=3\nwrapped=3 bound=3 field=3\n" },
            { stdin: "1\n", expected: "broken=0 errors=1\nwrapped=1 bound=1 field=1\n" },
            { stdin: "0\n", expected: "broken=0 errors=0\nwrapped=0 bound=0 field=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In strict mode, `const f = obj.method; f()` runs with `this` equal to…",
          options: ["`obj`", "`undefined` — a plain call loses the receiver", "The global object", "`f`"],
          answer: 1,
          explanation: "Wrap in an arrow, `bind`, or use an arrow class field.",
        },
        {
          prompt: "An arrow function's `this` is…",
          options: ["The object it is stored on", "The `this` of the enclosing scope at creation — and `bind` cannot change it", "Always `undefined`", "Decided at the call"],
          answer: 1,
          explanation: "Right for callbacks inside methods; wrong for methods themselves.",
        },
        {
          prompt: "`f.bind(a).bind(b)()` uses `this` equal to…",
          options: ["`b`", "`a` — a bound function cannot be rebound", "`undefined`", "Both"],
          answer: 1,
          explanation: "`call` on a bound function is likewise ignored for `this`.",
        },
        {
          prompt: "`call` versus `apply`:",
          options: ["`apply` is faster", "`call` takes listed arguments, `apply` takes an array — spread made `apply` mostly redundant", "`call` returns a function", "They differ in `this`"],
          answer: 1,
          explanation: "`bind` is the one that returns a new function instead of invoking.",
        },
        {
          prompt: "Predict: `const o = { n: 1, f: () => this.n }; o.f()`",
          options: ["`1`", "`undefined` (or a `TypeError`) — an arrow at object-literal level does not see `o`", "`o`", "A syntax error"],
          answer: 1,
          explanation: "Use method shorthand `f() { return this.n; }` for methods.",
        },
      ],
    },
    {
      slug: "higher-order-functions",
      file: "05-higher-order-functions.md",
      exercises: [
        {
          title: "pipe and compose",
          prompt: `Implement \`pipe(...fns)\` (left to right, with \`reduce\`) and \`compose(...fns)\` (right to left, with \`reduceRight\`) over unary functions. Read \`k\` step names from \`inc\`, \`double\`, \`square\`, \`neg\`, then \`m\` numbers; for each number print \`pipe(<steps>)(<x>)=<…> compose(<steps>)(<x>)=<…>\` with the steps comma-joined.

Example: \`2 inc double\` then \`3\` then \`1 5 -2\` →
\`\`\`
pipe(inc,double)(1)=4 compose(inc,double)(1)=3
pipe(inc,double)(5)=12 compose(inc,double)(5)=11
pipe(inc,double)(-2)=-2 compose(inc,double)(-2)=-3
\`\`\``,
          starterFile: "code/pipe-compose.starter.js",
          solutionFile: "code/pipe-compose.solution.js",
          hints: ["pipe: fns.reduce((acc, f) => f(acc), x) — the input is the seed.", "compose is the same fold from the right."],
          cases: [
            { stdin: "2 inc double\n3\n1 5 -2\n", expected: "pipe(inc,double)(1)=4 compose(inc,double)(1)=3\npipe(inc,double)(5)=12 compose(inc,double)(5)=11\npipe(inc,double)(-2)=-2 compose(inc,double)(-2)=-3\n" },
            { stdin: "1 square\n1\n-3\n", expected: "pipe(square)(-3)=9 compose(square)(-3)=9\n" },
            { stdin: "3 neg square inc\n2\n2 0\n", expected: "pipe(neg,square,inc)(2)=5 compose(neg,square,inc)(2)=-9\npipe(neg,square,inc)(0)=1 compose(neg,square,inc)(0)=-1\n", hidden: true },
          ],
        },
        {
          title: "curry and partial",
          prompt: `Implement a generic \`curry(f)\` that keeps collecting arguments until \`f.length\` are present, then calls \`f\` — so \`volume(2)(3)(4)\`, \`volume(2, 3)(4)\` and \`volume(2, 3, 4)\` all work. \`partial(f, ...fixed)\` is given. Read \`n\` lines \`l w h name\` and print \`volume=<a>,<b>,<c> same=<all equal> <hello(name)>\` where \`hello = partial(greet, "Hello")\`.

Example: \`2\` then \`2 3 4 Ada\`, \`1 1 1 Bo\` →
\`\`\`
volume=24,24,24 same=true Hello, Ada
volume=1,1,1 same=true Hello, Bo
\`\`\``,
          starterFile: "code/curry-partial.starter.js",
          solutionFile: "code/curry-partial.solution.js",
          hints: ["curried(...args) checks args.length >= f.length; otherwise return a function that appends more.", "f.length is the declared parameter count — that is why curry needs a fixed-arity function."],
          cases: [
            { stdin: "2\n2 3 4 Ada\n1 1 1 Bo\n", expected: "volume=24,24,24 same=true Hello, Ada\nvolume=1,1,1 same=true Hello, Bo\n" },
            { stdin: "1\n0 9 9 Cy\n", expected: "volume=0,0,0 same=true Hello, Cy\n" },
            { stdin: "2\n-1 2 3 Dee\n10 10 10 Eve\n", expected: "volume=-6,-6,-6 same=true Hello, Dee\nvolume=1000,1000,1000 same=true Hello, Eve\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A higher-order function…",
          options: ["Is asynchronous", "Takes a function as an argument or returns one", "Has more than two parameters", "Is recursive"],
          answer: 1,
          explanation: "`map`, `filter`, `compose`, `debounce` — and your own factories.",
        },
        {
          prompt: "`pipe(f, g, h)(x)` equals…",
          options: ["`f(g(h(x)))`", "`h(g(f(x)))`", "`f(x) + g(x) + h(x)`", "`[f, g, h]`"],
          answer: 1,
          explanation: "Left to right; `compose` is the reverse.",
        },
        {
          prompt: "`[\"1\", \"2\", \"3\"].map(parseInt)` gives…",
          options: ["`[1, 2, 3]`", "`[1, NaN, NaN]` — `map` passes the index as the radix", "`[\"1\", \"2\", \"3\"]`", "Throws"],
          answer: 1,
          explanation: "`.map(Number)` or `.map((s) => parseInt(s, 10))`.",
        },
        {
          prompt: "Currying versus partial application:",
          options: ["Same thing", "Currying: one argument per call until all arrive; partial: fix some arguments now, take the rest later", "Currying needs `bind`", "Partial is recursive"],
          answer: 1,
          explanation: "Both are closures over the arguments supplied so far.",
        },
        {
          prompt: "In Node's error-first callback convention…",
          options: ["The callback is the first argument", "The callback is last and receives `(err, result)`; check `err` first and return", "Errors are thrown", "Results come first"],
          answer: 1,
          explanation: "Call it exactly once and asynchronously; `util.promisify` converts to a promise.",
        },
      ],
    },
    {
      slug: "functions-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A counter with an audit log",
          prompt: `Write \`makeCounter()\` with private \`value\` and \`history\` and methods \`inc(by)\`, \`dec(by)\`, \`undo()\` (reverts the last change, returning \`undid <entry>\` or \`nothing to undo\`), \`get()\` and \`log()\` (the history entries like \`+5 -2\` space-joined, or \`(empty)\`). Read \`n\` commands \`inc <k>\`, \`dec <k>\`, \`undo\`, \`get\` (prints \`value=<v>\`), \`log\` (prints \`log=<entries>\`).

Example: \`7\` then \`inc 5\`, \`inc 2\`, \`get\`, \`undo\`, \`get\`, \`log\`, \`undo\` →
\`\`\`
value=7
undid +2
value=5
log=+5
undid +5
\`\`\``,
          starterFile: "code/audit-counter.starter.js",
          solutionFile: "code/audit-counter.solution.js",
          hints: ["Store each change as a signed string so undo can Number() it and subtract.", "Both value and history live in the factory's scope; only the methods can touch them."],
          cases: [
            { stdin: "7\ninc 5\ninc 2\nget\nundo\nget\nlog\nundo\n", expected: "value=7\nundid +2\nvalue=5\nlog=+5\nundid +5\n" },
            { stdin: "2\nundo\nlog\n", expected: "nothing to undo\nlog=(empty)\n" },
            { stdin: "4\ndec 3\ninc 10\nlog\nget\n", expected: "log=-3 +10\nvalue=7\n", hidden: true },
          ],
        },
        {
          title: "Binding precedence",
          prompt: `Read three names and make objects \`a\`, \`b\`, \`c\` with those names. With \`function who() { return this === undefined ? "undefined" : this.name; }\`, print four lines: \`bindTwice=<who.bind(a).bind(b)()>\` (the first bind wins), \`callOnBound=<who.bind(a).call(c)>\` (call cannot override), \`arrowIgnoresBind=<an arrow returning this.name, bound to a, then called>\` — at the top level of a CommonJS file \`this\` is \`module.exports\`, whose \`name\` is \`undefined\` — and \`newOverridesBind=<new (Named.bind(b))(c.name).name>\` where \`function Named(name) { this.name = name; }\`.

Example: \`3 Ada Bo Cy\` →
\`\`\`
bindTwice=Ada
callOnBound=Ada
arrowIgnoresBind=undefined
newOverridesBind=Cy
\`\`\``,
          starterFile: "code/bind-precedence.starter.js",
          solutionFile: "code/bind-precedence.solution.js",
          hints: ["Precedence: arrow (lexical) beats everything; new beats bind; bind beats call; the dot beats a plain call.", "A bound constructor still creates a fresh object under new — the bound this is discarded."],
          cases: [
            { stdin: "3 Ada Bo Cy\n", expected: "bindTwice=Ada\ncallOnBound=Ada\narrowIgnoresBind=undefined\nnewOverridesBind=Cy\n" },
            { stdin: "3 x y z\n", expected: "bindTwice=x\ncallOnBound=x\narrowIgnoresBind=undefined\nnewOverridesBind=z\n" },
            { stdin: "3 one two three\n", expected: "bindTwice=one\ncallOnBound=one\narrowIgnoresBind=undefined\nnewOverridesBind=three\n", hidden: true },
          ],
        },
        {
          title: "A pipeline interpreter",
          prompt: `The first line names steps, each \`name\` or \`name:arg\`, from a registry of step **factories**: \`inc\`, \`double\`, \`add:k\`, \`mul:k\`, and \`tap\` (passes the value through and increments a closure-held counter). The second line holds numbers. Build each step by calling its factory with the argument, \`pipe\` them, apply the pipeline to every number printing \`<x> -> <result>\`, then print \`tapped=<how many times tap ran>\`.

Example: \`inc tap double add:3 tap\` / \`1 2 3\` →
\`\`\`
1 -> 7
2 -> 9
3 -> 11
tapped=6
\`\`\``,
          starterFile: "code/pipeline-interpreter.starter.js",
          solutionFile: "code/pipeline-interpreter.solution.js",
          hints: ["Split each step on ':' — the factory takes the (possibly undefined) argument and returns the unary step.", "tap is a closure over the tapped counter: a side effect inside a pipeline, counted."],
          cases: [
            { stdin: "inc tap double add:3 tap\n1 2 3\n", expected: "1 -> 7\n2 -> 9\n3 -> 11\ntapped=6\n" },
            { stdin: "mul:10\n0 5\n", expected: "0 -> 0\n5 -> 50\ntapped=0\n" },
            { stdin: "tap tap tap\n7\n", expected: "7 -> 7\ntapped=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which form is hoisted with its body?",
          options: ["Arrow function", "Function expression", "Function declaration", "Method shorthand"],
          answer: 2,
          explanation: "The others are values available only after their line.",
        },
        {
          prompt: "A default parameter is used when the argument is…",
          options: ["Falsy", "`undefined`", "`null`", "Missing only, not explicit `undefined`"],
          answer: 1,
          explanation: "`null` is passed through.",
        },
        {
          prompt: "Spread versus rest:",
          options: ["Same syntax, same meaning", "Rest gathers remaining parameters in a signature; spread expands an iterable at a call or literal", "Rest is for arrays only", "Spread is for objects only"],
          answer: 1,
          explanation: "Same three dots, opposite directions.",
        },
        {
          prompt: "Where does a name lookup end?",
          options: ["At the function", "At the global scope — then `ReferenceError` on read", "At the nearest block", "At the module only"],
          answer: 1,
          explanation: "Block → function → module → global, in that order.",
        },
        {
          prompt: "Closures capture…",
          options: ["Values", "Live bindings", "Types", "Copies of objects"],
          answer: 1,
          explanation: "Which is why a shared `var` loop variable shows its final value.",
        },
        {
          prompt: "`for (let i …)` fixes the loop-closure bug because…",
          options: ["`let` is faster", "Each iteration gets its own `i` binding", "Closures cannot capture `let`", "`let` copies the value"],
          answer: 1,
          explanation: "One binding per iteration by specification.",
        },
        {
          prompt: "Highest precedence among the `this` rules:",
          options: ["Method call", "`bind`", "Arrow function (lexical `this`)", "Plain call"],
          answer: 2,
          explanation: "Arrow, then `new`, then explicit binding, then the receiver, then `undefined`.",
        },
        {
          prompt: "`obj.method` passed to `setTimeout` runs with `this`…",
          options: ["`obj`", "`undefined` in strict mode — fix with an arrow, `bind`, or an arrow field", "The timer", "`globalThis` always"],
          answer: 1,
          explanation: "The dot is lost when the method is detached.",
        },
        {
          prompt: "`bind` returns…",
          options: ["The result of calling `f`", "A new function with `this` (and optional leading arguments) fixed", "`this`", "A promise"],
          answer: 1,
          explanation: "`call`/`apply` invoke immediately.",
        },
        {
          prompt: "`compose(f, g)(x)` is…",
          options: ["`g(f(x))`", "`f(g(x))`", "`f(x)(g)`", "`[f(x), g(x)]`"],
          answer: 1,
          explanation: "Right to left, like function composition in mathematics.",
        },
        {
          prompt: "Memoisation stores…",
          options: ["The function's source", "Previous results keyed by argument, in a closure-held cache", "The call stack", "Global variables"],
          answer: 1,
          explanation: "Use `Map.has` so a falsy cached value still counts as a hit.",
        },
        {
          prompt: "An error-first callback should be called…",
          options: ["Twice, once with the error and once with the result", "Exactly once, asynchronously, with `(err, result)`", "Synchronously when possible", "Only on success"],
          answer: 1,
          explanation: "Two calls or a sometimes-sync callback are classic bugs.",
        },
      ],
    },
  ],
});

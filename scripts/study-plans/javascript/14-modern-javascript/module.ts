import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "modern-javascript",
  title: "Modern JavaScript and its tooling",
  blurb: "ES2020–2022 in everyday code; the 2023+ additions, TC39 stages, feature detection and spec-faithful polyfills; bundlers, tree-shaking, code splitting and source maps; ESLint, Prettier, test runners and CI; Node, Deno, Bun, edge runtimes and the web-standard core.",
  icon: "modern",
  overview: `The language you have been learning is a moving target with a yearly release, a public proposal process, and a toolchain that rewrites, checks, tests and bundles code before it runs anywhere. Knowing the features is half of being current; knowing how they reach your runtime — transpiled, polyfilled, tree-shaken, split — and what checks stand between a keystroke and a deploy is the other half.

The first lesson covers the ES2020–2022 features that changed everyday code and their precise semantics; the second covers 2023 onward, the TC39 stages, and how to detect and polyfill correctly on a runtime that lags — which this plan's Node 16 does, so the exercises implement several newer features by hand. The build lesson walks the pipeline from resolution to source maps and explains what tree-shaking needs and what defeats it. The quality lesson covers ESLint's flat config, Prettier, the shape of a good test, mocking with restraint, and the hook-plus-CI wiring. The last lesson maps the runtimes — browsers, Node, Deno, Bun, edge isolates — and the web-standard core that makes code portable between them.

The exercises use every 2020–2022 feature, polyfill the 2023–2024 array and grouping methods to the spec, tree-shake a module graph, plan chunks, write a linter and a TAP test runner, detect features with \`new Function\`, resolve an import map — then a \`structuredClone\` polyfill with cycles, a miniature bundler, and a runtime-support planner.`,
  lessons: [
    {
      slug: "es2020-to-es2022",
      file: "01-es2020-to-es2022.md",
      exercises: [
        {
          title: "The 2020–2021 toolkit in one program",
          prompt: `Line 1 is a JSON config, line 2 a number \`n\`, line 3 a sentence. Merge the config with the defaults \`{ port: 3000, host: "localhost", retries: 3, debug: false }\` using \`??=\` and, for contrast, with \`||=\`; print \`merged=<JSON>\` and \`viaOr=<JSON> differs=<bool>\`. Print \`city=<config.owner?.address?.city ?? "unknown"> firstTag=<config.tags?.[0] ?? "none"> onReady=<typeof config.onReady?.call>\`. Compute \`n!\` with BigInt and print \`<n>! = <value> digits=<> typeof=bigint safe=<≤ MAX_SAFE_INTEGER>\`, then \`bigint+number=<constructor name of the error from fact + 1> bigint+1n=true\`. Finally title-case the sentence with \`matchAll\` and print \`titleCase=<> dashes=<sentence.replaceAll(" ", "-")> million=<1_000_000> hex=<0xff_ff>\`.

Example: \`{"port":0,"host":"","owner":{"address":{"city":"Paris"}},"tags":[]}\` / \`25\` / \`hello brave new world\` →
\`\`\`
merged={"port":0,"host":"","owner":{"address":{"city":"Paris"}},"tags":[],"retries":3,"debug":false}
viaOr={"port":3000,"host":"localhost","owner":{"address":{"city":"Paris"}},"tags":[],"retries":3,"debug":false} differs=true
city=Paris firstTag=none onReady=undefined
25! = 15511210043330985984000000 digits=26 typeof=bigint safe=false
bigint+number=TypeError bigint+1n=true
titleCase=Hello Brave New World dashes=hello-brave-new-world million=1000000 hex=65535
\`\`\`
\`??=\` kept the deliberate \`0\` and \`""\`; \`||=\` overwrote them.`,
          starterFile: "code/es2020-toolkit.starter.js",
          solutionFile: "code/es2020-toolkit.solution.js",
          hints: ["for (const [k, v] of Object.entries(DEFAULTS)) merged[k] ??= v;", "Loop with BigInt counters (let i = 2n; i <= BigInt(n); i++) — mixing 2n with a Number index throws."],
          cases: [
            { stdin: "{\"port\":0,\"host\":\"\",\"owner\":{\"address\":{\"city\":\"Paris\"}},\"tags\":[]}\n25\nhello brave new world\n", expected: "merged={\"port\":0,\"host\":\"\",\"owner\":{\"address\":{\"city\":\"Paris\"}},\"tags\":[],\"retries\":3,\"debug\":false}\nviaOr={\"port\":3000,\"host\":\"localhost\",\"owner\":{\"address\":{\"city\":\"Paris\"}},\"tags\":[],\"retries\":3,\"debug\":false} differs=true\ncity=Paris firstTag=none onReady=undefined\n25! = 15511210043330985984000000 digits=26 typeof=bigint safe=false\nbigint+number=TypeError bigint+1n=true\ntitleCase=Hello Brave New World dashes=hello-brave-new-world million=1000000 hex=65535\n" },
            { stdin: "{\"debug\":true}\n5\none\n", expected: "merged={\"debug\":true,\"port\":3000,\"host\":\"localhost\",\"retries\":3}\nviaOr={\"debug\":true,\"port\":3000,\"host\":\"localhost\",\"retries\":3} differs=false\ncity=unknown firstTag=none onReady=undefined\n5! = 120 digits=3 typeof=bigint safe=true\nbigint+number=TypeError bigint+1n=true\ntitleCase=One dashes=one million=1000000 hex=65535\n", hidden: true },
          ],
        },
        {
          title: "ES2022 class features, cause and indices",
          prompt: `Write \`Counter\` with \`static instances\`, a \`static registry\` filled in a **static block**, private \`#count\` and \`#history\`, a private method \`#bump()\`, \`inc(times)\`, \`get value()\`, \`get last()\` (via \`this.#history.at(-1) ?? null\`) and \`static isCounter(x)\` using the brand check \`#count in x\`. Commands: \`new <name>\` → \`new <name>: instances=<n>\`; \`inc <name> <times>\` → \`<name>: value=<n>\`; \`check <name>\` → \`isCounter(<name>)=<> isCounter(plain)=<for a plain {name}> hasOwn(name)=<Object.hasOwn(counter, "name")> hasOwn(value)=<…>\`; \`last <name>\` → \`<name>: last=<n|null>\`; \`fail <name> <message>\` throws a \`RangeError("inner: <message>")\`, wraps it in \`Error("outer: <name> failed", { cause })\` and prints \`<message> <- <cause.name>: <cause.message>\`. Finally print \`indices: word=<start-end> host=<start-end>\` from \`/(?<word>\\w+)@(?<host>\\w+)/d\` on \`"mail ada@example now"\`.

Example: \`new a\`, \`inc a 3\`, \`check a\`, \`last a\`, \`fail a disk full\` →
\`\`\`
new a: instances=1
a: value=3
isCounter(a)=true isCounter(plain)=false hasOwn(name)=true hasOwn(value)=false
a: last=3
outer: a failed <- RangeError: inner: disk
indices: word=5-8 host=9-16
\`\`\`
(\`value\` is an accessor on the prototype, so it is not an own property.)`,
          starterFile: "code/class-features-2022.starter.js",
          solutionFile: "code/class-features-2022.solution.js",
          hints: ["static { Counter.registry = new Map(); } runs once when the class is defined.", "err.cause?.name — optional chaining keeps the error path safe when no cause was attached."],
          cases: [
            { stdin: "new a\nnew b\ninc a 3\ninc b 1\ncheck a\nlast a\nlast b\nfail a disk full\n", expected: "new a: instances=1\nnew b: instances=2\na: value=3\nb: value=1\nisCounter(a)=true isCounter(plain)=false hasOwn(name)=true hasOwn(value)=false\na: last=3\nb: last=1\nouter: a failed <- RangeError: inner: disk\nindices: word=5-8 host=9-16\n" },
            { stdin: "new x\nlast x\ncheck x\n", expected: "new x: instances=1\nx: last=null\nisCounter(x)=true isCounter(plain)=false hasOwn(name)=true hasOwn(value)=false\nindices: word=5-8 host=9-16\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`config.port ??= 3000` when `config.port` is `0`…",
          options: ["Sets it to 3000", "Leaves it `0` — `??=` assigns only for `null`/`undefined`; `||=` would overwrite the falsy 0", "Throws", "Sets it to `NaN`"],
          answer: 1,
          explanation: "The nullish family means \"missing\", the logical-or family means \"falsy\".",
        },
        {
          prompt: "`a?.b.c` when `a` is `undefined`…",
          options: ["Throws on `.c`", "Evaluates to `undefined` — the whole chain short-circuits at the first nullish link", "Returns `null`", "Is a syntax error"],
          answer: 1,
          explanation: "`(a?.b).c` would throw — the parentheses end the chain.",
        },
        {
          prompt: "`10n + 1`…",
          options: ["Is `11n`", "Throws a `TypeError` — BigInt and Number never mix implicitly; convert with `BigInt(1)` or `Number(10n)`", "Is `11`", "Is `\"101\"`"],
          answer: 1,
          explanation: "`JSON.stringify` also refuses BigInt.",
        },
        {
          prompt: "Which cannot be polyfilled?",
          options: ["`Array.prototype.at`", "Optional chaining `?.` — it is syntax; a runtime without it fails to parse the file, so it must be transpiled", "`Object.hasOwn`", "`Promise.any`"],
          answer: 1,
          explanation: "Built-ins can be detected and filled; syntax needs a transpiler.",
        },
        {
          prompt: "`#count in obj`…",
          options: ["Checks a public property", "Tests whether `obj` carries this class's private field — a brand check that cannot be faked with a plain object", "Throws for non-instances", "Is a syntax error"],
          answer: 1,
          explanation: "Available since Node 16.4.",
        },
      ],
    },
    {
      slug: "es2023-onward-and-the-proposal-process",
      file: "02-es2023-onward-and-the-proposal-process.md",
      exercises: [
        {
          title: "Polyfill the change-array-by-copy methods",
          prompt: `Node 16 lacks the ES2023 array methods. Using the starter's guarded \`define(name, fn)\` (non-enumerable, only when missing), implement \`toSorted(cmp)\`, \`toReversed()\`, \`with(index, value)\` (negative indices allowed; out of range throws a \`RangeError\`), \`toSpliced(start, deleteCount, ...items)\`, \`findLast(pred)\` and \`findLastIndex(pred)\` on \`Array.prototype\`. For the input array print \`toSorted=<numeric asc> toReversed=<>\`; \`with(0, 99)=<> with(-1, 0)=<>\`; \`with(99)=<error constructor name> toSpliced(1, 2, 7)=<>\`; \`findLast(even)=<> findLastIndex(even)=<>\`; and \`original unchanged=<bool> forInKeys=<indices seen by for…in> enumerable(toSorted)=<descriptor flag>\`.

Example: \`[5, 3, 8, 1, 4]\` →
\`\`\`
toSorted=[1,3,4,5,8] toReversed=[4,1,8,3,5]
with(0, 99)=[99,3,8,1,4] with(-1, 0)=[5,3,8,1,0]
with(99)=RangeError toSpliced(1, 2, 7)=[5,7,1,4]
findLast(even)=4 findLastIndex(even)=4
original unchanged=true forInKeys=0,1,2,3,4 enumerable(toSorted)=false
\`\`\`
An enumerable polyfill would have made \`for…in\` over every array yield \`toSorted\`.`,
          starterFile: "code/polyfill-array-methods.starter.js",
          solutionFile: "code/polyfill-array-methods.solution.js",
          hints: ["Each copying method is: copy with [...this], apply the mutating twin, return the copy.", "with(): normalise a negative index by adding length, then range-check before copying."],
          cases: [
            { stdin: "[5, 3, 8, 1, 4]", expected: "toSorted=[1,3,4,5,8] toReversed=[4,1,8,3,5]\nwith(0, 99)=[99,3,8,1,4] with(-1, 0)=[5,3,8,1,0]\nwith(99)=RangeError toSpliced(1, 2, 7)=[5,7,1,4]\nfindLast(even)=4 findLastIndex(even)=4\noriginal unchanged=true forInKeys=0,1,2,3,4 enumerable(toSorted)=false\n" },
            { stdin: "[2]", expected: "toSorted=[2] toReversed=[2]\nwith(0, 99)=[99] with(-1, 0)=[0]\nwith(99)=RangeError toSpliced(1, 2, 7)=[2,7]\nfindLast(even)=2 findLastIndex(even)=0\noriginal unchanged=true forInKeys=0 enumerable(toSorted)=false\n", hidden: true },
          ],
        },
        {
          title: "Polyfill groupBy, withResolvers and fromAsync",
          prompt: `Add guarded polyfills (\`if (!X) X = …\`) for \`Object.groupBy(items, keyFn)\` (a **null-prototype** object of arrays), \`Map.groupBy\` (a Map — any key type), \`Promise.withResolvers()\` (\`{ promise, resolve, reject }\`) and \`Array.fromAsync(asyncIterable, mapFn)\`. Over the input people (\`name city age\`) print \`Object.groupBy: <city=names… sorted> nullProto=<Object.getPrototypeOf(groups) === null> inheritsToString=<"toString" in groups>\`; \`Map.groupBy: adults=<names|-> minors=<names|-> keysAreBooleans=<bool>\` grouping by \`age >= 18\`; \`withResolvers: <a value resolved from a setTimeout>\`; \`fromAsync: <ages doubled via an async generator>\`.

Example: \`ada london 36\`, \`bob paris 17\`, \`cy london 22\`, \`dee rome 41\` →
\`\`\`
Object.groupBy: london=ada,cy paris=bob rome=dee nullProto=true inheritsToString=false
Map.groupBy: adults=ada,cy,dee minors=bob keysAreBooleans=true
withResolvers: settled from a timer
fromAsync: [72,34,44,82]
\`\`\``,
          starterFile: "code/polyfill-groupby-withresolvers.starter.js",
          solutionFile: "code/polyfill-groupby-withresolvers.solution.js",
          hints: ["Object.create(null) for the groups object — the standard returns a prototype-less object so keys like \"constructor\" are safe.", "withResolvers captures resolve/reject from the executor and returns them alongside the promise."],
          cases: [
            { stdin: "ada london 36\nbob paris 17\ncy london 22\ndee rome 41\n", expected: "Object.groupBy: london=ada,cy paris=bob rome=dee nullProto=true inheritsToString=false\nMap.groupBy: adults=ada,cy,dee minors=bob keysAreBooleans=true\nwithResolvers: settled from a timer\nfromAsync: [72,34,44,82]\n" },
            { stdin: "zed oslo 12\n", expected: "Object.groupBy: oslo=zed nullProto=true inheritsToString=false\nMap.groupBy: adults=- minors=zed keysAreBooleans=true\nwithResolvers: settled from a timer\nfromAsync: [24]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`arr.toSorted(cmp)` differs from `arr.sort(cmp)` in that it…",
          options: ["Sorts descending", "Returns a sorted copy and leaves `arr` untouched", "Is faster", "Accepts no comparator"],
          answer: 1,
          explanation: "`toReversed`, `toSpliced` and `with` are the other copying twins (ES2023).",
        },
        {
          prompt: "`Object.groupBy(items, fn)` returns…",
          options: ["A `Map`", "A null-prototype object whose values are arrays — `Map.groupBy` returns a Map for non-string keys", "An array of pairs", "An iterator"],
          answer: 1,
          explanation: "Both landed in ES2024.",
        },
        {
          prompt: "A proposal at TC39 stage 3 is…",
          options: ["Finished and in the spec", "A candidate: design stable, implementations underway, tests pending — usable with a transpiler if a late change is acceptable", "Just an idea", "Withdrawn"],
          answer: 1,
          explanation: "Stage 4 goes into the next yearly edition; stages 0–2 are reading material.",
        },
        {
          prompt: "`Promise.withResolvers()` gives you…",
          options: ["A resolved promise", "`{ promise, resolve, reject }` — the deferred pattern without capturing the executor's callbacks by hand", "A cancellable promise", "An async iterator"],
          answer: 1,
          explanation: "Handy for bridging events and queues to promises.",
        },
        {
          prompt: "A prototype polyfill should be defined…",
          options: ["With plain assignment", "Guarded (`if (!Array.prototype.x)`), non-enumerable via `Object.defineProperty`, and matching the spec's edge cases", "Always, overriding the native", "As an enumerable property"],
          answer: 1,
          explanation: "Non-standard polyfills are why `flatten` had to become `flat`.",
        },
      ],
    },
    {
      slug: "bundlers-transpilers-and-the-build",
      file: "03-bundlers-transpilers-and-the-build.md",
      exercises: [
        {
          title: "Tree-shake a module graph",
          prompt: `The input JSON is \`{ entry, modules }\` where each module has \`exports\` (names), \`imports\` (\`{ dependency: [names] }\`) and optionally \`sideEffects: true\`. Walk the graph from the entry: a module is **reachable** if imported (even with an empty name list); an export is **used** if some reachable module imports it (every export of the entry counts as used). Print \`kept: <module[usedExports,…] …>\` (alphabetical; \`-\` when nothing is used), \`dropped exports: <module:export …>\`, \`dropped modules: <unreachable, or reachable with no used exports and no side effects>\`, and \`kept for side effects: <reachable modules with no used exports but sideEffects: true>\`.

Example: an \`app\` importing \`slugify\` from \`utils\`, \`log\` from \`logger\` and nothing from \`analytics\` (a side-effect module), with unreachable \`legacy\` and \`theme\` →
\`\`\`
kept: analytics[-] app[main] logger[log] utils[slugify]
dropped exports: analytics:track logger:warn utils:debounce utils:throttle
dropped modules: legacy theme
kept for side effects: analytics
\`\`\``,
          starterFile: "code/tree-shake.starter.js",
          solutionFile: "code/tree-shake.solution.js",
          hints: ["A depth-first visit collects reachability and, per dependency, the union of imported names.", "A reachable module with zero used exports is dropped unless it declares side effects — the sideEffects flag is exactly this decision."],
          cases: [
            { stdin: "{\"entry\":\"app\",\"modules\":{\"app\":{\"exports\":[\"main\"],\"imports\":{\"utils\":[\"slugify\"],\"analytics\":[],\"logger\":[\"log\"]}},\"utils\":{\"exports\":[\"slugify\",\"debounce\",\"throttle\"],\"imports\":{\"logger\":[\"log\"]}},\"logger\":{\"exports\":[\"log\",\"warn\"],\"imports\":{}},\"analytics\":{\"exports\":[\"track\"],\"imports\":{},\"sideEffects\":true},\"legacy\":{\"exports\":[\"old\"],\"imports\":{\"utils\":[\"throttle\"]}},\"theme\":{\"exports\":[],\"imports\":{}}}}", expected: "kept: analytics[-] app[main] logger[log] utils[slugify]\ndropped exports: analytics:track logger:warn utils:debounce utils:throttle\ndropped modules: legacy theme\nkept for side effects: analytics\n" },
            { stdin: "{\"entry\":\"index\",\"modules\":{\"index\":{\"exports\":[],\"imports\":{\"a\":[\"x\"]}},\"a\":{\"exports\":[\"x\",\"y\"],\"imports\":{}},\"b\":{\"exports\":[\"z\"],\"imports\":{},\"sideEffects\":false}}}", expected: "kept: a[x] index[-]\ndropped exports: a:y\ndropped modules: b\nkept for side effects: -\n", hidden: true },
          ],
        },
        {
          title: "Plan the chunks",
          prompt: `The input JSON is \`{ routes: { name: [modules] }, sizes: { module: kB }, vendor: [modules] }\`. Build chunks: \`vendor\` (vendor modules used by any route), \`shared\` (non-vendor modules used by two or more routes), and one \`route:<name>\` chunk per route holding its remaining modules; modules used by no route are not shipped. Print each chunk as \`<name>: [<modules sorted>] <size> kB\` (vendor, shared, then routes in input order), then \`total shipped=<sum> kB (naive per-route copies would be <sum over routes of their full module lists> kB)\`, then \`initial load <route>: <vendor + shared + route chunk> kB\` per route.

Example (three routes sharing react/router/charts as vendor and shared-ui):
\`\`\`
vendor: [charts, react, router] 250 kB
shared: [shared-ui] 40 kB
route:home: [hero] 10 kB
route:shop: [cart] 22 kB
route:admin: [admin-table] 30 kB
total shipped=352 kB (naive per-route copies would be 797 kB)
initial load home: 300 kB
\`\`\``,
          starterFile: "code/chunk-planner.starter.js",
          solutionFile: "code/chunk-planner.solution.js",
          hints: ["Count usage per module across routes first; vendor and shared are decided from that count and the vendor list.", "A route chunk keeps only modules that are neither vendor nor shared."],
          cases: [
            { stdin: "{\"routes\":{\"home\":[\"react\",\"router\",\"hero\",\"shared-ui\"],\"shop\":[\"react\",\"router\",\"cart\",\"shared-ui\",\"charts\"],\"admin\":[\"react\",\"router\",\"charts\",\"admin-table\"]},\"sizes\":{\"react\":130,\"router\":25,\"hero\":10,\"shared-ui\":40,\"cart\":22,\"charts\":95,\"admin-table\":30,\"unused-legacy\":50},\"vendor\":[\"react\",\"router\",\"charts\"]}", expected: "vendor: [charts, react, router] 250 kB\nshared: [shared-ui] 40 kB\nroute:home: [hero] 10 kB\nroute:shop: [cart] 22 kB\nroute:admin: [admin-table] 30 kB\ntotal shipped=352 kB (naive per-route copies would be 797 kB)\ninitial load home: 300 kB\ninitial load shop: 312 kB\ninitial load admin: 320 kB\n" },
            { stdin: "{\"routes\":{\"only\":[\"app\"]},\"sizes\":{\"app\":12},\"vendor\":[]}", expected: "vendor: [] 0 kB\nshared: [] 0 kB\nroute:only: [app] 12 kB\ntotal shipped=12 kB (naive per-route copies would be 12 kB)\ninitial load only: 12 kB\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Tree-shaking works well with ESM and poorly with CommonJS because…",
          options: ["CommonJS is older", "ESM imports/exports are static and analysable; `require` is a runtime call whose usage cannot be known before execution", "CommonJS has no exports", "Bundlers ignore CommonJS"],
          answer: 1,
          explanation: "`import _ from \"lodash\"` (CJS) ships everything; `import { debounce } from \"lodash-es\"` ships one function.",
        },
        {
          prompt: "`\"sideEffects\": false` in a library's package.json tells bundlers…",
          options: ["The library has no bugs", "Every module is pure, so an unused import can be dropped entirely — wrong if a module registers a polyfill or imports CSS", "To skip minification", "To inline the library"],
          answer: 1,
          explanation: "List the impure files instead when some exist.",
        },
        {
          prompt: "Dynamic `import()` in a route component causes the bundler to…",
          options: ["Inline the module", "Emit a separate chunk loaded on demand — route-level code splitting", "Fail", "Duplicate the module"],
          answer: 1,
          explanation: "Shared modules between chunks are hoisted into a common chunk.",
        },
        {
          prompt: "Setting the transpile `target` to ES5 for an audience on current browsers…",
          options: ["Is safest and free", "Produces bigger, slower output (async/await into state machines, classes into functions) for no benefit — target the oldest runtime you actually support", "Is required by Vite", "Improves tree-shaking"],
          answer: 1,
          explanation: "Polyfills are separate from syntax: inject only what the targets lack.",
        },
        {
          prompt: "Source maps…",
          options: ["Reduce bundle size", "Map minified output positions back to source files and lines so production stack traces and breakpoints are readable", "Are only for CSS", "Replace tests"],
          answer: 1,
          explanation: "Emit always; upload to the error tracker; serving publicly is a policy choice.",
        },
      ],
    },
    {
      slug: "linting-formatting-and-testing",
      file: "04-linting-formatting-and-testing.md",
      exercises: [
        {
          title: "A miniature linter with --fix",
          prompt: `Line 1 is the mode (\`check\` or \`fix\`); the rest is code. Implement six rules as regex checks per line: \`no-var\` (\`var\` → fixable to \`let\`), \`eqeqeq\` (\`==\`/\`!=\` that are not part of \`===\`/\`!==\` → fixable by adding \`=\`), \`no-console\` (any \`console.x\` except \`console.error\`), \`no-debugger\` (fixable by removing the statement), \`max-len\` (over 80 characters), \`no-trailing-spaces\` (fixable). In \`check\` mode print \`<line>:<col> <rule> <message>\` per finding (with \` (fixable)\` where a fix exists) then \`<n> problem(s), <m> fixable with --fix\`; in \`fix\` mode apply every fix, print the fixed code, then \`--- <n> problem(s) remain: <rules>\` (or \`--- 0 problem(s) remain\`).

Example (\`check\`):
\`\`\`
1:1 no-var Unexpected var, use let or const instead (fixable)
1:15 no-trailing-spaces Trailing spaces not allowed (fixable)
2:7 eqeqeq Expected === or !== instead of == or != (fixable)
2:13 no-console Unexpected console statement
4:1 no-debugger Unexpected debugger statement (fixable)
5:1 max-len Line exceeds the maximum length of 80
7 problem(s), 5 fixable with --fix
\`\`\`
(This linter matches inside strings too — a real one works on the syntax tree, which is why ESLint parses.)`,
          starterFile: "code/mini-linter.starter.js",
          solutionFile: "code/mini-linter.solution.js",
          hints: ["eqeqeq: /(?<![=!<>])(==|!=)(?!=)/ — lookarounds keep === and !== out.", "Column is the regex match index + 1; run the rules in the listed order per line."],
          cases: [
            { stdin: "check\nvar total = 0;   \nif (a == b) console.log(total);\nconst ok = x === y && p != q;\ndebugger;\nconst reallyLongVariableName = someFunction(argumentNumberOne, argumentNumberTwo, three);\nconsole.error(\"fine\");\n", expected: "1:1 no-var Unexpected var, use let or const instead (fixable)\n1:15 no-trailing-spaces Trailing spaces not allowed (fixable)\n2:7 eqeqeq Expected === or !== instead of == or != (fixable)\n2:13 no-console Unexpected console statement\n3:25 eqeqeq Expected === or !== instead of == or != (fixable)\n4:1 no-debugger Unexpected debugger statement (fixable)\n5:1 max-len Line exceeds the maximum length of 80\n7 problem(s), 5 fixable with --fix\n" },
            { stdin: "fix\nvar total = 0;   \nif (a == b) console.log(total);\ndebugger;\n", expected: "let total = 0;\nif (a === b) console.log(total);\n\n--- 1 problem(s) remain: no-console\n", hidden: true },
          ],
        },
        {
          title: "A test runner that speaks TAP",
          prompt: `The starter defines \`sum\`, \`slug\` and \`parsePort\` plus a \`broken\` set (from line 1, comma-separated) that sabotages the named functions. Write \`describe\`/\`test\` collectors and six tests (two per function, using \`node:assert/strict\`: \`sum(2,3)=5\`, commutativity, slugify \`"Hello, World!"\` → \`hello-world\`, collapsing separators, \`parsePort("8080")=8080\`, \`parsePort("70000")\` throws a \`RangeError\`). Run them and print TAP: \`TAP version 13\`, then per test \`ok <n> - <describe> > <name>\` or \`not ok <n> - …\` followed by a diagnostic block \`  ---\`, \`  error: <name>\`, \`  actual: <JSON>\` / \`  expected: <JSON, or a function's name>\` when present, \`  ...\`; then \`1..<n>\`, \`# tests <n>\`, \`# pass <n>\`, \`# fail <n>\`.

Example with \`sum,parse\` broken (excerpt):
\`\`\`
TAP version 13
not ok 1 - sum > adds two numbers
  ---
  error: AssertionError
  actual: -1
  expected: 5
  ...
ok 3 - slug > lower-cases and joins with dashes
not ok 6 - parsePort > rejects 70000
  ---
  error: AssertionError
  expected: RangeError
  ...
1..6
# tests 6
# pass 3
# fail 3
\`\`\``,
          starterFile: "code/tap-runner.starter.js",
          solutionFile: "code/tap-runner.solution.js",
          hints: ["describe pushes its name on a stack so test names read `suite > case`; tests are collected first and run afterwards.", "An AssertionError exposes actual and expected; assert.throws sets expected to the constructor, so print a function by its name."],
          cases: [
            { stdin: "\n", expected: "TAP version 13\nok 1 - sum > adds two numbers\nok 2 - sum > is commutative\nok 3 - slug > lower-cases and joins with dashes\nok 4 - slug > collapses separators\nok 5 - parsePort > accepts 8080\nok 6 - parsePort > rejects 70000\n1..6\n# tests 6\n# pass 6\n# fail 0\n" },
            { stdin: "sum,parse\n", expected: "TAP version 13\nnot ok 1 - sum > adds two numbers\n  ---\n  error: AssertionError\n  actual: -1\n  expected: 5\n  ...\nnot ok 2 - sum > is commutative\n  ---\n  error: AssertionError\n  actual: -8\n  expected: 8\n  ...\nok 3 - slug > lower-cases and joins with dashes\nok 4 - slug > collapses separators\nok 5 - parsePort > accepts 8080\nnot ok 6 - parsePort > rejects 70000\n  ---\n  error: AssertionError\n  expected: RangeError\n  ...\n1..6\n# tests 6\n# pass 3\n# fail 3\n" },
            { stdin: "slug\n", expected: "TAP version 13\nok 1 - sum > adds two numbers\nok 2 - sum > is commutative\nnot ok 3 - slug > lower-cases and joins with dashes\n  ---\n  error: AssertionError\n  actual: \"hello, world!\"\n  expected: \"hello-world\"\n  ...\nnot ok 4 - slug > collapses separators\n  ---\n  error: AssertionError\n  actual: \"a  --  b\"\n  expected: \"a-b\"\n  ...\nok 5 - parsePort > accepts 8080\nok 6 - parsePort > rejects 70000\n1..6\n# tests 6\n# pass 4\n# fail 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Linter versus formatter:",
          options: ["Synonyms", "A linter finds likely bugs and enforces rules on the syntax tree; a formatter canonicalises layout only — run both and disable ESLint's formatting rules", "A formatter finds bugs", "Only one is needed"],
          answer: 1,
          explanation: "`eslint-config-prettier` stops the two from fighting.",
        },
        {
          prompt: "A good unit test…",
          options: ["Covers many behaviours at once", "Checks one behaviour through the public interface with arrange/act/assert, is deterministic and independent, and has a name that reads as a sentence", "Mocks every dependency", "Uses real time and network"],
          answer: 1,
          explanation: "Tests coupled to private structure break on every refactor and catch nothing.",
        },
        {
          prompt: "Prefer dependency injection to mocking frameworks because…",
          options: ["Mocking is deprecated", "Passing `now`, `fetch` or `random` as parameters makes most tests need no mocks at all — mock only at I/O boundaries", "It is faster", "Frameworks cannot mock time"],
          answer: 1,
          explanation: "Over-mocked tests pass while the real system fails.",
        },
        {
          prompt: "TAP output `not ok 3 - name` followed by an indented `---`/`...` block is…",
          options: ["An error in the runner", "A failed test with its YAML diagnostic (error, actual, expected) — the common format `node --test` prints", "A skipped test", "A comment"],
          answer: 1,
          explanation: "`1..N` is the plan; `# pass`/`# fail` the summary.",
        },
        {
          prompt: "The pre-commit hook fails on a lint error. You should…",
          options: ["Commit with `--no-verify`", "Fix the finding — the hook is the convenience gate, CI is the real one, and bypassing either ships the problem", "Disable the rule", "Delete the hook"],
          answer: 1,
          explanation: "This repository's hooks must reach zero errors.",
        },
      ],
    },
    {
      slug: "runtimes-and-the-ecosystem",
      file: "05-runtimes-and-the-ecosystem.md",
      exercises: [
        {
          title: "Detect features, do not sniff versions",
          prompt: `Build a table of feature checks: **syntax** features detected by compiling a snippet with \`new Function(source)\` in \`try\`/\`catch\` (\`optional-chaining\`, \`nullish-assignment\`, \`class-static-blocks\`, \`private-in\`, \`numeric-separators\`, \`using-declarations\`, \`regex-v-flag\` via \`new RegExp("[a]", "v")\`, and \`top-level-await\` which cannot be detected from CommonJS — report it missing), and **built-ins** detected with \`typeof\` (\`Array.prototype.at\`, \`Object.hasOwn\`, \`String.prototype.replaceAll\`, \`Promise.any\`, \`AggregateError\`, \`WeakRef\`, \`Intl.Segmenter\`, \`structuredClone\`, \`fetch\`, \`Array.prototype.findLast\`, \`Array.prototype.toSorted\`, \`Object.groupBy\`, \`Promise.withResolvers\`, \`AbortSignal.timeout\`). For each requested name print \`<name>: native\`, \`<name>: missing -> transpile\` (syntax) or \`<name>: missing -> polyfill\` (built-in), or \`<name>: unknown feature\`. The judge runs Node 16.17, so the expected output is that runtime's honest answer.

Example (excerpt, on Node 16):
\`\`\`
optional-chaining: native
using-declarations: missing -> transpile
Array.prototype.at: native
structuredClone: missing -> polyfill
fetch: missing -> polyfill
\`\`\``,
          starterFile: "code/feature-detect.starter.js",
          solutionFile: "code/feature-detect.solution.js",
          hints: ["const syntax = (src) => () => { try { new Function(src); return true; } catch { return false; } }; — parsing without running.", "Built-ins: typeof globalThis.structuredClone === \"function\" — never compare process.version."],
          cases: [
            { stdin: "optional-chaining\nnullish-assignment\nclass-static-blocks\nprivate-in\nnumeric-separators\nusing-declarations\nregex-v-flag\nArray.prototype.at\nObject.hasOwn\nString.prototype.replaceAll\nPromise.any\nAggregateError\nWeakRef\nIntl.Segmenter\nstructuredClone\nfetch\nArray.prototype.findLast\nArray.prototype.toSorted\nObject.groupBy\nPromise.withResolvers\nAbortSignal.timeout\ntop-level-await\nteleportation\n", expected: "optional-chaining: native\nnullish-assignment: native\nclass-static-blocks: native\nprivate-in: native\nnumeric-separators: native\nusing-declarations: missing -> transpile\nregex-v-flag: missing -> transpile\nArray.prototype.at: native\nObject.hasOwn: native\nString.prototype.replaceAll: native\nPromise.any: native\nAggregateError: native\nWeakRef: native\nIntl.Segmenter: native\nstructuredClone: missing -> polyfill\nfetch: missing -> polyfill\nArray.prototype.findLast: missing -> polyfill\nArray.prototype.toSorted: missing -> polyfill\nObject.groupBy: missing -> polyfill\nPromise.withResolvers: missing -> polyfill\nAbortSignal.timeout: native\ntop-level-await: missing -> transpile\nteleportation: unknown feature\n" },
          ],
        },
        {
          title: "Resolve bare specifiers with an import map",
          prompt: `Line 1 is an import map \`{ imports, scopes }\`; each following line is \`<specifier> <referrer URL>\`. Resolve like a browser: relative (\`./\`, \`../\`, \`/\`) and absolute specifiers resolve against the referrer with \`new URL\`; a bare specifier is looked up first in every **scope** whose key is a prefix of the referrer's path (most specific first, reported as \`<url> (scope <key>)\`), then in \`imports\` — an exact key wins, otherwise the longest key ending in \`/\` that prefixes the specifier maps the remainder; nothing found → \`TypeError: Failed to resolve module specifier "<s>": bare specifiers need an import map entry\`. Print \`<specifier> from <referrer> -> <result>\`.

Example (excerpt):
\`\`\`
lodash/debounce from https://site.example/src/main.js -> https://cdn.example/lodash-es/4.17.21/debounce
app/util/slug.js from https://site.example/src/main.js -> /src/util/slug.js
../shared/x.js from https://site.example/src/pages/home.js -> https://site.example/src/shared/x.js
react from https://site.example/src/main.js -> TypeError: Failed to resolve module specifier "react": bare specifiers need an import map entry
\`\`\``,
          starterFile: "code/import-map-resolver.starter.js",
          solutionFile: "code/import-map-resolver.solution.js",
          hints: ["A lookup(table, specifier) helper handles exact keys then trailing-slash prefixes; use it for scopes and for imports.", "Scope keys in this exercise are path prefixes: compare against the referrer as given."],
          cases: [
            { stdin: "{\"imports\":{\"lodash\":\"https://cdn.example/lodash-es/4.17.21/lodash.js\",\"lodash/\":\"https://cdn.example/lodash-es/4.17.21/\",\"app/\":\"/src/\"},\"scopes\":{\"/vendor/legacy/\":{\"lodash\":\"https://cdn.example/lodash/3.10.1/lodash.js\"}}}\nlodash https://site.example/src/main.js\nlodash/debounce https://site.example/src/main.js\napp/util/slug.js https://site.example/src/main.js\nlodash https://site.example/vendor/legacy/old.js\n./helpers.js https://site.example/src/pages/home.js\n../shared/x.js https://site.example/src/pages/home.js\nreact https://site.example/src/main.js\nhttps://other.example/lib.js https://site.example/src/main.js\n", expected: "lodash from https://site.example/src/main.js -> https://cdn.example/lodash-es/4.17.21/lodash.js\nlodash/debounce from https://site.example/src/main.js -> https://cdn.example/lodash-es/4.17.21/debounce\napp/util/slug.js from https://site.example/src/main.js -> /src/util/slug.js\nlodash from https://site.example/vendor/legacy/old.js -> https://cdn.example/lodash-es/4.17.21/lodash.js\n./helpers.js from https://site.example/src/pages/home.js -> https://site.example/src/pages/helpers.js\n../shared/x.js from https://site.example/src/pages/home.js -> https://site.example/src/shared/x.js\nreact from https://site.example/src/main.js -> TypeError: Failed to resolve module specifier \"react\": bare specifiers need an import map entry\nhttps://other.example/lib.js from https://site.example/src/main.js -> https://other.example/lib.js\n" },
            { stdin: "{\"imports\":{\"a\":\"/a.js\"}}\na /x/y.js\nb /x/y.js\n", expected: "a from /x/y.js -> /a.js\nb from /x/y.js -> TypeError: Failed to resolve module specifier \"b\": bare specifiers need an import map entry\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The WinterCG common API set exists so that…",
          options: ["Browsers can run Node code", "Server and edge runtimes share the web-standard APIs (`fetch`, `URL`, streams, `crypto.subtle`, `structuredClone`) and code written to them is portable", "npm works in Deno", "TypeScript compiles faster"],
          answer: 1,
          explanation: "Frameworks that target this set run on Node, Deno, Bun and Workers unchanged.",
        },
        {
          prompt: "A Cloudflare Worker differs from a Node server in that it…",
          options: ["Has a bigger standard library", "Runs in V8 isolates with request/response handlers, millisecond cold starts, no file system and web APIs only (plus a Node-compat subset)", "Requires CommonJS", "Cannot use `fetch`"],
          answer: 1,
          explanation: "Edge code that touches `fs` or `process` fails.",
        },
        {
          prompt: "Deno's approach to permissions is…",
          options: ["Same as Node", "Secure by default — file, network and environment access need explicit `--allow-*` flags", "Prompting the user each time", "Sandboxed per module"],
          answer: 1,
          explanation: "Bun prioritises Node compatibility and speed instead.",
        },
        {
          prompt: "Feature detection over version sniffing means…",
          options: ["Checking `process.version`", "Testing for the capability itself (`typeof fetch === \"function\"`, `new Function(src)` for syntax) so polyfills and compatibility layers are honoured", "Reading the user agent", "Trusting `engines`"],
          answer: 1,
          explanation: "A polyfilled runtime passes a capability check and fails a version check.",
        },
        {
          prompt: "WebAssembly is the right tool for…",
          options: ["Every hot code path", "CPU-heavy kernels and existing native libraries (codecs, compression, SQLite) — not ordinary application code, where the boundary cost outweighs gains", "DOM manipulation", "Replacing JavaScript"],
          answer: 1,
          explanation: "JavaScript's JIT is excellent at JavaScript.",
        },
      ],
    },
    {
      slug: "modern-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A structuredClone polyfill",
          prompt: `Node 16 lacks \`structuredClone\`. Write \`structuredClonePolyfill(value)\` following the structured-clone algorithm: primitives returned as-is; functions and symbols throw an error named \`DataCloneError\`; a \`Map\` from originals to clones preserves **cycles and shared references**; \`Date\`, \`RegExp\` (source + flags), \`Map\`, \`Set\`, arrays and plain objects are cloned deeply; class instances become plain objects (prototype and methods lost). The starter builds an object with a cycle, a shared reference, a Date, a regex, a Map, a Set and a class instance, plus the JSON from line 1; print the checks: \`distinct=<> dataEqual=<> dataDistinct=<>\`, \`cycle=<clone.self === clone> sharedRefPreserved=<>\`, \`date=<> regex=<>\`, \`map=<> set=<>\`, \`pointIsPlain=<> x=<> distMethod=<typeof>\`, then \`function: DataCloneError\` and \`symbol: DataCloneError\`.

Example →
\`\`\`
distinct=true dataEqual=true dataDistinct=true
cycle=true sharedRefPreserved=true
date=true regex=true
map=true set=true
pointIsPlain=true x=3 distMethod=undefined
function: DataCloneError
symbol: DataCloneError
\`\`\``,
          starterFile: "code/structured-clone-polyfill.starter.js",
          solutionFile: "code/structured-clone-polyfill.solution.js",
          hints: ["Register the clone in the seen map before recursing into children — that is what makes cycles terminate and shared references stay shared.", "Only own enumerable string keys are copied for objects; the prototype is not."],
          cases: [
            { stdin: "{\"n\":1,\"list\":[1,2,{\"deep\":true}]}\n", expected: "distinct=true dataEqual=true dataDistinct=true\ncycle=true sharedRefPreserved=true\ndate=true regex=true\nmap=true set=true\npointIsPlain=true x=3 distMethod=undefined\nfunction: DataCloneError\nsymbol: DataCloneError\n" },
            { stdin: "[]\n", expected: "distinct=true dataEqual=true dataDistinct=true\ncycle=true sharedRefPreserved=true\ndate=true regex=true\nmap=true set=true\npointIsPlain=true x=3 distMethod=undefined\nfunction: DataCloneError\nsymbol: DataCloneError\n", hidden: true },
          ],
        },
        {
          title: "A miniature bundler",
          prompt: `Line 1 is \`entry: <file>\`; the rest are modules as blocks starting \`// file: <name>\`, containing one-line statements: \`import { a, b } from "./x.js";\`, \`export const|let|function|class <name> …\`, and ordinary lines. Build the dependency graph from the entry (post-order so dependencies come first; a circular import prints \`warning: circular import <from> -> <to>\` and is not followed), **tree-shake** exports that no module imports (the entry keeps all of its own), and emit the bundle: for each module \`// ---- <name>\` followed by its lines with the \`import\` statements removed and the \`export \` keyword stripped. End with \`// dropped: <module:export, …> | order: <a -> b -> c> | unused modules: <names or ->\`. Names are unique across modules.

Example (excerpt): an entry importing \`slugify\` and \`log\`, a utils module also exporting unused \`debounce\`/\`throttle\`, a logger with unused \`warn\`, and an unreferenced module →
\`\`\`
// ---- logger.js
const log = (m) => console.log(m);
// ---- utils.js
const slugify = (s) => s.toLowerCase().replace(/\\s+/g, "-");
// ---- main.js
const title = slugify("Hello World");
log(title);
// dropped: logger.js:warn, utils.js:debounce, utils.js:throttle | order: logger.js -> utils.js -> main.js | unused modules: unused.js
\`\`\``,
          starterFile: "code/bundler-lite.starter.js",
          solutionFile: "code/bundler-lite.solution.js",
          hints: ["Two regexes: /^import \\{([^}]*)\\} from \"\\.\\/(.+?)\";?$/ and /^export (?:const|let|function|class) (\\w+)/.", "Track a visiting set for cycle detection separately from the finished order."],
          cases: [
            { stdin: "entry: main.js\n// file: main.js\nimport { slugify } from \"./utils.js\";\nimport { log } from \"./logger.js\";\nexport const title = slugify(\"Hello World\");\nlog(title);\n\n// file: utils.js\nimport { log } from \"./logger.js\";\nexport const slugify = (s) => s.toLowerCase().replace(/\\s+/g, \"-\");\nexport const debounce = (fn) => fn;\nexport function throttle(fn) { return fn; }\n\n// file: logger.js\nexport const log = (m) => console.log(m);\nexport const warn = (m) => console.error(m);\n\n// file: unused.js\nexport const nothing = 1;\n", expected: "// ---- logger.js\nconst log = (m) => console.log(m);\n// ---- utils.js\nconst slugify = (s) => s.toLowerCase().replace(/\\s+/g, \"-\");\n// ---- main.js\nconst title = slugify(\"Hello World\");\nlog(title);\n// dropped: logger.js:warn, utils.js:debounce, utils.js:throttle | order: logger.js -> utils.js -> main.js | unused modules: unused.js\n" },
            { stdin: "entry: a.js\n// file: a.js\nimport { b } from \"./b.js\";\nexport const a = b + 1;\n// file: b.js\nimport { a } from \"./a.js\";\nexport const b = 1;\n", expected: "warning: circular import b.js -> a.js\n// ---- b.js\nconst b = 1;\n// ---- a.js\nconst a = b + 1;\n// dropped: - | order: b.js -> a.js | unused modules: -\n", hidden: true },
          ],
        },
        {
          title: "A runtime-support planner",
          prompt: `Line 1 lists targets as \`runtime version\` pairs (\`node 16.17 chrome 100 safari 15.4\`); the following lines are features. Using the starter's table of minimum versions and kinds, decide per feature: \`supported everywhere\`, \`polyfill (missing in <targets>)\` for built-ins, or \`transpile (missing in <targets>)\` for syntax; unknown names print \`unknown feature\`. Compare versions as dotted **tuples** — \`16.17\` is newer than \`16.6\`, so never compare as floats. Finish with \`transpile target: ES<year>\` (the lowest level any target supports: Node 18+/Chrome 94+/Safari 15.4+ → 2022; Node 16/Chrome 85/Safari 14.1 → 2021; Node 14/Chrome 80/Safari 13.1 → 2020; else 2019), \`polyfills: <list or none>\`, \`syntax to transpile: <list or none>\`.

Example: \`node 16.17 chrome 100 safari 15.4\` with \`optional-chaining\`, \`at\`, \`structuredClone\`, \`toSorted\`, \`using\`, \`fetch\`, \`flying-cars\` →
\`\`\`
optional-chaining: supported everywhere
at: supported everywhere
structuredClone: polyfill (missing in node 16.17)
toSorted: polyfill (missing in node 16.17, chrome 100, safari 15.4)
using: transpile (missing in node 16.17, chrome 100, safari 15.4)
fetch: polyfill (missing in node 16.17)
flying-cars: unknown feature
transpile target: ES2021
polyfills: structuredClone, toSorted, fetch
syntax to transpile: using
\`\`\``,
          starterFile: "code/support-planner.starter.js",
          solutionFile: "code/support-planner.solution.js",
          hints: ["atLeast(version, min): split both on '.', compare number by number, missing parts count as 0; Infinity means never.", "A feature's remedy comes from its kind; the ES level comes from the weakest target."],
          cases: [
            { stdin: "node 16.17 chrome 100 safari 15.4\noptional-chaining\nat\nstructuredClone\ntoSorted\nusing\nfetch\nflying-cars\n", expected: "optional-chaining: supported everywhere\nat: supported everywhere\nstructuredClone: polyfill (missing in node 16.17)\ntoSorted: polyfill (missing in node 16.17, chrome 100, safari 15.4)\nusing: transpile (missing in node 16.17, chrome 100, safari 15.4)\nfetch: polyfill (missing in node 16.17)\nflying-cars: unknown feature\ntranspile target: ES2021\npolyfills: structuredClone, toSorted, fetch\nsyntax to transpile: using\n" },
            { stdin: "node 22 chrome 120 safari 17.4\ntoSorted\ngroupBy\nusing\n", expected: "toSorted: supported everywhere\ngroupBy: supported everywhere\nusing: transpile (missing in node 22, chrome 120, safari 17.4)\ntranspile target: ES2022\npolyfills: none\nsyntax to transpile: using\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`obj.a?.b ?? \"default\"` reads as…",
          options: ["`b` or default if `a.b` is falsy", "`b` when `a` exists and `b` is not nullish; otherwise `\"default\"` — `?.` guards the path, `??` supplies the fallback", "An error when `a` is missing", "Always `\"default\"`"],
          answer: 1,
          explanation: "The two operators were designed to combine this way.",
        },
        {
          prompt: "`[1, 2, 3].with(-1, 9)` returns…",
          options: ["`[1, 2, 9]` and mutates the array", "A new array `[1, 2, 9]`; the original is unchanged", "`[9, 2, 3]`", "A `RangeError`"],
          answer: 1,
          explanation: "Out-of-range indices throw a `RangeError`.",
        },
        {
          prompt: "The `d` regex flag adds…",
          options: ["Dot-all matching", "`indices` on match results — start/end offsets for the match and each group", "Digit classes", "Deduplication"],
          answer: 1,
          explanation: "ES2022; useful for highlighting and error positions.",
        },
        {
          prompt: "A build emits `main.3f9a1c.js`. The hash exists so that…",
          options: ["Files sort nicely", "The file can be cached immutably for a year — a new build produces a new name, so no stale cache is ever served", "Bundles are smaller", "Source maps work"],
          answer: 1,
          explanation: "Vendor chunks that rarely change stay cached across deploys.",
        },
        {
          prompt: "Minification…",
          options: ["Changes program behaviour", "Shortens names, removes whitespace and dead branches (`if (false)`) — output is equivalent, unreadable without source maps", "Transpiles syntax", "Removes unused exports"],
          answer: 1,
          explanation: "Tree-shaking removes unused exports; minification shrinks what remains.",
        },
        {
          prompt: "ESLint's flat config is…",
          options: ["A single object", "An array of config objects in `eslint.config.js`, later entries overriding earlier ones for the files they match", "A YAML file", "Deprecated"],
          answer: 1,
          explanation: "Default since ESLint 9.",
        },
        {
          prompt: "Coverage at 100% proves…",
          options: ["The code is correct", "Only that every line ran during tests — code with no assertions can be fully covered; use it to find gaps, not as a score", "There are no bugs", "Tests are fast"],
          answer: 1,
          explanation: "A map, not a target.",
        },
        {
          prompt: "Node LTS releases are…",
          options: ["Every major", "The even-numbered majors (16, 18, 20, 22…), supported for about 30 months", "Odd-numbered majors", "Yearly minors"],
          answer: 1,
          explanation: "Node 16 reached end-of-life in 2023 — this plan uses it because the judge does.",
        },
        {
          prompt: "Bun's distinguishing goal is…",
          options: ["Security by default", "Drop-in Node compatibility with a very fast built-in package manager, bundler and test runner (JavaScriptCore-based)", "Running only TypeScript", "Being a browser"],
          answer: 1,
          explanation: "Deno emphasises permissions and web standards; Node is the incumbent.",
        },
        {
          prompt: "`structuredClone` differs from `JSON.parse(JSON.stringify(x))` in that it…",
          options: ["Is slower and equivalent", "Preserves Dates, Maps, Sets, RegExps, `undefined` and cycles, and throws `DataCloneError` for functions", "Keeps class prototypes", "Copies functions"],
          answer: 1,
          explanation: "Class instances still become plain objects.",
        },
        {
          prompt: "An import map lets a browser…",
          options: ["Bundle modules", "Resolve bare specifiers like `import { x } from \"lodash\"` to URLs without a bundler, with scopes for per-path overrides", "Cache modules", "Type-check"],
          answer: 1,
          explanation: "`<script type=\"importmap\">` in the page.",
        },
        {
          prompt: "Comparing `\"16.17\" < \"16.6\"` as numbers is wrong because…",
          options: ["Versions are strings", "`16.17` and `16.6` are floats, so `16.17 < 16.6` — versions are dotted integer tuples: 17 is newer than 6", "It works fine", "Node does not have minor versions"],
          answer: 1,
          explanation: "A classic bug in support tables and update checkers.",
        },
      ],
    },
  ],
});

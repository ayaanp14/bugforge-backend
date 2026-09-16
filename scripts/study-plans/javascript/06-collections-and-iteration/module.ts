import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "collections-and-iteration",
  title: "Collections and iteration",
  blurb: "Map and Set with their idioms and hand-written algebra; WeakMap, WeakSet and WeakRef; the iteration protocol behind for…of and spread; generators and lazy pipelines; symbols as unique keys and the language's hooks.",
  icon: "list",
  overview: `Arrays and objects carry most programs, but the moment a key is not a string, a value must be unique, or a sequence should be computed on demand, JavaScript has better tools — and one small protocol that ties them together. \`Map\` and \`Set\` are real keyed collections with any key type, guaranteed order and O(1) operations; \`WeakMap\` attaches data to objects without keeping them alive; and everything that can be looped with \`for…of\`, spread or destructuring follows the iteration protocol: a \`[Symbol.iterator]\` method returning an object with \`next()\`. Implement it once and every piece of iteration syntax works on your class.

The module opens with Map and Set — when they beat objects and arrays, how keys compare, the frequency-count and group-by idioms, and the set algebra you must write yourself on Node 16. Weak collections follow, with the three patterns they exist for and why they cannot be iterated. The protocol lesson states the contract exactly and covers laziness and early exit; the generator lesson makes it easy — \`yield\`, \`yield*\`, sending values in, and the \`take\`/\`map\`/\`filter\` pipeline that touches only what is consumed. Symbols close the module: unique keys hidden from enumeration, the global registry, and the well-known symbols that let objects plug into \`instanceof\`, string conversion and concatenation.

The exercises count words two ways to expose the \`__proto__\` hazard, write set algebra, tag objects through a WeakMap, build a \`Range\` iterator by hand and a lazy pipeline with generators, and finish with an LRU cache on Map order, a graph explorer with a breadth-first generator, and an iterator toolkit.`,
  lessons: [
    {
      slug: "map-and-set",
      file: "01-map-and-set.md",
      exercises: [
        {
          title: "Word frequencies, two ways",
          prompt: `Count the words on the input line with a \`Map\` and — for comparison — with a plain object dictionary (\`dict[w] = (dict[w] ?? 0) + 1\`). Print \`top=<the three most frequent as word=count, by count descending then word ascending>\`, then \`unique=<map.size> total=<word count>\`, then \`objectKeys=<Object.keys(dict).length> mapHasProto=<map.has("__proto__")> objectHasOwnProto=<Object.hasOwn(dict, "__proto__")>\`.

Example: \`the cat and the dog and the bird\` →
\`\`\`
top=the=3 and=2 bird=1
unique=5 total=8
objectKeys=5 mapHasProto=false objectHasOwnProto=false
\`\`\`
With \`__proto__ x __proto__ y\` the Map reports 3 unique words and the object only 2 keys — the string \`__proto__\` is never an ordinary key on a plain object.`,
          starterFile: "code/word-frequency.starter.js",
          solutionFile: "code/word-frequency.solution.js",
          hints: ["counts.set(w, (counts.get(w) ?? 0) + 1) is the frequency idiom.", "[...counts].sort(([wa, a], [wb, b]) => b - a || wa.localeCompare(wb)).slice(0, 3) orders the entries."],
          cases: [
            { stdin: "the cat and the dog and the bird", expected: "top=the=3 and=2 bird=1\nunique=5 total=8\nobjectKeys=5 mapHasProto=false objectHasOwnProto=false\n" },
            { stdin: "__proto__ x __proto__ y", expected: "top=__proto__=2 x=1 y=1\nunique=3 total=4\nobjectKeys=2 mapHasProto=true objectHasOwnProto=false\n", hidden: true },
            { stdin: "one", expected: "top=one=1\nunique=1 total=1\nobjectKeys=1 mapHasProto=false objectHasOwnProto=false\n", hidden: true },
          ],
        },
        {
          title: "Set algebra by hand",
          prompt: `Two lines of numbers (the token \`NaN\` becomes \`NaN\`) form sets \`a\` and \`b\`. Using only \`Set\` operations and \`has\`, compute the union, intersection, difference \`a − b\`, symmetric difference and whether \`a\` is a subset of \`b\`. The starter's \`show\` prints a set sorted numerically with \`NaN\` last. Print \`a=<> b=<>\`, then one line each for \`union\`, \`intersection\`, \`difference\`, \`symmetric\`, then \`subset=<bool> sizes=<a.size>,<b.size>\`.

Example: \`1 2 3 4 NaN\` / \`3 4 5 NaN NaN\` →
\`\`\`
a=[1,2,3,4,"NaN"] b=[3,4,5,"NaN"]
union=[1,2,3,4,5,"NaN"]
intersection=[3,4,"NaN"]
difference=[1,2]
symmetric=[1,2,5]
subset=false sizes=5,4
\`\`\`
\`NaN\` is one member and matches itself — Set uses SameValueZero, not \`===\`.`,
          starterFile: "code/set-algebra.starter.js",
          solutionFile: "code/set-algebra.solution.js",
          hints: ["new Set([...a].filter((x) => b.has(x))) is the intersection; negate for the difference.", "Subset: [...a].every((x) => b.has(x))."],
          cases: [
            { stdin: "1 2 3 4 NaN\n3 4 5 NaN NaN", expected: "a=[1,2,3,4,\"NaN\"] b=[3,4,5,\"NaN\"]\nunion=[1,2,3,4,5,\"NaN\"]\nintersection=[3,4,\"NaN\"]\ndifference=[1,2]\nsymmetric=[1,2,5]\nsubset=false sizes=5,4\n" },
            { stdin: "1 2\n1 2 3", expected: "a=[1,2] b=[1,2,3]\nunion=[1,2,3]\nintersection=[1,2]\ndifference=[]\nsymmetric=[3]\nsubset=true sizes=2,3\n" },
            { stdin: "7\n8", expected: "a=[7] b=[8]\nunion=[7,8]\nintersection=[]\ndifference=[7]\nsymmetric=[7,8]\nsubset=false sizes=1,1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const m = new Map(); m.set({ id: 1 }, \"a\"); m.get({ id: 1 })` is…",
          options: ["`\"a\"`", "`undefined` — object keys compare by identity, and this is a different object", "`null`", "A `TypeError`"],
          answer: 1,
          explanation: "Keep the reference you used as the key, or key by a primitive id.",
        },
        {
          prompt: "How many entries does `new Set([NaN, NaN, 0, -0])` have?",
          options: ["4", "2 — SameValueZero treats `NaN` as equal to `NaN` and `0` equal to `-0`", "3", "1"],
          answer: 1,
          explanation: "Unlike `===`, where `NaN !== NaN`.",
        },
        {
          prompt: "`map.size()`…",
          options: ["Returns the count", "Throws — `size` is a property, not a method", "Returns `undefined`", "Returns the capacity"],
          answer: 1,
          explanation: "`map.length` is `undefined` and `map[key] = v` sets a property on the Map object, not an entry.",
        },
        {
          prompt: "The efficient intersection of two large arrays is…",
          options: ["`a.filter((x) => b.includes(x))`", "Put `b` in a `Set` and `a.filter((x) => setB.has(x))` — O(n) instead of O(n²)", "A nested `for` loop", "`a.concat(b)`"],
          answer: 1,
          explanation: "`includes` scans the array on every call.",
        },
        {
          prompt: "Iteration order of a `Map`:",
          options: ["Sorted by key", "Insertion order, for every key type", "Integer keys first, then strings", "Unspecified"],
          answer: 1,
          explanation: "Plain objects put integer-like keys first; Maps never reorder.",
        },
      ],
    },
    {
      slug: "weak-collections",
      file: "02-weak-collections.md",
      exercises: [
        {
          title: "Metadata without touching the object",
          prompt: `Keep objects in a strong \`Map\` registry by name and their tags in a \`WeakMap\` keyed by the object. Commands: \`make <name>\` creates \`{ name }\`; \`tag <name> <tag>\` appends to that object's tag list; \`untag <name>\` deletes the entry and prints \`untag <name> -> <bool>\`; \`info <name>\` prints \`<name>: tags=<comma list or none> keys=<Object.keys of the object>\`; \`tagprim <value> <tag>\` tries to use the number as a WeakMap key. Print \`error: <message>\` when a command throws.

Example: \`make a\`, \`tag a red\`, \`tag a big\`, \`info a\`, \`untag a\`, \`untag a\`, \`info a\`, \`tagprim 5 oops\` →
\`\`\`
a: tags=red,big keys=name
untag a -> true
untag a -> false
a: tags=none keys=name
error: Invalid value used as weak map key
\`\`\`
The object never gains a property, and a primitive can never be a weak key.`,
          starterFile: "code/weakmap-metadata.starter.js",
          solutionFile: "code/weakmap-metadata.solution.js",
          hints: ["if (!meta.has(obj)) meta.set(obj, []) before pushing.", "WeakMap#set with a number throws a TypeError; catch it and print e.message."],
          cases: [
            { stdin: "make a\nmake b\ntag a red\ntag a big\ntag b blue\ninfo a\ninfo b\nuntag a\nuntag a\ninfo a\ntagprim 5 oops\n", expected: "a: tags=red,big keys=name\nb: tags=blue keys=name\nuntag a -> true\nuntag a -> false\na: tags=none keys=name\nerror: Invalid value used as weak map key\n" },
            { stdin: "make x\ninfo x\ntagprim 1 t\n", expected: "x: tags=none keys=name\nerror: Invalid value used as weak map key\n", hidden: true },
          ],
        },
        {
          title: "Memoise by identity",
          prompt: `\`sumOfSquares(obj)\` sums the squares of \`obj.values\`; cache its result in a \`WeakMap\` keyed by the object and count real computations. Commands: \`obj <id> <numbers>\` creates \`{ id, values }\`; \`clone <id> <newId>\` makes a **new** object with the same values; \`calc <id>\` prints \`<id>: <result> (computed|cached)\`. Print \`computations=<n>\` at the end.

Example: \`obj a 1 2 3\`, \`calc a\`, \`calc a\`, \`clone a b\`, \`calc b\`, \`calc a\` →
\`\`\`
a: 14 (computed)
a: 14 (cached)
b: 14 (computed)
a: 14 (cached)
computations=2
\`\`\`
The clone has equal contents but a different identity, so it is computed again — a WeakMap keys by reference.`,
          starterFile: "code/memo-identity.starter.js",
          solutionFile: "code/memo-identity.solution.js",
          hints: ["Return { value, from } so the caller can print where it came from.", "{ ...objects.get(a), id: newId } copies the values but is a new key."],
          cases: [
            { stdin: "obj a 1 2 3\ncalc a\ncalc a\nclone a b\ncalc b\ncalc a\n", expected: "a: 14 (computed)\na: 14 (cached)\nb: 14 (computed)\na: 14 (cached)\ncomputations=2\n" },
            { stdin: "obj z 4\ncalc z\n", expected: "z: 16 (computed)\ncomputations=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why does `WeakMap` have no `size`, `keys()` or iteration?",
          options: ["An oversight", "Listing keys would make garbage collection observable; the API is deliberately `get/set/has/delete` only", "Performance", "It has them since Node 16"],
          answer: 1,
          explanation: "If you need to enumerate, you need a `Map` — and you accept that it pins its keys.",
        },
        {
          prompt: "`new WeakMap().set(\"key\", 1)`…",
          options: ["Works", "Throws a `TypeError` — keys must be objects; a primitive can never become unreachable", "Stores it weakly", "Converts the string to an object"],
          answer: 1,
          explanation: "Weak semantics only make sense for values that can be collected.",
        },
        {
          prompt: "A long-running server stores per-request data in a `Map` keyed by the request object. The consequence is…",
          options: ["Nothing — requests are small", "A memory leak: the Map keeps every request object alive forever unless entries are deleted", "A `TypeError`", "Faster lookups"],
          answer: 1,
          explanation: "A `WeakMap` releases each entry when the request object is dropped.",
        },
        {
          prompt: "`WeakRef#deref()` may return…",
          options: ["Always the object", "The object, or `undefined` once it has been collected — timing is up to the engine", "A copy", "`null`"],
          answer: 1,
          explanation: "Never depend on it for correctness; it suits droppable caches and backstop cleanup only.",
        },
        {
          prompt: "Which is **not** a good WeakMap use?",
          options: ["Metadata on DOM nodes", "Cross-module private data for class instances", "A list of all live sessions that must be enumerated for a dashboard", "Memoisation keyed by an input object"],
          answer: 2,
          explanation: "Enumeration needs a `Set`/`Map`; a WeakSet cannot be listed.",
        },
      ],
    },
    {
      slug: "the-iteration-protocol",
      file: "03-the-iteration-protocol.md",
      exercises: [
        {
          title: "A Range that speaks the protocol",
          prompt: `Give \`Range(from, to, step)\` a hand-written \`[Symbol.iterator]()\` returning an iterator object with \`next()\` (values \`from\`, \`from+step\`, … while ≤ \`to\`) and \`return()\`, which increments the global \`returnCalls\`. Each call must return a **fresh** iterator so the range can be looped repeatedly. Line 1 is \`from to step\`, line 2 a value to break at. Print \`spread=<[...r]>\`, then \`sum=<via for…of> again=<[...r] a second time>\`, then \`first=<> second=<> squares=<Array.from(r, x => x*x)>\` (destructure the first two), then run \`for…of\` breaking at the given value and print \`breakAt=<v> returnCalled=<how many times return() ran during that loop>\`.

Example: \`1 10 3\` then \`4\` →
\`\`\`
spread=[1,4,7,10]
sum=22 again=[1,4,7,10]
first=1 second=4 squares=[1,16,49,100]
breakAt=4 returnCalled=1
\`\`\``,
          starterFile: "code/range-class.starter.js",
          solutionFile: "code/range-class.solution.js",
          hints: ["Keep the cursor in a local variable inside [Symbol.iterator] so every call starts over.", "break inside for…of calls the iterator's return() exactly once."],
          cases: [
            { stdin: "1 10 3\n4\n", expected: "spread=[1,4,7,10]\nsum=22 again=[1,4,7,10]\nfirst=1 second=4 squares=[1,16,49,100]\nbreakAt=4 returnCalled=1\n" },
            { stdin: "0 4 1\n2\n", expected: "spread=[0,1,2,3,4]\nsum=10 again=[0,1,2,3,4]\nfirst=0 second=1 squares=[0,1,4,9,16]\nbreakAt=2 returnCalled=1\n", hidden: true },
            { stdin: "5 1 1\n1\n", expected: "spread=[]\nsum=0 again=[]\nfirst=undefined second=undefined squares=[]\nbreakAt=1 returnCalled=0\n", hidden: true },
          ],
        },
        {
          title: "What is iterable?",
          prompt: `Each line is a JSON value. Decide whether it is iterable (\`typeof value[Symbol.iterator] === "function"\`, guarding \`null\`). For an iterable print \`<line>: iterable items=<[...value].length> first=<JSON of the first item>\`; for a non-iterable object print \`<line>: not iterable entries=<Object.entries(value).length>\`; for anything else \`<line>: not iterable (<null or typeof>)\`.

Example:
\`\`\`
[1,2,3]
"abc"
{"a":1,"b":2}
42
null
\`\`\`
→
\`\`\`
[1,2,3]: iterable items=3 first=1
"abc": iterable items=3 first="a"
{"a":1,"b":2}: not iterable entries=2
42: not iterable (number)
null: not iterable (null)
\`\`\``,
          starterFile: "code/is-iterable.starter.js",
          solutionFile: "code/is-iterable.solution.js",
          hints: ["Strings are iterable; plain objects are not — Object.entries turns one into an iterable array of pairs.", "Check value !== null before indexing with Symbol.iterator."],
          cases: [
            { stdin: "[1,2,3]\n\"abc\"\n{\"a\":1,\"b\":2}\n42\nnull\ntrue\n[]\n", expected: "[1,2,3]: iterable items=3 first=1\n\"abc\": iterable items=3 first=\"a\"\n{\"a\":1,\"b\":2}: not iterable entries=2\n42: not iterable (number)\nnull: not iterable (null)\ntrue: not iterable (boolean)\n[]: iterable items=0 first=undefined\n" },
            { stdin: "\"x\"\n{}\n", expected: "\"x\": iterable items=1 first=\"x\"\n{}: not iterable entries=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An object is iterable when…",
          options: ["It has a `length`", "It has a `[Symbol.iterator]()` method returning an object with `next()` that yields `{ value, done }`", "It is an array", "It has a `forEach` method"],
          answer: 1,
          explanation: "That single contract powers `for…of`, spread, destructuring and `Array.from`.",
        },
        {
          prompt: "`const it = map.keys(); [...it]; [...it]` — the second spread gives…",
          options: ["The keys again", "`[]` — an iterator is single-use; the Map itself is the restartable iterable", "An error", "The values"],
          answer: 1,
          explanation: "Built-in iterators return `this` from `[Symbol.iterator]`, so they can be looped once.",
        },
        {
          prompt: "`for (const x of { a: 1 })`…",
          options: ["Iterates the values", "Throws — plain objects are not iterable; use `Object.entries`", "Iterates the keys", "Runs zero times"],
          answer: 1,
          explanation: "`for…in` walks keys; `for…of` needs the protocol.",
        },
        {
          prompt: "`break` inside `for…of` over a custom iterator…",
          options: ["Leaves the iterator hanging", "Calls the iterator's `return()` method, if any, so it can clean up", "Calls `next()` once more", "Throws"],
          answer: 1,
          explanation: "Destructuring a prefix does the same; manual `next()` callers must call `return()` themselves.",
        },
        {
          prompt: "`Array.from({ length: 3 })` works but `[...{ length: 3 }]` throws because…",
          options: ["Spread needs numbers", "`Array.from` accepts array-likes as well as iterables; spread requires an iterable", "`length` is reserved", "Spread only works on arrays"],
          answer: 1,
          explanation: "`Array.from({ length: n }, fn)` is the \"n of something\" idiom for that reason.",
        },
      ],
    },
    {
      slug: "generators",
      file: "04-generators.md",
      exercises: [
        {
          title: "A lazy pipeline that proves its laziness",
          prompt: `The starter's \`naturals()\` generator counts how many values it has produced in \`pulled\`. Write generators \`take(n, it)\` (yields at most \`n\` items and stops pulling immediately after the last), \`map(fn, it)\`, \`filter(pred, it)\`, and \`flatten(list)\` (recursive with \`yield*\`). Line 1 is \`k m\`: print \`result=<first k squares of naturals divisible by m> pulled=<how many naturals were generated>\`. Line 2 is a nested JSON array: print \`flatten=<JSON>\`. Finally drive \`take(2, naturals())\` by hand and print \`manual=<three JSON.stringify(gen.next()) results separated by spaces>\`.

Example: \`3 4\` then \`[1,[2,[3,[4]]],5]\` →
\`\`\`
result=[16,64,144] pulled=12
flatten=[1,2,3,4,5]
manual={"value":1,"done":false} {"value":2,"done":false} {"done":true}
\`\`\`
Only twelve naturals were ever produced for three results — nothing past the twelfth was touched.`,
          starterFile: "code/lazy-pipeline.starter.js",
          solutionFile: "code/lazy-pipeline.solution.js",
          hints: ["In take, yield first and then return when the counter reaches zero — otherwise one extra item is pulled from the source.", "yield* flatten(x) delegates to the recursive call; a non-array is yielded directly."],
          cases: [
            { stdin: "3 4\n[1,[2,[3,[4]]],5]\n", expected: "result=[16,64,144] pulled=12\nflatten=[1,2,3,4,5]\nmanual={\"value\":1,\"done\":false} {\"value\":2,\"done\":false} {\"done\":true}\n" },
            { stdin: "2 1\n[[],[1],[[2]]]\n", expected: "result=[1,4] pulled=2\nflatten=[1,2]\nmanual={\"value\":1,\"done\":false} {\"value\":2,\"done\":false} {\"done\":true}\n", hidden: true },
            { stdin: "0 2\n[1]\n", expected: "result=[] pulled=0\nflatten=[1]\nmanual={\"value\":1,\"done\":false} {\"value\":2,\"done\":false} {\"done\":true}\n", hidden: true },
          ],
        },
        {
          title: "Sending values in",
          prompt: `Write a generator \`stats()\` that receives numbers through \`next(x)\` and, after each, yields \`{ count, sum, min, max, avg }\`. The starter primes it with one \`next()\`. Commands: \`add <x>\` prints \`count=<> sum=<> min=<> max=<> avg=<2dp>\` from the yielded object (or \`add <x> ignored: generator finished\` if it has finished); \`done\` calls \`gen.return()\` and prints \`done=<r.done> final=<count> values, avg <2dp> afterwards=<JSON.stringify(gen.next(1))>\` (\`final=nothing\` when no values were added).

Example: \`add 10\`, \`add 20\`, \`add 3\`, \`done\` →
\`\`\`
count=1 sum=10 min=10 max=10 avg=10.00
count=2 sum=30 min=10 max=20 avg=15.00
count=3 sum=33 min=3 max=20 avg=11.00
done=true final=3 values, avg 11.00 afterwards={"done":true}
\`\`\``,
          starterFile: "code/two-way-stats.starter.js",
          solutionFile: "code/two-way-stats.solution.js",
          hints: ["let x = yield null; then loop: update, x = yield { ... } — the value of a yield expression is the argument of the next next().", "After return(), every next() gives { value: undefined, done: true }, which JSON.stringify prints as {\"done\":true}."],
          cases: [
            { stdin: "add 10\nadd 20\nadd 3\ndone\n", expected: "count=1 sum=10 min=10 max=10 avg=10.00\ncount=2 sum=30 min=10 max=20 avg=15.00\ncount=3 sum=33 min=3 max=20 avg=11.00\ndone=true final=3 values, avg 11.00 afterwards={\"done\":true}\n" },
            { stdin: "done\n", expected: "done=true final=nothing afterwards={\"done\":true}\n", hidden: true },
            { stdin: "add 5\ndone\nadd 1\n", expected: "count=1 sum=5 min=5 max=5 avg=5.00\ndone=true final=1 values, avg 5.00 afterwards={\"done\":true}\nadd 1 ignored: generator finished\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Calling a generator function `gen()`…",
          options: ["Runs its body to the end", "Runs nothing and returns a generator object; the body starts on the first `next()`", "Returns the first yielded value", "Returns an array"],
          answer: 1,
          explanation: "Generator objects are single-use iterators and iterables.",
        },
        {
          prompt: "`[...(function* () { yield 1; return 2; })()]` is…",
          options: ["`[1, 2]`", "`[1]` — the return value is the `done: true` result and is not part of the sequence", "`[2]`", "`[1, undefined]`"],
          answer: 1,
          explanation: "`yield*` and manual callers can see the return value; spread and `for…of` ignore it.",
        },
        {
          prompt: "`yield* inner`…",
          options: ["Yields the inner iterable as one value", "Yields each value of `inner` in turn and forwards `next/return/throw` to it; evaluates to `inner`'s return value", "Creates a new generator", "Is a syntax error outside classes"],
          answer: 1,
          explanation: "Recursive tree walks and `chain(...iterables)` are the typical uses.",
        },
        {
          prompt: "Why does sending values into a generator need a priming `next()`?",
          options: ["It allocates memory", "The first `next()` runs to the first `yield`; there is no paused `yield` yet to receive its argument, so that argument is dropped", "Generators start paused at `return`", "It does not — the first argument is delivered"],
          answer: 1,
          explanation: "Every later `next(v)` makes `v` the value of the `yield` expression the generator is paused on.",
        },
        {
          prompt: "A pipeline `take(3, map(f, filter(p, infinite())))` terminates because…",
          options: ["`infinite()` is not really infinite", "Each stage pulls one item at a time only when asked; `take` stops asking after three, so nothing beyond is computed", "`map` buffers everything", "JavaScript limits loops"],
          answer: 1,
          explanation: "Spreading `infinite()` directly would hang — laziness lives in the consumer's restraint.",
        },
      ],
    },
    {
      slug: "symbols",
      file: "05-symbols.md",
      exercises: [
        {
          title: "String keys and symbol keys, side by side",
          prompt: `Line 1 lists string keys (assign each its index), line 2 lists names for \`Symbol(name)\` keys (assign \`hidden-<i>\`). Build one object with both. Print \`keys=<Object.keys> json=<JSON.stringify>\`; \`symbols=<getOwnPropertySymbols count> descriptions=<their descriptions>\`; \`ownKeys=<Reflect.ownKeys length> spreadKeepsSymbols=<does { ...obj } keep them all>\`; then for the first symbol name: \`plainEqual=<Symbol(n) === Symbol(n)> forEqual=<Symbol.for(n) === Symbol.for(n)> keyFor=<Symbol.keyFor(Symbol.for(n))> keyForPlain=<Symbol.keyFor of your first plain symbol>\`; finally try to put the first symbol in a template literal and print \`template=<result or the error's constructor name> string=<String(sym)> typeof=<typeof sym>\`.

Example: \`name born\` / \`id secret\` →
\`\`\`
keys=name,born json={"name":0,"born":1}
symbols=2 descriptions=id,secret
ownKeys=4 spreadKeepsSymbols=true
plainEqual=false forEqual=true keyFor=id keyForPlain=undefined
template=TypeError string=Symbol(id) typeof=symbol
\`\`\``,
          starterFile: "code/symbol-keys.starter.js",
          solutionFile: "code/symbol-keys.solution.js",
          hints: ["obj[sym] = value — brackets; obj.sym would create a string key named \"sym\".", "Implicit string conversion of a symbol throws; String(sym) and sym.description are the explicit forms."],
          cases: [
            { stdin: "name born\nid secret\n", expected: "keys=name,born json={\"name\":0,\"born\":1}\nsymbols=2 descriptions=id,secret\nownKeys=4 spreadKeepsSymbols=true\nplainEqual=false forEqual=true keyFor=id keyForPlain=undefined\ntemplate=TypeError string=Symbol(id) typeof=symbol\n" },
            { stdin: "a\na\n", expected: "keys=a json={\"a\":0}\nsymbols=1 descriptions=a\nownKeys=2 spreadKeepsSymbols=true\nplainEqual=false forEqual=true keyFor=a keyForPlain=undefined\ntemplate=TypeError string=Symbol(a) typeof=symbol\n", hidden: true },
          ],
        },
        {
          title: "Well-known symbols in action",
          prompt: `Implement three hooks. \`Even\` gets \`static [Symbol.hasInstance](n)\` so \`4 instanceof Even\` is true for even integers. \`Version(major, minor)\` gets \`[Symbol.toPrimitive](hint)\` — \`"number"\` → \`major + minor / 100\`, otherwise \`v<major>.<minor>\` — and \`get [Symbol.toStringTag]()\` returning \`"Version"\`. Line 1 is numbers, line 2 a version like \`1.4\`. Print \`even=<comma list> odd=<comma list>\`; then \`string=<template of v> number=<+v> default=<v + ""> compare=<v > 1> tag=<Object.prototype.toString.call(v)>\`; then build \`{ length: 2, 0: "x", 1: "y", [Symbol.isConcatSpreadable]: true }\` and the same object without the symbol and print \`concatSpreadable=<JSON of [1].concat(spreadable)> concatPlain=<JSON of [1].concat(plain)>\`.

Example: \`1 2 3 4 10 7\` / \`1.4\` →
\`\`\`
even=2,4,10 odd=1,3,7
string=v1.4 number=1.04 default=v1.4 compare=true tag=[object Version]
concatSpreadable=[1,"x","y"] concatPlain=[1,{"0":"x","1":"y","length":2}]
\`\`\``,
          starterFile: "code/well-known-hooks.starter.js",
          solutionFile: "code/well-known-hooks.solution.js",
          hints: ["A static method named [Symbol.hasInstance] replaces the prototype-chain check for instanceof.", "The default hint (used by + with a string) returns the string form here; the number hint drives > and unary +."],
          cases: [
            { stdin: "1 2 3 4 10 7\n1.4\n", expected: "even=2,4,10 odd=1,3,7\nstring=v1.4 number=1.04 default=v1.4 compare=true tag=[object Version]\nconcatSpreadable=[1,\"x\",\"y\"] concatPlain=[1,{\"0\":\"x\",\"1\":\"y\",\"length\":2}]\n" },
            { stdin: "0 5\n2.0\n", expected: "even=0 odd=5\nstring=v2.0 number=2 default=v2.0 compare=true tag=[object Version]\nconcatSpreadable=[1,\"x\",\"y\"] concatPlain=[1,{\"0\":\"x\",\"1\":\"y\",\"length\":2}]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Symbol(\"id\") === Symbol(\"id\")` is…",
          options: ["`true`", "`false` — every `Symbol()` call creates a unique value; the string is only a description", "`true` in strict mode", "A `TypeError`"],
          answer: 1,
          explanation: "`Symbol.for(\"id\") === Symbol.for(\"id\")` is `true` — the global registry.",
        },
        {
          prompt: "Symbol-keyed properties are skipped by…",
          options: ["Nothing", "`Object.keys`, `for…in` and `JSON.stringify` — but found by `Object.getOwnPropertySymbols`, `Reflect.ownKeys` and copied by spread", "Spread", "`Reflect.ownKeys`"],
          answer: 1,
          explanation: "Hidden from the common paths, not private.",
        },
        {
          prompt: "`` `${Symbol(\"x\")}` ``…",
          options: ["Gives `\"Symbol(x)\"`", "Throws a `TypeError` — symbols never convert to strings implicitly; use `String(sym)` or `.description`", "Gives `\"x\"`", "Gives `\"\"`"],
          answer: 1,
          explanation: "A guard against accidentally turning a key into the text `Symbol(x)`.",
        },
        {
          prompt: "Which well-known symbol does `for…of` look up?",
          options: ["`Symbol.toPrimitive`", "`Symbol.iterator`", "`Symbol.species`", "`Symbol.hasInstance`"],
          answer: 1,
          explanation: "`for await…of` uses `Symbol.asyncIterator`.",
        },
        {
          prompt: "`Symbol.for` is the right choice when…",
          options: ["You need uniqueness above all", "Two independently loaded pieces of code must agree on the same key", "The symbol will be serialised to JSON", "You want a private field"],
          answer: 1,
          explanation: "Node's `Symbol.for(\"nodejs.util.inspect.custom\")` is the canonical example.",
        },
      ],
    },
    {
      slug: "collections-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "An LRU cache on Map order",
          prompt: `Implement \`LRUCache(capacity)\` over a private \`Map\` whose insertion order is the recency order (oldest first). \`get(key)\` returns the value (re-inserting the entry so it becomes newest) or \`-1\`; \`put(key, value)\` inserts or refreshes, then evicts the oldest entry when over capacity and returns the evicted key (else \`null\`); \`get size\`; \`entries()\` yields entries newest first. Line 1 is the capacity; then \`put k v\` (print \`evict <k>\` when something was evicted), \`get k\` (print \`get <k> -> <v|-1>\`), \`show\` (print \`[k=v, ...] size=<n>\` newest first).

Example: capacity \`2\`, then \`put a 1\`, \`put b 2\`, \`get a\`, \`put c 3\`, \`get b\`, \`show\`, \`put a 10\`, \`show\` →
\`\`\`
get a -> 1
evict b
get b -> -1
[c=3, a=1] size=2
[a=10, c=3] size=2
\`\`\``,
          starterFile: "code/lru-cache.starter.js",
          solutionFile: "code/lru-cache.solution.js",
          hints: ["Delete then set moves an entry to the end of a Map's order.", "this.#map.keys().next().value is the oldest key."],
          cases: [
            { stdin: "2\nput a 1\nput b 2\nget a\nput c 3\nget b\nshow\nput a 10\nshow\n", expected: "get a -> 1\nevict b\nget b -> -1\n[c=3, a=1] size=2\n[a=10, c=3] size=2\n" },
            { stdin: "1\nput x 1\nput y 2\nget x\nshow\n", expected: "evict x\nget x -> -1\n[y=2] size=1\n", hidden: true },
          ],
        },
        {
          title: "A graph explorer with a breadth-first generator",
          prompt: `Store an undirected graph as a \`Map\` from node to a \`Set\` of neighbours. Write a generator \`bfs(start)\` yielding \`[node, distance, parent]\` in breadth-first order, visiting neighbours in sorted order and each node once. Commands: \`edge a b\`; \`bfs a\` prints \`bfs a: <node@distance ...>\`; \`path a b\` reconstructs the shortest path from the parents (stop pulling from the generator as soon as \`b\` appears) and prints \`path a -> b: <nodes> (<n> hops)\` or \`path a -> b: none\`; \`degree a\` prints \`degree a = <neighbour count>\` (0 for an unknown node).

Example: edges \`a b\`, \`a c\`, \`b d\`, \`c d\`, \`d e\`, \`f g\`, then \`bfs a\`, \`path a e\`, \`path a g\`, \`degree d\` →
\`\`\`
bfs a: a@0 b@1 c@1 d@2 e@3
path a -> e: a b d e (3 hops)
path a -> g: none
degree d = 3
\`\`\``,
          starterFile: "code/graph-explorer.starter.js",
          solutionFile: "code/graph-explorer.solution.js",
          hints: ["A queue of [node, dist, parent] plus a Set of seen nodes; sort [...neighbours] before enqueuing.", "for (const [node, , from] of bfs(a)) { parent.set(node, from); if (node === b) break; } — break stops the search early."],
          cases: [
            { stdin: "edge a b\nedge a c\nedge b d\nedge c d\nedge d e\nedge f g\nbfs a\npath a e\npath a g\ndegree d\ndegree z\n", expected: "bfs a: a@0 b@1 c@1 d@2 e@3\npath a -> e: a b d e (3 hops)\npath a -> g: none\ndegree d = 3\ndegree z = 0\n" },
            { stdin: "edge x y\nbfs y\npath x x\n", expected: "bfs y: y@0 x@1\npath x -> x: x (0 hops)\n", hidden: true },
          ],
        },
        {
          title: "An iterator toolkit",
          prompt: `Write four generators that work on **any** iterable: \`chunk(it, size)\` (arrays of \`size\`, the last possibly shorter), \`zip(...its)\` (arrays of the i-th items, stopping at the shortest), \`enumerate(it, start = 0)\` (\`[index, item]\` pairs) and \`takeWhile(pred, it)\`. Input: line 1 numbers \`a\`, line 2 words \`b\`, line 3 a chunk size, line 4 a limit. Print \`chunks=<chunk(a, size)>\`, \`zip=<zip(a, b)>\`, \`enumerate=<enumerate(b, 1)>\`, \`takeWhile=<takeWhile(x => x < limit, a)>\` (all as JSON), then \`zipString=<zip("abc", a) as c+n pairs joined by ,>\`.

Example: \`1 2 3 4 5 6 7\` / \`red green blue\` / \`3\` / \`5\` →
\`\`\`
chunks=[[1,2,3],[4,5,6],[7]]
zip=[[1,"red"],[2,"green"],[3,"blue"]]
enumerate=[[1,"red"],[2,"green"],[3,"blue"]]
takeWhile=[1,2,3,4]
zipString=a1,b2,c3
\`\`\``,
          starterFile: "code/iter-tools.starter.js",
          solutionFile: "code/iter-tools.solution.js",
          hints: ["zip must drive the iterators by hand: its.map((it) => it[Symbol.iterator]()) then next() on each per round; return when any is done.", "chunk flushes the partial buffer after the loop."],
          cases: [
            { stdin: "1 2 3 4 5 6 7\nred green blue\n3\n5\n", expected: "chunks=[[1,2,3],[4,5,6],[7]]\nzip=[[1,\"red\"],[2,\"green\"],[3,\"blue\"]]\nenumerate=[[1,\"red\"],[2,\"green\"],[3,\"blue\"]]\ntakeWhile=[1,2,3,4]\nzipString=a1,b2,c3\n" },
            { stdin: "1 2\na b c d\n5\n1\n", expected: "chunks=[[1,2]]\nzip=[[1,\"a\"],[2,\"b\"]]\nenumerate=[[1,\"a\"],[2,\"b\"],[3,\"c\"],[4,\"d\"]]\ntakeWhile=[]\nzipString=a1,b2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`JSON.stringify(new Map([[\"a\", 1]]))` is…",
          options: ["`{\"a\":1}`", "`{}` — Maps have no enumerable own properties; convert with `Object.fromEntries` first", "`[[\"a\",1]]`", "An error"],
          answer: 1,
          explanation: "Same for `Set` — spread it into an array first.",
        },
        {
          prompt: "Deleting the current entry while iterating a `Map` with `for…of`…",
          options: ["Throws", "Is safe — Map iterators handle deletions; the array equivalent skips elements", "Restarts the loop", "Deletes the next entry too"],
          answer: 1,
          explanation: "One more reason Maps suit churn.",
        },
        {
          prompt: "`const s = new Set(); items.filter((x) => !s.has(x.id) && s.add(x.id))` deduplicates by id because…",
          options: ["`filter` removes duplicates itself", "`Set#add` returns the Set (truthy), so an unseen id passes and is recorded in one expression", "`has` adds the id", "It sorts the items"],
          answer: 1,
          explanation: "A seen id fails `!s.has`, so `add` never runs again for it.",
        },
        {
          prompt: "Which can be a `WeakSet` member?",
          options: ["A string", "A number", "An object", "A symbol created with `Symbol.for`"],
          answer: 2,
          explanation: "Weak collections hold objects only on Node 16.",
        },
        {
          prompt: "An iterator's `next()` must return…",
          options: ["The next value", "An object `{ value, done }`", "`null` at the end", "An array"],
          answer: 1,
          explanation: "`done: true` signals the end; that result's `value` is the return value.",
        },
        {
          prompt: "`const [a, b] = gen()` where `gen` yields five values…",
          options: ["Consumes all five", "Pulls two values and then calls the generator's `return()`, running its `finally` blocks", "Throws — generators cannot be destructured", "Binds arrays"],
          answer: 1,
          explanation: "Destructuring a prefix ends iteration early like `break` does.",
        },
        {
          prompt: "Inside a generator, `const x = yield 5;` — `x` is…",
          options: ["`5`", "The argument passed to the **next** `next(v)` call", "Always `undefined`", "The return value"],
          answer: 1,
          explanation: "`yield` hands 5 out and later receives what the caller sends in.",
        },
        {
          prompt: "`gen.return(v)` on a paused generator…",
          options: ["Is ignored", "Finishes it (running `finally` blocks) and yields `{ value: v, done: true }`", "Restarts it", "Throws inside it"],
          answer: 1,
          explanation: "`gen.throw(err)` raises at the paused `yield` instead.",
        },
        {
          prompt: "Why are `\"abc\".length` and `[...\"abc\"].length` sometimes different for other strings?",
          options: ["Spread drops spaces", "`length` counts UTF-16 code units while iteration is by code point — an emoji is two units, one item", "Spread includes the terminator", "They are always equal"],
          answer: 1,
          explanation: "Module 10 covers Unicode in depth.",
        },
        {
          prompt: "`4 instanceof Even` can be `true` because…",
          options: ["Numbers are objects", "`Even` defines `static [Symbol.hasInstance](n)`, which `instanceof` calls instead of walking the chain", "`Even.prototype` is `Number.prototype`", "It cannot"],
          answer: 1,
          explanation: "A reminder that `instanceof` can be customised — and can lie.",
        },
        {
          prompt: "`Reflect.ownKeys(obj)` returns…",
          options: ["Enumerable string keys", "Every own key — string keys (including non-enumerable) then symbol keys", "Only symbols", "Inherited keys too"],
          answer: 1,
          explanation: "`Object.keys` is enumerable strings only; `getOwnPropertySymbols` is symbols only.",
        },
        {
          prompt: "The best structure for \"have I processed this object before\" over objects you do not own, in a long-lived process, is…",
          options: ["An array with `includes`", "A `WeakSet` — identity membership without keeping the objects alive", "A `Map` of object to `true`", "A property on each object"],
          answer: 1,
          explanation: "A `Set`/`Map` would pin every object; a property is intrusive and fails on frozen objects.",
        },
      ],
    },
  ],
});

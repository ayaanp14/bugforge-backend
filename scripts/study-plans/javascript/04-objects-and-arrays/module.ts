import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "objects-and-arrays",
  title: "Objects, arrays and destructuring",
  blurb: "Object literals and JSON; references, shallow and deep copies, Object.freeze and immutable updates; arrays and the sort trap; the map/filter/reduce toolbox; destructuring and spread in every position.",
  icon: "grid",
  overview: `Objects and arrays are the two shapes every JavaScript program is made of, and both hide a handful of rules that separate code that works from code that seems to work. Objects: keys are strings, iteration order is integers-then-insertion, \`in\` sees the prototype, JSON drops \`undefined\` and functions and turns Dates into strings. Arrays: \`new Array(3)\` is three holes, \`sort\` compares as strings, \`shift\` is O(n), and half the methods mutate while the other half copy.

The module opens with the literal and its shorthands, moves to the one idea behind most "supernatural" bugs — copying is a decision (alias, shallow, deep) — and the immutable-update idiom that modern code prefers instead. Two lessons cover arrays: the mutating core and \`sort\` first, then the method toolbox with the \`reduce\` patterns (sum, frequency map, group by, index by key) that replace most loops. Destructuring and spread close the module: object and array patterns, defaults, rest, named parameters, and the config-merge idiom.

The exercises make you produce the exact outputs the rules predict — what \`JSON.stringify\` kept, which copy saw the mutation, what the default sort did to your numbers — and finish with three programs a working developer writes weekly: a grouped report, an immutable path-update engine, and a records processor that destructures in every parameter list.`,
  lessons: [
    {
      slug: "object-literals",
      file: "01-object-literals.md",
      exercises: [
        {
          title: "Build an object from input, then inspect it",
          prompt: `Read \`n\` followed by \`n\` key/value pairs and build an object with **bracket access** (the keys are only known at runtime). A value that parses as a finite number is stored as a number, otherwise as a string. Then print four lines: \`keys=<Object.keys joined by ,>\`, \`hasOwn(toString)=<Object.hasOwn(obj,"toString")> in(toString)=<"toString" in obj>\`, \`json=<JSON.stringify(obj)>\`, and \`entries=<key:typeof value>\` for every entry, space-separated.

Example: \`3 name Ada born 1815 lang js\` →
\`\`\`
keys=name,born,lang
hasOwn(toString)=false in(toString)=true
json={"name":"Ada","born":1815,"lang":"js"}
entries=name:string born:number lang:string
\`\`\`
The \`in\` line is the point: \`toString\` is *in* every plain object through its prototype, but it is not an *own* property unless you put it there.`,
          starterFile: "code/build-and-inspect.starter.js",
          solutionFile: "code/build-and-inspect.solution.js",
          hints: ["obj[key] = value — dot access would create a property literally named key.", "Number.isFinite(Number(raw)) tells a numeric string from a word; Number(\"\") is 0, but tokens are never empty here."],
          cases: [
            { stdin: "3 name Ada born 1815 lang js\n", expected: "keys=name,born,lang\nhasOwn(toString)=false in(toString)=true\njson={\"name\":\"Ada\",\"born\":1815,\"lang\":\"js\"}\nentries=name:string born:number lang:string\n" },
            { stdin: "1 x 5\n", expected: "keys=x\nhasOwn(toString)=false in(toString)=true\njson={\"x\":5}\nentries=x:number\n" },
            { stdin: "2 toString yes b 2\n", expected: "keys=toString,b\nhasOwn(toString)=true in(toString)=true\njson={\"toString\":\"yes\",\"b\":2}\nentries=toString:string b:number\n", hidden: true },
          ],
        },
        {
          title: "What JSON loses",
          prompt: `The starter parses one JSON object from stdin and adds four properties JSON cannot carry faithfully: \`u: undefined\`, \`f\` (a function), \`d: new Date(0)\` and \`n: NaN\`. Stringify it, parse the text back, and report: \`json=<the text>\`, \`before=<keys of the original>\`, \`after=<keys of the parsed copy>\`, and \`dateType=<typeof back.d> nanBecame=<back.n>\`.

Example: \`{"a":1,"b":"two"}\` →
\`\`\`
json={"a":1,"b":"two","d":"1970-01-01T00:00:00.000Z","n":null}
before=a,b,u,f,d,n
after=a,b,d,n
dateType=string nanBecame=null
\`\`\`
\`undefined\` and functions vanish, a Date becomes an ISO string, and \`NaN\` becomes \`null\` — none of them come back.`,
          starterFile: "code/json-losses.starter.js",
          solutionFile: "code/json-losses.solution.js",
          hints: ["JSON.stringify skips properties whose value is undefined or a function; Object.keys on the original still lists them.", "Date has a toJSON method that returns the ISO string; there is no reverse on parse."],
          cases: [
            { stdin: "{\"a\":1,\"b\":\"two\"}\n", expected: "json={\"a\":1,\"b\":\"two\",\"d\":\"1970-01-01T00:00:00.000Z\",\"n\":null}\nbefore=a,b,u,f,d,n\nafter=a,b,d,n\ndateType=string nanBecame=null\n" },
            { stdin: "{\"list\":[1,2],\"z\":null}\n", expected: "json={\"list\":[1,2],\"z\":null,\"d\":\"1970-01-01T00:00:00.000Z\",\"n\":null}\nbefore=list,z,u,f,d,n\nafter=list,z,d,n\ndateType=string nanBecame=null\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const key = \"age\"; const o = { key: 30 };` — what is `o.age`?",
          options: ["`30`", "`undefined` — the property is literally named `key`; `{ [key]: 30 }` computes it", "`\"age\"`", "A syntax error"],
          answer: 1,
          explanation: "Unquoted names in a literal are literal; brackets evaluate the expression.",
        },
        {
          prompt: "`\"toString\" in {}` and `Object.hasOwn({}, \"toString\")` are…",
          options: ["Both `true`", "`true` and `false` — `in` walks the prototype chain, `hasOwn` checks own properties only", "Both `false`", "`false` and `true`"],
          answer: 1,
          explanation: "For \"does this record have this field\" use `Object.hasOwn`.",
        },
        {
          prompt: "`Object.keys({ b: 1, 2: 1, a: 1, 1: 1 })` is…",
          options: ["`[\"b\", \"2\", \"a\", \"1\"]` — insertion order", "`[\"1\", \"2\", \"b\", \"a\"]` — integer-like keys first ascending, then strings in insertion order", "`[\"a\", \"b\", \"1\", \"2\"]`", "Unspecified"],
          answer: 1,
          explanation: "Never rely on insertion order for numeric keys; use a `Map` for an arbitrary-keyed ordered collection.",
        },
        {
          prompt: "`JSON.parse(JSON.stringify({ a: undefined, b: () => 1, c: new Date(0) }))` gives…",
          options: ["The same object back", "`{ c: \"1970-01-01T00:00:00.000Z\" }` — `undefined` and functions are dropped, Dates become strings", "`{ a: null, b: null, c: null }`", "A `TypeError`"],
          answer: 1,
          explanation: "JSON is data only; anything that is not a string, finite number, boolean, null, array or plain object is lost or converted.",
        },
        {
          prompt: "Why prefer a `Map` over a plain object as a dictionary keyed by user input?",
          options: ["Objects are slower in every case", "Keys are coerced to strings, `\"constructor\"`/`\"toString\"` already resolve through the prototype, and `__proto__` as a key is a pollution hazard", "`Map` supports JSON directly", "Objects cannot be iterated"],
          answer: 1,
          explanation: "`Object.create(null)` removes the prototype hazards; `Map` removes them and allows any key type.",
        },
      ],
    },
    {
      slug: "copying-and-immutability",
      file: "02-copying-and-immutability.md",
      exercises: [
        {
          title: "Alias, shallow, deep — who saw the change?",
          prompt: `The starter parses an object with a number \`n\`, a nested object \`inner\` (with \`x\`) and an array \`list\`, then makes three copies: an **alias**, a **shallow** copy with spread, and \`deepClone(original)\` — which you must implement recursively for arrays and plain objects (primitives return as-is). Then it mutates the original: \`n = 99\`, \`inner.x = 99\`, \`list.push(99)\`. Print one line per copy — \`<label>: n=<> inner.x=<> list=<JSON>\` — and finally \`shallowSharesInner=<shallow.inner === original.inner> deepSharesInner=<deep.inner === original.inner>\`.

Example: \`{"n":1,"inner":{"x":1},"list":[1,2]}\` →
\`\`\`
alias: n=99 inner.x=99 list=[1,2,99]
shallow: n=1 inner.x=99 list=[1,2,99]
deep: n=1 inner.x=1 list=[1,2]
shallowSharesInner=true deepSharesInner=false
\`\`\``,
          starterFile: "code/alias-shallow-deep.starter.js",
          solutionFile: "code/alias-shallow-deep.solution.js",
          hints: ["Array.isArray first, then typeof v === \"object\" && v !== null, else return v.", "Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClone(x)])) rebuilds an object."],
          cases: [
            { stdin: "{\"n\":1,\"inner\":{\"x\":1},\"list\":[1,2]}\n", expected: "alias: n=99 inner.x=99 list=[1,2,99]\nshallow: n=1 inner.x=99 list=[1,2,99]\ndeep: n=1 inner.x=1 list=[1,2]\nshallowSharesInner=true deepSharesInner=false\n" },
            { stdin: "{\"n\":7,\"inner\":{\"x\":-3,\"y\":2},\"list\":[]}\n", expected: "alias: n=99 inner.x=99 list=[99]\nshallow: n=7 inner.x=99 list=[99]\ndeep: n=7 inner.x=-3 list=[]\nshallowSharesInner=true deepSharesInner=false\n", hidden: true },
          ],
        },
        {
          title: "Freeze is shallow",
          prompt: `Parse a config \`{ retries, hosts }\` and freeze it with \`Object.freeze\`. In strict mode (the starter has \`"use strict"\`), try \`cfg.retries = 99\` inside \`try\`/\`catch\` and record either \`changed\` or the error's constructor name; then try \`cfg.hosts.push("z")\` and record \`changed to <new length>\` or the error name. Print \`top=<> nested=<>\`, then \`frozen=<Object.isFrozen(cfg)> nestedFrozen=<Object.isFrozen(cfg.hosts)>\`, then \`retries=<> hosts=<JSON>\`.

Example: \`{"retries":3,"hosts":["a","b"]}\` →
\`\`\`
top=TypeError nested=changed to 3
frozen=true nestedFrozen=false
retries=3 hosts=["a","b","z"]
\`\`\`
The frozen object refused the top-level write, but the array inside it is a separate, unfrozen object.`,
          starterFile: "code/freeze-report.starter.js",
          solutionFile: "code/freeze-report.solution.js",
          hints: ["In strict mode an assignment to a frozen object's property throws a TypeError; in sloppy mode it is silently ignored.", "e.constructor.name gives \"TypeError\"."],
          cases: [
            { stdin: "{\"retries\":3,\"hosts\":[\"a\",\"b\"]}\n", expected: "top=TypeError nested=changed to 3\nfrozen=true nestedFrozen=false\nretries=3 hosts=[\"a\",\"b\",\"z\"]\n" },
            { stdin: "{\"retries\":0,\"hosts\":[]}\n", expected: "top=TypeError nested=changed to 1\nfrozen=true nestedFrozen=false\nretries=0 hosts=[\"z\"]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const b = { ...a }; b.inner.x = 5;` — is `a.inner.x` affected?",
          options: ["No, spread copies everything", "Yes — spread is shallow; `b.inner` is the same object as `a.inner`", "Only if `a` is frozen", "It throws"],
          answer: 1,
          explanation: "One level is copied; nested objects are shared references.",
        },
        {
          prompt: "Which deep-copies a plain-data object on Node 16?",
          options: ["`Object.assign({}, o)`", "`JSON.parse(JSON.stringify(o))` or a recursive clone — `structuredClone` arrives in Node 17", "`{ ...o }`", "`Object.freeze(o)`"],
          answer: 1,
          explanation: "The JSON trick loses `undefined`, functions, Dates and cycles; recursion handles what you tell it to.",
        },
        {
          prompt: "`const cfg = Object.freeze({ hosts: [\"a\"] }); cfg.hosts.push(\"b\");` in strict mode…",
          options: ["Throws a `TypeError`", "Succeeds — `freeze` is shallow; the array is a separate, unfrozen object", "Silently does nothing", "Freezes the array too"],
          answer: 1,
          explanation: "Freeze recursively for a deep freeze; `cfg.retries = 1` on the frozen object itself would throw.",
        },
        {
          prompt: "Which of these mutate the array they are called on?",
          options: ["`map`, `filter`, `slice`", "`push`, `sort`, `splice`, `reverse`", "`concat`, `join`", "None — arrays are immutable"],
          answer: 1,
          explanation: "Copy first (`[...a].sort()`) when the original is shared.",
        },
        {
          prompt: "The idiomatic immutable update of `user.address.city`:",
          options: ["`user.address.city = c`", "`{ ...user, address: { ...user.address, city: c } }` — spread each level on the path", "`Object.freeze(user)`", "`JSON.parse(JSON.stringify(user))` then assign"],
          answer: 1,
          explanation: "Every object on the changed path is new; untouched siblings are shared — cheap, and a changed thing is a new reference.",
        },
      ],
    },
    {
      slug: "arrays-basics",
      file: "03-arrays-basics.md",
      exercises: [
        {
          title: "Sort it right",
          prompt: `Read \`n\` then \`n\` integers. Print \`default=<JSON>\` for \`[...nums].sort()\` (the string sort), \`asc=<JSON>\` for a numeric ascending sort, \`desc=<JSON>\` for numeric descending, and \`original=<JSON>\` to prove the input array was never mutated — every sort must run on a copy.

Example: \`5 10 9 1 100 25\` →
\`\`\`
default=[1,10,100,25,9]
asc=[1,9,10,25,100]
desc=[100,25,10,9,1]
original=[10,9,1,100,25]
\`\`\``,
          starterFile: "code/sort-it-right.starter.js",
          solutionFile: "code/sort-it-right.solution.js",
          hints: ["[...nums].sort() copies then sorts; nums.sort() would reorder the original.", "(a, b) => a - b ascending, (a, b) => b - a descending."],
          cases: [
            { stdin: "5 10 9 1 100 25\n", expected: "default=[1,10,100,25,9]\nasc=[1,9,10,25,100]\ndesc=[100,25,10,9,1]\noriginal=[10,9,1,100,25]\n" },
            { stdin: "4 -3 -20 5 7\n", expected: "default=[-20,-3,5,7]\nasc=[-20,-3,5,7]\ndesc=[7,5,-3,-20]\noriginal=[-3,-20,5,7]\n" },
            { stdin: "3 2 2 2\n", expected: "default=[2,2,2]\nasc=[2,2,2]\ndesc=[2,2,2]\noriginal=[2,2,2]\n", hidden: true },
          ],
        },
        {
          title: "Splice surgery",
          prompt: `Start with an empty array and run \`n\` commands: \`push x\`, \`pop\` (print \`popped=<value>\`), \`shift\` (print \`shifted=<value>\`), \`unshift x\`, \`splice i del k a1 … ak\` (remove \`del\` items at index \`i\`, insert the \`k\` items there; print \`removed=<JSON of what splice returned>\`), and \`show\` (print \`<JSON> length=<length>\`).

Example: \`8 push 1 push 2 push 3 show splice 1 1 2 8 9 show pop show\` →
\`\`\`
[1,2,3] length=3
removed=[2]
[1,8,9,3] length=4
popped=3
[1,8,9] length=3
\`\`\``,
          starterFile: "code/splice-surgery.starter.js",
          solutionFile: "code/splice-surgery.solution.js",
          hints: ["splice returns the removed elements as an array — empty when del is 0.", "Spread the collected items into the call: arr.splice(at, del, ...items)."],
          cases: [
            { stdin: "8 push 1 push 2 push 3 show splice 1 1 2 8 9 show pop show\n", expected: "[1,2,3] length=3\nremoved=[2]\n[1,8,9,3] length=4\npopped=3\n[1,8,9] length=3\n" },
            { stdin: "6 unshift 5 push 7 shift show splice 0 0 1 4 show\n", expected: "shifted=5\n[7] length=1\nremoved=[]\n[4,7] length=2\n" },
            { stdin: "3 push 1 pop show\n", expected: "popped=1\n[] length=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`[10, 9, 1, 100].sort()` returns…",
          options: ["`[1, 9, 10, 100]`", "`[1, 10, 100, 9]` — elements are compared as strings by default", "`[100, 10, 9, 1]`", "A `TypeError`"],
          answer: 1,
          explanation: "Pass `(a, b) => a - b` for numbers; `sort` also mutates in place.",
        },
        {
          prompt: "`new Array(3)` is…",
          options: ["`[0, 0, 0]`", "Three holes — `length` 3 and no elements; `map` skips them", "`[3]`", "`[undefined, undefined, undefined]` with `map` visiting each"],
          answer: 1,
          explanation: "`Array(3).fill(0)` or `Array.from({ length: 3 }, fn)` are the \"n of something\" idioms.",
        },
        {
          prompt: "`Array(3).fill([])` gives three…",
          options: ["Independent empty arrays", "References to the **same** array — pushing into one shows in all", "`undefined` values", "Holes"],
          answer: 1,
          explanation: "`Array.from({ length: 3 }, () => [])` creates independent rows; the same trap applies to grids.",
        },
        {
          prompt: "Cost of `shift()` on an array of n elements:",
          options: ["O(1) like `pop`", "O(n) — every remaining element moves down one index", "O(log n)", "O(n²)"],
          answer: 1,
          explanation: "A large queue built on `shift` is quadratic; use an index or a deque.",
        },
        {
          prompt: "`slice` versus `splice`:",
          options: ["Synonyms", "`slice(start, end)` copies a range without mutating; `splice(start, del, ...items)` removes/inserts in place and returns the removed items", "`splice` copies, `slice` mutates", "Both mutate"],
          answer: 1,
          explanation: "One letter, opposite behaviour — a classic interview gotcha.",
        },
      ],
    },
    {
      slug: "array-methods-toolbox",
      file: "04-array-methods-toolbox.md",
      exercises: [
        {
          title: "An order report, no loops",
          prompt: `Each input line is an order: \`customer item qty price paid\` where \`paid\` is \`y\` or \`n\`. Using only array methods (no \`for\`), print \`revenue=<sum of qty*price over paid orders, 2 decimals>\`; then one line per customer with paid orders, \`<customer>: <total>\`, sorted by name; then \`top=<customer with the largest paid total, or none> unpaid=<count of unpaid orders>\`. On ties for top, the customer that appears first in the report order (alphabetical) keeps it.

Example:
\`\`\`
ada pen 3 1.50 y
bob ink 1 12.00 n
ada pad 2 4.25 y
cy pen 10 1.50 y
\`\`\`
→
\`\`\`
revenue=28.00
ada: 13.00
cy: 15.00
top=cy unpaid=1
\`\`\``,
          starterFile: "code/order-report.starter.js",
          solutionFile: "code/order-report.solution.js",
          hints: ["filter the paid orders once and reuse the array; reduce into an object keyed by customer.", "Object.entries(byCustomer).sort(([a], [b]) => a.localeCompare(b)) orders the report; a reduce with a strict > keeps the first maximum."],
          cases: [
            { stdin: "ada pen 3 1.50 y\nbob ink 1 12.00 n\nada pad 2 4.25 y\ncy pen 10 1.50 y\n", expected: "revenue=28.00\nada: 13.00\ncy: 15.00\ntop=cy unpaid=1\n" },
            { stdin: "zed cup 1 2.00 n\nzed cup 1 2.00 n\n", expected: "revenue=0.00\ntop=none unpaid=2\n" },
            { stdin: "bob a 1 10.00 y\nada b 1 10.00 y\n", expected: "revenue=20.00\nada: 10.00\nbob: 10.00\ntop=bob unpaid=0\n", hidden: true },
          ],
        },
        {
          title: "Six methods, six lines",
          prompt: `Read \`n\` then \`n\` integers and print, one per line: \`evensSquared=<JSON of even values squared>\`, \`sum=<reduce with seed 0>\`, \`firstOver10=<find(x > 10) or none>\`, \`anyNegative=<some> allPositive=<every>\`, \`mirrored=<flatMap each x to [x, -x], dropping zeros>\`, and \`distinct=<JSON of [...new Set(nums)]>\`.

Example: \`6 3 8 0 12 5 8\` →
\`\`\`
evensSquared=[64,0,144,64]
sum=36
firstOver10=12
anyNegative=false allPositive=false
mirrored=[3,-3,8,-8,12,-12,5,-5,8,-8]
distinct=[3,8,0,12,5]
\`\`\``,
          starterFile: "code/method-pipeline.starter.js",
          solutionFile: "code/method-pipeline.solution.js",
          hints: ["find returns undefined when nothing matches — ?? \"none\" covers it.", "flatMap((x) => (x === 0 ? [] : [x, -x])) drops and expands in one pass."],
          cases: [
            { stdin: "6 3 8 0 12 5 8\n", expected: "evensSquared=[64,0,144,64]\nsum=36\nfirstOver10=12\nanyNegative=false allPositive=false\nmirrored=[3,-3,8,-8,12,-12,5,-5,8,-8]\ndistinct=[3,8,0,12,5]\n" },
            { stdin: "3 -1 2 20\n", expected: "evensSquared=[4,400]\nsum=21\nfirstOver10=20\nanyNegative=true allPositive=false\nmirrored=[-1,1,2,-2,20,-20]\ndistinct=[-1,2,20]\n" },
            { stdin: "4 1 1 1 1\n", expected: "evensSquared=[]\nsum=4\nfirstOver10=none\nanyNegative=false allPositive=true\nmirrored=[1,-1,1,-1,1,-1,1,-1]\ndistinct=[1]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`[\"1\", \"2\", \"3\"].map(parseInt)` gives…",
          options: ["`[1, 2, 3]`", "`[1, NaN, NaN]` — `map` passes the index as `parseInt`'s radix", "`[\"1\", \"2\", \"3\"]`", "A `TypeError`"],
          answer: 1,
          explanation: "Use `.map(Number)` or `.map((s) => parseInt(s, 10))`.",
        },
        {
          prompt: "`[].reduce((a, b) => a + b)` (no initial value)…",
          options: ["Returns `0`", "Throws a `TypeError` — with no seed the first element is the seed, and there is none", "Returns `undefined`", "Returns `[]`"],
          answer: 1,
          explanation: "Always pass the initial value; it also makes the accumulator's type explicit.",
        },
        {
          prompt: "`map` versus `forEach`:",
          options: ["Identical", "`map` returns a new array of the callback's results; `forEach` returns `undefined` and is for side effects", "`forEach` is faster and returns the array", "`map` can `break`"],
          answer: 1,
          explanation: "A `map` whose result is ignored, or a `forEach` pushing into an outer array, is the wrong method.",
        },
        {
          prompt: "`[].every((x) => x > 0)` is…",
          options: ["`false`", "`true` — vacuous truth: no element fails the test", "`undefined`", "A `TypeError`"],
          answer: 1,
          explanation: "`some` on an empty array is `false` for the same reason.",
        },
        {
          prompt: "The `reduce` shape for **group by**:",
          options: ["`arr.reduce((g, x) => g.push(x), [])`", "`arr.reduce((groups, x) => { (groups[key(x)] ??= []).push(x); return groups; }, {})`", "`arr.map(key).filter(Boolean)`", "`arr.sort().reduce((a, b) => a + b)`"],
          answer: 1,
          explanation: "Seed `{}`, create the bucket on first sight, push, return the accumulator.",
        },
      ],
    },
    {
      slug: "destructuring-and-spread",
      file: "05-destructuring-and-spread.md",
      exercises: [
        {
          title: "Named arguments",
          prompt: `Implement \`createUser({ name = "anon", role = "member", tags = [] } = {})\` returning \`<name> (<role>) tags=<tags.length>\`. Each input line is a JSON options object, or \`-\` meaning "call with no argument at all" — the \`= {}\` default is what makes that legal. Print one result per line.

Example:
\`\`\`
{"name":"Ada","role":"admin","tags":["x","y"]}
{"name":"Bob"}
-
{"tags":["a"]}
\`\`\`
→
\`\`\`
Ada (admin) tags=2
Bob (member) tags=0
anon (member) tags=0
anon (member) tags=1
\`\`\``,
          starterFile: "code/named-arguments.starter.js",
          solutionFile: "code/named-arguments.solution.js",
          hints: ["The starter already parses each line and passes undefined for -; the destructured parameter list does the rest.", "Every default fires on undefined only — a missing property is undefined."],
          cases: [
            { stdin: "{\"name\":\"Ada\",\"role\":\"admin\",\"tags\":[\"x\",\"y\"]}\n{\"name\":\"Bob\"}\n-\n{\"tags\":[\"a\"]}\n", expected: "Ada (admin) tags=2\nBob (member) tags=0\nanon (member) tags=0\nanon (member) tags=1\n" },
            { stdin: "{}\n{\"role\":\"owner\"}\n", expected: "anon (member) tags=0\nanon (owner) tags=0\n", hidden: true },
          ],
        },
        {
          title: "Swap, split, rest",
          prompt: `Read \`n\` then \`n\` integers into \`arr\`. With **destructuring only** — no index access — bind \`[first = 0, second = 0, ...rest]\` and print \`first=<> second=<> rest=<JSON>\`; swap the two with \`[first, second] = [second, first]\` and print \`swapped: first=<> second=<>\`; bind \`{ length }\` from the array and print \`length=<> min=<> max=<>\` (both 0 for an empty array, otherwise via \`Math.min(...arr)\`/\`Math.max(...arr)\`); finally bind the third element with a skip pattern and default \`"none"\` and print \`third=<>\`.

Example: \`5 4 9 1 7 3\` →
\`\`\`
first=4 second=9 rest=[1,7,3]
swapped: first=9 second=4
length=5 min=1 max=9
third=1
\`\`\``,
          starterFile: "code/swap-split-rest.starter.js",
          solutionFile: "code/swap-split-rest.solution.js",
          hints: ["let [first = 0, second = 0, ...rest] = arr; — defaults fire for positions past the end.", "const [, , third = \"none\"] = arr; skips two slots."],
          cases: [
            { stdin: "5 4 9 1 7 3\n", expected: "first=4 second=9 rest=[1,7,3]\nswapped: first=9 second=4\nlength=5 min=1 max=9\nthird=1\n" },
            { stdin: "1 8\n", expected: "first=8 second=0 rest=[]\nswapped: first=0 second=8\nlength=1 min=8 max=8\nthird=none\n" },
            { stdin: "0\n", expected: "first=0 second=0 rest=[]\nswapped: first=0 second=0\nlength=0 min=0 max=0\nthird=none\n", hidden: true },
            { stdin: "2 -2 5\n", expected: "first=-2 second=5 rest=[]\nswapped: first=5 second=-2\nlength=2 min=-2 max=5\nthird=none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const { a = 1 } = { a: null };` — `a` is…",
          options: ["`1`", "`null` — defaults apply on `undefined` only", "`undefined`", "A `TypeError`"],
          answer: 1,
          explanation: "`{ a: undefined }` or a missing property would give 1.",
        },
        {
          prompt: "`const { name } = undefined;`",
          options: ["`name` is `undefined`", "Throws — you cannot destructure `undefined`; write `= maybe ?? {}`", "`name` is `null`", "Binds nothing silently"],
          answer: 1,
          explanation: "Default the container when it may be missing.",
        },
        {
          prompt: "`{ ...defaults, ...options }` — on a key present in both, whose value wins?",
          options: ["`defaults`", "`options` — the later spread overwrites", "Neither; it throws", "The one with the truthy value"],
          answer: 1,
          explanation: "That is exactly the config-merge idiom: defaults first, overrides last.",
        },
        {
          prompt: "`const { address: { city } } = user;` binds…",
          options: ["`address` and `city`", "Only `city` — nested patterns bind the leaves", "Only `address`", "An object `{ city }`"],
          answer: 1,
          explanation: "Add `address` explicitly if you need it too: `{ address, address: { city } }`.",
        },
        {
          prompt: "Same three dots: how do you tell rest from spread?",
          options: ["Rest is for arrays, spread for objects", "Rest sits where names are bound (parameters, patterns) and collects; spread sits where values are supplied (calls, literals) and expands", "Spread must be last", "They are the same operation"],
          answer: 1,
          explanation: "Rest must be last in a pattern; spread may appear anywhere, several times.",
        },
      ],
    },
    {
      slug: "objects-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Sales summary by region",
          prompt: `Each line is \`region product qty price\` (integers). Group the sales by region with \`reduce\`, then for every region in **alphabetical order** print \`<region>: revenue=<sum of qty*price> items=<sum of qty> top=<product with the largest revenue in that region>\` (ties broken by product name ascending). Finish with \`regions=<count>\`.

Example:
\`\`\`
north pen 10 2
south pad 3 5
north pad 2 5
north ink 4 3
south pen 1 2
\`\`\`
→
\`\`\`
north: revenue=42 items=16 top=pen
south: revenue=17 items=4 top=pad
regions=2
\`\`\``,
          starterFile: "code/sales-summary.starter.js",
          solutionFile: "code/sales-summary.solution.js",
          hints: ["(acc[s.region] ??= []).push(s) inside a reduce seeded with {} groups the rows.", "Object.entries(byProduct).sort(([pa, ra], [pb, rb]) => rb - ra || pa.localeCompare(pb))[0][0] is the top product with the tie rule."],
          cases: [
            { stdin: "north pen 10 2\nsouth pad 3 5\nnorth pad 2 5\nnorth ink 4 3\nsouth pen 1 2\n", expected: "north: revenue=42 items=16 top=pen\nsouth: revenue=17 items=4 top=pad\nregions=2\n" },
            { stdin: "east cup 1 4\neast mug 2 2\n", expected: "east: revenue=8 items=3 top=cup\nregions=1\n", hidden: true },
            { stdin: "west a 1 1\n", expected: "west: revenue=1 items=1 top=a\nregions=1\n", hidden: true },
          ],
        },
        {
          title: "Immutable path updates",
          prompt: `The first line is a JSON document; every following line is \`set <dotted.path> <JSON value>\`. Implement \`setPath(obj, keys, value)\` returning a **new** object with the value placed at the path — spreading each object on the path, creating intermediate objects when missing, and sharing every untouched subtree. Apply the commands in order, then print \`final=<JSON>\`, \`original=<JSON>\` (which must be unchanged) and \`shared=<top-level keys whose value is still the same reference in both, joined by ",", or - if none>\`.

Example:
\`\`\`
{"name":"cfg","db":{"host":"x","port":1},"tags":["a"]}
set db.port 5432
set name "prod"
\`\`\`
→
\`\`\`
final={"name":"prod","db":{"host":"x","port":5432},"tags":["a"]}
original={"name":"cfg","db":{"host":"x","port":1},"tags":["a"]}
shared=tags
\`\`\``,
          starterFile: "code/path-updates.starter.js",
          solutionFile: "code/path-updates.solution.js",
          hints: ["Recursion: if keys is empty return value; otherwise { ...obj, [head]: setPath(obj[head] ?? {}, tail, value) }.", "Object.keys(original).filter((k) => original[k] === current[k]) finds the shared subtrees — identity, not deep equality."],
          cases: [
            { stdin: "{\"name\":\"cfg\",\"db\":{\"host\":\"x\",\"port\":1},\"tags\":[\"a\"]}\nset db.port 5432\nset name \"prod\"\n", expected: "final={\"name\":\"prod\",\"db\":{\"host\":\"x\",\"port\":5432},\"tags\":[\"a\"]}\noriginal={\"name\":\"cfg\",\"db\":{\"host\":\"x\",\"port\":1},\"tags\":[\"a\"]}\nshared=tags\n" },
            { stdin: "{\"a\":{\"b\":{\"c\":1}},\"keep\":[1,2]}\nset a.b.c 2\nset a.new true\n", expected: "final={\"a\":{\"b\":{\"c\":2},\"new\":true},\"keep\":[1,2]}\noriginal={\"a\":{\"b\":{\"c\":1}},\"keep\":[1,2]}\nshared=keep\n", hidden: true },
            { stdin: "{\"x\":1}\nset y.z \"deep\"\n", expected: "final={\"x\":1,\"y\":{\"z\":\"deep\"}}\noriginal={\"x\":1}\nshared=x\n", hidden: true },
          ],
        },
        {
          title: "Records, destructured everywhere",
          prompt: `Each line is \`name, age, city\`. Using destructuring in **every** callback parameter list — \`({ city, name })\`, \`([a], [b])\`, \`{ age }\` — print the people grouped by city (cities alphabetical, names within a city sorted), one line each as \`<city>: <names space-separated>\`; then \`oldest=<name of the oldest; first one on ties> average=<mean age, 1 decimal>\`; then \`first=<first person's name> others=<how many follow>\` via \`const [{ name: first }, ...others] = people\`.

Example:
\`\`\`
Ada, 36, London
Bob, 41, Paris
Cy, 29, London
Dee, 41, Rome
\`\`\`
→
\`\`\`
London: Ada Cy
Paris: Bob
Rome: Dee
oldest=Bob average=36.8
first=Ada others=3
\`\`\``,
          starterFile: "code/records.starter.js",
          solutionFile: "code/records.solution.js",
          hints: ["reduce((acc, { city, name }) => { (acc[city] ??= []).push(name); return acc; }, {}) groups by city.", "people.reduce((best, p) => (p.age > best.age ? p : best)) keeps the first maximum because the comparison is strict."],
          cases: [
            { stdin: "Ada, 36, London\nBob, 41, Paris\nCy, 29, London\nDee, 41, Rome\n", expected: "London: Ada Cy\nParis: Bob\nRome: Dee\noldest=Bob average=36.8\nfirst=Ada others=3\n" },
            { stdin: "Zed, 50, Oslo\n", expected: "Oslo: Zed\noldest=Zed average=50.0\nfirst=Zed others=0\n", hidden: true },
            { stdin: "Ann, 20, A\nBen, 30, B\nCal, 40, A\n", expected: "A: Ann Cal\nB: Ben\noldest=Cal average=30.0\nfirst=Ann others=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const o = {}; o[1] = \"a\"; o[\"1\"] = \"b\";` — `Object.keys(o).length` is…",
          options: ["`2`", "`1` — property keys are strings; `1` and `\"1\"` are the same key", "`0`", "It throws"],
          answer: 1,
          explanation: "Use a `Map` when keys must keep their type.",
        },
        {
          prompt: "`JSON.stringify({ a: NaN, b: Infinity })` is…",
          options: ["`{\"a\":NaN,\"b\":Infinity}`", "`{\"a\":null,\"b\":null}` — non-finite numbers serialise as `null`", "`{}`", "A `SyntaxError`"],
          answer: 1,
          explanation: "JSON has no NaN or Infinity literals.",
        },
        {
          prompt: "`const a = [1, 2]; const b = a; b.push(3);` — `a.length` is…",
          options: ["`2`", "`3` — `b` is an alias; assignment copies the reference, not the array", "`undefined`", "It throws"],
          answer: 1,
          explanation: "`const b = [...a]` would have copied one level.",
        },
        {
          prompt: "Which pair copies one level of an object?",
          options: ["`structuredClone`, recursion", "`{ ...o }` and `Object.assign({}, o)`", "`Object.freeze(o)`, `Object.seal(o)`", "`JSON.parse(JSON.stringify(o))`"],
          answer: 1,
          explanation: "Nested objects are shared after a shallow copy.",
        },
        {
          prompt: "`Object.isFrozen(Object.freeze({ list: [] }).list)` is…",
          options: ["`true`", "`false` — freeze is shallow", "`undefined`", "A `TypeError`"],
          answer: 1,
          explanation: "Deep freeze needs recursion.",
        },
        {
          prompt: "`const a = [1, 2, 3]; a.length = 1;` leaves `a` as…",
          options: ["`[1, 2, 3]` — `length` is read-only", "`[1]` — assigning a smaller `length` truncates", "`[1, undefined, undefined]`", "An error"],
          answer: 1,
          explanation: "Assigning a larger `length` extends with holes.",
        },
        {
          prompt: "`[3, 20, 100].sort().join()` is…",
          options: ["`\"3,20,100\"`", "`\"100,20,3\"` — string comparison: `\"1\" < \"2\" < \"3\"`", "`\"20,3,100\"`", "It throws without a comparator"],
          answer: 1,
          explanation: "Numeric order needs `(a, b) => a - b`.",
        },
        {
          prompt: "`[1, [2, [3]]].flat()` is…",
          options: ["`[1, 2, 3]`", "`[1, 2, [3]]` — `flat()` flattens one level; `flat(Infinity)` flattens all", "`[[1], [2], [3]]`", "`[1, [2, [3]]]` unchanged"],
          answer: 1,
          explanation: "`flatMap` is `map` followed by a one-level `flat`.",
        },
        {
          prompt: "`users.filter((u) => u.id === 7)[0]` is better written as…",
          options: ["`users.some((u) => u.id === 7)`", "`users.find((u) => u.id === 7)` — stops at the first match and returns it or `undefined`", "`users.map((u) => u.id === 7)`", "`users.indexOf(7)`"],
          answer: 1,
          explanation: "`filter(...).length > 0` is likewise `some`.",
        },
        {
          prompt: "`const [x = 0, y = 0] = [5];` gives…",
          options: ["`x = 5, y = undefined`", "`x = 5, y = 0` — positions past the end are `undefined`, so the default applies", "`x = 0, y = 5`", "A `TypeError`"],
          answer: 1,
          explanation: "Defaults fire on `undefined` — including missing positions.",
        },
        {
          prompt: "Making the options argument itself optional in `function f({ a = 1, b = 2 } = {})` is the job of…",
          options: ["`a = 1`", "The trailing `= {}` — without it `f()` destructures `undefined` and throws", "`b = 2`", "Nothing; it is optional automatically"],
          answer: 1,
          explanation: "Defaults inside the braces handle missing properties; the outer default handles a missing object.",
        },
        {
          prompt: "`Math.max(...hugeArray)` on a few hundred thousand numbers…",
          options: ["Is the fastest option", "Can throw a range/stack error — argument lists have a limit; `reduce` with `Math.max` instead", "Returns `NaN`", "Returns `Infinity`"],
          answer: 1,
          explanation: "Spread into a call pushes every element as an argument.",
        },
      ],
    },
  ],
});

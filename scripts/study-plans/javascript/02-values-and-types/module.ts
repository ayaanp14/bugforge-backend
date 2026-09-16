import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "values-and-types",
  title: "Values, types and coercion",
  blurb: "The seven primitives and typeof, numbers as doubles with NaN and BigInt, strings and their toolkit, truthiness and the rules behind == and +, the nullish operators, and let/const/var with the temporal dead zone.",
  icon: "type",
  overview: `Most JavaScript bugs that make it into production are type bugs: a count that was zero and therefore "missing", a string compared to a number, an emoji counted as two characters, a var shared by every callback in a loop. None of them are random — each follows from a rule this module states.

It begins with the eight kinds of value and the two typeof traps, then takes the number type seriously: doubles, NaN, the safe-integer limit and BigInt. Strings get their toolkit and their Unicode footnote. The coercion lesson lays out the eight falsy values, the algorithm behind ==, what + does when a string is involved, and the modern operators — ??, ?., ??= — that make the common cases safe. The module closes with let, const and var: block scope, hoisting, the temporal dead zone, and the loop-closure classic that justifies let.

The exercises make the rules visible: programs that classify values the way the engine does, tables of what == and + produce, and code that demonstrates the temporal dead zone by catching the error it throws.`,
  lessons: [
    {
      slug: "primitives-and-typeof",
      file: "01-primitives-and-typeof.md",
      exercises: [
        {
          title: "typeof census",
          prompt: `Read \`n\` tokens and turn each into the value it names using the provided \`parse\` helper (\`null\`, \`undefined\`, \`NaN\`, booleans, numbers, \`7n\` bigints, \`empty\` for the empty string, \`[…]\`/\`{…}\` as JSON, anything else a string). Print \`<token>: typeof=<typeof value> array=<Array.isArray> nullish=<value == null>\`.

Example: \`4\` then \`null [1,2] 7n hi\` →
\`\`\`
null: typeof=object array=false nullish=true
[1,2]: typeof=object array=true nullish=false
7n: typeof=bigint array=false nullish=false
hi: typeof=string array=false nullish=false
\`\`\``,
          starterFile: "code/typeof-census.starter.js",
          solutionFile: "code/typeof-census.solution.js",
          hints: ["typeof null is \"object\" — the nullish column is how you tell null from a real object.", "Array.isArray is the only reliable array test."],
          cases: [
            { stdin: "4\nnull [1,2] 7n hi\n", expected: "null: typeof=object array=false nullish=true\n[1,2]: typeof=object array=true nullish=false\n7n: typeof=bigint array=false nullish=false\nhi: typeof=string array=false nullish=false\n" },
            { stdin: "3\nundefined NaN true\n", expected: "undefined: typeof=undefined array=false nullish=true\nNaN: typeof=number array=false nullish=false\ntrue: typeof=boolean array=false nullish=false\n" },
            { stdin: "3\n42 {} empty\n", expected: "42: typeof=number array=false nullish=false\n{}: typeof=object array=false nullish=false\nempty: typeof=string array=false nullish=false\n", hidden: true },
          ],
        },
        {
          title: "Walk a path, nullishly",
          prompt: `Read three lines: a JSON object, a dotted path (\`a.b.c\`), and a fallback word. Walk the path with optional chaining — \`cur = cur?.[key]\` — so that a \`null\` or \`undefined\` anywhere along the way yields \`undefined\` instead of throwing. Print \`value=<JSON of the value, or undefined>\`, \`withDefault=<JSON of value ?? fallback>\` and \`typeof=<typeof value>\`. Note that \`??\` replaces \`null\` as well as \`undefined\`.

Example: \`{"a":{"b":null,"c":[1,2]}}\` / \`a.b.c\` / \`x\` →
\`\`\`
value=undefined
withDefault="x"
typeof=undefined
\`\`\``,
          starterFile: "code/nullish-walk.starter.js",
          solutionFile: "code/nullish-walk.solution.js",
          hints: ["cur?.[k] is optional chaining with a computed key.", "JSON.stringify(undefined) is undefined — special-case it for the value line."],
          cases: [
            { stdin: '{"a":{"b":null,"c":[1,2]}}\na.b.c\nx\n', expected: 'value=undefined\nwithDefault="x"\ntypeof=undefined\n' },
            { stdin: '{"a":null}\na\nd\n', expected: 'value=null\nwithDefault="d"\ntypeof=object\n' },
            { stdin: '{"a":{"b":{"c":5}}}\na.b.c\nx\n', expected: "value=5\nwithDefault=5\ntypeof=number\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`typeof null` is…",
          options: ["`\"null\"`", "`\"object\"`", "`\"undefined\"`", "A `TypeError`"],
          answer: 1,
          explanation: "A 1995 bug preserved for compatibility; test with `=== null`.",
        },
        {
          prompt: "`typeof []` is…",
          options: ["`\"array\"`", "`\"object\"` — use `Array.isArray`", "`\"list\"`", "`\"function\"`"],
          answer: 1,
          explanation: "Arrays are objects; only functions get their own `typeof` result.",
        },
        {
          prompt: "Predict: `let a = { n: 1 }; let b = a; b.n = 2; console.log(a.n)`",
          options: ["`1`", "`2` — objects are shared by reference", "`undefined`", "Throws"],
          answer: 1,
          explanation: "Primitives are copied; objects are not.",
        },
        {
          prompt: "`undefined == null` and `undefined === null` are…",
          options: ["`true`, `true`", "`true`, `false`", "`false`, `false`", "`false`, `true`"],
          answer: 1,
          explanation: "Loose equality treats the two nullish values as equal — the one idiomatic `==`.",
        },
        {
          prompt: "`new Number(1) === 1` is…",
          options: ["`true`", "`false` — the constructor creates an object; use `Number(x)` without `new`", "A `TypeError`", "`undefined`"],
          answer: 1,
          explanation: "Wrapper objects are never what you want; the conversion functions are.",
        },
      ],
    },
    {
      slug: "numbers",
      file: "02-numbers.md",
      exercises: [
        {
          title: "Safe or not",
          prompt: `Read \`n\` tokens. For each, convert with \`Number\` and print \`<token>: value=<v> finite=<Number.isFinite> safeInteger=<Number.isSafeInteger>\`; when the token is a plain integer literal (\`/^-?\\d+$/\`) also append \`bigint=<BigInt(token)>\` — which keeps the digits the double lost.

Example: \`3\` then \`42 9007199254740993 abc\` →
\`\`\`
42: value=42 finite=true safeInteger=true bigint=42
9007199254740993: value=9007199254740992 finite=true safeInteger=false bigint=9007199254740993
abc: value=NaN finite=false safeInteger=false
\`\`\``,
          starterFile: "code/safe-or-not.starter.js",
          solutionFile: "code/safe-or-not.solution.js",
          hints: ["Number(\"9007199254740993\") rounds to the nearest representable double.", "BigInt(token) parses the exact digits — it must be given the string, not the rounded number."],
          cases: [
            { stdin: "3\n42 9007199254740993 abc\n", expected: "42: value=42 finite=true safeInteger=true bigint=42\n9007199254740993: value=9007199254740992 finite=true safeInteger=false bigint=9007199254740993\nabc: value=NaN finite=false safeInteger=false\n" },
            { stdin: "2\n4.5 1e3\n", expected: "4.5: value=4.5 finite=true safeInteger=false\n1e3: value=1000 finite=true safeInteger=true\n" },
            { stdin: "2\n-0 Infinity\n", expected: "-0: value=0 finite=true safeInteger=true bigint=0\nInfinity: value=Infinity finite=false safeInteger=false\n", hidden: true },
          ],
        },
        {
          title: "Division, five ways",
          prompt: `Read \`n\` pairs \`a b\` (\`b ≠ 0\`). For each print \`<a>/<b>: div=<a / b> floor=<Math.floor> trunc=<Math.trunc> rem=<a % b> mod=<((a % b) + b) % b>\`. Watch the negatives: floor and trunc disagree, and \`%\` keeps the dividend's sign.

Example: \`2\` then \`7 2\`, \`-7 2\` →
\`\`\`
7/2: div=3.5 floor=3 trunc=3 rem=1 mod=1
-7/2: div=-3.5 floor=-4 trunc=-3 rem=-1 mod=1
\`\`\``,
          starterFile: "code/division.starter.js",
          solutionFile: "code/division.solution.js",
          hints: ["/ is always floating point; Math.floor rounds toward -Infinity, Math.trunc toward zero.", "The double-modulo idiom turns a negative remainder into a positive modulo."],
          cases: [
            { stdin: "2\n7 2\n-7 2\n", expected: "7/2: div=3.5 floor=3 trunc=3 rem=1 mod=1\n-7/2: div=-3.5 floor=-4 trunc=-3 rem=-1 mod=1\n" },
            { stdin: "1\n-7 3\n", expected: "-7/3: div=-2.3333333333333335 floor=-3 trunc=-2 rem=-1 mod=2\n" },
            { stdin: "2\n9 3\n8 -3\n", expected: "9/3: div=3 floor=3 trunc=3 rem=0 mod=0\n8/-3: div=-2.6666666666666665 floor=-3 trunc=-2 rem=2 mod=-1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`0.1 + 0.2 === 0.3` is…",
          options: ["`true`", "`false` — binary doubles cannot represent decimal tenths exactly", "A `TypeError`", "`true` only in strict mode"],
          answer: 1,
          explanation: "Compare with a tolerance or compute in integer units.",
        },
        {
          prompt: "The correct test for `NaN` is…",
          options: ["`x === NaN`", "`Number.isNaN(x)`", "`x == NaN`", "`isNaN(x)` — always"],
          answer: 1,
          explanation: "`NaN !== NaN`; global `isNaN` coerces (`isNaN(\"abc\")` is `true`).",
        },
        {
          prompt: "`Number.MAX_SAFE_INTEGER` is…",
          options: ["2³¹ − 1", "2⁵³ − 1 — the last integer that `n + 1` distinguishes", "2⁶⁴", "Infinity"],
          answer: 1,
          explanation: "Doubles have a 53-bit significand; beyond it use `BigInt`.",
        },
        {
          prompt: "`1n + 1` evaluates to…",
          options: ["`2n`", "`2`", "A `TypeError` — BigInt and Number never mix implicitly", "`\"11\"`"],
          answer: 2,
          explanation: "Convert one side explicitly: `1n + BigInt(1)` or `Number(1n) + 1`.",
        },
        {
          prompt: "`-7 % 3` is…",
          options: ["`2`", "`-1` — the remainder takes the dividend's sign", "`1`", "`-2`"],
          answer: 1,
          explanation: "`((a % b) + b) % b` gives the mathematical modulo.",
        },
      ],
    },
    {
      slug: "strings",
      file: "03-strings.md",
      exercises: [
        {
          title: "Code units and characters",
          prompt: `Read one line. Print \`length=<s.length> codePoints=<[...s].length>\`, then \`reversed=<the characters reversed>\` — reverse the **spread** array so surrogate pairs stay intact — then \`upper=<s.toUpperCase()>\` and \`first=<first character> last=<last character>\` (empty for an empty line).

Example: \`héllo 😀\` →
\`\`\`
length=8 codePoints=7
reversed=😀 olléh
upper=HÉLLO 😀
first=h last=😀
\`\`\``,
          starterFile: "code/code-units.starter.js",
          solutionFile: "code/code-units.solution.js",
          hints: ["[...s] iterates by code point, so an emoji is one element.", "s.split(\"\").reverse() would tear the emoji into two invalid halves."],
          cases: [
            { stdin: "héllo 😀\n", expected: "length=8 codePoints=7\nreversed=😀 olléh\nupper=HÉLLO 😀\nfirst=h last=😀\n" },
            { stdin: "abc\n", expected: "length=3 codePoints=3\nreversed=cba\nupper=ABC\nfirst=a last=c\n" },
            { stdin: "\n", expected: "length=0 codePoints=0\nreversed=\nupper=\nfirst= last=\n", hidden: true },
          ],
        },
        {
          title: "Replace, count, pad",
          prompt: `Read lines until end of input (skip empty lines). For each line \`s\` print four lines: \`once=<s.replace("a", "_")>\`, \`all=<s.replaceAll("a", "_")>\`, \`words=<number of whitespace-separated words after trimming>\` and \`padded=<s.trim().padStart(12, ".")>\`.

Example: \`banana\` →
\`\`\`
once=b_nana
all=b_n_n_
words=1
padded=......banana
\`\`\``,
          starterFile: "code/replace-and-pad.starter.js",
          solutionFile: "code/replace-and-pad.solution.js",
          hints: ["replace with a string pattern replaces the first occurrence only.", "padStart pads to a total length; a string already that long is returned unchanged."],
          cases: [
            { stdin: "banana\n", expected: "once=b_nana\nall=b_n_n_\nwords=1\npadded=......banana\n" },
            { stdin: "  a cat  \n", expected: "once=  _ cat\nall=  _ c_t\nwords=2\npadded=.......a cat\n" },
            { stdin: "aaa\nxyz\n", expected: "once=_aa\nall=___\nwords=1\npadded=.........aaa\nonce=xyz\nall=xyz\nwords=1\npadded=.........xyz\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict: `let s = \"hi\"; s.toUpperCase(); console.log(s)`",
          options: ["`HI`", "`hi` — strings are immutable; the result was discarded", "`undefined`", "Throws"],
          answer: 1,
          explanation: "Assign the result: `s = s.toUpperCase()`.",
        },
        {
          prompt: "`\"😀\".length` is…",
          options: ["`1`", "`2` — one character, two UTF-16 code units", "`4`", "`0`"],
          answer: 1,
          explanation: "Spread or `for…of` to count characters.",
        },
        {
          prompt: "`\"a-b-c\".replace(\"-\", \"+\")` gives…",
          options: ["`a+b+c`", "`a+b-c` — only the first match", "`a-b-c`", "An error"],
          answer: 1,
          explanation: "`replaceAll` or a `/g` regex for every occurrence.",
        },
        {
          prompt: "Which slicing method should you avoid?",
          options: ["`slice`", "`substring`", "`substr` — deprecated `(start, length)` form", "`at`"],
          answer: 2,
          explanation: "`slice` handles negatives and is the standard choice.",
        },
        {
          prompt: "`[\"b\", \"a\", \"B\"].sort()` gives…",
          options: ["`[\"a\", \"b\", \"B\"]`", "`[\"B\", \"a\", \"b\"]` — code-unit order puts upper case first", "`[\"a\", \"B\", \"b\"]`", "`[\"b\", \"B\", \"a\"]`"],
          answer: 1,
          explanation: "Use `localeCompare` for human ordering.",
        },
      ],
    },
    {
      slug: "booleans-truthiness-and-equality",
      file: "04-booleans-truthiness-and-equality.md",
      exercises: [
        {
          title: "Falsy filter",
          prompt: `Read \`n\` tokens and convert each with the \`parse\` helper (\`empty\` is the empty string, \`0n\` a bigint zero, \`[]\` an empty array…). Print \`<token>: truthy\` or \`<token>: falsy\` using \`Boolean(value)\`, then \`falsy=<count>\`. Exactly eight values are falsy — check your list against the output.

Example: \`5\` then \`0 empty [] NaN hello\` →
\`\`\`
0: falsy
empty: falsy
[]: truthy
NaN: falsy
hello: truthy
falsy=3
\`\`\``,
          starterFile: "code/falsy-filter.starter.js",
          solutionFile: "code/falsy-filter.solution.js",
          hints: ["Boolean(v) applies the truthiness rule exactly as an if would.", "[] and {} are objects, and every object is truthy — even empty ones."],
          cases: [
            { stdin: "5\n0 empty [] NaN hello\n", expected: "0: falsy\nempty: falsy\n[]: truthy\nNaN: falsy\nhello: truthy\nfalsy=3\n" },
            { stdin: "4\nnull undefined false 0n\n", expected: "null: falsy\nundefined: falsy\nfalse: falsy\n0n: falsy\nfalsy=4\n" },
            { stdin: "4\n{} -0 7 false\n", expected: "{}: truthy\n-0: falsy\n7: truthy\nfalse: falsy\nfalsy=2\n", hidden: true },
          ],
        },
        {
          title: "Loose, strict, or the same?",
          prompt: `Read \`n\` pairs of tokens, convert each with \`parse\`, and print \`<a> <b>: ==<a == b> ===<a === b> is=<Object.is(a, b)>\`. Every difference between the three columns is one of the rules from the lesson.

Example: \`3\` then \`null undefined\`, \`0 empty\`, \`NaN NaN\` →
\`\`\`
null undefined: ==true ===false is=false
0 empty: ==true ===false is=false
NaN NaN: ==false ===false is=true
\`\`\``,
          starterFile: "code/loose-or-strict.starter.js",
          solutionFile: "code/loose-or-strict.solution.js",
          hints: ["== converts: null and undefined match each other, strings become numbers, booleans become numbers.", "Object.is differs from === only for NaN (equal) and ±0 (different)."],
          cases: [
            { stdin: "3\nnull undefined\n0 empty\nNaN NaN\n", expected: "null undefined: ==true ===false is=false\n0 empty: ==true ===false is=false\nNaN NaN: ==false ===false is=true\n" },
            { stdin: "2\n-0 0\n[] 0\n", expected: "-0 0: ==true ===true is=false\n[] 0: ==true ===false is=false\n" },
            { stdin: "3\ntrue 1\nabc abc\nnull 0\n", expected: "true 1: ==true ===false is=false\nabc abc: ==true ===true is=true\nnull 0: ==false ===false is=false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these is truthy?",
          options: ["`\"\"`", "`0`", "`[]`", "`NaN`"],
          answer: 2,
          explanation: "Every object is truthy, including empty arrays and objects.",
        },
        {
          prompt: "`count || 10` versus `count ?? 10` when `count` is `0`…",
          options: ["Both give `10`", "`||` gives `10`, `??` gives `0` — nullish coalescing only replaces null/undefined", "Both give `0`", "`??` throws"],
          answer: 1,
          explanation: "Use `??` for defaults whenever zero or an empty string is a valid value.",
        },
        {
          prompt: "`\"\" == 0`, `\"0\" == 0`, `\"\" == \"0\"` are…",
          options: ["true, true, true", "true, true, false", "false, true, false", "false, false, false"],
          answer: 1,
          explanation: "Strings become numbers against a number; two strings compare as strings.",
        },
        {
          prompt: "`1 + 2 + \"3\"` is…",
          options: ["`6`", "`\"33\"` — left to right: 3 then `3 + \"3\"` concatenates", "`\"123\"`", "`\"6\"`"],
          answer: 1,
          explanation: "`\"1\" + 2 + 3` would be `\"123\"`.",
        },
        {
          prompt: "`\"10\" < \"9\"` is…",
          options: ["`false`", "`true` — both are strings, so the comparison is by code units", "A `TypeError`", "`undefined`"],
          answer: 1,
          explanation: "`10 < \"9\"` (one number) converts the string and is `false`.",
        },
      ],
    },
    {
      slug: "variables-let-const-var",
      file: "05-variables-let-const-var.md",
      exercises: [
        {
          title: "The loop-closure classic, both ways",
          prompt: `Read \`n\`. Fill one array with \`n\` arrow functions created in a \`for (var i …)\` loop, each returning \`i\`, and another in a \`for (let j …)\` loop returning \`j\`. **After** both loops, call every function and print \`var: <results>\` and \`let: <results>\` space-separated. The first line shows one shared binding; the second, a fresh binding per iteration.

Example: \`3\` →
\`\`\`
var: 3 3 3
let: 0 1 2
\`\`\``,
          starterFile: "code/loop-closures.starter.js",
          solutionFile: "code/loop-closures.solution.js",
          hints: ["The callbacks read the variable when called, not when created.", "With let, the specification gives each iteration its own j."],
          cases: [
            { stdin: "3\n", expected: "var: 3 3 3\nlet: 0 1 2\n" },
            { stdin: "1\n", expected: "var: 1\nlet: 0\n" },
            { stdin: "5\n", expected: "var: 5 5 5 5 5\nlet: 0 1 2 3 4\n", hidden: true },
          ],
        },
        {
          title: "Hoisting and the dead zone, observed",
          prompt: `Read \`n\` scenario names and run each inside \`try\`/\`catch\`, printing \`<name>: <result>\`: \`var-before\` (read \`typeof v\` before the \`var v\` line → \`undefined\`), \`let-before\` (read \`l\` before its \`let\` → the error class), \`const-reassign\` (assign to a \`const\` → the error class), \`const-mutate\` (change a property of a \`const\` object → \`mutated to 2\`), \`block-leak\` (declare \`var leaked\` and \`let kept\` inside a block, then report \`var=<typeof leaked> let=<typeof kept>\` outside it).

Example: \`3\` then \`var-before let-before const-mutate\` →
\`\`\`
var-before: undefined
let-before: ReferenceError
const-mutate: mutated to 2
\`\`\``,
          starterFile: "code/tdz.starter.js",
          solutionFile: "code/tdz.solution.js",
          hints: ["var is hoisted with undefined; let is hoisted uninitialised — reading it throws.", "typeof on a let in its dead zone is the one typeof that throws; on a leaked var it says \"number\"."],
          cases: [
            { stdin: "3\nvar-before let-before const-mutate\n", expected: "var-before: undefined\nlet-before: ReferenceError\nconst-mutate: mutated to 2\n" },
            { stdin: "2\nconst-reassign block-leak\n", expected: "const-reassign: TypeError\nblock-leak: var=number let=undefined\n" },
            { stdin: "2\nblock-leak var-before\n", expected: "block-leak: var=number let=undefined\nvar-before: undefined\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict: `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))`",
          options: ["0 1 2", "3 3 3 — one shared `var` binding read after the loop finished", "0 0 0", "1 2 3"],
          answer: 1,
          explanation: "`let` creates a binding per iteration and prints 0 1 2.",
        },
        {
          prompt: "Reading a `let` variable before its declaration line…",
          options: ["Gives `undefined`", "Throws `ReferenceError` — the temporal dead zone", "Gives `null`", "Is a syntax error"],
          answer: 1,
          explanation: "`var` would give `undefined`; the TDZ turns the mistake into an immediate error.",
        },
        {
          prompt: "`const o = {}; o.x = 1;`…",
          options: ["Throws", "Is fine — `const` prevents reassigning `o`, not mutating the object", "Freezes `o`", "Creates a new object"],
          answer: 1,
          explanation: "`Object.freeze` for (shallow) immutability.",
        },
        {
          prompt: "A `var` declared inside an `if` block is visible…",
          options: ["Only inside the block", "Throughout the enclosing function — `var` ignores blocks", "Nowhere", "Only after the block"],
          answer: 1,
          explanation: "Block scope is what `let` and `const` added.",
        },
        {
          prompt: "Assigning to an undeclared name in a strict-mode function…",
          options: ["Creates a global", "Throws `ReferenceError`", "Creates a local", "Is ignored"],
          answer: 1,
          explanation: "In sloppy mode it silently creates a global — the accidental-global bug.",
        },
      ],
    },
    {
      slug: "values-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Type inspector",
          prompt: `Read \`n\` tokens and classify each with the \`parse\` helper: print \`<token>: <kind>\` where the kind is \`null\` for null, \`array\` for arrays, and otherwise \`typeof\`; for numbers append \` nan=<Number.isNaN> safe=<Number.isSafeInteger>\`.

Example: \`4\` then \`null [1] 3.5 NaN\` →
\`\`\`
null: null
[1]: array
3.5: number nan=false safe=false
NaN: number nan=true safe=false
\`\`\``,
          starterFile: "code/inspector.starter.js",
          solutionFile: "code/inspector.solution.js",
          hints: ["Check null first, then Array.isArray, then typeof — the order matters because typeof lies about both.", "Only numbers get the extra columns."],
          cases: [
            { stdin: "4\nnull [1] 3.5 NaN\n", expected: "null: null\n[1]: array\n3.5: number nan=false safe=false\nNaN: number nan=true safe=false\n" },
            { stdin: "4\n12 x 9n true\n", expected: "12: number nan=false safe=true\nx: string\n9n: bigint\ntrue: boolean\n" },
            { stdin: "3\nundefined {} 9007199254740993\n", expected: "undefined: undefined\n{}: object\n9007199254740993: number nan=false safe=false\n", hidden: true },
          ],
        },
        {
          title: "A calculator that never loses digits",
          prompt: `Read lines \`<a> <op> <b>\` (integers as text, \`op\` one of \`+ - *\`) until end of input. Compute with \`Number\` when both operands **and the result** are safe integers; otherwise recompute with \`BigInt\`. Print \`<a> <op> <b> = <result> mode=<number|bigint>\`.

Example input
\`\`\`
2 + 3
9007199254740991 + 1
\`\`\`
→
\`\`\`
2 + 3 = 5 mode=number
9007199254740991 + 1 = 9007199254740992 mode=bigint
\`\`\``,
          starterFile: "code/safe-calculator.starter.js",
          solutionFile: "code/safe-calculator.solution.js",
          hints: ["Number.isSafeInteger on the result catches a sum that crossed 2^53 even when both inputs were safe.", "BigInt(a) parses the original text — never BigInt(Number(a)), which would already be rounded."],
          cases: [
            { stdin: "2 + 3\n9007199254740991 + 1\n", expected: "2 + 3 = 5 mode=number\n9007199254740991 + 1 = 9007199254740992 mode=bigint\n" },
            { stdin: "123456789012345678 * 2\n-5 - 7\n", expected: "123456789012345678 * 2 = 246913578024691356 mode=bigint\n-5 - 7 = -12 mode=number\n" },
            { stdin: "100000000 * 100000000\n3 * 3\n", expected: "100000000 * 100000000 = 10000000000000000 mode=bigint\n3 * 3 = 9 mode=number\n", hidden: true },
          ],
        },
        {
          title: "The coercion table",
          prompt: `Read \`n\` pairs of tokens (via \`parse\`) and print, for each, \`<a> <b> | ==:<a == b> ===:<a === b> +:<repr of a + b> (<typeof a + b>)\` where the repr is \`JSON.stringify\` for strings and arrays and \`String\` otherwise. Predict every line before running.

Example: \`3\` then \`1 one\`, \`null 0\`, \`[] 0\` →
\`\`\`
1 one | ==:false ===:false +:"1one" (string)
null 0 | ==:false ===:false +:0 (number)
[] 0 | ==:true ===:false +:"0" (string)
\`\`\``,
          starterFile: "code/coercion-table.starter.js",
          solutionFile: "code/coercion-table.solution.js",
          hints: ["+ concatenates when either side becomes a string — an array becomes its join(\",\").", "null becomes 0 in arithmetic but equals only undefined under ==."],
          cases: [
            { stdin: "3\n1 one\nnull 0\n[] 0\n", expected: '1 one | ==:false ===:false +:"1one" (string)\nnull 0 | ==:false ===:false +:0 (number)\n[] 0 | ==:true ===:false +:"0" (string)\n' },
            { stdin: "2\ntrue 1\nempty 0\n", expected: 'true 1 | ==:true ===:false +:2 (number)\nempty 0 | ==:true ===:false +:"0" (string)\n' },
            { stdin: "2\n[1,2] 3\nundefined 1\n", expected: '[1,2] 3 | ==:false ===:false +:"1,23" (string)\nundefined 1 | ==:false ===:false +:NaN (number)\n', hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "JavaScript's primitive types number…",
          options: ["Five", "Seven — undefined, null, boolean, number, bigint, string, symbol", "Six", "Eight"],
          answer: 1,
          explanation: "Plus object, the eighth kind of value.",
        },
        {
          prompt: "`typeof null` and `typeof []`…",
          options: ["`\"null\"` and `\"array\"`", "Both `\"object\"`", "`\"object\"` and `\"array\"`", "`\"undefined\"` and `\"object\"`"],
          answer: 1,
          explanation: "The two `typeof` traps; use `=== null` and `Array.isArray`.",
        },
        {
          prompt: "`9007199254740992 + 1` in JavaScript equals…",
          options: ["`9007199254740993`", "`9007199254740992` — past 2⁵³ integers are no longer exact", "`Infinity`", "`NaN`"],
          answer: 1,
          explanation: "`BigInt` for exact big integers.",
        },
        {
          prompt: "`Number(\"\")` and `Number(\"  \")` are…",
          options: ["`NaN` and `NaN`", "`0` and `0`", "`0` and `NaN`", "Throws"],
          answer: 1,
          explanation: "Empty and whitespace-only strings convert to 0 — a common surprise in form handling.",
        },
        {
          prompt: "`parseInt(\"08\", 10)` is…",
          options: ["`0`", "`8`", "`NaN`", "`\"08\"`"],
          answer: 1,
          explanation: "Always pass the radix; historically a leading zero meant octal.",
        },
        {
          prompt: "`\"😀\".split(\"\").length` is…",
          options: ["`1`", "`2` — split by code unit tears the surrogate pair", "`0`", "Throws"],
          answer: 1,
          explanation: "`[...\"😀\"].length` is 1.",
        },
        {
          prompt: "How many values are falsy?",
          options: ["Five", "Eight", "Ten", "Infinitely many"],
          answer: 1,
          explanation: "`false, 0, -0, 0n, \"\", null, undefined, NaN`.",
        },
        {
          prompt: "`[] == ![]` is…",
          options: ["`false`", "`true` — `![]` is `false` → 0; `[]` → `\"\"` → 0", "A `TypeError`", "`undefined`"],
          answer: 1,
          explanation: "Derivable from the rules, and never to be written.",
        },
        {
          prompt: "`x ?? y` returns `y` when `x` is…",
          options: ["Any falsy value", "`null` or `undefined` only", "`0`", "`\"\"`"],
          answer: 1,
          explanation: "`||` is the one that replaces every falsy value.",
        },
        {
          prompt: "`\"3\" * \"4\"` is…",
          options: ["`\"34\"`", "`12` — every arithmetic operator except `+` converts to numbers", "`NaN`", "`\"12\"`"],
          answer: 1,
          explanation: "`\"3\" + \"4\"` would be `\"34\"`.",
        },
        {
          prompt: "`let` versus `var` hoisting:",
          options: ["Neither is hoisted", "Both are hoisted; `var` is initialised to `undefined`, `let` stays uninitialised until its line (TDZ)", "Only `var` is hoisted", "Only `let` is hoisted"],
          answer: 1,
          explanation: "Hence `undefined` versus `ReferenceError` on early access.",
        },
        {
          prompt: "Which should be the default declaration in modern code?",
          options: ["`var`", "`let`", "`const`", "None — implicit globals"],
          answer: 2,
          explanation: "`const` documents that a binding never changes; `let` when it must; `var` never.",
        },
      ],
    },
  ],
});

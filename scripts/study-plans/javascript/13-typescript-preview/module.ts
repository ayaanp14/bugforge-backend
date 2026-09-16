import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "typescript-preview",
  title: "TypeScript preview",
  blurb: "Erased types and inference; any, unknown and never; interfaces, structural typing and discriminated unions; generics, keyof and the utility types; narrowing, type guards and assertions; tsconfig, declaration files, builds and migration.",
  icon: "plug",
  overview: `TypeScript is the JavaScript most teams write now: the same language with a static type system layered on top, checked at build time and erased before the code runs. The type system is worth learning as its own subject — inference and widening, structural assignability, discriminated unions, generics constrained by \`keyof\`, narrowing by control flow — because those rules are what the compiler applies to every line, and understanding them turns error messages from noise into instructions.

This module is a preview, not a full course, and it is judged as JavaScript: Node runs the exercises, so each one models a piece of the type system at run time — a function that infers what \`const\`/\`let\`/\`as const\` would give, a structural assignability checker with the excess-property rule, utility types as operations on schemas, a narrowing engine over a union, guards whose bodies are the runtime checks the types rely on. The lessons cover the basics and the three special types; object types, interfaces and unions; functions, generics and utility types; narrowing and guards; and the practical layer of tsconfig, declaration files, builds and migration.

The checkpoint builds a schema library that validates values and prints the type it would infer, an exhaustive state machine over discriminated-union states and events, and a declaration-file generator — three tasks that show the type system and the runtime meeting in the middle.`,
  lessons: [
    {
      slug: "types-inference-and-the-three-special-types",
      file: "01-types-inference-and-the-three-special-types.md",
      exercises: [
        {
          title: "What would TypeScript infer?",
          prompt: `Each line is a declaration: \`const x = 5\`, \`let y = "hi"\`, \`const arr = [1, "a"]\`, \`const t = [1, 2] as const\`, \`const o = { "mode": "dark", "n": 1 }\`, \`let u\`. Using the starter's \`typeOf(value, { literal, readonly })\`, print \`<name>: <type>\` following TypeScript's rules: \`const\` keeps a **primitive** literal type (\`5\`, \`"a"\`), \`let\` widens it (\`number\`, \`string\`); array elements always widen and join into a union in the order string, number, boolean, null, undefined; object properties widen unless \`as const\`, which keeps literals, marks properties \`readonly\` and turns arrays into readonly tuples; a declaration with no initialiser is \`any\`; an empty array is \`never[]\`.

Example →
\`\`\`
x: 5
y: string
arr: (string | number)[]
t: readonly [1, 2]
o: { mode: string; n: number }
o2: { readonly mode: "dark" }
u: any   (declared without an initialiser: implicit any)
\`\`\``,
          starterFile: "code/inference-table.starter.js",
          solutionFile: "code/inference-table.solution.js",
          hints: ["Detect a trailing `as const` before JSON-parsing the right-hand side (single quotes become double quotes).", "literal = asConst || (keyword === \"const\" && value is a primitive)."],
          cases: [
            { stdin: "const x = 5\nlet y = \"hi\"\nconst arr = [1, \"a\"]\nconst t = [1, 2] as const\nlet flag = true\nconst o = { \"mode\": \"dark\", \"n\": 1 }\nconst o2 = { \"mode\": \"dark\" } as const\nlet u\nconst z = null\nlet empty = []\n", expected: "x: 5\ny: string\narr: (string | number)[]\nt: readonly [1, 2]\nflag: boolean\no: { mode: string; n: number }\no2: { readonly mode: \"dark\" }\nu: any   (declared without an initialiser: implicit any)\nz: null\nempty: never[]\n" },
            { stdin: "const s = 'a'\nlet b = false\nconst mixed = [true, null, 1]\n", expected: "s: \"a\"\nb: boolean\nmixed: (number | boolean | null)[]\n", hidden: true },
          ],
        },
        {
          title: "unknown at the boundary",
          prompt: `Each line is JSON — treat the parsed value as \`unknown\` and narrow it step by step in \`handle(data)\`: \`null\` → \`null: nothing to do\`; a string → \`string: <length> chars, upper=<UPPER>\`; a number → \`number: <2dp>\` or \`number: not finite\`; a boolean → \`boolean: yes|no\`; an array → \`array: <n> items, first=<JSON>\`; an object with a \`kind\` → dispatch \`circle\` (\`Shape circle: area=<2dp>\`) and \`square\` (\`Shape square: area=<n>\`) with \`assertNever\` in the default (it throws \`unhandled value: <JSON>\`); any other object → \`object: keys=<comma list or (none)>\`. Print \`narrowed to <result>\`, or \`error: invalid JSON\` / \`error: <message>\`.

Example: \`"hello"\`, \`42\`, \`{"kind":"circle","r":2}\`, \`{"kind":"hexagon","sides":6}\`, \`not json\` →
\`\`\`
narrowed to string: 5 chars, upper=HELLO
narrowed to number: 42.00
narrowed to Shape circle: area=12.57
error: unhandled value: {"kind":"hexagon","sides":6}
error: invalid JSON
\`\`\``,
          starterFile: "code/unknown-at-the-boundary.starter.js",
          solutionFile: "code/unknown-at-the-boundary.solution.js",
          hints: ["Order the checks so each one removes possibilities: null, then typeof primitives, then Array.isArray, then objects.", "The catch binds unknown too — use instanceof SyntaxError before deciding the message."],
          cases: [
            { stdin: "\"hello\"\n42\ntrue\nnull\n[1,2,3]\n{\"kind\":\"circle\",\"r\":2}\n{\"kind\":\"square\",\"s\":3}\n{\"kind\":\"hexagon\",\"sides\":6}\n{\"id\":1,\"name\":\"x\"}\nnot json\n", expected: "narrowed to string: 5 chars, upper=HELLO\nnarrowed to number: 42.00\nnarrowed to boolean: yes\nnarrowed to null: nothing to do\nnarrowed to array: 3 items, first=1\nnarrowed to Shape circle: area=12.57\nnarrowed to Shape square: area=9\nerror: unhandled value: {\"kind\":\"hexagon\",\"sides\":6}\nnarrowed to object: keys=id,name\nerror: invalid JSON\n" },
            { stdin: "{}\n1e999\n", expected: "narrowed to object: keys=(none)\nnarrowed to number: not finite\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "At run time, a TypeScript type annotation…",
          options: ["Is checked on every call", "Does not exist — types are erased at build; the emitted JavaScript has no trace of them", "Becomes a runtime assertion", "Slows the program"],
          answer: 1,
          explanation: "Which is why values from JSON or users must be validated at the boundary.",
        },
        {
          prompt: "`const a = \"left\"` versus `let b = \"left\"` infer…",
          options: ["Both `string`", "`\"left\"` (a literal type) and `string` (widened, since `b` may be reassigned)", "Both `\"left\"`", "`any`"],
          answer: 1,
          explanation: "`as const` keeps literals inside objects and arrays too.",
        },
        {
          prompt: "`any` versus `unknown`:",
          options: ["Synonyms", "Both accept every value; `any` lets you do anything with it unchecked, `unknown` forces you to narrow before use", "`unknown` accepts fewer values", "`any` is stricter"],
          answer: 1,
          explanation: "`unknown` at boundaries; `any` only as a local, deliberate escape hatch.",
        },
        {
          prompt: "`never` is the type of…",
          options: ["Optional values", "No value at all: a function that never returns, or a variable after every union member has been narrowed away — the exhaustiveness tool", "`null`", "Empty strings"],
          answer: 1,
          explanation: "Assigning the leftover to `never` in a `default` fails to compile when a case is missing.",
        },
        {
          prompt: "To get most of TypeScript's checking in a plain `.js` file you add…",
          options: ["A `.ts` extension only", "`// @ts-check` at the top (or `checkJs`) with JSDoc annotations", "A `tsconfig.json`", "Nothing — it is automatic"],
          answer: 1,
          explanation: "The usual first step of a migration.",
        },
      ],
    },
    {
      slug: "objects-interfaces-and-unions",
      file: "02-objects-interfaces-and-unions.md",
      exercises: [
        {
          title: "Structural assignability, with the excess-property rule",
          prompt: `Line 1 is a type as JSON — property → type, where a trailing \`?\` marks optional and types are \`string\`, \`number\`, \`boolean\` or \`T[]\`. Each following line is \`fresh <json>\` (an object literal passed directly) or \`var <json>\` (the same object via a variable). Report, in property order: \`Property 'k' is missing\` for absent required properties; \`Type '<actual>' is not assignable to type '<expected>' at 'k'\` for mismatches (an array's actual type is the union of its element types plus \`[]\`); and — for \`fresh\` only — \`Object literal may only specify known properties, and 'k' does not exist\`. Print \`<mode> <JSON>: ok\` or \`… : not assignable - <problems joined by ; >\`.

Example with \`{"name":"string","age":"number","email?":"string","tags":"string[]"}\`:
\`\`\`
fresh {"name":"Ada","age":36,"tags":["a"],"zip":"123"}: not assignable - Object literal may only specify known properties, and 'zip' does not exist
var {"name":"Ada","age":36,"tags":["a"],"zip":"123"}: ok
fresh {"name":"Ada","age":"36","tags":[1]}: not assignable - Type 'string' is not assignable to type 'number' at 'age'; Type 'number[]' is not assignable to type 'string[]' at 'tags'
\`\`\`
The same object is rejected as a fresh literal and accepted through a variable — structural typing with one nominal-ish exception.`,
          starterFile: "code/structural-assignability.starter.js",
          solutionFile: "code/structural-assignability.solution.js",
          hints: ["Strip the trailing ? to get the key; only fresh literals get the excess-property pass.", "For arrays, check every element against the element type."],
          cases: [
            { stdin: "{\"name\":\"string\",\"age\":\"number\",\"email?\":\"string\",\"tags\":\"string[]\"}\nfresh {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"]}\nfresh {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"],\"zip\":\"123\"}\nvar {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"],\"zip\":\"123\"}\nfresh {\"name\":\"Ada\",\"tags\":[]}\nfresh {\"name\":\"Ada\",\"age\":\"36\",\"tags\":[1]}\nvar {\"name\":\"Bo\",\"age\":1,\"email\":\"b@x\",\"tags\":[]}\n", expected: "fresh {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"]}: ok\nfresh {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"],\"zip\":\"123\"}: not assignable - Object literal may only specify known properties, and 'zip' does not exist\nvar {\"name\":\"Ada\",\"age\":36,\"tags\":[\"a\"],\"zip\":\"123\"}: ok\nfresh {\"name\":\"Ada\",\"tags\":[]}: not assignable - Property 'age' is missing\nfresh {\"name\":\"Ada\",\"age\":\"36\",\"tags\":[1]}: not assignable - Type 'string' is not assignable to type 'number' at 'age'; Type 'number[]' is not assignable to type 'string[]' at 'tags'\nvar {\"name\":\"Bo\",\"age\":1,\"email\":\"b@x\",\"tags\":[]}: ok\n" },
            { stdin: "{\"id\":\"number\"}\nfresh {\"id\":1}\nvar {}\n", expected: "fresh {\"id\":1}: ok\nvar {}: not assignable - Property 'id' is missing\n", hidden: true },
          ],
        },
        {
          title: "Dispatch on a discriminant, exhaustively",
          prompt: `Write \`area(shape)\` for \`{ kind: "circle", r } | { kind: "rect", w, h } | { kind: "square", s }\` and \`render(state)\` for \`{ status: "loading" } | { status: "error", error } | { status: "ready", data }\` (→ \`spinner\`, \`error banner: <error>\`, \`list of <data.length>\`), each a \`switch\` on the discriminant with \`assertNever\` in the \`default\` (it throws \`unhandled variant: <JSON>\`). For each JSON line: objects with \`kind\` print \`<kind>: area=<2dp>\`, objects with \`status\` print \`<status>: <render>\`, anything else \`no discriminant: cannot dispatch\`; thrown errors print \`error: <message>\`.

Example: \`{"kind":"circle","r":1}\`, \`{"kind":"triangle","b":1,"h":2}\`, \`{"status":"error","error":"timeout"}\`, \`{"status":"paused"}\` →
\`\`\`
circle: area=3.14
error: unhandled variant: {"kind":"triangle","b":1,"h":2}
error: error banner: timeout
error: unhandled variant: {"status":"paused"}
\`\`\``,
          starterFile: "code/discriminated-union-dispatch.starter.js",
          solutionFile: "code/discriminated-union-dispatch.solution.js",
          hints: ["Inside each case the member's own fields are safe to read — that is what narrowing on the tag gives you.", "The default branch is where TypeScript would flag a forgotten case; at run time it catches data the types never anticipated."],
          cases: [
            { stdin: "{\"kind\":\"circle\",\"r\":1}\n{\"kind\":\"rect\",\"w\":2,\"h\":3}\n{\"kind\":\"square\",\"s\":4}\n{\"kind\":\"triangle\",\"b\":1,\"h\":2}\n{\"status\":\"loading\"}\n{\"status\":\"error\",\"error\":\"timeout\"}\n{\"status\":\"ready\",\"data\":[1,2,3]}\n{\"status\":\"paused\"}\n{\"x\":1}\n", expected: "circle: area=3.14\nrect: area=6.00\nsquare: area=16.00\nerror: unhandled variant: {\"kind\":\"triangle\",\"b\":1,\"h\":2}\nloading: spinner\nerror: error banner: timeout\nready: list of 3\nerror: unhandled variant: {\"status\":\"paused\"}\nno discriminant: cannot dispatch\n" },
            { stdin: "{\"kind\":\"square\",\"s\":2}\n", expected: "square: area=4.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`interface Named { name: string }` and `const dog = { name: \"Rex\", legs: 4 }; const n: Named = dog;`…",
          options: ["Fails — `dog` is not declared as `Named`", "Compiles — structural typing: `dog` has a `name`; extra properties are fine through a variable", "Fails because of `legs`", "Needs `implements`"],
          answer: 1,
          explanation: "Passing the object **literal** directly would trigger the excess-property check.",
        },
        {
          prompt: "A discriminated union is…",
          options: ["A union of primitives", "A union of object types sharing a literal-typed tag (`kind`, `status`); switching on the tag narrows to the member", "An enum", "An intersection"],
          answer: 1,
          explanation: "The idiomatic replacement for class hierarchies and bags of optional fields.",
        },
        {
          prompt: "`interface` versus `type`:",
          options: ["Identical in every way", "Interfaces extend and merge and suit object shapes; type aliases name anything (unions, tuples, mapped types)", "`type` is deprecated", "Only interfaces work with classes"],
          answer: 1,
          explanation: "Pick a convention and stay consistent.",
        },
        {
          prompt: "Why do most style guides prefer `type Level = \"low\" | \"high\"` to an `enum`?",
          options: ["Enums are slower", "The union is erased, structural and needs no import; enums are nominal runtime objects and numeric enums accept any number", "Enums cannot be strings", "Unions autocomplete better"],
          answer: 1,
          explanation: "Derive the union from an `as const` array when the values are also data.",
        },
        {
          prompt: "`x satisfies T` differs from `x as T` in that it…",
          options: ["Widens `x` to `T`", "Checks `x` against `T` while keeping `x`'s narrower inferred type — validation without widening", "Is a runtime check", "Only works on primitives"],
          answer: 1,
          explanation: "`const palette = {…} satisfies Record<string, string>` keeps the exact keys.",
        },
      ],
    },
    {
      slug: "functions-generics-and-utility-types",
      file: "03-functions-generics-and-utility-types.md",
      exercises: [
        {
          title: "Utility types as operations on a schema",
          prompt: `Line 1 is a schema — property → type text, with a trailing \`?\` for optional and a leading \`readonly \` for readonly. Implement the utilities as functions on schemas and print the resulting TypeScript text \`{ k: t; … }\`: \`Partial\` (add \`?\`), \`Required\` (remove it), \`Readonly\` (prefix \`readonly \`), \`Pick k k…\` (only those keys; an unknown key throws \`Type '"k"' does not satisfy the constraint 'keyof T'\`), \`Omit k k…\`, \`Record k v\` (→ \`{ [key in k]: v }\`), \`keyof\` (→ \`"a" | "b"\`, or \`never\`). Steps chain with \`|\`. Print \`<command> => <type>\` or \`<command> => error: <message>\`.

Example with \`{"id":"string","name":"string","email?":"string","age":"number"}\`:
\`\`\`
Partial => { id?: string; name?: string; email?: string; age?: number }
Pick id name => { id: string; name: string }
Omit age | Partial => { id?: string; name?: string; email?: string }
Pick id email | Readonly | keyof => "id" | "email"
Pick zip => error: Type '"zip"' does not satisfy the constraint 'keyof T'
\`\`\``,
          starterFile: "code/utility-types-on-schemas.starter.js",
          solutionFile: "code/utility-types-on-schemas.solution.js",
          hints: ["A helper base(key) that strips `readonly ` and `?` lets Pick/Omit/keyof compare plain names.", "Fold the chain: current = utility(current, args) for each step split on |."],
          cases: [
            { stdin: "{\"id\":\"string\",\"name\":\"string\",\"email?\":\"string\",\"age\":\"number\"}\nPartial\nRequired\nReadonly\nPick id name\nOmit age\nRecord status number\nkeyof\nOmit age | Partial\nPick id email | Readonly | keyof\nPick zip\nFrobnicate\n", expected: "Partial => { id?: string; name?: string; email?: string; age?: number }\nRequired => { id: string; name: string; email: string; age: number }\nReadonly => { readonly id: string; readonly name: string; readonly email?: string; readonly age: number }\nPick id name => { id: string; name: string }\nOmit age => { id: string; name: string; email?: string }\nRecord status number => { [key in status]: number }\nkeyof => \"id\" | \"name\" | \"email\" | \"age\"\nOmit age | Partial => { id?: string; name?: string; email?: string }\nPick id email | Readonly | keyof => \"id\" | \"email\"\nPick zip => error: Type '\"zip\"' does not satisfy the constraint 'keyof T'\nFrobnicate => error: unknown utility 'Frobnicate'\n" },
            { stdin: "{\"readonly id\":\"number\"}\nRequired | Partial\nkeyof\n", expected: "Required | Partial => { readonly id?: number }\nkeyof => \"id\"\n", hidden: true },
          ],
        },
        {
          title: "Generic constraints, enforced at run time",
          prompt: `Model three generic signatures as runtime-checked functions: \`first<T>(xs: T[]): T | undefined\`; \`pluck<T, K extends keyof T>(items: T[], key: K): T[K][]\` — every item must have the key, else throw \`Argument of type '"<key>"' is not assignable to parameter of type 'keyof T'\`; \`longest<T extends { length: number }>(a: T, b: T): T\` — both need a numeric \`length\`, else throw \`Argument of type '<type>' is not assignable to parameter of type '{ length: number; }'\`. Line 1 is the items array; commands \`first\` (prints the value and \`: T\` or \`: undefined (T | undefined)\`), \`pluck <key>\` (prints the array and its element type as \`<union>[]\`, \`never[]\` when empty), \`longest <json> <json>\`. Errors print the TypeScript-style message.

Example with two user records:
\`\`\`
first -> {"id":"a","name":"Ada","age":36} : T
pluck name -> ["Ada","Bob"] : string[]
pluck zip -> Argument of type '"zip"' is not assignable to parameter of type 'keyof T'
longest "abc" "de" -> "abc"
longest 1 2 -> Argument of type 'number' is not assignable to parameter of type '{ length: number; }'
\`\`\``,
          starterFile: "code/generic-constraints.starter.js",
          solutionFile: "code/generic-constraints.solution.js",
          hints: ["`K extends keyof T` is exactly `items.every((it) => key in it)` at run time.", "The `{ length: number }` constraint is a structural check: anything with a numeric length passes — strings and arrays alike."],
          cases: [
            { stdin: "[{\"id\":\"a\",\"name\":\"Ada\",\"age\":36},{\"id\":\"b\",\"name\":\"Bob\",\"age\":17}]\nfirst\npluck name\npluck age\npluck zip\nlongest \"abc\" \"de\"\nlongest [1,2,3] [4]\nlongest 1 2\n", expected: "first -> {\"id\":\"a\",\"name\":\"Ada\",\"age\":36} : T\npluck name -> [\"Ada\",\"Bob\"] : string[]\npluck age -> [36,17] : number[]\npluck zip -> Argument of type '\"zip\"' is not assignable to parameter of type 'keyof T'\nlongest \"abc\" \"de\" -> \"abc\"\nlongest [1,2,3] [4] -> [1,2,3]\nlongest 1 2 -> Argument of type 'number' is not assignable to parameter of type '{ length: number; }'\n" },
            { stdin: "[]\nfirst\npluck id\n", expected: "first -> undefined : undefined (T | undefined)\npluck id -> [] : never[]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`function pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` — `K extends keyof T` means…",
          options: ["`K` is a string", "`K` must be one of `T`'s property names, so a misspelled key is a compile error and the return type follows the property", "`K` is optional", "`K` is a subclass"],
          answer: 1,
          explanation: "`T[K]` is indexed access: the type of that property.",
        },
        {
          prompt: "`Omit<T, K>` is implemented as…",
          options: ["A compiler intrinsic", "`Pick<T, Exclude<keyof T, K>>`", "`Partial<T>` minus `K`", "`Record<K, never>`"],
          answer: 1,
          explanation: "Most utility types are small mapped or conditional types.",
        },
        {
          prompt: "A generic whose type parameter appears only in the return type…",
          options: ["Is the best design", "Cannot be inferred from a call — the caller must always pass it explicitly; usually a misplaced generic", "Is faster", "Defaults to `any`"],
          answer: 1,
          explanation: "Inference comes from the arguments.",
        },
        {
          prompt: "`Partial<User>` is typically used for…",
          options: ["Deleting users", "Update payloads where every field is optional", "Making users readonly", "Runtime validation"],
          answer: 1,
          explanation: "`Pick` for a list view, `Omit<User, \"passwordHash\">` for a public shape, `Record<Method, Handler>` for a dispatch table.",
        },
        {
          prompt: "A mapped type…",
          options: ["Is a `Map<K, V>`", "Builds a new object type by iterating `keyof` another type and transforming each property (`{ [K in keyof T]?: T[K] }`)", "Maps arrays", "Is a runtime construct"],
          answer: 1,
          explanation: "Conditional types choose with `extends ? :`; read them in library types before writing them.",
        },
      ],
    },
    {
      slug: "narrowing-and-type-guards",
      file: "04-narrowing-and-type-guards.md",
      exercises: [
        {
          title: "A narrowing engine over a union",
          prompt: `Line 1 lists the members of a union: \`string number boolean null undefined Date string[] {kind:"a"} {kind:"b"}\`. Each following line is a check: \`typeof <t>\`, \`instanceof Date\`, \`=== null\`, \`truthy\`, \`Array.isArray\`, \`in kind\`, \`kind === <v>\`. For each, compute the members remaining in the true branch and in the false branch and print \`<check> -> true: <members or never> | false: <members or never>\`. Rules: \`typeof null\` is \`"object"\`; \`truthy\` keeps \`string\`/\`number\`/\`boolean\` in **both** branches (they may be falsy), drops \`null\`/\`undefined\` from the true branch, and objects from the false branch.

Example (excerpt):
\`\`\`
typeof object -> true: null | Date | string[] | {kind:"a"} | {kind:"b"} | false: string | number | boolean | undefined
truthy -> true: string | number | boolean | Date | string[] | {kind:"a"} | {kind:"b"} | false: string | number | boolean | null | undefined
kind === a -> true: {kind:"a"} | false: string | number | boolean | null | undefined | Date | string[] | {kind:"b"}
\`\`\``,
          starterFile: "code/narrowing-engine.starter.js",
          solutionFile: "code/narrowing-engine.solution.js",
          hints: ["Describe each member once ({ typeof, isNull, isDate, isArray, kind, canBeFalsy, alwaysFalsy }) and evaluate every check against that record.", "A result of \"both\" puts the member in both branches — that is what a falsy-capable primitive does under a truthiness check."],
          cases: [
            { stdin: "string number boolean null undefined Date string[] {kind:\"a\"} {kind:\"b\"}\ntypeof string\ntypeof object\ninstanceof Date\n=== null\ntruthy\nArray.isArray\nin kind\nkind === a\n", expected: "typeof string -> true: string | false: number | boolean | null | undefined | Date | string[] | {kind:\"a\"} | {kind:\"b\"}\ntypeof object -> true: null | Date | string[] | {kind:\"a\"} | {kind:\"b\"} | false: string | number | boolean | undefined\ninstanceof Date -> true: Date | false: string | number | boolean | null | undefined | string[] | {kind:\"a\"} | {kind:\"b\"}\n=== null -> true: null | false: string | number | boolean | undefined | Date | string[] | {kind:\"a\"} | {kind:\"b\"}\ntruthy -> true: string | number | boolean | Date | string[] | {kind:\"a\"} | {kind:\"b\"} | false: string | number | boolean | null | undefined\nArray.isArray -> true: string[] | false: string | number | boolean | null | undefined | Date | {kind:\"a\"} | {kind:\"b\"}\nin kind -> true: {kind:\"a\"} | {kind:\"b\"} | false: string | number | boolean | null | undefined | Date | string[]\nkind === a -> true: {kind:\"a\"} | false: string | number | boolean | null | undefined | Date | string[] | {kind:\"b\"}\n" },
            { stdin: "string null\ntruthy\ntypeof object\n", expected: "truthy -> true: string | false: string | null\ntypeof object -> true: null | false: string\n", hidden: true },
          ],
        },
        {
          title: "Type guards and assertion functions",
          prompt: `Write \`isUser(x)\` — the runtime body of a guard \`x is User\` for \`{ id: string; name: string; email?: string }\` (name non-empty) — and \`assertIsUser(x)\` (\`asserts x is User\`) that throws \`TypeError("not a User: <reasons joined by , >")\`, with reasons \`expected an object, got <null|array|typeof>\`, \`id must be a string\`, \`name must be a non-empty string\`, \`email must be a string when present\`. For each JSON line print \`User <name>\` (plus \` <email>\` when present) or the error message. Then filter all values with the guard (\`users.filter(isUser)\` — typed \`User[]\` in TypeScript) and print \`users=<n> via filter: <ids or ->\`, and finally \`assert(users.length > 0, "at least one user required")\` printing \`first user id=<id>\` or \`assertion failed: <message>\`.

Example (excerpt):
\`\`\`
User Ada <ada@x.io>
not a User: id must be a string
not a User: name must be a non-empty string
not a User: expected an object, got string
users=2 via filter: 1,5
first user id=1
\`\`\``,
          starterFile: "code/guards-and-assertions.starter.js",
          solutionFile: "code/guards-and-assertions.solution.js",
          hints: ["Write one userProblems(x) that returns the list of reasons; the guard is `problems.length === 0`, the assertion throws them.", "A guard that checks less than it claims is an `as` in disguise — check every field the type promises."],
          cases: [
            { stdin: "{\"id\":\"1\",\"name\":\"Ada\",\"email\":\"ada@x.io\"}\n{\"id\":2,\"name\":\"Bob\"}\n{\"id\":\"3\",\"name\":\"\"}\n\"just a string\"\n{\"id\":\"4\",\"name\":\"Cy\",\"email\":42}\nnull\n{\"id\":\"5\",\"name\":\"Dee\"}\n", expected: "User Ada <ada@x.io>\nnot a User: id must be a string\nnot a User: name must be a non-empty string\nnot a User: expected an object, got string\nnot a User: email must be a string when present\nnot a User: expected an object, got null\nUser Dee\nusers=2 via filter: 1,5\nfirst user id=1\n" },
            { stdin: "[]\n{}\n", expected: "not a User: expected an object, got array\nnot a User: id must be a string, name must be a non-empty string\nusers=0 via filter: -\nassertion failed: at least one user required\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`if (typeof x === \"object\") x.foo` on `x: object | null` fails because…",
          options: ["Objects have no properties", "`typeof null` is `\"object\"`, so `null` survives the check — test `x !== null` too", "`typeof` does not narrow", "`foo` is misspelled"],
          answer: 1,
          explanation: "Truthiness narrowing has the mirror trap: it drops `0` and `\"\"`.",
        },
        {
          prompt: "A function declared `function isUser(x: unknown): x is User`…",
          options: ["Is checked by the compiler for correctness", "Narrows `x` to `User` where it returns true — its body is ordinary JavaScript that **you** must make correct", "Converts `x` to a User", "Throws on failure"],
          answer: 1,
          explanation: "`asserts x is User` is the throwing variant that narrows for the rest of the scope.",
        },
        {
          prompt: "`const user = JSON.parse(text) as User`…",
          options: ["Validates the JSON", "Performs no check at all — a promise the compiler cannot verify; validate with a guard or schema instead", "Throws on mismatch", "Is the recommended pattern"],
          answer: 1,
          explanation: "`as` and `!` compile to nothing.",
        },
        {
          prompt: "`default: { const x: never = value; … }` in a switch over a union…",
          options: ["Is dead code", "Fails to compile when a union member is not handled — exhaustiveness checking", "Runs for every case", "Is a runtime check only"],
          answer: 1,
          explanation: "At run time the branch also catches data the types never anticipated.",
        },
        {
          prompt: "Narrowing is lost after…",
          options: ["Nothing — it persists", "A function call, an `await` or an assignment that could have changed the value — extract to a `const` to keep it", "A semicolon", "A comment"],
          answer: 1,
          explanation: "Control-flow analysis resets to the declared type when it cannot prove the value unchanged.",
        },
      ],
    },
    {
      slug: "typescript-in-practice",
      file: "05-typescript-in-practice.md",
      exercises: [
        {
          title: "A tsconfig doctor",
          prompt: `Read a \`tsconfig.json\` and print findings, each on its own line as \`- <error|warn|recommend|info>: <message>\`, preceded by \`tsconfig: <n> finding(s)\` (and \`- looks good\` when none). Rules, in order: \`strict\` not true → error (\`strict is off - enable it (implies noImplicitAny, strictNullChecks, strictFunctionTypes, useUnknownInCatchVariables)\`); missing \`noUncheckedIndexedAccess\`, \`skipLibCheck\`, \`isolatedModules\` → one recommend each; no \`target\` → warn; a target of ES3–ES2019 → warn (\`target <t> is older than the runtime supports - Node 16 runs ES2021\`); \`module\`/\`moduleResolution\` where exactly one is NodeNext/Node16 → warn that they disagree; \`module: commonjs\` without \`esModuleInterop\` → warn; no \`include\`/\`files\` → warn; \`outDir\` without \`rootDir\` → recommend; \`noEmit\` with \`outDir\` → info.

Example: \`{"compilerOptions":{"strict":false,"target":"es5","module":"commonjs","moduleResolution":"nodenext","outDir":"dist"}}\` → 9 findings, beginning
\`\`\`
tsconfig: 9 finding(s)
- error: strict is off - enable it (implies noImplicitAny, strictNullChecks, strictFunctionTypes, useUnknownInCatchVariables)
- recommend: noUncheckedIndexedAccess: arr[i] becomes T | undefined and catches the most common crash
\`\`\``,
          starterFile: "code/tsconfig-doctor.starter.js",
          solutionFile: "code/tsconfig-doctor.solution.js",
          hints: ["Compare module and moduleResolution case-insensitively; the mismatch is when exactly one of them is nodenext/node16.", "Use the exact message texts from the prompt — the checker compares output literally."],
          cases: [
            { stdin: "{\"compilerOptions\":{\"strict\":false,\"target\":\"es5\",\"module\":\"commonjs\",\"moduleResolution\":\"nodenext\",\"outDir\":\"dist\"}}", expected: "tsconfig: 9 finding(s)\n- error: strict is off - enable it (implies noImplicitAny, strictNullChecks, strictFunctionTypes, useUnknownInCatchVariables)\n- recommend: noUncheckedIndexedAccess: arr[i] becomes T | undefined and catches the most common crash\n- recommend: skipLibCheck: do not re-check node_modules declaration files\n- recommend: isolatedModules: required for esbuild/swc/tsx style transpilers\n- warn: target es5 is older than the runtime supports - Node 16 runs ES2021\n- warn: module commonjs and moduleResolution nodenext disagree\n- warn: commonjs without esModuleInterop: default imports from CJS packages misbehave\n- warn: no include/files - every .ts under the folder is compiled, node_modules aside\n- recommend: set rootDir alongside outDir so the output layout is predictable\n" },
            { stdin: "{\"compilerOptions\":{\"strict\":true,\"target\":\"ES2022\",\"module\":\"NodeNext\",\"moduleResolution\":\"NodeNext\",\"noUncheckedIndexedAccess\":true,\"skipLibCheck\":true,\"isolatedModules\":true,\"outDir\":\"dist\",\"rootDir\":\"src\"},\"include\":[\"src\"]}", expected: "tsconfig: 0 finding(s)\n- looks good\n", hidden: true },
          ],
        },
        {
          title: "Decode the compiler's errors",
          prompt: `Each line is a TypeScript diagnostic beginning with its code. Build a rule table and print \`<code>: <hint>\`: TS2322 (\`a '<X>' was given where a '<Y>' is expected - fix the value or the type, do not cast\`), TS2345 (\`the argument is a '<A>' but the parameter wants '<B>'\`), TS2339 (\`no '<p>' on '<T>' - a typo, or narrow the union first\`), TS7006 (\`annotate parameter '<x>' (noImplicitAny)\`), TS2531/TS18047/TS18048 (\`'<expr>' may be <null|undefined> - check it, use ?. / ??, or handle the case (strictNullChecks)\`, with \`the value\` when no expression is named), TS2307 (\`install '<m>' (and its @types), or fix the path/extension, or add a declaration\`), TS2564 (\`initialise '<p>' in the constructor, make it optional, or use ! when a framework assigns it\`), TS2352 (\`'<A>' and '<B>' do not overlap - the 'as' is hiding a logic error\`), TS1259 (\`enable esModuleInterop or use import * as x from '<m>'\`); anything else → \`no rule - read the last 'is not assignable' line of the message for the real mismatch\`.

Example (excerpt):
\`\`\`
TS2339: no 'nmae' on 'User' - a typo, or narrow the union first
TS18048: 'user.email' may be undefined - check it, use ?. / ??, or handle the case (strictNullChecks)
TS2589: no rule - read the last 'is not assignable' line of the message for the real mismatch
\`\`\``,
          starterFile: "code/decode-ts-errors.starter.js",
          solutionFile: "code/decode-ts-errors.solution.js",
          hints: ["Anchor each regex at the code (^TS2322: ...) and capture the quoted names with '(.+?)'.", "The null/undefined family has two message shapes: 'Object is possibly' and \"'expr' is possibly\" — one regex with an optional group covers both."],
          cases: [
            { stdin: "TS2322: Type 'string' is not assignable to type 'number'.\nTS2339: Property 'nmae' does not exist on type 'User'.\nTS2345: Argument of type '\"zip\"' is not assignable to parameter of type 'keyof User'.\nTS7006: Parameter 'x' implicitly has an 'any' type.\nTS18048: 'user.email' is possibly 'undefined'.\nTS2531: Object is possibly 'null'.\nTS2307: Cannot find module 'lodahs' or its corresponding type declarations.\nTS2564: Property 'db' has no initializer and is not definitely assigned in the constructor.\nTS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other.\nTS2589: Type instantiation is excessively deep and possibly infinite.\n", expected: "TS2322: a 'string' was given where a 'number' is expected - fix the value or the type, do not cast\nTS2339: no 'nmae' on 'User' - a typo, or narrow the union first\nTS2345: the argument is a '\"zip\"' but the parameter wants 'keyof User'\nTS7006: annotate parameter 'x' (noImplicitAny)\nTS18048: 'user.email' may be undefined - check it, use ?. / ??, or handle the case (strictNullChecks)\nTS2531: the value may be null - check it, use ?. / ??, or handle the case (strictNullChecks)\nTS2307: install 'lodahs' (and its @types), or fix the path/extension, or add a declaration\nTS2564: initialise 'db' in the constructor, make it optional, or use ! when a framework assigns it\nTS2352: 'string' and 'number' do not overlap - the 'as' is hiding a logic error\nTS2589: no rule - read the last 'is not assignable' line of the message for the real mismatch\n" },
            { stdin: "TS1259: Module '\"fs\"' can only be default-imported using the 'esModuleInterop' flag\n", expected: "TS1259: enable esModuleInterop or use import * as x from '\"fs\"'\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"strict\": true` in tsconfig…",
          options: ["Only forbids `any`", "Turns on the whole strict family — `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `useUnknownInCatchVariables` and more", "Slows compilation only", "Is the default"],
          answer: 1,
          explanation: "Turning it off to silence errors removes most of TypeScript's value.",
        },
        {
          prompt: "A `.d.ts` file contains…",
          options: ["Compiled JavaScript", "Type declarations without implementation — how the compiler knows about libraries and globals (`@types/*`, `declare module`)", "Tests", "Source maps"],
          answer: 1,
          explanation: "`tsc --declaration` emits them for your own package.",
        },
        {
          prompt: "A project built with esbuild but without `tsc --noEmit` in CI…",
          options: ["Is fully checked", "Ships type errors — esbuild strips types without checking them", "Cannot build", "Is slower"],
          answer: 1,
          explanation: "Transpile fast, type-check separately.",
        },
        {
          prompt: "The recommended way to migrate a JavaScript codebase is…",
          options: ["Rewrite everything as `.ts` at once", "Incrementally: `allowJs`/`checkJs` with JSDoc, rename leaf files first, enable strict flags one at a time, drive `any` to zero", "Add `any` everywhere", "Start with `strict: true` on all files"],
          answer: 1,
          explanation: "TypeScript accepts a mixed codebase precisely for this.",
        },
        {
          prompt: "`z.infer<typeof UserSchema>`…",
          options: ["Validates at run time", "Derives the static type from a runtime schema, so one definition gives both validation and the type", "Is a type guard", "Compiles the schema"],
          answer: 1,
          explanation: "The bridge between erased types and data from outside.",
        },
      ],
    },
    {
      slug: "typescript-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A schema builder that validates and infers",
          prompt: `Line 1 is a schema DSL: space-separated \`key:type\` fields where a trailing \`?\` on the key means optional and a type is \`string\`, \`number\`, \`boolean\`, a \`T[]\` array, or a union of string literals \`"admin"|"user"\`. Compile it, print \`type = { key: type; key?: type; … }\` in TypeScript syntax (a literal union in an array is parenthesised), then \`parse\` each following JSON line collecting **every** problem: \`<key>: required\`, \`<path>: expected <type>, got <string|number|boolean|null|array>\`, \`<path>: expected <"a" | "b">, got <JSON>\`, with array items addressed as \`tags[1]\`; a non-object root gives \`<root>: expected an object\`. Print \`ok <JSON>\` or \`error <problems joined by " | ">\`.

Example: \`name:string age:number email?:string tags:string[] role:"admin"|"user"\` →
\`\`\`
type = { name: string; age: number; email?: string; tags: string[]; role: "admin" | "user" }
ok {"name":"Ada","age":36,"tags":["x"],"role":"admin"}
error age: expected number, got string | tags[1]: expected string, got number | role: expected "admin" | "user", got "guest"
error name: required
error <root>: expected an object
\`\`\``,
          starterFile: "code/schema-builder.starter.js",
          solutionFile: "code/schema-builder.solution.js",
          hints: ["Compile types recursively: strip a trailing [] for arrays, split on | for literal unions, else a primitive kind.", "checkType(value, type, path, errors) pushes rather than throws so every problem is reported."],
          cases: [
            { stdin: "name:string age:number email?:string tags:string[] role:\"admin\"|\"user\"\n{\"name\":\"Ada\",\"age\":36,\"tags\":[\"x\"],\"role\":\"admin\"}\n{\"name\":\"Bob\",\"age\":\"17\",\"tags\":[\"x\",1],\"role\":\"guest\"}\n{\"age\":1,\"tags\":[],\"role\":\"user\"}\n[1]\n{\"name\":\"Cy\",\"age\":2,\"email\":\"c@x\",\"tags\":[],\"role\":\"user\"}\n", expected: "type = { name: string; age: number; email?: string; tags: string[]; role: \"admin\" | \"user\" }\nok {\"name\":\"Ada\",\"age\":36,\"tags\":[\"x\"],\"role\":\"admin\"}\nerror age: expected number, got string | tags[1]: expected string, got number | role: expected \"admin\" | \"user\", got \"guest\"\nerror name: required\nerror <root>: expected an object\nok {\"name\":\"Cy\",\"age\":2,\"email\":\"c@x\",\"tags\":[],\"role\":\"user\"}\n" },
            { stdin: "n:number\n{\"n\":1}\n{\"n\":\"1\"}\n", expected: "type = { n: number }\nok {\"n\":1}\nerror n: expected number, got string\n", hidden: true },
          ],
        },
        {
          title: "An exhaustive state machine",
          prompt: `States: \`{ status: "idle" }\` | \`{ status: "loading", attempt }\` | \`{ status: "success", data }\` | \`{ status: "failure", error, attempt }\`. Events: \`FETCH\`, \`RESOLVE <data>\`, \`REJECT <error>\`, \`RETRY\`, \`RESET\`. Write \`transition(state, event)\` switching on \`event.type\`: FETCH from idle → loading(1); RESOLVE from loading → success; REJECT from loading → failure (keeping the attempt); RETRY from failure → loading(attempt + 1); RESET → idle from anywhere; any other combination returns the **same** state object; an unknown event type reaches \`assertNever\` (\`unhandled: <JSON of the event>\`). Print \`<TYPE>: <before> -> <after>\` with \` (ignored)\` when the state object did not change, or \`<TYPE>: <error message>\`; describe states as \`idle\`, \`loading(attempt n)\`, \`success(<JSON data>)\`, \`failure(<error>, attempt n)\`.

Example: \`FETCH\`, \`FETCH\`, \`REJECT timeout\`, \`RETRY\`, \`RESOLVE {"items":3}\`, \`RESET\`, \`EXPLODE\` →
\`\`\`
FETCH: idle -> loading(attempt 1)
FETCH: loading(attempt 1) -> loading(attempt 1) (ignored)
REJECT: loading(attempt 1) -> failure(timeout, attempt 1)
RETRY: failure(timeout, attempt 1) -> loading(attempt 2)
RESOLVE: loading(attempt 2) -> success("{\\"items\\":3}")
RESET: success("{\\"items\\":3}") -> idle
EXPLODE: unhandled: {"type":"EXPLODE"}
\`\`\``,
          starterFile: "code/state-machine.starter.js",
          solutionFile: "code/state-machine.solution.js",
          hints: ["Return `state` itself (not a copy) for a non-applicable event so the caller can detect it by reference.", "The data of RESOLVE is the rest of the line as a string; describe() prints it with JSON.stringify."],
          cases: [
            { stdin: "FETCH\nFETCH\nREJECT timeout\nRETRY\nRESOLVE {\"items\":3}\nRETRY\nRESET\nEXPLODE\nRESOLVE x\n", expected: "FETCH: idle -> loading(attempt 1)\nFETCH: loading(attempt 1) -> loading(attempt 1) (ignored)\nREJECT: loading(attempt 1) -> failure(timeout, attempt 1)\nRETRY: failure(timeout, attempt 1) -> loading(attempt 2)\nRESOLVE: loading(attempt 2) -> success(\"{\\\"items\\\":3}\")\nRETRY: success(\"{\\\"items\\\":3}\") -> success(\"{\\\"items\\\":3}\") (ignored)\nRESET: success(\"{\\\"items\\\":3}\") -> idle\nEXPLODE: unhandled: {\"type\":\"EXPLODE\"}\nRESOLVE: idle -> idle (ignored)\n" },
            { stdin: "RESOLVE early\nFETCH\nRESOLVE ok\n", expected: "RESOLVE: idle -> idle (ignored)\nFETCH: idle -> loading(attempt 1)\nRESOLVE: loading(attempt 1) -> success(\"ok\")\n", hidden: true },
          ],
        },
        {
          title: "Generate a declaration file",
          prompt: `The input is a JSON object describing a module's exports: a primitive, array or plain-object value is a constant; \`{"fn": <arity>}\` is a function; \`{"class": [fields], "methods": [names]}\` is a class. Infer types the way a declaration emitter would — \`string\`, \`number\`, \`boolean\`, \`null\`, arrays as \`T[]\` or \`(A | B)[]\` in first-seen order (\`unknown[]\` when empty), objects as \`{ k: T; … }\` — and print one declaration per export in key order: \`export declare const NAME: T;\`, \`export declare function f(arg0: unknown, arg1: unknown): unknown;\`, and multi-line \`export declare class C {\` with \`  field: unknown;\` and \`  method(): unknown;\` lines and \`}\` (an empty class prints \`{}\` on one line).

Example (excerpt):
\`\`\`
export declare const VERSION: string;
export declare const flags: { debug: boolean; level: string };
export declare const mixed: (number | string | null)[];
export declare function add(arg0: unknown, arg1: unknown): unknown;
export declare class Point {
  x: unknown;
  y: unknown;
  dist(): unknown;
  toString(): unknown;
}
export declare class Empty {}
\`\`\``,
          starterFile: "code/dts-generator.starter.js",
          solutionFile: "code/dts-generator.solution.js",
          hints: ["Detect the two descriptors first (typeof value.fn === \"number\", Array.isArray(value.class)); everything else is a constant with an inferred type.", "Array.from({ length: arity }, (_, i) => `arg${i}: unknown`) builds the parameter list."],
          cases: [
            { stdin: "{\"VERSION\":\"1.2.3\",\"MAX\":10,\"flags\":{\"debug\":false,\"level\":\"info\"},\"names\":[\"a\",\"b\"],\"mixed\":[1,\"a\",null],\"empty\":[],\"add\":{\"fn\":2},\"noop\":{\"fn\":0},\"Point\":{\"class\":[\"x\",\"y\"],\"methods\":[\"dist\",\"toString\"]},\"Empty\":{\"class\":[]}}", expected: "export declare const VERSION: string;\nexport declare const MAX: number;\nexport declare const flags: { debug: boolean; level: string };\nexport declare const names: string[];\nexport declare const mixed: (number | string | null)[];\nexport declare const empty: unknown[];\nexport declare function add(arg0: unknown, arg1: unknown): unknown;\nexport declare function noop(): unknown;\nexport declare class Point {\n  x: unknown;\n  y: unknown;\n  dist(): unknown;\n  toString(): unknown;\n}\nexport declare class Empty {}\n" },
            { stdin: "{\"answer\":42}", expected: "export declare const answer: number;\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`let x = 5` then `x = \"a\"`…",
          options: ["Compiles — `let` is dynamic", "Fails — `x` was inferred as `number` from its initialiser", "Compiles with a warning", "Makes `x` `any`"],
          answer: 1,
          explanation: "Inference assigns the widened type once; annotate `let x: number | string` if both are intended.",
        },
        {
          prompt: "`string & number` is…",
          options: ["`string | number`", "`never` — no value is both; conflicting intersections collapse", "`any`", "An error"],
          answer: 1,
          explanation: "A common source of surprise `never`s in intersected object types.",
        },
        {
          prompt: "Excess-property checking applies when…",
          options: ["Always", "An object **literal** is written directly where a type is expected — the same object via a variable is accepted", "Using `interface` only", "Never"],
          answer: 1,
          explanation: "It is there to catch typos, not to make types nominal.",
        },
        {
          prompt: "`import type { User } from \"./types\"`…",
          options: ["Imports the runtime value", "Is erased entirely — required by isolated-module transpilers when the import is only used as a type", "Is slower", "Is a syntax error"],
          answer: 1,
          explanation: "`import { type Config, loadConfig }` mixes both in one statement.",
        },
        {
          prompt: "`Record<\"GET\" | \"POST\", Handler>`…",
          options: ["Is an array", "Is an object type with exactly those two keys, each a `Handler` — a typed dispatch table", "Is a `Map`", "Allows any string key"],
          answer: 1,
          explanation: "`Record<string, T>` is the open-keyed dictionary form.",
        },
        {
          prompt: "`ReturnType<typeof makeStore>`…",
          options: ["Calls `makeStore`", "Names the type of what `makeStore` returns without writing it out — useful for types you never declared", "Is a runtime value", "Requires a class"],
          answer: 1,
          explanation: "`Parameters<F>` gives the argument tuple; `Awaited<T>` what `await` yields.",
        },
        {
          prompt: "`users.filter(isUser)` where `isUser` is a type guard is typed as…",
          options: ["`unknown[]`", "`User[]` — a guard predicate narrows the element type; a plain boolean callback would not", "`boolean[]`", "`any[]`"],
          answer: 1,
          explanation: "One of the practical payoffs of writing real guards.",
        },
        {
          prompt: "`document.getElementById(\"q\") as HTMLInputElement` is acceptable because…",
          options: ["It validates the element", "You hold local knowledge the compiler cannot (the element's kind in your own markup) — the same `as` on JSON from a server would be a lie", "`as` always checks", "Elements are `any`"],
          answer: 1,
          explanation: "Treat every `as` in a diff as a review question.",
        },
        {
          prompt: "`catch (err)` under `strict` binds `err` as…",
          options: ["`Error`", "`unknown` — narrow with `instanceof Error` (or a guard) before reading `.message`", "`any`", "`string`"],
          answer: 1,
          explanation: "`useUnknownInCatchVariables` is part of `strict`.",
        },
        {
          prompt: "`noUncheckedIndexedAccess` makes `arr[i]`…",
          options: ["Throw on out-of-range", "`T | undefined`, forcing a check — catches the most common runtime crash at compile time", "`never`", "`any`"],
          answer: 1,
          explanation: "Recommended once a project is on `strict`.",
        },
        {
          prompt: "Reading a long `TS2322` message, the real mismatch is usually…",
          options: ["In the first line", "In the **last** `Type 'X' is not assignable to type 'Y'` line — the message narrows down to the offending property", "In the file name", "In the error code"],
          answer: 1,
          explanation: "Read compiler errors bottom-up.",
        },
        {
          prompt: "Types and runtime validation relate how?",
          options: ["Types validate at run time", "Types are erased, so data from outside must be validated (guards or a schema library); inside the boundary the types are trusted", "Validation is unnecessary with strict mode", "Schemas replace types"],
          answer: 1,
          explanation: "One schema definition can provide both — `z.infer` derives the static type.",
        },
      ],
    },
  ],
});

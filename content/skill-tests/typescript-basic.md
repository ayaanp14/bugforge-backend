---
updated: 2026-10-03
question: What does the TypeScript (Basic) skill test cover?
answer: It checks the type system you use every day and what it leaves behind at runtime: annotations and inference, unions and narrowing, interfaces and type aliases, function and class types, simple generics, enums and literal types, and the basics of modules and tsc. Multiple-choice questions come first, many of them a short program to read, then a coding problem you solve in TypeScript.
q: Do I need conditional or mapped types for the TypeScript Basic test?
a: No. Conditional, mapped and template literal types, utility types such as `Partial` and `Pick`, `keyof`, generic constraints, overloads, `satisfies` and `as const` are examined on the [TypeScript (Intermediate)](/skill-tests/typescript-intermediate) test. Basic stays with the types you write every week: annotations, unions, interfaces, classes, enums and generics as simple as `identity<T>`.
q: Which compiler settings do the TypeScript Basic questions assume?
a: A question about whether code compiles names its settings, almost always `strict: true`, because `strictNullChecks` changes what counts as an error. A question that asks what a program prints is about runtime behaviour: the types are erased, so the answer is whatever the compiled JavaScript does. Where an answer depends on a TypeScript version or a `target`, the question says which.
q: Should I take the JavaScript Basic test before the TypeScript one?
a: It is not required, but TypeScript runs as JavaScript, and several questions turn on JavaScript behaviour that no annotation changes, such as what `"4" + 2` gives or what `typeof null` reports. If those feel uncertain, the [JavaScript (Basic)](/skill-tests/javascript-basic) test and the [JavaScript study plan](/study-plans/javascript) cover them.
q: What is the coding problem like on the TypeScript Basic test?
a: An easy problem from the catalogue, answered in TypeScript; the editor accepts no other language for this test. You complete a typed function, and the judge calls it for each test case and compares what it returns, so return the answer rather than printing it. Each hidden case you pass earns its share of the marks.
q: What should I study if I fail the TypeScript Basic test?
a: Start from your result, which breaks the score down by topic, weakest first, with a link to practise each one. The TypeScript preview module of the [JavaScript study plan](/study-plans/javascript) covers inference, structural typing, unions, narrowing, generics and `tsconfig`. You can sit the test again once the cooldown shown on this page has passed.
---

TypeScript adds one thing to JavaScript: a checker that reads your code before it runs and refuses what it can prove is wrong. Then it removes every type and hands over plain JavaScript. Most of what a TypeScript developer needs to know follows from that split: which mistakes the compiler catches, which it cannot see, and what the program does once the annotations are gone. The TypeScript (Basic) test examines both halves. Some questions show a few lines and ask whether they compile; many show a short program and ask exactly what it prints.

It suits anyone who has written TypeScript for a few months, in a frontend project, a Node.js service or practice problems, and wants a credential that shows they understand the types they write rather than adding annotations until the red underlines go away. The multiple-choice section comes first; a few of its questions ask you to select every correct option, and only the exact set scores. A coding section follows, with a problem to solve in TypeScript against hidden test cases.

## What each topic examines

Each area below is a topic on your result, so a weak one shows up by name.

- **Basic types and inference.** Annotations, what the compiler infers when you leave them out, and why `const n = 10` has the type `10` while `let m = 10` has `number`. Arrays and tuples, and the three special types: `any` switches checking off, `unknown` makes you check before you use a value, and `never` has no values at all.
- **Unions and narrowing.** Writing a union such as `string | number`, and how `typeof`, `in`, `instanceof`, equality and truthiness checks narrow it inside a branch. Expect to say what type a value has at a given line, and to know the traps: `typeof null` is `"object"`, and a truthiness check throws away `0` and `""` along with `undefined`.
- **Interfaces and type aliases.** Optional and `readonly` properties, index signatures, `extends` against `&`, what only a type alias can name, and structural typing: why an object literal with an extra property is an error while the same object held in a variable is not.
- **Function types.** Optional, default and rest parameters, return types and `void`, and function types such as `(a: number, b: number) => number`, including which functions may be assigned to one.
- **Classes and modifiers.** `public`, `private`, `protected` and `readonly`, parameter properties, `static` members, abstract classes and `implements`.
- **Generics.** Functions, interfaces and classes with a type parameter, how `T` is inferred from the arguments or given explicitly, and why the body of a generic function cannot assume anything about `T`.
- **Enums and literal types.** How numeric enum members are numbered, the reverse mapping they get at runtime, string enums (which get none), and literal types and unions of them.
- **Types at runtime.** What the emitted JavaScript contains: interfaces and type aliases vanish, enums and classes remain, `private` hides nothing from running code, and `as` converts nothing.
- **Modules and compiler options.** Default and named imports and exports, the difference between a script and a module, what `target` changes in the output, and the fact that `tsc` still writes JavaScript when it reports a type error.

## How to prepare

Keep a scratch file open with `strict` turned on and test yourself against the compiler. Before you save, decide which lines will be underlined and why; before you run, write down what the program will print. When you were wrong, find the rule that explains it before moving on. A rule you looked up after a wrong guess is easier to remember than one you only read about, and it is the habit the test rewards.

Then read the compiler's output. Compile a file holding an enum, a class with parameter properties, an interface and a type alias, and open the JavaScript that comes out. Seeing which declarations leave code behind, and what a numeric enum turns into, settles most runtime questions faster than any explanation.

The [JavaScript study plan](/study-plans/javascript) includes a TypeScript preview module on erased types and inference, interfaces and structural typing, generics, narrowing and `tsconfig`, with exercises checked on a judge. Its earlier modules on values and types, functions and scope, and prototypes and classes cover the JavaScript underneath, which the output-prediction questions lean on.

For the coding section, solve easy problems from [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Hash table](/challenges/hash-table) in TypeScript; the roadmap lessons on [arrays](/roadmap/arrays) and [hashing](/roadmap/hashing) explain the techniques those problems use. Annotate parameters and return types as you would at work, but keep the code plain: the judge checks the value your function returns, not how elaborate its types are. Pasting into the editor is switched off during a sitting, so practise writing solutions from an empty function.

## What trips people up

Most lost marks come from a few habits rather than from gaps in knowledge.

- **Expecting types to exist at runtime.** An annotation neither checks nor converts data. A value from `JSON.parse` typed as `User` is whatever the JSON held, and `input as number` leaves a string a string. When a question asks what a program prints, read the JavaScript and ignore the types.
- **Mixing up compile-time and runtime protection.** `private` and `readonly` stop code compiling; they do not stop a value being read through `any` or changed through another reference to the same object.
- **Forgetting widening.** A `let`, and every property of an object literal, widens `"dark"` to `string` and `10` to `number`. That is why a `let` holding `"dark"` cannot be passed where `"light" | "dark"` is required, while a `const` can.
- **Reading the declaration, not the narrowed type.** Inside a checked branch a value has a narrower type than its declaration says, and after an early `return` the rest of the function sees only what is left.
- **Rushing the multi-answer questions.** "Select all that apply" questions score only when the whole set is right, so decide each option on its own before you look at what you have chosen. There is no negative marking, so never leave a question blank.

## What changes at Intermediate

The [TypeScript (Intermediate)](/skill-tests/typescript-intermediate) test assumes everything here and moves to the type-level features: generic constraints, `keyof` and indexed access types, mapped, conditional and template literal types, the built-in utility types, overloads, user-defined type guards, `satisfies` and `as const`, and what each `strict` flag turns on. Its coding section reaches medium difficulty. If the questions here felt routine, that is the next step; all the skill tests are listed on the [skill tests page](/skill-tests).

## Sample question
topic: unions-narrowing
answer: A
run: typescript

What does this program print?

```typescript
function total(values: number | number[]): number {
  if (Array.isArray(values)) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return sum;
  }
  return values;
}

console.log(total(4) + total([1, 2, 3]));
```

- A: `10`
- B: `46`
- C: `NaN`
- D: It does not compile: `length` does not exist on `number | number[]`.

> `Array.isArray` narrows the union: inside the `if`, `values` is `number[]`, so `.length` and indexing compile, and after that branch returns only `number` is left. `total(4)` returns 4 and `total([1, 2, 3])` returns 6. Both are numbers, so `+` adds them rather than joining them: 10.

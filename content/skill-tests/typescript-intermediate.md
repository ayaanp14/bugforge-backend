---
updated: 2026-10-03
question: What does the TypeScript (Intermediate) skill test cover?
answer: It examines the type system as working code uses it: generic constraints with keyof and indexed access, mapped, conditional and template literal types, the utility types, overloads, type guards and assertion functions, satisfies and as const, the strict compiler flags, and what each feature leaves behind at runtime. Multiple-choice questions come first, then coding problems up to medium difficulty, solved in TypeScript.
q: Which TypeScript version and settings do the Intermediate questions assume?
a: A question about what compiles names its settings, nearly always `strict: true`, and every answer is checked against TypeScript 5. Where a feature is newer than some projects use, the question names the version that added it, such as `satisfies` in 4.9 or `const` type parameters in 5.0. A question that asks what a program prints is about the emitted JavaScript, which the flags do not change.
q: How deep do conditional types and infer go on the TypeScript Intermediate test?
a: Deep enough to read them: say what a conditional type resolves to for a given argument, how it distributes over a union and how to stop that, and what an `infer` binds. The helpers in the questions are a few lines long, like those in application code and library typings; you are not asked to write long recursive types.
q: Should I take the TypeScript Basic test first?
a: It is not required, but Intermediate assumes what [TypeScript (Basic)](/skill-tests/typescript-basic) examines: annotations and inference, unions and `typeof` narrowing, interfaces, classes, enums and simple generics. If any of those still needs thought, Basic is the better first sitting, and its result shows exactly which topics to work on.
q: What is the coding section like on the TypeScript Intermediate test?
a: Problems from the catalogue, up to medium difficulty, answered in TypeScript; the editor accepts no other language for this test. You complete a typed function and return the answer, which the judge compares on hidden cases. Solutions are compiled for an older JavaScript target, so loop over a `Map` or `Set` with `forEach` rather than `for…of` or spread.
q: Does the TypeScript Intermediate test cover decorators, namespaces or declaration files?
a: No. The questions stay with the type system, the compiler options that change what it checks, and what the emitted JavaScript does. Decorators, namespaces, writing `.d.ts` files and framework typings such as React's are not examined, though the TypeScript module of the [JavaScript study plan](/study-plans/javascript) introduces declaration files.
---

The TypeScript (Intermediate) test is about the types you read more often than you write: the signatures a library exports, the helper types in a shared types file, and the errors the compiler raises when a change in one place breaks a promise made in another. It examines whether you can work out what a type resolves to, why the compiler accepts or rejects a line, and — just as often — what the program does once every type has been erased.

The questions are short. Some show a few declarations and ask what a type is, or which lines compile with `strict: true`; many show a complete program and ask exactly what it prints. A few ask you to choose every correct option, and only the exact set scores. A coding section follows, answered in TypeScript and judged on hidden test cases.

## Is this your level?

Sit Intermediate if TypeScript is the language of your job or your main projects: you write generic helpers, read the types a package ships with, and know which `tsconfig` flags your project turns on. It assumes everything on the [TypeScript (Basic)](/skill-tests/typescript-basic) test, from inference and literal types to `typeof` narrowing and parameter properties, because the harder questions stand on that ground.

TypeScript runs as JavaScript, so a fair share of the questions turn on runtime behaviour that no annotation changes, such as how an object spread copies properties or what `instanceof` actually tests. If those parts feel uncertain, the [JavaScript (Intermediate)](/skill-tests/javascript-intermediate) test examines them directly.

## What each topic examines

Each area below is a topic on your result, so a weak one shows up by name. The TypeScript module of the [JavaScript study plan](/study-plans/javascript) covers inference, structural typing, generics with `keyof`, the utility types, narrowing and type guards, and `tsconfig`, with exercises checked on a judge.

- **Basic types and inference.** When literal types widen and when they stay narrow, `unknown` against `any`, `typeof` in a type position, `as const`, and `satisfies`, which checks a value against a type without giving up the type inferred for it.
- **Unions and narrowing.** Discriminated unions and exhaustiveness checks with `never`, narrowing with `in` and equality, user-defined type guards (`x is T`), assertion functions (`asserts x is T`), and the places where a narrowing stops applying.
- **Interfaces and type aliases.** Declaration merging, what only an alias can express, excess property checks on object literals, index signatures, and what an intersection does with properties that conflict.
- **Function types and overloads.** Which overload a call resolves to and what callers can see, `this` parameters, when one function type is assignable to another, and what `strictFunctionTypes` checks.
- **Classes and modifiers.** Abstract classes and members, `protected` access, parameter properties, private members and compatibility, and what `implements` does and does not do.
- **Generics.** Constraints such as `K extends keyof T`, indexed access types such as `T[K]`, default type parameters, how inference chooses a type from several arguments, and `const` type parameters.
- **Utility and mapped types.** `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters` and `Awaited`; mapped types with the `readonly` and `?` modifiers, removing them with `-`, and key remapping with `as`.
- **Conditional and template literal types.** `infer`, distribution over unions and `[T] extends [U]`, template literal types built from unions, and the string helpers such as `Capitalize`.
- **Enums and literal types.** Numeric, string and `const` enums and what each compiles to, which values an enum accepts, `keyof typeof` on an enum, and keeping literal types with `as const`.
- **Types at runtime.** What assertions, the non-null `!`, `readonly`, `private` and `abstract` amount to once compiled, and the places a wrong value slips past the checker unnoticed.
- **Modules and compiler options.** What `strict` switches on and what it leaves off, `noUncheckedIndexedAccess`, `useUnknownInCatchVariables`, `strictPropertyInitialization`, `isolatedModules` with `export type`, and the difference between `target` and `lib`.

## How to prepare

Work in a scratch file with `strict` on and ask the compiler rather than your memory. Before you hover over a type or save the file, write down what you expect: the type a helper resolves to, or which lines will be underlined. A quick way to test a guess is a line that compiles only if you are right, such as assigning the value to a variable annotated with the type you expect. Treat every surprise as a rule to find. Most questions at this level come down to a handful of rules applied carefully: which direction an assignment is checked in, when a conditional type distributes, when a literal widens, and which checks exist only at compile time.

Then compile and read the JavaScript. Run `tsc` on a file holding a `const enum`, an abstract class, an overloaded function and a type guard, and open what it writes: overloads collapse into one function, `const enum` members become plain numbers, and guards are ordinary functions that return booleans. Questions that ask what a program prints are answered from that output, never from the annotations.

Finally, change one compiler flag at a time. Turn on `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` or `isolatedModules` in a small project and fix what breaks; you will remember what each one does far better than from a list of options.

## What trips people up

- **Reading a type as a fact about data.** An annotation, an `as` or a `!` changes what the compiler believes, not the value. Anything from outside the program is whatever arrived until code has checked it.
- **Forgetting distribution.** A conditional type over a bare type parameter is applied to each member of a union separately, so a helper can answer differently for a union than for the union taken whole.
- **Assuming the checker sees everything.** Narrowing can be lost inside a callback, a method written in shorthand is checked more loosely than a function-typed property, and `implements` never types a class body for you.
- **Assuming `strict` turns on every check.** It enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` and several more, but not `noUncheckedIndexedAccess` or `exactOptionalPropertyTypes`.
- **Rushing the multi-answer questions.** They score only when the whole set is right, so judge each option on its own. There is no negative marking, so never leave a question blank.

## The coding section

The coding problems come from the catalogue, reach medium difficulty and must be answered in TypeScript. At that level the algorithm matters as much as the code: Submit runs every hidden case, so an approach that is only fast enough for the visible examples can still lose marks. Review costs with the [Big-O notation](/roadmap/big-o-notation) lesson, then practise the patterns medium problems lean on — [hashing](/roadmap/hashing), [two pointers](/roadmap/two-pointers) and [sliding window](/roadmap/sliding-window) — with problems from [Hash table](/challenges/hash-table), [Two pointers](/challenges/two-pointers) and [Sliding window](/challenges/sliding-window), solved in TypeScript.

The editor hands you a typed function to complete: return the answer rather than printing it. Solutions are compiled for an older JavaScript target, so a `for…of` loop or a spread over a `Map` or `Set` does not compile; use `forEach`, or keep the data in arrays. Keep the types plain, since the judge checks what the function returns, not how clever its signature is. Pasting into the editor is switched off during a sitting, so practise writing solutions from an empty function. The other skill tests are listed on the [skill tests page](/skill-tests).

## Sample question
topic: unions-narrowing
answer: B
run: typescript

What does this program print?

```typescript
type Action =
  | { type: "add"; amount: number }
  | { type: "scale"; factor: number }
  | { type: "reset" };

function apply(total: number, action: Action): number {
  switch (action.type) {
    case "add":
      return total + action.amount;
    case "scale":
      return total * action.factor;
    case "reset":
      return 0;
  }
}

const actions: Action[] = [
  { type: "add", amount: 5 },
  { type: "reset" },
  { type: "add", amount: 2 },
  { type: "scale", factor: 3 },
];
console.log(actions.reduce(apply, 10));
```

- A: `51`
- B: `6`
- C: `2`
- D: It does not compile: `apply` lacks an ending return statement.

> `type` is the discriminant: inside each `case`, `action` is narrowed to the one member with that `type`, so `action.amount` and `action.factor` compile. The cases cover every member of the union, so the compiler knows the function always returns and needs no final `return`. `reduce` starts from 10 and applies each action in order: 15, then 0 after the reset, then 2, then 6.

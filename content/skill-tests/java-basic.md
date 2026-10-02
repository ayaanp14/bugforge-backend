---
updated: 2026-10-03
question: What does the Java (Basic) skill test cover?
answer: The core of the language: primitive types and conversions, operators and loops, strings, arrays, classes and objects, inheritance and polymorphism, exceptions, the everyday collections and how references behave. Most questions show a short, complete program and ask what it prints or whether it compiles. After them comes an easy coding problem that you solve in Java.
q: Do I need generics, lambdas or streams for the Java Basic test?
a: No. You should be able to read and use declarations such as `List<String>` and `Map<String, Integer>`, but writing generic types, wildcards, lambdas, streams, threads and records is examined in [Java (Intermediate)](/skill-tests/java-intermediate), not here.
q: Which version of Java do the questions assume?
a: Any current release from Java 11 on. The programs use the classic core of the language and its standard library, and nothing at this level depends on a recent feature. If you learned on Java 8, the only gaps are small conveniences such as `List.of` for building a short list.
q: How do I write my solution in the coding round?
a: You fill in a `public static` method whose name, parameters and return type are given. The test input is read for you and passed in as arguments, and the value your method returns is compared with the expected answer, so there is no `main` method to write and no input to parse. The `java.util` classes are already imported.
q: Should I take Java Basic before Java Intermediate?
a: You do not have to: either test can be sat first. Basic fits if you have written Java for a few months, mostly in coursework or practice problems. If you already use collections, exceptions and interfaces in real code, Intermediate examines more of what you know.
---

The Java (Basic) test is for someone who has been writing Java for a few months: through a first programming course, a data-structures class taught in Java, or a steady run of practice problems. It certifies two things. First, that you can read Java exactly: given a short program, you can say what it prints, or why it will not compile, and be right for the same reason the compiler and the JVM are. Second, that you can turn a small, well-defined problem into a working Java method.

Nothing on the paper asks you to recite a definition. The multiple-choice questions put code in front of you, and most of it is a complete program: a class with a `main` method, a few lines that do something ordinary, and a handful of candidate outputs. Some questions ask which of several declarations compile or which statement about a rule is true, and a few ask you to select every option that applies. The coding problem that follows is one of the catalogue's easy problems, and it must be solved in Java. Both halves carry marks, and the coding problem carries a large share of them, so a careful reader who cannot yet write working code, or a fluent coder who guesses at the language's rules, will feel the gap.

## What each topic asks you to do

The questions are spread evenly across nine topics, so a sitting cannot lean on your favourite one. The [Java study plan](/study-plans/java) teaches all of them, in roughly the order a first course would.

- **Syntax and types.** The primitive types and their ranges, which conversions Java makes on its own and which need a cast, and what integer and floating-point arithmetic actually produce, including when a result no longer fits its type.
- **Operators and control flow.** Precedence and evaluation order, the increment operators, `switch`, and loops with `break` and `continue`. Expect to trace a loop by hand and say exactly how many times its body ran.
- **Strings.** What immutability means in practice, the common `String` methods and their index rules, how `+` behaves once a string is involved, comparing strings correctly, and when to reach for `StringBuilder`.
- **Arrays.** Creating and initialising arrays, the values a new array holds, bounds, two-dimensional arrays, and the difference between copying an array and copying a reference to it.
- **Classes and objects.** Fields, constructors and `this`, static versus instance members, overloading, and the access modifiers.
- **Inheritance and polymorphism.** Constructor chaining, the rules an override must follow, which method runs when a superclass variable holds a subclass object, abstract classes and interfaces, and casting with `instanceof`.
- **Exceptions.** How control moves through `try`, `catch` and `finally`, checked versus unchecked exceptions and what the compiler demands for each, and defining an exception class of your own.
- **Collections.** `ArrayList`, `HashSet`, `HashMap`, `TreeMap` and `ArrayDeque`: which allow duplicates, which keep an order and which order, and what each common method returns.
- **Memory and references.** Primitives versus references, what passing each to a method really does, `null`, and the life of an object on the heap.

## The coding problem

The coding half is an easy problem from the [catalogue](/challenges), the same kind as the easy problems under [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Hash Table](/challenges/hash-table). The editor gives you a method to complete, something like `public static int longestRun(int[] nums)`, with the input already parsed and passed in; you return the answer. Run checks your code against the visible examples. Submit runs it against thousands of hidden, generated inputs, and each one you pass earns its share of the problem's marks. A solution that handles the examples but not a single-element array, repeated values or negative numbers loses those cases, so test the edges yourself before you submit.

Pasting into the editor is switched off. That changes how to practise: write your solutions from an empty method, without copying in a helper you keep somewhere, until `HashMap`, `ArrayList`, `Arrays.sort` and `StringBuilder` come out with the right method names and argument orders. Every compile error costs minutes you would rather spend testing.

Most easy problems are one idea applied carefully: count with a map, walk an array with two indexes, build the answer as you go. The roadmap lessons on [arrays](/roadmap/arrays), [strings](/roadmap/strings), [hashing](/roadmap/hashing) and the [two-pointer technique](/roadmap/two-pointers) teach those patterns, with Java code beside the other languages.

## Preparing in the weeks before

If the topics above read as familiar, the quickest preparation is reading code, predicting it, and checking yourself.

1. Work through the modules of the [Java study plan](/study-plans/java) for any topic you are unsure of. Each lesson ends with a quiz and exercises the judge marks, which is the same kind of reading the test asks for.
2. Turn every doubt into a two-line program. Unsure what `"Java".indexOf('a', 2)` returns? Write it, decide on an answer, then run it. An answer you predicted and checked stays with you longer than a rule you read.
3. Practise the coding half against a clock: pick easy catalogue problems, solve them in Java with a timer running, and submit before you open the editorial.
4. Read code you did not write. The [bug hunts](/bug-hunts) in Java train the same habit the multiple-choice questions reward: following someone else's code line by line until you see what it really does.

## Where marks usually slip

Most lost marks come from reading the program you expected instead of the program on the page.

- **Check whether it compiles first.** When an option says the program does not compile, look for that reason before you trace anything. If the code is legal, the option is gone and you can trace with confidence; if it is not, tracing was wasted time.
- **Separate variables from objects.** Many questions turn on whether two variables share one object or hold two. Draw it: a box for each variable, an arrow to each object, and move the arrows as the code runs.
- **Let the types decide the arithmetic.** Work out the type of each part of an expression before its value; the type determines which operation happens.
- **Count loop passes exactly.** Write down the loop variable at every pass rather than estimating. Loop questions are usually decided by the first pass or the last.
- **Judge each option in a select-all question on its own.** Only the exact set scores, so every option is its own true-or-false decision.

## Moving on to Intermediate

[Java (Intermediate)](/skill-tests/java-intermediate) assumes everything here and goes further: generics and wildcards, lambdas and streams, the contracts behind `equals` and `hashCode`, the JVM's memory behaviour and threads, and the modern language from records to sealed types. Its coding round reaches medium difficulty. Passing Basic first is not required, but if several of the topics above still need thought, this is the test to start with.

## Sample question
topic: syntax-types
answer: C
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        int big = 200;
        byte b = (byte) big;
        short s = (short) 70000;
        System.out.println(b + " " + s);
    }
}
```

- A: `200 70000`
- B: `127 32767`
- C: `-56 4464`
- D: It does not compile.

> A cast to a smaller integer type keeps only the low-order bits that fit, 8 for `byte` and 16 for `short`, and reads them as a signed number. 200 is past the `byte` maximum of 127, so it wraps to 200 - 256 = -56; 70000 - 65536 = 4464, which fits in a `short`. Nothing is clamped to the type's limit, and an explicit cast always compiles: only an implicit narrowing such as `byte b = big;` is rejected.

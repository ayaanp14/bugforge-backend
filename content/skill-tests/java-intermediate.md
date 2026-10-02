---
updated: 2026-10-03
question: What is on the Java (Intermediate) skill test?
answer: Java as it is used at work: the collections and the contracts they rely on, generics, lambdas and streams, inheritance and the object model in depth, exceptions, the JVM's memory behaviour, concurrency, and modern Java from records to sealed types. Most questions ask what a program prints or whether it compiles; then you solve coding problems in Java at easy and medium difficulty.
q: Does the Java Intermediate test cover Spring, Hibernate or other frameworks?
a: No. Every question is about the language and the JDK's own libraries, chiefly `java.util`, `java.util.function`, `java.util.stream` and `java.util.concurrent`. Knowing a framework well helps only as far as you know what the plain Java underneath it does.
q: Which Java version do the modern-Java questions assume?
a: Java 17. Records, sealed classes and interfaces, switch expressions, text blocks, `var` and pattern matching for `instanceof` are all in scope. Nothing depends on a later release, so record patterns and pattern matching in `switch`, which became final in Java 21, are not examined.
q: How much concurrency does it expect?
a: What a developer needs to write correct multithreaded code, not how locks are implemented: what `synchronized`, `volatile` and the atomic classes each guarantee, and how the `java.util.concurrent` executors and futures are used. When an outcome would depend on timing, a question asks what the language guarantees rather than what usually happens.
q: Is there partial credit in the coding round?
a: Yes. Each problem is checked against thousands of hidden cases, every case you pass earns its share of that problem's marks, and your best submission per problem is the one that counts. Submitting a correct but unpolished solution early and improving it afterwards is safe: a worse later attempt never replaces a better one.
---

Java (Intermediate) is written for people who use Java at work or in substantial projects and want a credential that says more than "knows the syntax". It assumes everything in [Java (Basic)](/skill-tests/java-basic) and asks about the parts of the language that decide whether production code is correct: the contracts the collections depend on, what generics check at compile time and what is left at run time, how a stream pipeline actually evaluates, which method a call reaches, what the memory model promises two threads, and how recent releases changed everyday code.

The multiple-choice questions are mostly short programs, each built around one behaviour that an experienced developer can explain and a casual one gets wrong. The answer is never a matter of taste: every program either prints one exact line, fails to compile for a reason you can name, or throws an exception you can predict. A few questions ask you to select every correct option, and only the exact set scores. The coding round that follows draws from the catalogue at easy and medium difficulty, and every solution is written in Java.

## Ten topics, and how deep each goes

Every sitting draws from all ten topics in balance. Plain syntax, operators and arrays are assumed rather than asked. The later modules of the [Java study plan](/study-plans/java), from interfaces and generics through streams, memory and concurrency to modern Java, teach each of them.

- **Collections.** How `HashMap`, `HashSet`, `TreeMap` and the lists decide equality and order, which operations are safe while iterating, and what the `Map` methods added since Java 8 return.
- **Generics.** Type parameters and bounds, wildcards with `extends` and `super` and when each is the right choice, type inference, and what type erasure leaves at run time.
- **Lambdas and streams.** Functional interfaces and method references, what a lambda may capture, how and when a stream pipeline evaluates, collectors, and `Optional` used as intended.
- **Inheritance and polymorphism.** Overload resolution and dynamic dispatch when both apply to one call, what is inherited and what is only hidden, and how default methods in interfaces interact with classes.
- **Classes and objects.** The order in which classes and objects are initialised, and nested, inner and anonymous classes.
- **Exceptions.** Try-with-resources, what a `finally` block can and cannot change, and the compiler's checked-exception rules in their less obvious places.
- **Strings.** The string pool, comparison and ordering, and the edge cases of the `String` methods used every day.
- **Memory and the JVM.** Boxing and unboxing, the stack and the heap, reachability and garbage collection, and what immutability really requires.
- **Concurrency.** Visibility and atomicity between threads, the locks and atomic classes that provide them, and the executor framework.
- **Modern Java.** Records, sealed types, switch expressions, text blocks, `var` and pattern matching for `instanceof`.

## Easy and medium problems, in Java

The coding round is where the credential shows you can build, not only read. Its problems come from the catalogue at easy and medium difficulty, and the harder one usually needs a technique rather than a direct loop: a hash map that turns a nested search into one pass, a [sliding window](/roadmap/sliding-window), a [prefix sum](/roadmap/prefix-sum), [binary search](/roadmap/binary-search), a [stack](/roadmap/stack) or a [heap](/roadmap/heap). The roadmap lessons show each one with Java code, and the [Hash Table](/challenges/hash-table), [Sorting](/challenges/sorting) and [Heap](/challenges/heap) problem lists are good places to practise at medium difficulty.

Each problem gives you a `public static` method to complete; the input arrives as its arguments and you return the answer. Pasting is switched off, so your Java has to come from memory: the `Map` and `Deque` methods, a `PriorityQueue` with a comparator, sorting objects or part of an array, converting between `List<Integer>` and `int[]`. Write those until you no longer stop to think about them, because the medium problem leaves little time for looking things up.

Run checks the visible examples; Submit runs thousands of hidden, generated cases. Each case you pass earns its share of the marks and your best submission per problem counts, so submit a correct solution as soon as you have one and refine it afterwards.

## A plan for developers who already use Java

Working Java developers tend to know the common path well and its edges less well, because production code rarely forces the question. A plan aimed at that gap:

1. Pick the topics above that you use least, perhaps wildcards, stream evaluation or the memory model, and read those modules of the [Java study plan](/study-plans/java) end to end, quizzes included.
2. For each behaviour you are unsure of, write the smallest program that shows it and predict the output before you run it. Does an `enum` constant's constructor run once, or every time the constant is used? Ten lines settle it, and the prediction you got wrong is the one you will remember.
3. Solve medium problems in Java against a timer, without an IDE, so that the coding round's editor feels familiar.
4. Read the explanation of every quiz answer, including the ones you got right. The test rewards knowing why, and a correct guess teaches nothing.

## Traps that catch experienced developers

- **Relying on what usually happens.** Code that has always worked on your machine can still be wrong by the language's rules, and the questions ask about the rules. When an option says the outcome can vary, decide whether Java guarantees the order or the visibility involved, not whether you have ever seen it fail.
- **Mixing up compile time and run time.** Overload choice uses the compile-time types of the arguments; overriding uses the run-time class of the object. Decide which mechanism a call goes through before you trace it.
- **Losing track of what was copied.** Many behaviours come down to whether you hold a copy, a view or a shared reference. Ask that question of every collection, array and builder handed from one place to another.
- **Reading deferred code as if it ran where it is written.** A stream pipeline, a `Supplier` or a `CompletableFuture` stage runs when something asks for its result.
- **Skipping the compile check.** Experienced readers trace the logic and forget to ask whether the code compiles at all; sometimes the option saying it does not is the right one.

## Without the Basic credential first

The Basic test is not a prerequisite. A fair self-check: if you can answer the sample question below and explain why each wrong option is wrong, you are working at this level. If the topics on the [Java (Basic)](/skill-tests/java-basic) page, such as constructor chaining, checked exceptions and pass-by-value, still take thought, sit that first and come back.

## Sample question
topic: collections
answer: D
run: java

What does this program print?

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        for (int n : new int[] {3, 9, 4, 9, 1}) {
            pq.offer(n);
        }
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            out.append(pq.poll()).append(' ');
        }
        System.out.println(out.append(pq.size()));
    }
}
```

- A: `9 4 3 1`
- B: `1 3 4 2`
- C: `3 9 4 2`
- D: `9 9 4 2`

> A `PriorityQueue` is a heap, not a set, so it keeps both 9s. With `Collections.reverseOrder()` as its comparator, `poll()` always removes the largest element left, so three polls give 9, 9 and 4, and two elements (3 and 1) remain. A collection that dropped duplicates, like a `TreeSet`, would give A; the default comparator makes it a min-heap, which gives B; and insertion order, C, is what a plain FIFO queue such as `ArrayDeque` would give.

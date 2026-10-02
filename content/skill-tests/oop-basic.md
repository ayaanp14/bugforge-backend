---
updated: 2026-10-03
question: What does the OOP (Basic) skill test cover?
answer: It certifies the four pillars of object-oriented programming (encapsulation, inheritance, polymorphism and abstraction) along with classes and objects, constructors, and telling is-a from has-a. The multiple-choice questions show short programs in Java, Python and C++ and ask what they print, whether they compile, or which design keeps a stated rule. There is no coding round.
q: Which programming language is the OOP Basic test in?
a: Three of them. Questions show code in Java, Python or C++, and a question names its language whenever the answer depends on it. You write no code, but you need to read all three at the level of a short class hierarchy: constructors, `super`, access modifiers, `self` in Python and `virtual` in C++.
q: Do I need SOLID or design patterns for the OOP Basic test?
a: No. The Basic test stays with the four pillars and the mechanics under them. The SOLID principles, the classic design patterns, the edge cases of dynamic dispatch and the difference between association, aggregation and composition are examined in the OOP (Intermediate) test.
q: How is the OOP test different from the Java Basic test?
a: The Java test examines the whole language, from operators and strings to collections, and ends with a problem you solve in Java. The OOP test examines only the object model, but in Java, Python and C++ side by side, and it has no coding round. They certify different things, and you can hold both.
q: Should I sit OOP Basic or OOP Intermediate first?
a: Either; neither requires the other. Basic suits someone who can explain the four pillars and predict what a short class hierarchy does. If you already reason comfortably about SOLID, the common patterns and the corner cases of overriding, go straight to Intermediate: it is the stronger credential.
---

The OOP (Basic) test certifies that you understand how object-oriented code behaves, not just what the four pillars are called. Every topic is examined on something concrete: a class with a static counter, a hierarchy three classes deep, an interface with two implementations, a requirement written as a sentence. You read it and say what happens: what is printed, which line fails to compile, which method runs, or which design keeps a stated rule.

The code is in Java, Python and C++, because the same ideas work differently in each. Java allows one superclass per class and enforces its access modifiers at compile time; Python has no `private` at all, only conventions; C++ copies objects on assignment and dispatches on the real object only for `virtual` functions. A question names its language, and where the three disagree it asks about that language's rule.

## Who the test is for

It is the right test once you have built a few small programs out of classes: you can write a constructor, extend a class and override a method without looking anything up, and you can follow the same code in the other two languages. You need no framework, library or design pattern. The questions are multiple-choice and there is no coding round; a few ask you to select every correct option, and only the exact set scores.

## What each topic examines

- **Classes and objects.** A class against the objects made from it; instance members against static (Java, C++) or class (Python) members; `this` and `self`; what assigning one variable to another actually copies; and identity against equality, `==` against `equals()` in Java and `is` against `==` in Python.
- **Encapsulation.** Why fields are kept private and changed only through methods that keep the object valid; Java's four access levels; the different defaults of `class` and `struct` in C++; Python's leading underscores, which are conventions and name mangling rather than locks; and getters that give away more than they mean to.
- **Constructors and object lifecycle.** When a default constructor exists and when it does not, `this(...)` and `super(...)`, the order in which a hierarchy is built (base class first) and, in C++, torn down (the reverse), and why Python runs only the child's `__init__` unless it calls `super().__init__()`.
- **Inheritance.** What a subclass inherits and what it cannot name; single, multilevel and hierarchical inheritance; multiple inheritance, which C++ and Python allow and Java offers only through interfaces; calls through `super`; and `final` classes.
- **Polymorphism.** Overloading against overriding, and who picks each: the compiler, from declared types, or the running program, from the object. Calls through a base-class reference or pointer, `virtual` in C++, duck typing in Python, and casts that compile but fail when they run.
- **Abstraction and interfaces.** Abstract classes and methods, what an interface may contain at this level (constants, abstract methods, default methods), Python's `abc` module, C++ pure virtual functions, and when an interface fits better than an abstract class.
- **Relationships.** Telling is-a from has-a in a requirement, why `extends` used only to reuse code can be a design mistake, and what it means for one object to hold another as a field.

Each topic in your result links back to somewhere to practise it. The [Java](/study-plans/java), [Python](/study-plans/python) and [C++](/study-plans/cpp) study plans all teach classes, inheritance and interfaces with exercises that run on the judge, and the [Programming Fundamentals MCQs](/aptitude/programming-fundamentals) are a good warm-up for reading code quickly and predicting its output.

## How to prepare

Take each idea above and write the smallest program that shows it, then write it again in the other two languages. Predict the output before you run it; when you are wrong, find the rule you missed rather than just the right answer. Ten such programs teach more than a hundred definitions, because the test never asks you to recite a definition: it asks you to apply one.

Keep a short list of where the languages part ways and check yourself against it until it is automatic:

- how a parent's constructor gets called, and whether it has to be first;
- what `private` stops, and whether the language enforces it at all;
- whether a call through a parent-type variable runs the parent's method or the object's;
- whether `b = a` gives you a second object or a second name for the first;
- how many classes a class may inherit from.

For the design questions, say the requirement out loud as sentences. "A savings account is an account" describes inheritance; "an order has line items" describes a field. If the "is a" sentence sounds wrong in plain English, the `extends` is wrong too, however much code it would save.

## Where marks slip away

- **Mixing up who decides.** The declared type decides which overload is called and whether a call compiles at all; the object decides which override runs. Most dispatch questions turn on keeping those two apart.
- **Reading Java habits into Python or C++.** Python does not call a parent's constructor for you and does not enforce privacy; C++ does not dispatch on the object unless the function is `virtual`, and its variables hold objects, not references.
- **Losing track of objects.** Count the `new` calls, not the variables. Two variables can name one object, and an object stays reachable through any of them.
- **Stopping at the first true option.** In a "select all" question, judge every option on its own.
- **Choosing the cleverest design.** The questions reward the design that keeps the stated rule with the least coupling, which is usually the plain one.

## What changes at Intermediate

[OOP (Intermediate)](/skill-tests/oop-intermediate) assumes everything here and goes further: the edge cases of dynamic dispatch (static methods are hidden rather than overridden, fields are not polymorphic, constructors that call overridable methods, object slicing in C++, Python's method resolution order), the SOLID principles, the common design patterns, and association, aggregation and composition in depth. If you also want a language credential, [Java (Basic)](/skill-tests/java-basic), [Python (Basic)](/skill-tests/python-basic) and [C++ (Basic)](/skill-tests/cpp-basic) examine the whole language and end with a problem to solve in it.

## Sample question
topic: classes-objects
answer: B
run: java

What does this Java program print?

```java
class Visitor {
    static int count = 0;
    final int number;

    Visitor() {
        count++;
        number = count;
    }
}

public class Main {
    public static void main(String[] args) {
        Visitor a = new Visitor();
        Visitor b = new Visitor();
        Visitor c = b;
        new Visitor();
        System.out.println(a.number + " " + c.number + " " + Visitor.count);
    }
}
```

- A: `3 3 3`
- B: `1 2 3`
- C: `1 3 3`
- D: `1 2 2`

> `count` is static, so all visitors share one counter, while `number` is an
> instance field, so each object keeps the value `count` had when it was
> built: 1 for `a` and 2 for `b`. `c = b` copies a reference and creates no
> object, so `c.number` is `b`'s 2. The third `new Visitor()` is never stored
> in a variable, but its constructor still runs, leaving `count` at 3.
> Treating `number` as shared gives `3 3 3`; counting `c` as a new object
> gives `1 3 3`; forgetting the unnamed object gives `1 2 2`.

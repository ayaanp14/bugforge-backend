---
title: Scope, lifetime and static context
minutes: 12
seo-title: Variable Scope in Java: Shadowing and Static Context
description: Scope is where a Java name can be used; lifetime is how long its value exists. Local and field scope, shadowing, static context and effectively final.
question: What is the scope of a variable in Java?
answer: The scope of a variable in Java is the part of the code where its name can be used. A local variable is in scope from its declaration to the end of its enclosing block, a parameter for the whole method, and a field throughout its class. Scope is not lifetime: an object lives on the heap for as long as anything refers to it.
q: What is the difference between scope and lifetime in Java?
a: Scope is where a name can be used in the source; lifetime is how long the thing it names exists at run time. A local reference disappears when its block ends, but the object it pointed to lives on if it was returned, stored in a field or added to a collection.
q: Can a local variable shadow a field in Java?
a: Yes: inside that scope the bare name means the local or parameter, and `this.name` reaches the field, which is why constructors write `this.x = x`. A local cannot shadow another local of the same method, so redeclaring one in an inner block is a compile error.
q: Why can't a static method access instance variables in Java?
a: A static method belongs to the class and runs without an object, so it has no `this` through which to reach instance fields or methods. Use an explicit object, as in `new App().counter++`, or make the member static if it uses no instance state. Instance code may use static members freely.
q: What does effectively final mean in Java?
a: A local variable is effectively final if it is never reassigned after it is initialised, even without the `final` keyword. Lambdas and anonymous or local classes may capture only such locals, because they copy the value, and a copy of a variable that later changed would be wrong.
q: In what order are fields initialised in Java?
a: For an object, field initialisers and instance initialiser blocks run in the order they appear in the source, then the constructor body. Static field initialisers and static blocks run once, in textual order, when the class is first used; a field read before its initialiser has run holds its default value.
---
*Scope* is where a name can be used; *lifetime* is how long the thing it names exists. They are different — a field is in scope only inside its class but lives as long as its object; a local is in scope for a block and lives for one execution of it. Getting them straight explains the compile errors around shadowing and static context, and, later, why lambdas can only capture effectively-final variables.

## Levels of scope

```java
public class Inventory {                       // class scope: fields and methods
    private static int instances = 0;          // static field: class lifetime
    private final List<String> items = new ArrayList<>();   // instance field: object lifetime

    public int countLongerThan(int limit) {    // parameter: method scope, call lifetime
        int count = 0;                         // local: method scope from here down
        for (String item : items) {            // loop variable: loop scope
            int len = item.length();           // block local: one iteration
            if (len > limit) count++;
        }
        // len and item are gone here; count is not
        return count;
    }
}
```

Rules:

- A **local** is in scope from its declaration to the end of its enclosing block. Not before its declaration, not after the block.
- A **parameter** is in scope for the whole method body.
- A **field** is in scope throughout the class (and, if not private, in subclasses and other classes via a reference), regardless of where in the class it is declared — methods above the field can use it.
- Blocks nest; an inner block sees everything in outer blocks and the class.

## No shadowing among locals

```java
int total = 0;
for (int i = 0; i < 3; i++) {
    int total = i;          // error: variable total is already defined in method …
}
```

Java forbids a local (or parameter) from redeclaring a name visible from an enclosing local scope of the same method. This removes a whole family of "which `total` is this" bugs that C allows. Sibling blocks *may* reuse names — two consecutive `for (int i …)` loops are fine, because neither `i` is in scope in the other.

## Fields can be shadowed

```java
public class Point {
    private int x, y;
    public Point(int x, int y) {
        this.x = x;                // this.x: the field; x: the parameter
        this.y = y;
    }
    public void move(int x) {
        x = x + 1;                 // changes the PARAMETER; the field is untouched — a bug
    }
}
```

A parameter or local **can** shadow a field. Inside that scope, the bare name means the local; `this.name` reaches the field. The constructor pattern `this.x = x` is idiomatic; the `move` method above is the trap — it compiles and does nothing. IDEs warn about "assignment to a parameter that shadows a field"; a good habit is to name parameters exactly like the fields *only* in constructors and setters, where `this.` is expected.

## Lifetime: stack versus heap

A local or parameter lives in the current **stack frame**; it is created when its declaration executes and destroyed when the block ends (the frame is popped when the method returns). An object lives on the **heap** from `new` until no reference to it remains, at which point the garbage collector may reclaim it. A field lives as long as the object (or, for `static`, as long as the class).

So a local *reference* can die while the object it pointed to lives on — if the object was stored in a field, added to a collection, or returned:

```java
static List<String> build() {
    List<String> local = new ArrayList<>();      // the reference is a local
    local.add("x");
    return local;                                // the LIST survives; the variable does not
}
```

And an object can outlive the method that made it but still be garbage as soon as nothing refers to it. Lifetime belongs to the object; scope belongs to the name.

## Static context

A `static` method or a static initialiser has no `this`. From there you can use static fields and static methods directly, but instance members only through an explicit object:

```java
public class App {
    private int counter;                          // instance
    private static int total;                     // static

    public static void main(String[] args) {
        total++;                                  // fine
        counter++;                                // error: non-static variable counter cannot be referenced from a static context
        new App().counter++;                      // fine: through an object
        run();                                    // error if run is an instance method
    }
    void run() { counter++; total++; }            // instance methods may use both
}
```

The rule in one line: **instance members need an instance**. The reverse is free — instance code may use static members. The error message names the problem exactly; the fix is either to create an object or to decide the member should have been static (it did not use instance state).

Static *initialisation* order can also bite: a static field initialised from a static method that reads another static field declared *later* sees its default value. Declare in dependency order.

## Effectively final

Java 8 introduced a term you will meet with lambdas and inner classes (Module 11):

```java
int base = 10;
Runnable r = () -> System.out.println(base + 1);   // fine: base is effectively final
base = 20;                                          // now the lambda line is an error
```

A local is *effectively final* if it is never reassigned after initialisation. Lambdas and anonymous/local classes may capture only effectively-final locals — because they copy the value into the closure, and a copy of a variable that later changes would lie. The same rule applies to variables used inside a `try`-with-resources. If you need to mutate captured state, use a field, an array cell, or an `AtomicInteger`.

## Initialisation order within a class

For an object: field initialisers and instance initialiser blocks run in textual order, then the constructor body. For a class: static field initialisers and static blocks run in textual order, once, on first use. Referencing a field before its initialiser has run reads its default (0/false/null) — the compiler catches some forward references, not all (a method call can hide one). Module 7 has the full sequence with inheritance.

## Naming across scopes

Because fields and locals can collide, some teams prefix fields (`mCount`, `_count`, `count_`) or use `this.` consistently. The mainstream Java convention is plain names with `this.` in constructors and setters only, and short methods where shadowing has no room to hide. Whatever the convention, the compiler's rules are the ones above.

## Interview angle

- *"Difference between scope and lifetime?"* Where a name is usable vs how long the value exists; a returned object outlives its local reference.
- *"Can a local shadow a field?"* Yes; a local cannot shadow another local.
- *"Why can't `main` call an instance method directly?"* No `this` in a static context; create an object.
- *"What is effectively final?"* Never reassigned after initialisation; required for lambda capture.

## Key takeaways

- Locals: declaration to end of block; parameters: the method; fields: the class. Locals cannot shadow locals; they can shadow fields (`this.` reaches the field).
- Objects live on the heap as long as they are referenced — independent of the scope of any variable naming them.
- Static context has no `this`: instance members need an instance.
- Effectively final = never reassigned; lambdas capture only those.

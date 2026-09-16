---
title: Custom exceptions and exception chaining
minutes: 12
---
The JDK's exceptions describe *mechanical* failures — a null, an index, a missing file. Your program has *domain* failures: an insufficient balance, an unknown customer, an order that cannot be cancelled after shipping. Custom exception classes let callers catch those by name, carry the data needed to handle or report them, and hide the mechanical causes underneath. This lesson is how to design them, how to chain causes, and how to decide when one is warranted.

## Declaring one

```java
public class InsufficientFundsException extends RuntimeException {
    private final long requestedCents;
    private final long availableCents;

    public InsufficientFundsException(long requestedCents, long availableCents) {
        super("requested " + requestedCents + " but only " + availableCents + " available");
        this.requestedCents = requestedCents;
        this.availableCents = availableCents;
    }

    public long requestedCents() { return requestedCents; }
    public long availableCents() { return availableCents; }
}
```

Choices made here:

- **Superclass**: `RuntimeException` for unchecked, `Exception` for checked (previous lesson's judgement). Never `Throwable` or `Error`.
- **Name** ends in `Exception` and states the condition, not the location.
- **Message** built in the constructor from the facts, so every thrower produces the same, informative text.
- **Fields** for the data a handler might use — amounts, ids, the offending value — with accessors. Exceptions are objects; use that.
- Fields `final`; the class need not be, but usually should be (subclassing exceptions for a hierarchy is fine; subclassing to alter behaviour is odd).

Provide the standard constructors when the exception is general-purpose: `(String message)`, `(String message, Throwable cause)`, and if useful `(Throwable cause)`. A domain exception with specific fields, as above, often needs only its own.

## Chaining: keep the cause

```java
public Order load(long id) {
    try {
        return repository.find(id);
    } catch (SQLException e) {
        throw new OrderLoadException("could not load order " + id, e);      // e becomes getCause()
    }
}
```

Wrapping translates a low-level exception into one meaningful at this layer — callers of `load` should not know about SQL — while the original travels along as the **cause**. The trace then shows both:

```
OrderLoadException: could not load order 42
    at OrderService.load(OrderService.java:31)
    …
Caused by: java.sql.SQLException: connection reset
    at …
```

Rules: **always** pass the cause when wrapping (`new X(msg, e)`, or `initCause(e)` for constructors that lack the parameter); never wrap just to change the type without adding context; never catch, log and rethrow a *different* exception without the cause — that is how "connection reset" becomes an unexplained "load failed" in production logs.

## Exception hierarchies

```java
public class BankException extends RuntimeException { … }
public class InsufficientFundsException extends BankException { … }
public class AccountFrozenException extends BankException { … }
```

A small hierarchy lets callers choose their granularity: `catch (InsufficientFundsException e)` for the specific case, `catch (BankException e)` for "anything the bank module signals". Keep it shallow — one base per module or layer, a handful of leaves. A hierarchy that mirrors every method is noise.

## Translating across layers

Each layer of an application should throw exceptions in its own vocabulary: persistence throws data-access exceptions, services throw domain exceptions, the web layer turns them into HTTP responses. The translation points are the `catch`-and-wrap blocks at layer boundaries, and the causes preserve the full story for the logs. Letting `SQLException` reach a controller — or an `HttpStatus` reach a repository — is a design leak.

## When a custom exception is warranted

Create one when at least one of these holds:

- Callers will **catch it specifically** and do something different from what they do for other failures.
- It carries **structured data** a handler needs (an id, an amount, a set of validation errors).
- It marks a **layer boundary** and hides implementation types.
- It names a **domain condition** that appears in requirements ("insufficient funds", "duplicate username").

Otherwise use the JDK's: `IllegalArgumentException` for bad arguments, `IllegalStateException` for bad timing, `UnsupportedOperationException` for unimplemented operations, `NoSuchElementException` for lookups that fail. A custom `InvalidArgumentException` that is `IllegalArgumentException` with a new name helps nobody.

## Messages

A message is for the person reading the log, not for the program: state what was attempted and the values involved (`"order 42 for customer 7 not found"`), never just `"error"` or `"invalid"`. Do not include secrets or personal data. Do not depend on messages programmatically — that is what types and fields are for.

## Serialization note

Exceptions are `Serializable`; if one is ever serialised (RMI, some frameworks), its fields must be serialisable too and a `serialVersionUID` avoids warnings. For ordinary applications, ignore this.

## Interview angle

- *"How do you write a custom exception?"* Extend `RuntimeException` (or `Exception`), constructor with message and cause, fields for relevant data.
- *"What is exception chaining?"* Wrapping a caught exception as the `cause` of a new one so the original trace is preserved and the type fits the layer.
- *"When should you create one rather than use `IllegalArgumentException`?"* When callers catch it specifically, it carries data, or it hides a layer's internals.
- *"Why is losing the cause bad?"* The real failure and its stack trace disappear from the logs.

## Key takeaways

- Extend `RuntimeException` (usually) or `Exception`; name the condition; build the message from the facts; carry data in final fields.
- Wrap lower-level exceptions at layer boundaries, always with the cause.
- Shallow hierarchies with one base per module let callers pick their granularity.
- Prefer JDK exceptions unless callers catch yours specifically or it carries data.

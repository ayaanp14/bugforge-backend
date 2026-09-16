---
title: Records in practice — validation, wither methods and modelling
minutes: 12
---
Knowing what a record generates is the easy half. The practical half is the handful of patterns that come up every time you use them: validating and normalising in the compact constructor, producing modified copies, nesting records into larger models, using them as map keys and in streams, and recognising the situations where a record is the wrong tool. This lesson is those patterns, with the idioms that experienced Java code uses.

## Validate and normalise in the compact constructor

```java
public record Email(String address) {
    public Email {
        Objects.requireNonNull(address, "address");
        address = address.strip().toLowerCase(Locale.ROOT);          // normalise the parameter
        if (!address.contains("@")) throw new IllegalArgumentException("not an email: " + address);
    }
}
```

The compact constructor sees the raw parameters, may check and rewrite them, and the rewritten values are what get stored. Every path that creates an `Email` — including deserialisation — passes through it, so an `Email` object is *always* valid and canonical. This is the same "establish the invariant in the constructor" rule as for classes, with less code.

## Wither methods for modified copies

```java
public record Config(String host, int port, boolean tls) {
    public Config withPort(int newPort) { return new Config(host, newPort, tls); }
    public Config withTls(boolean newTls) { return new Config(host, port, newTls); }
}
Config c = base.withPort(8443).withTls(true);
```

Records are immutable, so "change one field" means "construct a new record with one difference". A `withX` method per commonly changed component keeps call sites readable. (Java has discussed `with` syntax for records; until then, write the methods.)

## Nested records model structured data

```java
record Address(String street, String city, String postcode) { }
record Customer(long id, String name, Address address, List<String> tags) {
    public Customer {
        tags = List.copyOf(tags);
    }
}
```

A record of records is a tree of immutable values with structural equality all the way down — comparing two `Customer`s compares their addresses component-wise. This is the natural shape for configuration, API payloads and domain values. Keep collections inside records immutable (`List.copyOf`), and the whole tree is safe to share and cache.

## Records as map keys and set elements

```java
record Cell(int row, int col) { }
Map<Cell, Integer> grid = new HashMap<>();
grid.put(new Cell(2, 3), 7);
grid.get(new Cell(2, 3));            // 7 — a different instance, equal by value
Set<Cell> visited = new HashSet<>();
```

Generated `equals`/`hashCode` and immutability make records ideal keys — the pair-of-ints key that used to require a hand-written class or an encoded `long`. Grid searches, memoisation keyed on `(i, j)`, and composite ids are all one-line records.

## Records in streams

```java
record NameLength(String name, int length) { }
List<NameLength> longest = names.stream()
    .map(n -> new NameLength(n, n.length()))
    .sorted(Comparator.comparingInt(NameLength::length).reversed())
    .limit(3)
    .toList();
```

Intermediate results that carry two or three values want a record — a local record inside the method if it is used nowhere else. `Map.entry` is the anonymous alternative; a record names the fields.

## Records implementing interfaces

```java
interface Priced { long priceCents(); }
record Book(String title, long priceCents) implements Priced { }      // the accessor satisfies the interface
record Ticket(String event, long priceCents) implements Priced { }
```

An accessor with the right name and type implements an interface method automatically. Combined with sealed interfaces this gives closed variant types; combined with `Comparable` it gives sortable values.

## Local records for clarity

```java
static String busiestHour(List<Event> events) {
    record Count(int hour, long n) { }
    return events.stream()
        .collect(Collectors.groupingBy(Event::hour, Collectors.counting()))
        .entrySet().stream()
        .map(e -> new Count(e.getKey(), e.getValue()))
        .max(Comparator.comparingLong(Count::n))
        .map(c -> c.hour() + ":00")
        .orElse("none");
}
```

A record declared inside a method is implicitly static (it cannot capture locals) and invisible outside — perfect for a shape that exists only to make one pipeline readable.

## When a record is wrong

- **The type has identity**: two users with the same name and email are still different users. Use a class with an id.
- **The state changes**: a shopping cart, a connection, a counter. A record would force `new` on every change and lose identity.
- **You need hidden state**: a cache, a lazily computed field, a listener list. Records forbid extra instance fields.
- **A framework needs a no-arg constructor and setters** (JPA entities, older serialisation). Records are for the data that crosses the boundary, not the managed entity itself.
- **Inheritance from a base class** is required. Records extend `Record` only; use interfaces or composition.

## Records and `null`

Components may be `null` unless you forbid it; `List.copyOf` and `Map.copyOf` reject null elements, and `Objects.requireNonNull` in the compact constructor rejects null components. Decide per component and enforce it in the constructor; the generated `equals`/`hashCode`/`toString` all tolerate nulls.

## Migrating a data class to a record

If a class has only final fields, a constructor assigning them, accessors, and generated `equals`/`hashCode`/`toString`, it is a record waiting to happen: replace the body with the header, keep validation as a compact constructor, and rename `getX()` calls to `x()` (or keep `getX` as extra methods during a transition). Behaviour that belonged to the class stays as record methods.

## Interview angle

- *"How do you enforce invariants in a record?"* Compact constructor: validate, normalise, throw.
- *"How do you 'modify' a record?"* Construct a new one — wither methods.
- *"Are records good `HashMap` keys?"* Yes: immutable with value-based `equals`/`hashCode`.
- *"When would you not use a record?"* Identity, mutability, hidden state, framework constraints, class inheritance.
- *"Can a record be declared inside a method?"* Yes — a local record, implicitly static.

## Key takeaways

- Validate and normalise in the compact constructor; every instance is then canonical.
- Immutable means wither methods (`withX`) for changes and `List.copyOf` for collection components.
- Nest records for structured values; use them as map keys, stream intermediates and interface implementations.
- Local records tidy single-method pipelines.
- Not for entities with identity, mutable state, hidden fields or framework-required setters.

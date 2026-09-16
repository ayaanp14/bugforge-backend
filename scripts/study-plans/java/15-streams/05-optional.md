---
title: Optional — a return type, not a null replacement
minutes: 13
---
`Optional<T>` is a box that holds one value or nothing. It arrived with streams because `findFirst`, `max` and the one-argument `reduce` needed an honest way to say "there may be no answer", and it has since become the standard return type for lookups that can fail. It is **not** a general replacement for `null`, and most of the ugliness in Optional-heavy code comes from using it where a plain value, a plain `null` or an exception was right. This lesson covers the API, the idioms, and the six anti-patterns interviewers watch for.

## Creating one

```java
Optional<String> some = Optional.of("x");            // throws NullPointerException if the argument is null
Optional<String> maybe = Optional.ofNullable(value);  // empty if value is null
Optional<String> none = Optional.empty();
```

`of` says "this is definitely a value"; `ofNullable` is the bridge from a nullable API. Reaching for `ofNullable` everywhere hides bugs — if a value must not be null, let `of` fail early.

## Reading it: the ladder from worst to best

```java
Optional<User> u = repo.findByEmail(email);

if (u.isPresent()) { use(u.get()); }                 // 1. the null check wearing a costume — avoid
u.ifPresent(this::use);                              // 2. do something if present
u.ifPresentOrElse(this::use, this::signUpPrompt);    // 3. Java 9: either branch
User user = u.orElse(User.GUEST);                    // 4. a default value
User user = u.orElseGet(User::guest);                // 5. a default computed only when needed
User user = u.orElseThrow();                         // 6. Java 10: NoSuchElementException if empty
User user = u.orElseThrow(() -> new NotFoundException(email));   // 7. your exception
```

`get()` on an empty Optional throws `NoSuchElementException` — the very failure the type was meant to prevent, so `get()` is effectively deprecated in style guides; use `orElseThrow()`, which says the same thing honestly.

**`orElse` versus `orElseGet`**: `orElse(expensive())` evaluates `expensive()` *every time*, present or not, because arguments are evaluated before the call. `orElseGet(() -> expensive())` runs it only when empty. For a constant, `orElse`; for a method call, `orElseGet`.

## Transforming: `map`, `flatMap`, `filter`, `or`

```java
Optional<String> city = repo.findByEmail(email)
    .map(User::address)              // Optional<Address>, or empty
    .map(Address::city)              // Optional<String>
    .filter(c -> !c.isBlank());      // empty if the predicate fails

Optional<String> zip = repo.findByEmail(email)
    .flatMap(User::maybeAddress)     // maybeAddress returns Optional<Address>: flatMap avoids Optional<Optional<…>>
    .map(Address::zip);

Optional<Config> cfg = local().or(() -> remote());   // Java 9: first non-empty wins
```

`map` when the function returns a plain value; `flatMap` when it returns an `Optional`. This chain is the payoff: five null checks become one readable sentence, and the "empty" travels through automatically.

## Optional and streams

```java
Stream<String> zeroOrOne = opt.stream();                 // Java 9
List<String> present = optionals.stream().flatMap(Optional::stream).toList();  // drop the empties
```

`Optional.stream()` turns a list of Optionals into a stream of the present values in one `flatMap` — cleaner than `filter(Optional::isPresent).map(Optional::get)`.

## The primitive variants

`OptionalInt`, `OptionalLong`, `OptionalDouble` come back from `IntStream.max()`, `average()` and friends. They have `getAsInt()`, `orElse`, `orElseGet`, `orElseThrow`, `ifPresent` — but **no `map` or `filter`**; convert with `boxed()` earlier in the pipeline if you need to chain.

## Where Optional belongs — and where it does not

**Use it** as the return type of a method that may legitimately have no result: `findById`, `max`, `parseOrEmpty`, a cache lookup.

**Do not use it:**

1. **As a field.** It is not `Serializable`, doubles the object count, and the class's own methods know how to handle a missing value. A nullable field with a documented `Optional`-returning getter is the idiom.
2. **As a method parameter.** `void f(Optional<String> name)` forces every caller to wrap; overload or accept `null`/a default instead.
3. **Wrapping a collection.** An empty list already means "nothing"; `Optional<List<T>>` has two ways to be empty.
4. **`isPresent()` + `get()`.** That is the null check with more characters.
5. **`Optional.of(x).orElse(y)` on a value you already have.** `x != null ? x : y` — or `Objects.requireNonNullElse(x, y)`.
6. **Storing `Optional` in a collection or map value.** Use the absence of the key.

Optional is a *return-type* tool. When you find one anywhere else, ask what it is protecting against.

## Optional and `equals`

`Optional.of("a").equals(Optional.of("a"))` is `true` — equality is by content, and two empties are equal. But `Optional` is a value-based class: never synchronise on one and never compare with `==`.

## Interview angle

- *"What problem does Optional solve?"* An honest return type for "maybe no result", so the caller cannot forget the empty case the way they forget `null`.
- *"`orElse` versus `orElseGet`?"* The argument of `orElse` is always evaluated; `orElseGet`'s supplier only when empty.
- *"`map` versus `flatMap` on Optional?"* `flatMap` when the function itself returns an `Optional`.
- *"Should a field be an Optional?"* No — not serialisable, wasteful, and the class controls access anyway; return one from the getter.
- *"What does `get()` do on empty?"* Throws `NoSuchElementException`; prefer `orElseThrow()`.

## Key takeaways

- `of` (never null), `ofNullable` (maybe null), `empty()`.
- Read with `ifPresent`, `orElse`, `orElseGet`, `orElseThrow` — never `isPresent()`+`get()`.
- Chain with `map`/`flatMap`/`filter`/`or`; the empty propagates for you.
- `Optional::stream` in a `flatMap` drops the empties from a collection of Optionals.
- A return type, not a field, parameter, collection wrapper or null substitute.

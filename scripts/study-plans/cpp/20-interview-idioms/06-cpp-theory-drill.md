---
title: The C++ theory drill — thirty questions, thirty answers
minutes: 25
---
Every C++ interview has a theory section, and its questions have barely changed since C++11: the rule of five, how a virtual call works, what `std::move` actually does, when `shared_ptr` is right. This lesson is the drill: thirty questions, each with the answer an interviewer wants to hear — the definition first, the one consequence that matters, then a stop so the follow-up can come — and a pointer to the module that teaches it in depth. Read it twice a week before interviews. A C++ answer is expected to name a mechanism: not "moves are faster" but "a move steals the pointer and leaves the source empty".

## The language and the toolchain

1. **What happens between a `.cpp` file and a running program?** The preprocessor expands `#include` and macros into a translation unit; the compiler turns each unit into an object file, checking every use against a declaration; the linker joins the object files and libraries, resolving each name to exactly one definition. A compile error lives inside one unit; an "undefined reference" is a linker error — declared, never defined. *(Module 1)*

2. **What is undefined behaviour, and how does it differ from implementation-defined and unspecified?** A construct the standard places no requirements on — signed overflow, an out-of-range index, a dangling dereference, a data race — so the compiler may assume it never happens and optimise on that assumption, which is why `if (x + 1 < x)` can be deleted. Implementation-defined behaviour is documented by the compiler (`sizeof(int)`); unspecified behaviour is one of several allowed outcomes (the order function arguments are evaluated). *(1, 19)*

3. **`const` versus `constexpr`?** `const` promises the value will not change after initialisation, which may happen at run time — `const int n = read();` is legal. `constexpr` promises the value is computable at compile time, so it may be used where a constant expression is required: an array bound, a template argument, a `static_assert`. A `constexpr` function still runs at run time on run-time arguments. *(2, 16)*

4. **What does `auto` deduce?** The type of the initialiser with references and top-level `const` stripped, by the rules of template argument deduction: `auto x = ref;` is a copy, `auto& x` keeps the reference, `const auto&` binds to anything without copying. The traps are `auto total = 0;` — an `int` — and `for (auto s : names)`, which copies every string. *(2)*

5. **References versus pointers?** A reference is an alias that must be bound at initialisation, cannot be reseated and cannot be null; a pointer is a value that can be null, reassigned and used in arithmetic. A reference for a parameter that must refer to an object, a pointer for "may be absent" or "may change what it points to", a smart pointer for ownership. Both can dangle. *(6)*

6. **By value, by reference or by `const` reference?** By value for anything register-sized or that the function needs its own copy of anyway; by `const T&` for anything larger that is only read; by `T&` for an in-out parameter, which should be rare because returning a value is clearer and elided. `std::string_view` and `std::span` are the modern spellings of "read-only, any source". *(4)*

7. **What is `std::string_view`, and what is its hazard?** A non-owning pointer-plus-length over characters it does not own: cheap to copy, O(1) `substr`, the right parameter type for read-only text. It dangles the moment the string it views dies — `std::string_view sv = s + "x";` views a temporary destroyed at the semicolon — so it is a parameter or a local, never a member that outlives its source. *(5)*

8. **What does a lambda capture, and what can go wrong?** `[=]` copies each variable it uses into the closure; `[&]` stores references. A `[&]` lambda that outlives its scope — returned, stored, handed to a thread — refers to dead locals; capture by value, or `[x = std::move(x)]`, when the lambda escapes. Capturing `this` is a pointer by another name. *(4, 14)*

## Objects and ownership

9. **What is RAII?** Resource Acquisition Is Initialisation: a resource's lifetime is tied to an object's lifetime — acquired in the constructor, released in the destructor, which runs on every exit from the scope, including exceptions and early returns. It is why C++ needs no `finally`: `std::vector`, `std::unique_ptr`, `std::lock_guard` and `std::ofstream` are all RAII, and a raw owning pointer with no destructor is the bug. *(7)*

10. **The rule of three, five and zero?** If you write any of the destructor, copy constructor or copy assignment, you almost certainly need all three, because the memberwise defaults copy a pointer and free it twice. Five adds the move constructor and move assignment: a user-declared destructor or copy suppresses the implicit moves, so an owning class without them copies where it could move. Zero is the alternative — let `std::vector`, `std::string` and `std::unique_ptr` members own the resources and write none. *(9)*

11. **What does `std::move` do?** Nothing at run time. It is a cast to an rvalue reference that lets overload resolution pick the move constructor or move assignment; the move happens there, and the source is left valid but unspecified — fit for assignment and destruction, not for anything that assumes its contents. `std::move` on a `const` object silently selects the copy. *(9)*

12. **Why return by value?** Because the copy is elided: since C++17 returning a prvalue constructs the result directly in the caller, and a named local is elided by NRVO or, failing that, moved. `return std::move(local);` switches the elision off and is a pessimisation. Passing an output reference costs clarity and gains nothing. *(9)*

13. **`std::unique_ptr` versus `std::shared_ptr`?** Exclusive ownership, one pointer wide, move-only, freed in the destructor: the default. Shared ownership through a reference-counted control block, copyable, an atomic increment per copy, freed when the last owner goes: for lifetimes that are genuinely shared, which is rarer than it looks. `std::make_shared` puts object and control block in one allocation. *(7)*

14. **Why can `shared_ptr` leak, and what is `weak_ptr`?** Two objects holding `shared_ptr`s to each other never reach a count of zero, so neither is freed. A `std::weak_ptr` observes without owning: it does not count, and `lock()` yields a `shared_ptr` if the object is still alive or an empty one if not. The back edge of a parent–child relationship is its textbook place. *(7)*

15. **Why does modern C++ almost never write `new`?** Because every `new` is a `delete` someone must write on every path, including the exceptional ones; forgetting one is a leak and writing two is a double free. `std::make_unique` and the containers put the `delete` in a destructor once, and a raw pointer then means "borrowed, not owned". *(7)*

16. **Name three ways to dangle.** Return a reference to a local; keep a reference or pointer into a `std::vector` across a `push_back` that reallocates; take a `std::string_view` or `c_str()` from a temporary `std::string`. A fourth is a `[&]` lambda that escapes its scope. All are undefined behaviour, and all may "work" until the memory is reused. *(6, 7, 13)*

## Polymorphism and templates

17. **How does virtual dispatch work?** A class with virtual functions carries a hidden pointer to a table of function pointers, one table per class; a call through a base pointer or reference loads the vptr, indexes the table and calls indirectly — one extra load, an indirect branch, and a pointer added to the object. The call is resolved by the dynamic type, which is why a `Dog` behind an `Animal&` barks. *(10)*

18. **Why must a base class destructor be virtual?** `delete basePtr;` on a base without a virtual destructor runs only the base destructor: the derived part is never destroyed, and the behaviour is undefined. Any class meant to be deleted through a base pointer declares `virtual ~Base() = default;` — a `std::vector<std::unique_ptr<Shape>>` needs it too. *(10)*

19. **What is object slicing?** Copying a derived object into a base *value* — `Base b = derived;`, a by-value parameter, a `std::vector<Base>` — keeps only the base part; the derived members and the dynamic type are gone, and virtual calls on the copy run the base versions. Pass and store by reference, pointer or `std::unique_ptr<Base>`. *(10)*

20. **Overloading, overriding and hiding?** Overloading is several functions with one name and different parameters, chosen at compile time by the static types of the arguments. Overriding is a derived class replacing a base virtual function with the same signature, chosen at run time by the dynamic type; `override` makes the compiler check it. Hiding is a derived class declaring a non-virtual function with the same name: chosen by the static type, so `Animal* a` calls the base version whatever the object is. *(4, 10)*

21. **Templates versus inheritance for polymorphism?** Templates give static polymorphism: resolved at compile time, inlinable, no vtable, one instantiation per type, errors at instantiation — `std::sort` with a comparator. Virtual functions give dynamic polymorphism: one compiled function, mixed types in one container through a base pointer, an indirect call per invocation — `std::vector<std::unique_ptr<Shape>>`. Concepts give the template style a stated interface and readable errors. *(12)*

22. **The four casts?** `static_cast` for conversions the language already knows (numeric, up the hierarchy, `void*` back to its type); `dynamic_cast` for a checked downcast on a polymorphic base, returning `nullptr` on a pointer and throwing `std::bad_cast` on a reference; `const_cast` to remove `const`, a smell; `reinterpret_cast` to reinterpret bits, for serialisation and little else. A C-style cast tries all of them, which is why it is avoided. *(2, 10)*

## The standard library

23. **`std::map` versus `std::unordered_map`?** A balanced tree: O(log n) everything, iteration in key order, `lower_bound`, needs only `<`. A hash table: O(1) average and O(n) worst, unspecified iteration order, needs a hash and `==`. The tree when order or range queries matter, the hash for pure lookup — and in both, `operator[]` inserts a default on a miss. *(13)*

24. **Why is `push_back` amortised O(1), and what does it invalidate?** When size reaches capacity the vector allocates a larger block — roughly double — and moves the elements across, so over n pushes the moves total less than 2n. That reallocation invalidates every iterator, pointer and reference into the old block, which is why `int& first = v[0]; v.push_back(x);` dangles and why `reserve` up front is faster and safer. *(13)*

25. **How do you erase while iterating?** `erase` returns the iterator after the removed element, so the loop is `for (auto it = c.begin(); it != c.end(); ) { if (…) it = c.erase(it); else ++it; }` — never `++it` on the iterator you erased. For a vector, `std::erase_if(v, pred)` or the erase–remove idiom does it in one pass. *(13)*

26. **`std::vector` versus `std::list`?** Contiguous storage: O(1) index, cache-friendly traversal, amortised O(1) append, O(n) insert in the middle, invalidation on reallocation. A doubly linked list: O(1) insert and erase at a known position and iterators that stay valid, but every element is an allocation and a cache miss, so `vector` wins almost everywhere. `list` earns its place for `splice` — the O(1) node move an LRU cache needs. *(13, 19)*

27. **What is a strict weak ordering, and why does `std::sort` need it?** A comparator that is irreflexive (`comp(a, a)` is false), asymmetric, transitive, and whose "neither is less" relation is also transitive. `std::sort`, `std::set` and `std::map` assume it; `<=` in the comparator, or `a.x < b.x || a.y < b.y`, breaks it, and the result is undefined behaviour — a crash or an infinite loop, not merely a wrong order. `std::tie` is correct by construction. *(14)*

## Errors and concurrency

28. **Exceptions versus error codes?** Exceptions separate the error path from the happy path, cannot be ignored, and unwind the stack running destructors — the tool for a failure the immediate caller cannot handle. Return values (`bool`, `std::optional`, `std::error_code`, C++23's `std::expected`) keep the failure local and visible in the signature — the tool for an expected outcome such as "key not found". Throw at the boundary, return values inside, never use exceptions for control flow. *(15)*

29. **What does `noexcept` mean, and why does `std::vector` care?** A promise that the function does not throw; if it does, `std::terminate` runs. Move constructors and destructors should be `noexcept`: `std::vector` moves its elements during reallocation only when the move cannot throw and copies otherwise, because a throwing move half-way through would leave both buffers partly moved. The three guarantees — no-throw, strong (all or nothing), basic (valid but unspecified) — are what you promise per function. *(15)*

30. **What is a data race, and how do you prevent it?** Two threads accessing the same memory location without synchronisation, at least one writing: undefined behaviour, not "sometimes the wrong number". Prevent it with a `std::mutex` held through a `std::lock_guard` or `std::scoped_lock` around every access, or `std::atomic` for a single counter or flag. Deadlock is two threads each holding a lock the other wants; avoid it with one lock, a fixed lock order, or `std::scoped_lock` taking both at once. *(17)*

## The follow-ups they actually ask

- After 2: *"So is `int` being 32 bits undefined?"* — no, implementation-defined; and `1 << 31` on it wraps since C++20 but was undefined before.
- After 10: *"Show me the rule-of-five class with a `std::vector` member."* — there is none: that is the rule of zero.
- After 11: *"What does `a` hold after `auto b = std::move(a);`?"* — for a `std::string` on libstdc++, nothing; the standard says only valid-but-unspecified, so never depend on it.
- After 17: *"Is a virtual call inside a constructor virtual?"* — it dispatches to the class being constructed, because the derived part does not exist yet.
- After 20: *"What is printed?"* — `describe(const Animal&)` and `describe(const Dog&)` called with an `Animal&` to a `Dog`: the `Animal` overload (static type), while `a.speak()` is the `Dog` override (dynamic type).
- After 23: *"What if every key hashes to the same bucket?"* — one chain, O(n) per operation; rehashing fixes a high load factor, not a bad hash.
- After 30: *"Is `std::atomic<int> n; n++` enough for a counter?"* — yes; `n = n + 1` is not.

## How to answer theory questions

Lead with the one-sentence definition, add the consequence that matters, stop. Name the mechanism, not the adjective: "an indirect call through the vtable" beats "it is slower"; "the pointer is copied and the source nulled" beats "it is moved". Cite the standard version when you know it — "`std::erase_if`, C++20". Never guess a fact you are unsure of; "I believe it is X, but I would check cppreference" is a fine answer and a confident wrong one is not. When you do not know, connect it to what you do: "I have not used `std::pmr`, but allocators are a template parameter, so I would expect it to swap the allocation strategy."

## Key takeaways

- Thirty questions cover almost every C++ theory round; know the definition-plus-consequence answer to each and which module explains it.
- The mechanisms interviewers listen for: RAII, the rule of five and zero, `std::move` as a cast, the vtable, reallocation invalidating references, a data race as undefined behaviour.
- Expect the follow-up: the overload-versus-override snippet, the moved-from string, the single-bucket hash, the constructor's virtual call.
- Name the mechanism and the standard version; never bluff; connect the unknown to the known.

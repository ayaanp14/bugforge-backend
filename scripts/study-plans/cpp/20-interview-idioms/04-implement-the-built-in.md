---
title: Implement the built-in — a vector, a unique_ptr, a hash map and a string by hand
minutes: 15
---
"Implement `std::vector`" is the question every senior C++ interview asks in some form, because forty lines show whether you understand ownership, can write the rule of five from memory and know why growth doubles. The interviewer is listening for four sentences — *it owns a heap buffer and frees it in the destructor*; *a copy allocates, a move steals the pointer and empties the source*; *a full push doubles, so `push_back` is amortised O(1)*; *reallocation invalidates every reference into the old buffer*. This lesson builds the four types they ask for: a `Vec<T>`, a `UniquePtr<T>`, a chaining hash map and, in outline, a `String` with the small-string optimisation. Module 9, Copies, moves and the rule of five, wrote the owning buffer; the new skill is producing it under a clock, narrating.

## `Vec<T>`: three members and the growth rule

```cpp
template <typename T>
class Vec {
    T* data_ = nullptr;
    size_t size_ = 0;
    size_t cap_ = 0;

    void grow() {
        const size_t next = cap_ == 0 ? 1 : cap_ * 2;
        T* fresh = new T[next];
        for (size_t i = 0; i < size_; ++i) fresh[i] = std::move(data_[i]);
        delete[] data_;
        data_ = fresh;
        cap_ = next;
    }

public:
    void push_back(T v) {                   // by value: see below
        if (size_ == cap_) grow();
        data_[size_++] = std::move(v);
    }
    T& operator[](size_t i) { return data_[i]; }
    const T& operator[](size_t i) const { return data_[i]; }
    size_t size() const { return size_; }
};
```

The handle is three words, like `std::vector`'s. `grow` allocates the new buffer, moves the live elements across, frees the old one and only then updates the members, so a throwing allocation leaves the object as it was. Doubling is what makes `push_back` cheap: over `n` pushes the moves total 1 + 2 + 4 + … < 2n, a constant per push on average, where growing by a fixed amount would sum to O(n²). Name the simplification aloud: `new T[next]` default-constructs every slot; the real container allocates raw storage and constructs each element on push.

`push_back` takes its parameter by value for a reason: `v.push_back(v[0])` on a full vector must work, as it does for `std::vector`. With `const T& v` the reference points into the old buffer, `grow()` frees it, and the assignment reads freed memory; by value, the copy is made at the call, before anything is reallocated.

## The rule of five, written out

```cpp
    ~Vec() { delete[] data_; }
    Vec(const Vec& o) : data_(o.size_ ? new T[o.size_] : nullptr), size_(o.size_), cap_(o.size_) {
        std::copy(o.data_, o.data_ + o.size_, data_);
    }
    Vec(Vec&& o) noexcept : data_(o.data_), size_(o.size_), cap_(o.cap_) {
        o.data_ = nullptr;
        o.size_ = o.cap_ = 0;
    }
    Vec& operator=(const Vec& o) { Vec tmp(o); swap(tmp); return *this; }
    Vec& operator=(Vec&& o) noexcept {
        if (this != &o) {
            delete[] data_;
            data_ = o.data_; size_ = o.size_; cap_ = o.cap_;
            o.data_ = nullptr; o.size_ = o.cap_ = 0;
        }
        return *this;
    }
    void swap(Vec& o) noexcept;             // std::swap the three members
```

Each of the five has one job. The copy constructor allocates exactly `size` elements — a copy has no reason to inherit the source's slack. The move constructor steals the three members and zeroes the source, so the source's destructor deletes `nullptr`; it is `noexcept` because `std::vector<Vec>` moves its elements on reallocation only when the move constructor promises not to throw (Module 9 lesson 3). Copy assignment is copy-and-swap: build the copy first, then exchange, so a failed allocation leaves `*this` untouched (the strong guarantee) and `a = a` swaps harmlessly. Move assignment cannot use that trick without an allocation, so it guards `this != &o` — without the guard, `a = std::move(a)` frees the buffer and then adopts the freed pointer.

Declare any one of these and the compiler stops generating the moves; write none and the defaults copy the pointer, so two `Vec`s free one buffer — or apply the rule of zero: a `std::unique_ptr<T[]>` member owns the buffer and only the two copy operations need writing.

## `UniquePtr<T>`

```cpp
template <typename T>
class UniquePtr {
    T* p_ = nullptr;

public:
    explicit UniquePtr(T* p = nullptr) : p_(p) {}
    ~UniquePtr() { delete p_; }
    UniquePtr(const UniquePtr&) = delete;
    UniquePtr& operator=(const UniquePtr&) = delete;
    UniquePtr(UniquePtr&& o) noexcept : p_(o.release()) {}
    UniquePtr& operator=(UniquePtr&& o) noexcept { reset(o.release()); return *this; }
    T* release() { T* p = p_; p_ = nullptr; return p; }
    void reset(T* p = nullptr) { T* old = p_; p_ = p; delete old; }
    T& operator*() const { return *p_; }
    explicit operator bool() const { return p_ != nullptr; }
};
```

Every line is an interview answer. Copying is deleted because two owners would delete twice — the mistake becomes a compile error. The moves are written through `release` and `reset`, which makes self-move-assignment safe without a guard: `release` nulls `o` first, then `reset` deletes the old pointer *after* installing the new one. `explicit operator bool` allows `if (p)` but refuses `int n = p;`. The size is one pointer, the same as a raw `T*`, which is what "zero overhead" means.

## A chaining hash map

```cpp
class HashMap {
    std::vector<std::vector<std::pair<std::string, int>>> buckets_;
    size_t size_ = 0;

    size_t bucketOf(const std::string& key) const {
        size_t h = 0;
        for (unsigned char c : key) h = (h * 31 + c) % buckets_.size();
        return h;
    }

public:
    explicit HashMap(size_t buckets) : buckets_(buckets) {}
    void put(const std::string& key, int value) {
        auto& chain = buckets_[bucketOf(key)];
        for (auto& [k, v] : chain) if (k == key) { v = value; return; }
        chain.emplace_back(key, value);
        ++size_;
    }
};
```

A hash map is a vector of buckets plus a function from key to bucket index; with chaining, each bucket is a small vector of pairs and a collision appends. `put` walks the chain first so an existing key is overwritten in place; `get` walks it the same way and returns `std::optional<int>` rather than a sentinel; `erase` finds the pair, calls `chain.erase(it)` and returns at once, so the invalidated iterator is never incremented. Reducing modulo `B` at every step keeps the intermediate below 31 × 63 + 255, and `unsigned char` stops a high-bit `char` going negative. The cost is O(1 + n/B) on average — the load factor — and O(n) when everything collides, which is why `std::unordered_map` rehashes past a load factor of 1.0; the follow-up "how would you add rehashing?" is answered with `2B` buckets and a re-`put` of every pair, amortised like the vector's growth.

## `String` with SSO, in outline

```cpp
class String {
    char* ptr_;                                      // points at local_ or at the heap
    size_t size_ = 0;
    union { char local_[16]; size_t heapCap_; };     // 15 characters + '\0' inline
    bool isLocal() const { return ptr_ == local_; }
};
```

That is libstdc++'s real layout, and why `sizeof(std::string)` is 32 on this platform. A string of at most fifteen characters lives inside the object, in the bytes that would otherwise hold the heap capacity; a longer one allocates and `ptr_` points at the heap. Every member function first asks which mode is active, and the instructive case is the move: a small string has nothing on the heap to steal, so moving it copies sixteen bytes and empties the source — "moves are free" is not quite true for strings. You will not be asked to write it; you may be asked why short strings never allocate.

## Pitfalls

- A copy constructor that copies `cap_` allocates slack the copy never uses; a move constructor that forgets to zero the source double-frees.
- Move assignment without the `this != &o` guard frees its own buffer on self-move.
- `push_back(const T&)` plus `grow()` dangles on `v.push_back(v[0])`.
- `erase` inside a range-`for` over a chain is undefined behaviour; use the iterator form and return.

## Key takeaways

- `Vec<T>` is three members plus a `grow()` that doubles; 1 + 2 + 4 + … < 2n is why `push_back` is amortised O(1).
- The five: the destructor frees; the copy allocates `size`; the move steals and zeroes, `noexcept`; copy assignment by copy-and-swap; move assignment guards self-assignment.
- `UniquePtr` deletes copying, moves through `release`/`reset`, and is one pointer wide.
- A chaining hash map is buckets of pairs: overwrite in place, append on a miss, `erase` then return; the cost is the load factor.
- SSO keeps fifteen characters inside the object: small strings never allocate, and moving one is a copy.
